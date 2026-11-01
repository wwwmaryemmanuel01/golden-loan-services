<script>
/* ============================================================
   COMPLIANCE & INTELLIGENCE (6/7)
   9 · Alerts & case management   10 · Audit & investigation
   11 · Reports & analytics       12 · Customer data protection
   ============================================================ */

/* ===================== 9 · ALERTS & CASE MANAGEMENT ===================== */
let SELECTED_CASE = CASES[0] ? CASES[0].id : '';
const CASE_STATES = ['Open','Assigned','Investigating','Escalated','Resolved','Closed'];

function casesInView(){
  return CASES.filter(c =>
    matchQ(c.id, c.title, c.detail, c.type)
    && passLane(c) && passSeverity(c) && passStatus(c) && passOwner(c)
    && (!FILTER.region || !c.subjectId || c.lane !== 'KYC' ||
        (CUST_BY_ID[(KYC.find(k => k.id === c.subjectId) || {}).cust] || {}).region === FILTER.region));
}
function renderCases(){
  const list = casesInView();
  const open = CASES.filter(c => !/^(Resolved|Closed)$/.test(c.status));
  const critical = open.filter(c => c.severity === 'Critical');
  const overdue = open.filter(c => c.due < TODAY);
  const resolved = CASES.filter(c => /^(Resolved|Closed)$/.test(c.status) && c.closedOn && c.closedOn >= FILTER.from);
  const unassigned = open.filter(c => !c.owner);
  const avgAge = open.length ? Math.round(sum(open, c => daysBetween(c.opened, TODAY)) / open.length) : 0;

  el('casePill').className = 'badge ' + (critical.length ? 'b-crit' : open.length ? 'b-warn' : 'b-ok');
  el('casePill').textContent = open.length + ' open · ' + critical.length + ' critical';

  el('caseKpis').innerHTML = [
    ['Open cases', num(open.length), 'Across every compliance lane', 'gold'],
    ['High-priority alerts', num(critical.length + open.filter(c => c.severity === 'High').length),
      'Critical and high still open', critical.length ? 'red' : ''],
    ['Overdue cases', num(overdue.length), 'Past the review date', overdue.length ? 'red' : ''],
    ['Resolved in period', num(resolved.length), 'Closed since ' + fmtDate(FILTER.from), ''],
    ['Average case age', avgAge + ' days', 'Across the open load', ''],
    ['Unassigned', num(unassigned.length), 'Waiting for an owner', unassigned.length ? 'blue' : '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join('');

  el('caseCountPill').textContent = list.length + ' in view';
  renderTable('caseBody', [
    {k:'id', label:'Case'},
    {k:'title', label:'Subject'},
    {k:'lane', label:'Lane'},
    {k:'severity', label:'Severity', html:v => badge(v, sevTone(v))},
    {k:'owner', label:'Owner'},
    {k:'due', label:'Due', html:v => `<span style="color:${v < TODAY ? '#B32C2C' : 'inherit'}">${fmtDate(v)}</span>`},
    {k:'status', label:'Status', html:v => badge(v, statTone(v))}
  ], list.map(c => ({id:c.id, title:c.title, lane:c.lane, severity:c.severity,
      owner:staffName(c.owner), due:c.due, status:c.status, _open: () => selectCase(c.id)})),
    {sort:'severity', pageSize:8, onRow:true});

  const c = CASES.find(x => x.id === SELECTED_CASE) || list[0];
  if(c){ SELECTED_CASE = c.id; renderCaseWorkspace(c); }
  else el('cwBody').innerHTML = '<div class="empty">No cases match the current filters.</div>';
}

function renderCaseWorkspace(c){
  el('cwSub').textContent = c.id + ' · ' + c.type + ' · opened ' + fmtDate(c.opened);
  el('cwStatus').className = 'badge ' + statTone(c.status);
  el('cwStatus').textContent = c.status;
  const subject = c.subjectId ? (
    c.subjectKind === 'loan' ? `Facility ${esc(c.subjectId)} — ${esc(custName((LOAN_BY_REF[c.subjectId] || {}).cust))}`
    : c.subjectKind === 'customer' ? `Customer ${esc(c.subjectId)} — ${esc(custName(c.subjectId))}`
    : c.subjectKind === 'payment' ? `Receipt ${esc(c.subjectId)}`
    : c.subjectKind === 'kyc' ? `KYC file ${esc(c.subjectId)}`
    : c.subjectKind === 'staff' ? `Officer ${esc(c.subjectId)}`
    : c.subjectKind === 'app' ? `Application ${esc(c.subjectId)}`
    : `Transaction ${esc(c.subjectId)}`) : '—';

  el('cwBody').innerHTML = `
    <div class="pfields">
      ${field('Subject', subject)}
      ${field('Lane', esc(c.lane))}
      ${field('Severity', badge(c.severity, sevTone(c.severity)))}
      ${field('Owner', esc(staffName(c.owner)))}
      ${field('Opened', fmtDate(c.opened))}
      ${field('Due', fmtDate(c.due))}
      ${field('Days open', String(daysBetween(c.opened, TODAY)))}
      ${field('Notes logged', num(c.notes.length))}
      ${field('Evidence', num(c.evidence.length))}
      ${field('Corrective actions', num(c.actions.length))}
    </div>
    <div class="note gold" style="margin-top:9px"><div>${esc(c.detail)}</div></div>

    <div class="minihead">Work the case</div>
    <div class="g3">
      <div class="fgroup">
        <div class="fh">Assign to a reviewer</div>
        <div class="fg"><select id="cwOwner">${REVIEWERS.map(r =>
          `<option value="${r}"${r === c.owner ? ' selected' : ''}>${esc(staffName(r))}</option>`).join('')}</select></div>
        <div class="form-actions"><button class="btn btn-ghost" data-cw="assign">Save owner</button></div>
      </div>
      <div class="fgroup">
        <div class="fh">Record an investigation note</div>
        <div class="fg"><input id="cwNote" placeholder="What was checked and what was found…" /></div>
        <div class="form-actions"><button class="btn btn-ghost" data-cw="note">Add note</button></div>
      </div>
      <div class="fgroup">
        <div class="fh">Attach supporting evidence</div>
        <div class="fg"><input id="cwEvidence" placeholder="File name or reference…" /></div>
        <div class="form-actions"><button class="btn btn-ghost" data-cw="evidence">Attach</button></div>
      </div>
    </div>

    <div class="form-actions" style="margin-top:10px">
      <button class="btn btn-ghost" data-cw="action">Add corrective action</button>
      <button class="btn btn-ghost" data-cw="escalate">Escalate</button>
      <button class="btn btn-gold" data-cw="resolve">Resolve case</button>
      <button class="btn btn-ghost" data-cw="close">Close case</button>
      ${c.subjectKind === 'loan' ? `<button class="btn btn-ghost" data-cw="open-record">Open facility</button>` : ''}
      ${c.subjectKind === 'customer' ? `<button class="btn btn-ghost" data-cw="open-record">Open customer</button>` : ''}
    </div>

    <div class="g3" style="margin-top:11px">
      <div>
        <div class="minihead">Investigation notes</div>
        <div>${c.notes.length ? c.notes.map(n => `<div class="risk"><div>
          <div class="rn" style="font-weight:600;font-size:10.5px">${esc(n.note)}</div>
          <div class="rs">${esc(n.who)} · ${fmtDate(n.when)}</div></div></div>`).join('')
          : '<div class="empty">No notes yet.</div>'}</div>
      </div>
      <div>
        <div class="minihead">Evidence</div>
        <div>${c.evidence.length ? c.evidence.map(e => `<div class="risk"><div>
          <div class="rn" style="font-weight:600;font-size:10.5px">${esc(e.what)}</div>
          <div class="rs">${esc(e.by)} · ${fmtDate(e.when)}</div></div></div>`).join('')
          : '<div class="empty">No evidence attached.</div>'}</div>
      </div>
      <div>
        <div class="minihead">Corrective actions</div>
        <div>${c.actions.length ? c.actions.map(a => `<div class="risk"><div>
          <div class="rn" style="font-weight:600;font-size:10.5px">${esc(a.what)}</div>
          <div class="rs">${esc(a.who)} · due ${fmtDate(a.due)}</div></div>
          <div class="rv">${badge(a.status, a.status === 'Done' ? 'b-ok' : 'b-warn')}</div></div>`).join('')
          : '<div class="empty">No corrective action recorded.</div>'}</div>
      </div>
    </div>

    <div class="minihead">Case history</div>
    <div>${c.history.slice().reverse().map(h => `<div class="checkrow">
      <div class="ck pass">✓</div><div class="cl">${esc(h.what)}</div>
      <div class="cn">${esc(h.who)} · ${fmtDate(h.when)}</div></div>`).join('')}</div>`;
}

function selectCase(id){
  SELECTED_CASE = id;
  const c = CASES.find(x => x.id === id);
  if(c) renderCaseWorkspace(c);
  goto('s9');
}
function caseAction(what){
  const c = CASES.find(x => x.id === SELECTED_CASE);
  if(!c) return;
  if(what === 'assign'){
    const next = el('cwOwner').value;
    const before = c.owner;
    c.owner = next;
    c.status = c.status === 'Open' ? 'Assigned' : c.status;
    c.history.push({when:TODAY, who:'Chikondi Mwale', what:'Assigned to ' + staffName(next) + ' (was ' + staffName(before) + ')'});
    toast('Case assigned to ' + staffName(next));
  }
  if(what === 'note'){
    const v = (el('cwNote').value || '').trim();
    if(!v) return toast('Write the note first.', 'err');
    c.notes.push({when:TODAY, who:'Chikondi Mwale', note:v});
    c.history.push({when:TODAY, who:'Chikondi Mwale', what:'Investigation note added'});
    toast('Note recorded');
  }
  if(what === 'evidence'){
    const v = (el('cwEvidence').value || '').trim();
    if(!v) return toast('Name the evidence first.', 'err');
    c.evidence.push({what:v, by:'Chikondi Mwale', when:TODAY});
    c.history.push({when:TODAY, who:'Chikondi Mwale', what:'Evidence attached: ' + v});
    toast('Evidence attached');
  }
  if(what === 'action'){
    c.actions.push({who:staffName(c.owner), what:'Confirm the control fix and evidence it', due:addDays(TODAY, 7), status:'Open'});
    c.history.push({when:TODAY, who:'Chikondi Mwale', what:'Corrective action added'});
    toast('Corrective action tracked');
  }
  if(what === 'escalate'){
    c.status = 'Escalated';
    c.severity = c.severity === 'Low' ? 'Medium' : c.severity === 'Medium' ? 'High' : 'Critical';
    c.due = addDays(TODAY, 3);
    c.history.push({when:TODAY, who:'Chikondi Mwale', what:'Escalated to ' + c.severity + ' severity'});
    toast('Case escalated');
  }
  if(what === 'resolve'){
    c.status = 'Resolved';
    c.closedOn = TODAY;
    c.history.push({when:TODAY, who:'Chikondi Mwale', what:'Case resolved — ' + (c.notes.length ? 'investigation notes on file' : 'no notes recorded')});
    logExport('Resolved case ' + c.id, 'Record', 1);
    toast('Case resolved');
  }
  if(what === 'close'){
    c.status = 'Closed';
    c.closedOn = TODAY;
    c.history.push({when:TODAY, who:'Chikondi Mwale', what:'Case closed after review'});
    toast('Case closed');
  }
  if(what === 'open-record'){
    if(c.subjectKind === 'loan') return openLoan(c.subjectId);
    if(c.subjectKind === 'customer') return openCustomerRisk(c.subjectId);
    if(c.subjectKind === 'payment') return openReceipt(c.subjectId);
    if(c.subjectKind === 'kyc') return openKyc(c.subjectId);
    if(c.subjectKind === 'staff') return openStaffAccess(c.subjectId);
    if(c.subjectKind === 'app') return openApp(c.subjectId);
    return openTxn(c.subjectId);
  }
  renderAll();
}

function openCaseDialog(seed){
  const id = 'CMP-' + pad(4300 + CASES.length, 4);
  openModal('Raise a compliance case', seed.title,
    `<div class="pfields">
      ${field('Lane', esc(seed.lane))}
      ${field('Type', esc(seed.type))}
      ${field('Severity', badge(seed.severity, sevTone(seed.severity)))}
      ${field('Subject', esc(seed.subjectId))}
    </div>
    <div class="note gold" style="margin-top:9px"><div>${esc(seed.detail)}</div></div>
    <div class="fg" style="margin-top:9px"><label>Owner</label>
      <select id="newCaseOwner">${REVIEWERS.map(r => `<option value="${r}">${esc(staffName(r))}</option>`).join('')}</select></div>`,
    [{label:'Raise case', act:() => {
        const owner = el('newCaseOwner').value;
        CASES.unshift(Object.assign({id, opened:TODAY, due:addDays(TODAY, 14), notes:[], evidence:[], actions:[],
          history:[{when:TODAY, who:'Chikondi Mwale', what:'Case raised manually'}], status:'Open', owner}, seed));
        SELECTED_CASE = id;
        closeModal(); renderAll(); goto('s9');
        toast('Case ' + id + ' raised');
      }},
     {label:'Cancel', act:'close'}]);
}

/* ===================== 10 · AUDIT & INVESTIGATION ===================== */
function renderAudit(){
  const open = FINDINGS.filter(f => f.status !== 'Closed');
  const critical = FINDINGS.filter(f => f.rating === 'Critical');
  const overdue = FINDINGS.filter(f => f.status !== 'Closed' && f.due < TODAY);
  const corrective = FINDINGS.filter(f => f.status === 'Corrective action');
  const investigations = [
    ...TXN_INVESTIGATIONS.map(i => ({id:i.id, type:'Financial transaction', subject:i.subject,
      opened:i.opened, owner:i.owner, status:i.status})),
    ...CASES.filter(c => /Fraud|Access/.test(c.lane)).map(c => ({id:'INV-' + c.id, type:'Staff activity',
      subject:c.subjectId || c.id, opened:c.opened, owner:c.owner, status:c.status}))
  ];

  el('findPill').className = 'badge ' + (critical.length ? 'b-crit' : open.length ? 'b-warn' : 'b-ok');
  el('findPill').textContent = open.length + ' open';

  el('findKpis').innerHTML = [
    ['Findings open', num(open.length), `Of ${num(FINDINGS.length)} raised`, 'gold'],
    ['Critical findings', num(critical.length), 'Require board visibility', critical.length ? 'red' : ''],
    ['Overdue findings', num(overdue.length), 'Past the agreed date', overdue.length ? 'red' : ''],
    ['Corrective actions running', num(corrective.length), 'Owner confirmed, evidence pending', ''],
    ['Investigations open', num(investigations.filter(i => !/^(Resolved|Closed)$/.test(i.status)).length),
      'Financial, customer and staff', ''],
    ['Closed this period', num(FINDINGS.filter(f => f.status === 'Closed').length), 'Verified and signed off', '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join('');

  renderTable('findBody', [
    {k:'id', label:'Finding'},
    {k:'title', label:'Finding'},
    {k:'category', label:'Area'},
    {k:'rating', label:'Rating', html:v => badge(v, sevTone(v))},
    {k:'owner', label:'Owner'},
    {k:'due', label:'Due', html:v => `<span style="color:${v < TODAY ? '#B32C2C' : 'inherit'}">${fmtDate(v)}</span>`},
    {k:'status', label:'Status', html:v => badge(v, statTone(v))}
  ], FINDINGS.filter(f => matchQ(f.id, f.title, f.category))
    .map(f => Object.assign({}, f, {owner:staffName(f.owner), _open: () => openFinding(f.id)})),
    {sort:'rating', pageSize:8, onRow:true});

  const reviews = [
    ['Cash handling', 'All four branches', 'Partial assurance', addDays(TODAY, -40), 'STF-009'],
    ['Loan documentation', 'Lilongwe and Blantyre', 'Limited assurance', addDays(TODAY, -26), 'STF-003'],
    ['Access management', 'Head office', 'Substantial assurance', addDays(TODAY, -14), 'STF-009'],
    ['Data protection', 'All branches', 'Partial assurance', addDays(TODAY, -6), 'STF-004'],
    ['Reconciliation', 'Finance', 'Substantial assurance', addDays(TODAY, -2), 'STF-006']
  ].map(([area, scope, result, when, owner]) => ({area, scope, result, when, owner}));
  renderTable('reviewBody', [
    {k:'area', label:'Area'},
    {k:'scope', label:'Scope'},
    {k:'result', label:'Result', html:v => badge(v, /Substantial/.test(v) ? 'b-ok' : /Partial/.test(v) ? 'b-warn' : 'b-crit')},
    {k:'when', label:'Completed', html:v => fmtDate(v)}
  ], reviews, {sort:'when', pageSize:6});

  el('corrActPill').textContent = FINDINGS.filter(f => f.corrective && f.status !== 'Closed').length;
  renderTable('corrActBody', [
    {k:'owner', label:'Owner'},
    {k:'what', label:'Action'},
    {k:'due', label:'Due', html:v => fmtDate(v)},
    {k:'status', label:'Status', html:v => badge(v, statTone(v))}
  ], FINDINGS.filter(f => f.status !== 'Closed').map(f => ({owner:staffName(f.owner),
      what:f.corrective, due:f.due, status:f.status, _open: () => openFinding(f.id)})),
    {sort:'due', pageSize:6, onRow:true});

  renderTable('invBody', [
    {k:'id', label:'Investigation'},
    {k:'type', label:'Type'},
    {k:'subject', label:'Subject'},
    {k:'opened', label:'Opened', html:v => fmtDate(v)},
    {k:'owner', label:'Owner'},
    {k:'status', label:'Status', html:v => badge(v, statTone(v))}
  ], investigations.map(i => Object.assign({}, i, {owner:staffName(i.owner)})), {sort:'opened', pageSize:7});
}

function openFinding(id){
  const f = FINDINGS.find(x => x.id === id);
  if(!f) return;
  openModal(f.id + ' · ' + f.title, f.category + ' · ' + f.rating,
    `<div class="pfields">
      ${field('Rating', badge(f.rating, sevTone(f.rating)))}
      ${field('Owner', esc(staffName(f.owner)))}
      ${field('Raised', fmtDate(f.raised))}
      ${field('Due', fmtDate(f.due))}
      ${field('Status', badge(f.status, statTone(f.status)))}
    </div>
    <div class="minihead">Recommendation</div>
    <div class="note gold"><div>${esc(f.recommendation)}</div></div>
    <div class="minihead">Corrective action</div>
    <div>${esc(f.corrective)}</div>`,
    [{label:'Record corrective action', act:() => {
        f.status = 'Corrective action'; f.corrective = 'Owner to confirm the fix and attach evidence';
        logConfig('Corrective action recorded on ' + f.id); closeModal(); renderAll(); toast('Corrective action recorded');
      }},
     {label:'Mark closed', act:() => {
        f.status = 'Closed'; f.corrective = 'Completed and verified by internal audit';
        logConfig('Finding ' + f.id + ' closed'); closeModal(); renderAll(); toast(f.id + ' closed');
      }},
     {label:'Close', act:'close'}]);
}

/* ===================== 11 · REPORTS ===================== */
function reportKYC(){
  const rows = KYC.map(k => [k.id, custName(k.cust), k.status, k.completeness + '%',
    k.contact, k.address, num(k.docs.filter(d => d.state === 'Missing').length),
    num(k.docs.filter(d => d.state === 'Expired').length), fmtDate(k.submitted), staffName(k.reviewer)]);
  return {title:'Customer verification',
    cols:[{label:'File'},{label:'Customer'},{label:'Status'},{label:'Complete',num:true},{label:'Contact'},
      {label:'Address'},{label:'Missing',num:true},{label:'Expired',num:true},{label:'Submitted'},{label:'Reviewer'}],
    rows};
}
function reportLoan(){
  const rows = LOAN_CHECKS.map(c => [c.loan.ref, custName(c.loan.cust), prodName(c.loan.product),
    money(c.loan.amount), money(c.ceiling), c.failed.length ? c.failed.join(', ') : 'Pass',
    num(c.failed.length), c.loan.status]);
  return {title:'Loan compliance',
    cols:[{label:'Facility'},{label:'Customer'},{label:'Product'},{label:'Principal',num:true},
      {label:'Ceiling',num:true},{label:'Failed tests'},{label:'Breaches',num:true},{label:'Status'}],
    rows};
}
function reportSuspicious(){
  const rows = [
    ...PAY_DUPLICATES.map(d => ['Duplicate receipt', d.a.receipt, money(d.a.amount), fmtDate(d.a.date), 'High']),
    ...LARGE_TXNS.map(t => ['Large transaction', t.ref, money(t.amount), fmtDate(t.date), 'Medium']),
    ...FAILED_TXNS.slice(0, 8).map(t => ['Failed or reversed', t.ref, money(t.amount), fmtDate(t.date), 'High']),
    ...CORRECTIONS.filter(c => !c.approved).map(c => ['Unapproved correction', c.receipt, money(c.after - c.before), fmtDate(c.when), 'High'])
  ];
  return {title:'Suspicious transactions',
    cols:[{label:'Signal'},{label:'Reference'},{label:'Amount',num:true},{label:'Date'},{label:'Severity'}], rows};
}
function reportRisk(){
  const active = LOANS.filter(l => l.status === 'Active');
  const rows = AGES.map(b => {
    const mine = active.filter(l => l.ageBucket === b);
    return [b, num(mine.length), money(sum(mine, l => l.arrears)), money(sum(mine, l => l.outstanding)),
      r1(pct(sum(mine, l => l.arrears), sum(active, l => l.arrears) || 1)) + '%'];
  });
  return {title:'Arrears and credit risk',
    cols:[{label:'Ageing bucket'},{label:'Accounts',num:true},{label:'Arrears',num:true},
      {label:'Outstanding',num:true},{label:'Share of arrears',num:true}], rows};
}
function reportStaff(){
  const rows = ACCESS_EVENTS.map(a => [a.name, a.role, a.privileged ? 'Yes' : 'No',
    num(a.failedLogins), num(a.afterHours), num(a.offBranch), a.blocked ? 'Blocked' : 'Active']);
  return {title:'Staff access compliance',
    cols:[{label:'Officer'},{label:'Role'},{label:'Privileged'},{label:'Refused',num:true},
      {label:'After hours',num:true},{label:'Off-branch',num:true},{label:'State'}], rows};
}
function reportPolicy(){
  const rows = EXCEPTIONS.map(e => [e.id, e.loan, custName(e.cust), e.label, e.severity,
    money(e.amount), fmtDate(e.raised), e.status]);
  return {title:'Policy exceptions',
    cols:[{label:'Exception'},{label:'Facility'},{label:'Customer'},{label:'Breach'},{label:'Severity'},
      {label:'Exposure',num:true},{label:'Raised'},{label:'Status'}], rows};
}
function reportFindings(){
  const rows = FINDINGS.map(f => [f.id, f.title, f.category, f.rating, staffName(f.owner),
    fmtDate(f.due), f.status, f.corrective]);
  return {title:'Audit findings',
    cols:[{label:'Finding'},{label:'Title'},{label:'Area'},{label:'Rating'},{label:'Owner'},
      {label:'Due'},{label:'Status'},{label:'Corrective action'}], rows};
}
function reportCases(){
  const rows = CASES.filter(c => !/^(Resolved|Closed)$/.test(c.status))
    .map(c => [c.id, c.title, c.lane, c.severity, staffName(c.owner), fmtDate(c.opened), fmtDate(c.due), c.status]);
  return {title:'Open compliance cases',
    cols:[{label:'Case'},{label:'Subject'},{label:'Lane'},{label:'Severity'},{label:'Owner'},
      {label:'Opened'},{label:'Due'},{label:'Status'}], rows};
}
function reportCorrective(){
  const rows = FINDINGS.filter(f => f.status !== 'Closed')
    .map(f => [f.id, f.title, staffName(f.owner), f.corrective, fmtDate(f.due), f.status]);
  return {title:'Corrective action status',
    cols:[{label:'Finding'},{label:'Title'},{label:'Owner'},{label:'Action'},{label:'Due'},{label:'Status'}], rows};
}

const REPORTS = {
  kyc:{label:'Customer Verification Report', build:reportKYC,
    desc:'Every KYC file with its completeness, missing documents and reviewer.'},
  loan:{label:'Loan Compliance Report', build:reportLoan,
    desc:'Nine policy tests per facility, with the breaches that failed.'},
  suspicious:{label:'Suspicious Transaction Report', build:reportSuspicious,
    desc:'Duplicates, large movements, failures and unapproved corrections.'},
  risk:{label:'Arrears and Credit Risk Report', build:reportRisk,
    desc:'Overdue exposure by ageing bucket against the open principal.'},
  staff:{label:'Staff Access Compliance Report', build:reportStaff,
    desc:'Access held, refused sign-ins and after-hours activity per officer.'},
  policy:{label:'Policy Exception Report', build:reportPolicy,
    desc:'Every open and closed breach with its exposure and owner.'},
  findings:{label:'Audit Findings Report', build:reportFindings,
    desc:'Findings, ratings and the corrective action agreed for each.'},
  cases:{label:'Open Compliance Cases Report', build:reportCases,
    desc:'The current case load, oldest severity first.'},
  corrective:{label:'Corrective Action Status Report', build:reportCorrective,
    desc:'What was agreed, who owns it and whether it is closed.'}
};
function reportData(key){
  const r = REPORTS[key];
  if(!r) return null;
  const built = r.build();
  return {key, label:r.label, title:built.title, cols:built.cols, rows:built.rows};
}
function renderReportCards(){
  el('repCards').innerHTML = Object.entries(REPORTS).map(([key, r]) => {
    const d = reportData(key);
    return `<div class="repcard">
      <div class="rt">${esc(r.label)}</div>
      <div class="rd">${esc(r.desc)}</div>
      <div class="rv">${num(d.rows.length)} rows · ${d.cols.length} columns</div>
      <div class="acts">
        <button class="btn btn-ghost" data-rep="${key}" data-fmt="preview">Preview</button>
        <button class="btn btn-ghost" data-rep="${key}" data-fmt="csv">CSV</button>
        <button class="btn btn-ghost" data-rep="${key}" data-fmt="xlsx">Excel</button>
        <button class="btn btn-ghost" data-rep="${key}" data-fmt="pdf">PDF</button>
      </div>
    </div>`;
  }).join('');
}
function runReport(key, fmt){
  const d = reportData(key);
  if(!d) return toast('Unknown report.', 'err');
  if(fmt === 'preview'){
    openModal(d.label, `${num(d.rows.length)} rows · ${filterLine()}`,
      `${brandHtml(d.label, filterLine())}
       <div class="tblwrap" style="max-height:330px"><table class="tbl2 dense">
         <thead><tr>${d.cols.map(c => `<th class="${c.num ? 'num' : ''}">${esc(c.label)}</th>`).join('')}</tr></thead>
         <tbody>${d.rows.slice(0, 40).map(r => `<tr>${r.map((v, i) =>
           `<td class="${d.cols[i].num ? 'num' : ''}">${esc(v)}</td>`).join('')}</tr>`).join('')}</tbody>
       </table></div>
       <div class="qhint">Showing ${Math.min(40, d.rows.length)} of ${num(d.rows.length)} rows · ${esc(filterLine())}</div>`,
      [{label:'Download CSV', act:() => { closeModal(); runReport(key, 'csv'); }}, {label:'Close', act:'close'}]);
    return;
  }
  if(fmt === 'csv'){
    const text = '\ufeff' + filterLine() + '\r\n' + toCsv([d.cols.map(c => c.label)].concat(d.rows));
    downloadFile('compliance-' + key + '-' + TODAY + '.csv', 'text/csv;charset=utf-8', text);
    logExport(d.label, 'CSV', d.rows.length);
    return;
  }
  if(fmt === 'xlsx'){
    const bytes = xlsxBytes(d.title, d.cols, d.rows.map(r => r.map(v => {
      const n = Number(String(v).replace(/[^0-9.-]/g, ''));
      return /^[\d,.\s-]+$/.test(String(v)) && String(v).trim() !== '' && isFinite(n) ? n : String(v);
    })));
    downloadFile('compliance-' + key + '-' + TODAY + '.xlsx',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', bytes);
    logExport(d.label, 'Excel', d.rows.length);
    return;
  }
  printTable(d.label, d.cols, d.rows);
  logExport(d.label, 'PDF', d.rows.length);
}
function runPack(fmt){
  const all = Object.keys(REPORTS).map(reportData);
  if(fmt === 'csv'){
    const parts = [filterLine()];
    all.forEach(d => { parts.push('', d.label.toUpperCase()); parts.push(toCsv([d.cols.map(c => c.label)].concat(d.rows))); });
    downloadFile('compliance-pack-' + TODAY + '.csv', 'text/csv;charset=utf-8', '\ufeff' + parts.join('\r\n'));
    logExport('Compliance pack', 'CSV', sum(all, d => d.rows.length));
    return;
  }
  if(fmt === 'xlsx'){
    const rows = [];
    all.forEach(d => {
      rows.push([d.label.toUpperCase()]);
      rows.push(d.cols.map(c => c.label));
      d.rows.forEach(r => rows.push(r.map(v => String(v))));
      rows.push([]);
    });
    const cols = [{label:'Compliance pack'}].concat([1,2,3,4,5,6,7].map(() => ({label:''})));
    downloadFile('compliance-pack-' + TODAY + '.xlsx',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      xlsxBytes('Compliance pack', cols, rows));
    logExport('Compliance pack', 'Excel', rows.length);
    return;
  }
  const html = brandHtml('Compliance pack', filterLine()) + all.map(d => `
    <h1 style="margin-top:14px">${esc(d.label)}</h1>
    <table style="width:100%;border-collapse:collapse;font-size:9.5px">
      <thead><tr>${d.cols.map(c => `<th style="text-align:${c.num ? 'right' : 'left'};border-bottom:1px solid #E6E8EE;padding:4px">${esc(c.label)}</th>`).join('')}</tr></thead>
      <tbody>${d.rows.map(r => `<tr>${r.map((v, i) =>
        `<td style="text-align:${d.cols[i].num ? 'right' : 'left'};border-bottom:1px dashed #EDEFF4;padding:3px">${esc(v)}</td>`).join('')}</tr>`).join('')}</tbody>
    </table>`).join('');
  doPrint('Compliance pack', html);
  logExport('Compliance pack', 'PDF', sum(all, d => d.rows.length));
}

/* ===================== 12 · CUSTOMER DATA PROTECTION ===================== */
function renderDataProtection(){
  const activeConsent = CONSENT.filter(c => c.status === 'Active');
  const openReq = DATA_REQUESTS.filter(r => !/^Completed$/.test(r.status));
  const breachOpen = BREACHES.filter(b => b.status !== 'Closed');
  const retentionGaps = RETENTION.filter(r => r.status !== 'Compliant');
  const dpAccess = ACCESS_EVENTS.map((a, i) => ({
    when: a.lastLogin, who:a.name, record: i % 3 === 0 ? 'Customer profile' : i % 3 === 1 ? 'Loan statement' : 'KYC documents',
    cust: custName(CUSTOMERS[(i * 5) % CUSTOMERS.length].id),
    purpose: ['Account servicing','Credit review','Collections','Audit'][i % 4],
    allowed: i % 11 !== 7
  }));

  el('dpPill').className = 'badge ' + (breachOpen.length ? 'b-crit' : retentionGaps.length ? 'b-warn' : 'b-ok');
  el('dpPill').textContent = breachOpen.length + ' open breaches';

  el('dpKpis').innerHTML = [
    ['Consent records', num(CONSENT.length), `${num(activeConsent.length)} active · ${num(CONSENT.length - activeConsent.length)} withdrawn`, 'gold'],
    ['Open data requests', num(openReq.length), 'Correction and export requests', openReq.length ? 'red' : ''],
    ['Breach incidents', num(BREACHES.length), `${num(breachOpen.length)} still open`, breachOpen.length ? 'red' : ''],
    ['Retention gaps', num(retentionGaps.length), 'Stores past their retention rule', ''],
    ['Sensitive access events', num(dpAccess.length), `${num(dpAccess.filter(d => !d.allowed).length)} without a valid purpose`, ''],
    ['Reviews completed', num(4), 'Data protection reviews in the period', '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join('');

  renderTable('dpAccessBody', [
    {k:'who', label:'Officer'},
    {k:'record', label:'Record'},
    {k:'cust', label:'Customer'},
    {k:'purpose', label:'Purpose'},
    {k:'when', label:'When'},
    {k:'allowed', label:'Allowed', html:v => badge(v ? 'Yes' : 'No', v ? 'b-ok' : 'b-crit')}
  ], dpAccess, {sort:'when', pageSize:7});

  const controls = [
    ['National ID number', 'Masked except the last four', 'Customer care, Collections', 'Yes'],
    ['Phone number', 'Masked in exports', 'All staff', 'Yes'],
    ['Declared income', 'Masked', 'Property roles only', 'Yes'],
    ['Document images', 'Secure viewer, no download', 'Compliance, Credit', 'Yes'],
    ['Repayment history', 'Visible', 'All staff', 'No'],
    ['Case evidence', 'Owner and compliance officer', 'Compliance', 'Yes']
  ].map(([fieldName, control, who, masked]) => ({fieldName, control, who, masked}));
  el('dpCtrlHead').innerHTML = '<tr><th>Field</th><th>Control</th><th>Who may see it</th><th>Masked</th></tr>';
  el('dpCtrlBody').innerHTML = controls.map(c => `<tr><td>${esc(c.fieldName)}</td><td>${esc(c.control)}</td>
      <td>${esc(c.who)}</td><td>${badge(c.masked, c.masked === 'Yes' ? 'b-ok' : 'b-gray')}</td></tr>`).join('');

  renderTable('consentBody', [
    {k:'cust', label:'Customer'},
    {k:'purpose', label:'Purpose'},
    {k:'channel', label:'Channel'},
    {k:'given', label:'Given', html:v => fmtDate(v)},
    {k:'status', label:'Status', html:v => badge(v, v === 'Active' ? 'b-ok' : 'b-warn')}
  ], CONSENT.map(c => Object.assign({}, c, {cust:custName(c.cust)})), {sort:'given', pageSize:6});

  el('dpReqPill').textContent = openReq.length;
  renderTable('dpReqBody', [
    {k:'id', label:'Request'},
    {k:'kind', label:'Kind'},
    {k:'detail', label:'Request'},
    {k:'raised', label:'Raised', html:v => fmtDate(v)},
    {k:'status', label:'Status', html:v => badge(v, statTone(v))},
    {k:'act', label:'', html:(v, r) => `<button class="btn btn-ghost" data-dreq="${r.id}">${r.status === 'Completed' ? 'Reopen' : 'Progress'}</button>`}
  ], DATA_REQUESTS.map(r => Object.assign({}, r, {raised:r.raised})), {sort:'raised', pageSize:6});

  el('retRuleHead').innerHTML = '<tr><th>Record</th><th>Retention rule</th><th>Store</th><th>State</th></tr>';
  el('retRuleBody').innerHTML = RETENTION.map(r => `<tr><td>${esc(r.what)}</td><td>${esc(r.rule)}</td>
      <td>${esc(r.where)}</td><td>${badge(r.status, r.status === 'Compliant' ? 'b-ok' : 'b-warn')}</td></tr>`).join('');

  el('breachHead').innerHTML = '<tr><th>Incident</th><th>What happened</th><th class="num">Affected</th><th>Severity</th><th>Status</th></tr>';
  el('breachBody').innerHTML = BREACHES.map(b => `<tr><td>${esc(b.id)}</td><td>${esc(b.what)}</td>
      <td class="num">${num(b.affected)}</td><td>${badge(b.severity, sevTone(b.severity))}</td>
      <td>${badge(b.status, statTone(b.status))}</td></tr>`).join('');

  const hist = [
    ...DATA_REQUESTS.map(r => ({when:r.raised, what:r.kind + ' request ' + r.id + ' · ' + r.detail, who:staffName(r.owner)})),
    ...BREACHES.map(b => ({when:b.when, what:'Breach ' + b.id + ' opened · ' + b.what, who:'Chikondi Mwale'})),
    {when: addDays(TODAY, -18), what:'Sensitive-field masking extended to exports', who:'Chikondi Mwale'},
    {when: addDays(TODAY, -9), what:'Quarterly data protection review completed', who:'Tadala Msonthi'}
  ].sort((a, b) => a.when < b.when ? 1 : -1);
  renderTable('dpHistBody', [
    {k:'when', label:'When', html:v => fmtDate(v)},
    {k:'what', label:'Event'},
    {k:'who', label:'By'}
  ], hist, {sort:'when', pageSize:7});
}
</script>
