<script>
/* ============================================================
   GOLDEN FINANCIAL SERVICES · AUDIT LOGS  (1/4)
   Helpers, users, event generation, sections 1–2.
   ============================================================ */
const el = id => document.getElementById(id);
const nf = n => Math.round(Number(n)||0).toLocaleString('en-US');
const esc = s => String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const pct = (a,b) => b ? Math.round(a/b*100) : 0;
const sum = (a,f) => a.reduce((s,x)=>s+(f?Number(f(x))||0:Number(x)||0),0);
const clamp = (v,a,b) => Math.max(a, Math.min(b, v));
const initials = s => String(s||'?').split(' ').filter(Boolean).map(w=>w[0]).slice(0,2).join('').toUpperCase();

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
const TODAY = '2026-10-30';
const NOW_TIME = '10:24';
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const dayOf = iso => { let s = String(iso || '').slice(0,10);
  if(!/^\d{4}-\d{2}-\d{2}$/.test(s)) s = TODAY;
  return new Date(s + 'T00:00:00'); };
const fmtDate = iso => { if(!iso) return '—'; const d = dayOf(iso);
  return d.getDate().toString().padStart(2,'0') + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear(); };
const fmtShort = iso => { if(!iso) return '—'; const d = dayOf(iso);
  return d.getDate().toString().padStart(2,'0') + ' ' + MONTHS[d.getMonth()]; };
const addDays = (iso,n) => { const d = new Date(iso+'T00:00:00'); d.setDate(d.getDate()+n); return d.toISOString().slice(0,10); };
const daysBetween = (a,b) => Math.round((new Date(b+'T00:00:00') - new Date(a+'T00:00:00'))/86400000);
const clock = () => { const d = new Date(); return d.toTimeString().slice(0,5); };
const tsDate = ts => String(ts).slice(0,10);
const tsTime = ts => String(ts).slice(11,19);
const fmtTs = ts => fmtDate(tsDate(ts)) + ' · ' + tsTime(ts);

/* ----- deterministic pseudo-random ----- */
let SEED = 20261030;
function rnd(){ SEED = (SEED * 1664525 + 1013904223) % 4294967296; return SEED / 4294967296; }
function ri(a,b){ return Math.floor(rnd()*(b-a+1)) + a; }
function pick(a){ return a[Math.floor(rnd()*a.length)]; }

/* ===================== USERS ===================== */
const USERS = [
  {id:'STF-001', name:'Chikondi Mwale',   username:'cmwale',    role:'Administrator',      dept:'Management',    status:'Active', ip:'10.4.1.10', device:'Chrome 130 · Windows 11'},
  {id:'STF-002', name:'Grace Nyirenda',   username:'gnyirenda', role:'Administrator',      dept:'IT',            status:'Active', ip:'10.4.1.22', device:'Edge 129 · Windows 11'},
  {id:'STF-003', name:'Tadala Msonthi',   username:'tmson',     role:'Head of Credit',     dept:'Credit',        status:'Active', ip:'10.4.2.14', device:'Chrome 130 · macOS'},
  {id:'STF-004', name:'Linda Mhango',     username:'lmhango',   role:'Credit Analyst',     dept:'Credit',        status:'Active', ip:'10.4.2.31', device:'Chrome 130 · Windows 10'},
  {id:'STF-005', name:'Yamikani Banda',   username:'ybanda',    role:'Loan Officer',       dept:'Lending',       status:'Active', ip:'10.4.3.08', device:'Chrome 130 · Windows 10'},
  {id:'STF-006', name:'Blessings Tembo',  username:'btembo',    role:'Loan Officer',       dept:'Lending',       status:'Active', ip:'10.4.3.19', device:'Firefox 131 · Windows 11'},
  {id:'STF-007', name:'Esther Mwale',     username:'emwale',    role:'Collections Officer', dept:'Collections',  status:'Active', ip:'10.4.4.05', device:'Chrome 130 · Android'},
  {id:'STF-008', name:'Fatsani Gondwe',   username:'fgondwe',   role:'Collections Officer', dept:'Collections',  status:'Locked', ip:'10.4.4.17', device:'Chrome 130 · Windows 10'},
  {id:'STF-009', name:'Alinafe Nyirenda', username:'anyirenda', role:'Cashier',            dept:'Finance',       status:'Active', ip:'10.4.5.02', device:'Chrome 130 · Windows 11'},
  {id:'STF-010', name:'Memory Phiri',     username:'mphiri',    role:'Customer Care',      dept:'Service',       status:'Active', ip:'10.4.5.26', device:'Chrome 130 · Windows 10'},
  {id:'STF-011', name:'Ruth Nsanja',      username:'rnsanja',   role:'Auditor',            dept:'Compliance',    status:'Active', ip:'10.4.6.11', device:'Firefox 131 · Ubuntu'},
  {id:'STF-000', name:'System',           username:'system',    role:'System',             dept:'Platform',      status:'Active', ip:'127.0.0.1', device:'scheduler'}
];
const userByName = n => USERS.find(u=>u.name === n) || USERS[0];
const ROLES = [...new Set(USERS.map(u=>u.role))];

/* ===================== EVENT CATALOGUE ===================== */
/* every template declares: module, action, type, severity, outcome, roles that may act,
   the buckets it belongs to (staff / admin / cust / loan / disb / rpa / fin / sec / perm / cfg / sys),
   a description, an optional before-and-after set, and how many to generate. */
const T = (o) => Object.assign({sev:'Info', outcome:'Success', roles:null, changes:null, n:1}, o);

const TEMPLATES = [
  /* --- authentication --- */
  T({module:'Authentication', action:'User login', type:'Login', buckets:{staff:'session', sec:'success'}, n:62,
     desc:'Signed in from Chrome 130 on Windows 11'}),
  T({module:'Authentication', action:'User logout', type:'Logout', buckets:{staff:'session', sec:'logout'}, n:40,
     desc:'Session ended by the user'}),
  T({module:'Authentication', action:'Failed login attempt', type:'Login', sev:'Warning', outcome:'Failed',
     buckets:{staff:'session', sec:'failed'}, n:18, desc:'Invalid password supplied'}),
  T({module:'Authentication', action:'Account locked', type:'Lockout', sev:'Critical', outcome:'Failed',
     buckets:{staff:'session', sec:'lockout'}, n:4, desc:'Locked after 5 consecutive failed attempts'}),
  T({module:'Authentication', action:'Password reset requested', type:'Password', sev:'Warning',
     buckets:{staff:'account', sec:'password'}, n:6, desc:'Reset link issued to the staff email address'}),
  T({module:'Authentication', action:'Password changed', type:'Password', buckets:{staff:'account', sec:'password'},
     n:5, desc:'Password updated by the user'}),
  T({module:'Authentication', action:'Suspicious login detected', type:'Security', sev:'Security', outcome:'Warning',
     buckets:{staff:'session', sec:'suspicious'}, n:3, desc:'Sign-in from an unrecognised device and location'}),
  T({module:'Authentication', action:'Unauthorized access attempt', type:'Access', sev:'Security', outcome:'Denied',
     buckets:{sec:'unauthorized', perm:'denied'}, n:5, desc:'Attempted to open a record outside the assigned portfolio'}),
  T({module:'Authentication', action:'Session revoked', type:'Session', sev:'Warning',
     buckets:{sec:'session', perm:'privileged'}, n:4, desc:'Active session invalidated by an administrator'}),
  T({module:'Authentication', action:'Multi-factor challenge passed', type:'MFA', buckets:{sec:'mfa'}, n:14,
     desc:'One-time code verified by SMS'}),
  T({module:'Authentication', action:'Multi-factor challenge failed', type:'MFA', sev:'Warning', outcome:'Failed',
     buckets:{sec:'mfa'}, n:3, desc:'Incorrect one-time code entered'}),

  /* --- customers --- */
  T({module:'Customers', action:'Customer registered', type:'Create',
     roles:['Customer Care','Loan Officer','Administrator'], buckets:{staff:'create', cust:'create'}, n:14,
     desc:'New customer record created at the counter'}),
  T({module:'Customers', action:'Customer profile updated', type:'Update', buckets:{staff:'modify', cust:'profile'}, n:18,
     desc:'Personal and employment details amended',
     changes:[['Occupation','Trader','Hardware retailer'],['Monthly income','MK 240,000','MK 365,000']]}),
  T({module:'Customers', action:'Contact details changed', type:'Update', buckets:{staff:'modify', cust:'contact'}, n:12,
     desc:'Phone number replaced after a customer request',
     changes:[['Phone number','+265 999 118 220','+265 881 004 771']]}),
  T({module:'Customers', action:'Customer account status changed', type:'Update', sev:'Warning',
     buckets:{staff:'modify', cust:'status'}, n:6, desc:'Status changed after an account review',
     changes:[['Account status','Active','Suspended'],['Reason','—','Arrears and failed contact']]}),
  T({module:'Customers', action:'Customer verification completed', type:'Verify',
     buckets:{staff:'modify', cust:'verification'}, n:10, desc:'KYC checks approved and the account activated',
     changes:[['KYC status','Pending','Verified']]}),
  T({module:'Customers', action:'Customer document opened', type:'View',
     buckets:{staff:'customer', cust:'docaccess', perm:'sensitive'}, n:8, desc:'National ID copy viewed'}),
  T({module:'Customers', action:'Customer record exported', type:'Export', sev:'Warning',
     buckets:{staff:'export', cust:'export'}, n:5, desc:'Customer record exported to CSV'}),
  T({module:'Customers', action:'Customer account closed', type:'Update', sev:'Warning',
     buckets:{staff:'modify', cust:'closure'}, n:2, desc:'Account closed at the customer request',
     changes:[['Account status','Inactive','Closed']]}),
  T({module:'Customers', action:'Customer record opened', type:'View',
     buckets:{staff:'customer', perm:'sensitive'}, n:24, desc:'Profile viewed from the customer book'}),

  /* --- loan applications --- */
  T({module:'Loan Applications', action:'Loan application submitted', type:'Create',
     roles:['Loan Officer','Customer Care'], buckets:{staff:'loan', loan:'submission'}, n:12,
     desc:'Application captured for MK 1,200,000 over 12 months'}),
  T({module:'Loan Applications', action:'Application assigned', type:'Assign',
     buckets:{staff:'loan', loan:'assignment'}, n:8, desc:'Application assigned for credit assessment'}),
  T({module:'Loan Applications', action:'Application reviewed', type:'Review',
     buckets:{staff:'loan', loan:'review'}, n:10, desc:'Credit assessment completed and recommendation recorded'}),
  T({module:'Loan Applications', action:'Application status changed', type:'Update',
     buckets:{staff:'loan', loan:'status'}, n:9, desc:'Moved to the approval queue',
     changes:[['Status','Under review','Awaiting approval']]}),
  T({module:'Loan Applications', action:'Application documents verified', type:'Verify',
     buckets:{staff:'loan', loan:'docverify'}, n:7, desc:'Payslip and national ID confirmed'}),
  T({module:'Loan Applications', action:'Loan application approved', type:'Approve',
     roles:['Head of Credit','Administrator'], buckets:{staff:'loan', loan:'approval'}, n:8,
     desc:'Approved within delegated authority'}),
  T({module:'Loan Applications', action:'Loan application rejected', type:'Reject', sev:'Warning',
     roles:['Head of Credit','Credit Analyst'], buckets:{staff:'loan', loan:'rejection'}, n:4,
     desc:'Declined on affordability grounds'}),
  T({module:'Loan Applications', action:'Loan application cancelled', type:'Update', sev:'Warning',
     buckets:{staff:'loan', loan:'cancellation'}, n:3, desc:'Customer withdrew the application'}),
  T({module:'Loan Applications', action:'Approval limit overridden', type:'Override', sev:'Critical',
     roles:['Administrator'], buckets:{staff:'loan', loan:'override', perm:'privileged'}, n:3,
     desc:'Approved above the delegated limit with a second sign-off',
     changes:[['Approval limit','MK 1,000,000','MK 5,000,000'],['Approver','Head of Credit','Administrator']]}),
  T({module:'Loan Applications', action:'Application details modified', type:'Update', sev:'Warning',
     buckets:{staff:'loan', loan:'modification'}, n:5, desc:'Requested amount amended at the customer request',
     changes:[['Requested amount','MK 900,000','MK 1,200,000'],['Term','9 months','12 months']]}),

  /* --- disbursements --- */
  T({module:'Disbursements', action:'Disbursement created', type:'Create',
     roles:['Cashier','Head of Credit'], buckets:{staff:'disbursement', disb:'creation', fin:'ref'}, n:7,
     desc:'Payout prepared for the approved loan'}),
  T({module:'Disbursements', action:'Disbursement authorised', type:'Approve',
     roles:['Head of Credit','Administrator'], buckets:{staff:'disbursement', disb:'authorization', fin:'auth'}, n:6,
     desc:'Authorised at approval level 2'}),
  T({module:'Disbursements', action:'Disbursement amount changed', type:'Update', sev:'Warning',
     buckets:{staff:'disbursement', disb:'amount', fin:'amount'}, n:3,
     desc:'Amount netted against the processing fee',
     changes:[['Disbursement amount','MK 1,200,000','MK 1,170,000'],['Reason','—','Processing fee deducted']]}),
  T({module:'Disbursements', action:'Disbursement method changed', type:'Update', sev:'Warning',
     buckets:{staff:'disbursement', disb:'method', fin:'ref'}, n:2, desc:'Payout moved to a mobile wallet',
     changes:[['Payment method','Bank transfer','Airtel Money']]}),
  T({module:'Disbursements', action:'Disbursement confirmed', type:'Confirm',
     buckets:{staff:'disbursement', disb:'confirmation'}, n:6, desc:'Funds confirmed by the payment partner'}),
  T({module:'Disbursements', action:'Disbursement failed', type:'Error', sev:'Critical', outcome:'Failed',
     buckets:{staff:'disbursement', disb:'failure', sys:'payment'}, n:3,
     desc:'Wallet rejected the payout — number not registered'}),
  T({module:'Disbursements', action:'Disbursement cancelled', type:'Update', sev:'Warning',
     buckets:{staff:'disbursement', disb:'cancellation'}, n:2, desc:'Cancelled before release'}),
  T({module:'Disbursements', action:'Disbursement reversal requested', type:'Reverse', sev:'Critical',
     buckets:{staff:'disbursement', disb:'reversal', fin:'correction'}, n:2,
     desc:'Reversal raised after a duplicate payout'}),

  /* --- repayments & collections --- */
  T({module:'Repayments', action:'Repayment recorded', type:'Create',
     roles:['Cashier','Collections Officer'], buckets:{staff:'repayment', rpa:'creation', fin:'ref'}, n:24,
     desc:'Cash repayment captured at the branch'}),
  T({module:'Repayments', action:'Payment verified', type:'Verify',
     buckets:{staff:'repayment', rpa:'verification'}, n:12, desc:'Bank reference matched to the deposit'}),
  T({module:'Repayments', action:'Repayment allocation changed', type:'Update', sev:'Warning',
     buckets:{staff:'repayment', rpa:'allocation', fin:'correction'}, n:3,
     desc:'Payment re-allocated from fees to principal',
     changes:[['Allocated to fees','MK 25,000','MK 0'],['Allocated to principal','MK 0','MK 25,000']]}),
  T({module:'Repayments', action:'Receipt generated', type:'Create',
     buckets:{staff:'repayment', rpa:'receipt'}, n:10, desc:'Receipt issued and sent to the customer'}),
  T({module:'Repayments', action:'Repayment reversed', type:'Reverse', sev:'Critical',
     buckets:{staff:'repayment', rpa:'reversal', fin:'correction'}, n:3,
     desc:'Reversed after a duplicate wallet entry'}),
  T({module:'Repayments', action:'Repayment adjusted', type:'Update', sev:'Warning',
     buckets:{staff:'repayment', rpa:'adjustment', fin:'correction'}, n:4,
     desc:'Amount corrected after a keying error',
     changes:[['Amount','MK 48,250','MK 84,250'],['Reason','—','Keying error at the counter']]}),
  T({module:'Collections', action:'Arrears status changed', type:'Update', sev:'Warning',
     buckets:{staff:'collection', rpa:'arrears'}, n:5, desc:'Account moved into arrears',
     changes:[['Arrears status','Current','30 days'],['Days past due','0','31']]}),
  T({module:'Collections', action:'Collection account reassigned', type:'Assign',
     buckets:{staff:'collection', rpa:'assignment'}, n:4, desc:'Case handed to another collections officer'}),
  T({module:'Repayments', action:'Loan settled', type:'Confirm',
     buckets:{staff:'repayment', rpa:'settlement'}, n:5, desc:'Settlement payment closed the facility'}),
  T({module:'Repayments', action:'Financial record corrected', type:'Update', sev:'Critical',
     buckets:{staff:'repayment', rpa:'correction', fin:'correction'}, n:3,
     desc:'Ledger entry corrected after reconciliation'}),

  /* --- financial --- */
  T({module:'Financial', action:'Loan principal adjusted', type:'Update', sev:'Warning',
     buckets:{fin:'amount', staff:'modify'}, n:3, desc:'Principal corrected to match the signed agreement',
     changes:[['Principal','MK 900,000','MK 950,000']]}),
  T({module:'Settings', action:'Interest rate changed', type:'Configure', sev:'Critical',
     buckets:{fin:'rate', cfg:'product'}, n:2, desc:'Product rate revised for new bookings',
     changes:[['Monthly rate','3.2%','3.5%'],['Effective from','—','01 Nov 2026']]}),
  T({module:'Settings', action:'Fee configuration changed', type:'Configure', sev:'Warning',
     buckets:{fin:'fee', cfg:'product'}, n:3, desc:'Processing fee updated',
     changes:[['Processing fee','2.0%','2.5%']]}),
  T({module:'Financial', action:'Duplicate transaction investigated', type:'Review', sev:'Warning',
     buckets:{fin:'duplicate', rpa:'correction'}, n:2,
     desc:'Two receipts found for one deposit; one reversed'}),
  T({module:'Financial', action:'Reconciliation adjustment posted', type:'Update', sev:'Warning',
     buckets:{fin:'recon', rpa:'correction'}, n:3, desc:'Bank charge posted to the collection account',
     changes:[['Ledger balance','MK 4,182,300','MK 4,176,800'],['Reason','—','Bank charges']]}),

  /* --- staff & administration --- */
  T({module:'Staff', action:'Staff account created', type:'Create', roles:['Administrator'],
     buckets:{staff:'account', admin:'staff-create'}, n:3, desc:'New user provisioned with a temporary password'}),
  T({module:'Staff', action:'Staff account modified', type:'Update', roles:['Administrator'],
     buckets:{staff:'account', admin:'staff-modify'}, n:5, desc:'Contact details updated on the staff record',
     changes:[['Phone number','+265 999 004 812','+265 881 220 004']]}),
  T({module:'Staff', action:'Staff role changed', type:'Update', sev:'Critical', roles:['Administrator'],
     buckets:{staff:'account', admin:'role', perm:'staffrole'}, n:4, desc:'Role changed after a promotion',
     changes:[['Role','Loan Officer','Credit Analyst'],['Approved by','—','Head of Credit']]}),
  T({module:'Permissions', action:'Permission granted', type:'Permission', sev:'Warning', roles:['Administrator'],
     buckets:{admin:'permission', perm:'grant'}, n:4, desc:'Permission added to a role',
     changes:[['Permission','Approve up to MK 500,000','Approve up to MK 1,000,000']]}),
  T({module:'Permissions', action:'Permission revoked', type:'Permission', sev:'Warning', roles:['Administrator'],
     buckets:{admin:'permission', perm:'revoke'}, n:2, desc:'Permission removed from a role',
     changes:[['Permission','Export customer data','—']]}),
  T({module:'Settings', action:'System setting changed', type:'Configure', sev:'Warning', roles:['Administrator'],
     buckets:{admin:'settings', cfg:'general'}, n:5, desc:'Operational setting updated',
     changes:[['Session timeout','30 minutes','20 minutes']]}),
  T({module:'Settings', action:'Loan product configured', type:'Configure', sev:'Warning', roles:['Administrator'],
     buckets:{admin:'product', cfg:'product'}, n:4, desc:'Product parameters amended',
     changes:[['Maximum amount','MK 4,000,000','MK 5,000,000'],['Minimum term','6 months','9 months']]}),
  T({module:'Settings', action:'Approval limit changed', type:'Configure', sev:'Critical', roles:['Administrator'],
     buckets:{admin:'limit', cfg:'workflow'}, n:3, desc:'Delegated authority amended',
     changes:[['Level 1 limit','MK 750,000','MK 1,000,000'],['Level 2 limit','MK 4,000,000','MK 5,000,000']]}),
  T({module:'Settings', action:'Payment method configured', type:'Configure', sev:'Warning', roles:['Administrator'],
     buckets:{admin:'payment', cfg:'payment'}, n:2, desc:'Mobile wallet integration enabled',
     changes:[['TNM Mpamba','Disabled','Enabled']]}),
  T({module:'Administration', action:'Administrative override applied', type:'Override', sev:'Critical',
     roles:['Administrator'], buckets:{admin:'override', perm:'privileged'}, n:3,
     desc:'Override applied with a recorded reason',
     changes:[['Override','—','Waived 30-day seasoning'],['Reason','—','Long-standing customer']]}),
  T({module:'Settings', action:'Critical configuration changed', type:'Configure', sev:'Critical',
     roles:['Administrator'], buckets:{admin:'critical', cfg:'security'}, n:2,
     desc:'Security policy tightened after an internal review',
     changes:[['Minimum password length','8','12'],['Lockout threshold','10','5']]}),
  T({module:'Authentication', action:'Administrator login', type:'Login', roles:['Administrator'],
     buckets:{admin:'login', staff:'session', sec:'success'}, n:16, desc:'Administrator signed in with MFA'}),

  /* --- configuration --- */
  T({module:'Settings', action:'General setting changed', type:'Configure',
     buckets:{cfg:'general'}, n:4, desc:'Company profile updated',
     changes:[['Support email','help@golden.mw','support@golden.mw']]}),
  T({module:'Settings', action:'Approval workflow changed', type:'Configure', sev:'Warning',
     buckets:{cfg:'workflow'}, n:2, desc:'Approval levels restructured',
     changes:[['Approval levels','2','3'],['Level 3 threshold','—','MK 5,000,000']]}),
  T({module:'Settings', action:'Repayment rule changed', type:'Configure', sev:'Warning',
     buckets:{cfg:'repayment'}, n:3, desc:'Allocation order updated',
     changes:[['Allocation order','Penalty → Fees → Interest → Principal','Fees → Penalty → Interest → Principal']]}),
  T({module:'Settings', action:'Notification template changed', type:'Configure',
     buckets:{cfg:'notification', sys:'notification'}, n:3, desc:'Reminder SMS wording updated',
     changes:[['Template','Your instalment is due','Dear {name}, your instalment of {amount} is due on {date}']]}),
  T({module:'Settings', action:'Customer portal setting changed', type:'Configure',
     buckets:{cfg:'portal'}, n:2, desc:'Self-service statement download enabled',
     changes:[['Statement download','Disabled','Enabled']]}),
  T({module:'Settings', action:'Security policy changed', type:'Configure', sev:'Critical',
     buckets:{cfg:'security', perm:'privileged'}, n:3, desc:'Password policy updated',
     changes:[['Password expiry','90 days','60 days'],['MFA','Optional','Required for administrators']]}),
  T({module:'Settings', action:'Integration configured', type:'Configure', sev:'Warning',
     buckets:{cfg:'integration', sys:'api'}, n:2, desc:'API credentials rotated',
     changes:[['API key','•••• 4F2A','•••• 91BC']]}),
  T({module:'Settings', action:'Backup schedule changed', type:'Configure',
     buckets:{cfg:'backup'}, n:2, desc:'Backup window moved out of working hours',
     changes:[['Backup window','01:00','02:30'],['Retention','30 days','90 days']]}),

  /* --- system --- */
  T({module:'System', action:'Application error', type:'Error', sev:'Critical', outcome:'Failed',
     roles:['System'], buckets:{sys:'app'}, n:8, desc:'Unhandled exception in the repayment module'}),
  T({module:'System', action:'Database query failed', type:'Error', sev:'Critical', outcome:'Failed',
     roles:['System'], buckets:{sys:'db'}, n:3, desc:'Statement timed out after 30 seconds'}),
  T({module:'System', action:'Supabase connection event', type:'System', sev:'Warning', outcome:'Warning',
     roles:['System'], buckets:{sys:'supabase'}, n:3, desc:'Connection pool exhausted; request retried'}),
  T({module:'System', action:'Authentication service error', type:'Error', sev:'Warning', outcome:'Failed',
     roles:['System'], buckets:{sys:'auth', sec:'failed'}, n:2, desc:'Identity provider returned 502'}),
  T({module:'System', action:'API request failed', type:'Error', sev:'Warning', outcome:'Failed',
     roles:['System'], buckets:{sys:'api'}, n:6, desc:'Upstream service returned HTTP 500'}),
  T({module:'System', action:'Notification delivery failed', type:'Error', sev:'Warning', outcome:'Failed',
     roles:['System'], buckets:{sys:'notification'}, n:4, desc:'SMS gateway rejected the message'}),
  T({module:'System', action:'Payment integration error', type:'Error', sev:'Critical', outcome:'Failed',
     roles:['System'], buckets:{sys:'payment'}, n:3, desc:'Wallet callback signature mismatch'}),
  T({module:'System', action:'Scheduled task failed', type:'Error', sev:'Warning', outcome:'Failed',
     roles:['System'], buckets:{sys:'task'}, n:3, desc:'Nightly arrears job did not complete'}),
  T({module:'System', action:'Service availability event', type:'System', sev:'Warning', outcome:'Warning',
     roles:['System'], buckets:{sys:'availability'}, n:2, desc:'Elevated response times for four minutes'}),
  T({module:'Customers', action:'Sensitive data accessed', type:'View', sev:'Security',
     buckets:{perm:'sensitive', staff:'customer'}, n:3, desc:'Customer bank account details viewed'})
];

/* ===================== RECORD REFERENCES ===================== */
const REF = {
  customer: i => 'GF-' + String(480 + (i % 34) * 3).padStart(6,'0'),
  loan: i => 'LN-' + (2401 + (i % 35) * 3),
  receipt: i => 'RC-' + (4820 + i),
  app: i => 'APP-2026-' + String(118 + i).padStart(4,'0'),
  disb: i => 'DSB-2026-' + String(40 + i).padStart(4,'0'),
  staff: i => 'STF-' + String(1 + (i % 11)).padStart(3,'0'),
  setting: i => 'SET-' + String(101 + (i % 40)).padStart(3,'0'),
  service: i => ['supabase','payments-api','sms-gateway','auth-service','reports-worker'][i % 5]
};
function recordFor(tpl, i){
  const m = tpl.module;
  if(m === 'Authentication') return tpl.action.includes('Administrator') ? REF.staff(i) : 'SESSION';
  if(m === 'Customers') return tpl.action.includes('document') ? REF.customer(i) : REF.customer(i);
  if(m === 'Loan Applications') return i % 3 === 0 ? REF.app(i) : REF.loan(i);
  if(m === 'Disbursements') return REF.disb(i);
  if(m === 'Repayments') return i % 2 ? REF.receipt(i) : REF.loan(i);
  if(m === 'Collections') return REF.loan(i);
  if(m === 'Financial') return i % 2 ? REF.loan(i) : REF.receipt(i);
  if(m === 'Staff') return REF.staff(i);
  if(m === 'Permissions') return 'ROLE-' + String(1 + i % 7).padStart(2,'0');
  if(m === 'Administration') return REF.loan(i);
  if(m === 'Settings') return REF.setting(i);
  return REF.service(i);
}
const txnFor = (tpl, i) => {
  const m = tpl.module;
  if(m === 'Repayments' || m === 'Collections') return REF.receipt(i);
  if(m === 'Disbursements') return 'PAY-' + String(77120 + i);
  if(m === 'Financial') return 'TXN-' + String(90210 + i);
  return '';
};

function hashOf(str){
  let h1 = 0x811c9dc5;
  for(let i=0;i<str.length;i++){ h1 ^= str.charCodeAt(i); h1 = (h1 * 0x01000193) >>> 0; }
  return h1.toString(16).padStart(8,'0') + ((h1 >>> 7) ^ 0x2f).toString(16).padStart(4,'0');
}

const EVENTS = [];
const ARCHIVE = [];

function buildEvents(){
  SEED = 20261030;
  EVENTS.length = 0;
  let idSeq = 0;
  const dayPool = [0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,3,3,3,4,4,5,5,6,7];

  TEMPLATES.forEach((tpl, ti)=>{
    for(let i=0;i<tpl.n;i++){
      const rolePool = tpl.roles || ROLES.filter(r=>r !== 'System');
      const candidates = USERS.filter(u=> rolePool.includes(u.role));
      const user = candidates.length ? candidates[ri(0, candidates.length-1)] : USERS[USERS.length-1];
      const dayOffset = pick(dayPool);
      let hh, mm, ss;
      if(dayOffset === 0){ hh = ri(7,9); mm = hh === 9 ? ri(0,24) : ri(0,59); }
      else { hh = ri(8,17); mm = ri(0,59); }
      ss = ri(0,59);
      const date = addDays(TODAY, -dayOffset);
      const ts = `${date} ${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}:${String(ss).padStart(2,'0')}`;
      const record = recordFor(tpl, ti*7 + i);
      const ev = {
        id:'', ts, date, time:tsTime(ts),
        user:user.name, username:user.username, role:user.role, userId:user.id,
        action:tpl.action, type:tpl.type, module:tpl.module,
        record, outcome: tpl.outcome === 'Warning' ? 'Warning' : tpl.outcome,
        severity:tpl.sev, desc:tpl.desc,
        changes: tpl.changes ? tpl.changes.map(c=>[c[0], c[1], c[2]]) : null,
        txn: txnFor(tpl, ti + i),
        corr: 'CRQ-' + String(100000 + (ti*131 + i*7) % 899999),
        ip: user.ip, device: user.device,
        b: Object.assign({}, tpl.buckets),
        archived:false
      };
      EVENTS.push(ev);
    }
  });

  /* ids assigned newest-first so the newest event has the highest sequence */
  EVENTS.sort((a,b)=> a.ts < b.ts ? 1 : a.ts > b.ts ? -1 : 0);
  const total = EVENTS.length;
  EVENTS.forEach((e,i)=>{
    e.id = 'AUD-2026-' + String(total - i).padStart(6,'0');
    e.block = 'BLK-' + String(Math.floor(i/25) + 1).padStart(3,'0');
    e.hash = hashOf(e.id + e.ts + e.user + e.action);
  });
  idSeq = total;

  /* sealed archive: Jul–Sep 2026 */
  SEED = 77120;
  const archivePool = [];
  TEMPLATES.forEach((tpl, ti)=>{
    const n = Math.max(1, Math.round(tpl.n / 5));
    for(let i=0;i<n;i++){
      const rolePool = tpl.roles || ROLES.filter(r=>r !== 'System');
      const candidates = USERS.filter(u=> rolePool.includes(u.role));
      const user = candidates.length ? candidates[ri(0, candidates.length-1)] : USERS[USERS.length-1];
      const date = addDays(TODAY, -(ri(45, 120)));
      const ts = `${date} ${String(ri(8,17)).padStart(2,'0')}:${String(ri(0,59)).padStart(2,'0')}:${String(ri(0,59)).padStart(2,'0')}`;
      archivePool.push({
        id:'', ts, date, time:tsTime(ts), user:user.name, username:user.username, role:user.role,
        userId:user.id, action:tpl.action, type:tpl.type, module:tpl.module,
        record:recordFor(tpl, ti*3 + i), outcome:tpl.outcome, severity:tpl.sev,
        desc:tpl.desc, changes:tpl.changes ? tpl.changes.map(c=>[c[0], c[1], c[2]]) : null,
        txn:txnFor(tpl, i), corr:'CRQ-' + String(100000 + (ti*97 + i*13) % 899999),
        ip:user.ip, device:user.device, b:Object.assign({}, tpl.buckets), archived:true
      });
    }
  });
  archivePool.sort((a,b)=> a.ts < b.ts ? 1 : -1);
  archivePool.forEach((e,i)=>{
    e.id = 'AUD-2026-' + String(idSeq - 0).padStart(6,'0');
    e.archiveId = 'ARC-2026-' + String(archivePool.length - i).padStart(5,'0');
    e.block = 'BLK-A' + String(Math.floor(i/25) + 1).padStart(2,'0');
    e.hash = hashOf((e.archiveId||'') + e.ts + e.user + e.action);
    ARCHIVE.push(e);
  });
  ARCHIVE.forEach((e,i)=>{ e.id = 'AUD-2026-' + String(idSeq - 1 - i).padStart(6,'0'); });
}

/* ===================== derived views ===================== */
const isToday = e => e.date === TODAY;
const isSecurity = e => e.severity === 'Security' || e.b.sec || e.severity === 'Critical' && e.module === 'Authentication';
const isFinancial = e => ['Repayments','Disbursements','Financial'].includes(e.module) ||
  (e.b.fin && ['amount','rate','fee','recon','correction','duplicate','ref','auth'].some(k=>e.b.fin === k));
const isFailed = e => e.outcome === 'Failed';
const isCritical = e => e.severity === 'Critical';
const sevClass = s => s === 'Critical' ? 'sev-crit' : s === 'Security' ? 'sev-sec' : s === 'Warning' ? 'sev-warn' : 'sev-info';
const outcomeTone = o => o === 'Success' ? 'b-ok' : o === 'Failed' ? 'b-rej' : o === 'Denied' ? 'b-rej' : 'b-await';
const evIcon = e => e.outcome === 'Failed' || e.outcome === 'Denied' ? 'fail'
  : e.outcome === 'Warning' ? 'warn' : e.severity === 'Security' ? 'warn' : 'ok';
const byId = id => EVENTS.find(e=>e.id === id) || ARCHIVE.find(e=>e.id === id);
const ranges = { today:0, '7':7, '30':30, all:9999 };
const inRange = (e, key) => { const d = ranges[key]; return d === undefined ? true : daysBetween(e.date, TODAY) <= (key === 'today' ? 0 : d); };

function moduleCounts(list){
  const m = {};
  list.forEach(e=>{ m[e.module] = (m[e.module]||0) + 1; });
  return Object.entries(m).sort((a,b)=> b[1]-a[1]);
}

/* ===================== charts ===================== */
function barSvg(groups, opts={}){
  const w = 640, h = opts.height || 180, pad = {l:26, r:8, t:10, b:22};
  const max = Math.max(1, ...groups.map(g=>g.values.reduce((a,b)=>a+b,0)));
  const innerW = w - pad.l - pad.r, innerH = h - pad.t - pad.b;
  const bw = innerW / groups.length;
  let bars = '';
  groups.forEach((g, gi)=>{
    const x = pad.l + gi*bw + bw*0.18;
    const width = bw*0.64;
    let acc = 0;
    g.values.forEach((v, vi)=>{
      if(!v) return;
      const bh = (v/max)*innerH;
      const y = pad.t + innerH - acc - bh;
      bars += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${width.toFixed(1)}" height="${bh.toFixed(1)}" rx="2" fill="${g.colors[vi]}"></rect>`;
      acc += bh;
    });
    bars += `<text x="${(pad.l + gi*bw + bw/2).toFixed(1)}" y="${h-7}" font-size="8.5" fill="#8A90A0" text-anchor="middle">${g.label}</text>`;
  });
  const gridLines = [0,.25,.5,.75,1].map(f=>{
    const y = pad.t + innerH*(1-f);
    return `<line x1="${pad.l}" y1="${y.toFixed(1)}" x2="${w-pad.r}" y2="${y.toFixed(1)}" stroke="#F0F1F5"></line>
      <text x="${pad.l-4}" y="${(y+3).toFixed(1)}" font-size="7.5" fill="#A6ACB9" text-anchor="end">${Math.round(max*f)}</text>`;
  }).join('');
  return `<svg viewBox="0 0 ${w} ${h}" role="img">${gridLines}${bars}</svg>`;
}

/* ===================== 1 · OVERVIEW ===================== */
const OV = {range:'30'};
const GOLD = '#C9A227', RED = '#D93F3F', AMBER = '#B98A1F';

function renderBand(){
  const today = EVENTS.filter(isToday).length;
  el('bandTotal').textContent = nf(EVENTS.length);
  el('bandToday').textContent = nf(today);
  el('bandSecurity').textContent = nf(EVENTS.filter(e=>e.severity === 'Security' || e.severity === 'Critical').length);
  el('bandCritical').textContent = nf(EVENTS.filter(isCritical).length);
  el('bandIntegrity').textContent = INTEGRITY.ok ? 'Verified' : 'Check';
}

function rangeEvents(){ return EVENTS.filter(e=>inRange(e, OV.range)); }

function renderOverview(){
  const list = rangeEvents();
  const today = EVENTS.filter(isToday);
  const staffEvents = list.filter(e=>e.role !== 'Administrator' && e.role !== 'System');
  const adminEvents = list.filter(e=>e.role === 'Administrator');
  const finEvents = list.filter(isFinancial);
  const secEvents = list.filter(isSecurity);
  const failed = list.filter(e=>e.type === 'Login' && e.outcome === 'Failed');
  const permEvents = list.filter(e=>e.b.perm);
  const critical = list.filter(isCritical);
  const alertsOpen = ALERTS.filter(a=>a.status === 'Open' || a.status === 'Investigating').length;

  const tiles = [
    {l:'Total audit events', v:nf(EVENTS.length), s:`${nf(list.length)} in the selected period`, k:'gold', p:100},
    {l:"Today's activities", v:nf(today.length), s:`${today.filter(e=>e.outcome === 'Success').length} succeeded · ${today.filter(e=>e.outcome !== 'Success').length} otherwise`, k:'', p:100},
    {l:'Staff activities', v:nf(staffEvents.length), s:'Non-administrator users', k:'', p:pct(staffEvents.length, list.length)},
    {l:'Administrator activities', v:nf(adminEvents.length), s:'Privileged accounts', k:'blue', p:pct(adminEvents.length, list.length)},
    {l:'Financial transaction events', v:nf(finEvents.length), s:'Money moved or corrected', k:'', p:pct(finEvents.length, list.length)},
    {l:'Security events', v:nf(secEvents.length), s:`${failed.length} failed logins`, k:'red', p:pct(secEvents.length, list.length)},
    {l:'Failed login attempts', v:nf(failed.length), s:`${EVENTS.filter(e=>e.type === 'Lockout').length} lockouts on record`, k:'', p:pct(failed.length, list.length)},
    {l:'Permission changes', v:nf(permEvents.length), s:'Grants, revocations, role moves', k:'', p:pct(permEvents.length, list.length)},
    {l:'Critical system events', v:nf(critical.length), s:`${critical.filter(e=>e.outcome !== 'Success').length} unresolved failures`, k:'red', p:pct(critical.length, list.length)},
    {l:'Open security alerts', v:nf(alertsOpen), s:'Awaiting assignment or resolution', k: alertsOpen ? 'red' : '', p:100}
  ];
  el('ovTiles').innerHTML = tiles.map(t=>`
    <div class="kpi ${t.k||''}">
      <div class="kl">${t.l}</div>
      <div class="kv">${t.v}</div>
      <div class="ks">${t.s}</div>
      <div class="kbar"><i style="width:${clamp(t.p,0,100)}%"></i></div>
    </div>`).join('');

  /* events by day — last 8 days */
  const days = [];
  for(let i=7;i>=0;i--) days.push(addDays(TODAY, -i));
  const groups = days.map(d=>{
    const rows = EVENTS.filter(e=>e.date === d);
    return {label: fmtShort(d), values:[
      rows.filter(e=>e.outcome === 'Success').length,
      rows.filter(e=>e.outcome === 'Failed').length,
      rows.filter(e=>e.outcome === 'Denied' || e.outcome === 'Warning').length
    ], colors:[GOLD, RED, AMBER]};
  });
  el('ovTrend').innerHTML = barSvg(groups, {height:186});
  el('ovTrendPill').textContent = nf(sum(groups, g=>g.values.reduce((a,b)=>a+b,0))) + ' events';

  /* by module */
  const mods = moduleCounts(list).slice(0, 8);
  const maxMod = Math.max(1, ...mods.map(m=>m[1]));
  el('ovByModule').innerHTML = mods.map(([m,c])=>`
    <div class="lrow" style="gap:8px">
      <div style="flex:1;min-width:0">
        <div style="display:flex;justify-content:space-between;gap:8px">
          <span class="lt">${m}</span><span class="dim">${nf(c)}</span></div>
        <div class="meter" style="margin-top:4px"><i style="width:${Math.round(c/maxMod*100)}%"></i></div>
      </div>
    </div>`).join('') || '<div class="empty">No events in this period.</div>';

  el('ovRecent').innerHTML = EVENTS.slice(0, 12).map(e=>eventRow(e)).join('');
  bindEventRows('ovRecent');

  const attention = [];
  ALERTS.filter(a=>a.status !== 'Resolved' && a.status !== 'Dismissed').slice(0,3).forEach(a=>{
    attention.push({t:a.title, s:`${a.severity} · ${a.status} · ${a.owner}`, b:'Open', act:()=>{ ALA.sel = a.id; goto('s16'); renderAlerts(); }});
  });
  const failedToday = today.filter(e=>e.outcome === 'Failed');
  if(failedToday.length) attention.push({t:`${failedToday.length} failed events today`, s:'Logins, payouts and integrations', b:'Review', act:()=>{ OV.range='today'; el('ovRange').value='today'; renderOverview(); goto('s2'); }});
  EVENTS.filter(isCritical).slice(0,2).forEach(e=>{
    attention.push({t:e.action, s:`${e.module} · ${fmtShort(e.date)} · ${e.user}`, b:'Detail', act:()=>openEvent(e.id)});
  });
  if(!attention.length) attention.push({t:'Nothing outstanding', s:'No open alerts or failures in this period', b:'', act:null});
  el('ovAttentionPill').textContent = attention.length;
  el('ovAttention').innerHTML = attention.map((a,i)=>`
    <div class="lrow"><div class="lic" style="background:${i===0?'var(--red-soft)':'var(--gold-soft)'};
      color:${i===0?'#B32C2C':'var(--gold-dark)'};font-size:9px">${i+1}</div>
      <div><div class="lt">${esc(a.t)}</div><div class="ls">${esc(a.s)}</div></div>
      <div class="lr">${a.b ? `<button class="btn btn-ghost" data-at="${i}">${a.b}</button>` : ''}</div></div>`).join('');
  el('ovAttention').querySelectorAll('[data-at]').forEach(b=>{
    b.onclick = ()=> attention[Number(b.dataset.at)].act && attention[Number(b.dataset.at)].act();
  });

  /* most active users */
  const users = {};
  list.forEach(e=>{ users[e.user] = (users[e.user]||0) + 1; });
  const top = Object.entries(users).sort((a,b)=>b[1]-a[1]).slice(0,8);
  const maxU = Math.max(1, ...top.map(t=>t[1]));
  el('ovUsers').innerHTML = top.map(([n,c])=>{
    const u = userByName(n);
    return `<div class="lrow">
      <div class="lic" style="background:var(--gold-soft);color:var(--gold-dark);font-size:9px">${initials(n)}</div>
      <div style="flex:1">
        <div style="display:flex;justify-content:space-between;gap:8px">
          <span class="lt">${esc(n)}</span><span class="dim">${nf(c)}</span></div>
        <div class="ls">${u.role} · ${u.dept}</div>
        <div class="meter" style="margin-top:4px"><i style="width:${Math.round(c/maxU*100)}%"></i></div>
      </div></div>`;
  }).join('') || '<div class="empty">No activity.</div>';

  /* today by hour */
  const hours = [];
  for(let h=7;h<=17;h++) hours.push(h);
  const hourGroups = hours.map(h=>({
    label: String(h).padStart(2,'0'),
    values:[today.filter(e=>Number(e.time.slice(0,2)) === h).length],
    colors:[GOLD]
  }));
  el('ovHour').innerHTML = barSvg(hourGroups, {height:130});
  const maxHour = Math.max(1, ...hourGroups.map(g=>g.values[0]));
  el('ovHeat').innerHTML = hours.map(h=>{
    const n = hourGroups.find(g=>g.label === String(h).padStart(2,'0')).values[0];
    const a = n / maxHour;
    const bg = n === 0 ? '#F1F2F6' : a > .75 ? '#C9A227' : a > .4 ? '#E8C860' : '#FBF3D8';
    return `<div class="heatcell" style="background:${bg}" title="${String(h).padStart(2,'0')}:00 · ${n} events"></div>`;
  }).join('');
  el('ovHourPill').textContent = today.length + ' today';
}

/* shared row renderer for event lists */
function eventRow(e, opts={}){
  return `<div class="evt" data-ev="${e.id}" style="cursor:pointer">
    <div class="eic ${evIcon(e)}">${e.outcome === 'Failed' ? '✕' : e.outcome === 'Denied' ? '⛔' : e.outcome === 'Warning' ? '!' : '✓'}</div>
    <div class="eb">
      <div class="et">${esc(e.action)} ${opts.showUser === false ? '' : '<span style="font-weight:500;color:var(--muted)">· ' + esc(e.user) + '</span>'}</div>
      <div class="es">${esc(e.desc)}</div>
      <div class="em">${fmtTs(e.ts)} · ${e.module} · ${e.record} · ${e.id}</div>
    </div>
    <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px">
      <span class="sev ${sevClass(e.severity)}">${e.severity}</span>
      <span class="chipmod">${e.type}</span>
    </div>
  </div>`;
}
function bindEventRows(containerId){
  const box = el(containerId);
  if(!box) return;
  box.querySelectorAll('[data-ev]').forEach(r=>{
    r.onclick = ()=>openEvent(r.dataset.ev);
  });
}

/* ===================== 2 · ALL LOGS ===================== */
const LG = {q:'', field:'any', from:'2026-10-24', to:TODAY, role:'', module:'', type:'', outcome:'', severity:'', page:1, per:15};

function logFiltered(){
  const q = LG.q.trim().toLowerCase();
  return EVENTS.filter(e=>{
    if(LG.from && e.date < LG.from) return false;
    if(LG.to && e.date > LG.to) return false;
    if(LG.role && e.role !== LG.role) return false;
    if(LG.module && e.module !== LG.module) return false;
    if(LG.type && e.type !== LG.type) return false;
    if(LG.outcome && e.outcome !== LG.outcome) return false;
    if(LG.severity && e.severity !== LG.severity) return false;
    if(!q) return true;
    const hay = {
      any: [e.id, e.user, e.username, e.action, e.record, e.module, e.type, e.desc, e.txn, e.corr, e.role, e.date].join(' '),
      user: e.user, username: e.username, action: e.action, record: e.record, id: e.id
    }[LG.field] || '';
    return String(hay).toLowerCase().includes(q);
  });
}

function renderAllLogs(){
  const rows = logFiltered();
  const pages = Math.max(1, Math.ceil(rows.length/LG.per));
  if(LG.page > pages) LG.page = pages;
  const slice = rows.slice((LG.page-1)*LG.per, LG.page*LG.per);
  el('lgCount').textContent = nf(rows.length) + ' events';
  el('lgBody').innerHTML = slice.map(e=>`
    <tr class="rowlink" data-ev="${e.id}">
      <td class="mono" style="font-size:9.5px;white-space:nowrap">${e.id}</td>
      <td style="white-space:nowrap">${fmtShort(e.date)} · ${e.time.slice(0,5)}</td>
      <td><div style="font-weight:700">${esc(e.user)}</div>
        <div style="font-size:9px;color:var(--muted)">${e.username}</div></td>
      <td style="white-space:nowrap">${e.role}</td>
      <td>${esc(e.action)}</td>
      <td><span class="chipmod">${e.module}</span></td>
      <td class="mono" style="font-size:9.5px">${e.record}</td>
      <td><span class="badge ${outcomeTone(e.outcome)}">${e.outcome}</span></td>
      <td><span class="sev ${sevClass(e.severity)}">${e.severity}</span></td>
      <td style="text-align:right"><button class="btn btn-ghost" data-ev-btn="${e.id}">Open</button></td>
    </tr>`).join('') || '<tr><td colspan="10" class="empty">No events match these filters.</td></tr>';
  el('lgBody').querySelectorAll('[data-ev]').forEach(r=>{
    r.onclick = ()=>openEvent(r.dataset.ev);
  });
  el('lgPager').innerHTML = `
    <span>Showing ${rows.length ? (LG.page-1)*LG.per+1 : 0}–${Math.min(LG.page*LG.per, rows.length)} of ${nf(rows.length)}</span>
    <button id="lgPrev" ${LG.page===1?'disabled':''}>‹ Prev</button>
    <button id="lgNext" ${LG.page===pages?'disabled':''}>Next ›</button>`;
  if(el('lgPrev')) el('lgPrev').onclick = ()=>{ LG.page--; renderAllLogs(); };
  if(el('lgNext')) el('lgNext').onclick = ()=>{ LG.page++; renderAllLogs(); };
}

function logRowsForExport(){
  return logFiltered().map(e=>[e.id, e.ts, e.user, e.username, e.role, e.action, e.type, e.module,
    e.record, e.outcome, e.severity, e.ip, e.desc]);
}

function wireAllLogs(){
  el('lgSearch').addEventListener('input', ()=>{ LG.q = el('lgSearch').value; LG.page = 1; renderAllLogs(); });
  el('lgSearchBy').addEventListener('change', ()=>{ LG.field = el('lgSearchBy').value; renderAllLogs(); });
  el('lgFrom').addEventListener('change', ()=>{ LG.from = el('lgFrom').value; LG.page = 1; renderAllLogs(); });
  el('lgTo').addEventListener('change', ()=>{ LG.to = el('lgTo').value; LG.page = 1; renderAllLogs(); });
  el('lgRole').addEventListener('change', ()=>{ LG.role = el('lgRole').value; LG.page = 1; renderAllLogs(); });
  el('lgModule').addEventListener('change', ()=>{ LG.module = el('lgModule').value; LG.page = 1; renderAllLogs(); });
  el('lgType').addEventListener('change', ()=>{ LG.type = el('lgType').value; LG.page = 1; renderAllLogs(); });
  el('lgOutcome').addEventListener('change', ()=>{ LG.outcome = el('lgOutcome').value; LG.page = 1; renderAllLogs(); });
  el('lgSeverity').addEventListener('change', ()=>{ LG.severity = el('lgSeverity').value; LG.page = 1; renderAllLogs(); });
  el('lgReset').onclick = ()=>{
    Object.assign(LG, {q:'', field:'any', from:'', to:'', role:'', module:'', type:'', outcome:'', severity:'', page:1});
    el('lgSearch').value = ''; el('lgSearchBy').value = 'any';
    el('lgFrom').value = ''; el('lgTo').value = '';
    ['lgRole','lgModule','lgType','lgOutcome','lgSeverity'].forEach(id=>{ el(id).value = ''; });
    renderAllLogs(); toast('Filters cleared.', 'info');
  };
  el('lgPrint').onclick = ()=>printHtml('Audit log register', `<div class="inline-note">${logFiltered().length} events · ${LG.from || 'beginning'} to ${LG.to || TODAY}</div>
    <div class="tblwrap" style="max-height:none"><table class="tbl2 dense"><thead><tr><th>Event</th><th>When</th><th>User</th><th>Action</th><th>Record</th><th>Outcome</th></tr></thead>
    <tbody>${logFiltered().slice(0,80).map(e=>`<tr><td>${e.id}</td><td>${fmtShort(e.date)} ${e.time.slice(0,5)}</td><td>${esc(e.user)}</td><td>${esc(e.action)}</td><td>${e.record}</td><td>${e.outcome}</td></tr>`).join('')}</tbody></table></div>`);
  el('lgExport').onclick = ()=>exportLog('All audit logs');
}

function fillLogSelects(){
  const roles = [...new Set(EVENTS.map(e=>e.role))].sort();
  el('lgRole').innerHTML = '<option value="">All roles</option>' + roles.map(r=>`<option>${esc(r)}</option>`).join('');
  const mods = [...new Set(EVENTS.map(e=>e.module))].sort();
  el('lgModule').innerHTML = '<option value="">All modules</option>' + mods.map(m=>`<option>${esc(m)}</option>`).join('');
  const types = [...new Set(EVENTS.map(e=>e.type))].sort();
  el('lgType').innerHTML = '<option value="">All action types</option>' + types.map(m=>`<option>${esc(m)}</option>`).join('');
  const adv = el('advModule');
  if(adv) adv.innerHTML = '<option value="">Any module</option>' + mods.map(m=>`<option>${esc(m)}</option>`).join('');
  const au = el('advUser');
  if(au) au.innerHTML = '<option value="">Any user</option>' + USERS.map(u=>`<option value="${u.username}">${esc(u.name)} · ${u.role}</option>`).join('');
  const invOwner = el('invOwner');
  if(invOwner) invOwner.innerHTML = USERS.filter(u=>u.role !== 'System').map(u=>`<option>${esc(u.name)}</option>`).join('');
  const stUser = el('stUser');
  if(stUser) stUser.innerHTML = '<option value="">All staff</option>' +
    USERS.filter(u=>u.role !== 'System').map(u=>`<option>${esc(u.name)}</option>`).join('');
  const evPick = el('evPick');
  if(evPick) evPick.innerHTML = EVENTS.slice(0, 40).map(e=>`<option value="${e.id}">${e.id} · ${esc(e.action)} · ${esc(e.user)}</option>`).join('');
  const dbSel = el('dbSel');
  if(dbSel) dbSel.innerHTML = [...new Set(EVENTS.filter(e=>e.module === 'Disbursements').map(e=>e.record))].sort()
    .map(r=>`<option>${r}</option>`).join('');
}

/* build the ledger once everything is declared */
buildEvents();

</script>
