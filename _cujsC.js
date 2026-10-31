<script>
/* ============================================================
   GOLDEN FINANCIAL SERVICES · CUSTOMERS  (3/4)
   Sections 8–11: financial summary, documents, communication, risk.
   ============================================================ */

/* ===================== extras seeding ===================== */
function seedExtras(){
  CUSTOMERS.forEach((c,i)=>{
    if(c.seeded) return;
    c.seeded = true;
    const loans = liveLoansOf(c.no);
    const officer = OFFICER_NAMES[i % OFFICER_NAMES.length];

    /* messages */
    c.messages.push({when:c.joined, channel:'SMS', type:'Welcome',
      body:`Welcome to Golden Financial Services, ${c.first || c.name}. Your customer number is ${c.no}. Dial *384# to check your balance.`,
      by:'System'});
    if(loans.length){
      const l = loans[0];
      c.messages.push({when:addDays(TODAY, -6), channel:'SMS', type:'Reminder',
        body:`Dear ${c.first || c.name}, your ${l.product} instalment of ${mk(l.insts[0].amount)} is due on ${fmtDate(l.nextDue || addMonths(TODAY, 1))}. Pay via ${c.momo === 'Both' ? 'Airtel Money or TNM Mpamba' : c.momo}.`,
        by:'System'});
      if(l.arrears > 0){
        c.messages.push({when:addDays(TODAY, -3), channel:'SMS', type:'Overdue',
          body:`OVERDUE: ${mk(l.arrears)} is past due on loan ${l.id}. Please settle to avoid penalties. Call 0888 000 111.`,
          by:'Collections desk'});
        c.messages.push({when:addDays(TODAY, -2), channel:'Email', type:'Overdue',
          body:`Dear ${c.first || c.name}, our records show ${mk(l.arrears)} outstanding on ${l.id} for ${l.dpd} days. A penalty of ${mk(l.penaltyDue)} applies from ${fmtDate(addDays(TODAY, 7))}.`,
          by:'Collections desk'});
      }
    }
    if(c.kyc !== 'Verified'){
      c.messages.push({when:addDays(TODAY, -12), channel:'SMS', type:'KYC',
        body:`Dear ${c.first || c.name}, please complete your verification with an NRC copy and proof of address to activate borrowing.`,
        by:officer});
    }

    /* guarantors */
    const gCount = loans.length ? (i % 3 === 0 ? 2 : 1) : 0;
    for(let g=0; g<gCount; g++){
      c.guarantors.push({
        name: KIN_NAMES[(i+g+3) % KIN_NAMES.length],
        rel: KIN_RELS[(i+g) % KIN_RELS.length],
        phone: '+265 99' + (1 + (i+g)%8) + ' ' + (200 + i*5 + g) + ' ' + (300 + i*3),
        loan: loans[g % loans.length].id,
        amount: Math.round(loans[g % loans.length].principal * 0.3),
        verified: (i + g) % 4 !== 0
      });
    }

    /* collateral */
    if(c.type === 'Business'){
      c.collateral.push({
        type: i % 2 ? 'Motor vehicle' : 'Stock / inventory',
        desc: i % 2 ? 'Toyota Hilux 2015 · registration BT ' + (4000 + i) : 'Trading stock valued at ' + mk(Math.round(c.income*2.5)),
        value: i % 2 ? 8500000 : Math.round(c.income*2.5),
        held: 'Registered charge · ' + c.no
      });
    } else if(c.income > 600000 && loans.length){
      c.collateral.push({type:'Salary assignment', desc:'Employer payroll deduction at ' + c.employer,
        value: Math.round(c.income*3), held:'Letter of undertaking on file'});
    }

    /* credit assessments */
    if(loans.length){
      const l = loans[0];
      const ob = Math.round(l.insts[0].amount*0.15);
      const dti = c.income ? Math.round((l.insts[0].amount + ob)/Math.max(1, c.income - c.expenses)*100) : 0;
      c.assessments.push({
        date: addDays(l.disb, -6),
        dti,
        band: dti <= 35 ? 'Comfortable' : dti <= 50 ? 'Acceptable' : 'Breach',
        grade: dti <= 35 ? 'A' : dti <= 50 ? 'B' : 'C',
        by: officer,
        note: dti <= 35 ? 'Affordable within existing obligations'
          : dti <= 50 ? 'Acceptable with monitoring' : 'Outside policy — approved on security'
      });
      if(loans.length > 1){
        c.assessments.push({date:addDays(loans[1].disb, -5), dti:Math.max(20, dti-6),
          band:'Comfortable', grade:'A', by:officer, note:'Repeat borrower with clean record'});
      }
    }

    /* document log */
    if(!c.docLog){
      c.docLog = DOC_DEFS.filter(d=>c.docs[d.key].state !== 'missing').map(d=>({
        when:c.docs[d.key].uploaded || c.joined, doc:d.label, action:'Received', by:officer
      })).sort((a,b)=> a.when < b.when ? 1 : -1);
    }

    /* notes */
    if(i % 3 === 0){
      c.notes.push({when:addDays(TODAY, -9), by:officer, body:'Called the customer to confirm the new phone number. Confirmed, record updated.'});
    }
  });
}

/* ===================== 8 · FINANCIAL SUMMARY ===================== */
const FIN = {cust: CUSTOMERS[0].no, disc: 0};

function finOf(no){
  const loans = liveLoansOf(no);
  const pays = paysOf(no).filter(p=>p.type !== 'Missed');
  const borrowed = Math.round(sum(loans, l=>l.principal));
  const outPrin = Math.round(sum(loans, l=>l.outPrin));
  const outInt = Math.round(sum(loans, l=>l.outInt));
  const arrears = Math.round(sum(loans, l=>l.arrears));
  const next = loans.map(l=>l.nextDue).filter(Boolean).sort()[0] || null;
  const nextAmt = next ? Math.round(sum(loans.filter(l=>l.nextDue === next), l=>{
    const inst = l.insts.find(i=>i.due === l.nextDue);
    return inst ? inst.amount - inst.paid : 0;
  })) : 0;
  return {
    loans, borrowed,
    prinRepaid: Math.round(sum(loans, l=>l.paidPrin)),
    intPaid: Math.round(sum(loans, l=>l.paidInt)),
    fees: Math.round(sum(pays, p=>p.fees + p.penalty)),
    outPrin, outInt, arrears, next, nextAmt,
    total: Math.round(sum(pays, p=>p.amount)),
    penaltyDue: Math.round(sum(loans, l=>l.penaltyDue))
  };
}

function renderFinancial(){
  const c = cust(el('finCust').value || FIN.cust);
  FIN.cust = c.no;
  const f = finOf(c.no);
  el('finTiles').innerHTML = [
    {l:'Total borrowed', v:mk2(f.borrowed), s:f.loans.length + ' facility' + (f.loans.length===1?'':'s'), k:'gold'},
    {l:'Principal repaid', v:mk2(f.prinRepaid), s: pct(f.prinRepaid, f.borrowed) + '% of principal'},
    {l:'Interest paid', v:mk2(f.intPaid), s:'Charged monthly on the balance'},
    {l:'Fees & penalties paid', v:mk2(f.fees), s:'Processing fees and late penalties', k: f.fees ? 'red' : ''},
    {l:'Outstanding principal', v:mk2(f.outPrin), s:'Reduces with every payment'},
    {l:'Outstanding interest', v:mk2(f.outInt), s:'To the end of each schedule'},
    {l:'Total arrears', v:mk2(f.arrears), s: f.arrears ? 'Past due now' : 'Nothing past due', k: f.arrears ? 'red' : ''},
    {l:'Next repayment', v: f.next ? fmtShort(f.next) : '—', s: f.next ? mk(f.nextAmt) + ' due' : 'No open facility'}
  ].map(t=>`<div class="kpi ${t.k||''}"><div class="kl">${t.l}</div><div class="kv">${t.v}</div>
    <div class="ks">${t.s}</div></div>`).join('');

  el('finStmtSub').textContent = c.name + ' · ' + c.no + ' · ' + f.loans.length + ' open facilit' + (f.loans.length===1?'y':'ies');
  el('finStatementView').innerHTML = f.loans.length ? `
    <div class="stmt">
      <div class="sh"><div class="avatar-lg">GF</div>
        <div><div style="font-size:12px;font-weight:800">GOLDEN FINANCIAL SERVICES</div>
          <div style="font-size:9.5px;color:var(--muted)">Customer account statement · ${esc(c.name)}</div></div>
        <div style="margin-left:auto;text-align:right;font-size:9.5px;color:var(--muted)">${c.no}<br>${fmtDate(TODAY)}</div></div>
      <div class="srow"><span>Total borrowed</span><b>${mk(f.borrowed)}</b></div>
      <div class="srow"><span>Principal repaid</span><b>${mk(f.prinRepaid)}</b></div>
      <div class="srow"><span>Interest paid</span><b>${mk(f.intPaid)}</b></div>
      <div class="srow"><span>Fees &amp; penalties paid</span><b>${mk(f.fees)}</b></div>
      <div class="srow"><span>Outstanding principal</span><b>${mk(f.outPrin)}</b></div>
      <div class="srow"><span>Outstanding interest</span><b>${mk(f.outInt)}</b></div>
      <div class="srow"><span>Arrears</span><b>${mk(f.arrears)}</b></div>
      <div class="stot"><span>Account balance</span><span>${mk(f.outPrin + f.outInt)}</span></div>
      <div class="inline-note" style="margin-top:6px">Next repayment ${f.next ? fmtDate(f.next) + ' · ' + mk(f.nextAmt) : '—'}
        · statement covers ${f.loans.length} open facilit${f.loans.length===1?'y':'ies'}</div>
    </div>` : '<div class="empty">This customer has no open facilities.</div>';

  const disc = clamp(Number(el('finDisc').value) || 0, 0, 100);
  FIN.disc = disc;
  const discountedInt = Math.round(f.outInt * (1 - disc/100));
  const settle = f.outPrin + discountedInt + f.penaltyDue;
  el('finSettlePill').textContent = settle ? mk2(settle) : '—';
  el('finSettle').innerHTML = `
    <div class="stmt" style="margin-top:4px">
      <div class="srow"><span>Outstanding principal</span><b>${mk(f.outPrin)}</b></div>
      <div class="srow"><span>Outstanding interest</span><b>${mk(f.outInt)}</b></div>
      <div class="srow"><span>Settlement discount (${disc}%)</span><b>-${mk(f.outInt - discountedInt)}</b></div>
      <div class="srow"><span>Penalties due</span><b>${mk(f.penaltyDue)}</b></div>
      <div class="stot"><span>Settlement amount</span><span>${mk(settle)}</span></div>
    </div>
    <div class="inline-note">Settling closes every open facility and releases the guarantors.</div>`;
}

function finStatement(){
  const c = cust(el('finCust').value || FIN.cust);
  const f = finOf(c.no);
  const rows = [];
  f.loans.forEach(l=>{
    rows.push(`<div class="srow" style="font-weight:800;background:#FAFBFC"><span>${l.id} · ${l.product} · disbursed ${fmtDate(l.disb)}</span><b>${mk(l.principal)}</b></div>`);
    paysOfLoan(l.id).slice(0,8).forEach(p=>{
      rows.push(`<div class="srow"><span>&nbsp;&nbsp;${fmtShort(p.date)} · ${p.id} · ${p.type}</span><b>${mk(p.amount)}</b></div>`);
    });
  });
  openModal('Account statement', c.no + ' · ' + c.name,
    `<div class="stmt">
      <div class="sh"><div class="avatar-lg">GF</div>
        <div><div style="font-size:12px;font-weight:800">GOLDEN FINANCIAL SERVICES</div>
          <div style="font-size:9.5px;color:var(--muted)">Statement of account · ${esc(c.name)}</div></div>
        <div style="margin-left:auto;text-align:right;font-size:9.5px;color:var(--muted)">${c.no}<br>${fmtDate(TODAY)}</div></div>
      ${rows.join('') || '<div class="srow"><span>No transactions</span><b>—</b></div>'}
      <div class="stot"><span>Balance to settle</span><span>${mk(f.outPrin + f.outInt)}</span></div>
    </div>`,
    [{label:'Print / PDF', act:()=>printHtml('Account statement ' + c.no, el('modalBody').innerHTML)},
     {label:'Close', act:'close'}]);
}

function finStatementCsv(){
  const c = cust(el('finCust').value || FIN.cust);
  const f = finOf(c.no);
  const rows = [[c.no, c.name, 'Total borrowed', f.borrowed], [c.no, c.name, 'Principal repaid', f.prinRepaid],
    [c.no, c.name, 'Interest paid', f.intPaid], [c.no, c.name, 'Fees & penalties paid', f.fees],
    [c.no, c.name, 'Outstanding principal', f.outPrin], [c.no, c.name, 'Outstanding interest', f.outInt],
    [c.no, c.name, 'Arrears', f.arrears]];
  exportRows('statement-' + c.no.toLowerCase(), ['Customer no','Name','Line','Amount'], rows,
    'Account statement — ' + c.name);
}

function settlementLetter(){
  const c = cust(el('finCust').value || FIN.cust);
  const f = finOf(c.no);
  const disc = FIN.disc;
  const discountedInt = Math.round(f.outInt * (1 - disc/100));
  const settle = f.outPrin + discountedInt + f.penaltyDue;
  if(!f.loans.length){ toast('There is nothing to settle on this account.', 'info'); return; }
  openModal('Settlement letter', c.no + ' · ' + c.name,
    `<div class="stmt">
      <div class="sh"><div class="avatar-lg">GF</div>
        <div><div style="font-size:12px;font-weight:800">GOLDEN FINANCIAL SERVICES</div>
          <div style="font-size:9.5px;color:var(--muted)">Settlement quotation</div></div>
        <div style="margin-left:auto;text-align:right;font-size:9.5px;color:var(--muted)">${fmtDate(TODAY)}</div></div>
      <div style="font-size:10.5px;line-height:1.6;margin:8px 0">
        Dear ${esc(c.name)},<br>As at ${fmtDate(TODAY)} the amount required to settle all open facilities is
        <b>${mk(settle)}</b>, made up as follows.
      </div>
      <div class="srow"><span>Outstanding principal</span><b>${mk(f.outPrin)}</b></div>
      <div class="srow"><span>Interest to settlement</span><b>${mk(discountedInt)}</b></div>
      <div class="srow"><span>Penalties</span><b>${mk(f.penaltyDue)}</b></div>
      <div class="stot"><span>Total settlement</span><span>${mk(settle)}</span></div>
      <div class="inline-note" style="margin-top:8px">Quotation valid for 14 days. Payment through ${esc(c.momo)} or a bank deposit to the
        Golden collection account, quoting ${c.no}.</div>
    </div>`,
    [{label:'Print / PDF', act:()=>printHtml('Settlement letter ' + c.no, el('modalBody').innerHTML)}, {label:'Close', act:'close'}]);
  c.messages.push({when:TODAY, channel:'Email', type:'Statement',
    body:`Settlement quotation of ${mk(settle)} issued and valid for 14 days.`, by:'Chikondi Mwale'});
  logAct(c, 'Settlement quotation issued — ' + mk(settle));
  renderComms();
}

function wireFinancial(){
  el('finCust').addEventListener('change', ()=>{ FIN.cust = el('finCust').value; renderFinancial(); });
  el('finDisc').addEventListener('input', renderFinancial);
  el('finStatement').onclick = finStatement;
  el('finDownload').onclick = finStatementCsv;
  el('finSettleBtn').onclick = settlementLetter;
}

/* ===================== 9 · DOCUMENTS ===================== */
const DOC = {cust: CUSTOMERS[0].no};

function docAlertsFor(c){
  const out = [];
  DOC_DEFS.forEach(d=>{
    const doc = c.docs[d.key];
    if(doc.state === 'expired') out.push({kind:'expired', label:d.label, note:'Expired ' + fmtDate(doc.expiry)});
    else if(doc.state === 'missing') out.push({kind:'missing', label:d.label, note:'Not on file'});
    else if(doc.expiry && daysBetween(TODAY, doc.expiry) <= 90)
      out.push({kind:'soon', label:d.label, note:'Expires ' + fmtDate(doc.expiry)});
  });
  return out;
}

function renderDocs(){
  const c = cust(el('docCust').value || DOC.cust);
  DOC.cust = c.no;
  const onFile = DOC_DEFS.filter(d=>c.docs[d.key].state === 'ok').length;
  const missing = DOC_DEFS.filter(d=>c.docs[d.key].state === 'missing').length;
  const expired = DOC_DEFS.filter(d=>c.docs[d.key].state === 'expired').length;
  const soon = DOC_DEFS.filter(d=>c.docs[d.key].state === 'ok' && c.docs[d.key].expiry &&
    daysBetween(TODAY, c.docs[d.key].expiry) <= 90).length;

  el('docTiles').innerHTML = [
    {mi:'ON', mn:'Documents on file', md:'Complete and legible', mv:onFile + ' / ' + DOC_DEFS.length},
    {mi:'MS', mn:'Missing documents', md:'Blocking the next disbursement', mv:missing},
    {mi:'EX', mn:'Expired', md:'Replacement required', mv:expired},
    {mi:'90', mn:'Expiring in 90 days', md:'Renew before they lapse', mv:soon}
  ].map(t=>`<div class="mcard"><div class="mh"><div class="mi">${t.mi}</div>
      <div><div class="mn">${t.mn}</div><div class="md">${t.md}</div></div></div>
    <div class="mv">${t.mv}</div></div>`).join('');

  el('docSub').textContent = c.name + ' · ' + c.no;
  el('docOnFile').textContent = onFile + ' on file';
  el('docChecklist').innerHTML = DOC_DEFS.map(d=>{
    const doc = c.docs[d.key];
    const cls = doc.state === 'ok' ? 'ok' : doc.state === 'expired' ? 'exp' : 'miss';
    return `<div class="docline ${cls}">
      <div class="dfi">${doc.state === 'ok' ? '✓' : doc.state === 'expired' ? '!' : '✕'}</div>
      <div class="dbody"><b>${doc.label}</b><span>${esc(doc.note)} · ${doc.state === 'missing' ? 'not on file'
        : doc.state === 'expired' ? 'expired ' + fmtDate(doc.expiry)
        : 'uploaded ' + fmtDate(doc.uploaded) + (doc.expiry ? ' · expires ' + fmtDate(doc.expiry) : '')}</span></div>
      <div class="lr" style="display:flex;gap:5px">
        <button class="btn btn-ghost" style="padding:3px 7px;font-size:9.5px" data-doc-act="${d.key}">${
          doc.state === 'ok' ? 'View' : doc.state === 'expired' ? 'Renew' : 'Receive'}</button>
      </div></div>`;
  }).join('');

  el('docChecklist').querySelectorAll('[data-doc-act]').forEach(b=>{
    b.onclick = ()=>{
      const key = b.dataset.docAct, doc = c.docs[key];
      if(doc.state === 'ok'){
        openModal(doc.label, c.no + ' · on file',
          `<div class="docline ok" style="border-bottom:0"><div class="dfi">✓</div>
            <div class="dbody"><b>${doc.label}</b><span>${esc(doc.note)}</span>
              <span>Uploaded ${fmtDate(doc.uploaded)}${doc.expiry ? ' · expires ' + fmtDate(doc.expiry) : ''}</span></div></div>
           <div class="inline-note">A sample PDF would open here. Nothing leaves the browser in this demo.</div>`,
          [{label:'Close', act:'close'}]);
        return;
      }
      const newUpload = TODAY;
      doc.state = 'ok'; doc.uploaded = newUpload;
      doc.expiry = key === 'id' ? addYears(TODAY, 5) : addMonths(TODAY, 12);
      c.docLog.unshift({when:TODAY, doc:doc.label, action: doc.state === 'expired' ? 'Renewed' : 'Received', by:'Chikondi Mwale'});
      if(key === 'id'){ c.kycFlags.identity = true; c.idExpiry = doc.expiry; }
      if(key === 'address') c.kycFlags.address = true;
      if(key === 'employ') c.kycFlags.employment = true;
      if(key === 'income') c.kycFlags.income = true;
      logAct(c, 'Document received — ' + doc.label);
      renderDocs(); renderKYC(); renderOverview();
      toast(doc.label + ' marked as received.');
    };
  });

  const alerts = docAlertsFor(c);
  el('docAlertCount').textContent = alerts.length;
  el('docAlerts').innerHTML = alerts.slice(0,8).map(a=>`
    <div class="lrow"><div class="lic" style="font-size:9px;background:${
      a.kind==='expired'?'var(--red-soft)':a.kind==='soon'?'var(--amber-soft)':'#F1F2F6'};color:${
      a.kind==='expired'?'#B32C2C':a.kind==='soon'?'#9A6A0D':'#5A6172'}">${
      a.kind==='expired'?'!':a.kind==='soon'?'⏱':'✕'}</div>
      <div><div class="lt">${a.label}</div><div class="ls">${a.note}</div></div>
      <div class="lr"><span class="badge ${a.kind==='expired'?'b-rej':a.kind==='soon'?'b-await':'b-proc'}">${
        a.kind==='expired'?'Expired':a.kind==='soon'?'Expiring':'Missing'}</span></div></div>`).join('') ||
    '<div class="empty">Every document is on file and in date.</div>';

  el('docHistory').innerHTML = (c.docLog || []).slice(0, 10).map(h=>`
    <tr><td style="white-space:nowrap">${fmtDate(h.when)}</td><td>${esc(h.doc)}</td>
      <td><span class="badge ${h.action==='Received'?'b-ok':h.action==='Renewed'?'b-conf':'b-await'}">${h.action}</span></td>
      <td>${esc(h.by)}</td></tr>`).join('') ||
    '<tr><td colspan="4" class="empty">No document history.</td></tr>';
}

function wireDocs(){
  el('docCust').addEventListener('change', ()=>{ DOC.cust = el('docCust').value; renderDocs(); });
  el('docRequest').onclick = ()=>{
    const c = cust(el('docCust').value || DOC.cust);
    const alerts = docAlertsFor(c);
    if(!alerts.length){ toast('Nothing outstanding for ' + esc(c.name) + '.', 'info'); return; }
    openModal('Request documents', c.no + ' · ' + alerts.length + ' outstanding',
      `<div class="inline-note">An SMS will be queued to ${esc(c.phone)} listing each document.</div>
       ${alerts.map(a=>`<div class="docline ${a.kind==='expired'?'exp':a.kind==='soon'?'':'miss'}">
         <div class="dfi">${a.kind==='expired'?'!':a.kind==='soon'?'⏱':'✕'}</div>
         <div class="dbody"><b>${a.label}</b><span>${a.note}</span></div></div>`).join('')}`,
      [{label:'Cancel', act:'close'}, {label:'Send request', cls:'btn-gold', act:()=>{
        c.messages.push({when:TODAY, channel:'SMS', type:'Documents',
          body:`Dear ${c.first || c.name}, please provide: ${alerts.map(a=>a.label).join(', ')}. Reference ${c.no}.`,
          by:'Chikondi Mwale'});
        c.docLog.unshift({when:TODAY, doc:alerts.length + ' documents', action:'Requested', by:'Chikondi Mwale'});
        logAct(c, 'Document request sent — ' + alerts.length + ' items');
        renderAll(); closeModal(); toast('Document request sent to ' + esc(c.phone) + '.');
      }}]);
  };
}

/* ===================== 10 · COMMUNICATION ===================== */
const COM = {cust: CUSTOMERS[0].no, tab:''};

function msgTemplate(c, type){
  const l = liveLoansOf(c.no)[0];
  const first = c.first || c.name;
  const amount = l ? l.insts[0].amount : 0;
  const due = l && l.nextDue ? fmtDate(l.nextDue) : fmtDate(addDays(TODAY, 14));
  const map = {
    reminder: `Dear ${first}, a reminder that your instalment of ${mk(amount)} on ${l ? l.id : 'your loan'} is due on ${due}. Pay via ${c.momo === 'Both' ? 'Airtel Money or TNM Mpamba' : c.momo}.`,
    overdue: `Dear ${first}, ${mk(l ? l.arrears : 0)} is past due on ${l ? l.id : 'your loan'} for ${l ? l.dpd : 0} days. Please settle within 7 days to avoid a penalty of ${mk(l ? l.penaltyDue : 0)}.`,
    application: `Dear ${first}, your loan application has been received and is under review. We will contact you within 2 working days. Reference ${c.no}.`,
    approval: `Congratulations ${first}! Your loan of ${mk(l ? l.principal : 0)} has been approved. Visit the branch to sign the agreement.`,
    disbursement: `Dear ${first}, ${mk(l ? l.principal : 0)} has been disbursed to ${c.momo === 'None' ? c.bank : c.momo} ${c.momoNo}. Your first instalment of ${mk(amount)} is due on ${due}.`,
    statement: `Dear ${first}, your account statement as at ${fmtDate(TODAY)} is ready. Balance ${mk(l ? l.outstanding : 0)}, arrears ${mk(l ? l.arrears : 0)}.`,
    welcome: `Welcome to Golden Financial Services, ${first}. Your customer number is ${c.no}. Borrow with confidence — terms in Chichewa on request.`
  };
  return map[type] || map.reminder;
}

function renderComms(){
  const c = cust(el('comCust').value || COM.cust);
  COM.cust = c.no;
  const msgs = c.messages;
  const notes = c.notes;
  el('comStats').innerHTML = [
    {l:'Messages sent', v:nf(msgs.length), s:'SMS and email to this customer'},
    {l:'SMS', v:nf(msgs.filter(m=>m.channel === 'SMS').length), s:'Delivered to ' + c.phone},
    {l:'Email', v:nf(msgs.filter(m=>m.channel === 'Email').length), s:c.email || 'No email on file'},
    {l:'Contact notes', v:nf(notes.length), s:'Call and visit records'},
    {l:'Overdue notices', v:nf(msgs.filter(m=>m.type === 'Overdue').length), s:'Collections follow-up', k: msgs.some(m=>m.type==='Overdue') ? 'red' : ''}
  ].map(t=>`<div class="kpi ${t.k||''}"><div class="kl">${t.l}</div><div class="kv">${t.v}</div>
    <div class="ks">${t.s}</div></div>`).join('');

  const all = msgs.map(m=>({...m, kind:'msg'})).concat(notes.map(n=>({...n, kind:'note', channel:'Note', type:'Contact note'})));
  const filtered = all.filter(x=> !COM.tab ||
    (COM.tab === 'Note' ? x.kind === 'note' : x.channel === COM.tab));
  filtered.sort((a,b)=> a.when < b.when ? 1 : -1);
  el('comCount').textContent = all.length + ' entries';
  el('comHistory').innerHTML = filtered.slice(0, 30).map(m=>`
    <div class="lrow">
      <div class="lic" style="font-size:9px;background:${m.kind==='note'?'#F1F2F6':m.channel==='SMS'?'var(--gold-soft)':'#EAF1FE'};
        color:${m.kind==='note'?'#5A6172':m.channel==='SMS'?'var(--gold-dark)':'#2456C4'}">${
        m.kind==='note'?'NOTE':m.channel==='SMS'?'SMS':'@'}</div>
      <div><div class="lt">${esc(m.type)} · ${fmtDate(m.when)}</div>
        <div class="ls" style="white-space:normal">${esc(m.body)}</div>
        <div class="ls">${esc(m.by || 'System')}</div></div>
    </div>`).join('') || '<div class="empty">Nothing recorded on this channel.</div>';
}

function wireComms(){
  const refreshTemplate = ()=>{
    const c = cust(el('comCust').value || COM.cust);
    el('comBody').value = msgTemplate(c, el('comTemplate').value);
    el('comHint').textContent = 'Template: ' + el('comTemplate').selectedOptions[0].textContent +
      ' · sent to ' + (el('comChannel').value === 'Email' ? (c.email || 'no email on file') : c.phone);
  };
  el('comCust').addEventListener('change', ()=>{ COM.cust = el('comCust').value; renderComms(); refreshTemplate(); });
  el('comTemplate').addEventListener('change', refreshTemplate);
  el('comChannel').addEventListener('change', refreshTemplate);
  el('comReset').onclick = ()=>{ refreshTemplate(); toast('Template reloaded.', 'info'); };
  el('comSend').onclick = ()=>{
    const c = cust(el('comCust').value || COM.cust);
    const body = el('comBody').value.trim();
    if(!body){ toast('The message is empty.', 'err'); return; }
    const channel = el('comChannel').value;
    const type = el('comTemplate').selectedOptions[0].textContent;
    const channels = channel === 'Both' ? ['SMS','Email'] : [channel];
    channels.forEach(ch=>{
      c.messages.push({when:TODAY, channel:ch, type, body, by:'Chikondi Mwale'});
    });
    logAct(c, type + ' sent by ' + channel);
    renderComms(); renderOverview();
    toast(type + ' sent to ' + esc(c.name) + ' via ' + channel + '.');
  };
  el('comNoteSave').onclick = ()=>{
    const c = cust(el('comCust').value || COM.cust);
    const body = el('comNote').value.trim();
    if(body.length < 4){ toast('Write a little more before saving the note.', 'err'); return; }
    c.notes.unshift({when:TODAY, channel:'Note', type:'Contact note', body, by:'Chikondi Mwale'});
    logAct(c, 'Contact note added');
    el('comNote').value = '';
    renderComms();
    toast('Contact note saved for ' + esc(c.name) + '.');
  };
  el('comTabs').querySelectorAll('[data-mt]').forEach(b=>{
    b.onclick = ()=>{
      COM.tab = b.dataset.mt || '';
      el('comTabs').querySelectorAll('[data-mt]').forEach(x=>x.classList.toggle('on', x === b));
      renderComms();
    };
  });
  ['comCust','comTemplate','comChannel'].forEach(id=>{
    if(el(id)) el(id).addEventListener('change', ()=>{ if(id==='comCust') return; });
  });
  refreshTemplate();
}

/* ===================== 11 · RISK & CREDIT ===================== */
const RISK = {cust: CUSTOMERS[0].no, pick:null};

function riskScore(c){
  const loans = liveLoansOf(c.no);
  const allPays = paysOf(c.no).filter(p=>p.type !== 'Fees' && p.type !== 'Penalty');
  const missed = allPays.filter(p=>p.type === 'Missed').length;
  const paid = allPays.length - missed;
  const punctuality = allPays.length ? paid/allPays.length : (loans.length ? 0.5 : 0.8);
  const arrears = arrearsOf(c.no);
  const exposureRatio = c.income ? clamp(exposure(c.no)/(c.income*12), 0, 1.5) : 0;
  const tenureMonths = Math.max(0, Math.round(daysBetween(c.joined, TODAY)/30.4));
  const score = Math.round(
    punctuality*40 +
    (arrears ? 0 : 22) +
    (c.kyc === 'Verified' ? 15 : c.kyc === 'Expired' ? 6 : 3) +
    clamp(1 - exposureRatio/1.2, 0, 1)*13 +
    clamp(tenureMonths/36, 0, 1)*10
  );
  return {
    score: clamp(score, 0, 100),
    punctuality: Math.round(punctuality*100),
    arrears, exposureRatio: Math.round(exposureRatio*100),
    tenureMonths, missed, paid,
    grade: score >= 78 ? 'Low' : score >= 52 ? 'Medium' : 'High'
  };
}

function renderRisk(){
  const c = cust(el('riskCust').value || RISK.cust);
  RISK.cust = c.no;
  const r = riskScore(c);
  el('riskBadge').textContent = 'Risk: ' + c.risk;
  el('riskBadge').className = 'badge ' + statusTone(c.risk);
  el('riskScore').textContent = r.score + ' / 100';
  el('riskSub').textContent = c.name + ' · ' + c.no + ' · suggested ' + r.grade;
  el('riskPanel').innerHTML = `
    <div class="lrow"><div class="lic" style="background:var(--green-soft);color:#157A50;font-size:9px">A</div>
      <div><div class="lt">Repayment behaviour</div><div class="ls">${r.paid} payments · ${r.missed} missed</div></div>
      <div class="lr"><b>${r.punctuality}%</b></div></div>
    <div class="meter ${r.punctuality>=80?'green':'red'}"><i style="width:${r.punctuality}%"></i></div>
    <div class="lrow" style="margin-top:8px"><div class="lic" style="background:${r.arrears?'var(--red-soft)':'#FAFDFB'};color:${r.arrears?'#B32C2C':'#157A50'};font-size:9px">B</div>
      <div><div class="lt">Arrears position</div><div class="ls">${r.arrears ? mk(r.arrears) + ' past due' : 'Nothing past due'}</div></div>
      <div class="lr"><b>${r.arrears ? '−' : '✓'}</b></div></div>
    <div class="lrow"><div class="lic" style="background:var(--gold-soft);color:var(--gold-dark);font-size:9px">C</div>
      <div><div class="lt">Exposure against annual income</div><div class="ls">${mk(exposure(c.no))} of ${mk(c.income*12)}</div></div>
      <div class="lr"><b>${r.exposureRatio}%</b></div></div>
    <div class="meter ${r.exposureRatio>60?'red':r.exposureRatio>35?'':'green'}"><i style="width:${clamp(r.exposureRatio,0,100)}%"></i></div>
    <div class="lrow" style="margin-top:8px"><div class="lic" style="background:#EAF1FE;color:#2456C4;font-size:9px">D</div>
      <div><div class="lt">Relationship length</div><div class="ls">${r.tenureMonths} months on the register</div></div>
      <div class="lr"><b>${r.tenureMonths}m</b></div></div>
    <div class="lrow"><div class="lic" style="background:var(--green-soft);color:#157A50;font-size:9px">E</div>
      <div><div class="lt">KYC status</div><div class="ls">${kycLabel(c)} · ${kycScore(c)}/6 checks</div></div>
      <div class="lr"><b>${c.kyc === 'Verified' ? '✓' : '!'}</b></div></div>
    <div class="inline-note" style="margin-top:8px">Composite score ${r.score}/100 — driven by punctuality (40),
      arrears (22), KYC (15), leverage (13) and tenure (10).</div>`;
  el('riskPick').querySelectorAll('[data-risk]').forEach(ch=>{
    ch.classList.toggle('on', ch.dataset.risk === (RISK.pick || c.risk));
  });

  el('riskBehaviour').innerHTML = `
    <div class="statstrip" style="margin-top:0">
      <div><b>${nf(loansOf(c.no).length)}</b><span>Facilities</span></div>
      <div><b>${nf(liveLoansOf(c.no).length)}</b><span>Live now</span></div>
      <div><b>${nf(loansOf(c.no).filter(l=>l.status==='Fully Repaid').length)}</b><span>Fully repaid</span></div>
      <div><b>${nf(loansOf(c.no).filter(l=>l.status==='Defaulted').length)}</b><span>Defaulted</span></div>
    </div>
    <div class="lrow" style="margin-top:8px"><div class="lic" style="background:var(--gold-soft);color:var(--gold-dark);font-size:9px">↻</div>
      <div><div class="lt">Repeat borrower</div><div class="ls">${
        loansOf(c.no).length > 1 ? loansOf(c.no).length + ' facilities taken since ' + fmtDate(c.joined)
        : 'First-time borrower'}</div></div>
      <div class="lr"><span class="badge ${loansOf(c.no).length>1?'b-ok':'b-proc'}">${loansOf(c.no).length>1?'Repeat':'First'}</span></div></div>
    <div class="lrow"><div class="lic" style="background:${hasOverdue(c.no)?'var(--red-soft)':'#FAFDFB'};color:${hasOverdue(c.no)?'#B32C2C':'#157A50'};font-size:9px">!</div>
      <div><div class="lt">Overdue history</div><div class="ls">${
        hasOverdue(c.no) ? 'Currently ' + maxDpd(c.no) + ' days past due' : 'No open arrears'}</div></div>
      <div class="lr"><b>${hasOverdue(c.no) ? 'Open' : 'Clean'}</b></div></div>
    <div class="lrow"><div class="lic" style="background:#F1F2F6;color:#5A6172;font-size:9px">₣</div>
      <div><div class="lt">Lifetime borrowed</div><div class="ls">${paysOf(c.no).length} payments recorded</div></div>
      <div class="lr"><b>${mk(sum(loansOf(c.no).filter(l=>l.live), l=>l.principal))}</b></div></div>
    <div class="lrow"><div class="lic" style="background:var(--green-soft);color:#157A50;font-size:9px">✓</div>
      <div><div class="lt">Total repaid</div><div class="ls">Principal, interest and fees</div></div>
      <div class="lr"><b>${mk(totalRepaid(c.no))}</b></div></div>`;

  el('riskLoans').innerHTML = loansOf(c.no).map(l=>`
    <tr><td class="mono" style="font-size:9.5px">${l.id}</td><td>${l.product}</td>
      <td class="num">${nf(l.principal)}</td>
      <td style="white-space:nowrap">${fmtShort(l.disb)}</td>
      <td style="white-space:nowrap">${l.close ? fmtShort(l.close) : '—'}</td>
      <td><span class="badge ${loanTone(l.status)}">${l.status}</span></td></tr>`).join('') ||
    '<tr><td colspan="6" class="empty">No borrowing history.</td></tr>';
  el('riskLoanCount').textContent = loansOf(c.no).length + ' facilities';

  el('riskSecurity').innerHTML = `
    <div class="minihead" style="margin-top:0">Guarantors</div>
    ${c.guarantors.map(g=>`<div class="lrow">
      <div class="lic" style="background:var(--gold-soft);color:var(--gold-dark);font-size:9px">${initials(g.name)}</div>
      <div><div class="lt">${esc(g.name)}</div><div class="ls">${g.rel} · ${esc(g.phone)} · guaranteeing ${g.loan}</div></div>
      <div class="lr"><span class="badge ${g.verified?'b-ok':'b-await'}">${g.verified?'Verified':'Pending'}</span>
        <span style="font-size:10px;font-weight:700">${mk2(g.amount)}</span></div></div>`).join('') ||
      '<div class="inline-note">No guarantors on record.</div>'}
    <div class="minihead">Collateral held</div>
    ${c.collateral.map(k=>`<div class="lrow">
      <div class="lic" style="background:#EAF1FE;color:#2456C4;font-size:9px">⌂</div>
      <div><div class="lt">${esc(k.type)}</div><div class="ls">${esc(k.desc)} · ${esc(k.held)}</div></div>
      <div class="lr"><b>${mk2(k.value)}</b></div></div>`).join('') ||
      '<div class="inline-note">Unsecured facility — salary assignment not required.</div>'}`;

  el('riskAssess').innerHTML = c.assessments.length ? c.assessments.map(a=>`
    <div class="lrow"><div class="lic" style="background:${a.band==='Breach'?'var(--red-soft)':'var(--green-soft)'};color:${a.band==='Breach'?'#B32C2C':'#157A50'};font-size:9px">${a.grade}</div>
      <div><div class="lt">DTI ${a.dti}% · ${a.band}</div>
        <div class="ls">${fmtDate(a.date)} · ${esc(a.by)} · ${esc(a.note)}</div></div>
      <div class="lr"><span class="badge ${a.band==='Breach'?'b-rej':'b-ok'}">${a.grade}</span></div></div>`).join('') :
    '<div class="inline-note">No credit assessment recorded yet.</div>';
}

function maxDpd(no){
  return Math.max(0, ...liveLoansOf(no).map(l=>l.dpd));
}

function wireRisk(){
  el('riskCust').addEventListener('change', ()=>{ RISK.cust = el('riskCust').value; RISK.pick = null; renderRisk(); });
  el('riskPick').querySelectorAll('[data-risk]').forEach(ch=>{
    ch.onclick = ()=>{
      RISK.pick = ch.dataset.risk;
      el('riskPick').querySelectorAll('[data-risk]').forEach(x=>x.classList.toggle('on', x === ch));
    };
  });
  el('riskSave').onclick = ()=>{
    const c = cust(el('riskCust').value || RISK.cust);
    const next = RISK.pick || c.risk;
    if(next === c.risk){ toast('Classification unchanged for ' + esc(c.name) + '.', 'info'); return; }
    const prev = c.risk;
    c.risk = next;
    c.history.unshift({when:TODAY, what:'Risk classification changed from ' + prev + ' to ' + next, amount:0, by:'Chikondi Mwale'});
    logAct(c, 'Risk classification ' + prev + ' → ' + next);
    RISK.pick = null;
    renderAll();
    toast('Risk classification for ' + esc(c.name) + ' set to ' + next + '.');
  };
}

</script>
