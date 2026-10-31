<script>
/* ============================================================
   GOLDEN FINANCIAL SERVICES · SYSTEM SETTINGS MODULE  (1/4)
   Core framework: state, change tracking, field builders.
   ============================================================ */
const el = id => document.getElementById(id);
const nf = n => Math.round(n).toLocaleString('en-US');
const nf2 = n => Number(n).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
const mk = n => 'MK ' + nf(n);
const TODAY = '30 Oct 2026';
const initials = s => String(s).split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase();
const nowTime = () => new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});

function toast(msg, type='ok'){
  const t=document.createElement('div');
  t.className='toast '+type;
  t.innerHTML=`<span>${type==='err'?'⚠':type==='info'?'ℹ':'✓'}</span><div>${msg}</div>`;
  el('toasts').appendChild(t);
  setTimeout(()=>{t.style.opacity='0';t.style.transform='translateX(16px)';t.style.transition='.25s';},2600);
  setTimeout(()=>t.remove(),3000);
}

/* ---------- modal ---------- */
function openModal(title, sub, body, actions=[]){
  el('modalTitle').textContent = title;
  el('modalSub').textContent = sub;
  el('modalBody').innerHTML = body;
  el('modalFoot').innerHTML = '';
  actions.forEach(a=>{
    const b=document.createElement('button');
    b.className='btn '+(a.cls||'btn-ghost'); b.textContent=a.label;
    b.onclick = a.act==='close' ? closeModal : a.act;
    el('modalFoot').appendChild(b);
  });
  el('modal').classList.add('on');
}
function closeModal(){ el('modal').classList.remove('on'); }
document.addEventListener('keydown', e=>{ if(e.key==='Escape') closeModal(); });

/* ---------- configuration state ---------- */
const CFG = {
  /* 1 general */
  orgName:'Golden Financial Services Ltd', orgTrading:'Golden Financial', orgReg:'TRL-MW-2019-04812',
  orgTin:'20194812', orgLicence:'RBM/MFI/0418', orgAddress:'Golden House, 3rd Floor, Victoria Avenue',
  orgCity:'Blantyre', orgCountry:'Malawi', orgPhone:'+265 1 770 200', orgEmail:'info@goldenfinancial.mw',
  orgWeb:'www.goldenfinancial.mw', orgSupport:'support@goldenfinancial.mw',
  hqAddress:'P.O. Box 481, Blantyre, Malawi', hqAlt:'+265 999 770 200', hqContact:'Chikondi Mwale',
  brandPrimary:'#C9A227', brandAccent:'#0F1115', brandLogoDocs:true, brandTagline:true,
  brandTaglineText:'Licensed microfinance · Blantyre, Malawi', brandWatermark:false,
  region:'Central Region', language:'English', language2:'Chichewa', weekStart:'Monday',
  dateFormat:'DD MMM YYYY', timeFormat:'24-hour', timezone:'Africa/Blantyre (CAT, UTC+2)',
  currency:'MWK — Malawi Kwacha', decimals:2, thousands:',',
  fyStart:'July', fyEnd:'June', fyLockDate:'31 Jul 2026', backdated:false, closeReminder:7,
  maintMode:false, maintAdmin:true, maintCountdown:true,
  maintMsg:'The Golden Financial portal is temporarily unavailable for scheduled maintenance. Please try again shortly.',
  maintAuto:true,

  /* 2 users */
  inviteExpiry:72, pwdMin:12, requireMfaAll:true,

  /* 3 permissions */
  permNote:'Changes apply on the next login',

  /* 4 security */
  pwdUpper:true, pwdLower:true, pwdNumber:true, pwdSymbol:true, pwdExpiry:90, pwdReuse:5,
  pwdDict:true, pwdChangeFirst:true,
  failLimit:5, lockMinutes:30, autoUnlock:true, captchaAfter:3, notifyFail:true,
  sessionIdle:20, sessionWarn:2, sessionAbs:8, rememberDays:14, sessionSingle:false, logoutPwdChange:true,
  mfaEnabled:true, mfaMethod:'Authenticator app', mfaGrace:7, mfaRemember:30,
  mfaRoles:'Administrator, Credit Analyst, Cashier',
  suspicious:true, unusualLoc:true, deviceLimit:3, alertChannel:'Email + SMS', alertAdmin:true,
  geomatch:true,

  /* 5 products */
  defRate:4.5, defMethod:'Reducing balance', defFee:3, defPenalty:5, defGrace:5,
  eligAge:18, eligMaxAge:65, eligIncome:150000, eligDti:40, eligGuarantor:true, eligCollateral:false,
  eligMonths:6, eligId:true,
  prodAutoCap:2000000,

  /* 6 approvals */
  autoApproveBelow:150000, secondApproverAbove:2000000, committeeAbove:5000000,
  assignMode:'Branch workload', workloadCap:25, assignRound:true, assignNotify:true,
  escalateHours:24, escalateTo:'Credit Analyst', escalateNotify:true, escalateTwice:false,
  sodApproveDisburse:true, sodInitiateApprove:true, sodDualAbove:true, sodCashierSep:true,
  apprNotifApprove:true, apprNotifReject:true, apprNotifEscalate:true, apprNotifSms:false,
  blockArrears:true, blockFirstTime:false, requireRejectReason:true,

  /* 7 repayments */
  repFreq:'Monthly', partialAllow:true, partialMin:25, partialHold:false,
  advanceAllow:true, advanceTo:'Future instalments', advanceMax:3,
  earlyAllow:true, earlyDiscount:2, earlyNotice:7, earlyFee:0,
  penType:'% of instalment', penValue:5, penCap:20, penCompound:false, penApplyGrace:5,
  reschedMax:2, reschedFee:25000, reschedApprove:true,
  restructMax:1, restructTerm:36, restructApprove:'Credit committee',
  rounding:2, roundMode:'Half up', minUnit:1,
  refFormat:'TXN-{YYYY}-{SEQ:6}', refPrefix:'TXN', refSeq:481, refYear:2026,
  ledgerBalanced:true,

  /* 8 payments */
  cashOn:true, bankOn:true, airtelOn:true, mpambaOn:true,
  cashLimit:500000, bankFee:0, airtelFee:1.5, mpambaFee:1.5,
  airtelCode:'GF-AIRTEL-0418', mpambaCode:'GF-MPAMBA-0418', bankAcct:'1002 4458 9912',
  refRequired:true, refPrefixPay:'GF-REP', refLength:9, refProof:true, refDupWindow:24,
  chanCash:true, chanBank:true, chanAirtel:true, chanMpamba:true, chanDefault:'Bank transfer',
  confirmApprove:true, confirmReceipt:true, confirmSms:true, confirmTimeout:48,
  limitMin:1000, limitMax:5000000, limitDaily:2000000, limitMonthly:15000000,
  failRetry:3, failInterval:15, failReverse:true, failNotify:true,
  recSchedule:'Daily · 18:00', recTolerance:50, recUnmatched:'Hold for review', recAutoPost:true,

  /* 9 notifications */
  emailHost:'smtp.goldenfinancial.mw', emailPort:587, emailEncrypt:'STARTTLS',
  emailUser:'no-reply@goldenfinancial.mw', emailFrom:'Golden Financial Services',
  emailReply:'support@goldenfinancial.mw',
  smsProvider:'Airtel Malawi + TNM Mpamba', smsSender:'GOLDENFI', smsDlr:true, smsFallback:true,
  notifApply:true, notifApprove:true, notifReject:true, notifDisburse:true,
  notifReminder:true, notifOverdue:true, notifPwdReset:true, notifStaff:true,
  remDaysBefore:3, remSendTime:'08:00', remRepeat:'Every 3 days after due', remWeekend:false,
  remOverdueDays:1, remLang:'English + Chichewa', remQuiet:true,

  /* 10 portal */
  portalOn:true, portalMaintMsg:'The customer portal is being updated. Please check back shortly.',
  portalSelfReg:true, portalVerify:true, portalIdType:'National ID + Phone',
  portalLogin:'Phone number + OTP', portalOtpLen:6, portalOtpValidity:5,
  custPwdMin:8, custPwdComplex:true, custFailLimit:4, custLock:15,
  profPhone:false, profEmail:false, profAddress:true, profKin:false, profEmployment:true,
  profPhoto:true, profApproval:true, portalSelfClose:false, portalShowAcct:true, portalTimeout:20,
  portalApply:true, portalApplyMax:3000000, portalApplyDocs:true,
  portalUpload:true, portalUploadSize:5, portalUploadFormats:'PDF, JPG, PNG',
  portalDashBal:true, portalDashDue:true, portalDashProgress:true, portalDashHistory:true,
  portalStatement:true, portalStatementMonths:12, portalStatementPdf:true,
  portalNotifSms:true, portalNotifEmail:true, portalNotifPush:false,

  /* 11 data */
  dbHost:'db.goldenfinancial.supabase.co', dbRegion:'af-south-1 (Cape Town)', dbProject:'gfs-prod-mw',
  dbPool:15, dbSsl:true, dbMaskKeys:true,
  syncInterval:5, backupFreq:'Daily', backupTime:'23:00', backupRetain:30,
  backupEncrypt:true, backupOffsite:true, backupLocation:'Supabase Storage + AWS af-south-1',
  exportFormat:'CSV', exportPii:false, exportWatermark:true,
  retentionCustomers:'60 months', retentionLoans:'120 months', retentionTxns:'120 months',
  retentionLogs:'24 months',
  archiveAfter:24, archiveAuto:true, archiveStore:'Cold storage bucket',
  dupFields:'National ID, phone number', dupTolerance:90, dupAutoMerge:false,
  importMode:'Validate then import', importMax:5000, importMaxRows:5000,
  importDupFields:'Skip duplicates',

  /* 12 audit */
  auditRange:'30 days', auditRetain:'24 months', auditImmutable:true, auditReads:true,
  auditExport:true, errThreshold:10, errAlertEmail:'it@goldenfinancial.mw', apiMonitor:true,
  errStack:true, errGroup:true,

  /* 13 documents */
  lhName:'GOLDEN FINANCIAL SERVICES', lhTag:'Licensed microfinance · Blantyre, Malawi',
  lhFooter:'P.O. Box 481, Blantyre · +265 1 770 200',
  lhHeader:true, lhFooterShow:true, lhLogoShow:true, lhWatermark:false,
  docPrefix:'LN', docSeq:481, docPadding:6, docYear:2026, docSeparator:'-',
  reqIdCopy:true, reqPayslip:true, reqBankStmt:false, reqCollateral:false, reqGuarantor:true, reqPhoto:true,
  esigEnabled:true, esigProvider:'Internal e-signature', esigRequire:'Loan agreement + disbursement', esigAudit:true,
  esigOtp:true,
  storeBucket:'golden-documents', storeRetain:'10 years', storeMax:20, storeFormats:'PDF, JPG, PNG',

  /* 14 reports */
  rptPeriod:'Current month', rptRefFormat:'RPT-{YYYY}-{SEQ:5}', rptCurrency:'MWK', rptRounding:2, rptFyStart:'July',
  pdfPage:'A4', pdfOrient:'Portrait', pdfHeader:true, pdfFooter:true, pdfLogo:true, pdfWatermark:false,
  negativeFormat:'-1,250.00', activeDef:'Balance above zero',
  xlsDelimiter:'Comma', xlsHeaders:true, xlsFreeze:true, xlsTotals:true,
  calcArrears:30, calcActive:false, calcRevAccrual:'Accrual', calcIncludeFees:true,

  /* 15 integrations */
  apiBase:'https://api.goldenfinancial.mw/v2', apiVersion:'v2', apiRate:600, apiTimeout:30, apiRetry:2,
  apiScopes:'read:customers, read:loans, write:repayments',
  apiIpAllow:true, apiLogAll:true, apiSandbox:true,
  supabaseStatus:'Connected', authStatus:'Connected', emailStatus:'Connected',
  smsStatus:'Degraded', payStatus:'Connected',

  /* 16 maintenance */
  appVersion:'2.4.1', appBuild:'b20261024.3', appEnv:'Production', schemaVersion:'18',
  autoUpdate:false, updateChannel:'Stable',
  maintWindow:'Sunday 23:00–00:30', maintDuration:90, maintNotify:true, maintLead:48,
  maintAutoMode:true, maintEmail:true, maintBanner:true, maintSms:true, maintSummary:true, maintCustomer:true,
  errMon:true, errThreshold2:5, errChannel:'Email + SMS', cacheTtl:60, cdnPurge:true, cacheEnabled:true,

  /* 17 localization */
  locSymbol:'MK', locSymbolPos:'Before', locDecimals:2, locThousands:',', locDecimalSep:'.',
  locDateFormat:'DD MMM YYYY', locTimeFormat:'24-hour', locTimezone:'CAT (UTC+2)',
  locNumberFormat:'1,234,567.89', locLanguage:'English (en-MW)', locFallback:'English',
  locCountry:'Malawi', locRegion:'Southern Africa', locPostal:'P.O. Box',
  bizMon:true, bizTue:true, bizWed:true, bizThu:true, bizFri:true, bizSat:false, bizSun:false,
  bizShift:true, locReportStd:'IFRS + RBM returns', locTaxYear:'1 July – 30 June',
  locFx:'RBM mid-rate, daily', locVat:16.5,

  /* 18 compliance */
  compMaskPii:true, compAccessLog:true, compBulkApprove:true, compRoleLimit:'Credit Analyst and above',
  compSensitive:'National ID, salary, phone',
  consentRequired:true, consentVersion:'v3.2', reConsentMonths:24, marketingOptIn:false,
  consentWithdraw:true, dpaSigned:true,
  retKyc:'84 months', retTxn:'120 months', retApp:'60 months', retLog:'24 months', retConsent:'120 months',
  expMaxRecords:5000, expApprove:true, expWatermark:true, expExpiry:24, expApprovalHours:24,
  accessReviewFreq:'Quarterly',
  closureRetain:36, closureAnon:true, closurePurge:'90 days', closureBlock:true, closureNotify:true,
  regRbm:true, regFiu:true, regDue:'15th of following month', regAuto:true,
  auditImmutable2:true, auditReads2:true, auditRetain2:'120 months'
};

/* last saved snapshot per key */
const SNAP = Object.assign({}, CFG);
/* section -> set of changed keys */
const MARK = {};
const SAVED_AT = {};
let DIRTY_COUNT = 0;

function dirtyCount(){
  let n=0; Object.keys(MARK).forEach(s=>n+=MARK[s].size); return n;
}
function paintState(sec){
  const n = MARK[sec] ? MARK[sec].size : 0;
  document.querySelectorAll(`.savestate[data-state="${sec}"]`).forEach(b=>{
    b.className = 'savestate ' + (n ? 'dirty' : 'saved');
    b.textContent = n ? `${n} unsaved` : (SAVED_AT[sec] ? 'Saved ' + SAVED_AT[sec] : 'Saved');
  });
}
function updateBand(){
  el('bandDirty').textContent = dirtyCount();
  el('bandSettings').textContent = Object.keys(CFG).length;
}

/* ---------- field builders ---------- */
const row = (label, sub, ctrl, cls='') =>
  `<div class="setrow ${cls}"><div><div class="sk">${label}</div>${sub?`<div class="ss">${sub}</div>`:''}</div><div class="sv">${ctrl}</div></div>`;

const tg = (k, sec) =>
  `<button type="button" class="toggle${CFG[k]?' on':''}" role="switch" data-k="${k}" data-s="${sec}"
     aria-checked="${CFG[k]?1:0}" aria-label="${k}"></button>`;

const pick = (k, sec, opts, extra='') => {
  const list = opts.map(o => typeof o === 'string' ? {v:o,t:o} : o);
  return `<select data-k="${k}" data-s="${sec}" ${extra}>` + list.map(o =>
    `<option value="${o.v}"${String(CFG[k])===String(o.v)?' selected':''}>${o.t}</option>`).join('') + '</select>';
};

const num = (k, sec, extra='') =>
  `<input type="number" data-k="${k}" data-s="${sec}" value="${CFG[k]}" ${extra}>`;
const txt = (k, sec, extra='') =>
  `<input type="text" data-k="${k}" data-s="${sec}" value="${String(CFG[k]??'').replace(/"/g,'&quot;')}" ${extra}>`;
const tarea = (k, sec, extra='') =>
  `<textarea data-k="${k}" data-s="${sec}" ${extra}>${CFG[k]??''}</textarea>`;
const unit = t => `<span class="unit">${t}</span>`;
const tag = t => `<span class="val-tag">${t}</span>`;

/* ---------- change plumbing ---------- */
function apply(k, val, sec, silent){
  if(String(CFG[k]) === String(val)) return;
  CFG[k] = val;
  MARK[sec] = MARK[sec] || new Set();
  MARK[sec].add(k);
  paintState(sec);
  updateBand();
  refreshPreviews();
  if(!silent) refreshSection(sec, k);
}
/* a handful of settings legitimately appear in two sections — keep both in step */
const ALSO_IN = {
  orgSupport:[18], language2:[17], locPostal:[17], currency:[17],
  exportFormat:[11,18], compBulkApprove:[11,18]
};
function refreshSection(sec, k){
  (ALSO_IN[k] || []).forEach(other=>{
    if(String(other) !== String(sec) && typeof RENDER !== 'undefined' && RENDER[other]) RENDER[other]();
  });
  /* sections that derive UI from a field rather than a preview text node */
  if(String(sec)==='1') renderMaintBanner();
  if(String(sec)==='4') renderPwTest();
  if(String(sec)==='9') renderNotifCounts();
  if(String(sec)==='8') renderMethods();
  if(String(sec)==='5') renderProducts();
  if(String(sec)==='11' && k==='backupTime') renderBackupNext();
  if(String(sec)==='13') renderDocPreview();
  if(String(sec)==='16') renderSec16();
  if(String(sec)==='17') renderLocPreview();
  if(String(sec)==='10') renderPortalPreview();
}
document.addEventListener('click', e=>{
  const t = e.target.closest('.toggle[data-k]');
  if(!t) return;
  const sec = t.dataset.s, k = t.dataset.k;
  const next = !t.classList.contains('on');
  t.classList.toggle('on', next);
  t.setAttribute('aria-checked', next ? '1' : '0');
  apply(k, next, sec);
});
document.addEventListener('change', e=>{
  const f = e.target.closest('[data-k]');
  if(!f || f.classList.contains('toggle')) return;
  let v = f.value;
  if(f.type === 'number') v = v === '' ? 0 : Number(v);
  if(f.type === 'checkbox') v = f.checked;
  apply(f.dataset.k, v, f.dataset.s);
});
document.addEventListener('input', e=>{
  const f = e.target.closest('[data-k]');
  if(!f || f.type==='number' || f.tagName==='SELECT' || f.classList.contains('toggle')) return;
  apply(f.dataset.k, f.value, f.dataset.s, true);
});

/* ---------- section save / discard ---------- */
function saveSection(sec, quiet){
  const n = MARK[sec] ? MARK[sec].size : 0;
  if(!n){ if(!quiet) toast('Section '+sec+' has no pending changes.','info'); return; }
  Object.keys(CFG).forEach(k=>{ SNAP[k] = CFG[k]; });
  MARK[sec].clear();
  SAVED_AT[sec] = nowTime();
  paintState(sec);
  updateBand();
  toast(`Section ${sec} saved · ${n} setting${n>1?'s':''} applied.`);
  logAudit('Config','Updated section '+sec+' settings', 'settings.section_'+sec, 'Chikondi Mwale','Success');
}
function discardSection(sec){
  const keys = MARK[sec] ? [...MARK[sec]] : [];
  if(!keys.length){ toast('Nothing to discard in section '+sec+'.','info'); return; }
  keys.forEach(k=>{ CFG[k] = SNAP[k]; });
  MARK[sec].clear();
  paintState(sec);
  updateBand();
  if(RENDER[sec]) RENDER[sec]();
  toast(`Discarded ${keys.length} change${keys.length>1?'s':''} in section ${sec}.`,'info');
}
document.addEventListener('click', e=>{
  const s = e.target.closest('[data-save]');
  if(s){ saveSection(s.dataset.save); return; }
  const d = e.target.closest('[data-discard]');
  if(d){ discardSection(d.dataset.discard); return; }
});

/* ---------- audit log store ---------- */
const AUDIT = [];
function logAudit(cat, action, entity, actor='Chikondi Mwale', result='Success', ip='197.210.14.22'){
  AUDIT.unshift({time:nowTime(), cat, action, entity, actor, result, ip});
  if(AUDIT.length > 120) AUDIT.pop();
}

/* ===================== 1 · GENERAL ===================== */
function renderSec1(){
  el('genOrg').innerHTML = [
    row('Organisation name','Legal name printed on documents', txt('orgName',1)),
    row('Trading name','Short name used in the interface', txt('orgTrading',1)),
    row('Registration number','Company registration', txt('orgReg',1)),
    row('Taxpayer ID (TPIN)','Malawi Revenue Authority', txt('orgTin',1)),
    row('Microfinance licence','Reserve Bank of Malawi', txt('orgLicence',1))
  ].join('');

  el('genContact').innerHTML = [
    row('Head office address','', `<span style="display:block;width:100%">${tarea('hqAddress',1)}</span>`, 'tall'),
    row('Street address','City and district', txt('orgAddress',1)),
    row('City','', pick('orgCity',1,['Blantyre','Lilongwe','Mzuzu','Zomba','Mangochi','Kasungu'])),
    row('Primary phone','', txt('orgPhone',1)),
    row('Alternate phone','', txt('hqAlt',1)),
    row('Email address','', txt('orgEmail',1)),
    row('Support email','', txt('orgSupport',1)),
    row('Website','', txt('orgWeb',1)),
    row('Contact person','', txt('hqContact',1))
  ].join('');

  el('genBrand').innerHTML = [
    row('Primary brand colour','Used for buttons and accents', `<input type="color" data-k="brandPrimary" data-s="1" value="${CFG.brandPrimary}">`),
    row('Accent colour','Headers and dark surfaces', `<input type="color" data-k="brandAccent" data-s="1" value="${CFG.brandAccent}">`),
    row('Show logo on documents','Agreements, receipts and statements', tg('brandLogoDocs',1)),
    row('Show tagline','Under the logo on letterhead', tg('brandTagline',1)),
    row('Tagline text','', txt('brandTaglineText',1)),
    row('Document watermark','Faint logo behind every export', tg('brandWatermark',1))
  ].join('');

  el('genRegion').innerHTML = [
    row('Country','', pick('orgCountry',1,['Malawi','Zambia','Mozambique','Tanzania','Zimbabwe'])),
    row('Operating region','', pick('region',1,['Central Region','Southern Region','Northern Region','All regions'])),
    row('Default language','Interface language', pick('language',1,['English','Chichewa','Portuguese'])),
    row('Secondary language','Used for customer SMS', pick('language2',1,['Chichewa','English','Yao','Tumbuka','None'])),
    row('Week starts on','', pick('weekStart',1,['Monday','Sunday'])),
    row('Postal format','', pick('locPostal',1,['P.O. Box','Private Bag','City address']))
  ].join('');

  el('genFormat').innerHTML = [
    row('Date format','', pick('dateFormat',1,['DD MMM YYYY','YYYY-MM-DD','DD/MM/YYYY','MM/DD/YYYY'])),
    row('Time format','', pick('timeFormat',1,['24-hour','12-hour'])),
    row('Time zone','', pick('timezone',1,['Africa/Blantyre (CAT, UTC+2)','Africa/Lusaka (CAT, UTC+2)','UTC'])),
    row('Currency','Functional currency', pick('currency',1,['MWK — Malawi Kwacha','USD — US Dollar'])),
    row('Decimal places','', num('decimals',1,`min="0" max="4"`) ),
    row('Thousands separator','', pick('thousands',1,[',','.',' ']))
  ].join('');

  el('genFy').innerHTML = [
    row('Financial year starts','', pick('fyStart',1,['January','April','July','October'])),
    row('Financial year ends','Derived from the start month', tag(CFG.fyEnd)),
    row('Books lock date','No postings before this date', txt('fyLockDate',1)),
    row('Allow backdated postings','Requires administrator approval', tg('backdated',1)),
    row('Period close reminder','Days before month end', num('closeReminder',1,`min="1" max="30"`) + unit('days'))
  ].join('');

  el('genMaint').innerHTML = [
    row('Maintenance mode','Block customer and staff access', tg('maintMode',1)),
    row('Allow administrator access','Keep the admin account signed in', tg('maintAdmin',1)),
    row('Show countdown timer','On the maintenance holding page', tg('maintCountdown',1))
  ].join('');
  el('genMaint2').innerHTML = [
    row('Maintenance message','Shown to anyone who tries to sign in', `<span style="display:block;width:100%">${tarea('maintMsg',1)}</span>`, 'tall'),
    row('Auto-enable for scheduled windows','Section 16 · Scheduled maintenance', tg('maintAuto',1))
  ].join('');
  renderMaintBanner();
}
function renderMaintBanner(){
  const on = !!CFG.maintMode, b = el('maintBanner');
  b.className = 'mmbanner' + (on ? ' on' : '');
  b.innerHTML = on
    ? `<span class="dot bad"></span><div><b>Maintenance mode is ON</b> — customers and staff are blocked${CFG.maintAdmin?'; administrators can still sign in':''}.</div>`
    : `<span class="dot ok"></span><div>Maintenance mode is <b>off</b> — all staff and customers can access the portal normally.</div>`;
  const badge = el('maintBadge');
  badge.className = 'badge ' + (on ? 'b-rej' : 'b-ok');
  badge.textContent = on ? 'Maintenance' : 'Live';
}

/* ===================== 2 · USERS ===================== */
const BRANCHES = ['Head Office','Blantyre','Limbe','Lilongwe','Mzuzu','Zomba','Mangochi','Kasungu'];
const USERS = [
  {n:'Chikondi Mwale', u:'cmwale', e:'chikondi@goldenfinancial.mw', r:'Administrator', b:'Head Office', st:'Active', mfa:'Authenticator', last:'30 Oct 2026 · 08:42', ip:'197.210.14.22'},
  {n:'Thandiwe Kamanga', u:'tkamanga', e:'thandiwe@goldenfinancial.mw', r:'Credit Analyst', b:'Head Office', st:'Active', mfa:'Authenticator', last:'30 Oct 2026 · 08:15', ip:'197.210.14.31'},
  {n:'Yamikani Banda', u:'ybanda', e:'yamikani@goldenfinancial.mw', r:'Loan Officer', b:'Blantyre', st:'Active', mfa:'SMS', last:'30 Oct 2026 · 07:58', ip:'41.87.11.9'},
  {n:'Memory Phiri', u:'mphiri', e:'memory@goldenfinancial.mw', r:'Cashier', b:'Limbe', st:'Active', mfa:'SMS', last:'30 Oct 2026 · 07:40', ip:'41.87.11.44'},
  {n:'Blessings Tembo', u:'btembo', e:'blessings@goldenfinancial.mw', r:'Collections Officer', b:'Blantyre', st:'Active', mfa:'None', last:'29 Oct 2026 · 16:22', ip:'41.87.11.51'},
  {n:'Alinafe Nyirenda', u:'anyirenda', e:'alinafe@goldenfinancial.mw', r:'Loan Officer', b:'Lilongwe', st:'Active', mfa:'Authenticator', last:'29 Oct 2026 · 15:05', ip:'197.210.14.77'},
  {n:'Grace Mvula', u:'gmvula', e:'grace@goldenfinancial.mw', r:'Auditor', b:'Head Office', st:'Active', mfa:'Authenticator', last:'29 Oct 2026 · 11:12', ip:'197.210.14.90'},
  {n:'Peter Chirwa', u:'pchirwa', e:'peter@goldenfinancial.mw', r:'Loan Officer', b:'Mzuzu', st:'Locked', mfa:'SMS', last:'28 Oct 2026 · 09:31', ip:'41.87.22.14'},
  {n:'Esther Mwale', u:'emwale', e:'esther@goldenfinancial.mw', r:'Customer Support', b:'Blantyre', st:'Active', mfa:'Email', last:'29 Oct 2026 · 13:48', ip:'41.87.11.63'},
  {n:'Chisomo Kachale', u:'ckachale', e:'chisomo@goldenfinancial.mw', r:'Field Agent', b:'Zomba', st:'Suspended', mfa:'None', last:'24 Oct 2026 · 10:02', ip:'41.87.31.7'},
  {n:'Tadala Msonthi', u:'tmsonthi', e:'tadala@goldenfinancial.mw', r:'Loan Officer', b:'Mangochi', st:'Active', mfa:'SMS', last:'30 Oct 2026 · 08:02', ip:'41.87.44.19'},
  {n:'Fatsani Gondwe', u:'fgondwe', e:'fatsani@goldenfinancial.mw', r:'Cashier', b:'Kasungu', st:'Active', mfa:'SMS', last:'29 Oct 2026 · 17:03', ip:'41.87.55.28'},
  {n:'Rodrick Zimba', u:'rzimba', e:'rodrick@goldenfinancial.mw', r:'Credit Analyst', b:'Lilongwe', st:'Deactivated', mfa:'None', last:'02 Sep 2026 · 14:20', ip:'41.87.66.5'},
  {n:'Linda Mhango', u:'lmhango', e:'linda@goldenfinancial.mw', r:'Collections Officer', b:'Mzuzu', st:'Active', mfa:'SMS', last:'30 Oct 2026 · 07:22', ip:'41.87.22.31'},
  {n:'Joseph Kalua', u:'jkalua', e:'joseph@goldenfinancial.mw', r:'Loan Officer', b:'Zomba', st:'Pending invite', mfa:'None', last:'—', ip:'—'},
  {n:'Agnes Chikopa', u:'achikopa', e:'agnes@goldenfinancial.mw', r:'Auditor', b:'Head Office', st:'Active', mfa:'Authenticator', last:'28 Oct 2026 · 08:54', ip:'197.210.14.55'}
];
const STATUS_CHIP = {Active:'st-ok', Suspended:'st-rev', Locked:'st-fail', Deactivated:'st-canc', 'Pending invite':'st-await'};
const U = {q:'', role:'', status:'', branch:'', page:1, per:8};

function usrFiltered(){
  const q = U.q.toLowerCase();
  return USERS.filter(u =>
    (!q || (u.n+u.e+u.u).toLowerCase().includes(q)) &&
    (!U.role || u.r === U.role) &&
    (!U.status || u.st === U.status) &&
    (!U.branch || u.b === U.branch));
}
function renderUsers(){
  const rows = usrFiltered();
  const pages = Math.max(1, Math.ceil(rows.length / U.per));
  if(U.page > pages) U.page = pages;
  const slice = rows.slice((U.page-1)*U.per, U.page*U.per);
  el('usrBody').innerHTML = slice.length ? slice.map(u=>`<tr>
    <td><div style="display:flex;align-items:center;gap:8px">
      <div class="sav sm" style="width:26px;height:26px;border-radius:8px;display:grid;place-items:center;
        background:var(--gold-soft);color:var(--gold-dark);font-size:9.5px;font-weight:800">${initials(u.n)}</div>
      <div style="min-width:0"><div style="font-weight:700">${u.n}</div>
        <div style="font-size:9.5px;color:var(--muted)">${u.e}</div></div></div></td>
    <td>${u.r}</td><td>${u.b}</td>
    <td><span class="chip ${STATUS_CHIP[u.st]||'st-canc'}">${u.st}</span></td>
    <td>${u.mfa==='None'?'<span style="color:#B32C2C;font-weight:700">Off</span>':u.mfa}</td>
    <td style="font-size:10.5px;white-space:nowrap">${u.last}</td>
    <td style="text-align:right"><button class="btn btn-ghost btn-sm" data-user="${u.u}" style="padding:3px 8px;font-size:10px">Manage</button></td>
  </tr>`).join('') : `<tr><td colspan="7" class="empty">No users match these filters.</td></tr>`;

  el('usrCount').textContent = rows.length + ' users';
  el('usrPager').innerHTML = rows.length ? `
    <span>Showing ${(U.page-1)*U.per+1}–${Math.min(U.page*U.per, rows.length)} of ${rows.length}</span>
    <button id="usrPrev" ${U.page===1?'disabled':''}>‹ Prev</button>
    <button id="usrNext" ${U.page===pages?'disabled':''}>Next ›</button>` : '';
  const p = el('usrPrev'), n = el('usrNext');
  if(p) p.onclick = ()=>{ U.page--; renderUsers(); };
  if(n) n.onclick = ()=>{ U.page++; renderUsers(); };

  const active = USERS.filter(u=>u.st==='Active').length;
  const susp = USERS.filter(u=>u.st==='Suspended').length;
  const locked = USERS.filter(u=>u.st==='Locked').length;
  const inv = USERS.filter(u=>u.st==='Pending invite').length;
  el('usrStats').innerHTML = [
    ['Total system users', USERS.length, 'Across 8 branches', 'ok'],
    ['Active accounts', active, 'Signed in within 7 days', 'ok'],
    ['Suspended / locked', susp+locked, `${susp} suspended · ${locked} locked`, 'warn'],
    ['Pending invitations', inv, 'Expire after 72 hours', 'idle']
  ].map(([t,v,s,d])=>`<div class="hcard"><div class="hh"><span class="dot ${d}"></span>${t}</div>
    <div class="hv">${v}<small>users</small></div><div class="hs">${s}</div></div>`).join('');
  el('ncRuleExp').textContent = CFG.inviteExpiry;
  el('ncRuleLen').textContent = CFG.pwdMin;
}
function userModal(u){
  const st = u.st;
  const act = [
    ['Activate', st==='Active', ()=>setUser(u,'Active'), 'btn-green'],
    ['Deactivate', st==='Deactivated', ()=>setUser(u,'Deactivated'), 'btn-red'],
    ['Suspend', st==='Suspended', ()=>setUser(u,'Suspended'), 'btn-red'],
    ['Restore', st==='Active' || st==='Pending invite', ()=>setUser(u,'Active'), 'btn-green'],
    ['Unlock', st!=='Locked', ()=>setUser(u,'Active'), 'btn-ghost'],
    ['Reset password', true, ()=>resetPwd(u), 'btn-ghost'],
    ['Edit details', false, ()=>editUser(u), 'btn-ghost']
  ];
  openModal('Manage ' + u.n, `${u.r} · ${u.b} · ${u.st}`, `
    <div class="kv"><span class="k">Username</span><span class="v">${u.u}</span></div>
    <div class="kv"><span class="k">Email</span><span class="v">${u.e}</span></div>
    <div class="kv"><span class="k">Status</span><span class="v">${u.st}</span></div>
    <div class="kv"><span class="k">MFA</span><span class="v">${u.mfa}</span></div>
    <div class="kv"><span class="k">Last login</span><span class="v">${u.last}</span></div>
    <div class="kv"><span class="k">Last IP</span><span class="v">${u.ip}</span></div>
    <div class="grp" style="margin-top:12px">Account actions</div>
    <div class="optgrid" id="uActs"></div>
    <div class="grp" style="margin-top:12px">Assign staff role</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:6px">
      <select id="uRole" style="border:1px solid var(--line);border-radius:8px;padding:6px 9px;font-size:11.5px;font-family:inherit">
        ${ROLES.map(r=>`<option${r.name===u.r?' selected':''}>${r.name}</option>`).join('')}
      </select>
      <button class="btn btn-gold btn-sm" id="uRoleApply">Apply role</button>
      <button class="btn btn-ghost btn-sm" id="uMfa">${u.mfa==='None'?'Enable MFA':'Reset MFA'}</button>
    </div>`, [{label:'Close', act:'close'}]);
  el('uActs').innerHTML = act.map((a,i)=>
    `<button class="optcard ${a[1]?'is-off':''}" data-act="${i}" ${a[1]?'disabled':''}>
      <b>${a[0]}</b><span>${a[0]==='Reset password'?'Force a new temporary password':a[0]==='Unlock'?'Clear failed attempts':'Change account status'}</span>
    </button>`).join('');
  el('uActs').querySelectorAll('[data-act]').forEach(b=>{
    b.onclick = ()=>{ act[Number(b.dataset.act)][2](); closeModal(); };
  });
  el('uRoleApply').onclick = ()=>{
    u.r = el('uRole').value; closeModal(); renderRoles(); renderUsers();
    toast(`${u.n} assigned the ${u.r} role.`);
    logAudit('Permission','Role assigned: '+u.r, 'user.'+u.u);
  };
  el('uMfa').onclick = ()=>{
    u.mfa = u.mfa === 'None' ? 'Authenticator' : 'None';
    closeModal(); renderUsers();
    toast(`MFA ${u.mfa==='None'?'disabled':'enrolled'} for ${u.n}.`, u.mfa==='None'?'info':'ok');
  };
}
function editUser(u){
  openModal('Edit staff details', u.u + ' · ' + u.r, `
    <div class="form-grid">
      <div class="fg"><label>Full name</label><input id="eName" value="${u.n}"></div>
      <div class="fg"><label>Email address</label><input id="eEmail" value="${u.e}"></div>
      <div class="fg"><label>Username</label><input id="eUser" value="${u.u}"></div>
      <div class="fg"><label>Branch</label><select id="eBranch">
        ${BRANCHES.map(b=>`<option${b===u.b?' selected':''}>${b}</option>`).join('')}</select></div>
      <div class="fg"><label>Staff role</label><select id="eRole">
        ${ROLES.map(r=>`<option${r.name===u.r?' selected':''}>${r.name}</option>`).join('')}</select></div>
      <div class="fg"><label>MFA method</label><select id="eMfa">
        ${['Authenticator','SMS','Email','None'].map(m=>`<option${m===u.mfa?' selected':''}>${m}</option>`).join('')}</select></div>
    </div>
    <div class="note" style="margin-top:11px"><div>Changing the role updates the user's permissions on the
      next sign-in. The username is used in the audit trail and should not be reused.</div></div>`,
    [{label:'Cancel', act:'close'}, {label:'Save details', cls:'btn-gold', act:()=>{
      u.n = el('eName').value.trim() || u.n;
      u.e = el('eEmail').value.trim() || u.e;
      u.u = el('eUser').value.trim() || u.u;
      u.b = el('eBranch').value; u.r = el('eRole').value; u.mfa = el('eMfa').value;
      closeModal(); renderUsers(); renderRoles();
      toast(`${u.n} updated.`);
      logAudit('Admin','Staff details updated','user.'+u.u);
    }}]);
}
function setUser(u, st){
  u.st = st; renderUsers();
  toast(`${u.n} · ${st}.`);
  logAudit('Admin', 'Account status set to '+st, 'user.'+u.u);
}
function resetPwd(u){
  const tmp = 'Gf!' + Math.random().toString(36).slice(2,8).toUpperCase() + '#7';
  openModal('Password reset', `${u.n} · ${u.e}`, `
    <div class="note gold"><div>A temporary password has been generated. It must be changed at first sign-in
      and the account is flagged until then.</div></div>
    <div class="refbox" style="margin-top:10px">${tmp}<span>temporary</span></div>
    <div class="kv"><span class="k">Expires</span><span class="v">in ${CFG.inviteExpiry} hours</span></div>
    <div class="kv"><span class="k">Sessions revoked</span><span class="v">Yes</span></div>
    <div class="kv"><span class="k">MFA</span><span class="v">Unchanged</span></div>`,
    [{label:'Close', act:'close'}]);
  logAudit('Admin','Password reset issued','user.'+u.u);
}
function createAccount(){
  const name = el('ncName').value.trim(), email = el('ncEmail').value.trim();
  if(!name || !email){ toast('Full name and email address are required.','err'); return; }
  const u = {n:name, u:email.split('@')[0].toLowerCase(), e:email,
    r:el('ncRole').value, b:el('ncBranch').value, st:'Pending invite', mfa:'None', last:'—', ip:'—'};
  USERS.unshift(u);
  renderUsers(); renderRoles();
  el('ncName').value=''; el('ncEmail').value=''; el('ncPhone').value=''; genTempPwd();
  toast(`Invitation sent to ${email} · expires in ${CFG.inviteExpiry}h.`);
  logAudit('Admin','Staff account created','user.'+u.u);
}
function genTempPwd(){
  el('ncPass').value = 'Gf-' + Math.random().toString(36).slice(2,8).toUpperCase() + '-' + Math.floor(10+Math.random()*89);
}

/* ===================== 3 · ROLES & PERMISSIONS ===================== */
const PERM_GROUPS = [
  ['Dashboard access', 'View operational tiles and KPIs'],
  ['Customer data', 'View and edit customer records'],
  ['Loan applications', 'Create and edit applications'],
  ['Loan approvals', 'Approve or reject within authority'],
  ['Disbursements', 'Release funds to customers'],
  ['Repayments', 'Post and reverse repayments'],
  ['Reports access', 'Open and export reports'],
  ['System settings', 'Change configuration']
];
const ROLES = [
  {name:'Administrator', desc:'Full access to every module and setting', members:2, sys:true, color:'#FBF3D8', ink:'#8A6D0F', level:'Unlimited'},
  {name:'Credit Analyst', desc:'Assesses applications, approves within limit', members:3, sys:true, color:'#EAF1FE', ink:'#2456C4', level:'Up to MK 5,000,000'},
  {name:'Loan Officer', desc:'Originates applications and manages customers', members:6, sys:true, color:'#E8F6EF', ink:'#157A50', level:'None'},
  {name:'Cashier', desc:'Receives repayments and processes disbursement', members:3, sys:true, color:'#F1EDFE', ink:'#5A3FCB', level:'None'},
  {name:'Collections Officer', desc:'Follows up arrears and restructures loans', members:2, sys:true, color:'#FDEDED', ink:'#B32C2C', level:'Up to MK 500,000'},
  {name:'Auditor', desc:'Read-only access with full audit visibility', members:2, sys:true, color:'#F1F2F6', ink:'#5A6172', level:'None'},
  {name:'Customer Support', desc:'Customer records and notifications only', members:1, sys:true, color:'#F1F2F6', ink:'#5A6172', level:'None'},
  {name:'Field Agent', desc:'Mobile intake, limited visibility', members:1, sys:false, color:'#FFF4E0', ink:'#9A6A0D', level:'None'}
];
const ROLE_PERMS = {
  'Administrator':       [1,1,1,1,1,1,1,1],
  'Credit Analyst':      [1,1,1,1,0,0,1,0],
  'Loan Officer':        [1,1,1,0,0,0,1,0],
  'Cashier':             [1,1,0,0,1,1,1,0],
  'Collections Officer': [1,1,1,0,0,1,1,0],
  'Auditor':             [1,1,0,0,0,0,1,0],
  'Customer Support':    [1,1,0,0,0,0,0,0],
  'Field Agent':         [1,1,1,0,0,0,0,0]
};
const RS = {role:'Administrator'};

/* pristine copy so "reset to default" still works after edits */
const ROLE_DEFAULTS = Object.fromEntries(Object.entries(ROLE_PERMS).map(([k,v])=>[k, v.slice()]));

function roleDefaults(name){
  return (ROLE_DEFAULTS[name] || ROLE_PERMS[name] || [1,0,0,0,0,0,0,0]).slice();
}
function renderRoles(){
  el('roleCards').innerHTML = ROLES.map(r=>{
    const perms = ROLE_PERMS[r.name].reduce((a,b)=>a+b,0);
    return `<div class="rcard${RS.role===r.name?' on':''}" data-role="${r.name}">
      <div class="rh">
        <div class="ric" style="background:${r.color};color:${r.ink}">${initials(r.name)}</div>
        <div class="rn">${r.name}</div>
        ${r.sys?'<span class="rlock">SYSTEM</span>':''}
      </div>
      <div class="rd">${r.desc}</div>
      <div class="rrow"><span>Members</span><b>${USERS.filter(u=>u.r===r.name).length || r.members}</b></div>
      <div class="rrow"><span>Permissions</span><b>${perms} / ${PERM_GROUPS.length}</b></div>
    </div>`;
  }).join('');
  el('roleCards').querySelectorAll('[data-role]').forEach(c=>{
    c.onclick = ()=>{ RS.role = c.dataset.role; renderRoles(); renderMatrix(); };
  });
  renderMatrix();
  renderRoleDetail();
  const sel = el('crBase');
  if(sel) sel.innerHTML = ROLES.map(r=>`<option>${r.name}</option>`).join('');
}
function renderMatrix(){
  const role = RS.role;
  const locked = role === 'Administrator';
  el('mxHead').innerHTML = `<tr><th style="text-align:left">Permission group</th>` +
    ROLES.map(r=>`<th><div class="mxrole"><b>${r.name.split(' ')[0]}</b></div></th>`).join('') + '</tr>';
  el('mxBody').innerHTML = PERM_GROUPS.map((g,gi)=>`<tr${locked?' class="locked"':''}>
    <td>${g[0]}<span class="mxtag">${g[1]}</span></td>
    ${ROLES.map(r=>`<td><input type="checkbox" data-r="${r.name}" data-g="${gi}"
      ${ROLE_PERMS[r.name][gi]?'checked':''} ${(locked||r.name==='Administrator')?'disabled':''}></td>`).join('')}
  </tr>`).join('');
  el('mxBody').querySelectorAll('input[type=checkbox]').forEach(cb=>{
    cb.onchange = ()=>{
      ROLE_PERMS[cb.dataset.r][Number(cb.dataset.g)] = cb.checked ? 1 : 0;
      const sec = '3'; MARK[sec] = MARK[sec] || new Set(); MARK[sec].add('perm:'+cb.dataset.r);
      paintState(sec); updateBand(); refreshPermCount(); renderRoleDetail();
      toast(`${cb.dataset.r} · ${PERM_GROUPS[Number(cb.dataset.g)][0]} ${cb.checked?'granted':'revoked'}.`,'info');
      logAudit('Permission', `${cb.checked?'Granted':'Revoked'} ${PERM_GROUPS[Number(cb.dataset.g)][0]} on ${cb.dataset.r}`, 'role.'+cb.dataset.r);
    };
  });
  refreshPermCount();
}
function refreshPermCount(){
  const role = RS.role;
  const n = ROLE_PERMS[role].reduce((a,b)=>a+b,0);
  el('permCount').textContent = `${n} of ${PERM_GROUPS.length}`;
  el('permSub').textContent = `${role} · ${n === PERM_GROUPS.length ? 'full access' : n === 0 ? 'no access' : n + ' permission groups'}`;
}
function renderRoleDetail(){
  const r = ROLES.find(x=>x.name===RS.role) || ROLES[0];
  const users = USERS.filter(u=>u.r===r.name);
  const perms = ROLE_PERMS[r.name].map((v,i)=>v?PERM_GROUPS[i][0]:null).filter(Boolean);
  el('roleDetail').innerHTML = `
    <div class="kv"><span class="k">Role</span><span class="v">${r.name}</span></div>
    <div class="kv"><span class="k">Type</span><span class="v">${r.sys?'System role':'Custom role'}</span></div>
    <div class="kv"><span class="k">Approval authority</span><span class="v">${r.level}</span></div>
    <div class="kv"><span class="k">Assigned users</span><span class="v">${users.length}</span></div>
    <div class="kv"><span class="k">Permissions</span><span class="v">${perms.length} of ${PERM_GROUPS.length}</span></div>
    <div style="margin-top:9px">${perms.length ? perms.map(p=>`<span class="mini-tag g">${p}</span>`).join(' ') :
      '<span class="mini-tag r">No permissions granted</span>'}</div>
    <div class="tagline">${users.slice(0,6).map(u=>`<span class="mini-tag">${u.n}</span>`).join('')}</div>
    <div class="note ${r.sys?'':'gold'}" style="margin-top:10px">
      <div>${r.sys ? 'System roles are protected — permissions can be edited but the role cannot be deleted.'
        : 'Custom role — can be deleted once every assigned user has been moved to another role.'}</div>
    </div>`;
  el('roleDelete').disabled = r.sys || users.length > 0;
  el('roleDelete').title = r.sys ? 'System roles cannot be deleted' : users.length ? 'Reassign users first' : 'Delete this role';
}
function createRole(){
  const name = el('crName').value.trim();
  if(!name){ toast('A role name is required.','err'); return; }
  if(ROLES.some(r=>r.name.toLowerCase()===name.toLowerCase())){ toast('That role already exists.','err'); return; }
  const base = el('crBase').value;
  const r = {name, desc:el('crDesc').value.trim() || 'Custom role', members:0, sys:false,
    color:'#FFF4E0', ink:'#9A6A0D', level:el('crAuth').value};
  ROLES.push(r);
  ROLE_PERMS[name] = roleDefaults(base);
  el('crName').value=''; el('crDesc').value='';
  RS.role = name;
  renderRoles(); renderUsers();
  toast(`Role “${name}” created from ${base}.`);
  logAudit('Permission','Custom role created: '+name,'role.'+name);
}
