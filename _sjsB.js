
/* ============================================================
   SHARED BITS
   ============================================================ */
function statusChip(s){
  const m = {Active:'st-ok', Inactive:'st-canc', Suspended:'st-fail', Locked:'st-rev', Pending:'st-await'};
  return `<span class="chip ${m[s.status]||'st-canc'}">${s.status}</span>`;
}
const roleColor = r => ROLE_COLORS[(ROLES.find(x=>x.name===r)||{}).level] || '#5A6172';
const staffBy = id => STAFF.find(s=>s.id===id);
const avTone = i => ['','blue','green','purple','gray'][i%5];
const kv = (k,v) => `<div class="kv"><span class="k">${k}</span><span class="v">${v}</span></div>`;
function permissionCount(role){
  const p = PERMS[role] || [];
  return p.reduce((a,row)=>a+row.reduce((x,y)=>x+y,0),0) + ' of ' + (PERM_MODULES.length*4);
}

/* ============================================================
   SECTION 1 · OVERVIEW
   ============================================================ */
function renderOverview(){
  const total = STAFF.length;
  const active = STAFF.filter(s=>s.status==='Active').length;
  const inactive = STAFF.filter(s=>s.status==='Inactive').length;
  const suspended = STAFF.filter(s=>s.status==='Suspended').length;
  const locked = STAFF.filter(s=>s.status==='Locked').length;
  const pending = INVITES.filter(i=>i[6]==='Pending').length;

  el('bandStaff').textContent = total;
  el('bandActive').textContent = active;
  el('bandInvites').textContent = pending;
  el('bandAlerts').textContent = SEC_ALERTS.length;
  el('alertCount').textContent = SEC_ALERTS.length;

  const tiles = [
    ['Total Staff Members', total, 'All accounts on the platform', 'users', 'b', 'on record'],
    ['Active Staff Members', active, 'Signed in and enabled', 'check', 'g', 'active'],
    ['Inactive Staff Members', inactive, 'No recent activity', 'card', 'p', 'dormant'],
    ['Suspended Accounts', suspended + locked, `${suspended} suspended · ${locked} locked`, 'alert', 'r', 'restricted'],
    ['Pending Invitations', pending, 'Awaiting registration', 'doc', 'p', 'invited']
  ];
  el('ovTiles').innerHTML = tiles.map(([l,v,f,ic,tone,tag])=>`
    <div class="card stat">
      <div class="stat-top"><div class="stat-label">${l}</div>
        <div class="stat-ic ${tone}">${ICONS[ic]}</div></div>
      <div class="stat-val">${nf(v)}</div>
      <div class="stat-foot"><span class="badge ${tag==='restricted'?'b-rev':tag==='active'?'b-appr':tag==='invited'?'b-gray':'b-pend'}">${tag}</span></div>
      <div class="tiny muted" style="margin-top:4px">${f}</div>
    </div>`).join('');

  mkHBars(el('ovRoles'), ROLES.map(r=>({
    label:r.name.length>22 ? r.name.slice(0,21)+'…' : r.name,
    value:STAFF.filter(s=>s.role===r.name && s.status!=='Inactive').length,
    color:roleColor(r.name)
  })).filter(r=>r.value>0).sort((a,b)=>b.value-a.value));

  mkHBars(el('ovDepts'), DEPTS.map(d=>({
    label:d.name, value:STAFF.filter(s=>s.dept===d.name).length, color:'#C9A227'
  })).sort((a,b)=>b.value-a.value));

  el('ovRecent').innerHTML = STAFF.slice().sort((a,b)=>a.joined<b.joined?1:-1).slice(0,4).map((s,i)=>`
    <div class="li"><div class="sav ${avTone(i)}">${initials(s.name)}</div>
      <div><div class="t1">${s.name}</div><div class="t2">${s.role} · ${s.branch} · joined ${s.joined}</div></div>
      <div class="amt">${statusChip(s)}</div></div>`).join('');

  el('ovAlerts').innerHTML = SEC_ALERTS.map(([t,s,lv])=>`
    <div class="li"><div class="sav red">!</div>
      <div><div class="t1">${t}</div><div class="t2">${s}</div></div>
      <div class="amt"><span class="chip ${lv==='Critical'?'st-fail':'st-await'}">${lv}</span></div></div>`).join('');

  el('ovActivity').innerHTML = AUDIT.slice(0,8).map(a=>`
    <tr><td class="tiny muted" style="white-space:nowrap">${a.time}</td>
      <td class="tiny" style="font-weight:600;white-space:nowrap">${a.staff}</td>
      <td class="tiny">${a.cat}</td>
      <td class="tiny muted">${a.record}</td>
      <td><span class="chip ${a.result==='Success'?'st-ok':'st-fail'}">${a.result}</span></td></tr>`).join('');
}

const ICONS = {
  doc:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 3v5h5"/><path d="M19 8v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5Z"/></svg>',
  alert:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3 2.5 20h19L12 3Z"/><path d="M12 9v5M12 17.5h.01"/></svg>',
  check:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="m3 13 5 5L21 5"/></svg>',
  card:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2.5" y="6" width="19" height="13" rx="2.5"/><circle cx="12" cy="12.5" r="2.4"/></svg>',
  users:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="8" r="3.2"/><path d="M2.8 20a6.2 6.2 0 0 1 12.4 0"/><path d="M17 5.4a3.2 3.2 0 0 1 0 6.2M18.6 20a6.2 6.2 0 0 0-3-5.2"/></svg>'
};

/* ============================================================
   SECTION 2 · ALL STAFF MEMBERS
   ============================================================ */
function dirFiltered(){
  const by = el('dirSearchBy').value;
  const q = (el('dirSearch').value||'').toLowerCase().trim();
  const role = el('dirRole').value, st = el('dirStatus').value;
  const dept = el('dirDept').value, branch = el('dirBranch').value;
  return STAFF.filter(s=>{
    if(q){
      const field = by==='name' ? s.name : by==='username' ? s.user
        : by==='phone' ? s.phone : by==='email' ? s.email : s.id;
      if(!String(field).toLowerCase().includes(q)) return false;
    }
    if(role && s.role!==role) return false;
    if(st && s.status!==st) return false;
    if(dept && s.dept!==dept) return false;
    if(branch && s.branch!==branch) return false;
    return true;
  }).sort((a,b)=>a.name.localeCompare(b.name));
}

function renderDirectory(){
  const rows = dirFiltered();
  const pages = Math.max(1, Math.ceil(rows.length/S.size));
  if(S.page>pages) S.page = pages;
  const slice = rows.slice((S.page-1)*S.size, S.page*S.size);
  el('dirCount').textContent = rows.length + ' staff';
  el('dirBody').innerHTML = slice.length ? slice.map((s,i)=>`
    <tr>
      <td><input type="checkbox" data-pick="${s.id}" ${S.selected.has(s.id)?'checked':''} /></td>
      <td class="tiny" style="font-weight:700">${s.id}</td>
      <td><div class="who"><div class="sav ${avTone(i)}">${initials(s.name)}</div>
        <div><div class="nm">${s.name}</div><div class="id">@${s.user}</div></div></div></td>
      <td class="tiny">${s.role}</td>
      <td class="tiny">${s.dept}</td>
      <td class="tiny">${s.branch}</td>
      <td>${statusChip(s)}</td>
      <td class="tiny muted">${s.lastLogin.replace(' 2026','')}</td>
      <td>
        <button class="btn btn-ghost btn-sm" data-act="profile" data-id="${s.id}">Profile</button>
        <button class="btn btn-ghost btn-sm" data-act="edit-staff" data-id="${s.id}">Edit</button>
        <button class="btn btn-ghost btn-sm tick" data-act="toggle-status" data-id="${s.id}"
          title="${s.status==='Active'?'Suspend account':'Activate account'}">${s.status==='Active'?'⏻':'▶'}</button>
      </td></tr>`).join('')
    : `<tr><td colspan="9"><div class="empty">No staff match these filters.</div></td></tr>`;

  el('dirPager').innerHTML = `
    <span>${rows.length} record${rows.length===1?'':'s'} · page ${S.page} of ${pages}</span>
    <button data-act="dir-prev" ${S.page<=1?'disabled':''}>Prev</button>
    <button data-act="dir-next" ${S.page>=pages?'disabled':''}>Next</button>`;
}

function editStaff(id){
  const s = staffBy(id);
  openModal('Edit staff details', `${s.id} · ${s.name}`, `
    <div class="form-grid">
      <div class="fg"><label>Full name</label><input id="esName" value="${s.name}" /></div>
      <div class="fg"><label>Username</label><input id="esUser" value="${s.user}" /></div>
      <div class="fg"><label>Email</label><input id="esEmail" value="${s.email}" /></div>
      <div class="fg"><label>Phone</label><input id="esPhone" value="${s.phone}" /></div>
      <div class="fg"><label>Role</label><select id="esRole">${ROLES.map(r=>`<option ${r.name===s.role?'selected':''}>${r.name}</option>`).join('')}</select></div>
      <div class="fg"><label>Department</label><select id="esDept">${DEPTS.map(d=>`<option ${d.name===s.dept?'selected':''}>${d.name}</option>`).join('')}</select></div>
      <div class="fg"><label>Branch</label><select id="esBranch">${BRANCHES.map(b=>`<option ${b.name===s.branch?'selected':''}>${b.name}</option>`).join('')}</select></div>
      <div class="fg"><label>Reporting manager</label><select id="esMgr">${['—',...STAFF.map(x=>x.name)].map(m=>`<option ${m===s.manager?'selected':''}>${m}</option>`).join('')}</select></div>
      <div class="fg"><label>Staff identification number</label><input id="esIdNo" value="${s.idno}" /></div>
      <div class="fg"><label>Account status</label><select id="esStatus">${['Active','Inactive','Suspended','Locked','Pending']
        .map(x=>`<option ${x===s.status?'selected':''}>${x}</option>`).join('')}</select></div>
    </div>`,
    [{label:'Cancel', cls:'btn-ghost', act:'close'},
     {label:'Save changes', cls:'btn-gold', act:()=>{
        s.name = el('esName').value; s.user = el('esUser').value; s.email = el('esEmail').value;
        s.phone = el('esPhone').value; s.role = el('esRole').value; s.dept = el('esDept').value;
        s.branch = el('esBranch').value; s.manager = el('esMgr').value; s.idno = el('esIdNo').value;
        s.status = el('esStatus').value;
        AUDIT.unshift({time:stamp(), staff:'Chikondi Mwale', cat:'Staff Record', record:s.id,
          detail:'Staff details updated', ip:'196.44.21.4', result:'Success'});
        closeModal(); renderAll(); toast('Staff details saved','ok');
     }}]);
}

/* ============================================================
   SECTION 3 · ADD NEW STAFF MEMBER
   ============================================================ */
function renderAddStaff(){
  el('nsRole').innerHTML = ROLES.map(r=>`<option>${r.name}</option>`).join('');
  el('nsDept').innerHTML = DEPTS.map(d=>`<option>${d.name}</option>`).join('');
  el('nsBranch').innerHTML = BRANCHES.map(b=>`<option>${b.name}</option>`).join('');
  el('nsManager').innerHTML = ['—',...STAFF.filter(s=>s.status==='Active').map(s=>s.name)]
    .map(m=>`<option>${m}</option>`).join('');
  renderRegRecord();
}

function renderRegRecord(){
  const role = el('nsRole').value, dept = el('nsDept').value, branch = el('nsBranch').value;
  const rows = [
    ['Registration date', TODAY],
    ['Registered by', 'Chikondi Mwale · Super Admin'],
    ['Staff ID', 'STF-' + String(S.seq+1).padStart(3,'0')],
    ['Username', el('nsUser').value || '—'],
    ['Staff number', el('nsIdNo').value || '—'],
    ['Role / department', role + ' · ' + dept],
    ['Branch', branch],
    ['Reporting manager', el('nsManager').value || '—'],
    ['Initial status', el('nsStatus').value],
    ['Invitation', el('nsInvite').checked ? 'Sent by email' : 'Not sent'],
    ['MFA', el('nsMfa').checked ? 'Enforced' : 'Optional'],
    ['Password', 'Temporary · change at first login']
  ];
  el('regRecord').innerHTML = rows.map(([k,v])=>kv(k,v)).join('');

  const mods = PERM_MODULES.map((m,i)=>({m, p:(PERMS[role]||[])[i]||[0,0,0,0]})).filter(x=>x.p[0]);
  el('accessSummary').innerHTML =
    `<div class="kv"><span class="k">Permissions</span><span class="v">${permissionCount(role)}</span></div>
     <div class="taglist">${mods.map(x=>`<span class="ptag">${x.m}</span>`).join('') || '<span class="tiny muted">No access</span>'}</div>
     <div class="tiny muted" style="margin-top:8px">${(ROLES.find(r=>r.name===role)||{}).restrict || ''}</div>`;
}

function createStaff(){
  const name = el('nsName').value.trim(), user = el('nsUser').value.trim(),
        phone = el('nsPhone').value.trim(), idno = el('nsIdNo').value.trim();
  if(!name || !user || !phone || !idno) return toast('Full name, username, phone and staff number are required','err');
  const id = 'STF-' + String(++S.seq).padStart(3,'0');
  const s = addStaff({id, name, user, email: el('nsEmail').value.trim() || '—',
    phone, role: el('nsRole').value, dept: el('nsDept').value, branch: el('nsBranch').value,
    manager: el('nsManager').value, status: el('nsStatus').value==='Pending invitation' ? 'Pending' : el('nsStatus').value,
    idno, joined:'2026-10-30', lastLogin:'—', mfa: el('nsMfa').checked,
    nid:'NID-'+(300000+S.seq*137), dob:'1990-04-12', address:'Private Bag 200, Malawi', sessions:0});
  if(el('nsInvite').checked && s.status!=='Inactive'){
    INVITES.unshift([name, s.email==='—' ? '—' : s.email, s.role, s.dept, TODAY, '6 Nov 2026', 'Pending']);
  }
  AUDIT.unshift({time:stamp(), staff:'Chikondi Mwale', cat:'Status Change', record:id,
    detail:'Staff account created · ' + s.role, ip:'196.44.21.4', result:'Success'});
  el('addBadge').textContent = 'Created';
  el('createMsg').textContent = `${id} created · ${name}`;
  ['nsName','nsUser','nsEmail','nsPhone','nsIdNo'].forEach(i=>el(i).value='');
  renderAll();
  toast(`${name} added as ${s.role}`, 'ok');
}

/* ============================================================
   SECTION 4 · STAFF PROFILE MANAGEMENT
   ============================================================ */
function renderProfile(){
  const s = staffBy(S.profile) || STAFF[0];
  el('profSelect').innerHTML = STAFF.map(x=>`<option value="${x.id}" ${x.id===s.id?'selected':''}>${x.name} · ${x.role}</option>`).join('');
  const mods = PERM_MODULES.filter((m,i)=>((PERMS[s.role]||[])[i]||[0])[0]);
  const acts = AUDIT.filter(a=>a.staff===s.name).slice(0,5);
  const tasks = TASKS.filter(t=>t.staff===s.name);

  el('profileWrap').innerHTML = `
  <div class="card panel" style="margin-bottom:13px">
    <div style="display:flex;gap:14px;align-items:flex-start;flex-wrap:wrap">
      <div class="sav lg">${initials(s.name)}</div>
      <div style="flex:1;min-width:220px">
        <div style="font-size:18px;font-weight:800;letter-spacing:-.3px">${s.name}</div>
        <div class="tiny muted" style="margin-top:2px">${s.role} · ${s.dept} · ${s.branch}</div>
        <div style="display:flex;gap:7px;margin-top:8px;flex-wrap:wrap">
          ${statusChip(s)}
          <span class="chip st-proc">${s.id}</span>
          <span class="chip ${s.mfa?'st-ok':'st-await'}">${s.mfa?'MFA enabled':'MFA off'}</span>
          <span class="chip st-auth">${tasks.filter(t=>t.status!=='Completed').length} open tasks</span>
        </div>
      </div>
      <div style="text-align:right">
        <div class="tiny muted">Last login</div>
        <div style="font-size:12.5px;font-weight:700">${s.lastLogin}</div>
        <div class="tiny muted" style="margin-top:6px">Account created</div>
        <div style="font-size:12.5px;font-weight:700">${s.joined}</div>
      </div>
    </div>
  </div>
  <div class="grid g3">
    <div class="card panel">
      <div class="panel-head"><div><div class="panel-title">Personal Information</div>
        <div class="panel-sub">Identity on record</div></div></div>
      ${kv('Full name', s.name)}${kv('Date of birth', s.dob)}${kv('National ID', s.nid)}
      ${kv('Gender', '—')}${kv('Next of kin', 'On confidential file')}
    </div>
    <div class="card panel">
      <div class="panel-head"><div><div class="panel-title">Staff Identification</div>
        <div class="panel-sub">Payroll and HR references</div></div></div>
      ${kv('Staff ID', s.id)}${kv('Staff number', s.idno)}${kv('Payroll grade', 'G'+(3+ +s.id.slice(4)%5))}
      ${kv('Contract type', s.role==='Intern / Trainee' ? 'Internship' : 'Permanent')}${kv('Probation', 'Completed')}
    </div>
    <div class="card panel">
      <div class="panel-head"><div><div class="panel-title">Contact Information</div>
        <div class="panel-sub">How to reach this officer</div></div></div>
      ${kv('Phone', s.phone)}${kv('Email', s.email)}${kv('Address', s.address)}
      ${kv('Branch', s.branch)}${kv('Emergency contact', 'On confidential file')}
    </div>
    <div class="card panel">
      <div class="panel-head"><div><div class="panel-title">Employment Information</div>
        <div class="panel-sub">Position and reporting line</div></div></div>
      ${kv('Role', s.role)}${kv('Department', s.dept)}${kv('Branch', s.branch)}
      ${kv('Reporting manager', s.manager)}${kv('Joined', s.joined)}
    </div>
    <div class="card panel">
      <div class="panel-head"><div><div class="panel-title">Assigned Role &amp; Permissions</div>
        <div class="panel-sub">${permissionCount(s.role)} permissions</div></div></div>
      ${kv('Role', s.role)}${kv('Access level', (ROLES.find(r=>r.name===s.role)||{}).level||'—')}
      <div class="tiny muted" style="margin-top:8px">Modules</div>
      <div class="taglist">${mods.map(m=>`<span class="ptag">${m}</span>`).join('')||'<span class="tiny muted">None</span>'}</div>
      <div class="tiny muted" style="margin-top:8px">${(ROLES.find(r=>r.name===s.role)||{}).restrict||''}</div>
    </div>
    <div class="card panel">
      <div class="panel-head"><div><div class="panel-title">Account &amp; Session</div>
        <div class="panel-sub">Security state</div></div></div>
      ${kv('Account status', statusChip(s))}${kv('Created', s.joined)}${kv('Last login', s.lastLogin)}
      ${kv('Failed attempts', s.fails)}${kv('Active sessions', s.sessions)}
      ${kv('Multi-factor', s.mfa?'Enabled':'Disabled')}
    </div>
  </div>
  <div class="card panel" style="margin-top:13px">
    <div class="panel-head"><div><div class="panel-title">Staff Activity History</div>
      <div class="panel-sub">Latest actions by ${s.name}</div></div>
      <button class="btn btn-ghost btn-sm" data-act="open-audit" data-id="${s.id}">Full activity log</button></div>
    <div class="tblwrap" style="max-height:280px">
      <table class="tbl2"><thead><tr><th>Time</th><th>Activity</th><th>Record</th><th>Detail</th><th>Result</th></tr></thead>
        <tbody>${acts.length ? acts.map(a=>`<tr><td class="tiny muted">${a.time}</td><td class="tiny">${a.cat}</td>
          <td class="tiny muted">${a.record}</td><td class="tiny muted">${a.detail}</td>
          <td><span class="chip ${a.result==='Success'?'st-ok':'st-fail'}">${a.result}</span></td></tr>`).join('')
          : `<tr><td colspan="5"><div class="empty">No recorded activity for this staff member in the sample window.</div></td></tr>`}</tbody></table>
    </div>
  </div>`;
}
