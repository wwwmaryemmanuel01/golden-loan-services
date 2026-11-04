<script>
/* ============================================================
   SECURITY & PROTECTION (4/7)
   1 · Overview   2 · Staff accounts   3 · Authentication
   4 · Roles & access control
   ============================================================ */

function chartBox(o){
  return `<div class="chartcard">
    <div class="ch">
      <div><div class="ct">${esc(o.title)}</div><div class="cs">${esc(o.sub || '')}</div></div>
      ${o.value !== undefined ? `<div class="cv">${o.value}</div>` : ''}
    </div>
    ${o.chart || ''}
    ${o.note ? `<div class="qhint">${o.note}</div>` : ''}
  </div>`;
}
function meter(label, value, good, ok, hint){
  const cls = value >= good ? 'ok' : value >= ok ? 'warn' : 'bad';
  return `<div class="perfm">
    <div class="mt"><div>${esc(label)}</div><span>${r1(value)}%</span></div>
    <div class="mbar"><i class="${cls}" style="width:${clamp(value, 0, 100).toFixed(1)}%"></i></div>
    <div class="qhint" style="margin-top:1px">${esc(hint)}</div>
  </div>`;
}
const kvRow = (k, v) => `<div class="kvrow"><span>${esc(k)}</span><b>${v}</b></div>`;
const stack = (label, sub, action, go) => `<div class="risk">
    <div><div class="rn">${esc(label)}</div><div class="rs">${esc(sub)}</div></div>
    <div class="rv">${go ? `<button class="btn btn-ghost" data-goto="${go}">${esc(action)}</button>` : esc(action)}</div>
  </div>`;
const okBadge = v => badge(v, /^(Pass|Set|OK|Healthy|Enabled|Verified|Verified|Verified|Yes|Approved|Remediated|Current|Contained|Protected|Compliant|Active|Success|Matches approval|Authorised)$/i.test(String(v))
  ? 'b-ok' : /^(Gap|Review|Partial|Pending|In remediation|Patch|Accepted|Advisory|Warning|Re-verified)$/i.test(String(v))
  ? 'b-warn' : /^(Fail|Vulnerable|Breach|Open|Critical|High|Denied|Failed|Blocked|Gap — 46 days)$/i.test(String(v))
  ? 'b-crit' : 'b-gray');

/* ===================== 1 · SECURITY OVERVIEW ===================== */
function renderOverview(){
  const s = secStats();
  const activeSessions = SESSIONS.length;
  const recent = LOGINS.filter(l => l.when >= addDays(TODAY, -7));
  const suspicious = LOGINS.filter(l => l.result !== 'Success' || /ZA|ZM|KE/.test(l.place));

  el('bandScore').textContent = s.score + '%';
  el('bandSessions').textContent = num(activeSessions);
  el('bandLocked').textContent = num(s.locked.length);
  el('bandAlerts').textContent = num(s.open.length);
  el('ovStamp').textContent = 'Last refresh — ' + lastRefresh();
  el('ovStatusPill').className = 'badge ' + (s.score >= 85 ? 'b-ok' : s.score >= 70 ? 'b-warn' : 'b-crit');
  el('ovStatusPill').textContent = s.score >= 85 ? 'Protected' : s.score >= 70 ? 'Needs attention' : 'At risk';

  el('secKpis').innerHTML = [
    ['Overall security status', s.score + '%', (s.score >= 85 ? 'Protected' : s.score >= 70 ? 'Needs attention' : 'At risk') + ' across seven controls', 'gold'],
    ['Active staff sessions', num(activeSessions), `${num(SESSIONS.filter(x => !x.trusted).length)} from an untrusted device`, ''],
    ['Recent login attempts', num(recent.length), 'In the last seven days', ''],
    ['Failed login attempts', num(s.failed.length), `${num(s.failed.filter(f => f.result === 'Blocked').length)} refused while locked`, s.failed.length > 12 ? 'red' : ''],
    ['Locked accounts', num(s.locked.length), s.locked.map(a => a.name).join(', ') || 'None', s.locked.length ? 'red' : ''],
    ['Suspicious activities', num(suspicious.length), 'Failed sign-ins and off-shore addresses', suspicious.length ? 'red' : ''],
    ['Unauthorized access attempts', num(SEC_EVENTS.filter(e => e.outcome === 'Denied').length), 'Refused by the authorization layer', ''],
    ['Critical security alerts', num(s.critical.length), `${num(s.open.length)} incidents still open`, s.critical.length ? 'red' : ''],
    ['Database connection', DB.status, `${DB.engine} · ${DB.latency}`, ''],
    ['Recent security events', num(SEC_EVENTS.filter(e => e.when >= addDays(TODAY, -1)).length), 'Written to the log today', '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join('');

  el('dbPill').className = 'badge b-ok';
  el('dbPill').textContent = DB.status;
  el('dbStatusGrid').innerHTML = `<div class="pfields" style="grid-template-columns:1fr 1fr">
      ${kvRow('Project', esc(DB.project))}${kvRow('Region', esc(DB.region))}
      ${kvRow('Engine', esc(DB.engine))}${kvRow('Client', esc(DB.client))}
      ${kvRow('Pool', esc(DB.pool))}${kvRow('Latency', esc(DB.latency))}
      ${kvRow('Uptime (30 days)', esc(DB.uptime))}${kvRow('Last migration', fmtDate(DB.lastMigration))}
      ${kvRow('Row-level security', esc(DB.rls))}${kvRow('Errors (24 h)', num(DB.errors24h))}
    </div>`;

  el('secMeters').innerHTML = [
    meter('Account hygiene', pct(s.active.length, ACCOUNTS.length), 90, 70, `${s.active.length} of ${ACCOUNTS.length} accounts active and clean`),
    meter('Authentication strength', clamp(100 - s.failed.length * 1.1, 0, 100), 85, 70, `${s.failed.length} failed attempts across ${LOGINS.length} sign-ins`),
    meter('Session control', clamp(100 - SESSIONS.filter(x => !x.trusted).length * 18, 0, 100), 90, 75, `${SESSIONS.filter(x => x.trusted).length} of ${SESSIONS.length} sessions on a trusted device`),
    meter('Access control', clamp(100 - PRIV_CHANGES.filter(p => !p.approved).length * 12, 0, 100), 90, 75, `${PRIV_CHANGES.filter(p => !p.approved).length} permission changes awaiting approval`),
    meter('Data protection', clamp(100 - DATA_ACCESS.filter(d => !d.allowed).length * 8 - DATA_REQS.filter(r => r.status !== 'Completed').length * 4, 0, 100), 88, 72, `${DATA_ACCESS.filter(d => !d.allowed).length} lookups without a valid purpose`),
    meter('Database posture', pct(DB_TABLES.filter(t => t.rls === 'Enabled').length, DB_TABLES.length), 95, 80, `${s.rlsGaps.length} table with an open row-level policy`),
    meter('Remediation', pct(SEC_FINDINGS.filter(f => /Closed/.test(f.status)).length, SEC_FINDINGS.length), 80, 55, `${SEC_FINDINGS.filter(f => !/Closed/.test(f.status)).length} findings still open`)
  ].join('');

  const outcomeBuckets = ['Success', 'Failed', 'Blocked'];
  const byDay = [...new Set(LOGINS.map(l => l.when.slice(0, 10)))].sort().slice(-10);
  el('secGrid').innerHTML = [
    chartBox({title:'Sign-in outcomes', sub:'Attempts per day by result', value:num(LOGINS.length),
      chart: chart({type:'stacked', cats:byDay.map(d => d.slice(5)), h:200,
        series: outcomeBuckets.map((o, i) => ({name:o, colour:['#1E9E6A','#D93F3F','#E08C1E'][i],
          data: byDay.map(d => LOGINS.filter(l => l.when.slice(0,10) === d && l.result === o).length)}))})}),
    chartBox({title:'Incidents by area', sub:'Where the alerts come from', value:num(INCIDENTS.length),
      chart: chart({type:'donut', cats:SEC_LANES, h:200, colours:PALETTE,
        series:[{data:SEC_LANES.map(l => INCIDENTS.filter(i => i.lane === l).length)}]})}),
    chartBox({title:'Account states', sub:'Every staff account by state', value:num(ACCOUNTS.length),
      chart: chart({type:'bar', cats:['Active','Inactive','Suspended','Locked'], h:200,
        series:[{name:'Accounts', colour:'#C9A227',
          data:['Active','Inactive','Suspended','Locked'].map(st => ACCOUNTS.filter(a => a.state === st).length)}]})})
  ].join('');

  const high = s.open.filter(i => i.severity === 'Critical' || i.severity === 'High')
    .sort((a, b) => a.severity === 'Critical' ? -1 : 1);
  el('ovCritPill').textContent = high.length;
  el('ovCrit').innerHTML = high.slice(0, 5).map(i => `<div class="risk">
      <div><div class="rn">${esc(i.title)}</div>
        <div class="rs">${esc(i.lane)} · ${esc(staffName(i.owner))} · due ${fmtDate(i.due)}</div></div>
      <div class="rv">${badge(i.severity, sevTone(i.severity))}
        <button class="btn btn-ghost" data-goto="s11">Investigate</button></div>
    </div>`).join('') || '<div class="empty">No critical or high incidents open.</div>';

  el('ovFeed').innerHTML = SEC_EVENTS.slice(0, 7).map(e => `<div class="risk">
      <div><div class="rn">${esc(e.detail)}</div>
        <div class="rs">${esc(e.staff)} · ${esc(e.category)} · ${esc(e.when)}</div></div>
      <div class="rv">${okBadge(e.outcome)}</div>
    </div>`).join('') || '<div class="empty">No events recorded for this period.</div>';
}

/* ===================== 2 · STAFF ACCOUNT SECURITY ===================== */
function accountRows(){
  return ACCOUNTS.filter(a => matchQ(a.id, a.name, a.role, a.branch, a.email)
      && passStatus(a) && passOwner(a) && (!FILTER.region || a.branch === FILTER.region));
}
function renderAccounts(){
  const rows = accountRows();
  const s = secStats();
  el('acctPill').className = 'badge ' + (s.locked.length ? 'b-crit' : 'b-ok');
  el('acctPill').textContent = `${s.active.length} active · ${s.locked.length} locked`;
  el('acctPill2').textContent = rows.length;

  el('acctKpis').innerHTML = [
    ['Staff accounts', num(ACCOUNTS.length), 'Across every role and branch', 'gold'],
    ['Active accounts', num(s.active.length), 'Signed in within the last 30 days', ''],
    ['Inactive accounts', num(s.inactive.length), 'Access removed, record retained', ''],
    ['Suspended accounts', num(s.suspended.length), 'Paused pending review', s.suspended.length ? 'blue' : ''],
    ['Locked accounts', num(s.locked.length), 'Locked by the failed-attempt rule', s.locked.length ? 'red' : ''],
    ['Without MFA', num(s.active.filter(a => !a.mfa).length), 'Finance roles should enrol', s.active.filter(a => !a.mfa).length ? 'red' : '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join('');

  renderTable('acctBody', [
    {k:'name', label:'Officer'},
    {k:'role', label:'Role'},
    {k:'branch', label:'Branch'},
    {k:'state', label:'State', html:v => badge(v, v === 'Active' ? 'b-ok' : v === 'Locked' ? 'b-crit' : v === 'Suspended' ? 'b-warn' : 'b-gray')},
    {k:'mfa', label:'MFA', html:v => v ? badge('Enrolled', 'b-ok') : badge('Not enrolled', 'b-warn')},
    {k:'failed', label:'Failed', num:true},
    {k:'lastLogin', label:'Last sign-in', html:v => esc(v.slice(0, 10))}
  ], rows.map(a => Object.assign({}, a, {_open: () => openAccount(a.id)})), {sort:'name', pageSize:9, onRow:true});

  const locked = ACCOUNTS.filter(a => a.state === 'Locked' || a.state === 'Suspended');
  el('lockedHead').innerHTML = '<tr><th>Officer</th><th>State</th><th>Reason</th><th></th></tr>';
  el('lockedBody').innerHTML = locked.length ? locked.map(a => `<tr>
      <td>${esc(a.name)}<div class="qhint" style="margin:0">${esc(a.role)}</div></td>
      <td>${badge(a.state, a.state === 'Locked' ? 'b-crit' : 'b-warn')}</td>
      <td>${esc(a.notes)}</td>
      <td><button class="btn btn-ghost" data-acct="${a.id}" data-act="${a.state === 'Locked' ? 'unlock' : 'activate'}">
        ${a.state === 'Locked' ? 'Unlock' : 'Restore'}</button></td></tr>`).join('')
    : '<tr><td colspan="4" class="empty">Every account is active.</td></tr>';

  el('acctReview').innerHTML = ACCOUNTS.slice(0, 6).map(a => `<div class="risk">
      <div><div class="rn">${esc(a.name)} <span class="rs">· ${esc(a.role)}</span></div>
        <div class="rs">Last sign-in ${esc(a.lastLogin)} · ${a.failed} failed · password ${a.pwAge} days old</div></div>
      <div class="rv">${a.mfa ? badge('MFA', 'b-ok') : badge('No MFA', 'b-warn')}</div>
    </div>`).join('');

  const byState = ['Active','Inactive','Suspended','Locked'];
  el('acctGrid').innerHTML = [
    chartBox({title:'Accounts by state', sub:'Every staff account', value:num(ACCOUNTS.length),
      chart: chart({type:'donut', cats:byState, h:200, colours:['#1E9E6A','#8A90A0','#E08C1E','#D93F3F'],
        series:[{data:byState.map(st => ACCOUNTS.filter(a => a.state === st).length)}]})}),
    chartBox({title:'Failed attempts by officer', sub:'Refused sign-ins this period', value:num(sum(ACCOUNTS, a => a.failed)),
      chart: chart({type:'bar', cats:ACCOUNTS.map(a => a.name.split(' ')[0]), h:200,
        series:[{name:'Failed', data:ACCOUNTS.map(a => a.failed), colour:'#D93F3F'}]})}),
    chartBox({title:'Multi-factor enrolment', sub:'Who has a second factor', value:num(ACCOUNTS.filter(a => a.mfa).length) + ' of ' + ACCOUNTS.length,
      chart: chart({type:'bar', cats:['Enrolled','Not enrolled'], h:200,
        series:[{name:'Accounts', colour:'#1E9E6A',
          data:[ACCOUNTS.filter(a => a.mfa).length, ACCOUNTS.filter(a => !a.mfa).length]}]})})
  ].join('');

  const hist = [];
  ACCOUNTS.forEach(a => a.history.forEach(h => hist.push(Object.assign({staff:a.name}, h))));
  hist.sort((a, b) => a.when < b.when ? 1 : -1);
  renderTable('acctHistBody', [
    {k:'when', label:'When', html:v => fmtDate(v)},
    {k:'staff', label:'Officer'},
    {k:'what', label:'Change'},
    {k:'who', label:'By'}
  ], hist, {sort:'when', pageSize:8});
}

function openAccount(id){
  const a = ACCT_BY_ID[id];
  if(!a) return;
  openModal(a.name, `${a.role} · ${a.branch} · ${a.email}`,
    `<div class="pfields">
      ${field('State', badge(a.state, a.state === 'Active' ? 'b-ok' : a.state === 'Locked' ? 'b-crit' : a.state === 'Suspended' ? 'b-warn' : 'b-gray'))}
      ${field('Multi-factor', a.mfa ? badge('Enrolled', 'b-ok') : badge('Not enrolled', 'b-warn'))}
      ${field('Failed attempts', num(a.failed))}
      ${field('Last sign-in', esc(a.lastLogin))}
      ${field('Password age', a.pwAge + ' days')}
      ${field('Created', fmtDate(a.created))}
      ${field('Last reviewed', fmtDate(a.reviewed))}
      ${field('Note', esc(a.notes))}
    </div>
    <div class="minihead">Recent account history</div>
    <div>${a.history.slice().reverse().map(h => `<div class="checkrow"><div class="ck pass">·</div>
      <div class="cl">${esc(h.what)}</div><div class="cn">${esc(h.who)} · ${fmtDate(h.when)}</div></div>`).join('')}</div>`,
    [
      {label: a.state === 'Active' ? 'Deactivate' : 'Activate', act:() => { acctAction(id, a.state === 'Active' ? 'deactivate' : 'activate'); }},
      {label: a.state === 'Suspended' ? 'Restore' : 'Suspend', act:() => { acctAction(id, a.state === 'Suspended' ? 'restore' : 'suspend'); }},
      {label: a.state === 'Locked' ? 'Unlock' : 'Lock', act:() => { acctAction(id, a.state === 'Locked' ? 'unlock' : 'lock'); }},
      {label:'Force password reset', act:() => acctAction(id, 'reset')},
      {label:'Close', act:'close'}
    ]);
}

function acctAction(id, action){
  const a = ACCT_BY_ID[id];
  if(!a) return;
  const stamp = {when: TODAY, who: 'Chikondi Mwale'};
  if(action === 'activate' || action === 'deactivate'){
    a.state = action === 'activate' ? 'Active' : 'Inactive';
    stamp.what = action === 'activate' ? 'Account activated' : 'Account deactivated — access removed';
  }
  if(action === 'suspend'){
    a.state = 'Suspended'; stamp.what = 'Account suspended pending review';
    SESSIONS.filter(s => s.staff === id).forEach(s => {
      const i = SESSIONS.indexOf(s); if(i >= 0) SESSIONS.splice(i, 1);
    });
  }
  if(action === 'restore'){ a.state = 'Active'; stamp.what = 'Suspension lifted — account restored'; }
  if(action === 'lock'){ a.state = 'Locked'; stamp.what = 'Account locked by an administrator'; }
  if(action === 'unlock'){ a.state = 'Active'; a.failed = 0; stamp.what = 'Account unlocked — failed attempts cleared'; }
  if(action === 'reset'){
    a.pwAge = 0; stamp.what = 'Password reset forced at the next sign-in';
    a.history.push({when: TODAY, who: 'System', what: 'Reset token issued, valid for 30 minutes'});
  }
  a.history.push(stamp);
  logSec('Account ' + id + ': ' + stamp.what);
  closeModal();
  renderAll();
  toast(a.name + ' · ' + stamp.what.toLowerCase());
}

/* ===================== 3 · AUTHENTICATION ===================== */
function renderAuth(){
  const s = secStats();
  const recent = LOGINS.slice(0, 60);
  el('authPill').className = 'badge ' + (s.failed.length > 8 ? 'b-crit' : 'b-ok');
  el('authPill').textContent = `${num(s.failed.length)} failed of ${num(LOGINS.length)}`;
  el('authEvtPill').textContent = recent.length;

  el('authKpis').innerHTML = [
    ['Sign-in events logged', num(LOGINS.length), 'Staff and customer, last 21 days', 'gold'],
    ['Successful sign-ins', num(LOGINS.filter(l => l.result === 'Success').length), 'Password accepted', ''],
    ['Failed attempts', num(LOGINS.filter(l => l.result === 'Failed').length), 'Wrong password or unknown device', LOGINS.filter(l => l.result === 'Failed').length > 10 ? 'red' : ''],
    ['Refused while locked', num(LOGINS.filter(l => l.result === 'Blocked').length), 'The lockout rule held', ''],
    ['MFA verified', num(LOGINS.filter(l => l.mfa === 'Verified').length), 'Second factor confirmed', ''],
    ['Accounts without MFA', num(ACCOUNTS.filter(a => !a.mfa).length), 'Enrolment outstanding', 'red']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join('');

  el('loginCtl').innerHTML = [
    ['Secure staff login', 'Email, password and a second factor where enrolled', 'Enforced'],
    ['Secure customer login', 'Phone number and a one-time code', 'Enforced'],
    ['Failed attempt limit', `Account locks after ${SEC_SET.attempts} failed attempts`, 'Enforced'],
    ['Automatic lockout', `${SEC_SET.lockout}-minute lockout, unlocked by an administrator`, 'Enforced'],
    ['Session timeout', `Idle sign-out after ${SEC_SET.session} minutes`, 'Enforced'],
    ['Secure password reset', 'Single-use token, 30-minute life, no password in the email', 'Enforced'],
    ['Multi-factor authentication', SEC_SET.mfaAll ? 'Required for every account' : 'Required for administrators and finance', 'Enforced'],
    ['Login verification', 'New device needs a code before the session opens', 'Enforced']
  ].map(([what, how, state]) => `<div class="risk">
      <div><div class="rn">${esc(what)}</div><div class="rs">${esc(how)}</div></div>
      <div class="rv">${badge(state, 'b-ok')}</div></div>`).join('');

  el('pwHead').innerHTML = '<tr><th>Rule</th><th>Current setting</th><th>State</th></tr>';
  el('pwBody').innerHTML = [
    ['Minimum length', SEC_SET.pwMin + ' characters', 'Enforced'],
    ['Uppercase letter required', SEC_SET.upper ? 'Yes' : 'No', SEC_SET.upper ? 'Enforced' : 'Gap'],
    ['Number required', SEC_SET.number ? 'Yes' : 'No', SEC_SET.number ? 'Enforced' : 'Gap'],
    ['Symbol required', SEC_SET.symbol ? 'Yes' : 'No', SEC_SET.symbol ? 'Enforced' : 'Gap'],
    ['Expiry', SEC_SET.pwExpiry ? SEC_SET.pwExpiry + ' days' : 'Never', SEC_SET.pwExpiry ? 'Enforced' : 'Gap'],
    ['Password history', SEC_SET.pwReuse + ' previous passwords', 'Enforced'],
    ['Hashing', 'bcrypt, cost 12', 'Enforced']
  ].map(([rule, val, st]) => `<tr><td>${esc(rule)}</td><td>${esc(val)}</td><td>${okBadge(st)}</td></tr>`).join('');

  el('mfaHead').innerHTML = '<tr><th>Staff member</th><th>Role</th><th>Enrolment</th><th>Required</th></tr>';
  el('mfaBody').innerHTML = ACCOUNTS.slice(0, 9).map(a => {
    const required = a.role === 'Administrator' || a.role === 'Cashier' || a.role === 'Head of Credit';
    return `<tr><td>${esc(a.name)}</td><td>${esc(a.role)}</td>
      <td>${a.mfa ? badge('Enrolled', 'b-ok') : badge('Not enrolled', required ? 'b-crit' : 'b-warn')}</td>
      <td>${badge(required ? 'Mandatory' : 'Optional', required ? 'b-warn' : 'b-gray')}</td></tr>`;
  }).join('');

  el('lockRules').innerHTML = [
    ['Failed attempts before lockout', SEC_SET.attempts],
    ['Lockout duration', SEC_SET.lockout + ' minutes'],
    ['Idle session timeout', SEC_SET.session + ' minutes'],
    ['Concurrent sessions allowed', SEC_SET.concurrent],
    ['Password expiry', SEC_SET.pwExpiry + ' days'],
    ['MFA scope', SEC_SET.mfaAll ? 'Every account' : 'Administrators and finance'],
    ['Locked accounts right now', ACCOUNTS.filter(a => a.state === 'Locked').length]
  ].map(([k, v]) => kvRow(k, num(v))).join('');

  el('authEvtHead').innerHTML = '<tr><th>When</th><th>Who</th><th>Type</th><th>Device</th><th>Location</th><th>MFA</th><th>Result</th></tr>';
  el('authEvtBody').innerHTML = LOGINS.filter(l => matchQ(l.who, l.device, l.place, l.reason))
    .slice(0, 40).map(l => `<tr>
      <td style="white-space:nowrap">${esc(l.when.slice(0, 16))}</td>
      <td>${esc(l.who)}<div class="qhint" style="margin:0">${esc(l.kind)}</div></td>
      <td>${esc(l.reason)}</td><td>${esc(l.device)}</td><td>${esc(l.place)}</td>
      <td>${okBadge(l.mfa)}</td>
      <td>${badge(l.result, l.result === 'Success' ? 'b-ok' : l.result === 'Blocked' ? 'b-crit' : 'b-warn')}</td>
    </tr>`).join('');
}

/* ===================== 4 · ROLES & ACCESS ===================== */
function renderRoles(){
  const priv = ACCOUNTS.filter(a => a.role === 'Administrator' || a.role === 'Head of Credit');
  el('rolePill').className = 'badge b-ok';
  el('rolePill').textContent = ROLES.length + ' roles';

  el('roleKpis').innerHTML = [
    ['Defined roles', num(ROLES.length), 'From super admin to auditor', 'gold'],
    ['Capabilities controlled', num(CAPS.length), 'Every sensitive action is mapped', ''],
    ['Privileged accounts', num(priv.length), 'Administrator and head of credit', ''],
    ['Permission changes', num(PRIV_CHANGES.length), `${num(PRIV_CHANGES.filter(p => !p.approved).length)} awaiting approval`, PRIV_CHANGES.some(p => !p.approved) ? 'red' : ''],
    ['Roles without export', [...new Set(ROLES)].filter(r => PERMS[r][5] === 'None').length, 'Cannot take data out', ''],
    ['Financial actions restricted', 4, 'Approval, release, reversal, adjustment', '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join('');

  el('roleMatrixHead').innerHTML = '<tr><th>Capability</th>' + ROLES.map(r => `<th style="text-align:center">${esc(r)}</th>`).join('') + '</tr>';
  el('roleMatrixBody').innerHTML = CAPS.map((c, ci) => `<tr><td><b>${esc(c)}</b></td>` +
    ROLES.map(r => {
      const v = PERMS[r][ci];
      return `<td style="text-align:center">${v === 'Full' ? '<span class="tick">●</span>'
        : v === 'Approve' ? '<span style="color:#8A6D0F;font-weight:800">◐</span>'
        : v === 'Own' ? '<span style="color:#2F6FED;font-weight:700">◑</span>'
        : '<span class="cross">—</span>'}</td>`;
    }).join('') + '</tr>').join('');

  el('privPill').textContent = priv.length;
  el('privHead').innerHTML = '<tr><th>Officer</th><th>Role</th><th>MFA</th><th>Reviewed</th><th></th></tr>';
  el('privBody').innerHTML = priv.map(a => `<tr>
      <td>${esc(a.name)}</td><td>${esc(a.role)}</td>
      <td>${a.mfa ? badge('Enrolled', 'b-ok') : badge('Not enrolled', 'b-crit')}</td>
      <td>${fmtDate(a.reviewed)}</td>
      <td><button class="btn btn-ghost" data-review="${a.id}">Review</button></td></tr>`).join('');

  renderTable('permChgBody', [
    {k:'when', label:'When', html:v => fmtDate(v)},
    {k:'staff', label:'Account'},
    {k:'what', label:'Change'},
    {k:'by', label:'By'},
    {k:'approved', label:'Approved', html:v => badge(v ? 'Yes' : 'Pending', v ? 'b-ok' : 'b-warn')}
  ], PRIV_CHANGES.map(p => Object.assign({}, p, {_open: () => openAccount(p.staff)})), {sort:'when', pageSize:6, onRow:true});

  el('finActHead').innerHTML = '<tr><th>Action</th><th>Who may perform it</th><th>Second approval</th><th>Enforcement</th></tr>';
  el('finActBody').innerHTML = [
    ['Approve a loan', 'Credit analyst, head of credit, loan officer within limit', 'Required above MK 2,000,000', 'Enforced'],
    ['Release a disbursement', 'Cashier, head of credit', 'Required above MK 2,000,000', 'Enforced'],
    ['Reverse a payment', 'Cashier, collections officer', 'Always — a different officer', 'Enforced'],
    ['Adjust a balance', 'Administrator', 'Always', 'Enforced'],
    ['Change a fee or penalty', 'Administrator', 'Above MK 100,000', 'Advisory'],
    ['Export customer data', 'Compliance, head of credit, administrator', 'Above 1,000 rows', 'Gap']
  ].map(([a, who, second, st]) => `<tr><td><b>${esc(a)}</b></td><td>${esc(who)}</td><td>${esc(second)}</td>
      <td>${okBadge(st)}</td></tr>`).join('');
}
</script>
