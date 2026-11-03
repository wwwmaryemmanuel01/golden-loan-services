<script>
/* ============================================================
   DATA RECOVERY, SYSTEM BACKUP & FACTORY RESET (2/6)
   The backup book. Every copy, job, test, scenario and policy in
   this module is generated here once, from one seed, so the
   dashboard, the history and the audits always agree.
   Where a figure is illustrative rather than measured, the row
   says so in its own notes.
   ============================================================ */

/* ---------------- the environment this page administers ---------------- */
const ENVIRONMENTS = [
  {id:'development', label:'Development', tone:'dev', host:'localhost · local Supabase',
   data:'seeded test data only', restorePolicy:'Any authorised developer may restore.',
   warning:'No customer data. A reset here costs nothing.'},
  {id:'staging', label:'Staging', tone:'staging', host:'Railway preview · staging Supabase',
   data:'a copy of production, refreshed weekly', restorePolicy:'Restore freely; approval needed for a reset above Mode B.',
   warning:'Realistic data, no customers. Safe to break.'},
  {id:'production', label:'Production', tone:'prod', host:'Railway · Supabase (eu-west-1)',
   data:'live customers, loans, repayments and the ledger', restorePolicy:'Restore only with a second approver and typed confirmation.',
   warning:'This is real money and real people. Every destructive run needs two names.'}
];
const ENV_BY_ID = Object.fromEntries(ENVIRONMENTS.map(e => [e.id, e]));

const PROJECT = {
  supabaseRef:'glfs-prod-mw', region:'eu-west-1 (Ireland)', plan:'Pro plan',
  railwayService:'golden-loan-services', appVersion:'2.8.0', schemaVersion:'2026.10.3',
  migrationHead:'0042_penalty_cap_and_waivers', nodeVersion:'20.x', lastDeploy:'2026-10-28 17:12',
  pitrAvailable:true, backupWindow:'02:00–02:40 UTC', offsite:'Backblaze B2 · separate account (read-only key)'
};

/* ---------------- people ---------------- */
const DR_STAFF = [
  {id:'STF-002', name:'Chikondi Mwale',  role:'Administrator',       mfa:true,  scopes:['backup','download','restore-stage','restore-prod','reset-a','reset-b','reset-c']},
  {id:'STF-007', name:'Blessings Tembo', role:'Systems Administrator',mfa:true, scopes:['backup','download','restore-stage','reset-a','reset-b']},
  {id:'STF-003', name:'Tadala Msonthi',  role:'Head of Credit',      mfa:true,  scopes:['approve','restore-prod']},
  {id:'STF-004', name:'Linda Mhango',    role:'Internal Auditor',    mfa:true,  scopes:['view','download']},
  {id:'STF-009', name:'Isaac Gondwe',    role:'Managing Director',   mfa:true,  scopes:['approve','reset-c']},
  {id:'STF-006', name:'Esther Mwale',    role:'Collections Officer', mfa:false, scopes:['view']},
  {id:'STF-001', name:'Yamikani Banda',  role:'Loan Officer',        mfa:true,  scopes:['view']},
  {id:'STF-008', name:'Ruth Nyirenda',   role:'Finance Officer',     mfa:true,  scopes:['view','download']},
  {id:'STF-005', name:'Alinafe Nyirenda',role:'Customer Service',    mfa:false, scopes:['view']}
];
const STAFF_BY_ID = Object.fromEntries(DR_STAFF.map(s => [s.id, s]));
const staffName = id => (STAFF_BY_ID[id] || {}).name || (id === 'system' ? 'Scheduled job' : id);

/* the operator signed in to this screen, and the person who may approve */
const OPERATOR = 'STF-002';
const APPROVER = 'STF-003';
const SECOND_APPROVER = 'STF-009';

/* ---------------- backup types ---------------- */
const BACKUP_TYPES = [
  {id:'Database (full)',      scope:'schema + data + functions + policies', copy:true},
  {id:'Schema only',          scope:'schema, functions, policies, no rows', copy:true},
  {id:'Storage manifest',     scope:'bucket listing + checksums, not the files', copy:false},
  {id:'Pre-release point',    scope:'schema + data, held beyond retention', copy:true},
  {id:'Configuration',        scope:'settings, fee tariff, notification templates', copy:true}
];

/* ---------------- the backup history ---------------- */
const BACKUPS = [];
(function buildBackups(){
  let seq = 1001;
  const add = (o) => {
    const b = Object.assign({
      id:'BKP-2026-' + pad(seq++, 4), env:'production', actor:'system',
      protection:'Standard', encryption:'AES-256 at rest, TLS in transit',
      location:'Supabase storage · eu-west-1', tables:34, verifiedAt:'', note:''
    }, o);
    b.actorName = b.actor === 'system' ? 'Scheduled job' : staffName(b.actor);
    BACKUPS.push(b);
    return b;
  };

  /* fifteen months of daily, weekly and monthly copies, thinned out for the page */
  for(let i=118; i>=1; i--){   /* today's run is the in-progress record added below */
    const day = addDays(TODAY, -i);
    const dow = asDate(day).getDay();
    const daily = i <= 21;                       /* keep every day for three weeks */
    const weekly = dow === 0;
    const monthly = day.slice(8,10) === '01';
    if(!(daily || weekly || monthly)) continue;
    const growth = 1 + (118 - i) * 0.0022;
    const base = Math.round(498 * growth);
    if(monthly){
      add({when:day + ' 04:00', type:'Database (full)', size:base + 18, status:'Verified', verifiedAt:day + ' 04:41',
        protection:'Protected', retention:addDays(day, 365), rows:184200 + (118-i)*210, note:'Monthly — held twelve months'});
    }
    if(weekly && !monthly){
      add({when:day + ' 03:00', type:'Database (full)', size:base + 9, status:'Verified', verifiedAt:day + ' 03:38',
        protection:i > 60 ? 'Standard' : 'Protected', retention:addDays(day, 56), rows:184000 + (118-i)*210,
        note:'Weekly'});
    }
    if(daily && !weekly && !monthly){
      const failed = (i === 2);
      add({when:day + ' 02:00', type: failed ? 'Database (full)' : 'Database (full)', size: failed ? 0 : base,
        status: failed ? 'Failed' : (i <= 6 ? 'Verified' : 'Completed'),
        verifiedAt: failed ? '' : day + ' 02:' + pad(20 + (i % 19), 2),
        retention:addDays(day, 14), rows: failed ? 0 : 183800 + (118-i)*205,
        note: failed ? 'Storage quota reached mid-run — provider rejected the upload. No copy exists for this date.' : 'Daily'});
    }
  }

  /* schema-only and configuration copies around the deployments */
  const deploys = ['2026-10-28','2026-10-11','2026-09-22','2026-08-30','2026-07-19'];
  deploys.forEach((d, k) => {
    add({when:d + ' 16:40', type:'Schema only', size:2.4 + k*0.1, status:'Verified', verifiedAt:d + ' 16:52',
      retention:addDays(d, 90), tables:34, rows:0, protection:'Protected',
      note:'Taken immediately before migration ' + pad(38 + k, 4) + ' ran'});
    add({when:d + ' 16:12', type:'Pre-release point', size:Math.round(512 + k*4), status:'Verified', verifiedAt:d + ' 17:05',
      retention:addDays(d, 180), rows:180400 + k*900, protection:'Protected', actor:'STF-002',
      note:'Recovery point before app v2.' + (8 - k) + '.0 was promoted'});
  });

  /* storage manifests — metadata only */
  for(let k=0; k<6; k++){
    const d = addDays(TODAY, -(k*7 + 1));
    add({when:d + ' 05:10', type:'Storage manifest', size:0.6, status: k === 0 ? 'Verified' : 'Completed',
      verifiedAt: k === 0 ? d + ' 05:18' : '', retention:addDays(d, 30), tables:0, rows:1842 - k*11,
      protection:'Standard', note:'File names and checksums only — the objects themselves are copied weekly to the off-site bucket'});
  }

  /* a manual request and a copy still being written */
  add({when:TODAY + ' 08:15', type:'Configuration', size:0.3, status:'Verified', verifiedAt:TODAY + ' 08:19',
    retention:addDays(TODAY, 60), rows:46, actor:'STF-002',
    note:'Requested before the fee-tariff change was saved'});
  add({when:TODAY + ' 02:00', type:'Database (full)', size:0, status:'Running', retention:addDays(TODAY, 14),
    rows:0, note:'Nightly run in progress — started 02:00'});

  BACKUPS.sort((a,b) => a.when < b.when ? 1 : -1);
})();

const BK_BY_ID = Object.fromEntries(BACKUPS.map(b => [b.id, b]));
const succeeded = b => /^(Verified|Completed)$/.test(b.status);
const lastGood = () => BACKUPS.find(b => succeeded(b) && b.type === 'Database (full)');
const failedBackups = () => BACKUPS.filter(b => b.status === 'Failed');
const overdue = () => {
  const last = lastGood();
  return !last || daysBetween(last.when.slice(0,10), TODAY) > 1;
};
const backupAgeHours = () => {
  const last = lastGood();
  if(!last) return 999;
  return Math.max(0, Math.round(daysBetween(last.when.slice(0,10), TODAY) * 24 + 24 - Number(last.when.slice(11,13))));
};

/* ---------------- schedule and retention ---------------- */
const SCHEDULE = {
  dailyAt:'02:00', weekly:'Sunday 03:00', monthly:'1st of the month 04:00',
  pitrHours:7, retDaily:14, retWeekly:56, retMonthly:365,
  offsite:'Enabled — separate account', providerCount:30,
  protectedDays:30, deletion:'Soft delete 7 days, then cryptographic erase',
  lastChange:'2026-10-05 11:20', lastChangeBy:'STF-002'
};

const NEXT_RUNS = [
  {when:'2026-10-31 02:00', what:'Daily database copy', kind:'Daily', note:'Runs automatically'},
  {when:'2026-11-01 03:00', what:'Weekly full copy', kind:'Weekly', note:'Held 56 days'},
  {when:'2026-11-01 04:00', what:'Monthly full copy', kind:'Monthly', note:'Held 365 days'},
  {when:'2026-11-04 02:00', what:'Storage manifest + off-site file sync', kind:'Storage', note:'Files are not in the database copy'}
];

const PROTECTED_POINTS = BACKUPS.filter(b => b.protection === 'Protected' && b.type !== 'Storage manifest').slice(0, 8);

const RETENTION_ROWS = [
  {cls:'Daily', keep:'14 days', copies:14, oldest:'2026-10-16', deletion:'Automatic', protection:'Immutable for 7 days'},
  {cls:'Weekly', keep:'56 days', copies:8, oldest:'2026-09-04', deletion:'Automatic', protection:'Immutable for 30 days'},
  {cls:'Monthly', keep:'365 days', copies:12, oldest:'2025-11-01', deletion:'Automatic', protection:'Immutable for 30 days'},
  {cls:'Pre-release', keep:'180 days', copies:5, oldest:'2026-07-19', deletion:'Manual only', protection:'Cannot be deleted from the app'},
  {cls:'Point-in-time', keep:'7 hours', copies:0, oldest:'rolling', deletion:'Rolling window', protection:'Provider managed'},
  {cls:'Storage manifest', keep:'30 days', copies:6, oldest:'2026-09-30', deletion:'Automatic', protection:'Immutable for 7 days'}
];

/* what the scope panel states, honestly */
const SCOPE_ROWS = [
  {item:'Customers and KYC records', state:'Included', note:'Every customer row in the database copy', tone:'pass'},
  {item:'Staff profiles and roles', state:'Included', note:'Profiles, roles and capability grants', tone:'pass'},
  {item:'Loan applications, loans, disbursements', state:'Included', note:'Including approval decisions and dates', tone:'pass'},
  {item:'Repayment schedules and repayments', state:'Included', note:'With allocations and receipts', tone:'pass'},
  {item:'Payment records and the ledger', state:'Included', note:'Double-entry rows, balanced', tone:'pass'},
  {item:'Settings, fee tariff, notification templates', state:'Included', note:'Also copied separately as a configuration snapshot', tone:'pass'},
  {item:'Notifications already sent, and the delivery log', state:'Included', note:'notification_log, so a customer can be shown exactly what they were told', tone:'pass'},
  {item:'Audit and access records', state:'Included', note:'The reset proof — never rebuilt from the reset itself', tone:'pass'},
  {item:'Uploaded files (IDs, contracts, photos)', state:'Excluded from the database copy', note:'Copied separately as storage objects; a manifest records the names and checksums', tone:'warn'},
  {item:'Authentication users and password hashes', state:'Provider only', note:'Supabase auth is not part of a database export; see section 11', tone:'warn'},
  {item:'Environment variables and secrets', state:'Never copied', note:'Names are documented; values live in the encrypted store only', tone:'fail'},
  {item:'Hosting configuration (Railway)', state:'Manual copy', note:'Exported as a documented checklist, not an automated backup', tone:'warn'},
  {item:'Provider settings outside the project', state:'Not covered', note:'Domains, DNS, billing and plan settings are not in any backup', tone:'fail'}
];

/* ---------------- system artefacts (section 4) ---------------- */
const ARTEFACTS = [
  {id:'ART-01', kind:'Source code',       name:'Application repository', where:'GitHub · wwwmaryemmanuel01/golden-loan-services',
   ref:'main @ 3aaa277', when:'2026-10-30 16:00', size:'18.4 MB', mb:18.4, verified:'Verified', note:'Branches, tags and full history; also mirrored to the off-site account weekly'},
  {id:'ART-02', kind:'Source code',       name:'Off-site code mirror', where:'Backblaze B2 · separate account',
   ref:'bundle @ 3aaa277', when:'2026-10-27 03:00', size:'21.1 MB', mb:21.1, verified:'Verified', note:'Independent of the GitHub account and of Railway'},
  {id:'ART-03', kind:'Dependencies',      name:'Dependency manifests', where:'Repository · package.json + package-lock.json',
   ref:'lockfile sha 9f21c3a', when:'2026-10-28 17:12', size:'212 KB', mb:0.21, verified:'Verified', note:'Exact versions, so a rebuild is reproducible'},
  {id:'ART-04', kind:'Migrations',        name:'Database migrations', where:'Repository · /supabase/migrations',
   ref:'0042_penalty_cap_and_waivers', when:'2026-10-28 17:12', size:'1.2 MB', mb:1.2, verified:'Verified', note:'42 ordered files; the head is recorded with every recovery point'},
  {id:'ART-05', kind:'Documentation',     name:'Deployment and restore instructions', where:'Repository · /docs/runbooks',
   ref:'runbook v4', when:'2026-10-24 10:05', size:'480 KB', mb:0.47, verified:'Verified', note:'Railway deploy, Supabase connection, restore order, rollback'},
  {id:'ART-06', kind:'Configuration',     name:'Environment variable names', where:'Repository · .env.example',
   ref:'names only', when:'2026-10-28 17:12', size:'3 KB', mb:0.0, verified:'Verified', note:'Names and purpose; no value is committed anywhere'},
  {id:'ART-07', kind:'Configuration',     name:'Hosting configuration record', where:'Runbook appendix B',
   ref:'Railway service settings', when:'2026-10-24 10:05', size:'64 KB', mb:0.06, verified:'Verified', note:'Build command, start command, health check, region, domains'},
  {id:'ART-08', kind:'Content',           name:'Website content', where:'Repository · /website',
   ref:'main @ 3aaa277', when:'2026-10-30 16:00', size:'6.8 MB', mb:6.8, verified:'Verified', note:'Pages, images and copy — versioned with the code'},
  {id:'ART-09', kind:'Storage',           name:'Uploaded files', where:'Object bucket copy · off-site',
   ref:'1,842 objects', when:'2026-10-27 03:14', size:'3.4 GB', mb:3481.6, verified:'Verified', note:'Nightly incremental copy; not part of any database backup'},
  {id:'ART-10', kind:'Dependencies',      name:'Node runtime pin', where:'Repository · .nvmrc, Dockerfile',
   ref:'node 20.x', when:'2026-10-28 17:12', size:'2 KB', mb:0.0, verified:'Verified', note:'Pinned so a rebuild matches the tested runtime'},
  {id:'ART-11', kind:'Documentation',     name:'Seed and schema dump', where:'Off-site bucket',
   ref:'schema-2026.10.3.sql', when:'2026-10-29 02:44', size:'2.4 MB', mb:2.4, verified:'Verified', note:'Structure only; useful when a full copy is too large to move'},
  {id:'ART-12', kind:'Storage',           name:'Storage object manifest', where:'Off-site bucket',
   ref:'manifest-2026-10-29', when:'2026-10-29 05:10', size:'0.6 MB', mb:0.6, verified:'Completed', note:'Names, sizes and checksums for every object'}
];

const ENV_VARS = [
  {name:'SUPABASE_URL', purpose:'Project endpoint the app connects to', where:'Railway variables', required:true},
  {name:'SUPABASE_ANON_KEY', purpose:'Public key used by the browser client', where:'Railway variables + build', required:true},
  {name:'SUPABASE_SERVICE_ROLE_KEY', purpose:'Server-only key for privileged jobs', where:'Railway variables (server only)', required:true},
  {name:'DATABASE_URL', purpose:'Direct Postgres connection for migrations', where:'Railway variables', required:true},
  {name:'JWT_SECRET', purpose:'Token signing for the auth service', where:'Supabase project settings', required:true},
  {name:'SMS_GATEWAY_KEY', purpose:'Notification delivery for fee and penalty notices', where:'Railway variables', required:false},
  {name:'SMTP_PASSWORD', purpose:'Email delivery for statements and receipts', where:'Railway variables', required:false},
  {name:'BACKUP_BUCKET_KEY', purpose:'Write access to the off-site copy', where:'Railway variables (restore only)', required:false}
];

const VERSION_ROWS = PROTECTED_POINTS.slice(0, 6).map((b, i) => ({
  point:b.id, when:b.when.slice(0,10), app:'2.' + (8 - i) + '.0',
  schema:'2026.' + (10 - (i > 2 ? 1 : 0)) + '.' + (3 - i % 3),
  migration:'00' + (42 - i) + '_' + ['penalty_cap_and_waivers','fee_segments','roles_matrix','waiver_documents','staging_restore','audit_retention'][i],
  node:'20.x', status: i === 0 ? 'Current' : 'Older'
}));

/* ---------------- reset modes (section 5) ---------------- */
const RESET_MODES = [
  {id:'A', key:'preferences', name:'Interface preferences only', risk:'Low',
   permission:'Any signed-in staff member, for their own account', approval:false,
   summary:'Theme, dashboard layout, column choices and the default date range. No record of any kind is touched.',
   changes:['Theme and colour choice','Dashboard tile order','Column and density preferences','Default reporting period'],
   preserves:['Every customer, staff and loan record','All financial and audit data','All configuration'],
   minutes:'under a minute', available:true},
  {id:'B', key:'configuration', name:'Application configuration to defaults', risk:'Medium',
   permission:'Administrator', approval:true,
   summary:'Fee tariff, penalty rules, notification templates and threshold settings return to the documented defaults. Records, balances and history stay exactly as they are.',
   changes:['Fee types and rates','Penalty rules, grace and caps','Notification templates','Approval thresholds and settings'],
   preserves:['Customers, staff and loans','Repayments, disbursements, ledger','Audit records and rollforward','Charges already assessed'],
   minutes:'about 2 minutes', available:true},
  {id:'C', key:'redeploy', name:'Rebuild components and redeploy a known-good version', risk:'High',
   permission:'Administrator, approved by the Head of Credit', approval:true,
   summary:'Redeploys a tagged application version against the existing production database, after a schema-compatibility check. The database is retained, not replaced.',
   changes:['Application build and container','Frontend bundle','Runtime configuration names'],
   preserves:['The production database in full','Storage objects','Authentication users','Audit trail'],
   minutes:'8–15 minutes', available:true},
  {id:'D', key:'reinitialise', name:'Full environment reinitialisation', risk:'Critical',
   permission:'Disaster-recovery procedure only — Managing Director and Head of Credit, separately approved', approval:true,
   summary:'Destroys the database and rebuilds the environment from a verified recovery point. Offered only inside a declared disaster or a decommissioning procedure, and disabled in this interface until a separate security review signs it off.',
   changes:['Everything in the environment','Database contents','Storage objects','Authentication users'],
   preserves:['The audit trail (written to an append-only store outside the environment)','The chosen recovery point','Off-site copies'],
   minutes:'1–4 hours', available:false}
];
const MODE_BY_ID = Object.fromEntries(RESET_MODES.map(m => [m.id, m]));

const MODE_PRESERVE = [
  ['Customers and their KYC files', 'Never deleted by any mode'],
  ['Staff accounts and role grants', 'Never deleted by any mode'],
  ['Loans, schedules and disbursements', 'Never deleted by any mode'],
  ['Repayments, receipts and allocations', 'Never deleted by any mode'],
  ['The double-entry ledger', 'Never deleted by any mode'],
  ['Audit and access records', 'Written outside the environment, so a reset cannot erase them'],
  ['Charges already assessed', 'Mode B changes future rates, never past charges']
];

const MODE_ROLES = [
  {role:'Administrator', a:'Yes', b:'Yes', c:'Request', d:'No'},
  {role:'Systems Administrator', a:'Yes', b:'Yes', c:'Request', d:'No'},
  {role:'Head of Credit', a:'Yes', b:'Approve', c:'Approve', d:'Approve'},
  {role:'Managing Director', a:'Yes', b:'Approve', c:'Approve', d:'Approve + declare'},
  {role:'Internal Auditor', a:'Yes', b:'No', c:'No', d:'No'},
  {role:'Finance Officer', a:'Yes', b:'No', c:'No', d:'No'},
  {role:'Loan Officer / Collections', a:'Yes', b:'No', c:'No', d:'No'}
];

/* ---------------- protection guards (section 6) ---------------- */
const GUARDS = [
  {name:'Target environment is named on the button', state:'Holding', note:'The mode button carries the environment, e.g. “Reset configuration · Production”'},
  {name:'Production carries its own warning', state:'Holding', note:'A dark banner and a typed environment name are required'},
  {name:'Recent verified backup exists', state:'Holding', note:'Refuses to start if the newest verified database copy is older than 24 hours'},
  {name:'Recovery plan tested in the last 90 days', state:'Holding', note:'A passing restore test is required before Mode C or D'},
  {name:'Reauthentication', state:'Holding', note:'Password or passkey re-entered, not a standing session'},
  {name:'Typed confirmation', state:'Holding', note:'The environment name or the word RESET must be typed exactly'},
  {name:'Second person approval', state:'Holding', note:'Requester and approver must be different people'},
  {name:'Single-flight lock', state:'Holding', note:'One job per environment; a duplicate request is refused, not queued'},
  {name:'Idempotency key per request', state:'Holding', note:'A refresh or retry with the same key returns the existing job'},
  {name:'Transaction-safe steps', state:'Holding', note:'Each step commits or rolls back whole; no half-applied reset'},
  {name:'Audit written outside the target', state:'Holding', note:'Append-only store, so a reset cannot erase its own evidence'},
  {name:'Maintenance mode available', state:'Holding', note:'Blocks new transactions while a restore or reset runs'}
];

const PROTECT_NOTES = [
  ['Double-click and refresh', 'The button is disabled the moment the request is accepted, and the job is keyed to the request. A second click or a refresh finds the same job and reports its progress instead of starting another.'],
  ['Two tabs open', 'The single-flight lock is held on the server for the environment, not in the browser, so the second tab is refused with the run already in progress.'],
  ['Retry after a failure', 'A failed job is safe to retry: completed steps are recorded, and the retry resumes from the first step that did not commit.'],
  ['Partial resets', 'Mode B is applied as one transaction over the configuration tables. If any table fails, the whole change rolls back and the previous configuration stands.'],
  ['Financial consistency', 'No mode writes a financial row. Restoration replaces the database as a whole rather than patching balances, so the ledger cannot end up half-restored.'],
  ['Audit survivability', 'Reset and restore events are written to the append-only audit store before the run starts, so the record survives even Mode D.']
];

/* ---------------- jobs, notices, access log ---------------- */
const JOBS = [
  {id:'JOB-2026-0041', mode:'C', env:'staging', what:'Redeploy v2.8.0 to staging', status:'Success', progress:100,
   started:'2026-10-28 17:20', finished:'2026-10-28 17:31', by:'STF-002', approvedBy:'STF-003',
   key:'c-8f21-stg', note:'All checks passed; smoke tests green'},
  {id:'JOB-2026-0040', mode:'B', env:'staging', what:'Reset configuration to defaults', status:'Success', progress:100,
   started:'2026-10-21 10:02', finished:'2026-10-21 10:04', by:'STF-002', approvedBy:'STF-003',
   key:'b-71aa-stg', note:'Tariff restored to the documented default; no record touched'},
  {id:'JOB-2026-0039', mode:'A', env:'production', what:'Reset interface preferences (own account)', status:'Success', progress:100,
   started:'2026-10-19 09:12', finished:'2026-10-19 09:12', by:'STF-006', approvedBy:'—',
   key:'a-2c90-prd', note:'Layout only; nothing financial involved'},
  {id:'JOB-2026-0038', mode:'C', env:'production', what:'Redeploy v2.7.4 after a failed release', status:'Success', progress:100,
   started:'2026-10-11 18:40', finished:'2026-10-11 18:56', by:'STF-002', approvedBy:'STF-009',
   key:'c-11bd-prd', note:'Database retained; schema compatibility verified against 2026.10.2'},
  {id:'JOB-2026-0037', mode:'B', env:'production', what:'Reset configuration to defaults', status:'Refused', progress:0,
   started:'2026-10-08 14:05', finished:'2026-10-08 14:05', by:'STF-002', approvedBy:'—',
   key:'b-99f1-prd', note:'Refused: no approver named, and the newest verified copy was 31 hours old'},
  {id:'JOB-2026-0036', mode:'D', env:'staging', what:'Full reinitialisation rehearsal', status:'Success', progress:100,
   started:'2026-09-27 08:00', finished:'2026-09-27 09:47', by:'STF-002', approvedBy:'STF-009',
   key:'d-5a31-stg', note:'Rehearsal only, in staging, under the disaster-recovery procedure'}
];

const NOTICES = [
  {when:'2026-10-28 17:20', event:'Reset started', job:'JOB-2026-0041', env:'staging', to:'Administrator, Head of Credit, Internal Auditor', channel:'Email + in-app', state:'Delivered'},
  {when:'2026-10-28 17:31', event:'Reset finished', job:'JOB-2026-0041', env:'staging', to:'Administrator, Head of Credit', channel:'Email', state:'Delivered'},
  {when:'2026-10-28 02:41', event:'Backup failed', job:'BKP-2026-1096', env:'production', to:'Administrator, Systems Administrator', channel:'Email + SMS', state:'Delivered'},
  {when:'2026-10-11 18:40', event:'Production reset started', job:'JOB-2026-0038', env:'production', to:'Director, Head of Credit, Auditor', channel:'Email + SMS', state:'Delivered'},
  {when:'2026-10-11 18:56', event:'Production reset finished', job:'JOB-2026-0038', env:'production', to:'Director, Head of Credit, Auditor', channel:'Email', state:'Delivered'},
  {when:'2026-10-08 14:05', event:'Reset refused by a guard', job:'JOB-2026-0037', env:'production', to:'Administrator, Head of Credit', channel:'In-app', state:'Delivered'}
];

const ACCESS_LOG = [
  {when:'2026-10-30 08:15', actor:'STF-002', action:'Backup created', target:'BKP configuration snapshot', result:'Allowed', note:'Manual request before a tariff change'},
  {when:'2026-10-30 08:19', actor:'STF-002', action:'Backup verified', target:'BKP-2026-1001', result:'Allowed', note:'Checksum matched'},
  {when:'2026-10-29 11:02', actor:'STF-004', action:'Backup downloaded', target:'BKP-2026-1013', result:'Allowed', note:'Auditor sample; encrypted archive'},
  {when:'2026-10-28 17:20', actor:'STF-002', action:'Reset requested (Mode C)', target:'staging', result:'Allowed', note:'Approved by STF-003'},
  {when:'2026-10-28 02:41', actor:'system', action:'Backup failed', target:'BKP-2026-1096', result:'Failed', note:'Storage quota reached'},
  {when:'2026-10-27 03:14', actor:'system', action:'Storage copy', target:'1,842 objects', result:'Allowed', note:'Off-site incremental'},
  {when:'2026-10-19 09:12', actor:'STF-006', action:'Reset requested (Mode A)', target:'own preferences', result:'Allowed', note:'Interface only'},
  {when:'2026-10-18 15:47', actor:'STF-001', action:'Restore attempted', target:'production', result:'Refused', note:'No restore capability for a Loan Officer'},
  {when:'2026-10-11 18:40', actor:'STF-002', action:'Reset requested (Mode C)', target:'production', result:'Allowed', note:'Approved by STF-009'},
  {when:'2026-10-08 14:05', actor:'STF-002', action:'Reset requested (Mode B)', target:'production', result:'Refused', note:'Guard: no approver, copy older than 24h'},
  {when:'2026-10-05 11:20', actor:'STF-002', action:'Schedule changed', target:'retention policy', result:'Allowed', note:'Monthly retention raised to 365 days'},
  {when:'2026-09-27 08:00', actor:'STF-002', action:'Reset requested (Mode D)', target:'staging', result:'Allowed', note:'Rehearsal under the DR procedure'}
];
</script>
