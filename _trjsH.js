<script>
/* ============================================================
   TRANSFERS MANAGEMENT & CONNECTIONS (8/8)
   Sections 17–20, every action behind the buttons, the filters,
   the navigation, the render loop and the boot sequence.
   ============================================================ */

const trNow = () => new Date().toTimeString().slice(0, 5);

/* ===================== 17 · TRANSFER CONNECTIONS ===================== */
function trConnItem(){
  return TR_CONNS.find(c => c.id === TR_SEL.conn) || TR_CONNS[0];
}
function renderConnections(){
  const sel = trConnItem();
  const bad = TR_CONNS.filter(c => c.status !== 'Connected');
  if(el('cnPill')){ el('cnPill').className = 'badge ' + (bad.length ? 'b-warn' : 'b-ok');
    el('cnPill').textContent = num(TR_CONNS.length - bad.length) + '/' + TR_CONNS.length + ' healthy'; }
  put('cnKpis', [
    ['Connections', num(TR_CONNS.length), 'Internal, mobile money, bank and gateway', ''],
    ['Online', num(TR_CONNS.filter(c => c.status === 'Connected').length), 'Acknowledging requests', ''],
    ['Under review', num(TR_CONNS.filter(c => c.status === 'Review').length), 'Latency or credential', bad.length ? 'red' : ''],
    ['Average latency', Math.round(sum(TR_CONNS, c => c.latency) / TR_CONNS.length) + ' ms', 'Across every rail', ''],
    ['Lowest uptime', Math.min.apply(null, TR_CONNS.map(c => c.uptime)) + '%', 'The weakest link', ''],
    ['Webhooks seen', num(TR_WEBHOOKS.length), 'Callbacks checked for a signature', ''],
    ['Signature failures', num(TR_WEBHOOKS.filter(w => w.signature !== 'Verified').length), 'Rejected callbacks', ''],
    ['Open alerts', num(TR_CONN_ALERTS.filter(a => a.status === 'Open').length), 'Connection trouble', '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join(''));

  if(el('cnCount')) el('cnCount').textContent = num(TR_CONNS.length) + ' connections';
  const list = TR_CONNS.slice();
  list.forEach(c => { c._open = () => { TR_SEL.conn = c.id; renderConnections(); }; });
  renderTable('cnBody', [
    {k: 'name', label: 'Connection'},
    {k: 'rail', label: 'Rail'},
    {k: 'provider', label: 'Provider'},
    {k: 'status', label: 'Status', html: v => okb(v)},
    {k: 'latency', label: 'Latency', num: true, html: v => esc(v + ' ms')},
    {k: 'uptime', label: 'Uptime', num: true, html: v => esc(v + '%')}
  ], list, {sort: 'latency', pageSize: 7});
  if(el('cnMsg') && !String(el('cnMsg').textContent || '').trim())
    el('cnMsg').textContent = 'A connection test writes a row into the test history and reports the latency it measured.';

  if(el('cnSelPill')) el('cnSelPill').textContent = sel ? sel.id : '—';
  put('cnDetail', sel ? kvRow('Connection', sel.name) + kvRow('Rail', sel.rail)
    + kvRow('Provider', sel.provider) + kvRow('Status', okb(sel.status))
    + kvRow('Environment', sel.environment)
    + kvRow('Latency', sel.latency + ' ms') + kvRow('Uptime', sel.uptime + '%')
    + kvRow('Webhook', esc(sel.webhook)) + kvRow('Signature', sel.signature)
    + kvRow('Last check', trWhen(sel.lastCheck)) : '<div class="empty">Nothing selected.</div>');
  put('cnCred', `<div class="minihead">Credentials</div>`
    + kvRow('Credential', sel ? esc(sel.credential) : '—')
    + kvRow('Rotation', okb('Every 90 days'))
    + kvRow('Stored in', 'Supabase vault, never in the browser')
    + kvRow('Last rotated', fmtDate(addDays(TODAY, -12))));

  if(el('cnApiPill')) el('cnApiPill').textContent = sel ? sel.provider : '—';
  put('cnApi', sel ? kvRow('Endpoint', 'https://api.goldenloan.mw/v1/' + String(sel.id).toLowerCase().replace('con-', '') + '/transfers')
    + kvRow('Method', okb('POST'))
    + kvRow('Idempotency key', okb('Sent on every request'))
    + kvRow('Timeout', '30 s, then the transfer is held')
    + kvRow('Retries', 'Two, with the same idempotency key')
    + kvRow('Signature', sel.signature)
    + kvRow('Webhook', esc(sel.webhook))
    + kvRow('Expected response', 'A provider reference and a status') : '');

  if(el('cnHookPill')) el('cnHookPill').textContent = num(TR_WEBHOOKS.length) + ' callbacks';
  renderTable('cnHookBody', [
    {k: 'when', label: 'Received', html: v => esc(trWhen(v))},
    {k: 'event', label: 'Event', html: v => esc(String(v).slice(0, 34))},
    {k: 'reference', label: 'Reference'},
    {k: 'signature', label: 'Signature', html: v => okb(v)},
    {k: 'delivery', label: 'Delivery', html: v => okb(v)},
    {k: 'attempts', label: 'Attempts', num: true}
  ], TR_WEBHOOKS, {sort: 'when', pageSize: 6});
  put('cnHealth', TR_CONNS.map(c => meter(c.name, clamp(100 - c.latency / 20, 0, 100),
    c.latency + ' ms · ' + c.uptime + '% uptime', 100)).join(''));

  if(el('cnAlertPill')) el('cnAlertPill').textContent = num(TR_CONN_ALERTS.filter(a => a.status === 'Open').length) + ' open';
  renderTable('cnAlertBody', [
    {k: 'when', label: 'When', html: v => esc(trWhen(v))},
    {k: 'what', label: 'What happened'},
    {k: 'severity', label: 'Severity', html: v => badge(v, TR_SEV(v))},
    {k: 'status', label: 'State', html: v => okb(v)},
    {k: '_act', label: 'Action', html: (v, r) => r.status === 'Open'
      ? `<button class="btn btn-ghost" data-cnack="${esc(r.what)}">Acknowledge</button>` : okb('Acknowledged')}
  ], TR_CONN_ALERTS, {sort: 'when', pageSize: 5});

  put('cnGrid',
    chartBox({title: 'Latency by connection', sub: 'Milliseconds, lower is better', type: 'bar', h: 200,
      cats: TR_CONNS.map(c => c.name.length > 16 ? c.name.slice(0, 16) + '…' : c.name),
      colours: TR_CONNS.map(c => c.status === 'Connected' ? '#1E9E6A' : '#C9A227'),
      series: [{name: 'Latency', data: TR_CONNS.map(c => c.latency)}]}) +
    chartBox({title: 'Value carried by rail', sub: 'Completed transfers, MWK', type: 'donut', h: 200,
      cats: ['Internal', 'Mobile money', 'Bank', 'Gateway'],
      series: [{name: 'Value', data: ['Internal', 'Mobile money', 'Bank', 'Gateway'].map(r =>
        sum(TR_COMPLETED.filter(t => (TR_METHOD_BY_NAME[t.method] || {}).lane === r), t => t.amount))}],
      value: compact(trS().totalAmount)}));
}

/* ===================== 18 · DATABASE ===================== */
function renderDatabase(){
  const gap = TR_DB_TABLES.filter(t => t.rls !== 'Enabled');
  const openErr = TR_DB_ERRORS.filter(e => e.status === 'Open');
  if(el('dbPill')){ el('dbPill').className = 'badge ' + (gap.length || openErr.length ? 'b-crit' : 'b-ok');
    el('dbPill').textContent = (gap.length + openErr.length) + ' problems'; }
  put('dbKpis', [
    ['Tables', num(TR_DB_TABLES.length), 'Every table a transfer touches', ''],
    ['Rows held', num(sum(TR_DB_TABLES, t => t.rows)), 'Across the schema', ''],
    ['Functions and triggers', num(TR_DB_FUNCS.length), 'The routines that post money', ''],
    ['RLS gaps', num(gap.length), gap.length ? 'transfer_attachments has no policy' : 'Every table has a policy', gap.length ? 'red' : ''],
    ['Open errors', num(openErr.length), 'Grouped by SQLSTATE', openErr.length ? 'red' : ''],
    ['Deploys applied', num(TR_MIGRATIONS.filter(m => m.status === 'Applied').length), 'Of ' + TR_MIGRATIONS.length + ' queued', ''],
    ['Checks passing', num(TR_DB_CHECKS().filter(c => c.status === 'Pass').length) + '/' + TR_DB_CHECKS().length, 'Integrity checks', ''],
    ['Duplicates held', num(TR_DUPLICATES.length), 'Provider reference groups', '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join(''));

  put('dbGrid',
    chartBox({title: 'Rows by table', sub: 'The tables a transfer writes', type: 'bar', h: 200,
      cats: TR_DB_TABLES.map(t => t.table.replace(/_/g, ' ').slice(0, 14)),
      series: [{name: 'Rows', data: TR_DB_TABLES.map(t => t.rows)}], value: num(sum(TR_DB_TABLES, t => t.rows))}) +
    chartBox({title: 'Errors by SQLSTATE', sub: 'Open and resolved', type: 'donut', h: 200,
      cats: TR_DB_ERRORS.map(e => e.code),
      series: [{name: 'Errors', data: TR_DB_ERRORS.map(e => e.count)}], value: num(sum(TR_DB_ERRORS, e => e.count))}));

  if(el('dbTblPill')) el('dbTblPill').textContent = num(TR_DB_TABLES.length) + ' tables';
  renderTable('dbTblBody', [
    {k: 'table', label: 'Table'},
    {k: 'rows', label: 'Rows', num: true},
    {k: 'size', label: 'Size'},
    {k: 'rls', label: 'Row-level security', html: v => okb(v)},
    {k: 'note', label: 'What it holds', html: v => esc(String(v).slice(0, 42))},
    {k: 'lastWrite', label: 'Last write', html: v => esc(trWhen(v))}
  ], TR_DB_TABLES, {sort: 'rows', pageSize: 9});

  if(el('dbFnPill')) el('dbFnPill').textContent = num(TR_DB_FUNCS.length) + ' routines';
  renderTable('dbFnBody', [
    {k: 'name', label: 'Routine'},
    {k: 'kind', label: 'Kind'},
    {k: 'invoker', label: 'Runs as'},
    {k: 'calls', label: 'Calls', num: true},
    {k: 'status', label: 'Health', html: v => okb(v)}
  ], TR_DB_FUNCS, {sort: 'calls', pageSize: 6});

  if(el('dbRlsPill')) el('dbRlsPill').textContent = gap.length ? gap.length + ' gap' : 'None';
  put('dbRls', TR_DB_TABLES.filter(t => t.rls !== 'Enabled').map(t => `<div class="risk">
      <div><div class="rn">${esc(t.table)}</div><div class="rs">${esc(t.note)} · ${num(t.rows)} rows</div></div>
      <div class="rv">${badge(t.rls, 'b-crit')}</div></div>`).join('')
    + TR_DB_TABLES.filter(t => t.rls === 'Enabled').slice(0, 4).map(t => `<div class="risk">
      <div><div class="rn">${esc(t.table)}</div><div class="rs">${esc(t.note)}</div></div>
      <div class="rv">${okb('Enabled')}</div></div>`).join('')
    || '<div class="empty">Every table carries a policy.</div>');
  put('dbAtomic', `<div class="minihead">Atomic posting</div>`
    + kvRow('One transfer, one transaction', okb('Guaranteed'))
    + kvRow('Debit, credit, fee and ledger', 'Written together or not at all')
    + kvRow('Rollback on a failure', okb('Yes'))
    + kvRow('Concurrent update', 'Serialised by row lock'));

  if(el('dbErrPill')) el('dbErrPill').textContent = num(TR_DB_ERRORS.length) + ' groups';
  renderTable('dbErrBody', [
    {k: 'when', label: 'Last seen', html: v => esc(trWhen(v))},
    {k: 'code', label: 'SQLSTATE'},
    {k: 'message', label: 'Message', html: v => esc(String(v).slice(0, 46))},
    {k: 'count', label: 'Count', num: true},
    {k: 'status', label: 'State', html: v => okb(v)}
  ], TR_DB_ERRORS, {sort: 'count', pageSize: 4});

  const checks = TR_DB_CHECKS();
  if(el('dbChkPill')) el('dbChkPill').textContent = checks.filter(c => c.status === 'Pass').length + '/' + checks.length + ' passing';
  put('dbChecks', checks.map(c => `<div class="checkrow"><div class="ck ${c.status === 'Pass' ? 'pass' : 'crit'}">${c.status === 'Pass' ? '✓' : '!'}</div>
      <div style="flex:1"><div style="font-size:10.5px;font-weight:800">${esc(c.check)}</div>
        <div class="qhint">${esc(c.value)}</div></div><div>${okb(c.status)}</div></div>`).join(''));
  put('dbDup', `<div class="minihead">Duplicate submission protection</div>`
    + kvRow('Unique provider reference', okb('Enforced by index'))
    + kvRow('Idempotency window', TR_SET.duplicateWindow + ' minutes')
    + kvRow('Groups currently held', String(TR_DUPLICATES.length))
    + kvRow('Uniqueness error today', String(TR_DB_ERRORS[0].count) + ' attempts refused'));

  if(el('dbMigPill')) el('dbMigPill').textContent = num(TR_MIGRATIONS.filter(m => m.status === 'Pending').length) + ' pending';
  renderTable('dbMigBody', [
    {k: 'id', label: 'Version'},
    {k: 'name', label: 'Change'},
    {k: 'when', label: 'When', html: v => esc(trWhen(v))},
    {k: 'status', label: 'State', html: v => okb(v)}
  ], TR_MIGRATIONS, {sort: 'when', pageSize: 5});
}

/* ===================== 19 · NOTIFICATIONS ===================== */
function renderNotifications(){
  const sms = TR_CHANNELS.sms, email = TR_CHANNELS.email;
  if(el('ntPill')){ el('ntPill').className = 'badge b-ok'; el('ntPill').textContent = num(TR_NOTIFY_LOG.length) + ' messages'; }
  put('ntKpis', [
    ['Notification rules', num(TR_NOTIFY_RULES.length), 'One per transfer event', ''],
    ['Rules switched on', num(TR_NOTIFY_RULES.filter(r => r.on).length), 'Sending right now', ''],
    ['Messages sent', num(TR_NOTIFY_LOG.length), 'SMS and email together', ''],
    ['Delivered', num(TR_NOTIFY_LOG.filter(n => n.status === 'Delivered').length), 'Reached the handset or inbox', ''],
    ['Queued', num(TR_NOTIFY_LOG.filter(n => n.status === 'Queued').length), 'Waiting for the provider', ''],
    ['Failed', num(TR_NOTIFY_LOG.filter(n => n.status === 'Failed').length), 'Needs a resend', ''],
    ['SMS credit', num(sms.balance), sms.provider + ' · ' + sms.sender, ''],
    ['Email allowance', email.balance, email.provider + ' · ' + email.sender, '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join(''));

  if(el('ntRulePill')) el('ntRulePill').textContent = num(TR_NOTIFY_RULES.length) + ' rules';
  if(el('ntBody')){
    el('ntHead').innerHTML = '<tr><th>Event</th><th>Who receives it</th><th>Template</th><th>SMS</th><th>Email</th><th>Rule</th></tr>';
    el('ntBody').innerHTML = TR_NOTIFY_RULES.map((r, i) => `<tr>
      <td>${esc(r.event)}</td><td>${esc(r.to)}</td><td>${esc(r.template)}</td>
      <td>${r.sms ? okb('On') : badge('Off', 'b-gray')}</td>
      <td>${r.email ? okb('On') : badge('Off', 'b-gray')}</td>
      <td><button class="btn btn-ghost" data-ntrule="${i}">${r.on ? 'Turn off' : 'Turn on'}</button></td></tr>`).join('');
  }

  put('ntConn', `<div class="minihead">SMS · ${esc(sms.provider)}</div>`
    + kvRow('Sender', sms.sender) + kvRow('Status', okb(sms.status))
    + kvRow('Credit left', num(sms.balance)) + kvRow('Latency', sms.latency + ' ms')
    + kvRow('Credential', sms.credential) + kvRow('Last send', trWhen(sms.lastSend))
    + `<div class="minihead" style="margin-top:8px">Email · ${esc(email.provider)}</div>`
    + kvRow('Sender', email.sender) + kvRow('Status', okb(email.status))
    + kvRow('Allowance', email.balance) + kvRow('Latency', email.latency + ' ms')
    + kvRow('Credential', email.credential) + kvRow('Last send', trWhen(email.lastSend)));

  const byChannel = ['SMS', 'Email'].map(ch => {
    const rows = TR_NOTIFY_LOG.filter(n => n.channel === ch);
    return {channel: ch, sent: rows.length, delivered: rows.filter(n => n.status === 'Delivered').length,
      queued: rows.filter(n => n.status === 'Queued').length, failed: rows.filter(n => n.status === 'Failed').length};
  });
  if(el('ntDelPill')) el('ntDelPill').textContent = num(byChannel[0].sent + byChannel[1].sent) + ' sent';
  renderTable('ntDelBody', [
    {k: 'channel', label: 'Channel'},
    {k: 'sent', label: 'Sent', num: true},
    {k: 'delivered', label: 'Delivered', num: true},
    {k: 'queued', label: 'Queued', num: true},
    {k: 'failed', label: 'Failed', num: true}
  ], byChannel, {sort: 'sent', pageSize: 4});

  if(el('ntHistPill')) el('ntHistPill').textContent = num(TR_NOTIFY_LOG.length) + ' rows';
  renderTable('ntHistBody', [
    {k: 'when', label: 'When', html: v => esc(trWhen(v))},
    {k: 'event', label: 'Event'},
    {k: 'channel', label: 'Channel'},
    {k: 'to', label: 'To'},
    {k: 'reference', label: 'Transfer'},
    {k: 'status', label: 'Delivery', html: v => okb(v)}
  ], TR_NOTIFY_LOG.filter(trPass), {sort: 'when', pageSize: 7});

  put('ntGrid',
    chartBox({title: 'Messages by event', sub: 'Every rule, its traffic', type: 'bar', h: 200,
      cats: TR_NOTIFY_RULES.map(r => r.event.replace('Transfer ', '').slice(0, 12)),
      series: [{name: 'Messages', data: TR_NOTIFY_RULES.map(r => TR_NOTIFY_LOG.filter(n => n.event === r.event).length)}],
      value: num(TR_NOTIFY_LOG.length)}) +
    chartBox({title: 'Delivery outcome', sub: 'Every message sent', type: 'donut', h: 200,
      cats: ['Delivered', 'Queued', 'Failed'],
      series: [{name: 'Messages', data: ['Delivered', 'Queued', 'Failed'].map(st => TR_NOTIFY_LOG.filter(n => n.status === st).length)}],
      value: num(TR_NOTIFY_LOG.length)}));
}

/* ===================== 20 · REPORTS, SETTINGS AND AUDIT ===================== */
function trReport(key){
  const inWindow = t => inRange(trIsos(t.when));
  const R = {
    daily: () => ({title: 'Daily Transfer Report', note: 'Every transfer recorded today, with its method and officer.',
      cols: [['Transfer', 'id'], ['When', 'when'], ['Customer', 'cust'], ['Method', 'method'], ['Amount', 'amount'], ['Status', 'status']],
      rows: TR_TXN.filter(t => trIsos(t.when) === TODAY).map(t => ({id: t.id, when: trWhen(t.when), cust: custName(t.cust),
        method: t.method, amount: trM(t.amount), status: t.status}))}),
    weekly: () => ({title: 'Weekly Transfer Report', note: 'The last seven days against the daily limit.',
      cols: [['Day', 'day'], ['Transfers', 'count'], ['Internal', 'internal'], ['External', 'external'], ['Value', 'value'], ['Limit', 'limit']],
      rows: TR_DAILY.map(d => ({day: fmtDate(d.day), count: d.count, internal: trM(d.internal), external: trM(d.external),
        value: trM(d.value), limit: trM(d.limit)}))}),
    monthly: () => ({title: 'Monthly Transfer Report', note: 'Volume, value and fees per month.',
      cols: [['Month', 'month'], ['Transfers', 'count'], ['Value', 'value'], ['Fees', 'fees']],
      rows: MONTHS12.map(m => { const rows = TR_TXN.filter(t => String(t.when).slice(0, 7) === m);
        return {month: monthLabel(m), count: rows.length, value: trM(sum(rows.filter(t => t.status === 'Completed'), t => t.amount)),
          fees: trM(sum(rows.filter(t => t.status === 'Completed'), t => t.fee))}; })}),
    method: () => ({title: 'Transfers by Payment Method', note: 'Volume, value and fees for each rail.',
      cols: [['Method', 'method'], ['Rail', 'rail'], ['Transfers', 'count'], ['Value', 'value'], ['Fees', 'fees'], ['Failed', 'failed']],
      rows: TR_METHODS.map(m => { const rows = TR_TXN.filter(t => t.method === m.method && inWindow(t));
        return {method: m.method, rail: m.rail, count: rows.length,
          value: trM(sum(rows.filter(t => t.status === 'Completed'), t => t.amount)),
          fees: trM(sum(rows.filter(t => t.status === 'Completed'), t => t.fee)),
          failed: rows.filter(t => t.status === 'Failed').length}; })}),
    customer: () => ({title: 'Transfers by Customer', note: 'Who is moving money, and how often.',
      cols: [['Customer', 'cust'], ['Transfers', 'count'], ['Value', 'value'], ['Last transfer', 'last'], ['Limit', 'limit']],
      rows: CUSTOMERS.slice(0, 30).map(c => { const rows = TR_TXN.filter(t => t.cust === c.id && t.status === 'Completed');
        return {cust: c.name, count: rows.length, value: trM(sum(rows, t => t.amount)),
          last: rows.length ? trWhen(rows[0].when) : '—', limit: trM(TR_SET.perCustomerDailyLimit)}; })}),
    staff: () => ({title: 'Transfers by Staff Member', note: 'What each officer created and approved.',
      cols: [['Officer', 'officer'], ['Raised', 'raised'], ['Value', 'value'], ['Approved', 'approved'], ['Verified', 'verified']],
      rows: STAFF.slice(0, 16).map(s => { const mine = TR_TXN.filter(t => t.officer === s.id);
        return {officer: s.name, raised: mine.length, value: trM(sum(mine, t => t.amount)),
          approved: TR_TXN.filter(t => t.approvedBy === s.id).length, verified: TR_TXN.filter(t => t.verifiedBy === s.id).length}; })}),
    highValue: () => ({title: 'High-Value Transfer Report', note: 'Everything above the approval threshold.',
      cols: [['Transfer', 'id'], ['Customer', 'cust'], ['Amount', 'amount'], ['Method', 'method'], ['Approved by', 'approved'], ['Status', 'status']],
      rows: TR_TXN.filter(t => t.amount > TR_SET.approvalThreshold && inWindow(t)).map(t => ({id: t.id, cust: custName(t.cust),
        amount: trM(t.amount), method: t.method, approved: t.approvedBy ? staffName(t.approvedBy) : 'Not yet', status: t.status}))}),
    failed: () => ({title: 'Failed and Reversed Transfer Report', note: 'Failures, rejections and reversals with the reason.',
      cols: [['Transfer', 'id'], ['Customer', 'cust'], ['Amount', 'amount'], ['Reason', 'stage'], ['Status', 'status']],
      rows: TR_TXN.filter(t => ['Failed', 'Rejected', 'Cancelled', 'Reversed'].includes(t.status) && inWindow(t))
        .map(t => ({id: t.id, cust: custName(t.cust), amount: trM(t.amount), stage: t.stage, status: t.status}))}),
    fees: () => ({title: 'Transfer Fees Report', note: 'Fees charged per method, and who paid them.',
      cols: [['Method', 'method'], ['Rate', 'rate'], ['Flat', 'flat'], ['Collected', 'collected'], ['Payer', 'payer']],
      rows: TR_FEES.map(f => ({method: f.method, rate: f.pct ? f.pct + '%' : 'Free', flat: trM(f.flat),
        collected: trM(sum(TR_TXN.filter(t => t.method === f.method && t.status === 'Completed'), t => t.fee)), payer: f.payer}))}),
    reconciliation: () => ({title: 'Reconciliation Report', note: 'The ledger against the account balance, account by account.',
      cols: [['Account', 'account'], ['Customer', 'cust'], ['Available', 'available'], ['Reserved', 'reserved'], ['Ledger', 'ledger'], ['Agrees', 'agrees']],
      rows: TR_ACCOUNTS.map(a => { const d = TR_DISCREPANCY.find(x => x.account === a.id);
        return {account: a.id, cust: custName(a.cust), available: trM(a.available), reserved: trM(a.reserved),
          ledger: trM(a.ledger), agrees: d ? 'No — ' + trM(Math.abs(d.difference)) + ' out' : 'Yes'}; })}),
    beneficiaries: () => ({title: 'Beneficiary Report', note: 'Saved beneficiaries, their state and their checks.',
      cols: [['Beneficiary', 'id'], ['Name', 'name'], ['Kind', 'kind'], ['Customer', 'cust'], ['Verified', 'verified'], ['State', 'status']],
      rows: TR_BENEFICIARIES.map(b => ({id: b.id, name: b.name, kind: b.kind, cust: custName(b.cust),
        verified: b.verified, status: b.status}))}),
    authorised: () => ({title: 'Authorised Transfer Report', note: 'Every approval, who gave it and when.',
      cols: [['When', 'when'], ['Transfer', 'ref'], ['Level', 'level'], ['Decision', 'action'], ['Officer', 'by'], ['Notes', 'notes']],
      rows: TR_APPROVAL_HISTORY.map(a => ({when: trWhen(a.when), ref: a.ref, level: a.level, action: a.action,
        by: staffName(a.by), notes: a.notes}))})
  };
  const out = (R[key] || R.daily)();
  out.key = key;
  return out;
}

function renderReports(){
  if(el('rpPill')){ el('rpPill').className = 'badge b-gray'; el('rpPill').textContent = TR_REPORTS.length + ' reports'; }
  put('rpKpis', [
    ['Reports available', num(TR_REPORTS.length), 'Every transfer question', ''],
    ['Exports made', num(EXPORTS.length), 'Recorded in the history', ''],
    ['Formats', '4', 'Preview · CSV · Excel · PDF', ''],
    ['Daily report rows', num(trReport('daily').rows.length), 'Built from the live register', ''],
    ['Reconciliation rows', num(trReport('reconciliation').rows.length), 'Every customer account', ''],
    ['Configuration changes', num(TR_CHANGES.length), 'Who changed what, and when', ''],
    ['Audit entries', num(TR_AUDIT.length + TR_FRAUD.length), 'Security and settings events', ''],
    ['Report window', fmtDate(FILTER.from) + ' – ' + fmtDate(FILTER.to), 'Follows the filter bar', '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join(''));

  if(el('rpCount')) el('rpCount').textContent = TR_REPORTS.length + ' ready';
  if(el('packMsg') && !String(el('packMsg').textContent || '').trim())
    el('packMsg').textContent = 'The pack follows the filters above — ' + filterLine() + '.';
  put('rpCards', TR_REPORTS.map(r => `<div class="repcard">
      <div class="rt">${esc(r.title)}</div>
      <div class="rd">${esc(r.desc)}</div>
      <div class="acts">
        <button class="btn btn-ghost" data-trrep="${esc(r.key)}" data-fmt="preview">Preview</button>
        <button class="btn btn-ghost" data-trrep="${esc(r.key)}" data-fmt="csv">CSV</button>
        <button class="btn btn-ghost" data-trrep="${esc(r.key)}" data-fmt="xlsx">Excel</button>
        <button class="btn btn-ghost" data-trrep="${esc(r.key)}" data-fmt="pdf">PDF</button>
      </div></div>`).join(''));

  if(el('chgPill')) el('chgPill').textContent = num(TR_CHANGES.length) + ' changes';
  renderTable('chgBody', [
    {k: 'when', label: 'When', html: v => esc(trWhen(v))},
    {k: 'what', label: 'Setting'},
    {k: 'from', label: 'Previous'},
    {k: 'to', label: 'Updated'},
    {k: 'by', label: 'Officer', html: v => esc(staffName(v))}
  ], TR_CHANGES, {sort: 'when', pageSize: 6});

  const last = TR_CHANGES[0] || {};
  if(el('chgWhoPill')) el('chgWhoPill').textContent = last.by ? staffName(last.by) : '—';
  put('chgWho', kvRow('Setting', last.what || '—') + kvRow('Area', last.area || '—')
    + kvRow('Changed from', last.from || '—') + kvRow('Changed to', last.to || '—')
    + kvRow('Officer', last.by ? staffName(last.by) + ' · ' + last.by : '—')
    + kvRow('Role', last.by ? ((STAFF_BY_ID[last.by] || {}).role || 'Staff') : '—'));
  put('chgStamp', kvRow('Timestamp', trWhen(last.when || TODAY + ' 08:15'))
    + kvRow('Record ID', 'CFG-' + pad(TR_CHANGES.length, 4))
    + kvRow('Written to', 'configuration_changes')
    + kvRow('Audit kept for', '7 years')
    + kvRow('Second signature', last.area === 'Approvals' ? 'Finance Manager' : 'Not required')
    + kvRow('Immutable', okb('Yes')));

  const allowed = ['Finance Manager', 'Administrator', 'Super Admin', 'Auditor'];
  if(el('rpAuthPill')) el('rpAuthPill').textContent = allowed.length + ' roles';
  renderTable('rpAuthBody', [
    {k: 'role', label: 'Role'},
    {k: 'reports', label: 'Reports'},
    {k: 'formats', label: 'Formats'},
    {k: 'allowed', label: 'Export', html: v => badge(v, v ? 'b-ok' : 'b-gray')}
  ], TR_ROLES.map(r => ({role: r, reports: allowed.includes(r) ? 'All twelve' : 'Preview only',
    formats: allowed.includes(r) ? 'CSV · Excel · PDF' : 'On screen', allowed: allowed.includes(r)})), {sort: 'role', pageSize: 6});
  if(el('rpAuthMsg') && !String(el('rpAuthMsg').textContent || '').trim())
    el('rpAuthMsg').textContent = 'Exporting a report writes a row to the generation history with your name on it.';

  put('rpGrid',
    chartBox({title: 'Transfer trend', sub: 'Value by day, MWK', type: 'line', h: 200,
      cats: TR_DAILY.map(d => d.label),
      series: [{name: 'Value', data: TR_DAILY.map(d => d.value)}], value: compact(trS().totalAmount)}) +
    chartBox({title: 'Volume by type', sub: 'Every transfer on the register', type: 'donut', h: 200,
      cats: ['Internal', 'Savings', 'Loan', 'Bank', 'Mobile'],
      series: [{name: 'Transfers', data: ['Internal', 'Savings', 'Loan', 'Bank', 'Mobile'].map(k => TR_TXN.filter(t => t.type === k).length)}],
      value: num(TR_TXN.length)}));
  renderExportHistory();
  renderChanges();
  renderSettings();
}

function renderChanges(){
  if(el('chgPill')) el('chgPill').textContent = num(TR_CHANGES.length) + ' changes';
}
function trConfigKeys(){
  return [
    ['currency', 'Currency', 'setCcy', 'select'],
    ['decimals', 'Decimals kept', 'setDecimals', 'select'],
    ['transferPrefix', 'Transfer prefix', 'setTrfPrefix', 'text'],
    ['receiptPrefix', 'Receipt prefix', 'setRcPrefix', 'text'],
    ['receiptDigits', 'Receipt digits', 'setRcDigits', 'number'],
    ['duplicateWindow', 'Duplicate window', 'setDupWindow', 'number'],
    ['minTransfer', 'Minimum transfer', 'setMinTransfer', 'number'],
    ['maxTransfer', 'Maximum transfer', 'setMaxTransfer', 'number'],
    ['minInternal', 'Minimum internal', 'setMinInternal', 'number'],
    ['maxInternal', 'Maximum internal', 'setMaxInternal', 'number'],
    ['dailyTransferLimit', 'Daily transfer limit', 'setDailyTransferLimit', 'number'],
    ['perCustomerDailyLimit', 'Per-customer daily limit', 'setPerCustomerDailyLimit', 'number'],
    ['feePayer', 'Fee payer', 'setFeePayer', 'select']
  ];
}
function renderSettings(){
  const keys = trConfigKeys();
  keys.forEach(([k, , id, kind]) => {
    const n = el(id);
    if(!n) return;
    if(kind === 'number') n.value = TR_SET[k];
    else n.value = TR_SET[k];
  });
  if(el('setPill')) el('setPill').textContent = 'Saved ' + trWhen(TODAY + ' 08:12');
  put('setRuleBox', `<div class="minihead">The rules in force</div>`
    + kvRow('Internal rule', esc(TR_SET.internalRule))
    + kvRow('External rule', esc(TR_SET.externalRule))
    + kvRow('Settlement', esc(TR_SET.settlementWindow))
    + kvRow('Third-party internal', TR_SET.allowThirdPartyInternal ? okb('Allowed') : badge('Blocked', 'b-crit'))
    + kvRow('Sandbox', TR_SET.sandbox ? badge('On', 'b-warn') : okb('Off')));
  if(el('setMsg') && !String(el('setMsg').textContent || '').trim())
    el('setMsg').textContent = 'Limits and numbering are live — saving writes a row into the change history above.';
}

/* ===================== actions ===================== */
function trRecord(area, what, from, to){
  trLogChange(area, what, String(from), String(to));
  TR_AUDIT_LOG.unshift({when: TODAY + ' ' + trNow(), action: 'Configuration change', target: what,
    detail: from + ' → ' + to, by: staffName('STF-001'), lane: 'Security', severity: 'Low', owner: 'STF-001', region: 'Lilongwe'});
  toast(what + ' updated');
}
function trSaveSettings(){
  const keys = trConfigKeys();
  let changed = 0;
  keys.forEach(([k, label, id, kind]) => {
    const n = el(id);
    if(!n) return;
    const v = kind === 'number' ? Number(n.value) : n.value;
    if(v !== '' && v !== null && !Number.isNaN(v) && String(v) !== String(TR_SET[k])){
      trRecord('Settings', label, TR_SET[k], v);
      TR_SET[k] = v; changed++;
    }
  });
  renderAll();
  toast(changed ? changed + ' setting' + (changed === 1 ? '' : 's') + ' saved' : 'Nothing changed — the settings already match');
}
function trResetSettings(){
  Object.keys(TR_SET_DEFAULTS).forEach(k => { TR_SET[k] = TR_SET_DEFAULTS[k]; });
  trLogChange('Settings', 'Restore defaults', 'Current values', 'Factory defaults');
  TR_AUDIT_LOG.unshift({when: TODAY + ' ' + trNow(), action: 'Restore defaults', target: 'Transfer settings',
    detail: 'All limits and numbering reset', by: staffName('STF-001'), lane: 'Security', severity: 'Medium', owner: 'STF-001', region: 'Lilongwe'});
  renderAll();
  toast('Settings restored to their defaults');
}

function trNewRow(o){
  const meta = TR_METHOD_BY_NAME[o.method] || {};
  const row = Object.assign({
    id: (o.status === 'Draft' ? 'DRF-' : TR_SET.transferPrefix + '-') + pad(trSeq++, 5),
    when: TODAY + ' ' + trNow(), currency: TR_SET.currency, fee: 0,
    provider: meta.provider || 'Golden ledger',
    ref: (meta.refPrefix || 'TRF') + '-' + pad(ri(100000, 999999), 6),
    description: '', priority: 'Normal', stage: 'Not submitted', initiatedBy: 'STF-001', officer: 'STF-001',
    verifiedBy: '', approvedBy: '', docs: '', notes: '',
    lane: meta.lane || 'Internal', rail: meta.rail || 'Internal',
    severity: 'Low', owner: 'STF-001', region: 'Lilongwe'
  }, o);
  TR_TXN.unshift(row);
  if(row.status === 'Completed') TR_COMPLETED.push(row);
  trAudit('Create transfer', row.id, row.type + ' · ' + trM(row.amount) + ' · ' + row.status);
  return row;
}
function trLedgerWrite(t, note){
  const src = TR_ACC_BY_ID[t.source], dst = TR_ACC_BY_ID[t.dest];
  const when = TODAY + ' ' + trNow();
  if(src){
    src.available = Math.max(0, src.available - t.amount - t.fee);
    src.ledger = src.available + src.reserved; src.outTotal = (src.outTotal || 0) + t.amount + t.fee; src.lastMove = TODAY;
    TR_LEDGER.push({entry: 'TLE-' + pad(8300 + TR_LEDGER.length, 5), when, account: src.id, cust: src.cust, txn: t.id,
      side: 'Debit', amount: -(t.amount + t.fee), balance: src.available, method: t.method, status: 'Posted',
      lane: 'Ledger', severity: 'Low', owner: 'STF-001', region: src.region, note: note || ''});
  }
  if(dst){
    dst.available += t.amount;
    dst.ledger = dst.available + dst.reserved; dst.inTotal = (dst.inTotal || 0) + t.amount; dst.lastMove = TODAY;
    TR_LEDGER.push({entry: 'TLE-' + pad(8301 + TR_LEDGER.length, 5), when, account: dst.id, cust: dst.cust, txn: t.id,
      side: 'Credit', amount: t.amount, balance: dst.available, method: t.method, status: 'Posted',
      lane: 'Ledger', severity: 'Low', owner: 'STF-001', region: dst.region, note: note || ''});
  }
  return true;
}
function trMintReceipt(t){
  const r = {receipt: TR_SET.receiptPrefix + '-' + pad(3200 + TR_RECEIPTS.length, TR_SET.receiptDigits),
    txn: t.id, ref: t.ref, providerRef: t.ref, when: TODAY + ' ' + trNow(), cust: t.cust,
    source: t.source, dest: t.dest, destName: t.destName, amount: t.amount, fee: t.fee,
    method: t.method, status: 'Issued', issued: 'Automatic', lane: 'Receipts', severity: 'Low',
    owner: 'STF-001', region: t.region};
  TR_RECEIPTS.unshift(r);
  return r;
}

/* ---- 2 · create a transfer ---- */
function trNewTransfer(){
  const kind = el('tmNewType').value;
  const method = kind === 'Internal' ? 'Internal transfer' : kind === 'Savings' ? 'Savings transfer'
    : kind === 'Loan' ? 'Loan transfer' : kind === 'Bank' ? 'Bank transfer' : (el('mmProvider') || {}).value || 'Airtel Money';
  const amount = Number(el('tmNewAmount').value) || 0;
  const src = TR_ACC_BY_ID[el('tmNewSourceAcct').value] || TR_ACCOUNTS[0];
  const refuse = m => { toast(m, 'err'); if(el('tmMsg')) el('tmMsg').textContent = m; };
  if(amount < TR_SET.minTransfer){ refuse('The minimum transfer is ' + trM(TR_SET.minTransfer)); return; }
  if(amount > TR_SET.maxTransfer){ refuse('The maximum transfer is ' + trM(TR_SET.maxTransfer)); return; }
  if(amount > src.available){ refuse('The source account ' + src.id + ' only holds ' + trM(src.available)); return; }
  const fee = trFeeFor(method, amount);
  const destVal = el('tmNewDest') ? el('tmNewDest').value : '';
  const ben = TR_BENEFICIARIES.find(b => b.id === destVal);
  const row = trNewRow({
    type: kind, method, category: el('tmNewCategory').value || 'Own accounts',
    source: src.id, dest: ben ? ben.account : destVal || '—',
    destName: ben ? ben.name : custName(src.cust), amount, fee,
    description: el('tmNewDesc').value || 'Raised at the counter', priority: el('tmNewPriority').value,
    status: 'Pending verification', stage: 'Awaiting verification',
    initiatedBy: el('tmNewSource').value === 'Customer-initiated' ? 'Customer' : 'STF-001',
    docs: el('tmNewDocs') && el('tmNewDocs').value ? 'Uploaded document' : ''
  });
  if(row.status === 'Pending verification'){
    TR_VERIFY.unshift({id: 'TVQ-' + pad(520 + TR_VERIFY.length, 3), txn: row.id, ref: row.ref, when: row.when, cust: row.cust,
      source: row.source, dest: row.dest, destName: row.destName, amount: row.amount, fee: row.fee, method: row.method,
      checks: {source: true, destination: true, funds: amount + fee <= src.available, amount: amount <= TR_SET.maxTransfer,
        beneficiary: !!ben, duplicate: !TR_TXN.some(x => x.ref === row.ref && x.id !== row.id)},
      docs: row.docs || 'No document attached', status: 'Pending', notes: '',
      lane: row.lane, severity: 'Medium', owner: 'STF-001', region: src.region});
  }
  el('tmNewDesc').value = '';
  if(el('tmNewRef')) el('tmNewRef').value = TR_SET.transferPrefix + '-' + pad(trSeq, 5);
  renderAll();
  el('tmMsg').textContent = row.id + ' created for ' + trM(amount) + ' — it is now awaiting verification in section 8.';
  toast('Transfer ' + row.id + ' created');
}

/* ---- 3 · internal transfer ---- */
function trInternalSubmit(){
  const chk = trInternalCheck();
  if(!chk.pass){ toast('The transfer fails a check — read the list above', 'err'); return; }
  const row = trNewRow({type: 'Internal', method: 'Internal transfer', category: chk.sameCustomer ? 'Own accounts' : 'Third party',
    source: chk.src.id, dest: chk.dst.id, destName: custName(chk.dst.cust), amount: chk.amount, fee: 0,
    description: (el('itDesc') || {}).value || 'Between accounts', status: 'Completed', stage: 'Posted to both accounts',
    verifiedBy: 'STF-001', approvedBy: 'STF-001'});
  trLedgerWrite(row, 'Internal transfer');
  const rc = trMintReceipt(row);
  put('itReceiptBox', `<div class="note gold"><div><b>Receipt ${esc(rc.receipt)}</b> — ${esc(trM(row.amount))} moved from
      ${esc(row.source)} to ${esc(row.dest)} for ${esc(custName(row.cust))}. The ledger carries both entries.</div></div>`);
  renderAll();
  el('itMsg').textContent = row.id + ' posted — ' + trM(row.amount) + ' is now in ' + row.dest + '.';
  toast('Internal transfer posted');
}

/* ---- 4 · savings transfer ---- */
function trSavingsSubmit(){
  const acc = TR_ACC_BY_ID[el('svAccount').value] || TR_SAVINGS[0];
  const dest = TR_ACC_BY_ID[el('svDest').value];
  const amount = Number(el('svAmount').value) || 0;
  const dir = el('svDir').value;
  if(!amount || amount < TR_SET.minInternal){ toast('Enter at least ' + trM(TR_SET.minInternal), 'err'); return; }
  const drawing = dir === 'Out of savings' || (dir === 'Between savings accounts' && !/^SAV/.test((dest || {}).id || ''));
  if(drawing && acc.restriction !== 'None'){ toast('This savings account carries a restriction: ' + acc.restriction, 'err'); return; }
  if(amount > acc.available){ toast('Only ' + trM(acc.available) + ' is available in ' + acc.id, 'err'); return; }
  const row = trNewRow({type: 'Savings', method: 'Savings transfer', category: 'Savings',
    source: acc.id, dest: dest ? dest.id : acc.id, destName: dest ? custName(dest.cust) : custName(acc.cust),
    amount, fee: 0, description: dir, status: 'Completed', stage: 'Posted to both accounts',
    verifiedBy: 'STF-001', approvedBy: 'STF-001'});
  trLedgerWrite(row, dir);
  const rc = trMintReceipt(row);
  put('svReceiptBox', `<div class="note gold"><div><b>Receipt ${esc(rc.receipt)}</b> — ${esc(dir.toLowerCase())}:
      ${esc(trM(amount))} between ${esc(row.source)} and ${esc(row.dest)}. Savings now holds ${esc(trM(acc.available))}.</div></div>`);
  renderAll();
  el('svMsg').textContent = row.id + ' posted. ' + acc.id + ' now holds ' + trM(acc.available) + '.';
  toast('Savings transfer posted');
}
function trSavingsStatement(){
  const acc = TR_ACC_BY_ID[el('svAccount').value] || TR_SAVINGS[0];
  const rows = TR_LEDGER.filter(e => e.account === acc.id).slice(0, 40);
  printTable('Savings statement · ' + acc.id,
    [{label: 'Entry'}, {label: 'When'}, {label: 'Side'}, {label: 'Amount', num: true}, {label: 'Balance', num: true}],
    rows.map(e => [e.entry, trWhen(e.when), e.side, trM(e.amount), trM(e.balance)]));
  logExport('Savings statement · ' + acc.id, 'PDF', rows.length);
  toast('Statement ready to print');
}

/* ---- 5 · loan transfer ---- */
function trPostLoan(){
  const loan = trLoanOf(el('lnLoan').value);
  const src = TR_ACC_BY_ID[el('lnSource').value] || TR_ACCOUNTS[0];
  const amount = Number(el('lnAmount').value) || 0;
  const repayment = el('lnType').value === 'Loan repayment';
  if(loan.cust !== src.cust){ toast('The source account does not belong to the borrower', 'err'); return; }
  if(loan.status === 'Written off'){ toast('A written-off loan cannot take a transfer', 'err'); return; }
  if(!amount){ toast('Enter an amount', 'err'); return; }
  if(repayment && amount > loan.outstanding && loan.outstanding > 0){
    toast('The outstanding balance is only ' + trM(loan.outstanding), 'err'); return;
  }
  if(!repayment && amount > loan.outstanding){ toast('A disbursement cannot exceed the outstanding balance', 'err'); return; }
  const status = amount > TR_SET.approvalThreshold ? 'Pending approval' : 'Completed';
  const row = trNewRow({type: 'Loan', method: 'Loan transfer', category: repayment ? 'Loan repayment' : 'Loan disbursement',
    source: src.id, dest: loan.ref, destName: custName(loan.cust) + ' · ' + loan.ref, amount, fee: 0,
    description: (el('lnType').value), status, stage: status === 'Completed' ? 'Posted to both accounts' : 'Awaiting approval',
    verifiedBy: 'STF-001', approvedBy: status === 'Completed' ? 'STF-001' : ''});
  if(status === 'Completed'){
    loan.paidPrincipal = Math.min(loan.amount, loan.paidPrincipal + (repayment ? amount : 0));
    loan.outstanding = Math.max(0, loan.amount - loan.paidPrincipal);
    TR_LEDGER.push({entry: 'TLE-' + pad(8300 + TR_LEDGER.length, 5), when: TODAY + ' ' + trNow(), account: src.id, cust: src.cust,
      txn: row.id, side: 'Debit', amount: -amount, balance: src.available, method: 'Loan transfer', status: 'Posted',
      lane: 'Ledger', severity: 'Low', owner: 'STF-001', region: src.region});
    trMintReceipt(row);
  } else {
    TR_APPROVALS.unshift({id: 'TAP-' + pad(430 + TR_APPROVALS.length, 3), txn: row.id, ref: row.ref, when: row.when,
      cust: row.cust, amount, fee: 0, method: 'Loan transfer', source: row.source, dest: row.dest, destName: row.destName,
      level: amount > TR_SET.secondApprovalThreshold ? 'Management' : 'First level',
      level1: 'Pending', level2: 'Pending', risk: 'Medium', selfApproval: false, status: 'Pending', notes: '',
      lane: 'Loan', severity: 'Medium', owner: 'STF-001', region: src.region});
  }
  renderAll();
  el('lnMsg').textContent = row.id + ' ' + (status === 'Completed' ? 'applied to ' + loan.ref : 'is waiting for approval') +
    ' · outstanding now ' + trM(loan.outstanding) + '.';
  toast(status === 'Completed' ? 'Loan transfer applied' : 'Loan transfer sent for approval');
}

/* ---- 6 · bank transfer ---- */
function trBankVerify(){
  const name = (el('bkName').value || '').trim();
  const acct = (el('bkAcct').value || '').replace(/\s/g, '');
  const ok = name.length >= 4 && /^\d{8,20}$/.test(acct);
  if(el('bkMsg')) el('bkMsg').textContent = ok
    ? 'Beneficiary “' + name + '” at ' + el('bkBank').value + ' verified — the name and account agree with the bank record.'
    : 'The beneficiary could not be verified: enter a full name and an account number of eight to twenty digits.';
  toast(ok ? 'Beneficiary verified' : 'Beneficiary not verified', ok ? 'ok' : 'err');
  return ok;
}
function trBankSubmit(){
  const src = TR_ACC_BY_ID[el('bkSource').value] || TR_ACCOUNTS[0];
  const amount = Number(el('bkAmount').value) || 0;
  const lim = TR_LIMITS.find(l => l.method === 'Bank transfer') || TR_LIMITS[0];
  if(!trBankVerify()) return;
  if(amount < lim.min || amount > lim.max){ toast('A bank transfer must sit between ' + trM(lim.min) + ' and ' + trM(lim.max), 'err'); return; }
  const fee = trFeeFor('Bank', amount);
  if(amount + fee > src.available){ toast('The source account only holds ' + trM(src.available), 'err'); return; }
  const status = amount > TR_SET.approvalThreshold ? 'Pending approval' : 'Completed';
  const row = trNewRow({type: 'Bank', method: 'Bank transfer', category: 'Bank payout', source: src.id,
    dest: el('bkBank').value + ' · ' + el('bkAcct').value, destName: el('bkName').value, amount, fee,
    description: el('bkRef') ? el('bkRef').value || 'Bank payout' : 'Bank payout',
    status, stage: status === 'Completed' ? 'Cleared by the bank' : 'Awaiting approval',
    verifiedBy: 'STF-001', approvedBy: status === 'Completed' ? 'STF-001' : '',
    docs: el('bkDocs') && el('bkDocs').value ? 'Uploaded document' : ''});
  if(status === 'Completed'){
    trLedgerWrite(row, 'Bank payout');
    const rc = trMintReceipt(row);
    put('bkReceiptBox', `<div class="note gold"><div><b>Receipt ${esc(rc.receipt)}</b> — ${esc(trM(amount))} sent to
        ${esc(row.destName)} at ${esc(el('bkBank').value)}. Provider reference ${esc(row.ref)}.</div></div>`);
  } else {
    TR_APPROVALS.unshift({id: 'TAP-' + pad(430 + TR_APPROVALS.length, 3), txn: row.id, ref: row.ref, when: row.when,
      cust: row.cust, amount, fee, method: 'Bank transfer', source: row.source, dest: row.dest, destName: row.destName,
      level: amount > TR_SET.secondApprovalThreshold ? 'Management' : 'First level',
      level1: 'Pending', level2: 'Pending', risk: 'High', selfApproval: false, status: 'Pending', notes: '',
      lane: 'Bank', severity: 'High', owner: 'STF-001', region: src.region});
  }
  renderAll();
  el('bkMsg').textContent = row.id + (status === 'Completed' ? ' cleared — ' + trM(amount) + ' left ' + src.id + '.'
    : ' is over the approval threshold and is waiting for a signature.');
  toast('Bank transfer ' + row.id + ' created');
}

/* ---- 7 · mobile money ---- */
function trMobileVerify(){
  const num2 = (el('mmNumber').value || '').replace(/\s/g, '');
  const name = (el('mmName').value || '').trim();
  const ok = /^0\d{9}$/.test(num2) && name.length >= 3;
  if(el('mmMsg')) el('mmMsg').textContent = ok
    ? 'Recipient “' + name + '” on ' + el('mmProvider').value + ' verified — the wallet is registered and open.'
    : 'The wallet could not be verified: enter a ten-digit number starting with zero and the registered name.';
  toast(ok ? 'Recipient verified' : 'Recipient not verified', ok ? 'ok' : 'err');
  return ok;
}
function trMobileSubmit(){
  const provider = el('mmProvider').value;
  const src = TR_ACC_BY_ID[el('mmSource').value] || TR_ACCOUNTS[0];
  const amount = Number(el('mmAmount').value) || 0;
  const lim = TR_LIMITS.find(l => l.method === provider) || TR_LIMITS[4];
  if(!trMobileVerify()) return;
  if(amount < lim.min || amount > lim.max){ toast('A ' + provider + ' payout must sit between ' + trM(lim.min) + ' and ' + trM(lim.max), 'err'); return; }
  const fee = trFeeFor(provider, amount);
  if(amount + fee > src.available){ toast('The source account only holds ' + trM(src.available), 'err'); return; }
  const status = amount > TR_SET.approvalThreshold ? 'Pending approval' : 'Completed';
  const row = trNewRow({type: 'Mobile', method: provider, category: 'Mobile wallet', source: src.id,
    dest: el('mmNumber').value, destName: el('mmName').value.trim(), amount, fee,
    description: 'Wallet payout', status, stage: status === 'Completed' ? 'Acknowledged by the wallet' : 'Awaiting approval',
    verifiedBy: 'STF-001', approvedBy: status === 'Completed' ? 'STF-001' : ''});
  if(status === 'Completed'){
    trLedgerWrite(row, 'Wallet payout');
    const rc = trMintReceipt(row);
    put('mmReceiptBox', `<div class="note gold"><div><b>Receipt ${esc(rc.receipt)}</b> — ${esc(trM(amount))} sent to
        ${esc(row.destName)} on ${esc(provider)}. Provider reference ${esc(row.ref)}.</div></div>`);
  } else {
    TR_APPROVALS.unshift({id: 'TAP-' + pad(430 + TR_APPROVALS.length, 3), txn: row.id, ref: row.ref, when: row.when,
      cust: row.cust, amount, fee, method: provider, source: row.source, dest: row.dest, destName: row.destName,
      level: 'First level', level1: 'Pending', level2: 'Pending', risk: 'Medium', selfApproval: false, status: 'Pending',
      notes: '', lane: 'Mobile money', severity: 'Medium', owner: 'STF-001', region: src.region});
  }
  renderAll();
  el('mmMsg').textContent = row.id + (status === 'Completed' ? ' acknowledged — ' + trM(amount) + ' left ' + src.id + '.'
    : ' is waiting for approval.');
  toast('Wallet transfer ' + row.id + ' created');
}

/* ---- 8 · verification ---- */
function trVerifyAction(which){
  const v = trVerifyItem();
  if(!v){ toast('Nothing in the queue', 'err'); return; }
  const note = (el('tvNote') || {}).value || '';
  const t = TR_TXN.find(x => x.id === v.txn);
  if(which === 'approve'){
    if(!trVerifyPassed(v)){ toast('This transfer still fails a check — it cannot be approved', 'err'); return; }
    v.status = 'Verified';
    if(t){ t.status = t.amount > TR_SET.approvalThreshold ? 'Pending approval' : 'Processing';
      t.stage = t.status === 'Pending approval' ? 'Awaiting approval' : 'At the provider'; t.verifiedBy = 'STF-001'; }
    TR_VERIFY_HISTORY.unshift({when: TODAY + ' ' + trNow(), ref: v.ref, action: 'Approved', by: 'STF-001',
      notes: note || 'Source, destination, funds and beneficiary all agreed'});
  } else {
    v.status = 'Rejected';
    if(t){ t.status = 'Rejected'; t.stage = 'Refused at verification'; }
    TR_VERIFY_HISTORY.unshift({when: TODAY + ' ' + trNow(), ref: v.ref, action: 'Rejected', by: 'STF-001',
      notes: note || 'Failed a verification check'});
  }
  trAudit(which === 'approve' ? 'Verified transfer' : 'Rejected transfer', v.ref, note || 'No note left');
  TR_SEL.verify = '';
  renderAll();
  el('tvMsg').textContent = v.id + (which === 'approve' ? ' verified — the transfer moved on.' : ' rejected and the customer will be told.');
  toast(which === 'approve' ? 'Transfer verified' : 'Transfer rejected');
}
function trApproveAllVerify(){
  const pass = TR_VERIFY.filter(v => v.status === 'Pending' && trVerifyPassed(v));
  if(!pass.length){ toast('Nothing passes every check right now', 'err'); return; }
  pass.forEach(v => {
    v.status = 'Verified';
    const t = TR_TXN.find(x => x.id === v.txn);
    if(t){ t.status = t.amount > TR_SET.approvalThreshold ? 'Pending approval' : 'Processing';
      t.stage = t.status === 'Pending approval' ? 'Awaiting approval' : 'At the provider'; t.verifiedBy = 'STF-001'; }
    TR_VERIFY_HISTORY.unshift({when: TODAY + ' ' + trNow(), ref: v.ref, action: 'Approved', by: 'STF-001',
      notes: 'Bulk approval — every check passed'});
  });
  trAudit('Bulk verify', pass.length + ' transfers', 'Every check passed');
  renderAll();
  el('tvMsg').textContent = pass.length + ' transfer' + (pass.length === 1 ? '' : 's') + ' verified in one pass.';
  toast(pass.length + ' transfers verified');
}
function trAutoVerify(){
  const small = TR_VERIFY.filter(v => v.status === 'Pending' && v.amount <= TR_SET.minTransfer * 2 && trVerifyPassed(v));
  if(!small.length){ toast('No small transfer is eligible for automatic verification', 'err'); return; }
  small.forEach(v => {
    v.status = 'Verified';
    const t = TR_TXN.find(x => x.id === v.txn);
    if(t){ t.status = 'Processing'; t.stage = 'At the provider'; t.verifiedBy = 'Auto rule'; }
    TR_VERIFY_HISTORY.unshift({when: TODAY + ' ' + trNow(), ref: v.ref, action: 'Approved', by: 'STF-001',
      notes: 'Automatic rule — small amount, every check passed'});
  });
  renderAll();
  el('tvMsg').textContent = small.length + ' small transfer' + (small.length === 1 ? '' : 's') + ' verified automatically.';
  toast('Automatic verification ran');
}

/* ---- 9 · approvals ---- */
function trApproval(level){
  const a = trApproveItem();
  if(!a || a.status !== 'Pending'){ toast('Select a request in the queue', 'err'); return; }
  const t = TR_TXN.find(x => x.id === a.txn);
  if(a.selfApproval && level === 'first'){ toast('The officer who raised it may not approve it', 'err'); return; }
  if(level === 'first'){
    a.level1 = 'Approved'; a.notes = 'First-level approval given';
  } else {
    if(a.level1 !== 'Approved'){ toast('First-level approval must be given first', 'err'); return; }
    a.level2 = 'Approved'; a.status = 'Approved';
    if(t){ t.approvedBy = 'STF-009'; t.status = 'Processing'; t.stage = 'At the provider'; }
    TR_APPROVAL_HISTORY.unshift({when: TODAY + ' ' + trNow(), ref: a.ref, action: 'Approved', level: 'Management',
      by: 'STF-009', notes: a.notes || 'Limits, funds and beneficiary all clear'});
  }
  if(level === 'first') TR_APPROVAL_HISTORY.unshift({when: TODAY + ' ' + trNow(), ref: a.ref, action: 'Approved',
    level: 'First level', by: 'STF-001', notes: a.notes});
  trAudit('Approval', a.ref, level + ' level');
  renderAll();
  el('taMsg').textContent = a.ref + (level === 'first' ? ' has first-level approval.' : ' is fully approved and has gone to the provider.');
  toast(level === 'first' ? 'First-level approval given' : 'Management approval given');
}
function trApprovalReject(){
  const a = trApproveItem();
  if(!a || a.status !== 'Pending'){ toast('Select a request in the queue', 'err'); return; }
  a.status = 'Rejected';
  const t = TR_TXN.find(x => x.id === a.txn);
  if(t){ t.status = 'Rejected'; t.stage = 'Refused at approval'; }
  TR_APPROVAL_HISTORY.unshift({when: TODAY + ' ' + trNow(), ref: a.ref, action: 'Rejected', level: a.level,
    by: 'STF-001', notes: 'Refused at approval'});
  trAudit('Reject at approval', a.ref, a.level);
  renderAll();
  el('taMsg').textContent = a.ref + ' was rejected.';
  toast('Request rejected');
}
function trApprovalReturn(){
  const a = trApproveItem();
  if(!a || a.status !== 'Pending'){ toast('Select a request in the queue', 'err'); return; }
  a.level1 = 'Pending'; a.level2 = 'Pending';
  const t = TR_TXN.find(x => x.id === a.txn);
  if(t){ t.status = 'Pending verification'; t.stage = 'Returned for verification'; }
  TR_APPROVAL_HISTORY.unshift({when: TODAY + ' ' + trNow(), ref: a.ref, action: 'Returned for review', level: a.level,
    by: 'STF-001', notes: 'Sent back for another look'});
  renderAll();
  el('taMsg').textContent = a.ref + ' was returned for review.';
  toast('Returned for review');
}
function trSaveThresholds(){
  const one = Number(el('taAppr1').value), two = Number(el('taAppr2').value);
  if(!one || !two || two <= one){ toast('The second threshold must be above the first', 'err'); return; }
  trRecord('Approvals', 'Approval threshold', trM(TR_SET.approvalThreshold), trM(one));
  trRecord('Approvals', 'Second approval threshold', trM(TR_SET.secondApprovalThreshold), trM(two));
  TR_SET.approvalThreshold = one; TR_SET.secondApprovalThreshold = two;
  renderAll();
  el('taMsg').textContent = 'Thresholds saved: one signature above ' + trM(one) + ', two above ' + trM(two) + '.';
  toast('Approval thresholds saved');
}

/* ---- 10 · processing ---- */
function trSetStatus(){
  const sel = TR_TXN.find(t => t.id === TR_SEL.txn);
  const next = el('stStatusSel').value;
  if(!sel){ toast('Select a transfer first', 'err'); return; }
  if(sel.status === next){ toast('The transfer is already ' + next, 'err'); return; }
  const before = sel.status;
  sel.status = next;
  sel.stage = next === 'Completed' ? 'Posted to both accounts' : next === 'Failed' ? 'Provider refused'
    : next === 'Reversed' ? 'Reversal posted' : next === 'Processing' ? 'At the provider' : 'Status changed by staff';
  if(next === 'Completed'){ trLedgerWrite(sel, 'Completing a held transfer'); trMintReceipt(sel); TR_COMPLETED.push(sel); }
  trAudit('Status change', sel.id, before + ' → ' + next);
  renderAll();
  el('stDetail').scrollIntoView && null;
  toast(sel.id + ' moved to ' + next);
}
function trReceiptForTxn(){
  const sel = TR_TXN.find(t => t.id === TR_SEL.txn);
  if(!sel){ toast('Select a transfer first', 'err'); return; }
  const rc = TR_RECEIPTS.find(r => r.txn === sel.id) || trMintReceipt(sel);
  put('stReceiptBox', `<div class="note gold"><div><b>Receipt ${esc(rc.receipt)}</b> for ${esc(sel.id)} ·
      ${esc(trM(sel.amount))} · ${esc(sel.method)} · issued ${esc(trWhen(rc.when))}</div></div>`);
  renderAll();
  toast('Receipt ' + rc.receipt + ' issued');
}
function trScanDuplicates(){
  const seen = {};
  TR_TXN.forEach(t => { seen[t.ref] = seen[t.ref] || []; seen[t.ref].push(t); });
  const groups = Object.keys(seen).filter(k => seen[k].length > 1);
  TR_DUPLICATES.length = 0;
  groups.slice(0, 3).forEach(k => TR_DUPLICATES.push({ref: k, count: seen[k].length,
    amount: sum(seen[k], t => t.amount), ids: seen[k].map(t => t.id).join(' · '), status: 'Held'}));
  trAudit('Duplicate scan', groups.length + ' groups', 'Across ' + TR_TXN.length + ' transfers');
  renderAll();
  toast(groups.length ? groups.length + ' duplicate group(s) held' : 'No duplicate reference found');
}

/* ---- 11 · ledger ---- */
function trRecalcBalances(){
  TR_ACCOUNTS.forEach(a => { a.ledger = a.available + a.reserved; });
  trAudit('Recalculate balances', TR_ACCOUNTS.length + ' accounts', 'Ledger recomputed from available and reserved');
  renderAll();
  el('ldMsg').textContent = 'Every balance recalculated — the ledger now equals available plus reserved on all ' +
    TR_ACCOUNTS.length + ' accounts.';
  toast('Balances recalculated');
}
function trReconcileLedger(){
  const diff = Math.abs(sum(TR_LEDGER, e => e.amount));
  trAudit('Reconcile ledger', 'Whole book', diff < 1 ? 'Balanced' : 'Out by ' + trM(diff));
  renderAll();
  el('ldMsg').textContent = diff < 1
    ? 'The ledger balances: every debit has its credit and the net movement is zero.'
    : 'The ledger is out by ' + trM(diff) + ' — post an adjustment after investigating.';
  toast(diff < 1 ? 'Ledger balanced' : 'Ledger out of balance', diff < 1 ? 'ok' : 'err');
}
function trPostAdjustment(){
  const acct = TR_ACC_BY_ID[el('ldAdjAcct').value];
  const amount = Number(el('ldAdjAmount').value) || 0;
  const reason = (el('ldAdjReason').value || '').trim();
  if(!acct || !amount){ toast('An adjustment needs an account and an amount', 'err'); return; }
  if(!reason){ toast('An adjustment needs a reason', 'err'); return; }
  const row = {id: 'TAD-' + pad(118 + TR_ADJUST.length, 3), when: TODAY + ' ' + trNow(), account: acct.id, amount,
    reason, by: 'STF-001', approver: 'STF-009', status: amount < 0 ? 'Pending' : 'Approved',
    lane: 'Ledger', severity: 'Medium', owner: 'STF-001', region: acct.region};
  TR_ADJUST.unshift(row);
  acct.available = Math.max(0, acct.available + amount);
  acct.ledger = acct.available + acct.reserved;
  TR_LEDGER.push({entry: 'TLE-' + pad(8300 + TR_LEDGER.length, 5), when: row.when, account: acct.id, cust: acct.cust,
    txn: row.id, side: amount >= 0 ? 'Credit' : 'Debit', amount, balance: acct.available, method: 'Adjustment',
    status: 'Posted', lane: 'Ledger', severity: 'Medium', owner: 'STF-001', region: acct.region});
  trAudit('Adjustment', acct.id, trM(amount) + ' · ' + reason);
  el('ldAdjAmount').value = ''; el('ldAdjReason').value = '';
  renderAll();
  el('ldMsg').textContent = row.id + ' posted on ' + acct.id + ' for ' + trM(amount) + ' — ' + reason + '.';
  toast('Adjustment ' + row.id + ' posted');
}

/* ---- 12 · fees and limits ---- */
function trCalcFee(){
  renderFees();
  toast('Fee calculated');
}
function trSaveLimits(){
  const changed = [];
  TR_LIMITS.forEach((l, i) => {
    const min = el('limMin' + i), max = el('limMax' + i), daily = el('limDaily' + i);
    if(!min || !max) return;
    const nmin = Number(min.value), nmax = Number(max.value);
    const ndaily = daily ? Number(daily.value) : l.daily;
    if(nmin !== l.min || nmax !== l.max || ndaily !== l.daily){
      changed.push(l.method);
      trLogChange('Limits', l.method + ' limits', trM(l.min) + '–' + trM(l.max), trM(nmin) + '–' + trM(nmax));
      l.min = nmin; l.max = nmax; l.daily = ndaily;
    }
  });
  renderAll();
  el('flMsg').textContent = changed.length ? 'Saved limits for ' + changed.join(', ') + '.'
    : 'Nothing changed — the limits already match.';
  toast(changed.length ? changed.length + ' limit row(s) saved' : 'No limit changed');
}

/* ---- 13 · beneficiaries ---- */
function trBenForm(){
  return {cust: el('bnCust').value, name: el('bnName').value.trim(), kind: el('bnKind').value,
    bank: el('bnBank').value, account: el('bnAcct').value.trim(), ccy: el('bnCcy').value};
}
function trBenAdd(){
  const f = trBenForm();
  if(f.name.length < 4){ toast('Enter the beneficiary’s full name', 'err'); return; }
  if(!f.account){ toast('Enter the account or wallet number', 'err'); return; }
  if(TR_BENEFICIARIES.some(b => b.cust === f.cust && b.account.replace(/\s/g, '') === f.account.replace(/\s/g, ''))){
    toast('That payee is already saved for this customer', 'err'); return;
  }
  const b = {id: 'BEN-' + pad(3100 + TR_BENEFICIARIES.length, 4), cust: f.cust, name: f.name, kind: f.kind,
    bank: f.kind === 'Bank account' ? f.bank : f.kind === 'Mobile money' ? f.bank : '',
    account: f.account, provider: f.kind === 'Bank account' ? 'Bank transfer'
      : f.kind === 'Mobile money' ? f.bank : 'Golden ledger',
    verified: 'Unverified', status: 'Enabled', added: TODAY, lastUsed: TODAY, lane: f.kind === 'Bank account' ? 'Bank'
      : f.kind === 'Mobile money' ? 'Mobile money' : 'Internal', severity: 'Medium', owner: 'STF-001',
    region: (CUST_BY_ID[f.cust] || {}).region || 'Lilongwe'};
  TR_BENEFICIARIES.unshift(b);
  TR_BEN_HISTORY.unshift({when: TODAY + ' ' + trNow(), ben: b.id, name: b.name, action: 'Added', from: '—', to: b.account,
    by: 'STF-001', status: 'Unverified', lane: b.lane, severity: 'Medium', owner: 'STF-001', region: b.region});
  trAudit('Add beneficiary', b.id, b.name + ' · ' + b.kind);
  TR_SEL.ben = b.id;
  el('bnName').value = ''; el('bnAcct').value = '';
  renderAll();
  el('bnMsg').textContent = b.id + ' added for ' + custName(b.cust) + ' — it stays unverified until someone checks it.';
  toast('Beneficiary added');
}
function trBenUpdate(){
  const sel = trBenItem();
  if(!sel){ toast('Select a beneficiary first', 'err'); return; }
  const f = trBenForm();
  if(!f.name || !f.account){ toast('Name and number are required', 'err'); return; }
  TR_BEN_HISTORY.unshift({when: TODAY + ' ' + trNow(), ben: sel.id, name: f.name, action: 'Edited',
    from: sel.account, to: f.account, by: 'STF-001', status: 'Unverified', lane: sel.lane, severity: 'Medium',
    owner: 'STF-001', region: sel.region});
  sel.name = f.name; sel.account = f.account; sel.kind = f.kind; sel.bank = f.bank;
  sel.verified = 'Unverified';
  trAudit('Edit beneficiary', sel.id, f.name + ' · ' + f.account);
  renderAll();
  el('bnMsg').textContent = sel.id + ' updated — editing it sends it back to unverified.';
  toast('Beneficiary updated');
}
function trBenVerify(){
  const sel = trBenItem();
  if(!sel){ toast('Select a beneficiary first', 'err'); return; }
  sel.verified = 'Verified';
  TR_BEN_HISTORY.unshift({when: TODAY + ' ' + trNow(), ben: sel.id, name: sel.name, action: 'Verified',
    from: 'Unverified', to: 'Verified', by: 'STF-001', status: 'Verified', lane: sel.lane, severity: 'Low',
    owner: 'STF-001', region: sel.region});
  trAudit('Verify beneficiary', sel.id, sel.name);
  renderAll();
  el('bnMsg').textContent = sel.id + ' verified — it can now be paid.';
  toast('Beneficiary verified');
}
function trBenToggle(){
  const sel = trBenItem();
  if(!sel){ toast('Select a beneficiary first', 'err'); return; }
  sel.status = sel.status === 'Enabled' ? 'Disabled' : 'Enabled';
  TR_BEN_HISTORY.unshift({when: TODAY + ' ' + trNow(), ben: sel.id, name: sel.name, action: sel.status,
    from: '—', to: sel.status, by: 'STF-001', status: sel.status, lane: sel.lane, severity: 'Low',
    owner: 'STF-001', region: sel.region});
  renderAll();
  el('bnMsg').textContent = sel.id + ' is now ' + sel.status.toLowerCase() + '.';
  toast('Beneficiary ' + sel.status.toLowerCase());
}

/* ---- 14 · receipts and statements ---- */
function trReceiptPrint(){
  const r = trReceiptItem();
  if(!r){ toast('Select a receipt first', 'err'); return; }
  printTable('Transfer receipt · ' + r.receipt,
    [{label: 'Field'}, {label: 'Value'}],
    [['Receipt', r.receipt], ['Transfer', r.txn], ['Customer', custName(r.cust)], ['Issued', trWhen(r.when)],
      ['From', r.source], ['To', r.destName], ['Method', r.method], ['Amount', trM(r.amount)],
      ['Fee', trM(r.fee)], ['Total debited', trM(r.amount + r.fee)], ['Provider reference', r.providerRef]]);
  logExport('Transfer receipt · ' + r.receipt, 'PDF', 11);
  toast('Receipt ready to print');
}
function trReceiptCsv(){
  const r = trReceiptItem();
  if(!r){ toast('Select a receipt first', 'err'); return; }
  downloadFile('transfer-receipt-' + r.receipt + '.csv', 'text/csv',
    toCsv([['Field', 'Value'], ['Receipt', r.receipt], ['Transfer', r.txn], ['Customer', custName(r.cust)],
      ['Issued', trWhen(r.when)], ['Amount', trM(r.amount)], ['Fee', trM(r.fee)], ['Method', r.method]]));
  logExport('Transfer receipt · ' + r.receipt, 'CSV', 8);
  renderExportHistory();
}
function trVerifyReceipt(){
  const q = (el('rcVerifyInput').value || '').trim().toUpperCase();
  const found = TR_RECEIPTS.find(r => r.receipt.toUpperCase() === q);
  if(found && !TR_RECEIPT_VERIFIED.includes(found.receipt)) TR_RECEIPT_VERIFIED.push(found.receipt);
  trAudit('Verify receipt', q || '—', found ? 'Genuine' : 'Not found');
  renderReceipts();
  toast(found ? 'Receipt ' + q + ' is genuine' : 'No receipt carries ' + q, found ? 'ok' : 'err');
}
function trStmtPrint(){
  printTable('Transfer statement · ' + custName(TR_SEL.stmtCust || CUSTOMERS[0].id),
    [{label: 'Date'}, {label: 'Reference'}, {label: 'Method'}, {label: 'To'}, {label: 'Amount', num: true}, {label: 'Status'}],
    TR_TXN.filter(t => t.cust === (TR_SEL.stmtCust || CUSTOMERS[0].id)).slice(0, 60)
      .map(t => [trWhen(t.when), t.id, t.method, t.destName, trM(t.amount), t.status]));
  logExport('Transfer statement · ' + custName(TR_SEL.stmtCust || CUSTOMERS[0].id), 'PDF', 60);
  toast('Statement ready to print');
}
function trStmtCsv(){
  const cust = TR_SEL.stmtCust || CUSTOMERS[0].id;
  const rows = TR_TXN.filter(t => t.cust === cust).slice(0, 200)
    .map(t => [trWhen(t.when), t.id, t.method, t.destName, trM(t.amount), trM(t.fee), t.status]);
  downloadFile('transfer-statement-' + cust + '.csv', 'text/csv',
    toCsv([['Date', 'Reference', 'Method', 'To', 'Amount', 'Fee', 'Status']].concat(rows)));
  logExport('Transfer statement · ' + custName(cust), 'CSV', rows.length);
  renderExportHistory();
}

/* ---- 15 · failed helpers ---- */
function trRetryFailed(ref){
  const f = TR_FAILED.find(x => x.ref === ref);
  if(!f){ toast('Select a failed transfer', 'err'); return; }
  if(!/^Yes/.test(f.retryable)){ toast('This failure needs new details before it can be retried', 'err'); return; }
  const t = TR_TXN.find(x => x.id === f.txn);
  if(t){ t.status = 'Processing'; t.stage = 'Retried at the provider'; }
  f.status = 'Retried';
  trAudit('Retry failed transfer', f.ref, 'Sent again with the same idempotency key');
  renderAll();
  toast(f.ref + ' queued for a retry');
}
function trReversalAction(id, what){
  const r = TR_REVERSALS.find(x => x.id === id);
  if(!r){ toast('Select a reversal', 'err'); return; }
  if(what === 'approve'){ r.status = 'Approved'; r.approver = 'STF-009'; }
  else if(what === 'post'){
    r.status = 'Posted'; r.restored = 'Yes';
    const t = TR_TXN.find(x => x.id === r.txn);
    if(t){ t.status = 'Reversed'; t.stage = 'Reversal posted';
      const src = TR_ACC_BY_ID[t.source];
      if(src){ src.available += t.amount + t.fee; src.ledger = src.available + src.reserved; }
      TR_LEDGER.push({entry: 'TLE-' + pad(8300 + TR_LEDGER.length, 5), when: TODAY + ' ' + trNow(), account: t.source,
        cust: t.cust, txn: t.id, side: 'Credit', amount: t.amount + t.fee, balance: (src || {}).available || 0,
        method: t.method, status: 'Posted', lane: 'Ledger', severity: 'Medium', owner: 'STF-001', region: t.region});
    }
  } else { r.status = 'Rejected'; }
  trAudit('Reversal ' + what, r.id, r.ref);
  renderAll();
  el('rvMsg').textContent = r.id + ' is now ' + r.status.toLowerCase() + (r.restored === 'Yes' ? ' and the source account has been restored.' : '.');
  toast('Reversal ' + r.status.toLowerCase());
}

/* ---- 17–19 · connections, database, notifications ---- */
function trConnTest(){
  const c = trConnItem();
  const latency = clamp(c.latency + ri(-20, 40), 5, 4000);
  c.latency = latency;
  c.lastCheck = TODAY + ' ' + trNow();
  TR_CONN_TESTS.unshift({conn: c.id, name: c.name, when: c.lastCheck, result: latency > 1000 ? 'Slow' : 'Pass',
    latency, lane: c.rail === 'Mobile money' ? 'Mobile money' : c.rail === 'Bank' ? 'Bank' : 'Internal',
    severity: latency > 1000 ? 'Medium' : 'Low', owner: 'STF-001', region: 'Lilongwe'});
  trAudit('Connection test', c.id, latency + ' ms');
  renderAll();
  el('cnMsg').textContent = c.name + ' answered in ' + latency + ' ms — ' + (latency > 1000 ? 'slower than the target.' : 'healthy.');
  toast('Connection test finished');
}
function trRotateCredential(){
  const c = trConnItem();
  c.credential = 'Rotated today, valid for 90 days';
  trAudit('Rotate credential', c.id, c.provider);
  renderAll();
  el('cnMsg').textContent = 'A new credential was issued for ' + c.name + '; the old one stops working at once.';
  toast('Credential rotated');
}
function trAckAlert(what){
  const a = TR_CONN_ALERTS.find(x => x.what === what);
  if(!a) return;
  a.status = 'Acknowledged';
  trAudit('Acknowledge alert', a.what, a.lane);
  renderAll();
  toast('Alert acknowledged');
}
function trFixRls(){
  let fixed = 0;
  TR_DB_TABLES.forEach(t => { if(t.rls !== 'Enabled'){ t.rls = 'Enabled'; fixed++; } });
  if(!fixed){ toast('Every table already carries a policy', 'err'); return; }
  TR_MIGRATIONS.forEach(m => { if(m.status === 'Pending') m.status = 'Applied'; });
  MIGRATIONS_FIXED = fixed;
  trAudit('Enable RLS', 'transfer_attachments', 'Policy added and the pending deploy applied');
  renderAll();
  toast('Row-level security enabled on ' + fixed + ' table(s)');
}
let MIGRATIONS_FIXED = 0;
function trRunDbChecks(){
  const checks = TR_DB_CHECKS();
  renderAll();
  const failing = checks.filter(c => c.status !== 'Pass').length;
  toast(failing ? failing + ' integrity check(s) still failing' : 'Every integrity check passes', failing ? 'err' : 'ok');
}
function trSchemaCheck(){
  put('dbSchemaBox', `<div class="minihead">Schema compatibility</div>`
    + kvRow('App version', '2026.10.30.1') + kvRow('Schema version', '2026.10.30.1')
    + kvRow('Compatible', okb('Yes'))
    + kvRow('Pending deploys', String(TR_MIGRATIONS.filter(m => m.status === 'Pending').length))
    + kvRow('Checked', trWhen(TODAY + ' ' + trNow()))
    + kvRow('Result', TR_MIGRATIONS.some(m => m.status === 'Pending') ? badge('A deploy is still waiting', 'b-warn') : okb('Everything applied')));
  toast('Schema compatibility checked');
}
function trToggleRule(i){
  const r = TR_NOTIFY_RULES[i];
  if(!r) return;
  r.on = !r.on;
  trAudit('Notification rule', r.event, r.on ? 'Switched on' : 'Switched off');
  renderAll();
  toast(r.event + ' ' + (r.on ? 'switched on' : 'switched off'));
}
function trTestChannel(kind){
  const ch = TR_CHANNELS[kind];
  if(!ch){ return; }
  TR_NOTIFY_LOG.unshift({when: TODAY + ' ' + trNow(), event: 'Test message', channel: kind === 'sms' ? 'SMS' : 'Email',
    to: staffName('STF-001'), reference: 'TEST', status: 'Delivered', lane: 'Notifications', severity: 'Low',
    owner: 'STF-001', region: 'Lilongwe'});
  trAudit('Test ' + kind, ch.provider, 'Delivered');
  renderAll();
  el('ntMsg').textContent = 'A test ' + (kind === 'sms' ? 'SMS' : 'email') + ' went out through ' + ch.provider + ' and came back delivered.';
  toast('Test ' + (kind === 'sms' ? 'SMS' : 'email') + ' delivered');
}

/* ---- 20 · reports ---- */
function runReport(key, fmt){
  const d = trReport(key);
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
  const name = 'transfers-' + key + '-report-' + stamp;
  if(fmt === 'csv'){
    downloadFile(name + '.csv', 'text/csv', toCsv([labels].concat(rows)));
  } else if(fmt === 'xlsx'){
    downloadFile(name + '.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      xlsxBytes(d.title, labels, rows));
  } else {
    printTable(d.title, d.cols.map(c => ({label: c[0], num: /amount|value|fee|total|rows/i.test(c[1])})), rows);
  }
  logExport(d.title, fmt === 'csv' ? 'CSV' : fmt === 'xlsx' ? 'Excel' : 'PDF', rows.length);
  renderExportHistory(); renderReports(); renderSettings();
  toast(d.title + ' generated');
}
function runPack(fmt){
  const all = TR_REPORTS.map(r => trReport(r.key));
  const stamp = TODAY.replace(/-/g, '');
  const total = sum(all, d => d.rows.length);
  if(fmt === 'csv'){
    const parts = [];
    all.forEach(d => {
      parts.push(d.title.toUpperCase());
      parts.push(toCsv([d.cols.map(c => c[0])].concat(d.rows.map(r => d.cols.map(c => r[c[1]])))));
      parts.push('');
    });
    downloadFile('transfers-report-pack-' + stamp + '.csv', 'text/csv', parts.join('\r\n'));
  } else if(fmt === 'xlsx'){
    downloadFile('transfers-report-pack-' + stamp + '.xlsx',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      xlsxBytes('Transfer report pack', all[0].cols.map(c => c[0]), all[0].rows.map(r => all[0].cols.map(c => r[c[1]]))));
  } else {
    printTable('Transfer report pack · ' + all.length + ' reports',
      [{label: 'Report'}, {label: 'Rows', num: true}, {label: 'What it shows'}],
      all.map(d => [d.title, d.rows.length, d.note]));
  }
  logExport('Transfer report pack', fmt === 'csv' ? 'CSV' : fmt === 'xlsx' ? 'Excel' : 'PDF', total);
  renderExportHistory(); renderReports();
  el('packMsg').textContent = 'The pack holds ' + all.length + ' reports and ' + num(total) + ' rows.';
  toast('Report pack generated');
}

/* ===================== filters ===================== */
function trUniq(a){ return Array.from(new Set(a)); }
function trFillFilters(){
  const sev = ['Critical', 'High', 'Medium', 'Low'];
  const stat = trUniq(TR_TXN.map(t => t.status).concat(TR_VERIFY.map(v => v.status),
    TR_APPROVALS.map(a => a.status), TR_REVERSALS.map(r => r.status), TR_DB_ERRORS.map(e => e.status),
    TR_BENEFICIARIES.map(b => b.status), TR_RECEIPTS.map(r => r.status), TR_NOTIFY_LOG.map(n => n.status)));
  const own = trUniq(TR_TXN.concat(TR_VERIFY, TR_APPROVALS, TR_FRAUD, TR_REVERSALS).map(x => x.owner).filter(Boolean));
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
function trSyncFilters(){
  if(el('fltFrom')) el('fltFrom').value = FILTER.from;
  if(el('fltTo')) el('fltTo').value = FILTER.to;
  if(el('fltSearch')) el('fltSearch').value = FILTER.q;
  [['severity', 'fltSeverity'], ['status', 'fltStatus'], ['owner', 'fltOwner'], ['region', 'fltRegion'], ['product', 'fltProduct']]
    .forEach(([k, id]) => { if(el(id)) el(id).value = FILTER[k] || ''; });
  document.querySelectorAll('#fltLaneChips [data-lane]').forEach(c =>
    c.classList.toggle('on', (c.dataset.lane || '') === FILTER.lane));
}
function trApplyFilters(){
  FILTER.from = el('fltFrom').value || '2026-01-01';
  FILTER.to = el('fltTo').value || TODAY;
  FILTER.q = (el('fltSearch').value || '').trim();
  FILTER.severity = el('fltSeverity').value;
  FILTER.status = el('fltStatus').value;
  FILTER.owner = el('fltOwner').value;
  FILTER.region = el('fltRegion').value;
  FILTER.product = el('fltProduct').value;
  renderAll(); trFilterSummary();
  toast('Transfer filters applied');
}
function trClearFilter(k){
  if(k){ FILTER[k] = ''; }
  else Object.keys(FILTER).forEach(key => { if(key !== 'from' && key !== 'to') FILTER[key] = ''; });
  trSyncFilters();
  renderAll(); trFilterSummary();
}
function trFilterSummary(){
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
    || '<span class="qhint">No filters applied — the whole transfer register is shown.</span>';
  const s = trS();
  if(el('fltCounts')) el('fltCounts').innerHTML = [
    ['Transfers', s.total], ['Internal', s.internal], ['External', s.external],
    ['Accounts', s.accounts], ['Awaiting verification', s.pendingVerification],
    ['Awaiting approval', s.pendingApproval], ['Open issues', trIssues().length]
  ].map(([k, v]) => `<div><div class="sl">${esc(k)}</div><div class="sv">${num(v)}</div></div>`).join('');
  if(el('fltResult')) el('fltResult').textContent = 'Showing the transfer register for ' +
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
function renderStats(){
  const s = trS();
  const set = (id, v) => { if(el(id)) el(id).textContent = v; };
  set('bandScore', Math.round(s.score) + '%');
  set('bandTransfers', num(s.total));
  set('bandVolume', compact(s.totalAmount));
  set('bandAlerts', num(trIssues().length));
  set('topRefresh', REFRESH);
}
function renderAll(){
  renderOverview();
  renderTransfers();
  renderInternal();
  renderSavings();
  renderLoan();
  renderBank();
  renderMobile();
  renderVerify();
  renderApprovals();
  renderProcessing();
  renderLedger();
  renderFees();
  renderBeneficiaries();
  renderReceipts();
  renderFailed();
  renderFraud();
  renderConnections();
  renderDatabase();
  renderNotifications();
  renderReports();
  renderStats();
}

/* ===================== wiring ===================== */
function wireAll(){
  document.addEventListener('click', e => {
    if(sortOrPage(e)) return;

    const snav = e.target.closest('.snav');
    if(snav){ e.preventDefault(); goto(snav.getAttribute('href').slice(1)); return; }

    const lane = e.target.closest('#fltLaneChips [data-lane]');
    if(lane){ FILTER.lane = lane.dataset.lane; trSyncFilters(); renderAll(); trFilterSummary(); return; }

    const chip = e.target.closest('[data-clear]');
    if(chip){ trClearFilter(chip.dataset.clear); return; }

    const go = e.target.closest('[data-goto]');
    if(go){ goto(go.dataset.goto); return; }

    const stc = e.target.closest('[data-stchip]');
    if(stc){ FILTER.status = stc.dataset.stchip === 'All' ? '' : stc.dataset.stchip;
      trSyncFilters(); renderProcessing(); trFilterSummary(); return; }

    const opent = e.target.closest('[data-opentxn]');
    if(opent){ const t = TR_TXN.find(x => x.id === opent.dataset.opentxn);
      if(t){ TR_SEL.txn = t.id; openTransfer(t); } return; }

    const accpick = e.target.closest('[data-accpick]');
    if(accpick){ el('itSource').value = accpick.dataset.accpick; renderInternal(); goto('s3'); return; }

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

    if(e.target.closest('#fltApply')){ trApplyFilters(); return; }
    if(e.target.closest('#fltReset')){ trClearFilter(); return; }
    if(e.target.closest('#menuBtn')){ document.body.classList.toggle('nav-open'); return; }
    if(e.target.closest('#topRefresh') || e.target.closest('#refreshBtn')){
      REFRESH = TODAY + ' · ' + trNow(); renderAll(); trFilterSummary(); toast('The transfer register has been refreshed'); return; }
    if(e.target.closest('#printBtn')){
      const sec = Array.from(document.querySelectorAll('section.sec')).find(s => s.offsetTop > window.scrollY - 200);
      printTable('Transfers · ' + ((sec && sec.querySelector('h2')) ? sec.querySelector('h2').textContent : 'module'),
        [{label: 'Reference'}, {label: 'Customer'}, {label: 'Method'}, {label: 'Amount', num: true}, {label: 'Status'}],
        TR_TXN.filter(trPass).slice(0, 80).map(t => [t.id, custName(t.cust), t.method, trM(t.amount), t.status]));
      return; }
    if(e.target.closest('#quickCsv')){
      const rows = TR_TXN.filter(trPass).map(t => [t.id, trWhen(t.when), t.type, custName(t.cust), t.source, t.destName,
        t.method, trM(t.amount), trM(t.fee), t.status]);
      downloadFile('transfers-' + TODAY + '.csv', 'text/csv', toCsv([['Reference', 'When', 'Type', 'Customer', 'From', 'To', 'Method', 'Amount', 'Fee', 'Status']].concat(rows)));
      logExport('Transfer register', 'CSV', rows.length); renderExportHistory(); return; }
    if(e.target.closest('#bellBtn')){
      openModal('Transfer notifications', TR_NOTIFY_LOG.length + ' messages · ' + TR_NOTIFY_RULES.filter(r => r.on).length + ' rules on',
        TR_NOTIFY_LOG.slice(0, 6).map(n => `<div class="risk"><div><div class="rn">${esc(n.event)}</div>
          <div class="rs">${esc(n.to)} · ${esc(n.reference)} · ${esc(trWhen(n.when))}</div></div>
          <div class="rv">${okb(n.status)}</div></div>`).join(''), [{label: 'Close', act: 'close'}]); return; }

    /* 2 */
    if(e.target.closest('#tmCreate')){ trNewTransfer(); return; }
    if(e.target.closest('#tmReset')){ el('tmNewDesc').value = ''; el('tmNewAmount').value = '120000';
      el('tmMsg').textContent = 'The form has been cleared.'; renderTransfers(); toast('Form cleared'); return; }

    /* 3 */
    if(e.target.closest('#itVerifyOwnership') || e.target.closest('#itConfirm')){
      const chk = trInternalCheck(); renderInternal();
      el('itMsg').textContent = chk.pass ? 'Ownership and balance confirmed — the transfer can be made.'
        : 'Ownership or balance failed — fix the checks before making the transfer.';
      toast(chk.pass ? 'Details confirmed' : 'Something failed', chk.pass ? 'ok' : 'err'); return; }
    if(e.target.closest('#itSubmit')){ trInternalSubmit(); return; }

    /* 4 */
    if(e.target.closest('#svCheck')){ renderSavings(); toast('Savings checks run'); return; }
    if(e.target.closest('#svSubmit')){ trSavingsSubmit(); return; }
    if(e.target.closest('#svStmtBtn')){ trSavingsStatement(); return; }

    /* 5 */
    if(e.target.closest('#lnPost')){ trPostLoan(); return; }

    /* 6 */
    if(e.target.closest('#bkVerify')){ trBankVerify(); return; }
    if(e.target.closest('#bkSubmit')){ trBankSubmit(); return; }

    /* 7 */
    if(e.target.closest('#mmVerify')){ trMobileVerify(); return; }
    if(e.target.closest('#mmSubmit')){ trMobileSubmit(); return; }

    /* 8 */
    if(e.target.closest('#tvApprove')){ trVerifyAction('approve'); return; }
    if(e.target.closest('#tvReject')){ trVerifyAction('reject'); return; }
    if(e.target.closest('#tvApproveAll')){ trApproveAllVerify(); return; }
    if(e.target.closest('#tvAutoBtn')){ trAutoVerify(); return; }

    /* 9 */
    if(e.target.closest('#taL1')){ trApproval('first'); return; }
    if(e.target.closest('#taL2')){ trApproval('management'); return; }
    if(e.target.closest('#taReject')){ trApprovalReject(); return; }
    if(e.target.closest('#taReturn')){ trApprovalReturn(); return; }
    if(e.target.closest('#taSave')){ trSaveThresholds(); return; }

    /* 10 */
    if(e.target.closest('#stStatusBtn')){ trSetStatus(); return; }
    if(e.target.closest('#stReceiptBtn')){ trReceiptForTxn(); return; }
    if(e.target.closest('#stDupBtn')){ trScanDuplicates(); return; }

    /* 11 */
    if(e.target.closest('#ldRecalc')){ trRecalcBalances(); return; }
    if(e.target.closest('#ldRecon')){ trReconcileLedger(); return; }
    if(e.target.closest('#ldAdjBtn')){ trPostAdjustment(); return; }

    /* 12 */
    if(e.target.closest('#flCalcBtn')){ trCalcFee(); return; }
    if(e.target.closest('#flSave')){ trSaveLimits(); return; }

    /* 13 */
    if(e.target.closest('#bnAdd')){ trBenAdd(); return; }
    if(e.target.closest('#bnUpdate')){ trBenUpdate(); return; }
    if(e.target.closest('#bnVerify')){ trBenVerify(); return; }
    if(e.target.closest('#bnToggle')){ trBenToggle(); return; }

    /* 14 */
    if(e.target.closest('#rcPrint')){ trReceiptPrint(); return; }
    if(e.target.closest('#rcCsv')){ trReceiptCsv(); return; }
    if(e.target.closest('#rcVerifyBtn')){ trVerifyReceipt(); return; }
    if(e.target.closest('#rcStmtBtn')){ renderStatement(); toast('Statement built from the register'); return; }
    if(e.target.closest('#rcStmtPrint')){ trStmtPrint(); return; }
    if(e.target.closest('#rcStmtCsv')){ trStmtCsv(); return; }

    /* 15 */
    const retry = e.target.closest('[data-fqretry]');
    if(retry){ trRetryFailed(retry.dataset.fqretry); return; }
    const rva = e.target.closest('[data-rvact]');
    if(rva){ trReversalAction(rva.dataset.rvid, rva.dataset.rvact); return; }

    /* 17 */
    if(e.target.closest('#cnTest')){ trConnTest(); return; }
    if(e.target.closest('#cnRotate')){ trRotateCredential(); return; }
    const ack = e.target.closest('[data-cnack]');
    if(ack){ trAckAlert(ack.dataset.cnack); return; }

    /* 18 */
    if(e.target.closest('#dbRlsFix')){ trFixRls(); return; }
    if(e.target.closest('#dbCheck')){ trRunDbChecks(); return; }
    if(e.target.closest('#dbSchemaBtn')){ trSchemaCheck(); return; }

    /* 19 */
    if(e.target.closest('#ntTestSms')){ trTestChannel('sms'); return; }
    if(e.target.closest('#ntTestEmail')){ trTestChannel('email'); return; }
    const rule = e.target.closest('[data-ntrule]');
    if(rule){ trToggleRule(Number(rule.dataset.ntrule)); return; }

    /* 20 */
    const rep = e.target.closest('[data-trrep]');
    if(rep){ runReport(rep.dataset.trrep, rep.dataset.fmt); return; }
    if(e.target.closest('#packCsv')){ runPack('csv'); return; }
    if(e.target.closest('#packXlsx')){ runPack('xlsx'); return; }
    if(e.target.closest('#packPdf')){ runPack('pdf'); return; }
    if(e.target.closest('#packPrint')){ runPack('pdf'); return; }
    if(e.target.closest('#rpExportAll')){
      TR_REPORTS.forEach(r => runReport(r.key, 'csv'));
      el('rpAuthMsg').textContent = TR_REPORTS.length + ' authorised reports were exported as CSV.'; return; }
    if(e.target.closest('#setSave')){ trSaveSettings(); return; }
    if(e.target.closest('#setReset')){ trResetSettings(); return; }
  });

  document.addEventListener('change', e => {
    const t = e.target;
    if(t.id === 'itSource' || t.id === 'itAmount' || t.id === 'itDest'){ renderInternal(); return; }
    if(t.id === 'svAccount' || t.id === 'svDir' || t.id === 'svAmount' || t.id === 'svDest'){ renderSavings(); return; }
    if(t.id === 'lnLoan' || t.id === 'lnType' || t.id === 'lnAmount'){ renderLoan(); return; }
    if(t.id === 'bkSource' || t.id === 'bkAmount' || t.id === 'bkBank'){ renderBank(); return; }
    if(t.id === 'mmProvider' || t.id === 'mmSource' || t.id === 'mmAmount'){ renderMobile(); return; }
    if(t.id === 'ldAdjAcct' || t.id === 'ldAdjAmount' || t.id === 'ldAdjReason'){ renderLedger(); return; }
    if(t.id === 'flCalcMethod' || t.id === 'flCalcAmount'){ renderFees(); return; }
    if(t.id === 'bnKind'){ trFillSel('bnBank', el('bnKind').value === 'Bank account' ? TR_BANKS.map(x => [x, x]) : TR_MOBILE.map(x => [x, x])); return; }
    if(t.id === 'rcStmtCust' || t.id === 'rcFrom' || t.id === 'rcTo'){ renderStatement(); return; }
    if(t.id === 'tmNewType' || t.id === 'tmNewAmount' || t.id === 'tmNewSourceAcct' || t.id === 'tmNewDest'){ renderTransferPreview(); return; }
    if(t.id === 'stStatusSel'){ return; }
  });
  document.addEventListener('input', e => {
    if(e.target.id === 'itAmount') renderInternal();
    if(e.target.id === 'svAmount') renderSavings();
    if(e.target.id === 'ldAdjAmount' || e.target.id === 'ldAdjReason') renderLedger();
    if(e.target.id === 'tmNewAmount') renderTransferPreview();
    if(e.target.id === 'flCalcAmount') renderFees();
  });

  if(el('fltSearch')) el('fltSearch').addEventListener('keydown', e => { if(e.key === 'Enter') trApplyFilters(); });
  if(el('globalSearch')) el('globalSearch').addEventListener('keydown', e => {
    if(e.key !== 'Enter') return;
    el('fltSearch').value = el('globalSearch').value;
    trApplyFilters(); goto('s1');
    toast('Register filtered by “' + el('globalSearch').value + '”');
  });
  if(el('rcVerifyInput')) el('rcVerifyInput').addEventListener('keydown', e => { if(e.key === 'Enter') trVerifyReceipt(); });
  if(el('tmNewType')) el('tmNewType').addEventListener('change', () => renderTransferPreview());
  if(el('modalClose')) el('modalClose').addEventListener('click', closeModal);
  if(el('modal')) el('modal').addEventListener('click', ev => { if(ev.target.id === 'modal') closeModal(); });
  window.addEventListener('scroll', trSpyScroll, {passive: true});
  window.addEventListener('hashchange', () => { const h = location.hash.slice(1); if(h && document.getElementById(h)) goto(h); });
}
function trSpyScroll(){
  const secs = Array.from(document.querySelectorAll('section.sec'));
  if(!secs.length) return;
  const y = window.scrollY + 120;
  let cur = secs[0];
  secs.forEach(s => { if(s.offsetTop <= y) cur = s; });
  document.querySelectorAll('.snav').forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + cur.id));
}

window.TRANSFERS_APP = {
  FILTER, TR_SET, TR_SET_DEFAULTS, TR_ACCOUNTS, TR_ACC_BY_ID, TR_ACC_OF_CUST, TR_SAVINGS, TR_METHODS,
  TR_TXN, TR_COMPLETED, TR_STATUSES, TR_STATUS_COUNTS, TR_VERIFY, TR_APPROVALS, TR_FAILED, TR_REVERSALS,
  TR_LEDGER, TR_DISCREPANCY, TR_LIMITS, TR_FEES, TR_DAILY, TR_BENEFICIARIES, TR_RECEIPTS, TR_NOTIFY_RULES,
  TR_NOTIFY_LOG, TR_FRAUD, TR_CONNS, TR_DB_TABLES, TR_DB_FUNCS, TR_DB_ERRORS, TR_MIGRATIONS, TR_REPORTS,
  TR_CHANGES, TR_AUDIT, trStats, trReport, renderAll, runReport, runPack, goto,
  trNewTransfer, trInternalSubmit, trSavingsSubmit, trPostLoan, trBankVerify, trBankSubmit,
  trMobileVerify, trMobileSubmit, trVerifyAction, trApproveAllVerify, trAutoVerify,
  trApproval, trApprovalReject, trApprovalReturn, trSaveThresholds, trSetStatus, trReceiptForTxn,
  trScanDuplicates, trRecalcBalances, trReconcileLedger, trPostAdjustment, trCalcFee, trSaveLimits,
  trBenAdd, trBenUpdate, trBenVerify, trBenToggle, trReceiptPrint, trReceiptCsv, trVerifyReceipt,
  trStmtPrint, trStmtCsv, trRetryFailed, trReversalAction, trConnTest, trRotateCredential,
  trAckAlert, trFixRls, trRunDbChecks, trSchemaCheck, trToggleRule, trTestChannel,
  trSaveSettings, trResetSettings, trApplyFilters, trClearFilter, logExport
};

/* boot */
(function(){
  trFillFilters();
  trSyncFilters();
  renderAll();
  trFilterSummary();
  renderExportHistory();
  wireAll();
  const hash = (location.hash || '').slice(1);
  if(hash) goto(hash);
})();
</script>
</body>
</html>
