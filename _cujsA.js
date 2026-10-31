<script>
/* ============================================================
   GOLDEN FINANCIAL SERVICES · CUSTOMERS  (1/4)
   Helpers, customer and loan data, sections 1–3.
   ============================================================ */
const el = id => document.getElementById(id);
const nf = n => Math.round(Number(n)||0).toLocaleString('en-US');
const mk = n => 'MK ' + nf(n);
const mk2 = n => (n>=1000000 ? 'MK ' + (n/1000000).toFixed(2) + 'm' : n>=1000 ? 'MK ' + Math.round(n/1000) + 'k' : mk(n));
const TODAY = '2026-10-30';
const esc = s => String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const pct = (a,b) => b ? Math.round(a/b*100) : 0;
const cap = s => String(s||'').charAt(0).toUpperCase() + String(s||'').slice(1);
const initials = s => String(s||'?').split(' ').filter(Boolean).map(w=>w[0]).slice(0,2).join('').toUpperCase();
const sum = (a,f) => a.reduce((s,x)=>s+(f?Number(f(x))||0:Number(x)||0),0);
const clamp = (v,a,b) => Math.max(a, Math.min(b, v));

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
document.addEventListener('keydown', e=>{ if(e.key === 'Escape') closeModal(); });

/* ----- dates ----- */
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const fmtDate = iso => { if(!iso) return '—'; const d = new Date(iso+'T00:00:00');
  return d.getDate().toString().padStart(2,'0') + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear(); };
const fmtShort = iso => { if(!iso) return '—'; const d = new Date(iso+'T00:00:00');
  return d.getDate().toString().padStart(2,'0') + ' ' + MONTHS[d.getMonth()]; };
const addDays = (iso,n) => { const d = new Date(iso+'T00:00:00'); d.setDate(d.getDate()+n); return d.toISOString().slice(0,10); };
const addMonths = (iso,n) => { const d = new Date(iso+'T00:00:00'); const day = d.getDate();
  d.setDate(1); d.setMonth(d.getMonth()+n); const last = new Date(d.getFullYear(), d.getMonth()+1, 0).getDate();
  d.setDate(Math.min(day,last)); return d.toISOString().slice(0,10); };
const addYears = (iso,n) => addMonths(iso, n*12);
const daysBetween = (a,b) => Math.round((new Date(b+'T00:00:00') - new Date(a+'T00:00:00'))/86400000);
const todayClock = () => new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});

/* ===================== PRODUCTS & STAFF ===================== */
const PRODUCTS = [
  {name:'Business Boost',  min:100000,  max:5000000,  rate:3.5, terms:[6,9,12,18,24], fee:2.5},
  {name:'Salary Advance',  min:50000,   max:800000,   rate:2.5, terms:[3,6,9,12],      fee:1.5},
  {name:'Emergency Cash',  min:30000,   max:400000,   rate:4.0, terms:[1,3,6],         fee:2.0},
  {name:'Agri Season',     min:100000,  max:1500000,  rate:3.0, terms:[6,9,12],        fee:2.0},
  {name:'Group Lending',   min:40000,   max:500000,   rate:2.8, terms:[6,9,12],        fee:1.0},
  {name:'Asset Finance',   min:500000,  max:10000000, rate:3.2, terms:[12,18,24,36],   fee:3.0}
];
const productBy = n => PRODUCTS.find(p=>p.name===n) || PRODUCTS[0];
const OFFICER_NAMES = ['Yamikani Banda','Blessings Tembo','Linda Mhango','Tadala Msonthi','Esther Mwale','Fatsani Gondwe'];
const pmt = (P,r,term) => { if(!r) return Math.round(P/term); return Math.floor(P*r/(1-Math.pow(1+r,-term))); };

/* ===================== CUSTOMER SEED ===================== */
/* name, type, phone, nrc, district, employer, occupation, income,
   status, kyc, risk, joined, (business owner) */
const CU_SEED = [
  ['Chisomo Kachale','Individual','+265 999 481 220','483921/10/1','Blantyre','Blantyre Water Board','Clerk',620000,'Active','Verified','Low','2024-03-11'],
  ['Tadala Msonthi','Individual','+265 991 220 018','771204/20/1','Mangochi','Msonthi Traders','Trader',880000,'Active','Verified','Medium','2024-05-02'],
  ['Memory Phiri','Individual','+265 888 220 481','220481/06/1','Lilongwe','Ministry of Health','Nurse',410000,'Active','Verified','Low','2024-06-19'],
  ['Blessings Tembo','Individual','+265 999 610 774','610774/31/1','Blantyre','Tembo Hardware','Business owner',520000,'Active','Verified','Medium','2024-08-04'],
  ['Alinafe Nyirenda','Individual','+265 881 442 019','442019/04/1','Lilongwe','National Bank','Bank officer',1150000,'Active','Verified','Low','2024-09-27'],
  ['Esther Mwale','Individual','+265 995 118 200','118200/31/1','Blantyre','—','Market trader',230000,'Active','Pending','High','2025-01-15'],
  ['Gondwe Transport','Business','+265 888 770 040','770040/16/1','Kasungu','Gondwe Transport','Transport operator',1800000,'Active','Verified','Low','2023-11-08','Fatsani Gondwe'],
  ['Linda Mhango','Individual','+265 999 004 812','004812/22/1','Mzuzu','Mzuzu University','Lecturer',780000,'Active','Verified','Low','2024-02-20'],
  ['Peter Chirwa','Individual','+265 993 220 771','220771/18/1','Mzuzu','—','Smallholder farmer',190000,'Active','Expired','Medium','2024-04-12'],
  ['Mvula Groceries','Business','+265 997 118 004','118004/12/1','Blantyre','Mvula Groceries','Retail shop',760000,'Active','Verified','Low','2023-07-30','Grace Mvula'],
  ['Joseph Kalua','Individual','+265 991 004 220','004220/09/1','Zomba','—','Smallholder farmer',340000,'Active','Pending','High','2025-03-06'],
  ['Agnes Chikopa','Individual','+265 888 118 991','118991/27/1','Blantyre','—','Informal trader',210000,'Suspended','Verified','High','2023-09-14'],
  ['Rodrick Zimba','Individual','+265 999 774 118','774118/08/1','Blantyre','Telekom Networks','Technician',690000,'Active','Verified','Low','2025-02-11'],
  ['Kaunda Poultry','Business','+265 991 662 004','662004/14/1','Lilongwe','Kaunda Poultry','Poultry farming',540000,'Active','Verified','Low','2024-10-05','Sarah Kaunda'],
  ['Isaac Banda','Individual','+265 888 004 771','004771/05/1','Zomba','Zomba City Council','Accounts assistant',300000,'Pending Verification','Pending','Medium','2026-09-18'],
  ['Thoko Msiska','Individual','+265 995 220 118','220118/19/1','Mzuzu','—','Informal trader',165000,'Pending Verification','Pending','Medium','2026-10-02'],
  ['Nyondo Fisheries','Business','+265 997 481 006','481006/23/1','Mangochi','Nyondo Fisheries','Fish processing',920000,'Active','Verified','Medium','2024-07-21','Patrick Nyondo'],
  ['Mercy Chatsika','Individual','+265 881 009 442','009442/11/1','Kasungu','—','Smallholder farmer',145000,'Inactive','Pending','Medium','2023-12-03'],
  ['Duncan Mwale','Individual','+265 999 118 662','118662/30/1','Blantyre','FDH Bank','Credit analyst',880000,'Active','Verified','Low','2025-05-16'],
  ['Kadzamira Salon','Business','+265 993 774 220','774220/07/1','Lilongwe','Kadzamira Salon','Beauty salon',260000,'Active','Verified','Medium','2024-11-22','Ellen Kadzamira'],
  ['Yamikani Banda','Individual','+265 991 300 881','300881/13/1','Lilongwe','Golden Financial Services','Loan officer',950000,'Active','Verified','Low','2025-07-08'],
  ['Towera Nkhoma','Individual','+265 888 220 664','220664/02/1','Salima','—','Trader',180000,'Blacklisted','Rejected','High','2023-05-19'],
  ['Kondwani Mbewe','Individual','+265 999 660 118','660118/21/1','Lilongwe','Lilongwe City Council','Driver',320000,'Inactive','Verified','Medium','2023-08-27'],
  ['Chimwemwe Kachala','Individual','+265 995 118 774','118774/17/1','Mulanje','—','Tea estate worker',240000,'Active','Verified','Low','2024-12-14'],
  ['Ruth Nsanja','Individual','+265 881 662 220','662220/26/1','Zomba','Chancellor College','Administrator',470000,'Active','Expired','Medium','2024-01-30'],
  ['Aubrey Chakwera','Individual','+265 999 004 118','004118/29/1','Kasungu','—','Mechanic',280000,'Active','Pending','High','2026-06-11'],
  ['Loveness Chikuni','Individual','+265 993 481 662','481662/15/1','Blantyre','—','Tailor',310000,'Active','Verified','Low','2025-04-03'],
  ['Mataka Agro','Business','+265 991 118 004','118004/24/1','Salima','Mataka Agro','Agro-dealer',1250000,'Active','Verified','Medium','2023-10-16','Steven Mataka'],
  ['Jessie Kamanga','Individual','+265 888 771 220','771220/03/1','Mzuzu','—','Student',90000,'Pending Verification','Pending','Medium','2026-10-12'],
  ['Precious Ching\u2019oma','Individual','+265 999 220 881','220881/12/1','Mangochi','—','Fish trader',260000,'Active','Verified','Low','2025-06-25'],
  ['Wilfred Banda','Individual','+265 995 004 664','004664/28/1','Lilongwe','Retired','Retired teacher',210000,'Inactive','Verified','Low','2023-06-07'],
  ['Msowoya Stores','Business','+265 881 118 771','118771/20/1','Mzuzu','Msowoya Stores','Retail shop',640000,'Active','Verified','Medium','2024-05-28','Beatrice Msowoya'],
  ['Gift Soko','Individual','+265 997 662 118','662118/09/1','Zomba','—','Boda-boda operator',190000,'Suspended','Verified','High','2025-08-19'],
  ['Naomi Kalinde','Individual','+265 999 481 004','481004/07/1','Blantyre','Mwaiwathu Hospital','Radiographer',720000,'Active','Verified','Low','2025-09-30']
];

const TOWNS = {Blantyre:'Limbe',Lilongwe:'Area 25',Mzuzu:'Chibavi',Zomba:'Sadzi',
  Mangochi:'Mponda',Kasungu:'Kasungu Boma',Salima:'Chipoka',Mulanje:'Mulanje Boma'};
const KIN_NAMES = ['Alice Kachale','Grace Banda','Mary Phiri','John Tembo','Ellen Mwale','Peter Gondwe',
  'Rose Mhango','Daniel Chirwa','Lucy Mvula','Martha Kalua','Patrick Chikopa','Agnes Zimba',
  'Isaac Kaunda','Fanny Msiska','Blessings Nyondo','Chimwane Chatsika','Yamikani Mbewe','Tadala Kachala'];
const KIN_RELS = ['Spouse','Sibling','Parent','Child','Guardian','Other'];
const FEMALE = ['Chisomo','Memory','Alinafe','Esther','Linda','Grace','Agnes','Sarah','Thoko','Mercy',
  'Ellen','Towera','Ruth','Loveness','Jessie','Precious','Beatrice','Naomi','Tadala','Martha'];
const BANKS = ['National Bank of Malawi','Standard Bank','FDH Bank','NBS Bank','Ecobank','None'];
const MOMOS = ['Airtel Money','TNM Mpamba','Airtel Money','Both','TNM Mpamba'];
const EMAIL_DOM = ['gmail.com','yahoo.com','outlook.com','goldenmail.mw'];

function buildCustomers(){
  return CU_SEED.map((row,i)=>{
    const [name,type,phone,nrc,district,employer,occupation,income,status,kyc,risk,joined,owner] = row;
    const ownerName = owner || name;
    const parts = ownerName.split(' ');
    const first = parts[0] || ownerName, last = parts[parts.length-1] || ownerName;
    const female = FEMALE.includes(first);
    const town = TOWNS[district] || district;
    const kinName = KIN_NAMES[i % KIN_NAMES.length];
    const flags = {
      Verified: {identity:true, address:true, employment:true, income:true, docs:true, phone:true},
      Pending:  {identity:true, address:true, employment:false, income:false, docs:false, phone:true},
      Expired:  {identity:true, address:true, employment:true, income:true, docs:false, phone:true},
      Rejected: {identity:false, address:false, employment:false, income:false, docs:false, phone:true}
    }[kyc] || {identity:false,address:false,employment:false,income:false,docs:false,phone:true};

    const idExpiry = kyc==='Expired' ? '2026-08-14' : addYears(joined, 5);
    const c = {
      no: 'GF-' + String(480 + i*3).padStart(6,'0'),
      name, type, owner: type==='Business' ? ownerName : '',
      first: type==='Business' ? '' : first,
      last: type==='Business' ? '' : last,
      phone, nrc, district, town,
      email: (first + '.' + last).toLowerCase().replace(/[^a-z.]/g,'') + '@' + EMAIL_DOM[i % EMAIL_DOM.length],
      address: 'Plot ' + (104 + i*7) + ', ' + (i%4===0?'Chinyonga':i%4===1?'Nkolokosa':i%4===2?'Zolozolo':'Chirimba'),
      postal: 'P.O. Box ' + (305 + i*13) + ', ' + district,
      dob: type==='Business' ? '' : (1966 + (i*3 % 30)) + '-' + String((i*5 % 12)+1).padStart(2,'0') + '-' + String((i*7 % 27)+1).padStart(2,'0'),
      gender: type==='Business' ? '—' : (female ? 'Female' : 'Male'),
      marital: type==='Business' ? '—' : ['Single','Married','Married','Widowed','Divorced'][i % 5],
      lang: ['Chichewa','English','Chichewa','Tumbuka','Yao'][i % 5],
      category: type==='Business' ? 'SME' : (i%11===0 ? 'Group member' : 'Individual'),
      employ: type==='Business' ? 'Self-employed' : (employer==='—' ? (i%3===0?'Informal trader':'Smallholder farmer') : 'Employed — salaried'),
      employer, occupation, income,
      incomeFreq: employer==='—' ? (i%2 ? 'Weekly' : 'Seasonal') : 'Monthly',
      expenses: Math.round(income * (0.34 + (i%5)*0.05) / 1000) * 1000,
      kin: {name: kinName, rel: KIN_RELS[i % KIN_RELS.length], phone: '+265 99' + (2 + i%7) + ' ' + (100 + i*7) + ' ' + (200 + i*3), live: i%3 ? 'No' : 'Yes'},
      momo: MOMOS[i % MOMOS.length],
      momoNo: phone,
      bank: BANKS[i % BANKS.length],
      bankAcc: '1004 ' + (2200 + i*11) + ' ' + (50 + i%40),
      bankBranch: town,
      bankName: ownerName,
      status, kyc, risk, joined,
      lastActive: addDays(TODAY, -(i % 34)),
      portal: i % 7 !== 0,
      consent: {data:true, terms:true, truth:true, portals: i % 7 !== 0},
      kycFlags: flags,
      idExpiry,
      kycNote: {
        Verified:'Identity, address, employment and income verified.',
        Pending:'Awaiting employment letter and three months of income proof.',
        Expired:'National ID expired on 14 Aug 2026 — a replacement copy is required.',
        Rejected:'NRC copy illegible and the address could not be confirmed.'
      }[kyc] || '',
      history: [], messages: [], tickets: [], notes: [], guarantors: [], collateral: [], assessments: [],
      docs: {}, kycLog: [], activity: []
    };
    c.docs = buildDocs(c, i);
    return c;
  });
}

const DOC_DEFS = [
  {key:'id',      label:'National ID / passport',          note:'Certified copy, both sides'},
  {key:'address', label:'Proof of address',                note:'Utility bill or tenancy agreement'},
  {key:'employ',  label:'Employment letter / business permit', note:'Employer or council issued'},
  {key:'income',  label:'Income proof',                    note:'Payslip or 3 months bank statement'},
  {key:'apply',   label:'Loan application form',           note:'Signed by the customer'},
  {key:'agreement', label:'Signed loan agreement',         note:'Stamped and witnessed'},
  {key:'guarantor', label:'Guarantor documents',           note:'Guarantor ID and payslip'},
  {key:'receipts', label:'Repayment receipts',             note:'Latest three receipts'},
  {key:'settle',  label:'Settlement / closure letter',     note:'Only after full repayment'}
];

function buildDocs(c, i){
  const f = c.kycFlags, out = {};
  const hasLoan = i % 3 !== 2;
  const closed = i % 7 === 3;
  DOC_DEFS.forEach(d=>{
    let present = false, expiry = '';
    if(d.key==='id') present = f.identity;
    if(d.key==='address') present = f.address;
    if(d.key==='employ') present = f.employment;
    if(d.key==='income') present = f.income;
    if(d.key==='apply' || d.key==='agreement' || d.key==='receipts') present = hasLoan;
    if(d.key==='guarantor') present = hasLoan && i % 4 !== 1;
    if(d.key==='settle') present = closed;
    if(d.key==='id') expiry = c.idExpiry;
    if(d.key==='address' && present) expiry = addMonths(TODAY, 3 + (i % 9));
    if(d.key==='employ' && present) expiry = addMonths(TODAY, 6 + (i % 12));
    let state = present ? 'ok' : 'missing';
    if(present && expiry && expiry < TODAY) state = 'expired';
    out[d.key] = {label:d.label, note:d.note, state,
      uploaded: present ? addDays(c.joined, 2 + (i%9)) : '',
      expiry};
  });
  return out;
}

const CUSTOMERS = buildCustomers();

/* ===================== LOANS ===================== */
/* custIndex, product, principal, term, status, disbursed, partialInstalment */
const LOAN_SEED = [
  [0,'Business Boost',1500000,12,'Active','2026-02-10'],
  [0,'Emergency Cash',120000,3,'Fully Repaid','2025-11-05'],
  [1,'Business Boost',2000000,18,'Active','2026-04-15'],
  [2,'Salary Advance',400000,9,'Active','2026-06-01'],
  [3,'Business Boost',900000,12,'Overdue','2026-01-20'],
  [4,'Salary Advance',700000,12,'Active','2026-05-08'],
  [4,'Asset Finance',4000000,24,'Active','2025-09-12'],
  [5,'Group Lending',150000,6,'Overdue','2026-03-18'],
  [6,'Asset Finance',6500000,24,'Active','2025-12-02'],
  [7,'Salary Advance',500000,9,'Fully Repaid','2025-10-14'],
  [7,'Salary Advance',300000,6,'Active','2026-07-09'],
  [8,'Agri Season',450000,9,'Overdue','2026-02-25'],
  [9,'Business Boost',1200000,12,'Active','2026-03-30'],
  [10,'Agri Season',700000,12,'Defaulted','2025-11-20'],
  [11,'Group Lending',200000,6,'Active','2026-08-14'],
  [12,'Emergency Cash',80000,3,'Fully Repaid','2025-12-19'],
  [13,'Salary Advance',600000,9,'Active','2026-06-20'],
  [13,'Business Boost',2500000,18,'Awaiting Disbursement','2026-09-28'],
  [14,'Emergency Cash',100000,6,'Pending','2026-10-20'],
  [16,'Business Boost',3000000,18,'Overdue','2026-05-11',6],
  [18,'Salary Advance',800000,12,'Active','2026-07-02'],
  [19,'Group Lending',300000,9,'Active','2026-04-24'],
  [20,'Salary Advance',450000,9,'Fully Repaid','2026-01-06'],
  [22,'Emergency Cash',60000,3,'Defaulted','2025-12-08'],
  [23,'Agri Season',350000,6,'Active','2026-08-01'],
  [24,'Salary Advance',380000,9,'Active','2026-06-12'],
  [25,'Emergency Cash',90000,6,'Overdue','2026-05-19'],
  [26,'Group Lending',250000,9,'Active','2026-07-22'],
  [27,'Agri Season',1100000,12,'Active','2026-02-03'],
  [28,'Emergency Cash',50000,3,'Pending','2026-10-24'],
  [29,'Group Lending',180000,6,'Active','2026-08-28'],
  [30,'Emergency Cash',70000,3,'Fully Repaid','2025-09-15'],
  [31,'Business Boost',1400000,12,'Active','2026-04-06'],
  [32,'Emergency Cash',100000,6,'Overdue','2026-04-11'],
  [33,'Salary Advance',900000,12,'Approved','2026-10-26']
];

const LOANS = [];
const PAYMENTS = [];
let rcSeq = 4820;
const nextRc = () => 'RC-' + (++rcSeq);

function buildLoans(){
  LOANS.length = 0; PAYMENTS.length = 0; rcSeq = 4820;
  LOAN_SEED.forEach((s,i)=>{
    const [ci, product, principal, term, status, disb, part] = s;
    const c = CUSTOMERS[ci];
    if(!c) return;
    const p = productBy(product);
    const r = p.rate/100;
    const base = pmt(principal, r, term);
    let bal = principal;
    const insts = [];
    for(let k=1;k<=term;k++){
      const interest = Math.round(bal*r);
      let prin = Math.round(base - interest);
      if(prin <= 0) prin = Math.round(principal/term);
      if(k===term || prin > bal) prin = bal;
      bal -= prin;
      insts.push({no:k, due:addMonths(disb,k), prin, interest, amount:prin+interest, paid:0, status:'Due'});
    }
    const live = ['Active','Overdue','Defaulted','Fully Repaid'].includes(status);
    const l = {id:'LN-' + (2401 + i*3), cust:c.no, custName:c.name, product, principal, term,
      rate:p.rate, fee:Math.round(principal*p.fee/100), status, disb,
      close:null, base, insts, live, officer: OFFICER_NAMES[i % OFFICER_NAMES.length]};
    LOANS.push(l);
    if(!live) return;

    const elapsed = Math.max(0, Math.floor(daysBetween(disb, TODAY)/30.4));
    let paid = 0;
    if(status === 'Fully Repaid') paid = term;
    else if(status === 'Active') paid = Math.min(term-1, elapsed);
    else if(status === 'Overdue') paid = Math.max(0, Math.min(term-2, (part ? part-1 : elapsed-2)));
    else if(status === 'Defaulted') paid = Math.max(1, Math.min(2, term-1));

    /* processing fee taken at disbursement */
    PAYMENTS.push({id:nextRc(), loan:l.id, cust:c.no, date:disb, amount:l.fee,
      principal:0, interest:0, fees:l.fee, penalty:0, type:'Fees', method: c.momo==='None'?'Cash':c.momo});

    for(let k=0;k<paid;k++){
      const inst = insts[k];
      inst.paid = inst.amount;
      inst.status = 'Paid';
      const early = status === 'Fully Repaid' && k === paid-1;
      const payDate = early ? addDays(inst.due, -12) : addDays(inst.due, -((i + k) % 3));
      PAYMENTS.push({id:nextRc(), loan:l.id, cust:c.no, date:payDate, amount:inst.amount,
        principal:inst.prin, interest:inst.interest, fees:0, penalty:0, type: early ? 'Advance' : 'Scheduled',
        method: c.momo==='None'?'Bank transfer':c.momo});
    }
    if(part && insts[part-1] && status !== 'Fully Repaid'){
      const inst = insts[part-1];
      const amt = Math.round(inst.amount * 0.55);
      const int = Math.min(inst.interest, Math.round(amt * 0.7));
      inst.paid = amt;
      inst.status = 'Partial';
      PAYMENTS.push({id:nextRc(), loan:l.id, cust:c.no, date:addDays(inst.due, 4), amount:amt,
        principal:amt-int, interest:int, fees:0, penalty:0, type:'Partial',
        method:'Cash'});
    }
    /* missed instalments recorded for overdue / defaulted facilities */
    if(status === 'Overdue' || status === 'Defaulted'){
      insts.forEach(inst=>{
        if(inst.due < TODAY && (inst.status === 'Due')){
          PAYMENTS.push({id:nextRc(), loan:l.id, cust:c.no, date:inst.due, amount:0,
            principal:0, interest:0, fees:0, penalty:0, type:'Missed', method:'—'});
        }
      });
    }
    /* one penalty payment for facilities that have been chased */
    if(status === 'Overdue' && l.principal > 200000){
      PAYMENTS.push({id:nextRc(), loan:l.id, cust:c.no, date:addDays(TODAY,-9), amount:25000,
        principal:0, interest:0, fees:0, penalty:25000, type:'Penalty', method:'Cash'});
    }

    l.close = status === 'Fully Repaid' ? addMonths(disb, term) : null;
    recalcLoan(l);
    c.history.push({when:disb, what:'Loan disbursed — ' + product, amount:principal, by:l.officer});
    if(status === 'Fully Repaid') c.history.push({when:l.close, what:'Loan ' + l.id + ' fully repaid and closed', amount:principal, by:'System'});
  });
  LOANS.forEach(l=>{ if(l.live && !l.paidPrin && l.status!=='Fully Repaid') recalcLoan(l); });
  LOANS.filter(l=>!l.live).forEach(l=>{ l.paidPrin = 0; l.paidInt = 0; l.outPrin = 0; l.outInt = 0;
    l.outstanding = 0; l.arrears = 0; l.dpd = 0; l.nextDue = null; l.progress = 0; l.penaltyDue = 0; l.paidCount = 0; });
  PAYMENTS.sort((a,b)=> a.date < b.date ? 1 : a.date > b.date ? -1 : 0);
}

function recalcLoan(l){
  let outPrin = 0, outInt = 0, arrears = 0, oldest = null, next = null;
  let paidPrin = 0, paidInt = 0;
  l.insts.forEach(inst=>{
    const frac = inst.amount ? clamp(inst.paid/inst.amount,0,1) : 0;
    paidPrin += inst.prin*frac;
    paidInt  += inst.interest*frac;
    outPrin  += inst.prin*(1-frac);
    outInt   += inst.interest*(1-frac);
    if(frac < 1 && inst.due < TODAY){
      arrears += inst.amount*(1-frac);
      if(!oldest || inst.due < oldest) oldest = inst.due;
    }
    if(frac < 1 && inst.due >= TODAY && !next) next = inst.due;
    if(frac < 1 && !next) next = inst.due;
  });
  l.paidPrin = Math.round(paidPrin);
  l.paidInt = Math.round(paidInt);
  l.outPrin = Math.round(outPrin);
  l.outInt = Math.round(outInt);
  l.outstanding = Math.round(outPrin + outInt);
  l.arrears = Math.round(arrears);
  l.dpd = oldest ? Math.max(0, daysBetween(oldest, TODAY)) : 0;
  l.nextDue = next;
  l.penaltyDue = l.arrears ? Math.round(l.arrears*0.05) : 0;
  l.paidCount = l.insts.filter(i=>i.amount && i.paid >= i.amount).length;
  l.progress = l.principal ? pct(l.paidPrin, l.principal) : 0;
}

/* ===================== derived helpers ===================== */
const cust = no => CUSTOMERS.find(c=>c.no === no) || CUSTOMERS[0];
const loansOf = no => LOANS.filter(l=>l.cust === no);
const liveLoansOf = no => LOANS.filter(l=>l.cust === no && l.live);
const paysOf = no => PAYMENTS.filter(p=>p.cust === no);
const paysOfLoan = id => PAYMENTS.filter(p=>p.loan === id);
const exposure = no => Math.round(sum(liveLoansOf(no), l=>l.outstanding));
const arrearsOf = no => Math.round(sum(liveLoansOf(no), l=>l.arrears));
const hasOverdue = no => liveLoansOf(no).some(l=>l.arrears > 0);
const activeCount = no => liveLoansOf(no).filter(l=>l.status === 'Active' || l.status === 'Overdue').length;
const openTickets = no => (cust(no).tickets || []).filter(t=>t.status !== 'Closed' && t.status !== 'Resolved').length;
const kycScore = c => Object.values(c.kycFlags).filter(Boolean).length;
const missingDocs = c => DOC_DEFS.filter(d=>c.docs[d.key].state === 'missing').length;
const expiredDocs = c => DOC_DEFS.filter(d=>c.docs[d.key].state === 'expired').length;
const totalRepaid = no => Math.round(sum(paysOf(no), p=>p.amount));

const statusTone = s => ({
  Active:'b-ok', Inactive:'b-proc', Suspended:'b-rej', Blacklisted:'b-rej',
  'Pending Verification':'b-await', Verified:'b-appr',
  'Fully Repaid':'b-conf', Overdue:'b-rej', Defaulted:'b-rej', Pending:'b-await',
  Approved:'b-appr', 'Awaiting Disbursement':'b-await',
  Low:'b-ok', Medium:'b-await', High:'b-rej',
  New:'b-await', 'In progress':'b-conf', Escalated:'b-rej', Resolved:'b-ok', Closed:'b-proc'
}[s] || 'b-proc');
const kycTone = c => c.kyc === 'Verified' ? 'b-ok' : c.kyc === 'Rejected' ? 'b-rej' : 'b-await';
const kycLabel = c => c.kyc === 'Verified' ? 'Verified' : c.kyc === 'Expired' ? 'ID expired' : c.kyc === 'Rejected' ? 'Rejected' : 'Pending';

function logAct(c, what, by='Chikondi Mwale'){
  c.activity.unshift({when:TODAY, time:todayClock(), what, by});
  if(c.activity.length > 60) c.activity.length = 60;
}
function goto(id){
  const t = document.getElementById(id);
  if(t) window.scrollTo({top:t.offsetTop - 108, behavior:'smooth'});
}

/* ===================== SELECTS ===================== */
const CUST_SELECTS = ['profCust','loanCust','repCust','finCust','docCust','comCust','riskCust','actCust'];
function fillSelects(){
  CUST_SELECTS.forEach(id=>{
    const s = el(id); if(!s) return;
    const cur = s.value;
    s.innerHTML = CUSTOMERS.map(c=>`<option value="${c.no}">${c.no} · ${esc(c.name)}</option>`).join('');
    s.value = (cur && CUSTOMERS.some(c=>c.no === cur)) ? cur : CUSTOMERS[0].no;
  });
  const rp = el('rpAs');
  if(rp){
    const cur = rp.value;
    rp.innerHTML = '<option value="">All customers</option>' +
      CUSTOMERS.map(c=>`<option value="${c.no}">${c.no} · ${esc(c.name)}</option>`).join('');
    rp.value = cur;
  }
  const tk = el('tkCust');
  if(tk){
    const cur = tk.value;
    tk.innerHTML = '<option value="">All customers</option>' +
      CUSTOMERS.map(c=>`<option value="${c.no}">${c.no} · ${esc(c.name)}</option>`).join('');
    tk.value = cur;
  }
}

/* ===================== 1 · OVERVIEW ===================== */
function renderBand(){
  const total = CUSTOMERS.length;
  el('bandTotal').textContent = nf(total);
  el('bandActive').textContent = nf(CUSTOMERS.filter(c=>c.status === 'Active').length);
  el('bandLoans').textContent = nf(CUSTOMERS.filter(c=>activeCount(c.no) > 0).length);
  el('bandArrears').textContent = nf(CUSTOMERS.filter(c=>hasOverdue(c.no)).length);
  el('bandOwed').textContent = mk2(sum(CUSTOMERS, c=>exposure(c.no)));
}

function renderOverview(){
  const total = CUSTOMERS.length;
  const active = CUSTOMERS.filter(c=>c.status === 'Active').length;
  const inactive = CUSTOMERS.filter(c=>c.status === 'Inactive').length;
  const suspended = CUSTOMERS.filter(c=>c.status === 'Suspended').length;
  const black = CUSTOMERS.filter(c=>c.status === 'Blacklisted').length;
  const pending = CUSTOMERS.filter(c=>c.status === 'Pending Verification').length;
  const recent = CUSTOMERS.filter(c=>daysBetween(c.joined, TODAY) <= 30);
  const withLoans = CUSTOMERS.filter(c=>activeCount(c.no) > 0);
  const overdue = CUSTOMERS.filter(c=>hasOverdue(c.no));
  const verified = CUSTOMERS.filter(c=>c.kyc === 'Verified');
  const expired = CUSTOMERS.filter(c=>c.kyc === 'Expired');

  const tiles = [
    {l:'Total registered', v:nf(total), s:`${nf(recent.length)} in the last 30 days`, k:'gold', p:100},
    {l:'Active customers', v:nf(active), s:`${pct(active,total)}% of the register`, k:'', p:pct(active,total)},
    {l:'Inactive', v:nf(inactive), s:`${nf(suspended)} suspended · ${nf(black)} blacklisted`, k:'', p:pct(inactive,total)},
    {l:'New registrations', v:nf(recent.length), s:'Joined in the last 30 days', k:'blue', p:pct(recent.length,total)},
    {l:'With active loans', v:nf(withLoans.length), s:`${nf(LOANS.filter(l=>l.live).length)} facilities live`, k:'', p:pct(withLoans.length,total)},
    {l:'With overdue loans', v:nf(overdue.length), s:`${mk(sum(overdue, c=>arrearsOf(c.no)))} in arrears`, k:'red', p:pct(overdue.length,total)},
    {l:'KYC verified', v:nf(verified.length), s:`${nf(pending)} pending · ${nf(expired.length)} expired IDs`, k:'', p:pct(verified.length,total)},
    {l:'Total exposure', v:mk2(sum(CUSTOMERS, c=>exposure(c.no))), s:'Outstanding principal + interest', k:'', p:100}
  ];
  el('ovTiles').innerHTML = tiles.map(t=>`
    <div class="kpi ${t.k}">
      <div class="kl">${t.l}</div>
      <div class="kv">${t.v}</div>
      <div class="ks">${t.s}</div>
      <div class="kbar"><i style="width:${clamp(t.p,0,100)}%"></i></div>
    </div>`).join('');

  const strip = [
    ['Active', active], ['Inactive', inactive], ['Pending Verification', pending],
    ['Suspended', suspended], ['Blacklisted', black]
  ];
  el('ovStatus').innerHTML = strip.map(([s,n])=>`
    <div data-st="${s}" style="cursor:pointer" title="Show ${s} in the directory">
      <b>${nf(n)}</b><span>${s}</span></div>`).join('') +
    `<div><b>${nf(verified.length)}</b><span>KYC verified</span></div>`;
  el('ovStatusCount').textContent = total + ' customers';
  el('ovStatus').querySelectorAll('[data-st]').forEach(d=>{
    d.onclick = ()=>{ CU.tab = d.dataset.st; CU.page = 1; renderDirectory(); syncDirTabs(); goto('s3'); };
  });

  const recentSix = [...CUSTOMERS].sort((a,b)=> a.joined < b.joined ? 1 : -1).slice(0,6);
  el('ovRecent').innerHTML = recentSix.map(c=>`
    <tr class="rowlink" data-open="${c.no}">
      <td><div style="font-weight:700">${esc(c.name)}</div>
        <div style="font-size:9.5px;color:var(--muted)">${c.no}</div></td>
      <td><span class="chip">${c.type}</span></td>
      <td>${c.district}</td>
      <td><span class="badge ${statusTone(c.status)}">${c.status}</span></td>
      <td style="white-space:nowrap">${fmtShort(c.joined)}</td></tr>`).join('') ||
    '<tr><td colspan="5" class="empty">No customers yet.</td></tr>';
  el('ovRecent').querySelectorAll('[data-open]').forEach(r=>{
    r.onclick = ()=>openCustomer(r.dataset.open);
  });

  const alerts = [];
  CUSTOMERS.filter(c=>c.kyc !== 'Verified' && c.status !== 'Blacklisted').slice(0,4).forEach(c=>{
    alerts.push({t:c.name, s:`${kycLabel(c)} · ${missingDocs(c)} document${missingDocs(c)===1?'':'s'} missing`,
      b:'Verify', act:()=>{ goto('s5'); selectCust('profCust', c.no); KYC.cust = c.no; renderKYC(); }});
  });
  CUSTOMERS.filter(c=>hasOverdue(c.no)).slice(0,3).forEach(c=>{
    alerts.push({t:c.name, s:`Arrears ${mk(arrearsOf(c.no))} · ${liveLoansOf(c.no).find(l=>l.arrears>0).dpd} days past due`,
      b:'Open', act:()=>{ openCustomer(c.no); goto('s6'); }});
  });
  if(!alerts.length) alerts.push({t:'Nothing outstanding', s:'Every customer is verified and up to date', b:'', act:null});
  el('ovAlertCount').textContent = alerts.length;
  el('ovAlerts').innerHTML = alerts.map((a,i)=>`
    <div class="lrow">
      <div class="lic" style="background:var(--gold-soft);color:var(--gold-dark);font-size:9px">${i+1}</div>
      <div><div class="lt">${esc(a.t)}</div><div class="ls">${esc(a.s)}</div></div>
      <div class="lr">${a.b ? `<button class="btn btn-ghost" data-al="${i}">${a.b}</button>` : ''}</div>
    </div>`).join('');
  el('ovAlerts').querySelectorAll('[data-al]').forEach(b=>{
    b.onclick = ()=> alerts[Number(b.dataset.al)].act && alerts[Number(b.dataset.al)].act();
  });
}

/* ===================== 2 · REGISTRATION ===================== */
const REG_DOCS = ['NRC copy','Proof of address','Payslip / bank statement','Business permit','Guarantor ID'];
const REG = {type:'Individual', docs:[], draft:null, consent:{data:true, terms:true, truth:true, portals:false}};

function regField(id){ const e = el(id); return e ? e.value.trim() : ''; }
function regNumber(id){ const e = el(id); return e ? Number(e.value) || 0 : 0; }

function regSnapshot(){
  const business = REG.type === 'Business';
  const name = business ? regField('cuBiz') : (regField('cuFirst') + ' ' + regField('cuLast')).trim();
  return {
    name, business, owner: business ? (regField('cuFirst') + ' ' + regField('cuLast')).trim() : '',
    first: regField('cuFirst'), last: regField('cuLast'),
    biz: regField('cuBiz'), tin: regField('cuTin'),
    category: regField('cuCategory'), phone: regField('cuPhone'), email: regField('cuEmail'),
    nrc: regField('cuNrc'), dob: regField('cuDob'), gender: regField('cuGender'),
    marital: regField('cuMarital'), lang: regField('cuLang'), district: regField('cuDistrict'),
    town: regField('cuTown'), address: regField('cuAddress'), postal: regField('cuPostal'),
    employ: regField('cuEmploy'), employer: regField('cuEmployer'), occupation: regField('cuOccupation'),
    income: regNumber('cuIncome'), incomeFreq: regField('cuIncomeFreq'), expenses: regNumber('cuExpenses'),
    kinName: regField('cuKinName'), kinRel: regField('cuKinRel'), kinPhone: regField('cuKinPhone'), kinLive: regField('cuKinLive'),
    momo: regField('cuMomo'), momoNo: regField('cuMomoNo'),
    bank: regField('cuBank'), bankAcc: regField('cuBankAcc'), bankBranch: regField('cuBankBranch'), bankName: regField('cuBankName')
  };
}

function regChecks(){
  const d = regSnapshot();
  return [
    {l:'Name captured', ok: !!(d.business ? d.biz : (d.first && d.last)), s: d.business ? 'Registered business name' : 'First name and surname'},
    {l:'Contact details', ok: !!(d.phone && d.phone.length >= 9), s:'Phone number with country code'},
    {l:'National ID recorded', ok: d.nrc.length >= 6, s:'NRC or passport number'},
    {l:'Address captured', ok: !!(d.district && d.address), s:'District and physical address'},
    {l:'Income declared', ok: d.income > 0, s:'Monthly income above zero'},
    {l:'Next of kin', ok: !!(d.kinName && d.kinPhone), s:'Emergency contact name and phone'},
    {l:'Consent given', ok: REG.consent.data && REG.consent.terms && REG.consent.truth, s:'Bureau, terms and declaration'},
    {l:'Documents attached', ok: REG.docs.length >= 2, s:'At least an ID and proof of address'}
  ];
}

function renderRegPreview(){
  const d = regSnapshot();
  const label = d.name || 'New customer';
  el('cuPreview').innerHTML = `
    <div class="custhead">
      <div class="avatar-lg ${d.business?'biz':''}">${initials(label)}</div>
      <div>
        <div class="cname">${esc(label)}</div>
        <div class="cmeta">${d.category || 'Individual'} · ${d.district || 'District'} · ${d.phone || 'Phone not captured'}</div>
        <div class="cchips">
          <span class="badge b-await">Pending verification</span>
          <span class="chip">${d.momo || 'Mobile money'}</span>
          <span class="chip">${d.bank === 'None' ? 'No bank' : (d.bank || 'Bank')}</span>
          <span class="chip">Income ${mk(d.income)}</span>
        </div>
      </div>
    </div>
    <div class="pfields" style="margin-top:10px">
      <div class="pfield"><div class="pk">NRC / passport</div><div class="pv ${d.nrc?'':'muted'}">${esc(d.nrc) || 'Not captured'}</div></div>
      <div class="pfield"><div class="pk">Occupation</div><div class="pv ${d.occupation?'':'muted'}">${esc(d.occupation) || '—'}</div></div>
      <div class="pfield"><div class="pk">Employer</div><div class="pv ${d.employer?'':'muted'}">${esc(d.employer) || '—'}</div></div>
      <div class="pfield"><div class="pk">Next of kin</div><div class="pv ${d.kinName?'':'muted'}">${esc(d.kinName) || 'Not captured'}${d.kinName ? ' · ' + esc(d.kinPhone) : ''}</div></div>
      <div class="pfield"><div class="pk">Monthly surplus</div><div class="pv">${mk(Math.max(0, d.income - d.expenses))}</div></div>
      <div class="pfield"><div class="pk">Documents</div><div class="pv">${REG.docs.length} attached</div></div>
    </div>`;
}

function renderRegChecklist(){
  const checks = regChecks();
  const done = checks.filter(c=>c.ok).length;
  el('cuCheckPill').textContent = done + ' / ' + checks.length;
  el('cuCheck').innerHTML = checks.map(c=>`
    <div class="check" style="cursor:default">
      <span class="ck ${c.ok?'y':'n'}">${c.ok?'✓':'–'}</span>
      <div style="flex:1"><b>${c.l}</b><span class="s">${c.s}</span></div>
    </div>`).join('');
  const missing = checks.filter(c=>!c.ok).length;
  el('cuCheckPill').style.opacity = missing ? 1 : 1;
}

function regRefresh(){ renderRegPreview(); renderRegChecklist(); }

function wireRegistration(){
  el('regType').querySelectorAll('[data-ct]').forEach(b=>{
    b.onclick = ()=>{
      REG.type = b.dataset.ct;
      el('regType').querySelectorAll('[data-ct]').forEach(x=>x.classList.toggle('on', x === b));
      el('regMode').textContent = REG.type;
      el('wrapBizName').style.display = REG.type === 'Business' ? '' : 'none';
      el('wrapTin').style.display = REG.type === 'Business' ? '' : 'none';
      el('lblFirst').innerHTML = REG.type === 'Business' ? 'Contact first name' : 'First name <span class="req">*</span>';
      el('lblLast').innerHTML = REG.type === 'Business' ? 'Contact surname' : 'Surname <span class="req">*</span>';
      el('cuCategory').value = REG.type === 'Business' ? 'SME' : 'Individual';
      regRefresh();
    };
  });

  ['cuFirst','cuLast','cuBiz','cuTin','cuPhone','cuEmail','cuNrc','cuDob','cuDistrict','cuTown','cuAddress',
   'cuPostal','cuEmploy','cuEmployer','cuOccupation','cuIncome','cuIncomeFreq','cuExpenses','cuKinName',
   'cuKinPhone','cuMomo','cuMomoNo','cuBank','cuBankAcc'].forEach(id=>{
    const e = el(id); if(e) e.addEventListener('input', regRefresh);
  });
  ['cuCategory','cuGender','cuMarital','cuLang','cuKinRel','cuKinLive','cuBank','cuMomo','cuEmploy'].forEach(id=>{
    const e = el(id); if(e) e.addEventListener('change', regRefresh);
  });

  document.querySelectorAll('.check[data-consent]').forEach(ch=>{
    ch.onclick = ()=>{
      const k = ch.dataset.consent;
      REG.consent[k] = !REG.consent[k];
      const ck = ch.querySelector('.ck');
      ck.classList.toggle('y', REG.consent[k]);
      ck.classList.toggle('n', !REG.consent[k]);
      ck.textContent = REG.consent[k] ? '✓' : '–';
      regRefresh();
    };
  });

  el('cuDocs').onclick = ()=>{
    const pool = REG_DOCS.filter(d=>!REG.docs.includes(d));
    if(!pool.length){ toast('All sample document types are already attached.','info'); return; }
    REG.docs.push(pool[0]);
    renderRegDocs(); regRefresh();
    toast(pool[0] + ' attached to the application.');
  };

  el('cuSubmit').onclick = submitCustomer;
  el('cuDraft').onclick = ()=>{
    REG.draft = regSnapshot();
    logAct(CUSTOMERS[0], 'Registration draft saved for ' + (REG.draft.name || 'an unnamed customer'));
    toast('Draft saved — ' + (REG.draft.name || 'unnamed customer') + ' can be completed later.');
  };
  el('cuReset').onclick = ()=>{
    ['cuFirst','cuLast','cuBiz','cuTin','cuPhone','cuEmail','cuNrc','cuTown','cuAddress','cuPostal',
     'cuEmployer','cuOccupation','cuKinName','cuKinPhone','cuMomoNo','cuBankAcc','cuBankBranch','cuBankName']
      .forEach(id=>{ const e = el(id); if(e) e.value = ''; });
    el('cuIncome').value = 350000; el('cuExpenses').value = 180000; el('cuDob').value = '1992-04-18';
    REG.docs = []; renderRegDocs(); regRefresh();
    toast('Form cleared.','info');
  };
  renderRegDocs(); regRefresh();
}

function renderRegDocs(){
  el('cuDocList').innerHTML = REG.docs.length ? REG.docs.map((d,i)=>`
    <div class="lrow">
      <div class="lic" style="background:var(--green-soft);color:#157A50">✓</div>
      <div><div class="lt">${esc(d)}</div><div class="ls">Attached · sample copy</div></div>
      <div class="lr"><button class="btn btn-ghost" data-rmdoc="${i}">Remove</button></div>
    </div>`).join('') :
    '<div class="inline-note">No documents attached yet — an NRC copy and proof of address are the minimum.</div>';
  el('cuDocList').querySelectorAll('[data-rmdoc]').forEach(b=>{
    b.onclick = e=>{
      e.stopPropagation();
      REG.docs.splice(Number(b.dataset.rmdoc),1);
      renderRegDocs(); regRefresh();
    };
  });
}

function nextCustNo(){
  const nums = CUSTOMERS.map(c=>Number(String(c.no).replace('GF-',''))).filter(n=>!isNaN(n));
  return 'GF-' + String(Math.max(...nums, 480) + 1).padStart(6,'0');
}

function submitCustomer(){
  const d = regSnapshot();
  const checks = regChecks();
  const hard = checks.slice(0,6).every(c=>c.ok);
  if(!hard){
    const first = checks.slice(0,6).find(c=>!c.ok);
    toast('Cannot register yet — ' + first.l.toLowerCase() + ' is missing.', 'err');
    openModal('Registration incomplete', 'Complete the mandatory fields first',
      `<div class="check"><span class="ck n">!</span><div><b>${first.l}</b><span class="s">${first.s}</span></div></div>
       <div class="inline-note">Everything else can be captured after the customer is on the register.</div>`,
      [{label:'Back to form', act:'close'}]);
    return;
  }
  const no = nextCustNo();
  const type = REG.type;
  const c = {
    no, name: d.name, type, owner: type === 'Business' ? d.owner : '',
    first: d.first, last: d.last, phone: d.phone, nrc: d.nrc, district: d.district,
    town: d.town || (TOWNS[d.district] || d.district),
    email: d.email, address: d.address, postal: d.postal, dob: d.dob, gender: d.gender,
    marital: d.marital, lang: d.lang, category: d.category,
    employ: d.employ, employer: d.employer, occupation: d.occupation, income: d.income,
    incomeFreq: d.incomeFreq, expenses: d.expenses,
    kin: {name:d.kinName, rel:d.kinRel, phone:d.kinPhone, live:d.kinLive},
    momo: d.momo, momoNo: d.momoNo || d.phone, bank: d.bank,
    bankAcc: d.bankAcc, bankBranch: d.bankBranch || d.town, bankName: d.bankName || d.name,
    status:'Pending Verification', kyc:'Pending', risk:'Medium', joined:TODAY,
    lastActive:TODAY, portal: !!REG.consent.portals,
    consent: {...REG.consent},
    kycFlags: {identity: REG.docs.includes('NRC copy'), address: REG.docs.includes('Proof of address'),
      employment: REG.docs.includes('Business permit'), income: REG.docs.includes('Payslip / bank statement'),
      docs: REG.docs.length >= 3, phone:true},
    idExpiry: addYears(TODAY, 5),
    kycNote:'Registered at the counter — awaiting KYC review.',
    history:[], messages:[], tickets:[], notes:[], guarantors:[], collateral:[], assessments:[],
    docs:{}, kycLog:[], activity:[], extraDocs: REG.docs.slice()
  };
  c.docs = buildDocs(c, CUSTOMERS.length);
  REG.docs.forEach(dname=>{
    const def = DOC_DEFS.find(x=>x.label.indexOf(dname) >= 0 || dname.indexOf(x.label.split(' ')[0]) >= 0);
    if(def) c.docs[def.key] = {label:def.label, note:def.note, state:'ok', uploaded:TODAY, expiry:''};
  });
  CUSTOMERS.unshift(c);
  c.history.push({when:TODAY, what:'Customer registered — ' + type + ' (' + d.category + ')', amount:0, by:'Chikondi Mwale'});
  logAct(c, 'Record created at the counter');
  c.kycLog.push({when:TODAY, result:'Pending', by:'Chikondi Mwale', note:'Registration captured, ID copy attached'});
  if(c.status === 'Pending Verification'){
    c.messages.push({when:TODAY, channel:'SMS', type:'Welcome', body:`Welcome to Golden Financial Services. Your customer number is ${no}. Complete KYC to activate borrowing.`, by:'System'});
  }
  fillSelects();
  KYC.cust = no;
  renderAll();
  toast('Customer ' + no + ' registered · ' + esc(c.name));
  openModal('Customer registered', no + ' · ' + c.name,
    `<div class="custhead"><div class="avatar-lg ${type==='Business'?'biz':''}">${initials(c.name)}</div>
      <div><div class="cname">${esc(c.name)}</div>
      <div class="cmeta">${no} · ${c.district} · ${esc(c.phone)}</div>
      <div class="cchips"><span class="badge b-await">Pending verification</span>
        <span class="chip">${c.category}</span><span class="chip">${c.momo}</span></div></div></div>
     <div class="pfields" style="margin-top:10px">
       <div class="pfield"><div class="pk">Monthly income</div><div class="pv">${mk(c.income)}</div></div>
       <div class="pfield"><div class="pk">Consent</div><div class="pv">${REG.consent.data&&REG.consent.terms&&REG.consent.truth?'Signed':'Partial'}</div></div>
       <div class="pfield"><div class="pk">Documents</div><div class="pv">${REG.docs.length} attached</div></div>
       <div class="pfield"><div class="pk">Portal access</div><div class="pv">${c.portal?'Activation SMS sent':'Not requested'}</div></div>
     </div>`,
    [{label:'Open profile', act:()=>{ closeModal(); openCustomer(no); goto('s4'); }},
     {label:'Go to KYC queue', act:()=>{ closeModal(); KYC.cust = no; renderKYC(); goto('s5'); }},
     {label:'Done', cls:'btn-gold', act:'close'}]);
  REG.docs = []; renderRegDocs();
}

/* ===================== 3 · DIRECTORY ===================== */
const CU = {tab:'', q:'', district:'', risk:'', loans:'', sort:'name', page:1, per:12};

function dirFiltered(){
  const q = CU.q.trim().toLowerCase();
  let rows = CUSTOMERS.filter(c=>{
    if(CU.tab === 'Verified' && c.kyc !== 'Verified') return false;
    if(CU.tab && CU.tab !== 'Verified' && c.status !== CU.tab) return false;
    if(CU.district && c.district !== CU.district) return false;
    if(CU.risk && c.risk !== CU.risk) return false;
    if(CU.loans === 'active' && activeCount(c.no) === 0) return false;
    if(CU.loans === 'overdue' && !hasOverdue(c.no)) return false;
    if(CU.loans === 'none' && liveLoansOf(c.no).length) return false;
    if(q){
      const hay = (c.no + ' ' + c.name + ' ' + c.phone + ' ' + c.nrc + ' ' + c.district + ' ' +
        (c.email||'') + ' ' + (c.occupation||'')).toLowerCase();
      if(!hay.includes(q)) return false;
    }
    return true;
  });
  const order = {'Active':0,'Verified':1,'Pending Verification':2,'Inactive':3,'Suspended':4,'Blacklisted':5};
  if(CU.sort === 'name') rows.sort((a,b)=> a.name.localeCompare(b.name));
  else if(CU.sort === 'recent') rows.sort((a,b)=> a.joined < b.joined ? 1 : -1);
  else if(CU.sort === 'exposure') rows.sort((a,b)=> exposure(b.no) - exposure(a.no));
  else if(CU.sort === 'status') rows.sort((a,b)=> (order[a.status]||9) - (order[b.status]||9) || a.name.localeCompare(b.name));
  return rows;
}

function syncDirTabs(){
  el('dirTabs').querySelectorAll('[data-dt]').forEach(b=>{
    b.classList.toggle('on', (b.dataset.dt || '') === (CU.tab || ''));
  });
}

function renderDirectory(){
  const rows = dirFiltered();
  const pages = Math.max(1, Math.ceil(rows.length / CU.per));
  if(CU.page > pages) CU.page = pages;
  const slice = rows.slice((CU.page-1)*CU.per, CU.page*CU.per);
  el('dirCount').textContent = rows.length + ' customer' + (rows.length===1?'':'s');
  el('dirBody').innerHTML = slice.map(c=>`
    <tr class="rowlink" data-open="${c.no}">
      <td><div style="display:flex;align-items:center;gap:8px">
        <div class="avatar-lg ${c.type==='Business'?'biz':''}" style="width:26px;height:26px;flex:0 0 26px;border-radius:8px;font-size:10px">${initials(c.name)}</div>
        <div><div style="font-weight:700">${esc(c.name)}</div>
          <div style="font-size:9.5px;color:var(--muted)">${c.type}${c.owner ? ' · ' + esc(c.owner) : ''}</div></div>
      </div></td>
      <td class="mono" style="font-size:10px">${c.no}</td>
      <td>${c.category}</td>
      <td>${c.district}</td>
      <td style="white-space:nowrap">${esc(c.phone)}</td>
      <td class="num">${exposure(c.no) ? mk2(exposure(c.no)) : '—'}</td>
      <td><span class="badge ${statusTone(c.risk)}">${c.risk}</span></td>
      <td><span class="badge ${statusTone(c.status)}">${c.status}</span></td>
      <td style="text-align:right"><button class="btn btn-ghost" data-open-btn="${c.no}">Open</button></td>
    </tr>`).join('') ||
    '<tr><td colspan="9" class="empty">No customers match these filters.</td></tr>';
  el('dirBody').querySelectorAll('[data-open]').forEach(r=>{
    r.onclick = ()=>openCustomer(r.dataset.open);
  });

  el('dirPager').innerHTML = `
    <span>Showing ${rows.length ? (CU.page-1)*CU.per+1 : 0}–${Math.min(CU.page*CU.per, rows.length)} of ${rows.length}</span>
    <button id="dirPrev" ${CU.page===1?'disabled':''}>‹ Prev</button>
    <button id="dirNext" ${CU.page===pages?'disabled':''}>Next ›</button>`;
  const pv = el('dirPrev'), nx = el('dirNext');
  if(pv) pv.onclick = ()=>{ CU.page--; renderDirectory(); };
  if(nx) nx.onclick = ()=>{ CU.page++; renderDirectory(); };
}

function custRows(){
  return dirFiltered().map(c=>[
    c.no, c.name, c.type, c.category, c.district, c.phone, c.email, c.nrc,
    c.status, c.kyc, c.risk, c.joined, exposure(c.no), arrearsOf(c.no), activeCount(c.no)
  ]);
}

function wireDirectory(){
  el('dirTabs').querySelectorAll('[data-dt]').forEach(b=>{
    b.onclick = ()=>{ CU.tab = b.dataset.dt || ''; CU.page = 1; syncDirTabs(); renderDirectory(); };
  });
  el('dirSearch').addEventListener('input', ()=>{ CU.q = el('dirSearch').value; CU.page = 1; renderDirectory(); });
  el('dirDistrict').addEventListener('change', ()=>{ CU.district = el('dirDistrict').value; CU.page = 1; renderDirectory(); });
  el('dirRisk').addEventListener('change', ()=>{ CU.risk = el('dirRisk').value; CU.page = 1; renderDirectory(); });
  el('dirLoans').addEventListener('change', ()=>{ CU.loans = el('dirLoans').value; CU.page = 1; renderDirectory(); });
  el('dirSort').addEventListener('change', ()=>{ CU.sort = el('dirSort').value; renderDirectory(); });
  el('dirPrint').onclick = ()=>printBlock('s3', 'Customer directory');
  el('dirExport').onclick = ()=>exportRows('customer-directory',
    ['Customer no','Name','Type','Category','District','Phone','Email','NRC','Status','KYC','Risk','Joined','Exposure','Arrears','Live loans'],
    custRows(), 'Customer directory');
}

/* build the loan ledger once the customer register exists */
buildLoans();

function fillDistrictFilter(){
  const list = [...new Set(CUSTOMERS.map(c=>c.district))].sort();
  el('dirDistrict').innerHTML = '<option value="">All districts</option>' +
    list.map(d=>`<option>${esc(d)}</option>`).join('');
}

</script>
