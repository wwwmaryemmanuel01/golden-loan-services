<script>
/* ============================================================
   SALARIES, EXPENSES & OPERATING CHARGES (4/8)
   Shared building blocks, then sections 1–4: the financial
   overview, staff salary management, payroll processing and the
   allowances and benefits.
   ============================================================ */

/* ---------------- shared building blocks ---------------- */
function seTone(s){
  const t = String(s == null ? '' : s);
  if(/^(Paid|Approved|Active|Verified|Delivered|Applied|Pass|Healthy|Within budget|Issued|Matched|Enabled|Completed|Cleared|On|Yes|Normal|Restricted|Capitalised|Capital|Sent|Reconciled)$/i.test(t)) return 'b-ok';
  if(/^(Pending|Pending approval|Pending confirmation|Submitted|Processing|Draft|Review|Queued|Returned|At the limit|Open|Medium|Overdue$|Unpaid|Scheduled|Probation|Accrued|Prepaid)$/i.test(t)) return 'b-warn';
  if(/^(Failed|Rejected|Over budget|Critical|High|Suspended|Missing|Expired|Blocked|No|Overdue|Unverified|Left)$/i.test(t)) return 'b-crit';
  return 'b-gray';
}
const okb = s => badge(s, seTone(s));
const SE_SEV = s => s === 'Critical' || s === 'High' ? 'b-crit' : s === 'Medium' ? 'b-warn' : 'b-gray';
const put = (id, html) => { const n = el(id); if(n) n.innerHTML = html; };
const seIsos = v => String(v == null ? '' : v).slice(0, 10);
const seWhen = v => String(v == null ? '' : v).slice(0, 16);
const seNow = () => new Date().toTimeString().slice(0, 5);
const SE_AUDIT_LOG = [];
const SE_SAL_HISTORY = [];
const SE_BUDGET_LOG = [];
const SE_PAYROLL_LOG = [];

function seLogChange(area, what, from, to){
  SE_CHANGES.unshift({when: TODAY + ' ' + seNow(), what, area, from: String(from), to: String(to), by: 'STF-007'});
  SE_CHANGES.length = Math.min(SE_CHANGES.length, 90);
}
function seAudit(action, target, detail){
  const row = {when: TODAY + ' ' + seNow(), action, target, detail, by: staffName('STF-007'),
    lane: 'Finance', severity: 'Low', owner: 'STF-007', region: 'Lilongwe'};
  SE_AUDIT_LOG.unshift(row);
  SE_AUDIT_LOG.length = Math.min(SE_AUDIT_LOG.length, 80);
  SE_AUDIT.unshift(row);
}
function meter(label, value, sub, max){
  const v = clamp(Number(value) || 0, 0, max || 100);
  return `<div class="meterrow"><div style="flex:1">
      <div class="sl"><b>${esc(label)}</b><span>${esc(sub || '')}</span></div>
      <div class="meter"><i style="width:${(v / (max || 100) * 100).toFixed(1)}%"></i></div>
    </div><div class="sv">${max ? num(value) : num(value) + '%'}</div></div>`;
}
const kvRow = (k, v) => `<div class="risk"><div><div class="rn">${esc(k)}</div></div><div class="rv">${v}</div></div>`;
function seRecordModal(rec, title){
  const skip = ['_open', 'lane', 'severity', 'owner', 'region', 'region2'];
  const moneyKeys = /amount|basic|gross|net|expected|actual|paye|pension|nhima|deduction|allowance|bonus|total|value|limit|monthly|annual|balance|budget|loan|advance/i;
  const rows = Object.keys(rec).filter(k => !skip.includes(k) && k[0] !== '_').map(k => {
    const v = rec[k];
    const label = k.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase());
    const shown = typeof v === 'number' ? (moneyKeys.test(k) ? esc(seM(v)) : num(v))
      : v && typeof v === 'object' ? esc(JSON.stringify(v))
      : v === '' || v === null || v === undefined ? '—' : esc(String(v));
    return field(label, shown);
  });
  openModal(title || 'Record', filterLine(), `<div class="pfields">${rows.join('')}</div>`,
    [{label: 'Close', act: 'close'}]);
}
const strip = rows => `<div class="strip">${rows.map(([k, v]) => `<div><div class="sl">${esc(k)}</div><div class="sv">${v}</div></div>`).join('')}</div>`;
const chartBox = o => chartCard(Object.assign({chart: chart(o)}, o));
const SE_SEL = {sal: '', period: '', staff: '', claim: '', expense: '', system: '', recurring: '', category: '',
  budget: '', payment: '', approval: '', supplier: '', dedStaff: '', payslip: ''};

function seFillSel(id, pairs, keep){
  const n = el(id);
  if(!n) return;
  const cur = keep !== undefined ? keep : n.value;
  n.innerHTML = pairs.map(([v, l]) => `<option value="${esc(v)}">${esc(l)}</option>`).join('');
  if(cur && pairs.some(p => p[0] === cur)) n.value = cur;
}
const seStaffOptions = () => SE_STAFF.map(s => [s.id, s.id + ' · ' + s.name + ' · ' + s.role]);
const seDeptOptions = () => SE_DEPARTMENTS.map(d => [d.name, d.name + ' · ' + d.costCentre]);
const seCategoryOptions = () => SE_CATEGORIES.map(c => [c.name, c.name]);
const seSupplierOptions = () => SE_SUPPLIERS.map(s => [s.id, s.id + ' · ' + s.name]);

/* every list follows the filter bar; a missing dimension is simply not applied */
function sePass(item){
  const d = item.when || item.effective || item.submitted || item.renewal || item.paidOn || item.due
    || item.lastWrite || item.lastAction || TODAY;
  if(!inRange(seIsos(d))) return false;
  const has = k => item[k] !== undefined && item[k] !== null && item[k] !== '';
  return (!has('lane') || passLane(item)) && (!has('severity') || passSeverity(item))
    && (!has('status') || passStatus(item)) && (!has('owner') || passOwner(item))
    && (!FILTER.dept || !has('dept') ? true : item.dept === FILTER.dept)
    && (!FILTER.category || !has('category') ? true : item.category === FILTER.category)
    && matchQ(item.id, item.ref, item.reference, item.invoice, item.name, item.scope, item.kind, item.type,
      item.event, item.provider, item.table, item.function, item.payee, item.subject, item.salary,
      item.staff ? seStaffName(item.staff) : '', item.amount, item.description, item.reason, item.notes, item.category);
}

/* ===================== 1 · FINANCIAL OVERVIEW ===================== */
function seIssues(){
  const out = [];
  SE_STATUTORY.filter(s => s.status === 'Overdue').forEach(s => out.push({
    what: s.item + ' remittance is overdue', detail: s.body + ' · ' + seM(s.amount) + ' due ' + fmtDate(s.due),
    severity: 'Critical', goto: 's5'}));
  SE_PAYROLL_LINES.filter(l => l.status === 'Failed').slice(0, 3).forEach(l => out.push({
    what: 'Salary payment failed for ' + seStaffName(l.staff),
    detail: seM(l.net) + ' · ' + l.failure, severity: 'High', goto: 's13'}));
  SE_EXPENSES.filter(e => e.status === 'Overdue').slice(0, 3).forEach(e => out.push({
    what: 'Invoice ' + e.invoice + ' is overdue', detail: e.category + ' · ' + seM(e.amount),
    severity: 'High', goto: 's13'}));
  SE_BUDGETS.filter(b => b.status === 'Over budget').slice(0, 2).forEach(b => out.push({
    what: b.scope + ' is over budget', detail: seM(Math.abs(b.variance)) + ' above ' + seM(b.monthly),
    severity: 'Medium', goto: 's12'}));
  SE_CLAIMS.filter(c => c.amount > SE_SET.receiptRequiredAbove && c.receipt === 'None').slice(0, 2).forEach(c => out.push({
    what: 'Claim ' + c.id + ' has no receipt', detail: seStaffName(c.staff) + ' · ' + seM(c.amount),
    severity: 'Medium', goto: 's7'}));
  SE_DB_TABLES.filter(t => t.rls !== 'Enabled').forEach(t => out.push({
    what: t.table + ' has no row-level policy', detail: t.note, severity: 'High', goto: 's19'}));
  return out.filter(a => passSeverity(a) && matchQ(a.what, a.detail));
}

function renderOverview(){
  const s = seStats();
  if(el('ovPill')){ el('ovPill').className = 'badge b-gray'; el('ovPill').textContent = num(s.staff) + ' staff on the payroll'; }
  put('ovKpis', [
    ['Total staff salaries', seM(s.salaryTotal), num(s.salaries) + ' salary records', ''],
    ['Paid this month', seM(s.payrollPaid / Math.max(1, SE_PAYROLL.length - 1)), num(SE_PAYROLL.filter(p => p.status === 'Paid').length) + ' periods settled', ''],
    ['Outstanding salaries', seM(s.outstandingSalary), num(SE_PAYROLL_LINES.filter(l => l.status !== 'Paid').length) + ' lines still open', s.outstandingSalary ? 'red' : ''],
    ['Staff allowances', seM(s.allowanceTotal), 'On top of basic, every month', ''],
    ['Staff bonuses', seM(s.bonusTotal), 'Performance and commission', ''],
    ['Business expenses', seM(s.expensesThisMonth), 'This month, ' + num(seExpThisMonth.length) + ' invoices', ''],
    ['System operating charges', seM(s.systemActual), num(SE_SYSTEM.length) + ' providers', ''],
    ['Pending expense claims', num(s.claimsOpen), seM(s.claimsValue) + ' waiting', s.claimsOpen ? 'red' : ''],
    ['Pending payment approvals', num(s.pendingApprovals), seM(s.pendingValue) + ' to sign', s.pendingApprovals ? 'red' : ''],
    ['Total operating costs', seM(s.operatingCost), 'Payroll, expenses and system', ''],
    ['Monthly budget utilisation', Math.round(s.budgetUtil) + '%', seM(s.budgetActual) + ' of ' + seM(s.budgetTotal), s.budgetUtil > 100 ? 'red' : ''],
    ['Recent financial activities', num(SE_PAYMENTS.length + SE_APPROVALS.length + SE_CHANGES.length), 'Payments, approvals and changes', '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join(''));

  if(el('ovStamp')) el('ovStamp').textContent = 'Updated ' + lastRefresh();
  if(el('ovMeterPill')) el('ovMeterPill').textContent = Math.round(s.budgetUtil) + '% used';
  put('ovMeters',
    meter('Monthly budget used', Math.round(s.budgetUtil), seM(s.budgetActual) + ' of ' + seM(s.budgetTotal), 100) +
    meter('Payroll settled', Math.round(pct(s.payrollPaid, Math.max(1, s.payrollPaid + s.outstandingSalary))),
      seM(s.payrollPaid) + ' paid against ' + seM(s.outstandingSalary) + ' still open', 100) +
    meter('Statutory up to date', Math.round(pct(SE_STATUTORY.filter(x => x.status === 'Paid').length, Math.max(1, SE_STATUTORY.length))),
      SE_STATUTORY.filter(x => x.status === 'Paid').length + ' of ' + SE_STATUTORY.length + ' remittances', 100) +
    meter('Claims decided', Math.round(pct(SE_CLAIMS.filter(c => !['Submitted', 'Pending approval'].includes(c.status)).length, Math.max(1, SE_CLAIMS.length))),
      seM(s.claimsPaid) + ' reimbursed', 100) +
    meter('Suppliers verified', Math.round(pct(s.suppliers - s.supplierUnverified, Math.max(1, s.suppliers))),
      s.supplierUnverified + ' still to verify', 100) +
    meter('Financial health score', Math.round(s.score), 'Failures, overdue items, budget and policy gaps', 100));

  const board = [
    ['Payroll', s.salaryTotal, 'Salaries and allowances'],
    ['Business expenses', s.expensesThisMonth, 'This month'],
    ['System charges', s.systemActual, 'Actual billed'],
    ['Unpaid obligations', s.unpaidExpenses + s.outstandingSalary, 'Expenses and salaries']
  ];
  if(el('ovBoardPill')) el('ovBoardPill').textContent = seM(s.operatingCost);
  put('ovBoard', board.map(([k, v, sub]) => `<div class="risk"><div><div class="rn">${esc(k)}</div>
      <div class="rs">${esc(sub)}</div></div><div class="rv">${esc(seM(v))}</div></div>`).join('')
    + kvRow('Budget for the month', seM(s.budgetTotal)));

  const issues = seIssues();
  if(el('ovAlertPill')) el('ovAlertPill').textContent = issues.length;
  put('ovAlerts', issues.length ? issues.map(a => `<div class="risk rowlink" data-goto="${a.goto}">
      <div><div class="rn">${esc(a.what)}</div><div class="rs">${esc(a.detail)}</div></div>
      <div class="rv">${badge(a.severity, SE_SEV(a.severity))}</div></div>`).join('')
    : '<div class="empty">Nothing open — every remittance, invoice and budget line is settled.</div>');

  const feed = SE_PAYMENTS.slice().sort((a, b) => String(b.when).localeCompare(String(a.when))).slice(0, 6)
    .map(p => ({when: p.when, what: p.kind + ' payment · ' + p.payee, amount: p.amount, status: p.status, goto: 's13'}))
    .concat(SE_APPROVALS.slice(0, 3).map(a => ({when: a.when, what: a.kind + ' · ' + a.id, amount: a.amount, status: a.status, goto: 's14'})))
    .concat(SE_CHANGES.slice(0, 3).map(c => ({when: c.when, what: c.what + ' · ' + c.area, amount: 0, status: 'Applied', goto: 's20'})))
    .sort((a, b) => String(b.when).localeCompare(String(a.when))).filter(r => sePass(r)).slice(0, 8);
  if(el('ovFeedPill')) el('ovFeedPill').textContent = num(feed.length) + ' latest';
  put('ovFeed', feed.length ? feed.map(f => `<div class="risk rowlink" data-goto="${f.goto}">
      <div><div class="rn">${esc(f.what)}</div><div class="rs">${esc(seWhen(f.when))}</div></div>
      <div class="rv">${f.amount ? esc(seM(f.amount)) + '<br>' : ''}${okb(f.status)}</div></div>`).join('')
    : '<div class="empty">No activity matches the current filters.</div>');

  put('ovGrid',
    chartBox({title: 'Payroll against the other costs', sub: 'This month, MWK', type: 'bar', h: 200,
      cats: ['Payroll', 'Expenses', 'System'],
      series: [{name: 'Cost', data: [s.salaryTotal, s.expensesThisMonth, s.systemActual]}],
      value: compact(s.operatingCost)}) +
    chartBox({title: 'Spend by department', sub: 'What each department costs', type: 'donut', h: 200,
      cats: SE_DEPARTMENTS.map(d => d.name.split(' ')[0]),
      series: [{name: 'Budget', data: SE_DEPARTMENTS.map(d => d.budget)}],
      value: compact(sum(SE_DEPARTMENTS, d => d.budget))}) +
    chartBox({title: 'Six months of payroll', sub: 'Net pay per period', type: 'line', h: 200,
      cats: SE_PAYROLL.map(p => p.label),
      series: [{name: 'Net pay', data: SE_PAYROLL.map(p => p.net), colour: '#1E9E6A'}],
      value: compact(SE_OPEN_PERIOD.net)}));
}

/* ===================== 2 · STAFF SALARY MANAGEMENT ===================== */
function seSalItem(){
  return SE_SAL_BY_ID[SE_SEL.sal] || SE_SALARIES[0];
}
function renderSalaries(){
  const rows = SE_SALARIES.filter(sePass);
  const s = seStats();
  if(el('saPill')){ el('saPill').className = 'badge b-gray'; el('saPill').textContent = num(SE_SALARIES.length) + ' salary records'; }
  put('saKpis', [
    ['Salary records', num(SE_SALARIES.length), num(SE_STAFF.length) + ' staff on file', ''],
    ['Total basic', seM(SE_SALARY_TOTAL), 'Before allowances', ''],
    ['Total gross', seM(sum(SE_SALARIES, x => x.gross)), 'Basic plus allowances', ''],
    ['Total net', seM(SE_NET_TOTAL), 'What reaches the staff', ''],
    ['Average basic', seM(SE_SALARY_TOTAL / Math.max(1, SE_SALARIES.length)), 'Per salary record', ''],
    ['Monthly records', num(SE_SALARIES.filter(x => x.frequency === 'Monthly').length), 'Paid every month', ''],
    ['Contractual records', num(SE_SALARIES.filter(x => x.frequency === 'Contractual').length), 'Fixed term', ''],
    ['Outstanding balances', seM(s.outstandingSalary), num(SE_SAL_HISTORY.length) + ' changes logged', '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join(''));

  seFillSel('saStaff', seStaffOptions());
  if(el('saEffective') && !el('saEffective').value) el('saEffective').value = addMonths(TODAY, 1);
  if(el('saMsg') && !String(el('saMsg').textContent || '').trim())
    el('saMsg').textContent = 'Assigning a salary writes the record, its effective date and an audit row; the net is derived, never typed.';

  if(el('saCount')) el('saCount').textContent = num(rows.length) + ' records';
  const list = rows.slice().sort((a, b) => b.basic - a.basic);
  list.forEach(r => { r._open = () => { SE_SEL.sal = r.id; renderSalaries(); seRecordModal(r, r.id + ' · ' + seStaffName(r.staff)); }; });
  renderTable('saBody', [
    {k: 'id', label: 'Record'},
    {k: 'staff', label: 'Staff member', html: v => esc(seStaffName(v))},
    {k: 'dept', label: 'Department'},
    {k: 'frequency', label: 'Frequency'},
    {k: 'basic', label: 'Basic', num: true, html: v => esc(seM(v))},
    {k: 'allowanceTotal', label: 'Allowances', num: true, html: v => esc(seM(v))},
    {k: 'deductions', label: 'Deductions', num: true, html: v => esc(seM(v))},
    {k: 'net', label: 'Net', num: true, html: v => esc(seM(v))},
    {k: 'status', label: 'State', html: v => okb(v)}
  ], list, {sort: 'basic', pageSize: 9});

  const sel = seSalItem();
  if(sel) SE_SEL.sal = sel.id;
  if(el('saSelPill')) el('saSelPill').textContent = sel ? sel.id : '—';
  const staff = SE_STAFF_BY_ID[sel.staff] || {};
  put('saDetail', sel ? kvRow('Record', sel.id) + kvRow('Staff member', seStaffName(sel.staff) + ' · ' + sel.staff)
    + kvRow('Role', staff.role || '—') + kvRow('Department', staff.dept || '—')
    + kvRow('Employment', staff.employment || '—') + kvRow('Frequency', sel.frequency)
    + kvRow('Basic', seM(sel.basic)) + kvRow('Effective from', fmtDate(sel.effective))
    + kvRow('Next review', fmtDate(sel.review)) + kvRow('Band', sel.band)
    + kvRow('Bank', sel.bank + ' · ' + String(sel.account).slice(-4).padStart(String(sel.account).length, '•'))
    + kvRow('Tax number', sel.taxId) + kvRow('State', okb(sel.status))
    : '<div class="empty">Nothing selected.</div>');
  put('saBreakdown', strip([
    ['Basic', seM(sel.basic)],
    ['Allowances', seM(sel.allowanceTotal)],
    ['Gross', seM(sel.gross)],
    ['PAYE', seM(sel.paye)],
    ['Pension', seM(sel.pension)],
    ['Net', seM(sel.net)]
  ]) + `<div class="qhint" style="margin-top:6px">Net = gross − PAYE − pension − NHIMA − loan recovery − advance. Every figure is recalculated each render.</div>`);
  if(el('saAdjDate') && !el('saAdjDate').value) el('saAdjDate').value = addMonths(TODAY, 1);
  if(el('saStmtBox') && !String(el('saStmtBox').innerHTML || '').trim())
    el('saStmtBox').innerHTML = '<div class="qhint">Press “Salary statement” to open the record, the allowances and every deduction for this staff member.</div>';
  if(el('saAuditHead')) el('saAuditHead').innerHTML = '<tr><th>When</th><th>Action</th><th>Reason</th><th>Officer</th></tr>';

  const jobs = SE_ADJUSTMENTS.filter(a => a.salary === (sel || {}).id)
    .concat(SE_SAL_HISTORY.filter(h => h.salary === (sel || {}).id));
  renderTable('saAdjBody', [
    {k: 'when', label: 'When', html: v => esc(seWhen(v))},
    {k: 'staff', label: 'Staff member', html: v => esc(seStaffName(v))},
    {k: 'type', label: 'Type', html: v => badge(v, v === 'Increase' ? 'b-ok' : 'b-warn')},
    {k: 'from', label: 'From', num: true, html: v => esc(seM(v))},
    {k: 'to', label: 'To', num: true, html: v => esc(seM(v))},
    {k: 'status', label: 'State', html: v => okb(v)}
  ], SE_ADJUSTMENTS, {sort: 'when', pageSize: 6});

  if(el('saAuditBody')) el('saAuditBody').innerHTML = jobs.length ? jobs.map(j => `<tr>
      <td>${esc(seWhen(j.when))}</td><td>${esc(j.action || (j.type + ' recorded'))}</td>
      <td>${esc(j.reason || j.detail || '')}</td><td>${esc(staffName(j.by) || j.by || '')}</td></tr>`).join('')
    : `<tr><td colspan="4" class="empty">No change has been made to ${esc(sel.id)} from this page yet.</td></tr>`;

  put('saGrid',
    chartBox({title: 'Salary bands', sub: 'What each band costs a month', type: 'bar', h: 200,
      cats: ['Standard', 'Contract', 'Management'],
      series: [{name: 'Gross', data: ['Standard', 'Contract', 'Management'].map(b =>
        sum(SE_SALARIES.filter(x => x.band === b), x => x.gross))}],
      value: compact(sum(SE_SALARIES, x => x.gross))}) +
    chartBox({title: 'Basic against net', sub: 'What the deductions take', type: 'donut', h: 200,
      cats: ['Net pay', 'PAYE', 'Pension', 'NHIMA', 'Recoveries'],
      series: [{name: 'Split', data: [SE_NET_TOTAL, sum(SE_SALARIES, x => x.paye), sum(SE_SALARIES, x => x.pension),
        sum(SE_SALARIES, x => x.nhima), sum(SE_SALARIES, x => x.loanDeduction + x.advance)]}],
      value: compact(sum(SE_SALARIES, x => x.gross))}));
}

/* ===================== 3 · PAYROLL PROCESSING ===================== */
function sePeriodItem(){
  return SE_PAYROLL.find(p => p.id === SE_SEL.period) || SE_OPEN_PERIOD;
}
function renderPayroll(){
  const period = sePeriodItem();
  const lines = SE_PAYROLL_LINES;
  const s = seStats();
  if(el('prPill')){ el('prPill').className = 'badge ' + (period.status === 'Paid' ? 'b-ok' : 'b-warn');
    el('prPill').textContent = period.label + ' · ' + period.status; }
  put('prKpis', [
    ['The open period', period.label, period.id + ' · cut-off ' + fmtDate(period.cutOff), ''],
    ['Eligible staff', num(period.staffCount), 'Active on the payroll', ''],
    ['Gross salary', seM(period.gross), 'Basic plus allowances', ''],
    ['Allowances', seM(period.allowances), 'Every allowance type', ''],
    ['Bonuses and commission', seM(period.bonuses), 'Approved this period', ''],
    ['Approved deductions', seM(period.deductions), 'Statutory and authorised', ''],
    ['Net payable', seM(period.net), 'What leaves the account', ''],
    ['Lines paid', num(lines.filter(l => l.status === 'Paid').length) + ' of ' + num(lines.length),
      num(lines.filter(l => l.status === 'Failed').length) + ' failed', lines.some(l => l.status === 'Failed') ? 'red' : '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join(''));

  seFillSel('prPeriod', SE_PAYROLL.map(p => [p.id, p.label + ' · ' + p.status]));
  if(el('prCutOff') && !el('prCutOff').value) el('prCutOff').value = period.cutOff;
  if(el('prPayDate') && !el('prPayDate').value) el('prPayDate').value = period.payDate;
  if(el('prPeriodPill')) el('prPeriodPill').textContent = period.id;
  if(el('prSummary')) el('prSummary').innerHTML = [
    ['Gross', seM(period.gross)], ['Allowances', seM(period.allowances)], ['Bonuses', seM(period.bonuses)],
    ['Deductions', seM(period.deductions)], ['Net', seM(period.net)]
  ].map(([k, v]) => `<div><div class="sl">${esc(k)}</div><div class="sv">${v}</div></div>`).join('');

  put('prCalcBox', `<div class="minihead">How the net is built</div>`
    + kvRow('Gross salary', seM(period.gross))
    + kvRow('Allowances', '+ ' + seM(period.allowances))
    + kvRow('Bonuses and commissions', '+ ' + seM(period.bonuses))
    + kvRow('Approved deductions', '− ' + seM(period.deductions))
    + kvRow('Net payable', '<b>' + seM(period.net) + '</b>')
    + kvRow('Employer pension on top', seM(period.employerPension))
    + kvRow('Pay date', fmtDate(period.payDate)));
  if(el('prMsg') && !String(el('prMsg').textContent || '').trim())
    el('prMsg').textContent = 'Calculating rebuilds every line from the salary records; approving locks the period; paying writes a reference and a receipt per line.';

  if(el('prLinePill')) el('prLinePill').textContent = num(lines.length) + ' lines';
  const list = lines.slice().sort((a, b) => b.net - a.net);
  list.forEach(r => { r._open = () => openPayrollLine(r); });
  renderTable('prLineBody', [
    {k: 'staff', label: 'Staff member', html: v => esc(seStaffName(v))},
    {k: 'gross', label: 'Gross', num: true, html: v => esc(seM(v))},
    {k: 'bonus', label: 'Bonus', num: true, html: v => esc(v ? seM(v) : '—')},
    {k: 'deductions', label: 'Deductions', num: true, html: v => esc(seM(v))},
    {k: 'net', label: 'Net', num: true, html: v => esc(seM(v))},
    {k: 'method', label: 'Route'},
    {k: 'reference', label: 'Reference', html: v => v ? esc(v) : badge('None', 'b-warn')},
    {k: 'status', label: 'State', html: v => okb(v)}
  ], list, {sort: 'net', pageSize: 10});

  const checks = SE_PAYROLL_CHECKS().concat([
    {check: 'The period has not been paid twice', value: period.status === 'Paid' ? 'Paid once on ' + fmtDate(period.payDate) : 'Not yet paid',
      status: 'Pass'},
    {check: 'Every line carries a payment route', value: lines.filter(l => !l.method).length + ' without one',
      status: lines.some(l => !l.method) ? 'Fail' : 'Pass'}
  ]);
  if(el('prChkPill')) el('prChkPill').textContent = checks.filter(c => c.status === 'Pass').length + '/' + checks.length;
  put('prChecks', checks.map(c => `<div class="checkrow"><div class="ck ${c.status === 'Pass' ? 'pass' : 'crit'}">${c.status === 'Pass' ? '✓' : '!'}</div>
      <div style="flex:1"><div style="font-size:10.5px;font-weight:800">${esc(c.check)}</div>
      <div class="qhint">${esc(String(c.value))}</div></div><div>${okb(c.status === 'Pass' ? 'Pass' : 'Failed')}</div></div>`).join(''));

  if(el('prHistPill')) el('prHistPill').textContent = num(SE_PAYROLL.length) + ' periods';
  renderTable('prHistBody', [
    {k: 'label', label: 'Period'},
    {k: 'staffCount', label: 'Staff', num: true},
    {k: 'gross', label: 'Gross', num: true, html: v => esc(seM(v))},
    {k: 'net', label: 'Net', num: true, html: v => esc(seM(v))},
    {k: 'payDate', label: 'Paid on', html: v => esc(fmtDate(v))},
    {k: 'status', label: 'State', html: v => okb(v)}
  ], SE_PAYROLL, {sort: 'label', pageSize: 6});

  put('prGrid',
    chartBox({title: 'Net pay by period', sub: 'Six months, MWK', type: 'bar', h: 200,
      cats: SE_PAYROLL.map(p => p.label),
      series: [{name: 'Net', data: SE_PAYROLL.map(p => p.net), colour: '#1E9E6A'}],
      value: compact(period.net)}) +
    chartBox({title: 'Where the gross goes', sub: 'Net against deductions', type: 'donut', h: 200,
      cats: ['Net pay', 'Deductions', 'Bonuses'],
      series: [{name: 'Split', data: [period.net, period.deductions, period.bonuses]}],
      value: compact(period.gross)}));
}

function openPayrollLine(l){
  if(!l) return;
  const sal = seSalOf(l.staff) || {};
  openModal(l.id, seStaffName(l.staff) + ' · ' + seM(l.net),
    `<div class="pfields">
      ${field('Gross', esc(seM(l.gross)))}${field('Allowances', esc(seM(l.allowances)))}
      ${field('Bonus', esc(seM(l.bonus)))}${field('Deductions', esc(seM(l.deductions)))}
      ${field('Net', '<b>' + esc(seM(l.net)) + '</b>')}${field('Route', esc(l.method))}
      ${field('Reference', l.reference ? esc(l.reference) : 'Not paid')}${field('State', okb(l.status))}
      ${field('Basic', esc(seM(sal.basic || 0)))}${field('PAYE', esc(seM(sal.paye || 0)))}
      ${field('Pension', esc(seM(sal.pension || 0)))}${field('NHIMA', esc(seM(sal.nhima || 0)))}
    </div>
    ${l.failure ? `<div class="note red" style="margin-top:8px"><div>${esc(l.failure)}</div></div>` : ''}`,
    [{label: 'Pay this line', act: () => { sePayLine(l.id); closeModal(); }},
     {label: 'Close', act: 'close'}]);
}

/* ===================== 4 · ALLOWANCES AND BENEFITS ===================== */
function renderAllowances(){
  const lines = SE_ALLOWANCE_LINES;
  const byType = SE_ALLOWANCE_TYPES.map(t => ({
    type: t.type, basis: t.basis, rule: t.rate, eligibility: t.eligibility, approval: t.approval, taxable: t.taxable,
    people: new Set(lines.filter(l => l.type === t.type).map(l => l.staff)).size,
    total: sum(lines.filter(l => l.type === t.type), l => l.amount),
    status: t.approval
  }));
  if(el('awPill')){ el('awPill').className = 'badge b-gray'; el('awPill').textContent = seM(sum(lines, l => l.amount)) + ' a month'; }
  put('awKpis', [
    ['Allowance types', num(SE_ALLOWANCE_TYPES.length), 'Transport to commission', ''],
    ['Total allowances', seM(sum(lines, l => l.amount)), 'On this payroll', ''],
    ['Staff receiving one', num(new Set(lines.map(l => l.staff)).size), 'Of ' + num(SE_STAFF.length) + ' staff', ''],
    ['Transport', seM(sum(lines.filter(l => l.type === 'Transport'), l => l.amount)), '8% of basic', ''],
    ['Housing', seM(sum(lines.filter(l => l.type === 'Housing'), l => l.amount)), '12% of basic', ''],
    ['Communication and meals', seM(sum(lines.filter(l => ['Communication', 'Meal'].includes(l.type)), l => l.amount)), 'Fixed monthly', ''],
    ['Pending approval', num(lines.filter(l => l.status === 'Pending').length), seM(sum(lines.filter(l => l.status === 'Pending'), l => l.amount)) + ' waiting', ''],
    ['Bonuses this period', seM(sum(SE_PAYROLL_LINES, l => l.bonus)), 'Performance and commission', '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join(''));

  if(el('awRulePill')) el('awRulePill').textContent = num(SE_ALLOWANCE_TYPES.length) + ' rules';
  renderTable('awRuleBody', [
    {k: 'type', label: 'Allowance'},
    {k: 'basis', label: 'Basis'},
    {k: 'rule', label: 'Rate'},
    {k: 'eligibility', label: 'Who qualifies'},
    {k: 'approval', label: 'Approved by'},
    {k: 'taxable', label: 'Taxable', html: v => badge(v, v === 'Yes' ? 'b-warn' : 'b-ok')},
    {k: 'people', label: 'Staff', num: true},
    {k: 'total', label: 'This month', num: true, html: v => esc(seM(v))}
  ], byType, {sort: 'total', pageSize: 9});

  seFillSel('awStaff', seStaffOptions());
  seFillSel('awType', SE_ALLOWANCE_TYPES.map(t => [t.type, t.type]));
  if(el('awMsg') && !String(el('awMsg').textContent || '').trim())
    el('awMsg').textContent = 'Recording an allowance adds a line to the open payroll and to the allowance history.';

  put('awFlow', [['Requested', 'The line officer raises it'],
    ['Checked', 'Payroll confirms eligibility and the rate'],
    ['Approved', 'A manager signs anything above the limit'],
    ['Paid', 'It lands on the next payroll'],
    ['Recorded', 'The history keeps the rate and the approver']]
    .map(([k, v], i) => `<div class="risk"><div><div class="rn">${i + 1} · ${esc(k)}</div>
      <div class="rs">${esc(v)}</div></div><div class="rv">${i < 3 ? okb('Active') : badge('Next payroll', 'b-gray')}</div></div>`).join(''));

  if(el('awLinePill')) el('awLinePill').textContent = num(lines.length) + ' lines';
  renderTable('awLineBody', [
    {k: 'staff', label: 'Staff member', html: v => esc(seStaffName(v))},
    {k: 'type', label: 'Allowance'},
    {k: 'basis', label: 'Basis'},
    {k: 'amount', label: 'Amount', num: true, html: v => esc(seM(v))},
    {k: 'status', label: 'State', html: v => okb(v)}
  ], lines.filter(sePass), {sort: 'amount', pageSize: 8});

  if(el('awHistPill')) el('awHistPill').textContent = num(SE_ALLOWANCE_HISTORY.length) + ' changes';
  if(el('awHistHead')) el('awHistHead').innerHTML = '<tr><th>When</th><th>Allowance</th><th>Change</th><th>Now</th><th>Officer</th></tr>';
  if(el('awHistBody')) el('awHistBody').innerHTML = SE_ALLOWANCE_HISTORY.map(h => `<tr>
      <td>${esc(fmtDate(h.when))}</td><td>${esc(h.type)}</td><td>${esc(h.change)}</td>
      <td>${esc(h.to)}</td><td>${esc(staffName(h.by))}</td></tr>`).join('')
    || '<tr><td colspan="5" class="empty">No change recorded.</td></tr>';

  const bonuses = SE_PAYROLL_LINES.filter(l => l.bonus > 0);
  if(el('awBonusPill')) el('awBonusPill').textContent = num(bonuses.length) + ' bonuses';
  put('awBonusBox', bonuses.length ? bonuses.map(l => `<div class="risk">
      <div><div class="rn">${esc(seStaffName(l.staff))}</div>
        <div class="rs">Performance bonus on the ${esc(SE_OPEN_PERIOD.label)} payroll</div></div>
      <div class="rv">${esc(seM(l.bonus))}</div></div>`).join('')
    + `<div class="qhint" style="margin-top:6px">${seM(sum(bonuses, l => l.bonus))} in total, paid with the payroll.</div>`
    : '<div class="qhint">No bonus has been approved for this period.</div>');

  put('awGrid',
    chartBox({title: 'Allowances by type', sub: 'This month, MWK', type: 'bar', h: 200,
      cats: byType.map(t => t.type.split(' ')[0]),
      series: [{name: 'Cost', data: byType.map(t => t.total)}],
      value: compact(sum(lines, l => l.amount))}) +
    chartBox({title: 'Who receives an allowance', sub: 'Staff by allowance', type: 'donut', h: 200,
      cats: byType.map(t => t.type.split(' ')[0]),
      series: [{name: 'Staff', data: byType.map(t => t.people)}],
      value: num(new Set(lines.map(l => l.staff)).size)}));
  return byType;
}
</script>
