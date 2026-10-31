/* ============================================================
   SETTINGS MODULE  (4/4) · Integrations, maintenance,
   localization, compliance · previews · search · boot
   ============================================================ */

/* ===================== 15 · INTEGRATIONS ===================== */
const INTEGRATIONS = [
  {n:'Supabase', d:'Postgres · af-south-1', k:'supabaseStatus', ic:'SB', lat:'24 ms', up:'99.99%'},
  {n:'Auth service', d:'OTP + password', k:'authStatus', ic:'AU', lat:'38 ms', up:'99.97%'},
  {n:'Email (SMTP)', d:'smtp.goldenfinancial.mw', k:'emailStatus', ic:'EM', lat:'112 ms', up:'99.82%'},
  {n:'SMS gateway', d:'Airtel + TNM', k:'smsStatus', ic:'SM', lat:'640 ms', up:'97.40%'},
  {n:'Payment gateway', d:'Mobile money + bank', k:'payStatus', ic:'PG', lat:'208 ms', up:'99.91%'}
];
const KEYS = [
  {n:'Website forms', p:'gfs_live_4f2a', s:'write:applications', c:'12 Aug 2026', u:'30 Oct 2026 · 14:02', st:'Active'},
  {n:'Collections automation', p:'gfs_live_9c71', s:'read:loans, write:repayments', c:'02 Sep 2026', u:'30 Oct 2026 · 13:44', st:'Active'},
  {n:'Accounting sync', p:'gfs_live_2b08', s:'read:transactions', c:'18 Jul 2026', u:'29 Oct 2026 · 23:00', st:'Active'},
  {n:'Legacy importer', p:'gfs_test_77de', s:'read:customers', c:'04 Mar 2026', u:'12 Jun 2026 · 09:12', st:'Revoked'}
];
const HOOKS = [
  {u:'https://hooks.goldenfinancial.mw/loans', e:'loan.approved, loan.disbursed', st:'Active'},
  {u:'https://hooks.goldenfinancial.mw/repayments', e:'repayment.posted', st:'Active'},
  {u:'https://ops.n8n.local/gfs-alerts', e:'error.*, integration.down', st:'Paused'}
];
const INT_ERRORS = [
  ['14:22','SMS gateway','POST /messages','Timeout after 30s','2'],
  ['13:58','Payment gateway','POST /collections','502 Bad Gateway','1'],
  ['12:40','SMS gateway','POST /messages','Invalid sender ID','0'],
  ['11:06','Supabase','GET /rest/v1/loans','Connection pool exhausted','3'],
  ['09:32','Email','POST /smtp','Rate limit exceeded','1'],
  ['08:14','Auth','POST /otp/verify','Invalid OTP (x4)','0'],
  ['06:50','SMS gateway','POST /messages','Insufficient credit','1']
];
function renderSec15(){
  el('integrations').innerHTML = INTEGRATIONS.map(i=>{
    const st = CFG[i.k];
    const dot = st==='Connected' ? 'ok' : st==='Degraded' ? 'warn' : 'bad';
    return `<div class="icard">
      <div class="ih"><div class="iic">${i.ic}</div>
        <div><div class="in">${i.n}</div><div class="id">${i.d}</div></div></div>
      <div class="ist"><span class="dot ${dot}"></span>${st} · ${i.lat}</div>
      <div class="spark">${Array.from({length:24},(_,x)=>{
        const bad = st!=='Connected' && x>18 && x%4===0;
        return `<i class="${bad?'w':''}" style="height:${60+((x*37)%40)}%"></i>`;
      }).join('')}</div>
      <div style="display:flex;justify-content:space-between;margin-top:6px;font-size:9.5px;color:var(--muted)">
        <span>24h uptime</span><b style="font-variant-numeric:tabular-nums">${i.up}</b></div>
    </div>`;
  }).join('');
  el('bandHealth').textContent = INTEGRATIONS.filter(i=>CFG[i.k]==='Connected').length + '/5';

  el('apiCfg').innerHTML = [
    row('API base URL','', txt('apiBase',15)),
    row('API version','', pick('apiVersion',15,['v1','v2'])),
    row('Rate limit','Requests per minute per key', num('apiRate',15,`step="10"`)),
    row('Request timeout','', num('apiTimeout',15,`min="1" max="120"`) + unit('sec')),
    row('Retry attempts','', num('apiRetry',15,`min="0" max="5"`)),
    row('Restrict by IP allowlist','', tg('apiIpAllow',15)),
    row('Log every API request','', tg('apiLogAll',15)),
    row('Sandbox environment','Separate test keys', tg('apiSandbox',15))
  ].join('');

  const SCOPES = ['read:customers','write:customers','read:loans','write:loans','read:repayments',
    'write:repayments','read:reports','admin:settings'];
  const active = (CFG.apiScopes||'').split(',').map(s=>s.trim());
  el('apiScopes').innerHTML = SCOPES.map(s=>`<div class="check">
    <span class="ck ${active.includes(s)?'y':'n'}">${active.includes(s)?'✓':'—'}</span>
    <div style="flex:1"><b>${s}</b><span class="s">${s.startsWith('read')?'Read-only access':'Write access — audit logged'}</span></div>
    <button class="toggle${active.includes(s)?' on':''}" data-scope="${s}" aria-checked="${active.includes(s)?1:0}"></button>
  </div>`).join('');
  el('apiScopes').querySelectorAll('[data-scope]').forEach(b=>{
    b.onclick = ()=>{
      const scope = b.dataset.scope;
      const cur = (CFG.apiScopes||'').split(',').map(s=>s.trim()).filter(Boolean);
      const next = cur.includes(scope) ? cur.filter(x=>x!==scope) : [...cur, scope];
      CFG.apiScopes = next.join(', ');
      const sec='15'; MARK[sec]=MARK[sec]||new Set(); MARK[sec].add('apiScopes');
      paintState(sec); updateBand(); renderSec15();
      toast(`API scope ${next.includes(scope)?'granted':'revoked'}: ${scope}`,'info');
    };
  });

  el('keyBody').innerHTML = KEYS.map((k,i)=>`<tr>
    <td style="font-weight:700">${k.n}</td>
    <td style="font-family:ui-monospace,monospace;font-size:10px">${k.p}••••</td>
    <td style="font-size:10px">${k.s}</td>
    <td style="font-size:10px;white-space:nowrap">${k.c}</td>
    <td style="font-size:10px;white-space:nowrap">${k.u}</td>
    <td><span class="chip ${k.st==='Active'?'st-ok':'st-canc'}">${k.st}</span></td>
    <td style="text-align:right">${k.st==='Active'
      ? `<button class="btn btn-red btn-sm" data-key="${i}" style="padding:2px 7px;font-size:10px">Revoke</button>`
      : ''}</td></tr>`).join('');
  el('keyBody').querySelectorAll('[data-key]').forEach(b=>{
    b.onclick = ()=>{
      const k = KEYS[Number(b.dataset.key)];
      k.st = 'Revoked'; renderSec15();
      toast(`API key “${k.n}” revoked.`, 'info');
      logAudit('Permission','API key revoked: '+k.n,'apikey.'+k.p);
    };
  });
  el('keyCount').textContent = KEYS.filter(k=>k.st==='Active').length + ' keys';

  el('hookList').innerHTML = HOOKS.map((h,i)=>`<div class="lrow">
    <div class="lic" style="background:#EAF1FE;color:#2456C4">WH</div>
    <div style="min-width:0"><div class="lt" style="word-break:break-all;font-family:ui-monospace,monospace;font-size:10px">${h.u}</div>
      <div class="ls">${h.e}</div></div>
    <div class="lr"><span class="chip ${h.st==='Active'?'st-ok':'st-await'}">${h.st}</span>
      <button class="btn btn-ghost btn-sm" data-hook="${i}">${h.st==='Active'?'Pause':'Resume'}</button></div>
  </div>`).join('');
  el('hookList').querySelectorAll('[data-hook]').forEach(b=>{
    b.onclick = ()=>{
      const h = HOOKS[Number(b.dataset.hook)];
      h.st = h.st==='Active' ? 'Paused' : 'Active';
      renderSec15(); toast(`Webhook ${h.st.toLowerCase()}.`,'info');
    };
  });

  const f = el('intErrFilter').value;
  const errs = INT_ERRORS.filter(e=>!f || e[1]===f);
  el('intErrBody').innerHTML = errs.map(e=>`<tr>
    <td style="font-variant-numeric:tabular-nums">${e[0]}</td><td>${e[1]}</td>
    <td style="font-size:10px;font-family:ui-monospace,monospace">${e[2]}</td>
    <td style="font-size:10.5px">${e[3]}</td><td class="num">${e[4]}</td></tr>`).join('')
    || '<tr><td colspan="5" class="empty">No errors for this service.</td></tr>';

  el('healthList').innerHTML = INTEGRATIONS.map(i=>`
    <div class="setrow"><div><div class="sk">${i.n}</div><div class="ss">${i.d} · ${i.lat}</div></div>
      <div class="sv"><span class="val-tag">${i.up}</span>
        <span class="chip ${CFG[i.k]==='Connected'?'st-ok':'st-await'}">${CFG[i.k]}</span></div></div>`).join('');
}

/* ===================== 16 · MAINTENANCE ===================== */
const UPDATES = [
  ['v2.5.0','30 Oct 2026','Settings console, faster reports, Supabase client upgrade','Available'],
  ['v2.4.1','24 Oct 2026','Repayment allocation fix, receipt numbering','Current'],
  ['v2.4.0','12 Oct 2026','Customer portal launch, e-signature support','Installed'],
  ['v2.3.2','28 Sep 2026','SMS retry handling, audit log retention','Installed'],
  ['v2.3.0','02 Sep 2026','Loan restructuring, collections board','Installed']
];
const MAINT_HIST = [
  ['28 Oct 2026','Security patching','35 min','No downtime','Completed'],
  ['14 Oct 2026','Supabase upgrade','90 min','Portal read-only','Completed'],
  ['30 Sep 2026','Month-end close','120 min','Portal closed','Completed'],
  ['16 Sep 2026','Migration to af-south-1','4 h','Full outage','Completed'],
  ['02 Sep 2026','v2.3.0 release','45 min','Brief restart','Completed']
];
function renderSec16(){
  el('versionCfg').innerHTML = [
    row('Application version','', tag(CFG.appVersion)),
    row('Build','', tag(CFG.appBuild)),
    row('Environment','', pick('appEnv',16,['Production','Staging','Sandbox'])),
    row('Database schema','', tag('v' + CFG.schemaVersion)),
    row('Update channel','', pick('updateChannel',16,['Stable','Early access','Pinned'])),
    row('Automatic updates','Apply security releases automatically', tg('autoUpdate',16)),
    row('Released','24 Oct 2026 · 06:00 CAT', tag('8 days ago'))
  ].join('');
  el('envBadge').textContent = CFG.appEnv;
  el('envBadge').className = 'badge ' + (CFG.appEnv==='Production' ? 'b-ok' : 'b-await');

  el('sysHealth').innerHTML = [
    ['Server status','Operational','3 instances · af-south-1','ok','0 restarts'],
    ['Database health','Healthy','Pool 12/15 · 24 ms','ok','0 locks'],
    ['API latency','182 ms','p95 640 ms','warn','24h avg'],
    ['Storage','18.4 GB','of 100 GB','ok','18% used'],
    ['Queue depth','42 jobs','0 failed','ok','lag 0.4 s'],
    ['Memory','61%','of 8 GB','warn','peak 74%']
  ].map(([t,v,s,d,x])=>`<div class="hcard"><div class="hh"><span class="dot ${d}"></span>${t}</div>
    <div class="hv">${v}</div><div class="hs">${s}</div>
    <div class="hbar ${d==='warn'?'':'green'}"><i style="width:${d==='warn'?'61':'92'}%"></i></div></div>`).join('');

  el('errMonCfg').innerHTML = [
    row('Error monitoring','Capture and group exceptions', tg('errMon',16)),
    row('Alert after','Errors in a 1-hour window', num('errThreshold2',16,`min="1" max="50"`)),
    row('Alert channel','', pick('errChannel',16,['Email','SMS','Email + SMS'])),
    row('Last error','30 Oct 2026 · 06:58 · SMS gateway', tag('1 open'))
  ].join('');

  el('schedMaintCfg').innerHTML = [
    row('Preferred window','', pick('maintWindow',16,['Sunday 23:00–00:30','Saturday 22:00–00:00','First Sunday monthly','Ad hoc only'])),
    row('Window duration','', num('maintDuration',16,`min="15" max="480"`) + unit('min')),
    row('Notify recipients','', pick('maintNotify',16,['All staff','Administrators only','Staff + customers'])),
    row('Advance notice','', num('maintLead',16,`min="0" max="168"`) + unit('hours')),
    row('Enable maintenance mode automatically','', tg('maintAutoMode',16))
  ].join('');
  el('nextMaint').textContent = '02 Nov 2026 · ' + CFG.maintWindow.slice(6,11).replace('–',' · ');
  el('nextMaintSub').textContent = `${CFG.maintDuration} minutes · maintenance mode ${CFG.maintAutoMode?'auto-enabled':'manual'}`;

  el('maintNotifCfg').innerHTML = [
    row('Email notice','48 hours before', tg('maintEmail',16)),
    row('In-app banner','24 hours before', tg('maintBanner',16)),
    row('SMS to administrators','1 hour before', tg('maintSms',16)),
    row('Post-maintenance summary','Send when the window closes', tg('maintSummary',16)),
    row('Notify customers','Use the portal maintenance message', tg('maintCustomer',16))
  ].join('');

  el('cacheCfg').innerHTML = [
    row('Application cache','Enabled', tg('cacheEnabled',16)),
    row('Cache time to live','', num('cacheTtl',16,`min="1" max="1440"`) + unit('min')),
    row('Purge CDN assets','Cloudflare', tg('cdnPurge',16)),
    row('Cache hit rate','96.4%', tag('healthy'))
  ].join('');

  el('updateList').innerHTML = UPDATES.map(([v,date,desc,st])=>{
    const chip = st==='Available' ? 'a' : st==='Current' ? 'g' : '';
    return `<div class="tl-item"><b>${v} · ${desc}</b>
      <span>${date} · <span class="mini-tag ${chip}">${st}</span></span></div>`;
  }).join('');

  el('maintBody').innerHTML = MAINT_HIST.map(m=>`<tr>
    <td style="white-space:nowrap">${m[0]}</td><td>${m[1]}</td><td>${m[2]}</td>
    <td>${m[3]}</td><td><span class="chip st-ok">${m[4]}</span></td></tr>`).join('');
}

/* ===================== 17 · LOCALIZATION ===================== */
const HOLIDAYS = [
  ['01 Jan 2026','New Year’s Day','Public holiday',true,'Active'],
  ['15 Jan 2026','John Chilembwe Day','Public holiday',true,'Active'],
  ['03 Mar 2026','Martyrs Day','Public holiday',true,'Active'],
  ['03 Apr 2026','Good Friday','Public holiday',true,'Active'],
  ['06 Apr 2026','Easter Monday','Public holiday',true,'Active'],
  ['01 May 2026','Labour Day','Public holiday',true,'Active'],
  ['14 Jun 2026','Freedom Day','Public holiday',true,'Active'],
  ['06 Jul 2026','Independence Day','Public holiday',true,'Active'],
  ['15 Oct 2026','Mother’s Day','Public holiday',true,'Active'],
  ['25 Dec 2026','Christmas Day','Public holiday',true,'Active'],
  ['26 Dec 2026','Boxing Day','Public holiday',true,'Active'],
  ['31 Dec 2026','Year-end close','Company holiday',false,'Active']
];
function renderSec17(){
  el('locCurrency').innerHTML = [
    row('Currency code','', pick('currency',17,['MWK — Malawi Kwacha','USD — US Dollar'])),
    row('Currency symbol','', txt('locSymbol',17)),
    row('Symbol position','', pick('locSymbolPos',17,['Before','After'])),
    row('Decimal places','', num('locDecimals',17,`min="0" max="4"`)),
    row('Thousands separator','', pick('locThousands',17,[',','.',' '])),
    row('Decimal separator','', pick('locDecimalSep',17,['.','.']))
  ].join('');
  el('locDateTime').innerHTML = [
    row('Date format','', pick('locDateFormat',17,['DD MMM YYYY','YYYY-MM-DD','DD/MM/YYYY','MM/DD/YYYY'])),
    row('Time format','', pick('locTimeFormat',17,['24-hour','12-hour'])),
    row('Time zone','', pick('locTimezone',17,['CAT (UTC+2)','UTC','EAT (UTC+3)'])),
    row('Show time zone label','On timestamps', tag('Yes'))
  ].join('');
  el('locNumber').innerHTML = [
    row('Number format','', pick('locNumberFormat',17,['1,234,567.89','1.234.567,89','1 234 567,89'])),
    row('Interface language','', pick('locLanguage',17,['English (en-MW)','Chichewa (ny-MW)'])),
    row('Fallback language','', pick('locFallback',17,['English','Chichewa'])),
    row('Secondary language','SMS and notifications', pick('language2',17,['Chichewa','English','Yao','Tumbuka','None']))
  ].join('');
  el('locCountry').innerHTML = [
    row('Country','', pick('locCountry',17,['Malawi','Zambia','Mozambique','Tanzania'])),
    row('Region','', pick('locRegion',17,['Southern Africa','East Africa','Central Africa'])),
    row('Postal format','', pick('locPostal',17,['P.O. Box','Private Bag','City address'])),
    row('Phone country code','', tag('+265')),
    row('National ID format','', tag('XX XXXXXX XXXXXX'))
  ].join('');

  const days = [['bizMon','Mon'],['bizTue','Tue'],['bizWed','Wed'],['bizThu','Thu'],['bizFri','Fri'],['bizSat','Sat'],['bizSun','Sun']];
  el('bizDays').innerHTML = days.map(([k,d])=>{
    const on = CFG[k];
    return `<button class="snav${on?' on':''}" data-day="${k}" style="border-radius:8px">${d}</button>`;
  }).join('');
  el('bizDays').querySelectorAll('[data-day]').forEach(b=>{
    b.onclick = ()=>{ apply(b.dataset.day, !CFG[b.dataset.day], 17, true); renderSec17(); };
  });
  el('bizRuleLabel').textContent = CFG.bizShift ? 'enabled' : 'disabled';
  el('locRegional').innerHTML = [
    row('Reporting standard','', pick('locReportStd',17,['IFRS + RBM returns','IFRS only','RBM returns only'])),
    row('Tax year','', pick('locTaxYear',17,['1 July – 30 June','1 January – 31 December'])),
    row('Exchange rate source','', pick('locFx',17,['RBM mid-rate, daily','Commercial bank rate','Manual'])),
    row('VAT rate','', num('locVat',17,`step="0.5"`) + unit('%')),
    row('Statutory deductions','PAYE, pension, levy', tag('Configured'))
  ].join('');

  el('holidayBody').innerHTML = HOLIDAYS.map((h,i)=>`<tr>
    <td style="white-space:nowrap">${h[0]}</td><td style="font-weight:600">${h[1]}</td>
    <td>${h[2]}</td><td>${h[3]?'Yes':'No'}</td>
    <td><span class="chip ${h[4]==='Active'?'st-ok':'st-canc'}">${h[4]}</span></td>
    <td style="text-align:right"><button class="btn btn-ghost btn-sm" data-hol="${i}"
      style="padding:2px 7px;font-size:10px">Remove</button></td></tr>`).join('');
  el('holidayBody').querySelectorAll('[data-hol]').forEach(b=>{
    b.onclick = ()=>{
      const h = HOLIDAYS.splice(Number(b.dataset.hol),1)[0];
      renderSec17(); toast(`${h[1]} removed from the calendar.`,'info');
      logAudit('Config','Public holiday removed: '+h[1],'holiday');
    };
  });
  renderLocPreview();
}
function renderLocPreview(){
  const money = 1250000;
  const sep = CFG.locThousands || ',';
  const dec = Number(CFG.locDecimals);
  const num = money.toLocaleString('en-US',{minimumFractionDigits:dec,maximumFractionDigits:dec});
  const formatted = sep === ',' ? num : num.replace(/,/g,'\u0000').replace(/\./g,CFG.locDecimalSep||'.').replace(/\u0000/g,sep);
  const withSym = CFG.locSymbolPos === 'Before' ? CFG.locSymbol + ' ' + formatted : formatted + ' ' + CFG.locSymbol;
  if(el('locMoney')) el('locMoney').textContent = withSym;
  if(el('locMoneySub')) el('locMoneySub').textContent =
    `Symbol ${CFG.locSymbolPos.toLowerCase()} · ${sep===' '?'space':sep==='.'?'dot':'comma'} thousands · ${dec} decimals`;
  if(el('locNum')) el('locNum').textContent = formatted;

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const map = {
    'DD MMM YYYY':`30 Oct 2026`,
    'YYYY-MM-DD':`2026-10-30`,
    'DD/MM/YYYY':`30/10/2026`,
    'MM/DD/YYYY':`10/30/2026`
  };
  if(el('locDate')) el('locDate').textContent = map[CFG.locDateFormat] || '30 Oct 2026';
  if(el('locLongDate')) el('locLongDate').textContent = 'Friday, 30 October 2026';
  if(el('locTime')) el('locTime').textContent = CFG.locTimeFormat === '24-hour' ? '14:32 CAT' : '2:32 PM CAT';
  if(el('fmtMoney')) el('fmtMoney').textContent = mk2(1250000);
  if(el('fmtDate')) el('fmtDate').textContent = map[CFG.dateFormat] || '30 Oct 2026';
  if(el('fmtClock')) el('fmtClock').textContent = (CFG.timeFormat === '24-hour' ? '14:32' : '2:32 PM') + ' · CAT (UTC+2)';
}
function mk2(n){
  const sep = CFG.thousands || ',';
  const s = Number(n).toLocaleString('en-US',{minimumFractionDigits:Number(CFG.decimals)?Number(CFG.decimals):0,
    maximumFractionDigits:Number(CFG.decimals)});
  return (CFG.currency||'').startsWith('USD') ? 'USD ' + s : 'MK ' + (sep===','?s:s.replace(/,/g,sep));
}
function renderFy(){
  const start = CFG.fyStart;
  const order = ['January','April','July','October'];
  const idx = order.indexOf(start);
  const next = order[(idx+1)%order.length];
  CFG.fyEnd = next === 'January' ? 'December' : order[(idx+1)%order.length];
  const end = {January:'December',April:'March',July:'June',October:'September'}[start];
  CFG.fyEnd = end;
  const yr = Number(CFG.fyStart) === 1 ? 2026 : 2026;
  if(el('fyLabel')) el('fyLabel').textContent = `FY 2026/${String(2027).slice(2)} · ${start.slice(0,3)}–${end.slice(0,3)}`;
  if(el('fyRange')) el('fyRange').textContent = `1 ${start} 2026 — 30 ${end} 2027 · financial year to date`;
}

/* ===================== 18 · COMPLIANCE ===================== */
const CORR = [
  ['28 Oct 2026','Chisomo Kachale','Phone number','Open'],
  ['27 Oct 2026','Memory Phiri','Home address','In review'],
  ['21 Oct 2026','Blessings Tembo','Email address','Resolved'],
  ['15 Oct 2026','Tadala Msonthi','Next of kin','Resolved']
];
const COMP_HIST = [
  ['30 Sep 2026','Data protection audit','Malawi DPA consultant','2 medium findings','Closed'],
  ['12 Sep 2026','RBM microfinance inspection','Reserve Bank of Malawi','1 low finding','Closed'],
  ['28 Aug 2026','Penetration test','Independent firm','3 findings remediated','Closed'],
  ['30 Jun 2026','AML / CFT review','FIU Malawi','0 findings','Closed'],
  ['31 Mar 2026','Internal control review','Internal audit','4 findings','In progress']
];
const SENSITIVE = [
  ['National ID number','Masked except last 4',true],
  ['Monthly income','Masked · credit team only',true],
  ['Phone number','Masked in exports',true],
  ['Home address','Credit team and above',false],
  ['Guarantor details','Visible to loan officers',false],
  ['Bank account number','Masked except last 4',true]
];
function renderSec18(){
  el('compTiles').innerHTML = [
    ['Consent coverage','98.6%','4,746 of 4,812 customers','ok'],
    ['Correction requests','2 open','Oldest 3 days','warn'],
    ['Regulatory returns','0 overdue','Next due 15 Nov 2026','ok'],
    ['Retention compliance','100%','No records past policy','ok']
  ].map(([t,v,s,d])=>`<div class="hcard"><div class="hh"><span class="dot ${d}"></span>${t}</div>
    <div class="hv">${v}</div><div class="hs">${s}</div></div>`).join('');

  el('compAccess').innerHTML = [
    row('Mask personal identifiers','Show the last 4 digits only', tg('compMaskPii',18)),
    row('Log every record view','Read access is audited', tg('compAccessLog',18)),
    row('Bulk export requires approval','Administrator sign-off', tg('compBulkApprove',18)),
    row('Minimum role for full customer data','', pick('compRoleLimit',18,['Credit Analyst and above','Administrator only','Loan Officer and above'])),
    row('Access outside working hours','Flagged for review', tag('Alerted')),
    row('Bulk export approval SLA','Administrator response', num('expApprovalHours',18,`min="1" max="72"`) + unit('hours'))
  ].join('');

  el('compSensitive').innerHTML = SENSITIVE.map(([f,r,on])=>`<div class="check">
    <span class="ck ${on?'y':'w'}">${on?'🔒':'—'}</span>
    <div style="flex:1"><b>${f}</b><span class="s">${r}</span></div>
    <button class="toggle${on?' on':''}" data-sens="${f}" aria-checked="${on?1:0}"></button></div>`).join('');
  el('compSensitive').querySelectorAll('[data-sens]').forEach(b=>{
    b.onclick = ()=>{ toast(`${b.dataset.sens} restriction updated.`,'info');
      const sec='18'; MARK[sec]=MARK[sec]||new Set(); MARK[sec].add('sens:'+b.dataset.sens);
      paintState(sec); updateBand(); };
  });

  el('compPrivacy').innerHTML = [
    row('Consent required before processing','', tg('consentRequired',18)),
    row('Consent text version','', pick('consentVersion',18,['v3.2','v3.1','v2.9'])),
    row('Re-consent every','', num('reConsentMonths',18,`min="12" max="60"`) + unit('months')),
    row('Marketing opt-in by default','', tg('marketingOptIn',18)),
    row('Allow consent withdrawal','', tg('consentWithdraw',18)),
    row('Data processing agreement signed','', tg('dpaSigned',18)),
    row('Privacy contact','', txt('orgSupport',18))
  ].join('');
  el('consentBadge').textContent = CFG.consentRequired ? 'Compliant' : 'Review';
  el('consentBadge').className = 'badge ' + (CFG.consentRequired ? 'b-ok' : 'b-await');

  el('compRetention').innerHTML = [
    row('KYC documents','', pick('retKyc',18,['60 months','84 months','120 months'])),
    row('Transaction records','', pick('retTxn',18,['84 months','120 months','Indefinite'])),
    row('Loan applications','', pick('retApp',18,['36 months','60 months','84 months'])),
    row('System logs','', pick('retLog',18,['12 months','24 months','60 months'])),
    row('Consent records','', pick('retConsent',18,['84 months','120 months','Indefinite']))
  ].join('');

  el('corrBody').innerHTML = CORR.map((c,i)=>{
    const chip = c[3]==='Open'?'st-fail':c[3]==='In review'?'st-await':'st-ok';
    return `<tr><td style="white-space:nowrap;font-size:10.5px">${c[0]}</td>
      <td style="font-weight:600">${c[1]}</td><td>${c[2]}</td>
      <td><span class="chip ${chip}">${c[3]}</span></td>
      <td style="text-align:right">${c[3]==='Resolved'?''
        :`<button class="btn btn-ghost btn-sm" data-corr="${i}" style="padding:2px 7px;font-size:10px">Resolve</button>`}</td></tr>`;
  }).join('');
  el('corrBody').querySelectorAll('[data-corr]').forEach(b=>{
    b.onclick = ()=>{ const c = CORR[Number(b.dataset.corr)];
      c[3]='Resolved'; renderSec18(); toast(`Correction request closed · ${c[1]}.`);
      logAudit('Customer','Data correction request resolved: '+c[1],'compliance.correction');
    };
  });
  el('corrCount').textContent = CORR.filter(c=>c[3]!=='Resolved').length + ' open';

  el('compExport').innerHTML = [
    row('Maximum records per export','', num('expMaxRecords',18,`step="500"`)),
    row('Require approval','', tg('expApprove',18)),
    row('Watermark exports','Requester and timestamp', tg('expWatermark',18)),
    row('Download link expires','', num('expExpiry',18,`min="1" max="72"`) + unit('hours')),
    row('Format','', pick('exportFormat',18,['CSV','Excel (.xlsx)','JSON']))
  ].join('');
  el('compClosure').innerHTML = [
    row('Retain records after closure','', num('closureRetain',18,`min="12" max="120"`) + unit('months')),
    row('Anonymise personal data','Keep the financial record only', tg('closureAnon',18)),
    row('Purge after','', pick('closurePurge',18,['30 days','90 days','180 days'])),
    row('Block re-registration','Match on national ID', tg('closureBlock',18)),
    row('Notify customer on closure','', tg('closureNotify',18))
  ].join('');

  el('compReg').innerHTML = [
    row('RBM monthly return','', tg('regRbm',18)),
    row('FIU / AML reporting','', tg('regFiu',18)),
    row('Submission due','', pick('regDue',18,['15th of following month','10th of following month','5th of following month'])),
    row('Auto-generate return pack','', tg('regAuto',18)),
    row('Reporting currency','', tag('MWK')),
    row('Next submission','15 Nov 2026', tag('16 days'))
  ].join('');
  el('compAudit').innerHTML = [
    row('Immutable audit trail','', tg('auditImmutable2',18)),
    row('Record read access','', tg('auditReads2',18)),
    row('Audit retention','', pick('auditRetain2',18,['24 months','60 months','120 months'])),
    row('Third-party access review','Quarterly', tag('Current'))
  ].join('');

  el('compHistBody').innerHTML = COMP_HIST.map(h=>`<tr>
    <td style="white-space:nowrap;font-size:10.5px">${h[0]}</td>
    <td style="font-weight:600">${h[1]}</td><td>${h[2]}</td><td>${h[3]}</td>
    <td><span class="chip ${h[4]==='Closed'?'st-ok':'st-await'}">${h[4]}</span></td></tr>`).join('');
}

/* ===================== previews & derived text ===================== */
function refreshPreviews(){
  renderLocPreview();
  renderFy();
  renderMaintBanner();
  if(el('esigBadge')){
    el('esigBadge').textContent = CFG.esigEnabled ? 'Enabled' : 'Off';
    el('esigBadge').className = 'badge ' + (CFG.esigEnabled ? 'b-ok' : 'b-await');
  }
  const rr = document.querySelector('[data-k="rptRefFormat"]');
  if(rr){
    const txtRef = (CFG.rptRefFormat||'RPT-{YYYY}-{SEQ}')
      .replace('{YYYY}', 2026).replace('{MM}','10')
      .replace(/\{SEQ(?::(\d+))?\}/, (_,p)=>String(481).padStart(p?Number(p):4,'0'));
    const holder = rr.closest('.setrow').nextElementSibling;
    if(holder) holder.querySelector('.val-tag').textContent = txtRef;
  }
  if(el('refPreview')) el('refPreview').innerHTML = buildRef() + '<span>live preview</span>';
  if(el('payRefPreview')) el('payRefPreview').innerHTML =
    `${CFG.refPrefixPay}-${String(481).padStart(CFG.refLength,'0').slice(-CFG.refLength)}<span>reference preview</span>`;
  if(el('prodAutoCap')) el('prodAutoCap').textContent = mk(CFG.prodAutoCap);
  if(el('docNumPreview')) el('docNumPreview').innerHTML =
    `${CFG.docPrefix}${CFG.docSeparator}${CFG.docYear}${CFG.docSeparator}${String(CFG.docSeq).padStart(CFG.docPadding,'0')}<span>next number</span>`;
  if(el('letterhead')) renderDocPreview();
  if(el('pvName')) renderPortalPreview();
  if(el('nextBackup')) renderBackupNext();
  if(el('maintBadge')) renderMaintBanner();
}

/* ===================== search across every setting ===================== */
function filterSettings(q){
  q = (q || '').trim().toLowerCase();
  const hitsBox = el('searchHits');
  const rows = document.querySelectorAll('.content .setrow, .content .lrow, .content .check, .content .icard, .content .optcard');
  if(!q){
    rows.forEach(r=>{ r.style.display=''; r.classList.remove('hit'); });
    document.querySelectorAll('.sec').forEach(s=>s.classList.remove('dimmed'));
    hitsBox.classList.remove('on');
    return;
  }
  let total = 0;
  const perSec = {};
  document.querySelectorAll('.sec').forEach(sec=>{
    let n = 0;
    sec.querySelectorAll('.setrow, .lrow, .check, .icard, .optcard').forEach(r=>{
      const match = r.textContent.toLowerCase().includes(q);
      r.style.display = match ? '' : 'none';
      r.classList.toggle('hit', match);
      if(match){ n++; total++; }
    });
    perSec[sec.id] = n;
    sec.classList.toggle('dimmed', n === 0);
  });
  const which = Object.entries(perSec).filter(([,n])=>n>0).map(([id])=>'§'+id.slice(1));
  hitsBox.classList.add('on');
  el('searchHitsText').innerHTML = total
    ? `<b>${total}</b> setting${total===1?'':'s'} match “${q}” in ${which.join(', ')}`
    : `No settings match “${q}”. Try “password”, “backup”, “currency” or “approval”.`;
}

/* ===================== export ===================== */
function downloadFile(name, mime, text){
  if(window.self !== window.top){
    openModal('Export preview', name + ' · ' + (text.split('\n').length) + ' lines', `
      <div class="note gold" style="margin-bottom:10px"><div>Downloads are blocked inside this embedded
        preview frame. Copy the contents below, or open the portal in its own browser tab to save the file.</div></div>
      <textarea readonly style="width:100%;min-height:260px;font-family:ui-monospace,monospace;font-size:10.5px;
        border:1px solid var(--line);border-radius:9px;padding:10px">${text.slice(0,4000)}</textarea>`,
      [{label:'Close', act:'close'}]);
    return;
  }
  try{
    const blob = new Blob([text], {type:mime});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(a.href), 2000);
    toast(`Exported ${name}.`);
  }catch(err){
    openModal('Export preview', name + ' · ' + text.split('\n').length + ' lines', `
      <div class="note gold" style="margin-bottom:10px"><div>This browser blocked the download. Copy the
        contents below and save them as ${name}.</div></div>
      <textarea readonly style="width:100%;min-height:260px;font-family:ui-monospace,monospace;font-size:10.5px;
        border:1px solid var(--line);border-radius:9px;padding:10px">${text.slice(0,4000)}</textarea>`,
      [{label:'Close', act:'close'}]);
  }
}
function exportCfg(){
  const lines = [['Setting','Value']].concat(Object.keys(CFG).map(k=>[k, String(CFG[k])]));
  downloadFile('gfs-settings-export.csv','text/csv;charset=utf-8',
    '\ufeff' + lines.map(l=>l.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n'));
  logAudit('Admin','Configuration exported','settings.export');
}

/* ===================== wiring ===================== */
const on = (id, ev, fn)=>{ const n = el(id); if(n) n.addEventListener(ev, fn); };

function initSettings(){
  /* render every section */
  renderSec1(); renderUsers(); renderRoles();
  renderSec4(); renderLogins();
  renderProducts(); renderSec6(); renderSec7(); renderSim();
  renderMethods(); renderSec9();
  renderSec10(); renderSec11(); renderAudit();
  renderSec13(); renderSec14();
  renderSec15(); renderSec16(); renderSec17(); renderSec18();

  /* selects that depend on data */
  el('usrRole').innerHTML = '<option value="">All roles</option>' + ROLES.map(r=>`<option>${r.name}</option>`).join('');
  el('usrBranch').innerHTML = '<option value="">All branches</option>' + BRANCHES.map(b=>`<option>${b}</option>`).join('');
  el('ncRole').innerHTML = ROLES.filter(r=>r.sys).map(r=>`<option>${r.name}</option>`).join('');
  el('ncBranch').innerHTML = BRANCHES.map(b=>`<option>${b}</option>`).join('');
  el('auditActor').innerHTML = '<option value="">All actors</option>' +
    [...new Set(AUDIT.map(a=>a.actor))].map(a=>`<option>${a}</option>`).join('');
  genTempPwd();

  /* user management */
  on('usrSearch','input', e=>{ U.q = e.target.value; U.page = 1; renderUsers(); });
  on('usrRole','change', e=>{ U.role = e.target.value; U.page = 1; renderUsers(); });
  on('usrStatus','change', e=>{ U.status = e.target.value; U.page = 1; renderUsers(); });
  on('usrBranch','change', e=>{ U.branch = e.target.value; U.page = 1; renderUsers(); });
  on('usrExport','click', ()=>{
    downloadFile('gfs-users.csv','text/csv;charset=utf-8','\ufeff' +
      ['Name,Username,Email,Role,Branch,Status,MFA,Last login']
        .concat(USERS.map(u=>[u.n,u.u,u.e,u.r,u.b,u.st,u.mfa,u.last.replace(/,/g,'')].join(','))).join('\n'));
  });
  on('usrBody','click', e=>{
    const b = e.target.closest('[data-user]');
    if(!b) return;
    const u = USERS.find(x=>x.u === b.dataset.user);
    if(u) userModal(u);
  });
  on('ncCreate','click', createAccount);
  on('ncRegen','click', genTempPwd);

  /* roles */
  on('roleNew','click', ()=>{ el('crName').focus(); el('crName').scrollIntoView({behavior:'smooth',block:'center'}); });
  on('crCreate','click', createRole);
  on('crClear','click', ()=>{ el('crName').value=''; el('crDesc').value=''; });
  on('roleDelete','click', ()=>{
    const r = ROLES.find(x=>x.name===RS.role);
    if(!r || r.sys){ toast('System roles cannot be deleted.','err'); return; }
    if(USERS.some(u=>u.r===r.name)){ toast('Reassign the assigned users first.','err'); return; }
    openModal('Delete role', r.name, `<div class="note red"><div>This permanently removes the role and its
      ${ROLE_PERMS[r.name].reduce((a,b)=>a+b,0)} permissions. This cannot be undone.</div></div>`,
      [{label:'Cancel', act:'close'}, {label:'Delete role', cls:'btn-red', act:()=>{
        const i = ROLES.findIndex(x=>x.name===r.name);
        ROLES.splice(i,1); delete ROLE_PERMS[r.name];
        RS.role = 'Administrator'; closeModal(); renderRoles();
        toast(`Role “${r.name}” deleted.`,'info');
        logAudit('Permission','Custom role deleted: '+r.name,'role.'+r.name);
      }}]);
  });
  on('permAll','click', ()=>{ if(RS.role==='Administrator'){ toast('Administrator already has full access.','info'); return; }
    ROLE_PERMS[RS.role] = PERM_GROUPS.map(()=>1); renderMatrix(); renderRoleDetail(); markPerms(); });
  on('permNone','click', ()=>{ ROLE_PERMS[RS.role] = PERM_GROUPS.map(()=>0);
    renderMatrix(); renderRoleDetail(); markPerms(); });
  on('permReset','click', ()=>{ ROLE_PERMS[RS.role] = roleDefaults(RS.role).map(Number);
    renderMatrix(); renderRoleDetail(); markPerms(); toast('Permissions reset to the role default.','info'); });

  /* security */
  on('pwTest','input', renderPwTest);
  on('loginFilter','change', renderLogins);

  /* products */
  on('prodNew','click', ()=>productModal(null));
  on('npCreate','click', createProduct);
  on('npClear','click', ()=>{ ['npName','npCode'].forEach(i=>el(i).value=''); });

  /* approvals */
  on('lvlNew','click', ()=>{
    const l = {lvl:LEVELS.length+1, role:'Credit Analyst', from:0, to:1000000, sla:24, self:false};
    LEVELS.push(l); levelModal(l);
  });

  /* repayments */
  on('prioReset','click', ()=>{
    PRIO = [{k:'penalty',n:'Penalty & late fees',s:'Charged first on arrears'},
      {k:'fees',n:'Fees',s:'Processing and service fees'},
      {k:'interest',n:'Interest',s:'Accrued interest for the period'},
      {k:'principal',n:'Principal',s:'Reduces the outstanding balance'}];
    renderSec7(); renderSim(); toast('Allocation priority reset.','info');
  });
  on('simRun','click', renderSim);
  ['simIn','simPen'].forEach(i=>on(i,'input', renderSim));

  /* payment methods */
  on('emailTest','click', ()=>{
    if(!CFG.emailHost){ toast('An SMTP host is required.','err'); return; }
    el('emailSent').textContent = 'Last sent just now · test message';
    toast('Test email sent to ' + CFG.emailReply + '.');
    logAudit('Config','Test email sent','integration.email');
  });
  on('smsTest','click', ()=>{
    const bal = Number(CFG.smsBalance || 48249);
    toast('Test SMS queued · 1 credit used.','info');
  });

  /* notifications */
  on('tplNew','click', ()=>tplModal({n:'New template', t:'Custom', c:'SMS', st:'Draft', up:TODAY}));
  on('logFilter','change', renderDelivery);

  /* portal */
  on('psSave','click', ()=>{
    toast('Customer support contact details saved.');
    logAudit('Config','Customer support contact updated','portal.support');
  });

  /* data */
  on('dbCfg','change', ()=>{});
  on('backupNow','click', ()=>{
    const now = '30 Oct 2026 · ' + nowTime();
    BACKUPS.unshift([now,'Manual','1.86 GB','—','Completed']);
    renderSec11(); toast('Backup started — a full snapshot is running.');
    logAudit('Admin','Manual backup started','backup.manual');
  });
  on('intRun','click', ()=>{
    renderSec11();
    toast('7 integrity checks run · 6 passed, 1 needs review.','info');
    logAudit('Admin','Data integrity checks run','data.integrity');
  });
  on('dupRun','click', ()=>{ renderDupResults(true); toast('Duplicate scan complete · 3 possible matches.','info'); });
  on('archiveRun','click', ()=>{
    el('archiveStat').textContent = '3,482 records · 412 MB · last run just now';
    toast('Archiving job queued for records older than ' + CFG.archiveAfter + ' months.','info');
  });
  on('importDrop','click', ()=>openModal('Import data','CSV or XLSX · up to ' + nf(CFG.importMax) + ' rows', `
    <div class="drop" style="padding:26px">Click to choose a file, or drop it here<br>
      <span style="font-size:9.5px;color:var(--muted-2)">Customers · Loans · Repayments</span></div>
    <div class="note gold" style="margin-top:11px"><div>Files are validated against the column template first.
      Rows that fail validation are rejected with a downloadable report — nothing is written until you confirm.</div></div>`,
    [{label:'Cancel', act:'close'}, {label:'Choose file', cls:'btn-gold', act:()=>{
      closeModal(); toast('File picker is unavailable in this sample build — import logic is ready.','info');
    }}]));

  /* audit */
  el('auditTabs').querySelectorAll('button').forEach(b=>{
    b.onclick = ()=>{
      el('auditTabs').querySelectorAll('button').forEach(x=>x.classList.remove('on'));
      b.classList.add('on'); A.cat = b.dataset.cat; A.page = 1; renderAudit();
    };
  });
  on('auditSearch','input', e=>{ A.q = e.target.value; A.page = 1; renderAudit(); });
  on('auditActor','change', e=>{ A.actor = e.target.value; A.page = 1; renderAudit(); });
  on('auditRange','change', e=>{ A.page = 1; renderAudit(); });
  on('auditExport','click', ()=>{
    const rows = auditFiltered();
    downloadFile('gfs-audit-log.csv','text/csv;charset=utf-8','\ufeff' +
      ['Time,Category,Actor,Action,Entity,IP,Result']
        .concat(rows.map(a=>[a.time,a.cat,a.actor,a.action.replace(/,/g,';'),a.entity,a.ip,a.result].join(','))).join('\n'));
  });

  /* documents */
  on('lhEdit','click', ()=>{
    openModal('Edit letterhead','Applied to every generated document', `
      <div class="form-grid">
        <div class="fg" style="grid-column:1/-1"><label>Organisation name on letterhead</label>
          <input id="mhName" value="${CFG.lhName}"></div>
        <div class="fg" style="grid-column:1/-1"><label>Tagline</label><input id="mhTag" value="${CFG.lhTag}"></div>
        <div class="fg" style="grid-column:1/-1"><label>Footer address</label><input id="mhFoot" value="${CFG.lhFooter}"></div>
      </div>`,
      [{label:'Cancel', act:'close'}, {label:'Save', cls:'btn-gold', act:()=>{
        CFG.lhName = el('mhName').value; CFG.lhTag = el('mhTag').value; CFG.lhFooter = el('mhFoot').value;
        closeModal(); renderSec13(); toast('Letterhead updated.');
        logAudit('Config','Letterhead updated','documents.letterhead');
      }}]);
  });

  /* reports */
  on('schedNew','click', scheduleModal);

  /* integrations */
  on('intErrFilter','change', renderSec15);
  on('healthCheck','click', ()=>{
    CFG.smsStatus = 'Connected'; renderSec15();
    toast('All integrations re-checked · 5 of 5 connected.');
    logAudit('Admin','Integration health re-checked','integration.health');
  });
  on('keyNew','click', ()=>{
    openModal('Generate API key','The key is shown once, then stored hashed', `
      <div class="form-grid">
        <div class="fg"><label>Key name</label><input id="mkName" placeholder="e.g. Reporting dashboard"></div>
        <div class="fg"><label>Scope</label><select id="mkScope">
          <option>read:loans</option><option>read:customers</option><option>write:repayments</option>
          <option>read:reports</option></select></div>
        <div class="fg"><label>Expires</label><select id="mkExp">
          <option>Never</option><option>90 days</option><option>1 year</option></select></div>
      </div>
      <div class="note gold" style="margin-top:11px"><div>A new key inherits the API settings above and is
        logged in the audit trail on every call.</div></div>`,
      [{label:'Cancel', act:'close'}, {label:'Generate', cls:'btn-gold', act:()=>{
        const name = el('mkName').value || 'New integration';
        const p = 'gfs_live_' + Math.random().toString(16).slice(2,6);
        KEYS.unshift({n:name, p, s:el('mkScope').value, c:TODAY, u:'Never', st:'Active'});
        closeModal(); renderSec15(); toast(`API key generated for ${name}.`);
        logAudit('Permission','API key generated: '+name,'apikey.'+p);
      }}]);
  });
  on('hookNew','click', ()=>{
    openModal('Add webhook','Receives signed POST requests', `
      <div class="form-grid">
        <div class="fg" style="grid-column:1/-1"><label>Endpoint URL</label><input id="hkUrl" placeholder="https://"></div>
        <div class="fg" style="grid-column:1/-1"><label>Events</label><input id="hkEv" value="loan.approved, repayment.posted"></div>
        <div class="fg" style="grid-column:1/-1"><label>Signing secret</label>
          <input id="hkSec" value="whsec_${Math.random().toString(36).slice(2,10)}" readonly></div>
      </div>`,
      [{label:'Cancel', act:'close'}, {label:'Add webhook', cls:'btn-gold', act:()=>{
        HOOKS.push({u:el('hkUrl').value || 'https://example.com/hook', e:el('hkEv').value, st:'Active'});
        closeModal(); renderSec15(); toast('Webhook added.');
        logAudit('Config','Webhook added','integration.webhook');
      }}]);
  });

  /* maintenance */
  on('checkUpdates','click', ()=>{
    toast('Update check complete · v2.5.0 available.','info');
    logAudit('Admin','Update check performed','system.update');
  });
  on('viewUpdate','click', ()=>{
    openModal('v2.5.0 release notes','30 Oct 2026 · 14 changes', `
      <div class="tl">
        <div class="tl-item"><b>Settings console</b><span>18 sections, change tracking and audit on save</span></div>
        <div class="tl-item"><b>Faster reports</b><span>89 reports render 3× faster with virtualised tables</span></div>
        <div class="tl-item"><b>Supabase client 2.4</b><span>Connection pooling and retry handling</span></div>
        <div class="tl-item"><b>Fixes</b><span>Receipt numbering, SMS retry, export watermark</span></div>
      </div>
      <div class="note gold" style="margin-top:11px"><div>Production updates are applied during the
        scheduled window on ${CFG.maintWindow}.</div></div>`,
      [{label:'Close', act:'close'}, {label:'Schedule upgrade', cls:'btn-gold', act:()=>{
        closeModal(); toast('Upgrade scheduled for 02 Nov 2026 · 23:00.','info');
        logAudit('Admin','Upgrade to v2.5.0 scheduled','system.update');
      }}]);
  });
  on('healthRefresh','click', ()=>{ renderSec16(); toast('System health refreshed.','info'); });
  on('cacheClear','click', ()=>{
    el('cacheSize').textContent = '0 MB';
    el('cacheSub').textContent = 'Hit rate — · purged just now';
    el('cacheBadge').textContent = 'Cold'; el('cacheBadge').className = 'badge b-ok';
    toast('Application cache cleared.','info');
    logAudit('Admin','Application cache cleared','system.cache');
  });
  on('cdnPurge','click', ()=>{ toast('CDN purge requested for all assets.','info');
    logAudit('Admin','CDN purge requested','system.cdn'); });

  /* localization */
  on('holidayNew','click', ()=>{
    openModal('Add public holiday','Excluded from due-date calculations', `
      <div class="form-grid">
        <div class="fg"><label>Date</label><input id="hDate" placeholder="DD MMM YYYY" value="01 Jan 2027"></div>
        <div class="fg"><label>Holiday name</label><input id="hName" placeholder="e.g. New Year’s Day"></div>
        <div class="fg"><label>Type</label><select id="hType"><option>Public holiday</option>
          <option>Company holiday</option></select></div>
        <div class="fg"><label>Shift due dates</label><select id="hShift"><option>Yes</option><option>No</option></select></div>
      </div>`,
      [{label:'Cancel', act:'close'}, {label:'Add holiday', cls:'btn-gold', act:()=>{
        HOLIDAYS.push([el('hDate').value, el('hName').value || 'Holiday', el('hType').value,
          el('hShift').value==='Yes', 'Active']);
        closeModal(); renderSec17(); toast('Holiday added to the calendar.');
        logAudit('Config','Public holiday added','holiday');
      }}]);
  });

  /* compliance */
  on('complianceExport','click', ()=>{
    const lines = ['GOLDEN FINANCIAL SERVICES — COMPLIANCE PACK','Generated 30 Oct 2026','',
      'CONSENT','  required: '+CFG.consentRequired, '  version: '+CFG.consentVersion, '',
      'RETENTION','  KYC: '+CFG.retKyc, '  Transactions: '+CFG.retTxn, '  Logs: '+CFG.retLog, '',
      'REGULATORY','  RBM return: '+CFG.regRbm, '  FIU reporting: '+CFG.regFiu, '  Due: '+CFG.regDue];
    downloadFile('gfs-compliance-pack.txt','text/plain;charset=utf-8', lines.join('\n'));
    logAudit('Admin','Compliance pack exported','compliance.export');
  });

  /* general / topbar */
  on('menuBtn','click', ()=>el('sidebar').classList.toggle('open'));
  on('globalSearch','input', e=>filterSettings(e.target.value));
  on('clearSearch','click', ()=>{ el('globalSearch').value=''; filterSettings(''); });
  on('saveAll','click', saveEverything);
  on('saveAll2','click', saveEverything);
  on('exportCfg','click', exportCfg);
  on('reviewBtn','click', ()=>{
    const dirty = Object.keys(MARK).filter(s=>MARK[s].size);
    openModal('Review queue', dirty.length ? `${dirty.length} section${dirty.length>1?'s':''} with unsaved changes`
      : 'Everything is saved', dirty.length ? dirty.map(s=>{
        const count = MARK[s].size;
        return `<div class="lrow"><div class="lic">${s}</div>
          <div><div class="lt">Section ${s}</div><div class="ls">${count} pending change${count>1?'s':''}</div></div>
          <div class="lr"><button class="btn btn-ghost btn-sm" data-goto="${s}">Review</button>
            <button class="btn btn-gold btn-sm" data-savesec="${s}">Save</button></div></div>`;
      }).join('') : `<div class="note"><div>No section has pending changes. Every setting matches the
        last saved configuration.</div></div>`,
      [{label:'Close', act:'close'}]);
    document.querySelectorAll('[data-goto]').forEach(b=>b.onclick=()=>{
      closeModal(); const t = document.querySelector('#s'+b.dataset.goto);
      window.scrollTo({top:t.offsetTop-112, behavior:'smooth'});
    });
    document.querySelectorAll('[data-savesec]').forEach(b=>b.onclick=()=>{
      saveSection(b.dataset.savesec); closeModal();
    });
  });
  on('bellBtn','click', ()=>{
    openModal('Settings requiring review','Configuration watchlist', `
      <div class="lrow"><div class="lic" style="background:#FFF4E0;color:#9A6A0D">!</div>
        <div><div class="lt">SMS gateway is degraded</div><div class="ls">24h uptime 97.4% · section 15</div></div>
        <div class="lr"><button class="btn btn-ghost btn-sm" data-jump="15">Open</button></div></div>
      <div class="lrow"><div class="lic" style="background:#FFF4E0;color:#9A6A0D">!</div>
        <div><div class="lt">2 correction requests open</div><div class="ls">Oldest 3 days · section 18</div></div>
        <div class="lr"><button class="btn btn-ghost btn-sm" data-jump="18">Open</button></div></div>
      <div class="lrow"><div class="lic" style="background:#FDEDED;color:#B32C2C">!</div>
        <div><div class="lt">1 account locked</div><div class="ls">Peter Chirwa · 5 failed attempts · section 2</div></div>
        <div class="lr"><button class="btn btn-ghost btn-sm" data-jump="2">Open</button></div></div>
      <div class="lrow"><div class="lic">↑</div>
        <div><div class="lt">v2.5.0 available</div><div class="ls">Scheduled window 02 Nov 2026 · section 16</div></div>
        <div class="lr"><button class="btn btn-ghost btn-sm" data-jump="16">Open</button></div></div>`,
      [{label:'Close', act:'close'}]);
    document.querySelectorAll('[data-jump]').forEach(b=>b.onclick=()=>{
      closeModal(); const t = document.querySelector('#s'+b.dataset.jump);
      window.scrollTo({top:t.offsetTop-112, behavior:'smooth'});
    });
  });

  /* logo helpers */
  const logoTools = ()=>{
    toast('Logo upload is a static demo — the existing mark stays in place.','info');
  };
  on('logoUpload','click', logoTools);
  on('logoView','click', ()=>{
    openModal('Logo preview','golden-logo.svg · 512 × 512', `
      <div style="display:grid;place-items:center;padding:16px;background:#F7F8FA;border-radius:12px">
        <div class="logo-tile" style="width:120px;height:120px;border-radius:26px;font-size:38px">GF</div></div>
      <div class="note" style="margin-top:11px"><div>Shown on the sidebar, letterhead, statements and receipts.</div></div>`,
      [{label:'Close', act:'close'}]);
  });
  on('logoDrop','click', logoTools);

  on('modalClose','click', closeModal);
  el('modal').addEventListener('click', e=>{ if(e.target === el('modal')) closeModal(); });

  /* nav guard for modules that are not built yet */
  document.querySelectorAll('.nav-item').forEach(item=>{
    item.addEventListener('click', e=>{
      const p = item.dataset.page;
      if(['dashboard','disbursements','notifications','staff','reports','settings'].includes(p)) return;
      e.preventDefault();
      toast('This module is queued for build.','info');
      el('sidebar').classList.remove('open');
    });
  });

  /* section nav spy + smooth scroll */
  const secs = [...document.querySelectorAll('.sec')];
  const chips = [...document.querySelectorAll('.snav')];
  const spy = ()=>{
    let cur = secs[0];
    for(const s of secs) if(s.getBoundingClientRect().top <= 150) cur = s;
    chips.forEach(c=>c.classList.toggle('on', c.getAttribute('href') === '#' + cur.id));
  };
  window.addEventListener('scroll', spy, {passive:true});
  chips.forEach(c=>c.addEventListener('click', e=>{
    e.preventDefault();
    const t = document.querySelector(c.getAttribute('href'));
    if(t) window.scrollTo({top:t.offsetTop-112, behavior:'smooth'});
  }));

  /* footer counts */
  updateBand();
  refreshPreviews();
  spy();
}
function markPerms(){
  const sec='3'; MARK[sec]=MARK[sec]||new Set(); MARK[sec].add('perm:'+RS.role);
  paintState(sec); updateBand(); renderRoleDetail();
}
function saveEverything(){
  const dirty = Object.keys(MARK).filter(s=>MARK[s].size);
  if(!dirty.length){ toast('All settings are already saved.','info'); return; }
  let total = 0;
  dirty.forEach(s=>{ total += MARK[s].size; MARK[s].clear(); SAVED_AT[s] = nowTime(); paintState(s); });
  Object.keys(CFG).forEach(k=>{ SNAP[k] = CFG[k]; });
  updateBand();
  toast(`${total} setting${total>1?'s':''} saved across ${dirty.length} section${dirty.length>1?'s':''}.`);
  logAudit('Config','Saved all configuration changes','settings.all');
}

/* section re-renderers, used by discard */
const RENDER = {
  1:renderSec1, 2:renderUsers, 3:renderRoles, 4:renderSec4, 5:renderProducts,
  6:renderSec6, 7:renderSec7, 8:renderMethods, 9:renderSec9, 10:renderSec10,
  11:renderSec11, 12:renderAudit, 13:renderSec13, 14:renderSec14, 15:renderSec15,
  16:renderSec16, 17:renderSec17, 18:renderSec18
};

window.SETTINGS_APP = {CFG, MARK, USERS, ROLES, ROLE_PERMS, PRODUCTS, LEVELS, AUDIT, HOLIDAYS, saveEverything};

initSettings();
</script>
</body>
</html>
