
/* ============================================================
   SECTION 9 · STATUS TRACKING
   ============================================================ */
const STATUSES = ['Draft','Awaiting authorization','Authorized','Processing','Awaiting confirmation',
  'Successful','Failed','Rejected','Cancelled','Reversed'];

function statusColor(s){
  return {Draft:'#5A6172','Awaiting authorization':'#9A6A0D',Authorized:'#2456C4',Processing:'#5A3FCB',
    'Awaiting confirmation':'#1E5FBF',Successful:'#157A50',Failed:'#B32C2C',Rejected:'#962626',
    Cancelled:'#616B7C',Reversed:'#8E2F45'}[s] || '#5A6172';
}

function renderStatus(){
  const counts = {};
  STATUSES.forEach(s=>counts[s] = state.disb.filter(d=>d.status===s).length);
  el('statusTiles').innerHTML = STATUSES.map(s=>`
    <div class="card mini" data-act="filter-status" data-ref="${s}" style="cursor:pointer">
      <div class="m-ic" style="background:${statusColor(s)}1A;color:${statusColor(s)}">${counts[s]}</div>
      <div style="min-width:0"><div class="m-v">${counts[s]}</div><div class="m-l">${s}</div></div>
    </div>`).join('');

  const changes = state.changes.slice(0,10);
  el('statusChanges').innerHTML = changes.length ? changes.map(c=>`
    <tr><td class="tiny muted">${c.time}</td><td class="tiny" style="font-weight:700">${c.ref}</td>
      <td class="tiny">${c.from?chip(c.from):'—'}</td><td class="tiny">${chip(c.to)}</td>
      <td class="tiny muted">${c.by}</td></tr>`).join('')
    : `<tr><td colspan="5"><div class="empty">No status changes recorded yet — walk the workflow above.</div></td></tr>`;

  el('statusTimeline').innerHTML = [
    ['Draft prepared','Instruction captured, not yet submitted', counts['Draft']],
    ['Awaiting authorization','Queued for second-line control', counts['Awaiting authorization']],
    ['Authorized','Cleared for release', counts['Authorized']],
    ['Processing','Funds released to channel', counts['Processing']],
    ['Awaiting confirmation','Monitoring receipt by customer', counts['Awaiting confirmation']],
    ['Successful','Confirmed and ready for activation', counts['Successful']],
    ['Exceptions','Failed, rejected or reversed', counts['Failed']+counts['Rejected']+counts['Reversed']]
  ].map(([t,s,n])=>`<div class="tl-item"><b>${t} · ${n}</b><span>${s}</span></div>`).join('');
}

/* ============================================================
   SECTION 10 · FAILED & EXCEPTIONAL
   ============================================================ */
function renderFails(){
  const rows = state.disb.filter(d=>['Failed','Rejected','Reversed'].includes(d.status));
  el('failCount').textContent = rows.length + ' in exceptions';
  el('failBody').innerHTML = rows.length ? rows.map(d=>`
    <tr>
      <td style="font-weight:700;font-size:11.5px">${d.ref}</td>
      <td><div class="nm" style="font-weight:600">${d.cust}</div><div class="tiny muted">${d.acct}</div></td>
      <td class="num">${mk(d.net)}</td>
      <td class="tiny">${d.method}</td>
      <td class="tiny" style="color:#B32C2C">${d.reason || 'Rejected by authorizer'}</td>
      <td class="num">${d.attempts||1}</td>
      <td>${d.status==='Failed'?'<span class="chip st-fail">Open</span>':chip(d.status)}</td>
      <td style="white-space:nowrap">
        ${d.status==='Failed'?`<button class="btn btn-ghost btn-sm" data-act="retry" data-ref="${d.ref}">Retry</button>
        <button class="btn btn-ghost btn-sm" data-act="correct" data-ref="${d.ref}">Correct</button>`:''}
        <button class="btn btn-red btn-sm" data-act="cancel" data-ref="${d.ref}">Cancel</button>
      </td></tr>`).join('')
    : `<tr><td colspan="8"><div class="empty">No failed or exceptional disbursements.</div></td></tr>`;

  el('failHistory').innerHTML = [
    ['09:58','C. Mwale','Retried DIS-2026-1037 after correcting account name','Resent to bank'],
    ['09:22','S. Zimba','Corrected recipient details on DIS-2026-1039','Re-authorized'],
    ['08:58','C. Mwale','Marked DIS-2026-1037 as failed','Exception opened'],
    ['08:12','System','Bank returned funds for DIS-2026-1033','Marked reversed']
  ].map(([t,by,what,res])=>`
    <div class="li"><div class="av">${initials(by)}</div>
      <div><div class="t1">${what}</div><div class="t2">${by} · ${t} · ${res}</div></div></div>`).join('');

  el('failRules').innerHTML = [
    ['Block automatic retry when the beneficiary name mismatches'],
    ['Duplicate detection on customer + amount + 24h window'],
    ['Wallet / bank declines require manual correction'],
    ['Retries above MK 1,000,000 need re-authorization'],
    ['Reversed transactions re-open the loan for disbursement']
  ].map(([t])=>`<div class="check"><div class="ck y">✓</div><div><b>${t}</b></div></div>`).join('');
}

/* ============================================================
   SECTION 11 · FEES
   ============================================================ */
function renderFees(){
  const amt = +el('feeAmount').value||0, proc = +el('feeProc').value||0,
        ins = +el('feeIns').value||0, other = +el('feeOther').value||0, waive = +el('feeWaive').value||0;
  const f = calcFees(amt, proc, ins, other, waive);
  el('feeNet').value = nf(f.net);
  el('feeBreak').innerHTML = `
    <div class="kv"><span class="k">Approved loan amount</span><span class="v">${mk(amt)}</span></div>
    <div class="kv"><span class="k">Processing fee (${proc}%)</span><span class="v">− ${mk(f.proc)}</span></div>
    <div class="kv"><span class="k">Insurance / charges (${ins}%)</span><span class="v">− ${mk(f.ins)}</span></div>
    <div class="kv"><span class="k">Other authorized deductions</span><span class="v">− ${mk(other)}</span></div>
    <div class="kv"><span class="k">Approved waiver</span><span class="v">+ ${mk(waive)}</span></div>
    <div class="kv"><span class="k">Total deductions</span><span class="v">− ${mk(f.total)}</span></div>
    <div class="kv"><span class="k" style="font-weight:800;color:var(--ink)">Net payable to customer</span>
      <span class="v big" style="color:#157A50">${mk(f.net)}</span></div>`;
}

function renderFeeRules(){
  el('feeRules').innerHTML = `
    <div class="kv"><span class="k">Processing fee</span><span class="v">2.5% of approved amount</span></div>
    <div class="kv"><span class="k">Insurance / credit life</span><span class="v">1.0% of approved amount</span></div>
    <div class="kv"><span class="k">Minimum fee</span><span class="v">MK 25,000</span></div>
    <div class="kv"><span class="k">Maximum combined deduction</span><span class="v">7.5% of principal</span></div>
    <div class="kv"><span class="k">Waiver approval threshold</span><span class="v">MK 150,000</span></div>
    <div class="kv"><span class="k">Fees are collected</span><span class="v">Upfront, deducted at release</span></div>`;
  el('feeWaivers').innerHTML = [
    ['Memory Nkhoma','LN-2026-1831','Processing fee waiver · MK 11,250','Pending'],
    ['Esther Kamanga','LN-2026-1822','Insurance waiver · MK 1,500','Pending'],
    ['Grace Mvula','LN-2026-1839','Late adjustment · MK 4,000','Awaiting CFO']
  ].map(([n,a,r,s])=>`
    <div class="li"><div class="av">${initials(n)}</div>
      <div><div class="t1">${n}</div><div class="t2">${a} · ${r}</div></div>
      <div class="amt"><b class="tiny" style="color:#9A6A0D">${s}</b></div></div>`).join('');
}

/* ============================================================
   SECTION 12 · ACTIVATION
   ============================================================ */
let actSel = null;

function renderActivation(){
  const ready = state.disb.filter(d=>d.status==='Successful' && !d.activated);
  el('actCount').textContent = ready.length + ' ready';
  el('actBody').innerHTML = ready.length ? ready.map(d=>`
    <tr><td style="font-weight:700;font-size:11.5px">${d.ref}</td>
      <td><div class="nm" style="font-weight:600">${d.cust}</div><div class="tiny muted">${d.app}</div></td>
      <td class="num">${mk(d.amount)}</td>
      <td class="tiny muted">${d.date}</td>
      <td class="tiny">LN-AC-${d.ref.slice(-4)}</td>
      <td><button class="btn btn-gold btn-sm" data-act="act-open" data-ref="${d.ref}">Activate</button></td></tr>`).join('')
    : `<tr><td colspan="6"><div class="empty">All confirmed disbursements have been activated.</div></td></tr>`;

  if(actSel){
    const d = state.disb.find(x=>x.ref===actSel);
    if(d){
      el('actPanel').innerHTML = `
        <div class="kv"><span class="k">Disbursement</span><span class="v">${d.ref}</span></div>
        <div class="kv"><span class="k">Customer</span><span class="v">${d.cust}</span></div>
        <div class="kv"><span class="k">Principal disbursed</span><span class="v">${mk(d.amount)}</span></div>
        <div class="kv"><span class="k">Disbursement date</span><span class="v">${d.date}</span></div>
        <div class="kv"><span class="k">First repayment due</span><span class="v">30 Nov 2026</span></div>
        <div style="margin-top:8px">
          ${['Disbursement confirmed successful','Disbursement linked to loan account','Repayment schedule generated',
             'First due date set','Outstanding balance updated','Customer notified by SMS']
            .map(t=>`<div class="check"><div class="ck y">✓</div><div><b>${t}</b></div></div>`).join('')}
        </div>
        <div class="form-actions">
          <button class="btn btn-gold btn-sm" data-act="activate" data-ref="${d.ref}">Activate loan account</button>
          <button class="btn btn-ghost btn-sm" data-act="act-close">Cancel</button>
        </div>`;
    }
  }

  const done = state.disb.filter(d=>d.activated).slice(0,5);
  el('actHistory').innerHTML = done.length ? done.map(d=>`
    <div class="li"><div class="av" style="background:var(--green-soft);color:#157A50">✓</div>
      <div><div class="t1">${d.cust}</div><div class="t2">LN-AC-${d.ref.slice(-4)} · schedule generated</div></div>
      <div class="amt"><b>${mk(d.amount)}</b><span>${d.date}</span></div></div>`).join('')
    : `<div class="empty">No activations today.</div>`;
}

/* ============================================================
   SECTION 13 · DOCUMENTS
   ============================================================ */
const DOC_LIST = [
  ['Loan Agreement','Signed by customer and guarantor','ES-2026-####.pdf'],
  ['Disbursement Authorization','Credit committee / CFO sign-off','AUTH-2026-####.pdf'],
  ['Customer Identification','National ID + KYC pack','KYC-####.pdf'],
  ['Payment Confirmation Evidence','Bank or wallet proof of payment','EVD-####.png'],
  ['Disbursement Advice','Sent to finance and customer','ADV-####.pdf'],
  ['Disbursement Receipt','Counter receipt / e-receipt','RCP-####.pdf'],
  ['Customer Acknowledgment','Signed receipt of funds','ACK-####.pdf']
];

function renderDocs(){
  const refs = state.disb.filter(d=>['Successful','Processing','Awaiting confirmation'].includes(d.status));
  const keep = el('docSelect').value;
  el('docSelect').innerHTML = refs.map(d=>`<option value="${d.ref}">${d.ref} · ${d.cust}</option>`).join('')
    || `<option value="">No disbursements</option>`;
  if(keep && refs.some(r=>r.ref===keep)) el('docSelect').value = keep;
  const ref = el('docSelect').value || (refs[0] && refs[0].ref);
  el('docRef').textContent = ref || '—';
  el('docList').innerHTML = DOC_LIST.map(([t,s,f])=>`
    <div class="doc">
      <div class="di">${ICONS.doc}</div>
      <div><div class="dn">${t}</div><div class="ds">${s} · ${f.replace('####', (ref||'').slice(-4))}</div></div>
      <div class="da">
        <button class="btn btn-ghost btn-sm" data-act="doc-dl" data-ref="${t}">Download</button>
        <button class="btn btn-ghost btn-sm" data-act="doc-print" data-ref="${t}">Print</button>
      </div>
    </div>`).join('');
  el('docHistory').innerHTML = [
    ['C. Mwale','Verified loan agreement and authorization','09:41'],
    ['G. Mtemang\'ombe','Uploaded payment confirmation evidence','09:12'],
    ['System','Customer acknowledgment captured via SMS','08:58'],
    ['T. Phiri','Re-uploaded signed agreement (previous scan illegible)','08:22']
  ].map(([who,what,t])=>`
    <div class="li"><div class="av">${initials(who)}</div>
      <div><div class="t1">${what}</div><div class="t2">${who} · ${t}</div></div></div>`).join('');
}

/* ============================================================
   SECTION 14 · RECONCILIATION
   ============================================================ */
function renderRecon(){
  const channels = [
    ['Bank Transfer', 18.4, 18.4, 12, 'Matched'],
    ['Airtel Money', 3.2, 3.05, 9, 'Variance'],
    ['TNM Mpamba', 2.1, 2.1, 5, 'Matched'],
    ['Cash', 1.4, 1.4, 4, 'Matched'],
    ['Cheque', 0, 0, 0, 'No activity']
  ];
  el('reconBody').innerHTML = channels.map(([c,a,act,n,state])=>{
    const v = +(act-a).toFixed(2);
    return `<tr><td style="font-weight:600">${c}</td>
      <td class="num">${mkm(a*1e6)}</td><td class="num">${mkm(act*1e6)}</td>
      <td class="num" style="color:${v===0?'#157A50':'#B32C2C'}">${v===0?'—':'− '+mkm(Math.abs(v)*1e6)}</td>
      <td class="num">${n}</td>
      <td>${state==='Matched'?'<span class="chip st-ok">Matched</span>'
        : state==='Variance'?'<span class="chip st-fail">Variance</span>'
        : '<span class="chip st-canc">No activity</span>'}</td></tr>`;
  }).join('');

  el('reconDisc').innerHTML = [
    ['Airtel Money','Wallet debit MK 150,000 lower than authorized','MK 150,000'],
    ['Bank Transfer','Duplicate reference FT2610307712 flagged','MK 900,000'],
    ['Cash','Counter slip missing for DIS-2026-1034','MK 380,000']
  ].map(([ch,what,amt])=>`
    <div class="li"><div class="av" style="background:var(--red-soft);color:#B32C2C">!</div>
      <div><div class="t1">${what}</div><div class="t2">${ch}</div></div>
      <div class="amt"><b>${amt}</b><span>variance</span></div></div>`).join('');

  el('reconHist').innerHTML = [
    ['30 Oct 2026','3 variances · 30 transactions','Open'],
    ['29 Oct 2026','0 variances · 26 transactions','Balanced'],
    ['28 Oct 2026','1 variance · 22 transactions','Resolved'],
    ['27 Oct 2026','0 variances · 24 transactions','Balanced'],
    ['26 Oct 2026','2 variances · 19 transactions','Resolved']
  ].map(([d,s,st])=>`
    <div class="li"><div class="av">${st==='Open'?'!':'✓'}</div>
      <div><div class="t1">${d}</div><div class="t2">${s}</div></div>
      <div class="amt"><b class="tiny" style="color:${st==='Open'?'#B32C2C':'#157A50'}">${st}</b></div></div>`).join('');
}
