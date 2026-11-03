<script>
/* ============================================================
   SALARIES, EXPENSES & OPERATING CHARGES (5/8)
   Sections 5–8: salary deductions and statutory items, staff
   payslips, expense claims, and the business operating expenses.
   ============================================================ */

const SE_DEDUCTION_HISTORY = SE_DEDUCTIONS.map((d, i) => ({
  when: addDays(TODAY, -(4 + i * 5)), type: d.type,
  change: i % 3 === 0 ? 'Rate changed' : i % 3 === 1 ? 'Remittance made' : 'Rule confirmed',
  from: i % 3 === 0 ? 'Statutory band' : 'Scheduled', to: i % 3 === 0 ? 'Current band' : 'Settled',
  by: 'STF-007', lane: 'Deductions', severity: 'Low', owner: 'STF-007', region: 'Lilongwe'
}));

/* ===================== 5 · DEDUCTIONS AND STATUTORY ITEMS ===================== */
function renderDeductions(){
  const s = seStats();
  const overdue = SE_STATUTORY.filter(x => x.status === 'Overdue');
  if(el('ddPill')){ el('ddPill').className = 'badge ' + (overdue.length ? 'b-crit' : 'b-ok');
    el('ddPill').textContent = overdue.length ? overdue.length + ' overdue remittance' : 'Statutory up to date'; }
  put('ddKpis', [
    ['Deduction types', num(SE_DEDUCTIONS.length), 'Statutory and authorised', ''],
    ['PAYE', seM(s.paye), 'Income tax on every salary', ''],
    ['Pension — employee', seM(s.pension), SE_SET.pensionEmployeePct + '% of basic', ''],
    ['Pension — employer', seM(s.employerPension), SE_SET.pensionEmployerPct + '% on top of basic', ''],
    ['NHIMA', seM(s.nhima), SE_SET.nhimaEmployeePct + '% employee, matched by the employer', ''],
    ['Loan recoveries', seM(sum(SE_SALARIES, x => x.loanDeduction)), num(SE_SALARIES.filter(x => x.loanDeduction > 0).length) + ' staff on a loan', ''],
    ['Salary advances', seM(sum(SE_SALARIES, x => x.advance)), num(SE_SALARIES.filter(x => x.advance > 0).length) + ' advances running', ''],
    ['Statutory overdue', num(overdue.length), seM(sum(overdue, x => x.amount)) + ' to remit', overdue.length ? 'red' : '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join(''));

  if(el('ddTypePill')) el('ddTypePill').textContent = seM(sum(SE_DEDUCTIONS, d => d.amount)) + ' a month';
  renderTable('ddTypeBody', [
    {k: 'type', label: 'Deduction'},
    {k: 'basis', label: 'Basis', html: v => badge(v, v === 'Statutory' ? 'b-warn' : 'b-gray')},
    {k: 'rule', label: 'Rule'},
    {k: 'remitTo', label: 'Remitted to'},
    {k: 'frequency', label: 'Frequency'},
    {k: 'amount', label: 'This month', num: true, html: v => esc(seM(v))},
    {k: 'status', label: 'State', html: v => okb(v)}
  ], SE_DEDUCTIONS.filter(sePass), {sort: 'amount', pageSize: 7});

  put('ddRuleBox', SE_DEDUCTION_RULES.map(r => `<div class="risk">
      <div><div class="rn">${esc(r.rule)}</div><div class="rs">${esc(r.detail)}</div></div>
      <div class="rv">${okb(r.status)}</div></div>`).join(''));
  put('ddApprBox', [
    ['Prepared by', 'Payroll Officer · ' + staffName('STF-007')],
    ['Checked by', 'Finance Manager · ' + staffName('STF-003')],
    ['Approved by', 'Administrator · ' + staffName('STF-009')],
    ['Second signature', 'Required above ' + seM(SE_SET.highValueApproval)],
    ['Schedule state', okb(overdue.length ? 'Review' : 'Approved')]
  ].map(([k, v]) => kvRow(k, typeof v === 'string' ? esc(v) : v)).join(''));

  seFillSel('ddStaff', SE_STAFF.map(x => [x.id, x.id + ' · ' + x.name]));
  const pick = SE_SEL.dedStaff || (SE_STAFF[0] || {}).id;
  SE_SEL.dedStaff = pick;
  if(el('ddStaff')) el('ddStaff').value = pick;
  const sal = seSalOf(pick) || {};
  if(el('ddSlipPill')) el('ddSlipPill').textContent = sal.id || '—';
  put('ddSlipBox', sal.id ? kvRow('Staff member', esc(seStaffName(pick)))
    + kvRow('Basic', seM(sal.basic)) + kvRow('Gross', seM(sal.gross))
    + kvRow('PAYE', '− ' + seM(sal.paye)) + kvRow('Pension', '− ' + seM(sal.pension))
    + kvRow('NHIMA', '− ' + seM(sal.nhima)) + kvRow('Loan recovery', '− ' + seM(sal.loanDeduction))
    + kvRow('Salary advance', '− ' + seM(sal.advance))
    + kvRow('Net pay', '<b>' + seM(sal.net) + '</b>')
    + `<div class="qhint" style="margin-top:6px">Deductions are ${Math.round(pct(sal.deductions, sal.gross))}% of gross. No deduction may exceed a third of gross except a statutory one.</div>`
    : '<div class="empty">This staff member has no salary record.</div>');

  if(el('ddStatPill')) el('ddStatPill').textContent = num(overdue.length) + ' overdue';
  renderTable('ddStatBody', [
    {k: 'id', label: 'Record'},
    {k: 'item', label: 'Item'},
    {k: 'period', label: 'Period', html: v => esc(monthLabel(v))},
    {k: 'body', label: 'Body'},
    {k: 'amount', label: 'Amount', num: true, html: v => esc(seM(v))},
    {k: 'due', label: 'Due', html: v => esc(fmtDate(v))},
    {k: 'paid', label: 'Paid', html: v => v ? esc(fmtDate(v)) : '—'},
    {k: 'status', label: 'State', html: v => okb(v)}
  ], SE_STATUTORY, {sort: 'due', pageSize: 6});

  if(el('ddStatBox') && !String(el('ddStatBox').innerHTML || '').trim())
    el('ddStatBox').innerHTML = '<div class="qhint">Remitting writes a receipt reference on every outstanding item and a row to the deduction history.</div>';
  const onLoan = SE_SALARIES.filter(x => x.loanDeduction > 0 || x.advance > 0);
  if(el('ddLoanPill')) el('ddLoanPill').textContent = num(onLoan.length) + ' staff';
  renderTable('ddLoanBody', [
    {k: 'staff', label: 'Staff member', html: v => esc(seStaffName(v))},
    {k: 'basic', label: 'Basic', num: true, html: v => esc(seM(v))},
    {k: 'loanDeduction', label: 'Loan', num: true, html: v => esc(v ? seM(v) : '—')},
    {k: 'advance', label: 'Advance', num: true, html: v => esc(v ? seM(v) : '—')},
    {k: 'net', label: 'Net after', num: true, html: v => esc(seM(v))}
  ], onLoan, {sort: 'loanDeduction', pageSize: 6});

  if(el('ddHistPill')) el('ddHistPill').textContent = num(SE_DEDUCTION_HISTORY.length) + ' entries';
  renderTable('ddHistBody', [
    {k: 'when', label: 'When', html: v => esc(fmtDate(v))},
    {k: 'type', label: 'Deduction'},
    {k: 'change', label: 'Change'},
    {k: 'to', label: 'Now'},
    {k: 'by', label: 'Officer', html: v => esc(staffName(v))}
  ], SE_DEDUCTION_HISTORY.slice(), {sort: 'when', pageSize: 6});

  put('ddGrid',
    chartBox({title: 'What is taken from the payroll', sub: 'This month, MWK', type: 'donut', h: 200,
      cats: ['PAYE', 'Pension', 'NHIMA', 'Loan', 'Advance'],
      series: [{name: 'Deduction', data: [s.paye, s.pension, s.nhima,
        sum(SE_SALARIES, x => x.loanDeduction), sum(SE_SALARIES, x => x.advance)]}],
      value: compact(s.deductionTotal)}) +
    chartBox({title: 'Statutory remittances', sub: 'Due against what is settled', type: 'bar', h: 200,
      cats: ['PAYE', 'Pension', 'NHIMA'],
      series: [{name: 'Due', data: ['PAYE', 'Pension', 'NHIMA'].map(i => sum(SE_STATUTORY.filter(x => x.item === i), x => x.amount))},
        {name: 'Paid', data: ['PAYE', 'Pension', 'NHIMA'].map(i => sum(SE_STATUTORY.filter(x => x.item === i && x.status === 'Paid'), x => x.amount)), colour: '#1E9E6A'}],
      value: compact(sum(SE_STATUTORY, x => x.amount))}));
}

function seRemitStatutory(){
  const open = SE_STATUTORY.filter(x => x.status !== 'Paid');
  if(!open.length){ toast('Every statutory item is already remitted', 'ok'); return; }
  open.forEach((x, i) => {
    x.status = 'Paid'; x.paid = TODAY; x.reference = x.item.slice(0, 3).toUpperCase() + '-R' + pad(9100 + i, 4);
    SE_DEDUCTION_HISTORY.unshift({when: TODAY, type: x.item, change: 'Remittance made', from: 'Outstanding',
      to: x.reference, by: 'STF-007', lane: 'Deductions', severity: 'Low', owner: 'STF-007', region: 'Lilongwe'});
  });
  seAudit('Remit statutory items', open.map(x => x.id).join(', '), open.length + ' items remitted');
  put('ddStatBox', `<div class="note gray"><div>${esc(open.map(x => x.item + ' ' + x.reference).join(' · '))} remitted on ${esc(fmtDate(TODAY))}. Total ${esc(seM(sum(open, x => x.amount)))}.</div></div>`);
  renderAll();
  toast(open.length + ' statutory items remitted');
}
function seStatutoryReport(){
  const cols = [['Record', 'id'], ['Item', 'item'], ['Period', 'period'], ['Body', 'body'],
    ['Amount', 'amount'], ['Due', 'due'], ['Paid', 'paid'], ['Reference', 'reference'], ['State', 'status']];
  const rows = SE_STATUTORY.map(x => ({id: x.id, item: x.item, period: monthLabel(x.period), body: x.body,
    amount: seM(x.amount), due: fmtDate(x.due), paid: x.paid ? fmtDate(x.paid) : '—', reference: x.reference || '—', status: x.status}));
  downloadFile('statutory-deductions-' + TODAY.replace(/-/g, '') + '.csv', 'text/csv',
    toCsv([cols.map(c => c[0])].concat(rows.map(r => cols.map(c => r[c[1]])))));
  logExport('Statutory Deductions Report', 'CSV', rows.length);
  openModal('Statutory Deductions Report', rows.length + ' rows · ' + filterLine(),
    `<div class="tblwrap" style="max-height:320px"><table class="tbl2 dense"><thead><tr>${cols.map(c => `<th>${esc(c[0])}</th>`).join('')}</tr></thead>
      <tbody>${rows.map(r => `<tr>${cols.map(c => `<td>${esc(r[c[1]])}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`,
    [{label: 'Print', act: () => printTable('Statutory Deductions Report', cols.map(c => ({label: c[0]})), rows.map(r => cols.map(c => r[c[1]])))},
     {label: 'Close', act: 'close'}]);
  renderExportHistory();
  toast('Statutory report built');
}

/* ===================== 6 · STAFF PAYSLIPS ===================== */
function sePayslipFor(period, staff){
  return SE_PAYSLIPS.find(p => p.period === period && p.staff === staff);
}
function seBuildPayslip(){
  const period = el('psPeriod').value || SE_OPEN_PERIOD.period;
  const staff = el('psStaff').value || (SE_STAFF[0] || {}).id;
  const sal = seSalOf(staff);
  if(!sal){ toast('That staff member has no salary record', 'err'); return; }
  const payroll = SE_PAYROLL.find(p => p.period === period) || SE_OPEN_PERIOD;
  const existing = sePayslipFor(period, staff);
  if(existing){
    SE_SEL.payslip = existing.id;
    el('psBox').innerHTML = sePayslipHtml(existing);
    el('psMsg').textContent = 'Payslip ' + existing.id + ' already exists for ' + monthLabel(period) + '.';
    toast('Payslip ' + existing.id + ' found in the register');
    renderPayslips();
    return;
  }
  const id = 'PSP-' + period.slice(2, 4) + period.slice(5, 7) + '-' + pad(SE_PAYSLIPS.length + 1, 3);
  const rec = {
    id, period, payroll: payroll.id, staff, gross: sal.gross, allowances: sal.allowanceTotal, bonus: 0,
    paye: sal.paye, pension: sal.pension, nhima: sal.nhima, other: sal.loanDeduction + sal.advance,
    net: sal.net, paidOn: payroll.payDate, reference: 'PAY-' + pad(6200 + SE_PAYSLIPS.length, 5),
    status: payroll.status === 'Paid' ? 'Issued' : 'Draft', delivery: 'Portal',
    lane: 'Payslips', severity: 'Low', owner: 'STF-007', region: sal.region
  };
  SE_PAYSLIPS.unshift(rec);
  SE_SEL.payslip = id;
  seAudit('Generate payslip', id, monthLabel(period) + ' for ' + seStaffName(staff));
  el('psBox').innerHTML = sePayslipHtml(rec);
  el('psMsg').textContent = 'Payslip ' + id + ' built for ' + seStaffName(staff) + ' · ' + monthLabel(period) + '.';
  renderAll();
  toast('Payslip ' + id + ' generated');
}
function sePayslipHtml(p){
  const sal = seSalOf(p.staff) || {};
  const st = SE_STAFF_BY_ID[p.staff] || {};
  return `<div class="slip">
    <div class="sliphead"><div><b>GOLDEN FINANCIAL SERVICES</b><div class="qhint">Lilongwe · Malawi</div></div>
      <div style="text-align:right"><b>PAYSLIP</b><div class="qhint">${esc(monthLabel(p.period))}</div></div></div>
    <div class="pfields">
      ${field('Staff member', esc(seStaffName(p.staff)))}
      ${field('Employee number', esc(p.staff))}
      ${field('Role', esc(st.role || '—'))}
      ${field('Department', esc(st.dept || '—'))}
      ${field('Bank', esc(sal.bank || '—'))}
      ${field('Tax number', esc(sal.taxId || '—'))}
    </div>
    <table class="slipcalc">
      <tr><td>Basic salary</td><td class="num">${esc(seM(sal.basic || 0))}</td></tr>
      <tr><td>Allowances</td><td class="num">${esc(seM(p.allowances))}</td></tr>
      <tr><td>Bonus</td><td class="num">${esc(seM(p.bonus))}</td></tr>
      <tr class="sep"><td>Gross pay</td><td class="num">${esc(seM(p.gross + p.bonus))}</td></tr>
      <tr><td>PAYE</td><td class="num">− ${esc(seM(p.paye))}</td></tr>
      <tr><td>Pension (employee)</td><td class="num">− ${esc(seM(p.pension))}</td></tr>
      <tr><td>NHIMA</td><td class="num">− ${esc(seM(p.nhima))}</td></tr>
      <tr><td>Loan and advance recovery</td><td class="num">− ${esc(seM(p.other))}</td></tr>
      <tr class="sep"><td><b>Net pay</b></td><td class="num"><b>${esc(seM(p.net))}</b></td></tr>
      <tr><td>Employer pension</td><td class="num">${esc(seM(SE_OPEN_PERIOD.employerPension))}</td></tr>
    </table>
    <div class="qhint">Paid ${esc(fmtDate(p.paidOn))} · reference ${esc(p.reference)} · ${esc(p.status)} · delivered ${esc(p.delivery)}</div>
  </div>`;
}
function renderPayslips(){
  const s = seStats();
  const issued = SE_PAYSLIPS.filter(p => p.status === 'Issued').length;
  if(el('psPill')){ el('psPill').className = 'badge b-ok'; el('psPill').textContent = num(issued) + ' issued'; }
  put('psKpis', [
    ['Payslips on file', num(SE_PAYSLIPS.length), 'Every period, every employee', ''],
    ['Issued', num(issued), 'Downloadable by the employee', ''],
    ['Drafts', num(SE_PAYSLIPS.filter(p => p.status === 'Draft').length), 'Waiting for the payroll', ''],
    ['Corrections', num(SE_PAYSLIP_CORRECTIONS.length), 'Reissued after a fix', ''],
    ['Delivered by portal', num(SE_PAYSLIPS.filter(p => p.delivery === 'Portal').length), 'Self-service', ''],
    ['Emailed', num(SE_PAYSLIPS.filter(p => p.delivery === 'Emailed').length), 'Sent to the staff mailbox', ''],
    ['Periods covered', num(new Set(SE_PAYSLIPS.map(p => p.period)).size), 'Six months of records', ''],
    ['Who may read one', num(SE_PAYSLIP_PERMS.length) + ' roles', 'Every download is logged', '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join(''));

  seFillSel('psPeriod', SE_PAYROLL.map(p => [p.period, p.label + ' · ' + p.status]));
  seFillSel('psStaff', seStaffOptions());
  if(el('psMsg') && !String(el('psMsg').textContent || '').trim())
    el('psMsg').textContent = 'Pick a period and a staff member. A payslip is issued only once the payroll has been paid.';

  const current = SE_PAYSLIPS.find(p => p.id === SE_SEL.payslip) || SE_PAYSLIPS[0];
  if(current){
    SE_SEL.payslip = current.id;
    if(el('psBox')) el('psBox').innerHTML = sePayslipHtml(current);
  }

  if(el('psCount')) el('psCount').textContent = num(SE_PAYSLIPS.length) + ' payslips';
  const list = SE_PAYSLIPS.filter(sePass).slice().sort((a, b) => (b.period + b.id).localeCompare(a.period + a.id));
  list.forEach(r => { r._open = () => { SE_SEL.payslip = r.id; renderPayslips(); seRecordModal(r, r.id + ' · ' + seStaffName(r.staff)); }; });
  renderTable('psBody', [
    {k: 'id', label: 'Payslip'},
    {k: 'period', label: 'Period', html: v => esc(monthLabel(v))},
    {k: 'staff', label: 'Staff member', html: v => esc(seStaffName(v))},
    {k: 'gross', label: 'Gross', num: true, html: v => esc(seM(v))},
    {k: 'net', label: 'Net', num: true, html: v => esc(seM(v))},
    {k: 'delivery', label: 'Delivered'},
    {k: 'status', label: 'State', html: v => okb(v)}
  ], list, {sort: 'period', pageSize: 8});

  if(el('psCorrPill')) el('psCorrPill').textContent = num(SE_PAYSLIP_CORRECTIONS.length) + ' corrections';
  renderTable('psCorrBody', [
    {k: 'id', label: 'Correction'},
    {k: 'payslip', label: 'Payslip'},
    {k: 'field', label: 'Field'},
    {k: 'from', label: 'Was'},
    {k: 'to', label: 'Now'},
    {k: 'status', label: 'State', html: v => okb(v)}
  ], SE_PAYSLIP_CORRECTIONS, {sort: 'when', pageSize: 4});
  renderTable('psPermBody', [
    {k: 'role', label: 'Role'},
    {k: 'scope', label: 'What they see'},
    {k: 'format', label: 'Format'},
    {k: 'reason', label: 'Why'}
  ], SE_PAYSLIP_PERMS, {sort: 'role', pageSize: 5});

  if(el('psDelPill')) el('psDelPill').textContent = num(SE_PAYSLIPS.filter(p => p.status === 'Issued').length) + ' delivered';
  renderTable('psDelBody', [
    {k: 'id', label: 'Payslip'},
    {k: 'staff', label: 'Staff member', html: v => esc(seStaffName(v))},
    {k: 'delivery', label: 'Channel'},
    {k: 'paidOn', label: 'Sent', html: v => esc(fmtDate(v))},
    {k: 'reference', label: 'Payment reference'},
    {k: 'status', label: 'State', html: v => okb(v)}
  ], SE_PAYSLIPS.filter(p => p.status === 'Issued'), {sort: 'paidOn', pageSize: 8});
  if(el('psRuleBox')) el('psRuleBox').innerHTML = SE_PAYSLIP_RULES.map(r => `<div>· ${esc(r)}</div>`).join('');

  put('psGrid',
    chartBox({title: 'Payslips by period', sub: 'How many were issued', type: 'bar', h: 200,
      cats: SE_PAYROLL.map(p => p.label),
      series: [{name: 'Payslips', data: SE_PAYROLL.map(p => SE_PAYSLIPS.filter(x => x.period === p.period).length)}],
      value: num(SE_PAYSLIPS.length)}) +
    chartBox({title: 'Net pay against deductions', sub: 'Every payslip on file', type: 'donut', h: 200,
      cats: ['Net pay', 'PAYE', 'Pension', 'NHIMA', 'Other'],
      series: [{name: 'Split', data: [sum(SE_PAYSLIPS, p => p.net), sum(SE_PAYSLIPS, p => p.paye),
        sum(SE_PAYSLIPS, p => p.pension), sum(SE_PAYSLIPS, p => p.nhima), sum(SE_PAYSLIPS, p => p.other)]}],
      value: compact(sum(SE_PAYSLIPS, p => p.net))}));
}
function sePayslipPrint(){
  const p = SE_PAYSLIPS.find(x => x.id === SE_SEL.payslip) || SE_PAYSLIPS[0];
  if(!p){ toast('Build a payslip first', 'err'); return; }
  doPrint('Payslip ' + p.id, `<div style="font-family:Inter,Arial,sans-serif">${brandHtml('Payslip ' + p.id, monthLabel(p.period))}${sePayslipHtml(p)}</div>`);
  logExport('Payslip ' + p.id, 'PDF', 1);
  renderExportHistory();
  toast('Payslip ' + p.id + ' ready to print');
}
function sePayslipMail(){
  const p = SE_PAYSLIPS.find(x => x.id === SE_SEL.payslip) || SE_PAYSLIPS[0];
  if(!p){ toast('Build a payslip first', 'err'); return; }
  if(p.status !== 'Issued'){ toast('Only an issued payslip can be sent', 'err'); return; }
  p.delivery = 'Emailed';
  seAudit('Send payslip', p.id, 'Emailed to ' + seStaffName(p.staff));
  SE_NOTIFY_LOG.unshift({when: TODAY + ' ' + seNow(), event: 'Payslip issued', channel: 'Email', to: seStaffName(p.staff),
    reference: p.id, status: 'Delivered', lane: 'Notifications', severity: 'Low', owner: 'STF-007', region: 'Lilongwe'});
  renderAll();
  toast('Payslip ' + p.id + ' emailed to ' + seStaffName(p.staff));
}
function sePayslipRegister(){
  const cols = [['Payslip', 'id'], ['Period', 'period'], ['Staff', 'staff'], ['Gross', 'gross'], ['PAYE', 'paye'],
    ['Pension', 'pension'], ['NHIMA', 'nhima'], ['Net', 'net'], ['Paid on', 'paidOn'], ['Status', 'status']];
  const rows = SE_PAYSLIPS.map(p => ({id: p.id, period: monthLabel(p.period), staff: seStaffName(p.staff),
    gross: seM(p.gross), paye: seM(p.paye), pension: seM(p.pension), nhima: seM(p.nhima), net: seM(p.net),
    paidOn: fmtDate(p.paidOn), status: p.status}));
  downloadFile('payslip-register-' + TODAY.replace(/-/g, '') + '.csv', 'text/csv',
    toCsv([cols.map(c => c[0])].concat(rows.map(r => cols.map(c => r[c[1]])))));
  logExport('Payslip register', 'CSV', rows.length);
  renderExportHistory();
  toast(rows.length + ' payslips exported');
}

/* ===================== 7 · STAFF EXPENSE CLAIMS ===================== */
function seClaimItem(){
  return SE_CLAIMS.find(c => c.id === SE_SEL.claim) || SE_CLAIMS.find(c => c.status === 'Submitted') || SE_CLAIMS[0];
}
function renderClaims(){
  const rows = SE_CLAIMS.filter(sePass);
  const s = seStats();
  const pending = SE_CLAIMS.filter(c => ['Submitted', 'Pending approval'].includes(c.status));
  if(el('clPill')){ el('clPill').className = 'badge ' + (pending.length ? 'b-warn' : 'b-ok');
    el('clPill').textContent = pending.length + ' waiting for a decision'; }
  put('clKpis', [
    ['Claims on file', num(SE_CLAIMS.length), 'Every staff claim', ''],
    ['Awaiting a decision', num(pending.length), seM(sum(pending, c => c.amount)) + ' waiting', pending.length ? 'red' : ''],
    ['Approved', num(SE_CLAIMS.filter(c => c.status === 'Approved').length), 'Ready to reimburse', ''],
    ['Reimbursed', num(SE_CLAIMS.filter(c => c.status === 'Paid').length), seM(s.claimsPaid) + ' paid out', ''],
    ['Rejected', num(SE_CLAIMS.filter(c => c.status === 'Rejected').length), 'With the reason kept', ''],
    ['Returned for detail', num(SE_CLAIMS.filter(c => c.status === 'Returned').length), 'The employee must resubmit', ''],
    ['Above the receipt limit', num(SE_CLAIMS.filter(c => c.amount > SE_SET.receiptRequiredAbove).length), 'A receipt is required', ''],
    ['Missing a receipt', num(SE_CLAIMS.filter(c => c.receipt === 'None').length), 'Cannot be approved', '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join(''));

  seFillSel('clStaff', seStaffOptions());
  seFillSel('clCategory', SE_CLAIM_CATEGORIES.map(c => [c, c]));
  seFillSel('clDept', seDeptOptions());
  if(el('clDate') && !el('clDate').value) el('clDate').value = TODAY;
  if(el('clMsg') && !String(el('clMsg').textContent || '').trim())
    el('clMsg').textContent = 'A claim above ' + seM(SE_SET.receiptRequiredAbove) + ' needs a receipt. The limit is ' + seM(SE_SET.claimLimit) + ' per claim.';

  if(el('clCount')) el('clCount').textContent = num(rows.length) + ' claims';
  const list = rows.slice().sort((a, b) => String(b.when).localeCompare(String(a.when)));
  list.forEach(r => { r._open = () => { SE_SEL.claim = r.id; renderClaims(); seRecordModal(r, r.id + ' · ' + seStaffName(r.staff)); }; });
  renderTable('clBody', [
    {k: 'id', label: 'Claim'},
    {k: 'staff', label: 'Staff member', html: v => esc(seStaffName(v))},
    {k: 'when', label: 'Date', html: v => esc(fmtDate(v))},
    {k: 'category', label: 'Category'},
    {k: 'amount', label: 'Amount', num: true, html: v => esc(seM(v))},
    {k: 'receipt', label: 'Receipt', html: v => v === 'None' ? badge('Missing', 'b-crit') : badge('Attached', 'b-ok')},
    {k: 'status', label: 'State', html: v => okb(v)}
  ], list, {sort: 'when', pageSize: 9});

  const sel = seClaimItem();
  if(sel) SE_SEL.claim = sel.id;
  if(el('clSelPill')) el('clSelPill').textContent = sel ? sel.id : '—';
  put('clDetail', sel ? kvRow('Claim', esc(sel.id)) + kvRow('Staff member', esc(seStaffName(sel.staff)))
    + kvRow('Department', esc(sel.dept)) + kvRow('Project', esc(sel.project || 'Operations'))
    + kvRow('Date', esc(fmtDate(sel.when))) + kvRow('Category', esc(sel.category))
    + kvRow('Description', esc(sel.description)) + kvRow('Amount', seM(sel.amount))
    + kvRow('Receipt', sel.receipt === 'None' ? badge('Missing', 'b-crit') : esc(sel.receipt))
    + kvRow('State', okb(sel.status))
    + kvRow('Approved by', sel.approvedBy ? esc(staffName(sel.approvedBy)) : '—')
    + (sel.notes ? kvRow('Notes', esc(sel.notes)) : '')
    : '<div class="empty">No claim matches the current filters.</div>');
  if(el('clNotes')) el('clNotes').placeholder = sel && sel.notes ? sel.notes : 'Why the decision was taken';

  const paid = SE_CLAIMS.filter(c => c.status === 'Paid');
  if(el('clHistPill')) el('clHistPill').textContent = num(paid.length) + ' reimbursed';
  renderTable('clHistBody', [
    {k: 'id', label: 'Claim'},
    {k: 'staff', label: 'Staff member', html: v => esc(seStaffName(v))},
    {k: 'amount', label: 'Amount', num: true, html: v => esc(seM(v))},
    {k: 'paidOn', label: 'Paid on', html: v => esc(fmtDate(v))},
    {k: 'reference', label: 'Reference'}
  ], paid, {sort: 'paidOn', pageSize: 7});

  put('clGrid',
    chartBox({title: 'Claims by category', sub: 'What staff claim for', type: 'bar', h: 200,
      cats: SE_CLAIM_CATEGORIES.slice(0, 6).map(c => c.split(' ')[0]),
      series: [{name: 'Claimed', data: SE_CLAIM_CATEGORIES.slice(0, 6).map(c => sum(SE_CLAIMS.filter(x => x.category === c), x => x.amount))}],
      value: compact(sum(SE_CLAIMS, c => c.amount))}) +
    chartBox({title: 'Claims by state', sub: 'Where every claim stands', type: 'donut', h: 200,
      cats: ['Submitted', 'Pending approval', 'Approved', 'Paid', 'Rejected', 'Returned'],
      series: [{name: 'Claims', data: ['Submitted', 'Pending approval', 'Approved', 'Paid', 'Rejected', 'Returned']
        .map(st => SE_CLAIMS.filter(c => c.status === st).length)}],
      value: num(SE_CLAIMS.length)}));
}
function seClaimSubmit(){
  const staff = el('clStaff').value, cat = el('clCategory').value;
  const amount = Number(el('clAmount').value) || 0;
  const hasReceipt = el('clReceipt').value === 'Yes';
  if(!staff || !cat){ toast('Pick a staff member and a category', 'err'); return; }
  if(amount <= 0){ toast('A claim needs a positive amount', 'err'); return; }
  if(amount > SE_SET.claimLimit){ toast('The claim limit is ' + seM(SE_SET.claimLimit), 'err'); return; }
  if(amount > SE_SET.receiptRequiredAbove && !hasReceipt){
    el('clMsg').textContent = 'A claim of ' + seM(amount) + ' is above the receipt limit — attach the receipt first.';
    toast('A receipt is required above ' + seM(SE_SET.receiptRequiredAbove), 'err'); return;
  }
  const st = SE_STAFF_BY_ID[staff] || {};
  const rec = {id: SE_SET.claimPrefix + '-' + pad(5400 + SE_CLAIMS.length, 4), staff, dept: st.dept || el('clDept').value,
    when: el('clDate').value || TODAY, category: cat, description: el('clDescription').value.trim() || cat,
    amount, receipt: hasReceipt ? 'REC-' + pad(8900 + SE_CLAIMS.length, 4) + '.pdf' : 'None',
    project: el('clProject').value, status: 'Submitted', notes: '', approvedBy: '',
    paidOn: '', reference: '', submitted: el('clDate').value || TODAY,
    lane: 'Claims', severity: amount > SE_SET.claimLimit * 0.8 ? 'High' : 'Low', owner: 'STF-007', region: st.region || 'Lilongwe'};
  SE_CLAIMS.unshift(rec);
  SE_SEL.claim = rec.id;
  seAudit('Submit expense claim', rec.id, seM(amount) + ' · ' + cat + ' · ' + seStaffName(staff));
  el('clMsg').textContent = 'Claim ' + rec.id + ' submitted for ' + seStaffName(staff) + ' · ' + seM(amount) + '.';
  el('clDescription').value = '';
  renderAll();
  toast('Claim ' + rec.id + ' submitted');
}
function seClaimAction(act){
  const c = SE_CLAIMS.find(x => x.id === SE_SEL.claim);
  if(!c){ toast('Pick a claim first', 'err'); return; }
  const note = (el('clNotes').value || '').trim();
  if(act === 'approve'){
    if(c.receipt === 'None' && c.amount > SE_SET.receiptRequiredAbove){
      toast('No receipt — this claim cannot be approved', 'err');
      c.notes = 'Approval refused: the receipt is missing'; renderClaims(); return;
    }
    if(c.amount > SE_SET.claimLimit){ toast('Above the claim limit — send it for a second signature', 'err'); return; }
    c.status = 'Approved'; c.approvedBy = 'STF-009'; c.notes = note || 'Approved within the limit';
  } else if(act === 'reject'){
    if(!note){ toast('A rejection needs a reason', 'err'); return; }
    c.status = 'Rejected'; c.notes = note;
  } else if(act === 'return'){
    c.status = 'Returned'; c.notes = note || 'Resubmit with the missing detail';
  } else if(act === 'pay'){
    if(c.status !== 'Approved'){ toast('Only an approved claim can be reimbursed', 'err'); return; }
    c.status = 'Paid'; c.paidOn = TODAY; c.reference = 'PAY-' + pad(6300 + SE_CLAIMS.indexOf(c), 5);
  }
  seAudit('Claim ' + act, c.id, seM(c.amount) + ' · ' + c.status + (note ? ' · ' + note : ''));
  el('clNotes').value = '';
  renderAll();
  toast(c.id + ' is now ' + c.status);
}

/* ===================== 8 · BUSINESS OPERATING EXPENSES ===================== */
function seExpenseItem(){
  return SE_EXPENSES.find(e => e.id === SE_SEL.expense) || SE_EXPENSES[0];
}
function renderExpenses(){
  const rows = SE_EXPENSES.filter(sePass);
  const s = seStats();
  const thisMonth = seExpThisMonth;
  const byCat = SE_CATEGORIES.map(c => {
    const list = SE_EXPENSES.filter(e => e.category === c.name);
    const month = thisMonth.filter(e => e.category === c.name);
    return {name: c.name, type: c.type, classification: c.classification, limit: c.limit,
      spent: sum(month, e => e.amount), year: sum(list, e => e.amount), count: month.length,
      remaining: c.limit - sum(month, e => e.amount),
      status: sum(month, e => e.amount) > c.limit ? 'Over budget' : sum(month, e => e.amount) > c.limit * 0.9 ? 'At the limit' : 'Within budget'};
  });
  if(el('bxPill')){ el('bxPill').className = 'badge b-warn'; el('bxPill').textContent = num(rows.length) + ' expenses'; }
  put('bxKpis', [
    ['Expenses on file', num(SE_EXPENSES.length), 'Six months of operating spend', ''],
    ['This month', seM(s.expensesThisMonth), num(thisMonth.length) + ' invoices', ''],
    ['Paid', seM(sum(SE_EXPENSES.filter(e => e.status === 'Paid'), e => e.amount)), num(SE_EXPENSES.filter(e => e.status === 'Paid').length) + ' settled', ''],
    ['Awaiting approval', num(SE_EXPENSES.filter(e => e.status === 'Pending approval').length), seM(sum(SE_EXPENSES.filter(e => e.status === 'Pending approval'), e => e.amount)) + ' waiting', ''],
    ['Overdue', num(SE_EXPENSES.filter(e => e.status === 'Overdue').length), seM(sum(SE_EXPENSES.filter(e => e.status === 'Overdue'), e => e.amount)) + ' past the due date', 'red'],
    ['Categories', num(SE_CATEGORIES.length), 'From rent to marketing', ''],
    ['Over its limit', num(byCat.filter(c => c.status === 'Over budget').length), 'Categories spending too much', 'red'],
    ['Cost centres', num(SE_DEPARTMENTS.length), 'Every expense is allocated', '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join(''));

  seFillSel('bxCategory', seCategoryOptions());
  seFillSel('bxSupplier', seSupplierOptions());
  seFillSel('bxDept', seDeptOptions());
  if(el('bxDate') && !el('bxDate').value) el('bxDate').value = TODAY;
  if(el('bxMsg') && !String(el('bxMsg').textContent || '').trim())
    el('bxMsg').textContent = 'Every expense is charged to a category, a department and its cost centre, and it shows up in the ledger.';

  if(el('bxCatPill')) el('bxCatPill').textContent = num(byCat.length) + ' categories';
  renderTable('bxCatBody', [
    {k: 'name', label: 'Category'},
    {k: 'type', label: 'Type'},
    {k: 'limit', label: 'Monthly limit', num: true, html: v => esc(seM(v))},
    {k: 'spent', label: 'Spent', num: true, html: v => esc(seM(v))},
    {k: 'remaining', label: 'Left', num: true, html: v => esc(seM(v))},
    {k: 'count', label: 'Invoices', num: true},
    {k: 'status', label: 'State', html: v => okb(v)}
  ], byCat, {sort: 'spent', pageSize: 8});

  if(el('bxCount')) el('bxCount').textContent = num(rows.length) + ' invoices';
  const list = rows.slice().sort((a, b) => String(b.when).localeCompare(String(a.when)));
  list.forEach(r => { r._open = () => { SE_SEL.expense = r.id; renderExpenses(); seRecordModal(r, r.id + ' · ' + r.invoice); }; });
  renderTable('bxBody', [
    {k: 'id', label: 'Record'},
    {k: 'when', label: 'Date', html: v => esc(fmtDate(v))},
    {k: 'category', label: 'Category'},
    {k: 'supplier', label: 'Supplier'},
    {k: 'dept', label: 'Department'},
    {k: 'amount', label: 'Amount', num: true, html: v => esc(seM(v))},
    {k: 'status', label: 'State', html: v => okb(v)}
  ], list, {sort: 'when', pageSize: 9});

  const sel = seExpenseItem();
  if(sel) SE_SEL.expense = sel.id;
  if(el('bxSelPill')) el('bxSelPill').textContent = sel ? sel.id : '—';
  put('bxDetail', sel ? kvRow('Record', esc(sel.id)) + kvRow('Invoice', esc(sel.invoice))
    + kvRow('Category', esc(sel.category)) + kvRow('Type', esc(sel.type))
    + kvRow('Classification', esc(sel.classification)) + kvRow('Supplier', esc(sel.supplier))
    + kvRow('Department', esc(sel.dept)) + kvRow('Cost centre', esc(sel.costCentre))
    + kvRow('Date', esc(fmtDate(sel.when))) + kvRow('Amount', seM(sel.amount))
    + kvRow('Reference', sel.reference ? esc(sel.reference) : badge('Not paid', 'b-warn'))
    + kvRow('State', okb(sel.status))
    : '<div class="empty">No expense matches the current filters.</div>');
  if(el('bxReceiptBox') && !String(el('bxReceiptBox').innerHTML || '').trim())
    el('bxReceiptBox').innerHTML = '<div class="qhint">Press “Show the invoice” to see the supplier document for the selected expense.</div>';

  put('bxGrid',
    chartBox({title: 'Spend by category', sub: 'This month, MWK', type: 'bar', h: 200,
      cats: byCat.slice(0, 6).map(c => c.name.split(' ')[0]),
      series: [{name: 'Spent', data: byCat.slice(0, 6).map(c => c.spent)}],
      value: compact(s.expensesThisMonth)}) +
    chartBox({title: 'Six months of operating spend', sub: 'Every expense recorded', type: 'line', h: 200,
      cats: SE_EXPENSE_MONTHS.map(m => monthLabel(m)),
      series: [{name: 'Spend', data: SE_EXPENSE_MONTHS.map(m => sum(SE_EXPENSES.filter(e => e.month === m), e => e.amount)), colour: '#C9A227'}],
      value: compact(SE_EXPENSE_TOTAL)}));
}
function seExpenseAdd(){
  const cat = el('bxCategory').value, amount = Number(el('bxAmount').value) || 0;
  const supplier = el('bxSupplier').value, dept = el('bxDept').value;
  const c = SE_CATEGORIES.find(x => x.name === cat);
  if(!cat || !supplier){ toast('Pick a category and a supplier', 'err'); return; }
  if(amount <= 0){ toast('The amount must be positive', 'err'); return; }
  const when = el('bxDate').value || TODAY;
  const rec = {id: SE_SET.expensePrefix + '-' + pad(7500 + SE_EXPENSES.length, 4), month: when.slice(0, 7),
    category: cat, type: c ? c.type : 'Other approved expense', classification: c ? c.classification : 'Operating',
    dept, costCentre: (SE_DEPARTMENTS.find(d => d.name === dept) || {}).costCentre || 'CC-100',
    supplier: seSupplierName(supplier), when, amount,
    invoice: (el('bxInvoice').value || '').trim().toUpperCase() || 'INV-' + pad(4900 + SE_EXPENSES.length, 4),
    status: 'Pending approval', reference: '',
    lane: 'Expenses', severity: c && amount > c.limit ? 'Medium' : 'Low', owner: 'STF-007', region: 'Lilongwe'};
  SE_EXPENSES.unshift(rec);
  SE_SEL.expense = rec.id;
  seAudit('Record operating expense', rec.id, seM(amount) + ' · ' + cat + ' · ' + rec.supplier);
  el('bxMsg').textContent = 'Expense ' + rec.id + ' recorded against ' + cat + ' for ' + seM(amount) + '. It is waiting for approval.';
  el('bxDescription').value = '';
  renderAll();
  toast('Expense ' + rec.id + ' recorded');
}
function seSupplierName(id){
  const s = SE_SUP_BY_ID[id];
  return s ? s.name : String(id).replace(/^SUP-\d+\s*·\s*/, '');
}
function seExpenseAction(act){
  const e = SE_EXPENSES.find(x => x.id === SE_SEL.expense);
  if(!e){ toast('Pick an expense first', 'err'); return; }
  if(act === 'approve'){
    if(e.status === 'Paid'){ toast('This expense is already paid', 'err'); return; }
    e.status = 'Approved';
  } else if(act === 'pay'){
    if(e.status !== 'Approved'){ toast('Approve it before marking it paid', 'err'); return; }
    e.status = 'Paid'; e.reference = 'PAY-' + pad(6900 + SE_EXPENSES.indexOf(e), 5);
  } else if(act === 'receipt'){
    put('bxReceiptBox', `<div class="receiptdoc">
      <div class="sliphead"><div><b>${esc(e.supplier)}</b><div class="qhint">Supplier invoice</div></div>
        <div style="text-align:right"><b>${esc(e.invoice)}</b><div class="qhint">${esc(fmtDate(e.when))}</div></div></div>
      <div class="pfields">${field('Category', esc(e.category))}${field('Department', esc(e.dept))}
        ${field('Cost centre', esc(e.costCentre))}${field('Amount', esc(seM(e.amount)))}</div>
      <div class="qhint">Billed to Golden Financial Services · Lilongwe. Payment reference ${esc(e.reference || 'not yet paid')}.</div></div>`);
    toast('Invoice ' + e.invoice + ' opened');
    return;
  }
  seAudit('Expense ' + act, e.id, seM(e.amount) + ' · ' + e.status);
  renderAll();
  toast(e.id + ' is now ' + e.status);
}
</script>
