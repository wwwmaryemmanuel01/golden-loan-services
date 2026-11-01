<script>
/* ============================================================
   WEBSITE MANAGEMENT & CONNECTIONS (5/7)
   5 · Domain and hosting   6 · Backend server
   7 · Supabase            8 · Integrations
   ============================================================ */

/* ===================== 5 · DOMAIN AND HOSTING ===================== */
function renderHosting(){
  const live = DEPLOYMENTS.filter(d => d.status === 'Live');
  const uptime = r1(sum(UPTIME, u => u.uptime) / UPTIME.length);
  el('hostPill').className = 'badge ' + (uptime >= 99.9 ? 'b-ok' : 'b-warn');
  el('hostPill').textContent = uptime + '% uptime';
  el('hostKpis').innerHTML = [
    ['Primary domain', DOMAIN.name, DOMAIN.registrar + ' · expires ' + fmtDate(DOMAIN.expires), ''],
    ['Days until the domain expires', num(daysBetween(TODAY, DOMAIN.expires)), DOMAIN.autoRenew ? 'Auto-renew is on' : 'Auto-renew off', ''],
    ['DNS records', num(DNS.length), DNS.filter(r => r.status === 'Propagated').length + ' propagated', DNS.some(r => r.status !== 'Propagated') ? 'red' : ''],
    ['SSL certificate', SSL_CERT.daysLeft + ' days', SSL_CERT.issuer + ' · ' + SSL_CERT.protocol, SSL_CERT.daysLeft < 30 ? 'red' : ''],
    ['Hosting', HOSTING.provider, HOSTING.plan + ' · ' + HOSTING.region, ''],
    ['Deployments live', num(live.length), 'Latest ' + (DEPLOYMENTS[0] || {}).version + ' at ' + (DEPLOYMENTS[0] || {}).when, '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join('');

  el('hostGrid').innerHTML = [
    chartBox({title:'Uptime by day', sub:'Monitor results, fourteen days', value:uptime + '%',
      chart: chart({type:'bar', cats:UPTIME.map(u => u.date.slice(5)), h:190,
        series:[{name:'Down minutes', data:UPTIME.map(u => u.downMin), colour:'#D93F3F'}]})}),
    chartBox({title:'Deployments by environment', sub:'Every build on record', value:num(DEPLOYMENTS.length),
      chart: chart({type:'donut', cats:['Production','Staging'], h:190, colours:['#1E9E6A','#2F6FED'],
        series:[{data:['Production','Staging'].map(e => DEPLOYMENTS.filter(d => d.env === e).length)}]})}),
    chartBox({title:'DNS records by type', sub:'What the zone holds', value:num(DNS.length),
      chart: chart({type:'bar', cats:['A','CNAME','MX','TXT'], h:190,
        series:[{name:'Records', data:['A','CNAME','MX','TXT'].map(t => DNS.filter(d => d.type === t).length), colour:'#C9A227'}]})})
  ].join('');

  el('domainPill').className = 'badge ' + (DOMAIN.autoRenew ? 'b-ok' : 'b-warn');
  el('domainPill').textContent = DOMAIN.autoRenew ? 'Renewing' : 'Manual renewal';
  el('domainBox').innerHTML = `<div class="pfields" style="grid-template-columns:1fr 1fr">
      ${kvRow('Domain', esc(DOMAIN.name))}
      ${kvRow('Registrar', esc(DOMAIN.registrar))}
      ${kvRow('Registered', fmtDate(DOMAIN.registered))}
      ${kvRow('Expires', fmtDate(DOMAIN.expires))}
      ${kvRow('Nameservers', esc(DOMAIN.nameservers))}
      ${kvRow('DNSSEC', okBadge(DOMAIN.dnssec))}
      ${kvRow('ID protection', okBadge(DOMAIN.idProtection))}
      ${kvRow('http → https', 'Forced, HSTS preload')}
    </div>`;

  if(el('cdPrimary')){
    el('cdPrimary').value = WM_SET.publicUrl;
    el('cdAdmin').value = WM_SET.adminUrl;
    el('cdApi').value = WM_SET.apiBase;
    el('cdHttps').value = 'On';
  }

  el('dnsPill').className = 'badge ' + (DNS.every(r => r.status === 'Propagated') ? 'b-ok' : 'b-warn');
  el('dnsPill').textContent = DNS.filter(r => r.status === 'Propagated').length + ' of ' + DNS.length + ' live';
  renderTable('dnsBody', [
    {k:'record', label:'Record'}, {k:'type', label:'Type'}, {k:'value', label:'Value'},
    {k:'ttl', label:'TTL', num:true}, {k:'status', label:'Status', html:v => okBadge(v)}
  ], DNS, {pageSize:7});

  el('sslPill').className = 'badge ' + (SSL_CERT.daysLeft > 30 ? 'b-ok' : 'b-warn');
  el('sslPill').textContent = SSL_CERT.daysLeft + ' days left';
  el('sslBox').innerHTML = `<div class="pfields" style="grid-template-columns:1fr 1fr">
      ${kvRow('Issuer', esc(SSL_CERT.issuer))}
      ${kvRow('Valid from', fmtDate(SSL_CERT.validFrom))}
      ${kvRow('Valid to', fmtDate(SSL_CERT.validTo))}
      ${kvRow('Protocol', esc(SSL_CERT.protocol))}
      ${kvRow('Key type', esc(SSL_CERT.keyType))}
      ${kvRow('OCSP', esc(SSL_CERT.ocsp))}
      ${kvRow('HSTS', SSL_CERT.hsts ? okBadge('Enabled') : okBadge('Missing'))}
      ${kvRow('Mixed content', okBadge('None found'))}
    </div>
    <div style="margin-top:9px">${meter('Certificate lifetime', pct(SSL_CERT.daysLeft, 90), 60, 30,
      SSL_CERT.daysLeft + ' days remaining of a 90-day certificate')}</div>`;

  el('hostingBox').innerHTML = `<div class="pfields" style="grid-template-columns:1fr 1fr">
      ${kvRow('Provider', esc(HOSTING.provider))}
      ${kvRow('Plan', esc(HOSTING.plan))}
      ${kvRow('Region', esc(HOSTING.region))}
      ${kvRow('CDN', esc(HOSTING.cdn))}
      ${kvRow('Repository', esc(HOSTING.repo))}
      ${kvRow('Branch', esc(HOSTING.branch))}
      ${kvRow('Build cache', esc(HOSTING.storage))}
      ${kvRow('Build minutes', esc(HOSTING.buildMinutes))}
    </div>`;

  const d0 = DEPLOYMENTS[0];
  el('depPill').className = 'badge ' + (d0.status === 'Live' ? 'b-ok' : 'b-warn');
  el('depPill').textContent = d0.status;
  el('deployBox').innerHTML = `<div class="pfields" style="grid-template-columns:1fr 1fr">
      ${kvRow('Version', esc(d0.version))}
      ${kvRow('Deployed', esc(d0.when))}
      ${kvRow('Environment', esc(d0.env))}
      ${kvRow('Commit', esc(d0.commit))}
      ${kvRow('Build time', esc(d0.took))}
      ${kvRow('Deployed by', esc(staffName(d0.by)))}
      ${kvRow('Production URL', esc(WM_SET.publicUrl))}
      ${kvRow('Queued builds', '0')}
    </div>`;

  renderTable('dep2Body', [
    {k:'id', label:'Deployment'}, {k:'version', label:'Version'}, {k:'env', label:'Environment'},
    {k:'when', label:'When'}, {k:'status', label:'Status', html:v => okBadge(v)},
    {k:'took', label:'Build'}, {k:'by', label:'By', html:v => esc(staffName(v))}
  ], DEPLOYMENTS, {sort:'when', pageSize:7});

  el('availPill').className = 'badge ' + (UPTIME.every(u => u.downMin === 0) ? 'b-ok' : 'b-warn');
  el('availPill').textContent = num(sum(UPTIME, u => u.downMin)) + ' minutes down';
  renderTable('availBody', [
    {k:'date', label:'Date', html:v => fmtDate(v)},
    {k:'uptime', label:'Uptime %', num:true},
    {k:'checks', label:'Checks', num:true},
    {k:'downMin', label:'Down (min)', num:true},
    {k:'incidents', label:'Incidents', num:true},
    {k:'state', label:'Verdict', html:(v, r) => okBadge(r.downMin === 0 ? 'Pass' : r.downMin > 30 ? 'Fail' : 'Review')}
  ], UPTIME, {sort:'date', pageSize:7});
}

/* ===================== 6 · BACKEND SERVER ===================== */
function renderBackend(){
  const failingRoutes = API_ENDPOINTS.filter(e => e.status === 'Failing');
  el('bePill').className = 'badge ' + (failingRoutes.length ? 'b-warn' : 'b-ok');
  el('bePill').textContent = BACKEND.status;
  el('beKpis').innerHTML = [
    ['Backend status', BACKEND.status, BACKEND.runtime + ' · ' + BACKEND.region, ''],
    ['Instances', num(BACKEND.instances), 'Autoscale at 70% CPU', ''],
    ['Average p95', num(wmStats().avgP95) + ' ms', 'Across ' + API_ENDPOINTS.length + ' routes', ''],
    ['Routes failing', num(failingRoutes.length), failingRoutes.map(r => r.path).join(', ') || 'None', failingRoutes.length ? 'red' : ''],
    ['Errors in the period', num(sum(SERVER_ERRORS, e => e.count)), 'Server-side responses only', sum(SERVER_ERRORS, e => e.count) > 20 ? 'red' : ''],
    ['Restarts (30 days)', num(BACKEND.restarts30d), 'Last ' + fmtDate(BACKEND.lastRestart), '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join('');

  el('beStatusPill').className = 'badge b-ok';
  el('beStatusPill').textContent = BACKEND.status;
  el('beBox').innerHTML = `<div class="pfields" style="grid-template-columns:1fr 1fr">
      ${kvRow('Service', esc(BACKEND.name))}
      ${kvRow('Runtime', esc(BACKEND.runtime))}
      ${kvRow('Region', esc(BACKEND.region))}
      ${kvRow('Instances', String(BACKEND.instances))}
      ${kvRow('Health URL', esc(BACKEND.healthUrl))}
      ${kvRow('Cache', esc(BACKEND.redis))}
      ${kvRow('Queue', esc(BACKEND.queue))}
      ${kvRow('Uptime', '99.94% · 30 days')}
    </div>`;

  el('beHealth').innerHTML = SERVER_HEALTH.map(h => `<div class="checkrow">
      <div class="ck ${h.status === 'Pass' ? 'pass' : h.status === 'Review' ? 'warn' : 'fail'}">${h.status === 'Pass' ? '✓' : '!'}</div>
      <div style="flex:1"><div style="font-size:10px;font-weight:800">${esc(h.check)}</div>
        <div class="qhint">${esc(h.value)}</div></div>
      <div>${okBadge(h.status)}</div>
    </div>`).join('');

  el('apiPill').className = 'badge ' + (failingRoutes.length ? 'b-crit' : 'b-ok');
  el('apiPill').textContent = API_ENDPOINTS.filter(e => e.status === 'Healthy').length + '/' + API_ENDPOINTS.length + ' healthy';
  renderTable('apiBody', [
    {k:'path', label:'Route'}, {k:'method', label:'Method'}, {k:'group', label:'Group'},
    {k:'auth', label:'Auth'}, {k:'p95', label:'p95 (ms)', num:true},
    {k:'calls', label:'Calls', num:true}, {k:'errors', label:'Errors', num:true},
    {k:'status', label:'Status', html:v => okBadge(v)}
  ], API_ENDPOINTS.filter(e => passLane(e) && passSeverity(e) && matchQ(e.path, e.group, e.auth)),
    {sort:'errors', pageSize:8});

  el('beGrid').innerHTML = [
    chartBox({title:'Requests per hour', sub:'Today, 08:00 onwards', value:num(sum(TRAFFIC, t => t.requests)),
      chart: chart({type:'line', cats:TRAFFIC.map(t => t.hour), h:190,
        series:[{name:'Requests', data:TRAFFIC.map(t => t.requests), colour:'#2F6FED'},
                {name:'Errors', data:TRAFFIC.map(t => t.errors), colour:'#D93F3F'}]})}),
    chartBox({title:'Routes by group', sub:'Where the surface area sits', value:num(API_ENDPOINTS.length),
      chart: chart({type:'donut', cats:[...new Set(API_ENDPOINTS.map(e => e.group))], h:190, colours:PALETTE,
        series:[{data:[...new Set(API_ENDPOINTS.map(e => e.group))].map(g => API_ENDPOINTS.filter(e => e.group === g).length)}]})}),
    chartBox({title:'Average latency by route', sub:'Milliseconds, worst first', value:num(wmStats().avgP95) + ' ms',
      chart: chart({type:'bar', cats:API_ENDPOINTS.slice().sort((a, b) => b.p95 - a.p95).slice(0, 7).map(e => e.path.replace('/payments/', '/pmt/')),
        h:190, series:[{name:'p95 ms', data:API_ENDPOINTS.slice().sort((a, b) => b.p95 - a.p95).slice(0, 7).map(e => e.p95), colour:'#C9A227'}]})})
  ].join('');

  el('sePill').className = 'badge ' + (SERVER_ERRORS.some(e => e.status === 'Open') ? 'b-warn' : 'b-ok');
  el('sePill').textContent = SERVER_ERRORS.filter(e => e.status === 'Open').length + ' open';
  renderTable('seBody', [
    {k:'when', label:'When', html:v => String(v).slice(0, 10) === TODAY ? 'Today ' + String(v).slice(11) : fmtDate(v)},
    {k:'endpoint', label:'Endpoint'},
    {k:'code', label:'Code', num:true},
    {k:'message', label:'Message'},
    {k:'count', label:'Count', num:true},
    {k:'status', label:'Status', html:v => okBadge(v)}
  ], SERVER_ERRORS.filter(e => passLane(e)), {sort:'count', pageSize:6});

  el('reqBox').innerHTML = TIMEOUTS.slice(0, 6).map(t =>
    `<div class="meterrow"><div style="font-size:9.5px;font-weight:800;min-width:120px">${esc(t.route)}</div>
      <div style="flex:1">${meter(t.route, clamp(100 - pct(t.p95, t.limit) * 20, 0, 100), 90, 75,
        'p95 ' + t.p95 + ' ms of a ' + t.limit + ' ms budget · ' + t.breaches + ' breaches')}</div></div>`).join('');

  el('beEnv').innerHTML = `<div class="pfields" style="grid-template-columns:1fr 1fr">
      ${kvRow('CPU', BACKEND.cpu + '% of 3 instances')}
      ${kvRow('Memory', BACKEND.memory + '% of 2 GB')}
      ${kvRow('Disk', BACKEND.disk + '% of 40 GB')}
      ${kvRow('Redis', esc(BACKEND.redis))}
      ${kvRow('Queue', esc(BACKEND.queue))}
      ${kvRow('Last restart', fmtDate(BACKEND.lastRestart))}
    </div>
    <div style="margin-top:9px">
      ${meter('CPU headroom', 100 - BACKEND.cpu, 60, 40, BACKEND.cpu + '% used across three instances')}
      ${meter('Memory headroom', 100 - BACKEND.memory, 50, 35, BACKEND.memory + '% used — above the 55% target')}
      ${meter('Disk headroom', 100 - BACKEND.disk, 75, 55, BACKEND.disk + '% of 40 GB used')}
    </div>`;

  renderTable('rsBody', [
    {k:'when', label:'When', html:v => fmtDate(v)},
    {k:'reason', label:'Reason'},
    {k:'took', label:'Recovery'},
    {k:'by', label:'By'}
  ], RESTARTS, {sort:'when', pageSize:4});
}
function restartServer(){
  BACKEND.restarts30d += 1;
  BACKEND.lastRestart = TODAY + ' ' + new Date().toTimeString().slice(0, 5);
  RESTARTS.unshift({when: TODAY + ' ' + new Date().toTimeString().slice(0, 5),
    reason: 'Restart requested from the connection console', took: '41 s', by: staffName('STF-001')});
  logChange('Configuration', 'Backend restart', 'Running instance', 'Restarted cleanly in 41 s');
  renderBackend(); renderChanges();
  toast('Backend restarted — all three instances healthy');
}
function runHealthChecks(){
  SERVER_HEALTH.forEach(h => { if(h.check === 'Memory pressure') h.status = BACKEND.memory > 55 ? 'Review' : 'Pass'; });
  renderBackend();
  toast('Health checks re-run: ' + SERVER_HEALTH.filter(h => h.status === 'Pass').length + ' of ' + SERVER_HEALTH.length + ' pass');
}

/* ===================== 7 · SUPABASE DATABASE ===================== */
function renderDatabase(){
  const gaps = TABLES.filter(t => t.rls !== 'Enabled');
  el('dbPill2').className = 'badge ' + (gaps.length ? 'b-warn' : 'b-ok');
  el('dbPill2').textContent = gaps.length ? gaps.length + ' RLS gap' : 'Healthy';
  el('dbKpis').innerHTML = [
    ['Project', SUPA.project, SUPA.region + ' · ' + SUPA.engine, ''],
    ['Connectivity', SUPA.latency, SUPA.connections + ' pool connections in use', ''],
    ['Tables', num(TABLES.length), num(sum(TABLES, t => t.rows)) + ' rows across the schema', ''],
    ['Schema version', SUPA.schemaVersion, MIGRATIONS.filter(m => m.status === 'Applied').length + ' migrations applied', ''],
    ['Query errors', num(sum(DB_ERRORS, e => e.count)), DB_ERRORS.filter(e => e.status === 'Open').length + ' still open', sum(DB_ERRORS, e => e.count) > 10 ? 'red' : ''],
    ['Tables without RLS', num(gaps.length), gaps.map(t => t.table).join(', ') || 'Every table covered', gaps.length ? 'red' : '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join('');

  el('dbGrid').innerHTML = [
    chartBox({title:'Rows by table', sub:'Where the data lives', value:num(sum(TABLES, t => t.rows)),
      chart: chart({type:'bar', cats:TABLES.slice(0, 7).map(t => t.table), h:190,
        series:[{name:'Rows', data:TABLES.slice(0, 7).map(t => t.rows), colour:'#2F6FED'}]})}),
    chartBox({title:'Slowest queries', sub:'p95 in milliseconds', value:Math.max(...QUERY_PERF.map(q => q.p95)) + ' ms',
      chart: chart({type:'bar', cats:QUERY_PERF.slice(0, 6).map(q => q.query.split(' ')[2] || 'query'), h:190,
        series:[{name:'p95 ms', data:QUERY_PERF.slice(0, 6).map(q => q.p95), colour:'#D93F3F'}]})}),
    chartBox({title:'Query errors by code', sub:'What Postgres refused', value:num(DB_ERRORS.length),
      chart: chart({type:'donut', cats:DB_ERRORS.map(e => e.code), h:190, colours:PALETTE,
        series:[{data:DB_ERRORS.map(e => e.count)}]})})
  ].join('');

  el('supaPill').className = 'badge b-ok';
  el('supaPill').textContent = 'Connected';
  el('supaBox').innerHTML = `<div class="pfields" style="grid-template-columns:1fr 1fr">
      ${kvRow('Project', esc(SUPA.project))}
      ${kvRow('URL', esc(SUPA.url))}
      ${kvRow('Region', esc(SUPA.region))}
      ${kvRow('Engine', esc(SUPA.engine))}
      ${kvRow('Pooler', esc(SUPA.pooler))}
      ${kvRow('Connections', esc(SUPA.connections))}
      ${kvRow('Database size', esc(SUPA.size))}
      ${kvRow('Schema version', esc(SUPA.schemaVersion))}
    </div>`;

  el('dbHealth').innerHTML = DB_HEALTH.map(h => `<div class="checkrow">
      <div class="ck ${h.status === 'Pass' ? 'pass' : h.status === 'Review' ? 'warn' : 'fail'}">${h.status === 'Pass' ? '✓' : '!'}</div>
      <div style="flex:1"><div style="font-size:10px;font-weight:800">${esc(h.check)}</div>
        <div class="qhint">${esc(h.value)}</div></div>
      <div>${okBadge(h.status)}</div>
    </div>`).join('');

  el('tblPill').textContent = TABLES.length + ' tables';
  renderTable('tblBody', [
    {k:'table', label:'Table'}, {k:'rows', label:'Rows', num:true}, {k:'size', label:'Size'},
    {k:'rls', label:'RLS', html:v => okBadge(v === 'Enabled' ? 'Enabled' : 'Missing')},
    {k:'policy', label:'Policy'}, {k:'lastWrite', label:'Last write', html:v => fmtDate(v)}
  ], TABLES.filter(t => passLane(t) && matchQ(t.table, t.policy)), {sort:'rows', pageSize:8});

  el('migPill').className = 'badge ' + (MIGRATIONS.some(m => m.status !== 'Applied') ? 'b-warn' : 'b-ok');
  el('migPill').textContent = SUPA.schemaVersion;
  renderTable('migBody', [
    {k:'id', label:'Migration'}, {k:'name', label:'What it did'},
    {k:'when', label:'When', html:v => fmtDate(v)}, {k:'status', label:'Status', html:v => okBadge(v)},
    {k:'ms', label:'Took (ms)', num:true}
  ], MIGRATIONS, {sort:'when', pageSize:6});

  el('qePill').className = 'badge ' + (DB_ERRORS.some(e => e.status === 'Open') ? 'b-warn' : 'b-ok');
  el('qePill').textContent = DB_ERRORS.filter(e => e.status === 'Open').length + ' open';
  renderTable('qeBody', [
    {k:'when', label:'When', html:v => String(v).slice(0, 10) === TODAY ? 'Today ' + String(v).slice(11) : fmtDate(v)},
    {k:'code', label:'SQLSTATE'}, {k:'message', label:'Message'},
    {k:'count', label:'Count', num:true}, {k:'status', label:'Status', html:v => okBadge(v)}
  ], DB_ERRORS, {sort:'count', pageSize:6});

  el('rlsBox').innerHTML = TABLES.map(t => `<div class="checkrow">
      <div class="ck ${t.rls === 'Enabled' ? 'pass' : 'fail'}">${t.rls === 'Enabled' ? '✓' : '!'}</div>
      <div style="flex:1"><div style="font-size:10px;font-weight:800">${esc(t.table)}</div>
        <div class="qhint">${esc(t.policy)}</div></div>
      <div>${okBadge(t.rls === 'Enabled' ? 'Enabled' : 'Missing')}</div>
    </div>`).join('');

  renderTable('fnBody', [
    {k:'name', label:'Function'}, {k:'invoker', label:'Runs as'},
    {k:'runs', label:'Calls', num:true}, {k:'risk', label:'Risk', html:v => okBadge(v === 'High' ? 'Critical' : 'Pass')},
    {k:'status', label:'Status', html:v => okBadge(v)}
  ], DB_FUNCS, {sort:'runs', pageSize:6});

  renderTable('qpBody', [
    {k:'query', label:'Query'}, {k:'calls', label:'Calls', num:true},
    {k:'avg', label:'Avg (ms)', num:true}, {k:'p95', label:'p95 (ms)', num:true},
    {k:'rows', label:'Rows', num:true},
    {k:'verdict', label:'Verdict', html:(v, r) => okBadge(r.p95 > 500 ? 'Slow' : r.p95 > 200 ? 'Review' : 'Pass')}
  ], QUERY_PERF, {sort:'p95', pageSize:7});
}
function fixRls(){
  const gaps = TABLES.filter(t => t.rls !== 'Enabled');
  if(!gaps.length) return toast('Every table already has a policy.', 'info');
  gaps.forEach(t => { t.rls = 'Enabled'; t.policy = 'Administrator only — policy added from the console'; });
  DB_HEALTH.forEach(h => { if(h.check === 'Row-level security'){ h.status = 'Pass'; h.value = 'Enabled on all 12 tables'; } });
  logChange('Database', 'Row-level security policy', 'settings · no policy', 'settings · administrator only');
  renderDatabase(); renderStats();
  toast('RLS enabled on ' + gaps.length + ' table' + (gaps.length === 1 ? '' : 's'));
}

/* ===================== 8 · INTEGRATIONS ===================== */
function renderIntegrations(){
  const up = INTEGRATIONS.filter(i => i.status === 'Connected').length;
  const bad = INTEGRATIONS.filter(i => i.status !== 'Connected');
  el('intPill').className = 'badge ' + (bad.length ? 'b-warn' : 'b-ok');
  el('intPill').textContent = up + ' of ' + INTEGRATIONS.length + ' connected';
  el('intKpis').innerHTML = [
    ['Connected services', `${up} of ${INTEGRATIONS.length}`, INTEGRATIONS.filter(i => i.kind === 'Payments').length + ' payment rails wired', ''],
    ['Services degraded', num(bad.length), bad.map(i => i.name).join(', ') || 'None', bad.length ? 'red' : ''],
    ['Average latency', num(Math.round(sum(INTEGRATIONS, i => i.latency) / INTEGRATIONS.length)) + ' ms', 'Across every connected service', ''],
    ['Credentials valid', num(API_CREDS.filter(c => c.state === 'Valid').length) + ' of ' + API_CREDS.length, API_CREDS.filter(c => c.state !== 'Valid').map(c => c.name).join(', ') || 'All in date', API_CREDS.some(c => c.state !== 'Valid') ? 'red' : ''],
    ['Integration tests passing', num(INTEGRATION_TESTS.filter(t => t.result === 'Pass').length) + ' of ' + INTEGRATION_TESTS.length, 'Last full run today', ''],
    ['Lowest uptime', r1(Math.min(...INTEGRATIONS.map(i => i.uptime))) + '%', INTEGRATIONS.slice().sort((a, b) => a.uptime - b.uptime)[0].name, 'red']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join('');

  el('intGrid').innerHTML = [
    chartBox({title:'Uptime by service', sub:'Thirty-day availability', value:r1(Math.min(...INTEGRATIONS.map(i => i.uptime))) + '% lowest',
      chart: chart({type:'bar', cats:INTEGRATIONS.map(i => i.name.split(' ')[0]), h:190,
        series:[{name:'Uptime %', data:INTEGRATIONS.map(i => i.uptime), colour:'#1E9E6A'}]})}),
    chartBox({title:'Latency by service', sub:'Milliseconds, last probe', value:num(sum(INTEGRATIONS, i => i.latency)) + ' ms',
      chart: chart({type:'bar', cats:INTEGRATIONS.map(i => i.name.split(' ')[0]), h:190,
        series:[{name:'ms', data:INTEGRATIONS.map(i => i.latency), colour:'#C9A227'}]})}),
    chartBox({title:'Services by kind', sub:'How the stack is put together', value:num(INTEGRATIONS.length),
      chart: chart({type:'donut', cats:[...new Set(INTEGRATIONS.map(i => i.kind))], h:190, colours:PALETTE,
        series:[{data:[...new Set(INTEGRATIONS.map(i => i.kind))].map(k => INTEGRATIONS.filter(i => i.kind === k).length)}]})})
  ].join('');

  el('groupGrid').innerHTML = ['Authentication', 'Email', 'SMS', 'Payments', 'Storage', 'Monitoring', 'Analytics', 'REST API'].map(kind => {
    const group = INTEGRATIONS.filter(i => i.kind === kind);
    if(!group.length) return '';
    const worst = group.some(i => i.status === 'Failing') ? 'Failing' : group.some(i => i.status === 'Degraded') ? 'Degraded' : 'Connected';
    return statusCell(kind, worst, group.map(i => i.name.split(' ')[0]).join(', ') + ' · ' + group.length + ' service' + (group.length === 1 ? '' : 's'));
  }).join('');

  el('svcPill').className = 'badge ' + (bad.length ? 'b-warn' : 'b-ok');
  el('svcPill').textContent = INTEGRATIONS.length + ' services';
  renderTable('svcBody', [
    {k:'name', label:'Service'}, {k:'kind', label:'Kind'}, {k:'provider', label:'Provider'},
    {k:'status', label:'Status', html:v => okBadge(v)},
    {k:'latency', label:'Latency (ms)', num:true},
    {k:'uptime', label:'Uptime %', num:true},
    {k:'creds', label:'Credential', html:v => okBadge(v === 'Valid' ? 'Valid' : v)},
    {k:'act', label:'', html:(v, r) => `<button class="btn btn-ghost" data-verify="${esc(r.name)}">Verify</button>`}
  ], INTEGRATIONS.filter(i => passLane(i) && matchQ(i.name, i.kind, i.provider)), {sort:'uptime', dir:'asc', pageSize:8});

  renderTable('itBody', [
    {k:'service', label:'Service'}, {k:'test', label:'Test'},
    {k:'when', label:'Last run', html:v => fmtDate(v)},
    {k:'result', label:'Result', html:v => okBadge(v === 'Slow' ? 'Review' : v)},
    {k:'ms', label:'Took (ms)', num:true}
  ], INTEGRATION_TESTS, {sort:'result', pageSize:7});

  const expiring = API_CREDS.filter(c => c.state !== 'Valid');
  el('credPill').className = 'badge ' + (expiring.length ? 'b-crit' : 'b-ok');
  el('credPill').textContent = expiring.length ? expiring.length + ' need rotation' : 'All valid';
  renderTable('credBody', [
    {k:'name', label:'Credential'}, {k:'service', label:'Service'}, {k:'scope', label:'Scope'},
    {k:'rotated', label:'Last rotated', html:v => fmtDate(v)},
    {k:'expires', label:'Expires', html:v => v === 'Never' ? 'Never' : fmtDate(v)},
    {k:'state', label:'State', html:v => okBadge(v)},
    {k:'act', label:'', html:(v, r) => `<button class="btn btn-ghost" data-cred="${esc(r.name)}">Rotate</button>`}
  ], API_CREDS, {sort:'state', pageSize:7});

  renderTable('tpiBody', [
    {k:'provider', label:'Provider'}, {k:'kind', label:'Service'},
    {k:'uptime', label:'Uptime %', num:true}, {k:'latency', label:'Latency (ms)', num:true},
    {k:'lastCheck', label:'Last check', html:v => String(v).slice(0, 10) === TODAY ? 'Today ' + String(v).slice(11) : fmtDate(v)},
    {k:'status', label:'Status', html:v => okBadge(v)}
  ], INTEGRATIONS.filter(i => !/Internal/.test(i.provider)), {sort:'uptime', dir:'asc', pageSize:7});
}
function verifyService(name){
  const s = INTEGRATIONS.find(i => i.name === name);
  if(!s) return;
  const ok = s.status !== 'Failing';
  s.lastCheck = TODAY + ' ' + new Date().toTimeString().slice(0, 5);
  s.latency = ok ? Math.max(60, s.latency + (Math.round(Math.random() * 40) - 20)) : 0;
  renderIntegrations();
  toast(ok ? name + ' responded in ' + s.latency + ' ms' : name + ' is still failing — rotate its credential', ok ? 'ok' : 'info');
}
function rotateCred(name){
  const c = API_CREDS.find(x => x.name === name);
  if(!c) return;
  c.rotated = TODAY;
  c.expires = addDays(TODAY, 90);
  c.state = 'Valid';
  const svc = INTEGRATIONS.find(i => c.service && i.provider.toLowerCase().indexOf(c.service.toLowerCase().split(' ')[0]) >= 0);
  if(svc && svc.creds !== 'Valid'){ svc.creds = 'Valid'; }
  logChange('Integration', 'Credential rotated · ' + name, 'Expired / expiring', 'Rotated ' + fmtDate(TODAY));
  renderIntegrations(); renderChanges();
  toast(name + ' rotated — valid for 90 days');
}
function runIntegrationTests(){
  INTEGRATION_TESTS.forEach(t => {
    if(t.service.indexOf('TNM') === 0){
      const cred = API_CREDS.find(c => /TNM/.test(c.name));
      t.result = cred && cred.state === 'Valid' ? 'Pass' : 'Fail';
      t.ms = t.result === 'Pass' ? 288 : 0;
    } else if(t.service.indexOf('Africa') === 0){
      t.result = 'Slow'; t.ms = 720;
    } else { t.result = 'Pass'; t.ms = Math.max(60, t.ms); }
    t.when = TODAY;
  });
  const svc = INTEGRATIONS.find(i => /TNM/.test(i.name));
  if(svc){
    const cred = API_CREDS.find(c => /TNM/.test(c.name));
    if(cred && cred.state === 'Valid' && svc.creds === 'Expired'){
      svc.creds = 'Valid'; svc.status = 'Connected'; svc.latency = 288; svc.uptime = Math.min(99.9, svc.uptime + 0.4);
    }
  }
  logChange('Integration', 'Integration test sweep', 'Last run yesterday', 'All services probed ' + fmtDate(TODAY));
  renderIntegrations(); renderDiagnostics(); renderChanges();
  toast('Integration tests: ' + INTEGRATION_TESTS.filter(t => t.result === 'Pass').length + ' of ' + INTEGRATION_TESTS.length + ' pass');
}
</script>
