
/* ============================================================
   SECTION 1 · OVERVIEW
   ============================================================ */
function renderOverview(){
  const success = state.disb.filter(d=>d.status==='Successful');
  const todayS = success.filter(d=>d.date===today);
  const monthS = success.filter(d=>d.date.startsWith('2026-10'));
  const awaiting = state.loans.filter(l=>!l.prepared).length;
  const pendingAuth = state.disb.filter(d=>d.status==='Awaiting authorization').length;
  const inProgress = state.disb.filter(d=>['Processing','Awaiting confirmation'].includes(d.status)).length;
  const failed = state.disb.filter(d=>['Failed','Reversed'].includes(d.status)).length;
  const cancelled = state.disb.filter(d=>d.status==='Cancelled').length;

  const tiles = [
    ['Total Amount Disbursed Ever', mk(482600000), 'Since inception · 2,915 releases', 'wallet', '',
      `<span class="trend up">▲ 8.4%</span> vs last month`],
    ['Disbursements Today', mk(todayS.reduce((s,d)=>s+d.amount,0)), `${todayS.length} successful releases`, 'down', 'g',
      `<span class="trend up">▲ 12.6%</span> vs yesterday`],
    ['This Month', mkm(monthS.reduce((s,d)=>s+d.amount,0)), `${monthS.length} releases in October`, 'chart', 'b',
      `<span class="trend up">91%</span> of monthly target`],
    ['Loans Awaiting Disbursement', String(awaiting), 'Approved and not yet prepared', 'doc', 'a',
      `<span class="badge b-pend">queue</span>`],
    ['Pending Disbursement Approvals', String(pendingAuth), 'Awaiting second-line authorization', 'check', 'p',
      `<span class="badge b-act">control</span>`],
    ['Disbursements in Progress', String(inProgress), 'Released, not yet confirmed', 'card', 'b',
      `<span class="badge b-act">processing</span>`],
    ['Successful Disbursements', String(success.length), 'Confirmed and activated', 'check', 'g',
      `<span class="badge b-appr">${Math.round(success.length/state.disb.length*100)}% of records</span>`],
    ['Failed Disbursements', String(failed), 'Includes reversed transactions', 'alert', 'r',
      `<span class="badge b-rev">exceptions</span>`],
    ['Cancelled Disbursements', String(cancelled), 'Withdrawn before release', 'doc', '',
      `<span class="badge b-gray">closed</span>`]
  ];
  el('ovTiles').innerHTML = tiles.map(([label,value,foot,icon,tone,extra])=>`
    <div class="card stat">
      <div class="stat-top"><div class="stat-label">${label}</div>
        <div class="stat-ic ${tone}">${ICONS[icon]}</div></div>
      <div class="stat-val">${value}</div>
      <div class="stat-foot">${extra}</div>
      <div class="tiny muted" style="margin-top:4px">${foot}</div>
    </div>`).join('');

  el('bandTotal').textContent = mk(todayS.reduce((s,d)=>s+d.amount,0));
  el('bandAwait').textContent = awaiting;
  el('bandAuth').textContent = pendingAuth;
  el('bandFail').textContent = failed;

  const acts = [...state.disb].sort((a,b)=>b.ref.localeCompare(a.ref)).slice(0,7).map(d=>{
    const verb = {'Draft':'Draft prepared','Awaiting authorization':'Submitted for authorization','Authorized':'Authorized for release',
      'Processing':'Release recorded — processing','Awaiting confirmation':'Awaiting customer confirmation','Successful':'Disbursed and confirmed',
      'Failed':'Release failed','Rejected':'Rejected by authorizer','Cancelled':'Cancelled','Reversed':'Reversed by bank'}[d.status] || d.status;
    return `<tr>
      <td class="muted tiny" style="white-space:nowrap">${d.date.slice(8)} Oct</td>
      <td class="tiny" style="font-weight:700">${d.ref}</td>
      <td>${verb}</td>
      <td class="muted">${d.preparedBy}</td>
      <td class="num">${mk(d.amount)}</td>
      <td>${chip(d.status)}</td></tr>`;
  }).join('');
  el('ovActivity').innerHTML = acts;
}

const ICONS = {
  wallet:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2"/><rect x="3" y="8" width="18" height="11" rx="2.5"/><circle cx="17" cy="13.5" r="1.2"/></svg>',
  down:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v13M7 11l5 5 5-5M4 20h16"/></svg>',
  chart:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
  doc:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 3v5h5"/><path d="M19 8v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5Z"/></svg>',
  check:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="m3 13 5 5L21 5"/></svg>',
  alert:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3 2.5 20h19L12 3Z"/><path d="M12 9v5M12 17.5h.01"/></svg>',
  card:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2.5" y="6" width="19" height="13" rx="2.5"/><circle cx="12" cy="12.5" r="2.4"/></svg>'
};

/* ============================================================
   SECTION 2 · APPROVED LOANS
   ============================================================ */
const missingDocs = l => Object.entries(l.docs).filter(([,v])=>!v).map(([k])=>({
  agreement:'Signed loan agreement', id:'Customer ID', payslip:'Proof of income', guarantor:'Guarantor confirmation'
}[k]));

function renderApproved(){
  const q = (el('apprSearch').value||'').toLowerCase();
  const elig = el('apprElig').value;
  const prod = el('apprProduct').value;
  let rows = state.loans.filter(l=>!l.prepared);
  if(q) rows = rows.filter(l=>(l.cust+l.acct+l.app).toLowerCase().includes(q));
  if(prod) rows = rows.filter(l=>l.product===prod);
  if(elig==='ready') rows = rows.filter(l=>missingDocs(l).length===0);
  if(elig==='missing') rows = rows.filter(l=>missingDocs(l).length>0);

  el('apprCount').textContent = rows.length + (rows.length===1?' loan':' loans');
  el('apprBody').innerHTML = rows.length ? rows.map(l=>{
    const f = calcFees(l.approved);
    const miss = missingDocs(l);
    const ok = miss.length===0;
    return `<tr>
      <td><div style="font-weight:700;font-size:11.5px">${l.app}</div>
        <div class="tiny muted">${l.approvedOn} · ${l.officer}</div></td>
      <td><div class="who"><div class="av">${initials(l.cust)}</div><div>
        <div class="nm">${l.cust}</div><div class="id">${l.acct} · ${l.product}</div></div></div></td>
      <td class="num">${mk(l.approved)}</td>
      <td class="tiny" style="white-space:nowrap">${l.rate}</td>
      <td class="tiny" style="white-space:nowrap">${l.term}</td>
      <td class="num">${mk(f.total)}</td>
      <td class="num" style="color:#157A50">${mk(f.net)}</td>
      <td>${ok?'<span class="chip st-ok">Ready</span>'
        :`<span class="chip st-await" title="${miss.join(', ')}">Missing ${miss.length}</span>`}</td>
      <td style="white-space:nowrap">
        <button class="btn btn-ghost btn-sm" data-act="view-loan" data-ref="${l.app}">View</button>
        <button class="btn btn-gold btn-sm" data-act="prepare-loan" data-ref="${l.app}">Prepare</button>
      </td></tr>`;
  }).join('') : `<tr><td colspan="9"><div class="empty">No approved loans match your filters.</div></td></tr>`;
}

/* ============================================================
   SECTION 3 · PREPARATION
   ============================================================ */
function renderPrepOptions(){
  const avail = state.loans.filter(l=>!l.prepared);
  el('prepLoan').innerHTML = `<option value="">— choose an approved loan —</option>` +
    avail.map(l=>`<option value="${l.app}">${l.app} · ${l.cust} · ${mk(l.approved)}</option>`).join('');
}

function fillPrep(app){
  const l = state.loans.find(x=>x.app===app);
  if(!l){
    ['prepCust','prepAcct','prepAmount','prepRate','prepTerm','prepNet'].forEach(id=>el(id).value='');
    el('prepChecks').innerHTML = '<div class="empty">Select an approved loan to see its requirement checks.</div>';
    el('prepSummary').innerHTML = '<div class="empty">Deductions and net payable will appear here.</div>';
    return;
  }
  const f = calcFees(l.approved);
  el('prepCust').value = l.cust;
  el('prepAcct').value = l.acct;
  el('prepAmount').value = nf(l.approved);
  el('prepRate').value = l.rate;
  el('prepTerm').value = l.term;
  el('prepNet').value = nf(f.net);
  if(!el('prepRef').value) el('prepRef').value = nextRef();

  const checks = [
    ['Customer identity confirmed', l.docs.id, 'National ID matched to KYC record'],
    ['Signed loan agreement on file', l.docs.agreement, l.docs.agreement?'ES-2026-'+l.app.slice(-4):'Missing signature page'],
    ['Proof of income / payslip', l.docs.payslip, l.docs.payslip?'Uploaded 26 Oct':'Not uploaded'],
    ['Guarantor confirmation', l.docs.guarantor, l.docs.guarantor?'Guarantor verified':'Awaiting guarantor signature'],
    ['Within approval limit', l.approved<=15000000, 'Committee limit MK 15,000,000'],
    ['No duplicate disbursement', !state.disb.some(d=>d.app===l.app && d.status!=='Rejected' && d.status!=='Cancelled'), 'Checked against register']
  ];
  el('prepChecks').innerHTML = checks.map(([t,ok,s])=>`
    <div class="check"><div class="ck ${ok?'y':'n'}">${ok?'✓':'✕'}</div>
      <div><b>${t}</b><span class="s">${s}</span></div></div>`).join('') +
    (missingDocs(l).length ? `<div class="note red" style="margin-top:10px">Prepare may continue, but the release
      will be blocked until missing requirements are resolved.</div>`
      : `<div class="note" style="margin-top:10px">All requirements satisfied — ready for authorization.</div>`);

  el('prepSummary').innerHTML = `
    <div class="kv"><span class="k">Approved amount</span><span class="v">${mk(l.approved)}</span></div>
    <div class="kv"><span class="k">Processing fee (${FEE.proc}%)</span><span class="v">− ${mk(f.proc)}</span></div>
    <div class="kv"><span class="k">Insurance (${FEE.ins}%)</span><span class="v">− ${mk(f.ins)}</span></div>
    <div class="kv"><span class="k">Other deductions</span><span class="v">− ${mk(f.other)}</span></div>
    <div class="kv"><span class="k">Total deductions</span><span class="v">− ${mk(f.total)}</span></div>
    <div class="kv"><span class="k" style="font-weight:800;color:var(--ink)">Net amount payable</span>
      <span class="v big" style="color:#157A50">${mk(f.net)}</span></div>`;
  return l;
}

/* ============================================================
   SECTION 4 · AUTHORIZATION
   ============================================================ */
function renderAuth(){
  const pend = state.disb.filter(d=>d.status==='Awaiting authorization');
  el('authCount').textContent = pend.length + ' pending';
  el('authBody').innerHTML = pend.length ? pend.map(d=>`
    <tr>
      <td style="font-weight:700;font-size:11.5px;white-space:nowrap">${d.ref}</td>
      <td><div class="nm" style="font-weight:600;white-space:nowrap">${d.cust}</div><div class="tiny muted">${d.acct}</div></td>
      <td class="num">${mk(d.amount)}<div class="tiny" style="color:#157A50;font-weight:600">net ${mk(d.net)}</div></td>
      <td class="tiny" style="white-space:nowrap">${d.method}</td>
      <td class="muted tiny" style="white-space:nowrap">${d.preparedBy}</td>
      <td style="white-space:nowrap">
        <button class="btn btn-green btn-sm" data-act="authorize" data-ref="${d.ref}">Approve</button>
        <button class="btn btn-ghost btn-sm" data-act="return" data-ref="${d.ref}">Return</button>
        <button class="btn btn-red btn-sm" data-act="reject" data-ref="${d.ref}">Reject</button>
      </td></tr>`).join('')
    : `<tr><td colspan="6"><div class="empty">No disbursements are awaiting authorization.</div></td></tr>`;

  el('authLimits').innerHTML = `
    <div class="kv"><span class="k">Personal release limit</span><span class="v">MK 5,000,000</span></div>
    <div class="kv"><span class="k">Credit committee limit</span><span class="v">MK 15,000,000</span></div>
    <div class="kv"><span class="k">Above limit requires</span><span class="v">CFO + 2 authorizers</span></div>
    <div class="kv"><span class="k">Daily authorization ceiling</span><span class="v">MK 40,000,000</span></div>
    <div class="kv"><span class="k">Used today</span><span class="v">${mk(state.disb.filter(d=>d.date===today&&['Authorized','Processing','Awaiting confirmation','Successful'].includes(d.status)).reduce((s,d)=>s+d.amount,0))}</span></div>
    <div class="kv"><span class="k">Segregation of duties</span><span class="v" style="color:#157A50">Enforced</span></div>`;

  const hist = state.audit.filter(a=>['Authorized','Rejected'].includes(a[2])).slice(0,5);
  el('authHist').innerHTML = hist.map(a=>`
    <div class="li">
      <div class="av" style="background:${a[2]==='Authorized'?'var(--green-soft)':'var(--red-soft)'};color:${a[2]==='Authorized'?'#157A50':'#B32C2C'}">
        ${a[2]==='Authorized'?'✓':'✕'}</div>
      <div><div class="t1">${a[2]} · ${a[1]}</div><div class="t2">${a[3]} · ${a[4].split('·')[0].trim()}</div></div>
      <div class="amt"><b class="tiny muted">${a[0]}</b></div>
    </div>`).join('');
}

/* ============================================================
   SECTION 5 · RECORD NEW DISBURSEMENT
   ============================================================ */
function renderRecord(){
  const auth = state.disb.filter(d=>d.status==='Authorized');
  el('recSel').innerHTML = `<option value="">— choose an authorized disbursement —</option>` +
    auth.map(d=>`<option value="${d.ref}">${d.ref} · ${d.cust} · ${mk(d.amount)}</option>`).join('');
  el('recReady').innerHTML = auth.length ? auth.map(d=>`
    <div class="li"><div class="av">${initials(d.cust)}</div>
      <div><div class="t1">${d.cust}</div><div class="t2">${d.ref} · ${d.method}</div></div>
      <div class="amt"><b>${mk(d.net)}</b><span>net payable</span></div></div>`).join('')
    : `<div class="empty">Nothing authorized and waiting for release.</div>`;
}

function fillRecord(ref){
  const d = state.disb.find(x=>x.ref===ref);
  if(!d){ el('recCust').value=''; el('recAmount').value=''; return; }
  el('recCust').value = `${d.cust} · ${d.app} · ${d.acct}`;
  el('recAmount').value = d.net;
  el('recMethod').value = d.method;
  el('recTxn').value = '';
  el('recBank').value = d.method==='Cash' ? 'Branch cash desk' : '';
}

/* ============================================================
   SECTION 6 · REGISTER
   ============================================================ */
const regState = {page:1, size:10};

function filterRegister(){
  const q = (el('regSearch').value||'').toLowerCase();
  const from = el('regFrom').value, to = el('regTo').value;
  const method = el('regMethod').value, status = el('regStatus').value, officer = el('regOfficer').value;
  return state.disb.filter(d=>{
    if(q && !(d.cust+d.acct+d.app+d.ref).toLowerCase().includes(q)) return false;
    if(from && d.date < from) return false;
    if(to && d.date > to) return false;
    if(method && d.method!==method) return false;
    if(status && d.status!==status) return false;
    if(officer && d.officer!==officer) return false;
    return true;
  }).sort((a,b)=> b.date===a.date ? b.ref.localeCompare(a.ref) : b.date.localeCompare(a.date));
}

function renderRegister(){
  const rows = filterRegister();
  const pages = Math.max(1, Math.ceil(rows.length/regState.size));
  if(regState.page>pages) regState.page = pages;
  const slice = rows.slice((regState.page-1)*regState.size, regState.page*regState.size);
  el('regBody').innerHTML = slice.length ? slice.map(d=>`
    <tr>
      <td style="font-weight:700;font-size:11.5px">${d.ref}</td>
      <td class="tiny muted">${d.date}</td>
      <td><div class="nm" style="font-weight:600">${d.cust}</div><div class="tiny muted">${d.acct}</div></td>
      <td class="tiny muted">${d.app}</td>
      <td class="num">${mk(d.amount)}</td>
      <td class="num">${mk(d.net)}</td>
      <td class="tiny">${d.method}</td>
      <td class="tiny muted">${d.officer}</td>
      <td>${chip(d.status)}</td>
      <td><button class="btn btn-ghost btn-sm" data-act="view-disb" data-ref="${d.ref}">View</button></td>
    </tr>`).join('')
    : `<tr><td colspan="10"><div class="empty">No disbursements match these filters.</div></td></tr>`;
  el('regPager').innerHTML = `
    <span>${rows.length} record${rows.length===1?'':'s'} · page ${regState.page} of ${pages}</span>
    <button data-act="reg-prev" ${regState.page<=1?'disabled':''}>Prev</button>
    <button data-act="reg-next" ${regState.page>=pages?'disabled':''}>Next</button>`;
}

/* ============================================================
   SECTION 7 · METHODS
   ============================================================ */
const METHODS = [
  {name:'Bank Transfer', icon:'🏦', enabled:true, color:'#2F6FED', txns:12, value:18.4, fee:'MK 0 (absorbed)'},
  {name:'Airtel Money', icon:'📱', enabled:true, color:'#D93F3F', txns:9, value:3.2, fee:'1.2% wallet charge'},
  {name:'TNM Mpamba', icon:'📲', enabled:true, color:'#1E9E6A', txns:5, value:2.1, fee:'1.0% wallet charge'},
  {name:'Cash', icon:'💵', enabled:true, color:'#C9A227', txns:4, value:1.4, fee:'—'},
  {name:'Cheque', icon:'🧾', enabled:false, color:'#7C5CF0', txns:0, value:0, fee:'MK 5,000 handling'}
];

function renderMethods(){
  el('methodCards').innerHTML = METHODS.map((m,i)=>`
    <div class="method">
      <div class="method-top">
        <div class="mi" style="background:${m.color}1A;color:${m.color};font-size:14px">${m.icon}</div>
        <div><b>${m.name}</b><div class="ms">${m.enabled?'Enabled':'Disabled'} · ${m.fee}</div></div>
        <button class="toggle ${m.enabled?'on':''}" data-act="toggle-method" data-idx="${i}" style="margin-left:auto"></button>
      </div>
      <div class="mv"><span class="muted">Transactions</span><b>${m.txns}</b></div>
      <div class="mv"><span class="muted">Value released</span><b>MK ${m.value.toFixed(1)}M</b></div>
    </div>`).join('');

  el('methodFailures').innerHTML = [
    ['Bank Transfer', 12, 1, 'Beneficiary name mismatch'],
    ['Airtel Money', 9, 2, 'Wallet limit exceeded'],
    ['TNM Mpamba', 5, 1, 'Invalid wallet number'],
    ['Cash', 4, 0, '—'],
    ['Cheque', 0, 0, '—']
  ].map(([m,a,f,r])=>`<tr><td style="font-weight:600">${m}</td><td class="num">${a}</td>
    <td class="num">${f}</td><td class="num">${a?Math.round(f/a*100):0}%</td>
    <td class="tiny muted">${r}</td></tr>`).join('');

  el('methodRules').innerHTML = [
    ['Bank transfer — account name must match KYC exactly', true],
    ['Mobile money — wallet registered in customer name', true],
    ['Mobile money — wallet tier limit checked before release', true],
    ['Cash — collected at counter with biometric or ID check', true],
    ['Cheque — only for amounts above MK 2,000,000', true],
    ['Every method must store a unique transaction reference', true]
  ].map(([t,ok])=>`<div class="check"><div class="ck ${ok?'y':'w'}">${ok?'✓':'!'}</div>
    <div><b>${t}</b></div></div>`).join('');
}

/* ============================================================
   SECTION 8 · VERIFICATION
   ============================================================ */
let verifSel = null;

function renderVerify(){
  const pend = state.disb.filter(d=>['Processing','Awaiting confirmation'].includes(d.status));
  el('verifCount').textContent = pend.length + ' pending';
  el('verifBody').innerHTML = pend.length ? pend.map(d=>`
    <tr>
      <td style="font-weight:700;font-size:11.5px">${d.ref}</td>
      <td><div class="nm" style="font-weight:600;white-space:nowrap">${d.cust}</div><div class="tiny muted">${d.acct}</div></td>
      <td class="num">${mk(d.net)}</td>
      <td class="tiny">${d.method}</td>
      <td class="tiny muted">${d.txn||'—'}</td>
      <td><button class="btn btn-gold btn-sm" data-act="verif-open" data-ref="${d.ref}">Verify</button></td>
    </tr>`).join('')
    : `<tr><td colspan="6"><div class="empty">No payments awaiting confirmation.</div></td></tr>`;
  renderVerifPanel();
}

function renderVerifPanel(){
  if(!verifSel){ el('verifPanel').innerHTML = '<div class="empty">No disbursement selected.</div>'; return; }
  const d = state.disb.find(x=>x.ref===verifSel);
  if(!d){ el('verifPanel').innerHTML = '<div class="empty">No disbursement selected.</div>'; return; }
  el('verifPanel').innerHTML = `
    <div class="kv"><span class="k">Reference</span><span class="v">${d.ref}</span></div>
    <div class="kv"><span class="k">Customer</span><span class="v">${d.cust}</span></div>
    <div class="kv"><span class="k">Amount released</span><span class="v">${mk(d.net)}</span></div>
    <div class="kv"><span class="k">Method</span><span class="v">${d.method}</span></div>
    <div class="kv"><span class="k">Transaction reference</span><span class="v">${d.txn||'—'}</span></div>
    <div style="margin-top:8px">
      ${[['Transaction reference matches the bank / wallet statement', !!d.txn],
         ['Amount released equals the authorized net payable', true],
         ['Payment evidence attached', true],
         ['Customer confirmed receipt (call or SMS reply)', d.status==='Awaiting confirmation']]
        .map(([t,ok])=>`<div class="check"><div class="ck ${ok?'y':'w'}">${ok?'✓':'!'}</div>
          <div><b>${t}</b></div></div>`).join('')}
    </div>
    <div class="form-actions">
      <button class="btn btn-green btn-sm" data-act="verify-ok" data-ref="${d.ref}">Mark successfully disbursed</button>
      <button class="btn btn-red btn-sm" data-act="verify-fail" data-ref="${d.ref}">Reject confirmation</button>
    </div>`;
}

function renderVerifHist(){
  const hist = state.disb.filter(d=>d.status==='Successful').slice(0,5);
  el('verifHist').innerHTML = hist.map(d=>`
    <div class="li"><div class="av" style="background:var(--green-soft);color:#157A50">✓</div>
      <div><div class="t1">${d.cust} · ${mk(d.net)}</div><div class="t2">${d.ref} · ${d.method} · ${d.date}</div></div>
      <div class="amt"><b class="tiny" style="color:#157A50">Confirmed</b></div></div>`).join('');
}
