<script>
/* ============================================================
   COMPLIANCE & INTELLIGENCE (4/7)
   1 · Compliance overview    2 · KYC    3 · Loan compliance
   4 · Transaction monitoring
   ============================================================ */

function chartBox(o){
  return `<div class="chartcard">
    <div class="ch">
      <div><div class="ct">${esc(o.title)}</div><div class="cs">${esc(o.sub || '')}</div></div>
      <div style="text-align:right">${o.value !== undefined ? `<div class="cv">${o.value}</div>` : ''}</div>
    </div>
    ${o.chart || ''}
    ${o.note ? `<div class="qhint">${o.note}</div>` : ''}
  </div>`;
}
function meter(label, value, good, ok, hint){
  const cls = value >= good ? 'ok' : value >= ok ? 'warn' : 'bad';
  return `<div class="perfm">
    <div class="mt"><div>${esc(label)}</div><span>${r1(value)}%</span></div>
    <div class="mbar"><i class="${cls}" style="width:${clamp(value, 0, 100).toFixed(1)}%"></i></div>
    <div class="qhint" style="margin-top:1px">${esc(hint)}</div>
  </div>`;
}
const stack = (label, sub, action, go) => `<div class="risk">
    <div><div class="rn">${esc(label)}</div><div class="rs">${esc(sub)}</div></div>
    <div class="rv">${go ? `<button class="btn btn-ghost" data-goto="${go}">${esc(action)}</button>` : esc(action)}</div>
  </div>`;

/* ===================== 1 · COMPLIANCE OVERVIEW ===================== */
function renderOverview(){
  const s = complianceStats();
  const verified = KYC.filter(k => k.status === 'Verified').length;
  const docOk = KYC.filter(k => k.completeness === 100).length;
  const posted = TXNS.filter(t => t.status === 'Posted').length;
  const blocked = ACCESS_EVENTS.filter(a => a.blocked).length;
  const high = s.open.filter(c => c.severity === 'Critical' || c.severity === 'High');
  const resolvedRecent = CASES.filter(c => /^(Resolved|Closed)$/.test(c.status) && c.closedOn && c.closedOn >= FILTER.from);

  el('bandScore').textContent = s.score + '%';
  el('bandCases').textContent = num(s.open.length);
  el('bandKyc').textContent = num(s.kycPending.length);
  el('bandExceptions').textContent = num(s.exceptions.length);
  el('bandOverdue').textContent = num(s.overdue.length);
  el('ovStamp').textContent = 'Last refresh — ' + lastRefresh();

  el('ovStatusPill').className = 'badge ' + (s.score >= 85 ? 'b-ok' : s.score >= 70 ? 'b-warn' : 'b-crit');
  el('ovStatusPill').textContent = s.score >= 85 ? 'Satisfactory' : s.score >= 70 ? 'Needs attention' : 'Action required';

  el('ovKpis').innerHTML = [
    ['Overall compliance status', s.score + '%', (s.score >= 85 ? 'Satisfactory' : s.score >= 70 ? 'Needs attention' : 'Action required') + ' against 12 requirements', 'gold'],
    ['Outstanding compliance tasks', num(s.tasks.filter(t => t.status !== 'Done').length), `${num(s.tasks.filter(t => t.due < TODAY && t.status !== 'Done').length)} past their date`, s.overdue.length ? 'red' : ''],
    ['Pending compliance reviews', num(s.kycPending.length), 'KYC files waiting for a decision', ''],
    ['Overdue compliance actions', num(CASES.filter(c => c.due < TODAY && !/^(Resolved|Closed)$/.test(c.status)).length),
      'Cases past their due date', 'red'],
    ['Customer verification status', num(verified) + ' / ' + num(KYC.length), `${num(s.kycPending.length)} still to verify`, ''],
    ['Loan documentation compliance', r1(pct(docOk, KYC.length)) + '%', `${num(KYC.length - docOk)} files incomplete`, ''],
    ['Financial transaction compliance', r1(pct(posted, TXNS.length)) + '%', `${num(TXNS.length - posted)} entries not posted cleanly`, ''],
    ['Security & access violations', num(blocked), `${num(sum(ACCESS_EVENTS, a => a.failedLogins))} refused sign-ins this period`, blocked ? 'red' : ''],
    ['High-risk alerts', num(high.length), 'Critical and high cases open', high.length ? 'red' : ''],
    ['Recent compliance activities', num(resolvedRecent.length) + ' closed', 'Resolved inside the selected period', '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join('');

  const kycPct = pct(verified, KYC.length);
  const docPct = pct(docOk, KYC.length);
  const txnPct = pct(posted, TXNS.length);
  const accessPct = clamp(100 - blocked * 8 - sum(ACCESS_EVENTS, a => a.failedLogins) * 1.5, 0, 100);
  const casePct = 100 - pct(s.open.length, CASES.length);
  el('ovMeters').innerHTML = [
    meter('Customer verification', kycPct, 90, 75, `${verified} of ${KYC.length} files fully verified`),
    meter('Documentation', docPct, 90, 75, `${docOk} files hold all five required documents`),
    meter('Transaction integrity', txnPct, 98, 95, `${posted} of ${TXNS.length} entries posted cleanly`),
    meter('Access control', clamp(accessPct, 0, 100), 90, 75, `${blocked} accounts currently blocked`),
    meter('Case resolution', clamp(casePct, 0, 100), 80, 60, `${s.open.length} of ${CASES.length} cases still open`)
  ].join('');

  el('ovAttention').innerHTML = [
    stack('Expired identity documents', `${DOC_ISSUES.filter(d => d.state === 'Expired').length} documents past their date`, 'Review', 's2'),
    stack('Accounts above approval authority', `${EXCEPTIONS.filter(e => e.test === 'authority' && e.status !== 'Resolved').length} facilities released above the officer limit`, 'Open', 's3'),
    stack('Duplicate receipts to investigate', `${PAY_DUPLICATES.length} possible duplicates inside ${RULES.dupWindow} days`, 'Review', 's4'),
    stack('Cases past their due date', `${CASES.filter(c => c.due < TODAY && !/^(Resolved|Closed)$/.test(c.status)).length} cases overdue`, 'Open', 's9'),
    stack('Regulatory items in review', `${s.regsReview.length} requirements not yet evidenced`, 'Check', 's8')
  ].join('');

  const raised = countBy(CASES, c => c.opened);
  const closedSeries = countBy(CASES.filter(c => c.closedOn), c => c.closedOn);
  el('ovTrend').innerHTML = chart({type:'bar', cats:raised.cats, h:220, series:[
    {name:'Raised', data:raised.data, colour:'#D93F3F'},
    {name:'Closed', data:closedSeries.data, colour:'#1E9E6A'}
  ]});
  el('ovTrendNote').innerHTML = `${num(sum(raised.data))} cases raised and ${num(sum(closedSeries.data))} closed between ` +
    `${fmtDate(FILTER.from)} and ${fmtDate(FILTER.to)}. Current load: <b>${s.open.length}</b> open, ` +
    `<b>${s.open.filter(c => c.severity === 'Critical').length}</b> of them critical.`;

  const feed = [];
  CASES.slice(0, 14).forEach(c => feed.push({
    when: c.history.length ? c.history[c.history.length - 1].when : c.opened,
    who: c.history.length ? c.history[c.history.length - 1].who : 'System',
    what: c.history.length ? c.history[c.history.length - 1].what : 'Case raised',
    ref: c.id, kind:'case'
  }));
  KYC.filter(k => k.history.length).slice(0, 8).forEach(k => feed.push({
    when: k.history[k.history.length - 1].when, who: k.history[k.history.length - 1].who,
    what: k.history[k.history.length - 1].what, ref: k.id, kind:'kyc'
  }));
  feed.sort((a, b) => a.when < b.when ? 1 : -1);
  el('ovActivity').innerHTML = feed.slice(0, 9).map(f => `<div class="risk">
      <div><div class="rn">${esc(f.what)}</div><div class="rs">${esc(f.who)} · ${fmtDate(f.when)} · ${esc(f.ref)}</div></div>
      <div class="rv"><span class="badge ${f.kind === 'case' ? 'b-warn' : 'b-ok'}">${f.kind === 'case' ? 'Case' : 'KYC'}</span></div>
    </div>`).join('') || '<div class="empty">No compliance activity in this period.</div>';

  el('ovHighPill').textContent = high.length;
  el('ovHigh').innerHTML = high.slice(0, 6).map(c => `<div class="risk">
      <div><div class="rn">${esc(c.title)}</div>
        <div class="rs">${esc(c.type)} · ${esc(staffName(c.owner))} · due ${fmtDate(c.due)}</div></div>
      <div class="rv">${badge(c.severity, sevTone(c.severity))}</div>
    </div>`).join('') || '<div class="empty">No high-risk alerts open.</div>';
}

/* ===================== 2 · CUSTOMER VERIFICATION & KYC ===================== */
function renderKYC(){
  const files = KYC.filter(k =>
    matchQ(k.id, custName(k.cust), k.cust) &&
    (!FILTER.region || (CUST_BY_ID[k.cust] || {}).region === FILTER.region) &&
    (!FILTER.status || k.status === FILTER.status));
  const verified = KYC.filter(k => k.status === 'Verified').length;
  const queue = files.filter(k => k.status !== 'Verified')
    .map(k => ({id:k.id, cust:k.cust, name:custName(k.cust), status:k.status, completeness:k.completeness,
      missing:k.docs.filter(d => d.state !== 'Valid').length, submitted:k.submitted,
      waiting:daysBetween(k.submitted, TODAY), reviewer:k.reviewer,
      _open: () => openKyc(k.id)}));

  el('kycKpis').innerHTML = [
    ['Files in scope', num(files.length), 'Of ' + num(KYC.length) + ' customer files', 'gold'],
    ['Identity verified', num(files.filter(k => k.status === 'Verified').length), r1(pct(verified, KYC.length)) + '% of the register', ''],
    ['Awaiting review', num(queue.length), 'In the verification queue', queue.length ? 'blue' : ''],
    ['Average completeness', r1(files.length ? sum(files, k => k.completeness) / files.length : 0) + '%', 'Weighted across the five documents', ''],
    ['Expired documents', num(DOC_ISSUES.filter(d => d.state === 'Expired').length), 'Past their date and blocking verification', 'red'],
    ['Duplicates flagged', num(DUPLICATE_GROUPS.length), 'Identity overlap with another file', DUPLICATE_GROUPS.length ? 'red' : '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join('');

  el('kycQueuePill').textContent = queue.length;
  renderTable('kycQueueBody', [
    {k:'id', label:'File'},
    {k:'name', label:'Customer'},
    {k:'status', label:'Status', html:v => badge(v, statTone(v))},
    {k:'completeness', label:'Complete', num:true, html:v => r1(v) + '%'},
    {k:'missing', label:'Missing', num:true},
    {k:'waiting', label:'Waiting', num:true, html:v => v + ' days'},
    {k:'reviewer', label:'Reviewer'}
  ], queue.map(q => Object.assign({}, q, {reviewer: staffName(q.reviewer), _open:q._open})),
    {sort:'waiting', pageSize:8, onRow:true});

  /* completeness by document */
  const byDoc = DOC_TYPES.map(t => ({
    name:t.name,
    held: KYC.filter(k => k.docs.find(d => d.key === t.key).state === 'Valid').length
  }));
  el('kycCompleteness').innerHTML = chart({type:'bar', cats:byDoc.map(d => d.name), h:200,
    series:[{name:'Files holding it', data:byDoc.map(d => d.held), colour:'#C9A227'}]});

  el('kycChecks').innerHTML = [
    ['Identity', num(KYC.filter(k => k.status === 'Verified').length) + ' / ' + num(KYC.length)],
    ['Contact', num(KYC.filter(k => k.contact === 'Verified').length) + ' / ' + num(KYC.length)],
    ['Address', num(KYC.filter(k => k.address === 'Verified').length) + ' / ' + num(KYC.length)],
    ['Complete', num(KYC.filter(k => k.completeness === 100).length) + ' / ' + num(KYC.length)]
  ].map(([l, v]) => `<div><div class="sl">${l}</div><div class="sv">${v}</div></div>`).join('');

  const statuses = ['Verified','Pending','Expired','Rejected'];
  el('kycGrid').innerHTML = [
    chartBox({title:'Verification status', sub:'Where the customer files sit', value:num(files.length) + ' files',
      chart: chart({type:'donut', cats:statuses, h:200,
        series:[{data:statuses.map(s => KYC.filter(k => k.status === s).length)}],
        colours:['#1E9E6A','#E08C1E','#D93F3F','#8A90A0']})}),
    chartBox({title:'Files received over time', sub:'KYC files opened per month', value:num(KYC.length) + ' opened',
      chart: chart({type:'line', cats:countBy(KYC, k => k.submitted).cats, h:200,
        series:[{name:'Files opened', data:countBy(KYC, k => k.submitted).data, colour:'#2F6FED'}]})}),
    chartBox({title:'Completeness distribution', sub:'Files by how much of the pack is held', value:r1(pct(KYC.filter(k => k.completeness === 100).length, KYC.length)) + '% complete',
      chart: chart({type:'bar', cats:['100%','80%','60%','40%','20%'], h:200,
        series:[{name:'Files', data:[100, 80, 60, 40, 20].map(p => KYC.filter(k => k.completeness === p).length), colour:'#1E9E6A'}]})})
  ].join('');

  el('docPill').textContent = DOC_ISSUES.length;
  renderTable('docBody', [
    {k:'doc', label:'Document'},
    {k:'cust', label:'Customer'},
    {k:'state', label:'State', html:v => badge(v, v === 'Expired' ? 'b-crit' : 'b-warn')},
    {k:'expiry', label:'Expiry', html:v => v ? fmtDate(v) : 'Not held'},
    {k:'kyc', label:'File', html:v => badge(v, statTone(v))}
  ], DOC_ISSUES.map(d => Object.assign({}, d, {cust: custName(d.cust), _open: () => openKyc(d.id)}))
    .filter(d => matchQ(d.doc, d.cust)), {sort:'state', pageSize:7, onRow:true});

  el('dupPill').textContent = DUPLICATE_GROUPS.length;
  renderTable('dupBody', [
    {k:'pair', label:'Customers'},
    {k:'reason', label:'Match'},
    {k:'strength', label:'Strength', html:v => badge(v, v === 'Strong' ? 'b-crit' : 'b-warn')},
    {k:'found', label:'Found', html:v => fmtDate(v)}
  ], DUPLICATE_GROUPS.map(g => ({
      pair: custName(g.a) + ' ↔ ' + custName(g.b), reason:g.reason, strength:g.strength, found:g.found,
      _open: () => openDuplicate(g.a, g.b)
    })), {sort:'found', pageSize:6, onRow:true});

  const hist = [];
  KYC.forEach(k => k.history.forEach(h => hist.push({
    when:h.when, who:h.who, what:h.what, file:k.id, cust:custName(k.cust), status:k.status
  })));
  hist.sort((a, b) => a.when < b.when ? 1 : -1);
  renderTable('kycHistBody', [
    {k:'when', label:'When', html:v => fmtDate(v)},
    {k:'who', label:'Who'},
    {k:'what', label:'Action'},
    {k:'cust', label:'Customer'},
    {k:'file', label:'File'},
    {k:'status', label:'Now', html:v => badge(v, statTone(v))}
  ], hist.filter(h => matchQ(h.cust, h.file, h.what)), {sort:'when', pageSize:7});
}

function openKyc(fileId){
  const k = KYC.find(x => x.id === fileId);
  if(!k) return;
  const c = CUST_BY_ID[k.cust] || {};
  openModal('KYC file ' + k.id, (c.name || '') + ' · ' + (c.region || ''),
    `<div class="pfields">
      ${field('Customer', esc(c.name) + ' <span class="muted">' + esc(k.cust) + '</span>')}
      ${field('Status', badge(k.status, statTone(k.status)))}
      ${field('Completeness', r1(k.completeness) + '%')}
      ${field('Contact', badge(k.contact, statTone(k.contact)))}
      ${field('Address', badge(k.address, statTone(k.address)))}
      ${field('Submitted', fmtDate(k.submitted))}
      ${field('Reviewer', esc(staffName(k.reviewer)))}
      ${field('Occupations', esc(c.occupation || '—'))}
      ${field('Declared income', money(c.income || 0))}
      ${field('Phone', esc(c.phone || '—'))}
    </div>
    <div class="minihead">Documents</div>
    <div class="tblwrap"><table class="tbl2 dense">
      <thead><tr><th>Document</th><th>State</th><th>Expiry</th></tr></thead>
      <tbody>${k.docs.map(d => `<tr><td>${esc(d.name)}</td>
        <td>${badge(d.state, d.state === 'Valid' ? 'b-ok' : d.state === 'Expired' ? 'b-crit' : 'b-warn')}</td>
        <td>${d.expiry ? fmtDate(d.expiry) : '—'}</td></tr>`).join('')}</tbody></table></div>
    ${k.notes ? `<div class="note gold" style="margin-top:9px"><div>${esc(k.notes)}</div></div>` : ''}
    <div class="minihead">History</div>
    <div>${k.history.map(h => `<div class="checkrow"><div class="cl">${esc(h.what)}</div>
      <div class="cn">${esc(h.who)} · ${fmtDate(h.when)}</div></div>`).join('')}</div>`,
    [{label:'Approve verification', act:() => kycDecision(k.id, 'Verified')},
     {label:'Reject', act:() => kycDecision(k.id, 'Rejected')},
     {label:'Close', act:'close'}]);
}
function kycDecision(fileId, decision){
  const k = KYC.find(x => x.id === fileId);
  if(!k) return;
  const before = k.status;
  k.status = decision;
  if(decision === 'Verified'){
    k.completeness = 100;
    k.docs.forEach(d => { d.state = 'Valid'; if(d.expiry && d.expiry < TODAY) d.expiry = addDays(TODAY, 365); });
    k.address = 'Verified'; k.contact = 'Verified'; k.notes = '';
  } else {
    k.notes = 'Rejected by ' + staffName('STF-003') + ' — documents do not support the application';
  }
  k.history.push({when:TODAY, who:'Chikondi Mwale', what:'Verification ' + decision.toLowerCase() + ' (was ' + before + ')'});
  logConfig('KYC file ' + k.id + ' marked ' + decision);
  closeModal();
  renderAll();
  toast(k.id + ' ' + decision.toLowerCase());
}

function openDuplicate(a, b){
  const pairs = [[a, b], [b, a]];
  openModal('Duplicate check', custName(a) + ' ↔ ' + custName(b),
    `<div class="tblwrap"><table class="tbl2 dense">
      <thead><tr><th>Field</th><th>${esc(custName(a))}</th><th>${esc(custName(b))}</th></tr></thead>
      <tbody>${['id','phone','region','joined','occupation','income','kyc'].map(f => {
        const va = CUST_BY_ID[a][f], vb = CUST_BY_ID[b][f];
        const fmt = v => f === 'joined' ? fmtDate(v) : f === 'income' ? money(v) : String(v);
        const same = String(va) === String(vb);
        return `<tr><td>${f}</td><td style="color:${same ? '#B32C2C' : 'inherit'}">${esc(fmt(va))}</td>
          <td style="color:${same ? '#B32C2C' : 'inherit'}">${esc(fmt(vb))}</td></tr>`;
      }).join('')}</tbody></table></div>
    <div class="qhint">Shared values are shown in red. Confirm the identity before opening a duplicate case.</div>`,
    [{label:'Raise case', act:() => { closeModal(); openCaseDialog({title:'Duplicate identity · ' + custName(a),
      lane:'KYC', type:'Duplicate identity', severity:'High', subjectKind:'customer', subjectId:a,
      detail:'Suspected duplicate of ' + custName(b) + ' (' + b + ')'}); }},
     {label:'Close', act:'close'}]);
}

/* ===================== 3 · LOAN COMPLIANCE ===================== */
function renderLoanCompliance(){
  const checks = LOAN_CHECKS.filter(c =>
    matchQ(c.loan.ref, custName(c.loan.cust), c.loan.cust)
    && (!FILTER.region || c.loan.region === FILTER.region)
    && (!FILTER.product || c.loan.product === FILTER.product)
    && (!FILTER.owner || (EXCEPTIONS.find(e => e.loan === c.loan.ref && e.owner === FILTER.owner) ? true : false)));
  const total = checks.length || 1;
  const passed = checks.filter(c => c.failed.length === 0).length;
  const exceptions = EXCEPTIONS.filter(e => checks.some(c => c.loan.ref === e.loan));

  el('loanPassPill').className = 'badge ' + (passed / total > 0.9 ? 'b-ok' : passed / total > 0.75 ? 'b-warn' : 'b-crit');
  el('loanPassPill').textContent = r1(pct(passed, total)) + '% pass';

  el('loanKpis').innerHTML = [
    ['Facilities tested', num(checks.length), 'Nine policy tests each', 'gold'],
    ['Fully compliant', num(passed), r1(pct(passed, total)) + ' of facilities', ''],
    ['Policy exceptions', num(exceptions.length), money(sum(exceptions, e => e.amount)) + ' of exposure', exceptions.length ? 'red' : ''],
    ['Above approval authority', num(checks.filter(c => !c.tests.authority).length), 'Released above the officer limit', ''],
    ['Documentation breaches', num(checks.filter(c => !c.tests.documents).length), 'Required documents incomplete', ''],
    ['Open workflow gaps', num(checks.filter(c => !c.tests.workflow).length), 'Second approval missing', '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join('');

  const testNames = {eligibility:'Loan eligibility', authority:'Approval authority', limit:'Loan amount limit',
    rate:'Interest rate', fees:'Fees & penalties', agreement:'Loan agreement', documents:'Required documents',
    term:'Loan term', workflow:'Approval workflow'};
  const rows = Object.keys(testNames).map(t => ({
    test:t, name:testNames[t],
    pass: checks.filter(c => c.tests[t]).length,
    fail: checks.filter(c => !c.tests[t]).length,
    rate: r1(pct(checks.filter(c => c.tests[t]).length, total))
  })).sort((a, b) => a.rate - b.rate);

  el('loanGrid').innerHTML = [
    chartBox({title:'Failures by policy test', sub:'Facilities that did not pass each test', value:num(sum(rows, r => r.fail)),
      chart: chart({type:'bar', cats:rows.map(r => r.name), h:210,
        series:[{name:'Failures', data:rows.map(r => r.fail), colour:'#D93F3F'}]})}),
    chartBox({title:'Exceptions by severity', sub:'Open and closed policy exceptions', value:num(exceptions.length),
      chart: chart({type:'donut', cats:['Critical','High','Medium'], h:210,
        series:[{data:['Critical','High','Medium'].map(s => exceptions.filter(e => e.severity === s).length)}],
        colours:['#B32C2C','#D93F3F','#E08C1E']})}),
    chartBox({title:'Exceptions by product', sub:'Where the breaches sit in the book', value:num(PRODUCTS.length) + ' products',
      chart: chart({type:'bar', cats:PRODUCTS.map(p => pShort(p.id)), h:210,
        series:[{name:'Exceptions', data:PRODUCTS.map(p => exceptions.filter(e => e.product === p.id).length), colour:'#7C5CF0'}]})})
  ].join('');

  el('loanTestHead').innerHTML = '<tr><th>Policy test</th><th class="num">Passed</th><th class="num">Failed</th>' +
    '<th class="num">Pass rate</th><th>Position</th></tr>';
  el('loanTestBody').innerHTML = rows.map(r => `<tr>
      <td><b>${esc(r.name)}</b></td><td class="num">${num(r.pass)}</td><td class="num">${num(r.fail)}</td>
      <td class="num">${r.rate}%</td>
      <td><span style="display:inline-block;width:90px;height:6px;border-radius:20px;background:#EEF0F4;vertical-align:middle">
        <span style="display:block;height:6px;border-radius:20px;width:${clamp(r.rate, 2, 100)}%;background:${r.rate >= 95 ? '#1E9E6A' : r.rate >= 85 ? '#E08C1E' : '#D93F3F'}"></span>
      </span></td></tr>`).join('');

  el('excPill').textContent = exceptions.length;
  renderTable('excBody', [
    {k:'id', label:'Exception'},
    {k:'loan', label:'Facility'},
    {k:'label', label:'Policy breach'},
    {k:'severity', label:'Severity', html:v => badge(v, sevTone(v))},
    {k:'amount', label:'Exposure', num:true, html:v => money(v)},
    {k:'raised', label:'Raised', html:v => fmtDate(v)},
    {k:'status', label:'Status', html:v => badge(v, statTone(v))}
  ], exceptions.filter(e => matchQ(e.id, e.loan, e.label) && (!FILTER.status || e.status === FILTER.status))
    .map(e => Object.assign({}, e, {_open: () => openLoan(e.loan)})), {sort:'severity', pageSize:8, onRow:true});
}

function openLoan(ref){
  const l = LOAN_BY_REF[ref];
  if(!l) return toast('Facility ' + ref + ' not found.', 'err');
  const chk = LOAN_CHECKS.find(c => c.loan.ref === ref) || {tests:{}, failed:[], ceiling:0};
  const k = kycFor(l.cust) || {completeness:0, status:'—', docs:[]};
  const testNames = {eligibility:'Loan eligibility', authority:'Approval authority', limit:'Loan amount limit',
    rate:'Interest rate', fees:'Fees & penalties', agreement:'Loan agreement', documents:'Required documents',
    term:'Loan term', workflow:'Approval workflow'};
  openModal('Loan ' + l.ref, custName(l.cust) + ' · ' + prodName(l.product),
    `<div class="pfields">
      ${field('Principal', money(l.amount))}
      ${field('Term', l.term + ' months · ' + r1(l.rate * 100) + '% flat')}
      ${field('Officer', esc(staffName(l.officer)))}
      ${field('Approval ceiling', money(chk.ceiling))}
      ${field('Disbursed', fmtDate(l.date))}
      ${field('Status', badge(l.status, l.status === 'Active' ? 'b-ok' : l.status === 'Closed' ? 'b-gray' : 'b-crit'))}
      ${field('Outstanding', money(l.outstanding))}
      ${field('Arrears', money(l.arrears))}
      ${field('KYC completeness', k.completeness + '% ' + badge(k.status, statTone(k.status)))}
      ${field('Days past due', l.dpd ? l.dpd + ' days' : '—')}
    </div>
    <div class="minihead">Policy tests</div>
    <div>${Object.keys(testNames).map(t => `<div class="checkrow">
        <div class="ck ${chk.tests[t] ? 'pass' : 'fail'}">${chk.tests[t] ? '✓' : '!'}</div>
        <div class="cl">${esc(testNames[t])}</div>
        <div class="cn">${chk.tests[t] ? 'Pass' : 'Breach'}</div></div>`).join('')}</div>`,
    [{label:'Raise exception case', act:() => { closeModal(); openCaseDialog({
        title:'Policy exception · ' + l.ref, lane:'Compliance', type:'Loan policy',
        severity: chk.failed.includes('rate') ? 'High' : 'Medium', subjectKind:'loan', subjectId:l.ref,
        detail:'Failed: ' + chk.failed.map(f => testNames[f]).join(', ')}); }},
     {label:'Close', act:'close'}]);
}

/* ===================== 4 · TRANSACTION MONITORING ===================== */
function renderTransactions(){
  const pays = PAYS.filter(p => matchQ(p.ref, p.receipt, p.loan) && (!FILTER.region || (CUST_BY_ID[p.cust] || {}).region === FILTER.region));
  const dupes = PAY_DUPLICATES;
  const large = TXNS.filter(t => t.amount >= RULES.largeTxn);
  const failed = FAILED_TXNS;
  const refRows = pays.slice(0, 12).map((p, i) => ({
    txn:'TXN-' + (92000 + i), receipt:p.receipt, loan:p.loan, channel:p.method, amount:p.amount,
    check: i % 7 === 3 ? 'Mismatch' : i % 11 === 5 ? 'Not found' : 'Verified'
  }));

  el('txnRuleNote').textContent = `Large threshold ${money(RULES.largeTxn)} · duplicate window ${RULES.dupWindow} days`;

  el('txnKpis').innerHTML = [
    ['Transactions monitored', num(TXNS.length), 'Receipts, payouts and adjustments', 'gold'],
    ['Duplicate payments', num(dupes.length), `Same facility, same amount within ${RULES.dupWindow} days`, dupes.length ? 'red' : ''],
    ['Large transactions', num(large.length), 'Above the monitoring threshold', ''],
    ['Failed or reversed', num(failed.length), money(sum(failed, t => t.amount)) + ' affected', 'red'],
    ['Unallocated payments', num(UNALLOCATED.length), 'Not yet against a facility', ''],
    ['Reconciliation exceptions', num(RECON_EXCEPTIONS.length), 'Entries that do not agree with the cashbook', RECON_EXCEPTIONS.length ? 'red' : '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join('');

  const byMonth = countBy(TXNS, t => t.date);
  const failByChannel = METHODS.map(m => failed.filter(t => t.method === m).length);
  const largeByChannel = METHODS.map(m => large.filter(t => t.method === m).length);

  el('txnGrid').innerHTML = [
    chartBox({title:'Transaction volume', sub:'Entries posted per month', value:num(TXNS.length) + ' entries',
      chart: chart({type:'line', cats:byMonth.cats, h:200, series:[{name:'Entries', data:byMonth.data, colour:'#2F6FED'}]})}),
    chartBox({title:'Failed and reversed by channel', sub:'Where the money did not move', value:num(failed.length),
      chart: chart({type:'bar', cats:METHODS, h:200, series:[{name:'Failures', data:failByChannel, colour:'#D93F3F'}]})}),
    chartBox({title:'Large transactions by channel', sub:`Above ${money(RULES.largeTxn)}`, value:money(sum(large, t => t.amount)),
      chart: chart({type:'bar', cats:METHODS, h:200, series:[{name:'Count', data:largeByChannel, colour:'#E08C1E'}]})})
  ].join('');

  el('dupPayPill').textContent = dupes.length;
  renderTable('dupPayBody', [
    {k:'loan', label:'Facility'},
    {k:'amount', label:'Receipt value', num:true, html:v => money(v)},
    {k:'gap', label:'Gap', num:true, html:v => v + ' d'},
    {k:'when', label:'Posted', html:v => fmtDate(v)}
  ], dupes.map(d => ({loan:d.a.loan, amount:d.a.amount, gap:d.gap, when:d.a.date,
      _open: () => openReceipt(d.a.receipt)})), {sort:'amount', pageSize:6, onRow:true});

  el('largePill').textContent = large.length;
  renderTable('largeBody', [
    {k:'ref', label:'Transaction'},
    {k:'type', label:'Type'},
    {k:'amount', label:'Amount', num:true, html:v => money(v)},
    {k:'method', label:'Channel'},
    {k:'date', label:'Date', html:v => fmtDate(v)}
  ], large.map(t => Object.assign({}, t, {_open: () => openTxn(t.ref)})), {sort:'amount', pageSize:6, onRow:true});

  renderTable('refBody', [
    {k:'receipt', label:'Receipt'},
    {k:'loan', label:'Facility'},
    {k:'channel', label:'Channel'},
    {k:'amount', label:'Amount', num:true, html:v => money(v)},
    {k:'check', label:'Reference', html:v => badge(v, v === 'Verified' ? 'b-ok' : v === 'Mismatch' ? 'b-crit' : 'b-warn')}
  ], refRows, {sort:'check', pageSize:6});

  el('unallocPill').textContent = UNALLOCATED.length;
  renderTable('unallocBody', [
    {k:'ref', label:'Entry'},
    {k:'type', label:'Type'},
    {k:'amount', label:'Amount', num:true, html:v => money(v)},
    {k:'date', label:'Date', html:v => fmtDate(v)},
    {k:'method', label:'Channel'}
  ], UNALLOCATED.map(t => Object.assign({}, t, {_open: () => openTxn(t.ref)})), {sort:'amount', pageSize:6, onRow:true});

  el('reconPill').textContent = RECON_EXCEPTIONS.length;
  const fails = FAILED_TXNS.concat(DISB.filter(x => x.status === 'Failed' || x.status === 'Reversed')
    .map(x => ({ref:x.ref, date:x.date, amount:x.amount, method:x.method, status:x.status,
      kind:'Disbursement', loan:x.loan, cust:(LOAN_BY_REF[x.loan] || {}).cust, officer:x.officer})));
  const failRows = fails.map(f => ({
    ref:f.ref, kind:f.kind || 'Receipt', amount:f.amount, date:f.date,
    issue: (f.status === 'Reversed' ? 'Reversed after posting' : 'Failed at the channel')
      + (f.reason ? ' · ' + f.reason : ''),
    status: f.status,
    _open: () => f.kind === 'Disbursement' ? openLoan(f.loan) : openTxn(f.ref)
  }));
  el('failPill').textContent = failRows.length;
  renderTable('failBody', [
    {k:'ref', label:'Reference'},
    {k:'kind', label:'Kind'},
    {k:'amount', label:'Amount', num:true, html:v => money(v)},
    {k:'issue', label:'What happened'},
    {k:'status', label:'State', html:v => badge(v, 'b-crit')}
  ], failRows, {sort:'amount', pageSize:6, onRow:true});

  renderTable('reconBody', [
    {k:'ref', label:'Reference'},
    {k:'kind', label:'Kind'},
    {k:'amount', label:'Amount', num:true, html:v => money(v)},
    {k:'issue', label:'Exception'},
    {k:'status', label:'Status', html:v => badge(v, 'b-warn')}
  ], RECON_EXCEPTIONS, {sort:'amount', pageSize:6});

  renderTable('txnInvBody', [
    {k:'id', label:'Investigation'},
    {k:'subject', label:'Subject'},
    {k:'opened', label:'Opened', html:v => fmtDate(v)},
    {k:'status', label:'Status', html:v => badge(v, statTone(v))}
  ], TXN_INVESTIGATIONS.map(i => Object.assign({}, i, {_open: () => openTxn(i.subject)})),
    {sort:'opened', pageSize:6, onRow:true});
}

function openReceipt(receipt){
  const p = PAYS.find(x => x.receipt === receipt);
  if(!p) return toast('Receipt not found.', 'err');
  openModal('Receipt ' + p.receipt, p.loan + ' · ' + fmtDate(p.date),
    `<div class="pfields">
      ${field('Customer', esc(custName(p.cust)))}
      ${field('Amount', money(p.amount))}
      ${field('Principal', money(p.principal))}
      ${field('Interest', money(p.interest))}
      ${field('Fees', money(p.fees))}
      ${field('Channel', esc(p.method))}
      ${field('Recorded by', esc(staffName(p.officer)))}
      ${field('Due', fmtDate(p.due))}
      ${field('Timing', p.timing + (p.daysLate ? ' · ' + p.daysLate + ' days late' : ''))}
      ${field('Completion', p.status)}
    </div>`, [{label:'Open facility', act:() => { closeModal(); openLoan(p.loan); }}, {label:'Close', act:'close'}]);
}
function openTxn(ref){
  const t = TXNS.find(x => x.ref === ref);
  if(!t) return toast('Transaction ' + ref + ' not found.', 'err');
  openModal('Transaction ' + t.ref, t.type + ' · ' + fmtDate(t.date),
    `<div class="pfields">
      ${field('Type', esc(t.type))}
      ${field('Direction', esc(t.direction))}
      ${field('Amount', money(t.amount))}
      ${field('Facility', esc(t.loan))}
      ${field('Channel', esc(t.method))}
      ${field('Status', badge(t.status, statTone(t.status)))}
    </div>`, [{label:'Open facility', act:() => { closeModal(); openLoan(t.loan); }}, {label:'Close', act:'close'}]);
}
</script>
