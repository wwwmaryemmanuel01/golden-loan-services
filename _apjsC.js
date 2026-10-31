/* ============================================================
   LOAN APPLICATIONS  (3/4) · approval & authorization, pending
   files, closed files, assignment and workflow
   ============================================================ */

/* ---- communication helper (used across sections) ---- */
function pushComm(a, type, body, channel){
  if(!a.comms) a.comms = [];
  a.comms.unshift({type, channel: channel || 'SMS', body, when: TODAY + ' · ' + nowTime(),
    status: channel === 'Email' ? 'Delivered' : 'Delivered'});
  if(a.comms.length > 20) a.comms.pop();
}
const COMM_LABEL = {received:'Application received', documents:'Documents requested', review:'Under review',
  approved:'Application approved', rejected:'Application rejected', correction:'Corrections required',
  disbursement:'Disbursement status'};

/* ===================== 8 · APPROVAL & AUTHORIZATION ===================== */
const APPR = {sel:null, tab:'pending'};
const AUTH_LIMITS = [{level:1, role:'Credit Manager', name:'Chikondi Mwale', limit:1000000},
                     {level:2, role:'Head of Credit', name:'Grace Mvula', limit:5000000},
                     {level:3, role:'Managing Director', name:'Mwayi Kamanga', limit:25000000}];
const apprApps = () => APPLICATIONS.filter(a=>a.recommend || ['Awaiting Authorization','Approved','Awaiting Disbursement'].includes(a.status));
function apprStageOf(a){
  if(a.status === 'Awaiting Authorization') return 'pending';
  if(a.approval && (a.approval.conditions && a.approval.conditions !== 'None.')) return 'conditions';
  return 'authorized';
}
function renderApproval(){
  const all = apprApps();
  const pending = all.filter(a=>apprStageOf(a)==='pending');
  const auth = all.filter(a=>a.approval && a.status !== 'Awaiting Authorization');
  const cond = all.filter(a=>apprStageOf(a)==='conditions');
  el('apprCount').textContent = auth.length + ' approved';
  el('apprAwait').textContent = pending.length + ' awaiting authorization';
  el('apprTiles').innerHTML = [
    ['Authorized value', mk(sum(auth,a=>a.approval?a.approval.amount:0)), auth.length+' files signed off', 'gold'],
    ['Pending authorization', String(pending.length), mk(sum(pending,a=>a.recommend?a.recommend.amount:a.amount)), ''],
    ['With conditions', String(cond.length), 'conditions must clear before handover', ''],
    ['Awaiting disbursement', String(APPLICATIONS.filter(a=>a.status==='Awaiting Disbursement').length), 'forwarded to finance', ''],
    ['Average decision time', '2.4 days', 'from assessment to approval', 'blue']
  ].map(([l,v,s,cls])=>`<div class="kpi ${cls}"><div class="kl">${l}</div><div class="kv">${v}</div>
    <div class="ks">${s}</div></div>`).join('');

  const rows = all.filter(a=>apprStageOf(a)===APPR.tab);
  el('apprBody').innerHTML = rows.length ? rows.map(a=>{
    const amt = a.approval?.amount || a.recommend?.amount || a.amount;
    const lvl = a.approval?.level || 0;
    return `<tr data-appr="${a.no}" style="cursor:pointer">
      <td class="mono">${a.no}</td><td>${a.cust}</td><td class="num">${nf(amt)}</td>
      <td>${['—','Level 1','Level 2','Level 3'][lvl] || '—'}</td>
      <td><span class="chip ${a.status==='Awaiting Authorization'?'st-await':a.status==='Approved'?'st-ok':'st-auth'}">${a.status==='Awaiting Authorization'?'Needs sign-off':a.status}</span></td>
      <td style="text-align:right"><button class="btn btn-ghost btn-sm" data-appr="${a.no}"
        style="padding:2px 7px;font-size:10px">Open</button></td></tr>`;
  }).join('') : '<tr><td colspan="6" class="empty">Nothing in this view.</td></tr>';
  el('apprBody').querySelectorAll('[data-appr]').forEach(n=>{
    n.onclick = ()=>{ APPR.sel = n.dataset.appr; renderApproval(); };
  });

  const a = APPR.sel ? appBy(APPR.sel) : null;
  el('apprSub').textContent = a ? `${a.no} · ${a.cust}` : 'Nothing selected';
  el('apprLevel').textContent = a ? 'Level ' + ((a.approval?.level||0)+ (a.status==='Awaiting Authorization'?1:0)) : 'Level 1';
  if(!a){
    el('apprPanel').innerHTML = '<div class="empty">Select an approved application.</div>';
  } else {
    const amt = a.approval?.amount || a.recommend?.amount || a.amount;
    const rate = a.approval?.rate || a.recommend?.rate || productBy(a.product).rate;
    const term = a.approval?.term || a.recommend?.term || a.term;
    const needed = amt > AUTH_LIMITS[1].limit ? 3 : amt > AUTH_LIMITS[0].limit ? 2 : 1;
    const done = a.approval ? a.approval.level : 0;
    el('apprPanel').innerHTML = `
      <div class="kv"><span class="k">Recommended by</span><span class="v">${a.decision?.by || '—'}</span></div>
      <div class="kv"><span class="k">Amount</span><span class="v big">${mk(amt)}</span></div>
      <div class="kv"><span class="k">Rate · term</span><span class="v">${rate}% × ${term} months</span></div>
      <div class="kv"><span class="k">Instalment</span><span class="v">${mk(pmt(amt, rate, term))}</span></div>
      <div class="kv"><span class="k">Authority required</span><span class="v">${needed} level${needed>1?'s':''} · up to ${mk(AUTH_LIMITS[needed-1].limit)}</span></div>
      <div class="minihead">Approval chain</div>
      <div class="chain">${AUTH_LIMITS.slice(0, needed).map(l=>{
        const state = l.level <= done ? 'done' : (l.level === done+1 ? 'cur' : '');
        const who = l.level <= done ? 'Approved by ' + (a.approval?.by || l.name) : state==='cur' ? 'Waiting for ' + l.role : 'Not started';
        return `<div class="cl"><div class="cn ${state}">${l.level<=done?'✓':l.level}</div>
          <div class="cb"><b>${l.role} — ${l.name}</b><span>${who} · limit ${mk(l.limit)}</span></div></div>`;
      }).join('')}</div>
      ${a.status === 'Awaiting Authorization' ? `
        <div class="fg" style="margin-top:10px"><label>Approved amount</label><input id="apAmount" type="number" value="${amt}"></div>
        <div class="form-grid" style="margin-top:9px">
          <div class="fg"><label>Rate (% / month)</label><input id="apRate" type="number" step="0.1" value="${rate}"></div>
          <div class="fg"><label>Term (months)</label><input id="apTerm" type="number" value="${term}"></div>
        </div>
        <div class="fg" style="margin-top:9px"><label>Approval conditions</label>
          <textarea id="apCond" style="min-height:52px" placeholder="e.g. guarantor signature, insurance ceded, standing order">${a.approval?.conditions && a.approval.conditions!=='None.' ? a.approval.conditions : ''}</textarea></div>
        <div class="form-actions">
          <button class="btn btn-gold" id="apAuthorize">Authorize at level ${done+1}</button>
          <button class="btn btn-ghost" id="apDecline">Send back</button>
        </div>` : `
        <div class="note"><div><b>Authorized</b> · ${a.approval?.by || '—'} · ${a.approval?fmtDate(a.approval.date):'—'}
          ${a.approval?.conditions ? '<br>Conditions: '+a.approval.conditions : ''}</div></div>
        <div class="form-actions">
          <button class="btn btn-ghost" id="apToHandover">Open handover</button>
        </div>`}`;
    if(el('apAuthorize')) el('apAuthorize').onclick = ()=>authorizeApp(a, needed);
    if(el('apDecline')) el('apDecline').onclick = ()=>{
      a.status = 'Pending Approval'; a.stage = 'Review'; a.recommend = null;
      logApp('Decision','Authorization declined — returned to review', a.no, 'Warning');
      renderAll(); toast(`${a.no} sent back to review.`,'info');
    };
    if(el('apToHandover')) el('apToHandover').onclick = ()=>{ renderHandover(); gotoSec('s12'); };
  }
  renderApprHistory();
}
function authorizeApp(a, needed){
  const amount = Number(el('apAmount').value)||a.amount;
  const rate = Number(el('apRate').value)||productBy(a.product).rate;
  const term = Number(el('apTerm').value)||a.term;
  const cond = el('apCond').value.trim();
  const level = (a.approval?.level || 0) + 1;
  if(amount > AUTH_LIMITS[level-1].limit){
    toast(`Above the ${AUTH_LIMITS[level-1].role} limit of ${mk(AUTH_LIMITS[level-1].limit)}.`,'err');
    logApp('Decision','Authorization blocked — above authority limit', a.no, 'Blocked');
    return;
  }
  a.approval = {level, by:AUTH_LIMITS[level-1].name, date:TODAY, amount, rate, term,
    fee:Math.round(amount*productBy(a.product).fee/100), conditions: cond || 'None.'};
  if(level < needed && amount > AUTH_LIMITS[level].limit){
    a.status = 'Awaiting Authorization';
  } else {
    a.status = 'Approved'; a.stage = 'Handover';
    pushComm(a,'approved', `Your loan of ${mk(amount)} has been approved. Our team will contact you about disbursement.`,'SMS');
  }
  a.moved = TODAY;
  logApp('Decision', `Authorized level ${level} · ${mk(amount)} at ${rate}% × ${term}m`, a.no);
  renderAll();
  toast(`${a.no} authorized at level ${level} · ${mk(amount)}.`);
}
function renderApprHistory(){
  const rows = APPLICATIONS.filter(a=>a.approval)
    .sort((x,y)=>String(y.approval.date).localeCompare(String(x.approval.date)));
  el('apprHistCount').textContent = rows.length;
  el('apprHistory').innerHTML = rows.map(a=>`<tr>
    <td style="white-space:nowrap;font-size:10.5px">${fmtDate(a.approval.date)}</td>
    <td class="mono">${a.no}</td>
    <td>Level ${a.approval.level}</td>
    <td style="font-size:10.5px">${a.approval.by}</td>
    <td class="num">${nf(a.approval.amount)}</td>
    <td>${a.approval.rate}%</td>
    <td class="msgcol" style="font-size:10px;color:var(--muted)">${a.approval.conditions}</td></tr>`).join('')
    || '<tr><td colspan="7" class="empty">No approvals recorded yet.</td></tr>';
}

/* ===================== 9 · PENDING & INCOMPLETE ===================== */
const PEND = {tab:''};
const PEND_TASKS = [
  {app:'APP-2026-0190', what:'Chase bank statement from Sarah Kaunda', due:'2026-10-31', owner:'Blessings Tembo', done:false},
  {app:'APP-2026-0188', what:'Group certificate — third member signature', due:'2026-11-01', owner:'Linda Mhango', done:false},
  {app:'APP-2026-0177', what:'Return current 6-month statement to file', due:'2026-10-29', owner:'Yamikani Banda', done:false},
  {app:'APP-2026-0166', what:'Group registration certificate outstanding', due:'2026-11-03', owner:'Linda Mhango', done:false}
];
function waitingOn(a){
  if(a.status === 'Awaiting Documents') return 'documents';
  if(a.status === 'Returned for Correction') return 'returned';
  if(a.status === 'On Hold') return 'hold';
  if(a.stage === 'Verification') return 'verification';
  if(a.stage === 'Assessment') return 'assessment';
  if(a.status === 'Pending Approval' || a.status === 'Awaiting Authorization') return 'approval';
  return 'information';
}
const WAIT_LABEL = {documents:'Customer documents', information:'Customer information', verification:'Verification',
  assessment:'Credit assessment', approval:'Approval decision', returned:'Correction by officer', hold:'On hold'};
function renderPending(){
  const open = openApps().filter(a=>a.stage !== 'Handover');
  const by = k => open.filter(a=>waitingOn(a)===k).length;
  const late = open.filter(isLate);
  el('pendLate').textContent = late.length + ' past deadline';
  el('pendTiles').innerHTML = [
    ['Awaiting documents', by('documents'), 'customer to supply paperwork', ''],
    ['Awaiting information', by('information'), 'contact details or clarifications', ''],
    ['Awaiting verification', by('verification'), 'KYC and references', ''],
    ['Awaiting assessment', by('assessment'), 'credit analysis', 'blue'],
    ['Awaiting approval', by('approval'), 'review or authorization', 'gold'],
    ['Returned for correction', by('returned'), 'back with the officer', ''],
    ['On hold', by('hold'), 'paused at the customer’s request', ''],
    ['Past review deadline', late.length, 'escalate to the supervisor', 'red']
  ].map(([l,v,s,cls])=>`<div class="kpi ${cls}"><div class="kl">${l}</div><div class="kv">${v}</div>
    <div class="ks">${s}</div></div>`).join('');

  const rows = (PEND.tab ? open.filter(a=>waitingOn(a)===PEND.tab) : open)
    .sort((x,y)=>daysBetween(y.moved,TODAY)-daysBetween(x.moved,TODAY));
  el('pendBody').innerHTML = rows.length ? rows.map(a=>{
    const days = daysBetween(a.moved, TODAY);
    return `<tr>
      <td class="mono">${a.no}</td><td>${a.cust}</td>
      <td><span class="mini-tag ${a.status==='Returned for Correction'?'a':''}">${WAIT_LABEL[waitingOn(a)]}</span></td>
      <td class="num" style="color:${isLate(a)?'#B32C2C':'inherit'};font-weight:${isLate(a)?'800':'inherit'}">${days}</td>
      <td style="font-size:10.5px">${a.officer}</td>
      <td style="text-align:right"><button class="btn btn-ghost btn-sm" data-nudge="${a.no}"
        style="padding:2px 7px;font-size:10px">Follow up</button></td></tr>`;
  }).join('') : '<tr><td colspan="6" class="empty">Nothing waiting.</td></tr>';
  el('pendBody').querySelectorAll('[data-nudge]').forEach(b=>{
    b.onclick = ()=>nudgeApp(appBy(b.dataset.nudge));
  });

  el('pendTasks').innerHTML = PEND_TASKS.length ? PEND_TASKS.map((t,i)=>`
    <div class="lrow"><div class="lic" style="background:${t.done?'#E7F6EF':'#FFF4E0'};color:${t.done?'#157A50':'#9A6A0D'}">${t.done?'✓':'!'}</div>
      <div><div class="lt" style="${t.done?'text-decoration:line-through;opacity:.6':''}">${t.what}</div>
        <div class="ls">${t.app} · ${t.owner} · due ${fmtShort(t.due)}</div></div>
      <div class="lr"><button class="btn btn-ghost btn-sm" data-pdone="${i}" style="padding:2px 7px;font-size:10px">${t.done?'Undo':'Done'}</button></div></div>`).join('')
    : '<div class="empty">No follow-up tasks.</div>';
  el('pendTasks').querySelectorAll('[data-pdone]').forEach(b=>{
    b.onclick = ()=>{
      const t = PEND_TASKS[Number(b.dataset.pdone)];
      t.done = !t.done;
      logApp('Change', (t.done?'Follow-up completed · ':'Follow-up reopened · ')+t.what, t.app);
      renderPending();
    };
  });
}
function nudgeApp(a){
  openModal('Follow up', `${a.no} · ${a.cust}`, `
    <div class="kv"><span class="k">Waiting on</span><span class="v">${WAIT_LABEL[waitingOn(a)]}</span></div>
    <div class="kv"><span class="k">Owner</span><span class="v">${a.officer}</span></div>
    <div class="kv"><span class="k">Days in stage</span><span class="v">${daysBetween(a.moved, TODAY)}</span></div>
    <div class="fg" style="margin-top:10px"><label>Follow-up action</label>
      <select id="ndAct">
        <option>Call the customer</option><option>Send an SMS reminder</option>
        <option>Reassign to another officer</option><option>Escalate to supervisor</option>
        <option>Put the application on hold</option>
      </select></div>
    <div class="fg" style="margin-top:9px"><label>Note</label>
      <textarea id="ndNote" style="min-height:48px" placeholder="What was agreed"></textarea></div>`,
    [{label:'Cancel', act:'close'}, {label:'Record follow-up', cls:'btn-gold', act:()=>{
      const act = el('ndAct').value;
      PEND_TASKS.unshift({app:a.no, what:act+' — '+(el('ndNote').value||a.cust), due:addDays(TODAY,3), owner:a.officer, done:false});
      if(act === 'Put the application on hold'){ a.status='On Hold'; }
      logApp('Change', 'Follow-up: '+act, a.no);
      closeModal(); renderPending(); renderOverview();
      toast(`Follow-up recorded for ${a.no}.`,'info');
    }}]);
}

/* ===================== 10 · REJECTED / CANCELLED ===================== */
const REJ = {tab:''};
function renderRejected(){
  const closed = APPLICATIONS.filter(a=>['Rejected','Cancelled','Withdrawn','Closed','Disbursed'].includes(a.status));
  el('rejCount').textContent = closed.length + ' closed';
  const rows = REJ.tab ? closed.filter(a=>a.status===REJ.tab) : closed;
  el('rejBody').innerHTML = rows.map(a=>`<tr>
    <td class="mono">${a.no}</td><td>${a.cust}</td>
    <td><span class="chip ${statusTone(a.status)}">${a.status}</span></td>
    <td class="msgcol" style="font-size:10px">${a.decision?.reason || a.decision?.note || '—'}</td>
    <td style="font-size:10.5px">${a.decision?.by || '—'}</td>
    <td style="font-size:10.5px;white-space:nowrap">${a.decision?fmtShort(a.decision.date):'—'}</td>
    <td style="text-align:right"><button class="btn btn-ghost btn-sm" data-recon="${a.no}"
      style="padding:2px 7px;font-size:10px">${a.recon?'Reopened':'Reconsider'}</button></td></tr>`).join('')
    || '<tr><td colspan="7" class="empty">Nothing in this view.</td></tr>';
  el('rejBody').querySelectorAll('[data-recon]').forEach(b=>{
    b.onclick = ()=>reconsider(appBy(b.dataset.recon));
  });

  const reasons = {};
  closed.forEach(a=>{
    const r = a.decision?.reason || (a.status==='Withdrawn'?'Customer withdrew':'Duplicate application');
    reasons[r] = (reasons[r]||0)+1;
  });
  const max = Math.max(1, ...Object.values(reasons));
  el('rejReasons').innerHTML = Object.entries(reasons).sort((x,y)=>y[1]-x[1]).map(([r,n])=>`
    <div class="prow"><div class="pl" title="${r}">${r}</div>
      <div class="pt"><i style="width:${Math.round(n/max*100)}%;background:#D93F3F"></i></div>
      <div class="pv">${n}</div></div>`).join('') ||
    '<div class="empty">No closed files.</div>';

  const recon = APPLICATIONS.filter(a=>a.recon);
  el('rejRecon').innerHTML = recon.length ? recon.map(a=>`
    <div class="lrow"><div class="lic" style="background:var(--gold-soft);color:var(--gold-dark)">${initials(a.cust)}</div>
      <div><div class="lt">${a.cust} · ${a.no}</div>
        <div class="ls">Reopened ${fmtShort(a.recon.date)} · was ${a.recon.was}</div></div>
      <div class="lr"><span class="mini-tag a">Reconsideration</span></div></div>`).join('')
    : `<div class="note"><div>No reconsideration requests. Rejected applicants can reapply after 30 days,
        or immediately with a guarantor and a lower amount.</div></div>`;

  const repeat = CUSTOMERS.map(c=>({c, apps:APPLICATIONS.filter(a=>a.custId===c.id)})).filter(x=>x.apps.length>1);
  if(repeat.length){
    el('rejRecon').innerHTML += `<div class="minihead">Reapplication history</div>` + repeat.slice(0,4).map(x=>`
      <div class="lrow"><div class="lic">${x.apps.length}×</div>
        <div><div class="lt">${x.c.name}</div>
          <div class="ls">${x.apps.map(a=>a.no.slice(-4)+' '+a.status).join(' · ')}</div></div></div>`).join('');
  }
}
function reconsider(a){
  openModal('Reconsider application', `${a.no} · ${a.status}`, `
    <div class="note gold"><div>Reopening returns the file to verification with its history intact. The original
      decision stays in the audit trail.</div></div>
    <div class="kv" style="margin-top:8px"><span class="k">Original decision</span><span class="v">${a.decision?.decision || a.status}</span></div>
    <div class="kv"><span class="k">Reason given</span><span class="v">${a.decision?.reason || a.decision?.note || '—'}</span></div>
    <div class="fg" style="margin-top:10px"><label>Reconsideration basis</label>
      <select id="rcBasis"><option>New information supplied</option><option>Documents corrected</option>
        <option>Affordability improved</option><option>Guarantor added</option><option>Manager discretion</option></select></div>`,
    [{label:'Cancel', act:'close'}, {label:'Reopen for reconsideration', cls:'btn-gold', act:()=>{
      a.recon = {was:a.status, date:TODAY, basis:el('rcBasis').value};
      a.status = 'Under Review'; a.stage = 'Verification'; a.moved = TODAY;
      a.deadline = addDays(TODAY, 7);
      a.decision = null; a.recommend = null; a.approval = null;
      logApp('Change','Reopened for reconsideration · '+el('rcBasis').value, a.no);
      closeModal(); renderAll();
      toast(`${a.no} reopened for reconsideration.`);
    }}]);
}

/* ===================== 11 · ASSIGNMENT & WORKFLOW ===================== */
const WF = {sel:null};
const STAGE_TAT_LABEL = {Intake:'Intake & documents', Verification:'Verification', Assessment:'Credit assessment',
  Review:'Review & recommendation', Approval:'Approval & authorization', Handover:'Handover to disbursements'};
function renderWorkflow(){
  const open = openApps();
  el('wfLoadTotal').textContent = open.length + ' open';
  el('wfLoad').innerHTML = OFFICER_NAMES.map(n=>{
    const mine = open.filter(a=>a.officer===n);
    const late = mine.filter(isLate).length;
    const pct = Math.round(mine.length / Math.max(1, Math.max(...OFFICER_NAMES.map(o=>open.filter(x=>x.officer===o).length))) * 100);
    return `<div class="wtile"><div class="wv">${initials(n)}</div>
      <div style="flex:1;min-width:0"><div class="wn">${n}</div>
        <div class="ws">${mine.length} open · ${late} past deadline</div>
        <div class="meter ${late?'red':''}" style="margin-top:5px"><i style="width:${pct}%"></i></div></div>
      <div class="wc">${mine.length}</div>
      <button class="btn btn-ghost btn-sm" data-wasg="${n}" style="padding:2px 7px;font-size:10px">Open</button></div>`;
  }).join('');
  el('wfLoad').querySelectorAll('[data-wasg]').forEach(b=>{
    b.onclick = ()=>assignModal(open.filter(a=>a.officer===b.dataset.wasg)[0]?.no);
  });

  el('wfStages').innerHTML = OPEN_STAGES.map(s=>{
    const list = APPLICATIONS.filter(a=>a.stage===s);
    const late = list.filter(isLate).length;
    return `<div class="lrow"><div class="lic">${list.length}</div>
      <div><div class="lt">${STAGE_TAT_LABEL[s]}</div>
        <div class="ls">target ${STAGE_TAT[s]} days · ${late} past deadline</div></div>
      <div class="lr"><span class="mini-tag ${late?'r':''}">${list.length?Math.round(sum(list,a=>daysBetween(a.moved,TODAY))/list.length):0}d avg</span></div></div>`;
  }).join('');

  el('wfBoardCount').textContent = open.length;
  el('wfBody').innerHTML = open.map(a=>`<tr data-wf="${a.no}" style="cursor:pointer">
    <td class="mono">${a.no}</td><td>${a.cust}</td>
    <td style="font-size:10.5px">${a.stage}</td>
    <td style="font-size:10.5px">${a.officer}</td>
    <td><span class="dl-pill ${isLate(a)?'late':daysBetween(a.deadline,TODAY)<=1?'soon':'ok'}">${fmtShort(a.deadline)}</span></td>
    <td class="num">${daysBetween(a.moved, TODAY)}</td>
    <td style="text-align:right"><button class="btn btn-ghost btn-sm" data-wasg="${a.no}"
      style="padding:2px 7px;font-size:10px">Assign</button></td></tr>`).join('');
  el('wfBody').querySelectorAll('tr[data-wf]').forEach(r=>{
    r.onclick = e=>{ if(e.target.dataset.wasg) return; WF.sel = r.dataset.wf; renderWorkflow(); };
  });
  el('wfBody').querySelectorAll('[data-wasg]').forEach(b=>{
    b.onclick = e=>{ e.stopPropagation(); assignModal(b.dataset.wasg); };
  });

  const a = WF.sel ? appBy(WF.sel) : null;
  el('wfHistSub').textContent = a ? `${a.no} · ${a.cust}` : 'Select an application on the board';
  if(a){
    const events = historyOf(a);
    el('wfHistory').innerHTML = `<div class="tl">${events.map(e=>`<div class="tl-item">
      <b>${e.what}</b><span>${e.when} · ${e.by}</span></div>`).join('')}</div>`;
    el('wfNotes').innerHTML = (a.internal || []).length ? a.internal.map(n=>`
      <div class="lrow"><div class="lic">${initials(n.by)}</div>
        <div><div class="lt">${n.body}</div><div class="ls">${n.by} · ${n.when}</div></div></div>`).join('')
      : '<div class="empty">No internal notes on this file.</div>';
  } else {
    el('wfHistory').innerHTML = '<div class="empty">Pick an application to see how it moved.</div>';
    el('wfNotes').innerHTML = '<div class="empty">Pick an application to read its notes.</div>';
  }
}
function historyOf(a){
  const ev = [{what:'Application created', when:fmtDate(a.date)+' · '+a.officer, by:a.stage}];
  if(a.verifiedAt) ev.push({what:'Verification completed ('+checksDone(a)+'/9)', when:a.verifiedAt, by:a.verifier||'Verifier'});
  if(a.assess) ev.push({what:`Assessed · DTI ${a.assess.dti}% · risk ${a.risk}`, when:fmtDate(a.assess.date||a.date)+' · '+a.assess.by, by:'Assessment'});
  if(a.decision) ev.push({what:a.decision.decision+' · '+(a.decision.reason||a.decision.note||''), when:fmtDate(a.decision.date)+' · '+a.decision.by, by:'Decision'});
  if(a.approval) ev.push({what:`Authorized level ${a.approval.level} · ${mk(a.approval.amount)}`, when:fmtDate(a.approval.date)+' · '+a.approval.by, by:'Approval'});
  if(a.sentTo) ev.push({what:'Forwarded to disbursements', when:fmtDate(a.forwarded||a.approval?.date||a.date), by:'Handover'});
  ev.push({what:'Current status: '+a.status, when:'now · '+a.stage, by:'Workflow'});
  return ev.reverse();
}
function assignModal(no){
  const a = no ? appBy(no) : null;
  openModal('Assign / reassign', a ? `${a.no} · ${a.cust}` : 'Open applications', `
    ${a ? `<div class="kv"><span class="k">Current owner</span><span class="v">${a.officer}</span></div>
      <div class="kv"><span class="k">Stage</span><span class="v">${a.stage} · ${a.status}</span></div>` : ''}
    <div class="fg" style="margin-top:10px"><label>Application</label>
      <select id="asgApp">${openApps().map(x=>`<option value="${x.no}"${a&&x.no===a.no?' selected':''}>${x.no} · ${x.cust}</option>`).join('')}</select></div>
    <div class="fg" style="margin-top:9px"><label>Loan officer</label>
      <select id="asgOfficer">${OFFICER_NAMES.map(n=>`<option${a&&a.officer===n?' selected':''}>${n}</option>`).join('')}</select></div>
    <div class="fg" style="margin-top:9px"><label>Note</label>
      <input id="asgNote" placeholder="Reason for the assignment"></div>`,
    [{label:'Cancel', act:'close'}, {label:'Assign', cls:'btn-gold', act:()=>{
      const target = appBy(el('asgApp').value);
      const from = target.officer, to = el('asgOfficer').value;
      target.officer = to; target.moved = TODAY;
      target.internal = target.internal || [];
      if(el('asgNote').value) target.internal.unshift({by:'Memory Phiri', when:TODAY+' · '+nowTime(), body:el('asgNote').value});
      logApp('Change', `Officer reassigned ${from} → ${to}`, target.no);
      closeModal(); renderAll();
      toast(`${target.no} assigned to ${to}.`);
    }}]);
}
