
/* ============================================================
   SHARED REPORT PLUMBING
   ============================================================ */
const CATS = [
  {key:'Executive',  n:1, name:'Executive Summary'},
  {key:'Portfolio',  n:2, name:'Loan Portfolio'},
  {key:'Repayments', n:3, name:'Repayments'},
  {key:'Arrears',    n:4, name:'Arrears & Delinquency'},
  {key:'Financial',  n:5, name:'Financial'},
  {key:'Customers',  n:6, name:'Customers'},
  {key:'Applications', n:7, name:'Applications & Disbursement'},
  {key:'Staff',      n:8, name:'Staff & Officer Performance'},
  {key:'Risk',       n:9, name:'Risk & Credit'},
  {key:'Audit',      n:10, name:'Audit, Compliance & Statements'}
];

const COLS = {
  loans: ['Loan','Customer','Product','Officer','Branch','Principal','Balance','DPD','Status'],
  reps:  ['Receipt','Date','Customer','Loan','Principal','Interest','Fees','Total','Method','Status'],
  custs: ['Customer','Phone','Branch','Joined','Loans','Outstanding','DPD','Status'],
  apps:  ['Application','Customer','Product','Officer','Submitted','Days','Amount','Status'],
  staff: ['Officer','Branch','Loans','Approved','Rejected','Disbursed','Collected','Rate','Overdue']
};

const chip = s => {
  const m = {Active:'st-ok','Fully Paid':'st-ok','Fully Repaid':'st-ok',Approved:'st-ok',Posted:'st-ok',
    Pending:'st-await','In Progress':'st-proc',Rejected:'st-fail',Cancelled:'st-canc',Reversed:'st-fail',
    Disputed:'st-rev',Partial:'st-await',Inactive:'st-canc',Blocked:'st-fail',Overdue:'st-fail',
    'Non-Performing':'st-fail','Restructured':'st-await',Current:'st-ok'};
  return `<span class="chip ${m[s]||'st-canc'}">${s}</span>`;
};
const dpdChip = d => d>=90 ? `<span class="chip st-fail">${d}</span>`
  : d>=30 ? `<span class="chip st-await">${d}</span>`
  : d>0 ? `<span class="chip st-proc">${d}</span>` : '<span class="muted">—</span>';

const ROW = {
  loans: l => [l.ref, l.customer, l.product, l.officer, l.branch, mk(l.principal), mk(l.balance), dpdChip(l.dpd), chip(l.status)],
  reps:  r => [r.ref, r.date, r.customer, r.loan, mk(r.principal), mk(r.interest), mk(r.fees), mk(r.amount), r.method, chip(r.status)],
  custs: c => [c.name, c.phone, c.branch, c.joined, c.loans, mk(c.balance), dpdChip(c.dpd), chip(c.status)],
  apps:  a => [a.ref, a.customer, a.product, a.officer, a.submitted, a.days + ' d', mk(a.amount), chip(a.status)],
  staff: s => [s.officer, s.branch, s.loans, s.approved, s.rejected, s.disbursed, mk(s.collected), s.rate.toFixed(1)+'%', mk(s.overdue)]
};

/* date range semantics: repayments/applications are transactional (between),
   loans and customers are "as at" reports (up to the end date) */
function baseFilter(x, f, src){
  const d = src==='reps' ? x.date : src==='apps' ? x.submitted : src==='loans' ? x.disbursed : x.joined;
  if(f.to && d > f.to) return false;
  if(src==='reps' || src==='apps'){ if(f.from && d < f.from) return false; }
  if(f.officer && x.officer !== f.officer) return false;
  if(f.branch && (x.branch||'') !== f.branch) return false;
  if(f.product && x.product !== f.product) return false;
  return true;
}
function matchQ(rowArr, q){
  if(!q) return true;
  return rowArr.join(' ').toLowerCase().includes(q.toLowerCase());
}
function applyAdv(rows, f, amountIdx){
  if(f.min != null && amountIdx!=null) rows = rows.filter(r=>numOf(r[amountIdx]) >= f.min);
  if(f.max != null && amountIdx!=null) rows = rows.filter(r=>numOf(r[amountIdx]) <= f.max);
  if(f.ref) rows = rows.filter(r=>r.join(' ').toLowerCase().includes(f.ref.toLowerCase()));
  if(f.sort==='amt-desc' && amountIdx!=null) rows = rows.slice().sort((a,b)=>numOf(b[amountIdx])-numOf(a[amountIdx]));
  if(f.sort==='amt-asc' && amountIdx!=null) rows = rows.slice().sort((a,b)=>numOf(a[amountIdx])-numOf(b[amountIdx]));
  return rows;
}
const numOf = v => typeof v==='number' ? v : Number(String(v).replace(/[^0-9.-]/g,'')) || 0;

function groupSum(arr, keyFn){ const m=new Map(); arr.forEach(x=>{const k=keyFn(x); m.set(k,(m.get(k)||0)+1);}); return m; }

/* ---------- per-source statistics shown above the table ---------- */
const STATS = {
  loans: set => [
    {k:'Records', v:set.length, s:'loans in this view'},
    {k:'Principal', v:mkm(set.reduce((a,l)=>a+l.principal,0)), s:'original amounts'},
    {k:'Outstanding', v:mkm(set.reduce((a,l)=>a+l.balance,0)), s:'closing balances'},
    {k:'Overdue', v:mkm(set.filter(l=>l.dpd>0).reduce((a,l)=>a+l.balance,0)), s:'past due'}
  ],
  reps: set => [
    {k:'Receipts', v:set.length, s:'payment records'},
    {k:'Collected', v:mkm(set.reduce((a,r)=>a+r.amount,0)), s:'cash received'},
    {k:'Principal', v:mkm(set.reduce((a,r)=>a+r.principal,0)), s:'capital recovered'},
    {k:'Interest & fees', v:mkm(set.reduce((a,r)=>a+r.interest+r.fees,0)), s:'income portion'}
  ],
  custs: set => [
    {k:'Customers', v:set.length, s:'in this view'},
    {k:'Borrowing', v:set.filter(c=>c.loans>0).length, s:'have credit history'},
    {k:'Outstanding', v:mkm(set.reduce((a,c)=>a+c.balance,0)), s:'total balances'},
    {k:'In arrears', v:set.filter(c=>c.dpd>0).length, s:'accounts past due'}
  ],
  apps: set => [
    {k:'Applications', v:set.length, s:'submitted'},
    {k:'Requested', v:mkm(set.reduce((a,x)=>a+x.amount,0)), s:'total asked'},
    {k:'Avg processing', v:(set.reduce((a,x)=>a+x.days,0)/(set.length||1)).toFixed(1)+' d', s:'submission to decision'},
    {k:'Approved', v:set.filter(x=>x.status==='Approved'||x.status==='Active').length, s:'favourable decisions'}
  ],
  staff: set => [
    {k:'Officers', v:set.length, s:'in this view'},
    {k:'Loans', v:set.reduce((a,s)=>a+s.loans,0), s:'processed'},
    {k:'Collected', v:mkm(set.reduce((a,s)=>a+s.collected,0)), s:'repayments'},
    {k:'Avg rate', v:pct(set.reduce((a,s)=>a+s.collected,0), set.reduce((a,s)=>a+s.due,0)), s:'collection efficiency'}
  ]
};

/* ============================================================
   CATEGORY 1 · EXECUTIVE SUMMARY
   ============================================================ */
const MONTHS = ['May','Jun','Jul','Aug','Sep','Oct'];
function monthlyRow(m, i){
  const disb = 11.2 + i*0.9, coll = 14.6 + i*1.1, over = 5.4 - i*0.22;
  return [m, mk(disb*1e6), mk(coll*1e6), mk(over*1e6),
    pct(coll, disb*1.32), (240+i*12) + ' loans'];
}
const R_EXE = [
  {id:'EXE-01', n:'Overall Business Performance', d:'Headline loans, collections, portfolio and arrears for the period',
   src:'custom', cols:['Metric','Value','Benchmark','Variance','Status'],
   rows: f => [
     ['Loans disbursed', mk(BOOK.principal*0.32), 'MK 148.0M', '+12.4%', chip('Active')],
     ['Repayments collected', mk(BOOK.collected), 'MK 92.0M', '+4.8%', chip('Active')],
     ['Portfolio outstanding', mkm(BOOK.outstanding), 'MK 300.0M', '+6.1%', chip('Active')],
     ['Portfolio at risk (30+)', BOOK.par30.toFixed(1)+'%', '≤ 8.0%', '+1.1 pp', chip('Restructured')],
     ['Active borrowers', nf(BOOK.activeBorrowers), '820', '+2.7%', chip('Active')],
     ['New applications', nf(APPS.length), '58', '+9.0%', chip('Pending')]
   ]},
  {id:'EXE-02', n:'Financial Performance Summary', d:'Revenue, cost and profit for the selected period',
   src:'custom', cols:['Line','Amount','Share','Change','Comment'],
   rows: f => {
     const interest = BOOK.interest, fees = BOOK.fees, cost = BOOK.interest*0.34;
     const rev = interest+fees;
     return [
       ['Interest income', mk(interest), pct(interest,rev), '+6.2%', 'Core lending margin'],
       ['Fees and penalties', mk(fees), pct(fees,rev), '+2.1%', 'Processing and late fees'],
       ['Operating costs', '(' + mk(cost) + ')', pct(cost,rev), '+3.4%', 'Staff, rent, providers'],
       ['Net profit', mk(rev-cost), pct(rev-cost,rev), '+9.8%', 'Before tax'],
       ['Cost-to-income', pct(cost,rev), '—', '−0.8 pp', 'Efficiency improving']
     ];
   }},
  {id:'EXE-03', n:'Loan Portfolio Summary', d:'Book by product with balances and arrears',
   src:'custom', cols:['Product','Loans','Principal','Outstanding','Overdue','% of book'],
   rows: f => PRODUCTS.map(p=>{
     const set = LOANS.filter(l=>l.product===p);
     const out = set.reduce((a,l)=>a+l.balance,0);
     return [p, set.length, mkm(set.reduce((a,l)=>a+l.principal,0)), mkm(out),
       mkm(set.filter(l=>l.dpd>0).reduce((a,l)=>a+l.balance,0)), pct(out, BOOK.outstanding)];
   })},
  {id:'EXE-04', n:'Repayment Collection Summary', d:'Collections by channel and payment status',
   src:'custom', cols:['Channel','Receipts','Collected','Principal','Interest & fees','Share'],
   rows: f => METHODS.map(m=>{
     const set = REPAYS.filter(r=>r.method===m);
     const amt = set.reduce((a,r)=>a+r.amount,0);
     return [m, set.length, mk(amt), mk(set.reduce((a,r)=>a+r.principal,0)),
       mk(set.reduce((a,r)=>a+r.interest+r.fees,0)), pct(amt, BOOK.collected)];
   })},
  {id:'EXE-05', n:'Outstanding Loan Balances', d:'Largest balances with ageing and officer',
   src:'loans', filter:(l,f)=>l.balance>0, cols:COLS.loans, row:ROW.loans,
   sort:(a,b)=>b.balance-a.balance},
  {id:'EXE-06', n:'Overdue Loans Summary', d:'Arrears by bucket with balances',
   src:'custom', cols:['Bucket','Loans','Balance','% of arrears','Provision'],
   rows: f => {
     const buckets=[['Current',0,0],['1–30 days',1,30],['31–60 days',31,60],['61–90 days',61,90],['90+ days',91,9999]];
     return buckets.map(([label,lo,hi])=>{
       const set = LOANS.filter(l=>l.dpd>=lo && l.dpd<=hi);
       const bal = set.reduce((a,l)=>a+l.balance,0);
       return [label, set.length, mk(bal), pct(bal, BOOK.outstanding), mk(bal*(hi>90?0.45:hi>60?0.2:hi>30?0.1:0.02))];
     });
   }},
  {id:'EXE-07', n:'Monthly Performance Trends', d:'Six month trend of disbursements, collections and arrears',
   src:'custom', cols:['Month','Disbursed','Collected','Overdue','Coverage','Volume'],
   rows: f => MONTHS.map(monthlyRow)}
];

/* ============================================================
   CATEGORY 2 · LOAN PORTFOLIO
   ============================================================ */
const R_PORT = [
  {id:'PORT-01', n:'All Loans', d:'Every loan on the books with balance and status', src:'loans', cols:COLS.loans, row:ROW.loans},
  {id:'PORT-02', n:'Active Loans', d:'Loans currently being serviced', src:'loans',
   filter:l=>l.status==='Active', cols:COLS.loans, row:ROW.loans},
  {id:'PORT-03', n:'Fully Repaid Loans', d:'Closed in full with zero balance', src:'loans',
   filter:l=>l.status==='Fully Paid', cols:COLS.loans, row:ROW.loans},
  {id:'PORT-04', n:'Pending Loan Applications', d:'Submitted and awaiting a decision', src:'loans',
   filter:l=>l.status==='Pending', cols:COLS.loans, row:ROW.loans},
  {id:'PORT-05', n:'Approved Loans Awaiting Disbursement', d:'Approved but not yet released', src:'loans',
   filter:l=>l.status==='Approved', cols:COLS.loans, row:ROW.loans},
  {id:'PORT-06', n:'Rejected and Cancelled Loans', d:'Declined or withdrawn applications', src:'loans',
   filter:l=>l.status==='Rejected'||l.status==='Cancelled', cols:COLS.loans, row:ROW.loans},
  {id:'PORT-07', n:'Loan Maturity Report', d:'Maturity dates with balances outstanding', src:'custom',
   cols:['Loan','Customer','Maturity','Balance','Instalment','Officer'],
   rows: f => LOANS.filter(l=>l.balance>0).slice().sort((a,b)=>a.maturity.localeCompare(b.maturity))
     .map(l=>[l.ref, l.customer, l.maturity, mk(l.balance), mk(l.instalment), l.officer])},
  {id:'PORT-08', n:'Loan Balances by Customer', d:'Aggregated exposure per customer', src:'custom',
   cols:['Customer','Loans','Principal','Outstanding','Overdue','Status'],
   rows: f => CUSTOMERS.map(c=>{
     const set = LOANS.filter(l=>l.customer===c.name);
     if(!set.length) return null;
     const out = set.reduce((a,l)=>a+l.balance,0);
     return [c.name, set.length, mk(set.reduce((a,l)=>a+l.principal,0)), mk(out),
       mk(set.reduce((a,l)=>a+l.arrears,0)), chip(out>0?'Active':'Fully Paid')];
   }).filter(Boolean).sort((a,b)=>numOf(b[3])-numOf(a[3]))},
  {id:'PORT-09', n:'Loans by Product and Loan Officer', d:'Two-way split of the book', src:'custom',
   cols:['Product','Officer','Loans','Principal','Outstanding','Arrears %'],
   rows: f => {
     const out=[];
     PRODUCTS.forEach(p=>OFFICERS.forEach(o=>{
       const set = LOANS.filter(l=>l.product===p && l.officer===o);
       if(!set.length) return;
       const bal = set.reduce((a,l)=>a+l.balance,0);
       out.push([p,o,set.length,mk(set.reduce((a,l)=>a+l.principal,0)),mk(bal),
         pct(set.reduce((a,l)=>a+l.arrears,0), bal||1)]);
     }));
     return out.sort((a,b)=>numOf(b[4])-numOf(a[4]));
   }}
];

/* ============================================================
   CATEGORY 3 · REPAYMENTS
   ============================================================ */
const R_REP = [
  {id:'REP-01', n:'All Repayments', d:'Every receipt recorded in the period', src:'reps', cols:COLS.reps, row:ROW.reps},
  {id:'REP-02', n:'Daily Collection Report', d:'Cash collected each day', src:'custom',
   cols:['Date','Receipts','Collected','Principal','Interest & fees','Avg receipt'],
   rows: f => [...new Set(REPAYS.map(r=>r.date))].sort().reverse().map(d=>{
     const set = REPAYS.filter(r=>r.date===d);
     const amt = set.reduce((a,r)=>a+r.amount,0);
     return [d, set.length, mk(amt), mk(set.reduce((a,r)=>a+r.principal,0)),
       mk(set.reduce((a,r)=>a+r.interest+r.fees,0)), mk(amt/(set.length||1))];
   })},
  {id:'REP-03', n:'Weekly and Monthly Collections', d:'Collections grouped by week and month', src:'custom',
   cols:['Period','Type','Receipts','Collected','Principal','Growth'],
   rows: f => {
     const rows=[];
     for(let w=1;w<=5;w++){
       const set = REPAYS.filter(r=>{ const d=+r.date.slice(8); return d >= (w-1)*6+1 && d <= w*6; });
       if(!set.length) continue;
       rows.push(['Week '+w+' (Oct)', 'Weekly', set.length, mk(set.reduce((a,r)=>a+r.amount,0)),
         mk(set.reduce((a,r)=>a+r.principal,0)), (w>1? '+'+ (2.1*w).toFixed(1)+'%' : '—')]);
     }
     rows.push(['October 2026','Monthly', REPAYS.length, mk(BOOK.collected),
       mk(REPAYS.reduce((a,r)=>a+r.principal,0)), '+8.4%']);
     rows.push(['September 2026','Monthly', 64, mkm(88.9e6), mkm(63.2e6), '—']);
     return rows;
   }},
  {id:'REP-04', n:'Repayment History by Customer', d:'Every receipt per borrower', src:'reps', cols:COLS.reps, row:ROW.reps,
   sort:(a,b)=>a.customer.localeCompare(b.customer)},
  {id:'REP-05', n:'Principal and Interest Collections', d:'Allocation split of every payment', src:'reps',
   cols:COLS.reps, row:ROW.reps},
  {id:'REP-06', n:'Repayment Schedule vs Actual Payments', d:'Due against received per loan', src:'custom',
   cols:['Loan','Customer','Instalment','Paid to date','Scheduled','Variance','Status'],
   rows: f => LOANS.filter(l=>l.status==='Active').map(l=>{
     const sched = l.instalment * Math.max(1, Math.round(l.term*0.5));
     const variance = l.paid - sched;
     return [l.ref, l.customer, mk(l.instalment), mk(l.paid), mk(sched),
       (variance>=0?'+':'−')+mk(Math.abs(variance)).replace('MK ','') , chip(variance>=0?'Current':'Overdue')];
   })},
  {id:'REP-07', n:'Partial and Advance Payments', d:'Underpayments and payments ahead of schedule', src:'custom',
   cols:['Receipt','Customer','Loan','Paid','Instalment','Type','Officer'],
   rows: f => REPAYS.filter(r=>r.status==='Partial' || r.amount > (LOANS.find(l=>l.ref===r.loan)||{instalment:0}).instalment*1.05)
     .map(r=>{
       const l = LOANS.find(x=>x.ref===r.loan) || {instalment:0};
       const type = r.amount < l.instalment ? 'Partial' : 'Advance';
       return [r.ref, r.customer, r.loan, mk(r.amount), mk(l.instalment), `<span class="chip ${type==='Partial'?'st-await':'st-ok'}">${type}</span>`, r.officer];
     })},
  {id:'REP-08', n:'Failed, Reversed and Disputed Payments', d:'Receipts that did not settle cleanly', src:'reps',
   filter:r=>['Reversed','Disputed','Partial'].includes(r.status), cols:COLS.reps, row:ROW.reps},
  {id:'REP-09', n:'Payment Methods Summary', d:'Volume and value by channel', src:'custom',
   cols:['Method','Receipts','Collected','Average','Share','Failures'],
   rows: f => METHODS.map(m=>{
     const set = REPAYS.filter(r=>r.method===m);
     const amt = set.reduce((a,r)=>a+r.amount,0);
     return [m, set.length, mk(amt), mk(amt/(set.length||1)), pct(amt, BOOK.collected),
       set.filter(r=>r.status!=='Posted').length];
   })}
];
