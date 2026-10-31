<script>
/* ============================================================
   GOLDEN FINANCIAL SERVICES · LOAN APPLICATIONS  (1/4)
   Core helpers, product and customer data, the application
   register and sections 1–3.
   ============================================================ */
const el = id => document.getElementById(id);
const nf = n => Math.round(Number(n)||0).toLocaleString('en-US');
const mk = n => 'MK ' + nf(n);
const TODAY = '2026-10-30';
const initials = s => String(s||'?').split(' ').filter(Boolean).map(w=>w[0]).slice(0,2).join('').toUpperCase();
const nowTime = () => new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});
const sum = (arr,f) => arr.reduce((s,x)=>s+(f?f(x):x),0);
const clamp = (v,a,b) => Math.max(a, Math.min(b, v));

function toast(msg, type='ok'){
  const t=document.createElement('div');
  t.className='toast '+type;
  t.innerHTML=`<span>${type==='err'?'⚠':type==='info'?'ℹ':'✓'}</span><div>${msg}</div>`;
  el('toasts').appendChild(t);
  setTimeout(()=>{t.style.opacity='0';t.style.transform='translateX(16px)';t.style.transition='.25s';},2600);
  setTimeout(()=>t.remove(),3000);
}
function openModal(title, sub, body, actions=[]){
  el('modalTitle').textContent = title;
  el('modalSub').textContent = sub;
  el('modalBody').innerHTML = body;
  el('modalFoot').innerHTML = '';
  actions.forEach(a=>{
    const b=document.createElement('button');
    b.className='btn '+(a.cls||'btn-ghost'); b.textContent=a.label;
    b.onclick = a.act==='close' ? closeModal : a.act;
    el('modalFoot').appendChild(b);
  });
  el('modal').classList.add('on');
}
function closeModal(){ el('modal').classList.remove('on'); }
document.addEventListener('keydown', e=>{ if(e.key==='Escape') closeModal(); });

/* ----- dates ----- */
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const fmtDate = iso => { const d=new Date(iso+'T00:00:00'); return d.getDate().toString().padStart(2,'0')+' '+MONTHS[d.getMonth()]+' '+d.getFullYear(); };
const fmtShort = iso => { const d=new Date(iso+'T00:00:00'); return d.getDate().toString().padStart(2,'0')+' '+MONTHS[d.getMonth()]; };
const addDays = (iso,n) => { const d=new Date(iso+'T00:00:00'); d.setDate(d.getDate()+n); return d.toISOString().slice(0,10); };
const daysBetween = (a,b) => Math.round((new Date(b+'T00:00:00') - new Date(a+'T00:00:00'))/86400000);

/* ===================== LOAN PRODUCTS ===================== */
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

/* ===================== CUSTOMERS ===================== */
const CUSTOMERS = [
  {id:'GF-000481', name:'Chisomo Kachale',  phone:'+265 999 481 220', nrc:'483921/10/1', district:'Blantyre', type:'Individual', employ:'Employed — salaried', employer:'Blantyre Water Board', income:620000, loans:1},
  {id:'GF-000479', name:'Tadala Msonthi',   phone:'+265 991 220 018', nrc:'771204/20/1', district:'Mangochi', type:'Individual', employ:'Self-employed', employer:'Msonthi Traders', income:880000, loans:1},
  {id:'GF-000476', name:'Memory Phiri',     phone:'+265 888 220 481', nrc:'220481/06/1', district:'Lilongwe', type:'Individual', employ:'Employed — salaried', employer:'Ministry of Health', income:410000, loans:1},
  {id:'GF-000470', name:'Blessings Tembo',  phone:'+265 999 610 774', nrc:'610774/31/1', district:'Limbe', type:'Individual', employ:'Self-employed', employer:'Tembo Hardware', income:520000, loans:1},
  {id:'GF-000466', name:'Alinafe Nyirenda', phone:'+265 881 442 019', nrc:'442019/04/1', district:'Lilongwe', type:'Individual', employ:'Employed — salaried', employer:'National Bank', income:1150000, loans:1},
  {id:'GF-000459', name:'Esther Mwale',     phone:'+265 995 118 200', nrc:'118200/31/1', district:'Blantyre', type:'Individual', employ:'Informal trader', employer:'—', income:230000, loans:1},
  {id:'GF-000455', name:'Fatsani Gondwe',   phone:'+265 888 770 040', nrc:'770040/16/1', district:'Kasungu', type:'Individual', employ:'Self-employed', employer:'Gondwe Transport', income:1800000, loans:1},
  {id:'GF-000448', name:'Linda Mhango',     phone:'+265 999 004 812', nrc:'004812/22/1', district:'Mzuzu', type:'Individual', employ:'Employed — salaried', employer:'Mzuzu University', income:380000, loans:1},
  {id:'GF-000441', name:'Peter Chirwa',     phone:'+265 993 220 771', nrc:'220771/18/1', district:'Mzuzu', type:'Individual', employ:'Smallholder farmer', employer:'—', income:190000, loans:1},
  {id:'GF-000437', name:'Grace Mvula',      phone:'+265 997 118 004', nrc:'118004/12/1', district:'Blantyre', type:'Individual', employ:'Self-employed', employer:'Mvula Groceries', income:760000, loans:1},
  {id:'GF-000430', name:'Joseph Kalua',     phone:'+265 991 004 220', nrc:'004220/09/1', district:'Zomba', type:'Individual', employ:'Smallholder farmer', employer:'—', income:340000, loans:1},
  {id:'GF-000425', name:'Agnes Chikopa',    phone:'+265 888 118 991', nrc:'118991/27/1', district:'Blantyre', type:'Group member', employ:'Informal trader', employer:'—', income:210000, loans:1},
  {id:'GF-000512', name:'Rodrick Zimba',    phone:'+265 999 774 118', nrc:'774118/08/1', district:'Blantyre', type:'Individual', employ:'Employed — salaried', employer:'Telekom Networks', income:690000, loans:0},
  {id:'GF-000513', name:'Sarah Kaunda',     phone:'+265 991 662 004', nrc:'662004/14/1', district:'Lilongwe', type:'Individual', employ:'Self-employed', employer:'Kaunda Poultry', income:540000, loans:1},
  {id:'GF-000514', name:'Isaac Banda',      phone:'+265 888 004 771', nrc:'004771/05/1', district:'Zomba', type:'Individual', employ:'Employed — salaried', employer:'Zomba City Council', income:300000, loans:0},
  {id:'GF-000515', name:'Thoko Msiska',     phone:'+265 995 220 118', nrc:'220118/19/1', district:'Mzuzu', type:'Group member', employ:'Informal trader', employer:'—', income:165000, loans:0},
  {id:'GF-000516', name:'Patrick Nyondo',   phone:'+265 997 481 006', nrc:'481006/23/1', district:'Mangochi', type:'Individual', employ:'Self-employed', employer:'Nyondo Fisheries', income:920000, loans:0},
  {id:'GF-000517', name:'Mercy Chatsika',   phone:'+265 881 009 442', nrc:'009442/11/1', district:'Kasungu', type:'Individual', employ:'Smallholder farmer', employer:'—', income:145000, loans:0},
  {id:'GF-000518', name:'Duncan Mwale',     phone:'+265 999 118 662', nrc:'118662/30/1', district:'Blantyre', type:'Individual', employ:'Employed — salaried', employer:'FDH Bank', income:880000, loans:0},
  {id:'GF-000519', name:'Ellen Kadzamira',  phone:'+265 993 774 220', nrc:'774220/07/1', district:'Lilongwe', type:'Individual', employ:'Self-employed', employer:'Kadzamira Salon', income:260000, loans:0}
];
const custBy = id => CUSTOMERS.find(c=>c.id===id);

/* ===================== APPLICATIONS ===================== */
/* docs keys: form, nrc, address, income, employ, bank, guarantor, collateral
   kyc keys : identity, contact, address, employment, income, docs, loans, balances, history */
function docsAll(recv, na){
  const base = {form:'Received', nrc:'Received', address:'Received', income:'Received', employ:'Received', bank:'Missing', guarantor:'na', collateral:'na'};
  (recv||[]).forEach(k=>{ base[k]='Received'; });
  (na||[]).forEach(k=>{ base[k]='na'; });
  return base;
}
const APPLICATIONS = [
  {no:'APP-2026-0191', custId:'GF-000512', product:'Salary Advance', amount:400000, term:6, freq:'Monthly',
   purpose:'School fees', date:'2026-10-30', status:'New', stage:'Intake', officer:'Yamikani Banda',
   income:690000, expenses:310000, oblig:0, risk:'Low', notes:'', sentTo:'', decision:null, approval:null,
   docs:docsAll(['form','nrc','address','income','employ'],['guarantor','collateral']),
   kyc:{identity:'Pending',contact:'Pending',address:'Pending',employment:'Pending',income:'Pending',docs:'Pending',loans:'Pending',balances:'Pending',history:'Pending'}},
  {no:'APP-2026-0190', custId:'GF-000513', product:'Business Boost', amount:1200000, term:18, freq:'Monthly',
   purpose:'Stock purchase', date:'2026-10-29', status:'Awaiting Documents', stage:'Intake', officer:'Blessings Tembo',
   income:540000, expenses:300000, oblig:62000, risk:'Medium', notes:'', sentTo:'', decision:null, approval:null,
   docs:docsAll(['form','nrc'],['guarantor','collateral']),
   kyc:{identity:'Verified',contact:'Verified',address:'Pending',employment:'Pending',income:'Pending',docs:'Pending',loans:'Pending',balances:'Pending',history:'Pending'}},
  {no:'APP-2026-0189', custId:'GF-000514', product:'Emergency Cash', amount:180000, term:6, freq:'Monthly',
   purpose:'Medical expenses', date:'2026-10-29', status:'Under Review', stage:'Verification', officer:'Esther Mwale',
   income:300000, expenses:190000, oblig:0, risk:'Medium', notes:'Applicant is a first-time borrower; employer confirmation pending.',
   sentTo:'', decision:null, approval:null,
   docs:docsAll(['form','nrc','address','income','employ','bank'],['guarantor','collateral']),
   kyc:{identity:'Verified',contact:'Verified',address:'Verified',employment:'Verified',income:'Pending',docs:'Verified',loans:'Pending',balances:'Pending',history:'Pending'}},
  {no:'APP-2026-0188', custId:'GF-000515', product:'Group Lending', amount:150000, term:9, freq:'Fortnightly',
   purpose:'Stock purchase', date:'2026-10-28', status:'Under Review', stage:'Verification', officer:'Linda Mhango',
   income:165000, expenses:120000, oblig:0, risk:'High', notes:'Group guarantee — three members, one with arrears.',
   sentTo:'', decision:null, approval:null,
   docs:docsAll(['form','nrc','address'],['collateral']),
   kyc:{identity:'Verified',contact:'Pending',address:'Pending',employment:'Pending',income:'Pending',docs:'Flagged',loans:'Pending',balances:'Pending',history:'Pending'}},
  {no:'APP-2026-0187', custId:'GF-000516', product:'Asset Finance', amount:4500000, term:24, freq:'Monthly',
   purpose:'Equipment', date:'2026-10-28', status:'Assessment', stage:'Assessment', officer:'Tadala Msonthi',
   income:920000, expenses:410000, oblig:180000, risk:'Medium', notes:'Boat engine and cold storage. Collateral offered: Toyota Hilux.',
   sentTo:'', decision:null, approval:null,
   docs:docsAll(['form','nrc','address','income','employ','bank','collateral'],['guarantor']),
   kyc:{identity:'Verified',contact:'Verified',address:'Verified',employment:'Verified',income:'Verified',docs:'Verified',loans:'Verified',balances:'Verified',history:'Pending'}},
  {no:'APP-2026-0186', custId:'GF-000481', product:'Business Boost', amount:600000, term:12, freq:'Monthly',
   purpose:'Working capital', date:'2026-10-27', status:'Assessment', stage:'Assessment', officer:'Yamikani Banda',
   income:620000, expenses:330000, oblig:48250, risk:'Low', notes:'Existing customer, one loan performing. Wants to consolidate.',
   sentTo:'', decision:null, approval:null,
   docs:docsAll(['form','nrc','address','income','employ','bank'],['guarantor','collateral']),
   kyc:{identity:'Verified',contact:'Verified',address:'Verified',employment:'Verified',income:'Verified',docs:'Verified',loans:'Verified',balances:'Verified',history:'Verified'}},
  {no:'APP-2026-0185', custId:'GF-000517', product:'Agri Season', amount:280000, term:9, freq:'Monthly',
   purpose:'Farm inputs', date:'2026-10-27', status:'Pending Approval', stage:'Review', officer:'Fatsani Gondwe',
   income:145000, expenses:105000, oblig:0, risk:'High', notes:'Seasonal income; repayment aligned to harvest in April.',
   sentTo:'', decision:{by:'Blessings Tembo', date:'2026-10-28', decision:'Recommended', note:'Recommend approval at a reduced amount with a guarantor.'}, approval:null,
   docs:docsAll(['form','nrc','address','income','employ','guarantor'],['collateral']),
   kyc:{identity:'Verified',contact:'Verified',address:'Verified',employment:'Verified',income:'Verified',docs:'Verified',loans:'Verified',balances:'Verified',history:'Verified'}},
  {no:'APP-2026-0184', custId:'GF-000518', product:'Salary Advance', amount:700000, term:12, freq:'Monthly',
   purpose:'Debt consolidation', date:'2026-10-26', status:'Pending Approval', stage:'Review', officer:'Esther Mwale',
   income:880000, expenses:420000, oblig:95000, risk:'Low', notes:'Consolidating two micro-loans; net position improves.',
   sentTo:'', decision:{by:'Esther Mwale', date:'2026-10-27', decision:'Recommended', note:'Strong affordability, clean history.'}, approval:null,
   docs:docsAll(['form','nrc','address','income','employ','bank'],['guarantor','collateral']),
   kyc:{identity:'Verified',contact:'Verified',address:'Verified',employment:'Verified',income:'Verified',docs:'Verified',loans:'Verified',balances:'Verified',history:'Verified'}},
  {no:'APP-2026-0183', custId:'GF-000479', product:'Business Boost', amount:1500000, term:18, freq:'Monthly',
   purpose:'Working capital', date:'2026-10-25', status:'Awaiting Authorization', stage:'Approval', officer:'Tadala Msonthi',
   income:880000, expenses:520000, oblig:84000, risk:'Medium', notes:'Existing customer with a performing loan.',
   sentTo:'', decision:{by:'Tadala Msonthi', date:'2026-10-27', decision:'Approved', note:'Approved at 1,350,000 over 18 months.'},
   approval:{level:1, by:'Chikondi Mwale', date:'2026-10-28', amount:1350000, rate:3.4, term:18, fee:33750,
     conditions:'Guarantor to sign before disbursement. First instalment 30 days after release.'}},
  {no:'APP-2026-0182', custId:'GF-000455', product:'Asset Finance', amount:6000000, term:36, freq:'Monthly',
   purpose:'Equipment', date:'2026-10-24', status:'Awaiting Authorization', stage:'Approval', officer:'Tadala Msonthi',
   income:1800000, expenses:900000, oblig:295000, risk:'Medium', notes:'Haulage truck. Requires credit committee sign-off.',
   sentTo:'', decision:{by:'Tadala Msonthi', date:'2026-10-26', decision:'Approved', note:'Recommended to committee at 5,500,000.'},
   approval:{level:1, by:'Chikondi Mwale', date:'2026-10-27', amount:5500000, rate:3.2, term:36, fee:165000,
     conditions:'Comprehensive insurance ceded to Golden. Logbook retention.'}},
  {no:'APP-2026-0181', custId:'GF-000466', product:'Business Boost', amount:2000000, term:24, freq:'Monthly',
   purpose:'Working capital', date:'2026-10-23', status:'Approved', stage:'Handover', officer:'Yamikani Banda',
   income:1150000, expenses:640000, oblig:112000, risk:'Low', notes:'Top-up for an existing performing client.',
   sentTo:'', decision:{by:'Yamikani Banda', date:'2026-10-25', decision:'Approved', note:'Approved in full.'},
   approval:{level:2, by:'Grace Mvula', date:'2026-10-26', amount:2000000, rate:3.3, term:24, fee:50000,
     conditions:'Standing order mandate required. confirmation of employment letter.'}},
  {no:'APP-2026-0180', custId:'GF-000470', product:'Salary Advance', amount:350000, term:6, freq:'Monthly',
   purpose:'Home improvement', date:'2026-10-22', status:'Approved', stage:'Handover', officer:'Linda Mhango',
   income:520000, expenses:290000, oblig:45000, risk:'Medium', notes:'Previously in arrears; cleared 12 Oct.',
   sentTo:'', decision:{by:'Linda Mhango', date:'2026-10-24', decision:'Approved', note:'Approved at 300,000.'},
   approval:{level:1, by:'Chikondi Mwale', date:'2026-10-25', amount:300000, rate:2.6, term:6, fee:4500,
     conditions:'No conditions.'}},
  {no:'APP-2026-0179', custId:'GF-000459', product:'Emergency Cash', amount:200000, term:6, freq:'Monthly',
   purpose:'Medical expenses', date:'2026-10-21', status:'Awaiting Disbursement', stage:'Handover', officer:'Esther Mwale',
   income:230000, expenses:180000, oblig:38000, risk:'High', notes:'Due to arrears history, weekly collection visit agreed.',
   sentTo:'disbursements', decision:{by:'Esther Mwale', date:'2026-10-23', decision:'Approved', note:'Approved at 150,000.'},
   approval:{level:1, by:'Chikondi Mwale', date:'2026-10-24', amount:150000, rate:4.0, term:6, fee:3000,
     conditions:'Guarantor signature. Weekly monitoring for the first month.'}},
  {no:'APP-2026-0178', custId:'GF-000476', product:'Business Boost', amount:500000, term:12, freq:'Monthly',
   purpose:'Stock purchase', date:'2026-10-20', status:'Awaiting Disbursement', stage:'Handover', officer:'Blessings Tembo',
   income:410000, expenses:250000, oblig:52000, risk:'High', notes:'Late payment twice in the last six months.',
   sentTo:'disbursements', decision:{by:'Blessings Tembo', date:'2026-10-22', decision:'Approved', note:'Approved at 350,000 with a guarantor.'},
   approval:{level:1, by:'Chikondi Mwale', date:'2026-10-23', amount:350000, rate:3.6, term:12, fee:8750,
     conditions:'Guarantor must be a salaried employee.'}},
  {no:'APP-2026-0177', custId:'GF-000437', product:'Business Boost', amount:900000, term:18, freq:'Monthly',
   purpose:'Working capital', date:'2026-10-19', status:'Returned for Correction', stage:'Review', officer:'Yamikani Banda',
   income:760000, expenses:480000, oblig:88000, risk:'High', notes:'Bank statement supplied is 3 months old.',
   sentTo:'', decision:{by:'Chikondi Mwale', date:'2026-10-21', decision:'Returned', note:'Provide a current 6-month bank statement.'}, approval:null,
   docs:docsAll(['form','nrc','address','income','employ','guarantor'],['collateral']),
   kyc:{identity:'Verified',contact:'Verified',address:'Verified',employment:'Verified',income:'Flagged',docs:'Flagged',loans:'Verified',balances:'Verified',history:'Flagged'}},
  {no:'APP-2026-0176', custId:'GF-000430', product:'Agri Season', amount:450000, term:9, freq:'Monthly',
   purpose:'Farm inputs', date:'2026-10-18', status:'On Hold', stage:'Review', officer:'Fatsani Gondwe',
   income:340000, expenses:220000, oblig:62000, risk:'High', notes:'Customer asked for a pause while harvest is priced.',
   sentTo:'', decision:null, approval:null,
   docs:docsAll(['form','nrc','address','income'],['guarantor','collateral']),
   kyc:{identity:'Verified',contact:'Verified',address:'Pending',employment:'Pending',income:'Pending',docs:'Pending',loans:'Pending',balances:'Pending',history:'Pending'}},
  {no:'APP-2026-0175', custId:'GF-000425', product:'Group Lending', amount:120000, term:6, freq:'Fortnightly',
   purpose:'Stock purchase', date:'2026-10-17', status:'Rejected', stage:'Closed', officer:'Blessings Tembo',
   income:210000, expenses:185000, oblig:0, risk:'High', notes:'Group has two members in arrears.',
   sentTo:'', decision:{by:'Chikondi Mwale', date:'2026-10-19', decision:'Rejected', note:'Affordability and group repayment record insufficient.'}, approval:null,
   docs:docsAll(['form','nrc','address','income'],['guarantor','collateral']),
   kyc:{identity:'Verified',contact:'Verified',address:'Verified',employment:'Verified',income:'Flagged',docs:'Verified',loans:'Verified',balances:'Flagged',history:'Flagged'}},
  {no:'APP-2026-0174', custId:'GF-000441', product:'Emergency Cash', amount:150000, term:6, freq:'Monthly',
   purpose:'Medical expenses', date:'2026-10-16', status:'Rejected', stage:'Closed', officer:'Linda Mhango',
   income:190000, expenses:165000, oblig:48000, risk:'High', notes:'Existing loan in legal recovery.',
   sentTo:'', decision:{by:'Chikondi Mwale', date:'2026-10-18', decision:'Rejected', note:'Existing facility is in legal recovery — no new lending.'}, approval:null,
   docs:docsAll(['form','nrc'],['guarantor','collateral']),
   kyc:{identity:'Verified',contact:'Verified',address:'Pending',employment:'Pending',income:'Flagged',docs:'Pending',loans:'Verified',balances:'Flagged',history:'Flagged'}},
  {no:'APP-2026-0173', custId:'GF-000448', product:'Salary Advance', amount:300000, term:9, freq:'Monthly',
   purpose:'School fees', date:'2026-10-15', status:'Withdrawn', stage:'Closed', officer:'Linda Mhango',
   income:380000, expenses:240000, oblig:34000, risk:'Medium', notes:'Customer withdrew — employer stopped salary deduction.',
   sentTo:'', decision:{by:'Linda Mhango', date:'2026-10-17', decision:'Withdrawn', note:'Customer withdrew in writing.'}, approval:null,
   docs:docsAll(['form','nrc','address','income'],['guarantor','collateral']),
   kyc:{identity:'Verified',contact:'Verified',address:'Verified',employment:'Pending',income:'Pending',docs:'Pending',loans:'Pending',balances:'Pending',history:'Pending'}},
  {no:'APP-2026-0172', custId:'GF-000519', product:'Business Boost', amount:750000, term:12, freq:'Monthly',
   purpose:'Working capital', date:'2026-10-14', status:'Cancelled', stage:'Closed', officer:'Esther Mwale',
   income:260000, expenses:150000, oblig:0, risk:'High', notes:'Duplicate — applicant applied twice on the same day.',
   sentTo:'', decision:{by:'Esther Mwale', date:'2026-10-14', decision:'Cancelled', note:'Duplicate of APP-2026-0171.'}, approval:null,
   docs:docsAll(['form'],['guarantor','collateral']),
   kyc:{identity:'Pending',contact:'Pending',address:'Pending',employment:'Pending',income:'Pending',docs:'Pending',loans:'Pending',balances:'Pending',history:'Pending'}},
  {no:'APP-2026-0171', custId:'GF-000519', product:'Business Boost', amount:750000, term:12, freq:'Monthly',
   purpose:'Working capital', date:'2026-10-14', status:'Pending Approval', stage:'Review', officer:'Esther Mwale',
   income:260000, expenses:150000, oblig:0, risk:'High', notes:'Salon expansion. Guarantor is the applicant\'s brother.',
   sentTo:'', decision:{by:'Esther Mwale', date:'2026-10-16', decision:'Recommended', note:'Recommend approval at 500,000 with a guarantor.'}, approval:null,
   docs:docsAll(['form','nrc','address','income','guarantor'],['collateral']),
   kyc:{identity:'Verified',contact:'Verified',address:'Verified',employment:'Verified',income:'Verified',docs:'Verified',loans:'Pending',balances:'Pending',history:'Pending'}},
  {no:'APP-2026-0170', custId:'GF-000437', product:'Asset Finance', amount:3200000, term:24, freq:'Monthly',
   purpose:'Equipment', date:'2026-10-12', status:'Rejected', stage:'Closed', officer:'Yamikani Banda',
   income:760000, expenses:480000, oblig:88000, risk:'High', notes:'Collateral valuation below the requested amount.',
   sentTo:'', decision:{by:'Grace Mvula', date:'2026-10-15', decision:'Rejected', note:'Collateral value insufficient; borrower already highly geared.'}, approval:null,
   docs:docsAll(['form','nrc','address','income','collateral'],['guarantor']),
   kyc:{identity:'Verified',contact:'Verified',address:'Verified',employment:'Verified',income:'Verified',docs:'Verified',loans:'Verified',balances:'Verified',history:'Flagged'}},
  {no:'APP-2026-0169', custId:'GF-000513', product:'Agri Season', amount:380000, term:9, freq:'Monthly',
   purpose:'Farm inputs', date:'2026-10-10', status:'Disbursed', stage:'Closed', officer:'Blessings Tembo',
   income:540000, expenses:300000, oblig:0, risk:'Medium', notes:'Disbursed 14 Oct to Airtel Money wallet.',
   sentTo:'disbursed', decision:{by:'Blessings Tembo', date:'2026-10-11', decision:'Approved', note:'Approved.'},
   approval:{level:1, by:'Chikondi Mwale', date:'2026-10-12', amount:380000, rate:3.0, term:9, fee:7600, conditions:'None.'}},
  {no:'APP-2026-0168', custId:'GF-000514', product:'Emergency Cash', amount:90000, term:3, freq:'Monthly',
   purpose:'Medical expenses', date:'2026-10-08', status:'Disbursed', stage:'Closed', officer:'Esther Mwale',
   income:300000, expenses:190000, oblig:0, risk:'Low', notes:'Disbursed 09 Oct at the counter.',
   sentTo:'disbursed', decision:{by:'Esther Mwale', date:'2026-10-08', decision:'Approved', note:'Approved in full.'},
   approval:{level:1, by:'Chikondi Mwale', date:'2026-10-08', amount:90000, rate:4.0, term:3, fee:1800, conditions:'None.'}},
  {no:'APP-2026-0167', custId:'GF-000516', product:'Business Boost', amount:1100000, term:12, freq:'Monthly',
   purpose:'Stock purchase', date:'2026-10-06', status:'Disbursed', stage:'Closed', officer:'Tadala Msonthi',
   income:920000, expenses:410000, oblig:0, risk:'Medium', notes:'Disbursed 09 Oct by bank transfer.',
   sentTo:'disbursed', decision:{by:'Tadala Msonthi', date:'2026-10-07', decision:'Approved', note:'Approved.'},
   approval:{level:1, by:'Chikondi Mwale', date:'2026-10-08', amount:1100000, rate:3.5, term:12, fee:27500, conditions:'None.'}},
  {no:'APP-2026-0166', custId:'GF-000515', product:'Group Lending', amount:80000, term:6, freq:'Fortnightly',
   purpose:'Stock purchase', date:'2026-10-03', status:'Awaiting Documents', stage:'Intake', officer:'Linda Mhango',
   income:165000, expenses:120000, oblig:0, risk:'High', notes:'Group registration certificate still outstanding.',
   sentTo:'', decision:null, approval:null,
   docs:docsAll(['form','nrc'],['guarantor','collateral']),
   kyc:{identity:'Verified',contact:'Pending',address:'Pending',employment:'Pending',income:'Pending',docs:'Flagged',loans:'Pending',balances:'Pending',history:'Pending'}},
  {no:'APP-2026-0165', custId:'GF-000512', product:'Salary Advance', amount:250000, term:6, freq:'Monthly',
   purpose:'School fees', date:'2026-09-29', status:'Rejected', stage:'Closed', officer:'Yamikani Banda',
   income:690000, expenses:310000, oblig:0, risk:'Low', notes:'Duplicate submission — re-applied on 30 Oct as APP-2026-0191.',
   sentTo:'', decision:{by:'Yamikani Banda', date:'2026-09-30', decision:'Cancelled', note:'Duplicate — superseded by APP-2026-0191.'}, approval:null,
   docs:docsAll(['form','nrc'],['guarantor','collateral']),
   kyc:{identity:'Verified',contact:'Verified',address:'Pending',employment:'Pending',income:'Pending',docs:'Pending',loans:'Pending',balances:'Pending',history:'Pending'}},
  {no:'APP-2026-0164', custId:'GF-000518', product:'Business Boost', amount:950000, term:18, freq:'Monthly',
   purpose:'Debt consolidation', date:'2026-09-24', status:'Disbursed', stage:'Closed', officer:'Esther Mwale',
   income:880000, expenses:420000, oblig:0, risk:'Low', notes:'Disbursed 30 Sep.',
   sentTo:'disbursed', decision:{by:'Esther Mwale', date:'2026-09-26', decision:'Approved', note:'Approved.'},
   approval:{level:1, by:'Chikondi Mwale', date:'2026-09-27', amount:950000, rate:3.4, term:18, fee:23750, conditions:'None.'}},
  {no:'APP-2026-0163', custId:'GF-000479', product:'Salary Advance', amount:500000, term:9, freq:'Monthly',
   purpose:'School fees', date:'2026-08-18', status:'Disbursed', stage:'Closed', officer:'Tadala Msonthi',
   income:880000, expenses:520000, oblig:0, risk:'Low', notes:'Disbursed 20 Aug.',
   sentTo:'disbursed', decision:{by:'Tadala Msonthi', date:'2026-08-19', decision:'Approved', note:'Approved.'},
   approval:{level:1, by:'Chikondi Mwale', date:'2026-08-19', amount:500000, rate:2.6, term:9, fee:7500, conditions:'None.'}}
];
/* normalise derived fields */
APPLICATIONS.forEach((a,i)=>{
  if(!a.docs){
    const full = {form:'Received', nrc:'Received', address:'Received', income:'Received',
      employ:'Received', bank:'Received', guarantor:'Received', collateral:'na'};
    if(a.product === 'Asset Finance') full.collateral = 'Received';
    if(['Group Lending','Salary Advance'].includes(a.product)) full.guarantor = 'na';
    a.docs = full;
  }
  if(!a.kyc){
    const done = ['Approved','Awaiting Disbursement','Disbursed'].includes(a.status);
    a.kyc = {}; ['identity','contact','address','employment','income','docs','loans','balances','history']
      .forEach(k=>{ a.kyc[k] = done ? 'Verified' : 'Pending'; });
  }
  const c = custBy(a.custId) || {};
  a.cust = c.name || 'Unknown applicant';
  a.phone = c.phone || '—';
  a.nrc = c.nrc || '—';
  a.district = c.district || '—';
  a.employ = c.employ || '—';
  a.employer = c.employer || '—';
  a.deadline = addDays(a.date, a.product==='Emergency Cash' ? 3 : 7);
  a.moved = a.decision ? a.decision.date : a.date;
  a.comms = [];
  if(a.status==='Assessment' || a.decision){
    const rate = productBy(a.product).rate;
    const term = a.term;
    const r = rate/100;
    const inst = Math.round(a.amount * r / (1 - Math.pow(1+r, -term)));
    const net = Math.max(1, (a.income||0) - (a.expenses||0));
    a.assess = {income:a.income, expenses:a.expenses, oblig:a.oblig||0, rate, term, inst,
      dti: Math.round((inst + (a.oblig||0)) / net * 100),
      by:a.officer, note:a.notes, date:(a.decision?a.decision.date:a.date)};
  } else {
    a.assess = null;
  }
});

/* ===================== AUDIT ===================== */
const APP_AUDIT = [];
function logApp(cat, action, app, result='Success', actor='Memory Phiri'){
  APP_AUDIT.unshift({time:TODAY+' · '+nowTime(), date:TODAY, cat, action, app, result, actor, ip:'196.44.12.'+(40+APP_AUDIT.length%60)});
  if(APP_AUDIT.length>200) APP_AUDIT.pop();
}
[
  ['Creation','Application created · APP-2026-0191','APP-2026-0191','Success','Yamikani Banda'],
  ['Creation','Application created · APP-2026-0190','APP-2026-0190','Success','Blessings Tembo'],
  ['Change','Requested amount changed 800,000 → 1,200,000','APP-2026-0190','Success','Blessings Tembo'],
  ['Document','NRC copy uploaded','APP-2026-0190','Success','Blessings Tembo'],
  ['Assessment','Affordability assessment saved · DTI 38%','APP-2026-0187','Success','Tadala Msonthi'],
  ['Decision','Recommended for approval at 1,350,000','APP-2026-0183','Success','Tadala Msonthi'],
  ['Access','Application file opened','APP-2026-0177','Success','Esther Mwale'],
  ['Access','Attempt to approve above limit','APP-2026-0182','Blocked','Esther Mwale'],
  ['Document','Bank statement marked invalid — older than 6 months','APP-2026-0177','Warning','Chikondi Mwale'],
  ['Decision','Rejected · affordability and group record','APP-2026-0175','Success','Chikondi Mwale'],
  ['Change','Officer reassigned Blessings Tembo → Linda Mhango','APP-2026-0188','Success','Memory Phiri']
].forEach(([cat,action,app,result,actor])=>APP_AUDIT.push({time:TODAY+' · '+nowTime(),date:TODAY,cat,action,app,result,actor,ip:'196.44.12.41'}));

/* ===================== DERIVED HELPERS ===================== */
const CLOSED = ['Rejected','Cancelled','Withdrawn','Disbursed','Closed'];
const OPEN_STAGES = ['Intake','Verification','Assessment','Review','Approval','Handover'];
const appBy = no => APPLICATIONS.find(a=>a.no===no);
const isClosed = a => CLOSED.includes(a.status);
const openApps = () => APPLICATIONS.filter(a=>!isClosed(a));
const appValue = () => sum(APPLICATIONS, a=>a.amount);
const statusTone = s => ({
  'New':'st-draft','Awaiting Documents':'st-await','Under Review':'st-proc','Assessment':'st-conf',
  'Pending Approval':'st-await','Awaiting Authorization':'st-auth','Approved':'st-ok',
  'Awaiting Disbursement':'st-ok','Disbursed':'st-ok','Rejected':'st-rej','Cancelled':'st-canc',
  'Withdrawn':'st-canc','Returned for Correction':'st-await','On Hold':'st-draft','Closed':'st-canc'
}[s] || 'st-draft');
const checksDone = a => Object.values(a.kyc).filter(v=>v==='Verified').length;
const checksFlagged = a => Object.values(a.kyc).filter(v=>v==='Flagged').length;
const missingDocs = a => Object.entries(a.docs).filter(([,v])=>v==='Missing').map(([k])=>k);
const DOC_LABELS = {form:'Loan application form', nrc:'Identity document (NRC / passport)', address:'Proof of address',
  income:'Proof of income', employ:'Employment document', bank:'Bank or mobile money statement',
  guarantor:'Guarantor documents', collateral:'Collateral documents'};
const KYC_LABELS = {identity:'Customer identity', contact:'Contact information', address:'Residential address',
  employment:'Employment details', income:'Income and affordability', docs:'Required documents',
  loans:'Existing customer loans', balances:'Outstanding balances', history:'Previous repayment history'};
const STAGE_TAT = {Intake:2, Verification:3, Assessment:2, Review:2, Approval:2, Handover:3};
const stageTone = a => {
  if(a.status==='Rejected') return 'alert';
  if(a.status==='Approved'||a.status==='Awaiting Disbursement'||a.status==='Disbursed') return 'done';
  if(daysBetween(a.moved, TODAY) > STAGE_TAT[a.stage]) return 'alert';
  if(['Awaiting Authorization','Pending Approval'].includes(a.status)) return 'hot';
  return '';
};
const isLate = a => !isClosed(a) && daysBetween(a.deadline, TODAY) > 0;
const dtiOf = (a, inst) => {
  const net = Math.max(1, (a.income||0) - (a.expenses||0));
  return Math.round(((inst||0) + (a.oblig||0)) / net * 100);
};
const pmt = (P, ratePct, term) => {
  const r = ratePct/100;
  if(!term) return 0;
  return Math.round(P * r / (1 - Math.pow(1+r, -term)));
};
const totalPayable = (P, ratePct, term) => Math.round(P * (1 + ratePct/100 * term));

/* ===================== 1 · OVERVIEW ===================== */
function renderOverview(){
  const open = openApps();
  const count = s => APPLICATIONS.filter(a=>a.status===s).length;
  const val = s => sum(APPLICATIONS.filter(a=>a.status===s), a=>a.amount);
  const month = APPLICATIONS.filter(a=>a.date.slice(0,7)==='2026-10');

  const tiles = [
    ['Total applications', String(APPLICATIONS.length), mk(appValue())+' requested', 'gold'],
    ['New this month', String(month.length), mk(sum(month,a=>a.amount))+' requested', ''],
    ['Pending / in progress', String(open.length), 'across '+new Set(open.map(a=>a.stage)).size+' stages', ''],
    ['Under review', String(count('Under Review')+count('Assessment')+count('Pending Approval')), mk(val('Under Review')+val('Assessment')+val('Pending Approval')), 'blue'],
    ['Approved', String(count('Approved')+count('Awaiting Disbursement')+count('Disbursed')), mk(val('Approved')+val('Awaiting Disbursement')+val('Disbursed')), ''],
    ['Awaiting authorization', String(count('Awaiting Authorization')), mk(val('Awaiting Authorization')), ''],
    ['Awaiting documents', String(count('Awaiting Documents')), mk(val('Awaiting Documents')), ''],
    ['Awaiting disbursement', String(count('Awaiting Disbursement')), mk(val('Awaiting Disbursement')), ''],
    ['Rejected', String(count('Rejected')), mk(val('Rejected'))+' declined', 'red'],
    ['Cancelled / withdrawn', String(count('Cancelled')+count('Withdrawn')), 'closed without approval', '']
  ];
  el('ovTiles').innerHTML = tiles.map(([l,v,s,cls])=>`
    <div class="kpi ${cls}"><div class="kl">${l}</div><div class="kv">${v}</div>
      <div class="ks">${s}</div></div>`).join('');

  const stages = [
    ['Intake','Intake'], ['Verification','Verification'], ['Assessment','Assessment'],
    ['Review','Review'], ['Approval','Approval'], ['Handover','Handover'], ['Closed','Closed']
  ];
  el('ovPipeline').innerHTML = stages.map(([label,stage])=>{
    const list = stage==='Closed'
      ? APPLICATIONS.filter(a=>['Rejected','Cancelled','Withdrawn','Disbursed'].includes(a.status))
      : APPLICATIONS.filter(a=>a.stage===stage);
    return `<div class="stg ${stage==='Approval'?'hot':stage==='Closed'?'done':''}" data-stage="${stage}">
      <b>${list.length}</b><span>${label}</span>
      <div class="ks" style="font-size:9px;color:var(--muted);margin-top:3px">${mk(sum(list,a=>a.amount))}</div></div>`;
  }).join('');
  el('ovPipeline').querySelectorAll('[data-stage]').forEach(t=>{
    t.onclick = ()=>{ REG.stage = t.dataset.stage; REG.status=''; REG.page=1; renderRegister(); gotoSec('s2'); };
  });
  el('ovPipelineCount').textContent = open.length + ' in progress';

  el('ovRecent').innerHTML = APPLICATIONS.slice(0,8).map(a=>`<tr style="cursor:pointer" data-open="${a.no}">
    <td class="mono">${a.no}</td><td>${a.cust}</td><td class="num">${nf(a.amount)}</td>
    <td style="font-size:10.5px">${a.product}</td>
    <td><span class="chip ${statusTone(a.status)}">${a.status}</span></td></tr>`).join('');
  el('ovRecent').querySelectorAll('[data-open]').forEach(r=>{
    r.onclick = ()=>openFile(r.dataset.open);
  });

  const alerts = [];
  const docsMissing = open.filter(a=>missingDocs(a).length);
  if(docsMissing.length) alerts.push(['Documents outstanding', docsMissing.length+' files · oldest '+fmtShort(docsMissing[0].date), 'High','s6']);
  const late = open.filter(isLate);
  if(late.length) alerts.push(['Past review deadline', late.length+' applications · escalate', 'High','s11']);
  const auth = APPLICATIONS.filter(a=>a.status==='Awaiting Authorization');
  if(auth.length) alerts.push(['Awaiting authorization', auth.length+' · '+mk(sum(auth,a=>a.amount)), 'Medium','s8']);
  const ret = APPLICATIONS.filter(a=>a.status==='Returned for Correction');
  if(ret.length) alerts.push(['Returned for correction', ret.length+' file waiting on the customer', 'Medium','s7']);
  const handover = APPLICATIONS.filter(a=>a.status==='Approved');
  if(handover.length) alerts.push(['Approved, not forwarded', handover.length+' · ready for handover', 'Medium','s12']);
  el('ovAlertCount').textContent = alerts.length;
  el('ovAlerts').innerHTML = alerts.map(([t,s,lvl,sec])=>`<div class="lrow">
    <div class="lic" style="background:${lvl==='High'?'#FDEDEC':'#FFF4E0'};color:${lvl==='High'?'#B32C2C':'#9A6A0D'}">!</div>
    <div><div class="lt">${t}</div><div class="ls">${s}</div></div>
    <div class="lr"><button class="btn btn-ghost btn-sm" data-jump="${sec}">Open</button></div></div>`).join('') ||
    '<div class="empty">Nothing needs attention.</div>';
  el('ovAlerts').querySelectorAll('[data-jump]').forEach(b=>b.onclick=()=>gotoSec(b.dataset.jump));

  el('bandTotal').textContent = APPLICATIONS.length;
  el('bandPending').textContent = open.length;
  el('bandApproved').textContent = count('Approved')+count('Awaiting Disbursement')+count('Disbursed');
  el('bandValue').textContent = mk(appValue()).replace('MK ','');
}
function gotoSec(id){
  const t = document.querySelector('#'+id);
  if(t) window.scrollTo({top:t.offsetTop-112, behavior:'smooth'});
}

/* ===================== 2 · ALL APPLICATIONS ===================== */
const REG = {q:'', status:'', product:'', officer:'', from:'2026-08-01', to:'2026-10-30', sort:'date', stage:'', page:1, per:10};
function regFiltered(){
  const q = REG.q.trim().toLowerCase();
  let rows = APPLICATIONS.filter(a=>{
    if(REG.stage && a.stage !== REG.stage) return false;
    if(REG.status && a.status !== REG.status) return false;
    if(REG.product && a.product !== REG.product) return false;
    if(REG.officer && a.officer !== REG.officer) return false;
    if(REG.from && a.date < REG.from) return false;
    if(REG.to && a.date > REG.to) return false;
    if(!q) return true;
    return (a.no+' '+a.cust+' '+a.phone+' '+a.nrc+' '+a.product+' '+a.officer+' '+a.purpose).toLowerCase().includes(q);
  });
  const dir = {date:(x,y)=>y.date.localeCompare(x.date), dateAsc:(x,y)=>x.date.localeCompare(y.date),
    amount:(x,y)=>y.amount-x.amount, amountAsc:(x,y)=>x.amount-y.amount,
    applicant:(x,y)=>x.cust.localeCompare(y.cust), status:(x,y)=>x.status.localeCompare(y.status)};
  return rows.sort(dir[REG.sort]||dir.date);
}
function renderRegister(){
  const sel = (node, values, all)=>{
    if(!node || node.dataset.filled) return;
    node.innerHTML = `<option value="">${all}</option>` + values.map(v=>`<option>${v}</option>`).join('');
    node.dataset.filled = '1';
  };
  sel(el('regStatus'), [...new Set(APPLICATIONS.map(a=>a.status))], 'All statuses');
  sel(el('regProduct'), PRODUCTS.map(p=>p.name), 'All products');
  sel(el('regOfficer'), OFFICER_NAMES, 'All officers');
  if(el('regFrom')) el('regFrom').value = REG.from;
  if(el('regTo')) el('regTo').value = REG.to;

  const rows = regFiltered();
  const pages = Math.max(1, Math.ceil(rows.length/REG.per));
  if(REG.page > pages) REG.page = pages;
  const slice = rows.slice((REG.page-1)*REG.per, REG.page*REG.per);
  el('regCount').textContent = rows.length + ' applications';
  el('regBody').innerHTML = slice.map(a=>`<tr data-file="${a.no}" style="cursor:pointer">
    <td class="mono">${a.no}</td>
    <td><b style="font-size:11px">${a.cust}</b><div style="font-size:9.5px;color:var(--muted)">${a.custId}</div></td>
    <td style="font-size:10.5px">${a.product}</td>
    <td class="num">${nf(a.amount)}</td>
    <td style="font-size:10.5px;white-space:nowrap">${fmtShort(a.date)}</td>
    <td class="num">${a.term} mo · ${a.freq}</td>
    <td style="font-size:10.5px">${a.officer}</td>
    <td><span class="chip ${statusTone(a.status)}">${a.status}</span></td>
    <td style="text-align:right"><button class="btn btn-ghost btn-sm" data-file="${a.no}"
      style="padding:2px 7px;font-size:10px">Open</button></td></tr>`).join('') ||
    '<tr><td colspan="9" class="empty">No applications match these filters.</td></tr>';
  el('regBody').querySelectorAll('[data-file]').forEach(n=>{
    n.addEventListener('click', e=>{ e.stopPropagation(); openFile(n.dataset.file); });
  });
  el('regPager').innerHTML = `<span>Showing ${rows.length?((REG.page-1)*REG.per+1):0}–${Math.min(REG.page*REG.per,rows.length)} of ${rows.length}</span>
    <button id="regPrev" ${REG.page===1?'disabled':''}>‹ Prev</button>
    <button id="regNext" ${REG.page===pages?'disabled':''}>Next ›</button>`;
  if(el('regPrev')) el('regPrev').onclick = ()=>{ REG.page--; renderRegister(); };
  if(el('regNext')) el('regNext').onclick = ()=>{ REG.page++; renderRegister(); };
}
function openFile(no){
  const a = appBy(no); if(!a) return;
  const p = productBy(a.product);
  const late = isLate(a);
  openModal(a.no, `${a.cust} · ${a.product} · ${mk(a.amount)}`, `
    <div class="split" style="gap:14px">
      <div>
        <div class="kv"><span class="k">Status</span><span class="v">${a.status}</span></div>
        <div class="kv"><span class="k">Stage</span><span class="v">${a.stage}</span></div>
        <div class="kv"><span class="k">Officer</span><span class="v">${a.officer}</span></div>
        <div class="kv"><span class="k">Applied</span><span class="v">${fmtDate(a.date)}</span></div>
        <div class="kv"><span class="k">Deadline</span><span class="v" style="color:${late?'#B32C2C':'inherit'}">${fmtDate(a.deadline)}${late?' · overdue':''}</span></div>
        <div class="kv"><span class="k">Requested</span><span class="v big">${mk(a.amount)}</span></div>
        <div class="kv"><span class="k">Period</span><span class="v">${a.term} months · ${a.freq}</span></div>
        <div class="kv"><span class="k">Purpose</span><span class="v">${a.purpose}</span></div>
      </div>
      <div>
        <div class="kv"><span class="k">Customer</span><span class="v">${a.custId}</span></div>
        <div class="kv"><span class="k">Phone</span><span class="v">${a.phone}</span></div>
        <div class="kv"><span class="k">NRC</span><span class="v">${a.nrc}</span></div>
        <div class="kv"><span class="k">District</span><span class="v">${a.district}</span></div>
        <div class="kv"><span class="k">Employment</span><span class="v">${a.employ}</span></div>
        <div class="kv"><span class="k">Income / expenses</span><span class="v">${mk(a.income)} / ${mk(a.expenses)}</span></div>
        <div class="kv"><span class="k">KYC checks</span><span class="v">${checksDone(a)} / 9 verified</span></div>
        <div class="kv"><span class="k">Documents missing</span><span class="v">${missingDocs(a).length || 'none'}</span></div>
      </div>
    </div>
    <div class="minihead">File notes</div>
    <div class="note" style="margin-top:0"><div>${a.notes || 'No notes recorded.'}</div></div>
    ${a.decision?`<div class="minihead">Decision</div>
      <div class="note"><div><b>${a.decision.decision}</b> · ${a.decision.by} · ${fmtDate(a.decision.date)}<br>${a.decision.note}</div></div>`:''}`,
    [{label:'Close', act:'close'},
     {label:'Open working section', cls:'btn-gold', act:()=>{
        const target = {Intake:'s3',Verification:'s4',Assessment:'s5',Review:'s7',Approval:'s8',Handover:'s12'}[a.stage] || 's2';
        closeModal(); gotoSec(target);
     }}]);
}

/* ===================== 3 · NEW APPLICATION ===================== */
const NA = {mode:'existing', custId:'', docs:[]};
function naProductChanged(){
  const p = productBy(el('naProduct').value);
  el('naAmountHint').textContent = `Product range ${mk(p.min)} – ${mk(p.max)} · ${p.rate}% per month · arrangement fee ${p.fee}%`;
  const term = el('naTerm');
  term.innerHTML = p.terms.map(t=>`<option${t===a_termDefault(p)?' selected':''}>${t}</option>`).join('');
  el('naAmount').value = clamp(Number(el('naAmount').value)||p.min, p.min, p.max);
  renderNaPreview();
}
const a_termDefault = p => p.terms[Math.min(2, p.terms.length-1)];
function renderNaPreview(){
  const p = productBy(el('naProduct').value);
  const amount = Number(el('naAmount').value)||0;
  const term = Number(el('naTerm').value)||6;
  const inst = pmt(amount, p.rate, term);
  const total = totalPayable(amount, p.rate, term);
  const fee = Math.round(amount*p.fee/100);
  el('naPvProduct').textContent = p.name;
  el('naPvRate').textContent = p.rate.toFixed(1)+'% per month';
  el('naPvInst').textContent = mk(inst);
  el('naPvTotal').textContent = mk(total);
  el('naPvFee').textContent = mk(fee);
  el('naPvLegend').innerHTML = `<b><i style="background:var(--gold)"></i>Instalment ${mk(inst)}</b>
    <b><i style="background:#1E9E6A"></i>Net income after loan ${mk(Math.max(0, naNet() - inst))}</b>`;

  const income = Number(el('naIncome').value)||0;
  const expenses = Number(el('naExpenses').value)||0;
  const net = Math.max(1, income - expenses);
  const dti = Math.round(inst/net*100);
  const bar = el('naPvBar');
  if(bar){
    const used = clamp(dti, 0, 100);
    bar.innerHTML = `<span class="use" style="width:${used}%"></span><span class="free" style="width:${100-used}%"></span>`;
  }
  const tone = dti<=35?'ok':dti<=50?'await':'rej';
  el('naPvPill').textContent = dti+'% of net income';
  el('naPvPill').className = 'count-pill';
  const dial = el('naPvDial');
  if(dial){
    const colour = dti<=35?'#1E9E6A':dti<=50?'#C9A227':'#D93F3F';
    const arc = clamp(dti,0,100)*2.4;
    dial.innerHTML = `
      <svg width="78" height="78" viewBox="0 0 78 78">
        <circle cx="39" cy="39" r="31" fill="none" stroke="#EEF0F4" stroke-width="8"/>
        <circle cx="39" cy="39" r="31" fill="none" stroke="${colour}" stroke-width="8"
          stroke-dasharray="${(arc*31*2*Math.PI/240).toFixed(1)} 999"
          transform="rotate(-90 39 39)" stroke-linecap="round"/>
      </svg>
      <div><div class="dv" style="color:${colour}">${dti}%</div><div class="dl">Debt to income</div></div>`;
  }
  el('naPvNotes').innerHTML = `
    <div class="check"><span class="ck ${dti<=50?'y':'w'}">${dti<=50?'✓':'!'}</span>
      <div style="flex:1"><b>${dti<=35?'Comfortable':dti<=50?'Tight but within policy':'Above the 50% policy limit'}</b>
        <span class="s">Instalment ${mk(inst)} against net income ${mk(net)}</span></div></div>
    <div class="check"><span class="ck ${amount>=p.min&&amount<=p.max?'y':'w'}">${amount>=p.min&&amount<=p.max?'✓':'!'}</span>
      <div style="flex:1"><b>Amount within product range</b>
        <span class="s">${mk(p.min)} – ${mk(p.max)}</span></div></div>
    <div class="check"><span class="ck ${NA.docs.length>=2?'y':'w'}">${NA.docs.length>=2?'✓':'!'}</span>
      <div style="flex:1"><b>Supporting documents</b>
        <span class="s">${NA.docs.length} attached · at least 2 recommended before submission</span></div></div>`;
}
const naNet = () => Math.max(0, (Number(el('naIncome').value)||0) - (Number(el('naExpenses').value)||0));
function initNewApp(){
  el('naProduct').innerHTML = PRODUCTS.map(p=>`<option>${p.name}</option>`).join('');
  el('naCustomer').innerHTML = '<option value="">Select customer…</option>' +
    CUSTOMERS.map(c=>`<option value="${c.id}">${c.name} · ${c.id}</option>`).join('');
  naProductChanged();

  el('naSearch').addEventListener('input', e=>{
    const q = e.target.value.trim().toLowerCase();
    if(q.length < 2){ el('naResults').innerHTML=''; return; }
    const hits = CUSTOMERS.filter(c=>(c.name+' '+c.id+' '+c.phone).toLowerCase().includes(q)).slice(0,5);
    el('naResults').innerHTML = hits.length ? `<div class="card" style="padding:6px;margin-bottom:8px">${
      hits.map(c=>`<div class="lrow" data-cust="${c.id}" style="cursor:pointer">
        <div class="lic">${initials(c.name)}</div>
        <div><div class="lt">${c.name}</div><div class="ls">${c.id} · ${c.phone} · ${c.loans} loan(s)</div></div>
        <div class="lr"><span class="mini-tag">${c.district}</span></div></div>`).join('')}</div>`
      : '<div class="note"><div>No customer matches that search.</div></div>';
    el('naResults').querySelectorAll('[data-cust]').forEach(r=>{
      r.onclick = ()=>{ el('naCustomer').value = r.dataset.cust; naCustomerPicked(); el('naResults').innerHTML=''; el('naSearch').value=''; };
    });
  });
  el('naCustomer').addEventListener('change', naCustomerPicked);
  el('naProduct').addEventListener('change', naProductChanged);
  ['naAmount','naTerm','naIncome','naExpenses'].forEach(id=>
    el(id).addEventListener('input', renderNaPreview));
  el('naDocs').addEventListener('click', ()=>{
    const names = ['application-form.pdf','nrc-copy.jpg','payslip-oct.pdf','bank-statement.pdf'];
    NA.docs.push(names[NA.docs.length % names.length]);
    renderNaDocs();
  });
  el('naCustMode').querySelectorAll('button').forEach(b=>{
    b.onclick = ()=>{
      el('naCustMode').querySelectorAll('button').forEach(x=>x.classList.remove('on'));
      b.classList.add('on'); NA.mode = b.dataset.mode;
      el('naExisting').classList.toggle('hide', NA.mode!=='existing');
      el('naNew').classList.toggle('hide', NA.mode!=='new');
    };
  });
  el('naSubmit').onclick = ()=>submitApplication(false);
  el('naSaveDraft').onclick = ()=>submitApplication(true);
  el('naClear').onclick = ()=>clearNewApp();
}
function naCustomerPicked(){
  const c = custBy(el('naCustomer').value);
  NA.custId = c ? c.id : '';
  if(c){
    el('naIncome').value = c.income;
    el('naEmploy').value = c.employ;
    el('naEmployer').value = c.employer === '—' ? '' : c.employer;
    el('naExpenses').value = Math.round(c.income*0.55);
    renderNaPreview();
  }
}
function renderNaDocs(){
  el('naDocList').innerHTML = NA.docs.length ? NA.docs.map((f,i)=>`
    <div class="evidence" style="display:flex;align-items:center;gap:9px;border:1px solid var(--line);
      border-radius:9px;padding:7px 9px;margin-bottom:6px">
      <div class="di" style="width:26px;height:26px;border-radius:7px;display:grid;place-items:center;
        background:#EAF1FE;color:#2456C4;font-size:9px;font-weight:800">${f.split('.').pop().toUpperCase()}</div>
      <div style="flex:1"><b style="font-size:11px">${f}</b>
        <div style="font-size:9.5px;color:var(--muted)">Attached · sample file</div></div>
      <button class="btn btn-ghost btn-sm" data-rmdoc="${i}">Remove</button></div>`).join('')
    : '<div class="inline-note">No documents attached yet.</div>';
  el('naDocList').querySelectorAll('[data-rmdoc]').forEach(b=>{
    b.onclick = ()=>{ NA.docs.splice(Number(b.dataset.rmdoc),1); renderNaDocs(); renderNaPreview(); };
  });
}
function clearNewApp(){
  NA.custId=''; NA.docs=[];
  el('naCustomer').value=''; el('naResults').innerHTML='';
  el('naFirst').value=''; el('naLast').value=''; el('naNrc').value=''; el('naPhone').value='';
  el('naGuarantor').value=''; el('naGuarPhone').value=''; el('naGuarIncome').value='0';
  el('naNotes');
  const notes = document.getElementById('naNotes'); if(notes) notes.value='';
  renderNaDocs(); renderNaPreview();
}
function submitApplication(draft){
  const p = productBy(el('naProduct').value);
  const amount = Number(el('naAmount').value)||0;
  let custId = NA.custId, name = '';
  if(NA.mode === 'existing'){
    if(!custId){ toast('Select an existing customer first.','err'); return; }
    name = custBy(custId).name;
  } else {
    const first = el('naFirst').value.trim(), last = el('naLast').value.trim();
    if(!first || !last){ toast('Enter the customer’s first name and surname.','err'); return; }
    if(!el('naNrc').value.trim() || !el('naPhone').value.trim()){ toast('NRC number and phone are required.','err'); return; }
    const id = 'GF-000' + (520 + CUSTOMERS.filter(c=>c.id.startsWith('GF-0005')).length - 1);
    const rec = {id, name:first+' '+last, phone:el('naPhone').value, nrc:el('naNrc').value,
      district:el('naDistrict').value, type:el('naType').value, employ:el('naEmploy').value,
      employer:el('naEmployer').value || '—', income:Number(el('naIncome').value)||0, loans:0};
    CUSTOMERS.push(rec); custId = id; name = rec.name;
    el('naCustomer').innerHTML = '<option value="">Select customer…</option>' +
      CUSTOMERS.map(c=>`<option value="${c.id}">${c.name} · ${c.id}</option>`).join('');
    logApp('Creation', 'Customer record created · '+name+' ('+id+')', 'customer.'+id);
  }
  if(amount < p.min || amount > p.max){ toast(`Amount must be between ${mk(p.min)} and ${mk(p.max)} for ${p.name}.`,'err'); return; }

  const no = 'APP-2026-0' + (192 + APPLICATIONS.filter(a=>a.no.startsWith('APP-2026-0') && Number(a.no.slice(-4))>=190).length);
  const docs = docsAll(['form','nrc','address','income','employ'].slice(0, 2 + NA.docs.length), ['guarantor','collateral']);
  const missing = Object.values(docs).filter(v=>v==='Missing').length;
  const status = draft ? 'New' : (missing > 3 ? 'Awaiting Documents' : 'Under Review');
  const app = {
    no, custId, cust:name, phone:(custBy(custId)||{}).phone||el('naPhone').value,
    nrc:(custBy(custId)||{}).nrc||el('naNrc').value, district:(custBy(custId)||{}).district||el('naDistrict').value,
    product:p.name, amount, term:Number(el('naTerm').value), freq:el('naFreq').value,
    purpose:el('naPurpose').value, date:TODAY, status, stage:'Intake',
    officer: OFFICER_NAMES.reduce((best,n)=>{
      const load = APPLICATIONS.filter(a=>a.officer===n && !isClosed(a)).length;
      return load < best.load ? {n, load} : best;
    }, {n:OFFICER_NAMES[0], load:99}).n,
    income:Number(el('naIncome').value)||0, expenses:Number(el('naExpenses').value)||0,
    oblig:(custBy(custId)||{}).loans ? 45000 : 0, risk:'Medium', notes:draft?'Draft — not yet submitted.':'',
    sentTo:'', decision:null, approval:null, docs,
    kyc:{identity:'Pending',contact:'Pending',address:'Pending',employment:'Pending',income:'Pending',
      docs:'Pending',loans:'Pending',balances:'Pending',history:'Pending'},
    deadline:addDays(TODAY, p.name==='Emergency Cash'?3:7), moved:TODAY, assess:null, comms:[]
  };
  APPLICATIONS.unshift(app);
  logApp('Creation', (draft?'Draft application saved · ':'Application created · ')+no, no);
  toast(draft ? `${no} saved as a draft.` : `${no} submitted for review · ${name} · ${mk(amount)}.`);
  renderAll();
  clearNewApp();
  REG.page = 1; renderRegister();
  if(!draft) gotoSec('s2');
}
