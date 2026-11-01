<script>
/* ============================================================
   SECURITY & PROTECTION (5/7)
   5 · Sessions & devices   6 · Customer data protection
   7 · Financial transaction security   8 · Database & Supabase
   ============================================================ */

/* ===================== 5 · SESSIONS ===================== */
function renderSessions(){
  const s = secStats();
  const active = SESSIONS.filter(x => matchQ(x.name, x.device, x.place, x.role));
  el('sessPill').className = 'badge ' + (SESSIONS.some(x => !x.trusted) ? 'b-warn' : 'b-ok');
  el('sessPill').textContent = SESSIONS.length + ' open';
  el('sessKpis').innerHTML = [
    ['Active sessions', num(SESSIONS.length), `${num(SESSIONS.filter(x => x.minutes > 240).length)} running over four hours`, 'gold'],
    ['Trusted devices', num(SESSIONS.filter(x => x.trusted).length), 'Seen in the last 14 days', ''],
    ['Untrusted sessions', num(SESSIONS.filter(x => !x.trusted).length), 'Needs verification or revocation', SESSIONS.some(x => !x.trusted) ? 'red' : ''],
    ['Off-shore locations', num(SESSIONS.filter(x => /ZA|ZM|KE/.test(x.place)).length), 'Outside Malawi', ''],
    ['Revocations this month', num(REVOCATIONS.length), 'Manual and automatic', ''],
    ['Session rule', SEC_SET.session + ' min idle', `${SEC_SET.concurrent} concurrent devices`, '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join('');

  el('sessGrid').innerHTML = [
    chartBox({title:'Sessions by officer', sub:'Open sessions right now', value:num(SESSIONS.length),
      chart: chart({type:'bar', cats:SESSIONS.map(s => s.name.split(' ')[0]), h:200,
        series:[{name:'Sessions', data:SESSIONS.map(s => 1), colour:'#2F6FED'}]})}),
    chartBox({title:'Where sessions come from', sub:'Location signals', value:num(new Set(SESSIONS.map(s => s.place)).size) + ' places',
      chart: chart({type:'donut', cats:[...new Set(SESSIONS.map(s => s.place))], h:200, colours:PALETTE,
        series:[{data:[...new Set(SESSIONS.map(s => s.place))].map(pl => SESSIONS.filter(s => s.place === pl).length)}]})}),
    chartBox({title:'Session age', sub:'Minutes since sign-in', value:Math.max(...SESSIONS.map(s => s.minutes), 0) + ' min',
      chart: chart({type:'bar', cats:SESSIONS.map(s => s.name.split(' ')[0]), h:200,
        series:[{name:'Minutes', data:SESSIONS.map(s => s.minutes), colour:'#C9A227'}]})})
  ].join('');

  renderTable('sessBody', [
    {k:'name', label:'Officer'},
    {k:'device', label:'Device'},
    {k:'place', label:'Location'},
    {k:'started', label:'Started', html:v => esc(v.slice(5))},
    {k:'lastActivity', label:'Last activity'},
    {k:'trusted', label:'Trusted', html:v => badge(v ? 'Yes' : 'No', v ? 'b-ok' : 'b-warn')},
    {k:'act', label:'', html:(v, r) => `<button class="btn btn-ghost" data-sess="${r.id}">Revoke</button>`}
  ], active.map(x => Object.assign({}, x, {_open: () => openSession(x.id)})),
    {sort:'minutes', pageSize:8, onRow:true});

  const risky = SESSIONS.filter(x => !x.trusted || /ZA|ZM|KE/.test(x.place) || x.minutes > 240);
  el('sessRiskHead').innerHTML = '<tr><th>Officer</th><th>Signal</th><th>Where</th><th>Age</th></tr>';
  el('sessRiskBody').innerHTML = risky.length ? risky.map(x => `<tr>
      <td>${esc(x.name)}</td>
      <td>${esc(!x.trusted ? 'Untrusted device' : /ZA|ZM|KE/.test(x.place) ? 'Off-shore address' : 'Long-running session')}</td>
      <td>${esc(x.place)}</td><td>${x.minutes} min</td></tr>`).join('')
    : '<tr><td colspan="4" class="empty">Every session looks normal.</td></tr>';

  el('sessRules').innerHTML = SESSION_RULES.map(r => `<div class="risk">
      <div><div class="rn">${esc(r.rule)}</div><div class="rs">${esc(r.note)}</div></div>
      <div class="rv">${badge(r.value, 'b-gray')}</div></div>`).join('') +
    kvRow('Concurrent sessions per user', num(SEC_SET.concurrent)) +
    kvRow('Idle timeout', SEC_SET.session + ' minutes');

  renderTable('revokeBody', [
    {k:'when', label:'When', html:v => esc(v.slice(0, 16))},
    {k:'staff', label:'Account', html:v => esc(staffName(v))},
    {k:'scope', label:'Scope'},
    {k:'by', label:'Revoked by'},
    {k:'why', label:'Reason'}
  ], REVOCATIONS, {sort:'when', pageSize:6});
}

function openSession(id){
  const x = SESSIONS.find(s => s.id === id);
  if(!x) return;
  openModal(x.name + ' · session', x.device,
    `<div class="pfields">
      ${field('Role', esc(x.role))}
      ${field('Location', esc(x.place))}
      ${field('Address', `<span class="mono">${esc(x.ip)}</span>`)}
      ${field('Started', esc(x.started))}
      ${field('Last activity', esc(x.lastActivity))}
      ${field('Duration', x.minutes + ' minutes')}
      ${field('Trusted device', x.trusted ? badge('Yes', 'b-ok') : badge('No', 'b-warn'))}
      ${field('Browser', esc(x.browser))}
    </div>`,
    [{label:'Revoke this session', act:() => revokeSession(id)},
     {label:'Revoke all for this user', act:() => revokeUser(x.staff)},
     {label:'Close', act:'close'}]);
}
function revokeSession(id){
  const i = SESSIONS.findIndex(s => s.id === id);
  if(i < 0) return;
  const x = SESSIONS[i];
  SESSIONS.splice(i, 1);
  REVOCATIONS.unshift({when: TODAY + ' 09:20', staff: x.staff, by: 'Chikondi Mwale', scope: '1 session',
    why: 'Revoked from the security console'});
  logSec('Session ' + id + ' revoked for ' + x.name);
  closeModal(); renderAll();
  toast('Session revoked for ' + x.name);
}
function revokeUser(staff){
  const mine = SESSIONS.filter(s => s.staff === staff);
  if(!mine.length) return toast('No open sessions for that account.', 'info');
  mine.forEach(m => { const i = SESSIONS.indexOf(m); if(i >= 0) SESSIONS.splice(i, 1); });
  REVOCATIONS.unshift({when: TODAY + ' 09:22', staff, by: 'Chikondi Mwale', scope: 'All sessions',
    why: 'All sessions ended from the console'});
  logSec('All sessions revoked for ' + staffName(staff));
  closeModal(); renderAll();
  toast('All sessions ended for ' + staffName(staff));
}

/* ===================== 6 · CUSTOMER DATA PROTECTION ===================== */
function renderDataProtection(){
  const flagged = DATA_ACCESS.filter(d => !d.allowed);
  const openReqs = DATA_REQS.filter(r => r.status !== 'Completed');
  el('dataPill').className = 'badge ' + (flagged.length ? 'b-warn' : 'b-ok');
  el('dataPill').textContent = flagged.length + ' without purpose';
  el('dataAccessPill').textContent = DATA_ACCESS.length;

  el('dataKpis').innerHTML = [
    ['Records accessed', num(DATA_ACCESS.length), 'In the selected period', 'gold'],
    ['Without a stated purpose', num(flagged.length), 'Flagged for review', flagged.length ? 'red' : ''],
    ['Consent records', num(CONSENT.length), `${num(CONSENT.filter(c => c.status === 'Active').length)} active`, ''],
    ['Open data requests', num(openReqs.length), 'Correction, export and closure', openReqs.length ? 'blue' : ''],
    ['Sensitive fields masked', num(FIELD_CONTROLS.filter(f => f.status === 'Enforced').length) + ' / ' + FIELD_CONTROLS.length, 'Field-level controls live', ''],
    ['Export rules enforced', num(EXPORT_CONTROLS.filter(e => e.status === 'Pass').length) + ' / ' + EXPORT_CONTROLS.length, 'One rule still open', '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join('');

  renderTable('dataAccBody', [
    {k:'when', label:'When', html:v => esc(v.slice(0, 16))},
    {k:'who', label:'Officer'},
    {k:'record', label:'Record'},
    {k:'custName', label:'Customer'},
    {k:'purpose', label:'Purpose'},
    {k:'allowed', label:'Allowed', html:v => badge(v ? 'Yes' : 'No', v ? 'b-ok' : 'b-crit')}
  ], DATA_ACCESS.filter(d => matchQ(d.who, d.record, d.custName, d.purpose)),
    {sort:'when', pageSize:7});

  el('fieldCtlHead').innerHTML = '<tr><th>Field</th><th>Control</th><th>Who may see it</th><th>State</th></tr>';
  el('fieldCtlBody').innerHTML = FIELD_CONTROLS.map(f => `<tr><td>${esc(f.fieldName)}</td>
      <td>${esc(f.control)}</td><td>${esc(f.viewer)}</td><td>${okBadge(f.status)}</td></tr>`).join('');

  el('exportCtlHead').innerHTML = '<tr><th>Export</th><th>Rule</th><th>Test result</th><th>State</th></tr>';
  el('exportCtlBody').innerHTML = EXPORT_CONTROLS.map(e => `<tr><td>${esc(e.what)}</td>
      <td>${esc(e.rule)}</td><td>${esc(e.test)}</td><td>${okBadge(e.status)}</td></tr>`).join('');

  el('consentHead2').innerHTML = '<tr><th>Customer</th><th>Purpose</th><th>Channel</th><th>Given</th><th>State</th></tr>';
  el('consentBody2').innerHTML = CONSENT.slice(0, 10).map(c => `<tr>
      <td>${esc(custName(c.cust))}</td><td>${esc(c.purpose)}</td><td>${esc(c.channel)}</td>
      <td>${fmtDate(c.given)}</td>
      <td>${badge(c.status, c.status === 'Active' ? 'b-ok' : 'b-warn')}</td></tr>`).join('');

  el('dataReqPill').textContent = openReqs.length;
  renderTable('dataReqBody', [
    {k:'id', label:'Request'},
    {k:'kind', label:'Kind'},
    {k:'custName', label:'Customer'},
    {k:'detail', label:'Request'},
    {k:'status', label:'Status', html:v => badge(v, statTone(v))},
    {k:'act', label:'', html:(v, r) => `<button class="btn btn-ghost" data-dreq="${r.id}">${r.status === 'Completed' ? 'Reopen' : 'Progress'}</button>`}
  ], DATA_REQS.map(r => Object.assign({}, r, {custName: custName(r.cust)})), {sort:'raised', pageSize:5});

  el('closureHead').innerHTML = '<tr><th>Step</th><th>Owner</th><th>When</th><th>Notes</th></tr>';
  el('closureBody').innerHTML = CLOSURE_STEPS.map(c => `<tr><td>${esc(c.step)}</td><td>${esc(c.owner)}</td>
      <td>${esc(c.sla)}</td><td>${esc(c.note)}</td></tr>`).join('');
}

/* ===================== 7 · FINANCIAL TRANSACTION SECURITY ===================== */
function renderFinancial(){
  const breaches = APPROVALS.filter(a => a.status === 'Breach');
  const pendingRev = REVERSALS.filter(r => r.status === 'Pending');
  const pendingAdj = ADJUSTMENTS.filter(a => !a.approved);
  el('finPill').className = 'badge ' + (breaches.length ? 'b-crit' : 'b-ok');
  el('finPill').textContent = breaches.length + ' approval breaches';

  el('finKpis').innerHTML = [
    ['Cost items under test', num(APPROVALS.length + DISB_AUTH.length + REVERSALS.length), 'Approvals, payouts and reversals', 'gold'],
    ['Approval breaches', num(breaches.length), 'Approved above the officer authority', breaches.length ? 'red' : ''],
    ['Reversals pending', num(pendingRev.length), 'No second approver yet', pendingRev.length ? 'red' : ''],
    ['Adjustments pending', num(pendingAdj.length), money(sum(pendingAdj, a => a.amount)), pendingAdj.length ? 'red' : ''],
    ['Duplicate movements', num(DUPLICATE_TXNS.length), 'Same facility and amount within three days', DUPLICATE_TXNS.length ? 'blue' : ''],
    ['Duties gaps', num(SOD_CHECKS.length), 'One officer at every stage', SOD_CHECKS.length ? 'red' : '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join('');

  el('finGrid').innerHTML = [
    chartBox({title:'Approvals against authority', sub:'Facilities by result', value:num(APPROVALS.length),
      chart: chart({type:'donut', cats:['Within limit','Above limit'], h:200, colours:['#1E9E6A','#D93F3F'],
        series:[{data:[APPROVALS.filter(a => a.status === 'Compliant').length, breaches.length]}]})}),
    chartBox({title:'Money under review', sub:'Reversals and adjustments pending', value:money(sum(pendingRev, r => r.amount) + sum(pendingAdj, a => a.amount)),
      chart: chart({type:'bar', cats:['Reversals','Adjustments'], h:200,
        series:[{name:'MK', data:[sum(pendingRev, r => r.amount), sum(pendingAdj, a => a.amount)], colour:'#E08C1E'}]})}),
    chartBox({title:'Large movements', sub:'Above MK ' + num(SEC_SET.alertAmount), value:num(TXNS.filter(t => t.amount >= SEC_SET.alertAmount).length),
      chart: chart({type:'bar', cats:METHODS, h:200,
        series:[{name:'Transactions', colour:'#7C5CF0',
          data:METHODS.map(m => TXNS.filter(t => t.method === m && t.amount >= SEC_SET.alertAmount).length)}]})})
  ].join('');

  el('apprPill').textContent = breaches.length;
  renderTable('apprBody', [
    {k:'ref', label:'Facility'},
    {k:'amount', label:'Amount', num:true, html:v => money(v)},
    {k:'officer', label:'Approving officer', html:v => esc(staffName(v))},
    {k:'limit', label:'Limit', num:true, html:v => money(v)},
    {k:'second', label:'Second signature', html:v => badge(v ? 'Required' : 'Not needed', v ? 'b-warn' : 'b-gray')},
    {k:'status', label:'Result', html:v => badge(v, v === 'Compliant' ? 'b-ok' : 'b-crit')}
  ], APPROVALS.map(a => Object.assign({}, a, {_open: () => openLoan(a.ref)})), {sort:'amount', pageSize:7, onRow:true});

  el('disbAuthPill2').textContent = DISB_AUTH.filter(d => !d.ok).length;
  renderTable('disbAuthBody2', [
    {k:'ref', label:'Payout'},
    {k:'amount', label:'Amount', num:true, html:v => money(v)},
    {k:'role', label:'Released by role'},
    {k:'check', label:'Authority', html:v => badge(v, v === 'Authorised' ? 'b-ok' : 'b-crit')},
    {k:'approval', label:'Approval', html:v => badge(v, v === 'Matches approval' ? 'b-ok' : 'b-warn')}
  ], DISB_AUTH.map(d => Object.assign({}, d, {_open: () => openLoan(d.loan)})), {sort:'amount', pageSize:6, onRow:true});

  el('revPill').textContent = pendingRev.length;
  renderTable('revBody2', [
    {k:'id', label:'Reversal'},
    {k:'kind', label:'Kind'},
    {k:'amount', label:'Amount', num:true, html:v => money(v)},
    {k:'officer', label:'Requested by', html:v => esc(staffName(v))},
    {k:'status', label:'Status', html:v => badge(v, statTone(v))},
    {k:'act', label:'', html:(v, r) => r.status === 'Pending'
      ? `<button class="btn btn-ghost" data-rev="${r.id}" data-approve="1">Approve</button>` : '—'}
  ], REVERSALS, {sort:'requested', pageSize:6});

  el('adjPill').textContent = pendingAdj.length;
  renderTable('adjBody', [
    {k:'id', label:'Adjustment'},
    {k:'loan', label:'Facility'},
    {k:'amount', label:'Amount', num:true, html:v => money(v)},
    {k:'reason', label:'Reason'},
    {k:'approved', label:'Approved', html:v => badge(v ? 'Yes' : 'Pending', v ? 'b-ok' : 'b-warn')},
    {k:'act', label:'', html:(v, r) => r.approved ? '—' : `<button class="btn btn-ghost" data-adj="${r.id}">Approve</button>`}
  ], ADJUSTMENTS, {sort:'amount', pageSize:6});

  el('dupTxnPill').textContent = DUPLICATE_TXNS.length;
  renderTable('dupTxnBody', [
    {k:'a', label:'First receipt'},
    {k:'b', label:'Possible duplicate'},
    {k:'amount', label:'Amount', num:true, html:v => money(v)},
    {k:'gap', label:'Gap (days)', num:true}
  ], DUPLICATE_TXNS.map(d => Object.assign({}, d, {_open: () => openLoan(d.loan)})), {sort:'amount', pageSize:6, onRow:true});

  el('refHead2').innerHTML = '<tr><th>Transaction</th><th>Reference</th><th>Channel</th><th>Amount</th><th>Result</th></tr>';
  el('refBody2').innerHTML = REF_CHECKS.slice(0, 10).map(r => `<tr>
      <td>${esc(r.txn)}</td><td class="mono">${esc(r.reference)}</td><td>${esc(r.channel)}</td>
      <td class="num">${money(r.amount)}</td>
      <td>${badge(r.result, r.result === 'Verified' ? 'b-ok' : 'b-warn')}</td></tr>`).join('');

  el('sodPill2').textContent = SOD_CHECKS.length;
  renderTable('sodBody2', [
    {k:'loan', label:'Facility'},
    {k:'officer', label:'Officer', html:v => esc(staffName(v))},
    {k:'stage', label:'Stages handled'},
    {k:'receipts', label:'Receipts', num:true}
  ], SOD_CHECKS.map(r => Object.assign({}, r, {_open: () => openLoan(r.loan)})), {sort:'receipts', pageSize:6, onRow:true});

  const large = TXNS.filter(t => t.amount >= SEC_SET.alertAmount);
  el('largePill2').textContent = large.length;
  el('largeHead2').innerHTML = '<tr><th>Transaction</th><th>Type</th><th>Amount</th><th>Channel</th><th>Date</th></tr>';
  el('largeBody2').innerHTML = large.slice(0, 8).map(t => `<tr>
      <td>${esc(t.ref)}</td><td>${esc(t.type)}</td><td class="num">${money(t.amount)}</td>
      <td>${esc(t.method)}</td><td>${fmtDate(t.date)}</td></tr>`).join('');

  renderTable('finAuditBody', [
    {k:'when', label:'When', html:v => fmtDate(v)},
    {k:'ref', label:'Transaction'},
    {k:'kind', label:'Type'},
    {k:'amount', label:'Amount', num:true, html:v => money(v)},
    {k:'actor', label:'Actor'},
    {k:'approval', label:'Approval'},
    {k:'status', label:'Status', html:v => badge(v, /Posted|Success/.test(v) ? 'b-ok' : 'b-warn')}
  ], FIN_AUDIT, {sort:'amount', pageSize:7});
}

function approveReversal(id){
  const r = REVERSALS.find(x => x.id === id);
  if(!r) return;
  r.status = 'Approved'; r.approver = 'STF-003';
  logSec('Reversal ' + id + ' approved by a second officer');
  renderAll(); toast(id + ' approved — the reversal will post tonight');
}
function approveAdjustment(id){
  const a = ADJUSTMENTS.find(x => x.id === id);
  if(!a) return;
  a.approved = true;
  logSec('Adjustment ' + id + ' approved');
  renderAll(); toast(id + ' approved');
}

/* ===================== 8 · DATABASE & SUPABASE ===================== */
function renderDatabase(){
  const gaps = DB_TABLES.filter(t => t.rls !== 'Enabled');
  const exposed = SECRETS.filter(s => s.exposed);
  el('dbSecPill').className = 'badge ' + (gaps.length ? 'b-warn' : 'b-ok');
  el('dbSecPill').textContent = gaps.length ? gaps.length + ' RLS gap' : 'All policies enforced';

  el('dbKpis').innerHTML = [
    ['Connection status', DB.status, `${DB.engine} · ${DB.latency}`, 'gold'],
    ['Tables with RLS', num(DB_TABLES.filter(t => t.rls === 'Enabled').length) + ' / ' + DB_TABLES.length, 'Row-level security enforced', gaps.length ? 'red' : ''],
    ['Database functions', num(DB_FUNCS.length), `${num(DB_FUNCS.filter(f => f.risk === 'High').length)} high risk`, ''],
    ['Keys exposed', num(exposed.length), 'Found in a log or bundle', exposed.length ? 'red' : ''],
    ['Errors (24 h)', num(DB.errors24h), `${num(DB_ERRORS.length)} distinct in the period`, ''],
    ['Uptime (30 days)', DB.uptime, 'Managed Postgres', '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join('');

  el('dbGrid').innerHTML = [
    chartBox({title:'Row-level security coverage', sub:'Tables with a policy', value:num(DB_TABLES.filter(t => t.rls === 'Enabled').length) + ' of ' + DB_TABLES.length,
      chart: chart({type:'bar', cats:['Enforced','Gap'], h:200,
        series:[{name:'Tables', colour:'#1E9E6A',
          data:[DB_TABLES.filter(t => t.rls === 'Enabled').length, gaps.length]}]})}),
    chartBox({title:'Errors by SQLSTATE', sub:'What the database refused', value:num(sum(DB_ERRORS, e => e.count)),
      chart: chart({type:'bar', cats:DB_ERRORS.map(e => e.code), h:200,
        series:[{name:'Count', data:DB_ERRORS.map(e => e.count), colour:'#E08C1E'}]})}),
    chartBox({title:'Function risk', sub:'Database functions by risk', value:num(DB_FUNCS.length),
      chart: chart({type:'donut', cats:['Low','High'], h:200, colours:['#1E9E6A','#D93F3F'],
        series:[{data:[DB_FUNCS.filter(f => f.risk === 'Low').length, DB_FUNCS.filter(f => f.risk === 'High').length]}]})})
  ].join('');

  el('rlsPill').textContent = gaps.length;
  renderTable('rlsBody', [
    {k:'table', label:'Table'},
    {k:'rls', label:'RLS', html:v => badge(v, v === 'Enabled' ? 'b-ok' : 'b-crit')},
    {k:'policy', label:'Policy'},
    {k:'lastAudit', label:'Last audited', html:v => fmtDate(v)}
  ], DB_TABLES, {sort:'table', pageSize:8});

  el('dbPermHead').innerHTML = '<tr><th>Role</th><th>Table</th><th>Grants</th><th>Note</th></tr>';
  el('dbPermBody').innerHTML = [
    ['anon','customers','none','Public key cannot read a row'],
    ['authenticated','customers','select, update (masked)','RLS narrows to the branch'],
    ['authenticated','staff_profiles','select (self)','Administrators read the branch'],
    ['authenticated','audit_log','select','Compliance and administrators only'],
    ['service_role','all','all','Server-side only, never in the browser'],
    ['anon','settings','none','Policy blocks anonymous access'],
    ['authenticated','settings','select','Too broad — the gap above']
  ].map(([r, t, g, n]) => `<tr><td class="mono">${esc(r)}</td><td>${esc(t)}</td>
      <td>${badge(g, g === 'none' ? 'b-ok' : 'b-gray')}</td><td>${esc(n)}</td></tr>`).join('');

  el('dbFuncHead').innerHTML = '<tr><th>Function</th><th>Definer</th><th>Search path</th><th>Granted to</th><th>Risk</th></tr>';
  el('dbFuncBody').innerHTML = DB_FUNCS.map(f => `<tr><td class="mono">${esc(f.name)}</td>
      <td>${esc(f.definer)}</td>
      <td>${badge(f.searchPath, f.searchPath === 'Fixed' ? 'b-ok' : 'b-crit')}</td>
      <td>${esc(f.grant)}</td><td>${badge(f.risk, f.risk === 'High' ? 'b-crit' : 'b-ok')}</td></tr>`).join('');

  el('keyPill').textContent = exposed.length;
  el('keyHead').innerHTML = '<tr><th>Key</th><th>Scope</th><th>Where it lives</th><th>Exposed</th></tr>';
  el('keyBody').innerHTML = SECRETS.map(s => `<tr><td class="mono">${esc(s.name)}</td>
      <td>${badge(s.scope, s.scope === 'server' ? 'b-ok' : 'b-gray')}</td>
      <td>${esc(s.storage)}</td>
      <td>${s.exposed ? badge('Yes', 'b-crit') : badge('No', 'b-ok')}</td></tr>`).join('');

  renderTable('dbErrBody', [
    {k:'when', label:'When', html:v => fmtDate(v)},
    {k:'code', label:'SQLSTATE'},
    {k:'what', label:'Error'},
    {k:'count', label:'Count', num:true},
    {k:'handled', label:'Handled', html:v => badge(v, v === 'Yes' ? 'b-ok' : 'b-crit')}
  ], DB_ERRORS, {sort:'count', pageSize:6});

  el('dbCfgHead').innerHTML = '<tr><th>Check</th><th>Value</th><th>State</th></tr>';
  el('dbCfgBody').innerHTML = DB_CONFIG.map(c => `<tr><td>${esc(c.check)}</td><td>${esc(c.value)}</td>
      <td>${okBadge(c.status)}</td></tr>`).join('');
}
</script>
