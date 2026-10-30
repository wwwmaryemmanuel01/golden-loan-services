<script>
/* ============================================================
   GOLDEN FINANCIAL SERVICES · NOTIFICATIONS MODULE
   ============================================================ */
const el = id => document.getElementById(id);
const nf = n => Math.round(n).toLocaleString('en-US');
const mk = n => 'MK ' + nf(n);
const initials = s => String(s).split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase();
const stamp = () => new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});

function toast(msg, type='ok'){
  const t=document.createElement('div');
  t.className='toast '+type;
  t.innerHTML=`<span>${type==='err'?'⚠':type==='info'?'ℹ':'✓'}</span><div>${msg}</div>`;
  el('toasts').appendChild(t);
  setTimeout(()=>{t.style.opacity='0';t.style.transform='translateX(16px)';t.style.transition='.25s';},2600);
  setTimeout(()=>t.remove(),3000);
}

const CH_COLORS = {'In-App':'#2F6FED','SMS':'#C9A227','Email':'#1E9E6A','Customer Portal':'#7C5CF0','Staff Dashboard':'#E08C1E'};
const CAT_COLORS = {Customer:'#2F6FED',Staff:'#7C5CF0',Loan:'#C9A227',Repayment:'#1E9E6A',Disbursement:'#E08C1E',System:'#D93F3F'};
const CAT_ICON = {Customer:'👤',Staff:'👔',Loan:'📄',Repayment:'💳',Disbursement:'💸',System:'🛡'};

function statusChip(n){
  if(n.archived) return '<span class="chip st-canc">Archived</span>';
  if(n.status==='Failed') return '<span class="chip st-fail">Failed</span>';
  if(n.status==='Pending') return '<span class="chip st-await">Pending</span>';
  if(n.status==='Queued') return '<span class="chip st-proc">Queued</span>';
  if(n.status==='Sent') return '<span class="chip st-auth">Sent</span>';
  return n.read ? '<span class="chip st-ok">Read</span>' : '<span class="chip st-conf">Unread</span>';
}

/* ============================================================
   DATA
   ============================================================ */
const TYPES = {
  Customer: [
    ['Loan Application Received','Your application LN-2026-#### was received'],
    ['Application Approved','Congratulations — your loan is approved'],
    ['Application Rejected','Update on your loan application'],
    ['Additional Documents Required','We need one more document'],
    ['Loan Disbursement Confirmation','Funds have been released'],
    ['Repayment Due Reminder','Your instalment is due in 3 days'],
    ['Overdue Payment Alert','Your account is past due'],
    ['Payment Received Confirmation','We have received your payment'],
    ['Loan Settlement Confirmation','Your loan is fully settled'],
    ['Account Registration Confirmation','Welcome to Golden Financial Services'],
    ['Password Reset Notification','Reset your portal password'],
    ['Account Security Alert','New sign-in to your account']
  ],
  Staff: [
    ['New Loan Application Alert','A new application needs screening'],
    ['Applications Awaiting Review','3 applications in your queue'],
    ['Loan Approval Request','Credit committee decision required'],
    ['Disbursement Authorization Request','Release awaiting your approval'],
    ['Repayment Verification Request','Confirm a posted repayment'],
    ['Overdue Account Alert','5 accounts moved to arrears'],
    ['Assigned Collection Task','New follow-up assigned'],
    ['Customer Support Request','Customer raised a query'],
    ['System Announcement','Internal notice for all staff'],
    ['Staff Account Security Alert','Unusual sign-in detected']
  ],
  Loan: [
    ['New Loan Application','Application submitted at branch'],
    ['Application Pending Review','Awaiting first review'],
    ['Incomplete Application','Missing mandatory fields'],
    ['Awaiting Documents','Documents outstanding'],
    ['Application Approved','Approved by credit committee'],
    ['Application Rejected','Rejected — affordability'],
    ['Approval Deadline Reminder','Decision due in 24 hours'],
    ['Disbursement Pending','Approved but not released'],
    ['Loan Status Change','Status moved to active'],
    ['Loan Maturity Reminder','Final instalment approaching']
  ],
  Repayment: [
    ['Upcoming Repayment Reminder','Instalment due in 3 days'],
    ['Payment Due Today','Instalment due today'],
    ['Missed Payment Alert','No payment received'],
    ['Overdue Repayment Notification','Account 30+ days past due'],
    ['Partial Payment Alert','Instalment partially paid'],
    ['Payment Verification Request','Confirm the posted amount'],
    ['Unallocated Payment Alert','Receipt not matched to a loan'],
    ['Failed Payment Notification','Direct debit declined'],
    ['Collection Follow-Up Reminder','Field visit scheduled'],
    ['Promised Payment Reminder','Promised date is tomorrow'],
    ['Loan Settlement Notification','Loan closed in full']
  ],
  Disbursement: [
    ['Disbursement Awaiting Authorization','Second-line approval required'],
    ['Disbursement Approved','Cleared for release'],
    ['Disbursement Processing','Funds with the payment channel'],
    ['Successful Disbursement','Customer confirmed receipt'],
    ['Failed Disbursement','Release failed at the bank'],
    ['Disbursement Confirmation Required','Verify the payment'],
    ['Missing Disbursement Information','Recipient details incomplete'],
    ['Disbursement Reconciliation Alert','Variance detected'],
    ['Disbursement Cancellation','Release cancelled']
  ],
  System: [
    ['Failed Login Attempts','5 failed sign-ins on one account'],
    ['Suspicious Login Activity','New device or location'],
    ['Unauthorized Access Attempt','Role-restricted page requested'],
    ['Account Lockout Alert','Account locked after retries'],
    ['Staff Permission Change','Role updated'],
    ['Administrator Activity Alert','Sensitive action performed'],
    ['Database Connection Problem','Connection pool exhausted'],
    ['Supabase Connection Status','Realtime channel restored'],
    ['System Error','Unhandled exception in posting service'],
    ['Backup Status Alert','Nightly backup completed'],
    ['Integration Failure Alert','Mobile money callback timeout'],
    ['Maintenance Notification','Planned downtime on 31 Oct']
  ]
};

const RECIPIENTS = {
  Customer: ['Thokozani Banda','Grace Mvula','Peter Kachale','Memory Nkhoma','Yamikani Gondwe',
    'Esther Kamanga','Isaac Mponda','Fatima Salimu','Rose Chikopa','Kondwani Msiska',
    'Blessings Tembo','Chimwemwe Zulu','Mercy Chatsika','Alfred Jimu','Sarah Kaunda'],
  Staff: ['Chikondi Mwale','Thoko Phiri','Linda Chirwa','Samuel Zimba','Agnes Mbewe',
    'Grace Mtemang\'ombe','Peter Kamoto','Joseph Mwale'],
  Group: ['All active borrowers','Customers in arrears','Customers with loans due this week',
    'New customers (last 30 days)','All staff — Lilongwe branch','Loan officers','Collections team']
};

let NTF = [];
const S = {seq: 10331, audit: [], selected: new Set(), page: 1, size: 9, audience:'Customer'};

function addN(o){
  const base = {archived:false, read:true, priority:'Normal', attempts:1, provider:'', template:'', sender:'System',
    readCount:0, audience:0};
  NTF.unshift(Object.assign(base, o));
  return NTF[0];
}

/* seed notifications */
const seed = [
  ['Customer','Loan Disbursement Confirmation','Thokozani Banda','SMS','Delivered',false,'High','09:42',
   'Funds released','MK 2,412,500 has been sent to your Airtel Money wallet for loan LN-2026-1842.','AM-99213'],
  ['Staff','Disbursement Authorization Request','Chikondi Mwale','Staff Dashboard','Delivered',false,'High','09:41',
   'Release awaiting approval','DIS-2026-1041 for MK 868,500 is awaiting your authorization.',''],
  ['Customer','Repayment Due Reminder','Grace Mvula','SMS','Delivered',true,'Normal','09:15',
   'Instalment due in 3 days','Your instalment of MK 106,400 is due on 2 Nov 2026 for loan LN-2026-1839.','AM-99188'],
  ['Staff','Overdue Account Alert','Samuel Zimba','In-App','Delivered',false,'Normal','09:02',
   '5 accounts moved to arrears','Five accounts in your portfolio crossed 30 days past due overnight.',''],
  ['System','Backup Status Alert','Administrator','Email','Delivered',true,'Low','08:05',
   'Nightly backup completed','Database backup completed successfully at 02:00 CAT. 4.2 GB archived.','SG-77120'],
  ['Customer','Payment Received Confirmation','Rose Chikopa','SMS','Delivered',true,'Normal','08:44',
   'Payment received','We have received MK 320,000 towards loan LN-2026-1812. Thank you.','AM-99140'],
  ['Repayment','Overdue Repayment Notification','Blessings Tembo','SMS','Failed',false,'High','08:22',
   'Account past due','Your account is 3 days past due. Please settle MK 240,000 to avoid penalties.','AM-ERR-7741'],
  ['Loan','Application Approved','Memory Nkhoma','In-App','Delivered',true,'Normal','08:10',
   'Application approved','Loan application LN-2026-1831 has been approved for MK 450,000.',''],
  ['Customer','Application Rejected','Daniel Kaunda','SMS','Delivered',true,'Normal','07:58',
   'Update on your application','We regret that LN-2026-1834 was not approved. Call 111 to discuss options.','AM-99077'],
  ['System','Failed Login Attempts','Administrator','Email','Delivered',false,'High','07:35',
   '5 failed sign-in attempts','Account l.chirwa@goldenfs.mw has 5 failed sign-in attempts from 41.87.112.8.','SG-77088'],
  ['Staff','Applications Awaiting Review','Thoko Phiri','Staff Dashboard','Delivered',true,'Normal','07:20',
   '3 applications in your queue','You have 3 applications awaiting review, oldest submitted 27 Oct.',''],
  ['Disbursement','Successful Disbursement','Kondwani Msiska','SMS','Delivered',true,'Normal','29 Oct 16:40',
   'Disbursement confirmed','MK 868,500 has been transferred to your bank account for loan LN-2026-1810.','FT2610297712'],
  ['Customer','Additional Documents Required','Peter Kachale','Email','Delivered',false,'High','29 Oct 15:12',
   'One document needed','Please upload a recent payslip to complete your loan application.','EM-44821'],
  ['Repayment','Collection Follow-Up Reminder','Samuel Zimba','In-App','Delivered',true,'Normal','29 Oct 14:02',
   'Field visit scheduled','Visit for Mercy Chatsika (42 days overdue) scheduled for 30 Oct, 10:00.',''],
  ['Loan','Disbursement Pending','Chikondi Mwale','In-App','Delivered',true,'Normal','29 Oct 11:30',
   'Approved loan not released','27 approved loans are awaiting disbursement.',''],
  ['Customer','Account Registration Confirmation','Sarah Kaunda','SMS','Delivered',true,'Normal','29 Oct 09:05',
   'Welcome to Golden FS','Your customer account CUS-003501 is active. Dial *247# to manage your loan.','AM-98703'],
  ['System','Integration Failure Alert','Administrator','Email','Delivered',false,'High','29 Oct 08:15',
   'Mobile money callback timeout','Airtel Money callback timed out 3 times between 08:02 and 08:14.','SG-77041'],
  ['Staff','Staff Account Security Alert','Linda Chirwa','Email','Delivered',true,'High','28 Oct 17:44',
   'New sign-in detected','A new sign-in to your account was detected from Android · Blantyre.','EM-44790'],
  ['Customer','Loan Settlement Confirmation','Alfred Jimu','SMS','Delivered',true,'Normal','28 Oct 16:10',
   'Loan fully settled','Congratulations — loan LN-2025-0541 is fully repaid and closed.','AM-98552'],
  ['Repayment','Partial Payment Alert','Esther Kamanga','In-App','Delivered',true,'Normal','28 Oct 13:22',
   'Partial payment received','MK 96,000 of the MK 150,000 instalment was received. Balance carried forward.',''],
  ['Disbursement','Disbursement Reconciliation Alert','Chikondi Mwale','Staff Dashboard','Delivered',true,'High','28 Oct 11:05',
   'Reconciliation variance','Airtel Money wallet debits are MK 150,000 lower than authorized releases.',''],
  ['Customer','Account Security Alert','Fatima Salimu','SMS','Delivered',true,'High','28 Oct 09:30',
   'New sign-in to your account','A new sign-in to your customer portal was detected. If this was not you, call 111.','AM-98440'],
  ['Loan','Loan Maturity Reminder','Isaac Mponda','SMS','Delivered',true,'Normal','27 Oct 15:00',
   'Final instalment approaching','Your final instalment of MK 412,000 is due on 30 Nov 2026.','AM-98311'],
  ['Staff','System Announcement','All staff','Staff Dashboard','Delivered',true,'Normal','27 Oct 10:00',
   'Month-end close on 31 Oct','The system will be read-only from 18:00 on 31 October for month-end close.',''],
  ['System','Supabase Connection Status','Administrator','In-App','Delivered',true,'Low','27 Oct 07:12',
   'Realtime channel restored','Supabase realtime connectivity was restored after a 42 second interruption.',''],
  ['Repayment','Failed Payment Notification','Blessings Tembo','SMS','Failed',true,'High','26 Oct 17:40',
   'Payment could not be collected','Your instalment could not be collected. Please ensure your wallet is funded.','AM-ERR-7702'],
  ['Customer','Password Reset Notification','Memory Nkhoma','Email','Delivered',true,'High','26 Oct 12:18',
   'Reset your password','Use the link to reset your portal password. The link expires in 30 minutes.','EM-44612'],
  ['Loan','Approval Deadline Reminder','Credit Committee','Staff Dashboard','Delivered',true,'High','26 Oct 09:00',
   'Decision due in 24 hours','3 applications reach their approval deadline tomorrow.',''],
  ['Disbursement','Disbursement Cancellation','Tadala Nkhoma','SMS','Delivered',true,'Normal','25 Oct 14:30',
   'Release cancelled','Your disbursement was cancelled. Please contact your loan officer.','AM-98022'],
  ['System','Suspicious Login Activity','Administrator','Email','Delivered',false,'High','25 Oct 07:58',
   'Suspicious sign-in blocked','Sign-in from an unrecognised device was blocked for s.zimba@goldenfs.mw.','SG-76980'],
  ['Repayment','Unallocated Payment Alert','Grace Mtemang\'ombe','Staff Dashboard','Delivered',true,'Normal','24 Oct 16:20',
   'Receipt not matched','Receipt RCP-99388 (MK 512,000) could not be matched to a loan account.',''],
  ['Customer','Repayment Due Reminder','Chimwemwe Zulu','SMS','Pending',true,'Normal','24 Oct 08:00',
   'Instalment due in 3 days','Your instalment of MK 318,000 is due on 27 Oct 2026.',''],
  ['Staff','Customer Support Request','Agnes Mbewe','In-App','Queued',true,'Normal','24 Oct 07:45',
   'New customer query','A customer raised a query about a missing repayment receipt.',''],
  ['Loan','Incomplete Application','Thoko Phiri','In-App','Delivered',true,'Normal','23 Oct 15:10',
   'Missing mandatory fields','Application LN-2026-1822 is missing employment details.',''],
  ['System','System Error','Administrator','Email','Delivered',true,'High','23 Oct 10:44',
   'Posting service exception','An unhandled exception occurred in the repayment posting service (3 occurrences).','SG-76820'],
  ['Disbursement','Failed Disbursement','Samuel Zimba','In-App','Delivered',true,'High','22 Oct 16:05',
   'Release failed at bank','DIS-2026-1022 failed: beneficiary account name mismatch.',''],
  ['Customer','Overdue Payment Alert','Isaac Mponda','SMS','Delivered',true,'High','22 Oct 09:15',
   'Account 95 days overdue','Your account is 95 days past due. Immediate settlement is required to avoid legal action.','AM-97811'],
  ['Staff','Assigned Collection Task','Agnes Mbewe','In-App','Delivered',true,'Normal','21 Oct 11:20',
   'New follow-up assigned','Account LN-2024-0761 assigned to you for recovery follow-up.',''],
  ['Repayment','Promised Payment Reminder','Samuel Zimba','In-App','Delivered',true,'Normal','21 Oct 08:30',
   'Promised date tomorrow','Mercy Chatsika promised payment tomorrow (22 Oct).',''],
  ['System','Maintenance Notification','All staff','Staff Dashboard','Delivered',true,'Normal','20 Oct 17:00',
   'Planned maintenance','The portal will be unavailable on 21 Oct from 22:00 to 23:00.','']
];

seed.forEach(([cat,type,recipient,channel,status,read,priority,when,subject,body,provider])=>{
  const created = when.includes('Oct')||when.includes('Nov') ? when : '30 Oct 2026 ' + when;
  addN({ref:'NTF-'+(++S.seq), cat, type, recipient, rtype: RECIPIENTS.Customer.includes(recipient) ? 'Customer'
    : RECIPIENTS.Staff.includes(recipient) || recipient==='All staff' || recipient==='Administrator' || recipient==='Credit Committee' ? 'Staff' : 'Group',
    channel, status, read, priority, created, subject, body, provider,
    sender: cat==='System' ? 'System' : 'Automation',
    attempts: status==='Failed' ? 3 : 1});
});

NTF.reverse();   /* newest first */

/* generated history — gives every alert type realistic monthly volume */
(function(){
  const days = [12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29];
  const chans = {Customer:['SMS','SMS','Email','In-App'], Staff:['Staff Dashboard','In-App','Email'],
    Loan:['SMS','In-App','Email'], Repayment:['SMS','SMS','In-App'], Disbursement:['SMS','Email','In-App'],
    System:['Email','Email','In-App']};
  const pool = c => c==='Staff' ? RECIPIENTS.Staff.concat(['All staff','Credit Committee'])
    : c==='System' ? ['Administrator','All staff'] : RECIPIENTS.Customer;
  const bodies = [
    'Reference %REF% · handled automatically by the notification engine.',
    'Sent to the recipient on file. Delivery confirmed by the provider.',
    'Logged in the notification register and retained for audit.',
    'Triggered by a workflow event in the %CAT% module.'
  ];
  const out = [];
  let k = 0;
  Object.entries(TYPES).forEach(([cat,list])=>{
    list.forEach(([type,desc])=>{
      const n = 2 + (k % 4);
      for(let i=0;i<n;i++){
        const day = days[(k*3 + i*5) % days.length];
        const hour = 8 + ((k + i*3) % 10), minute = (k*7 + i*13) % 60;
        const pl = pool(cat);
        const recipient = pl[(k + i*2) % pl.length];
        const channel = chans[cat][(k + i) % chans[cat].length];
        let status = 'Delivered', read = true, attempts = 1, provider = '';
        if((k+i) % 17 === 0){ status='Failed'; read=false; attempts=3; }
        else if((k+i) % 13 === 0){ status='Sent'; read=false; }
        else if((k+i) % 23 === 0){ status='Queued'; read=false; }
        else read = (k+i) % 5 !== 0;
        if(status==='Delivered' && channel==='SMS') provider='AM-'+(97000 + k*13 + i);
        if(status==='Delivered' && channel==='Email') provider='EM-'+(43000 + k*11 + i);
        const body = bodies[(k+i) % bodies.length].replace('%REF%','NTF-'+(S.seq+out.length+1)).replace('%CAT%',cat);
        out.push({ref:'NTF-'+(S.seq + out.length + 1), cat, type, recipient,
          rtype: cat==='Staff'||cat==='System' ? 'Staff' : 'Customer', channel, status, read,
          priority: (k+i)%11===0 ? 'High' : 'Normal', created: `${day} Oct 2026 ${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}`,
          subject: desc, body, provider, sender: cat==='System' ? 'System' : 'Automation',
          attempts, archived:false, template:'', readCount:0, audience:0});
      }
      k++;
    });
  });
  out.sort((x,y)=> key(y.created) - key(x.created));
  out.forEach(o=>NTF.push(o));
  S.seq += out.length;
  function key(c){
    const m = c.match(/(\d+) Oct 2026 (\d+):(\d+)/);
    if(!m) return 0;
    return (+m[1])*1440 + (+m[2])*60 + (+m[3]);
  }
})();

/* templates */
let TEMPLATES = [
  ['TPL-01','Customer Welcome','SMS','Customer',true,'Welcome to Golden Financial Services, {{first_name}}. Your customer number is {{customer_no}}. Dial *247# to get started.'],
  ['TPL-02','Loan Application Received','SMS','Loan',true,'Hello {{first_name}}, we received your loan application {{loan_no}} for MK {{amount}}. We will update you within 48 hours.'],
  ['TPL-03','Loan Approval','SMS','Loan',true,'Good news {{first_name}}! Your loan {{loan_no}} has been approved for MK {{amount}}. Visit your branch to sign the agreement.'],
  ['TPL-04','Loan Rejection','SMS','Loan',true,'Dear {{first_name}}, your application {{loan_no}} was not approved. Call 111 to speak to a loan officer about your options.'],
  ['TPL-05','Disbursement Confirmation','SMS','Disbursement',true,'{{first_name}}, MK {{net_amount}} has been sent to your {{channel}} for loan {{loan_no}}. Reference {{reference}}.'],
  ['TPL-06','Repayment Reminder','SMS','Repayment',true,'Reminder: your instalment of MK {{amount}} for loan {{loan_no}} is due on {{due_date}}. Pay via *247#.'],
  ['TPL-07','Overdue Payment','SMS','Repayment',true,'Dear {{first_name}}, your account is {{days}} days past due. Please settle MK {{amount}} to avoid penalties.'],
  ['TPL-08','Payment Receipt','SMS','Repayment',true,'Payment received: MK {{amount}} for loan {{loan_no}} on {{date}}. Thank you. Balance: MK {{balance}}.'],
  ['TPL-09','Password Reset','Email','Customer',true,'Hello {{first_name}}, use this link to reset your portal password: {{link}}. The link expires in 30 minutes.'],
  ['TPL-10','Staff Alert','In-App','Staff',true,'{{action_required}}: {{count}} item(s) require your attention. Open the admin portal to review.'],
  ['TPL-11','System Announcement','Email','System',true,'{{title}} — {{message}}. This is an automated service announcement from Golden Financial Services.']
];

/* channels */
const CHANNELS = [
  {name:'In-App', icon:'🔔', color:'#2F6FED', enabled:true, sent:2480, delivered:2452, failed:28, cost:'Free'},
  {name:'SMS', icon:'📱', color:'#C9A227', enabled:true, sent:2180, delivered:2088, failed:92, cost:'MK 47,960'},
  {name:'Email', icon:'✉️', color:'#1E9E6A', enabled:true, sent:1540, delivered:1512, failed:28, cost:'MK 6,160'},
  {name:'Customer Portal', icon:'🖥', color:'#7C5CF0', enabled:true, sent:820, delivered:816, failed:4, cost:'Free'},
  {name:'Staff Dashboard', icon:'💼', color:'#E08C1E', enabled:true, sent:420, delivered:416, failed:4, cost:'Free'}
];
/* category share of monthly volume (used by analytics) */
const CAT_SHARE = {Customer:.34, Staff:.20, Loan:.14, Repayment:.16, Disbursement:.09, System:.07};

/* automations */
let AUTOMATIONS = [
  ['Automatic repayment reminders','Daily · 08:00','31 Oct, 08:00',412,true],
  ['Upcoming due-date alerts','3 days before due','31 Oct, 08:00',286,true],
  ['Overdue payment alerts','Daily · 09:00','31 Oct, 09:00',164,true],
  ['Application follow-up reminders','Daily · 10:00','31 Oct, 10:00',88,true],
  ['Pending approval reminders','Every 2 hours','30 Oct, 12:00',134,true],
  ['Collection follow-up reminders','Weekdays · 11:00','30 Oct, 11:00',96,true],
  ['Weekly staff digest','Monday · 07:00','2 Nov, 07:00',24,true],
  ['Scheduled system announcements','Manual','—',12,false]
];

/* announcements */
let ANNOUNCEMENTS = [
  ['ANN-104','Month-end close on 31 October','All staff','System will be read-only from 18:00 for month-end close.', 'High','29 Oct 2026', 24, 24],
  ['ANN-103','New interest rate effective 1 November','All staff','Business Growth rate moves from 4.0% to 4.2% per month.','Normal','28 Oct 2026', 24, 19],
  ['ANN-102','KYC refresh campaign','Customers in arrears','Please visit your branch to update your KYC documents before 15 November.','Normal','26 Oct 2026', 118, 64]
];

/* audit */
S.audit = [
  ['09:42','NTF-10331','Sent','Automation','Disbursement confirmation · SMS','196.44.21.7','Success'],
  ['09:41','NTF-10330','Sent','Automation','Authorization request · staff dashboard','196.44.21.4','Success'],
  ['09:15','NTF-10329','Created','C. Mwale','Manual repayment reminder','196.44.21.4','Success'],
  ['08:22','NTF-10327','Sent','Automation','Overdue notice — provider rejected','196.44.21.9','Failed'],
  ['08:05','NTF-10326','Sent','System','Backup status email','10.0.4.12','Success'],
  ['07:58','NTF-10324','Modified','C. Mwale','Template TPL-04 wording updated','196.44.21.4','Success'],
  ['07:35','NTF-10323','Sent','System','Security alert to administrator','10.0.4.12','Success'],
  ['07:02','BC-0041','Broadcast','C. Mwale','Month-end announcement to all staff','196.44.21.4','Success'],
  ['06:58','NTF-10318','Blocked','L. Chirwa','Attempted broadcast to all customers','41.87.112.8','Blocked'],
  ['06:44','NTF-10312','Archived','C. Mwale','Bulk archive of 42 read notifications','196.44.21.4','Success']
];

/* charts */
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
function mkHBars(host, rows){
  if(!host) return;
  const max=Math.max(...rows.map(r=>r.value))||1;
  host.innerHTML=rows.map(r=>`<div class="hbar-row">
    <div class="hbar-l">${r.label}</div>
    <div class="hbar-t"><i style="width:${Math.max(2,(r.value/max)*100)}%;background:${r.color}"></i></div>
    <div class="hbar-v">${r.display||nf(r.value)}</div></div>`).join('');
}
function mkDonut(host, data, opt={}){
  if(!host) return;
  const total=data.reduce((s,d)=>s+d.value,0)||1;
  const size=opt.size||150,c=size/2,r=size*0.335,sw=opt.ring||15,C=2*Math.PI*r,GAP=2.5;
  let off=0,arcs='';
  data.forEach(d=>{
    const len=(d.value/total)*C, dash=Math.max(len-GAP,0.6);
    arcs+=`<circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="${d.color}" stroke-width="${sw}"
      stroke-dasharray="${dash.toFixed(2)} ${(C-dash).toFixed(2)}" stroke-dashoffset="${(-off).toFixed(2)}"
      transform="rotate(-90 ${c} ${c})"><title>${d.label}: ${nf(d.value)}</title></circle>`;
    off+=len;
  });
  host.innerHTML=`<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="#F1F2F6" stroke-width="${sw}"/>${arcs}
    <text x="${c}" y="${c-1}" text-anchor="middle" font-size="${(size*0.122).toFixed(1)}" font-weight="800" fill="#0F1115" font-family="inherit">${opt.center||nf(total)}</text>
    <text x="${c}" y="${c+13}" text-anchor="middle" font-size="${(size*0.056).toFixed(1)}" font-weight="700" fill="#8A90A0" letter-spacing=".8" font-family="inherit">${opt.caption||'TOTAL'}</text></svg>`;
}
