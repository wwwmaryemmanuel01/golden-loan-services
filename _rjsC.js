
/* ============================================================
   CATEGORY 4 · ARREARS & DELINQUENCY
   ============================================================ */
const AGE_BUCKETS = [['Current',0,0],['1–30 days',1,30],['31–60 days',31,60],['61–90 days',61,90],['90+ days',91,9999]];
const R_ARR = [
  {id:'ARR-01', n:'All Overdue Loans', d:'Any loan with a past due instalment', src:'loans',
   filter:l=>l.dpd>0, cols:COLS.loans, row:ROW.loans},
  {id:'ARR-02', n:'Overdue Instalments', d:'Instalments currently in arrears', src:'custom',
   cols:['Loan','Customer','Instalment','Arrears','Due date','Days late','Officer'],
   rows: f => LOANS.filter(l=>l.dpd>0).slice().sort((a,b)=>b.dpd-a.dpd).map(l=>[
     l.ref, l.customer, mk(l.instalment), mk(l.arrears), l.lastPayment, l.dpd+' d', l.officer])},
  {id:'ARR-03', n:'Arrears Ageing Analysis', d:'Portfolio split by days past due', src:'custom',
   cols:['Bucket','Loans','Balance','% of book','Arrears','Provision'],
   rows: f => AGE_BUCKETS.map(([label,lo,hi])=>{
     const set = LOANS.filter(l=>l.dpd>=lo && l.dpd<=hi);
     const bal = set.reduce((a,l)=>a+l.balance,0);
     return [label, set.length, mk(bal), pct(bal, BOOK.outstanding),
       mk(set.reduce((a,l)=>a+l.arrears,0)), mk(bal*(hi>90?0.45:hi>60?0.2:hi>30?0.1:0.02))];
   })},
  {id:'ARR-04', n:'Days Past Due (DPD)', d:'Every loan ranked by days past due', src:'custom',
   cols:['Loan','Customer','DPD','Balance','Arrears','Officer','Bucket'],
   rows: f => LOANS.slice().sort((a,b)=>b.dpd-a.dpd).map(l=>{
     const b = AGE_BUCKETS.find(([_,lo,hi])=>l.dpd>=lo&&l.dpd<=hi)[0];
     return [l.ref, l.customer, dpdChip(l.dpd), mk(l.balance), mk(l.arrears), l.officer, b];
   })},
  {id:'ARR-05', n:'Customers Requiring Follow-up', d:'Borrowers 30+ days past due', src:'custom',
   cols:['Customer','Phone','Loans','Balance','Max DPD','Officer','Action'],
   rows: f => CUSTOMERS.map(c=>{
     const set = LOANS.filter(l=>l.customer===c.name && l.dpd>=30);
     if(!set.length) return null;
     const bal = set.reduce((a,l)=>a+l.balance,0);
     return [c.name, c.phone, set.length, mk(bal), Math.max(...set.map(l=>l.dpd)),
       set[0].officer, bal>5000000?'Field visit':'Phone call'];
   }).filter(Boolean).sort((a,b)=>b[4]-a[4])},
  {id:'ARR-06', n:'Missed Repayments', d:'Scheduled instalments not received', src:'custom',
   cols:['Loan','Customer','Instalment','Last payment','Days since','Status','Officer'],
   rows: f => LOANS.filter(l=>l.dpd>0).map(l=>[
     l.ref, l.customer, mk(l.instalment), l.lastPayment, l.dpd+' d', chip('Overdue'), l.officer])},
  {id:'ARR-07', n:'Defaulted Loans', d:'Loans 90+ days past due', src:'loans',
   filter:l=>l.dpd>=90, cols:COLS.loans, row:ROW.loans},
  {id:'ARR-08', n:'Recovery and Collection Performance', d:'Recovered against arrears by officer', src:'custom',
   cols:['Officer','Assigned arrears','Recovered','Recovery %','Cases','Rank'],
   rows: f => STAFFAGG.map(s=>({s, recovered: s.collected*0.28})).sort((a,b)=>b.recovered-a.recovered)
     .map(({s,recovered},i)=>[s.officer, mk(s.overdue), mk(recovered), pct(recovered,s.overdue||1),
       Math.max(1,Math.round(s.overdue/900000)), '#'+(i+1)])},
  {id:'ARR-09', n:'Non-Performing Loans (NPL)', d:'90+ DPD exposure and NPL ratio', src:'custom',
   cols:['Loan','Customer','Balance','DPD','NPL % of book','Officer','Stage'],
   rows: f => LOANS.filter(l=>l.dpd>=90).map(l=>[
     l.ref, l.customer, mk(l.balance), l.dpd, pct(l.balance, BOOK.outstanding), l.officer, 'Stage 3'])}
];

/* ============================================================
   CATEGORY 5 · FINANCIAL
   ============================================================ */
const R_FIN = [
  {id:'FIN-01', n:'Income and Expenditure', d:'Revenue lines against operating costs', src:'custom',
   cols:['Line','Type','Amount','% of revenue','Period'],
   rows: f => {
     const rev = BOOK.interest + BOOK.fees, cost = BOOK.interest*0.34;
     return [
       ['Interest income','Income',mk(BOOK.interest),pct(BOOK.interest,rev),'October 2026'],
       ['Fees and penalties','Income',mk(BOOK.fees),pct(BOOK.fees,rev),'October 2026'],
       ['Salaries and allowances','Expenditure',mk(cost*0.58),pct(cost*0.58,rev),'October 2026'],
       ['Rent and utilities','Expenditure',mk(cost*0.14),pct(cost*0.14,rev),'October 2026'],
       ['SMS and provider costs','Expenditure',mk(cost*0.09),pct(cost*0.09,rev),'October 2026'],
       ['Other operating costs','Expenditure',mk(cost*0.19),pct(cost*0.19,rev),'October 2026']
     ];
   }},
  {id:'FIN-02', n:'Interest Income', d:'Interest earned by product', src:'custom',
   cols:['Product','Loans','Interest earned','Avg rate','Share'],
   rows: f => PRODUCTS.map(p=>{
     const set = LOANS.filter(l=>l.product===p);
     const interest = set.reduce((a,l)=>a+l.principal*0.28,0);
     return [p, set.length, mk(interest), '28.0%', pct(interest, BOOK.interest*1.2)];
   })},
  {id:'FIN-03', n:'Fees and Penalties Income', d:'Processing, late and other charges', src:'custom',
   cols:['Fee type','Receipts','Amount','Share','Trend'],
   rows: f => [
     ['Processing fees', 72, mk(BOOK.fees*0.62), '62.0%', '+4.1%'],
     ['Late payment penalties', 21, mk(BOOK.fees*0.24), '24.0%', '+1.6%'],
     ['Statement and copy fees', 14, mk(BOOK.fees*0.09), '9.0%', '−0.4%'],
     ['Other charges', 6, mk(BOOK.fees*0.05), '5.0%', '+0.2%']
   ]},
  {id:'FIN-04', n:'Loan Disbursement Summary', d:'Amounts released by product and month', src:'custom',
   cols:['Product','Loans','Disbursed','Average loan','Share','Month'],
   rows: f => PRODUCTS.map(p=>{
     const set = LOANS.filter(l=>l.product===p && l.status!=='Rejected' && l.status!=='Pending');
     const amt = set.reduce((a,l)=>a+l.principal,0);
     return [p, set.length, mk(amt), mk(amt/(set.length||1)), pct(amt, BOOK.principal), 'October 2026'];
   })},
  {id:'FIN-05', n:'Principal Outstanding', d:'Capital still to be recovered', src:'custom',
   cols:['Branch','Loans','Principal','Outstanding','% remaining','Overdue'],
   rows: f => BRANCHES.map(b=>{
     const set = LOANS.filter(l=>l.branch===b);
     const pr = set.reduce((a,l)=>a+l.principal,0), out = set.reduce((a,l)=>a+l.balance,0);
     return [b, set.length, mk(pr), mk(out), pct(out,pr||1), mk(set.reduce((a,l)=>a+l.arrears,0))];
   })},
  {id:'FIN-06', n:'Cash Flow Report', d:'Weekly inflows and outflows', src:'custom',
   cols:['Week','Inflows','Outflows','Net','Closing balance','Status'],
   rows: f => [1,2,3,4,5].map(w=>{
     const inflow = BOOK.collected/5*(0.9+w*0.04);
     const outflow = BOOK.principal*0.06*(0.95+w*0.02);
     return ['Week '+w, mk(inflow), mk(outflow), mk(inflow-outflow),
       mk(42e6 + w*inflow*0.22), chip(inflow>outflow?'Active':'Restructured')];
   })},
  {id:'FIN-07', n:'Cash Position Report', d:'Balances held across accounts', src:'custom',
   cols:['Account','Type','Institution','Balance','Available','Status'],
   rows: f => [
     ['Operating account','Bank','National Bank of Malawi', mk(28.4e6), mk(26.9e6), chip('Active')],
     ['Collections account','Bank','Standard Bank', mk(12.8e6), mk(12.8e6), chip('Active')],
     ['Airtel Money float','Mobile money','Airtel Malawi', mk(6.4e6), mk(6.1e6), chip('Active')],
     ['TNM Mpamba float','Mobile money','TNM', mk(3.9e6), mk(3.7e6), chip('Active')],
     ['Cash on hand — Lilongwe City','Cash','Branch till', mk(1.42e6), mk(1.42e6), chip('Active')],
     ['Cash on hand — Blantyre','Cash','Branch till', mk(0.86e6), mk(0.86e6), chip('Active')]
   ]},
  {id:'FIN-08', n:'Profit and Loss Summary', d:'Revenue, costs and result for the month', src:'custom', noTotal:true,
   cols:['Line','Amount','Last month','Variance','Margin'],
   rows: f => {
     const rev = BOOK.interest + BOOK.fees, cost = BOOK.interest*0.34;
     return [
       ['Total revenue', mk(rev), mkm(54.8e6), '+6.9%', '—'],
       ['Cost of funds', mk(rev*0.18), mkm(8.9e6), '+2.2%', '18.0%'],
       ['Operating costs', mk(cost), mkm(19.4e6), '+3.4%', pct(cost,rev)],
       ['Loan loss provision', mk(BOOK.outstanding*0.021), mkm(6.1e6), '+0.6%', '2.1%'],
       ['Profit before tax', mk(rev-cost-rev*0.18-BOOK.outstanding*0.021), mkm(20.4e6), '+9.1%',
         pct(rev-cost-rev*0.18-BOOK.outstanding*0.021, rev)]
     ];
   }},
  {id:'FIN-09', n:'Bank and Mobile Money Reconciliation', d:'Book against statement by channel', src:'custom',
   cols:['Channel','Book balance','Statement','Variance','Items','Status'],
   rows: f => METHODS.map((m,i)=>{
     const book = [38.2e6, 6.4e6, 12.8e6, 2.28e6, 1.1e6][i] || 5e6;
     const variance = [0, -150000, 0, 0, 42000][i] || 0;
     return [m, mk(book), mk(book+variance), (variance?mk(Math.abs(variance)):'—'),
       variance? 1 : 0, chip(variance? 'Restructured' : 'Active')];
   })}
];
