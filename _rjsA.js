<script>
/* ============================================================
   GOLDEN FINANCIAL SERVICES · REPORTS MODULE
   ============================================================ */
const el = id => document.getElementById(id);
const nf = n => Math.round(n).toLocaleString('en-US');
const mk = n => 'MK ' + nf(n);
const mkm = n => 'MK ' + (n/1000000).toFixed(1) + 'M';
const pct = (a,b) => b ? (a/b*100).toFixed(1) + '%' : '—';
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

/* ---------- charts ---------- */
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
function legend(host, series){
  if(!host) return;
  host.innerHTML = series.map(s=>`<span class="lg-item"><i style="background:${s.color}"></i>${s.name}</span>`).join('');
}

/* ============================================================
   DATASET
   ============================================================ */
function rng(seed){ let s=seed; return ()=>{ s=(s*1664525+1013904223)%4294967296; return s/4294967296; }; }
const R = rng(20261030);
const pick = a => a[Math.floor(R()*a.length)];
const FIRST=['Thokozani','Grace','Peter','Memory','Yamikani','Esther','Isaac','Fatima','Rose','Kondwani',
  'Blessings','Chimwemwe','Mercy','Alfred','Sarah','Tadala','Daniel','Tabitha','Henry','Chisomo',
  'Ephraim','Loveness','Mphatso','Ruth','Stevenson','Lydia'];
const LAST=['Banda','Mvula','Kachale','Nkhoma','Gondwe','Kamanga','Mponda','Salimu','Chikopa','Msiska',
  'Tembo','Zulu','Chatsika','Jimu','Kaunda','Phiri','Mwale','Nyirenda','Chirwa','Mbewe'];
const PRODUCTS=['Business Growth','Salary Loan','Agri Loan','Emergency Loan','Asset Finance'];
const OFFICERS=['Tadala Nkhoma','Blessings Tembo','Memory Nkhoma','Joseph Mwale','Yamikani Gondwe','Rose Chikopa'];
const BRANCHES=['Lilongwe City','Lilongwe Area 47','Blantyre','Mzuzu','Zomba','Kasungu'];
const METHODS=['Airtel Money','TNM Mpamba','Bank transfer','Cash','Cheque'];
const DSTATUS=['Active','Active','Active','Active','Active','Fully Paid','Fully Paid','Pending',
  'Approved','Rejected','Cancelled','Active','Active','Active','Fully Paid','Active'];

let CUSTOMERS = [], LOANS = [], REPAYS = [], APPS = [], STAFFAGG = [];
const seen = new Set();
function person(){
  let n;
  do { n = pick(FIRST)+' '+pick(LAST); } while(seen.has(n));
  seen.add(n); return n;
}

/* customers */
for(let i=0;i<40;i++){
  const name = person();
  CUSTOMERS.push({
    id:'CUS-'+(3500+i), name, phone:'+265 99'+(1+i%9)+' '+(200+i)+' '+(100+i*3%900+100),
    branch: pick(BRANCHES), joined: '2025-0'+(1+i%9)+'-'+(10+i%18),
    status: i%13===0 ? 'Inactive' : i%17===0 ? 'Blocked' : 'Active',
    loans: 1 + (i%4), balance: 0, dpd: 0, behaviour: 60 + (i%32)
  });
}

/* loans */
const PRINCIPALS=[1800000,2500000,3500000,4800000,6200000,8500000,12000000];
for(let i=0;i<60;i++){
  const cust = CUSTOMERS[i % CUSTOMERS.length];
  const principal = PRINCIPALS[Math.floor(R()*PRINCIPALS.length)];
  const term = pick([6,12,18,24]);
  const status = DSTATUS[i % DSTATUS.length];
  const dpd = status==='Active' ? pick([0,0,0,0,0,0,12,34,48,66,92]) : 0;
  const balanceFactor = status==='Fully Paid'||status==='Pending'||status==='Rejected'||status==='Cancelled' ? 0
    : 0.18 + R()*0.75;
  const disbMonth = 1 + (i % 10);
  LOANS.push({
    ref:'LN-2026-'+(1801+i), customer:cust.name, custId:cust.id,
    product: PRODUCTS[i % PRODUCTS.length], officer: OFFICERS[i % OFFICERS.length],
    branch: cust.branch, principal, term,
    balance: Math.round(principal*balanceFactor/10000)*10000,
    disbursed: `2026-${String(disbMonth).padStart(2,'0')}-${String(3+i%24).padStart(2,'0')}`,
    maturity: `2027-${String(((disbMonth+term/12)|0)%12+1).padStart(2,'0')}-15`,
    instalment: Math.round(principal/term*1.32/1000)*1000,
    paid: Math.round(principal*(status==='Fully Paid'?1.32:0.15+balanceFactor*0.5)/1000)*1000,
    dpd, status,
    lastPayment: dpd ? `2026-09-${String(5+i%20).padStart(2,'0')}` : `2026-10-${String(20+i%9).padStart(2,'0')}`,
    nextDue: `2026-11-${String(2+i%26).padStart(2,'0')}`,
    arrears: dpd ? Math.round(principal*0.06/1000)*1000 : 0
  });
}
/* scale balances so the book matches the programme totals used across the portal */
(function(){
  const target = 318400000;
  const sum = LOANS.reduce((a,l)=>a+l.balance,0);
  const f = sum ? target/sum : 1;
  LOANS.forEach(l=>{ l.balance = Math.round(l.balance*f/10000)*10000; });
})();

/* repayments */
const RSTATUS=['Posted','Posted','Posted','Posted','Posted','Posted','Posted','Posted','Partial','Posted','Reversed','Disputed'];
for(let i=0;i<72;i++){
  const loan = LOANS[Math.floor(R()*LOANS.length)];
  const amount = Math.round((loan.instalment*(0.6+R()*0.6))/1000)*1000;
  const interest = Math.round(amount*0.28/1000)*1000;
  const fees = Math.round(amount*0.02/1000)*1000;
  const day = 1 + (i % 29);
  REPAYS.push({
    ref:'RCP-'+(99300+i), date:`2026-10-${String(day).padStart(2,'0')}`,
    customer:loan.customer, loan:loan.ref, officer:loan.officer, branch:loan.branch,
    amount, principal: amount-interest-fees, interest, fees,
    method: METHODS[i % METHODS.length], status: RSTATUS[i % RSTATUS.length]
  });
}
/* applications = pending + approved + rejected loans plus fresh submissions */
APPS = LOANS.filter(l=>['Pending','Approved','Rejected','Cancelled'].includes(l.status)).map((l,i)=>({
  ref:'APP-2026-'+(4400+i), customer:l.customer, product:l.product, officer:l.officer,
  amount:l.principal, submitted:`2026-10-${String(1+(i*3)%28).padStart(2,'0')}`,
  days: 1+(i*3)%9, status:l.status
}));
for(let i=0;i<8;i++){
  const c = CUSTOMERS[(i*5+3)%CUSTOMERS.length];
  APPS.push({ref:'APP-2026-'+(4500+i), customer:c.name, product:PRODUCTS[i%PRODUCTS.length],
    officer:OFFICERS[i%OFFICERS.length], amount:PRINCIPALS[i%PRINCIPALS.length],
    submitted:`2026-10-${String(20+i).padStart(2,'0')}`, days:1+i%5, status:'Pending'});
}

/* officer aggregates */
STAFFAGG = OFFICERS.map(o=>{
  const mine = LOANS.filter(l=>l.officer===o);
  const reps = REPAYS.filter(r=>r.officer===o && r.status==='Posted');
  const collected = reps.reduce((a,r)=>a+r.amount,0);
  const due = mine.reduce((a,l)=>a+l.instalment,0);
  return {
    officer:o, branch: mine[0] ? mine[0].branch : '—', role:'Loan Officer',
    loans: mine.length,
    approved: mine.filter(l=>l.status!=='Rejected'&&l.status!=='Pending'&&l.status!=='Cancelled').length,
    rejected: mine.filter(l=>l.status==='Rejected').length,
    disbursed: mine.filter(l=>l.status==='Active'||l.status==='Fully Paid').length,
    collected, due, rate: due ? Math.min(99.5, collected/due*100) : 0,
    overdue: mine.filter(l=>l.dpd>0).reduce((a,l)=>a+l.balance,0)
  };
});

/* headline figures shared with the rest of the portal */
const BOOK = (()=>{
  const active = LOANS.filter(l=>l.status==='Active');
  const outstanding = LOANS.reduce((a,l)=>a+l.balance,0);
  const overdue = LOANS.filter(l=>l.dpd>0).reduce((a,l)=>a+l.balance,0);
  const collected = REPAYS.filter(r=>r.status==='Posted'||r.status==='Partial').reduce((a,r)=>a+r.amount,0);
  const principal = LOANS.reduce((a,l)=>a+l.principal,0);
  const par = d => active.filter(l=>l.dpd>=d).reduce((a,l)=>a+l.balance,0)/ (outstanding||1) *100;
  const avgDays = APPS.reduce((a,x)=>a+x.days,0)/(APPS.length||1);
  return {
    loans: LOANS.length, active: active.length,
    repaid: LOANS.filter(l=>l.status==='Fully Paid').length,
    pending: LOANS.filter(l=>l.status==='Pending').length,
    approved: LOANS.filter(l=>l.status==='Approved').length,
    rejected: LOANS.filter(l=>l.status==='Rejected').length,
    cancelled: LOANS.filter(l=>l.status==='Cancelled').length,
    principal, outstanding, overdue, collected,
    interest: REPAYS.reduce((a,r)=>a+r.interest,0),
    fees: REPAYS.reduce((a,r)=>a+r.fees,0),
    par30: par(30), par60: par(60), par90: par(90),
    avgDays, receipts: REPAYS.length,
    customers: CUSTOMERS.length,
    activeBorrowers: new Set(active.map(l=>l.customer)).size
  };
})();
