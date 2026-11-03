<script>
/* ============================================================
   DATA RECOVERY, SYSTEM BACKUP & FACTORY RESET (6/7)
   Sections 9–12: access control, the administrator dashboard,
   the Supabase and hosting inventory, and the implementation
   ledger with its audit trail.
   ============================================================ */

/* ===================== 9 · ACCESS CONTROL ===================== */
function renderSecurity(){
  const holders = IAM_ROLES.filter(r => r.grants['Create backup']).length;
  const prodRestore = IAM_ROLES.filter(r => r.grants['Restore production']).length;
  const refused = ACCESS_LOG.filter(a => a.result === 'Refused' || a.result === 'Failed').length;
  if(el('secPill')){ el('secPill').className = 'badge b-ok'; el('secPill').textContent = holders + ' roles may take a copy'; }
  put('secKpis', [
    ['Roles with backup rights', num(holders), 'Of ' + IAM_ROLES.length + ' defined roles', ''],
    ['Roles that may restore production', num(prodRestore), 'Two names, different people', 'amber'],
    ['Capabilities controlled', num(IAM_CAPS.length), 'From viewing to approving', ''],
    ['Sensitive actions logged', num(ACCESS_LOG.length), 'Allowed, refused and failed', ''],
    ['Refused or failed attempts', num(refused), 'All recorded', ''],
    ['MFA on sensitive actions', 'Required', 'Download, restore, reset', 'green'],
    ['Access review', 'Due 21 Nov 2026', 'Last reviewed 21 Aug 2026', 'amber'],
    ['Secrets in logs', 'None', 'Redacted before writing', 'green']
  ].map(([l,v,s,k]) => kpiCard(l, v, s, k)).join(''));

  if(el('iamCount')) el('iamCount').textContent = IAM_ROLES.length + ' roles';
  el('iamHead').innerHTML = '<tr><th>Role</th>' + IAM_CAPS.map(c => `<th style="text-align:center;white-space:nowrap">${esc(c)}</th>`).join('') + '</tr>';
  el('iamBody').innerHTML = IAM_ROLES.map(r => `<tr>
    <td style="white-space:nowrap"><b>${esc(r.role)}</b></td>
    ${IAM_CAPS.map(c => `<td style="text-align:center">${r.grants[c]
      ? '<span class="tick">✓</span>' : '<span class="nothing">—</span>'}</td>`).join('')}
  </tr>`).join('');

  put('secControls', SEC_CONTROLS.map(([label, tone, note]) => checkRow(tone,
    `<b>${esc(label)}</b><div class="qhint" style="margin-top:1px">${esc(note)}</div>`, '')).join(''));
  put('secCrypto', kvList(CRYPTO.map(([k, v]) => [k, esc(v)])));

  if(el('accCount')) el('accCount').textContent = ACCESS_LOG.length + ' events';
  table('accBody', [
    {k:'when', label:'When', html:v => esc(drWhen(v))},
    {k:'actor', label:'Who', html:v => esc(v === 'system' ? 'Scheduled job' : staffName(v))},
    {k:'action', label:'Action'},
    {k:'target', label:'Target'},
    {k:'result', label:'Result', html:v => pill(v === 'Allowed' ? 'Passed' : v)},
    {k:'note', label:'Note'}
  ], ACCESS_LOG, {sort:'when', pageSize:8});
}

function drStartReview(){
  drAudit('Access', 'Permission review started', 'last review 21 Aug 2026', 'review opened',
    'Quarterly review of backup access', 'Access');
  renderAll();
  if(el('accMsg')) el('accMsg').textContent = 'A review of every account holding backup, download, restore or reset rights ' +
    'has been opened. It is signed off when the Head of Credit confirms each holder is still in the role.';
  toast('Access review opened');
}

/* ===================== 10 · ADMIN DASHBOARD ===================== */
function renderDashboard(){
  const last = lastGood();
  const failed = failedBackups();
  const pending = BACKUPS.filter(b => b.status === 'Completed').length;
  const totalMb = sum(BACKUPS.filter(succeeded), b => b.size);
  if(el('dashPill')) el('dashPill').textContent = 'as at ' + fmtDate(TODAY);

  const warns = [];
  if(failed.length) warns.push('red', `<b>One scheduled backup failed.</b> ${failed[0].id} on ${fmtDate(failed[0].when)}. The newest good copy is ${ageLabel(last.when)}.`);
  if(pending) warns.push('gold', `<b>${pending} copy is complete but not verified.</b> Verify it before relying on it.`);
  if(HEALTH.some(h => h.tone !== 'ok')) warns.push('gold', '<b>Two monitors need attention.</b> Database size is at 60% of the plan limit and one job failed in 30 days.');
  if(!warns.length) warns.push('gold', '<b>Everything is in order.</b> The last copy is verified and no job is outstanding.');
  put('dashWarn', `<div class="note ${warns[0]}" style="margin-bottom:8px"><div>${warns[1]}</div></div>`);

  put('dashTiles', [
    tile('Last successful backup', esc(last ? ageLabel(last.when) : '—'), esc(last ? drWhen(last.when) : 'none'), last && !overdue() ? 'ok' : 'bad'),
    tile('Next scheduled backup', esc(drWhen(NEXT_RUNS[0].when)), esc(NEXT_RUNS[0].what), 'info'),
    tile('Verified copies', num(BACKUPS.filter(b => b.status === 'Verified').length), num(BACKUPS.length) + ' on file', 'ok'),
    tile('Storage used', bytes(totalMb), 'of 41 GB allotted', 'ok'),
    tile('Retention', SCHEDULE.retMonthly + ' days', 'for the monthly class', 'info'),
    tile('Jobs this quarter', num(JOBS.length), 'one refused by a guard', 'warn'),
    tile('Last restore test', 'Passed', '27 Sep 2026 · staging', 'ok'),
    tile('Warnings', String(failed.length + (pending ? 1 : 0)), 'shown above', failed.length ? 'bad' : 'warn')
  ].join(''));

  const last14 = BACKUPS.filter(succeeded).slice(0, 14).reverse();
  put('dashGrid',
    chartCard({title:'Copy size, newest last', sub:'Every successful copy in the window', type:'bar', value:bytes(sum(last14, b => b.size)),
      chart: chart({type:'bar', h:190, cats: last14.map(b => fmtShort(b.when)),
        series:[{name:'Size (MB)', colour:'#2F6FED', data: last14.map(b => Math.round(b.size))}]})}) +
    chartCard({title:'Backup outcome', sub:'What the book shows', type:'donut', value: num(BACKUPS.length) + ' copies',
      chart: chart({type:'donut', h:190, cats:['Verified','Completed','Failed','Running'],
        series:[{name:'Copies', data:['Verified','Completed','Failed','Running'].map(s => BACKUPS.filter(b => b.status === s).length)}]})}) +
    chartCard({title:'Reset jobs by mode', sub:'What has actually been run', type:'bar', value: num(JOBS.length) + ' jobs',
      chart: chart({type:'bar', h:190, cats:['Mode A','Mode B','Mode C','Mode D','Restore'],
        series:[{name:'Jobs', colour:'#C9A227', data:['A','B','C','D','Restore'].map(m => JOBS.filter(j => j.mode === m).length)}]})}));

  if(el('dashJobCount')) el('dashJobCount').textContent = JOBS.length + ' jobs';
  put('dashJobs', `<div class="tblwrap" style="max-height:220px"><table class="tbl2 dense">
      <thead><tr><th>Job</th><th>Operation</th><th>Environment</th><th>State</th><th>Progress</th><th>Finished</th><th>Result</th></tr></thead>
      <tbody>${JOBS.slice(0, 8).map(j => `<tr class="rowlink" data-drrow="jobBody" data-i="${JOBS.indexOf(j)}">
        <td class="mono">${esc(j.id)}</td>
        <td>${esc(j.what)}</td>
        <td><span class="envi ${(ENV_BY_ID[j.env]||{}).tone || 'dev'}" style="font-size:8px">${esc(envLabel(j.env))}</span></td>
        <td>${pill(j.status)}</td>
        <td style="min-width:90px">${progBar(j.progress, j.status === 'Success' ? 'ok' : j.status === 'Refused' ? 'bad' : 'warn')}
          <div class="smallnum">${j.progress}%</div></td>
        <td>${esc(j.finished ? drWhen(j.finished) : '—')}</td>
        <td style="font-size:9.6px">${j.status === 'Refused' || /fail/i.test(j.status)
          ? '<span class="cross">✕</span> ' + esc(j.note) : '<span class="tick">✓</span> ' + esc(j.note)}</td>
      </tr>`).join('')}</tbody></table></div>`);

  put('dashModes', RESET_MODES.map(m => `<div class="risk" style="align-items:flex-start">
      <div style="flex:1;min-width:0">
        <div class="rn">Mode ${esc(m.id)} · ${esc(m.name)}</div>
        <div class="rs">${esc(m.summary)}</div>
      </div>
      <div class="rv">${m.available ? pill(m.risk) : '<span class="badge b-crit">Disabled</span>'}<span>${esc(m.minutes)}</span></div>
    </div>`).join(''));

  const procRows = PROCEDURES.map(p => ({kind:'Procedure', name:p.name, where:p.where, who:p.owner, when:p.review}))
    .concat(CONTACTS.map(c => ({kind:'Contact', name:c.who, where:c.how, who:c.when, when:'—'})));
  table('procBody', [
    {k:'kind', label:'Type', html:v => `<span class="badge ${v === 'Contact' ? 'b-info' : 'b-gray'}">${esc(v)}</span>`},
    {k:'name', label:'Item'},
    {k:'where', label:'Where'},
    {k:'who', label:'Owner / when to call'},
    {k:'when', label:'Reviewed', html:v => v === '—' ? '—' : esc(fmtDate(v))}
  ], procRows, {sort:'kind', dir:'asc', pageSize:9});

  put('dashTests', checkRow('pass', 'Quarterly rehearsal', 'last passed 27 Sep 2026') +
    checkRow('warn', 'Next rehearsal booked', '27 Dec 2026 · staging') +
    checkRow('pass', 'Smoke tests available', SMOKE.length + ' defined') +
    checkRow('fail', 'Two scenarios never rehearsed', 'credential compromise, storage loss'));
}

/* ===================== 11 · SUPABASE AND HOSTING ===================== */
function renderSupabase(){
  const included = SUP_TABLES.filter(t => t.backed === 'Included').length;
  if(el('supPill')){ el('supPill').className = 'badge b-info'; el('supPill').textContent = PROJECT.supabaseRef + ' · ' + PROJECT.region; }
  put('supKpis', [
    ['Project', esc(PROJECT.supabaseRef), PROJECT.region, ''],
    ['Plan', esc(PROJECT.plan), 'Determines what is available', ''],
    ['Tables in scope', num(SUP_TABLES.length), included + ' carried by the copy', ''],
    ['Database size', '612 MB', 'of a 1 GB plan limit', 'amber'],
    ['Functions', num(SUP_FUNCTIONS.length) + ' of 22', 'Critical ones listed', ''],
    ['RLS policies', '34', 'All restored with the schema', 'green'],
    ['Storage buckets', num(BUCKETS.length), '3.4 GB, copied separately', ''],
    ['Point-in-time', SCHEDULE.pitrHours + ' h', PROJECT.pitrAvailable ? 'Available on this plan' : 'Not available', '']
  ].map(([l,v,s,k]) => kpiCard(l, v, s, k)).join(''));

  if(el('supTableCount')) el('supTableCount').textContent = SUP_TABLES.length + ' tables';
  table('supBody', [
    {k:'name', label:'Table', html:v => `<span class="mono">${esc(v)}</span>`},
    {k:'rows', label:'Rows', num:true, html:v => num(v)},
    {k:'mb', label:'Size', num:true, html:v => esc(v >= 1024 ? (v/1024).toFixed(1) + ' GB' : v + ' MB')},
    {k:'backed', label:'In a backup?', html:v => v === 'Included' ? '<span class="badge b-ok">Included</span>'
      : v === 'Separate copy' ? '<span class="badge b-warn">Separate copy</span>'
      : '<span class="badge b-crit">Provider only</span>'}
  ], SUP_TABLES, {sort:'mb', dir:'asc', pageSize:9});

  if(el('supFnCount')) el('supFnCount').textContent = SUP_FUNCTIONS.length + ' functions';
  table('supFnBody', [
    {k:'name', label:'Function', html:v => `<span class="mono">${esc(v)}</span>`},
    {k:'purpose', label:'What it does'},
    {k:'backed', label:'Copied', html:v => pill('Passed')}
  ], SUP_FUNCTIONS, {sort:'name', dir:'asc', pageSize:8});

  table('bucBody', [
    {k:'name', label:'Bucket', html:v => `<span class="mono">${esc(v)}</span>`},
    {k:'objects', label:'Objects', num:true},
    {k:'size', label:'Size', num:true},
    {k:'public', label:'Visibility', html:v => v ? '<span class="badge b-warn">Public</span>' : '<span class="badge b-ok">Private</span>'},
    {k:'copy', label:'File copy'}
  ], BUCKETS, {sort:'objects', pageSize:5});

  if(el('capPill')) el('capPill').textContent = CAPABILITIES.filter(c => c[3] === 'pass').length + ' of ' + CAPABILITIES.length + ' available';
  put('capList', CAPABILITIES.map(([name, state, note, tone]) =>
    checkRow(tone === 'pass' ? 'pass' : tone === 'warn' ? 'warn' : 'fail',
      `<b>${esc(name)}</b> <span class="badge ${tone === 'pass' ? 'b-ok' : tone === 'warn' ? 'b-warn' : 'b-crit'}" style="margin-left:4px">${esc(state)}</span>
       <div class="qhint" style="margin-top:1px">${esc(note)}</div>`, '')).join(''));

  put('manList', `<ul class="runbook">${MANUAL_STEPS.map(([h, t]) => `<li><b>${esc(h)}.</b> ${esc(t)}</li>`).join('')}</ul>`);

  if(el('connPill')) el('connPill').textContent = CONN_CHECKS.length + ' checks passed';
  put('connOut', CONN_CHECKS.map(([l, s, n]) => checkRow(s, esc(l), esc(n))).join('') +
    `<div class="codebox" style="margin-top:9px"><span class="cm"># service-role key must never reach the browser</span>
$ grep -r "SERVICE_ROLE" dist/  <span class="cs2">→ no matches</span>
$ grep -r "SUPABASE_ANON_KEY" dist/  <span class="ck2">→ found in the public bundle, as intended</span>
<span class="cm"># connection check, read-only</span>
select count(*) from information_schema.tables where table_schema='public';  <span class="cs2">→ 34</span></div>`);
}

function drSupCheck(){
  DR.connChecked = true;
  drAudit('Configuration', 'Connection re-inspected', 'last check 2026-10-30', 'schema 2026.10.3 · 34 tables · 22 functions',
    'Administrator re-inspected the Supabase project', 'Configuration');
  renderAll();
  if(el('supMsg')) el('supMsg').textContent = 'The connection is healthy: 34 tables, 22 functions, 34 policies, 5 buckets. ' +
    'No service-role key is present in the built frontend.';
  toast('Connection re-inspected — all checks pass');
}

/* ===================== 12 · IMPLEMENTATION ORDER ===================== */
function renderImplementation(){
  const done = IMPL_STEPS.filter(s => s.status === 'Done').length;
  if(el('impPill')){ el('impPill').className = 'badge b-info'; el('impPill').textContent = done + ' of 9 steps complete'; }
  if(el('impCount')) el('impCount').textContent = done + ' of ' + IMPL_STEPS.length;
  put('impHost', `<div class="tl2">${IMPL_STEPS.map(s => tlItem(
    s.status === 'Done' ? 'ok' : s.status === 'In progress' ? 'warn' : 'bad',
    `<span class="badge b-gray" style="margin-right:6px">${s.n}</span>${esc(s.title)} ${pill(s.status)}`,
    esc(s.detail), '')).join('')}</div>`);

  if(el('safePill')) el('safePill').textContent = SAFETY_RULES.length + ' rules holding';
  put('safeHost', SAFETY_RULES.map(([rule, state]) => checkRow('pass', esc(rule), esc(state))).join(''));

  put('gateHost', GATES.map(g => checkRow(g.state === 'Cleared' ? 'pass' : g.state === 'Blocked' ? 'fail' : 'warn',
    `<b>${esc(g.gate)}</b> <span class="badge ${g.state === 'Cleared' ? 'b-ok' : g.state === 'Blocked' ? 'b-crit' : 'b-warn'}" style="margin-left:4px">${esc(g.state)}</span>`,
    '')).join('') + `<div class="qhint" style="margin-top:6px">${GATES.map(g => esc(g.note)).join(' · ')}</div>`);

  const rows = AUDIT_ALL.filter(a => !DR.filterAudit || a.kind === DR.filterAudit);
  if(el('audCount')) el('audCount').textContent = rows.length + ' entries';
  table('audBody', [
    {k:'when', label:'When', html:v => esc(drWhen(v))},
    {k:'kind', label:'Kind', html:v => `<span class="badge b-gray">${esc(v)}</span>`},
    {k:'what', label:'Event', html:v => esc(v)},
    {k:'from', label:'Previous'},
    {k:'to', label:'Updated'},
    {k:'by', label:'Staff', html:v => esc(v === 'system' ? 'Scheduled job' : staffName(v))},
    {k:'reason', label:'Reason'},
    {k:'result', label:'Result', html:v => pill(v === 'Allowed' ? 'Passed' : v)}
  ], rows, {sort:'when', pageSize:9});
}
</script>
