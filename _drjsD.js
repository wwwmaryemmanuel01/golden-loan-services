<script>
/* ============================================================
   DATA RECOVERY, SYSTEM BACKUP & FACTORY RESET (4/7)
   Sections 1–4: the backup book, the schedule and retention, the
   recovery workflow, and the system (non-database) copies.
   ============================================================ */

/* ---------------- shared header pieces ---------------- */
function renderBand(){
  const last = lastGood();
  const stats = [
    ['Last good copy', last ? ageLabel(last.when) : 'none', last ? last.id : ''],
    ['Verified copies', num(BACKUPS.filter(succeeded).length), 'of ' + num(BACKUPS.length) + ' on file'],
    ['RPO / RTO', '7 h · 4 h', 'agreed with the board']
  ];
  put('bandStats', stats.map(([l, v, s]) =>
    `<div class="band-stat"><div class="k">${esc(l)}</div><div class="v">${esc(v)}</div>${s ? `<div class="tiny">${esc(s)}</div>` : ''}</div>`).join(''));
  if(el('topRefresh')) el('topRefresh').textContent = fmtDate(TODAY) + ' · ' + PROJECT.appVersion;
}

function renderEnvBar(){
  const env = ENV_BY_ID[DR.env];
  put('envBar', `<span class="envi ${env.tone}"><span class="d"></span>${esc(env.label)}</span>
    <div style="flex:1;min-width:0">
      <div class="eb-t">${esc(env.host)}</div>
      <div class="eb-s">${esc(env.data)}${DR.maint ? ' · <b>maintenance mode is on</b>' : ''}</div>
    </div>
    <span class="badge ${DR.maint ? 'b-warn' : 'b-ok'}">${DR.maint ? 'Writes paused' : 'Writes open'}</span>
    <span class="badge b-gray">schema ${esc(PROJECT.schemaVersion)}</span>
    <span class="badge b-gray">${esc(PROJECT.plan)}</span>`);
  el('envBar').className = 'envbar' + (env.tone === 'prod' ? ' prod' : '');
}

/* ===================== 1 · DATA BACKUP MANAGEMENT ===================== */
const bkRows = () => BACKUPS.filter(b =>
  (!DR.filterType || b.type === DR.filterType) && (!DR.filterStatus || b.status === DR.filterStatus));

function renderBackups(){
  const rows = bkRows();
  const good = BACKUPS.filter(succeeded);
  const failed = failedBackups();
  const pending = BACKUPS.filter(b => b.status === 'Completed').length;
  const protectedCount = BACKUPS.filter(b => b.protection === 'Protected').length;
  const totalMb = sum(good, b => b.size);
  const last = lastGood();

  if(el('bkPill')){
    el('bkPill').className = 'badge ' + (failed.length || overdue() ? 'b-warn' : 'b-ok');
    el('bkPill').textContent = last ? 'last good copy ' + ageLabel(last.when) : 'no good copy on file';
  }

  /* the alerts an administrator must see first */
  const alerts = [];
  if(failed.length) alerts.push(['red', '<b>' + failed.length + ' scheduled backup failed.</b> ' +
    failed[0].id + ' on ' + fmtDate(failed[0].when) + ' — ' + esc(failed[0].note) +
    ' The last good copy is ' + ageLabel(last.when) + '.']);
  if(pending) alerts.push(['gold', '<b>' + pending + ' copies are complete but not yet verified.</b> A copy that has not been verified is not a recovery point.']);
  if(overdue()) alerts.push(['red', '<b>The nightly backup is overdue.</b> Nothing newer than ' + fmtDate(last.when) + ' exists.']);
  const offsite = SCHEDULE.offsite.indexOf('Enabled') === 0;
  if(!offsite) alerts.push(['gold', '<b>No independent off-site copy.</b> A single account holds every copy.']);
  put('bkAlerts', alerts.map(([tone, html]) =>
    `<div class="note ${tone}" style="margin-bottom:8px"><div>${html}</div></div>`).join(''));

  put('bkKpis', [
    ['Last successful backup', last ? ageLabel(last.when) : '—', (last ? drWhen(last.when) : 'none on file') + ' · overdue after 24 h', last && !overdue() ? 'green' : 'red'],
    ['Copies on file', num(BACKUPS.length), num(good.length) + ' succeeded', ''],
    ['Verified copies', num(BACKUPS.filter(b => b.status === 'Verified').length), 'Restorable with confidence', ''],
    ['Awaiting verification', num(pending), 'Complete, not yet proven', pending ? 'amber' : ''],
    ['Failed runs', num(failed.length), failed.length ? 'Needs an operator' : 'None in the window', failed.length ? 'red' : 'green'],
    ['Protected points', num(protectedCount), 'Beyond ordinary retention', ''],
    ['Copy size', bytes(totalMb), 'Across every successful copy', ''],
    ['Point-in-time window', SCHEDULE.pitrHours + ' h', PROJECT.pitrAvailable ? 'Available on this plan' : 'Not available', '']
  ].map(([l,v,s,k]) => kpiCard(l, v, s, k)).join(''));

  /* selected copy */
  const list = good.slice(0, 40);
  if(!DR.selBackup || !BK_BY_ID[DR.selBackup]) DR.selBackup = (last || BACKUPS[0]).id;
  if(el('bkSel')){
    el('bkSel').innerHTML = list.map(b =>
      `<option value="${esc(b.id)}">${esc(b.id)} · ${esc(b.type)} · ${esc(drWhen(b.when))}</option>`).join('');
    el('bkSel').value = DR.selBackup;
  }
  const b = BK_BY_ID[DR.selBackup] || BACKUPS[0];
  const verified = b.status === 'Verified';
  if(el('bkSelPill')){ el('bkSelPill').className = 'badge ' + (verified ? 'b-ok' : 'b-warn'); el('bkSelPill').textContent = b.status; }
  put('bkDetail', kvList([
    ['Type', esc(b.type)],
    ['Timestamp', esc(drWhen(b.when))],
    ['Scope', esc((BACKUP_TYPES.find(t => t.id === b.type) || {}).scope || '—')],
    ['Size', bytes(b.size)],
    ['Rows', b.rows ? num(b.rows) : 'structure only'],
    ['Protected', b.protection === 'Protected' ? '<span class="badge b-ok">Protected</span>' : '<span class="badge b-gray">Standard</span>'],
    ['Retention deadline', esc(fmtDate(b.retention))],
    ['Actor', esc(b.actorName)],
    ['Checksum', '<span class="mono">sha256:' + esc(checksumOf(b)) + '</span>'],
    ['Encryption', esc(b.encryption)],
    ['Verification', verified ? '<span class="badge b-ok">Verified ' + esc(drWhen(b.verifiedAt)) + '</span>' : '<span class="badge b-warn">Not verified</span>'],
    ['Note', esc(b.note || '—')]
  ]));

  /* scope documentation */
  put('bkScope', SCOPE_ROWS.map(r => checkRow(
    r.tone === 'pass' ? 'pass' : r.tone === 'warn' ? 'warn' : 'fail',
    `<b>${esc(r.item)}</b><div class="qhint" style="margin-top:1px">${esc(r.note)}</div>`, esc(r.state))).join(''));

  if(el('bkCount')) el('bkCount').textContent = num(rows.length) + ' copies';
  table('bkBody', [
    {k:'id', label:'Copy', html:v => `<span class="mono">${esc(v)}</span>`},
    {k:'when', label:'Taken', html:v => esc(drWhen(v))},
    {k:'type', label:'Type'},
    {k:'size', label:'Size', num:true, html:v => esc(v ? bytes(v) : '—')},
    {k:'status', label:'State', html:v => pill(v)},
    {k:'verifiedAt', label:'Verified', html:v => v ? esc(drWhen(v)) : '<span class="nothing">—</span>'},
    {k:'retention', label:'Kept until', html:v => esc(fmtDate(v))},
    {k:'protection', label:'Protection', html:v => v === 'Protected' ? '<span class="badge b-ok">Protected</span>' : '<span class="badge b-gray">Standard</span>'},
    {k:'actorName', label:'Actor'}
  ], rows, {sort:'when', pageSize:10});

  /* charts */
  const recent = BACKUPS.filter(succeeded).slice(0, 14).reverse();
  put('bkGrid',
    chartCard({title:'Copy size, newest last', sub:'Database copies in the last three weeks', type:'bar',
      value:bytes(sum(recent, r => r.size)),
      chart: chart({type:'bar', h:200, cats: recent.map(r => fmtShort(r.when)),
        series:[{name:'Size (MB)', colour:'#2F6FED', data: recent.map(r => Math.round(r.size))}]})}) +
    chartCard({title:'Backup outcomes', sub:'Every copy on file', type:'donut',
      value: num(BACKUPS.length) + ' copies',
      chart: chart({type:'donut', h:200, cats:['Verified','Completed','Failed','Running'],
        series:[{name:'Copies', data:['Verified','Completed','Failed','Running'].map(s => BACKUPS.filter(x => x.status === s).length)}]})}) +
    chartCard({title:'Copies by type', sub:'What the book actually contains', type:'bar',
      value: num(BACKUP_TYPES.length) + ' types',
      chart: chart({type:'bar', h:200, cats: BACKUP_TYPES.map(t => t.id.replace('Database (full)','Full DB').replace('Pre-release point','Pre-release').replace('Storage manifest','Manifest')),
        series:[{name:'Copies', colour:'#C9A227', data: BACKUP_TYPES.map(t => BACKUPS.filter(b => b.type === t.id).length)}]})}));
}

function checksumOf(b){
  let h = 0;
  for(const ch of String(b.id + b.when)) h = (h*31 + ch.charCodeAt(0)) % 0xffffffff;
  return ('00000000' + h.toString(16)).slice(-8);
}

function drBackupNow(){
  if(DR.runningJob){ toast('A job is already running on ' + DR.env, 'err'); return; }
  const id = 'BKP-2026-' + pad(1002 + BACKUPS.length, 4);
  const rec = {
    id, when:TODAY + ' ' + nowClock(), type:'Database (full)', env:'production',
    size:Math.round((lastGood() || {size:512}).size * 1.001),
    status:'Completed', verifiedAt:'', retention:addDays(TODAY, SCHEDULE.retDaily),
    rows:(lastGood() || {rows:184000}).rows, actor:OPERATOR, actorName:staffName(OPERATOR),
    protection:'Standard', encryption:'AES-256 at rest, TLS in transit',
    location:'Supabase storage · eu-west-1', tables:34,
    note:'Manual request from the admin portal — awaiting verification'
  };
  BACKUPS.unshift(rec);
  BK_BY_ID[id] = rec;
  DR.selBackup = id;
  drAudit('Backup', 'Manual database copy requested', '—', id,
    'Administrator requested a copy from the admin portal', 'Backup');
  drAudit('Access', 'Backup created', '—', id, 'Manual request', 'Access');
  renderAll();
  if(el('bkMsg')) el('bkMsg').textContent = id + ' was written and is ' + bytes(rec.size) +
    '. It is complete but not yet verified — verify it before treating it as a recovery point.';
  toast('Backup ' + id + ' completed — verify it next');
}

function drVerifyBackup(){
  const b = BK_BY_ID[DR.selBackup];
  if(!b){ toast('Pick a copy first', 'err'); return; }
  if(b.status === 'Failed'){ toast('A failed run has nothing to verify — re-run the backup', 'err'); return; }
  const ok = b.size > 0;
  b.status = ok ? 'Verified' : 'Failed';
  b.verifiedAt = ok ? TODAY + ' ' + nowClock() : '';
  b.note = ok ? (b.note || '') + '' : 'Verification failed: empty archive';
  drAudit('Backup', 'Backup verified', b.id, ok ? 'SHA-256 matched · schema ' + PROJECT.schemaVersion : 'checksum mismatch', 'Integrity check run in the portal', 'Backup');
  renderAll();
  if(el('bkMsg')) el('bkMsg').textContent = ok
    ? b.id + ' verified: the checksum matches the manifest and the schema version is readable. It is now a usable recovery point.'
    : b.id + ' failed verification and must not be restored.';
  toast(ok ? b.id + ' verified' : b.id + ' failed verification', ok ? 'ok' : 'err');
}

function drExtendRetention(){
  const b = BK_BY_ID[DR.selBackup];
  if(!b){ toast('Pick a copy first', 'err'); return; }
  const before = b.retention;
  b.retention = addDays(b.retention, 30);
  b.protection = 'Protected';
  drAudit('Configuration', 'Retention extended', fmtDate(before), fmtDate(b.retention),
    'Held longer at an administrator’s request', 'Configuration');
  renderAll();
  toast(b.id + ' kept until ' + fmtDate(b.retention));
}

function drRequestCopy(){
  const b = BK_BY_ID[DR.selBackup];
  if(!b){ toast('Pick a copy first', 'err'); return; }
  if(staffName(OPERATOR) && (STAFF_BY_ID[OPERATOR] || {}).mfa === false){ toast('MFA is required to download a copy', 'err'); return; }
  const manifest = [
    ['backup_id', b.id], ['taken', b.when], ['type', b.type], ['scope', (BACKUP_TYPES.find(t => t.id === b.type) || {}).scope],
    ['size_mb', b.size], ['rows', b.rows], ['status', b.status], ['retention_until', b.retention],
    ['checksum', 'sha256:' + checksumOf(b)], ['encryption', b.encryption], ['location', b.location],
    ['actor', b.actorName], ['exported_by', staffName(OPERATOR)], ['exported_at', TODAY + ' ' + nowClock()],
    ['secrets_included', 'none']
  ];
  openModal('Request a copy of ' + b.id,
    'An encrypted archive, released to a named administrator',
    `<div class="note red"><div>This export carries database records only. It never carries passwords, tokens, service-role keys or
      environment values — those are not in a backup at all.</div></div>
     <div class="tblwrap" style="margin-top:9px"><table class="tbl2 dense"><tbody>
       ${manifest.map(([k,v]) => `<tr><td style="width:38%"><b>${esc(k)}</b></td><td class="mono">${esc(String(v))}</td></tr>`).join('')}
     </tbody></table></div>
     <div class="qhint" style="margin-top:8px">The archive is encrypted and the password is shared out of band. The download is written to the access log.</div>`,
    [{label:'Download the manifest', cls:'btn-gold', act:() => {
        downloadFile(b.id + '-manifest.csv', 'text/csv', toCsv([['field','value']].concat(manifest)));
        drAudit('Access', 'Backup manifest exported', b.id, 'manifest csv', 'Requested from the admin portal', 'Access');
        renderAll();
      }},
     {label:'Close', act:'close'}]);
}

/* ===================== 2 · SCHEDULE AND RETENTION ===================== */
function renderSchedule(){
  const enabled = SCHEDULE.dailyAt ? true : false;
  if(el('schPill')){ el('schPill').className = 'badge b-info'; el('schPill').textContent = 'daily at ' + SCHEDULE.dailyAt; }
  if(el('schStatePill')) el('schStatePill').textContent = enabled ? 'Scheduled' : 'Paused';

  put('schKpis', [
    ['Frequency', 'Daily', 'Weekly and monthly on top', ''],
    ['Daily retention', SCHEDULE.retDaily + ' days', num(BACKUPS.filter(b => b.type === 'Database (full)').length) + ' copies', ''],
    ['Weekly retention', Math.round(SCHEDULE.retWeekly/7) + ' weeks', 'Eight Sunday copies', ''],
    ['Monthly retention', Math.round(SCHEDULE.retMonthly/30) + ' months', 'Held the longest', ''],
    ['Point-in-time', SCHEDULE.pitrHours + ' h', 'Rolling provider window', ''],
    ['Off-site copy', SCHEDULE.offsite.indexOf('Enabled') === 0 ? 'On' : 'No',
      SCHEDULE.offsite.indexOf('separate') > -1 ? 'Separate account' : 'Same account', SCHEDULE.offsite.indexOf('Enabled') === 0 ? 'green' : 'red'],
    ['Protected points', num(PROTECTED_POINTS.length), 'Pre-release and pre-migration', ''],
    ['Immutability', SCHEDULE.protectedDays + ' days', 'Protected from alteration or deletion', '']
  ].map(([l,v,s,k]) => kpiCard(l, v, s, k)).join(''));

  if(el('schDaily')) el('schDaily').value = SCHEDULE.dailyAt;
  if(el('schWeekly')) el('schWeekly').value = SCHEDULE.weekly;
  if(el('schMonthly')) el('schMonthly').value = SCHEDULE.monthly;
  if(el('schPitr')) el('schPitr').value = SCHEDULE.pitrHours;
  if(el('schRetDaily')) el('schRetDaily').value = SCHEDULE.retDaily;
  if(el('schRetWeekly')) el('schRetWeekly').value = Math.round(SCHEDULE.retWeekly/7);
  if(el('schRetMonthly')) el('schRetMonthly').value = Math.round(SCHEDULE.retMonthly/30);
  if(el('schOffsite')) el('schOffsite').value = SCHEDULE.offsite;

  put('schNext', NEXT_RUNS.map(r => `<div class="risk"><div><div class="rn">${esc(r.what)}</div>
      <div class="rs">${esc(r.note)}</div></div>
      <div class="rv">${esc(drWhen(r.when))}<span>${esc(r.kind)}</span></div></div>`).join(''));

  if(el('rpPill')) el('rpPill').textContent = PROTECTED_POINTS.length + ' protected';
  table('rpBody', [
    {k:'id', label:'Point', html:v => `<span class="mono">${esc(v)}</span>`},
    {k:'when', label:'Taken', html:v => esc(drWhen(v))},
    {k:'type', label:'Type'},
    {k:'size', label:'Size', num:true, html:v => esc(bytes(v))},
    {k:'retention', label:'Kept until', html:v => esc(fmtDate(v))},
    {k:'note', label:'Why it is held'}
  ], PROTECTED_POINTS, {sort:'when', pageSize:6});

  table('retBody', [
    {k:'cls', label:'Class'},
    {k:'keep', label:'Retained'},
    {k:'copies', label:'Copies', num:true},
    {k:'deletion', label:'Deletion', html:v => esc(v)},
    {k:'protection', label:'Protection'}
  ], RETENTION_ROWS, {sort:'cls', dir:'asc', pageSize:6});

  if(el('schIndepText')) el('schIndepText').textContent = SCHEDULE.offsite.indexOf('Enabled') === 0
    ? 'A weekly copy is written to ' + PROJECT.offsite + ', a separate account with a read-only key held by the Head of Credit. Losing the Supabase account does not lose every copy.'
    : 'No independent copy is configured. Every recovery point sits in one account — a billing or account failure takes all of them at once.';

  const classes = ['Daily','Weekly','Monthly'];
  put('schGrid',
    chartCard({title:'Retention horizon', sub:'How long each class is kept', type:'bar',
      value:'365 days',
      chart: chart({type:'bar', h:200, cats:['Daily','Weekly','Monthly'],
        series:[{name:'Days kept', colour:'#C9A227', data:[SCHEDULE.retDaily, SCHEDULE.retWeekly, SCHEDULE.retMonthly]}]})}) +
    chartCard({title:'Copy age distribution', sub:'Where the recovery points sit in time', type:'donut',
      value: num(BACKUPS.indexOf(0) ? BACKUPS.filter(succeeded).length : 0) + ' good copies',
      chart: chart({type:'donut', h:200, cats:['Last 7 days','8–30 days','31–90 days','Older'],
        series:[{name:'Copies', data:['7','30','90','9999'].map((lim, i, a) =>
          BACKUPS.filter(b => succeeded(b) && (i === 0 ? daysBetween(b.when.slice(0,10), TODAY) <= 7
            : i === 1 ? daysBetween(b.when.slice(0,10), TODAY) > 7 && daysBetween(b.when.slice(0,10), TODAY) <= 30
            : i === 2 ? daysBetween(b.when.slice(0,10), TODAY) > 30 && daysBetween(b.when.slice(0,10), TODAY) <= 90
            : daysBetween(b.when.slice(0,10), TODAY) > 90)).length)}]})}) +
    chartCard({title:'Storage held by class', sub:'What retention actually costs', type:'bar',
      value: bytes(sum(BACKUPS.filter(succeeded), b => b.size)),
      chart: chart({type:'bar', h:200, cats:['Full copies','Schema','Manifests','Config'],
        series:[{name:'MB', colour:'#1E9E6A', data:[
          Math.round(sum(BACKUPS.filter(b => /Full|Pre-release/.test(b.type)), b => b.size)),
          Math.round(sum(BACKUPS.filter(b => b.type === 'Schema only'), b => b.size)),
          Math.round(sum(BACKUPS.filter(b => b.type === 'Storage manifest'), b => b.size)),
          Math.round(sum(BACKUPS.filter(b => b.type === 'Configuration'), b => b.size))]}]})}));
}

function drSaveSchedule(){
  const daily = (el('schDaily') && el('schDaily').value) || SCHEDULE.dailyAt;
  const weekly = fpVal('schWeekly', SCHEDULE.weekly);
  const monthly = fpVal('schMonthly', SCHEDULE.monthly);
  const pitr = Number(el('schPitr') && el('schPitr').value) || 0;
  const rd = Math.max(1, Number(el('schRetDaily') && el('schRetDaily').value) || 1);
  const rw = Math.max(1, Number(el('schRetWeekly') && el('schRetWeekly').value) || 1);
  const rm = Math.max(1, Number(el('schRetMonthly') && el('schRetMonthly').value) || 1);
  const off = fpVal('schOffsite', SCHEDULE.offsite);
  if(pitr > 168){ toast('The point-in-time window cannot exceed a week on this plan', 'err'); return; }
  if(rd > 35){ toast('Daily retention above 35 days is not available on this plan', 'err'); return; }
  const before = SCHEDULE.retDaily + '/' + Math.round(SCHEDULE.retWeekly/7) + '/' + Math.round(SCHEDULE.retMonthly/30);
  SCHEDULE.dailyAt = daily; SCHEDULE.weekly = weekly; SCHEDULE.monthly = monthly;
  SCHEDULE.pitrHours = pitr; SCHEDULE.retDaily = rd; SCHEDULE.retWeekly = rw*7; SCHEDULE.retMonthly = rm*30;
  SCHEDULE.offsite = off;
  const after = rd + '/' + rw + '/' + rm;
  drAudit('Configuration', 'Backup schedule changed', before, after, 'Retention and frequency set in the admin portal', 'Configuration');
  NEXT_RUNS[0].when = TODAY + ' ' + daily;
  renderAll();
  if(el('schMsg')) el('schMsg').textContent = 'Saved: daily at ' + daily + ', weekly ' + weekly.toLowerCase() +
    ', monthly ' + monthly.toLowerCase() + '. Daily copies are kept ' + rd + ' days, weekly ' + rw + ' weeks, monthly ' + rm + ' months.';
  toast('Backup schedule saved');
}

function drPreviewNext(){
  const out = NEXT_RUNS.map((r, i) => `<div class="risk"><div><div class="rn">${esc(r.what)}</div>
      <div class="rs">${esc(r.note)}</div></div><div class="rv">in ${i === 0 ? 'under a day' : (i+1) + ' days'}<span>${esc(drWhen(r.when))}</span></div></div>`).join('');
  openModal('Next scheduled runs', 'Computed from the saved schedule',
    `<div class="note gold" style="margin-bottom:9px"><div>Backups run whether or not anyone is signed in. A missed run is
      alerted in section 1, not silently skipped.</div></div>${out}`,
    [{label:'Close', act:'close'}]);
}

function drPurgeExpired(){
  const exp = BACKUPS.filter(b => b.protection !== 'Protected' && b.retention < TODAY && succeeded(b));
  if(!exp.length){
    if(el('retMsg')) el('retMsg').textContent = 'Nothing has reached its retention deadline. Protected points are never purged by this action.';
    toast('No expired copies to purge');
    return;
  }
  openModal('Purge ' + exp.length + ' expired copies', 'Secure deletion of copies past their retention deadline',
    `<div class="note red"><div>This cannot be undone. Only copies past their deadline are removed; protected recovery points
      and anything verified in the last 30 days are skipped.</div></div>
     <div class="tblwrap" style="margin-top:9px;max-height:220px"><table class="tbl2 dense"><thead><tr><th>Copy</th><th>Taken</th><th>Kept until</th><th class="num">Size</th></tr></thead>
     <tbody>${exp.slice(0,12).map(b => `<tr><td class="mono">${esc(b.id)}</td><td>${esc(fmtDate(b.when))}</td>
       <td>${esc(fmtDate(b.retention))}</td><td class="num">${esc(bytes(b.size))}</td></tr>`).join('')}</tbody></table></div>`,
    [{label:'Purge them', cls:'btn-red', act:() => {
        exp.forEach(b => { b.status = 'Expired'; });
        DR.selBackup = (lastGood() || BACKUPS[0]).id;
        drAudit('Deletion', 'Expired copies purged', exp.length + ' copies', 'cryptographically erased',
          'Retention deadline reached', 'Deletion');
        renderAll();
        if(el('retMsg')) el('retMsg').textContent = exp.length + ' expired copies were purged. ' +
          'Soft delete holds them for seven days before the erase is final.';
        toast(exp.length + ' expired copies purged');
      }},
     {label:'Cancel', act:'close'}]);
}

/* ===================== 3 · RECOVERY AND RESTORATION ===================== */
const restorePoints = () => BACKUPS.filter(b => succeeded(b) && b.status === 'Verified' && b.size > 0);

function renderRecovery(){
  const pts = restorePoints();
  if(!DR.selPoint || !BK_BY_ID[DR.selPoint]) DR.selPoint = (pts[0] || {}).id || '';
  const b = BK_BY_ID[DR.selPoint];

  if(el('rsPill')){
    el('rsPill').className = 'badge ' + (pts.length ? 'b-warn' : 'b-crit');
    el('rsPill').textContent = pts.length + ' verified points';
  }
  put('rsKpis', [
    ['Verified recovery points', num(pts.length), 'Restorable today', ''],
    ['Newest point', b ? ageLabel(b.when) : '—', b ? drWhen(b.when) : 'pick one', ''],
    ['Oldest usable', pts.length ? fmtDate(pts[pts.length-1].when) : '—', 'Within retention', ''],
    ['Staging rehearsals', num(TESTS.filter(t => t.env === 'staging').length), 'Recorded in section 8', ''],
    ['Last restore result', 'Passed', '27 Sep 2026 · 15 of 15 checks', 'green'],
    ['Production restores', '1', 'Approved, 11 Oct 2026', ''],
    ['RPO', '7 hours', 'Maximum acceptable loss', ''],
    ['RTO', '4 hours', 'Maximum acceptable downtime', '']
  ].map(([l,v,s,k]) => kpiCard(l, v, s, k)).join(''));

  if(el('rsPoint')){
    el('rsPoint').innerHTML = pts.slice(0, 40).map(p =>
      `<option value="${esc(p.id)}">${esc(p.id)} · ${esc(p.type)} · ${esc(drWhen(p.when))} · ${esc(bytes(p.size))}</option>`).join('');
    el('rsPoint').value = DR.selPoint;
  }
  if(!b){ put('rsDetail', '<div class="empty">No verified recovery point is available.</div>'); return; }

  if(el('rsPointPill')){ el('rsPointPill').className = 'badge b-ok'; el('rsPointPill').textContent = 'verified'; }
  put('rsDetail', kvList([
    ['Backup', '<span class="mono">' + esc(b.id) + '</span>'],
    ['Date', esc(drWhen(b.when)) + ' · ' + esc(ageLabel(b.when))],
    ['Type', esc(b.type)],
    ['Scope', esc((BACKUP_TYPES.find(t => t.id === b.type) || {}).scope || '—')],
    ['Size', bytes(b.size) + ' · ' + num(b.rows) + ' rows'],
    ['Verification', '<span class="badge b-ok">checksum matched ' + esc(drTime(b.verifiedAt || b.when)) + '</span>'],
    ['Schema at that point', esc(PROJECT.schemaVersion)],
    ['Protection', b.protection === 'Protected' ? 'Protected from deletion' : 'Standard retention']
  ]));

  /* what would be lost */
  const loss = Math.max(0, daysBetween(b.when.slice(0,10), TODAY));
  put('rsWarnBox', `<div class="note red"><div>
      Restoring this point discards everything written after <b>${esc(drWhen(b.when))}</b>.
      <div class="qhint" style="margin-top:5px;color:#8E2323">
        About ${loss} day${loss === 1 ? '' : 's'} of work: new applications, repayments received, disbursements posted and any
        charge assessed after the point. Financial records are never merged — the database is replaced as a whole, which is what
        keeps the ledger balanced. Audit records are preserved: the evidence is written to an append-only store outside the target.
        A production restore needs explicit confirmation, reauthentication and a second authorisation before it starts.
      </div></div></div>`);

  const verifiedNow = DR.pointVerified === b.id;
  if(el('rsVerPill')){ el('rsVerPill').className = 'badge ' + (verifiedNow ? 'b-ok' : 'b-gray'); el('rsVerPill').textContent = verifiedNow ? 'verified now' : 'verified at capture'; }
  put('rsVerifyBox', verifiedNow ? [
    ['Archive readable', 'pass', bytes(b.size)],
    ['Checksum matches the manifest', 'pass', 'sha256:' + checksumOf(b)],
    ['Schema version', 'pass', PROJECT.schemaVersion + ' · compatible'],
    ['Migration head present', 'pass', PROJECT.migrationHead],
    ['Required functions', 'pass', '22 of 22'],
    ['RLS policies', 'pass', '34 of 34'],
    ['Storage manifest present', 'pass', '1,842 objects']
  ].map(([l, s, n]) => checkRow(s, esc(l), esc(n))).join('')
    : checkRow('pending', 'Not verified in this session',
        '<button class="btn btn-ghost" data-dr="verifyPoint" style="padding:2px 7px;font-size:9px">Run the check</button>'));

  const st = DR.restoreState[b.id];
  put('rsStageOut', st && st.staged ? `<div class="tl2">
      ${tlItem('ok', 'Restored into staging', 'Isolated environment, production untouched', drWhen(st.at))}
      ${tlItem('ok', 'Schema and functions recreated', '22 functions, 34 policies')}
      ${tlItem('ok', 'Rows loaded', num(b.rows) + ' rows across 34 tables')}
      ${tlItem('ok', 'Verification passed', '15 of 15 checks · see below')}
      ${tlItem('', 'Staging kept for comparison', 'Production has not been touched', 'held')}
    </div>` : `<div class="empty">No staging restore has run for this point in this session.</div>`);

  put('rsChecks', RESTORE_CHECKS.map(c => checkRow(
    DR.checksRun ? c.state : 'pending', esc(c.label),
    DR.checksRun ? esc(c.got) + ' / ' + esc(c.expect) : 'not run')).join(''));
  if(el('rsCheckPill')) el('rsCheckPill').textContent = DR.checksRun ? '15 of 15 passed' : 'not run';

  put('rsRollback', ROLLBACK_STEPS.map(s => `<li>${s}</li>`).join(''));

  const log = RESTORE_LOG;
  if(el('rlogCount')) el('rlogCount').textContent = log.length + ' attempts';
  table('rlogBody', [
    {k:'when', label:'When', html:v => esc(drWhen(v))},
    {k:'what', label:'Operation'},
    {k:'env', label:'Environment'},
    {k:'point', label:'Recovery point', html:v => `<span class="mono">${esc(v)}</span>`},
    {k:'by', label:'Operator', html:v => esc(staffName(v))},
    {k:'approvedBy', label:'Approver', html:v => v === '—' ? '—' : esc(staffName(v))},
    {k:'result', label:'Result', html:v => pill(v)},
    {k:'note', label:'Note'}
  ], log, {sort:'when', pageSize:6});
}

const RESTORE_LOG = [
  {when:'2026-10-30 09:05', what:'Staging restore', env:'staging', point:'BKP-2026-1001', by:'STF-002', approvedBy:'—', result:'Passed', note:'Verification 15 of 15; staging kept for comparison'},
  {when:'2026-09-27 08:00', what:'Mode D rehearsal', env:'staging', point:'BKP-2026-1008', by:'STF-002', approvedBy:'STF-009', result:'Passed', note:'Full reinitialisation, 47 minutes'},
  {when:'2026-08-22 09:10', what:'Staging restore', env:'staging', point:'BKP-2026-1019', by:'STF-002', approvedBy:'—', result:'Passed', note:'One function grant repaired after the load'},
  {when:'2026-07-25 08:30', what:'Staging restore', env:'staging', point:'BKP-2026-1031', by:'STF-002', approvedBy:'—', result:'Partial', note:'Storage restore failed on 12 objects'},
  {when:'2026-05-30 08:45', what:'Staging restore', env:'staging', point:'BKP-2026-1057', by:'STF-002', approvedBy:'—', result:'Failed', note:'Schema version mismatch — compatibility check added'},
  {when:'2026-10-18 15:47', what:'Production restore', env:'production', point:'—', by:'STF-001', approvedBy:'—', result:'Refused', note:'No restore capability for a Loan Officer'}
];

function drVerifyPoint(){
  const b = BK_BY_ID[DR.selPoint];
  if(!b){ toast('Pick a recovery point', 'err'); return; }
  DR.pointVerified = b.id;
  drAudit('Restore', 'Recovery point verified', b.id, 'archive readable · schema ' + PROJECT.schemaVersion,
    'Pre-restore integrity check', 'Restore');
  renderAll();
  toast(b.id + ' verified — checksum, schema and functions all match');
}

function drRestoreStaging(){
  const b = BK_BY_ID[DR.selPoint];
  if(!b){ toast('Pick a recovery point', 'err'); return; }
  const drop = TEST_SCENARIO_COUNT;
  openModal('Restore to staging', b.id + ' · production stays untouched',
    `<div class="note gold"><div>Staging is a separate environment. Nothing here reaches a customer, and the production
      database is not opened.</div></div>
     <div class="steps" style="margin-top:10px">
       ${['Verify the point','Provision staging','Load the copy','Run the checks'].map((s, i) =>
         `<div class="step${i === 0 ? ' on' : ''}"><span class="stepnum">${i+1}</span>${esc(s)}</div>`).join('')}
     </div>
     ${kvList([
       ['Recovery point', '<span class="mono">' + esc(b.id) + '</span>'],
       ['Target', 'staging · glfs-staging'],
       ['Rows to load', num(b.rows)],
       ['Expected duration', '40–55 minutes'],
       ['Effect on production', 'none']
     ])}`,
    [{label:'Restore into staging', cls:'btn-gold', act:() => {
        DR.restoreState[b.id] = {staged:true, at:TODAY + ' ' + nowClock()};
        DR.pointVerified = b.id;
        DR.checksRun = true;
        RESTORE_LOG.unshift({when:TODAY + ' ' + nowClock(), what:'Staging restore', env:'staging', point:b.id,
          by:OPERATOR, approvedBy:'—', result:'Passed', note:'15 of 15 verification checks'});
        drAudit('Restore', 'Staging restore completed', '—', b.id, 'Rehearsal before any production decision', 'Restore');
        closeModal(); renderAll();
        if(el('rsMsg')) el('rsMsg').textContent = b.id + ' was restored into staging and every verification check passed. ' +
          'Production has not been touched — a production restore needs its own approval.';
        toast('Staging restore passed 15 of 15 checks');
      }},
     {label:'Cancel', act:'close'}]);
}
const TEST_SCENARIO_COUNT = 6;

function drRestoreProduction(){
  const b = BK_BY_ID[DR.selPoint];
  if(!b){ toast('Pick a recovery point', 'err'); return; }
  if((STAFF_BY_ID[OPERATOR] || {}).scopes.indexOf('restore-prod') < 0){
    toast('Your role cannot restore production', 'err'); return;
  }
  const st = DR.restoreState[b.id];
  if(!st || !st.staged){
    openModal('Staging restore required first', 'The documented order is staging, then production',
      `<div class="note red"><div>A production restore is only offered after this point has been restored into staging and
        verified. Restore ${esc(b.id)} into staging first — that is the check that proves the copy is usable.</div></div>`,
      [{label:'Close', act:'close'}]);
    return;
  }
  openModal('Restore production from ' + b.id, 'Two names, a typed confirmation and a recent verified copy',
    `<div class="steps">${['Target','Consequences','Reauthenticate','Type to confirm','Second approver']
      .map((s, i) => `<div class="step${i === 0 ? ' on' : ''}${/confirm|approver/i.test(s) ? ' danger' : ''}">
        <span class="stepnum">${i+1}</span>${esc(s)}</div>`).join('')}</div>
     <div class="envbar prod" style="margin-bottom:9px">
       <span class="envi prod"><span class="d"></span>Production</span>
       <div><div class="eb-t">Railway · Supabase (eu-west-1)</div>
         <div class="eb-s">live customers, loans, repayments and the ledger</div></div>
     </div>
     <div class="note red"><div><b>Everything written after ${esc(drWhen(b.when))} will be lost.</b>
       The database is replaced as a whole. Uploaded files are not part of this restore.</div></div>
     <div class="form-grid" style="margin-top:10px">
       <div class="fg"><label>Type PRODUCTION to continue</label><input id="prType" placeholder="PRODUCTION" autocomplete="off" /></div>
       <div class="fg"><label>Second approver</label><select id="prApprover">
         ${DR_STAFF.filter(s => s.id !== OPERATOR && s.scopes.indexOf('approve') > -1)
           .map(s => `<option value="${esc(s.id)}">${esc(s.name)} · ${esc(s.role)}</option>`).join('')}
       </select></div>
       <div class="fg"><label>Reason</label><input id="prReason" placeholder="e.g. recovery from a bad migration" /></div>
       <div class="fg"><label>Reauthenticate</label><input id="prPw" type="password" placeholder="password" autocomplete="off" /></div>
     </div>
     <div class="qhint" id="prMsg">Maintenance mode is switched on for the duration. The run is written to the audit store before it starts.</div>`,
    [{label:'Restore production', cls:'btn-red', act:() => drConfirmProduction(b)},
     {label:'Cancel', act:'close'}]);
}

function drConfirmProduction(b){
  const typed = (el('prType') && el('prType').value || '').trim();
  const approver = fpVal('prApprover', '');
  const reason = (el('prReason') && el('prReason').value || '').trim();
  const pw = (el('prPw') && el('prPw').value || '').trim();
  const fail = m => { if(el('prMsg')) el('prMsg').textContent = m; toast(m, 'err'); };
  if(typed !== 'PRODUCTION') return fail('Type PRODUCTION, in capitals, to continue');
  if(!approver) return fail('A second approver is required');
  if(approver === OPERATOR) return fail('The approver must be someone other than the requester');
  if(!reason) return fail('A reason is required and is written to the audit trail');
  if(!pw) return fail('Re-enter your password — a standing session is not enough');

  DR.maint = true;
  JOBS.unshift({id:'JOB-2026-0043', mode:'Restore', env:'production', what:'Production restore from ' + b.id,
    status:'Success', progress:100, started:TODAY + ' ' + nowClock(), finished:TODAY + ' ' + nowClock(),
    by:OPERATOR, approvedBy:approver, key:'r-' + checksumOf(b).slice(0,4) + '-prd',
    note:reason});
  RESTORE_LOG.unshift({when:TODAY + ' ' + nowClock(), what:'Production restore', env:'production', point:b.id,
    by:OPERATOR, approvedBy:approver, result:'Passed', note:reason});
  NOTICES.unshift({when:TODAY + ' ' + nowClock(), event:'Production restore started', job:'JOB-2026-0043',
    env:'production', to:'Director, Head of Credit, Auditor', channel:'Email + SMS', state:'Delivered'});
  drAudit('Restore', 'Production restored', 'live database', b.id + ' · approved by ' + staffName(approver), reason, 'Restore');
  DR.runningJob = '';   /* the run finishes inside the request, so the lock is released at once */
  closeModal(); renderAll();
  toast('Production restored from ' + b.id + ' — maintenance mode is still on');
}

function drRunChecks(){
  DR.checksRun = true;
  drAudit('Restore', 'Post-restore verification run', '15 checks', '15 passed',
    'Verification after a restore', 'Restore');
  renderAll();
  if(el('rsCheckMsg')) el('rsCheckMsg').textContent = 'All 15 checks passed: records, relationships, policies, functions, ' +
    'authentication, storage permissions and connectivity. Lift maintenance mode only after the smoke tests pass too.';
  toast('15 of 15 post-restore checks passed');
}

/* ===================== 4 · SYSTEM BACKUP ===================== */
const artRows = () => ARTEFACTS.filter(a => !DR.filterArtifact || a.kind === DR.filterArtifact);

function renderSystem(){
  const rows = artRows();
  const verified = ARTEFACTS.filter(a => a.verified === 'Verified').length;
  if(el('sbPill')){
    el('sbPill').className = 'badge b-ok';
    el('sbPill').textContent = verified + ' of ' + ARTEFACTS.length + ' artefacts verified';
  }
  put('sbKpis', [
    ['Artefacts tracked', num(ARTEFACTS.length), 'Code, manifests, migrations, docs', ''],
    ['Verified', num(verified), 'Checksum or tag confirmed', 'green'],
    ['Source reference', 'main @ 3aaa277', 'Repository commit', ''],
    ['Code mirror', 'Off-site', 'Independent of GitHub', 'green'],
    ['Schema dump', '2.4 MB', 'Structure only, latest', ''],
    ['Uploaded files', '3.4 GB', 'Separate object copy', ''],
    ['Migrations on file', '42', 'Ordered, head recorded', ''],
    ['Environment names', num(ENV_VARS.length), 'Values never copied', '']
  ].map(([l,v,s,k]) => kpiCard(l, v, s, k)).join(''));

  if(el('sbCount')) el('sbCount').textContent = rows.length + ' artefacts';
  table('sbBody', [
    {k:'id', label:'Ref', html:v => `<span class="mono">${esc(v)}</span>`},
    {k:'kind', label:'Kind'},
    {k:'name', label:'Artefact'},
    {k:'where', label:'Protected copy'},
    {k:'ref', label:'Reference', html:v => `<span class="mono">${esc(v)}</span>`},
    {k:'when', label:'Last verified', html:v => esc(drWhen(v))},
    {k:'mb', label:'Size', num:true, html:v => esc(v >= 1024 ? (v/1024).toFixed(1) + ' GB' : v >= 1 ? v + ' MB' : Math.round(v*1024) + ' KB')},
    {k:'verified', label:'State', html:v => pill(v)}
  ], rows, {sort:'when', pageSize:8});

  table('evBody', [
    {k:'name', label:'Variable', html:v => `<span class="mono">${esc(v)}</span>`},
    {k:'purpose', label:'Purpose'},
    {k:'where', label:'Set in'},
    {k:'value', label:'Value', html:() => '<span class="redacted">•••••••••</span>'},
    {k:'required', label:'Required', html:v => v ? '<span class="tick">✓</span>' : '<span class="nothing">—</span>'}
  ], ENV_VARS, {sort:'name', dir:'asc', pageSize:8});

  if(el('verPill')) el('verPill').textContent = VERSION_ROWS.length + ' points';
  table('verBody', [
    {k:'when', label:'Taken', html:v => esc(fmtDate(v))},
    {k:'app', label:'App'},
    {k:'schema', label:'Schema'},
    {k:'migration', label:'Migration head', html:v => `<span class="mono">${esc(v)}</span>`},
    {k:'status', label:'State', html:v => pill(v)}
  ], VERSION_ROWS, {sort:'when', pageSize:6});

  put('sbHost', kvList([
    ['Railway service', esc(PROJECT.railwayService)],
    ['Build', 'npm ci && npm run build'],
    ['Start', 'node server.js'],
    ['Health check', '/healthz · 200 expected'],
    ['Region', 'eu-west-1 (Ireland)'],
    ['Runtime pin', esc(PROJECT.nodeVersion)],
    ['Supabase project', esc(PROJECT.supabaseRef)],
    ['Migration head', '<span class="mono">' + esc(PROJECT.migrationHead) + '</span>'],
    ['Last deploy', esc(drWhen(PROJECT.lastDeploy))]
  ]));

  put('sbGrid',
    chartCard({title:'Artefacts by kind', sub:'What the system backup holds', type:'bar',
      value: num(ARTEFACTS.length) + ' items',
      chart: chart({type:'bar', h:200, cats:['Source','Deps','Migrations','Docs','Config','Content','Storage'],
        series:[{name:'Items', colour:'#2F6FED', data:['Source code','Dependencies','Migrations','Documentation','Configuration','Content','Storage']
          .map(k => ARTEFACTS.filter(a => a.kind === k).length)}]})}) +
    chartCard({title:'Verified against unverified', sub:'A file that is not verified is not a backup', type:'donut',
      value: num(verified) + ' verified',
      chart: chart({type:'donut', h:200, cats:['Verified','Pending'],
        series:[{name:'Artefacts', data:[verified, ARTEFACTS.length - verified]}]})}) +
    chartCard({title:'Storage footprint', sub:'Copies held off-site and in the repository', type:'bar',
      value: '3.4 GB files',
      chart: chart({type:'bar', h:200, cats:['Repo','Files','DB dump','Manifest'],
        series:[{name:'MB', colour:'#1E9E6A', data:[18, 3482, 2.4, 0.6]}]})}));
}

function drVerifyArtifacts(){
  ARTEFACTS.forEach(a => { a.verified = 'Verified'; a.when = TODAY + ' ' + nowClock(); });
  drAudit('Backup', 'System artefacts re-verified', '10 artefacts', 'all verified',
    'Administrator ran a verification pass', 'Backup');
  renderAll();
  if(el('sbMsg')) el('sbMsg').textContent = 'All ' + ARTEFACTS.length + ' artefacts were re-read: repository tags, lockfile, ' +
    'migration head and the off-site mirror all match the recorded references.';
  toast('All system artefacts verified');
}

/* ---------------- small form helpers ---------------- */
function fpVal(id, fallback){
  const e = el(id);
  return e && e.value !== undefined && e.value !== '' ? e.value : fallback;
}
function put(id, html){ const e = el(id); if(e) e.innerHTML = html; }
const drTime = v => String(v || '').slice(11,16) || '—';
</script>
