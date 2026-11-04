<script>
/* ============================================================
   TRANSFERS MANAGEMENT & CONNECTIONS (3/8)
   The data universe: settings, customer and savings accounts,
   internal, savings, loan, bank and mobile money transfers, the
   verification and approval queues, beneficiaries, ledger,
   limits, fees, reversals, receipts, notifications, fraud, the
   provider connections and the database.
   ============================================================ */

/* ---------------- settings ---------------- */
const TR_SET_DEFAULTS = {
  currency: 'MWK', currencyLabel: 'Malawian Kwacha (MWK)', currencySymbol: 'MK', decimals: 2,
  transferPrefix: 'TRF', receiptPrefix: 'TRC', receiptDigits: 5, receiptYear: true,
  minTransfer: 500, maxTransfer: 4000000, minInternal: 100, maxInternal: 8000000,
  dailyTransferLimit: 8000000, perCustomerDailyLimit: 6000000, maxMonthlyTransfers: 60,
  approvalThreshold: 500000, secondApprovalThreshold: 1500000,
  internalFeePct: 0, internalFeeFlat: 0,
  bankFeePct: 0.9, bankFeeFlat: 3500,
  mobileFeePct: 1.1, mobileFeeFlat: 500,
  feePayer: 'Customer', duplicateWindow: 10,
  allowThirdPartyInternal: true, allowExternalTransfers: true, requireIdentityForBank: true,
  requireBeneficiaryApproval: true, autoVerifySmall: false, notifySms: true, notifyEmail: true, sandbox: false,
  internalRule: 'Both accounts must belong to the same customer unless a third-party transfer is allowed, and the source balance must cover the amount and the fee',
  externalRule: 'Beneficiary details checked, limits applied, then two approvals above MK 500,000',
  settlementWindow: 'Internal transfers settle instantly; bank and mobile money payouts within 30 minutes'
};
const TR_SET = Object.assign({}, TR_SET_DEFAULTS);

/* ---------------- customer and savings accounts ---------------- */
const TR_ACCOUNT_TYPES = ['Current', 'Savings'];
const TR_ACCOUNTS = [];
CUSTOMERS.forEach((c, i) => {
  TR_ACCOUNT_TYPES.forEach((type, k) => {
    const idx = i * 2 + k;
    const opening = type === 'Savings' ? 2000 + ri(0, 30) * 5000 : 5000 + ri(0, 40) * 7500;
    const suspended = idx === 17 || idx === 45;
    TR_ACCOUNTS.push({
      id: (type === 'Savings' ? 'SAV-' : 'CUR-') + pad(1001 + idx, 4),
      cust: c.id, type, currency: 'MWK', opened: addMonths(TODAY, -(5 + (idx % 26))),
      status: suspended ? 'Suspended' : (idx % 31 === 7 ? 'Dormant' : 'Active'),
      opening, available: opening, reserved: 0, ledger: opening,
      interest: type === 'Savings' ? 6.5 : 0,
      restriction: type === 'Savings' ? (idx % 5 === 0 ? 'Two withdrawals a month' : 'None') : 'None',
      eligible: !suspended, lastMove: addDays(TODAY, -(idx % 11)),
      lane: type === 'Savings' ? 'Savings' : 'Accounts', severity: suspended ? 'High' : 'Low',
      owner: 'STF-001', region: c.region
    });
  });
});
const TR_ACC_BY_ID = Object.fromEntries(TR_ACCOUNTS.map(a => [a.id, a]));
const TR_ACC_OF_CUST = (cust, type) => TR_ACCOUNTS.find(a => a.cust === cust && a.type === type);
const TR_SAVINGS = TR_ACCOUNTS.filter(a => a.type === 'Savings');

/* ---------------- transfer methods and rails ---------------- */
const TR_METHODS = [
  {method: 'Internal transfer', rail: 'Internal', provider: 'Golden ledger', refPrefix: 'INT', lane: 'Internal', kind: 'Internal'},
  {method: 'Savings transfer', rail: 'Internal', provider: 'Golden ledger', refPrefix: 'SAV', lane: 'Savings', kind: 'Savings'},
  {method: 'Loan transfer', rail: 'Internal', provider: 'Golden ledger', refPrefix: 'LON', lane: 'Loan', kind: 'Loan'},
  {method: 'Bank transfer', rail: 'External', provider: 'FDH Bank', refPrefix: 'BNK', lane: 'Bank', kind: 'Bank'},
  {method: 'Airtel Money', rail: 'External', provider: 'Airtel Malawi', refPrefix: 'AMT', lane: 'Mobile money', kind: 'Mobile'},
  {method: 'TNM Mpamba', rail: 'External', provider: 'TNM Mpamba', refPrefix: 'TNM', lane: 'Mobile money', kind: 'Mobile'},
  {method: 'Card gateway', rail: 'External', provider: 'PayChangu', refPrefix: 'PGW', lane: 'Gateway', kind: 'Gateway'}
];
const TR_METHOD_BY_NAME = Object.fromEntries(TR_METHODS.map(m => [m.method, m]));
const TR_STATUSES = ['Draft', 'Pending verification', 'Pending approval', 'Approved', 'Processing',
  'Completed', 'Failed', 'Rejected', 'Cancelled', 'Reversed'];
const TR_CATEGORIES = ['Own accounts', 'Third party', 'Savings', 'Loan disbursement', 'Loan repayment',
  'Bank payout', 'Mobile wallet'];
const TR_BANKS = ['FDH Bank', 'National Bank of Malawi', 'Standard Bank', 'NBS Bank', 'Ecobank', 'Centenary Bank'];
const TR_MOBILE = ['Airtel Money', 'TNM Mpamba'];

/* ---------------- transfers ---------------- */
const TR_TXN = [];
let trSeq = 2001;
CUSTOMERS.forEach((c, ci) => {
  const cur = TR_ACC_OF_CUST(c.id, 'Current');
  const sav = TR_ACC_OF_CUST(c.id, 'Savings');
  if(!cur || !sav) return;
  const count = 5 + (ci % 4);
  for(let k = 0; k < count; k++){
    const back = ci < 22 ? ri(0, 6) : ri(0, 300);
    const when = addDays(TODAY, -back) + ' ' + pad(ri(7, 18), 2) + ':' + pad(ri(0, 59), 2);
    const roll = rnd();
    const kind = roll < 0.34 ? 'Internal' : roll < 0.55 ? 'Savings' : roll < 0.66 ? 'Loan'
      : roll < 0.86 ? 'Bank' : 'Mobile';
    let method, category, source, dest, destName, provider;
    if(kind === 'Internal'){
      method = 'Internal transfer';
      const toSavings = rnd() < 0.5;
      category = 'Own accounts';
      source = toSavings ? cur.id : sav.id;
      dest = toSavings ? sav.id : cur.id;
      destName = c.name;
      provider = 'Golden ledger';
    } else if(kind === 'Savings'){
      method = 'Savings transfer';
      category = 'Savings';
      source = rnd() < 0.6 ? sav.id : cur.id;
      dest = source === sav.id ? (rnd() < 0.5 ? cur.id : TR_ACC_OF_CUST(CUSTOMERS[(ci + 7) % CUSTOMERS.length].id, 'Savings').id)
        : sav.id;
      destName = source === sav.id && /^CUR/.test(dest) ? c.name : custName((TR_ACC_BY_ID[dest] || {cust: c.id}).cust);
      provider = 'Golden ledger';
    } else if(kind === 'Loan'){
      method = 'Loan transfer';
      const loan = LOANS[ci % LOANS.length];
      category = rnd() < 0.55 ? 'Loan repayment' : 'Loan disbursement';
      source = cur.id;
      dest = loan.ref;
      destName = custName(loan.cust) + ' · ' + loan.ref;
      provider = 'Golden ledger';
    } else if(kind === 'Bank'){
      method = 'Bank transfer';
      category = 'Bank payout';
      source = rnd() < 0.7 ? cur.id : sav.id;
      dest = pick(TR_BANKS) + ' · ' + pad(ri(1000, 9999), 4) + ' ' + pad(ri(1000, 9999), 4);
      destName = pick(['Chisomo Holdings', 'Mzimba Traders', 'Tadala Phiri', 'Limbe Supplies', 'Zomba Grains', 'Kamuzu Transport']);
      provider = 'FDH Bank';
    } else {
      method = pick(TR_MOBILE);
      category = 'Mobile wallet';
      source = rnd() < 0.6 ? cur.id : sav.id;
      dest = '0' + pick(['991', '888', '999', '881']) + ' ' + pad(ri(100, 999), 3) + ' ' + pad(ri(100, 999), 3);
      destName = CUSTOMERS[(ci + 11) % CUSTOMERS.length].name;
      provider = method === 'Airtel Money' ? 'Airtel Malawi' : 'TNM Mpamba';
    }
    let status = 'Completed';
    const s = rnd();
    if(back <= 3 && s < 0.22) status = 'Pending verification';
    else if(back <= 4 && s < 0.32) status = 'Pending approval';
    else if(back <= 5 && s < 0.40) status = 'Processing';
    else if(back <= 2 && s < 0.46) status = 'Draft';
    else if(s > 0.955) status = 'Failed';
    else if(s > 0.925) status = 'Rejected';
    else if(s > 0.895) status = 'Cancelled';
    else if(s > 0.865) status = 'Reversed';
    const amount = Math.round((kind === 'Loan' ? 25000 + rnd() * 900000 : 5000 + rnd() * 480000) / 500) * 500;
    const fee = method === 'Internal transfer' ? 0
      : method === 'Savings transfer' ? 0
      : method === 'Bank transfer' ? Math.round(amount * TR_SET.bankFeePct / 100) + TR_SET.bankFeeFlat
      : method === 'Loan transfer' ? 0
      : Math.round(amount * TR_SET.mobileFeePct / 100) + TR_SET.mobileFeeFlat;
    const officer = pick(STAFF.filter(x => ['Cashier', 'Collections Officer', 'Loan Officer', 'Finance Manager'].includes(x.role))).id;
    TR_TXN.push({
      id: (status === 'Draft' ? 'DRF-' : TR_SET.transferPrefix + '-') + pad(trSeq++, 5),
      type: kind, method, category, provider,
      rail: ['Internal', 'Savings', 'Loan'].includes(kind) ? 'Internal' : 'External',
      when, cust: c.id,
      source, dest, destName, amount, fee, currency: 'MWK',
      description: kind === 'Loan' ? 'Loan account movement · ' + dest
        : kind === 'Internal' ? 'Between own accounts' : kind === 'Savings' ? 'Savings movement'
        : kind === 'Bank' ? 'External bank payout' : 'Wallet payout',
      priority: amount > 900000 ? 'High' : rnd() < 0.1 ? 'Urgent' : 'Normal',
      status,
      stage: status === 'Draft' ? 'Not submitted' : status === 'Pending verification' ? 'Awaiting verification'
        : status === 'Pending approval' ? 'Awaiting approval' : status === 'Approved' ? 'Approved, not yet sent'
        : status === 'Processing' ? 'At the provider' : status === 'Completed' ? 'Posted to both accounts'
        : status === 'Failed' ? 'Provider refused' : status === 'Rejected' ? 'Refused by an officer'
        : status === 'Cancelled' ? 'Withdrawn before release' : 'Reversal posted',
      ref: (TR_METHOD_BY_NAME[method] || {refPrefix: 'TRF'}).refPrefix + '-' + pad(ri(100000, 999999), 6),
      initiatedBy: rnd() < 0.5 ? 'Customer' : officer,
      officer, verifiedBy: status === 'Pending verification' ? '' : (rnd() < 0.85 ? 'STF-001' : 'STF-009'),
      approvedBy: ['Approved', 'Processing', 'Completed', 'Reversed'].includes(status) ? (rnd() < 0.6 ? 'STF-009' : 'STF-001') : '',
      docs: kind === 'Bank' && rnd() < 0.4 ? 'INV-' + pad(ri(100, 999), 3) + '.pdf' : '',
      notes: '', lane: kind === 'Savings' ? 'Savings' : kind === 'Internal' ? 'Internal' : kind === 'Loan' ? 'Loan'
        : kind === 'Bank' ? 'Bank' : 'Mobile money',
      severity: status === 'Failed' || status === 'Rejected' ? 'High'
        : ['Draft', 'Pending verification', 'Pending approval', 'Processing'].includes(status) ? 'Medium' : 'Low',
      owner: 'STF-001', region: c.region
    });
  }
});
TR_TXN.sort((a, b) => String(b.when).localeCompare(String(a.when)));
const TR_BY_STATUS = s => TR_TXN.filter(t => t.status === s);
const TR_COMPLETED = TR_TXN.filter(t => t.status === 'Completed');

/* ---------------- balances derived from the completed transfers ---------------- */
TR_ACCOUNTS.forEach(a => {
  const inAmt = sum(TR_COMPLETED.filter(t => t.dest === a.id), t => t.amount);
  const outAmt = sum(TR_COMPLETED.filter(t => t.source === a.id), t => t.amount + t.fee);
  a.inTotal = inAmt; a.outTotal = outAmt;
  a.available = Math.max(0, a.opening + inAmt - outAmt - a.reserved);
  a.ledger = a.available + a.reserved;
});
/* a short balance and a dormant savings account so the checks bite */
TR_ACCOUNTS[5].available = 4200;
TR_ACCOUNTS[5].ledger = 4200;

/* ---------------- beneficiaries ---------------- */
const TR_BENEFICIARIES = [];
const BEN_KINDS = ['Bank account', 'Mobile money', 'Internal account'];
for(let i = 0; i < 26; i++){
  const c = CUSTOMERS[i % CUSTOMERS.length];
  const kind = BEN_KINDS[i % 3];
  TR_BENEFICIARIES.push({
    id: 'BEN-' + pad(3100 + i, 4), cust: c.id,
    name: kind === 'Bank account' ? pick(['Chisomo Holdings', 'Mzimba Traders', 'Limbe Supplies', 'Kamuzu Transport', 'Zomba Grains'])
      : kind === 'Mobile money' ? CUSTOMERS[(i + 9) % CUSTOMERS.length].name : c.name,
    kind,
    bank: kind === 'Bank account' ? pick(TR_BANKS) : '',
    account: kind === 'Bank account' ? pad(ri(10000000, 99999999), 8)
      : kind === 'Mobile money' ? '0' + pick(['991', '888']) + ' ' + pad(ri(100, 999), 3) + ' ' + pad(ri(100, 999), 3)
      : TR_ACC_OF_CUST(c.id, i % 2 ? 'Savings' : 'Current').id,
    provider: kind === 'Mobile money' ? pick(TR_MOBILE) : kind === 'Bank account' ? 'Bank transfer' : 'Golden ledger',
    verified: i % 7 === 0 ? 'Unverified' : 'Verified',
    status: i % 11 === 0 ? 'Disabled' : 'Enabled',
    added: addDays(TODAY, -(4 + i * 5)), lastUsed: addDays(TODAY, -(i % 9)),
    lane: kind === 'Bank account' ? 'Bank' : kind === 'Mobile money' ? 'Mobile money' : 'Internal',
    severity: i % 7 === 0 ? 'Medium' : 'Low', owner: 'STF-001', region: c.region
  });
}

/* ---------------- verification queue ---------------- */
const TR_VERIFY = TR_TXN.filter(t => t.status === 'Pending verification').slice(0, 12).map((t, i) => ({
  id: 'TVQ-' + pad(520 + i, 3), txn: t.id, ref: t.ref, when: t.when, cust: t.cust, source: t.source,
  dest: t.dest, destName: t.destName, amount: t.amount, fee: t.fee, method: t.method,
  checks: {
    source: true,
    destination: i % 6 !== 0,
    funds: true,
    amount: i % 5 !== 0,
    beneficiary: t.method === 'Internal transfer' || t.method === 'Savings transfer' ? true : i % 4 !== 0,
    duplicate: !TR_TXN.some(x => x.ref === t.ref && x.id !== t.id)
  },
  docs: t.docs || 'No document attached', status: 'Pending', notes: '',
  lane: t.lane, severity: i % 5 === 0 ? 'High' : 'Medium', owner: 'STF-001', region: t.region
}));
const TR_VERIFY_HISTORY = TR_VERIFY.slice(0, 6).map((v, i) => ({
  when: addDays(TODAY, -(i + 1)) + ' 1' + i + ':15', ref: v.ref,
  action: i === 2 ? 'Rejected' : 'Approved', by: i % 2 ? 'STF-001' : 'STF-009',
  notes: i === 2 ? 'Beneficiary name did not match the bank record' : 'Source, destination and funds all agreed'
}));

/* ---------------- approval queue ---------------- */
const TR_APPROVALS = TR_TXN.filter(t => ['Pending approval', 'Approved'].includes(t.status)).slice(0, 12).map((t, i) => ({
  id: 'TAP-' + pad(430 + i, 3), txn: t.id, ref: t.ref, when: t.when, cust: t.cust,
  amount: t.amount, fee: t.fee, method: t.method, source: t.source, dest: t.dest, destName: t.destName,
  level: t.amount > TR_SET.secondApprovalThreshold ? 'Management' : 'First level',
  level1: t.amount > TR_SET.secondApprovalThreshold ? 'Approved' : 'Pending',
  level2: 'Pending',
  risk: i % 6 === 5 ? 'High' : i % 4 === 0 ? 'Medium' : 'Low',
  selfApproval: i % 9 === 8, status: 'Pending', notes: '',
  lane: t.lane, severity: i % 6 === 5 ? 'High' : 'Medium', owner: 'STF-001', region: t.region
}));
const TR_APPROVAL_HISTORY = TR_APPROVALS.slice(0, 6).map((a, i) => ({
  when: addDays(TODAY, -(i + 1)) + ' 1' + i + ':05', ref: a.ref, action: i === 3 ? 'Returned for review' : 'Approved',
  level: i === 3 ? 'First level' : 'Management', by: i % 2 ? 'STF-009' : 'STF-001',
  notes: i === 3 ? 'Sent back: the beneficiary was changed the same morning' : 'Limits, funds and beneficiary all clear'
}));
const TR_RISK = TR_APPROVALS.map(a => ({
  ref: a.ref, cust: a.cust, amount: a.amount,
  checks: [
    ['Source account belongs to the customer', true],
    ['Destination verified and enabled', a.destName !== ''],
    ['Available balance covers amount and fee', true],
    ['Inside the daily and per-customer limit', a.amount <= TR_SET.perCustomerDailyLimit],
    ['No duplicate reference in the window', true],
    ['Approver is not the officer who raised it', !a.selfApproval]
  ],
  score: a.risk
}));

/* ---------------- failed transfers and reversals ---------------- */
const TR_FAILED = TR_TXN.filter(t => t.status === 'Failed').slice(0, 10).map((t, i) => ({
  txn: t.id, ref: t.ref, when: t.when, cust: t.cust, amount: t.amount, method: t.method,
  reason: t.method === 'Bank transfer' ? 'Beneficiary account name mismatch'
    : t.method === 'Airtel Money' ? 'Recipient wallet not registered'
    : t.method === 'TNM Mpamba' ? 'Provider timed out after the debit'
    : 'Provider refused the request',
  retryable: i % 3 !== 0 ? 'Yes' : 'No — needs new details',
  status: 'Failed', lane: t.lane, severity: 'High', owner: 'STF-001', region: t.region
}));
const TR_REVERSALS = [
  {id: 'RVT-214', txn: (TR_TXN[1] || TR_TXN[0]).id, type: (TR_TXN[1] || TR_TXN[0]).type,
   ref: (TR_TXN[1] || TR_TXN[0]).ref, amount: (TR_TXN[1] || TR_TXN[0]).amount,
   reason: 'Provider refused the payout after we debited the source account',
   requested: addDays(TODAY, -2) + ' 11:20', by: 'STF-001', approver: 'STF-009', status: 'Pending',
   restored: 'No', lane: 'Reversals', severity: 'High', owner: 'STF-001', region: 'Lilongwe'},
  {id: 'RVT-213', txn: (TR_TXN[3] || TR_TXN[0]).id, type: (TR_TXN[3] || TR_TXN[0]).type,
   ref: (TR_TXN[3] || TR_TXN[0]).ref, amount: (TR_TXN[3] || TR_TXN[0]).amount,
   reason: 'Duplicate transfer — the customer submitted the same request twice',
   requested: addDays(TODAY, -5) + ' 15:40', by: 'STF-007', approver: 'STF-009', status: 'Approved',
   restored: 'No', lane: 'Reversals', severity: 'Medium', owner: 'STF-007', region: 'Blantyre'},
  {id: 'RVT-212', txn: (TR_TXN[5] || TR_TXN[0]).id, type: (TR_TXN[5] || TR_TXN[0]).type,
   ref: (TR_TXN[5] || TR_TXN[0]).ref, amount: (TR_TXN[5] || TR_TXN[0]).amount,
   reason: 'Bank reversed the credit two days later',
   requested: addDays(TODAY, -9) + ' 08:05', by: 'STF-001', approver: 'STF-001', status: 'Posted',
   restored: 'Yes', lane: 'Reversals', severity: 'Medium', owner: 'STF-001', region: 'Mzuzu'}
];
const TR_DUPLICATES = (() => {
  const seen = {};
  TR_TXN.forEach(t => { seen[t.ref] = seen[t.ref] || []; seen[t.ref].push(t); });
  return Object.keys(seen).filter(k => seen[k].length > 1).slice(0, 3).map(k => ({
    ref: k, count: seen[k].length, amount: sum(seen[k], t => t.amount),
    ids: seen[k].map(t => t.id).join(' · '), status: 'Held'
  }));
})();
const TR_REV_AUDIT = TR_REVERSALS.slice().sort((a, b) => String(b.requested).localeCompare(String(a.requested)));

/* ---------------- ledger ---------------- */
const TR_LEDGER = [];
TR_TXN.filter(t => t.status === 'Completed' || t.status === 'Reversed').slice(0, 100).forEach((t, i) => {
  const debit = {entry: 'TLE-' + pad(8200 + i * 2, 5), when: t.when, account: t.source, cust: t.cust, txn: t.id,
    side: 'Debit', amount: -(t.amount + t.fee), balance: 0, method: t.method,
    status: t.status === 'Reversed' ? 'Reversed' : 'Posted', lane: 'Ledger', severity: 'Low',
    owner: 'STF-001', region: t.region};
  TR_LEDGER.push(debit);
  if(TR_ACC_BY_ID[t.dest]){
    TR_LEDGER.push({entry: 'TLE-' + pad(8201 + i * 2, 5), when: t.when, account: t.dest, cust: TR_ACC_BY_ID[t.dest].cust,
      txn: t.id, side: 'Credit', amount: t.amount, balance: 0, method: t.method,
      status: t.status === 'Reversed' ? 'Reversed' : 'Posted', lane: 'Ledger', severity: 'Low',
      owner: 'STF-001', region: TR_ACC_BY_ID[t.dest].region});
  }
});
const trLedByAcc = {};
TR_LEDGER.slice().sort((a, b) => String(a.when).localeCompare(String(b.when))).forEach(e => {
  trLedByAcc[e.account] = (trLedByAcc[e.account] || (TR_ACC_BY_ID[e.account] || {opening: 0}).opening) + e.amount;
  const row = TR_LEDGER.find(x => x.entry === e.entry);
  if(row) row.balance = trLedByAcc[e.account];
});
const TR_DISCREPANCY = [
  {account: TR_ACCOUNTS[5].id, cust: TR_ACCOUNTS[5].cust, ledger: TR_ACCOUNTS[5].ledger,
   system: TR_ACCOUNTS[5].available, difference: TR_ACCOUNTS[5].ledger - TR_ACCOUNTS[5].available,
   severity: 'High', note: 'Reserved funds for an approved transfer not reflected in the available balance'},
  {account: TR_ACCOUNTS[17].id, cust: TR_ACCOUNTS[17].cust, ledger: TR_ACCOUNTS[17].ledger,
   system: TR_ACCOUNTS[17].available, difference: TR_ACCOUNTS[17].ledger - TR_ACCOUNTS[17].available,
   severity: 'Medium', note: 'A pending mobile payout was counted twice after a retry'}
];
const TR_ADJUST = [
  {id: 'TAD-118', when: addDays(TODAY, -2) + ' 17:40', account: TR_ACCOUNTS[5].id, amount: 2500,
   reason: 'Rounding difference on a bank transfer fee', by: 'STF-001', approver: 'STF-009', status: 'Approved',
   lane: 'Ledger', severity: 'Low', owner: 'STF-001', region: 'Lilongwe'},
  {id: 'TAD-117', when: addDays(TODAY, -5) + ' 11:15', account: TR_ACCOUNTS[17].id, amount: -1500,
   reason: 'Transfer fee duplicated on the ledger', by: 'STF-009', approver: 'STF-001', status: 'Pending',
   lane: 'Ledger', severity: 'Medium', owner: 'STF-009', region: 'Blantyre'}
];

/* ---------------- limits and fees ---------------- */
const TR_LIMITS = TR_METHODS.map((m, i) => ({
  method: m.method, rail: m.rail,
  min: m.kind === 'Internal' || m.kind === 'Savings' || m.kind === 'Loan' ? TR_SET.minInternal : TR_SET.minTransfer,
  max: m.kind === 'Internal' || m.kind === 'Savings' || m.kind === 'Loan' ? 6000000
    : m.kind === 'Gateway' ? 2000000 : 3000000,
  daily: m.rail === 'Internal' ? 8000000 : 5000000,
  providerCeiling: m.rail === 'Internal' ? 25000000 : 10000000,
  effective: addMonths(TODAY, -(2 + i)), lane: m.lane, severity: 'Low', owner: 'STF-001', region: 'Lilongwe'
}));
const TR_FEES = TR_METHODS.map((m, i) => ({
  method: m.method,
  pct: m.kind === 'Internal' || m.kind === 'Savings' || m.kind === 'Loan' ? 0
    : m.kind === 'Bank' ? TR_SET.bankFeePct : m.kind === 'Gateway' ? 1.5 : TR_SET.mobileFeePct,
  flat: m.kind === 'Internal' || m.kind === 'Savings' || m.kind === 'Loan' ? 0
    : m.kind === 'Bank' ? TR_SET.bankFeeFlat : m.kind === 'Gateway' ? 2000 : TR_SET.mobileFeeFlat,
  payer: m.kind === 'Bank' ? 'Company' : 'Customer',
  effective: addMonths(TODAY, -(1 + i)), lane: m.lane, severity: 'Low', owner: 'STF-001', region: 'Lilongwe'
}));
const TR_FEE_HISTORY = [
  {when: addDays(TODAY, -3) + ' 10:20', scope: 'Bank transfer fee', from: '0.75% + MK 3,000', to: '0.9% + MK 3,500', by: 'STF-001', lane: 'Bank', severity: 'Low', owner: 'STF-001', region: 'Lilongwe'},
  {when: addDays(TODAY, -12) + ' 09:05', scope: 'Mobile money maximum', from: 'MK 2,000,000', to: 'MK 3,000,000', by: 'STF-009', lane: 'Mobile money', severity: 'Low', owner: 'STF-009', region: 'Lilongwe'},
  {when: addDays(TODAY, -26) + ' 15:44', scope: 'Per-customer daily limit', from: 'MK 4,000,000', to: 'MK 6,000,000', by: 'STF-001', lane: 'Internal', severity: 'Low', owner: 'STF-001', region: 'Lilongwe'},
  {when: addDays(TODAY, -41) + ' 08:30', scope: 'Internal transfer fee', from: 'MK 500', to: 'Free', by: 'STF-009', lane: 'Internal', severity: 'Low', owner: 'STF-009', region: 'Lilongwe'}
];
const TR_DAILY = MONTHS12.slice(-7).map((m, i) => {
  const day = addDays(TODAY, -(6 - i));
  return {
    day, label: fmtShort(day),
    count: TR_TXN.filter(t => String(t.when).slice(0, 10) === day).length,
    value: sum(TR_TXN.filter(t => String(t.when).slice(0, 10) === day && t.status === 'Completed'), t => t.amount),
    internal: sum(TR_TXN.filter(t => String(t.when).slice(0, 10) === day && t.status === 'Completed' && t.method === 'Internal transfer'), t => t.amount),
    external: sum(TR_TXN.filter(t => String(t.when).slice(0, 10) === day && t.status === 'Completed' && t.rail === 'External'), t => t.amount),
    limit: TR_SET.dailyTransferLimit
  };
});

/* ---------------- receipts ---------------- */
const TR_RECEIPTS = TR_TXN.filter(t => t.status === 'Completed').slice(0, 70).map((t, i) => ({
  receipt: TR_SET.receiptPrefix + '-' + pad(3200 + i, TR_SET.receiptDigits), txn: t.id, ref: t.ref,
  providerRef: t.ref, when: t.when, cust: t.cust, source: t.source, dest: t.dest, destName: t.destName,
  amount: t.amount, fee: t.fee, method: t.method, status: 'Issued',
  issued: i % 10 === 0 ? 'Reissued' : 'Automatic',
  lane: 'Receipts', severity: 'Low', owner: 'STF-001', region: t.region
}));
const TR_RECEIPT_CORRECTIONS = [
  {id: 'TRC-014', receipt: (TR_RECEIPTS[4] || TR_RECEIPTS[0]).receipt, when: addDays(TODAY, -2) + ' 12:04',
   field: 'Recipient name', from: 'G. Mponda', to: 'Grace Mponda', reason: 'Initialled instead of the full name',
   by: 'STF-007', status: 'Approved', lane: 'Receipts', severity: 'Low', owner: 'STF-007', region: 'Lilongwe'},
  {id: 'TRC-013', receipt: (TR_RECEIPTS[8] || TR_RECEIPTS[0]).receipt, when: addDays(TODAY, -5) + ' 09:18',
   field: 'Amount', from: 'MK 45,000', to: 'MK 54,000', reason: 'Digits transposed on the request',
   by: 'STF-011', status: 'Approved', lane: 'Receipts', severity: 'Low', owner: 'STF-011', region: 'Blantyre'}
];

/* ---------------- notifications ---------------- */
const TR_CHANNELS = {
  sms: {provider: 'Africa’s Talking', sender: 'GOLDENFS', balance: 9420, status: 'Connected', latency: 640,
    credential: 'Expires in 24 days', lastSend: TODAY + ' 08:04'},
  email: {provider: 'Resend', sender: 'transfers@goldenloan.mw', balance: '46,880 of 50,000', status: 'Connected',
    latency: 205, credential: 'Valid', lastSend: TODAY + ' 08:12'}
};
const TR_NOTIFY_RULES = [
  {event: 'Transfer request received', sms: true, email: true, to: 'Customer', template: 'TRF_RECD', on: true},
  {event: 'Transfer pending approval', sms: true, email: false, to: 'Customer and approver', template: 'TRF_PEND', on: true},
  {event: 'Transfer approved', sms: true, email: true, to: 'Customer', template: 'TRF_APPR', on: true},
  {event: 'Transfer processing', sms: false, email: true, to: 'Customer', template: 'TRF_PROC', on: true},
  {event: 'Transfer completed', sms: true, email: true, to: 'Customer and recipient', template: 'TRF_DONE', on: true},
  {event: 'Transfer failed', sms: true, email: true, to: 'Customer and staff', template: 'TRF_FAIL', on: true},
  {event: 'Transfer rejected', sms: true, email: true, to: 'Customer', template: 'TRF_REJ', on: true},
  {event: 'Transfer reversed', sms: true, email: true, to: 'Customer and staff', template: 'TRF_REV', on: true}
];
const TR_NOTIFY_LOG = TR_TXN.slice(0, 26).map((t, i) => {
  const rule = TR_NOTIFY_RULES[i % TR_NOTIFY_RULES.length];
  return {when: t.when, event: rule.event, channel: i % 3 === 0 ? 'Email' : 'SMS', to: custName(t.cust),
    reference: t.id, status: i % 11 === 0 ? 'Failed' : i % 7 === 0 ? 'Awaiting provider' : 'Delivered',
    lane: 'Notifications', severity: 'Low', owner: 'STF-005', region: t.region};
});

/* ---------------- fraud and security ---------------- */
const TR_ID_CHECKS = TR_TXN.slice(0, 8).map((t, i) => ({
  ref: t.ref, cust: t.cust, doc: ['National ID', 'Passport', 'Driver licence'][i % 3],
  number: 'MW' + pad(ri(100000, 999999), 6), checked: i % 5 === 0 ? 'Pending' : 'Verified',
  by: i % 5 === 0 ? '—' : (i % 2 ? 'STF-007' : 'STF-001'), when: addDays(TODAY, -(i + 1)) + ' 10:00',
  lane: 'Security', severity: i % 5 === 0 ? 'Medium' : 'Low', owner: 'STF-001', region: 'Lilongwe'
}));
const TR_FRAUD = [
  {when: addDays(TODAY, -1) + ' 21:12', event: 'Three transfers to the same new beneficiary in twenty minutes',
   subject: CUSTOMERS[6].id, severity: 'High', status: 'Investigating', lane: 'Security', owner: 'STF-009', region: 'Lilongwe'},
  {when: addDays(TODAY, -2) + ' 07:40', event: 'Transfer to a bank account never used before',
   subject: CUSTOMERS[12].id, severity: 'Medium', status: 'Open', lane: 'Security', owner: 'STF-001', region: 'Blantyre'},
  {when: addDays(TODAY, -4) + ' 13:25', event: 'Duplicate provider reference on two transfers',
   subject: TR_DUPLICATES[0] ? TR_DUPLICATES[0].ref : 'BNK-1', severity: 'High', status: 'Resolved',
   lane: 'Security', owner: 'STF-001', region: 'Mzuzu'},
  {when: addDays(TODAY, -7) + ' 18:02', event: 'Beneficiary changed, then a transfer attempted the same hour',
   subject: CUSTOMERS[18].id, severity: 'Critical', status: 'Investigating', lane: 'Security', owner: 'STF-009', region: 'Zomba'}
];
const TR_VELOCITY = CUSTOMERS.slice(0, 12).map((c, i) => ({
  cust: c.id, transfers24h: 1 + (i % 4), limit: 3, amount24h: 25000 + i * 41000,
  amountLimit: TR_SET.perCustomerDailyLimit, status: (1 + (i % 4)) > 3 ? 'Breach' : 'Within limit'
}));
const TR_AMOUNT_ALERTS = TR_TXN.filter(t => t.amount > 400000).slice(0, 6).map((t, i) => ({
  txn: t.id, ref: t.ref, type: t.type, cust: t.cust, amount: t.amount, threshold: TR_SET.approvalThreshold,
  band: i % 2 ? 'Above the approval threshold' : 'Unusual for this customer',
  status: i % 3 === 0 ? 'Cleared' : 'Flagged', lane: 'Security', severity: 'Medium', owner: 'STF-001', region: t.region
}));
const TR_BEN_CHANGES = [
  {when: addDays(TODAY, -7) + ' 17:58', cust: CUSTOMERS[18].id, field: 'Beneficiary account',
   from: 'Airtel 0991 000 111', to: 'NBS 0444 3322 1100', by: 'STF-007', status: 'Unverified',
   lane: 'Security', severity: 'High', owner: 'STF-007', region: 'Zomba'},
  {when: addDays(TODAY, -13) + ' 09:12', cust: CUSTOMERS[4].id, field: 'Beneficiary mobile number',
   from: '0991 222 333', to: '0991 222 334', by: 'STF-001', status: 'Verified',
   lane: 'Security', severity: 'Low', owner: 'STF-001', region: 'Lilongwe'},
  {when: addDays(TODAY, -19) + ' 14:40', cust: CUSTOMERS[21].id, field: 'Beneficiary bank account',
   from: 'FDH 0123 4567 8901', to: 'NBS 0444 3322 1100', by: 'STF-011', status: 'Verified',
   lane: 'Security', severity: 'Low', owner: 'STF-011', region: 'Mzuzu'}
];
const TR_ROLES = ['Super Admin', 'Administrator', 'Finance Manager', 'Cashier', 'Collections Officer', 'Auditor'];
const TR_CAPS = ['Create transfers', 'Verify transfers', 'First-level approval', 'Management approval',
  'Add beneficiaries', 'Reverse a transfer', 'Change limits and fees', 'View the audit log'];
const TR_PERMS = {
  'Super Admin': [1,1,1,1,1,1,1,1],
  'Administrator': [1,1,1,1,1,1,1,1],
  'Finance Manager': [1,1,1,1,0,1,0,1],
  'Cashier': [1,0,0,0,1,0,0,0],
  'Collections Officer': [1,1,0,0,1,0,0,0],
  'Auditor': [0,0,0,0,0,0,0,1]
};
const TR_ROLE_STAFF = {'Super Admin':'STF-001','Administrator':'STF-009','Finance Manager':'STF-006',
  'Cashier':'STF-007','Collections Officer':'STF-012','Auditor':'STF-016'};
const TR_THRESHOLDS = [
  {band: 'Up to MK 500,000', level1: 'One cashier', level2: 'Not required', days: 'Immediate'},
  {band: 'MK 500,000 – MK 1,500,000', level1: 'Cashier or collections officer', level2: 'Finance Manager', days: 'Same day'},
  {band: 'Above MK 1,500,000', level1: 'Finance Manager', level2: 'Administrator', days: 'Same day, dual authorisation'},
  {band: 'Any amount to a new beneficiary', level1: 'Collections officer', level2: 'Finance Manager', days: 'After the security checks'}
];
const TR_SENSITIVE = TR_APPROVALS.filter(a => a.risk === 'High').slice(0, 4).map(a => ({
  id: 'TSA-' + pad(90 + a.amount % 9, 3), txn: a.txn, amount: a.amount, level: a.level,
  reason: 'High-value transfer needs a second signature', status: 'Pending', by: 'STF-009'
}));

/* ---------------- provider connections ---------------- */
const TR_CONNS = [
  {id: 'CON-INT', name: 'Internal account transfer', rail: 'Internal', provider: 'Golden ledger',
   status: 'Connected', latency: 38, uptime: 99.99, webhook: 'not used — posted in-database', signature: 'n/a',
   credential: 'Service role, rotated 12 days ago', lastCheck: TODAY + ' 08:10', environment: 'Production'},
  {id: 'CON-SAV', name: 'Savings account', rail: 'Internal', provider: 'Golden ledger',
   status: 'Connected', latency: 41, uptime: 99.98, webhook: 'not used — posted in-database', signature: 'n/a',
   credential: 'Service role, rotated 12 days ago', lastCheck: TODAY + ' 08:10', environment: 'Production'},
  {id: 'CON-LON', name: 'Loan account', rail: 'Internal', provider: 'Golden ledger',
   status: 'Connected', latency: 44, uptime: 99.97, webhook: 'not used — posted in-database', signature: 'n/a',
   credential: 'Service role, rotated 12 days ago', lastCheck: TODAY + ' 08:11', environment: 'Production'},
  {id: 'CON-AIR', name: 'Airtel Money', rail: 'Mobile money', provider: 'Airtel Malawi',
   status: 'Connected', latency: 620, uptime: 99.42, webhook: 'https://api.goldenloan.mw/hooks/airtel-transfer',
   signature: 'HMAC-SHA256, x-airtel-signature', credential: 'Client key expires in 26 days',
   lastCheck: TODAY + ' 08:14', environment: 'Production'},
  {id: 'CON-TNM', name: 'TNM Mpamba', rail: 'Mobile money', provider: 'TNM Mpamba',
   status: 'Review', latency: 1180, uptime: 98.71, webhook: 'https://api.goldenloan.mw/hooks/tnm-transfer',
   signature: 'HMAC-SHA256, x-mpamba-signature', credential: 'Client key expires in 9 days',
   lastCheck: TODAY + ' 08:14', environment: 'Production'},
  {id: 'CON-BNK', name: 'Bank transfer provider', rail: 'Bank', provider: 'FDH Bank',
   status: 'Connected', latency: 880, uptime: 99.55, webhook: 'https://api.goldenloan.mw/hooks/fdh-transfer',
   signature: 'HMAC-SHA256, x-fdh-signature', credential: 'Certificate valid for 84 days',
   lastCheck: TODAY + ' 08:13', environment: 'Production'},
  {id: 'CON-PGW', name: 'Card payment gateway', rail: 'Gateway', provider: 'PayChangu',
   status: 'Connected', latency: 410, uptime: 99.81, webhook: 'https://api.goldenloan.mw/hooks/paychangu',
   signature: 'HMAC-SHA256, x-paychangu-signature', credential: 'API key valid',
   lastCheck: TODAY + ' 08:12', environment: 'Production'}
];
const TR_CONN_TESTS = TR_CONNS.map(c => ({conn: c.id, name: c.name, when: TODAY + ' 07:' + pad(40 + c.latency % 15, 2),
  result: c.status === 'Connected' ? 'Pass' : 'Slow', latency: c.latency,
  lane: c.rail === 'Mobile money' ? 'Mobile money' : c.rail === 'Bank' ? 'Bank' : 'Internal',
  severity: c.status === 'Connected' ? 'Low' : 'Medium', owner: 'STF-001', region: 'Lilongwe'}));
const TR_WEBHOOKS = TR_TXN.slice(0, 12).map((t, i) => ({
  when: t.when, event: t.method + ' transfer.' + (t.status === 'Failed' ? 'failed' : 'completed'),
  reference: t.ref, signature: i % 8 === 0 ? 'Failed' : 'Verified',
  delivery: i % 9 === 0 ? 'Retry queued' : 'Delivered', attempts: 1 + (i % 3), txn: t.id,
  lane: 'Gateway', severity: i % 8 === 0 ? 'High' : 'Low', owner: 'STF-001', region: 'Lilongwe'
}));
const TR_CONN_ALERTS = [
  {when: TODAY + ' 07:58', what: 'TNM Mpamba latency above 1,000 ms for the third hour',
   severity: 'Medium', status: 'Open', lane: 'Mobile money', owner: 'STF-001', region: 'Lilongwe'},
  {when: addDays(TODAY, -1) + ' 19:12', what: 'Five transfer webhooks failed their signature check',
   severity: 'High', status: 'Acknowledged', lane: 'Gateway', owner: 'STF-009', region: 'Lilongwe'},
  {when: addDays(TODAY, -3) + ' 10:40', what: 'Bank provider certificate within 90 days of expiry',
   severity: 'Low', status: 'Open', lane: 'Bank', owner: 'STF-001', region: 'Lilongwe'}
];

/* ---------------- database ---------------- */
const TR_DB_TABLES = [
  {table: 'customers', rows: CUSTOMERS.length, size: '286 KB', rls: 'Enabled', note: 'A customer reads only their own row', function: 'customer_profile', lastWrite: TODAY + ' 08:12', lane: 'Database', severity: 'Low', owner: 'STF-001', region: 'Frankfurt'},
  {table: 'customer_accounts', rows: TR_ACCOUNTS.length, size: '742 KB', rls: 'Enabled', note: 'Staff by branch, customer by ownership', function: 'account_balance', lastWrite: TODAY + ' 08:14', lane: 'Database', severity: 'Low', owner: 'STF-001', region: 'Frankfurt'},
  {table: 'savings_accounts', rows: TR_SAVINGS.length, size: '388 KB', rls: 'Enabled', note: 'Savings ledger, two withdrawals a month rule', function: 'savings_balance', lastWrite: TODAY + ' 08:14', lane: 'Database', severity: 'Low', owner: 'STF-001', region: 'Frankfurt'},
  {table: 'loans', rows: LOANS.length, size: '1.4 MB', rls: 'Enabled', note: 'A transfer may not edit a loan balance directly', function: 'apply_loan_transfer', lastWrite: TODAY + ' 08:13', lane: 'Database', severity: 'Low', owner: 'STF-001', region: 'Frankfurt'},
  {table: 'transfers', rows: TR_TXN.length, size: '3.1 MB', rls: 'Enabled', note: 'Insert-only, status changed by function', function: 'post_transfer', lastWrite: TODAY + ' 08:15', lane: 'Database', severity: 'Low', owner: 'STF-001', region: 'Frankfurt'},
  {table: 'transfer_beneficiaries', rows: TR_BENEFICIARIES.length, size: '164 KB', rls: 'Enabled', note: 'Customer-owned, verified before use', function: 'add_beneficiary', lastWrite: TODAY + ' 08:09', lane: 'Database', severity: 'Low', owner: 'STF-001', region: 'Frankfurt'},
  {table: 'payments', rows: PAYS.length, size: '5.2 MB', rls: 'Enabled', note: 'A loan transfer writes here too', function: 'post_repayment', lastWrite: TODAY + ' 08:15', lane: 'Database', severity: 'Low', owner: 'STF-001', region: 'Frankfurt'},
  {table: 'transfer_attachments', rows: 96, size: '12 MB', rls: 'Missing policy', note: 'Storage-backed proof uploads', function: 'attach_document', lastWrite: TODAY + ' 07:52', lane: 'Database', severity: 'High', owner: 'STF-001', region: 'Frankfurt'},
  {table: 'ledger_entries', rows: TR_LEDGER.length, size: '4.4 MB', rls: 'Enabled', note: 'Append-only, one debit and one credit per transfer', function: 'write_ledger', lastWrite: TODAY + ' 08:15', lane: 'Database', severity: 'Low', owner: 'STF-001', region: 'Frankfurt'}
];
const TR_DB_FUNCS = [
  {name: 'post_transfer', kind: 'Function', invoker: 'Definer', calls: 361, status: 'Healthy', note: 'Debit, credit, fees, ledger and audit rows in a single transaction', lane: 'Database', severity: 'Low', owner: 'STF-001', region: 'Frankfurt'},
  {name: 'reserve_funds', kind: 'Function', invoker: 'Definer', calls: 288, status: 'Healthy', note: 'Holds the amount while the transfer waits', lane: 'Database', severity: 'Low', owner: 'STF-001', region: 'Frankfurt'},
  {name: 'apply_loan_transfer', kind: 'Function', invoker: 'Definer', calls: 96, status: 'Healthy', note: 'Applies an eligible transfer to a loan balance', lane: 'Database', severity: 'Low', owner: 'STF-001', region: 'Frankfurt'},
  {name: 'reverse_transfer', kind: 'Function', invoker: 'Definer', calls: 18, status: 'Review', note: 'Writes the opposite entries and restores the balance', lane: 'Database', severity: 'Medium', owner: 'STF-001', region: 'Frankfurt'},
  {name: 'detect_duplicate_transfer', kind: 'Trigger', invoker: 'Definer', calls: 361, status: 'Healthy', note: 'Rejects a reference seen inside the window', lane: 'Database', severity: 'Low', owner: 'STF-001', region: 'Frankfurt'},
  {name: 'reconcile_transfer', kind: 'Function', invoker: 'Definer', calls: 74, status: 'Healthy', note: 'Checks the debit and the credit against the ledger', lane: 'Database', severity: 'Low', owner: 'STF-001', region: 'Frankfurt'}
];
const TR_DB_ERRORS = [
  {when: TODAY + ' 07:52', code: '23505', message: 'duplicate key value violates unique constraint "transfers_provider_reference_key"', count: 3, status: 'Open', lane: 'Database', severity: 'High', owner: 'STF-001', region: 'Frankfurt'},
  {when: addDays(TODAY, -1) + ' 19:20', code: '42501', message: 'permission denied for table transfer_attachments', count: 6, status: 'Open', lane: 'Database', severity: 'High', owner: 'STF-001', region: 'Frankfurt'},
  {when: addDays(TODAY, -2) + ' 11:04', code: '40001', message: 'could not serialize access due to concurrent update', count: 2, status: 'Resolved', lane: 'Database', severity: 'Medium', owner: 'STF-001', region: 'Frankfurt'},
  {when: addDays(TODAY, -3) + ' 16:48', code: '23514', message: 'new row for relation "transfers" violates check constraint "amount_positive"', count: 1, status: 'Resolved', lane: 'Database', severity: 'Medium', owner: 'STF-001', region: 'Frankfurt'}
];
const trNetLabel = v => (Math.abs(v) < 1 ? 'Balanced at MK 0' : 'Out by MK ' + num(Math.abs(v)));
const TR_DB_CHECKS = () => [
  {check: 'Every completed transfer has a debit and a credit', value: 'Matched to the cent', status: 'Pass'},
  {check: 'Debits and credits net to zero', value: trNetLabel(sum(TR_LEDGER, e => e.amount)),
   status: Math.abs(sum(TR_LEDGER, e => e.amount)) < 1 ? 'Pass' : 'Fail'},
  {check: 'Account balance equals the ledger sum', value: TR_DISCREPANCY.length + ' account(s) differ', status: TR_DISCREPANCY.length ? 'Fail' : 'Pass'},
  {check: 'No transfer without a provider reference', value: 'Every row carries one', status: 'Pass'},
  {check: 'Duplicate provider references', value: TR_DUPLICATES.length + ' group(s) held', status: TR_DUPLICATES.length ? 'Fail' : 'Pass'},
  {check: 'Row-level security on the transfer tables', value: TR_DB_TABLES.filter(t => t.rls !== 'Enabled').length + ' table without a policy', status: TR_DB_TABLES.some(t => t.rls !== 'Enabled') ? 'Fail' : 'Pass'},
  {check: 'Schema version matches the app', value: '2026.10.30.1', status: 'Pass'},
  {check: 'Orphan ledger entries', value: 'None', status: 'Pass'}
];
const TR_MIGRATIONS = [
  {id: '20261030_05', name: 'add transfers and transfer_beneficiaries', when: addDays(TODAY, -2) + ' 07:44', status: 'Applied', lane: 'Database', severity: 'Low', owner: 'STF-001', region: 'Frankfurt'},
  {id: '20261023_02', name: 'index transfers(provider_reference)', when: addDays(TODAY, -9) + ' 09:12', status: 'Applied', lane: 'Database', severity: 'Low', owner: 'STF-001', region: 'Frankfurt'},
  {id: '20261016_01', name: 'dual authorisation trigger', when: addDays(TODAY, -16) + ' 18:26', status: 'Applied', lane: 'Database', severity: 'Low', owner: 'STF-001', region: 'Frankfurt'},
  {id: '20261009_03', name: 'check constraint amount_positive', when: addDays(TODAY, -23) + ' 10:02', status: 'Applied', lane: 'Database', severity: 'Low', owner: 'STF-001', region: 'Frankfurt'},
  {id: '20261101_01', name: 'enable RLS on transfer_attachments', when: addDays(TODAY, -1) + ' 06:00', status: 'Pending', lane: 'Database', severity: 'High', owner: 'STF-001', region: 'Frankfurt'}
];

/* ---------------- reports ---------------- */
const TR_REPORTS = [
  {key: 'daily', title: 'Daily Transfer Report', desc: 'Every transfer today, by method and officer'},
  {key: 'weekly', title: 'Weekly Transfer Report', desc: 'The last seven days against the limits'},
  {key: 'monthly', title: 'Monthly Transfer Report', desc: 'Volume and value per month with the fees'},
  {key: 'method', title: 'Transfers by Payment Method', desc: 'Internal, savings, loan, bank and mobile money'},
  {key: 'customer', title: 'Transfers by Customer', desc: 'Who is moving money, and how often'},
  {key: 'staff', title: 'Transfers by Staff Member', desc: 'What each officer created and approved'},
  {key: 'highValue', title: 'High-Value Transfer Report', desc: 'Everything above the approval threshold'},
  {key: 'failed', title: 'Failed and Reversed Transfer Report', desc: 'Failures, rejections and reversals with the reason'},
  {key: 'fees', title: 'Transfer Fees Report', desc: 'Fees charged per method, and who paid'},
  {key: 'reconciliation', title: 'Reconciliation Report', desc: 'Ledger against account balance, account by account'},
  {key: 'beneficiaries', title: 'Beneficiary Report', desc: 'Saved beneficiaries, their state and their checks'},
  {key: 'authorised', title: 'Authorised Transfer Report', desc: 'Every approval, who gave it and when'}
];

/* ---------------- change history ---------------- */
const TR_CHANGES = [
  {when: TODAY + ' 08:12', what: 'Bank transfer fee', area: 'Fees', from: '0.75% + MK 3,000', to: '0.9% + MK 3,500', by: 'STF-001'},
  {when: TODAY + ' 08:02', what: 'Approval threshold', area: 'Approvals', from: 'MK 400,000', to: 'MK 500,000', by: 'STF-009'},
  {when: addDays(TODAY, -1) + ' 17:40', what: 'Per-customer daily limit', area: 'Limits', from: 'MK 4,000,000', to: 'MK 6,000,000', by: 'STF-001'},
  {when: addDays(TODAY, -2) + ' 09:15', what: 'Duplicate window', area: 'Processing', from: '5 minutes', to: '10 minutes', by: 'STF-009'},
  {when: addDays(TODAY, -4) + ' 14:22', what: 'Receipt numbering', area: 'Receipts', from: 'TRP-#####', to: 'TRC-#####', by: 'STF-001'},
  {when: addDays(TODAY, -6) + ' 11:30', what: 'Third-party internal transfers', area: 'Security', from: 'Off', to: 'On', by: 'STF-009'}
];
const TR_AUDIT = [];

/* ---------------- keep everything inside the reporting window ---------------- */
[TR_ACCOUNTS, TR_TXN, TR_BENEFICIARIES, TR_VERIFY, TR_VERIFY_HISTORY, TR_APPROVALS, TR_APPROVAL_HISTORY,
 TR_LEDGER, TR_ADJUST, TR_REVERSALS, TR_RECEIPTS, TR_RECEIPT_CORRECTIONS, TR_NOTIFY_LOG, TR_ID_CHECKS,
 TR_FRAUD, TR_BEN_CHANGES, TR_DB_TABLES, TR_DB_ERRORS, TR_CHANGES, TR_MIGRATIONS, TR_FEE_HISTORY,
 TR_CONN_ALERTS].forEach(list => list.forEach(r => {
  ['when', 'requested', 'added', 'lastUsed', 'lastMove', 'lastWrite', 'effective', 'lastCheck'].forEach(k => {
    const v = r[k];
    if(typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v) && v.slice(0, 10) > TODAY)
      r[k] = addDays(TODAY, -1) + v.slice(10);
  });
}));
TR_TXN.sort((a, b) => String(b.when).localeCompare(String(a.when)));

/* ---------------- status counts and headline stats ---------------- */
const TR_STATUS_COUNTS = () => {
  const c = {total: TR_TXN.length};
  TR_STATUSES.forEach(s => { c[s.toLowerCase().replace(/ /g, '_')] = TR_TXN.filter(t => t.status === s).length; });
  return c;
};
function trStats(){
  const c = TR_STATUS_COUNTS();
  const completed = TR_TXN.filter(t => t.status === 'Completed');
  const pending = TR_TXN.filter(t => ['Pending verification', 'Pending approval'].includes(t.status));
  const fees = sum(completed, t => t.fee);
  const suspended = TR_ACCOUNTS.filter(a => a.status === 'Suspended').length;
  const score = clamp(100
    - TR_TXN.filter(t => t.status === 'Failed').length * 1.2
    - pending.length * 0.8
    - TR_DISCREPANCY.length * 4
    - TR_DUPLICATES.length * 2
    - suspended * 2
    - TR_DB_TABLES.filter(t => t.rls !== 'Enabled').length * 5
    - TR_CONNS.filter(x => x.status !== 'Connected').length * 3, 0, 100);
  return {
    total: c.total,
    deposits: 0,
    drafts: c.draft || 0,
    pendingVerification: TR_TXN.filter(t => t.status === 'Pending verification').length,
    pendingApproval: TR_TXN.filter(t => t.status === 'Pending approval').length,
    approved: TR_TXN.filter(t => t.status === 'Approved').length,
    processing: c.processing || 0,
    completed: c.completed || 0,
    failed: c.failed || 0,
    rejected: c.rejected || 0,
    cancelled: c.cancelled || 0,
    reversed: c.reversed || 0,
    pending: pending.length,
    totalAmount: sum(completed, t => t.amount),
    todayCount: TR_TXN.filter(t => String(t.when).slice(0, 10) === TODAY).length,
    todayAmount: sum(TR_TXN.filter(t => String(t.when).slice(0, 10) === TODAY && t.status === 'Completed'), t => t.amount),
    internal: TR_TXN.filter(t => ['Internal', 'Savings', 'Loan'].includes(t.type)).length,
    external: TR_TXN.filter(t => ['Bank', 'Mobile'].includes(t.type)).length,
    fees,
    beneficiaries: TR_BENEFICIARIES.length,
    accounts: TR_ACCOUNTS.length,
    savings: TR_SAVINGS.length,
    suspended,
    availableTotal: sum(TR_ACCOUNTS, a => a.available),
    reservedTotal: sum(TR_ACCOUNTS, a => a.reserved),
    score
  };
}

/* ---------------- colours shared by the charts ---------------- */
const TR_COLOURS = {
  'Internal transfer': '#2F6FED', 'Savings transfer': '#0E9AA7', 'Loan transfer': '#7C5CF0',
  'Bank transfer': '#C9A227', 'Airtel Money': '#D93F3F', 'TNM Mpamba': '#3A7BD5', 'Card gateway': '#8A6D0F'
};
</script>
