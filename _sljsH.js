<script>
/* ============================================================
   SALARIES, EXPENSES & OPERATING CHARGES (8/8)
   Sections 17–20: notifications, security, the database view,
   the reports and configuration, then the navigation, the filter
   bar, the render loop and the boot sequence.
   ============================================================ */

/* ===================== 17 · NOTIFICATIONS ===================== */
const seNow2 = () => new Date().toTimeString().slice(0, 5);
function seRuleToggle(i){
  const r = SE_NOTIFY_RULES[i];
  if(!r) return;
  r.on = !r.on;
  seAudit('Notification rule ' + (r.on ? 'enabled' : 'disabled'), r.event, r.channel);
  renderNotifications();
  toast(r.event + ' notifications are now ' + (r.on ? 'on' : 'off'), r.on ? 'ok' : 'err');
}
function seTestChannel(ch){
  const c = SE_CHANNELS[ch];
  if(!c){ return; }
  SE_NOTIFY_LOG.unshift({when: TODAY + ' ' + seNow2(), event: 'Test message', channel: ch === 'sms' ? 'SMS' : 'Email',
    to: ch === 'sms' ? '+265 991 000 118' : 'payroll@goldenloan.mw', reference: 'TEST-' + pad(100 + SE_NOTIFY_LOG.length, 4),
    status: 'Delivered', lane: 'Notifications', severity: 'Low', owner: 'STF-007', region: 'Lilongwe'});
  c.lastSend = TODAY + ' ' + seNow2();
  seAudit('Test notification channel', ch.toUpperCase(), c.provider);
  el('ntMsg').textContent = 'A test ' + (ch === 'sms' ? 'SMS' : 'email') + ' was accepted by ' + c.provider + ' at ' + seNow2() + '.';
  renderAll();
  toast('Test ' + ch.toUpperCase() + ' sent through ' + c.provider);
}
function renderNotifications(){
  const s = seStats();
  const due = seRefreshDue();
  if(el('ntPill')){ el('ntPill').className = 'badge b-ok'; el('ntPill').textContent = num(SE_NOTIFY_RULES.filter(r => r.on).length) + ' rules live'; }
  put('ntKpis', [
    ['Notification rules', num(SE_NOTIFY_RULES.length), 'Payroll, claims and renewals', ''],
    ['Rules switched on', num(SE_NOTIFY_RULES.filter(r => r.on).length), 'Off rules send nothing', ''],
    ['Messages logged', num(SE_NOTIFY_LOG.length), 'SMS and email', ''],
    ['Delivered', num(SE_NOTIFY_LOG.filter(l => l.status === 'Delivered').length), 'Accepted by the provider', ''],
    ['Awaiting provider', num(SE_NOTIFY_LOG.filter(l => l.status === 'Awaiting provider').length), 'The gateway has not confirmed delivery', ''],
    ['Failed', num(SE_NOTIFY_LOG.filter(l => l.status === 'Failed').length), 'Worth a retry', SE_NOTIFY_LOG.some(l => l.status === 'Failed') ? 'red' : ''],
    ['Payroll reminders', num(due.length), 'Sent before the cut-off', ''],
    ['Renewals to remind', num(s.renewalsDue), 'Inside ' + SE_SET.reminderDays + ' days', '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join(''));

  if(el('ntMsg') && !String(el('ntMsg').textContent || '').trim())
    el('ntMsg').textContent = 'Two channels are connected: SMS through ' + SE_CHANNELS.sms.provider + ' and email through ' + SE_CHANNELS.email.provider + '.';
  if(el('ntRulePill')) el('ntRulePill').textContent = num(SE_NOTIFY_RULES.filter(r => r.on).length) + ' on';
  const rules = SE_NOTIFY_RULES.map((r, i) => Object.assign({}, r, {idx: i}));
  renderTable('ntBody', [
    {k: 'event', label: 'Event'},
    {k: 'channel', label: 'Channel'},
    {k: 'to', label: 'Who'},
    {k: 'template', label: 'Template'},
    {k: 'last', label: 'Last sent', html: v => esc(fmtDate(v))},
    {k: 'on', label: 'State', html: (v, r) => `<button class="btn btn-ghost" data-senotif="${r.idx}">${v ? 'On' : 'Off'}</button>`}
  ], rules, {sort: 'event', pageSize: 9});

  put('ntConn', ['sms', 'email'].map(k => {
    const c = SE_CHANNELS[k];
    return `<div class="risk"><div><div class="rn">${esc(k === 'sms' ? 'SMS' : 'Email')} · ${esc(c.provider)}</div>
      <div class="rs">${esc(c.sender)} · ${num(c.balance)} left · ${num(c.latency)} ms · last ${esc(seWhen(c.lastSend))}</div></div>
      <div class="rv">${okb(c.status)}</div></div>`;
  }).join('') + `<div class="qhint" style="margin-top:6px">A message is only sent for an event a staff member has a right to know about — never a salary figure to a third party.</div>`);

  put('ntPayBox', due.length ? due.map(p => `<div class="risk">
      <div><div class="rn">${esc(p.label)} payroll</div><div class="rs">Cut-off ${esc(fmtDate(p.cutOff))} · pay date ${esc(fmtDate(p.payDate))} · ${esc(seM(p.net))}</div></div>
      <div class="rv">${okb(p.status)}</div></div>`).join('')
    : '<div class="qhint">No payroll is inside the reminder window.</div>');
  const renew = SE_RECURRING.filter(r => r.renewal <= addDays(TODAY, SE_SET.reminderDays));
  if(el('ntDuePill')) el('ntDuePill').textContent = num(renew.length) + ' due';
  put('ntRenewBox', renew.length ? renew.map(r => `<div class="risk">
      <div><div class="rn">${esc(r.name)}</div><div class="rs">Renews ${esc(fmtDate(r.renewal))} · ${esc(seM(r.expected))}</div></div>
      <div class="rv">${badge('Reminder', 'b-warn')}</div></div>`).join('')
    : '<div class="qhint">Nothing renews inside the reminder window.</div>');
  put('ntInvBox', SE_EXPENSES.filter(e => e.status === 'Overdue').slice(0, 5).map(e => `<div class="risk">
      <div><div class="rn">${esc(e.invoice)} · ${esc(e.supplier)}</div><div class="rs">${esc(e.category)} · ${esc(seM(e.amount))}</div></div>
      <div class="rv">${okb(e.status)}</div></div>`).join('') || '<div class="qhint">No invoice is overdue.</div>');
  put('ntBudgetBox', SE_BUDGETS.filter(b => b.status !== 'Within budget').slice(0, 5).map(b => `<div class="risk">
      <div><div class="rn">${esc(b.scope)}</div><div class="rs">${esc(seM(b.actual))} of ${esc(seM(b.monthly))}</div></div>
      <div class="rv">${okb(b.status)}</div></div>`).join('') || '<div class="qhint">Every budget is well inside its limit.</div>');
  put('ntFailBox', SE_PAYMENTS.filter(p => p.status === 'Failed').slice(0, 4).map(p => `<div class="risk">
      <div><div class="rn">${esc(p.id)} · ${esc(p.payee)}</div><div class="rs">${esc(p.failure)}</div></div>
      <div class="rv">${esc(seM(p.amount))}</div></div>`).join('') || '<div class="qhint">No payment has failed.</div>');

  if(el('ntDelPill')) el('ntDelPill').textContent = num(SE_NOTIFY_LOG.filter(l => l.status === 'Delivered').length) + ' delivered';
  renderTable('ntDelBody', [
    {k: 'when', label: 'When', html: v => esc(seWhen(v))},
    {k: 'event', label: 'Event'},
    {k: 'channel', label: 'Channel'},
    {k: 'to', label: 'To'},
    {k: 'reference', label: 'Reference'},
    {k: 'status', label: 'State', html: v => okb(v)}
  ], SE_NOTIFY_LOG, {sort: 'when', pageSize: 8});
  if(el('ntHistPill')) el('ntHistPill').textContent = num(SE_NOTIFY_LOG.length) + ' messages';
  renderTable('ntHistBody', [
    {k: 'event', label: 'Event'},
    {k: 'channel', label: 'Channel'},
    {k: 'to', label: 'To'},
    {k: 'status', label: 'State', html: v => okb(v)}
  ], SE_NOTIFY_LOG.slice(0, 20), {sort: 'event', pageSize: 6});

  put('ntGrid',
    chartBox({title: 'Messages by channel', sub: 'What has been sent', type: 'donut', h: 200,
      cats: ['SMS', 'Email'],
      series: [{name: 'Messages', data: ['SMS', 'Email'].map(c => SE_NOTIFY_LOG.filter(l => l.channel === c).length)}],
      value: num(SE_NOTIFY_LOG.length)}) +
    chartBox({title: 'Delivery outcomes', sub: 'Delivered, awaiting the provider and failed', type: 'bar', h: 200,
      cats: ['Delivered', 'Awaiting provider', 'Failed'],
      series: [{name: 'Messages', data: ['Delivered', 'Awaiting provider', 'Failed'].map(st => SE_NOTIFY_LOG.filter(l => l.status === st).length), colour: '#1E9E6A'}],
      value: num(SE_NOTIFY_LOG.filter(l => l.status === 'Delivered').length)}));
}
function seRefreshDue(){ return SE_PAYROLL.filter(p => p.status !== 'Paid'); }

/* ===================== 18 · SECURITY ===================== */
const SE_PERM_STATE = {};
SE_ROLES.forEach(r => { SE_PERM_STATE[r] = (SE_PERMS[r] || []).slice(); });
function renderSecurity(){
  const s = seStats();
  if(el('scPill')){ el('scPill').className = 'badge ' + (SE_UNAUTHORISED.length ? 'b-warn' : 'b-ok');
    el('scPill').textContent = num(SE_UNAUTHORISED.length) + ' blocked attempts'; }
  put('scKpis', [
    ['Roles', num(SE_ROLES.length), 'Every role has a defined scope', ''],
    ['Capabilities', num(SE_CAPS.length), 'From seeing a salary to running payroll', ''],
    ['Restricted fields', num(SE_SENSITIVE.length), 'Salary, bank and payslip data', ''],
    ['Blocked attempts', num(SE_UNAUTHORISED.length), 'Refused by the permission check', SE_UNAUTHORISED.length ? 'red' : ''],
    ['Staff monitored', num(SE_STAFF_ACTIVITY.length), 'Activity on the payroll', ''],
    ['Audit entries', num(SE_AUDIT.length + SE_AUDIT_LOG.length), 'Every action in this module', ''],
    ['Data rules', num(SE_DATA_RULES.length), 'How the figures are protected', ''],
    ['Self-approval', 'Blocked', 'Requester and approver must differ', '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join(''));

  if(el('scPermPill')) el('scPermPill').textContent = num(SE_ROLES.length) + ' roles';
  const head = el('scPermHead');
  if(head) head.innerHTML = `<tr><th>Role</th>${SE_CAPS.map(c => `<th>${esc(c)}</th>`).join('')}<th>Scope</th></tr>`;
  if(el('scPermBody')) el('scPermBody').innerHTML = SE_ROLES.map(r => `<tr>
      <td><b>${esc(r)}</b></td>
      ${SE_CAPS.map((c, i) => `<td><button class="btn btn-ghost" data-seperm="${esc(r)}" data-cap="${i}">${(SE_PERM_STATE[r] || [])[i] ? '✓' : '—'}</button></td>`).join('')}
      <td>${esc(staffName(SE_ROLE_STAFF[r]))}</td></tr>`).join('');

  renderTable('scSensBody', [
    {k: 'id', label: 'Record'},
    {k: 'staff', label: 'Staff member', html: v => esc(seStaffName(v))},
    {k: 'field', label: 'Field'},
    {k: 'reason', label: 'Why it is restricted'},
    {k: 'access', label: 'Who may read it'},
    {k: 'status', label: 'State', html: v => okb(v)}
  ], SE_SENSITIVE, {sort: 'field', pageSize: 4});

  put('scDataBox', SE_DATA_RULES.map(([k, v]) => kvRow(k, esc(v))).join(''));
  if(el('scCtlPill')) el('scCtlPill').textContent = num(SE_DATA_RULES.length) + ' controls';
  put('scCtlBox', [
    ['Requester may not approve', 'Enforced in the database'],
    ['Payroll locked after payment', 'Enforced by the state machine'],
    ['Bank details masked', 'Everywhere except the payroll screen'],
    ['Payslip download logged', 'With the officer, the time and the record'],
    ['Salary figures encrypted', 'At rest and in transit']
  ].map(([k, v]) => kvRow(k, badge(v, 'b-ok'))).join(''));

  if(el('scUnauthPill')) el('scUnauthPill').textContent = num(SE_UNAUTHORISED.length) + ' blocked';
  renderTable('scUnauthBody', [
    {k: 'when', label: 'When', html: v => esc(seWhen(v))},
    {k: 'staff', label: 'Staff member', html: v => esc(seStaffName(v))},
    {k: 'action', label: 'Attempt'},
    {k: 'target', label: 'Record'},
    {k: 'result', label: 'Result', html: v => badge(v, 'b-crit')}
  ], SE_UNAUTHORISED, {sort: 'when', pageSize: 3});
  if(el('scActPill')) el('scActPill').textContent = num(SE_STAFF_ACTIVITY.length) + ' staff';
  renderTable('scActBody', [
    {k: 'name', label: 'Staff member'},
    {k: 'role', label: 'Role'},
    {k: 'payslips', label: 'Payslips', num: true},
    {k: 'claims', label: 'Claims', num: true},
    {k: 'approvals', label: 'Approvals', num: true},
    {k: 'lastAction', label: 'Last action', html: v => esc(seWhen(v))},
    {k: 'status', label: 'State', html: v => okb(v)}
  ], SE_STAFF_ACTIVITY, {sort: 'lastAction', pageSize: 6});

  const audit = SE_AUDIT_LOG.concat(SE_AUDIT).slice(0, 40);
  if(el('scAuditPill')) el('scAuditPill').textContent = num(audit.length) + ' events';
  renderTable('scAuditBody', [
    {k: 'when', label: 'When', html: v => esc(seWhen(v))},
    {k: 'action', label: 'Action'},
    {k: 'target', label: 'Record'},
    {k: 'by', label: 'Officer', html: v => esc(seStaffName(v))}
  ], audit.map((a, i) => Object.assign({id: 'AUD-' + i}, a)), {sort: 'when', pageSize: 8});

  put('scGrid',
    chartBox({title: 'Who may do what', sub: 'Capabilities granted per role', type: 'bar', h: 200,
      cats: SE_ROLES.map(r => r.split(' ')[0]),
      series: [{name: 'Capabilities', data: SE_ROLES.map(r => (SE_PERM_STATE[r] || []).filter(Boolean).length)}],
      value: num(SE_CAPS.length) + ' in total'}) +
    chartBox({title: 'Restricted fields', sub: 'Where the figures are held', type: 'donut', h: 200,
      cats: SE_SENSITIVE.map(x => x.field.split(' ')[0]),
      series: [{name: 'Fields', data: SE_SENSITIVE.map(() => 1)}],
      value: num(SE_SENSITIVE.length)}));
}
function sePermToggle(role, i){
  if(!SE_PERM_STATE[role]) return;
  SE_PERM_STATE[role][i] = SE_PERM_STATE[role][i] ? 0 : 1;
  seAudit('Change permission', role, SE_CAPS[i] + ' · ' + (SE_PERM_STATE[role][i] ? 'granted' : 'withdrawn'));
  renderSecurity();
  toast(role + ' · ' + SE_CAPS[i] + (SE_PERM_STATE[role][i] ? ' granted' : ' withdrawn'));
}

/* ===================== 19 · DATABASE ===================== */
function renderDatabase(){
  const s = seStats();
  const gaps = SE_DB_TABLES.filter(t => t.rls !== 'Enabled');
  if(el('dbPill')){ el('dbPill').className = 'badge ' + (gaps.length ? 'b-warn' : 'b-ok');
    el('dbPill').textContent = gaps.length ? gaps.length + ' policy gap' : 'Every table protected'; }
  put('dbKpis', [
    ['Tables', num(SE_DB_TABLES.length), 'Salary, payroll, expenses, ledger', ''],
    ['Rows at rest', num(sum(SE_DB_TABLES, t => t.rows)), 'Across every table', ''],
    ['Stored functions', num(SE_DB_FUNCS.length), 'Payroll, postings and views', ''],
    ['Row-level security', num(SE_DB_TABLES.filter(t => t.rls === 'Enabled').length) + ' of ' + num(SE_DB_TABLES.length),
      gaps.length ? gaps.length + ' without a policy' : 'Every table has one', gaps.length ? 'red' : ''],
    ['Recent errors', num(SE_DB_ERRORS.length), num(SE_DB_ERRORS.filter(e => e.status === 'Open').length) + ' still open', ''],
    ['Migrations', num(SE_MIGRATIONS.length), num(SE_MIGRATIONS.filter(m => m.status === 'Pending').length) + ' pending', ''],
    ['Health checks', num(SE_DB_CHECKS().filter(c => c.status === 'Pass').length) + ' of ' + num(SE_DB_CHECKS().length), 'Run on every load', ''],
    ['Schema version', '2026.10.30.3', 'Matches the app build', '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join(''));

  if(el('dbTblPill')) el('dbTblPill').textContent = num(SE_DB_TABLES.length) + ' tables';
  renderTable('dbTblBody', [
    {k: 'table', label: 'Table'},
    {k: 'rows', label: 'Rows', num: true},
    {k: 'size', label: 'Size'},
    {k: 'rls', label: 'Policy', html: v => badge(v, v === 'Enabled' ? 'b-ok' : 'b-crit')},
    {k: 'function', label: 'Written by'},
    {k: 'lastWrite', label: 'Last write', html: v => esc(seWhen(v))}
  ], SE_DB_TABLES.map((t, i) => Object.assign({id: t.table}, t)), {sort: 'rows', pageSize: 8});

  if(el('dbFnPill')) el('dbFnPill').textContent = num(SE_DB_FUNCS.length) + ' objects';
  renderTable('dbFnBody', [
    {k: 'name', label: 'Object'},
    {k: 'kind', label: 'Kind'},
    {k: 'invoker', label: 'Invoker'},
    {k: 'calls', label: 'Calls', num: true},
    {k: 'status', label: 'State', html: v => okb(v)},
    {k: 'note', label: 'What it does'}
  ], SE_DB_FUNCS, {sort: 'calls', pageSize: 8});

  if(el('dbRlsPill')) el('dbRlsPill').textContent = gaps.length ? gaps.length + ' gap' : 'All protected';
  put('dbRls', SE_DB_TABLES.map(t => kvRow(t.table, t.rls === 'Enabled'
    ? badge('RLS enabled', 'b-ok') : badge(t.rls, 'b-crit'))).join(''));
  put('dbAtomic', kvRow('Payroll in one transaction', badge('Yes', 'b-ok'))
    + kvRow('Posting is append-only', badge('Yes', 'b-ok'))
    + kvRow('Unbalanced pairs refused', badge('Yes', 'b-ok'))
    + kvRow('Duplicate line guard', badge('Unique key', 'b-ok')));
  put('dbDup', kvRow('Duplicate payroll line', 'Refused by payroll_lines_period_staff_key')
    + kvRow('Duplicate expense invoice', 'Refused by the invoice unique key')
    + kvRow('Duplicate payment request', 'Refused on the idempotency key'));

  if(el('dbErrPill')) el('dbErrPill').textContent = num(SE_DB_ERRORS.length) + ' recent';
  renderTable('dbErrBody', [
    {k: 'when', label: 'When', html: v => esc(seWhen(v))},
    {k: 'code', label: 'Code'},
    {k: 'message', label: 'Message'},
    {k: 'count', label: 'Times', num: true},
    {k: 'status', label: 'State', html: v => okb(v)}
  ], SE_DB_ERRORS, {sort: 'when', pageSize: 4});

  const checks = SE_DB_CHECKS();
  if(el('dbChkPill')) el('dbChkPill').textContent = checks.filter(c => c.status === 'Pass').length + '/' + checks.length;
  put('dbChecksBody', checks.map(c => `<div class="checkrow"><div class="ck ${c.status === 'Pass' ? 'pass' : 'crit'}">${c.status === 'Pass' ? '✓' : '!'}</div>
      <div style="flex:1"><div style="font-size:10.5px;font-weight:800">${esc(c.check)}</div>
      <div class="qhint">${esc(String(c.value))}</div></div><div>${okb(c.status === 'Pass' ? 'Pass' : 'Failed')}</div></div>`).join(''));

  if(el('dbMigPill')) el('dbMigPill').textContent = num(SE_MIGRATIONS.length) + ' migrations';
  renderTable('dbMigBody', [
    {k: 'id', label: 'Version'},
    {k: 'name', label: 'Change'},
    {k: 'when', label: 'Applied', html: v => esc(seWhen(v))},
    {k: 'status', label: 'State', html: v => okb(v)}
  ], SE_MIGRATIONS, {sort: 'when', pageSize: 5});
  if(el('dbSchemaBox') && !String(el('dbSchemaBox').innerHTML || '').trim())
    el('dbSchemaBox').innerHTML = '<div class="qhint">Press “Show the schema” to read the tables, keys and policies behind this module.</div>';

  put('dbGrid',
    chartBox({title: 'Rows by table', sub: 'Where the data lives', type: 'bar', h: 200,
      cats: SE_DB_TABLES.slice(0, 6).map(t => t.table.split('_')[0]),
      series: [{name: 'Rows', data: SE_DB_TABLES.slice(0, 6).map(t => t.rows)}],
      value: compact(sum(SE_DB_TABLES, t => t.rows))}) +
    chartBox({title: 'Function calls', sub: 'Definer and invoker objects', type: 'bar', h: 200,
      cats: SE_DB_FUNCS.slice(0, 5).map(f => f.name.split('_')[0]),
      series: [{name: 'Calls', data: SE_DB_FUNCS.slice(0, 5).map(f => f.calls), colour: '#1E9E6A'}],
      value: num(sum(SE_DB_FUNCS, f => f.calls))}));
}
function seRlsFix(){
  const gaps = SE_DB_TABLES.filter(t => t.rls !== 'Enabled');
  if(!gaps.length){ toast('Every table already has a policy', 'ok'); return; }
  gaps.forEach(t => { t.rls = 'Enabled'; });
  SE_MIGRATIONS.unshift({id: '20261103_0' + (SE_MIGRATIONS.length % 9), name: 'enable RLS on ' + gaps.map(t => t.table).join(', '),
    when: TODAY + ' ' + seNow2(), status: 'Applied'});
  seAudit('Enable row-level security', gaps.map(t => t.table).join(', '), 'Policy applied to ' + gaps.length + ' table');
  renderAll();
  toast(gaps.length + ' table polic' + (gaps.length === 1 ? 'y' : 'ies') + ' applied');
}
function seDbCheck(){
  const checks = SE_DB_CHECKS();
  const failed = checks.filter(c => c.status !== 'Pass');
  seAudit('Run database checks', checks.length + ' checks', failed.length + ' failing');
  put('dbChecksBody', checks.map(c => `<div class="checkrow"><div class="ck ${c.status === 'Pass' ? 'pass' : 'crit'}">${c.status === 'Pass' ? '✓' : '!'}</div>
      <div style="flex:1"><div style="font-size:10.5px;font-weight:800">${esc(c.check)}</div>
      <div class="qhint">${esc(String(c.value))}</div></div><div>${okb(c.status === 'Pass' ? 'Pass' : 'Failed')}</div></div>`).join(''));
  toast(failed.length ? failed.length + ' checks need attention' : 'Every check passes', failed.length ? 'err' : 'ok');
}
function seSchema(){
  const rows = SE_DB_TABLES.map(t => [t.table, num(t.rows), t.size, t.rls, t.function]);
  put('dbSchemaBox', `<div class="tblwrap" style="max-height:260px"><table class="tbl2 dense">
      <thead><tr><th>Table</th><th class="num">Rows</th><th>Size</th><th>Policy</th><th>Written by</th></tr></thead>
      <tbody>${rows.map(r => `<tr><td>${esc(r[0])}</td><td class="num">${esc(r[1])}</td><td>${esc(r[2])}</td>
        <td>${esc(r[3])}</td><td>${esc(r[4])}</td></tr>`).join('')}</tbody></table></div>
    <div class="qhint" style="margin-top:6px">Schema 2026.10.30.3 · ${num(SE_DB_FUNCS.length)} functions and views · ${num(SE_MIGRATIONS.length)} migrations.</div>`);
  toast('Schema opened');
}

/* ===================== 20 · REPORTS ===================== */
function seReport(key){
  const inWin = t => inRange(seIsos(t));
  const R = {
    payroll: () => ({title: 'Monthly Payroll Report', note: 'What the open period costs, line by line.',
      cols: [['Staff member', 'staff'], ['Gross', 'gross'], ['Allowances', 'allowances'], ['Bonus', 'bonus'],
        ['Deductions', 'deductions'], ['Net', 'net'], ['Route', 'method'], ['State', 'status']],
      rows: SE_PAYROLL_LINES.filter(l => sePass(l)).map(l => ({staff: seStaffName(l.staff), gross: seM(l.gross),
        allowances: seM(l.allowances), bonus: seM(l.bonus), deductions: seM(l.deductions), net: seM(l.net),
        method: l.method, status: l.status}))}),
    annual: () => ({title: 'Annual Salary Report', note: 'Every salary record and what a year of it costs.',
      cols: [['Staff member', 'staff'], ['Basic', 'basic'], ['Gross', 'gross'], ['Annual gross', 'annual'], ['Band', 'band'], ['State', 'status']],
      rows: SE_SALARIES.map(x => ({staff: seStaffName(x.staff), basic: seM(x.basic), gross: seM(x.gross),
        annual: seM(x.gross * 12), band: x.band, status: x.status}))}),
    allowances: () => ({title: 'Allowances and Benefits Report', note: 'What is paid on top of basic.',
      cols: [['Staff member', 'staff'], ['Allowance', 'type'], ['Basis', 'basis'], ['Amount', 'amount'], ['State', 'status']],
      rows: SE_ALLOWANCE_LINES.map(x => ({staff: seStaffName(x.staff), type: x.type, basis: x.basis,
        amount: seM(x.amount), status: x.status}))}),
    statutory: () => ({title: 'Statutory Deductions Report', note: 'PAYE, pension and NHIMA with the remittance state.',
      cols: [['Record', 'id'], ['Item', 'item'], ['Period', 'period'], ['Body', 'body'], ['Amount', 'amount'], ['Due', 'due'], ['State', 'status']],
      rows: SE_STATUTORY.map(x => ({id: x.id, item: x.item, period: monthLabel(x.period), body: x.body,
        amount: seM(x.amount), due: fmtDate(x.due), status: x.status}))}),
    expenses: () => ({title: 'Business Expenses Report', note: 'Every operating expense, by category and cost centre.',
      cols: [['Record', 'id'], ['Date', 'when'], ['Category', 'category'], ['Supplier', 'supplier'], ['Department', 'dept'],
        ['Cost centre', 'costCentre'], ['Amount', 'amount'], ['State', 'status']],
      rows: SE_EXPENSES.filter(e => sePass(e)).map(e => ({id: e.id, when: fmtDate(e.when), category: e.category,
        supplier: e.supplier, dept: e.dept, costCentre: e.costCentre, amount: seM(e.amount), status: e.status}))}),
    system: () => ({title: 'System Operating Charges Report', note: 'Providers, cycles, expected and billed.',
      cols: [['Service', 'name'], ['Provider', 'provider'], ['Cycle', 'cycle'], ['Expected', 'expected'],
        ['Billed', 'actual'], ['Variance', 'variance'], ['Renews', 'renewal'], ['State', 'status']],
      rows: SE_SYSTEM.map(x => ({name: x.name, provider: x.provider, cycle: x.cycle, expected: seM(x.expected),
        actual: seM(x.actual), variance: seM(x.variance), renewal: fmtDate(x.renewal), status: x.status}))}),
    suppliers: () => ({title: 'Supplier Payments Report', note: 'What each supplier was paid, and when.',
      cols: [['Supplier', 'supplier'], ['When', 'when'], ['Route', 'method'], ['Amount', 'amount'], ['Reference', 'reference'], ['State', 'status']],
      rows: SE_SUPPLIER_PAYMENTS.map(p => ({supplier: p.supplier, when: fmtDate(p.when), method: p.method,
        amount: seM(p.amount), reference: p.reference || '—', status: p.status}))}),
    recurring: () => ({title: 'Recurring Expenses Report', note: 'What renews, when, and for how much.',
      cols: [['Charge', 'name'], ['Provider', 'provider'], ['Cycle', 'cycle'], ['Expected', 'expected'],
        ['Renews', 'renewal'], ['Approval', 'approval'], ['State', 'status']],
      rows: SE_RECURRING.map(r => ({name: r.name, provider: r.provider, cycle: r.cycle, expected: seM(r.expected),
        renewal: fmtDate(r.renewal), approval: r.approval, status: r.status}))}),
    budget: () => ({title: 'Budget Versus Actual Report', note: 'Every budget against what has been spent.',
      cols: [['Budget', 'scope'], ['Kind', 'kind'], ['Cost centre', 'costCentre'], ['Budget', 'monthly'],
        ['Actual', 'actual'], ['Variance', 'variance'], ['State', 'status']],
      rows: SE_BUDGETS.map(b => ({scope: b.scope, kind: b.kind, costCentre: b.costCentre, monthly: seM(b.monthly),
        actual: seM(b.actual), variance: seM(b.variance), status: b.status}))}),
    obligations: () => ({title: 'Outstanding Payment Obligations', note: 'What is still owed and when it falls due.',
      cols: [['Obligation', 'what'], ['Kind', 'kind'], ['Party', 'party'], ['Amount', 'amount'], ['Due', 'due'], ['State', 'status']],
      rows: SE_EXPENSES.filter(e => ['Pending approval', 'Approved', 'Overdue'].includes(e.status)).map(e => ({
        what: e.invoice + ' · ' + e.category, kind: 'Expense', party: e.supplier, amount: seM(e.amount),
        due: fmtDate(addDays(e.when, 30)), status: e.status}))
        .concat(SE_STATUTORY.filter(x => x.status !== 'Paid').map(x => ({what: x.item + ' ' + monthLabel(x.period),
          kind: 'Statutory', party: x.body, amount: seM(x.amount), due: fmtDate(x.due), status: x.status})))
        .concat(SE_CLAIMS.filter(c => ['Approved', 'Pending approval'].includes(c.status)).map(c => ({
          what: c.id + ' · ' + c.category, kind: 'Claim', party: seStaffName(c.staff), amount: seM(c.amount),
          due: fmtDate(addDays(c.when, 14)), status: c.status})))}),
    trends: () => ({title: 'Expense Trends and Forecasts', note: 'Six months of spend, with a forward view.',
      cols: [['Month', 'month'], ['Expenses', 'expenses'], ['Payroll', 'payroll'], ['System', 'system'], ['Total', 'total'], ['Forecast', 'forecast']],
      rows: SE_EXPENSE_MONTHS.map((m, i) => {
        const exp = sum(SE_EXPENSES.filter(e => e.month === m), e => e.amount);
        const pay = SE_PAYROLL.filter(p => p.period === m).reduce((s2, p) => s2 + p.net, 0);
        const sys = SE_SYSTEM_ACTUAL;
        return {month: monthLabel(m), expenses: seM(exp), payroll: seM(pay), system: seM(sys),
          total: seM(exp + pay + sys), forecast: seM(Math.round((exp + pay + sys) * (1.02 + i * 0.005)))};
      })}),
    responsible: () => ({title: 'Staff Member Responsible', note: 'Who owns each cost and each approval.',
      cols: [['Staff member', 'name'], ['Role', 'role'], ['Claims', 'claims'], ['Claimed', 'value'],
        ['Approvals made', 'approvals'], ['Last action', 'last'], ['State', 'status']],
      rows: SE_STAFF_ACTIVITY.map(a => ({name: a.name, role: a.role, claims: a.claims, value: seM(a.claimValue || 0),
        approvals: a.approvals, last: seWhen(a.lastAction), status: a.status}))}),
    changes: () => ({title: 'Record Creation and Modification History', note: 'Every change, with the officer and the time.',
      cols: [['When', 'when'], ['Setting', 'what'], ['Area', 'area'], ['Was', 'from'], ['Now', 'to'], ['Officer', 'by']],
      rows: SE_CHANGES.map(c => ({when: seWhen(c.when), what: c.what, area: c.area, from: c.from, to: c.to,
        by: staffName(c.by)}))}),
    authorised: () => ({title: 'Export Authorised Reports', note: 'Who may export what, and what has been exported.',
      cols: [['When', 'when'], ['Report', 'report'], ['Format', 'format'], ['Rows', 'rows'], ['By', 'by'], ['Filters', 'filters']],
      rows: EXPORTS.map(x => ({when: seWhen(x.when), report: x.report, format: x.format, rows: x.rows,
        by: x.by, filters: x.filters}))})
  };
  return (R[key] || R.payroll)();
}
function seReportColsNum(k){ return /amount|value|gross|net|basic|total|rows|forecast|expected|actual|variance|budget|claims|approvals/i.test(k); }
function runSeReport(key, fmt){
  const d = seReport(key);
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
      [{label: 'Download CSV', act: () => runSeReport(key, 'csv')},
       {label: 'Download Excel', act: () => runSeReport(key, 'xlsx')},
       {label: 'Close', act: 'close'}]);
    return;
  }
  const name = 'salaries-' + key + '-report-' + TODAY.replace(/-/g, '');
  if(fmt === 'csv'){
    downloadFile(name + '.csv', 'text/csv', toCsv([labels].concat(rows)));
  } else if(fmt === 'xlsx'){
    downloadFile(name + '.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      xlsxBytes(d.title, labels, rows));
  } else {
    printTable(d.title, d.cols.map(c => ({label: c[0], num: seReportColsNum(c[1])})), rows);
  }
  logExport(d.title, fmt === 'csv' ? 'CSV' : fmt === 'xlsx' ? 'Excel' : 'PDF', rows.length);
  renderExportHistory();
  renderReports();
  toast(d.title + ' generated');
}
function runSePack(fmt){
  const all = SE_REPORTS.map(r => seReport(r.key));
  const total = sum(all, d => d.rows.length);
  if(fmt === 'csv'){
    const parts = [];
    all.forEach(d => {
      parts.push(d.title.toUpperCase());
      parts.push(toCsv([d.cols.map(c => c[0])].concat(d.rows.map(r => d.cols.map(c => r[c[1]])))));
      parts.push('');
    });
    downloadFile('salaries-report-pack-' + TODAY.replace(/-/g, '') + '.csv', 'text/csv', parts.join('\r\n'));
  } else if(fmt === 'xlsx'){
    const first = all[0];
    downloadFile('salaries-report-pack-' + TODAY.replace(/-/g, '') + '.xlsx',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      xlsxBytes('Payroll and expense pack', first.cols.map(c => c[0]), first.rows.map(r => first.cols.map(c => r[c[1]]))));
  } else {
    printTable('Payroll and expense report pack · ' + all.length + ' reports',
      [{label: 'Report'}, {label: 'Rows', num: true}, {label: 'What it shows'}],
      all.map(d => [d.title, d.rows.length, d.note]));
  }
  logExport('Payroll and expense report pack', fmt === 'csv' ? 'CSV' : fmt === 'xlsx' ? 'Excel' : 'PDF', total);
  renderExportHistory();
  renderReports();
  if(el('packMsg')) el('packMsg').textContent = 'The pack holds ' + all.length + ' reports and ' + num(total) + ' rows.';
  toast('Report pack generated');
}
function renderReports(){
  const s = seStats();
  if(el('rpPill')){ el('rpPill').className = 'badge b-gray'; el('rpPill').textContent = num(SE_REPORTS.length) + ' reports'; }
  put('rpKpis', [
    ['Reports', num(SE_REPORTS.length), 'Payroll, expenses and budgets', ''],
    ['Exports made', num(EXPORTS.length), 'Recorded in the history', ''],
    ['Formats', '4', 'Preview · CSV · Excel · PDF', ''],
    ['Payroll rows', num(seReport('payroll').rows.length), 'Built from the live register', ''],
    ['Expense rows', num(seReport('expenses').rows.length), 'Every operating expense', ''],
    ['Obligation rows', num(seReport('obligations').rows.length), 'What is still owed', ''],
    ['Changes recorded', num(SE_CHANGES.length), 'Who changed what', ''],
    ['Report window', fmtDate(FILTER.from) + ' – ' + fmtDate(FILTER.to), 'Follows the filter bar', '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join(''));

  if(el('rpCount')) el('rpCount').textContent = num(SE_REPORTS.length) + ' ready';
  if(el('packMsg') && !String(el('packMsg').textContent || '').trim())
    el('packMsg').textContent = 'The pack follows the filters above — ' + filterLine() + '.';
  put('rpCards', SE_REPORTS.map(r => `<div class="repcard">
      <div class="rt">${esc(r.title)}</div>
      <div class="rd">${esc(r.desc)}</div>
      <div class="acts">
        <button class="btn btn-ghost" data-serep="${esc(r.key)}" data-fmt="preview">Preview</button>
        <button class="btn btn-ghost" data-serep="${esc(r.key)}" data-fmt="csv">CSV</button>
        <button class="btn btn-ghost" data-serep="${esc(r.key)}" data-fmt="xlsx">Excel</button>
        <button class="btn btn-ghost" data-serep="${esc(r.key)}" data-fmt="pdf">PDF</button>
      </div></div>`).join(''));

  if(el('chgPill')) el('chgPill').textContent = num(SE_CHANGES.length) + ' changes';
  renderTable('chgBody', [
    {k: 'when', label: 'When', html: v => esc(seWhen(v))},
    {k: 'what', label: 'Setting'},
    {k: 'area', label: 'Area'},
    {k: 'from', label: 'Was'},
    {k: 'to', label: 'Now'},
    {k: 'by', label: 'Officer', html: v => esc(staffName(v))}
  ], SE_CHANGES, {sort: 'when', pageSize: 7});

  const last = SE_CHANGES[0];
  if(el('chgWhoPill')) el('chgWhoPill').textContent = last ? staffName(last.by) : '—';
  put('chgWho', last ? kvRow('Officer', esc(staffName(last.by)) + ' · ' + esc(last.by))
    + kvRow('What changed', esc(last.what)) + kvRow('Area', esc(last.area))
    + kvRow('Previous value', esc(last.from)) + kvRow('Updated value', esc(last.to)) : '<div class="empty">No change recorded.</div>');
  put('chgStamp', last ? `<div class="note gray"><div>Recorded ${esc(seWhen(last.when))} · Golden Financial Services · Lilongwe</div></div>` : '');

  if(el('rpAuthPill')) el('rpAuthPill').textContent = num(SE_REPORTS.length) + ' authorised';
  renderTable('rpAuthBody', [
    {k: 'title', label: 'Report'},
    {k: 'desc', label: 'What it shows'},
    {k: 'fmt', label: 'Formats'}
  ], SE_REPORTS.map(r => ({id: r.key, title: r.title, desc: r.desc, fmt: 'CSV · Excel · PDF'})), {sort: 'title', pageSize: 8});
  if(el('rpAuthMsg') && !String(el('rpAuthMsg').textContent || '').trim())
    el('rpAuthMsg').textContent = 'Every report in this library may be exported by the Finance Manager and the Administrator; the export is logged.';

  renderSettingsForm();
  renderSettingsTables();

  put('rpGrid',
    chartBox({title: 'Report rows', sub: 'How much each report holds', type: 'bar', h: 200,
      cats: SE_REPORTS.slice(0, 6).map(r => r.key),
      series: [{name: 'Rows', data: SE_REPORTS.slice(0, 6).map(r => seReport(r.key).rows.length)}],
      value: num(sum(SE_REPORTS, r => seReport(r.key).rows.length))}) +
    chartBox({title: 'Exports by format', sub: 'What has been generated', type: 'donut', h: 200,
      cats: ['CSV', 'Excel', 'PDF'],
      series: [{name: 'Exports', data: ['CSV', 'Excel', 'PDF'].map(f => EXPORTS.filter(x => x.format === f).length)}],
      value: num(EXPORTS.length)}));
}

/* ---- settings ---- */
function renderSettingsForm(){
  const map = {
    setCcy: SE_SET.currency, setPayDay: SE_SET.payDay, setCutOff: SE_SET.cutOffDay,
    setFrequency: SE_SET.payFrequency, setPayMode: SE_SET.payMode,
    setSalaryAppr: SE_SET.salaryApproval, setHighValue: SE_SET.highValueApproval,
    setOverride: SE_SET.budgetOverrideThreshold, setClaimLimit: SE_SET.claimLimit,
    setReceiptLimit: SE_SET.receiptRequiredAbove, setOpBudget: SE_SET.monthlyOperatingBudget,
    setPayrollBudget: SE_SET.payrollBudget, setSystemBudget: SE_SET.systemBudget,
    setPensionEe: SE_SET.pensionEmployeePct, setPensionEr: SE_SET.pensionEmployerPct,
    setNhima: SE_SET.nhimaEmployeePct, setOvertime: SE_SET.overtimeRate, setReminder: SE_SET.reminderDays,
    setNotifySms: SE_SET.notifySms ? 'On' : 'Off', setNotifyEmail: SE_SET.notifyEmail ? 'On' : 'Off'
  };
  Object.keys(map).forEach(id => {
    const n = el(id);
    if(!n) return;
    if(n.tagName === 'SELECT') n.value = String(map[id]);
    else if(document.activeElement !== n) n.value = String(map[id]);
  });
  put('setRuleBox', [['Salary rule', SE_SET.salaryRule], ['Claim rule', SE_SET.claimRule],
    ['Payroll rule', SE_SET.payrollRule], ['Expense rule', SE_SET.expenseRule],
    ['Recurring rule', SE_SET.recurringRule], ['Security rule', SE_SET.securityRule]]
    .map(([k, v]) => `<div class="risk"><div><div class="rn">${esc(k)}</div><div class="rs">${esc(v)}</div></div></div>`).join(''));
  if(el('setMsg') && !String(el('setMsg').textContent || '').trim())
    el('setMsg').textContent = 'Saving writes a change-history row for every value that moved, with the previous and the updated figure.';
}
function seValidateSettings(next){
  const errs = [];
  if(!(next.payDay >= 1 && next.payDay <= 31)) errs.push('The pay day must be between 1 and 31.');
  if(!(next.cutOffDay >= 1 && next.cutOffDay <= 31)) errs.push('The cut-off day must be between 1 and 31.');
  if(next.cutOffDay >= next.payDay) errs.push('The cut-off day must fall before the pay day.');
  if(!(next.payrollBudget > 0)) errs.push('The payroll budget must be above zero.');
  if(next.payrollBudget + next.systemBudget > next.monthlyOperatingBudget)
    errs.push('Payroll plus system budgets cannot exceed the operating budget.');
  if(next.receiptRequiredAbove > next.claimLimit) errs.push('The receipt limit cannot exceed the claim limit.');
  if(next.salaryApproval > next.highValueApproval) errs.push('The salary approval limit cannot exceed the high-value limit.');
  if(!(next.pensionEmployeePct >= 0 && next.pensionEmployeePct <= 30)) errs.push('The pension rate must be between 0 and 30%.');
  if(!(next.nhimaEmployeePct >= 0 && next.nhimaEmployeePct <= 10)) errs.push('The NHIMA rate must be between 0 and 10%.');
  return errs;
}
function seSaveSettings(){
  const next = {
    currency: el('setCcy').value, payDay: Number(el('setPayDay').value) || 0,
    cutOffDay: Number(el('setCutOff').value) || 0, payFrequency: el('setFrequency').value,
    payMode: el('setPayMode').value, salaryApproval: Number(el('setSalaryAppr').value) || 0,
    highValueApproval: Number(el('setHighValue').value) || 0,
    budgetOverrideThreshold: Number(el('setOverride').value) || 0,
    claimLimit: Number(el('setClaimLimit').value) || 0,
    receiptRequiredAbove: Number(el('setReceiptLimit').value) || 0,
    monthlyOperatingBudget: Number(el('setOpBudget').value) || 0,
    payrollBudget: Number(el('setPayrollBudget').value) || 0,
    systemBudget: Number(el('setSystemBudget').value) || 0,
    pensionEmployeePct: Number(el('setPensionEe').value) || 0,
    pensionEmployerPct: Number(el('setPensionEr').value) || 0,
    nhimaEmployeePct: Number(el('setNhima').value) || 0,
    overtimeRate: Number(el('setOvertime').value) || 0,
    reminderDays: Number(el('setReminder').value) || 0,
    notifySms: el('setNotifySms').value === 'On', notifyEmail: el('setNotifyEmail').value === 'On'
  };
  const errs = seValidateSettings(next);
  if(errs.length){
    el('setMsg').textContent = errs.join(' ');
    toast(errs[0], 'err');
    return;
  }
  const labels = {currency: 'Currency', payDay: 'Pay day', cutOffDay: 'Cut-off day', payFrequency: 'Frequency',
    payMode: 'Payment route', salaryApproval: 'Salary approval limit', highValueApproval: 'High-value limit',
    budgetOverrideThreshold: 'Budget override limit', claimLimit: 'Claim limit',
    receiptRequiredAbove: 'Receipt limit', monthlyOperatingBudget: 'Operating budget',
    payrollBudget: 'Payroll budget', systemBudget: 'System budget', pensionEmployeePct: 'Pension employee',
    pensionEmployerPct: 'Pension employer', nhimaEmployeePct: 'NHIMA employee', overtimeRate: 'Overtime rate',
    reminderDays: 'Reminder days', notifySms: 'SMS notifications', notifyEmail: 'Email notifications'};
  let changed = 0;
  Object.keys(next).forEach(k => {
    const before = SE_SET[k];
    if(String(before) === String(next[k])) return;
    const money2 = /Budget|Approval|Limit|Threshold|Above|claimLimit/.test(k);
    const fmtv = v => typeof v === 'boolean' ? (v ? 'On' : 'Off') : money2 ? seM(Number(v)) : String(v);
    seLogChange('Settings', labels[k] || k, fmtv(before), fmtv(next[k]));
    SE_SET[k] = next[k];
    changed++;
  });
  if(!changed){ el('setMsg').textContent = 'Nothing changed — every value already holds that figure.'; toast('No change to save'); return; }
  seAudit('Save settings', changed + ' values', 'Payroll and expense configuration updated');
  el('setMsg').textContent = changed + ' setting' + (changed === 1 ? '' : 's') + ' saved and written to the change history.';
  renderAll();
  toast(changed + ' setting' + (changed === 1 ? '' : 's') + ' saved');
}
function seResetSettings(){
  Object.keys(SE_SET_DEFAULTS).forEach(k => { SE_SET[k] = SE_SET_DEFAULTS[k]; });
  seLogChange('Settings', 'Restore the defaults', 'Edited values', 'Factory defaults');
  seAudit('Restore settings', 'All values', 'Configuration returned to the defaults');
  renderAll();
  toast('Every setting is back to its default', 'ok');
}
function renderSettingsTables(){
  if(el('setRolesHead')) el('setRolesHead').innerHTML = '<tr><th>Role</th><th>Staff member</th><th>Scope</th><th>May change</th></tr>';
  if(el('setRolesBody')) el('setRolesBody').innerHTML = SE_ROLES.map(r => `<tr>
      <td><b>${esc(r)}</b></td><td>${esc(staffName(SE_ROLE_STAFF[r]))}</td>
      <td>${esc(r === 'Payroll Officer' ? 'Prepared payroll' : r === 'Internal Auditor' ? 'Read only' : 'Whole module')}</td>
      <td>${esc(r === 'Internal Auditor' ? 'Nothing' : r === 'Department Head' ? 'Their own claims' : 'Configuration')}</td></tr>`).join('');
  const audit = SE_AUDIT_LOG.concat(SE_AUDIT).slice(0, 30);
  if(el('setAuditPill')) el('setAuditPill').textContent = num(audit.length) + ' events';
  renderTable('setAuditBody', [
    {k: 'when', label: 'When', html: v => esc(seWhen(v))},
    {k: 'action', label: 'Action'},
    {k: 'target', label: 'Record'},
    {k: 'by', label: 'Officer', html: v => esc(seStaffName(v))}
  ], audit.map((a, i) => Object.assign({id: 'SA-' + i}, a)), {sort: 'when', pageSize: 8});
}

/* ===================== filters ===================== */
function seFillFilters(){
  const fill = (id, list, label) => {
    const n = el(id);
    if(!n) return;
    n.innerHTML = `<option value="">All ${esc(label)}</option>` +
      list.map(v => `<option value="${esc(v)}">${esc(v)}</option>`).join('');
  };
  fill('fltSeverity', ['Low', 'Medium', 'High', 'Critical'], 'severities');
  fill('fltStatus', ['Active', 'Pending approval', 'Approved', 'Paid', 'Failed', 'Rejected', 'Overdue',
    'Within budget', 'At the limit', 'Over budget', 'Issued', 'Draft', 'Returned', 'Submitted', 'Suspended'], 'states');
  const own = el('fltOwner');
  if(own) own.innerHTML = '<option value="">All officers</option>' +
    SE_STAFF.slice(0, 10).map(s => `<option value="${esc(s.id)}">${esc(s.name)}</option>`).join('');
  fill('fltDept', SE_DEPT_NAMES, 'departments');
  fill('fltCategory', SE_CATEGORIES.map(c => c.name), 'categories');
  seSyncFilters();
}
function seSyncFilters(){
  if(el('fltFrom')) el('fltFrom').value = FILTER.from;
  if(el('fltTo')) el('fltTo').value = FILTER.to;
  if(el('fltSearch')) el('fltSearch').value = FILTER.q;
  [['severity', 'fltSeverity'], ['status', 'fltStatus'], ['owner', 'fltOwner'], ['dept', 'fltDept'], ['category', 'fltCategory']]
    .forEach(([k, id]) => { if(el(id)) el(id).value = FILTER[k] || ''; });
  document.querySelectorAll('#fltLaneChips [data-lane]').forEach(c =>
    c.classList.toggle('on', (c.dataset.lane || '') === FILTER.lane));
}
function seApplyFilters(){
  FILTER.from = el('fltFrom').value || '2026-01-01';
  FILTER.to = el('fltTo').value || TODAY;
  FILTER.q = (el('fltSearch').value || '').trim();
  FILTER.severity = el('fltSeverity').value;
  FILTER.status = el('fltStatus').value;
  FILTER.owner = el('fltOwner').value;
  FILTER.dept = el('fltDept').value;
  FILTER.category = el('fltCategory').value;
  renderAll(); seFilterSummary();
  toast('Filters applied');
}
function seClearFilter(k){
  if(k) FILTER[k] = '';
  else Object.keys(FILTER).forEach(key => { if(key !== 'from' && key !== 'to') FILTER[key] = ''; });
  seSyncFilters(); renderAll(); seFilterSummary();
}
function seFilterSummary(){
  const chips = [];
  if(FILTER.lane) chips.push(['lane', 'Area: ' + FILTER.lane]);
  if(FILTER.severity) chips.push(['severity', 'Severity: ' + FILTER.severity]);
  if(FILTER.status) chips.push(['status', 'State: ' + FILTER.status]);
  if(FILTER.owner) chips.push(['owner', 'Officer: ' + staffName(FILTER.owner)]);
  if(FILTER.dept) chips.push(['dept', 'Department: ' + FILTER.dept]);
  if(FILTER.category) chips.push(['category', 'Category: ' + FILTER.category]);
  if(FILTER.q) chips.push(['q', 'Search: “' + FILTER.q + '”']);
  if(el('fltSummary')) el('fltSummary').textContent = chips.length
    ? chips.length + ' filter' + (chips.length === 1 ? '' : 's') + ' · ' + fmtDate(FILTER.from) + ' – ' + fmtDate(FILTER.to)
    : 'Date range only';
  if(el('fltChips')) el('fltChips').innerHTML = chips.map(([k, label]) =>
    `<span class="fchip on" data-clear="${k}">${esc(label)} <b style="margin-left:4px">×</b></span>`).join('')
    || '<span class="qhint">No filters applied — the whole payroll, expense and charge register is shown.</span>';
  const s = seStats();
  if(el('fltCounts')) el('fltCounts').innerHTML = [
    ['Staff', s.staff], ['Salary records', s.salaries], ['Payroll lines', s.total],
    ['Claims', s.claims], ['Expenses', SE_EXPENSES.length], ['System charges', SE_SYSTEM.length],
    ['Payments', s.payments], ['Approvals', SE_APPROVALS.length], ['Open issues', seIssues().length]
  ].map(([k, v]) => `<div><div class="sl">${esc(k)}</div><div class="sv">${num(v)}</div></div>`).join('');
  if(el('fltResult')) el('fltResult').textContent = 'Showing the payroll and expense register for ' +
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
  const s = seStats();
  const set = (id, v) => { if(el(id)) el(id).textContent = v; };
  set('bandScore', Math.round(s.score) + '%');
  set('bandPayroll', seM(s.salaryTotal));
  set('bandStaff', num(s.staff));
  set('bandCost', seM(s.operatingCost));
  set('bandAlerts', num(seIssues().length));
  set('topRefresh', REFRESH);
}
function renderAll(){
  renderOverview();
  renderSalaries();
  renderPayroll();
  renderAllowances();
  renderDeductions();
  renderPayslips();
  renderClaims();
  renderExpenses();
  renderSystem();
  renderRecurring();
  renderCategories();
  renderBudgets();
  renderPayments();
  renderApprovals();
  renderLedger();
  renderParties();
  renderNotifications();
  renderSecurity();
  renderDatabase();
  renderReports();
  renderStats();
  fillPills();
}

/* placeholders the panels used to leave as an em dash */
function fillPills(){
  const count = (p, t, noun) => { const a = el(p), b = el(t); if(a && b) a.textContent = num(b.children.length) + ' ' + noun; };
  count('syCyclePill', 'syInvBody', 'cycles');
  count('syVarPill', 'syVarBody', 'lines');
  count('rcDuePill', 'rcApprBody', 'due');
  count('bgTopPill', 'bgBody', 'lines');
  count('bgVarPill', 'bgRevBody', 'variances');
  count('apTypePill', 'apHistBody', 'recorded');
  const alerts = el('bgRevBody');
  if(el('bgAlertPill')) el('bgAlertPill').textContent = alerts
    ? num(alerts.querySelectorAll('.b-crit,.b-warn').length) + ' alerts' : 'No alerts';
}

/* ===================== wiring ===================== */
function wireAll(){
  document.addEventListener('click', e => {
    if(sortOrPage(e)) return;

    if(e.target.closest('#modalClose') || e.target.id === 'modal'){ closeModal(); return; }

    const snav = e.target.closest('.snav');
    if(snav){ e.preventDefault(); goto(snav.getAttribute('href').slice(1)); return; }

    const lane = e.target.closest('#fltLaneChips [data-lane]');
    if(lane){ FILTER.lane = lane.dataset.lane; seSyncFilters(); renderAll(); seFilterSummary(); return; }

    const chip = e.target.closest('[data-clear]');
    if(chip){ seClearFilter(chip.dataset.clear); return; }

    const jump = e.target.closest('[data-goto]');
    if(jump){ goto(jump.dataset.goto); return; }

    const notif = e.target.closest('[data-senotif]');
    if(notif){ seRuleToggle(Number(notif.dataset.senotif)); return; }

    const perm = e.target.closest('[data-seperm]');
    if(perm){ sePermToggle(perm.dataset.seperm, Number(perm.dataset.cap)); return; }

    const rep = e.target.closest('[data-serep]');
    if(rep){ runSeReport(rep.dataset.serep, rep.dataset.fmt); return; }

    if(e.target.closest('#fltApply')){ seApplyFilters(); return; }
    if(e.target.closest('#fltReset')){ seClearFilter(''); return; }
    if(e.target.closest('#refreshBtn')){ REFRESH = TODAY + ' · ' + seNow2(); renderAll(); toast('Every figure recalculated'); return; }
    if(e.target.closest('#printBtn')){ sePrintPage(); return; }
    if(e.target.closest('#quickCsv')){ seQuickCsv(); return; }
    if(e.target.closest('#bellBtn')){ goto('s17'); return; }

    /* 2 · salaries */
    if(e.target.closest('#saCreateBtn')){ seSalaryCreate(); return; }
    if(e.target.closest('#saAdjBtn')){ seSalaryAdjust(); return; }
    if(e.target.closest('#saStmtBtn')){ seSalaryStatement(); return; }
    /* 3 · payroll */
    if(e.target.closest('#prCalcBtn')){ sePayrollCalculate(); return; }
    if(e.target.closest('#prApproveBtn')){ sePayrollApprove(); return; }
    if(e.target.closest('#prCreateBtn')){ sePayrollCreate(); return; }
    if(e.target.closest('#prPayBtn')){ sePayrollPay(); return; }
    if(e.target.closest('#prRetryBtn')){ sePayrollRetry(); return; }
    /* 4 · allowances */
    if(e.target.closest('#awAddBtn')){ seAllowanceAdd(); return; }
    /* 5 · deductions */
    if(e.target.closest('#ddRemitBtn')){ seRemitStatutory(); return; }
    if(e.target.closest('#ddReportBtn')){ seStatutoryReport(); return; }
    /* 6 · payslips */
    if(e.target.closest('#psBuildBtn')){ seBuildPayslip(); return; }
    if(e.target.closest('#psCsvBtn')){ sePayslipRegister(); return; }
    if(e.target.closest('#psPrintBtn')){ sePayslipPrint(); return; }
    if(e.target.closest('#psMailBtn')){ sePayslipMail(); return; }
    /* 7 · claims */
    if(e.target.closest('#clSubmitBtn')){ seClaimSubmit(); return; }
    if(e.target.closest('#clApproveBtn')){ seClaimAction('approve'); return; }
    if(e.target.closest('#clRejectBtn')){ seClaimAction('reject'); return; }
    if(e.target.closest('#clReturnBtn')){ seClaimAction('return'); return; }
    if(e.target.closest('#clPayBtn')){ seClaimAction('pay'); return; }
    /* 8 · expenses */
    if(e.target.closest('#bxAddBtn')){ seExpenseAdd(); return; }
    if(e.target.closest('#bxClearBtn')){ seExpenseClear(); return; }
    if(e.target.closest('#bxApproveBtn')){ seExpenseAction('approve'); return; }
    if(e.target.closest('#bxPayBtn')){ seExpenseAction('pay'); return; }
    if(e.target.closest('#bxReceiptBtn')){ seExpenseAction('receipt'); return; }
    /* 9 · system charges */
    if(e.target.closest('#syPayBtn')){ seSystemAction('pay'); return; }
    if(e.target.closest('#syRenewBtn')){ seSystemAction('renew'); return; }
    if(e.target.closest('#syInvoiceBtn')){ seSystemAction('invoice'); return; }
    /* 10 · recurring */
    if(e.target.closest('#rcRenewBtn')){ seRecurringAction('renew'); return; }
    if(e.target.closest('#rcCancelBtn')){ seRecurringAction('cancel'); return; }
    if(e.target.closest('#rcAttachBtn')){ seRecurringAction('attach'); return; }
    /* 11 · categories */
    if(e.target.closest('#cgSaveBtn')){ seCategorySave(); return; }
    if(e.target.closest('#cgNewBtn')){ seCategoryNew(); return; }
    if(e.target.closest('#cgReportBtn')){ seCategoryReport(); return; }
    if(e.target.closest('#cgCsvBtn')){ seCategoryReport(); return; }
    /* 12 · budgets */
    if(e.target.closest('#bgRevBtn')){ seBudgetRevise(); return; }
    /* 13 · payments */
    if(e.target.closest('#pyRequestBtn')){ sePaymentRequest(); return; }
    if(e.target.closest('#pyConfirmBtn')){ sePaymentAction('confirm'); return; }
    if(e.target.closest('#pyReceiptBtn')){ sePaymentAction('receipt'); return; }
    if(e.target.closest('#pyFailBtn')){ sePaymentAction('fail'); return; }
    if(e.target.closest('#pyReconBtn')){ sePaymentAction('recon'); return; }
    if(e.target.closest('#pyResetBtn')){ sePaymentAction('reset'); return; }
    /* 14 · approvals */
    if(e.target.closest('#apApproveBtn')){ seApprovalAction('approve'); return; }
    if(e.target.closest('#apRejectBtn')){ seApprovalAction('reject'); return; }
    if(e.target.closest('#apReturnBtn')){ seApprovalAction('return'); return; }
    /* 15 · ledger */
    if(e.target.closest('#lgReconBtn')){ seLedgerReconcile(); return; }
    /* 16 · staff and suppliers */
    if(e.target.closest('#spVerifyBtn')){ seLinkVerify(); return; }
    if(e.target.closest('#spSupVerifyBtn')){ seSupplierVerify(); return; }
    if(e.target.closest('#spBankBtn')){ seSupplierBank(); return; }
    if(e.target.closest('#spStatementBtn')){ seSupplierStatement(); return; }
    /* 17 · notifications */
    if(e.target.closest('#ntTestSms')){ seTestChannel('sms'); return; }
    if(e.target.closest('#ntTestEmail')){ seTestChannel('email'); return; }
    /* 19 · database */
    if(e.target.closest('#dbRlsFix')){ seRlsFix(); return; }
    if(e.target.closest('#dbCheck')){ seDbCheck(); return; }
    if(e.target.closest('#dbSchemaBtn')){ seSchema(); return; }
    /* 20 · reports and settings */
    if(e.target.closest('#packCsv')){ runSePack('csv'); return; }
    if(e.target.closest('#packXlsx')){ runSePack('xlsx'); return; }
    if(e.target.closest('#packPdf')){ runSePack('pdf'); return; }
    if(e.target.closest('#packPrint')){ runSePack('pdf'); return; }
    if(e.target.closest('#rpExportAll')){
      SE_REPORTS.forEach(r => runSeReport(r.key, 'csv'));
      if(el('rpAuthMsg')) el('rpAuthMsg').textContent = SE_REPORTS.length + ' authorised reports were exported as CSV.';
      return; }
    if(e.target.closest('#setSave')){ seSaveSettings(); return; }
    if(e.target.closest('#setReset')){ seResetSettings(); return; }

    const row = e.target.closest('[data-tblrow]');
    if(row){ const rec = (STORE_ROWS[row.dataset.tblrow] || [])[Number(row.dataset.i)]; if(rec && rec._open) rec._open(); return; }
  });

  document.addEventListener('change', e => {
    const t = e.target;
    if(t.id === 'ddStaff'){ SE_SEL.dedStaff = t.value; renderDeductions(); return; }
    if(t.id === 'pyKind'){ seFillSel('pyPayee', sePayeesFor(t.value)); renderPayments(); return; }
    if(t.id === 'psPeriod' || t.id === 'psStaff'){ renderPayslips(); return; }
    if(t.id === 'cgName'){ seCategoryLoad(); return; }
    if(t.id === 'bgRevScope'){ return; }
    if(t.id === 'fltDept' || t.id === 'fltCategory'){ renderAll(); seFilterSummary(); return; }
  });

  document.addEventListener('input', e => {
    if(e.target.id === 'globalSearch'){ FILTER.q = e.target.value.trim(); renderAll(); seFilterSummary(); }
  });

  window.addEventListener('hashchange', () => {
    const id = (location.hash || '').slice(1);
    if(id && document.getElementById(id)) goto(id);
  });
  document.addEventListener('keydown', e => { if(e.key === 'Escape') closeModal(); });
}
function seExpenseClear(){
  el('bxAmount').value = ''; el('bxInvoice').value = ''; el('bxDescription').value = '';
  el('bxMsg').textContent = 'Form cleared — pick a category and a supplier to record another expense.';
  toast('Expense form cleared');
}
function seQuickCsv(){
  const cols = [['Staff member', 'staff'], ['Basic', 'basic'], ['Allowances', 'allowances'], ['Gross', 'gross'],
    ['Deductions', 'deductions'], ['Net', 'net'], ['State', 'status']];
  const rows = SE_SALARIES.filter(sePass).map(s => ({staff: seStaffName(s.staff), basic: seM(s.basic),
    allowances: seM(s.allowanceTotal), gross: seM(s.gross), deductions: seM(s.deductions), net: seM(s.net), status: s.status}));
  downloadFile('salary-register-' + TODAY.replace(/-/g, '') + '.csv', 'text/csv',
    toCsv([cols.map(c => c[0])].concat(rows.map(r => cols.map(c => r[c[1]])))));
  logExport('Salary register', 'CSV', rows.length);
  renderExportHistory();
  toast(rows.length + ' salary records exported');
}
function sePrintPage(){
  printTable('Salaries, Expenses and Operating Charges', [
    {label: 'Record'}, {label: 'Kind'}, {label: 'Party'}, {label: 'Amount', num: true}, {label: 'State'}],
    SE_SALARIES.slice(0, 40).map(s => [s.id, 'Salary · ' + s.frequency, seStaffName(s.staff), seM(s.net), s.status])
      .concat(SE_EXPENSES.slice(0, 40).map(e => [e.id, 'Expense · ' + e.category, e.supplier, seM(e.amount), e.status])));
  logExport('Payroll and expense register', 'PDF', 80);
  renderExportHistory();
  toast('Register ready to print');
}

/* ---- salary actions ---- */
function seSalaryCreate(){
  const staff = el('saStaff').value;
  const basic = Number(el('saBasic').value) || 0;
  if(!staff){ toast('Pick a staff member', 'err'); return; }
  if(basic < 50000){ toast('A basic salary below MK 50,000 looks wrong', 'err'); return; }
  if(seSalOf(staff)){ toast(seStaffName(staff) + ' already has a salary record', 'err'); return; }
  const s = SE_STAFF_BY_ID[staff] || {};
  const transport = Math.round(basic * 0.08), housing = Math.round(basic * 0.12);
  const comm = 30000, meal = 30000;
  const allowances = {Transport: transport, Housing: housing, Communication: comm, Meal: meal};
  const allowanceTotal = transport + housing + comm + meal;
  const gross = basic + allowanceTotal;
  const paye = Math.round(Math.max(0, Math.min(gross - 100000, 400000)) * 0.25 + Math.max(0, gross - 500000) * 0.30);
  const pension = Math.round(basic * SE_SET.pensionEmployeePct / 100);
  const nhima = Math.round(basic * SE_SET.nhimaEmployeePct / 100);
  const rec = {id: SE_SET.salaryPrefix + '-' + pad(1001 + SE_SALARIES.length, 4), staff, basic,
    frequency: el('saFrequency').value, effective: el('saEffective').value || TODAY,
    review: addMonths(TODAY, 12), allowances, allowanceTotal, gross, paye, pension, nhima,
    loanDeduction: 0, advance: 0, deductions: paye + pension + nhima, net: gross - (paye + pension + nhima),
    currency: SE_SET.currency, status: 'Active', bank: s.bank, account: s.account, taxId: s.tin,
    pensionNo: s.pensionNo, band: el('saBand').value, lastPayment: 'Pending',
    region: s.region, dept: s.dept, lane: 'Salaries', severity: 'Low', owner: 'STF-007', region2: s.region};
  SE_SALARIES.push(rec);
  SE_SAL_BY_ID[rec.id] = rec;
  SE_SAL_HISTORY.unshift({salary: rec.id, staff, when: TODAY, action: 'Salary record created',
    reason: 'Initial record at ' + seM(basic), by: 'STF-007'});
  SE_SEL.sal = rec.id;
  seAudit('Create salary record', rec.id, seStaffName(staff) + ' · ' + seM(basic) + ' · ' + rec.frequency);
  el('saMsg').textContent = 'Salary record ' + rec.id + ' created for ' + seStaffName(staff) + ' at ' + seM(basic) + ' a month.';
  el('saBasic').value = '';
  renderAll();
  toast('Salary record ' + rec.id + ' created');
}
function seSalaryAdjust(){
  const sal = SE_SAL_BY_ID[SE_SEL.sal];
  if(!sal){ toast('Pick a salary record first', 'err'); return; }
  const amount = Number(el('saAdjAmount').value) || 0;
  const type = el('saAdjType').value;
  const reason = (el('saAdjReason').value || '').trim();
  if(amount <= 0){ toast('The adjustment must be above zero', 'err'); return; }
  if(!reason){ toast('An adjustment needs a reason', 'err'); return; }
  const delta = type === 'Reduction' ? -amount : amount;
  if(sal.basic + delta < 50000){ toast('That reduction takes the basic below the minimum', 'err'); return; }
  const from = sal.basic;
  sal.basic += delta;
  sal.gross = sal.basic + sal.allowanceTotal;
  sal.paye = Math.round(Math.max(0, Math.min(sal.gross - 100000, 400000)) * 0.25 + Math.max(0, sal.gross - 500000) * 0.30);
  sal.pension = Math.round(sal.basic * SE_SET.pensionEmployeePct / 100);
  sal.nhima = Math.round(sal.basic * SE_SET.nhimaEmployeePct / 100);
  sal.deductions = sal.paye + sal.pension + sal.nhima + sal.loanDeduction + sal.advance;
  sal.net = sal.gross - sal.deductions;
  SE_ADJUSTMENTS.unshift({id: 'ADJ-' + pad(3200 + SE_ADJUSTMENTS.length, 4), salary: sal.id, staff: sal.staff,
    when: TODAY, type, from, to: sal.basic, delta, effective: el('saAdjDate').value || TODAY, reason,
    by: 'STF-007', approver: 'STF-009', status: amount > SE_SET.salaryApproval ? 'Pending approval' : 'Approved',
    lane: 'Salaries', severity: amount > SE_SET.salaryApproval ? 'High' : 'Low', owner: 'STF-007', region: sal.region});
  SE_SAL_HISTORY.unshift({salary: sal.id, staff: sal.staff, when: TODAY,
    action: type + ' of ' + seM(amount), reason, by: 'STF-007'});
  seAudit('Salary adjustment', sal.id, type + ' ' + seM(amount) + ' · ' + reason);
  el('saAdjAmount').value = ''; el('saAdjReason').value = '';
  renderAll();
  toast(seStaffName(sal.staff) + ' is now on ' + seM(sal.basic));
}
function seSalaryStatement(){
  const sal = SE_SAL_BY_ID[SE_SEL.sal];
  if(!sal){ toast('Pick a salary record first', 'err'); return; }
  const rows = [[fmtDate(sal.effective), 'Basic salary', seM(sal.basic), 'Active'],
    [fmtDate(sal.effective), 'Allowances', seM(sal.allowanceTotal), 'Active'],
    [fmtDate(sal.effective), 'PAYE', seM(sal.paye), 'Deducted'],
    [fmtDate(sal.effective), 'Pension', seM(sal.pension), 'Deducted'],
    [fmtDate(sal.effective), 'NHIMA', seM(sal.nhima), 'Deducted'],
    [fmtDate(TODAY), 'Net pay', seM(sal.net), 'Current']];
  downloadFile('salary-statement-' + sal.id + '.csv', 'text/csv',
    toCsv([['Date', 'Item', 'Amount', 'State']].concat(rows)));
  logExport('Salary statement · ' + seStaffName(sal.staff), 'CSV', rows.length);
  renderExportHistory();
  openModal('Salary statement · ' + seStaffName(sal.staff), sal.id + ' · ' + sal.frequency,
    `<div class="tblwrap"><table class="tbl2 dense"><thead><tr><th>Date</th><th>Item</th><th class="num">Amount</th><th>State</th></tr></thead>
      <tbody>${rows.map(r => `<tr><td>${esc(r[0])}</td><td>${esc(r[1])}</td><td class="num">${esc(r[2])}</td><td>${esc(r[3])}</td></tr>`).join('')}</tbody></table></div>`,
    [{label: 'Print', act: () => printTable('Salary statement · ' + seStaffName(sal.staff),
      [{label: 'Date'}, {label: 'Item'}, {label: 'Amount', num: true}, {label: 'State'}], rows)},
     {label: 'Close', act: 'close'}]);
}

/* ---- payroll actions ---- */
function sePayrollCreate(){
  const cutOff = el('prCutOff').value || TODAY;
  const payDate = el('prPayDate').value || addDays(TODAY, 4);
  if(payDate <= cutOff){ toast('The pay date must fall after the cut-off', 'err'); return; }
  const period = String(payDate).slice(0, 7);
  if(SE_PAYROLL.some(p => p.period === period)){ toast(monthLabel(period) + ' already has a payroll', 'err'); return; }
  const gross = SE_SALARY_TOTAL, allowances = SE_ALLOWANCE_TOTAL, deductions = SE_DEDUCTION_TOTAL;
  const rec = {id: SE_SET.payrollPrefix + '-' + period.slice(2, 7).replace('-', ''), period,
    label: monthLabel(period), from: period + '-01', to: period + '-28', payDate, cutOff,
    staffCount: SE_STAFF.filter(s => s.status === 'Active').length, gross, allowances, bonuses: 0,
    deductions, net: gross - deductions, employerPension: Math.round(gross * SE_SET.pensionEmployerPct / 100),
    status: 'Pending approval', approvedBy: '', paidOn: '', reference: '',
    lane: 'Payroll', severity: 'Medium', owner: 'STF-007', region: 'Lilongwe'};
  SE_PAYROLL.push(rec);
  SE_SEL.period = rec.id;
  seAudit('Create payroll period', rec.id, rec.label + ' · ' + seM(rec.net));
  renderAll();
  toast('Payroll ' + rec.id + ' created for ' + rec.label);
}
function sePayrollCalculate(){
  const p = sePeriodItem();
  if(!p){ toast('Pick a payroll period', 'err'); return; }
  if(p.status === 'Paid'){ toast('A paid payroll can no longer be recalculated', 'err'); return; }
  const lines = SE_PAYROLL_LINES.filter(l => l.payroll === p.id);
  p.gross = sum(lines, l => l.gross);
  p.allowances = sum(lines, l => l.allowances);
  p.bonuses = sum(lines, l => l.bonus);
  p.deductions = sum(lines, l => l.deductions);
  p.net = sum(lines, l => l.net);
  p.staffCount = lines.length;
  seAudit('Calculate payroll', p.id, lines.length + ' lines · ' + seM(p.net));
  put('prCalcBox', `<div class="minihead">Recalculated at ${esc(seNow())}</div>`
    + kvRow('Lines', num(lines.length)) + kvRow('Gross', seM(p.gross)) + kvRow('Allowances', seM(p.allowances))
    + kvRow('Bonuses', seM(p.bonuses)) + kvRow('Deductions', seM(p.deductions)) + kvRow('Net', '<b>' + seM(p.net) + '</b>'));
  renderAll();
  toast('Payroll recalculated · ' + seM(p.net));
}
function sePayrollApprove(){
  const p = sePeriodItem();
  if(!p){ toast('Pick a payroll period', 'err'); return; }
  if(p.status === 'Paid'){ toast('This payroll is already paid', 'err'); return; }
  if(p.net > SE_SET.highValueApproval * 20){
    p.approvedBy = 'STF-001';
  } else p.approvedBy = 'STF-009';
  p.status = 'Approved';
  seAudit('Approve payroll', p.id, seM(p.net) + ' approved by ' + staffName(p.approvedBy));
  renderAll();
  toast('Payroll ' + p.label + ' approved by ' + staffName(p.approvedBy));
}
function sePayrollPay(){
  const p = sePeriodItem();
  if(!p){ toast('Pick a payroll period', 'err'); return; }
  if(p.status !== 'Approved'){ toast('Approve the payroll before paying it', 'err'); return; }
  p.status = 'Paid'; p.paidOn = TODAY; p.reference = 'PAY-' + pad(5700 + SE_PAYROLL.indexOf(p), 5);
  SE_PAYROLL_LINES.filter(l => l.payroll === p.id && l.status !== 'Failed').forEach(l => { l.status = 'Paid'; });
  seAudit('Pay payroll', p.id, seM(p.net) + ' · reference ' + p.reference);
  SE_NOTIFY_LOG.unshift({when: TODAY + ' ' + seNow(), event: 'Salary paid', channel: 'SMS', to: 'The payroll',
    reference: p.id, status: 'Delivered', lane: 'Notifications', severity: 'Low', owner: 'STF-007', region: 'Lilongwe'});
  renderAll();
  toast('Payroll ' + p.label + ' paid · ' + p.reference);
}
function sePayLine(lineId){
  const l = SE_PAYROLL_LINES.find(x => x.id === lineId);
  if(!l) return;
  l.status = 'Paid'; l.reference = l.reference || 'PAY-' + pad(5900 + SE_PAYROLL_LINES.indexOf(l), 5);
  l.failure = '';
  seAudit('Pay payroll line', l.id, seStaffName(l.staff) + ' · ' + seM(l.net));
  renderAll();
  toast(seStaffName(l.staff) + ' paid ' + seM(l.net));
}
function sePayrollRetry(){
  const failed = SE_PAYROLL_LINES.filter(l => l.status === 'Failed');
  if(!failed.length){ toast('No payroll line has failed', 'ok'); return; }
  failed.forEach(l => { l.status = 'Pending'; l.failure = ''; l.reference = 'PAY-' + pad(6100 + SE_PAYROLL_LINES.indexOf(l), 5); });
  seAudit('Retry failed lines', failed.map(l => l.id).join(', '), failed.length + ' lines queued again');
  renderAll();
  toast(failed.length + ' salary lines queued for a retry');
}

/* ---- allowance actions ---- */
function seAllowanceAdd(){
  const staff = el('awStaff').value;
  const type = el('awType').value;
  const amount = Number(el('awAmount').value) || 0;
  if(!staff || !type){ toast('Pick a staff member and an allowance', 'err'); return; }
  if(amount <= 0){ toast('The allowance must be above zero', 'err'); return; }
  const sal = seSalOf(staff);
  const rec = {id: 'ALW-' + pad(4200 + SE_ALLOWANCE_LINES.length, 4), staff, salary: sal ? sal.id : '—',
    type, amount, period: SE_OPEN_PERIOD.period, basis: 'Per month',
    status: amount > 200000 ? 'Pending' : 'Approved', approvedBy: amount > 200000 ? '' : 'STF-007',
    when: TODAY, lane: 'Allowances', severity: 'Low', owner: 'STF-007', region: (SE_STAFF_BY_ID[staff] || {}).region || 'Lilongwe'};
  SE_ALLOWANCE_LINES.unshift(rec);
  if(sal){ sal.allowances[type] = (sal.allowances[type] || 0) + amount; sal.allowanceTotal += amount;
    sal.gross += amount; sal.deductions = sal.paye + sal.pension + sal.nhima + sal.loanDeduction + sal.advance;
    sal.net = sal.gross - sal.deductions; }
  SE_ALLOWANCE_HISTORY.unshift({when: TODAY, type, change: 'Allowance added', from: '—', to: seM(amount), by: 'STF-007',
    lane: 'Allowances', severity: 'Low', owner: 'STF-007', region: 'Lilongwe'});
  seAudit('Add allowance', rec.id, type + ' · ' + seM(amount) + ' · ' + seStaffName(staff));
  el('awAmount').value = '';
  renderAll();
  toast(type + ' of ' + seM(amount) + ' recorded for ' + seStaffName(staff));
}

/* boot */
(function(){
  seFillFilters();
  renderAll();
  seFilterSummary();
  renderExportHistory();
  wireAll();
  const hash = (location.hash || '').slice(1);
  if(hash) goto(hash);
})();

window.SALARIES_APP = {
  version: '1.0.0',
  today: TODAY,
  stats: seStats,
  alerts: seIssues,
  report: seReport,
  export: (key, fmt) => runSeReport(key || 'payroll', fmt || 'csv'),
  pack: runSePack,
  set: SE_SET,
  save: seSaveSettings,
  reset: seResetSettings,
  counts: () => ({
    staff: SE_STAFF.length, salaries: SE_SALARIES.length, payrollLines: SE_PAYROLL_LINES.length,
    claims: SE_CLAIMS.length, expenses: SE_EXPENSES.length, system: SE_SYSTEM.length,
    recurring: SE_RECURRING.length, budgets: SE_BUDGETS.length, payments: SE_PAYMENTS.length,
    approvals: SE_APPROVALS.length, ledger: SE_LEDGER.length, suppliers: SE_SUPPLIERS.length
  })
};
</script>
</body>
</html>
