<script>
/* ============================================================
   COMPLIANCE & INTELLIGENCE (3/7)
   The compliance universe, built from the same book the rest of the
   portal uses: KYC files, document status, loan policy tests,
   transaction monitoring, access events, cases, findings and rules.
   ============================================================ */

const WORKERS = STAFF.filter(s => s.role !== 'Administrator');
const REVIEWERS = ['STF-003', 'STF-004', 'STF-009', 'STF-007'];

/* ---------------- 2 · KYC files ---------------- */
const DOC_TYPES = [
  {key:'id',     name:'National ID',        weight:30, expires:true},
  {key:'income', name:'Proof of income',    weight:20, expires:true},
  {key:'photo',  name:'Passport photograph', weight:10, expires:false},
  {key:'address',name:'Proof of address',   weight:20, expires:true},
  {key:'kin',    name:'Next of kin ID',     weight:20, expires:true}
];
const KYC = CUSTOMERS.map((c, i) => {
  const docs = DOC_TYPES.map((t, ti) => {
    let state = 'Valid';
    if(c.kyc !== 'Verified' && ti === 3) state = 'Missing';
    else if(i % 17 === 4 && t.expires) state = 'Expired';
    else if(c.kyc !== 'Verified' && ti === 1 && i % 3 === 0) state = 'Missing';
    const expiry = t.expires ? addDays(TODAY, state === 'Expired' ? -ri(5, 90) : ri(60, 720)) : '';
    return {key:t.key, name:t.name, state, expiry};
  });
  const held = docs.filter(d => d.state === 'Valid');
  const completeness = Math.round(sum(held, d => DOC_TYPES.find(t => t.key === d.key).weight));
  let status = c.kyc === 'Verified' ? 'Verified' : 'Pending';
  if(docs.some(d => d.state === 'Expired')) status = 'Expired';
  if(i % 23 === 7) status = 'Rejected';
  const submitted = addDays(c.joined, ri(0, 6));
  return {
    id: 'KYC-' + pad(2100 + i, 5), cust: c.id, status, completeness,
    contact: i % 19 === 5 ? 'Unverified' : 'Verified',
    address: docs.find(d => d.key === 'address').state === 'Valid' ? 'Verified' : 'Missing',
    docs, submitted, reviewer: REVIEWERS[i % REVIEWERS.length],
    notes: status === 'Rejected' ? 'Name on the ID does not match the application' : '',
    history: [
      {when: submitted, who: 'Customer care', what: 'File opened · ' + held.length + ' of ' + DOC_TYPES.length + ' documents received'},
      {when: addDays(submitted, 1), who: staffName(REVIEWERS[i % REVIEWERS.length]), what: completeness === 100 ? 'Documents checked and accepted' : 'Awaiting the missing documents'}
    ]
  };
});
const KYC_BY_CUST = Object.fromEntries(KYC.map(k => [k.cust, k]));
const kycFor = id => KYC_BY_CUST[id] || null;

/* documents that are missing or past their date */
const DOC_ISSUES = [];
KYC.forEach(k => k.docs.forEach(d => {
  if(d.state === 'Missing' || d.state === 'Expired')
    DOC_ISSUES.push({id:k.id + '-' + d.key, cust:k.cust, doc:d.name, state:d.state,
      expiry:d.expiry, kyc:k.status, reviewer:k.reviewer});
}));

/* duplicate customer detection — shared phone digits and matching surnames */
const DUPLICATE_GROUPS = [];
for(let i = 0; i < CUSTOMERS.length && DUPLICATE_GROUPS.length < 4; i++){
  for(let j = i + 1; j < CUSTOMERS.length; j++){
    const a = CUSTOMERS[i], b = CUSTOMERS[j];
    const sameTail = a.phone.slice(-7) === b.phone.slice(-7);
    const sameSurname = a.name.split(' ')[1] === b.name.split(' ')[1];
    if(sameTail || (sameSurname && i % 5 === j % 5)){
      DUPLICATE_GROUPS.push({a:a.id, b:b.id, reason: sameTail ? 'Identical phone number' : 'Matching surname and region',
        strength: sameTail ? 'Strong' : 'Weak', found: addDays(TODAY, -ri(4, 40))});
      i += 6; break;
    }
  }
}

/* ---------------- 3 · loan policy tests ---------------- */
const AUTHORITY = {'Loan Officer':2500000, 'Credit Analyst':1500000, 'Head of Credit':8000000,
  'Collections Officer':0, 'Cashier':0, 'Customer Care':0};
const TERMS = {PL:[1,3,6,12], BL:[6,9,12,18,24,36], AL:[3,6,9,12], SA:[1,3,6], CL:[12,18,24,36]};

const LOAN_CHECKS = LOANS.map((l, i) => {
  const prod = PROD_BY_ID[l.product];
  const officer = STAFF_BY_ID[l.officer] || {};
  const ceiling = AUTHORITY[officer.role] || 0;
  const tests = {
    eligibility: !(l.amount > (CUST_BY_ID[l.cust] || {}).income * 8),
    authority: l.amount <= ceiling,
    limit: l.amount >= prod.min && l.amount <= prod.max,
    rate: l.rate === prod.rate,
    fees: l.amount * 0.015 <= l.amount * 0.05,
    agreement: i % 29 !== 11,
    documents: (kycFor(l.cust) || {}).completeness === 100,
    term: TERMS[l.product].includes(l.term),
    workflow: l.amount > 2000000 ? i % 13 !== 5 : true
  };
  const failed = Object.entries(tests).filter(([, ok]) => !ok).map(([k]) => k);
  return {loan:l, tests, failed, ceiling, officer};
});

const EXCEPTIONS = [];
LOAN_CHECKS.forEach((c, i) => {
  c.failed.forEach((k, n) => {
    const label = {
      eligibility:'Affordability test not met', authority:'Above officer approval authority',
      limit:'Outside the product amount band', rate:'Interest rate differs from the product rate',
      fees:'Fees above the permitted cap', agreement:'Signed agreement not on file',
      documents:'Required documents incomplete', term:'Term not offered on this product',
      workflow:'Second approval missing'
    }[k];
    EXCEPTIONS.push({
      id:'EXC-' + pad(700 + EXCEPTIONS.length, 4), loan:c.loan.ref, cust:c.loan.cust, product:c.loan.product,
      region:c.loan.region, test:k, label, severity:
        k === 'authority' || k === 'rate' ? 'High' : k === 'documents' || k === 'agreement' ? 'Critical' : 'Medium',
      amount:c.loan.amount, raised: addDays(c.loan.date, ri(1, 20)),
      status: i % 7 === 0 ? 'Resolved' : i % 4 === 0 ? 'In review' : 'Open',
      owner: REVIEWERS[i % REVIEWERS.length]
    });
  });
});

/* ---------------- 4 · transaction monitoring ---------------- */
const LARGE_THRESHOLD = 3000000;
const DUP_WINDOW = 3;
const PAY_DUPLICATES = [];
PAYS.forEach((p, i) => {
  for(let j = i + 1; j < Math.min(PAYS.length, i + 40); j++){
    const q = PAYS[j];
    if(q.loan === p.loan && q.amount === p.amount && Math.abs(daysBetween(p.date, q.date)) <= DUP_WINDOW){
      PAY_DUPLICATES.push({a:p, b:q, gap: Math.abs(daysBetween(p.date, q.date))});
      break;
    }
  }
  if(PAY_DUPLICATES.length >= 6) return;
});

const LARGE_TXNS = TXNS.filter(t => t.amount >= LARGE_THRESHOLD).slice(0, 14);
const FAILED_TXNS = TXNS.filter(t => t.status === 'Failed' || t.status === 'Reversed');
const UNALLOCATED = TXNS.filter(t => t.type !== 'Repayment' && t.type !== 'Disbursement').slice(0, 9);
const RECON_EXCEPTIONS = [
  ...DISB.filter(d => d.status !== 'Successful').slice(0, 3).map(d => ({
    id:'REC-' + d.ref, kind:'Payout', ref:d.ref, loan:d.loan, amount:d.amount, date:d.date,
    issue: d.status === 'Failed' ? 'Payout failed but the amount is still pending release' : 'Reversed payout not cleared from the cashbook',
    status:'Exception'})),
  ...UNALLOCATED.slice(0, 4).map(t => ({
    id:'REC-' + t.ref, kind:'Adjustment', ref:t.ref, loan:t.loan, amount:t.amount, date:t.date,
    issue:'Adjustment entry not matched to a receipt or payout', status:'Exception'}))
];
const TXN_INVESTIGATIONS = RECON_EXCEPTIONS.slice(0, 6).map((r, i) => ({
  id:'INV-T' + pad(310 + i, 3), subject:r.ref, detail:r.issue, amount:r.amount, opened: addDays(TODAY, -ri(3, 40)),
  owner: REVIEWERS[i % REVIEWERS.length], status: i % 3 === 0 ? 'Closed' : 'Investigating',
  finding: i % 3 === 0 ? 'Timing difference — cleared on the next bank statement' : 'Awaiting the bank statement'
}));

/* ---------------- 5 · fraud & access signals ---------------- */
const ACCESS_EVENTS = [];
WORKERS.forEach((s, i) => {
  const fails = [0, 0, 1, 2, 3, 5, 7, 0, 1][i] || 0;
  ACCESS_EVENTS.push({
    id:'ACC-' + pad(5400 + i, 4), staff:s.id, name:s.name, role:s.role, branch:s.branch,
    failedLogins: fails, lastLogin: addDays(TODAY, -ri(0, 3)) + ' ' + pad(ri(6, 21), 2) + ':' + pad(ri(0, 59), 2),
    afterHours: i % 4 === 1 ? ri(1, 4) : 0,
    offBranch: i % 5 === 2 ? ri(1, 3) : 0,
    privileged: ['Administrator', 'Head of Credit', 'Cashier'].includes(s.role),
    roleChanges: i === 2 ? 1 : 0,
    blocked: fails >= 5
  });
});
const CORRECTIONS = [];
for(let i = 0; i < 8; i++){
  const p = PAYS[(i * 13) % PAYS.length];
  CORRECTIONS.push({
    id:'COR-' + pad(120 + i, 3), receipt:p.receipt, loan:p.loan, staff:WORKERS[i % WORKERS.length].id,
    before: p.amount, after: p.amount - ri(1, 6) * 1000, when: addDays(p.date, ri(0, 5)),
    reason: ['Wrong amount keyed', 'Posted to the wrong loan', 'Duplicate receipt reversed', 'Bank charge netted off'][i % 4],
    approved: i % 3 !== 0
  });
}
const SUSPICIOUS_APPS = APPS.filter((a, i) => i % 17 === 3).slice(0, 6).map((a, i) => ({
  id:'SUS-A' + pad(60 + i, 3), app:a.ref, cust:a.cust, amount:a.amount, product:a.product,
  submitted:a.submitted, signal: ['Same amount as an open facility', 'Second application within 7 days',
    'Amount at the top of the band', 'Officer above approval authority'][i % 4],
  severity: i % 2 ? 'Medium' : 'High'
}));

/* ---------------- 9 · cases ---------------- */
const CASES = [];
function addCase(o){
  CASES.push(Object.assign({
    id:'CMP-' + pad(4300 + CASES.length, 4), opened: addDays(TODAY, -ri(2, 45)),
    due: addDays(TODAY, ri(-6, 21)), notes:[], evidence:[], actions:[], history:[],
    owner: REVIEWERS[CASES.length % REVIEWERS.length]
  }, o));
}
EXCEPTIONS.filter(e => e.severity !== 'Medium').slice(0, 5).forEach(e => addCase({
  title: e.label + ' · ' + e.loan, lane:'Compliance', type:'Loan policy', severity: e.severity,
  subjectKind:'loan', subjectId: e.loan, region:'', product: (LOAN_BY_REF[e.loan] || {}).product,
  status:'Open', detail:`${e.label} on ${e.loan} for ${money(e.amount)}.`
}));
PAY_DUPLICATES.slice(0, 3).forEach(d => addCase({
  title:'Possible duplicate receipt · ' + d.a.loan, lane:'Transaction', type:'Duplicate payment', severity:'High',
  subjectKind:'payment', subjectId: d.a.receipt, status:'Investigating',
  detail:`Two receipts of ${money(d.a.amount)} posted ${d.gap} day(s) apart against the same facility.`
}));
LARGE_TXNS.slice(0, 3).forEach(t => addCase({
  title:'Large transaction · ' + t.ref, lane:'Transaction', type:'Threshold breach', severity:'Medium',
  subjectKind:'transaction', subjectId: t.ref, status:'Open',
  detail:`${money(t.amount)} moved on ${t.type.toLowerCase()} — above the ${money(LARGE_THRESHOLD)} monitoring threshold.`
}));
DUPLICATE_GROUPS.slice(0, 3).forEach(g => addCase({
  title:'Possible duplicate customer · ' + (CUST_BY_ID[g.a] || {}).name, lane:'KYC', type:'Duplicate identity',
  severity:'High', subjectKind:'customer', subjectId:g.a, status:'Open',
  detail:`${g.reason} shared with ${(CUST_BY_ID[g.b] || {}).name} (${g.b}).`
}));
ACCESS_EVENTS.filter(a => a.blocked).slice(0, 3).forEach(a => addCase({
  title:'Repeated failed logins · ' + a.name, lane:'Access', type:'Security', severity:'Critical',
  subjectKind:'staff', subjectId:a.id, status:'Escalated',
  detail:`${a.failedLogins} failed sign-in attempts from ${a.branch} on ${fmtDate(a.lastLogin)}.`
}));
KYC.filter(k => k.status === 'Expired').slice(0, 3).forEach(k => addCase({
  title:'Expired identity document · ' + custName(k.cust), lane:'KYC', type:'Document expiry', severity:'Medium',
  subjectKind:'kyc', subjectId:k.id, status:'Open',
  detail:`${k.docs.filter(d => d.state !== 'Valid').map(d => d.name).join(', ') || 'Document'} expired — file completeness ${k.completeness}%.`
}));
SUSPICIOUS_APPS.slice(0, 2).forEach(a => addCase({
  title:'Suspicious application · ' + a.app, lane:'Fraud', type:'Application pattern', severity:a.severity,
  subjectKind:'app', subjectId:a.app, status:'Open', detail:a.signal + ' on ' + a.app + '.'
}));
CASES.forEach((c, i) => {
  c.history.push({when:c.opened, who:'System rule engine', what:'Case raised automatically'});
  if(i % 3 === 1){ c.notes.push({when:addDays(c.opened, 1), who:staffName(c.owner), note:'Contacted the branch for the source documents.'}); }
  if(i % 4 === 2){ c.actions.push({who:staffName(c.owner), what:'Request outstanding evidence', due:addDays(TODAY, 5), status:'Open'}); }
  if(i % 3 === 2){
    c.status = 'Resolved';
    c.closedOn = addDays(c.opened, ri(2, 9));
    c.notes.push({when:c.closedOn, who:staffName(c.owner), note:'Checked and cleared — the control was operating as designed.'});
    c.history.push({when:c.closedOn, who:staffName(c.owner), what:'Case resolved — no further action'});
  } else if(i % 7 === 4){
    c.status = 'Closed';
    c.closedOn = addDays(c.opened, ri(3, 12));
    c.history.push({when:c.closedOn, who:staffName(c.owner), what:'Case closed after review'});
  } else if(i % 5 === 3){
    c.status = 'Assigned';
    c.evidence.push({what:'Statement extract', by:staffName(c.owner), when:addDays(c.opened, 1)});
  }
});

/* ---------------- 10 · audit findings ---------------- */
const FINDINGS = [
  ['Cash-count sheets not signed off daily', 'Cash handling', 'High', 'STF-007'],
  ['Two facilities released before the agreement was signed', 'Loan documentation', 'Critical', 'STF-003'],
  ['KYC refresh overdue on five customer files', 'Customer due diligence', 'Medium', 'STF-008'],
  ['Receipt corrections approved by the same officer who keyed them', 'Segregation of duties', 'High', 'STF-005'],
  ['Daily reconciliation not evidenced for three days', 'Reconciliation', 'High', 'STF-006'],
  ['Motor cycle logbook missing for an asset-finance facility', 'Collateral', 'Medium', 'STF-001'],
  ['Failed payout retried without a second authorisation', 'Disbursement', 'High', 'STF-004'],
  ['Arrears report not circulated to management for a week', 'Reporting', 'Low', 'STF-005'],
  ['Two staff accounts still hold leaver permissions', 'Access management', 'High', 'STF-009'],
  ['Customer consent wording missing on an old application form', 'Data protection', 'Medium', 'STF-008'],
  ['Interest recalculation after restructuring not minuted', 'Credit', 'Medium', 'STF-003'],
  ['Branch petty-cash float above the approved limit', 'Cash handling', 'Low', 'STF-007']
].map(([title, cat, rating, owner], i) => ({
  id:'AUD-F' + pad(118 + i, 3), title, category:cat, rating, owner,
  raised: addDays(TODAY, -ri(10, 70)), due: addDays(TODAY, ri(-14, 30)),
  status: i % 5 === 4 ? 'Closed' : i % 3 === 0 ? 'Corrective action' : 'Open',
  recommendation: cat === 'Access management' ? 'Revoke access the day an employee leaves and evidence it in the register.'
    : cat === 'Reconciliation' ? 'Archive the signed reconciliation sheet with the day-end pack.'
    : cat === 'Data protection' ? 'Re-issue the consent wording and re-paper the affected files.'
    : 'Tighten the control and evidence it on the checklist.',
  corrective: i % 5 === 4 ? 'Completed and verified by internal audit' : 'Owner to confirm the fix and attach evidence'
}));

/* ---------------- 11 · report catalogue helpers ---------------- */
/* ---------------- 12 · data protection ---------------- */
const CONSENT = CUSTOMERS.slice(0, 24).map((c, i) => ({
  id:'CON-' + pad(880 + i, 4), cust:c.id, purpose: ['Credit assessment','Credit bureau reporting','Marketing','Identity checks'][i % 4],
  given: addDays(c.joined, ri(0, 3)), channel: ['Signed form','SMS','Portal','Branch'][i % 4],
  status: i % 11 === 6 ? 'Withdrawn' : 'Active', expires: addDays(TODAY, ri(-30, 700))
}));
const DATA_REQUESTS = [
  ['Correction','Change of phone number after a SIM swap', 'STF-008'],
  ['Correction','Surname misspelt on the loan agreement', 'STF-008'],
  ['Correction','Remove a settled facility from the bureau record', 'STF-009'],
  ['Export','Customer statement for a court matter', 'STF-009'],
  ['Export','Full data copy requested by the customer', 'STF-003'],
  ['Export','Branch handover pack', 'STF-007'],
  ['Erasure','Marketing list removal', 'STF-008']
].map(([kind, detail, owner], i) => ({
  id:(kind === 'Export' ? 'DXR-' : 'DCR-') + pad(310 + i, 3), kind, detail, owner,
  raised: addDays(TODAY, -ri(2, 40)), due: addDays(TODAY, ri(-4, 14)),
  status: i % 4 === 3 ? 'Completed' : i % 3 === 0 ? 'In progress' : 'Open',
  cust: CUSTOMERS[(i * 3) % CUSTOMERS.length].id
}));
const BREACHES = [
  {id:'BRC-101', what:'A staff handset with a customer list was lost at Lilongwe bus depot', when: addDays(TODAY, -52),
   severity:'High', affected: 7, status:'Closed', authority:true, note:'All affected customers notified; device wiped remotely.'},
  {id:'BRC-102', what:'Two customer statements emailed to the wrong address', when: addDays(TODAY, -12),
   severity:'Medium', affected: 2, status:'Investigating', authority:false, note:'Recipient confirmed deletion in writing.'}
];
const RETENTION = [
  ['Loan agreements', '7 years after closure', 'Loan file archive', 'Compliant', 0],
  ['KYC identity documents', '5 years after closure', 'Customer file', 'Compliant', 0],
  ['Transaction records', '7 years', 'Cashbook and bank files', 'Compliant', 0],
  ['Call recordings', '12 months', 'Contact centre', 'Compliant', 0],
  ['Marketing consent', 'Until withdrawn', 'CRM', 'Review', 12],
  ['Audit logs', '3 years', 'Security log store', 'Compliant', 0],
  ['CCTV at branches', '30 days', 'Branch system', 'Compliant', 0],
  ['Application declines', '3 years', 'Credit file', 'Review', 4]
].map(([what, rule, where, status, flagged]) => ({what, rule, where, status, flagged}));

/* ---------------- 8 · regulatory register ---------------- */
const REGS = [
  ['Banking & Financial Services Act', 'RBM', 'Lending licence and conduct rules', 'Compliant', '2026-09-30'],
  ['Financial Services (AML/CFT) Directive', 'RBM', 'Customer due diligence and reporting', 'Compliant', '2026-10-12'],
  ['Credit Reference Bureau Directive', 'RBM', 'Monthly submission for facilities above K50,000', 'Review', '2026-10-20'],
  ['Data Protection Act 2024', 'Malawi Govt', 'Lawful processing, consent and breach notices', 'Review', '2026-10-05'],
  ['Consumer Protection Act', 'Malawi Govt', 'Fee disclosure and complaint handling', 'Compliant', '2026-09-18'],
  ['Interest Rate Disclosure', 'RBM', 'Effective annual rate shown in the agreement', 'Compliant', '2026-09-01'],
  ['Record Retention Rules', 'RBM', 'Seven-year retention for credit files', 'Compliant', '2026-08-22'],
  ['Marketing Consent Rules', 'Malawi Govt', 'Opt-in before any promotional message', 'Review', '2026-10-24'],
  ['Anti-Money Laundering Reporting', 'FIA Malawi', 'Suspicious transaction reports', 'Compliant', '2026-10-28'],
  ['Branch Licensing', 'RBM', 'Registered premises per district', 'Compliant', '2026-07-15'],
  ['Statement of Compliance', 'RBM', 'Quarterly return to the supervisor', 'Review', '2026-10-01'],
  ['Complaints Register', 'RBM', 'Log, resolve and report complaint trends', 'Compliant', '2026-09-27']
].map(([name, body, requirement, status, checked], i) => ({
  id:'REG-' + pad(30 + i, 3), name, body, requirement, status, checked,
  owner: REVIEWERS[i % REVIEWERS.length],
  evidence: ['Policy manual v4','Signed checklist','Board minute','Submission receipt'][i % 4],
  due: addDays(TODAY, ri(-10, 60))
}));

/* ---------------- 1/13 · tasks and rules ---------------- */
const COMPLIANCE_TASKS = [
  ['Refresh KYC on expired files', 'KYC', 'STF-008', 6, 'Open', 'High'],
  ['Quarterly AML return to the FIA', 'Regulatory', 'STF-009', 12, 'In progress', 'Critical'],
  ['Sign off the weekly cash-count sheets', 'Cash', 'STF-007', 2, 'Open', 'Medium'],
  ['Close the two open audit findings', 'Audit', 'STF-003', 9, 'Open', 'High'],
  ['Review privileged-access list', 'Access', 'STF-009', 4, 'In progress', 'High'],
  ['Credit bureau submission for October', 'Regulatory', 'STF-004', 3, 'Open', 'High'],
  ['Chase the missing logbook for Collateral Loans', 'Collateral', 'STF-001', -2, 'Overdue', 'Medium'],
  ['Re-paper the consent wording', 'Data protection', 'STF-008', -5, 'Overdue', 'High'],
  ['Evidence the daily reconciliation', 'Reconciliation', 'STF-006', 7, 'Open', 'Medium'],
  ['Minute the interest recalculation', 'Credit', 'STF-003', 15, 'Open', 'Low'],
  ['Review the duplicate-customer cases', 'KYC', 'STF-004', 8, 'In progress', 'High'],
  ['Test the failed-payout escalation', 'Disbursement', 'STF-005', 20, 'Open', 'Medium'],
  ['Update the compliance calendar', 'Admin', 'STF-009', 25, 'Open', 'Low'],
  ['Verify marketing consent for the SMS run', 'Data protection', 'STF-008', 1, 'Open', 'Critical']
].map(([title, cat, owner, dueIn, status, priority], i) => ({
  id:'CT-' + pad(560 + i, 4), title, cat, owner, priority, status,
  due: addDays(TODAY, dueIn), raised: addDays(TODAY, -ri(3, 30)),
  lane: cat === 'KYC' ? 'KYC' : cat === 'Access' ? 'Access' : cat === 'Data protection' ? 'Data'
      : cat === 'Regulatory' ? 'Compliance' : 'Compliance'
}));

const RULES = {
  largeTxn: LARGE_THRESHOLD,
  dupWindow: DUP_WINDOW,
  failedLogin: 5,
  maxLoan: 5000000,
  authority: Object.assign({}, AUTHORITY),
  kycRenewal: 12,
  docRequired: 5,
  escalationHours: 24,
  autoBlock: true
};
const RULE_HISTORY = [
  {when: addDays(TODAY, -64), who:'Chikondi Mwale', what:'Large-transaction threshold raised from MK 2,500,000 to MK 3,000,000', approvedBy:'Tadala Msonthi'},
  {when: addDays(TODAY, -38), who:'Tadala Msonthi', what:'Loan Officer approval authority set to MK 1,500,000', approvedBy:'Chikondi Mwale'},
  {when: addDays(TODAY, -17), who:'Linda Mhango', what:'Duplicate-payment window widened to 3 days', approvedBy:'Tadala Msonthi'}
];
const RULE_QUEUE = [
  {id:'RCH-77', what:'Block a payout automatically after three failed attempts', raised: addDays(TODAY, -6), by:'Fatsani Gondwe', status:'Pending'},
  {id:'RCH-78', what:'Require proof of address for facilities above MK 1,000,000', raised: addDays(TODAY, -3), by:'Linda Mhango', status:'Pending'}
];

/* ---------------- 15 · settings ---------------- */
const SETTINGS = {
  officers: [
    ['Chikondi Mwale','Full','Compliance administrator',true,true,true],
    ['Tadala Msonthi','Cases and findings','Head of Credit',true,true,false],
    ['Linda Mhango','Cases','Compliance analyst',true,true,false],
    ['Fatsani Gondwe','Alerts only','Collections reviewer',true,false,false],
    ['Memory Phiri','KYC queue','Customer care',true,false,false],
    ['External auditor','Read-only','Independent review',true,false,false]
  ],
  workflows: [
    ['KYC review','Maker → checker', 'Two approvals', true],
    ['Loan exception','Maker → head of credit', 'One approval', true],
    ['Fraud case','Analyst → compliance officer → board', 'Three levels', true],
    ['Data request','Customer care → compliance', 'One approval', true]
  ],
  severities: [['Critical','Escalate within 1 hour','Board and compliance officer'],
    ['High','Escalate within 24 hours','Compliance officer'],
    ['Medium','Review within 5 working days','Team lead'],
    ['Low','Review in the monthly cycle','Analyst']],
  retention: [['Case records','7 years'],['Evidence files','7 years'],['Investigation notes','5 years'],
    ['Audit logs','3 years'],['Access logs','24 months']],
  notifications: [['Critical case opened','SMS and email',true],['Case escalated','Email',true],
    ['KYC document expired','Portal alert',true],['Weekly compliance digest','Email',true],
    ['Rule changed','Email to the approver',true]],
  history: [
    {when: addDays(TODAY, -21), who:'Chikondi Mwale', what:'Case assignment changed to round-robin within the analyst pool'},
    {when: addDays(TODAY, -9), who:'Chikondi Mwale', what:'Evidence access limited to case owners and the compliance officer'},
    {when: addDays(TODAY, -2), who:'Tadala Msonthi', what:'Audit-log retention extended from 24 to 36 months'}
  ]
};
const CONFIG_HISTORY = [];
function logConfig(what){
  const rec = {when: fmtDate(TODAY), who:'Chikondi Mwale', what};
  CONFIG_HISTORY.unshift(rec);
  SETTINGS.history.unshift(rec);
}

/* ---------------- 6 · credit risk classification history ---------------- */
const RISK_CLASSES = ['Low','Moderate','Elevated','High','Default'];
function riskOf(l){
  if(l.status === 'Written off') return 'Default';
  if(l.dpd > 90) return 'High';
  if(l.dpd > 45) return 'Elevated';
  if(l.arrears > 0) return 'Moderate';
  return 'Low';
}
const RISK_HISTORY = MONTHS.slice(-6).map((m, i) => ({
  month:m,
  bands: RISK_CLASSES.map(b => LOANS.filter(l => l.date <= m + '-28' && riskOf(l) === b).length),
  par: (() => {
    const out = sum(LOANS.filter(l => l.date <= m + '-28' && l.status === 'Active'), l => l.outstanding);
    const arr = sum(LOANS.filter(l => l.date <= m + '-28' && l.status === 'Active'), l => l.arrears);
    return r1(pct(arr, out || 1));
  })()
}));

/* ---------------- derived helpers ---------------- */
function complianceStats(){
  const cases = CASES;
  const open = cases.filter(c => !/^(Resolved|Closed)$/.test(c.status));
  const closed = cases.filter(c => /^(Resolved|Closed)$/.test(c.status));
  const kycPending = KYC.filter(k => k.status !== 'Verified');
  const tasks = COMPLIANCE_TASKS;
  const overdue = tasks.filter(t => t.status === 'Overdue' || (t.due < TODAY && t.status !== 'Done'));
  const exceptions = EXCEPTIONS.filter(e => e.status !== 'Resolved');
  const findings = FINDINGS.filter(f => f.status !== 'Closed');
  const regsReview = REGS.filter(r => r.status !== 'Compliant');
  const verified = KYC.filter(k => k.status === 'Verified').length;
  const docComplete = KYC.filter(k => k.completeness === 100).length;
  const posted = TXNS.filter(t => t.status === 'Posted').length;
  const blocked = ACCESS_EVENTS.filter(a => a.blocked).length;
  const parts = [
    {w:0.22, v:pct(verified, KYC.length)},
    {w:0.16, v:pct(docComplete, KYC.length)},
    {w:0.18, v:pct(posted, TXNS.length)},
    {w:0.12, v:clamp(100 - blocked * 6, 0, 100)},
    {w:0.16, v:pct(closed.length, Math.max(1, cases.length))},
    {w:0.16, v:clamp(100 - pct(exceptions.length, Math.max(1, LOANS.length)) * 1.2, 0, 100)}
  ];
  const score = Math.round(sum(parts, p => p.v * p.w));
  return {cases, open, closed, kycPending, tasks, overdue, exceptions, findings, regsReview, score};
}
</script>
