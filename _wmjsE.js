<script>
/* ============================================================
   WEBSITE MANAGEMENT & CONNECTIONS (5/7)
   5 · Domain and hosting   6 · Backend server
   7 · Supabase database    8 · API and service integrations
   ============================================================ */

/* ===================== 5 · DOMAIN AND HOSTING ===================== */
function renderHosting(){
  const s = wmStats();
  el('hostPill').className = 'badge ' + (SSL_CERT.daysLeft > 30 ? 'b-ok' : 'b-warn');
  el('hostPill').textContent = 'SSL ' + SSL_CERT.daysLeft + ' days';
  el('hostKpis').innerHTML = [
    ['Domain expires', fmtDate(DOMAIN.expires), DOMAIN.registrar + ' · auto-renew ' + DOMAIN.autoRenew, ''],
    ['DNS records', DNS.filter(d => d.status === 'Resolved').length + '/' + DNS.length, DNS.filter(d => d.status !== 'Resolved').length + ' pending', DNS.some(d => d.status !== 'Resolved') ? 'red' : ''],
    ['SSL certificate', SSL_CERT.daysLeft + ' days', SSL_CERT.issuer + ' · ' + SSL_CERT.protocol, ''],
    ['Hosting provider', HOSTING.provider, HOSTING.plan + ' · ' + HOSTING.region, ''],
    ['Current deployment', 'DEP-2412', 'Version ' + WM_SET.version + ' · ' + HOSTING.publishedAt, ''],
    ['Availability (14 d)', s.up.toFixed(2) + '%', AVAILABILITY.filter(d => d.incidents).length + ' incidents', '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join('');

  el('hostGrid').innerHTML =
    chartBox({title: 'Uptime by day', sub: 'Percentage of successful checks', type: 'bar', h: 180,
      cats: AVAILABILITY.slice().reverse().map(d => fmtShort(d.date)),
      series: [{name: 'Uptime', data: AVAILABILITY.slice().reverse().map(d => d.uptime)}], value: s.up.toFixed(2) + '%'}) +
    chartBox({title: 'Downtime minutes', sub: 'Where the minutes were lost', type: 'bar', h: 180,
      cats: AVAILABILITY.slice().reverse().map(d => fmtShort(d.date)),
      series: [{name: 'Minutes down', data: AVAILABILITY.slice().reverse().map(d => d.downMin)}], value: num(sum(AVAILABILITY, d => d.downMin)) + ' min'}) +
    chartBox({title: 'DNS record types', sub: 'What the zone publishes', type: 'donut', h: 180,
      cats: ['A', 'CNAME', 'TXT'],
      series: [{name: 'Records', data: ['A', 'CNAME', 'TXT'].map(t => DNS.filter(d => d.type === t).length)}], value: DNS.length + ' records'});

  el('domainPill').className = 'badge b-ok';
  el('domainPill').textContent = 'Active';
  el('domainBox').innerHTML = [
    ['Domain', DOMAIN.name], ['Registrar', DOMAIN.registrar],
    ['Registered', fmtDate(DOMAIN.registered)], ['Expires', fmtDate(DOMAIN.expires)],
    ['Nameservers', DOMAIN.nameservers], ['DNSSEC', DOMAIN.dnssec],
    ['Auto-renew', DOMAIN.autoRenew], ['Contacts', DOMAIN.contacts]
  ].map(([k, v]) => kvRow(k, esc(v))).join('');

  el('cdPrimary').value = WM_SET.publicUrl;
  el('cdAdmin').value = WM_SET.adminUrl;
  el('cdApi').value = WM_SET.apiBase;
  if(!el('cdNote').textContent) el('cdNote').textContent = 'All three hostnames resolve through the same certificate wildcard.';

  el('dnsPill').className = 'badge ' + (DNS.every(d => d.status === 'Resolved') ? 'b-ok' : 'b-warn');
  el('dnsPill').textContent = DNS.filter(d => d.status === 'Resolved').length + '/' + DNS.length;
  renderTable('dnsBody', [
    {k: 'record', label: 'Record'},
    {k: 'type', label: 'Type'},
    {k: 'value', label: 'Value'},
    {k: 'ttl', label: 'TTL', num: true},
    {k: 'status', label: 'State', html: v => okBadge(v)}
  ], DNS, {sort: 'record', dir: 'asc', pageSize: 6});

  el('sslPill').className = 'badge ' + (SSL_CERT.daysLeft > 30 ? 'b-ok' : 'b-warn');
  el('sslPill').textContent = SSL_CERT.daysLeft + ' days left';
  el('sslBox').innerHTML = [
    ['Issuer', SSL_CERT.issuer], ['Valid from', fmtDate(SSL_CERT.validFrom)],
    ['Valid to', fmtDate(SSL_CERT.validTo)], ['Protocol', SSL_CERT.protocol],
    ['HSTS', SSL_CERT.hsts], ['Auto-renew', SSL_CERT.autoRenew]
  ].map(([k, v]) => kvRow(k, esc(v))).join('') +
    meter('Certificate life', pct(SSL_CERT.daysLeft, 90), SSL_CERT.daysLeft + ' of 90 days remaining');

  el('hostingBox').innerHTML = [
    ['Provider', HOSTING.provider], ['Plan', HOSTING.plan], ['Region', HOSTING.region],
    ['Edge network', HOSTING.edge], ['Storage', HOSTING.storage], ['Bandwidth', HOSTING.bandwidth],
    ['Build minutes', HOSTING.buildMinutes], ['SSO', HOSTING.sso]
  ].map(([k, v]) => kvRow(k, esc(v))).join('');

  const live = DEPLOYMENTS.find(d => d.status === 'Success') || DEPLOYMENTS[0];
  el('depPill').className = 'badge b-ok';
  el('depPill').textContent = live.status;
  el('deployBox').innerHTML = strip([
    ['Live build', live.version], ['Deployment', live.id], ['Environment', live.env], ['Duration', live.duration]
  ]) + `<div class="qhint" style="margin-top:6px">Deployed ${esc(live.when)} by ${esc(staffName(live.by))} · commit ${esc(live.commit)}</div>`;

  renderTable('dep2Body', [
    {k: 'id', label: 'Build'},
    {k: 'version', label: 'Version'},
    {k: 'env', label: 'Environment'},
    {k: 'when', label: 'When', html: v => esc(String(v).slice(0, 16))},
    {k: 'duration', label: 'Duration'},
    {k: 'status', label: 'Result', html: v => okBadge(v)},
    {k: 'by', label: 'By', html: v => esc(staffName(v))}
  ], DEPLOYMENTS, {sort: 'when', pageSize: 6});

  el('availPill').className = 'badge ' + (AVAILABILITY.every(d => d.uptime === 100) ? 'b-ok' : 'b-warn');
  el('availPill').textContent = 'Avg ' + s.up.toFixed(2) + '%';
  renderTable('availBody', [
    {k: 'date', label: 'Day', html: v => fmtShort(v)},
    {k: 'uptime', label: 'Uptime %', num: true},
    {k: 'checks', label: 'Checks', num: true},
    {k: 'downMin', label: 'Down (min)', num: true},
    {k: 'incidents', label: 'Incidents', num: true},
    {k: 'status', label: 'State', html: v => okBadge(v)}
  ], AVAILABILITY, {sort: 'date', pageSize: 7});
}

/* ===================== 6 · BACKEND SERVER ===================== */
function renderBackend(){
  const ok = SERVER_HEALTH.filter(h => h.status === 'Pass').length;
  el('bePill').className = 'badge ' + (ok === SERVER_HEALTH.length ? 'b-ok' : 'b-warn');
  el('bePill').textContent = ok + '/' + SERVER_HEALTH.length + ' checks pass';
  el('beKpis').innerHTML = [
    ['Backend status', BACKEND.uptime + '%', BACKEND.instances + ' instances in ' + BACKEND.region, ''],
    ['API endpoints', num(API_ENDPOINTS.length), API_ENDPOINTS.filter(e => e.status === 'Healthy').length + ' healthy', ''],
    ['Failing endpoints', num(API_ENDPOINTS.filter(e => e.status === 'Failing').length), 'Mobile-money callback', 'red'],
    ['Average p95', Math.round(sum(API_ENDPOINTS, e => e.p95) / API_ENDPOINTS.length) + ' ms', 'All routes', ''],
    ['Calls today', num(sum(API_ENDPOINTS, e => e.calls)), sum(API_ENDPOINTS, e => e.errors) + ' errors', ''],
    ['Restarts (30 d)', num(BACKEND.restarts30d), 'Last ' + fmtDate(BACKEND.lastRestart), '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join('');

  el('beConnPill').className = 'badge b-ok';
  el('beConnPill').textContent = 'Connected';
  el('beBox').innerHTML = [
    ['Service', BACKEND.name + ' · ' + BACKEND.version], ['Runtime', BACKEND.runtime],
    ['Region', BACKEND.region], ['Instances', BACKEND.instances + ' behind the edge'],
    ['Health endpoint', BACKEND.healthUrl], ['Deploy strategy', BACKEND.deployStrategy],
    ['Last deploy', BACKEND.lastDeploy], ['Uptime (30 d)', BACKEND.uptime + '%']
  ].map(([k, v]) => kvRow(k, esc(v))).join('');

  el('beHealthBox').innerHTML = SERVER_HEALTH.map(h => `<div class="checkrow">
      <div class="ck ${h.status === 'Pass' ? 'pass' : h.status === 'Review' ? 'warn' : 'fail'}">${h.status === 'Pass' ? '✓' : '!'}</div>
      <div style="flex:1"><div style="font-size:10px;font-weight:800">${esc(h.check)}</div>
        <div class="qhint">${esc(h.value)}</div></div>
      <div>${okBadge(h.status)}</div></div>`).join('');

  el('apiPill').className = 'badge b-gray';
  el('apiPill').textContent = API_ENDPOINTS.filter(e => e.status === 'Healthy').length + ' healthy';
  renderTable('apiBody', [
    {k: 'path', label: 'Route'},
    {k: 'method', label: 'Method'},
    {k: 'group', label: 'Group'},
    {k: 'p95', label: 'p95 (ms)', num: true},
    {k: 'calls', label: 'Calls', num: true},
    {k: 'errors', label: 'Errors', num: true},
    {k: 'status', label: 'State', html: v => okBadge(v)}
  ], API_ENDPOINTS.filter(e => matchQ(e.path, e.group, e.status)), {sort: 'calls', pageSize: 8});

  el('beGrid').innerHTML =
    chartBox({title: 'Requests and errors', sub: 'Today, in three-hour blocks', type: 'line', h: 180,
      cats: TRAFFIC.map(t => t.hour),
      series: [{name: 'Requests', data: TRAFFIC.map(t => t.requests)}, {name: 'Errors', data: TRAFFIC.map(t => t.errors)}],
      value: num(sum(TRAFFIC, t => t.requests))}) +
    chartBox({title: 'Routes by group', sub: 'Where the API surface sits', type: 'donut', h: 180,
      cats: ['Platform', 'Auth', 'Customers', 'Loans', 'Money', 'Storage'],
      series: [{name: 'Routes', data: ['Platform', 'Auth', 'Customers', 'Loans', 'Money', 'Storage'].map(g => API_ENDPOINTS.filter(e => e.group === g).length)}],
      value: API_ENDPOINTS.length + ' routes'});

  el('sePill').textContent = SERVER_ERRORS.length + ' groups';
  renderTable('seBody', [
    {k: 'endpoint', label: 'Route'},
    {k: 'code', label: 'Code'},
    {k: 'message', label: 'Message'},
    {k: 'count', label: 'Hits', num: true},
    {k: 'status', label: 'State', html: v => okBadge(v)}
  ], SERVER_ERRORS, {sort: 'count', pageSize: 6});

  el('rsPill').textContent = num(BACKEND.restarts30d) + ' restart' + (BACKEND.restarts30d === 1 ? '' : 's');
  el('beEnvBox').innerHTML =
    meter('CPU', BACKEND.cpu, 'Across ' + BACKEND.instances + ' instances') +
    meter('Memory', BACKEND.memory, 'No pressure signal') +
    kvRow('Runtime', esc(BACKEND.runtime)) +
    kvRow('Rolling deploy', esc(BACKEND.deployStrategy));

  renderTable('rsBody', [
    {k: 'when', label: 'When', html: v => esc(String(v).slice(0, 16))},
    {k: 'reason', label: 'Reason'},
    {k: 'duration', label: 'Downtime'},
    {k: 'result', label: 'Result', html: v => okBadge(v)}
  ], RESTARTS, {sort: 'when', pageSize: 4});
}

/* ===================== 7 · SUPABASE DATABASE ===================== */
function renderDatabase(){
  const rlsGap = TABLES.filter(t => t.rls === 'Disabled');
  const pass = DB_HEALTH.filter(h => h.status === 'Pass').length;
  el('dbPill').className = 'badge ' + (rlsGap.length ? 'b-warn' : 'b-ok');
  el('dbPill').textContent = pass + '/' + DB_HEALTH.length + ' checks pass';
  el('dbKpis').innerHTML = [
    ['Project', SUPA.project, SUPA.engine + ' · ' + SUPA.region, ''],
    ['Connections', SUPA.connections, 'Pooler, transaction mode', ''],
    ['Database size', SUPA.size, TABLES.length + ' public tables', ''],
    ['RLS coverage', (TABLES.length - rlsGap.length) + '/' + TABLES.length, rlsGap.length + ' gap' + (rlsGap.length === 1 ? '' : 's'), rlsGap.length ? 'red' : ''],
    ['Schema version', SUPA.schemaVersion, SUPA.migrationsApplied + ' migrations applied', ''],
    ['Slow queries today', num(DB_ERRORS.filter(e => e.code === '57014').length), 'Statement timeouts', '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join('');

  el('dbGrid').innerHTML =
    chartBox({title: 'Rows by table', sub: 'The public schema', type: 'bar', h: 190,
      cats: TABLES.map(t => t.table).slice(0, 10),
      series: [{name: 'Rows', data: TABLES.map(t => t.rows).slice(0, 10)}], value: pad(TABLES.length, 2) + ' tables'}) +
    chartBox({title: 'Query latency by shape', sub: 'p95 in milliseconds', type: 'bar', h: 190,
      cats: QUERY_PERF.slice(0, 7).map(q => q.query.split(' ').slice(0, 2).join(' ')),
      series: [{name: 'p95 ms', data: QUERY_PERF.slice(0, 7).map(q => q.p95)}], value: 'p95'});

  el('supaPill').className = 'badge b-ok';
  el('supaPill').textContent = 'Connected';
  el('supaBox').innerHTML = [
    ['Project', SUPA.project], ['URL', SUPA.url], ['Region', SUPA.region],
    ['Engine', SUPA.engine], ['Tier', SUPA.tier], ['Size', SUPA.size],
    ['Schema version', SUPA.schemaVersion], ['Backups', 'Daily at ' + SUPA.dailyBackup + ' · PITR ' + SUPA.pitr]
  ].map(([k, v]) => kvRow(k, esc(v))).join('');

  el('dbHealthBox').innerHTML = DB_HEALTH.map(h => `<div class="checkrow">
      <div class="ck ${h.status === 'Pass' ? 'pass' : h.status === 'Review' ? 'warn' : 'fail'}">${h.status === 'Pass' ? '✓' : '!'}</div>
      <div style="flex:1"><div style="font-size:10px;font-weight:800">${esc(h.check)}</div>
        <div class="qhint">${esc(h.value)}</div></div>
      <div>${okBadge(h.status)}</div></div>`).join('');

  el('tblPill').textContent = TABLES.length + ' tables';
  renderTable('tblBody', [
    {k: 'table', label: 'Table'},
    {k: 'rows', label: 'Rows', num: true},
    {k: 'size', label: 'Size'},
    {k: 'rls', label: 'RLS', html: v => okBadge(v === 'Enabled' ? 'Enabled' : 'Disabled')},
    {k: 'note', label: 'Policy'},
    {k: 'lastAnalyze', label: 'Analysed', html: v => fmtShort(v)}
  ], TABLES.filter(t => matchQ(t.table, t.note)), {sort: 'rows', pageSize: 8});

  el('rlsPill').className = 'badge ' + (rlsGap.length ? 'b-crit' : 'b-ok');
  el('rlsPill').textContent = rlsGap.length ? rlsGap.length + ' gap' : 'Full coverage';
  el('rlsBox').innerHTML =
    meter('Tables behind RLS', pct(TABLES.length - rlsGap.length, TABLES.length), (TABLES.length - rlsGap.length) + ' of ' + TABLES.length) +
    (rlsGap.map(t => `<div class="risk"><div><div class="rn">${esc(t.table)}</div>
      <div class="rs">${esc(t.note)}</div></div><div class="rv">${badge('No policy', 'b-crit')}</div></div>`).join('')
      || '<div class="empty">Every public table is behind a policy.</div>');

  el('migPill').textContent = MIGRATIONS.filter(m => m.status === 'Applied').length + ' applied';
  renderTable('migBody', [
    {k: 'id', label: 'Migration'},
    {k: 'name', label: 'What it does'},
    {k: 'when', label: 'When', html: v => esc(String(v).slice(0, 16))},
    {k: 'ms', label: 'Run (ms)', num: true},
    {k: 'status', label: 'State', html: v => okBadge(v)}
  ], MIGRATIONS, {sort: 'when', pageSize: 6});

  el('qePill').textContent = DB_ERRORS.length + ' groups';
  renderTable('qeBody', [
    {k: 'code', label: 'SQLSTATE'},
    {k: 'message', label: 'Message'},
    {k: 'count', label: 'Hits', num: true},
    {k: 'status', label: 'State', html: v => okBadge(v)}
  ], DB_ERRORS, {sort: 'count', pageSize: 5});

  el('fnPill').textContent = DB_FUNCS.length + ' objects';
  renderTable('fnBody', [
    {k: 'name', label: 'Function'},
    {k: 'kind', label: 'Kind'},
    {k: 'risk', label: 'Risk', html: v => badge(v, v === 'High' ? 'b-crit' : v === 'Medium' ? 'b-warn' : 'b-gray')},
    {k: 'calls', label: 'Calls', num: true},
    {k: 'status', label: 'State', html: v => okBadge(v)}
  ], DB_FUNCS, {sort: 'calls', pageSize: 6});

  renderTable('qpBody', [
    {k: 'query', label: 'Query shape'},
    {k: 'calls', label: 'Calls', num: true},
    {k: 'avgMs', label: 'Avg (ms)', num: true},
    {k: 'p95', label: 'p95 (ms)', num: true},
    {k: 'status', label: 'State', html: v => okBadge(v)}
  ], QUERY_PERF, {sort: 'p95', pageSize: 7});
}

/* ===================== 8 · INTEGRATIONS ===================== */
function renderIntegrations(){
  const connected = INTEGRATIONS.filter(i => i.status === 'Connected').length;
  const failing = INTEGRATIONS.filter(i => i.status === 'Failing');
  el('intPill').className = 'badge ' + (failing.length ? 'b-crit' : 'b-ok');
  el('intPill').textContent = connected + '/' + INTEGRATIONS.length + ' connected';
  el('intKpis').innerHTML = [
    ['Services connected', connected + '/' + INTEGRATIONS.length, failing.length + ' failing', failing.length ? 'red' : ''],
    ['Average latency', Math.round(sum(INTEGRATIONS, i => i.latency) / INTEGRATIONS.length) + ' ms', 'Across ten services', ''],
    ['Credentials valid', API_CREDS.filter(c => c.state === 'Valid').length + '/' + API_CREDS.length, API_CREDS.filter(c => c.state !== 'Valid').length + ' need attention', 'red'],
    ['Tests passed', INTEGRATION_TESTS.filter(t => t.result === 'Pass').length + '/' + INTEGRATION_TESTS.length, 'Last sweep ' + INTEGRATION_TESTS[0].when.slice(-5), ''],
    ['Payment rails', '2', 'Airtel Money · TNM Mpamba', ''],
    ['Uptime (avg)', (sum(INTEGRATIONS, i => i.uptime) / INTEGRATIONS.length).toFixed(2) + '%', 'Last 30 days', '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join('');

  const kinds = ['Auth', 'REST API', 'Email', 'SMS', 'Payments', 'Storage', 'Monitoring', 'Analytics'];
  el('kindGrid').innerHTML = kinds.map(k => {
    const list = INTEGRATIONS.filter(i => i.kind === k);
    const bad = list.some(i => i.status === 'Failing');
    return `<div class="scell"><div class="dotbg ${bad ? 'crit' : 'ok'}"></div>
      <div class="stat-dot ${bad ? 'crit' : 'ok'}"></div>
      <div style="flex:1"><div style="font-size:10.5px;font-weight:800">${esc(k)}</div>
        <div class="qhint">${list.map(i => esc(i.name)).join(' · ') || 'Not configured'}</div></div>
      <div style="text-align:right"><div style="font-size:10px;font-weight:800">${bad ? 'Failing' : 'Connected'}</div></div></div>`;
  }).join('');

  el('tpiBox').innerHTML = INTEGRATIONS.slice(0, 5).map(i =>
    meter(i.name, i.uptime, i.latency + ' ms · ' + i.creds + ' credentials', 100)).join('');

  el('svcPill').textContent = INTEGRATIONS.length + ' services';
  renderTable('svcBody', [
    {k: 'name', label: 'Service'},
    {k: 'kind', label: 'Kind'},
    {k: 'provider', label: 'Provider'},
    {k: 'status', label: 'State', html: v => okBadge(v)},
    {k: 'latency', label: 'Latency', num: true},
    {k: 'uptime', label: 'Uptime', num: true},
    {k: 'creds', label: 'Credentials', html: v => okBadge(v)},
    {k: 'act', label: '', html: (v, r) => `<button class="btn btn-ghost" data-verify="${esc(r.name)}">Verify</button>`}
  ], INTEGRATIONS.filter(i => matchQ(i.name, i.kind, i.provider, i.status)), {sort: 'name', dir: 'asc', pageSize: 8});

  el('itPill').textContent = INTEGRATION_TESTS.filter(t => t.result === 'Pass').length + ' pass';
  renderTable('itBody', [
    {k: 'service', label: 'Service'},
    {k: 'test', label: 'Test'},
    {k: 'ms', label: 'Latency', num: true},
    {k: 'result', label: 'Result', html: v => okBadge(v === 'Pass' ? 'Pass' : v === 'Slow' ? 'Degraded' : 'Fail')},
    {k: 'when', label: 'Ran', html: v => esc(String(v).slice(0, 16))}
  ], INTEGRATION_TESTS, {sort: 'ms', pageSize: 8});

  el('credPill').textContent = API_CREDS.length + ' keys';
  renderTable('credBody', [
    {k: 'name', label: 'Credential'},
    {k: 'scope', label: 'Scope'},
    {k: 'rotated', label: 'Rotated', html: v => fmtShort(v)},
    {k: 'expires', label: 'Expires', html: v => fmtShort(v)},
    {k: 'state', label: 'State', html: v => okBadge(v)},
    {k: 'act', label: '', html: (v, r) => `<button class="btn btn-ghost" data-cred="${esc(r.name)}">Rotate</button>`}
  ], API_CREDS.filter(c => matchQ(c.name, c.service)), {sort: 'expires', dir: 'asc', pageSize: 7});

  el('intGrid').innerHTML =
    chartBox({title: 'Uptime by service', sub: 'Thirty-day availability', type: 'bar', h: 190,
      cats: INTEGRATIONS.map(i => i.name.split(' ')[0]),
      series: [{name: 'Uptime %', data: INTEGRATIONS.map(i => i.uptime)}], value: 'avg ' + (sum(INTEGRATIONS, i => i.uptime) / INTEGRATIONS.length).toFixed(2) + '%'}) +
    chartBox({title: 'Latency by service', sub: 'Round-trip milliseconds', type: 'bar', h: 190,
      cats: INTEGRATIONS.map(i => i.name.split(' ')[0]),
      series: [{name: 'ms', data: INTEGRATIONS.map(i => i.latency)}], value: 'ms'});
}
</script>
