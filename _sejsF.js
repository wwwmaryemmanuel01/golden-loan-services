<script>
/* ============================================================
   SECURITY & PROTECTION (6/7)
   9 · Application & API   10 · Fraud & suspicious activity
   11 · Alerts & incidents 12 · Audit logs
   ============================================================ */

/* ===================== 9 · APPLICATION & API ===================== */
function renderApp(){
  const gaps = APP_CHECKS.filter(c => c.status !== 'Pass');
  const openRoutes = API_ROUTES.filter(r => r.status !== 'Protected');
  const patches = DEPS.filter(d => d.status !== 'Current');
  el('appPill').className = 'badge ' + (openRoutes.length ? 'b-warn' : 'b-ok');
  el('appPill').textContent = `${APP_CHECKS.filter(c => c.status === 'Pass').length}/${APP_CHECKS.length} controls pass`;
  el('appChkPill').textContent = gaps.length + ' open';

  el('appKpis').innerHTML = [
    ['Controls tested', num(APP_CHECKS.length), `${num(APP_CHECKS.filter(c => c.status === 'Pass').length)} passing exactly`, 'gold'],
    ['Controls needing work', num(gaps.length), 'Gap or under review', gaps.length ? 'red' : ''],
    ['API routes', num(API_ROUTES.length), `${num(openRoutes.length)} not fully protected`, openRoutes.length ? 'red' : ''],
    ['Blocked requests', num(SEC_EVENTS.filter(e => e.outcome === 'Denied').length), 'Refused by authorization', ''],
    ['Rate-limit rejections', num(API_ERRORS.filter(e => e.code === '429').reduce((s, e) => s + e.count, 0)), 'Held the line', ''],
    ['Dependency patches', num(patches.length), 'Available, not yet applied', patches.length ? 'blue' : '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join('');

  el('appChkHead').innerHTML = '<tr><th>Area</th><th>Control</th><th>Evidence</th><th>State</th></tr>';
  el('appChkBody').innerHTML = APP_CHECKS.map(c => `<tr><td><b>${esc(c.area)}</b></td>
      <td>${esc(c.control)}</td><td class="qhint" style="margin:0">${esc(c.evidence)}</td>
      <td>${okBadge(c.status)}</td></tr>`).join('');

  el('apiPill').textContent = openRoutes.length;
  renderTable('apiBody', [
    {k:'route', label:'Route'},
    {k:'method', label:'Method'},
    {k:'auth', label:'Authorization'},
    {k:'rate', label:'Rate limit'},
    {k:'validated', label:'Validated', html:v => badge(v, v === 'Yes' || /Signature/.test(v) ? 'b-ok' : 'b-crit')},
    {k:'status', label:'State', html:v => badge(v, v === 'Protected' ? 'b-ok' : 'b-crit')}
  ], API_ROUTES, {sort:'route', pageSize:8});

  el('hdrHead').innerHTML = '<tr><th>Header</th><th>Value</th><th>State</th></tr>';
  el('hdrBody').innerHTML = HTTP_HEADERS.map(h => `<tr><td class="mono">${esc(h.name)}</td>
      <td class="mono" style="font-size:9px">${esc(h.value)}</td><td>${okBadge(h.status)}</td></tr>`).join('');

  el('depPill').textContent = patches.length;
  el('depHead').innerHTML = '<tr><th>Package</th><th>Installed</th><th>Latest</th><th>Advisory</th><th>State</th></tr>';
  el('depBody').innerHTML = DEPS.map(d => `<tr><td class="mono">${esc(d.pkg)}</td><td>${esc(d.version)}</td>
      <td>${esc(d.latest)}</td><td>${esc(d.advisory)}</td>
      <td>${badge(d.status, d.status === 'Current' ? 'b-ok' : 'b-warn')}</td></tr>`).join('');

  el('reqGuards').innerHTML = [
    ['Request validation', 'Schema checked before the handler runs', 'Enforced'],
    ['Rate limiting', '60 requests a minute per session, 8 logins a minute per address', 'Enforced'],
    ['Input validation', 'Types, lengths and enums checked server-side', 'Enforced'],
    ['Cross-site scripting', 'Every value escaped on output, no raw HTML from input', 'Enforced'],
    ['Cross-site request forgery', 'SameSite cookies plus an origin check on writes', 'Enforced'],
    ['Secure headers', 'CSP, HSTS, frame denial and nosniff', 'Enforced'],
    ['Error handling', 'Stack traces and SQL withheld from clients', 'Gap on one route']
  ].map(([what, how, st]) => `<div class="risk">
      <div><div class="rn">${esc(what)}</div><div class="rs">${esc(how)}</div></div>
      <div class="rv">${okBadge(st)}</div></div>`).join('');

  el('apiErrHead').innerHTML = '<tr><th>When</th><th>Route</th><th>Code</th><th class="num">Count</th><th>Note</th></tr>';
  el('apiErrBody').innerHTML = API_ERRORS.map(e => `<tr><td>${fmtDate(e.when)}</td>
      <td class="mono">${esc(e.route)}</td><td>${badge(e.code, e.code.startsWith('5') ? 'b-crit' : 'b-warn')}</td>
      <td class="num">${e.count}</td><td>${esc(e.note)}</td></tr>`).join('');

  const denied = SEC_EVENTS.filter(e => e.outcome === 'Denied');
  el('unauthPill').textContent = denied.length;
  renderTable('unauthBody', [
    {k:'when', label:'When'},
    {k:'who', label:'Account', html:v => esc(staffName(v))},
    {k:'target', label:'Target'},
    {k:'ip', label:'Address'},
    {k:'detail', label:'What was refused'}
  ], denied.map(e => Object.assign({}, e, {_open: () => openAccount(e.who)})), {sort:'when', pageSize:6, onRow:true});
}

/* ===================== 10 · FRAUD ===================== */
function renderFraud(){
  const failed = ACCOUNTS.filter(a => a.failed > 0);
  const suspAcc = LOGINS.filter(l => /ZA|ZM|KE/.test(l.place) || l.result === 'Blocked');
  el('frdPill').className = 'badge ' + (failed.length > 3 ? 'b-warn' : 'b-ok');
  el('frdPill').textContent = failed.length + ' accounts with failures';

  el('frdKpis').innerHTML = [
    ['Signals triaged', num(LOGINS.filter(l => l.result !== 'Success').length + DUPLICATE_TXNS.length + DUP_ACCOUNTS.length), 'Across access, money and identity', 'gold'],
    ['Accounts failing sign-in', num(failed.length), 'Repeated attempts recorded', failed.length ? 'red' : ''],
    ['Suspicious sessions', num(suspAcc.length), 'Off-shore addresses or blocked attempts', ''],
    ['Duplicate identities', num(DUP_ACCOUNTS.length), 'Customers sharing identifiers', ''],
    ['Unexpected permission changes', num(PRIV_CHANGES.filter(p => !p.approved).length), 'Not yet approved', 'red'],
    ['Under investigation', num(INVESTIGATIONS.filter(i => !/Resolved|Closed/.test(i.status)).length), 'Security investigations open', '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join('');

  const lanes = ['Access','Identity','Data','Financial','Infrastructure','Application'];
  el('frdGrid').innerHTML = [
    chartBox({title:'Signals by area', sub:'Where the fraud signal sits', value:num(INCIDENTS.length),
      chart: chart({type:'donut', cats:lanes, h:200, colours:PALETTE,
        series:[{data:lanes.map(l => INCIDENTS.filter(i => i.lane === l).length)}]})}),
    chartBox({title:'Failed sign-ins by officer', sub:'Repeated attempts', value:num(sum(failed, a => a.failed)),
      chart: chart({type:'bar', cats:failed.map(a => a.name.split(' ')[0]), h:200,
        series:[{name:'Failed', data:failed.map(a => a.failed), colour:'#D93F3F'}]})}),
    chartBox({title:'Signals by severity', sub:'Open and closed alike', value:num(INCIDENTS.length),
      chart: chart({type:'bar', cats:['Critical','High','Medium','Low'], h:200,
        series:[{name:'Incidents', colour:'#C9A227',
          data:['Critical','High','Medium','Low'].map(sv => INCIDENTS.filter(i => i.severity === sv).length)}]})})
  ].join('');

  el('failPill2').textContent = failed.length;
  renderTable('failBody2', [
    {k:'name', label:'Officer'},
    {k:'role', label:'Role'},
    {k:'failed', label:'Failed', num:true},
    {k:'state', label:'State', html:v => badge(v, v === 'Locked' ? 'b-crit' : 'b-ok')},
    {k:'lastLogin', label:'Last attempt', html:v => esc(v.slice(0, 16))}
  ], failed.map(a => Object.assign({}, a, {_open: () => openAccount(a.id)})), {sort:'failed', pageSize:6, onRow:true});

  el('suspAccHead').innerHTML = '<tr><th>When</th><th>Who</th><th>Where</th><th>Result</th></tr>';
  el('suspAccBody').innerHTML = suspAcc.slice(0, 8).map(l => `<tr>
      <td>${esc(l.when)}</td><td>${esc(l.who)}</td><td>${esc(l.place)}</td>
      <td>${badge(l.result, l.result === 'Success' ? 'b-warn' : 'b-crit')}</td></tr>`).join('');

  const staffRisk = ACCOUNTS.map(a => ({
    name: a.name, id: a.id, role: a.role,
    logins: LOGINS.filter(l => l.who === a.name && l.result !== 'Success').length,
    exports: SEC_EVENTS.filter(e => e.who === a.id && e.category === 'Export').length,
    correctives: ADJUSTMENTS.filter(x => x.officer === a.id && !x.approved).length,
    score: LOGINS.filter(l => l.who === a.name && l.result !== 'Success').length * 3 +
      SEC_EVENTS.filter(e => e.who === a.id && e.category === 'Export').length +
      ADJUSTMENTS.filter(x => x.officer === a.id && !x.approved).length * 4
  })).sort((a, b) => b.score - a.score).slice(0, 8);
  el('staffActHead').innerHTML = '<tr><th>Officer</th><th>Role</th><th class="num">Failed</th><th class="num">Exports</th><th class="num">Unapproved</th><th>Risk</th></tr>';
  el('staffActBody').innerHTML = staffRisk.map(a => `<tr>
      <td>${esc(a.name)}</td><td>${esc(a.role)}</td>
      <td class="num">${a.logins}</td><td class="num">${a.exports}</td><td class="num">${a.correctives}</td>
      <td>${badge(a.score > 8 ? 'High' : a.score > 3 ? 'Elevated' : 'Low',
        a.score > 8 ? 'b-crit' : a.score > 3 ? 'b-warn' : 'b-ok')}</td></tr>`).join('');

  el('permUnxHead').innerHTML = '<tr><th>When</th><th>Account</th><th>Change</th><th>State</th></tr>';
  el('permUnxBody').innerHTML = PRIV_CHANGES.map(p => `<tr>
      <td>${fmtDate(p.when)}</td><td>${esc(staffName(p.staff))}</td><td>${esc(p.what)}</td>
      <td>${badge(p.approved ? 'Approved' : 'Awaiting approval', p.approved ? 'b-ok' : 'b-warn')}</td></tr>`).join('');

  el('suspAppPill2').textContent = SUSP_APPS.length;
  renderTable('suspAppBody2', [
    {k:'app', label:'Application'},
    {k:'cust', label:'Customer', html:v => esc(custName(v))},
    {k:'amount', label:'Amount', num:true, html:v => money(v)},
    {k:'rule', label:'Rule matched'},
    {k:'when', label:'Submitted', html:v => fmtDate(v)}
  ], SUSP_APPS, {sort:'amount', pageSize:6});

  el('unuDisbPill').textContent = UNUSUAL_DISB.length;
  renderTable('unuDisbBody', [
    {k:'ref', label:'Payout'},
    {k:'cust', label:'Customer', html:v => esc(custName(v))},
    {k:'amount', label:'Amount', num:true, html:v => money(v)},
    {k:'signal', label:'Signal'},
    {k:'when', label:'Date', html:v => fmtDate(v)}
  ], UNUSUAL_DISB.map(d => Object.assign({}, d, {_open: () => openLoan(d.loan)})), {sort:'amount', pageSize:6, onRow:true});

  const revByOfficer = REVERSALS.map(r => ({id:r.id, officer:r.officer, kind:r.kind,
    amount:r.amount, status:r.status, reason:r.reason, when:r.requested}));
  el('revPatPill').textContent = revByOfficer.filter(r => r.status !== 'Approved').length;
  renderTable('revPatBody', [
    {k:'id', label:'Reversal'},
    {k:'officer', label:'Officer', html:v => esc(staffName(v))},
    {k:'kind', label:'Kind'},
    {k:'amount', label:'Amount', num:true, html:v => money(v)},
    {k:'status', label:'Status', html:v => badge(v, r_tone(v))}
  ], revByOfficer, {sort:'amount', pageSize:6});

  el('dupAcctPill').textContent = DUP_ACCOUNTS.length;
  el('dupAcctHead').innerHTML = '<tr><th>First file</th><th>Second file</th><th>Why they match</th><th>Risk</th></tr>';
  el('dupAcctBody').innerHTML = DUP_ACCOUNTS.map(d => `<tr>
      <td>${esc(d.a)}<div class="qhint" style="margin:0">${esc(custName(d.a))}</div></td>
      <td>${esc(d.b)}<div class="qhint" style="margin:0">${esc(custName(d.b))}</div></td>
      <td>${esc(d.reason)}</td><td>${badge(d.risk, d.risk === 'High' ? 'b-crit' : 'b-warn')}</td></tr>`).join('');

  renderTable('invBody2', [
    {k:'id', label:'Investigation'},
    {k:'type', label:'Type'},
    {k:'subject', label:'Subject'},
    {k:'opened', label:'Opened', html:v => fmtDate(v)},
    {k:'owner', label:'Owner', html:v => esc(staffName(v))},
    {k:'status', label:'Status', html:v => badge(v, statTone(v))}
  ], INVESTIGATIONS, {sort:'opened', pageSize:7});
}
const r_tone = v => /Approved/.test(v) ? 'b-ok' : /Rejected/.test(v) ? 'b-crit' : 'b-warn';

/* ===================== 11 · INCIDENTS ===================== */
let SELECTED_INCIDENT = INCIDENTS[0] ? INCIDENTS[0].id : '';
function incidentRows(){
  return INCIDENTS.filter(i => matchQ(i.id, i.title, i.detail, i.subjectId)
    && (!FILTER.lane || i.lane === FILTER.lane)
    && passSeverity(i) && passStatus(i) && passOwner(i));
}
function renderIncidents(){
  const list = incidentRows();
  const s = secStats();
  const overdue = s.open.filter(i => i.due < TODAY);
  el('alertPill').className = 'badge ' + (s.critical.length ? 'b-crit' : s.open.length ? 'b-warn' : 'b-ok');
  el('alertPill').textContent = `${s.open.length} open · ${s.critical.length} critical`;
  el('alertCount').textContent = list.length + ' in view';

  el('alertKpis').innerHTML = [
    ['Open incidents', num(s.open.length), 'Across every area', 'gold'],
    ['Critical incidents', num(s.critical.length), 'Need a decision today', s.critical.length ? 'red' : ''],
    ['Overdue', num(overdue.length), 'Past the response target', overdue.length ? 'red' : ''],
    ['Investigating', num(INCIDENTS.filter(i => i.status === 'Investigating').length), 'Work in progress', ''],
    ['Resolved this period', num(INCIDENTS.filter(i => i.status === 'Resolved').length), 'Control restored', ''],
    ['Average age', (s.open.length ? Math.round(sum(s.open, i => daysBetween(i.opened, TODAY)) / s.open.length) : 0) + ' days', 'Across the open load', '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join('');

  el('alertGrid').innerHTML = [
    chartBox({title:'Incidents by status', sub:'The open load', value:num(INCIDENTS.length),
      chart: chart({type:'donut', cats:SEC_STATES, h:200, colours:PALETTE,
        series:[{data:SEC_STATES.map(st => INCIDENTS.filter(i => i.status === st).length)}]})}),
    chartBox({title:'Incidents by severity', sub:'How serious the load is', value:num(s.critical.length) + ' critical',
      chart: chart({type:'bar', cats:['Critical','High','Medium','Low'], h:200,
        series:[{name:'Incidents', colour:'#B32C2C',
          data:['Critical','High','Medium','Low'].map(sv => INCIDENTS.filter(i => i.severity === sv).length)}]})})
  ].join('');

  renderTable('alertBody', [
    {k:'id', label:'Incident'},
    {k:'title', label:'Subject'},
    {k:'lane', label:'Area'},
    {k:'severity', label:'Severity', html:v => badge(v, sevTone(v))},
    {k:'owner', label:'Owner', html:v => esc(staffName(v))},
    {k:'due', label:'Due', html:v => `<span style="color:${v < TODAY ? '#B32C2C' : 'inherit'}">${fmtDate(v)}</span>`},
    {k:'status', label:'Status', html:v => badge(v, statTone(v))}
  ], list.map(i => Object.assign({}, i, {_open: () => selectIncident(i.id)})), {sort:'severity', pageSize:8, onRow:true});

  const cur = INCIDENTS.find(i => i.id === SELECTED_INCIDENT) || list[0];
  if(cur){ SELECTED_INCIDENT = cur.id; renderIncidentWorkspace(cur); }
  else el('awBody').innerHTML = '<div class="empty">No incidents match these filters.</div>';
}

const ALERT_CATEGORY = {
  Access: 'Failed-login and unauthorised access alert',
  Identity: 'Identity and account-takeover alert',
  Data: 'Customer data access alert',
  Financial: 'Financial security alert',
  Infrastructure: 'Database and infrastructure alert',
  Application: 'Application error and API alert'
};

function renderIncidentWorkspace(i){
  el('awSub').textContent = `${i.id} · ${i.lane} · raised ${fmtDate(i.opened)}`;
  el('awStatus').className = 'badge ' + statTone(i.status);
  el('awStatus').textContent = i.status;
  const subject = i.subjectKind === 'staff' ? `Officer ${staffName(i.subjectId)} (${i.subjectId})`
    : i.subjectKind === 'loan' ? `Facility ${i.subjectId} — ${custName((LOAN_BY_REF[i.subjectId] || {}).cust)}`
    : i.subjectKind === 'customer' ? `Customer ${i.subjectId} — ${custName(i.subjectId)}`
    : i.subjectKind === 'secret' ? `Secret ${i.subjectId}`
    : i.subjectKind === 'route' ? `Route ${i.subjectId}`
    : i.subjectKind === 'db' ? `Table ${i.subjectId}`
    : i.subjectKind === 'request' ? `Data request ${i.subjectId}`
    : i.subjectKind === 'backup' ? `Backup ${i.subjectId}`
    : `Transaction ${i.subjectId}`;

  el('awBody').innerHTML = `
    <div class="pfields">
      ${field('Subject', esc(subject))}
      ${field('Area', esc(i.lane))}
      ${field('Alert category', esc(ALERT_CATEGORY[i.lane] || 'Security alert'))}
      ${field('Severity', badge(i.severity, sevTone(i.severity)))}
      ${field('Owner', esc(staffName(i.owner)))}
      ${field('Raised', fmtDate(i.opened))}
      ${field('Due', fmtDate(i.due))}
      ${field('Days open', String(daysBetween(i.opened, TODAY)))}
      ${field('Notes', num(i.notes.length))}
      ${field('Evidence', num(i.evidence.length))}
      ${field('Actions', num(i.actions.length))}
    </div>
    <div class="note gold" style="margin-top:9px"><div>${esc(i.detail)}</div></div>

    <div class="minihead">Work the incident</div>
    <div class="g3">
      <div class="fgroup">
        <div class="fh">Assign a reviewer</div>
        <div class="fg"><select id="awOwner">${['STF-009','STF-003','STF-004'].map(r =>
          `<option value="${r}"${r === i.owner ? ' selected' : ''}>${esc(staffName(r))}</option>`).join('')}</select></div>
        <div class="form-actions"><button class="btn btn-ghost" data-aw="assign">Save owner</button></div>
      </div>
      <div class="fgroup">
        <div class="fh">Investigation note</div>
        <div class="fg"><input id="awNote" placeholder="What was checked and what was found…" /></div>
        <div class="form-actions"><button class="btn btn-ghost" data-aw="note">Add note</button></div>
      </div>
      <div class="fgroup">
        <div class="fh">Evidence</div>
        <div class="fg"><input id="awEvidence" placeholder="Log extract, screenshot, ticket…" /></div>
        <div class="form-actions"><button class="btn btn-ghost" data-aw="evidence">Attach</button></div>
      </div>
    </div>

    <div class="form-actions" style="margin-top:10px">
      <button class="btn btn-ghost" data-aw="action">Add corrective action</button>
      <button class="btn btn-ghost" data-aw="escalate">Escalate</button>
      <button class="btn btn-gold" data-aw="resolve">Resolve</button>
      <button class="btn btn-ghost" data-aw="close">Close</button>
      <button class="btn btn-ghost" data-aw="open-record">Open the underlying record</button>
    </div>

    <div class="g3" style="margin-top:11px">
      <div><div class="minihead">Notes</div>
        <div>${i.notes.length ? i.notes.map(n => `<div class="risk"><div>
          <div class="rn" style="font-weight:600;font-size:10.5px">${esc(n.note)}</div>
          <div class="rs">${esc(n.who)} · ${fmtDate(n.when)}</div></div></div>`).join('')
          : '<div class="empty">No notes yet.</div>'}</div></div>
      <div><div class="minihead">Evidence</div>
        <div>${i.evidence.length ? i.evidence.map(e => `<div class="risk"><div>
          <div class="rn" style="font-weight:600;font-size:10.5px">${esc(e.what)}</div>
          <div class="rs">${esc(e.by)} · ${fmtDate(e.when)}</div></div></div>`).join('')
          : '<div class="empty">No evidence attached.</div>'}</div></div>
      <div><div class="minihead">Corrective actions</div>
        <div>${i.actions.length ? i.actions.map(a => `<div class="risk"><div>
          <div class="rn" style="font-weight:600;font-size:10.5px">${esc(a.what)}</div>
          <div class="rs">${esc(a.who)} · due ${fmtDate(a.due)}</div></div>
          <div class="rv">${badge(a.status, a.status === 'Done' ? 'b-ok' : 'b-warn')}</div></div>`).join('')
          : '<div class="empty">No corrective action recorded.</div>'}</div></div>
    </div>

    <div class="minihead">Incident history</div>
    <div>${i.history.slice().reverse().map(h => `<div class="checkrow">
      <div class="ck pass">✓</div><div class="cl">${esc(h.what)}</div>
      <div class="cn">${esc(h.who)} · ${fmtDate(h.when)}</div></div>`).join('')}</div>`;
}

function selectIncident(id){
  SELECTED_INCIDENT = id;
  const i = INCIDENTS.find(x => x.id === id);
  if(i) renderIncidentWorkspace(i);
}
function incidentAction(what){
  const i = INCIDENTS.find(x => x.id === SELECTED_INCIDENT);
  if(!i) return;
  if(what === 'assign'){
    const next = el('awOwner').value, before = i.owner;
    i.owner = next;
    if(i.status === 'Open') i.status = 'Assigned';
    i.history.push({when: TODAY, who: 'Chikondi Mwale', what: 'Assigned to ' + staffName(next) + ' (was ' + staffName(before) + ')'});
    toast('Incident assigned to ' + staffName(next));
  }
  if(what === 'note'){
    const v = (el('awNote').value || '').trim();
    if(!v) return toast('Write the note first.', 'err');
    i.notes.push({when: TODAY, who: 'Chikondi Mwale', note: v});
    i.history.push({when: TODAY, who: 'Chikondi Mwale', what: 'Investigation note added'});
    toast('Note recorded');
  }
  if(what === 'evidence'){
    const v = (el('awEvidence').value || '').trim();
    if(!v) return toast('Name the evidence first.', 'err');
    i.evidence.push({what: v, by: 'Chikondi Mwale', when: TODAY});
    i.history.push({when: TODAY, who: 'Chikondi Mwale', what: 'Evidence attached: ' + v});
    toast('Evidence attached');
  }
  if(what === 'action'){
    i.actions.push({what: 'Close the control gap and re-test', who: staffName(i.owner), due: addDays(TODAY, 7), status: 'Open'});
    i.history.push({when: TODAY, who: 'Chikondi Mwale', what: 'Corrective action added'});
    toast('Corrective action tracked');
  }
  if(what === 'escalate'){
    i.status = 'Escalated';
    i.severity = i.severity === 'Low' ? 'Medium' : i.severity === 'Medium' ? 'High' : 'Critical';
    i.due = addDays(TODAY, 2);
    i.history.push({when: TODAY, who: 'Chikondi Mwale', what: 'Escalated to ' + i.severity + ' severity'});
    toast('Incident escalated');
  }
  if(what === 'resolve'){
    i.status = 'Resolved'; i.closedOn = TODAY;
    i.history.push({when: TODAY, who: 'Chikondi Mwale', what: 'Incident resolved — control restored'});
    logSec('Incident ' + i.id + ' resolved');
    toast('Incident resolved');
  }
  if(what === 'close'){
    i.status = 'Closed'; i.closedOn = TODAY;
    i.history.push({when: TODAY, who: 'Chikondi Mwale', what: 'Incident closed after review'});
    toast('Incident closed');
  }
  if(what === 'open-record'){
    if(i.subjectKind === 'staff') return openAccount(i.subjectId);
    if(i.subjectKind === 'loan') return openLoan(i.subjectId);
    if(i.subjectKind === 'customer') return openCustomerRisk(i.subjectId);
    if(i.subjectKind === 'txn') return goto('s7');
    return goto('s' + (i.subjectKind === 'secret' ? 14 : i.subjectKind === 'db' ? 8 : i.subjectKind === 'route' ? 9 : 6));
  }
  renderAll();
}

/* ===================== 12 · AUDIT LOGS ===================== */
const LOG_FILTER = {cat: ''};
function renderAuditLogs(){
  const rows = SEC_EVENTS.filter(e => matchQ(e.id, e.staff, e.what, e.target, e.detail, e.category)
    && (!LOG_FILTER.cat || e.category === LOG_FILTER.cat));
  const denied = SEC_EVENTS.filter(e => e.outcome === 'Denied');
  el('logPill').textContent = rows.length + ' events';
  el('logCount').textContent = rows.length;

  el('logKpis').innerHTML = [
    ['Events logged', num(SEC_EVENTS.length), 'Across twelve categories', 'gold'],
    ['Logins', num(SEC_EVENTS.filter(e => e.category === 'Login').length), 'Staff sign-in records', ''],
    ['Permission changes', num(SEC_EVENTS.filter(e => e.category === 'Permissions').length), 'Who changed what', ''],
    ['Customer data reads', num(SEC_EVENTS.filter(e => e.category === 'Data access').length), 'With a stated purpose', ''],
    ['Refused requests', num(denied.length), 'Stopped by authorization', denied.length ? 'red' : ''],
    ['Exports', num(SEC_EVENTS.filter(e => e.category === 'Export').length), 'Every file taken out', '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join('');

  el('logCats').innerHTML = ['', ...LOG_CATS].map(c =>
    `<span class="fchip${LOG_FILTER.cat === c ? ' on' : ''}" data-logcat="${esc(c)}">${c || 'All categories'}</span>`).join('');

  el('logHead').innerHTML = '<tr><th>When</th><th>Category</th><th>Actor</th><th>What</th><th>Target</th><th>Address</th><th>Result</th></tr>';
  el('logBody').innerHTML = rows.slice(0, 60).map(e => `<tr>
      <td style="white-space:nowrap">${esc(e.when)}</td>
      <td>${esc(e.category)}</td>
      <td>${esc(e.staff)}<div class="qhint" style="margin:0">${esc(e.role)}</div></td>
      <td>${esc(e.detail)}</td><td class="mono">${esc(e.target)}</td><td class="mono">${esc(e.ip)}</td>
      <td>${badge(e.outcome, e.outcome === 'Success' ? 'b-ok' : 'b-crit')}</td></tr>`).join('')
    || '<tr><td colspan="7" class="empty">No events match these filters.</td></tr>';

  const days = [...new Set(SEC_EVENTS.map(e => e.when.slice(0, 10)))].sort().slice(-9);
  el('logGrid').innerHTML = chartBox({title:'Events by day and category', sub:'The last nine days',
    chart: chart({type:'stacked', cats:days.map(d => d.slice(5)), h:230,
      series:['Login', 'Data access', 'Permissions', 'Export'].map((c, i) => ({name:c, colour:PALETTE[i],
        data:days.map(d => SEC_EVENTS.filter(e => e.when.slice(0, 10) === d && e.category === c).length)}))})});
}
</script>
