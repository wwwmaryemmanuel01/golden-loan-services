<script>
/* ============================================================
   STAFF ROLES & PERMISSIONS (3/6)
   Sections 1–4: the overview, the role catalogue, the capability
   matrix and the approval limits with the action checker.
   ============================================================ */

const SEL = { role:'SA', matrixRole:'SA' };

/* ---------------- 1 · OVERVIEW ---------------- */
function renderOverview(){
  const caps = CAPS.length, roles = ROLES.length;
  const noAccess = capUsage('None');
  const cells = roles * caps;
  const grants = AUDIT.filter(a => a.result === 'Allowed').length;
  const refusals = AUDIT.filter(a => a.result === 'Refused').length;
  const leaversCut = LEAVERS.filter(l => l.status === 'Immediate').length;

  if(el('bandStats')) el('bandStats').innerHTML = [
    ['15', 'roles'], ['20', 'capabilities'], ['12', 'policies'], ['10', 'rules']
  ].map(([v, l]) => `<div class="band-stat"><b>${v}</b><span>${l}</span></div>`).join('');

  if(el('ovPill')){ el('ovPill').className = 'badge b-ok'; el('ovPill').textContent = roles + ' roles · ' + caps + ' capabilities'; }

  put('ovKpis', [
    ['Roles defined', num(roles), 'From super admin to the customer portal', 'gold'],
    ['Capabilities controlled', num(caps), 'Each one mapped for every role', ''],
    ['Staff accounts', num(ACCOUNTS.length), num(activeAccounts.length) + ' active, ' + num(ACCOUNTS.length - activeAccounts.length) + ' suspended or left', ''],
    ['Privileged accounts', num(privileged().length), 'Super admin and system administrator', privileged().length ? 'red' : ''],
    ['Cells with no access', num(noAccess), pctText(noAccess, cells) + ' of the matrix', ''],
    ['Conflict pairs', num(SOD.length), num(SOD.filter(s => s.status === 'Separated').length) + ' cleanly separated', ''],
    ['Policies enforced', num(POLICIES.length), 'RLS, functions and the edge function', 'green'],
    ['Rules in force', num(RULES.filter(r => r.state === 'Enforced').length) + ' / 10', 'Every essential rule evidenced', 'green']
  ].map(([l, v, s, k]) => kpiCard(l, v, s, k)).join(''));

  const byRole = ROLES.map(r => heldBy(r.code).length);
  const months = MONTHS12.slice(-6);
  const grantSeries = months.map(m => AUDIT_SORTED.filter(a => a.when.slice(0, 7) === m && a.result === 'Allowed').length);
  const refuseSeries = months.map(m => AUDIT_SORTED.filter(a => a.when.slice(0, 7) === m && a.result === 'Refused').length);

  put('ovGrid',
    chartCard({ title:'Accounts by role', sub:'Who holds what today', type:'bar', h:200,
      cats: ROLES.map(r => r.code), value: num(ACCOUNTS.length),
      series:[{ name:'Accounts', data: byRole, colour:'#C9A227' }] }) +
    chartCard({ title:'Capability mix', sub:'Cells by level across the whole matrix', type:'donut', h:200,
      cats: LEVELS, value: num(cells),
      series:[{ name:'Cells', data: LEVELS.map(l => capUsage(l)) }] }) +
    chartCard({ title:'Permission events', sub:'Granted and refused, last six months', type:'bar', h:200,
      cats: months.map(monthLabel),
      series:[{ name:'Allowed', data: grantSeries, colour:'#1E9E6A' }, { name:'Refused', data: refuseSeries, colour:'#D93F3F' }] }) +
    chartCard({ title:'The ten rules', sub:'State of each essential rule', type:'donut', h:200,
      cats:['Enforced','Partial','Gap'], value: '10 / 10',
      colours:['#1E9E6A','#E08C1E','#D93F3F'],
      series:[{ name:'Rules', data:['Enforced','Partial','Gap'].map(s => RULES.filter(r => r.state === s).length) }] }));

  if(el('ovGlancePill')) el('ovGlancePill').textContent = '11 parts';

  const glance = [
    { part:'1 · Overview', holds:'Roles, accounts and the state of the plan', figure:num(roles) + ' roles' },
    { part:'2 · Roles', holds:'Purpose, permissions and restrictions for each', figure:num(roles) + ' catalogued' },
    { part:'3 · Matrix', holds:'Capabilities against roles', figure:num(cells) + ' cells' },
    { part:'4 · Limits', holds:'Approve, execute, second signature, daily ceiling', figure:num(ROLES.filter(r => LIMITS[r.code].approve > 0).length) + ' roles may approve' },
    { part:'5 · Duties', holds:'Conflicts and the controls that hold them apart', figure:num(SOD.length) + ' pairs' },
    { part:'6 · Enforcement', holds:'Policies, functions and the tests that prove them', figure:num(POLICIES.length) + ' policies' },
    { part:'7 · Sensitive data', holds:'Classification, masking and access logs', figure:num(DATA_CLASS.length) + ' classes' },
    { part:'8 · Access reviews', holds:'Reviews, leavers and role changes', figure:num(REVIEWS.length) + ' rounds' },
    { part:'9 · Emergency access', holds:'Break-glass requests and controls', figure:num(EMERGENCY.length) + ' requests' },
    { part:'10 · Ten rules', holds:'Each rule with its evidence', figure:RULES.filter(r => r.state === 'Enforced').length + ' / 10 enforced' },
    { part:'11 · Audit trail', holds:'Every grant, revocation and refusal', figure:num(AUDIT.length) + ' entries' }
  ];
  renderTable('ovGlanceBody', [
    { k:'part', label:'Part' }, { k:'holds', label:'What it holds' }, { k:'figure', label:'Figure' }
  ], glance);

  if(el('ovRolePill')) el('ovRolePill').textContent = num(roles) + ' roles';
  renderTable('ovRoleBody', [
    { k:'name', label:'Role' },
    { k:'tier', label:'Tier', html: v => badge(v, TIER_TONE[v]) },
    { k:'holders', label:'Accounts', num: true },
    { k:'caps', label:'Capabilities', num: true },
    { k:'none', label:'No access', num: true }
  ], ROLES.map(r => ({
    name: roleName(r.code) + ' (' + r.code + ')', tier: r.tier,
    holders: heldBy(r.code).length,
    caps: PERMS[r.code].filter(v => v !== 'None').length,
    none: capCount(r.code, 'None')
  })), { sort:'holders' });

  if(el('ovActPill')) el('ovActPill').textContent = num(AUDIT.length) + ' events';
  renderTable('ovActBody', [
    { k:'when', label:'When', html: v => esc(fmtWhen(v)) },
    { k:'actor', label:'Officer', html: v => esc(staffName(v)) },
    { k:'action', label:'Action' },
    { k:'result', label:'Result', html: v => okb(v) }
  ], AUDIT_SORTED.slice(0, 11));
}

/* ---------------- 2 · ROLE CATALOGUE ---------------- */
function renderCatalogue(){
  const filter = el('catFilter') ? el('catFilter').value : '';
  const list = filter ? ROLES.filter(r => r.tier === filter) : ROLES;
  if(el('catPill')) el('catPill').textContent = num(list.length) + ' roles';

  put('roleCards', list.map(r => `
    <div class="rolecard${r.code === SEL.role ? ' on' : ''}" data-role="${r.code}">
      <div class="rc-top"><span class="rc-code">${r.code}</span><span class="rc-name">${esc(r.name)}</span></div>
      <div class="rc-purpose">${esc(r.purpose)}</div>
      <div class="rc-foot">
        <span class="badge ${TIER_TONE[r.tier]}">${esc(r.tier)}</span>
        <span class="badge b-gray">${heldBy(r.code).length} holder${heldBy(r.code).length === 1 ? '' : 's'}</span>
        <span class="badge b-gray">${PERMS[r.code].filter(v => v !== 'None').length} caps</span>
      </div>
    </div>`).join(''));

  if(!ROLE_BY_CODE[SEL.role]) SEL.role = list[0] ? list[0].code : 'SA';
  const r = ROLE_BY_CODE[SEL.role] || ROLES[0];
  const l = LIMITS[r.code];
  if(el('roleDetPill')){ el('roleDetPill').className = 'badge ' + TIER_TONE[r.tier]; el('roleDetPill').textContent = r.tier + ' · ' + heldBy(r.code).length + ' holders'; }

  const holders = heldBy(r.code);
  put('roleDetail', `
    <div class="rd-head">
      <span class="rd-code">${r.code}</span>
      <div style="flex:1;min-width:0">
        <div class="rd-name">${esc(r.name)}</div>
        <div class="rd-purpose">${esc(r.purpose)}</div>
      </div>
      <div style="text-align:right">
        <span class="badge ${TIER_TONE[r.tier]}">${esc(r.tier)}</span>
        <div class="qhint" style="margin:3px 0 0">Owner: ${esc(r.owner)}</div>
      </div>
    </div>
    <div class="g2" style="margin-top:9px">
      <div>
        <div class="minihead">What it may do</div>
        <div class="ulines">${r.perms.map(p => `<div><span class="tick">✓</span><span>${esc(p)}</span></div>`).join('')}</div>
      </div>
      <div>
        <div class="minihead">What it may not do</div>
        <div class="ulines">${r.restr.map(p => `<div><span class="cross">✕</span><span>${esc(p)}</span></div>`).join('')}</div>
      </div>
    </div>
    <div class="minihead">The limits that bind it</div>
    ${strip([
      ['Approve alone', l.approve ? money(l.approve) : 'Nothing'],
      ['Execute alone', l.execute ? money(l.execute) : 'Nothing'],
      ['Second name above', l.second ? money(l.second) : 'Always'],
      ['Daily ceiling', l.daily ? money(l.daily) : '—']
    ])}
    <div class="qhint" style="margin-top:6px">${esc(l.note)}</div>
    <div class="minihead">Capabilities held</div>
    <div class="chips">${CAPS.map(c => {
      const lv = levelOf(r.code, c.k);
      return `<span class="badge ${lv === 'None' ? 'b-gray' : lv === 'Full' ? 'b-ok' : lv === 'Approve' ? 'b-warn' : 'b-info'}"
        title="${esc(LEVEL_INFO[lv].label)}">${esc(c.label)}<b style="opacity:.6;margin-left:3px">${LEVEL_INFO[lv].short}</b></span>`;
    }).join('')}</div>`);

  if(el('roleHoldHead')) el('roleHoldHead').innerHTML = '<tr><th>Officer</th><th>Branch</th><th>MFA</th><th>State</th><th>Last reviewed</th><th class="num">Limit</th></tr>';
  el('roleHoldBody').innerHTML = holders.length ? holders.map(a => `<tr class="rowlink" data-acct="${a.id}">
      <td>${esc(a.name)}<div class="qhint" style="margin:0">${a.id}</div></td>
      <td>${esc(a.branch)}</td>
      <td>${a.mfa ? badge('Enrolled','b-ok') : badge('Not enrolled','b-crit')}</td>
      <td>${okb(a.status)}</td>
      <td>${esc(fmtDate(a.reviewed))}</td>
      <td class="num">${a.limit ? money(a.limit) : '—'}</td></tr>`).join('')
    : '<tr><td colspan="6" class="empty">No account holds this role today.</td></tr>';
  el('roleHoldBody').querySelectorAll('tr[data-acct]').forEach(tr => {
    tr.onclick = () => openAccount(tr.dataset.acct);
  });

  if(el('catTblPill')) el('catTblPill').textContent = num(ROLES.length) + ' roles';
  renderTable('catBody', [
    { k:'code', label:'Code' },
    { k:'name', label:'Role' },
    { k:'tier', label:'Tier', html: v => badge(v, TIER_TONE[v]) },
    { k:'purpose', label:'Purpose' },
    { k:'restr', label:'Main restriction', html: v => esc(v[0]) },
    { k:'holders', label:'Accounts', num: true }
  ], ROLES.map(r => ({
    code: r.code, name: r.name, tier: r.tier, purpose: r.purpose, restr: r.restr,
    holders: heldBy(r.code).length
  })));
}

/* ---------------- 3 · CAPABILITY MATRIX ---------------- */
function renderMatrix(){
  const cells = ROLES.length * CAPS.length;
  if(el('mtxPill')) el('mtxPill').textContent = num(cells) + ' cells';
  put('mtxKpis', [
    ['Capabilities', num(CAPS.length), 'Every sensitive action is one', 'gold'],
    ['Full control cells', num(capUsage('Full')), pctText(capUsage('Full'), cells) + ' of the matrix', ''],
    ['Approve-only cells', num(capUsage('Approve')), 'A second name still executes', ''],
    ['Own-record cells', num(capUsage('Own')), 'Nothing outside their own book', ''],
    ['Limited or masked', num(capUsage('Limited')), 'Reads what the rule allows', ''],
    ['No access', num(capUsage('None')), pctText(capUsage('None'), cells) + ' refused outright', 'green']
  ].map(([l, v, s, k]) => kpiCard(l, v, s, k)).join(''));

  if(el('mtxCount')) el('mtxCount').textContent = num(ROLES.length) + ' roles × ' + num(CAPS.length);
  const head = el('mtxHead');
  if(head) head.innerHTML = '<tr><th style="text-align:left">Capability</th>' +
    ROLES.map(r => `<th class="rc" data-mtxcol="${r.code}" title="${esc(r.name)}">${r.code}</th>`).join('') + '</tr>';

  const body = el('mtxBody');
  if(body) body.innerHTML = CAPS.map(c => `<tr>
      <td class="cap">${esc(c.label)}<small>${esc(c.note)}</small></td>` +
    ROLES.map(r => {
      const lv = levelOf(r.code, c.k);
      const info = LEVEL_INFO[lv];
      return `<td data-mtxcell="${r.code}|${c.k}" class="${SEL.matrixRole === r.code ? 'col-on' : ''}">
        <span class="lv ${info.cls}" title="${esc(r.name)} · ${esc(c.label)} · ${esc(info.label)}">${info.short}</span></td>`;
    }).join('') + '</tr>').join('');

  body.querySelectorAll('[data-mtxcell]').forEach(td => {
    td.onclick = () => {
      const [code, k] = td.dataset.mtxcell.split('|');
      const r = ROLE_BY_CODE[code], c = CAP_BY_K[k], lv = levelOf(code, k);
      openModal(r.name + ' · ' + c.label,
        'Capability ' + (CAPS.indexOf(c) + 1) + ' of ' + CAPS.length,
        `<div class="recsheet"><div class="recgrid">
          <div class="pfield"><div class="pk">Role</div><div class="pv">${esc(r.name)} (${r.code})</div></div>
          <div class="pfield"><div class="pk">Capability</div><div class="pv">${esc(c.label)}</div></div>
          <div class="pfield"><div class="pk">Level granted</div><div class="pv">${esc(LEVEL_INFO[lv].label)}</div></div>
          <div class="pfield"><div class="pk">What it means</div><div class="pv">${esc(levelMeaning(code, k, lv))}</div></div>
          <div class="pfield"><div class="pk">Enforced by</div><div class="pv">${esc(enforcedByFor(k))}</div></div>
          <div class="pfield"><div class="pk">Holders</div><div class="pv">${heldBy(code).length} account(s)</div></div>
        </div></div>`,
        [{ label:'Print', act: () => printTable(r.name + ' · ' + c.label, [{ label:'Field' }, { label:'Value' }],
          [['Role', r.name], ['Capability', c.label], ['Level', LEVEL_INFO[lv].label],
           ['Meaning', levelMeaning(code, k, lv)], ['Enforced by', enforcedByFor(k)], ['Holders', heldBy(code).length]]) },
         { label:'Close', act:'close', cls:'btn-gold' }]);
    };
  });
  head.querySelectorAll('[data-mtxcol]').forEach(th => {
    th.onclick = () => { SEL.matrixRole = th.dataset.mtxcol; renderMatrix(); toast(roleName(SEL.matrixRole) + ' highlighted'); };
  });

  const soloCaps = CAPS.filter(c => ROLES.filter(r => levelOf(r.code, c.k) === 'Full').length <= 2
    && ['approve','release','perm','payrollApp'].includes(c.k));
  if(el('mtxSoloPill')) el('mtxSoloPill').textContent = num(soloCaps.length);
  put('mtxSolo', soloCaps.map(c => `<div class="rulerow">
      <div class="rn-no">!</div>
      <div class="rn-body"><div class="rn-title">${esc(c.label)}</div>
        <div class="rn-text">${esc(c.note)} — held at full control by
          ${ROLES.filter(r => levelOf(r.code, c.k) === 'Full').map(r => r.name).join(', ') || 'nobody'}.</div>
        <div class="rn-meta"><span class="enf fn">SECOND NAME</span>${badge('Always', 'b-warn')}</div></div>
    </div>`).join(''));

  const thin = ROLES.map(r => ({ role: roleName(r.code), code: r.code, none: capCount(r.code, 'None'),
      held: PERMS[r.code].filter(v => v !== 'None').length }))
    .sort((a, b) => b.none - a.none).slice(0, 6);
  if(el('mtxThinPill')) el('mtxThinPill').textContent = num(thin.length) + ' roles';
  renderTable('mtxThinBody', [
    { k:'role', label:'Role' }, { k:'code', label:'Code' },
    { k:'held', label:'Capabilities', num: true }, { k:'none', label:'No access', num: true }
  ], thin);
}

function levelMeaning(code, k, lv){
  const r = ROLE_BY_CODE[code], c = CAP_BY_K[k];
  if(lv === 'None') return 'Refused. No control in the interface, and the database refuses it too.';
  if(lv === 'Full') return 'May perform the action within the limits set for the role.';
  if(lv === 'Approve') return 'May approve, but never execute the same action; another person carries it out.';
  if(lv === 'Own') return 'Only for records assigned to this person — never the branch or the book.';
  return 'Limited to what the role needs, with sensitive fields masked.';
}
function enforcedByFor(k){
  if(['approve','release','reverse','payrollApp','perm','settings','ledger'].includes(k)) return 'Database function plus a second-name check';
  if(['viewCust','regCust','prepApp','assess','repay','export','sensitive','auditLog','payrollPrep'].includes(k)) return 'Row-level security policy on the table';
  if(k === 'emergency') return 'Edge function with a time-boxed grant';
  if(k === 'website') return 'Row-level security on the public content tables only';
  return 'Row-level security';
}

/* ---------------- 4 · LIMITS ---------------- */
function renderLimits(){
  const approvers = ROLES.filter(r => LIMITS[r.code].approve > 0);
  const executors = ROLES.filter(r => LIMITS[r.code].execute > 0);
  const nothing = ROLES.filter(r => LIMITS[r.code].approve === 0 && LIMITS[r.code].execute === 0);
  if(el('limPill')) el('limPill').textContent = num(ROLES.length) + ' roles limited';
  put('limKpis', [
    ['Roles that may approve', num(approvers.length), 'Everything else recommends', 'gold'],
    ['Roles that may execute', num(executors.length), 'Treasury moves the money', ''],
    ['Roles with neither', num(nothing.length), 'Read, prepare or recommend only', 'green'],
    ['Bands configured', num(THRESHOLDS.length), 'By role and by amount', ''],
    ['Highest single approval', money(Math.max(...ROLES.map(r => LIMITS[r.code].approve))), 'Branch manager', ''],
    ['Highest execution', money(Math.max(...ROLES.map(r => LIMITS[r.code].execute))), 'Treasury, on an approved file', '']
  ].map(([l, v, s, k]) => kpiCard(l, v, s, k)).join(''));

  if(el('limCount')) el('limCount').textContent = num(ROLES.length) + ' roles';
  renderTable('limBody', [
    { k:'role', label:'Role' },
    { k:'approve', label:'Approve alone', num: true, html: v => v ? money(v) : '—' },
    { k:'execute', label:'Execute alone', num: true, html: v => v ? money(v) : '—' },
    { k:'second', label:'Second name above', num: true, html: (v, row) => v ? money(v) : ((row.approve || row.execute) ? 'Always' : '—') },
    { k:'daily', label:'Daily ceiling', num: true, html: v => v ? money(v) : '—' }
  ], ROLES.map(r => ({
    role: r.name, code: r.code,
    approve: LIMITS[r.code].approve, execute: LIMITS[r.code].execute,
    second: LIMITS[r.code].second, daily: LIMITS[r.code].daily
  })));

  fillCheck();
  if(el('thrPill')) el('thrPill').textContent = num(THRESHOLDS.length) + ' bands';
  renderTable('thrBody', [
    { k:'band', label:'Amount', num: true },
    { k:'needs', label:'What it needs' },
    { k:'who', label:'Who may give it' },
    { k:'lag', label:'Timing' }
  ], THRESHOLDS);
}
function fillCheck(){
  const rs = el('chkRole'), as = el('chkAction');
  if(rs && !rs.options.length) rs.innerHTML = ROLES.map(r => `<option value="${r.code}">${esc(r.name)}</option>`).join('');
  if(as && !as.options.length) as.innerHTML = CHECK_ACTIONS.map(a => `<option value="${a.k}">${esc(a.label)}</option>`).join('');
  if(rs && !rs.value) rs.value = 'BRM';
}

function checkAction(){
  const code = el('chkRole') ? el('chkRole').value : 'BRM';
  const act = CHECK_ACTIONS.find(a => a.k === (el('chkAction') ? el('chkAction').value : 'approve')) || CHECK_ACTIONS[0];
  const amount = Number(el('chkAmount') ? el('chkAmount').value : 0) || 0;
  const lv = levelOf(code, act.cap);
  const lim = LIMITS[code];
  const cap = CAP_BY_K[act.cap];
  const execution = ['release', 'payrollApp', 'refund', 'journal'].includes(act.k);
  let verdict, why, tone;

  if(lv === 'None'){
    verdict = 'Not permitted'; tone = 'deny';
    why = roleName(code) + ' holds no ' + cap.label.toLowerCase() + ' capability. The policy on the table refuses this, and the refusal is written to the audit trail.';
  } else if(lv === 'Own'){
    verdict = 'Own records only'; tone = 'second';
    why = roleName(code) + ' may act only on records assigned to them. Another officer’s account, or the branch book, is out of scope.';
  } else if(lv === 'Limited'){
    verdict = 'Limited access'; tone = 'second';
    why = roleName(code) + ' sees only the permitted part of this, with sensitive fields masked. A full action needs a role that holds it.';
  } else if(lim.approve > 0 && amount > lim.approve){
    verdict = 'Above the role limit'; tone = 'second';
    why = roleName(code) + ' may act alone up to ' + money(lim.approve) + '. At ' + money(amount) +
      ' the action moves to the next band: ' + (amount > 1000000 ? 'Head of Credit and Finance, then Treasury.' : 'a second approver who is not the actor.');
  } else if(lv === 'Approve'){
    verdict = 'Approves — someone else executes'; tone = 'second';
    why = 'Approval and execution are separated by design. ' + roleName(code) + ' may approve up to ' + money(lim.approve || 0) +
      ', and Treasury or the second name carrier must execute it.';
  } else if(execution && lim.execute === 0){
    verdict = 'Needs a second name'; tone = 'second';
    why = roleName(code) + ' may prepare this but carries no execution authority. An approved instruction is executed by Treasury, never by the preparer.';
  } else if(lim.second > 0 && amount > lim.second){
    verdict = 'Needs a second name'; tone = 'second';
    why = 'Above ' + money(lim.second) + ' this role needs a second approver. Below it, ' + roleName(code) + ' may act alone.';
  } else if((lim.approve || lim.execute) === 0){
    verdict = 'Not permitted'; tone = 'deny';
    why = roleName(code) + ' carries no financial authority at all: it reads, prepares or recommends, and another role decides.';
  } else {
    verdict = 'Permitted'; tone = 'allow';
    why = roleName(code) + ' may ' + act.label.toLowerCase() + ' at ' + money(amount) + ', inside the role’s limit of ' +
      money(lim.approve || lim.execute) + '. The action is written to the audit trail with the actor and the time.';
  }

  if(el('chkPill')){ el('chkPill').className = 'badge ' + (tone === 'allow' ? 'b-ok' : tone === 'second' ? 'b-warn' : 'b-crit');
    el('chkPill').textContent = verdict; }
  put('chkVerdict', `<div class="verdict ${tone}">
      <div class="vh"><span class="vdot">${tone === 'allow' ? '✓' : tone === 'second' ? '◐' : '✕'}</span>${esc(verdict)}</div>
      <div class="vwhy">${esc(why)}</div>
      <div class="vwhy" style="color:#8A90A0">${esc(roleName(code))} · ${esc(act.label)} · ${money(amount)} · capability level ${esc(LEVEL_INFO[lv].label)}</div>
    </div>`);
}
</script>
