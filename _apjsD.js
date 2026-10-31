/* ============================================================
   LOAN APPLICATIONS  (4/4) · disbursement handover, customer
   communication, reports, audit and application boot
   ============================================================ */

/* ---------- download / print helpers ---------- */
function downloadFile(name, mime, text){
  if(window.self !== window.top){
    openModal('Export preview', name, `
      <div class="note gold"><div>Downloads are blocked inside this embedded preview frame. Copy the contents
        below, or open the portal in its own tab to save the file.</div></div>
      <textarea readonly style="width:100%;min-height:240px;font-family:ui-monospace,monospace;font-size:10.5px;
        border:1px solid var(--line);border-radius:9px;padding:10px;margin-top:9px">${String(text).slice(0,4000)}</textarea>`,
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
      font-family:ui-monospace,monospace;font-size:10.5px;border:1px solid var(--line);border-radius:9px;padding:10px">${String(text).slice(0,4000)}</textarea>`,
      [{label:'Close', act:'close'}]);
  }
}
function doPrint(title){
  if(window.self !== window.top){
    openModal('Print preview', title, `
      <div class="note gold"><div>The print dialog is unavailable inside this embedded preview. Open the portal
        in its own tab and use Print — the document is already print-formatted.</div></div>`,
      [{label:'Close', act:'close'}]);
    return;
  }
  window.print();
}

/* ===================== 12 · DISBURSEMENT HANDOVER ===================== */
const DB = {sel:null};
const DB_CHECKS = [
  ['terms','Approved loan terms confirmed with the customer'],
  ['payment','Customer payment details verified (bank or wallet)'],
  ['agreements','Loan agreement and mandate signed'],
  ['conditions','Approval conditions met and evidenced'],
  ['schedule','Repayment schedule generated and shared'],
  ['instruction','Disbursement instruction prepared']
];
const dbReadyApps = () => APPLICATIONS.filter(a=>a.status==='Approved' || (a.approval && !a.sentTo && a.status==='Awaiting Authorization' && a.approval.level>=1 && a.status!=='Awaiting Authorization'));
function renderHandover(){
  const queue = APPLICATIONS.filter(a=>a.status==='Approved');
  const forwarded = APPLICATIONS.filter(a=>a.sentTo && a.sentTo!=='');
  el('dbCount').textContent = queue.length + ' ready';
  el('dbForwarded').textContent = forwarded.length + ' forwarded';
  el('dbTiles').innerHTML = [
    ['Awaiting final checks', String(queue.length), mk(sum(queue,a=>a.approval?.amount||a.amount)), 'gold'],
    ['Ready to forward', String(queue.filter(a=>dbCheckCount(a)===6).length), 'all six checks complete', ''],
    ['Forwarded', String(forwarded.length), mk(sum(forwarded,a=>a.approval?.amount||a.amount)), 'blue'],
    ['Disbursed', String(APPLICATIONS.filter(a=>a.status==='Disbursed').length), 'released to customers', '']
  ].map(([l,v,s,cls])=>`<div class="kpi ${cls}"><div class="kl">${l}</div><div class="kv">${v}</div>
    <div class="ks">${s}</div></div>`).join('');

  el('dbQueue').innerHTML = queue.length ? queue.map(a=>`
    <div class="appcard ${DB.sel===a.no?'on':''}" data-dbsel="${a.no}">
      <div class="ah"><div style="flex:1;min-width:0"><div class="anm">${a.cust}</div>
        <div class="ano">${a.no} · ${a.product}</div></div>
        <span class="chip ${dbCheckCount(a)===6?'st-ok':'st-await'}">${dbCheckCount(a)}/6</span></div>
      <div class="am"><span>Approved <b>${mk(a.approval?.amount||a.amount)}</b></span>
        <span>${a.approval?.term||a.term} mo · ${a.approval?.rate||productBy(a.product).rate}%</span>
        <span>${a.approval?.by || a.officer}</span></div></div>`).join('')
    : '<div class="empty">Nothing awaiting handover.</div>';
  el('dbQueue').querySelectorAll('[data-dbsel]').forEach(c=>{
    c.onclick = ()=>{ DB.sel = c.dataset.dbsel; renderHandover(); };
  });

  const a = DB.sel ? appBy(DB.sel) : null;
  el('dbSub').textContent = a ? `${a.no} · ${a.cust}` : 'Nothing selected';
  el('dbCkCount').textContent = a ? dbCheckCount(a)+' / 6' : '0 / 6';
  if(!a){
    el('dbDetail').innerHTML = '<div class="empty">Select an application from the queue.</div>';
    el('dbSchedule').innerHTML = '<tr><td colspan="6" class="empty">Select an application to see or generate its schedule.</td></tr>';
    el('dbSchedSub').textContent = 'Generated from the approved terms';
  } else {
    a.dbChecks = a.dbChecks || {};
    el('dbDetail').innerHTML = `
      <div class="kv"><span class="k">Approved amount</span><span class="v big">${mk(a.approval?.amount||a.amount)}</span></div>
      <div class="kv"><span class="k">Rate · term</span><span class="v">${a.approval?.rate||productBy(a.product).rate}% × ${a.approval?.term||a.term} months</span></div>
      <div class="kv"><span class="k">Arrangement fee</span><span class="v">${mk(a.approval?.fee || Math.round((a.approval?.amount||a.amount)*productBy(a.product).fee/100))}</span></div>
      <div class="kv"><span class="k">Conditions</span><span class="v" style="max-width:260px;white-space:normal;text-align:right">${a.approval?.conditions || 'None.'}</span></div>
      <div class="minihead">Final checks <span class="mini-tag">click to tick</span></div>
      ${DB_CHECKS.map(([k,label])=>{
        const on = !!a.dbChecks[k];
        return `<div class="check" data-dbck="${k}" style="cursor:pointer">
          <span class="ck ${on?'y':'n'}">${on?'✓':'–'}</span>
          <div style="flex:1"><b>${label}</b></div></div>`;
      }).join('')}
      <div class="form-actions" style="flex-wrap:wrap">
        <button class="btn btn-ghost" id="dbGen2">Generate schedule</button>
        <button class="btn btn-ghost" id="dbInstr">Prepare instruction</button>
        <button class="btn btn-gold" id="dbForward">Forward to disbursements</button>
      </div>`;
    el('dbDetail').querySelectorAll('[data-dbck]').forEach(r=>{
      r.onclick = ()=>{
        const k = r.dataset.dbck;
        a.dbChecks[k] = !a.dbChecks[k];
        logApp('Change', (a.dbChecks[k]?'Confirmed: ':'Un-confirmed: ')+DB_CHECKS.find(c=>c[0]===k)[1], a.no);
        renderHandover();
      };
    });
    el('dbGen2').onclick = ()=>generateSchedule(a);
    el('dbInstr').onclick = ()=>prepareInstruction(a);
    el('dbForward').onclick = ()=>forwardToDisbursement(a);
    renderSchedule(a);
  }

  el('dbRegCount').textContent = forwarded.length;
  el('dbBody').innerHTML = forwarded.length ? forwarded.map(a=>`<tr>
    <td class="mono">${a.no}</td><td>${a.cust}</td>
    <td class="num">${nf(a.approval?.amount||a.amount)}</td>
    <td><span class="chip ${a.status==='Disbursed'?'st-ok':'st-await'}">${a.status==='Disbursed'?'Disbursed':'With finance'}</span></td>
    <td style="font-size:10.5px;white-space:nowrap">${a.forwarded?fmtShort(a.forwarded):'—'}</td></tr>`).join('')
    : '<tr><td colspan="5" class="empty">Nothing forwarded yet.</td></tr>';
}
const dbCheckCount = a => a.dbChecks ? Object.values(a.dbChecks).filter(Boolean).length : 0;
function generateSchedule(a){
  const amount = a.approval?.amount || a.amount;
  const rate = a.approval?.rate || productBy(a.product).rate;
  const term = a.approval?.term || a.term;
  const inst = pmt(amount, rate, term);
  const rows = [];
  let bal = amount;
  for(let i=1;i<=term;i++){
    const interest = Math.round(bal*rate/100);
    const principal = Math.min(bal, Math.max(0, inst - interest));
    bal = Math.max(0, bal - principal);
    rows.push({n:i, due:addDays(TODAY, 30*i), amount:inst, principal, interest, balance:bal});
  }
  a.schedule = rows;
  a.dbChecks = a.dbChecks || {};
  a.dbChecks.schedule = true;
  logApp('Change','Repayment schedule generated ('+term+' instalments)', a.no);
  renderHandover();
  toast(`Schedule generated · ${term} instalments of ${mk(inst)}.`);
}
function renderSchedule(a){
  if(!a || !a.schedule){
    el('dbSchedule').innerHTML = '<tr><td colspan="6" class="empty">No schedule generated yet.</td></tr>';
    el('dbSchedSub').textContent = 'Generated from the approved terms';
    return;
  }
  el('dbSchedSub').textContent = `${a.schedule.length} instalments · ${mk(a.schedule[0].amount)} each`;
  el('dbSchedule').innerHTML = a.schedule.map(r=>`<tr>
    <td class="num">${r.n}</td><td style="white-space:nowrap;font-size:10.5px">${fmtShort(r.due)}</td>
    <td class="num">${nf(r.amount)}</td><td class="num">${nf(r.principal)}</td>
    <td class="num">${nf(r.interest)}</td><td class="num">${nf(r.balance)}</td></tr>`).join('');
}
function prepareInstruction(a){
  const amount = a.approval?.amount || a.amount;
  const fee = a.approval?.fee || Math.round(amount*productBy(a.product).fee/100);
  openModal('Disbursement instruction', `${a.no} · ${a.cust}`, `
    <div class="letterhead">
      <div style="display:flex;align-items:center;gap:9px;padding-bottom:8px;border-bottom:1.5px solid #EFE2B4">
        <div class="logo-tile" style="width:30px;height:30px;border-radius:8px;font-size:9px;box-shadow:none">GF</div>
        <div><b style="font-size:11.5px">GOLDEN FINANCIAL SERVICES</b>
          <span style="display:block;font-size:9px;color:var(--muted)">Disbursement instruction · internal</span></div>
      </div>
      <div class="kv" style="margin-top:8px"><span class="k">Application</span><span class="v">${a.no}</span></div>
      <div class="kv"><span class="k">Customer</span><span class="v">${a.cust} · ${a.custId}</span></div>
      <div class="kv"><span class="k">Product</span><span class="v">${a.product}</span></div>
      <div class="kv"><span class="k">Approved amount</span><span class="v big">${mk(amount)}</span></div>
      <div class="kv"><span class="k">Arrangement fee</span><span class="v">${mk(fee)}</span></div>
      <div class="kv"><span class="k">Net to customer</span><span class="v">${mk(amount - fee)}</span></div>
      <div class="kv"><span class="k">Rate · term</span><span class="v">${a.approval?.rate||productBy(a.product).rate}% × ${a.approval?.term||a.term} months</span></div>
      <div class="kv"><span class="k">Pay to</span><span class="v">${a.cust} · ${a.phone}</span></div>
      <div class="kv"><span class="k">Authorized by</span><span class="v">${a.approval?.by || '—'}</span></div>
    </div>`,
    [{label:'Close', act:'close'}, {label:'Download', cls:'btn-gold', act:()=>{
      downloadFile('disbursement-'+a.no+'.txt','text/plain;charset=utf-8',
        `DISBURSEMENT INSTRUCTION\n\nApplication: ${a.no}\nCustomer: ${a.cust} (${a.custId})\n`+
        `Amount: ${mk(amount)}\nFee: ${mk(fee)}\nNet: ${mk(amount-fee)}\n`+
        `Rate: ${a.approval?.rate||productBy(a.product).rate}%\nTerm: ${a.approval?.term||a.term} months\n`+
        `Authorized by: ${a.approval?.by || '-'}\n`);
      a.dbChecks = a.dbChecks || {}; a.dbChecks.instruction = true;
      logApp('Document','Disbursement instruction prepared', a.no);
      renderHandover();
    }}]);
}
function forwardToDisbursement(a){
  const miss = DB_CHECKS.filter(([k])=>!(a.dbChecks||{})[k]);
  if(miss.length){
    toast(`Complete all six final checks first (${miss.length} outstanding).`,'err');
    return;
  }
  openModal('Forward to disbursements', `${a.no} · ${mk(a.approval?.amount||a.amount)}`, `
    <div class="note gold"><div>The file leaves the applications pipeline and appears in the disbursements
      module. The approved terms, schedule and instruction travel with it.</div></div>
    <div class="kv" style="margin-top:9px"><span class="k">Amount</span><span class="v big">${mk(a.approval?.amount||a.amount)}</span></div>
    <div class="kv"><span class="k">Instalments</span><span class="v">${a.schedule?.length || a.term}</span></div>
    <div class="fg" style="margin-top:9px"><label>Disbursement channel</label>
      <select id="fwCh"><option>Airtel Money</option><option>TNM Mpamba</option>
        <option>Bank transfer</option><option>Cash at branch</option></select></div>`,
    [{label:'Cancel', act:'close'}, {label:'Forward', cls:'btn-gold', act:()=>{
      a.sentTo = 'disbursements';
      a.forwarded = TODAY;
      a.status = 'Awaiting Disbursement';
      a.channel = el('fwCh').value;
      pushComm(a,'disbursement', `Your loan has been approved and passed to our disbursement team. ${mk(a.approval?.amount||a.amount)} will be released via ${a.channel}.`,'SMS');
      logApp('Change','Forwarded to disbursements · '+el('fwCh').value, a.no);
      closeModal(); renderAll();
      toast(`${a.no} forwarded to disbursements · ${el('fwCh').value}.`);
    }}]);
}

/* ===================== 13 · CUSTOMER COMMUNICATION ===================== */
const CM = {app:'', template:'received', channel:'', tab:''};
function commTemplates(a){
  const amount = a ? mk(a.amount) : 'MK 0';
  return {
    received:`Dear ${a?a.cust:'customer'}, we have received your loan application ${a?a.no:''} for ${amount}. We will be in touch within 3 working days.`,
    documents:`Dear ${a?a.cust:'customer'}, to continue with application ${a?a.no:''} we need: your NRC copy and a recent bank or mobile money statement. Please bring them to any branch.`,
    review:`Dear ${a?a.cust:'customer'}, your application ${a?a.no:''} is under review by our credit team. No action is needed from you at this stage.`,
    approved:`Dear ${a?a.cust:'customer'}, good news — your loan application ${a?a.no:''} has been approved. Our team will contact you about the disbursement of ${a?mk(a.approval?.amount||a.amount):''}.`,
    rejected:`Dear ${a?a.cust:'customer'}, we regret that application ${a?a.no:''} could not be approved at this time. You may reapply after 30 days or discuss a smaller amount with your officer.`,
    correction:`Dear ${a?a.cust:'customer'}, application ${a?a.no:''} needs a correction before we can continue. Please contact your loan officer.`,
    disbursement:`Dear ${a?a.cust:'customer'}, your loan ${a?a.no:''} is being processed for disbursement. You will receive the funds shortly.`
  };
}
function renderComms(){
  const apps = APPLICATIONS;
  if(!el('cmApp').dataset.filled){
    el('cmApp').innerHTML = apps.map(a=>`<option value="${a.no}">${a.no} · ${a.cust}</option>`).join('');
    el('cmApp').dataset.filled = '1';
    CM.app = apps[0]?.no || '';
  }
  CM.app = el('cmApp').value || CM.app;
  const a = appBy(CM.app);
  const all = APPLICATIONS.flatMap(x=>(x.comms||[]).map(c=>({...c, app:x.no, cust:x.cust})));
  all.sort((x,y)=>String(y.when).localeCompare(String(x.when)));
  const shown = CM.tab ? all.filter(c=>c.channel===CM.tab) : all;
  el('cmCount').textContent = all.length + ' messages';
  el('cmStats').innerHTML = [
    ['Messages sent', String(all.length), 'across every application', ''],
    ['Delivered', String(all.filter(c=>c.status==='Delivered').length), 'SMS and email combined', 'gold'],
    ['Failed', String(all.filter(c=>c.status!=='Delivered').length), 'retry queued', ''],
    ['Templates', '7', 'received, docs, review, approved, rejected, correction, disbursement', 'blue']
  ].map(([l,v,s,cls])=>`<div class="kpi ${cls}"><div class="kl">${l}</div><div class="kv">${v}</div>
    <div class="ks">${s}</div></div>`).join('');

  el('cmHistory').innerHTML = shown.length ? shown.map(c=>`
    <div class="msg"><div class="mi">${c.channel==='Email'?'@':'SMS'}</div>
      <div class="mb"><b>${COMM_LABEL[c.type] || c.type} · ${c.cust}</b>
        <p>${c.body}</p>
        <div style="font-size:9px;color:var(--muted);margin-top:3px">${c.app} · ${c.status}</div></div>
      <div class="mt">${c.when.split(' · ')[0]}</div></div>`).join('')
    : '<div class="empty">No messages yet.</div>';

  if(!el('cmBody').value) el('cmBody').value = commTemplates(a)[CM.template] || '';
}
function renderCommsAfterAppChange(){
  const a = appBy(el('cmApp').value);
  el('cmBody').value = commTemplates(a)[el('cmTemplate').value];
}
function sendMessage(){
  const a = appBy(el('cmApp').value);
  if(!a){ toast('Select an application.','err'); return; }
  const body = el('cmBody').value.trim();
  if(!body){ toast('Write a message first.','err'); return; }
  const channel = el('cmChannel').value === 'Both' ? 'SMS' : el('cmChannel').value;
  pushComm(a, el('cmTemplate').value, body, channel);
  if(el('cmChannel').value === 'Both') pushComm(a, el('cmTemplate').value, body, 'Email');
  logApp('Access', `Message sent to ${a.cust} · ${COMM_LABEL[el('cmTemplate').value]}`, a.no);
  renderComms();
  toast(`Message sent to ${a.cust} by ${el('cmChannel').value}.`);
}

/* ===================== 14 · REPORTS ===================== */
const REPORTS = [
  {k:'all', n:'All applications report', g:'Register'},
  {k:'daily', n:'Daily applications', g:'Register'},
  {k:'weekly', n:'Weekly applications', g:'Register'},
  {k:'monthly', n:'Monthly applications', g:'Register'},
  {k:'status', n:'Applications by status', g:'Pipeline'},
  {k:'product', n:'Applications by loan product', g:'Pipeline'},
  {k:'officer', n:'Applications by loan officer', g:'Pipeline'},
  {k:'conversion', n:'Approval and rejection rates', g:'Performance'},
  {k:'turnaround', n:'Average processing time', g:'Performance'},
  {k:'pending', n:'Pending applications report', g:'Operations'},
  {k:'incomplete', n:'Incomplete applications report', g:'Operations'},
  {k:'undisbursed', n:'Approved but undisbursed', g:'Operations'},
  {k:'reasons', n:'Rejection reasons analysis', g:'Risk'}
];
let CURRENT_RPT = 'all';
const RPT_PERIOD = {month:'This month', week:'This week', quarter:'Quarter', year:'Year'};
let RPT = 'month';
function periodApps(){
  if(RPT === 'week') return APPLICATIONS.filter(a=>daysBetween(a.date, TODAY) <= 7 && a.date <= TODAY);
  if(RPT === 'quarter') return APPLICATIONS.filter(a=>daysBetween(a.date, TODAY) <= 92);
  if(RPT === 'year') return APPLICATIONS.filter(a=>daysBetween(a.date, TODAY) <= 365);
  return APPLICATIONS.filter(a=>a.date.slice(0,7)==='2026-10');
}
function reportData(key){
  const apps = periodApps();
  const approved = apps.filter(a=>['Approved','Awaiting Disbursement','Disbursed'].includes(a.status));
  switch(key){
    case 'daily': return {
      title:'Daily applications', sub:RPT_PERIOD[RPT],
      cols:[['Date',0],['Applications',1],['Requested value',1],['Approved',1],['Rejected',1]],
      rows:[...new Set(apps.map(a=>a.date))].sort().reverse().map(d=>{
        const r = apps.filter(a=>a.date===d);
        return [fmtShort(d), r.length, sum(r,a=>a.amount),
          r.filter(a=>['Approved','Awaiting Disbursement','Disbursed'].includes(a.status)).length,
          r.filter(a=>a.status==='Rejected').length];
      }), sums:[1,2,3,4]
    };
    case 'weekly': return {
      title:'Weekly applications', sub:RPT_PERIOD[RPT],
      cols:[['Week',0],['Applications',1],['Requested value',1],['Approved value',1],['Conversion %',0]],
      rows:[0,1,2,3,4,5].map(w=>{
        const r = apps.filter(a=>{
          const d = daysBetween(a.date, TODAY);
          return d >= w*7 && d < (w+1)*7;
        });
        if(!r.length) return null;
        const ap = r.filter(a=>['Approved','Awaiting Disbursement','Disbursed'].includes(a.status));
        return ['Week '+(w+1), r.length, sum(r,a=>a.amount), sum(ap,a=>a.approval?.amount||a.amount),
          Math.round(ap.length/r.length*100)+'%'];
      }).filter(Boolean), sums:[1,2,3]
    };
    case 'monthly': return {
      title:'Monthly applications', sub:'Last six months',
      cols:[['Month',0],['Applications',1],['Requested value',1],['Approved',1],['Approved value',1]],
      rows:[['Aug 2026',APPLICATIONS.filter(a=>a.date.slice(0,7)==='2026-08')],
            ['Sep 2026',APPLICATIONS.filter(a=>a.date.slice(0,7)==='2026-09')],
            ['Oct 2026',APPLICATIONS.filter(a=>a.date.slice(0,7)==='2026-10')]].map(([label,r])=>{
        const ap = r.filter(a=>['Approved','Awaiting Disbursement','Disbursed'].includes(a.status));
        return [label, r.length, sum(r,a=>a.amount), ap.length, sum(ap,a=>a.approval?.amount||a.amount)];
      }), sums:[1,2,3,4]
    };
    case 'status': return {
      title:'Applications by status', sub:RPT_PERIOD[RPT],
      cols:[['Status',0],['Applications',1],['Value',1],['Share',0]],
      rows:[...new Set(apps.map(a=>a.status))].map(s=>{
        const r = apps.filter(a=>a.status===s);
        return [s, r.length, sum(r,a=>a.amount), Math.round(r.length/(apps.length||1)*100)+'%'];
      }).sort((x,y)=>y[1]-x[1]), sums:[1,2]
    };
    case 'product': return {
      title:'Applications by loan product', sub:RPT_PERIOD[RPT],
      cols:[['Product',0],['Applications',1],['Requested',1],['Approved',1],['Approval rate',0]],
      rows:PRODUCTS.map(p=>{
        const r = apps.filter(a=>a.product===p.name);
        const ap = r.filter(a=>['Approved','Awaiting Disbursement','Disbursed'].includes(a.status));
        return [p.name, r.length, sum(r,a=>a.amount), ap.length, (r.length?Math.round(ap.length/r.length*100):0)+'%'];
      }).filter(r=>r[1] > 0), sums:[1,2,3]
    };
    case 'officer': return {
      title:'Applications by loan officer', sub:RPT_PERIOD[RPT],
      cols:[['Officer',0],['Applications',1],['Requested',1],['Approved',1],['Avg days to decision',1]],
      rows:OFFICER_NAMES.map(n=>{
        const r = apps.filter(a=>a.officer===n);
        const decided = r.filter(a=>a.decision);
        const avg = decided.length ? Math.round(sum(decided,a=>daysBetween(a.date, a.decision.date))/decided.length*10)/10 : 0;
        return [n, r.length, sum(r,a=>a.amount),
          r.filter(a=>['Approved','Awaiting Disbursement','Disbursed'].includes(a.status)).length, avg];
      }), sums:[1,2,3]
    };
    case 'conversion': return {
      title:'Approval and rejection rates', sub:RPT_PERIOD[RPT],
      cols:[['Measure',0],['Applications',1],['Share',0]],
      rows:[['Submitted', apps.length, '100%'],
        ['Reached assessment', apps.filter(a=>a.assess).length, Math.round(apps.filter(a=>a.assess).length/(apps.length||1)*100)+'%'],
        ['Recommended', apps.filter(a=>a.decision && ['Approved','Recommended'].includes(a.decision.decision)).length,
          Math.round(apps.filter(a=>a.decision && ['Approved','Recommended'].includes(a.decision.decision)).length/(apps.length||1)*100)+'%'],
        ['Authorized', apps.filter(a=>a.approval).length, Math.round(apps.filter(a=>a.approval).length/(apps.length||1)*100)+'%'],
        ['Disbursed', apps.filter(a=>a.status==='Disbursed').length, Math.round(apps.filter(a=>a.status==='Disbursed').length/(apps.length||1)*100)+'%'],
        ['Rejected', apps.filter(a=>a.status==='Rejected').length, Math.round(apps.filter(a=>a.status==='Rejected').length/(apps.length||1)*100)+'%']],
      sums:[1]
    };
    case 'turnaround': return {
      title:'Average processing time', sub:'Days per stage',
      cols:[['Stage',0],['Applications',1],['Target (days)',1],['Average (days)',1],['Within target',0]],
      rows:OPEN_STAGES.map(s=>{
        const r = OPEN_STAGES.includes(s) ? APPLICATIONS.filter(a=>a.stage===s) : [];
        const avg = r.length ? Math.round(sum(r,a=>daysBetween(a.moved,TODAY))/r.length*10)/10 : 0;
        return [STAGE_TAT_LABEL[s], r.length, STAGE_TAT[s], avg, avg <= STAGE_TAT[s] ? 'Yes' : 'No'];
      }), sums:[1,2,3]
    };
    case 'pending': return {
      title:'Pending applications report', sub:'Everything open right now',
      cols:[['Application',0],['Applicant',0],['Status',0],['Waiting on',0],['Days',1],['Owner',0]],
      rows:openApps().map(a=>[a.no, a.cust, a.status, WAIT_LABEL[waitingOn(a)], daysBetween(a.moved,TODAY), a.officer]),
      sums:[4]
    };
    case 'incomplete': return {
      title:'Incomplete applications report', sub:'Missing or invalid documents',
      cols:[['Application',0],['Applicant',0],['Missing documents',0],['Count',1],['Status',0]],
      rows:openApps().filter(a=>missingDocs(a).length || Object.values(a.docs).includes('Invalid'))
        .map(a=>[a.no, a.cust, missingDocs(a).map(k=>DOC_LABELS[k]).join('; ') || 'Invalid document on file',
          missingDocs(a).length, a.status]),
      sums:[3]
    };
    case 'undisbursed': return {
      title:'Approved but undisbursed', sub:'Authorized files not yet released',
      cols:[['Application',0],['Applicant',0],['Approved amount',1],['Authorized',0],['Checks',0],['Status',0]],
      rows:APPLICATIONS.filter(a=>a.approval && a.status!=='Disbursed')
        .map(a=>[a.no, a.cust, a.approval.amount, fmtShort(a.approval.date), dbCheckCount(a)+'/6', a.status]),
      sums:[2]
    };
    case 'reasons': return {
      title:'Rejection reasons analysis', sub:'Closed files this quarter',
      cols:[['Reason',0],['Applications',1],['Value',1],['Share',0]],
      rows:(()=>{
        const closed = APPLICATIONS.filter(a=>['Rejected','Cancelled','Withdrawn'].includes(a.status));
        const map = {};
        closed.forEach(a=>{
          const r = a.decision?.reason || (a.status==='Withdrawn'?'Customer withdrew':a.status==='Cancelled'?'Application cancelled':'Not specified');
          map[r] = map[r] || {n:0, v:0};
          map[r].n++; map[r].v += a.amount;
        });
        return Object.entries(map).map(([r,o])=>[r, o.n, o.v, Math.round(o.n/(closed.length||1)*100)+'%'])
          .sort((x,y)=>y[1]-x[1]);
      })(), sums:[1,2]
    };
    default: return {
      title:'All applications report', sub:RPT_PERIOD[RPT],
      cols:[['Application',0],['Applicant',0],['Product',0],['Requested',1],['Date',0],['Officer',0],['Status',0]],
      rows:apps.map(a=>[a.no, a.cust, a.product, a.amount, fmtShort(a.date), a.officer, a.status]),
      sums:[3]
    };
  }
}
function renderReports(){
  el('rptCount').textContent = REPORTS.length + ' reports';
  el('rptList').innerHTML = REPORTS.map(r=>`<tr>
    <td style="font-weight:700">${r.n}</td><td style="font-size:10.5px;color:var(--muted)">${r.g}</td>
    <td style="text-align:right"><button class="btn btn-ghost btn-sm" data-run="${r.k}"
      style="padding:2px 7px;font-size:10px">Run</button></td></tr>`).join('');
  el('rptList').querySelectorAll('[data-run]').forEach(b=>{
    b.onclick = ()=>{ CURRENT_RPT = b.dataset.run; renderReport(); gotoSec('s14'); };
  });
  renderReport();
}
function renderReport(){
  const d = reportData(CURRENT_RPT);
  el('rptTitle').textContent = d.title;
  el('rptSub').textContent = d.sub + ' · ' + RPT_PERIOD[RPT];
  el('rptRows').textContent = d.rows.length + ' rows';
  el('rptStamp').textContent = fmtDate(TODAY);
  el('rptHead').innerHTML = '<tr>' + d.cols.map(([c,num])=>`<th${num?' class="num"':''}>${c}</th>`).join('') + '</tr>';
  el('rptBody').innerHTML = d.rows.length ? d.rows.map(r=>'<tr>' + r.map((v,i)=>{
    const num = d.cols[i] && d.cols[i][1];
    return `<td${num?' class="num"':''}>${num ? (typeof v==='number'?nf(v):v) : v}</td>`;
  }).join('') + '</tr>').join('') : `<tr><td colspan="${d.cols.length}" class="empty">No data for this period.</td></tr>`;
  el('rptTotals').innerHTML = (d.sums||[]).length ? '<div class="legend" style="margin-top:10px">' +
    d.sums.map(i=>`<b>${d.cols[i][0]}: ${mk(sum(d.rows, r=>Number(r[i])||0))}</b>`).join('') + '</div>' : '';
}
function reportCsv(){
  const d = reportData(CURRENT_RPT);
  return [d.cols.map(c=>c[0])].concat(d.rows.map(r=>r.map(v=>typeof v==='number'?v:String(v))))
    .map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
}
function exportReport(kind){
  const d = reportData(CURRENT_RPT);
  const base = d.title.toLowerCase().replace(/[^a-z0-9]+/g,'-');
  const csv = reportCsv();
  if(kind === 'csv') downloadFile(base+'.csv','text/csv;charset=utf-8','\ufeff'+csv);
  else if(kind === 'xlsx'){ try{ buildXlsx(base+'.xlsx', d); }catch(e){ downloadFile(base+'.csv','text/csv;charset=utf-8','\ufeff'+csv); } }
  else doPrint(d.title);
  logApp('Access','Report exported: '+d.title,'report.'+CURRENT_RPT);
}

/* ---- minimal .xlsx writer (stored zip, inline strings) ---- */
const CRC_TABLE = (()=>{
  const t = new Uint32Array(256);
  for(let n=0;n<256;n++){ let c=n; for(let k=0;k<8;k++) c = c&1 ? 0xEDB88320 ^ (c>>>1) : c>>>1; t[n]=c>>>0; }
  return t;
})();
function crc32(bytes){ let c=0xFFFFFFFF; for(let i=0;i<bytes.length;i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xFF] ^ (c>>>8); return (c ^ 0xFFFFFFFF)>>>0; }
function utf8(str){
  const out=[];
  for(let i=0;i<str.length;i++){
    let c=str.charCodeAt(i);
    if(c<0x80) out.push(c);
    else if(c<0x800){ out.push(0xC0|(c>>6), 0x80|(c&63)); }
    else if(c<0xD800 || c>=0xE000){ out.push(0xE0|(c>>12), 0x80|((c>>6)&63), 0x80|(c&63)); }
    else { i++; const c2=str.charCodeAt(i); const cp=0x10000+((c-0xD800)<<10)+(c2-0xDC00);
      out.push(0xF0|(cp>>18), 0x80|((cp>>12)&63), 0x80|((cp>>6)&63), 0x80|(cp&63)); }
  }
  return new Uint8Array(out);
}
function zipStore(files){
  const chunks=[], central=[]; let offset=0;
  files.forEach(f=>{
    const name=utf8(f.name), data=f.data, crc=crc32(data);
    const lh=new Uint8Array(30+name.length), dv=new DataView(lh.buffer);
    dv.setUint32(0,0x04034b50,true); dv.setUint16(4,20,true); dv.setUint16(10,0,true); dv.setUint16(12,0,true);
    dv.setUint32(14,crc,true); dv.setUint32(18,data.length,true); dv.setUint32(22,data.length,true);
    dv.setUint16(26,name.length,true);
    lh.set(name,30);
    chunks.push(lh, data);
    const ch=new Uint8Array(46+name.length), cv=new DataView(ch.buffer);
    cv.setUint32(0,0x02014b50,true); cv.setUint16(4,20,true); cv.setUint16(6,20,true);
    cv.setUint32(16,crc,true); cv.setUint32(20,data.length,true); cv.setUint32(24,data.length,true);
    cv.setUint16(28,name.length,true); cv.setUint32(42,offset,true);
    ch.set(name,46);
    central.push(ch);
    offset += lh.length + data.length;
  });
  const cdSize = central.reduce((s,c)=>s+c.length,0);
  const end=new Uint8Array(22), ev=new DataView(end.buffer);
  ev.setUint32(0,0x06054b50,true);
  ev.setUint16(8,files.length,true); ev.setUint16(10,files.length,true);
  ev.setUint32(12,cdSize,true); ev.setUint32(16,offset,true);
  const parts=[...chunks, ...central, end];
  const out=new Uint8Array(parts.reduce((s,p)=>s+p.length,0));
  let pos=0; parts.forEach(p=>{ out.set(p,pos); pos+=p.length; });
  return out;
}
function colName(i){ let s=''; i++; while(i>0){ const m=(i-1)%26; s=String.fromCharCode(65+m)+s; i=Math.floor((i-1)/26); } return s; }
function sheetXml(d){
  const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  let rows='';
  [d.cols.map(c=>c[0])].concat(d.rows).forEach((row,ri)=>{
    let cells='';
    row.forEach((v,ci)=>{
      const ref = colName(ci)+(ri+1);
      cells += typeof v === 'number'
        ? `<c r="${ref}"><v>${v}</v></c>`
        : `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${esc(v)}</t></is></c>`;
    });
    rows += `<row r="${ri+1}">${cells}</row>`;
  });
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${rows}</sheetData></worksheet>`;
}
function buildXlsx(name, d){
  const sheetName = (d.title || 'Report').replace(/[\\\/\?\*\[\]:]/g,' ').slice(0,28);
  const files = [
    {name:'[Content_Types].xml', data:utf8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
</Types>`)},
    {name:'_rels/.rels', data:utf8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`)},
    {name:'xl/workbook.xml', data:utf8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets><sheet name="${sheetName.replace(/&/g,'&amp;').replace(/"/g,'&quot;')}" sheetId="1" r:id="rId1"/></sheets></workbook>`)},
    {name:'xl/_rels/workbook.xml.rels', data:utf8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
</Relationships>`)},
    {name:'xl/worksheets/sheet1.xml', data:utf8(sheetXml(d))}
  ];
  const bytes = zipStore(files);
  if(window.self !== window.top){
    openModal('Excel export ready', name + ' · ' + d.rows.length + ' rows', `
      <div class="note gold"><div>A real .xlsx workbook was built in the browser (${(bytes.length/1024).toFixed(1)} KB),
        but downloads are blocked inside this embedded preview. Open the portal in its own tab to save it.</div></div>`,
      [{label:'Close', act:'close'}]);
    return;
  }
  const blob = new Blob([bytes], {type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(a.href), 2000);
  toast(`Exported ${name} · ${d.rows.length} rows.`);
}

/* ===================== 15 · AUDIT & SECURITY ===================== */
const AUD = {cat:'', q:'', page:1, per:12};
function audFiltered(){
  const q = AUD.q.trim().toLowerCase();
  return APP_AUDIT.filter(x=>(!AUD.cat || x.cat===AUD.cat) &&
    (!q || (x.action+' '+x.app+' '+x.actor).toLowerCase().includes(q)));
}
function renderAudit(){
  const rows = audFiltered();
  const pages = Math.max(1, Math.ceil(rows.length/AUD.per));
  if(AUD.page > pages) AUD.page = pages;
  const slice = rows.slice((AUD.page-1)*AUD.per, AUD.page*AUD.per);
  el('audCount').textContent = rows.length + ' events';
  el('audBody').innerHTML = slice.map(x=>`<tr>
    <td style="white-space:nowrap;font-variant-numeric:tabular-nums">${x.time}</td>
    <td><span class="badge ${x.cat==='Decision'?'b-ok':x.cat==='Change'?'b-await':x.cat==='Access'?'b-conf':'b-draft'}">${x.cat}</span></td>
    <td style="font-weight:600;white-space:nowrap">${x.actor}</td>
    <td class="msgcol">${x.action}</td>
    <td class="mono">${x.app}</td>
    <td><span class="chip ${x.result==='Success'?'st-ok':x.result==='Warning'?'st-await':'st-fail'}">${x.result}</span></td></tr>`).join('')
    || '<tr><td colspan="6" class="empty">No audit entries match.</td></tr>';
  el('audPager').innerHTML = `<span>Showing ${rows.length?((AUD.page-1)*AUD.per+1):0}–${Math.min(AUD.page*AUD.per,rows.length)} of ${rows.length}</span>
    <button id="audPrev" ${AUD.page===1?'disabled':''}>‹ Prev</button>
    <button id="audNext" ${AUD.page===pages?'disabled':''}>Next ›</button>`;
  if(el('audPrev')) el('audPrev').onclick = ()=>{ AUD.page--; renderAudit(); };
  if(el('audNext')) el('audNext').onclick = ()=>{ AUD.page++; renderAudit(); };

  const alerts = [
    ['Approval attempted above authority limit','APP-2026-0182 · Esther Mwale · blocked','High'],
    ['Application opened outside the assigned officer','APP-2026-0177 · access by Yamikani Banda','Medium'],
    ['Loan terms changed after recommendation','APP-2026-0183 · amount reduced 1,500,000 → 1,350,000','Medium'],
    ['Document downloaded after rejection','APP-2026-0175 · NRC copy','Low']
  ];
  el('secAlertCount').textContent = alerts.length;
  el('secAlerts').innerHTML = alerts.map(([t,s,lvl])=>`<div class="lrow">
    <div class="lic" style="background:${lvl==='High'?'#FDECEC':'#FFF4E0'};color:${lvl==='High'?'#B32C2C':'#9A6A0D'}">!</div>
    <div><div class="lt">${t}</div><div class="ls">${s}</div></div>
    <div class="lr"><span class="mini-tag ${lvl==='High'?'r':'a'}">${lvl}</span></div></div>`).join('');

  const perms = [
    ['Create application','✓','✓','✓','✓'],
    ['Assign officer','✓','✓','✓','✓'],
    ['Verify KYC','✓','✓','✓','✓'],
    ['Assess & recommend','—','✓','✓','✓'],
    ['Approve up to 1,000,000','—','✓','✓','✓'],
    ['Approve up to 5,000,000','—','—','✓','✓'],
    ['Reject application','—','✓','✓','✓'],
    ['Edit approved terms','—','—','✓','✓'],
    ['Forward to disbursements','—','✓','✓','✓'],
    ['Reopen a closed file','—','—','✓','✓']
  ];
  el('secMatrix').innerHTML = perms.map(([p,...v])=>`<tr>
    <td style="font-size:10.5px">${p}</td>
    ${v.map(x=>`<td style="text-align:center;color:${x==='✓'?'#157A50':'#C3C8D2'};font-weight:800">${x}</td>`).join('')}
  </tr>`).join('');
}

/* ===================== BOOT ===================== */
function renderAll(){
  renderOverview();
  renderRegister();
  renderVerification();
  renderAssessment();
  renderDocuments();
  renderReview();
  renderApproval();
  renderPending();
  renderRejected();
  renderWorkflow();
  renderHandover();
  renderComms();
  renderReports();
  renderAudit();
}
const on = (id, ev, fn)=>{ const n = el(id); if(n) n.addEventListener(ev, fn); };
const bindSeg = (id, attr, cb)=>{
  const host = el(id); if(!host) return;
  host.querySelectorAll('button').forEach(b=>{
    b.onclick = ()=>{
      host.querySelectorAll('button').forEach(x=>x.classList.remove('on'));
      b.classList.add('on');
      cb(b.dataset[attr]);
    };
  });
};
function boot(){
  /* topbar */
  on('menuBtn','click', ()=>el('sidebar').classList.toggle('open'));
  on('newAppBtn','click', ()=>{ gotoSec('s3'); el('naSearch')?.focus(); });
  on('newAppBtn2','click', ()=>{ gotoSec('s3'); el('naSearch')?.focus(); });
  on('reviewBtn','click', ()=>gotoSec('s7'));
  on('exportAll','click', ()=>{
    downloadFile('loan-applications.csv','text/csv;charset=utf-8','\ufeff' +
      ['Application,Applicant,Customer ID,Product,Amount,Term,Frequency,Date,Status,Officer']
        .concat(APPLICATIONS.map(a=>[a.no,a.cust,a.custId,a.product,a.amount,a.term,a.freq,a.date,a.status,a.officer]
          .map(v=>`"${v}"`).join(','))).join('\n'));
    logApp('Access','Application register exported','register');
  });
  on('bellBtn','click', ()=>{
    const late = openApps().filter(isLate);
    const auth = APPLICATIONS.filter(a=>a.status==='Awaiting Authorization');
    openModal('Deadlines & follow-ups', `${late.length} past deadline · ${auth.length} awaiting authorization`, `
      ${late.slice(0,6).map(a=>`<div class="lrow"><div class="lic" style="background:#FDECEC;color:#B32C2C">!</div>
        <div><div class="lt">${a.cust} · ${a.no}</div><div class="ls">${a.stage} · due ${fmtShort(a.deadline)}</div></div>
        <div class="lr"><span class="chip st-rej">Late</span></div></div>`).join('') ||
        '<div class="empty">Nothing overdue.</div>'}`,
      [{label:'Close', act:'close'}, {label:'Open workflow', cls:'btn-gold', act:()=>{ closeModal(); gotoSec('s11'); }}]);
  });
  on('globalSearch','input', e=>{
    const q = e.target.value.trim();
    if(q.length > 1){ REG.q = q; REG.stage=''; REG.status=''; REG.page = 1; if(el('regSearch')) el('regSearch').value = q; renderRegister(); }
  });

  /* 1 */
  on('ovOpenRegister','click', ()=>gotoSec('s2'));

  /* 2 */
  on('regSearch','input', e=>{ REG.q = e.target.value; REG.page = 1; renderRegister(); });
  on('regStatus','change', e=>{ REG.status = e.target.value; REG.stage=''; REG.page = 1; renderRegister(); });
  on('regProduct','change', e=>{ REG.product = e.target.value; REG.page = 1; renderRegister(); });
  on('regOfficer','change', e=>{ REG.officer = e.target.value; REG.page = 1; renderRegister(); });
  on('regFrom','change', e=>{ REG.from = e.target.value; REG.page = 1; renderRegister(); });
  on('regTo','change', e=>{ REG.to = e.target.value; REG.page = 1; renderRegister(); });
  on('regSort','change', e=>{ REG.sort = e.target.value; renderRegister(); });
  on('regExport','click', ()=>{
    const rows = regFiltered();
    downloadFile('applications-filtered.csv','text/csv;charset=utf-8','\ufeff' +
      ['Application,Applicant,Product,Amount,Date,Term,Officer,Status']
        .concat(rows.map(a=>[a.no,a.cust,a.product,a.amount,a.date,a.term,a.officer,a.status]
          .map(v=>`"${v}"`).join(','))).join('\n'));
    logApp('Access','Filtered register exported ('+rows.length+' rows)','register');
  });
  on('regPrint','click', ()=>doPrint('Loan applications register'));

  /* 3 */
  initNewApp();

  /* 4 */
  bindSeg('verTabs','vt', v=>{ VER.tab = v; renderVerification(); });

  /* 5 */
  ['asIncome','asExpenses','asOblig','asAmount','asTerm','asRate'].forEach(id=>
    on(id,'input', ()=>{ if(AS.sel) recalcAssessment(); }));
  el('asRiskPick').querySelectorAll('[data-risk]').forEach(c=>{
    c.onclick = ()=>{
      el('asRiskPick').querySelectorAll('[data-risk]').forEach(x=>x.classList.remove('on'));
      c.classList.add('on');
      el('asRiskBadge').textContent = 'Risk: ' + c.dataset.risk;
    };
  });
  on('asReset','click', ()=>{ if(AS.sel) loadAssessment(); else toast('Select an application first.','err'); });
  on('asRun','click', ()=>{ if(!AS.sel){ toast('Select an application first.','err'); return; } recalcAssessment(); toast('Assessment recalculated.','info'); });
  on('asSave','click', saveAssessment);

  /* 6 */
  on('docApp','change', e=>{ DOC.app = e.target.value; renderDocuments(); });
  on('docRequest','click', ()=>{
    const a = DOC.app ? appBy(DOC.app) : null;
    if(a) requestDocuments(a); else toast('Select an application first.','err');
  });

  /* 7 */
  bindSeg('revTabs','rt', v=>{ REV.tab = v; REV.sel = null; renderReview(); });

  /* 8 */
  bindSeg('apprTabs','at', v=>{ APPR.tab = v; APPR.sel = null; renderApproval(); });

  /* 9 */
  bindSeg('pendTabs','pt', v=>{ PEND.tab = v; renderPending(); });
  on('pendExport','click', ()=>{
    downloadFile('pending-applications.csv','text/csv;charset=utf-8','\ufeff' +
      ['Application,Applicant,Status,Waiting on,Days,Owner']
        .concat(openApps().map(a=>[a.no,a.cust,a.status,WAIT_LABEL[waitingOn(a)],daysBetween(a.moved,TODAY),a.officer]
          .map(v=>`"${v}"`).join(','))).join('\n'));
  });
  on('pendTask','click', ()=>{
    openModal('Add follow-up task', 'Reminder for a stalled file', `
      <div class="fg"><label>Application</label><select id="ptApp">
        ${openApps().map(a=>`<option value="${a.no}">${a.no} · ${a.cust}</option>`).join('')}</select></div>
      <div class="fg" style="margin-top:9px"><label>Task</label>
        <input id="ptWhat" placeholder="e.g. Chase the payslip"></div>
      <div class="fg" style="margin-top:9px"><label>Due</label>
        <input id="ptDue" type="date" value="${addDays(TODAY,3)}"></div>`,
      [{label:'Cancel', act:'close'}, {label:'Add task', cls:'btn-gold', act:()=>{
        const a = appBy(el('ptApp').value);
        PEND_TASKS.unshift({app:a.no, what:el('ptWhat').value || 'Follow up with the customer', due:el('ptDue').value, owner:a.officer, done:false});
        logApp('Change','Follow-up task created', a.no);
        closeModal(); renderPending();
        toast('Follow-up task added.');
      }}]);
  });

  /* 10 */
  bindSeg('rejTabs','jt', v=>{ REJ.tab = v; renderRejected(); });

  /* 11 */
  on('wfAssign','click', ()=>assignModal(WF.sel));
  on('wfEscalate','click', ()=>{
    const late = openApps().filter(isLate);
    late.forEach(a=>{ a.internal = a.internal || [];
      a.internal.unshift({by:'Memory Phiri', when:TODAY+' · '+nowTime(), body:'Escalated to the credit supervisor — past deadline.'}); });
    logApp('Change','Escalated '+late.length+' overdue applications','workflow','Warning');
    renderWorkflow(); renderAudit();
    toast(late.length ? `${late.length} applications escalated.` : 'Nothing is overdue.','info');
  });
  on('wfNoteBtn','click', ()=>{
    if(!WF.sel){ toast('Select an application on the board first.','err'); return; }
    openModal('Internal note', WF.sel, `
      <div class="fg"><label>Note</label>
        <textarea id="wfNoteBody" style="min-height:64px" placeholder="Visible to staff only"></textarea></div>`,
      [{label:'Cancel', act:'close'}, {label:'Save note', cls:'btn-gold', act:()=>{
        const a = appBy(WF.sel);
        a.internal = a.internal || [];
        a.internal.unshift({by:'Memory Phiri', when:TODAY+' · '+nowTime(), body:el('wfNoteBody').value || '—'});
        logApp('Change','Internal note added', a.no);
        closeModal(); renderWorkflow();
        toast('Note saved.');
      }}]);
  });

  /* 12 */
  on('dbGen','click', ()=>{ if(DB.sel) generateSchedule(appBy(DB.sel)); else toast('Select an application first.','err'); });

  /* 13 */
  on('cmApp','change', renderCommsAfterAppChange);
  on('cmTemplate','change', ()=>{
    const a = appBy(el('cmApp').value);
    el('cmBody').value = commTemplates(a)[el('cmTemplate').value];
    el('cmHint').textContent = 'Template: ' + COMM_LABEL[el('cmTemplate').value];
  });
  on('cmSend','click', sendMessage);
  on('cmReset','click', renderCommsAfterAppChange);
  bindSeg('cmTabs','ct', v=>{ CM.tab = v; renderComms(); });

  /* 14 */
  bindSeg('rptPeriod','rp', v=>{ RPT = v; renderReport(); });
  on('rptCsv','click', ()=>exportReport('csv'));
  on('rptXls','click', ()=>exportReport('xlsx'));
  on('rptPdf','click', ()=>exportReport('pdf'));
  on('rptPrint','click', ()=>doPrint('Loan applications report'));

  /* 15 */
  bindSeg('audTabs','ac', v=>{ AUD.cat = v; AUD.page = 1; renderAudit(); });
  on('audSearch','input', e=>{ AUD.q = e.target.value; AUD.page = 1; renderAudit(); });
  on('audExport','click', ()=>{
    downloadFile('application-audit.csv','text/csv;charset=utf-8','\ufeff' +
      ['Time,Category,Actor,Action,Application,Result']
        .concat(audFiltered().map(x=>[x.time,x.cat,x.actor,x.action.replace(/,/g,';'),x.app,x.result]
          .map(v=>`"${v}"`).join(','))).join('\n'));
  });

  on('modalClose','click', closeModal);
  el('modal').addEventListener('click', e=>{ if(e.target === el('modal')) closeModal(); });

  /* nav guard for modules that are not built yet */
  document.querySelectorAll('.nav-item').forEach(item=>{
    item.addEventListener('click', e=>{
      const p = item.dataset.page;
      if(['dashboard','disbursements','notifications','staff','reports','settings','repayments','applications','collections'].includes(p)) return;
      e.preventDefault();
      toast('This module is queued for build.','info');
      el('sidebar').classList.remove('open');
    });
  });

  /* section navigation with scroll spy */
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

  renderAll();
  spy();
}

window.APPLICATIONS_APP = {APPLICATIONS, CUSTOMERS, PRODUCTS, OFFICERS: OFFICER_NAMES, APP_AUDIT,
  renderAll, reportData, pmt, statusTone, openFile, saveAssessment, authorizeApp};

boot();
</script>
</body>
</html>
