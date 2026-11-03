<script>
/* ============================================================
   DEPOSITS & WITHDRAWALS MANAGEMENT & CONNECTIONS (6/7)
   Sections 10–13: balance and ledger management, limits and
   fees, refunds and reversals, receipts and statements.
   ============================================================ */

/* ===================== 10 · BALANCE AND LEDGER ===================== */
function renderLedger(){
  const s = dwS();
  const led = DW_LEDGER.filter(dwPass);
  if(el('blPill')){
    el('blPill').className = 'badge ' + (DW_DISCREPANCY.length ? 'b-warn' : 'b-ok');
    el('blPill').textContent = DW_DISCREPANCY.length + ' discrepancies';
  }
  put('blKpis', [
    ['Opening balance', dwM(sum(DW_ACCOUNTS, a => a.opening)), 'Across every customer account', ''],
    ['Deposits credited', dwM(s.totalDeposits), 'Confirmed deposits only', ''],
    ['Withdrawals debited', dwM(s.totalWithdrawals), 'Amount and fee together', ''],
    ['Reserved for payouts', dwM(s.reservedTotal), 'Withdrawals in flight', ''],
    ['Available balance', dwM(s.availableTotal), 'What customers can draw', ''],
    ['Ledger balance', dwM(s.availableTotal + s.reservedTotal), 'Available plus reserved', ''],
    ['Ledger entries', num(DW_LEDGER.length), 'Append-only, never edited', ''],
    ['Discrepancies', num(DW_DISCREPANCY.length), 'Balance against ledger', DW_DISCREPANCY.length ? 'red' : '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join(''));

  if(el('blCompPill')) el('blCompPill').textContent = dwM(s.availableTotal + s.reservedTotal);
  put('blCompBox',
    meter('Opening balances', sum(DW_ACCOUNTS, a => a.opening), num(DW_ACCOUNTS.length) + ' accounts', Math.max(1, sum(DW_ACCOUNTS, a => a.opening))) +
    meter('Deposits credited', s.totalDeposits, num(DW_DEPOSITS.filter(t => t.status === 'Completed').length) + ' deposits', Math.max(1, s.totalDeposits)) +
    meter('Withdrawals debited', s.totalWithdrawals, num(DW_WITHDRAWALS.filter(t => t.status === 'Completed').length) + ' payouts', Math.max(1, s.totalWithdrawals)) +
    meter('Reserved for payouts', s.reservedTotal, num(DW_WITHDRAWALS.filter(t => t.status === 'Pending' || t.status === 'Processing').length) + ' not released', Math.max(1, s.availableTotal)) +
    meter('Available to customers', s.availableTotal, 'The figure the app shows', Math.max(1, s.availableTotal + s.reservedTotal)));

  if(el('blPendPill')) el('blPendPill').textContent = (s.pending + s.processing) + ' open';
  put('blPendingBox',
    kvRow('Pending deposit', 'Nothing is credited until it is verified. The customer sees “pending”, the ledger stays untouched.')
    + kvRow('Processing withdrawal', 'The amount is reserved — the customer can see it but cannot spend it twice.')
    + kvRow('Failed withdrawal', 'The reservation is released and the funds return to the available balance.')
    + kvRow('Reversed transaction', 'The opposite entry is posted; nothing is deleted.')
    + kvRow('Amount reserved now', dwM(s.reservedTotal))
    + kvRow('Transactions in flight', num(s.pending + s.processing)));

  if(el('blLedgerPill')) el('blLedgerPill').textContent = num(led.length) + ' entries';
  renderTable('blLedgerBody', [
    {k: 'entry', label: 'Entry'},
    {k: 'when', label: 'When', html: v => esc(dwWhen(v))},
    {k: 'account', label: 'Account'},
    {k: 'txn', label: 'Transaction'},
    {k: 'kind', label: 'Debit or credit', html: v => badge(v, v === 'Credit' ? 'b-ok' : 'b-warn')},
    {k: 'amount', label: 'Amount', num: true, html: v => esc(dwM(v))},
    {k: 'balance', label: 'Balance after', num: true, html: v => esc(dwM(v))},
    {k: 'status', label: 'Status', html: v => okb(v)}
  ], led.slice().sort((a, b) => String(b.when).localeCompare(String(a.when))), {sort: 'when', pageSize: 12});

  if(el('blDiscPill')) el('blDiscPill').textContent = num(DW_DISCREPANCY.length) + ' alerts';
  put('blDiscBox', DW_DISCREPANCY.filter(dwPass).map(d => `<div class="risk rowlink" data-acctpick="${esc(d.account)}">
      <div><div class="rn">${esc(d.account)} · ${esc(custName(d.cust))}</div>
        <div class="rs">Ledger ${esc(dwM(d.ledger))} · system ${esc(dwM(d.system))} · ${esc(d.note)}</div></div>
      <div class="rv">${badge(dwM(Math.abs(d.difference)) + ' out', DW_SEV(d.severity))}</div></div>`).join('')
    || '<div class="empty">Every account balance agrees with the ledger.</div>');

  if(el('blCorrPill')) el('blCorrPill').textContent = num(DW_ADJUST.length) + ' records';
  dwFillSel('blCorrAcct', dwAcctOptions());
  renderTable('blCorrBody', [
    {k: 'when', label: 'When', html: v => esc(dwWhen(v))},
    {k: 'id', label: 'Adjustment'},
    {k: 'account', label: 'Account'},
    {k: 'amount', label: 'Amount', num: true, html: v => esc((v < 0 ? '−' : '+') + dwM(Math.abs(v)))},
    {k: 'reason', label: 'Reason'},
    {k: 'status', label: 'Status', html: v => okb(v)}
  ], DW_ADJUST.filter(dwPass), {sort: 'when', pageSize: 5, onRow: false});
}

/* ===================== 11 · LIMITS AND FEES ===================== */
function dwFeeFor(method, type, amount){
  const f = DW_FEES.find(x => x.method === method) || {depositPct: 0, depositFlat: 0, withdrawalPct: 0, withdrawalFlat: 0, payer: 'Customer'};
  const pctv = type === 'Deposit' ? f.depositPct : f.withdrawalPct;
  const flat = type === 'Deposit' ? f.depositFlat : f.withdrawalFlat;
  return Math.round(Number(amount) * pctv / 100) + flat;
}
function renderLimits(){
  const rows = DW_LIMITS.filter(dwPass);
  if(el('lfPill')){
    el('lfPill').className = 'badge b-gray';
    el('lfPill').textContent = DW_LIMITS.length + ' methods · ' + DW_FEES.length + ' fee rules';
  }
  put('lfKpis', [
    ['Minimum deposit', dwM(DW_SET.minDeposit), 'Below this the counter refuses it', ''],
    ['Maximum deposit', dwM(DW_SET.maxDeposit), 'Larger needs a special approval', ''],
    ['Minimum withdrawal', dwM(DW_SET.minWithdrawal), 'No payout below this', ''],
    ['Maximum withdrawal', dwM(DW_SET.maxWithdrawal), 'Larger needs two signatures', ''],
    ['Daily deposit limit', dwM(DW_SET.dailyDepositLimit), 'Across the branch', ''],
    ['Daily withdrawal limit', dwM(DW_SET.dailyWithdrawalLimit), 'Across the branch', ''],
    ['Per-customer daily limit', dwM(DW_SET.perCustomerDailyLimit), 'Deposits and withdrawals together', ''],
    ['Withdrawal fee', DW_SET.withdrawalFeePct + '% + ' + dwM(DW_SET.withdrawalFeeFlat), 'Paid by the ' + DW_SET.feePayer.toLowerCase(), '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join(''));

  if(el('lfCount')) el('lfCount').textContent = num(rows.length) + ' methods';
  renderTable('lfBody', [
    {k: 'method', label: 'Method'},
    {k: 'provider', label: 'Provider'},
    {k: 'depMin', label: 'Deposit min', num: true, html: v => esc(dwM(v))},
    {k: 'depMax', label: 'Deposit max', num: true, html: (v, r) => `<input class="lfedit" data-lf="depMax" data-m="${esc(r.method)}" type="number" step="100000" value="${Number(v)||0}" style="width:110px" />`},
    {k: 'wdrMax', label: 'Withdrawal max', num: true, html: (v, r) => `<input class="lfedit" data-lf="wdrMax" data-m="${esc(r.method)}" type="number" step="100000" value="${Number(v)||0}" style="width:110px" />`},
    {k: 'dailyDeposit', label: 'Daily deposit', num: true, html: v => esc(dwM(v))},
    {k: 'dailyWithdrawal', label: 'Daily withdrawal', num: true, html: v => esc(dwM(v))},
    {k: 'providerCeiling', label: 'Provider ceiling', num: true, html: v => esc(dwM(v))},
    {k: 'effective', label: 'In force from', html: v => esc(fmtDate(dwIsos(v)))}
  ], rows, {pageSize: 6, onRow: false});

  if(el('lfDailyPill')) el('lfDailyPill').textContent = fmtDate(TODAY);
  renderTable('lfDailyBody', [
    {k: 'day', label: 'Day', html: v => esc(fmtDate(v))},
    {k: 'deposits', label: 'Deposits', num: true, html: v => esc(dwM(v))},
    {k: 'withdrawals', label: 'Withdrawals', num: true, html: v => esc(dwM(v))},
    {k: 'limit', label: 'Limit', num: true, html: v => esc(dwM(v))},
    {k: 'used', label: 'Withdrawal limit used', html: v => {
      const used = Math.round(pct(v, DW_SET.dailyWithdrawalLimit));
      return meter(used + '%', used, 'of ' + dwM(DW_SET.dailyWithdrawalLimit), 100);
    }}
  ], DW_DAILY.map(d => ({day: d.day, deposits: d.deposits, withdrawals: d.withdrawals, limit: d.limit, used: d.withdrawals})),
    {pageSize: 7, onRow: false});

  dwFillSel('lfCalcMethod', dwMethodOptions(el('lfCalcType') ? el('lfCalcType').value : 'Deposit'));
  put('lfCalcBox', el('lfCalcBox').innerHTML || '<div class="qhint">Pick a method and an amount, then calculate.</div>');
  put('lfRuleBox', el('lfRuleBox').innerHTML || '<div class="qhint">Fee rules in force: ' +
    DW_FEES.map(f => f.method + ' ' + (f.withdrawalPct) + '% + ' + dwM(f.withdrawalFlat)).join(' · ') + '</div>');

  const custRows = DW_VELOCITY.map(v => ({cust: v.cust, withdrawals24h: v.withdrawals24h, limit: v.limit,
    amount24h: v.amount24h, amountLimit: v.amountLimit, status: v.status}));
  if(el('lfCustPill')) el('lfCustPill').textContent = num(custRows.filter(c => c.status === 'Breach').length) + ' at the ceiling';
  renderTable('lfCustBody', [
    {k: 'cust', label: 'Customer', html: v => esc(custName(v))},
    {k: 'withdrawals24h', label: 'Payouts today', num: true},
    {k: 'limit', label: 'Allowed', num: true},
    {k: 'amount24h', label: 'Value today', num: true, html: v => esc(dwM(v))},
    {k: 'amountLimit', label: 'Daily ceiling', num: true, html: v => esc(dwM(v))},
    {k: 'status', label: 'State', html: v => okb(v)}
  ], custRows, {sort: 'amount24h', pageSize: 7, onRow: false});

  if(el('lfHistPill')) el('lfHistPill').textContent = num(DW_FEE_HISTORY.length) + ' changes';
  renderTable('lfHistBody', [
    {k: 'when', label: 'When', html: v => esc(dwWhen(v))},
    {k: 'scope', label: 'What changed'},
    {k: 'from', label: 'Was'},
    {k: 'to', label: 'Now'},
    {k: 'by', label: 'Officer', html: v => esc(staffName(v))}
  ], DW_FEE_HISTORY.filter(dwPass), {sort: 'when', pageSize: 5, onRow: false});

  const completed = DW_TXN.filter(t => t.status === 'Completed');
  put('lfGrid',
    chartBox({title: 'Fees collected by method', sub: 'MWK', type: 'bar', h: 190,
      cats: DW_METHODS.map(m => m.method.replace(' transfer', '')),
      series: [{name: 'Fees', data: DW_METHODS.map(m => sum(completed.filter(t => t.method === m.method), t => t.fee))}],
      value: compact(dwS().fees)}) +
    chartBox({title: 'Who paid the fee', sub: 'Customer against company', type: 'donut', h: 190,
      cats: ['Customer', 'Company'],
      series: [{name: 'Fees', data: ['Customer', 'Company'].map(p => sum(completed.filter(t =>
        (DW_FEES.find(f => f.method === t.method) || {payer: 'Customer'}).payer === p), t => t.fee))}],
      value: compact(dwS().fees)}) +
    chartBox({title: 'Daily limit used', sub: 'Withdrawals against the ceiling', type: 'line', h: 190,
      cats: DW_DAILY.map(d => fmtShort(d.day)),
      series: [{name: 'Withdrawals', data: DW_DAILY.map(d => d.withdrawals), colour: '#C9A227'},
        {name: 'Ceiling', data: DW_DAILY.map(() => DW_SET.dailyWithdrawalLimit), colour: '#9AA0AC'}],
      value: compact(DW_SET.dailyWithdrawalLimit)}));
}

/* ===================== 12 · REFUNDS AND REVERSALS ===================== */
function renderReversals(){
  const s = dwS();
  if(el('rrPill')){
    el('rrPill').className = 'badge ' + (DW_REVERSALS.some(r => r.status === 'Pending') ? 'b-warn' : 'b-ok');
    el('rrPill').textContent = num(DW_REVERSALS.filter(r => r.status === 'Pending').length) + ' pending';
  }
  put('rrKpis', [
    ['Reversal requests', num(DW_REVERSALS.length), 'Deposits and withdrawals', ''],
    ['Value to reverse', dwM(sum(DW_REVERSALS.filter(r => r.status !== 'Rejected'), r => r.amount)), 'If every request is approved', ''],
    ['Approved', num(DW_REVERSALS.filter(r => r.status === 'Approved').length), 'Waiting for the posting', ''],
    ['Posted', num(DW_REVERSALS.filter(r => r.status === 'Posted').length), 'The opposite entry is on the ledger', ''],
    ['Pending', num(DW_REVERSALS.filter(r => r.status === 'Pending').length), 'Needs a second signature', DW_REVERSALS.some(r => r.status === 'Pending') ? 'red' : ''],
    ['Refunds', num(DW_REFUNDS.length), dwM(sum(DW_REFUNDS, r => r.amount)), ''],
    ['Duplicate deposits', num(DW_DUPES.length), 'Held until a decision', ''],
    ['Failed payout recovery', num(DW_FAIL_RECOVERY.filter(f => f.status === 'Recovered').length) + ' of ' + num(DW_FAIL_RECOVERY.length), 'Funds already returned', '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join(''));

  if(el('rrReqPill')) el('rrReqPill').textContent = num(DW_REVERSALS.length + DW_REFUNDS.length) + ' requests';
  renderTable('rrReqBody', [
    {k: 'id', label: 'Request'},
    {k: 'txn', label: 'Transaction'},
    {k: 'type', label: 'Type'},
    {k: 'amount', label: 'Amount', num: true, html: v => esc(dwM(v))},
    {k: 'reason', label: 'Reason'},
    {k: 'requested', label: 'Raised', html: v => esc(dwWhen(v))},
    {k: 'status', label: 'Status', html: v => okb(v)},
    {k: 'act', label: 'Action', html: v => `<button class="btn btn-ghost" data-rract="${esc(v)}">Decide</button>`}
  ], DW_REVERSALS.filter(dwPass).map(r => Object.assign({}, r, {act: r.id})), {sort: 'requested', pageSize: 6});

  if(el('rrDupPill')) el('rrDupPill').textContent = num(DW_DUPES.length) + ' groups';
  renderTable('rrDupBody', [
    {k: 'ref', label: 'Provider reference'},
    {k: 'count', label: 'Postings', num: true},
    {k: 'amount', label: 'Value', num: true, html: v => esc(dwM(v))},
    {k: 'ids', label: 'Deposits'},
    {k: 'status', label: 'State', html: v => okb(v)}
  ], DW_DUPES, {pageSize: 4, onRow: false});
  renderTable('rrFailBody', [
    {k: 'txn', label: 'Payout'},
    {k: 'amount', label: 'Amount', num: true, html: v => esc(dwM(v))},
    {k: 'reason', label: 'Why it failed'},
    {k: 'recovery', label: 'Recovery'},
    {k: 'status', label: 'State', html: v => okb(v)}
  ], DW_FAIL_RECOVERY, {pageSize: 4, onRow: false});

  if(el('rrEligPill')) el('rrEligPill').textContent = '5 rules';
  put('rrEligBox', [
    ['The transaction is posted and settled', 'A pending row is cancelled, never reversed'],
    ['Inside the reversal window', '30 days for a deposit, 7 days for a payout'],
    ['A reason is recorded', 'Duplicate, provider refusal, wrong customer, wrong amount'],
    ['The account is not suspended', 'A suspended account needs the review first'],
    ['Two officers sign above the threshold', 'Above ' + dwM(DW_SET.approvalThreshold) + ' the request needs management']
  ].map(([label, detail]) => `<div class="checkrow"><div class="ck pass">✓</div>
      <div style="flex:1"><div style="font-size:10.5px;font-weight:800">${esc(label)}</div>
        <div class="qhint">${esc(detail)}</div></div>
      <div>${okb('Pass')}</div></div>`).join(''));
  put('rrFlowBox', '<div class="minihead">Approval workflow</div>'
    + kvRow('Step 1 · Request raised', 'An officer names the transaction and the reason')
    + kvRow('Step 2 · Line review', 'Balance and provider record checked')
    + kvRow('Step 3 · Management', 'Signed above ' + dwM(DW_SET.approvalThreshold))
    + kvRow('Step 4 · Posting', 'The opposite ledger entry is written and the account reopens')
    + kvRow('Step 5 · Notice', 'The customer is told, by SMS and email'));

  const revLed = DW_LEDGER.filter(e => e.status === 'Reversed');
  if(el('rrLedgerPill')) el('rrLedgerPill').textContent = num(revLed.length) + ' entries';
  renderTable('rrLedgerBody', [
    {k: 'entry', label: 'Entry'},
    {k: 'when', label: 'When', html: v => esc(dwWhen(v))},
    {k: 'account', label: 'Account'},
    {k: 'txn', label: 'Transaction'},
    {k: 'amount', label: 'Amount', num: true, html: v => esc(dwM(v))},
    {k: 'status', label: 'Status', html: v => okb(v)}
  ], revLed, {sort: 'when', pageSize: 5, onRow: false});

  if(el('rrReconPill')) el('rrReconPill').textContent = num(DW_REVERSALS.length) + ' checked';
  put('rrReconBox', DW_REVERSALS.map(r => kvRow(r.ref + ' · ' + r.type,
    r.status === 'Posted' ? okb('Matched') : r.status === 'Approved' ? badge('Waiting', 'b-warn') : badge('Provider not yet', 'b-gray'))).join(''));
  put('rrNotifyBox', '<div class="minihead">Customer notices queued</div>'
    + kvRow('SMS', okb('Queued') + ' · ' + DW_CHANNELS.sms.provider)
    + kvRow('Email', okb('Queued') + ' · ' + DW_CHANNELS.email.provider)
    + kvRow('Sent today', num(DW_NOTIFY_LOG.filter(n => dwIsos(n.when) === TODAY).length))
    + kvRow('Rule', 'Transaction reversed · customer and staff'));

  if(el('rrAuditPill')) el('rrAuditPill').textContent = num(DW_REV_AUDIT.length) + ' entries';
  renderTable('rrAuditBody', [
    {k: 'requested', label: 'When', html: v => esc(dwWhen(v))},
    {k: 'id', label: 'Request'},
    {k: 'type', label: 'Type'},
    {k: 'ref', label: 'Transaction'},
    {k: 'amount', label: 'Amount', num: true, html: v => esc(dwM(v))},
    {k: 'status', label: 'Status', html: v => okb(v)}
  ], DW_REV_AUDIT.filter(dwPass), {sort: 'requested', pageSize: 6, onRow: false});
}

/* ===================== 13 · RECEIPTS AND STATEMENTS ===================== */
function renderReceipts(){
  const rec = DW_RECEIPTS.filter(dwPass);
  const depRec = rec.filter(r => r.type === 'Deposit');
  const wdrRec = rec.filter(r => r.type === 'Withdrawal');
  if(el('rsPill')){
    el('rsPill').className = 'badge b-gray';
    el('rsPill').textContent = num(DW_RECEIPTS.length) + ' receipts';
  }
  put('rsKpis', [
    ['Receipts issued', num(DW_RECEIPTS.length), 'Every completed movement has one', ''],
    ['Deposit receipts', num(depRec.length), dwM(sum(depRec, r => r.amount)), ''],
    ['Withdrawal receipts', num(wdrRec.length), dwM(sum(wdrRec, r => r.amount)), ''],
    ['Reissued', num(DW_RECEIPTS.filter(r => r.issued === 'Reissued').length), 'A customer asked for a copy', ''],
    ['Corrections', num(DW_RECEIPT_CORRECTIONS.length), 'Field changed with a reason', ''],
    ['Receipt prefix', DW_SET.receiptPrefix + '-' + pad(1, DW_SET.receiptDigits).replace(/0/g, '#'), 'Set in the settings section', ''],
    ['Statements built', num(EXPORTS.filter(e => /Statement/i.test(e.report)).length), 'From this page', ''],
    ['Fees on receipts', dwM(sum(rec, r => r.fee)), 'Shown on every document', '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join(''));

  if(el('rsDepPill')) el('rsDepPill').textContent = num(depRec.length) + ' receipts';
  const depRows = depRec.slice(0, 30).map(r => Object.assign({}, r, {act: r.receipt}));
  renderTable('rsDepBody', [
    {k: 'receipt', label: 'Receipt'},
    {k: 'when', label: 'Date', html: v => esc(dwWhen(v))},
    {k: 'cust', label: 'Customer', html: v => esc(custName(v))},
    {k: 'amount', label: 'Amount', num: true, html: v => esc(dwM(v))},
    {k: 'method', label: 'Method'},
    {k: 'act', label: '', html: v => `<button class="btn btn-ghost" data-rcpt="${esc(v)}">Open</button>`}
  ], depRows, {sort: 'when', pageSize: 7});

  if(el('rsWdrPill')) el('rsWdrPill').textContent = num(wdrRec.length) + ' receipts';
  const wdrRows = wdrRec.slice(0, 30).map(r => Object.assign({}, r, {act: r.receipt}));
  renderTable('rsWdrBody', [
    {k: 'receipt', label: 'Receipt'},
    {k: 'when', label: 'Date', html: v => esc(dwWhen(v))},
    {k: 'cust', label: 'Customer', html: v => esc(custName(v))},
    {k: 'amount', label: 'Amount', num: true, html: v => esc(dwM(v))},
    {k: 'method', label: 'Method'},
    {k: 'act', label: '', html: v => `<button class="btn btn-ghost" data-rcpt="${esc(v)}">Open</button>`}
  ], wdrRows, {sort: 'when', pageSize: 7});

  if(el('rsVerPill')) el('rsVerPill').textContent = num(DW_RECEIPTS.length) + ' verifiable';
  if(el('rsVerifyBox') && !el('rsVerifyBox').innerHTML)
    el('rsVerifyBox').innerHTML = '<div class="qhint">Paste a receipt number — the check compares it to the transaction and the ledger entry behind it.</div>';
  renderTable('rsReissueBody', [
    {k: 'when', label: 'When', html: v => esc(dwWhen(v))},
    {k: 'receipt', label: 'Receipt'},
    {k: 'field', label: 'Field corrected'},
    {k: 'from', label: 'Was'},
    {k: 'to', label: 'Now'},
    {k: 'status', label: 'Status', html: v => okb(v)}
  ], DW_RECEIPT_CORRECTIONS, {sort: 'when', pageSize: 4, onRow: false});

  if(el('rsStmtPill')) el('rsStmtPill').textContent = fmtDate(FILTER.from) + ' – ' + fmtDate(FILTER.to);
  dwFillSel('rsStmtCust', dwCustOptions(), DW_SEL.stmtCust || CUSTOMERS[0].id);
  if(el('rsFrom') && !el('rsFrom').value) el('rsFrom').value = FILTER.from;
  if(el('rsTo') && !el('rsTo').value) el('rsTo').value = FILTER.to;
  if(el('rsStmtBox') && !el('rsStmtBox').innerHTML)
    el('rsStmtBox').innerHTML = '<div class="qhint">Pick a customer and a range, then build the statement — it can be printed or downloaded.</div>';

  if(el('rsActPill')) el('rsActPill').textContent = num(DW_TXN.filter(t => t.cust === (el('rsStmtCust') ? el('rsStmtCust').value : '')).length) + ' movements';
  const custId = el('rsStmtCust') ? el('rsStmtCust').value : CUSTOMERS[0].id;
  const act = DW_TXN.filter(t => t.cust === custId).slice(0, 14);
  put('rsActBox', `<div class="strip">${[['Customer', custName(custId)], ['Movements', num(act.length)],
      ['Deposits', dwM(sum(act.filter(t => t.type === 'Deposit' && t.status === 'Completed'), t => t.amount))],
      ['Withdrawals', dwM(sum(act.filter(t => t.type === 'Withdrawal' && t.status === 'Completed'), t => t.amount))],
      ['Account', (DW_ACC_BY_CUST[custId] || {id: '—'}).id]]
    .map(([k, v]) => `<div><div class="sl">${esc(k)}</div><div class="sv">${esc(v)}</div></div>`).join('')}</div>`
    + (act.length ? act.map(t => kvRow(t.id + ' · ' + t.type + ' · ' + dwWhen(t.when),
        dwM(t.amount) + ' · ' + okb(t.status))).join('')
      : '<div class="empty">No movement for this customer.</div>'));
}
</script>
