<script>
/* ============================================================
   GOLDEN FINANCIAL SERVICES · STAFF MANAGEMENT MODULE
   ============================================================ */
const el = id => document.getElementById(id);
const nf = n => Math.round(n).toLocaleString('en-US');
const mk = n => 'MK ' + nf(n);
const initials = s => String(s).split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase();
const stamp = () => new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});
const TODAY = '30 Oct 2026';

function toast(msg, type='ok'){
  const t=document.createElement('div');
  t.className='toast '+type;
  t.innerHTML=`<span>${type==='err'?'⚠':type==='info'?'ℹ':'✓'}</span><div>${msg}</div>`;
  el('toasts').appendChild(t);
  setTimeout(()=>{t.style.opacity='0';t.style.transform='translateX(16px)';t.style.transition='.25s';},2600);
  setTimeout(()=>t.remove(),3000);
}

/* ---------- chart helpers (same visual language as the dashboard) ---------- */
function niceMax(v){
  if(v<=0) return 10;
  const p=Math.pow(10,Math.floor(Math.log10(v)));
  for(const s of [1,1.2,1.5,2,2.5,3,4,5,6,8,10]) if(v<=s*p) return s*p;
  return 10*p;
}
function mkChart(host,o){
  if(!host) return;
  const type=o.type||'line', labels=o.labels||[], series=o.series||[];
  const W=640,H=o.height||210,L=o.suffix?48:38,R=12,T=12,B=26, iw=W-L-R, ih=H-T-B;
  const yMax=o.yMax||niceMax(Math.max(0,...series.flatMap(s=>s.data)));
  const step=iw/Math.max(labels.length,1);
  let g='';
  for(let i=0;i<=4;i++){
    const v=yMax/4*i, y=T+ih-(v/yMax)*ih;
    g+=`<line x1="${L}" y1="${y.toFixed(1)}" x2="${W-R}" y2="${y.toFixed(1)}" stroke="#EEF0F4"/>`;
    const t=Number.isInteger(v)?v:v.toFixed(1);
    g+=`<text x="${L-7}" y="${(y+3.2).toFixed(1)}" text-anchor="end" font-size="9" fill="#9AA0AC" font-family="inherit">${t}${o.suffix||''}</text>`;
  }
  labels.forEach((lb,i)=>{
    if(labels.length>12 && i%2) return;
    g+=`<text x="${(L+step*i+step/2).toFixed(1)}" y="${H-8}" text-anchor="middle" font-size="9" fill="#8A90A0" font-weight="600" font-family="inherit">${lb}</text>`;
  });
  if(type==='bar'){
    const n=series.length, groupW=step*0.6, bw=Math.max(3,groupW/n-(n>1?2:0));
    labels.forEach((lb,i)=>{
      const gx=L+step*i+(step-groupW)/2;
      series.forEach((s,j)=>{
        const v=s.data[i]||0, h=(v/yMax)*ih;
        if(h<0.6) return;
        const x=gx+j*(bw+2), y=T+ih-h, r=Math.min(3,bw/2,h/2);
        g+=`<path d="M${x.toFixed(1)} ${(y+r).toFixed(1)} q0 ${-r} ${r} ${-r} h${(bw-2*r).toFixed(1)} q${r} 0 ${r} ${r} v${(h-r).toFixed(1)} h${-bw.toFixed(1)} Z" fill="${s.color}"><title>${lb} · ${s.name}: ${v}</title></path>`;
      });
    });
  } else {
    series.forEach(s=>{
      const pts=s.data.map((v,i)=>[L+step*i+step/2,T+ih-(v/yMax)*ih]);
      const d=pts.map((q,i)=>(i?'L':'M')+q[0].toFixed(1)+' '+q[1].toFixed(1)).join(' ');
      const gid='g'+Math.random().toString(36).slice(2,8);
      g+=`<defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${s.color}" stop-opacity=".2"/><stop offset="100%" stop-color="${s.color}" stop-opacity="0"/></linearGradient></defs>
        <path d="${d} L${pts[pts.length-1][0].toFixed(1)} ${T+ih} L${pts[0][0].toFixed(1)} ${T+ih} Z" fill="url(#${gid})"/>
        <path d="${d}" fill="none" stroke="${s.color}" stroke-width="2.1" stroke-linejoin="round"/>`;
      pts.forEach((q,i)=>{g+=`<circle cx="${q[0].toFixed(1)}" cy="${q[1].toFixed(1)}" r="2.3" fill="#fff" stroke="${s.color}" stroke-width="1.7"><title>${labels[i]}: ${s.data[i]}</title></circle>`;});
    });
  }
  host.setAttribute('viewBox',`0 0 ${W} ${H}`);
  host.innerHTML=g;
}
function mkHBars(host, rows, opt={}){
  if(!host) return;
  const max=opt.max || Math.max(...rows.map(r=>r.value))||1;
  host.innerHTML=rows.map(r=>`<div class="hbar-row">
    <div class="hbar-l">${r.label}</div>
    <div class="hbar-t"><i style="width:${Math.max(2,(r.value/max)*100)}%;background:${r.color||'#C9A227'}"></i></div>
    <div class="hbar-v">${r.display||nf(r.value)}</div></div>`).join('');
}
function mkDonut(host, data, opt={}){
  if(!host) return;
  const total=data.reduce((s,d)=>s+d.value,0)||1;
  const size=opt.size||150,c=size/2,r=size*0.335,sw=opt.ring||15,C=2*Math.PI*r,GAP=2.5;
  let off=0,arcs='';
  data.forEach(d=>{
    const len=(d.value/total)*C, dash=Math.max(len-GAP,0.6);
    arcs+=`<circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="${d.color}" stroke-width="${sw}"
      stroke-dasharray="${dash.toFixed(2)} ${(C-dash).toFixed(2)}" stroke-dashoffset="${(-off).toFixed(2)}"
      transform="rotate(-90 ${c} ${c})"><title>${d.label}: ${nf(d.value)}</title></circle>`;
    off+=len;
  });
  host.innerHTML=`<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="#F1F2F6" stroke-width="${sw}"/>${arcs}
    <text x="${c}" y="${c-1}" text-anchor="middle" font-size="${(size*0.122).toFixed(1)}" font-weight="800" fill="#0F1115" font-family="inherit">${opt.center||nf(total)}</text>
    <text x="${c}" y="${c+13}" text-anchor="middle" font-size="${(size*0.056).toFixed(1)}" font-weight="700" fill="#8A90A0" letter-spacing=".8" font-family="inherit">${opt.caption||'TOTAL'}</text></svg>`;
}

/* ============================================================
   DATA
   ============================================================ */
const DEPTS = [
  {name:'Executive', head:'Chikondi Mwale', branch:'Lilongwe City', code:'EXE'},
  {name:'Credit', head:'Thoko Phiri', branch:'Lilongwe City', code:'CRD'},
  {name:'Finance', head:'Agnes Mbewe', branch:'Lilongwe City', code:'FIN'},
  {name:'Collections', head:'Samuel Zimba', branch:'Blantyre', code:'COL'},
  {name:'Customer Support', head:'Grace Mtemang\'ombe', branch:'Lilongwe Area 47', code:'CSP'},
  {name:'Compliance & Audit', head:'Linda Chirwa', branch:'Lilongwe City', code:'CMA'},
  {name:'IT & Operations', head:'Peter Kamoto', branch:'Lilongwe City', code:'ITO'},
  {name:'Human Resources', head:'Mercy Chatsika', branch:'Lilongwe City', code:'HRA'}
];
const BRANCHES = [
  {name:'Lilongwe City', code:'LIL', manager:'Chikondi Mwale', region:'Central'},
  {name:'Lilongwe Area 47', code:'A47', manager:'Grace Mtemang\'ombe', region:'Central'},
  {name:'Blantyre', code:'BLZ', manager:'Samuel Zimba', region:'Southern'},
  {name:'Mzuzu', code:'MZU', manager:'Joseph Mwale', region:'Northern'},
  {name:'Zomba', code:'ZOM', manager:'Thoko Phiri', region:'Southern'},
  {name:'Kasungu', code:'KSG', manager:'Agnes Mbewe', region:'Central'}
];

let ROLES = [
  {name:'Super Admin', code:'SADM', level:'System', desc:'Unrestricted platform access', custom:false,
    restrict:'Cannot approve own disbursements'},
  {name:'Administrator', code:'ADMN', level:'System', desc:'Manages staff, settings and approvals', custom:false,
    restrict:'Disbursement approval requires a second officer'},
  {name:'Loan Officer', code:'LOFF', level:'Operations', desc:'Originates applications and serves customers', custom:false,
    restrict:'Cannot approve the loans they originate'},
  {name:'Loan Reviewer', code:'LREV', level:'Operations', desc:'Reviews submitted applications', custom:false,
    restrict:'Read-only on disbursements'},
  {name:'Loan Approver', code:'LAPP', level:'Credit', desc:'Approves or rejects applications', custom:false,
    restrict:'Approval limit per officer applies'},
  {name:'Disbursement Officer', code:'DOFF', level:'Finance', desc:'Prepares and releases approved loans', custom:false,
    restrict:'Release requires authorization'},
  {name:'Repayment Officer', code:'ROFF', level:'Finance', desc:'Records and verifies repayments', custom:false,
    restrict:'Cannot reverse posted payments'},
  {name:'Collections Officer', code:'COFF', level:'Operations', desc:'Works arrears and field follow-ups', custom:false,
    restrict:'No access to financial data exports'},
  {name:'Accountant / Finance Officer', code:'ACCT', level:'Finance', desc:'Ledger, reconciliation and reporting', custom:false,
    restrict:'Cannot edit loan terms'},
  {name:'Customer Support Officer', code:'CSUP', level:'Operations', desc:'Handles customer queries and cases', custom:false,
    restrict:'No financial data access'},
  {name:'Auditor / Compliance Officer', code:'AUDT', level:'Governance', desc:'Read-only access to every record', custom:false,
    restrict:'Read-only — cannot create or edit'},
  {name:'Branch Manager', code:'BMGR', level:'Management', desc:'Runs a branch and its staff', custom:true,
    restrict:'Approval limit MK 5,000,000'},
  {name:'Data Entry Clerk', code:'DENT', level:'Operations', desc:'Captures customer and loan data', custom:true,
    restrict:'Create only — no approvals'},
  {name:'Intern / Trainee', code:'INTR', level:'Operations', desc:'Supervised read-only access', custom:true,
    restrict:'Read-only, supervised sign-in'}
];
const ROLE_COLORS = {System:'#B32C2C',Management:'#7C5CF0',Credit:'#C9A227',Finance:'#1E9E6A',
  Operations:'#2F6FED',Governance:'#5A6172'};

const PERM_MODULES = [
  'Dashboard access','Customer management','Loan applications','Loan approval','Disbursements',
  'Repayment management','Collections management','Reports access','Financial data','Notifications',
  'Staff management','System settings'
];
let PERMS = {
  'Super Admin':        [[1,1,1,1],[1,1,1,1],[1,1,1,1],[1,1,1,1],[1,1,1,1],[1,1,1,1],[1,1,1,1],[1,1,1,1],[1,1,1,1],[1,1,1,1],[1,1,1,1],[1,1,1,1]],
  'Administrator':      [[1,1,1,1],[1,1,1,0],[1,1,1,0],[1,1,1,0],[1,1,1,0],[1,1,1,0],[1,1,1,0],[1,1,1,0],[1,1,1,0],[1,1,1,1],[1,1,1,0],[1,1,1,0]],
  'Loan Officer':       [[1,0,0,0],[1,1,1,0],[1,1,1,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[1,0,0,0],[0,0,0,0],[1,0,0,0],[0,0,0,0],[0,0,0,0]],
  'Loan Reviewer':      [[1,0,0,0],[1,0,0,0],[1,1,1,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[1,0,0,0],[0,0,0,0],[1,0,0,0],[0,0,0,0],[0,0,0,0]],
  'Loan Approver':      [[1,0,0,0],[1,0,0,0],[1,1,1,0],[1,0,1,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[1,0,0,0],[1,0,0,0],[1,0,0,0],[0,0,0,0],[0,0,0,0]],
  'Disbursement Officer':[[1,0,0,0],[1,0,0,0],[1,0,1,0],[0,0,0,0],[1,1,1,0],[0,0,0,0],[0,0,0,0],[1,0,0,0],[1,0,0,0],[1,0,0,0],[0,0,0,0],[0,0,0,0]],
  'Repayment Officer':  [[1,0,0,0],[1,0,0,0],[1,0,0,0],[0,0,0,0],[0,0,0,0],[1,1,1,0],[0,0,0,0],[1,0,0,0],[1,0,0,0],[1,0,0,0],[0,0,0,0],[0,0,0,0]],
  'Collections Officer':[[1,0,0,0],[1,0,1,0],[1,0,0,0],[0,0,0,0],[0,0,0,0],[1,0,0,0],[1,1,1,0],[1,0,0,0],[0,0,0,0],[1,0,0,0],[0,0,0,0],[0,0,0,0]],
  'Accountant / Finance Officer':[[1,0,0,0],[1,0,0,0],[1,0,0,0],[0,0,0,0],[1,1,1,0],[1,1,1,0],[0,0,0,0],[1,0,0,0],[1,0,0,0],[1,0,0,0],[0,0,0,0],[0,0,0,0]],
  'Customer Support Officer':[[1,0,0,0],[1,1,1,0],[1,1,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[1,0,0,0],[0,0,0,0],[0,0,0,0]],
  'Auditor / Compliance Officer':[[1,0,0,0],[1,0,0,0],[1,0,0,0],[1,0,0,0],[1,0,0,0],[1,0,0,0],[1,0,0,0],[1,0,0,0],[1,0,0,0],[1,0,0,0],[1,0,0,0],[0,0,0,0]],
  'Branch Manager':     [[1,1,1,0],[1,1,1,0],[1,1,1,0],[1,0,1,0],[0,0,0,0],[1,0,0,0],[1,0,1,0],[1,0,0,0],[1,0,0,0],[1,1,1,0],[1,0,0,0],[0,0,0,0]],
  'Data Entry Clerk':   [[1,0,0,0],[1,1,1,0],[1,1,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[1,0,0,0],[0,0,0,0],[0,0,0,0]],
  'Intern / Trainee':   [[1,0,0,0],[1,0,0,0],[1,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[1,0,0,0],[0,0,0,0],[0,0,0,0]]
};

let STAFF = [];
const S = {seq:24, page:1, size:8, selected:new Set(), auditPage:1, auditSize:8,
  perfPeriod:'Month', staffAud:'Individual', permRole:'Loan Officer', profile:'STF-001'};

function addStaff(o){
  STAFF.push(Object.assign({fails:0, mfa:true, sessions:1, tasks:0, status:'Active',
    joined:'2025-06-01', lastLogin:'—'}, o));
  return STAFF[STAFF.length-1];
}

/* 24 staff members */
[
  ['STF-001','Chikondi Mwale','c.mwale','c.mwale@goldenfs.mw','+265 991 200 101','Super Admin','Executive','Lilongwe City','—','Active','MW-0001','2023-02-14','30 Oct 2026 09:38',0],
  ['STF-002','Thoko Phiri','t.phiri','t.phiri@goldenfs.mw','+265 991 200 102','Loan Approver','Credit','Zomba','Chikondi Mwale','Active','MW-0002','2023-03-02','30 Oct 2026 09:02',0],
  ['STF-003','Agnes Mbewe','a.mbewe','a.mbewe@goldenfs.mw','+265 991 200 103','Accountant / Finance Officer','Finance','Kasungu','Chikondi Mwale','Active','MW-0003','2023-03-20','30 Oct 2026 08:47',1],
  ['STF-004','Samuel Zimba','s.zimba','s.zimba@goldenfs.mw','+265 991 200 104','Collections Officer','Collections','Blantyre','Chikondi Mwale','Active','MW-0004','2023-04-11','30 Oct 2026 08:31',2],
  ['STF-005','Linda Chirwa','l.chirwa','l.chirwa@goldenfs.mw','+265 991 200 105','Auditor / Compliance Officer','Compliance & Audit','Lilongwe City','Chikondi Mwale','Active','MW-0005','2023-05-08','30 Oct 2026 07:35',5],
  ['STF-006','Grace Mtemang\'ombe','g.mtemang','g.mtemang@goldenfs.mw','+265 991 200 106','Customer Support Officer','Customer Support','Lilongwe Area 47','Chikondi Mwale','Active','MW-0006','2023-06-19','30 Oct 2026 08:12',0],
  ['STF-007','Peter Kamoto','p.kamoto','p.kamoto@goldenfs.mw','+265 991 200 107','Administrator','IT & Operations','Lilongwe City','Chikondi Mwale','Active','MW-0007','2023-07-03','30 Oct 2026 09:20',0],
  ['STF-008','Mercy Chatsika','m.chatsika','m.chatsika@goldenfs.mw','+265 991 200 108','Branch Manager','Human Resources','Lilongwe City','Chikondi Mwale','Active','MW-0008','2023-08-15','30 Oct 2026 08:05',0],
  ['STF-009','Joseph Mwale','j.mwale','j.mwale@goldenfs.mw','+265 991 200 109','Branch Manager','Credit','Mzuzu','Thoko Phiri','Active','MW-0009','2023-09-01','29 Oct 2026 17:22',0],
  ['STF-010','Tadala Nkhoma','t.nkhoma','t.nkhoma@goldenfs.mw','+265 991 200 110','Loan Officer','Credit','Lilongwe City','Thoko Phiri','Active','MW-0010','2023-10-12','30 Oct 2026 08:58',0],
  ['STF-011','Blessings Tembo','b.tembo','b.tembo@goldenfs.mw','+265 991 200 111','Loan Officer','Credit','Blantyre','Joseph Mwale','Active','MW-0011','2024-01-08','30 Oct 2026 08:40',1],
  ['STF-012','Memory Nkhoma','m.nkhoma','m.nkhoma@goldenfs.mw','+265 991 200 112','Loan Reviewer','Credit','Lilongwe City','Thoko Phiri','Active','MW-0012','2024-02-14','30 Oct 2026 08:26',0],
  ['STF-013','Peter Kachale','p.kachale','p.kachale@goldenfs.mw','+265 991 200 113','Disbursement Officer','Finance','Lilongwe City','Agnes Mbewe','Active','MW-0013','2024-03-04','30 Oct 2026 08:19',0],
  ['STF-014','Esther Kamanga','e.kamanga','e.kamanga@goldenfs.mw','+265 991 200 114','Repayment Officer','Finance','Lilongwe City','Agnes Mbewe','Active','MW-0014','2024-04-22','30 Oct 2026 08:02',0],
  ['STF-015','Isaac Mponda','i.mponda','i.mponda@goldenfs.mw','+265 991 200 115','Collections Officer','Collections','Zomba','Samuel Zimba','Active','MW-0015','2024-05-30','29 Oct 2026 16:51',0],
  ['STF-016','Fatima Salimu','f.salimu','f.salimu@goldenfs.mw','+265 991 200 116','Customer Support Officer','Customer Support','Blantyre','Grace Mtemang\'ombe','Inactive','MW-0016','2024-07-11','12 Sep 2026 11:14',0],
  ['STF-017','Kondwani Msiska','k.msiska','k.msiska@goldenfs.mw','+265 991 200 117','Loan Officer','Credit','Mzuzu','Joseph Mwale','Suspended','MW-0017','2024-08-19','26 Oct 2026 15:40',3],
  ['STF-018','Rose Chikopa','r.chikopa','r.chikopa@goldenfs.mw','+265 991 200 118','Data Entry Clerk','Credit','Kasungu','Thoko Phiri','Active','MW-0018','2024-09-23','30 Oct 2026 07:58',0],
  ['STF-019','Alfred Jimu','a.jimu','a.jimu@goldenfs.mw','+265 991 200 119','Collections Officer','Collections','Blantyre','Samuel Zimba','Locked','MW-0019','2024-11-05','28 Oct 2026 19:22',6],
  ['STF-020','Sarah Kaunda','s.kaunda','s.kaunda@goldenfs.mw','+265 991 200 120','Repayment Officer','Finance','Lilongwe Area 47','Agnes Mbewe','Active','MW-0020','2025-01-15','30 Oct 2026 08:44',0],
  ['STF-021','Yamikani Gondwe','y.gondwe','y.gondwe@goldenfs.mw','+265 991 200 121','Loan Reviewer','Credit','Mzuzu','Joseph Mwale','Active','MW-0021','2025-03-10','30 Oct 2026 08:07',0],
  ['STF-022','Grace Mvula','g.mvula','g.mvula@goldenfs.mw','+265 991 200 122','Data Entry Clerk','Customer Support','Lilongwe City','Grace Mtemang\'ombe','Active','MW-0022','2025-05-26','29 Oct 2026 16:33',0],
  ['STF-023','Chisomo Phiri','c.phiri','c.phiri@goldenfs.mw','+265 991 200 123','Intern / Trainee','Credit','Lilongwe City','Thoko Phiri','Pending','MW-0023','2026-10-27','—',0],
  ['STF-024','Daniel Kaunda','d.kaunda','d.kaunda@goldenfs.mw','+265 991 200 124','Customer Support Officer','Customer Support','Zomba','Grace Mtemang\'ombe','Pending','MW-0024','2026-10-28','—',0]
].forEach(([id,name,user,email,phone,role,dept,branch,manager,status,idno,joined,lastLogin,fails])=>{
  addStaff({id,name,user,email,phone,role,dept,branch,manager,status,idno,joined,lastLogin,fails,
    nid:'NID-'+(300000+ +id.slice(4)*137), dob:'19'+(70+ +id.slice(4)%25)+'-0'+(1+ +id.slice(4)%9)+'-1'+(+id.slice(4)%9),
    address:'Private Bag '+(200+ +id.slice(4))+', '+branch+', Malawi',
    mfa: +id.slice(4) !== 23, sessions: status==='Active' ? 1+ +id.slice(4)%3 : 0});
});

/* tasks */
let TASKS = [
  ['TSK-1101','Loan Application','Review LN-2026-1842 · Thokozani Banda','Tadala Nkhoma','High','31 Oct 2026','In Progress','30 Oct 2026'],
  ['TSK-1102','Loan Application','Screen LN-2026-1844 · Grace Mvula','Memory Nkhoma','Normal','31 Oct 2026','Pending','30 Oct 2026'],
  ['TSK-1103','Collection Case','Follow up LN-2024-0761 · Mercy Chatsika','Samuel Zimba','High','30 Oct 2026','Overdue','29 Oct 2026'],
  ['TSK-1104','Disbursement','Release DIS-2026-1041 · MK 868,500','Peter Kachale','High','30 Oct 2026','In Progress','30 Oct 2026'],
  ['TSK-1105','Repayment Verification','Verify RCP-99388 · MK 512,000','Esther Kamanga','Normal','29 Oct 2026','Completed','29 Oct 2026'],
  ['TSK-1106','Customer Account','KYC refresh · Sarah Kaunda','Grace Mvula','Low','2 Nov 2026','Pending','30 Oct 2026'],
  ['TSK-1107','Support Case','Query on missing receipt · CUS-003501','Grace Mtemang\'ombe','Normal','31 Oct 2026','In Progress','30 Oct 2026'],
  ['TSK-1108','Collection Case','Field visit · Blessings Tembo','Alfred Jimu','High','30 Oct 2026','Overdue','28 Oct 2026'],
  ['TSK-1109','Loan Application','Committee pack for 31 Oct','Thoko Phiri','High','31 Oct 2026','Pending','30 Oct 2026'],
  ['TSK-1110','Repayment Verification','Reconcile mobile money batch','Sarah Kaunda','Normal','1 Nov 2026','Pending','30 Oct 2026'],
  ['TSK-1111','Disbursement','Prepare release batch · 12 loans','Peter Kachale','Normal','1 Nov 2026','Pending','30 Oct 2026'],
  ['TSK-1112','Support Case','Account lockout enquiry','Daniel Kaunda','Low','2 Nov 2026','Pending','29 Oct 2026'],
  ['TSK-1113','Customer Account','Data capture · new applications','Rose Chikopa','Normal','31 Oct 2026','In Progress','30 Oct 2026'],
  ['TSK-1114','Collection Case','Promised payment follow-up','Isaac Mponda','Normal','31 Oct 2026','Pending','30 Oct 2026'],
  ['TSK-1115','Loan Application','Document check LN-2026-1846','Yamikani Gondwe','Normal','29 Oct 2026','Completed','29 Oct 2026'],
  ['TSK-1116','Reporting','Weekly portfolio pack','Agnes Mbewe','Low','1 Nov 2026','Pending','30 Oct 2026']
].map(([ref,type,title,staff,priority,due,status,created])=>({ref,type,title,staff,priority,due,status,created}));

/* performance per staff */
const PERF = {
  'STF-002':[46,44,0,0,0,0,0,2,18.4], 'STF-003':[0,0,0,0,124,0,0,1,9.2],
  'STF-004':[0,0,0,0,0,86,0,2,22.6], 'STF-006':[0,0,0,0,0,0,142,3,6.1],
  'STF-009':[28,26,0,0,0,0,0,1,20.2], 'STF-010':[38,0,22,0,0,0,0,1,14.8],
  'STF-011':[31,0,18,0,0,0,0,2,16.3], 'STF-012':[52,0,0,0,0,0,0,1,11.4],
  'STF-013':[0,0,0,74,0,0,0,2,7.6],   'STF-014':[0,0,0,0,168,0,0,1,5.9],
  'STF-015':[0,0,0,0,0,64,0,0,24.1],  'STF-018':[0,0,0,0,0,0,0,1,0],
  'STF-020':[0,0,0,0,96,0,0,1,6.4],   'STF-021':[24,0,0,0,0,0,0,0,12.7],
  'STF-022':[0,0,0,0,0,0,38,1,4.8],   'STF-005':[0,0,0,0,0,0,0,0,0]
};
const PERF_SCALE = {Month:1, Quarter:2.8, Year:9.4};
const COLLECTION_RATE = {'STF-004':88.4,'STF-015':81.2,'STF-010':76.5,'STF-011':73.8,'STF-009':69.4,'STF-021':64.1};

/* audit log */
let AUDIT = [
  ['09:38','Chikondi Mwale','Login','SESSION','Signed in from Lilongwe','196.44.21.4','Success'],
  ['09:20','Peter Kamoto','System Settings','SET-04','Updated session timeout to 20 minutes','196.44.21.9','Success'],
  ['09:12','Linda Chirwa','Permission Change','STF-017','Suspended K. Msiska · failed logins','196.44.21.6','Success'],
  ['09:02','Thoko Phiri','Loan Approval','LN-2026-1831','Approved MK 450,000','196.44.21.11','Success'],
  ['08:58','Tadala Nkhoma','Loan Application','LN-2026-1842','Submitted for review','196.44.21.18','Success'],
  ['08:47','Agnes Mbewe','Repayment','RCP-99388','Verified MK 512,000','196.44.21.22','Success'],
  ['08:31','Samuel Zimba','Collection','LN-2024-0761','Logged field visit','196.44.21.14','Success'],
  ['08:19','Peter Kachale','Disbursement','DIS-2026-1041','Prepared release MK 868,500','196.44.21.25','Success'],
  ['08:12','Grace Mtemang\'ombe','Customer Record','CUS-003501','Viewed customer profile','196.44.21.31','Success'],
  ['08:05','Mercy Chatsika','Report Access','RPT-WORKLOAD','Exported workload report','196.44.21.28','Success'],
  ['07:58','Rose Chikopa','Customer Record','CUS-003488','Created customer record','196.44.21.33','Success'],
  ['07:35','Linda Chirwa','Status Change','STF-005','Failed sign-in attempts reviewed','196.44.21.6','Success'],
  ['28 Oct 19:22','Alfred Jimu','Login','SESSION','Account locked after 6 attempts','41.87.112.8','Blocked'],
  ['28 Oct 17:40','Esther Kamanga','Repayment','RCP-99371','Posted MK 320,000','196.44.21.22','Success'],
  ['28 Oct 16:02','Tadala Nkhoma','Loan Application','LN-2026-1839','Edited applicant details','196.44.21.18','Success'],
  ['28 Oct 14:55','Samuel Zimba','Report Access','RPT-ARREARS','Viewed arrears ageing report','196.44.21.14','Success'],
  ['28 Oct 11:20','Peter Kamoto','Permission Change','ROLE-LOFF','Removed financial data access','196.44.21.9','Success'],
  ['27 Oct 16:44','Kondwani Msiska','Disbursement','DIS-2026-1038','Attempted release without authorization','41.87.112.51','Blocked']
].map(([time,staff,cat,record,detail,ip,result])=>({time,staff,cat,record,detail,ip,result}));

/* permission change reviews */
let PERM_CHANGES = [
  ['30 Oct 2026 09:12','Linda Chirwa','Loan Officer','Financial data access removed','Administrator'],
  ['29 Oct 2026 16:40','Peter Kamoto','Branch Manager','Approval limit raised to MK 5,000,000','Super Admin'],
  ['28 Oct 2026 11:20','Peter Kamoto','Loan Officer','Disbursement permission removed','Administrator'],
  ['26 Oct 2026 08:05','Chikondi Mwale','Data Entry Clerk','Delete permission revoked','Super Admin']
];

/* invitations */
let INVITES = [
  ['Chisomo Phiri','c.phiri@goldenfs.mw','Intern / Trainee','Credit','27 Oct 2026','3 Nov 2026','Pending'],
  ['Daniel Kaunda','d.kaunda@goldenfs.mw','Customer Support Officer','Customer Support','28 Oct 2026','4 Nov 2026','Pending'],
  ['Tabitha Kalua','t.kalua@goldenfs.mw','Data Entry Clerk','Credit','29 Oct 2026','5 Nov 2026','Pending'],
  ['Henry Chikafa','h.chikafa@goldenfs.mw','Collections Officer','Collections','18 Oct 2026','25 Oct 2026','Expired']
];
const ONBOARD_HISTORY = [
  ['Chisomo Phiri','27 Oct 2026','—','Intern / Trainee','Minimum access','—','Awaiting registration'],
  ['Daniel Kaunda','28 Oct 2026','—','Customer Support Officer','Role defaults','—','Awaiting registration'],
  ['Grace Mvula','26 May 2025','26 May 2025','Data Entry Clerk','Role defaults','26 May 2025','Complete'],
  ['Yamikani Gondwe','10 Mar 2025','11 Mar 2025','Loan Reviewer','Role defaults','11 Mar 2025','Complete']
];

/* documents */
let DOCS = [
  ['National ID — copy','Chikondi Mwale','Identification','12 Feb 2023','—','Restricted'],
  ['Employment contract','Chikondi Mwale','Employment','14 Feb 2023','—','Restricted'],
  ['Appointment letter','Thoko Phiri','Appointment letter','02 Mar 2023','—','Restricted'],
  ['Practising certificate','Agnes Mbewe','Training / certification','20 Mar 2025','31 Dec 2026','Standard'],
  ['National ID — copy','Samuel Zimba','Identification','11 Apr 2023','—','Restricted'],
  ['Driving licence (field work)','Isaac Mponda','Identification','30 May 2024','14 Mar 2027','Standard'],
  ['Role assignment record','Kondwani Msiska','Role assignment','19 Aug 2024','—','Restricted'],
  ['Credit analysis training','Memory Nkhoma','Training / certification','14 Sep 2026','14 Sep 2027','Standard'],
  ['Employment contract','Blessings Tembo','Employment','08 Jan 2024','—','Restricted'],
  ['Collections certification','Samuel Zimba','Training / certification','02 Jul 2024','31 Jan 2027','Standard'],
  ['Medical cover enrolment','Grace Mtemang\'ombe','Employment','19 Jun 2023','30 Jun 2027','Standard']
].map(([name,staff,type,uploaded,expiry,access])=>({name,staff,type,uploaded,expiry,access}));

/* staff notification history */
let CM_HISTORY = [
  ['Permission change notice','Individual · T. Nkhoma','30 Oct 2026 09:12','Delivered'],
  ['Month-end close reminder','Department · Finance','29 Oct 2026 16:20','Delivered'],
  ['Security alert · unusual sign-in','Security · All staff','29 Oct 2026 08:15','Delivered'],
  ['New collection assignment','Task · S. Zimba','28 Oct 2026 14:02','Read'],
  ['Branch performance review','Role · Branch Manager','27 Oct 2026 10:00','Delivered'],
  ['Account suspended','Individual · K. Msiska','26 Oct 2026 15:40','Delivered']
];
const CM_STATUS = [['Staff dashboard',248,244,4],['Email',186,181,5],['SMS',42,40,2]];

/* security alerts */
const SEC_ALERTS = [
  ['5 failed sign-ins · L. Chirwa','06:58 · 41.87.112.8','High'],
  ['Account locked · A. Jimu','28 Oct 19:22 · 6 attempts','High'],
  ['Release attempt without authorization · K. Msiska','27 Oct 16:44','Critical'],
  ['New device sign-in · P. Kamoto','27 Oct 07:12 · Android','Normal'],
  ['Suspended account sign-in attempt · K. Msiska','26 Oct 15:40','High']
];

/* closure requests */
let CLOSURE = [
  ['CLS-004','Kondwani Msiska','Deactivate account','Repeated policy breaches','Pending approval'],
  ['CLS-003','Fatima Salimu','Deactivate account','Resigned — 12 Sep 2026','Approved'],
  ['CLS-002','Joseph Mwale','Transfer branch','Mzuzu to Lilongwe City','Approved'],
  ['CLS-001','Henry Chikafa','Deactivate account','Contract ended','Completed']
];
const CL_TRAIL = [
  ['30 Oct 2026 09:14','Kondwani Msiska','Deactivate','Policy breach','Requested'],
  ['12 Sep 2026 11:30','Fatima Salimu','Deactivate','Resignation','Approved · access revoked'],
  ['05 Sep 2026 09:00','Joseph Mwale','Transfer branch','Relocation','Completed'],
  ['25 Aug 2026 16:20','Henry Chikafa','Deactivate','Contract ended','Completed · records preserved']
];

/* assignment history */
const ASSIGN_HISTORY = [
  ['30 Oct 2026 09:20','TSK-1104','Reassigned to Peter Kachale','C. Mwale'],
  ['30 Oct 2026 08:58','TSK-1101','Assigned to Tadala Nkhoma','T. Phiri'],
  ['29 Oct 2026 16:05','TSK-1105','Completed by Esther Kamanga','System'],
  ['29 Oct 2026 14:02','TSK-1103','Reassigned to Samuel Zimba','C. Mwale'],
  ['28 Oct 2026 15:40','TSK-1108','Assigned to Alfred Jimu','S. Zimba']
];
