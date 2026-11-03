<script>
/* ============================================================
   DEPOSITS & WITHDRAWALS MANAGEMENT & CONNECTIONS (7/7)
   Sections 14–18: notifications, fraud and security, the
   database connections, the reports and the settings history —
   then the filter bar, the render loop and every handler.
   ============================================================ */

/* ===================== 14 · CUSTOMER NOTIFICATIONS ===================== */
const DW_NOTIFY_EVENTS = () => DW_NOTIFY_RULES;
function renderNotifications(){
  const log = DW_NOTIFY_LOG.filter(dwPass);
  const sent = log.length;
  const delivered = log.filter(n => n.status === 'Delivered').length;
  if(el('nfPill')){
    el('nfPill').className = 'badge ' + (log.some(n => n.status === 'Failed') ? 'b-warn' : 'b-ok');
    el('nfPill').textContent = num(sent) + ' messages';
  }
  put('nfKpis', [
    ['Rules configured', num(DW_NOTIFY_RULES.length), 'Deposit and payout events', ''],
    ['Messages logged', num(sent), 'In the current window', ''],
    ['Delivered', num(delivered), sent ? Math.round(pct(delivered, sent)) + '% of them' : 'Nothing sent', ''],
    ['Failed', num(log.filter(n => n.status === 'Failed').length), 'Number invalid or channel down', ''],
    ['Queued', num(log.filter(n => n.status === 'Queued').length), 'Waiting on the provider', ''],
    ['SMS credit', num(DW_CHANNELS.sms.balance), DW_CHANNELS.sms.provider + ' · ' + DW_CHANNELS.sms.status, ''],
    ['Email allowance', DW_CHANNELS.email.balance + ' used', DW_CHANNELS.email.provider + ' · ' + DW_CHANNELS.email.status, ''],
    ['Notifications switched on', num(DW_NOTIFY_RULES.filter(r => r.on).length), 'Of ' + DW_NOTIFY_RULES.length + ' event types', '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join(''));

  if(el('nfRulePill')) el('nfRulePill').textContent = num(DW_NOTIFY_RULES.length) + ' rules';
  renderTable('nfBody', [
    {k: 'event', label: 'Event'},
    {k: 'to', label: 'Who receives it'},
    {k: 'template', label: 'Template'},
    {k: 'sms', label: 'SMS', html: v => okb(v ? 'On' : 'Disabled')},
    {k: 'email', label: 'Email', html: v => okb(v ? 'On' : 'Disabled')},
    {k: 'on', label: 'Rule', html: (v, r) => `<button class="btn btn-ghost" data-nfrule="${esc(r.event)}">${v ? 'Switch off' : 'Switch on'}</button>`}
  ], DW_NOTIFY_RULES, {pageSize: 8, onRow: false});

  put('nfConnBox', Object.keys(DW_CHANNELS).map(k => {
    const c = DW_CHANNELS[k];
    return `<div class="risk"><div><div class="rn">${k === 'sms' ? 'SMS' : 'Email'} · ${esc(c.provider)}</div>
        <div class="rs">${esc(c.sender)} · ${esc(String(c.balance))} · ${esc(c.latency + ' ms')}</div></div>
      <div class="rv">${okb(c.status)}</div></div>`;
  }).join('') + kvRow('Last SMS', esc(DW_CHANNELS.sms.lastSend)) + kvRow('Last email', esc(DW_CHANNELS.email.lastSend)));

  if(el('nfDelPill')) el('nfDelPill').textContent = num(delivered) + ' delivered';
  renderTable('nfDelBody', [
    {k: 'channel', label: 'Channel'},
    {k: 'delivered', label: 'Delivered', num: true},
    {k: 'queued', label: 'Queued', num: true},
    {k: 'failed', label: 'Failed', num: true},
    {k: 'status', label: 'Channel', html: v => okb(v)}
  ], ['SMS', 'Email'].map(ch => ({
    channel: ch,
    delivered: log.filter(n => n.channel === ch && n.status === 'Delivered').length,
    queued: log.filter(n => n.channel === ch && n.status === 'Queued').length,
    failed: log.filter(n => n.channel === ch && n.status === 'Failed').length,
    status: ch === 'SMS' ? DW_CHANNELS.sms.status : DW_CHANNELS.email.status
  })), {pageSize: 4, onRow: false});

  if(el('nfHistPill')) el('nfHistPill').textContent = num(sent) + ' entries';
  renderTable('nfHistBody', [
    {k: 'when', label: 'When', html: v => esc(dwWhen(v))},
    {k: 'event', label: 'Event'},
    {k: 'channel', label: 'Channel'},
    {k: 'to', label: 'To'},
    {k: 'reference', label: 'Transaction'},
    {k: 'status', label: 'Delivery', html: v => okb(v)}
  ], log.slice().sort((a, b) => String(b.when).localeCompare(String(a.when))), {sort: 'when', pageSize: 10});

  const evs = DW_NOTIFY_RULES.map(r => ({event: r.event, n: DW_NOTIFY_LOG.filter(l => l.event === r.event).length}));
  put('nfGrid',
    chartBox({title: 'Messages by event', sub: 'Where the traffic comes from', type: 'bar', h: 190,
      cats: evs.map(e => e.event.replace(' ', '\n')),
      series: [{name: 'Messages', data: evs.map(e => e.n)}], value: num(sent)}) +
    chartBox({title: 'Delivery by channel', sub: 'Delivered, queued and failed', type: 'stacked', h: 190,
      cats: ['SMS', 'Email'],
      series: [{name: 'Delivered', data: ['SMS', 'Email'].map(c => log.filter(n => n.channel === c && n.status === 'Delivered').length), colour: '#0E9AA7'},
        {name: 'Queued', data: ['SMS', 'Email'].map(c => log.filter(n => n.channel === c && n.status === 'Queued').length), colour: '#C9A227'},
        {name: 'Failed', data: ['SMS', 'Email'].map(c => log.filter(n => n.channel === c && n.status === 'Failed').length), colour: '#D93F3F'}],
      value: num(sent)}));
}

/* ===================== 15 · FRAUD AND SECURITY ===================== */
function renderSecurity(){
  if(el('frPill')){
    el('frPill').className = 'badge ' + (DW_FRAUD.some(f => f.status !== 'Resolved') ? 'b-warn' : 'b-ok');
    el('frPill').textContent = num(DW_FRAUD.filter(f => f.status !== 'Resolved').length) + ' open';
  }
  put('frKpis', [
    ['Identity checks', num(DW_ID_CHECKS.length), num(DW_ID_CHECKS.filter(i => i.checked === 'Verified').length) + ' verified', ''],
    ['Suspicious events', num(DW_FRAUD.length), 'Deposits and payouts', ''],
    ['Duplicate references', num(DW_DUPES.length), 'The same reference twice', ''],
    ['Unusual amounts', num(DW_AMOUNT_ALERTS.length), 'Far from the customer norm', ''],
    ['Velocity breaches', num(DW_VELOCITY.filter(v => v.status === 'Breach').length), 'Too many payouts today', ''],
    ['Account changes', num(DW_ACC_CHANGES.length), num(DW_ACC_CHANGES.filter(c => c.status !== 'Verified').length) + ' unverified', ''],
    ['Roles with approval power', num(DW_ROLES.filter(r => (DW_PERMS[r] || [])[4]).length), 'Management approval', ''],
    ['Sensitive approvals waiting', num(DW_APPROVALS.filter(a => a.risk === 'High').length), 'High risk queue', '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join(''));

  if(el('frIdPill')) el('frIdPill').textContent = num(DW_ID_CHECKS.length) + ' checks';
  renderTable('frIdBody', [
    {k: 'ref', label: 'Payout reference'},
    {k: 'cust', label: 'Customer', html: v => esc(custName(v))},
    {k: 'doc', label: 'Document'},
    {k: 'number', label: 'Number'},
    {k: 'checked', label: 'Result', html: v => okb(v)},
    {k: 'by', label: 'Checked by', html: v => v === '—' ? '—' : esc(staffName(v))}
  ], DW_ID_CHECKS.filter(dwPass), {pageSize: 6});

  if(el('frSuspPill')) el('frSuspPill').textContent = num(DW_FRAUD.filter(f => f.status !== 'Resolved').length) + ' open';
  renderTable('frSuspBody', [
    {k: 'when', label: 'When', html: v => esc(dwWhen(v))},
    {k: 'event', label: 'What happened'},
    {k: 'subject', label: 'Subject', html: v => /^CUS/.test(String(v)) ? esc(custName(v)) : esc(v)},
    {k: 'severity', label: 'Severity', html: v => badge(v, DW_SEV(v))},
    {k: 'status', label: 'Status', html: v => okb(v)}
  ], DW_FRAUD.filter(dwPass), {sort: 'when', pageSize: 6, onRow: false});

  if(el('frDupPill')) el('frDupPill').textContent = num(DW_DUPES.length) + ' groups';
  renderTable('frDupBody', [
    {k: 'ref', label: 'Reference'},
    {k: 'count', label: 'Seen', num: true},
    {k: 'amount', label: 'Value', num: true, html: v => esc(dwM(v))},
    {k: 'status', label: 'State', html: v => okb(v)}
  ], DW_DUPES, {pageSize: 4, onRow: false});
  renderTable('frAmtBody', [
    {k: 'txn', label: 'Transaction'},
    {k: 'type', label: 'Type'},
    {k: 'amount', label: 'Amount', num: true, html: v => esc(dwM(v))},
    {k: 'band', label: 'Why it was flagged'},
    {k: 'status', label: 'State', html: v => okb(v)}
  ], DW_AMOUNT_ALERTS, {pageSize: 4, onRow: false});

  if(el('frVelPill')) el('frVelPill').textContent = num(DW_VELOCITY.filter(v => v.status === 'Breach').length) + ' breaches';
  put('frVelBox', DW_VELOCITY.slice(0, 6).map(v => meter(custName(v.cust) + ' · ' + v.withdrawals24h + ' payouts',
    v.withdrawals24h, 'limit ' + v.limit + ' · ' + dwM(v.amount24h) + ' of ' + dwM(v.amountLimit), Math.max(v.limit, v.withdrawals24h))).join(''));
  renderTable('frChgBody', [
    {k: 'when', label: 'When', html: v => esc(dwWhen(v))},
    {k: 'cust', label: 'Customer', html: v => esc(custName(v))},
    {k: 'field', label: 'Field'},
    {k: 'from', label: 'Was'},
    {k: 'to', label: 'Now'},
    {k: 'status', label: 'Verified', html: v => okb(v)}
  ], DW_ACC_CHANGES.filter(dwPass), {sort: 'when', pageSize: 4, onRow: false});

  if(el('frPermPill')) el('frPermPill').textContent = num(DW_CAPS.length) + ' capabilities';
  renderTable('frPermBody', [
    {k: 'role', label: 'Role'},
    {k: 'caps', label: 'Capabilities', html: v => `<div class="chips">${DW_CAPS.map((c, i) =>
        `<span class="fchip${v[i] ? ' on' : ''}" data-perm="${esc(v.role)}" data-pi="${i}" title="${esc(c)}">${esc(c.length > 18 ? c.slice(0, 17) + '…' : c)}</span>`).join('')}</div>`},
    {k: 'staff', label: 'Officer', html: v => esc(staffName(v))}
  ], DW_ROLES.map(r => ({role: r, caps: DW_PERMS[r] || [], staff: DW_ROLE_STAFF[r]})), {pageSize: 6, onRow: false});
  renderTable('frApprBody', [
    {k: 'txn', label: 'Transaction'},
    {k: 'amount', label: 'Amount', num: true, html: v => esc(dwM(v))},
    {k: 'level', label: 'Needs'},
    {k: 'risk', label: 'Risk', html: v => badge(v, DW_SEV(v))},
    {k: 'status', label: 'Status', html: v => okb(v)}
  ], DW_APPROVALS.filter(a => a.risk === 'High').map(a => Object.assign({}, a, {status: a.status})), {pageSize: 4, onRow: false});

  if(el('frAuditPill')) el('frAuditPill').textContent = num(DW_AUDIT.length + DW_TXN.length) + ' entries';
  const audit = DW_TXN.slice(0, 30).map(t => ({when: t.when, action: t.status, target: t.id, detail: t.stage, by: t.officer}))
    .concat(DW_AUDIT.map(a => ({when: a.when, action: a.action, target: a.target, detail: a.detail, by: 'STF-001'})));
  renderTable('frAuditBody', [
    {k: 'when', label: 'When', html: v => esc(dwWhen(v))},
    {k: 'action', label: 'Action', html: v => okb(v)},
    {k: 'target', label: 'Target'},
    {k: 'detail', label: 'Detail'},
    {k: 'by', label: 'Officer', html: v => esc(staffName(v))}
  ], audit, {sort: 'when', pageSize: 10, onRow: false});

  put('frGrid',
    chartBox({title: 'Risk by kind', sub: 'Where the risk sits', type: 'donut', h: 190,
      cats: ['Duplicate reference', 'Unusual amount', 'Velocity', 'Account change'],
      series: [{name: 'Events', data: [DW_DUPES.length, DW_AMOUNT_ALERTS.filter(a => a.status === 'Flagged').length,
        DW_VELOCITY.filter(v => v.status === 'Breach').length, DW_ACC_CHANGES.filter(c => c.status !== 'Verified').length]}],
      value: num(DW_FRAUD.length)}) +
    chartBox({title: 'Suspicious events by severity', sub: 'Open and resolved', type: 'bar', h: 190,
      cats: ['Critical', 'High', 'Medium', 'Low'],
      series: [{name: 'Events', data: ['Critical', 'High', 'Medium', 'Low'].map(s => DW_FRAUD.filter(f => f.severity === s).length)}],
      value: num(DW_FRAUD.length)}));
}

/* ===================== 16 · DATABASE CONNECTIONS ===================== */
function renderDb(){
  const tables = DW_DB_TABLES.filter(dwPass);
  const gaps = DW_DB_TABLES.filter(t => t.rls !== 'Enabled');
  if(el('dbPill')){
    el('dbPill').className = 'badge ' + (gaps.length ? 'b-warn' : 'b-ok');
    el('dbPill').textContent = gaps.length ? gaps.length + ' policy gap' : 'All policies in place';
  }
  put('dbKpis', [
    ['Tables connected', num(DW_DB_TABLES.length), 'Every table a movement touches', ''],
    ['Rows in play', num(sum(DW_DB_TABLES, t => t.rows)), 'Deposits, withdrawals, ledger and proofs', ''],
    ['Functions and triggers', num(DW_DB_FUNCS.length), num(DW_DB_FUNCS.filter(f => f.status === 'Healthy').length) + ' healthy', ''],
    ['Row-level security', num(DW_DB_TABLES.filter(t => t.rls === 'Enabled').length) + ' of ' + num(DW_DB_TABLES.length), gaps.length + ' without a policy', gaps.length ? 'red' : ''],
    ['Open database errors', num(DW_DB_ERRORS.filter(e => e.status === 'Open').length), 'Grouped by SQLSTATE', ''],
    ['Integrity checks', num(DW_DB_CHECKS.filter(c => c.status === 'Pass').length) + ' of ' + num(DW_DB_CHECKS.length), 'Passing right now', ''],
    ['Migrations applied', num(DW_MIGRATIONS.filter(m => m.status === 'Applied').length), num(DW_MIGRATIONS.filter(m => m.status === 'Pending').length) + ' waiting', ''],
    ['Schema version', '2026.10.28.1', 'Matches the application', '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join(''));

  put('dbGrid',
    chartBox({title: 'Rows by table', sub: 'What the movement register holds', type: 'bar', h: 190,
      cats: DW_DB_TABLES.map(t => t.table.replace('_', ' ')),
      series: [{name: 'Rows', data: DW_DB_TABLES.map(t => t.rows)}], value: num(sum(DW_DB_TABLES, t => t.rows))}) +
    chartBox({title: 'Integrity checks', sub: 'Passing against failing', type: 'donut', h: 190,
      cats: ['Pass', 'Fail'],
      series: [{name: 'Checks', data: ['Pass', 'Fail'].map(s => DW_DB_CHECKS.filter(c => c.status === s).length)}],
      value: num(DW_DB_CHECKS.length)}) +
    chartBox({title: 'Database errors by code', sub: 'Open and resolved', type: 'bar', h: 190,
      cats: DW_DB_ERRORS.map(e => e.code),
      series: [{name: 'Occurrences', data: DW_DB_ERRORS.map(e => e.count)}],
      value: num(sum(DW_DB_ERRORS, e => e.count))}));

  if(el('dbTblPill')) el('dbTblPill').textContent = num(tables.length) + ' tables';
  renderTable('dbTblBody', [
    {k: 'table', label: 'Table'},
    {k: 'rows', label: 'Rows', num: true},
    {k: 'size', label: 'Size'},
    {k: 'function', label: 'Written by'},
    {k: 'rls', label: 'Row security', html: v => okb(v === 'Enabled' ? 'Enabled' : 'Missing')},
    {k: 'lastWrite', label: 'Last write', html: v => esc(dwWhen(v))}
  ], tables, {pageSize: 8, onRow: false});

  if(el('dbfnPill')) el('dbfnPill').textContent = num(DW_DB_FUNCS.length) + ' routines';
  renderTable('dbfnBody', [
    {k: 'name', label: 'Function or trigger'},
    {k: 'kind', label: 'Kind'},
    {k: 'invoker', label: 'Security'},
    {k: 'calls', label: 'Calls', num: true},
    {k: 'status', label: 'Status', html: v => okb(v)}
  ], DW_DB_FUNCS.filter(dwPass), {pageSize: 6, onRow: false});

  if(el('rlsPill')){
    el('rlsPill').className = 'badge ' + (gaps.length ? 'b-crit' : 'b-ok');
    el('rlsPill').textContent = gaps.length ? 'Gap open' : 'Closed';
  }
  put('rlsBox', (gaps.length ? gaps : [{table: 'transaction_proofs', note: 'Every table has a policy', rls: 'Enabled'}]).map(t =>
    `<div class="risk"><div><div class="rn">${esc(t.table)}</div><div class="rs">${esc(t.note)}</div></div>
      <div class="rv">${okb(t.rls === 'Enabled' ? 'Enabled' : 'Missing')}</div></div>`).join('')
    + kvRow('Customer policy', 'A customer reads only their own rows')
    + kvRow('Staff policy', 'Staff read by branch, administrators by role')
    + kvRow('Proof bucket policy', gaps.length ? 'Storage object policy missing on transaction_proofs' : 'Signed URLs, staff only'));
  put('dbIntBox', '<div class="minihead">Transaction integrity</div>'
    + kvRow('Deposit posting', 'Insert, ledger credit and audit row in one transaction')
    + kvRow('Withdrawal release', 'Two approvals recorded before the debit')
    + kvRow('Reversal', 'The opposite entry is written, never an update')
    + kvRow('Duplicate protection', 'Unique index on the provider reference inside the window'));

  if(el('dbErrPill')) el('dbErrPill').textContent = num(DW_DB_ERRORS.filter(e => e.status === 'Open').length) + ' open';
  renderTable('dbErrBody', [
    {k: 'code', label: 'SQLSTATE'},
    {k: 'message', label: 'Message'},
    {k: 'count', label: 'Count', num: true},
    {k: 'when', label: 'Last seen', html: v => esc(dwWhen(v))},
    {k: 'status', label: 'Status', html: v => okb(v)}
  ], DW_DB_ERRORS.filter(dwPass), {sort: 'when', pageSize: 4, onRow: false});

  if(el('dbChkPill')) el('dbChkPill').textContent = num(DW_DB_CHECKS.filter(c => c.status === 'Pass').length) + '/' + num(DW_DB_CHECKS.length);
  put('dbChkBox', DW_DB_CHECKS.map(c => `<div class="checkrow">
      <div class="ck ${c.status === 'Pass' ? 'pass' : 'crit'}">${c.status === 'Pass' ? '✓' : '!'}</div>
      <div style="flex:1"><div style="font-size:10.5px;font-weight:800">${esc(c.check)}</div>
        <div class="qhint">${esc(c.value)}</div></div>
      <div>${okb(c.status)}</div></div>`).join(''));
  put('dbDupBox', '<div class="minihead">Duplicate submission protection</div>'
    + kvRow('Unique index', 'deposits(provider_reference, account_id)')
    + kvRow('Window', DW_SET.duplicateWindow + ' minutes')
    + kvRow('Blocked today', num(DW_DB_ERRORS.find(e => e.code === '23505') ? DW_DB_ERRORS.find(e => e.code === '23505').count : 0) + ' attempts')
    + kvRow('What the customer sees', '“We already have this deposit — no money was taken twice”'));
  if(el('dbSchemaBox') && !el('dbSchemaBox').innerHTML)
    el('dbSchemaBox').innerHTML = '<div class="qhint">Run the schema check to compare the application against the database.</div>';

  if(el('migPill')) el('migPill').textContent = num(DW_MIGRATIONS.length) + ' migrations';
  renderTable('migBody', [
    {k: 'id', label: 'Migration'},
    {k: 'name', label: 'What it does'},
    {k: 'when', label: 'When', html: v => esc(dwWhen(v))},
    {k: 'status', label: 'Status', html: v => okb(v)}
  ], DW_MIGRATIONS.filter(dwPass), {sort: 'when', pageSize: 6, onRow: false});
}

/* ===================== 17 · REPORTS ===================== */
function dwReport(key){
  const inWindow = t => inRange(dwIsos(t.when));
  const R = {
    dailyDeposits: () => ({title: 'Daily Deposits Report', note: 'Every completed deposit today, with its method and officer.',
      cols: [['Deposit', 'id'], ['When', 'when'], ['Customer', 'cust'], ['Method', 'method'], ['Amount', 'amount'], ['Status', 'status']],
      rows: DW_DEPOSITS.filter(t => dwIsos(t.when) === TODAY).map(t => ({id: t.id, when: dwWhen(t.when), cust: custName(t.cust), method: t.method, amount: dwM(t.amount), status: t.status}))}),
    dailyWithdrawals: () => ({title: 'Daily Withdrawals Report', note: 'Every payout requested today, with the approvals recorded.',
      cols: [['Withdrawal', 'id'], ['When', 'when'], ['Customer', 'cust'], ['Method', 'method'], ['Amount', 'amount'], ['Approval', 'approval'], ['Status', 'status']],
      rows: DW_WITHDRAWALS.filter(t => dwIsos(t.when) === TODAY).map(t => ({id: t.id, when: dwWhen(t.when), cust: custName(t.cust), method: t.method, amount: dwM(t.amount), approval: t.approval, status: t.status}))}),
    periodic: () => ({title: 'Weekly and Monthly Summary', note: 'The last seven days, deposits against withdrawals and the limit.',
      cols: [['Day', 'day'], ['Deposits', 'deposits'], ['Withdrawals', 'withdrawals'], ['Net', 'net'], ['Limit', 'limit']],
      rows: DW_DAILY.map(d => ({day: fmtDate(d.day), deposits: dwM(d.deposits), withdrawals: dwM(d.withdrawals), net: dwM(d.deposits - d.withdrawals), limit: dwM(d.limit)}))}),
    depositMethod: () => ({title: 'Deposits by Payment Method', note: 'Volume, value and fees for each rail.',
      cols: [['Method', 'method'], ['Deposits', 'count'], ['Value', 'value'], ['Fees', 'fees'], ['Failed', 'failed']],
      rows: DW_METHODS.map(m => { const rows = DW_DEPOSITS.filter(t => t.method === m.method && inWindow(t));
        return {method: m.method, count: rows.length, value: dwM(sum(rows.filter(t => t.status === 'Completed'), t => t.amount)),
          fees: dwM(sum(rows.filter(t => t.status === 'Completed'), t => t.fee)), failed: rows.filter(t => t.status === 'Failed').length}; })}),
    withdrawalMethod: () => ({title: 'Withdrawals by Payment Method', note: 'Payouts and failures for each rail.',
      cols: [['Method', 'method'], ['Payouts', 'count'], ['Value', 'value'], ['Fees', 'fees'], ['Failed', 'failed']],
      rows: DW_METHODS.filter(m => m.method !== 'Card gateway').map(m => { const rows = DW_WITHDRAWALS.filter(t => t.method === m.method && inWindow(t));
        return {method: m.method, count: rows.length, value: dwM(sum(rows.filter(t => t.status === 'Completed'), t => t.amount)),
          fees: dwM(sum(rows.filter(t => t.status === 'Completed'), t => t.fee)), failed: rows.filter(t => t.status === 'Failed').length}; })}),
    depositCustomer: () => ({title: 'Deposits by Customer', note: 'Who is putting money in, and how often.',
      cols: [['Customer', 'cust'], ['Deposits', 'count'], ['Value', 'value'], ['Last deposit', 'last']],
      rows: CUSTOMERS.slice(0, 24).map(c => { const rows = DW_DEPOSITS.filter(t => t.cust === c.id && t.status === 'Completed');
        return {cust: c.name, count: rows.length, value: dwM(sum(rows, t => t.amount)), last: rows.length ? dwWhen(rows[0].when) : '—'}; })}),
    withdrawalCustomer: () => ({title: 'Withdrawals by Customer', note: 'Who is taking money out, against their limit.',
      cols: [['Customer', 'cust'], ['Payouts', 'count'], ['Value', 'value'], ['Daily ceiling', 'limit']],
      rows: CUSTOMERS.slice(0, 24).map(c => { const rows = DW_WITHDRAWALS.filter(t => t.cust === c.id && t.status === 'Completed');
        return {cust: c.name, count: rows.length, value: dwM(sum(rows, t => t.amount)), limit: dwM(DW_SET.perCustomerDailyLimit)}; })}),
    pending: () => ({title: 'Pending Transactions Report', note: 'Everything waiting on a confirmation or an approval.',
      cols: [['Transaction', 'id'], ['Type', 'type'], ['Customer', 'cust'], ['Amount', 'amount'], ['Waiting for', 'stage']],
      rows: DW_TXN.filter(t => (t.status === 'Pending' || t.status === 'Processing') && inWindow(t))
        .map(t => ({id: t.id, type: t.type, cust: custName(t.cust), amount: dwM(t.amount), stage: t.stage}))}),
    failed: () => ({title: 'Failed Transactions Report', note: 'Failed, rejected and cancelled transactions with the reason.',
      cols: [['Transaction', 'id'], ['Type', 'type'], ['Customer', 'cust'], ['Amount', 'amount'], ['Reason', 'stage'], ['Status', 'status']],
      rows: DW_TXN.filter(t => ['Failed', 'Rejected', 'Cancelled'].includes(t.status) && inWindow(t))
        .map(t => ({id: t.id, type: t.type, cust: custName(t.cust), amount: dwM(t.amount), stage: t.stage, status: t.status}))}),
    reconciliation: () => ({title: 'Reconciliation Report', note: 'The ledger against the account balance, account by account.',
      cols: [['Account', 'account'], ['Customer', 'cust'], ['Available', 'available'], ['Reserved', 'reserved'], ['Ledger', 'ledger'], ['Agrees', 'agrees']],
      rows: DW_ACCOUNTS.map(a => { const disc = DW_DISCREPANCY.find(d => d.account === a.id);
        return {account: a.id, cust: custName(a.cust), available: dwM(a.available), reserved: dwM(a.reserved),
          ledger: dwM(a.ledger), agrees: disc ? 'No — ' + dwM(Math.abs(disc.difference)) + ' out' : 'Yes'}; })}),
    fees: () => ({title: 'Transaction Fees Report', note: 'Deposit and withdrawal fees collected, and who paid.',
      cols: [['Method', 'method'], ['Deposit fees', 'deposit'], ['Withdrawal fees', 'withdrawal'], ['Payer', 'payer'], ['Total', 'total']],
      rows: DW_FEES.map(f => {
        const dep = sum(DW_DEPOSITS.filter(t => t.method === f.method && t.status === 'Completed'), t => t.fee);
        const wdr = sum(DW_WITHDRAWALS.filter(t => t.method === f.method && t.status === 'Completed'), t => t.fee);
        return {method: f.method, deposit: dwM(dep), withdrawal: dwM(wdr), payer: f.payer, total: dwM(dep + wdr)}; })}),
    authorised: () => ({title: 'Authorised Transaction Report', note: 'Every approval, who gave it and when.',
      cols: [['When', 'when'], ['Reference', 'ref'], ['Level', 'level'], ['Decision', 'action'], ['Officer', 'by'], ['Notes', 'notes']],
      rows: DW_APPROVAL_HISTORY.map(a => ({when: dwWhen(a.when), ref: a.ref, level: a.level, action: a.action,
        by: staffName(a.by), notes: a.notes}))})
  };
  const out = (R[key] || R.dailyDeposits)();
  out.key = key;
  return out;
}
function renderReports(){
  if(el('repPill')){
    el('repPill').className = 'badge b-gray';
    el('repPill').textContent = DW_REPORTS.length + ' reports';
  }
  put('repKpis', [
    ['Reports available', num(DW_REPORTS.length), 'Every deposit and payout question', ''],
    ['Exports made', num(EXPORTS.length), 'Recorded in the history', ''],
    ['Formats', '4', 'Preview · CSV · Excel · PDF', ''],
    ['Rows in the daily report', num(dwReport('dailyDeposits').rows.length), 'Built from the live register', ''],
    ['Rows in the reconciliation', num(dwReport('reconciliation').rows.length), 'Every customer account', ''],
    ['Report window', fmtDate(FILTER.from) + ' – ' + fmtDate(FILTER.to), 'Follows the filter bar', '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join(''));
  if(el('packMsg') && !el('packMsg').textContent)
    el('packMsg').textContent = 'The pack follows the filters above — ' + filterLine() + '.';
  if(el('repCount')) el('repCount').textContent = DW_REPORTS.length + ' ready';
  put('repCards', DW_REPORTS.map(r => `<div class="repcard">
      <div class="rt">${esc(r.title)}</div>
      <div class="rd">${esc(r.desc)}</div>
      <div class="acts">
        <button class="btn btn-ghost" data-dwrep="${esc(r.key)}" data-fmt="preview">Preview</button>
        <button class="btn btn-ghost" data-dwrep="${esc(r.key)}" data-fmt="csv">CSV</button>
        <button class="btn btn-ghost" data-dwrep="${esc(r.key)}" data-fmt="xlsx">Excel</button>
        <button class="btn btn-ghost" data-dwrep="${esc(r.key)}" data-fmt="pdf">PDF</button>
      </div></div>`).join(''));

  put('repGrid',
    chartBox({title: 'Money in against money out', sub: 'The last seven days, MWK', type: 'bar', h: 200,
      cats: DW_DAILY.map(d => d.label),
      series: [{name: 'Deposits', data: DW_DAILY.map(d => d.deposits), colour: '#0E9AA7'},
        {name: 'Withdrawals', data: DW_DAILY.map(d => d.withdrawals), colour: '#C9A227'}],
      value: compact(dwS().net)}) +
    chartBox({title: 'Deposit mix', sub: 'Value by method', type: 'donut', h: 200,
      cats: DW_METHODS.map(m => m.method),
      series: [{name: 'Deposits', data: DW_METHODS.map(m => sum(DW_DEPOSITS.filter(t => t.method === m.method && t.status === 'Completed'), t => t.amount))}],
      value: compact(dwS().totalDeposits)}));
  renderExportHistory();
}
function runReport(key, fmt){
  const d = dwReport(key);
  const labels = d.cols.map(c => c[0]);
  const rows = d.rows.map(r => d.cols.map(c => r[c[1]]));
  if(fmt === 'preview'){
    openModal(d.title, d.rows.length + ' rows · ' + filterLine(),
      `<div class="note gold"><div>${esc(d.note)}</div></div>
       <div class="tblwrap" style="max-height:340px;margin-top:8px"><table class="tbl2 dense">
         <thead><tr>${labels.map(l => `<th>${esc(l)}</th>`).join('')}</tr></thead>
         <tbody>${rows.slice(0, 25).map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')
           || `<tr><td colspan="${labels.length}" class="empty">Nothing in this report for the current filters.</td></tr>`}</tbody>
       </table></div>`,
      [{label: 'Download CSV', act: () => runReport(key, 'csv')},
       {label: 'Download Excel', act: () => runReport(key, 'xlsx')},
       {label: 'Close', act: 'close'}]);
    return;
  }
  const stamp = TODAY.replace(/-/g, '');
  const name = 'deposits-' + key + '-report-' + stamp;
  if(fmt === 'csv'){
    downloadFile(name + '.csv', 'text/csv', toCsv([labels].concat(rows)));
  } else if(fmt === 'xlsx'){
    downloadFile(name + '.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      xlsxBytes(d.title, labels, rows));
  } else {
    printTable(d.title, d.cols.map(c => ({label: c[0], num: /amount|value|fee|total/i.test(c[1])})), rows);
  }
  logExport(d.title, fmt === 'csv' ? 'CSV' : fmt === 'xlsx' ? 'Excel' : 'PDF', rows.length);
  renderExportHistory(); renderReports(); renderSettings();
  toast(d.title + ' generated');
}
function runPack(fmt){
  const all = DW_REPORTS.map(r => dwReport(r.key));
  const stamp = TODAY.replace(/-/g, '');
  const total = sum(all, d => d.rows.length);
  if(fmt === 'csv'){
    const parts = [];
    all.forEach(d => {
      parts.push(d.title.toUpperCase());
      parts.push(d.cols.map(c => c[0]).join(','));
      d.rows.forEach(r => parts.push(d.cols.map(c => csvCell(r[c[1]])).join(',')));
      parts.push('');
    });
    downloadFile('deposits-pack-' + stamp + '.csv', 'text/csv', parts.join('\r\n'));
    logExport('Deposits and withdrawals pack', 'CSV', total);
  } else if(fmt === 'xlsx'){
    const rows = [];
    all.forEach(d => {
      rows.push([d.title]);
      rows.push(d.cols.map(c => c[0]));
      d.rows.forEach(r => rows.push(d.cols.map(c => r[c[1]])));
      rows.push([]);
    });
    downloadFile('deposits-pack-' + stamp + '.xlsx',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      xlsxBytes('Deposits pack', ['Column 1', 'Column 2', 'Column 3', 'Column 4', 'Column 5', 'Column 6'],
        rows.map(r => r.length ? r : [''])));
    logExport('Deposits and withdrawals pack', 'Excel', total);
  } else {
    doPrint('Deposits and withdrawals pack', all.map(d => printTable(d.title,
      d.cols.map(c => ({label: c[0]})), d.rows.map(r => d.cols.map(c => r[c[1]]))))
      .join('<div style="height:10px"></div>'));
    logExport('Deposits and withdrawals pack', 'PDF', total);
    if(fmt === 'print') return;
  }
  if(el('packMsg')) el('packMsg').textContent = 'Pack generated at ' + new Date().toTimeString().slice(0, 5) +
    ' — ' + all.length + ' reports, ' + total + ' rows · ' + filterLine();
  renderReports();
  toast('Deposits pack generated');
}

/* ===================== 18 · SETTINGS AND AUDIT ===================== */
function dwValidateSettings(){
  const out = [];
  const add = (label, ok, detail) => out.push({label, ok, detail});
  add('Currency matches the ledger', DW_SET.currency === 'MWK', DW_SET.currency + ' · ' + DW_SET.currencyLabel);
  add('Minimum deposit below the maximum', DW_SET.minDeposit < DW_SET.maxDeposit,
    dwM(DW_SET.minDeposit) + ' < ' + dwM(DW_SET.maxDeposit));
  add('Minimum withdrawal below the maximum', DW_SET.minWithdrawal < DW_SET.maxWithdrawal,
    dwM(DW_SET.minWithdrawal) + ' < ' + dwM(DW_SET.maxWithdrawal));
  add('Daily limit above the per-customer limit', DW_SET.dailyWithdrawalLimit >= DW_SET.perCustomerDailyLimit,
    dwM(DW_SET.dailyWithdrawalLimit) + ' ≥ ' + dwM(DW_SET.perCustomerDailyLimit));
  add('First approval below the second', DW_SET.approvalThreshold < DW_SET.secondApprovalThreshold,
    dwM(DW_SET.approvalThreshold) + ' < ' + dwM(DW_SET.secondApprovalThreshold));
  add('Receipt digits in range', DW_SET.receiptDigits >= 3 && DW_SET.receiptDigits <= 8,
    DW_SET.receiptPrefix + ' · ' + DW_SET.receiptDigits + ' digits');
  add('Duplicate window covers a slow callback', DW_SET.duplicateWindow >= 5, DW_SET.duplicateWindow + ' minutes');
  add('Identity required for withdrawals', DW_SET.requireIdentityForWithdrawal, DW_SET.requireIdentityForWithdrawal ? 'on' : 'off');
  add('Production is not in sandbox', !DW_SET.sandbox, DW_SET.sandbox ? 'sandbox mode is on' : 'production');
  add('Deposit rule names the reference', /reference/i.test(DW_SET.depositRule), DW_SET.depositRule);
  return out;
}
function renderSettings(){
  const s = dwS();
  if(el('setPill')){
    el('setPill').className = 'badge b-gray';
    el('setPill').textContent = DW_SET.sandbox ? 'Sandbox mode' : 'Production';
  }
  const bad = dwValidateSettings().filter(c => !c.ok);
  put('setKpis', [
    ['Currency', DW_SET.currency, DW_SET.currencyLabel, ''],
    ['Deposit range', compact(DW_SET.minDeposit) + ' – ' + compact(DW_SET.maxDeposit), 'Every rail', ''],
    ['Withdrawal range', compact(DW_SET.minWithdrawal) + ' – ' + compact(DW_SET.maxWithdrawal), 'Every rail', ''],
    ['Approvals', 'Two above ' + compact(DW_SET.secondApprovalThreshold), 'First level above ' + compact(DW_SET.approvalThreshold), ''],
    ['Duplicate window', DW_SET.duplicateWindow + ' min', 'Provider reference and amount', ''],
    ['Automatic verification', DW_SET.autoVerifyDeposits ? 'On' : 'Off', DW_SET.depositRule.slice(0, 62) + '…', ''],
    ['Small withdrawals', DW_SET.autoApproveSmallWithdrawals ? 'Auto-approved' : 'Manually approved', DW_SET.withdrawalRule, ''],
    ['Environment', DW_SET.sandbox ? 'Sandbox' : 'Production', DW_SET.sandbox ? 'No real money moves' : 'Live with real customers', DW_SET.sandbox ? 'red' : ''],
    ['Checks failing', num(bad.length), bad.length ? bad.map(b => b.label).join(' · ') : 'Every value in range', bad.length ? 'red' : ''],
    ['Settings changes on record', num(DW_CHANGES.length), 'With the officer and the timestamp', '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join(''));
  if(el('setMsg') && !el('setMsg').textContent)
    el('setMsg').textContent = 'Values in force since ' + (DW_CHANGES[0] ? dwIsos(DW_CHANGES[0].when) : TODAY) +
      ' · ' + bad.length + ' check(s) failing.';
  const set = (id, v) => { if(el(id)) el(id).value = v; };
  set('setCcy', DW_SET.currency);
  set('setDec', DW_SET.decimals);
  set('setDepPrefix', DW_SET.depositPrefix);
  set('setWdrPrefix', DW_SET.withdrawalPrefix);
  set('setRcPrefix', DW_SET.receiptPrefix);
  set('setRcDigits', DW_SET.receiptDigits);
  set('setMinDep', DW_SET.minDeposit);
  set('setMaxDep', DW_SET.maxDeposit);
  set('setMinWdr', DW_SET.minWithdrawal);
  set('setMaxWdr', DW_SET.maxWithdrawal);
  set('setDailyDep', DW_SET.dailyDepositLimit);
  set('setDailyWdr', DW_SET.dailyWithdrawalLimit);
  set('setPerCust', DW_SET.perCustomerDailyLimit);
  set('setDup', DW_SET.duplicateWindow);
  set('setAppr1', DW_SET.approvalThreshold);
  set('setAppr2', DW_SET.secondApprovalThreshold);
  set('setDepFeePct', DW_SET.depositFeePct);
  set('setDepFeeFlat', DW_SET.depositFeeFlat);
  set('setWdrFeePct', DW_SET.withdrawalFeePct);
  set('setWdrFeeFlat', DW_SET.withdrawalFeeFlat);
  set('setFeePayer', DW_SET.feePayer);
  set('setDepRule', DW_SET.depositRule);
  set('setWdrRule', DW_SET.withdrawalRule);
  set('setSettlement', DW_SET.settlementWindow);
  document.querySelectorAll('#setToggles [data-set]').forEach(c => c.classList.toggle('on', !!DW_SET[c.dataset.set]));
  renderValidation();
  renderChanges();
  renderAuditTable();
}
function renderValidation(){
  const checks = dwValidateSettings();
  const bad = checks.filter(c => !c.ok);
  if(el('setValPill')){
    el('setValPill').className = 'badge ' + (bad.length ? 'b-warn' : 'b-ok');
    el('setValPill').textContent = bad.length ? bad.length + ' to fix' : 'All valid';
  }
  put('cfgValBox', checks.map(c => `<div class="checkrow">
      <div class="ck ${c.ok ? 'pass' : 'crit'}">${c.ok ? '✓' : '!'}</div>
      <div style="flex:1"><div style="font-size:10.5px;font-weight:800">${esc(c.label)}</div>
        <div class="qhint">${esc(c.detail)}</div></div>
      <div>${okb(c.ok ? 'Pass' : 'Failed')}</div></div>`).join(''));
  return bad;
}
function renderChanges(){
  if(el('chgPill')) el('chgPill').textContent = DW_CHANGES.length + ' entries';
  renderTable('chgBody', [
    {k: 'when', label: 'Timestamp', html: v => esc(dwWhen(v))},
    {k: 'what', label: 'Change'},
    {k: 'area', label: 'Area'},
    {k: 'from', label: 'Previous'},
    {k: 'to', label: 'Updated'},
    {k: 'by', label: 'Responsible', html: v => esc(staffName(v))}
  ], DW_CHANGES.filter(dwPass), {sort: 'when', pageSize: 8, onRow: false});

  const byStaff = {};
  DW_CHANGES.forEach(c => { byStaff[c.by] = (byStaff[c.by] || 0) + 1; });
  if(el('whoPill')) el('whoPill').textContent = Object.keys(byStaff).length + ' officers';
  put('whoBox', Object.keys(byStaff).sort((a, b) => byStaff[b] - byStaff[a]).slice(0, 6)
    .map(id => meter(staffName(id), byStaff[id], byStaff[id] + ' change' + (byStaff[id] === 1 ? '' : 's'),
      Math.max(3, DW_CHANGES.length))).join(''));
  const last = DW_CHANGES[0] || {when: TODAY, what: 'No change yet', by: 'STF-001', area: '—'};
  put('stampBox', kvRow('Latest change', esc(last.what)) + kvRow('When', esc(last.when))
    + kvRow('Officer', esc(staffName(last.by))) + kvRow('Changes on record', num(DW_CHANGES.length))
    + kvRow('Areas touched', num(new Set(DW_CHANGES.map(c => c.area)).size)));
}
function renderAuditTable(){
  if(el('auPill')) el('auPill').textContent = num(DW_AUDIT.length) + ' entries';
  const rows = DW_AUDIT.concat(DW_VERIFY_HISTORY.map(v => ({when: v.when, action: v.action, target: v.ref,
    detail: v.notes, by: v.by}))).concat(DW_APPROVAL_HISTORY.map(a => ({when: a.when, action: a.action,
    target: a.ref, detail: a.level + ' · ' + a.notes, by: a.by})));
  renderTable('auBody', [
    {k: 'when', label: 'When', html: v => esc(dwWhen(v))},
    {k: 'action', label: 'Action', html: v => okb(v)},
    {k: 'target', label: 'Target'},
    {k: 'detail', label: 'Detail'},
    {k: 'by', label: 'Officer', html: v => esc(staffName(v))}
  ], rows, {sort: 'when', pageSize: 10, onRow: false});
}

/* ===================== actions ===================== */
function recordDeposit(){
  const amount = Number(el('dNewAmount').value) || 0;
  const acc = DW_ACC_BY_ID[el('dNewAcct').value] || DW_ACCOUNTS[0];
  const method = el('dNewMethod').value;
  if(amount < DW_SET.minDeposit){ el('dMsg').textContent = 'The minimum deposit is ' + dwM(DW_SET.minDeposit) + '.'; toast('Deposit refused — below the minimum', 'warn'); return; }
  if(amount > DW_SET.maxDeposit){ el('dMsg').textContent = 'The maximum deposit is ' + dwM(DW_SET.maxDeposit) + '.'; toast('Deposit refused — above the maximum', 'warn'); return; }
  if(acc.status === 'Suspended'){ el('dMsg').textContent = 'Account ' + acc.id + ' is suspended — nothing can be posted to it.'; toast('Account suspended', 'err'); return; }
  const when = (el('dNewWhen').value || TODAY + 'T08:30').replace('T', ' ');
  const loan = el('dNewLoan').value || '';
  const fee = Math.round(amount * DW_SET.depositFeePct / 100) + DW_SET.depositFeeFlat;
  const id = DW_SET.depositPrefix + '-' + pad(5101 + DW_DEPOSITS.length, 6);
  const t = {id, type: 'Deposit', when, cust: acc.cust, account: acc.id, loan, method,
    provider: (DW_METHODS.find(m => m.method === method) || {}).provider || method,
    ref: (DW_METHODS.find(m => m.method === method) || {refPrefix: 'MM'}).refPrefix + '-' + pad(ri(100000, 999999), 6),
    amount, fee, currency: DW_SET.currency, status: DW_SET.autoVerifyDeposits ? 'Completed' : 'Pending',
    stage: DW_SET.autoVerifyDeposits ? 'Posted to the ledger' : 'Awaiting confirmation',
    source: el('dNewSource').value === 'Staff-recorded' ? 'Staff' : 'Customer', officer: 'STF-001',
    proof: (el('dNewProof') && el('dNewProof').value) ? el('dNewProof').value.split('\\').pop() : '',
    destination: '', identity: 'N/A', approval: 'Not required',
    notes: el('dNewNotes').value || '', lane: 'Deposits',
    severity: DW_SET.autoVerifyDeposits ? 'Low' : 'Medium', owner: 'STF-001', region: acc.region};
  DW_TXN.unshift(t); DW_DEPOSITS.unshift(t);
  if(t.status === 'Completed'){
    acc.available += amount; acc.ledger += amount; acc.deposits = (acc.deposits || 0) + amount;
    acc.lastMove = dwIsos(when);
    DW_LEDGER.unshift({entry: 'LED-' + pad(7100 + DW_LEDGER.length, 5), when, account: acc.id, cust: acc.cust,
      txn: id, kind: 'Credit', amount, balance: acc.ledger, source: method, status: 'Posted',
      lane: 'Ledger', severity: 'Low', owner: 'STF-001', region: acc.region});
    DW_RECEIPTS.unshift({receipt: DW_SET.receiptPrefix + '-' + pad(2100 + DW_RECEIPTS.length, DW_SET.receiptDigits),
      txn: id, ref: t.ref, when, cust: acc.cust, account: acc.id, type: 'Deposit', amount, fee, method,
      issued: 'Automatic', status: 'Issued', lane: 'Receipts', severity: 'Low', owner: 'STF-001', region: acc.region});
  } else {
    DW_VERIFY.push({id: 'DVR-' + pad(410 + DW_VERIFY.length, 3), txn: id, ref: t.ref, when, cust: acc.cust,
      account: acc.id, method, amount, expected: amount, providerRef: t.ref, proof: t.proof || 'No proof uploaded',
      checks: {reference: true, amount: true, method: true, proof: !!t.proof, provider: false, duplicate: false},
      status: 'Pending', notes: '', lane: 'Deposits', severity: 'Medium', owner: 'STF-001', region: acc.region});
  }
  dwAudit(t.status === 'Completed' ? 'Recorded' : 'Pending', id, dwM(amount) + ' · ' + method + ' · ' + custName(acc.cust));
  dwLogChange('Deposits', 'New deposit recorded', '—', id + ' · ' + dwM(amount));
  renderAll(); renderFilterSummary();
  el('dMsg').textContent = id + ' recorded for ' + custName(acc.cust) + ' — ' + dwM(amount) + ' via ' + method +
    (t.status === 'Completed' ? ', posted to the ledger and receipted.' : ', waiting in the verification queue.');
  el('dNewRef').value = DW_SET.depositPrefix + '-' + pad(5101 + DW_DEPOSITS.length, 6);
  toast('Deposit ' + id + ' recorded');
}
function clearDepositForm(){
  el('dNewAmount').value = 150000; el('dNewNotes').value = ''; el('dNewProof').value = '';
  el('dNewWhen').value = TODAY + 'T08:30';
  el('dMsg').textContent = 'Form cleared.';
  toast('Deposit form cleared', 'info');
}
function submitWithdrawal(){
  const chk = dwWithdrawalCheck();
  if(!chk.pass){
    el('wMsg').textContent = 'The request was held: ' + chk.checks.filter(c => !c[1]).map(c => c[0]).join(' · ');
    toast('Withdrawal held — ' + chk.checks.filter(c => !c[1]).length + ' check(s) failing', 'warn');
    return;
  }
  const acc = chk.acc;
  const id = DW_SET.withdrawalPrefix + '-' + pad(7101 + DW_WITHDRAWALS.length, 6);
  const when = TODAY + ' ' + new Date().toTimeString().slice(0, 5);
  const method = chk.method;
  const need = chk.amount > DW_SET.secondApprovalThreshold ? 'Two approvals'
    : chk.amount > DW_SET.approvalThreshold ? 'First level' : 'Not required';
  const t = {id, type: 'Withdrawal', when, cust: acc.cust, account: acc.id, loan: '', method,
    provider: (DW_METHODS.find(m => m.method === method) || {}).provider || method,
    ref: (DW_METHODS.find(m => m.method === method) || {refPrefix: 'MM'}).refPrefix + '-' + pad(ri(100000, 999999), 6),
    amount: chk.amount, fee: chk.fee, currency: DW_SET.currency, status: 'Pending',
    stage: 'Awaiting approval', source: el('wReqSource').value === 'Customer' ? 'Customer' : 'Staff',
    officer: 'STF-001', proof: '', destination: el('wReqDest').value || 'Not supplied',
    identity: 'Verified', approval: need, notes: '', lane: 'Withdrawals', severity: 'Medium',
    owner: 'STF-001', region: acc.region};
  DW_TXN.unshift(t); DW_WITHDRAWALS.unshift(t);
  acc.reserved += chk.amount;
  acc.available = Math.max(0, acc.available - chk.amount);
  acc.lastMove = TODAY;
  DW_APPROVALS.unshift({id: 'APR-' + pad(310 + DW_APPROVALS.length, 3), txn: id, ref: t.ref, when, cust: acc.cust,
    account: acc.id, amount: chk.amount, fee: chk.fee, method, destination: t.destination,
    level: chk.amount > DW_SET.secondApprovalThreshold ? 'Management' : 'First level',
    level1: 'Pending', level2: 'Pending', identity: 'Verified', balance: acc.available + chk.amount,
    risk: chk.amount > DW_SET.approvalThreshold ? 'Medium' : 'Low', status: 'Pending', notes: '',
    lane: 'Withdrawals', severity: 'Medium', owner: 'STF-001', region: acc.region});
  dwAudit('Requested', id, dwM(chk.amount) + ' · ' + method + ' · ' + custName(acc.cust));
  dwLogChange('Withdrawals', 'Withdrawal requested', '—', id + ' · ' + dwM(chk.amount));
  renderAll(); renderFilterSummary();
  el('wMsg').textContent = id + ' submitted for ' + custName(acc.cust) + ' — ' + dwM(chk.amount) +
    ', route: ' + need + '. The amount is reserved until it is released.';
  toast('Withdrawal ' + id + ' submitted');
}
function verifyIdentity(){
  const type = el('wReqIdType').value, num2 = el('wReqIdNum').value.trim();
  if(!num2){ el('wMsg').textContent = 'Enter the identity number first.'; toast('Identity number missing', 'warn'); return; }
  DW_ID_CHECKS.unshift({ref: 'WDR-PENDING', cust: CUSTOMERS[0].id, doc: type, number: num2,
    checked: /^[A-Za-z0-9]{6,}$/.test(num2) ? 'Verified' : 'Pending', by: 'STF-001', when: TODAY + ' 08:20'});
  dwAudit('Identity', num2, type + ' checked for the new request');
  renderAll();
  el('wMsg').textContent = /^[A-Za-z0-9]{6,}$/.test(num2)
    ? type + ' ' + num2 + ' verified against the customer record.'
    : type + ' ' + num2 + ' could not be verified — check the number.';
  toast('Identity ' + (num2.length >= 6 ? 'verified' : 'not verified'), num2.length >= 6 ? 'ok' : 'warn');
}
function dvAction(which, id){
  const rec = DW_VERIFY.find(v => v.id === id);
  if(!rec){ toast('That deposit is no longer in the queue', 'warn'); return; }
  const t = DW_TXN.find(x => x.id === rec.txn);
  const note = (el('dvNote') && el('dvNote').value.trim()) || (which === 'approve'
    ? 'Reference, amount and provider confirmation all agreed' : 'Rejected after review');
  if(which === 'approve'){
    if(!rec.checks.amount || !rec.checks.provider || !rec.checks.duplicate){
      toast('This deposit fails a check — it cannot be approved as it stands', 'err'); return;
    }
    rec.status = 'Approved';
    if(t){
      t.status = 'Completed'; t.stage = 'Posted to the ledger';
      const acc = DW_ACC_BY_ID[t.account];
      if(acc){
        acc.available += t.amount; acc.ledger += t.amount; acc.deposits = (acc.deposits || 0) + t.amount;
        acc.lastMove = TODAY;
        DW_LEDGER.unshift({entry: 'LED-' + pad(7100 + DW_LEDGER.length, 5), when: TODAY + ' 08:18',
          account: acc.id, cust: acc.cust, txn: t.id, kind: 'Credit', amount: t.amount, balance: acc.ledger,
          source: t.method, status: 'Posted', lane: 'Ledger', severity: 'Low', owner: 'STF-001', region: acc.region});
      }
    }
  } else {
    rec.status = 'Rejected';
    if(t){ t.status = 'Rejected'; t.stage = 'Refused by an officer'; }
  }
  DW_VERIFY_HISTORY.unshift({when: TODAY + ' 08:18', ref: rec.ref, action: which === 'approve' ? 'Approved' : 'Rejected',
    by: 'STF-001', notes: note});
  const i = DW_VERIFY.indexOf(rec);
  if(which !== 'approve' || rec.status === 'Approved') DW_VERIFY.splice(i, 1);
  dwAudit(which === 'approve' ? 'Approved' : 'Rejected', rec.txn, note);
  DW_SEL.verify = (DW_VERIFY[0] || {}).id || '';
  renderAll(); renderFilterSummary();
  el('dvMsg').textContent = rec.txn + ' ' + (which === 'approve' ? 'verified and posted to the ledger.' : 'rejected — the customer will be told.');
  toast(rec.txn + ' ' + (which === 'approve' ? 'approved' : 'rejected'));
}
function approveAllPassing(){
  const ready = DW_VERIFY.filter(v => Object.values(v.checks).every(Boolean));
  if(!ready.length){ el('dvMsg').textContent = 'Nothing passes every check yet — look at the failing rows first.'; toast('Nothing ready to approve', 'warn'); return; }
  ready.forEach(v => dvAction('approve', v.id));
  el('dvMsg').textContent = ready.length + ' deposit(s) approved and posted to the ledger.';
  toast(ready.length + ' deposits approved');
}
function autoVerifyDeposits(){
  let fixed = 0;
  DW_VERIFY.forEach(v => {
    if(!v.checks.provider){ v.checks.provider = true; fixed++; }
    if(!v.checks.duplicate && !DW_DUPES.some(d => d.ref === v.ref)){ v.checks.duplicate = true; fixed++; }
  });
  dwAudit('Automatic verification', 'Deposit queue', fixed + ' check(s) confirmed against the provider');
  renderAll();
  el('dvMsg').textContent = fixed ? fixed + ' check(s) confirmed against the provider lines.' : 'Every check was already confirmed.';
  toast('Automatic verification run');
}
function waApprove(level){
  const rec = DW_APPROVALS.find(a => a.id === DW_SEL.approve) || DW_APPROVALS[0];
  if(!rec){ toast('Nothing in the approval queue', 'warn'); return; }
  const note = (el('waNote') && el('waNote').value.trim()) || 'Identity checked, balance and limits clear';
  if(rec.identity !== 'Verified'){ el('waMsg').textContent = 'Identity is still pending on ' + rec.txn + ' — it cannot be released.'; toast('Identity pending', 'err'); return; }
  if(level === 'first'){
    if(rec.level1 === 'Approved'){ el('waMsg').textContent = rec.txn + ' already has first-level approval.'; toast('Already approved at level one', 'info'); return; }
    rec.level1 = 'Approved';
    DW_APPROVAL_HISTORY.unshift({when: TODAY + ' 08:19', ref: rec.ref, action: 'Approved', level: 'First level', by: 'STF-001', notes: note});
    el('waMsg').textContent = rec.txn + ' approved at the first level' + (rec.level === 'Management' ? ' — it now needs management.' : '.');
    toast('First-level approval recorded');
  } else {
    if(rec.level1 !== 'Approved'){ el('waMsg').textContent = 'First-level approval is still missing on ' + rec.txn + '.'; toast('First level still pending', 'warn'); return; }
    rec.level2 = 'Approved'; rec.status = 'Approved';
    DW_APPROVAL_HISTORY.unshift({when: TODAY + ' 08:19', ref: rec.ref, action: 'Approved', level: 'Management', by: 'STF-009', notes: note});
    const t = DW_TXN.find(x => x.id === rec.txn);
    const acc = DW_ACC_BY_ID[rec.account];
    if(t){
      t.status = 'Processing'; t.stage = 'At the provider';
      if(acc){
        acc.reserved = Math.max(0, acc.reserved - t.amount);
        acc.ledger = Math.max(0, acc.ledger - t.amount - t.fee);
        acc.withdrawals = (acc.withdrawals || 0) + t.amount + t.fee;
        DW_LEDGER.unshift({entry: 'LED-' + pad(7100 + DW_LEDGER.length, 5), when: TODAY + ' 08:19',
          account: acc.id, cust: acc.cust, txn: t.id, kind: 'Debit', amount: -(t.amount + t.fee),
          balance: acc.ledger, source: t.method, status: 'Posted', lane: 'Ledger', severity: 'Low',
          owner: 'STF-001', region: acc.region});
      }
    }
    DW_APPROVALS.splice(DW_APPROVALS.indexOf(rec), 1);
    el('waMsg').textContent = rec.txn + ' fully approved — the debit posted and the provider has been asked to pay.';
    toast('Withdrawal released to the provider');
  }
  dwAudit('Approved', rec.txn, level + '-level approval · ' + note);
  renderAll(); renderFilterSummary();
}
function waCancel(){
  const rec = DW_APPROVALS.find(a => a.id === DW_SEL.approve) || DW_APPROVALS[0];
  if(!rec){ toast('Nothing to cancel', 'warn'); return; }
  if(rec.level1 === 'Approved'){ el('waMsg').textContent = rec.txn + ' already has a signature — it can only be rejected, not cancelled.'; toast('Already signed', 'warn'); return; }
  const t = DW_TXN.find(x => x.id === rec.txn);
  const acc = DW_ACC_BY_ID[rec.account];
  if(t){ t.status = 'Cancelled'; t.stage = 'Withdrawn by the customer'; }
  if(acc){ acc.available += t ? t.amount : 0; acc.reserved = Math.max(0, acc.reserved - (t ? t.amount : 0)); }
  DW_APPROVAL_HISTORY.unshift({when: TODAY + ' 08:20', ref: rec.ref, action: 'Rejected', level: 'First level',
    by: 'STF-001', notes: (el('waNote') && el('waNote').value.trim()) || 'Cancelled at the customer request'});
  DW_APPROVALS.splice(DW_APPROVALS.indexOf(rec), 1);
  dwAudit('Cancelled', rec.txn, 'Reservation released back to the account');
  renderAll(); renderFilterSummary();
  el('waMsg').textContent = rec.txn + ' cancelled and the reserved funds returned to the account.';
  toast('Withdrawal cancelled');
}
function reconcileAccount(){
  const a = DW_ACCOUNT_BY_SELECT();
  const led = sum(DW_LEDGER.filter(e => e.account === a.id), e => e.amount);
  a.ledger = a.opening + led;
  a.available = Math.max(0, a.ledger - a.reserved);
  const i = DW_DISCREPANCY.findIndex(d => d.account === a.id);
  if(i >= 0) DW_DISCREPANCY.splice(i, 1);
  dwAudit('Reconciled', a.id, 'Ledger ' + dwM(a.ledger) + ' · available ' + dwM(a.available));
  dwLogChange('Balances', 'Account reconciled', 'stored balance', dwM(a.ledger));
  renderAll();
  el('caStmtBox').innerHTML = '<div class="note gold"><div>' + esc(a.id) + ' reconciled at ' +
    new Date().toTimeString().slice(0, 5) + ' — the ledger sum is ' + esc(dwM(a.ledger)) +
    ', available ' + esc(dwM(a.available)) + ', reserved ' + esc(dwM(a.reserved)) + '.</div></div>';
  toast('Account reconciled');
}
function buildStatement(){
  const custId = el('rsStmtCust').value;
  const from = el('rsFrom').value || FILTER.from, to = el('rsTo').value || FILTER.to;
  DW_SEL.stmtCust = custId;
  const rows = DW_TXN.filter(t => t.cust === custId && dwIsos(t.when) >= from && dwIsos(t.when) <= to)
    .sort((a, b) => String(b.when).localeCompare(String(a.when)));
  const acc = DW_ACC_BY_CUST[custId] || {id: '—', available: 0, reserved: 0, ledger: 0};
  if(el('rsStmtPill')) el('rsStmtPill').textContent = rows.length + ' rows';
  put('rsStmtBox', `<div class="minihead">Statement · ${esc(custName(custId))} · ${fmtDate(from)} – ${fmtDate(to)}</div>`
    + `<div class="strip">${[['Opening balance', dwM(acc.opening || 0)], ['Account', acc.id],
        ['Deposits in range', dwM(sum(rows.filter(t => t.type === 'Deposit' && t.status === 'Completed'), t => t.amount))],
        ['Withdrawals in range', dwM(sum(rows.filter(t => t.type === 'Withdrawal' && t.status === 'Completed'), t => t.amount))],
        ['Available now', dwM(acc.available)], ['Reserved now', dwM(acc.reserved)]]
      .map(([k, v]) => `<div><div class="sl">${esc(k)}</div><div class="sv">${esc(v)}</div></div>`).join('')}</div>`
    + (rows.length ? rows.map(t => kvRow(t.id + ' · ' + t.type + ' · ' + dwWhen(t.when),
        dwM(t.amount) + ' · ' + okb(t.status))).join('')
      : '<div class="empty">No movement in that range.</div>')
    + `<div class="form-actions">
        <button class="btn btn-ghost" data-stmtprint="${esc(custId)}">Print the statement</button>
        <button class="btn btn-ghost" data-stmtcsv="${esc(custId)}">Download CSV</button>
      </div>`);
  logExport('Customer transaction statement', 'Preview', rows.length);
  renderReports();
  toast('Statement built for ' + custName(custId));
}
function printStatement(custId){
  const rows = DW_TXN.filter(t => t.cust === custId).slice(0, 40);
  doPrint('Statement · ' + custName(custId), brandHtml('Customer statement', 'Deposits and withdrawals') +
    printTable('Movement', [{label: 'Transaction'}, {label: 'When'}, {label: 'Type'}, {label: 'Amount'}, {label: 'Status'}],
      rows.map(t => [t.id, dwWhen(t.when), t.type, dwM(t.amount), t.status])));
  logExport('Customer transaction statement', 'PDF', rows.length);
  renderReports();
}
function downloadStatement(custId){
  const rows = DW_TXN.filter(t => t.cust === custId);
  downloadFile('statement-' + custId + '-' + TODAY.replace(/-/g, '') + '.csv', 'text/csv',
    toCsv([['Transaction', 'When', 'Type', 'Method', 'Amount', 'Fee', 'Status']]
      .concat(rows.map(t => [t.id, dwWhen(t.when), t.type, t.method, t.amount, t.fee, t.status]))));
  logExport('Customer transaction statement', 'CSV', rows.length);
  renderReports();
  toast('Statement downloaded');
}
function updateLoanBalance(){
  const lo = LOANS.find(l => l.ref === el('laLoanSel').value);
  if(!lo){ toast('Pick a loan first', 'warn'); return; }
  const applied = sum(DW_DEPOSITS.filter(t => t.loan === lo.ref && t.status !== 'Rejected' && t.status !== 'Failed'), t => t.amount);
  lo.outstanding = Math.max(0, lo.amount - (lo.paidPrincipal || 0) - Math.min(applied, lo.amount));
  dwAudit('Balance update', lo.ref, 'Deposits applied ' + dwM(applied) + ' · outstanding ' + dwM(lo.outstanding));
  renderAll();
  el('laMsg').textContent = lo.ref + ' updated — ' + dwM(applied) + ' of linked deposits applied, outstanding ' + dwM(lo.outstanding) + '.';
  toast('Loan balance and schedule updated');
}
function validateMethodRef(){
  const q = (el('mtRefInput').value || '').trim();
  if(!q){ el('mtRefBox').innerHTML = '<div class="qhint">Type a reference first.</div>'; return; }
  const t = DW_TXN.find(x => x.ref.toLowerCase() === q.toLowerCase()) ||
    DW_TXN.find(x => x.ref.toLowerCase().includes(q.toLowerCase()));
  el('mtRefBox').innerHTML = t
    ? `<div class="note gold"><div><b>${esc(t.ref)}</b> is a real provider reference — ${esc(t.id)} · ${esc(t.method)} ·
        ${esc(dwM(t.amount))} · ${esc(t.status)}.</div></div>` +
      kvRow('Customer', custName(t.cust)) + kvRow('Account', t.account) + kvRow('Stage', t.stage)
    : `<div class="note red"><div><b>${esc(q)}</b> is not on the register. Either the reference was mistyped
        or the provider has not sent the confirmation yet.</div></div>`;
  toast(t ? 'Reference found' : 'Reference not found', t ? 'ok' : 'warn');
}
function setTransactionStatus(){
  const t = DW_TXN.find(x => x.id === DW_SEL.txn) || DW_TXN[0];
  if(!t){ toast('Pick a transaction first', 'warn'); return; }
  const to = el('tpStatusSel').value;
  const from = t.status;
  if(from === to){ toast('It is already ' + to, 'info'); return; }
  t.status = to;
  t.stage = to === 'Completed' ? 'Posted to the ledger' : to === 'Processing' ? 'At the provider'
    : to === 'Failed' ? 'Provider refused' : to === 'Rejected' ? 'Refused by an officer'
    : to === 'Cancelled' ? 'Withdrawn by the customer' : to === 'Reversed' ? 'Reversal posted' : 'Awaiting confirmation';
  if(to === 'Reversed'){
    const acc = DW_ACC_BY_ID[t.account];
    if(acc){
      const delta = t.type === 'Deposit' ? -t.amount : t.amount + t.fee;
      acc.available = Math.max(0, acc.available + delta);
      acc.ledger = Math.max(0, acc.ledger + delta);
      DW_LEDGER.unshift({entry: 'LED-' + pad(7100 + DW_LEDGER.length, 5), when: TODAY + ' 08:21',
        account: acc.id, cust: acc.cust, txn: t.id, kind: delta >= 0 ? 'Credit' : 'Debit', amount: delta,
        balance: acc.ledger, source: t.method, status: 'Reversed', lane: 'Ledger', severity: 'Medium',
        owner: 'STF-001', region: acc.region});
    }
  }
  dwAudit('Status change', t.id, from + ' → ' + to);
  dwLogChange('Processing', 'Transaction status', from, to);
  renderAll(); renderFilterSummary();
  toast(t.id + ' moved from ' + from + ' to ' + to);
}
function tpReceipt(){
  const t = DW_TXN.find(x => x.id === DW_SEL.txn) || DW_TXN[0];
  if(!t){ toast('Pick a transaction first', 'warn'); return; }
  el('tpReceiptBox').innerHTML = receiptHtml(t);
  logExport('Transaction receipt', 'Preview', 1);
  renderReports();
  toast('Receipt ready for ' + t.id);
}
function scanDuplicates(){
  dwAudit('Duplicate scan', 'Deposit register', DW_DUPES.length + ' group(s) held');
  renderAll();
  toast(DW_DUPES.length ? DW_DUPES.length + ' duplicate reference group(s)' : 'No duplicates found', DW_DUPES.length ? 'warn' : 'ok');
}
function recalcBalances(){
  DW_ACCOUNTS.forEach(a => {
    const credits = sum(DW_LEDGER.filter(e => e.account === a.id && e.amount > 0), e => e.amount);
    const debits = sum(DW_LEDGER.filter(e => e.account === a.id && e.amount < 0), e => -e.amount);
    a.ledger = Math.max(0, a.opening + credits - debits);
    a.available = Math.max(0, a.ledger - a.reserved);
  });
  dwAudit('Recalculated', 'Every account', num(DW_ACCOUNTS.length) + ' balances rebuilt from the ledger');
  dwLogChange('Balances', 'Balance recalculation', 'stored figures', 'rebuilt from the ledger');
  renderAll();
  el('blMsg').textContent = 'Every balance recalculated from ' + DW_LEDGER.length + ' ledger entries at ' +
    new Date().toTimeString().slice(0, 5) + '.';
  toast('Balances recalculated');
}
function reconcileLedger(){
  DW_DISCREPANCY.forEach(d => {
    const a = DW_ACC_BY_ID[d.account];
    if(a){ a.ledger = d.ledger; a.available = d.system; }
  });
  DW_DISCREPANCY.length = 0;
  CONST_CHECKS_REFRESH();
  dwAudit('Reconciled', 'Ledger', 'every account matched to the ledger');
  renderAll();
  el('blMsg').textContent = 'The ledger and the account balances agree — no discrepancy remains.';
  toast('Ledger reconciled');
}
function CONST_CHECKS_REFRESH(){
  DW_DB_CHECKS.forEach(c => {
    if(c.check === 'Account balance equals the ledger sum'){ c.value = DW_DISCREPANCY.length + ' account(s) differ'; c.status = DW_DISCREPANCY.length ? 'Fail' : 'Pass'; }
    if(c.check === 'Duplicate provider references'){ c.value = DW_DUPES.length + ' group(s) held'; c.status = DW_DUPES.length ? 'Fail' : 'Pass'; }
    if(c.check === 'Row-level security on the payment tables'){
      const gaps = DW_DB_TABLES.filter(t => t.rls !== 'Enabled').length;
      c.value = gaps ? gaps + ' table without a policy' : 'Every table has a policy';
      c.status = gaps ? 'Fail' : 'Pass';
    }
  });
}
function postAdjustment(){
  const acc = DW_ACC_BY_ID[el('blCorrAcct').value] || DW_ACCOUNTS[0];
  const amount = Number(el('blCorrAmount').value) || 0;
  const reason = el('blCorrReason').value.trim();
  if(!amount || !reason){ el('blMsg').textContent = 'An adjustment needs an amount and a reason.'; toast('Amount and reason required', 'warn'); return; }
  const id = 'ADJ-' + pad(118 + DW_ADJUST.length, 3);
  DW_ADJUST.unshift({id, when: TODAY + ' ' + new Date().toTimeString().slice(0, 5), account: acc.id,
    amount, reason, by: 'STF-001', approver: 'STF-009', status: 'Pending'});
  DW_LEDGER.unshift({entry: 'LED-' + pad(7100 + DW_LEDGER.length, 5), when: TODAY + ' 08:22', account: acc.id,
    cust: acc.cust, txn: id, kind: amount >= 0 ? 'Credit' : 'Debit', amount, balance: acc.ledger + amount,
    source: 'Adjustment', status: 'Posted', lane: 'Ledger', severity: 'Low', owner: 'STF-001', region: acc.region});
  acc.ledger = Math.max(0, acc.ledger + amount);
  acc.available = Math.max(0, acc.ledger - acc.reserved);
  dwAudit('Adjustment', id, dwM(amount) + ' on ' + acc.id + ' · ' + reason);
  dwLogChange('Balances', 'Adjustment posted', '—', id + ' · ' + dwM(amount));
  renderAll();
  el('blMsg').textContent = id + ' posted for ' + dwM(amount) + ' on ' + acc.id + ' — pending the second signature.';
  el('blCorrAmount').value = ''; el('blCorrReason').value = '';
  toast('Adjustment posted');
}
function saveLimits(){
  let n = 0;
  document.querySelectorAll('#lfBody [data-lf]').forEach(inp => {
    const row = DW_LIMITS.find(l => l.method === inp.dataset.m);
    if(!row) return;
    const v = Number(inp.value) || 0;
    if(row[inp.dataset.lf] !== v){ row[inp.dataset.lf] = v; n++; }
  });
  dwAudit('Limits', 'Method ceilings', n + ' value(s) changed');
  dwLogChange('Limits', 'Method ceilings', 'previous values', n + ' updated');
  renderAll();
  if(el('lfMsg')) el('lfMsg').textContent = n ? n + ' ceiling(s) updated at ' + new Date().toTimeString().slice(0, 5) + '.' : 'Nothing changed.';
  toast(n ? n + ' limit(s) saved' : 'Nothing to save');
}
function calculateFee(){
  const type = el('lfCalcType').value;
  const method = el('lfCalcMethod').value;
  const amount = Number(el('lfCalcAmount').value) || 0;
  const fee = dwFeeFor(method, type, amount);
  const f = DW_FEES.find(x => x.method === method) || {};
  put('lfCalcBox', kvRow(type + ' amount', dwM(amount))
    + kvRow('Method', method)
    + kvRow('Fee', dwM(fee))
    + kvRow('Rule', type === 'Deposit' ? (f.depositPct || 0) + '% + ' + dwM(f.depositFlat || 0)
      : (f.withdrawalPct || 0) + '% + ' + dwM(f.withdrawalFlat || 0))
    + kvRow('Paid by', f.payer || 'Customer')
    + kvRow('Customer receives', dwM(type === 'Deposit' ? Math.max(0, amount - fee) : amount))
    + kvRow('Customer is debited', dwM(type === 'Deposit' ? amount : amount + fee)));
  put('lfRuleBox', '<div class="minihead">Every fee rule in force</div>' + DW_FEES.map(x =>
    kvRow(x.method, 'deposit ' + x.depositPct + '% + ' + dwM(x.depositFlat) +
      ' · withdrawal ' + x.withdrawalPct + '% + ' + dwM(x.withdrawalFlat) + ' · ' + x.payer)).join(''));
  toast('Fee calculated');
}
function reversalAction(id){
  const r = DW_REVERSALS.find(x => x.id === id);
  if(!r){ toast('Request not found', 'warn'); return; }
  const t = DW_TXN.find(x => x.id === r.txn);
  if(r.status === 'Pending'){ r.status = 'Approved'; }
  else if(r.status === 'Approved'){
    r.status = 'Posted';
    if(t){ t.status = 'Reversed'; t.stage = 'Reversal posted'; }
    const acc = DW_ACC_BY_ID[(t || {}).account];
    if(acc && t){
      const delta = t.type === 'Deposit' ? -t.amount : t.amount + t.fee;
      acc.available = Math.max(0, acc.available + delta);
      acc.ledger = Math.max(0, acc.ledger + delta);
      DW_LEDGER.unshift({entry: 'LED-' + pad(7100 + DW_LEDGER.length, 5), when: TODAY + ' 08:23', account: acc.id,
        cust: acc.cust, txn: t.id, kind: delta >= 0 ? 'Credit' : 'Debit', amount: delta, balance: acc.ledger,
        source: 'Reversal', status: 'Reversed', lane: 'Ledger', severity: 'Medium', owner: 'STF-001', region: acc.region});
    }
  } else { r.status = 'Rejected'; }
  dwAudit(r.status, r.id, r.reason);
  renderAll();
  el('rrMsg').textContent = r.id + ' is now ' + r.status.toLowerCase() + ' — ' + (r.status === 'Posted'
    ? 'the opposite ledger entry is posted and the customer has been told.' : 'no money has moved yet.');
  toast(r.id + ' ' + r.status.toLowerCase());
}
function verifyReceipt(){
  const q = (el('rsVerifyInput').value || '').trim().toUpperCase();
  if(!q){ el('rsVerifyBox').innerHTML = '<div class="qhint">Type a receipt number first.</div>'; return; }
  const r = DW_RECEIPTS.find(x => x.receipt.toUpperCase() === q) || DW_RECEIPTS.find(x => x.receipt.toUpperCase().includes(q));
  el('rsVerifyBox').innerHTML = r
    ? `<div class="note gold"><div><b>${esc(r.receipt)}</b> is genuine — ${esc(r.txn)} · ${esc(custName(r.cust))} ·
        ${esc(dwM(r.amount))} · ${esc(r.type)} · ${esc(dwWhen(r.when))}.</div></div>` +
      kvRow('Account', r.account) + kvRow('Method', r.method) + kvRow('Issued', r.issued)
    : `<div class="note red"><div><b>${esc(q)}</b> does not match any receipt on the register.</div></div>`;
  toast(r ? 'Receipt verified' : 'Receipt not found', r ? 'ok' : 'warn');
}
function openReceipt(no){
  const r = DW_RECEIPTS.find(x => x.receipt === no);
  if(!r){ toast('Receipt not found', 'warn'); return; }
  const t = DW_TXN.find(x => x.id === r.txn) || r;
  openModal('Receipt ' + r.receipt, r.txn + ' · ' + dwWhen(r.when), receiptHtml(t, 'Receipt ' + r.receipt),
    [{label: 'Print', act: () => { closeModal(); doPrint('Receipt ' + r.receipt, receiptHtml(t, 'Receipt ' + r.receipt));
      logExport('Receipt ' + r.receipt, 'PDF', 1); renderReports(); }},
     {label: 'Download CSV', act: () => { downloadFile('receipt-' + r.receipt + '.csv', 'text/csv',
       toCsv([['Field', 'Value'], ['Receipt', r.receipt], ['Transaction', r.txn], ['Customer', custName(r.cust)],
         ['Amount', r.amount], ['Fee', r.fee], ['Method', r.method], ['When', r.when]]));
       logExport('Receipt ' + r.receipt, 'CSV', 1); renderReports(); }},
     {label: 'Close', act: 'close'}]);
}
function toggleNotifyRule(event){
  const r = DW_NOTIFY_RULES.find(x => x.event === event);
  if(!r) return;
  r.on = !r.on;
  dwAudit(r.on ? 'Switched on' : 'Switched off', event, 'customer notification rule');
  dwLogChange('Notifications', event, r.on ? 'off' : 'on', r.on ? 'on' : 'off');
  renderAll();
  toast(event + ' ' + (r.on ? 'switched on' : 'switched off'));
}
function testChannel(kind){
  const c = DW_CHANNELS[kind];
  if(!c) return;
  if(kind === 'sms') c.balance = Math.max(0, c.balance - 1);
  c.lastSend = TODAY + ' ' + new Date().toTimeString().slice(0, 5);
  DW_NOTIFY_LOG.unshift({when: TODAY + ' 08:24', event: kind === 'sms' ? 'Deposit confirmed' : 'Withdrawal completed',
    channel: kind === 'sms' ? 'SMS' : 'Email', to: staffName('STF-001'), reference: 'TEST-' + pad(ri(100, 999), 3),
    status: 'Delivered', lane: 'Notifications', severity: 'Low', owner: 'STF-005', region: 'Lilongwe'});
  dwAudit('Test sent', kind === 'sms' ? 'SMS channel' : 'Email channel', 'test message delivered');
  renderAll();
  el('nfMsg').textContent = 'Test ' + (kind === 'sms' ? 'SMS' : 'email') + ' sent through ' + c.provider +
    ' at ' + c.lastSend + ' — delivered.';
  toast('Test ' + kind + ' delivered');
}
function togglePerm(role, i){
  const caps = DW_PERMS[role] || [];
  if(!caps.length) return;
  caps[i] = caps[i] ? 0 : 1;
  dwAudit('Permission', role + ' · ' + DW_CAPS[i], caps[i] ? 'granted' : 'withdrawn');
  dwLogChange('Security', 'Role permission', role, DW_CAPS[i] + ' ' + (caps[i] ? 'granted' : 'withdrawn'));
  renderAll();
  toast(DW_CAPS[i] + (caps[i] ? ' granted to ' : ' withdrawn from ') + role);
}
function fixRls(){
  const gap = DW_DB_TABLES.find(t => t.rls !== 'Enabled');
  if(!gap){ toast('Every table already has a policy', 'info'); return; }
  gap.rls = 'Enabled';
  gap.note = 'Policy added: a customer reads their own proofs, staff by branch';
  DW_MIGRATIONS.forEach(m => { if(/RLS/i.test(m.name)) m.status = 'Applied'; });
  CONST_CHECKS_REFRESH();
  dwAudit('RLS enabled', gap.table, 'policy created and migration applied');
  renderAll();
  toast('Row-level security enabled on ' + gap.table);
}
function runDbChecks(){
  CONST_CHECKS_REFRESH();
  dwAudit('Integrity checks', 'Database', DW_DB_CHECKS.filter(c => c.status === 'Pass').length + ' of ' + DW_DB_CHECKS.length + ' passing');
  renderAll();
  el('dbSchemaBox').innerHTML = '<div class="note gold"><div>Schema check at ' +
    new Date().toTimeString().slice(0, 5) + ' — the application expects version 2026.10.28.1 and the database reports ' +
    '2026.10.28.1. ' + DW_DB_CHECKS.filter(c => c.status === 'Fail').length + ' integrity check(s) still failing.</div></div>';
  toast('Integrity checks run');
}
function dbSchemaCheck(){
  const gaps = DW_DB_TABLES.filter(t => t.rls !== 'Enabled');
  el('dbSchemaBox').innerHTML = '<div class="note gold"><div>Compatibility check — ' + DW_DB_TABLES.length +
    ' tables, ' + DW_DB_FUNCS.length + ' routines, schema 2026.10.28.1. ' +
    (gaps.length ? gaps.length + ' table(s) still need a policy: ' + gaps.map(g => g.table).join(', ') + '.' : 'Nothing is out of step.') +
    '</div></div>' +
    DW_MIGRATIONS.map(m => kvRow(m.id, okb(m.status))).join('');
  dwAudit('Schema check', 'Database', gaps.length + ' gap(s)');
  toast('Schema compatibility checked');
}
function saveSettings(){
  const before = DW_SET.currency + ' · ' + DW_SET.receiptPrefix + '-' + DW_SET.receiptDigits + ' · min ' + DW_SET.minDeposit;
  DW_SET.currency = el('setCcy').value;
  DW_SET.currencyLabel = DW_SET.currency === 'MWK' ? 'Malawian Kwacha (MWK)' : 'Kwacha (K)';
  DW_SET.decimals = clamp(Number(el('setDec').value) || 2, 0, 2);
  DW_SET.depositPrefix = (el('setDepPrefix').value || 'DEP').toUpperCase();
  DW_SET.withdrawalPrefix = (el('setWdrPrefix').value || 'WDR').toUpperCase();
  DW_SET.receiptPrefix = (el('setRcPrefix').value || 'RCT').toUpperCase();
  DW_SET.receiptDigits = clamp(Number(el('setRcDigits').value) || 5, 3, 8);
  DW_SET.minDeposit = Number(el('setMinDep').value) || DW_SET.minDeposit;
  DW_SET.maxDeposit = Number(el('setMaxDep').value) || DW_SET.maxDeposit;
  DW_SET.minWithdrawal = Number(el('setMinWdr').value) || DW_SET.minWithdrawal;
  DW_SET.maxWithdrawal = Number(el('setMaxWdr').value) || DW_SET.maxWithdrawal;
  DW_SET.dailyDepositLimit = Number(el('setDailyDep').value) || DW_SET.dailyDepositLimit;
  DW_SET.dailyWithdrawalLimit = Number(el('setDailyWdr').value) || DW_SET.dailyWithdrawalLimit;
  DW_SET.perCustomerDailyLimit = Number(el('setPerCust').value) || DW_SET.perCustomerDailyLimit;
  DW_SET.duplicateWindow = clamp(Number(el('setDup').value) || 10, 1, 60);
  DW_SET.approvalThreshold = Number(el('setAppr1').value) || DW_SET.approvalThreshold;
  DW_SET.secondApprovalThreshold = Number(el('setAppr2').value) || DW_SET.secondApprovalThreshold;
  DW_SET.depositFeePct = Number(el('setDepFeePct').value) || 0;
  DW_SET.depositFeeFlat = Number(el('setDepFeeFlat').value) || 0;
  DW_SET.withdrawalFeePct = Number(el('setWdrFeePct').value) || 0;
  DW_SET.withdrawalFeeFlat = Number(el('setWdrFeeFlat').value) || 0;
  DW_SET.feePayer = el('setFeePayer').value;
  DW_SET.depositRule = el('setDepRule').value;
  DW_SET.withdrawalRule = el('setWdrRule').value;
  DW_SET.settlementWindow = el('setSettlement').value;
  dwLogChange('Configuration', 'Deposit and withdrawal settings', before,
    DW_SET.currency + ' · ' + DW_SET.receiptPrefix + '-' + DW_SET.receiptDigits + ' · min ' + DW_SET.minDeposit);
  dwAudit('Settings saved', 'Configuration', 'deposit and withdrawal rules updated');
  renderAll(); renderFilterSummary();
  el('setMsg').textContent = 'Saved at ' + new Date().toTimeString().slice(0, 5) + ' — ' + DW_SET.currency +
    ', references ' + DW_SET.depositPrefix + '/' + DW_SET.withdrawalPrefix + ', receipts ' +
    DW_SET.receiptPrefix + '-' + pad(1, DW_SET.receiptDigits) + ', minimum deposit ' + dwM(DW_SET.minDeposit) + '.';
  toast('Settings saved');
}
function resetSettings(){
  Object.keys(DW_SET_DEFAULTS).forEach(k => { DW_SET[k] = DW_SET_DEFAULTS[k]; });
  dwLogChange('Configuration', 'Settings reset', 'edited values', 'factory defaults');
  dwAudit('Settings reset', 'Configuration', 'every value back to the shipped default');
  renderAll();
  el('setMsg').textContent = 'Reset to the shipped defaults — ' + DW_SET.currency + ', receipts ' +
    DW_SET.receiptPrefix + '-' + pad(1, DW_SET.receiptDigits) + ', minimum deposit ' + dwM(DW_SET.minDeposit) + '.';
  toast('Settings reset to defaults', 'warn');
}
function toggleSetting(key){
  DW_SET[key] = !DW_SET[key];
  if(key === 'notifySms') DW_NOTIFY_RULES.forEach(r => { r.sms = DW_SET.notifySms; });
  if(key === 'notifyEmail') DW_NOTIFY_RULES.forEach(r => { r.email = DW_SET.notifyEmail; });
  dwLogChange('Configuration', key.replace(/([A-Z])/g, ' $1').trim(), DW_SET[key] ? 'off' : 'on', DW_SET[key] ? 'on' : 'off');
  dwAudit('Setting', key, DW_SET[key] ? 'switched on' : 'switched off');
  renderAll();
  toast(key.replace(/([A-Z])/g, ' $1').toLowerCase() + ' ' + (DW_SET[key] ? 'switched on' : 'switched off'));
}

/* ===================== header band ===================== */
function renderStats(){
  const s = dwS();
  const set = (id, v) => { if(el(id)) el(id).textContent = v; };
  set('bandScore', Math.round(s.score) + '%');
  set('bandDeposits', num(s.deposits));
  set('bandWithdrawals', num(s.withdrawals));
  set('bandAlerts', num(dwAlerts().length));
  set('topRefresh', REFRESH);
}

/* ===================== filters ===================== */
function uniql(a){ return Array.from(new Set(a)); }
function fillSelects(){
  const sev = ['Critical', 'High', 'Medium', 'Low'];
  const stat = uniql(DW_TXN.map(t => t.status).concat(DW_VERIFY.map(v => v.status),
    DW_APPROVALS.map(a => a.status), DW_REVERSALS.map(r => r.status), DW_DB_ERRORS.map(e => e.status),
    DW_ACCOUNTS.map(a => a.status), DW_ID_CHECKS.map(i => i.checked), DW_NOTIFY_LOG.map(n => n.status)));
  const own = uniql(DW_TXN.concat(DW_VERIFY, DW_APPROVALS, DW_FRAUD, DW_REVERSALS).map(x => x.owner).filter(Boolean));
  const reg = ['Lilongwe', 'Blantyre', 'Mzuzu', 'Zomba', 'Frankfurt'];
  const fill = (id, list, label, map) => {
    const n = el(id);
    if(!n) return;
    n.innerHTML = `<option value="">All ${esc(label)}</option>` +
      list.map(v => `<option value="${esc(v)}">${esc(map ? map(v) : v)}</option>`).join('');
  };
  fill('fltSeverity', sev, 'severities');
  fill('fltStatus', stat, 'states');
  fill('fltOwner', own, 'officers', staffName);
  fill('fltRegion', reg, 'branches');
  fill('fltProduct', PRODUCTS.map(p => p.id), 'products', prodName);
}
function syncFilterInputs(){
  if(el('fltFrom')) el('fltFrom').value = FILTER.from;
  if(el('fltTo')) el('fltTo').value = FILTER.to;
  if(el('fltSearch')) el('fltSearch').value = FILTER.q;
  [['severity', 'fltSeverity'], ['status', 'fltStatus'], ['owner', 'fltOwner'], ['region', 'fltRegion'], ['product', 'fltProduct']]
    .forEach(([k, id]) => { if(el(id)) el(id).value = FILTER[k] || ''; });
  document.querySelectorAll('#fltLaneChips [data-lane]').forEach(c =>
    c.classList.toggle('on', (c.dataset.lane || '') === FILTER.lane));
}
function applyFilters(){
  FILTER.from = el('fltFrom').value || '2026-01-01';
  FILTER.to = el('fltTo').value || TODAY;
  FILTER.q = (el('fltSearch').value || '').trim();
  FILTER.severity = el('fltSeverity').value;
  FILTER.status = el('fltStatus').value;
  FILTER.owner = el('fltOwner').value;
  FILTER.region = el('fltRegion').value;
  FILTER.product = el('fltProduct').value;
  renderAll(); renderFilterSummary();
  toast('Deposits filters applied');
}
function clearFilter(k){
  if(k){ FILTER[k] = ''; if(k === 'q') FILTER.q = ''; }
  else Object.keys(FILTER).forEach(key => { if(key !== 'from' && key !== 'to') FILTER[key] = ''; });
  syncFilterInputs();
  renderAll(); renderFilterSummary();
}
function renderFilterSummary(){
  const chips = [];
  if(FILTER.lane) chips.push(['lane', 'Area: ' + FILTER.lane]);
  if(FILTER.severity) chips.push(['severity', 'Severity: ' + FILTER.severity]);
  if(FILTER.status) chips.push(['status', 'State: ' + FILTER.status]);
  if(FILTER.owner) chips.push(['owner', 'Officer: ' + staffName(FILTER.owner)]);
  if(FILTER.region) chips.push(['region', 'Branch: ' + FILTER.region]);
  if(FILTER.product) chips.push(['product', 'Product: ' + prodName(FILTER.product)]);
  if(FILTER.q) chips.push(['q', 'Search: “' + FILTER.q + '”']);
  if(el('fltSummary')) el('fltSummary').textContent = chips.length
    ? chips.length + ' filter' + (chips.length === 1 ? '' : 's') + ' · ' + fmtDate(FILTER.from) + ' – ' + fmtDate(FILTER.to)
    : 'Date range only';
  if(el('fltChips')) el('fltChips').innerHTML = chips.map(([k, label]) =>
    `<span class="fchip on" data-clear="${k}">${esc(label)} <b style="margin-left:4px">×</b></span>`).join('')
    || '<span class="qhint">No filters applied — the whole deposit and withdrawal register is shown.</span>';
  const s = dwS();
  if(el('fltCounts')) el('fltCounts').innerHTML = [
    ['Transactions', s.total], ['Deposits', s.deposits], ['Withdrawals', s.withdrawals],
    ['Accounts', s.accounts], ['Awaiting verification', s.pendingDep], ['Awaiting approval', s.pendingWdr],
    ['Open issues', dwAlerts().length]
  ].map(([k, v]) => `<div><div class="sl">${esc(k)}</div><div class="sv">${num(v)}</div></div>`).join('');
  if(el('fltResult')) el('fltResult').textContent = 'Showing the deposit and withdrawal register for ' +
    fmtDate(FILTER.from) + ' – ' + fmtDate(FILTER.to) + (chips.length ? ' · ' + chips.map(c => c[1]).join(' · ') : ' · no dimension filters');
}

/* ===================== navigation and render loop ===================== */
function goto(id){
  const sec = document.getElementById(id);
  if(!sec) return;
  document.querySelectorAll('.snav').forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + id));
  if(location.hash !== '#' + id) history.replaceState(null, '', '#' + id);
  if(typeof sec.scrollIntoView === 'function') sec.scrollIntoView({behavior: 'smooth', block: 'start'});
}
function renderHints(){
  const set = (id, txt) => { const n = el(id); if(n && !String(n.textContent).trim()) n.textContent = txt; };
  set('dMsg', 'Record a deposit above — it joins the register and, once verified, the ledger and the customer balance.');
  set('wMsg', 'Fill the request in and the checks run as you type — nothing leaves until identity, balance and limits clear.');
  set('dvMsg', 'Open a deposit in the queue to check it, then approve it or reject it with a note.');
  set('waMsg', 'Select a request, read the balance and the risk checks, then give first-level or management approval.');
  set('laMsg', 'Pick a loan, then update the balance and schedule from the deposits linked to it.');
  set('blMsg', 'Recalculate every balance, reconcile the ledger or post an adjustment — each writes an audit entry.');
  set('lfMsg', 'Ceilings are editable in the table above; save them and the change joins the history.');
  set('rrMsg', 'Decide a request — approve it, post the reversal, or reject it with the reason on record.');
  set('nfMsg', 'Two channels carry every message — send a test through either one.');
  if(el('tpSearchBox') && !String(el('tpSearchBox').textContent).trim())
    el('tpSearchBox').textContent = 'Search the register by reference, customer, method or amount.';
}
function renderAll(){
  renderHints();
  renderOverview();
  renderDeposits();
  renderWithdrawals();
  renderVerification();
  renderApprovals();
  renderCustomerAccounts();
  renderLoanLinks();
  renderMethodConnections();
  renderTransactions();
  renderLedger();
  renderLimits();
  renderReversals();
  renderReceipts();
  renderNotifications();
  renderSecurity();
  renderDb();
  renderReports();
  renderSettings();
  renderStats();
}
function fillDepositFormSelects(){
  dwFillSel('dNewAcct', dwAcctOptions());
  dwFillSel('dNewLoan', [['', 'Customer account only']].concat(dwLoanOptions()));
  dwFillSel('dNewMethod', dwMethodOptions('Deposit'));
  dwFillSel('wReqAcct', dwAcctOptions());
  dwFillSel('wReqMethod', dwMethodOptions('Withdrawal'));
  dwFillSel('lfCalcMethod', dwMethodOptions('Deposit'));
  dwFillSel('laLoanSel', dwLoanOptions());
  if(el('dNewWhen') && !el('dNewWhen').value) el('dNewWhen').value = TODAY + 'T08:30';
}

/* ===================== wiring ===================== */
function wireAll(){
  document.addEventListener('click', e => {
    if(sortOrPage(e)) return;

    const snav = e.target.closest('.snav');
    if(snav){ e.preventDefault(); goto(snav.getAttribute('href').slice(1)); return; }

    const lane = e.target.closest('#fltLaneChips [data-lane]');
    if(lane){ FILTER.lane = lane.dataset.lane; syncFilterInputs(); renderAll(); renderFilterSummary(); return; }

    const chip = e.target.closest('[data-clear]');
    if(chip){ clearFilter(chip.dataset.clear); renderFilterSummary(); return; }

    const go = e.target.closest('[data-goto]');
    if(go){ goto(go.dataset.goto); return; }

    const ap = e.target.closest('[data-acctpick]');
    if(ap){ DW_SEL.acct = ap.dataset.acctpick; renderCustomerAccounts(); goto('s6'); return; }

    const expRow = e.target.closest('[data-exp]');
    if(expRow){
      const x = EXPORTS[Number(expRow.dataset.exp)];
      if(x) openModal(x.report, x.format + ' · ' + x.when,
        `<div class="pfields" style="grid-template-columns:1fr 1fr">
          ${field('Report', esc(x.report))}${field('Format', esc(x.format))}
          ${field('Rows', num(x.rows))}${field('Exported by', esc(x.by))}
          ${field('When', esc(x.when))}${field('Filters', esc(x.filters))}
        </div>`, [{label: 'Close', act: 'close'}]);
      return;
    }

    /* --- 2 deposits --- */
    if(e.target.closest('#dRecordBtn')){ recordDeposit(); return; }
    if(e.target.closest('#dClearBtn')){ clearDepositForm(); return; }
    if(e.target.closest('#dCorrBtn')){
      const ref = el('dCorrRef').value, field2 = el('dCorrField').value;
      const reason = el('dCorrReason').value.trim();
      if(!reason){ toast('A correction needs a reason', 'warn'); return; }
      DW_CORRECTIONS.unshift({id: 'DCR-' + pad(21 + DW_CORRECTIONS.length, 3), ref,
        when: TODAY + ' ' + new Date().toTimeString().slice(0, 5), field: field2,
        from: 'As recorded', to: 'As requested', reason, by: 'STF-001', status: 'Pending'});
      dwAudit('Correction', ref, field2 + ' · ' + reason);
      renderAll();
      el('dCorrReason').value = '';
      toast('Correction requested on ' + ref);
      return;
    }

    /* --- 3 withdrawals --- */
    if(e.target.closest('#wReqBtn')){ submitWithdrawal(); return; }
    if(e.target.closest('#wVerifyIdBtn')){ verifyIdentity(); return; }

    /* --- 4 verification --- */
    const vok = e.target.closest('[data-dvok]');
    if(vok){ dvAction('approve', vok.dataset.dvok); return; }
    const vrej = e.target.closest('[data-dvrej]');
    if(vrej){ dvAction('reject', vrej.dataset.dvrej); return; }
    if(e.target.closest('#dvApproveAll')){ approveAllPassing(); return; }
    if(e.target.closest('#dvAutoBtn')){ autoVerifyDeposits(); return; }

    /* --- 5 approvals --- */
    if(e.target.closest('#waL1Btn')){ waApprove('first'); return; }
    if(e.target.closest('#waL2Btn')){ waApprove('management'); return; }
    if(e.target.closest('#waCancelBtn')){ waCancel(); return; }

    /* --- 6 accounts --- */
    if(e.target.closest('#caReconBtn')){ reconcileAccount(); return; }
    if(e.target.closest('#caStmtBtn')){ DW_SEL.stmtCust = (DW_ACC_BY_ID[DW_SEL.acct] || {}).cust || CUSTOMERS[0].id;
      if(el('rsStmtCust')) el('rsStmtCust').value = DW_SEL.stmtCust; buildStatement(); return; }

    /* --- 7 loans --- */
    if(e.target.closest('#laUpdateBtn')){ updateLoanBalance(); return; }

    /* --- 8 methods --- */
    if(e.target.closest('#mtRefBtn')){ validateMethodRef(); return; }

    /* --- 9 processing --- */
    if(e.target.closest('#tpSearchBtn')){
      const q = el('tpSearch').value.trim();
      el('tpSearchBox').innerHTML = q ? (() => {
        const hits = DW_TXN.filter(t => matchQ(t.id, t.ref, t.when, t.method, custName(t.cust), t.amount) &&
          [t.id, t.ref, custName(t.cust), t.method, dwM(t.amount), t.status].join(' ').toLowerCase().includes(q.toLowerCase()));
        return hits.length ? hits.map(t => kvRow(t.id + ' · ' + t.type, dwM(t.amount) + ' · ' + t.when + ' · ' + t.status)).join('')
          : '<div class="qhint">No transaction matches “' + esc(q) + '”.</div>';
      })() : '<div class="qhint">Type a reference to search the whole register.</div>';
      return;
    }
    const tps = e.target.closest('[data-tpstatus]');
    if(tps){ TP_STATE = tps.dataset.tpstatus; renderTransactions(); return; }
    if(e.target.closest('#tpStatusBtn')){ setTransactionStatus(); return; }
    if(e.target.closest('#tpReceiptBtn')){ tpReceipt(); return; }
    if(e.target.closest('#tpDupBtn')){ scanDuplicates(); return; }

    /* --- 10 ledger --- */
    if(e.target.closest('#blRecalcBtn')){ recalcBalances(); return; }
    if(e.target.closest('#blReconBtn')){ reconcileLedger(); return; }
    if(e.target.closest('#blCorrBtn')){ postAdjustment(); return; }

    /* --- 11 limits --- */
    if(e.target.closest('#lfSaveBtn')){ saveLimits(); return; }
    if(e.target.closest('#lfCalcBtn')){ calculateFee(); return; }

    /* --- 12 reversals --- */
    const rra = e.target.closest('[data-rract]');
    if(rra){ reversalAction(rra.dataset.rract); return; }

    /* --- 13 receipts --- */
    const rc = e.target.closest('[data-rcpt]');
    if(rc){ openReceipt(rc.dataset.rcpt); return; }
    if(e.target.closest('#rsVerifyBtn')){ verifyReceipt(); return; }
    if(e.target.closest('#rsStmtBtn')){ buildStatement(); return; }
    const sp = e.target.closest('[data-stmtprint]');
    if(sp){ printStatement(sp.dataset.stmtprint); return; }
    const sc = e.target.closest('[data-stmtcsv]');
    if(sc){ downloadStatement(sc.dataset.stmtcsv); return; }

    /* --- 14 notifications --- */
    const nr = e.target.closest('[data-nfrule]');
    if(nr){ toggleNotifyRule(nr.dataset.nfrule); return; }
    if(e.target.closest('#nfTestSms')){ testChannel('sms'); return; }
    if(e.target.closest('#nfTestEmail')){ testChannel('email'); return; }

    /* --- 15 security --- */
    const perm = e.target.closest('[data-perm]');
    if(perm){ togglePerm(perm.dataset.perm, Number(perm.dataset.pi)); return; }

    /* --- 16 database --- */
    if(e.target.closest('#rlsFix')){ fixRls(); return; }
    if(e.target.closest('#dbCheckBtn')){ runDbChecks(); return; }
    if(e.target.closest('#dbSchemaBtn')){ dbSchemaCheck(); return; }

    /* --- 17 reports --- */
    const rep = e.target.closest('[data-dwrep]');
    if(rep){ runReport(rep.dataset.dwrep, rep.dataset.fmt); return; }
    if(e.target.closest('#packCsv')){ runPack('csv'); return; }
    if(e.target.closest('#packXlsx')){ runPack('xlsx'); return; }
    if(e.target.closest('#packPdf')){ runPack('print'); return; }
    if(e.target.closest('#packPrint')){ runPack('print'); return; }
    if(e.target.closest('#quickCsv')){ runPack('csv'); return; }
    if(e.target.closest('#printBtn')){
      const s = dwS();
      doPrint('Deposits and withdrawals — summary', brandHtml('Deposit report', filterLine()) +
        printTable('Movement health', [{label: 'Measure'}, {label: 'Value'}],
          [['Movement health', Math.round(s.score) + '%'],
           ['Transactions', num(s.total)],
           ['Deposits', dwM(s.totalDeposits)],
           ['Withdrawals', dwM(s.totalWithdrawals)],
           ['Net movement', dwM(s.net)],
           ['Accounts', num(s.accounts)],
           ['Available', dwM(s.availableTotal)],
           ['Reserved for payouts', dwM(s.reservedTotal)],
           ['Awaiting verification', s.pendingDep],
           ['Awaiting approval', s.pendingWdr],
           ['Open issues', dwAlerts().length]]));
      logExport('Deposit summary', 'PDF', 11);
      renderReports();
      return;
    }

    /* --- 18 settings --- */
    if(e.target.closest('#setSave')){ saveSettings(); return; }
    if(e.target.closest('#setReset')){ resetSettings(); return; }
    if(e.target.closest('#setValidate')){
      const bad = renderValidation();
      dwLogChange('Configuration', 'Validation run', 'not run', bad.length ? bad.length + ' to fix' : 'every value valid');
      dwAudit('Validation', 'Configuration', bad.length ? bad.length + ' failing' : 'every value valid');
      renderAll();
      el('setMsg').textContent = bad.length
        ? bad.length + ' setting(s) need attention: ' + bad.map(b => b.label).join(', ') + '.'
        : 'Every setting is in range and agrees with what the rails expect.';
      toast(bad.length ? bad.length + ' value(s) need attention' : 'Settings valid', bad.length ? 'warn' : 'ok');
      return;
    }
    const setChip = e.target.closest('#setToggles [data-set]');
    if(setChip){ toggleSetting(setChip.dataset.set); return; }

    /* --- shared chrome --- */
    if(e.target.closest('#fltApply')){ applyFilters(); return; }
    if(e.target.closest('#fltReset')){ clearFilter(); renderFilterSummary(); toast('Filters cleared'); return; }
    if(e.target.closest('#refreshBtn')){
      REFRESH = fmtDate(TODAY) + ' · ' + new Date().toTimeString().slice(0, 5);
      renderAll(); renderFilterSummary();
      toast('Deposit data refreshed at ' + REFRESH.slice(-5));
      return;
    }
    if(e.target.closest('#bellBtn')){
      const open = dwAlerts();
      openModal('Open deposit and withdrawal issues', open.length + ' need attention',
        open.map(a => `<div class="risk"><div><div class="rn">${esc(a.what)}</div>
          <div class="rs">${esc(a.detail)}</div></div><div class="rv">${badge(a.severity, DW_SEV(a.severity))}</div></div>`).join('')
          || '<div class="empty">Nothing open — every deposit is verified and every payout has cleared.</div>',
        [{label: 'Open verification', act: () => { closeModal(); goto('s4'); }}, {label: 'Close', act: 'close'}]);
      return;
    }
    if(e.target.closest('#menuBtn')){ document.body.classList.toggle('nav-open'); return; }
    if(e.target.closest('#modalClose') || e.target === el('modal')){ closeModal(); return; }
  });

  document.addEventListener('change', e => {
    const t = e.target;
    if(t.id === 'laLoanSel'){ DW_SEL.loan = t.value; renderLoanLinks(); return; }
    if(t.id === 'wReqAcct' || t.id === 'wReqAmount' || t.id === 'wReqMethod' || t.id === 'wReqIdNum'){ renderWithdrawals(); return; }
    if(t.id === 'blCorrAcct') return;
    if(t.id === 'rsStmtCust'){ DW_SEL.stmtCust = t.value; renderReceipts(); return; }
    if(t.id === 'lfCalcType'){ dwFillSel('lfCalcMethod', dwMethodOptions(t.value)); return; }
    if(t.id === 'tpStatusSel') return;
    if(t.id === 'dNewAcct') return;
  });
  document.addEventListener('input', e => {
    if(e.target.id === 'wReqAmount' || e.target.id === 'wReqAcct') renderWithdrawals();
  });

  if(el('fltSearch')) el('fltSearch').addEventListener('keydown', e => { if(e.key === 'Enter') applyFilters(); });
  if(el('globalSearch')) el('globalSearch').addEventListener('keydown', e => {
    if(e.key !== 'Enter') return;
    el('fltSearch').value = el('globalSearch').value;
    applyFilters(); goto('s1');
    toast('Register filtered by “' + el('globalSearch').value + '”');
  });
  if(el('mtRefInput')) el('mtRefInput').addEventListener('keydown', e => { if(e.key === 'Enter') validateMethodRef(); });
  if(el('rsVerifyInput')) el('rsVerifyInput').addEventListener('keydown', e => { if(e.key === 'Enter') verifyReceipt(); });
  if(el('tpSearch')) el('tpSearch').addEventListener('keydown', e => { if(e.key === 'Enter') el('tpSearchBtn').click(); });
  window.addEventListener('scroll', spyScroll, {passive: true});
  window.addEventListener('hashchange', () => { const h = location.hash.slice(1); if(h && document.getElementById(h)) goto(h); });
}
function spyScroll(){
  const secs = Array.from(document.querySelectorAll('section.sec'));
  if(!secs.length) return;
  const y = window.scrollY + 120;
  let cur = secs[0];
  secs.forEach(s => { if(s.offsetTop <= y) cur = s; });
  document.querySelectorAll('.snav').forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + cur.id));
}

window.DEPOSITS_APP = {
  FILTER, DW_SET, DW_SET_DEFAULTS, DW_ACCOUNTS, DW_ACC_BY_ID, DW_ACC_BY_CUST, DW_METHODS, DW_TXN,
  DW_DEPOSITS, DW_WITHDRAWALS, DW_VERIFY, DW_VERIFY_HISTORY, DW_DUPES, DW_APPROVALS, DW_APPROVAL_HISTORY,
  DW_RISK, DW_CORRECTIONS, DW_LEDGER, DW_DISCREPANCY, DW_ADJUST, DW_LIMITS, DW_FEES, DW_FEE_HISTORY, DW_DAILY,
  DW_REVERSALS, DW_REFUNDS, DW_DUP_RESOLUTION, DW_FAIL_RECOVERY, DW_REV_AUDIT, DW_RECEIPTS,
  DW_RECEIPT_CORRECTIONS, DW_CHANNELS, DW_NOTIFY_RULES, DW_NOTIFY_LOG, DW_ID_CHECKS, DW_FRAUD, DW_VELOCITY,
  DW_AMOUNT_ALERTS, DW_ACC_CHANGES, DW_ROLES, DW_CAPS, DW_PERMS, DW_ROLE_STAFF, DW_APPROVAL_THRESHOLDS,
  DW_DB_TABLES, DW_DB_FUNCS, DW_DB_ERRORS, DW_DB_CHECKS, DW_MIGRATIONS, DW_REPORTS, DW_CHANGES, DW_AUDIT,
  DW_STATUSES, DW_STATUS_COUNTS, dwStats, dwReport, renderAll, runReport, runPack, goto,
  recordDeposit, submitWithdrawal, verifyIdentity, dvAction, approveAllPassing, autoVerifyDeposits,
  waApprove, waCancel, reconcileAccount, buildStatement, printStatement, downloadStatement, updateLoanBalance,
  validateMethodRef, setTransactionStatus, tpReceipt, scanDuplicates, recalcBalances, reconcileLedger,
  postAdjustment, saveLimits, calculateFee, reversalAction, verifyReceipt, openReceipt,
  toggleNotifyRule, testChannel, togglePerm, fixRls, runDbChecks, dbSchemaCheck,
  saveSettings, resetSettings, toggleSetting, applyFilters, clearFilter, logExport
};

/* boot */
(function(){
  fillSelects();
  fillDepositFormSelects();
  syncFilterInputs();
  renderAll();
  renderFilterSummary();
  renderExportHistory();
  wireAll();
  const hash = (location.hash || '').slice(1);
  if(hash) goto(hash);
})();
</script>
</body>
</html>
