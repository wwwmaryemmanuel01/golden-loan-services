<script>
/* ============================================================
   GOLDEN FINANCIAL SERVICES · AUDIT LOGS  (3/4)
   Sections 7–11: disbursements, repayments, financial,
   authentication and permissions.
   ============================================================ */

/* ===================== 7 · DISBURSEMENT AUDIT ===================== */
const DB = {view:'', page:1, per:10, sel:''};

function disbEvents(){
  return EVENTS.filter(e=>e.module === 'Disbursements')
    .filter(e=> !DB.view || e.b.disb === DB.view);
}

function renderDisbursements(){
  const list = disbEvents();
  el('dbCount').textContent = nf(list.length) + ' events';
  el('dbTiles').innerHTML = [
    {l:'Records created', v:nf(EVENTS.filter(e=>e.b.disb === 'creation').length), s:'Payouts prepared'},
    {l:'Authorised', v:nf(EVENTS.filter(e=>e.b.disb === 'authorization').length), s:'Dual sign-off recorded'},
    {l:'Confirmed', v:nf(EVENTS.filter(e=>e.b.disb === 'confirmation').length), s:'Funds reached the customer'},
    {l:'Failed', v:nf(EVENTS.filter(e=>e.b.disb === 'failure').length), s:'Rejected by the payment partner', k:'red'},
    {l:'Amount changes', v:nf(EVENTS.filter(e=>e.b.disb === 'amount').length), s:'Adjusted after approval'},
    {l:'Reversals', v:nf(EVENTS.filter(e=>e.b.disb === 'reversal').length), s:'Corrections raised', k:'red'}
  ].map(t=>`<div class="kpi ${t.k||''}"><div class="kl">${t.l}</div><div class="kv">${t.v}</div>
    <div class="ks">${t.s}</div></div>`).join('');

  const pages = Math.max(1, Math.ceil(list.length/DB.per));
  if(DB.page > pages) DB.page = pages;
  const slice = list.slice((DB.page-1)*DB.per, DB.page*DB.per);
  el('dbBody').innerHTML = slice.map(e=>{
    const amount = e.changes && e.changes[0] && /amount|Amount/.test(e.changes[0][0]) ? e.changes[0][2] : '';
    return `<tr class="rowlink" data-ev="${e.id}">
      <td style="white-space:nowrap">${fmtShort(e.date)} ${e.time.slice(0,5)}</td>
      <td class="mono" style="font-size:9.5px">${e.record}</td>
      <td>${esc(e.action)}</td>
      <td class="num">${amount ? esc(amount) : '—'}</td>
      <td>${esc(e.user)}</td>
      <td><span class="badge ${outcomeTone(e.outcome)}">${e.outcome}</span></td>
      <td style="text-align:right"><button class="btn btn-ghost" data-ev-btn="${e.id}">Open</button></td>
    </tr>`;
  }).join('') || '<tr><td colspan="7" class="empty">No disbursement events in this view.</td></tr>';
  bindRows('dbBody');
  el('dbPager').innerHTML = pagerHtml(list.length, DB.page, DB.per, 'dbPrev', 'dbNext');
  bindPager('dbPrev', 'dbNext', DB, renderDisbursements);

  const auths = EVENTS.filter(e=>e.b.disb === 'authorization').slice(0, 10);
  el('dbAuthCount').textContent = auths.length;
  el('dbAuth').innerHTML = auths.map((e,i)=>`
    <div class="lrow">
      <div class="lic" style="background:var(--green-soft);color:#157A50;font-size:9px">L${(i%2)+1}</div>
      <div><div class="lt">${e.record} · ${esc(e.user)}</div>
        <div class="ls">${fmtDate(e.date)} · ${e.time.slice(0,5)} · level ${(i%2)+1} authority · ${esc(e.desc)}</div></div>
      <div class="lr"><span class="badge b-ok">Authorised</span></div>
    </div>`).join('') || '<div class="empty">No authorisations recorded.</div>';

  const disbAll = EVENTS.filter(e=>e.module === 'Disbursements');
  const trailSize = r => { const a = disbAll.find(e=>e.record === r); return a && a.txn ? disbAll.filter(e=>e.txn === a.txn).length : 1; };
  const refs = [...new Set(disbAll.map(e=>e.record))].sort((a,b)=> trailSize(b) - trailSize(a) || (a < b ? -1 : 1));
  const sel = el('dbSel');
  sel.innerHTML = refs.map(r=>`<option>${r}</option>`).join('');
  sel.value = (DB.sel && refs.includes(DB.sel)) ? DB.sel : (refs[0] || '');
  DB.sel = sel.value;
  renderDisbTrail();
}

function renderDisbTrail(){
  const anchor = EVENTS.find(e=>e.record === DB.sel);
  const tx = anchor && anchor.txn;
  const rows = EVENTS.filter(e=> e.record === DB.sel ||
      (tx && e.module === 'Disbursements' && e.txn === tx))
    .sort((a,b)=> a.ts < b.ts ? -1 : 1);
  if(el('dbTrailRef')) el('dbTrailRef').textContent = tx ? 'transaction ' + tx + ' · ' + rows.length + ' events' : '';
  el('dbTrail').innerHTML = rows.length ? rows.map(e=>`
    <div class="evt" data-ev="${e.id}" style="cursor:pointer">
      <div class="eic ${evIcon(e)}">${e.outcome === 'Failed' ? '✕' : e.outcome === 'Warning' ? '!' : '✓'}</div>
      <div class="eb"><div class="et">${esc(e.action)}</div>
        <div class="es">${esc(e.user)} · ${e.role}${e.changes ? ' · ' + esc(e.changes.map(c=>c[1] + ' → ' + c[2]).join('; ')) : ''}</div>
        <div class="em">${fmtTs(e.ts)} · ${e.id}</div></div>
    </div>`).join('') : '<div class="empty">No events for this disbursement.</div>';
  bindRows('dbTrail');
}

function wireDisbursements(){
  el('dbTabs').querySelectorAll('[data-db]').forEach(b=>{
    b.onclick = ()=>{
      DB.view = b.dataset.db || ''; DB.page = 1;
      el('dbTabs').querySelectorAll('[data-db]').forEach(x=>x.classList.toggle('on', x === b));
      renderDisbursements();
    };
  });
  el('dbSel').addEventListener('change', ()=>{ DB.sel = el('dbSel').value; renderDisbTrail(); });
  el('dbExport').onclick = ()=>{
    const rows = EVENTS.filter(e=>e.module === 'Disbursements')
      .map(e=>[e.id, e.ts, e.record, e.action, e.user, e.outcome, e.changes ? e.changes.map(c=>c[0]+': '+c[1]+' -> '+c[2]).join('; ') : '']);
    exportRows('disbursement-audit-trail', ['Event','When','Disbursement','Action','User','Outcome','Change'], rows, 'Disbursement audit trail');
  };
}

/* ===================== 8 · REPAYMENT & COLLECTIONS ===================== */
const RPA = {view:'', q:'', page:1, per:10};

function repaymentEvents(){
  const q = RPA.q.trim().toLowerCase();
  return EVENTS.filter(e=> e.module === 'Repayments' || e.module === 'Collections')
    .filter(e=> !RPA.view || e.b.rpa === RPA.view)
    .filter(e=> !q || (e.record + ' ' + e.txn + ' ' + e.user + ' ' + e.action).toLowerCase().includes(q));
}

function renderRepaymentAudit(){
  const list = repaymentEvents();
  el('rpaCount').textContent = nf(list.length) + ' events';
  el('rpaTiles').innerHTML = [
    {l:'Repayments recorded', v:nf(EVENTS.filter(e=>e.b.rpa === 'creation').length), s:'Cash, bank and wallet'},
    {l:'Payments verified', v:nf(EVENTS.filter(e=>e.b.rpa === 'verification').length), s:'Reference matched to deposit'},
    {l:'Reversals', v:nf(EVENTS.filter(e=>e.b.rpa === 'reversal').length), s:'Duplicate or wrong entries', k:'red'},
    {l:'Adjustments', v:nf(EVENTS.filter(e=>e.b.rpa === 'adjustment').length), s:'Corrected after keying errors', k:'red'},
    {l:'Settlements', v:nf(EVENTS.filter(e=>e.b.rpa === 'settlement').length), s:'Facilities closed'},
    {l:'Corrections', v:nf(EVENTS.filter(e=>e.b.rpa === 'correction').length), s:'Ledger entries fixed'}
  ].map(t=>`<div class="kpi ${t.k||''}"><div class="kl">${t.l}</div><div class="kv">${t.v}</div>
    <div class="ks">${t.s}</div></div>`).join('');

  const pages = Math.max(1, Math.ceil(list.length/RPA.per));
  if(RPA.page > pages) RPA.page = pages;
  const slice = list.slice((RPA.page-1)*RPA.per, RPA.page*RPA.per);
  el('rpaBody').innerHTML = slice.map(e=>{
    const amount = e.changes && e.changes[0] && /amount/i.test(e.changes[0][0]) ? e.changes[0][2] : '';
    return `<tr class="rowlink" data-ev="${e.id}">
      <td style="white-space:nowrap">${fmtShort(e.date)} ${e.time.slice(0,5)}</td>
      <td class="mono" style="font-size:9.5px">${e.record}${e.txn ? '<div style="font-size:8.5px;color:var(--muted)">' + e.txn + '</div>' : ''}</td>
      <td>${esc(e.action)}</td>
      <td class="num">${amount ? esc(amount) : '—'}</td>
      <td>${esc(e.user)}</td>
      <td><span class="badge ${outcomeTone(e.outcome)}">${e.outcome}</span></td>
      <td style="text-align:right"><button class="btn btn-ghost" data-ev-btn="${e.id}">Open</button></td>
    </tr>`;
  }).join('') || '<tr><td colspan="7" class="empty">No repayment events in this view.</td></tr>';
  bindRows('rpaBody');
  el('rpaPager').innerHTML = pagerHtml(list.length, RPA.page, RPA.per, 'rpaPrev', 'rpaNext');
  bindPager('rpaPrev', 'rpaNext', RPA, renderRepaymentAudit);

  const corrections = EVENTS.filter(e=>['correction','adjustment','reversal'].includes(e.b.rpa)).slice(0, 10);
  el('rpaCorrections').innerHTML = corrections.map(e=>`
    <div class="lrow" data-ev="${e.id}">
      <div class="lic" style="background:var(--red-soft);color:#B32C2C;font-size:9px">!</div>
      <div><div class="lt">${esc(e.action)} · ${e.record}</div>
        <div class="ls">${fmtShort(e.date)} · ${esc(e.user)}${e.changes ? ' · ' + esc(e.changes.map(c=>c[1] + ' → ' + c[2]).join('; ')) : ''}</div></div>
      <div class="lr"><button class="btn btn-ghost" data-ev-btn="${e.id}">Open</button></div>
    </div>`).join('') || '<div class="empty">No corrections recorded.</div>';
  el('rpaCorrections').querySelectorAll('[data-ev]').forEach(r=>{ r.onclick = ()=>openEvent(r.dataset.ev); });

  const statuses = EVENTS.filter(e=>['arrears','assignment'].includes(e.b.rpa)).slice(0, 10);
  el('rpaArrears').innerHTML = statuses.map(e=>`
    <div class="lrow" data-ev="${e.id}">
      <div class="lic" style="background:var(--amber-soft);color:#9A6A0D;font-size:9px">${e.b.rpa === 'arrears' ? 'AR' : 'AS'}</div>
      <div><div class="lt">${esc(e.action)} · ${e.record}</div>
        <div class="ls">${fmtShort(e.date)} · ${esc(e.user)}${e.changes ? ' · ' + esc(e.changes.map(c=>c[1] + ' → ' + c[2]).join('; ')) : ''}</div></div>
      <div class="lr"><button class="btn btn-ghost" data-ev-btn="${e.id}">Open</button></div>
    </div>`).join('') || '<div class="empty">No arrears changes recorded.</div>';
  el('rpaArrears').querySelectorAll('[data-ev]').forEach(r=>{ r.onclick = ()=>openEvent(r.dataset.ev); });
}

function wireRepaymentAudit(){
  el('rpaSearch').addEventListener('input', ()=>{ RPA.q = el('rpaSearch').value; RPA.page = 1; renderRepaymentAudit(); });
  el('rpaTabs').querySelectorAll('[data-rpa]').forEach(b=>{
    b.onclick = ()=>{
      RPA.view = b.dataset.rpa || ''; RPA.page = 1;
      el('rpaTabs').querySelectorAll('[data-rpa]').forEach(x=>x.classList.toggle('on', x === b));
      renderRepaymentAudit();
    };
  });
}

/* ===================== 9 · FINANCIAL TRANSACTIONS ===================== */
const FIN = {view:'', page:1, per:10, sel:null};

function finEvents(){
  return EVENTS.filter(e=>e.b.fin)
    .filter(e=> !FIN.view || e.b.fin === FIN.view);
}

function renderFinancial(){
  const list = finEvents();
  el('finCount').textContent = nf(list.length) + ' events';
  el('finTiles').innerHTML = [
    {l:'Loan amount changes', v:nf(EVENTS.filter(e=>e.b.fin === 'amount').length), s:'Principal adjusted'},
    {l:'Interest rate changes', v:nf(EVENTS.filter(e=>e.b.fin === 'rate').length), s:'Product rate revisions', k:'red'},
    {l:'Fee & penalty changes', v:nf(EVENTS.filter(e=>e.b.fin === 'fee').length), s:'Configuration changes'},
    {l:'Corrections', v:nf(EVENTS.filter(e=>e.b.fin === 'correction').length), s:'Records put right'},
    {l:'Reconciliation', v:nf(EVENTS.filter(e=>e.b.fin === 'recon').length), s:'Adjustments posted'},
    {l:'Duplicates probed', v:nf(EVENTS.filter(e=>e.b.fin === 'duplicate').length), s:'Investigations opened'}
  ].map(t=>`<div class="kpi ${t.k||''}"><div class="kl">${t.l}</div><div class="kv">${t.v}</div>
    <div class="ks">${t.s}</div></div>`).join('');

  const pages = Math.max(1, Math.ceil(list.length/FIN.per));
  if(FIN.page > pages) FIN.page = pages;
  const slice = list.slice((FIN.page-1)*FIN.per, FIN.page*FIN.per);
  el('finBody').innerHTML = slice.map(e=>`
    <tr class="rowlink" data-ev="${e.id}">
      <td style="white-space:nowrap">${fmtShort(e.date)} ${e.time.slice(0,5)}</td>
      <td class="mono" style="font-size:9.5px">${e.record}</td>
      <td>${esc(e.action)}${e.changes ? '<div style="font-size:9px;color:var(--muted)">' + esc(e.changes[0][1] + ' → ' + e.changes[0][2]) + '</div>' : ''}</td>
      <td>${esc(e.user)}</td>
      <td class="mono" style="font-size:9px">${e.txn || '—'}</td>
      <td style="text-align:right"><button class="btn btn-ghost" data-ev-btn="${e.id}">Open</button></td>
    </tr>`).join('') || '<tr><td colspan="6" class="empty">No financial events in this view.</td></tr>';
  el('finBody').querySelectorAll('[data-ev]').forEach(r=>{
    r.onclick = ()=>{ FIN.sel = r.dataset.ev; renderFinDiff(); };
  });
  el('finPager').innerHTML = pagerHtml(list.length, FIN.page, FIN.per, 'finPrev', 'finNext');
  bindPager('finPrev', 'finNext', FIN, renderFinancial);

  if(!FIN.sel || !EVENTS.some(e=>e.id === FIN.sel))
    FIN.sel = (slice.find(e=>e.changes) || slice[0] || {}).id || null;
  renderFinDiff();

  const refs = EVENTS.filter(e=>e.txn).slice(0, 12);
  el('finRefs').innerHTML = refs.map(e=>`
    <div class="lrow" style="padding:5px 0">
      <div class="lic" style="width:22px;height:22px;flex:0 0 22px;font-size:8px;background:#EAF1FE;color:#2456C4">REF</div>
      <div><div class="lt mono" style="font-size:10px">${e.txn}</div>
        <div class="ls">${esc(e.action)} · ${e.record}</div></div>
      <div class="lr"><button class="btn btn-ghost" data-ev-btn="${e.id}">Open</button></div>
    </div>`).join('');
  el('finRefs').querySelectorAll('[data-ev]').forEach(r=>{ r.onclick = ()=>openEvent(r.dataset.ev); });
}

function renderFinDiff(){
  const e = byId(FIN.sel);
  if(!e){ el('finDiff').innerHTML = '<div class="empty">Select a financial event.</div>'; return; }
  el('finDiff').innerHTML = `
    <div style="font-size:11px;font-weight:700">${esc(e.action)}</div>
    <div class="inline-note">${e.record} · ${fmtTs(e.ts)} · ${esc(e.user)} (${e.role})</div>
    ${diffBlock(e.changes)}
    <div class="inline-note" style="margin-top:6px">${e.txn ? 'Transaction reference ' + e.txn + ' · ' : ''}${e.id}</div>`;
}

function wireFinancial(){
  el('finTabs').querySelectorAll('[data-fin]').forEach(b=>{
    b.onclick = ()=>{
      FIN.view = b.dataset.fin || ''; FIN.page = 1;
      el('finTabs').querySelectorAll('[data-fin]').forEach(x=>x.classList.toggle('on', x === b));
      renderFinancial();
    };
  });
  el('finExport').onclick = ()=>{
    const rows = finEvents().map(e=>[e.id, e.ts, e.record, e.action, e.user,
      e.changes ? e.changes.map(c=>c[0]+': '+c[1]+' -> '+c[2]).join('; ') : '', e.txn]);
    exportRows('financial-transaction-audit', ['Event','When','Record','Action','User','Before and after','Reference'], rows, 'Financial transaction audit');
  };
}

/* ===================== 10 · AUTHENTICATION & SECURITY ===================== */
const SEC = {view:'', page:1, per:12};

function securityEvents(){
  return EVENTS.filter(e=> e.module === 'Authentication' || e.b.sec)
    .filter(e=> !SEC.view || e.b.sec === SEC.view);
}

function renderSecurity(){
  const list = securityEvents();
  const failed = EVENTS.filter(e=>e.outcome === 'Denied' || (e.type === 'Login' && e.outcome === 'Failed'));
  el('secFailedPill').textContent = nf(failed.length) + ' failed';
  el('secTiles').innerHTML = [
    {l:'Successful logins', v:nf(EVENTS.filter(e=>e.b.sec === 'success').length), s:'All users'},
    {l:'Failed logins', v:nf(EVENTS.filter(e=>e.b.sec === 'failed').length), s:'Wrong password or code', k:'red'},
    {l:'Logouts', v:nf(EVENTS.filter(e=>e.b.sec === 'logout').length), s:'Sessions ended cleanly'},
    {l:'Lockouts', v:nf(EVENTS.filter(e=>e.b.sec === 'lockout').length), s:'Accounts locked', k:'red'},
    {l:'Password events', v:nf(EVENTS.filter(e=>e.b.sec === 'password').length), s:'Resets and changes'},
    {l:'MFA events', v:nf(EVENTS.filter(e=>e.b.sec === 'mfa').length), s:'Challenges passed or failed'}
  ].map(t=>`<div class="kpi ${t.k||''}"><div class="kl">${t.l}</div><div class="kv">${t.v}</div>
    <div class="ks">${t.s}</div></div>`).join('');

  const pages = Math.max(1, Math.ceil(list.length/SEC.per));
  if(SEC.page > pages) SEC.page = pages;
  const slice = list.slice((SEC.page-1)*SEC.per, SEC.page*SEC.per);
  el('secBody').innerHTML = slice.map(e=>`
    <tr class="rowlink" data-ev="${e.id}">
      <td style="white-space:nowrap">${fmtShort(e.date)} ${e.time.slice(0,5)}</td>
      <td><div style="font-weight:700">${esc(e.user)}</div>
        <div style="font-size:9px;color:var(--muted)">${e.username} · ${e.role}</div></td>
      <td>${esc(e.action)}<div style="font-size:9px;color:var(--muted)">${esc(e.desc)}</div></td>
      <td class="mono" style="font-size:9.5px">${e.ip}</td>
      <td style="font-size:9.5px">${esc(e.device)}</td>
      <td><span class="badge ${outcomeTone(e.outcome)}">${e.outcome}</span></td>
      <td style="text-align:right"><button class="btn btn-ghost" data-ev-btn="${e.id}">Open</button></td>
    </tr>`).join('') || '<tr><td colspan="7" class="empty">No security events in this view.</td></tr>';
  bindRows('secBody');
  el('secPager').innerHTML = pagerHtml(list.length, SEC.page, SEC.per, 'secPrev', 'secNext');
  bindPager('secPrev', 'secNext', SEC, renderSecurity);

  const susp = EVENTS.filter(e=>e.b.sec === 'suspicious' || (e.type === 'Login' && e.outcome === 'Failed')).slice(0, 8);
  el('secSuspCount').textContent = susp.length;
  el('secSuspicious').innerHTML = susp.map(e=>`
    <div class="evt" data-ev="${e.id}" style="cursor:pointer">
      <div class="eic ${e.b.sec === 'suspicious' ? 'warn' : 'fail'}">${e.b.sec === 'suspicious' ? '!' : '✕'}</div>
      <div class="eb"><div class="et">${esc(e.action)} · ${esc(e.user)}</div>
        <div class="es">${esc(e.desc)} · ${e.ip} · ${esc(e.device)}</div>
        <div class="em">${fmtTs(e.ts)} · ${e.id}</div></div>
      <span class="sev ${e.b.sec === 'suspicious' ? 'sev-warn' : 'sev-crit'}">${e.b.sec === 'suspicious' ? 'Suspicious' : 'Failed'}</span>
    </div>`).join('') || '<div class="empty">Nothing suspicious recorded.</div>';
  bindRows('secSuspicious');

  const locked = USERS.filter(u=>u.status === 'Locked' || u.status === 'Disabled');
  el('secLockCount').textContent = locked.length;
  el('secLocked').innerHTML = locked.map(u=>`
    <div class="lrow">
      <div class="lic" style="background:var(--red-soft);color:#B32C2C;font-size:9px">${initials(u.name)}</div>
      <div><div class="lt">${esc(u.name)}</div>
        <div class="ls">${u.username} · ${u.role} · ${u.status.toLowerCase()}</div></div>
      <div class="lr"><button class="btn btn-ghost" data-unlock="${u.username}">Unlock</button></div>
    </div>`).join('') || '<div class="empty">No accounts are locked.</div>';
  el('secLocked').querySelectorAll('[data-unlock]').forEach(b=>{
    b.onclick = ()=> unlockAccount(b.dataset.unlock);
  });
}

function unlockAccount(username){
  const u = USERS.find(x=>x.username === username);
  if(!u) return;
  openModal('Unlock staff account', u.name + ' · ' + u.username,
    `<div class="inline-note">Unlocking restores access and is itself written to the audit log. The user must set
      a new password at next sign-in.</div>
     <div class="diff" style="margin-top:8px">
       <div class="dh"><span>Field</span><span>Previous</span><span>Updated</span></div>
       <div class="dr"><span class="k">Account status</span><span class="old">${u.status}</span><span class="new">Active</span></div>
       <div class="dr"><span class="k">Failed attempts</span><span class="old">5</span><span class="new">0</span></div>
     </div>`,
    [{label:'Cancel', act:'close'}, {label:'Unlock account', cls:'btn-gold', act:()=>{
      const prev = u.status;
      u.status = 'Active';
      logEvent({module:'Authentication', action:'Staff account unlocked', type:'Security', severity:'Warning',
        user:'Chikondi Mwale', record:u.id, desc:`Account unlocked for ${u.name} after ${prev.toLowerCase()} status`,
        changes:[['Account status', prev, 'Active']], bucket:{staff:'account', sec:'lockout', perm:'privileged'}});
      renderAll(); closeModal();
      toast('Account unlocked for ' + esc(u.name) + '.');
    }}]);
}

function wireSecurity(){
  el('secTabs').querySelectorAll('[data-sec]').forEach(b=>{
    b.onclick = ()=>{
      SEC.view = b.dataset.sec || ''; SEC.page = 1;
      el('secTabs').querySelectorAll('[data-sec]').forEach(x=>x.classList.toggle('on', x === b));
      renderSecurity();
    };
  });
  el('secExport').onclick = ()=>{
    const rows = securityEvents().map(e=>[e.id, e.ts, e.user, e.username, e.action, e.ip, e.device, e.outcome, e.desc]);
    exportRows('security-log', ['Event','When','User','Username','Action','IP','Device','Outcome','Detail'], rows, 'Authentication and security log');
  };
}

/* ===================== 11 · ROLES & PERMISSIONS ===================== */
const PER = {view:'', page:1, per:10};
const PER_REQS = [];

function permissionEvents(){
  return EVENTS.filter(e=>e.b.perm)
    .filter(e=> !PER.view || e.b.perm === PER.view);
}

function renderPermissions(){
  const list = permissionEvents();
  el('perPendingPill').textContent = PER_REQS.filter(r=>r.status === 'Pending').length + ' pending';
  el('perTiles').innerHTML = [
    {l:'Permission grants', v:nf(EVENTS.filter(e=>e.b.perm === 'grant').length), s:'New authority handed out'},
    {l:'Revocations', v:nf(EVENTS.filter(e=>e.b.perm === 'revoke').length), s:'Authority removed', k:'red'},
    {l:'Staff role changes', v:nf(EVENTS.filter(e=>e.b.perm === 'staffrole').length), s:'Roles reassigned'},
    {l:'Privileged access', v:nf(EVENTS.filter(e=>e.b.perm === 'privileged').length), s:'Administrator-level actions'},
    {l:'Access denied', v:nf(EVENTS.filter(e=>e.b.perm === 'denied').length), s:'Blocked attempts', k:'red'},
    {l:'Sensitive data access', v:nf(EVENTS.filter(e=>e.b.perm === 'sensitive').length), s:'Documents and bank details'}
  ].map(t=>`<div class="kpi ${t.k||''}"><div class="kl">${t.l}</div><div class="kv">${t.v}</div>
    <div class="ks">${t.s}</div></div>`).join('');

  const pages = Math.max(1, Math.ceil(list.length/PER.per));
  if(PER.page > pages) PER.page = pages;
  const slice = list.slice((PER.page-1)*PER.per, PER.page*PER.per);
  el('perBody').innerHTML = slice.map(e=>`
    <tr class="rowlink" data-ev="${e.id}">
      <td style="white-space:nowrap">${fmtShort(e.date)} ${e.time.slice(0,5)}</td>
      <td>${esc(e.user)}<div style="font-size:9px;color:var(--muted)">${e.role}</div></td>
      <td>${esc(e.action)}${e.changes ? '<div style="font-size:9px;color:var(--muted)">' + esc(e.changes[0][1] + ' → ' + e.changes[0][2]) + '</div>' : ''}</td>
      <td class="mono" style="font-size:9px">${e.record}</td>
      <td><span class="badge ${outcomeTone(e.outcome)}">${e.outcome}</span></td>
    </tr>`).join('') || '<tr><td colspan="5" class="empty">No permission events in this view.</td></tr>';
  bindRows('perBody');
  el('perPager').innerHTML = pagerHtml(list.length, PER.page, PER.per, 'perPrev', 'perNext');
  bindPager('perPrev', 'perNext', PER, renderPermissions);

  const approvals = PER_REQS.slice().concat(EVENTS.filter(e=>e.b.perm === 'grant' || e.b.perm === 'revoke' || e.b.perm === 'staffrole')
    .slice(0, 6).map(e=>({id:e.id, title:e.action + ' · ' + e.record, status:'Approved', by:e.user, when:e.date, note:e.desc})));
  el('perApprovals').innerHTML = approvals.map(r=>`
    <div class="lrow">
      <div class="lic" style="background:${r.status==='Pending'?'var(--amber-soft)':'var(--green-soft)'};
        color:${r.status==='Pending'?'#9A6A0D':'#157A50'};font-size:8px">${r.status==='Pending'?'PEND':'OK'}</div>
      <div><div class="lt">${esc(r.title)}</div>
        <div class="ls">${fmtShort(r.when)} · ${esc(r.by)}${r.note ? ' · ' + esc(r.note) : ''}</div></div>
      <div class="lr">${r.status === 'Pending'
        ? `<button class="btn btn-ghost" data-approve="${r.id}">Approve</button><button class="btn btn-ghost" data-reject="${r.id}">Reject</button>`
        : '<span class="badge b-ok">Approved</span>'}</div>
    </div>`).join('');
  el('perApprovals').querySelectorAll('[data-approve]').forEach(b=>{
    b.onclick = ()=> resolvePermReq(b.dataset.approve, 'Approved');
  });
  el('perApprovals').querySelectorAll('[data-reject]').forEach(b=>{
    b.onclick = ()=> resolvePermReq(b.dataset.reject, 'Rejected');
  });

  const denied = EVENTS.filter(e=>e.b.perm === 'denied').slice(0, 8);
  el('perDenied').innerHTML = denied.map(e=>`
    <div class="evt" data-ev="${e.id}" style="cursor:pointer">
      <div class="eic fail">⛔</div>
      <div class="eb"><div class="et">${esc(e.action)} · ${esc(e.user)}</div>
        <div class="es">${esc(e.desc)}</div>
        <div class="em">${fmtTs(e.ts)} · ${e.record}</div></div>
    </div>`).join('') || '<div class="empty">No access denied events.</div>';
  bindRows('perDenied');
}

function resolvePermReq(id, status){
  const req = PER_REQS.find(r=>r.id === id);
  if(!req) return;
  req.status = status;
  req.by = 'Chikondi Mwale';
  logEvent({module:'Permissions', action:'Permission change ' + status.toLowerCase(), type:'Permission',
    severity:'Warning', user:'Chikondi Mwale', record:req.record,
    desc:`${req.title} — ${status.toLowerCase()} by the administrator`,
    changes:req.changes, bucket:{perm:'grant'}});
  renderAll();
  toast('Permission request ' + status.toLowerCase() + '.');
}

function wirePermissions(){
  el('perTabs').querySelectorAll('[data-per]').forEach(b=>{
    b.onclick = ()=>{
      PER.view = b.dataset.per || ''; PER.page = 1;
      el('perTabs').querySelectorAll('[data-per]').forEach(x=>x.classList.toggle('on', x === b));
      renderPermissions();
    };
  });
  el('perRequest').onclick = ()=>{
    openModal('Request a permission change', 'Goes to the administrator for approval', `
      <div class="form-grid">
        <div class="fg"><label>Role</label><select id="prRole">
          ${ROLES.filter(r=>r !== 'System').map(r=>`<option>${r}</option>`).join('')}</select></div>
        <div class="fg"><label>Permission</label><select id="prPerm">
          <option>Approve loans</option><option>Export customer data</option>
          <option>Reverse repayments</option><option>Configure system settings</option>
          <option>Manage staff accounts</option><option>View audit logs</option></select></div>
        <div class="fg"><label>Change</label><select id="prChange">
          <option>Grant</option><option>Revoke</option></select></div>
        <div class="fg"><label>Reason</label><input id="prReason" placeholder="Why is this needed?"></div>
      </div>`,
      [{label:'Cancel', act:'close'}, {label:'Submit request', cls:'btn-gold', act:()=>{
        const role = el('prRole').value, perm = el('prPerm').value;
        const change = el('prChange').value;
        const reason = el('prReason').value.trim() || 'No reason supplied';
        PER_REQS.unshift({id:'REQ-' + (120 + PER_REQS.length), title:`${change} ${perm} for ${role}`,
          status:'Pending', by:'Chikondi Mwale', when:TODAY, record:'ROLE-' + role.slice(0,2).toUpperCase(),
          note:reason, changes:[['Permission', change === 'Grant' ? '—' : perm, change === 'Grant' ? perm : '—']]});
        renderAll(); closeModal();
        toast('Permission request submitted for approval.');
      }}]);
  };
}

</script>
