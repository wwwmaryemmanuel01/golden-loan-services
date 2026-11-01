<script>
/* ============================================================
   COMPLIANCE & INTELLIGENCE (5/7)
   5 · Fraud & suspicious activity   6 · Credit risk intelligence
   7 · Staff compliance & access     8 · Regulatory & policy
   ============================================================ */

/* ===================== 5 · FRAUD & SUSPICIOUS ACTIVITY ===================== */
function renderFraud(){
  const fraudCases = CASES.filter(c => c.lane === 'Fraud' || c.lane === 'Access');
  const openFraud = fraudCases.filter(c => !/^(Resolved|Closed)$/.test(c.status));
  const blocked = ACCESS_EVENTS.filter(a => a.blocked);
  const unapproved = CORRECTIONS.filter(c => !c.approved);

  el('fraudPill').className = 'badge ' + (openFraud.length > 3 ? 'b-crit' : openFraud.length ? 'b-warn' : 'b-ok');
  el('fraudPill').textContent = openFraud.length + ' open';

  el('fraudKpis').innerHTML = [
    ['Signals triaged', num(DUPLICATE_GROUPS.length + SUSPICIOUS_APPS.length + CORRECTIONS.length + blocked.length),
      'Identity, application, payment and access signals', 'gold'],
    ['Duplicate identities', num(DUPLICATE_GROUPS.length), 'Customer pairs sharing identifiers', DUPLICATE_GROUPS.length ? 'red' : ''],
    ['Blocked accounts', num(blocked.length), 'After repeated failed sign-ins', blocked.length ? 'red' : ''],
    ['Suspicious applications', num(SUSPICIOUS_APPS.length), 'Matching a detection rule', ''],
    ['Corrections without approval', num(unapproved.length), 'Receipts edited by the person who keyed them', unapproved.length ? 'red' : ''],
    ['Open fraud cases', num(openFraud.length), 'Investigations still running', '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join('');

  const types = [...new Set(CASES.map(c => c.type))];
  el('fraudGrid').innerHTML = [
    chartBox({title:'Cases by type', sub:'What the case load is made of', value:num(CASES.length),
      chart: chart({type:'donut', cats:types, h:210,
        series:[{data:types.map(t => CASES.filter(c => c.type === t).length)}], colours:PALETTE})}),
    chartBox({title:'Failed sign-ins by staff member', sub:'Refused attempts in the period', value:num(sum(ACCESS_EVENTS, a => a.failedLogins)),
      chart: chart({type:'bar', cats:ACCESS_EVENTS.map(a => a.name.split(' ')[0]), h:210,
        series:[{name:'Failed sign-ins', data:ACCESS_EVENTS.map(a => a.failedLogins), colour:'#D93F3F'}]})}),
    chartBox({title:'Signals raised over time', sub:'Cases and corrections by month', value:num(CASES.length + CORRECTIONS.length),
      chart: chart({type:'line', cats:countBy(CASES, c => c.opened).cats, h:210,
        series:[{name:'Cases', data:countBy(CASES, c => c.opened).data, colour:'#7C5CF0'}]})})
  ].join('');

  renderTable('fraudDupBody', [
    {k:'pair', label:'Customers'},
    {k:'reason', label:'Match'},
    {k:'strength', label:'Strength', html:v => badge(v, v === 'Strong' ? 'b-crit' : 'b-warn')},
    {k:'region', label:'Region'}
  ], DUPLICATE_GROUPS.map(g => ({
      pair: custName(g.a) + ' ↔ ' + custName(g.b), reason:g.reason, strength:g.strength,
      region: (CUST_BY_ID[g.a] || {}).region || '—', _open: () => openDuplicate(g.a, g.b)
    })), {sort:'strength', pageSize:6, onRow:true});

  renderTable('fraudLoginBody', [
    {k:'name', label:'Officer'},
    {k:'role', label:'Role'},
    {k:'failedLogins', label:'Refused', num:true},
    {k:'afterHours', label:'After hours', num:true},
    {k:'state', label:'State', html:v => badge(v, v === 'Blocked' ? 'b-crit' : 'b-ok')}
  ], ACCESS_EVENTS.filter(a => a.failedLogins > 1).map(a => ({
      name:a.name, role:a.role, failedLogins:a.failedLogins, afterHours:a.afterHours,
      state: a.blocked ? 'Blocked' : 'Open', _open: () => openStaffAccess(a.staff)
    })), {sort:'failedLogins', pageSize:6, onRow:true});

  el('suspAppPill').textContent = SUSPICIOUS_APPS.length;
  renderTable('suspAppBody', [
    {k:'app', label:'Application'},
    {k:'cust', label:'Customer'},
    {k:'amount', label:'Requested', num:true, html:v => money(v)},
    {k:'signal', label:'Signal'},
    {k:'severity', label:'Severity', html:v => badge(v, sevTone(v))}
  ], SUSPICIOUS_APPS.map(a => Object.assign({}, a, {cust:custName(a.cust),
      _open: () => openApp(a.app)})), {sort:'severity', pageSize:6, onRow:true});

  el('corrPill').textContent = CORRECTIONS.length;
  renderTable('corrBody', [
    {k:'receipt', label:'Receipt'},
    {k:'staff', label:'Keyed by'},
    {k:'reason', label:'Reason'},
    {k:'delta', label:'Change', num:true, html:v => money(v)},
    {k:'approved', label:'Approved', html:v => badge(v ? 'Yes' : 'No', v ? 'b-ok' : 'b-crit')}
  ], CORRECTIONS.map(c => ({receipt:c.receipt, staff:staffName(c.staff), reason:c.reason,
      delta:c.after - c.before, approved:c.approved, _open: () => openReceipt(c.receipt)})),
    {sort:'approved', pageSize:6, onRow:true});

  renderTable('fraudRecBody', [
    {k:'id', label:'Case'},
    {k:'title', label:'Subject'},
    {k:'type', label:'Type'},
    {k:'severity', label:'Severity', html:v => badge(v, sevTone(v))},
    {k:'owner', label:'Owner'},
    {k:'status', label:'Status', html:v => badge(v, statTone(v))}
  ], fraudCases.map(c => ({id:c.id, title:c.title, type:c.type, severity:c.severity,
      owner:staffName(c.owner), status:c.status, _open: () => { goto('s9'); selectCase(c.id); }})),
    {sort:'severity', pageSize:7, onRow:true});
}

function openStaffAccess(staffId){
  const a = ACCESS_EVENTS.find(x => x.staff === staffId);
  const s = STAFF_BY_ID[staffId] || {};
  if(!a) return;
  openModal(s.name || staffId, s.role + ' · ' + s.branch,
    `<div class="pfields">
      ${field('Failed sign-ins', num(a.failedLogins))}
      ${field('After-hours sessions', num(a.afterHours))}
      ${field('Off-branch sessions', num(a.offBranch))}
      ${field('Last sign-in', esc(a.lastLogin))}
      ${field('Privileged account', a.privileged ? badge('Yes', 'b-warn') : badge('No', 'b-gray'))}
      ${field('Role changes', num(a.roleChanges))}
      ${field('State', a.blocked ? badge('Blocked', 'b-crit') : badge('Active', 'b-ok'))}
    </div>
    <div class="qhint">Access is reviewed monthly; blocked accounts can only be released by the administrator.</div>`,
    [{label: a.blocked ? 'Release account' : 'Block account', act:() => {
        a.blocked = !a.blocked;
        a.failedLogins = a.blocked ? RULES.failedLogin : 0;
        closeModal(); renderAll();
        toast(s.name + (a.blocked ? ' blocked' : ' released'));
      }}, {label:'Close', act:'close'}]);
}

function openApp(ref){
  const a = APPS.find(x => x.ref === ref);
  if(!a) return;
  openModal('Application ' + a.ref, custName(a.cust) + ' · ' + prodName(a.product),
    `<div class="pfields">
      ${field('Requested', money(a.amount))}
      ${field('Term', a.term + ' months')}
      ${field('Submitted', fmtDate(a.submitted))}
      ${field('Status', badge(a.status, statTone(a.status)))}
      ${field('Officer', esc(staffName(a.officer)))}
      ${field('Region', esc(a.region))}
      ${a.reason ? field('Reason', esc(a.reason)) : ''}
    </div>`, [{label:'Close', act:'close'}]);
}

/* ===================== 6 · CREDIT RISK INTELLIGENCE ===================== */
function riskLoans(){
  return LOANS.filter(l => matchQ(l.ref, custName(l.cust), l.cust)
    && (!FILTER.region || l.region === FILTER.region)
    && (!FILTER.product || l.product === FILTER.product));
}
function renderRisk(){
  const loans = riskLoans();
  const active = loans.filter(l => l.status === 'Active');
  const overdue = active.filter(l => l.arrears > 0);
  const exposure = sum(active, l => l.outstanding);
  const arrears = sum(active, l => l.arrears);
  const par = pct(arrears, exposure || 1);
  const written = loans.filter(l => l.status === 'Written off');
  const late = PAYS.filter(p => p.timing === 'Late');
  const lateByCust = {};
  late.forEach(p => { lateByCust[p.cust] = (lateByCust[p.cust] || 0) + 1; });
  const repeatLate = Object.entries(lateByCust).filter(([, n]) => n >= 3)
    .map(([cust, n]) => ({cust, name:custName(cust), late:n,
      exposure: sum(LOANS.filter(l => l.cust === cust && l.status === 'Active'), l => l.outstanding),
      arrears: sum(LOANS.filter(l => l.cust === cust && l.status === 'Active'), l => l.arrears),
      _open: () => openCustomerRisk(cust)})).sort((a, b) => b.late - a.late);

  const custExposure = {};
  active.forEach(l => {
    const c = custExposure[l.cust] = custExposure[l.cust] || {outstanding:0, arrears:0, loans:0};
    c.outstanding += l.outstanding; c.arrears += l.arrears; c.loans++;
  });
  const topCust = Object.entries(custExposure).map(([cust, v]) => ({cust, name:custName(cust),
    loans:v.loans, outstanding:v.outstanding, arrears:v.arrears,
    _open: () => openCustomerRisk(cust)})).sort((a, b) => b.outstanding - a.outstanding).slice(0, 12);

  const prodRows = PRODUCTS.map(p => {
    const mine = active.filter(l => l.product === p.id);
    const out = sum(mine, l => l.outstanding), arr = sum(mine, l => l.arrears);
    return {name:p.name, loans:mine.length, outstanding:out, arrears:arr, par:r1(pct(arr, out || 1)),
      share:r1(pct(out, exposure || 1))};
  });

  el('riskPill').className = 'badge ' + (par > 15 ? 'b-crit' : par > 8 ? 'b-warn' : 'b-ok');
  el('riskPill').textContent = 'PAR ' + r1(par) + '%';

  el('riskKpis').innerHTML = [
    ['Open exposure', money(exposure), `${num(active.length)} active facilities`, 'gold'],
    ['Portfolio at risk', r1(par) + '%', money(arrears) + ' of arrears', par > 12 ? 'red' : ''],
    ['Accounts in arrears', num(overdue.length), money(arrears) + ' overdue', overdue.length ? 'red' : ''],
    ['Over 90 days', num(active.filter(l => l.dpd > 90).length),
      active.filter(l => l.dpd > 90).length
        ? money(sum(active.filter(l => l.dpd > 90), l => l.arrears)) + ' at high risk'
        : 'Nothing beyond 90 days this period', active.filter(l => l.dpd > 90).length ? 'red' : 'blue'],
    ['Default rate', r1(pct(sum(written, l => l.amount), sum(loans, l => l.amount) || 1)) + '%',
      money(sum(written, l => l.amount)) + ' written off', ''],
    ['Repeat late payers', num(repeatLate.length), 'Three or more late receipts', repeatLate.length ? 'red' : '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join('');

  const ageing = AGES.filter(a => a !== 'Current').map(a => sum(active.filter(l => l.ageBucket === a), l => l.arrears));
  el('riskGrid').innerHTML = [
    chartBox({title:'Arrears aging analysis', sub:'Overdue value by days past due', value:money(arrears),
      chart: chart({type:'bar', cats:AGES.filter(a => a !== 'Current'), h:210,
        series:[{name:'Arrears', data:ageing, colour:'#D93F3F'}]})}),
    chartBox({title:'Portfolio at risk trend', sub:'Arrears as a share of open principal', value:r1(par) + '%',
      chart: chart({type:'line', cats:RISK_HISTORY.map(r => monthLabel(r.month)), h:210,
        series:[{name:'PAR %', data:RISK_HISTORY.map(r => r.par), colour:'#7C5CF0'}]})}),
    chartBox({title:'Risk classification history', sub:'Facilities per band, month by month', value:num(RISK_HISTORY.length) + ' months',
      chart: chart({type:'stacked', cats:RISK_HISTORY.map(r => monthLabel(r.month)), h:210,
        series:RISK_CLASSES.map((b, i) => ({name:b, data:RISK_HISTORY.map(r => r.bands[i]),
          colour:['#1E9E6A','#0E9AA7','#E08C1E','#D93F3F','#7C1F1F'][i]}))})})
  ].join('');

  const high = [...overdue].sort((a, b) => b.dpd - a.dpd || b.arrears - a.arrears).slice(0, 20);
  el('riskAcctPill').textContent = high.length;
  renderTable('riskAcctBody', [
    {k:'ref', label:'Facility'},
    {k:'cust', label:'Customer'},
    {k:'product', label:'Product'},
    {k:'dpd', label:'Days past due', num:true},
    {k:'outstanding', label:'Outstanding', num:true, html:v => money(v)},
    {k:'arrears', label:'Arrears', num:true, html:v => money(v)},
    {k:'band', label:'Risk', html:v => badge(v, v === 'High' ? 'b-crit' : v === 'Elevated' ? 'b-warn' : 'b-gray')}
  ], high.map(l => ({ref:l.ref, cust:custName(l.cust), product:prodName(l.product), dpd:l.dpd,
      outstanding:l.outstanding, arrears:l.arrears, band:riskOf(l), _open: () => openLoan(l.ref)})),
    {sort:'dpd', pageSize:8, onRow:true});

  renderTable('riskCustBody', [
    {k:'name', label:'Customer'},
    {k:'loans', label:'Facilities', num:true},
    {k:'outstanding', label:'Outstanding', num:true, html:v => money(v)},
    {k:'arrears', label:'Arrears', num:true, html:v => money(v)}
  ], topCust, {sort:'outstanding', pageSize:7, onRow:true});

  el('riskProdHead').innerHTML = '<tr><th>Product</th><th class="num">Open</th><th class="num">Outstanding</th>' +
    '<th class="num">Arrears</th><th class="num">PAR</th><th class="num">Share</th></tr>';
  el('riskProdBody').innerHTML = prodRows.map(p => `<tr>
      <td>${esc(p.name)}</td><td class="num">${num(p.loans)}</td><td class="num">${money(p.outstanding)}</td>
      <td class="num">${money(p.arrears)}</td><td class="num">${p.par}%</td><td class="num">${p.share}%</td></tr>`).join('');

  renderTable('riskLateBody', [
    {k:'name', label:'Customer'},
    {k:'late', label:'Late receipts', num:true},
    {k:'outstanding', label:'Outstanding', num:true, html:v => money(v)},
    {k:'arrears', label:'Arrears', num:true, html:v => money(v)}
  ], repeatLate, {sort:'late', pageSize:7, onRow:true});

  el('riskHistHead').innerHTML = '<tr><th>Month</th>' + RISK_CLASSES.map(b => `<th class="num">${b}</th>`).join('') + '<th class="num">PAR</th></tr>';
  el('riskHistBody').innerHTML = RISK_HISTORY.map(r => `<tr><td>${monthLabel(r.month)}</td>` +
    r.bands.map(n => `<td class="num">${num(n)}</td>`).join('') + `<td class="num">${r.par}%</td></tr>`).join('');
}

function openCustomerRisk(custId){
  const c = CUST_BY_ID[custId] || {};
  const loans = LOANS.filter(l => l.cust === custId);
  const pays = PAYS.filter(p => p.cust === custId);
  openModal(c.name || custId, 'Credit risk profile · ' + (c.region || ''),
    `<div class="pfields">
      ${field('Facilities', num(loans.length))}
      ${field('Exposure', money(sum(loans.filter(l => l.status === 'Active'), l => l.outstanding)))}
      ${field('Arrears', money(sum(loans.filter(l => l.status === 'Active'), l => l.arrears)))}
      ${field('Receipts', num(pays.length))}
      ${field('Late receipts', num(pays.filter(p => p.timing === 'Late').length))}
      ${field('On-time share', r1(pct(pays.filter(p => p.timing === 'On time').length, pays.length || 1)) + '%')}
      ${field('KYC', badge((kycFor(custId) || {}).status || '—', statTone((kycFor(custId) || {}).status || '')))}
      ${field('Declared income', money(c.income || 0))}
    </div>
    <div class="minihead">Facilities</div>
    <div class="tblwrap" style="max-height:200px"><table class="tbl2 dense">
      <thead><tr><th>Facility</th><th>Product</th><th class="num">Outstanding</th><th class="num">Arrears</th><th>Risk</th></tr></thead>
      <tbody>${loans.map(l => `<tr><td>${esc(l.ref)}</td><td>${esc(prodName(l.product))}</td>
        <td class="num">${money(l.outstanding)}</td><td class="num">${money(l.arrears)}</td>
        <td>${badge(riskOf(l), riskOf(l) === 'High' ? 'b-crit' : riskOf(l) === 'Low' ? 'b-ok' : 'b-warn')}</td></tr>`).join('')}</tbody>
    </table></div>`, [{label:'Close', act:'close'}]);
}

  const pats = DISB.map((x, i) => {
    const loan = LOAN_BY_REF[x.loan] || {};
    const limit = AUTHORITY[(STAFF_BY_ID[loan.officer] || {}).role] || 0;
    const over = limit > 0 && x.amount > limit;
    const offHours = i % 17 === 2;
    const changed = i % 13 === 4;
    const signals = [];
    if(x.amount !== x.approved) signals.push('Released amount differs from the approved figure');
    if(offHours) signals.push('Released outside branch hours');
    if(changed) signals.push('Paid to a changed destination account');
    if(over) signals.push('Above the approving officer limit');
    return {ref:x.ref, loan:x.loan, cust:custName(loan.cust), amount:x.amount, method:x.method,
      date:x.date, status:x.status, signals, n:signals.length,
      _open: () => openLoan(x.loan)};
  }).filter(r => r.n > 0 && r.status === 'Successful').sort((a, b) => b.n - a.n || b.amount - a.amount);
  el('disbPatPill').textContent = pats.length;
  renderTable('disbPatBody', [
    {k:'ref', label:'Payout'},
    {k:'cust', label:'Customer'},
    {k:'amount', label:'Amount', num:true, html:v => money(v)},
    {k:'signals', label:'Pattern', html:v => v.slice(0, 2).join(' · ') + (v.length > 2 ? ` +${v.length - 2}` : '')},
    {k:'n', label:'Signals', num:true}
  ], pats, {sort:'n', pageSize:6, onRow:true});

/* ===================== 7 · STAFF COMPLIANCE & ACCESS ===================== */
function renderStaffCompliance(){
  const events = ACCESS_EVENTS;
  const sod = [];
  LOANS.forEach(l => {
    const receipts = (PAYS_BY_LOAN[l.ref] || []);
    if(receipts.length >= 2 && receipts.filter(p => p.officer === l.officer).length >= 2)
      sod.push({loan:l.ref, officer:l.officer, receipts:receipts.length, amount:l.amount,
        _open: () => openLoan(l.ref)});
  });
  const roleChanges = [
    {when: addDays(TODAY, -26), staff:'STF-004', from:'Credit Analyst', to:'Head of Credit (acting)', by:'STF-009', approved:true},
    {when: addDays(TODAY, -11), staff:'STF-008', from:'Customer Care', to:'Customer Care + KYC reviewer', by:'STF-003', approved:true},
    {when: addDays(TODAY, -4), staff:'STF-007', from:'Cashier', to:'Cashier + payout release', by:'STF-009', approved:false}
  ];
  const priv = events.filter(e => e.privileged);
  const violations = FINDINGS.filter(f => f.category === 'Access management' || f.category === 'Segregation of duties');

  el('staffRiskPill').className = 'badge ' + (sod.length > 4 ? 'b-warn' : 'b-ok');
  el('staffRiskPill').textContent = sod.length + ' SoD gaps';

  el('staffKpis').innerHTML = [
    ['Staff reviewed', num(events.length), 'Access reviewed this cycle', 'gold'],
    ['Privileged accounts', num(priv.length), 'Administrator, head of credit, cashier', ''],
    ['Approvals above authority', num(LOAN_CHECKS.filter(c => !c.tests.authority).length), 'Facilities released beyond the limit', 'red'],
    ['Segregation of duties gaps', num(sod.length), 'One officer handled the whole cycle', sod.length ? 'red' : ''],
    ['Blocked accounts', num(events.filter(e => e.blocked).length), 'Sign-in refused pending review', ''],
    ['Unapproved permission changes', num(roleChanges.filter(r => !r.approved).length), 'Waiting for a second signature', 'red']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join('');

  el('staffGrid').innerHTML = [
    chartBox({title:'Loans approved by officer', sub:'Facilities against the approval limit', value:num(LOANS.length),
      chart: chart({type:'bar', cats:WORKERS.map(s => s.name.split(' ')[0]), h:210,
        series:[{name:'Approved', data:WORKERS.map(s => LOANS.filter(l => l.officer === s.id).length), colour:'#C9A227'}]})}),
    chartBox({title:'Corrections by officer', sub:'Receipts edited after posting', value:num(CORRECTIONS.length),
      chart: chart({type:'bar', cats:WORKERS.map(s => s.name.split(' ')[0]), h:210,
        series:[{name:'Corrections', data:WORKERS.map(s => CORRECTIONS.filter(c => c.staff === s.id).length), colour:'#E08C1E'}]})}),
    chartBox({title:'Access risk by officer', sub:'Refused and after-hours sessions combined', value:num(sum(events, e => e.failedLogins + e.afterHours)),
      chart: chart({type:'bar', cats:events.map(e => e.name.split(' ')[0]), h:210,
        series:[{name:'Signals', data:events.map(e => e.failedLogins + e.afterHours + e.offBranch), colour:'#7C5CF0'}]})})
  ].join('');

  renderTable('staffPermBody', [
    {k:'name', label:'Officer'},
    {k:'role', label:'Role'},
    {k:'privileged', label:'Privileged', html:v => badge(v ? 'Yes' : 'No', v ? 'b-warn' : 'b-gray')},
    {k:'state', label:'State', html:v => badge(v, v === 'Blocked' ? 'b-crit' : 'b-ok')},
    {k:'reviewed', label:'Last review', html:v => fmtDate(v)}
  ], events.map((e, i) => ({name:e.name, role:e.role, privileged:e.privileged,
      state: e.blocked ? 'Blocked' : 'Active', reviewed: addDays(TODAY, -(3 + i * 2)),
      _open: () => openStaffAccess(e.staff)})), {sort:'name', pageSize:7, onRow:true});

  el('sodPill').textContent = sod.length;
  renderTable('sodBody', [
    {k:'loan', label:'Facility'},
    {k:'officer', label:'Officer'},
    {k:'receipts', label:'Receipts', num:true},
    {k:'amount', label:'Principal', num:true, html:v => money(v)}
  ], sod.map(r => Object.assign({}, r, {officer:staffName(r.officer)})), {sort:'receipts', pageSize:6, onRow:true});

  const flagged = events.filter(e => e.failedLogins > 1 || e.afterHours || e.offBranch);
  el('accessPill').textContent = flagged.length;
  renderTable('accessBody', [
    {k:'name', label:'Officer'},
    {k:'what', label:'Signal'},
    {k:'when', label:'Last seen'},
    {k:'state', label:'State', html:v => badge(v, v === 'Blocked' ? 'b-crit' : 'b-warn')}
  ], flagged.map(e => ({
      name:e.name,
      what: [e.failedLogins > 1 ? e.failedLogins + ' refused sign-ins' : '', e.afterHours ? e.afterHours + ' after hours' : '',
        e.offBranch ? e.offBranch + ' off-branch' : ''].filter(Boolean).join(' · '),
      when:e.lastLogin, state: e.blocked ? 'Blocked' : 'Review', _open: () => openStaffAccess(e.staff)
    })), {sort:'name', pageSize:6, onRow:true});

  el('roleHead').innerHTML = '<tr><th>When</th><th>Officer</th><th>Change</th><th>Approved by</th><th>State</th></tr>';
  el('roleBody').innerHTML = roleChanges.map(r => `<tr>
      <td>${fmtDate(r.when)}</td><td>${esc(staffName(r.staff))}</td>
      <td>${esc(r.from)} → ${esc(r.to)}</td><td>${esc(staffName(r.by))}</td>
      <td>${badge(r.approved ? 'Approved' : 'Pending', r.approved ? 'b-ok' : 'b-warn')}</td></tr>`).join('');

  const authRows = LOAN_CHECKS.filter(c => !c.tests.authority).map(c => ({
    ref:c.loan.ref, cust:custName(c.loan.cust), amount:c.loan.amount,
    officer:staffName(c.loan.officer), role:(STAFF_BY_ID[c.loan.officer] || {}).role || '—',
    limit:AUTHORITY[(STAFF_BY_ID[c.loan.officer] || {}).role] || 0,
    _open: () => openLoan(c.loan.ref)
  })).sort((a, b) => b.amount - a.amount);
  el('disbAuthPill').textContent = authRows.length;
  renderTable('disbAuthBody', [
    {k:'ref', label:'Facility'},
    {k:'officer', label:'Released by'},
    {k:'role', label:'Role'},
    {k:'limit', label:'Limit', num:true, html:v => money(v)},
    {k:'amount', label:'Approved', num:true, html:v => money(v)}
  ], authRows, {sort:'amount', pageSize:6, onRow:true});

  const reviews = WORKERS.map((s, i) => ({
    staff:s.id, when: addDays(TODAY, -(5 + i * 9)),
    outcome: i % 4 === 3 ? 'Follow-up required' : 'No action needed',
    areas: ['Access','Approvals','Corrections','Cash handling'][i % 4]
  }));
  renderTable('staffHistBody', [
    {k:'when', label:'Reviewed', html:v => fmtDate(v)},
    {k:'who', label:'Officer'},
    {k:'areas', label:'Area'},
    {k:'outcome', label:'Outcome', html:v => badge(v, v === 'No action needed' ? 'b-ok' : 'b-warn')}
  ], reviews.map(r => Object.assign({}, r, {who:staffName(r.staff)})), {sort:'when', pageSize:6});
}

/* ===================== 8 · REGULATORY & POLICY ===================== */
function renderRegulatory(){
  const regs = REGS.filter(r => matchQ(r.name, r.body, r.requirement) && (!FILTER.owner || r.owner === FILTER.owner));
  const tasks = COMPLIANCE_TASKS.filter(t => matchQ(t.title, t.cat) && (!FILTER.owner || t.owner === FILTER.owner));
  const compliant = REGS.filter(r => r.status === 'Compliant').length;
  const evidence = [];
  REGS.forEach(r => evidence.push({what:r.evidence, for:r.id, kind:'Requirement', owner:r.owner, when:r.checked}));
  CASES.filter(c => c.evidence.length).forEach(c => c.evidence.forEach(e =>
    evidence.push({what:e.what, for:c.id, kind:'Case', owner:e.by || c.owner, when:e.when || c.opened})));

  el('regPill').className = 'badge ' + (compliant === REGS.length ? 'b-ok' : 'b-warn');
  el('regPill').textContent = compliant + ' / ' + REGS.length + ' compliant';

  el('regKpis').innerHTML = [
    ['Requirements tracked', num(REGS.length), 'Statute, directive and licence conditions', 'gold'],
    ['Compliant', num(compliant), r1(pct(compliant, REGS.length)) + '% of the register', ''],
    ['In review', num(REGS.filter(r => r.status !== 'Compliant').length), 'Evidence being refreshed', ''],
    ['Compliance tasks open', num(COMPLIANCE_TASKS.filter(t => t.status !== 'Done').length), `${num(COMPLIANCE_TASKS.filter(t => t.status === 'Overdue').length)} overdue`, ''],
    ['Evidence files held', num(evidence.length), 'Mapped to a requirement or a case', ''],
    ['Returns due', num(4), 'Next quarter to the supervisor', '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join('');

  renderTable('regBody', [
    {k:'name', label:'Requirement'},
    {k:'body', label:'Body'},
    {k:'status', label:'Status', html:v => badge(v, statTone(v))},
    {k:'checked', label:'Last checked', html:v => fmtDate(v)},
    {k:'owner', label:'Owner'}
  ], regs.map(r => Object.assign({}, r, {owner:staffName(r.owner), _open: () => openReg(r.id)})),
    {sort:'status', pageSize:8, onRow:true});

  const policies = [
    ['Lending policy — affordability', LOAN_CHECKS.filter(c => !c.tests.eligibility).length],
    ['Lending policy — approval authority', LOAN_CHECKS.filter(c => !c.tests.authority).length],
    ['Lending policy — amount bands', LOAN_CHECKS.filter(c => !c.tests.limit).length],
    ['Lending policy — interest rate', LOAN_CHECKS.filter(c => !c.tests.rate).length],
    ['Lending policy — fees and penalties', LOAN_CHECKS.filter(c => !c.tests.fees).length],
    ['Lending policy — documentation', LOAN_CHECKS.filter(c => !c.tests.documents).length],
    ['Data protection — consent on file', CONSENT.filter(c => c.status !== 'Active').length],
    ['Data protection — retention', RETENTION.filter(r => r.status !== 'Compliant').length]
  ].map(([name, n]) => ({name, n, status: n === 0 ? 'Compliant' : n < 4 ? 'Review' : 'Exception'}));
  el('polHead').innerHTML = '<tr><th>Policy requirement</th><th class="num">Breaches</th><th>Position</th></tr>';
  el('polBody').innerHTML = policies.map(p => `<tr><td>${esc(p.name)}</td><td class="num">${num(p.n)}</td>
      <td>${badge(p.status, p.status === 'Compliant' ? 'b-ok' : p.status === 'Review' ? 'b-warn' : 'b-crit')}</td></tr>`).join('');

  const disclosures = [
    ['Effective annual rate', 'Loan agreement', Math.round(LOANS.length * 0.97)],
    ['Fees and charges schedule', 'Loan agreement', Math.round(LOANS.length * 0.92)],
    ['Complaints procedure', 'Welcome pack', CUSTOMERS.length],
    ['Data processing notice', 'Application form', Math.round(CUSTOMERS.length * 0.88)],
    ['Right to a statement of account', 'Welcome pack', CUSTOMERS.length - 2],
    ['Credit bureau reporting notice', 'Application form', Math.round(CUSTOMERS.length * 0.95)]
  ].map(([what, where, n]) => ({what, where, n, ok: n >= (where === 'Loan agreement' ? LOANS.length * 0.95 : CUSTOMERS.length * 0.9)}));
  el('discHead').innerHTML = '<tr><th>Disclosure</th><th>Document</th><th class="num">Evidenced</th><th>State</th></tr>';
  el('discBody').innerHTML = disclosures.map(d => `<tr><td>${esc(d.what)}</td><td>${esc(d.where)}</td>
      <td class="num">${num(d.n)}</td><td>${badge(d.ok ? 'Evidenced' : 'Gap', d.ok ? 'b-ok' : 'b-warn')}</td></tr>`).join('');

  el('taskPill').textContent = tasks.length;
  renderTable('taskBody', [
    {k:'title', label:'Task'},
    {k:'cat', label:'Area'},
    {k:'owner', label:'Owner'},
    {k:'due', label:'Due', html:v => fmtDate(v)},
    {k:'status', label:'Status', html:v => badge(v, statTone(v))},
    {k:'act', label:'', html:(v, r) => `<button class="btn btn-ghost" data-task="${r.id}">${r.status === 'Done' ? 'Reopen' : 'Complete'}</button>`}
  ], tasks.map(t => Object.assign({}, t, {owner:staffName(t.owner)})), {sort:'due', pageSize:8});

  el('evidPill').textContent = evidence.length;
  renderTable('evidBody', [
    {k:'what', label:'Evidence'},
    {k:'for', label:'Filed against'},
    {k:'kind', label:'Kind'},
    {k:'when', label:'Dated', html:v => fmtDate(v)}
  ], evidence, {sort:'when', pageSize:7});

  const returns = [
    ['Quarterly compliance return', '2026 Q4', 'RBM', addDays(TODAY, 21), 'In preparation'],
    ['AML suspicious-transaction return', 'Oct 2026', 'FIA Malawi', addDays(TODAY, 4), 'Ready'],
    ['Credit bureau submission', 'Oct 2026', 'TransUnion', addDays(TODAY, 2), 'In preparation'],
    ['Statement of compliance', '2026 Q3', 'RBM', addDays(TODAY, -12), 'Submitted'],
    ['Data protection annual return', '2026', 'Malawi Govt', addDays(TODAY, 45), 'Not started']
  ].map(([what, period, to, due, status]) => ({what, period, to, due, status}));
  renderTable('retBody', [
    {k:'what', label:'Return'},
    {k:'period', label:'Period'},
    {k:'to', label:'To'},
    {k:'due', label:'Due', html:v => fmtDate(v)},
    {k:'status', label:'Status', html:v => badge(v, /Submitted|Ready/.test(v) ? 'b-ok' : /preparation/.test(v) ? 'b-warn' : 'b-gray')}
  ], returns, {sort:'due', pageSize:6});
}

function openReg(id){
  const r = REGS.find(x => x.id === id);
  if(!r) return;
  openModal(r.name, r.body + ' · ' + r.id,
    `<div class="pfields">
      ${field('Requirement', esc(r.requirement))}
      ${field('Status', badge(r.status, statTone(r.status)))}
      ${field('Last checked', fmtDate(r.checked))}
      ${field('Owner', esc(staffName(r.owner)))}
      ${field('Next review', fmtDate(r.due))}
      ${field('Evidence', esc(r.evidence))}
    </div>
    <div class="qhint">Changing the status is recorded in the configuration history.</div>`,
    [{label:'Mark compliant', act:() => {
        r.status = 'Compliant'; r.checked = TODAY;
        logConfig(r.id + ' marked compliant'); closeModal(); renderAll(); toast(r.id + ' marked compliant');
      }},
     {label:'Mark in review', act:() => {
        r.status = 'Review';
        logConfig(r.id + ' moved back to review'); closeModal(); renderAll(); toast(r.id + ' back in review');
      }},
     {label:'Close', act:'close'}]);
}
</script>
