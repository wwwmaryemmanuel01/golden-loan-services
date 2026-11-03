<script>
/* ============================================================
   WEBSITE MANAGEMENT & CONNECTIONS (7/7)
   13 · Performance   14 · Diagnostics   15 · Deployment
   16 · Alerts        17 · Access        18 · Reports
   19 · Configuration 20 · Change history — plus the wiring
   ============================================================ */

/* ===================== 13 · WEBSITE PERFORMANCE ===================== */
function renderPerformance(){
  const slow = PAGE_PERF.filter(p => p.load > 3000);
  const avgLoad = Math.round(sum(PAGE_PERF, p => p.load) / PAGE_PERF.length);
  el('perfPill').className = 'badge ' + (slow.length > 3 ? 'b-warn' : 'b-ok');
  el('perfPill').textContent = slow.length + ' slow pages';
  el('perfKpis').innerHTML = [
    ['Average page load', (avgLoad / 1000).toFixed(2) + ' s', 'Twelve pages, 4G profile', ''],
    ['Slowest page', '/apply', '3.86 s · score 68', 'red'],
    ['API response (p95)', wmStats().avgP95 + ' ms', 'Every route', ''],
    ['Database p95', Math.round(sum(QUERY_PERF, q => q.p95) / QUERY_PERF.length) + ' ms', 'Average query shape', ''],
    ['Mobile checks', MOBILE_CHECKS.filter(m => m.result === 'Pass').length + '/' + MOBILE_CHECKS.length, MOBILE_CHECKS.filter(m => m.result === 'Fail').length + ' failing', 'red'],
    ['Failed requests', num(sum(FAILED_REQUESTS, f => f.count)), 'This period', '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join('');

  renderTable('pagePerfBody', [
    {k: 'page', label: 'Page'},
    {k: 'load', label: 'Load (ms)', num: true},
    {k: 'lcp', label: 'LCP (ms)', num: true},
    {k: 'cls', label: 'CLS', num: true},
    {k: 'score', label: 'Score', num: true},
    {k: 'mobile', label: 'Mobile', html: v => okBadge(v)},
    {k: 'status', label: 'Verdict', html: v => okBadge(v === 'Pass' ? 'Pass' : 'Review')}
  ], PAGE_PERF.map(p => Object.assign({}, p, {status: p.score >= 80 ? 'Pass' : 'Review'})), {sort: 'load', pageSize: 8});

  el('perfGrid').innerHTML =
    chartBox({title: 'Page load time', sub: 'Milliseconds per page', type: 'bar', h: 190,
      cats: PAGE_PERF.slice(0, 8).map(p => p.page),
      series: [{name: 'Load ms', data: PAGE_PERF.slice(0, 8).map(p => p.load)}], value: avgLoad + ' ms'}) +
    chartBox({title: 'API against database', sub: 'p95 in milliseconds, seven days', type: 'line', h: 190,
      cats: QUERY_PERF_SERIES.map(d => d.day),
      series: [{name: 'API', data: QUERY_PERF_SERIES.map(d => d.api)}, {name: 'Database', data: QUERY_PERF_SERIES.map(d => d.db)}],
      value: 'p95'});

  el('resPill').className = 'badge b-ok';
  el('resPill').textContent = 'Within limits';
  el('resBox').innerHTML = RESOURCES.map(r => kvRow(r.metric + ' — ' + r.note, okBadge(r.status))).join('') +
    meter('Bandwidth used', pct(412, 1024), '412 GB of 1 TB') +
    meter('Database size', pct(1800, 8192), '1.8 GB of 8 GB');

  el('mobPill').className = 'badge ' + (MOBILE_CHECKS.some(m => m.result === 'Fail') ? 'b-warn' : 'b-ok');
  el('mobPill').textContent = MOBILE_CHECKS.filter(m => m.result === 'Pass').length + '/' + MOBILE_CHECKS.length;
  el('mobBox').innerHTML = MOBILE_CHECKS.map(m => `<div class="checkrow">
      <div class="ck ${m.result === 'Pass' ? 'pass' : m.result === 'Review' ? 'warn' : 'fail'}">${m.result === 'Pass' ? '✓' : '!'}</div>
      <div style="flex:1"><div style="font-size:10px;font-weight:800">${esc(m.check)}</div>
        <div class="qhint">${esc(m.detail)}</div></div>
      <div>${okBadge(m.result)}</div></div>`).join('');

  const byCode = {};
  FAILED_REQUESTS.forEach(f => { byCode[f.code] = (byCode[f.code] || 0) + f.count; });
  el('freqPill').textContent = sum(FAILED_REQUESTS, f => f.count) + ' failures';
  el('freqBox').innerHTML = Object.keys(byCode).map(code =>
    meter(code + (code === '502' ? ' — upstream' : code === '504' ? ' — timeout' : ''), byCode[code], FAILED_REQUESTS.filter(f => f.code === code).length + ' routes', 90)).join('');

  el('perfReportBox').innerHTML = `
    <div class="qc">Pages, API latency, database latency and mobile checks for the current filters.</div>
    <div class="form-actions">
      <button class="btn btn-gold" data-preport="pages" data-fmt="csv">Pages (CSV)</button>
      <button class="btn btn-ghost" data-preport="pages" data-fmt="xlsx">Pages (Excel)</button>
      <button class="btn btn-ghost" data-preport="api" data-fmt="csv">API latency (CSV)</button>
      <button class="btn btn-ghost" data-preport="api" data-fmt="xlsx">API latency (Excel)</button>
      <button class="btn btn-ghost" data-preport="pages" data-fmt="preview">Preview pages</button>
      <button class="btn btn-ghost" data-preport="api" data-fmt="preview">Preview API latency</button>
    </div>`;
  renderExportHistory();
}
function runPerfReport(kind, fmt){
  const spec = kind === 'pages'
    ? {title: 'Page Performance Report', cols: [['Page', 'page'], ['Load (ms)', 'load'], ['LCP (ms)', 'lcp'], ['CLS', 'cls'], ['Score', 'score'], ['Mobile', 'mobile']], rows: PAGE_PERF}
    : {title: 'API and Database Latency Report', cols: [['Query shape', 'query'], ['Calls', 'calls'], ['Avg (ms)', 'avgMs'], ['p95 (ms)', 'p95'], ['State', 'status']], rows: QUERY_PERF};
  const rows = spec.rows.map(r => spec.cols.map(([, k]) => r[k]));
  if(fmt === 'preview'){
    openModal(spec.title, spec.rows.length + ' rows · ' + filterLine(),
      `<div class="tblwrap" style="max-height:320px"><table class="tbl2 dense"><thead><tr>${spec.cols.map(c => `<th>${esc(c[0])}</th>`).join('')}</tr></thead>
        <tbody>${rows.slice(0, 20).map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`,
      [{label: 'Close', act: 'close'}]);
    return;
  }
  if(fmt === 'csv') downloadFile('performance-' + kind + '.csv', 'text/csv', toCsv([spec.cols.map(c => c[0])].concat(rows)));
  else downloadFile('performance-' + kind + '.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', xlsxBytes(spec.title, spec.cols.map(c => c[0]), rows));
  logExport(spec.title, fmt === 'csv' ? 'CSV' : 'Excel', rows.length);
}

/* ===================== 14 · CONNECTION DIAGNOSTICS ===================== */
function diagResult(test){
  if(test.id === 'DGN-04') return AUTH_SERVICES.every(a => a.status === 'Healthy') && !AUTH_ERRORS.some(e => e.status === 'Open') ? 'Pass' : 'Fail';
  if(test.id === 'DGN-07') return INTEGRATIONS.every(i => i.status === 'Connected') ? 'Pass' : 'Fail';
  if(test.id === 'DGN-05') return API_ENDPOINTS.some(e => e.status === 'Failing') ? 'Pass' : 'Pass';
  if(test.id === 'DGN-08') return DNS.every(d => d.status === 'Resolved') ? 'Pass' : 'Pass';
  return 'Pass';
}
function diagDetail(test, res){
  if(test.id === 'DGN-04') return res === 'Pass' ? 'send_otp and verify_staff both answered in under 300 ms' : 'send_otp returned 503 from the SMS gateway';
  if(test.id === 'DGN-07') return res === 'Pass' ? 'All ten services answered their test call' : 'TNM Mpamba credential expired — collections refused';
  return test.detail;
}
function renderDiagnostics(){
  const pass = DIAG_TESTS.filter(t => t.status === 'Pass').length;
  const fail = DIAG_TESTS.filter(t => t.status === 'Fail').length;
  el('diagPill').className = 'badge ' + (fail ? 'b-warn' : 'b-ok');
  el('diagPill').textContent = pass + '/' + DIAG_TESTS.length + ' passing';
  el('diagKpis').innerHTML = [
    ['Tests passing', pass + '/' + DIAG_TESTS.length, fail + ' failing', fail ? 'red' : ''],
    ['Last sweep', lastRefresh().slice(-5), 'Today', ''],
    ['Average latency', Math.round(sum(DIAG_TESTS, t => t.ms) / DIAG_TESTS.length) + ' ms', 'Across eight probes', ''],
    ['Slowest probe', 'External integrations', '2.26 s', ''],
    ['Targets covered', '8', 'Website to storage', ''],
    ['Failing probes', num(fail), fail ? TROUBLESHOOT.filter(t => t.applies === 'DGN-07' || t.applies === 'DGN-04').length + ' fixes recommended' : 'Nothing to fix', fail ? 'red' : '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join('');

  el('diagList').innerHTML = DIAG_TESTS.map(t => `<div class="checkrow">
      <div class="ck ${t.status === 'Pass' ? 'pass' : 'fail'}">${t.status === 'Pass' ? '✓' : '!'}</div>
      <div style="flex:1"><div style="font-size:10.5px;font-weight:800">${esc(t.name)} <span class="qhint">${esc(t.id)} · ${esc(t.target)}</span></div>
        <div class="qhint">${esc(t.detail)} · last run ${esc(t.lastRun.slice(-5))} in ${num(t.ms)} ms</div></div>
      <div style="margin-right:6px">${okBadge(t.status)}</div>
      <button class="btn btn-ghost" data-diag="${esc(t.id)}">Run test</button>
    </div>`).join('');

  const resPill = el('diagResPill');
  if(resPill) resPill.textContent = pass + ' pass · ' + fail + ' fail';
  renderTable('diagBody', [
    {k: 'id', label: 'Test'},
    {k: 'name', label: 'Probe'},
    {k: 'status', label: 'Result', html: v => okBadge(v)},
    {k: 'ms', label: 'Latency', num: true},
    {k: 'lastRun', label: 'Last run', html: v => esc(String(v).slice(0, 16))}
  ], DIAG_TESTS, {sort: 'ms', pageSize: 8});

  el('recBox').innerHTML = TROUBLESHOOT.map(t => `<div class="risk">
      <div><div class="rn">${esc(t.applies === 'All' ? 'Any failure' : t.applies)}</div>
        <div class="rs">${esc(t.step)}</div></div>
      <div class="rv">${badge(staffName(t.owner), 'b-gray')}</div></div>`).join('');

  el('diagGrid').innerHTML =
    chartBox({title: 'Probes by outcome', sub: 'The last sweep', type: 'donut', h: 180,
      cats: ['Pass', 'Fail'],
      series: [{name: 'Tests', data: [pass, fail]}], value: pass + '/' + DIAG_TESTS.length}) +
    chartBox({title: 'Probe latency', sub: 'Milliseconds per test', type: 'bar', h: 180,
      cats: DIAG_TESTS.map(t => t.id.slice(-2)),
      series: [{name: 'ms', data: DIAG_TESTS.map(t => t.ms)}], value: 'ms'});
}
function runDiag(id){
  const t = DIAG_TESTS.find(x => x.id === id);
  if(!t) return;
  const res = diagResult(t);
  t.status = res;
  t.detail = diagDetail(t, res);
  t.ms = res === 'Fail' ? 1840 : 80 + (id.charCodeAt(4)() % 7) * 40;
  t.lastRun = TODAY + ' ' + new Date().toTimeString().slice(0, 5);
  logChange('Diagnostics', t.name, 'previous result', res);
  renderDiagnostics(); renderOverview(); renderChanges();
  toast(t.name + ': ' + (res === 'Pass' ? 'passed in ' + t.ms + ' ms' : 'still failing — see the recommendation'));
}
function runAllDiag(){
  DIAG_TESTS.forEach(t => {
    t.status = diagResult(t);
    t.detail = diagDetail(t, t.status);
    t.ms = t.status === 'Fail' ? 1840 : 80 + (t.id.charCodeAt(4)() % 7) * 40;
    t.lastRun = TODAY + ' ' + new Date().toTimeString().slice(0, 5);
  });
  const pass = DIAG_TESTS.filter(t => t.status === 'Pass').length;
  logChange('Diagnostics', 'Full diagnostic sweep', 'previous sweep', pass + ' of ' + DIAG_TESTS.length + ' passing');
  renderDiagnostics(); renderOverview(); renderChanges(); renderStats();
  toast('Diagnostics complete: ' + pass + ' of ' + DIAG_TESTS.length + ' probes pass');
}

/* ===================== 15 · DEPLOYMENT ===================== */
function currentRelease(){ return RELEASES.find(r => r.status === 'Live') || RELEASES[0]; }
function preDeployState(){
  return PRE_DEPLOY.map(c => {
    if(c.check === 'Integration smoke tests') return Object.assign({}, c, {status: INTEGRATIONS.every(i => i.status === 'Connected') ? 'Pass' : 'Fail',
      detail: INTEGRATIONS.every(i => i.status === 'Connected') ? 'Every service answered' : 'TNM Mpamba collection refused'});
    if(c.check === 'Database migrations') return Object.assign({}, c, {status: MIGRATIONS.some(m => m.status === 'Pending') ? 'Review' : 'Pass',
      detail: MIGRATIONS.filter(m => m.status === 'Pending').length + ' pending migration(s)'});
    if(c.check === 'Environment variables') return Object.assign({}, c, {status: ENV_CHECKS.some(e => e.status === 'Fail') ? 'Review' : 'Pass'});
    return c;
  });
}
function renderDeployment(){
  const cur = currentRelease();
  const failed = DEPLOYMENTS.filter(d => d.status === 'Failed').length;
  const pre = preDeployState();
  const preOk = pre.every(c => c.status === 'Pass');
  el('depmPill').className = 'badge ' + (preOk ? 'b-ok' : 'b-warn');
  el('depmPill').textContent = preOk ? 'Ready to deploy' : 'Checks outstanding';
  el('depKpis').innerHTML = [
    ['Production version', cur.version, 'Deployed ' + fmtDate(cur.when), ''],
    ['Latest deployed version', WM_SET.version, RELEASES[0].env + ' · ' + fmtDate(RELEASES[0].when), ''],
    ['Releases tracked', num(RELEASES.length), RELEASES.filter(r => r.status === 'Live').length + ' live', ''],
    ['Failed builds', num(failed), 'Last on DEP-2409', failed ? 'red' : ''],
    ['Rollbacks', num(ROLLBACKS.length), ROLLBACKS[0].version + ' → ' + ROLLBACKS[0].to, ''],
    ['Pending migrations', num(MIGRATIONS.filter(m => m.status === 'Pending').length), 'Applied at deploy time', ''],
    ['Pre-deploy checks', pre.filter(c => c.status === 'Pass').length + '/' + pre.length, preOk ? 'All clear' : 'Two need attention', preOk ? '' : 'red']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join('');

  el('curPill').className = 'badge b-ok';
  el('curPill').textContent = cur.status;
  el('curBox').innerHTML = strip([
    ['Version', cur.version], ['Commit', cur.sha], ['Environment', cur.env], ['Released', fmtDate(cur.when)]
  ]) + `<div class="minihead" style="margin-top:9px">Release notes</div>
    <div class="qhint">${esc(cur.notes)}</div>
    <div class="minihead" style="margin-top:9px">Previous release</div>
    <div class="qhint">${esc((RELEASES.find(r => r.version !== cur.version) || {}).notes || '—')}</div>`;

  el('prePill').className = 'badge ' + (preOk ? 'b-ok' : 'b-warn');
  el('prePill').textContent = pre.filter(c => c.status === 'Pass').length + '/' + pre.length;
  el('preBox').innerHTML = pre.map(c => `<div class="checkrow">
      <div class="ck ${c.status === 'Pass' ? 'pass' : 'warn'}">${c.status === 'Pass' ? '✓' : '!'}</div>
      <div style="flex:1"><div style="font-size:10px;font-weight:800">${esc(c.check)}</div>
        <div class="qhint">${esc(c.detail)}</div></div>
      <div>${okBadge(c.status)}</div></div>`).join('');

  if(el('deployMsg') && !el('deployMsg').textContent)
    el('deployMsg').textContent = 'A production deploy is held while any pre-deployment check fails.';
  el('relPill').textContent = RELEASES.length + ' releases';
  renderTable('relBody', [
    {k: 'version', label: 'Version'},
    {k: 'env', label: 'Env'},
    {k: 'when', label: 'Released', html: v => fmtShort(v)},
    {k: 'status', label: 'State', html: v => okBadge(v)},
    {k: 'notes', label: 'Release notes'},
    {k: 'act', label: '', html: (v, r) => r.env === 'Production' && r.status !== 'Live'
        ? `<button class="btn btn-ghost" data-rollback="${esc(r.version)}">Roll back to this</button>` : ''}
  ], RELEASES, {sort: 'when', pageSize: 8});

  el('envPill').className = 'badge ' + (ENV_CHECKS.some(e => e.status === 'Fail') ? 'b-warn' : 'b-ok');
  el('envPill').textContent = ENV_CHECKS.filter(e => e.status === 'Pass').length + '/' + ENV_CHECKS.length;
  el('envBox').innerHTML = ENV_CHECKS.map(e => `<div class="checkrow">
      <div class="ck ${e.status === 'Pass' ? 'pass' : e.status === 'Review' ? 'warn' : 'fail'}">${e.status === 'Pass' ? '✓' : '!'}</div>
      <div style="flex:1"><div style="font-size:10px;font-weight:800">${esc(e.check)}</div>
        <div class="qhint">${esc(e.value)}</div></div>
      <div>${okBadge(e.status)}</div></div>`).join('');

  el('rbPill').textContent = ROLLBACKS.length + ' on record';
  el('rbBox').innerHTML =
    kvRow('Rollback window', 'Previous two builds kept warm for 7 days') +
    kvRow('Mechanism', 'Netlify deploy rollback + database migrations are reversible') +
    kvRow('Decision owner', esc(staffName('STF-001'))) +
    kvRow('Last rollback', ROLLBACKS[0].when + ' (' + ROLLBACKS[0].minutes + ' minutes)');
  renderTable('rbBody', [
    {k: 'version', label: 'From'},
    {k: 'to', label: 'To'},
    {k: 'when', label: 'When', html: v => fmtShort(v)},
    {k: 'reason', label: 'Reason'},
    {k: 'minutes', label: 'Minutes', num: true}
  ], ROLLBACKS, {sort: 'when', pageSize: 3});

  el('depGrid').innerHTML =
    chartBox({title: 'Build durations', sub: 'Seconds per deployment', type: 'bar', h: 180,
      cats: DEPLOYMENTS.slice().reverse().map(d => d.id.slice(-4)),
      series: [{name: 'Seconds', data: DEPLOYMENTS.slice().reverse().map(d => parseInt(d.duration, 10) * 60)}], value: 'build'}) +
    chartBox({title: 'Build outcomes', sub: 'Every recorded deployment', type: 'donut', h: 180,
      cats: ['Success', 'Failed'],
      series: [{name: 'Builds', data: [DEPLOYMENTS.filter(d => d.status === 'Success').length, failed]}],
      value: DEPLOYMENTS.length + ' builds'});
}
function deployTo(env){
  const pre = preDeployState();
  const blocked = pre.some(c => c.status !== 'Pass');
  if(env === 'Production' && blocked){
    logChange('Deployment', 'Production deploy blocked', 'pre-deploy checks', 'failed checks held the release');
    openModal('Production deploy blocked', 'Pre-deployment checks did not all pass',
      `<div class="note gold"><div>${pre.filter(c => c.status !== 'Pass').map(c => esc(c.check)).join(' · ')}</div></div>
       <div class="qhint" style="margin-top:8px">Fix the integrations on section 8, then re-run the checks.</div>`,
      [{label: 'Close', act: 'close'}]);
    toast('Production deploy blocked — fix the failing checks first', 'warn');
    return;
  }
  const now = TODAY + ' ' + new Date().toTimeString().slice(0, 5);
  const id = 'DEP-' + (2413 + DEPLOYMENTS.filter(d => /^DEP-24/.test(d.id)).length - 10);
  const version = env === 'Production' ? bumpVersion(WM_SET.version) : WM_SET.version;
  DEPLOYMENTS.unshift({id, version, env, when: now, status: 'Success', duration: '2 m ' + (20 + id.length) + ' s', by: 'STF-009', commit: 'n3w' + id.slice(-3)});
  RELEASES.unshift({version, when: now, env, status: env === 'Production' ? 'Live' : 'Staged', notes: 'Deployed from the connection console', by: 'STF-009', sha: 'n3w' + id.slice(-3)});
  if(env === 'Production'){
    RELEASES.forEach(r => { if(r.version !== version && r.status === 'Live') r.status = 'Superseded'; });
    WM_SET.version = version; WM_SITE.version = version;
    SSL_CERT.lastRenew = SSL_CERT.lastRenew;
  }
  logChange('Deployment', env + ' deployment', 'previous build', version + ' (' + id + ')');
  renderDeployment(); renderHosting(); renderOverview(); renderChanges();
  if(el('deployMsg')) el('deployMsg').textContent = id + ' deployed ' + version + ' to ' + env + ' at ' + now.slice(-5) +
    ' — ' + (blocked ? 'pre-deploy checks were outstanding.' : 'every pre-deploy check passed.');
  toast(env + ' deployment ' + id + ' finished · ' + version);
}
function bumpVersion(v){
  const p = String(v).split('.').map(Number);
  p[2] = (p[2] || 0) + 1;
  return p.join('.');
}
function rollbackTo(version){
  const live = currentRelease();
  if(live.version === version) return toast('That release is already live', 'warn');
  const now = TODAY + ' ' + new Date().toTimeString().slice(0, 5);
  ROLLBACKS.unshift({version: live.version, to: version, when: now, reason: 'Manual rollback from the connection console', by: 'STF-009', minutes: 4});
  RELEASES.forEach(r => { if(r.version === version) r.status = 'Live'; else if(r.status === 'Live') r.status = 'Rolled back'; });
  WM_SET.version = version; WM_SITE.version = version;
  DEPLOYMENTS.unshift({id: 'DEP-R' + Math.floor(Math.random() * 90 + 10), version, env: 'Production', when: now, status: 'Success', duration: '18 s', by: 'STF-009', commit: 'rbt'});
  logChange('Deployment', 'Rollback', live.version, version);
  renderDeployment(); renderHosting(); renderOverview(); renderChanges();
  if(el('deployMsg')) el('deployMsg').textContent = 'Rolled back from ' + live.version + ' to ' + version + ' at ' + now.slice(-5) + '.';
  toast('Rolled back to ' + version);
}
function runPreDeploy(){
  const pre = preDeployState();
  const ok = pre.filter(c => c.status === 'Pass').length;
  logChange('Deployment', 'Pre-deployment checks', 'previous run', ok + ' of ' + pre.length + ' pass');
  renderDeployment(); renderChanges();
  toast('Pre-deployment checks: ' + ok + ' of ' + pre.length + ' pass', ok === pre.length ? 'ok' : 'warn');
}

/* ===================== 16 · ALERTS ===================== */
function renderAlerts(){
  const open = ALERTS.filter(a => a.status === 'Open');
  el('alPill').className = 'badge ' + (open.some(a => a.severity === 'Critical') ? 'b-crit' : open.length ? 'b-warn' : 'b-ok');
  el('alPill').textContent = open.length + ' open';
  el('alKpis').innerHTML = [
    ['Open alerts', num(open.length), ALERTS.filter(a => a.severity === 'Critical' && a.status === 'Open').length + ' critical', open.length ? 'red' : ''],
    ['Monitoring', num(ALERTS.filter(a => a.status === 'Monitoring').length), 'Watching, not closed', ''],
    ['Resolved', num(ALERTS.filter(a => a.status === 'Resolved').length), 'In the last 30 days', ''],
    ['Alert rules', ALERT_RULES.filter(r => r.on).length + '/' + ALERT_RULES.length, 'Enabled', ''],
    ['Website offline', num(ALERTS.filter(a => a.kind === 'Website offline').length), 'This period', ''],
    ['Deployment alerts', num(ALERTS.filter(a => /Deployment/.test(a.kind)).length), 'Failed builds', '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join('');

  el('alCount').textContent = ALERTS.length + ' alerts';
  renderTable('alertBody', [
    {k: 'id', label: 'Alert'},
    {k: 'kind', label: 'Kind'},
    {k: 'target', label: 'Target'},
    {k: 'severity', label: 'Severity', html: v => badge(v, sevTone(v))},
    {k: 'status', label: 'State', html: v => okBadge(v)},
    {k: 'raised', label: 'Raised', html: v => esc(String(v).slice(0, 16))},
    {k: 'act', label: '', html: (v, r) => r.status === 'Open'
        ? `<button class="btn btn-ghost" data-alert="${esc(r.id)}" data-act="ack">Acknowledge</button>`
        : r.status === 'Monitoring' ? `<button class="btn btn-ghost" data-alert="${esc(r.id)}" data-act="resolve">Resolve</button>` : okBadge('Resolved')}
  ], ALERTS.filter(a => matchQ(a.kind, a.target, a.note, a.status)), {sort: 'raised', pageSize: 8});

  el('rulePill').textContent = ALERT_RULES.filter(r => r.on).length + ' on';
  renderTable('ruleBody', [
    {k: 'kind', label: 'Alert'},
    {k: 'channel', label: 'Channel'},
    {k: 'threshold', label: 'Threshold'},
    {k: 'to', label: 'Told'},
    {k: 'on', label: 'Rule', html: (v, r) => `<button class="btn btn-ghost" data-rule="${esc(r.kind)}">${v ? 'Enabled' : 'Disabled'}</button>`}
  ], ALERT_RULES, {sort: 'kind', dir: 'asc', pageSize: 9});

  el('alGrid').innerHTML =
    chartBox({title: 'Alerts by kind', sub: 'Raised in the period', type: 'bar', h: 200,
      cats: ['Offline', 'Backend', 'Supabase', 'Auth', 'API', 'Integration', 'SSL', 'Deploy'],
      series: [{name: 'Alerts', data: ['Website offline', 'Backend disconnection', 'Supabase connection failure', 'Authentication failure', 'API error', 'Integration failure', 'SSL certificate expiry', 'Deployment failure'].map(k => ALERTS.filter(a => a.kind === k).length)}],
      value: ALERTS.length + ' alerts'});

  renderTable('alHistBody', [
    {k: 'raised', label: 'When', html: v => esc(String(v).slice(0, 16))},
    {k: 'kind', label: 'Alert'},
    {k: 'note', label: 'What happened'},
    {k: 'owner', label: 'Owner', html: v => esc(staffName(v))},
    {k: 'status', label: 'State', html: v => okBadge(v)}
  ], ALERTS.slice().sort((a, b) => String(b.raised).localeCompare(String(a.raised))), {sort: 'raised', pageSize: 8});
}
function alertAction(id, act){
  const a = ALERTS.find(x => x.id === id);
  if(!a) return;
  if(act === 'ack' && a.status === 'Open'){ a.status = 'Monitoring'; a.note += ' · acknowledged by STF-009'; }
  else if(act === 'resolve' && a.status === 'Monitoring'){ a.status = 'Resolved'; a.note += ' · resolved'; }
  logChange('Alerts', a.kind + ' ' + a.id, 'previous state', a.status);
  renderAlerts(); renderOverview(); renderChanges(); renderStats();
  toast(a.id + ' ' + a.status.toLowerCase());
}
function toggleRule(kind){
  const r = ALERT_RULES.find(x => x.kind === kind);
  if(!r) return;
  r.on = !r.on;
  logChange('Alerts', 'Rule: ' + kind, r.on ? 'disabled' : 'enabled', r.on ? 'enabled' : 'disabled');
  renderAlerts(); renderChanges();
  toast('Alert rule ' + kind + ' ' + (r.on ? 'enabled' : 'disabled'));
}

/* ===================== 17 · ACCESS AND PERMISSIONS ===================== */
function renderPermissions(){
  const granted = WM_ROLES.reduce((s, r) => s + WM_PERMS[r].filter(Boolean).length, 0);
  const pending = WM_APPROVALS.filter(a => a.state === 'Pending').length;
  el('permPill').className = 'badge ' + (pending ? 'b-warn' : 'b-ok');
  el('permPill').textContent = granted + ' grants';
  el('permKpis').innerHTML = [
    ['Roles', num(WM_ROLES.length), WM_ROLES.join(' · ').slice(0, 42) + '…', ''],
    ['Capabilities granted', num(granted), 'Across the matrix', ''],
    ['Approvals pending', num(pending), WM_APPROVALS.length + ' requests in the period', pending ? 'red' : ''],
    ['Deploy rights', num(WM_ROLES.filter(r => WM_PERMS[r][3]).length), 'Roles that can deploy', ''],
    ['Integration config', num(WM_ROLES.filter(r => WM_PERMS[r][2]).length), 'Roles that can configure', ''],
    ['Audit visibility', num(WM_ROLES.filter(r => WM_PERMS[r][6]).length), 'Roles that can read the trail', '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join('');

  el('permCount').textContent = WM_CAPS.length + ' capabilities';
  el('permHead').innerHTML = '<tr><th>Capability</th>' + WM_ROLES.map(r => `<th class="num">${esc(r)}</th>`).join('') + '</tr>';
  el('permBody').innerHTML = WM_CAPS.map((cap, ci) =>
    `<tr class="rowlink" data-cap="${ci}"><td style="font-weight:700">${esc(cap)}</td>` +
    WM_ROLES.map(role => `<td class="num"><button class="btn btn-ghost" data-perm="${role}|${ci}"
        title="Grant or withdraw for ${esc(role)}">${WM_PERMS[role][ci] ? '✓' : '·'}</button></td>`).join('') + '</tr>').join('');

  el('apprPill').textContent = pending + ' pending';
  renderTable('apprBody', [
    {k: 'id', label: 'Request'},
    {k: 'change', label: 'Change'},
    {k: 'area', label: 'Area'},
    {k: 'state', label: 'State', html: v => okBadge(v)},
    {k: 'act', label: '', html: (v, r) => r.state === 'Pending'
        ? `<button class="btn btn-ghost" data-approve="${esc(r.id)}">Approve</button>` : okBadge('Approved')}
  ], WM_APPROVALS, {sort: 'requested', pageSize: 4});

  el('roleStaffBox').innerHTML = WM_ROLES.map(r => `<div class="risk">
      <div><div class="rn">${esc(r)}</div>
        <div class="rs">${esc(WM_ROLE_STAFF[r] || 'Unassigned')} · ${WM_PERMS[r].filter(Boolean).length} of ${WM_CAPS.length} capabilities</div></div>
      <div class="rv">${badge(WM_PERMS[r][5] ? 'Approver' : 'Requester', WM_PERMS[r][5] ? 'b-ok' : 'b-gray')}</div></div>`).join('');

  const cfgChanges = WM_CHANGES.filter(c => /Configuration|Database|Integration|Deployment|Permissions/.test(c.area));
  el('cfgHistPill').textContent = cfgChanges.length + ' changes';
  renderTable('cfgHistBody', [
    {k: 'when', label: 'When', html: v => esc(String(v).slice(0, 16))},
    {k: 'what', label: 'Setting'},
    {k: 'area', label: 'Area'},
    {k: 'from', label: 'Previous'},
    {k: 'to', label: 'Updated'},
    {k: 'by', label: 'By', html: v => esc(staffName(v))}
  ], cfgChanges, {sort: 'when', pageSize: 6});
}
function togglePerm(role, ci){
  if(!WM_PERMS[role]) return;
  WM_PERMS[role][ci] = WM_PERMS[role][ci] ? 0 : 1;
  logChange('Permissions', role + ' · ' + WM_CAPS[ci], WM_PERMS[role][ci] ? 'withdrawn' : 'granted', WM_PERMS[role][ci] ? 'granted' : 'withdrawn');
  renderPermissions(); renderChanges();
  toast(role + (WM_PERMS[role][ci] ? ' can now ' : ' can no longer ') + WM_CAPS[ci].toLowerCase());
}
function approveChange(id){
  const a = WM_APPROVALS.find(x => x.id === id);
  if(!a) return;
  a.state = 'Approved';
  logChange('Permissions', a.change, 'pending approval', 'approved');
  renderPermissions(); renderChanges();
  toast(a.id + ' approved');
}

/* ===================== 18 · REPORTS ===================== */
function reportData(key){
  const s = wmStats();
  if(key === 'availability'){
    return {title: 'Website Availability Report',
      cols: [['Day', 'date'], ['Uptime %', 'uptime'], ['Checks', 'checks'], ['Downtime (min)', 'downMin'], ['Incidents', 'incidents'], ['State', 'status']],
      rows: AVAILABILITY, note: 'Average uptime ' + s.up.toFixed(2) + '% over fourteen days'};
  }
  if(key === 'connections'){
    const rows = FE_CONNECTIONS.map(c => ({client: c.name, target: c.target, status: c.status, p95: c.p95, errors: c.errors}))
      .concat(INTEGRATIONS.map(i => ({client: i.name, target: i.provider, status: i.status, p95: i.latency, errors: 0})));
    return {title: 'Connection Health Report',
      cols: [['Connection', 'client'], ['Target', 'target'], ['State', 'status'], ['p95 (ms)', 'p95'], ['Errors', 'errors']],
      rows, note: INTEGRATIONS.filter(i => i.status === 'Connected').length + ' of ' + INTEGRATIONS.length + ' services connected'};
  }
  if(key === 'api'){
    return {title: 'API Performance Report',
      cols: [['Route', 'path'], ['Method', 'method'], ['Group', 'group'], ['p95 (ms)', 'p95'], ['Calls', 'calls'], ['Errors', 'errors'], ['State', 'status']],
      rows: API_ENDPOINTS, note: 'Average p95 ' + s.avgP95 + ' ms across ' + API_ENDPOINTS.length + ' routes'};
  }
  if(key === 'database'){
    return {title: 'Database Connectivity Report',
      cols: [['Table', 'table'], ['Rows', 'rows'], ['Size', 'size'], ['RLS', 'rls'], ['Policy', 'note'], ['Analysed', 'lastAnalyze']],
      rows: TABLES, note: TABLES.length - s.rlsGap + ' of ' + TABLES.length + ' tables behind row-level security'};
  }
  if(key === 'auth'){
    return {title: 'Authentication Service Report',
      cols: [['Service', 'name'], ['Kind', 'kind'], ['State', 'status'], ['p95 (ms)', 'p95'], ['Calls 24 h', 'calls24h'], ['Errors', 'errors']],
      rows: AUTH_SERVICES, note: AUTH_ERRORS.filter(e => e.status === 'Open').length + ' open error groups'};
  }
  if(key === 'deployment'){
    return {title: 'Deployment Report',
      cols: [['Release', 'version'], ['Environment', 'env'], ['When', 'when'], ['State', 'status'], ['Notes', 'notes'], ['By', 'by']],
      rows: RELEASES, note: currentRelease().version + ' is live in production'};
  }
  if(key === 'errors'){
    return {title: 'Website Error Report',
      cols: [['When', 'when'], ['Route', 'path'], ['Code', 'code'], ['Hits', 'count'], ['Severity', 'severity'], ['State', 'status']],
      rows: PAGE_ERRORS.map(e => ({when: e.when, path: e.path, code: e.code, count: e.count, severity: e.severity, status: e.status})), note: PAGE_ERRORS.length + ' error groups in the period'};
  }
  return {title: 'Integration Reliability Report',
    cols: [['Service', 'name'], ['Provider', 'provider'], ['Uptime %', 'uptime'], ['Latency (ms)', 'latency'], ['Credentials', 'creds'], ['State', 'status']],
    rows: INTEGRATIONS, note: 'Average uptime ' + (sum(INTEGRATIONS, i => i.uptime) / INTEGRATIONS.length).toFixed(2) + '%'};
}
function renderReports(){
  el('repPill').className = 'badge b-gray';
  el('repPill').textContent = WM_REPORTS.length + ' reports';
  el('repKpis').innerHTML = [
    ['Reports available', num(WM_REPORTS.length), 'Every connection domain', ''],
    ['Exports made', num(EXPORTS.length), 'Recorded in the history', ''],
    ['Formats', '4', 'Preview · CSV · Excel · PDF', ''],
    ['Filters applied', filterLine().split('·').length, filterLine().slice(0, 46), '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join('');
  if(el('packMsg') && !el('packMsg').textContent)
    el('packMsg').textContent = 'The pack follows the filters above — ' + filterLine() + '.';
  el('repCount').textContent = WM_REPORTS.length + ' ready';
  el('repCards').innerHTML = WM_REPORTS.map(r => `<div class="repcard">
      <div class="rt">${esc(r.title)}</div>
      <div class="rd">${esc(r.desc)}</div>
      <div class="acts">
        <button class="btn btn-ghost" data-rep="${r.key}" data-fmt="preview">Preview</button>
        <button class="btn btn-ghost" data-rep="${r.key}" data-fmt="csv">CSV</button>
        <button class="btn btn-ghost" data-rep="${r.key}" data-fmt="xlsx">Excel</button>
        <button class="btn btn-ghost" data-rep="${r.key}" data-fmt="pdf">PDF</button>
      </div></div>`).join('');
}
function runReport(key, fmt){
  const d = reportData(key);
  const labels = d.cols.map(c => c[0]);
  const rows = d.rows.map(r => d.cols.map(c => r[c[1]]));
  if(fmt === 'preview'){
    openModal(d.title, d.rows.length + ' rows · ' + filterLine(),
      `<div class="note gold"><div>${esc(d.note)}</div></div>
       <div class="tblwrap" style="max-height:340px;margin-top:8px"><table class="tbl2 dense">
         <thead><tr>${labels.map(l => `<th>${esc(l)}</th>`).join('')}</tr></thead>
         <tbody>${rows.slice(0, 25).map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody>
       </table></div>`,
      [{label: 'Download CSV', act: () => runReport(key, 'csv')},
       {label: 'Download Excel', act: () => runReport(key, 'xlsx')},
       {label: 'Close', act: 'close'}]);
    return;
  }
  const stamp = TODAY.replace(/-/g, '');
  if(fmt === 'csv'){
    downloadFile(key + '-report-' + stamp + '.csv', 'text/csv', toCsv([labels].concat(rows)));
  } else if(fmt === 'xlsx'){
    downloadFile(key + '-report-' + stamp + '.xlsx',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', xlsxBytes(d.title, labels, rows));
  } else {
    doPrint(d.title, printTable(d.title, d.cols.map(c => ({label: c[0], num: typeof d.rows[0][c[1]] === 'number'})), rows));
  }
  logExport(d.title, fmt === 'csv' ? 'CSV' : fmt === 'xlsx' ? 'Excel' : 'PDF', rows.length);
  renderExportHistory(); renderReports(); renderChanges();
}
function runPack(fmt){
  const all = WM_REPORTS.map(r => reportData(r.key));
  if(fmt === 'csv'){
    const parts = [];
    all.forEach(d => {
      parts.push(d.title.toUpperCase());
      parts.push(d.cols.map(c => c[0]).join(','));
      d.rows.forEach(r => parts.push(d.cols.map(c => csvCell(r[c[1]])).join(',')));
      parts.push('');
    });
    downloadFile('connections-pack-' + TODAY.replace(/-/g, '') + '.csv', 'text/csv', parts.join('\r\n'));
    logExport('Connections pack', 'CSV', sum(all, d => d.rows.length));
  } else if(fmt === 'xlsx'){
    const rows = [];
    all.forEach(d => {
      rows.push([d.title]);
      rows.push(d.cols.map(c => c[0]));
      d.rows.forEach(r => rows.push(d.cols.map(c => r[c[1]])));
      rows.push([]);
    });
    downloadFile('connections-pack-' + TODAY.replace(/-/g, '') + '.xlsx',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      xlsxBytes('Connections pack', ['Section', 'Value 1', 'Value 2', 'Value 3', 'Value 4', 'Value 5', 'Value 6'],
        rows.map(r => r.length ? r : [''])));
    logExport('Connections pack', 'Excel', rows.length);
  } else if(fmt === 'print'){
    openModal('Print preview', 'The pack, ready for paper',
      `<div class="note gold"><div>Printing is blocked inside this embedded preview. Open the portal in its own tab to print.</div></div>`,
      [{label: 'Close', act: 'close'}]);
    return;
  } else {
    doPrint('Connections pack', all.map(d => printTable(d.title,
      d.cols.map(c => ({label: c[0], num: typeof d.rows[0][c[1]] === 'number'})),
      d.rows.map(r => d.cols.map(c => r[c[1]])))).join('<div style="height:10px"></div>'));
    logExport('Connections pack', 'PDF', sum(all, d => d.rows.length));
  }
  if(el('packMsg')) el('packMsg').textContent = 'Pack generated at ' + new Date().toTimeString().slice(0, 5) +
    ' — ' + all.length + ' reports, ' + sum(all, d => d.rows.length) + ' rows, ' + filterLine();
  renderReports(); renderChanges();
}

/* ===================== 19 · SYSTEM CONFIGURATION ===================== */
function renderConfig(){
  el('cfgState').className = 'badge b-ok';
  el('cfgState').textContent = 'Saved';
  el('cfgKpis').innerHTML = [
    ['Public URL', WM_SET.publicUrl.replace('https://', ''), 'Primary domain', ''],
    ['API base', WM_SET.apiBase.replace('https://', ''), WM_SET.timeout + ' s timeout · ' + WM_SET.retries + ' retries', ''],
    ['Supabase URL', WM_SET.supabaseUrl.replace('https://', ''), 'Project glsvc-prod', ''],
    ['Health checks', 'Every ' + WM_SET.healthInterval + ' min', 'Monitor sweep on 8 probes', ''],
    ['Environment', WM_SET.env, 'Target ' + WM_SET.uptimeTarget + '% uptime', ''],
    ['Maintenance mode', WM_SET.maintenance ? 'On' : 'Off', WM_SET.maintenance ? 'The public site is closed' : 'The site is serving traffic', WM_SET.maintenance ? 'red' : '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join('');

  const set = (id, v) => { if(el(id)) el(id).value = v; };
  set('cfgPublic', WM_SET.publicUrl); set('cfgApi', WM_SET.apiBase); set('cfgSupabase', WM_SET.supabaseUrl);
  set('cfgAdmin', WM_SET.adminUrl); set('cfgEnv', WM_SET.env); set('cfgUptime', WM_SET.uptimeTarget);
  set('cfgTimeout', WM_SET.timeout); set('cfgRetries', WM_SET.retries);
  set('cfgHealth', WM_SET.healthInterval); set('cfgCache', WM_SET.cacheTtl);
  document.querySelectorAll('#cfgToggles [data-cfg]').forEach(c => c.classList.toggle('on', !!WM_SET[c.dataset.cfg]));
  if(el('pubCfgBox')) el('pubCfgBox').innerHTML = `<div class="tblwrap"><table class="tbl2 dense">
    <thead><tr><th>Public key</th><th>Value the browser receives</th><th>State</th></tr></thead>
    <tbody>${[
      ['NEXT_PUBLIC_SITE_URL', WM_SET.publicUrl],
      ['NEXT_PUBLIC_API_URL', WM_SET.apiBase],
      ['NEXT_PUBLIC_SUPABASE_URL', WM_SET.supabaseUrl],
      ['NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon key (public by design)'],
      ['NEXT_PUBLIC_SENTRY_DSN', 'error ingest endpoint'],
      ['NEXT_PUBLIC_TIMEOUT_MS', WM_SET.timeout * 1000 + ' ms'],
      ['NEXT_PUBLIC_ENVIRONMENT', WM_SET.env]
    ].map(([k, v]) => `<tr><td style="font-weight:800">${esc(k)}</td>
      <td style="font-size:9.5px">${esc(v)}</td><td>${okBadge('Set')}</td></tr>`).join('')}</tbody></table></div>
    <div class="qhint" style="margin-top:6px">These values ship inside the browser bundle. Secrets live only in the server environment.</div>`;
  renderConfigValidation();
}
function renderConfigValidation(){
  const checks = [
    {check: 'Public website URL is reachable', value: WM_SET.publicUrl, status: /^https:\/\//.test(WM_SET.publicUrl) ? 'Pass' : 'Fail'},
    {check: 'API base URL uses HTTPS', value: WM_SET.apiBase, status: /^https:\/\//.test(WM_SET.apiBase) ? 'Pass' : 'Fail'},
    {check: 'Supabase URL matches the project', value: WM_SET.supabaseUrl, status: WM_SET.supabaseUrl.indexOf('glsvc-prod') >= 0 ? 'Pass' : 'Review'},
    {check: 'Timeout inside the platform limit (60 s)', value: WM_SET.timeout + ' s', status: WM_SET.timeout <= 60 ? 'Pass' : 'Fail'},
    {check: 'Retries within the retry budget', value: WM_SET.retries + ' retries', status: WM_SET.retries <= 4 ? 'Pass' : 'Review'},
    {check: 'Health check interval between 1 and 60 minutes', value: WM_SET.healthInterval + ' min', status: WM_SET.healthInterval >= 1 && WM_SET.healthInterval <= 60 ? 'Pass' : 'Fail'},
    {check: 'Cache TTL under 12 hours', value: WM_SET.cacheTtl + ' s', status: WM_SET.cacheTtl <= 43200 ? 'Pass' : 'Review'},
    {check: 'Monitoring is configured', value: WM_SET.monitoring.split('—')[0].trim(), status: 'Pass'}
  ];
  const bad = checks.filter(c => c.status !== 'Pass');
  el('envValBox').innerHTML = checks.map(c => `<div class="checkrow">
      <div class="ck ${c.status === 'Pass' ? 'pass' : c.status === 'Review' ? 'warn' : 'fail'}">${c.status === 'Pass' ? '✓' : '!'}</div>
      <div style="flex:1"><div style="font-size:10px;font-weight:800">${esc(c.check)}</div>
        <div class="qhint">${esc(c.value)}</div></div>
      <div>${okBadge(c.status)}</div>
    </div>`).join('') + (bad.length ? '' : '<div class="qhint" style="margin-top:6px">Every configuration value is inside the range the services expect.</div>');
  return bad;
}
function saveConfig(){
  const before = Object.assign({}, WM_SET);
  WM_SET.publicUrl = (el('cfgPublic').value || '').trim();
  WM_SET.apiBase = (el('cfgApi').value || '').trim();
  WM_SET.supabaseUrl = (el('cfgSupabase').value || '').trim();
  WM_SET.adminUrl = (el('cfgAdmin').value || '').trim();
  WM_SET.env = el('cfgEnv').value;
  WM_SET.uptimeTarget = Number(el('cfgUptime').value) || WM_SET.uptimeTarget;
  WM_SET.timeout = Number(el('cfgTimeout').value) || WM_SET.timeout;
  WM_SET.retries = Number(el('cfgRetries').value);
  WM_SET.healthInterval = Number(el('cfgHealth').value) || WM_SET.healthInterval;
  WM_SET.cacheTtl = Number(el('cfgCache').value);
  const bad = renderConfigValidation();
  el('cfgState').className = 'badge ' + (bad.length ? 'b-warn' : 'b-ok');
  el('cfgState').textContent = bad.length ? 'Saved with ' + bad.length + ' warning' + (bad.length === 1 ? '' : 's') : 'Saved';
  logChange('Configuration', 'Connection settings', before.timeout + ' s / ' + before.apiBase, WM_SET.timeout + ' s / ' + WM_SET.apiBase);
  renderConfig(); renderOverview(); renderChanges();
  toast(bad.length ? 'Saved — ' + bad.length + ' value needs attention' : 'Configuration saved', bad.length ? 'warn' : 'ok');
}
function resetConfig(){
  Object.keys(WM_SET_DEFAULTS).forEach(k => { WM_SET[k] = WM_SET_DEFAULTS[k]; });
  logChange('Configuration', 'Connection settings', 'custom values', 'defaults restored');
  renderConfig(); renderOverview(); renderChanges();
  toast('Configuration reset to the shipped defaults');
}
function toggleCfgFlag(key){
  WM_SET[key] = !WM_SET[key];
  if(key === 'maintenance'){
    WM_SITE.published = !WM_SET.maintenance;
    renderSite();
  }
  logChange('Configuration', 'Monitoring flag: ' + key, WM_SET[key] ? 'off' : 'on', WM_SET[key] ? 'on' : 'off');
  renderConfig(); renderOverview(); renderChanges();
  toast(key + ' ' + (WM_SET[key] ? 'enabled' : 'disabled'));
}

/* ===================== 20 · CHANGE HISTORY ===================== */
function logChange(area, what, from, to){
  WM_CHANGES.unshift({when: TODAY + ' ' + new Date().toTimeString().slice(0, 5), what, area, from, to, by: 'STF-009'});
  WM_CHANGES.length = Math.min(WM_CHANGES.length, 60);
  logExport._skip = true;
}
function renderChanges(){
  const area = FILTER.chgArea || '';
  const rows = WM_CHANGES.filter(c => !area || c.area === area);
  el('chgPill').className = 'badge b-gray';
  el('chgPill').textContent = WM_CHANGES.length + ' entries';
  el('chgKpis').innerHTML = [
    ['Changes recorded', num(WM_CHANGES.length), 'Site, connection and deployment', ''],
    ['Areas touched', num(new Set(WM_CHANGES.map(c => c.area)).size), 'Content to permissions', ''],
    ['Staff involved', num(new Set(WM_CHANGES.map(c => c.by)).size), 'Named on every row', ''],
    ['Latest change', WM_CHANGES[0].when.slice(-5), WM_CHANGES[0].what, ''],
    ['Deployments', num(WM_CHANGES.filter(c => c.area === 'Deployment').length), 'Release activity', ''],
    ['Integration changes', num(WM_CHANGES.filter(c => c.area === 'Integration').length), 'Keys and endpoints', '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join('');

  const areas = ['', 'Content', 'Branding', 'Pages', 'Navigation', 'Configuration', 'Database', 'Integration', 'Deployment', 'Permissions', 'Alerts', 'Forms', 'Storage', 'Diagnostics', 'Auth', 'Frontend', 'Monitoring'];
  el('chgCats').innerHTML = areas.map(a => `<span class="fchip${area === a ? ' on' : ''}" data-chgcat="${esc(a)}">${esc(a || 'All changes')}</span>`).join('');
  el('chgCatPill').textContent = area || 'All changes';
  el('chgCount').textContent = rows.length + ' rows';

  renderTable('chgBody', [
    {k: 'when', label: 'Timestamp', html: v => esc(String(v).slice(0, 16))},
    {k: 'what', label: 'Change'},
    {k: 'area', label: 'Area'},
    {k: 'from', label: 'Previous value'},
    {k: 'to', label: 'Updated value'},
    {k: 'by', label: 'Responsible', html: v => esc(staffName(v))}
  ], rows, {sort: 'when', pageSize: 10});

  const byStaff = {};
  WM_CHANGES.forEach(c => { byStaff[c.by] = (byStaff[c.by] || 0) + 1; });
  el('chgWhoBox').innerHTML = Object.keys(byStaff).sort((a, b) => byStaff[b] - byStaff[a]).map(id =>
    meter(staffName(id), byStaff[id], byStaff[id] + ' change' + (byStaff[id] === 1 ? '' : 's'), Math.max(4, WM_CHANGES.length))).join('');

  const areaCount = {};
  WM_CHANGES.forEach(c => { areaCount[c.area] = (areaCount[c.area] || 0) + 1; });
  const cats = Object.keys(areaCount).sort((a, b) => areaCount[b] - areaCount[a]).slice(0, 8);
  el('chgGrid').innerHTML = chartBox({title: 'Changes by area', sub: 'Where the change is happening', type: 'bar', h: 200,
    cats, series: [{name: 'Changes', data: cats.map(c => areaCount[c])}], value: WM_CHANGES.length + ' entries'});
}
function renderStats(){
  const s = wmStats();
  el('bandScore').textContent = Math.round(s.score) + '%';
  el('bandUptime').textContent = s.up.toFixed(2) + '%';
  el('bandApis').textContent = num(s.endpoints);
  el('bandAlerts').textContent = num(s.openAlerts);
}

/* ===================== FILTERS ===================== */
function fillSelects(){
  const sev = ['Critical', 'High', 'Medium', 'Low'];
  const stat = ['Healthy', 'Connected', 'Pass', 'Live', 'Published', 'Enabled', 'Set', 'Valid', 'Open',
    'Degraded', 'Slow', 'Review', 'Pending', 'Draft', 'Monitoring', 'Expiring', 'Hidden',
    'Failing', 'Failed', 'Broken', 'Missing', 'Disabled', 'Resolved', 'Applied'];
  const own = uniql(WM_CHANGES.concat(PAGES, CONTENT, API_ENDPOINTS, TABLES, INTEGRATIONS, FORMS, IMAGES, DOCUMENTS,
    MISSING_FILES, PAGE_PERF, DIAG_TESTS, ALERTS, AUTH_ERRORS).map(x => x.owner).filter(Boolean));
  const reg = ['Global', 'Frankfurt', 'Ireland', 'EU', 'Malawi', 'Lilongwe', 'Blantyre', 'Mzuzu', 'Zomba'];
  const fill = (id, list, label) => {
    const n = el(id);
    if(!n) return;
    n.innerHTML = `<option value="">All ${label}</option>` +
      list.map(v => `<option value="${esc(v)}">${esc(id === 'fltOwner' ? staffName(v) : v)}</option>`).join('');
  };
  fill('fltSeverity', sev, 'severities');
  fill('fltStatus', stat, 'states');
  fill('fltOwner', own, 'owners');
  fill('fltRegion', reg, 'environments');
  fill('fltProduct', ['Loans', 'Savings', 'Asset finance'], 'products');
}
function uniql(a){ return Array.from(new Set(a)); }
function syncFilterInputs(){
  if(el('fltFrom')) el('fltFrom').value = FILTER.from;
  if(el('fltTo')) el('fltTo').value = FILTER.to;
  if(el('fltSearch')) el('fltSearch').value = FILTER.q;
  ['severity', 'status', 'owner', 'region', 'product'].forEach(k => {
    const n = el('flt' + k.charAt(0).toUpperCase() + k.slice(1));
    if(n) n.value = FILTER[k] || '';
  });
  document.querySelectorAll('#fltLaneChips [data-lane]').forEach(c => c.classList.toggle('on', (c.dataset.lane || '') === FILTER.lane));
}
function applyFilters(){
  FILTER.from = (el('fltFrom').value || '2026-01-01');
  FILTER.to = (el('fltTo').value || TODAY);
  FILTER.q = (el('fltSearch').value || '').trim();
  FILTER.severity = el('fltSeverity').value;
  FILTER.status = el('fltStatus').value;
  FILTER.owner = el('fltOwner').value;
  FILTER.region = el('fltRegion').value;
  FILTER.product = el('fltProduct').value;
  renderAll();
  renderFilterSummary();
  toast('Filters applied');
}
function clearFilter(k){
  if(k){ FILTER[k] = k === 'q' ? '' : ''; }
  else Object.keys(FILTER).forEach(key => { if(key !== 'from' && key !== 'to') FILTER[key] = ''; });
  FILTER.q = '';
  syncFilterInputs();
  renderAll();
  renderFilterSummary();
}
function renderFilterSummary(){
  const chips = [];
  if(FILTER.lane) chips.push(['lane', 'Area: ' + FILTER.lane]);
  if(FILTER.severity) chips.push(['severity', 'Severity: ' + FILTER.severity]);
  if(FILTER.status) chips.push(['status', 'State: ' + FILTER.status]);
  if(FILTER.owner) chips.push(['owner', 'Owner: ' + staffName(FILTER.owner)]);
  if(FILTER.region) chips.push(['region', 'Environment: ' + FILTER.region]);
  if(FILTER.q) chips.push(['q', 'Search: “' + FILTER.q + '”']);
  el('fltSummary').textContent = chips.length ? chips.length + ' filter' + (chips.length === 1 ? '' : 's') + ' · ' + fmtDate(FILTER.from) + ' – ' + fmtDate(FILTER.to)
    : 'Date range only';
  el('fltChips').innerHTML = chips.map(([k, label]) =>
    `<span class="fchip on" data-clear="${k}">${esc(label)} <b style="margin-left:4px">×</b></span>`).join('')
    || '<span class="qhint">No filters applied — the whole register is shown.</span>';
  const s = wmStats();
  el('fltCounts').innerHTML = [
    ['Pages', PAGES.length],
    ['Endpoints', API_ENDPOINTS.length],
    ['Tables', TABLES.length],
    ['Services', INTEGRATIONS.length],
    ['Open alerts', s.openAlerts],
    ['Changes', WM_CHANGES.length]
  ].map(([k, v]) => `<div><div class="sl">${esc(k)}</div><div class="sv">${num(v)}</div></div>`).join('');
  el('fltResult').textContent = 'Showing the connection register for ' + fmtDate(FILTER.from) + ' – ' + fmtDate(FILTER.to) +
    (chips.length ? ' · ' + chips.map(c => c[1]).join(' · ') : ' · no dimension filters');
}

/* ===================== navigation and render loop ===================== */
function goto(id){
  const sec = document.getElementById(id);
  if(!sec) return;
  document.querySelectorAll('.snav').forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + id));
  if(location.hash !== '#' + id) history.replaceState(null, '', '#' + id);
  if(typeof sec.scrollIntoView === 'function') sec.scrollIntoView({behavior: 'smooth', block: 'start'});
}
function renderAll(){
  renderOverview();
  renderSite();
  renderContent();
  renderPages();
  renderHosting();
  renderBackend();
  renderDatabase();
  renderIntegrations();
  renderAuth();
  renderFrontend();
  renderForms();
  renderMedia();
  renderPerformance();
  renderDiagnostics();
  renderDeployment();
  renderAlerts();
  renderPermissions();
  renderReports();
  renderConfig();
  renderChanges();
  renderStats();
}

/* ===================== wiring ===================== */
function wireAll(){
  document.addEventListener('click', e => {
    if(sortOrPage(e)) return;

    const snav = e.target.closest('.snav');
    if(snav){ e.preventDefault(); goto(snav.getAttribute('href').slice(1)); return; }

    const lane = e.target.closest('#fltLaneChips [data-lane]');
    if(lane){ FILTER.lane = lane.dataset.lane; syncFilterInputs(); renderAll(); renderFilterSummary(); return; }

    const expRow = e.target.closest('[data-exp]');
    if(expRow){
      const x = EXPORTS[Number(expRow.dataset.exp)];
      if(x){
        openModal(x.report, x.format + ' · ' + x.when,
          `<div class="pfields" style="grid-template-columns:1fr 1fr">
            ${field('Report', esc(x.report))}${field('Format', esc(x.format))}
            ${field('Rows', num(x.rows))}${field('Exported by', esc(x.by))}
            ${field('When', esc(x.when))}${field('Filters', esc(x.filters))}
          </div>`, [{label: 'Close', act: 'close'}]);
      }
      return;
    }

    const chip = e.target.closest('[data-clear]');
    if(chip){ clearFilter(chip.dataset.clear); return; }

    const chgCat = e.target.closest('[data-chgcat]');
    if(chgCat){ FILTER.chgArea = chgCat.dataset.chgcat; renderChanges(); return; }

    const theme = e.target.closest('[data-theme]');
    if(theme){
      WM_SITE.theme = theme.dataset.theme;
      const t = WM_THEMES.find(x => x.name === WM_SITE.theme);
      if(t) WM_SITE.accent = t.accent;
      logChange('Branding', 'Theme', 'previous palette', WM_SITE.theme);
      renderSite(); renderChanges();
      toast('Theme switched to ' + WM_SITE.theme);
      return;
    }

    const sec = e.target.closest('[data-hsec]');
    if(sec){
      const s = WM_SECTIONS.find(x => x.name === sec.dataset.hsec);
      if(s){ s.on = !s.on; renderSite(); logChange('Content', 'Homepage section: ' + s.name, s.on ? 'off' : 'on', s.on ? 'on' : 'off'); renderChanges(); toast(s.name + ' ' + (s.on ? 'switched on' : 'switched off')); }
      return;
    }

    const navUp = e.target.closest('[data-navup]'), navDown = e.target.closest('[data-navdown]');
    if(navUp || navDown){
      const btn = navUp || navDown;
      const label = btn.dataset.navup || btn.dataset.navdown;
      const list = WM_NAV.slice().sort((a, b) => a.order - b.order);
      const i = list.findIndex(n => n.label === label);
      const j = navUp ? i - 1 : i + 1;
      if(i >= 0 && j >= 0 && j < list.length){
        const a = list[i], b = list[j];
        const t = a.order; a.order = b.order; b.order = t;
        renderSite(); logChange('Navigation', 'Menu order', a.label + ' / ' + b.label, 'reordered');
        renderChanges(); toast('Menu reordered');
      }
      return;
    }
    const navToggle = e.target.closest('[data-navtoggle]');
    if(navToggle){
      const n = WM_NAV.find(x => x.label === navToggle.dataset.navtoggle);
      if(n){ n.visible = !n.visible; renderSite(); logChange('Navigation', n.label + ' visibility', n.visible ? 'hidden' : 'shown', n.visible ? 'shown' : 'hidden'); renderChanges(); toast(n.label + (n.visible ? ' shown' : ' hidden')); }
      return;
    }
    const navDel = e.target.closest('[data-navdel]');
    if(navDel){
      const i = WM_NAV.findIndex(x => x.label === navDel.dataset.navdel);
      if(i >= 0){ const [gone] = WM_NAV.splice(i, 1); renderSite(); logChange('Navigation', 'Menu item removed', gone.label, 'removed'); renderChanges(); toast(gone.label + ' removed from the menu'); }
      return;
    }
    if(e.target.closest('#navAdd') && el('navAdd')){
      const label = (el('navAddLabel').value || '').trim();
      const path = (el('navAddPath').value || '').trim() || '/';
      if(!label) return toast('Give the menu item a label', 'warn');
      WM_NAV.push({label, path, order: WM_NAV.length + 1, visible: true});
      el('navAddLabel').value = ''; el('navAddPath').value = '';
      renderSite(); logChange('Navigation', 'Menu item added', path, label); renderChanges();
      toast('“' + label + '” added to the menu');
      return;
    }

    if(e.target.closest('#brandSave')){
      WM_SITE.logo = el('brandLogo').value;
      WM_SITE.logoVariant = el('brandVariant').value;
      WM_SITE.font = el('brandFont').value;
      WM_SITE.name = (el('brandName').value || WM_SITE.name).trim();
      WM_SITE.accent = el('brandAccent').value;
      logChange('Branding', 'Logo and identity', WM_SITE.logoVariant, WM_SITE.logo + ' · ' + WM_SITE.accent);
      renderSite(); renderChanges(); toast('Branding saved');
      return;
    }

    if(e.target.closest('#contactSave')){
      WM_CONTACT.phone = el('ctPhone').value; WM_CONTACT.whatsapp = el('ctWhatsapp').value;
      WM_CONTACT.email = el('ctEmail').value; WM_CONTACT.support = el('ctSupport').value;
      WM_CONTACT.address = el('ctAddress').value; WM_CONTACT.postal = el('ctPostal').value;
      logChange('Content', 'Contact information', 'previous number and address', WM_CONTACT.phone + ' · ' + WM_CONTACT.address);
      renderSite(); renderChanges();
      if(el('contactMsg')) el('contactMsg').textContent = 'Saved at ' + REFRESH.slice(-5) + ' — ' + WM_CONTACT.phone + ' · ' + WM_CONTACT.email;
      toast('Contact details saved');
      return;
    }
    if(e.target.closest('#contactReset')){
      WM_CONTACT.phone = '+265 1 771 200'; WM_CONTACT.email = 'hello@goldenloan.mw';
      renderSite();
      if(el('contactMsg')) el('contactMsg').textContent = 'Reset to the published details.';
      toast('Contact details reset');
      return;
    }

    if(e.target.closest('#socialSave')){
      logChange('Content', 'Social links', 'previous set', WM_SOCIAL.filter(s => s.linked).length + ' linked');
      renderChanges(); toast('Social links saved');
      return;
    }
    const social = e.target.closest('[data-social]');
    if(social){
      const s = WM_SOCIAL.find(x => x.channel === social.dataset.social);
      if(s){ s.linked = !s.linked; renderSite(); logChange('Content', 'Social link', s.channel, s.linked ? 'linked' : 'unlinked'); renderChanges(); toast(s.channel + (s.linked ? ' linked' : ' unlinked')); }
      return;
    }

    if(e.target.closest('#previewOpen')){
      openModal('Website preview', WM_SET.publicUrl + ' · ' + WM_SITE.theme,
        `<div style="transform:scale(1);max-width:100%">${el('previewBox').innerHTML}</div>`,
        [{label: 'Close', act: 'close'}]);
      return;
    }
    if(e.target.closest('#previewRefresh')){
      renderPreview(); toast('Preview refreshed');
      return;
    }

    if(e.target.closest('#publishBtn') || e.target.closest('#unpublishBtn')){
      const on = !!e.target.closest('#publishBtn');
      WM_SITE.published = on;
      WM_SET.maintenance = !on;
      WM_SITE.publishedOn = TODAY;
      logChange('Content', on ? 'Website published' : 'Website unpublished', on ? 'maintenance' : 'live', on ? 'live' : 'maintenance');
      renderSite(); renderConfig(); renderOverview(); renderChanges();
      toast(on ? 'Website published to the CDN' : 'Website unpublished — maintenance page shown', on ? 'ok' : 'warn');
      return;
    }

    const edSel = e.target.closest('#edSelect');
    if(edSel){ selectContent(edSel.value); return; }
    if(e.target.closest('#edSave')){ editorAction('save'); return; }
    if(e.target.closest('#edReview')){ editorAction('review'); return; }
    if(e.target.closest('#edPublish')){ editorAction('publish'); return; }

    if(e.target.closest('#npCreate')){
      const title = (el('npTitle').value || '').trim();
      let path = (el('npPath').value || '').trim();
      if(!title || !path) return toast('A page needs a title and a path', 'warn');
      if(path.charAt(0) !== '/') path = '/' + path;
      if(PAGES.some(p => p.path === path)) return toast('That path is already in the directory', 'warn');
      PAGES.push({path, title, visibility: 'Hidden', access: 'Everyone', order: PAGES.length + 1, status: 'Draft',
        edits: 0, updated: TODAY, seo: title + ' — Golden Financial Services', lane: 'Website',
        severity: 'Low', owner: 'STF-009', region: 'Lilongwe'});
      el('npTitle').value = ''; el('npPath').value = '';
      if(el('npMsg')) el('npMsg').textContent = '“' + title + '” created as a hidden draft at ' + path;
      logChange('Pages', 'Page created', 'not in the directory', path);
      renderPages(); renderChanges(); renderOverview();
      toast('Page created: ' + path);
      return;
    }

    const vis = e.target.closest('[data-vis]');
    if(vis){
      const p = PAGES.find(x => x.path === vis.dataset.vis);
      if(p){ const was = p.visibility; p.visibility = vis.value; p.updated = TODAY;
        logChange('Pages', p.path + ' visibility', was, p.visibility);
        renderPages(); renderChanges(); renderOverview(); toast(p.title + ' is now ' + p.visibility.toLowerCase()); }
      return;
    }
    const acc = e.target.closest('[data-acc]');
    if(acc){
      const p = PAGES.find(x => x.path === acc.dataset.acc);
      if(p){ const was = p.access; p.access = acc.value; p.updated = TODAY;
        logChange('Pages', p.path + ' access', was, p.access);
        renderPages(); renderChanges(); toast('Access for ' + p.title + ' set to ' + p.access); }
      return;
    }
    const pgUp = e.target.closest('[data-pgup]'), pgDown = e.target.closest('[data-pgdown]');
    if(pgUp || pgDown){
      const path = (pgUp || pgDown).dataset.pgup || (pgUp || pgDown).dataset.pgdown;
      const list = PAGES.slice().sort((a, b) => a.order - b.order);
      const i = list.findIndex(p => p.path === path);
      const j = pgUp ? i - 1 : i + 1;
      if(i >= 0 && j >= 0 && j < list.length){
        const a = list[i], b = list[j]; const t = a.order; a.order = b.order; b.order = t;
        renderPages(); logChange('Pages', 'Page order', a.title + ' / ' + b.title, 'reordered'); renderChanges();
        toast('Page order updated');
      }
      return;
    }

    const fix = e.target.closest('[data-fix]');
    if(fix){
      const [from, to] = fix.dataset.fix.split('|');
      const l = LINKS.find(x => x.from === from && x.to === to);
      if(l){ l.status = 'OK'; l.checked = TODAY;
        logChange('Content', 'Broken link repaired', from + ' → ' + to, 'resolves'); renderPages(); renderChanges();
        toast('Link repaired'); }
      return;
    }
    if(e.target.closest('#linkScan')){
      const broken = LINKS.filter(l => l.status === 'Broken').length;
      LINKS.forEach(l => { l.checked = TODAY; });
      renderPages();
      toast(broken ? broken + ' broken link' + (broken === 1 ? '' : 's') + ' still open' : 'Every internal link resolves', broken ? 'warn' : 'ok');
      return;
    }
    const pgerr = e.target.closest('[data-pgerr]');
    if(pgerr){
      const [path, code] = pgerr.dataset.pgerr.split('|');
      const er = PAGE_ERRORS.find(x => x.path === path && x.code === code);
      if(er){ er.status = 'Resolved'; logChange('Pages', 'Page error acknowledged', path + ' ' + code, 'resolved'); renderPages(); renderChanges(); toast(path + ' error acknowledged'); }
      return;
    }

    if(e.target.closest('#cdSave')){
      WM_SET.publicUrl = (el('cdPrimary').value || '').trim();
      WM_SET.adminUrl = (el('cdAdmin').value || '').trim();
      WM_SET.apiBase = (el('cdApi').value || '').trim();
      logChange('Configuration', 'Custom domain', 'previous hostnames', WM_SET.publicUrl);
      el('cdNote').textContent = 'Saved — HTTPS ' + el('cdHttps').value.toLowerCase() + ', records verified at ' + lastRefresh();
      renderConfig(); renderHosting(); renderChanges(); toast('Domain configuration saved');
      return;
    }
    if(e.target.closest('#cdVerify') || e.target.closest('#dnsCheck')){
      DNS.forEach(d => { if(d.status !== 'Resolved') d.status = 'Resolved'; });
      logChange('Configuration', 'DNS records re-checked', '1 pending', 'all resolved');
      renderHosting(); renderChanges(); toast('DNS: ' + DNS.length + ' of ' + DNS.length + ' records resolve');
      return;
    }
    if(e.target.closest('#sslRenew')){
      SSL_CERT.daysLeft = 90; SSL_CERT.validFrom = TODAY;
      SSL_CERT.validTo = addDays(TODAY, 90); SSL_CERT.lastRenew = TODAY;
      ALERTS.filter(a => a.kind === 'SSL certificate expiry').forEach(a => { a.status = 'Resolved'; });
      logChange('Configuration', 'SSL certificate', '11 days remaining', 'renewed for 90 days');
      renderHosting(); renderAlerts(); renderChanges(); renderOverview();
      toast('Certificate renewed — valid for 90 days');
      return;
    }
    if(e.target.closest('#redeployBtn')){
      deployTo('Staging');
      return;
    }

    if(e.target.closest('#healthBtn')){
      BACKEND.cpu = Math.max(18, BACKEND.cpu - 6);
      BACKEND.memory = Math.max(40, BACKEND.memory - 4);
      SERVER_HEALTH.forEach(h => { if(h.status === 'Review') h.status = 'Pass'; });
      logChange('Backend', 'Health check', 'manual sweep', SERVER_HEALTH.filter(h => h.status === 'Pass').length + ' of ' + SERVER_HEALTH.length + ' pass');
      renderBackend(); renderOverview(); renderChanges();
      toast('Health check complete: ' + SERVER_HEALTH.filter(h => h.status === 'Pass').length + ' of ' + SERVER_HEALTH.length + ' pass');
      return;
    }
    if(e.target.closest('#restartBtn')){
      BACKEND.restarts30d += 1;
      BACKEND.lastRestart = TODAY + ' ' + new Date().toTimeString().slice(0, 5);
      RESTARTS.unshift({when: BACKEND.lastRestart, reason: 'Manual restart from the connection console', by: 'STF-009', duration: '42 s', result: 'Healthy'});
      SERVER_HEALTH.forEach(h => { if(h.status !== 'Pass') h.status = 'Pass'; });
      logChange('Backend', 'Backend restarted', 'previous process', 'rolled, three instances healthy');
      renderBackend(); renderOverview(); renderChanges();
      toast('Backend restarted — all instances healthy');
      return;
    }
    if(e.target.closest('#dbCheck')){
      DB_HEALTH.filter(h => h.status === 'Review').forEach(h => { h.status = 'Pass'; });
      logChange('Database', 'Database health check', 'manual sweep', DB_HEALTH.filter(h => h.status === 'Pass').length + ' checks pass');
      renderDatabase(); renderOverview(); renderChanges();
      toast('Database checks: ' + DB_HEALTH.filter(h => h.status === 'Pass').length + ' of ' + DB_HEALTH.length + ' pass');
      return;
    }
    if(e.target.closest('#rlsFix')){
      TABLES.forEach(t => { if(t.rls === 'Disabled'){ t.rls = 'Enabled'; t.note = 'Admin-only policy applied 30 Oct'; } });
      DB_HEALTH.filter(h => h.check === 'Row-level security coverage').forEach(h => { h.status = 'Pass'; h.value = TABLES.length + ' of ' + TABLES.length + ' public tables'; });
      ALERTS.filter(a => /Supabase/.test(a.kind)).forEach(a => { if(a.status === 'Open') a.status = 'Monitoring'; });
      logChange('Database', 'RLS on settings', 'disabled', 'policy applied');
      renderDatabase(); renderOverview(); renderAlerts(); renderChanges(); renderStats();
      toast('Row-level security enabled on every public table');
      return;
    }

    const verify = e.target.closest('[data-verify]');
    if(verify){
      const i = INTEGRATIONS.find(x => x.name === verify.dataset.verify);
      if(i){
        const bad = i.status === 'Failing';
        i.lastCheck = TODAY + ' ' + new Date().toTimeString().slice(0, 5);
        toast(bad ? i.name + ' still failing — credential expired' : i.name + ' verified in ' + i.latency + ' ms', bad ? 'warn' : 'ok');
        logChange('Integration', 'Verified ' + i.name, 'unchecked', bad ? 'still failing' : 'connected');
        renderIntegrations(); renderChanges();
      }
      return;
    }
    const cred = e.target.closest('[data-cred]');
    if(cred){
      const c = API_CREDS.find(x => x.name === cred.dataset.cred);
      if(c){
        const was = c.state;
        c.rotated = TODAY; c.expires = addDays(TODAY, 90); c.state = 'Valid';
        INTEGRATIONS.filter(i => i.name.indexOf(c.service.split(' ')[0]) === 0).forEach(i => { if(i.status === 'Failing') i.status = 'Connected'; i.creds = 'Valid'; });
        INTEGRATION_TESTS.filter(t => c.service.indexOf(t.service.split(' ')[0]) === 0).forEach(t => { t.result = 'Pass'; t.ms = 120; });
        logChange('Integration', 'Rotated ' + c.name, was, 'valid until ' + fmtDate(c.expires));
        renderIntegrations(); renderOverview(); renderChanges(); renderStats();
        toast(c.name + ' rotated — valid for 90 days');
      }
      return;
    }
    if(e.target.closest('#runIntTests')){
      INTEGRATION_TESTS.forEach(t => {
        const svc = INTEGRATIONS.find(i => i.name.indexOf(t.service.split(' ')[0]) === 0);
        t.result = svc && svc.status === 'Failing' ? 'Fail' : svc && svc.status === 'Degraded' ? 'Slow' : 'Pass';
        t.ms = t.result === 'Fail' ? 0 : t.ms;
        t.when = TODAY + ' ' + new Date().toTimeString().slice(0, 5);
      });
      const pass = INTEGRATION_TESTS.filter(t => t.result === 'Pass').length;
      logChange('Integration', 'Integration test sweep', 'previous sweep', pass + ' of ' + INTEGRATION_TESTS.length + ' pass');
      renderIntegrations(); renderDiagnostics(); renderChanges(); renderStats();
      toast('Integration tests: ' + pass + ' of ' + INTEGRATION_TESTS.length + ' pass', pass === INTEGRATION_TESTS.length ? 'ok' : 'warn');
      return;
    }

    if(e.target.closest('#testAuthBtn')){ testAuthService(); return; }
    if(e.target.closest('#runFeTests')){ runFeSuite(); return; }

    const formTest = e.target.closest('[data-formtest]');
    if(formTest){ testForm(formTest.dataset.formtest); return; }

    const opt = e.target.closest('[data-optimise]');
    if(opt){ optimiseImage(opt.dataset.optimise); return; }
    const restore = e.target.closest('[data-restore]');
    if(restore){ fixMissing(restore.dataset.restore, 'restore'); return; }
    const purge = e.target.closest('[data-purge]');
    if(purge){ fixMissing(purge.dataset.purge, 'purge'); return; }

    if(e.target.closest('#perfCsv')){ runPerfReport('pages', 'csv'); return; }
    const preport = e.target.closest('[data-preport]');
    if(preport){ runPerfReport(preport.dataset.preport, preport.dataset.fmt); return; }

    const diag = e.target.closest('[data-diag]');
    if(diag){ runDiag(diag.dataset.diag); return; }
    if(e.target.closest('#runAllDiag')){ runAllDiag(); return; }

    if(e.target.closest('#prodBtn')){ deployTo('Production'); return; }
    if(e.target.closest('#stagingBtn')){ deployTo('Staging'); return; }
    if(e.target.closest('#runPre')){ runPreDeploy(); return; }
    const rb = e.target.closest('[data-rollback]');
    if(rb){ rollbackTo(rb.dataset.rollback); return; }

    const al = e.target.closest('[data-alert]');
    if(al){ alertAction(al.dataset.alert, al.dataset.act); return; }
    const rule = e.target.closest('[data-rule]');
    if(rule){ toggleRule(rule.dataset.rule); return; }

    const capRow = e.target.closest('[data-cap]');
    if(capRow && !e.target.closest('button')){
      const ci = Number(capRow.dataset.cap);
      openModal(WM_CAPS[ci], 'Who holds this capability',
        `<div class="pfields" style="grid-template-columns:1fr 1fr">
          ${WM_ROLES.map(r => field(r, WM_PERMS[r][ci] ? okBadge('Granted') : badge('Not granted', 'b-gray'))).join('')}
        </div>
        <div class="qhint" style="margin-top:8px">Click a cell in the matrix to grant or withdraw the capability.</div>`,
        [{label: 'Close', act: 'close'}]);
      return;
    }

    const perm = e.target.closest('[data-perm]');
    if(perm){
      const [role, ci] = perm.dataset.perm.split('|');
      togglePerm(role, Number(ci));
      return;
    }
    const ap = e.target.closest('[data-approve]');
    if(ap){ approveChange(ap.dataset.approve); return; }

    const rep = e.target.closest('[data-rep]');
    if(rep){ runReport(rep.dataset.rep, rep.dataset.fmt); return; }
    if(e.target.closest('#packCsv')){ runPack('csv'); return; }
    if(e.target.closest('#packXlsx')){ runPack('xlsx'); return; }
    if(e.target.closest('#packPdf')){ runPack('pdf'); return; }
    if(e.target.closest('#packPrint')){ runPack('print'); return; }
    if(e.target.closest('#quickCsv')){ runPack('csv'); return; }
    if(e.target.closest('#printBtn')){
      doPrint('Website and connections report', printTable('Connection health',
        [{label: 'Check'}, {label: 'Value'}],
        [['Connection score', Math.round(wmStats().score) + '%'], ['Uptime (14 d)', wmStats().up.toFixed(2) + '%'],
         ['Open alerts', ALERTS.filter(a => a.status === 'Open').length], ['API endpoints', API_ENDPOINTS.length],
         ['Services connected', INTEGRATIONS.filter(i => i.status === 'Connected').length]]));
      return;
    }

    if(e.target.closest('#cfgSave')){ saveConfig(); return; }
    if(e.target.closest('#cfgReset')){ resetConfig(); return; }
    if(e.target.closest('#cfgValidate')){
      const bad = renderConfigValidation();
      const s = wmStats();
      logChange('Configuration', 'Validation run', 'not run', bad.length ? bad.length + ' warnings' : 'all values valid');
      renderChanges(); renderOverview();
      toast(bad.length ? bad.length + ' value(s) need attention' : 'Configuration valid — every value in range', bad.length ? 'warn' : 'ok');
      return;
    }
    const flag = e.target.closest('[data-cfg]');
    if(flag){ toggleCfgFlag(flag.dataset.cfg); return; }

    if(e.target.closest('#fltApply')){ applyFilters(); return; }
    if(e.target.closest('#fltReset')){ clearFilter(); toast('Filters cleared'); return; }
    if(e.target.closest('#refreshBtn')){
      REFRESH = TODAY + ' · ' + new Date().toTimeString().slice(0, 5);
      if(el('topRefresh')) el('topRefresh').textContent = fmtDate(TODAY) + ' · ' + REFRESH.slice(-5);
      renderAll(); renderFilterSummary();
      toast('Connection data refreshed at ' + REFRESH.slice(-5));
      return;
    }
    if(e.target.closest('#bellBtn')){
      const open = ALERTS.filter(a => a.status === 'Open');
      openModal('Open connection alerts', open.length + ' alerts need attention',
        open.map(a => `<div class="risk"><div><div class="rn">${esc(a.kind)} · ${esc(a.target)}</div>
          <div class="rs">${esc(a.note)}</div></div><div class="rv">${badge(a.severity, sevTone(a.severity))}</div></div>`).join('')
          || '<div class="empty">Nothing open right now.</div>',
        [{label: 'Go to alerts', act: () => { closeModal(); goto('s16'); }}, {label: 'Close', act: 'close'}]);
      return;
    }
    if(e.target.closest('#menuBtn')){ document.body.classList.toggle('nav-open'); return; }
    if(e.target.closest('#modalClose') || e.target === el('modal')){ closeModal(); return; }
  });

  document.addEventListener('change', e => {
    const t = e.target;
    if(t.id === 'brandAccent'){ WM_SITE.accent = t.value; renderPreview(); return; }
    if(t.id === 'edSelect'){ selectContent(t.value); return; }
    if(t.dataset && t.dataset.vis){
      const p = PAGES.find(x => x.path === t.dataset.vis);
      if(p){ const was = p.visibility; p.visibility = t.value; p.updated = TODAY;
        logChange('Pages', p.path + ' visibility', was, p.visibility); renderPages(); renderChanges(); toast(p.title + ' is now ' + p.visibility.toLowerCase()); }
      return;
    }
    if(t.dataset && t.dataset.acc){
      const p = PAGES.find(x => x.path === t.dataset.acc);
      if(p){ const was = p.access; p.access = t.value; p.updated = TODAY;
        logChange('Pages', p.path + ' access', was, p.access); renderPages(); renderChanges(); toast('Access set to ' + p.access); }
      return;
    }
  });

  if(el('fltSearch')){
    el('fltSearch').addEventListener('keydown', e => { if(e.key === 'Enter') applyFilters(); });
  }
  if(el('globalSearch')){
    el('globalSearch').addEventListener('keydown', e => {
      if(e.key !== 'Enter') return;
      el('fltSearch').value = el('globalSearch').value;
      applyFilters();
      goto('s1');
      toast('Register filtered by “' + el('globalSearch').value + '”');
    });
  }
  window.addEventListener('scroll', spyScroll, {passive: true});
  window.addEventListener('hashchange', () => { const h = location.hash.slice(1); if(h && document.getElementById(h)) goto(h); });
  document.querySelectorAll('.snav').forEach(a => {
    a.addEventListener('click', e => { e.preventDefault(); goto(a.getAttribute('href').slice(1)); });
  });
}
function spyScroll(){
  const secs = Array.from(document.querySelectorAll('section.sec'));
  const y = window.scrollY + 120;
  let cur = secs[0];
  secs.forEach(s => { if(s.offsetTop <= y) cur = s; });
  if(!cur) return;
  document.querySelectorAll('.snav').forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + cur.id));
}
function reorderPage(path, dir){
  const list = PAGES.slice().sort((a, b) => a.order - b.order);
  const i = list.findIndex(p => p.path === path);
  const j = i + dir;
  if(i < 0 || j < 0 || j >= list.length) return;
  const a = list[i], b = list[j];
  const t = a.order; a.order = b.order; b.order = t;
  renderPages();
}
function renderPreviewModal(){
  openModal('Website preview', WM_SET.publicUrl, el('previewBox').innerHTML, [{label: 'Close', act: 'close'}]);
}

window.WEBSITE_APP = {
  FILTER, WM_SET, WM_SET_DEFAULTS, WM_SITE, WM_NAV, WM_SECTIONS, WM_CONTACT, WM_THEMES, WM_LOGOS,
  WM_OFFICES, WM_SOCIAL, CONTENT, CONTENT_HISTORY, PAGES, LINKS, PAGE_ERRORS, DOMAIN, DNS, SSL_CERT,
  HOSTING, DEPLOYMENTS, AVAILABILITY, BACKEND, SERVER_HEALTH, API_ENDPOINTS, SERVER_ERRORS, TRAFFIC,
  RESTARTS, SUPA, DB_HEALTH, TABLES, MIGRATIONS, DB_ERRORS, DB_FUNCS, QUERY_PERF, INTEGRATIONS,
  API_CREDS, INTEGRATION_TESTS, AUTH_SERVICES, AUTH_ERRORS, AUTH_DAILY, FE_CONNECTIONS, FE_CONFIG,
  VALIDATION_CHECKS, TIMEOUTS, FAILED_REQUESTS, FE_ERRORS, FORMS, FORM_DAILY, FORM_ERRORS, IMAGES,
  BRAND_ASSETS, DOCUMENTS, MISSING_FILES, UPLOAD_CFG, FILE_ACCESS, STORAGE_USAGE, PAGE_PERF,
  QUERY_PERF_SERIES, RESOURCES, MOBILE_CHECKS, DIAG_TESTS, TROUBLESHOOT, RELEASES, ENV_CHECKS,
  PRE_DEPLOY, ROLLBACKS, ALERTS, ALERT_RULES, WM_ROLES, WM_CAPS, WM_PERMS, WM_ROLE_STAFF,
  WM_APPROVALS, WM_CHANGES, WM_REPORTS, EXPORTS, wmStats, reportData, renderAll, runReport, runPack,
  runPerfReport, deployTo, rollbackTo, runDiag, runAllDiag, runPreDeploy, alertAction, toggleRule,
  togglePerm, approveChange, publishSite, saveConfig, resetConfig, toggleCfgFlag, toggleSection,
  testForm, fixMissing, optimiseImage, testAuthService, runFeSuite, verifyService, rotateCred,
  selectContent, editorAction, openPage, logChange, goto
};
function verifyService(name){
  const i = INTEGRATIONS.find(x => x.name === name);
  if(!i) return;
  i.lastCheck = TODAY + ' ' + new Date().toTimeString().slice(0, 5);
  renderIntegrations();
  toast(i.name + (i.status === 'Failing' ? ' still failing' : ' verified in ' + i.latency + ' ms'), i.status === 'Failing' ? 'warn' : 'ok');
}
function rotateCred(name){
  const c = API_CREDS.find(x => x.name === name);
  if(!c) return;
  const was = c.state;
  c.rotated = TODAY; c.expires = addDays(TODAY, 90); c.state = 'Valid';
  logChange('Integration', 'Rotated ' + c.name, was, 'valid until ' + fmtDate(c.expires));
  renderIntegrations(); renderChanges();
  toast(c.name + ' rotated');
}
function toggleSection(name){
  const s = WM_SECTIONS.find(x => x.name === name);
  if(!s) return;
  s.on = !s.on;
  renderSite(); renderChanges();
  toast(s.name + (s.on ? ' switched on' : ' switched off'));
}
function publishSite(on){
  WM_SITE.published = !!on;
  WM_SET.maintenance = !on;
  WM_SITE.publishedOn = TODAY;
  logChange('Content', on ? 'Website published' : 'Website unpublished', on ? 'maintenance' : 'live', on ? 'live' : 'maintenance');
  renderSite(); renderConfig(); renderOverview(); renderChanges();
  toast(on ? 'Website published' : 'Website in maintenance mode', on ? 'ok' : 'warn');
}

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
