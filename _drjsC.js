<script>
/* ============================================================
   DATA RECOVERY, SYSTEM BACKUP & FACTORY RESET (3/6)
   The scenarios, the tests, the monitors, the access matrix, the
   Supabase inventory and the implementation ledger — plus the
   live state this page mutates as an administrator uses it.
   ============================================================ */

/* ---------------- disaster scenarios (section 7) ---------------- */
const SCENARIOS = [
  {id:'SC-1', title:'Records deleted by mistake', tone:'warn', rpo:'up to 7 hours', rto:'45 minutes',
   route:'Point-in-time recovery to the minute before the deletion, or a verified daily copy.',
   recoverable:['The deleted customers, loans or repayments','Relationships and the ledger as they stood'],
   limits:['Anything entered after the chosen minute is lost','Uploaded files are recovered only if the storage copy is newer than the deletion'],
   steps:['Stop the operator’s session and confirm what was deleted and when','Pick the recovery point one minute before the earliest deleted row','Restore into staging and count the affected tables','Compare the counts against the expected numbers in this page','Restore production with a second approver, then run the smoke tests','Tell the affected customers if their records were briefly unavailable']},
  {id:'SC-2', title:'Failed deployment or incompatible update', tone:'warn', rpo:'none — no data loss', rto:'20 minutes',
   route:'Mode C: redeploy the last known-good tag against the retained database.',
   recoverable:['The previous application build','The database, untouched by the deployment'],
   limits:['Migrations that already ran must be reversed by their DOWN script, not by a restore','A deployment that wrote bad rows needs a restore as well as a redeploy'],
   steps:['Roll back the Railway deployment to the previous image','Confirm the schema head still matches the application','If a migration ran, apply its documented DOWN script','Run the smoke tests','Record the incident and the version pair that failed']},
  {id:'SC-3', title:'Corrupted data or a failed migration', tone:'fail', rpo:'up to 24 hours', rto:'2 hours',
   route:'Restore the pre-migration recovery point, or repair forward from a verified copy.',
   recoverable:['The state before the migration ran','All rows the migration should not have touched'],
   limits:['Records written after the pre-migration point are lost unless they can be replayed','A partially applied migration must be reconciled by hand before the restore'],
   steps:['Freeze writes with maintenance mode','Identify the migration and whether it committed','Restore the pre-migration point into staging and diff the affected tables','Choose repair-forward or full restore with the Head of Credit','Execute, verify, and record both the diff and the decision']},
  {id:'SC-4', title:'Hosting outage or an unavailable service', tone:'fail', rpo:'none — data safe', rto:'4 hours',
   route:'Wait out the provider, or bring the application up against a recovered database elsewhere.',
   recoverable:['The database once the provider returns','The application from source and the recovery point'],
   limits:['Nothing can be served while both Railway and Supabase are down','DNS and domain control sit with the provider and are not backed up'],
   steps:['Confirm the outage on the provider status page','Tell staff to use the paper fallback for receipts','If the outage will exceed the RTO, provision the standby from the last verified copy','Repoint the application and verify the schema version','Reconcile anything captured on paper before reopening']},
  {id:'SC-5', title:'Administrator credentials compromised', tone:'fail', rpo:'none — data safe', rto:'1 hour',
   route:'Revoke sessions and keys, rotate secrets, then review the access log for what the account did.',
   recoverable:['Every record the attacker did not alter','The full access log of what they touched'],
   limits:['A deletion made with a valid session looks like ordinary work until it is reviewed','Rotated secrets must be re-entered by hand in Railway and Supabase'],
   steps:['Disable the account and revoke every session and refresh token','Rotate the service-role key, the database password and the SMS/SMTP keys','Read the access log back to the first suspicious event','Restore any altered rows from the point before the first change','Re-enable with MFA and a fresh password, then record the incident']},
  {id:'SC-6', title:'Uploaded files lost', tone:'warn', rpo:'up to 24 hours', rto:'3 hours',
   route:'Restore the objects from the off-site bucket copy, using the manifest to find what is missing.',
   recoverable:['Every object present in the nightly copy','Names and checksums, even where a file is gone'],
   limits:['A database backup does not contain file contents','Files uploaded after the last object copy are gone','The provider’s own storage redundancy is not a backup'],
   steps:['Pull the latest storage manifest and list the missing object keys','Restore those keys from the off-site copy','Verify each checksum against the manifest','Re-link the files to their database rows','Ask customers to re-upload anything the manifest cannot match']}
];
const SC_BY_ID = Object.fromEntries(SCENARIOS.map(s => [s.id, s]));

const IR_RUNBOOK = [
  ['Detect and record', 'Log the time, the reporter and the first symptom. Nothing is deleted or restored until this entry exists.'],
  ['Protect the evidence', 'Freeze the affected account, export the access log, and note the newest verified recovery point.'],
  ['Decide the route', 'Administrator and Head of Credit choose between repair-forward, staging restore, or a production restore.'],
  ['Restore to staging first', 'Where practical, the chosen point is restored into staging and verified before production is touched.'],
  ['Approve production', 'A second, different person approves in writing — email plus the in-app approval record.'],
  ['Execute under maintenance mode', 'Writes are frozen, the restore runs, and the verification list is completed.'],
  ['Verify and reopen', 'Record counts, policies, functions, logins and reports are checked before maintenance mode is lifted.'],
  ['Notify and review', 'Affected customers and the board are told; the incident is reviewed within five working days.']
];

const LIMITS = [
  ['Authentication users', 'Supabase auth is not in a database export. Users must be re-invited or restored by the provider; passwords cannot be recovered.'],
  ['Uploaded file contents', 'Only the separate object copy holds files. Anything after the last object copy is gone.'],
  ['The last window of the morning', 'With a 7-hour point-in-time window, a fault at 23:00 can lose work back to 16:00 unless a daily copy lands first.'],
  ['Provider settings', 'Domains, DNS, billing, plan limits and organisation settings are not covered by any backup.'],
  ['Secrets', 'Environment values are stored encrypted. If the store is lost, each secret must be reissued by its owner.'],
  ['Already-applied migrations', 'A restore returns the schema to the copy’s version. Migrations that ran later must be re-applied in order.'],
  ['A green backup is not a restore', 'A successful copy only proves the file exists. Only a restore test proves it can be used.']
];

/* ---------------- recovery tests and health (section 8) ---------------- */
const TESTS = [
  {when:'2026-09-27 08:00', env:'staging', point:'BKP-2026-1008', result:'Passed', duration:'47 min', rows:'184,902', failures:'0', action:'None — accepted as the quarterly rehearsal'},
  {when:'2026-08-22 09:10', env:'staging', point:'BKP-2026-1019', result:'Passed', duration:'52 min', rows:'182,140', failures:'1', action:'Repaired a missing function grant before accepting the test'},
  {when:'2026-07-25 08:30', env:'staging', point:'BKP-2026-1031', result:'Partial', duration:'1 h 12', rows:'181,004', failures:'3', action:'Storage restore failed on 12 objects; off-site copy now verified weekly'},
  {when:'2026-06-27 09:00', env:'staging', point:'BKP-2026-1044', result:'Passed', duration:'44 min', rows:'179,660', failures:'0', action:'None'},
  {when:'2026-05-30 08:45', env:'staging', point:'BKP-2026-1057', result:'Failed', duration:'38 min', rows:'—', failures:'schema version mismatch', action:'Added the compatibility check that now blocks a mismatched restore'},
  {when:'2026-04-25 09:20', env:'staging', point:'BKP-2026-1070', result:'Passed', duration:'41 min', rows:'176,220', failures:'0', action:'None'}
];

const SMOKE = [
  {name:'Customer login', expect:'the customer sees their own loans only', state:'Pass', detail:'Session issued; no other customer visible'},
  {name:'Staff login', expect:'role lands on the right module', state:'Pass', detail:'Administrator, loan officer and auditor all verified'},
  {name:'Loan records', expect:'counts match the recovery point', state:'Pass', detail:'148 loans, 132 applications'},
  {name:'Repayment records', expect:'schedules, receipts and allocations agree', state:'Pass', detail:'1,087 repayments; allocated total equals collected'},
  {name:'Reports', expect:'the monthly and arrears reports run', state:'Pass', detail:'Both generated in under 4 seconds'},
  {name:'Fee and penalty pages', expect:'assessed equals collected plus outstanding', state:'Pass', detail:'Charge book reconciles after restore'}
];

const OBJECTIVES = [
  ['RPO', '7 hours', 'Longest acceptable data loss — the point-in-time window', 'info'],
  ['RPO (daily copy)', '24 hours', 'Fallback when the PITR window is not available', 'warn'],
  ['RTO', '4 hours', 'Longest acceptable outage for the whole platform', 'warn'],
  ['RTO (single record)', '45 minutes', 'Restore of one customer’s records from a copy', 'ok'],
  ['Test cadence', 'Quarterly', 'A restore rehearsal every three months, minimum', 'ok'],
  ['Last test', '33 days ago', 'Passed in staging on 27 Sep 2026', 'ok']
];

const HEALTH = [
  {name:'Database size', value:612, max:1024, unit:'MB', note:'Pro plan 1 GB soft limit', tone:'warn'},
  {name:'Storage used', value:3.4, max:8, unit:'GB', note:'Bucket cap 8 GB', tone:'ok'},
  {name:'Backup age', value:backupAgeHours(), max:48, unit:'h', note:'Alert above 24 hours', tone:'ok'},
  {name:'Failed jobs (30 days)', value:1, max:5, unit:'', note:'One storage-quota failure', tone:'warn'},
  {name:'Recovery tests on time', value:4, max:4, unit:'', note:'Four quarters, four tests', tone:'ok'},
  {name:'Untested copies', value:2, max:10, unit:'', note:'Two new copies await verification', tone:'warn'}
];

/* ---------------- access control (section 9) ---------------- */
const IAM_CAPS = ['View','Create backup','Download','Verify','Restore staging','Restore production','Delete copy','Reset A','Reset B','Reset C','Approve'];
const IAM_ROLES = [
  {role:'Administrator',      grants:{View:1,'Create backup':1,Download:1,Verify:1,'Restore staging':1,'Restore production':1,'Delete copy':0,'Reset A':1,'Reset B':1,'Reset C':1,Approve:0}},
  {role:'Systems Administrator', grants:{View:1,'Create backup':1,Download:1,Verify:1,'Restore staging':1,'Restore production':0,'Delete copy':0,'Reset A':1,'Reset B':1,'Reset C':0,Approve:0}},
  {role:'Head of Credit',     grants:{View:1,'Create backup':0,Download:1,Verify:1,'Restore staging':0,'Restore production':1,'Delete copy':0,'Reset A':1,'Reset B':0,'Reset C':0,Approve:1}},
  {role:'Managing Director',  grants:{View:1,'Create backup':0,Download:1,Verify:0,'Restore staging':0,'Restore production':1,'Delete copy':0,'Reset A':1,'Reset B':0,'Reset C':0,Approve:1}},
  {role:'Internal Auditor',   grants:{View:1,'Create backup':0,Download:1,Verify:1,'Restore staging':0,'Restore production':0,'Delete copy':0,'Reset A':1,'Reset B':0,'Reset C':0,Approve:0}},
  {role:'Finance Officer',    grants:{View:1,'Create backup':0,Download:1,Verify:0,'Restore staging':0,'Restore production':0,'Delete copy':0,'Reset A':1,'Reset B':0,'Reset C':0,Approve:0}},
  {role:'Loan Officer',       grants:{View:1,'Create backup':0,Download:0,Verify:0,'Restore staging':0,'Restore production':0,'Delete copy':0,'Reset A':1,'Reset B':0,'Reset C':0,Approve:0}},
  {role:'Collections Officer',grants:{View:1,'Create backup':0,Download:0,Verify:0,'Restore staging':0,'Restore production':0,'Delete copy':0,'Reset A':1,'Reset B':0,'Reset C':0,Approve:0}}
];

const SEC_CONTROLS = [
  ['Backup and restore restricted to named roles', 'pass', 'Two administrator roles hold it; nobody else can reach the screens'],
  ['Stronger authentication on sensitive actions', 'pass', 'MFA required for download, restore and every reset above Mode A'],
  ['Requester and approver are different people', 'pass', 'The approval screen refuses the requester’s own name'],
  ['Encrypted transfer and storage', 'pass', 'TLS 1.3 in transit; AES-256 at rest on both the provider and the off-site copy'],
  ['No secrets in logs or exports', 'pass', 'Tokens, passwords and keys are redacted before anything is written'],
  ['Every sensitive action logged', 'pass', 'Creation, download, deletion, restore, reset, failure and approval'],
  ['Access reviewed regularly', 'warn', 'Last review 21 Aug 2026 — next due 21 Nov 2026'],
  ['Service-role key kept off the client', 'pass', 'Server-only; the browser bundle carries the anon key alone'],
  ['Deletion needs a reason and is soft for 7 days', 'pass', 'Restorable from the protected window; then cryptographically erased']
];

const CRYPTO = [
  ['In transit', 'TLS 1.3 to Supabase and to the off-site bucket'],
  ['At rest (provider)', 'AES-256, provider-managed keys'],
  ['At rest (off-site)', 'AES-256, customer-held key held by the Head of Credit'],
  ['Downloadable copy', 'Encrypted archive; password shared out of band, never emailed with the file'],
  ['Key rotation', 'Service-role key rotated after any credential incident and every 180 days']
];

/* ---------------- dashboard links (section 10) ---------------- */
const PROCEDURES = [
  {name:'Restore from a verified point', where:'Runbook A · /docs/runbooks/restore.md', owner:'Systems Administrator', review:'2026-10-24'},
  {name:'Redeploy a known-good version', where:'Runbook B · /docs/runbooks/redeploy.md', owner:'Systems Administrator', review:'2026-10-24'},
  {name:'Declare a disaster', where:'Runbook D · /docs/runbooks/disaster.md', owner:'Managing Director', review:'2026-09-30'},
  {name:'Credential compromise', where:'Runbook E · /docs/runbooks/credentials.md', owner:'Administrator', review:'2026-08-22'}
];
const CONTACTS = [
  {who:'Chikondi Mwale · Administrator', when:'First call, any hour', how:'+265 991 000 101'},
  {who:'Blessings Tembo · Systems Administrator', when:'Technical escalation', how:'+265 991 000 107'},
  {who:'Tadala Msonthi · Head of Credit', when:'Approval and customer impact', how:'+265 991 000 103'},
  {who:'Isaac Gondwe · Managing Director', when:'Disaster declaration', how:'+265 991 000 109'},
  {who:'Supabase support', when:'Provider fault or plan limit', how:'support@supabase.com · Pro plan'}
];

/* ---------------- Supabase inventory (section 11) ---------------- */
const SUP_TABLES = [
  {name:'customers', rows:60, mb:1.2, size:'1.2 MB', backed:'Included'},
  {name:'staff_profiles', rows:27, mb:0.1, size:'0.1 MB', backed:'Included'},
  {name:'applications', rows:132, mb:4.8, size:'4.8 MB', backed:'Included'},
  {name:'loans', rows:148, mb:9.4, size:'9.4 MB', backed:'Included'},
  {name:'repayment_schedules', rows:1432, mb:22.6, size:'22.6 MB', backed:'Included'},
  {name:'repayments', rows:1087, mb:31.2, size:'31.2 MB', backed:'Included'},
  {name:'disbursements', rows:140, mb:6.1, size:'6.1 MB', backed:'Included'},
  {name:'payment_records', rows:1087, mb:18.9, size:'18.9 MB', backed:'Included'},
  {name:'fee_penalty_records', rows:934, mb:12.4, size:'12.4 MB', backed:'Included'},
  {name:'ledger_entries', rows:3602, mb:48.7, size:'48.7 MB', backed:'Included'},
  {name:'settings', rows:46, mb:0.2, size:'0.2 MB', backed:'Included'},
  {name:'notification_log', rows:318, mb:1.1, size:'1.1 MB', backed:'Included'},
  {name:'audit_log', rows:12480, mb:84.3, size:'84.3 MB', backed:'Included'},
  {name:'waivers', rows:64, mb:0.9, size:'0.9 MB', backed:'Included'},
  {name:'storage_objects', rows:1842, mb:3482, size:'3.4 GB', backed:'Separate copy'},
  {name:'auth.users',          rows:87,   mb:0.4,  size:'0.4 MB', backed:'Provider only'}
];

const SUP_FUNCTIONS = [
  {name:'fn_assess_fee',        purpose:'Raises a fee with its calculation', backed:'Included'},
  {name:'fn_assess_penalty',    purpose:'Penalty engine, capped and de-duplicated', backed:'Included'},
  {name:'fn_apply_repayment',   purpose:'Allocates a repayment across the schedule', backed:'Included'},
  {name:'fn_post_ledger',       purpose:'Writes the balanced double entry', backed:'Included'},
  {name:'fn_reverse_charge',    purpose:'Reverses a charge and recalculates the balance', backed:'Included'},
  {name:'fn_schedule_due',      purpose:'Due dates the penalty engine reads', backed:'Included'},
  {name:'fn_role_can',          purpose:'Capability check behind every policy', backed:'Included'},
  {name:'fn_audit_write',       purpose:'Append-only audit writer', backed:'Included'}
];
const BUCKETS = [
  {name:'kyc-documents', objects:642, size:'1.9 GB', copy:'Nightly off-site', public:false},
  {name:'loan-agreements', objects:388, size:'0.8 GB', copy:'Nightly off-site', public:false},
  {name:'payment-proofs', objects:512, size:'0.6 GB', copy:'Nightly off-site', public:false},
  {name:'backups', objects:31, size:'41 GB', copy:'Provider + off-site', public:false},
  {name:'website-assets', objects:300, size:'0.1 GB', copy:'With the repository', public:true}
];

const CAPABILITIES = [
  ['Scheduled daily backups', 'Available', 'Provider schedule, 02:00 UTC', 'pass'],
  ['Manual backup on demand', 'Available', 'Read-only replica export, on request', 'pass'],
  ['Point-in-time recovery', 'Available', '7-hour window on the Pro plan', 'pass'],
  ['Physical backups', 'Not available', 'Plan and provider do not expose them; logical copies are used instead', 'warn'],
  ['Storage object backup', 'Separate only', 'Provider does not back up bucket contents; an off-site copy runs nightly', 'warn'],
  ['Authentication users in a database export', 'Not included', 'Auth is provider-only: documented manual re-invite or provider restore', 'fail'],
  ['Self-service restore', 'Not available', 'Restore is a documented operator procedure, not a button', 'warn'],
  ['Backup encryption', 'Available', 'At rest and in transit; downloads are encrypted archives', 'pass']
];

const MANUAL_STEPS = [
  ['Re-invite authentication users', 'Auth users are not in the export. Each user is re-invited and sets a new password.'],
  ['Re-enter the secrets', 'No secret is in any backup. Every key and password is reissued or re-entered from its owner’s record.'],
  ['Re-point the Railway service', 'Environment values are re-entered from the documented names; a restore does not carry them.'],
  ['Re-apply later migrations', 'Any migration newer than the recovery point is re-run in order, from the repository.'],
  ['Re-sync storage objects', 'Files are restored from the off-site bucket using the manifest checksums.'],
  ['Re-check bucket policies', 'Storage policies live in SQL and come back with the database — but public/private flags are re-verified by hand.'],
  ['Re-confirm provider settings', 'Domains, DNS and plan limits are re-checked against the recorded checklist.']
];

const CONN_CHECKS = [
  ['Schema version matches the code', 'pass', PROJECT.schemaVersion + ' · migration head ' + PROJECT.migrationHead],
  ['All 8 critical functions present', 'pass', 'fn_assess_fee … fn_audit_write'],
  ['Row-level policies restored', 'pass', '34 policies, 0 disabled'],
  ['Storage policies and visibility', 'pass', '4 private buckets, 1 public asset bucket'],
  ['Auth service reachable', 'pass', 'Anon key accepted; 87 users'],
  ['Application connectivity', 'pass', 'Railway health check 200 in 120 ms'],
  ['Service-role key absent from the client bundle', 'pass', 'Searched the built assets — no match'],
  ['Duplicate assessments blocked', 'pass', 'Unique index on (loan, type, due date) present']
];

/* ---------------- implementation order and safety (section 12) ---------------- */
const IMPL_STEPS = [
  {n:1, title:'Inventory data, storage, functions, policies and hosting', status:'Done',
   detail:'34 tables, 22 functions, 34 policies, 5 buckets and the Railway service settings recorded in section 11.'},
  {n:2, title:'Define backup scope, retention and recovery objectives', status:'Done',
   detail:'Scope and exclusions in section 1; retention in section 2; RPO 7 hours and RTO 4 hours in section 8.'},
  {n:3, title:'Configure and verify secure backups', status:'Done',
   detail:'Nightly schedule, encrypted at rest, off-site copy in a separate account, 22 verified copies on file.'},
  {n:4, title:'Document and test restoration in a separate environment', status:'Done',
   detail:'Four rehearsals in staging, one partial and one failed test — both corrected, both recorded.'},
  {n:5, title:'Build backup history, status and alerting', status:'Done',
   detail:'Sections 1 and 10, with a failure alert on the 28 October run.'},
  {n:6, title:'Build controlled recovery workflows with approval and audit', status:'Done',
   detail:'Section 3: staging first, typed confirmation, second approver, post-restore verification.'},
  {n:7, title:'Add safe application-configuration reset modes', status:'Done',
   detail:'Modes A, B and C with separated permissions and staged confirmation.'},
  {n:8, title:'Add full environment reinitialisation after separate security review', status:'Pending',
   detail:'Mode D is documented but disabled. It stays disabled until the security review signs it off.'},
  {n:9, title:'Test all recovery scenarios before production use', status:'In progress',
   detail:'Four of six scenarios rehearsed; credential compromise and storage loss are scheduled.'}
];

const SAFETY_RULES = [
  ['The current project archive is the reference until the Supabase connection is verified', 'Holding'],
  ['No code, GitHub, Railway or Supabase change without explicit authorisation', 'Holding'],
  ['Existing capabilities inspected before new tables, functions or screens', 'Holding'],
  ['No destructive reset or production restore without explicit approval', 'Holding'],
  ['No recovery promised unless the backup exists and its restore is verified', 'Holding'],
  ['One step implemented and tested at a time', 'Holding']
];

const GATES = [
  {gate:'Mode D enabled', state:'Blocked', note:'Waiting on the separate security review and a fifth passing rehearsal'},
  {gate:'Production restore this quarter', state:'Cleared', note:'Approved by the Head of Credit on 27 Sep 2026'},
  {gate:'Storage copy promoted to automated', state:'In progress', note:'Nightly incremental has run 6 weeks without a gap'},
  {gate:'Auth-user recovery documented', state:'Blocked', note:'Manual re-invite only — provider limitation, not a defect'}
];

/* ---------------- the verification list after a restore (section 3) ---------------- */
const RESTORE_CHECKS = [
  {label:'Customers', expect:'60 records', got:'60', state:'Pass'},
  {label:'Staff profiles and roles', expect:'27 records', got:'27', state:'Pass'},
  {label:'Loan applications', expect:'132 records', got:'132', state:'Pass'},
  {label:'Loans', expect:'148 records', got:'148', state:'Pass'},
  {label:'Repayment schedules', expect:'1,432 rows', got:'1,432', state:'Pass'},
  {label:'Repayments and allocations', expect:'1,087 records', got:'1,087', state:'Pass'},
  {label:'Disbursements', expect:'140 records', got:'140', state:'Pass'},
  {label:'Payment records', expect:'1,087 records', got:'1,087', state:'Pass'},
  {label:'Fee and penalty records', expect:'934 records', got:'934', state:'Pass'},
  {label:'Settings and tariff', expect:'46 rows', got:'46', state:'Pass'},
  {label:'Row-level security policies', expect:'34 active, 0 disabled', got:'34 · 0', state:'Pass'},
  {label:'Database functions', expect:'22 present', got:'22', state:'Pass'},
  {label:'Authentication reachable', expect:'87 users', got:'87', state:'Pass'},
  {label:'Storage permissions', expect:'4 private, 1 public', got:'4 · 1', state:'Pass'},
  {label:'Application connectivity', expect:'health check 200', got:'200', state:'Pass'}
];

const VERIFY_AFTER = [
  ['Record counts', 'Every table counted against the recovery point — customers, staff, loans, schedules, repayments, disbursements, payments', 'pass'],
  ['Sample financial records', 'Ten payments and ten charges read end to end and reconciled by hand', 'pass'],
  ['Relationships', 'Every repayment has a loan, every loan a customer, every receipt an allocation', 'pass'],
  ['Database functions', 'All 22 present and executable by the owning role', 'pass'],
  ['Security policies', 'All 34 row-level policies active, none disabled, anon sees nothing', 'pass'],
  ['Sequences and defaults', 'Next-value sequences ahead of the highest id, defaults intact', 'pass']
];

const ROLLBACK_STEPS = [
  '<b>Do not retry blindly.</b> Read the failure step first; a second attempt against a half-restored database makes the damage harder to read.',
  '<b>Keep the failed target.</b> Take a copy of the environment as it now stands before touching it again, so the failure can be examined.',
  '<b>Fall back one point.</b> Choose the next older verified copy — never a copy that failed verification.',
  '<b>Repair forward where cheaper.</b> If only one table failed, apply the migration or patch that fixes it, with the Head of Credit’s written agreement.',
  '<b>Rebuild from source if the environment is unusable.</b> Mode C plus the pre-release point, in that order: code first, then data.',
  '<b>Record the outcome.</b> Operator, approver, point, error and decision go into the recovery log before the incident is closed.'
];

/* ---------------- the live state this page mutates ---------------- */
const DR = {
  selBackup:'', selPoint:'', filterType:'', filterStatus:'',
  filterArtifact:'', filterAudit:'',
  env:'production',
  maint:false,
  modePick:'', modeStep:0, modeTyped:'', modeApproved:'',
  runningJob:'',
  verified:{},            /* backup id → 'Verified' | 'Failed' */
  pointVerified:'',       /* recovery point checked in this session */
  restoreState:{},        /* backup id → {staged:boolean, log:[]} */
  checksRun:false,
  smokeRun:false,
  connChecked:true,
  audit:[]
};
let jobSeq = 42, auditSeq = 1;

/* the audit trail written by this session's actions */
function drAudit(kind, what, from, to, reason, lane){
  const entry = {id:'DRA-2026-' + pad(auditSeq++, 4), when:TODAY + ' ' + nowClock(),
    kind, what, from, to, by:OPERATOR, reason, lane:lane || kind,
    result:'Allowed'};
  DR.audit.unshift(entry);
  AUDIT_ALL.unshift(entry);
  return entry;
}
const AUDIT_ALL = [
  {id:'DRA-2026-0031', when:'2026-10-30 08:19', kind:'Backup', what:'Configuration snapshot verified', from:'—', to:'SHA-256 matched', by:'STF-002', reason:'Pre-change copy', lane:'Backup', result:'Allowed'},
  {id:'DRA-2026-0030', when:'2026-10-30 08:15', kind:'Backup', what:'Configuration snapshot created', from:'—', to:'BKP-2026-1001', by:'STF-002', reason:'Before a tariff change', lane:'Backup', result:'Allowed'},
  {id:'DRA-2026-0029', when:'2026-10-29 11:02', kind:'Access', what:'Backup downloaded', from:'—', to:'BKP-2026-1013', by:'STF-004', reason:'Audit sample', lane:'Access', result:'Allowed'},
  {id:'DRA-2026-0028', when:'2026-10-28 17:31', kind:'Reset', what:'Mode C redeploy finished', from:'v2.7.9', to:'v2.8.0', by:'STF-002', reason:'JOB-2026-0041', lane:'Reset', result:'Allowed'},
  {id:'DRA-2026-0027', when:'2026-10-28 17:12', kind:'Configuration', what:'Deployment promoted', from:'v2.7.9', to:'v2.8.0', by:'STF-002', reason:'Release', lane:'Configuration', result:'Allowed'},
  {id:'DRA-2026-0026', when:'2026-10-28 02:41', kind:'Backup', what:'Nightly copy failed', from:'02:00', to:'storage quota', by:'system', reason:'Provider rejected the upload', lane:'Backup', result:'Failed'},
  {id:'DRA-2026-0025', when:'2026-10-19 09:12', kind:'Reset', what:'Mode A preferences reset', from:'custom layout', to:'default layout', by:'STF-006', reason:'Own account only', lane:'Reset', result:'Allowed'},
  {id:'DRA-2026-0024', when:'2026-10-18 15:47', kind:'Restore', what:'Production restore attempted', from:'—', to:'refused', by:'STF-001', reason:'No restore capability', lane:'Restore', result:'Refused'},
  {id:'DRA-2026-0023', when:'2026-10-11 18:56', kind:'Reset', what:'Mode C production redeploy', from:'v2.7.3', to:'v2.7.4', by:'STF-002', reason:'Failed release rollback', lane:'Reset', result:'Allowed'},
  {id:'DRA-2026-0022', when:'2026-10-11 16:12', kind:'Backup', what:'Pre-release point created', from:'—', to:'BKP-2026-1008', by:'STF-002', reason:'Before v2.7.4', lane:'Backup', result:'Allowed'},
  {id:'DRA-2026-0021', when:'2026-10-08 14:05', kind:'Reset', what:'Mode B production reset refused', from:'default tariff', to:'refused', by:'STF-002', reason:'No approver; stale copy', lane:'Reset', result:'Refused'},
  {id:'DRA-2026-0020', when:'2026-10-05 11:20', kind:'Configuration', what:'Monthly retention changed', from:'180 days', to:'365 days', by:'STF-002', reason:'Board policy', lane:'Configuration', result:'Allowed'},
  {id:'DRA-2026-0019', when:'2026-09-30 10:00', kind:'Deletion', what:'Expired daily copies purged', from:'7 copies', to:'0 bytes recoverable', by:'system', reason:'Retention reached', lane:'Deletion', result:'Allowed'},
  {id:'DRA-2026-0018', when:'2026-09-27 09:47', kind:'Reset', what:'Mode D rehearsal finished', from:'staging state', to:'rebuilt from BKP-2026-1008', by:'STF-002', reason:'DR rehearsal', lane:'Reset', result:'Allowed'},
  {id:'DRA-2026-0017', when:'2026-09-27 09:52', kind:'Restore', what:'Post-restore verification', from:'—', to:'15 of 15 checks passed', by:'STF-004', reason:'Independent verification', lane:'Restore', result:'Allowed'}
];
const nowClock = () => {
  const d = new Date();
  return pad(d.getHours(),2) + ':' + pad(d.getMinutes(),2);
};
</script>
