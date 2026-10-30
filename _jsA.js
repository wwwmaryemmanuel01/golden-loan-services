<script>
/* ============================================================
   GOLDEN FINANCIAL SERVICES · DISBURSEMENTS MODULE
   Sample data + in-page workflow state. Swap DATA for API calls.
   ============================================================ */

/* ---------------- utils ---------------- */
const el = id => document.getElementById(id);
const nf = n => Math.round(n).toLocaleString('en-US');
const mk = n => 'MK ' + nf(n);
const mkm = n => n>=1e6 ? 'MK '+(n/1e6).toFixed(2)+'M' : n>=1e3 ? 'MK '+Math.round(n/1e3)+'K' : mk(n);
const initials = s => s.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase();
const today = '2026-10-30';

function toast(msg, type='ok'){
  const t = document.createElement('div');
  t.className = 'toast ' + type;
  t.innerHTML = `<span>${type==='err'?'⚠':type==='info'?'ℹ':'✓'}</span><div>${msg}</div>`;
  el('toasts').appendChild(t);
  setTimeout(()=>{ t.style.opacity='0'; t.style.transform='translateX(16px)'; t.style.transition='.25s'; }, 2600);
  setTimeout(()=>t.remove(), 3000);
}

const STATUS_CLASS = {
  'Draft':'st-draft','Awaiting authorization':'st-await','Authorized':'st-auth','Processing':'st-proc',
  'Awaiting confirmation':'st-conf','Successful':'st-ok','Failed':'st-fail','Rejected':'st-rej',
  'Cancelled':'st-canc','Reversed':'st-rev'
};
const chip = s => `<span class="chip ${STATUS_CLASS[s]||'st-draft'}">${s}</span>`;

/* ---------------- fee engine ---------------- */
const FEE = {proc:2.5, ins:1, other:0, waive:0};
function calcFees(amount, proc=FEE.proc, ins=FEE.ins, other=FEE.other, waive=FEE.waive){
  const p = amount*proc/100, i = amount*ins/100;
  const total = Math.max(0, p+i+other-waive);
  return {proc:p, ins:i, other, waive, total, net: amount-total};
}

/* ---------------- data ---------------- */
const state = {
  seq: 1042,
  loans: [
    {app:'LN-2026-1842', cust:'Thokozani Banda', acct:'CUS-004286', product:'Business Growth',
     approved:2500000, rate:'4.2% / month', term:'12 months', officer:'T. Phiri', approvedOn:'2026-10-29',
     docs:{agreement:true, id:true, payslip:true, guarantor:false}, prepared:false},
    {app:'LN-2026-1839', cust:'Grace Mvula', acct:'CUS-004121', product:'Group Loan',
     approved:800000, rate:'3.8% / month', term:'8 months', officer:'A. Mbewe', approvedOn:'2026-10-29',
     docs:{agreement:true, id:true, payslip:true, guarantor:true}, prepared:false},
    {app:'LN-2026-1827', cust:'Peter Kachale', acct:'CUS-003902', product:'Asset Finance',
     approved:4800000, rate:'3.5% / month', term:'24 months', officer:'S. Zimba', approvedOn:'2026-10-28',
     docs:{agreement:true, id:true, payslip:false, guarantor:true}, prepared:false},
    {app:'LN-2026-1831', cust:'Memory Nkhoma', acct:'CUS-004008', product:'Salary Advance',
     approved:450000, rate:'4.5% / month', term:'6 months', officer:'L. Chirwa', approvedOn:'2026-10-28',
     docs:{agreement:true, id:true, payslip:true, guarantor:true}, prepared:false},
    {app:'LN-2026-1815', cust:'Yamikani Gondwe', acct:'CUS-003744', product:'Agri Input Loan',
     approved:1200000, rate:'3.9% / month', term:'10 months', officer:'T. Phiri', approvedOn:'2026-10-27',
     docs:{agreement:true, id:true, payslip:true, guarantor:true}, prepared:false},
    {app:'LN-2026-1822', cust:'Esther Kamanga', acct:'CUS-003981', product:'Emergency Loan',
     approved:150000, rate:'5.0% / month', term:'4 months', officer:'L. Chirwa', approvedOn:'2026-10-27',
     docs:{agreement:false, id:true, payslip:true, guarantor:true}, prepared:false},
    {app:'LN-2026-1809', cust:'Isaac Mponda', acct:'CUS-003612', product:'Business Growth',
     approved:3200000, rate:'4.2% / month', term:'18 months', officer:'S. Zimba', approvedOn:'2026-10-26',
     docs:{agreement:true, id:false, payslip:true, guarantor:true}, prepared:false},
    {app:'LN-2026-1836', cust:'Fatima Salimu', acct:'CUS-004233', product:'Salary Advance',
     approved:600000, rate:'4.5% / month', term:'6 months', officer:'A. Mbewe', approvedOn:'2026-10-30',
     docs:{agreement:true, id:true, payslip:true, guarantor:true}, prepared:false}
  ],
  disb: [],
  audit: [],
  changes: [],
  notifs: []
};

/* seed disbursement records across the lifecycle */
const seed = [
  ['DIS-2026-1041','LN-2026-1810','Kondwani Msiska','CUS-003811','Group Loan',900000,'Bank Transfer','T. Phiri','2026-10-30','Successful','FT2610307712',true],
  ['DIS-2026-1040','LN-2026-1812','Rose Chikopa','CUS-003844','Salary Advance',320000,'Airtel Money','L. Chirwa','2026-10-30','Successful','AM2610304451',true],
  ['DIS-2026-1039','LN-2026-1818','Alfred Jimu','CUS-003889','Business Growth',1750000,'Bank Transfer','S. Zimba','2026-10-30','Awaiting confirmation','FT2610306602',false],
  ['DIS-2026-1038','LN-2026-1819','Blessings Tembo','CUS-003901','Emergency Loan',240000,'TNM Mpamba','A. Mbewe','2026-10-30','Processing','MP2610301188',false],
  ['DIS-2026-1037','LN-2026-1805','Dorothy Nyirenda','CUS-003699','Agri Input Loan',1400000,'Bank Transfer','T. Phiri','2026-10-29','Failed','FT2610295510',false],
  ['DIS-2026-1036','LN-2026-1802','Chimwemwe Zulu','CUS-003655','Asset Finance',2600000,'Bank Transfer','S. Zimba','2026-10-29','Successful','FT2610294408',true],
  ['DIS-2026-1035','LN-2026-1798','Mercy Chatsika','CUS-003590','Group Loan',700000,'Airtel Money','L. Chirwa','2026-10-29','Successful','AM2610293390',true],
  ['DIS-2026-1034','LN-2026-1795','Daniel Kaunda','CUS-003544','Salary Advance',380000,'Cash','G. Mtemang\'ombe','2026-10-28','Successful','CSH-261028-04',true],
  ['DIS-2026-1033','LN-2026-1791','Sarah Kaunda','CUS-003501','Business Growth',2000000,'Bank Transfer','T. Phiri','2026-10-28','Reversed','FT2610282277',false],
  ['DIS-2026-1032','LN-2026-1789','Joseph Mwale','CUS-003488','Agri Input Loan',1150000,'TNM Mpamba','A. Mbewe','2026-10-28','Successful','MP2610280755',true],
  ['DIS-2026-1031','LN-2026-1784','Tadala Nkhoma','CUS-003412','Emergency Loan',180000,'Airtel Money','L. Chirwa','2026-10-27','Cancelled','',false],
  ['DIS-2026-1030','LN-2026-1780','Peter Kachale','CUS-003390','Asset Finance',4500000,'Bank Transfer','S. Zimba','2026-10-27','Successful','FT2610279001',true],
  ['DIS-2026-1029','LN-2026-1776','Grace Mvula','CUS-003355','Group Loan',650000,'Bank Transfer','A. Mbewe','2026-10-26','Failed','FT2610264488',false],
  ['DIS-2026-1028','LN-2026-1770','Thokozani Banda','CUS-003311','Business Growth',2400000,'Bank Transfer','T. Phiri','2026-10-26','Successful','FT2610263312',true],
  ['DIS-2026-1027','LN-2026-1765','Memory Nkhoma','CUS-003280','Salary Advance',500000,'Airtel Money','L. Chirwa','2026-10-25','Successful','AM2610251140',true],
  ['DIS-2026-1026','LN-2026-1761','Isaac Mponda','CUS-003244','Business Growth',3000000,'Bank Transfer','S. Zimba','2026-10-25','Rejected','',false],
  ['DIS-2026-1025','LN-2026-1758','Fatima Salimu','CUS-003210','Salary Advance',540000,'Bank Transfer','A. Mbewe','2026-10-24','Successful','FT2610247781',true],
  ['DIS-2026-1024','LN-2026-1752','Yamikani Gondwe','CUS-003178','Agri Input Loan',1250000,'Bank Transfer','T. Phiri','2026-10-24','Successful','FT2610246690',true],
  ['DIS-2026-1023','LN-2026-1749','Esther Kamanga','CUS-003141','Emergency Loan',160000,'Cash','G. Mtemang\'ombe','2026-10-23','Successful','CSH-261023-11',true],
  ['DIS-2026-1022','LN-2026-1744','Alfred Jimu','CUS-003102','Business Growth',1600000,'Bank Transfer','S. Zimba','2026-10-23','Failed','FT2610235520',false]
];
const pendingActivation = ['DIS-2026-1041','DIS-2026-1040','DIS-2026-1036'];
seed.forEach(([ref,app,cust,acct,product,amount,method,officer,date,status,txn,activated])=>{
  if(pendingActivation.includes(ref)) activated = false;
  const f = calcFees(amount);
  state.disb.push({ref,app,cust,acct,product,amount,method,officer,date,status,txn,activated,
    fees:f, net:f.net, preparedBy:officer, authorizedBy:'C. Mwale', notes:'', attempts:status==='Failed'?2:1,
    reason: status==='Failed' ? (method==='Bank Transfer'?'Beneficiary account name mismatch':'Wallet limit exceeded')
          : status==='Reversed' ? 'Funds returned by beneficiary bank' : ''});
});

/* seed: two pending authorization + one draft */
[['LN-2026-1817','Chisomo Mhango','CUS-003777','Business Growth',1900000,'Airtel Money','T. Phiri','Awaiting authorization'],
 ['LN-2026-1816','Patrick Nsanja','CUS-003755','Asset Finance',3400000,'Bank Transfer','S. Zimba','Awaiting authorization'],
 ['LN-2026-1814','Loveness Kalua','CUS-003712','Group Loan',720000,'Cash','A. Mbewe','Draft']
].forEach(([app,cust,acct,product,amount,method,officer,status])=>{
  const ref = 'DIS-2026-' + (++state.seq);
  const f = calcFees(amount);
  state.disb.push({ref,app,cust,acct,product,amount,method,officer,date:today,status,txn:'',activated:false,
    fees:f, net:f.net, preparedBy:officer, authorizedBy:'', notes:'Prepared at branch counter', attempts:0, reason:''});
});

const nextRef = () => 'DIS-2026-' + (++state.seq);

/* audit + notification seeds */
state.audit = [
  ['09:44','DIS-2026-1041','Created','T. Phiri','Prepared bank transfer release','196.44.21.7','Success'],
  ['09:41','DIS-2026-1041','Authorized','C. Mwale','Approved within limit MK 5,000,000','196.44.21.4','Success'],
  ['09:22','DIS-2026-1039','Modified','S. Zimba','Recipient account corrected','196.44.21.9','Success'],
  ['09:10','DIS-2026-1038','Created','A. Mbewe','Prepared TNM Mpamba release','41.87.112.3','Success'],
  ['08:58','DIS-2026-1037','Confirmed','C. Mwale','Marked failed — account mismatch','196.44.21.4','Success'],
  ['08:31','DIS-2026-1026','Rejected','C. Mwale','Customer KYC expired','196.44.21.4','Blocked'],
  ['08:12','DIS-2026-1033','Reversed','System','Bank returned funds','10.0.4.12','Success'],
  ['07:55','AUTH-0x91','Authorization attempt','L. Chirwa','Amount above personal limit','41.87.112.8','Blocked']
];
state.changes = [
  {time:'09:44', ref:'DIS-2026-1041', from:'Authorized', to:'Successful', by:'C. Mwale'},
  {time:'09:41', ref:'DIS-2026-1041', from:'Awaiting authorization', to:'Authorized', by:'C. Mwale'},
  {time:'09:22', ref:'DIS-2026-1039', from:'Processing', to:'Awaiting confirmation', by:'S. Zimba'},
  {time:'09:10', ref:'DIS-2026-1038', from:'Authorized', to:'Processing', by:'A. Mbewe'},
  {time:'08:58', ref:'DIS-2026-1037', from:'Processing', to:'Failed', by:'C. Mwale'},
  {time:'08:31', ref:'DIS-2026-1026', from:'Awaiting authorization', to:'Rejected', by:'C. Mwale'}
];
state.notifs = [
  ['09:45','Thokozani Banda','SMS','Disbursement processed — funds sent to your Airtel Money wallet','Delivered'],
  ['09:41','C. Mwale','In-app','DIS-2026-1041 authorized and queued for release','Read'],
  ['09:10','G. Mtemang\'ombe','Email','Cash disbursement awaiting confirmation at counter','Delivered'],
  ['08:58','Blessings Tembo','SMS','Your loan has been approved. Await disbursement confirmation.','Delivered'],
  ['08:30','A. Mbewe','In-app','DIS-2026-1038 failed — wallet limit exceeded','Unread'],
  ['08:10','D. Nyirenda','SMS','Disbursement delayed. Our team will contact you.','Failed']
];

/* ============================================================
   CHART HELPERS
   ============================================================ */
function niceMax(v){
  if(v<=0) return 10;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  for(const s of [1,1.2,1.5,2,2.5,3,4,5,6,8,10]) if(v <= s*p) return s*p;
  return 10*p;
}
function mkChart(host, o){
  if(!host) return;
  const type = o.type || 'line', labels = o.labels||[], series = o.series||[];
  const W=640, H=o.height||220, L=38, R=12, T=12, B=26;
  const iw=W-L-R, ih=H-T-B;
  const yMax = o.yMax || niceMax(Math.max(0,...series.flatMap(s=>s.data)));
  const step = iw/Math.max(labels.length,1);
  let g='';
  for(let i=0;i<=4;i++){
    const v=yMax/4*i, y=T+ih-(v/yMax)*ih;
    g += `<line x1="${L}" y1="${y.toFixed(1)}" x2="${W-R}" y2="${y.toFixed(1)}" stroke="#EEF0F4"/>`;
    const t = Number.isInteger(v)?v:v.toFixed(1);
    g += `<text x="${L-7}" y="${(y+3.2).toFixed(1)}" text-anchor="end" font-size="9" fill="#9AA0AC" font-family="inherit">${t}</text>`;
  }
  labels.forEach((lb,i)=>{
    if(labels.length>12 && i%2) return;
    g += `<text x="${(L+step*i+step/2).toFixed(1)}" y="${H-8}" text-anchor="middle" font-size="9" fill="#8A90A0" font-weight="600" font-family="inherit">${lb}</text>`;
  });
  if(type==='bar'){
    const n=series.length, groupW=step*0.60, bw=Math.max(3, groupW/n-(n>1?2:0));
    labels.forEach((lb,i)=>{
      const gx=L+step*i+(step-groupW)/2;
      series.forEach((s,j)=>{
        const v=s.data[i]||0, h=(v/yMax)*ih;
        if(h<0.6) return;
        const x=gx+j*(bw+2), y=T+ih-h, r=Math.min(3,bw/2,h/2);
        g += `<path d="M${x.toFixed(1)} ${(y+r).toFixed(1)} q0 ${-r} ${r} ${-r} h${(bw-2*r).toFixed(1)} q${r} 0 ${r} ${r} v${(h-r).toFixed(1)} h${-bw.toFixed(1)} Z" fill="${s.color}"><title>${lb} · ${s.name}: ${v}</title></path>`;
      });
    });
  } else {
    series.forEach(s=>{
      const pts=s.data.map((v,i)=>[L+step*i+step/2, T+ih-(v/yMax)*ih]);
      const d=pts.map((q,i)=>(i?'L':'M')+q[0].toFixed(1)+' '+q[1].toFixed(1)).join(' ');
      const gid='gd'+Math.random().toString(36).slice(2,8);
      g += `<defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${s.color}" stop-opacity=".20"/>
        <stop offset="100%" stop-color="${s.color}" stop-opacity="0"/></linearGradient></defs>
        <path d="${d} L${pts[pts.length-1][0].toFixed(1)} ${T+ih} L${pts[0][0].toFixed(1)} ${T+ih} Z" fill="url(#${gid})"/>
        <path d="${d}" fill="none" stroke="${s.color}" stroke-width="2.1" stroke-linejoin="round" stroke-linecap="round"/>`;
      pts.forEach((q,i)=>{ g += `<circle cx="${q[0].toFixed(1)}" cy="${q[1].toFixed(1)}" r="2.4" fill="#fff" stroke="${s.color}" stroke-width="1.8"><title>${labels[i]} · ${s.name}: ${s.data[i]}</title></circle>`; });
    });
  }
  host.setAttribute('viewBox',`0 0 ${W} ${H}`);
  host.innerHTML = g;
}
function mkDonut(host, data, opt={}){
  const total = data.reduce((s,d)=>s+d.value,0)||1;
  const size=opt.size||150, c=size/2, r=size*0.335, sw=opt.ring||15;
  const C=2*Math.PI*r, GAP=2.5; let off=0, arcs='';
  data.forEach(d=>{
    const len=(d.value/total)*C, dash=Math.max(len-GAP,0.6);
    arcs += `<circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="${d.color}" stroke-width="${sw}"
      stroke-dasharray="${dash.toFixed(2)} ${(C-dash).toFixed(2)}" stroke-dashoffset="${(-off).toFixed(2)}"
      transform="rotate(-90 ${c} ${c})"><title>${d.label}: ${nf(d.value)}</title></circle>`;
    off+=len;
  });
  host.innerHTML = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="#F1F2F6" stroke-width="${sw}"/>${arcs}
    <text x="${c}" y="${c-1}" text-anchor="middle" font-size="${(size*0.125).toFixed(1)}" font-weight="800" fill="#0F1115" font-family="inherit">${opt.center||nf(total)}</text>
    <text x="${c}" y="${c+13}" text-anchor="middle" font-size="${(size*0.058).toFixed(1)}" font-weight="700" fill="#8A90A0" letter-spacing=".8" font-family="inherit">${opt.caption||'TOTAL'}</text></svg>`;
}
function mkHBars(host, rows){
  if(!host) return;
  const max = Math.max(...rows.map(r=>r.value))||1;
  host.innerHTML = rows.map(r=>`
    <div class="hbar-row">
      <div class="hbar-l">${r.label}</div>
      <div class="hbar-t"><i style="width:${Math.max(2,(r.value/max)*100)}%;background:${r.color}"></i></div>
      <div class="hbar-v">${r.display || nf(r.value)}</div>
    </div>`).join('');
}
