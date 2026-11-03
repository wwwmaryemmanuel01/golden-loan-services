<script>
/* ============================================================
   TRANSFERS MANAGEMENT & CONNECTIONS (4/8)
   Shared building blocks, then sections 1–4: the overview, the
   transfer register, internal account transfers and savings
   transfers.
   ============================================================ */

/* ---------------- shared building blocks ---------------- */
function trTone(s){
  const t = String(s == null ? '' : s);
  if(/^(Completed|Verified|Approved|Pass|Posted|Delivered|Cleared|Connected|Active|Enabled|Resolved|Recovered|Matched|Balanced|Low|Within limit|Issued|Valid|On|Yes|Applied|Healthy|Good|Normal|Acknowledged)$/i.test(t)) return 'b-ok';
  if(/^(Draft|Pending|Pending verification|Pending approval|Processing|Open|Queued|Medium|Review|Awaiting|Unverified|Investigating|Sent|Reissued|Automatic|Held|Adjustment|Returned for review|Retry queued|Slow)$/i.test(t)) return 'b-warn';
  if(/^(Failed|Rejected|Cancelled|Reversed|Blocked|Duplicate|Critical|High|Breach|Flagged|Expired|Violation|Missing|Suspended|Refused|Urgent)$/i.test(t)) return 'b-crit';
  return 'b-gray';
}
const okb = s => badge(s, trTone(s));
const TR_SEV = s => s === 'Critical' || s === 'High' ? 'b-crit' : s === 'Medium' ? 'b-warn' : 'b-gray';
const put = (id, html) => { const n = el(id); if(n) n.innerHTML = html; };
const trM = v => 'MK ' + num(Math.round(Number(v) || 0));
const trIsos = v => String(v == null ? '' : v).slice(0, 10);
const trWhen = v => String(v == null ? '' : v).slice(0, 16);
const TR_AUDIT_LOG = [];

function trLogChange(area, what, from, to){
  TR_CHANGES.unshift({when: TODAY + ' ' + new Date().toTimeString().slice(0, 5), what, area, from, to, by: 'STF-001'});
  TR_CHANGES.length = Math.min(TR_CHANGES.length, 90);
}
function trAudit(action, target, detail){
  TR_AUDIT_LOG.unshift({when: TODAY + ' ' + new Date().toTimeString().slice(0, 5), action, target, detail,
    by: staffName('STF-001'), lane: 'Security', severity: 'Low', owner: 'STF-001', region: 'Lilongwe'});
  TR_AUDIT_LOG.length = Math.min(TR_AUDIT_LOG.length, 70);
  TR_AUDIT.push(TR_AUDIT_LOG[0]);
}
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
const TR_SEL = {txn: '', verify: '', approve: '', acct: '', conn: '', receipt: '', stmtCust: '', ben: '', failed: ''};
const trS = () => trStats();

function trFillSel(id, pairs, keep){
  const n = el(id);
  if(!n) return;
  const cur = keep !== undefined ? keep : n.value;
  n.innerHTML = pairs.map(([v, l]) => `<option value="${esc(v)}">${esc(l)}</option>`).join('');
  if(cur && pairs.some(p => p[0] === cur)) n.value = cur;
}
const trCustOptions = () => CUSTOMERS.slice(0, 40).map(c => [c.id, c.id + ' · ' + c.name]);
const trAcctOptions = () => TR_ACCOUNTS.slice(0, 60).map(a => [a.id, a.id + ' · ' + custName(a.cust) + ' · ' + a.type + ' · ' + trM(a.available)]);
const trMethodOptions = () => TR_METHODS.map(m => [m.method, m.method + ' · ' + m.provider]);
const trBenOptions = () => TR_BENEFICIARIES.slice(0, 40).map(b => [b.id, b.id + ' · ' + b.name + ' · ' + b.kind]);

/* every list follows the filter bar; missing dimensions are simply not applied */
function trPass(item){
  const d = item.when || item.requested || item.added || item.opened || item.lastMove || item.lastWrite || item.effective || TODAY;
  if(!inRange(trIsos(d))) return false;
  const has = k => item[k] !== undefined && item[k] !== null && item[k] !== '';
  return (!has('lane') || passLane(item)) && (!has('severity') || passSeverity(item))
    && (!has('status') || passStatus(item)) && (!has('owner') || passOwner(item))
    && (!has('region') || passRegion(item)) && (!has('product') || passProduct(item))
    && matchQ(item.id, item.ref, item.txn, item.receipt, item.account, item.source, item.dest, item.destName,
      item.name, item.event, item.method, item.provider, item.scope, item.table, item.function, item.subject,
      item.cust ? custName(item.cust) : '', item.amount, item.description, item.notes, item.reason);
}

/* ===================== 1 · TRANSFERS OVERVIEW ===================== */
function trIssues(){
  const out = [];
  TR_TXN.filter(t => t.status === 'Failed').slice(0, 4).forEach(t => out.push({
    what: 'Failed ' + t.type.toLowerCase() + ' ' + t.id,
    detail: custName(t.cust) + ' · ' + trM(t.amount) + ' · ' + t.method + ' — ' + t.stage,
    severity: 'High', goto: 's15'
  }));
  TR_VERIFY.filter(v => !Object.values(v.checks).every(Boolean)).slice(0, 3).forEach(v => out.push({
    what: 'Transfer ' + v.txn + ' is failing a check',
    detail: custName(v.cust) + ' · ' + trM(v.amount) + ' · ' + v.method,
    severity: 'Medium', goto: 's8'
  }));
  TR_DUPLICATES.slice(0, 2).forEach(d => out.push({
    what: 'Duplicate reference ' + d.ref, detail: d.count + ' transfers · ' + trM(d.amount) + ' · ' + d.ids,
    severity: 'Critical', goto: 's10'
  }));
  TR_DISCREPANCY.forEach(d => out.push({
    what: 'Balance discrepancy on ' + d.account,
    detail: custName(d.cust) + ' · ' + trM(Math.abs(d.difference)) + ' out',
    severity: d.severity, goto: 's11'
  }));
  TR_CONNS.filter(c => c.status !== 'Connected').forEach(c => out.push({
    what: c.name + ' is ' + c.status.toLowerCase(),
    detail: c.provider + ' · ' + c.latency + ' ms · ' + c.credential,
    severity: 'Medium', goto: 's17'
  }));
  return out.filter(a => passSeverity(a) && matchQ(a.what, a.detail));
}

function renderOverview(){
  const s = trS();
  if(el('ovPill')){ el('ovPill').className = 'badge b-gray'; el('ovPill').textContent = num(s.total) + ' transfers'; }
  put('ovKpis', [
    ['Total transfers', num(s.total), num(s.internal) + ' internal · ' + num(s.external) + ' external', ''],
    ['Total transfer amount', trM(s.totalAmount), 'Completed transfers only', ''],
    ['Processed today', num(s.todayCount), trM(s.todayAmount) + ' settled today', ''],
    ['Pending approval', num(s.pendingApproval), 'Waiting for a signature', s.pendingApproval ? 'red' : ''],
    ['Currently processing', num(s.processing), 'At a provider right now', ''],
    ['Successful', num(s.completed), trM(s.totalAmount) + ' moved', ''],
    ['Failed', num(s.failed), 'The rail refused it', s.failed ? 'red' : ''],
    ['Rejected', num(s.rejected), 'An officer refused it', ''],
    ['Cancelled', num(s.cancelled), 'Withdrawn before release', ''],
    ['Reversed', num(s.reversed), 'Restored to the source', ''],
    ['Awaiting verification', num(s.pendingVerification), 'Not yet checked by a person', ''],
    ['Fees collected', trM(s.fees), 'On completed transfers', '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join(''));

  if(el('ovStamp')) el('ovStamp').textContent = 'Updated ' + lastRefresh();
  put('ovMeters',
    meter('Transfers completed', Math.round(pct(s.completed, Math.max(1, s.total))), num(s.completed) + ' of ' + num(s.total), 100) +
    meter('Queue cleared', Math.round(100 - pct(s.pending, Math.max(1, s.total))), s.pending + ' still waiting', 100) +
    meter('Internal share', Math.round(pct(s.internal, Math.max(1, s.total))), num(s.internal) + ' stayed in the ledger', 100) +
    meter('Accounts in good standing', Math.round(pct(s.accounts - s.suspended, Math.max(1, s.accounts))), (s.accounts - s.suspended) + ' of ' + s.accounts + ' open', 100) +
    meter('Ledger agrees with balances', Math.round(100 - pct(TR_DISCREPANCY.length, Math.max(1, s.accounts))), TR_DISCREPANCY.length + ' discrepancy alert(s)', 100) +
    meter('Transfer health score', Math.round(s.score), 'Failures, queue, duplicates, RLS and provider health', 100));

  const board = TR_STATUSES.map(st => ({st, n: TR_TXN.filter(t => t.status === st).length}));
  if(el('ovBoardPill')) el('ovBoardPill').textContent = num(s.total) + ' movements';
  put('ovBoard', board.map(b => `<div class="risk"><div><div class="rn">${esc(b.st)}</div>
      <div class="rs">${num(b.n)} transfer${b.n === 1 ? '' : 's'}</div></div>
      <div class="rv">${okb(b.st)}</div></div>`).join(''));

  put('ovGrid',
    chartBox({title: 'Value by rail', sub: 'Completed transfers, MWK', type: 'bar', h: 200,
      cats: TR_METHODS.map(m => m.method.replace(' transfer', '')),
      colours: TR_METHODS.map(m => TR_COLOURS[m.method]),
      series: [{name: 'Value', data: TR_METHODS.map(m => sum(TR_COMPLETED.filter(t => t.method === m.method), t => t.amount))}],
      value: compact(s.totalAmount)}) +
    chartBox({title: 'Transfers by state', sub: 'Every row on the register', type: 'donut', h: 200,
      cats: TR_STATUSES, series: [{name: 'Transfers', data: TR_STATUSES.map(st => TR_TXN.filter(t => t.status === st).length)}],
      value: num(s.total)}) +
    chartBox({title: 'The last seven days', sub: 'Internal against external, MWK', type: 'bar', h: 200,
      cats: TR_DAILY.map(d => d.label),
      series: [{name: 'Internal', data: TR_DAILY.map(d => d.internal), colour: '#2F6FED'},
        {name: 'External', data: TR_DAILY.map(d => d.external), colour: '#C9A227'}],
      value: compact(s.totalAmount)}));

  const issues = trIssues();
  if(el('ovAlertPill')) el('ovAlertPill').textContent = issues.length;
  put('ovAlerts', issues.length ? issues.map(a => `<div class="risk rowlink" data-goto="${a.goto}">
      <div><div class="rn">${esc(a.what)}</div><div class="rs">${esc(a.detail)}</div></div>
      <div class="rv">${badge(a.severity, TR_SEV(a.severity))}</div></div>`).join('')
    : '<div class="empty">Nothing open — every transfer is verified and every payout has cleared.</div>');

  const feed = TR_TXN.filter(trPass).slice(0, 8);
  put('ovFeed', feed.length ? feed.map(t => `<div class="risk rowlink" data-opentxn="${esc(t.id)}">
      <div><div class="rn">${esc(t.id)} · ${esc(t.type)} · ${esc(trM(t.amount))}</div>
        <div class="rs">${esc(custName(t.cust))} → ${esc(t.destName)} · ${esc(trWhen(t.when))}</div></div>
      <div class="rv">${okb(t.status)}</div></div>`).join('')
    : '<div class="empty">No transfer matches the current filters.</div>');
}

/* ===================== 2 · TRANSFER MANAGEMENT ===================== */
function renderTransfers(){
  const rows = TR_TXN.filter(trPass);
  const s = trS();
  if(el('tmPill')){ el('tmPill').className = 'badge b-gray'; el('tmPill').textContent = num(rows.length) + ' in view'; }
  put('tmKpis', [
    ['Transfers in view', num(rows.length), 'Of ' + num(TR_TXN.length) + ' on the register', ''],
    ['Value in view', trM(sum(rows, t => t.amount)), 'Whatever the state', ''],
    ['Customer-initiated', num(rows.filter(t => t.initiatedBy === 'Customer').length), 'Raised by the customer', ''],
    ['Staff-initiated', num(rows.filter(t => t.initiatedBy !== 'Customer').length), 'Recorded at the counter', ''],
    ['High priority', num(rows.filter(t => t.priority !== 'Normal').length), 'High or urgent', ''],
    ['With a document', num(rows.filter(t => t.docs).length), 'Proof attached to the transfer', ''],
    ['Created today', num(rows.filter(t => trIsos(t.when) === TODAY).length), fmtDate(TODAY), ''],
    ['Average transfer', trM(rows.length ? sum(rows, t => t.amount) / rows.length : 0), 'Across every rail', '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join(''));

  if(el('tmNewRef') && !el('tmNewRef').value) el('tmNewRef').value = TR_SET.transferPrefix + '-' + pad(2001 + TR_TXN.length, 5);
  if(el('tmNewWhen') && !el('tmNewWhen').value) el('tmNewWhen').value = TODAY + 'T08:30';
  if(el('tmPreview')) renderTransferPreview();

  if(el('tmCount')) el('tmCount').textContent = num(rows.length) + ' transfers';
  const sorted = rows.slice().sort((a, b) => String(b.when).localeCompare(String(a.when)));
  sorted.forEach(t => { t._open = () => { TR_SEL.txn = t.id; renderProcessing(); renderTransfers(); goto('s10'); }; });
  renderTable('tmBody', [
    {k: 'id', label: 'Reference'},
    {k: 'when', label: 'Date', html: v => esc(trWhen(v))},
    {k: 'type', label: 'Type'},
    {k: 'cust', label: 'Customer', html: v => esc(custName(v))},
    {k: 'source', label: 'From'},
    {k: 'destName', label: 'To', html: v => esc(String(v || '').slice(0, 26))},
    {k: 'method', label: 'Method'},
    {k: 'priority', label: 'Priority', html: v => badge(v, v === 'Normal' ? 'b-gray' : v === 'High' ? 'b-warn' : 'b-crit')},
    {k: 'amount', label: 'Amount', num: true, html: v => esc(trM(v))},
    {k: 'status', label: 'Status', html: v => okb(v)}
  ], sorted, {sort: 'when', pageSize: 12});

  const byStatus = TR_STATUSES.map(st => ({st, n: TR_TXN.filter(t => t.status === st).length,
    value: sum(TR_TXN.filter(t => t.status === st), t => t.amount)}));
  if(el('tmTrackPill')) el('tmTrackPill').textContent = num(TR_STATUSES.length) + ' states';
  put('tmTrack', byStatus.map(b => meter(b.st, b.n, trM(b.value), Math.max(1, TR_TXN.length))).join(''));

  if(el('tmHistPill')) el('tmHistPill').textContent = num(rows.length) + ' entries';
  renderTable('tmHistBody', [
    {k: 'when', label: 'Date', html: v => esc(trWhen(v))},
    {k: 'id', label: 'Reference'},
    {k: 'cust', label: 'Customer', html: v => esc(custName(v))},
    {k: 'amount', label: 'Amount', num: true, html: v => esc(trM(v))},
    {k: 'status', label: 'Status', html: v => okb(v)}
  ], sorted, {sort: 'when', pageSize: 8});

  trFillSel('tmNewCategory', TR_CATEGORIES.map(c => [c, c]));
  trFillSel('tmNewSourceAcct', trAcctOptions());
  trFillSel('tmNewDest', [['', 'Choose a destination']].concat(trBenOptions()));
}

function renderTransferPreview(){
  const amount = Number(el('tmNewAmount') ? el('tmNewAmount').value : 0) || 0;
  const method = (el('tmNewType') ? el('tmNewType').value : 'Internal');
  const fee = trFeeFor(method, amount);
  const src = TR_ACC_BY_ID[el('tmNewSourceAcct') ? el('tmNewSourceAcct').value : ''] || TR_ACCOUNTS[0];
  const covered = amount + fee <= src.available;
  put('tmPreview', strip([
    ['Source', src.id + ' · ' + trM(src.available)],
    ['Amount', trM(amount)],
    ['Fee', trM(fee)],
    ['Total needed', trM(amount + fee)],
    ['Balance after', trM(Math.max(0, src.available - amount - fee))]
  ]) + `<div class="qhint" style="margin-top:6px">${covered
    ? 'The source account covers the transfer and the fee.'
    : 'The source account does not cover this transfer — it will be held at verification.'}</div>`);
}
function trFeeFor(kind, amount){
  const method = TR_METHOD_BY_NAME[kind] ? kind
    : kind === 'Internal' ? 'Internal transfer' : kind === 'Savings' ? 'Savings transfer'
    : kind === 'Loan' ? 'Loan transfer' : kind === 'Bank' ? 'Bank transfer' : 'Airtel Money';
  const f = TR_FEES.find(x => x.method === method);
  if(!f) return 0;
  return Math.round(Number(amount) * f.pct / 100) + f.flat;
}

/* ===================== 3 · INTERNAL ACCOUNT TRANSFERS ===================== */
function trInternalDestinations(source){
  const own = TR_ACCOUNTS.filter(a => a.cust === source.cust && a.id !== source.id);
  const third = TR_SET.allowThirdPartyInternal
    ? TR_ACCOUNTS.filter(a => a.cust !== source.cust && a.eligible && a.status === 'Active').slice(0, 24) : [];
  return own.concat(third);
}
function trInternalCheck(){
  const src = TR_ACC_BY_ID[el('itSource') ? el('itSource').value : ''] || TR_ACCOUNTS[0];
  const dst = TR_ACC_BY_ID[el('itDest') ? el('itDest').value : ''] || trInternalDestinations(src)[0] || src;
  const amount = Number(el('itAmount') ? el('itAmount').value : 0) || 0;
  const sameCustomer = dst && dst.cust === src.cust;
  const checks = [
    ['Source account is open', src.status === 'Active', src.status],
    ['Destination is open and active', dst.status === 'Active', dst.status],
    ['Destination is eligible to receive', !!dst.eligible, dst.eligible ? 'Eligible' : 'Not eligible'],
    ['Ownership verified', sameCustomer || TR_SET.allowThirdPartyInternal,
      sameCustomer ? 'Both accounts belong to ' + custName(src.cust) : 'Third-party transfers are allowed'],
    ['Inside the minimum and maximum', amount >= TR_SET.minInternal && amount <= TR_SET.maxInternal,
      trM(TR_SET.minInternal) + ' – ' + trM(TR_SET.maxInternal)],
    ['Source balance covers the amount', amount <= src.available, trM(src.available) + ' available'],
    ['Inside the per-customer daily limit', amount <= TR_SET.perCustomerDailyLimit, trM(TR_SET.perCustomerDailyLimit)],
    ['Savings restriction allows it', dst.type !== 'Savings' || dst.restriction === 'None', dst.restriction || 'None']
  ];
  return {src, dst, amount, checks, pass: checks.every(c => c[1]), sameCustomer};
}
function renderInternal(){
  const rows = TR_TXN.filter(t => t.type === 'Internal' && trPass(t));
  const s = trS();
  if(el('itPill')){ el('itPill').className = 'badge ' + (rows.length ? 'b-ok' : 'b-gray'); el('itPill').textContent = num(rows.length) + ' internal'; }
  put('itKpis', [
    ['Internal transfers', num(rows.length), 'Stayed inside the ledger', ''],
    ['Value moved', trM(sum(rows.filter(t => t.status === 'Completed'), t => t.amount)), 'Between accounts', ''],
    ['Own accounts', num(rows.filter(t => t.category === 'Own accounts').length), 'Same customer, two accounts', ''],
    ['Third-party', num(rows.filter(t => t.category !== 'Own accounts' && t.method === 'Internal transfer').length), 'Different customers', ''],
    ['Completed', num(rows.filter(t => t.status === 'Completed').length), 'Posted both sides', ''],
    ['Waiting', num(rows.filter(t => ['Pending verification', 'Pending approval', 'Processing'].includes(t.status)).length), 'Not yet settled', ''],
    ['Fees', trM(sum(rows, t => t.fee)), 'Internal transfers are free by default', ''],
    ['Average', trM(rows.length ? sum(rows, t => t.amount) / rows.length : 0), 'Across the internal book', '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join(''));

  const src = TR_ACC_BY_ID[el('itSource') ? el('itSource').value : ''] || TR_ACCOUNTS[0];
  const dests = trInternalDestinations(src);
  trFillSel('itSource', trAcctOptions(), src.id);
  trFillSel('itDest', dests.map(a => [a.id, a.id + ' · ' + custName(a.cust) + ' · ' + a.type + ' · ' + trM(a.available)]),
    dests[0] ? dests[0].id : '');
  const chk = trInternalCheck();
  if(el('itMode')) el('itMode').textContent = chk.sameCustomer ? 'Own accounts' : 'Third party';
  put('itOwnBox', kvRow('Source owner', custName(chk.src.cust) + ' · ' + chk.src.cust)
    + kvRow('Destination owner', custName(chk.dst.cust) + ' · ' + chk.dst.cust)
    + kvRow('Ownership', chk.sameCustomer ? okb('Verified') : badge('Different customer', 'b-warn'))
    + kvRow('Destination account', chk.dst.id + ' · ' + chk.dst.type));
  put('itChecks', chk.checks.map(([label, ok, detail]) => `<div class="checkrow">
      <div class="ck ${ok ? 'pass' : 'crit'}">${ok ? '✓' : '!'}</div>
      <div style="flex:1"><div style="font-size:10.5px;font-weight:800">${esc(label)}</div>
        <div class="qhint">${esc(detail)}</div></div>
      <div>${okb(ok ? 'Pass' : 'Failed')}</div></div>`).join('')
    + `<div class="qhint" style="margin-top:6px">${chk.pass
      ? 'Everything clears — the transfer can be made.'
      : 'Fix the failing checks first; the transfer will be refused otherwise.'}</div>`);

  if(el('itBodyPill')) el('itBodyPill').textContent = num(rows.length) + ' rows';
  const sorted = rows.slice().sort((a, b) => String(b.when).localeCompare(String(a.when)));
  sorted.forEach(t => { t._open = () => { TR_SEL.txn = t.id; openTransfer(t); }; });
  renderTable('itBody', [
    {k: 'id', label: 'Reference'},
    {k: 'when', label: 'Date', html: v => esc(trWhen(v))},
    {k: 'cust', label: 'Customer', html: v => esc(custName(v))},
    {k: 'source', label: 'From'},
    {k: 'dest', label: 'To'},
    {k: 'amount', label: 'Amount', num: true, html: v => esc(trM(v))},
    {k: 'status', label: 'Status', html: v => okb(v)}
  ], sorted, {sort: 'when', pageSize: 8});

  const bad = TR_ACCOUNTS.filter(a => !a.eligible || a.status !== 'Active');
  if(el('itIneligPill')) el('itIneligPill').textContent = num(bad.length) + ' blocked';
  put('itIneligBox', bad.slice(0, 8).map(a => `<div class="risk rowlink" data-accpick="${esc(a.id)}">
      <div><div class="rn">${esc(a.id)} · ${esc(custName(a.cust))}</div>
        <div class="rs">${esc(a.type)} · ${esc(a.status)} · ${esc(trM(a.available))} held</div></div>
      <div class="rv">${okb(a.status === 'Active' ? 'Blocked' : a.status)}</div></div>`).join('')
    || '<div class="empty">Every account is open and eligible.</div>');
}

/* ===================== 4 · SAVINGS TRANSFERS ===================== */
function renderSavings(){
  const rows = TR_TXN.filter(t => t.method === 'Savings transfer' && trPass(t));
  const s = trS();
  const savingsTotal = sum(TR_SAVINGS, a => a.available);
  if(el('svPill')){ el('svPill').className = 'badge b-gray'; el('svPill').textContent = num(TR_SAVINGS.length) + ' savings accounts'; }
  put('svKpis', [
    ['Savings accounts', num(TR_SAVINGS.length), 'Every customer has one', ''],
    ['Savings held', trM(savingsTotal), 'Available across the book', ''],
    ['Savings transfers', num(rows.length), 'Into, out of and between', ''],
    ['Value moved', trM(sum(rows.filter(t => t.status === 'Completed'), t => t.amount)), 'Completed savings movements', ''],
    ['Into savings', num(rows.filter(t => /^SAV/.test(t.dest)).length), 'Money put away', ''],
    ['Out of savings', num(rows.filter(t => /^SAV/.test(t.source)).length), 'Money drawn back out', ''],
    ['Restricted accounts', num(TR_SAVINGS.filter(a => a.restriction !== 'None').length), 'Withdrawal conditions apply', ''],
    ['Fees', trM(sum(rows, t => t.fee)), 'Savings transfers are free', '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join(''));

  const acc = TR_ACC_BY_ID[el('svAccount') ? el('svAccount').value : ''] || TR_SAVINGS[0];
  trFillSel('svAccount', TR_SAVINGS.slice(0, 40).map(a => [a.id, a.id + ' · ' + custName(a.cust) + ' · ' + trM(a.available)]), acc.id);
  const dir = el('svDir') ? el('svDir').value : 'Into savings';
  const others = dir === 'Between savings accounts'
    ? TR_SAVINGS.filter(a => a.id !== acc.id && a.eligible && a.status === 'Active').slice(0, 24)
    : TR_ACCOUNTS.filter(a => a.cust === acc.cust && a.id !== acc.id);
  trFillSel('svDest', others.map(a => [a.id, a.id + ' · ' + custName(a.cust) + ' · ' + trM(a.available)]),
    others[0] ? others[0].id : acc.id);
  const amount = Number(el('svAmount') ? el('svAmount').value : 0) || 0;
  const destId = el('svDest') ? el('svDest').value : '';
  const fee = 0;
  const drawing = dir === 'Out of savings' || (dir === 'Between savings accounts' && /^SAV/.test(destId) === false);
  const restrictionOk = !drawing || acc.restriction === 'None';
  put('svRestrict', `<div class="minihead">Savings withdrawal restriction</div>`
    + kvRow('Account', acc.id + ' · ' + acc.type)
    + kvRow('Restriction', acc.restriction === 'None' ? okb('No restriction') : badge(acc.restriction, 'b-warn'))
    + kvRow('Drawing funds out', drawing ? 'Yes' : 'No — this is a deposit into savings')
    + kvRow('Allowed', restrictionOk && amount <= acc.available ? okb('Pass') : okb('Failed'))
    + kvRow('Available in savings', trM(acc.available)));
  put('svFee', `<div class="minihead">Fee and effect</div>`
    + kvRow('Amount', trM(amount))
    + kvRow('Transfer fee', trM(fee))
    + kvRow('Savings balance after', trM(drawing ? Math.max(0, acc.available - amount) : acc.available + amount))
    + kvRow('Reference', 'Issued when the transfer is posted'));
  if(el('svMsg') && !String(el('svMsg').textContent).trim())
    el('svMsg').textContent = 'Pick a direction and an amount, run the checks, then make the transfer.';

  const led = TR_LEDGER.filter(e => e.account === acc.id && trPass(e));
  if(el('svLedgerPill')) el('svLedgerPill').textContent = num(led.length) + ' entries';
  renderTable('svLedgerBody', [
    {k: 'entry', label: 'Entry'},
    {k: 'when', label: 'When', html: v => esc(trWhen(v))},
    {k: 'txn', label: 'Transfer'},
    {k: 'side', label: 'Side', html: v => badge(v, v === 'Credit' ? 'b-ok' : 'b-warn')},
    {k: 'amount', label: 'Amount', num: true, html: v => esc(trM(v))},
    {k: 'balance', label: 'Balance after', num: true, html: v => esc(trM(v))}
  ], led.slice().sort((a, b) => String(b.when).localeCompare(String(a.when))), {sort: 'when', pageSize: 6});

  if(el('svHistPill')) el('svHistPill').textContent = num(rows.length) + ' rows';
  const sorted = rows.slice().sort((a, b) => String(b.when).localeCompare(String(a.when)));
  sorted.forEach(t => { t._open = () => { TR_SEL.txn = t.id; openTransfer(t); }; });
  renderTable('svHistBody', [
    {k: 'when', label: 'Date', html: v => esc(trWhen(v))},
    {k: 'id', label: 'Reference'},
    {k: 'cust', label: 'Customer', html: v => esc(custName(v))},
    {k: 'source', label: 'From'},
    {k: 'dest', label: 'To'},
    {k: 'amount', label: 'Amount', num: true, html: v => esc(trM(v))},
    {k: 'status', label: 'Status', html: v => okb(v)}
  ], sorted, {sort: 'when', pageSize: 8});
}

function openTransfer(t){
  openModal(t.id, t.type + ' transfer · ' + custName(t.cust) + ' · ' + trWhen(t.when),
    `<div class="pfields" style="grid-template-columns:1fr 1fr">
      ${field('Amount', esc(trM(t.amount)))}${field('Fee', esc(trM(t.fee)))}
      ${field('From', esc(t.source))}${field('To', esc(t.destName))}
      ${field('Method', esc(t.method))}${field('Provider', esc(t.provider))}
      ${field('Provider reference', esc(t.ref))}${field('Status', okb(t.status))}
      ${field('Category', esc(t.category))}${field('Priority', esc(t.priority))}
      ${field('Raised by', esc(t.initiatedBy === 'Customer' ? 'The customer' : staffName(t.initiatedBy)))}
      ${field('Officer', esc(staffName(t.officer)))}
    </div>
    <div class="qhint" style="margin-top:8px">${esc(t.stage)}${t.description ? ' · ' + esc(t.description) : ''}</div>`,
    [{label: 'Open in processing', act: () => { closeModal(); goto('s10'); renderProcessing(); }},
     {label: 'Close', act: 'close'}]);
}
</script>
