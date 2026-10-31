/* ============================================================
   LOAN APPLICATIONS  (2/4) · verification & KYC, assessment,
   documents and the review / decision stage
   ============================================================ */

/* ===================== 4 · VERIFICATION & KYC ===================== */
const VER = {sel:null, tab:''};
const KYC_ORDER = ['identity','contact','address','employment','income','docs','loans','balances','history'];
function verQueueApps(){
  let rows = APPLICATIONS.filter(a=>['New','Awaiting Documents','Under Review'].includes(a.status) || a.stage==='Verification');
  if(VER.tab === 'pending') rows = rows.filter(a=>Object.values(a.kyc).includes('Pending'));
  if(VER.tab === 'flagged') rows = rows.filter(a=>Object.values(a.kyc).includes('Flagged'));
  if(VER.tab === 'done') rows = rows.filter(a=>checksDone(a) === 9);
  return rows.sort((x,y)=>x.date.localeCompare(y.date));
}
function renderVerification(){
  const rows = verQueueApps();
  const all = APPLICATIONS.filter(a=>['New','Awaiting Documents','Under Review'].includes(a.status) || a.stage==='Verification');
  el('verCount').textContent = all.filter(a=>checksDone(a) < 9).length + ' to verify';
  el('verFlagged').textContent = APPLICATIONS.filter(a=>checksFlagged(a)>0).length + ' flagged';

  el('verQueue').innerHTML = rows.length ? rows.map(a=>{
    const done = checksDone(a), flags = checksFlagged(a);
    return `<div class="appcard ${VER.sel===a.no?'on':''}" data-vsel="${a.no}">
      <div class="ah"><div class="lic" style="width:28px;height:28px;border-radius:8px;display:grid;
        place-items:center;background:var(--gold-soft);color:var(--gold-dark);font-size:10px;font-weight:800">${initials(a.cust)}</div>
        <div style="flex:1;min-width:0"><div class="anm">${a.cust}</div>
          <div class="ano">${a.no} · ${a.product}</div></div>
        <span class="chip ${statusTone(a.status)}">${a.status}</span></div>
      <div class="am"><span>Requested <b>${mk(a.amount)}</b></span><span>${done}/9 checks</span>
        ${flags?`<span style="color:#B32C2C;font-weight:700">${flags} flagged</span>`:''}
        <span>${fmtShort(a.date)}</span></div></div>`;
  }).join('') : '<div class="empty">Nothing in this view.</div>';
  el('verQueue').querySelectorAll('[data-vsel]').forEach(c=>{
    c.onclick = ()=>{ VER.sel = c.dataset.vsel; renderVerification(); };
  });

  const a = VER.sel ? appBy(VER.sel) : null;
  el('verScore').textContent = a ? checksDone(a)+' / 9' : '0 / 9';
  el('verSub').textContent = a ? `${a.no} · ${a.cust} · ${a.custId}` : 'Nothing selected';
  if(!a){
    el('verDetail').innerHTML = '<div class="empty">Pick an application from the queue.</div>';
    el('verHistory').innerHTML = '';
    renderVerHistory();
    return;
  }
  el('verDetail').innerHTML = `
    <div class="kv"><span class="k">Requested</span><span class="v big">${mk(a.amount)}</span></div>
    <div class="kv"><span class="k">Customer since</span><span class="v">${custBy(a.custId) ? 'Existing customer' : 'New customer'}</span></div>
    <div class="kv"><span class="k">NRC</span><span class="v">${a.nrc}</span></div>
    <div class="kv"><span class="k">Phone</span><span class="v">${a.phone}</span></div>
    <div class="minihead">Checks <span class="mini-tag">click a row to cycle: pending → verified → flagged</span></div>
    ${KYC_ORDER.map(k=>{
      const v = a.kyc[k];
      const cls = v==='Verified'?'y':v==='Flagged'?'w':'n';
      const icon = v==='Verified'?'✓':v==='Flagged'?'!':'–';
      const sub = {
        identity:'NRC sighted and matched to the applicant',
        contact:'Phone and email reachable, one call-back completed',
        address:'Physical address confirmed at the door or by a chief’s letter',
        employment:'Employer or business confirmed independently',
        income:'Payslip, bank statement or till records reconciled',
        docs:'Every required document present and legible',
        loans:'Existing facilities at Golden and other lenders listed',
        balances:'Outstanding balances confirmed with the credit bureau',
        history:'Repayment record over the last 12 months reviewed'
      }[k];
      return `<div class="check" data-kyc="${k}" style="cursor:pointer">
        <span class="ck ${cls}">${icon}</span>
        <div style="flex:1"><b>${KYC_LABELS[k]}</b><span class="s">${sub}</span></div>
        <span class="mini-tag ${v==='Verified'?'g':v==='Flagged'?'r':''}">${v}</span></div>`;
    }).join('')}
    <div class="fg" style="margin-top:10px"><label>Verification notes</label>
      <textarea id="verNotes" style="min-height:56px" placeholder="What was checked, who you spoke to, anything that does not add up">${a.verNote||''}</textarea></div>
    <div class="form-actions">
      <button class="btn btn-gold" id="verSave">Save results</button>
      <button class="btn btn-ghost" id="verProgress">Move to assessment</button>
    </div>`;
  el('verDetail').querySelectorAll('[data-kyc]').forEach(row=>{
    row.onclick = ()=>{
      const k = row.dataset.kyc;
      const order = {Pending:'Verified', Verified:'Flagged', Flagged:'Pending'};
      a.kyc[k] = order[a.kyc[k]] || 'Verified';
      logApp('Change', `${KYC_LABELS[k]} marked ${a.kyc[k]}`, a.no, a.kyc[k]==='Flagged'?'Warning':'Success');
      renderVerification();
    };
  });
  el('verSave').onclick = ()=>{
    a.verNote = el('verNotes').value;
    a.verifier = 'Memory Phiri';
    a.verifiedAt = TODAY + ' · ' + nowTime();
    logApp('Assessment','Verification results saved ('+checksDone(a)+'/9 verified)', a.no);
    renderVerification(); renderOverview();
    toast(`Verification saved for ${a.no} · ${checksDone(a)}/9 checks verified.`);
  };
  el('verProgress').onclick = ()=>{
    if(checksDone(a) < 9){ toast('Complete all nine checks before moving to assessment.','err'); return; }
    a.status = 'Assessment'; a.stage = 'Assessment'; a.moved = TODAY;
    a.verifier = 'Memory Phiri'; a.verifiedAt = TODAY + ' · ' + nowTime();
    logApp('Change','Application moved to assessment · verification complete', a.no);
    VER.sel = null; renderAll();
    toast(`${a.no} moved to assessment.`);
  };
  renderVerHistory();
}
function renderVerHistory(){
  const rows = APPLICATIONS.filter(a=>a.verifiedAt || checksDone(a)>0 || checksFlagged(a)>0)
    .sort((x,y)=>(y.verifiedAt||'').localeCompare(x.verifiedAt||''));
  el('verHistCount').textContent = rows.length;
  el('verHistory').innerHTML = rows.map(a=>`<tr>
    <td class="mono">${a.no}</td><td>${a.cust}</td>
    <td class="num">${checksDone(a)} / 9</td>
    <td>${checksFlagged(a)?`<span class="chip st-rej">${checksFlagged(a)} flagged</span>`:'<span style="color:var(--muted)">none</span>'}</td>
    <td style="font-size:10.5px">${a.verifier || '—'}</td>
    <td style="font-size:10.5px;white-space:nowrap">${a.verifiedAt || '—'}</td>
    <td><span class="chip ${checksFlagged(a)?'st-await':checksDone(a)===9?'st-ok':'st-draft'}">${
      checksFlagged(a)?'Needs attention':checksDone(a)===9?'Verified':checksDone(a)?'In progress':'Not started'}</span></td></tr>`).join('')
    || '<tr><td colspan="7" class="empty">No verification results recorded yet.</td></tr>';
}

/* ===================== 5 · ASSESSMENT ===================== */
const AS = {sel:null};
function facilitiesOf(custId){
  const c = custBy(custId);
  if(!c || !c.loans) return [];
  const seed = Number(custId.slice(-3));
  const amount = Math.round((c.income||200000) * (1.6 + (seed%5)/10));
  const dpd = [0,0,12,34][seed % 4];
  return [{
    no:'LN-2025-' + (300 + seed % 90), product:seed%2?'Business Boost':'Salary Advance',
    amount, outstanding: Math.round(amount*(0.35 + (seed%4)/10)), inst: Math.round(amount/12),
    dpd, status: dpd===0?'Current':dpd<30?'1–30 days':'31–60 days',
    paidOnTime: dpd===0, arrears: dpd*Math.round(amount/1200)
  }];
}
function asListApps(){
  return APPLICATIONS.filter(a=>a.stage==='Assessment' || a.status==='Assessment')
    .sort((x,y)=>x.date.localeCompare(y.date));
}
function renderAssessment(){
  const rows = asListApps();
  el('asQueueCount').textContent = rows.length + ' waiting';
  el('asList').innerHTML = rows.length ? rows.map(a=>`<div class="appcard ${AS.sel===a.no?'on':''}" data-asel="${a.no}">
      <div class="ah"><div style="flex:1;min-width:0"><div class="anm">${a.cust}</div>
        <div class="ano">${a.no} · ${a.product}</div></div>
        <span class="chip ${statusTone(a.status)}">${a.status}</span></div>
      <div class="am"><span>Requested <b>${mk(a.amount)}</b></span><span>${a.term} mo</span>
        <span>Income <b>${mk(a.income)}</b></span><span>Risk ${a.risk}</span></div></div>`).join('')
    : '<div class="empty">Nothing waiting for assessment.</div>';
  el('asList').querySelectorAll('[data-asel]').forEach(c=>{
    c.onclick = ()=>{ AS.sel = c.dataset.asel; loadAssessment(); };
  });

  const a = AS.sel ? appBy(AS.sel) : null;
  el('asSub').textContent = a ? `${a.no} · ${a.cust}` : 'Select an application';
  el('asRiskBadge').textContent = a ? 'Risk: ' + a.risk : 'No application selected';
  el('asRiskBadge').className = 'badge ' + (a ? (a.risk==='Low'?'b-ok':a.risk==='High'?'b-rej':'b-await') : 'b-draft');
  if(a) recalcAssessment(); else {
    el('asRec').innerHTML = '<div><b>Recommendation:</b> select an application to calculate one.</div>';
    el('asHistory').innerHTML = '<div class="empty">Select an application to load the applicant\'s history.</div>';
    el('asCharges').innerHTML = '<div class="empty">Select an application to price the loan.</div>';
  }
}
function loadAssessment(){
  const a = appBy(AS.sel); if(!a) return;
  const p = productBy(a.product);
  el('asIncome').value = a.income;
  el('asExpenses').value = a.expenses;
  el('asOblig').value = a.oblig || 0;
  el('asAmount').value = a.amount;
  el('asTerm').value = a.term;
  el('asRate').value = p.rate;
  el('asNotes').value = a.notes || '';
  el('asRiskPick').querySelectorAll('[data-risk]').forEach(c=>c.classList.toggle('on', c.dataset.risk===a.risk));
  renderAssessment();
}
function asModel(){
  const income = Number(el('asIncome').value)||0;
  const expenses = Number(el('asExpenses').value)||0;
  const oblig = Number(el('asOblig').value)||0;
  const amount = Number(el('asAmount').value)||0;
  const term = Number(el('asTerm').value)||1;
  const rate = Number(el('asRate').value)||0;
  const inst = pmt(amount, rate, term);
  const total = totalPayable(amount, rate, term);
  const net = Math.max(1, income - expenses);
  const dti = Math.round((inst + oblig)/net*100);
  return {income, expenses, oblig, amount, term, rate, inst, total, net, dti};
}
function recalcAssessment(){
  const m = asModel();
  const a = appBy(AS.sel);
  el('asInst').textContent = mk(m.inst);
  el('asTotal').textContent = mk(m.total);
  el('asDti').textContent = m.dti + '%';
  el('asDti').style.color = m.dti<=35?'#157A50':m.dti<=50?'#9A6A0D':'#B32C2C';
  const bar = el('asDtiBar');
  bar.className = 'meter ' + (m.dti<=35?'green':m.dti<=50?'':'red');
  bar.querySelector('i').style.width = clamp(m.dti,0,100)+'%';
  el('asDtiLegend').innerHTML = `<b><i style="background:#1E9E6A"></i>≤ 35% comfortable</b>
    <b><i style="background:#C9A227"></i>36–50% tight</b><b><i style="background:#D93F3F"></i>&gt; 50% over policy</b>`;

  const fac = facilitiesOf(a.custId);
  const rec = m.dti<=35 ? 'Approve as requested' : m.dti<=50 ? 'Approve at a reduced amount' : 'Decline or require a guarantor and a smaller amount';
  const suggested = m.dti<=35 ? m.amount : Math.max(productBy(a.product).min, Math.round(m.amount*(35/m.dti)/10000)*10000);
  el('asRec').innerHTML = `<div><b>Recommendation:</b> ${rec}.<br>
    Affordability supports an instalment of about ${mk(Math.round(m.net*0.35))} against net income ${mk(m.net)};
    suggested approved amount <b>${mk(suggested)}</b> over ${m.term} months at ${m.rate}%.</div>`;

  el('asHistory').innerHTML = fac.length ? fac.map(f=>`
    <div class="lrow"><div class="lic" style="background:${f.dpd?'#FDECEC':'#E7F6EF'};color:${f.dpd?'#B32C2C':'#157A50'}">${f.dpd?'!':'✓'}</div>
      <div><div class="lt">${f.no} · ${f.product}</div>
        <div class="ls">${mk(f.amount)} · outstanding ${mk(f.outstanding)} · ${f.status}</div></div>
      <div class="lr"><span class="mini-tag ${f.dpd?'r':'g'}">${f.dpd?f.dpd+' days late':'On time'}</span></div></div>`).join('')
    : '<div class="note"><div>No existing facilities at Golden. First-time borrower — bureau check is the only external reference.</div></div>';
  el('asHistory').innerHTML += `
    <div class="minihead">Repayment record</div>
    ${fac.map(f=>`<div class="kv"><span class="k">${f.no} on-time payments</span>
      <span class="v">${f.paidOnTime ? '18 of 18' : '11 of 18'}</span></div>
      <div class="kv"><span class="k">Arrears on record</span><span class="v" style="color:${f.arrears?'#B32C2C':'#157A50'}">${f.arrears?mk(f.arrears):'None'}</span></div>`).join('')
      || '<div class="kv"><span class="k">Repayment record</span><span class="v">No history</span></div>'}`;

  const fee = Math.round(m.amount*productBy(a.product).fee/100);
  const insurance = Math.round(m.amount*0.01);
  el('asCharges').innerHTML = `
    <div class="kv"><span class="k">Amount requested</span><span class="v big">${mk(m.amount)}</span></div>
    <div class="kv"><span class="k">Interest at ${m.rate}% × ${m.term} months</span><span class="v">${mk(m.total - m.amount)}</span></div>
    <div class="kv"><span class="k">Arrangement fee (${productBy(a.product).fee}%)</span><span class="v">${mk(fee)}</span></div>
    <div class="kv"><span class="k">Insurance (1%)</span><span class="v">${mk(insurance)}</span></div>
    <div class="kv"><span class="k">Total repayable</span><span class="v big">${mk(m.total + fee)}</span></div>
    <div class="kv"><span class="k">Instalment</span><span class="v">${mk(m.inst)}</span></div>
    <div class="note"><div>Fees are collected upfront; the instalment shown excludes the arrangement fee.</div></div>`;
}
function saveAssessment(){
  const a = AS.sel ? appBy(AS.sel) : null;
  if(!a){ toast('Select an application to assess.','err'); return; }
  const m = asModel();
  const risk = el('asRiskPick').querySelector('.choice.on')?.dataset.risk || a.risk;
  a.income = m.income; a.expenses = m.expenses; a.oblig = m.oblig;
  a.amount = m.amount; a.term = m.term; a.risk = risk;
  a.notes = el('asNotes').value;
  a.assess = {income:m.income, expenses:m.expenses, oblig:m.oblig, rate:m.rate, term:m.term,
    inst:m.inst, dti:m.dti, by:'Memory Phiri', date:TODAY, note:a.notes};
  a.status = 'Pending Approval'; a.stage = 'Review'; a.moved = TODAY;
  logApp('Assessment', `Assessment saved · DTI ${m.dti}% · risk ${risk} · recommended ${mk(m.amount)}`, a.no);
  AS.sel = null; renderAll(); gotoSec('s7');
  toast(`${a.no} assessed and sent for review · DTI ${m.dti}%.`);
}

/* ===================== 6 · DOCUMENTS ===================== */
const DOC = {app:null, tab:''};
const DOC_HIST = [
  ['29 Oct · 14:12','APP-2026-0190','NRC copy uploaded','Blessings Tembo'],
  ['29 Oct · 09:40','APP-2026-0188','Group certificate marked invalid','Linda Mhango'],
  ['28 Oct · 16:05','APP-2026-0191','Application form downloaded','Yamikani Banda'],
  ['27 Oct · 11:22','APP-2026-0187','Collateral valuation uploaded','Tadala Msonthi'],
  ['26 Oct · 10:08','APP-2026-0186','Bank statement reviewed','Yamakani Banda'.replace('Yamakani','Yamikani')]
];
function renderDocuments(){
  const open = openApps();
  const counts = Object.keys(DOC_LABELS).map(k=>({
    k, label:DOC_LABELS[k],
    received: APPLICATIONS.filter(a=>a.docs[k]==='Received').length,
    missing: APPLICATIONS.filter(a=>a.docs[k]==='Missing').length
  }));
  el('docTiles').innerHTML = counts.map(c=>`<div class="mcard">
    <div class="mh"><div class="mi">${c.k.slice(0,2).toUpperCase()}</div>
      <div><div class="mn">${c.label}</div><div class="md">${c.received} received · ${c.missing} missing</div></div></div>
    <div class="mv">${c.received}<small style="font-size:10px;color:var(--muted)"> / ${c.received+c.missing}</small></div>
    <div class="ms" style="color:${c.missing?'#B32C2C':'#157A50'};font-weight:700">
      ${c.missing?c.missing+' files waiting':'Complete'}</div></div>`).join('');

  const sel = el('docApp');
  if(!sel.dataset.filled){
    sel.innerHTML = open.map(a=>`<option value="${a.no}">${a.no} · ${a.cust}</option>`).join('');
    sel.dataset.filled = '1';
    sel.value = DOC.app || open[0]?.no || '';
  }
  DOC.app = sel.value || DOC.app;
  const a = DOC.app ? appBy(DOC.app) : open[0];
  if(a && !DOC.app){ DOC.app = a.no; sel.value = a.no; }
  el('docSub').textContent = a ? `${a.no} · ${a.cust}` : 'No application selected';
  const missing = a ? Object.entries(a.docs).filter(([,v])=>v!=='Received' && v!=='na') : [];
  const invalid = a ? Object.entries(a.docs).filter(([,v])=>v==='Invalid') : [];
  el('docMissingPill').textContent = (a ? missingDocs(a).length : 0) + ' missing';
  el('docAlertCount').textContent = missing.length + invalid.length;

  el('docChecklist').innerHTML = a ? Object.entries(a.docs).map(([k,v])=>{
    if(v==='na') return `<div class="docrow"><div class="di">–</div>
      <div class="dt"><b>${DOC_LABELS[k]}</b><span>Not applicable to this product</span></div>
      <div class="da"><span class="mini-tag">n/a</span></div></div>`;
    const cls = v==='Received'?'ok':v==='Invalid'?'inv':'miss';
    return `<div class="docrow">
      <div class="di ${cls}">${k.slice(0,3).toUpperCase()}</div>
      <div class="dt"><b>${DOC_LABELS[k]}</b>
        <span>${v==='Received'?'Received and reviewed':v==='Invalid'?'On file but not acceptable':'Not yet supplied'}</span></div>
      <div class="da">
        <button class="btn btn-ghost btn-sm" data-doc="${k}" data-act="rcv" style="padding:2px 7px;font-size:10px">Receive</button>
        <button class="btn btn-ghost btn-sm" data-doc="${k}" data-act="inval" style="padding:2px 7px;font-size:10px">Invalid</button>
        <button class="btn btn-ghost btn-sm" data-doc="${k}" data-act="down" style="padding:2px 7px;font-size:10px">File</button>
      </div></div>`;
  }).join('') : '<div class="empty">No open applications.</div>';
  el('docChecklist').querySelectorAll('[data-doc]').forEach(b=>{
    b.onclick = ()=>{
      const k = b.dataset.doc, act = b.dataset.act;
      if(act === 'down'){
        DOC_HIST.unshift([fmtShort(TODAY)+' · '+nowTime(), a.no, DOC_LABELS[k]+' downloaded', 'Memory Phiri']);
        logApp('Access','Document downloaded · '+DOC_LABELS[k], a.no);
        renderDocuments();
        toast(`${DOC_LABELS[k]} downloaded (sample file).`,'info');
        return;
      }
      a.docs[k] = act==='rcv' ? 'Received' : 'Invalid';
      DOC_HIST.unshift([fmtShort(TODAY)+' · '+nowTime(), a.no, DOC_LABELS[k]+(act==='rcv'?' marked received':' marked invalid'), 'Memory Phiri']);
      logApp('Document', DOC_LABELS[k]+(act==='rcv'?' received':' marked invalid'), a.no, act==='rcv'?'Success':'Warning');
      renderDocuments(); renderOverview();
      toast(`${DOC_LABELS[k]} ${act==='rcv'?'received':'marked invalid'} · ${a.no}.`, act==='rcv'?'ok':'info');
    };
  });

  el('docAlerts').innerHTML = missing.length ? missing.map(([k,v])=>`
    <div class="lrow"><div class="lic" style="background:${v==='Invalid'?'#FFF4E0':'#FDECEC'};color:${v==='Invalid'?'#9A6A0D':'#B32C2C'}">!</div>
      <div><div class="lt">${DOC_LABELS[k]}</div>
        <div class="ls">${v==='Invalid'?'Rejected — needs a replacement':'Not supplied'}</div></div>
      <div class="lr"><button class="btn btn-ghost btn-sm" data-req="${k}">Request</button></div></div>`).join('')
    : '<div class="note"><div>Every required document is on file for this application.</div></div>';
  el('docAlerts').querySelectorAll('[data-req]').forEach(b=>{
    b.onclick = ()=>{ requestDocuments(a, b.dataset.req); };
  });

  el('docHistory').innerHTML = DOC_HIST.slice(0,10).map(h=>`<tr>
    <td style="white-space:nowrap;font-size:10px">${h[0]}</td>
    <td class="mono">${h[1]}</td><td style="font-size:10.5px">${h[2]}</td>
    <td style="font-size:10.5px">${h[3]}</td></tr>`).join('');
}
function requestDocuments(a, onlyKey){
  const keys = onlyKey ? [onlyKey] : missingDocs(a);
  const list = keys.map(k=>'• '+DOC_LABELS[k]).join('\n');
  openModal('Request documents', `${a.no} · ${a.cust}`, `
    <div class="note"><div>The applicant is asked for the following by SMS and email. The file stays in
      <b>Awaiting Documents</b> until they arrive.</div></div>
    <div class="fg" style="margin-top:10px"><label>Documents requested</label>
      <textarea id="reqList" style="min-height:88px">${list || '• Loan application form'}</textarea></div>
    <div class="fg" style="margin-top:9px"><label>Channels</label>
      <select id="reqChannel"><option>SMS + Email</option><option>SMS only</option><option>Email only</option></select></div>`,
    [{label:'Cancel', act:'close'}, {label:'Send request', cls:'btn-gold', act:()=>{
      a.status = 'Awaiting Documents'; a.moved = TODAY;
      pushComm(a, 'documents', 'Documents requested: ' + (keys.join(', ') || 'application form'), el('reqChannel').value);
      logApp('Document','Missing documents requested · '+keys.length+' item(s)', a.no);
      closeModal(); renderAll();
      toast(`Document request sent to ${a.cust}.`);
    }}]);
}

/* ===================== 7 · REVIEW & DECISION ===================== */
const REV = {sel:null, tab:'review'};
function revQueueApps(){
  if(REV.tab === 'returned') return APPLICATIONS.filter(a=>a.status==='Returned for Correction');
  if(REV.tab === 'mine') return APPLICATIONS.filter(a=>a.officer==='Yamikani Banda' && ['Pending Approval','Assessment'].includes(a.status));
  return APPLICATIONS.filter(a=>a.status==='Pending Approval' || (a.stage==='Review' && a.decision && a.decision.decision==='Recommended'));
}
function renderReview(){
  const rows = revQueueApps();
  el('revCount').textContent = rows.length + ' awaiting review';
  el('revLate').textContent = rows.filter(isLate).length + ' past deadline';
  el('revQueue').innerHTML = rows.length ? rows.map(a=>`<div class="appcard ${REV.sel===a.no?'on':''}" data-rsel="${a.no}">
      <div class="ah"><div style="flex:1;min-width:0"><div class="anm">${a.cust}</div>
        <div class="ano">${a.no} · ${a.officer}</div></div>
        ${isLate(a)?'<span class="dl-pill late">late</span>':''}
        <span class="chip ${statusTone(a.status)}">${a.status}</span></div>
      <div class="am"><span>Requested <b>${mk(a.amount)}</b></span>
        <span>${a.term} mo</span><span>Risk ${a.risk}</span>
        ${a.assess?`<span>DTI <b>${a.assess.dti}%</b></span>`:''}</div></div>`).join('')
    : '<div class="empty">Nothing in this view.</div>';
  el('revQueue').querySelectorAll('[data-rsel]').forEach(c=>{
    c.onclick = ()=>{ REV.sel = c.dataset.rsel; renderReview(); };
  });

  const a = REV.sel ? appBy(REV.sel) : null;
  el('revSub').textContent = a ? `${a.no} · ${a.cust} · ${a.product}` : 'Nothing selected';
  el('revDtiPill').textContent = a && a.assess ? 'DTI ' + a.assess.dti + '%' : '—';
  if(!a){
    el('revPanel').innerHTML = '<div class="empty">Pick an application from the queue.</div>';
  } else {
    const p = productBy(a.product);
    const rec = a.assess || {rate:p.rate, term:a.term, inst:pmt(a.amount,p.rate,a.term), dti:dtiOf(a,pmt(a.amount,p.rate,a.term))};
    el('revPanel').innerHTML = `
      <div class="split" style="gap:14px">
        <div>
          <div class="kv"><span class="k">Requested</span><span class="v big">${mk(a.amount)}</span></div>
          <div class="kv"><span class="k">Term</span><span class="v">${a.term} months · ${a.freq}</span></div>
          <div class="kv"><span class="k">Instalment</span><span class="v">${mk(rec.inst)}</span></div>
          <div class="kv"><span class="k">DTI</span><span class="v">${rec.dti||0}%</span></div>
          <div class="kv"><span class="k">Risk</span><span class="v">${a.risk}</span></div>
        </div>
        <div>
          <div class="kv"><span class="k">Income</span><span class="v">${mk(a.income)}</span></div>
          <div class="kv"><span class="k">Expenses</span><span class="v">${mk(a.expenses)}</span></div>
          <div class="kv"><span class="k">Other obligations</span><span class="v">${mk(a.oblig||0)}</span></div>
          <div class="kv"><span class="k">Documents missing</span><span class="v">${missingDocs(a).length}</span></div>
          <div class="kv"><span class="k">KYC</span><span class="v">${checksDone(a)}/9</span></div>
        </div>
      </div>
      <div class="minihead">Officer assessment notes</div>
      <div class="note" style="margin-top:0"><div>${a.notes || 'No assessment notes recorded.'}</div></div>
      <div class="minihead">Recommended terms</div>
      <div class="form-grid">
        <div class="fg"><label>Amount</label><input id="rvAmount" type="number" value="${a.approval?.amount || a.amount}"></div>
        <div class="fg"><label>Rate (% / month)</label><input id="rvRate" type="number" step="0.1" value="${a.approval?.rate || p.rate}"></div>
        <div class="fg"><label>Term (months)</label><input id="rvTerm" type="number" value="${a.approval?.term || a.term}"></div>
      </div>
      <div class="fg" style="margin-top:9px"><label>Reviewer comments</label>
        <textarea id="rvNote" style="min-height:56px" placeholder="Why this decision — visible to the approver and in the audit trail">${a.reviewNote||''}</textarea></div>
      <div class="form-actions" style="flex-wrap:wrap">
        <button class="btn btn-green" id="rvApprove">Recommend approval</button>
        <button class="btn btn-red" id="rvReject">Reject</button>
        <button class="btn btn-ghost" id="rvReturn">Return for correction</button>
        <button class="btn btn-ghost" id="rvInfo">Request information</button>
      </div>`;
    el('rvApprove').onclick = ()=>reviewDecision(a, 'Approved');
    el('rvReject').onclick = ()=>reviewDecision(a, 'Rejected');
    el('rvReturn').onclick = ()=>reviewDecision(a, 'Returned');
    el('rvInfo').onclick = ()=>reviewDecision(a, 'Info');
  }
  renderRevRecords();
}
function reviewDecision(a, kind){
  const labels = {Approved:'Recommend approval', Rejected:'Reject application', Returned:'Return for correction', Info:'Request information'};
  const reasons = kind==='Rejected'
    ? ['Affordability below policy','Poor repayment history','Insufficient collateral','Incomplete or invalid documents','Existing arrears with Golden','Purpose not eligible']
    : ['Documents not legible','Income could not be confirmed','Guarantor details missing','Application form unsigned','Address not verifiable'];
  const amount = Number(el('rvAmount')?.value) || a.amount;
  const rate = Number(el('rvRate')?.value) || productBy(a.product).rate;
  const term = Number(el('rvTerm')?.value) || a.term;
  const note = el('rvNote')?.value || '';
  openModal(labels[kind], `${a.no} · ${a.cust}`, `
    ${kind==='Approved' ? `<div class="kv"><span class="k">Recommended amount</span><span class="v big">${mk(amount)}</span></div>
      <div class="kv"><span class="k">Rate / term</span><span class="v">${rate}% × ${term} months</span></div>
      <div class="kv"><span class="k">Instalment</span><span class="v">${mk(pmt(amount, rate, term))}</span></div>
      <div class="note" style="margin-top:8px"><div>Recommended terms go to the approval authority. Approved amounts above
        MK 1,000,000 need a second signature.</div></div>` : ''}
    <div class="fg" style="margin-top:10px"><label>${kind==='Approved'?'Confirmation note':'Reason'}</label>
      ${kind==='Approved'
        ? `<textarea id="decNote" style="min-height:52px">${note || 'Terms recommended as above.'}</textarea>`
        : `<select id="decReason">${reasons.map(r=>`<option>${r}</option>`).join('')}</select>
           <textarea id="decNote" style="min-height:46px;margin-top:8px">${note}</textarea>`}</div>`,
    [{label:'Cancel', act:'close'}, {label:labels[kind], cls:kind==='Rejected'?'btn-red':'btn-gold', act:()=>{
      const reason = el('decReason') ? el('decReason').value : (el('decNote')?.value || '');
      const txt = el('decNote')?.value || reason;
      a.decision = {by:'Chikondi Mwale', date:TODAY, decision:kind==='Info'?'Info requested':kind, note:txt||reason};
      a.reviewNote = txt;
      if(kind === 'Approved'){
        a.status = 'Awaiting Authorization'; a.stage = 'Approval';
        a.recommend = {amount, rate, term, by:'Chikondi Mwale', date:TODAY};
        logApp('Decision', `Recommended approval at ${mk(amount)} · ${rate}% × ${term}m`, a.no);
        toast(`${a.no} recommended for approval at ${mk(amount)} · awaiting authorization.`);
      } else if(kind === 'Rejected'){
        a.status = 'Rejected'; a.stage = 'Closed'; a.decision.reason = reason;
        logApp('Decision', 'Rejected · ' + reason, a.no);
        pushComm(a,'rejected','Application rejected — ' + reason, 'SMS');
        toast(`${a.no} rejected · ${reason}.`,'info');
      } else if(kind === 'Returned'){
        a.status = 'Returned for Correction'; a.stage = 'Review';
        logApp('Decision','Returned for correction · '+reason, a.no);
        pushComm(a,'correction','Correction required — ' + reason, 'SMS');
        toast(`${a.no} returned to the officer.`,'info');
      } else {
        a.status = 'Awaiting Documents'; a.stage = 'Verification';
        logApp('Decision','Additional information requested · '+reason, a.no);
        pushComm(a,'documents','Additional information requested — ' + reason, 'SMS');
        toast(`Information request sent to ${a.cust}.`,'info');
      }
      closeModal(); REV.sel = null; renderAll();
    }}]);
}
function renderRevRecords(){
  const rows = APPLICATIONS.filter(a=>a.decision)
    .sort((x,y)=>String(y.decision.date).localeCompare(String(x.decision.date)));
  el('revRecCount').textContent = rows.length;
  el('revRecords').innerHTML = rows.map(a=>`<tr>
    <td class="mono">${a.no}</td><td>${a.cust}</td>
    <td><span class="chip ${a.decision.decision==='Rejected'?'st-rej':a.decision.decision==='Returned'?'st-await':'st-ok'}">${a.decision.decision}</span></td>
    <td class="num">${nf(a.approval?.amount || a.recommend?.amount || a.amount)}</td>
    <td style="font-size:10.5px">${a.decision.by}</td>
    <td style="font-size:10.5px;white-space:nowrap">${fmtShort(a.decision.date)}</td>
    <td class="msgcol" style="font-size:10px;color:var(--muted)">${a.decision.reason || a.decision.note || '—'}</td></tr>`).join('')
    || '<tr><td colspan="7" class="empty">No decisions recorded yet.</td></tr>';
}
