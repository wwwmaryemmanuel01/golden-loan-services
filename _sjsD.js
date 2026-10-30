
/* ============================================================
   SECTION 17 · CLOSURE & TRANSFER
   ============================================================ */
function renderClosure(){
  el('clStaff').innerHTML = STAFF.map(s=>`<option value="${s.id}">${s.name} · ${s.role}</option>`).join('');
  el('clDept').innerHTML = DEPTS.map(d=>`<option>${d.name}</option>`).join('');
  el('clBranch').innerHTML = BRANCHES.map(b=>`<option>${b.name}</option>`).join('');

  el('clQueue').innerHTML = CLOSURE.filter(c=>c[4]==='Pending approval').map((c,i)=>`
    <div class="ann" style="margin-bottom:9px">
      <div class="anh"><div class="sav red">${initials(c[1])}</div>
        <div style="flex:1"><div class="ant">${c[1]}</div>
          <div class="ans">${c[0]} · ${c[2]} · ${c[3]}</div></div>
        <span class="chip st-await">Pending</span></div>
      <div style="display:flex;gap:6px;margin-top:9px">
        <button class="btn btn-gold btn-sm" data-act="approve-closure" data-ref="${c[0]}">Approve deactivation</button>
        <button class="btn btn-ghost btn-sm" data-act="reject-closure" data-ref="${c[0]}">Reject</button>
      </div>
    </div>`).join('') || '<div class="empty">No requests awaiting approval.</div>';

  el('clTrail').innerHTML = CL_TRAIL.map(([t,who,req,reason,outcome])=>`
    <tr><td class="tiny muted" style="white-space:nowrap">${t}</td>
      <td class="tiny"><b>${who}</b><div class="muted">${req} · ${reason}</div></td>
      <td>${(()=>{const [main,...rest]=outcome.split(' · ');
        return `<span class="chip ${/Completed|Approved/.test(main)?'st-ok':'st-await'}">${main}</span>` +
          (rest.length ? `<div class="tiny muted" style="margin-top:3px">${rest.join(' · ')}</div>` : '');})()}</td></tr>`).join('');
}

function submitClosure(){
  const s = staffBy(el('clStaff').value), type = el('clType').value;
  const reason = el('clReason').value.trim();
  if(!reason) return toast('A reason is required','err');
  const ref = 'CLS-' + String(CLOSURE.length+1).padStart(3,'0');
  const rec = [ref, s.name, type, reason, 'Pending approval'];
  CLOSURE.unshift(rec);
  CL_TRAIL.unshift([`${TODAY} ${stamp()}`, s.name, type, reason, 'Requested']);
  AUDIT.unshift({time:stamp(), staff:'Chikondi Mwale', cat:'Status Change', record:s.id,
    detail:`${type} requested · ${reason}`, ip:'196.44.21.4', result:'Success'});
  el('clReason').value='';
  el('clMsg').textContent = `${ref} submitted for approval`;
  renderAll(); toast(`${type} request submitted`, 'info');
}

function approveClosure(ref){
  const c = CLOSURE.find(x=>x[0]===ref); if(!c) return;
  const s = STAFF.find(x=>x.name===c[1]);
  const keepTasks = el('clTasks').checked, revoke = el('clAccess').checked,
        sessions = el('clSessions').checked, preserve = el('clKeep').checked;
  c[4] = 'Approved';
  if(s){
    if(c[2]==='Deactivate account') s.status = 'Inactive';
    if(c[2]==='Transfer department') s.dept = el('clDept').value;
    if(c[2]==='Transfer branch') s.branch = el('clBranch').value;
    if(sessions) s.sessions = 0;
    if(!revoke) s.status = s.status==='Inactive' ? 'Active' : s.status;
  }
  if(keepTasks && s){
    const moved = TASKS.filter(t=>t.staff===s.name && t.status!=='Completed');
    moved.forEach(t=>{ t.staff = staffBy('STF-002').name; });
    if(moved.length) ASSIGN_HISTORY.unshift([`${TODAY} ${stamp()}`, '—',
      `${moved.length} tasks reassigned from ${s.name}`, 'C. Mwale']);
  }
  CL_TRAIL.unshift([`${TODAY} ${stamp()}`, c[1], c[2], c[3],
    `Approved${preserve?' · records preserved':''}${sessions?' · sessions revoked':''}`]);
  AUDIT.unshift({time:stamp(), staff:'Chikondi Mwale', cat:'Status Change', record:s?s.id:'—',
    detail:`${c[2]} approved for ${c[1]}`, ip:'196.44.21.4', result:'Success'});
  renderAll(); toast(`${c[2]} approved for ${c[1]}`, 'ok');
}

/* ============================================================
   SECTION 18 · SETTINGS
   ============================================================ */
function field(title, sub, html){
  return `<div class="setrow"><div><div class="sk">${title}</div><div class="ss">${sub}</div></div>
    <div class="sv">${html}</div></div>`;
}
function row(title, sub, on){
  return field(title, sub, `<button class="toggle ${on?'on':''}" data-act="toggle"></button>`);
}
const num = v => `<input type="number" value="${v}" />`;
const sel = (opts, cur) => `<select>${opts.map(o=>`<option ${o===cur?'selected':''}>${o}</option>`).join('')}</select>`;

function renderSettings(){
  el('setAccount').innerHTML =
    row('Staff accounts created by administrators','Only Administrator and above can add staff',true) +
    field('Username format','How usernames are generated', sel(['first.last','f.last','firstinitial+lastname'],'f.last')) +
    field('Minimum username length','Characters', num(5)) +
    row('Unique email address required','One account per email address',true) +
    row('Staff number mandatory','Identification cannot be skipped',true) +
    field('Invitation validity','Days before the link expires', num(7)) +
    row('Auto-send invitation on creation','Sends credentials by email',true);

  el('setSecurity').innerHTML =
    field('Minimum password length','Characters', num(12)) +
    field('Password expiry','Days', num(90)) +
    field('Login attempt limit','Attempts before lockout', num(5)) +
    field('Lockout duration','Minutes', num(30)) +
    field('Session timeout','Idle minutes', num(20)) +
    row('Require multi-factor authentication','Administrators and approvers',true) +
    row('Block sign-in on suspended accounts','Immediate enforcement',true);

  el('setRoles').innerHTML =
    field('Default role for new staff','Applied when none is chosen', sel(ROLES.map(r=>r.name),'Data Entry Clerk')) +
    row('Role defaults assign view-only access','Create, edit and delete granted separately',false) +
    row('Custom roles allowed','Administrators may define new roles',true) +
    row('Role change requires notification','Staff are told when their role changes',true) +
    field('Default permission template','Starting point for custom roles', sel(['View only','Role defaults','Full access'],'Role defaults'));

  el('setAudit').innerHTML =
    row('Approval required for deactivation','Two-person rule',true) +
    row('Approval required for bulk permission changes','Above 5 accounts',true) +
    row('Automatic suspension after repeated failures','5 failed sign-ins',true) +
    field('Audit log retention','Months', sel(['24 months','60 months','84 months'],'60 months')) +
    row('Notify administrators of security events','Email and dashboard',true) +
    row('Notify staff of permission changes','Immediate notification',true);
}

/* ============================================================
   MODAL / EXPORT UTILITIES
   ============================================================ */
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

function exportCSV(rows, name){
  const csv = rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], {type:'text/csv'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name; a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href), 4000);
  toast('Export ready · ' + name, 'ok');
}
function staffCSV(rows, name){
  exportCSV([['Staff ID','Name','Username','Role','Department','Branch','Status','Joined','Last login'],
    ...rows.map(s=>[s.id,s.name,s.user,s.role,s.dept,s.branch,s.status,s.joined,s.lastLogin])], name);
}

/* ============================================================
   EVENT DELEGATION
   ============================================================ */
document.addEventListener('click', e=>{
  const t = e.target.closest('[data-act]');
  if(!t) return;
  const act = t.dataset.act, id = t.dataset.id, ref = t.dataset.ref, idx = +t.dataset.idx;
  switch(act){
    case 'profile': S.profile = id; renderProfile();
      document.getElementById('s4').scrollIntoView({behavior:'smooth'}); break;
    case 'edit-staff': editStaff(id); break;
    case 'toggle-status': {
      const s = staffBy(id);
      setStatus(id, s.status==='Active' ? 'Suspended' : 'Active'); break; }
    case 'set-status': setStatus(id, t.dataset.st); break;
    case 'dir-prev': S.page = Math.max(1, S.page-1); renderDirectory(); break;
    case 'dir-next': S.page++; renderDirectory(); break;
    case 'aud-prev': S.auditPage = Math.max(1, S.auditPage-1); renderAudit(); break;
    case 'aud-next': S.auditPage++; renderAudit(); break;
    case 'open-audit': {
      const s = staffBy(id);
      el('audStaff').value = s ? s.name : '';
      el('audSearch').value = ''; el('audCat').value = ''; S.auditPage = 1; renderAudit();
      document.getElementById('s11').scrollIntoView({behavior:'smooth'}); break; }
    case 'edit-role': editRole(idx); break;
    case 'force-reset': {
      const s = staffBy(id);
      s.fails = 0; if(s.status==='Locked') s.status = 'Active';
      AUDIT.unshift({time:stamp(), staff:'Chikondi Mwale', cat:'Status Change', record:s.id,
        detail:'Password reset forced · change at next login', ip:'196.44.21.4', result:'Success'});
      renderAll(); toast(`Password reset forced for ${s.name}`,'ok'); break; }
    case 'revoke-sessions': {
      const s = staffBy(id); s.sessions = 0;
      AUDIT.unshift({time:stamp(), staff:'Chikondi Mwale', cat:'Status Change', record:s.id,
        detail:'Active sessions revoked', ip:'196.44.21.4', result:'Success'});
      renderAll(); toast(`Sessions revoked for ${s.name}`,'info'); break; }
    case 'complete-task': completeTask(ref); break;
    case 'reassign-task': reassignTask(ref); break;
    case 'resend-invite': {
      const inv = INVITES[idx];
      inv[4] = TODAY; inv[6] = 'Pending';
      renderInvites(); toast(`Invitation resent to ${inv[0]}`,'ok'); break; }
    case 'cancel-invite': {
      const inv = INVITES.splice(idx,1)[0];
      ONBOARD_HISTORY.unshift([inv[0], inv[4], '—', inv[2], '—', '—', 'Cancelled']);
      renderAll(); toast(`Invitation for ${inv[0]} cancelled`,'info'); break; }
    case 'complete-onboard': {
      const s = staffBy(id);
      s.status = 'Active'; s.lastLogin = TODAY+' '+stamp(); s.sessions = 1;
      ONBOARD_HISTORY.unshift([s.name, s.joined, TODAY, s.role, 'Role defaults', TODAY, 'Complete']);
      AUDIT.unshift({time:stamp(), staff:'Chikondi Mwale', cat:'Status Change', record:s.id,
        detail:'Onboarding completed · account activated', ip:'196.44.21.4', result:'Success'});
      renderAll(); toast(`${s.name} activated`,'ok'); break; }
    case 'view-doc': {
      const d = DOCS[idx];
      const restricted = d.access==='Restricted';
      openModal(d.name, `${d.staff} · ${d.type}`, `
        <div class="preview" style="min-height:170px">
          <div class="phead"><span>GOLDEN FINANCIAL SERVICES</span><span>${restricted?'RESTRICTED':'STANDARD'}</span></div>
          <div class="pbody"><div class="psub">${d.name}</div>
            <div style="color:#C7CBD4">${restricted
              ? 'Confidential employment record. Access is limited to HR and compliance; this view has been logged.'
              : 'Document preview · uploaded '+d.uploaded+'.'}</div>
            <div class="tiny" style="color:#7A808D;margin-top:10px">Expiry: ${d.expiry} · Access: ${d.access}</div>
          </div></div>`,
        [{label:'Close', cls:'btn-ghost', act:'close'}]);
      if(restricted){
        AUDIT.unshift({time:stamp(), staff:'Chikondi Mwale', cat:'Document', record:d.staff,
          detail:'Viewed restricted document: ' + d.name, ip:'196.44.21.4', result:'Success'});
        renderAudit();
      }
      break; }
    case 'upload-doc': uploadDocModal(idx); break;
    case 'report-pdf': toast(`${ref} · PDF generated`, 'ok'); break;
    case 'report-xls': toast(`${ref} · Excel generated`, 'ok'); break;
    case 'report-csv': staffCSV(dirFiltered(), ref.toLowerCase().replace(/[^a-z]+/g,'-')+'.csv'); break;
    case 'unit-report': toast(`${ref} generated`, 'ok'); break;
    case 'perf-pdf': toast('Performance report · PDF generated','ok'); break;
    case 'perf-xls': toast('Performance report · Excel generated','ok'); break;
    case 'perf-csv': staffCSV(STAFF, 'golden-staff-performance.csv'); break;
    case 'edit-dept': editDept(idx); break;
    case 'edit-branch': editBranch(idx); break;
    case 'approve-closure': approveClosure(ref); break;
    case 'reject-closure': {
      const c = CLOSURE.find(x=>x[0]===ref); if(c){ c[4] = 'Rejected';
        CL_TRAIL.unshift([`${TODAY} ${stamp()}`, c[1], c[2], c[3], 'Rejected']);
        renderClosure(); toast('Request rejected','info'); }
      break; }
    case 'toggle': t.classList.toggle('on'); break;
  }
});

/* ============================================================
   WIRING
   ============================================================ */
el('modalClose').onclick = closeModal;
el('modal').addEventListener('click', e=>{ if(e.target.id==='modal') closeModal(); });
document.addEventListener('keydown', e=>{ if(e.key==='Escape') closeModal(); });
el('menuBtn').onclick = ()=> document.getElementById('sidebar').classList.toggle('open');

document.querySelectorAll('.nav-item').forEach(item=>{
  item.addEventListener('click', e=>{
    const p = item.dataset.page;
    if(['dashboard','disbursements','notifications','staff','reports'].includes(p)) return;
    e.preventDefault(); toast('This module is queued for build.','info');
    document.getElementById('sidebar').classList.remove('open');
  });
});

const secs=[...document.querySelectorAll('.sec')], chips=[...document.querySelectorAll('.snav')];
const spy=()=>{ let cur=secs[0]; for(const s of secs) if(s.getBoundingClientRect().top<=150) cur=s;
  chips.forEach(c=>c.classList.toggle('on', c.getAttribute('href')==='#'+cur.id)); };
window.addEventListener('scroll', spy, {passive:true});
chips.forEach(c=>c.addEventListener('click', e=>{
  e.preventDefault();
  const t=document.querySelector(c.getAttribute('href'));
  if(t) window.scrollTo({top:t.offsetTop-112, behavior:'smooth'});
}));

/* section 2 */
['dirSearchBy','dirSearch','dirRole','dirStatus','dirDept','dirBranch'].forEach(id=>{
  const h=()=>{
    if(id==='dirSearchBy'){
      const labels={name:'Search by full name…',username:'Search by username…',phone:'Search by phone number…',
        email:'Search by email address…',id:'Search by staff ID…'};
      el('dirSearch').placeholder = labels[el('dirSearchBy').value];
    }
    S.page = 1; renderDirectory();
  };
  el(id).addEventListener('input', h); el(id).addEventListener('change', h);
});
el('dirReset').onclick = ()=>{
  ['dirSearch'].forEach(i=>el(i).value='');
  ['dirRole','dirStatus','dirDept','dirBranch'].forEach(i=>el(i).value='');
  S.page = 1; renderDirectory();
};
el('dirExport').onclick = ()=> staffCSV(dirFiltered(), 'golden-staff-directory.csv');
el('exportStaff').onclick = ()=> staffCSV(STAFF, 'golden-staff-directory.csv');
document.addEventListener('change', e=>{
  const cb = e.target.closest('[data-pick]');
  if(!cb) return;
  if(cb.checked) S.selected.add(cb.dataset.pick); else S.selected.delete(cb.dataset.pick);
});
el('dirSelAll').addEventListener('change', e=>{
  const rows = dirFiltered().slice((S.page-1)*S.size, S.page*S.size);
  if(e.target.checked) rows.forEach(s=>S.selected.add(s.id)); else S.selected.clear();
  renderDirectory();
});

/* section 3 */
el('genPass').onclick = ()=>{
  const chars='ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
  let p=''; for(let i=0;i<14;i++) p+=chars[Math.floor(Math.random()*chars.length)];
  el('nsPass').value = p;
  el('passHint').textContent = 'Temporary password generated · shared once with the staff member';
};
el('copyPass').onclick = ()=>{
  if(!el('nsPass').value || el('nsPass').value.includes('•')) return toast('Generate a password first','err');
  navigator.clipboard?.writeText(el('nsPass').value);
  toast('Temporary password copied','info');
};
['nsName','nsUser','nsEmail','nsPhone','nsIdNo','nsRole','nsDept','nsBranch','nsManager','nsStatus']
  .forEach(id=>{ el(id).addEventListener('input', ()=>{ el('addBadge').textContent='Draft'; renderRegRecord(); });
                el(id).addEventListener('change', ()=>{ el('addBadge').textContent='Draft'; renderRegRecord(); }); });
['nsInvite','nsMfa'].forEach(id=>el(id).addEventListener('change', renderRegRecord));
el('createStaff').onclick = createStaff;
el('clearStaff').onclick = ()=>{
  ['nsName','nsUser','nsEmail','nsPhone','nsIdNo'].forEach(i=>el(i).value='');
  el('nsPass').value='••••••••••••'; el('createMsg').textContent='';
  el('passHint').textContent='Temporary password · must be changed at first login';
  el('addBadge').textContent='Draft'; renderRegRecord();
};
el('quickAdd').onclick = ()=> document.getElementById('s3').scrollIntoView({behavior:'smooth'});

/* section 4 */
el('profSelect').addEventListener('change', e=>{ S.profile = e.target.value; renderProfile(); });
el('profEdit').onclick = ()=> editStaff(S.profile);

/* section 5 */
el('newRole').onclick = ()=> editRole(-1);
el('assignRoleBtn').onclick = assignRole;

/* section 6 */
el('permRoleSel').addEventListener('change', e=>{ S.permRole = e.target.value; renderPermissions(); });
el('savePerms').onclick = savePermissions;
el('permAll').onclick = ()=>{ document.querySelectorAll('[data-perm]').forEach(c=>{ if(!c.disabled) c.checked = true; }); };
el('permNone').onclick = ()=>{ document.querySelectorAll('[data-perm]').forEach(c=>{ if(!c.disabled) c.checked = false; }); };
el('permView').onclick = ()=>{
  document.querySelectorAll('[data-perm]').forEach(c=>{
    const [,col] = c.dataset.perm.split(',');
    if(!c.disabled) c.checked = col==='0';
  });
};

/* section 8 */
el('pwGo').onclick = applyPwAction;

/* section 9 */
el('taskFilter').addEventListener('change', renderAssignments);
el('openAssign').onclick = openAssignModal;

/* section 10 */
document.querySelectorAll('#perfPeriod button').forEach(b=>{
  b.addEventListener('click', ()=>{
    document.querySelectorAll('#perfPeriod button').forEach(x=>x.classList.remove('on'));
    b.classList.add('on'); S.perfPeriod = b.dataset.p; renderPerformance();
  });
});

/* section 11 */
['audSearch','audCat','audStaff'].forEach(id=>{
  const h=()=>{ S.auditPage=1; renderAudit(); };
  el(id).addEventListener('input', h); el(id).addEventListener('change', h);
});
el('audReset').onclick = ()=>{ el('audSearch').value=''; el('audCat').value=''; el('audStaff').value='';
  S.auditPage=1; renderAudit(); };
el('auditExport').onclick = ()=> exportCSV([['Time','Staff','Activity','Record','Detail','IP','Result'],
  ...auditFiltered().map(a=>[a.time,a.staff,a.cat,a.record,a.detail,a.ip,a.result])], 'golden-staff-activity.csv');

/* section 12 */
el('newDept').onclick = ()=> editDept(-1);
el('newBranch').onclick = ()=> editBranch(-1);

/* section 13 */
el('sendInvite').onclick = sendInvite;
el('inviteBtn').onclick = ()=> document.getElementById('s13').scrollIntoView({behavior:'smooth'});
el('quickInvite').onclick = ()=> document.getElementById('s13').scrollIntoView({behavior:'smooth'});

/* section 14 */
document.querySelectorAll('#staffAudSeg button').forEach(b=>{
  b.addEventListener('click', ()=>{
    document.querySelectorAll('#staffAudSeg button').forEach(x=>x.classList.remove('on'));
    b.classList.add('on'); S.staffAud = b.dataset.aud; renderComms();
  });
});
el('cmSend').onclick = sendStaffNotification;

/* section 15 */
el('docFilter').addEventListener('change', renderDocs);
el('uploadDoc').onclick = ()=> uploadDocModal(-1);

/* section 17 */
el('clSubmit').onclick = submitClosure;

/* section 18 */
el('setSave').onclick = ()=> toast('Staff management settings saved','ok');
el('setReset').onclick = ()=>{ renderSettings(); toast('Changes discarded','info'); };

/* misc */
el('recentAll').onclick = ()=> document.getElementById('s2').scrollIntoView({behavior:'smooth'});
el('bellBtn').onclick = ()=> document.getElementById('s1').scrollIntoView({behavior:'smooth'});
el('globalSearch').addEventListener('keydown', e=>{
  if(e.key==='Enter'){
    el('dirSearchBy').value = 'name'; el('dirSearch').value = e.target.value;
    S.page = 1; renderDirectory();
    document.getElementById('s2').scrollIntoView({behavior:'smooth'});
  }
});

/* boot */
function renderAll(){
  renderOverview(); renderDirectory(); renderAddStaff(); renderProfile(); renderRoles();
  renderPermissions(); renderStatus(); renderPassword(); renderAssignments(); renderPerformance();
  renderAudit(); renderUnits(); renderInvites(); renderComms(); renderDocs(); renderReports();
  renderClosure(); renderSettings();
}

window.STAFF_APP = {STAFF, ROLES, PERMS, DEPTS, BRANCHES, TASKS, AUDIT, INVITES, DOCS,
  CM_HISTORY, CLOSURE, S, renderAll, dirFiltered};

/* populate static selects */
el('dirRole').innerHTML = '<option value="">All roles</option>' +
  ROLES.map(r=>`<option>${r.name}</option>`).join('');
el('dirDept').innerHTML = '<option value="">All departments</option>' +
  DEPTS.map(d=>`<option>${d.name}</option>`).join('');
el('dirBranch').innerHTML = '<option value="">All branches</option>' +
  BRANCHES.map(b=>`<option>${b.name}</option>`).join('');
el('audStaff').innerHTML = '<option value="">All staff</option>' +
  STAFF.map(s=>`<option>${s.name}</option>`).join('');

renderAll();
spy();
</script>
</body>
</html>
