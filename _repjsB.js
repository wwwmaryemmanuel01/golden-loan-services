/* ============================================================
   REPAYMENTS  (2/4) · verification, allocation, schedules,
   collections, arrears and payment methods
   ============================================================ */

/* ===================== 4 · PAYMENT VERIFICATION ===================== */
const VER = {method:'All', sel:null};
const METHODS = ['Cash','Bank transfer','Airtel Money','TNM Mpamba','Cheque'];
function renderVerMethods(){
  const counts = METHODS.map(m=>({m, n:pendingList().filter(p=>p.method===m).length,
    v:sum(pendingList().filter(p=>p.method===m), p=>p.amount)}));
  const all = {m:'All', n:pendingList().length, v:sum(pendingList(),p=>p.amount)};
  el('verMethods').innerHTML = [all, ...counts].map(c=>`
    <div class="mcard" data-vm="${c.m}" style="cursor:pointer;${VER.method===c.m?'border-color:var(--gold);background:var(--gold-soft)':''}">
      <div class="mh"><div class="mi">${c.m==='All'?'ALL':c.m.split(' ').map(w=>w[0]).join('').slice(0,2)}</div>
        <div><div class="mn">${c.m}</div><div class="md">${c.n} pending</div></div></div>
      <div class="mv">${mk(c.v)}</div>
      <div class="ms">Awaiting confirmation</div></div>`).join('');
  el('verMethods').querySelectorAll('[data-vm]').forEach(c=>{
    c.onclick = ()=>{ VER.method = c.dataset.vm; renderVerMethods(); renderVerQueue(); };
  });
  el('verCount').textContent = pendingList().length + ' pending';
  el('verValue').textContent = mk(sum(pendingList(),p=>p.amount));
}
function renderVerQueue(){
  const rows = pendingList().filter(p=>VER.method==='All' || p.method===VER.method);
  el('verQueue').innerHTML = rows.length ? rows.map(p=>`
    <div class="vcard${VER.sel===p.id?' on':''}" data-vsel="${p.id}" style="cursor:pointer">
      <div class="vh">
        <span class="chip ${statusChip(p.status)}">${p.method}</span>
        <b class="vt">${p.cust}</b>
        <span style="font-size:10px;color:var(--muted);font-family:ui-monospace,monospace">${p.receipt}</span>
        <span style="margin-left:auto;font-size:12.5px;font-weight:800;font-variant-numeric:tabular-nums">${mk(p.amount)}</span>
      </div>
      <div class="vs">${p.loan} · recorded ${fmtShort(p.date)} ${p.time} by ${p.officer}
        ${p.ref? ' · ref '+p.ref : ' · no reference'}</div>
      <div class="vg">
        <div><span>Reference</span><b>${p.ref || '—'}</b></div>
        <div><span>Evidence</span><b>${p.evidence || 'none'}</b></div>
        <div><span>Waiting</span><b>${daysBetween(p.date, TODAY)||0}d</b></div>
      </div>
    </div>`).join('') : `<div class="empty">Nothing pending for ${VER.method.toLowerCase()}.</div>`;
  el('verQueue').querySelectorAll('[data-vsel]').forEach(c=>{
    c.onclick = ()=>{ VER.sel = c.dataset.vsel; renderVerQueue(); renderVerDetail(); };
  });
  if(!rows.some(p=>p.id===VER.sel) && rows.length) { VER.sel = rows[0].id; renderVerQueue(); }
  renderVerDetail();
}
function renderVerDetail(){
  const p = REPAYMENTS.find(x=>x.id===VER.sel);
  if(!p){
    el('verDetailSub').textContent = 'Nothing selected';
    el('verDetail').innerHTML = '<div class="empty">Select a pending payment to review it.</div>';
    return;
  }
  el('verDetailSub').textContent = p.receipt + ' · ' + p.method;
  const l = loanBy(p.loan) || {};
  const refOk = p.method==='Cash' ? true : (p.ref && p.ref.length >= 6);
  el('verDetail').innerHTML = `
    <div class="kv"><span class="k">Customer</span><span class="v">${p.cust}</span></div>
    <div class="kv"><span class="k">Loan</span><span class="v">${p.loan}</span></div>
    <div class="kv"><span class="k">Amount</span><span class="v big">${mk2(p.amount)}</span></div>
    <div class="kv"><span class="k">Method</span><span class="v">${p.method}</span></div>
    <div class="kv"><span class="k">Reference</span><span class="v">${p.ref || '—'}</span></div>
    <div class="kv"><span class="k">Recorded</span><span class="v">${fmtDate(p.date)} · ${p.time}</span></div>
    <div class="kv"><span class="k">Recorded by</span><span class="v">${p.officer}</span></div>
    <div class="kv"><span class="k">Loan balance</span><span class="v">${mk(l.outstanding||0)}</span></div>
    <div class="check" style="margin-top:10px">
      <span class="ck ${refOk?'y':'w'}">${refOk?'✓':'!'}</span>
      <div style="flex:1"><b>Transaction reference</b><span class="s">${p.ref?'Format looks valid · confirm against the channel statement':'A reference is expected for non-cash payments'}</span></div>
    </div>
    <div class="check">
      <span class="ck ${p.evidence?'y':'w'}">${p.evidence?'✓':'!'}</span>
      <div style="flex:1"><b>Payment evidence</b><span class="s">${p.evidence || 'No file attached — ask the cashier for the slip'}</span></div>
    </div>
    <div class="check">
      <span class="ck y">✓</span>
      <div style="flex:1"><b>Duplicate check</b><span class="s">No other payment with this reference or amount today</span></div>
    </div>
    ${p.evidence?`<div class="evidence" style="margin-top:10px">
      <div class="ei">${p.evidence.split('.').pop().toUpperCase()}</div>
      <div><b>${p.evidence}</b><span>Uploaded with the payment · sample file</span></div>
      <button class="btn btn-ghost btn-sm" data-viewdoc="1" style="margin-left:auto">View</button></div>`:''}
    <div class="fg" style="margin-top:11px"><label>Verification notes</label>
      <textarea id="verNotes" style="min-height:52px" placeholder="What you checked and where…"></textarea></div>
    <div class="form-actions">
      <button class="btn btn-green" id="verConfirm">Confirm payment</button>
      <button class="btn btn-red" id="verReject">Reject</button>
    </div>`;
  const viewBtn = el('verDetail').querySelector('[data-viewdoc]');
  if(viewBtn) viewBtn.onclick = ()=>openModal('Payment evidence', p.evidence,
    `<div class="drop" style="padding:34px">${p.evidence}<br>
      <span style="font-size:10px;color:var(--muted-2)">Sample attachment · image preview unavailable in this build</span></div>`,
    [{label:'Close', act:'close'}]);
  el('verConfirm').onclick = ()=>verifyPayment(p);
  el('verReject').onclick = ()=>rejectModal(p);
}
function verifyPayment(p){
  const notes = el('verNotes') ? el('verNotes').value.trim() : '';
  p.status = 'Verified'; p.verifiedBy = 'Thandiwe Kamanga'; p.verifiedAt = TODAY + ' · ' + nowTime();
  p.notes = notes || p.notes;
  logPay('Verification', 'Payment verified · '+p.receipt, p.receipt, p.amount);
  VER.sel = null;
  toast(`${p.receipt} verified · ${mk(p.amount)} ready for allocation.`);
  renderAll();
}
function rejectModal(p){
  openModal('Reject payment', p.receipt + ' · ' + mk(p.amount), `
    <div class="fg"><label>Reason for rejection</label>
      <select id="rejReason">
        <option>No matching transaction at the bank</option>
        <option>Reference does not exist on the channel statement</option>
        <option>Amount differs from the confirmed amount</option>
        <option>Duplicate of an earlier payment</option>
        <option>Evidence unreadable or missing</option>
      </select></div>
    <div class="fg" style="margin-top:9px"><label>Notes</label>
      <textarea id="rejNote" style="min-height:52px" placeholder="Explain what the cashier must correct"></textarea></div>
    <div class="note red" style="margin-top:10px"><div>The payment stays in the register marked Rejected.
      It does not affect the loan balance and can be corrected with a new entry.</div></div>`,
    [{label:'Cancel', act:'close'}, {label:'Reject payment', cls:'btn-red', act:()=>{
      p.status = 'Rejected'; p.verifiedBy = 'Thandiwe Kamanga'; p.verifiedAt = TODAY + ' · ' + nowTime();
      p.rejReason = el('rejReason').value;
      p.notes = el('rejNote').value || p.rejReason;
      logPay('Verification','Payment rejected · '+p.receipt, p.receipt, p.amount, 'Warning');
      closeModal(); VER.sel = null;
      toast(`${p.receipt} rejected · ${p.rejReason}`,'info');
      renderAll();
    }}]);
}
function renderVerHistory(){
  const rows = REPAYMENTS.filter(p=>p.verifiedAt).slice(0,14);
  el('verHistory').innerHTML = rows.map(p=>`<tr>
    <td style="white-space:nowrap;font-size:10.5px">${p.verifiedAt}</td>
    <td style="font-family:ui-monospace,monospace;font-size:10px">${p.receipt}</td>
    <td>${p.cust}</td><td class="num">${nf(p.amount)}</td><td>${p.method}</td>
    <td><span class="chip ${p.status==='Rejected'?'st-rej':'st-ok'}">${p.status==='Rejected'?'Rejected':'Verified'}</span></td>
    <td>${p.verifiedBy || '—'}</td>
    <td class="msg" style="font-size:10px;color:var(--muted)">${p.notes || '—'}</td></tr>`).join('')
    || '<tr><td colspan="8" class="empty">No verifications yet.</td></tr>';
}

/* ===================== 5 · ALLOCATION ===================== */
const ALLOC = {sel:null};
function renderUnalloc(){
  const un = unallocList();
  el('unallocCount').textContent = un.length + ' unallocated';
  el('unallocBody').innerHTML = un.length ? un.map(p=>`<tr>
    <td style="font-family:ui-monospace,monospace;font-size:10px">${p.receipt}</td>
    <td>${p.cust}</td><td style="font-size:10px;color:var(--muted)">${p.loan}</td>
    <td class="num">${nf(p.amount)}</td>
    <td style="font-size:10px;white-space:nowrap">${p.verifiedAt || '—'}</td>
    <td style="text-align:right"><button class="btn btn-ghost btn-sm" data-asel="${p.id}"
      style="padding:2px 7px;font-size:10px">${ALLOC.sel===p.id?'Selected':'Allocate'}</button></td></tr>`).join('')
    : `<tr><td colspan="6" class="empty">Every verified payment has been allocated.</td></tr>`;
  el('unallocBody').querySelectorAll('[data-asel]').forEach(b=>{
    b.onclick = ()=>{ ALLOC.sel = b.dataset.asel; renderUnalloc(); renderAllocDetail(); };
  });
  renderAllocDetail();
  renderExcess();
  renderAllocHistory();
}
function renderAllocDetail(){
  const p = REPAYMENTS.find(x=>x.id===ALLOC.sel);
  if(!p){
    el('allocSub').textContent = 'No payment selected';
    el('allocDetail').innerHTML = '<div class="empty">Pick a verified payment from the list.</div>';
    return;
  }
  const l = loanBy(p.loan) || {};
  el('allocSub').textContent = p.receipt + ' · ' + mk(p.amount);
  el('allocDetail').innerHTML = `
    <div class="kv"><span class="k">Customer</span><span class="v">${p.cust}</span></div>
    <div class="kv"><span class="k">Loan</span><span class="v">${p.loan}</span></div>
    <div class="kv"><span class="k">Payment</span><span class="v big">${mk2(p.amount)}</span></div>
    <div class="kv"><span class="k">Loan balance</span><span class="v">${mk(l.outstanding||0)}</span></div>
    <div class="kv"><span class="k">Penalties outstanding</span><span class="v">${mk(l.penalty||0)}</span></div>
    <div class="kv"><span class="k">Overdue</span><span class="v" style="color:${l.dpd?'#B32C2C':'#157A50'}">${l.dpd?mk(overdueOf(l)):'None'}</span></div>`;
  autoFillAlloc(p);
  renderAllocSummary();
}
function autoFillAlloc(p){
  if(!p) return;
  const l = loanBy(p.loan) || {penalty:0, outstanding:0};
  const s = splitPayment(l, p.amount);
  el('allocPen').value = s.pen; el('allocFees').value = s.fees;
  el('allocInt').value = s.interest; el('allocPrin').value = s.principal;
}
function renderAllocSummary(){
  const p = REPAYMENTS.find(x=>x.id===ALLOC.sel);
  const pen=Number(el('allocPen').value)||0, fees=Number(el('allocFees').value)||0;
  const interest=Number(el('allocInt').value)||0, principal=Number(el('allocPrin').value)||0;
  const total = pen+fees+interest+principal;
  const amt = p ? p.amount : 0;
  const diff = amt - total;
  el('allocSummary').innerHTML = `
    <div class="allocbar">
      ${pen?`<span style="width:${pen/(total||1)*100}%;background:#D93F3F"></span>`:''}
      ${fees?`<span style="width:${fees/(total||1)*100}%;background:#E08C1E"></span>`:''}
      ${interest?`<span style="width:${interest/(total||1)*100}%;background:#2F6FED"></span>`:''}
      ${principal?`<span style="width:${principal/(total||1)*100}%;background:#1E9E6A"></span>`:''}
    </div>
    <div class="kv" style="margin-top:8px"><span class="k">Allocated</span><span class="v">${mk(total)}</span></div>
    <div class="kv"><span class="k">Unallocated / excess</span>
      <span class="v" style="color:${diff===0?'#157A50':diff<0?'#B32C2C':'#9A6A0D'}">${diff===0?'Fully allocated':mk(Math.abs(diff)) + (diff<0?' over':' to excess')}</span></div>`;
}
function applyAllocation(){
  const p = REPAYMENTS.find(x=>x.id===ALLOC.sel);
  if(!p){ toast('Select a payment first.','err'); return; }
  const pen=Number(el('allocPen').value)||0, fees=Number(el('allocFees').value)||0;
  const interest=Number(el('allocInt').value)||0, principal=Number(el('allocPrin').value)||0;
  const total = pen+fees+interest+principal;
  if(total <= 0){ toast('Enter an allocation amount.','err'); return; }
  if(total > p.amount){ toast('The allocation cannot exceed the payment amount.','err'); return; }
  const l = loanBy(p.loan) || {};
  p.alloc = {pen, fees, interest, principal};
  p.excess = p.amount - total;
  p.status = 'Allocated';
  p.inst = el('allocInst').value || null;
  if(l){
    l.outstanding = Math.max(0, l.outstanding - principal);
    l.penalty = Math.max(0, (l.penalty||0) - pen);
  }
  logPay('Allocation', `Allocated ${p.receipt} · P${principal} I${interest} F${fees} Pen${pen}`, p.receipt, total);
  ALLOC.sel = null;
  toast(`${p.receipt} allocated · principal ${mk(principal)} reduces the balance.`);
  renderAll();
}
function renderExcess(){
  const rows = REPAYMENTS.filter(p=>p.status==='Allocated' && p.excess > 0);
  el('excessList').innerHTML = (rows.length ? rows.map(p=>`<div class="lrow">
    <div class="lic" style="background:#FFF4E0;color:#9A6A0D">EX</div>
    <div><div class="lt">${p.cust} · ${p.receipt}</div>
      <div class="ls">Payment ${mk(p.amount)} · unallocated ${mk(p.excess)}</div></div>
    <div class="lr"><button class="btn btn-ghost btn-sm" data-excess="${p.id}">Resolve</button></div></div>`).join('') : '')
    || `<div class="note"><div>No excess payments. Every allocated payment was applied in full.</div></div>`;
  const ex = REPAYMENTS.filter(p=>p.status==='Verified' && !p.alloc);
  if(ex.length){
    el('excessList').innerHTML += `<div class="minihead" style="margin-top:12px">Awaiting allocation</div>` +
      ex.map(p=>`<div class="lrow"><div class="lic">${p.receipt.slice(-3)}</div>
        <div><div class="lt">${p.cust}</div><div class="ls">${mk(p.amount)} verified · unallocated</div></div>
        <div class="lr"><button class="btn btn-ghost btn-sm" data-goto5="${p.id}">Allocate</button></div></div>`).join('');
  }
  el('excessList').querySelectorAll('[data-goto5]').forEach(b=>{
    b.onclick = ()=>{ ALLOC.sel = b.dataset.goto5; renderUnalloc(); gotoOpen('s5'); };
  });
  el('excessList').querySelectorAll('[data-excess]').forEach(b=>{
    b.onclick = ()=>{
      const p = REPAYMENTS.find(x=>x.id===b.dataset.excess);
      openModal('Resolve excess', p.receipt + ' · ' + mk(p.excess) + ' unallocated', `
        <div class="note gold"><div>Excess can be applied to the next instalment, held as a credit on the
          customer account, or refunded with approval.</div></div>
        <div class="fg" style="margin-top:10px"><label>Action</label><select id="exAction">
          <option>Apply to next instalment</option><option>Hold as customer credit</option>
          <option>Refund to customer</option></select></div>`,
        [{label:'Cancel', act:'close'}, {label:'Apply', cls:'btn-gold', act:()=>{
          const act = el('exAction').value;
          toast(`${mk(p.excess)} ${act.toLowerCase()} for ${p.cust}.`);
          logPay('Correction','Excess resolved · '+act+' · '+p.receipt, p.receipt, p.excess);
          p.excess = 0;
          closeModal(); renderAll();
        }}]);
    };
  });
}
function renderAllocHistory(){
  const rows = REPAYMENTS.filter(p=>p.alloc).slice(0,12);
  el('allocHistory').innerHTML = rows.map(p=>`<tr>
    <td style="white-space:nowrap;font-size:10px">${p.date.slice(5)} ${p.time}</td>
    <td style="font-family:ui-monospace,monospace;font-size:10px">${p.receipt}</td>
    <td class="num">${nf(p.amount)}</td>
    <td style="font-size:9.5px;color:var(--muted)">P ${nf(p.alloc.principal)} · I ${nf(p.alloc.interest)}${p.alloc.pen?' · Pen '+nf(p.alloc.pen):''}</td>
    <td style="font-size:10px">${p.verifiedBy || 'Thandiwe Kamanga'}</td></tr>`).join('')
    || '<tr><td colspan="5" class="empty">No allocations yet.</td></tr>';
}
function gotoOpen(id){
  const t = document.querySelector('#'+id);
  if(t) window.scrollTo({top:t.offsetTop-112, behavior:'smooth'});
}
function correctAllocModal(){
  openModal('Correct an allocation', 'Financial correction · requires authorization', `
    <div class="note red"><div><b>Authorized correction.</b> The original allocation is preserved and a
      correcting entry is posted against it. Both appear in the audit log.</div></div>
    <div class="fg" style="margin-top:10px"><label>Receipt</label>
      <select id="corrRcpt">${REPAYMENTS.filter(p=>p.alloc).slice(0,20).map(p=>
        `<option value="${p.id}">${p.receipt} · ${p.cust} · ${mk(p.amount)}</option>`).join('')}</select></div>
    <div class="form-grid" style="margin-top:9px">
      <div class="fg"><label>Correct principal to</label><input id="corrPrin" type="number" value="0"></div>
      <div class="fg"><label>Correct interest to</label><input id="corrInt" type="number" value="0"></div>
    </div>
    <div class="fg" style="margin-top:9px"><label>Reason</label>
      <textarea id="corrReason" style="min-height:48px" placeholder="Why is the allocation wrong?"></textarea></div>
    <div class="fg" style="margin-top:9px"><label>Authorization</label>
      <input id="corrAuth" placeholder="Supervisor name" value="Chikondi Mwale"></div>`,
    [{label:'Cancel', act:'close'}, {label:'Post correction', cls:'btn-gold', act:()=>{
      const p = REPAYMENTS.find(x=>x.id===el('corrRcpt').value);
      const newPrin = Number(el('corrPrin').value)||0, newInt = Number(el('corrInt').value)||0;
      const l = loanBy(p.loan);
      if(l && p.alloc){
        l.outstanding += (p.alloc.principal - newPrin);
        p.alloc.principal = newPrin; p.alloc.interest = newInt;
      }
      logPay('Correction','Allocation corrected · '+p.receipt+' by '+el('corrAuth').value, p.receipt, p.amount);
      closeModal(); renderAll();
      toast(`Allocation corrected on ${p.receipt} · authorized by ${el('corrAuth').value}.`);
    }}]);
}

/* ===================== 6 · SCHEDULES ===================== */
const SCHED = {loan:LOANS[0].no, tab:'all'};
function scheduleFor(l){
  const rows = [];
  for(let i=1;i<=l.term;i++){
    const due = addMonths(l.first, i-1);
    const interest = Math.round(l.principal * 0.045);
    const fees = i === 1 ? 2000 : 0;
    const amount = l.inst;
    const principal = Math.max(0, amount - interest - fees);
    let paid = 0, status = 'Pending';
    if(i <= l.paid){ paid = amount; status = 'Paid'; }
    else if(l.dpd > 0 && i === l.paid + 1){ paid = Math.round(amount*0.4); status = 'Partial'; }
    if(status !== 'Paid'){
      if(due < TODAY) status = paid>0 ? 'Partial' : 'Overdue';
      else if(due === TODAY) status = paid>0 ? 'Partial' : 'Due today';
    }
    rows.push({n:i, due, amount, principal, interest, fees, paid, balance:amount-paid, status});
  }
  return rows;
}
function renderSchedules(){
  const sel = el('schedLoan');
  if(sel) sel.innerHTML = LOANS.map(l=>`<option value="${l.no}"${SCHED.loan===l.no?' selected':''}>${l.no} · ${l.cust} · ${l.product}</option>`).join('');
  const l = loanBy(SCHED.loan) || LOANS[0];
  const rows = scheduleFor(l);
  const next = rows.find(r=>r.status!=='Paid');
  const paidN = rows.filter(r=>r.status==='Paid').length;
  const overN = rows.filter(r=>r.status==='Overdue').length;

  el('schedSummary').innerHTML = [
    ['Remaining balance', mk(l.outstanding), 'of '+mk(l.principal), ''],
    ['Next payment due', next?fmtDate(next.due):'—', next?mk(next.amount)+' instalment':'Fully paid', 'gold'],
    ['Instalments paid', paidN+' / '+l.term, Math.round(paidN/l.term*100)+'% complete', ''],
    ['Overdue instalments', String(overN), overN?mk(sum(rows.filter(r=>r.status==='Overdue'),r=>r.balance)):'Nothing behind', overN?'red':'']
  ].map(([t,v,s,cls])=>`<div class="kpi ${cls}"><div class="kl">${t}</div><div class="kv">${v}</div>
    <div class="ks">${s}</div></div>`).join('');

  let filtered = rows;
  if(SCHED.tab==='upcoming') filtered = rows.filter(r=>r.status==='Pending' && r.due > TODAY);
  if(SCHED.tab==='today') filtered = rows.filter(r=>r.due === TODAY);
  if(SCHED.tab==='week') filtered = rows.filter(r=>r.due >= TODAY && daysBetween(TODAY, r.due) <= 7);
  if(SCHED.tab==='overdue') filtered = rows.filter(r=>r.status==='Overdue');
  if(SCHED.tab==='paid') filtered = rows.filter(r=>r.status==='Paid');
  if(SCHED.tab==='partial') filtered = rows.filter(r=>r.status==='Partial');

  el('schedTitle').textContent = l.cust + ' · ' + l.no;
  el('schedSub').textContent = `${l.product} · ${mk(l.principal)} over ${l.term} months · first instalment ${fmtDate(l.first)}`;
  el('schedCount').textContent = filtered.length + ' instalments';
  el('schBody').innerHTML = filtered.length ? filtered.map(r=>{
    const cls = r.status==='Paid'?'srow-paid':r.status==='Partial'?'srow-part':r.status==='Overdue'?'srow-over':'';
    const tag = r.status==='Paid'?'st-paid':r.status==='Partial'?'st-part':r.status==='Overdue'?'st-over':'st-pending';
    return `<tr class="${cls}"><td>${r.n}</td><td>${fmtDate(r.due)}</td>
      <td class="num">${nf(r.amount)}</td><td class="num">${nf(r.principal)}</td>
      <td class="num">${nf(r.interest)}</td><td class="num">${r.fees?nf(r.fees):'—'}</td>
      <td class="num">${r.paid?nf(r.paid):'—'}</td><td class="num">${r.balance?nf(r.balance):'—'}</td>
      <td><span class="sched-tag ${tag}">${r.status}</span></td>
      <td style="text-align:right">${r.status==='Paid'?'':`<button class="btn btn-ghost btn-sm" data-instpay="${r.n}" style="padding:2px 7px;font-size:10px">Pay</button>`}</td></tr>`;
  }).join('') : `<tr><td colspan="10" class="empty">No instalments in this view.</td></tr>`;

  el('schBody').querySelectorAll('[data-instpay]').forEach(b=>{
    b.onclick = ()=>{
      const r = rows.find(x=>x.n===Number(b.dataset.instpay));
      ALLOC.sel = null;
      RC.loan = l.no;
      gotoOpen('s2');
      selectLoan(l.no);
      el('rcAmount').value = r.balance;
      toast(`Instalment ${r.n} loaded into the repayment form.`,'info');
    };
  });
}

/* ===================== 7 · COLLECTIONS ===================== */
const TASKS = [
  {id:'T-1041', cust:'Grace Mvula', loan:'LN-2026-0437', task:'Final demand letter', due:'2026-10-31', officer:'Yamikani Banda', status:'Escalated'},
  {id:'T-1040', cust:'Peter Chirwa', loan:'LN-2026-0441', task:'Legal handover review', due:'2026-11-02', officer:'Linda Mhango', status:'Open'},
  {id:'T-1039', cust:'Fatsani Gondwe', loan:'LN-2026-0455', task:'Site visit', due:'2026-10-30', officer:'Tadala Msonthi', status:'Open'},
  {id:'T-1038', cust:'Linda Mhango', loan:'LN-2026-0448', task:'Call — promise follow-up', due:'2026-10-30', officer:'Blessings Tembo', status:'Promised'},
  {id:'T-1037', cust:'Esther Mwale', loan:'LN-2026-0459', task:'Restructure discussion', due:'2026-11-03', officer:'Linda Mhango', status:'Open'},
  {id:'T-1036', cust:'Alinafe Nyirenda', loan:'LN-2026-0466', task:'Call — arrears reminder', due:'2026-10-29', officer:'Yamikani Banda', status:'Closed'},
  {id:'T-1035', cust:'Blessings Tembo', loan:'LN-2026-0470', task:'SMS reminder', due:'2026-10-28', officer:'Linda Mhango', status:'Closed'}
];
const PROMISES = [
  {cust:'Linda Mhango', loan:'LN-2026-0448', amount:34000, date:'2026-11-02', status:'Pending'},
  {cust:'Fatsani Gondwe', loan:'LN-2026-0455', amount:295000, date:'2026-10-31', status:'Pending'},
  {cust:'Esther Mwale', loan:'LN-2026-0459', amount:38000, date:'2026-11-05', status:'Pending'},
  {cust:'Alinafe Nyirenda', loan:'LN-2026-0466', amount:112000, date:'2026-10-27', status:'Broken'},
  {cust:'Blessings Tembo', loan:'LN-2026-0470', amount:45000, date:'2026-10-25', status:'Kept'}
];
const COL = {taskFilter:''};
function renderCollections(){
  const dueToday = LOANS.filter(l=>scheduleFor(l).some(s=>s.due===TODAY&&s.status!=='Paid'));
  const dueWeek = LOANS.filter(l=>scheduleFor(l).some(s=>s.due>=TODAY&&daysBetween(TODAY,s.due)<=7&&s.status!=='Paid'));
  const overdue = LOANS.filter(l=>l.dpd>0).sort((a,b)=>b.dpd-a.dpd);
  const openTasks = TASKS.filter(t=>t.status!=='Closed');
  const promisesPending = PROMISES.filter(p=>p.status==='Pending');

  el('colTiles').innerHTML = [
    ['Due today', String(dueToday.length), mk(sum(dueToday,l=>l.inst)), 'gold'],
    ['Due this week', String(dueWeek.length), mk(sum(dueWeek,l=>l.inst)), ''],
    ['Overdue accounts', String(overdue.length), mk(sum(overdue,overdueOf)), 'red'],
    ['Open follow-ups', String(openTasks.length), openTasks.filter(t=>t.status==='Escalated').length+' escalated', ''],
    ['Promises pending', String(promisesPending.length), mk(sum(promisesPending,p=>p.amount)), 'blue'],
    ['Promises kept', PROMISES.filter(p=>p.status==='Kept').length+' / '+PROMISES.length, 'last 30 days', '']
  ].map(([t,v,s,cls])=>`<div class="kpi ${cls}"><div class="kl">${t}</div><div class="kv">${v}</div>
    <div class="ks">${s}</div></div>`).join('');

  el('colDueBody').innerHTML = dueWeek.slice(0,10).map(l=>{
    const s = scheduleFor(l).find(x=>x.status!=='Paid' && x.due>=TODAY) || {due:TODAY,amount:l.inst};
    return `<tr><td>${l.cust}</td><td style="font-size:10px;color:var(--muted)">${l.no}</td>
      <td style="white-space:nowrap">${fmtDate(s.due)}</td><td class="num">${nf(s.amount)}</td>
      <td style="font-size:10px">${l.officer}</td>
      <td style="text-align:right"><button class="btn btn-ghost btn-sm" data-follow="${l.no}"
        style="padding:2px 7px;font-size:10px">Follow up</button></td></tr>`;
  }).join('') || '<tr><td colspan="6" class="empty">Nothing due this week.</td></tr>';

  el('colOverdueBody').innerHTML = overdue.map(l=>`<tr>
    <td>${l.cust}</td><td style="font-size:10px;color:var(--muted)">${l.no}</td>
    <td class="num" style="color:#B32C2C;font-weight:800">${l.dpd}</td>
    <td class="num">${nf(overdueOf(l))}</td><td style="font-size:10px">${l.officer}</td>
    <td style="text-align:right"><button class="btn btn-ghost btn-sm" data-follow="${l.no}"
      style="padding:2px 7px;font-size:10px">Follow up</button></td></tr>`).join('');

  const tasks = TASKS.filter(t=>!COL.taskFilter || t.status===COL.taskFilter);
  el('colTaskCount').textContent = openTasks.length + ' open tasks';
  el('colTaskBody').innerHTML = tasks.map(t=>`<tr>
    <td>${t.cust}</td><td class="msg" style="max-width:190px">${t.task}</td>
    <td style="white-space:nowrap">${fmtShort(t.due)}</td><td style="font-size:10px">${t.officer}</td>
    <td><span class="chip ${t.status==='Closed'?'st-ok':t.status==='Escalated'?'st-rej':t.status==='Promised'?'st-await':'st-conf'}">${t.status}</span></td>
    <td style="text-align:right"><button class="btn btn-ghost btn-sm" data-task="${t.id}"
      style="padding:2px 7px;font-size:10px">Update</button></td></tr>`).join('')
    || '<tr><td colspan="6" class="empty">No tasks in this view.</td></tr>';

  el('colPromiseBody').innerHTML = PROMISES.map((p,i)=>`<tr>
    <td>${p.cust}</td><td class="num">${nf(p.amount)}</td>
    <td style="white-space:nowrap">${fmtShort(p.date)}</td>
    <td><span class="chip ${p.status==='Kept'?'st-ok':p.status==='Broken'?'st-rej':'st-await'}">${p.status}</span></td>
    <td style="text-align:right"><button class="btn btn-ghost btn-sm" data-promise="${i}"
      style="padding:2px 7px;font-size:10px">${p.status==='Pending'?'Settle':'View'}</button></td></tr>`).join('');

  el('colTaskBody').querySelectorAll('[data-task]').forEach(b=>{
    b.onclick = ()=>taskModal(TASKS.find(t=>t.id===b.dataset.task));
  });
  el('colPromiseBody').querySelectorAll('[data-promise]').forEach(b=>{
    b.onclick = ()=>promiseModal(PROMISES[Number(b.dataset.promise)]);
  });
  document.querySelectorAll('[data-follow]').forEach(b=>{
    b.onclick = ()=>followUpModal(loanBy(b.dataset.follow));
  });
}
function taskModal(t){
  openModal('Update follow-up', t.id + ' · ' + t.cust, `
    <div class="kv"><span class="k">Loan</span><span class="v">${t.loan}</span></div>
    <div class="kv"><span class="k">Task</span><span class="v">${t.task}</span></div>
    <div class="kv"><span class="k">Officer</span><span class="v">${t.officer}</span></div>
    <div class="kv"><span class="k">Follow-up date</span><span class="v">${fmtDate(t.due)}</span></div>
    <div class="fg" style="margin-top:10px"><label>Contact outcome</label>
      <select id="taskOut"><option>No answer</option><option>Spoke to customer</option>
        <option>Promise to pay</option><option>Dispute raised</option><option>Paid in full</option></select></div>
    <div class="fg" style="margin-top:9px"><label>Notes</label>
      <textarea id="taskNote" style="min-height:50px" placeholder="What was discussed"></textarea></div>
    <div class="fg" style="margin-top:9px"><label>Next follow-up</label><input id="taskNext" type="date" value="2026-11-03"></div>`,
    [{label:'Cancel', act:'close'},
     {label:'Escalate', cls:'btn-red', act:()=>{
        t.status='Escalated'; closeModal(); renderCollections();
        toast(`${t.cust} escalated to the credit committee.`,'info');
        logPay('Access','Account escalated · '+t.loan,'task.'+t.id,0,'Warning');
     }},
     {label:'Save outcome', cls:'btn-gold', act:()=>{
        const out = el('taskOut').value;
        t.due = el('taskNext').value;
        t.status = out==='Paid in full' ? 'Closed' : out==='Promise to pay' ? 'Promised' : 'Open';
        t.task = out;
        closeModal(); renderCollections();
        toast(`Follow-up recorded · ${out}.`);
        logPay('Access','Follow-up outcome: '+out+' · '+t.loan,'task.'+t.id,0);
     }}]);
}
function promiseModal(p){
  openModal('Collection promise', p.cust + ' · ' + mk(p.amount), `
    <div class="kv"><span class="k">Loan</span><span class="v">${p.loan}</span></div>
    <div class="kv"><span class="k">Promised amount</span><span class="v big">${mk(p.amount)}</span></div>
    <div class="kv"><span class="k">Promised date</span><span class="v">${fmtDate(p.date)}</span></div>
    <div class="kv"><span class="k">Status</span><span class="v">${p.status}</span></div>
    ${p.status==='Pending'?`<div class="note gold" style="margin-top:10px"><div>Remind the customer two days
      before and on the promised date. A broken promise escalates the account automatically.</div></div>`:
      `<div class="note" style="margin-top:10px"><div>This promise is ${p.status.toLowerCase()}. No further action.</div></div>`}`,
    [{label:'Close', act:'close'},
     ...(p.status==='Pending'?[
       {label:'Mark broken', cls:'btn-red', act:()=>{ p.status='Broken'; closeModal(); renderCollections();
          toast(`${p.cust} marked as a broken promise.`,'info'); }},
       {label:'Mark kept', cls:'btn-gold', act:()=>{ p.status='Kept'; closeModal(); renderCollections();
          toast(`${p.cust} · promise kept.`); }}]:[])]);
}
function followUpModal(l){
  if(!l) return;
  openModal('Log follow-up', l.cust + ' · ' + l.no, `
    <div class="kv"><span class="k">Overdue</span><span class="v">${mk(overdueOf(l))}</span></div>
    <div class="kv"><span class="k">Days past due</span><span class="v">${l.dpd}</span></div>
    <div class="kv"><span class="k">Officer</span><span class="v">${l.officer}</span></div>
    <div class="fg" style="margin-top:10px"><label>Contact method</label>
      <select id="fuMethod"><option>Phone call</option><option>SMS</option><option>Visit</option><option>Email</option></select></div>
    <div class="fg" style="margin-top:9px"><label>Outcome</label>
      <select id="fuOut"><option>No answer</option><option>Spoke — payment promised</option>
        <option>Spoke — refused</option><option>Promise date agreed</option></select></div>
    <div class="fg" style="margin-top:9px"><label>Promised amount (optional)</label>
      <input id="fuAmt" type="number" value="${overdueOf(l)}"></div>
    <div class="fg" style="margin-top:9px"><label>Follow-up date</label><input id="fuDate" type="date" value="2026-11-03"></div>`,
    [{label:'Cancel', act:'close'}, {label:'Save follow-up', cls:'btn-gold', act:()=>{
      const out = el('fuOut').value, date = el('fuDate').value;
      TASKS.unshift({id:'T-'+(1042+TASKS.length), cust:l.cust, loan:l.no,
        task:el('fuMethod').value+' · '+out, due:date, officer:l.officer,
        status: out.includes('promise')?'Promised':'Open'});
      if(el('fuAmt').value > 0 && out.includes('promise')){
        PROMISES.unshift({cust:l.cust, loan:l.no, amount:Number(el('fuAmt').value), date, status:'Pending'});
      }
      logPay('Access','Follow-up logged · '+l.no,'task.new',0);
      closeModal(); renderCollections();
      toast('Follow-up logged for ' + l.cust + '.');
    }}]);
}
function assignModal(){
  openModal('Assign accounts to collection officers', 'Bulk reassignment', `
    <div class="fg"><label>Officer</label><select id="asgOfficer">
      ${OFFICERS.map(o=>`<option>${o.name}</option>`).join('')}</select></div>
    <div class="minihead" style="margin-top:12px">Overdue accounts</div>
    <div style="max-height:230px;overflow:auto">
      ${LOANS.filter(l=>l.dpd>0).map(l=>`<div class="check">
        <span class="ck ${l.officer?'y':'n'}">✓</span>
        <div style="flex:1"><b>${l.cust}</b><span class="s">${l.no} · ${l.dpd} days · ${mk(overdueOf(l))} · currently ${l.officer}</span></div>
        <input type="checkbox" class="asgPick" data-loan="${l.no}" checked></div>`).join('')}
    </div>`,
    [{label:'Cancel', act:'close'}, {label:'Assign', cls:'btn-gold', act:()=>{
      const off = el('asgOfficer').value;
      const picks = [...document.querySelectorAll('.asgPick')].filter(c=>c.checked).map(c=>c.dataset.loan);
      picks.forEach(no=>{ const l = loanBy(no); if(l) l.officer = off; });
      closeModal(); renderAll();
      toast(`${picks.length} account${picks.length===1?'':'s'} assigned to ${off}.`);
      logPay('Access',`${picks.length} accounts assigned to ${off}`,'collection.assign',0);
    }}]);
}

/* ===================== 8 · ARREARS ===================== */
const PENALTIES = [
  ['2026-10-30','LN-2026-0455','Fatsani Gondwe',29500,'63 days past due'],
  ['2026-10-29','LN-2026-0437','Grace Mvula',26400,'110 days past due'],
  ['2026-10-28','LN-2026-0441','Peter Chirwa',14400,'95 days past due'],
  ['2026-10-25','LN-2026-0448','Linda Mhango',10200,'78 days past due'],
  ['2026-10-22','LN-2026-0466','Alinafe Nyirenda',11200,'34 days past due'],
  ['2026-10-18','LN-2026-0459','Esther Mwale',7600,'52 days past due'],
  ['2026-10-12','LN-2026-0470','Blessings Tembo',4500,'25 days past due'],
  ['2026-10-05','LN-2026-0476','Memory Phiri',2600,'15 days past due']
];
const AR = {filter:''};
function renderArrears(){
  const over = LOANS.filter(l=>l.dpd>0);
  const totalArrears = sum(over, overdueOf);
  const penaltiesTotal = sum(PENALTIES, p=>p[3]);
  el('arTiles').innerHTML = [
    ['Total arrears', mk(totalArrears), over.length+' accounts', 'red'],
    ['Overdue loans', String(over.length), 'of '+LOANS.length+' active', ''],
    ['Average days late', String(Math.round(sum(over,l=>l.dpd)/(over.length||1)))+'d', 'across overdue accounts', ''],
    ['Penalties charged', mk(penaltiesTotal), 'this month', 'gold'],
    ['Worst account', Math.max(...over.map(l=>l.dpd))+'d', over.sort((a,b)=>b.dpd-a.dpd)[0].cust, ''],
    ['Recovery rate', '62%', 'of overdue recovered MTD', 'blue']
  ].map(([t,v,s,cls])=>`<div class="kpi ${cls}"><div class="kl">${t}</div><div class="kv">${v}</div>
    <div class="ks">${s}</div></div>`).join('');

  const buckets = ['1–30','31–60','61–90','90+'];
  const colors = {'1–30':'#C9A227','31–60':'#E08C1E','61–90':'#D9733F','90+':'#D93F3F'};
  el('arBuckets').innerHTML = buckets.map(b=>{
    const l = over.filter(x=>bucketOf(x.dpd)===b);
    const val = sum(l, overdueOf);
    return `<div class="bucket"><span>${b} days</span><b>${mk(val)}</b>
      <i><em style="width:${Math.min(100,val/(totalArrears||1)*100)}%;background:${colors[b]}"></em></i>
      <div style="font-size:9.5px;color:var(--muted);margin-top:4px">${l.length} accounts</div></div>`;
  }).join('');

  progressRows(el('arProgress'), [
    {label:'Arrears book', pct:Math.round(totalArrears/sum(LOANS,l=>l.outstanding)*100), display:mk(totalArrears), color:'#D93F3F'},
    {label:'Recovered MTD', pct:62, display:'62%', color:'#1E9E6A'},
    {label:'Promises kept', pct:74, display:'74%', color:'#2F6FED'},
    {label:'Legal handover', pct:2/over.length*100, display:over.filter(l=>l.status==='Legal').length+' accounts', color:'#5A3FCB'}
  ]);

  el('arPenCount').textContent = PENALTIES.length + ' charges';
  el('arPenaltyBody').innerHTML = PENALTIES.map(([d,loan,cust,amt,why])=>`<tr>
    <td style="white-space:nowrap;font-size:10.5px">${fmtShort(d)}</td>
    <td style="font-size:10px;color:var(--muted)">${loan}</td><td>${cust}</td>
    <td class="num">${nf(amt)}</td><td style="font-size:10px;color:var(--muted)">${why}</td></tr>`).join('');

  const rows = over.filter(l=>!AR.filter || bucketOf(l.dpd)===AR.filter)
    .sort((a,b)=>overdueOf(b)-overdueOf(a));
  el('arBody').innerHTML = rows.map(l=>`<tr>
    <td>${l.cust}</td><td style="font-size:10px;color:var(--muted)">${l.no}</td>
    <td class="num">${nf(l.outstanding)}</td><td class="num" style="color:#B32C2C;font-weight:700">${nf(overdueOf(l))}</td>
    <td class="num">${l.dpd}</td>
    <td><span class="mini-tag ${bucketOf(l.dpd)==='90+'?'r':bucketOf(l.dpd)==='1–30'?'a':'r'}">${bucketOf(l.dpd)}</span></td>
    <td><span class="chip ${l.status==='Legal'?'st-rej':l.status==='Delinquent'?'st-rev':'st-await'}">${l.status}</span></td>
    <td class="num">${nf(l.penalty)}</td><td style="font-size:10px">${l.officer}</td></tr>`).join('')
    || '<tr><td colspan="9" class="empty">No accounts in this bucket.</td></tr>';
  el('arStatus').textContent = totalArrears > sum(LOANS,l=>l.outstanding)*0.15 ? 'At risk' : 'Watch';
}

/* ===================== 9 · PAYMENT METHODS ===================== */
const MTH = {filter:''};
function renderMethods(){
  const active = REPAYMENTS.filter(p=>!['Rejected','Reversed'].includes(p.status));
  el('mthCards').innerHTML = METHODS.map(m=>{
    const rows = active.filter(p=>p.method===m);
    const pend = pendingList().filter(p=>p.method===m).length;
    return `<div class="mcard">
      <div class="mh"><div class="mi">${m.split(' ').map(w=>w[0]).join('').slice(0,2)}</div>
        <div><div class="mn">${m}</div><div class="md">${rows.length} payments</div></div></div>
      <div class="mv">${mk(sum(rows,p=>p.amount))}</div>
      <div class="ms">${pend?pend+' awaiting confirmation':'All confirmed'}</div></div>`;
  }).join('');

  const tx = REPAYMENTS.filter(p=>!MTH.filter || p.method===MTH.filter).slice(0,16);
  el('mthTxBody').innerHTML = tx.map(p=>`<tr>
    <td style="white-space:nowrap;font-size:10.5px">${fmtShort(p.date)} ${p.time}</td>
    <td style="font-family:ui-monospace,monospace;font-size:10px">${p.receipt}</td>
    <td style="font-family:ui-monospace,monospace;font-size:10px">${p.ref || '—'}</td>
    <td>${p.method}</td><td class="num">${nf(p.amount)}</td>
    <td><span class="chip ${p.status==='Pending verification'?'st-await':p.status==='Rejected'?'st-rej':p.status==='Reversed'?'st-rev':'st-ok'}">
      ${p.status==='Pending verification'?'Pending':p.status==='Rejected'?'Failed':p.status==='Reversed'?'Reversed':'Confirmed'}</span></td></tr>`).join('');

  const fails = REPAYMENTS.filter(p=>p.status==='Rejected' || p.status==='Reversed');
  el('failCount').textContent = fails.length;
  el('failBody').innerHTML = fails.map(p=>`<tr>
    <td style="white-space:nowrap;font-size:10.5px">${fmtShort(p.date)}</td>
    <td style="font-family:ui-monospace,monospace;font-size:10px">${p.ref || p.receipt}</td>
    <td>${p.method}</td><td class="num">${nf(p.amount)}</td>
    <td style="font-size:10px;color:var(--muted)">${p.status==='Reversed'?'Reversed by supervisor':(p.rejReason||'Rejected at verification')}</td></tr>`).join('')
    || '<tr><td colspan="5" class="empty">No failed or reversed transactions.</td></tr>';

  el('mthSummary').innerHTML = METHODS.map(m=>{
    const rows = active.filter(p=>p.method===m);
    const pct = Math.round(sum(rows,p=>p.amount)/(sum(active,p=>p.amount)||1)*100);
    return `<div class="prow"><div class="pl">${m}</div>
      <div class="pt"><i style="width:${pct}%"></i></div><div class="pv">${pct}%</div></div>`;
  }).join('');
}
function duplicateCheck(){
  const seen = {}, dupes = [];
  REPAYMENTS.forEach(p=>{
    if(!p.ref) return;
    if(seen[p.ref]) dupes.push([p, seen[p.ref]]); else seen[p.ref] = p;
  });
  const sameAmount = REPAYMENTS.filter(p=>p.date===TODAY && p.status!=='Rejected')
    .filter((p,i,arr)=>arr.some((q,j)=>j!==i && q.loan===p.loan && q.amount===p.amount && q.method===p.method));
  el('dupResults').innerHTML = `
    <div class="note ${dupes.length?'red':''}"><div><b>${dupes.length+sameAmount.length} potential duplicate${dupes.length+sameAmount.length===1?'':'s'}</b>
      found across ${REPAYMENTS.length} payments · reference and same-day amount matching.</div></div>
    ${dupes.map(([a,b])=>`<div class="lrow"><div class="lic" style="background:#FDEDEC;color:#B32C2C">!</div>
      <div><div class="lt">${a.cust} · ${a.receipt}</div><div class="ls">Reference ${a.ref} also used on ${b.receipt} (${mk(b.amount)})</div></div>
      <div class="lr"><button class="btn btn-ghost btn-sm" data-dupchk="${a.id}">Review</button></div></div>`).join('')}
    ${sameAmount.map(p=>`<div class="lrow"><div class="lic" style="background:#FFF4E0;color:#9A6A0D">!</div>
      <div><div class="lt">${p.cust} · ${p.receipt}</div><div class="ls">Same amount and channel as another payment today (${mk(p.amount)})</div></div>
      <div class="lr"><button class="btn btn-ghost btn-sm" data-dupchk="${p.id}">Review</button></div></div>`).join('')}`;
  el('dupResults').querySelectorAll('[data-dupchk]').forEach(b=>{
    b.onclick = ()=>{
      const p = REPAYMENTS.find(x=>x.id===b.dataset.dupchk);
      openModal('Possible duplicate', p.receipt + ' · ' + mk(p.amount), `
        <div class="kv"><span class="k">Customer</span><span class="v">${p.cust}</span></div>
        <div class="kv"><span class="k">Reference</span><span class="v">${p.ref || '—'}</span></div>
        <div class="kv"><span class="k">Recorded</span><span class="v">${fmtDate(p.date)} ${p.time}</span></div>
        <div class="note gold" style="margin-top:10px"><div>Confirm with the channel statement before posting.
          If this is a duplicate, reject it or raise a reversal — never delete the record.</div></div>`,
        [{label:'Close', act:'close'}, {label:'Reject payment', cls:'btn-red', act:()=>{
          closeModal(); rejectModal(p);
        }}]);
    };
  });
  logPay('Creation','Duplicate check run','register',0);
  toast('Duplicate check complete · ' + (dupes.length+sameAmount.length) + ' flagged.','info');
}
