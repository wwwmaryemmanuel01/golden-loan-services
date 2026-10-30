
/* ============================================================
   CATEGORY 6 · CUSTOMERS
   ============================================================ */
CUSTOMERS.forEach(c=>{
  const set = LOANS.filter(l=>l.customer===c.name);
  c.books = set.length;
  c.balance = set.reduce((a,l)=>a+l.balance,0);
  c.dpd = set.reduce((a,l)=>Math.max(a,l.dpd),0);
  c.activeLoan = set.some(l=>l.status==='Active');
});
const R_CUS = [
  {id:'CUS-01', n:'All Registered Customers', d:'Complete customer master list', src:'custs', cols:COLS.custs, row:ROW.custs,
   sort:(a,b)=>a.name.localeCompare(b.name)},
  {id:'CUS-02', n:'New Customer Registrations', d:'Customers onboarded recently', src:'custs',
   filter:c=>c.joined>='2025-07', cols:COLS.custs,
   row:c=>[c.name, c.phone, c.branch, c.joined, c.books, mk(c.balance), dpdChip(c.dpd), chip(c.status)]},
  {id:'CUS-03', n:'Active Borrowers', d:'Customers with a loan currently running', src:'custs',
   filter:c=>c.activeLoan, cols:COLS.custs, row:ROW.custs},
  {id:'CUS-04', n:'Customers with Active Loans', d:'Open balances and next instalment', src:'custom',
   cols:['Customer','Loans','Balance','Next due','Instalment','Officer','Status'],
   rows: f => CUSTOMERS.filter(c=>c.activeLoan).map(c=>{
     const open = LOANS.filter(l=>l.customer===c.name && l.balance>0);
     const next = open.slice().sort((a,b)=>a.nextDue.localeCompare(b.nextDue))[0];
     return [c.name, open.length, mk(c.balance), next.nextDue, mk(next.instalment), next.officer,
       chip(c.dpd>=90?'Overdue':c.dpd>0?'Pending':'Active')];
   }).sort((a,b)=>numOf(b[2])-numOf(a[2]))},
  {id:'CUS-05', n:'Customer Loan History', d:'Every loan taken by each customer', src:'custom',
   cols:['Customer','Loans','First loan','Latest loan','Principal','Outstanding','Repaid'],
   rows: f => CUSTOMERS.map(c=>{
     const set = LOANS.filter(l=>l.customer===c.name).sort((a,b)=>a.disbursed.localeCompare(b.disbursed));
     if(!set.length) return null;
     const pr = set.reduce((a,l)=>a+l.principal,0), out = set.reduce((a,l)=>a+l.balance,0);
     return [c.name, set.length, set[0].disbursed, set[set.length-1].disbursed, mk(pr), mk(out), pct(pr-out,pr)];
   }).filter(Boolean).sort((a,b)=>b[1]-a[1])},
  {id:'CUS-06', n:'Customer Repayment Behaviour', d:'Punctuality score and payment pattern', src:'custom',
   cols:['Customer','Receipts','On-time %','Avg days late','Score','Rating'],
   rows: f => CUSTOMERS.map(c=>{
     const reps = REPAYS.filter(r=>r.customer===c.name);
     const late = Math.round((100-c.behaviour)/6);
     const rating = c.behaviour>=80?'Excellent':c.behaviour>=70?'Good':c.behaviour>=62?'Fair':'Watch';
     return [c.name, reps.length, c.behaviour+'%', late, c.behaviour+'/100',
       `<span class="chip ${rating==='Excellent'||rating==='Good'?'st-ok':rating==='Fair'?'st-await':'st-fail'}">${rating}</span>`];
   }).sort((a,b)=>b[4].localeCompare(a[4]))},
  {id:'CUS-07', n:'Customers with Overdue Accounts', d:'Borrowers carrying arrears', src:'custs',
   filter:c=>c.dpd>0, cols:COLS.custs,
   sort:(a,b)=>b.dpd-a.dpd, row:ROW.custs},
  {id:'CUS-08', n:'Customer Account Balances', d:'Paid against outstanding per customer', src:'custom',
   cols:['Customer','Principal','Paid to date','Balance','% repaid','Next due','Status'],
   rows: f => CUSTOMERS.filter(c=>c.books>0).map(c=>{
     const set = LOANS.filter(l=>l.customer===c.name);
     const pr = set.reduce((a,l)=>a+l.principal,0), paid = set.reduce((a,l)=>a+l.paid,0);
     return [c.name, mk(pr), mk(paid), mk(c.balance), pct(paid,pr), set[0].nextDue,
       chip(c.balance>0?'Active':'Fully Paid')];
   }).sort((a,b)=>numOf(b[3])-numOf(a[3]))},
  {id:'CUS-09', n:'Inactive Customers', d:'No open loan or marked inactive', src:'custs',
   filter:c=>c.status==='Inactive' || c.balance===0,
   cols:COLS.custs, row:ROW.custs}
];

/* ============================================================
   CATEGORY 7 · LOAN APPLICATIONS & DISBURSEMENT
   ============================================================ */
const DISB_FAIL = [
  ['LN-2026-1823','Blessings Tembo','Bank transfer','Insufficient float on disbursement account','Retry'],
  ['LN-2026-1837','Joseph Mwale','Airtel Money','KYC name mismatch at wallet provider','Corrected'],
  ['LN-2026-1841','Tadala Nkhoma','Bank transfer','Account number closed','Pending'],
  ['LN-2026-1849','Rose Chikopa','Airtel Money','Wallet not registered','Retry'],
  ['LN-2026-1852','Memory Nkhoma','Bank transfer','Duplicate reference detected','Reversed'],
  ['LN-2026-1858','Yamikani Gondwe','Bank transfer','Client account blocked','Pending']
];
const R_APP = [
  {id:'APP-01', n:'All Loan Applications', d:'Every application received with decision', src:'apps', cols:COLS.apps, row:ROW.apps},
  {id:'APP-02', n:'Pending Applications', d:'Awaiting a credit decision', src:'apps',
   filter:a=>a.status==='Pending', cols:COLS.apps, row:ROW.apps},
  {id:'APP-03', n:'Approved Applications', d:'Cleared for disbursement', src:'apps',
   filter:a=>a.status==='Approved', cols:COLS.apps, row:ROW.apps},
  {id:'APP-04', n:'Rejected Applications', d:'Declined with reasons', src:'apps',
   filter:a=>a.status==='Rejected', cols:COLS.apps,
   row:a=>[a.ref, a.customer, a.product, a.officer, a.submitted, a.days+' d', mk(a.amount),
     '<span class="chip st-fail">Declined</span>']},
  {id:'APP-05', n:'Application Processing Time', d:'Days from submission to decision by officer', src:'custom',
   cols:['Officer','Applications','Total days','Average','Fastest','Slowest','Within SLA'],
   rows: f => OFFICERS.map(o=>{
     const set = APPS.filter(a=>a.officer===o);
     if(!set.length) return null;
     const days = set.map(a=>a.days);
     return [o, set.length, days.reduce((a,b)=>a+b,0), (days.reduce((a,b)=>a+b,0)/set.length).toFixed(1)+' d',
       Math.min(...days)+' d', Math.max(...days)+' d', pct(days.filter(d=>d<=3).length, days.length)];
   }).filter(Boolean)},
  {id:'APP-06', n:'Approval and Rejection Statistics', d:'Decision outcome by product', src:'custom',
   cols:['Product','Applications','Approved','Rejected','Pending','Approval rate'],
   rows: f => PRODUCTS.map(p=>{
     const set = APPS.filter(a=>a.product===p);
     const ok = set.filter(a=>a.status==='Approved'||a.status==='Active').length;
     return [p, set.length, ok, set.filter(a=>a.status==='Rejected').length,
       set.filter(a=>a.status==='Pending').length, pct(ok, set.length)];
   })},
  {id:'APP-07', n:'Approved but Undisbursed Loans', d:'Cleared applications still waiting for funds', src:'custom',
   cols:['Application','Customer','Product','Approved','Days waiting','Amount','Action'],
   rows: f => APPS.filter(a=>a.status==='Approved').map(a=>[
     a.ref, a.customer, a.product, a.submitted, (a.days+2)+' d', mk(a.amount),
     a.days>6?'<span class="chip st-fail">Escalate</span>':'<span class="chip st-await">Queue</span>'])},
  {id:'APP-08', n:'Disbursement History', d:'Funds released with channel and officer', src:'custom',
   cols:['Loan','Customer','Disbursed','Amount','Channel','Officer','Status'],
   rows: f => LOANS.filter(l=>!['Pending','Rejected','Cancelled'].includes(l.status))
     .sort((a,b)=>b.disbursed.localeCompare(a.disbursed))
     .map(l=>[l.ref, l.customer, l.disbursed, mk(l.principal), METHODS[+l.ref.slice(-2)%METHODS.length],
       l.officer, chip(l.status)])},
  {id:'APP-09', n:'Failed or Reversed Disbursements', d:'Payouts that did not complete', src:'custom',
   cols:['Loan','Officer','Channel','Reason','Amount','Action'],
   rows: f => DISB_FAIL.map((r,i)=>[r[0], r[1], r[2], r[3],
     mk(PRINCIPALS[i%PRINCIPALS.length]),
     `<span class="chip ${r[4]==='Reversed'?'st-fail':r[4]==='Pending'?'st-await':'st-proc'}">${r[4]}</span>`])}
];
