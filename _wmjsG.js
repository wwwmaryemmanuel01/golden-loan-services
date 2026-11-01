<script>
/* ============================================================
   WEBSITE MANAGEMENT & CONNECTIONS (7/7)
   13 · Performance   14 · Diagnostics   15 · Deployment
   16 · Alerts        17 · Access        18 · Reports
   19 · Configuration 20 · Change history — plus the wiring
   ============================================================ */

/* ===================== 13 · WEBSITE PERFORMANCE ===================== */
function renderPerformance(){
  const slow = PAGE_PERF.filter(p => p.load > 2000);
  const avgLoad = Math.round(sum(PAGE_PERF, p => p.load) / PAGE_PERF.length);
  el('perfPill').className = 'badge ' + (slow.length ? 'b-warn' : 'b-ok');
  el('perfPill').textContent = avgLoad + ' ms average';
  el('perfKpis').innerHTML = [
    ['Average page load', num(avgLoad) + ' ms', 'Across ' + PAGE_PERF.length + ' pages', ''],
    ['Slowest page', (PAGE_PERF.slice().sort((a, b) => b.load - a.load)[0] || {}).page || '—',
      (PAGE_PERF.slice().sort((a, b) => b.load - a.load)[0] || {}).load + ' ms', 'red'],
    ['Best Lighthouse score', Math.max(...PAGE_PERF.map(p => p.score)), (PAGE_PERF.slice().sort((a, b) => b.score - a.score)[0] || {}).page || '', ''],
    ['API p95', num(wmStats().avgP95) + ' ms', 'Across ' + API_ENDPOINTS.length + ' routes', ''],
    ['Uptime (14 days)', r1(sum(UPTIME, u => u.uptime) / UPTIME.length) + '%', num(sum(UPTIME, u => u.downMin)) + ' minutes down', ''],
    ['Resources in budget', '5 of 6', 'Memory is the only amber', 'red']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join('');

  el('perfGrid').innerHTML = [
    chartBox({title:'Page load by page', sub:'Milliseconds to interactive', value:num(avgLoad) + ' ms',
      chart: chart({type:'bar', cats:PAGE_PERF.map(p => p.page === '/' ? 'home' : p.page.slice(1)), h:190,
        series:[{name:'Load ms', data:PAGE_PERF.map(p => p.load), colour:'#2F6FED'}]})}),
    chartBox({title:'Largest contentful paint', sub:'Milliseconds, budget 2500', value:Math.max(...PAGE_PERF.map(p => p.lcp)) + ' ms',
      chart: chart({type:'bar', cats:PAGE_PERF.map(p => p.page === '/' ? 'home' : p.page.slice(1)), h:190,
        series:[{name:'LCP ms', data:PAGE_PERF.map(p => p.lcp), colour:'#C9A227'}]})}),
    chartBox({title:'Lighthouse score', sub:'Out of 100', value:Math.round(sum(PAGE_PERF, p => p.score) / PAGE_PERF.length),
      chart: chart({type:'line', cats:PAGE_PERF.map(p => p.page === '/' ? 'home' : p.page.slice(1)), h:190,
        series:[{name:'Score', data:PAGE_PERF.map(p => p.score), colour:'#1E9E6A'}]})})
  ].join('');

  el('ppPill').textContent = slow.length ? slow.length + ' above 2 s' : 'All inside budget';
  renderTable('ppBody', [
    {k:'page', label:'Page'},
    {k:'load', label:'Load (ms)', num:true},
    {k:'lcp', label:'LCP (ms)', num:true},
    {k:'cls', label:'CLS', num:true},
    {k:'size', label:'Size (KB)', num:true},
    {k:'score', label:'Lighthouse', num:true},
    {k:'verdict', label:'Verdict', html:(v, r) => okBadge(r.score >= 90 ? 'Pass' : r.score >= 80 ? 'Review' : 'Fail')}
  ], PAGE_PERF.filter(p => matchQ(p.page)), {sort:'load', pageSize:8});

  el('apiPerfBox').innerHTML = API_ENDPOINTS.slice().sort((a, b) => b.p95 - a.p95).slice(0, 8).map(e =>
    `<div class="meterrow"><div style="font-size:9.5px;font-weight:800;min-width:126px">${esc(e.path)}</div>
      <div style="flex:1">${meter(e.path, clamp(100 - pct(e.p95, 1200) * 100, 0, 100), 85, 60,
        'p95 ' + e.p95 + ' ms over ' + num(e.calls) + ' calls · ' + e.errors + ' errors')}</div></div>`).join('');

  renderTable('dbpBody', [
    {k:'query', label:'Query'},
    {k:'avg', label:'Avg (ms)', num:true},
    {k:'p95', label:'p95 (ms)', num:true},
    {k:'calls', label:'Calls', num:true}
  ], QUERY_PERF, {sort:'p95', pageSize:6});

  el('availHistBox').innerHTML = chart({type:'line', cats:UPTIME.map(u => u.date.slice(5)), h:200,
    series:[{name:'Uptime %', data:UPTIME.map(u => u.uptime), colour:'#1E9E6A'}]})
    + `<div class="strip" style="margin-top:8px">
        <div><div class="sl">Best day</div><div class="sv">100%</div></div>
        <div><div class="sl">Worst day</div><div class="sv">${Math.min(...UPTIME.map(u => u.uptime))}%</div></div>
        <div><div class="sl">Minutes down</div><div class="sv">${num(sum(UPTIME, u => u.downMin))}</div></div>
      </div>`;

  const codes = ['502','500','504','429','400','403'];
  el('failBox').innerHTML = `<div class="strip">
      ${codes.map(c => `<div><div class="sl">HTTP ${c}</div><div class="sv">${num(sum(FAILED_REQUESTS.filter(r => String(r.code) === c), r => r.count))}</div></div>`).join('')}
    </div>
    <div class="qhint" style="margin-top:7px">${num(sum(FAILED_REQUESTS, r => r.count))} failed requests in the period, from three origins and seven routes.</div>`;

  el('resBox').innerHTML = RESOURCES.map(r => {
    const p = /%/.test(r.unit) ? r.value : Math.min(100, r.value / (r.metric.indexOf('Storage') >= 0 ? 1024 : r.metric.indexOf('Database') >= 0 ? 82 : 1000) * 100);
    return `<div class="meterrow"><div style="font-size:9.5px;font-weight:800;min-width:132px">${esc(r.metric)}</div>
      <div style="flex:1">${meter(r.metric, clamp(100 - p, 0, 100), 60, 40, r.value + ' ' + r.unit + ' · ' + r.note)}</div></div>`;
  }).join('');

  el('mobPill').textContent = MOBILE_CHECKS.filter(m => m.result === 'Pass').length + '/' + MOBILE_CHECKS.length + ' pass';
  renderTable('mobBody', [
    {k:'page', label:'Page'},
    {k:'result', label:'Result', html:v => okBadge(v)},
    {k:'note', label:'What was checked'}
  ], MOBILE_CHECKS, {sort:'page', pageSize:6});

  el('perfReportBox').innerHTML = [
    ['Pages measured', num(PAGE_PERF.length)],
    ['API routes timed', num(API_ENDPOINTS.length)],
    ['Queries profiled', num(QUERY_PERF.length)],
    ['Days of uptime', num(UPTIME.length)]
  ].map(([l, v]) => `<div><div class="sl">${l}</div><div class="sv">${v}</div></div>`).join('');
}

/* ===================== 14 · CONNECTION DIAGNOSTICS ===================== */
function renderDiagnostics(){
  const pass = DIAG_TESTS.filter(t => t.status === 'Pass').length;
  el('diagPill').className = 'badge ' + (pass === DIAG_TESTS.length ? 'b-ok' : 'b-warn');
  el('diagPill').textContent = pass + ' of ' + DIAG_TESTS.length + ' passing';
  el('diagKpis').innerHTML = [
    ['Probes passing', `${pass} of ${DIAG_TESTS.length}`, DIAG_TESTS.filter(t => t.status !== 'Pass').map(t => t.name).join(', ') || 'Everything responded', pass === DIAG_TESTS.length ? '' : 'red'],
    ['Last sweep', 'Today 08:10', 'Run the suite again any time', ''],
    ['Fastest probe', num(Math.min(...DIAG_TESTS.map(t => t.ms || 9999))) + ' ms', 'DNS and TLS', ''],
    ['Slowest probe', num(Math.max(...DIAG_TESTS.map(t => t.ms))) + ' ms', 'External integrations', 'red'],
    ['Fix actions open', num(TROUBLESHOOT.length), 'Ranked by priority', 'red'],
    ['Probes run today', num(DIAG_TESTS.filter(t => t.lastRun >= TODAY).length * 3), 'Each service is checked every five minutes', '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join('');

  el('diagList').innerHTML = DIAG_TESTS.map(t => `<div class="diagrow">
      <div class="dstate ${t.status === 'Pass' ? 'pass' : t.status === 'Fail' ? 'fail' : 'idle'}"></div>
      <div class="dmain"><div class="dn">${esc(t.name)} · ${esc(t.target)}</div>
        <div class="dd">${esc(t.detail)}</div></div>
      <div style="font-size:9px;color:var(--muted);min-width:54px;text-align:right">${t.ms ? num(t.ms) + ' ms' : '—'}</div>
      <button class="btn btn-ghost" data-diag="${t.id}">Run</button>
    </div>`).join('');

  el('troPill').className = 'badge ' + (TROUBLESHOOT.length ? 'b-warn' : 'b-ok');
  el('troPill').textContent = TROUBLESHOOT.length + ' actions';
  el('troubleBox').innerHTML = TROUBLESHOOT.map(t => `<div class="risk">
      <div><div class="rn">${esc(t.action)}</div>
        <div class="rs">Owner ${esc(staffName(t.owner))} · ${esc(t.priority)}</div></div>
      <div class="rv">${badge(t.priority, sevTone(t.priority))}
        <button class="btn btn-ghost" data-goto="${esc(t.section)}">Go</button></div>
    </div>`).join('') || '<div class="empty">Every probe passed — nothing to fix.</div>';

  renderTable('dtBody', [
    {k:'id', label:'Probe'}, {k:'name', label:'Test'}, {k:'target', label:'Target'},
    {k:'status', label:'Result', html:v => okBadge(v)},
    {k:'ms', label:'Took (ms)', num:true},
    {k:'lastRun', label:'Last run', html:v => String(v).slice(0, 10) === TODAY ? 'Today ' + String(v).slice(11) : fmtDate(v)},
    {k:'detail', label:'What it saw'}
  ], DIAG_TESTS, {sort:'id', pageSize:8});
}
function runDiag(id){
  const t = DIAG_TESTS.find(x => x.id === id);
  if(!t) return;
  t.lastRun = TODAY + ' ' + new Date().toTimeString().slice(0, 5);
  t.ms = Math.max(18, t.ms + Math.round(Math.random() * 40) - 20);
  if(t.id === 'DGN-04'){
    const sms = INTEGRATIONS.find(i => /SMS/.test(i.name));
    t.status = sms && sms.status === 'Connected' ? 'Pass' : 'Fail';
    t.detail = t.status === 'Pass' ? 'otp-send and otp-verify both returned 200' : 'otp-send returned 503 from the SMS gateway';
    t.ms = t.status === 'Pass' ? 188 : 0;
  } else if(t.id === 'DGN-07'){
    const bad = INTEGRATIONS.filter(i => i.status === 'Failing');
    t.status = bad.length ? 'Fail' : 'Pass';
    t.detail = bad.length ? bad.map(b => b.name + ' ' + b.status.toLowerCase()).join('; ') : 'All ten services responded';
  } else if(t.id === 'DGN-05'){
    const bad = API_ENDPOINTS.filter(e => e.status !== 'Healthy');
    t.status = bad.some(e => e.status === 'Failing') ? 'Fail' : 'Pass';
    t.detail = `${API_ENDPOINTS.length - bad.length} healthy, ${bad.length} degraded (${bad.map(e => e.path).join(', ') || 'none'})`;
  } else {
    t.status = 'Pass';
  }
  renderDiagnostics(); renderStats();
  toast(t.name + ': ' + t.status + (t.ms ? ' · ' + t.ms + ' ms' : ''), t.status === 'Pass' ? 'ok' : 'info');
}
function runAllDiag(){
  DIAG_TESTS.forEach(t => runDiagQuiet(t));
  TROUBLESHOOT.length = 0;
  DIAG_TESTS.filter(t => t.status !== 'Pass').forEach(t => TROUBLESHOOT.push({
    priority: t.id === 'DGN-07' ? 'Critical' : 'High',
    action: 'Re-check ' + t.name.toLowerCase() + ' and clear the failure from the affected section',
    owner: 'STF-001', section: t.id === 'DGN-04' ? 's9' : t.id === 'DGN-07' ? 's8' : 's6'}));
  renderDiagnostics(); renderStats();
  toast('Diagnostics complete: ' + DIAG_TESTS.filter(t => t.status === 'Pass').length + ' of ' + DIAG_TESTS.length + ' passed');
}
function runDiagQuiet(t){
  t.lastRun = TODAY + ' ' + new Date().toTimeString().slice(0, 5);
  t.ms = Math.max(18, (t.ms || 60) + Math.round(Math.random() * 30) - 15);
  if(t.id === 'DGN-04'){
    const sms = INTEGRATIONS.find(i => /SMS/.test(i.name));
    t.status = sms && sms.status === 'Connected' ? 'Pass' : 'Fail';
  } else if(t.id === 'DGN-07'){
    t.status = INTEGRATIONS.some(i => i.status === 'Failing') ? 'Fail' : 'Pass';
  } else if(t.id === 'DGN-05'){
    t.status = API_ENDPOINTS.some(e => e.status === 'Failing') ? 'Fail' : 'Pass';
  } else { t.status = 'Pass'; }
}

/* ===================== 15 · DEPLOYMENT ===================== */
function renderDeployment(){
  const cur = RELEASES.find(r => r.status === 'Live') || RELEASES[0];
  const latest = RELEASES[0];
  el('relPill').className = 'badge ' + (cur.status === 'Live' ? 'b-ok' : 'b-warn');
  el('relPill').textContent = 'v' + cur.version;
  el('relKpis').innerHTML = [
    ['Production version', 'v' + cur.version, 'Deployed ' + fmtDate(cur.when) + ' by ' + staffName(cur.by), ''],
    ['Releases on record', num(RELEASES.length), RELEASES.filter(r => r.env === 'Production').length + ' to production', ''],
    ['Rollbacks', num(RELEASES.filter(r => r.status === 'Rolled back').length), 'Last ' + fmtDate((ROLLBACKS[0] || {}).when || TODAY), ''],
    ['Failed builds', num(RELEASES.filter(r => r.status === 'Failed').length), 'Caught before production', ''],
    ['Environment checks', ENV_CHECKS.filter(e => e.status === 'Set').length + ' of ' + ENV_CHECKS.length, ENV_CHECKS.filter(e => e.status !== 'Set').map(e => e.key).join(', ') || 'All set', ENV_CHECKS.some(e => e.status !== 'Set') ? 'red' : ''],
    ['Pre-deploy checks', PRE_DEPLOY.filter(p => p.status === 'Pass').length + ' of ' + PRE_DEPLOY.length, PRE_DEPLOY.filter(p => p.status !== 'Pass').map(p => p.check).join(', ') || 'All green', PRE_DEPLOY.some(p => p.status === 'Fail') ? 'red' : '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join('');

  el('curVerPill').className = 'badge b-ok';
  el('curVerPill').textContent = 'Live';
  el('curVerBox').innerHTML = `<div class="pfields" style="grid-template-columns:1fr 1fr">
      ${kvRow('Version', 'v' + cur.version)}
      ${kvRow('Environment', esc(cur.env))}
      ${kvRow('Deployed', fmtDate(cur.when))}
      ${kvRow('By', esc(staffName(cur.by)))}
      ${kvRow('Commit', esc((DEPLOYMENTS[0] || {}).commit || '—'))}
      ${kvRow('Production URL', esc(WM_SET.publicUrl))}
      ${kvRow('Build time', esc((DEPLOYMENTS[0] || {}).took || '—'))}
      ${kvRow('Traffic', '100% on this release')}
    </div>`;

  el('depStatePill').className = 'badge ' + (latest.status === 'Live' ? 'b-ok' : 'b-warn');
  el('depStatePill').textContent = latest.status;
  el('latestVerBox').innerHTML = `<div class="pfields" style="grid-template-columns:1fr 1fr">
      ${kvRow('Latest build', 'v' + latest.version)}
      ${kvRow('Environment', esc(latest.env))}
      ${kvRow('Status', okBadge(latest.status))}
      ${kvRow('Notes', esc(latest.notes))}
      ${kvRow('Pre-deploy checks', PRE_DEPLOY.filter(p => p.status === 'Pass').length + ' of ' + PRE_DEPLOY.length + ' pass')}
      ${kvRow('Environment variables', ENV_CHECKS.filter(e => e.status === 'Set').length + ' of ' + ENV_CHECKS.length + ' set')}
    </div>
    <div class="qhint" style="margin-top:6px">A production deploy is refused while any pre-deploy check is red.</div>`;

  el('notesBox').innerHTML = RELEASES.slice(0, 5).map(r => `<div class="checkrow">
      <div class="ck ${r.status === 'Live' ? 'pass' : r.status === 'Failed' || r.status === 'Rolled back' ? 'fail' : 'warn'}">${r.status === 'Live' ? '✓' : r.status === 'Failed' || r.status === 'Rolled back' ? '✕' : '–'}</div>
      <div style="flex:1"><div style="font-size:10px;font-weight:800">v${esc(r.version)} · ${esc(r.env)}</div>
        <div class="qhint">${esc(r.notes)} · ${fmtDate(r.when)}</div></div>
      <div>${okBadge(r.status)}</div>
    </div>`).join('');

  el('preBox').innerHTML = PRE_DEPLOY.map(p => `<div class="checkrow">
      <div class="ck ${p.status === 'Pass' ? 'pass' : p.status === 'Review' ? 'warn' : 'fail'}">${p.status === 'Pass' ? '✓' : '!'}</div>
      <div style="flex:1"><div style="font-size:10px;font-weight:800">${esc(p.check)}</div>
        <div class="qhint">${esc(p.detail)}</div></div>
      <div>${okBadge(p.status)}</div>
    </div>`).join('');

  el('relRowPill').textContent = RELEASES.length + ' releases';
  renderTable('relBody', [
    {k:'version', label:'Version'}, {k:'env', label:'Environment'},
    {k:'when', label:'Released', html:v => fmtDate(v)},
    {k:'status', label:'Status', html:v => okBadge(v)},
    {k:'notes', label:'Notes'},
    {k:'act', label:'', html:(v, r) => r.status === 'Live'
      ? '<span class="qhint">current</span>'
      : `<button class="btn btn-ghost" data-rollback="${esc(r.version)}">Roll back</button>`}
  ], RELEASES, {sort:'when', pageSize:7});

  el('envPill').className = 'badge ' + (ENV_CHECKS.every(e => e.status === 'Set') ? 'b-ok' : 'b-warn');
  el('envPill').textContent = ENV_CHECKS.filter(e => e.status === 'Set').length + '/' + ENV_CHECKS.length + ' set';
  renderTable('envBody', [
    {k:'key', label:'Variable'}, {k:'environments', label:'Environments'},
    {k:'status', label:'State', html:v => okBadge(v)},
    {k:'note', label:'Note'}
  ], ENV_CHECKS, {sort:'key', pageSize:7});

  const failed = RELEASES.filter(r => r.status === 'Failed');
  el('fdPill').className = 'badge ' + (failed.length ? 'b-warn' : 'b-ok');
  el('fdPill').textContent = failed.length + ' failed build' + (failed.length === 1 ? '' : 's');
  el('fdBox').innerHTML = failed.map(r => `<div class="risk">
      <div><div class="rn">v${esc(r.version)} · ${esc(r.env)}</div>
        <div class="rs">${esc(r.notes)} · ${fmtDate(r.when)}</div></div>
      <div class="rv">${badge('Failed', 'b-crit')}</div>
    </div>`).join('') || '<div class="empty">No failed builds on record.</div>';

  renderTable('rbBody', [
    {k:'version', label:'Rolled back'}, {k:'restored', label:'Restored'},
    {k:'when', label:'When', html:v => fmtDate(v)},
    {k:'took', label:'Took'}, {k:'reason', label:'Reason'}
  ], ROLLBACKS, {sort:'when', pageSize:3});
}
function deployTo(env){
  if(env === 'Production'){
    const blocking = PRE_DEPLOY.filter(p => p.status === 'Fail');
    if(blocking.length) return toast('Blocked: ' + blocking.map(p => p.check).join(', ') + ' must pass first.', 'info');
  }
  const v = bumpVersion((RELEASES[0] || {version: WM_SET.version}).version);
  RELEASES.forEach(r => { if(r.status === 'Live' && env === 'Production') r.status = 'Superseded'; });
  RELEASES.unshift({version: v, when: TODAY, env, status: env === 'Production' ? 'Live' : 'Superseded',
    notes: 'Release from the connection console', by: 'STF-001'});
  DEPLOYMENTS.unshift({id: 'DEP-' + (2413 + DEPLOYMENTS.length), when: TODAY + ' ' + new Date().toTimeString().slice(0, 5),
    version: v, env, status: env === 'Production' ? 'Live' : 'Superseded', took: '2 m 12 s', by: 'STF-001', commit: 'new'});
  if(env === 'Production'){ WM_SET.version = v; WM_SITE.publishedOn = TODAY; }
  logChange('Deployment', env + ' release', 'v' + (RELEASES[1] || {}).version, 'v' + v);
  renderDeployment(); renderHosting(); renderChanges(); renderStats();
  toast('v' + v + ' deployed to ' + env.toLowerCase());
}
function rollbackTo(version){
  const target = RELEASES.find(r => r.version === version);
  if(!target) return;
  const cur = RELEASES.find(r => r.status === 'Live');
  RELEASES.forEach(r => { if(r.status === 'Live') r.status = 'Rolled back'; });
  target.status = 'Live';
  ROLLBACKS.unshift({version: (cur || {}).version || '—', when: TODAY, reason: 'Rolled back from the connection console',
    took: '1 m 52 s', by: 'STF-001', restored: version});
  WM_SET.version = version;
  logChange('Deployment', 'Rollback', 'v' + ((cur || {}).version || '—'), 'v' + version);
  renderDeployment(); renderHosting(); renderChanges(); renderStats();
  toast('Rolled back to v' + version);
}
function runPreDeployChecks(){
  PRE_DEPLOY.forEach(p => {
    if(p.check === 'Environment variables'){
      const bad = ENV_CHECKS.filter(e => e.status !== 'Set');
      p.status = bad.length ? 'Fail' : 'Pass';
      p.detail = bad.length ? bad.map(e => e.key).join(', ') + ' not set' : 'Every variable is set';
    }
  });
  const failing = PRE_DEPLOY.filter(p => p.status === 'Fail');
  renderDeployment();
  toast(failing.length ? 'Pre-deploy blocked: ' + failing.map(p => p.check).join(', ') : 'Pre-deploy checks all pass',
    failing.length ? 'info' : 'ok');
}

/* ===================== 16 · CONNECTION ALERTS ===================== */
function renderAlerts(){
  const open = ALERTS.filter(a => a.status === 'Open');
  const crit = ALERTS.filter(a => a.severity === 'Critical' && a.status !== 'Closed');
  el('alertPill').className = 'badge ' + (open.length ? 'b-warn' : 'b-ok');
  el('alertPill').textContent = open.length + ' open';
  el('alertKpis').innerHTML = [
    ['Open alerts', num(open.length), open.map(a => a.kind).slice(0, 2).join(', ') || 'Nothing open', open.length ? 'red' : ''],
    ['Critical', num(crit.length), crit.map(a => a.target).join(', ') || 'None', crit.length ? 'red' : ''],
    ['Resolved', num(ALERTS.filter(a => /Resolved|Closed/.test(a.status)).length), 'Closed or resolved this period', ''],
    ['Alert rules on', num(ALERT_RULES.filter(r => r.on).length) + ' of ' + ALERT_RULES.length, 'Rules that are armed', ''],
    ['Channels wired', '3', 'PagerDuty, email and Slack', ''],
    ['Last alert', 'Today 07:20', 'Authentication failure spike', '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join('');

  el('alertGrid').innerHTML = [
    chartBox({title:'Alerts by kind', sub:'What has raised a flag', value:num(ALERTS.length),
      chart: chart({type:'donut', cats:[...new Set(ALERTS.map(a => a.kind))], h:190, colours:PALETTE,
        series:[{data:[...new Set(ALERTS.map(a => a.kind))].map(k => ALERTS.filter(a => a.kind === k).length)}]})}),
    chartBox({title:'Alerts by severity', sub:'How serious the load is', value:num(crit.length) + ' critical',
      chart: chart({type:'bar', cats:['Critical','High','Medium','Low'], h:190,
        series:[{name:'Alerts', data:['Critical','High','Medium','Low'].map(s => ALERTS.filter(a => a.severity === s).length), colour:'#D93F3F'}]})})
  ].join('');

  el('alRowPill').textContent = ALERTS.length + ' alerts';
  renderTable('alBody', [
    {k:'id', label:'Alert'}, {k:'kind', label:'Kind'}, {k:'target', label:'Target'},
    {k:'severity', label:'Severity', html:v => badge(v, sevTone(v))},
    {k:'raised', label:'Raised', html:v => String(v).slice(0, 10) === TODAY ? 'Today ' + String(v).slice(11) : fmtDate(v)},
    {k:'status', label:'Status', html:v => okBadge(v)},
    {k:'act', label:'', html:(v, r) => r.status === 'Open'
      ? `<button class="btn btn-ghost" data-alert="${esc(r.id)}|ack">Acknowledge</button>
         <button class="btn btn-ghost" data-alert="${esc(r.id)}|resolve">Resolve</button>`
      : `<button class="btn btn-ghost" data-alert="${esc(r.id)}|reopen">Reopen</button>`}
  ], ALERTS.filter(a => passLane(a) && passSeverity(a) && matchQ(a.kind, a.target)), {sort:'raised', pageSize:8});

  el('rulePill').textContent = ALERT_RULES.filter(r => r.on).length + ' armed';
  renderTable('ruleBody', [
    {k:'kind', label:'Alert kind'}, {k:'condition', label:'Condition'},
    {k:'channel', label:'Channel'}, {k:'recipients', label:'Recipients'},
    {k:'on', label:'Armed', html:(v, r) => `<button class="btn btn-ghost" data-rule="${esc(r.kind)}">${v ? 'Armed' : 'Muted'}</button>`}
  ], ALERT_RULES, {sort:'kind', pageSize:8});

  el('chanBox').innerHTML = [
    ['PagerDuty', 'On-call rota', 'Critical and high alerts, 24 × 7'],
    ['Email', 'administrator@goldenloan.mw', 'Every alert, batched hourly at night'],
    ['Slack', '#gfs-connections', 'API errors and deployment outcomes'],
    ['SMS', '+265 999 771 200', 'Critical only, business hours']
  ].map(([c, to, note]) => `<div class="checkrow"><div class="ck pass">✓</div>
      <div style="flex:1"><div style="font-size:10px;font-weight:800">${esc(c)} → ${esc(to)}</div>
      <div class="qhint">${esc(note)}</div></div>${okBadge('Connected')}</div>`).join('');

  renderTable('alhBody', [
    {k:'id', label:'Alert'}, {k:'kind', label:'Kind'},
    {k:'raised', label:'Raised', html:v => fmtDate(v)},
    {k:'status', label:'Outcome', html:v => okBadge(v)}
  ], ALERTS.filter(a => /Resolved|Closed/.test(a.status)).concat(ALERTS.filter(a => a.status === 'Monitoring')),
    {sort:'raised', pageSize:4});
}
function alertAction(id, act){
  const a = ALERTS.find(x => x.id === id);
  if(!a) return;
  if(act === 'ack'){ a.status = 'Monitoring'; }
  else if(act === 'resolve'){ a.status = 'Resolved'; }
  else { a.status = 'Open'; }
  logChange('Alerts', a.id + ' ' + a.kind, 'Open', a.status);
  renderAlerts(); renderOverview(); renderChanges();
  toast(a.id + ' · ' + a.status);
}
function toggleRule(kind){
  const r = ALERT_RULES.find(x => x.kind === kind);
  if(!r) return;
  r.on = !r.on;
  logChange('Configuration', 'Alert rule ' + kind, r.on ? 'Muted' : 'Armed', r.on ? 'Armed' : 'Muted');
  renderAlerts(); renderChanges();
  toast(kind + ' ' + (r.on ? 'armed' : 'muted'));
}

/* ===================== 17 · ACCESS AND PERMISSIONS ===================== */
function renderPermissions(){
  const holders = WM_ROLES.filter(r => WM_PERMS[r].some(v => v === 1));
  el('permPill').className = 'badge b-ok';
  el('permPill').textContent = WM_ROLES.length + ' roles';
  el('permKpis').innerHTML = [
    ['Roles with website access', num(holders.length), holders.join(', '), ''],
    ['Capabilities', num(WM_CAPS.length), 'From content to deployment', ''],
    ['Grants in force', num(sum(WM_ROLES, r => sum(WM_PERMS[r], v => v))), 'Role and capability pairs', ''],
    ['Awaiting approval', num(WM_APPROVALS.filter(a => a.status !== 'Approved').length), 'Configuration changes held', WM_APPROVALS.some(a => a.status !== 'Approved') ? 'red' : ''],
    ['Changes recorded', num(WM_CHANGES.length), 'Every change keeps its previous value', ''],
    ['Super admins', num(WM_ROLES.filter(r => WM_PERMS[r][5] === 1).length), 'May change system configuration', '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join('');

  el('permHead').innerHTML = '<tr><th>Capability</th>' + WM_ROLES.map(r => `<th class="num">${esc(r)}</th>`).join('') + '</tr>';
  el('permBody').innerHTML = WM_CAPS.map((cap, ci) => `<tr class="rowlink" data-cap="${ci}">
      <td style="font-weight:800">${esc(cap)}</td>
      ${WM_ROLES.map(role => `<td class="num">
        <button class="btn btn-ghost" style="padding:2px 7px;font-size:9.5px" data-perm="${esc(role)}|${ci}">
          ${WM_PERMS[role][ci] ? '✓' : '—'}</button></td>`).join('')}
    </tr>`).join('');

  const roleDetail = (capIndexes, note) => WM_ROLES.map(role => {
    const on = capIndexes.every(i => WM_PERMS[role][i] === 1);
    return `<div class="checkrow"><div class="ck ${on ? 'pass' : 'warn'}">${on ? '✓' : '–'}</div>
      <div style="flex:1"><div style="font-size:10px;font-weight:800">${esc(role)}</div>
      <div class="qhint">${esc(staffName(WM_ROLE_STAFF[role] || 'STF-001'))}</div></div>
      ${badge(on ? 'Allowed' : 'Not granted', on ? 'b-ok' : 'b-gray')}</div>`;
  }).join('') + `<div class="qhint" style="margin-top:6px">${esc(note)}</div>`;

  el('edPermBox').innerHTML = roleDetail([0, 1], 'Content editors may write and review; publishing needs an administrator.');
  el('intPermBox').innerHTML = roleDetail([2], 'Only administrators may add, edit or remove a connection.');
  el('depPermBox').innerHTML = roleDetail([3], 'Production deploys are limited to administrators with a pre-deploy pass.');
  el('testPermBox').innerHTML = roleDetail([4], 'Finance and auditors may run read-only probes.');

  el('aprPill').textContent = WM_APPROVALS.filter(a => a.status !== 'Approved').length + ' pending';
  renderTable('aprBody', [
    {k:'id', label:'Request'}, {k:'change', label:'Change'},
    {k:'requested', label:'Requested by', html:v => esc(staffName(v))},
    {k:'when', label:'When', html:v => fmtDate(v)},
    {k:'status', label:'Status', html:v => okBadge(v)},
    {k:'act', label:'', html:(v, r) => r.status === 'Approved'
      ? '<span class="qhint">—</span>'
      : `<button class="btn btn-ghost" data-approve="${esc(r.id)}">Approve</button>`}
  ], WM_APPROVALS, {sort:'when', pageSize:4});

  const cfgRows = WM_CHANGES.filter(c => /Configuration|Integration|Database/.test(c.area));
  renderTable('cfgHistBody', [
    {k:'when', label:'When', html:v => fmtDate(v)},
    {k:'what', label:'Change'},
    {k:'from', label:'Previous'}, {k:'to', label:'Updated'},
    {k:'by', label:'By', html:v => esc(staffName(v))}
  ], cfgRows, {sort:'when', pageSize:6});
}
function togglePerm(role, ci){
  if(!WM_PERMS[role]) return;
  WM_PERMS[role][ci] = WM_PERMS[role][ci] ? 0 : 1;
  logChange('Permissions', WM_CAPS[ci] + ' · ' + role, WM_PERMS[role][ci] ? 'Not granted' : 'Allowed', WM_PERMS[role][ci] ? 'Allowed' : 'Not granted');
  renderPermissions(); renderChanges();
  toast(WM_CAPS[ci] + ' ' + (WM_PERMS[role][ci] ? 'granted to ' : 'withdrawn from ') + role);
}
function approveChange(id){
  const a = WM_APPROVALS.find(x => x.id === id);
  if(!a) return;
  a.status = 'Approved'; a.approver = 'STF-001';
  logChange('Approvals', a.change, 'Awaiting approval', 'Approved');
  renderPermissions(); renderChanges();
  toast(a.id + ' approved');
}

/* ===================== 18 · REPORTS ===================== */
const WM_REPORTS_SPEC = {
  avail: () => ({title: 'Website Availability Report',
    cols: [{label:'Date'},{label:'Uptime %', num:true},{label:'Checks', num:true},{label:'Down (min)', num:true},{label:'Incidents', num:true},{label:'Verdict'}],
    rows: UPTIME.map(u => [fmtDate(u.date), u.uptime, u.checks, u.downMin, u.incidents, u.downMin === 0 ? 'Pass' : 'Review'])}),
  conn: () => ({title: 'Connection Health Report',
    cols: [{label:'Connection'},{label:'Dependency'},{label:'Status'},{label:'Latency (ms)', num:true},{label:'Detail'},{label:'Owner'}],
    rows: [['Public website → backend', 'api.goldenloan.mw', WM_SITE.published ? 'Connected' : 'Offline', 142, 'Forms and content fetches', staffName('STF-001')]]
      .concat(FE_CONNECTIONS.map(c => [c.name, c.target, c.status, c.p95, c.note, staffName('STF-001')]))
      .concat(INTEGRATIONS.slice(0, 8).map(i => [i.name, i.provider, i.status, i.latency, i.kind + ' · credential ' + i.creds, staffName(i.owner)]))}),
  api: () => ({title: 'API Performance Report',
    cols: [{label:'Route'},{label:'Method'},{label:'Group'},{label:'p95 (ms)', num:true},{label:'Calls', num:true},{label:'Errors', num:true},{label:'Status'}],
    rows: API_ENDPOINTS.map(e => [e.path, e.method, e.group, e.p95, e.calls, e.errors, e.status])}),
  db: () => ({title: 'Database Connectivity Report',
    cols: [{label:'Table'},{label:'Rows', num:true},{label:'Size'},{label:'RLS'},{label:'Policy'},{label:'Last write'}],
    rows: TABLES.map(t => [t.table, t.rows, t.size, t.rls, t.policy, fmtDate(t.lastWrite)])}),
  auth: () => ({title: 'Authentication Service Report',
    cols: [{label:'Service'},{label:'Kind'},{label:'Calls (24 h)', num:true},{label:'p95 (ms)', num:true},{label:'Errors', num:true},{label:'Status'}],
    rows: AUTH_SERVICES.map(a => [a.name, a.kind, a.calls24h, a.p95, a.errors, a.status])}),
  deploy: () => ({title: 'Deployment Report',
    cols: [{label:'Deployment'},{label:'Version'},{label:'Environment'},{label:'When'},{label:'Status'},{label:'Build'},{label:'By'}],
    rows: DEPLOYMENTS.map(d => [d.id, d.version, d.env, d.when, d.status, d.took, staffName(d.by)])}),
  errors: () => ({title: 'Website Error Report',
    cols: [{label:'When'},{label:'Where'},{label:'Error'},{label:'Count', num:true},{label:'Severity'},{label:'Status'}],
    rows: PAGE_ERRORS.map(e => [e.when, e.page, e.error, e.count, e.severity, e.status])
      .concat(FE_ERRORS.map(e => [e.when, e.page, e.message, e.count, e.severity, e.status]))
      .concat(FORM_ERRORS.map(e => [e.when, e.form + ' · ' + e.field, e.reason, e.count, e.severity, e.status]))}),
  integrity: () => ({title: 'Integration Reliability Report',
    cols: [{label:'Service'},{label:'Provider'},{label:'Uptime %', num:true},{label:'Latency (ms)', num:true},{label:'Credential'},{label:'Last check'},{label:'Status'}],
    rows: INTEGRATIONS.map(i => [i.name, i.provider, i.uptime, i.latency, i.creds, i.lastCheck, i.status])})
};
function reportData(key){
  const spec = WM_REPORTS_SPEC[key];
  if(!spec) return null;
  const built = spec();
  const meta = WM_REPORTS.find(r => r.key === key) || {};
  return {key, label: meta.title || built.title, title: built.title, cols: built.cols, rows: built.rows};
}
function renderReports(){
  el('repPill').textContent = WM_REPORTS.length + ' reports';
  el('repKpis').innerHTML = [
    ['Reports available', num(WM_REPORTS.length), 'Availability, connections, API, database, auth, deployment, errors, reliability', ''],
    ['Rows available', num(sum(WM_REPORTS, r => r.rows)), 'Generated on demand from the filters', ''],
    ['Exports taken', num(EXPORTS.length), 'CSV, Excel and print', ''],
    ['Formats', '4', 'Preview, CSV, Excel and print/PDF', '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join('');

  el('repCards').innerHTML = WM_REPORTS.map(r => {
    const d = reportData(r.key);
    return `<div class="repcard">
      <div class="rt">${esc(r.title)}</div>
      <div class="rd">${esc(r.desc)}</div>
      <div class="rv">${num(d.rows.length)} rows · ${d.cols.length} columns</div>
      <div class="acts">
        <button class="btn btn-ghost" data-rep="${r.key}" data-fmt="preview">Preview</button>
        <button class="btn btn-ghost" data-rep="${r.key}" data-fmt="csv">CSV</button>
        <button class="btn btn-ghost" data-rep="${r.key}" data-fmt="xlsx">Excel</button>
        <button class="btn btn-ghost" data-rep="${r.key}" data-fmt="pdf">PDF</button>
      </div></div>`;
  }).join('');

  if(el('expPill')) el('expPill').textContent = EXPORTS.length;
  renderExportHistory();
}
function runReport(key, fmt){
  const d = reportData(key);
  if(!d) return toast('Unknown report.', 'info');
  if(fmt === 'preview'){
    openModal(d.label, `${num(d.rows.length)} rows · ${filterLine()}`,
      `${brandHtml(d.label, filterLine())}
       <div class="tblwrap" style="max-height:330px"><table class="tbl2 dense">
         <thead><tr>${d.cols.map(c => `<th${c.num ? ' class="num"' : ''}>${esc(c.label)}</th>`).join('')}</tr></thead>
         <tbody>${d.rows.slice(0, 40).map(r => `<tr>${r.map(v => `<td>${esc(v)}</td>`).join('')}</tr>`).join('')}</tbody>
       </table></div>
       <div class="qhint">Showing ${Math.min(40, d.rows.length)} of ${num(d.rows.length)} rows · ${esc(filterLine())}</div>`,
      [{label:'Download CSV', act:() => { closeModal(); runReport(key, 'csv'); }}, {label:'Close', act:'close'}]);
    return;
  }
  if(fmt === 'csv'){
    downloadFile('website-' + key + '-' + TODAY + '.csv', 'text/csv;charset=utf-8',
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
    downloadFile('website-' + key + '-' + TODAY + '.xlsx',
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
  const all = Object.keys(WM_REPORTS_SPEC).map(reportData).filter(Boolean);
  if(fmt === 'csv'){
    const parts = [filterLine()];
    all.forEach(d => { parts.push('', d.label.toUpperCase()); parts.push(toCsv([d.cols.map(c => c.label)].concat(d.rows))); });
    downloadFile('website-pack-' + TODAY + '.csv', 'text/csv;charset=utf-8', '\ufeff' + parts.join('\r\n'));
    logExport('Connections pack', 'CSV', sum(all, d => d.rows.length));
    renderReports(); return;
  }
  if(fmt === 'xlsx'){
    const width = Math.max(...all.map(d => d.cols.length));
    const pad = r => r.concat(Array(Math.max(0, width - r.length)).fill(''));
    const rows = [];
    all.forEach(d => {
      rows.push([d.label.toUpperCase()].concat(Array(width - 1).fill('')));
      rows.push(pad(d.cols.map(c => c.label)));
      d.rows.forEach(r => rows.push(pad(r.map(v => String(v)))));
      rows.push(Array(width).fill(''));
    });
    const cols = Array.from({length: width}, (_, i) => ({label: i === 0 ? 'Connections pack' : ''}));
    downloadFile('website-pack-' + TODAY + '.xlsx',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      xlsxBytes('Connections pack', cols, rows));
    logExport('Connections pack', 'Excel', rows.length);
    renderReports(); return;
  }
  const html = brandHtml('Connections pack', filterLine()) + all.map(d => `
    <h1 style="margin-top:14px">${esc(d.label)}</h1>
    <table style="width:100%;border-collapse:collapse;font-size:9.5px">
      <thead><tr>${d.cols.map(c => `<th style="text-align:left;border-bottom:1px solid #E6E8EE;padding:4px">${esc(c.label)}</th>`).join('')}</tr></thead>
      <tbody>${d.rows.map(r => `<tr>${r.map(v => `<td style="border-bottom:1px dashed #EDEFF4;padding:3px">${esc(v)}</td>`).join('')}</tr>`).join('')}</tbody>
    </table>`).join('');
  doPrint('Connections pack', html);
  logExport('Connections pack', 'PDF', sum(all, d => d.rows.length));
  renderReports();
}
function runPerfReport(kind, fmt){
  if(kind === 'pages'){
    const cols = [{label:'Page'},{label:'Load (ms)', num:true},{label:'LCP (ms)', num:true},{label:'CLS', num:true},{label:'Size (KB)', num:true},{label:'Lighthouse', num:true}];
    const rows = PAGE_PERF.map(p => [p.page, p.load, p.lcp, p.cls, p.size, p.score]);
    if(fmt === 'csv') downloadFile('website-performance-pages-' + TODAY + '.csv', 'text/csv;charset=utf-8',
      '\ufeff' + filterLine() + '\r\n' + toCsv([cols.map(c => c.label)].concat(rows)));
    else downloadFile('website-performance-pages-' + TODAY + '.xlsx',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', xlsxBytes('Page performance', cols, rows));
    logExport('Page performance', fmt === 'csv' ? 'CSV' : 'Excel', rows.length);
  } else if(kind === 'api'){
    const cols = [{label:'Route'},{label:'p95 (ms)', num:true},{label:'Calls', num:true},{label:'Errors', num:true}];
    const rows = API_ENDPOINTS.map(e => [e.path, e.p95, e.calls, e.errors]);
    if(fmt === 'csv') downloadFile('website-performance-api-' + TODAY + '.csv', 'text/csv;charset=utf-8',
      '\ufeff' + filterLine() + '\r\n' + toCsv([cols.map(c => c.label)].concat(rows)));
    else downloadFile('website-performance-api-' + TODAY + '.xlsx',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', xlsxBytes('API performance', cols, rows));
    logExport('API performance', fmt === 'csv' ? 'CSV' : 'Excel', rows.length);
  } else {
    printTable('Page performance', [{label:'Page'},{label:'Load (ms)', num:true},{label:'LCP (ms)', num:true},{label:'Score', num:true}],
      PAGE_PERF.map(p => [p.page, p.load, p.lcp, p.score]));
    printTable('API performance', [{label:'Route'},{label:'p95 (ms)', num:true},{label:'Errors', num:true}],
      API_ENDPOINTS.map(e => [e.path, e.p95, e.errors]));
    logExport('Performance register', 'PDF', PAGE_PERF.length + API_ENDPOINTS.length);
  }
  renderPerformance(); renderReports();
}

/* ===================== 19 · SYSTEM CONFIGURATION ===================== */
function renderConfig(){
  el('cfgState').className = 'badge b-ok';
  el('cfgState').textContent = 'Saved';
  el('sysKpis').innerHTML = [
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
  el('pubCfgBox').innerHTML = `<div class="tblwrap"><table class="tbl2 dense">
    <thead><tr><th>Public key</th><th>Value the browser receives</th><th>Status</th></tr></thead>
    <tbody>${[
      ['NEXT_PUBLIC_SITE_URL', WM_SET.publicUrl, 'Set'],
      ['NEXT_PUBLIC_API_URL', WM_SET.apiBase, 'Set'],
      ['NEXT_PUBLIC_SUPABASE_URL', WM_SET.supabaseUrl, 'Set'],
      ['NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon key (public by design)', 'Set'],
      ['NEXT_PUBLIC_SENTRY_DSN', 'error ingest endpoint', 'Set'],
      ['NEXT_PUBLIC_TIMEOUT_MS', WM_SET.timeout * 1000 + ' ms', 'Set'],
      ['NEXT_PUBLIC_ENVIRONMENT', WM_SET.env, 'Set']
    ].map(([k, v, st]) => `<tr><td style="font-weight:800;font-family:var(--mono,monospace)">${esc(k)}</td>
      <td style="font-size:9.5px">${esc(v)}</td><td>${okBadge(st)}</td></tr>`).join('')}</tbody></table></div>
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
    {check: 'Health-check interval between 1 and 60 minutes', value: WM_SET.healthInterval + ' min', status: WM_SET.healthInterval >= 1 && WM_SET.healthInterval <= 60 ? 'Pass' : 'Fail'},
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
  WM_SET.publicUrl = (el('cfgPublic').value || '').trim() || WM_SET.publicUrl;
  WM_SET.apiBase = (el('cfgApi').value || '').trim() || WM_SET.apiBase;
  WM_SET.supabaseUrl = (el('cfgSupabase').value || '').trim() || WM_SET.supabaseUrl;
  WM_SET.adminUrl = (el('cfgAdmin').value || '').trim() || WM_SET.adminUrl;
  WM_SET.env = el('cfgEnv').value;
  WM_SET.uptimeTarget = clamp(Number(el('cfgUptime').value) || WM_SET.uptimeTarget, 90, 100);
  WM_SET.timeout = clamp(Number(el('cfgTimeout').value) || WM_SET.timeout, 5, 120);
  WM_SET.retries = clamp(Number(el('cfgRetries').value) || 0, 0, 6);
  WM_SET.healthInterval = clamp(Number(el('cfgHealth').value) || WM_SET.healthInterval, 1, 60);
  WM_SET.cacheTtl = clamp(Number(el('cfgCache').value) || 0, 0, 86400);
  const changed = Object.keys(WM_SET).filter(k => before[k] !== WM_SET[k] && k !== 'maintenance');
  if(!changed.length) return toast('No setting changed.', 'info');
  changed.forEach(k => logChange('Configuration', k, before[k], WM_SET[k]));
  el('cfgState').className = 'badge b-ok';
  el('cfgState').textContent = 'Saved';
  renderConfig(); renderChanges(); renderStats();
  toast('Configuration saved · ' + changed.join(', '));
}
function resetConfig(){
  Object.assign(WM_SET, WM_SET_DEFAULTS);
  logChange('Configuration', 'Configuration reset', 'Edited values', 'Defaults restored');
  renderConfig(); renderChanges();
  toast('Configuration reset to defaults', 'info');
}
function toggleCfgFlag(flag){
  WM_SET[flag] = !WM_SET[flag];
  el('cfgToggles').querySelectorAll('[data-cfg]').forEach(c => c.classList.toggle('on', !!WM_SET[c.dataset.cfg]));
  logChange('Configuration', 'Monitoring preference ' + flag, WM_SET[flag] ? 'Off' : 'On', WM_SET[flag] ? 'On' : 'Off');
  renderConfig(); renderChanges();
  toast(flag + ' ' + (WM_SET[flag] ? 'on' : 'off'));
}

/* ===================== 20 · CHANGE HISTORY ===================== */
let CHG_CAT = '';
function logChange(area, what, from, to){
  WM_CHANGES.unshift({when: TODAY + ' ' + new Date().toTimeString().slice(0, 5), what, area,
    from: String(from), to: String(to), by: 'STF-001'});
  WM_CHANGES.length = Math.min(WM_CHANGES.length, 60);
}
function renderChanges(){
  const rows = WM_CHANGES.filter(c => (CHG_CAT ? c.area === CHG_CAT : true)
    && (matchQ(c.what, c.area, c.from, c.to))
    && inRange(c.when));
  const cats = [...new Set(WM_CHANGES.map(c => c.area))];
  el('chgPill').className = 'badge b-gray';
  el('chgPill').textContent = WM_CHANGES.length + ' changes';
  el('chgKpis').innerHTML = [
    ['Changes on record', num(WM_CHANGES.length), 'Newest first, previous values kept', ''],
    ['Categories', num(cats.length), cats.join(', '), ''],
    ['Staff involved', num(new Set(WM_CHANGES.map(c => c.by)).size), WM_CHANGES.map(c => staffName(c.by)).filter((v, i, a) => a.indexOf(v) === i).join(', '), ''],
    ['Last change', fmtDate(WM_CHANGES[0] ? WM_CHANGES[0].when : TODAY), (WM_CHANGES[0] || {}).what || '—', ''],
    ['Changes today', num(WM_CHANGES.filter(c => String(c.when).slice(0, 10) === TODAY).length), 'Since midnight', ''],
    ['Deployments logged', num(WM_CHANGES.filter(c => c.area === 'Deployment').length), 'Release and rollback events', '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join('');

  el('chgGrid').innerHTML = [
    chartBox({title:'Changes by area', sub:'Where the edits land', value:num(WM_CHANGES.length),
      chart: chart({type:'donut', cats:cats, h:190, colours:PALETTE,
        series:[{data:cats.map(c => WM_CHANGES.filter(x => x.area === c).length)}]})}),
    chartBox({title:'Changes by person', sub:'Who is making them', value:num(new Set(WM_CHANGES.map(c => c.by)).size) + ' staff',
      chart: chart({type:'bar', cats:[...new Set(WM_CHANGES.map(c => staffName(c.by)))], h:190,
        series:[{name:'Changes', data:[...new Set(WM_CHANGES.map(c => c.by))].map(s => WM_CHANGES.filter(c => c.by === s).length), colour:'#2F6CA7'}]})})
  ].join('');

  el('chgCatPill').textContent = CHG_CAT || 'All areas';
  el('chgCats').innerHTML = `<span class="fchip${CHG_CAT ? '' : ' on'}" data-chgcat="">All changes</span>`
    + cats.map(c => `<span class="fchip${CHG_CAT === c ? ' on' : ''}" data-chgcat="${esc(c)}">${esc(c)}</span>`).join('');

  el('chgPill').textContent = rows.length + ' of ' + WM_CHANGES.length;
  renderTable('chgBody', [
    {k:'when', label:'Timestamp', html:v => String(v).slice(0, 10) === TODAY ? 'Today ' + String(v).slice(11) : fmtDate(v)},
    {k:'what', label:'Change'},
    {k:'area', label:'Category'},
    {k:'from', label:'Previous value'},
    {k:'to', label:'Updated value'},
    {k:'by', label:'Staff member', html:v => esc(staffName(v))}
  ], rows, {sort:'when', pageSize:10});

  const byStaff = {};
  WM_CHANGES.forEach(c => { byStaff[c.by] = (byStaff[c.by] || 0) + 1; });
  el('chgWhoBox').innerHTML = Object.keys(byStaff).sort((a, b) => byStaff[b] - byStaff[a]).map(id => `
    <div class="checkrow"><div class="ck pass">✓</div>
      <div style="flex:1"><div style="font-size:10px;font-weight:800">${esc(staffName(id))}</div>
        <div class="qhint">${(STAFF_BY_ID[id] || {}).role || 'Staff'}</div></div>
      <div style="font-size:10px;font-weight:800">${byStaff[id]} changes</div></div>`).join('');

  el('chgTimelineBox').innerHTML = WM_CHANGES.slice(0, 6).map(c => `<div class="checkrow">
      <div class="ck pass">•</div>
      <div style="flex:1"><div style="font-size:10px;font-weight:800">${esc(c.what)}</div>
        <div class="qhint">${esc(c.area)} · ${esc(c.from)} → ${esc(c.to)} · ${esc(staffName(c.by))} · ${String(c.when).slice(0, 10) === TODAY ? 'today' : fmtDate(c.when)}</div></div>
    </div>`).join('');
}

/* ===================== shared wiring ===================== */
function renderStats(){
  const s = wmStats();
  el('bandScore').textContent = s.score + '%';
  el('bandUptime').textContent = r1(s.up) + '%';
  el('bandApis').textContent = num(API_ENDPOINTS.length);
  el('bandAlerts').textContent = num(s.openAlerts.length);
  el('ovStatusPill').className = 'badge ' + (s.score >= 90 ? 'b-ok' : s.score >= 75 ? 'b-warn' : 'b-crit');
  el('ovStatusPill').textContent = s.score >= 90 ? 'All systems connected' : s.score >= 75 ? 'Degraded' : 'At risk';
}
function fillSelects(){
  const sev = [...new Set([].concat(SERVER_ERRORS, ALERTS, PAGE_ERRORS, FE_ERRORS, DB_ERRORS).map(e => e.severity))].filter(Boolean);
  const st = [...new Set([].concat(ALERTS.map(a => a.status), PAGE_ERRORS.map(e => e.status), DIAG_TESTS.map(t => t.status)))];
  const own = [...new Set([].concat(ALERTS.map(a => a.owner), INTEGRATIONS.map(i => i.owner), PAGES.map(p => p.owner)))].filter(Boolean);
  const envs = [...new Set(INTEGRATIONS.map(i => i.region))].filter(Boolean);
  const fill = (id, list, all) => {
    const n = el(id);
    if(!n) return;
    n.innerHTML = `<option value="">${esc(all)}</option>` + list.map(v => `<option value="${esc(v)}">${esc(v)}</option>`).join('');
  };
  fill('fltSeverity', sev.sort(), 'All severities');
  fill('fltStatus', st.sort(), 'All states');
  fill('fltOwner', own.sort((a, b) => staffName(a).localeCompare(staffName(b))), 'All owners');
  const ownSel = el('fltOwner');
  if(ownSel) ownSel.innerHTML = `<option value="">All owners</option>` + own.sort().map(v => `<option value="${esc(v)}">${esc(staffName(v))}</option>`).join('');
  fill('fltRegion', envs.sort(), 'All environments');
}
function syncFilterInputs(){
  if(el('fltFrom')) el('fltFrom').value = FILTER.from;
  if(el('fltTo')) el('fltTo').value = FILTER.to;
  if(el('fltSearch')) el('fltSearch').value = FILTER.q;
  ['fltSeverity','fltStatus','fltOwner','fltRegion'].forEach(id => { if(el(id)) el(id).value = FILTER[id.replace('flt', '').toLowerCase()] || ''; });
  document.querySelectorAll('#fltLaneChips [data-lane]').forEach(c =>
    c.classList.toggle('on', (c.dataset.lane || '') === (FILTER.lane || '')));
}
function applyFilters(){
  FILTER.from = (el('fltFrom') && el('fltFrom').value) || FILTER.from;
  FILTER.to = (el('fltTo') && el('fltTo').value) || FILTER.to;
  FILTER.severity = el('fltSeverity') ? el('fltSeverity').value : '';
  FILTER.status = el('fltStatus') ? el('fltStatus').value : '';
  FILTER.owner = el('fltOwner') ? el('fltOwner').value : '';
  FILTER.region = el('fltRegion') ? el('fltRegion').value : '';
  FILTER.q = el('fltSearch') ? el('fltSearch').value.trim() : '';
  renderAll();
  renderFilterSummary();
  toast('Filters applied — ' + incidentCount() + ' records in view', 'info');
}
function incidentCount(){
  return ALERTS.filter(a => passLane(a) && passSeverity(a) && matchQ(a.kind, a.target)).length
    + PAGE_ERRORS.filter(e => passLane(e)).length
    + SERVER_ERRORS.filter(e => passLane(e)).length;
}
function clearFilter(kind){
  if(kind === 'lane'){ FILTER.lane = ''; }
  else if(kind === 'severity'){ FILTER.severity = ''; }
  else if(kind === 'status'){ FILTER.status = ''; }
  else if(kind === 'owner'){ FILTER.owner = ''; }
  else if(kind === 'region'){ FILTER.region = ''; }
  else if(kind === 'q'){ FILTER.q = ''; FILTER.q = ''; }
  else if(kind === 'dates'){ FILTER.from = '2026-01-01'; FILTER.to = TODAY; }
  syncFilterInputs();
}
function renderFilterSummary(){
  const bits = [];
  if(FILTER.lane) bits.push(['lane', 'Area: ' + FILTER.lane]);
  if(FILTER.severity) bits.push(['severity', 'Severity: ' + FILTER.severity]);
  if(FILTER.status) bits.push(['status', 'State: ' + FILTER.status]);
  if(FILTER.owner) bits.push(['owner', 'Owner: ' + staffName(FILTER.owner)]);
  if(FILTER.region) bits.push(['region', 'Environment: ' + FILTER.region]);
  if(FILTER.q) bits.push(['q', 'Search: ' + FILTER.q]);
  el('fltChips').innerHTML = bits.map(([k, v]) =>
    `<span class="fchip on" data-clear="${k}">${esc(v)} <b style="margin-left:4px">✕</b></span>`).join('')
    || '<span class="qhint">No filters — every record is in view.</span>';
  const summary = el('fltSummary');
  if(summary){ summary.textContent = bits.length ? bits.length + ' filter' + (bits.length === 1 ? '' : 's') : 'Date range only'; }
  el('fltCounts').innerHTML = [
    ['Alerts', num(ALERTS.length)],
    ['Pages', num(PAGES.length)],
    ['API routes', num(API_ENDPOINTS.length)],
    ['Integrations', num(INTEGRATIONS.length)],
    ['Changes', num(WM_CHANGES.length)]
  ].map(([l, v]) => `<div><div class="sl">${l}</div><div class="sv">${v}</div></div>`).join('');
  el('fltResult').textContent = `This filter covers ${num(incidentCount())} alerts and errors, `
    + `${num(FE_CONNECTIONS.length)} frontend origins and ${num(TABLES.length)} database tables.`;
}
function goto(id){
  const sec = document.getElementById(id);
  document.querySelectorAll('.snav').forEach(a =>
    a.classList.toggle('on', a.getAttribute('href') === '#' + id));
  if(!sec) return;
  try { sec.scrollIntoView({behavior:'smooth', block:'start'}); } catch(e){}
  if(window.history && history.replaceState) history.replaceState(null, '', '#' + id);
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
function wireAll(){
  document.querySelectorAll('.snav').forEach(a =>
    a.addEventListener('click', e => { e.preventDefault(); goto(a.getAttribute('href').slice(1)); }));

  document.addEventListener('click', e => {
    const go = e.target.closest('[data-goto]');
    if(go){ goto(go.dataset.goto); return; }
    if(sortOrPage(e)) return;

    const hsec = e.target.closest('[data-hsec]');
    if(hsec){ toggleSection(hsec.dataset.hsec); return; }

    const theme = e.target.closest('[data-theme]');
    if(theme){
      WM_SITE.theme = theme.dataset.theme;
      const t = WM_THEMES.find(x => x.name === theme.dataset.theme);
      if(t) WM_SITE.accent = t.accent;
      logChange('Branding', 'Theme', 'previous theme', WM_SITE.theme);
      renderSite(); renderChanges();
      toast('Theme set to ' + WM_SITE.theme);
      return;
    }
    const accent = e.target.closest('[data-accent]');
    if(accent){
      WM_SITE.accent = accent.dataset.accent;
      logChange('Branding', 'Accent colour', 'previous', WM_SITE.accent);
      renderSite(); renderChanges();
      toast('Accent colour ' + WM_SITE.accent);
      return;
    }

    const navUp = e.target.closest('[data-navup]');
    if(navUp){ moveNav(navUp.dataset.navup, -1); return; }
    const navDown = e.target.closest('[data-navdown]');
    if(navDown){ moveNav(navDown.dataset.navdown, 1); return; }
    const navT = e.target.closest('[data-navtoggle]');
    if(navT){
      const n = WM_NAV.find(x => x.label === navT.dataset.navtoggle);
      if(n){ n.visible = !n.visible; logChange('Navigation', 'Menu visibility ' + n.label, n.visible ? 'Hidden' : 'Shown', n.visible ? 'Shown' : 'Hidden'); renderSite(); renderChanges(); toast(n.label + (n.visible ? ' shown' : ' hidden')); }
      return;
    }
    const navD = e.target.closest('[data-navdel]');
    if(navD){
      const i = WM_NAV.findIndex(x => x.label === navD.dataset.navdel);
      if(i >= 0){ const [removed] = WM_NAV.splice(i, 1); WM_NAV.forEach((n, k) => n.order = k + 1);
        logChange('Navigation', 'Menu item removed', removed.label + ' ' + removed.path, '—');
        renderSite(); renderChanges(); toast(removed.label + ' removed from the menu', 'info'); }
      return;
    }

    const social = e.target.closest('[data-social]');
    if(social){
      const s = WM_SOCIAL.find(x => x.channel === social.dataset.social);
      if(s){ s.linked = !s.linked; logChange('Branding', 'Social channel ' + s.channel, s.linked ? 'Unlinked' : 'Linked', s.linked ? 'Linked' : 'Unlinked'); renderSite(); renderChanges(); toast(s.channel + (s.linked ? ' linked' : ' unlinked')); }
      return;
    }

    const pageUp = e.target.closest('[data-pageup]');
    if(pageUp){ reorderPage(pageUp.dataset.pageup, -1); return; }
    const pageDown = e.target.closest('[data-pagedown]');
    if(pageDown){ reorderPage(pageDown.dataset.pagedown, 1); return; }

    const fix = e.target.closest('[data-fix]');
    if(fix){
      const [from, to] = fix.dataset.fix.split('|');
      const l = LINKS.find(x => x.from === from && x.to === to);
      if(l){ l.status = 'OK'; l.checked = TODAY;
        logChange('Content', 'Broken link repaired ' + to, 'Broken', 'OK');
        renderPages(); renderChanges(); toast('Link repaired · ' + to); }
      return;
    }
    const pgerr = e.target.closest('[data-pgerr]');
    if(pgerr){
      const p = PAGE_ERRORS.find(x => x.page === pgerr.dataset.pgerr && x.status === 'Open');
      if(p){ p.status = 'Resolved'; logChange('Alerts', 'Page error ' + p.page, 'Open', 'Resolved');
        renderPages(); renderChanges(); toast('Acknowledged · ' + p.page); }
      return;
    }
    const seo = e.target.closest('[data-seo]');
    if(seo){ openPage(seo.dataset.seo); return; }

    const verify = e.target.closest('[data-verify]');
    if(verify){ verifyService(verify.dataset.verify); return; }
    const cred = e.target.closest('[data-cred]');
    if(cred){ rotateCred(cred.dataset.cred); return; }
    const authtest = e.target.closest('[data-authtest]');
    if(authtest){ testAuthService(authtest.dataset.authtest); return; }
    const authfix = e.target.closest('[data-authfix]');
    if(authfix){
      const a = AUTH_ERRORS.find(x => x.code === authfix.dataset.authfix && x.status === 'Open');
      if(a){ a.status = 'Resolved'; logChange('Alerts', 'Auth error ' + a.code, 'Open', 'Resolved');
        renderAuth(); renderChanges(); toast(a.code + ' acknowledged'); }
      return;
    }
    const fetest = e.target.closest('[data-fetest]');
    if(fetest){ testFrontendOrigin(fetest.dataset.fetest); return; }
    const formtest = e.target.closest('[data-formtest]');
    if(formtest){ testForm(formtest.dataset.formtest); return; }
    const missfix = e.target.closest('[data-missfix]');
    if(missfix){ fixMissing(missfix.dataset.missfix); return; }

    const diag = e.target.closest('[data-diag]');
    if(diag){ runDiag(diag.dataset.diag); return; }

    const rollback = e.target.closest('[data-rollback]');
    if(rollback){ rollbackTo(rollback.dataset.rollback); return; }

    const alertBtn = e.target.closest('[data-alert]');
    if(alertBtn){
      const [id, act] = alertBtn.dataset.alert.split('|');
      alertAction(id, act); return;
    }
    const rule = e.target.closest('[data-rule]');
    if(rule){ toggleRule(rule.dataset.rule); return; }

    const cap = e.target.closest('[data-cap]');
    if(cap && !e.target.closest('button')){
      const ci = Number(cap.dataset.cap);
      openModal(WM_CAPS[ci], 'Who holds this capability', `
        <div class="pfields" style="grid-template-columns:1fr 1fr">
          ${WM_ROLES.map(r => field(r, WM_PERMS[r][ci] ? okBadge('Allowed') : badge('Not granted', 'b-gray'))).join('')}
        </div>
        <div class="qhint" style="margin-top:8px">Click a cell in the matrix to grant or withdraw the capability.</div>`,
        [{label:'Close', act:'close'}]);
      return;
    }

    const perm = e.target.closest('[data-perm]');
    if(perm){
      const [role, ci] = perm.dataset.perm.split('|');
      togglePerm(role, Number(ci)); return;
    }
    const approve = e.target.closest('[data-approve]');
    if(approve){ approveChange(approve.dataset.approve); return; }

    const rep = e.target.closest('[data-rep]');
    if(rep){ runReport(rep.dataset.rep, rep.dataset.fmt); return; }
    const preport = e.target.closest('[data-preport]');
    if(preport){ runPerfReport(preport.dataset.preport, preport.dataset.fmt); return; }
    const chgcat = e.target.closest('[data-chgcat]');
    if(chgcat){ CHG_CAT = chgcat.dataset.chgcat; renderChanges(); return; }

    const cflag = e.target.closest('#cfgToggles [data-cfg]');
    if(cflag){ toggleCfgFlag(cflag.dataset.cfg); return; }

    const expRow = e.target.closest('[data-exp]');
    if(expRow){
      const x = EXPORTS[Number(expRow.dataset.exp)];
      if(x){
        openModal(x.report, x.format + ' · ' + x.when, `
          <div class="pfields" style="grid-template-columns:1fr 1fr">
            ${field('Report', esc(x.report))}
            ${field('Format', esc(x.format))}
            ${field('Rows', num(x.rows))}
            ${field('Exported by', esc(x.by))}
            ${field('When', esc(x.when))}
            ${field('Filters', esc(x.filters))}
          </div>`, [{label:'Close', act:'close'}]);
      }
      return;
    }

    const chip = e.target.closest('[data-clear]');
    if(chip){ clearFilter(chip.dataset.clear); renderAll(); renderFilterSummary(); return; }

    const lane = e.target.closest('#fltLaneChips [data-lane]');
    if(lane){ FILTER.lane = lane.dataset.lane; renderAll(); renderFilterSummary();
      toast(FILTER.lane ? 'Area: ' + FILTER.lane : 'All areas', 'info'); return; }

    const vis = e.target.closest('[data-vis]');
    if(vis){ /* handled on change */ return; }
  });

  document.addEventListener('change', e => {
    const vis = e.target.closest('[data-vis]');
    if(vis){
      const p = PAGES.find(x => x.path === vis.dataset.vis);
      if(p){ const before = p.visibility; p.visibility = vis.value;
        if(p.visibility === 'Public') p.status = 'Live';
        else if(p.visibility === 'Hidden') p.status = 'Hidden';
        else p.status = 'Draft';
        logChange('Pages', p.path + ' visibility', before, p.visibility);
        renderPages(); renderChanges(); toast(p.path + ' is now ' + p.visibility.toLowerCase()); }
      return;
    }
    const acc = e.target.closest('[data-acc]');
    if(acc){
      const p = PAGES.find(x => x.path === acc.dataset.acc);
      if(p){ const before = p.access; p.access = acc.value;
        logChange('Pages', p.path + ' access', before, p.access);
        renderPages(); renderChanges(); toast(p.path + ' restricted to ' + p.access.toLowerCase()); }
      return;
    }
  });

  // delegated by id, so panels can be re-rendered without losing their handlers
  const on = (id, fn) => {
    document.addEventListener('click', e => {
      const n = e.target.closest('#' + id);
      if(n && !n.disabled) fn(e);
    });
  };
  on('fltApply', applyFilters);
  on('fltReset', () => {
    FILTER.lane = FILTER.severity = FILTER.status = FILTER.owner = FILTER.region = FILTER.q = '';
    FILTER.from = '2026-01-01'; FILTER.to = TODAY;
    syncFilterInputs(); renderAll(); renderFilterSummary(); toast('All filters cleared', 'info');
  });
  ['fltSeverity','fltStatus','fltOwner','fltRegion'].forEach(id => { const n = el(id); if(n) n.addEventListener('change', applyFilters); });
  on('fltSearch', () => {});
  const fs = el('fltSearch'); if(fs) fs.addEventListener('keydown', e => { if(e.key === 'Enter') applyFilters(); });
  const gs = el('globalSearch'); if(gs) gs.addEventListener('keydown', e => {
    if(e.key !== 'Enter') return;
    FILTER.q = e.target.value.trim(); el('fltSearch').value = FILTER.q;
    renderAll(); renderFilterSummary();
    toast(FILTER.q ? 'Searching for "' + FILTER.q + '"' : 'Search cleared', 'info');
  });

  on('refreshBtn', () => {
    const now = new Date();
    REFRESH = fmtDate(TODAY) + ' · ' + pad(now.getHours(), 2) + ':' + pad(now.getMinutes(), 2);
    API_ENDPOINTS.forEach(e => { if(e.status === 'Healthy') e.p95 = Math.max(40, e.p95 + Math.round(Math.random() * 24) - 12); });
    renderAll();
    toast('Every connection re-checked · ' + wmStats().score + '% healthy');
  });

  on('quickCsv', () => runPack('csv'));
  on('printBtn', () => runPack('print'));
  on('packCsv', () => runPack('csv'));
  on('packXlsx', () => runPack('xlsx'));
  on('packPdf', () => runPack('pdf'));
  on('packPrint', () => runPack('print'));

  on('brandSave', () => {
    if(el('brandLogo')) WM_SITE.logo = el('brandLogo').value;
    if(el('brandVariant')) WM_SITE.logoVariant = el('brandVariant').value;
    if(el('brandFont')) WM_SITE.font = el('brandFont').value;
    if(el('brandName')) WM_SITE.name = el('brandName').value || WM_SITE.name;
    logChange('Branding', 'Logo and identity saved', 'previous brand set', WM_SITE.logo + ' · ' + WM_SITE.logoVariant);
    renderSite(); renderChanges(); toast('Branding saved');
  });
  on('brandReset', () => {
    WM_SITE.logo = 'GFS monogram'; WM_SITE.logoVariant = 'Gold on charcoal'; WM_SITE.font = 'Inter / system stack';
    WM_SITE.theme = 'Charcoal & gold'; WM_SITE.accent = '#C9A227'; WM_SITE.name = 'Golden Financial Services';
    logChange('Branding', 'Branding reset', 'edited values', 'default brand');
    renderSite(); renderChanges(); toast('Branding reset to default', 'info');
  });
  on('previewRefresh', () => { renderPreview(); toast('Preview refreshed', 'info'); });
  on('previewOpen', () => {
    renderPreviewModal();
  });
  on('navAdd', () => {
    const label = el('navAddLabel').value.trim(), path = el('navAddPath').value.trim();
    addNav(label, path);
    el('navAddLabel').value = ''; el('navAddPath').value = '';
  });
  on('navReset', () => {
    WM_NAV.length = 0;
    [['Home', '/'], ['Loan products', '/products'], ['How it works', '/how-it-works'], ['About us', '/about'],
     ['Blog', '/blog'], ['Contact', '/contact'], ['Careers', '/careers']].forEach(([label, path], i) =>
      WM_NAV.push({label, path, order: i + 1, visible: i !== 6}));
    logChange('Navigation', 'Menu restored', 'edited menu', 'default menu');
    renderSite(); renderChanges(); toast('Default menu restored', 'info');
  });
  on('contactSave', () => {
    const before = Object.assign({}, WM_CONTACT);
    WM_CONTACT.phone = el('ctPhone').value || WM_CONTACT.phone;
    WM_CONTACT.whatsapp = el('ctWhatsapp').value || WM_CONTACT.whatsapp;
    WM_CONTACT.email = el('ctEmail').value || WM_CONTACT.email;
    WM_CONTACT.support = el('ctSupport').value || WM_CONTACT.support;
    WM_CONTACT.address = el('ctAddress').value || WM_CONTACT.address;
    const changed = Object.keys(WM_CONTACT).filter(k => before[k] !== WM_CONTACT[k]);
    if(!changed.length) return toast('Contact details unchanged.', 'info');
    changed.forEach(k => logChange('Content', 'Contact ' + k, before[k], WM_CONTACT[k]));
    renderSite(); renderChanges(); toast('Contact details saved');
  });
  on('contactReset', () => {
    Object.assign(WM_CONTACT, {phone: '+265 1 771 200', whatsapp: '+265 999 771 200',
      email: 'hello@goldenloan.mw', support: 'support@goldenloan.mw', address: 'Golden House, Area 3, Lilongwe, Malawi'});
    renderSite(); toast('Contact details reset', 'info');
  });
  on('hfSave', () => {
    if(el('hfHeader')) WM_SITE.headerStyle = el('hfHeader').value;
    if(el('hfFooter')) WM_SITE.footerStyle = el('hfFooter').value;
    logChange('Branding', 'Header and footer layout', 'previous layout', WM_SITE.headerStyle + ' / ' + WM_SITE.footerStyle);
    renderSite(); renderChanges(); toast('Header and footer saved');
  });
  on('publishBtn', () => publishSite(true));
  on('unpublishBtn', () => publishSite(false));
  on('cacheBtn', () => {
    logChange('Configuration', 'CDN cache purge', 'warm cache', 'purged at ' + new Date().toTimeString().slice(0, 5));
    renderChanges(); toast('CDN cache purged across 310 PoPs');
  });

  on('edSave', () => editorAction('draft'));
  on('edReview', () => editorAction('review'));
  on('edPublish', () => editorAction('publish'));

  on('npCreate', () => {
    const title = el('npTitle').value.trim(), path = el('npPath').value.trim();
    if(!title || !path) { el('npMsg').textContent = 'A page needs a title and a path.'; return toast('Give the page a title and a path.', 'info'); }
    if(PAGES.some(p => p.path === path)){ el('npMsg').textContent = 'That path is already in use.'; return toast('Path already in use.', 'info'); }
    PAGES.push({path, title, visibility: 'Draft', access: 'Staff', order: PAGES.length + 1,
      seo: title + ' · Golden Financial Services', meta: 42, status: 'Draft', updated: TODAY, errors: 0,
      lane: 'Website', severity: 'Low', owner: 'STF-009', region: 'Lilongwe'});
    logChange('Pages', 'Page created ' + path, '—', title + ' (draft)');
    el('npTitle').value = ''; el('npPath').value = '';
    el('npMsg').textContent = path + ' created as a draft.';
    renderPages(); renderChanges(); toast(title + ' created as a draft');
  });

  on('cdSave', () => {
    WM_SET.publicUrl = el('cdPrimary').value.trim() || WM_SET.publicUrl;
    WM_SET.adminUrl = el('cdAdmin').value.trim() || WM_SET.adminUrl;
    WM_SET.apiBase = el('cdApi').value.trim() || WM_SET.apiBase;
    logChange('Configuration', 'Custom domain configuration', 'previous hostnames', WM_SET.publicUrl);
    el('cdNote').textContent = 'Saved. DNS verification is recommended after a change.';
    renderHosting(); renderConfig(); renderChanges(); toast('Domain configuration saved');
  });
  on('cdVerify', () => {
    const ok = DNS.filter(d => d.status === 'Propagated').length;
    el('cdNote').textContent = ok + ' of ' + DNS.length + ' records resolve to this deployment.';
    renderHosting(); toast('DNS verified · ' + ok + ' of ' + DNS.length + ' records live');
  });
  on('dnsCheck', () => {
    DNS.forEach(d => { if(d.record === 'status'){ d.status = 'Propagated'; } });
    renderHosting(); toast('DNS records re-checked — all propagated');
  });
  on('sslRenew', () => {
    SSL_CERT.validFrom = TODAY; SSL_CERT.validTo = addDays(TODAY, 90); SSL_CERT.daysLeft = 90;
    logChange('Configuration', 'SSL certificate renewed', '66 days left', '90 days left');
    renderHosting(); renderChanges(); toast('Certificate renewed — valid for 90 days');
  });
  on('redeployBtn', () => deployTo('Staging'));

  on('fixAllLinks', () => {
    const broken = LINKS.filter(l => l.status === 'Broken');
    if(!broken.length) return toast('No broken links left.', 'info');
    broken.forEach(l => { l.status = 'OK'; l.checked = TODAY; });
    logChange('Content', 'Broken links repaired', broken.length + ' broken', 'all links resolve');
    renderPages(); renderChanges();
    toast(broken.length + ' broken link' + (broken.length === 1 ? '' : 's') + ' repaired');
  });
  on('healthBtn', runHealthChecks);
  on('restartBtn', restartServer);
  on('dbCheck', () => {
    DB_HEALTH.forEach(h => {
      if(h.check === 'Row-level security'){
        const gaps = TABLES.filter(t => t.rls !== 'Enabled').length;
        h.status = gaps ? 'Gap' : 'Pass';
        h.value = gaps ? gaps + ' table without a policy' : 'Enabled on all 12 tables';
      }
    });
    renderDatabase(); toast('Database checks re-run');
  });
  on('rlsFix', fixRls);
  on('runIntTests', runIntegrationTests);
  on('runFeTests', runFeSuite);
  on('runAllDiag', runAllDiag);
  on('copyTrouble', () => {
    const text = TROUBLESHOOT.map(t => t.priority + ': ' + t.action).join('\n');
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(text).catch(() => {});
    }
    toast('Fix list copied (' + TROUBLESHOOT.length + ' actions)');
  });
  on('deployBtn', () => deployTo('Production'));
  on('stagingBtn', () => deployTo('Staging'));
  on('runPreDeploy', runPreDeployChecks);
  on('cfgSave', saveConfig);
  on('cfgReset', resetConfig);
  on('cfgValidate', () => {
    const bad = renderConfigValidation();
    toast(bad.length ? bad.length + ' configuration value' + (bad.length === 1 ? '' : 's') + ' need attention' : 'Configuration is valid',
      bad.length ? 'info' : 'ok');
  });

  on('menuBtn', () => document.getElementById('sidebar').classList.toggle('open'));
  on('bellBtn', () => goto('s16'));
  on('modalClose', closeModal);
  const modal = el('modal');
  if(modal) modal.addEventListener('click', e => { if(e.target.id === 'modal') closeModal(); });
  document.addEventListener('keydown', e => { if(e.key === 'Escape') closeModal(); });

  let spyT = null;
  window.addEventListener('scroll', () => { clearTimeout(spyT); spyT = setTimeout(spyScroll, 160); }, {passive:true});
}
function reorderPage(path, dir){
  const list = PAGES.slice().sort((a, b) => a.order - b.order);
  const i = list.findIndex(p => p.path === path);
  const j = i + dir;
  if(i < 0 || j < 0 || j >= list.length) return;
  const t = list[i].order; list[i].order = list[j].order; list[j].order = t;
  logChange('Pages', 'Page order', list[j].path + ' / ' + list[i].path, 'swapped');
  renderPages(); renderChanges();
  toast(path + ' moved ' + (dir < 0 ? 'up' : 'down'), 'info');
}
function renderPreviewModal(){
  const theme = WM_THEMES.find(t => t.name === WM_SITE.theme) || WM_THEMES[0];
  openModal('Website preview', WM_SET.publicUrl + ' · theme ' + WM_SITE.theme + ' · ' + WM_SITE.logo, `
    <div class="sitepreview">
      <div class="sp-bar"><span class="sp-dot"></span><span class="sp-dot"></span><span class="sp-dot"></span>
        <span class="sp-url">${esc(WM_SET.publicUrl.replace('https://', ''))}</span></div>
      <div class="sp-body" style="background:${theme.bg};color:#F6F7F9">
        <div class="sp-nav">${WM_NAV.filter(n => n.visible).map(n => `<span>${esc(n.label)}</span>`).join('')}</div>
        <div class="sp-hero">${esc(WM_SITE.tagline)}</div>
        <div class="sp-sub">${esc(WM_CONTACT.address)} · ${esc(WM_CONTACT.phone)} · ${esc(WM_CONTACT.email)}</div>
        <span class="sp-cta" style="background:${theme.accent};color:#14161C">Apply for a loan</span>
        <div class="sp-cards">${PRODUCTS.slice(0, 3).map(() => '<div class="sp-card"></div>').join('')}</div>
        <div class="sp-sub" style="margin-top:12px;font-size:9px;opacity:.65">
          ${WM_SECTIONS.filter(s => s.on).length} homepage sections on · header ${esc(WM_SITE.headerStyle)} · footer ${esc(WM_SITE.footerStyle)}</div>
      </div>
    </div>`,
    [{label:'Use this theme', act:() => { closeModal(); toast('Preview closed — publish to push it live', 'info'); }},
     {label:'Close', act:'close'}]);
}
function spyScroll(){
  const secs = [...document.querySelectorAll('section.sec')];
  if(!secs.length) return;
  let current = secs[0];
  secs.forEach(s => { if(s.getBoundingClientRect().top <= 170) current = s; });
  document.querySelectorAll('.snav').forEach(a =>
    a.classList.toggle('on', a.getAttribute('href') === '#' + current.id));
}

window.WEBSITE_APP = {
  FILTER, WM_SET, WM_SITE, WM_NAV, WM_SECTIONS, WM_CONTACT, WM_THEMES, CONTENT, PAGES, LINKS, DNS,
  API_ENDPOINTS, INTEGRATIONS, API_CREDS, AUTH_SERVICES, AUTH_ERRORS, FORMS, FORM_ERRORS, TABLES,
  DEPLOYMENTS, RELEASES, ROLLBACKS, ENV_CHECKS, PRE_DEPLOY, ALERTS, ALERT_RULES, DIAG_TESTS,
  TROUBLESHOOT, WM_CHANGES, WM_PERMS, WM_APPROVALS, EXPORTS, BACKEND, SUPA, DB_HEALTH, MIGRATIONS,
  SERVER_ERRORS, FE_CONNECTIONS, FE_ERRORS, FAILED_REQUESTS, TIMEOUTS, PAGE_PERF, UPTIME, MISSING_FILES,
  DOCUMENTS, IMAGES, STORAGE_USAGE, SERVER_HEALTH, DOMAIN, SSL_CERT, HOSTING, WM_REPORTS,
  wmStats, reportData, renderAll, runReport, runPack, deployTo, rollbackTo, runDiag, runAllDiag,
  verifyService, rotateCred, togglePerm, approveChange, alertAction, publishSite, saveConfig,
  toggleSection, testForm, fixMissing, restartServer, goto
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
  window.addEventListener('pageshow', e => { if(e.persisted) renderAll(); });
})();
</script>
</body>
</html>
