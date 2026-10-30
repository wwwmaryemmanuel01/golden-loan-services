
/* ============================================================
   SECTION 13 · INVITATIONS & ONBOARDING
   ============================================================ */
function renderInvites(){
  el('invRole').innerHTML = ROLES.map(r=>`<option>${r.name}</option>`).join('');
  el('invDept').innerHTML = DEPTS.map(d=>`<option>${d.name}</option>`).join('');
  el('invBranch').innerHTML = BRANCHES.map(b=>`<option>${b.name}</option>`).join('');
  el('invCount').textContent = INVITES.filter(i=>i[6]==='Pending').length + ' pending';

  el('inviteList').innerHTML = INVITES.length ? INVITES.map((inv,i)=>`
    <div class="invite">
      <div class="sav ${inv[6]==='Expired'?'gray':'blue'}">${initials(inv[0])}</div>
      <div style="flex:1;min-width:0">
        <div class="it">${inv[0]}</div>
        <div class="is">${inv[2]} · ${inv[3]} · sent ${inv[4]} · expires ${inv[5]}</div>
      </div>
      <div style="display:flex;gap:6px;align-items:center">
        <span class="chip ${inv[6]==='Pending'?'st-await':'st-canc'}">${inv[6]}</span>
        <button class="btn btn-ghost btn-sm" data-act="resend-invite" data-idx="${i}">Resend</button>
        <button class="btn btn-ghost btn-sm" data-act="cancel-invite" data-idx="${i}">Cancel</button>
      </div>
    </div>`).join('') : '<div class="empty">No invitations outstanding.</div>';

  const pendingStaff = STAFF.filter(s=>s.status==='Pending');
  el('onboardList').innerHTML = pendingStaff.length ? pendingStaff.map(s=>`
    <div class="invite"><div class="sav purple">${initials(s.name)}</div>
      <div style="flex:1"><div class="it">${s.name}</div>
        <div class="is">${s.role} · invited ${s.joined} · registration incomplete</div></div>
      <button class="btn btn-gold btn-sm" data-act="complete-onboard" data-id="${s.id}">Complete</button>
    </div>`).join('')
    : '<div class="empty">Every invited staff member has completed registration.</div>';

  el('onboardHistory').innerHTML = ONBOARD_HISTORY.map(r=>`
    <tr><td class="tiny" style="font-weight:600">${r[0]}</td><td class="tiny muted">${r[1]}</td>
      <td class="tiny muted">${r[2]}</td><td class="tiny">${r[3]}</td><td class="tiny muted">${r[4]}</td>
      <td class="tiny muted">${r[5]}</td>
      <td><span class="chip ${r[6]==='Complete'?'st-ok':r[6]==='Awaiting registration'?'st-await':'st-canc'}">${r[6]}</span></td></tr>`).join('');
}

function sendInvite(){
  const name = el('invName').value.trim(), email = el('invEmail').value.trim();
  if(!name || !email) return toast('Name and email are required','err');
  INVITES.unshift([name, email, el('invRole').value, el('invDept').value, TODAY, '6 Nov 2026', 'Pending']);
  ONBOARD_HISTORY.unshift([name, TODAY, '—', el('invRole').value, el('invPerms').value, '—', 'Awaiting registration']);
  AUDIT.unshift({time:stamp(), staff:'Chikondi Mwale', cat:'Status Change', record:email,
    detail:'Staff invitation sent', ip:'196.44.21.4', result:'Success'});
  el('invName').value=''; el('invEmail').value='';
  el('invMsg').textContent = `Invitation sent to ${email}`;
  renderAll(); toast(`Invitation sent to ${name}`,'ok');
}

/* ============================================================
   SECTION 14 · STAFF COMMUNICATION
   ============================================================ */
function renderComms(){
  const aud = S.staffAud;
  const opts = aud==='Individual' ? STAFF.map(s=>s.name)
    : aud==='Role' ? ROLES.map(r=>r.name)
    : aud==='Department' ? DEPTS.map(d=>d.name)
    : aud==='Security' ? ['All staff','Administrators only','Branch managers']
    : ['All staff','Collections team','Credit team'];
  el('cmRecipient').innerHTML = opts.map(o=>`<option>${o}</option>`).join('');

  el('cmHistory').innerHTML = CM_HISTORY.map(([t,to,when,st])=>`
    <div class="li"><div class="sav ${st==='Delivered'?'blue':'green'}">✉</div>
      <div><div class="t1">${t}</div><div class="t2">${to} · ${when}</div></div>
      <div class="amt"><span class="chip ${st==='Delivered'||st==='Read'?'st-ok':'st-fail'}">${st}</span></div></div>`).join('');

  el('cmStatus').innerHTML = CM_STATUS.map(([c,s,d,f])=>`
    <tr><td class="tiny" style="font-weight:600">${c}</td><td class="num">${s}</td>
      <td class="num">${d}</td><td class="num" style="color:${f?'#B32C2C':'#157A50'}">${f}</td></tr>`).join('');
}

function sendStaffNotification(){
  const subj = el('cmSubject').value.trim(), body = el('cmBody').value.trim();
  if(!subj || !body) return toast('Subject and message are required','err');
  CM_HISTORY.unshift([subj, `${S.staffAud} · ${el('cmRecipient').value}`, TODAY+' '+stamp(), 'Delivered']);
  AUDIT.unshift({time:stamp(), staff:'Chikondi Mwale', cat:'Notification', record:S.staffAud,
    detail:'Staff notification: ' + subj, ip:'196.44.21.4', result:'Success'});
  el('cmSubject').value=''; el('cmBody').value='';
  el('cmMsg').textContent = 'Notification delivered';
  renderAll(); toast('Staff notification sent','ok');
}

/* ============================================================
   SECTION 15 · DOCUMENTS & EMPLOYMENT RECORDS
   ============================================================ */
function renderDocs(){
  const f = el('docFilter').value;
  const rows = DOCS.filter(d=>!f || d.type===f);
  el('docCount').textContent = DOCS.length + ' documents';
  el('docBody').innerHTML = rows.length ? rows.map((d,i)=>`
    <tr>
      <td class="tiny" style="font-weight:600">${d.name}</td>
      <td class="tiny">${d.staff}</td>
      <td class="tiny muted">${d.type}</td>
      <td class="tiny muted">${d.uploaded}</td>
      <td class="tiny muted">${d.expiry}</td>
      <td><span class="chip ${d.access==='Restricted'?'st-fail':'st-ok'}">${d.access==='Restricted'?'🔒 Restricted':'Standard'}</span></td>
      <td style="white-space:nowrap">
        <button class="btn btn-ghost btn-sm" data-act="view-doc" data-idx="${i}">View</button>
        <button class="btn btn-ghost btn-sm" data-act="upload-doc" data-idx="${i}">Replace</button>
      </td></tr>`).join('')
    : `<tr><td colspan="7"><div class="empty">No documents of this type.</div></td></tr>`;

  el('docExpiry').innerHTML = [
    ['Practising certificate · A. Mbewe','Expires 31 Dec 2026','standard'],
    ['Collections certification · S. Zimba','Expires 31 Jan 2027','standard'],
    ['Driving licence · I. Mponda','Expires 14 Mar 2027','standard'],
    ['Medical cover · G. Mtemang\'ombe','Expires 30 Jun 2027','standard']
  ].map(([t,s])=>`<div class="li"><div class="sav">⏳</div>
    <div><div class="t1">${t}</div><div class="t2">${s}</div></div></div>`).join('')
    + `<div class="locked" style="margin-top:9px">Reminders are sent to the staff member and HR 30 days before expiry.</div>`;

  el('docHistory').innerHTML = [
    ['Role assignment record uploaded','K. Msiska · by L. Chirwa','28 Oct 2026 11:20'],
    ['View of confidential ID document','T. Nkhoma · by L. Chirwa','27 Oct 2026 15:02'],
    ['Training certificate uploaded','M. Nkhoma · by M. Chatsika','14 Sep 2026 09:10'],
    ['Employment contract replaced','B. Tembo · by M. Chatsika','02 Sep 2026 14:44']
  ].map(([t,s])=>`<div class="li"><div class="sav blue">📄</div>
    <div><div class="t1">${t}</div><div class="t2">${s}</div></div></div>`).join('');
}

function uploadDocModal(idx){
  const d = idx>=0 ? DOCS[idx] : null;
  openModal(d ? 'Replace document' : 'Upload document', d ? d.name : 'New employment record', `
    <div class="form-grid">
      <div class="fg"><label>Document type</label><select id="udType">${['Identification','Employment','Appointment letter',
        'Role assignment','Training / certification'].map(t=>`<option ${d&&d.type===t?'selected':''}>${t}</option>`).join('')}</select></div>
      <div class="fg"><label>Staff member</label><select id="udStaff">${STAFF.map(s=>`<option ${d&&d.staff===s.name?'selected':''}>${s.name}</option>`).join('')}</select></div>
      <div class="fg"><label>Document name</label><input id="udName" value="${d?d.name:''}" placeholder="e.g. Appointment letter" /></div>
      <div class="fg"><label>Expiry date</label><input id="udExpiry" value="${d&&d.expiry!=='—'?d.expiry:''}" placeholder="— or 31 Dec 2027" /></div>
      <div class="fg" style="grid-column:1/-1"><label>Access</label><select id="udAccess">
        <option ${d&&d.access==='Restricted'?'selected':''}>Restricted</option>
        <option ${d&&d.access==='Standard'?'selected':''}>Standard</option></select>
        <div class="hint">Restricted documents are visible to HR and compliance only — every view is logged.</div></div>
    </div>`,
    [{label:'Cancel', cls:'btn-ghost', act:'close'},
     {label:'Save record', cls:'btn-gold', act:()=>{
        const rec = {name:el('udName').value.trim()||'Untitled document', staff:el('udStaff').value,
          type:el('udType').value, uploaded:TODAY, expiry:el('udExpiry').value||'—', access:el('udAccess').value};
        if(idx>=0) DOCS[idx]=rec; else DOCS.unshift(rec);
        closeModal(); renderAll(); toast('Document record saved','ok');
     }}]);
}

/* ============================================================
   SECTION 16 · STAFF MANAGEMENT REPORTS
   ============================================================ */
const REPORTS = [
  ['Staff Directory Report','All staff with role, department and branch'],
  ['Active and Inactive Staff Report','Account status breakdown'],
  ['Staff by Role Report','Headcount per designation'],
  ['Staff by Department or Branch','Distribution across units'],
  ['Staff Login Activity Report','Sign-ins, failures and lockouts'],
  ['Staff Permissions Report','Effective permissions per role'],
  ['Staff Performance Report','Output and productivity metrics'],
  ['Workload and Assignment Report','Open tasks per officer'],
  ['Suspended Accounts Report','Suspended, locked and inactive accounts'],
  ['Staff Security Report','Alerts, resets and permission changes']
];
function renderReports(){
  el('reportCards').innerHTML = REPORTS.map(([t,s])=>`
    <div class="card panel" style="padding:13px">
      <div class="panel-title" style="font-size:12.5px">${t}</div>
      <div class="panel-sub" style="min-height:30px">${s}</div>
      <div style="display:flex;gap:6px;margin-top:6px">
        <button class="btn btn-ghost btn-sm" data-act="report-pdf" data-ref="${t}">PDF</button>
        <button class="btn btn-ghost btn-sm" data-act="report-xls" data-ref="${t}">Excel</button>
        <button class="btn btn-ghost btn-sm" data-act="report-csv" data-ref="${t}">CSV</button>
      </div>
    </div>`).join('');
}
