<script>
/* ============================================================
   DEPOSITS & WITHDRAWALS MANAGEMENT & CONNECTIONS (4/7)
   Sections 1–5: the financial overview, the deposit register,
   the withdrawal register, deposit verification and withdrawal
   approvals. Every figure is read from the same book the rest
   of the portal uses.
   ============================================================ */

/* ---------------- shared building blocks ---------------- */
function dwTone(s){
  const t = String(s == null ? '' : s);
  if(/^(Completed|Verified|Approved|Pass|Posted|Delivered|Cleared|Connected|Active|Enabled|Resolved|Recovered|Matched|Balanced|Low|Within limit|Issued|Paid out|Valid|On|Yes|Applied|Healthy|Good)$/i.test(t)) return 'b-ok';
  if(/^(Pending|Processing|Open|Queued|Awaiting provider|Medium|Review|Awaiting|Unverified|Investigating|Sent|Reissued|Automatic|Held|Adjustment|Consent|Near limit|Waiting on the provider|Missing policy)$/i.test(t)) return 'b-warn';
  if(/^(Failed|Rejected|Cancelled|Reversed|Blocked|Duplicate|Critical|High|Breach|Flagged|Expired|Violation|Missing|Suspended|Refused|Timed out)$/i.test(t)) return 'b-crit';
  return 'b-gray';
}
const okb = s => badge(s, dwTone(s));
const DW_SEV = s => s === 'Critical' || s === 'High' ? 'b-crit' : s === 'Medium' ? 'b-warn' : 'b-gray';
const put = (id, html) => { const n = el(id); if(n) n.innerHTML = html; };
const dwM = v => 'MK ' + num(Math.round(Number(v) || 0));
const dwIsos = v => String(v == null ? '' : v).slice(0, 10);
const dwWhen = v => String(v == null ? '' : v).slice(0, 16);
const DW_AUDIT = [];

function dwLogChange(area, what, from, to){
  DW_CHANGES.unshift({when: TODAY + ' ' + new Date().toTimeString().slice(0, 5), what, area, from, to, by: 'STF-001'});
  DW_CHANGES.length = Math.min(DW_CHANGES.length, 80);
}
function dwAudit(action, target, detail){
  DW_AUDIT.unshift({when: TODAY + ' ' + new Date().toTimeString().slice(0, 5), action, target, detail,
    by: staffName('STF-001'), lane: 'Audit', severity: 'Low', owner: 'STF-001', region: 'Lilongwe'});
  DW_AUDIT.length = Math.min(DW_AUDIT.length, 60);
}
function dwFillSel(id, pairs, keep){
  const n = el(id);
  if(!n) return;
  const cur = keep !== undefined ? keep : n.value;
  n.innerHTML = pairs.map(([v, l]) => `<option value="${esc(v)}">${esc(l)}</option>`).join('');
  if(cur && pairs.some(p => p[0] === cur)) n.value = cur;
}
function dwCustOptions(){
  return CUSTOMERS.slice(0, 40).map(c => [c.id, c.id + ' · ' + c.name]);
}
function dwAcctOptions(){
  return DW_ACCOUNTS.slice(0, 40).map(a => [a.id, a.id + ' · ' + custName(a.cust) + ' · ' + a.type + ' · ' + dwM(a.available)]);
}
function dwMethodOptions(type){
  const list = type === 'Withdrawal' ? DW_METHODS.filter(m => m.method !== 'Card gateway') : DW_METHODS;
  return list.map(m => [m.method, m.method + ' · ' + m.provider]);
}
function dwLoanOptions(){
  return LOANS.slice(0, 40).map(l => [l.ref, l.ref + ' · ' + custName(l.cust) + ' · ' + compact(l.outstanding)]);
}

/* every list follows the filter bar */
function dwPass(item){
  const d = item.when || item.requested || item.opened || item.lastMove || item.lastWrite || item.effective || TODAY;
  const has = k => item[k] !== undefined && item[k] !== null && item[k] !== '';
  return inRange(dwIsos(d))
    && (!has('lane') || passLane(item)) && (!has('severity') || passSeverity(item))
    && (!has('status') || passStatus(item)) && (!has('owner') || passOwner(item))
    && (!has('region') || passRegion(item)) && (!has('product') || passProduct(item))
    && matchQ(item.id, item.ref, item.txn, item.account, item.receipt, item.check, item.table, item.function,
      item.name, item.event, item.scope, item.method, item.provider, item.subject, item.cust ? custName(item.cust) : '',
      item.amount, item.notes, item.reason, item.description);
}
const dwS = () => dwStats();
function meter(label, value, sub, max){
  const v = clamp(Number(value) || 0, 0, max || 100);
  return `<div class="meterrow"><div style="flex:1">
      <div class="sl"><b>${esc(label)}</b><span>${esc(sub || '')}</span></div>
      <div class="meter"><i style="width:${(v / (max || 100) * 100).toFixed(1)}%"></i></div>
    </div><div class="sv">${max ? num(value) : num(value) + '%'}</div></div>`;
}
const kvRow = (k, v) => `<div class="risk"><div><div class="rn">${esc(k)}</div></div><div class="rv">${v}</div></div>`;
const strip = rows => `<div class="strip">${rows.map(([k, v]) => `<div><div class="sl">${esc(k)}</div><div class="sv">${v}</div></div>`).join('')}</div>`;
const chartBox = o => chartCard(Object.assign({chart: chart(o)}, o));

/* ===================== 1 · FINANCIAL OVERVIEW ===================== */
function dwAlerts(){
  const out = [];
  DW_TXN.filter(t => t.status === 'Failed').slice(0, 4).forEach(t => out.push({
    what: 'Failed ' + t.type.toLowerCase() + ' ' + t.id,
    detail: custName(t.cust) + ' · ' + dwM(t.amount) + ' · ' + t.method + ' — ' + t.stage,
    severity: 'High', goto: 's9', id: t.id
  }));
  DW_VERIFY.filter(v => !v.checks.amount || !v.checks.provider || !v.checks.proof).slice(0, 3).forEach(v => out.push({
    what: 'Deposit ' + v.txn + ' needs a person to look at it',
    detail: custName(v.cust) + ' · ' + dwM(v.amount) + ' · ' + v.method,
    severity: 'Medium', goto: 's4', id: v.id
  }));
  DW_DUPES.slice(0, 2).forEach(d => out.push({
    what: 'Duplicate reference ' + d.ref,
    detail: d.count + ' deposits · ' + dwM(d.amount) + ' · ' + d.ids,
    severity: 'Critical', goto: 's12', id: d.ref
  }));
  DW_DISCREPANCY.forEach(d => out.push({
    what: 'Balance discrepancy on ' + d.account,
    detail: custName(d.cust) + ' · ' + dwM(Math.abs(d.difference)) + ' out',
    severity: d.severity, goto: 's10', id: d.account
  }));
  DW_APPROVALS.filter(a => a.risk === 'High').slice(0, 2).forEach(a => out.push({
    what: 'High-risk withdrawal waiting',
    detail: custName(a.cust) + ' · ' + dwM(a.amount) + ' · ' + a.method,
    severity: 'High', goto: 's5', id: a.id
  }));
  return out.filter(a => passSeverity(a) && matchQ(a.what, a.detail));
}

function renderOverview(){
  const s = dwS();
  const pill = el('dwPill');
  if(pill){ pill.className = 'badge b-gray'; pill.textContent = num(s.total) + ' transactions'; }
  put('dwKpis', [
    ['Total deposits', dwM(s.totalDeposits), num(s.deposits) + ' deposits recorded · ' + num(DW_DEPOSITS.filter(t => t.status === 'Completed').length) + ' posted', ''],
    ['Total withdrawals', dwM(s.totalWithdrawals), num(s.withdrawals) + ' payouts recorded · ' + num(DW_WITHDRAWALS.filter(t => t.status === 'Completed').length) + ' paid', ''],
    ['Net movement', (s.net >= 0 ? '+' : '−') + dwM(Math.abs(s.net)), s.net >= 0 ? 'More money came in than went out' : 'More money went out than came in', s.net >= 0 ? '' : 'red'],
    ['Deposits today', dwM(s.depToday), fmtDate(TODAY) + ' · ' + num(DW_DEPOSITS.filter(t => dwIsos(t.when) === TODAY).length) + ' on the register', ''],
    ['Withdrawals today', dwM(s.wdrToday), fmtDate(TODAY) + ' · ' + num(DW_WITHDRAWALS.filter(t => dwIsos(t.when) === TODAY).length) + ' requests', ''],
    ['Awaiting confirmation', num(s.pendingDep), 'Deposits not yet verified — ' + dwM(sum(DW_DEPOSITS.filter(t => t.status === 'Pending' || t.status === 'Processing'), t => t.amount)), s.pendingDep ? 'red' : ''],
    ['Awaiting approval', num(s.pendingWdr), 'Withdrawals not yet released — ' + dwM(sum(DW_WITHDRAWALS.filter(t => t.status === 'Pending' || t.status === 'Processing'), t => t.amount)), ''],
    ['Failed transactions', num(s.failed + s.rejected), s.failed + ' failed · ' + s.rejected + ' rejected · ' + s.cancelled + ' cancelled', (s.failed + s.rejected) ? 'red' : ''],
    ['Reversed', num(s.reversed), 'Reversals posted back to the ledger', ''],
    ['Fees collected', dwM(s.fees), 'On completed deposits and withdrawals', ''],
    ['Accounts connected', num(s.accounts), num(s.suspended) + ' suspended · ' + dwM(s.availableTotal) + ' available', ''],
    ['Money held for payouts', dwM(s.reservedTotal), 'Reserved against withdrawals not yet released', '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join(''));

  if(el('dwStamp')) el('dwStamp').textContent = 'Updated ' + lastRefresh();
  put('dwMeters',
    meter('Deposits verified', Math.round(pct(s.completed, Math.max(1, DW_DEPOSITS.length))), num(s.completed) + ' of ' + num(s.total) + ' movements posted', 100) +
    meter('Withdrawals released', Math.round(pct(DW_WITHDRAWALS.filter(t => t.status === 'Completed').length, Math.max(1, DW_WITHDRAWALS.length))), num(DW_WITHDRAWALS.filter(t => t.status === 'Completed').length) + ' paid out', 100) +
    meter('Pending queue cleared', Math.round(100 - pct(s.pending + s.processing, Math.max(1, s.total))), (s.pending + s.processing) + ' still open', 100) +
    meter('Accounts in good standing', Math.round(pct(s.accounts - s.suspended, Math.max(1, s.accounts))), (s.accounts - s.suspended) + ' of ' + s.accounts + ' active', 100) +
    meter('Ledger agrees with balances', Math.round(100 - pct(DW_DISCREPANCY.length, Math.max(1, s.accounts))), DW_DISCREPANCY.length + ' discrepancy alert(s)', 100) +
    meter('Movement health score', Math.round(s.score), 'Failed, pending, duplicates and security gaps weighted', 100));

  const rails = DW_METHODS.map(m => ({
    name: m.method,
    up: DW_DB_TABLES.filter(t => t.rls !== 'Enabled').length === 0 || m.method !== 'Card gateway',
    txns: DW_TXN.filter(t => t.method === m.method).length,
    value: sum(DW_TXN.filter(t => t.method === m.method && t.status === 'Completed'), t => t.amount)
  }));
  if(el('dwConnPill')){
    el('dwConnPill').className = 'badge ' + (DW_DB_TABLES.some(t => t.rls !== 'Enabled') ? 'b-warn' : 'b-ok');
    el('dwConnPill').textContent = rails.length + ' rails · ' + DW_ACCOUNTS.length + ' accounts';
  }
  put('dwBoard', rails.map(r => `<div class="risk"><div><div class="rn">${esc(r.name)}</div>
      <div class="rs">${num(r.txns)} movements · ${compact(r.value)}</div></div>
      <div class="rv">${okb('Connected')}</div></div>`).join('') +
    `<div class="risk"><div><div class="rn">Customer accounts</div>
      <div class="rs">${num(DW_ACCOUNTS.length)} accounts · ${compact(dwS().availableTotal)} available</div></div>
      <div class="rv">${okb(dwS().suspended ? 'Review' : 'Active')}</div></div>
    <div class="risk"><div><div class="rn">Ledger</div>
      <div class="rs">${num(DW_LEDGER.length)} entries · append-only</div></div>
      <div class="rv">${okb(DW_DISCREPANCY.length ? 'Variance' : 'Balanced')}</div></div>`);

  const cats = DW_METHODS.map(m => m.method.replace(' transfer', ''));
  put('dwGrid',
    chartBox({title: 'Deposits by payment method', sub: 'Value posted, MWK', type: 'bar', h: 200, cats,
      colours: DW_METHODS.map(m => DW_COLOURS[m.method]),
      series: [{name: 'Deposits', data: DW_METHODS.map(m => sum(DW_DEPOSITS.filter(t => t.method === m.method && t.status === 'Completed'), t => t.amount))}],
      value: compact(s.totalDeposits)}) +
    chartBox({title: 'Withdrawals by payment method', sub: 'Value paid out, MWK', type: 'bar', h: 200, cats,
      colours: DW_METHODS.map(m => DW_COLOURS[m.method]),
      series: [{name: 'Withdrawals', data: DW_METHODS.map(m => sum(DW_WITHDRAWALS.filter(t => t.method === m.method && t.status === 'Completed'), t => t.amount))}],
      value: compact(s.totalWithdrawals)}) +
    chartBox({title: 'How transactions ended', sub: 'Every transaction on the register', type: 'donut', h: 200,
      cats: DW_STATUSES, series: [{name: 'Transactions', data: DW_STATUSES.map(x => DW_TXN.filter(t => t.status === x).length)}],
      value: num(s.total)}) +
    chartBox({title: 'Money in and out', sub: 'The last seven days, MWK', type: 'bar', h: 200,
      cats: DW_DAILY.map(d => fmtShort(d.day)),
      series: [{name: 'Deposits', data: DW_DAILY.map(d => d.deposits), colour: '#0E9AA7'},
        {name: 'Withdrawals', data: DW_DAILY.map(d => d.withdrawals), colour: '#C9A227'}],
      value: compact(s.net)}));

  const alerts = dwAlerts();
  if(el('dwAlertPill')) el('dwAlertPill').textContent = alerts.length;
  put('dwAlerts', alerts.length ? alerts.map(a => `<div class="risk rowlink" data-goto="${a.goto}">
      <div><div class="rn">${esc(a.what)}</div><div class="rs">${esc(a.detail)}</div></div>
      <div class="rv">${badge(a.severity, DW_SEV(a.severity))}</div></div>`).join('')
    : '<div class="empty">Nothing open — every deposit is verified and every payout has cleared.</div>');

  const feed = DW_TXN.filter(dwPass).slice(0, 8);
  put('dwFeed', feed.length ? feed.map(t => `<div class="risk rowlink" data-goto="s2" data-txn="${esc(t.id)}">
      <div><div class="rn">${esc(t.id)} · ${esc(t.type)} · ${esc(dwM(t.amount))}</div>
        <div class="rs">${esc(custName(t.cust))} · ${esc(t.method)} · ${esc(dwWhen(t.when))}</div></div>
      <div class="rv">${okb(t.status)}</div></div>`).join('')
    : '<div class="empty">No movement matches the current filters.</div>');
}

/* ===================== 2 · DEPOSIT MANAGEMENT ===================== */
function renderDeposits(){
  const rows = DW_DEPOSITS.filter(dwPass);
  const posted = DW_DEPOSITS.filter(t => t.status === 'Completed');
  if(el('dPill')){
    el('dPill').className = 'badge ' + (DW_VERIFY.length ? 'b-warn' : 'b-ok');
    el('dPill').textContent = num(DW_VERIFY.length) + ' awaiting verification';
  }
  put('dKpis', [
    ['Deposits recorded', num(rows.length), 'In the current filter window', ''],
    ['Value posted', dwM(sum(posted.filter(dwPass), t => t.amount)), num(posted.length) + ' completed deposits', ''],
    ['Average deposit', dwM(rows.length ? sum(rows, t => t.amount) / rows.length : 0), 'Across every method', ''],
    ['Linked to a loan', num(rows.filter(t => t.loan).length), 'The rest sit on the customer account', ''],
    ['With proof uploaded', num(rows.filter(t => t.proof).length), 'Slip, screenshot or bank letter', ''],
    ['Awaiting confirmation', num(DW_VERIFY.length), 'In the verification queue', DW_VERIFY.length ? 'red' : ''],
    ['Corrections raised', num(DW_CORRECTIONS.length), DW_CORRECTIONS.filter(c => c.status === 'Pending').length + ' still pending', ''],
    ['Fees on deposits', dwM(sum(posted.filter(dwPass), t => t.fee)), 'Charged to ' + DW_SET.feePayer.toLowerCase(), '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join(''));

  if(el('dNewRef')){
    const next = 'DEP-' + pad(5101 + DW_DEPOSITS.length, 6);
    if(!el('dNewRef').value) el('dNewRef').value = next;
  }
  if(el('dCount')) el('dCount').textContent = num(rows.length) + ' deposits';
  const sorted = rows.slice().sort((a, b) => String(b.when).localeCompare(String(a.when)));
  sorted.forEach(t => { t._open = () => { DW_SEL.txn = t.id; renderTransactions(); renderDeposits(); goto('s9'); }; });
  renderTable('dBody', [
    {k: 'id', label: 'Reference'},
    {k: 'when', label: 'Date', html: v => esc(dwWhen(v))},
    {k: 'cust', label: 'Customer', html: v => esc(custName(v))},
    {k: 'account', label: 'Account'},
    {k: 'method', label: 'Method'},
    {k: 'loan', label: 'Linked loan', html: v => v ? esc(v) : '<span class="qhint">—</span>'},
    {k: 'amount', label: 'Amount', num: true, html: v => esc(dwM(v))},
    {k: 'proof', label: 'Proof', html: v => v ? okb('Uploaded') : badge('None', 'b-gray')},
    {k: 'status', label: 'Status', html: v => okb(v)}
  ], sorted, {sort: 'when', pageSize: 12});

  const byStatus = DW_STATUSES.map(s => ({s, n: DW_DEPOSITS.filter(t => t.status === s).length}));
  put('dTrackBox',
    meter('Posted to the ledger', byStatus.find(x => x.s === 'Completed').n, 'Completed deposits', Math.max(1, DW_DEPOSITS.length)) +
    meter('Awaiting verification', byStatus.find(x => x.s === 'Pending').n, 'Pending confirmation', Math.max(1, DW_DEPOSITS.length)) +
    meter('At the provider', byStatus.find(x => x.s === 'Processing').n, 'Processing', Math.max(1, DW_DEPOSITS.length)) +
    meter('Refused', byStatus.find(x => x.s === 'Failed').n + byStatus.find(x => x.s === 'Rejected').n, 'Failed or rejected', Math.max(1, DW_DEPOSITS.length)) +
    `<div class="strip" style="margin-top:8px">${byStatus.map(x => `<div><div class="sl">${esc(x.s)}</div><div class="sv">${num(x.n)}</div></div>`).join('')}</div>`);

  const sel = DW_DEPOSITS.find(t => t.id === DW_SEL.txn) || sorted[0];
  if(el('dConfirmPill')) el('dConfirmPill').textContent = sel ? sel.id : '—';
  put('dConfirmBox', sel ? `<div class="pfields" style="grid-template-columns:1fr 1fr">
      ${field('Deposit reference', esc(sel.id))}${field('Provider reference', esc(sel.ref))}
      ${field('Customer', esc(custName(sel.cust)))}${field('Account', esc(sel.account))}
      ${field('Method', esc(sel.method))}${field('Provider', esc(sel.provider))}
      ${field('Amount', esc(dwM(sel.amount)))}${field('Fee', esc(dwM(sel.fee)))}
      ${field('Proof of payment', sel.proof ? esc(sel.proof) : '<span class="qhint">No upload</span>')}
      ${field('Confirmation', okb(sel.status === 'Completed' ? 'Verified' : sel.status))}
      ${field('Linked loan', sel.loan ? esc(sel.loan) : 'Customer account only')}
      ${field('Receipt', DW_RECEIPTS.filter(r => r.txn === sel.id).map(r => esc(r.receipt)).join(', ') || 'Issued on posting')}
    </div>
    <div class="qhint" style="margin-top:8px">Stage: ${esc(sel.stage)} · recorded by ${esc(sel.source === 'Customer' ? 'the customer' : staffName(sel.officer))}</div>`
    : '<div class="empty">No deposit selected.</div>');

  if(el('dCorrPill')) el('dCorrPill').textContent = num(DW_CORRECTIONS.length) + ' requests';
  dwFillSel('dCorrRef', DW_DEPOSITS.slice(0, 30).map(t => [t.id, t.id + ' · ' + custName(t.cust) + ' · ' + dwM(t.amount)]));
  renderTable('dCorrBody', [
    {k: 'when', label: 'Raised', html: v => esc(dwWhen(v))},
    {k: 'ref', label: 'Deposit'},
    {k: 'field', label: 'Field'},
    {k: 'from', label: 'From'},
    {k: 'to', label: 'To'},
    {k: 'status', label: 'Status', html: v => okb(v)}
  ], DW_CORRECTIONS.filter(dwPass), {sort: 'when', pageSize: 5, onRow: false});

  if(el('dHistPill')) el('dHistPill').textContent = num(rows.length) + ' entries';
  const hist = rows.slice().sort((a, b) => String(b.when).localeCompare(String(a.when)));
  hist.forEach(t => { t._open = () => { openModal(t.id, t.type + ' · ' + custName(t.cust) + ' · ' + dwWhen(t.when),
    `<div class="pfields" style="grid-template-columns:1fr 1fr">
      ${field('Amount', esc(dwM(t.amount)))}${field('Fee', esc(dwM(t.fee)))}
      ${field('Method', esc(t.method))}${field('Provider reference', esc(t.ref))}
      ${field('Account', esc(t.account))}${field('Linked loan', t.loan ? esc(t.loan) : 'None')}
      ${field('Proof', t.proof ? esc(t.proof) : 'None')}${field('Status', okb(t.status))}
      ${field('Stage', esc(t.stage))}${field('Recorded by', esc(staffName(t.officer)))}
    </div>`, [{label: 'Close', act: 'close'}]); }; });
  renderTable('dHistBody', [
    {k: 'when', label: 'Date', html: v => esc(dwWhen(v))},
    {k: 'id', label: 'Reference'},
    {k: 'cust', label: 'Customer', html: v => esc(custName(v))},
    {k: 'method', label: 'Method'},
    {k: 'amount', label: 'Amount', num: true, html: v => esc(dwM(v))},
    {k: 'status', label: 'Status', html: v => okb(v)}
  ], hist, {sort: 'when', pageSize: 8});
}

/* ===================== 3 · WITHDRAWAL MANAGEMENT ===================== */
function dwWithdrawalCheck(){
  const acc = DW_ACC_BY_ID[el('wReqAcct') ? el('wReqAcct').value : ''] || DW_ACCOUNTS[0];
  const amount = Number(el('wReqAmount') ? el('wReqAmount').value : 0) || 0;
  const method = el('wReqMethod') ? el('wReqMethod').value : DW_METHODS[0].method;
  const fee = Math.round(amount * DW_SET.withdrawalFeePct / 100) + DW_SET.withdrawalFeeFlat;
  const today = sum(DW_WITHDRAWALS.filter(t => t.account === acc.id && dwIsos(t.when) === TODAY
    && t.status !== 'Failed' && t.status !== 'Rejected'), t => t.amount);
  const checks = [
    ['Account is open', acc.status === 'Active', acc.status],
    ['Amount meets the minimum', amount >= DW_SET.minWithdrawal, dwM(DW_SET.minWithdrawal) + ' minimum'],
    ['Amount is within the maximum', amount <= DW_SET.maxWithdrawal, dwM(DW_SET.maxWithdrawal) + ' maximum'],
    ['Balance covers the amount and the fee', amount + fee <= acc.available, dwM(acc.available) + ' available'],
    ['Inside the daily withdrawal limit', today + amount <= DW_SET.dailyWithdrawalLimit, dwM(today) + ' already taken today'],
    ['Inside the per-customer limit', amount <= DW_SET.perCustomerDailyLimit, dwM(DW_SET.perCustomerDailyLimit) + ' per customer'],
    ['Method allows this amount', amount <= (DW_LIMITS.find(l => l.method === method) || {wdrMax: DW_SET.maxWithdrawal}).wdrMax,
      method + ' ceiling ' + dwM((DW_LIMITS.find(l => l.method === method) || {wdrMax: DW_SET.maxWithdrawal}).wdrMax)],
    ['Identity is on file', DW_SET.requireIdentityForWithdrawal ? !!el('wReqIdNum') && !!el('wReqIdNum').value : true,
      DW_SET.requireIdentityForWithdrawal ? 'National ID, passport or licence' : 'Not required by the settings'],
    ['No duplicate request in the window', !DW_WITHDRAWALS.some(t => t.account === acc.id
      && t.amount === amount && dwIsos(t.when) === TODAY), DW_SET.duplicateWindow + ' minute window']
  ];
  return {acc, amount, method, fee, checks, pass: checks.every(c => c[1])};
}
function renderWithdrawals(){
  const rows = DW_WITHDRAWALS.filter(dwPass);
  const paid = DW_WITHDRAWALS.filter(t => t.status === 'Completed');
  if(el('wPill')){
    el('wPill').className = 'badge ' + (DW_APPROVALS.length ? 'b-warn' : 'b-ok');
    el('wPill').textContent = num(DW_APPROVALS.length) + ' awaiting approval';
  }
  put('wKpis', [
    ['Withdrawals recorded', num(rows.length), 'Requests in the current window', ''],
    ['Value paid out', dwM(sum(paid.filter(dwPass), t => t.amount)), num(paid.length) + ' payouts completed', ''],
    ['Average payout', dwM(rows.length ? sum(rows, t => t.amount) / rows.length : 0), 'Across every rail', ''],
    ['Awaiting approval', num(DW_APPROVALS.length), 'In the approval queue', DW_APPROVALS.length ? 'red' : ''],
    ['Identity pending', num(DW_WITHDRAWALS.filter(t => t.identity === 'Pending').length), 'No verified document yet', ''],
    ['Needing two approvals', num(DW_WITHDRAWALS.filter(t => t.approval === 'Two approvals').length), 'Above ' + dwM(DW_SET.secondApprovalThreshold), ''],
    ['Failed payouts', num(DW_WITHDRAWALS.filter(t => t.status === 'Failed').length), 'Provider refused or timed out', ''],
    ['Withdrawal fees', dwM(sum(paid.filter(dwPass), t => t.fee)), 'Charged to the customer', '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join(''));

  const chk = dwWithdrawalCheck();
  put('wCheckBox', chk.checks.map(([label, ok, detail]) => `<div class="checkrow">
      <div class="ck ${ok ? 'pass' : 'crit'}">${ok ? '✓' : '!'}</div>
      <div style="flex:1"><div style="font-size:10.5px;font-weight:800">${esc(label)}</div>
        <div class="qhint">${esc(detail)}</div></div>
      <div>${okb(ok ? 'Pass' : 'Failed')}</div></div>`).join('') +
    `<div class="qhint" style="margin-top:6px">Fee ${dwM(chk.fee)} · ${chk.pass
      ? 'every check passes — the request can be submitted' : 'the request will be held until the failing checks clear'}</div>`);

  if(el('wCount')) el('wCount').textContent = num(rows.length) + ' withdrawals';
  const sorted = rows.slice().sort((a, b) => String(b.when).localeCompare(String(a.when)));
  sorted.forEach(t => { t._open = () => { DW_SEL.wdr = t.id; renderWithdrawals(); }; });
  renderTable('wBody', [
    {k: 'id', label: 'Reference'},
    {k: 'when', label: 'Date', html: v => esc(dwWhen(v))},
    {k: 'cust', label: 'Customer', html: v => esc(custName(v))},
    {k: 'account', label: 'Account'},
    {k: 'method', label: 'Payout method'},
    {k: 'destination', label: 'Destination', html: v => v ? esc(v) : '<span class="qhint">—</span>'},
    {k: 'amount', label: 'Amount', num: true, html: v => esc(dwM(v))},
    {k: 'identity', label: 'Identity', html: v => okb(v)},
    {k: 'status', label: 'Status', html: v => okb(v)}
  ], sorted, {sort: 'when', pageSize: 12});

  if(el('wTrackPill')) el('wTrackPill').textContent = num(DW_STATUSES.filter(s => DW_WITHDRAWALS.some(t => t.status === s)).length) + ' states';
  put('wTrackBox', [
    ['Requests received', DW_WITHDRAWALS.length],
    ['Pending', DW_WITHDRAWALS.filter(t => t.status === 'Pending').length],
    ['Processing at the rail', DW_WITHDRAWALS.filter(t => t.status === 'Processing').length],
    ['Completed', DW_WITHDRAWALS.filter(t => t.status === 'Completed').length],
    ['Failed', DW_WITHDRAWALS.filter(t => t.status === 'Failed').length],
    ['Rejected', DW_WITHDRAWALS.filter(t => t.status === 'Rejected').length],
    ['Cancelled', DW_WITHDRAWALS.filter(t => t.status === 'Cancelled').length],
    ['Reversed', DW_WITHDRAWALS.filter(t => t.status === 'Reversed').length]
  ].map(([k, v]) => meter(k, v, num(v) + ' of ' + num(DW_WITHDRAWALS.length), Math.max(1, DW_WITHDRAWALS.length))).join(''));

  const sel = DW_WITHDRAWALS.find(t => t.id === DW_SEL.wdr) || sorted[0];
  put('wDestBox', sel ? `<div class="pfields" style="grid-template-columns:1fr 1fr">
      ${field('Selected withdrawal', esc(sel.id))}${field('Payout method', esc(sel.method))}
      ${field('Destination', esc(sel.destination || '—'))}${field('Provider reference', esc(sel.ref))}
      ${field('Approval route', esc(sel.approval))}${field('Identity check', okb(sel.identity))}
      ${field('Available on the account', esc(dwM((DW_ACC_BY_ID[sel.account] || {available: 0}).available)))}
      ${field('Stage', esc(sel.stage))}
    </div>` : '<div class="empty">No withdrawal selected.</div>');

  if(el('wHistPill')) el('wHistPill').textContent = num(rows.length) + ' entries';
  renderTable('wHistBody', [
    {k: 'when', label: 'Date', html: v => esc(dwWhen(v))},
    {k: 'id', label: 'Reference'},
    {k: 'cust', label: 'Customer', html: v => esc(custName(v))},
    {k: 'method', label: 'Method'},
    {k: 'amount', label: 'Amount', num: true, html: v => esc(dwM(v))},
    {k: 'status', label: 'Status', html: v => okb(v)}
  ], sorted, {sort: 'when', pageSize: 8});
}

/* ===================== 4 · DEPOSIT VERIFICATION ===================== */
const DW_CHECK_LABELS = {reference: 'Reference matches the provider line', amount: 'Amount agrees with the proof',
  method: 'Payment method is the one used', proof: 'Proof of payment is attached',
  provider: 'Provider confirms the credit', duplicate: 'Reference is not already posted'};
function renderVerification(){
  const q = DW_VERIFY.filter(dwPass);
  const sel = DW_VERIFY.find(v => v.id === DW_SEL.verify) || q[0] || DW_VERIFY[0];
  if(el('dvPill')){
    el('dvPill').className = 'badge ' + (q.length ? 'b-warn' : 'b-ok');
    el('dvPill').textContent = num(q.length) + ' in the queue';
  }
  put('dvKpis', [
    ['Pending verification', num(q.length), 'Deposits waiting on a person', q.length ? 'red' : ''],
    ['Value in the queue', dwM(sum(q, v => v.amount)), 'Not yet posted to the ledger', ''],
    ['Passed every check', num(q.filter(v => Object.values(v.checks).every(Boolean)).length), 'Safe to approve', ''],
    ['Failing a check', num(q.filter(v => !Object.values(v.checks).every(Boolean)).length), 'Needs a decision', ''],
    ['Proof missing', num(q.filter(v => !v.checks.proof).length), 'No upload against the deposit', ''],
    ['Amount mismatch', num(q.filter(v => !v.checks.amount).length), 'Provider value differs', ''],
    ['Verified today', num(DW_VERIFY_HISTORY.filter(h => h.action === 'Approved' && dwIsos(h.when) === TODAY).length), 'By the officers on duty', ''],
    ['Rejected today', num(DW_VERIFY_HISTORY.filter(h => h.action === 'Rejected' && dwIsos(h.when) === TODAY).length), 'With a note left behind', '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join(''));

  if(el('dvqPill')) el('dvqPill').textContent = num(DW_VERIFY.filter(v => v.status === 'Pending').length) + ' pending';
  const rows = q.slice().sort((a, b) => String(b.when).localeCompare(String(a.when)));
  rows.forEach(v => { v._open = () => { DW_SEL.verify = v.id; renderVerification(); }; });
  renderTable('dvqBody', [
    {k: 'id', label: 'Queue id'},
    {k: 'txn', label: 'Deposit'},
    {k: 'when', label: 'Date', html: v => esc(dwWhen(v))},
    {k: 'cust', label: 'Customer', html: v => esc(custName(v))},
    {k: 'method', label: 'Method'},
    {k: 'amount', label: 'Amount', num: true, html: v => esc(dwM(v))},
    {k: 'expected', label: 'Provider says', num: true, html: v => esc(dwM(v))},
    {k: 'checks', label: 'Checks', html: v => {
      const pass = Object.values(v || {}).filter(Boolean).length;
      return okb(pass + ' of 6');
    }},
    {k: 'status', label: 'Status', html: v => okb(v)},
    {k: 'act', label: 'Decide', html: (v, r) => `<button class="btn btn-ghost" data-dvok="${esc(r.id)}">Approve</button>
      <button class="btn btn-ghost" data-dvrej="${esc(r.id)}">Reject</button>`}
  ], rows, {sort: 'when', pageSize: 10});

  if(el('dvCheckPill')) el('dvCheckPill').textContent = sel ? sel.txn : '—';
  put('dvChecksBox', sel ? Object.keys(DW_CHECK_LABELS).map(k => `<div class="checkrow">
      <div class="ck ${sel.checks[k] ? 'pass' : 'crit'}">${sel.checks[k] ? '✓' : '!'}</div>
      <div style="flex:1"><div style="font-size:10.5px;font-weight:800">${esc(DW_CHECK_LABELS[k])}</div>
        <div class="qhint">${k === 'amount' ? 'Deposit ' + esc(dwM(sel.amount)) + ' · provider ' + esc(dwM(sel.expected))
          : k === 'reference' ? esc(sel.ref) : k === 'proof' ? esc(sel.proof) : ''}</div></div>
      <div>${okb(sel.checks[k] ? 'Pass' : 'Failed')}</div></div>`).join('')
    : '<div class="empty">Nothing in the queue.</div>');

  if(el('dvProofPill')) el('dvProofPill').textContent = sel ? (sel.checks.proof ? 'Proof on file' : 'No proof') : '—';
  put('dvProofBox', sel ? kvRow('Proof of payment', sel.proof === 'No proof uploaded'
      ? badge('None uploaded', 'b-crit') : badge(sel.proof, 'b-ok'))
    + kvRow('Uploaded against', sel.txn + ' · ' + custName(sel.cust))
    + kvRow('Storage bucket', 'transaction_proofs · signed URL, 10 minutes')
    + kvRow('Checked by', 'Chikondi Mwale') : '');
  put('dvProvBox', sel ? kvRow('Provider', DW_METHODS.find(m => m.method === sel.method).provider)
    + kvRow('Provider reference', sel.ref)
    + kvRow('Provider says', dwM(sel.expected))
    + kvRow('Confirmation', sel.checks.provider ? okb('Verified') : okb('Pending')) : '');
  const dupe = DW_DUPES.find(d => d.ref === (sel || {}).ref);
  put('dvDupBox', sel ? kvRow('Duplicate check', dupe ? badge('Duplicate on the register', 'b-crit') : okb('No duplicate'))
    + (dupe ? kvRow('Also seen on', dupe.ids) + kvRow('Total held', dwM(dupe.amount)) : '') : '');

  if(el('dvHistPill')) el('dvHistPill').textContent = num(DW_VERIFY_HISTORY.length) + ' decisions';
  renderTable('dvHistBody', [
    {k: 'when', label: 'When', html: v => esc(dwWhen(v))},
    {k: 'ref', label: 'Provider reference'},
    {k: 'action', label: 'Decision', html: v => okb(v)},
    {k: 'by', label: 'Officer', html: v => esc(staffName(v))},
    {k: 'notes', label: 'Notes'}
  ], DW_VERIFY_HISTORY.filter(dwPass), {sort: 'when', pageSize: 6, onRow: false});
}

/* ===================== 5 · WITHDRAWAL APPROVALS ===================== */
function renderApprovals(){
  const q = DW_APPROVALS.filter(dwPass);
  const sel = DW_APPROVALS.find(a => a.id === DW_SEL.approve) || q[0] || DW_APPROVALS[0];
  if(el('waPill')){
    el('waPill').className = 'badge ' + (q.length ? 'b-warn' : 'b-ok');
    el('waPill').textContent = num(q.length) + ' waiting';
  }
  put('waKpis', [
    ['Awaiting approval', num(q.length), 'Requests in the queue', q.length ? 'red' : ''],
    ['Value waiting', dwM(sum(q, a => a.amount)), 'Nothing leaves until both signatures land', ''],
    ['First level done', num(q.filter(a => a.level1 === 'Approved').length), 'Escalated to management', ''],
    ['High risk', num(q.filter(a => a.risk === 'High').length), 'Flagged before approval', ''],
    ['Identity pending', num(q.filter(a => a.identity !== 'Verified').length), 'Cannot be released', ''],
    ['Over the first threshold', num(q.filter(a => a.amount > DW_SET.approvalThreshold).length), 'Above ' + dwM(DW_SET.approvalThreshold), ''],
    ['Approved on record', num(DW_APPROVAL_HISTORY.filter(a => a.action === 'Approved').length), 'Every signature kept', ''],
    ['Rejected on record', num(DW_APPROVAL_HISTORY.filter(a => a.action === 'Rejected').length), 'With the reason', '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join(''));

  if(el('waqPill')) el('waqPill').textContent = num(DW_APPROVALS.length) + ' requests';
  const rows = q.slice().sort((a, b) => String(b.when).localeCompare(String(a.when)));
  rows.forEach(a => { a._open = () => { DW_SEL.approve = a.id; renderApprovals(); }; });
  renderTable('waqBody', [
    {k: 'id', label: 'Queue id'},
    {k: 'txn', label: 'Withdrawal'},
    {k: 'when', label: 'Requested', html: v => esc(dwWhen(v))},
    {k: 'cust', label: 'Customer', html: v => esc(custName(v))},
    {k: 'amount', label: 'Amount', num: true, html: v => esc(dwM(v))},
    {k: 'balance', label: 'Available', num: true, html: v => esc(dwM(v))},
    {k: 'level', label: 'Needs'},
    {k: 'level1', label: 'Level 1', html: v => okb(v)},
    {k: 'risk', label: 'Risk', html: v => badge(v, DW_SEV(v))}
  ], rows, {sort: 'when', pageSize: 10});

  if(el('waSelPill')) el('waSelPill').textContent = sel ? sel.id : '—';
  put('waCustBox', sel ? kvRow('Customer', custName(sel.cust) + ' · ' + sel.cust)
    + kvRow('Account', sel.account) + kvRow('Payout method', sel.method)
    + kvRow('Destination', sel.destination || '—')
    + kvRow('Identity', okb(sel.identity)) : '');
  put('waBalBox', sel ? kvRow('Withdrawal requested', dwM(sel.amount))
    + kvRow('Fee', dwM(sel.fee))
    + kvRow('Total needed', dwM(sel.amount + sel.fee))
    + kvRow('Available balance', dwM(sel.balance))
    + kvRow('Balance after payout', dwM(Math.max(0, sel.balance - sel.amount - sel.fee))) : '');
  const w = sel ? DW_WITHDRAWALS.find(t => t.id === sel.txn) : null;
  put('waLimitBox', sel ? kvRow('Daily withdrawal limit', dwM(DW_SET.dailyWithdrawalLimit))
    + kvRow('Per-customer limit', dwM(DW_SET.perCustomerDailyLimit))
    + kvRow('First approval above', dwM(DW_SET.approvalThreshold))
    + kvRow('Second approval above', dwM(DW_SET.secondApprovalThreshold))
    + kvRow('Inside every limit', sel.amount <= DW_SET.maxWithdrawal && sel.amount <= sel.balance
      ? okb('Within limit') : okb('Outside limit'))
    + kvRow('Approval route', (w && w.approval) || sel.level) : '');

  const risk = sel ? DW_RISK.find(r => r.ref === sel.ref) : null;
  if(el('waRiskPill')) el('waRiskPill').textContent = risk ? risk.score + ' risk' : '—';
  put('waRiskBox', risk ? risk.checks.map(([label, ok]) => `<div class="checkrow">
      <div class="ck ${ok ? 'pass' : 'crit'}">${ok ? '✓' : '!'}</div>
      <div style="flex:1"><div style="font-size:10.5px;font-weight:800">${esc(label)}</div></div>
      <div>${okb(ok ? 'Pass' : 'Failed')}</div></div>`).join('')
    : '<div class="empty">No request selected.</div>');
  put('waFlowBox', sel ? `<div class="minihead">Approval flow</div>`
    + kvRow('Step 1 · First-level approval', okb(sel.level1))
    + kvRow('Step 2 · Management approval', okb(sel.level2))
    + kvRow('Then', 'The debit posts and the provider is asked to pay')
    + kvRow('Thresholds in force', DW_APPROVAL_THRESHOLDS.map(t => t.band).join(' · '))
    : '');

  if(el('waHistPill')) el('waHistPill').textContent = num(DW_APPROVAL_HISTORY.length) + ' decisions';
  renderTable('waHistBody', [
    {k: 'when', label: 'When', html: v => esc(dwWhen(v))},
    {k: 'ref', label: 'Provider reference'},
    {k: 'level', label: 'Level'},
    {k: 'action', label: 'Decision', html: v => okb(v)},
    {k: 'by', label: 'Officer', html: v => esc(staffName(v))},
    {k: 'notes', label: 'Notes'}
  ], DW_APPROVAL_HISTORY.filter(dwPass), {sort: 'when', pageSize: 6, onRow: false});
}

const DW_SEL = {txn: '', wdr: '', verify: '', approve: '', acct: '', loan: '', stmtCust: '', report: '', receipt: ''};
</script>
