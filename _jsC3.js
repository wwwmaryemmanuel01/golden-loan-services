
/* ============================================================
   ACTIONS
   ============================================================ */
function logChange(ref, from, to, by='C. Mwale'){
  state.changes.unshift({time:new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}),
    ref, from, to, by});
  state.changes = state.changes.slice(0,40);
}
function logAudit(ref, action, detail, outcome='Success'){
  state.audit.unshift([new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}),
    ref, action, 'C. Mwale', detail, '196.44.21.4', outcome]);
}
const findByRef = ref => state.disb.find(d=>d.ref===ref);
const stamp = () => new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});

function prepareLoan(app){
  const l = state.loans.find(x=>x.app===app);
  if(!l) return;
  el('prepLoan').value = app;
  fillPrep(app);
  el('prepRef').value = nextRef();
  document.getElementById('s3').scrollIntoView({behavior:'smooth', block:'start'});
  toast(`${l.cust} loaded into the preparation form`, 'info');
}

function submitPreparation(){
  const app = el('prepLoan').value;
  if(!app) return toast('Select an approved loan first', 'err');
  const l = state.loans.find(x=>x.app===app);
  const method = el('prepMethod').value;
  if(!method) return toast('Select a disbursement method', 'err');
  const ref = el('prepRef').value.trim() || nextRef();
  if(state.disb.some(d=>d.ref===ref)) return toast('That reference already exists', 'err');

  const f = calcFees(l.approved);
  const missing = missingDocs(l);
  const status = missing.length ? 'Draft' : 'Awaiting authorization';
  state.disb.unshift({
    ref, app:l.app, cust:l.cust, acct:l.acct, product:l.product, amount:l.approved, method,
    officer:l.officer, date:today, status, txn:'', activated:false, fees:f, net:f.net,
    preparedBy:'C. Mwale', authorizedBy:'', notes:el('prepNotes').value, attempts:0,
    reason: missing.length ? 'Missing requirements: ' + missing.join(', ') : ''
  });
  l.prepared = true;
  logChange(ref, null, status);
  logAudit(ref, 'Created', 'Prepared ' + method + ' release for ' + l.cust);
  state.notifs.unshift([stamp(), 'Credit Committee', 'In-app', `${ref} submitted for authorization`, 'Unread']);

  toast(status==='Draft'
    ? `${ref} saved as draft — ${missing.length} requirement(s) outstanding`
    : `${ref} submitted for authorization`, status==='Draft'?'info':'ok');
  el('prepLoan').value=''; fillPrep(''); el('prepRef').value=''; el('prepNotes').value=''; el('prepMethod').value='';
  el('prepBadge').textContent = status;
  renderAll();
}

function authorizeDisb(ref){
  const d = findByRef(ref); if(!d) return;
  if(d.net > 5000000){
    toast('Amount above your personal limit — routed to CFO', 'err');
    logAudit(ref, 'Authorization attempt', 'Above personal limit', 'Blocked');
    renderAudit();
    return;
  }
  const from = d.status;
  d.status = 'Authorized'; d.authorizedBy = 'C. Mwale';
  logChange(ref, from, 'Authorized');
  logAudit(ref, 'Authorized', 'Approved release of ' + mk(d.net));
  state.notifs.unshift([stamp(), d.officer, 'In-app', `${ref} authorized — ready for release`, 'Unread']);
  toast(`${ref} authorized`, 'ok');
  renderAll();
}

function rejectDisb(ref){
  const d = findByRef(ref); if(!d) return;
  const from = d.status;
  d.status = 'Rejected'; d.reason = 'Rejected by authorizer';
  const l = state.loans.find(x=>x.app===d.app); if(l) l.prepared = false;
  logChange(ref, from, 'Rejected');
  logAudit(ref, 'Rejected', 'Rejected release request');
  toast(`${ref} rejected`, 'err');
  renderAll();
}

function returnDisb(ref){
  const d = findByRef(ref); if(!d) return;
  const from = d.status;
  d.status = 'Draft';
  logChange(ref, from, 'Draft');
  logAudit(ref, 'Modified', 'Returned to preparer for correction');
  toast(`${ref} returned for correction`, 'info');
  renderAll();
}

function submitRecord(){
  const ref = el('recSel').value;
  if(!ref) return toast('Select an authorized disbursement', 'err');
  const txn = el('recTxn').value.trim();
  if(!txn) return toast('Enter the transaction reference', 'err');
  const d = findByRef(ref);
  const from = d.status;
  d.status = 'Processing';
  d.txn = txn;
  d.date = el('recDate').value || today;
  d.method = el('recMethod').value;
  d.net = +el('recAmount').value || d.net;
  d.notes = el('recNotes').value;
  d.attempts = (d.attempts||0)+1;
  logChange(ref, from, 'Processing');
  logAudit(ref, 'Created', `Release recorded · ${d.method} · ${txn}`);
  toast(`${ref} recorded — now processing`, 'ok');
  el('recSel').value=''; el('recCust').value=''; el('recTxn').value='';
  el('recFileName').textContent='No file selected'; el('recNotes').value='';
  renderAll();
}

function verifyOk(ref){
  const d = findByRef(ref); if(!d) return;
  const from = d.status;
  d.status = 'Successful';
  logChange(ref, from, 'Successful');
  logAudit(ref, 'Confirmed', 'Payment confirmed and matched to statement');
  state.notifs.unshift([stamp(), d.cust, 'SMS', `Disbursement ${ref} confirmed — funds credited`, 'Delivered']);
  toast(`${ref} marked successfully disbursed`, 'ok');
  verifSel = null;
  renderAll();
}

function verifyFail(ref){
  const d = findByRef(ref); if(!d) return;
  const from = d.status;
  d.status = 'Failed'; d.reason = 'Confirmation rejected — customer did not receive funds';
  logChange(ref, from, 'Failed');
  logAudit(ref, 'Confirmed', 'Confirmation rejected — payment disputed');
  toast(`${ref} moved to exceptions`, 'err');
  verifSel = null;
  renderAll();
}

function retryDisb(ref){
  const d = findByRef(ref); if(!d) return;
  d.attempts = (d.attempts||1)+1;
  d.reason = '';
  const from = d.status;
  d.status = 'Processing';
  logChange(ref, from, 'Processing');
  logAudit(ref, 'Modified', `Retried failed release (attempt ${d.attempts})`);
  toast(`${ref} retried — attempt ${d.attempts}`, 'info');
  renderAll();
}

function correctDisb(ref){
  const d = findByRef(ref); if(!d) return;
  openModal('Correct Disbursement Details', ref + ' · ' + d.cust, `
    <div class="form-grid">
      <div class="fg"><label>Recipient / account number</label><input id="corrAcct" value="${d.acct}" /></div>
      <div class="fg"><label>Payment method</label>
        <select id="corrMethod">${['Bank Transfer','Airtel Money','TNM Mpamba','Cash','Cheque']
          .map(m=>`<option ${m===d.method?'selected':''}>${m}</option>`).join('')}</select></div>
      <div class="fg" style="grid-column:1/-1"><label>Correction notes</label>
        <textarea id="corrNotes" rows="2" placeholder="Explain the correction for the audit trail"></textarea></div>
    </div>
    <div class="note gold" style="margin-top:10px">Corrections above MK 1,000,000 restart authorization.</div>`,
    [{label:'Cancel', cls:'btn-ghost', act:'close'},
     {label:'Save & re-submit', cls:'btn-gold', act:()=>{
        d.method = el('corrMethod').value;
        d.reason = 'Corrected: ' + (el('corrNotes').value || 'recipient details updated');
        const from = d.status;
        d.status = 'Awaiting authorization';
        logChange(ref, from, 'Awaiting authorization');
        logAudit(ref, 'Modified', 'Corrected disbursement details — re-authorization requested');
        closeModal(); toast(`${ref} corrected and resubmitted for authorization`, 'ok');
        renderAll();
     }}]);
}

function cancelDisb(ref){
  const d = findByRef(ref); if(!d) return;
  const from = d.status;
  d.status = 'Cancelled';
  logChange(ref, from, 'Cancelled');
  logAudit(ref, 'Cancelled', 'Disbursement cancelled');
  toast(`${ref} cancelled`, 'info');
  renderAll();
}

function activateLoan(ref){
  const d = findByRef(ref); if(!d) return;
  d.activated = true;
  logChange(ref, 'Successful', 'Successful');
  logAudit(ref, 'Activated', `Loan account LN-AC-${ref.slice(-4)} activated · schedule generated`);
  state.notifs.unshift([stamp(), d.cust, 'SMS', `Your loan ${d.app} is active. First repayment due 30 Nov 2026.`, 'Delivered']);
  toast('Loan activated · repayment schedule generated', 'ok');
  actSel = null;
  renderAll();
}

/* ---------------- modal ---------------- */
function openModal(title, sub, body, actions=[]){
  el('modalTitle').textContent = title;
  el('modalSub').textContent = sub;
  el('modalBody').innerHTML = body;
  el('modalFoot').innerHTML = '';
  actions.forEach(a=>{
    const b = document.createElement('button');
    b.className = 'btn ' + (a.cls||'btn-ghost');
    b.textContent = a.label;
    b.onclick = a.act==='close' ? closeModal : a.act;
    el('modalFoot').appendChild(b);
  });
  el('modal').classList.add('on');
}
function closeModal(){ el('modal').classList.remove('on'); }

function viewDisbursement(ref){
  const d = findByRef(ref); if(!d) return;
  openModal(`Disbursement ${d.ref}`, `${d.cust} · ${d.app} · ${d.date}`, `
    <div class="grid g2" style="gap:10px">
      <div>
        <div class="kv"><span class="k">Status</span><span class="v">${chip(d.status)}</span></div>
        <div class="kv"><span class="k">Approved amount</span><span class="v">${mk(d.amount)}</span></div>
        <div class="kv"><span class="k">Total deductions</span><span class="v">− ${mk(d.fees.total)}</span></div>
        <div class="kv"><span class="k">Net payable</span><span class="v">${mk(d.net)}</span></div>
        <div class="kv"><span class="k">Method</span><span class="v">${d.method}</span></div>
        <div class="kv"><span class="k">Transaction ref</span><span class="v">${d.txn||'—'}</span></div>
      </div>
      <div>
        <div class="kv"><span class="k">Prepared by</span><span class="v">${d.preparedBy}</span></div>
        <div class="kv"><span class="k">Authorized by</span><span class="v">${d.authorizedBy||'—'}</span></div>
        <div class="kv"><span class="k">Attempts</span><span class="v">${d.attempts||1}</span></div>
        <div class="kv"><span class="k">Loan account</span><span class="v">LN-AC-${d.ref.slice(-4)}</span></div>
        <div class="kv"><span class="k">Activated</span><span class="v">${d.activated?'Yes':'No'}</span></div>
        <div class="kv"><span class="k">Notes</span><span class="v">${d.notes||'—'}</span></div>
      </div>
    </div>
    ${d.reason?`<div class="note red" style="margin-top:10px">${d.reason}</div>`:''}
    <div style="margin-top:12px"><div class="panel-title" style="font-size:12px;margin-bottom:6px">Lifecycle</div>
      <div class="tl">
        <div class="tl-item"><b>Draft prepared</b><span>${d.preparedBy}</span></div>
        ${d.authorizedBy?`<div class="tl-item"><b>Authorized</b><span>${d.authorizedBy}</span></div>`:''}
        ${['Processing','Awaiting confirmation','Successful'].includes(d.status)
          ?`<div class="tl-item"><b>Released to ${d.method}</b><span>${d.txn||'—'}</span></div>`:''}
        ${d.status==='Successful'?`<div class="tl-item"><b>Payment confirmed</b><span>Matched to statement</span></div>`:''}
        ${d.activated?`<div class="tl-item"><b>Loan account activated</b><span>Schedule generated</span></div>`:''}
      </div>
    </div>`,
    [{label:'Close', cls:'btn-ghost', act:'close'}]);
}

function viewLoan(app){
  const l = state.loans.find(x=>x.app===app); if(!l) return;
  const f = calcFees(l.approved);
  const miss = missingDocs(l);
  openModal(`Approved Loan ${l.app}`, `${l.cust} · ${l.acct}`, `
    <div class="grid g2" style="gap:10px">
      <div>
        <div class="kv"><span class="k">Product</span><span class="v">${l.product}</span></div>
        <div class="kv"><span class="k">Approved amount</span><span class="v">${mk(l.approved)}</span></div>
        <div class="kv"><span class="k">Interest rate</span><span class="v">${l.rate}</span></div>
        <div class="kv"><span class="k">Term</span><span class="v">${l.term}</span></div>
      </div>
      <div>
        <div class="kv"><span class="k">Approved on</span><span class="v">${l.approvedOn}</span></div>
        <div class="kv"><span class="k">Officer</span><span class="v">${l.officer}</span></div>
        <div class="kv"><span class="k">Deductions</span><span class="v">− ${mk(f.total)}</span></div>
        <div class="kv"><span class="k">Net payable</span><span class="v">${mk(f.net)}</span></div>
      </div>
    </div>
    <div style="margin-top:10px">
      ${Object.entries(l.docs).map(([k,v])=>{
        const name = {agreement:'Signed loan agreement', id:'Customer ID', payslip:'Proof of income', guarantor:'Guarantor confirmation'}[k];
        return `<div class="check"><div class="ck ${v?'y':'n'}">${v?'✓':'✕'}</div><div><b>${name}</b></div></div>`;
      }).join('')}
    </div>
    ${miss.length?`<div class="note red" style="margin-top:8px">Missing: ${miss.join(', ')}</div>`:''}`,
    [{label:'Close', cls:'btn-ghost', act:'close'},
     {label:'Prepare disbursement', cls:'btn-gold', act:()=>{ closeModal(); prepareLoan(app); }}]);
}

function exportCSV(rows, name){
  const csv = rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], {type:'text/csv'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name; a.click();
  URL.revokeObjectURL(a.href);
  toast('Export ready · ' + name, 'ok');
}

/* ============================================================
   WIRING
   ============================================================ */
document.addEventListener('click', e=>{
  const t = e.target.closest('[data-act]');
  if(!t) return;
  const act = t.dataset.act, ref = t.dataset.ref;
  switch(act){
    case 'view-loan': viewLoan(ref); break;
    case 'prepare-loan': prepareLoan(ref); break;
    case 'view-disb': viewDisbursement(ref); break;
    case 'authorize': authorizeDisb(ref); break;
    case 'reject': rejectDisb(ref); break;
    case 'return': returnDisb(ref); break;
    case 'verif-open': verifSel = ref; renderVerifPanel();
      document.getElementById('s8').scrollIntoView({behavior:'smooth'}); break;
    case 'verify-ok': verifyOk(ref); break;
    case 'verify-fail': verifyFail(ref); break;
    case 'retry': retryDisb(ref); break;
    case 'correct': correctDisb(ref); break;
    case 'cancel': cancelDisb(ref); break;
    case 'act-open': actSel = ref; renderActivation(); break;
    case 'act-close': actSel = null; renderActivation(); break;
    case 'activate': activateLoan(ref); break;
    case 'reg-prev': regState.page = Math.max(1, regState.page-1); renderRegister(); break;
    case 'reg-next': regState.page++; renderRegister(); break;
    case 'filter-status':
      el('regStatus').value = ref; regState.page = 1; renderRegister();
      document.getElementById('s6').scrollIntoView({behavior:'smooth'}); break;
    case 'toggle-method': {
      const i = +t.dataset.idx;
      METHODS[i].enabled = !METHODS[i].enabled;
      renderMethods(); renderSettings();
      toast(`${METHODS[i].name} ${METHODS[i].enabled?'enabled':'disabled'}`, 'info');
      break;
    }
    case 'toggle': t.classList.toggle('on'); break;
    case 'doc-dl': toast(`Downloading “${ref}”…`, 'info'); break;
    case 'doc-print': toast(`Sending “${ref}” to printer…`, 'info'); break;
    case 'report-pdf': toast(`${ref} · PDF generated`, 'ok'); break;
    case 'report-xls': toast(`${ref} · Excel generated`, 'ok'); break;
    case 'report-csv':
      exportCSV([['Reference','Customer','Amount','Net','Method','Status'],
        ...state.disb.map(d=>[d.ref,d.cust,d.amount,d.net,d.method,d.status])],
        ref.toLowerCase().replace(/[^a-z]+/g,'-') + '.csv');
      break;
  }
});

el('modalClose').onclick = closeModal;
el('modal').addEventListener('click', e=>{ if(e.target.id==='modal') closeModal(); });
document.addEventListener('keydown', e=>{ if(e.key==='Escape') closeModal(); });
el('menuBtn').onclick = ()=> document.getElementById('sidebar').classList.toggle('open');

document.querySelectorAll('.nav-item').forEach(item=>{
  item.addEventListener('click', e=>{
    const page = item.dataset.page;
    if(['disbursements','dashboard','staff','notifications','reports'].includes(page)) return;   // real links
    e.preventDefault();
    toast('This module is queued for build.', 'info');
    document.getElementById('sidebar').classList.remove('open');
  });
});

/* scroll-spy */
const secs = [...document.querySelectorAll('.sec')];
const chips = [...document.querySelectorAll('.snav')];
const spy = ()=>{
  let cur = secs[0];
  for(const s of secs) if(s.getBoundingClientRect().top <= 150) cur = s;
  chips.forEach(c=>c.classList.toggle('on', c.getAttribute('href')==='#'+cur.id));
};
window.addEventListener('scroll', spy, {passive:true});
chips.forEach(c=>c.addEventListener('click', e=>{
  e.preventDefault();
  const t = document.querySelector(c.getAttribute('href'));
  if(t) window.scrollTo({top:t.offsetTop-112, behavior:'smooth'});
}));

/* filters */
['apprSearch','apprElig','apprProduct'].forEach(id=>{
  el(id).addEventListener('input', renderApproved);
  el(id).addEventListener('change', renderApproved);
});
el('apprClear').onclick = ()=>{ el('apprSearch').value=''; el('apprElig').value=''; el('apprProduct').value=''; renderApproved(); };
['regSearch','regFrom','regTo','regMethod','regStatus','regOfficer'].forEach(id=>{
  const h = ()=>{ regState.page=1; renderRegister(); };
  el(id).addEventListener('input', h); el(id).addEventListener('change', h);
});
el('regReset').onclick = ()=>{ ['regSearch','regFrom','regTo'].forEach(i=>el(i).value='');
  ['regMethod','regStatus','regOfficer'].forEach(i=>el(i).value=''); regState.page=1; renderRegister(); };
el('regExport').onclick = ()=>{
  const rows = filterRegister();
  exportCSV([['Reference','Date','Customer','Account','Loan','Amount','Net','Method','Officer','Status'],
    ...rows.map(d=>[d.ref,d.date,d.cust,d.acct,d.app,d.amount,d.net,d.method,d.officer,d.status])],
    'golden-disbursements-2026-10-30.csv');
};
el('regPrint').onclick = ()=> toast('Register sent to printer', 'info');
el('exportAll').onclick = ()=> el('regExport').click();
el('auditExport').onclick = ()=>{
  exportCSV([['Time','Reference','Action','User','Detail','IP','Outcome'], ...state.audit],
    'golden-disbursement-audit.csv');
};
['auditSearch','auditAction'].forEach(id=>{
  el(id).addEventListener('input', renderAudit);
  el(id).addEventListener('change', renderAudit);
});
el('auditReset').onclick = ()=>{ el('auditSearch').value=''; el('auditAction').value=''; renderAudit(); };

/* preparation */
el('prepLoan').addEventListener('change', e=>{
  fillPrep(e.target.value);
  el('prepRef').value = e.target.value ? nextRef() : '';
});
el('prepSubmit').onclick = submitPreparation;
el('prepClearBtn').onclick = ()=>{ el('prepLoan').value=''; fillPrep(''); el('prepRef').value='';
  el('prepMethod').value=''; el('prepNotes').value=''; };

/* recording */
el('recSel').addEventListener('change', e=> fillRecord(e.target.value));
el('recSubmit').onclick = submitRecord;
el('recClear').onclick = ()=>{ el('recSel').value=''; el('recCust').value=''; el('recTxn').value='';
  el('recAmount').value=''; el('recNotes').value=''; };
el('recUpload').onclick = ()=>{ el('recFileName').textContent = 'payment-slip-' + Date.now().toString().slice(-5) + '.jpg';
  toast('Payment evidence attached', 'ok'); };

/* fees */
['feeAmount','feeProc','feeIns','feeOther','feeWaive'].forEach(id=> el(id).addEventListener('input', renderFees));
el('feeRequestBtn').onclick = ()=> toast('Fee waiver request sent to credit committee', 'info');
el('feeHistoryBtn').onclick = ()=> openModal('Calculation History', 'Last 5 disbursement calculations', `
  <table class="tbl2"><thead><tr><th>Date</th><th class="num">Approved</th><th class="num">Deductions</th>
  <th class="num">Net</th><th>By</th></tr></thead>
  <tbody>${state.disb.slice(0,5).map(d=>`<tr><td class="tiny">${d.date}</td><td class="num">${mk(d.amount)}</td>
    <td class="num">${mk(d.fees.total)}</td><td class="num">${mk(d.net)}</td>
    <td class="tiny">${d.preparedBy}</td></tr>`).join('')}</tbody></table>`,
  [{label:'Close', cls:'btn-ghost', act:'close'}]);

/* documents */
el('docSelect').addEventListener('change', renderDocs);
el('docBundle').onclick = ()=> toast('Document bundle prepared for download', 'ok');

/* reconciliation */
el('reconRun').onclick = ()=>{ renderRecon(); toast('Reconciliation completed · 3 variances found', 'info'); };
el('runRecon').onclick = ()=>{ document.getElementById('s14').scrollIntoView({behavior:'smooth'});
  setTimeout(()=>toast('Reconciliation completed · 3 variances found', 'info'), 400); };

/* misc */
el('quickPrepare').onclick = ()=> document.getElementById('s3').scrollIntoView({behavior:'smooth'});
el('quickDisburse').onclick = ()=> document.getElementById('s5').scrollIntoView({behavior:'smooth'});
el('statusReset').onclick = ()=>{ el('regStatus').value=''; renderRegister(); renderStatus(); };
el('actAll').onclick = ()=> document.getElementById('s17').scrollIntoView({behavior:'smooth'});
el('notifRead').onclick = ()=>{ state.notifs = state.notifs.map(n=>[n[0],n[1],n[2],n[3],'Read']);
  renderNotifications(); toast('All notifications marked read', 'ok'); };
el('settingsSave').onclick = ()=> toast('Disbursement settings saved', 'ok');
el('settingsReset').onclick = ()=>{ renderSettings(); toast('Changes discarded', 'info'); };
el('bellBtn').onclick = ()=> document.getElementById('s16').scrollIntoView({behavior:'smooth'});
el('globalSearch').addEventListener('keydown', e=>{
  if(e.key==='Enter'){ el('regSearch').value = e.target.value; regState.page=1; renderRegister();
    document.getElementById('s6').scrollIntoView({behavior:'smooth'}); }
});

/* ============================================================
   BOOT
   ============================================================ */
function renderAll(){
  renderOverview(); renderApproved(); renderPrepOptions(); renderAuth(); renderRecord();
  renderRegister(); renderVerify(); renderVerifHist(); renderStatus(); renderFails();
  renderActivation(); renderDocs(); renderRecon(); renderNotifications(); renderAudit();
  renderMethods(); renderSettings();
}
renderFees(); renderFeeRules(); renderReports(); renderMethods(); renderSettings();
renderAll();
spy();
</script>
</body>
</html>
