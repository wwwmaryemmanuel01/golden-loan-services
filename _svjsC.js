<script>
/* ============================================================
   SAVINGS MANAGEMENT & CONNECTIONS (3/8)
   The data universe: settings, savings products, customer and
   savings accounts, deposits, withdrawals, transfers, interest
   accrual, goals, beneficiaries, the ledger, limits and fees,
   receipts, notifications, dormancy, fraud, the provider
   connections, the database and the reports.
   ============================================================ */

/* ---------------- settings ---------------- */
const SV_SET_DEFAULTS = {
  currency: 'MWK', currencyLabel: 'Malawian Kwacha (MWK)', currencySymbol: 'MK', decimals: 2,
  accountPrefix: 'SAV', accountDigits: 4, numberRule: 'Branch code, product code, then a sequence',
  interestRate: 6.5, rateType: 'Fixed', compounding: 'Monthly', accrualBasis: 'Daily balance',
  postingSchedule: 'Last day of the month', minBalance: 5000, minOpening: 10000,
  minDeposit: 500, maxDeposit: 4000000, dailyWithdrawalLimit: 2000000, perCustomerDailyLimit: 3000000,
  approvalThreshold: 200000, secondApprovalThreshold: 800000,
  maintenanceFee: 2500, withdrawalFeePct: 0.5, withdrawalFeeFlat: 1000, transferFeeFlat: 500,
  earlyPenaltyPct: 2.5, dormantDays: 180, dormancyFee: 5000,
  duplicateWindow: 10, lowBalanceThreshold: 10000, goalReminderDays: 7, notifySms: true, notifyEmail: true,
  allowThirdPartyTransfers: true, requireIdentityForWithdrawal: true, sandbox: false,
  depositRule: 'A deposit is credited to available balance only after verification, and a duplicate reference inside ten minutes is held',
  withdrawalRule: 'Identity checked, available balance and daily limits applied, then one approval up to MK 200,000 and two above it',
  interestRule: 'Interest accrues daily on the closing balance, compounds monthly and is posted on the last day of the month; the minimum balance must be held for the whole month',
  dormantRule: 'An account with no customer movement for 180 days becomes dormant: deposits are allowed, withdrawals need a branch visit and identity re-verification'
};
const SV_SET = Object.assign({}, SV_SET_DEFAULTS);

/* ---------------- savings products ---------------- */
const SV_PRODUCTS = [
  {id: 'PRD-STD', name: 'Standard Savings', kind: 'Standard', rate: 6.5, rateType: 'Fixed',
   minOpening: 10000, minBalance: 5000, frequency: 'Any time', withdrawal: 'Any time, two free withdrawals a month',
   availability: 'All branches', status: 'Open', terms: 'Interest accrues daily and posts monthly; a withdrawal below the minimum balance is refused',
   opened: 0, accounts: 0, lane: 'Products', severity: 'Low'},
  {id: 'PRD-FT6', name: 'Fixed-Term Savings · 6 months', kind: 'Fixed-term', rate: 9.5, rateType: 'Fixed',
   minOpening: 50000, minBalance: 50000, frequency: 'Any time', withdrawal: 'At maturity; early withdrawal carries a 2.5% penalty',
   availability: 'All branches', status: 'Open', terms: 'Funds are locked for six months; interest is paid at maturity',
   opened: 0, accounts: 0, lane: 'Products', severity: 'Low'},
  {id: 'PRD-FT12', name: 'Fixed-Term Savings · 12 months', kind: 'Fixed-term', rate: 11.5, rateType: 'Fixed',
   minOpening: 100000, minBalance: 100000, frequency: 'Any time', withdrawal: 'At maturity; early withdrawal carries a 2.5% penalty',
   availability: 'All branches', status: 'Open', terms: 'Funds are locked for twelve months; interest is paid at maturity',
   opened: 0, accounts: 0, lane: 'Products', severity: 'Low'},
  {id: 'PRD-GOAL', name: 'Goal-Based Savings', kind: 'Goal-based', rate: 7.5, rateType: 'Variable',
   minOpening: 5000, minBalance: 2000, frequency: 'At least once a month', withdrawal: 'Towards the goal only, until the target date',
   availability: 'All branches and mobile', status: 'Open', terms: 'A goal is set at opening; withdrawals before the target date need a manager',
   opened: 0, accounts: 0, lane: 'Products', severity: 'Low'},
  {id: 'PRD-JUN', name: 'Junior Savings', kind: 'Standard', rate: 8, rateType: 'Fixed',
   minOpening: 2000, minBalance: 1000, frequency: 'Any time', withdrawal: 'With a guardian present',
   availability: 'Selected branches', status: 'Open', terms: 'Opened for a minor with a guardian; withdrawals need the guardian',
   opened: 0, accounts: 0, lane: 'Products', severity: 'Low'},
  {id: 'PRD-BIZ', name: 'Business Savings', kind: 'Standard', rate: 5.5, rateType: 'Variable',
   minOpening: 25000, minBalance: 10000, frequency: 'Any time', withdrawal: 'Any time, one free withdrawal a month',
   availability: 'All branches', status: 'Paused', terms: 'For registered businesses; the minimum balance is higher and the rate follows the market',
   opened: 0, accounts: 0, lane: 'Products', severity: 'Medium'}
];
const SV_PROD_BY_ID = Object.fromEntries(SV_PRODUCTS.map(p => [p.id, p]));

/* ---------------- customer accounts ---------------- */
const SV_ACCOUNTS = [];
CUSTOMERS.forEach((c, i) => {
  ['Savings', 'Current'].forEach((type, k) => {
    const idx = i * 2 + k;
    const prod = type === 'Savings' ? SV_PRODUCTS[idx % 5 === 4 ? 4 : idx % 4] : null;
    const opening = type === 'Savings' ? 2000 + ri(0, 40) * 5000 : 5000 + ri(0, 30) * 7500;
    const suspended = idx === 23 || idx === 66;
    const dormant = !suspended && idx % 17 === 3;
    SV_ACCOUNTS.push({
      id: (type === 'Savings' ? SV_SET.accountPrefix + '-' : 'CUR-') + pad(1001 + idx, 4),
      cust: c.id, type, product: prod ? prod.id : '', productName: prod ? prod.name : 'Current account',
      currency: 'MWK', opened: addMonths(TODAY, -(6 + (idx % 30))),
      status: suspended ? 'Suspended' : dormant ? 'Dormant' : idx % 23 === 5 ? 'Restricted' : 'Active',
      opening, available: opening, reserved: 0, ledger: opening,
      interestRate: prod ? prod.rate : 0, rateType: prod ? prod.rateType : '—',
      minBalance: prod ? prod.minBalance : 0,
      restriction: suspended ? 'Suspended by compliance'
        : dormant ? 'Dormant — identity re-verification required'
        : type === 'Savings' ? (prod && prod.kind === 'Fixed-term' ? 'Fixed term, early withdrawal penalised'
          : prod && prod.kind === 'Goal-based' ? 'Goal-based, withdrawals need approval' : 'None') : 'None',
      verified: idx % 19 === 7 ? 'Unverified' : 'Verified',
      idType: ['National ID', 'Passport', 'Driver licence'][idx % 3],
      idNumber: 'MW' + pad(ri(100000, 999999), 6),
      phone: '+265 99' + ri(100, 999) + ' ' + pad(ri(1000, 9999), 4),
      email: c.name.toLowerCase().replace(/[^a-z]+/g, '.') + '@mail.mw',
      lastMove: addDays(TODAY, -(idx % 12 === 0 ? 200 + (idx % 90) : idx % 30)),
      inTotal: 0, outTotal: 0, interestPaid: 0,
      lane: suspended || dormant ? 'Dormant' : type === 'Savings' ? 'Savings' : 'Accounts',
      severity: suspended ? 'High' : dormant ? 'Medium' : 'Low',
      owner: 'STF-001', region: c.region
    });
  });
});
const SV_ACC_BY_ID = Object.fromEntries(SV_ACCOUNTS.map(a => [a.id, a]));
const SV_ACC_OF_CUST = (cust, type) => SV_ACCOUNTS.find(a => a.cust === cust && a.type === type);
const SV_SAVINGS = SV_ACCOUNTS.filter(a => a.type === 'Savings');

/* ---------------- transactions ---------------- */
const SV_TXN = [];
let svSeq = 2001;
const SV_STATUSES = ['Pending verification', 'Pending approval', 'Approved', 'Processing', 'Completed',
  'Failed', 'Rejected', 'Cancelled', 'Reversed'];
const SV_KINDS = ['Deposit', 'Withdrawal', 'Transfer', 'Interest credit', 'Adjustment'];
const SV_METHODS = [
  {method: 'Airtel Money', rail: 'Mobile money', provider: 'Airtel Malawi', prefix: 'AMT', lane: 'Mobile money', direction: 'Both'},
  {method: 'TNM Mpamba', rail: 'Mobile money', provider: 'TNM Mpamba', prefix: 'TNM', lane: 'Mobile money', direction: 'Both'},
  {method: 'Bank transfer', rail: 'Bank', provider: 'FDH Bank', prefix: 'BNK', lane: 'Bank', direction: 'Both'},
  {method: 'Cash', rail: 'Cash', provider: 'Branch counter', prefix: 'CSH', lane: 'Cash', direction: 'Both'},
  {method: 'Internal transfer', rail: 'Internal', provider: 'Golden ledger', prefix: 'INT', lane: 'Internal', direction: 'Internal'},
  {method: 'Interest posting', rail: 'Internal', provider: 'Golden ledger', prefix: 'INT', lane: 'Interest', direction: 'Credit only'}
];
const SV_METHOD_BY_NAME = Object.fromEntries(SV_METHODS.map(m => [m.method, m]));
const SV_COLOURS = {'Deposit': '#1E9E6A', 'Withdrawal': '#C9A227', 'Transfer': '#2F6FED',
  'Interest credit': '#0E9AA7', 'Adjustment': '#7C5CF0'};

CUSTOMERS.forEach((c, ci) => {
  const sav = SV_ACC_OF_CUST(c.id, 'Savings');
  const cur = SV_ACC_OF_CUST(c.id, 'Current');
  if(!sav || !cur) return;
  const count = 5 + (ci % 4);
  for(let k = 0; k < count; k++){
    const back = ci < 20 ? ri(0, 6) : ri(0, 320);
    const when = addDays(TODAY, -back) + ' ' + pad(ri(7, 18), 2) + ':' + pad(ri(0, 59), 2);
    const roll = rnd();
    const kind = roll < 0.44 ? 'Deposit' : roll < 0.74 ? 'Withdrawal' : roll < 0.88 ? 'Transfer'
      : roll < 0.95 ? 'Interest credit' : 'Adjustment';
    const method = kind === 'Deposit' ? pick(['Airtel Money', 'TNM Mpamba', 'Bank transfer', 'Cash'])
      : kind === 'Withdrawal' ? pick(['Airtel Money', 'TNM Mpamba', 'Bank transfer', 'Cash'])
      : kind === 'Transfer' ? 'Internal transfer' : kind === 'Interest credit' ? 'Interest posting' : 'Internal transfer';
    const meta = SV_METHOD_BY_NAME[method];
    let status = 'Completed';
    const s = rnd();
    if(kind === 'Interest credit') status = 'Completed';
    else if(kind === 'Adjustment') status = rnd() < 0.5 ? 'Completed' : 'Pending approval';
    else if(back <= 3 && s < 0.24) status = 'Pending verification';
    else if(back <= 5 && s < 0.36) status = 'Pending approval';
    else if(back <= 6 && s < 0.44) status = 'Processing';
    else if(s > 0.955) status = 'Failed';
    else if(s > 0.93) status = 'Rejected';
    else if(s > 0.905) status = 'Cancelled';
    else if(s > 0.88) status = 'Reversed';
    const amount = kind === 'Interest credit' ? Math.round(150 + rnd() * 24000)
      : Math.round((4000 + rnd() * 460000) / 500) * 500;
    const fee = kind === 'Withdrawal' ? Math.round(amount * SV_SET.withdrawalFeePct / 100) + SV_SET.withdrawalFeeFlat
      : kind === 'Transfer' ? SV_SET.transferFeeFlat : 0;
    const source = kind === 'Deposit' || kind === 'Interest credit' ? (method === 'Bank transfer' ? 'External bank' : 'External wallet')
      : sav.id;
    const dest = kind === 'Withdrawal' ? (method === 'Cash' ? 'Branch cash' : method === 'Bank transfer' ? 'External bank' : 'External wallet')
      : kind === 'Transfer' ? cur.id : sav.id;
    SV_TXN.push({
      id: (status === 'Pending verification' ? 'PND-' : 'SVX-') + pad(svSeq++, 5),
      kind, method, provider: meta.provider, rail: meta.rail,
      when, cust: c.id, source, dest,
      destName: kind === 'Withdrawal' ? (method === 'Cash' ? 'Counter payout' : c.name) : custName(c.id),
      account: sav.id,
      amount, fee, currency: 'MWK',
      ref: meta.prefix + '-' + pad(ri(100000, 999999), 6),
      description: kind === 'Deposit' ? 'Savings deposit' : kind === 'Withdrawal' ? 'Savings withdrawal'
        : kind === 'Transfer' ? 'Transfer to the current account' : kind === 'Interest credit' ? 'Monthly interest posting'
        : 'Balance adjustment',
      status,
      stage: status === 'Completed' ? 'Posted to the ledger' : status === 'Pending verification' ? 'Awaiting verification'
        : status === 'Pending approval' ? 'Awaiting approval' : status === 'Approved' ? 'Approved, not yet posted'
        : status === 'Processing' ? 'At the provider' : status === 'Failed' ? 'The provider refused it'
        : status === 'Rejected' ? 'Refused by an officer' : status === 'Cancelled' ? 'Withdrawn by the customer'
        : 'Reversal posted',
      initiatedBy: rnd() < 0.55 ? 'Customer' : pick(STAFF.filter(x => ['Cashier', 'Collections Officer'].includes(x.role))).id,
      officer: pick(STAFF.filter(x => ['Cashier', 'Collections Officer', 'Finance Manager'].includes(x.role))).id,
      verifiedBy: status === 'Pending verification' ? '' : (rnd() < 0.8 ? 'STF-001' : 'STF-009'),
      approvedBy: ['Approved', 'Processing', 'Completed', 'Reversed'].includes(status) ? (rnd() < 0.6 ? 'STF-009' : 'STF-001') : '',
      proof: kind === 'Deposit' && rnd() < 0.45 ? 'PROOF-' + pad(ri(100, 999), 3) + '.pdf' : '',
      notes: '', goal: '', interestRate: kind === 'Interest credit' ? sav.interestRate : 0,
      daysHeld: kind === 'Interest credit' ? ri(28, 31) : 0,
      lane: kind === 'Interest credit' ? 'Interest' : meta.lane,
      severity: ['Failed', 'Rejected'].includes(status) ? 'High'
        : ['Pending verification', 'Pending approval', 'Approved', 'Processing'].includes(status) ? 'Medium' : 'Low',
      owner: 'STF-001', region: c.region
    });
  }
});
SV_TXN.sort((a, b) => String(b.when).localeCompare(String(a.when)));
const SV_DEPOSITS = SV_TXN.filter(t => t.kind === 'Deposit');
const SV_WITHDRAWALS = SV_TXN.filter(t => t.kind === 'Withdrawal');
const SV_INTEREST = SV_TXN.filter(t => t.kind === 'Interest credit');
const SV_COMPLETED = SV_TXN.filter(t => t.status === 'Completed');
const svByStatus = st => SV_TXN.filter(t => t.status === st);

/* balances follow the transactions */
SV_ACCOUNTS.forEach(a => {
  const inAmt = sum(SV_COMPLETED.filter(t => t.dest === a.id), t => t.amount);
  const outAmt = sum(SV_COMPLETED.filter(t => t.source === a.id), t => t.amount + t.fee);
  const interest = sum(SV_COMPLETED.filter(t => t.dest === a.id && t.kind === 'Interest credit'), t => t.amount);
  const pendingIn = sum(SV_TXN.filter(t => t.dest === a.id && ['Pending verification', 'Pending approval'].includes(t.status)), t => t.amount);
  const reserved = sum(SV_TXN.filter(t => t.source === a.id && ['Pending approval', 'Approved', 'Processing'].includes(t.status)), t => t.amount);
  a.inTotal = inAmt; a.outTotal = outAmt; a.interestPaid = interest;
  a.pendingIn = pendingIn; a.reserved = reserved;
  a.available = Math.max(0, a.opening + inAmt - outAmt - reserved);
  a.ledger = a.available + reserved;
  a.monthlyInterest = Math.round(a.available * a.interestRate / 100 / 12);
});
/* two accounts deliberately short so the discrepancy checks bite */
SV_ACCOUNTS[7].available = 3800; SV_ACCOUNTS[7].opening = 12000;
SV_ACCOUNTS[7].ledger = SV_ACCOUNTS[7].available + SV_ACCOUNTS[7].reserved;
SV_ACCOUNTS[31].ledger = SV_ACCOUNTS[31].available + SV_ACCOUNTS[31].reserved + 4200;

/* ---------------- goals ---------------- */
const SV_GOALS = [];
const GOAL_NAMES = ['School fees 2027', 'House deposit', 'Business stock', 'Emergency fund', 'Wedding',
  'Motorcycle', 'Farm inputs', 'Laptop', 'Rent deposit', 'Solar system', 'Baby fund', 'Land purchase'];
for(let i = 0; i < 20; i++){
  const c = CUSTOMERS[i % CUSTOMERS.length];
  const target = 150000 + i * 90000;
  const saved = Math.round(target * (0.15 + rnd() * 0.8));
  SV_GOALS.push({
    id: 'GOL-' + pad(4100 + i, 4), cust: c.id, account: SV_ACC_OF_CUST(c.id, 'Savings').id,
    name: GOAL_NAMES[i % GOAL_NAMES.length], target,
    saved: Math.min(saved, target),
    targetDate: addDays(TODAY, 30 + i * 18),
    created: addDays(TODAY, -(40 + i * 9)),
    status: saved >= target ? 'Completed' : i % 11 === 9 ? 'Cancelled' : 'Active',
    contributions: 2 + (i % 5),
    lane: 'Goals', severity: 'Low', owner: 'STF-001', region: c.region
  });
}

/* ---------------- beneficiaries ---------------- */
const SV_BENEFICIARIES = [];
for(let i = 0; i < 18; i++){
  const c = CUSTOMERS[(i * 3) % CUSTOMERS.length];
  const kind = ['Internal account', 'Mobile money', 'Bank account'][i % 3];
  SV_BENEFICIARIES.push({
    id: 'SBN-' + pad(3100 + i, 4), cust: c.id,
    name: kind === 'Internal account' ? CUSTOMERS[(i + 5) % CUSTOMERS.length].name : c.name,
    kind,
    account: kind === 'Internal account' ? SV_ACC_OF_CUST(CUSTOMERS[(i + 5) % CUSTOMERS.length].id, 'Savings').id
      : kind === 'Mobile money' ? '0' + pick(['991', '888']) + ' ' + pad(ri(100, 999), 3) + ' ' + pad(ri(100, 999), 3)
      : pick(['FDH', 'NBS', 'Standard']) + ' ' + pad(ri(1000, 9999), 4) + ' ' + pad(ri(1000, 9999), 4),
    verified: i % 6 === 0 ? 'Unverified' : 'Verified',
    status: i % 9 === 0 ? 'Disabled' : 'Enabled',
    added: addDays(TODAY, -(5 + i * 4)), lastUsed: addDays(TODAY, -(i % 7)),
    lane: 'Beneficiaries', severity: i % 6 === 0 ? 'Medium' : 'Low', owner: 'STF-001', region: c.region
  });
}

/* ---------------- verification and approval queues ---------------- */
const SV_VERIFY = SV_TXN.filter(t => t.status === 'Pending verification').slice(0, 12).map((t, i) => ({
  id: 'SVV-' + pad(620 + i, 3), txn: t.id, ref: t.ref, when: t.when, cust: t.cust, account: t.account,
  amount: t.amount, method: t.method, kind: t.kind, proof: t.proof || 'No proof attached',
  checks: {
    customer: true,
    account: true,
    amount: t.amount >= SV_SET.minDeposit && t.amount <= SV_SET.maxDeposit,
    duplicate: !SV_TXN.some(x => x.ref === t.ref && x.id !== t.id),
    proof: t.kind !== 'Deposit' || t.method === 'Cash' ? true : !!t.proof,
    balance: t.kind !== 'Withdrawal' || t.amount <= (SV_ACC_BY_ID[t.account] || {}).available
  },
  status: 'Pending', notes: '', lane: 'Verification', severity: i % 5 === 0 ? 'High' : 'Medium',
  owner: 'STF-001', region: t.region
}));
const SV_VERIFY_HISTORY = SV_VERIFY.slice(0, 6).map((v, i) => ({
  when: addDays(TODAY, -(i + 1)) + ' 1' + i + ':15', ref: v.ref,
  action: i === 2 ? 'Rejected' : 'Verified', by: i % 2 ? 'STF-001' : 'STF-009',
  notes: i === 2 ? 'Proof of payment did not match the amount' : 'Customer, account, amount and proof all agreed'
}));

const SV_APPROVALS = SV_TXN.filter(t => ['Pending approval', 'Approved'].includes(t.status)).slice(0, 12).map((t, i) => ({
  id: 'SVA-' + pad(470 + i, 3), txn: t.id, ref: t.ref, when: t.when, cust: t.cust, account: t.account,
  amount: t.amount, fee: t.fee, method: t.method, kind: t.kind, accountStatus: (SV_ACC_BY_ID[t.account] || {}).status,
  level: t.amount > SV_SET.secondApprovalThreshold ? 'Management' : 'First level',
  level1: 'Pending', level2: 'Pending',
  risk: t.amount > SV_SET.secondApprovalThreshold ? 'High' : i % 4 === 0 ? 'Medium' : 'Low',
  selfApproval: i % 9 === 8, status: 'Pending', notes: '',
  lane: 'Approvals', severity: t.amount > SV_SET.secondApprovalThreshold ? 'High' : 'Medium',
  owner: 'STF-001', region: t.region
}));
const SV_APPROVAL_HISTORY = SV_APPROVALS.slice(0, 6).map((a, i) => ({
  when: addDays(TODAY, -(i + 1)) + ' 1' + i + ':05', ref: a.ref, action: i === 3 ? 'Returned for review' : 'Approved',
  level: i === 3 ? 'First level' : 'Management', by: i % 2 ? 'STF-009' : 'STF-001',
  notes: i === 3 ? 'Sent back: the customer had changed the payout number that morning'
    : 'Balance, limits and the resolved account all agreed'
}));
const SV_RISK = SV_APPROVALS.map(a => ({
  ref: a.ref, cust: a.cust, amount: a.amount,
  checks: [
    ['Account belongs to the customer', true],
    ['Account is open and not suspended', a.accountStatus === 'Active'],
    ['Available balance covers the amount and the fee', true],
    ['Inside the daily withdrawal limit', a.amount <= SV_SET.dailyWithdrawalLimit],
    ['No duplicate reference in the window', true],
    ['Approver is not the officer who raised it', !a.selfApproval]
  ],
  score: a.risk
}));

/* ---------------- failures, reversals, duplicates ---------------- */
const SV_FAILED = SV_TXN.filter(t => t.status === 'Failed').slice(0, 10).map((t, i) => ({
  txn: t.id, ref: t.ref, when: t.when, cust: t.cust, amount: t.amount, method: t.method, kind: t.kind,
  reason: t.method === 'Airtel Money' ? 'Wallet not registered for the payout'
    : t.method === 'TNM Mpamba' ? 'Provider timed out after the debit'
    : t.method === 'Bank transfer' ? 'Beneficiary account name mismatch'
    : 'Branch cash position closed',
  retryable: i % 3 !== 0 ? 'Yes' : 'No — new details needed',
  status: 'Failed', lane: 'Failed', severity: 'High', owner: 'STF-001', region: t.region
}));
const SV_REVERSALS = [
  {id: 'SRV-218', txn: (SV_TXN[2] || SV_TXN[0]).id, ref: (SV_TXN[2] || SV_TXN[0]).ref,
   amount: (SV_TXN[2] || SV_TXN[0]).amount, kind: (SV_TXN[2] || SV_TXN[0]).kind,
   reason: 'Provider refused the payout after the savings account was debited',
   requested: addDays(TODAY, -2) + ' 09:40', by: 'STF-001', approver: 'STF-009', status: 'Pending', restored: 'No',
   lane: 'Reversals', severity: 'High', owner: 'STF-001', region: 'Lilongwe'},
  {id: 'SRV-217', txn: (SV_TXN[5] || SV_TXN[0]).id, ref: (SV_TXN[5] || SV_TXN[0]).ref,
   amount: (SV_TXN[5] || SV_TXN[0]).amount, kind: (SV_TXN[5] || SV_TXN[0]).kind,
   reason: 'Deposit credited twice by the mobile provider callback',
   requested: addDays(TODAY, -6) + ' 14:12', by: 'STF-007', approver: 'STF-009', status: 'Approved', restored: 'No',
   lane: 'Reversals', severity: 'Medium', owner: 'STF-007', region: 'Blantyre'},
  {id: 'SRV-216', txn: (SV_TXN[9] || SV_TXN[0]).id, ref: (SV_TXN[9] || SV_TXN[0]).ref,
   amount: (SV_TXN[9] || SV_TXN[0]).amount, kind: (SV_TXN[9] || SV_TXN[0]).kind,
   reason: 'Customer cancelled after the cash was counted',
   requested: addDays(TODAY, -11) + ' 08:05', by: 'STF-001', approver: 'STF-001', status: 'Posted', restored: 'Yes',
   lane: 'Reversals', severity: 'Medium', owner: 'STF-001', region: 'Mzuzu'}
];
const SV_REV_AUDIT = SV_REVERSALS.slice().sort((a, b) => String(b.requested).localeCompare(String(a.requested)));
const SV_DUPLICATES = (() => {
  const seen = {};
  SV_TXN.forEach(t => { seen[t.ref] = seen[t.ref] || []; seen[t.ref].push(t); });
  return Object.keys(seen).filter(k => seen[k].length > 1).slice(0, 3).map(k => ({
    ref: k, count: seen[k].length, amount: sum(seen[k], t => t.amount),
    ids: seen[k].map(t => t.id).join(' · '), status: 'Held'
  }));
})();

/* ---------------- ledger ---------------- */
const SV_LEDGER = [];
SV_COMPLETED.slice(0, 110).forEach((t, i) => {
  if(t.kind === 'Deposit' || t.kind === 'Interest credit'){
    SV_LEDGER.push({entry: 'SLE-' + pad(9100 + i * 2, 5), when: t.when, account: t.account, cust: t.cust, txn: t.id,
      side: 'Credit', amount: t.amount, balance: 0, kind: t.kind, method: t.method, status: 'Posted',
      lane: t.kind === 'Interest credit' ? 'Interest' : 'Ledger', severity: 'Low', owner: 'STF-001', region: t.region});
    return;
  }
  SV_LEDGER.push({entry: 'SLE-' + pad(9100 + i * 2, 5), when: t.when, account: t.account, cust: t.cust, txn: t.id,
    side: 'Debit', amount: -(t.amount + t.fee), balance: 0, kind: t.kind, method: t.method, status: 'Posted',
    lane: 'Ledger', severity: 'Low', owner: 'STF-001', region: t.region});
  if(t.kind === 'Transfer' && SV_ACC_BY_ID[t.dest]){
    SV_LEDGER.push({entry: 'SLE-' + pad(9101 + i * 2, 5), when: t.when, account: t.dest, cust: t.cust, txn: t.id,
      side: 'Credit', amount: t.amount, balance: 0, kind: t.kind, method: t.method, status: 'Posted',
      lane: 'Ledger', severity: 'Low', owner: 'STF-001', region: t.region});
  }
});
const svLedByAcc = {};
SV_LEDGER.slice().sort((a, b) => String(a.when).localeCompare(String(b.when))).forEach(e => {
  svLedByAcc[e.account] = (svLedByAcc[e.account] || (SV_ACC_BY_ID[e.account] || {opening: 0}).opening) + e.amount;
  const row = SV_LEDGER.find(x => x.entry === e.entry);
  if(row) row.balance = svLedByAcc[e.account];
});
const SV_DISCREPANCY = [
  {account: SV_ACCOUNTS[7].id, cust: SV_ACCOUNTS[7].cust, ledger: SV_ACCOUNTS[7].ledger,
   system: SV_ACCOUNTS[7].available, difference: SV_ACCOUNTS[7].ledger - SV_ACCOUNTS[7].available,
   severity: 'High', note: 'Reserved funds for an approved withdrawal not reflected in the available balance'},
  {account: SV_ACCOUNTS[31].id, cust: SV_ACCOUNTS[31].cust, ledger: SV_ACCOUNTS[31].ledger,
   system: SV_ACCOUNTS[31].available, difference: SV_ACCOUNTS[31].ledger - SV_ACCOUNTS[31].available,
   severity: 'Medium', note: 'An interest posting landed on the ledger but not on the balance'}
];
const SV_ADJUST = [
  {id: 'SAD-108', when: addDays(TODAY, -3) + ' 16:20', account: SV_ACCOUNTS[7].id, amount: 3500,
   reason: 'Rounding on a monthly interest posting', by: 'STF-001', approver: 'STF-009', status: 'Approved',
   lane: 'Ledger', severity: 'Low', owner: 'STF-001', region: 'Lilongwe'},
  {id: 'SAD-107', when: addDays(TODAY, -8) + ' 10:15', account: SV_ACCOUNTS[31].id, amount: -2200,
   reason: 'Maintenance fee charged twice', by: 'STF-009', approver: 'STF-001', status: 'Pending',
   lane: 'Ledger', severity: 'Medium', owner: 'STF-009', region: 'Blantyre'}
];

/* ---------------- limits, fees and penalties ---------------- */
const SV_LIMITS = SV_METHODS.filter(m => m.direction !== 'Credit only').map((m, i) => ({
  method: m.method, rail: m.rail,
  min: m.rail === 'Cash' ? SV_SET.minDeposit : SV_SET.minDeposit,
  max: m.rail === 'Mobile money' ? 3000000 : 4000000,
  daily: m.rail === 'Internal' ? 8000000 : SV_SET.dailyWithdrawalLimit,
  perCustomer: SV_SET.perCustomerDailyLimit,
  effective: addMonths(TODAY, -(1 + i)), lane: m.lane, severity: 'Low', owner: 'STF-001', region: 'Lilongwe'
}));
const SV_FEES = [
  {fee: 'Account maintenance', basis: 'Monthly', amount: SV_SET.maintenanceFee, pct: 0, waived: 6, payer: 'Customer',
    effective: addMonths(TODAY, -4), lane: 'Fees', severity: 'Low', owner: 'STF-001', region: 'Lilongwe'},
  {fee: 'Withdrawal fee', basis: 'Per withdrawal', amount: SV_SET.withdrawalFeeFlat, pct: SV_SET.withdrawalFeePct, waived: 2, payer: 'Customer',
    effective: addMonths(TODAY, -3), lane: 'Fees', severity: 'Low', owner: 'STF-001', region: 'Lilongwe'},
  {fee: 'Transfer fee', basis: 'Per transfer', amount: SV_SET.transferFeeFlat, pct: 0, waived: 1, payer: 'Customer',
    effective: addMonths(TODAY, -2), lane: 'Fees', severity: 'Low', owner: 'STF-001', region: 'Lilongwe'},
  {fee: 'Early withdrawal penalty', basis: 'Percentage of the amount', amount: 0, pct: SV_SET.earlyPenaltyPct, waived: 0, payer: 'Customer',
    effective: addMonths(TODAY, -6), lane: 'Fees', severity: 'Medium', owner: 'STF-001', region: 'Lilongwe'},
  {fee: 'Dormancy fee', basis: 'Monthly after dormancy', amount: SV_SET.dormancyFee, pct: 0, waived: 3, payer: 'Customer',
    effective: addMonths(TODAY, -9), lane: 'Fees', severity: 'Medium', owner: 'STF-009', region: 'Lilongwe'}
];
const SV_FEE_HISTORY = [
  {when: addDays(TODAY, -3) + ' 10:20', scope: 'Withdrawal fee', from: '0.4% + MK 800', to: '0.5% + MK 1,000', by: 'STF-001',
   lane: 'Fees', severity: 'Low', owner: 'STF-001', region: 'Lilongwe'},
  {when: addDays(TODAY, -12) + ' 09:05', scope: 'Daily withdrawal limit', from: 'MK 1,500,000', to: 'MK 2,000,000', by: 'STF-009',
   lane: 'Limits', severity: 'Low', owner: 'STF-009', region: 'Lilongwe'},
  {when: addDays(TODAY, -24) + ' 15:44', scope: 'Savings interest rate', from: '6.0%', to: '6.5%', by: 'STF-001',
   lane: 'Interest', severity: 'Low', owner: 'STF-001', region: 'Lilongwe'},
  {when: addDays(TODAY, -39) + ' 08:30', scope: 'Early withdrawal penalty', from: '3.0%', to: '2.5%', by: 'STF-009',
   lane: 'Fees', severity: 'Low', owner: 'STF-009', region: 'Lilongwe'}
];
const SV_WAIVERS = [
  {id: 'SWV-021', when: addDays(TODAY, -2) + ' 11:10', cust: CUSTOMERS[3].id, fee: 'Withdrawal fee', amount: 2500,
   reason: 'Long-standing customer, first withdrawal of the month', by: 'STF-001', approver: 'STF-009', status: 'Approved',
   lane: 'Fees', severity: 'Low', owner: 'STF-001', region: 'Lilongwe'},
  {id: 'SWV-020', when: addDays(TODAY, -5) + ' 09:25', cust: CUSTOMERS[8].id, fee: 'Account maintenance', amount: 2500,
   reason: 'Account dormant through no fault of the customer', by: 'STF-007', approver: 'STF-009', status: 'Pending',
   lane: 'Fees', severity: 'Medium', owner: 'STF-007', region: 'Blantyre'}
];

/* ---------------- daily series ---------------- */
const SV_DAILY = MONTHS12.slice(-7).map((m, i) => {
  const day = addDays(TODAY, -(6 - i));
  return {
    day, label: fmtShort(day),
    deposits: sum(SV_COMPLETED.filter(t => String(t.when).slice(0, 10) === day && t.kind === 'Deposit'), t => t.amount),
    withdrawals: sum(SV_COMPLETED.filter(t => String(t.when).slice(0, 10) === day && t.kind === 'Withdrawal'), t => t.amount),
    interest: sum(SV_COMPLETED.filter(t => String(t.when).slice(0, 10) === day && t.kind === 'Interest credit'), t => t.amount),
    count: SV_TXN.filter(t => String(t.when).slice(0, 10) === day).length,
    limit: SV_SET.dailyWithdrawalLimit
  };
});

/* ---------------- interest records ---------------- */
const SV_ACCRUAL = SV_SAVINGS.map((a, i) => ({
  id: 'SIN-' + pad(7100 + i, 4), account: a.id, cust: a.cust, product: a.product,
  rate: a.interestRate, basis: 'Daily balance', days: 30,
  opening: a.available, accrued: Math.round(a.available * a.interestRate / 100 / 12),
  posted: Math.round(a.available * a.interestRate / 100 / 12 * (i % 4 === 0 ? 1 : 0.98)),
  month: MONTHS12[MONTHS12.length - 1], status: i % 11 === 0 ? 'Pending' : 'Posted',
  lane: 'Interest', severity: 'Low', owner: 'STF-001', region: a.region
}));
const SV_INTEREST_HISTORY = MONTHS12.slice(-6).map((m, i) => ({
  month: m, label: monthLabel(m), rate: SV_SET.interestRate,
  accrued: Math.round(sum(SV_SAVINGS, a => a.available) * SV_SET.interestRate / 100 / 12 * (0.9 + i * 0.02)),
  accounts: SV_SAVINGS.filter(a => a.status !== 'Suspended').length,
  postedOn: addDays(TODAY, -(i * 30)), status: 'Posted'
}));
const SV_INTEREST_CHECKS = [
  ['Daily balance is used, not the high or low balance', true, 'Daily closing balance'],
  ['Compounding is monthly, never daily', true, 'Monthly compounding'],
  ['The minimum balance is held for the whole month', null, 'Checked per account'],
  ['Accrual is rounded to the nearest kwacha', true, 'Rounding at posting'],
  ['The posting date is the last day of the month', true, 'Last day of the month'],
  ['A dormant account still accrues interest', true, 'Dormancy does not stop interest']
];

/* ---------------- receipts and statements ---------------- */
const SV_RECEIPTS = SV_COMPLETED.slice(0, 80).map((t, i) => ({
  receipt: 'SVR-' + pad(4200 + i, 5), txn: t.id, ref: t.ref, when: t.when, cust: t.cust, account: t.account,
  kind: t.kind, method: t.method, amount: t.amount, fee: t.fee, status: 'Issued',
  issued: i % 10 === 0 ? 'Reissued' : 'Automatic', lane: 'Receipts', severity: 'Low', owner: 'STF-001', region: t.region
}));
const SV_RECEIPT_CORRECTIONS = [
  {id: 'SRC-031', receipt: SV_RECEIPTS[3].receipt, when: addDays(TODAY, -2) + ' 12:04', field: 'Customer name',
   from: 'G. Mponda', to: 'Grace Mponda', reason: 'Initialled instead of the full name', by: 'STF-007',
   status: 'Approved', lane: 'Receipts', severity: 'Low', owner: 'STF-007', region: 'Lilongwe'},
  {id: 'SRC-030', receipt: SV_RECEIPTS[9].receipt, when: addDays(TODAY, -6) + ' 09:18', field: 'Amount',
   from: 'MK 45,000', to: 'MK 54,000', reason: 'Digits transposed on the deposit slip', by: 'STF-011',
   status: 'Approved', lane: 'Receipts', severity: 'Low', owner: 'STF-011', region: 'Blantyre'}
];
const SV_STATEMENTS = [
  {id: 'SST-118', when: addDays(TODAY, -1) + ' 17:20', cust: CUSTOMERS[2].id, account: SV_ACC_OF_CUST(CUSTOMERS[2].id, 'Savings').id,
   scope: 'Monthly', from: addMonths(TODAY, -1), to: TODAY, rows: 42, by: 'STF-001', status: 'Generated',
   lane: 'Receipts', severity: 'Low', owner: 'STF-001', region: 'Lilongwe'},
  {id: 'SST-117', when: addDays(TODAY, -3) + ' 08:45', cust: CUSTOMERS[11].id, account: SV_ACC_OF_CUST(CUSTOMERS[11].id, 'Savings').id,
   scope: 'Annual', from: addMonths(TODAY, -12), to: TODAY, rows: 96, by: 'STF-009', status: 'Generated',
   lane: 'Receipts', severity: 'Low', owner: 'STF-009', region: 'Blantyre'}
];

/* ---------------- notifications ---------------- */
const SV_CHANNELS = {
  sms: {provider: 'Africa’s Talking', sender: 'GOLDENFS', balance: 7310, status: 'Connected', latency: 610,
    credential: 'Expires in 21 days', lastSend: TODAY + ' 08:04'},
  email: {provider: 'Resend', sender: 'savings@goldenloan.mw', balance: '41,204 of 50,000', status: 'Connected',
    latency: 198, credential: 'Valid', lastSend: TODAY + ' 08:12'}
};
const SV_NOTIFY_RULES = [
  {event: 'Deposit confirmation', sms: true, email: true, to: 'Customer', template: 'SV_DEP', on: true},
  {event: 'Withdrawal status', sms: true, email: false, to: 'Customer', template: 'SV_WDR', on: true},
  {event: 'Interest credited', sms: true, email: true, to: 'Customer', template: 'SV_INT', on: true},
  {event: 'Low balance alert', sms: true, email: false, to: 'Customer', template: 'SV_LOW', on: true},
  {event: 'Savings goal reminder', sms: false, email: true, to: 'Customer', template: 'SV_GOAL', on: true},
  {event: 'Fixed-term maturity', sms: true, email: true, to: 'Customer', template: 'SV_MAT', on: true},
  {event: 'Dormant account notice', sms: false, email: true, to: 'Customer', template: 'SV_DORM', on: true},
  {event: 'Account restricted', sms: true, email: true, to: 'Customer and staff', template: 'SV_REST', on: false}
];
const SV_NOTIFY_LOG = SV_TXN.slice(0, 26).map((t, i) => {
  const rule = SV_NOTIFY_RULES[i % SV_NOTIFY_RULES.length];
  return {when: t.when, event: rule.event, channel: i % 3 === 0 ? 'Email' : 'SMS', to: custName(t.cust),
    reference: t.id, status: i % 11 === 0 ? 'Failed' : i % 7 === 0 ? 'Queued' : 'Delivered',
    lane: 'Notifications', severity: 'Low', owner: 'STF-005', region: t.region};
});

/* ---------------- dormancy, restrictions, security ---------------- */
const SV_DORMANT = SV_SAVINGS.filter(a => a.status === 'Dormant').slice(0, 10).map((a, i) => ({
  account: a.id, cust: a.cust, balance: a.available, lastMove: a.lastMove,
  daysIdle: daysBetween(a.lastMove, TODAY), threshold: SV_SET.dormantDays,
  status: a.status, reactivated: 'No', lane: 'Dormant', severity: 'Medium', owner: 'STF-001', region: a.region
}));
const SV_REACTIVATIONS = [
  {id: 'SRQ-042', when: addDays(TODAY, -1) + ' 10:30', account: SV_DORMANT[0] ? SV_DORMANT[0].account : SV_ACCOUNTS[0].id,
   cust: SV_DORMANT[0] ? SV_DORMANT[0].cust : CUSTOMERS[0].id, reason: 'Customer visited the branch with their national ID',
   status: 'Pending', by: 'STF-007', lane: 'Dormant', severity: 'Medium', owner: 'STF-007', region: 'Lilongwe'},
  {id: 'SRQ-041', when: addDays(TODAY, -4) + ' 14:05', account: SV_ACCOUNTS[9].id, cust: CUSTOMERS[9].id,
   reason: 'Identity re-verified at the counter', status: 'Approved', by: 'STF-001',
   lane: 'Dormant', severity: 'Low', owner: 'STF-001', region: 'Blantyre'}
];
const SV_RESTRICTIONS = SV_SAVINGS.filter(a => a.restriction !== 'None').slice(0, 12).map((a, i) => ({
  account: a.id, cust: a.cust, restriction: a.restriction, since: addDays(TODAY, -(10 + i * 5)),
  status: a.status, by: i % 2 ? 'STF-009' : 'STF-001', lane: 'Dormant', severity: 'Medium',
  owner: 'STF-001', region: a.region
}));
const SV_UNCLAIMED = SV_DORMANT.slice(0, 4).map((d, i) => ({
  account: d.account, cust: d.cust, balance: d.balance, idle: d.daysIdle,
  years: Math.max(2, Math.round(d.daysIdle / 365)), holder: 'Unclaimed balances register',
  status: i % 2 ? 'Reported to the registrar' : 'Held by the bank', lane: 'Dormant', severity: 'Medium',
  owner: 'STF-001', region: 'Lilongwe'
}));
const SV_ID_CHECKS = SV_TXN.slice(0, 10).map((t, i) => ({
  ref: t.ref, cust: t.cust, doc: ['National ID', 'Passport', 'Driver licence'][i % 3],
  number: 'MW' + pad(ri(100000, 999999), 6), checked: i % 5 === 0 ? 'Pending' : 'Verified',
  by: i % 5 === 0 ? '—' : (i % 2 ? 'STF-007' : 'STF-001'), when: addDays(TODAY, -(i + 1)) + ' 10:00',
  lane: 'Security', severity: i % 5 === 0 ? 'Medium' : 'Low', owner: 'STF-001', region: 'Lilongwe'
}));
const SV_FRAUD = [
  {when: addDays(TODAY, -1) + ' 20:40', event: 'Four withdrawals to two new wallets in one afternoon',
   subject: CUSTOMERS[4].id, severity: 'High', status: 'Investigating', lane: 'Security', owner: 'STF-009', region: 'Lilongwe'},
  {when: addDays(TODAY, -2) + ' 07:10', event: 'Deposit made to a dormant account', subject: CUSTOMERS[14].id,
   severity: 'Medium', status: 'Open', lane: 'Security', owner: 'STF-001', region: 'Blantyre'},
  {when: addDays(TODAY, -5) + ' 13:25', event: 'Two interest postings to the same account', subject: SV_DUPLICATES[0] ? SV_DUPLICATES[0].ref : 'AMT-1',
   severity: 'High', status: 'Resolved', lane: 'Security', owner: 'STF-001', region: 'Mzuzu'},
  {when: addDays(TODAY, -9) + ' 18:02', event: 'Balance changed outside a posted transaction', subject: SV_ADJUST[1].account,
   severity: 'Critical', status: 'Investigating', lane: 'Security', owner: 'STF-009', region: 'Zomba'}
];
const SV_VELOCITY = CUSTOMERS.slice(0, 12).map((c, i) => ({
  cust: c.id, withdrawals24h: 1 + (i % 4), limit: 3, amount24h: 20000 + i * 34000,
  amountLimit: SV_SET.perCustomerDailyLimit, status: (1 + (i % 4)) > 3 ? 'Breach' : 'Within limit'
}));
const SV_AMOUNT_ALERTS = SV_TXN.filter(t => t.amount > 300000).slice(0, 6).map((t, i) => ({
  txn: t.id, ref: t.ref, kind: t.kind, cust: t.cust, amount: t.amount, threshold: SV_SET.approvalThreshold,
  band: i % 2 ? 'Above the approval threshold' : 'Unusual for this customer',
  status: i % 3 === 0 ? 'Cleared' : 'Flagged', lane: 'Security', severity: 'Medium', owner: 'STF-001', region: t.region
}));
const SV_ROLES = ['Super Admin', 'Administrator', 'Finance Manager', 'Cashier', 'Collections Officer', 'Auditor'];
const SV_CAPS = ['Open savings accounts', 'Verifying deposits', 'First-level approval', 'Management approval',
  'Post interest', 'Write off fees and penalties', 'Close accounts', 'View the audit log'];
const SV_PERMS = {
  'Super Admin': [1,1,1,1,1,1,1,1],
  'Administrator': [1,1,1,1,1,1,1,1],
  'Finance Manager': [1,1,1,1,1,1,0,1],
  'Cashier': [1,1,0,0,0,0,0,0],
  'Collections Officer': [1,1,0,0,0,0,0,0],
  'Auditor': [0,0,0,0,0,0,0,1]
};
const SV_ROLE_STAFF = {'Super Admin':'STF-001','Administrator':'STF-009','Finance Manager':'STF-006',
  'Cashier':'STF-007','Collections Officer':'STF-012','Auditor':'STF-016'};
const SV_THRESHOLDS = [
  {band: 'Deposits of any amount', level1: 'Cashier verifies the proof', level2: 'Not required', days: 'Immediate'},
  {band: 'Withdrawals up to MK 200,000', level1: 'Cashier', level2: 'Not required', days: 'Same day'},
  {band: 'MK 200,000 – MK 800,000', level1: 'Finance Manager', level2: 'Same day check', days: 'Same day'},
  {band: 'Above MK 800,000', level1: 'Finance Manager', level2: 'Administrator', days: 'Dual authorisation'}
];
const SV_SENSITIVE = SV_APPROVALS.filter(a => a.risk === 'High').slice(0, 4).map((a, i) => ({
  id: 'SSA-' + pad(70 + i, 3), txn: a.txn, amount: a.amount, level: a.level,
  reason: 'High-value withdrawal needs a second signature', status: 'Pending', by: 'STF-009'
}));
const SV_STAFF_ACTIVITY = STAFF.slice(0, 10).map((s, i) => ({
  staff: s.id, name: s.name, role: s.role,
  deposits: SV_TXN.filter(t => t.officer === s.id && t.kind === 'Deposit').length,
  withdrawals: SV_TXN.filter(t => t.officer === s.id && t.kind === 'Withdrawal').length,
  verifications: SV_VERIFY.filter(v => v.status !== 'Pending').length % (i + 2),
  lastAction: addDays(TODAY, -(i % 5)) + ' 1' + (i % 9) + ':20',
  status: i % 7 === 6 ? 'Review' : 'Normal', lane: 'Security', severity: i % 7 === 6 ? 'Medium' : 'Low',
  owner: s.id, region: 'Lilongwe'
}));

/* ---------------- provider connections ---------------- */
const SV_CONNS = [
  {id: 'CON-LED', name: 'Savings ledger', rail: 'Internal', provider: 'Golden ledger', status: 'Connected',
   latency: 34, uptime: 99.99, webhook: 'not used — posted in-database', signature: 'n/a',
   credential: 'Service role, rotated 12 days ago', lastCheck: TODAY + ' 08:10', environment: 'Production',
   lane: 'Internal', severity: 'Low', owner: 'STF-001', region: 'Lilongwe'},
  {id: 'CON-AIR', name: 'Airtel Money', rail: 'Mobile money', provider: 'Airtel Malawi', status: 'Connected',
   latency: 590, uptime: 99.46, webhook: 'https://api.goldenloan.mw/hooks/airtel-savings',
   signature: 'HMAC-SHA256, x-airtel-signature', credential: 'Client key expires in 26 days',
   lastCheck: TODAY + ' 08:14', environment: 'Production', lane: 'Mobile money', severity: 'Low',
   owner: 'STF-001', region: 'Lilongwe'},
  {id: 'CON-TNM', name: 'TNM Mpamba', rail: 'Mobile money', provider: 'TNM Mpamba', status: 'Review',
   latency: 1240, uptime: 98.62, webhook: 'https://api.goldenloan.mw/hooks/tnm-savings',
   signature: 'HMAC-SHA256, x-mpamba-signature', credential: 'Client key expires in 8 days',
   lastCheck: TODAY + ' 08:14', environment: 'Production', lane: 'Mobile money', severity: 'Medium',
   owner: 'STF-001', region: 'Lilongwe'},
  {id: 'CON-BNK', name: 'Bank transfer provider', rail: 'Bank', provider: 'FDH Bank', status: 'Connected',
   latency: 860, uptime: 99.51, webhook: 'https://api.goldenloan.mw/hooks/fdh-savings',
   signature: 'HMAC-SHA256, x-fdh-signature', credential: 'Certificate valid for 84 days',
   lastCheck: TODAY + ' 08:13', environment: 'Production', lane: 'Bank', severity: 'Low',
   owner: 'STF-001', region: 'Lilongwe'},
  {id: 'CON-CSH', name: 'Branch cash desk', rail: 'Cash', provider: 'Branch counter', status: 'Connected',
   latency: 12, uptime: 100, webhook: 'not used — recorded at the counter', signature: 'n/a',
   credential: 'Counter terminal, sealed', lastCheck: TODAY + ' 08:05', environment: 'Production',
   lane: 'Cash', severity: 'Low', owner: 'STF-001', region: 'Lilongwe'},
  {id: 'CON-SMS', name: 'SMS gateway', rail: 'Notifications', provider: 'Africa’s Talking', status: 'Connected',
   latency: 610, uptime: 99.72, webhook: 'https://api.goldenloan.mw/hooks/sms-status',
   signature: 'Bearer token', credential: 'Token valid for 21 days', lastCheck: TODAY + ' 08:04',
   environment: 'Production', lane: 'Notifications', severity: 'Low', owner: 'STF-005', region: 'Lilongwe'},
  {id: 'CON-EML', name: 'Email gateway', rail: 'Notifications', provider: 'Resend', status: 'Connected',
   latency: 198, uptime: 99.94, webhook: 'https://api.goldenloan.mw/hooks/email-status',
   signature: 'Signed webhook, svix', credential: 'API key valid', lastCheck: TODAY + ' 08:12',
   environment: 'Production', lane: 'Notifications', severity: 'Low', owner: 'STF-005', region: 'Lilongwe'}
];
const SV_CONN_TESTS = SV_CONNS.map(c => ({conn: c.id, name: c.name, when: TODAY + ' 07:' + pad(40 + c.latency % 15, 2),
  result: c.status === 'Connected' ? 'Pass' : 'Slow', latency: c.latency,
  lane: c.lane, severity: c.status === 'Connected' ? 'Low' : 'Medium', owner: 'STF-001', region: 'Lilongwe'}));
const SV_WEBHOOKS = SV_TXN.slice(0, 12).map((t, i) => ({
  when: t.when, event: t.method + ' ' + t.kind.toLowerCase() + '.' + (t.status === 'Failed' ? 'failed' : 'completed'),
  reference: t.ref, signature: i % 8 === 0 ? 'Failed' : 'Verified',
  delivery: i % 9 === 0 ? 'Retry queued' : 'Delivered', attempts: 1 + (i % 3), txn: t.id,
  lane: 'Gateway', severity: i % 8 === 0 ? 'High' : 'Low', owner: 'STF-001', region: 'Lilongwe'
}));
const SV_CONN_ALERTS = [
  {when: TODAY + ' 07:58', what: 'TNM Mpamba latency above 1,000 ms for the third hour', severity: 'Medium',
   status: 'Open', lane: 'Mobile money', owner: 'STF-001', region: 'Lilongwe'},
  {when: addDays(TODAY, -1) + ' 19:12', what: 'Four deposit webhooks failed their signature check', severity: 'High',
   status: 'Acknowledged', lane: 'Gateway', owner: 'STF-009', region: 'Lilongwe'},
  {when: addDays(TODAY, -3) + ' 10:40', what: 'SMS gateway token within 21 days of expiry', severity: 'Low',
   status: 'Open', lane: 'Notifications', owner: 'STF-005', region: 'Lilongwe'}
];

/* ---------------- database ---------------- */
const SV_DB_TABLES = [
  {table: 'customers', rows: CUSTOMERS.length, size: '286 KB', rls: 'Enabled', note: 'A customer reads only their own row',
   function: 'customer_profile', lastWrite: TODAY + ' 08:12', lane: 'Customers', severity: 'Low', owner: 'STF-001', region: 'Frankfurt'},
  {table: 'customer_accounts', rows: SV_ACCOUNTS.length, size: '1.1 MB', rls: 'Enabled', note: 'Every savings and current account',
   function: 'account_balance', lastWrite: TODAY + ' 08:14', lane: 'Accounts', severity: 'Low', owner: 'STF-001', region: 'Frankfurt'},
  {table: 'savings_accounts', rows: SV_SAVINGS.length, size: '612 KB', rls: 'Enabled', note: 'Product, rate and minimum balance per account',
   function: 'savings_balance', lastWrite: TODAY + ' 08:14', lane: 'Accounts', severity: 'Low', owner: 'STF-001', region: 'Frankfurt'},
  {table: 'savings_transactions', rows: SV_TXN.length, size: '6.8 MB', rls: 'Enabled', note: 'Insert-only; status changes go through a function',
   function: 'post_savings_transaction', lastWrite: TODAY + ' 08:15', lane: 'Transactions', severity: 'Low', owner: 'STF-001', region: 'Frankfurt'},
  {table: 'savings_ledger', rows: SV_LEDGER.length, size: '4.9 MB', rls: 'Enabled', note: 'Append-only debit and credit entries',
   function: 'write_savings_ledger', lastWrite: TODAY + ' 08:15', lane: 'Ledger', severity: 'Low', owner: 'STF-001', region: 'Frankfurt'},
  {table: 'savings_interest', rows: SV_ACCRUAL.length, size: '488 KB', rls: 'Enabled', note: 'One accrual row per account per month',
   function: 'post_interest', lastWrite: TODAY + ' 06:00', lane: 'Interest', severity: 'Low', owner: 'STF-001', region: 'Frankfurt'},
  {table: 'savings_goals', rows: SV_GOALS.length, size: '96 KB', rls: 'Enabled', note: 'Customer-owned goals and contributions',
   function: 'add_goal_contribution', lastWrite: TODAY + ' 07:40', lane: 'Goals', severity: 'Low', owner: 'STF-001', region: 'Frankfurt'},
  {table: 'savings_products', rows: SV_PRODUCTS.length, size: '48 KB', rls: 'Enabled', note: 'Read by every staff member, written by finance',
   function: 'product_terms', lastWrite: addDays(TODAY, -4) + ' 11:20', lane: 'Products', severity: 'Low', owner: 'STF-001', region: 'Frankfurt'},
  {table: 'savings_attachments', rows: 84, size: '9.4 MB', rls: 'Missing policy', note: 'Storage-backed proof of payment uploads',
   function: 'attach_proof', lastWrite: TODAY + ' 07:52', lane: 'Storage', severity: 'High', owner: 'STF-001', region: 'Frankfurt'}
];
const SV_DB_FUNCS = [
  {name: 'post_savings_transaction', kind: 'Function', invoker: 'Definer', calls: 388, status: 'Healthy',
   note: 'Deposit, withdrawal, fee, ledger and audit rows in one transaction', lane: 'Database', severity: 'Low', owner: 'STF-001', region: 'Frankfurt'},
  {name: 'reserve_withdrawal', kind: 'Function', invoker: 'Definer', calls: 214, status: 'Healthy',
   note: 'Holds the amount while the request waits for approval', lane: 'Database', severity: 'Low', owner: 'STF-001', region: 'Frankfurt'},
  {name: 'post_interest', kind: 'Function', invoker: 'Definer', calls: 60, status: 'Healthy',
   note: 'Accrues and posts the monthly interest for every eligible account', lane: 'Database', severity: 'Low', owner: 'STF-001', region: 'Frankfurt'},
  {name: 'reverse_savings_transaction', kind: 'Function', invoker: 'Definer', calls: 14, status: 'Review',
   note: 'Writes the opposite ledger entries and restores the balance', lane: 'Database', severity: 'Medium', owner: 'STF-001', region: 'Frankfurt'},
  {name: 'detect_duplicate_deposit', kind: 'Trigger', invoker: 'Definer', calls: 388, status: 'Healthy',
   note: 'Rejects a deposit reference seen inside the window', lane: 'Database', severity: 'Low', owner: 'STF-001', region: 'Frankfurt'},
  {name: 'reconcile_savings', kind: 'Function', invoker: 'Definer', calls: 31, status: 'Healthy',
   note: 'Checks every savings balance against the ledger', lane: 'Database', severity: 'Low', owner: 'STF-001', region: 'Frankfurt'}
];
const SV_DB_ERRORS = [
  {when: TODAY + ' 07:52', code: '23505', message: 'duplicate key value violates unique constraint "savings_transactions_reference_key"',
   count: 3, status: 'Open', lane: 'Database', severity: 'High', owner: 'STF-001', region: 'Frankfurt'},
  {when: addDays(TODAY, -1) + ' 19:20', code: '42501', message: 'permission denied for table savings_attachments',
   count: 5, status: 'Open', lane: 'Database', severity: 'High', owner: 'STF-001', region: 'Frankfurt'},
  {when: addDays(TODAY, -2) + ' 11:04', code: '40001', message: 'could not serialize access due to concurrent update',
   count: 2, status: 'Resolved', lane: 'Database', severity: 'Medium', owner: 'STF-001', region: 'Frankfurt'},
  {when: addDays(TODAY, -3) + ' 16:48', code: '23514', message: 'new row for relation "savings_transactions" violates check constraint "amount_positive"',
   count: 1, status: 'Resolved', lane: 'Database', severity: 'Medium', owner: 'STF-001', region: 'Frankfurt'}
];
const svNetLabel = v => (Math.abs(v) < 1 ? 'Balanced at MK 0' : 'Out by MK ' + num(Math.abs(v)));
const SV_DB_CHECKS = () => [
  {check: 'Every completed transaction has its ledger entry', value: 'Matched to the cent', status: 'Pass'},
  {check: 'Debits and credits net to zero', value: svNetLabel(sum(SV_LEDGER, e => e.amount)),
   status: Math.abs(sum(SV_LEDGER, e => e.amount)) < 1 ? 'Pass' : 'Fail'},
  {check: 'Account balance equals the ledger sum', value: SV_DISCREPANCY.length + ' account(s) differ',
   status: SV_DISCREPANCY.length ? 'Fail' : 'Pass'},
  {check: 'Every savings account carries a product', value: SV_SAVINGS.filter(a => !a.product).length + ' without one',
   status: SV_SAVINGS.some(a => !a.product) ? 'Fail' : 'Pass'},
  {check: 'Duplicate deposit references', value: SV_DUPLICATES.length + ' group(s) held', status: SV_DUPLICATES.length ? 'Fail' : 'Pass'},
  {check: 'Row-level security on the savings tables', value: SV_DB_TABLES.filter(t => t.rls !== 'Enabled').length + ' table without a policy',
   status: SV_DB_TABLES.some(t => t.rls !== 'Enabled') ? 'Fail' : 'Pass'},
  {check: 'Interest rows have a rate and a posting date', value: SV_ACCRUAL.filter(a => a.status === 'Pending').length + ' awaiting a posting',
   status: 'Pass'},
  {check: 'Schema version matches the app', value: '2026.10.30.2', status: 'Pass'}
];
const SV_MIGRATIONS = [
  {id: '20261030_06', name: 'add savings_products and savings_goals', when: addDays(TODAY, -2) + ' 07:44', status: 'Applied',
   lane: 'Database', severity: 'Low', owner: 'STF-001', region: 'Frankfurt'},
  {id: '20261023_03', name: 'index savings_transactions(reference)', when: addDays(TODAY, -9) + ' 09:12', status: 'Applied',
   lane: 'Database', severity: 'Low', owner: 'STF-001', region: 'Frankfurt'},
  {id: '20261016_02', name: 'interest posting function', when: addDays(TODAY, -16) + ' 18:26', status: 'Applied',
   lane: 'Database', severity: 'Low', owner: 'STF-001', region: 'Frankfurt'},
  {id: '20261009_04', name: 'check constraint amount_positive', when: addDays(TODAY, -23) + ' 10:02', status: 'Applied',
   lane: 'Database', severity: 'Low', owner: 'STF-001', region: 'Frankfurt'},
  {id: '20261101_02', name: 'enable RLS on savings_attachments', when: addDays(TODAY, -1) + ' 06:00', status: 'Pending',
   lane: 'Database', severity: 'High', owner: 'STF-001', region: 'Frankfurt'}
];

/* ---------------- reports and change history ---------------- */
const SV_REPORTS = [
  {key: 'total', title: 'Total Savings Report', desc: 'Every account, its product, balance and state'},
  {key: 'growth', title: 'Savings Growth Report', desc: 'Month by month, deposits against withdrawals'},
  {key: 'deposits', title: 'Deposits and Withdrawals Report', desc: 'Every movement in the period'},
  {key: 'customer', title: 'Savings by Customer', desc: 'Who is saving, and how much they hold'},
  {key: 'product', title: 'Savings by Product', desc: 'Accounts, balances and rates per product'},
  {key: 'accrual', title: 'Interest Accrual Report', desc: 'What has accrued but not yet posted'},
  {key: 'interest', title: 'Interest Paid Report', desc: 'Every interest posting made'},
  {key: 'dormant', title: 'Dormant Accounts Report', desc: 'Idle accounts, their balances and last movement'},
  {key: 'pending', title: 'Pending Transactions Report', desc: 'Everything waiting on verification or approval'},
  {key: 'reconciliation', title: 'Reconciliation Report', desc: 'The ledger against the balance, account by account'},
  {key: 'fees', title: 'Fees and Penalties Report', desc: 'Fees charged, penalties applied and waivers given'},
  {key: 'authorised', title: 'Export Authorised Reports', desc: 'Every approval, who gave it and when'}
];
const SV_CHANGES = [
  {when: TODAY + ' 08:12', what: 'Withdrawal fee', area: 'Fees', from: '0.4% + MK 800', to: '0.5% + MK 1,000', by: 'STF-001'},
  {when: TODAY + ' 08:02', what: 'Approval threshold', area: 'Approvals', from: 'MK 150,000', to: 'MK 200,000', by: 'STF-009'},
  {when: addDays(TODAY, -1) + ' 17:40', what: 'Daily withdrawal limit', area: 'Limits', from: 'MK 1,500,000', to: 'MK 2,000,000', by: 'STF-001'},
  {when: addDays(TODAY, -2) + ' 09:15', what: 'Dormancy period', area: 'Dormancy', from: '150 days', to: '180 days', by: 'STF-009'},
  {when: addDays(TODAY, -4) + ' 14:22', what: 'Savings interest rate', area: 'Interest', from: '6.0%', to: '6.5%', by: 'STF-001'},
  {when: addDays(TODAY, -6) + ' 11:30', what: 'Early withdrawal penalty', area: 'Fees', from: '3.0%', to: '2.5%', by: 'STF-009'}
];
const SV_AUDIT = [];

/* ---------------- keep every row inside the reporting window ---------------- */
[SV_ACCOUNTS, SV_TXN, SV_GOALS, SV_BENEFICIARIES, SV_VERIFY, SV_VERIFY_HISTORY, SV_APPROVALS, SV_APPROVAL_HISTORY,
 SV_LEDGER, SV_ADJUST, SV_REVERSALS, SV_RECEIPTS, SV_RECEIPT_CORRECTIONS, SV_STATEMENTS, SV_NOTIFY_LOG, SV_ID_CHECKS,
 SV_FRAUD, SV_ACCRUAL, SV_DORMANT, SV_REACTIVATIONS, SV_RESTRICTIONS, SV_WAIVERS, SV_DB_TABLES, SV_DB_ERRORS,
 SV_CHANGES, SV_MIGRATIONS, SV_FEE_HISTORY, SV_CONN_ALERTS, SV_INTEREST_HISTORY].forEach(list => list.forEach(r => {
  ['when', 'requested', 'added', 'lastUsed', 'lastMove', 'lastWrite', 'effective', 'lastCheck', 'postedOn',
   'created', 'targetDate', 'opened', 'since'].forEach(k => {
    const v = r[k];
    if(typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v) && v.slice(0, 10) > TODAY)
      r[k] = addDays(TODAY, -1) + v.slice(10);
  });
}));
SV_TXN.sort((a, b) => String(b.when).localeCompare(String(a.when)));

/* product roll-ups */
SV_PRODUCTS.forEach(p => {
  const mine = SV_SAVINGS.filter(a => a.product === p.id);
  p.accounts = mine.length;
  p.balance = sum(mine, a => a.available);
  p.opened = addMonths(TODAY, -(8 + SV_PRODUCTS.indexOf(p) * 3));
});

/* ---------------- stats ---------------- */
const SV_STATUS_COUNTS = () => {
  const c = {total: SV_TXN.length};
  SV_STATUSES.forEach(s => { c[s.toLowerCase().replace(/ /g, '_')] = SV_TXN.filter(t => t.status === s).length; });
  return c;
};
const svAlerts = () => SV_DISCREPANCY.length + SV_DUPLICATES.length + SV_FAILED.length
  + SV_SAVINGS.filter(a => a.status === 'Suspended').length;
function svStats(){
  const c = SV_STATUS_COUNTS();
  const savingsTotal = sum(SV_SAVINGS, a => a.available);
  const accrued = sum(SV_ACCRUAL, a => a.accrued);
  const paid = sum(SV_SAVINGS, a => a.interestPaid);
  const pendingTx = SV_TXN.filter(t => ['Pending verification', 'Pending approval', 'Approved', 'Processing'].includes(t.status));
  const score = clamp(100
    - svByStatus('Failed').length * 1.1
    - SV_SAVINGS.filter(a => a.status === 'Suspended').length * 2
    - SV_DISCREPANCY.length * 4
    - SV_DUPLICATES.length * 2
    - SV_DB_TABLES.filter(t => t.rls !== 'Enabled').length * 5
    - SV_CONNS.filter(x => x.status !== 'Connected').length * 3, 0, 100);
  return {
    total: c.total,
    accounts: SV_ACCOUNTS.length,
    savingsAccounts: SV_SAVINGS.length,
    active: SV_SAVINGS.filter(a => a.status === 'Active').length,
    inactive: SV_SAVINGS.filter(a => a.status !== 'Active').length,
    dormant: SV_SAVINGS.filter(a => a.status === 'Dormant').length,
    suspended: SV_SAVINGS.filter(a => a.status === 'Suspended').length,
    restricted: SV_SAVINGS.filter(a => a.status === 'Restricted').length,
    savingsTotal,
    deposited: sum(SV_COMPLETED.filter(t => t.kind === 'Deposit'), t => t.amount),
    withdrawn: sum(SV_COMPLETED.filter(t => t.kind === 'Withdrawal'), t => t.amount),
    interestAccrued: accrued,
    interestPaid: paid,
    pending: pendingTx.length,
    pendingVerification: svByStatus('Pending verification').length,
    pendingApproval: svByStatus('Pending approval').length,
    approved: c.approved || 0,
    processing: c.processing || 0,
    completed: c.completed || 0,
    failed: c.failed || 0,
    rejected: c.rejected || 0,
    cancelled: c.cancelled || 0,
    reversed: c.reversed || 0,
    fees: sum(SV_COMPLETED, t => t.fee),
    deposits: SV_DEPOSITS.length,
    withdrawals: SV_WITHDRAWALS.length,
    goals: SV_GOALS.length,
    goalsCompleted: SV_GOALS.filter(g => g.status === 'Completed').length,
    goalTarget: sum(SV_GOALS.filter(g => g.status === 'Active'), g => g.target),
    goalSaved: sum(SV_GOALS.filter(g => g.status === 'Active'), g => g.saved),
    reserved: sum(SV_SAVINGS, a => a.reserved),
    pendingIn: sum(SV_SAVINGS, a => a.pendingIn),
    todayCount: SV_TXN.filter(t => String(t.when).slice(0, 10) === TODAY).length,
    todayAmount: sum(SV_TXN.filter(t => String(t.when).slice(0, 10) === TODAY), t => t.amount),
    net: sum(SV_COMPLETED.filter(t => t.kind === 'Deposit'), t => t.amount)
      - sum(SV_COMPLETED.filter(t => t.kind === 'Withdrawal'), t => t.amount),
    alerts: svAlerts(),
    score
  };
}
</script>
