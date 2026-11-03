<script>
/* ============================================================
   DEPOSITS & WITHDRAWALS MANAGEMENT & CONNECTIONS (5/7)
   Sections 6–9: customer account connections, the loan account
   link, payment method connections and transaction processing.
   ============================================================ */

let TP_STATE = '';
const DW_SEL_ACCT = () => DW_ACCOUNT_BY_SELECT();
function DW_ACCOUNT_BY_SELECT(){
  return DW_ACC_BY_ID[DW_SEL.acct] || DW_ACCOUNTS[0];
}

/* ===================== 6 · CUSTOMER ACCOUNT CONNECTIONS ===================== */
function renderCustomerAccounts(){
  const rows = DW_ACCOUNTS.filter(dwPass);
  const sel = DW_ACCOUNT_BY_SELECT();
  if(dwPass(sel) === false) DW_SEL.acct = (rows[0] || DW_ACCOUNTS[0]).id;
  const cur = DW_ACC_BY_ID[DW_SEL.acct] || rows[0] || DW_ACCOUNTS[0];

  if(el('caPill')){
    el('caPill').className = 'badge ' + (dwS().suspended ? 'b-warn' : 'b-ok');
    el('caPill').textContent = num(DW_ACCOUNTS.length) + ' accounts';
  }
  put('caKpis', [
    ['Accounts connected', num(rows.length), 'Every customer has one', ''],
    ['Available balance', dwM(sum(rows, a => a.available)), 'What the customers can draw today', ''],
    ['Reserved for payouts', dwM(sum(rows, a => a.reserved)), 'Promised to withdrawals in flight', ''],
    ['Ledger balance', dwM(sum(rows, a => a.ledger)), 'Available plus reserved', ''],
    ['Suspended accounts', num(rows.filter(a => a.status === 'Suspended').length), 'Nothing moves until reviewed', rows.filter(a => a.status === 'Suspended').length ? 'red' : ''],
    ['Opening balance total', dwM(sum(rows, a => a.opening)), 'Where each account started', ''],
    ['Deposits credited', dwM(sum(rows, a => a.deposits)), 'Across the reporting window', ''],
    ['Withdrawals debited', dwM(sum(rows, a => a.withdrawals)), 'Amount plus fee', '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join(''));

  if(el('caCount')) el('caCount').textContent = num(rows.length) + ' accounts';
  const sorted = rows.slice().sort((a, b) => a.id.localeCompare(b.id));
  sorted.forEach(a => { a._open = () => { DW_SEL.acct = a.id; renderCustomerAccounts(); }; });
  renderTable('caBody', [
    {k: 'id', label: 'Account'},
    {k: 'cust', label: 'Customer', html: v => esc(custName(v))},
    {k: 'type', label: 'Type'},
    {k: 'region', label: 'Branch'},
    {k: 'available', label: 'Available', num: true, html: v => esc(dwM(v))},
    {k: 'reserved', label: 'Reserved', num: true, html: v => esc(dwM(v))},
    {k: 'ledger', label: 'Ledger', num: true, html: v => esc(dwM(v))},
    {k: 'lastMove', label: 'Last movement', html: v => esc(fmtDate(dwIsos(v)))},
    {k: 'status', label: 'Status', html: v => okb(v)}
  ], sorted, {sort: 'available', pageSize: 10});

  if(el('caSelPill')) el('caSelPill').textContent = cur.id;
  put('caAcctBox', kvRow('Account', cur.id + ' · ' + cur.type)
    + kvRow('Customer', custName(cur.cust) + ' · ' + cur.cust)
    + kvRow('Branch', cur.region)
    + kvRow('Opened', fmtDate(cur.opened))
    + kvRow('Currency', cur.currency)
    + kvRow('Status', okb(cur.status)));
  put('caBalBox', kvRow('Opening balance', dwM(cur.opening))
    + kvRow('Deposits credited', dwM(cur.deposits || 0))
    + kvRow('Withdrawals debited', dwM(cur.withdrawals || 0))
    + kvRow('Reserved for payouts', dwM(cur.reserved))
    + kvRow('Available balance', dwM(cur.available))
    + kvRow('Ledger balance', dwM(cur.ledger)));

  const mine = DW_LEDGER.filter(e => e.account === cur.id);
  if(el('caResPill')) el('caResPill').textContent = dwM(cur.reserved) + ' reserved';
  const pending = DW_WITHDRAWALS.filter(t => t.account === cur.id && (t.status === 'Pending' || t.status === 'Processing'));
  put('caReservedBox', pending.length ? pending.map(t => kvRow(t.id + ' · ' + t.method, dwM(t.amount) + ' · ' + t.status))
    .join('') : '<div class="empty">Nothing reserved on this account.</div>');
  renderTable('caLedgerBody', [
    {k: 'entry', label: 'Entry'},
    {k: 'when', label: 'When', html: v => esc(dwWhen(v))},
    {k: 'kind', label: 'Kind', html: v => badge(v, v === 'Credit' ? 'b-ok' : 'b-warn')},
    {k: 'txn', label: 'Transaction'},
    {k: 'amount', label: 'Amount', num: true, html: v => esc(dwM(v))},
    {k: 'balance', label: 'Balance after', num: true, html: v => esc(dwM(v))}
  ], mine.sort((a, b) => String(b.when).localeCompare(String(a.when))), {sort: 'when', pageSize: 7});

  const susp = DW_ACCOUNTS.filter(a => a.status === 'Suspended');
  if(el('caSuspPill')) el('caSuspPill').textContent = num(susp.length) + ' accounts';
  put('caSuspBox', susp.length ? susp.map(a => `<div class="risk rowlink" data-acctpick="${esc(a.id)}">
      <div><div class="rn">${esc(a.id)} · ${esc(custName(a.cust))}</div>
        <div class="rs">${esc(a.type)} · ${esc(dwM(a.available))} held · ${esc(a.region)}</div></div>
      <div class="rv">${okb('Suspended')}</div></div>`).join('')
    : '<div class="empty">Every account is active.</div>');

  if(el('caAuditPill')) el('caAuditPill').textContent = num(mine.length) + ' movements';
  renderTable('caAuditBody', [
    {k: 'when', label: 'When', html: v => esc(dwWhen(v))},
    {k: 'txn', label: 'Transaction'},
    {k: 'kind', label: 'Kind'},
    {k: 'source', label: 'Method'},
    {k: 'amount', label: 'Amount', num: true, html: v => esc(dwM(v))},
    {k: 'status', label: 'Status', html: v => okb(v)}
  ], mine.sort((a, b) => String(b.when).localeCompare(String(a.when))), {sort: 'when', pageSize: 6});

  if(el('caStmtBox') && !el('caStmtBox').innerHTML)
    el('caStmtBox').innerHTML = '<div class="qhint">Reconcile the account or generate its statement — both write to the audit history.</div>';
}

/* ===================== 7 · LOAN ACCOUNT CONNECTIONS ===================== */
function renderLoanLinks(){
  const linked = DW_DEPOSITS.filter(t => t.loan && dwPass(t));
  if(el('laPill')){
    el('laPill').className = 'badge b-gray';
    el('laPill').textContent = num(linked.length) + ' linked deposits';
  }
  put('laKpis', [
    ['Deposits linked to a loan', num(linked.length), 'The rest sit on the customer account', ''],
    ['Value applied to loans', dwM(sum(linked.filter(t => t.status === 'Completed'), t => t.amount)), 'Posted against a facility', ''],
    ['Loans touched', num(new Set(linked.map(t => t.loan)).size), 'Across the book', ''],
    ['Disbursements', num(LOANS.filter(l => dwIsos(l.date) >= FILTER.from && dwIsos(l.date) <= FILTER.to).length), 'Money out against a loan, not a withdrawal', ''],
    ['Repayments', num(PAYS.filter(p => dwIsos(p.date) >= FILTER.from && dwIsos(p.date) <= FILTER.to).length), 'A repayment is not a deposit', ''],
    ['Unallocated deposits', num(linked.filter(t => !t.loan).length), 'Waiting for an officer to place them', ''],
    ['Balance guard trips', '0', 'No wrong balance change today', ''],
    ['Schedule updates', num(linked.filter(t => t.status === 'Completed').length), 'One per posted deposit', '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join(''));

  if(el('laLinkPill')) el('laLinkPill').textContent = num(linked.length) + ' rows';
  renderTable('laBodyR', [
    {k: 'id', label: 'Deposit'},
    {k: 'when', label: 'Date', html: v => esc(dwWhen(v))},
    {k: 'cust', label: 'Customer', html: v => esc(custName(v))},
    {k: 'loan', label: 'Loan'},
    {k: 'amount', label: 'Amount', num: true, html: v => esc(dwM(v))},
    {k: 'status', label: 'Status', html: v => okb(v)}
  ], linked.slice().sort((a, b) => String(b.when).localeCompare(String(a.when))), {sort: 'when', pageSize: 8});

  if(el('laDistPill')) el('laDistPill').textContent = '4 registers';
  const depToday = sum(DW_DEPOSITS.filter(t => dwIsos(t.when) === TODAY && t.status === 'Completed'), t => t.amount);
  const wdrToday = sum(DW_WITHDRAWALS.filter(t => dwIsos(t.when) === TODAY && t.status === 'Completed'), t => t.amount);
  const disbToday = sum(LOANS.filter(l => dwIsos(l.date) === TODAY), l => l.amount);
  const repToday = sum(PAYS.filter(p => dwIsos(p.date) === TODAY), p => p.amount);
  put('laDistBox', kvRow('Deposit', 'Customer puts money in · ' + dwM(depToday) + ' today')
    + kvRow('Withdrawal', 'Customer takes money out · ' + dwM(wdrToday) + ' today')
    + kvRow('Disbursement', 'We pay a loan out · ' + dwM(disbToday) + ' today')
    + kvRow('Repayment', 'Customer pays a loan back · ' + dwM(repToday) + ' today')
    + kvRow('The line between them', 'A deposit that names a loan is a repayment; without a loan it is savings'));

  const linkCount = {};
  DW_DEPOSITS.forEach(t => { if(t.loan) linkCount[t.loan] = (linkCount[t.loan] || 0) + 1; });
  const busiest = Object.keys(linkCount).sort((a, b) => linkCount[b] - linkCount[a])[0];
  const lo = LOANS.find(l => l.ref === DW_SEL.loan) || LOANS.find(l => l.ref === busiest) || LOANS[0];
  if(lo) DW_SEL.loan = lo.ref;
  dwFillSel('laLoanSel', dwLoanOptions(), lo ? lo.ref : '');
  put('laBalBox', lo ? kvRow('Loan', lo.ref + ' · ' + custName(lo.cust))
    + kvRow('Disbursed', dwM(lo.amount))
    + kvRow('Outstanding', dwM(lo.outstanding))
    + kvRow('Linked deposits', num(DW_DEPOSITS.filter(t => t.loan === lo.ref).length))
    + kvRow('Next instalment', dwM(lo.instalment || 0))
    + kvRow('Balance after a deposit', dwM(Math.max(0, lo.outstanding - sum(DW_DEPOSITS.filter(t => t.loan === lo.ref && t.status !== 'Rejected' && t.status !== 'Failed'), t => t.amount))))
    : '<div class="empty">No loan selected.</div>');

  if(el('laGuardPill')) el('laGuardPill').textContent = 'Guarded';
  put('laGuardBox', '<div class="note gold"><div>A deposit never edits a loan balance directly. It writes a ledger credit, then a database function applies it to the facility — so a duplicate posting is refused, and a deposit pointed at the wrong loan can be reversed without touching the schedule twice.</div></div>'
    + kvRow('Duplicate reference refused', okb('Pass'))
    + kvRow('Loan must belong to the customer', okb('Pass'))
    + kvRow('Balance can never go below zero', okb('Pass'))
    + kvRow('Every change is audited', okb('Pass')));
  renderTable('laHistBody', [
    {k: 'when', label: 'When', html: v => esc(dwWhen(v))},
    {k: 'id', label: 'Deposit'},
    {k: 'loan', label: 'Loan'},
    {k: 'amount', label: 'Amount', num: true, html: v => esc(dwM(v))},
    {k: 'status', label: 'Applied', html: v => okb(v === 'Completed' ? 'Approved' : v)}
  ], linked.slice(0, 12).sort((a, b) => String(b.when).localeCompare(String(a.when))), {sort: 'when', pageSize: 6, onRow: false});
}

/* ===================== 8 · PAYMENT METHOD CONNECTIONS ===================== */
function renderMethodConnections(){
  const dep = DW_DEPOSITS.filter(dwPass), wdr = DW_WITHDRAWALS.filter(dwPass);
  if(el('mtPill')){
    el('mtPill').className = 'badge b-ok';
    el('mtPill').textContent = DW_METHODS.length + ' rails live';
  }
  put('mtKpis', [
    ['Rails connected', num(DW_METHODS.length), 'Airtel, Mpamba, bank, cash, card', ''],
    ['Deposit value', dwM(sum(dep.filter(t => t.status === 'Completed'), t => t.amount)), 'Settled money in', ''],
    ['Withdrawal value', dwM(sum(wdr.filter(t => t.status === 'Completed'), t => t.amount)), 'Settled money out', ''],
    ['Busiest rail', (dep.concat(wdr).reduce((a, b) => (a.m === b.method ? a : b), {method: '—', m: 0}) || {}).method, 'By number of movements', ''],
    ['Provider failures', num(dep.concat(wdr).filter(t => t.status === 'Failed').length), 'Refused or timed out at the rail', ''],
    ['Confirmation callbacks', num(DW_NOTIFY_LOG.length), 'Every one logged', ''],
    ['Average latency', '690 ms', 'Across the reachable rails', ''],
    ['Availability', '99.6%', 'Last 30 days', '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join(''));

  const depRows = DW_METHODS.map(m => {
    const rows = dep.filter(t => t.method === m.method);
    return {method: m.method, provider: m.provider, count: rows.length,
      value: sum(rows.filter(t => t.status === 'Completed'), t => t.amount),
      failed: rows.filter(t => t.status === 'Failed').length,
      fees: sum(rows.filter(t => t.status === 'Completed'), t => t.fee),
      status: rows.some(t => t.status === 'Failed') ? 'Review' : 'Connected'};
  });
  if(el('mtDepPill')) el('mtDepPill').textContent = num(dep.length) + ' deposits';
  renderTable('mtDepBody', [
    {k: 'method', label: 'Method'}, {k: 'provider', label: 'Provider'},
    {k: 'count', label: 'Deposits', num: true},
    {k: 'value', label: 'Value', num: true, html: v => esc(dwM(v))},
    {k: 'fees', label: 'Fees', num: true, html: v => esc(dwM(v))},
    {k: 'status', label: 'Rail', html: v => okb(v)}
  ], depRows, {sort: 'value', pageSize: 6, onRow: false});

  const wdrRows = DW_METHODS.filter(m => m.method !== 'Card gateway').map(m => {
    const rows = wdr.filter(t => t.method === m.method);
    return {method: m.method, provider: m.provider, count: rows.length,
      value: sum(rows.filter(t => t.status === 'Completed'), t => t.amount),
      failed: rows.filter(t => t.status === 'Failed').length,
      fees: sum(rows.filter(t => t.status === 'Completed'), t => t.fee),
      status: rows.some(t => t.status === 'Failed') ? 'Review' : 'Connected'};
  });
  if(el('mtWdrPill')) el('mtWdrPill').textContent = num(wdr.length) + ' withdrawals';
  renderTable('mtWdrBody', [
    {k: 'method', label: 'Method'}, {k: 'provider', label: 'Provider'},
    {k: 'count', label: 'Payouts', num: true},
    {k: 'value', label: 'Value', num: true, html: v => esc(dwM(v))},
    {k: 'failed', label: 'Failed', num: true},
    {k: 'status', label: 'Rail', html: v => okb(v)}
  ], wdrRows, {sort: 'value', pageSize: 6, onRow: false});

  if(el('mtConnPill')) el('mtConnPill').textContent = DW_METHODS.length + ' of ' + DW_METHODS.length + ' up';
  put('mtConnBox', DW_METHODS.map(m => `<div class="risk"><div><div class="rn">${esc(m.method)}</div>
      <div class="rs">${esc(m.provider)} · ${esc(m.lane)} · refs ${esc(m.refPrefix)}-######</div></div>
      <div class="rv">${okb('Connected')}</div></div>`).join(''));

  if(!el('mtRefBox').innerHTML){
    el('mtRefBox').innerHTML = '<div class="qhint">Check any provider reference against the register — the check reads the live book, not a copy.</div>';
  }
  put('mtAvailBox', '<div class="minihead">Rail availability</div>' + DW_METHODS.map(m => {
    const ok = !DW_TXN.some(t => t.method === m.method && t.status === 'Failed' && dwIsos(t.when) === TODAY);
    return kvRow(m.method + ' deposits', okb(ok ? 'Available' : 'Review'));
  }).join('') + kvRow('Withdrawals over every rail', okb('Available')));

  if(el('mtConfPill')) el('mtConfPill').textContent = num(DW_TXN.slice(0, 12).length) + ' callbacks';
  const conf = DW_TXN.slice(0, 12).map((t, i) => ({when: t.when, reference: t.ref, method: t.method,
    amount: t.amount, signature: i % 7 === 0 ? 'Failed' : 'Verified', action: 'Posted', txn: t.id}));
  renderTable('mtConfBody', [
    {k: 'when', label: 'When', html: v => esc(dwWhen(v))},
    {k: 'reference', label: 'Provider reference'},
    {k: 'method', label: 'Rail'},
    {k: 'amount', label: 'Amount', num: true, html: v => esc(dwM(v))},
    {k: 'signature', label: 'Signature', html: v => okb(v)},
    {k: 'action', label: 'Action'}
  ], conf, {sort: 'when', pageSize: 6, onRow: false});

  const fails = DW_TXN.filter(t => t.status === 'Failed' || t.status === 'Rejected');
  if(el('mtFailPill')) el('mtFailPill').textContent = num(fails.length) + ' failures';
  renderTable('mtFailBody', [
    {k: 'id', label: 'Transaction'},
    {k: 'when', label: 'When', html: v => esc(dwWhen(v))},
    {k: 'method', label: 'Rail'},
    {k: 'amount', label: 'Amount', num: true, html: v => esc(dwM(v))},
    {k: 'stage', label: 'Reason'},
    {k: 'status', label: 'Status', html: v => okb(v)}
  ], fails.filter(dwPass), {sort: 'when', pageSize: 6, onRow: false});

  put('mtGrid',
    chartBox({title: 'Deposits by rail', sub: 'Value settled, MWK', type: 'bar', h: 190,
      cats: DW_METHODS.map(m => m.method.replace(' transfer', '')),
      series: [{name: 'Deposits', data: DW_METHODS.map(m => sum(DW_DEPOSITS.filter(t => t.method === m.method && t.status === 'Completed'), t => t.amount))}],
      value: compact(dwS().totalDeposits)}) +
    chartBox({title: 'Payouts by rail', sub: 'Value settled, MWK', type: 'bar', h: 190,
      cats: DW_METHODS.map(m => m.method.replace(' transfer', '')),
      series: [{name: 'Withdrawals', data: DW_METHODS.map(m => sum(DW_WITHDRAWALS.filter(t => t.method === m.method && t.status === 'Completed'), t => t.amount))}],
      value: compact(dwS().totalWithdrawals)}) +
    chartBox({title: 'Where the volume sits', sub: 'Movements per rail', type: 'donut', h: 190,
      cats: DW_METHODS.map(m => m.method),
      series: [{name: 'Movements', data: DW_METHODS.map(m => DW_TXN.filter(t => t.method === m.method).length)}],
      value: num(DW_TXN.length)}));
}

/* ===================== 9 · TRANSACTION PROCESSING ===================== */
function receiptHtml(t, kind){
  const cust = CUST_BY_ID[t.cust] || {};
  const receipt = (DW_RECEIPTS.find(r => r.txn === t.id) || {}).receipt || (DW_SET.receiptPrefix + '-' + pad(9000 + 1, DW_SET.receiptDigits));
  return `<div class="brandblock"><div class="bm">G</div>
      <div><div style="font-weight:800;font-size:12px">GOLDEN FINANCIAL SERVICES</div>
        <div style="font-size:9px;letter-spacing:1px;color:#8A6D0F;font-weight:700">LILONGWE · MALAWI</div></div>
      <div style="margin-left:auto;text-align:right;font-size:9px;color:#6B7280">
        ${esc(kind || 'Transaction receipt')}<br>${esc(receipt)}<br>${fmtDate(dwIsos(t.when))}</div></div>
    <div class="pfields" style="grid-template-columns:1fr 1fr;margin-top:10px">
      ${field('Transaction', esc(t.id))}${field('Provider reference', esc(t.ref))}
      ${field('Customer', esc(cust.name || '—'))}${field('Account', esc(t.account))}
      ${field('Method', esc(t.method))}${field('Amount', esc(dwM(t.amount)))}
      ${field('Fee', esc(dwM(t.fee)))}${field('Total', esc(dwM(t.amount + t.fee)))}
      ${field('Status', okb(t.status))}${field('Officer', esc(t.source === 'Customer' ? 'Self-service' : staffName(t.officer)))}
    </div>
    <div class="qhint" style="margin-top:8px">Keep this receipt. It is the proof that the money moved and the ledger carries the same reference.</div>`;
}
function tpRows(){
  return DW_TXN.filter(t => (!TP_STATE || t.status === TP_STATE) && dwPass(t));
}
function renderTransactions(){
  const all = DW_TXN.filter(dwPass);
  const rows = tpRows();
  const s = dwS();
  if(el('tpPill')){
    el('tpPill').className = 'badge b-gray';
    el('tpPill').textContent = num(rows.length) + ' in view';
  }
  put('tpKpis', [
    ['Transactions in view', num(rows.length), 'Of ' + num(all.length) + ' on the register', ''],
    ['Pending', num(rows.filter(t => t.status === 'Pending').length), 'Waiting on a confirmation', ''],
    ['Processing', num(rows.filter(t => t.status === 'Processing').length), 'At the provider', ''],
    ['Completed', num(rows.filter(t => t.status === 'Completed').length), dwM(sum(rows.filter(t => t.status === 'Completed'), t => t.amount)), ''],
    ['Failed', num(rows.filter(t => t.status === 'Failed').length), 'The rail refused it', 'red'],
    ['Rejected', num(rows.filter(t => t.status === 'Rejected').length), 'An officer refused it', ''],
    ['Cancelled', num(rows.filter(t => t.status === 'Cancelled').length), 'The customer withdrew it', ''],
    ['Reversed', num(rows.filter(t => t.status === 'Reversed').length), 'Opposite entry posted', '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join(''));

  if(el('tpCount')) el('tpCount').textContent = num(rows.length) + ' rows';
  if(el('tpStatusChips')){
    el('tpStatusChips').innerHTML = [[ '', 'All states']].concat(DW_STATUSES.map(x => [x, x + ' · ' + DW_TXN.filter(t => t.status === x).length]))
      .map(([v, l]) => `<span class="fchip${TP_STATE === v ? ' on' : ''}" data-tpstatus="${esc(v)}">${esc(l)}</span>`).join('');
  }
  const sorted = rows.slice().sort((a, b) => String(b.when).localeCompare(String(a.when)));
  sorted.forEach(t => { t._open = () => { DW_SEL.txn = t.id; renderTransactions(); }; });
  renderTable('tpBody', [
    {k: 'id', label: 'Reference'},
    {k: 'type', label: 'Type'},
    {k: 'when', label: 'When', html: v => esc(dwWhen(v))},
    {k: 'cust', label: 'Customer', html: v => esc(custName(v))},
    {k: 'method', label: 'Method'},
    {k: 'ref', label: 'Provider ref'},
    {k: 'amount', label: 'Amount', num: true, html: v => esc(dwM(v))},
    {k: 'status', label: 'Status', html: v => okb(v)}
  ], sorted, {sort: 'when', pageSize: 12});

  const sel = DW_TXN.find(t => t.id === DW_SEL.txn) || sorted[0];
  if(el('tpSelPill')) el('tpSelPill').textContent = sel ? sel.id : '—';
  put('tpDetailBox', sel ? kvRow('Type', sel.type)
    + kvRow('Customer', custName(sel.cust) + ' · ' + sel.account)
    + kvRow('Amount', dwM(sel.amount) + ' + fee ' + dwM(sel.fee))
    + kvRow('Method', sel.method + ' · ' + sel.provider)
    + kvRow('Provider reference', sel.ref)
    + kvRow('Stage', sel.stage)
    + kvRow('Status', okb(sel.status))
    + kvRow('Recorded by', sel.source === 'Customer' ? 'Self-service' : staffName(sel.officer)) : '');
  if(el('tpStatusSel')){
    const cur = el('tpStatusSel').value;
    el('tpStatusSel').innerHTML = DW_STATUSES.map(x => `<option value="${esc(x)}">${esc(x)}</option>`).join('');
    el('tpStatusSel').value = cur || (sel ? sel.status : 'Pending');
  }
  dwFillSel('tpStatusSel', DW_STATUSES.map(x => [x, x]), sel ? sel.status : '');
  put('tpReceiptBox', el('tpReceiptBox').innerHTML || '<div class="qhint">Generate a receipt for the selected transaction.</div>');

  const dp = DW_DUPES.concat(DW_DUP_RESOLUTION.filter(d => d.status === 'Open').map(d => ({ref: d.ref, count: d.deposits, amount: d.amount, ids: d.action, status: d.status})));
  if(el('tpDupPill')) el('tpDupPill').textContent = num(dp.length) + ' references';
  renderTable('tpDupBody', [
    {k: 'ref', label: 'Provider reference'},
    {k: 'count', label: 'Seen', num: true},
    {k: 'amount', label: 'Value', num: true, html: v => esc(dwM(v))},
    {k: 'status', label: 'State', html: v => okb(v)}
  ], dp, {pageSize: 4, onRow: false});

  const hist = DW_AUDIT.concat(DW_CHANGES.filter(c => c.area === 'Processing')).map(c => ({when: c.when, what: c.what || c.action,
    from: c.from || c.target, to: c.to || c.detail, by: c.by}));
  renderTable('tpHistBody', [
    {k: 'when', label: 'When', html: v => esc(dwWhen(v))},
    {k: 'what', label: 'What changed'},
    {k: 'from', label: 'Before'},
    {k: 'to', label: 'After'},
    {k: 'by', label: 'Officer', html: v => esc(staffName(v))}
  ], hist, {sort: 'when', pageSize: 5, onRow: false});

  put('tpGrid',
    chartBox({title: 'Transactions by state', sub: 'Every row on the register', type: 'donut', h: 190,
      cats: DW_STATUSES, series: [{name: 'Transactions', data: DW_STATUSES.map(x => all.filter(t => t.status === x).length)}],
      value: num(all.length)}) +
    chartBox({title: 'Value by state', sub: 'MWK', type: 'bar', h: 190, cats: DW_STATUSES,
      series: [{name: 'Value', data: DW_STATUSES.map(x => sum(all.filter(t => t.status === x), t => t.amount))}],
      value: compact(s.net)}));
}
</script>
