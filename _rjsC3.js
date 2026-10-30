
/* ============================================================
   CATEGORY 8 · STAFF & OFFICER PERFORMANCE
   ============================================================ */
const ACTIVITY = OFFICERS.map((o,i)=>({
  officer:o, logins: 42 - i*4 + (i%3)*5, created: STAFFAGG[i].loans, approved: STAFFAGG[i].approved,
  lastActive: '2026-10-3'+(i%9), session: (1.2 + i*0.4).toFixed(1)+' h'
}));
const R_STF = [
  {id:'STF-01', n:'Staff Activity Report', d:'Logins, records touched and last activity', src:'custom',
   cols:['Officer','Logins','Records created','Approvals','Avg session','Last active'],
   rows: f => ACTIVITY.map(a=>[a.officer, a.logins, a.created, a.approved, a.session, a.lastActive])},
  {id:'STF-02', n:'Loans Processed by Officer', d:'Volume and value handled per officer', src:'custom',
   cols:['Officer','Branch','Loans','Principal','Average loan','Pending','Rejected'],
   rows: f => STAFFAGG.map(s=>{
     const mine = LOANS.filter(l=>l.officer===s.officer);
     const pr = mine.reduce((a,l)=>a+l.principal,0);
     return [s.officer, s.branch, mine.length, mk(pr), mk(pr/(mine.length||1)),
       mine.filter(l=>l.status==='Pending').length, s.rejected];
   }).sort((a,b)=>b[2]-a[2])},
  {id:'STF-03', n:'Loans Approved and Rejected by Officer', d:'Decision mix and approval rate', src:'custom',
   cols:['Officer','Decisions','Approved','Rejected','Pending','Approval rate'],
   rows: f => STAFFAGG.map(s=>{
     const mine = LOANS.filter(l=>l.officer===s.officer);
     const decided = s.approved + s.rejected;
     return [s.officer, decided, s.approved, s.rejected,
       mine.filter(l=>l.status==='Pending').length, pct(s.approved, decided||1)];
   })},
  {id:'STF-04', n:'Disbursements by Officer', d:'Funds released per officer', src:'custom',
   cols:['Officer','Disbursements','Amount released','Average','Share of book','Last release'],
   rows: f => {
     const total = LOANS.filter(l=>['Active','Fully Paid'].includes(l.status)).reduce((a,l)=>a+l.principal,0);
     return STAFFAGG.map(s=>{
       const mine = LOANS.filter(l=>l.officer===s.officer && ['Active','Fully Paid'].includes(l.status));
       const amt = mine.reduce((a,l)=>a+l.principal,0);
       const last = mine.map(l=>l.disbursed).sort().pop() || '—';
       return [s.officer, mine.length, mk(amt), mk(amt/(mine.length||1)), pct(amt,total||1), last];
     }).sort((a,b)=>numOf(b[2])-numOf(a[2]));
   }},
  {id:'STF-05', n:'Repayments Collected by Officer', d:'Cash collected against officers', src:'custom',
   cols:['Officer','Receipts','Collected','Principal','Interest & fees','Average receipt'],
   rows: f => STAFFAGG.map(s=>{
     const reps = REPAYS.filter(r=>r.officer===s.officer && r.status==='Posted');
     const amt = reps.reduce((a,r)=>a+r.amount,0);
     return [s.officer, reps.length, mk(amt), mk(reps.reduce((a,r)=>a+r.principal,0)),
       mk(reps.reduce((a,r)=>a+r.interest+r.fees,0)), mk(amt/(reps.length||1))];
   }).sort((a,b)=>numOf(b[2])-numOf(a[2]))},
  {id:'STF-06', n:'Collection Rate by Officer', d:'Received against expected instalments', src:'custom',
   cols:['Officer','Expected','Collected','Rate','Gap','Rating'],
   rows: f => STAFFAGG.map(s=>{
     const rate = s.rate;
     const rating = rate>=90?'Excellent':rate>=70?'Good':rate>=50?'Fair':'Needs support';
     return [s.officer, mk(s.due), mk(s.collected), rate.toFixed(1)+'%', mk(Math.max(0,s.due-s.collected)),
       `<span class="chip ${rate>=70?'st-ok':rate>=50?'st-await':'st-fail'}">${rating}</span>`];
   }).sort((a,b)=>parseFloat(b[3])-parseFloat(a[3]))},
  {id:'STF-07', n:'Overdue Portfolio by Officer', d:'Arrears held in each officer book', src:'custom',
   cols:['Officer','Overdue balance','Cases','Avg DPD','% of book','Action'],
   rows: f => STAFFAGG.map(s=>{
     const mine = LOANS.filter(l=>l.officer===s.officer && l.dpd>0);
     const avg = mine.length ? Math.round(mine.reduce((a,l)=>a+l.dpd,0)/mine.length) : 0;
     return [s.officer, mk(s.overdue), mine.length, avg, pct(s.overdue, BOOK.outstanding),
       s.overdue>8e6?'Recovery plan':'Monitor'];
   }).sort((a,b)=>numOf(b[1])-numOf(a[1]))},
  {id:'STF-08', n:'Staff Productivity Summary', d:'Composite performance score and rank', src:'custom',
   cols:['Rank','Officer','Loans','Collection rate','Overdue','Score','Band'],
   rows: f => STAFFAGG.map(s=>{
     const score = Math.round((s.loans/2) + s.rate*0.6 + s.disbursed*1.5 - s.overdue/4e6);
     return {s, score};
   }).sort((a,b)=>b.score-a.score).map(({s,score},i)=>[
     '#'+(i+1), s.officer, s.loans, s.rate.toFixed(1)+'%', mk(s.overdue), score,
     `<span class="chip ${i<2?'st-ok':i<5?'st-await':'st-fail'}">${i<2?'Top':i<5?'Solid':'Support'}</span>`])}
];

/* ============================================================
   CATEGORY 9 · RISK & CREDIT
   ============================================================ */
const R_RSK = [
  {id:'RSK-01', n:'Portfolio At Risk (PAR 30/60/90)', d:'Risk concentration by product', src:'custom',
   cols:['Product','Book','PAR 30','PAR 60','PAR 90','Trend'],
   rows: f => PRODUCTS.map(p=>{
     const set = LOANS.filter(l=>l.product===p);
     const book = set.reduce((a,l)=>a+l.balance,0) || 1;
     const par = d => set.filter(l=>l.dpd>=d).reduce((a,l)=>a+l.balance,0)/book*100;
     return [p, mk(book), par(30).toFixed(1)+'%', par(60).toFixed(1)+'%', par(90).toFixed(1)+'%',
       par(30)>8?'<span class="chip st-fail">Rising</span>':'<span class="chip st-ok">Stable</span>'];
   })},
  {id:'RSK-02', n:'Loan Default Rate', d:'Defaults against total book by product', src:'custom',
   cols:['Product','Loans','Defaults','Default rate','Value at risk','Provision'],
   rows: f => PRODUCTS.map(p=>{
     const set = LOANS.filter(l=>l.product===p);
     const def = set.filter(l=>l.dpd>=90);
     const var_ = def.reduce((a,l)=>a+l.balance,0);
     return [p, set.length, def.length, pct(def.length, set.length||1), mk(var_), mk(var_*0.45)];
   })},
  {id:'RSK-03', n:'Loan Loss and Recovery', d:'Written off against recovered amounts', src:'custom',
   cols:['Product','Written off','Recovered','Recovery %','Net loss','Status'],
   rows: f => PRODUCTS.map((p,i)=>{
     const wo = BOOK.outstanding*0.004*(i+1);
     const rec = wo*(0.32+i*0.07);
     return [p, mk(wo), mk(rec), pct(rec,wo), mk(wo-rec),
       chip(rec/wo>0.4?'Active':'Restructured')];
   })},
  {id:'RSK-04', n:'Restructured Loans', d:'Loans with revised terms', src:'custom',
   cols:['Loan','Customer','Original term','New term','Balance','DPD','Officer'],
   rows: f => LOANS.filter(l=>l.dpd>=30 && l.dpd<90).slice(0,12).map(l=>[
     l.ref, l.customer, l.term+' months', (l.term+6)+' months', mk(l.balance), dpdChip(l.dpd), l.officer])},
  {id:'RSK-05', n:'Repeat Borrower Performance', d:'Customers on their second loan or more', src:'custom',
   cols:['Customer','Loans','Principal','Outstanding','Defaulted','Behaviour'],
   rows: f => CUSTOMERS.map(c=>{
     const set = LOANS.filter(l=>l.customer===c.name);
     return {c, set};
   }).filter(x=>x.set.length>1).map(({c,set})=>[
     c.name, set.length, mk(set.reduce((a,l)=>a+l.principal,0)), mk(c.balance),
     set.filter(l=>l.dpd>=90).length, c.behaviour+'%'])
     .sort((a,b)=>b[1]-a[1])},
  {id:'RSK-06', n:'High-Exposure Customers', d:'Largest single-borrower exposures', src:'custom',
   cols:['Customer','Loans','Exposure','% of book','DPD','Officer','Risk'],
   rows: f => CUSTOMERS.filter(c=>c.balance>0).sort((a,b)=>b.balance-a.balance).slice(0,15).map(c=>{
     const top = LOANS.filter(l=>l.customer===c.name).sort((a,b)=>b.balance-a.balance)[0];
     return [c.name, c.books, mk(c.balance), pct(c.balance, BOOK.outstanding), dpdChip(c.dpd),
       top.officer, `<span class="chip ${c.balance>BOOK.outstanding*0.03?'st-fail':c.dpd>0?'st-await':'st-ok'}">${
         c.balance>BOOK.outstanding*0.03?'Concentrated':c.dpd>0?'Watch':'Normal'}</span>`];
   })},
  {id:'RSK-07', n:'Credit Risk Trends', d:'Six month movement in PAR and defaults', src:'custom',
   cols:['Month','PAR 30','PAR 60','PAR 90','Defaults','Provision'],
   rows: f => MONTHS.map((m,i)=>[
     m, (6.4+i*0.31).toFixed(1)+'%', (4.1+i*0.22).toFixed(1)+'%', (2.2+i*0.14).toFixed(1)+'%',
     (3+i%3)+' loans', mkm(82e5+i*2.1e5)])},
  {id:'RSK-08', n:'Expected Credit Losses (IFRS 9)', d:'Staging and provision requirement', src:'custom',
   cols:['Stage','Loans','Exposure','ECL rate','Provision','Coverage'],
   rows: f => [
     ['Stage 1 — performing', LOANS.filter(l=>l.dpd===0).length,
       mk(LOANS.filter(l=>l.dpd===0).reduce((a,l)=>a+l.balance,0)), '2.0%',
       mk(BOOK.outstanding*0.36*0.02), '102%'],
     ['Stage 2 — underperforming', LOANS.filter(l=>l.dpd>0&&l.dpd<90).length,
       mk(LOANS.filter(l=>l.dpd>0&&l.dpd<90).reduce((a,l)=>a+l.balance,0)), '14.0%',
       mk(BOOK.outstanding*0.11*0.14), '96%'],
     ['Stage 3 — credit impaired', LOANS.filter(l=>l.dpd>=90).length,
       mk(LOANS.filter(l=>l.dpd>=90).reduce((a,l)=>a+l.balance,0)), '45.0%',
       mk(BOOK.outstanding*0.05*0.45), '88%']
   ]}
];
