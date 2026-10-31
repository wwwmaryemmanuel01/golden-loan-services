<script>
/* ============================================================
   GOLDEN FINANCIAL SERVICES · CUSTOMERS  (2/4)
   Sections 4–7: profile, verification, loan accounts, repayments.
   ============================================================ */

function selectCust(id, no){ const s = el(id); if(s){ s.value = no; } }

function openCustomer(no){
  CUST_SELECTS.forEach(id=>{ const s = el(id); if(s) s.value = no; });
  KYC.cust = no; LOAN.cust = no; REP.cust = no; FIN.cust = no;
  DOC.cust = no; COM.cust = no; RISK.cust = no; ACT.cust = no;
  renderAll();
  goto('s4');
}

function seedHistory(){
  CUSTOMERS.forEach((c,i)=>{
    if(c.history.length) return;
    c.history.push({when:c.joined, what:'Customer registered — ' + c.type + ' (' + c.category + ')', amount:0, by:OFFICER_NAMES[i%6]});
    if(c.kyc === 'Verified'){
      c.history.push({when:addDays(c.joined, 3), what:'KYC verified — identity, address, employment and income', amount:0, by:OFFICER_NAMES[(i+1)%6]});
    } else if(c.kyc === 'Rejected'){
      c.history.push({when:addDays(c.joined, 2), what:'KYC rejected — documents illegible', amount:0, by:OFFICER_NAMES[(i+2)%6]});
    } else if(c.kyc === 'Expired'){
      c.history.push({when:addDays(c.joined, 4), what:'KYC verified — national ID on file', amount:0, by:OFFICER_NAMES[(i+3)%6]});
      c.history.push({when:'2026-08-15', what:'ID expiry flagged — replacement requested by SMS', amount:0, by:'System'});
    }
    if(c.portal) c.history.push({when:addDays(c.joined, 1), what:'Customer portal access activated — activation SMS sent', amount:0, by:'System'});
    if(c.income) c.history.push({when:addMonths(c.joined, 4), what:'Income updated to ' + mk(c.income) + ' per month', amount:c.income, by:OFFICER_NAMES[(i+4)%6]});
    if(c.status === 'Suspended') c.history.push({when:'2026-07-02', what:'Account suspended — arrears and failed contact attempts', amount:0, by:'Head of Credit'});
    if(c.status === 'Blacklisted') c.history.push({when:'2025-04-11', what:'Customer blacklisted — written-off facility and cheque fraud', amount:0, by:'Head of Credit'});
    if(!c.kycLog.length){
      c.kycLog.push({when:c.joined, result:c.kyc==='Rejected'?'Rejected':c.kyc==='Pending'||c.kyc==='Expired'?'Pending':'Approved',
        by:OFFICER_NAMES[(i+1)%6], note: c.kycNote || 'Documents reviewed at the branch'});
      if(c.kyc === 'Expired') c.kycLog.push({when:'2026-08-15', result:'Expired', by:'System', note:'National ID expired — customer notified'});
    }
    c.history.sort((a,b)=> a.when < b.when ? 1 : -1);
  });
}

/* ===================== 4 · PROFILE ===================== */
const PROF = {cust: CUSTOMERS[0].no};

function completeness(c){
  const need = [c.name, c.phone, c.nrc, c.district, c.address, c.dob, c.gender, c.marital,
    c.employ, c.occupation, c.income, c.kin && c.kin.name, c.momoNo, c.bank, c.email];
  const have = need.filter(v=>v && v !== '—' && v !== 'None').length;
  return Math.round(have/need.length*100);
}

function profileFields(c){
  const rows = [
    ['Customer number', c.no], ['Customer type', c.type + ' · ' + c.category],
    ['Date registered', fmtDate(c.joined)], ['Last activity', fmtDate(c.lastActive)],
    ['Personal', [c.first, c.last].filter(Boolean).join(' ') || c.owner || '—'],
    ['Date of birth', c.dob ? fmtDate(c.dob) : '—'], ['Gender', c.gender], ['Marital status', c.marital],
    ['Language', c.lang], ['Phone', c.phone], ['Email', c.email || '—'],
    ['NRC / passport', c.nrc], ['ID expiry', fmtDate(c.idExpiry)],
    ['District', c.district], ['Town', c.town], ['Physical address', c.address], ['Postal address', c.postal],
    ['Employment', c.employ], ['Employer', c.employer], ['Occupation', c.occupation],
    ['Monthly income', mk(c.income) + ' · ' + c.incomeFreq],
    ['Monthly expenses', mk(c.expenses)], ['Monthly surplus', mk(Math.max(0, c.income - c.expenses))],
    ['Next of kin', c.kin.name + ' · ' + c.kin.rel], ['Kin phone', c.kin.phone],
    ['Lives with customer', c.kin.live],
    ['Mobile money', c.momo + ' · ' + c.momoNo], ['Bank', c.bank],
    ['Account number', c.bank === 'None' ? '—' : c.bankAcc], ['Bank branch', c.bank === 'None' ? '—' : c.bankBranch]
  ];
  return rows.map(([k,v])=>`<div class="pfield"><div class="pk">${k}</div>
    <div class="pv ${(!v || v==='—')?'muted':''}">${esc(v) || '—'}</div></div>`).join('');
}

function renderProfile(){
  const s = el('profCust');
  const c = cust((s && s.value) || PROF.cust);
  PROF.cust = c.no;
  const comp = completeness(c);
  el('profCompleteness').textContent = comp + '% complete';
  el('profCard').innerHTML = `
    <div class="custhead">
      <div class="avatar-lg ${c.type==='Business'?'biz':''}">${initials(c.name)}</div>
      <div style="flex:1;min-width:180px">
        <div class="cname">${esc(c.name)}</div>
        <div class="cmeta">${c.no} · ${c.category} · ${c.district} · joined ${fmtDate(c.joined)}</div>
        <div class="cchips">
          <span class="badge ${statusTone(c.status)}">${c.status}</span>
          <span class="badge ${kycTone(c)}">KYC ${kycLabel(c)}</span>
          <span class="badge ${statusTone(c.risk)}">${c.risk} risk</span>
          <span class="chip">${esc(c.phone)}</span>
          <span class="chip">${c.portal ? 'Portal active' : 'No portal'}</span>
        </div>
      </div>
      <div style="margin-left:auto;display:flex;gap:6px;flex-wrap:wrap">
        <button class="btn btn-ghost btn-sm" data-pjump="s5">KYC</button>
        <button class="btn btn-ghost btn-sm" data-pjump="s6">Loans</button>
        <button class="btn btn-ghost btn-sm" data-pjump="s12">Support</button>
        <button class="btn btn-gold btn-sm" data-pedit="1">Edit</button>
      </div>
    </div>
    <div class="statstrip">
      <div><b>${nf(activeCount(c.no))}</b><span>Live loans</span></div>
      <div><b>${exposure(c.no)?mk2(exposure(c.no)):'—'}</b><span>Exposure</span></div>
      <div><b>${arrearsOf(c.no)?mk2(arrearsOf(c.no)):'—'}</b><span>Arrears</span></div>
      <div><b>${totalRepaid(c.no)?mk2(totalRepaid(c.no)):'—'}</b><span>Repaid</span></div>
      <div><b>${comp}%</b><span>Complete</span></div>
      <div><b>${openTickets(c.no)}</b><span>Open tickets</span></div>
    </div>`;
  el('profCard').querySelectorAll('[data-pjump]').forEach(b=>b.onclick = ()=>goto(b.dataset.pjump));
  el('profCard').querySelectorAll('[data-pedit]').forEach(b=>b.onclick = ()=>editProfile(c));
  el('profFields').innerHTML = `<div class="pfields">${profileFields(c)}</div>`;
  el('profSub').textContent = c.name + ' · ' + comp + '% complete';

  const hist = c.history.slice(0, 24);
  el('profHistCount').textContent = c.history.length;
  el('profHistory').innerHTML = hist.map(h=>`
    <div class="lrow">
      <div class="lic" style="background:var(--gold-soft);color:var(--gold-dark);font-size:9px">${fmtShort(h.when)}</div>
      <div><div class="lt">${esc(h.what)}</div>
        <div class="ls">${fmtDate(h.when)} · ${esc(h.by)}${h.amount ? ' · ' + mk(h.amount) : ''}</div></div>
    </div>`).join('') || '<div class="empty">No profile changes recorded.</div>';
}

function editProfile(c){
  openModal('Edit customer profile', c.no + ' · ' + c.name, `
    <div class="form-grid">
      <div class="fg"><label>Phone</label><input id="pePhone" value="${esc(c.phone)}"></div>
      <div class="fg"><label>Email</label><input id="peEmail" value="${esc(c.email)}"></div>
      <div class="fg"><label>District</label><select id="peDistrict">
        ${['Blantyre','Lilongwe','Mzuzu','Zomba','Mangochi','Kasungu','Salima','Mulanje']
          .map(d=>`<option${d===c.district?' selected':''}>${d}</option>`).join('')}</select></div>
      <div class="fg"><label>Town / trading centre</label><input id="peTown" value="${esc(c.town)}"></div>
      <div class="fg" style="grid-column:1/-1"><label>Physical address</label><input id="peAddress" value="${esc(c.address)}"></div>
      <div class="fg"><label>Occupation</label><input id="peOccupation" value="${esc(c.occupation)}"></div>
      <div class="fg"><label>Employer</label><input id="peEmployer" value="${esc(c.employer)}"></div>
      <div class="fg"><label>Monthly income (MWK)</label><input id="peIncome" type="number" value="${c.income}"></div>
      <div class="fg"><label>Monthly expenses (MWK)</label><input id="peExpenses" type="number" value="${c.expenses}"></div>
      <div class="fg"><label>Next of kin</label><input id="peKin" value="${esc(c.kin.name)}"></div>
      <div class="fg"><label>Kin phone</label><input id="peKinPhone" value="${esc(c.kin.phone)}"></div>
      <div class="fg"><label>Mobile money</label><select id="peMomo">
        ${['Airtel Money','TNM Mpamba','Both','None'].map(m=>`<option${m===c.momo?' selected':''}>${m}</option>`).join('')}</select></div>
      <div class="fg"><label>Account status</label><select id="peStatus">
        ${['Active','Inactive','Pending Verification','Suspended','Blacklisted'].map(m=>`<option${m===c.status?' selected':''}>${m}</option>`).join('')}</select></div>
    </div>
    <div class="inline-note">Every change is written to the profile update history with your name and the time.</div>`,
    [{label:'Cancel', act:'close'}, {label:'Save changes', cls:'btn-gold', act:()=>{
      const before = [];
      const set = (field, val, label)=>{
        if(String(c[field]) !== String(val)){ before.push(label); c[field] = val; }
      };
      set('phone', el('pePhone').value.trim(), 'phone');
      set('email', el('peEmail').value.trim(), 'email');
      set('district', el('peDistrict').value, 'district');
      set('town', el('peTown').value.trim(), 'town');
      set('address', el('peAddress').value.trim(), 'address');
      set('occupation', el('peOccupation').value.trim(), 'occupation');
      set('employer', el('peEmployer').value.trim(), 'employer');
      set('income', Number(el('peIncome').value)||0, 'income');
      set('expenses', Number(el('peExpenses').value)||0, 'expenses');
      const kinName = el('peKin').value.trim(), kinPhone = el('peKinPhone').value.trim();
      if(kinName !== c.kin.name){ before.push('next of kin'); c.kin.name = kinName; }
      if(kinPhone !== c.kin.phone){ before.push('kin phone'); c.kin.phone = kinPhone; }
      const momo = el('peMomo').value;
      if(momo !== c.momo){ before.push('mobile money'); c.momo = momo; }
      const status = el('peStatus').value;
      if(status !== c.status){ before.push('account status'); c.status = status; }
      if(!before.length){ toast('No changes to save.', 'info'); closeModal(); return; }
      const what = 'Profile updated — ' + before.join(', ');
      c.history.unshift({when:TODAY, what, amount:0, by:'Chikondi Mwale'});
      logAct(c, what);
      renderAll(); fillDistrictFilter(); closeModal();
      toast('Profile updated for ' + esc(c.name) + ' (' + before.length + ' field' + (before.length===1?'':'s') + ').');
    }}]);
}

function wireProfile(){
  el('profCust').addEventListener('change', ()=>{ PROF.cust = el('profCust').value; renderProfile(); });
  el('profEdit').onclick = ()=> editProfile(cust(el('profCust').value));
}

/* ===================== 5 · VERIFICATION ===================== */
const KYC = {cust: CUSTOMERS[0].no, tab:''};
const KYC_ITEMS = [
  {key:'identity',   label:'Identity verification',   source:'NRC / passport checked against the national register'},
  {key:'address',    label:'Proof of address',        source:'Utility bill or tenancy agreement, dated within 3 months'},
  {key:'employment', label:'Employment verification', source:'Employer letter or business permit'},
  {key:'income',     label:'Income verification',     source:'Payslip or three months of bank statements'},
  {key:'docs',       label:'Document verification',   source:'All uploaded documents legible and consistent'},
  {key:'phone',      label:'Phone & data consent',    source:'SIM registered in the customer\u2019s name, bureau consent signed'}
];

function kycQueue(){
  let rows = CUSTOMERS.slice();
  if(KYC.tab === 'expired') rows = rows.filter(c=>c.kyc === 'Expired');
  else if(KYC.tab === 'Verified') rows = rows.filter(c=>c.kyc === 'Verified');
  else if(KYC.tab === 'Pending Verification') rows = rows.filter(c=>c.status === 'Pending Verification' || c.kyc === 'Pending');
  const rank = c => c.kyc === 'Rejected' ? 0 : c.kyc === 'Expired' ? 1 : c.kyc === 'Pending' ? 2 : 3;
  return rows.sort((a,b)=> rank(a) - rank(b) || a.name.localeCompare(b.name));
}

function renderKYC(){
  const queue = kycQueue();
  const pending = CUSTOMERS.filter(c=>c.kyc !== 'Verified').length;
  const expired = CUSTOMERS.filter(c=>c.kyc === 'Expired').length;
  el('kycCount').textContent = pending + ' pending';
  el('kycExpired').textContent = expired + ' expired ID' + (expired===1?'':'s');
  el('kycQueue').innerHTML = queue.slice(0,14).map(c=>`
    <div class="lrow">
      <div class="lic ${c.kyc==='Verified'?'st-ok':c.kyc==='Rejected'?'st-fail':'st-await'}" style="font-size:9px">${c.kyc==='Verified'?'✓':c.kyc==='Rejected'?'✕':c.kyc==='Expired'?'!':'…'}</div>
      <div><div class="lt">${esc(c.name)}</div>
        <div class="ls">${c.no} · ${kycScore(c)}/6 checks · ${missingDocs(c)} doc${missingDocs(c)===1?'':'s'} missing</div></div>
      <div class="lr"><span class="badge ${kycTone(c)}">${kycLabel(c)}</span>
        <button class="btn btn-ghost" data-kyc="${c.no}">Review</button></div>
    </div>`).join('') || '<div class="empty">Nothing in this queue.</div>';
  el('kycQueue').querySelectorAll('[data-kyc]').forEach(b=>{
    b.onclick = ()=>{ KYC.cust = b.dataset.kyc; renderKYC(); };
  });
  renderKYCPanel();
}

function renderKYCPanel(){
  const c = cust(KYC.cust);
  const score = kycScore(c);
  el('kycScore').textContent = score + ' / 6';
  el('kycSub').textContent = c.name + ' · ' + c.no + ' · ' + kycLabel(c);
  el('kycPanel').innerHTML = `
    <div class="custhead" style="margin-bottom:8px">
      <div class="avatar-lg ${c.type==='Business'?'biz':''}">${initials(c.name)}</div>
      <div><div class="cname">${esc(c.name)}</div>
        <div class="cmeta">${c.no} · ${c.district} · joined ${fmtDate(c.joined)}</div>
        <div class="cchips"><span class="badge ${kycTone(c)}">${kycLabel(c)}</span>
          <span class="badge ${statusTone(c.status)}">${c.status}</span></div></div>
    </div>
    <div class="kycgrid">
      ${KYC_ITEMS.map(it=>`<div class="kycbox ${c.kycFlags[it.key]?'ok':'warn'}">
        <div class="kt">${it.label}</div>
        <div class="kv2">${c.kycFlags[it.key] ? '✓ Verified' : '○ Outstanding'}</div>
        <div style="font-size:9px;color:var(--muted);margin-top:3px">${it.source}</div>
        <button class="btn btn-ghost" style="margin-top:6px;padding:3px 7px;font-size:9.5px"
          data-kt-toggle="${it.key}">${c.kycFlags[it.key] ? 'Mark outstanding' : 'Mark verified'}</button>
      </div>`).join('')}
    </div>
    <div class="inline-note" style="margin-top:8px">${esc(c.kycNote)} · National ID expiry ${fmtDate(c.idExpiry)}</div>
    <div class="form-actions">
      <button class="btn btn-gold" data-kyc-act="approve">Approve KYC</button>
      <button class="btn btn-ghost" data-kyc-act="reject">Reject</button>
      <button class="btn btn-ghost" data-kyc-act="recheck">Request re-check</button>
      <button class="btn btn-ghost" data-kyc-act="request">Request documents</button>
    </div>`;
  el('kycPanel').querySelectorAll('[data-kt-toggle]').forEach(b=>{
    b.onclick = ()=>{
      const k = b.dataset.ktToggle;
      c.kycFlags[k] = !c.kycFlags[k];
      c.kycLog.unshift({when:TODAY, result:'Updated', by:'Chikondi Mwale',
        note: KYC_ITEMS.find(i=>i.key===k).label + (c.kycFlags[k] ? ' verified' : ' marked outstanding')});
      logAct(c, 'KYC check updated — ' + KYC_ITEMS.find(i=>i.key===k).label);
      renderKYC(); renderOverview(); renderProfile();
      toast('KYC check updated for ' + esc(c.name) + '.');
    };
  });
  el('kycPanel').querySelectorAll('[data-kyc-act]').forEach(b=>{
    b.onclick = ()=> kycAction(c, b.dataset.kycAct);
  });

  el('kycDocs').innerHTML = DOC_DEFS.map(d=>{
    const doc = c.docs[d.key];
    const cls = doc.state === 'ok' ? 'ok' : doc.state === 'expired' ? 'exp' : 'miss';
    return `<div class="docline ${cls}">
      <div class="dfi">${doc.state === 'ok' ? '✓' : doc.state === 'expired' ? '!' : '✕'}</div>
      <div class="dbody"><b>${doc.label}</b>
        <span>${doc.state === 'missing' ? 'Not on file — requested' :
          doc.state === 'expired' ? 'Expired ' + fmtDate(doc.expiry) : 'On file · uploaded ' + fmtDate(doc.uploaded)}</span></div>
      <div style="font-size:9.5px;font-weight:700;color:var(--muted)">${doc.state === 'ok' ? 'OK' : doc.state === 'expired' ? 'EXPIRED' : 'MISSING'}</div>
    </div>`;
  }).join('');
  el('kycDocCount').textContent = DOC_DEFS.filter(d=>c.docs[d.key].state === 'ok').length + ' / ' + DOC_DEFS.length;

  el('kycHistory').innerHTML = c.kycLog.slice(0,10).map(k=>`
    <tr><td style="white-space:nowrap">${fmtDate(k.when)}</td>
      <td>${esc(c.name)}</td>
      <td><span class="badge ${k.result==='Approved'?'b-ok':k.result==='Rejected'||k.result==='Expired'?'b-rej':'b-await'}">${k.result}</span></td>
      <td>${esc(k.by)}</td></tr>`).join('') ||
    '<tr><td colspan="4" class="empty">No verification events yet.</td></tr>';
}

function kycAction(c, act){
  if(act === 'approve'){
    if(!Object.values(c.kycFlags).every(Boolean)){
      const missing = KYC_ITEMS.filter(i=>!c.kycFlags[i.key]).map(i=>i.label);
      openModal('KYC not complete', 'Cannot approve — ' + missing.length + ' check(s) outstanding',
        `<div class="inline-note">${missing.map(m=>'• ' + m).join('<br>')}</div>
         <div class="inline-note">Verify every check first, or use <b>Request documents</b>.</div>`,
        [{label:'Close', act:'close'}]);
      return;
    }
    c.kyc = 'Verified';
    if(c.status === 'Pending Verification') c.status = 'Active';
    c.kycNote = 'Identity, address, employment and income verified.';
    c.kycLog.unshift({when:TODAY, result:'Approved', by:'Chikondi Mwale', note:'All six checks passed'});
    c.history.unshift({when:TODAY, what:'KYC approved — all six checks verified', amount:0, by:'Chikondi Mwale'});
    logAct(c, 'KYC approved; account ' + (c.status==='Active'?'activated':'unchanged'));
    if(c.portal === false && c.status === 'Active'){ c.portal = true; c.history.unshift({when:TODAY, what:'Customer portal access activated', amount:0, by:'System'}); }
    renderAll(); toast('KYC approved for ' + esc(c.name) + '.');
    return;
  }
  if(act === 'reject'){
    openModal('Reject KYC', c.no + ' · ' + c.name, `
      <div class="fg"><label>Reason</label><select id="kycReason">
        <option>Documents illegible</option>
        <option>NRC does not match the national register</option>
        <option>Address could not be confirmed</option>
        <option>Income proof expired</option>
        <option>Customer could not be reached</option>
      </select></div>
      <div class="fg" style="margin-top:8px"><label>Notes</label><textarea id="kycNotes" style="min-height:64px"></textarea></div>`,
      [{label:'Cancel', act:'close'}, {label:'Reject KYC', cls:'btn-gold', act:()=>{
        const reason = el('kycReason').value;
        c.kyc = 'Rejected'; c.kycNote = reason; c.status = c.status === 'Pending Verification' ? 'Inactive' : c.status;
        c.kycLog.unshift({when:TODAY, result:'Rejected', by:'Chikondi Mwale', note:reason});
        c.history.unshift({when:TODAY, what:'KYC rejected — ' + reason, amount:0, by:'Chikondi Mwale'});
        logAct(c, 'KYC rejected — ' + reason);
        if(!Object.values(c.kycFlags).some(Boolean)) c.kycFlags.phone = true;
        renderAll(); closeModal(); toast('KYC rejected for ' + esc(c.name) + '.', 'err');
      }}]);
    return;
  }
  if(act === 'recheck'){
    c.kycFlags.phone = true;
    c.kycLog.unshift({when:TODAY, result:'Re-check', by:'Chikondi Mwale', note:'Customer asked to bring updated documents'});
    c.messages.push({when:TODAY, channel:'SMS', type:'KYC', body:`Dear ${c.name.split(' ')[0]}, please visit the branch with your original NRC and proof of address to complete verification.`, by:'Chikondi Mwale'});
    logAct(c, 'KYC re-check requested and customer notified by SMS');
    renderAll(); toast('Re-check requested · SMS queued to ' + esc(c.phone) + '.');
    return;
  }
  if(act === 'request'){
    const missing = DOC_DEFS.filter(d=>c.docs[d.key].state !== 'ok').map(d=>d.label);
    if(!missing.length){ toast('Every document is already on file for this customer.', 'info'); return; }
    openModal('Request documents', c.no + ' · ' + c.name, `
      <div class="inline-note">The customer will receive an SMS listing the outstanding documents.</div>
      <div class="check"><span class="ck n">!</span><div><b>${missing.length} document${missing.length===1?'':'s'} outstanding</b>
        <span class="s">${missing.join(' · ')}</span></div></div>`,
      [{label:'Cancel', act:'close'}, {label:'Send request', cls:'btn-gold', act:()=>{
        c.messages.push({when:TODAY, channel:'SMS', type:'Documents', body:`Please bring: ${missing.join(', ')}. Reference ${c.no}.`, by:'Chikondi Mwale'});
        c.kycLog.unshift({when:TODAY, result:'Requested', by:'Chikondi Mwale', note:'Asked for ' + missing.join(', ')});
        logAct(c, 'Document request sent by SMS');
        renderAll(); closeModal(); toast('Request sent to ' + esc(c.phone) + '.');
      }}]);
  }
}

function wireKYC(){
  el('kycTabs').querySelectorAll('[data-kt]').forEach(b=>{
    b.onclick = ()=>{
      KYC.tab = b.dataset.kt || '';
      el('kycTabs').querySelectorAll('[data-kt]').forEach(x=>x.classList.toggle('on', x === b));
      renderKYC();
    };
  });
  el('kycBtn').onclick = ()=> goto('s5');
}

/* ===================== 6 · LOAN ACCOUNTS ===================== */
const LOAN = {cust: CUSTOMERS[0].no, tab:'', sel:null};

function loanTone(s){ return statusTone(s); }

function renderLoanAccounts(){
  const c = cust(el('loanCust').value || LOAN.cust);
  LOAN.cust = c.no;
  const rows = loansOf(c.no).filter(l=> !LOAN.tab || l.status === LOAN.tab);
  const live = liveLoansOf(c.no);
  el('loanCount').textContent = live.length + ' live · ' + loansOf(c.no).length + ' total';
  el('loanTiles').innerHTML = [
    {l:'Facilities', v:nf(loansOf(c.no).length), s:`${nf(live.length)} live with the book`},
    {l:'Outstanding', v:exposure(c.no) ? mk2(exposure(c.no)) : '—', s:'Principal + interest remaining', k:'gold'},
    {l:'Arrears', v:arrearsOf(c.no) ? mk2(arrearsOf(c.no)) : '—', s: arrearsOf(c.no) ? 'Past due now' : 'Nothing past due', k: arrearsOf(c.no)?'red':''},
    {l:'Lifetime borrowed', v:mk2(sum(loansOf(c.no).filter(l=>l.live), l=>l.principal)), s:'Disbursed principal to date'}
  ].map(t=>`<div class="kpi ${t.k||''}"><div class="kl">${t.l}</div><div class="kv">${t.v}</div>
    <div class="ks">${t.s}</div></div>`).join('');

  el('loanBody').innerHTML = rows.map(l=>`
    <tr class="rowlink" data-loan="${l.id}">
      <td class="mono" style="font-size:10px">${l.id}</td>
      <td>${l.product}</td>
      <td class="num">${nf(l.principal)}</td>
      <td class="num">${l.outstanding ? nf(l.outstanding) : '—'}</td>
      <td class="num">${nf(l.insts[0].amount)}</td>
      <td style="white-space:nowrap">${l.nextDue ? fmtDate(l.nextDue) : '—'}</td>
      <td class="num">${l.dpd || '—'}</td>
      <td><span class="badge ${loanTone(l.status)}">${l.status}</span></td>
      <td style="text-align:right"><button class="btn btn-ghost" data-loan-btn="${l.id}">View</button></td>
    </tr>`).join('') || `<tr><td colspan="9" class="empty">No ${LOAN.tab || ''} loans for this customer.</td></tr>`;
  el('loanBody').querySelectorAll('[data-loan]').forEach(r=>{
    r.onclick = ()=>{ LOAN.sel = r.dataset.loan; renderLoanDetail(); };
  });

  if(!LOAN.sel || !LOANS.some(l=>l.id === LOAN.sel && l.cust === c.no)){
    LOAN.sel = loansOf(c.no)[0] ? loansOf(c.no)[0].id : null;
  }
  renderLoanDetail();
}

function renderLoanDetail(){
  const l = LOANS.find(x=>x.id === LOAN.sel);
  if(!l){ el('loanDetail').innerHTML = '<div class="empty">Pick a loan from the table.</div>'; el('loanDetailSub').textContent = 'Select a loan'; return; }
  el('loanDetailSub').textContent = l.id + ' · ' + l.product + ' · ' + l.status;
  const paid = l.insts.filter(i=>i.paid >= i.amount);
  el('loanDetail').innerHTML = `
    <div class="statstrip">
      <div><b>${mk(l.principal)}</b><span>Principal</span></div>
      <div><b>${mk(l.outstanding)}</b><span>Outstanding</span></div>
      <div><b>${mk(l.arrears)}</b><span>Arrears</span></div>
      <div><b>${mk(l.insts[0].amount)}</b><span>Instalment</span></div>
      <div><b>${l.rate}%</b><span>Monthly rate</span></div>
      <div><b>${l.dpd ? l.dpd + 'd' : '—'}</b><span>Days past due</span></div>
    </div>
    <div class="meter ${l.dpd ? 'red' : 'green'}"><i style="width:${l.progress}%"></i></div>
    <div class="inline-note">${l.progress}% of principal repaid · ${paid.length} of ${l.term} instalments settled ·
      next due ${l.nextDue ? fmtDate(l.nextDue) : 'nothing outstanding'} · officer ${esc(l.officer)}</div>
    <div class="tblwrap" style="max-height:230px;margin-top:8px">
      <table class="tbl2"><thead><tr><th>#</th><th>Due</th><th class="num">Instalment</th>
        <th class="num">Principal</th><th class="num">Interest</th><th>Status</th></tr></thead>
      <tbody>${l.insts.map(i=>`<tr>
        <td>${i.no}</td><td style="white-space:nowrap">${fmtShort(i.due)}</td>
        <td class="num">${nf(i.amount)}</td><td class="num">${nf(i.prin)}</td><td class="num">${nf(i.interest)}</td>
        <td><span class="badge ${i.paid>=i.amount?'b-ok':i.paid>0?'b-await':i.due<TODAY?'b-rej':'b-proc'}">${
          i.paid>=i.amount?'Paid':i.paid>0?'Partial':i.due<TODAY?'Missed':'Upcoming'}</span></td></tr>`).join('')}
      </tbody></table>
    </div>
    <div class="form-actions">
      <button class="btn btn-ghost" data-ld="statement">Loan statement</button>
      <button class="btn btn-ghost" data-ld="schedule">Full schedule</button>
      <button class="btn btn-ghost" data-ld="receipts">Receipts</button>
    </div>`;
  el('loanDetail').querySelectorAll('[data-ld]').forEach(b=>{
    b.onclick = ()=>{
      if(b.dataset.ld === 'statement') loanStatement(l);
      if(b.dataset.ld === 'receipts') loanReceipts(l);
      if(b.dataset.ld === 'schedule'){
        openModal('Repayment schedule', l.id + ' · ' + l.product + ' · ' + l.term + ' instalments',
          `<div class="tblwrap" style="max-height:420px"><table class="tbl2">
            <thead><tr><th>#</th><th>Due date</th><th class="num">Instalment</th><th class="num">Principal</th>
            <th class="num">Interest</th><th class="num">Balance</th><th>Status</th></tr></thead>
            <tbody>${l.insts.map(i=>{
              const bal = Math.round(l.insts.filter(x=>x.no <= i.no).reduce((s,x)=>s+(x.prin*(1-clamp(x.paid/x.amount,0,1))),0));
              return `<tr><td>${i.no}</td><td>${fmtShort(i.due)}</td><td class="num">${nf(i.amount)}</td>
                <td class="num">${nf(i.prin)}</td><td class="num">${nf(i.interest)}</td><td class="num">${nf(bal)}</td>
                <td>${i.paid>=i.amount?'Paid':i.paid>0?'Partial':i.due<TODAY?'Missed':'Due'}</td></tr>`;
            }).join('')}</tbody></table></div>`,
          [{label:'Close', act:'close'}]);
      }
    };
  });
}

function loanStatement(l){
  const rows = paysOfLoan(l.id).filter(p=>p.type !== 'Missed');
  openModal('Loan statement', l.id + ' · ' + l.product,
    `<div class="stmt">
      <div class="sh"><div class="avatar-lg">GF</div>
        <div><div style="font-size:12px;font-weight:800">GOLDEN FINANCIAL SERVICES</div>
          <div style="font-size:9.5px;color:var(--muted)">Loan statement · ${l.custName}</div></div>
        <div style="margin-left:auto;text-align:right;font-size:9.5px;color:var(--muted)">
          ${l.id}<br>Generated ${fmtDate(TODAY)}</div></div>
      <div class="srow"><span>Principal disbursed</span><b>${mk(l.principal)}</b></div>
      <div class="srow"><span>Processing fee</span><b>${mk(l.fee)}</b></div>
      <div class="srow"><span>Interest paid</span><b>${mk(l.paidInt)}</b></div>
      <div class="srow"><span>Principal repaid</span><b>${mk(l.paidPrin)}</b></div>
      <div class="srow"><span>Outstanding principal</span><b>${mk(l.outPrin)}</b></div>
      <div class="srow"><span>Outstanding interest</span><b>${mk(l.outInt)}</b></div>
      <div class="srow"><span>Arrears</span><b>${mk(l.arrears)}</b></div>
      <div class="stot"><span>Balance to settle</span><span>${mk(l.outstanding + l.arrears)}</span></div>
      <div class="inline-note" style="margin-top:8px">${rows.length} payments recorded · status ${l.status}</div>
    </div>`,
    [{label:'Print', act:()=>printHtml('Loan statement ' + l.id, el('modalBody').innerHTML)}, {label:'Close', act:'close'}]);
}

function loanReceipts(l){
  const rows = paysOfLoan(l.id).filter(p=>p.type !== 'Missed').slice(0,12);
  openModal('Receipts', l.id + ' · ' + rows.length + ' payments',
    rows.map(p=>`<div class="lrow">
      <div class="lic" style="background:var(--green-soft);color:#157A50;font-size:9px">${p.type==='Fees'?'FEE':'RC'}</div>
      <div><div class="lt">${p.id} · ${mk(p.amount)}</div>
        <div class="ls">${fmtDate(p.date)} · ${p.type} · ${esc(p.method||'—')}</div></div>
      <div class="lr"><span class="badge b-ok">${p.type}</span></div>
    </div>`).join('') || '<div class="empty">No receipts on this facility.</div>',
    [{label:'Close', act:'close'}]);
}

function wireLoanAccounts(){
  el('loanCust').addEventListener('change', ()=>{ LOAN.cust = el('loanCust').value; LOAN.sel = null; renderLoanAccounts(); });
  el('loanTabs').querySelectorAll('[data-lt]').forEach(b=>{
    b.onclick = ()=>{
      LOAN.tab = b.dataset.lt || '';
      el('loanTabs').querySelectorAll('[data-lt]').forEach(x=>x.classList.toggle('on', x === b));
      renderLoanAccounts();
    };
  });
}

/* ===================== 7 · REPAYMENTS ===================== */
const REP = {cust: CUSTOMERS[0].no, tab:'', page:1, per:10};

function repRows(){
  const c = cust(el('repCust').value || REP.cust);
  REP.cust = c.no;
  const all = paysOf(c.no);
  const map = {
    Principal: p=>p.principal > 0, Interest: p=>p.interest > 0,
    Fees: p=>p.fees > 0, Penalty: p=>p.penalty > 0,
    Missed: p=>p.type === 'Missed', Partial: p=>p.type === 'Partial', Advance: p=>p.type === 'Advance'
  };
  return all.filter(p=> !REP.tab || (map[REP.tab] ? map[REP.tab](p) : true));
}

function renderRepayments(){
  const c = cust(el('repCust').value || REP.cust);
  REP.cust = c.no;
  const all = paysOf(c.no);
  const paid = all.filter(p=>p.type !== 'Missed');
  const rows = repRows();
  const pages = Math.max(1, Math.ceil(rows.length/REP.per));
  if(REP.page > pages) REP.page = pages;
  const slice = rows.slice((REP.page-1)*REP.per, REP.page*REP.per);

  el('repTiles').innerHTML = [
    {l:'Total paid', v:mk2(sum(paid, p=>p.amount)), s: paid.length + ' receipts', k:'gold'},
    {l:'Principal repaid', v:mk2(sum(paid, p=>p.principal)), s:'Reduces the balance'},
    {l:'Interest paid', v:mk2(sum(paid, p=>p.interest)), s:'Cost of the facilities'},
    {l:'Fees & penalties', v:mk2(sum(paid, p=>p.fees + p.penalty)), s:'Processing fees and late penalties', k: sum(paid,p=>p.fees+p.penalty) ? 'red' : ''},
    {l:'Missed payments', v:nf(all.filter(p=>p.type === 'Missed').length), s:'Unpaid instalments on record'},
    {l:'Partial payments', v:nf(all.filter(p=>p.type === 'Partial').length), s:'Short payments made'}
  ].map(t=>`<div class="kpi ${t.k||''}"><div class="kl">${t.l}</div><div class="kv">${t.v}</div>
    <div class="ks">${t.s}</div></div>`).join('');

  let running = Math.round(sum(paid, p=>p.principal));
  el('repBody').innerHTML = slice.map(p=>{
    const missed = p.type === 'Missed';
    return `<tr>
      <td style="white-space:nowrap">${fmtShort(p.date)}</td>
      <td class="mono" style="font-size:9.5px">${p.id}</td>
      <td class="mono" style="font-size:9.5px">${p.loan}</td>
      <td class="num">${missed ? '—' : nf(p.amount)}</td>
      <td class="num">${p.principal ? nf(p.principal) : '—'}</td>
      <td class="num">${p.interest ? nf(p.interest) : '—'}</td>
      <td class="num">${(p.fees + p.penalty) ? nf(p.fees + p.penalty) : '—'}</td>
      <td><span class="badge ${missed?'b-rej':p.type==='Partial'?'b-await':p.type==='Advance'?'b-conf':'b-ok'}">${p.type}</span></td>
      <td class="num">${missed ? '—' : nf(exposure(c.no))}</td>
      <td style="text-align:right">${missed ? '' : `<button class="btn btn-ghost" data-rc="${p.id}">Receipt</button>`}</td>
    </tr>`;
  }).join('') || '<tr><td colspan="10" class="empty">No repayments recorded for this customer.</td></tr>';
  el('repBody').querySelectorAll('[data-rc]').forEach(b=>{
    b.onclick = ()=>{
      const p = PAYMENTS.find(x=>x.id === b.dataset.rc);
      openModal('Payment receipt', p.id + ' · ' + fmtDate(p.date),
        `<div class="stmt">
          <div class="sh"><div class="avatar-lg">GF</div>
            <div><div style="font-size:12px;font-weight:800">GOLDEN FINANCIAL SERVICES</div>
              <div style="font-size:9.5px;color:var(--muted)">Official receipt · ${esc(c.name)}</div></div></div>
          <div class="srow"><span>Customer</span><b>${c.no}</b></div>
          <div class="srow"><span>Loan</span><b>${p.loan}</b></div>
          <div class="srow"><span>Received</span><b>${mk(p.amount)}</b></div>
          <div class="srow"><span>Principal</span><b>${mk(p.principal)}</b></div>
          <div class="srow"><span>Interest</span><b>${mk(p.interest)}</b></div>
          <div class="srow"><span>Fees / penalty</span><b>${mk(p.fees + p.penalty)}</b></div>
          <div class="srow"><span>Channel</span><b>${esc(p.method || '—')}</b></div>
          <div class="stot"><span>Total received</span><span>${mk(p.amount)}</span></div>
        </div>`,
        [{label:'Print', act:()=>printHtml('Receipt ' + p.id, el('modalBody').innerHTML)}, {label:'Close', act:'close'}]);
    };
  });

  el('repPager').innerHTML = `
    <span>Showing ${rows.length ? (REP.page-1)*REP.per+1 : 0}–${Math.min(REP.page*REP.per, rows.length)} of ${rows.length}</span>
    <button id="repPrev" ${REP.page===1?'disabled':''}>‹ Prev</button>
    <button id="repNext" ${REP.page===pages?'disabled':''}>Next ›</button>`;
  if(el('repPrev')) el('repPrev').onclick = ()=>{ REP.page--; renderRepayments(); };
  if(el('repNext')) el('repNext').onclick = ()=>{ REP.page++; renderRepayments(); };

  const loans = liveLoansOf(c.no);
  const onTime = all.filter(p=>p.type !== 'Missed' && p.type !== 'Fees' && p.type !== 'Penalty').length;
  const missed = all.filter(p=>p.type === 'Missed').length;
  const punctual = onTime ? Math.max(0, 100 - Math.round(missed/Math.max(1,onTime+missed)*100)) : 0;
  el('repBehaviour').innerHTML = `
    <div class="lrow"><div class="lic" style="background:var(--green-soft);color:#157A50;font-size:9px">%</div>
      <div><div class="lt">Punctuality</div><div class="ls">Payments made on or before the due date</div></div>
      <div class="lr"><b>${punctual}%</b></div></div>
    <div class="meter ${punctual>=80?'green':punctual>=50?'':'red'}"><i style="width:${punctual}%"></i></div>
    <div class="lrow" style="margin-top:8px"><div class="lic" style="background:var(--gold-soft);color:var(--gold-dark);font-size:9px">✓</div>
      <div><div class="lt">Payments recorded</div><div class="ls">Across ${loans.length} live facilit${loans.length===1?'y':'ies'}</div></div>
      <div class="lr"><b>${onTime}</b></div></div>
    <div class="lrow"><div class="lic" style="background:var(--red-soft);color:#B32C2C;font-size:9px">!</div>
      <div><div class="lt">Missed instalments</div><div class="ls">Book average is 6% of due instalments</div></div>
      <div class="lr"><b>${missed}</b></div></div>
    <div class="lrow"><div class="lic" style="background:#EAF1FE;color:#2456C4;font-size:9px">i</div>
      <div><div class="lt">Book punctuality</div><div class="ls">Every customer on the register</div></div>
      <div class="lr"><b>${bookPunctuality()}%</b></div></div>`;

  const receipts = all.filter(p=>p.type !== 'Missed').slice(0,8);
  el('repRcCount').textContent = receipts.length;
  el('repReceipts').innerHTML = receipts.map(p=>`
    <div class="lrow"><div class="lic" style="background:var(--green-soft);color:#157A50;font-size:9px">${fmtShort(p.date)}</div>
      <div><div class="lt">${p.id} · ${mk(p.amount)}</div>
        <div class="ls">${p.loan} · ${p.type} · ${esc(p.method||'—')}</div></div>
      <div class="lr"><button class="btn btn-ghost" data-rc2="${p.id}">View</button></div></div>`).join('') ||
    '<div class="empty">No receipts yet.</div>';
  el('repReceipts').querySelectorAll('[data-rc2]').forEach(b=>{
    b.onclick = ()=>{
      REP.tab = ''; el('repTabs').querySelectorAll('[data-rt]').forEach(x=>x.classList.toggle('on', !x.dataset.rt));
      REP.page = 1; renderRepayments();
      const row = el('repBody').querySelector(`[data-rc="${b.dataset.rc2}"]`);
      if(row) row.click();
    };
  });
}

function bookPunctuality(){
  const all = PAYMENTS.filter(p=>p.type !== 'Fees' && p.type !== 'Penalty');
  const missed = all.filter(p=>p.type === 'Missed').length;
  return all.length ? Math.max(0, 100 - Math.round(missed/all.length*100)) : 100;
}

function repaymentStatement(){
  const c = cust(el('repCust').value || REP.cust);
  const pays = paysOf(c.no).slice(0, 40);
  openModal('Repayment statement', c.no + ' · ' + c.name + ' · generated ' + fmtDate(TODAY),
    `<div class="stmt">
      <div class="sh"><div class="avatar-lg">GF</div>
        <div><div style="font-size:12px;font-weight:800">GOLDEN FINANCIAL SERVICES</div>
          <div style="font-size:9.5px;color:var(--muted)">Repayment statement · ${esc(c.name)}</div></div>
        <div style="margin-left:auto;text-align:right;font-size:9.5px;color:var(--muted)">${c.no}<br>${fmtDate(TODAY)}</div></div>
      ${pays.map(p=>`<div class="srow"><span>${fmtShort(p.date)} · ${p.id} · ${p.loan}</span>
        <b>${p.type === 'Missed' ? 'MISSED' : mk(p.amount)}</b></div>`).join('')}
      <div class="stot"><span>Total received</span><span>${mk(sum(pays.filter(p=>p.type!=='Missed'), p=>p.amount))}</span></div>
      <div class="srow" style="margin-top:6px"><span>Outstanding exposure</span><b>${mk(exposure(c.no))}</b></div>
      <div class="srow"><span>Arrears</span><b>${mk(arrearsOf(c.no))}</b></div>
    </div>`,
    [{label:'Print / PDF', act:()=>printHtml('Repayment statement ' + c.no, el('modalBody').innerHTML)}, {label:'Close', act:'close'}]);
}

function wireRepayments(){
  el('repCust').addEventListener('change', ()=>{ REP.cust = el('repCust').value; REP.page = 1; renderRepayments(); });
  el('repTabs').querySelectorAll('[data-rt]').forEach(b=>{
    b.onclick = ()=>{
      REP.tab = b.dataset.rt || ''; REP.page = 1;
      el('repTabs').querySelectorAll('[data-rt]').forEach(x=>x.classList.toggle('on', x === b));
      renderRepayments();
    };
  });
  el('repStatement').onclick = repaymentStatement;
  el('repExport').onclick = ()=>{
    const c = cust(el('repCust').value || REP.cust);
    const rows = paysOf(c.no).map(p=>[p.date, p.id, p.loan, p.amount, p.principal, p.interest, p.fees, p.penalty, p.type, p.method]);
    exportRows('repayments-' + c.no.toLowerCase(),
      ['Date','Receipt','Loan','Amount','Principal','Interest','Fees','Penalty','Type','Channel'],
      rows, 'Repayment history — ' + c.name);
  };
}

</script>
