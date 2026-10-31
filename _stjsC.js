/* ============================================================
   SETTINGS MODULE  (3/4) · Customer portal, data & backup,
   audit logs, documents and reporting settings
   ============================================================ */

/* ===================== 10 · CUSTOMER PORTAL ===================== */
function renderSec10(){
  el('portalAvail').innerHTML = [
    row('Customer portal','Master switch for the customer app', tg('portalOn',10)),
    row('Self registration','Customers can create their own account', tg('portalSelfReg',10)),
    row('Verify before first login','OTP to the registered phone', tg('portalVerify',10)),
    row('Accepted identification','', pick('portalIdType',10,['National ID + Phone','National ID only','Passport + Phone'])),
    row('Maintenance message','Shown while the portal is closed', `<span style="display:block;width:100%">${tarea('portalMaintMsg',10)}</span>`, 'tall')
  ].join('');
  el('portalBadge').textContent = CFG.portalOn ? 'Open' : 'Closed';
  el('portalBadge').className = 'badge ' + (CFG.portalOn ? 'b-ok' : 'b-rej');

  el('portalLogin').innerHTML = [
    row('Login method','', pick('portalLogin',10,['Phone number + OTP','Phone number + password','Email + password','Either'])),
    row('OTP length','', num('portalOtpLen',10,`min="4" max="8"`) + unit('digits')),
    row('OTP validity','', num('portalOtpValidity',10,`min="1" max="30"`) + unit('min')),
    row('Minimum password length','', num('custPwdMin',10,`min="6" max="32"`) + unit('chars')),
    row('Require letters and numbers','', tg('custPwdComplex',10)),
    row('Failed attempt limit','', num('custFailLimit',10,`min="3" max="10"`) + unit('attempts')),
    row('Lockout duration','', num('custLock',10,`min="5" max="120"`) + unit('min'))
  ].join('');

  el('portalProfile').innerHTML = [
    row('Change phone number','Requires OTP to the old number', tg('profPhone',10)),
    row('Change email address','Verified by link', tg('profEmail',10)),
    row('Change home address','', tg('profAddress',10)),
    row('Add next of kin','', tg('profKin',10)),
    row('Update employment details','', tg('profEmployment',10))
  ].join('');
  el('portalProfile2').innerHTML = [
    row('Change profile photo','', tg('profPhoto',10)),
    row('Staff approval for profile changes','Review before the record updates', tg('profApproval',10)),
    row('Customer can close their account','Subject to the closure rules in section 18', tg('portalSelfClose',10)),
    row('Show account number','On the customer dashboard', tg('portalShowAcct',10)),
    row('Session timeout for the portal','', num('portalTimeout',10,`min="5" max="120"`) + unit('min'))
  ].join('');

  el('portalApply').innerHTML = [
    row('Applications in portal','', tg('portalApply',10)),
    row('Maximum amount','', num('portalApplyMax',10,`step="100000"`)),
    row('Documents required','', tg('portalApplyDocs',10))
  ].join('');
  el('portalDocs').innerHTML = [
    row('Uploads allowed','', tg('portalUpload',10)),
    row('Maximum size per file','', num('portalUploadSize',10,`min="1" max="25"`) + unit('MB')),
    row('Allowed formats','', txt('portalUploadFormats',10)),
    row('Maximum files per application','', tag('5 files'))
  ].join('');
  el('portalDash').innerHTML = [
    row('Show outstanding balance','', tg('portalDashBal',10)),
    row('Show next instalment','', tg('portalDashDue',10)),
    row('Show repayment progress','', tg('portalDashProgress',10)),
    row('Show payment history','', tg('portalDashHistory',10)),
    row('Statement access','Download statements', tg('portalStatement',10)),
    row('Statement period','', num('portalStatementMonths',10,`min="1" max="36"`) + unit('months')),
    row('SMS notifications','', tg('portalNotifSms',10)),
    row('Email notifications','', tg('portalNotifEmail',10))
  ].join('');
  renderPortalPreview();
}
function renderPortalPreview(){
  const on = CFG.portalOn;
  el('pvName').textContent = CFG.orgTrading || 'Golden Financial';
  const rows = [];
  if(CFG.portalDashDue) rows.push(['Next instalment','MK 48,250.00']);
  if(CFG.portalStatOn !== undefined){} /* placeholder */
  if(CFG.portalDashHistory) rows.push(['Last payment','MK 48,250.00']);
  rows.push(['Loan progress', on ? '60% repaid' : 'Suspended']);
  el('pvRows').innerHTML = rows.map(r=>`<div class="prow"><span>${r[0]}</span><b>${r[1]}</b></div>`).join('');
  const btns = [];
  if(CFG.portalApply) btns.push(['Apply','g']);
  if(CFG.portalStatement) btns.push(['Statement','']);
  if(CFG.portalUpload) btns.push(['Upload','']);
  el('pvBtns').innerHTML = btns.map(b=>`<span class="${b[1]}">${b[0]}</span>`).join('') ||
    '<span style="color:#8A90A0">No self-service actions enabled</span>';
  el('pvBal').textContent = CFG.portalOn && CFG.portalDashBal ? 'MK 486,250.00' : '•••';
  el('pvGreet').textContent = on ? 'Hi, Chisomo' : 'Portal closed';
  el('pvLoan').textContent = on ? 'Business Boost · LN-2026-0481' : CFG.portalMaintMsg.slice(0,44) + '…';
}

/* ===================== 11 · DATA & BACKUP ===================== */
const SYNC = [
  ['customers', 4812, '30 Oct 2026 · 14:28', 'Synced'],
  ['loans', 1264, '30 Oct 2026 · 14:28', 'Synced'],
  ['repayments', 18420, '30 Oct 2026 · 14:27', 'Synced'],
  ['documents', 3960, '30 Oct 2026 · 14:20', 'Synced'],
  ['notifications', 22480, '30 Oct 2026 · 14:12', 'Lagging'],
  ['audit_logs', 91240, '30 Oct 2026 · 14:28', 'Synced']
];
const BACKUPS = [
  ['30 Oct 2026 · 23:00', 'Full', '1.84 GB', '3m 12s', 'Completed'],
  ['29 Oct 2026 · 23:00', 'Full', '1.81 GB', '3m 04s', 'Completed'],
  ['28 Oct 2026 · 23:00', 'Full', '1.79 GB', '2m 58s', 'Completed'],
  ['27 Oct 2026 · 23:00', 'Incremental', '412 MB', '48s', 'Completed'],
  ['26 Oct 2026 · 23:00', 'Full', '1.76 GB', '3m 21s', 'Completed'],
  ['25 Oct 2026 · 23:00', 'Incremental', '388 MB', '44s', 'Warning']
];
const INTEGRITY = [
  ['Loan balances reconcile to repayment ledger','All 1,264 loans balanced',true],
  ['Every repayment is linked to a loan','0 orphans',true],
  ['No disbursement without an approval','0 violations',true],
  ['Customer identity uniqueness','0 duplicate national IDs',true],
  ['Interest accrual matches schedule','2 loans differ by &lt; MK 1',false],
  ['Document references resolve','0 missing files',true],
  ['Audit log chain intact','No gaps in 91,240 records',true]
];
const RECOVERY = [
  ['1','Declare incident and freeze writes','Within 15 minutes'],
  ['2','Restore latest full snapshot','Target 4 hours'],
  ['3','Replay incremental backups','Target 1 hour'],
  ['4','Reconcile ledger against gateway statements','Same day'],
  ['5','Notify RBM if customer data is affected','Within 72 hours']
];
function renderSec11(){
  el('dbHealth').innerHTML = [
    ['Database connection', 'Connected', 'Supabase · af-south-1', 'ok', '24 ms'],
    ['Replication lag', '0.4 s', 'Read replica · af-south-1', 'ok', 'healthy'],
    ['Storage used', '18.4 GB', 'of 100 GB provisioned', 'warn', '18%'],
    ['Last backup', '12 h ago', 'Full · encrypted', 'ok', '1.84 GB']
  ].map(([t,v,s,d,x])=>`<div class="hcard"><div class="hh"><span class="dot ${d}"></span>${t}</div>
    <div class="hv">${v}</div><div class="hs">${s} · ${x}</div></div>`).join('');

  el('dbCfg').innerHTML = [
    row('Supabase project','', txt('dbProject',11)),
    row('Database host','', txt('dbHost',11)),
    row('Region','', pick('dbRegion',11,['af-south-1 (Cape Town)','eu-west-1 (Ireland)','us-east-1 (Virginia)'])),
    row('SSL required','', tg('dbSsl',11)),
    row('Connection pool size','', num('dbPool',11,`min="1" max="100"`)),
    row('API keys','Stored as environment secrets, never shown', `<span class="val-tag">•••• •••• •••• 4f2a</span>`),
    row('Mask keys in the interface','', tg('dbMaskKeys',11)),
    row('Synchronization interval','', num('syncInterval',11,`min="1" max="60"`) + unit('min'))
  ].join('');

  el('syncBody').innerHTML = SYNC.map(s=>`<tr>
    <td style="font-weight:700">${s[0]}</td><td class="num">${nf(s[1])}</td>
    <td style="font-size:10.5px;color:var(--muted)">${s[2]}</td>
    <td><span class="chip ${s[3]==='Synced'?'st-ok':'st-await'}">${s[3]}</span></td>
    <td style="text-align:right"><button class="btn btn-ghost btn-sm" data-sync="${s[0]}"
      style="padding:2px 7px;font-size:10px">Sync</button></td></tr>`).join('');
  el('syncBody').querySelectorAll('[data-sync]').forEach(b=>{
    b.onclick = ()=>{ toast(`Table “${b.dataset.sync}” synchronized.`); el('syncAgo').textContent='just now'; };
  });

  el('backupCfg').innerHTML = [
    row('Backup frequency','', pick('backupFreq',11,['Hourly','Every 6 hours','Daily','Weekly'])),
    row('Backup time','', pick('backupTime',11,['01:00','12:00','18:00','23:00'])),
    row('Copies retained','', num('backupRetain',11,`min="7" max="365"`) + unit('copies')),
    row('Encryption','AES-256 at rest', tg('backupEncrypt',11)),
    row('Off-site copy','', tg('backupOffsite',11)),
    row('Storage location','', pick('backupLocation',11,['Supabase Storage + AWS af-south-1','AWS af-south-1 only','Local NAS + AWS']))
  ].join('');
  renderBackupNext();

  el('backupBody').innerHTML = BACKUPS.map((b,i)=>`<tr>
    <td style="font-size:10.5px;white-space:nowrap">${b[0]}</td><td>${b[1]}</td>
    <td class="num">${b[2]}</td><td>${b[3]}</td>
    <td><span class="chip ${b[4]==='Completed'?'st-ok':'st-await'}">${b[4]}</span></td>
    <td style="text-align:right"><button class="btn btn-ghost btn-sm" data-restore="${i}"
      style="padding:2px 7px;font-size:10px">Restore</button></td></tr>`).join('');
  el('backupBody').querySelectorAll('[data-restore]').forEach(b=>{
    b.onclick = ()=>{
      const bk = BACKUPS[Number(b.dataset.restore)];
      openModal('Restore backup', bk[0] + ' · ' + bk[1] + ' · ' + bk[2], `
        <div class="note red"><div><b>This replaces current data.</b> A restore rewinds customers, loans,
          repayments and documents to the selected snapshot. Anything recorded after that point is lost
          unless you export it first.</div></div>
        <div class="kv" style="margin-top:10px"><span class="k">Snapshot</span><span class="v">${bk[0]}</span></div>
        <div class="kv"><span class="k">Type</span><span class="v">${bk[1]}</span></div>
        <div class="kv"><span class="k">Size</span><span class="v">${bk[2]}</span></div>
        <div class="kv"><span class="k">Status</span><span class="v">${bk[4]}</span></div>
        <div class="cfg-note" style="margin-top:10px;font-size:10.5px;color:var(--muted)">
          Restores run into a staging database first and require administrator approval.</div>`,
        [{label:'Cancel', act:'close'},
         {label:'Export current data', cls:'btn-ghost', act:()=>{ closeModal(); exportCfg(); }},
         {label:'Continue to restore', cls:'btn-red', act:()=>{
            closeModal(); toast('Restore queued — staging copy will be verified before promotion.','info');
            logAudit('Admin','Backup restore requested: '+bk[0],'backup.restore');
         }}]);
    };
  });

  el('exportCfg2').innerHTML = [
    row('Default export format','', pick('exportFormat',11,['CSV','Excel (.xlsx)','JSON'])),
    row('Include personal data','Customer names, IDs and phones', tg('exportPii',11)),
    row('Watermark exports','Adds the requester and timestamp', tg('exportWatermark',11)),
    row('Maximum rows per export','', num('importMax',11,`step="1000"`)),
    row('Export requires approval','Administrator sign-off', tg('compBulkApprove',11))
  ].join('');
  el('retentionCfg').innerHTML = [
    row('Customer records','', pick('retentionCustomers',11,['60 months','84 months','120 months','Indefinite'])),
    row('Loan records','', pick('retentionLoans',11,['60 months','120 months','Indefinite'])),
    row('Transactions','', pick('retentionTxns',11,['84 months','120 months','Indefinite'])),
    row('System logs','', pick('retentionLogs',11,['12 months','24 months','60 months']))
  ].join('');

  el('archiveCfg').innerHTML = [
    row('Archive records older than','', num('archiveAfter',11,`min="6" max="120"`) + unit('months')),
    row('Automatic archiving','Runs with the nightly job', tg('archiveAuto',11)),
    row('Archive destination','', pick('archiveStore',11,['Cold storage bucket','Separate schema','External drive'])),
    row('Restore from archive','On request, within 24 hours', tag('Available'))
  ].join('');
  el('archiveStat').textContent = '3,482 records · 412 MB · oldest 2019';

  el('dupCfg').innerHTML = [
    row('Match on','', pick('dupFields',11,['National ID, phone number','National ID only','Phone number + surname'])),
    row('Similarity threshold','Fuzzy name matching', num('dupTolerance',11,`min="50" max="100"`) + unit('%')),
    row('Auto-merge strong matches','Above 98% · keeps the oldest record', tg('dupAutoMerge',11)),
    row('Scan schedule','', tag('Nightly · 02:00'))
  ].join('');
  renderDupResults(false);

  el('intList').innerHTML = INTEGRITY.map(([t,s,ok],i)=>`
    <div class="check"><span class="ck ${ok?'y':'w'}">${ok?'✓':'!'}</span>
      <div style="flex:1"><b>${t}</b><span class="s">${s}</span></div>
      <span class="mini-tag ${ok?'g':'a'}">${ok?'Pass':'Review'}</span></div>`).join('');

  el('importCfg').innerHTML = [
    row('Import mode','', pick('importMode',11,['Validate then import','Import immediately','Dry run only'])),
    row('Maximum rows per file','', num('importMaxRows',11,`step="1000"`)),
    row('Duplicate handling on import','', pick('importDupFields',11,['Skip duplicates','Update existing','Create anyway'])),
    row('Require approval to import','', tg('compBulkApprove',11))
  ].join('');
  el('recoveryList').innerHTML = RECOVERY.map(([n,t,s])=>`
    <div class="lrow"><div class="lic">${n}</div>
      <div><div class="lt">${t}</div><div class="ls">${s}</div></div></div>`).join('');
}
function renderBackupNext(){
  const d = new Date(2026,9,30);
  el('nextBackup').textContent = `30 Oct 2026 · ${CFG.backupTime}`;
  el('nextBackupSub').textContent = `${CFG.backupFreq} snapshot · retains ${CFG.backupRetain} copies · ${CFG.backupEncrypt?'encrypted AES-256':'unencrypted'}`;
}
function renderDupResults(ran){
  const box = el('dupResults');
  if(!ran){
    box.innerHTML = `<div class="note"><div>No scan has run in this session. Last scan
      30 Oct 2026 · 02:00 found <b>3</b> possible duplicates, 0 confirmed.</div></div>`;
    return;
  }
  box.innerHTML = `<div class="grp" style="margin-top:4px">Scan results <span class="gt">3 possible duplicates</span></div>
    ${[['Chisomo Kachale / Chisomo Kachala','National ID differs by 1 digit · 94%'],
       ['Memory Phiri / Memory Phiri','Same national ID · 100%'],
       ['Blessings Tembo / B. Tembo','Same phone · 91%']]
      .map(([a,b])=>`<div class="lrow"><div class="lic">!</div>
        <div><div class="lt">${a}</div><div class="ls">${b}</div></div>
        <div class="lr"><button class="btn btn-ghost btn-sm">Merge</button></div></div>`).join('')}`;
}

/* ===================== 12 · AUDIT LOGS ===================== */
const SEED_AUDIT = [
  ['08:42','Admin','Signed in to the admin portal','session','Chikondi Mwale','Success'],
  ['08:15','Config','Payment method settings updated: Airtel Money','payment.airtelOn','Chikondi Mwale','Success'],
  ['08:02','Financial','Disbursement posted · LN-2026-0479 · MK 850,000','loan.0479','Memory Phiri','Success'],
  ['07:58','Permission','Role assigned: Loan Officer','user.ybanda','Chikondi Mwale','Success'],
  ['07:41','Failed','Failed sign-in attempt (3 of 5)','auth.login','Peter Chirwa','Blocked'],
  ['07:30','Customer','Customer phone number updated','customer.3188','Esther Mwale','Success'],
  ['07:12','API','GET /v2/loans · 200 · 182 ms','api.loans','integration.n8n','Success'],
  ['06:58','Error','Timeout calling SMS gateway','integration.sms','system','Failed'],
  ['06:40','Financial','Repayment reversed · RCP-000912','repayment.912','Memory Phiri','Success'],
  ['06:12','Config','Loan product updated: Business Boost','product.BB-01','Thandiwe Kamanga','Success'],
  ['05:44','Permission','Permission revoked: System settings on Auditor','role.Auditor','Chikondi Mwale','Success'],
  ['05:20','Customer','Bulk customer export requested (4,812 rows)','export.customers','Agnes Chikopa','Success'],
  ['04:58','Failed','Failed sign-in attempt · unknown account','auth.login','unknown','Blocked'],
  ['04:30','Admin','Scheduled report delivered: Portfolio summary','report.portfolio','system','Success'],
  ['03:48','Financial','Late penalty charged · LN-2026-0392 · MK 7,500','loan.0392','system','Success'],
  ['03:02','API','POST /v2/repayments · 201 · 240 ms','api.repayments','integration.airtel','Success'],
  ['02:40','Error','Supabase connection pool exhausted','integration.db','system','Warning'],
  ['02:05','Config','Backup completed · full · 1.84 GB','backup.daily','system','Success'],
  ['01:30','Permission','Custom role created: Field Agent','role.Field Agent','Chikondi Mwale','Success'],
  ['00:48','Customer','Customer record archived','customer.2044','system','Success']
];
SEED_AUDIT.forEach(([time,cat,action,entity,actor,result])=>{
  AUDIT.push({time, cat, action, entity, actor, result, ip:'197.210.14.22'});
});
const A = {cat:'', q:'', actor:'', page:1, per:12};
function auditFiltered(){
  const q = A.q.toLowerCase();
  return AUDIT.filter(a =>
    (!A.cat || a.cat === A.cat) &&
    (!A.actor || a.actor === A.actor) &&
    (!q || (a.action + a.entity + a.actor + a.ip).toLowerCase().includes(q)));
}
function renderAudit(){
  const rows = auditFiltered();
  const pages = Math.max(1, Math.ceil(rows.length/A.per));
  if(A.page > pages) A.page = pages;
  const slice = rows.slice((A.page-1)*A.per, A.page*A.per);
  const CAT = {Admin:'b-appr', Config:'b-auth', Financial:'b-ok', Permission:'b-await',
    Customer:'b-draft', Failed:'b-rej', Error:'b-rej', API:'b-draft'};
  el('auditBody').innerHTML = slice.length ? slice.map(a=>`<tr>
    <td style="font-variant-numeric:tabular-nums;white-space:nowrap">${a.time}</td>
    <td><span class="badge ${CAT[a.cat]||'b-draft'}">${a.cat}</span></td>
    <td style="font-weight:600;white-space:nowrap">${a.actor}</td>
    <td class="msg" style="max-width:300px">${a.action}</td>
    <td style="font-size:10px;color:var(--muted);font-family:ui-monospace,monospace">${a.entity}</td>
    <td style="font-variant-numeric:tabular-nums;font-size:10.5px">${a.ip}</td>
    <td><span class="chip ${a.result==='Success'?'st-ok':a.result==='Warning'?'st-await':'st-fail'}">${a.result}</span></td>
  </tr>`).join('') : '<tr><td colspan="7" class="empty">No log entries match these filters.</td></tr>';

  el('auditPager').innerHTML = `<span>Showing ${rows.length?((A.page-1)*A.per+1):0}–${Math.min(A.page*A.per,rows.length)} of ${rows.length}</span>
    <button id="audPrev" ${A.page===1?'disabled':''}>‹ Prev</button>
    <button id="audNext" ${A.page===pages?'disabled':''}>Next ›</button>`;
  if(el('audPrev')) el('audPrev').onclick = ()=>{ A.page--; renderAudit(); };
  if(el('audNext')) el('audNext').onclick = ()=>{ A.page++; renderAudit(); };

  const fails = AUDIT.filter(a=>a.cat==='Failed').length;
  const perm = AUDIT.filter(a=>a.cat==='Permission').length;
  const errs = AUDIT.filter(a=>a.cat==='Error').length;
  el('auditTiles').innerHTML = [
    ['Events today', AUDIT.length, 'Across 9 categories', 'ok'],
    ['Failed sign-ins', fails, '1 account now locked', 'bad'],
    ['Permission changes', perm, 'Review recommended', 'warn'],
    ['System errors', errs, 'SMS gateway + DB pool', 'warn']
  ].map(([t,v,s,d])=>`<div class="hcard"><div class="hh"><span class="dot ${d}"></span>${t}</div>
    <div class="hv">${v}</div><div class="hs">${s}</div></div>`).join('');

  const alerts = [
    ['Account locked after repeated failures','Peter Chirwa · 41.87.22.14 · Mzuzu','High','08:02'],
    ['Login from an unrecognised country','user “unknown” · 102.68.77.19 · Lagos, NG','High','06:55'],
    ['Permission change by administrator','System settings revoked on Auditor','Medium','05:44'],
    ['Bulk export of customer data','4,812 rows exported by Agnes Chikopa','Medium','05:20']
  ];
  el('secAlertCount').textContent = alerts.length;
  el('secAlerts').innerHTML = alerts.map(([t,s,lvl,time])=>`
    <div class="lrow"><div class="lic" style="background:${lvl==='High'?'#FDEDED':'#FFF4E0'};
      color:${lvl==='High'?'#B32C2C':'#9A6A0D'}">!</div>
      <div><div class="lt">${t}</div><div class="ls">${s}</div></div>
      <div class="lr"><span class="mini-tag ${lvl==='High'?'r':'a'}">${lvl}</span>
        <span class="dim">${time}</span></div></div>`).join('');

  el('errCfg').innerHTML = [
    row('API request monitoring','Log every call with latency', tg('apiMonitor',12)),
    row('Error alert threshold','Errors per hour before alerting', num('errThreshold',12,`min="1" max="100"`)),
    row('Send alerts to','', txt('errAlertEmail',12)),
    row('Group repeated errors','Collapse identical events', tg('errGroup',12))
  ].join('');
  el('apiStat').textContent = '24,812 requests · 0.14% error rate · 182 ms avg · p95 640 ms';
  el('auditRetention').innerHTML = [
    row('Retention period','', pick('auditRetain',12,['12 months','24 months','60 months','120 months'])),
    row('Immutable log','Append-only, tamper evident', tg('auditImmutable',12)),
    row('Log read access','Record who viewed sensitive records', tg('auditReads',12)),
    row('Allow audit export','Administrators and auditors', tg('auditExport',12))
  ].join('');
}

/* ===================== 13 · DOCUMENTS ===================== */
const DOCS = [
  {n:'Loan agreement', t:'Agreement', v:'v4.2', up:'24 Oct 2026', st:'Active'},
  {n:'Customer registration form', t:'Form', v:'v2.8', up:'12 Sep 2026', st:'Active'},
  {n:'Loan application form', t:'Form', v:'v3.1', up:'24 Oct 2026', st:'Active'},
  {n:'Repayment receipt', t:'Receipt', v:'v1.9', up:'02 Oct 2026', st:'Active'},
  {n:'Customer statement', t:'Statement', v:'v2.3', up:'28 Oct 2026', st:'Active'},
  {n:'Loan settlement letter', t:'Letter', v:'v1.4', up:'18 Aug 2026', st:'Draft'}
];
const REQ_DOCS = [
  ['reqIdCopy','National ID copy','Front and back, certified',true],
  ['reqPayslip','Payslip / proof of income','Last 3 months',true],
  ['reqBankStmt','Bank statement','Last 6 months',false],
  ['reqGuarantor','Guarantor national ID','Plus signed consent',true],
  ['reqCollateral','Collateral documents','Title deed or logbook',false],
  ['reqPhoto','Passport photo','Recent, plain background',true]
];
function renderSec13(){
  el('docBody').innerHTML = DOCS.map((d,i)=>`<tr>
    <td style="font-weight:700">${d.n}</td><td>${d.t}</td><td>${d.v}</td>
    <td style="font-size:10.5px;color:var(--muted)">${d.up}</td>
    <td><span class="chip ${d.st==='Active'?'st-ok':'st-await'}">${d.st}</span></td>
    <td style="text-align:right"><button class="btn btn-ghost btn-sm" data-doc="${i}"
      style="padding:3px 7px;font-size:10px">Preview</button></td></tr>`).join('');
  el('docBody').querySelectorAll('[data-doc]').forEach(b=>b.onclick=()=>docModal(DOCS[Number(b.dataset.doc)]));
  el('docCount').textContent = DOCS.length + ' templates';

  el('letterCfg').innerHTML = [
    row('Show logo','', tg('lhLogoShow',13)),
    row('Show header line','', tg('lhHeader',13)),
    row('Show footer address','', tg('lhFooterShow',13)),
    row('Footer text','', txt('lhFooter',13)),
    row('Document watermark','', tg('lhWatermark',13))
  ].join('');
  renderDocPreview();

  el('docNumCfg').innerHTML = [
    row('Loan number prefix','', txt('docPrefix',13)),
    row('Next sequence','', num('docSeq',13,`min="1"`)),
    row('Digits in sequence','', num('docPadding',13,`min="3" max="10"`)),
    row('Separator','', pick('docSeparator',13,['-','/','.',''])),
    row('Include year','', tag(String(CFG.docYear)))
  ].join('');
  el('docNumPreview').innerHTML = `${CFG.docPrefix}${CFG.docSeparator}${CFG.docYear}${CFG.docSeparator}${String(CFG.docSeq).padStart(CFG.docPadding,'0')}<span>next number</span>`;

  el('reqDocs').innerHTML = REQ_DOCS.map(([k,n,s,on])=>{
    if(CFG[k] === undefined) CFG[k] = on;
    return `<div class="check"><span class="ck ${CFG[k]?'y':'n'}">${CFG[k]?'✓':'—'}</span>
      <div style="flex:1"><b>${n}</b><span class="s">${s}</span></div>
      <button class="toggle${CFG[k]?' on':''}" data-k="${k}" data-s="13" aria-checked="${CFG[k]?1:0}"></button></div>`;
  }).join('');

  el('esigCfg').innerHTML = [
    row('Electronic signatures','Sign in the portal', tg('esigEnabled',13)),
    row('Provider','', pick('esigProvider',13,['Internal e-signature','DocuSign','Adobe Sign'])),
    row('Require OTP to sign','', tg('esigOtp',13)),
    row('Signature audit trail','', tg('esigAudit',13)),
    row('Documents requiring signature','', pick('esigRequire',13,['Loan agreement + disbursement','Loan agreement only','All documents']))
  ].join('');
  el('esigBadge').textContent = CFG.esigEnabled ? 'Enabled' : 'Off';
  el('esigBadge').className = 'badge ' + (CFG.esigEnabled ? 'b-ok' : 'b-await');

  el('docStoreCfg').innerHTML = [
    row('Storage bucket','', txt('storeBucket',13)),
    row('Retention','', pick('storeRetain',13,['5 years','10 years','Indefinite'])),
    row('Maximum file size','', num('storeMax',13,`min="1" max="100"`) + unit('MB')),
    row('Allowed formats','', txt('storeFormats',13))
  ].join('');
}
function renderDocPreview(){
  el('lhName').textContent = CFG.lhName;
  el('lhName').style.display = CFG.lhHeader ? '' : 'none';
  el('lhTag').textContent = CFG.brandTagline ? CFG.brandTaglineText : '';
  el('lhTag').style.display = CFG.brandTagline ? '' : 'none';
  el('lhLogo').style.display = CFG.lhLogoShow ? 'grid' : 'none';
  el('lhLogo').textContent = (CFG.orgTrading||'GF').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
  el('lhFooter').textContent = CFG.lhFooterShow ? CFG.lhFooter : '';
  el('lhFooter').style.display = CFG.lhFooterShow ? '' : 'none';
  el('letterhead').style.background = CFG.lhWatermark
    ? 'repeating-linear-gradient(45deg,#FDFBF4,#FDFBF4 12px,#FFF 12px,#FFF 24px)' : '#fff';
  el('docNumPreview').innerHTML = `${CFG.docPrefix}${CFG.docSeparator}${CFG.docYear}${CFG.docSeparator}${String(CFG.docSeq).padStart(CFG.docPadding,'0')}<span>next number</span>`;
}
function docModal(d){
  openModal(d.n, d.t + ' · ' + d.v + ' · updated ' + d.up, `
    <div class="letterhead">
      <div class="lhh"><div class="logo-tile" style="width:32px;height:32px;border-radius:9px;font-size:10px;box-shadow:none">GF</div>
        <div><b>${CFG.lhName}</b><span>${CFG.lhTag}</span></div></div>
      <div class="lhb"><b style="font-size:10.5px">${d.n.toUpperCase()}</b><br />
        Borrower: Chisomo Kachale · Loan LN-2026-0481<br />
        Principal: MK 500,000.00 · Interest: 4.5% per month · Term: 12 months<br />
        Instalment: MK 48,250.00 monthly · First due: 05 Nov 2026<br /><br />
        This document forms part of the agreement between the borrower and ${CFG.orgName}.
        Signed electronically and stored in ${CFG.storeBucket}.</div>
      <div class="lhf"><span>${CFG.lhFooter}</span><span>${d.v}</span></div>
    </div>
    <div class="note" style="margin-top:11px"><div>Tokens are filled from the loan record when the document is
      generated. Editing the template affects documents created after saving.</div></div>`,
    [{label:'Close', act:'close'},
     {label:'Download PDF', cls:'btn-ghost', act:()=>{ toast('PDF export uses the browser print dialog.','info'); }},
     {label:'Edit template', cls:'btn-gold', act:()=>{
        closeModal(); toast(`Opening ${d.n} in the template editor.`,'info');
        logAudit('Config','Document template opened: '+d.n,'template.'+d.n);
     }}]);
}

/* ===================== 14 · REPORTS ===================== */
const SCHEDULED = [
  {n:'Daily collections summary', f:'Daily', to:'Credit + Collections', fmt:'PDF', st:'Active'},
  {n:'Portfolio at risk', f:'Weekly · Monday', to:'Management', fmt:'Excel', st:'Active'},
  {n:'Arrears ageing', f:'Weekly · Friday', to:'Collections', fmt:'Excel', st:'Active'},
  {n:'Monthly financial statements', f:'Monthly · 3rd', to:'Finance + Auditors', fmt:'PDF', st:'Active'},
  {n:'Regulatory return (RBM)', f:'Monthly · 10th', to:'Compliance', fmt:'PDF', st:'Active'},
  {n:'Staff performance', f:'Monthly · 1st', to:'Management', fmt:'Excel', st:'Paused'}
];
const RPT_CATS = ['Executive','Portfolio','Repayments','Arrears','Financial','Customers','Applications','Staff','Risk','Audit'];
const RPT_ROLES = ['Administrator','Credit Analyst','Loan Officer','Cashier','Collections','Auditor'];
const RPT_ACCESS = {
  Executive:[1,1,0,1,0,1], Portfolio:[1,1,1,0,1,1], Repayments:[1,1,1,1,1,1],
  Arrears:[1,1,1,0,1,1], Financial:[1,1,0,0,0,1], Customers:[1,1,1,1,1,1],
  Applications:[1,1,1,0,1,1], Staff:[1,0,0,0,0,1], Risk:[1,1,0,0,1,1], Audit:[1,0,0,0,0,1]
};
function renderSec14(){
  el('rptPeriod').innerHTML = [
    row('Default reporting period','', pick('rptPeriod',14,['Current month','Last month','Current quarter','Financial year to date','Custom range'])),
    row('Financial year start','', pick('rptFyStart',14,['January','April','July','October'])),
    row('Current period','', tag('1–31 Oct 2026')),
    row('Report reference format','Tokens: {YYYY} {SEQ}', txt('rptRefFormat',14)),
    row('Next report reference','', tag('RPT-2026-00481')),
    row('Period close','Last day of the reporting period', tag('30 Oct 2026'))
  ].join('');
  el('rptCurrency').innerHTML = [
    row('Currency','', pick('rptCurrency',14,['MWK','USD','MWK + USD'])),
    row('Decimal places','', num('rptRounding',14,`min="0" max="4"`)),
    row('Show cents','', tag('Yes')),
    row('Negative amounts','', pick('negativeFormat',14,['-1,250.00','(1,250.00)','1,250.00 CR']))
  ].join('');
  el('rptPdf').innerHTML = [
    row('Page size','', pick('pdfPage',14,['A4','Letter','A5'])),
    row('Orientation','', pick('pdfOrient',14,['Portrait','Landscape'])),
    row('Repeat header on each page','', tg('pdfHeader',14)),
    row('Footer with page numbers','', tg('pdfFooter',14)),
    row('Include logo','', tg('pdfLogo',14)),
    row('Watermark','', tg('pdfWatermark',14))
  ].join('');
  el('rptExcel').innerHTML = [
    row('CSV delimiter','', pick('xlsDelimiter',14,['Comma','Semicolon','Tab'])),
    row('Include column headers','', tg('xlsHeaders',14)),
    row('Freeze header row','', tg('xlsFreeze',14)),
    row('Add totals row','', tg('xlsTotals',14)),
    row('Number format','', tag('MK #,##0.00'))
  ].join('');
  renderScheduled();
  el('calcRules').innerHTML = [
    row('Loan in arrears after','Days past due', num('calcArrears',14,`min="1" max="180"`) + unit('days')),
    row('Count restructured loans as active','', tg('calcActive',14)),
    row('Revenue recognition','', pick('calcRevAccrual',14,['Accrual','Cash'])),
    row('Include fees in revenue','', tg('calcIncludeFees',14)),
    row('Active loan definition','', pick('activeDef',14,['Balance above zero','Not written off','Disbursed in the last 12 months']))
  ].join('');

  el('rptMatrix').innerHTML = RPT_CATS.map(c=>`<tr>
    <td>${c}</td>${RPT_ROLES.map((r,i)=>`<td><input type="checkbox" data-rcat="${c}" data-ri="${i}"
      ${RPT_ACCESS[c][i]?'checked':''} ${i===0?'disabled':''}></td>`).join('')}</tr>`).join('');
  el('rptMatrix').querySelectorAll('input[type=checkbox]').forEach(cb=>{
    cb.onchange = ()=>{
      RPT_ACCESS[cb.dataset.rcat][Number(cb.dataset.ri)] = cb.checked ? 1 : 0;
      const sec='14'; MARK[sec]=MARK[sec]||new Set(); MARK[sec].add('rpt:'+cb.dataset.rcat);
      paintState(sec); updateBand();
      toast(`${cb.dataset.rcat} reports ${cb.checked?'granted to':'removed from'} ${RPT_ROLES[Number(cb.dataset.ri)]}.`,'info');
    };
  });
}
function renderScheduled(){
  el('schedBody').innerHTML = SCHEDULED.map((s,i)=>`<tr>
    <td style="font-weight:700">${s.n}</td><td>${s.f}</td>
    <td style="font-size:10.5px">${s.to}</td><td>${s.fmt}</td>
    <td><span class="chip ${s.st==='Active'?'st-ok':'st-canc'}">${s.st}</span></td>
    <td style="text-align:right"><button class="btn btn-ghost btn-sm" data-sch="${i}"
      style="padding:2px 7px;font-size:10px">${s.st==='Active'?'Pause':'Resume'}</button></td></tr>`).join('');
  el('schedBody').querySelectorAll('[data-sch]').forEach(b=>{
    b.onclick = ()=>{
      const s = SCHEDULED[Number(b.dataset.sch)];
      s.st = s.st === 'Active' ? 'Paused' : 'Active';
      renderScheduled(); toast(`${s.n} ${s.st==='Active'?'resumed':'paused'}.`,'info');
      logAudit('Config',`Scheduled report ${s.st.toLowerCase()}: ${s.n}`,'report.schedule');
    };
  });
  el('schedCount').textContent = SCHEDULED.filter(s=>s.st==='Active').length + ' scheduled';
}
function scheduleModal(){
  openModal('Schedule a report', 'Delivered automatically by email', `
    <div class="form-grid">
      <div class="fg" style="grid-column:1/-1"><label>Report</label><select id="scRep">
        ${['Daily collections summary','Portfolio at risk','Arrears ageing','Monthly financial statements',
           'Regulatory return (RBM)','Staff performance','Executive dashboard pack']
          .map(x=>`<option>${x}</option>`).join('')}</select></div>
      <div class="fg"><label>Frequency</label><select id="scFreq">
        ${['Daily','Weekly · Monday','Weekly · Friday','Monthly · 1st','Monthly · 3rd','Monthly · 10th']
          .map(x=>`<option>${x}</option>`).join('')}</select></div>
      <div class="fg"><label>Format</label><select id="scFmt"><option>PDF</option><option>Excel</option><option>CSV</option></select></div>
      <div class="fg" style="grid-column:1/-1"><label>Recipients</label>
        <input id="scTo" value="Management" placeholder="Comma-separated names or emails"></div>
    </div>
    <div class="note" style="margin-top:11px"><div>Scheduled reports respect the access matrix below —
      a recipient without permission to a category receives the report without those sections.</div></div>`,
    [{label:'Cancel', act:'close'}, {label:'Schedule', cls:'btn-gold', act:()=>{
      SCHEDULED.unshift({n:el('scRep').value, f:el('scFreq').value, to:el('scTo').value,
        fmt:el('scFmt').value, st:'Active'});
      closeModal(); renderScheduled(); toast('Report scheduled.');
      logAudit('Config','Report scheduled: '+SCHEDULED[0].n,'report.schedule');
    }}]);
}
