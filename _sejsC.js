<script>
/* ============================================================
   SECURITY & PROTECTION (3/7)
   The security register: staff accounts, authentication events,
   sessions, roles, financial authorisations, database and API
   checks, backups, secrets, tests and incidents.
   Everything is derived from the seeded book in part 1 so the
   counters and the tables can never disagree.
   ============================================================ */

/* ---------------- reference lists ---------------- */
const SEC_LANES = ['Access','Identity','Data','Financial','Infrastructure','Application'];
const SEC_STATES = ['Open','Assigned','Investigating','Escalated','Resolved','Closed'];
const SEC_REVIEWERS = ['STF-009','STF-003','STF-004'];

/* ---------------- staff accounts ---------------- */
const ACCOUNTS = STAFF.map((s, i) => {
  const state = i === 6 ? 'Locked' : i === 7 ? 'Suspended' : i === 1 ? 'Inactive' : 'Active';
  return {
    id: s.id, name: s.name, role: s.role, branch: s.branch, email:
      s.name.toLowerCase().replace(/[^a-z]+/g, '.') + '@goldenfinancial.mw',
    state,
    mfa: [0, 2, 6, 8].includes(i),
    failed: state === 'Locked' ? 7 : i % 3 === 0 ? 2 : i % 4 === 1 ? 1 : 0,
    lastLogin: addDays(TODAY, -(i % 5)) + ' 0' + (7 + (i % 3)) + ':1' + i,
    lastIp: '41.87.' + (10 + i) + '.' + (20 + i * 3),
    pwAge: 12 + i * 9,
    created: addDays(TODAY, -(400 + i * 40)),
    reviewed: addDays(TODAY, -(6 + i * 4)),
    notes: state === 'Locked' ? 'Locked after repeated failed sign-ins'
      : state === 'Suspended' ? 'Suspended pending a conduct review'
      : state === 'Inactive' ? 'Left in September — access removed' : 'No exceptions',
    history: [{when: addDays(TODAY, -(6 + i * 4)), who: 'Chikondi Mwale',
      what: 'Security review — account confirmed ' + state.toLowerCase()}]
  };
});
const ACCT_BY_ID = Object.fromEntries(ACCOUNTS.map(a => [a.id, a]));

/* ---------------- authentication events ---------------- */
const DEVICES = ['Windows 11 · Chrome 129', 'iPhone 15 · Safari 18', 'Android 14 · Chrome 129',
  'MacBook Air · Safari 18', 'Windows 10 · Edge 128', 'iPad · Safari 18'];
const PLACES = ['Lilongwe, MW', 'Lilongwe, MW', 'Blantyre, MW', 'Mzuzu, MW', 'Zomba, MW',
  'Lilongwe, MW', 'Johannesburg, ZA', 'Lusaka, ZM'];
const LOGINS = [];
for(let i = 0; i < 96; i++){
  const acct = ACCOUNTS[i % ACCOUNTS.length];
  const staff = i % 7 !== 3;
  const ok = i % 6 !== 0 && i % 11 !== 5;
  LOGINS.push({
    id: 'LOG-' + pad(5200 + i, 4),
    when: addDays(TODAY, -(i % 21)) + ' ' + pad(7 + (i % 12), 2) + ':' + pad((i * 7) % 60, 2),
    who: staff ? acct.name : custName(CUSTOMERS[i % CUSTOMERS.length].id),
    kind: staff ? 'Staff' : 'Customer',
    ip: '41.87.' + (10 + (i % 40)) + '.' + (20 + (i * 3) % 200),
    device: DEVICES[i % DEVICES.length],
    place: PLACES[i % PLACES.length],
    mfa: acct.mfa ? (ok ? 'Verified' : 'Failed') : 'Not enrolled',
    result: ok ? 'Success' : (i % 12 === 6 ? 'Blocked' : 'Failed'),
    reason: ok ? 'Password accepted'
      : i % 12 === 6 ? 'Account locked — attempt refused'
      : i % 2 ? 'Wrong password' : 'Unrecognised device'
  });
}
LOGINS.sort((a, b) => a.when < b.when ? 1 : -1);

/* ---------------- sessions ---------------- */
const SESSIONS = ACCOUNTS.filter(a => a.state === 'Active').map((a, i) => ({
  id: 'SES-' + pad(8100 + i * 7, 4), staff: a.id, name: a.name, role: a.role,
  device: DEVICES[(i + 2) % DEVICES.length],
  browser: ['Chrome 129', 'Safari 18', 'Edge 128'][i % 3],
  place: i === 4 ? 'Lusaka, ZM' : PLACES[i % 5],
  ip: '41.87.' + (10 + i * 4) + '.' + (30 + i * 7),
  started: addDays(TODAY, i === 4 ? -1 : 0) + ' 0' + (7 + i % 2) + ':' + pad(10 + i * 5, 2),
  minutes: i === 4 ? 940 : 20 + i * 17,
  lastActivity: i === 4 ? '3 h ago' : (2 + i * 4) + ' min ago',
  trusted: i !== 4,
  risky: i === 4 || i === 2
}));
const SESSION_RULES = [
  {rule: 'Idle timeout', value: '30 minutes', note: 'Sign-out after 30 minutes without activity'},
  {rule: 'Absolute session life', value: '8 hours', note: 'Re-authentication after eight hours'},
  {rule: 'Concurrent sessions', value: '2 devices', note: 'The third sign-in ends the oldest session'},
  {rule: 'Trusted device window', value: '14 days', note: 'New devices need verification'},
  {rule: 'Refresh token rotation', value: 'Every use', note: 'A reused token ends the session'}
];
const REVOCATIONS = [
  {when: addDays(TODAY, -1) + ' 15:40', staff: 'STF-007', by: 'Chikondi Mwale', scope: '1 session', why: 'Suspicious sign-in from Lusaka'},
  {when: addDays(TODAY, -3) + ' 09:05', staff: 'STF-006', by: 'Chikondi Mwale', scope: 'All sessions', why: 'Account suspended'},
  {when: addDays(TODAY, -6) + ' 18:22', staff: 'STF-005', by: 'Tadala Msonthi', scope: '1 session', why: 'Officer left the branch'},
  {when: addDays(TODAY, -9) + ' 07:58', staff: 'STF-002', by: 'System', scope: 'All sessions', why: 'Absolute session life reached'},
  {when: addDays(TODAY, -14) + ' 13:10', staff: 'STF-008', by: 'Chikondi Mwale', scope: 'All sessions', why: 'Account deactivated'}
];

/* ---------------- roles and permissions ---------------- */
const CAPS = ['View customer records', 'Approve loans', 'Release disbursements', 'Record repayments',
  'Reverse payments', 'Export reports', 'Change settings', 'Manage staff accounts',
  'View audit logs', 'Manage permissions'];
const ROLES = ['Super Admin', 'Administrator', 'Head of Credit', 'Credit Analyst', 'Loan Officer',
  'Cashier', 'Collections Officer', 'Customer Care', 'Auditor'];
const ROLE_STAFF = { 'Super Admin': 0, 'Administrator': 1, 'Head of Credit': 1, 'Credit Analyst': 1,
  'Loan Officer': 2, 'Cashier': 1, 'Collections Officer': 2, 'Customer Care': 1, 'Auditor': 0 };
const PERMS = {
  'Super Admin':       ['Full','Full','Full','Full','Full','Full','Full','Full','Full','Full'],
  'Administrator':     ['Full','None','None','None','None','Full','Full','Full','Full','None'],
  'Head of Credit':    ['Full','Own','Own','Own','None','Full','None','None','Full','None'],
  'Credit Analyst':    ['Full','None','None','Own','None','Full','None','None','None','None'],
  'Loan Officer':      ['Own','None','None','Own','None','None','None','None','None','None'],
  'Cashier':           ['None','None','Own','Full','Own','None','None','None','None','None'],
  'Collections Officer':['Own','None','None','Full','None','None','None','None','None','None'],
  'Customer Care':     ['Full','None','None','None','None','None','None','None','None','None'],
  'Auditor':           ['None','None','None','None','None','Full','None','None','Full','None']
};
const PRIV_CHANGES = [
  {when: addDays(TODAY, -3), staff: 'STF-009', what: 'Super admin role confirmed', by: 'Tadala Msonthi', approved: true},
  {when: addDays(TODAY, -11), staff: 'STF-008', what: 'Administrator granted export permission', by: 'Chikondi Mwale', approved: true},
  {when: addDays(TODAY, -18), staff: 'STF-007', what: 'Cashier granted reverse-payment permission', by: 'Chikondi Mwale', approved: false},
  {when: addDays(TODAY, -26), staff: 'STF-004', what: 'Credit analyst granted approver role', by: 'Tadala Msonthi', approved: true},
  {when: addDays(TODAY, -33), staff: 'STF-002', what: 'Loan officer access removed after suspension', by: 'Chikondi Mwale', approved: true},
  {when: addDays(TODAY, -41), staff: 'STF-006', what: 'Collections officer granted export permission', by: 'Chikondi Mwale', approved: false}
];

/* ---------------- customer data protection ---------------- */
const DATA_ACCESS = [];
for(let i = 0; i < 30; i++){
  const acct = ACCOUNTS[i % ACCOUNTS.length];
  const cust = CUSTOMERS[(i * 7) % CUSTOMERS.length];
  DATA_ACCESS.push({
    when: addDays(TODAY, -(i % 14)) + ' ' + pad(8 + (i % 9), 2) + ':' + pad((i * 11) % 60, 2),
    staff: acct.id, who: acct.name, record: ['Identity documents','Loan statement','Repayment history',
      'Contact details','Application file'][i % 5],
    cust: cust.id, custName: cust.name,
    purpose: ['Credit assessment','Collections follow-up','Audit sample','Customer request','KYC review'][i % 4],
    allowed: i % 13 !== 7
  });
}
const FIELD_CONTROLS = [
  {fieldName: 'National ID number', control: 'Masked except the last four digits', viewer: 'Credit and compliance only', status: 'Enforced'},
  {fieldName: 'Phone numbers', control: 'Masked in lists and exports', viewer: 'Collections and customer care', status: 'Enforced'},
  {fieldName: 'Document images', control: 'Secure viewer — no download', viewer: 'Compliance, credit', status: 'Enforced'},
  {fieldName: 'Declared income', control: 'Hidden from non-credit roles', viewer: 'Credit only', status: 'Enforced'},
  {fieldName: 'Next of kin', control: 'Masked in exports', viewer: 'Compliance only', status: 'Enforced'},
  {fieldName: 'Guarantor contacts', control: 'Visible with consent on file', viewer: 'Credit and collections', status: 'Advisory'}
];
const EXPORT_CONTROLS = [
  {what: 'Customer list export', rule: 'Blocked for customer care', test: 'Denied for 3 roles', status: 'Pass'},
  {what: 'Loan statement export', rule: 'Masked identifiers', test: 'Mask applied', status: 'Pass'},
  {what: 'Bulk document download', rule: 'Disabled — single file only', test: 'Bulk request refused', status: 'Pass'},
  {what: 'Repayment history export', rule: 'Logged with a reason', test: 'Reason captured', status: 'Pass'},
  {what: 'Settings export', rule: 'Administrators only', test: 'Role checked', status: 'Pass'},
  {what: 'Any export over 1,000 rows', rule: 'Second approver required', test: 'Not enforced', status: 'Gap'}
];
const CONSENT = [];
for(let i = 0; i < 24; i++){
  CONSENT.push({
    id: 'CON-' + pad(4100 + i, 4),
    cust: CUSTOMERS[(i * 3) % CUSTOMERS.length].id,
    purpose: ['Credit bureau check','Marketing messages','Data sharing with a guarantor','Identity verification'][i % 4],
    channel: ['Signed form','Mobile app','Branch declaration','SMS reply'][i % 4],
    given: addDays(TODAY, -(10 + i * 6)),
    status: i % 9 === 5 ? 'Withdrawn' : 'Active'
  });
}
const DATA_REQS = [
  {id: 'DPR-1201', kind: 'Correction', cust: 'CUS-0007', detail: 'Surname misspelt on the national ID', raised: addDays(TODAY, -3), owner: 'STF-009', status: 'In progress'},
  {id: 'DPR-1202', kind: 'Correction', cust: 'CUS-0033', detail: 'Phone number changed — update across records', raised: addDays(TODAY, -8), owner: 'STF-008', status: 'Open'},
  {id: 'DPR-1203', kind: 'Export', cust: 'CUS-0019', detail: 'Copy of the repayment history requested', raised: addDays(TODAY, -11), owner: 'STF-009', status: 'Completed'},
  {id: 'DPR-1204', kind: 'Export', cust: 'CUS-0042', detail: 'Loan statement for a court matter', raised: addDays(TODAY, -16), owner: 'STF-003', status: 'In progress'},
  {id: 'DPR-1205', kind: 'Closure', cust: 'CUS-0026', detail: 'Account closure with data deletion', raised: addDays(TODAY, -22), owner: 'STF-009', status: 'Open'},
  {id: 'DPR-1206', kind: 'Closure', cust: 'CUS-0051', detail: 'Closure requested after settlement', raised: addDays(TODAY, -30), owner: 'STF-003', status: 'Completed'}
];
const CLOSURE_STEPS = [
  {step: 'Request received and logged', owner: 'Customer care', sla: 'Day 0', note: 'Reference issued to the customer'},
  {step: 'Identity re-verified', owner: 'Customer care', sla: 'Day 1', note: 'Document check against the file'},
  {step: 'Balances confirmed at zero', owner: 'Finance', sla: 'Day 2', note: 'No open facility or arrears'},
  {step: 'Records retained for the statutory period', owner: 'Compliance', sla: 'Day 3', note: '6 years for lending records'},
  {step: 'Marketing consent withdrawn', owner: 'Customer care', sla: 'Day 3', note: 'All channels suppressed'},
  {step: 'Personal data deleted where permitted', owner: 'Compliance', sla: 'Day 30', note: 'Soft delete, then purge'}
];

/* ---------------- financial transaction security ---------------- */
const AUTHORITY_LIMIT = {'Loan Officer': 2500000, 'Credit Analyst': 1500000, 'Head of Credit': 8000000,
  'Collections Officer': 0, 'Cashier': 0, 'Customer Care': 0, 'Administrator': 0};
const APPROVALS = LOANS.slice(0, 40).map((l, i) => {
  const role = (STAFF_BY_ID[l.officer] || {}).role || '—';
  const limit = AUTHORITY_LIMIT[role] || 0;
  return {
    ref: l.ref, cust: l.cust, amount: l.amount, officer: l.officer, role, limit,
    within: limit > 0 && l.amount <= limit,
    second: l.amount > 2000000, secondBy: l.amount > 2000000 ? 'STF-003' : '',
    when: l.date,
    status: (limit > 0 && l.amount <= limit && (l.amount <= 2000000 || i % 5 !== 2)) ? 'Compliant' : 'Breach'
  };
});
const DISB_AUTH = DISB.slice(0, 30).map((d, i) => {
  const role = (STAFF_BY_ID[d.officer] || {}).role || '—';
  return {
    ref: d.ref, loan: d.loan, amount: d.amount, when: d.date, method: d.method,
    officer: d.officer, role,
    check: role === 'Cashier' || role === 'Head of Credit' ? 'Authorised' : 'Outside finance',
    approval: d.approved === d.amount ? 'Matches approval' : 'Differs from approval',
    ok: (role === 'Cashier' || role === 'Head of Credit') && d.approved === d.amount
  };
});
const REVERSALS = [
  {id: 'RVS-3301', txn: 'TXN-91023', kind: 'Repayment', amount: 412000, officer: 'STF-005', requested: addDays(TODAY, -4), approver: 'STF-003', status: 'Approved', reason: 'Duplicate mobile money receipt'},
  {id: 'RVS-3302', txn: 'TXN-91041', kind: 'Repayment', amount: 96000, officer: 'STF-006', requested: addDays(TODAY, -6), approver: '', status: 'Pending', reason: 'Customer disputes the receipt'},
  {id: 'RVS-3303', txn: 'TXN-91058', kind: 'Disbursement', amount: 1200000, officer: 'STF-007', requested: addDays(TODAY, -9), approver: '', status: 'Pending', reason: 'Payout released to the wrong number'},
  {id: 'RVS-3304', txn: 'TXN-91066', kind: 'Repayment', amount: 78000, officer: 'STF-005', requested: addDays(TODAY, -12), approver: 'STF-003', status: 'Approved', reason: 'Receipt posted to the wrong facility'},
  {id: 'RVS-3305', txn: 'TXN-91077', kind: 'Adjustment', amount: 250000, officer: 'STF-007', requested: addDays(TODAY, -15), approver: '', status: 'Rejected', reason: 'No supporting voucher attached'},
  {id: 'RVS-3306', txn: 'TXN-91088', kind: 'Repayment', amount: 150000, officer: 'STF-006', requested: addDays(TODAY, -19), approver: 'STF-003', status: 'Approved', reason: 'Reversal of a reversed receipt'}
];
const ADJUSTMENTS = [
  {id: 'ADJ-2201', loan: 'LN-2404', amount: 145000, officer: 'STF-007', reason: 'Fee correction after a mis-keyed charge', asked: addDays(TODAY, -2), approved: false},
  {id: 'ADJ-2202', loan: 'LN-2411', amount: 60000, officer: 'STF-005', reason: 'Late penalty waiver', asked: addDays(TODAY, -5), approved: true},
  {id: 'ADJ-2203', loan: 'LN-2418', amount: 310000, officer: 'STF-007', reason: 'Interest recalculated on a restructure', asked: addDays(TODAY, -8), approved: false},
  {id: 'ADJ-2204', loan: 'LN-2425', amount: 88000, officer: 'STF-002', reason: 'Overpayment carried forward', asked: addDays(TODAY, -13), approved: true},
  {id: 'ADJ-2205', loan: 'LN-2432', amount: 520000, officer: 'STF-007', reason: 'Manual allocation of an unallocated receipt', asked: addDays(TODAY, -17), approved: false},
  {id: 'ADJ-2206', loan: 'LN-2440', amount: 40000, officer: 'STF-005', reason: 'Rounding difference written off', asked: addDays(TODAY, -22), approved: true}
];
const DUPLICATE_TXNS = [];
PAYS.forEach((p, i) => {
  const twin = PAYS.slice(i + 1).find(q => q.loan === p.loan && q.amount === p.amount &&
    Math.abs(daysBetween(p.date, q.date)) <= 3);
  if(twin && !DUPLICATE_TXNS.some(d => d.b === p.receipt))
    DUPLICATE_TXNS.push({a: p.receipt, b: twin.receipt, loan: p.loan, amount: p.amount,
      first: p.date, gap: Math.abs(daysBetween(p.date, twin.date)), cust: p.cust});
});
const REF_CHECKS = TXNS.slice(0, 24).map((t, i) => ({
  txn: t.ref, amount: t.amount, channel: t.method, when: t.date,
  reference: 'REF-' + (700000 + i * 13),
  result: i % 9 === 4 ? 'Mismatch' : i % 13 === 7 ? 'Not found' : 'Verified'
}));
const SOD_CHECKS = [];
LOANS.forEach(l => {
  const receipts = PAYS_BY_LOAN[l.ref] || [];
  const same = receipts.filter(p => p.officer === l.officer);
  if(receipts.length >= 2 && same.length === receipts.length)
    SOD_CHECKS.push({loan: l.ref, officer: l.officer, receipts: receipts.length, amount: l.amount,
      stage: 'Approved, released and collected'});
  else if(receipts.length >= 3 && same.length >= 1)
    SOD_CHECKS.push({loan: l.ref, officer: l.officer, receipts: receipts.length, amount: l.amount,
      stage: 'Approved and collected part of the book'});
});
const FIN_AUDIT = TXNS.slice(0, 30).map((t, i) => ({
  when: t.date, ref: t.ref, kind: t.type, amount: t.amount, actor: staffName(LOANS[i % LOANS.length].officer),
  ip: '41.87.' + (10 + i % 30) + '.' + (20 + i), approval: t.amount > 2000000 ? 'Second approval' : 'Single approval',
  status: t.status
}));

/* ---------------- identity and fraud signals ---------------- */
const DUP_ACCOUNTS = [
  {a:'CUS-0004', b:'CUS-0019', reason:'Same national ID, different name spelling', risk:'High'},
  {a:'CUS-0011', b:'CUS-0037', reason:'Same phone number on two files', risk:'High'},
  {a:'CUS-0023', b:'CUS-0044', reason:'Same employer and bank account', risk:'Medium'},
  {a:'CUS-0031', b:'CUS-0035', reason:'Same next of kin and address', risk:'Medium'},
  {a:'CUS-0009', b:'CUS-0050', reason:'Identical document scan', risk:'High'}
];
const SUSP_APPS = APPS.filter((a, i) => i % 21 === 4).slice(0, 6).map((a, i) => ({
  app: a.id, cust: a.cust, amount: a.amount, product: a.product, when: a.submitted,
  rule: ['Name does not match the national ID','Two applications inside 24 hours',
    'Employer unknown to the register','Same phone as another applicant',
    'Amount just under the approval limit','Guarantor already on three live facilities'][i % 6]
}));
const UNUSUAL_DISB = DISB.filter((d, i) => i % 13 === 5).slice(0, 6).map((d, i) => ({
  ref: d.ref, loan: d.loan, cust: (LOAN_BY_REF[d.loan] || {}).cust, amount: d.amount, when: d.date,
  signal: ['Released outside branch hours','Paid to a changed destination account',
    'Amount differs from the approval','Released by a role without the permission',
    'Two payouts to one facility in a day','Reference reused from an earlier payout'][i % 6]
}));
const INVESTIGATIONS = [
  {id:'INV-S-401', type:'Account access', subject:'STF-007', opened:addDays(TODAY,-4), owner:'STF-009', status:'Investigating'},
  {id:'INV-S-402', type:'Payment reversal', subject:'INC-7301', opened:addDays(TODAY,-7), owner:'STF-003', status:'Open'},
  {id:'INV-S-403', type:'Duplicate identity', subject:'CUS-0004', opened:addDays(TODAY,-9), owner:'STF-004', status:'Investigating'},
  {id:'INV-S-404', type:'Data export', subject:'INC-7302', opened:addDays(TODAY,-13), owner:'STF-009', status:'Resolved'},
  {id:'INV-S-405', type:'API abuse', subject:'/functions/legacy-export', opened:addDays(TODAY,-16), owner:'STF-009', status:'Investigating'},
  {id:'INV-S-406', type:'Secret exposure', subject:'SMTP_PASSWORD', opened:addDays(TODAY,-21), owner:'STF-009', status:'Escalated'},
  {id:'INV-S-407', type:'Suspicious application', subject:'APP-0107', opened:addDays(TODAY,-27), owner:'STF-003', status:'Resolved'},
  {id:'INV-S-408', type:'Unauthorised access attempt', subject:'STF-002', opened:addDays(TODAY,-34), owner:'STF-009', status:'Closed'}
];

/* ---------------- database health ---------------- */
const DB = {
  project:'golden-loan-services', host:'db.goldenloan.supabase.internal', engine:'PostgreSQL 15.8',
  region:'eu-west-1 · Ireland', client:'supabase-js 2.45.4',
  status:'Healthy', latency:'42 ms', pool:'14 of 60 connections', uptime:'99.98% · 30 days',
  rls:'Enforced on every customer table', lastMigration: addDays(TODAY, -6),
  errors24h: 13, slowQueries: 2
};

/* ---------------- database ---------------- */
const DB_TABLES = [
  {table: 'customers', rls: 'Enabled', policy: 'Branch + role scoped', lastAudit: addDays(TODAY, -6)},
  {table: 'loans', rls: 'Enabled', policy: 'Role scoped — credit and compliance', lastAudit: addDays(TODAY, -6)},
  {table: 'repayments', rls: 'Enabled', policy: 'Branch scoped, insert-only for cashiers', lastAudit: addDays(TODAY, -6)},
  {table: 'disbursements', rls: 'Enabled', policy: 'Finance roles only', lastAudit: addDays(TODAY, -6)},
  {table: 'documents', rls: 'Enabled', policy: 'Signed URLs only, 60-second life', lastAudit: addDays(TODAY, -6)},
  {table: 'staff_profiles', rls: 'Enabled', policy: 'Self or administrator', lastAudit: addDays(TODAY, -6)},
  {table: 'audit_log', rls: 'Enabled', policy: 'Read-only for compliance', lastAudit: addDays(TODAY, -6)},
  {table: 'sessions', rls: 'Enabled', policy: 'Self only', lastAudit: addDays(TODAY, -6)},
  {table: 'backups_meta', rls: 'Enabled', policy: 'No client access', lastAudit: addDays(TODAY, -6)},
  {table: 'settings', rls: 'Gap', policy: 'Admin write, any authenticated read', lastAudit: addDays(TODAY, -6)},
  {table: 'notifications', rls: 'Enabled', policy: 'Self or administrator', lastAudit: addDays(TODAY, -6)},
  {table: 'consent_records', rls: 'Enabled', policy: 'Compliance and customer care', lastAudit: addDays(TODAY, -6)}
];
const DB_FUNCS = [
  {name: 'apply_repayment', definer: 'Yes', searchPath: 'Fixed', grant: 'authenticated', risk: 'Low'},
  {name: 'reverse_payment', definer: 'Yes', searchPath: 'Fixed', grant: 'authenticated', risk: 'Low'},
  {name: 'legacy_export_all', definer: 'Yes', searchPath: 'Not set', grant: 'authenticated', risk: 'High'},
  {name: 'next_receipt_no', definer: 'Yes', searchPath: 'Fixed', grant: 'authenticated', risk: 'Low'},
  {name: 'branch_of', definer: 'No', searchPath: 'Fixed', grant: 'authenticated', risk: 'Low'},
  {name: 'admin_stats', definer: 'Yes', searchPath: 'Fixed', grant: 'service_role', risk: 'Low'}
];
const DB_ERRORS = [
  {when: addDays(TODAY, -1), code: '23505', what: 'Duplicate key on receipts.receipt', count: 2, handled: 'Yes'},
  {when: addDays(TODAY, -2), code: '42501', what: 'Permission denied on settings', count: 6, handled: 'No'},
  {when: addDays(TODAY, -4), code: '57014', what: 'Statement timeout on the arrears view', count: 1, handled: 'Yes'},
  {when: addDays(TODAY, -7), code: '28P01', what: 'Password authentication failed', count: 3, handled: 'Yes'},
  {when: addDays(TODAY, -9), code: '42P01', what: 'Relation notifications_archive missing', count: 1, handled: 'Yes'}
];
const DB_CONFIG = [
  {check: 'Connection pooler', value: 'Transaction mode, 60 connections', status: 'Healthy'},
  {check: 'SSL on the database connection', value: 'Required, verify-full', status: 'Healthy'},
  {check: 'Point-in-time recovery', value: 'Enabled, 7-day window', status: 'Healthy'},
  {check: 'Public schema exposure', value: 'No public tables reachable without RLS', status: 'Healthy'},
  {check: 'Service role key in the client', value: 'Not present in any bundle', status: 'Healthy'},
  {check: 'Anon key restrictions', value: 'RLS required on every table', status: 'Review'}
];

/* ---------------- application and API ---------------- */
const APP_CHECKS = [
  {area: 'Input validation', control: 'Zod schema on every write route', evidence: '12 of 12 writes validated', status: 'Pass'},
  {area: 'Server-side authorization', control: 'Role re-checked on the server, never trusted from the client', evidence: 'Verified on 12 routes', status: 'Pass'},
  {area: 'Rate limiting', control: '60 requests/minute per session, 8 logins/minute per IP', evidence: 'Throttling logs prove it', status: 'Pass'},
  {area: 'XSS protection', control: 'All output escaped, no innerHTML from user input', evidence: 'Manual sweep of 27 pages', status: 'Pass'},
  {area: 'CSRF protection', control: 'SameSite=Lax cookies plus an origin check on writes', evidence: 'Applies to 6 state-changing routes', status: 'Pass'},
  {area: 'Secure headers', control: 'CSP, HSTS, X-Frame-Options, nosniff', evidence: 'Checked at the edge', status: 'Pass'},
  {area: 'Error handling', control: 'Stack traces suppressed', evidence: 'One legacy route still leaks', status: 'Gap'},
  {area: 'Dependency hygiene', control: 'Locked versions, audit on every build', evidence: '1 medium advisory open', status: 'Review'},
  {area: 'File upload', control: 'Type and size checked server-side', evidence: 'Documents only', status: 'Pass'},
  {area: 'Secret handling', control: 'Server-only environment variables', evidence: 'One log leak fixed', status: 'Review'}
];
const HTTP_HEADERS = [
  {name: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains', status: 'Set'},
  {name: 'Content-Security-Policy', value: "default-src 'self'; img-src 'self' data:", status: 'Set'},
  {name: 'X-Frame-Options', value: 'DENY', status: 'Set'},
  {name: 'X-Content-Type-Options', value: 'nosniff', status: 'Set'},
  {name: 'Referrer-Policy', value: 'strict-origin-when-cross-origin', status: 'Set'},
  {name: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()', status: 'Set'}
];
const API_ROUTES = [
  {route: '/rest/v1/customers', method: 'GET', auth: 'JWT + RLS', rate: '60/min', validated: 'Yes', status: 'Protected'},
  {route: '/rest/v1/loans', method: 'GET', auth: 'JWT + RLS', rate: '60/min', validated: 'Yes', status: 'Protected'},
  {route: '/rest/v1/repayments', method: 'POST', auth: 'JWT + role check', rate: '30/min', validated: 'Yes', status: 'Protected'},
  {route: '/rest/v1/disbursements', method: 'POST', auth: 'JWT + finance role', rate: '20/min', validated: 'Yes', status: 'Protected'},
  {route: '/functions/approve-loan', method: 'POST', auth: 'JWT + approver role', rate: '20/min', validated: 'Yes', status: 'Protected'},
  {route: '/functions/legacy-export', method: 'POST', auth: 'JWT only', rate: 'Unlimited', validated: 'No', status: 'Vulnerable'},
  {route: '/functions/report-export', method: 'POST', auth: 'JWT + compliance', rate: '10/min', validated: 'Yes', status: 'Protected'},
  {route: '/storage/documents', method: 'GET', auth: 'Signed URL', rate: '60/min', validated: 'Yes', status: 'Protected'},
  {route: '/auth/v1/token', method: 'POST', auth: 'Credentials', rate: '8/min', validated: 'Yes', status: 'Protected'},
  {route: '/rest/v1/audit_log', method: 'GET', auth: 'JWT + compliance', rate: '30/min', validated: 'Yes', status: 'Protected'},
  {route: '/rest/v1/settings', method: 'PATCH', auth: 'JWT + administrator', rate: '10/min', validated: 'Yes', status: 'Protected'},
  {route: '/functions/mobile-money-callback', method: 'POST', auth: 'Signature check', rate: '120/min', validated: 'Signature', status: 'Protected'}
];
const DEPS = [
  {pkg: 'next', version: '14.2.5', latest: '14.2.7', advisory: '—', status: 'Patch available'},
  {pkg: '@supabase/supabase-js', version: '2.45.4', latest: '2.45.4', advisory: '—', status: 'Current'},
  {pkg: 'zod', version: '3.23.8', latest: '3.23.8', advisory: '—', status: 'Current'},
  {pkg: 'axios', version: '1.6.7', latest: '1.7.7', advisory: 'SSRF (moderate)', status: 'Patch available'},
  {pkg: 'dayjs', version: '1.11.11', latest: '1.11.13', advisory: '—', status: 'Patch available'},
  {pkg: 'lucide-react', version: '0.427.0', latest: '0.427.0', advisory: '—', status: 'Current'}
];
const API_ERRORS = [
  {when: addDays(TODAY, -1), route: '/functions/legacy-export', code: '500', count: 2, note: 'Driver message returned to the client'},
  {when: addDays(TODAY, -2), route: '/rest/v1/settings', code: '403', count: 6, note: 'RLS refused a non-administrator'},
  {when: addDays(TODAY, -3), route: '/auth/v1/token', code: '429', count: 9, note: 'Rate limit held the line'},
  {when: addDays(TODAY, -5), route: '/rest/v1/disbursements', code: '401', count: 3, note: 'Expired session'},
  {when: addDays(TODAY, -6), route: '/storage/documents', code: '403', count: 4, note: 'Signed URL expired'}
];
const SECRETS = [
  {name: 'SUPABASE_SERVICE_ROLE_KEY', scope: 'server', storage: 'Hosting environment', rotated: addDays(TODAY, -34), cycle: 90, sealed: true, exposed: false},
  {name: 'SUPABASE_ANON_KEY', scope: 'client', storage: 'Browser bundle (safe by design)', rotated: addDays(TODAY, -120), cycle: 365, sealed: false, exposed: false},
  {name: 'JWT_SECRET', scope: 'server', storage: 'Hosting environment', rotated: addDays(TODAY, -34), cycle: 90, sealed: true, exposed: false},
  {name: 'AIRTEL_MONEY_API_KEY', scope: 'server', storage: 'Secret store', rotated: addDays(TODAY, -72), cycle: 90, sealed: true, exposed: false},
  {name: 'TNM_MPAMBA_KEY', scope: 'server', storage: 'Secret store', rotated: addDays(TODAY, -96), cycle: 90, sealed: true, exposed: false},
  {name: 'SMTP_PASSWORD', scope: 'server', storage: 'Secret store', rotated: addDays(TODAY, -141), cycle: 90, sealed: true, exposed: true},
  {name: 'SENTRY_DSN', scope: 'client', storage: 'Browser bundle (safe by design)', rotated: addDays(TODAY, -200), cycle: 365, sealed: false, exposed: false}
];
const SECRET_ACCESS = [
  {when: addDays(TODAY, -1), who: 'Deployment pipeline', secret: 'SUPABASE_SERVICE_ROLE_KEY', action: 'Read at build', ok: true},
  {when: addDays(TODAY, -2), who: 'Chikondi Mwale', secret: 'JWT_SECRET', action: 'Rotated', ok: true},
  {when: addDays(TODAY, -5), who: 'Backup job', secret: 'SUPABASE_SERVICE_ROLE_KEY', action: 'Read at runtime', ok: true},
  {when: addDays(TODAY, -8), who: 'Chikondi Mwale', secret: 'AIRTEL_MONEY_API_KEY', action: 'Viewed in the console', ok: true},
  {when: addDays(TODAY, -12), who: 'Unidentified', secret: 'SMTP_PASSWORD', action: 'Appeared in an application log', ok: false},
  {when: addDays(TODAY, -15), who: 'Deployment pipeline', secret: 'TNM_MPAMBA_KEY', action: 'Read at build', ok: true},
  {when: addDays(TODAY, -21), who: 'Chikondi Mwale', secret: 'JWT_SECRET', action: 'Viewed in the console', ok: true}
];
const TLS_ROWS = [
  {item: 'HTTPS everywhere', value: 'HTTP redirects to HTTPS', status: 'OK'},
  {item: 'TLS version', value: '1.3 (1.2 fallback)', status: 'OK'},
  {item: 'Certificate', value: 'Issued by the host, auto-renewed', status: 'OK'},
  {item: 'Certificate expiry', value: '63 days remaining', status: 'OK'},
  {item: 'HSTS', value: 'max-age=31536000; includeSubDomains; preload', status: 'OK'},
  {item: 'Mixed content', value: 'None found on 27 pages', status: 'OK'}
];
const HASHING = [
  {item: 'Password hashing', value: 'bcrypt, cost 12', status: 'OK'},
  {item: 'Password storage', value: 'Hashed and salted — never reversible', status: 'OK'},
  {item: 'Session tokens', value: 'Signed JWT, 30-minute expiry with rotation', status: 'OK'},
  {item: 'Reset tokens', value: 'Single use, 30-minute expiry', status: 'OK'},
  {item: 'Document storage', value: 'Private bucket, signed URLs valid for 60 seconds', status: 'OK'},
  {item: 'Backups', value: 'Encrypted at rest (AES-256)', status: 'OK'}
];
const TOKEN_ROWS = [
  {item: 'Access token lifetime', value: '30 minutes', status: 'OK'},
  {item: 'Refresh token rotation', value: 'Every use, reuse revokes the family', status: 'OK'},
  {item: 'Token storage', value: 'HttpOnly, Secure, SameSite=Lax cookie', status: 'OK'},
  {item: 'Log redaction', value: 'Tokens and passwords masked before logging', status: 'OK'},
  {item: 'Secret scan of build output', value: 'Runs on every deploy', status: 'OK'}
];
const SECRET_ROTATION = [
  {item: 'Server keys', cycle: 'Every 90 days', owner: 'Head of technology', note: 'Automated reminder 14 days before'},
  {item: 'Payment rail keys', cycle: 'Every 90 days', owner: 'Finance manager', note: 'Coordinate with the provider window'},
  {item: 'JWT signing secret', cycle: 'Every 90 days', owner: 'Head of technology', note: 'All sessions end at rotation'},
  {item: 'SMTP credentials', cycle: 'Every 180 days', owner: 'Head of technology', note: 'Rotate on any exposure'},
  {item: 'Anon and public keys', cycle: 'Every 12 months', owner: 'Head of technology', note: 'Safe to ship, still rotated'}
];

/* ---------------- backups ---------------- */
const BACKUPS = [];
for(let i = 0; i < 12; i++){
  BACKUPS.push({
    id: 'BKP-' + pad(8200 - i, 4),
    when: addDays(TODAY, -i) + ' 02:15',
    kind: i === 0 ? 'Weekly full' : i % 3 === 0 ? 'Incremental' : 'Nightly full',
    size: (240 + i * 3.4).toFixed(1) + ' MB',
    duration: (3.4 + (i % 5) * 0.6).toFixed(1) + ' min',
    integrity: i === 0 ? 'Pending' : i === 4 ? 'Re-verified' : 'Verified',
    expiry: addDays(TODAY, 35 - i)
  });
}
const BACKUP_SCHEDULE = [
  {job: 'Nightly full', when: '02:15 daily', retention: '35 days', offsite: 'Yes'},
  {job: 'Weekly full', when: 'Sunday 01:00', retention: '12 weeks', offsite: 'Yes'},
  {job: 'Monthly archive', when: '1st of the month 00:30', retention: '24 months', offsite: 'Yes'},
  {job: 'Point-in-time recovery', when: 'Continuous', retention: '7 days', offsite: 'Yes'},
  {job: 'Document bucket snapshot', when: '03:30 daily', retention: '30 days', offsite: 'Yes'}
];
const DR_PLAN = [
  {item: 'Recovery time objective', value: '4 hours'},
  {item: 'Recovery point objective', value: '15 minutes'},
  {item: 'Restore order', value: 'Auth → customers → loans → repayments → documents'},
  {item: 'Last plan review', value: fmtDate(addDays(TODAY, -38))},
  {item: 'Next drill', value: fmtDate(addDays(TODAY, 24))},
  {item: 'Recovery owner', value: 'Chikondi Mwale'}
];
const RECOVERY_TESTS = [
  {id: 'RCT-311', when: addDays(TODAY, -12), scope: 'Full restore into staging', result: 'Pass', took: '38 min', by: 'Chikondi Mwale'},
  {id: 'RCT-310', when: addDays(TODAY, -45), scope: 'Single-table restore (repayments)', result: 'Pass', took: '9 min', by: 'Chikondi Mwale'},
  {id: 'RCT-309', when: addDays(TODAY, -74), scope: 'Point-in-time recovery drill', result: 'Pass with findings', took: '52 min', by: 'Tadala Msonthi'},
  {id: 'RCT-308', when: addDays(TODAY, -112), scope: 'Document bucket restore', result: 'Fail', took: '—', by: 'Chikondi Mwale'}
];
const RESTORE_AUTH = [
  {when: addDays(TODAY, -12), by: 'Chikondi Mwale', approvedBy: 'Tadala Msonthi', action: 'Restore into staging', ok: true},
  {when: addDays(TODAY, -45), by: 'Chikondi Mwale', approvedBy: 'Tadala Msonthi', action: 'Restore one table', ok: true},
  {when: addDays(TODAY, -98), by: 'Fatsani Gondwe', approvedBy: '', action: 'Restore attempted without a second approver', ok: false}
];
const DATA_LOSS = [
  {id: 'DLI-104', when: addDays(TODAY, -98), what: 'Four customer rows lost during a failed migration', size: '4 records', recovered: 'From the nightly backup', status: 'Closed'},
  {id: 'DLI-103', when: addDays(TODAY, -210), what: 'Document uploads missing for 11 files', size: '11 files', recovered: 'Re-uploaded by the branch', status: 'Closed'}
];

/* ---------------- incidents ---------------- */
const INCIDENTS = [];
(function(){
  const seeds = [
    ['Repeated failed sign-ins on a cashier account', 'Access', 'Critical', 'staff', 'STF-007',
      'Seven refused attempts in nine minutes from one device, followed by a successful sign-in from Lusaka.'],
    ['Disbursement released twice for one facility', 'Financial', 'Critical', 'loan', 'LN-2418',
      'Two payouts of the same amount to the same facility inside four minutes. The second was not approved.'],
    ['Export of 620 customer rows', 'Data', 'Critical', 'customer', 'CUS-0019',
      'A bulk export was requested from an account without the compliance role and emailed internally.'],
    ['Settings table readable by any authenticated user', 'Infrastructure', 'High', 'db', 'settings',
      'The row-level policy on settings allows a read for every authenticated user instead of administrators only.'],
    ['Mail password in an application log', 'Infrastructure', 'Critical', 'secret', 'SMTP_PASSWORD',
      'A captured application log contains the SMTP password in clear text.'],
    ['Legacy export route accepts a bare token', 'Application', 'Critical', 'route', '/functions/legacy-export',
      'The route validates the token but never checks the role, and returns driver errors to the caller.'],
    ['New country sign-in for a credit analyst', 'Access', 'High', 'staff', 'STF-004',
      'A successful sign-in from Lusaka on an unrecognised device 40 minutes after a Lilongwe session.'],
    ['Reversal waiting without an approver', 'Financial', 'High', 'txn', 'TXN-91041',
      'A repayment reversal has sat in the queue for six days with no second signature.'],
    ['Duplicate national ID on two files', 'Identity', 'High', 'customer', 'CUS-0004',
      'Two customer files carry the same national ID with different name spellings.'],
    ['Payout to a changed destination account', 'Financial', 'High', 'loan', 'LN-2402',
      'The payout went to an account that was changed the same morning without a callback.'],
    ['Permission granted without a second signature', 'Access', 'Medium', 'staff', 'STF-007',
      'Reverse-payment permission was granted to a cashier and is still pending approval.'],
    ['Rate-limit pressure on the login endpoint', 'Application', 'Medium', 'route', '/auth/v1/token',
      'Nine rate-limit rejections in one hour from a single address.'],
    ['Consent withdrawn during a bureau check', 'Data', 'Medium', 'customer', 'CUS-0021',
      'The customer withdrew bureau consent while a check was already in flight.'],
    ['Database permission denied on settings', 'Infrastructure', 'Low', 'db', 'settings',
      'Six denied writes on settings — expected behaviour, but worth confirming after the policy change.'],
    ['Backup integrity check skipped', 'Infrastructure', 'Low', 'backup', 'BKP-8200',
      'The integrity job did not run for one nightly backup.'],
    ['Failed sign-ins on a suspended account', 'Access', 'Medium', 'staff', 'STF-002',
      'A suspended officer attempted to sign in four times on the day of suspension.'],
    ['API 500 on the legacy export route', 'Application', 'Medium', 'route', '/functions/legacy-export',
      'Two 500s returned a driver message to the caller.'],
    ['Customer data request past its date', 'Data', 'Medium', 'request', 'DPR-1202',
      'A correction request is eight days old against a five-day commitment.']
  ];
  seeds.forEach(([title, lane, severity, kind, subject, detail], i) => {
    INCIDENTS.push({
      id: 'INC-' + pad(7300 + i, 4), title, lane, severity, subjectKind: kind, subjectId: subject, detail,
      status: i % 6 === 5 ? 'Resolved' : i % 5 === 3 ? 'Investigating' : i % 4 === 0 ? 'Open' : 'Assigned',
      owner: ['STF-009', 'STF-003', 'STF-004'][i % 3],
      opened: addDays(TODAY, -(2 + i * 2)),
      due: addDays(TODAY, 3 + (i % 6) * 2),
      notes: i % 4 === 1 ? [{when: addDays(TODAY, -1), who: 'Chikondi Mwale',
        note: 'Pulled the session and audit rows for the window and asked the branch to confirm.'}] : [],
      evidence: i % 5 === 0 ? [{what: 'Audit log extract', by: 'System', when: addDays(TODAY, -1)}] : [],
      actions: i % 4 === 2 ? [{what: 'Close the control gap and re-test', who: 'Chikondi Mwale',
        due: addDays(TODAY, 6), status: 'Open'}] : [],
      history: [{when: addDays(TODAY, -(2 + i * 2)), who: 'Detection rule', what: 'Incident raised automatically'}],
      closedOn: null
    });
  });
})();

/* ---------------- audit log ---------------- */
const LOG_CATS = ['Login', 'Permissions', 'Data access', 'Approvals', 'Disbursement', 'Repayment',
  'Reversal', 'Settings', 'Export', 'Failed access', 'Backup', 'Admin activity'];
const SEC_EVENTS = [];
for(let i = 0; i < 110; i++){
  const acct = ACCOUNTS[(i * 3) % ACCOUNTS.length];
  const cat = LOG_CATS[i % LOG_CATS.length];
  SEC_EVENTS.push({
    id: 'EVT-' + pad(5400 + i, 4),
    when: addDays(TODAY, -Math.floor(i / 8)) + ' ' + pad(6 + (i % 14), 2) + ':' + pad((i * 11) % 60, 2),
    category: cat, who: acct.id, staff: acct.name, role: acct.role,
    ip: '41.87.' + (10 + (i % 30)) + '.' + (20 + (i * 7) % 200),
    target: cat === 'Approvals' ? 'LN-24' + pad(1 + (i % 77), 2)
      : cat === 'Data access' ? CUSTOMERS[(i * 5) % CUSTOMERS.length].id
      : cat === 'Export' ? 'REP-' + (2100 + i)
      : cat === 'Settings' ? 'security.settings'
      : cat === 'Backup' ? 'BKP-' + (8200 - (i % 12))
      : 'TXN-' + (91000 + i),
    detail: ['Session opened from a registered device', 'Role scope re-checked on the server',
      'Purpose recorded with the view', 'Limit checked against the officer authority',
      'Second approver confirmed', 'Receipt posted to the facility',
      'Reversal approved by a second officer', 'Security setting changed',
      'Export written to the download log', 'Request refused by the authorization layer',
      'Encrypted copy written off-site', 'Administrator action recorded'][i % 12],
    outcome: i % 17 === 5 ? 'Denied' : i % 13 === 9 ? 'Failed' : 'Success'
  });
}
SEC_EVENTS.sort((a, b) => a.when < b.when ? 1 : -1);

/* ---------------- compliance, testing, policies ---------------- */
const POLICIES = [
  {name: 'Access control policy', owner: 'STF-009', version: '3.2', reviewed: addDays(TODAY, -38), status: 'Approved'},
  {name: 'Password and authentication policy', owner: 'STF-009', version: '2.6', reviewed: addDays(TODAY, -52), status: 'Approved'},
  {name: 'Customer data protection policy', owner: 'STF-003', version: '2.1', reviewed: addDays(TODAY, -21), status: 'Approved'},
  {name: 'Incident response policy', owner: 'STF-009', version: '1.9', reviewed: addDays(TODAY, -64), status: 'Approved'},
  {name: 'Backup and recovery policy', owner: 'STF-009', version: '1.4', reviewed: addDays(TODAY, -15), status: 'Approved'},
  {name: 'Vendor and secret management policy', owner: 'STF-009', version: '1.1', reviewed: addDays(TODAY, -96), status: 'Review due'},
  {name: 'Acceptable use policy', owner: 'STF-003', version: '1.7', reviewed: addDays(TODAY, -121), status: 'Review due'},
  {name: 'Data retention and deletion policy', owner: 'STF-003', version: '2.0', reviewed: addDays(TODAY, -45), status: 'Approved'}
];
const SEC_RETENTION = [
  {what: 'Authentication logs', keep: '24 months', where: 'audit_log', status: 'Compliant'},
  {what: 'Security incident records', keep: '48 months', where: 'incidents + evidence', status: 'Compliant'},
  {what: 'Customer identity documents', keep: 'Contract + 6 years', where: 'documents bucket', status: 'Compliant'},
  {what: 'Repayment records', keep: '7 years', where: 'repayments', status: 'Compliant'},
  {what: 'Application logs', keep: '12 months', where: 'host log drain', status: 'Compliant'},
  {what: 'Deleted customer records', keep: '30-day soft delete', where: 'customers.deleted_at', status: 'Gap — 46 days'},
  {what: 'Backups', keep: '35 days nightly / 24 months monthly', where: 'encrypted bucket', status: 'Compliant'}
];
const PRIVACY_CONTROLS = [
  {what: 'Lawful basis recorded', how: 'Consent or contract captured per customer', status: 'Yes'},
  {what: 'Purpose limitation', how: 'Every view asks for a purpose', status: 'Yes'},
  {what: 'Data minimisation', how: 'Sensitive fields masked unless needed', status: 'Yes'},
  {what: 'Storage limitation', how: 'Retention rules enforced', status: 'Partial'},
  {what: 'Integrity and confidentiality', how: 'Encryption at rest and in transit', status: 'Yes'},
  {what: 'Accountability', how: 'Access and export logs retained 24 months', status: 'Yes'}
];
const ASSESSMENTS = [
  {id: 'ASS-210', when: addDays(TODAY, -9), name: 'Internal security review', scope: 'Access, database, API', result: 'Satisfactory with 3 findings', by: 'STF-009'},
  {id: 'ASS-209', when: addDays(TODAY, -42), name: 'External penetration test', scope: 'Web application', result: '1 critical, 2 high', by: 'External firm'},
  {id: 'ASS-208', when: addDays(TODAY, -96), name: 'Data protection review', scope: 'Customer data handling', result: 'Satisfactory with 2 findings', by: 'STF-003'},
  {id: 'ASS-207', when: addDays(TODAY, -150), name: 'Backup and recovery audit', scope: 'Restore procedures', result: '1 finding closed', by: 'STF-009'},
  {id: 'ASS-206', when: addDays(TODAY, -210), name: 'Vendor and secret review', scope: 'Third-party credentials', result: 'Satisfactory', by: 'STF-009'}
];
const SEC_FINDINGS = [
  {id: 'SF-301', title: 'Legacy export route still live', area: 'API', rating: 'Critical', owner: 'STF-009', raised: addDays(TODAY, -9), due: addDays(TODAY, 4), status: 'Corrective action', recommendation: 'Retire the route and move exports behind the compliance role.', corrective: 'Route disabled in staging; cutover booked'},
  {id: 'SF-302', title: 'Settings table row-level security too broad', area: 'Database', rating: 'High', owner: 'STF-009', raised: addDays(TODAY, -3), due: addDays(TODAY, 10), status: 'Corrective action', recommendation: 'Restrict settings to the administrator role.', corrective: 'Policy rewritten, awaiting migration review'},
  {id: 'SF-303', title: 'Mail password in an application log', area: 'Secrets', rating: 'Critical', owner: 'STF-009', raised: addDays(TODAY, -12), due: addDays(TODAY, -2), status: 'Closed', recommendation: 'Rotate the secret and purge the log.', corrective: 'Rotated and log purged'},
  {id: 'SF-304', title: 'Two finance accounts without MFA', area: 'Access', rating: 'High', owner: 'STF-009', raised: addDays(TODAY, -7), due: addDays(TODAY, 7), status: 'Corrective action', recommendation: 'Enrol both accounts before the next payout cycle.', corrective: 'Enrolment scheduled'},
  {id: 'SF-305', title: 'Bulk exports without a second approval', area: 'Data', rating: 'High', owner: 'STF-003', raised: addDays(TODAY, -18), due: addDays(TODAY, 21), status: 'Accepted risk', recommendation: 'Add a second approval above 1,000 rows.', corrective: 'Design agreed, not scheduled'},
  {id: 'SF-306', title: 'Soft-deleted customer rows retained past policy', area: 'Data protection', rating: 'Medium', owner: 'STF-003', raised: addDays(TODAY, -30), due: addDays(TODAY, 3), status: 'Open', recommendation: 'Purge rows past the 30-day window automatically.', corrective: 'Schedule drafted'},
  {id: 'SF-307', title: 'Backup integrity check skipped once', area: 'Backup', rating: 'Low', owner: 'STF-009', raised: addDays(TODAY, -33), due: addDays(TODAY, -20), status: 'Closed', recommendation: 'Alert when the integrity job is skipped.', corrective: 'Monitor added'},
  {id: 'SF-308', title: 'Vendor secret review overdue', area: 'Secrets', rating: 'Medium', owner: 'STF-009', raised: addDays(TODAY, -25), due: addDays(TODAY, 12), status: 'Open', recommendation: 'Complete the vendor review and rotate provider keys.', corrective: 'Review scheduled'},
  {id: 'SF-309', title: 'Authentication logs not shipped off-box', area: 'Infrastructure', rating: 'Medium', owner: 'STF-009', raised: addDays(TODAY, -40), due: addDays(TODAY, -6), status: 'Corrective action', recommendation: 'Ship logs to the drain with 24-month retention.', corrective: 'Drain configured, retention set'}
];
const SEC_BREACHES = [
  {id: 'BRC-401', when: addDays(TODAY, -12), what: 'Mail password appeared in an application log', affected: 1, severity: 'High', status: 'Contained', notified: 'Not required'},
  {id: 'BRC-402', when: addDays(TODAY, -46), what: 'An export of 620 customer rows was emailed internally', affected: 620, severity: 'Critical', status: 'Closed', notified: 'Board and regulator'},
  {id: 'BRC-403', when: addDays(TODAY, -98), what: 'Four customer rows lost during a migration', affected: 4, severity: 'Medium', status: 'Closed', notified: 'Not required'},
  {id: 'BRC-404', when: addDays(TODAY, -160), what: 'A document link stayed valid for six hours', affected: 11, severity: 'Medium', status: 'Closed', notified: 'Regulator notified'}
];
const ACCESS_REVIEWS = [
  {when: addDays(TODAY, -21), scope: 'All staff accounts', reviewed: 9, changes: 2, by: 'Chikondi Mwale'},
  {when: addDays(TODAY, -58), scope: 'Finance roles', reviewed: 3, changes: 1, by: 'Tadala Msonthi'},
  {when: addDays(TODAY, -96), scope: 'Privileged accounts', reviewed: 2, changes: 0, by: 'Chikondi Mwale'},
  {when: addDays(TODAY, -140), scope: 'All staff accounts', reviewed: 10, changes: 3, by: 'Tadala Msonthi'}
];
const SEC_EVIDENCE = [
  {id: 'EVD-601', what: 'RLS policy export (screenshot and SQL)', for: 'SF-302', added: addDays(TODAY, -3), by: 'STF-009'},
  {id: 'EVD-602', what: 'Audit log extract of the failed sign-ins', for: 'INC-7300', added: addDays(TODAY, -2), by: 'STF-009'},
  {id: 'EVD-603', what: 'Penetration test report (redacted)', for: 'ASS-209', added: addDays(TODAY, -42), by: 'STF-009'},
  {id: 'EVD-604', what: 'Secret rotation record', for: 'SF-303', added: addDays(TODAY, -8), by: 'STF-009'},
  {id: 'EVD-605', what: 'Restore drill log', for: 'RCT-311', added: addDays(TODAY, -12), by: 'STF-009'},
  {id: 'EVD-606', what: 'MFA enrolment screenshots', for: 'SF-304', added: addDays(TODAY, -5), by: 'STF-009'},
  {id: 'EVD-607', what: 'Backup integrity report (30 days)', for: 'BKP-8200', added: addDays(TODAY, -1), by: 'System'},
  {id: 'EVD-608', what: 'Data protection review notes', for: 'ASS-208', added: addDays(TODAY, -96), by: 'STF-003'}
];
const SEC_TESTS = [
  {id: 'TST-501', area: 'Application', name: 'Authorization sweep across 27 pages', ran: addDays(TODAY, -2), result: 'Pass', findings: 0},
  {id: 'TST-502', area: 'Database', name: 'RLS policy review on 12 tables', ran: addDays(TODAY, -3), result: '1 gap', findings: 1},
  {id: 'TST-503', area: 'API', name: 'Authorization test on 12 routes', ran: addDays(TODAY, -3), result: '1 gap', findings: 1},
  {id: 'TST-504', area: 'Authentication', name: 'Login, lockout and reset flow', ran: addDays(TODAY, -4), result: 'Pass', findings: 0},
  {id: 'TST-505', area: 'Dependencies', name: 'Dependency audit of the lockfile', ran: addDays(TODAY, -1), result: '1 moderate', findings: 1},
  {id: 'TST-506', area: 'Backup', name: 'Point-in-time restore drill', ran: addDays(TODAY, -12), result: 'Pass', findings: 0},
  {id: 'TST-507', area: 'Configuration', name: 'Security header and TLS review', ran: addDays(TODAY, -6), result: 'Pass', findings: 0},
  {id: 'TST-508', area: 'Application', name: 'XSS sink sweep on user input', ran: addDays(TODAY, -8), result: 'Pass', findings: 0},
  {id: 'TST-509', area: 'Database', name: 'Service-role key exposure scan', ran: addDays(TODAY, -5), result: 'Pass', findings: 0},
  {id: 'TST-510', area: 'API', name: 'Rate-limit test on auth endpoints', ran: addDays(TODAY, -9), result: 'Pass', findings: 0},
  {id: 'TST-511', area: 'Dependencies', name: 'Client bundle dependency review', ran: addDays(TODAY, -11), result: '2 patches', findings: 2},
  {id: 'TST-512', area: 'Configuration', name: 'Secret scan of logs and builds', ran: addDays(TODAY, -15), result: '1 finding', findings: 1}
];
const VULNS = [
  {id: 'VUL-701', title: 'Legacy export route accepts a bare token', area: 'API', severity: 'Critical', found: addDays(TODAY, -9), status: 'In remediation', owner: 'STF-009', fixed: ''},
  {id: 'VUL-702', title: 'Settings table readable by any authenticated user', area: 'Database', severity: 'High', found: addDays(TODAY, -3), status: 'In remediation', owner: 'STF-009', fixed: ''},
  {id: 'VUL-703', title: 'Mail password present in an application log', area: 'Secrets', severity: 'Critical', found: addDays(TODAY, -12), status: 'Remediated', owner: 'STF-009', fixed: addDays(TODAY, -8)},
  {id: 'VUL-704', title: 'axios SSRF advisory (moderate)', area: 'Dependencies', severity: 'Medium', found: addDays(TODAY, -6), status: 'Patch ready', owner: 'STF-009', fixed: ''},
  {id: 'VUL-705', title: 'Driver error message returned by the legacy export', area: 'API', severity: 'Medium', found: addDays(TODAY, -5), status: 'Open', owner: 'STF-009', fixed: ''},
  {id: 'VUL-706', title: 'No second approval on bulk exports over 1,000 rows', area: 'Data', severity: 'High', found: addDays(TODAY, -18), status: 'Accepted risk', owner: 'STF-003', fixed: ''},
  {id: 'VUL-707', title: 'MFA not enrolled for two finance accounts', area: 'Access', severity: 'High', found: addDays(TODAY, -7), status: 'In remediation', owner: 'STF-009', fixed: ''},
  {id: 'VUL-708', title: 'dayjs behind the patch release', area: 'Dependencies', severity: 'Low', found: addDays(TODAY, -6), status: 'Patch ready', owner: 'STF-009', fixed: ''},
  {id: 'VUL-709', title: 'Session list not filtered for off-branch access', area: 'Access', severity: 'Medium', found: addDays(TODAY, -21), status: 'Remediated', owner: 'STF-009', fixed: addDays(TODAY, -15)},
  {id: 'VUL-710', title: 'Backup integrity check skipped once', area: 'Backup', severity: 'Low', found: addDays(TODAY, -33), status: 'Remediated', owner: 'STF-009', fixed: addDays(TODAY, -30)}
];

/* ---------------- settings ---------------- */
const SEC_SET = {
  pwMin: 12, pwExpiry: 90, pwReuse: 5, upper: true, number: true, symbol: true,
  attempts: 5, lockout: 30, session: 30, concurrent: 2,
  mfaAdmins: true, mfaFinance: true, mfaAll: false,
  alertLogin: 5, alertAmount: 3000000, alertExport: 1000, escalateHours: 4,
  auditRetention: 24, backupRetention: 35, offsite: true
};
const SEC_HISTORY = [
  {when: addDays(TODAY, -2), who: 'Chikondi Mwale', what: 'Session timeout reduced from 60 to 30 minutes'},
  {when: addDays(TODAY, -6), who: 'Chikondi Mwale', what: 'Login attempt limit set to 5 with a 30-minute lockout'},
  {when: addDays(TODAY, -15), who: 'Chikondi Mwale', what: 'MFA made mandatory for administrator accounts'},
  {when: addDays(TODAY, -28), who: 'Tadala Msonthi', what: 'Audit log retention extended to 24 months'},
  {when: addDays(TODAY, -44), who: 'Chikondi Mwale', what: 'Bulk export second approval discussed — not yet enabled'}
];

/* ---------------- derived figures ---------------- */
const VULN_OPEN = () => VULNS.filter(v => !/Remediated/.test(v.status));
const OPEN_INCIDENTS = () => INCIDENTS.filter(i => !/^(Resolved|Closed)$/.test(i.status));
function secStats(){
  const active = ACCOUNTS.filter(a => a.state === 'Active');
  const locked = ACCOUNTS.filter(a => a.state === 'Locked');
  const suspended = ACCOUNTS.filter(a => a.state === 'Suspended');
  const inactive = ACCOUNTS.filter(a => a.state === 'Inactive');
  const failed = LOGINS.filter(l => l.result !== 'Success');
  const open = OPEN_INCIDENTS();
  const critical = open.filter(i => i.severity === 'Critical');
  const vulns = VULN_OPEN();
  const rlsGaps = DB_TABLES.filter(t => t.rls !== 'Enabled');
  const noMfa = active.filter(a => !a.mfa);
  const overdue = open.filter(i => i.due < TODAY);
  const handled = VULNS.filter(v => /Remediated|Patch ready|Accepted/.test(v.status));
  const closedFindings = SEC_FINDINGS.filter(f => /Closed|Accepted risk/.test(f.status));
  const score = Math.round(
    pct(active.length, ACCOUNTS.length) * 0.16 +
    clamp(100 - failed.length * 0.6, 0, 100) * 0.16 +
    clamp(100 - critical.length * 8 - overdue.length * 3, 0, 100) * 0.18 +
    clamp(100 - noMfa.length * 5, 0, 100) * 0.14 +
    pct(handled.length, VULNS.length) * 0.14 +
    pct(DB_TABLES.filter(t => t.rls === 'Enabled').length, DB_TABLES.length) * 0.12 +
    pct(closedFindings.length, SEC_FINDINGS.length) * 0.10
  );
  return {active, locked, suspended, inactive, failed, open, critical, vulns, rlsGaps, noMfa, score};
}
</script>
