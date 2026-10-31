/* ============================================================
   REPAYMENTS  (3/4) · receipts, settlements, reversals,
   collection officers and reconciliation
   ============================================================ */

/* ---------- print / download helpers ---------- */
function downloadFile(name, mime, text){
  if(window.self !== window.top){
    openModal('Export preview', name, `
      <div class="note gold" style="margin-bottom:10px"><div>Downloads are blocked inside this embedded
        preview frame. Copy the contents below, or open the portal in its own tab to save the file.</div></div>
      <textarea readonly style="width:100%;min-height:240px;font-family:ui-monospace,monospace;font-size:10.5px;
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
    openModal('Export preview', name, `<textarea readonly style="width:100%;min-height:240px;
      font-family:ui-monospace,monospace;font-size:10.5px;border:1px solid var(--line);border-radius:9px;padding:10px">${text.slice(0,4000)}</textarea>`,
      [{label:'Close', act:'close'}]);
  }
}
function doPrint(title){
  if(window.self !== window.top){
    openModal('Print preview', title, `
      <div class="note gold"><div>The browser print dialog is unavailable inside this embedded preview.
        Open the portal in its own tab and use Print — the document is print-ready.</div></div>`,
      [{label:'Close', act:'close'}]);
    return;
  }
  window.print();
}

/* ===================== 10 · RECEIPTS ===================== */
const RC_META = {};   /* receipt -> {prints, void, reprint:[{by,when,why}]} */
const CONFIRMATIONS = [];   /* {receipt, cust, channel, sent, status} */
function rcMeta(receipt){
  if(!RC_META[receipt]) RC_META[receipt] = {prints:1, void:false, reprint:[]};
  return RC_META[receipt];
}
function renderReceipts(){
  const q = (el('rcptSearch').value||'').trim().toLowerCase();
  const st = el('rcptStatus').value;
  const rows = REPAYMENTS.filter(p=>{
    const meta = rcMeta(p.receipt);
    const status = meta.void ? 'Void' : meta.prints>1 ? 'Reprinted' : 'Issued';
    if(st && status !== st) return false;
    if(!q) return true;
    return (p.receipt+' '+p.cust+' '+p.loan+' '+(p.ref||'')).toLowerCase().includes(q);
  }).slice(0,24);
  el('rcptCount').textContent = REPAYMENTS.length + ' receipts';
  el('rcptBody').innerHTML = rows.map(p=>{
    const meta = rcMeta(p.receipt);
    const status = meta.void ? 'Void' : meta.prints>1 ? 'Reprinted' : 'Issued';
    return `<tr>
      <td style="font-family:ui-monospace,monospace;font-size:10px">${p.receipt}</td>
      <td style="white-space:nowrap;font-size:10.5px">${fmtShort(p.date)}</td>
      <td>${p.cust}</td><td class="num">${nf(p.amount)}</td><td>${p.method}</td>
      <td class="num">${meta.prints}</td>
      <td><span class="chip ${status==='Void'?'st-rej':status==='Reprinted'?'st-await':'st-ok'}">${status}</span></td>
      <td style="text-align:right"><button class="btn btn-ghost btn-sm" data-rcpt="${p.id}"
        style="padding:2px 7px;font-size:10px">Open</button></td></tr>`;
  }).join('') || '<tr><td colspan="8" class="empty">No receipts match.</td></tr>';
  el('rcptBody').querySelectorAll('[data-rcpt]').forEach(b=>{
    b.onclick = ()=>receiptModal(REPAYMENTS.find(p=>p.id===b.dataset.rcpt));
  });

  el('rcptNumbering').innerHTML = `
    <div class="kv"><span class="k">Format</span><span class="v">RCP-000000</span></div>
    <div class="kv"><span class="k">Prefix</span><span class="v">RCP</span></div>
    <div class="kv"><span class="k">Next receipt</span><span class="v">${nextReceipt()}</span></div>
    <div class="kv"><span class="k">Issued this month</span><span class="v">${monthList().length}</span></div>
    <div class="kv"><span class="k">Voided</span><span class="v">${Object.values(RC_META).filter(m=>m.void).length}</span></div>
    <div class="kv"><span class="k">Sequence scope</span><span class="v">Branch · Blantyre</span></div>`;

  const reps = [];
  Object.entries(RC_META).forEach(([r,m])=>m.reprint.forEach(x=>reps.push([r,x.by,x.when,x.why])));
  el('rcptReprints').innerHTML = reps.length ? reps.slice(0,8).map(r=>`<tr>
    <td style="font-family:ui-monospace,monospace;font-size:9.5px">${r[0]}</td>
    <td style="white-space:nowrap;font-size:10px">${r[2]}</td><td style="font-size:10px">${r[1]}</td>
    <td style="font-size:10px;color:var(--muted)">${r[3]}</td></tr>`).join('')
    : '<tr><td colspan="4" class="empty">No reprints yet.</td></tr>';

  el('rcptAudit').innerHTML = `
    <div class="tl">
      <div class="tl-item"><b>Receipt issued</b><span>RCP-000512 · Memory Phiri · 30 Oct 2026 09:12</span></div>
      <div class="tl-item"><b>Confirmation sent</b><span>SMS to +265 999 481 220 · delivered</span></div>
      <div class="tl-item"><b>Printed</b><span>Branch counter · 1 copy</span></div>
    </div>`;

  if(!CONFIRMATIONS.length){
    REPAYMENTS.slice(0,8).forEach((p,i)=>CONFIRMATIONS.push({
      receipt:p.receipt, cust:p.cust, channel:i%3===0?'Email':'SMS',
      sent:p.date+' · '+p.time, status:i===5?'Failed':'Delivered'
    }));
  }
  el('rcptConfirmBody').innerHTML = CONFIRMATIONS.map((c,i)=>`<tr>
    <td style="font-family:ui-monospace,monospace;font-size:10px">${c.receipt}</td>
    <td>${c.cust}</td><td>${c.channel}</td>
    <td style="white-space:nowrap;font-size:10.5px">${c.sent}</td>
    <td><span class="chip ${c.status==='Delivered'?'st-ok':'st-fail'}">${c.status}</span></td>
    <td style="text-align:right"><button class="btn btn-ghost btn-sm" data-resend="${i}"
      style="padding:2px 7px;font-size:10px">Resend</button></td></tr>`).join('');
  el('rcptConfirmBody').querySelectorAll('[data-resend]').forEach(b=>{
    b.onclick = ()=>{
      const c = CONFIRMATIONS[Number(b.dataset.resend)];
      c.status='Delivered'; c.sent = TODAY + ' · ' + nowTime();
      renderReceipts();
      toast(`Confirmation resent to ${c.cust} by ${c.channel}.`);
      logPay('Receipt','Confirmation resent · '+c.receipt,c.receipt,0);
    };
  });
}
function receiptModal(p){
  if(!p) return;
  const meta = rcMeta(p.receipt);
  const l = loanBy(p.loan) || {};
  el('modalBody');
  openModal('Receipt ' + p.receipt, p.status + ' · ' + mk(p.amount), `
    <div class="receipt ${meta.void?'void':''}" id="receiptCard">
      <div class="rh"><div class="logo-tile" style="width:32px;height:32px;border-radius:9px;font-size:10px;box-shadow:none">GF</div>
        <div><b>GOLDEN FINANCIAL SERVICES</b><span>Licensed microfinance · Blantyre, Malawi</span></div></div>
      <div class="rrow" style="margin-top:8px"><span class="rk">Receipt number</span><span class="rv">${p.receipt}</span></div>
      <div class="rrow"><span class="rk">Date</span><span class="rv">${fmtDate(p.date)} · ${p.time}</span></div>
      <div class="rrow"><span class="rk">Customer</span><span class="rv">${p.cust}</span></div>
      <div class="rrow"><span class="rk">Loan account</span><span class="rv">${p.loan}</span></div>
      <div class="rrow"><span class="rk">Payment method</span><span class="rv">${p.method}</span></div>
      <div class="rrow"><span class="rk">Transaction reference</span><span class="rv">${p.ref || '—'}</span></div>
      <div class="rrow"><span class="rk">Balance before</span><span class="rv">${mk((l.outstanding||0) + (p.alloc?p.alloc.principal:0))}</span></div>
      <div class="rrow"><span class="rk">Balance after</span><span class="rv">${mk(l.outstanding||0)}</span></div>
      <div class="rtotal"><span>Amount received</span><b>${mk2(p.amount)}</b></div>
      <div class="rfoot"><span>Received by ${p.officer} · Printed ${meta.prints}×</span>
        <span>${meta.void?'VOIDED — not valid':'Thank you for your payment'}</span></div>
    </div>
    <div class="note" style="margin-top:11px"><div>Reprints are logged with your name and the reason.
      A receipt can only be voided with supervisor authorization — the payment record itself is never deleted.</div></div>`,
    [{label:'Close', act:'close'},
     {label:'Download', cls:'btn-ghost', act:()=>{
        const txt = `GOLDEN FINANCIAL SERVICES — REPAYMENT RECEIPT\n\n`+
          `Receipt: ${p.receipt}\nDate: ${fmtDate(p.date)} ${p.time}\nCustomer: ${p.cust}\n`+
          `Loan: ${p.loan}\nMethod: ${p.method}\nReference: ${p.ref || '-'}\n`+
          `Amount: ${mk2(p.amount)}\nBalance after: ${mk(l.outstanding||0)}\nReceived by: ${p.officer}\n`;
        downloadFile(p.receipt + '.txt','text/plain;charset=utf-8', txt);
        logPay('Receipt','Receipt downloaded · '+p.receipt,p.receipt,p.amount);
     }},
     {label:'Resend confirmation', cls:'btn-ghost', act:()=>{
        CONFIRMATIONS.unshift({receipt:p.receipt, cust:p.cust, channel:'SMS',
          sent:TODAY+' · '+nowTime(), status:'Delivered'});
        closeModal(); renderReceipts();
        toast(`Payment confirmation sent to ${p.cust}.`);
        logPay('Receipt','Confirmation resent · '+p.receipt,p.receipt,0);
     }},
     {label:'Print', cls:'btn-ghost', act:()=>{
        meta.prints++; meta.reprint.push({by:'Memory Phiri', when:TODAY+' · '+nowTime(), why:'Customer copy'});
        closeModal(); renderReceipts();
        logPay('Receipt','Receipt reprinted · '+p.receipt,p.receipt,p.amount);
        doPrint('Receipt '+p.receipt);
     }},
     {label:'Void', cls:'btn-red', act:()=>{ closeModal(); voidModal(p); }}]);
}
function voidModal(p){
  openModal('Void receipt', p.receipt + ' · ' + mk(p.amount), `
    <div class="note red"><div><b>Voiding does not reverse the payment.</b> It marks the printed receipt as
      invalid. To take the money off the loan you must also raise a reversal in section 12.</div></div>
    <div class="fg" style="margin-top:10px"><label>Reason</label><select id="voidReason">
      <option>Receipt issued in error</option><option>Wrong customer</option>
      <option>Duplicate receipt</option><option>Payment reversed</option></select></div>
    <div class="fg" style="margin-top:9px"><label>Supervisor authorization</label>
      <input id="voidAuth" value="Chikondi Mwale" placeholder="Name of authorizing supervisor"></div>`,
    [{label:'Cancel', act:'close'}, {label:'Void receipt', cls:'btn-red', act:()=>{
      rcMeta(p.receipt).void = true;
      closeModal(); renderReceipts();
      toast(`${p.receipt} voided · authorized by ${el('voidAuth').value}.`,'info');
      logPay('Receipt','Receipt voided · '+p.receipt+' · '+el('voidReason').value,p.receipt,p.amount,'Warning');
    }}]);
}

/* ===================== 11 · SETTLEMENTS ===================== */
const SETTLE = [
  {cust:'Agnes Chikopa', loan:'LN-2026-0425', type:'Full settlement', amount:88000, status:'Approved'},
  {cust:'Joseph Kalua', loan:'LN-2026-0430', type:'Partial early repayment', amount:200000, status:'Pending'},
  {cust:'Memory Phiri', loan:'LN-2026-0476', type:'Full settlement', amount:262000, status:'Quoted'},
  {cust:'Tadala Msonthi', loan:'LN-2026-0479', type:'Partial early repayment', amount:300000, status:'Verified'}
];
const SETTLE_HIST = [
  ['2026-10-24','Tadala Msonthi','LN-2026-0479',300000,6000,'Thandiwe Kamanga','Active'],
  ['2026-10-19','Blessings Tembo','LN-2026-0470',150000,3000,'Chikondi Mwale','Active'],
  ['2026-09-30','Rodrick Zimba','LN-2026-0402',412000,8240,'Chikondi Mwale','Settled'],
  ['2026-09-12','Esther Mwale','LN-2026-0398',268000,5360,'Thandiwe Kamanga','Settled']
];
const ST = {loan:'', type:'Full settlement'};
function renderSettlements(){
  const sel = el('settleLoan');
  if(sel) sel.innerHTML = '<option value="">Select loan…</option>' + LOANS.map(l=>
    `<option value="${l.no}"${ST.loan===l.no?' selected':''}>${l.no} · ${l.cust} · ${mk(l.outstanding)}</option>`).join('');
  const l = ST.loan ? loanBy(ST.loan) : null;
  const principal = l ? l.outstanding : 0;
  const interest = l ? Math.round(l.outstanding*0.045) : 0;
  const fees = l ? (l.penalty||0) + 2000 : 0;
  const disc = Number(el('settleDisc').value)||0;
  const part = Number(el('settlePartial').value)||0;
  const discount = Math.round(interest*disc/100);
  const total = Math.max(0, principal+interest+fees-discount);
  const due = ST.type==='Partial early repayment' && part>0 ? part : total;
  if(el('settlePrin')) el('settlePrin').value = principal;
  if(el('settleInt')) el('settleInt').value = interest;
  if(el('settleFees')) el('settleFees').value = fees;
  if(el('settleTotal')) el('settleTotal').textContent = mk2(due);
  if(el('settleSub')) el('settleSub').textContent = l ? `${l.cust} · ${l.no} · ${l.product}` : 'Select a loan to calculate the payoff';
  if(el('settleBreakdown')) el('settleBreakdown').textContent =
    `${mk(principal)} principal + ${mk(interest)} interest + ${mk(fees)} fees − ${mk(discount)} discount`;

  el('settleCount').textContent = SETTLE.length + ' requests';
  el('settleBody').innerHTML = SETTLE.map((s,i)=>`<tr>
    <td>${s.cust}</td><td style="font-size:10px;color:var(--muted)">${s.loan}</td>
    <td style="font-size:10px">${s.type}</td><td class="num">${nf(s.amount)}</td>
    <td><span class="chip ${s.status==='Approved'?'st-ok':s.status==='Pending'?'st-await':s.status==='Verified'?'st-conf':'st-proc'}">${s.status}</span></td>
    <td style="text-align:right"><button class="btn btn-ghost btn-sm" data-settle="${i}"
      style="padding:2px 7px;font-size:10px">Open</button></td></tr>`).join('');
  el('settleBody').querySelectorAll('[data-settle]').forEach(b=>{
    b.onclick = ()=>settleModal(SETTLE[Number(b.dataset.settle)]);
  });

  el('settleFlow').innerHTML = [
    ['Customer requests settlement','Done','y'],
    ['Outstanding amount calculated','Done','y'],
    ['Quote issued to customer', ST.loan?'Done':'Pending', ST.loan?'y':'n'],
    ['Approval by supervisor', ST.loan?'Pending':'Pending', ST.loan?'w':'n'],
    ['Payment verified', '—','n'],
    ['Confirmation issued','—','n'],
    ['Loan status updated','—','n']
  ].map(([t,s,c])=>`<div class="check"><span class="ck ${c}">${c==='y'?'✓':c==='w'?'!':'—'}</span>
    <div style="flex:1"><b>${t}</b></div><span class="mini-tag ${c==='y'?'g':c==='w'?'a':''}">${s}</span></div>`).join('');

  el('settleHist').innerHTML = SETTLE_HIST.map(h=>`<tr>
    <td style="white-space:nowrap;font-size:10.5px">${fmtShort(h[0])}</td><td>${h[1]}</td>
    <td style="font-size:10px;color:var(--muted)">${h[2]}</td><td class="num">${nf(h[3])}</td>
    <td class="num">${nf(h[4])}</td><td style="font-size:10px">${h[5]}</td>
    <td><span class="chip ${h[6]==='Settled'?'st-ok':'st-conf'}">${h[6]}</span></td>
    <td style="text-align:right"><button class="btn btn-ghost btn-sm" data-setdoc="${h[2]}"
      style="padding:2px 7px;font-size:10px">Letter</button></td></tr>`).join('');
  el('settleHist').querySelectorAll('[data-setdoc]').forEach(b=>{
    b.onclick = ()=>settlementLetter(b.dataset.setdoc);
  });
}
function settleModal(s){
  openModal('Settlement request', s.cust + ' · ' + s.type, `
    <div class="kv"><span class="k">Loan</span><span class="v">${s.loan}</span></div>
    <div class="kv"><span class="k">Type</span><span class="v">${s.type}</span></div>
    <div class="kv"><span class="k">Amount</span><span class="v big">${mk2(s.amount)}</span></div>
    <div class="kv"><span class="k">Status</span><span class="v">${s.status}</span></div>
    <div class="minihead" style="margin-top:12px">Decision</div>
    <div class="fg"><label>Note to the customer</label>
      <textarea id="setNote" style="min-height:52px" placeholder="Settlement valid until…"></textarea></div>`,
    [{label:'Close', act:'close'},
     {label:'Reject', cls:'btn-red', act:()=>{
        s.status='Rejected'; closeModal(); renderSettlements();
        toast(`${s.cust} settlement request rejected.`,'info');
        logPay('Reversal','Settlement rejected · '+s.loan,'settle.'+s.loan,s.amount,'Warning');
     }},
     {label:'Approve', cls:'btn-gold', act:()=>{
        s.status='Approved'; closeModal(); renderSettlements();
        toast(`${s.cust} settlement approved · ${mk(s.amount)}.`);
        logPay('Correction','Settlement approved · '+s.loan,'settle.'+s.loan,s.amount);
     }}]);
}
function settlementLetter(loanNo){
  const h = SETTLE_HIST.find(x=>x[2]===loanNo) || SETTLE_HIST[0];
  openModal('Settlement letter', h[1] + ' · ' + h[2], `
    <div class="letterhead" style="background:#fff;border:1px solid var(--line);border-radius:10px;padding:14px">
      <div style="display:flex;align-items:center;gap:9px;padding-bottom:8px;border-bottom:1.5px solid var(--gold-soft)">
        <div class="logo-tile" style="width:30px;height:30px;border-radius:8px;font-size:9px;box-shadow:none">GF</div>
        <div><b style="font-size:11.5px">GOLDEN FINANCIAL SERVICES</b>
          <span style="display:block;font-size:9px;color:var(--muted)">P.O. Box 481, Blantyre · +265 1 770 200</span></div>
      </div>
      <div style="font-size:10.5px;color:#4A5160;line-height:1.65;margin-top:9px">
        <b style="font-size:10.5px">NOTICE OF LOAN SETTLEMENT</b><br /><br />
        Date: ${fmtDate(TODAY)}<br />Customer: ${h[1]}<br />Loan account: ${h[2]}<br /><br />
        This letter confirms that loan ${h[2]} has been settled in full.<br />
        Settlement amount received: <b>${mk2(h[3])}</b><br />
        Early settlement discount applied: <b>${mk2(h[4])}</b><br /><br />
        The account is closed and no further instalments are due. Thank you for banking with
        Golden Financial Services.
      </div>
      <div style="font-size:9px;color:var(--muted-2);border-top:1px dashed var(--line);margin-top:9px;padding-top:6px">
        Issued electronically · verified by ${h[5]}</div>
    </div>`,
    [{label:'Close', act:'close'}, {label:'Download', cls:'btn-gold', act:()=>{
      downloadFile('settlement-'+h[2]+'.txt','text/plain;charset=utf-8',
        `NOTICE OF LOAN SETTLEMENT\n\nDate: ${fmtDate(TODAY)}\nCustomer: ${h[1]}\nLoan: ${h[2]}\n`+
        `Settlement received: ${mk2(h[3])}\nDiscount: ${mk2(h[4])}\nVerified by: ${h[5]}\n`);
      logPay('Correction','Settlement letter issued · '+h[2],'settle.'+h[2],h[3]);
    }}]);
}
function settleAction(kind){
  const l = ST.loan ? loanBy(ST.loan) : null;
  if(!l){ toast('Select a loan first.','err'); return; }
  if(kind==='request'){
    SETTLE.unshift({cust:l.cust, loan:l.no, type:el('settleType').value,
      amount:Number(el('settlePartial').value)||l.outstanding, status:'Pending'});
    toast(`Settlement request raised for ${l.cust}.`);
    logPay('Correction','Settlement requested · '+l.no,'settle.'+l.no,l.outstanding);
    renderSettlements();
  }
  if(kind==='quote'){
    SETTLE.forEach(s=>{ if(s.loan===l.no && s.status==='Pending') s.status='Quoted'; });
    toast(`Settlement quote sent to ${l.cust} · ${el('settleTotal').textContent}.`);
    renderSettlements();
  }
  if(kind==='verify'){
    SETTLE.forEach(s=>{ if(s.loan===l.no && ['Approved','Quoted'].includes(s.status)) s.status='Verified'; });
    toast(`Settlement payment verified for ${l.cust}.`);
    logPay('Verification','Settlement payment verified · '+l.no,'settle.'+l.no,l.outstanding);
    renderSettlements();
  }
  if(kind==='confirm'){
    openModal('Issue settlement confirmation', l.cust + ' · ' + l.no, `
      <div class="note gold"><div>Issuing the confirmation closes the loan, stops penalties and releases the
        guarantor. This cannot be undone without a supervisor reinstatement.</div></div>
      <div class="kv" style="margin-top:10px"><span class="k">Settlement amount</span>
        <span class="v big">${el('settleTotal').textContent}</span></div>
      <div class="kv"><span class="k">Outstanding before</span><span class="v">${mk(l.outstanding)}</span></div>`,
      [{label:'Cancel', act:'close'}, {label:'Confirm & close loan', cls:'btn-gold', act:()=>{
        SETTLE.forEach(s=>{ if(s.loan===l.no) s.status='Approved'; });
        SETTLE_HIST.unshift([TODAY, l.cust, l.no, Number(el('settlePartial').value)||l.outstanding,
          Math.round((l.outstanding*0.045)*(Number(el('settleDisc').value)||0)/100), 'Chikondi Mwale', 'Settled']);
        l.outstanding = 0; l.penalty = 0; l.status = 'Settled'; l.dpd = 0;
        logPay('Correction','Loan settled and closed · '+l.no,'settle.'+l.no,l.outstanding);
        closeModal(); renderAll();
        toast(`${l.cust} · ${l.no} settled and closed.`);
      }}]);
  }
}

/* ===================== 12 · REVERSALS ===================== */
const REVS = [
  {id:'REV-221', date:'2026-10-29', receipt:'RCP-000501', cust:'Tadala Msonthi', amount:84000,
   reason:'Duplicate payment', by:'Memory Phiri', status:'Pending'},
  {id:'REV-220', date:'2026-10-28', receipt:'RCP-000498', cust:'Alinafe Nyirenda', amount:112000,
   reason:'Incorrect amount', by:'Thandiwe Kamanga', status:'Pending'},
  {id:'REV-219', date:'2026-10-26', receipt:'RCP-000492', cust:'Blessings Tembo', amount:45000,
   reason:'Wrong loan allocation', by:'Memory Phiri', status:'Approved'},
  {id:'REV-218', date:'2026-10-22', receipt:'RCP-000487', cust:'Esther Mwale', amount:38000,
   reason:'Failed mobile money', by:'Fatsani Gondwe', status:'Rejected'}
];
const CORR_TYPES = [
  ['Duplicate payment','A payment was captured twice', 'REV-221'],
  ['Incorrect amount','The amount differs from the receipt','REV-220'],
  ['Wrong allocation','Applied to the wrong loan or instalment','REV-219'],
  ['Failed transaction','Money never arrived','REV-218']
];
function renderReversals(){
  el('corrTypes').innerHTML = CORR_TYPES.map(([t,s,id])=>`
    <div class="mcard"><div class="mh"><div class="mi">${t.slice(0,2).toUpperCase()}</div>
      <div><div class="mn">${t}</div><div class="md">${s}</div></div></div>
      <div class="ms" style="margin-top:8px">Linked request: <b>${id}</b></div></div>`).join('');
  el('revPend').textContent = REVS.filter(r=>r.status==='Pending').length + ' pending';
  el('revBody').innerHTML = REVS.map((r,i)=>`<tr>
    <td style="white-space:nowrap;font-size:10.5px">${fmtShort(r.date)}</td>
    <td style="font-family:ui-monospace,monospace;font-size:10px">${r.receipt}</td>
    <td>${r.cust}</td><td class="num">${nf(r.amount)}</td>
    <td style="font-size:10px">${r.reason}</td><td style="font-size:10px">${r.by}</td>
    <td><span class="chip ${r.status==='Approved'?'st-ok':r.status==='Rejected'?'st-rej':'st-await'}">${r.status}</span></td>
    <td style="text-align:right">${r.status==='Pending'
      ? `<button class="btn btn-ghost btn-sm" data-rev="${i}" style="padding:2px 7px;font-size:10px">Review</button>`
      : `<button class="btn btn-ghost btn-sm" data-revview="${i}" style="padding:2px 7px;font-size:10px">View</button>`}</td></tr>`).join('');
  el('revBody').querySelectorAll('[data-rev],[data-revview]').forEach(b=>{
    const i = Number(b.dataset.rev ?? b.dataset.revview);
    b.onclick = ()=>revModal(REVS[i]);
  });
  el('revHistory').innerHTML = REVS.filter(r=>r.status!=='Pending').map(r=>`<tr>
    <td style="white-space:nowrap;font-size:10.5px">${fmtShort(r.date)}</td>
    <td style="font-family:ui-monospace,monospace;font-size:10px">${r.receipt}</td>
    <td>${r.reason}</td><td class="num">${nf(r.amount)}</td>
    <td style="font-size:10px">${r.status==='Approved'?'Chikondi Mwale':'—'}</td></tr>`).join('')
    || '<tr><td colspan="5" class="empty">No decisions yet.</td></tr>';
}
function revModal(r){
  openModal('Reversal ' + r.id, r.receipt + ' · ' + r.status, `
    <div class="kv"><span class="k">Customer</span><span class="v">${r.cust}</span></div>
    <div class="kv"><span class="k">Receipt</span><span class="v">${r.receipt}</span></div>
    <div class="kv"><span class="k">Amount</span><span class="v big">${mk2(r.amount)}</span></div>
    <div class="kv"><span class="k">Reason</span><span class="v">${r.reason}</span></div>
    <div class="kv"><span class="k">Requested by</span><span class="v">${r.by}</span></div>
    <div class="kv"><span class="k">Requested</span><span class="v">${fmtDate(r.date)}</span></div>
    ${r.status==='Pending'? `
      <div class="note gold" style="margin-top:10px"><div>Approving posts a reversing entry. The original
        receipt and allocation stay visible in the register and the audit log.</div></div>
      <div class="fg" style="margin-top:10px"><label>Decision note</label>
        <textarea id="revNote" style="min-height:48px" placeholder="Why the reversal is approved or rejected"></textarea></div>
      <div class="fg" style="margin-top:9px"><label>Authorization</label>
        <input id="revAuth" value="Chikondi Mwale"></div>` :
      `<div class="note" style="margin-top:10px"><div>Decision recorded — no further action.</div></div>`}`,
    [{label:'Close', act:'close'},
     ...(r.status==='Pending' ? [
       {label:'Reject', cls:'btn-red', act:()=>{
          r.status='Rejected'; closeModal(); renderAll();
          toast(`${r.id} rejected — original payment stands.`,'info');
          logPay('Reversal','Reversal rejected · '+r.receipt,r.receipt,r.amount,'Warning');
       }},
       {label:'Approve reversal', cls:'btn-gold', act:()=>{
          r.status='Approved';
          const p = REPAYMENTS.find(x=>x.receipt===r.receipt);
          if(p){
            p.status='Reversed';
            const l = loanBy(p.loan);
            if(l && p.alloc){ l.outstanding += p.alloc.principal; l.penalty += p.alloc.pen; }
          }
          closeModal(); renderAll();
          toast(`${r.id} approved · ${mk(r.amount)} reversed and restored to the loan.`);
          logPay('Reversal','Reversal approved · '+r.receipt+' by '+ (el('revAuth')?el('revAuth').value:'supervisor'), r.receipt, r.amount);
       }}] : [])]);
}
function newReversal(){
  openModal('Request payment reversal', 'A reversing entry, not a deletion', `
    <div class="fg"><label>Receipt</label><select id="nrReceipt">
      ${REPAYMENTS.filter(p=>['Allocated','Verified'].includes(p.status)).slice(0,20).map(p=>
        `<option value="${p.id}">${p.receipt} · ${p.cust} · ${mk(p.amount)}</option>`).join('')}</select></div>
    <div class="fg" style="margin-top:9px"><label>Reason</label><select id="nrReason">
      <option>Duplicate payment</option><option>Incorrect amount</option>
      <option>Wrong loan allocation</option><option>Failed transaction</option>
      <option>Customer dispute</option></select></div>
    <div class="fg" style="margin-top:9px"><label>Explanation</label>
      <textarea id="nrNote" style="min-height:50px" placeholder="What happened?"></textarea></div>
    <div class="note red" style="margin-top:10px"><div>Reversals need supervisor approval. The payment stays
      in the register marked Reversed, with its original receipt, allocation and audit trail intact.</div></div>`,
    [{label:'Cancel', act:'close'}, {label:'Submit request', cls:'btn-gold', act:()=>{
      const p = REPAYMENTS.find(x=>x.id===el('nrReceipt').value);
      REVS.unshift({id:'REV-'+(222+REVS.length), date:TODAY, receipt:p.receipt, cust:p.cust,
        amount:p.amount, reason:el('nrReason').value, by:'Memory Phiri', status:'Pending'});
      logPay('Reversal','Reversal requested · '+p.receipt,p.receipt,p.amount);
      closeModal(); renderAll();
      toast(`Reversal requested for ${p.receipt} · awaiting approval.`,'info');
    }}]);
}

/* ===================== 13 · OFFICERS ===================== */
const OFFICERS = [
  {name:'Yamikani Banda', branch:'Blantyre', accounts:3, collected:184250, target:220000, success:84},
  {name:'Blessings Tembo', branch:'Limbe', accounts:3, collected:133000, target:150000, success:79},
  {name:'Linda Mhango', branch:'Mzuzu', accounts:3, collected:128000, target:160000, success:72},
  {name:'Tadala Msonthi', branch:'Mangochi', accounts:2, collected:399000, target:320000, success:91},
  {name:'Esther Mwale', branch:'Blantyre', accounts:1, collected:76000, target:90000, success:68}
];
const OFF_ACT = [
  ['10:12','Yamikani Banda','Called Alinafe Nyirenda · no answer','Call'],
  ['09:48','Tadala Msonthi','Site visit Fatsani Gondwe · promise 31 Oct','Visit'],
  ['09:05','Linda Mhango','SMS reminder sent to Peter Chirwa','SMS'],
  ['08:40','Blessings Tembo','Promised MK 34,000 on 02 Nov · Linda Mhango','Call'],
  ['08:12','Esther Mwale','Escalated Grace Mvula to credit committee','Escalation'],
  ['07:55','Yamikani Banda','Follow-up closed · Blessings Tembo paid','Call']
];
function renderOfficers(){
  el('offCards').innerHTML = OFFICERS.map(o=>{
    const pct = Math.min(100, Math.round(o.collected/o.target*100));
    return `<div class="ocard">
      <div class="oh"><div class="oav">${initials(o.name)}</div>
        <div><div class="on">${o.name}</div><div class="or">${o.branch} · ${o.accounts} accounts</div></div></div>
      <div class="om"><span>Collected</span><b>${mk(o.collected)}</b></div>
      <div class="meter ${pct>=90?'green':pct<70?'red':'blue'}"><i style="width:${pct}%"></i></div>
      <div class="om"><span>Target ${mk(o.target)}</span><b>${pct}%</b></div>
      <div class="om"><span>Success rate</span><b>${o.success}%</b></div>
    </div>`;
  }).join('');
  el('offBody').innerHTML = OFFICERS.map(o=>{
    const overdue = LOANS.filter(l=>l.officer===o.name && l.dpd>0);
    return `<tr><td style="font-weight:700">${o.name}</td><td>${o.branch}</td>
      <td class="num">${o.accounts}</td><td class="num">${overdue.length}</td>
      <td class="num">${nf(o.collected)}</td><td class="num">${nf(o.target)}</td>
      <td class="num" style="color:${o.success>=85?'#157A50':o.success<70?'#B32C2C':'#9A6A0D'};font-weight:800">${o.success}%</td>
      <td style="text-align:right"><button class="btn btn-ghost btn-sm" data-off="${o.name}"
        style="padding:2px 7px;font-size:10px">Portfolio</button></td></tr>`;
  }).join('');
  el('offBody').querySelectorAll('[data-off]').forEach(b=>{
    b.onclick = ()=>officerModal(b.dataset.off);
  });
  el('offActivity').innerHTML = OFF_ACT.map(([t,o,a,type])=>`<div class="lrow">
    <div class="lic" style="background:#EAF1FE;color:#2456C4">${initials(o)}</div>
    <div><div class="lt">${a}</div><div class="ls">${o} · ${t}</div></div>
    <div class="lr"><span class="mini-tag">${type}</span></div></div>`).join('');
}
function officerModal(name){
  const o = OFFICERS.find(x=>x.name===name) || OFFICERS[0];
  const loans = LOANS.filter(l=>l.officer===o.name);
  openModal(o.name, o.branch + ' · ' + loans.length + ' assigned accounts', `
    <div class="kv"><span class="k">Collection target</span><span class="v">${mk(o.target)}</span></div>
    <div class="kv"><span class="k">Collected MTD</span><span class="v big">${mk(o.collected)}</span></div>
    <div class="kv"><span class="k">Success rate</span><span class="v">${o.success}%</span></div>
    <div class="minihead" style="margin-top:12px">Assigned accounts</div>
    ${loans.map(l=>`<div class="lrow"><div class="lic">${l.no.slice(-3)}</div>
      <div><div class="lt">${l.cust}</div><div class="ls">${l.no} · ${l.dpd?l.dpd+' days overdue':'current'} · ${mk(l.outstanding)}</div></div>
      <div class="lr"><span class="chip ${l.dpd?'st-rev':'st-ok'}">${l.dpd?'Overdue':'Current'}</span></div></div>`).join('')}`,
    [{label:'Close', act:'close'}, {label:'Reassign', cls:'btn-gold', act:()=>{ closeModal(); assignModal(); }}]);
}

/* ===================== 14 · RECONCILIATION ===================== */
const RECON = [
  {ch:'Cash', recorded:184250, confirmed:184250},
  {ch:'Bank transfer', recorded:472000, confirmed:469500},
  {ch:'Airtel Money', recorded:302000, confirmed:296500},
  {ch:'TNM Mpamba', recorded:129000, confirmed:129000},
  {ch:'Cheque', recorded:100000, confirmed:0}
];
const RECON_HIST = [
  ['2026-10-29',1184250,1184250,0,0,'Thandiwe Kamanga','Balanced'],
  ['2026-10-28',986000,984000,2000,1,'Thandiwe Kamanga','Adjusted'],
  ['2026-10-27',742000,742000,0,0,'Memory Phiri','Balanced'],
  ['2026-10-26',812000,809500,2500,1,'Thandiwe Kamanga','Adjusted'],
  ['2026-10-25',654000,654000,0,0,'Memory Phiri','Balanced']
];
const DISC = [
  {t:'Missing transaction', s:'Bank transfer NBM-7710228 · MK 25,000 not on the statement', amt:25000, sev:'High'},
  {t:'Duplicate entry', s:'Airtel Money AM-88110455 captured twice', amt:84000, sev:'High'},
  {t:'Cheque not cleared', s:'CHQ-002841 · MK 100,000 presented 27 Oct', amt:100000, sev:'Medium'},
  {t:'Timing difference', s:'Airtel settlement cut-off 23:00', amt:6000, sev:'Low'}
];
let ADJUSTMENTS = [];
function renderRecon(){
  el('reconCards').innerHTML = RECON.map(r=>{
    const diff = r.recorded - r.confirmed;
    return `<div class="mcard">
      <div class="mh"><div class="mi">${r.ch.split(' ').map(w=>w[0]).join('').slice(0,2)}</div>
        <div><div class="mn">${r.ch}</div><div class="md">${diff?'Difference '+mk(diff):'Balanced'}</div></div></div>
      <div class="mv">${mk(r.confirmed)}</div>
      <div class="ms" style="color:${diff?'#B32C2C':'#157A50'};font-weight:700">${diff?'⚠ '+mk(diff)+' unmatched':'✓ Matched'}</div>
    </div>`;
  }).join('');
  el('reconBody').innerHTML = RECON.map(r=>{
    const diff = r.recorded - r.confirmed;
    return `<tr><td style="font-weight:700">${r.ch}</td><td class="num">${nf(r.recorded)}</td>
      <td class="num">${nf(r.confirmed)}</td>
      <td class="num" style="color:${diff?'#B32C2C':'#157A50'};font-weight:700">${diff?nf(diff):'—'}</td>
      <td><span class="chip ${diff?'st-rej':'st-ok'}">${diff?'Discrepancy':'Balanced'}</span></td>
      <td style="text-align:right"><button class="btn btn-ghost btn-sm" data-inv="${r.ch}"
        style="padding:2px 7px;font-size:10px">${diff?'Investigate':'View'}</button></td></tr>`;
  }).join('');
  el('reconBody').querySelectorAll('[data-inv]').forEach(b=>{
    b.onclick = ()=>investigate(b.dataset.inv);
  });
  el('discCount').textContent = DISC.length;
  el('reconDisc').innerHTML = DISC.map((d,i)=>`<div class="lrow">
    <div class="lic" style="background:${d.sev==='High'?'#FDEDEC':'#FFF4E0'};color:${d.sev==='High'?'#B32C2C':'#9A6A0D'}">!</div>
    <div><div class="lt">${d.t}</div><div class="ls">${d.s}</div></div>
    <div class="lr"><b style="font-size:10.5px;font-variant-numeric:tabular-nums">${mk(d.amt)}</b>
      <button class="btn btn-ghost btn-sm" data-disc="${i}">Clear</button></div></div>`).join('');
  el('reconDisc').querySelectorAll('[data-disc]').forEach(b=>{
    b.onclick = ()=>{
      const d = DISC.splice(Number(b.dataset.disc),1)[0];
      ADJUSTMENTS.push({type:'Investigated', desc:d.t, amount:d.amt, note:'Cleared during reconciliation'});
      renderRecon();
      toast(`Discrepancy cleared · ${d.t}.`,'info');
      logPay('Correction','Reconciliation discrepancy cleared · '+d.t,'recon',d.amt);
    };
  });
  el('reconHist').innerHTML = RECON_HIST.map(h=>`<tr>
    <td style="white-space:nowrap">${fmtShort(h[0])}</td><td class="num">${nf(h[1])}</td>
    <td class="num">${nf(h[2])}</td><td class="num">${h[3]?nf(h[3]):'—'}</td>
    <td class="num">${h[4]||'—'}</td><td style="font-size:10px">${h[5]}</td>
    <td><span class="chip ${h[6]==='Balanced'?'st-ok':'st-await'}">${h[6]}</span></td></tr>`).join('');
}
function investigate(ch){
  const r = RECON.find(x=>x.ch===ch);
  openModal(ch + ' reconciliation', r ? `Recorded ${mk(r.recorded)} · confirmed ${mk(r.confirmed)}` : '', `
    <div class="cmp">
      <div class="cbox"><span>Recorded</span><b>${mk(r?r.recorded:0)}</b><small>From the repayment register</small></div>
      <div class="cvs">VS</div>
      <div class="cbox"><span>Confirmed</span><b>${mk(r?r.confirmed:0)}</b><small>Channel statement</small></div>
    </div>
    <div class="minihead" style="margin-top:12px">Matching</div>
    <div class="check"><span class="ck y">✓</span><div style="flex:1"><b>Matched by reference</b>
      <span class="s">${r?Math.max(0,(r.confirmed/1000)|0):0} transactions matched automatically</span></div></div>
    <div class="check"><span class="ck w">!</span><div style="flex:1"><b>Unmatched</b>
      <span class="s">${r?mk(r.recorded-r.confirmed):'—'} · needs investigation</span></div></div>
    <div class="minihead" style="margin-top:12px">Record an adjustment</div>
    <div class="form-grid">
      <div class="fg"><label>Type</label><select id="invType"><option>Bank charge</option>
        <option>Timing difference</option><option>Missing transaction</option><option>Duplicate entry</option></select></div>
      <div class="fg"><label>Amount</label><input id="invAmt" type="number" value="${r?Math.max(0,r.recorded-r.confirmed):0}"></div>
    </div>`,
    [{label:'Close', act:'close'}, {label:'Post adjustment', cls:'btn-gold', act:()=>{
      ADJUSTMENTS.push({type:el('invType').value, desc:ch, amount:Number(el('invAmt').value), note:'Reconciliation adjustment'});
      logPay('Correction','Reconciliation adjustment · '+ch+' · '+el('invType').value,'recon',Number(el('invAmt').value));
      closeModal(); toast(`Adjustment posted for ${ch}.`);
      renderRecon();
    }}]);
}
