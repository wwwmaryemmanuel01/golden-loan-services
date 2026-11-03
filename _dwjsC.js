<script>
/* ============================================================
   DEPOSITS & WITHDRAWALS MANAGEMENT & CONNECTIONS (3/7)
   The data universe: settings, customer accounts, deposits,
   withdrawals, verification, approvals, ledger, limits, fees,
   reversals, receipts, notifications, fraud and the database.
   ============================================================ */

/* ---------------- settings ---------------- */
const DW_SET_DEFAULTS = {
  currency: 'MWK', currencyLabel: 'Malawian Kwacha (MWK)', currencySymbol: 'MK', decimals: 2,
  depositPrefix: 'DEP', withdrawalPrefix: 'WDR', receiptPrefix: 'RCT', receiptDigits: 5, receiptYear: true,
  minDeposit: 500, maxDeposit: 5000000, minWithdrawal: 1000, maxWithdrawal: 3000000,
  dailyDepositLimit: 8000000, dailyWithdrawalLimit: 8000000, perCustomerDailyLimit: 6000000,
  approvalThreshold: 500000, secondApprovalThreshold: 1500000,
  depositFeePct: 0, depositFeeFlat: 0, withdrawalFeePct: 1.2, withdrawalFeeFlat: 500,
  feePayer: 'Customer', duplicateWindow: 10, autoVerifyDeposits: true, autoApproveSmallWithdrawals: false,
  requireIdentityForWithdrawal: true, notifySms: true, notifyEmail: true, sandbox: false,
  depositRule: 'Reference, amount, method and provider confirmation must all agree before a deposit is posted',
  withdrawalRule: 'Identity, available balance and limits checked, then two approvals above MK 500,000',
  settlementWindow: 'Deposits settle instantly; withdrawals settle within 30 minutes'
};
const DW_SET = Object.assign({}, DW_SET_DEFAULTS);

/* ---------------- customer accounts ---------------- */
const DW_ACCOUNT_TYPES = ['Savings', 'Wallet', 'Current', 'Loan-linked'];
const DW_ACCOUNTS = CUSTOMERS.map((c, i) => {
  const type = DW_ACCOUNT_TYPES[i % DW_ACCOUNT_TYPES.length];
  const opened = addMonths(TODAY, -(4 + (i % 20)));
  const opening = 5000 + ri(0, 40) * 5000;
  const suspended = i === 7 || i === 22;
  return {
    id: 'ACC-' + pad(1001 + i, 4), cust: c.id, type, currency: 'MWK', opened,
    status: suspended ? 'Suspended' : 'Active', opening, available: opening, reserved: 0, ledger: opening,
    lastMove: addDays(TODAY, -(i % 9)),
    lane: 'Accounts', severity: suspended ? 'High' : 'Low', owner: 'STF-001', region: c.region
  };
});
const DW_ACC_BY_ID = Object.fromEntries(DW_ACCOUNTS.map(a => [a.id, a]));
const DW_ACC_BY_CUST = {};
DW_ACCOUNTS.forEach(a => { if(!DW_ACC_BY_CUST[a.cust]) DW_ACC_BY_CUST[a.cust] = a; });

/* ---------------- deposits and withdrawals ---------------- */
const DW_METHODS = [
  {method: 'Airtel Money', provider: 'Airtel Malawi', refPrefix: 'MM', lane: 'Mobile money', kind: 'Mobile money'},
  {method: 'TNM Mpamba', provider: 'TNM Mpamba', refPrefix: 'MM', lane: 'Mobile money', kind: 'Mobile money'},
  {method: 'Bank transfer', provider: 'FDH Bank', refPrefix: 'BNK', lane: 'Bank', kind: 'Bank transfer'},
  {method: 'Cash', provider: 'Branch counter', refPrefix: 'CSH', lane: 'Cash', kind: 'Cash'},
  {method: 'Card gateway', provider: 'PayChangu', refPrefix: 'GW', lane: 'Gateway', kind: 'Gateway'}
];
const DW_DESTINATIONS = ['Airtel 0991 000 111', 'TNM 0888 000 222', 'FDH 0123 4567 8901',
  'Standard 0999 8877 6655', 'NBS 0444 3322 1100'];
const DW_STATUSES = ['Pending', 'Processing', 'Completed', 'Failed', 'Rejected', 'Cancelled', 'Reversed'];

const DW_TXN = [];
let dwDepSeq = 5101, dwWdrSeq = 7101;
CUSTOMERS.forEach((c, ci) => {
  const acc = DW_ACC_BY_CUST[c.id];
  if(!acc) return;
  const count = 4 + (ci % 6);
  for(let k = 0; k < count; k++){
    const isDeposit = rnd() < 0.62;
    const methodInfo = isDeposit
      ? DW_METHODS[Math.floor(rnd() * DW_METHODS.length)]
      : DW_METHODS[Math.floor(rnd() * 3)];      /* withdrawals never come in as cash card charges */
    /* the newest customers carry the last week, so today always has movement */
    const back = ci < 20 ? ri(0, 6) : ri(0, 320);
    const when = addDays(TODAY, -back) + ' ' + pad(ri(7, 18), 2) + ':' + pad(ri(0, 59), 2);
    const amount = Math.round((isDeposit ? 15000 + rnd() * 585000 : 10000 + rnd() * 390000) / 500) * 500;
    let status = 'Completed';
    const roll = rnd();
    if(back <= 3 && roll < 0.26) status = 'Pending';
    else if(back <= 6 && roll < 0.36) status = 'Processing';
    else if(roll > 0.94) status = 'Failed';
    else if(roll > 0.9) status = 'Rejected';
    else if(roll > 0.87) status = 'Reversed';
    const fee = isDeposit
      ? Math.round(amount * DW_SET.depositFeePct / 100) + DW_SET.depositFeeFlat
      : Math.round(amount * DW_SET.withdrawalFeePct / 100) + DW_SET.withdrawalFeeFlat;
    const loan = LOANS[ci % LOANS.length];
    DW_TXN.push({
      id: (isDeposit ? 'DEP-' : 'WDR-') + pad(isDeposit ? dwDepSeq++ : dwWdrSeq++, 6),
      type: isDeposit ? 'Deposit' : 'Withdrawal',
      when, cust: c.id, account: acc.id, loan: k % 3 === 0 ? loan.ref : '',
      method: methodInfo.method, provider: methodInfo.provider,
      ref: methodInfo.refPrefix + '-' + pad(ri(100000, 999999), 6),
      amount, fee, currency: 'MWK', status,
      stage: status === 'Pending' ? 'Awaiting confirmation' : status === 'Processing' ? 'At the provider'
        : status === 'Completed' ? 'Posted to the ledger' : status === 'Failed' ? 'Provider refused'
        : status === 'Rejected' ? 'Refused by an officer' : status === 'Cancelled' ? 'Withdrawn by the customer'
        : 'Reversal posted',
      source: rnd() < 0.55 ? 'Customer' : 'Staff',
      officer: pick(STAFF.filter(s => ['Cashier', 'Collections Officer', 'Loan Officer', 'Finance Manager'].includes(s.role))).id,
      proof: isDeposit && rnd() < 0.4 ? 'POP-' + pad(ri(100, 999), 4) + '.pdf' : '',
      destination: isDeposit ? '' : pick(DW_DESTINATIONS),
      identity: isDeposit ? 'N/A' : (rnd() < 0.86 ? 'Verified' : 'Pending'),
      approval: isDeposit ? 'Not required' : (amount > DW_SET.secondApprovalThreshold ? 'Two approvals'
        : amount > DW_SET.approvalThreshold ? 'First level' : 'Not required'),
      notes: '',
      lane: isDeposit ? 'Deposits' : 'Withdrawals', severity: status === 'Failed' || status === 'Rejected' ? 'High'
        : status === 'Pending' || status === 'Processing' ? 'Medium' : 'Low',
      owner: 'STF-001', region: c.region
    });
  }
});
DW_TXN.sort((a, b) => String(b.when).localeCompare(String(a.when)));
const DW_DEPOSITS = DW_TXN.filter(t => t.type === 'Deposit');
const DW_WITHDRAWALS = DW_TXN.filter(t => t.type === 'Withdrawal');

/* ---------------- account balances derived from the completed movements ---------------- */
DW_ACCOUNTS.forEach(a => {
  const mine = DW_TXN.filter(t => t.account === a.id && t.status === 'Completed');
  const deposits = sum(mine.filter(t => t.type === 'Deposit'), t => t.amount);
  const withdrawals = sum(mine.filter(t => t.type === 'Withdrawal'), t => t.amount + t.fee);
  const pendingW = DW_TXN.filter(t => t.account === a.id && t.type === 'Withdrawal'
    && (t.status === 'Pending' || t.status === 'Processing'));
  a.available = Math.max(0, a.opening + deposits - withdrawals - a.reserved);
  a.reserved = sum(pendingW, t => t.amount);
  a.ledger = a.available + a.reserved;
  a.deposits = deposits;
  a.withdrawals = withdrawals;
  if(a.available < 0) a.available = 0;
});
/* a couple of deliberately short balances so the limit checks bite */
DW_ACCOUNTS[3].available = 18000;
DW_ACCOUNTS[3].ledger = 18000;
DW_ACCOUNTS[11].available = 42000;
DW_ACCOUNTS[11].ledger = 42000;

/* ---------------- deposit verification queue ---------------- */
const DW_VERIFY = DW_DEPOSITS.filter(t => t.status === 'Pending' || t.status === 'Processing').slice(0, 14)
  .map((t, i) => {
    const expected = t.amount;
    const seen = i % 5 === 0 ? expected - 5000 : expected;
    return {
      id: 'DVR-' + pad(410 + i, 3), txn: t.id, ref: t.ref, when: t.when, cust: t.cust, account: t.account,
      method: t.method, amount: t.amount, expected: seen, providerRef: t.ref,
      proof: t.proof || 'No proof uploaded',
      checks: {
        reference: true,
        amount: expected === seen,
        method: true,
        proof: !!t.proof,
        provider: i % 4 !== 0,
        duplicate: !DW_DEPOSITS.some(d => d.ref === t.ref && d.id !== t.id)
      },
      status: 'Pending', notes: '', lane: 'Deposits', severity: i % 5 === 0 ? 'High' : 'Medium',
      owner: 'STF-001', region: CUST_BY_ID[t.cust] ? CUST_BY_ID[t.cust].region : 'Lilongwe'
    };
  });
const DW_VERIFY_HISTORY = DW_VERIFY.slice(0, 5).map((v, i) => ({
  when: addDays(TODAY, -(i + 1)) + ' 1' + i + ':20', ref: v.ref, action: i === 2 ? 'Rejected' : 'Approved',
  by: i % 2 ? 'STF-001' : 'STF-009', notes: i === 2 ? 'Amount on the provider line did not match the deposit slip'
    : 'Reference, amount and provider confirmation all agreed'
}));
const DW_DUPES = (() => {
  const seen = {};
  DW_DEPOSITS.forEach(d => { seen[d.ref] = seen[d.ref] || []; seen[d.ref].push(d); });
  return Object.keys(seen).filter(k => seen[k].length > 1).slice(0, 4).map(k => ({
    ref: k, count: seen[k].length, amount: sum(seen[k], d => d.amount),
    ids: seen[k].map(d => d.id).join(' · '), status: 'Held'
  }));
})();

/* ---------------- withdrawal approvals ---------------- */
const DW_APPROVALS = DW_WITHDRAWALS.filter(t => t.status === 'Pending' || t.status === 'Processing')
  .slice(0, 12).map((t, i) => ({
    id: 'APR-' + pad(310 + i, 3), txn: t.id, ref: t.ref, when: t.when, cust: t.cust, account: t.account,
    amount: t.amount, fee: t.fee, method: t.method, destination: t.destination,
    level: t.amount > DW_SET.secondApprovalThreshold ? 'Management' : 'First level',
    level1: t.amount > DW_SET.secondApprovalThreshold ? 'Approved' : 'Pending',
    level2: 'Pending', identity: t.identity || 'Verified',
    balance: (DW_ACC_BY_ID[t.account] || {available: 0}).available,
    risk: i % 6 === 5 ? 'High' : i % 4 === 0 ? 'Medium' : 'Low',
    status: 'Pending', notes: '', lane: 'Withdrawals', severity: i % 6 === 5 ? 'High' : 'Medium',
    owner: 'STF-001', region: CUST_BY_ID[t.cust] ? CUST_BY_ID[t.cust].region : 'Lilongwe'
  }));
const DW_APPROVAL_HISTORY = DW_APPROVALS.slice(0, 5).map((a, i) => ({
  when: addDays(TODAY, -(i + 1)) + ' 1' + i + ':05', ref: a.ref, action: i === 3 ? 'Rejected' : 'Approved',
  level: i === 3 ? 'First level' : 'Management', by: i % 2 ? 'STF-009' : 'STF-001',
  notes: i === 3 ? 'Balance would have been breached by a second withdrawal the same day'
    : 'Identity checked, balance and limits clear'
}));
const DW_RISK = DW_APPROVALS.map(a => ({
  ref: a.ref, cust: a.cust, amount: a.amount,
  checks: [
    ['Customer identity verified', a.identity === 'Verified'],
    ['Account is active', (DW_ACC_BY_ID[a.account] || {}).status === 'Active'],
    ['Available balance covers the amount and fee', a.balance >= a.amount + a.fee],
    ['Inside the daily limit', a.amount <= DW_SET.dailyWithdrawalLimit],
    ['Inside the per-customer limit', a.amount <= DW_SET.perCustomerDailyLimit],
    ['No duplicate request in the window', !DW_WITHDRAWALS.some(w => w.ref === a.ref && w.id !== a.txn)]
  ],
  score: a.risk
}));

/* ---------------- deposit corrections ---------------- */
const DW_CORRECTIONS = [
  {id: 'DCR-021', ref: DW_DEPOSITS[1] ? DW_DEPOSITS[1].ref : 'MM-100234', when: addDays(TODAY, -1) + ' 14:10',
   field: 'Amount', from: 'MK 120,000', to: 'MK 125,000', reason: 'Slip read a zero as a six',
   by: 'STF-007', status: 'Approved'},
  {id: 'DCR-020', ref: DW_DEPOSITS[3] ? DW_DEPOSITS[3].ref : 'BNK-440118', when: addDays(TODAY, -3) + ' 09:35',
   field: 'Linked loan', from: 'LN-2410', to: 'LN-2411', reason: 'Customer quoted the wrong loan',
   by: 'STF-001', status: 'Pending'},
  {id: 'DCR-019', ref: DW_DEPOSITS[5] ? DW_DEPOSITS[5].ref : 'CSH-778812', when: addDays(TODAY, -6) + ' 16:02',
   field: 'Payment method', from: 'Cash', to: 'Airtel Money', reason: 'Recorded against the wrong method',
   by: 'STF-011', status: 'Approved'}
];

/* ---------------- ledger ---------------- */
const DW_LEDGER = [];
DW_TXN.filter(t => t.status === 'Completed' || t.status === 'Reversed').slice(0, 90).forEach((t, i) => {
  DW_LEDGER.push({
    entry: 'LED-' + pad(7100 + i, 5), when: t.when, account: t.account, cust: t.cust, txn: t.id,
    kind: t.type === 'Deposit' ? 'Credit' : 'Debit',
    amount: t.type === 'Deposit' ? t.amount : -(t.amount + t.fee),
    balance: 0, source: t.method, status: t.status === 'Reversed' ? 'Reversed' : 'Posted',
    lane: 'Ledger', severity: 'Low', owner: 'STF-001', region: CUST_BY_ID[t.cust] ? CUST_BY_ID[t.cust].region : 'Lilongwe'
  });
});
/* running balance per account, oldest first */
const ledByAcc = {};
DW_LEDGER.slice().sort((a, b) => String(a.when).localeCompare(String(b.when))).forEach(e => {
  ledByAcc[e.account] = (ledByAcc[e.account] || (DW_ACC_BY_ID[e.account] || {opening: 0}).opening) + e.amount;
  const row = DW_LEDGER.find(x => x.entry === e.entry);
  if(row) row.balance = ledByAcc[e.account];
});
const DW_DISCREPANCY = [
  {account: DW_ACCOUNTS[3].id, cust: DW_ACCOUNTS[3].cust, ledger: DW_ACCOUNTS[3].ledger, system: DW_ACCOUNTS[3].available,
   difference: DW_ACCOUNTS[3].ledger - DW_ACCOUNTS[3].available, severity: 'High',
   note: 'Reserved withdrawal funds not reflected in the available balance'},
  {account: DW_ACCOUNTS[11].id, cust: DW_ACCOUNTS[11].cust, ledger: DW_ACCOUNTS[11].ledger, system: DW_ACCOUNTS[11].available,
   difference: DW_ACCOUNTS[11].ledger - DW_ACCOUNTS[11].available, severity: 'Medium',
   note: 'A pending deposit was counted twice after a retry'}
];
const DW_ADJUST = [
  {id: 'ADJ-118', when: addDays(TODAY, -2) + ' 17:40', account: DW_ACCOUNTS[3].id, amount: 5000,
   reason: 'Rounding difference on a cash deposit', by: 'STF-001', approver: 'STF-009', status: 'Approved'},
  {id: 'ADJ-117', when: addDays(TODAY, -5) + ' 11:15', account: DW_ACCOUNTS[11].id, amount: -2000,
   reason: 'Withdrawal fee duplicated on the ledger', by: 'STF-009', approver: 'STF-001', status: 'Pending'}
];

/* ---------------- limits and fees ---------------- */
const DW_LIMITS = DW_METHODS.map((m, i) => ({
  method: m.method, provider: m.provider,
  depMin: i === 3 ? 500 : 1000, depMax: i === 2 ? 15000000 : i === 3 ? 500000 : 2000000,
  wdrMin: 1000, wdrMax: i === 3 ? 300000 : 1500000,
  dailyDeposit: 8000000, dailyWithdrawal: 5000000, providerCeiling: i === 0 ? 6000000 : 10000000,
  effective: addMonths(TODAY, -(2 + i))
}));
const DW_FEES = DW_METHODS.map((m, i) => ({
  method: m.method,
  depositPct: i === 2 ? 0 : i === 4 ? 1.5 : 0, depositFlat: i === 2 ? 2500 : 0,
  withdrawalPct: i === 3 ? 0 : 1.2, withdrawalFlat: i === 3 ? 1000 : 500,
  payer: i === 2 ? 'Company' : 'Customer', effective: addMonths(TODAY, -(1 + i))
}));
const DW_FEE_HISTORY = [
  {when: addDays(TODAY, -3) + ' 10:20', scope: 'Withdrawal fee · Airtel Money', from: '1.0% + MK 400', to: '1.2% + MK 500', by: 'STF-001'},
  {when: addDays(TODAY, -12) + ' 09:05', scope: 'Deposit limit · Bank transfer', from: 'MK 10,000,000', to: 'MK 15,000,000', by: 'STF-009'},
  {when: addDays(TODAY, -26) + ' 15:44', scope: 'Per-customer daily limit', from: 'MK 4,000,000', to: 'MK 6,000,000', by: 'STF-001'},
  {when: addDays(TODAY, -41) + ' 08:30', scope: 'Cash withdrawal fee', from: 'MK 500', to: 'MK 1,000', by: 'STF-009'}
];
const DW_DAILY = MONTHS12.slice(-7).map((m, i) => ({
  day: addDays(TODAY, -(6 - i)), label: fmtShort(addDays(TODAY, -(6 - i))),
  deposits: 0, withdrawals: 0, limit: 5000000
}));
DW_DAILY.forEach(d => {
  d.deposits = sum(DW_DEPOSITS.filter(t => t.when.slice(0, 10) === d.day && t.status === 'Completed'), t => t.amount);
  d.withdrawals = sum(DW_WITHDRAWALS.filter(t => t.when.slice(0, 10) === d.day && t.status === 'Completed'), t => t.amount);
});

/* ---------------- reversals and refunds ---------------- */
const DW_REVERSALS = [
  {id: 'RVS-214', txn: DW_TXN[0] ? DW_TXN[0].id : 'DEP-000000', type: 'Deposit', ref: DW_TXN[0] ? DW_TXN[0].ref : 'MM-1',
   amount: DW_TXN[0] ? DW_TXN[0].amount : 50000, reason: 'Duplicate deposit — the same slip was posted twice',
   requested: addDays(TODAY, -2) + ' 10:12', by: 'STF-007', approver: 'STF-009', status: 'Approved',
   lane: 'Reversals', severity: 'High', owner: 'STF-007', region: 'Lilongwe'},
  {id: 'RVS-213', txn: DW_WITHDRAWALS[0] ? DW_WITHDRAWALS[0].id : 'WDR-000000', type: 'Withdrawal',
   ref: DW_WITHDRAWALS[0] ? DW_WITHDRAWALS[0].ref : 'MM-2', amount: DW_WITHDRAWALS[0] ? DW_WITHDRAWALS[0].amount : 80000,
   reason: 'Provider refused the payout after we debited the ledger',
   requested: addDays(TODAY, -4) + ' 15:30', by: 'STF-001', approver: 'STF-009', status: 'Pending',
   lane: 'Reversals', severity: 'High', owner: 'STF-001', region: 'Blantyre'},
  {id: 'RVS-212', txn: DW_TXN[2] ? DW_TXN[2].id : 'DEP-000002', type: 'Deposit',
   ref: DW_TXN[2] ? DW_TXN[2].ref : 'BNK-3', amount: DW_TXN[2] ? DW_TXN[2].amount : 240000,
   reason: 'Bank reversed the credit two days later',
   requested: addDays(TODAY, -9) + ' 08:05', by: 'STF-001', approver: 'STF-001', status: 'Posted',
   lane: 'Reversals', severity: 'Medium', owner: 'STF-001', region: 'Mzuzu'}
];
const DW_REFUNDS = [
  {id: 'RFN-072', txn: DW_WITHDRAWALS[1] ? DW_WITHDRAWALS[1].id : 'WDR-000001', cust: DW_WITHDRAWALS[1] ? DW_WITHDRAWALS[1].cust : CUSTOMERS[0].id,
   amount: DW_WITHDRAWALS[1] ? DW_WITHDRAWALS[1].amount : 60000, reason: 'Failed payout — return the funds to the account',
   eligible: 'Yes — the debit posted but the payout failed', status: 'Pending', requested: addDays(TODAY, -1) + ' 11:40'},
  {id: 'RFN-071', txn: DW_TXN[4] ? DW_TXN[4].id : 'DEP-000004', cust: DW_TXN[4] ? DW_TXN[4].cust : CUSTOMERS[1].id,
   amount: DW_TXN[4] ? DW_TXN[4].amount : 90000, reason: 'Customer overpaid a deposit', eligible: 'Yes — the amount is above the loan balance',
   status: 'Approved', requested: addDays(TODAY, -6) + ' 16:20'}
];
const DW_DUP_RESOLUTION = DW_DUPES.map((d, i) => ({
  ref: d.ref, deposits: d.count, amount: d.amount, action: i % 2 ? 'Reverse the second posting' : 'Held pending proof',
  by: 'STF-001', status: i % 2 ? 'Resolved' : 'Open'
}));
const DW_FAIL_RECOVERY = DW_WITHDRAWALS.filter(t => t.status === 'Failed').slice(0, 5).map((t, i) => ({
  ref: t.ref, txn: t.id, cust: t.cust, amount: t.amount, reason: t.method === 'Airtel Money' ? 'Provider timed out after the debit'
    : t.method === 'Bank transfer' ? 'Beneficiary account name mismatch' : 'Agent float exhausted',
  recovery: i % 2 ? 'Returned to the account' : 'Waiting on the provider', status: i % 2 ? 'Recovered' : 'Pending'
}));
const DW_REV_AUDIT = DW_REVERSALS.concat(DW_REFUNDS.map(r => ({id: r.id, type: 'Refund', ref: r.txn, amount: r.amount,
  reason: r.reason, requested: r.requested, by: 'STF-001', status: r.status, severity: 'Medium'})))
  .sort((a, b) => String(b.requested).localeCompare(String(a.requested)));

/* ---------------- receipts ---------------- */
const DW_RECEIPTS = DW_TXN.filter(t => t.status === 'Completed').slice(0, 80).map((t, i) => ({
  receipt: DW_SET.receiptPrefix + '-' + pad(2100 + i, DW_SET.receiptDigits), txn: t.id, ref: t.ref,
  when: t.when, cust: t.cust, account: t.account, type: t.type, amount: t.amount, fee: t.fee,
  method: t.method, issued: i % 9 === 0 ? 'Reissued' : 'Automatic', status: 'Issued',
  lane: 'Receipts', severity: 'Low', owner: 'STF-001', region: CUST_BY_ID[t.cust] ? CUST_BY_ID[t.cust].region : 'Lilongwe'
}));
const DW_RECEIPT_CORRECTIONS = [
  {id: 'RCR-014', receipt: DW_RECEIPTS[3] ? DW_RECEIPTS[3].receipt : 'RCT-02103', when: addDays(TODAY, -2) + ' 12:04',
   field: 'Customer name', from: 'G. Mponda', to: 'Grace Mponda', reason: 'Initalled instead of the full name',
   by: 'STF-007', status: 'Approved'},
  {id: 'RCR-013', receipt: DW_RECEIPTS[7] ? DW_RECEIPTS[7].receipt : 'RCT-02107', when: addDays(TODAY, -5) + ' 09:18',
   field: 'Amount', from: 'MK 45,000', to: 'MK 54,000', reason: 'Digits transposed on the slip',
   by: 'STF-011', status: 'Approved'}
];

/* ---------------- notifications ---------------- */
const DW_CHANNELS = {
  sms: {provider: 'Africa’s Talking', sender: 'GOLDENFS', balance: 9820, status: 'Connected', latency: 690, credential: 'Expires in 21 days', lastSend: TODAY + ' 08:04'},
  email: {provider: 'Resend', sender: 'transactions@goldenloan.mw', balance: '47,110 of 50,000', status: 'Connected', latency: 212, credential: 'Valid', lastSend: TODAY + ' 08:11'}
};
const DW_NOTIFY_RULES = [
  {event: 'Deposit received', sms: true, email: true, to: 'Customer', template: 'DEP_RECD', on: true},
  {event: 'Deposit confirmed', sms: true, email: true, to: 'Customer', template: 'DEP_OK', on: true},
  {event: 'Deposit rejected', sms: true, email: true, to: 'Customer', template: 'DEP_NO', on: true},
  {event: 'Withdrawal requested', sms: true, email: false, to: 'Customer', template: 'WDR_REQ', on: true},
  {event: 'Withdrawal approved', sms: true, email: true, to: 'Customer', template: 'WDR_APR', on: true},
  {event: 'Withdrawal completed', sms: true, email: true, to: 'Customer', template: 'WDR_DONE', on: true},
  {event: 'Withdrawal failed', sms: true, email: true, to: 'Customer and staff', template: 'WDR_FAIL', on: true},
  {event: 'Transaction reversed', sms: true, email: true, to: 'Customer and staff', template: 'TXN_REV', on: true}
];
const DW_NOTIFY_LOG = [];
DW_TXN.slice(0, 26).forEach((t, i) => {
  const rule = DW_NOTIFY_RULES[i % DW_NOTIFY_RULES.length];
  DW_NOTIFY_LOG.push({when: t.when, event: rule.event, channel: i % 3 === 0 ? 'Email' : 'SMS',
    to: custName(t.cust), reference: t.type === 'Deposit' ? t.id : t.id,
    status: i % 11 === 0 ? 'Failed' : i % 7 === 0 ? 'Queued' : 'Delivered',
    lane: 'Notifications', severity: 'Low', owner: 'STF-005', region: CUST_BY_ID[t.cust] ? CUST_BY_ID[t.cust].region : 'Lilongwe'});
});

/* ---------------- fraud and security ---------------- */
const DW_ID_CHECKS = DW_WITHDRAWALS.slice(0, 8).map((t, i) => ({
  ref: t.ref, cust: t.cust, doc: ['National ID', 'Passport', 'Driver licence'][i % 3],
  number: 'MW' + pad(ri(100000, 999999), 6), checked: i % 5 === 0 ? 'Pending' : 'Verified',
  by: i % 5 === 0 ? '—' : (i % 2 ? 'STF-007' : 'STF-001'), when: addDays(TODAY, -(i + 1)) + ' 10:00'
}));
const DW_FRAUD = [
  {when: addDays(TODAY, -1) + ' 21:12', event: 'Three deposits of the same amount within 20 minutes',
   subject: CUSTOMERS[5].id, severity: 'High', status: 'Investigating', lane: 'Security', owner: 'STF-009', region: 'Lilongwe'},
  {when: addDays(TODAY, -2) + ' 07:40', event: 'Withdrawal to a destination never used before', subject: CUSTOMERS[9].id,
   severity: 'Medium', status: 'Open', lane: 'Security', owner: 'STF-001', region: 'Blantyre'},
  {when: addDays(TODAY, -4) + ' 13:25', event: 'Duplicate provider reference on two deposits', subject: DW_DUPES[0] ? DW_DUPES[0].ref : 'MM-1',
   severity: 'High', status: 'Resolved', lane: 'Security', owner: 'STF-001', region: 'Mzuzu'},
  {when: addDays(TODAY, -7) + ' 18:02', event: 'Account number changed, then a withdrawal attempted', subject: CUSTOMERS[17].id,
   severity: 'Critical', status: 'Investigating', lane: 'Security', owner: 'STF-009', region: 'Zomba'}
];
const DW_VELOCITY = CUSTOMERS.slice(0, 10).map((c, i) => ({
  cust: c.id, withdrawals24h: 1 + (i % 4), limit: 3,
  amount24h: 20000 + i * 37000, amountLimit: DW_SET.perCustomerDailyLimit,
  status: (1 + (i % 4)) > 3 ? 'Breach' : 'Within limit'
}));
const DW_AMOUNT_ALERTS = DW_TXN.filter(t => t.amount > 400000).slice(0, 6).map((t, i) => ({
  txn: t.id, ref: t.ref, type: t.type, cust: t.cust, amount: t.amount,
  threshold: DW_SET.approvalThreshold, band: i % 2 ? 'Above the approval threshold' : 'Unusual for this customer',
  status: i % 3 === 0 ? 'Cleared' : 'Flagged'
}));
const DW_ACC_CHANGES = [
  {when: addDays(TODAY, -7) + ' 17:58', cust: CUSTOMERS[17].id, field: 'Payout destination',
   from: 'Airtel 0991 000 111', to: 'TNM 0888 444 555', by: 'STF-007', status: 'Unverified'},
  {when: addDays(TODAY, -13) + ' 09:12', cust: CUSTOMERS[4].id, field: 'Mobile number',
   from: '0991 222 333', to: '0991 222 334', by: 'STF-001', status: 'Verified'},
  {when: addDays(TODAY, -19) + ' 14:40', cust: CUSTOMERS[21].id, field: 'Bank account',
   from: 'FDH 0123 4567 8901', to: 'NBS 0444 3322 1100', by: 'STF-011', status: 'Verified'}
];
const DW_ROLES = ['Super Admin', 'Administrator', 'Finance Manager', 'Cashier', 'Collections Officer', 'Auditor'];
const DW_CAPS = ['Record deposits', 'Verify deposits', 'Create withdrawals', 'First-level approval',
  'Management approval', 'Reverse a transaction', 'Change limits and fees', 'View the audit log'];
const DW_PERMS = {
  'Super Admin': [1,1,1,1,1,1,1,1],
  'Administrator': [1,1,1,1,1,1,1,1],
  'Finance Manager': [1,1,1,1,1,1,0,1],
  'Cashier': [1,0,1,0,0,0,0,0],
  'Collections Officer': [1,1,1,0,0,0,0,0],
  'Auditor': [0,0,0,0,0,0,0,1]
};
const DW_ROLE_STAFF = {'Super Admin':'STF-001','Administrator':'STF-009','Finance Manager':'STF-006',
  'Cashier':'STF-007','Collections Officer':'STF-012','Auditor':'STF-016'};
const DW_APPROVAL_THRESHOLDS = [
  {band: 'Up to MK 500,000', level1: 'One cashier', level2: 'Not required', days: 'Immediate'},
  {band: 'MK 500,000 – MK 1,500,000', level1: 'Cashier or collections officer', level2: 'Finance Manager', days: 'Same day'},
  {band: 'Above MK 1,500,000', level1: 'Finance Manager', level2: 'Administrator', days: 'Same day, two signatures'},
  {band: 'Any amount on a suspended account', level1: 'Finance Manager', level2: 'Administrator', days: 'After the account is reviewed'}
];

/* ---------------- database ---------------- */
const DW_DB_TABLES = [
  {table: 'customer_accounts', rows: DW_ACCOUNTS.length, size: '412 KB', rls: 'Enabled', note: 'Customer reads their own account, staff by branch', function: 'account_balance', lastWrite: TODAY + ' 08:12'},
  {table: 'deposits', rows: DW_DEPOSITS.length, size: '2.9 MB', rls: 'Enabled', note: 'Insert-only, verified by a second officer', function: 'post_deposit', lastWrite: TODAY + ' 08:14'},
  {table: 'withdrawals', rows: DW_WITHDRAWALS.length, size: '2.4 MB', rls: 'Enabled', note: 'Two approvals recorded before the debit', function: 'post_withdrawal', lastWrite: TODAY + ' 08:14'},
  {table: 'payment_receipts', rows: 402, size: '4.8 MB', rls: 'Enabled', note: 'Shares the payment register', function: 'issue_receipt', lastWrite: TODAY + ' 08:14'},
  {table: 'ledger_entries', rows: DW_LEDGER.length, size: '3.6 MB', rls: 'Enabled', note: 'Append-only, never updated', function: 'write_ledger', lastWrite: TODAY + ' 08:15'},
  {table: 'transaction_proofs', rows: 128, size: '18 MB', rls: 'Missing policy', note: 'Storage-backed, one row per upload', function: 'attach_proof', lastWrite: TODAY + ' 07:52'},
  {table: 'transaction_audit', rows: 1184, size: '1.8 MB', rls: 'Enabled', note: 'Written by every function', function: 'audit_write', lastWrite: TODAY + ' 08:15'},
  {table: 'deposit_corrections', rows: DW_CORRECTIONS.length, size: '96 KB', rls: 'Enabled', note: 'Finance Manager only', function: 'request_correction', lastWrite: TODAY + ' 07:40'}
];
const DW_DB_FUNCS = [
  {name: 'post_deposit', kind: 'Function', invoker: 'Definer', calls: 402, status: 'Healthy', note: 'Writes the deposit, the ledger credit and the audit row in one transaction'},
  {name: 'post_withdrawal', kind: 'Function', invoker: 'Definer', calls: 288, status: 'Healthy', note: 'Debits the ledger only after both approvals land'},
  {name: 'account_balance', kind: 'Function', invoker: 'Invoker', calls: 1740, status: 'Healthy', note: 'Available, reserved and ledger balance in one call'},
  {name: 'reverse_transaction', kind: 'Function', invoker: 'Definer', calls: 21, status: 'Review', note: 'Writes the opposite ledger entry and reopens the balance'},
  {name: 'detect_duplicate', kind: 'Trigger', invoker: 'Definer', calls: 402, status: 'Healthy', note: 'Rejects a provider reference seen inside the window'},
  {name: 'reconcile_account', kind: 'Function', invoker: 'Definer', calls: 60, status: 'Healthy', note: 'Compares the ledger sum to the stored balance'}
];
const DW_DB_ERRORS = [
  {when: TODAY + ' 07:52', code: '23505', message: 'duplicate key value violates unique constraint "deposits_provider_reference_key"', count: 3, status: 'Open', lane: 'Database', severity: 'High', owner: 'STF-001', region: 'Frankfurt'},
  {when: addDays(TODAY, -1) + ' 19:20', code: '42501', message: 'permission denied for table transaction_proofs', count: 7, status: 'Open', lane: 'Database', severity: 'High', owner: 'STF-001', region: 'Frankfurt'},
  {when: addDays(TODAY, -2) + ' 11:04', code: '40001', message: 'could not serialize access due to concurrent update', count: 2, status: 'Resolved', lane: 'Database', severity: 'Medium', owner: 'STF-001', region: 'Frankfurt'},
  {when: addDays(TODAY, -3) + ' 16:48', code: '23514', message: 'new row for relation "withdrawals" violates check constraint "amount_positive"', count: 1, status: 'Resolved', lane: 'Database', severity: 'Medium', owner: 'STF-001', region: 'Frankfurt'}
];
const DW_DB_CHECKS = [
  {check: 'Every deposit has a ledger credit', value: sum(DW_DEPOSITS.filter(d => d.status === 'Completed'), d => d.amount) === 0 ? 'No deposits' : 'Matched to the cent', status: 'Pass'},
  {check: 'Every completed withdrawal has a ledger debit', value: 'Matched to the cent', status: 'Pass'},
  {check: 'Account balance equals the ledger sum', value: DW_DISCREPANCY.length + ' account(s) differ', status: DW_DISCREPANCY.length ? 'Fail' : 'Pass'},
  {check: 'No transaction without a provider reference', value: 'Every row carries one', status: 'Pass'},
  {check: 'Duplicate provider references', value: DW_DUPES.length + ' group(s) held', status: DW_DUPES.length ? 'Fail' : 'Pass'},
  {check: 'Row-level security on the payment tables', value: '1 table without a policy', status: 'Fail'},
  {check: 'Schema version matches the app', value: '2026.10.28.1', status: 'Pass'},
  {check: 'Orphan ledger entries', value: 'None', status: 'Pass'}
];
const DW_MIGRATIONS = [
  {id: '20261028_04', name: 'add customer_accounts and ledger_entries', when: addDays(TODAY, -2) + ' 07:44', status: 'Applied'},
  {id: '20261021_02', name: 'index deposits(provider_reference)', when: addDays(TODAY, -9) + ' 09:12', status: 'Applied'},
  {id: '20261014_01', name: 'withdrawal two-approval trigger', when: addDays(TODAY, -16) + ' 18:26', status: 'Applied'},
  {id: '20261007_03', name: 'check constraint amount_positive', when: addDays(TODAY, -23) + ' 10:02', status: 'Applied'},
  {id: '20261101_01', name: 'enable RLS on transaction_proofs', when: addDays(TODAY, -1) + ' 06:00', status: 'Pending'}
];

/* ---------------- reports ---------------- */
const DW_REPORTS = [
  {key: 'dailyDeposits', title: 'Daily Deposits Report', desc: 'Every deposit received today, by method and officer'},
  {key: 'dailyWithdrawals', title: 'Daily Withdrawals Report', desc: 'Every withdrawal processed today, with its approvals'},
  {key: 'periodic', title: 'Weekly and Monthly Summary', desc: 'Deposits and withdrawals by period, against the limits'},
  {key: 'depositMethod', title: 'Deposits by Payment Method', desc: 'Volume and value per rail, with the fees'},
  {key: 'withdrawalMethod', title: 'Withdrawals by Payment Method', desc: 'Payouts per rail, with the failures'},
  {key: 'depositCustomer', title: 'Deposits by Customer', desc: 'Who is putting money in, and how often'},
  {key: 'withdrawalCustomer', title: 'Withdrawals by Customer', desc: 'Who is taking money out, against their limits'},
  {key: 'pending', title: 'Pending Transactions Report', desc: 'Everything waiting on a confirmation or an approval'},
  {key: 'failed', title: 'Failed Transactions Report', desc: 'Failed, rejected and cancelled transactions with the reason'},
  {key: 'reconciliation', title: 'Reconciliation Report', desc: 'Ledger against account balance, account by account'},
  {key: 'fees', title: 'Transaction Fees Report', desc: 'Deposit and withdrawal fees collected, and who paid'},
  {key: 'authorised', title: 'Authorised Transaction Report', desc: 'Every approval, who gave it and when'}
];

/* ---------------- change history ---------------- */
const DW_CHANGES = [
  {when: TODAY + ' 08:12', what: 'Withdrawal fee · Airtel Money', area: 'Fees', from: '1.0% + MK 400', to: '1.2% + MK 500', by: 'STF-001'},
  {when: TODAY + ' 08:02', what: 'Approval threshold', area: 'Approvals', from: 'MK 400,000', to: 'MK 500,000', by: 'STF-009'},
  {when: addDays(TODAY, -1) + ' 17:40', what: 'Per-customer daily limit', area: 'Limits', from: 'MK 4,000,000', to: 'MK 6,000,000', by: 'STF-001'},
  {when: addDays(TODAY, -2) + ' 09:15', what: 'Duplicate window', area: 'Processing', from: '5 minutes', to: '10 minutes', by: 'STF-009'},
  {when: addDays(TODAY, -4) + ' 14:22', what: 'Receipt numbering', area: 'Receipts', from: 'RCP-#####', to: 'RCT-#####', by: 'STF-001'},
  {when: addDays(TODAY, -6) + ' 11:30', what: 'Identity required for withdrawals', area: 'Security', from: 'Off', to: 'On', by: 'STF-009'}
];

/* ---------------- keep everything inside the reporting window ---------------- */
[DW_ACCOUNTS, DW_TXN, DW_DEPOSITS, DW_WITHDRAWALS, DW_VERIFY, DW_VERIFY_HISTORY, DW_APPROVALS,
 DW_APPROVAL_HISTORY, DW_CORRECTIONS, DW_LEDGER, DW_ADJUST, DW_REVERSALS, DW_REFUNDS, DW_RECEIPTS,
 DW_RECEIPT_CORRECTIONS, DW_NOTIFY_LOG, DW_ID_CHECKS, DW_FRAUD, DW_ACC_CHANGES, DW_DB_TABLES,
 DW_DB_ERRORS, DW_CHANGES, DW_MIGRATIONS, DW_FEE_HISTORY].forEach(list => list.forEach(r => {
  ['when', 'requested', 'opened', 'lastMove', 'lastWrite', 'effective'].forEach(k => {
    const v = r[k];
    if(typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v) && v.slice(0, 10) > TODAY)
      r[k] = addDays(TODAY, -1) + v.slice(10);
  });
}));
DW_TXN.sort((a, b) => String(b.when).localeCompare(String(a.when)));

/* ---------------- status counts and headline stats ---------------- */
const DW_STATUS_COUNTS = () => {
  const c = {total: DW_TXN.length};
  DW_STATUSES.forEach(s => { c[s.toLowerCase()] = DW_TXN.filter(t => t.status === s).length; });
  return c;
};
function dwStats(){
  const c = DW_STATUS_COUNTS();
  const dep = DW_TXN.filter(t => t.type === 'Deposit');
  const wdr = DW_TXN.filter(t => t.type === 'Withdrawal');
  const completedDep = dep.filter(t => t.status === 'Completed');
  const completedWdr = wdr.filter(t => t.status === 'Completed');
  const today = TODAY;
  const pendingDep = dep.filter(t => t.status === 'Pending' || t.status === 'Processing');
  const pendingWdr = wdr.filter(t => t.status === 'Pending' || t.status === 'Processing');
  const totalDep = sum(completedDep, t => t.amount);
  const totalWdr = sum(completedWdr, t => t.amount);
  const fees = sum(DW_TXN.filter(t => t.status === 'Completed'), t => t.fee);
  const accounts = DW_ACCOUNTS.length;
  const suspended = DW_ACCOUNTS.filter(a => a.status === 'Suspended').length;
  const score = clamp(100
    - (c.failed || 0) * 1.2
    - (c.pending || 0) * 0.8
    - DW_DISCREPANCY.length * 4
    - DW_DUPES.length * 2
    - suspended * 2
    - DW_DB_TABLES.filter(t => t.rls !== 'Enabled').length * 5, 0, 100);
  return {
    total: c.total, deposits: dep.length, withdrawals: wdr.length,
    completed: c.completed || 0, pending: c.pending || 0, processing: c.processing || 0,
    failed: c.failed || 0, rejected: c.rejected || 0, cancelled: c.cancelled || 0, reversed: c.reversed || 0,
    totalDeposits: totalDep, totalWithdrawals: totalWdr, net: totalDep - totalWdr, fees,
    depToday: sum(dep.filter(t => t.when.slice(0, 10) === today && t.status === 'Completed'), t => t.amount),
    wdrToday: sum(wdr.filter(t => t.when.slice(0, 10) === today && t.status === 'Completed'), t => t.amount),
    pendingDep: pendingDep.length, pendingWdr: pendingWdr.length,
    approved: DW_APPROVAL_HISTORY.filter(a => a.action === 'Approved').length,
    accounts, suspended, score,
    availableTotal: sum(DW_ACCOUNTS, a => a.available), reservedTotal: sum(DW_ACCOUNTS, a => a.reserved)
  };
}

/* ---------------- colours shared by the charts ---------------- */
const DW_COLOURS = {
  'Airtel Money': '#D93F3F', 'TNM Mpamba': '#2F6FED', 'Bank transfer': '#0E9AA7',
  'Cash': '#C9A227', 'Card gateway': '#7C5CF0'
};
</script>
