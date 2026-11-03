/* =====================================================================
   GOLDEN FINANCIAL SERVICES · METHODS OF PAYMENT MANAGEMENT (3/7)
   Data universe — every configured payment method, the provider
   connections behind it, the transactions, verification queue,
   allocations, reconciliation, fees, receipts, notifications,
   refunds and the settings they all read from.
   ===================================================================== */
<script>

/* ---------------- settings ---------------- */
const PM_SET_DEFAULTS = {
  currency: 'MWK',
  currencyLabel: 'Malawian Kwacha (MWK)',
  currencySymbol: 'MK',
  decimals: 2,
  refPrefix: 'GFS',
  refRule: 'Prefix + loan reference + receipt sequence',
  receiptPrefix: 'RCP',
  receiptDigits: 5,
  receiptYear: true,
  confirmRule: 'Provider callback + amount and reference match',
  autoConfirm: true,
  reconRule: 'Payment to provider statement, daily at 18:00',
  timeout: 90,
  retries: 3,
  retryBackoff: 'Exponential, 30 s → 5 min → 30 min',
  maxDailyAmount: 15000000,
  minAmount: 500,
  duplicateWindow: 10,
  cashEnabled: true,
  requireApprovalRefund: true,
  requireApprovalLimit: true,
  notifySms: true,
  notifyEmail: true,
  sandbox: false
};
const PM_SET = Object.assign({}, PM_SET_DEFAULTS);

/* ---------------- payment methods ---------------- */
const PM_METHODS = [
  {code: 'MM-AIR', name: 'Airtel Money', type: 'Mobile money', provider: 'Airtel Malawi',
   status: 'Enabled', isDefault: true, order: 1, availability: 'All channels',
   min: 500, max: 3000000, feePayer: 'Customer', feePct: 1.8, feeFlat: 0,
   instructions: 'Dial *211#, choose Send money, enter the merchant code 552341, then your loan reference as the reason.',
   logo: 'Airtel Money mark', archived: false, lane: 'Mobile money', severity: 'Low',
   owner: 'STF-001', region: 'Lilongwe', updated: addDays(TODAY, -12), by: 'STF-001',
   payments: 0, volume: 0, last: TODAY + ' 08:14'},
  {code: 'MM-TNM', name: 'TNM Mpamba', type: 'Mobile money', provider: 'TNM Mpamba',
   status: 'Enabled', isDefault: false, order: 2, availability: 'All channels',
   min: 500, max: 2500000, feePayer: 'Customer', feePct: 1.7, feeFlat: 0,
   instructions: 'Dial *444#, choose Pay bill, business code 7125, then the reference printed on your statement.',
   logo: 'TNM Mpamba mark', archived: false, lane: 'Mobile money', severity: 'High',
   owner: 'STF-001', region: 'Lilongwe', updated: addDays(TODAY, -3), by: 'STF-001',
   payments: 0, volume: 0, last: addDays(TODAY, -1) + ' 16:40'},
  {code: 'BT-FDH', name: 'Bank transfer — FDH Bank', type: 'Bank transfer', provider: 'FDH Bank',
   status: 'Enabled', isDefault: false, order: 3, availability: 'All channels',
   min: 5000, max: 15000000, feePayer: 'Customer', feePct: 0, feeFlat: 2500,
   instructions: 'Transfer to FDH Bank, account 1023456, branch 0104, quoting your loan reference as the narration.',
   logo: 'FDH Bank mark', archived: false, lane: 'Bank', severity: 'Low',
   owner: 'STF-001', region: 'Blantyre', updated: addDays(TODAY, -28), by: 'STF-001',
   payments: 0, volume: 0, last: TODAY + ' 07:52'},
  {code: 'BT-STD', name: 'Bank transfer — Standard Bank', type: 'Bank transfer', provider: 'Standard Bank',
   status: 'Enabled', isDefault: false, order: 4, availability: 'All channels',
   min: 5000, max: 15000000, feePayer: 'Company', feePct: 0, feeFlat: 0,
   instructions: 'Transfer to Standard Bank, account 9054412, branch 0207, quoting your loan reference.',
   logo: 'Standard Bank mark', archived: false, lane: 'Bank', severity: 'Low',
   owner: 'STF-001', region: 'Lilongwe', updated: addDays(TODAY, -44), by: 'STF-009',
   payments: 0, volume: 0, last: addDays(TODAY, -2) + ' 11:05'},
  {code: 'CASH-BR', name: 'Cash at branch', type: 'Cash', provider: 'Branch counter',
   status: 'Enabled', isDefault: false, order: 5, availability: 'Branch only',
   min: 500, max: 500000, feePayer: 'Company', feePct: 0, feeFlat: 0,
   instructions: 'Pay at any branch counter. The cashier prints a numbered receipt from the payment desk.',
   logo: 'Cash mark', archived: false, lane: 'Cash', severity: 'Medium',
   owner: 'STF-007', region: 'Lilongwe', updated: addDays(TODAY, -16), by: 'STF-007',
   payments: 0, volume: 0, last: TODAY + ' 08:02'},
  {code: 'GW-PAY', name: 'PayChangu card gateway', type: 'Gateway', provider: 'PayChangu',
   status: 'Enabled', isDefault: false, order: 6, availability: 'Customer portal',
   min: 1000, max: 2000000, feePayer: 'Customer', feePct: 2.9, feeFlat: 300,
   instructions: 'Pay with a Visa or Mastercard on the customer portal. The gateway confirms instantly.',
   logo: 'PayChangu mark', archived: false, lane: 'Gateway', severity: 'Medium',
   owner: 'STF-001', region: 'Lilongwe', updated: addDays(TODAY, -58), by: 'STF-001',
   payments: 0, volume: 0, last: addDays(TODAY, -1) + ' 19:22'},
  {code: 'MM-ZMB', name: 'Zomba agents float', type: 'Agent', provider: 'Airtel Malawi',
   status: 'Disabled', isDefault: false, order: 7, availability: 'Branch only',
   min: 1000, max: 250000, feePayer: 'Customer', feePct: 1.4, feeFlat: 0,
   instructions: 'Withdrawn while the Zomba branch is renovated.',
   logo: 'Agent mark', archived: false, lane: 'Mobile money', severity: 'Low',
   owner: 'STF-007', region: 'Zomba', updated: addDays(TODAY, -9), by: 'STF-007',
   payments: 0, volume: 0, last: addDays(TODAY, -22) + ' 10:31'},
  {code: 'BT-NBS', name: 'Bank transfer — NBS Bank', type: 'Bank transfer', provider: 'NBS Bank',
   status: 'Disabled', isDefault: false, order: 8, availability: 'All channels',
   min: 5000, max: 5000000, feePayer: 'Customer', feePct: 0, feeFlat: 2500,
   instructions: 'Retired in September when the account was consolidated into FDH Bank.',
   logo: 'NBS mark', archived: true, lane: 'Bank', severity: 'Low',
   owner: 'STF-001', region: 'Blantyre', updated: addDays(TODAY, -72), by: 'STF-001',
   payments: 0, volume: 0, last: addDays(TODAY, -70) + ' 14:10'},
  {code: 'TW-MPAMBA', name: 'Mpamba agent till', type: 'Agent', provider: 'TNM Mpamba',
   status: 'Enabled', isDefault: false, order: 9, availability: 'Branch only',
   min: 500, max: 400000, feePayer: 'Company', feePct: 1.2, feeFlat: 0,
   instructions: 'Branch officers collect through the agent till and post the tillslip reference.',
   logo: 'Agent till mark', archived: false, lane: 'Mobile money', severity: 'Medium',
   owner: 'STF-002', region: 'Mzuzu', updated: addDays(TODAY, -35), by: 'STF-002',
   payments: 0, volume: 0, last: TODAY + ' 07:18'}
];
const PM_METHOD_BY_CODE = Object.fromEntries(PM_METHODS.map(m => [m.code, m]));

/* ---------------- mobile money ---------------- */
const PM_MM = {
  'MM-AIR': {merchant: 'Golden Financial Services Ltd', code: '552341', till: 'TILL-552341',
    account: 'AIRTEL 1002345', reference: 'Loan reference, 8–12 characters, no spaces',
    apiBase: 'https://openapi.airtel.africa/merchant/v1', auth: 'OAuth 2.0 client credentials',
    requestMode: 'Push to the customer handset after the officer enters the amount',
    confirmMode: 'Callback to https://api.goldenloan.mw/v1/payments/airtel/callback',
    status: 'Connected', latency: 312, uptime: 99.87, token: 'Valid, 42 min left',
    recon: 'Statement pulled daily at 18:00'},
  'MM-TNM': {merchant: 'Golden Financial Services Ltd', code: '7125', till: 'BILL-7125',
    account: 'TNM 7781120', reference: 'Loan reference, 8–12 characters, no spaces',
    apiBase: 'https://api.tnmmpamba.mw/v1/collections', auth: 'API key + HMAC signature',
    requestMode: 'Customer initiates from the handset with the bill number',
    confirmMode: 'Callback to https://api.goldenloan.mw/v1/payments/mpamba/callback',
    status: 'Failing', latency: 0, uptime: 97.4, token: 'Expired 3 days ago',
    recon: 'Statement pulled daily at 18:00 — last pull failed'}
};
const MM_STATUS = [
  {when: TODAY + ' 08:14', method: 'Airtel Money', ref: 'MM-884120', txn: 'RC-4831', amount: 145000,
   stage: 'Confirmed', ms: 312, status: 'Success', lane: 'Mobile money', severity: 'Low', owner: 'STF-001', region: 'Lilongwe'},
  {when: TODAY + ' 08:02', method: 'TNM Mpamba', ref: 'TM-551907', txn: 'RC-4829', amount: 62000,
   stage: 'Callback rejected', ms: 0, status: 'Failed', lane: 'Mobile money', severity: 'Critical', owner: 'STF-001', region: 'Lilongwe'},
  {when: TODAY + ' 07:48', method: 'Airtel Money', ref: 'MM-884101', txn: 'RC-4826', amount: 210000,
   stage: 'Confirmed', ms: 288, status: 'Success', lane: 'Mobile money', severity: 'Low', owner: 'STF-001', region: 'Blantyre'},
  {when: TODAY + ' 07:22', method: 'TNM Mpamba', ref: 'TM-551884', txn: 'RC-4821', amount: 38000,
   stage: 'Awaiting customer', ms: 60000, status: 'Pending', lane: 'Mobile money', severity: 'High', owner: 'STF-002', region: 'Mzuzu'},
  {when: addDays(TODAY, -1) + ' 18:40', method: 'Airtel Money', ref: 'MM-883902', txn: 'RC-4810', amount: 96000,
   stage: 'Confirmed', ms: 402, status: 'Success', lane: 'Mobile money', severity: 'Low', owner: 'STF-001', region: 'Lilongwe'},
  {when: addDays(TODAY, -1) + ' 16:20', method: 'TNM Mpamba', ref: 'TM-551760', txn: 'RC-4802', amount: 74000,
   stage: 'Callback timeout', ms: 90000, status: 'Failed', lane: 'Mobile money', severity: 'High', owner: 'STF-001', region: 'Zomba'},
  {when: addDays(TODAY, -2) + ' 12:10', method: 'Airtel Money', ref: 'MM-883712', txn: 'RC-4794', amount: 118000,
   stage: 'Confirmed', ms: 268, status: 'Success', lane: 'Mobile money', severity: 'Low', owner: 'STF-001', region: 'Lilongwe'},
  {when: addDays(TODAY, -2) + ' 09:35', method: 'TNM Mpamba', ref: 'TM-551702', txn: 'RC-4788', amount: 52000,
   stage: 'Refused by customer', ms: 0, status: 'Cancelled', lane: 'Mobile money', severity: 'Medium', owner: 'STF-002', region: 'Blantyre'}
];
const MM_RECON = [
  {date: '2026-10-30', method: 'Airtel Money', providerTxn: 148, systemTxn: 146, amount: 18420000,
   difference: 2, status: 'Matched', note: 'Two provider lines not yet in the ledger'},
  {date: '2026-10-30', method: 'TNM Mpamba', providerTxn: 0, systemTxn: 41, amount: 3120000,
   difference: -41, status: 'Unmatched', note: 'Statement pull failed — credential expired'},
  {date: '2026-10-29', method: 'Airtel Money', providerTxn: 162, systemTxn: 162, amount: 20140000,
   difference: 0, status: 'Matched', note: 'Clean'},
  {date: '2026-10-29', method: 'TNM Mpamba', providerTxn: 74, systemTxn: 72, amount: 5480000,
   difference: 2, status: 'Matched', note: 'Two lines settled after the cut-off'},
  {date: '2026-10-28', method: 'Airtel Money', providerTxn: 151, systemTxn: 149, amount: 17360000,
   difference: 2, status: 'Matched', note: 'Two reversals returned by the provider'},
  {date: '2026-10-28', method: 'TNM Mpamba', providerTxn: 68, systemTxn: 68, amount: 4910000,
   difference: 0, status: 'Matched', note: 'Clean'}
];

/* ---------------- bank transfer ---------------- */
const PM_BANK = [
  {bank: 'FDH Bank', accountName: 'Golden Financial Services Ltd', account: '1023456',
   branch: 'Area 3, Lilongwe', branchCode: '0104', swift: 'FDHFMWMW',
   currency: 'MWK', reference: 'Quote the loan reference in the narration',
   verification: 'Two-person check on the statement line', status: 'Verified',
   lane: 'Bank', severity: 'Low', owner: 'STF-001', region: 'Lilongwe'},
  {bank: 'Standard Bank', accountName: 'Golden Financial Services Ltd', account: '9054412',
   branch: 'Kanjedza House, Blantyre', branchCode: '0207', swift: 'SBICMWMX',
   currency: 'MWK', reference: 'Quote the loan reference in the narration',
   verification: 'Two-person check on the statement line', status: 'Verified',
   lane: 'Bank', severity: 'Low', owner: 'STF-001', region: 'Blantyre'},
  {bank: 'NBS Bank', accountName: 'Golden Financial Services Ltd', account: '3310027',
   branch: 'City Centre, Mzuzu', branchCode: '0402', swift: 'NBSCMWMW',
   currency: 'MWK', reference: 'Account closed — kept for history',
   verification: 'Closed', status: 'Archived',
   lane: 'Bank', severity: 'Low', owner: 'STF-001', region: 'Mzuzu'}
];
const PM_STATEMENTS = [
  {id: 'STMT-3012', bank: 'FDH Bank', period: '30 Oct 2026', lines: 24, amount: 4260000,
   imported: TODAY + ' 09:10', matched: 21, status: 'Partially matched', lane: 'Bank', severity: 'Medium', owner: 'STF-001', region: 'Lilongwe'},
  {id: 'STMT-3011', bank: 'Standard Bank', period: '30 Oct 2026', lines: 11, amount: 1860000,
   imported: TODAY + ' 09:08', matched: 11, status: 'Matched', lane: 'Bank', severity: 'Low', owner: 'STF-001', region: 'Blantyre'},
  {id: 'STMT-3010', bank: 'FDH Bank', period: '29 Oct 2026', lines: 31, amount: 5120000,
   imported: addDays(TODAY, -1) + ' 09:05', matched: 31, status: 'Matched', lane: 'Bank', severity: 'Low', owner: 'STF-001', region: 'Lilongwe'},
  {id: 'STMT-3009', bank: 'Standard Bank', period: '29 Oct 2026', lines: 9, amount: 1240000,
   imported: addDays(TODAY, -1) + ' 09:04', matched: 8, status: '1 difference', lane: 'Bank', severity: 'High', owner: 'STF-001', region: 'Blantyre'},
  {id: 'STMT-3008', bank: 'NBS Bank', period: '28 Oct 2026', lines: 0, amount: 0,
   imported: addDays(TODAY, -2) + ' 09:02', matched: 0, status: 'Account closed', lane: 'Bank', severity: 'Low', owner: 'STF-001', region: 'Mzuzu'}
];

/* ---------------- cash ---------------- */
const PM_CASH = {enabled: true, nextReceipt: 10642, receiptFormat: 'CSH-YY-NNNNN',
  requireHandover: true, handoverWindow: 'Same day, before 17:30', verifyBy: 'Branch manager',
  floatLimit: 500000, till: 'Main cash drawer'};
const CASH_STAFF = [
  {id: 'STF-007', role: 'Cashier', branch: 'Lilongwe', authorised: true, receipts: 214, collected: 4280000, balanced: true},
  {id: 'STF-011', role: 'Cashier', branch: 'Blantyre', authorised: true, receipts: 168, collected: 3120000, balanced: true},
  {id: 'STF-012', role: 'Collections Officer', branch: 'Mzuzu', authorised: true, receipts: 96, collected: 1480000, balanced: false},
  {id: 'STF-014', role: 'Cashier', branch: 'Zomba', authorised: false, receipts: 0, collected: 0, balanced: true},
  {id: 'STF-004', role: 'Head of Credit', branch: 'Lilongwe', authorised: false, receipts: 0, collected: 0, balanced: true}
];
const CASH_COLLECTIONS = [
  {receipt: 'CSH-26-10641', when: TODAY + ' 08:02', cust: 'CUS-0019', loan: 'LN-2401', amount: 145000,
   officer: 'STF-007', branch: 'Lilongwe', status: 'Handed over', lane: 'Cash', severity: 'Low', owner: 'STF-007', region: 'Lilongwe'},
  {receipt: 'CSH-26-10640', when: TODAY + ' 07:41', cust: 'CUS-0004', loan: 'LN-2407', amount: 62000,
   officer: 'STF-011', branch: 'Blantyre', status: 'Handed over', lane: 'Cash', severity: 'Low', owner: 'STF-011', region: 'Blantyre'},
  {receipt: 'CSH-26-10639', when: addDays(TODAY, -1) + ' 16:58', cust: 'CUS-0021', loan: 'LN-2412', amount: 98000,
   officer: 'STF-012', branch: 'Mzuzu', status: 'Handover pending', lane: 'Cash', severity: 'High', owner: 'STF-012', region: 'Mzuzu'},
  {receipt: 'CSH-26-10638', when: addDays(TODAY, -1) + ' 15:20', cust: 'CUS-0031', loan: 'LN-2418', amount: 210000,
   officer: 'STF-007', branch: 'Lilongwe', status: 'Handed over', lane: 'Cash', severity: 'Low', owner: 'STF-007', region: 'Lilongwe'},
  {receipt: 'CSH-26-10637', when: addDays(TODAY, -2) + ' 11:04', cust: 'CUS-0044', loan: 'LN-2422', amount: 74000,
   officer: 'STF-012', branch: 'Mzuzu', status: 'Handed over', lane: 'Cash', severity: 'Low', owner: 'STF-012', region: 'Mzuzu'},
  {receipt: 'CSH-26-10636', when: addDays(TODAY, -2) + ' 09:26', cust: 'CUS-0009', loan: 'LN-2430', amount: 132000,
   officer: 'STF-011', branch: 'Blantyre', status: 'Verified', lane: 'Cash', severity: 'Low', owner: 'STF-011', region: 'Blantyre'}
];
const CASH_HANDOVERS = [
  {id: 'HND-4420', when: TODAY + ' 17:05', officer: 'STF-007', branch: 'Lilongwe', receipts: 6, amount: 812000,
   counted: 812000, variance: 0, verifiedBy: 'STF-001', status: 'Balanced', lane: 'Cash', severity: 'Low', owner: 'STF-007', region: 'Lilongwe'},
  {id: 'HND-4419', when: addDays(TODAY, -1) + ' 17:10', officer: 'STF-011', branch: 'Blantyre', receipts: 4, amount: 468000,
   counted: 468000, variance: 0, verifiedBy: 'STF-001', status: 'Balanced', lane: 'Cash', severity: 'Low', owner: 'STF-011', region: 'Blantyre'},
  {id: 'HND-4418', when: addDays(TODAY, -1) + ' 18:02', officer: 'STF-012', branch: 'Mzuzu', receipts: 3, amount: 284000,
   counted: 279000, variance: -5000, verifiedBy: 'STF-002', status: 'Variance', lane: 'Cash', severity: 'High', owner: 'STF-012', region: 'Mzuzu'},
  {id: 'HND-4417', when: addDays(TODAY, -2) + ' 17:20', officer: 'STF-007', branch: 'Lilongwe', receipts: 5, amount: 690000,
   counted: 690000, variance: 0, verifiedBy: 'STF-001', status: 'Balanced', lane: 'Cash', severity: 'Low', owner: 'STF-007', region: 'Lilongwe'}
];

/* ---------------- gateway connections ---------------- */
const PM_PROVIDERS = [
  {id: 'PRV-01', name: 'Airtel Money OpenAPI', provider: 'Airtel Malawi', kind: 'Mobile money',
   env: 'Production', status: 'Connected', health: 99.87, latency: 312, lastCheck: TODAY + ' 08:10',
   webhook: 'https://api.goldenloan.mw/v1/payments/airtel/callback', signature: 'HMAC-SHA256',
   sandbox: false, credentials: 'Valid', uptime: 99.87, lane: 'Mobile money', severity: 'High',
   owner: 'STF-001', region: 'Malawi'},
  {id: 'PRV-02', name: 'TNM Mpamba Collections', provider: 'TNM Mpamba', kind: 'Mobile money',
   env: 'Production', status: 'Failing', health: 97.4, latency: 0, lastCheck: TODAY + ' 08:07',
   webhook: 'https://api.goldenloan.mw/v1/payments/mpamba/callback', signature: 'HMAC-SHA256',
   sandbox: false, credentials: 'Expired', uptime: 97.4, lane: 'Mobile money', severity: 'Critical',
   owner: 'STF-001', region: 'Malawi'},
  {id: 'PRV-03', name: 'PayChangu card gateway', provider: 'PayChangu', kind: 'Gateway',
   env: 'Production', status: 'Connected', health: 99.92, latency: 268, lastCheck: TODAY + ' 08:09',
   webhook: 'https://api.goldenloan.mw/v1/payments/paychangu/callback', signature: 'HMAC-SHA256',
   sandbox: false, credentials: 'Valid', uptime: 99.92, lane: 'Gateway', severity: 'Medium',
   owner: 'STF-001', region: 'Malawi'},
  {id: 'PRV-04', name: 'PayChangu sandbox', provider: 'PayChangu', kind: 'Gateway',
   env: 'Sandbox', status: 'Connected', health: 100, latency: 188, lastCheck: TODAY + ' 08:09',
   webhook: 'https://staging.goldenloan.mw/v1/payments/paychangu/callback', signature: 'HMAC-SHA256',
   sandbox: true, credentials: 'Valid', uptime: 100, lane: 'Gateway', severity: 'Low',
   owner: 'STF-001', region: 'Malawi'},
  {id: 'PRV-05', name: 'FDH Bank statement feed', provider: 'FDH Bank', kind: 'Bank',
   env: 'Production', status: 'Connected', health: 99.6, latency: 640, lastCheck: TODAY + ' 09:10',
   webhook: 'SFTP pull, no webhook', signature: 'PGP signed file',
   sandbox: false, credentials: 'Valid', uptime: 99.6, lane: 'Bank', severity: 'High',
   owner: 'STF-001', region: 'Malawi'},
  {id: 'PRV-06', name: 'Standard Bank statement feed', provider: 'Standard Bank', kind: 'Bank',
   env: 'Production', status: 'Connected', health: 99.42, latency: 720, lastCheck: TODAY + ' 09:08',
   webhook: 'SFTP pull, no webhook', signature: 'PGP signed file',
   sandbox: false, credentials: 'Valid', uptime: 99.42, lane: 'Bank', severity: 'High',
   owner: 'STF-001', region: 'Malawi'},
  {id: 'PRV-07', name: 'Africa’s Talking SMS alerts', provider: 'Africa’s Talking', kind: 'Messaging',
   env: 'Production', status: 'Degraded', health: 99.2, latency: 740, lastCheck: TODAY + ' 08:08',
   webhook: 'https://api.goldenloan.mw/v1/notify/sms/status', signature: 'Bearer token',
   sandbox: false, credentials: 'Expiring', uptime: 99.2, lane: 'Notifications', severity: 'Medium',
   owner: 'STF-005', region: 'Malawi'}
];
const PM_CONN_TESTS = [
  {provider: 'Airtel Money OpenAPI', test: 'OAuth token and a MWK 1 collection', when: TODAY + ' 08:11', ms: 312, result: 'Pass', lane: 'Mobile money', severity: 'High', owner: 'STF-001', region: 'Malawi'},
  {provider: 'TNM Mpamba Collections', test: 'OAuth token and a MWK 1 collection', when: TODAY + ' 08:07', ms: 0, result: 'Fail', lane: 'Mobile money', severity: 'Critical', owner: 'STF-001', region: 'Malawi'},
  {provider: 'PayChangu card gateway', test: 'Signed webhook replay', when: TODAY + ' 08:09', ms: 268, result: 'Pass', lane: 'Gateway', severity: 'Medium', owner: 'STF-001', region: 'Malawi'},
  {provider: 'PayChangu sandbox', test: 'Authorise a MWK 1 sandbox charge', when: TODAY + ' 08:09', ms: 188, result: 'Pass', lane: 'Gateway', severity: 'Low', owner: 'STF-001', region: 'Malawi'},
  {provider: 'FDH Bank statement feed', test: 'Pull the morning statement', when: TODAY + ' 09:10', ms: 640, result: 'Pass', lane: 'Bank', severity: 'High', owner: 'STF-001', region: 'Malawi'},
  {provider: 'Standard Bank statement feed', test: 'Pull the morning statement', when: TODAY + ' 09:08', ms: 720, result: 'Pass', lane: 'Bank', severity: 'High', owner: 'STF-001', region: 'Malawi'},
  {provider: 'Africa’s Talking SMS alerts', test: 'Send one SMS to the test number', when: TODAY + ' 08:08', ms: 1480, result: 'Slow', lane: 'Notifications', severity: 'Medium', owner: 'STF-005', region: 'Malawi'}
];

/* ---------------- transactions ---------------- */
const PM_TXNS = [];
(function(){
  const statuses = ['Success', 'Success', 'Success', 'Success', 'Success', 'Success', 'Pending', 'Failed'];
  const providers = {'Airtel Money': 'MM-AIR', 'TNM Mpamba': 'MM-TNM', 'Bank transfer': 'BT-FDH', 'Cash': 'CASH-BR'};
  let n = 0;
  PAYS.slice(0, 220).forEach((p, i) => {
    const seeded = rnd();
    let status = 'Success';
    if(seeded > 0.94) status = 'Pending';
    else if(seeded > 0.90) status = 'Failed';
    else if(seeded > 0.885) status = 'Cancelled';
    else if(seeded > 0.87) status = 'Reversed';
    const provider = providers[p.method] || 'MM-AIR';
    const feeRate = p.method === 'Airtel Money' ? 0.018 : p.method === 'TNM Mpamba' ? 0.017
      : p.method === 'Bank transfer' ? 0 : 0.029;
    const fee = Math.round((p.amount * feeRate) / 10) * 10;
    n++;
    PM_TXNS.push({
      id: 'PMT-' + pad(7100 + n, 5),
      when: p.date + ' ' + pad(ri(7, 18), 2) + ':' + pad(ri(0, 59), 2),
      receipt: p.receipt, loan: p.loan, cust: p.cust, amount: p.amount,
      method: p.method, code: p.method === 'Bank transfer' ? (i % 3 ? 'BT-FDH' : 'BT-STD') : provider,
      provider: p.method === 'Airtel Money' ? 'Airtel Malawi' : p.method === 'TNM Mpamba' ? 'TNM Mpamba'
        : p.method === 'Bank transfer' ? (i % 3 ? 'FDH Bank' : 'Standard Bank') : 'Branch counter',
      providerRef: (p.method === 'Airtel Money' ? 'MM-' : p.method === 'TNM Mpamba' ? 'TM-' : p.method === 'Cash' ? 'CSH-' : 'BNK-') + pad(800000 + n * 7, 6),
      status, officer: p.officer, branch: pick(REGIONS),
      fee, feePayer: p.method === 'Bank transfer' ? 'Company' : 'Customer',
      verified: status === 'Success' ? 'Verified' : status === 'Pending' ? 'Awaiting' : 'Rejected',
      reconciled: status === 'Success' && seeded < 0.88 ? 'Matched' : status === 'Success' ? 'Unmatched' : 'N/A',
      error: status === 'Failed' ? pick(['Provider returned 502', 'Callback signature mismatch', 'Customer had insufficient float', 'Timeout after 90 s'])
        : status === 'Cancelled' ? 'Customer cancelled on the handset'
        : status === 'Reversed' ? 'Duplicate payment reversed by the provider' : '',
      lane: p.method === 'Cash' ? 'Cash' : p.method === 'Bank transfer' ? 'Bank' : p.method === 'Airtel Money' || p.method === 'TNM Mpamba' ? 'Mobile money' : 'Gateway',
      severity: status === 'Failed' ? 'High' : status === 'Pending' ? 'Medium' : 'Low',
      owner: p.officer, region: pick(REGIONS)
    });
  });
  /* a couple of deliberate duplicates for the duplicate detector */
  [0, 3].forEach(i => {
    const src = PM_TXNS[i];
    PM_TXNS.push(Object.assign({}, src, {id: 'PMT-' + pad(7500 + i, 5), status: 'Success',
      reconciled: 'Duplicate', error: 'Same provider reference seen twice inside 10 minutes',
      verified: 'Awaiting', severity: 'High'}));
  });
})();
PM_TXNS.sort((a, b) => String(b.when).localeCompare(String(a.when)));

const PM_STATUS_COUNTS = () => ({
  total: PM_TXNS.length,
  success: PM_TXNS.filter(t => t.status === 'Success').length,
  pending: PM_TXNS.filter(t => t.status === 'Pending').length,
  failed: PM_TXNS.filter(t => t.status === 'Failed').length,
  cancelled: PM_TXNS.filter(t => t.status === 'Cancelled').length,
  reversed: PM_TXNS.filter(t => t.status === 'Reversed').length,
  duplicates: PM_TXNS.filter(t => t.reconciled === 'Duplicate').length,
  unreconciled: PM_TXNS.filter(t => t.reconciled === 'Unmatched').length
});

/* per-method rolling totals */
PM_METHODS.forEach(m => {
  const mine = PM_TXNS.filter(t => t.code === m.code || (m.code === 'BT-FDH' && t.code === 'BT-STD'));
  m.payments = mine.length;
  m.volume = sum(mine.filter(t => t.status === 'Success'), t => t.amount);
  m.last = mine.length ? mine[0].when : m.last;
});

/* ---------------- verification queue ---------------- */
const PM_VERIFY = PM_TXNS.filter(t => t.verified === 'Awaiting').slice(0, 12).map((t, i) => ({
  id: 'VER-' + pad(610 + i, 3),
  txn: t.id, receipt: t.receipt, when: t.when, method: t.method,
  amount: t.amount, expected: i % 5 === 0 ? t.amount - 5000 : t.amount,
  providerRef: t.providerRef, cust: t.cust, loan: t.loan,
  check: i % 5 === 0 ? 'Amount differs by MK 5,000' : i % 4 === 0 ? 'Reference missing on the provider line'
    : 'Callback and reference both match',
  level: i % 6 === 0 ? 'Second approval' : 'First check',
  status: i % 6 === 0 ? 'Awaiting approval' : 'Awaiting verification',
  lane: 'Verification', severity: i % 5 === 0 ? 'High' : 'Medium', owner: 'STF-001', region: pick(REGIONS)
}));
const PM_VERIFY_HISTORY = [
  {when: TODAY + ' 08:12', ref: 'PMT-07104', action: 'Verified automatically', by: 'System', detail: 'Callback, amount and reference matched'},
  {when: TODAY + ' 07:58', ref: 'PMT-07101', action: 'Verified manually', by: 'STF-001', detail: 'Provider line pasted from the portal'},
  {when: addDays(TODAY, -1) + ' 17:44', ref: 'PMT-07096', action: 'Rejected', by: 'STF-001', detail: 'Amount was MK 5,000 short of the instalment'},
  {when: addDays(TODAY, -1) + ' 15:02', ref: 'PMT-07090', action: 'Verified manually', by: 'STF-002', detail: 'Bank narration carried the loan reference'},
  {when: addDays(TODAY, -2) + ' 11:36', ref: 'PMT-07081', action: 'Rejected', by: 'STF-001', detail: 'Duplicate of PMT-07080 — reversed at the provider'},
  {when: addDays(TODAY, -3) + ' 09:20', ref: 'PMT-07072', action: 'Verified automatically', by: 'System', detail: 'Clean mobile money callback'}
];
const PM_REJECTED = [
  {when: addDays(TODAY, -1) + ' 17:44', ref: 'PMT-07096', amount: 62000, reason: 'Amount short by MK 5,000', by: 'STF-001', status: 'Rejected', lane: 'Verification', severity: 'Medium', owner: 'STF-001', region: 'Lilongwe'},
  {when: addDays(TODAY, -2) + ' 11:36', ref: 'PMT-07081', amount: 145000, reason: 'Duplicate provider reference', by: 'STF-001', status: 'Rejected', lane: 'Verification', severity: 'High', owner: 'STF-001', region: 'Lilongwe'},
  {when: addDays(TODAY, -4) + ' 14:02', ref: 'PMT-07063', amount: 38000, reason: 'Reference belongs to another customer', by: 'STF-002', status: 'Rejected', lane: 'Verification', severity: 'High', owner: 'STF-002', region: 'Mzuzu'}
];

/* ---------------- allocation ---------------- */
const PM_ALLOC = [];
(function(){
  PM_TXNS.filter(t => t.status === 'Success').slice(0, 40).forEach((t, i) => {
    const p = PAYS.find(x => x.receipt === t.receipt) || PAYS[i];
    const principal = p ? p.principal : Math.round(t.amount * 0.78);
    const interest = p ? p.interest : Math.round(t.amount * 0.2);
    const fees = p ? p.fees : Math.max(0, t.amount - principal - interest);
    PM_ALLOC.push({
      when: t.when, receipt: t.receipt, loan: t.loan, cust: t.cust, amount: t.amount,
      principal, interest, fees, before: (LOAN_BY_REF[t.loan] ? LOAN_BY_REF[t.loan].outstanding : 0) + principal,
      after: LOAN_BY_REF[t.loan] ? LOAN_BY_REF[t.loan].outstanding : 0,
      schedule: 'Instalment ' + (2 + (i % 8)) + ' marked paid',
      status: i % 13 === 0 ? 'Failed' : 'Allocated',
      note: i % 13 === 0 ? 'Loan already settled — allocation held for review' : 'Principal first, then interest, then fees',
      lane: 'Ledger', severity: i % 13 === 0 ? 'High' : 'Low', owner: 'STF-001', region: pick(REGIONS)
    });
  });
})();

/* ---------------- reconciliation ---------------- */
const PM_RECON = [
  {id: 'REC-8801', when: TODAY + ' 09:12', source: 'Airtel Money statement', lines: 148, matched: 146, missing: 2, duplicates: 0, difference: 0, status: 'Open', lane: 'Mobile money', severity: 'Medium', owner: 'STF-001', region: 'Lilongwe'},
  {id: 'REC-8800', when: TODAY + ' 09:10', source: 'FDH Bank statement', lines: 24, matched: 21, missing: 2, duplicates: 0, difference: 5000, status: 'Open', lane: 'Bank', severity: 'High', owner: 'STF-001', region: 'Lilongwe'},
  {id: 'REC-8799', when: TODAY + ' 09:08', source: 'Standard Bank statement', lines: 11, matched: 11, missing: 0, duplicates: 0, difference: 0, status: 'Matched', lane: 'Bank', severity: 'Low', owner: 'STF-001', region: 'Blantyre'},
  {id: 'REC-8798', when: TODAY + ' 08:55', source: 'Cash drawer — Lilongwe', lines: 6, matched: 6, missing: 0, duplicates: 0, difference: 0, status: 'Matched', lane: 'Cash', severity: 'Low', owner: 'STF-007', region: 'Lilongwe'},
  {id: 'REC-8797', when: TODAY + ' 08:50', source: 'Cash drawer — Mzuzu', lines: 3, matched: 2, missing: 0, duplicates: 0, difference: -5000, status: 'Variance', lane: 'Cash', severity: 'High', owner: 'STF-012', region: 'Mzuzu'},
  {id: 'REC-8796', when: addDays(TODAY, -1) + ' 18:05', source: 'TNM Mpamba statement', lines: 0, matched: 0, missing: 41, duplicates: 0, difference: 0, status: 'Blocked', lane: 'Mobile money', severity: 'Critical', owner: 'STF-001', region: 'Lilongwe'},
  {id: 'REC-8795', when: addDays(TODAY, -1) + ' 18:00', source: 'Airtel Money statement', lines: 162, matched: 162, missing: 0, duplicates: 0, difference: 0, status: 'Approved', lane: 'Mobile money', severity: 'Low', owner: 'STF-001', region: 'Lilongwe'},
  {id: 'REC-8794', when: addDays(TODAY, -2) + ' 18:00', source: 'Standard Bank statement', lines: 9, matched: 8, missing: 0, duplicates: 0, difference: 12000, status: 'Adjustment', lane: 'Bank', severity: 'Medium', owner: 'STF-001', region: 'Blantyre'}
];
const PM_ADJUST = [
  {id: 'ADJ-440', when: addDays(TODAY, -2) + ' 18:20', recon: 'REC-8794', kind: 'Bank charge', amount: -12000,
   reason: 'Wire fee deducted on the Standard Bank line', by: 'STF-001', approver: 'STF-009', status: 'Approved'},
  {id: 'ADJ-439', when: addDays(TODAY, -1) + ' 18:15', recon: 'REC-8796', kind: 'Timing', amount: 0,
   reason: 'Provider statement unavailable — nothing to adjust yet', by: 'STF-001', approver: 'STF-009', status: 'Pending'},
  {id: 'ADJ-438', when: addDays(TODAY, -3) + ' 17:50', recon: 'REC-8790', kind: 'Round-off', amount: 250,
   reason: 'Provider rounded a MWK 62,250 collection to 62,500', by: 'STF-001', approver: 'STF-009', status: 'Approved'}
];
const PM_RECON_DAILY = [
  {day: '24 Oct', matched: 186, unmatched: 4, variance: 0},
  {day: '25 Oct', matched: 142, unmatched: 3, variance: 0},
  {day: '26 Oct', matched: 204, unmatched: 6, variance: -12000},
  {day: '27 Oct', matched: 198, unmatched: 2, variance: 0},
  {day: '28 Oct', matched: 217, unmatched: 5, variance: 250},
  {day: '29 Oct', matched: 234, unmatched: 2, variance: 0},
  {day: '30 Oct', matched: 183, unmatched: 45, variance: -5000}
];

/* ---------------- fees and limits ---------------- */
const PM_FEES = [
  {method: 'Airtel Money', customerPct: 1.8, customerFlat: 0, companyPct: 0, companyFlat: 0,
   min: 500, max: 3000000, daily: 6000000, providerLimit: 3000000, effective: '2026-09-01'},
  {method: 'TNM Mpamba', customerPct: 1.7, customerFlat: 0, companyPct: 0, companyFlat: 0,
   min: 500, max: 2500000, daily: 5000000, providerLimit: 2500000, effective: '2026-09-01'},
  {method: 'Bank transfer — FDH', customerPct: 0, customerFlat: 2500, companyPct: 0, companyFlat: 0,
   min: 5000, max: 15000000, daily: 30000000, providerLimit: 15000000, effective: '2026-06-01'},
  {method: 'Bank transfer — Standard', customerPct: 0, customerFlat: 0, companyPct: 0.4, companyFlat: 0,
   min: 5000, max: 15000000, daily: 30000000, providerLimit: 15000000, effective: '2026-06-01'},
  {method: 'Cash at branch', customerPct: 0, customerFlat: 0, companyPct: 0, companyFlat: 0,
   min: 500, max: 500000, daily: 2000000, providerLimit: 500000, effective: '2026-01-15'},
  {method: 'PayChangu card gateway', customerPct: 2.9, customerFlat: 300, companyPct: 0, companyFlat: 0,
   min: 1000, max: 2000000, daily: 4000000, providerLimit: 2000000, effective: '2026-07-10'},
  {method: 'Mpamba agent till', customerPct: 1.2, customerFlat: 0, companyPct: 0, companyFlat: 0,
   min: 500, max: 400000, daily: 1500000, providerLimit: 400000, effective: '2026-08-22'}
];
const PM_FEE_HISTORY = [
  {when: addDays(TODAY, -3) + ' 10:20', method: 'PayChangu card gateway', change: 'Customer fee', from: '2.5%', to: '2.9% + MK 300', by: 'STF-001'},
  {when: addDays(TODAY, -20) + ' 09:15', method: 'Airtel Money', change: 'Maximum amount', from: 'MK 2,000,000', to: 'MK 3,000,000', by: 'STF-001'},
  {when: addDays(TODAY, -35) + ' 14:40', method: 'Mpamba agent till', change: 'Company fee', from: '1.5%', to: '1.2%', by: 'STF-002'},
  {when: addDays(TODAY, -60) + ' 11:05', method: 'Bang transfer — FDH'.replace('Bang', 'Bank'), change: 'Flat fee', from: 'MK 2,000', to: 'MK 2,500', by: 'STF-001'},
  {when: addDays(TODAY, -90) + ' 08:30', method: 'Cash at branch', change: 'Daily limit', from: 'MK 1,000,000', to: 'MK 2,000,000', by: 'STF-007'}
];

/* ---------------- receipts ---------------- */
const PM_RECEIPTS = PM_TXNS.filter(t => t.status === 'Success').slice(0, 90).map((t, i) => {
  const p = PAYS.find(x => x.receipt === t.receipt);
  return {
    receipt: t.receipt, when: t.when, cust: t.cust, loan: t.loan, amount: t.amount,
    method: t.method, officer: t.officer, status: i % 17 === 0 ? 'Reissued' : 'Issued',
    issued: 'Automatic', verified: i % 17 === 0 ? 'Reissued' : 'Verified',
    lane: 'Receipts', severity: 'Low', owner: t.officer, region: pick(REGIONS),
    due: p ? p.due : addMonths(TODAY, -1)
  };
});
const PM_RECEIPT_CORRECTIONS = [
  {id: 'COR-220', receipt: 'RCP-00341', when: addDays(TODAY, -1) + ' 15:30', field: 'Amount',
   from: 'MK 62,000', to: 'MK 67,000', reason: 'Instalment was short on the first posting', by: 'STF-001', status: 'Approved'},
  {id: 'COR-219', receipt: 'RCP-00318', when: addDays(TODAY, -4) + ' 09:12', field: 'Method',
   from: 'Cash', to: 'Airtel Money', reason: 'Cashier picked the wrong method', by: 'STF-007', status: 'Approved'},
  {id: 'COR-218', receipt: 'RCP-00296', when: addDays(TODAY, -9) + ' 11:48', field: 'Customer',
   from: 'CUS-0031', to: 'CUS-0021', reason: 'Reference belonged to another customer', by: 'STF-002', status: 'Approved'},
  {id: 'COR-217', receipt: 'RCP-00305', when: addDays(TODAY, -12) + ' 16:20', field: 'Amount',
   from: 'MK 145,000', to: 'MK 140,000', reason: 'Adjustment rejected — the posting was correct', by: 'STF-001', status: 'Rejected'}
];

/* ---------------- notifications ---------------- */
const PM_NOTIFY_RULES = [
  {event: 'Successful payment', sms: true, email: true, to: 'Customer', template: 'PAY_OK', on: true},
  {event: 'Pending payment', sms: true, email: false, to: 'Customer', template: 'PAY_PEND', on: true},
  {event: 'Failed payment', sms: true, email: true, to: 'Customer', template: 'PAY_FAIL', on: true},
  {event: 'Payment receipt', sms: true, email: true, to: 'Customer', template: 'RECEIPT', on: true},
  {event: 'Overdue repayment', sms: true, email: false, to: 'Customer', template: 'OVERDUE', on: true},
  {event: 'Staff payment alert', sms: false, email: true, to: 'Finance team', template: 'STAFF_ALERT', on: true},
  {event: 'Reconciliation gap', sms: false, email: true, to: 'Finance team', template: 'RECON_GAP', on: true},
  {event: 'Refund decision', sms: true, email: true, to: 'Customer', template: 'REFUND', on: true}
];
const PM_NOTIFY_LOG = [];
(function(){
  const events = ['Successful payment', 'Pending payment', 'Failed payment', 'Payment receipt', 'Overdue repayment'];
  for(let i = 0; i < 22; i++){
    const t = PM_TXNS[(i * 5) % 60];
    PM_NOTIFY_LOG.push({
      when: t.when, event: events[i % events.length], channel: i % 3 === 0 ? 'Email' : 'SMS',
      to: custName(t.cust), reference: t.receipt,
      status: i % 9 === 0 ? 'Failed' : i % 4 === 0 ? 'Queued' : 'Delivered',
      lane: 'Notifications', severity: i % 9 === 0 ? 'Medium' : 'Low', owner: 'STF-005', region: pick(REGIONS)
    });
  }
})();
const PM_CHANNELS = {
  sms: {provider: 'Africa’s Talking', sender: 'GOLDENFS', balance: 12480, status: 'Degraded', latency: 740,
    credential: 'Expires in 6 days', lastSend: TODAY + ' 08:08'},
  email: {provider: 'Resend', sender: 'payments@goldenloan.mw', balance: '48,200 of 50,000', status: 'Connected',
    latency: 204, credential: 'Valid', lastSend: TODAY + ' 08:12'}
};

/* ---------------- permissions ---------------- */
const PM_ROLES = ['Super Admin', 'Administrator', 'Finance Manager', 'Cashier', 'Collections Officer', 'Auditor'];
const PM_CAPS = ['Manage payment methods', 'Verify payments', 'Approve refunds and reversals',
  'Configure payment methods', 'Connect providers', 'Run reconciliation', 'View payment audit log'];
const PM_PERMS = {
  'Super Admin': [1, 1, 1, 1, 1, 1, 1],
  'Administrator': [1, 1, 1, 1, 1, 1, 1],
  'Finance Manager': [1, 1, 1, 0, 0, 1, 1],
  'Cashier': [0, 1, 0, 0, 0, 0, 0],
  'Collections Officer': [0, 1, 0, 0, 0, 1, 0],
  'Auditor': [0, 0, 0, 0, 0, 1, 1]
};
const PM_ROLE_STAFF = {'Super Admin': 'Chikondi Mwale', 'Administrator': 'Thokozani Banda',
  'Finance Manager': 'Grace Nyirenda', 'Cashier': 'Linda Mhango',
  'Collections Officer': 'Mavuto Tembo', 'Auditor': 'Mphatso Chirwa'};

/* ---------------- refunds, reversals, disputes ---------------- */
const PM_REFUNDS = [
  {id: 'REF-340', receipt: 'RCP-00291', cust: 'CUS-0019', amount: 145000, reason: 'Paid the wrong loan',
   requested: addDays(TODAY, -1) + ' 10:12', by: 'STF-007', approver: 'STF-009', status: 'Pending',
   eligible: 'Yes — settled twice in one day', lane: 'Refunds', severity: 'High', owner: 'STF-007', region: 'Lilongwe'},
  {id: 'REF-339', receipt: 'RCP-00286', cust: 'CUS-0004', amount: 62000, reason: 'Duplicate mobile money payment',
   requested: addDays(TODAY, -2) + ' 14:40', by: 'STF-001', approver: 'STF-009', status: 'Approved',
   eligible: 'Yes — duplicate provider reference', lane: 'Refunds', severity: 'High', owner: 'STF-001', region: 'Blantyre'},
  {id: 'REF-338', receipt: 'RCP-00274', cust: 'CUS-0021', amount: 90000, reason: 'Customer changed their mind',
   requested: addDays(TODAY, -5) + ' 09:20', by: 'STF-011', approver: 'STF-009', status: 'Rejected',
   eligible: 'No — the instalment was already allocated', lane: 'Refunds', severity: 'Medium', owner: 'STF-011', region: 'Mzuzu'},
  {id: 'REF-337', receipt: 'RCP-00261', cust: 'CUS-0031', amount: 210000, reason: 'Charged twice by the gateway',
   requested: addDays(TODAY, -8) + ' 16:05', by: 'STF-001', approver: 'STF-009', status: 'Refunded',
   eligible: 'Yes — gateway settled the same charge twice', lane: 'Refunds', severity: 'High', owner: 'STF-001', region: 'Lilongwe'}
];
const PM_REVERSALS = [
  {id: 'REV-118', txn: 'PMT-07081', receipt: 'RCP-00305', amount: 145000, when: addDays(TODAY, -2) + ' 11:40',
   reason: 'Duplicate provider reference', balance: 'Loan balance restored by MK 145,000', by: 'STF-001', status: 'Posted'},
  {id: 'REV-117', txn: 'PMT-07052', receipt: 'RCP-00281', amount: 74000, when: addDays(TODAY, -6) + ' 15:10',
   reason: 'Bank reversed the credit', balance: 'Loan balance restored by MK 74,000', by: 'STF-001', status: 'Posted'},
  {id: 'REV-116', txn: 'PMT-07031', receipt: 'RCP-00268', amount: 38000, when: addDays(TODAY, -11) + ' 10:02',
   reason: 'Customer disputed the charge', balance: 'Loan balance restored by MK 38,000', by: 'STF-002', status: 'Paid out'}
];
const PM_DISPUTES = [
  {id: 'DSP-77', cust: 'CUS-0019', loan: 'LN-2401', amount: 145000, raised: addDays(TODAY, -1) + ' 09:30',
   claim: 'Paid twice on 29 October', evidence: 'Two Airtel messages', status: 'Investigating',
   owner: 'STF-001', decision: '', lane: 'Disputes', severity: 'High', region: 'Lilongwe'},
  {id: 'DSP-76', cust: 'CUS-0031', loan: 'LN-2418', amount: 210000, raised: addDays(TODAY, -6) + ' 12:15',
   claim: 'Gateway charged my card twice', evidence: 'Bank SMS and card statement', status: 'Resolved',
   owner: 'STF-001', decision: 'Refunded in full, gateway confirmed', lane: 'Disputes', severity: 'High', region: 'Lilongwe'},
  {id: 'DSP-75', cust: 'CUS-0009', loan: 'LN-2430', amount: 132000, raised: addDays(TODAY, -13) + ' 14:44',
   claim: 'Cash receipt shows a different amount', evidence: 'Receipt photograph', status: 'Resolved',
   owner: 'STF-007', decision: 'Receipt corrected, balance adjusted', lane: 'Disputes', severity: 'Medium', region: 'Blantyre'}
];

/* ---------------- database ---------------- */
const PM_DB_TABLES = [
  {table: 'payment_methods', rows: 9, size: '96 KB', rls: 'Enabled', note: 'Admins write, everyone reads', lastWrite: TODAY + ' 08:12', lane: 'Database', severity: 'High', owner: 'STF-001', region: 'Frankfurt'},
  {table: 'payment_receipts', rows: 402, size: '4.8 MB', rls: 'Enabled', note: 'Insert-only, branch scoped', lastWrite: TODAY + ' 08:14', lane: 'Database', severity: 'High', owner: 'STF-001', region: 'Frankfurt'},
  {table: 'repayments', rows: 402, size: '3.2 MB', rls: 'Enabled', note: 'Officer and branch scoped', lastWrite: TODAY + ' 08:14', lane: 'Database', severity: 'High', owner: 'STF-001', region: 'Frankfurt'},
  {table: 'repayment_allocations', rows: 402, size: '1.9 MB', rls: 'Enabled', note: 'Principal, interest and fee split', lastWrite: TODAY + ' 08:14', lane: 'Database', severity: 'High', owner: 'STF-001', region: 'Frankfurt'},
  {table: 'loans', rows: 77, size: '2.4 MB', rls: 'Enabled', note: 'Officer and branch scoped', lastWrite: TODAY + ' 08:14', lane: 'Database', severity: 'High', owner: 'STF-001', region: 'Frankfurt'},
  {table: 'customers', rows: 60, size: '3.1 MB', rls: 'Enabled', note: 'Branch and role scoped', lastWrite: TODAY + ' 07:58', lane: 'Database', severity: 'High', owner: 'STF-001', region: 'Frankfurt'},
  {table: 'payment_config', rows: 42, size: '48 KB', rls: 'Disabled', note: 'Any authenticated user can read', lastWrite: addDays(TODAY, -2), lane: 'Database', severity: 'Critical', owner: 'STF-001', region: 'Frankfurt'},
  {table: 'webhook_events', rows: 4180, size: '12 MB', rls: 'Enabled', note: 'Insert-only, service role', lastWrite: TODAY + ' 08:14', lane: 'Database', severity: 'Medium', owner: 'STF-001', region: 'Frankfurt'}
];
const PM_DB_FUNCS = [
  {name: 'allocate_payment', kind: 'Function', invoker: 'Definer', calls: 402, status: 'Healthy', note: 'Splits a receipt across principal, interest and fees'},
  {name: 'issue_receipt', kind: 'Function', invoker: 'Definer', calls: 402, status: 'Healthy', note: 'Increments the receipt sequence atomically'},
  {name: 'recalc_loan_balance', kind: 'Trigger', invoker: 'Definer', calls: 402, status: 'Healthy', note: 'Recomputes outstanding and arrears'},
  {name: 'verify_payment_callback', kind: 'Edge function', invoker: 'Service role', calls: 1240, status: 'Degraded', note: 'Validates the provider signature'},
  {name: 'reconcile_daily', kind: 'Scheduled', invoker: 'Definer', calls: 30, status: 'Healthy', note: 'Runs at 18:00 for every provider'},
  {name: 'detect_duplicate_payment', kind: 'Trigger', invoker: 'Definer', calls: 402, status: 'Healthy', note: 'Blocks a provider reference seen twice'}
];
const PM_DB_ERRORS = [
  {when: TODAY + ' 08:02', code: '23505', message: 'Duplicate key on payment_receipts.provider_reference', count: 3, status: 'Open', lane: 'Database', severity: 'High', owner: 'STF-001', region: 'Frankfurt'},
  {when: TODAY + ' 07:20', code: '57014', message: 'Statement timeout on allocate_payment during the morning run', count: 2, status: 'Open', lane: 'Database', severity: 'High', owner: 'STF-001', region: 'Frankfurt'},
  {when: addDays(TODAY, -1) + ' 18:12', code: '42501', message: 'Permission denied writing payment_config without an admin role', count: 5, status: 'Resolved', lane: 'Database', severity: 'Medium', owner: 'STF-001', region: 'Frankfurt'},
  {when: addDays(TODAY, -2) + ' 11:36', code: '23514', message: 'Check constraint rejected a negative allocation', count: 1, status: 'Resolved', lane: 'Database', severity: 'Medium', owner: 'STF-001', region: 'Frankfurt'},
  {when: addDays(TODAY, -4) + ' 09:40', code: '40001', message: 'Serialization failure on the receipt sequence', count: 1, status: 'Resolved', lane: 'Database', severity: 'Low', owner: 'STF-001', region: 'Frankfurt'}
];
const PM_DB_CHECKS = [
  {check: 'Payment method table reachable', value: '9 rows in 8 ms', status: 'Pass'},
  {check: 'Receipt table insert', value: 'Insert and rollback in 14 ms', status: 'Pass'},
  {check: 'Repayment and allocation join', value: '402 rows, p95 44 ms', status: 'Pass'},
  {check: 'Loan and customer linkage', value: 'No orphan receipts', status: 'Pass'},
  {check: 'Row-level security', value: '1 table without a policy', status: 'Fail'},
  {check: 'Sequence gaps in receipts', value: 'None in the last 30 days', status: 'Pass'},
  {check: 'Schema version', value: '2026.10.28.1 matches the app', status: 'Pass'},
  {check: 'Payment total against loan totals', value: 'Difference of MK 0', status: 'Pass'}
];
const PM_MIGRATIONS = [
  {id: '20261028_01', name: 'add payment_methods and payment_config', when: '2026-10-28 07:44', status: 'Applied'},
  {id: '20261021_03', name: 'index payment_receipts(provider_reference)', when: '2026-10-21 09:12', status: 'Applied'},
  {id: '20261014_02', name: 'add repayment_allocations.principal', when: '2026-10-14 18:26', status: 'Applied'},
  {id: '20260930_01', name: 'tighten payment_receipts RLS', when: '2026-09-30 11:40', status: 'Applied'},
  {id: '20261101_02', name: 'enable RLS on payment_config', when: '2026-11-01 06:00', status: 'Pending'}
];

/* ---------------- api and webhooks ---------------- */
const PM_API = [
  {path: '/payments/airtel/collect', method: 'POST', p95: 312, calls: 1480, errors: 9, status: 'Healthy', lane: 'API', severity: 'High', owner: 'STF-001', region: 'Frankfurt'},
  {path: '/payments/mpamba/collect', method: 'POST', p95: 0, calls: 410, errors: 88, status: 'Failing', lane: 'API', severity: 'Critical', owner: 'STF-001', region: 'Frankfurt'},
  {path: '/payments/paychangu/charge', method: 'POST', p95: 268, calls: 620, errors: 12, status: 'Healthy', lane: 'API', severity: 'Medium', owner: 'STF-001', region: 'Frankfurt'},
  {path: '/payments/callback/:provider', method: 'POST', p95: 96, calls: 3980, errors: 44, status: 'Degraded', lane: 'API', severity: 'High', owner: 'STF-001', region: 'Frankfurt'},
  {path: '/payments/:id/verify', method: 'POST', p95: 142, calls: 240, errors: 2, status: 'Healthy', lane: 'API', severity: 'High', owner: 'STF-001', region: 'Frankfurt'},
  {path: '/payments/:id/reverse', method: 'POST', p95: 188, calls: 38, errors: 1, status: 'Healthy', lane: 'API', severity: 'High', owner: 'STF-001', region: 'Frankfurt'},
  {path: '/payments/receipts', method: 'GET', p95: 88, calls: 1840, errors: 3, status: 'Healthy', lane: 'API', severity: 'Medium', owner: 'STF-001', region: 'Frankfurt'},
  {path: '/payments/reconcile/run', method: 'POST', p95: 640, calls: 30, errors: 0, status: 'Healthy', lane: 'API', severity: 'Medium', owner: 'STF-001', region: 'Frankfurt'}
];
const PM_REQ_LOG = [
  {when: TODAY + ' 08:14', route: '/payments/airtel/collect', provider: 'Airtel Malawi', ms: 312, code: '201', keys: 1, status: 'OK'},
  {when: TODAY + ' 08:02', route: '/payments/mpamba/collect', provider: 'TNM Mpamba', ms: 0, code: '502', keys: 1, status: 'Failed'},
  {when: TODAY + ' 07:48', route: '/payments/airtel/collect', provider: 'Airtel Malawi', ms: 288, code: '201', keys: 1, status: 'OK'},
  {when: TODAY + ' 07:22', route: '/payments/mpamba/collect', provider: 'TNM Mpamba', ms: 90000, code: '504', keys: 0, status: 'Timeout'},
  {when: TODAY + ' 07:05', route: '/payments/paychangu/charge', provider: 'PayChangu', ms: 268, code: '201', keys: 2, status: 'Duplicate blocked'},
  {when: addDays(TODAY, -1) + ' 19:22', route: '/payments/paychangu/charge', provider: 'PayChangu', ms: 302, code: '201', keys: 1, status: 'OK'},
  {when: addDays(TODAY, -1) + ' 18:40', route: '/payments/airtel/collect', provider: 'Airtel Malawi', ms: 402, code: '201', keys: 1, status: 'OK'},
  {when: addDays(TODAY, -1) + ' 16:20', route: '/payments/mpamba/collect', provider: 'TNM Mpamba', ms: 90000, code: '504', keys: 0, status: 'Timeout'}
];
const PM_CONF_LOG = [
  {when: TODAY + ' 08:14', provider: 'Airtel Malawi', event: 'payment.success', ref: 'MM-884120', ms: 96, verified: 'Signature valid', status: 'Accepted'},
  {when: TODAY + ' 08:02', provider: 'TNM Mpamba', event: 'payment.failed', ref: 'TM-551907', ms: 44, verified: 'Signature valid', status: 'Accepted'},
  {when: TODAY + ' 07:22', provider: 'TNM Mpamba', event: 'payment.pending', ref: 'TM-551884', ms: 0, verified: 'No callback received', status: 'Timed out'},
  {when: TODAY + ' 07:12', provider: 'Unknown origin', event: 'payment.success', ref: 'MM-999999', ms: 22, verified: 'Signature mismatch', status: 'Rejected'},
  {when: addDays(TODAY, -1) + ' 19:22', provider: 'PayChangu', event: 'charge.success', ref: 'PC-77102', ms: 118, verified: 'Signature valid', status: 'Accepted'},
  {when: addDays(TODAY, -1) + ' 16:24', provider: 'TNM Mpamba', event: 'payment.failed', ref: 'TM-551760', ms: 60, verified: 'Signature valid', status: 'Accepted'}
];
const PM_WEBHOOKS = [
  {id: 'WH-9901', provider: 'Airtel Money', event: 'payment.success', attempts: 1, when: TODAY + ' 08:14', ms: 96, status: 'Delivered', lane: 'Webhooks', severity: 'Low', owner: 'STF-001', region: 'Frankfurt'},
  {id: 'WH-9900', provider: 'TNM Mpamba', event: 'payment.failed', attempts: 1, when: TODAY + ' 08:02', ms: 44, status: 'Delivered', lane: 'Webhooks', severity: 'Low', owner: 'STF-001', region: 'Frankfurt'},
  {id: 'WH-9899', provider: 'TNM Mpamba', event: 'payment.pending', attempts: 3, when: TODAY + ' 07:22', ms: 0, status: 'Failed', lane: 'Webhooks', severity: 'High', owner: 'STF-001', region: 'Frankfurt'},
  {id: 'WH-9898', provider: 'Unknown origin', event: 'payment.success', attempts: 1, when: TODAY + ' 07:12', ms: 22, status: 'Rejected', lane: 'Webhooks', severity: 'Critical', owner: 'STF-001', region: 'Frankfurt'},
  {id: 'WH-9897', provider: 'PayChangu', event: 'charge.success', attempts: 1, when: addDays(TODAY, -1) + ' 19:22', ms: 118, status: 'Delivered', lane: 'Webhooks', severity: 'Low', owner: 'STF-001', region: 'Frankfurt'},
  {id: 'WH-9896', provider: 'Airtel Money', event: 'payment.success', attempts: 2, when: addDays(TODAY, -1) + ' 18:40', ms: 402, status: 'Delivered (retry)', lane: 'Webhooks', severity: 'Medium', owner: 'STF-001', region: 'Frankfurt'}
];
const PM_RETRIES = [
  {when: TODAY + ' 07:22', provider: 'TNM Mpamba', event: 'payment.pending', attempt: 3, delay: '30 min', next: 'Dead-letter queue', status: 'Exhausted'},
  {when: addDays(TODAY, -1) + ' 18:40', provider: 'Airtel Money', event: 'payment.success', attempt: 2, delay: '5 min', next: 'Delivered', status: 'Recovered'},
  {when: addDays(TODAY, -1) + ' 12:02', provider: 'PayChangu', event: 'charge.success', attempt: 2, delay: '5 min', next: 'Delivered', status: 'Recovered'},
  {when: addDays(TODAY, -2) + ' 16:10', provider: 'TNM Mpamba', event: 'payment.failed', attempt: 3, delay: '30 min', next: 'Dead-letter queue', status: 'Exhausted'}
];
const PM_RATE = [
  {provider: 'Airtel Money', limit: 600, used: 214, window: 'per minute', status: 'Within limit'},
  {provider: 'TNM Mpamba', limit: 600, used: 12, window: 'per minute', status: 'Within limit'},
  {provider: 'PayChangu', limit: 300, used: 288, window: 'per minute', status: 'Near limit'},
  {provider: 'Airtel Money', limit: 10000, used: 8420, window: 'per hour', status: 'Within limit'},
  {provider: 'PayChangu', limit: 5000, used: 4940, window: 'per hour', status: 'Near limit'}
];

/* ---------------- reports ---------------- */
const PM_REPORTS = [
  {key: 'daily', title: 'Daily Payment Report', desc: 'Every payment received today, by method and officer'},
  {key: 'weekly', title: 'Weekly Payment Report', desc: 'Seven days of collections with the trend line'},
  {key: 'monthly', title: 'Monthly Payment Report', desc: 'Month to date against the target'},
  {key: 'method', title: 'Payments by Method', desc: 'Volume and value per payment method'},
  {key: 'provider', title: 'Payments by Provider', desc: 'Which provider carried the money'},
  {key: 'staff', title: 'Payments by Staff Member', desc: 'Receipts posted per officer'},
  {key: 'status', title: 'Successful and Failed Payments', desc: 'Outcome mix with the failure reasons'},
  {key: 'fees', title: 'Payment Processing Fees Report', desc: 'Fees charged, and who paid them'},
  {key: 'unreconciled', title: 'Unreconciled Payments Report', desc: 'Payments still waiting on a statement line'},
  {key: 'collections', title: 'Loan Repayment Collection Report', desc: 'Collections against the loan book'},
  {key: 'verification', title: 'Payment Verification Report', desc: 'Verified, rejected and pending records'},
  {key: 'refunds', title: 'Refunds and Reversals Report', desc: 'Money returned to customers'}
];

/* ---------------- configuration and audit ---------------- */
const PM_CHANGES = [
  {when: TODAY + ' 08:12', what: 'TNM Mpamba reference rule', area: 'Reference', from: '8 digits', to: '8–12 characters', by: 'STF-001'},
  {when: TODAY + ' 08:04', what: 'Airtel Money maximum amount', area: 'Limits', from: 'MK 2,500,000', to: 'MK 3,000,000', by: 'STF-001'},
  {when: addDays(TODAY, -1) + ' 16:30', what: 'Cash payments', area: 'Methods', from: 'Disabled', to: 'Enabled', by: 'STF-007'},
  {when: addDays(TODAY, -2) + ' 11:20', what: 'PayChangu customer fee', area: 'Fees', from: '2.5%', to: '2.9% + MK 300', by: 'STF-001'},
  {when: addDays(TODAY, -2) + ' 09:15', what: 'Reconciliation run time', area: 'Reconciliation', from: '17:00', to: '18:00', by: 'STF-001'},
  {when: addDays(TODAY, -3) + ' 14:40', what: 'Zomba agent float', area: 'Methods', from: 'Enabled', to: 'Disabled', by: 'STF-007'},
  {when: addDays(TODAY, -5) + ' 10:02', what: 'Receipt number format', area: 'Receipts', from: 'RCP-NNNN', to: 'RCP-NNNNN', by: 'STF-001'},
  {when: addDays(TODAY, -6) + ' 15:18', what: 'SMS alerts', area: 'Notifications', from: 'Off', to: 'On', by: 'STF-005'},
  {when: addDays(TODAY, -9) + ' 09:40', what: 'NBS Bank transfer', area: 'Methods', from: 'Enabled', to: 'Archived', by: 'STF-001'},
  {when: addDays(TODAY, -12) + ' 13:26', what: 'Webhook signature', area: 'Security', from: 'None', to: 'HMAC-SHA256', by: 'STF-001'},
  {when: addDays(TODAY, -15) + ' 08:50', what: 'Transaction timeout', area: 'Timeouts', from: '60 s', to: '90 s', by: 'STF-001'},
  {when: addDays(TODAY, -19) + ' 12:04', what: 'Duplicate window', area: 'Verification', from: '5 minutes', to: '10 minutes', by: 'STF-001'}
];
const PM_APPROVALS = [
  {id: 'APR-980', change: 'Rotate TNM Mpamba key', area: 'Provider', requested: addDays(TODAY, -1), by: 'STF-001', approver: 'STF-009', state: 'Pending'},
  {id: 'APR-979', change: 'Enable RLS on payment_config', area: 'Database', requested: addDays(TODAY, -2), by: 'STF-001', approver: 'STF-009', state: 'Pending'},
  {id: 'APR-978', change: 'Refund REF-340 (MK 145,000)', area: 'Refund', requested: addDays(TODAY, -1), by: 'STF-007', approver: 'STF-009', state: 'Pending'},
  {id: 'APR-977', change: 'Raise the PayChangu daily limit', area: 'Limits', requested: addDays(TODAY, -7), by: 'STF-001', approver: 'STF-009', state: 'Approved'}
];
const PM_SECURITY_EVENTS = [
  {when: TODAY + ' 07:12', event: 'Webhook rejected — signature mismatch', source: 'Unknown origin', severity: 'Critical', status: 'Open', lane: 'Security', owner: 'STF-001', region: 'Frankfurt'},
  {when: TODAY + ' 06:40', event: 'API credential used from an unexpected address', source: 'MM-TNM key', severity: 'High', status: 'Investigating', lane: 'Security', owner: 'STF-001', region: 'Frankfurt'},
  {when: addDays(TODAY, -1) + ' 22:05', event: 'Repeated verification failures on one receipt', source: 'RCP-00305', severity: 'Medium', status: 'Resolved', lane: 'Security', owner: 'STF-001', region: 'Lilongwe'},
  {when: addDays(TODAY, -2) + ' 14:30', event: 'Refund attempted without approval', source: 'REF-338', severity: 'High', status: 'Resolved', lane: 'Security', owner: 'STF-009', region: 'Mzuzu'},
  {when: addDays(TODAY, -4) + ' 09:12', event: 'Cashier opened a receipt outside the branch till', source: 'STF-014', severity: 'Medium', status: 'Resolved', lane: 'Security', owner: 'STF-001', region: 'Zomba'}
];

/* ---------------- derived numbers ---------------- */
/* keep the seeded universe inside the reporting window — nothing is dated after TODAY */
[PM_METHODS, MM_STATUS, PM_BANK, PM_STATEMENTS, CASH_COLLECTIONS, CASH_HANDOVERS, PM_PROVIDERS, PM_CONN_TESTS,
 PM_TXNS, PM_VERIFY, PM_VERIFY_HISTORY, PM_REJECTED, PM_ALLOC, PM_RECON, PM_ADJUST, PM_FEE_HISTORY,
 PM_RECEIPTS, PM_RECEIPT_CORRECTIONS, PM_NOTIFY_LOG, PM_REFUNDS, PM_REVERSALS, PM_DISPUTES,
 PM_DB_TABLES, PM_DB_ERRORS, PM_API, PM_REQ_LOG, PM_CONF_LOG, PM_WEBHOOKS, PM_RETRIES, PM_CHANGES,
 PM_APPROVALS, PM_SECURITY_EVENTS, PM_MIGRATIONS].forEach(list => list.forEach(r => {
  ['when', 'requested', 'raised', 'imported', 'date', 'due', 'lastCheck', 'lastWrite', 'updated'].forEach(k => {
    const v = r[k];
    if(typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v) && v.slice(0, 10) > TODAY)
      r[k] = addDays(TODAY, -1) + v.slice(10);
  });
}));
PM_TXNS.sort((a, b) => String(b.when).localeCompare(String(a.when)));

function pmStats(){
  const c = PM_STATUS_COUNTS();
  const enabled = PM_METHODS.filter(m => m.status === 'Enabled' && !m.archived).length;
  const providers = PM_PROVIDERS.filter(p => p.status === 'Connected').length;
  const pendingVerify = PM_VERIFY.filter(v => v.status !== 'Rejected').length;
  const openRecon = PM_RECON.filter(r => r.status === 'Open' || r.status === 'Variance' || r.status === 'Blocked').length;
  const successVolume = sum(PM_TXNS.filter(t => t.status === 'Success'), t => t.amount);
  const feesCollected = sum(PM_TXNS.filter(t => t.status === 'Success'), t => t.fee);
  const failedRate = c.total ? (c.failed + c.cancelled) / c.total * 100 : 0;
  const reconRate = c.success ? (c.success - c.unreconciled - c.duplicates) / c.success * 100 : 0;
  const score = clamp(100
    - (c.total ? c.failed / c.total * 180 : 0)
    - c.pending * 1.4
    - c.duplicates * 2.2
    - c.unreconciled * 0.9
    - openRecon * 3
    - (PM_PROVIDERS.length - providers) * 5
    - (PM_METHODS.filter(m => m.archived).length) * 1.5, 0, 100);
  return {total: c.total, success: c.success, pending: c.pending, failed: c.failed, cancelled: c.cancelled,
    reversed: c.reversed, duplicates: c.duplicates, unreconciled: c.unreconciled, enabled, providers,
    pendingVerify, openRecon, successVolume, feesCollected, failedRate, reconRate, score};
}

/* ---------------- shared colours for the method chips ---------------- */
const PM_METHOD_COLOURS = {
  'Airtel Money': '#D93F3F', 'TNM Mpamba': '#2F6FED', 'Bank transfer': '#0E9AA7',
  'Cash': '#C9A227', 'Gateway': '#7C5CF0', 'Agent': '#E08C1E'
};

</script>
