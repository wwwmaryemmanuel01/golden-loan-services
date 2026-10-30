
/* ============================================================
   CATEGORY 10 · AUDIT, COMPLIANCE & STATEMENTS
   ============================================================ */
const WHEN = i => `2026-10-${String(29-i%9).padStart(2,'0')} ${String(8+i%9).padStart(2,'0')}:${String(5+i*7%55).padStart(2,'0')}`;
const USERS = [['Mary Emmanuel','Super Admin'],['Tadala Nkhoma','Loan Officer'],['Blessings Tembo','Loan Officer'],
  ['Grace Phiri','Administrator'],['Chikondi Banda','Accountant'],['Limbani Zulu','Collections Officer'],
  ['Ruth Mbewe','Auditor']];
const ACTS = ['Signed in','Generated report','Approved loan','Rejected application','Posted repayment',
  'Edited customer record','Exported statement','Changed system setting','Created staff account','Reversed receipt'];
const LOGAUDIT = Array.from({length:14},(_,i)=>{
  const u = USERS[i%USERS.length];
  return [WHEN(i), u[0], u[1], ACTS[i%ACTS.length], ['Loans','Repayments','Customers','Reports','Settings'][i%5],
    '10.20.'+(i%9)+'.'+(20+i*3%200), i%11===5 ? chip('Rejected') : chip('Active')];
});
const R_AUD = [
  {id:'AUD-01', n:'Administrator Activity Logs', d:'Every action taken in the admin portal', src:'custom',
   cols:['Time','User','Role','Action','Module','IP address','Result'], rows: f => LOGAUDIT},
  {id:'AUD-02', n:'Staff Login History', d:'Sign-in attempts with device and session length', src:'custom',
   cols:['Time','Staff','Role','Device','IP address','Session','Result'],
   rows: f => USERS.concat(USERS.slice(0,5)).map((u,i)=>[
     WHEN(i+2), u[0], u[1], ['Desktop · Chrome','Android app','Desktop · Edge','iPhone app','Desktop · Firefox'][i%5],
     '10.20.'+(i%9)+'.'+(44+i*5%180), (0.4+i*0.3).toFixed(1)+' h',
     i===7 ? chip('Rejected') : chip('Active')])},
  {id:'AUD-03', n:'Loan Approval Audit Trail', d:'Who approved or declined each application', src:'custom',
   cols:['Loan','Customer','Submitted','Decided by','Decision','Days','Amount'],
   rows: f => LOANS.filter(l=>l.status!=='Pending').slice(0,20).map((l,i)=>[
     l.ref, l.customer, l.disbursed, OFFICERS[(i+2)%OFFICERS.length],
     l.status==='Rejected'? chip('Rejected') : chip('Approved'), 1+i%6, mk(l.principal)])},
  {id:'AUD-04', n:'Financial Transaction Audit Trail', d:'All money movements with poster', src:'custom',
   cols:['Reference','Date','Type','Amount','Channel','Posted by','Status'],
   rows: f => REPAYS.slice(0,24).map((r,i)=>[r.ref, r.date, i%4===0?'Disbursement':'Repayment',
     mk(r.amount), r.method, r.officer, chip(r.status)])},
  {id:'AUD-05', n:'Changes to Loan Records', d:'Field-level edits with before and after', src:'custom',
   cols:['Loan','Field','Old value','New value','Changed by','When','Reason'],
   rows: f => LOANS.slice(0,12).map((l,i)=>[l.ref, ['Interest rate','Term','Officer','Branch','Instalment'][i%5],
     ['32%','12 months','Tadala Nkhoma','Lilongwe City','MK 480,000'][i%5],
     ['34%','18 months','Blessings Tembo','Blantyre','MK 520,000'][i%5],
     OFFICERS[(i+1)%OFFICERS.length], WHEN(i), ['Client request','Credit committee','Branch transfer','Restructure','Correction'][i%5]])},
  {id:'AUD-06', n:'Customer Account Statements', d:'Opening to closing balance per customer', src:'custom',
   cols:['Customer','Opening','Debits','Credits','Closing','Loans','Statement'],
   rows: f => CUSTOMERS.filter(c=>c.books>0).slice(0,18).map(c=>{
     const paid = LOANS.filter(l=>l.customer===c.name).reduce((a,l)=>a+l.paid,0);
     return [c.name, mk(c.balance*0.32), mk(paid), mk(c.balance), mk(c.balance*1.02), c.books,
       '<span class="chip st-proc">Ready</span>'];
   })},
  {id:'AUD-07', n:'Loan Account Statements', d:'Repaid against balance per loan', src:'custom',
   cols:['Loan','Customer','Disbursed','Repaid','Balance','Instalments','Statement'],
   rows: f => LOANS.filter(l=>l.status==='Active').slice(0,20).map(l=>[
     l.ref, l.customer, l.disbursed, mk(l.paid), mk(l.balance),
     Math.max(1,Math.round(l.paid/l.instalment))+' / '+l.term, '<span class="chip st-proc">Ready</span>'])},
  {id:'AUD-08', n:'Repayment Schedules', d:'Instalment plan with due dates', src:'custom',
   cols:['Instalment','Loan','Due date','Principal','Interest','Total','Status'],
   rows: f => {
     const out=[]; LOANS.filter(l=>l.status==='Active').slice(0,6).forEach(l=>{
       for(let k=1;k<=5;k++) out.push([k+' of '+l.term, l.ref,
         '2026-'+String(11+(k>2?1:0)).padStart(2,'0')+'-'+String(2+k*3).padStart(2,'0'),
         mk(l.instalment*0.76), mk(l.instalment*0.24), mk(l.instalment),
         k===1 ? chip('Active') : chip('Pending')]);
     }); return out; }},
  {id:'AUD-09', n:'Loan Settlement Statements', d:'Payoff amount to clear each loan', src:'custom',
   cols:['Loan','Customer','Principal','Interest','Fees','Payoff','Valid until'],
   rows: f => LOANS.filter(l=>l.balance>0).slice(0,16).map(l=>[
     l.ref, l.customer, mk(l.balance), mk(l.balance*0.06), mk(l.balance*0.02),
     mk(l.balance*1.08), '2026-11-15'])},
  {id:'AUD-10', n:'Loan Closure Reports', d:'Loans fully repaid and closed', src:'custom',
   cols:['Loan','Customer','Disbursed','Closed','Term','Total paid','Status'],
   rows: f => LOANS.filter(l=>l.status==='Fully Paid').map(l=>[
     l.ref, l.customer, l.disbursed, l.maturity, l.term+' months', mk(l.paid), chip('Fully Paid')])},
  {id:'AUD-11', n:'Receipt Register', d:'Sequential register of all receipts', src:'reps',
   cols:COLS.reps, row:ROW.reps, sort:(a,b)=>a.ref.localeCompare(b.ref)},
  {id:'AUD-12', n:'Compliance Reports', d:'Regulatory returns and internal findings', src:'custom',
   cols:['Requirement','Regulator','Period','Status','Submitted','Owner','Finding'],
   rows: f => [
     ['Monthly prudential return','Reserve Bank of Malawi','October 2026', chip('Active'), '2026-11-05','Grace Phiri','None'],
     ['AML/CFT transaction report','Financial Intelligence Authority','October 2026', chip('Active'),'2026-11-03','Ruth Mbewe','None'],
     ['KYC remediation schedule','Reserve Bank of Malawi','Q3 2026', chip('Pending'),'—','Grace Phiri','12 files outstanding'],
     ['Interest rate disclosure','Consumer protection','October 2026', chip('Active'),'2026-10-28','Chikondi Banda','None'],
     ['Staff suitability review','Internal audit','Q4 2026', chip('Pending'),'—','Ruth Mbewe','In progress'],
     ['Data protection register','Malawi Communications Regulatory Authority','October 2026', chip('Active'),'2026-10-30','Mary Emmanuel','Minor gap closed']
   ]}
];

/* ============================================================
   REGISTRY
   ============================================================ */
const R_SETS = [R_EXE, R_PORT, R_REP, R_ARR, R_FIN, R_CUS, R_APP, R_STF, R_RSK, R_AUD];
const REPORTS = [];
CATS.forEach((c,ci)=>{
  const set = R_SETS[ci] || [];
  set.forEach(r => { r.cat = c; r.catN = c.n; r.ci = ci; REPORTS.push(r); });
});
const byId = id => REPORTS.find(r => r.id === id);

/* role → category access */
const ACCESS = {
  'Super Admin':                [1,2,3,4,5,6,7,8,9,10],
  'Administrator':              [1,2,3,4,5,6,7,8,9,10],
  'Auditor / Compliance Officer':[1,3,5,10],
  'Loan Officer':               [2,6,7],
  'Collections Officer':        [3,4,6],
  'Accountant / Finance Officer':[1,3,5,10]
};
let VIEWROLE = 'Super Admin';
const canRun = (r, role=VIEWROLE) => (ACCESS[role]||[]).includes(r.catN);
const ROLEOF = {
  'Super Admin':'full','Administrator':'full','Auditor / Compliance Officer':'read',
  'Loan Officer':'read','Collections Officer':'read','Accountant / Finance Officer':'read'
};
