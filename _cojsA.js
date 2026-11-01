<script>
/* ============================================================
   COMPLIANCE & INTELLIGENCE (1/7)
   Formatters, the seeded book every figure is built from, and the
   inline-SVG chart engine. The book is generated once, deterministically,
   so the compliance findings always agree with the registers.
   ============================================================ */
const el = id => document.getElementById(id);
const esc = s => String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const sum = (a,f) => a.reduce((s,x)=>s+(f?Number(f(x))||0:Number(x)||0),0);
const clamp = (v,a,b) => Math.max(a, Math.min(b, v));
const pct = (a,b) => b ? (a/b*100) : 0;
const r1 = v => Math.round(v*10)/10;
const pad = (s,n) => String(s).padStart(n,'0');

/* ---------------- settings (section 15 owns them) ---------------- */
const SET = {
  currency:'MK', decimals:0, numberFormat:'comma', defaultRange:'12m', chartType:'bar',
  showGrid:true, showLegend:true, showValues:false, columns:'standard',
  sortKey:'date', sortDir:'desc', exportFormat:'csv', accessLevel:'Full', sensitive:true
};

function num(v, dec){
  const d = dec === undefined ? SET.decimals : dec;
  let n = Number(v)||0;
  let s = Math.abs(n).toFixed(d);
  const parts = s.split('.');
  if(SET.numberFormat === 'space') parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g,' ');
  else if(SET.numberFormat === 'dot') parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g,'.');
  else parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g,',');
  return (n<0?'-':'') + parts.join('.');
}
function money(v, dec){
  const sym = SET.currency === 'MWK' ? 'MWK ' : SET.currency === 'K' ? 'K' : 'MK ';
  const n = Number(v)||0;
  return sym + (n<0?'-':'') + num(Math.abs(n), dec);
}
function compact(v){
  const a = Math.abs(Number(v)||0);
  const sym = SET.currency === 'MWK' ? 'MWK ' : SET.currency === 'K' ? 'K' : 'MK ';
  const sign = v<0 ? '-' : '';
  if(a >= 1e9) return sign+sym+(a/1e9).toFixed(1)+'B';
  if(a >= 1e6) return sign+sym+(a/1e6).toFixed(a>=1e7?0:1)+'M';
  if(a >= 1e3) return sign+sym+Math.round(a/1e3)+'k';
  return sign+sym+Math.round(a);
}
const shortNum = v => {
  const a = Math.abs(Number(v)||0);
  if(a >= 1e6) return (v/1e6).toFixed(a>=1e7?0:1)+'M';
  if(a >= 1e3) return Math.round(v/1e3)+'k';
  return String(Math.round(v));
};

/* ---------------- toast + modal ---------------- */
function toast(msg, type='ok'){
  const t = document.createElement('div');
  t.className = 'toast ' + type;
  t.innerHTML = `<span>${type==='err'?'⚠':type==='info'?'ℹ':'✓'}</span><div>${msg}</div>`;
  el('toasts').appendChild(t);
  setTimeout(()=>{ t.style.opacity='0'; t.style.transform='translateX(16px)'; t.style.transition='.25s'; }, 2600);
  setTimeout(()=>t.remove(), 3000);
}
function openModal(title, sub, body, actions=[]){
  el('modalTitle').textContent = title;
  el('modalSub').textContent = sub;
  el('modalBody').innerHTML = body;
  el('modalFoot').innerHTML = '';
  actions.forEach(a=>{
    const b = document.createElement('button');
    b.className = 'btn ' + (a.cls || 'btn-ghost');
    b.textContent = a.label;
    b.onclick = a.act === 'close' ? closeModal : a.act;
    el('modalFoot').appendChild(b);
  });
  el('modal').classList.add('on');
}
function closeModal(){ el('modal').classList.remove('on'); }

/* ---------------- dates ---------------- */
const TODAY = '2026-10-30';
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DOW = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const asDate = iso => new Date(String(iso).slice(0,10) + 'T00:00:00');
const isoOf = d => d.toISOString().slice(0,10);
const addDays = (iso,n) => { const d = asDate(iso); d.setDate(d.getDate()+n); return isoOf(d); };
const addMonths = (iso,n) => { const d = asDate(iso); const day = d.getDate(); d.setDate(1); d.setMonth(d.getMonth()+n); d.setDate(Math.min(day,28)); return isoOf(d); };
const daysBetween = (a,b) => Math.round((asDate(b) - asDate(a))/86400000);
const monthKey = iso => String(iso).slice(0,7);
const monthLabel = k => MONTH_NAMES[Number(k.slice(5,7))-1] + ' ' + k.slice(2,4);
function monthsBetween(a,b){
  const A = asDate(a), B = asDate(b);
  let m = (B.getFullYear()-A.getFullYear())*12 + (B.getMonth()-A.getMonth());
  if(B.getDate() < A.getDate()) m--;
  return m;
}
function fmtDate(iso){
  if(!iso) return '—';
  const d = asDate(iso);
  return String(d.getDate()).padStart(2,'0') + ' ' + MONTH_NAMES[d.getMonth()] + ' ' + d.getFullYear();
}
const fmtShort = iso => fmtDate(iso).slice(0,6);

/* 15 months of history: Aug 2025 → Oct 2026 */
const MONTHS = (()=>{ const out=[]; let y=2025,m=8;
  for(let i=0;i<15;i++){ out.push(y+'-'+pad(m,2)); m++; if(m>12){m=1;y++;} }
  return out; })();
const MONTHS12 = MONTHS.slice(-12);

/* ---------------- seeded random ---------------- */
let SEED = 20261030;
function rnd(){ SEED = (SEED*1664525 + 1013904223) % 4294967296; return SEED/4294967296; }
function ri(a,b){ return a + Math.floor(rnd()*(b-a+1)); }
function pick(a){ return a[Math.floor(rnd()*a.length)]; }

/* ---------------- reference data ---------------- */
const PRODUCTS = [
  {id:'SL', name:'Salary Loan',     rate:0.032, min:150000, max:3000000, terms:[6,9,12,18], colour:'#C9A227'},
  {id:'BB', name:'Business Boost',  rate:0.038, min:300000, max:5000000, terms:[12,18,24],  colour:'#1E9E6A'},
  {id:'EL', name:'Emergency Loan',  rate:0.045, min:50000,  max:500000,  terms:[3,6],       colour:'#D93F3F'},
  {id:'AF', name:'Asset Finance',   rate:0.028, min:800000, max:8000000, terms:[12,24,36],  colour:'#2F6FED'},
  {id:'GL', name:'Group Lending',   rate:0.035, min:100000, max:1500000, terms:[6,12],      colour:'#7C5CF0'}
];
const REGIONS = ['Lilongwe','Blantyre','Mzuzu','Zomba'];
const METHODS = ['Airtel Money','TNM Mpamba','Bank transfer','Cash'];

const STAFF = [
  {id:'STF-001', name:'Yamikani Banda',   role:'Loan Officer',       branch:'Lilongwe', target:1800000},
  {id:'STF-002', name:'Blessings Tembo',  role:'Loan Officer',       branch:'Blantyre', target:1600000},
  {id:'STF-003', name:'Tadala Msonthi',   role:'Head of Credit',     branch:'Lilongwe', target:1200000},
  {id:'STF-004', name:'Linda Mhango',     role:'Credit Analyst',     branch:'Lilongwe', target:900000},
  {id:'STF-005', name:'Esther Mwale',     role:'Collections Officer',branch:'Lilongwe', target:700000},
  {id:'STF-006', name:'Fatsani Gondwe',   role:'Collections Officer',branch:'Blantyre', target:650000},
  {id:'STF-007', name:'Alinafe Nyirenda', role:'Cashier',            branch:'Lilongwe', target:1100000},
  {id:'STF-008', name:'Memory Phiri',     role:'Customer Care',      branch:'Mzuzu',    target:600000},
  {id:'STF-009', name:'Chikondi Mwale',   role:'Administrator',      branch:'Head office', target:0}
];
const STAFF_BY_ID = Object.fromEntries(STAFF.map(s=>[s.id,s]));
const PROD_BY_ID = Object.fromEntries(PRODUCTS.map(p=>[p.id,p]));

/* ---------------- customers ---------------- */
const FIRST = ['Chisomo','Thoko','Mphatso','Tadala','Limbani','Yamikani','Alinafe','Mavuto','Chimwemwe','Fatsani',
  'Blessings','Pemphero','Tiyamike','Wongani','Zikomo','Memory','Esther','Ruth','Grace','Linda',
  'Madalitso','Dalitso','Chifundo','Ekari','Steven','Patrick','Joyce','Lucy','Gift','Isaac'];
const LAST = ['Banda','Phiri','Mwale','Tembo','Gondwe','Nyirenda','Mhango','Kachale','Msiska','Chirwa',
  'Kumwenda','Zulu','Mbewe','Kalua','Nkhoma','Chikwakwa','Mponda','Jere','Sibande','Kaunda'];
const NAMES = [];
(function(){
  let i=0;
  while(NAMES.length < 64 && i < 400){
    const n = FIRST[(i*7+3)%FIRST.length] + ' ' + LAST[(i*5+1)%LAST.length];
    if(!NAMES.includes(n)) NAMES.push(n);
    i++;
  }
})();

const CUSTOMERS = NAMES.slice(0,60).map((name,i)=>{
  const region = REGIONS[i % 4 === 3 ? 1 : i % 4];
  const joined = addDays(addMonths(MONTHS[0]+'-15', ri(0,14)), ri(0,26));
  const inactive = i % 11 === 5;
  return {
    id:'GF-' + pad(480+i,6), name,
    phone:'+265 ' + pick(['99','88','99','88']) + ' ' + pad(ri(100,999),3) + ' ' + pad(ri(100,999),3),
    region, joined,
    status: inactive ? 'Inactive' : 'Active',
    kyc: i % 13 === 7 ? 'Pending' : 'Verified',
    occupation: pick(['Trader','Teacher','Civil servant','Farmer','Driver','Shop owner','Nurse','Contractor']),
    income: ri(90,620)*1000,
    repeat: i % 3 === 0
  };
});
const CUST_BY_ID = Object.fromEntries(CUSTOMERS.map(c=>[c.id,c]));

/* ---------------- applications ---------------- */
const APP_COUNT = 132;
const APPS = [];
let appSeq = 101;
for(let i=0;i<APP_COUNT;i++){
  const cust = CUSTOMERS[i % CUSTOMERS.length];
  const prod = PRODUCTS[(i*3 + Math.floor(i/5)) % PRODUCTS.length];
  const amount = Math.round((prod.min + rnd()*(prod.max-prod.min))/50000)*50000;
  const term = pick(prod.terms);
  /* applications spread over 14 months, newest in the last three weeks */
  const back = i < 14 ? ri(0,20) : ri(21, 420);
  const submitted = addDays(TODAY, -back);
  const officer = pick(STAFF.filter(s=>['Loan Officer','Credit Analyst','Head of Credit'].includes(s.role)));
  let status, decided = '', reason = '';
  if(back < 12) status = rnd() < 0.55 ? 'Pending' : (rnd()<0.7 ? 'Approved' : 'Rejected');
  else { const r = rnd(); status = r < 0.62 ? 'Approved' : r < 0.86 ? 'Rejected' : r < 0.95 ? 'Pending' : 'Withdrawn'; }
  if(status !== 'Pending') decided = addDays(submitted, ri(1,9));
  if(status === 'Rejected') reason = pick(['Affordability below policy','Weak credit history','Incomplete documents','Duplicate application','Already at exposure limit']);
  APPS.push({ref:'APP-2026-' + pad(appSeq++,4), cust:cust.id, product:prod.id, amount, term,
    submitted, status, decided, officer:officer.id, region:cust.region, reason});
}
APPS.sort((a,b)=> a.submitted < b.submitted ? 1 : -1);

/* ---------------- loans ---------------- */
const LOANS = [];
let loanSeq = 2401;
APPS.filter(a=>a.status === 'Approved').forEach(a=>{
  const prod = PROD_BY_ID[a.product];
  const disbursed = addDays(a.decided || a.submitted, ri(1,9));
  const elapsed = monthsBetween(disbursed, TODAY);
  let status = 'Active';
  if(elapsed >= a.term && rnd() < 0.86) status = 'Closed';
  else if(rnd() < 0.035) status = 'Written off';
  LOANS.push({
    ref:'LN-' + loanSeq++, app:a.ref, cust:a.cust, product:a.product, amount:a.amount, term:a.term,
    rate:prod.rate, officer:a.officer, region:a.region, date:disbursed, status,
    flatInterest: Math.round(a.amount * prod.rate * a.term)
  });
});
const LOAN_BY_REF = Object.fromEntries(LOANS.map(l=>[l.ref,l]));

/* ---------------- disbursements ---------------- */
let disbSeq = 401;
const DISB = [];
LOANS.forEach(l=>{
  const fee = Math.round(l.amount * 0.015);
  const method = l.amount > 1500000 ? 'Bank transfer' : pick(METHODS);
  DISB.push({ref:'DSB-2026-' + pad(disbSeq++,4), loan:l.ref, date:l.date, amount:l.amount,
    approved:l.amount, method, officer:l.officer, status:'Successful', fee});
});
/* a handful of failed and reversed payouts, plus pre-approval changes */
for(let i=0;i<9;i++){
  const l = LOANS[ri(0, LOANS.length-1)];
  if(!l) break;
  DISB.push({ref:'DSB-2026-' + pad(disbSeq++,4), loan:l.ref, date:addDays(l.date, -ri(1,3)),
    amount:l.amount, approved:l.amount + (i%3===0 ? ri(1,5)*50000 : 0),
    method:pick(METHODS), officer:pick(STAFF.filter(s=>['Cashier','Head of Credit'].includes(s.role))).id,
    status: i < 5 ? 'Failed' : 'Reversed', fee:Math.round(l.amount*0.015)});
}
DISB.sort((a,b)=> a.date < b.date ? 1 : -1);

/* ---------------- payments ---------------- */
const PAYS = [];
let paySeq = 4800, rcSeed = 1;
LOANS.forEach(l=>{
  const inst = Math.round((l.amount + l.flatInterest)/l.term);
  const princ = Math.round(l.amount/l.term);
  const intr = Math.round(l.flatInterest/l.term);
  const elapsed = monthsBetween(l.date, TODAY);
  const dueSoFar = clamp(elapsed + 1, 0, l.term);
  const toPay = l.status === 'Closed' ? l.term
    : l.status === 'Written off' ? Math.max(0, dueSoFar - ri(2,4))
    : (rnd() < 0.16 ? Math.max(0, dueSoFar - ri(1,3)) : dueSoFar);
  for(let k=0;k<Math.min(toPay,l.term);k++){
    const due = addMonths(l.date, k+1);
    if(due > TODAY) break;
    const partial = rnd() < 0.12;
    const late = rnd() < (partial ? 0.5 : 0.2);
    const paidOn = late ? addDays(due, ri(2, 42)) : addDays(due, ri(-6, 0));
    const amount = partial ? Math.round(inst * (0.4 + rnd()*0.4)) : inst;
    const ratio = partial ? amount/inst : 1;
    const feePart = late ? 2500 : 0;
    const principalPart = Math.min(Math.round(princ*ratio), Math.max(0, amount - feePart));
    PAYS.push({
      ref:'RC-' + pad(paySeq++,4), receipt:'RCP-' + pad(rcSeed++,5),
      loan:l.ref, cust:l.cust, date:paidOn, due,
      amount, principal:principalPart, interest:Math.max(0, amount - principalPart - feePart),
      fees: feePart,
      method: pick(METHODS), officer: pick(STAFF.filter(s=>['Cashier','Collections Officer','Loan Officer'].includes(s.role))).id,
      status: partial ? 'Partial' : 'Full',
      timing: late ? 'Late' : 'On time', daysLate: late ? Math.max(1, daysBetween(due, paidOn)) : 0
    });
  }
});
PAYS.sort((a,b)=> a.date < b.date ? 1 : -1);

/* per-loan roll-ups */
const PAYS_BY_LOAN = {};
PAYS.forEach(p=>{ (PAYS_BY_LOAN[p.loan] = PAYS_BY_LOAN[p.loan] || []).push(p); });

LOANS.forEach(l=>{
  const mine = PAYS_BY_LOAN[l.ref] || [];
  const inst = Math.round((l.amount + l.flatInterest)/l.term);
  l.instalment = inst;
  l.paidPrincipal = Math.min(l.amount, sum(mine, p=>p.principal));
  l.paidInterest = sum(mine, p=>p.interest);
  l.paidFees = sum(mine, p=>p.fees);
  l.collected = sum(mine, p=>p.amount);
  l.paidCount = mine.reduce((s,p)=> s + (p.status === 'Full' ? 1 : 0.5), 0);
  l.outstanding = Math.max(0, l.amount - l.paidPrincipal);
  const elapsed = monthsBetween(l.date, TODAY);
  const dueInst = clamp(elapsed, 0, l.term);
  const unpaid = l.status === 'Closed' ? 0 : Math.max(0, dueInst - l.paidCount);
  l.unpaidInstalments = Math.round(unpaid);
  l.arrears = unpaid >= 1 ? Math.round(unpaid * inst) : 0;
  const jitter = (Number(String(l.ref).replace(/\D/g, '')) % 9);
  l.dpd = l.arrears > 0 ? Math.round(Math.min(360, (l.unpaidInstalments - 1) * 30 + 1 + jitter)) : 0;
  l.ageBucket = l.arrears === 0 ? 'Current' : l.dpd <= 30 ? '1–30 days' : l.dpd <= 60 ? '31–60 days'
    : l.dpd <= 90 ? '61–90 days' : l.dpd <= 180 ? '91–180 days' : '180+ days';
  l.totalInterest = l.flatInterest;
});

/* ---------------- expenses, targets, audit, transactions ---------------- */
const EXPENSES = MONTHS.map((mk,i)=>({
  month:mk,
  salaries: 1450000 + (i%5)*25000,
  rent: 420000,
  utilities: 165000 + (i%4)*18000,
  marketing: 240000 + (i%3)*60000,
  transport: 305000 + (i%6)*22000
}));
const expenseTotal = m => m.salaries+m.rent+m.utilities+m.marketing+m.transport;

const TARGETS = {};
MONTHS.forEach((mk,i)=>{ TARGETS[mk] = { disburse: 2600000 + i*60000, collect: 2400000 + i*55000 }; });

const AUDITS = [];
(function(){
  const acts = [
    ['Loan application approved','Approved'],['Repayment recorded','Full'],['Customer registered','Success'],
    ['Disbursement confirmed','Success'],['Loan application rejected','Rejected'],['User login','Success'],
    ['Permission changed','Success'],['System error','Failed'],['Report exported','Success'],
    ['Arrears status changed','Success'],['Customer profile updated','Success'],['Session revoked','Success'],
    ['Disbursement failed','Failed'],['Loan closed','Success'],['Settings changed','Success']
  ];
  const mods = ['Loan Applications','Repayments','Customers','Disbursements','Authentication','Permissions','System','Reports','Settings'];
  for(let i=0;i<140;i++){
    const a = acts[i % acts.length];
    const user = pick(STAFF);
    const loan = LOANS[ri(0,LOANS.length-1)];
    AUDITS.push({
      id:'AUD-2026-' + pad(9000-i,6),
      ts: addDays(TODAY, -Math.floor(i/6)) + ' ' + pad(8 + (i%9),2) + ':' + pad((i*7)%60,2) + ':' + pad((i*13)%60,2),
      user:user.name, role:user.role, action:a[0], outcome:a[1], module:mods[i%mods.length],
      record: loan ? loan.ref : 'GF-000480'
    });
  }
})();

const TXNS = [];
let txnSeq = 91001;
DISB.forEach(d=> TXNS.push({ref:'TXN-' + txnSeq++, date:d.date, type:'Disbursement', direction:'Out',
  amount:d.amount, loan:d.loan, method:d.method, status:d.status === 'Successful' ? 'Posted' : d.status}));
PAYS.forEach(p=> TXNS.push({ref:'TXN-' + txnSeq++, date:p.date, type:'Repayment', direction:'In',
  amount:p.amount, loan:p.loan, method:p.method, status:'Posted'}));
for(let i=0;i<24;i++){
  const l = LOANS[ri(0,LOANS.length-1)];
  TXNS.push({ref:'TXN-' + txnSeq++, date:addDays(TODAY,-ri(0,300)), type: i%4===0?'Fee':'Adjustment',
    direction: i%3===0?'Out':'In', amount: ri(2,40)*1000, loan:l.ref, method:'Internal', status:'Posted'});
}
TXNS.sort((a,b)=> a.date < b.date ? 1 : -1);

/* ---------------- chart engine ---------------- */
const PALETTE = ['#C9A227','#1E9E6A','#2F6FED','#D93F3F','#7C5CF0','#E08C1E','#0E9AA7','#8A90A0','#B58C1B','#4A5160'];

function niceMax(v){
  if(!isFinite(v) || v <= 0) return 10;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v/p;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10;
  return step*p;
}
function axisFmt(v){
  const a = Math.abs(v);
  if(a >= 1e6) return (v/1e6).toFixed(a>=1e7?0:1)+'M';
  if(a >= 1e3) return Math.round(v/1e3)+'k';
  return String(Math.round(v*10)/10);
}

function chart(o){
  const type = o.type || 'bar';
  const series = (o.series||[]).filter(s=>s && s.data);
  const cats = o.cats || (series[0] ? series[0].data.map((_,i)=> String(i+1)) : []);
  const H = o.h || 210;
  if(!series.length || !series.some(s=> s.data.some(v=> Number(v)!==0))){
    return `<div class="empty" style="padding:26px 0">No data for the selected filters.</div>`;
  }
  if(type === 'pie' || type === 'donut'){
    const vals = series[0].data.map((v,i)=>({label: cats[i], value: Number(v)||0, colour: (o.colours||PALETTE)[i%PALETTE.length]}));
    return pieSvg(vals, type === 'donut', H) + legend(vals.map(v=>({name:v.label, colour:v.colour})));
  }
  return cartesian({...o, type, series, cats, H});
}

function legend(items){
  if(!SET.showLegend) return '';
  return `<div class="legend">${items.map(i=>`<b><i style="background:${i.colour}"></i>${esc(i.name)}</b>`).join('')}</div>`;
}

function pieSvg(items, donut, H){
  const total = items.reduce((s,i)=>s+i.value,0) || 1;
  const W = 380, h = H, cx = 120, cy = h/2, R = Math.min(h/2-8, 88), r = donut ? R*0.58 : 0;
  let a0 = -Math.PI/2, out = '';
  items.forEach(it=>{
    const frac = it.value/total;
    const a1 = a0 + frac*Math.PI*2;
    const large = frac > 0.5 ? 1 : 0;
    const x0 = cx + R*Math.cos(a0), y0 = cy + R*Math.sin(a0);
    const x1 = cx + R*Math.cos(a1), y1 = cy + R*Math.sin(a1);
    let d;
    if(frac > 0.999){
      d = `M ${cx} ${cy-R} A ${R} ${R} 0 1 1 ${cx-0.01} ${cy-R} Z`;
    } else if(donut){
      const ix0 = cx + r*Math.cos(a1), iy0 = cy + r*Math.sin(a1);
      const ix1 = cx + r*Math.cos(a0), iy1 = cy + r*Math.sin(a0);
      d = `M ${x0.toFixed(1)} ${y0.toFixed(1)} A ${R} ${R} 0 ${large} 1 ${x1.toFixed(1)} ${y1.toFixed(1)} L ${ix0.toFixed(1)} ${iy0.toFixed(1)} A ${r} ${r} 0 ${large} 0 ${ix1.toFixed(1)} ${iy1.toFixed(1)} Z`;
    } else {
      d = `M ${cx} ${cy} L ${x0.toFixed(1)} ${y0.toFixed(1)} A ${R} ${R} 0 ${large} 1 ${x1.toFixed(1)} ${y1.toFixed(1)} Z`;
    }
    out += `<path d="${d}" fill="${it.colour}" stroke="#fff" stroke-width="1.5"><title>${esc(it.label)}: ${num(it.value)} (${(frac*100).toFixed(1)}%)</title></path>`;
    a0 = a1;
  });
  const centre = donut ? `<text x="${cx}" y="${cy-2}" text-anchor="middle" font-size="15" font-weight="800" fill="#0F1115">${num(total)}</text>
    <text x="${cx}" y="${cy+13}" text-anchor="middle" font-size="9" fill="#6B7280">TOTAL</text>` : '';
  const rows = items.map((it,i)=>`
    <g>
      <rect x="236" y="${16+i*20}" width="9" height="9" rx="2" fill="${it.colour}"></rect>
      <text x="251" y="${24+i*20}" font-size="10" fill="#2B303B">${esc(String(it.label).slice(0,22))}</text>
      <text x="366" y="${24+i*20}" font-size="10" text-anchor="end" fill="#6B7280">${(it.value/total*100).toFixed(1)}%</text>
    </g>`).join('');
  return `<div class="chartsvg"><svg viewBox="0 0 ${W} ${h}" role="img" aria-label="${esc(o_label||'chart')}">${out}${centre}${rows}</svg></div>`;
}
const o_label = 'chart';

function cartesian(o){
  const {type, series, cats, H} = o;
  const stacked = type === 'stacked';
  const W = 720, padL = 52, padR = 12, padT = 14;
  const padB = cats.length > 9 ? 40 : 26;
  const iw = W - padL - padR, ih = H - padT - padB;
  let maxV;
  if(stacked){
    maxV = Math.max(...cats.map((_,i)=> series.reduce((s,x)=> s + (Number(x.data[i])||0), 0)));
  } else {
    maxV = Math.max(...series.map(s=> Math.max(...s.data.map(v=> Number(v)||0))));
  }
  const minV = Math.min(0, ...series.flatMap(s=> s.data.map(v=> Number(v)||0)));
  const top = niceMax(maxV || 1);
  const bot = minV < 0 ? -niceMax(-minV) : 0;
  const y = v => padT + ih - ((v - bot)/(top - bot))*ih;
  const stepX = cats.length ? iw/cats.length : iw;
  let g = '';
  /* grid */
  const ticks = 4;
  for(let i=0;i<=ticks;i++){
    const v = bot + (top-bot)*i/ticks;
    const yy = y(v);
    g += `<line x1="${padL}" y1="${yy.toFixed(1)}" x2="${W-padR}" y2="${yy.toFixed(1)}" stroke="#EDEFF4" stroke-width="1" ${SET.showGrid?'':'opacity="0"'}/>`;
    g += `<text x="${padL-7}" y="${(yy+3).toFixed(1)}" font-size="9" text-anchor="end" fill="#8A90A0">${axisFmt(v)}</text>`;
  }
  /* x labels */
  cats.forEach((c,i)=>{
    const x = padL + stepX*i + stepX/2;
    const label = String(c);
    if(cats.length > 9 && i % 2) return;
    g += `<text x="${x.toFixed(1)}" y="${H-8}" font-size="9" text-anchor="middle" fill="#8A90A0">${esc(label)}</text>`;
  });
  if(type === 'bar' || type === 'stacked'){
    const bw = stacked ? Math.min(38, stepX*0.62) : Math.min(22, stepX*0.7/series.length);
    cats.forEach((c,i)=>{
      let acc = 0;
      series.forEach((s,si)=>{
        const v = Number(s.data[i])||0;
        const colour = s.colour || PALETTE[si%PALETTE.length];
        if(stacked){
          const y0 = y(acc + v), y1 = y(acc);
          const x = padL + stepX*i + stepX/2 - bw/2;
          if(v) g += `<rect x="${x.toFixed(1)}" y="${y0.toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(0,(y1-y0)).toFixed(1)}" fill="${colour}" rx="1.5"><title>${esc(s.name)} · ${esc(String(c))}: ${num(v)}</title></rect>`;
          acc += v;
        } else {
          const x = padL + stepX*i + stepX/2 - (bw*series.length)/2 + si*bw;
          const y0 = y(Math.max(0,v)), y1 = y(Math.max(0,0));
          const yTop = v >= 0 ? y0 : y(0);
          const hgt = Math.abs(y(v) - y(0));
          g += `<rect x="${x.toFixed(1)}" y="${(v>=0?y(v):y(0)).toFixed(1)}" width="${Math.max(2,bw-1).toFixed(1)}" height="${Math.max(0,hgt).toFixed(1)}" fill="${colour}" rx="1.5"><title>${esc(s.name)} · ${esc(String(c))}: ${num(v)}</title></rect>`;
          if(SET.showValues && v && cats.length <= 14)
            g += `<text x="${(x+bw/2).toFixed(1)}" y="${(y(v)-3).toFixed(1)}" font-size="8" text-anchor="middle" fill="#6B7280">${shortNum(v)}</text>`;
        }
      });
    });
  } else {
    series.forEach((s,si)=>{
      const colour = s.colour || PALETTE[si%PALETTE.length];
      const pts = s.data.map((v,i)=> [padL + stepX*i + stepX/2, y(Number(v)||0)]);
      if(type === 'area'){
        const base = y(0);
        const path = `M ${pts[0][0].toFixed(1)} ${base.toFixed(1)} ` + pts.map(p=>`L ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ') + ` L ${pts[pts.length-1][0].toFixed(1)} ${base.toFixed(1)} Z`;
        g += `<path d="${path}" fill="${colour}" opacity="0.16"></path>`;
      }
      g += `<polyline fill="none" stroke="${colour}" stroke-width="2.2" stroke-linejoin="round" points="${pts.map(p=>p[0].toFixed(1)+','+p[1].toFixed(1)).join(' ')}"></polyline>`;
      pts.forEach((p,i)=>{
        g += `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="2.6" fill="#fff" stroke="${colour}" stroke-width="2"><title>${esc(s.name)} · ${esc(String(cats[i]))}: ${num(s.data[i])}</title></circle>`;
        if(SET.showValues && cats.length <= 14)
          g += `<text x="${p[0].toFixed(1)}" y="${(p[1]-7).toFixed(1)}" font-size="8" text-anchor="middle" fill="#6B7280">${shortNum(Number(s.data[i])||0)}</text>`;
      });
    });
  }
  return `<div class="chartsvg"><svg viewBox="0 0 ${W} ${H}" role="img">${g}</svg></div>` +
    legend(series.map((s,i)=>({name:s.name, colour:s.colour || PALETTE[i%PALETTE.length]})));
}

/* card wrapper used by every graph section */
function chartCard(o){
  const body = o.chart || '';
  return `<div class="chartcard">
    <div class="ch">
      <div><div class="ct">${esc(o.title)}</div><div class="cs">${esc(o.sub || '')}</div></div>
      <div style="text-align:right">${o.value !== undefined ? `<div class="cv">${o.value}</div>` : ''}
        ${o.delta !== undefined ? delta(o.delta) : ''}</div>
    </div>
    ${body}
    ${o.note ? `<div class="qhint">${o.note}</div>` : ''}
  </div>`;
}
function delta(v, invert){
  const good = invert ? v <= 0 : v >= 0;
  const cls = Math.abs(v) < 0.05 ? 'flat' : good ? 'up' : 'down';
  const arrow = Math.abs(v) < 0.05 ? '→' : v > 0 ? '▲' : '▼';
  const mag = Math.abs(v);
  // A percentage beyond 999% on a thin base reads as noise — show a multiplier instead.
  const text = mag >= 999.5 ? num(Math.round(mag/100)) + '×' : mag.toFixed(1) + '%';
  return `<span class="delta ${cls}">${arrow} ${text}</span>`;
}

function expenseForBucket(key){
  const k = String(key);
  let total = 0, divisor = 1;
  if(k.length === 4) total = sum(EXPENSES.filter(e=> e.month.slice(0,4) === k), expenseTotal);
  else {
    const mk = k.slice(0,7);
    total = sum(EXPENSES.filter(e=> e.month === mk), expenseTotal);
    if(FILTER.grain === 'day') divisor = 30;
    else if(FILTER.grain === 'week') divisor = 30/7;
  }
  return total/divisor;
}

function expectedByBucket(loans){
  const keys = buckets();
  const monthDue = {};
  loans.forEach(l=>{
    for(let k=1;k<=l.term;k++){
      const mk = addMonths(l.date, k).slice(0,7);
      monthDue[mk] = (monthDue[mk]||0) + l.instalment;
    }
  });
  return keys.map(key=>{
    if(FILTER.grain === 'year')
      return Object.entries(monthDue).filter(([m])=> m.slice(0,4) === key).reduce((s,[,v])=> s+v, 0);
    const mk = FILTER.grain === 'month' ? key : key.slice(0,7);
    const factor = FILTER.grain === 'day' ? 1/30 : FILTER.grain === 'week' ? 7/30 : 1;
    return (monthDue[mk]||0) * factor;
  });
}

const kpiCard = (l, v, s, k='') => `<div class="kpi ${k}"><div class="kl">${l}</div><div class="kv">${v}</div><div class="ks">${s}</div></div>`;

/* ---------------- reference extras ---------------- */
const AGES = ['Current','1–30 days','31–60 days','61–90 days','91–180 days','180+ days'];
const PROD_SHORT = {SL:'Salary', BB:'Business', EL:'Emergency', AF:'Asset', GL:'Group'};
const pShort = id => PROD_SHORT[id] || prodName(id);

/* money formatting helper that always keeps the sign inside the symbol */
const moneySigned = v => money(v);

const TASKS = [
  {id:'TSK-1041', staff:'STF-005', title:'Chase 12 accounts over 60 days', due:'2026-11-02', status:'Open', priority:'High'},
  {id:'TSK-1042', staff:'STF-006', title:'Verify bank deposits for week 43', due:'2026-10-31', status:'Open', priority:'Medium'},
  {id:'TSK-1043', staff:'STF-001', title:'Site visit — Zomba trading group', due:'2026-11-04', status:'Open', priority:'Medium'},
  {id:'TSK-1044', staff:'STF-003', title:'Approve the pending credit queue', due:'2026-10-30', status:'Open', priority:'High'},
  {id:'TSK-1045', staff:'STF-002', title:'Collect ID copies for three applications', due:'2026-11-06', status:'Open', priority:'Low'},
  {id:'TSK-1046', staff:'STF-004', title:'Re-appraise two restructured facilities', due:'2026-11-03', status:'Open', priority:'Medium'},
  {id:'TSK-1047', staff:'STF-007', title:'Reconcile the cashbook to the bank', due:'2026-10-30', status:'Open', priority:'High'},
  {id:'TSK-1048', staff:'STF-008', title:'Follow up on KYC pending file', due:'2026-11-05', status:'Open', priority:'Low'},
  {id:'TSK-1049', staff:'STF-005', title:'Prepare the weekly arrears report', due:'2026-10-29', status:'Done', priority:'Medium'},
  {id:'TSK-1050', staff:'STF-006', title:'Call customers in the 31–60 bucket', due:'2026-10-28', status:'Done', priority:'Medium'}
];

function periodMonths(){
  const d = Math.max(1, daysBetween(FILTER.from, FILTER.to));
  return Math.max(0.2, d/30.4);
}
</script>
