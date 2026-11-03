<script>
/* ============================================================
   STAFF ROLES & PERMISSIONS (5/6)
   Sections 9–11: emergency administrator access, the ten essential
   rules with their evidence, and the permission audit trail.
   ============================================================ */

/* ---------------- 9 · EMERGENCY ACCESS ---------------- */
function renderEmergency(){
  const used = EMERGENCY.filter(e => e.used).length;
  const longest = Math.max(...EMERGENCY.map(e => minutesBetween(e.start, e.end)));
  if(el('emgPill')) el('emgPill').textContent = num(EMERGENCY.length) + ' requests';
  put('emgKpis', [
    ['Break-glass requests', num(EMERGENCY.length), 'In the last 90 days', 'gold'],
    ['Granted and used', num(used), 'Each with a named approver', ''],
    ['Longest window', (longest / 60).toFixed(1) + 'h', 'The cap is four hours', 'green'],
    ['Expired unused', num(EMERGENCY.filter(e => !e.used).length), 'The window closed on its own', 'green'],
    ['Standing super-admin logins', '0', 'Nobody shares one', 'green'],
    ['Reviews filed', num(EMERGENCY.filter(e => e.state === 'Closed').length), 'Within five working days', '']
  ].map(([l, v, s, k]) => kpiCard(l, v, s, k)).join(''));

  if(el('emgCount')) el('emgCount').textContent = num(EMERGENCY.length) + ' requests';
  renderTable('emgBody', [
    { k:'id', label:'Request' },
    { k:'staff', label:'Who asked', html: v => esc(staffName(v)) },
    { k:'reason', label:'Why' },
    { k:'scope', label:'Scope' },
    { k:'grantedBy', label:'Approved by', html: v => esc(staffName(v)) },
    { k:'window', label:'Window', html: (v, r) => esc(fmtWhen(r.start).slice(0, 22) + ' → ' + String(r.end).slice(11, 16)) },
    { k:'state', label:'State', html: v => okb(v) }
  ], EMERGENCY.map(e => Object.assign({}, e, {
    window: minutesBetween(e.start, e.end) + ' min'
  })));

  if(el('emgStandPill')) el('emgStandPill').textContent = '0 standing';
  el('emgStandBody').innerHTML = `<tr><td colspan="3" class="empty">No standing super-admin account exists. Elevation is requested per incident and expires on its own.</td></tr>`;

  if(el('emgCtrlPill')) el('emgCtrlPill').textContent = num(EMG_CONTROLS.length) + ' controls';
  put('emgControls', EMG_CONTROLS.map((c, i) => `<div class="rulerow">
      <div class="rn-no">${i + 1}</div>
      <div class="rn-body"><div class="rn-text" style="margin-top:0">${esc(c)}</div></div>
    </div>`).join(''));
}
function minutesBetween(a, b){
  const A = new Date(String(a).replace(' ', 'T') + ':00');
  const B = new Date(String(b).replace(' ', 'T') + ':00');
  const m = Math.round((B - A) / 60000);
  return isFinite(m) && m > 0 ? m : 0;
}

/* ---------------- 10 · THE TEN RULES ---------------- */
function renderRules(){
  const enforced = RULES.filter(r => r.state === 'Enforced').length;
  if(el('rulePill')){ el('rulePill').className = 'badge b-ok'; el('rulePill').textContent = enforced + ' of ' + RULES.length + ' enforced'; }
  put('ruleKpis', [
    ['Rules', num(RULES.length), 'The essential set', 'gold'],
    ['Enforced', num(enforced), 'With evidence behind each', 'green'],
    ['Enforced in the database', num(RULES.filter(r => r.where === 'RLS' || r.where === 'Function' || r.where === 'Edge function').length), 'Not in the page', ''],
    ['Owned by a named person', num(unique(RULES.map(r => r.owner)).length), 'Accountable, not "the team"', ''],
    ['Verified this month', num(RULES.filter(r => daysBetween(r.checked, TODAY) <= 31).length), 'Every rule re-checked', ''],
    ['Open gaps', num(RULES.filter(r => r.state === 'Gap').length), 'None outstanding', 'green']
  ].map(([l, v, s, k]) => kpiCard(l, v, s, k)).join(''));

  if(el('ruleCount')) el('ruleCount').textContent = num(RULES.length) + ' rules';
  put('ruleList', RULES.map(r => `<div class="rulerow" data-rule="${r.n}">
      <div class="rn-no">${r.n}</div>
      <div class="rn-body">
        <div class="rn-title">${esc(r.rule)}</div>
        <div class="rn-text">${esc(r.text)}</div>
        <div class="rn-meta">
          ${ENF[r.where] || badge(r.where)}
          ${badge(r.state, r.state === 'Enforced' ? 'b-ok' : r.state === 'Partial' ? 'b-warn' : 'b-crit')}
          <span class="badge b-gray">${esc(r.evidence)}</span>
        </div>
      </div>
    </div>`).join(''));
  el('ruleList').querySelectorAll('[data-rule]').forEach(row => {
    row.onclick = () => {
      const r = RULES.find(x => x.n === Number(row.dataset.rule));
      if(!r) return;
      openModal('Rule ' + r.n + ' · ' + r.rule, 'The essential security rules',
        `<div class="recsheet"><div class="recgrid">
          <div class="pfield"><div class="pk">Rule</div><div class="pv">${esc(r.rule)}</div></div>
          <div class="pfield"><div class="pk">What it means</div><div class="pv">${esc(r.text)}</div></div>
          <div class="pfield"><div class="pk">Enforced in</div><div class="pv">${esc(r.where)}</div></div>
          <div class="pfield"><div class="pk">Evidence</div><div class="pv">${esc(r.evidence)}</div></div>
          <div class="pfield"><div class="pk">State</div><div class="pv">${esc(r.state)}</div></div>
          <div class="pfield"><div class="pk">Owner</div><div class="pv">${esc(staffName(r.owner))}</div></div>
          <div class="pfield"><div class="pk">Last verified</div><div class="pv">${esc(fmtDate(r.checked))}</div></div>
        </div></div>`,
        [{ label:'Print', act: () => printTable('Rule ' + r.n + ' · ' + r.rule, [{ label:'Field' }, { label:'Value' }],
          [['Rule', r.rule], ['Meaning', r.text], ['Enforced in', r.where], ['Evidence', r.evidence],
           ['State', r.state], ['Owner', staffName(r.owner)], ['Verified', fmtDate(r.checked)]]) },
         { label:'Close', act:'close', cls:'btn-gold' }]);
    };
  });

  if(el('ruleTblPill')) el('ruleTblPill').textContent = num(RULES.length) + ' rows';
  renderTable('ruleBody', [
    { k:'n', label:'#' },
    { k:'rule', label:'Rule' },
    { k:'where', label:'Enforced in', html: v => ENF[v] || badge(v) },
    { k:'state', label:'State', html: v => okb(v) },
    { k:'owner', label:'Owner', html: v => esc(staffName(v)) },
    { k:'checked', label:'Verified', html: v => esc(fmtDate(v)) }
  ], RULES);
}

/* ---------------- 11 · AUDIT TRAIL ---------------- */
function audFiltered(){
  const role = el('audRole') ? el('audRole').value : '';
  const result = el('audResult') ? el('audResult').value : '';
  const q = (el('globalSearch') ? el('globalSearch').value : '').trim().toLowerCase();
  return AUDIT_SORTED.filter(a => {
    if(role && a.actorRole !== role) return false;
    if(result && a.result !== result) return false;
    if(q){
      const hay = [a.id, staffName(a.actor), a.action, a.cap, a.target, a.reason, roleName(a.actorRole)].join(' ').toLowerCase();
      if(hay.indexOf(q) < 0) return false;
    }
    return true;
  });
}
function renderAudit(){
  const list = audFiltered();
  if(el('audPill')) el('audPill').textContent = num(AUDIT.length) + ' entries';
  if(el('audRole') && !el('audRole').options.length){
    el('audRole').innerHTML = '<option value="">Every role</option>' +
      ROLES.map(r => `<option value="${r.code}">${esc(r.name)}</option>`).join('');
  }
  if(el('audCount')) el('audCount').textContent = num(list.length) + ' shown';

  renderTable('audBody', [
    { k:'when', label:'When', html: v => esc(fmtWhen(v)) },
    { k:'id', label:'Entry' },
    { k:'actor', label:'Actor', html: (v, r) => esc(staffName(v) + ' · ' + r.actorRole) },
    { k:'action', label:'Action' },
    { k:'cap', label:'Capability' },
    { k:'target', label:'Target', html: v => esc(staffName(v)) },
    { k:'result', label:'Result', html: v => okb(v) }
  ], list);

  const byMonth = MONTHS12.slice(-6);
  put('audGrid',
    chartCard({ title:'Events by month', sub:'Grants, revocations and refusals', type:'bar', h:190,
      cats: byMonth.map(monthLabel), value: num(AUDIT.length),
      series:[{ name:'Events', data: byMonth.map(m => AUDIT.filter(a => a.when.slice(0, 7) === m).length), colour:'#C9A227' }] }) +
    chartCard({ title:'Outcome', sub:'Allowed, refused and pending', type:'donut', h:190,
      cats:['Allowed','Refused','Pending'], value: num(AUDIT.length),
      series:[{ name:'Outcome', data:['Allowed','Refused','Pending'].map(s => AUDIT.filter(a => a.result === s).length) }] }) +
    chartCard({ title:'Who is acting', sub:'Events by role of the actor', type:'bar', h:190,
      cats: ROLES.map(r => r.code), value: num(unique(AUDIT.map(a => a.actor)).length) + ' people',
      series:[{ name:'Events', data: ROLES.map(r => AUDIT.filter(a => a.actorRole === r.code).length), colour:'#2F6FED' }] }));
}

/* ---------------- account sheet ---------------- */
function openAccount(id){
  const a = ACC_BY_ID[id];
  if(!a) return;
  const role = ROLE_BY_CODE[a.code] || {};
  const l = LIMITS[a.code] || {};
  openModal(a.name, a.id + ' · ' + roleName(a.code),
    `<div class="recsheet"><div class="recgrid">
      <div class="pfield"><div class="pk">Officer</div><div class="pv">${esc(a.name)}</div></div>
      <div class="pfield"><div class="pk">Account</div><div class="pv">${esc(a.id)}</div></div>
      <div class="pfield"><div class="pk">Role</div><div class="pv">${esc(role.name || a.code)}</div></div>
      <div class="pfield"><div class="pk">Tier</div><div class="pv">${esc(role.tier || '—')}</div></div>
      <div class="pfield"><div class="pk">Branch</div><div class="pv">${esc(a.branch)}</div></div>
      <div class="pfield"><div class="pk">Multi-factor</div><div class="pv">${a.mfa ? 'Enrolled' : 'Not enrolled'}</div></div>
      <div class="pfield"><div class="pk">State</div><div class="pv">${esc(a.status)}</div></div>
      <div class="pfield"><div class="pk">Login</div><div class="pv">${a.shared ? 'Shared' : 'Individual account'}</div></div>
      <div class="pfield"><div class="pk">Approve alone</div><div class="pv">${l.approve ? money(l.approve) : 'Nothing'}</div></div>
      <div class="pfield"><div class="pk">Execute alone</div><div class="pv">${l.execute ? money(l.execute) : 'Nothing'}</div></div>
      <div class="pfield"><div class="pk">Last reviewed</div><div class="pv">${esc(fmtDate(a.reviewed))}</div></div>
      <div class="pfield"><div class="pk">Purpose</div><div class="pv">${esc(role.purpose || '')}</div></div>
    </div></div>`,
    [{ label:'Print', act: () => printTable(a.name, [{ label:'Field' }, { label:'Value' }],
      [['Account', a.id], ['Role', roleName(a.code)], ['Branch', a.branch], ['MFA', a.mfa ? 'Enrolled' : 'Not enrolled'],
       ['State', a.status], ['Approve alone', l.approve ? money(l.approve) : 'Nothing'],
       ['Execute alone', l.execute ? money(l.execute) : 'Nothing'], ['Reviewed', fmtDate(a.reviewed)]]) },
     { label:'Close', act:'close', cls:'btn-gold' }]);
}
</script>
