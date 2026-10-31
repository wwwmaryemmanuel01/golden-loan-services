<script>
/* ============================================================
   GOLDEN FINANCIAL SERVICES · AUDIT LOGS  (2/4)
   Sections 3–6: staff activity, administrator activity,
   customer record audit, loan application audit.
   ============================================================ */

function pagerHtml(total, page, per, prevId, nextId){
  const pages = Math.max(1, Math.ceil(total/per));
  return `<span>Showing ${total ? (page-1)*per+1 : 0}–${Math.min(page*per, total)} of ${nf(total)}</span>
    <button id="${prevId}" ${page===1?'disabled':''}>‹ Prev</button>
    <button id="${nextId}" ${page>=pages?'disabled':''}>Next ›</button>`;
}
function bindPager(prevId, nextId, state, render){
  if(el(prevId)) el(prevId).onclick = ()=>{ state.page--; render(); };
  if(el(nextId)) el(nextId).onclick = ()=>{ state.page++; render(); };
}
function bindRows(containerId, attr='data-ev'){
  const box = el(containerId); if(!box) return;
  box.querySelectorAll('['+attr+']').forEach(r=>{ r.onclick = ()=>openEvent(r.getAttribute(attr)); });
}
const firstName = n => String(n).split(' ')[0];

/* ===================== 3 · STAFF ACTIVITY ===================== */
const ST = {user:'', view:'', page:1, per:12};

function staffEvents(){
  return EVENTS.filter(e=> e.role !== 'Administrator' && e.role !== 'System')
    .filter(e=> !ST.user || e.user === ST.user)
    .filter(e=> !ST.view || e.b.staff === ST.view);
}

function renderStaff(){
  const list = staffEvents();
  const today = EVENTS.filter(isToday).filter(e=>e.role !== 'Administrator' && e.role !== 'System');
  el('stCount').textContent = nf(list.length) + ' events';
  el('stTiles').innerHTML = [
    {l:'Sessions today', v:nf(today.filter(e=>e.b.staff === 'session').length), s:`${today.filter(e=>e.type === 'Login' && e.outcome === 'Success').length} successful logins`},
    {l:'Customer records touched', v:nf(list.filter(e=>e.b.staff === 'customer').length), s:'Views, documents and exports', k:''},
    {l:'Loan application events', v:nf(list.filter(e=>e.b.staff === 'loan').length), s:'Capture, review and decisions'},
    {l:'Repayment events', v:nf(list.filter(e=>e.b.staff === 'repayment').length), s:'Receipts, verification and reversals'},
    {l:'Exports', v:nf(list.filter(e=>e.b.staff === 'export').length), s:'Reports and customer records', k:'red'},
    {l:'Account changes', v:nf(list.filter(e=>e.b.staff === 'account').length), s:'Staff record and password changes'}
  ].map(t=>`<div class="kpi ${t.k||''}"><div class="kl">${t.l}</div><div class="kv">${t.v}</div>
    <div class="ks">${t.s}</div></div>`).join('');

  const pages = Math.max(1, Math.ceil(list.length/ST.per));
  if(ST.page > pages) ST.page = pages;
  const slice = list.slice((ST.page-1)*ST.per, ST.page*ST.per);
  el('stBody').innerHTML = slice.map(e=>`
    <tr class="rowlink" data-ev="${e.id}">
      <td style="white-space:nowrap">${fmtShort(e.date)} · ${e.time.slice(0,5)}</td>
      <td><div style="font-weight:700">${esc(e.user)}</div>
        <div style="font-size:9px;color:var(--muted)">${e.username}</div></td>
      <td style="white-space:nowrap">${e.role}</td>
      <td>${esc(e.action)}<div style="font-size:9px;color:var(--muted)">${e.module} · ${e.type}</div></td>
      <td class="mono" style="font-size:9.5px">${e.record}</td>
      <td><span class="badge ${outcomeTone(e.outcome)}">${e.outcome}</span></td>
      <td style="text-align:right"><button class="btn btn-ghost" data-ev-btn="${e.id}">Open</button></td>
    </tr>`).join('') || '<tr><td colspan="7" class="empty">No staff activity matches this view.</td></tr>';
  bindRows('stBody');
  el('stPager').innerHTML = pagerHtml(list.length, ST.page, ST.per, 'stPrev', 'stNext');
  bindPager('stPrev', 'stNext', ST, renderStaff);

  const byStaff = {};
  list.forEach(e=>{ byStaff[e.user] = (byStaff[e.user]||0) + 1; });
  const ranked = Object.entries(byStaff).sort((a,b)=>b[1]-a[1]);
  const max = Math.max(1, ...ranked.map(r=>r[1]));
  el('stHistory').innerHTML = ranked.map(([n,c])=>{
    const u = userByName(n);
    return `<div class="lrow">
      <div class="lic" style="background:var(--gold-soft);color:var(--gold-dark);font-size:9px">${initials(n)}</div>
      <div style="flex:1">
        <div style="display:flex;justify-content:space-between;gap:8px">
          <span class="lt">${esc(n)}</span><span class="dim">${nf(c)}</span></div>
        <div class="ls">${u.role} · last seen ${fmtShort(EVENTS.find(e=>e.user === n).date)}</div>
        <div class="meter" style="margin-top:4px"><i style="width:${Math.round(c/max*100)}%"></i></div>
      </div></div>`;
  }).join('') || '<div class="empty">No staff activity in this view.</div>';

  const sessionTarget = ST.user || null;
  const sessions = EVENTS.filter(e=>e.b.sec === 'success' || e.b.sec === 'failed' || e.b.sec === 'logout' || e.type === 'Lockout')
    .filter(e=> !sessionTarget || e.user === sessionTarget)
    .filter(e=> e.role !== 'System')
    .slice(0, 12);
  el('stSessionPill').textContent = sessions.length;
  el('stSessions').innerHTML = sessions.map(e=>`
    <div class="lrow">
      <div class="lic" style="background:${e.outcome==='Failed'?'var(--red-soft)':e.b.sec==='logout'?'#F1F2F6':'var(--green-soft)'};
        color:${e.outcome==='Failed'?'#B32C2C':e.b.sec==='logout'?'#5A6172':'#157A50'};font-size:9px">${
        e.b.sec==='logout'?'OUT':e.outcome==='Failed'?'✕':'IN'}</div>
      <div><div class="lt">${esc(e.action)}</div>
        <div class="ls">${fmtDate(e.date)} · ${e.time.slice(0,5)} · ${e.ip}</div></div>
      <div class="lr"><span class="badge ${outcomeTone(e.outcome)}">${e.outcome}</span></div>
    </div>`).join('') || '<div class="empty">No sessions recorded.</div>';
}

function wireStaff(){
  el('stUser').addEventListener('change', ()=>{ ST.user = el('stUser').value; ST.page = 1; renderStaff(); });
  el('stTabs').querySelectorAll('[data-st]').forEach(b=>{
    b.onclick = ()=>{
      ST.view = b.dataset.st || ''; ST.page = 1;
      el('stTabs').querySelectorAll('[data-st]').forEach(x=>x.classList.toggle('on', x === b));
      renderStaff();
    };
  });
  el('stExport').onclick = ()=>{
    const rows = staffEvents().map(e=>[e.id, e.ts, e.user, e.username, e.role, e.action, e.module, e.record, e.outcome, e.desc]);
    exportRows('staff-activity', ['Event','When','Staff','Username','Role','Activity','Module','Record','Outcome','Detail'], rows, 'Staff activity');
  };
}

/* ===================== 4 · ADMINISTRATOR ACTIVITY ===================== */
const AD = {view:'', page:1, per:12};

function adminEvents(){
  let list = EVENTS.filter(e=> e.role === 'Administrator' || e.b.admin);
  if(AD.view === 'critical') list = list.filter(isCritical);
  else if(AD.view) list = list.filter(e=>e.b.admin === AD.view);
  return list;
}

function renderAdmin(){
  const list = adminEvents();
  const admins = EVENTS.filter(e=>e.role === 'Administrator');
  const crit = admins.filter(isCritical);
  el('adCriticalPill').textContent = nf(crit.length) + ' critical';
  el('adTiles').innerHTML = [
    {l:'Administrator logins', v:nf(admins.filter(e=>e.type === 'Login').length), s:'All privileged sign-ins'},
    {l:'Staff accounts created', v:nf(EVENTS.filter(e=>e.b.admin === 'staff-create').length), s:'New user provisioned'},
    {l:'Staff accounts modified', v:nf(EVENTS.filter(e=>e.b.admin === 'staff-modify').length), s:'Contact and access updates'},
    {l:'Role changes', v:nf(EVENTS.filter(e=>e.b.admin === 'role').length), s:'Promotions and reassignments'},
    {l:'Permission changes', v:nf(EVENTS.filter(e=>e.b.perm === 'grant' || e.b.perm === 'revoke').length), s:'Grants and revocations'},
    {l:'Overrides applied', v:nf(EVENTS.filter(e=>e.b.admin === 'override').length), s:'Administrative overrides', k:'red'}
  ].map(t=>`<div class="kpi ${t.k||''}"><div class="kl">${t.l}</div><div class="kv">${t.v}</div>
    <div class="ks">${t.s}</div></div>`).join('');

  const pages = Math.max(1, Math.ceil(list.length/AD.per));
  if(AD.page > pages) AD.page = pages;
  const slice = list.slice((AD.page-1)*AD.per, AD.page*AD.per);
  el('adBody').innerHTML = slice.map(e=>{
    const change = e.changes ? e.changes.map(c=>c[1] + ' → ' + c[2]).join('; ') : '—';
    return `<tr class="rowlink" data-ev="${e.id}">
      <td style="white-space:nowrap">${fmtShort(e.date)} · ${e.time.slice(0,5)}</td>
      <td><div style="font-weight:700">${esc(e.user)}</div>
        <div style="font-size:9px;color:var(--muted)">${e.username}</div></td>
      <td>${esc(e.action)}</td>
      <td><span class="chipmod">${e.module}</span></td>
      <td class="mono" style="font-size:9.5px">${e.record}</td>
      <td style="font-size:9.5px;max-width:230px">${esc(change)}</td>
      <td><span class="badge ${outcomeTone(e.outcome)}">${e.outcome}</span></td>
      <td style="text-align:right"><button class="btn btn-ghost" data-ev-btn="${e.id}">Open</button></td>
    </tr>`;
  }).join('') || '<tr><td colspan="8" class="empty">Nothing recorded for this view.</td></tr>';
  bindRows('adBody');
  el('adPager').innerHTML = pagerHtml(list.length, AD.page, AD.per, 'adPrev', 'adNext');
  bindPager('adPrev', 'adNext', AD, renderAdmin);

  const criticalList = EVENTS.filter(e=>isCritical(e)).slice(0, 10);
  el('adCritCount').textContent = criticalList.length;
  el('adCritical').innerHTML = criticalList.map(e=>`
    <div class="evt" data-ev="${e.id}" style="cursor:pointer">
      <div class="eic fail">!</div>
      <div class="eb">
        <div class="et">${esc(e.action)} <span style="font-weight:500;color:var(--muted)">· ${esc(e.user)}</span></div>
        <div class="es">${esc(e.desc)}${e.changes ? ' · ' + esc(e.changes.map(c=>c[1] + ' → ' + c[2]).join('; ')) : ''}</div>
        <div class="em">${fmtTs(e.ts)} · ${e.module} · ${e.record}</div>
      </div>
      <span class="sev sev-crit">Critical</span>
    </div>`).join('') || '<div class="empty">No critical events.</div>';
  bindRows('adCritical');
}

function wireAdmin(){
  el('adTabs').querySelectorAll('[data-ad]').forEach(b=>{
    b.onclick = ()=>{
      AD.view = b.dataset.ad || ''; AD.page = 1;
      el('adTabs').querySelectorAll('[data-ad]').forEach(x=>x.classList.toggle('on', x === b));
      renderAdmin();
    };
  });
  el('adExport').onclick = ()=>{
    const rows = adminEvents().map(e=>[e.id, e.ts, e.user, e.role, e.action, e.module, e.record,
      e.changes ? e.changes.map(c=>c[0]+': '+c[1]+' -> '+c[2]).join('; ') : '', e.outcome, e.critical?'Critical':'']);
    exportRows('administrator-activity', ['Event','When','Administrator','Role','Action','Module','Record','Change','Outcome','Severity'], rows, 'Administrator activity');
  };
}

/* ===================== 5 · CUSTOMER RECORD AUDIT ===================== */
const CR = {view:'', q:'', page:1, per:10, sel:null};

function customerEvents(){
  const q = CR.q.trim().toLowerCase();
  return EVENTS.filter(e=>e.module === 'Customers')
    .filter(e=> !CR.view || e.b.cust === CR.view)
    .filter(e=> !q || (e.record + ' ' + e.user + ' ' + e.action + ' ' + (e.desc||'')).toLowerCase().includes(q));
}

function renderCustomerAudit(){
  const list = customerEvents();
  el('crCount').textContent = nf(list.length) + ' events';
  const pages = Math.max(1, Math.ceil(list.length/CR.per));
  if(CR.page > pages) CR.page = pages;
  const slice = list.slice((CR.page-1)*CR.per, CR.page*CR.per);
  el('crBody').innerHTML = slice.map(e=>`
    <tr class="rowlink" data-ev="${e.id}">
      <td style="white-space:nowrap">${fmtShort(e.date)} ${e.time.slice(0,5)}</td>
      <td class="mono" style="font-size:9.5px">${e.record}</td>
      <td>${esc(e.action)}<div style="font-size:9px;color:var(--muted)">${e.type}</div></td>
      <td>${esc(e.user)}</td>
      <td><span class="badge ${outcomeTone(e.outcome)}">${e.outcome}</span></td>
    </tr>`).join('') || '<tr><td colspan="5" class="empty">No customer events match.</td></tr>';
  el('crBody').querySelectorAll('[data-ev]').forEach(r=>{
    r.onclick = ()=>{ CR.sel = r.dataset.ev; renderCustomerDiff(); };
  });
  el('crPager').innerHTML = pagerHtml(list.length, CR.page, CR.per, 'crPrev', 'crNext');
  bindPager('crPrev', 'crNext', CR, renderCustomerAudit);

  if(!CR.sel || !EVENTS.some(e=>e.id === CR.sel)) CR.sel = slice[0] ? slice[0].id : null;
  renderCustomerDiff();
}

function diffBlock(changes){
  if(!changes || !changes.length) return '<div class="inline-note">No field-level changes were recorded for this event.</div>';
  return `<div class="diff">
    <div class="dh"><span>Field</span><span>Previous value</span><span>Updated value</span></div>
    ${changes.map(c=>`<div class="dr"><span class="k">${esc(c[0])}</span>
      <span class="old">${esc(c[1]) || '—'}</span><span class="new">${esc(c[2]) || '—'}</span></div>`).join('')}
  </div>`;
}

function renderCustomerDiff(){
  const e = byId(CR.sel);
  if(!e){ el('crDiff').innerHTML = '<div class="empty">Select a customer event.</div>'; return; }
  const u = userByName(e.user);
  el('crDiff').innerHTML = `
    <div class="lrow" style="border-bottom:0;padding-bottom:2px">
      <div class="lic" style="background:var(--gold-soft);color:var(--gold-dark);font-size:9px">${initials(e.user)}</div>
      <div><div class="lt">${esc(e.action)}</div>
        <div class="ls">${e.record} · ${fmtTs(e.ts)}</div></div>
    </div>
    ${diffBlock(e.changes)}
    <div class="pfields" style="margin-top:8px">
      <div class="pfield"><div class="pk">Responsible user</div><div class="pv">${esc(e.user)}</div></div>
      <div class="pfield"><div class="pk">Role</div><div class="pv">${e.role}</div></div>
      <div class="pfield"><div class="pk">Username</div><div class="pv">${e.username}</div></div>
      <div class="pfield"><div class="pk">Outcome</div><div class="pv">${e.outcome}</div></div>
      <div class="pfield"><div class="pk">Source</div><div class="pv">${e.ip} · ${esc(e.device)}</div></div>
      <div class="pfield"><div class="pk">Audit event</div><div class="pv">${e.id}</div></div>
    </div>
    <div class="form-actions"><button class="btn btn-ghost" id="crOpen">Open full event</button></div>`;
  el('crOpen').onclick = ()=>openEvent(e.id);
}

function wireCustomerAudit(){
  el('crSearch').addEventListener('input', ()=>{ CR.q = el('crSearch').value; CR.page = 1; renderCustomerAudit(); });
  el('crTabs').querySelectorAll('[data-cr]').forEach(b=>{
    b.onclick = ()=>{
      CR.view = b.dataset.cr || ''; CR.page = 1;
      el('crTabs').querySelectorAll('[data-cr]').forEach(x=>x.classList.toggle('on', x === b));
      renderCustomerAudit();
    };
  });
}

/* ===================== 6 · LOAN APPLICATION AUDIT ===================== */
const LA = {view:'', q:'', page:1, per:10, app:''};

function loanEvents(){
  const q = LA.q.trim().toLowerCase();
  return EVENTS.filter(e=>e.module === 'Loan Applications')
    .filter(e=> !LA.view || e.b.loan === LA.view)
    .filter(e=> !q || (e.record + ' ' + e.user + ' ' + e.action + ' ' + e.desc).toLowerCase().includes(q));
}

function renderLoanAudit(){
  const list = loanEvents();
  el('laCount').textContent = nf(list.length) + ' events';
  const pages = Math.max(1, Math.ceil(list.length/LA.per));
  if(LA.page > pages) LA.page = pages;
  const slice = list.slice((LA.page-1)*LA.per, LA.page*LA.per);
  el('laBody').innerHTML = slice.map(e=>`
    <tr class="rowlink" data-ev="${e.id}">
      <td style="white-space:nowrap">${fmtShort(e.date)} ${e.time.slice(0,5)}</td>
      <td class="mono" style="font-size:9.5px">${e.record}</td>
      <td>${esc(e.action)}</td>
      <td>${esc(e.user)}</td>
      <td><span class="badge ${outcomeTone(e.outcome)}">${e.outcome}</span></td>
    </tr>`).join('') || '<tr><td colspan="5" class="empty">No loan application events match.</td></tr>';
  el('laBody').querySelectorAll('[data-ev]').forEach(r=>{
    r.onclick = ()=>{ LA.app = EVENTS.find(e=>e.id === r.dataset.ev).record; el('laApp').value = LA.app; renderLoanTimeline(); };
  });
  el('laPager').innerHTML = pagerHtml(list.length, LA.page, LA.per, 'laPrev', 'laNext');
  bindPager('laPrev', 'laNext', LA, renderLoanAudit);

  const apps = [...new Set(EVENTS.filter(e=>e.module === 'Loan Applications').map(e=>e.record))].sort();
  const sel = el('laApp');
  sel.innerHTML = apps.map(a=>`<option>${a}</option>`).join('');
  if(!LA.app || !apps.includes(LA.app)) LA.app = apps[0] || '';
  sel.value = LA.app;
  renderLoanTimeline();
}

function renderLoanTimeline(){
  const rows = EVENTS.filter(e=>e.record === LA.app).sort((a,b)=> a.ts < b.ts ? -1 : 1);
  el('laTimeline').innerHTML = rows.length ? rows.map(e=>`
    <div class="evt" data-ev="${e.id}" style="cursor:pointer">
      <div class="eic ${evIcon(e)}">${e.outcome === 'Failed' ? '✕' : e.outcome === 'Warning' ? '!' : '✓'}</div>
      <div class="eb"><div class="et">${esc(e.action)}</div>
        <div class="es">${esc(e.user)} · ${e.role}</div>
        <div class="em">${fmtTs(e.ts)} · ${e.id}</div></div>
    </div>`).join('') : '<div class="empty">No events for this reference.</div>';
  bindRows('laTimeline');
}

function wireLoanAudit(){
  el('laSearch').addEventListener('input', ()=>{ LA.q = el('laSearch').value; LA.page = 1; renderLoanAudit(); });
  el('laTabs').querySelectorAll('[data-la]').forEach(b=>{
    b.onclick = ()=>{
      LA.view = b.dataset.la || ''; LA.page = 1;
      el('laTabs').querySelectorAll('[data-la]').forEach(x=>x.classList.toggle('on', x === b));
      renderLoanAudit();
    };
  });
  el('laApp').addEventListener('change', ()=>{ LA.app = el('laApp').value; renderLoanTimeline(); });
}

</script>
