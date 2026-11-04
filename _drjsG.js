<script>
/* ============================================================
   DATA RECOVERY, SYSTEM BACKUP & FACTORY RESET (7/7)
   The one render pass, the delegated wiring, the record sheets,
   the exports and the boot.
   ============================================================ */

function renderAll(){
  renderBand();
  renderEnvBar();
  renderBackups();
  renderSchedule();
  renderRecovery();
  renderSystem();
  renderModes();
  renderProtection();
  renderScenarios();
  renderTesting();
  renderSecurity();
  renderDashboard();
  renderSupabase();
  renderImplementation();
  renderSubnav();
}

/* ---------------- the record sheet behind every row ---------------- */
const SHEET_FIELDS = {
  bkBody:(r) => [
    ['Copy', r.id], ['Taken', drWhen(r.when)], ['Type', r.type],
    ['Scope', (BACKUP_TYPES.find(t => t.id === r.type) || {}).scope],
    ['Size', bytes(r.size)], ['Rows', r.rows ? num(r.rows) : 'structure only'],
    ['State', r.status], ['Verified', r.verifiedAt ? drWhen(r.verifiedAt) : 'not verified'],
    ['Retention until', fmtDate(r.retention)], ['Protection', r.protection],
    ['Checksum', 'sha256:' + checksumOf(r)], ['Actor', r.actorName],
    ['Encryption', r.encryption], ['Location', r.location], ['Note', r.note || '—']
  ],
  rpBody:(r) => [['Point', r.id], ['Taken', drWhen(r.when)], ['Type', r.type], ['Size', bytes(r.size)],
    ['Kept until', fmtDate(r.retention)], ['Why held', r.note]],
  rlogBody:(r) => [['When', drWhen(r.when)], ['Operation', r.what], ['Environment', envLabel(r.env)],
    ['Recovery point', r.point], ['Operator', staffName(r.by)],
    ['Approver', r.approvedBy === '—' ? '—' : staffName(r.approvedBy)], ['Result', r.result], ['Note', r.note]],
  sbBody:(r) => [['Reference', r.id], ['Kind', r.kind], ['Artefact', r.name], ['Protected copy', r.where],
    ['Version / tag', r.ref], ['Last verified', drWhen(r.when)], ['Size', r.size], ['State', r.verified], ['Note', r.note]],
  jobBody:(r) => [['Job', r.id], ['Mode', r.mode], ['Environment', envLabel(r.env)], ['Operation', r.what],
    ['Started', drWhen(r.started)], ['Finished', drWhen(r.finished)], ['Requested by', staffName(r.by)],
    ['Approved by', r.approvedBy === '—' ? '—' : staffName(r.approvedBy)], ['Idempotency key', r.key],
    ['Progress', r.progress + '%'], ['State', r.status], ['Note', r.note]],
  ntfBody:(r) => [['When', drWhen(r.when)], ['Event', r.event], ['Environment', envLabel(r.env)],
    ['Job', r.job], ['Told', r.to], ['Channel', r.channel], ['Delivery', r.state]],
  tstBody:(r) => [['When', drWhen(r.when)], ['Environment', envLabel(r.env)], ['Copy tested', r.point],
    ['Result', r.result], ['Duration', r.duration], ['Rows', r.rows], ['Failures', r.failures], ['Corrective action', r.action]],
  accBody:(r) => [['When', drWhen(r.when)], ['Actor', r.actor === 'system' ? 'Scheduled job' : staffName(r.actor)],
    ['Action', r.action], ['Target', r.target], ['Result', r.result], ['Note', r.note]],
  audBody:(r) => [['When', drWhen(r.when)], ['Kind', r.kind], ['Event', r.what], ['Previous', r.from],
    ['Updated', r.to], ['Staff', r.by === 'system' ? 'Scheduled job' : staffName(r.by)],
    ['Reason', r.reason], ['Result', r.result], ['Record', r.id]]
};
const SHEET_TITLES = {
  bkBody:'Backup copy', rpBody:'Protected recovery point', rlogBody:'Recovery attempt',
  sbBody:'System artefact', jobBody:'Reset job', ntfBody:'Administrator notice',
  tstBody:'Restoration test', accBody:'Access event', audBody:'Audit entry'
};
function drOpenSheet(hostId, idx){
  const st = TBL[hostId];
  const row = st && st.rows ? st.rows[idx] : null;
  if(!row) return;
  const fields = (SHEET_FIELDS[hostId] || (() => Object.entries(row)))(row);
  openModal(SHEET_TITLES[hostId] || 'Record', row.id || row.when || '',
    `<div class="recsheet"><div class="recgrid">${fields.filter(f => f[0] && f[1] !== undefined && f[1] !== '').map(([k, v]) =>
      `<div class="pfield${String(v).length > 60 ? ' wide' : ''}"><div class="pk">${esc(k)}</div>
        <div class="pv">${esc(v === undefined || v === null || v === '' ? '—' : v)}</div></div>`).join('')}</div></div>`,
    [{label:'Close', act:'close'}]);
}

/* ---------------- subnav highlighting ---------------- */
let navObserver = null;
function renderSubnav(){
  const links = [...document.querySelectorAll('#subnav .snav')];
  if(!links.length) return;
  const sections = links.map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  if(navObserver) navObserver.disconnect();
  if(typeof IntersectionObserver === 'undefined') return;
  navObserver = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if(!en.isIntersecting) return;
      links.forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + en.target.id));
    });
  }, {rootMargin:'-15% 0px -70% 0px', threshold:0});
  sections.forEach(s => navObserver.observe(s));
}

/* ---------------- exports ---------------- */
function drExport(){
  const rows = [['Copy','Taken','Type','Scope','Size (MB)','Rows','State','Verified','Retention until','Protection','Actor','Note']]
    .concat(BACKUPS.map(b => [b.id, b.when, b.type,
      (BACKUP_TYPES.find(t => t.id === b.type) || {}).scope || '', b.size, b.rows, b.status,
      b.verifiedAt || '', b.retention, b.protection, b.actorName, b.note || '']));
  downloadFile('backup-history-' + TODAY + '.csv', 'text/csv', toCsv(rows));
  drAudit('Access', 'Backup history exported', '—', rows.length - 1 + ' rows', 'Administrator export', 'Access');
  renderAll();
}
function drPrint(){
  printRows('Data recovery, backup and reset record',
    [{label:'Copy'},{label:'Taken'},{label:'Type'},{label:'Size'},{label:'State'},{label:'Verified'},{label:'Kept until'},{label:'Actor'}],
    BACKUPS.slice(0, 60).map(b => [b.id, drWhen(b.when), b.type, bytes(b.size), b.status,
      b.verifiedAt ? drWhen(b.verifiedAt) : '—', fmtDate(b.retention), b.actorName]));
}

/* ---------------- wiring ---------------- */
function wireAll(){
  document.addEventListener('click', e => {
    /* sort and paging */
    const th = e.target.closest('[data-drtsort]');
    if(th){
      const host = th.dataset.drtsort, key = th.dataset.k;
      const st = TBL[host];
      if(st){ st.dir = st.sort === key && st.dir === 'desc' ? 'asc' : st.sort === key ? 'desc' : 'desc'; st.sort = key; }
      renderAll();
      return;
    }
    const pg = e.target.closest('[data-drtpage]');
    if(pg){
      const host = pg.dataset.drtpage, st = TBL[host];
      if(st){ st.page = Math.max(1, st.page + Number(pg.dataset.p)); }
      renderAll();
      return;
    }
    /* rows open a sheet */
    const row = e.target.closest('[data-drrow]');
    if(row){ drOpenSheet(row.dataset.drrow, Number(row.dataset.i)); return; }

    /* actions */
    const act = e.target.closest('[data-dr]');
    if(act){
      const what = act.dataset.dr;
      if(what === 'verifyPoint'){ drVerifyPoint(); return; }
      if(what === 'mode'){ drStartMode(act.dataset.mode); return; }
      if(what === 'modeLocked'){ drStartMode(act.dataset.mode); return; }
      if(what === 'modeNext'){ drModeNext(); return; }
      if(what === 'modeAbort'){ drModeAbort(); return; }
      if(what === 'modeRun'){ drModeRun(); return; }
      if(what === 'env'){ drSetEnv(act.dataset.env); return; }
      if(what === 'maint'){ drToggleMaint(); return; }
      if(what === 'scenario'){ drScenario(act.dataset.id); return; }
      return;
    }

    /* top bar */
    if(e.target.closest('#menuBtn')){ el('sidebar').classList.toggle('open'); return; }
    if(e.target.closest('#quickBackup')){ drBackupNow(); return; }
    if(e.target.closest('#quickRestore')){ goto('s3'); return; }
    if(e.target.closest('#bellBtn')){ goto('s1'); return; }
    if(e.target.closest('#exportBtn')){ drExport(); return; }
    if(e.target.closest('#printBtn')){ drPrint(); return; }

    /* 1 */
    if(e.target.closest('#bkVerifyBtn')){ drVerifyBackup(); return; }
    if(e.target.closest('#bkRetainBtn')){ drExtendRetention(); return; }
    if(e.target.closest('#bkDownloadBtn')){ drRequestCopy(); return; }
    /* 2 */
    if(e.target.closest('#schSaveBtn')){ drSaveSchedule(); return; }
    if(e.target.closest('#schPreviewBtn')){ drPreviewNext(); return; }
    if(e.target.closest('#retPurgeBtn')){ drPurgeExpired(); return; }
    /* 3 */
    if(e.target.closest('#rsVerifyBtn')){ drVerifyPoint(); return; }
    if(e.target.closest('#rsStageBtn')){ drRestoreStaging(); return; }
    if(e.target.closest('#rsProdBtn')){ drRestoreProduction(); return; }
    if(e.target.closest('#rsCheckBtn')){ drRunChecks(); return; }
    /* 4 */
    if(e.target.closest('#sbVerifyBtn')){ drVerifyArtifacts(); return; }
    /* 8 */
    if(e.target.closest('#tstRunBtn')){ drScheduleTest(); return; }
    if(e.target.closest('#smokeRunBtn')){ drRunSmoke(); return; }
    /* 9 */
    if(e.target.closest('#accReviewBtn')){ drStartReview(); return; }
    /* 11 */
    if(e.target.closest('#supCheckBtn')){ drSupCheck(); return; }
    /* modal */
    if(e.target.closest('#modalClose')){ closeModal(); return; }
    if(e.target.id === 'modal'){ closeModal(); return; }
    const nav = e.target.closest('#subnav .snav');
    if(nav){
      document.querySelectorAll('#subnav .snav').forEach(a => a.classList.remove('on'));
      nav.classList.add('on');
      return;
    }
  });

  document.addEventListener('change', e => {
    const t = e.target;
    if(t.id === 'bkSel'){ DR.selBackup = t.value; renderAll(); return; }
    if(t.id === 'rsPoint'){ DR.selPoint = t.value; DR.pointVerified = ''; DR.checksRun = false; renderAll(); return; }
    if(t.id === 'bkType'){ DR.filterType = t.value; renderAll(); return; }
    if(t.id === 'bkStatus'){ DR.filterStatus = t.value; renderAll(); return; }
    if(t.id === 'sbKind'){ DR.filterArtifact = t.value; renderAll(); return; }
    if(t.id === 'audKind'){ DR.filterAudit = t.value; renderImplementation(); return; }
  });

  const search = el('globalSearch');
  if(search){
    search.addEventListener('input', () => {
      const q = search.value.trim().toLowerCase();
      if(!q){ DR.filterType = ''; DR.filterStatus = ''; renderAll(); return; }
      const hit = BACKUPS.find(b => (b.id + ' ' + b.type + ' ' + b.actorName + ' ' + b.status).toLowerCase().indexOf(q) > -1);
      if(hit){ DR.selBackup = hit.id; DR.filterType = ''; DR.filterStatus = ''; renderAll(); }
    });
  }

  document.addEventListener('keydown', e => {
    if(e.key === 'Escape') closeModal();
    if(e.key === '/' && document.activeElement !== search){ e.preventDefault(); if(search) search.focus(); }
  });
}

function goto(id){
  const sec = document.getElementById(id);
  if(sec && sec.scrollIntoView) sec.scrollIntoView({behavior:'smooth', block:'start'});
  document.querySelectorAll('#subnav .snav').forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + id));
}

function boot(){
  renderAll();
  wireAll();
  if(el('topRefresh')) el('topRefresh').textContent = fmtDate(TODAY) + ' · ' + PROJECT.appVersion;
  toast('Backup book loaded — ' + BACKUPS.length + ' copies, ' + BACKUPS.filter(b => b.status === 'Verified').length + ' verified', 'ok');
}
if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
</script>
</body>
</html>
