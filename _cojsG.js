<script>
/* ============================================================
   COMPLIANCE & INTELLIGENCE (7/7)
   13 · Rules & thresholds   14 · Intelligence dashboard
   15 · Settings & security  plus the wiring and boot.
   ============================================================ */

/* ===================== 13 · RULES & THRESHOLDS ===================== */
function renderRules(){
  el('ruleLarge').value = RULES.largeTxn;
  el('ruleDup').value = RULES.dupWindow;
  el('ruleLogin').value = RULES.failedLogin;
  el('ruleMaxLoan').value = RULES.maxLoan;
  el('ruleKyc').value = RULES.kycRenewal;
  el('ruleEsc').value = RULES.escalationHours;

  el('authBody').innerHTML = Object.entries(RULES.authority).map(([role, limit]) => {
    const over = LOANS.filter(l => (STAFF_BY_ID[l.officer] || {}).role === role && l.amount > limit).length;
    return `<tr><td>${esc(role)}</td><td class="num">${money(limit)}</td>
      <td class="num" style="color:${over ? '#B32C2C' : 'inherit'}">${num(over)}</td></tr>`;
  }).join('');

  el('verifyRulesBody').innerHTML = [
    ['Identity document must be on file', 'Every customer', 'Enforced'],
    ['Contact number verified before release', 'Every facility', 'Enforced'],
    ['Proof of address above MK 1,000,000', 'Facilities', 'Enforced'],
    ['Two approvals above MK 2,000,000', 'Facilities', 'Enforced'],
    ['KYC refresh within ' + RULES.kycRenewal + ' months', 'Every customer', 'Enforced'],
    ['Guarantor identity checked', 'Group lending', 'Advisory']
  ].map(([rule, who, state]) => `<tr><td>${esc(rule)}</td><td>${esc(who)}</td>
      <td>${badge(state, state === 'Enforced' ? 'b-ok' : 'b-warn')}</td></tr>`).join('');

  const conditions = [
    ['Receipt above the large-transaction threshold', LARGE_TXNS.filter(t => t.amount >= RULES.largeTxn).length, 'High'],
    ['Same amount to the same facility inside the window', PAY_DUPLICATES.length, 'High'],
    ['More than ' + RULES.failedLogin + ' refused sign-ins', ACCESS_EVENTS.filter(a => a.failedLogins >= RULES.failedLogin).length, 'Critical'],
    ['Facility above the officer approval limit', LOAN_CHECKS.filter(c => !c.tests.authority).length, 'High'],
    ['Facility above the maximum single exposure', LOANS.filter(l => l.amount > RULES.maxLoan).length, 'Critical'],
    ['KYC documents past their date', DOC_ISSUES.filter(d => d.state === 'Expired').length, 'Medium'],
    ['Receipt corrected without approval', CORRECTIONS.filter(c => !c.approved).length, 'High'],
    ['Case open beyond the escalation window', CASES.filter(c => !/^(Resolved|Closed)$/.test(c.status) && daysBetween(c.opened, TODAY) * 24 > RULES.escalationHours).length, 'Medium']
  ];
  el('condHead').innerHTML = '<tr><th>Detection rule</th><th class="num">Caught</th><th>Raises</th></tr>';
  el('condBody').innerHTML = conditions.map(([rule, n, sev]) => `<tr><td>${esc(rule)}</td>
      <td class="num">${num(n)}</td><td>${badge(sev, sevTone(sev))}</td></tr>`).join('');

  el('ruleQueuePill').textContent = RULE_QUEUE.filter(r => r.status === 'Pending').length;
  renderTable('ruleQueueBody', [
    {k:'id', label:'Change'},
    {k:'what', label:'Proposed change'},
    {k:'by', label:'Raised by'},
    {k:'raised', label:'Raised', html:v => fmtDate(v)},
    {k:'status', label:'Status', html:v => badge(v, statTone(v))},
    {k:'act', label:'', html:(v, r) => r.status === 'Pending'
        ? `<button class="btn btn-ghost" data-rule="${r.id}" data-approve="1">Approve</button>` : '—'}
  ], RULE_QUEUE, {sort:'raised', pageSize:5});

  renderTable('ruleHistBody', [
    {k:'when', label:'When', html:v => fmtDate(v)},
    {k:'what', label:'Change'},
    {k:'who', label:'Made by'},
    {k:'approvedBy', label:'Approved by'}
  ], RULE_HISTORY.slice().sort((a, b) => a.when < b.when ? 1 : -1), {sort:'when', pageSize:6});
}

function saveRules(){
  const before = Object.assign({}, RULES);
  RULES.largeTxn = Math.max(100000, Number(el('ruleLarge').value) || RULES.largeTxn);
  RULES.dupWindow = Math.max(1, Number(el('ruleDup').value) || RULES.dupWindow);
  RULES.failedLogin = Math.max(1, Number(el('ruleLogin').value) || RULES.failedLogin);
  RULES.maxLoan = Math.max(100000, Number(el('ruleMaxLoan').value) || RULES.maxLoan);
  RULES.kycRenewal = Math.max(1, Number(el('ruleKyc').value) || RULES.kycRenewal);
  RULES.escalationHours = Math.max(1, Number(el('ruleEsc').value) || RULES.escalationHours);
  const changed = Object.keys(RULES).filter(k => ['largeTxn','dupWindow','failedLogin','maxLoan','kycRenewal','escalationHours'].includes(k)
    && before[k] !== RULES[k]);
  if(!changed.length) return toast('No threshold changed.', 'info');
  changed.forEach(k => RULE_HISTORY.unshift({when:TODAY, who:'Chikondi Mwale',
    what:`${k} changed from ${num(before[k])} to ${num(RULES[k])}`, approvedBy:'Tadala Msonthi'}));
  logConfig('Thresholds updated: ' + changed.join(', '));
  el('ruleState').textContent = 'Saved';
  el('ruleState').className = 'badge b-ok';
  renderAll();
  toast('Thresholds saved — every finding has been recalculated');
}

/* ===================== 14 · INTELLIGENCE DASHBOARD ===================== */
function renderIntelligence(){
  const s = complianceStats();
  const loans = riskLoans();
  const active = loans.filter(l => l.status === 'Active');
  const arrears = sum(active, l => l.arrears);
  const exposure = sum(active, l => l.outstanding);
  const par = pct(arrears, exposure || 1);
  const openCases = CASES.filter(c => !/^(Resolved|Closed)$/.test(c.status));
  const highRiskCust = [];
  const byCust = {};
  active.forEach(l => {
    const e = byCust[l.cust] = byCust[l.cust] || {outstanding:0, arrears:0, late:0};
    e.outstanding += l.outstanding; e.arrears += l.arrears;
  });
  Object.keys(byCust).forEach(cust => {
    byCust[cust].late = PAYS.filter(p => p.cust === cust && p.timing === 'Late').length;
  });
  Object.entries(byCust).forEach(([cust, v]) => {
    const score = (v.arrears > 0 ? 40 : 0) + Math.min(30, v.late * 5) + (v.outstanding > 2000000 ? 20 : 0);
    if(score >= 40) highRiskCust.push({cust, name:custName(cust), outstanding:v.outstanding, arrears:v.arrears,
      late:v.late, score, band: score >= 70 ? 'High' : 'Elevated', _open: () => openCustomerRisk(cust)});
  });
  highRiskCust.sort((a, b) => b.score - a.score);
  const staffRisk = ACCESS_EVENTS.map(a => ({
    name:a.name, role:a.role, score: a.failedLogins * 10 + a.afterHours * 5 + a.offBranch * 4 +
      CORRECTIONS.filter(c => c.staff === a.staff && !c.approved).length * 12,
    failed:a.failedLogins, after:a.afterHours, _open: () => openStaffAccess(a.staff)
  })).sort((a, b) => b.score - a.score);
  const repeated = {};
  EXCEPTIONS.forEach(e => { repeated[e.label] = (repeated[e.label] || 0) + 1; });
  const repeatedRows = Object.entries(repeated).filter(([, n]) => n > 1)
    .map(([label, n]) => ({label, n})).sort((a, b) => b.n - a.n)
    .map(r => Object.assign(r, {share: r1(pct(r.n, EXCEPTIONS.length))}));

  el('intelPill').className = 'badge ' + (s.score >= 85 ? 'b-ok' : s.score >= 70 ? 'b-warn' : 'b-crit');
  el('intelPill').textContent = 'Risk index ' + (100 - s.score);

  el('intelKpis').innerHTML = [
    ['Compliance risk summary', s.score + '%', 'Composite control score', 'gold'],
    ['High-risk customers', num(highRiskCust.length), 'Exposure, arrears and lateness combined', highRiskCust.length ? 'red' : ''],
    ['Portfolio at risk', r1(par) + '%', money(arrears) + ' overdue', ''],
    ['Suspicious activity', num(CASES.filter(c => /Fraud|Transaction/.test(c.lane)).length), 'Fraud and transaction cases', ''],
    ['Unresolved cases', num(openCases.length), `${num(openCases.filter(c => c.due < TODAY).length)} overdue`, openCases.length ? 'red' : ''],
    ['Policy exceptions', num(EXCEPTIONS.filter(e => e.status !== 'Resolved').length), 'Open breaches across the book', '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join('');

  const riskTrend = RISK_HISTORY.map(r => r.par);
  const excByMonth = countBy(EXCEPTIONS, e => e.raised);
  const caseByMonth = countBy(CASES, c => c.opened);
  el('intelGrid').innerHTML = [
    chartBox({title:'Unusual transaction trends', sub:'Signals raised per month', value:num(CASES.length),
      chart: chart({type:'line', cats:caseByMonth.cats, h:200,
        series:[{name:'Cases', data:caseByMonth.data, colour:'#7C5CF0'}]})}),
    chartBox({title:'Loan portfolio risk trends', sub:'Portfolio at risk by month', value:r1(par) + '%',
      chart: chart({type:'line', cats:RISK_HISTORY.map(r => monthLabel(r.month)), h:200,
        series:[{name:'PAR %', data:riskTrend, colour:'#D93F3F'}]})}),
    chartBox({title:'Emerging arrears patterns', sub:'Overdue value by bucket', value:money(arrears),
      chart: chart({type:'bar', cats:AGES.filter(a => a !== 'Current'), h:200,
        series:[{name:'Arrears', data:AGES.filter(a => a !== 'Current').map(b =>
          sum(active.filter(l => l.ageBucket === b), l => l.arrears)), colour:'#E08C1E'}]})}),
    chartBox({title:'Suspicious activity trends', sub:'Fraud and access signals by month', value:num(CASES.filter(c => /Fraud/.test(c.lane)).length),
      chart: chart({type:'bar', cats:caseByMonth.cats, h:200,
        series:[{name:'Fraud signals', data:caseByMonth.keys.map(k =>
          CASES.filter(c => c.lane === 'Fraud' && bucketKey(c.opened) === k).length), colour:'#B32C2C'}]})}),
    chartBox({title:'Policy exceptions over time', sub:'Breaches raised per month', value:num(EXCEPTIONS.length),
      chart: chart({type:'bar', cats:excByMonth.cats, h:200,
        series:[{name:'Exceptions', data:excByMonth.data, colour:'#C9A227'}]})}),
    chartBox({title:'Case load by lane', sub:'Where the work sits', value:num(CASES.length),
      chart: chart({type:'donut', cats:[...new Set(CASES.map(c => c.lane))], h:200,
        series:[{data:[...new Set(CASES.map(c => c.lane))].map(l => CASES.filter(c => c.lane === l).length)}], colours:PALETTE})})
  ].join('');

  renderTable('intelCustBody', [
    {k:'name', label:'Customer'},
    {k:'outstanding', label:'Exposure', num:true, html:v => money(v)},
    {k:'arrears', label:'Arrears', num:true, html:v => money(v)},
    {k:'late', label:'Late', num:true},
    {k:'band', label:'Band', html:v => badge(v, v === 'High' ? 'b-crit' : 'b-warn')}
  ], highRiskCust, {sort:'score', pageSize:7, onRow:true});

  renderTable('intelStaffBody', [
    {k:'name', label:'Officer'},
    {k:'role', label:'Role'},
    {k:'failed', label:'Refused', num:true},
    {k:'after', label:'After hours', num:true},
    {k:'score', label:'Risk points', num:true}
  ], staffRisk, {sort:'score', pageSize:7, onRow:true});

  renderTable('intelExcBody', [
    {k:'label', label:'Policy breach'},
    {k:'n', label:'Occurrences', num:true},
    {k:'share', label:'Share', num:true, html:v => v + '%'}
  ], repeatedRows, {sort:'n', pageSize:6});

  const openSorted = openCases.slice().sort((a, b) => a.opened < b.opened ? -1 : 1);
  renderTable('intelCaseBody', [
    {k:'id', label:'Case'},
    {k:'title', label:'Subject'},
    {k:'age', label:'Days open', num:true},
    {k:'owner', label:'Owner'}
  ], openSorted.map(c => ({id:c.id, title:c.title, age:daysBetween(c.opened, TODAY),
      owner:staffName(c.owner), _open: () => selectCase(c.id)})), {sort:'age', pageSize:7, onRow:true});

  const actions = [
    ['Close the ' + EXCEPTIONS.filter(e => e.test === 'authority' && e.status !== 'Resolved').length + ' facilities released above the approval authority',
      'Credit sign-off is the weakest control in the book at the moment.', 's3', 'Open section'],
    ['Contact the ' + DOC_ISSUES.filter(d => d.state === 'Expired').length + ' customers with expired documents',
      'A KYC gap is a supervisory finding waiting to happen.', 's2', 'Open section'],
    ['Resolve the ' + CASES.filter(c => c.severity === 'Critical' && !/^(Resolved|Closed)$/.test(c.status)).length + ' critical cases',
      'Critical cases escalate to the board within one hour.', 's9', 'Open section'],
    ['Evidence the ' + s.regsReview.length + ' regulatory items still in review',
      'Quarterly reporting depends on this evidence being filed.', 's8', 'Open section'],
    ['Sign off the ' + FINDINGS.filter(f => f.status !== 'Closed').length + ' open audit findings',
      'Corrective actions are running past their agreed dates.', 's10', 'Open section']
  ];
  el('intelActions').innerHTML = actions.map(([title, why, go, act], i) => `<div class="risk">
      <div><div class="rn">${i + 1}. ${esc(title)}</div><div class="rs">${esc(why)}</div></div>
      <div class="rv"><button class="btn btn-ghost" data-goto="${go}">${act}</button></div>
    </div>`).join('');
}

/* ===================== 15 · SETTINGS ===================== */
const UI = {assign:'round'};
function renderSettings(){
  el('officerBody').innerHTML = SETTINGS.officers.map(([name, scope, level, view, decide, config]) => `<tr>
      <td><b>${esc(name)}</b><div class="qhint" style="margin:0">${esc(level)}</div></td>
      <td>${esc(scope)}</td>
      <td>${badge(view ? 'Yes' : 'No', view ? 'b-ok' : 'b-gray')}</td>
      <td>${badge(decide ? 'Yes' : 'No', decide ? 'b-ok' : 'b-gray')}</td>
      <td>${badge(config ? 'Yes' : 'No', config ? 'b-ok' : 'b-gray')}</td>
    </tr>`).join('');

  el('workflowBody').innerHTML = SETTINGS.workflows.map(([name, route, signoff, active]) => `<tr>
      <td><b>${esc(name)}</b></td><td>${esc(route)}</td><td>${esc(signoff)}</td>
      <td>${badge(active ? 'Active' : 'Off', active ? 'b-ok' : 'b-gray')}</td></tr>`).join('');

  el('assignChips').querySelectorAll('[data-assign]').forEach(c =>
    c.classList.toggle('on', c.dataset.assign === UI.assign));
  el('assignNote').textContent = UI.assign === 'round' ? 'New cases go to the analyst with the fewest open cases.'
    : UI.assign === 'lane' ? 'Cases are routed by lane: KYC to customer care, transactions to finance, access to the administrator.'
    : 'Critical cases go straight to the compliance officer and are copied to the head of credit.';

  el('severityBody').innerHTML = SETTINGS.severities.map(([level, target, to]) => `<tr>
      <td>${badge(level, sevTone(level))}</td><td>${esc(target)}</td><td>${esc(to)}</td></tr>`).join('');

  el('evidPermBody').innerHTML = [
    ['Compliance officer', 'Yes', 'Yes', 'Yes'],
    ['Compliance analyst', 'Yes', 'Yes', 'No'],
    ['Head of credit', 'Yes', 'No', 'No'],
    ['External auditor', 'Yes', 'No', 'No'],
    ['Customer care', 'No', 'No', 'No']
  ].map(([role, v, d, x]) => `<tr><td>${esc(role)}</td>
      <td>${badge(v, v === 'Yes' ? 'b-ok' : 'b-gray')}</td>
      <td>${badge(d, d === 'Yes' ? 'b-ok' : 'b-gray')}</td>
      <td>${badge(x, x === 'Yes' ? 'b-crit' : 'b-gray')}</td></tr>`).join('');

  el('retentionBody').innerHTML = SETTINGS.retention.map(([what, keep]) =>
    `<tr><td>${esc(what)}</td><td>${esc(keep)}</td></tr>`).join('');

  el('notifyChips').innerHTML = SETTINGS.notifications.map(([what, channel, on], i) =>
    `<span class="fchip${on ? ' on' : ''}" data-notify="${i}">${esc(what)} · ${esc(channel)}</span>`).join('');

  renderTable('regCfgBody', [
    {k:'name', label:'Requirement'},
    {k:'body', label:'Body'},
    {k:'owner', label:'Owner'},
    {k:'status', label:'Status', html:v => badge(v, statTone(v))}
  ], REGS.map(r => ({name:r.name, body:r.body, owner:staffName(r.owner), status:r.status})),
    {sort:'name', pageSize:6});

  const history = [...SETTINGS.history].sort((a, b) => a.when < b.when ? 1 : -1);
  renderTable('cfgBody', [
    {k:'when', label:'When'},
    {k:'who', label:'By'},
    {k:'what', label:'Change'}
  ], history, {sort:'when', pageSize:6});
}

/* ===================== render everything ===================== */
function renderAll(){
  renderOverview();
  renderKYC();
  renderLoanCompliance();
  renderTransactions();
  renderFraud();
  renderRisk();
  renderStaffCompliance();
  renderRegulatory();
  renderCases();
  renderAudit();
  renderReportCards();
  renderDataProtection();
  renderRules();
  renderIntelligence();
  renderSettings();
  renderExportHistory();
  const t = el('topRefresh');
  if(t) t.textContent = lastRefresh();
}

/* ===================== wiring ===================== */
function syncFilterInputs(){
  const set = (id, v) => { const n = el(id); if(n) n.value = v; };
  set('fltSeverity', FILTER.severity); set('fltStatus', FILTER.status);
  set('fltOwner', FILTER.owner); set('fltRegion', FILTER.region); set('fltProduct', FILTER.product);
  set('fltFrom', FILTER.from); set('fltTo', FILTER.to); set('fltSearch', FILTER.q);
}
function syncLaneChips(){
  document.querySelectorAll('#fltLaneChips [data-lane]').forEach(c =>
    c.classList.toggle('on', c.dataset.lane === FILTER.lane));
}
function fillSelects(){
  const put = (id, items, all) => {
    const s = el(id);
    if(!s) return;
    s.innerHTML = `<option value="">${all}</option>` +
      items.map(([v, l]) => `<option value="${esc(v)}">${esc(l)}</option>`).join('');
  };
  put('fltProduct', PRODUCTS.map(p => [p.id, p.name]), 'All products');
  put('fltStatus', CASE_STATES.map(s => [s, s]), 'All case states');
  put('fltOwner', REVIEWERS.map(r => [r, staffName(r)]), 'All owners');
  put('fltRegion', REGIONS.map(r => [r, r]), 'All regions');
  put('fltSeverity', [['Critical','Critical'],['High','High'],['Medium','Medium'],['Low','Low']], 'All severities');
}

function applyFilters(){
  FILTER.severity = el('fltSeverity').value;
  FILTER.status = el('fltStatus').value;
  FILTER.owner = el('fltOwner').value;
  FILTER.region = el('fltRegion').value;
  FILTER.product = el('fltProduct').value;
  FILTER.from = el('fltFrom').value || FILTER.from;
  FILTER.to = el('fltTo').value || FILTER.to;
  FILTER.q = el('fltSearch').value.trim();
  syncLaneChips();
  renderAll();
  renderFilterSummary();
  toast('Filters applied across all fifteen sections');
}
function renderFilterSummary(){
  syncLaneChips();
  const bits = [];
  if(FILTER.lane) bits.push(['Lane: ' + FILTER.lane, 'lane']);
  if(FILTER.severity) bits.push(['Severity: ' + FILTER.severity, 'severity']);
  if(FILTER.status) bits.push(['Status: ' + FILTER.status, 'status']);
  if(FILTER.owner) bits.push(['Owner: ' + staffName(FILTER.owner), 'owner']);
  if(FILTER.region) bits.push(['Region: ' + FILTER.region, 'region']);
  if(FILTER.product) bits.push(['Product: ' + prodName(FILTER.product), 'product']);
  if(FILTER.q) bits.push(['Search: ' + FILTER.q, 'q']);
  bits.push([`${fmtDate(FILTER.from)} – ${fmtDate(FILTER.to)}`, 'range']);
  const chips = el('fltChips');
  if(chips) chips.innerHTML = bits.map(([label, key]) =>
    `<span class="fchip on" data-clear="${key}">${esc(label)} <span class="x">✕</span></span>`).join('');
  const sum2 = el('fltSummary');
  if(sum2) sum2.textContent = bits.length > 1 ? (bits.length - 1) + ' filter' + (bits.length === 2 ? '' : 's') + ' applied' : 'Date range only';
  const result = el('fltResult');
  if(result) result.textContent = `This filter covers ${num(casesInView().length)} cases, ` +
    `${num(KYC.filter(k => !FILTER.status || k.status === FILTER.status).length)} KYC files, ` +
    `${num(EXCEPTIONS.filter(e => !FILTER.severity || e.severity === FILTER.severity).length)} policy exceptions and ` +
    `${num(riskLoans().length)} facilities.`;
  const counts = el('fltCounts');
  if(counts) counts.innerHTML = [
    ['Cases', num(casesInView().length)],
    ['KYC files', num(KYC.length)],
    ['Exceptions', num(EXCEPTIONS.length)],
    ['Findings', num(FINDINGS.length)],
    ['Transactions', num(TXNS.length)],
    ['Customers', num(CUSTOMERS.length)]
  ].map(([l, v]) => `<div><div class="sl">${l}</div><div class="sv">${v}</div></div>`).join('');
}

function clearFilter(key){
  if(key === 'lane') FILTER.lane = '';
  else if(key === 'severity') FILTER.severity = '';
  else if(key === 'status') FILTER.status = '';
  else if(key === 'owner') FILTER.owner = '';
  else if(key === 'region') FILTER.region = '';
  else if(key === 'product') FILTER.product = '';
  else if(key === 'q') FILTER.q = '';
  else if(key === 'range'){ FILTER.from = '2026-01-01'; FILTER.to = TODAY; }
}

/* section navigation shared by every drill-through button */
function goto(id){
  const sec = document.getElementById(id);
  document.querySelectorAll('.snav').forEach(a =>
    a.classList.toggle('on', a.getAttribute('href') === '#' + id));
  if(!sec) return;
  try { sec.scrollIntoView({behavior:'smooth', block:'start'}); } catch(e){}
  if(window.history && history.replaceState) history.replaceState(null, '', '#' + id);
}
function spyScroll(){
  const secs = [...document.querySelectorAll('section.sec')];
  if(!secs.length) return;
  let current = secs[0];
  secs.forEach(s => { if(s.getBoundingClientRect().top <= 170) current = s; });
  document.querySelectorAll('.snav').forEach(a =>
    a.classList.toggle('on', a.getAttribute('href') === '#' + current.id));
}

function wireAll(){
  document.querySelectorAll('.snav').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      goto(a.getAttribute('href').slice(1));
    });
  });

  document.addEventListener('click', e => {
    const g = e.target.closest('[data-goto]');
    if(g){ goto(g.dataset.goto); return; }
    if(sortOrPage(e)) return;

    const cw = e.target.closest('[data-cw]');
    if(cw){ caseAction(cw.dataset.cw); return; }

    const task = e.target.closest('[data-task]');
    if(task){
      const t = COMPLIANCE_TASKS.find(x => x.id === task.dataset.task);
      if(t){
        t.status = t.status === 'Done' ? 'Open' : 'Done';
        logConfig('Task ' + t.id + ' marked ' + t.status.toLowerCase());
        renderAll();
        toast(t.title + ' · ' + t.status.toLowerCase());
      }
      return;
    }

    const dreq = e.target.closest('[data-dreq]');
    if(dreq){
      const r = DATA_REQUESTS.find(x => x.id === dreq.dataset.dreq);
      if(r){
        const order = ['Open','In progress','Completed'];
        const i = order.indexOf(r.status);
        r.status = r.status === 'Completed' ? 'Open' : order[Math.min(order.length - 1, i + 1)];
        logConfig('Data request ' + r.id + ' moved to ' + r.status);
        renderAll();
        toast(r.id + ' · ' + r.status);
      }
      return;
    }

    const rule = e.target.closest('[data-rule]');
    if(rule){
      const q = RULE_QUEUE.find(x => x.id === rule.dataset.rule);
      if(q){
        q.status = 'Approved';
        RULE_HISTORY.unshift({when:TODAY, who:'Chikondi Mwale', what:q.what, approvedBy:staffName('STF-003')});
        logConfig('Rule change ' + q.id + ' approved');
        renderAll();
        toast(q.id + ' approved and added to the rule history');
      }
      return;
    }

    const rep = e.target.closest('[data-rep]');
    if(rep){ runReport(rep.dataset.rep, rep.dataset.fmt); return; }

      const lane = e.target.closest('#fltLaneChips [data-lane]');
    if(lane){
      FILTER.lane = lane.dataset.lane;
      syncLaneChips();
      renderAll(); renderFilterSummary();
      toast(FILTER.lane ? 'Lane: ' + FILTER.lane : 'All lanes', 'info');
      return;
    }

    const chip = e.target.closest('[data-clear]');
    if(chip){ clearFilter(chip.dataset.clear); syncFilterInputs(); renderAll(); renderFilterSummary(); return; }

    const notif = e.target.closest('[data-notify]');
    if(notif){
      const i = Number(notif.dataset.notify);
      SETTINGS.notifications[i][2] = !SETTINGS.notifications[i][2];
      notif.classList.toggle('on');
      logConfig('Notification "' + SETTINGS.notifications[i][0] + '" turned ' + (SETTINGS.notifications[i][2] ? 'on' : 'off'));
      el('setState').textContent = 'Saved';
      toast('Notification setting updated');
      return;
    }

    const assign = e.target.closest('[data-assign]');
    if(assign){
      UI.assign = assign.dataset.assign;
      renderSettings();
      logConfig('Case assignment rule set to "' + assign.dataset.assign + '"');
      toast('Assignment rule updated');
      return;
    }
  });

  const apply = el('fltApply');
  if(apply) apply.addEventListener('click', applyFilters);
  const reset = el('fltReset');
  if(reset) reset.addEventListener('click', () => {
    FILTER.lane = FILTER.severity = FILTER.status = FILTER.owner = FILTER.region = FILTER.product = FILTER.q = '';
    FILTER.from = '2026-01-01'; FILTER.to = TODAY;
    syncFilterInputs(); renderAll(); renderFilterSummary();
    toast('All filters cleared', 'info');
  });
  ['fltSeverity','fltStatus','fltOwner','fltRegion','fltProduct'].forEach(id => {
    const n = el(id);
    if(n) n.addEventListener('change', applyFilters);
  });
  const search = el('fltSearch');
  if(search) search.addEventListener('keydown', e => { if(e.key === 'Enter') applyFilters(); });
  const gSearch = el('globalSearch');
  if(gSearch) gSearch.addEventListener('keydown', e => {
    if(e.key !== 'Enter') return;
    FILTER.q = e.target.value.trim();
    const box = el('fltSearch');
    if(box) box.value = FILTER.q;
    renderAll(); renderFilterSummary();
    toast(FILTER.q ? 'Searching for "' + FILTER.q + '"' : 'Search cleared', 'info');
  });

  const refresh = el('refreshBtn');
  if(refresh) refresh.addEventListener('click', () => {
    const now = new Date();
    REFRESH = fmtDate(TODAY) + ' · ' + pad(now.getHours(), 2) + ':' + pad(now.getMinutes(), 2);
    renderAll();
    toast('Compliance data recalculated from the registers');
  });

  el('quickCsv').addEventListener('click', () => runPack('csv'));
  el('printBtn').addEventListener('click', () => runPack('print'));
  el('packCsv').addEventListener('click', () => runPack('csv'));
  el('packXlsx').addEventListener('click', () => runPack('xlsx'));
  el('packPdf').addEventListener('click', () => runPack('pdf'));
  el('packPrint').addEventListener('click', () => runPack('print'));
  el('expImgBtn').addEventListener('click', () => exportChartImage(el('expImgPick').value));
  el('kycExport').addEventListener('click', () => runReport('kyc', 'xlsx'));

  el('ruleSave').addEventListener('click', saveRules);
  el('ruleReset').addEventListener('click', () => {
    RULES.largeTxn = 3000000; RULES.dupWindow = 3; RULES.failedLogin = 5;
    RULES.maxLoan = 5000000; RULES.kycRenewal = 12; RULES.escalationHours = 24;
    logConfig('Thresholds reset to the approved defaults');
    renderAll();
    toast('Thresholds reset', 'info');
  });

  let spyT = null;
  window.addEventListener('scroll', () => {
    clearTimeout(spyT); spyT = setTimeout(spyScroll, 160);
  }, {passive:true});
  const hash = (location.hash || '').slice(1);
  if(hash) goto(hash);

  el('menuBtn').addEventListener('click', () => document.getElementById('sidebar').classList.toggle('open'));
  el('bellBtn').addEventListener('click', () => goto('s9'));
  el('modalClose').addEventListener('click', closeModal);
  el('modal').addEventListener('click', e => { if(e.target.id === 'modal') closeModal(); });
  document.addEventListener('keydown', e => { if(e.key === 'Escape') closeModal(); });
}

/* expose for the verification harness */
window.COMPLIANCE_APP = {
  FILTER, RULES, CASES, KYC, EXCEPTIONS, FINDINGS, REGS, DOC_ISSUES, DUPLICATE_GROUPS,
  PAY_DUPLICATES, LARGE_TXNS, UNALLOCATED, RECON_EXCEPTIONS, ACCESS_EVENTS, CORRECTIONS,
  COMPLIANCE_TASKS, DATA_REQUESTS, CONSENT, EXPORTS, REPORTS, SETTINGS, RULE_HISTORY, RULE_QUEUE,
  complianceStats, reportData, renderAll, selectCase, caseAction, kycDecision, saveRules, goto, runReport, runPack
};

/* boot */
(function(){
  fillSelects();
  syncFilterInputs();
  renderAll();
  renderFilterSummary();
  wireAll();
})();
</script>
</body>
</html>
