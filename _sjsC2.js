
/* ============================================================
   SECTION 9 · ASSIGNMENTS & WORKLOAD
   ============================================================ */
function renderAssignments(){
  const open = TASKS.filter(t=>t.status==='Pending').length;
  const prog = TASKS.filter(t=>t.status==='In Progress').length;
  const over = TASKS.filter(t=>t.status==='Overdue').length;
  const done = TASKS.filter(t=>t.status==='Completed').length;
  el('taskCount').textContent = (open+prog+over) + ' open';

  const tiles = [
    ['Pending tasks', open, 'Not started', '#8A6D0F','var(--amber-soft)','card'],
    ['In progress', prog, 'Being worked', '#2456C4','var(--blue-soft)','doc'],
    ['Overdue', over, 'Past the due date', '#B32C2C','var(--red-soft)','alert'],
    ['Completed', done, 'Closed this week', '#157A50','var(--green-soft)','check'],
    ['Reassignments', ASSIGN_HISTORY.filter(h=>/Reassigned/.test(h[2])).length, 'Last 7 days', '#5A3FCB','var(--purple-soft)','users']
  ];
  el('taskTiles').innerHTML = tiles.map(([l,v,s,c,bg,ic])=>`
    <div class="card stat">
      <div class="stat-top"><div class="stat-label">${l}</div>
        <div class="stat-ic" style="background:${bg};color:${c}">${ICONS[ic]}</div></div>
      <div class="stat-val">${v}</div><div class="stat-foot">${s}</div></div>`).join('');

  const filter = el('taskFilter').value;
  const rows = TASKS.filter(t=>!filter || t.status===filter);
  el('taskBody').innerHTML = rows.length ? rows.map(t=>`
    <tr>
      <td class="tiny" style="font-weight:700">${t.ref}</td>
      <td class="msg"><div class="tiny" style="font-weight:600">${t.title}</div>
        <div class="tiny muted">${t.type}</div></td>
      <td class="tiny">${t.staff}</td>
      <td><span class="chip ${t.priority==='High'?'st-fail':t.priority==='Low'?'st-canc':'st-auth'}">${t.priority}</span></td>
      <td class="tiny muted">${t.due.replace(' 2026','')}</td>
      <td><span class="chip ${t.status==='Completed'?'st-ok':t.status==='Overdue'?'st-fail':t.status==='In Progress'?'st-proc':'st-await'}">${t.status}</span></td>
      <td style="white-space:nowrap">
        ${t.status!=='Completed' ? `<button class="btn btn-ghost btn-sm" data-act="complete-task" data-ref="${t.ref}">Complete</button>` : ''}
        <button class="btn btn-ghost btn-sm" data-act="reassign-task" data-ref="${t.ref}">Reassign</button>
      </td></tr>`).join('')
    : `<tr><td colspan="7"><div class="empty">No tasks in this state.</div></td></tr>`;

  const byStaff = {};
  TASKS.filter(t=>t.status!=='Completed').forEach(t=>{ byStaff[t.staff]=(byStaff[t.staff]||0)+1; });
  mkHBars(el('workload'), Object.entries(byStaff).sort((a,b)=>b[1]-a[1]).map(([n,v])=>({
    label:n, value:v, color: v>2 ? '#D93F3F' : v>1 ? '#E08C1E' : '#1E9E6A'
  })));

  el('assignHistory').innerHTML = ASSIGN_HISTORY.map(([t,ref,what,by])=>`
    <div class="li"><div class="sav blue">⇄</div>
      <div><div class="t1">${what}</div><div class="t2">${ref} · ${t} · ${by}</div></div></div>`).join('');
}

function completeTask(ref){
  const t = TASKS.find(x=>x.ref===ref); if(!t) return;
  t.status = 'Completed';
  ASSIGN_HISTORY.unshift([`${TODAY} ${stamp()}`, ref, `Completed by ${t.staff}`, 'System']);
  AUDIT.unshift({time:stamp(), staff:t.staff, cat:'Assignment', record:ref, detail:'Task completed',
    ip:'196.44.21.14', result:'Success'});
  renderAll(); toast(`${ref} completed`, 'ok');
}

function reassignTask(ref){
  const t = TASKS.find(x=>x.ref===ref); if(!t) return;
  openModal('Reassign task', `${ref} · ${t.title}`, `
    <div class="form-grid">
      <div class="fg" style="grid-column:1/-1"><label>Assign to</label>
        <select id="raStaff">${STAFF.filter(s=>s.status==='Active').map(s=>`<option ${s.name===t.staff?'selected':''}>${s.name} · ${s.role}</option>`).join('')}</select></div>
      <div class="fg"><label>Priority</label><select id="raPriority">${['Low','Normal','High']
        .map(p=>`<option ${p===t.priority?'selected':''}>${p}</option>`).join('')}</select></div>
      <div class="fg"><label>Due date</label><input id="raDue" value="${t.due}" /></div>
      <div class="fg" style="grid-column:1/-1"><label>Note</label><input id="raNote" placeholder="Reason for reassignment" /></div>
    </div>`,
    [{label:'Cancel', cls:'btn-ghost', act:'close'},
     {label:'Reassign', cls:'btn-gold', act:()=>{
        const next = el('raStaff').value.split(' · ')[0];
        ASSIGN_HISTORY.unshift([`${TODAY} ${stamp()}`, ref, `Reassigned to ${next}`, 'C. Mwale']);
        t.staff = next; t.priority = el('raPriority').value; t.due = el('raDue').value;
        if(t.status==='Overdue') t.status = 'Pending';
        AUDIT.unshift({time:stamp(), staff:'Chikondi Mwale', cat:'Assignment', record:ref,
          detail:'Reassigned to ' + next, ip:'196.44.21.4', result:'Success'});
        CM_HISTORY.unshift(['New task assignment', `Individual · ${next}`, TODAY+' '+stamp(), 'Delivered']);
        closeModal(); renderAll(); toast(`${ref} reassigned to ${next}`, 'ok');
     }}]);
}

function openAssignModal(){
  openModal('Assign task', 'Route work to an officer', `
    <div class="form-grid">
      <div class="fg"><label>Task type</label><select id="naType">
        <option>Loan Application</option><option>Customer Account</option><option>Collection Case</option>
        <option>Repayment Verification</option><option>Disbursement</option><option>Support Case</option></select></div>
      <div class="fg"><label>Priority</label><select id="naPriority"><option>Normal</option><option>High</option><option>Low</option></select></div>
      <div class="fg" style="grid-column:1/-1"><label>Title / reference</label><input id="naTitle" placeholder="e.g. Review LN-2026-1851" /></div>
      <div class="fg"><label>Assign to</label><select id="naStaff">${STAFF.filter(s=>s.status==='Active')
        .map(s=>`<option>${s.name}</option>`).join('')}</select></div>
      <div class="fg"><label>Due date</label><input id="naDue" value="2 Nov 2026" /></div>
    </div>`,
    [{label:'Cancel', cls:'btn-ghost', act:'close'},
     {label:'Assign task', cls:'btn-gold', act:()=>{
        const title = el('naTitle').value.trim() || 'Unnamed task';
        const ref = 'TSK-' + (1117 + TASKS.length-16);
        TASKS.unshift({ref, type:el('naType').value, title, staff:el('naStaff').value,
          priority:el('naPriority').value, due:el('naDue').value, status:'Pending', created:TODAY});
        ASSIGN_HISTORY.unshift([`${TODAY} ${stamp()}`, ref, `Assigned to ${el('naStaff').value}`, 'C. Mwale']);
        closeModal(); renderAll(); toast(`Task ${ref} assigned`, 'ok');
     }}]);
}

/* ============================================================
   SECTION 10 · PERFORMANCE & PRODUCTIVITY
   ============================================================ */
function renderPerformance(){
  const f = PERF_SCALE[S.perfPeriod] || 1;
  const staffPerf = STAFF.map(s=>{
    const p = PERF[s.id] || [0,0,0,0,0,0,0,0,0];
    return {s, rev:Math.round(p[0]*f), dec:Math.round(p[1]*f), loans:Math.round(p[2]*f),
      disb:Math.round(p[3]*f), rep:Math.round(p[4]*f), coll:Math.round(p[5]*f),
      cases:Math.round(p[6]*f), open:TASKS.filter(t=>t.staff===s.name && t.status!=='Completed').length,
      hrs:p[8]};
  });
  const sum = k => staffPerf.reduce((a,x)=>a+x[k],0);

  const periodLabel = {Month:'This month', Quarter:'This quarter', Year:'This year'}[S.perfPeriod];
  el('perfPeriodBadge').textContent = periodLabel;
  if(el('perfPeriodBadge2')) el('perfPeriodBadge2').textContent = periodLabel;
  const tiles = [
    ['Applications Reviewed', sum('rev'), 'Credit pipeline', '#2456C4','var(--blue-soft)','doc'],
    ['Approved / Rejected', sum('dec'), 'Committee decisions', '#8A6D0F','var(--amber-soft)','check'],
    ['Loans Processed', sum('loans'), 'Moved to active', '#157A50','var(--green-soft)','check'],
    ['Disbursements', sum('disb'), 'Authorized releases', '#5A3FCB','var(--purple-soft)','card'],
    ['Repayments Verified', sum('rep'), 'Posted and confirmed', '#157A50','var(--green-soft)','check']
  ];
  el('perfTiles').innerHTML = tiles.map(([l,v,s,c,bg,ic])=>`
    <div class="card stat">
      <div class="stat-top"><div class="stat-label">${l}</div>
        <div class="stat-ic" style="background:${bg};color:${c}">${ICONS[ic]}</div></div>
      <div class="stat-val">${nf(v)}</div><div class="stat-foot">${s}</div></div>`).join('');

  el('perfBody').innerHTML = staffPerf.filter(x=>x.rev||x.dec||x.loans||x.disb||x.rep||x.coll||x.cases)
    .sort((a,b)=>(b.rev+b.disb+b.rep+b.coll+b.cases)-(a.rev+a.disb+a.rep+a.coll+a.cases))
    .map(x=>`<tr>
      <td class="tiny" style="font-weight:600;white-space:nowrap">${x.s.name}</td>
      <td class="num">${x.rev}</td><td class="num">${x.dec}</td><td class="num">${x.loans}</td>
      <td class="num">${x.disb}</td><td class="num">${x.rep}</td><td class="num">${x.coll}</td>
      <td class="num">${x.cases}</td>
      <td class="num" style="color:${x.open>1?'#B32C2C':'#4A5160'};font-weight:700">${x.open}</td>
      <td class="num">${x.hrs ? x.hrs.toFixed(1) : '—'}</td></tr>`).join('');

  mkHBars(el('perfTimes'), [
    {label:'Application review', value:11.4, color:'#2F6FED', display:'11.4 h'},
    {label:'Approval decision', value:18.2, color:'#C9A227', display:'18.2 h'},
    {label:'Repayment check', value:5.9, color:'#1E9E6A', display:'5.9 h'},
    {label:'Disbursement', value:7.6, color:'#7C5CF0', display:'7.6 h'},
    {label:'Support case', value:6.1, color:'#E08C1E', display:'6.1 h'},
    {label:'Collection follow-up', value:22.6, color:'#D93F3F', display:'22.6 h'}
  ], {max:26});

  mkHBars(el('perfCollection'), Object.entries(COLLECTION_RATE).map(([id,v])=>({
    label:(staffBy(id)||{}).name||id, value:v, color: v>80?'#1E9E6A':v>70?'#C9A227':'#D93F3F', display:v+'%'
  })), {max:100});
}

/* ============================================================
   SECTION 11 · ACTIVITY & AUDIT LOGS
   ============================================================ */
function auditFiltered(){
  const q = (el('audSearch').value||'').toLowerCase();
  const cat = el('audCat').value, who = el('audStaff').value;
  return AUDIT.filter(a=>{
    if(q && !(a.staff+a.record+a.detail+a.cat).toLowerCase().includes(q)) return false;
    if(cat && a.cat!==cat) return false;
    if(who && a.staff!==who) return false;
    return true;
  });
}
function renderAudit(){
  const rows = auditFiltered();
  const pages = Math.max(1, Math.ceil(rows.length/S.auditSize));
  if(S.auditPage>pages) S.auditPage = pages;
  const slice = rows.slice((S.auditPage-1)*S.auditSize, S.auditPage*S.auditSize);
  el('audBody').innerHTML = slice.length ? slice.map(a=>`
    <tr><td class="tiny muted" style="white-space:nowrap">${a.time}</td>
      <td class="tiny" style="font-weight:600;white-space:nowrap">${a.staff}</td>
      <td class="tiny">${a.cat}</td>
      <td class="tiny muted">${a.record}</td>
      <td class="tiny muted" style="max-width:250px">${a.detail}</td>
      <td class="tiny muted">${a.ip}</td>
      <td><span class="chip ${a.result==='Success'?'st-ok':'st-fail'}">${a.result}</span></td></tr>`).join('')
    : `<tr><td colspan="7"><div class="empty">No activity matches these filters.</div></td></tr>`;
  el('audPager').innerHTML = `
    <span>${rows.length} entries · page ${S.auditPage} of ${pages}</span>
    <button data-act="aud-prev" ${S.auditPage<=1?'disabled':''}>Prev</button>
    <button data-act="aud-next" ${S.auditPage>=pages?'disabled':''}>Next</button>`;
}

/* ============================================================
   SECTION 12 · DEPARTMENTS & BRANCHES
   ============================================================ */
function renderUnits(){
  el('deptCount').textContent = DEPTS.length;
  el('branchCount').textContent = BRANCHES.length;

  el('deptBody').innerHTML = DEPTS.map((d,i)=>`
    <tr><td class="tiny" style="font-weight:600">${d.name}<div class="muted">${d.code}</div></td>
      <td class="tiny">${d.head}</td>
      <td class="num">${STAFF.filter(s=>s.dept===d.name).length}</td>
      <td class="tiny muted">${d.branch}</td>
      <td><button class="btn btn-ghost btn-sm" data-act="edit-dept" data-idx="${i}">Edit</button></td></tr>`).join('');

  el('branchBody').innerHTML = BRANCHES.map((b,i)=>`
    <tr><td class="tiny" style="font-weight:600">${b.name}<div class="muted">${b.region}</div></td>
      <td class="tiny">${b.code}</td>
      <td class="tiny">${b.manager}</td>
      <td class="num">${STAFF.filter(s=>s.branch===b.name).length}</td>
      <td><button class="btn btn-ghost btn-sm" data-act="edit-branch" data-idx="${i}">Edit</button></td></tr>`).join('');

  mkHBars(el('unitChart'), [
    ...DEPTS.map(d=>({label:d.name, value:STAFF.filter(s=>s.dept===d.name).length, color:'#C9A227'})),
    ...BRANCHES.map(b=>({label:b.name, value:STAFF.filter(s=>s.branch===b.name).length, color:'#2F6FED'}))
  ]);

  el('unitReports').innerHTML = [
    ['Department headcount report','Staff per department with managers'],
    ['Branch headcount report','Staff per branch with regions'],
    ['Managerial assignments','Department and branch managers'],
    ['Role distribution by unit','Roles held in each unit']
  ].map(([t,s])=>`<div class="setrow"><div><div class="sk">${t}</div><div class="ss">${s}</div></div>
    <div class="sv"><button class="btn btn-ghost btn-sm" data-act="unit-report" data-ref="${t}">Generate</button></div></div>`).join('');
}

function editDept(i){
  const d = i<0 ? {name:'',head:'',branch:BRANCHES[0].name,code:''} : DEPTS[i];
  openModal(i<0 ? 'Create department' : 'Edit department', d.code||'New unit', `
    <div class="form-grid">
      <div class="fg"><label>Department name</label><input id="edName" value="${d.name}" /></div>
      <div class="fg"><label>Code</label><input id="edCode" value="${d.code}" /></div>
      <div class="fg"><label>Department manager</label><select id="edHead">${STAFF.map(s=>`<option ${s.name===d.head?'selected':''}>${s.name}</option>`).join('')}</select></div>
      <div class="fg"><label>Primary branch</label><select id="edBranch">${BRANCHES.map(b=>`<option ${b.name===d.branch?'selected':''}>${b.name}</option>`).join('')}</select></div>
    </div>`,
    [{label:'Cancel', cls:'btn-ghost', act:'close'},
     {label:'Save', cls:'btn-gold', act:()=>{
        const rec = {name:el('edName').value.trim()||'Untitled', code:el('edCode').value||'NEW',
          head:el('edHead').value, branch:el('edBranch').value};
        if(i<0) DEPTS.push(rec); else DEPTS[i]=rec;
        closeModal(); renderAll(); toast('Department saved','ok');
     }}]);
}
function editBranch(i){
  const b = i<0 ? {name:'',code:'',manager:STAFF[0].name,region:'Central'} : BRANCHES[i];
  openModal(i<0 ? 'Create branch' : 'Edit branch', b.code||'New unit', `
    <div class="form-grid">
      <div class="fg"><label>Branch name</label><input id="ebName" value="${b.name}" /></div>
      <div class="fg"><label>Branch code</label><input id="ebCode" value="${b.code}" /></div>
      <div class="fg"><label>Branch manager</label><select id="ebManager">${STAFF.map(s=>`<option ${s.name===b.manager?'selected':''}>${s.name}</option>`).join('')}</select></div>
      <div class="fg"><label>Region</label><select id="ebRegion">${['Central','Northern','Southern']
        .map(r=>`<option ${r===b.region?'selected':''}>${r}</option>`).join('')}</select></div>
    </div>`,
    [{label:'Cancel', cls:'btn-ghost', act:'close'},
     {label:'Save', cls:'btn-gold', act:()=>{
        const rec = {name:el('ebName').value.trim()||'Untitled', code:el('ebCode').value||'NEW',
          manager:el('ebManager').value, region:el('ebRegion').value};
        if(i<0) BRANCHES.push(rec); else BRANCHES[i]=rec;
        closeModal(); renderAll(); toast('Branch saved','ok');
     }}]);
}
