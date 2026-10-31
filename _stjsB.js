/* ============================================================
   SETTINGS MODULE  (2/4) · Security, products, approvals,
   repayments, payment methods and notifications
   ============================================================ */

/* ===================== 4 · AUTHENTICATION & SECURITY ===================== */
const DEVICES = [
  {d:'MacBook Pro · Chrome 131', u:'Chikondi Mwale', seen:'30 Oct 2026 · 08:42', trusted:true},
  {d:'iPhone 14 · Safari', u:'Chikondi Mwale', seen:'29 Oct 2026 · 18:10', trusted:true},
  {d:'Windows 11 · Edge 130', u:'Memory Phiri', seen:'30 Oct 2026 · 07:40', trusted:true},
  {d:'Samsung A54 · Chrome', u:'Yamikani Banda', seen:'28 Oct 2026 · 16:05', trusted:false},
  {d:'iPad · Safari', u:'Grace Mvula', seen:'26 Oct 2026 · 11:22', trusted:true}
];
const LOGINS = [
  ['08:42','Chikondi Mwale','Administrator','197.210.14.22','Blantyre, MW','MacBook · Chrome','Authenticator','Success'],
  ['08:15','Thandiwe Kamanga','Credit Analyst','197.210.14.31','Blantyre, MW','Windows · Edge','Authenticator','Success'],
  ['07:58','Yamikani Banda','Loan Officer','41.87.11.9','Blantyre, MW','Android · Chrome','SMS','Success'],
  ['07:40','Memory Phiri','Cashier','41.87.11.44','Limbe, MW','Windows · Edge','SMS','Success'],
  ['07:31','Peter Chirwa','Loan Officer','41.87.22.14','Mzuzu, MW','Android · Chrome','—','Blocked'],
  ['07:29','Peter Chirwa','Loan Officer','41.87.22.14','Mzuzu, MW','Android · Chrome','—','Failed'],
  ['07:28','Peter Chirwa','Loan Officer','41.87.22.14','Mzuzu, MW','Android · Chrome','—','Failed'],
  ['07:22','Linda Mhango','Collections Officer','41.87.22.31','Mzuzu, MW','Android · Chrome','SMS','Success'],
  ['06:55','unknown','—','102.68.77.19','Lagos, NG','Linux · Firefox','—','Blocked'],
  ['06:41','Esther Mwale','Customer Support','41.87.11.63','Blantyre, MW','Windows · Chrome','Email','Success'],
  ['06:12','Agnes Chikopa','Auditor','197.210.14.55','Blantyre, MW','MacBook · Safari','Authenticator','Success'],
  ['05:48','Grace Mvula','Auditor','197.210.14.90','Blantyre, MW','iPad · Safari','Authenticator','Success'],
  ['04:20','fatsani.g','Cashier','41.87.55.28','Kasungu, MW','Android · Chrome','—','Failed'],
  ['03:02','admin','Administrator','197.210.14.22','Blantyre, MW','API token','—','Success']
];

function pwChecks(v){
  const c = [];
  if(CFG.pwdMin) c.push(['At least ' + CFG.pwdMin + ' characters', v.length >= CFG.pwdMin]);
  if(CFG.pwdUpper) c.push(['Uppercase letter', /[A-Z]/.test(v)]);
  if(CFG.pwdLower) c.push(['Lowercase letter', /[a-z]/.test(v)]);
  if(CFG.pwdNumber) c.push(['Number', /[0-9]/.test(v)]);
  if(CFG.pwdSymbol) c.push(['Symbol', /[^A-Za-z0-9]/.test(v)]);
  if(CFG.pwdDict) c.push(['Not a common word', v.length>0 && !/^(password|golden|admin|12345)/i.test(v)]);
  return c;
}
function renderPwTest(){
  const v = el('pwTest').value || '';
  const checks = pwChecks(v);
  const pass = checks.filter(c=>c[1]).length;
  const pct = checks.length ? Math.round(pass/checks.length*100) : 0;
  const bar = el('pwBar');
  bar.style.width = pct + '%';
  bar.parentElement.className = 'hbar' + (pct===100?' green':pct>=60?'':' red');
  el('pwScoreBadge').textContent = pct===100?'Strong':pct>=60?'Medium':'Weak';
  el('pwScoreBadge').className = 'badge ' + (pct===100?'b-ok':pct>=60?'b-await':'b-rej');
  el('pwChecks').innerHTML = checks.map(c=>`<span class="mini-tag ${c[1]?'g':'r'}">${c[1]?'✓':'✕'} ${c[0]}</span>`).join('');
}
function renderSec4(){
  el('secPass').innerHTML = [
    row('Minimum password length','Characters required', num('pwdMin',4,`min="6" max="32"`) + unit('chars')),
    row('Require uppercase letter','A–Z', tg('pwdUpper',4)),
    row('Require lowercase letter','a–z', tg('pwdLower',4)),
    row('Require a number','0–9', tg('pwdNumber',4)),
    row('Require a symbol','! @ # $ %', tg('pwdSymbol',4)),
    row('Password expiry','0 disables expiry', num('pwdExpiry',4,`min="0" max="365"`) + unit('days')),
    row('Prevent password reuse','Remember previous passwords', num('pwdReuse',4,`min="0" max="12"`) + unit('recent')),
    row('Block common / dictionary words','', tg('pwdDict',4)),
    row('Force change at first login','Temporary passwords must be replaced', tg('pwdChangeFirst',4))
  ].join('');

  el('secLock').innerHTML = [
    row('Failed login attempt limit','Before the account locks', num('failLimit',4,`min="3" max="10"`) + unit('attempts')),
    row('Lockout duration','How long the account stays locked', num('lockMinutes',4,`min="5" max="240"`) + unit('min')),
    row('Auto-unlock after duration','Otherwise only an administrator can unlock', tg('autoUnlock',4)),
    row('Show captcha after','Challenge before the limit is reached', num('captchaAfter',4,`min="1" max="5"`) + unit('attempts')),
    row('Email the user on lockout','', tg('notifyFail',4))
  ].join('');

  el('secSession').innerHTML = [
    row('Idle session timeout','Sign out after inactivity', num('sessionIdle',4,`min="5" max="120"`) + unit('min')),
    row('Warn before timeout','Show a keep-alive prompt', num('sessionWarn',4,`min="1" max="10"`) + unit('min')),
    row('Absolute session limit','Forced re-authentication', num('sessionAbs',4,`min="1" max="24"`) + unit('hours')),
    row('“Remember me” duration','', num('rememberDays',4,`min="1" max="90"`) + unit('days')),
    row('One session per user','Sign out older sessions', tg('sessionSingle',4)),
    row('Sign out everywhere on password change','', tg('logoutPwdChange',4))
  ].join('');

  el('secMfa').innerHTML = [
    row('Multi-factor authentication','Second factor at sign-in', tg('mfaEnabled',4)),
    row('Grace period for new users','Days before MFA is enforced', num('mfaGrace',4,`min="0" max="30"`) + unit('days')),
    row('Remember device for','', num('mfaRemember',4,`min="1" max="90"`) + unit('days'))
  ].join('');

  const methods = [['Authenticator','TOTP app · most secure'],['SMS','One-time code by text'],['Email','One-time code by email']];
  el('mfaMethods').innerHTML = methods.map(([m,d])=>
    `<div class="optcard${CFG.mfaMethod===m?' on':''}" data-mfa="${m}">
      <b>${m}</b><span>${d}</span></div>`).join('');
  el('mfaMethods').querySelectorAll('[data-mfa]').forEach(c=>{
    c.onclick = ()=>{ apply('mfaMethod', c.dataset.mfa, 4); renderSec4(); };
  });

  const mfaOn = (CFG.mfaRoles||'').split(',').map(s=>s.trim()).filter(Boolean);
  el('mfaRoles').innerHTML = ROLES.slice(0,7).map(r=>{
    const on = mfaOn.includes(r.name);
    return `<span class="mini-tag ${on?'g':''}" data-mfarole="${r.name}" style="cursor:pointer">${on?'✓':'＋'} ${r.name}</span>`;
  }).join('');
  el('mfaRoles').querySelectorAll('[data-mfarole]').forEach(t=>{
    t.onclick = ()=>{
      const role = t.dataset.mfarole;
      const cur = (CFG.mfaRoles||'').split(',').map(s=>s.trim()).filter(Boolean);
      const next = cur.includes(role) ? cur.filter(x=>x!==role) : [...cur, role];
      apply('mfaRoles', next.join(', '), 4, true);
      renderSec4();
      toast(`MFA ${next.includes(role)?'required':'optional'} for ${role}.`,'info');
    };
  });
  el('mfaBadge').textContent = CFG.mfaEnabled ? 'Enforced' : 'Optional';
  el('mfaBadge').className = 'badge ' + (CFG.mfaEnabled ? 'b-ok' : 'b-await');

  el('secMonitor').innerHTML = [
    row('Monitor sign-in activity','Log every attempt with IP and device', tg('suspicious',4)),
    row('Flag unusual locations','Compare against the user’s history', tg('unusualLoc',4)),
    row('Block logins outside Malawi','Geo-fencing', tg('geomatch',4)),
    row('Trusted device limit','Beyond this, MFA is always required', num('deviceLimit',4,`min="1" max="10"`) + unit('devices')),
    row('Send alerts to','', pick('alertChannel',4,['Email','SMS','Email + SMS','In-app only'])),
    row('Alert administrators','Security events in the notification centre', tg('alertAdmin',4))
  ].join('');

  el('trustedBody').innerHTML = DEVICES.map((d,i)=>`<tr>
    <td style="font-weight:600">${d.d}</td><td>${d.u}</td>
    <td style="font-size:10.5px;color:var(--muted)">${d.seen}</td>
    <td style="text-align:right"><button class="btn btn-ghost btn-sm" data-dev="${i}"
      style="padding:2px 7px;font-size:10px">Revoke</button></td></tr>`).join('');
  el('trustedBody').querySelectorAll('[data-dev]').forEach(b=>{
    b.onclick = ()=>{
      const d = DEVICES.splice(Number(b.dataset.dev),1)[0];
      renderSec4(); toast(`Trusted device revoked · ${d.d}`,'info');
      logAudit('Permission','Trusted device revoked: '+d.d,'user.device');
    };
  });
  el('devCount').textContent = DEVICES.length + ' devices';
  renderPwTest();
}
function renderLogins(){
  const f = el('loginFilter').value;
  const rows = LOGINS.filter(r=>!f || r[7]===f);
  el('loginBody').innerHTML = rows.map(r=>{
    const chip = r[7]==='Success'?'st-ok':r[7]==='Failed'?'st-fail':'st-rev';
    return `<tr><td style="font-variant-numeric:tabular-nums">${r[0]}</td><td style="font-weight:600">${r[1]}</td>
      <td>${r[2]}</td><td style="font-variant-numeric:tabular-nums">${r[3]}</td><td>${r[4]}</td>
      <td>${r[5]}</td><td>${r[6]}</td><td><span class="chip ${chip}">${r[7]}</span></td></tr>`;
  }).join('') || '<tr><td colspan="8" class="empty">No attempts match.</td></tr>';
}

/* ===================== 5 · LOAN PRODUCTS ===================== */
const PRODUCTS = [
  {n:'Business Boost', c:'BB-01', min:100000, max:5000000, rate:4.5, m:'Reducing balance', f:'Monthly', terms:'6, 12, 18, 24', st:'Active', apps:184},
  {n:'Emergency Cash', c:'EC-02', min:20000, max:400000, rate:6, m:'Flat', f:'Monthly', terms:'1, 3, 6', st:'Active', apps:312},
  {n:'Agri Season Loan', c:'AG-04', min:150000, max:3000000, rate:3.8, m:'Simple daily', f:'Fortnightly', terms:'6, 9, 12', st:'Active', apps:96},
  {n:'Salary Advance', c:'SA-05', min:25000, max:600000, rate:5.2, m:'Flat', f:'Monthly', terms:'1, 2, 3', st:'Active', apps:241},
  {n:'Asset Finance', c:'AF-06', min:1000000, max:25000000, rate:2.9, m:'Declining balance', f:'Monthly', terms:'12, 24, 36, 48', st:'Paused', apps:18},
  {n:'Group Lending', c:'GL-07', min:50000, max:1500000, rate:4.1, m:'Reducing balance', f:'Weekly', terms:'12, 24', st:'Retired', apps:6}
];
const PROD_ST = {Active:'st-ok', Paused:'st-await', Retired:'st-canc'};
function renderProducts(){
  el('prodBody').innerHTML = PRODUCTS.map((p,i)=>`<tr>
    <td><div style="font-weight:700">${p.n}</div><div style="font-size:9.5px;color:var(--muted)">${p.c}</div></td>
    <td class="num">${mk(p.min)}</td><td class="num">${mk(p.max)}</td>
    <td class="num">${p.rate}%</td><td style="font-size:10.5px">${p.m}</td><td>${p.f}</td>
    <td><span class="chip ${PROD_ST[p.st]}">${p.st}</span></td>
    <td style="text-align:right"><button class="btn btn-ghost btn-sm" data-prod="${i}"
      style="padding:3px 7px;font-size:10px">Edit</button></td></tr>`).join('');
  el('prodCount').textContent = PRODUCTS.length + ' products';
  el('prodBody').querySelectorAll('[data-prod]').forEach(b=>{
    b.onclick = ()=>productModal(PRODUCTS[Number(b.dataset.prod)]);
  });

  el('prodDefaults').innerHTML = [
    row('Default interest rate','Per month, unless product overrides', num('defRate',5,`step="0.1"`) + unit('%')),
    row('Interest calculation method','', pick('defMethod',5,['Flat','Declining balance','Reducing balance','Simple daily'])),
    row('Processing fee','Deducted at disbursement', num('defFee',5,`step="0.1"`) + unit('%')),
    row('Late payment penalty','Of the overdue instalment', num('defPenalty',5,`step="0.1"`) + unit('%')),
    row('Grace period','Before a penalty applies', num('defGrace',5,`min="0"`) + unit('days')),
    row('Auto-cap for single approval','Above this, two approvers', tag(mk(CFG.prodAutoCap)))
  ].join('');

  el('prodElig').innerHTML = [
    row('Minimum age','', num('eligAge',5,`min="18" max="80"`) + unit('yrs')),
    row('Maximum age at maturity','', num('eligMaxAge',5,`min="30" max="80"`) + unit('yrs')),
    row('Minimum monthly income','', num('eligIncome',5,`step="10000"`) ),
    row('Maximum debt-to-income','', num('eligDti',5,`min="10" max="80"`) + unit('%')),
    row('Minimum account history','', num('eligMonths',5,`min="0"`) + unit('months')),
    row('National ID required','', tg('eligId',5)),
    row('Guarantor required','', tg('eligGuarantor',5)),
    row('Collateral required','', tg('eligCollateral',5))
  ].join('');

  el('prodApprRules').innerHTML = [
    row('Routing rule','Configured in section 6 · Approvals', tag(CFG.assignMode)),
    row('Auto-approve below','Straight-through processing', tag(mk(CFG.autoApproveBelow))),
    row('Second approver above','', tag(mk(CFG.secondApproverAbove))),
    row('Credit committee above','', tag(mk(CFG.committeeAbove)))
  ].join('');
  el('prodAutoCap').textContent = mk(CFG.prodAutoCap);
}
function productModal(p){
  const isNew = !p;
  p = p || {n:'',c:'',min:50000,max:5000000,rate:CFG.defRate,m:CFG.defMethod,f:'Monthly',terms:'6, 12',st:'Active',apps:0};
  openModal(isNew?'New loan product':'Edit '+p.n, isNew?'Applies to new applications only':p.c+' · '+p.apps+' applications',
    `<div class="form-grid">
      <div class="fg"><label>Product name</label><input id="mPn" value="${p.n}"></div>
      <div class="fg"><label>Product code</label><input id="mPc" value="${p.c}"></div>
      <div class="fg"><label>Minimum amount (MWK)</label><input id="mPmin" type="number" value="${p.min}"></div>
      <div class="fg"><label>Maximum amount (MWK)</label><input id="mPmax" type="number" value="${p.max}"></div>
      <div class="fg"><label>Interest rate (%)</label><input id="mPrate" type="number" step="0.1" value="${p.rate}"></div>
      <div class="fg"><label>Interest method</label><select id="mPm">
        ${['Flat','Declining balance','Reducing balance','Simple daily'].map(x=>`<option${x===p.m?' selected':''}>${x}</option>`).join('')}
      </select></div>
      <div class="fg"><label>Repayment frequency</label><select id="mPf">
        ${['Monthly','Fortnightly','Weekly','Daily'].map(x=>`<option${x===p.f?' selected':''}>${x}</option>`).join('')}
      </select></div>
      <div class="fg"><label>Term options</label><input id="mPt" value="${p.terms}"></div>
      <div class="fg"><label>Status</label><select id="mPs">
        ${['Active','Paused','Retired'].map(x=>`<option${x===p.st?' selected':''}>${x}</option>`).join('')}
      </select></div>
    </div>
    <div class="note" style="margin-top:11px"><div>Changing the interest method or amount range does not
      alter existing loans — only applications submitted after saving.</div></div>`,
    [ isNew ? {label:'Cancel', act:'close'} : {label:'Deactivate', cls:'btn-red', act:()=>{
        p.st = 'Retired'; closeModal(); renderProducts(); toast(`${p.n} retired.`,'info');
        logAudit('Config','Loan product retired','product.'+p.c);
      }},
      {label:'Save product', cls:'btn-gold', act:()=>{
        p.n=el('mPn').value; p.c=el('mPc').value; p.min=+el('mPmin').value; p.max=+el('mPmax').value;
        p.rate=+el('mPrate').value; p.m=el('mPm').value; p.f=el('mPf').value; p.terms=el('mPt').value;
        p.st=el('mPs').value;
        if(isNew) PRODUCTS.unshift(p);
        closeModal(); renderProducts();
        toast(`Loan product “${p.n}” ${isNew?'created':'updated'}.`);
        logAudit('Config',(isNew?'Created':'Updated')+' loan product '+p.n,'product.'+p.c);
      }}
    ]);
}
function createProduct(){
  const n = el('npName').value.trim();
  if(!n){ toast('A product name is required.','err'); return; }
  PRODUCTS.unshift({n, c:el('npCode').value||'NEW', min:+el('npMin').value, max:+el('npMax').value,
    rate:+el('npRate').value, m:el('npMethod').value, f:el('npFreq').value,
    terms:el('npTerms').value, st:'Active', apps:0});
  el('npName').value=''; el('npCode').value='';
  renderProducts(); toast(`Loan product “${n}” created.`);
  logAudit('Config','Created loan product '+n,'product.new');
}

/* ===================== 6 · APPROVAL WORKFLOW ===================== */
const LEVELS = [
  {lvl:1, role:'Loan Officer', from:0, to:150000, sla:4, self:false},
  {lvl:2, role:'Branch Supervisor', from:150001, to:2000000, sla:12, self:false},
  {lvl:3, role:'Credit Analyst', from:2000001, to:5000000, sla:24, self:false},
  {lvl:4, role:'Credit committee', from:5000001, to:0, sla:72, self:false}
];
const STAGES = [
  ['stgKyc','KYC verification','Confirm identity and national ID',true],
  ['stgCredit','Credit assessment','Score, affordability and repayment capacity',true],
  ['stgGuarantor','Guarantor confirmation','Guarantor consents and is verified',true],
  ['stgCollateral','Collateral valuation','Required for secured products',false],
  ['stgVisit','Field visit','Physical verification for first-time customers',false],
  ['stgCommittee','Committee review','Mandatory above the committee threshold',true]
];
function renderSec6(){
  el('lvlBody').innerHTML = LEVELS.map((l,i)=>`<tr>
    <td><b>Level ${l.lvl}</b></td><td>${l.role}</td>
    <td class="num">${l.from?mk(l.from):'—'}</td>
    <td class="num">${l.to?mk(l.to):'Unlimited'}</td>
    <td>${l.sla}h</td>
    <td><span class="chip ${l.self?'st-await':'st-ok'}">${l.self?'Allowed':'Blocked'}</span></td>
    <td style="text-align:right"><button class="btn btn-ghost btn-sm" data-lvl="${i}"
      style="padding:3px 7px;font-size:10px">Edit</button></td></tr>`).join('');
  el('lvlBody').querySelectorAll('[data-lvl]').forEach(b=>{
    b.onclick = ()=>{ levelModal(LEVELS[Number(b.dataset.lvl)]); };
  });

  el('apprThresholds').innerHTML = [
    row('Auto-approve below','Straight-through, no reviewer', num('autoApproveBelow',6,`step="50000"`)),
    row('Second approver required above','Dual authorization', num('secondApproverAbove',6,`step="50000"`)),
    row('Credit committee above','Escalates to the committee', num('committeeAbove',6,`step="50000"`))
  ].join('');

  el('stages').innerHTML = STAGES.map(([k,label,sub,on])=>{
    if(CFG[k] === undefined) CFG[k] = on;
    return `<div class="check"><span class="ck ${CFG[k]?'y':'n'}" data-stgstate="${k}">${CFG[k]?'✓':'—'}</span>
      <div style="flex:1"><b>${label}</b><span class="s">${sub}</span></div>
      <button class="toggle${CFG[k]?' on':''}" data-k="${k}" data-s="6" aria-checked="${CFG[k]?1:0}"></button></div>`;
  }).join('');

  el('autoRules').innerHTML = [
    row('Never auto-approve above','Hard ceiling regardless of product', num('prodAutoCap',6,`step="50000"`)),
    row('Block customers in arrears','Any loan in arrears on the same customer', tg('blockArrears',6)),
    row('Block first-time customers','Require a completed first cycle', tg('blockFirstTime',6)),
    row('Require a reason on rejection','', tg('requireRejectReason',6))
  ].join('');

  el('assignRules').innerHTML = [
    row('Assignment method','', pick('assignMode',6,['Branch workload','Round robin','Officer of record','Manual assignment'])),
    row('Maximum open applications','Per officer', num('workloadCap',6,`min="1" max="100"`) + unit('apps')),
    row('Spread evenly across officers','', tg('assignRound',6)),
    row('Notify the assigned officer','', tg('assignNotify',6))
  ].join('');

  el('escRules').innerHTML = [
    row('Escalate after','Stalled in a review queue', num('escalateHours',6,`min="1" max="168"`) + unit('hours')),
    row('Escalate to','', pick('escalateTo',6,['Branch Supervisor','Credit Analyst','Credit committee'])),
    row('Notify the applicant','Tell the customer about the delay', tg('escalateNotify',6)),
    row('Escalate twice','Second escalation to the committee', tg('escalateTwice',6)),
    row('Extra authorization above','Requires a second signature', tag(mk(CFG.secondApproverAbove)))
  ].join('');

  el('sodRules').innerHTML = [
    row('Approver cannot disburse','Separate approval from payout', tg('sodApproveDisburse',6)),
    row('Initiator cannot approve','The officer who captured the application', tg('sodInitiateApprove',6)),
    row('Dual authorization over limit','', tg('sodDualAbove',6)),
    row('Cashier cannot approve waivers','', tg('sodCashierSep',6))
  ].join('');

  el('apprNotif').innerHTML = [
    row('On approval','SMS + email to customer', tg('apprNotifApprove',6)),
    row('On rejection','Include the reason', tg('apprNotifReject',6)),
    row('On escalation','Notify the next approver', tg('apprNotifEscalate',6)),
    row('SMS to approvers','Also send an SMS', tg('apprNotifSms',6))
  ].join('');
}
function levelModal(l){
  openModal('Approval level ' + l.lvl, l.role + ' · ' + l.sla + ' hour SLA', `
    <div class="form-grid">
      <div class="fg"><label>Approver role</label><select id="mLvlRole">
        ${['Loan Officer','Branch Supervisor','Credit Analyst','Credit committee','Administrator']
          .map(x=>`<option${x===l.role?' selected':''}>${x}</option>`).join('')}</select></div>
      <div class="fg"><label>From amount (MWK)</label><input id="mLvlFrom" type="number" value="${l.from}"></div>
      <div class="fg"><label>Up to amount (MWK, 0 = unlimited)</label><input id="mLvlTo" type="number" value="${l.to}"></div>
      <div class="fg"><label>Review SLA (hours)</label><input id="mLvlSla" type="number" value="${l.sla}"></div>
      <div class="fg"><label>Allow self-approval</label><select id="mLvlSelf">
        <option value="0"${!l.self?' selected':''}>Blocked</option>
        <option value="1"${l.self?' selected':''}>Allowed</option></select></div>
    </div>
    <div class="note gold" style="margin-top:11px"><div>Levels must not overlap — an application routes to the
      lowest level whose maximum covers the requested amount.</div></div>`,
    [{label:'Cancel', act:'close'}, {label:'Save level', cls:'btn-gold', act:()=>{
      l.role=el('mLvlRole').value; l.from=+el('mLvlFrom').value; l.to=+el('mLvlTo').value;
      l.sla=+el('mLvlSla').value; l.self=el('mLvlSelf').value==='1';
      closeModal(); renderSec6();
      toast(`Level ${l.lvl} updated · ${l.role}.`);
      logAudit('Config','Approval level '+l.lvl+' updated','workflow.level_'+l.lvl);
    }}]);
}

/* ===================== 7 · REPAYMENTS ===================== */
let PRIO = [
  {k:'penalty', n:'Penalty & late fees', s:'Charged first on arrears'},
  {k:'fees', n:'Fees', s:'Processing and service fees'},
  {k:'interest', n:'Interest', s:'Accrued interest for the period'},
  {k:'principal', n:'Principal', s:'Reduces the outstanding balance'}
];
const LEDGER = [
  ['Disbursement','Loans receivable','Customer wallet / bank','On disbursement', 12480000],
  ['Repayment — principal','Cash / bank','Loans receivable','On receipt', 6120000],
  ['Repayment — interest','Cash / bank','Interest income','On receipt', 1480000],
  ['Processing fee','Cash / bank','Fee income','On disbursement', 374000],
  ['Late penalty','Receivables','Penalty income','On charge', 96000],
  ['Write-off','Bad debt expense','Loans receivable','On approval', 210000],
  ['Restructure adjustment','Loans receivable','Deferred income','On restructure', 0]
];
function renderSec7(){
  el('prio').innerHTML = PRIO.map((p,i)=>`<div class="pitem">
    <span class="pnum">${i+1}</span><b>${p.n}</b><span class="psub">${p.s}</span>
    <span class="parws">
      <button class="parw" data-up="${i}" ${i===0?'disabled':''} title="Move up">▲</button>
      <button class="parw" data-down="${i}" ${i===PRIO.length-1?'disabled':''} title="Move down">▼</button>
    </span></div>`).join('');
  el('prio').querySelectorAll('[data-up]').forEach(b=>b.onclick=()=>movePrio(Number(b.dataset.up),-1));
  el('prio').querySelectorAll('[data-down]').forEach(b=>b.onclick=()=>movePrio(Number(b.dataset.down),1));

  el('repRules').innerHTML = [
    row('Default repayment frequency','', pick('repFreq',7,['Monthly','Fortnightly','Weekly','Daily'])),
    row('Allow partial payments','Accept less than the instalment', tg('partialAllow',7)),
    row('Minimum partial payment','Of the amount due', num('partialMin',7,`min="1" max="100"`) + unit('%')),
    row('Hold partials for review','Do not post until approved', tg('partialHold',7)),
    row('Allow advance payments','Pay ahead of schedule', tg('advanceAllow',7)),
    row('Apply advances to','', pick('advanceTo',7,['Future instalments','Principal only','Oldest arrears first'])),
    row('Maximum advance instalments','', num('advanceMax',7,`min="1" max="24"`) + unit('instalments')),
    row('Allow early settlement','Pay off before maturity', tg('earlyAllow',7)),
    row('Early settlement discount','Of remaining interest', num('earlyDiscount',7,`step="0.1"`) + unit('%')),
    row('Early settlement notice','', num('earlyNotice',7,`min="0"`) + unit('days')),
    row('Early settlement fee','', num('earlyFee',7,`step="1000"`))
  ].join('');

  el('penRules').innerHTML = [
    row('Penalty type','', pick('penType',7,['% of instalment','Flat amount','% of overdue balance','Daily rate'])),
    row('Penalty value','', num('penValue',7,`step="0.1"`)),
    row('Grace days before penalty','', num('penApplyGrace',7,`min="0"`) + unit('days')),
    row('Maximum penalty cap','Of the instalment', num('penCap',7,`min="0" max="100"`) + unit('%')),
    row('Compound penalties','Charge penalty on penalty', tg('penCompound',7))
  ].join('');

  el('resRules').innerHTML = [
    row('Maximum reschedules','Per loan', num('reschedMax',7,`min="0" max="12"`) + unit('times')),
    row('Rescheduling fee','', num('reschedFee',7,`step="1000"`)),
    row('Requires approval','Branch supervisor or above', tg('reschedApprove',7))
  ].join('');

  el('restRules').innerHTML = [
    row('Maximum restructures','Per loan lifetime', num('restructMax',7,`min="0" max="5"`) + unit('times')),
    row('Maximum new term','Months', num('restructTerm',7,`min="1" max="60"`) + unit('months')),
    row('Approval required from','', pick('restructApprove',7,['Branch Supervisor','Credit Analyst','Credit committee','Administrator']))
  ].join('');

  el('roundRules').innerHTML = [
    row('Decimal places','Amounts stored and displayed', num('rounding',7,`min="0" max="4"`)),
    row('Rounding mode','', pick('roundMode',7,['Half up','Half even','Down','Up'])),
    row('Minimum payable unit','Smallest accepted amount', num('minUnit',7,`min="1"`)),
    row('Reference format','Tokens: {YYYY} {MM} {SEQ}', txt('refFormat',7)),
    row('Sequence padding','Digits', num('refSeq',7,`min="1" max="9999999"`))
  ].join('');
  el('refPreview').innerHTML = buildRef() + '<span>live preview</span>';

  el('ledgerBody').innerHTML = LEDGER.map(l=>`<tr>
    <td style="font-weight:700">${l[0]}</td><td>${l[1]}</td><td>${l[2]}</td>
    <td style="font-size:10.5px;color:var(--muted)">${l[3]}</td>
    <td class="num">${l[4]?mk(l[4]):'—'}</td></tr>`).join('');
}
function buildRef(){
  return (CFG.refFormat||'TXN-{YYYY}-{SEQ}')
    .replace('{YYYY}', CFG.refYear)
    .replace('{YY}', String(CFG.refYear).slice(2))
    .replace('{MM}', '10')
    .replace(/\{SEQ(?::(\d+))?\}/, (_, pad) => String(CFG.refSeq).padStart(pad ? Number(pad) : 4, '0'));
}
function movePrio(i, dir){
  const j = i + dir;
  if(j < 0 || j >= PRIO.length) return;
  const t = PRIO[i]; PRIO[i] = PRIO[j]; PRIO[j] = t;
  renderSec7(); renderSim();
  const sec='7'; MARK[sec]=MARK[sec]||new Set(); MARK[sec].add('prio:'+i);
  paintState(sec); updateBand();
}
function renderSim(){
  const pay = Number(el('simIn').value) || 0;
  const pen = Number(el('simPen').value) || 0;
  const due = {penalty:pen, fees:4000, interest:18000, principal:95000};
  let left = pay, out = {};
  PRIO.forEach(p=>{ const take = Math.min(left, due[p.k]); out[p.k] = take; left -= take; });
  el('simOut').innerHTML = PRIO.map(p=>`<div class="sim"><span>${p.n}</span>
    <b>${mk(out[p.k]||0)}</b></div>`).join('') +
    `<div class="sim"><span>Unapplied</span><b style="color:${left>0?'#B32C2C':'#157A50'}">${mk(left)}</b></div>`;
}

/* ===================== 8 · PAYMENT METHODS ===================== */
const METHODS = [
  {k:'cashOn', n:'Cash', ic:'MK', d:'Counter payments', fee:0, extra:'cashLimit', on:true, st:'Active'},
  {k:'bankOn', n:'Bank Transfer', ic:'BK', d:'NBM · Standard · FDH', fee:0, extra:'bankAcct', on:true, st:'Active'},
  {k:'airtelOn', n:'Airtel Money', ic:'AM', d:'Mobile money', fee:1.5, extra:'airtelCode', on:true, st:'Active'},
  {k:'mpambaOn', n:'TNM Mpamba', ic:'MP', d:'Mobile money', fee:1.5, extra:'mpambaCode', on:true, st:'Active'}
];
function renderMethods(){
  el('methods').innerHTML = METHODS.map((m,i)=>{
    const on = CFG[m.k];
    return `<div class="method">
      <div class="method-top">
        <div class="mi" style="background:${on?'var(--gold-soft)':'#F1F2F6'};color:${on?'var(--gold-dark)':'#8A90A0'}">${m.ic}</div>
        <div><b>${m.n}</b><div class="ms">${m.d}</div></div>
        <button class="toggle${on?' on':''}" data-k="${m.k}" data-s="8" aria-checked="${on?1:0}"></button>
      </div>
      <div class="mv"><span style="color:var(--muted)">Fee</span><b>${m.fee}%</b></div>
      <div class="mv"><span style="color:var(--muted)">Status</span>
        <b style="color:${on?'#157A50':'#B32C2C'}">${on?'Enabled':'Disabled'}</b></div>
      <div style="margin-top:8px"><button class="btn btn-ghost btn-sm" data-method="${i}"
        style="width:100%;justify-content:center;font-size:10.5px">Configure</button></div>
    </div>`;
  }).join('');
  el('methods').querySelectorAll('[data-method]').forEach(b=>{
    b.onclick = ()=>methodModal(METHODS[Number(b.dataset.method)]);
  });
  el('methodCount').textContent = METHODS.filter(m=>CFG[m.k]).length + ' enabled';

  el('payRef').innerHTML = [
    row('Payment reference required','Reject a payment without one', tg('refRequired',8)),
    row('Reference prefix','', txt('refPrefixPay',8)),
    row('Reference length','Characters after the prefix', num('refLength',8,`min="4" max="20"`)),
    row('Require proof of payment','Upload a receipt or screenshot', tg('refProof',8)),
    row('Duplicate detection window','Ignore the same reference within', num('refDupWindow',8,`min="1" max="72"`) + unit('hours'))
  ].join('');
  el('payRefPreview').innerHTML = `${CFG.refPrefixPay}-${String(481).padStart(CFG.refLength,'0').slice(-CFG.refLength)}<span>reference preview</span>`;

  el('payChan').innerHTML = [
    row('Cash disbursement','Over the counter', tg('chanCash',8)),
    row('Bank transfer','Direct to the customer account', tg('chanBank',8)),
    row('Airtel Money','Mobile wallet payout', tg('chanAirtel',8)),
    row('TNM Mpamba','Mobile wallet payout', tg('chanMpamba',8)),
    row('Default disbursement method','', pick('chanDefault',8,['Bank transfer','Airtel Money','TNM Mpamba','Cash']))
  ].join('');

  el('payLimits').innerHTML = [
    row('Minimum transaction','', num('limitMin',8,`step="500"`)),
    row('Maximum per transaction','', num('limitMax',8,`step="50000"`)),
    row('Daily limit per customer','', num('limitDaily',8,`step="50000"`)),
    row('Monthly limit per customer','', num('limitMonthly',8,`step="500000"`))
  ].join('');

  el('payConfirm').innerHTML = [
    row('Approval before disbursement','Second sign-off on every payout', tg('confirmApprove',8)),
    row('Receipt upload required','Cash and mobile money', tg('confirmReceipt',8)),
    row('SMS confirmation to customer','On successful posting', tg('confirmSms',8)),
    row('Gateway confirmation timeout','Mark as pending after', num('confirmTimeout',8,`min="1" max="168"`) + unit('hours'))
  ].join('');

  el('payFail').innerHTML = [
    row('Retry attempts','Before marking as failed', num('failRetry',8,`min="0" max="10"`)),
    row('Retry interval','', num('failInterval',8,`min="1" max="120"`) + unit('min')),
    row('Auto-reverse failed deductions','Return funds to the wallet', tg('failReverse',8)),
    row('Notify the customer','', tg('failNotify',8))
  ].join('');

  el('payRec').innerHTML = [
    row('Reconciliation schedule','', pick('recSchedule',8,['Daily · 06:00','Daily · 18:00','Twice daily','Weekly'])),
    row('Auto-match tolerance','Difference accepted without review', num('recTolerance',8,`step="10"`)),
    row('Unmatched transactions','', pick('recUnmatched',8,['Hold for review','Post to suspense','Reject'])),
    row('Auto-post matched transactions','', tg('recAutoPost',8))
  ].join('');
}
function methodModal(m){
  const on = CFG[m.k];
  const fields = {
    cashOn:`<div class="fg"><label>Maximum cash payment (MWK)</label><input id="mMx" type="number" value="${CFG.cashLimit}"></div>
      <div class="fg"><label>Cash receipt required</label><select id="mRc"><option>Yes</option><option>No</option></select></div>`,
    bankOn:`<div class="fg"><label>Settlement account</label><input id="mAc" value="${CFG.bankAcct}"></div>
      <div class="fg"><label>Settlement days (T+1)</label><input id="mSt" type="number" value="1"></div>`,
    airtelOn:`<div class="fg"><label>Merchant code</label><input id="mCd" value="${CFG.airtelCode}"></div>
      <div class="fg"><label>Transaction fee (%)</label><input id="mFe" type="number" step="0.1" value="${CFG.airtelFee}"></div>`,
    mpambaOn:`<div class="fg"><label>Merchant code</label><input id="mCd" value="${CFG.mpambaCode}"></div>
      <div class="fg"><label>Transaction fee (%)</label><input id="mFe" type="number" step="0.1" value="${CFG.mpambaFee}"></div>`
  };
  openModal('Configure ' + m.n, (on ? 'Enabled' : 'Disabled') + ' · ' + m.d, `
    <div class="mmbanner ${on?'':'on'}" style="margin-bottom:12px">
      <span class="dot ${on?'ok':'bad'}"></span>
      <div>${on?'This method is available on repayments and disbursements.':'This method is disabled and hidden from staff.'}</div>
    </div>
    <div class="form-grid" id="mFields">${fields[m.k]}</div>
    <div class="note" style="margin-top:11px"><div>Changing a merchant code affects new transactions only —
      already-posted payments keep their original reference.</div></div>`,
    [{label:'Cancel', act:'close'},
     {label:on?'Disable method':'Enable method', cls:on?'btn-red':'btn-green', act:()=>{
        apply(m.k, !on, 8); renderMethods(); closeModal();
        toast(`${m.n} ${on?'disabled':'enabled'}.`, on?'info':'ok');
        logAudit('Config', `${m.n} ${on?'disabled':'enabled'}`, 'payment.'+m.k);
     }},
     {label:'Save', cls:'btn-gold', act:()=>{
        if(el('mCd')) CFG[m.k==='airtelOn'?'airtelCode':'mpambaCode'] = el('mCd').value;
        if(el('mFe')) CFG[m.k==='airtelOn'?'airtelFee':'mpambaFee'] = +el('mFe').value;
        if(el('mMx')) CFG.cashLimit = +el('mMx').value;
        if(el('mAc')) CFG.bankAcct = el('mAc').value;
        closeModal(); renderMethods(); toast(`${m.n} settings saved.`);
        logAudit('Config','Payment method settings updated: '+m.n,'payment.'+m.k);
     }}]);
}

/* ===================== 9 · NOTIFICATIONS ===================== */
const TEMPLATES = [
  {n:'Application received', t:'Loan application', c:'SMS + Email', st:'Active', up:'24 Oct 2026'},
  {n:'Application approved', t:'Loan approval', c:'SMS + Email', st:'Active', up:'24 Oct 2026'},
  {n:'Application declined', t:'Loan rejection', c:'SMS + Email', st:'Active', up:'12 Sep 2026'},
  {n:'Funds disbursed', t:'Disbursement', c:'SMS', st:'Active', up:'24 Oct 2026'},
  {n:'Repayment reminder', t:'Reminder', c:'SMS', st:'Active', up:'02 Oct 2026'},
  {n:'Overdue payment alert', t:'Arrears', c:'SMS + Email', st:'Active', up:'02 Oct 2026'},
  {n:'Payment received', t:'Receipt', c:'SMS', st:'Active', up:'28 Oct 2026'},
  {n:'Password reset', t:'Staff security', c:'Email', st:'Active', up:'18 Aug 2026'},
  {n:'Staff activity digest', t:'Internal', c:'Email', st:'Paused', up:'18 Aug 2026'},
  {n:'Statement ready', t:'Statement', c:'Email', st:'Active', up:'28 Oct 2026'}
];
const DELIVERY = [
  ['14:28','+265 999 481 220','Repayment reminder','SMS','Delivered'],
  ['14:12','chisomo.k@gmail.com','Statement ready','Email','Delivered'],
  ['13:54','+265 888 220 481','Payment received','SMS','Delivered'],
  ['13:20','t.kamanga@goldenfinancial.mw','Application approved','Email','Delivered'],
  ['12:48','+265 991 004 812','Overdue payment alert','SMS','Failed'],
  ['11:32','+265 999 610 774','Funds disbursed','SMS','Delivered'],
  ['10:15','+265 881 442 019','Repayment reminder','SMS','Delivered'],
  ['09:40','grace@goldenfinancial.mw','Password reset','Email','Delivered'],
  ['08:55','+265 995 118 200','Application received','SMS','Delivered'],
  ['08:12','+265 888 770 040','Repayment reminder','SMS','Queued']
];
function renderSec9(){
  el('emailCfg').innerHTML = [
    row('SMTP host','', txt('emailHost',9)),
    row('Port','', num('emailPort',9,`min="1" max="65535"`)),
    row('Encryption','', pick('emailEncrypt',9,['STARTTLS','SSL/TLS','None'])),
    row('Username','', txt('emailUser',9)),
    row('From name','', txt('emailFrom',9)),
    row('Reply-to address','', txt('emailReply',9))
  ].join('');
  el('smsCfg').innerHTML = [
    row('Provider','', pick('smsProvider',9,['Airtel Malawi + TNM Mpamba','Airtel Malawi only','TNM Mpamba only'])),
    row('Sender ID','Maximum 11 characters', txt('smsSender',9)),
    row('Delivery reports','', tg('smsDlr',9)),
    row('Fallback to email','If SMS fails twice', tg('smsFallback',9))
  ].join('');

  el('tplBody').innerHTML = TEMPLATES.map((t,i)=>`<tr>
    <td style="font-weight:700">${t.n}</td><td>${t.t}</td><td>${t.c}</td>
    <td><span class="chip ${t.st==='Active'?'st-ok':'st-canc'}">${t.st}</span></td>
    <td style="font-size:10.5px;color:var(--muted)">${t.up}</td>
    <td style="text-align:right"><button class="btn btn-ghost btn-sm" data-tpl="${i}"
      style="padding:3px 7px;font-size:10px">Edit</button></td></tr>`).join('');
  el('tplBody').querySelectorAll('[data-tpl]').forEach(b=>b.onclick=()=>tplModal(TEMPLATES[Number(b.dataset.tpl)]));
  el('tplCount').textContent = TEMPLATES.length + ' templates';

  const EVENTS = [
    ['notifApply','Loan application received','Application confirmation'],
    ['notifApprove','Loan approved','Decision and next steps'],
    ['notifReject','Loan declined','Includes the reason'],
    ['notifDisburse','Funds disbursed','Disbursement receipt'],
    ['notifReminder','Repayment reminder','Before the due date'],
    ['notifOverdue','Overdue payment alert','After the due date'],
    ['notifPwdReset','Password reset','Staff and customers'],
    ['notifStaff','Staff activity','Approvals, waivers, changes']
  ];
  el('notifEvents').innerHTML = EVENTS.map(([k,n,s])=>`
    <div class="setrow"><div><div class="sk">${n}</div><div class="ss">${s}</div></div>
      <div class="sv">${tg(k,9)}</div></div>`).join('');
  renderNotifCounts();

  el('remRules').innerHTML = [
    row('First reminder before due date','', num('remDaysBefore',9,`min="0" max="30"`) + unit('days')),
    row('Send time','Local time', pick('remSendTime',9,['07:00','08:00','09:00','12:00','17:00'])),
    row('Repeat after due date','', pick('remRepeat',9,['Once only','Every 3 days after due','Every 7 days after due','Daily until paid'])),
    row('First overdue alert','After the due date', num('remOverdueDays',9,`min="1" max="30"`) + unit('days')),
    row('Send on weekends and holidays','', tg('remWeekend',9)),
    row('Message language','', pick('remLang',9,['English','Chichewa','English + Chichewa'])),
    row('Quiet hours 21:00–07:00','Hold messages overnight', tg('remQuiet',9))
  ].join('');
  renderDelivery();
}
function renderNotifCounts(){
  const n = ['notifApply','notifApprove','notifReject','notifDisburse','notifReminder','notifOverdue','notifPwdReset','notifStaff']
    .filter(k=>CFG[k]).length;
  const sub = el('notifEventsCount');
  if(sub) sub.textContent = n + ' of 8 events enabled';
}
function renderDelivery(){
  const f = el('logFilter').value;
  const rows = DELIVERY.filter(r=>!f || r[3]===f);
  el('logBody').innerHTML = rows.map(r=>{
    const chip = r[4]==='Delivered'?'st-ok':r[4]==='Failed'?'st-fail':'st-await';
    return `<tr><td style="font-variant-numeric:tabular-nums">${r[0]}</td><td>${r[1]}</td>
      <td>${r[2]}</td><td>${r[3]}</td><td><span class="chip ${chip}">${r[4]}</span></td></tr>`;
  }).join('') || '<tr><td colspan="5" class="empty">No messages match.</td></tr>';
}
function tplModal(t){
  openModal('Edit template', t.n + ' · ' + t.c, `
    <div class="form-grid">
      <div class="fg" style="grid-column:1/-1"><label>Template name</label><input id="tName" value="${t.n}"></div>
      <div class="fg"><label>Channel</label><select id="tChan">
        ${['SMS','Email','SMS + Email'].map(x=>`<option${x===t.c?' selected':''}>${x}</option>`).join('')}</select></div>
      <div class="fg"><label>Status</label><select id="tStat">
        ${['Active','Paused'].map(x=>`<option${x===t.st?' selected':''}>${x}</option>`).join('')}</select></div>
      <div class="fg" style="grid-column:1/-1"><label>Message body</label>
        <textarea id="tBody" style="min-height:88px">Hi {first_name}, your Golden Financial loan {loan_no} has an instalment of {amount} due on {due_date}. Pay via Airtel Money {merchant_code}.</textarea>
        <div class="hint">Tokens: {first_name} {loan_no} {amount} {due_date} {merchant_code}</div></div>
    </div>
    <div class="preview" style="margin-top:11px">
      <div class="pbody"><div class="psub">Preview</div>
        Hi Chisomo, your Golden Financial loan LN-2026-0481 has an instalment of MK 48,250.00 due on
        05 Nov 2026. Pay via Airtel Money GF-AIRTEL-0418.</div>
      <div class="pfoot"><span>SMS · 1 segment</span><span>160 characters</span></div>
    </div>`,
    [{label:'Cancel', act:'close'},
     {label:'Send test', cls:'btn-ghost', act:()=>{ closeModal(); toast('Test message sent to +265 999 770 200.'); }},
     {label:'Save template', cls:'btn-gold', act:()=>{
        t.n=el('tName').value; t.c=el('tChan').value; t.st=el('tStat').value; t.up=TODAY;
        closeModal(); renderSec9(); toast(`Template “${t.n}” saved.`);
        logAudit('Config','Notification template updated: '+t.n,'template.'+t.n);
     }}]);
}
