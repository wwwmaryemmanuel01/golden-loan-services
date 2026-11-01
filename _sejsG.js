<script>
/* ============================================================
   SECURITY & PROTECTION (7/7)
   13 · Backup & recovery   14 · Encryption & secrets
   15 · Compliance & privacy   16 · Reports   17 · Testing
   18 · Settings, plus the wiring and the boot.
   ============================================================ */

/* ===================== 13 · BACKUP & RECOVERY ===================== */
function renderBackups(){
  const latest = BACKUPS[0];
  const badIntegrity = BACKUPS.filter(b => b.integrity === 'Failed').length;
  el('bkPill').className = 'badge ' + (badIntegrity ? 'b-crit' : 'b-ok');
  el('bkPill').textContent = latest ? latest.integrity : '—';
  el('bkStatusPill').textContent = BACKUPS.length;

  el('bkKpis').innerHTML = [
    ['Last backup', latest ? latest.when.slice(0, 10) : '—', latest ? latest.kind + ' · ' + latest.size : '', 'gold'],
    ['Backups in the period', num(BACKUPS.length), 'Nightly, weekly and incremental', ''],
    ['Verified copies', num(BACKUPS.filter(b => /Verified/.test(b.integrity)).length), 'Checksum and decrypt tested', ''],
    ['Pending verification', num(BACKUPS.filter(b => b.integrity === 'Pending').length), 'Tonight\'s copy still running', ''],
    ['Recovery drills', num(RECOVERY_TESTS.length), `${num(RECOVERY_TESTS.filter(t => t.result === 'Pass').length)} clean passes`, ''],
    ['Restores authorised', num(RESTORE_AUTH.filter(r => r.ok).length), `${num(RESTORE_AUTH.filter(r => !r.ok).length)} without approval`, RESTORE_AUTH.some(r => !r.ok) ? 'red' : '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join('');

  el('bkGrid').innerHTML = [
    chartBox({title:'Backup size trend', sub:'Nightly copy, twelve runs', value:BACKUPS[0] ? BACKUPS[0].size : '—',
      chart: chart({type:'line', cats:BACKUPS.map(b => b.when.slice(5, 10)).reverse(), h:200,
        series:[{name:'MB', data:BACKUPS.map(b => Number(b.size.replace(' MB', ''))).reverse(), colour:'#2F6FED'}]})}),
    chartBox({title:'Integrity results', sub:'Every copy in the period', value:num(BACKUPS.length),
      chart: chart({type:'donut', cats:['Verified','Re-verified','Pending'], h:200, colours:['#1E9E6A','#0E9AA7','#E08C1E'],
        series:[{data:['Verified','Re-verified','Pending'].map(v => BACKUPS.filter(b => b.integrity === v).length)}]})}),
    chartBox({title:'Recovery drill duration', sub:'How long a restore actually took', value:num(RECOVERY_TESTS.length) + ' drills',
      chart: chart({type:'bar', cats:RECOVERY_TESTS.map(t => t.id), h:200,
        series:[{name:'Minutes', data:RECOVERY_TESTS.map(t => Number(t.took.replace(' min', '')) || 0), colour:'#C9A227'}]})})
  ].join('');

  el('bkStatusGrid').innerHTML = `<div class="pfields" style="grid-template-columns:1fr 1fr">
      ${kvRow('Engine', esc(DB.engine))}${kvRow('Storage', esc('Encrypted bucket · ' + DB.region))}
      ${kvRow('Last run', latest ? esc(latest.when) : '—')}${kvRow('Duration', latest ? esc(latest.duration) : '—')}
      ${kvRow('Point-in-time recovery', '7-day window')}${kvRow('Off-site copy', 'Yes')}
      ${kvRow('Encryption', 'AES-256 at rest')}${kvRow('Retention', '35 days nightly')}
    </div>
    <div class="note gold" style="margin-top:9px"><div>The nightly copy is written to a separate region
      and verified before it is marked complete. A restore is only authorised once a second officer signs it off.</div></div>`;

  el('bkSchedHead').innerHTML = '<tr><th>Job</th><th>When</th><th>Retention</th><th>Off-site</th></tr>';
  el('bkSchedBody').innerHTML = BACKUP_SCHEDULE.map(b => `<tr><td>${esc(b.job)}</td><td>${esc(b.when)}</td>
      <td>${esc(b.retention)}</td><td>${badge(b.offsite, 'b-ok')}</td></tr>`).join('');

  renderTable('bkHistBody', [
    {k:'id', label:'Backup'},
    {k:'when', label:'When', html:v => esc(v)},
    {k:'kind', label:'Kind'},
    {k:'size', label:'Size', num:true},
    {k:'integrity', label:'Integrity', html:v => badge(v, /Verified/.test(v) ? 'b-ok' : 'b-warn')}
  ], BACKUPS, {sort:'when', pageSize:8});

  const checked = BACKUPS.slice(1);
  el('bkIntegPill').textContent = checked.filter(b => /Verified/.test(b.integrity)).length + '/' + checked.length;
  el('bkIntegGrid').innerHTML = [
    ['Checksum compared', checked.length + ' of ' + checked.length, 'Verified'],
    ['Decryption test', checked.length + ' of ' + checked.length, 'Verified'],
    ['Row count compared', (checked.length - 1) + ' of ' + checked.length, 'One re-verified'],
    ['Restore smoke test', RECOVERY_TESTS.filter(t => t.result !== 'Fail').length + ' drills', 'Verified']
  ].map(([k, v, st]) => `<div class="risk"><div><div class="rn">${esc(k)}</div>
      <div class="rs">${esc(v)}</div></div><div class="rv">${okBadge(st)}</div></div>`).join('') +
    kvRow('Next verification', fmtDate(addDays(TODAY, 1)));

  renderTable('rctBody', [
    {k:'id', label:'Drill'},
    {k:'when', label:'When', html:v => fmtDate(v)},
    {k:'scope', label:'Scope'},
    {k:'result', label:'Result', html:v => badge(v, /^Pass$/.test(v) ? 'b-ok' : /Pass with/.test(v) ? 'b-warn' : 'b-crit')},
    {k:'took', label:'Took'}
  ], RECOVERY_TESTS, {sort:'when', pageSize:5});

  el('restorePill').textContent = RESTORE_AUTH.filter(r => !r.ok).length;
  el('restoreHead').innerHTML = '<tr><th>When</th><th>Requested by</th><th>Approved by</th><th>Action</th><th>State</th></tr>';
  el('restoreBody').innerHTML = RESTORE_AUTH.map(r => `<tr><td>${fmtDate(r.when)}</td>
      <td>${esc(r.by)}</td><td>${esc(r.approvedBy || '—')}</td><td>${esc(r.action)}</td>
      <td>${badge(r.ok ? 'Authorised' : 'No approval', r.ok ? 'b-ok' : 'b-crit')}</td></tr>`).join('');

  el('drGrid').innerHTML = DR_PLAN.map(d => kvRow(d.item, esc(d.value))).join('');

  el('lossHead').innerHTML = '<tr><th>Incident</th><th>When</th><th>What was lost</th><th>Recovered</th><th>State</th></tr>';
  el('lossBody').innerHTML = DATA_LOSS.map(d => `<tr><td>${esc(d.id)}</td><td>${fmtDate(d.when)}</td>
      <td>${esc(d.what)}</td><td>${esc(d.recovered)}</td>
      <td>${badge(d.status, 'b-ok')}</td></tr>`).join('');

  const audit = BACKUPS.slice(0, 8).map(b => ({when: b.when, what: b.kind + ' completed — ' + b.size, who: 'Scheduler', result: 'Success'}))
    .concat(RECOVERY_TESTS.map(t => ({when: t.when, what: 'Restore drill: ' + t.scope, who: t.by, result: t.result})))
    .sort((a, b) => a.when < b.when ? 1 : -1);
  renderTable('bkAuditBody', [
    {k:'when', label:'When', html:v => esc(v)},
    {k:'what', label:'Activity'},
    {k:'who', label:'By'},
    {k:'result', label:'Result', html:v => badge(v, /^Pass$|Success/.test(v) ? 'b-ok' : /Pass with/.test(v) ? 'b-warn' : 'b-crit')}
  ], audit, {sort:'when', pageSize:7});
}

/* ===================== 14 · ENCRYPTION & SECRETS ===================== */
function renderEncryption(){
  const exposed = SECRETS.filter(s => s.exposed);
  const stale = SECRETS.filter(s => daysBetween(s.rotated, TODAY) > s.cycle);
  el('encPill').className = 'badge ' + (exposed.length ? 'b-crit' : 'b-ok');
  el('encPill').textContent = exposed.length ? exposed.length + ' exposure' : 'All secrets sealed';

  el('encKpis').innerHTML = [
    ['Transport security', 'TLS 1.3', 'HTTPS enforced on every route', 'gold'],
    ['Secrets tracked', num(SECRETS.length), `${num(SECRETS.filter(s => s.scope === 'server').length)} server-side only`, ''],
    ['Overdue rotation', num(stale.length), 'Past the rotation cycle', stale.length ? 'red' : ''],
    ['Exposed secrets', num(exposed.length), 'Found in a log or a bundle', exposed.length ? 'red' : ''],
    ['Secret reads logged', num(SECRET_ACCESS.length), 'Every access is recorded', ''],
    ['Hashing', 'bcrypt · cost 12', 'Passwords are never reversible', '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join('');

  el('tlsHead').innerHTML = '<tr><th>Item</th><th>Value</th><th>State</th></tr>';
  el('tlsBody').innerHTML = TLS_ROWS.map(t => `<tr><td>${esc(t.item)}</td><td>${esc(t.value)}</td>
      <td>${okBadge(t.status)}</td></tr>`).join('');

  el('encBodyHead').innerHTML = '<tr><th>Item</th><th>Value</th><th>State</th></tr>';
  el('encBodyTable').innerHTML = HASHING.map(h => `<tr><td>${esc(h.item)}</td><td>${esc(h.value)}</td>
      <td>${okBadge(h.status)}</td></tr>`).join('');

  el('secretPill').textContent = SECRETS.length;
  renderTable('secretBody', [
    {k:'name', label:'Variable'},
    {k:'scope', label:'Scope', html:v => badge(v, v === 'server' ? 'b-ok' : 'b-gray')},
    {k:'storage', label:'Where it lives'},
    {k:'rotated', label:'Last rotation', html:v => fmtDate(v)},
    {k:'age', label:'Age', num:true, html:v => v + ' d'},
    {k:'exposed', label:'Exposure', html:v => v ? badge('Found', 'b-crit') : badge('Clean', 'b-ok')},
    {k:'act', label:'', html:(v, r) => `<button class="btn btn-ghost" data-rotate="${r.name}">Rotate</button>`}
  ], SECRETS.map(s => Object.assign({}, s, {age: daysBetween(s.rotated, TODAY)})),
    {sort:'age', pageSize:7});

  el('rotateGrid').innerHTML = SECRET_ROTATION.map(r => `<div class="risk">
      <div><div class="rn">${esc(r.item)}</div><div class="rs">${esc(r.note)}</div></div>
      <div class="rv">${badge(r.cycle, 'b-gray')}</div></div>`).join('');

  el('secAccPill').textContent = SECRET_ACCESS.length;
  el('secAccHead').innerHTML = '<tr><th>When</th><th>Who</th><th>Secret</th><th>Action</th><th>Result</th></tr>';
  el('secAccBody').innerHTML = SECRET_ACCESS.map(a => `<tr><td>${fmtDate(a.when)}</td><td>${esc(a.who)}</td>
      <td class="mono">${esc(a.secret)}</td><td>${esc(a.action)}</td>
      <td>${badge(a.ok ? 'Logged' : 'Exposure', a.ok ? 'b-ok' : 'b-crit')}</td></tr>`).join('');

  el('tokHead').innerHTML = '<tr><th>Item</th><th>Value</th><th>State</th></tr>';
  el('tokBody').innerHTML = TOKEN_ROWS.map(t => `<tr><td>${esc(t.item)}</td><td>${esc(t.value)}</td>
      <td>${okBadge(t.status)}</td></tr>`).join('');
}

function rotateSecret(name){
  const s = SECRETS.find(x => x.name === name);
  if(!s) return;
  s.rotated = TODAY; s.exposed = false;
  SECRET_ACCESS.unshift({when: TODAY, who: 'Chikondi Mwale', secret: name, action: 'Rotated from the console', ok: true});
  logSec('Secret ' + name + ' rotated');
  renderAll();
  toast(name + ' rotated');
}

/* ===================== 15 · COMPLIANCE & PRIVACY ===================== */
function renderCompliance(){
  const findings = SEC_FINDINGS.filter(f => !/Closed/.test(f.status));
  const gaps = SEC_RETENTION.filter(r => r.status !== 'Compliant');
  const due = POLICIES.filter(p => p.status !== 'Approved');
  el('compPill').className = 'badge ' + (findings.some(f => f.rating === 'Critical') ? 'b-crit' : findings.length ? 'b-warn' : 'b-ok');
  el('compPill').textContent = findings.length + ' findings open';

  el('compKpis').innerHTML = [
    ['Policies in force', num(POLICIES.length), `${num(due.length)} due for review`, 'gold'],
    ['Findings open', num(findings.length), `Of ${num(SEC_FINDINGS.length)} raised`, findings.length ? 'red' : ''],
    ['Corrective actions', num(SEC_FINDINGS.filter(f => f.status === 'Corrective action').length), 'Being worked now', ''],
    ['Retention gaps', num(gaps.length), 'Records held past their rule', gaps.length ? 'red' : ''],
    ['Assessments', num(ASSESSMENTS.length), 'Internal, external and thematic', ''],
    ['Breaches recorded', num(SEC_BREACHES.length), `${num(SEC_BREACHES.filter(b => b.status !== 'Closed').length)} still open`, '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join('');

  el('compGrid').innerHTML = [
    chartBox({title:'Findings by rating', sub:'Across the register', value:num(SEC_FINDINGS.length),
      chart: chart({type:'donut', cats:['Critical','High','Medium','Low'], h:200, colours:['#7C1F1F','#D93F3F','#E08C1E','#8A90A0'],
        series:[{data:['Critical','High','Medium','Low'].map(r => SEC_FINDINGS.filter(f => f.rating === r).length)}]})}),
    chartBox({title:'Findings by status', sub:'What is still open', value:num(findings.length) + ' open',
      chart: chart({type:'bar', cats:['Open','Corrective action','Accepted risk','Closed'], h:200,
        series:[{name:'Findings', colour:'#C9A227',
          data:['Open','Corrective action','Accepted risk','Closed'].map(st => SEC_FINDINGS.filter(f => f.status === st).length)}]})}),
    chartBox({title:'Breach exposure', sub:'Records affected per incident', value:num(sum(SEC_BREACHES, b => b.affected)) + ' records',
      chart: chart({type:'bar', cats:SEC_BREACHES.map(b => b.id), h:200,
        series:[{name:'Affected', data:SEC_BREACHES.map(b => b.affected), colour:'#D93F3F'}]})})
  ].join('');

  el('polPill').textContent = POLICIES.length;
  renderTable('polBody', [
    {k:'name', label:'Policy'},
    {k:'owner', label:'Owner', html:v => esc(staffName(v))},
    {k:'version', label:'Version'},
    {k:'reviewed', label:'Last review', html:v => fmtDate(v)},
    {k:'status', label:'Status', html:v => badge(v, v === 'Approved' ? 'b-ok' : 'b-warn')}
  ], POLICIES, {sort:'reviewed', pageSize:6});

  el('privCtlGrid').innerHTML = PRIVACY_CONTROLS.map(p => `<div class="risk">
      <div><div class="rn">${esc(p.what)}</div><div class="rs">${esc(p.how)}</div></div>
      <div class="rv">${okBadge(p.status)}</div></div>`).join('');

  el('retPill').textContent = gaps.length;
  el('retHead9').innerHTML = '<tr><th>Record</th><th>Retention</th><th>Where</th><th>State</th></tr>';
  el('retBody9').innerHTML = SEC_RETENTION.map(r => `<tr><td>${esc(r.what)}</td><td>${esc(r.keep)}</td>
      <td>${esc(r.where)}</td><td>${okBadge(r.status)}</td></tr>`).join('');

  renderTable('assessBody', [
    {k:'id', label:'Assessment'},
    {k:'when', label:'When', html:v => fmtDate(v)},
    {k:'name', label:'Review'},
    {k:'scope', label:'Scope'},
    {k:'result', label:'Result'}
  ], ASSESSMENTS, {sort:'when', pageSize:5});

  el('breachPill').textContent = SEC_BREACHES.length;
  el('breachHead2').innerHTML = '<tr><th>Incident</th><th>What happened</th><th class="num">Affected</th><th>Severity</th><th>Notified</th></tr>';
  el('breachBody2').innerHTML = SEC_BREACHES.map(b => `<tr><td>${esc(b.id)}<div class="qhint" style="margin:0">${fmtDate(b.when)}</div></td>
      <td>${esc(b.what)}</td><td class="num">${num(b.affected)}</td>
      <td>${badge(b.severity, sevTone(b.severity))}</td><td>${esc(b.notified)}</td></tr>`).join('');

  el('secFindPill').textContent = findings.length;
  renderTable('secFindBody', [
    {k:'id', label:'Finding'},
    {k:'title', label:'Finding'},
    {k:'area', label:'Area'},
    {k:'rating', label:'Rating', html:v => badge(v, sevTone(v))},
    {k:'owner', label:'Owner', html:v => esc(staffName(v))},
    {k:'due', label:'Due', html:v => `<span style="color:${v < TODAY ? '#B32C2C' : 'inherit'}">${fmtDate(v)}</span>`},
    {k:'status', label:'Status', html:v => badge(v, statTone(v))}
  ], SEC_FINDINGS.map(f => Object.assign({}, f, {_open: () => openSecFinding(f.id)})), {sort:'rating', pageSize:6, onRow:true});

  el('accRevHead').innerHTML = '<tr><th>When</th><th>Scope</th><th class="num">Reviewed</th><th class="num">Changes</th><th>By</th></tr>';
  el('accRevBody').innerHTML = ACCESS_REVIEWS.map(a => `<tr><td>${fmtDate(a.when)}</td><td>${esc(a.scope)}</td>
      <td class="num">${a.reviewed}</td><td class="num">${a.changes}</td><td>${esc(a.by)}</td></tr>`).join('');

  el('evidPill9').textContent = SEC_EVIDENCE.length;
  el('evidHead9').innerHTML = '<tr><th>Evidence</th><th>Supports</th><th>Added</th><th>By</th></tr>';
  el('evidBody9').innerHTML = SEC_EVIDENCE.map(e => `<tr><td>${esc(e.what)}</td><td class="mono">${esc(e.for)}</td>
      <td>${fmtDate(e.added)}</td><td>${esc(staffName(e.by))}</td></tr>`).join('');
}

function openSecFinding(id){
  const f = SEC_FINDINGS.find(x => x.id === id);
  if(!f) return;
  openModal(f.id + ' · ' + f.title, f.area + ' · ' + f.rating,
    `<div class="pfields">
      ${field('Rating', badge(f.rating, sevTone(f.rating)))}
      ${field('Owner', esc(staffName(f.owner)))}
      ${field('Raised', fmtDate(f.raised))}
      ${field('Due', fmtDate(f.due))}
      ${field('Status', badge(f.status, statTone(f.status)))}
    </div>
    <div class="minihead">Recommendation</div>
    <div class="note gold"><div>${esc(f.recommendation)}</div></div>
    <div class="minihead">Corrective action</div>
    <div>${esc(f.corrective)}</div>`,
    [{label:'Record corrective action', act:() => {
        f.status = 'Corrective action'; f.corrective = 'Owner to confirm the fix and attach evidence';
        logSec('Corrective action recorded on ' + f.id); closeModal(); renderAll();
        toast('Corrective action recorded');
      }},
     {label:'Mark closed', act:() => {
        f.status = 'Closed'; f.corrective = 'Completed and verified';
        logSec('Finding ' + f.id + ' closed'); closeModal(); renderAll(); toast(f.id + ' closed');
      }},
     {label:'Close', act:'close'}]);
}

/* ===================== 16 · REPORTS ===================== */
function rDaily(){
  const s = secStats();
  return {title:'Daily security summary',
    cols:[{label:'Measure'},{label:'Value'},{label:'Detail'}],
    rows:[
      ['Security score', s.score + '%', s.score >= 85 ? 'Protected' : s.score >= 70 ? 'Needs attention' : 'At risk'],
      ['Active accounts', String(s.active.length), 'Of ' + ACCOUNTS.length + ' staff accounts'],
      ['Locked accounts', String(s.locked.length), s.locked.map(a => a.name).join(', ') || 'None'],
      ['Sign-ins today', String(LOGINS.filter(l => l.when.slice(0,10) === TODAY).length), 'Staff and customers'],
      ['Failed sign-ins', String(LOGINS.filter(l => l.result !== 'Success').length), 'In the period'],
      ['Open incidents', String(s.open.length), s.critical.length + ' critical'],
      ['Open vulnerabilities', String(s.vulns.length), 'Across API, database and access'],
      ['Last backup', BACKUPS[0] ? BACKUPS[0].when : '—', BACKUPS[0] ? BACKUPS[0].integrity : '']
    ]};
}
function rFailedLogins(){
  return {title:'Failed login report',
    cols:[{label:'When'},{label:'Who'},{label:'Type'},{label:'Device'},{label:'Location'},{label:'Reason'},{label:'Result'}],
    rows: LOGINS.filter(l => l.result !== 'Success')
      .map(l => [l.when, l.who, l.kind, l.device, l.place, l.reason, l.result])};
}
function rStaffAccounts(){
  return {title:'Staff account security report',
    cols:[{label:'Account'},{label:'Name'},{label:'Role'},{label:'Branch'},{label:'State'},{label:'MFA'},{label:'Failed'},{label:'Last sign-in'}],
    rows: ACCOUNTS.map(a => [a.id, a.name, a.role, a.branch, a.state, a.mfa ? 'Enrolled' : 'No', a.failed, a.lastLogin])};
}
function rPrivileged(){
  return {title:'Privileged access report',
    cols:[{label:'Account'},{label:'Name'},{label:'Role'},{label:'Change'},{label:'By'},{label:'Approved'},{label:'When'}],
    rows: PRIV_CHANGES.map(p => [p.staff, staffName(p.staff), ACCT_BY_ID[p.staff] ? ACCT_BY_ID[p.staff].role : '', p.what, p.by, p.approved ? 'Yes' : 'Pending', fmtDate(p.when)])};
}
function rSuspicious(){
  const rows = [];
  INCIDENTS.filter(i => /Access|Identity/.test(i.lane)).forEach(i =>
    rows.push([i.id, i.title, i.lane, i.severity, staffName(i.owner), i.status, fmtDate(i.opened)]));
  DUP_ACCOUNTS.forEach(d => rows.push(['DUP-' + d.a, d.reason, 'Identity', d.risk, '—', 'Open', fmtDate(TODAY)]));
  return {title:'Suspicious activity report',
    cols:[{label:'Reference'},{label:'Signal'},{label:'Area'},{label:'Severity'},{label:'Owner'},{label:'Status'},{label:'Opened'}],
    rows};
}
function rFinancial(){
  const rows = [];
  APPROVALS.filter(a => a.status === 'Breach').forEach(a =>
    rows.push([a.ref, 'Approval above authority', money(a.amount), staffName(a.officer), 'Breach', fmtDate(a.when)]));
  REVERSALS.forEach(r => rows.push([r.id, 'Reversal · ' + r.reason, money(r.amount), staffName(r.officer), r.status, fmtDate(r.requested)]));
  ADJUSTMENTS.filter(a => !a.approved).forEach(a =>
    rows.push([a.id, 'Adjustment · ' + a.reason, money(a.amount), staffName(a.officer), 'Pending', fmtDate(a.asked)]));
  return {title:'Financial security incident report',
    cols:[{label:'Reference'},{label:'What'},{label:'Amount'},{label:'Officer'},{label:'Status'},{label:'Date'}], rows};
}
function rDatabase(){
  return {title:'Database security report',
    cols:[{label:'Table'},{label:'RLS'},{label:'Policy'},{label:'Last audited'}],
    rows: DB_TABLES.map(t => [t.table, t.rls, t.policy, fmtDate(t.lastAudit)])};
}
function rApi(){
  return {title:'API security report',
    cols:[{label:'Route'},{label:'Method'},{label:'Authorization'},{label:'Rate limit'},{label:'Validated'},{label:'State'}],
    rows: API_ROUTES.map(r => [r.route, r.method, r.auth, r.rate, r.validated, r.status])};
}
function rBackup(){
  return {title:'Backup and recovery report',
    cols:[{label:'Backup'},{label:'When'},{label:'Kind'},{label:'Size'},{label:'Integrity'},{label:'Expires'}],
    rows: BACKUPS.map(b => [b.id, b.when, b.kind, b.size, b.integrity, fmtDate(b.expiry)])};
}
function rResolution(){
  return {title:'Security incident resolution report',
    cols:[{label:'Incident'},{label:'Subject'},{label:'Area'},{label:'Severity'},{label:'Owner'},{label:'Opened'},{label:'Status'},{label:'Notes'}],
    rows: INCIDENTS.map(i => [i.id, i.title, i.lane, i.severity, staffName(i.owner), fmtDate(i.opened), i.status, String(i.notes.length)])};
}
const SEC_REPORTS = {
  daily:{label:'Daily Security Summary', build:rDaily, desc:'Score, accounts, sign-ins, incidents and the last backup in one page.'},
  logins:{label:'Failed Login Report', build:rFailedLogins, desc:'Every failed or blocked sign-in with device and location.'},
  accounts:{label:'Staff Account Security Report', build:rStaffAccounts, desc:'Account states, MFA enrolment and failed attempts.'},
  privileged:{label:'Privileged Access Report', build:rPrivileged, desc:'Every permission change and whether it was approved.'},
  suspicious:{label:'Suspicious Activity Report', build:rSuspicious, desc:'Access, identity and duplicate-account signals.'},
  financial:{label:'Financial Security Incident Report', build:rFinancial, desc:'Approval breaches, reversals and unapproved adjustments.'},
  database:{label:'Database Security Report', build:rDatabase, desc:'Row-level security and policy state for every table.'},
  api:{label:'API Security Report', build:rApi, desc:'Route-level authorization, rate limits and validation.'},
  backup:{label:'Backup and Recovery Report', build:rBackup, desc:'Backup history, integrity and expiry.'},
  resolution:{label:'Security Incident Resolution Report', build:rResolution, desc:'Every incident with its owner and current state.'}
};
function reportData(key){
  const r = SEC_REPORTS[key];
  if(!r) return null;
  const built = r.build();
  return {key, label:r.label, title:built.title, cols:built.cols, rows:built.rows};
}
function renderReports(){
  el('repCards2').innerHTML = Object.entries(SEC_REPORTS).map(([key, r]) => {
    const d = reportData(key);
    return `<div class="repcard">
      <div class="rt">${esc(r.label)}</div>
      <div class="rd">${esc(r.desc)}</div>
      <div class="rv">${num(d.rows.length)} rows · ${d.cols.length} columns</div>
      <div class="acts">
        <button class="btn btn-ghost" data-rep="${key}" data-fmt="preview">Preview</button>
        <button class="btn btn-ghost" data-rep="${key}" data-fmt="csv">CSV</button>
        <button class="btn btn-ghost" data-rep="${key}" data-fmt="xlsx">Excel</button>
        <button class="btn btn-ghost" data-rep="${key}" data-fmt="pdf">PDF</button>
      </div></div>`;
  }).join('');
  el('expPill2').textContent = EXPORTS.length;
  el('expHead2').innerHTML = '<tr><th>When</th><th>Report</th><th>Format</th><th class="num">Rows</th><th>By</th></tr>';
  el('expBody2').innerHTML = EXPORTS.length ? EXPORTS.slice(0, 10).map(x => `<tr>
      <td>${esc(x.when)}</td><td>${esc(x.report)}</td><td>${esc(x.format)}</td>
      <td class="num">${num(x.rows)}</td><td>${esc(x.by)}</td></tr>`).join('')
    : '<tr><td colspan="5" class="empty">No exports yet.</td></tr>';
}
function runReport(key, fmt){
  const d = reportData(key);
  if(!d) return toast('Unknown report.', 'err');
  if(fmt === 'preview'){
    openModal(d.label, `${num(d.rows.length)} rows · ${filterLine()}`,
      `${brandHtml(d.label, filterLine())}
       <div class="tblwrap" style="max-height:330px"><table class="tbl2 dense">
         <thead><tr>${d.cols.map(c => `<th>${esc(c.label)}</th>`).join('')}</tr></thead>
         <tbody>${d.rows.slice(0, 40).map(r => `<tr>${r.map(v => `<td>${esc(v)}</td>`).join('')}</tr>`).join('')}</tbody>
       </table></div>
       <div class="qhint">Showing ${Math.min(40, d.rows.length)} of ${num(d.rows.length)} rows · ${esc(filterLine())}</div>`,
      [{label:'Download CSV', act:() => { closeModal(); runReport(key, 'csv'); }}, {label:'Close', act:'close'}]);
    return;
  }
  if(fmt === 'csv'){
    downloadFile('security-' + key + '-' + TODAY + '.csv', 'text/csv;charset=utf-8',
      '\ufeff' + filterLine() + '\r\n' + toCsv([d.cols.map(c => c.label)].concat(d.rows)));
    logExport(d.label, 'CSV', d.rows.length);
    renderReports();
    return;
  }
  if(fmt === 'xlsx'){
    const bytes = xlsxBytes(d.title, d.cols, d.rows.map(r => r.map(v => {
      const n = Number(String(v).replace(/[^0-9.-]/g, ''));
      return /^[\d,.\s-]+$/.test(String(v)) && String(v).trim() !== '' && isFinite(n) ? n : String(v);
    })));
    downloadFile('security-' + key + '-' + TODAY + '.xlsx',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', bytes);
    logExport(d.label, 'Excel', d.rows.length);
    renderReports();
    return;
  }
  printTable(d.label, d.cols, d.rows);
  logExport(d.label, 'PDF', d.rows.length);
  renderReports();
}
function runPack(fmt){
  const all = Object.keys(SEC_REPORTS).map(reportData);
  if(fmt === 'csv'){
    const parts = [filterLine()];
    all.forEach(d => { parts.push('', d.label.toUpperCase()); parts.push(toCsv([d.cols.map(c => c.label)].concat(d.rows))); });
    downloadFile('security-pack-' + TODAY + '.csv', 'text/csv;charset=utf-8', '\ufeff' + parts.join('\r\n'));
    logExport('Security pack', 'CSV', sum(all, d => d.rows.length));
    renderReports(); return;
  }
  if(fmt === 'xlsx'){
    const rows = [];
    all.forEach(d => {
      rows.push([d.label.toUpperCase()]);
      rows.push(d.cols.map(c => c.label));
      d.rows.forEach(r => rows.push(r.map(v => String(v))));
      rows.push([]);
    });
    downloadFile('security-pack-' + TODAY + '.xlsx',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      xlsxBytes('Security pack', [{label:'Security pack'}].concat([1,2,3,4,5,6,7].map(() => ({label:''}))), rows));
    logExport('Security pack', 'Excel', rows.length);
    renderReports(); return;
  }
  const html = brandHtml('Security pack', filterLine()) + all.map(d => `
    <h1 style="margin-top:14px">${esc(d.label)}</h1>
    <table style="width:100%;border-collapse:collapse;font-size:9.5px">
      <thead><tr>${d.cols.map(c => `<th style="text-align:left;border-bottom:1px solid #E6E8EE;padding:4px">${esc(c.label)}</th>`).join('')}</tr></thead>
      <tbody>${d.rows.map(r => `<tr>${r.map(v => `<td style="border-bottom:1px dashed #EDEFF4;padding:3px">${esc(v)}</td>`).join('')}</tr>`).join('')}</tbody>
    </table>`).join('');
  doPrint('Security pack', html);
  logExport('Security pack', 'PDF', sum(all, d => d.rows.length));
  renderReports();
}

/* ===================== 17 · TESTING ===================== */
function renderTesting(){
  const open = VULNS.filter(v => !/Remediated/.test(v.status));
  el('testPill').className = 'badge ' + (open.length ? 'b-warn' : 'b-ok');
  el('testPill').textContent = `${SEC_TESTS.length} tests · ${open.length} open`;
  el('vulnPill').textContent = open.length;

  el('testKpis').innerHTML = [
    ['Tests run', num(SEC_TESTS.length), 'In the last 15 days', 'gold'],
    ['Clean passes', num(SEC_TESTS.filter(t => t.result === 'Pass').length), 'Nothing to fix', ''],
    ['With findings', num(SEC_TESTS.filter(t => t.findings > 0).length), 'Raised a vulnerability', ''],
    ['Open vulnerabilities', num(open.length), `${num(open.filter(v => v.severity === 'Critical').length)} critical`, open.length ? 'red' : ''],
    ['Remediated', num(VULNS.filter(v => /Remediated/.test(v.status)).length), 'Fixed and verified', ''],
    ['Areas covered', num(new Set(SEC_TESTS.map(t => t.area)).size), 'Application to configuration', '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join('');

  el('testCharts').innerHTML = [
    chartBox({title:'Vulnerabilities by severity', sub:'Open and closed', value:num(VULNS.length),
      chart: chart({type:'donut', cats:['Critical','High','Medium','Low'], h:200, colours:['#7C1F1F','#D93F3F','#E08C1E','#8A90A0'],
        series:[{data:['Critical','High','Medium','Low'].map(sv => VULNS.filter(v => v.severity === sv).length)}]})}),
    chartBox({title:'Tests by area', sub:'Where the coverage sits', value:num(SEC_TESTS.length) + ' tests',
      chart: chart({type:'bar', cats:[...new Set(SEC_TESTS.map(t => t.area))], h:200,
        series:[{name:'Tests', colour:'#7C5CF0',
          data:[...new Set(SEC_TESTS.map(t => t.area))].map(a => SEC_TESTS.filter(t => t.area === a).length)}]})}),
    chartBox({title:'Findings raised by test', sub:'Each run and what it found', value:num(sum(SEC_TESTS, t => t.findings)),
      chart: chart({type:'bar', cats:SEC_TESTS.map(t => t.id.slice(-3)), h:200,
        series:[{name:'Findings', data:SEC_TESTS.map(t => t.findings), colour:'#E08C1E'}]})})
  ].join('');

  renderTable('testBody', [
    {k:'id', label:'Test'},
    {k:'area', label:'Area'},
    {k:'name', label:'Check'},
    {k:'ran', label:'Run', html:v => fmtDate(v)},
    {k:'result', label:'Result', html:v => badge(v, /^Pass$/.test(v) ? 'b-ok' : /Pass/.test(v) ? 'b-warn' : 'b-crit')},
    {k:'findings', label:'Findings', num:true}
  ], SEC_TESTS, {sort:'ran', pageSize:8});

  renderTable('vulnBody', [
    {k:'id', label:'Vulnerability'},
    {k:'title', label:'Title'},
    {k:'area', label:'Area'},
    {k:'severity', label:'Severity', html:v => badge(v, sevTone(v))},
    {k:'found', label:'Found', html:v => fmtDate(v)},
    {k:'status', label:'Status', html:v => badge(v, /Remediated/.test(v) ? 'b-ok' : /Accepted/.test(v) ? 'b-gray' : 'b-warn')},
    {k:'act', label:'', html:(v, r) => /Remediated/.test(r.status) ? '—' : `<button class="btn btn-ghost" data-vuln="${r.id}">Record fix</button>`}
  ], VULNS, {sort:'severity', pageSize:7});

  const fixed = VULNS.filter(v => v.fixed);
  el('remedHead').innerHTML = '<tr><th>Vulnerability</th><th>Title</th><th>Fixed</th><th>Owner</th></tr>';
  el('remedBody').innerHTML = fixed.length ? fixed.map(v => `<tr><td>${esc(v.id)}</td><td>${esc(v.title)}</td>
      <td>${fmtDate(v.fixed)}</td><td>${esc(staffName(v.owner))}</td></tr>`).join('')
    : '<tr><td colspan="4" class="empty">Nothing remediated yet.</td></tr>';

  el('testGrid').innerHTML = [...new Set(SEC_TESTS.map(t => t.area))].map((a, i) => {
    const mine = SEC_TESTS.filter(t => t.area === a);
    const pass = mine.filter(t => t.result === 'Pass').length;
    return meter(a, pct(pass, mine.length), 90, 60, `${pass} of ${mine.length} checks clean`);
  }).join('');
}
function remediateVuln(id){
  const v = VULNS.find(x => x.id === id);
  if(!v) return;
  v.status = 'Remediated'; v.fixed = TODAY;
  logSec('Vulnerability ' + id + ' remediated');
  renderAll(); toast(id + ' recorded as remediated');
}

/* ===================== 18 · SETTINGS ===================== */
function renderSettings(){
  el('setPwMin').value = SEC_SET.pwMin;
  el('setPwExpiry').value = SEC_SET.pwExpiry;
  el('setPwReuse').value = SEC_SET.pwReuse;
  el('setAttempts').value = SEC_SET.attempts;
  el('setLockout').value = SEC_SET.lockout;
  el('setSession').value = SEC_SET.session;
  el('setConcurrent').value = SEC_SET.concurrent;
  el('setPwUpper').classList.toggle('on', SEC_SET.upper);
  el('setPwNumber').classList.toggle('on', SEC_SET.number);
  el('setPwSymbol').classList.toggle('on', SEC_SET.symbol);

  el('mfaGrid').innerHTML = [
    ['Administrators', SEC_SET.mfaAdmins, 'mfaAdmins'],
    ['Finance roles', SEC_SET.mfaFinance, 'mfaFinance'],
    ['Every account', SEC_SET.mfaAll, 'mfaAll']
  ].map(([label, on, key]) => `<div class="risk">
      <div><div class="rn">${esc(label)}</div><div class="rs">${on ? 'Second factor required at sign-in' : 'Password only'}</div></div>
      <div class="rv"><span class="fchip${on ? ' on' : ''}" data-mfa="${key}">${on ? 'Required' : 'Off'}</span></div></div>`).join('');

  el('txAuthHead').innerHTML = '<tr><th>Action</th><th>Condition</th><th>Approver</th></tr>';
  el('txAuthBody').innerHTML = [
    ['Approve a loan', 'Above MK ' + num(2000000), 'Head of credit'],
    ['Release a disbursement', 'Above MK ' + num(2000000), 'Head of credit'],
    ['Reverse a payment', 'Always', 'A different officer'],
    ['Adjust a balance', 'Always', 'Administrator'],
    ['Export customer data', 'Above ' + num(SEC_SET.alertExport) + ' rows', 'Compliance']
  ].map(([a, c, ap]) => `<tr><td>${esc(a)}</td><td>${esc(c)}</td><td>${esc(ap)}</td></tr>`).join('');

  el('threshHead').innerHTML = '<tr><th>Signal</th><th>Threshold</th><th>Severity</th></tr>';
  el('threshBody').innerHTML = [
    ['Failed sign-ins before an alert', SEC_SET.attempts + ' attempts', 'High'],
    ['Transaction above the monitoring line', money(SEC_SET.alertAmount), 'Critical'],
    ['Export above the review line', num(SEC_SET.alertExport) + ' rows', 'High'],
    ['Off-shore sign-in', 'Any', 'High'],
    ['Incident escalation window', SEC_SET.escalateHours + ' hours', 'Critical']
  ].map(([a, b, c]) => `<tr><td>${esc(a)}</td><td>${esc(b)}</td><td>${badge(c, sevTone(c))}</td></tr>`).join('');

  el('policyHead').innerHTML = '<tr><th>Policy</th><th>Setting</th><th>State</th></tr>';
  el('policyBody').innerHTML = [
    ['Audit log retention', SEC_SET.auditRetention + ' months', 'Enforced'],
    ['Backup retention', SEC_SET.backupRetention + ' days nightly', 'Enforced'],
    ['Off-site copy', SEC_SET.offsite ? 'Yes' : 'No', SEC_SET.offsite ? 'Enforced' : 'Gap'],
    ['Incident escalation', 'Compliance officer after ' + SEC_SET.escalateHours + ' hours', 'Enforced'],
    ['Session timeout', SEC_SET.session + ' minutes', 'Enforced'],
    ['Staff permission policy', 'Least privilege, role-based, reviewed each quarter', 'Enforced'],
    ['Sensitive transaction authorisation', 'Two officers above MK ' + num(SEC_SET.alertAmount), 'Enforced'],
    ['Alert threshold', 'Large movement over MK ' + num(SEC_SET.alertAmount) + ', export over ' + num(SEC_SET.alertExport) + ' rows', 'Enforced'],
    ['Incident escalation rule', 'Critical → compliance officer, then branch manager at 4 hours', 'Enforced']
  ].map(([a, b, c]) => `<tr><td>${esc(a)}</td><td>${esc(b)}</td><td>${okBadge(c)}</td></tr>`).join('');

  renderTable('secHistBody', [
    {k:'when', label:'When', html:v => fmtDate(v)},
    {k:'who', label:'By'},
    {k:'what', label:'Change'}
  ], SEC_HISTORY, {sort:'when', pageSize:6});
}

function saveSettings(){
  const before = Object.assign({}, SEC_SET);
  SEC_SET.pwMin = Math.max(8, Number(el('setPwMin').value) || SEC_SET.pwMin);
  SEC_SET.pwExpiry = Math.max(0, Number(el('setPwExpiry').value) || 0);
  SEC_SET.pwReuse = Math.max(0, Number(el('setPwReuse').value) || 0);
  SEC_SET.attempts = Math.max(3, Number(el('setAttempts').value) || SEC_SET.attempts);
  SEC_SET.lockout = Math.max(5, Number(el('setLockout').value) || SEC_SET.lockout);
  SEC_SET.session = Math.max(5, Number(el('setSession').value) || SEC_SET.session);
  SEC_SET.concurrent = Math.max(1, Number(el('setConcurrent').value) || SEC_SET.concurrent);
  const keys = ['pwMin','pwExpiry','pwReuse','attempts','lockout','session','concurrent'];
  const changed = keys.filter(k => before[k] !== SEC_SET[k]);
  if(!changed.length) return toast('No setting changed.', 'info');
  changed.forEach(k => SEC_HISTORY.unshift({when: TODAY, who: 'Chikondi Mwale',
    what: `${k} changed from ${before[k]} to ${SEC_SET[k]}`}));
  logSec('Security settings updated: ' + changed.join(', '));
  el('setState').textContent = 'Saved';
  el('setState').className = 'badge b-ok';
  renderAll();
  toast('Security settings saved');
}
function toggleMfa(key){
  SEC_SET[key] = !SEC_SET[key];
  SEC_HISTORY.unshift({when: TODAY, who: 'Chikondi Mwale',
    what: 'MFA setting ' + key + ' turned ' + (SEC_SET[key] ? 'on' : 'off')});
  logSec('MFA setting ' + key + ' toggled');
  renderSettings();
  toast('MFA setting updated');
}
function logSec(what){
  SEC_EVENTS.unshift({id: 'EVT-' + pad(5500 + SEC_EVENTS.length, 4), when: TODAY + ' 09:30',
    category: 'Configuration change', who: 'STF-009', staff: 'Chikondi Mwale', role: 'Administrator',
    ip: '41.87.12.44', target: 'security.settings', detail: what, outcome: 'Success'});
  SEC_HISTORY.unshift({when: TODAY, who: 'Chikondi Mwale', what});
}

/* ===================== render everything ===================== */
function renderAll(){
  renderOverview();
  renderAccounts();
  renderAuth();
  renderRoles();
  renderSessions();
  renderDataProtection();
  renderFinancial();
  renderDatabase();
  renderApp();
  renderFraud();
  renderIncidents();
  renderAuditLogs();
  renderBackups();
  renderEncryption();
  renderCompliance();
  renderReports();
  renderTesting();
  renderSettings();
  renderExportHistory();
  el('topRefresh').textContent = lastRefresh();
  el('expCount').textContent = EXPORTS.length;
}

/* ===================== wiring ===================== */
function syncFilterInputs(){
  const set = (id, v) => { const n = el(id); if(n) n.value = v; };
  set('fltSeverity', FILTER.severity); set('fltStatus', FILTER.status);
  set('fltOwner', FILTER.owner); set('fltRegion', FILTER.region);
  set('fltProduct', FILTER.product); set('fltFrom', FILTER.from); set('fltTo', FILTER.to);
  set('fltSearch', FILTER.q);
}
function syncLaneChips(){
  document.querySelectorAll('#fltLaneChips [data-lane]').forEach(c =>
    c.classList.toggle('on', c.dataset.lane === FILTER.lane));
}
function fillSelects(){
  const put = (id, items, all) => {
    const s = el(id);
    if(!s) return;
    s.innerHTML = `<option value="">${all}</option>` +
      items.map(([v, l]) => `<option value="${esc(v)}">${esc(l)}</option>`).join('');
  };
  put('fltProduct', PRODUCTS.map(p => [p.id, p.name]), 'All products');
  put('fltStatus', SEC_STATES.map(s => [s, s]), 'All incident states');
  put('fltOwner', ['STF-009','STF-003','STF-004'].map(r => [r, staffName(r)]), 'All owners');
  put('fltRegion', REGIONS.map(r => [r, r]), 'All regions');
  put('fltSeverity', [['Critical','Critical'],['High','High'],['Medium','Medium'],['Low','Low']], 'All severities');
}
function applyFilters(){
  FILTER.severity = el('fltSeverity').value;
  FILTER.status = el('fltStatus').value;
  FILTER.owner = el('fltOwner').value;
  FILTER.region = el('fltRegion').value;
  FILTER.product = el('fltProduct').value;
  FILTER.from = el('fltFrom').value || FILTER.from;
  FILTER.to = el('fltTo').value || FILTER.to;
  FILTER.q = el('fltSearch').value.trim();
  syncLaneChips();
  renderAll();
  renderFilterSummary();
  toast('Filters applied across all eighteen sections');
}
function clearFilter(key){
  if(key === 'lane') FILTER.lane = '';
  else if(key === 'severity') FILTER.severity = '';
  else if(key === 'status') FILTER.status = '';
  else if(key === 'owner') FILTER.owner = '';
  else if(key === 'region') FILTER.region = '';
  else if(key === 'product') FILTER.product = '';
  else if(key === 'q') FILTER.q = '';
  else if(key === 'range'){ FILTER.from = '2026-01-01'; FILTER.to = TODAY; }
}
function renderFilterSummary(){
  syncLaneChips();
  const bits = [];
  if(FILTER.lane) bits.push(['Area: ' + FILTER.lane, 'lane']);
  if(FILTER.severity) bits.push(['Severity: ' + FILTER.severity, 'severity']);
  if(FILTER.status) bits.push(['State: ' + FILTER.status, 'status']);
  if(FILTER.owner) bits.push(['Owner: ' + staffName(FILTER.owner), 'owner']);
  if(FILTER.region) bits.push(['Region: ' + FILTER.region, 'region']);
  if(FILTER.product) bits.push(['Product: ' + prodName(FILTER.product), 'product']);
  if(FILTER.q) bits.push(['Search: ' + FILTER.q, 'q']);
  bits.push([`${fmtDate(FILTER.from)} – ${fmtDate(FILTER.to)}`, 'range']);
  const chips = el('fltChips');
  if(chips) chips.innerHTML = bits.map(([label, key]) =>
    `<span class="fchip on" data-clear="${key}">${esc(label)} <span class="x">✕</span></span>`).join('');
  const sum2 = el('fltSummary');
  if(sum2) sum2.textContent = bits.length > 1 ? (bits.length - 1) + ' filter' + (bits.length === 2 ? '' : 's') + ' applied' : 'Date range only';
  const result = el('fltResult');
  if(result) result.textContent = `This filter covers ${num(incidentRows().length)} incidents, ` +
    `${num(accountRows().length)} accounts, ${num(LOGINS.filter(l => matchQ(l.who, l.device)).length)} sign-in events and ` +
    `${num(DB_TABLES.length)} database tables.`;
  const counts = el('fltCounts');
  if(counts) counts.innerHTML = [
    ['Incidents', num(incidentRows().length)],
    ['Accounts', num(ACCOUNTS.length)],
    ['Sign-ins', num(LOGINS.length)],
    ['Sessions', num(SESSIONS.length)],
    ['Events', num(SEC_EVENTS.length)],
    ['Vulnerabilities', num(VULNS.length)]
  ].map(([l, v]) => `<div><div class="sl">${l}</div><div class="sv">${v}</div></div>`).join('');
}

function goto(id){
  const sec = document.getElementById(id);
  document.querySelectorAll('.snav').forEach(a =>
    a.classList.toggle('on', a.getAttribute('href') === '#' + id));
  if(!sec) return;
  try { sec.scrollIntoView({behavior:'smooth', block:'start'}); } catch(e){}
  if(window.history && history.replaceState) history.replaceState(null, '', '#' + id);
}

function wireAll(){
  document.querySelectorAll('.snav').forEach(a =>
    a.addEventListener('click', e => { e.preventDefault(); goto(a.getAttribute('href').slice(1)); }));

  document.addEventListener('click', e => {
    const g = e.target.closest('[data-goto]');
    if(g){ goto(g.dataset.goto); return; }
    if(sortOrPage(e)) return;

    const aw = e.target.closest('[data-aw]');
    if(aw){ incidentAction(aw.dataset.aw); return; }

    const acct = e.target.closest('[data-acct]');
    if(acct){ acctAction(acct.dataset.acct, acct.dataset.act); return; }

    const sess = e.target.closest('[data-sess]');
    if(sess){ revokeSession(sess.dataset.sess); return; }

    const rev = e.target.closest('[data-rev]');
    if(rev){ approveReversal(rev.dataset.rev); return; }

    const adj = e.target.closest('[data-adj]');
    if(adj){ approveAdjustment(adj.dataset.adj); return; }

    const rot = e.target.closest('[data-rotate]');
    if(rot){ rotateSecret(rot.dataset.rotate); return; }

    const vuln = e.target.closest('[data-vuln]');
    if(vuln){ remediateVuln(vuln.dataset.vuln); return; }

    const rv = e.target.closest('[data-review]');
    if(rv){ openAccount(rv.dataset.review); return; }

    const dreq = e.target.closest('[data-dreq]');
    if(dreq){
      const r = DATA_REQS.find(x => x.id === dreq.dataset.dreq);
      if(r){
        const order = ['Open','In progress','Completed'];
        r.status = r.status === 'Completed' ? 'Open' : order[Math.min(order.length - 1, order.indexOf(r.status) + 1)];
        logSec('Data request ' + r.id + ' moved to ' + r.status);
        renderAll(); toast(r.id + ' · ' + r.status);
      }
      return;
    }

    const rep = e.target.closest('[data-rep]');
    if(rep){ runReport(rep.dataset.rep, rep.dataset.fmt); return; }

    const chip = e.target.closest('[data-clear]');
    if(chip){ clearFilter(chip.dataset.clear); syncFilterInputs(); renderAll(); renderFilterSummary(); return; }

    const lane = e.target.closest('#fltLaneChips [data-lane]');
    if(lane){
      FILTER.lane = lane.dataset.lane;
      renderAll(); renderFilterSummary();
      toast(FILTER.lane ? 'Area: ' + FILTER.lane : 'All areas', 'info');
      return;
    }

    const cat = e.target.closest('[data-logcat]');
    if(cat){ LOG_FILTER.cat = cat.dataset.logcat; renderAuditLogs(); return; }

    const mfa = e.target.closest('[data-mfa]');
    if(mfa){ toggleMfa(mfa.dataset.mfa); return; }

    ['setPwUpper','setPwNumber','setPwSymbol'].forEach(id => {
      if(e.target.closest('#' + id)){
        const key = id === 'setPwUpper' ? 'upper' : id === 'setPwNumber' ? 'number' : 'symbol';
        SEC_SET[key] = !SEC_SET[key];
        el(id).classList.toggle('on', SEC_SET[key]);
        SEC_HISTORY.unshift({when: TODAY, who: 'Chikondi Mwale',
          what: 'Password rule ' + key + ' turned ' + (SEC_SET[key] ? 'on' : 'off')});
        renderAll();
        toast('Password rule updated');
      }
    });
  });

  el('fltApply').addEventListener('click', applyFilters);
  el('fltReset').addEventListener('click', () => {
    FILTER.lane = FILTER.severity = FILTER.status = FILTER.owner = FILTER.region = FILTER.product = FILTER.q = '';
    FILTER.from = '2026-01-01'; FILTER.to = TODAY;
    syncFilterInputs(); renderAll(); renderFilterSummary();
    toast('All filters cleared', 'info');
  });
  ['fltSeverity','fltStatus','fltOwner','fltRegion','fltProduct'].forEach(id => {
    const n = el(id);
    if(n) n.addEventListener('change', applyFilters);
  });
  el('fltSearch').addEventListener('keydown', e => { if(e.key === 'Enter') applyFilters(); });
  el('globalSearch').addEventListener('keydown', e => {
    if(e.key !== 'Enter') return;
    FILTER.q = e.target.value.trim();
    el('fltSearch').value = FILTER.q;
    renderAll(); renderFilterSummary();
    toast(FILTER.q ? 'Searching for "' + FILTER.q + '"' : 'Search cleared', 'info');
  });

  el('refreshBtn').addEventListener('click', () => {
    const now = new Date();
    REFRESH = fmtDate(TODAY) + ' · ' + pad(now.getHours(), 2) + ':' + pad(now.getMinutes(), 2);
    renderAll();
    toast('Security registers recalculated');
  });

  el('quickCsv').addEventListener('click', () => runPack('csv'));
  el('printBtn').addEventListener('click', () => runPack('print'));
  el('packCsv').addEventListener('click', () => runPack('csv'));
  el('packXlsx').addEventListener('click', () => runPack('xlsx'));
  el('packPdf').addEventListener('click', () => runPack('pdf'));
  el('packPrint').addEventListener('click', () => runPack('print'));
  el('revokeAllBtn').addEventListener('click', () => {
    const n = SESSIONS.length;
    if(!n) return toast('No sessions open.', 'info');
    SESSIONS.length = 0;
    REVOCATIONS.unshift({when: TODAY + ' 09:25', staff: '—', by: 'Chikondi Mwale', scope: 'All sessions',
      why: 'Every session revoked from the console'});
    logSec('All ' + n + ' sessions revoked');
    renderAll();
    toast(n + ' sessions revoked');
  });

  el('setSave').addEventListener('click', saveSettings);
  el('setReset').addEventListener('click', () => {
    Object.assign(SEC_SET, {pwMin:12, pwExpiry:90, pwReuse:5, upper:true, number:true, symbol:true,
      attempts:5, lockout:30, session:30, concurrent:2});
    SEC_HISTORY.unshift({when: TODAY, who: 'Chikondi Mwale', what: 'Security settings reset to the policy defaults'});
    renderAll();
    toast('Settings reset to the policy defaults', 'info');
  });

  el('menuBtn').addEventListener('click', () => document.getElementById('sidebar').classList.toggle('open'));
  el('bellBtn').addEventListener('click', () => goto('s11'));
  el('modalClose').addEventListener('click', closeModal);
  el('modal').addEventListener('click', e => { if(e.target.id === 'modal') closeModal(); });
  document.addEventListener('keydown', e => { if(e.key === 'Escape') closeModal(); });

  let spyT = null;
  window.addEventListener('scroll', () => { clearTimeout(spyT); spyT = setTimeout(spyScroll, 160); }, {passive:true});
}

function spyScroll(){
  const secs = [...document.querySelectorAll('section.sec')];
  if(!secs.length) return;
  let current = secs[0];
  secs.forEach(s => { if(s.getBoundingClientRect().top <= 170) current = s; });
  document.querySelectorAll('.snav').forEach(a =>
    a.classList.toggle('on', a.getAttribute('href') === '#' + current.id));
}

window.SECURITY_APP = {
  FILTER, SEC_SET, ACCOUNTS, LOGINS, SESSIONS, INCIDENTS, SEC_FINDINGS, VULNS, SECRETS,
  SEC_EVENTS, EXPORTS, DATA_REQS, REVERSALS, ADJUSTMENTS, DB_TABLES, API_ROUTES, BACKUPS,
  secStats, reportData, renderAll, acctAction, incidentAction, selectIncident, revokeSession,
  saveSettings, rotateSecret, remediateVuln, runReport, runPack, goto
};

/* boot */
(function(){
  fillSelects();
  syncFilterInputs();
  renderAll();
  renderFilterSummary();
  wireAll();
  const hash = (location.hash || '').slice(1);
  if(hash) goto(hash);
})();
</script>
</body>
</html>
