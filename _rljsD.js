<script>
/* ============================================================
   STAFF ROLES & PERMISSIONS (4/6)
   Sections 5–8: separation of duties, enforcement in the backend
   and RLS, restricted data, and the access reviews with leavers.
   ============================================================ */

/* ---------------- 5 · SEPARATION OF DUTIES ---------------- */
function renderDuties(){
  const separated = SOD.filter(s => s.status === 'Separated').length;
  const compensating = SOD.filter(s => s.status === 'Compensating').length;
  if(el('sodPill')) el('sodPill').textContent = separated + ' of ' + SOD.length + ' separated';
  put('sodKpis', [
    ['Conflict pairs', num(SOD.length), 'Duties that must not sit together', 'gold'],
    ['Cleanly separated', num(separated), 'Held by different roles by design', 'green'],
    ['Compensating controls', num(compensating), 'Separated by a second signature instead', 'amber'],
    ['Actions refused', num(SOD_BLOCKED.length), 'In the last 90 days', 'red'],
    ['Value kept apart', money(sum(SOD_BLOCKED, b => b.amount)), 'Not moved by a single person', ''],
    ['Roles holding a pair', num(uniqueRolesHolding()), 'Each with a named control', '']
  ].map(([l, v, s, k]) => kpiCard(l, v, s, k)).join(''));

  if(el('sodCount')) el('sodCount').textContent = num(SOD.length) + ' pairs';
  renderTable('sodBody', [
    { k:'id', label:'Rule' },
    { k:'pair', label:'The two duties' },
    { k:'control', label:'How they are held apart' },
    { k:'status', label:'State', html: v => okb(v) }
  ], SOD);

  if(el('sodBlockPill')) el('sodBlockPill').textContent = num(SOD_BLOCKED.length) + ' refused';
  renderTable('sodBlockBody', [
    { k:'when', label:'When', html: v => esc(fmtWhen(v)) },
    { k:'staff', label:'Officer', html: v => esc(staffName(v)) },
    { k:'action', label:'Attempted' },
    { k:'amount', label:'Amount', num: true, html: v => money(v) },
    { k:'reason', label:'Why it was refused' }
  ], SOD_BLOCKED);

  if(el('sodHoldPill')) el('sodHoldPill').textContent = num(SOD_HOLDERS.length) + ' roles';
  renderTable('sodHoldBody', [
    { k:'code', label:'Role', html: v => esc(roleName(v) + ' (' + v + ')') },
    { k:'pair', label:'The pair it carries' },
    { k:'control', label:'Compensating control' },
    { k:'status', label:'State', html: v => okb(v) }
  ], SOD_HOLDERS);
}
function uniqueRolesHolding(){
  const set = new Set();
  ROLES.forEach(role => SOD.forEach(r => {
    const x = levelOf(role.code, r.a), y = levelOf(role.code, r.b);
    if(x !== 'None' && y !== 'None') set.add(role.code);
  }));
  return set.size;
}

/* ---------------- 6 · ENFORCEMENT ---------------- */
function renderEnforcement(){
  const passed = POLICIES.filter(p => p.result === 'Passed').length;
  const tests = ENF_TESTS.filter(t => t.result === 'Passed').length;
  if(el('enfPill')){ el('enfPill').className = 'badge b-ok'; el('enfPill').textContent = passed + ' of ' + POLICIES.length + ' passing'; }
  put('enfKpis', [
    ['Policies and functions', num(POLICIES.length), 'On the tables that carry money', 'gold'],
    ['Passing', num(passed), 'Each tested as the least-privileged role', 'green'],
    ['Interface-only gaps closed', num(GAPS.length), 'Hiding a button is not a control', 'green'],
    ['Tests in the suite', num(ENF_TESTS.length), 'Re-run on every deploy', ''],
    ['Secrets outside the browser', num(SECRETS.filter(s => s.ok).length) + ' / ' + num(SECRETS.length), 'Service-role key never shipped', ''],
    ['Tables under RLS', '9', 'Loans, repayments, payroll, staff, audit, customers, website and more', '']
  ].map(([l, v, s, k]) => kpiCard(l, v, s, k)).join(''));

  if(el('enfCount')) el('enfCount').textContent = num(POLICIES.length) + ' policies';
  renderTable('enfBody', [
    { k:'table', label:'Table' },
    { k:'policy', label:'Policy' },
    { k:'op', label:'Operation' },
    { k:'rule', label:'The rule itself' },
    { k:'where', label:'Runs in', html: v => ENF[v] || badge(v) },
    { k:'tested', label:'Tested', html: v => esc(fmtDate(v)) },
    { k:'result', label:'Result', html: v => okb(v) }
  ], POLICIES);

  if(el('enfTestPill')) el('enfTestPill').textContent = tests + ' / ' + ENF_TESTS.length;
  put('enfTests', ENF_TESTS.map(t => `<div class="checkrow">
      <div class="ck ${t.result === 'Passed' ? 'pass' : 'fail'}">${t.result === 'Passed' ? '✓' : '✕'}</div>
      <div class="cl">${esc(t.name)}<div class="qhint" style="margin:0">as ${esc(t.role)} · expected ${esc(t.expect)}</div></div>
      <div class="cn">${esc(fmtDate(t.when))}</div>
    </div>`).join(''));

  if(el('enfSecretPill')) el('enfSecretPill').textContent = SECRETS.filter(s => s.ok).length + ' / ' + SECRETS.length + ' safe';
  put('enfSecrets', SECRETS.map(s => `<div class="checkrow">
      <div class="ck ${s.ok ? 'pass' : 'fail'}">${s.ok ? '✓' : '✕'}</div>
      <div class="cl">${esc(s.name)}<div class="qhint" style="margin:0">${esc(s.note)}</div></div>
      <div class="cn">${esc(s.where)}</div>
    </div>`).join(''));

  if(el('enfGapPill')) el('enfGapPill').textContent = num(GAPS.length) + ' closed';
  renderTable('enfGapBody', [
    { k:'rule', label:'What was fixed' },
    { k:'before', label:'Before' },
    { k:'now', label:'Now' },
    { k:'status', label:'State', html: v => okb(v) }
  ], GAPS);
}

/* ---------------- 7 · RESTRICTED DATA ---------------- */
function renderData(){
  const restricted = DATA_CLASS.filter(d => d.level === 'Secret' || d.level === 'Restricted').length;
  if(el('datPill')) el('datPill').textContent = num(DATA_CLASS.length) + ' classes';
  put('datKpis', [
    ['Data classes', num(DATA_CLASS.length), 'Each with its own rule', 'gold'],
    ['Secret or restricted', num(restricted), 'Credentials, identity, payroll', 'red'],
    ['Enforced in the database', num(DATA_CLASS.filter(d => d.where === 'RLS').length), 'Not in the page', 'green'],
    ['Roles with payroll access', num(DATA_CLASS[0].roles.length), 'The system administrator is not one', ''],
    ['Restricted reads logged', num(DATA_LOG.length), 'This month, with a reason', ''],
    ['Masked fields', '4', 'Phone, ID, payroll amount, approval note', '']
  ].map(([l, v, s, k]) => kpiCard(l, v, s, k)).join(''));

  if(el('datCount')) el('datCount').textContent = num(DATA_CLASS.length) + ' classes';
  renderTable('datBody', [
    { k:'category', label:'Category' },
    { k:'level', label:'Classification', html: v => badge(v, v === 'Secret' ? 'b-crit' : v === 'Restricted' ? 'b-crit' : v === 'Confidential' ? 'b-warn' : 'b-gray') },
    { k:'roles', label:'Roles allowed', html: v => v.map(c => `<span class="badge b-gray" title="${esc(roleName(c))}">${c}</span>`).join(' ') },
    { k:'mask', label:'Masking' },
    { k:'where', label:'Enforced in', html: v => ENF[v] || badge(v) },
    { k:'note', label:'Note' }
  ], DATA_CLASS);

  if(el('datLogPill')) el('datLogPill').textContent = num(DATA_LOG.length) + ' reads';
  renderTable('datLogBody', [
    { k:'when', label:'When', html: v => esc(fmtWhen(v)) },
    { k:'staff', label:'Officer', html: v => esc(staffName(v) + ' · ' + staffRole(v)) },
    { k:'record', label:'Record opened' },
    { k:'reason', label:'Reason given' }
  ], DATA_LOG);

  if(el('datMaskPill')) el('datMaskPill').textContent = MASK_SAMPLE.length + ' fields';
  put('datMask', `<div class="tblwrap" style="max-height:none;border:0"><table class="tbl2 dense">
      <thead><tr><th>Field</th><th>Support officer sees</th><th>Auditor sees</th></tr></thead>
      <tbody>${MASK_SAMPLE.map(m => `<tr>
        <td><b>${esc(m.field)}</b></td>
        <td>${esc(m.support)}</td>
        <td class="mono">${esc(m.auditor)}</td></tr>`).join('')}</tbody></table></div>
    <div class="qhint" style="margin-top:6px">Support is masked in the database, not in the page: the value never leaves Postgres.</div>`);
}

/* ---------------- 8 · ACCESS REVIEWS ---------------- */
function renderReviews(){
  const findings = sum(REVIEWS, r => r.findings);
  const changes = sum(REVIEWS, r => r.changes);
  const sameDay = LEAVERS.filter(l => l.status === 'Immediate').length;
  const avgDays = (() => {
    const d = LEAVERS.map(l => daysBetween(l.left, l.cut));
    return d.length ? (sum(d) / d.length) : 0;
  })();
  if(el('revPill')) el('revPill').textContent = num(REVIEWS.length) + ' rounds';
  put('revKpis', [
    ['Review rounds', num(REVIEWS.length), 'Quarterly, plus a privileged round', 'gold'],
    ['Findings raised', num(findings), 'Across this year', 'amber'],
    ['Changes made', num(changes), 'Every finding closed with an action', ''],
    ['Leavers', num(LEAVERS.length), sameDay + ' cut the same day', ''],
    ['Average removal', avgDays.toFixed(1) + ' days', 'Target is under one working day', 'green'],
    ['Shared logins', '0', 'One account per person, without exception', 'green']
  ].map(([l, v, s, k]) => kpiCard(l, v, s, k)).join(''));

  if(el('revCount')) el('revCount').textContent = num(REVIEWS.length) + ' rounds';
  renderTable('revBody', [
    { k:'id', label:'Round' },
    { k:'period', label:'Period' },
    { k:'reviewer', label:'Reviewer', html: v => esc(staffName(v)) },
    { k:'covered', label:'Roles covered', num: true },
    { k:'findings', label:'Findings', num: true },
    { k:'changes', label:'Changes', num: true },
    { k:'status', label:'State', html: v => okb(v) }
  ], REVIEWS);

  if(el('leaverPill')) el('leaverPill').textContent = num(LEAVERS.length) + ' leavers';
  renderTable('leaverBody', [
    { k:'staff', label:'Officer', html: (v, r) => esc((LEAVER_NAMES[v] || staffName(v)) + ' · ' + r.role) },
    { k:'left', label:'Left on', html: v => esc(fmtDate(v)) },
    { k:'cut', label:'Access cut', html: v => esc(fmtDate(v)) },
    { k:'lag', label:'Took', num: true, html: (v, r) => daysBetween(r.left, r.cut) + 'd' },
    { k:'sessions', label:'Sessions', num: true },
    { k:'status', label:'State', html: v => badge(v, v === 'Immediate' ? 'b-ok' : 'b-warn') }
  ], LEAVERS.map(l => Object.assign({}, l, { lag: daysBetween(l.left, l.cut) })));

  if(el('chgPill')) el('chgPill').textContent = num(ROLE_CHANGES.length) + ' changes';
  renderTable('chgBody', [
    { k:'when', label:'When', html: v => esc(fmtDate(v)) },
    { k:'staff', label:'Officer', html: v => esc(staffName(v)) },
    { k:'move', label:'Role change', html: (v, r) => esc(roleName(r.from) + (r.from === r.to ? ' · scope change' : ' → ' + roleName(r.to))) },
    { k:'by', label:'By', html: v => esc(staffName(v)) },
    { k:'sessions', label:'Sessions ended', num: true },
    { k:'status', label:'Reason' }
  ], ROLE_CHANGES);

  if(el('acctPill')) el('acctPill').textContent = num(ACCOUNTS.length) + ' accounts · 0 shared';
  renderTable('acctBody', [
    { k:'id', label:'Account' },
    { k:'name', label:'Officer' },
    { k:'code', label:'Role', html: v => esc(roleName(v)) },
    { k:'mfa', label:'MFA', html: v => v ? badge('Enrolled','b-ok') : badge('Missing','b-crit') },
    { k:'status', label:'State', html: v => okb(v) },
    { k:'shared', label:'Shared login', html: v => v ? badge('Shared','b-crit') : badge('Individual','b-ok') },
    { k:'reviewed', label:'Last reviewed', html: v => esc(fmtDate(v)) }
  ], ACCOUNTS);
}
</script>
