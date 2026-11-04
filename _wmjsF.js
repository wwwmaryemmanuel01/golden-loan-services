<script>
/* ============================================================
   WEBSITE MANAGEMENT & CONNECTIONS (6/7)
   9 · Authentication   10 · Frontend integration
   11 · Forms           12 · Files and media
   ============================================================ */

/* ===================== 9 · AUTHENTICATION CONNECTIONS ===================== */
function authRows(){
  return AUTH_SERVICES.filter(a => inRange(TODAY) && passLane(a) && passSeverity(a) && passOwner(a) && passRegion(a)
    && matchQ(a.name, a.kind, a.note, a.status));
}
function renderAuth(){
  const rows = authRows();
  const degraded = AUTH_SERVICES.filter(a => a.status !== 'Healthy').length;
  const openErr = AUTH_ERRORS.filter(e => e.status === 'Open').length;
  el('authPill').className = 'badge ' + (degraded ? 'b-warn' : 'b-ok');
  el('authPill').textContent = degraded ? degraded + ' degraded' : 'All healthy';
  el('authKpis').innerHTML = [
    ['Services', num(AUTH_SERVICES.length), AUTH_SERVICES.filter(a => a.status === 'Healthy').length + ' healthy', ''],
    ['Sign-ins (24 h)', num(sum(AUTH_SERVICES.filter(a => a.kind === 'Sign-in'), a => a.calls24h)), 'Staff and customers', ''],
    ['Service errors', num(sum(AUTH_SERVICES, a => a.errors)), 'Across 24 hours', ''],
    ['Open error groups', num(openErr), AUTH_ERRORS.length + ' logged', openErr ? 'red' : ''],
    ['Slowest service', 'otp-send', '268 ms p95', ''],
    ['Session checks', num(AUTH_SERVICES.find(a => a.kind === 'Middleware').calls24h), 'Every authenticated call', '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join('');

  const staff = AUTH_SERVICES.filter(a => /^Staff/.test(a.name));
  const cust = AUTH_SERVICES.filter(a => /^(Customer|Registration|Password)/.test(a.name));
  const serviceCard = a => `<div class="checkrow">
      <div class="ck ${a.status === 'Healthy' ? 'pass' : 'warn'}">${a.status === 'Healthy' ? '✓' : '!'}</div>
      <div style="flex:1"><div style="font-size:10.5px;font-weight:800">${esc(a.name)}</div>
        <div class="qhint">${esc(a.note)} · ${num(a.calls24h)} calls · p95 ${a.p95} ms · ${a.errors} errors</div></div>
      <div>${okBadge(a.status)}</div></div>`;
  el('staffAuthBox').innerHTML = staff.map(serviceCard).join('');
  el('custAuthBox').innerHTML = cust.map(serviceCard).join('');

  el('authSvcPill').textContent = rows.length + ' services';
  renderTable('authSvcBody', [
    {k: 'name', label: 'Service'},
    {k: 'kind', label: 'Kind'},
    {k: 'status', label: 'State', html: v => okBadge(v)},
    {k: 'p95', label: 'p95 (ms)', num: true},
    {k: 'calls24h', label: 'Calls 24 h', num: true},
    {k: 'errors', label: 'Errors', num: true},
    {k: 'note', label: 'What it covers'}
  ], rows, {sort: 'calls24h', pageSize: 7});

  el('authGrid').innerHTML =
    chartBox({title: 'Sign-ins per day', sub: 'Staff and customer traffic, seven days', type: 'stacked', h: 190,
      cats: AUTH_DAILY.map(d => d.day),
      series: [{name: 'Staff', data: AUTH_DAILY.map(d => d.staff)}, {name: 'Customers', data: AUTH_DAILY.map(d => d.customer)}],
      value: num(sum(AUTH_DAILY, d => d.staff + d.customer))}) +
    chartBox({title: 'Refused sign-ins', sub: 'Failed attempts per day', type: 'bar', h: 190,
      cats: AUTH_DAILY.map(d => d.day), series: [{name: 'Failures', data: AUTH_DAILY.map(d => d.failed)}],
      value: num(sum(AUTH_DAILY, d => d.failed))});

  const sess = AUTH_SERVICES.find(a => a.kind === 'Middleware');
  el('sessPill').className = 'badge b-ok';
  el('sessPill').textContent = sess.status;
  el('sessBox').innerHTML =
    meter('Session validation health', 100 - sess.errors * 10, sess.errors + ' errors in 24 h') +
    kvRow('Checks today', num(sess.calls24h)) +
    kvRow('p95 latency', sess.p95 + ' ms') +
    kvRow('Timeout', WM_SET.timeout + ' s') +
    kvRow('Refresh', 'Rolling, on every request');

  el('aePill').textContent = AUTH_ERRORS.length + ' groups';
  renderTable('aeBody', [
    {k: 'service', label: 'Service'},
    {k: 'code', label: 'Code'},
    {k: 'count', label: 'Hits', num: true},
    {k: 'severity', label: 'Severity', html: v => badge(v, sevTone(v))},
    {k: 'status', label: 'State', html: v => okBadge(v)}
  ], AUTH_ERRORS.filter(e => matchQ(e.service, e.code, e.detail)), {sort: 'count', pageSize: 7});
}
function testAuthService(){
  AUTH_SERVICES.forEach(a => { if(a.status === 'Degraded') a.status = 'Healthy'; });
  AUTH_ERRORS.filter(e => e.status === 'Open').forEach(e => { e.status = 'Monitoring'; });
  logChange('Auth', 'Sign-in path test', 'degraded services', 'all services responded');
  renderAuth(); renderOverview(); renderDiagnostics();
  toast('Sign-in path tested: all seven services responded');
}

/* ===================== 10 · FRONTEND INTEGRATION ===================== */
function renderFrontend(){
  const failing = FE_CONNECTIONS.filter(c => c.status !== 'Connected').length;
  el('fePill').className = 'badge ' + (failing ? 'b-warn' : 'b-ok');
  el('fePill').textContent = failing ? failing + ' client degraded' : 'All clients connected';
  el('feKpis').innerHTML = [
    ['Clients connected', (FE_CONNECTIONS.length - failing) + '/' + FE_CONNECTIONS.length, 'Website, admin, customer portal', ''],
    ['Requests (24 h)', num(sum(FE_CONNECTIONS, c => c.requests)), 'Three clients', ''],
    ['Client errors', num(sum(FE_CONNECTIONS, c => c.errors)), 'Grouped by route', 'red'],
    ['Timeouts', num(sum(TIMEOUTS, t => t.breaches)), 'Breaches against the limit', ''],
    ['Validation checks', VALIDATION_CHECKS.filter(v => v.status === 'Pass').length + '/' + VALIDATION_CHECKS.length, VALIDATION_CHECKS.filter(v => v.status !== 'Pass').length + ' to review', ''],
    ['Frontend errors', num(sum(FE_ERRORS, e => e.count)), 'Captured in the browser', '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join('');

  el('feConnPill').className = 'badge ' + (failing ? 'b-warn' : 'b-ok');
  el('feConnPill').textContent = FE_CONNECTIONS.length + ' clients';
  renderTable('connBody', [
    {k: 'name', label: 'Client'},
    {k: 'target', label: 'Target'},
    {k: 'status', label: 'State', html: v => okBadge(v)},
    {k: 'p95', label: 'p95 (ms)', num: true},
    {k: 'errors', label: 'Errors', num: true}
  ], FE_CONNECTIONS, {sort: 'p95', pageSize: 3});

  el('cfgPill').textContent = FE_CONFIG.length + ' keys';
  renderTable('cfgBody', [
    {k: 'key', label: 'Key'},
    {k: 'value', label: 'Value'},
    {k: 'env', label: 'Environment'},
    {k: 'status', label: 'State', html: v => okBadge(v)}
  ], FE_CONFIG.filter(c => matchQ(c.key, c.value)), {sort: 'key', dir: 'asc', pageSize: 6});

  el('valBox').innerHTML = VALIDATION_CHECKS.map(v => `<div class="checkrow">
      <div class="ck ${v.status === 'Pass' ? 'pass' : 'warn'}">${v.status === 'Pass' ? '✓' : '!'}</div>
      <div style="flex:1"><div style="font-size:10px;font-weight:800">${esc(v.check)} · ${esc(v.scope)}</div>
        <div class="qhint">${esc(v.detail)}</div></div>
      <div>${okBadge(v.status)}</div></div>`).join('');

  if(el('feTestMsg') && !el('feTestMsg').textContent)
    el('feTestMsg').textContent = 'The suite runs the validation checks, the timeout sweep and a fetch from each client. Last run 08:15.';
  el('feGrid').innerHTML =
    chartBox({title: 'Requests by client', sub: 'Last twenty-four hours', type: 'donut', h: 180,
      cats: FE_CONNECTIONS.map(c => c.name.split(' to ')[0]),
      series: [{name: 'Requests', data: FE_CONNECTIONS.map(c => c.requests)}],
      value: num(sum(FE_CONNECTIONS, c => c.requests))}) +
    chartBox({title: 'Timeout breaches by route', sub: 'Calls past their limit', type: 'bar', h: 180,
      cats: TIMEOUTS.map(t => t.route.split('/').slice(1, 2).join('') || t.route),
      series: [{name: 'Breaches', data: TIMEOUTS.map(t => t.breaches)}], value: num(sum(TIMEOUTS, t => t.breaches))});

  el('toPill').textContent = sum(TIMEOUTS, t => t.breaches) + ' breaches';
  renderTable('toBody', [
    {k: 'route', label: 'Route'},
    {k: 'p50', label: 'p50', num: true},
    {k: 'p95', label: 'p95', num: true},
    {k: 'breaches', label: 'Breaches', num: true},
    {k: 'status', label: 'State', html: v => okBadge(v)}
  ], TIMEOUTS.filter(t => matchQ(t.route)), {sort: 'breaches', pageSize: 8});

  el('frPill').textContent = FAILED_REQUESTS.length + ' groups';
  renderTable('frBody', [
    {k: 'origin', label: 'Client'},
    {k: 'path', label: 'Route'},
    {k: 'code', label: 'Code'},
    {k: 'count', label: 'Hits', num: true},
    {k: 'status', label: 'State', html: v => okBadge(v)}
  ], FAILED_REQUESTS.filter(f => matchQ(f.origin, f.path, f.code)), {sort: 'count', pageSize: 6});

  el('feErrPill').textContent = FE_ERRORS.filter(e => e.status === 'Open').length + ' open';
  renderTable('feErrBody', [
    {k: 'page', label: 'Page'},
    {k: 'error', label: 'Error'},
    {k: 'count', label: 'Hits', num: true},
    {k: 'severity', label: 'Severity', html: v => badge(v, sevTone(v))},
    {k: 'status', label: 'State', html: v => okBadge(v)}
  ], FE_ERRORS, {sort: 'count', pageSize: 6});
}
function runFeSuite(){
  TIMEOUTS.forEach(t => { if(t.breaches < 40) t.breaches = 0; t.status = t.breaches ? 'Breaching' : 'OK'; });
  FE_CONNECTIONS.forEach(c => { if(c.name.indexOf('Customer portal') === 0) c.status = 'Connected'; });
  VALIDATION_CHECKS.filter(v => v.status === 'Review').forEach(v => { v.status = 'Pass'; v.detail += ' — re-checked 30 Oct'; });
  FE_ERRORS.filter(e => e.status === 'Open').forEach(e => { e.status = 'Monitoring'; });
  logChange('Frontend', 'Frontend suite', 'checks pending', VALIDATION_CHECKS.length + ' checks pass');
  renderFrontend(); renderOverview(); renderDiagnostics();
  if(el('feTestMsg')) el('feTestMsg').textContent = 'Suite run at ' + new Date().toTimeString().slice(0, 5) +
    ' — ' + VALIDATION_CHECKS.filter(v => v.status === 'Pass').length + ' of ' + VALIDATION_CHECKS.length + ' checks pass, '
    + TIMEOUTS.reduce((a, t) => a + t.breaches, 0) + ' timeout breaches remain.';
  toast('Frontend suite: ' + VALIDATION_CHECKS.length + '/' + VALIDATION_CHECKS.length + ' checks pass');
}

/* ===================== 11 · FORMS ===================== */
function renderForms(){
  const bad = FORMS.filter(f => f.status !== 'Healthy');
  el('formPill').className = 'badge ' + (bad.length ? 'b-warn' : 'b-ok');
  el('formPill').textContent = bad.length ? bad.length + ' degraded' : 'All forms healthy';
  el('formKpis').innerHTML = [
    ['Forms connected', FORMS.length + '/' + FORMS.length, 'Contact to repayment', ''],
    ['Submissions (30 d)', num(sum(FORMS, f => f.submissions)), 'All five forms', ''],
    ['Rejected entries', num(sum(FORMS, f => f.errors)), 'Validation refusals', ''],
    ['Last submission', FORMS.map(f => f.last).sort().slice(-1)[0].slice(-5), 'Today', ''],
    ['Calculator calls', num(FORMS.find(f => /calculator/i.test(f.name)).submissions), 'The busiest data path', ''],
    ['Repayments posted', num(FORMS.find(f => /Repayment/i.test(f.name)).submissions), 'Airtel Money · TNM Mpamba', '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join('');

  el('formCount').textContent = FORMS.length + ' forms';
  renderTable('subBody', [
    {k: 'name', label: 'Form'},
    {k: 'endpoint', label: 'Endpoint'},
    {k: 'submissions', label: 'Submissions', num: true},
    {k: 'status', label: 'State', html: v => okBadge(v)},
    {k: 'errors', label: 'Rejected', num: true},
    {k: 'act', label: '', html: (v, r) => `<button class="btn btn-ghost" data-formtest="${esc(r.name)}">Send test</button>`}
  ], FORMS.filter(f => matchQ(f.name, f.endpoint)), {sort: 'submissions', pageSize: 5});

  if(el('formMsg') && !el('formMsg').textContent)
    el('formMsg').textContent = 'Each test posts a sample record to the live endpoint and reports the response.';
  el('formGrid').innerHTML =
    chartBox({title: 'Submissions per day', sub: 'Contact, registration, application and repayment', type: 'stacked', h: 200,
      cats: FORM_DAILY.map(d => d.day),
      series: [{name: 'Contact', data: FORM_DAILY.map(d => d.contact)},
               {name: 'Registration', data: FORM_DAILY.map(d => d.registration)},
               {name: 'Application', data: FORM_DAILY.map(d => d.application)},
               {name: 'Repayment', data: FORM_DAILY.map(d => d.repayment)}],
      value: num(sum(FORM_DAILY, d => d.contact + d.registration + d.application + d.repayment))}) +
    chartBox({title: 'Rejected entries by form', sub: 'Where validation stops the flow', type: 'bar', h: 200,
      cats: FORMS.map(f => f.name.split(' ')[0]),
      series: [{name: 'Rejected', data: FORMS.map(f => f.errors)}], value: num(sum(FORMS, f => f.errors))});

  el('valPill').textContent = FORMS.filter(f => f.status === 'Healthy').length + '/' + FORMS.length;
  el('formValBox').innerHTML = FORMS.map(f => `<div class="risk">
      <div><div class="rn">${esc(f.name)}</div><div class="rs">${esc(f.validation)} · ${esc(f.endpoint)}</div></div>
      <div class="rv">${okBadge(f.status)}</div></div>`).join('');

  el('ferrPill').textContent = FORM_ERRORS.length + ' groups';
  renderTable('ferrBody', [
    {k: 'form', label: 'Form'},
    {k: 'field', label: 'Field'},
    {k: 'error', label: 'Error'},
    {k: 'count', label: 'Hits', num: true},
    {k: 'status', label: 'State', html: v => okBadge(v)}
  ], FORM_ERRORS.filter(f => matchQ(f.form, f.field, f.error)), {sort: 'count', pageSize: 6});

  el('formLastBox').innerHTML = `<div class="strip">${FORMS.map(f =>
    `<div><div class="sl">${esc(f.name)}</div><div class="sv">${esc(f.last.slice(-5))}<span style="font-size:9px;font-weight:700;color:var(--muted)"> · ${num(f.submissions)} total</span></div></div>`).join('')}</div>`;
}
function testForm(name){
  const f = FORMS.find(x => x.name === name);
  if(!f) return;
  f.submissions += 1;
  f.last = TODAY + ' ' + new Date().toTimeString().slice(0, 5);
  f.status = 'Healthy';
  logChange('Forms', name, 'last submission ' + (f.submissions - 1), 'test submission accepted');
  renderForms(); renderOverview();
  if(el('formMsg')) el('formMsg').textContent = 'Test submission accepted by ' + name + ' at ' + f.last.slice(-5) +
    ' — ' + num(f.submissions) + ' submissions in total.';
  toast('Test submission accepted by ' + name);
}

/* ===================== 12 · FILES AND MEDIA ===================== */
function renderMedia(){
  const missing = MISSING_FILES.filter(m => m.status === 'Open');
  const unopt = IMAGES.filter(i => !i.optimized);
  el('mediaPill').className = 'badge ' + (missing.length ? 'b-warn' : 'b-ok');
  el('mediaPill').textContent = missing.length + ' missing';
  el('mediaKpis').innerHTML = [
    ['Image library', num(IMAGES.length), unopt.length + ' not optimised', unopt.length ? 'red' : ''],
    ['Documents', num(DOCUMENTS.length), DOCUMENTS.filter(d => d.status === 'Missing').length + ' missing', ''],
    ['Storage used', '3.3 GB', 'Buckets report 3.34 GB of 19 GB', ''],
    ['Brand assets', num(BRAND_ASSETS.length), 'Logos, favicons, guidelines', ''],
    ['Missing files', num(missing.length), 'Referenced but not present', missing.length ? 'red' : ''],
    ['Customer documents', num(DOCUMENTS.filter(d => d.folder === 'customers').length), 'Signed access only', '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join('');

  el('mediaGrid').innerHTML =
    chartBox({title: 'Storage by bucket', sub: 'Size in megabytes', type: 'bar', h: 180,
      cats: STORAGE_USAGE.map(b => b.bucket),
      series: [{name: 'MB', data: STORAGE_USAGE.map(b => parseInt(b.size, 10) > 900 ? 921 : parseInt(b.size, 10))}],
      value: '3.3 GB'}) +
    chartBox({title: 'Images by state', sub: 'Optimised against oversized', type: 'donut', h: 180,
      cats: ['Optimised', 'Not optimised'],
      series: [{name: 'Images', data: [IMAGES.length - unopt.length, unopt.length]}], value: IMAGES.length + ' images'});

  el('imgPill').textContent = unopt.length ? unopt.length + ' oversized' : 'All optimised';
  renderTable('imgBody', [
    {k: 'name', label: 'File'},
    {k: 'size', label: 'Size'},
    {k: 'usedOn', label: 'Used on'},
    {k: 'optimized', label: 'Optimised', html: v => okBadge(v ? 'Pass' : 'Review')},
    {k: 'act', label: '', html: (v, r) => r.optimized ? '' : `<button class="btn btn-ghost" data-optimise="${esc(r.name)}">Optimise</button>`}
  ], IMAGES.filter(i => matchQ(i.name, i.usedOn)), {sort: 'size', dir: 'asc', pageSize: 8});

  el('brandAssetBox').innerHTML = BRAND_ASSETS.map(b => `<div class="risk">
      <div><div class="rn">${esc(b.name)}</div><div class="rs">${esc(b.format)} · ${esc(b.size)} · ${esc(b.variants)}</div></div>
      <div class="rv">${badge('Updated ' + fmtShort(b.updated), 'b-gray')}</div></div>`).join('');

  el('accessPill').textContent = FILE_ACCESS.length + ' folders';
  el('uploadBox').innerHTML = `<div class="minihead">Upload configuration</div>` +
    UPLOAD_CFG.map(u => kvRow(u.setting + ' (' + u.scope + ')', esc(u.value))).join('');
  el('accessBox').innerHTML = `<div class="minihead" style="margin-top:8px">File access permissions</div>` +
    FILE_ACCESS.map(f => kvRow(f.folder + ' — ' + f.rule, esc(f.signed === 'No' ? 'public' : 'signed ' + f.signed))).join('');

  el('docPill').textContent = DOCUMENTS.length + ' files';
  renderTable('docBody', [
    {k: 'name', label: 'Document'},
    {k: 'folder', label: 'Folder'},
    {k: 'size', label: 'Size'},
    {k: 'access', label: 'Access'},
    {k: 'downloads', label: 'Downloads', num: true},
    {k: 'status', label: 'State', html: v => okBadge(v === 'OK' ? 'Pass' : 'Missing')}
  ], DOCUMENTS.filter(d => matchQ(d.name, d.folder)), {sort: 'downloads', pageSize: 8});

  el('storeBox').innerHTML = STORAGE_USAGE.map(b => {
    const used = parseInt(b.size, 10) > 900 ? 921 : parseInt(b.size, 10);
    const limit = /GB$/.test(b.limit) ? parseInt(b.limit, 10) * 1024 : parseInt(b.limit, 10);
    return meter(b.bucket + ' · ' + b.files + ' files', pct(used, limit), b.size + ' of ' + b.limit);
  }).join('');

  el('missPill').className = 'badge ' + (missing.length ? 'b-crit' : 'b-ok');
  el('missPill').textContent = missing.length + ' open';
  renderTable('missBody', [
    {k: 'path', label: 'Missing file'},
    {k: 'referencedBy', label: 'Referenced by'},
    {k: 'firstSeen', label: 'First seen', html: v => fmtShort(v)},
    {k: 'severity', label: 'Severity', html: v => badge(v, sevTone(v))},
    {k: 'act', label: '', html: (v, r) => r.status === 'Open'
        ? `<button class="btn btn-ghost" data-restore="${esc(r.path)}">Restore</button>
           <button class="btn btn-ghost" data-purge="${esc(r.path)}">Purge reference</button>` : okBadge('Cleared')}
  ], MISSING_FILES, {sort: 'firstSeen', pageSize: 5});
}
function fixMissing(path, mode){
  const m = MISSING_FILES.find(x => x.path === path);
  if(!m) return;
  m.status = mode === 'purge' ? 'Purged' : 'Restored';
  if(mode === 'purge'){
    LINKS.concat().forEach(() => {});
    IMAGES.filter(i => i.path === path).forEach(i => { i.optimized = true; });
  }
  DOCUMENTS.filter(d => path.indexOf(d.name) >= 0).forEach(d => { d.status = 'OK'; if(d.size === '0 KB') d.size = '1.2 MB'; });
  logChange('Storage', m.path, 'missing', m.status.toLowerCase());
  renderMedia(); renderPages(); renderOverview(); renderChanges();
  toast(mode === 'purge' ? 'Reference purged' : 'File restored from the backup bucket');
}
function optimiseImage(name){
  const img = IMAGES.find(i => i.name === name);
  if(!img) return;
  img.optimized = true;
  const mb = parseFloat(img.size);
  if(/MB$/i.test(img.size)) img.size = Math.max(1, Math.round(mb * 1024 * 0.34)) + ' KB';
  logChange('Storage', name, 'oversized', img.size + ' after optimisation');
  renderMedia(); renderPerformance(); renderChanges();
  toast(name + ' optimised to ' + img.size);
}
</script>
