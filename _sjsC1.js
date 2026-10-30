
/* ============================================================
   SECTION 5 · STAFF ROLES & DESIGNATIONS
   ============================================================ */
function renderRoles(){
  el('roleCount').textContent = ROLES.length + ' roles';
  el('roleGrid').innerHTML = ROLES.map((r,i)=>`
    <div class="rcard" data-act="edit-role" data-idx="${i}">
      <div class="rh"><div class="ric" style="background:${roleColor(r.name)}1A;color:${roleColor(r.name)}">◇</div>
        <div class="rn">${r.name}</div></div>
      <div class="rd">${r.desc}</div>
      <div class="rrow"><span>Level</span><b>${r.level}</b></div>
      <div class="rrow"><span>Staff assigned</span><b>${STAFF.filter(s=>s.role===r.name).length}</b></div>
      <div class="rrow"><span>Permissions</span><b>${permissionCount(r.name)}</b></div>
      <div class="rrow"><span>${r.code}</span><b>${r.custom?'Custom role':'Standard role'}</b></div>
    </div>`).join('');

  el('assignStaff').innerHTML = STAFF.map(s=>`<option value="${s.id}">${s.name} · ${s.role}</option>`).join('');
  el('assignRole').innerHTML = ROLES.map(r=>`<option>${r.name}</option>`).join('');

  el('roleRestrictions').innerHTML = ROLES.filter(r=>r.restrict).slice(0,7).map(r=>`
    <div class="setrow"><div><div class="sk">${r.name}</div><div class="ss">${r.restrict}</div></div>
      <div class="sv"><span class="chip ${r.custom?'st-proc':'st-canc'}">${r.custom?'Custom':'Standard'}</span></div></div>`).join('');
}

function editRole(i){
  const r = ROLES[i];
  openModal(i<0 ? 'Create custom staff role' : 'Edit role details', r ? `${r.code} · ${r.level}` : 'New designation', `
    <div class="form-grid">
      <div class="fg"><label>Role name</label><input id="erName" value="${r?r.name:''}" /></div>
      <div class="fg"><label>Role code</label><input id="erCode" value="${r?r.code:''}" /></div>
      <div class="fg"><label>Access level</label><select id="erLevel">${['System','Management','Credit','Finance','Operations','Governance']
        .map(l=>`<option ${r&&r.level===l?'selected':''}>${l}</option>`).join('')}</select></div>
      <div class="fg"><label>Type</label><select id="erCustom"><option value="0" ${r&&!r.custom?'selected':''}>Standard</option>
        <option value="1" ${r&&r.custom?'selected':''}>Custom</option></select></div>
      <div class="fg" style="grid-column:1/-1"><label>Description</label><input id="erDesc" value="${r?r.desc:''}" /></div>
      <div class="fg" style="grid-column:1/-1"><label>Role restriction</label><input id="erRestrict" value="${r?r.restrict:''}" /></div>
    </div>`,
    [{label:'Cancel', cls:'btn-ghost', act:'close'},
     {label: i<0?'Create role':'Save role', cls:'btn-gold', act:()=>{
        const name = el('erName').value.trim();
        if(!name) return toast('Role name is required','err');
        if(i<0){
          ROLES.push({name, code:el('erCode').value||'CSTM', level:el('erLevel').value,
            desc:el('erDesc').value, custom:el('erCustom').value==='1', restrict:el('erRestrict').value});
          PERMS[name] = PERM_MODULES.map(()=>[1,0,0,0]);
          toast(`Role “${name}” created`,'ok');
        } else {
          const old = r.name;
          Object.assign(r,{name, code:el('erCode').value, level:el('erLevel').value,
            desc:el('erDesc').value, custom:el('erCustom').value==='1', restrict:el('erRestrict').value});
          if(old!==name && PERMS[old]){ PERMS[name]=PERMS[old]; delete PERMS[old];
            STAFF.forEach(s=>{ if(s.role===old) s.role=name; }); }
          toast('Role updated','ok');
        }
        closeModal(); renderAll();
     }}]);
}

function assignRole(){
  const s = staffBy(el('assignStaff').value); if(!s) return;
  const role = el('assignRole').value, old = s.role;
  s.role = role;
  PERM_CHANGES.unshift([`${TODAY} ${stamp()}`, 'Chikondi Mwale', role, `${s.name} moved from ${old} to ${role}`, 'Super Admin']);
  AUDIT.unshift({time:stamp(), staff:'Chikondi Mwale', cat:'Permission Change', record:s.id,
    detail:`Role changed ${old} → ${role}`, ip:'196.44.21.4', result:'Success'});
  CM_HISTORY.unshift(['Role assignment updated', `Individual · ${s.name}`, TODAY+' '+stamp(), 'Delivered']);
  el('assignMsg').textContent = `${s.name} → ${role}`;
  renderAll(); toast(`${s.name} is now ${role}`, 'ok');
}

/* ============================================================
   SECTION 6 · PERMISSIONS & ACCESS CONTROL
   ============================================================ */
function renderPermissions(){
  const role = S.permRole;
  el('permRoleSel').innerHTML = ROLES.map(r=>`<option ${r.name===role?'selected':''}>${r.name}</option>`).join('');
  el('permSub').textContent = `${role} · ${permissionCount(role)} permissions`;
  const p = PERMS[role] || PERM_MODULES.map(()=>[0,0,0,0]);
  el('permBody').innerHTML = PERM_MODULES.map((m,i)=>`
    <tr><td>${m}</td>${[0,1,2,3].map(c=>
      `<td><input type="checkbox" data-perm="${i},${c}" ${p[i]&&p[i][c]?'checked':''} ${role==='Super Admin'?'disabled':''} /></td>`).join('')}</tr>`).join('');

  el('permSensitive').innerHTML = [
    ['Approve loans above MK 5,000,000','Requires a second approver'],
    ['Authorize disbursement releases','Approval-gated, dual control'],
    ['Reverse or adjust posted repayments','Audit reason mandatory'],
    ['Change loan terms or interest','System settings permission required'],
    ['Export financial data','Logged and rate-limited'],
    ['Delete financial records','Prohibited — archive only'],
    ['Edit staff roles and permissions','Administrator and above'],
    ['View customer identity documents','Confidential access logged']
  ].map(([t,s])=>`<div class="check"><div class="ck n">🔒</div><div><b>${t}</b><div class="tiny muted">${s}</div></div></div>`).join('');

  el('permChanges').innerHTML = PERM_CHANGES.slice(0,5).map(([t,who,role2,what,by])=>`
    <div class="li"><div class="sav purple">${initials(who)}</div>
      <div><div class="t1">${what}</div><div class="t2">${who} · ${role2} · ${t} · approved by ${by}</div></div></div>`).join('');
}

function savePermissions(){
  const rows = [...document.querySelectorAll('[data-perm]')];
  PERMS[S.permRole] = PERM_MODULES.map((_,i)=>[0,1,2,3].map(c=>{
    const cb = rows.find(r=>r.dataset.perm===`${i},${c}`);
    return cb && cb.checked ? 1 : 0;
  }));
  PERM_CHANGES.unshift([`${TODAY} ${stamp()}`, 'Chikondi Mwale', S.permRole, 'Permission matrix saved', 'Super Admin']);
  AUDIT.unshift({time:stamp(), staff:'Chikondi Mwale', cat:'Permission Change', record:S.permRole,
    detail:'Permission matrix updated', ip:'196.44.21.4', result:'Success'});
  renderAll(); toast(`Permissions saved for ${S.permRole}`, 'ok');
}

/* ============================================================
   SECTION 7 · ACCOUNT STATUS & SECURITY
   ============================================================ */
function renderStatus(){
  const active = STAFF.filter(s=>s.status==='Active').length;
  const inactive = STAFF.filter(s=>s.status==='Inactive').length;
  const susp = STAFF.filter(s=>s.status==='Suspended').length;
  const locked = STAFF.filter(s=>s.status==='Locked').length;
  el('statusCount').textContent = STAFF.length + ' accounts';
  const tiles = [
    ['Active accounts', active, 'Full access', '#157A50','var(--green-soft)','check'],
    ['Inactive accounts', inactive, 'Access disabled', '#5A6172','#F1F2F6','card'],
    ['Suspended', susp, 'Temporarily blocked', '#B32C2C','var(--red-soft)','alert'],
    ['Locked', locked, 'Failed sign-in lockout', '#8A6D0F','var(--amber-soft)','alert'],
    ['Failed attempts', STAFF.reduce((a,s)=>a+s.fails,0), 'Across all accounts', '#2456C4','var(--blue-soft)','doc']
  ];
  el('statusTiles').innerHTML = tiles.map(([l,v,s,c,bg,ic])=>`
    <div class="card stat">
      <div class="stat-top"><div class="stat-label">${l}</div>
        <div class="stat-ic" style="background:${bg};color:${c}">${ICONS[ic]}</div></div>
      <div class="stat-val">${v}</div><div class="stat-foot">${s}</div></div>`).join('');

  el('statusBody').innerHTML = STAFF.slice().sort((a,b)=>a.status.localeCompare(b.status)).map(s=>{
    const btns = {
      Active:'<button class="btn btn-ghost btn-sm" data-act="set-status" data-id="'+s.id+'" data-st="Suspended">Suspend</button>' +
             '<button class="btn btn-ghost btn-sm" data-act="set-status" data-id="'+s.id+'" data-st="Locked">Lock</button>',
      Inactive:'<button class="btn btn-green btn-sm" data-act="set-status" data-id="'+s.id+'" data-st="Active">Activate</button>',
      Suspended:'<button class="btn btn-green btn-sm" data-act="set-status" data-id="'+s.id+'" data-st="Active">Restore</button>',
      Locked:'<button class="btn btn-green btn-sm" data-act="set-status" data-id="'+s.id+'" data-st="Active">Unlock</button>',
      Pending:'<button class="btn btn-green btn-sm" data-act="set-status" data-id="'+s.id+'" data-st="Active">Activate</button>'
    }[s.status] || '';
    return `<tr>
      <td><div class="who"><div class="sav">${initials(s.name)}</div>
        <div><div class="nm">${s.name}</div><div class="id">${s.role}</div></div></div></td>
      <td>${statusChip(s)}</td>
      <td class="tiny muted">${s.lastLogin.replace(' 2026','')}</td>
      <td class="num" style="color:${s.fails>2?'#B32C2C':'#4A5160'};font-weight:${s.fails>2?'800':'600'}">${s.fails}</td>
      <td style="white-space:nowrap">${btns}
        <button class="btn btn-ghost btn-sm" data-act="force-reset" data-id="${s.id}">Reset</button>
        <button class="btn btn-ghost btn-sm" data-act="revoke-sessions" data-id="${s.id}">Sessions</button></td>
    </tr>`;
  }).join('');

  el('suspiciousList').innerHTML = [
    ['L. Chirwa','5 failed sign-ins · 41.87.112.8','30 Oct 06:58','Reviewed'],
    ['A. Jimu','6 failed sign-ins · account locked','28 Oct 19:22','Pending review'],
    ['K. Msiska','Sign-in attempt on suspended account','26 Oct 15:40','Pending review'],
    ['P. Kamoto','New device · Android · Lilongwe','27 Oct 07:12','Verified'],
    ['Unknown','Attempted sign-in with invalid username','25 Oct 22:14','Blocked']
  ].map(([who,what,when,st])=>`
    <div class="li"><div class="sav red">!</div>
      <div><div class="t1">${what}</div><div class="t2">${who} · ${when}</div></div>
      <div class="amt"><span class="chip ${st==='Pending review'?'st-await':st==='Blocked'?'st-fail':'st-ok'}">${st}</span></div></div>`).join('');

  el('statusLog').innerHTML = AUDIT.filter(a=>a.cat==='Status Change'||a.cat==='Permission Change').slice(0,6).map(a=>`
    <tr><td class="tiny muted">${a.time}</td><td class="tiny">${a.record}</td>
      <td class="tiny">${a.detail}</td><td class="tiny muted">${a.staff}</td></tr>`).join('');
}

function setStatus(id, st){
  const s = staffBy(id); if(!s) return;
  const old = s.status;
  s.status = st;
  s.sessions = st==='Active' ? 1 : 0;
  AUDIT.unshift({time:stamp(), staff:'Chikondi Mwale', cat:'Status Change', record:s.id,
    detail:`${old} → ${st}`, ip:'196.44.21.4', result:'Success'});
  CM_HISTORY.unshift([`Account ${st.toLowerCase()}`, `Individual · ${s.name}`, TODAY+' '+stamp(), 'Delivered']);
  renderAll();
  toast(`${s.name}: ${old} → ${st}`, st==='Active'?'ok':'info');
}

/* ============================================================
   SECTION 8 · PASSWORD & AUTHENTICATION
   ============================================================ */
function renderPassword(){
  el('pwStaff').innerHTML = STAFF.map(s=>`<option value="${s.id}">${s.name} · @${s.user}</option>`).join('');

  el('pwPolicy').innerHTML = [
    ['Minimum length','12 characters',true],
    ['Complexity','Upper, lower, number and symbol',true],
    ['Expiry','90 days',true],
    ['Reuse','Last 5 passwords blocked',true],
    ['Failed attempt limit','5 attempts, then 30 minute lockout',true],
    ['Session timeout','20 minutes idle',true],
    ['Multi-factor authentication','Required for administrators',true],
    ['Self-service reset','Email link, 30 minute expiry',true]
  ].map(([k,v])=>`<div class="kv"><span class="k">${k}</span><span class="v">${v}</span></div>`).join('');

  el('authEvents').innerHTML = [
    ['09:38','Chikondi Mwale','Password sign-in','Success'],
    ['09:20','Peter Kamoto','Password sign-in · MFA','Success'],
    ['09:12','Linda Chirwa','Password sign-in','Success'],
    ['07:35','Linda Chirwa','5 failed attempts','Blocked'],
    ['07:12','Peter Kamoto','New device challenge','Success'],
    ['06:58','Unknown','Invalid username','Blocked']
  ].map(([t,s,e,r])=>`<tr><td class="tiny muted">${t}</td><td class="tiny">${s}</td>
    <td class="tiny">${e}</td><td><span class="chip ${r==='Success'?'st-ok':'st-fail'}">${r}</span></td></tr>`).join('');

  el('sessionRules').innerHTML = [
    ['Idle timeout','20 minutes'],['Absolute session','8 hours'],
    ['Concurrent sessions','3 devices maximum'],['Failed attempts','5 then 30 minute lockout'],
    ['MFA requirement','Administrators and approvers'],['Remembered devices','30 days']
  ].map(([k,v])=>`<div class="kv"><span class="k">${k}</span><span class="v">${v}</span></div>`).join('');

  el('recoverySteps').innerHTML = [
    'Identity verified by an administrator (staff number and national ID).',
    'Administrator initiates the reset — the password is never shown or reused.',
    'A single-use link or temporary credential is issued, expiring in 30 minutes.',
    'Multi-factor device is re-enrolled if required.',
    'Reset event, actor and time are written to the authentication log.'
  ].map((t,i)=>`<div class="check"><div class="ck y">${i+1}</div><div><b>${t}</b></div></div>`).join('');
}

function applyPwAction(){
  const s = staffBy(el('pwStaff').value), act = el('pwAction').value;
  if(!s) return;
  if(act.includes('Revoke')){
    s.sessions = 0;
    AUDIT.unshift({time:stamp(), staff:'Chikondi Mwale', cat:'Status Change', record:s.id,
      detail:'All active sessions revoked', ip:'196.44.21.4', result:'Success'});
    toast(`Sessions revoked for ${s.name}`,'info');
  } else {
    s.fails = 0;
    if(s.status==='Locked') s.status='Active';
    AUDIT.unshift({time:stamp(), staff:'Chikondi Mwale', cat:'Status Change', record:s.id,
      detail:act, ip:'196.44.21.4', result:'Success'});
    toast(`${act} · ${s.name}`,'ok');
  }
  el('pwMsg').textContent = `${act} applied`;
  renderAll();
}
