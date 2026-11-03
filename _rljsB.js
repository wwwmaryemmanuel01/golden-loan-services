<script>
/* ============================================================
   STAFF ROLES & PERMISSIONS (2/6)
   The plan itself: fifteen roles with their purpose, permissions
   and restrictions; twenty capabilities; the limits, the conflict
   pairs, the policies, the reviews and the audit entries.
   ============================================================ */

/* ---------------- 1. the fifteen roles ---------------- */
const ROLES = [
  { code:'SA', name:'Super Admin', tier:'Privileged', owner:'Board / Managing Director',
    purpose:'Overall system ownership and security.',
    perms:['Manage staff accounts, roles and permissions','Configure system settings and integrations',
      'View all authorized modules and reports','Manage loan policies, payment methods and approval limits',
      'Review audit logs, compliance and system health','Authorize exceptional high-risk actions under company policy',
      'Manage website settings'],
    restr:['Avoid routine transaction processing','Require a separate approval for critical financial actions where practical'] },

  { code:'SYS', name:'System Administrator', tier:'Privileged', owner:'Head of IT',
    purpose:'Technical and operational administration.',
    perms:['Manage permitted settings and staff access','Monitor application health, integrations and notifications',
      'View operational dashboards','Troubleshoot technical issues','Review technical audit events'],
    restr:['No automatic authority to approve loans, release funds, alter accounting records or view sensitive payroll'] },

  { code:'BRM', name:'Branch / Operations Manager', tier:'Operational', owner:'Head of Operations',
    purpose:'Supervise daily operations.',
    perms:['View customers, applications and loans','Assign loan officers','Approve transactions within assigned limits',
      'Monitor collections and disbursements','Review reports and complaints'],
    restr:['Cannot exceed approval limits','Cannot approve own transactions'] },

  { code:'LON', name:'Loan Officer', tier:'Operational', owner:'Branch Manager',
    purpose:'Manage customer loan applications.',
    perms:['Register customers','Update permitted profiles','Collect verification documents','Prepare applications',
      'Recommend decisions','View assigned customers and loans','Follow up overdue accounts','Record communications'],
    restr:['Cannot approve own recommendations','Cannot release funds independently'] },

  { code:'CRO', name:'Credit Officer / Credit Analyst', tier:'Operational', owner:'Head of Credit',
    purpose:'Assess creditworthiness and loan risk.',
    perms:['Review affordability, history and documents','Calculate risk indicators','Recommend loan amounts and terms',
      'Flag suspicious or duplicate applications','Prepare credit reports'],
    restr:['No direct disbursement authority','Approval rights require a separate mandate'] },

  { code:'CSH', name:'Cashier / Teller', tier:'Financial', owner:'Branch Manager',
    purpose:'Handle authorized collections and receipts.',
    perms:['Record repayments','Issue receipts','View assigned payment instructions and statuses',
      'Reconcile the cash drawer and collections','Flag payment discrepancies'],
    restr:['Cannot approve loans','Cannot alter confirmed transactions outside the authorized correction workflow',
      'Cannot approve own refunds'] },

  { code:'ACC', name:'Accountant / Finance Officer', tier:'Financial', owner:'Head of Finance',
    purpose:'Maintain financial records.',
    perms:['Manage permitted ledger entries','Reconcile bank, cash and mobile money','Review income, expenses, fees and penalties',
      'Prepare financial statements','Monitor balances and exceptions','Review payroll accounting and approved expenses'],
    restr:['Cannot independently authorize and execute the same high-value payment'] },

  { code:'COL', name:'Collections Officer', tier:'Operational', owner:'Head of Collections',
    purpose:'Manage overdue loans.',
    perms:['View assigned overdue accounts','Record reminders and promises to pay','Send approved notifications',
      'Escalate disputes and hardship cases','Track collection performance'],
    restr:['Cannot change loan terms','Cannot impose unauthorized penalties','Cannot write off debt without approval'] },

  { code:'AUD', name:'Internal Auditor / Compliance Officer', tier:'Oversight', owner:'Audit Committee',
    purpose:'Independently review controls and compliance.',
    perms:['Read permitted transaction histories, approvals and audit logs','Investigate exceptions','Prepare audit reports',
      'Track findings','Review permissions and controls'],
    restr:['Read-only operational financial access by default','Cannot edit or approve transactions being audited'] },

  { code:'SUP', name:'Customer Support Officer', tier:'Operational', owner:'Customer Experience Lead',
    purpose:'Resolve customer inquiries.',
    perms:['View limited customer details','Manage support tickets and complaints','Explain statements and application statuses',
      'Escalate payment disputes','Send approved communications'],
    restr:['Cannot access unnecessary sensitive documents','Cannot approve loans','Cannot edit financial balances'] },

  { code:'HRP', name:'HR / Payroll Officer', tier:'Financial', owner:'Head of People',
    purpose:'Manage employment records and payroll preparation.',
    perms:['Maintain staff profiles, contracts and leave','Prepare salaries, allowances and deductions',
      'Generate draft payslips','Record expenses and approved claims','Maintain confidential employment records'],
    restr:['Cannot approve own salary','Cannot change approved payroll unilaterally','Cannot release payroll without separate authorization'] },

  { code:'TRS', name:'Treasury / Disbursement Officer', tier:'Financial', owner:'Head of Finance',
    purpose:'Execute authorized outgoing payments.',
    perms:['View approved disbursements','Prepare payments','Record provider references and statuses',
      'Investigate pending and failed payments','Reconcile outgoing payments'],
    restr:['Cannot approve the loan or payment they release','Payment execution requires authorized provider controls'] },

  { code:'WEB', name:'Website / Content Manager', tier:'External', owner:'Marketing Lead',
    purpose:'Maintain public website content.',
    perms:['Update announcements, articles, FAQs and contact details','Manage permitted public pages','Review content',
      'Monitor links'],
    restr:['Cannot access customer financial records, payroll, staff permissions or Supabase secrets'] },

  { code:'ANA', name:'Reporting / Data Analyst', tier:'Oversight', owner:'Head of Analytics',
    purpose:'Prepare analytics and management reports.',
    perms:['View authorized aggregated data','Create charts, tables and dashboards',
      'Analyze loan performance, collections and operating costs','Export permitted reports'],
    restr:['Cannot change financial records','Cannot export restricted personal data without authorization'] },

  { code:'CUS', name:'Customer / Borrower', tier:'External', owner:'Self-service',
    purpose:'Use the customer portal.',
    perms:['View and update permitted personal details','Apply for loans','Track applications','View own loans, balances, schedules, receipts and statements','Submit payment evidence and support requests where enabled'],
    restr:['Cannot access other customers’ data, staff records or internal approval notes'] }
];
const ROLE_BY_CODE = Object.fromEntries(ROLES.map(r => [r.code, r]));
const roleName = c => (ROLE_BY_CODE[c] || {}).name || c;
const TIER_TONE = { Privileged:'b-crit', Operational:'b-info', Financial:'b-warn', Oversight:'b-gold', External:'b-gray' };
const TIERS = ['Privileged','Operational','Financial','Oversight','External'];

/* ---------------- 2. the twenty capabilities ---------------- */
const CAPS = [
  { k:'viewCust',  label:'View customer records',            note:'The customer file, not the money' },
  { k:'regCust',   label:'Register and update customers',     note:'Create a customer, change a permitted field' },
  { k:'prepApp',   label:'Prepare loan applications',         note:'Capture an application for assessment' },
  { k:'assess',    label:'Assess credit risk',                note:'Affordability, history, risk indicators' },
  { k:'approve',   label:'Approve loans',                     note:'The credit decision itself' },
  { k:'release',   label:'Release disbursements',             note:'Money leaves the institution' },
  { k:'repay',     label:'Record repayments and receipts',    note:'Take money in against a loan' },
  { k:'reverse',   label:'Reverse and correct payments',      note:'Undo a posted transaction' },
  { k:'ledger',    label:'Post ledger entries',               note:'Write to the books' },
  { k:'recon',     label:'Reconcile accounts',               note:'Set two records to agree' },
  { k:'payrollPrep', label:'Prepare payroll',                 note:'Salaries, allowances, deductions' },
  { k:'payrollApp',  label:'Approve and release payroll',     note:'The second name on payroll' },
  { k:'auditLog',  label:'Read audit logs',                   note:'The trail itself' },
  { k:'settings',  label:'Change system settings',            note:'Policies, rates, integrations' },
  { k:'staff',     label:'Manage staff accounts',             note:'Create, suspend, assign' },
  { k:'perm',      label:'Manage roles and permissions',      note:'Grant what others may do' },
  { k:'export',    label:'Export reports',                    note:'Data leaves the system' },
  { k:'website',   label:'Manage website content',            note:'Public pages only' },
  { k:'sensitive', label:'View sensitive documents',          note:'Identity, payroll, confidential files' },
  { k:'emergency', label:'Emergency admin access',            note:'Break-glass elevation' }
];
const CAP_BY_K = Object.fromEntries(CAPS.map(c => [c.k, c]));

/* Full · Approve · Own · Limited · None, in CAPS order */
const PERMS = {
  SA:  ['Full','Full','None','Full','Approve','Approve','None','Full','Full','Full','Full','Approve','Full','Full','Full','Full','Full','Full','Full','Full'],
  SYS: ['Limited','None','None','None','None','None','None','None','None','None','None','None','Limited','Full','Full','Limited','None','None','None','Approve'],
  BRM: ['Full','Full','Full','Full','Approve','Approve','Full','Approve','None','Approve','None','None','Limited','None','Limited','None','Full','None','Limited','None'],
  LON: ['Own','Full','Full','Own','None','None','None','None','None','None','None','None','None','None','None','None','None','None','None','None'],
  CRO: ['Own','None','None','Full','None','None','None','None','None','None','None','None','Limited','None','None','None','Limited','None','Own','None'],
  CSH: ['Own','Limited','None','None','None','None','Full','Limited','None','Own','None','None','None','None','None','None','None','None','None','None'],
  ACC: ['Limited','None','None','None','None','None','Limited','Approve','Full','Full','Limited','None','Limited','None','None','None','Full','None','Own','None'],
  COL: ['Own','Limited','None','Limited','None','None','Own','None','None','None','None','None','None','None','None','None','None','None','Limited','None'],
  AUD: ['Full','None','None','None','None','None','None','None','None','None','None','None','Full','None','None','None','Full','None','Full','None'],
  SUP: ['Limited','Limited','None','None','None','None','None','None','None','None','None','None','None','None','None','None','None','None','None','None'],
  HRP: ['Limited','None','None','None','None','None','None','None','None','None','Full','None','Limited','None','Limited','None','Limited','None','Own','None'],
  TRS: ['Own','None','None','None','None','Full','None','None','None','Own','None','None','Limited','None','None','None','Limited','None','Limited','None'],
  WEB: ['None','None','None','None','None','None','None','None','None','None','None','None','None','None','None','None','None','Full','None','None'],
  ANA: ['Limited','None','None','None','None','None','None','None','None','None','None','None','Limited','None','None','None','Full','None','None','None'],
  CUS: ['Own','Own','Own','None','None','None','Own','None','None','None','None','None','None','None','None','None','Own','None','Own','None']
};
const LEVEL_INFO = {
  Full:    { cls:'full', short:'F', label:'Full control' },
  Approve: { cls:'appr', short:'A', label:'Approve only' },
  Own:     { cls:'own',  short:'O', label:'Own records only' },
  Limited: { cls:'ltd',  short:'L', label:'Limited or masked' },
  None:    { cls:'none', short:'—', label:'No access' }
};
const LEVELS = ['Full','Approve','Own','Limited','None'];
const levelOf = (code, k) => (PERMS[code] || [])[CAPS.findIndex(c => c.k === k)] || 'None';
const capCount = (code, level) => (PERMS[code] || []).filter(v => v === level).length;

/* ---------------- 3. staff accounts ---------------- */
const ACCOUNTS = [
  { id:'STF-001', name:'Yamikani Banda',   code:'LON', branch:'Lilongwe',    mfa:true,  status:'Active', reviewed:addDays(TODAY,-12), limit:0,       shared:false },
  { id:'STF-002', name:'Blessings Tembo',  code:'LON', branch:'Blantyre',    mfa:true,  status:'Active', reviewed:addDays(TODAY,-12), limit:0,       shared:false },
  { id:'STF-003', name:'Tadala Msonthi',   code:'BRM', branch:'Lilongwe',    mfa:true,  status:'Active', reviewed:addDays(TODAY,-9),  limit:250000,  shared:false },
  { id:'STF-004', name:'Linda Mhango',     code:'CRO', branch:'Lilongwe',    mfa:true,  status:'Active', reviewed:addDays(TODAY,-9),  limit:0,       shared:false },
  { id:'STF-005', name:'Esther Mwale',     code:'COL', branch:'Lilongwe',    mfa:true,  status:'Active', reviewed:addDays(TODAY,-21), limit:0,       shared:false },
  { id:'STF-006', name:'Fatsani Gondwe',   code:'COL', branch:'Blantyre',    mfa:false, status:'Active', reviewed:addDays(TODAY,-21), limit:0,       shared:false },
  { id:'STF-007', name:'Alinafe Nyirenda', code:'CSH', branch:'Lilongwe',    mfa:true,  status:'Active', reviewed:addDays(TODAY,-6),  limit:150000,  shared:false },
  { id:'STF-008', name:'Memory Phiri',     code:'SUP', branch:'Mzuzu',       mfa:true,  status:'Active', reviewed:addDays(TODAY,-6),  limit:0,       shared:false },
  { id:'STF-009', name:'Chikondi Mwale',   code:'SA',  branch:'Head office', mfa:true,  status:'Active', reviewed:addDays(TODAY,-3),  limit:0,       shared:false },
  { id:'STF-010', name:'Wongani Zulu',     code:'ACC', branch:'Head office', mfa:true,  status:'Active', reviewed:addDays(TODAY,-15), limit:500000,  shared:false },
  { id:'STF-011', name:'Chimwemwe Kaunda', code:'TRS', branch:'Head office', mfa:true,  status:'Active', reviewed:addDays(TODAY,-15), limit:0,       shared:false },
  { id:'STF-012', name:'Thandiwe Kamanga', code:'AUD', branch:'Head office', mfa:true,  status:'Active', reviewed:addDays(TODAY,-4),  limit:0,       shared:false },
  { id:'STF-013', name:'Mphatso Chirwa',   code:'HRP', branch:'Head office', mfa:true,  status:'Active', reviewed:addDays(TODAY,-18), limit:0,       shared:false },
  { id:'STF-014', name:'Tiyamike Msiska',  code:'WEB', branch:'Head office', mfa:false, status:'Active', reviewed:addDays(TODAY,-30), limit:0,       shared:false },
  { id:'STF-015', name:'Steven Mponda',    code:'ANA', branch:'Head office', mfa:true,  status:'Active', reviewed:addDays(TODAY,-30), limit:0,       shared:false },
  { id:'STF-016', name:'Pemphero Kachale', code:'SYS', branch:'Head office', mfa:true,  status:'Active', reviewed:addDays(TODAY,-8),  limit:0,       shared:false },
  { id:'STF-017', name:'Grace Mwale',      code:'CSH', branch:'Blantyre',    mfa:true,  status:'Active', reviewed:addDays(TODAY,-11), limit:120000,  shared:false },
  { id:'STF-018', name:'Isaac Gondwe',     code:'LON', branch:'Mzuzu',       mfa:true,  status:'Active', reviewed:addDays(TODAY,-11), limit:0,       shared:false },
  { id:'STF-019', name:'Lucy Banda',       code:'SUP', branch:'Lilongwe',    mfa:true,  status:'Active', reviewed:addDays(TODAY,-7),  limit:0,       shared:false },
  { id:'STF-020', name:'Patrick Msiska',   code:'COL', branch:'Mzuzu',       mfa:true,  status:'Active', reviewed:addDays(TODAY,-7),  limit:0,       shared:false },
  { id:'STF-021', name:'Ruth Nyirenda',    code:'BRM', branch:'Blantyre',    mfa:true,  status:'Active', reviewed:addDays(TODAY,-5),  limit:200000,  shared:false },
  { id:'STF-022', name:'Gift Tembo',       code:'CRO', branch:'Blantyre',    mfa:true,  status:'Active', reviewed:addDays(TODAY,-5),  limit:0,       shared:false },
  { id:'STF-023', name:'Ekari Phiri',      code:'ACC', branch:'Blantyre',    mfa:false, status:'Suspended', reviewed:addDays(TODAY,-2), limit:0,     shared:false },
  { id:'STF-024', name:'Joyce Kalua',      code:'CUS', branch:'Self-service', mfa:true, status:'Active', reviewed:addDays(TODAY,-40), limit:0,      shared:false },
  { id:'STF-025', name:'Zikomo Nyasulu',   code:'CUS', branch:'Self-service', mfa:true, status:'Active', reviewed:addDays(TODAY,-40), limit:0,      shared:false },
  { id:'STF-026', name:'Yamikani Tembo',   code:'LON', branch:'Zomba',       mfa:false, status:'Leaver', reviewed:addDays(TODAY,-2),  limit:0,       shared:false },
  { id:'STF-027', name:'Mavuto Banda',     code:'CSH', branch:'Zomba',       mfa:true,  status:'Leaver', reviewed:addDays(TODAY,-2),  limit:0,       shared:false }
];
const ACC_BY_ID = Object.fromEntries(ACCOUNTS.map(a => [a.id, a]));
const staffName = id => (ACC_BY_ID[id] || {}).name || id;
const staffRole = id => roleName((ACC_BY_ID[id] || {}).code);
const activeAccounts = ACCOUNTS.filter(a => a.status === 'Active');

/* ---------------- 4. approval limits ---------------- */
const LIMITS = {
  SA:  { approve:0,       execute:0,       second:0,        daily:0,       note:'Owns the system, not the money — every financial act needs another name' },
  SYS: { approve:0,       execute:0,       second:0,        daily:0,       note:'Technical administration only' },
  BRM: { approve:250000,  execute:0,       second:250000,   daily:1000000, note:'Branch approvals within the assigned limit' },
  LON: { approve:0,       execute:0,       second:0,        daily:0,       note:'Recommends only — never approves its own recommendation' },
  CRO: { approve:0,       execute:0,       second:0,        daily:0,       note:'Assesses and recommends; approval needs a mandate' },
  CSH: { approve:150000,  execute:150000,  second:50000,    daily:400000,  note:'Receipts and refunds up to the drawer limit' },
  ACC: { approve:500000,  execute:250000,  second:250000,   daily:1500000, note:'Ledger work; a high-value payment needs two names' },
  COL: { approve:0,       execute:0,       second:0,        daily:0,       note:'No waivers, no write-offs, no term changes' },
  AUD: { approve:0,       execute:0,       second:0,        daily:0,       note:'Read-only by design' },
  SUP: { approve:0,       execute:0,       second:0,        daily:0,       note:'No financial movement' },
  HRP: { approve:0,       execute:0,       second:0,        daily:0,       note:'Prepares payroll; never approves or releases it' },
  TRS: { approve:0,       execute:5000000, second:0,        daily:10000000,note:'Executes what credit approved; never approves it' },
  WEB: { approve:0,       execute:0,       second:0,        daily:0,       note:'Public content only' },
  ANA: { approve:0,       execute:0,       second:0,        daily:0,       note:'Reads aggregates; exports need clearance' },
  CUS: { approve:0,       execute:0,       second:0,        daily:0,       note:'Own records only' }
};
const THRESHOLDS = [
  { band:'Up to MK 50,000',        needs:'The officer alone',                    who:'Cashier, Branch Manager',              lag:'Same day' },
  { band:'MK 50,000 – 250,000',    needs:'A second name if the officer is the actor', who:'Branch Manager, Accountant',      lag:'Same day' },
  { band:'MK 250,000 – 1,000,000', needs:'Branch Manager and Head of Credit',      who:'Two approvers, neither the actor',    lag:'Within 1 working day' },
  { band:'MK 1,000,000 – 5,000,000', needs:'Head of Credit and Finance',           who:'Two approvers plus Treasury execution', lag:'Within 1 working day' },
  { band:'Above MK 5,000,000',     needs:'Super Admin or Board delegate, recorded', who:'Board resolution on file',            lag:'Before execution' },
  { band:'Any amount',             needs:'Never the same person who prepared it',   who:'Platform rule, all roles',            lag:'Always' }
];
const CHECK_ACTIONS = [
  { k:'approve',  label:'Approve a loan',                cap:'approve' },
  { k:'release',  label:'Release a disbursement',        cap:'release' },
  { k:'refund',   label:'Approve a refund or reversal',  cap:'reverse' },
  { k:'waiver',   label:'Approve a fee waiver',          cap:'reverse' },
  { k:'journal',  label:'Post a ledger adjustment',      cap:'ledger' },
  { k:'payroll',  label:'Approve and release payroll',   cap:'payrollApp' },
  { k:'perm',     label:'Grant a permission',            cap:'perm' },
  { k:'settings', label:'Change a system setting',       cap:'settings' }
];

/* ---------------- 5. separation of duties ---------------- */
const SOD = [
  { id:'SOD-01', pair:'Loan approval against disbursement release', a:'approve', b:'release',
    control:'The approver never sees the release screen; the releaser never sees the decision buttons', status:'Separated' },
  { id:'SOD-02', pair:'Payroll preparation against payroll approval', a:'payrollPrep', b:'payrollApp',
    control:'HR prepares a draft; Finance approves; Treasury releases', status:'Separated' },
  { id:'SOD-03', pair:'Recording a repayment against reconciling it', a:'repay', b:'recon',
    control:'The cashier records, the accountant reconciles the same money', status:'Separated' },
  { id:'SOD-04', pair:'Posting a ledger entry against reconciling the ledger', a:'ledger', b:'recon',
    control:'Reconciliation is a separate function with its own sign-off', status:'Separated' },
  { id:'SOD-05', pair:'Managing staff accounts against granting permissions', a:'staff', b:'perm',
    control:'On the super admin only, and every grant needs a second signature', status:'Compensating' },
  { id:'SOD-06', pair:'Assessing a charge against waiving it', a:'assess', b:'reverse',
    control:'Assessors may not approve waivers of their own charges', status:'Separated' },
  { id:'SOD-07', pair:'Executing a payment against approving it', a:'release', b:'approve',
    control:'Treasury executes; credit approves; neither holds both', status:'Separated' },
  { id:'SOD-08', pair:'Read-only audit against every act it audits', a:'auditLog', b:'approve',
    control:'The auditor holds no write capability at all', status:'Separated' }
];
const SOD_BLOCKED = [
  { when:addDays(TODAY,-2) + ' 11:42', staff:'STF-003', action:'Release disbursement LN-2026-0417', amount:1250000, reason:'The same officer approved the loan 40 minutes earlier' },
  { when:addDays(TODAY,-5) + ' 09:18', staff:'STF-010', action:'Approve journal JE-2026-0871', amount:1800000, reason:'Posted the entry being approved' },
  { when:addDays(TODAY,-9) + ' 15:03', staff:'STF-007', action:'Approve own refund RF-2026-0142', amount:48000, reason:'Cashier may not approve their own refund' },
  { when:addDays(TODAY,-14) + ' 10:26', staff:'STF-013', action:'Release payroll PRL-2609', amount:28707000, reason:'Prepared the payroll being released' },
  { when:addDays(TODAY,-21) + ' 16:40', staff:'STF-005', action:'Waive penalty CHG-2026-1130', amount:15000, reason:'Collections may not waive a penalty unilaterally' },
  { when:addDays(TODAY,-28) + ' 08:55', staff:'STF-016', action:'Approve loan APP-2026-0166', amount:900000, reason:'System administration carries no credit authority' }
];
const SOD_HOLDERS = [
  { code:'SA',  pair:'Manage staff accounts and permissions', control:'Second signature on every grant; quarterly review', status:'Compensating' },
  { code:'BRM', pair:'Approve a loan and approve its release', control:'Release is executed by Treasury, not the branch', status:'Compensating' },
  { code:'ACC', pair:'Post an entry and reconcile the ledger', control:'High-value entries need a second name', status:'Compensating' },
  { code:'CSH', pair:'Record a receipt and reconcile the drawer', control:'Reconciled by Finance the next morning', status:'Compensating' }
];

/* ---------------- 6. enforcement ---------------- */
const POLICIES = [
  { table:'loans', policy:'loans_officer_read', op:'SELECT', rule:'officer_id = auth.uid() or has_cap(auth.uid(), \'viewCust\', \'Full\')',
    where:'RLS', tested:addDays(TODAY,-1), result:'Passed' },
  { table:'loans', policy:'loans_approve_separate', op:'UPDATE', rule:'approved_by <> prepared_by and has_cap(auth.uid(), \'approve\')',
    where:'Function', tested:addDays(TODAY,-1), result:'Passed' },
  { table:'disbursements', policy:'disb_release_treasury', op:'INSERT', rule:'has_cap(auth.uid(), \'release\') and approved_at is not null',
    where:'Function', tested:addDays(TODAY,-2), result:'Passed' },
  { table:'repayments', policy:'repayments_own_branch', op:'SELECT', rule:'branch_id = current_branch() or has_cap(auth.uid(), \'repay\')',
    where:'RLS', tested:addDays(TODAY,-2), result:'Passed' },
  { table:'payroll_runs', policy:'payroll_hr_finance_only', op:'SELECT', rule:'has_cap(auth.uid(), \'payrollPrep\') or has_cap(auth.uid(), \'payrollApp\')',
    where:'RLS', tested:addDays(TODAY,-3), result:'Passed' },
  { table:'staff', policy:'staff_self_or_admin', op:'SELECT', rule:'id = auth.uid() or has_cap(auth.uid(), \'staff\')',
    where:'RLS', tested:addDays(TODAY,-3), result:'Passed' },
  { table:'role_permissions', policy:'perm_grant_needs_two', op:'UPDATE', rule:'changed_by <> approved_by and has_cap(auth.uid(), \'perm\')',
    where:'Function', tested:addDays(TODAY,-4), result:'Passed' },
  { table:'audit_log', policy:'audit_read_only', op:'INSERT/SELECT', rule:'insert via trigger only; select needs \'auditLog\'',
    where:'RLS', tested:addDays(TODAY,-4), result:'Passed' },
  { table:'customers', policy:'customer_limited_columns', op:'SELECT', rule:'support sees masked phone and no ID number',
    where:'RLS', tested:addDays(TODAY,-5), result:'Passed' },
  { table:'website_pages', policy:'website_write_content', op:'UPDATE', rule:'has_cap(auth.uid(), \'website\') and no financial tables in scope',
    where:'RLS', tested:addDays(TODAY,-6), result:'Passed' },
  { table:'emergency_access', policy:'break_glass_timeboxed', op:'INSERT', rule:'expires_at <= now() + interval \'4 hours\' and approved_by is not null',
    where:'Edge function', tested:addDays(TODAY,-7), result:'Passed' },
  { table:'approvals', policy:'no_self_approval', op:'UPDATE', rule:'approved_by <> requested_by',
    where:'Function', tested:addDays(TODAY,-1), result:'Passed' }
];
const ENF_TESTS = [
  { name:'Anonymous key cannot read the staff table', role:'anon', expect:'0 rows', result:'Passed', when:addDays(TODAY,-1) },
  { name:'A loan officer sees only assigned customers', role:'LON', expect:'Assigned only', result:'Passed', when:addDays(TODAY,-1) },
  { name:'A customer sees only their own loan', role:'CUS', expect:'Own row', result:'Passed', when:addDays(TODAY,-2) },
  { name:'The auditor cannot write any row', role:'AUD', expect:'0 rows written', result:'Passed', when:addDays(TODAY,-2) },
  { name:'Payroll is invisible to the system administrator', role:'SYS', expect:'0 rows', result:'Passed', when:addDays(TODAY,-3) },
  { name:'Support reads a masked phone number', role:'SUP', expect:'Masked', result:'Passed', when:addDays(TODAY,-3) },
  { name:'An approver cannot approve their own request', role:'BRM', expect:'Refused', result:'Passed', when:addDays(TODAY,-4) },
  { name:'The service-role key is absent from the browser bundle', role:'bundle', expect:'Absent', result:'Passed', when:addDays(TODAY,-5) }
];
const SECRETS = [
  { name:'Supabase service-role key', where:'Edge function secrets only', ok:true, note:'Never shipped to a page; the anon key is the only key in the browser' },
  { name:'Database password', where:'Managed secrets', ok:true, note:'Not in the repository, not in the bundle' },
  { name:'Payment provider credentials', where:'Edge function secrets', ok:true, note:'Rotated 30 days ago; two-person access' },
  { name:'SMS and email keys', where:'Edge function secrets', ok:true, note:'Scoped to send-only' },
  { name:'No secrets in client JavaScript', where:'Bundle scan', ok:true, note:'Scanned on every deploy' }
];
const GAPS = [
  { rule:'Hide the refuse button', before:'Approval hidden in the interface only', now:'Refused by the database function', status:'Closed' },
  { rule:'Officer sees every customer', before:'Table filter applied in the browser', now:'Row-level security on the table', status:'Closed' },
  { rule:'Payroll visible to administrators', before:'Menu item hidden', now:'Policy on payroll_runs', status:'Closed' },
  { rule:'Permissions changed by one person', before:'No second signature', now:'Grant needs a second approver', status:'Closed' },
  { rule:'Exports unrestricted', before:'Any signed-in user could export', now:'Capability check before the export runs', status:'Closed' },
  { rule:'Break-glass access standing', before:'One permanent super-admin login', now:'Time-boxed and approved per use', status:'Closed' }
];

/* ---------------- 7. restricted data ---------------- */
const DATA_CLASS = [
  { category:'Payroll and salaries', level:'Confidential', roles:['HRP','ACC','AUD'], mask:'Amounts hidden outside payroll', where:'RLS',
    note:'The system administrator has no read access at all' },
  { category:'Identity documents', level:'Restricted', roles:['LON','CRO','AUD','SA'], mask:'Last four digits, image on request', where:'RLS',
    note:'Every open is logged with a reason' },
  { category:'Credentials and secrets', level:'Secret', roles:['SYS','SA'], mask:'Never displayed, rotate only', where:'Edge function',
    note:'Service-role key never reaches a browser' },
  { category:'Customer contact details', level:'Private', roles:['LON','COL','SUP','BRM','AUD'], mask:'Phone masked for support', where:'RLS',
    note:'Support sees enough to call, not enough to harvest' },
  { category:'Approval notes', level:'Private', roles:['CRO','BRM','AUD'], mask:'Internal only, never shown to the customer', where:'RLS',
    note:'Excluded from the customer portal by policy' },
  { category:'Financial records', level:'Internal', roles:['ACC','AUD','SA','BRM'], mask:'Branch-scoped', where:'RLS',
    note:'Read for audit, write for finance' }
];
const DATA_LOG = [
  { when:addDays(TODAY,-1) + ' 10:12', staff:'STF-004', record:'Identity document · GF-000493', reason:'Affordability review' },
  { when:addDays(TODAY,-1) + ' 14:38', staff:'STF-012', record:'Payroll run · PRL-2610', reason:'Quarterly audit sample' },
  { when:addDays(TODAY,-2) + ' 09:04', staff:'STF-008', record:'Contact details · GF-000512', reason:'Callback on a ticket' },
  { when:addDays(TODAY,-2) + ' 16:21', staff:'STF-013', record:'Payroll run · PRL-2610', reason:'Draft payslip correction' },
  { when:addDays(TODAY,-3) + ' 11:55', staff:'STF-001', record:'Identity document · GF-000487', reason:'New application' },
  { when:addDays(TODAY,-4) + ' 08:47', staff:'STF-016', record:'Secrets · payment provider', reason:'Rotation scheduled' }
];
const MASK_SAMPLE = [
  { field:'Phone number', support:'+265 99 ••• ••12', auditor:'+265 991 234 512' },
  { field:'National ID', support:'Not shown', auditor:'MW•••••••7' },
  { field:'Payroll amount', support:'Not shown', auditor:'MK 1,480,000' },
  { field:'Loan balance', support:'MK 480,000', auditor:'MK 480,000' },
  { field:'Approval note', support:'Not shown', auditor:'Recommendation approved' },
  { field:'Statement', support:'Current month', auditor:'Every month' }
];

/* ---------------- 8. reviews, leavers, role changes ---------------- */
const REVIEWS = [
  { id:'AR-2026-Q4', period:'Oct 2026', reviewer:'STF-012', covered:15, findings:3, changes:3, status:'Complete' },
  { id:'AR-2026-Q3', period:'Jul 2026', reviewer:'STF-012', covered:14, findings:5, changes:4, status:'Complete' },
  { id:'AR-2026-Q2', period:'Apr 2026', reviewer:'STF-012', covered:13, findings:2, changes:2, status:'Complete' },
  { id:'AR-2026-Q1', period:'Jan 2026', reviewer:'STF-012', covered:12, findings:6, changes:6, status:'Complete' },
  { id:'AR-2026-Q4b', period:'Oct 2026 · privileged', reviewer:'STF-009', covered:3, findings:1, changes:1, status:'Complete' },
  { id:'AR-2027-Q1', period:'Jan 2027', reviewer:'STF-012', covered:15, findings:0, changes:0, status:'Due' }
];
const LEAVERS = [
  { staff:'STF-026', role:'LON', left:addDays(TODAY,-2),  cut:addDays(TODAY,-2),  sessions:3, mfa:true,  status:'Immediate' },
  { staff:'STF-027', role:'CSH', left:addDays(TODAY,-9),  cut:addDays(TODAY,-9),  sessions:2, mfa:true,  status:'Immediate' },
  { staff:'STF-031', role:'COL', left:addDays(TODAY,-26), cut:addDays(TODAY,-25), sessions:1, mfa:true,  status:'Next day' },
  { staff:'STF-034', role:'SUP', left:addDays(TODAY,-44), cut:addDays(TODAY,-44), sessions:1, mfa:true,  status:'Immediate' },
  { staff:'STF-037', role:'ACC', left:addDays(TODAY,-61), cut:addDays(TODAY,-58), sessions:4, mfa:true,  status:'Three days' },
  { staff:'STF-041', role:'TRS', left:addDays(TODAY,-88), cut:addDays(TODAY,-88), sessions:2, mfa:true,  status:'Immediate' }
];
const LEAVER_NAMES = { 'STF-026':'Yamikani Tembo','STF-027':'Mavuto Banda','STF-031':'Dalitso Chirwa','STF-034':'Grace Zulu','STF-037':'Thoko Msowoya','STF-041':'Chisomo Kalua' };
const ROLE_CHANGES = [
  { when:addDays(TODAY,-3),  staff:'STF-004', from:'CRO', to:'CRO',  by:'STF-009', sessions:2, status:'Limit removed' },
  { when:addDays(TODAY,-7),  staff:'STF-021', from:'LON', to:'BRM',  by:'STF-009', sessions:3, status:'Promoted' },
  { when:addDays(TODAY,-11), staff:'STF-017', from:'SUP', to:'CSH',  by:'STF-003', sessions:1, status:'Moved' },
  { when:addDays(TODAY,-18), staff:'STF-006', from:'COL', to:'COL',  by:'STF-012', sessions:4, status:'MFA re-enrolled' },
  { when:addDays(TODAY,-24), staff:'STF-023', from:'ACC', to:'ACC',  by:'STF-009', sessions:6, status:'Suspended' },
  { when:addDays(TODAY,-33), staff:'STF-014', from:'WEB', to:'WEB',  by:'STF-009', sessions:2, status:'Scope narrowed' }
];

/* ---------------- 9. emergency access ---------------- */
const EMERGENCY = [
  { id:'BG-2026-014', staff:'STF-016', reason:'Payment provider webhook outage', scope:'Integrations and logs', grantedBy:'STF-009',
    start:addDays(TODAY,-4) + ' 22:10', end:addDays(TODAY,-4) + ' 23:42', used:true, state:'Closed' },
  { id:'BG-2026-013', staff:'STF-011', reason:'Bank file rejected overnight', scope:'Disbursement queue', grantedBy:'STF-009',
    start:addDays(TODAY,-12) + ' 06:05', end:addDays(TODAY,-12) + ' 08:00', used:true, state:'Closed' },
  { id:'BG-2026-012', staff:'STF-009', reason:'Restore a deleted ledger entry', scope:'Ledger, write', grantedBy:'STF-012',
    start:addDays(TODAY,-19) + ' 13:20', end:addDays(TODAY,-19) + ' 14:05', used:true, state:'Closed' },
  { id:'BG-2026-011', staff:'STF-016', reason:'Test after a database upgrade', scope:'Read only', grantedBy:'STF-009',
    start:addDays(TODAY,-27) + ' 18:30', end:addDays(TODAY,-27) + ' 19:00', used:false, state:'Expired unused' },
  { id:'BG-2026-010', staff:'STF-010', reason:'Month-end reconciliation lock', scope:'Ledger, read', grantedBy:'STF-009',
    start:addDays(TODAY,-41) + ' 20:15', end:addDays(TODAY,-41) + ' 22:15', used:true, state:'Closed' }
];
const EMG_CONTROLS = [
  'One request per incident, with a stated reason and a named approver',
  'Four-hour maximum, expiring on its own whether used or not',
  'A full session recording, and every statement it ran kept for the auditor',
  'The approver may not be the person asking',
  'A written review within five working days, filed against the incident',
  'No standing super-admin login exists for anyone to share'
];

/* ---------------- 10. the ten essential rules ---------------- */
const RULES = [
  { n:1, rule:'Least privilege', text:'Every role holds the smallest set of capabilities that lets it do its job, and nothing beyond it.',
    where:'RLS', evidence:'20 capabilities mapped across 15 roles; 128 of 300 cells are no access', state:'Enforced', owner:'STF-012', checked:addDays(TODAY,-1) },
  { n:2, rule:'Separation of duties', text:'Loan approval, payment release and reconciliation never sit with one person.',
    where:'Function', evidence:'8 conflict pairs separated; 6 actions refused in 90 days', state:'Enforced', owner:'STF-012', checked:addDays(TODAY,-1) },
  { n:3, rule:'Enforce in the backend and RLS', text:'A permission is enforced in a database function or a row-level policy, never only in the interface.',
    where:'RLS', evidence:'12 policies and functions tested; 6 interface-only gaps closed', state:'Enforced', owner:'STF-016', checked:addDays(TODAY,-2) },
  { n:4, rule:'Audit sensitive actions', text:'Every sensitive action records the actor, the timestamp and the result.',
    where:'Audit', evidence:'Audit trigger on 9 tables; 64 permission events this quarter', state:'Enforced', owner:'STF-012', checked:addDays(TODAY,-2) },
  { n:5, rule:'Limits by role and amount', text:'Approval limits are configured per role and per amount, and the platform applies them.',
    where:'Function', evidence:'6 amount bands; 15 roles with an explicit approve, execute and daily ceiling', state:'Enforced', owner:'STF-010', checked:addDays(TODAY,-3) },
  { n:6, rule:'Restrict payroll, identity and private data', text:'Payroll, identity documents, credentials and private customer data are classified and restricted.',
    where:'RLS', evidence:'6 data classes; payroll invisible to the system administrator', state:'Enforced', owner:'STF-013', checked:addDays(TODAY,-3) },
  { n:7, rule:'Disable access promptly on exit', text:'Leavers lose access the moment they leave, and a role change ends their sessions.',
    where:'Function', evidence:'6 leavers, 5 cut the same day; every role change revoked sessions', state:'Enforced', owner:'STF-013', checked:addDays(TODAY,-4) },
  { n:8, rule:'Individual accounts only', text:'One person, one login. Shared staff accounts are refused outright.',
    where:'RLS', evidence:'27 accounts, 27 named people, 0 shared logins', state:'Enforced', owner:'STF-016', checked:addDays(TODAY,-4) },
  { n:9, rule:'No service-role key in the browser', text:'The service-role key stays in the edge function; the browser only ever holds the anon key.',
    where:'Edge function', evidence:'Bundle scanned on every deploy; no key found', state:'Enforced', owner:'STF-016', checked:addDays(TODAY,-5) },
  { n:10, rule:'Restrict and audit emergency access', text:'Break-glass access is time-boxed, approved by another person and reviewed afterwards.',
    where:'Edge function', evidence:'5 requests, longest 1h 32m, all reviewed; no standing super-admin login', state:'Enforced', owner:'STF-009', checked:addDays(TODAY,-5) }
];

/* ---------------- 11. audit trail ---------------- */
const AUDIT = [];
(function(){
  const acts = [
    ['Role granted','Allowed'], ['Role revoked','Allowed'], ['Permission granted','Allowed'],
    ['Permission refused','Refused'], ['Limit changed','Allowed'], ['Access review signed','Allowed'],
    ['Session revoked','Allowed'], ['Break-glass requested','Pending'], ['Break-glass approved','Allowed'],
    ['Export permitted','Allowed'], ['Export refused','Refused'], ['Account suspended','Allowed'],
    ['MFA enforced','Allowed'], ['Leaver access cut','Allowed'], ['Payroll access refused','Refused']
  ];
  let seed = 20261030;
  const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
  const poke = a => a[Math.floor(rnd() * a.length)];
  for(let i = 0; i < 64; i++){
    const a = acts[i % acts.length];
    const who = poke(ACCOUNTS.filter(x => x.code !== 'CUS'));
    const target = poke(ACCOUNTS);
    const cap = poke(CAPS);
    AUDIT.push({
      id:'PRM-2026-' + pad(1200 - i, 4),
      when:addDays(TODAY, -Math.floor(i / 3)) + ' ' + pad(8 + (i % 10), 2) + ':' + pad((i * 13) % 60, 2),
      actor:who.id, actorRole:who.code, action:a[0], result:a[1], target:target.id, cap:cap.label,
      before: a[0].indexOf('revoked') >= 0 ? 'Granted' : '—',
      after: a[0].indexOf('revoked') >= 0 ? 'Revoked' : a[0].indexOf('refused') >= 0 ? 'Refused' : 'Granted',
      reason: a[0].indexOf('refused') >= 0 ? 'Separation-of-duties rule' : 'Access review outcome'
    });
  }
})();
const AUDIT_SORTED = AUDIT.slice().sort((a, b) => a.when < b.when ? 1 : -1);

/* ---------------- derived helpers ---------------- */
const heldBy = code => ACCOUNTS.filter(a => a.code === code);
const privileged = () => ACCOUNTS.filter(a => a.code === 'SA' || a.code === 'SYS');
const capUsage = level => CAPS.reduce((s, c) => s + ROLES.filter(r => levelOf(r.code, c.k) === level).length, 0);
const conflictsHeld = () => SOD.filter(r => ROLES.some(role => {
  const x = levelOf(role.code, r.a), y = levelOf(role.code, r.b);
  return x !== 'None' && y !== 'None';
}));

RULES[0].evidence = CAPS.length + ' capabilities across ' + ROLES.length + ' roles; ' + capUsage('None') + ' of ' +
  (CAPS.length * ROLES.length) + ' cells are no access';
RULES[3].evidence = 'Audit trigger on 9 tables; ' + AUDIT.length + ' permission events recorded';
RULES[7].evidence = ACCOUNTS.length + ' accounts, ' + ACCOUNTS.length + ' named people, 0 shared logins';
</script>
