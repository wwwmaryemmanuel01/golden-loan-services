<script>
/* ============================================================
   SALARIES, EXPENSES & OPERATING CHARGES (6/8)
   Sections 9–12: system operating charges, recurring expenses,
   expense categories, and budgets against actual spend.
   ============================================================ */

/* ===================== 9 · SYSTEM OPERATING CHARGES ===================== */
function seSystemItem(){
  return SE_SYSTEM.find(x => x.id === SE_SEL.system) || SE_SYSTEM[0];
}
function renderSystem(){
  const rows = SE_SYSTEM.filter(sePass);
  const sel = seSystemItem();
  if(sel) SE_SEL.system = sel.id;
  const variance = SE_SYSTEM.filter(x => x.actual !== x.expected);
  const over = SE_SYSTEM.filter(x => x.actual > x.expected);
  if(el('syPill')){ el('syPill').className = 'badge ' + (over.length ? 'b-warn' : 'b-ok');
    el('syPill').textContent = seM(SE_SYSTEM_ACTUAL) + ' a month'; }
  put('syKpis', [
    ['Providers and licences', num(SE_SYSTEM.length), 'Hosting, software and services', ''],
    ['Expected a month', seM(SE_SYSTEM_TOTAL), 'What the contracts cost', ''],
    ['Actually billed', seM(SE_SYSTEM_ACTUAL), 'What left the account', ''],
    ['Variance', seM(SE_SYSTEM_ACTUAL - SE_SYSTEM_TOTAL), over.length + ' charging above the contract',
      over.length ? 'red' : ''],
    ['Monthly charges', num(SE_SYSTEM.filter(x => x.cycle === 'Monthly').length), 'Billed every month', ''],
    ['Annual contracts', num(SE_SYSTEM.filter(x => x.cycle === 'Annual').length), 'Billed once a year', ''],
    ['Renewing in 30 days', num(SE_SYSTEM.filter(x => x.renewal <= addDays(TODAY, 30)).length), 'Diary the dates', ''],
    ['Billing', 'Manual', 'Invoices arrive by email', '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join(''));

  if(el('syCount')) el('syCount').textContent = num(rows.length) + ' providers';
  const list = rows.slice().sort((a, b) => b.actual - a.actual);
  list.forEach(r => { r._open = () => { SE_SEL.system = r.id; renderSystem(); seRecordModal(r, r.name + ' · ' + r.provider); }; });
  renderTable('syBody', [
    {k: 'name', label: 'Service'},
    {k: 'provider', label: 'Provider'},
    {k: 'cycle', label: 'Cycle'},
    {k: 'dept', label: 'Department'},
    {k: 'expected', label: 'Expected', num: true, html: v => esc(seM(v))},
    {k: 'actual', label: 'Billed', num: true, html: v => esc(seM(v))},
    {k: 'renewal', label: 'Renews', html: v => esc(fmtDate(v))},
    {k: 'status', label: 'State', html: v => okb(v)}
  ], list, {sort: 'actual', pageSize: 9});

  if(el('sySelPill')) el('sySelPill').textContent = sel ? sel.id : '—';
  put('syDetail', sel ? kvRow('Service', esc(sel.name)) + kvRow('Provider', esc(sel.provider))
    + kvRow('Record', esc(sel.id)) + kvRow('Billing', esc(sel.billing))
    + kvRow('Cycle', esc(sel.cycle)) + kvRow('Department', esc(sel.dept))
    + kvRow('Contract started', esc(fmtDate(sel.start))) + kvRow('Contract ends', esc(fmtDate(sel.end)))
    + kvRow('Expected', seM(sel.expected)) + kvRow('Billed', seM(sel.actual))
    + kvRow('Variance', (sel.variance > 0 ? badge('+' + seM(sel.variance), 'b-crit') : badge(seM(sel.variance), 'b-ok')))
    + kvRow('Invoice', esc(sel.invoice)) + kvRow('Renews', esc(fmtDate(sel.renewal)))
    + kvRow('State', okb(sel.status))
    : '<div class="empty">No provider matches the current filters.</div>');

  if(el('syInvPill')) el('syInvPill').textContent = num(SE_SYSTEM.length) + ' invoices';
  renderTable('syInvBody', [
    {k: 'invoice', label: 'Invoice'},
    {k: 'provider', label: 'Provider'},
    {k: 'when', label: 'Billed', html: v => esc(fmtDate(v))},
    {k: 'expected', label: 'Expected', num: true, html: v => esc(seM(v))},
    {k: 'actual', label: 'Billed', num: true, html: v => esc(seM(v))},
    {k: 'variance', label: 'Variance', num: true, html: v => v > 0 ? `<span class="neg">+${esc(seM(v))}</span>` : esc(seM(v))},
    {k: 'status', label: 'State', html: v => okb(v)}
  ], SE_SYSTEM.map(x => Object.assign({}, x, {when: x.renewal})), {sort: 'actual', pageSize: 8});

  const byProvider = SE_SYSTEM.map(x => ({provider: x.provider, cycle: x.cycle, services: x.name,
    expected: x.expected, actual: x.actual, variance: x.actual - x.expected,
    share: Math.round(pct(x.actual, SE_SYSTEM_ACTUAL))}));
  renderTable('syVarBody', [
    {k: 'provider', label: 'Provider'},
    {k: 'services', label: 'Service'},
    {k: 'expected', label: 'Expected', num: true, html: v => esc(seM(v))},
    {k: 'actual', label: 'Billed', num: true, html: v => esc(seM(v))},
    {k: 'variance', label: 'Variance', num: true, html: v => v > 0 ? `<span class="neg">+${esc(seM(v))}</span>` : esc(seM(v))},
    {k: 'share', label: 'Share', num: true, html: v => esc(v + '%')}
  ], byProvider.filter(x => x.variance !== 0), {sort: 'variance', pageSize: 7});
  renderTable('syProvBody', [
    {k: 'provider', label: 'Provider', html: v => esc(v)},
    {k: 'services', label: 'Service'},
    {k: 'cycle', label: 'Cycle'},
    {k: 'actual', label: 'Cost', num: true, html: v => esc(seM(v))}
  ], byProvider, {sort: 'actual', pageSize: 8});

  if(el('syInvoiceBox') && !String(el('syInvoiceBox').innerHTML || '').trim())
    el('syInvoiceBox').innerHTML = '<div class="qhint">Press “Show the invoice” to open the supplier document for the selected service.</div>';
  put('syCycleBox', ['Monthly', 'Quarterly', 'Annual'].map(c => {
    const list = SE_SYSTEM.filter(x => x.cycle === c);
    return kvRow(c + ' charges', `${num(list.length)} · ${seM(sum(list, x => x.actual))}`);
  }).join('') + kvRow('Average a month', seM(SE_SYSTEM_ACTUAL))
    + `<div class="qhint" style="margin-top:6px">Annual contracts are spread across twelve months before they reach the budget.</div>`);

  put('syGrid',
    chartBox({title: 'What each service costs', sub: 'This month, MWK', type: 'bar', h: 200,
      cats: SE_SYSTEM.slice(0, 6).map(x => x.name.split(' ')[0]),
      series: [{name: 'Billed', data: SE_SYSTEM.slice(0, 6).map(x => x.actual)}],
      value: compact(SE_SYSTEM_ACTUAL)}) +
    chartBox({title: 'Expected against billed', sub: 'Every provider', type: 'bar', h: 200,
      cats: SE_SYSTEM.slice(0, 5).map(x => x.provider.split(' ')[0]),
      series: [{name: 'Expected', data: SE_SYSTEM.slice(0, 5).map(x => x.expected)},
        {name: 'Billed', data: SE_SYSTEM.slice(0, 5).map(x => x.actual), colour: '#C9A227'}],
      value: compact(SE_SYSTEM_TOTAL)}));
}
function seSystemAction(act){
  const x = SE_SYSTEM.find(i => i.id === SE_SEL.system);
  if(!x){ toast('Pick a provider first', 'err'); return; }
  if(act === 'pay'){
    x.status = 'Paid';
    if(typeof seCardRecord === 'function' && seCardDefault())
      seCardRecord('System charge', x.provider + ' · ' + x.name, x.actual, x.invoice);
    seAudit('Pay system charge', x.id, x.provider + ' · ' + seM(x.actual));
    toast(x.provider + ' marked paid for ' + seM(x.actual));
  } else if(act === 'renew'){
    x.renewal = addMonths(x.renewal, x.cycle === 'Annual' ? 12 : x.cycle === 'Quarterly' ? 3 : 1);
    x.end = x.renewal; x.status = 'Active';
    seAudit('Renew subscription', x.id, 'Renewed to ' + fmtDate(x.renewal));
    toast(x.name + ' renewed to ' + fmtDate(x.renewal));
  } else if(act === 'invoice'){
    put('syInvoiceBox', `<div class="receiptdoc">
      <div class="sliphead"><div><b>${esc(x.provider)}</b><div class="qhint">Tax invoice</div></div>
        <div style="text-align:right"><b>${esc(x.invoice)}</b><div class="qhint">${esc(fmtDate(x.renewal))}</div></div></div>
      <div class="pfields">${field('Service', esc(x.name))}${field('Cycle', esc(x.cycle))}
        ${field('Expected', esc(seM(x.expected)))}${field('Billed', esc(seM(x.actual)))}</div>
      <div class="qhint">Variance ${esc(seM(x.variance))} · contract ${esc(fmtDate(x.start))} to ${esc(fmtDate(x.end))}.</div></div>`);
    toast('Invoice ' + x.invoice + ' opened');
    return;
  }
  renderAll();
}

/* ===================== 10 · RECURRING EXPENSES ===================== */
function seRecurringItem(){
  return SE_RECURRING.find(r => r.id === SE_SEL.recurring) || SE_RECURRING[0];
}
function renderRecurring(){
  const rows = SE_RECURRING.filter(sePass);
  const sel = seRecurringItem();
  if(sel) SE_SEL.recurring = sel.id;
  const due = SE_RECURRING.filter(r => r.renewal <= addDays(TODAY, SE_SET.reminderDays));
  const pendingAppr = SE_RECURRING_APPR.filter(a => a.status === 'Pending');
  if(el('rcPill')){ el('rcPill').className = 'badge ' + (due.length ? 'b-warn' : 'b-ok');
    el('rcPill').textContent = due.length + ' due within ' + SE_SET.reminderDays + ' days'; }
  put('rcKpis', [
    ['Recurring charges', num(SE_RECURRING.length), 'Contracts that renew themselves', ''],
    ['Monthly commitment', seM(sum(SE_RECURRING, r => r.expected)), 'Before any renewal', ''],
    ['Due within ' + SE_SET.reminderDays + ' days', num(due.length), seM(sum(due, r => r.expected)) + ' to pay', due.length ? 'red' : ''],
    ['Annual contracts', num(SE_RECURRING.filter(r => r.cycle === 'Annual').length), 'One invoice a year', ''],
    ['Monthly contracts', num(SE_RECURRING.filter(r => r.cycle === 'Monthly').length), 'Billed every month', ''],
    ['Quarterly contracts', num(SE_RECURRING.filter(r => r.cycle === 'Quarterly').length), 'Four invoices a year', ''],
    ['Awaiting approval', num(pendingAppr.length), 'A renewal needs a signature', pendingAppr.length ? 'red' : ''],
    ['Last renewal', SE_RECURRING_HISTORY.length ? fmtDate(SE_RECURRING_HISTORY[0].when) : '—', 'Recorded in the history', '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join(''));

  if(el('rcCount')) el('rcCount').textContent = num(rows.length) + ' charges';
  const list = rows.slice().sort((a, b) => String(a.renewal).localeCompare(String(b.renewal)));
  list.forEach(r => { r._open = () => { SE_SEL.recurring = r.id; renderRecurring(); seRecordModal(r, r.name + ' · ' + r.cycle); }; });
  renderTable('rcBody', [
    {k: 'name', label: 'Charge'},
    {k: 'provider', label: 'Provider'},
    {k: 'cycle', label: 'Cycle'},
    {k: 'expected', label: 'Expected', num: true, html: v => esc(seM(v))},
    {k: 'actual', label: 'Last billed', num: true, html: v => esc(seM(v))},
    {k: 'renewal', label: 'Renews', html: v => esc(fmtDate(v))},
    {k: 'status', label: 'State', html: v => okb(v)}
  ], list, {sort: 'renewal', pageSize: 9, dir: 'asc'});

  if(el('rcSelPill')) el('rcSelPill').textContent = sel ? sel.id : '—';
  put('rcDetail', sel ? kvRow('Charge', esc(sel.name)) + kvRow('Provider', esc(sel.provider))
    + kvRow('Link', esc(sel.charge)) + kvRow('Cycle', esc(sel.cycle))
    + kvRow('Expected', seM(sel.expected)) + kvRow('Last billed', seM(sel.actual))
    + kvRow('Contract', fmtDate(sel.contractStart) + ' – ' + fmtDate(sel.contractEnd))
    + kvRow('Renews', esc(fmtDate(sel.renewal))) + kvRow('Reminder', esc(fmtDate(sel.reminder)))
    + kvRow('Approval', esc(sel.approval)) + kvRow('State', okb(sel.status))
    : '<div class="empty">No recurring charge matches the current filters.</div>');

  put('rcDueBox', due.length ? due.map(r => `<div class="risk">
      <div><div class="rn">${esc(r.name)}</div><div class="rs">Renews ${esc(fmtDate(r.renewal))} · ${esc(r.cycle)}</div></div>
      <div class="rv">${esc(seM(r.expected))}</div></div>`).join('')
    : '<div class="qhint">Nothing renews inside the reminder window.</div>');
  if(el('rcAttachBox') && !String(el('rcAttachBox').innerHTML || '').trim())
    el('rcAttachBox').innerHTML = '<div class="qhint">Press “Attach the contract” to load the signed document for the selected charge.</div>';

  if(el('rcApprPill')) el('rcApprPill').textContent = num(pendingAppr.length) + ' pending';
  renderTable('rcApprBody', [
    {k: 'id', label: 'Request'},
    {k: 'name', label: 'Charge'},
    {k: 'amount', label: 'Amount', num: true, html: v => esc(seM(v))},
    {k: 'status', label: 'State', html: v => okb(v)},
    {k: 'when', label: 'Raised', html: v => esc(fmtDate(v))}
  ], SE_RECURRING_APPR, {sort: 'when', pageSize: 6});
  if(el('rcRemPill')) el('rcRemPill').textContent = num(due.length) + ' reminders';
  renderTable('rcRemBody', [
    {k: 'name', label: 'Charge'},
    {k: 'renewal', label: 'Renews', html: v => esc(fmtDate(v))},
    {k: 'reminder', label: 'Remind on', html: v => esc(fmtDate(v))},
    {k: 'days', label: 'Days left', num: true}
  ], SE_RECURRING.map(r => Object.assign({}, r, {days: daysBetween(TODAY, r.renewal)})), {sort: 'days', pageSize: 6, dir: 'asc'});
  if(el('rcHistPill')) el('rcHistPill').textContent = num(SE_RECURRING_HISTORY.length) + ' changes';
  renderTable('rcHistBody', [
    {k: 'when', label: 'When', html: v => esc(fmtDate(v))},
    {k: 'name', label: 'Charge'},
    {k: 'change', label: 'Change'},
    {k: 'to', label: 'Now'},
    {k: 'by', label: 'Officer', html: v => esc(staffName(v))}
  ], SE_RECURRING_HISTORY, {sort: 'when', pageSize: 6});

  put('rcGrid',
    chartBox({title: 'Cycles in the book', sub: 'How the commitments fall', type: 'donut', h: 200,
      cats: ['Monthly', 'Quarterly', 'Annual'],
      series: [{name: 'Commitment', data: ['Monthly', 'Quarterly', 'Annual'].map(c =>
        sum(SE_RECURRING.filter(r => r.cycle === c), r => r.expected))}],
      value: compact(sum(SE_RECURRING, r => r.expected))}) +
    chartBox({title: 'Renewals in the next six months', sub: 'What falls due, by month', type: 'bar', h: 200,
      cats: [0, 1, 2, 3, 4, 5].map(i => monthLabel(addMonths(TODAY, i).slice(0, 7))),
      series: [{name: 'Renewals', data: [0, 1, 2, 3, 4, 5].map(i => {
        const m = addMonths(TODAY, i).slice(0, 7);
        return SE_RECURRING.filter(r => String(r.renewal).slice(0, 7) === m).length;
      }), colour: '#C9A227'}],
      value: num(SE_RECURRING.length)}));
}
function seRecurringAction(act){
  const r = SE_RECURRING.find(x => x.id === SE_SEL.recurring);
  if(!r){ toast('Pick a recurring charge first', 'err'); return; }
  if(act === 'renew'){
    const step = r.cycle === 'Annual' ? 12 : r.cycle === 'Quarterly' ? 3 : 1;
    r.renewal = addMonths(r.renewal, step);
    r.contractEnd = r.renewal;
    r.reminder = addDays(r.renewal, -SE_SET.reminderDays);
    if(r.approval !== 'Automatic'){
      SE_RECURRING_APPR.unshift({id: 'RAQ-' + pad(730 + SE_RECURRING_APPR.length, 3), recurring: r.id, name: r.name,
        amount: r.expected, reason: 'Renewal for another ' + r.cycle.toLowerCase() + ' term', status: 'Pending',
        by: 'STF-009', when: TODAY, lane: 'Recurring', severity: 'Low', owner: 'STF-009', region: 'Lilongwe'});
    }
    SE_RECURRING_HISTORY.unshift({when: TODAY, name: r.name, change: 'Renewed', from: fmtDate(r.contractEnd),
      to: fmtDate(r.renewal), by: 'STF-009', lane: 'Recurring', severity: 'Low', owner: 'STF-009', region: 'Lilongwe'});
    seAudit('Renew recurring charge', r.id, 'Renewed to ' + fmtDate(r.renewal));
    toast(r.name + ' renewed to ' + fmtDate(r.renewal));
  } else if(act === 'cancel'){
    r.status = 'Cancelled';
    SE_RECURRING_HISTORY.unshift({when: TODAY, name: r.name, change: 'Cancelled', from: r.status, to: 'Cancelled',
      by: 'STF-009', lane: 'Recurring', severity: 'Medium', owner: 'STF-009', region: 'Lilongwe'});
    seAudit('Cancel recurring charge', r.id, r.name);
    toast(r.name + ' cancelled — no further invoices', 'ok');
  } else if(act === 'attach'){
    put('rcAttachBox', `<div class="receiptdoc">
      <div class="sliphead"><div><b>${esc(r.name)}</b><div class="qhint">Signed contract</div></div>
        <div style="text-align:right"><b>${esc(r.id)}</b><div class="qhint">${esc(r.cycle)}</div></div></div>
      <div class="pfields">${field('Provider', esc(r.provider))}${field('Term', esc(fmtDate(r.contractStart) + ' – ' + fmtDate(r.contractEnd)))}
        ${field('Amount', esc(seM(r.expected)))}${field('Approval', esc(r.approval))}</div>
      <div class="qhint">Countersigned by the Finance Manager. Auto-renewal unless cancelled 30 days before the renewal date.</div></div>`);
    toast('Contract for ' + r.name + ' opened');
    return;
  }
  renderAll();
}

/* ===================== 11 · EXPENSE CATEGORIES ===================== */
function renderCategories(){
  const byDept = SE_DEPARTMENTS.map(d => {
    const list = SE_EXPENSES.filter(e => e.dept === d.name);
    const month = seExpThisMonth.filter(e => e.dept === d.name);
    return {dept: d.name, head: staffName(d.head), costCentre: d.costCentre, budget: d.budget,
      spent: sum(month, e => e.amount), year: sum(list, e => e.amount), count: month.length,
      remaining: d.budget - sum(month, e => e.amount)};
  });
  const over = SE_CATEGORIES.filter(c => sum(seExpThisMonth.filter(e => e.category === c.name), e => e.amount) > c.limit);
  if(el('cgPill')){ el('cgPill').className = 'badge b-gray'; el('cgPill').textContent = num(SE_CATEGORIES.length) + ' categories'; }
  put('cgKpis', [
    ['Categories', num(SE_CATEGORIES.length), 'Every kind of operating spend', ''],
    ['Recurring categories', num(SE_CATEGORIES.filter(c => c.classification === 'Operating').length), 'Everyday running costs', ''],
    ['Capital categories', num(SE_CATEGORIES.filter(c => c.classification === 'Capital').length), 'Assets over the capital limit', ''],
    ['Monthly limits', seM(sum(SE_CATEGORIES, c => c.limit)), 'What the categories allow', ''],
    ['Spent this month', seM(seStats().expensesThisMonth), num(seExpThisMonth.length) + ' invoices', ''],
    ['Over its limit', num(over.length), over.map(c => c.name).slice(0, 2).join(' · ') || 'None', over.length ? 'red' : ''],
    ['Departments', num(SE_DEPARTMENTS.length), 'Each with a cost centre', ''],
    ['Suppliers', num(SE_SUPPLIERS.length), 'Mapped to a category', '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join(''));

  const catRows = SE_CATEGORIES.map(c => {
    const month = seExpThisMonth.filter(e => e.category === c.name);
    const spent = sum(month, e => e.amount);
    return {name: c.name, type: c.type, classification: c.classification, limit: c.limit,
      supplier: c.supplier, spent, remaining: c.limit - spent, count: month.length,
      status: spent > c.limit ? 'Over budget' : spent > c.limit * 0.9 ? 'At the limit' : 'Within budget'};
  });
  if(el('cgCount')) el('cgCount').textContent = num(catRows.length) + ' categories';
  renderTable('cgBody', [
    {k: 'name', label: 'Category'},
    {k: 'type', label: 'Type'},
    {k: 'classification', label: 'Class', html: v => badge(v, v === 'Capital' ? 'b-warn' : 'b-gray')},
    {k: 'limit', label: 'Limit', num: true, html: v => esc(seM(v))},
    {k: 'spent', label: 'Spent', num: true, html: v => esc(seM(v))},
    {k: 'remaining', label: 'Left', num: true, html: v => esc(seM(v))},
    {k: 'status', label: 'State', html: v => okb(v)}
  ], catRows, {sort: 'spent', pageSize: 9});

  seFillSel('cgName', SE_CATEGORIES.map(c => [c.name, c.name]));
  seFillSel('cgDept', seDeptOptions());
  if(el('cgMsg') && !String(el('cgMsg').textContent || '').trim())
    el('cgMsg').textContent = 'Pick a category to edit its limit, its type or its classification — or start a new one.';

  if(el('cgDeptPill')) el('cgDeptPill').textContent = num(byDept.length) + ' departments';
  renderTable('cgDeptBody', [
    {k: 'dept', label: 'Department'},
    {k: 'head', label: 'Head'},
    {k: 'costCentre', label: 'Cost centre'},
    {k: 'budget', label: 'Budget', num: true, html: v => esc(seM(v))},
    {k: 'spent', label: 'Spent', num: true, html: v => esc(seM(v))},
    {k: 'remaining', label: 'Left', num: true, html: v => esc(seM(v))}
  ], byDept, {sort: 'spent', pageSize: 8});

  put('cgMixBox', SE_CATEGORIES.slice(0, 6).map(c => {
    const spent = sum(seExpThisMonth.filter(e => e.category === c.name), e => e.amount);
    return meter(c.name.split(' ')[0], Math.min(100, Math.round(pct(spent, c.limit))),
      seM(spent) + ' of ' + seM(c.limit), 100);
  }).join('') + `<div class="qhint" style="margin-top:6px">Anything above 90% of its limit is flagged before it goes over.</div>`);
  if(el('cgHistPill')) el('cgHistPill').textContent = num(SE_CHANGES.filter(c => c.area === 'Expenses').length) + ' changes';
  if(el('cgHistBody')) el('cgHistBody').innerHTML = (SE_CHANGES.filter(c => c.area === 'Expenses').length
    ? SE_CHANGES.filter(c => ['Expenses', 'Claims', 'Budgets'].includes(c.area)) : SE_CHANGES.slice(0, 4))
    .map(c => `<tr><td>${esc(seWhen(c.when))}</td><td>${esc(c.what)}</td><td>${esc(c.from)}</td>
      <td>${esc(c.to)}</td><td>${esc(staffName(c.by))}</td></tr>`).join('')
    || '<tr><td colspan="5" class="empty">No category change has been recorded.</td></tr>';

  if(el('cgReportBox') && !String(el('cgReportBox').innerHTML || '').trim())
    el('cgReportBox').innerHTML = '<div class="qhint">The category report compares every limit with what has been spent this month.</div>';
  if(el('cgHistHead')) el('cgHistHead').innerHTML = '<tr><th>When</th><th>Setting</th><th>Was</th><th>Now</th><th>Officer</th></tr>';

  put('cgGrid',
    chartBox({title: 'Spend against the limit', sub: 'The six biggest categories', type: 'bar', h: 200,
      cats: catRows.slice().sort((a, b) => b.spent - a.spent).slice(0, 6).map(c => c.name.split(' ')[0]),
      series: [{name: 'Spent', data: catRows.slice().sort((a, b) => b.spent - a.spent).slice(0, 6).map(c => c.spent)},
        {name: 'Limit', data: catRows.slice().sort((a, b) => b.spent - a.spent).slice(0, 6).map(c => c.limit), colour: '#9AA3B2'}],
      value: compact(seStats().expensesThisMonth)}) +
    chartBox({title: 'Spend by department', sub: 'This month, MWK', type: 'donut', h: 200,
      cats: byDept.map(d => d.dept.split(' ')[0]),
      series: [{name: 'Spent', data: byDept.map(d => d.spent)}],
      value: compact(sum(byDept, d => d.spent))}));
}
function seCategoryLoad(){
  const c = SE_CATEGORIES.find(x => x.name === el('cgName').value);
  if(!c) return;
  el('cgLimit').value = c.limit;
  el('cgType').value = /^Direct$/i.test(c.type) ? 'Direct' : /^Indirect$/i.test(c.type) ? 'Indirect' : 'Direct';
  el('cgClass').value = c.classification === 'Capital' ? 'Capital' : 'Operating';
  el('cgMsg').textContent = c.name + ' · ' + seM(c.limit) + ' a month · ' + c.classification + ' · last billed by ' + c.supplier + '.';
}
function seCategorySave(){
  const name = el('cgName').value;
  const c = SE_CATEGORIES.find(x => x.name === name);
  const limit = Number(el('cgLimit').value) || 0;
  if(!c){ toast('Pick a category to edit', 'err'); return; }
  if(limit <= 0){ toast('Set a monthly limit above zero', 'err'); return; }
  const from = c.limit;
  const type = el('cgType').value, cls = el('cgClass').value;
  const dept = el('cgDept').value || SE_DEPARTMENTS[0].name;
  c.limit = limit; c.classification = cls;
  c.type = /rent|electricity|water|internet|security|insurance|licence|professional|repair/i.test(c.name)
    ? 'Indirect' : type;
  const budget = SE_BUDGETS.find(b => b.scope === c.name && b.kind === 'Category');
  if(budget){
    budget.monthly = limit; budget.annual = limit * 12;
    budget.remaining = limit - budget.actual; budget.variance = budget.actual - limit;
    budget.status = budget.actual > limit ? 'Over budget' : budget.actual > limit * 0.9 ? 'At the limit' : 'Within budget';
  }
  if(from !== limit) seLogChange('Expenses', c.name + ' limit', seM(from), seM(limit));
  seAudit('Edit expense category', c.name, seM(from) + ' to ' + seM(limit) + ' · ' + cls + ' · ' + dept);
  el('cgMsg').textContent = c.name + ' now carries a limit of ' + seM(limit) + ' a month and is charged to ' + dept + '.';
  renderAll();
  toast(c.name + ' saved at ' + seM(limit));
}
function seCategoryNew(){
  openModal('New expense category', 'It appears in the expense form and in the budgets straight away',
    `<div class="pfields">
      ${field('Category name', '<input id="cgNewName" placeholder="Staff welfare" />')}
      ${field('Monthly limit (MWK)', '<input id="cgNewLimit" type="number" step="1000" value="250000" />')}
      ${field('Classification', '<select id="cgNewClass"><option>Operating</option><option>Capital</option></select>')}
      ${field('Department', `<select id="cgNewDept">${SE_DEPARTMENTS.map(d => `<option>${esc(d.name)}</option>`).join('')}</select>`)}
    </div>
    <div class="qhint" style="margin-top:8px">A category with a capital classification is an asset, not an operating cost.</div>`,
    [{label: 'Create the category', cls: 'btn-gold', act: seCategoryCreate},
     {label: 'Close', act: 'close'}]);
}
function seCategoryCreate(){
  const name = (el('cgNewName').value || '').trim();
  const limit = Number(el('cgNewLimit').value) || 0;
  const cls = el('cgNewClass').value;
  const dept = el('cgNewDept').value;
  if(!name){ toast('A category needs a name', 'err'); return; }
  if(limit <= 0){ toast('Set a monthly limit above zero', 'err'); return; }
  if(SE_CATEGORIES.some(c => c.name.toLowerCase() === name.toLowerCase())){
    toast('A category called ' + name + ' already exists', 'err'); return;
  }
  SE_CATEGORIES.push({name, type: 'Direct', classification: cls, limit, supplier: (SE_SUPPLIERS[0] || {}).name || '—'});
  SE_BUDGETS.push({id: 'BGT-N' + pad(100 + SE_BUDGETS.length, 3), scope: name, kind: 'Category', annual: limit * 12,
    monthly: limit, actual: 0, remaining: limit, variance: 0, status: 'Within budget',
    costCentre: (SE_DEPARTMENTS.find(d => d.name === dept) || SE_DEPARTMENTS[0]).costCentre,
    lane: 'Budgets', severity: 'Low', owner: 'STF-007', region: 'Lilongwe'});
  seLogChange('Expenses', 'Category ' + name, 'Not on file', seM(limit) + ' a month');
  seAudit('Create expense category', name, 'Direct · ' + cls + ' · ' + seM(limit) + ' · ' + dept);
  closeModal();
  el('cgMsg').textContent = 'Category ' + name + ' added with a limit of ' + seM(limit) + ' a month.';
  renderAll();
  toast('Category ' + name + ' added');
}
function seCategoryReport(){
  const d = {title: 'Expense Categories Report',
    cols: [['Category', 'name'], ['Type', 'type'], ['Class', 'classification'], ['Limit', 'limit'],
      ['Spent', 'spent'], ['Left', 'remaining'], ['State', 'status']]};
  const rows = SE_CATEGORIES.map(c => {
    const spent = sum(seExpThisMonth.filter(e => e.category === c.name), e => e.amount);
    return {name: c.name, type: c.type, classification: c.classification, limit: seM(c.limit),
      spent: seM(spent), remaining: seM(c.limit - spent),
      status: spent > c.limit ? 'Over budget' : spent > c.limit * 0.9 ? 'At the limit' : 'Within budget'};
  });
  const labels = d.cols.map(c => c[0]), body = rows.map(r => d.cols.map(c => r[c[1]]));
  downloadFile('expense-categories-' + TODAY.replace(/-/g, '') + '.csv', 'text/csv', toCsv([labels].concat(body)));
  logExport(d.title, 'CSV', rows.length);
  renderExportHistory();
  openModal(d.title, rows.length + ' rows · ' + filterLine(),
    `<div class="tblwrap" style="max-height:320px"><table class="tbl2 dense"><thead><tr>${labels.map(l => `<th>${esc(l)}</th>`).join('')}</tr></thead>
      <tbody>${rows.map(r => `<tr>${d.cols.map(c => `<td>${esc(r[c[1]])}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`,
    [{label: 'Print', act: () => printTable(d.title, labels.map(l => ({label: l})), body)},
     {label: 'Close', act: 'close'}]);
  toast('Category report built');
}

/* ===================== 12 · BUDGETS ===================== */
function renderBudgets(){
  const s = seStats();
  const dept = SE_BUDGETS.filter(b => b.kind === 'Department');
  const cats = SE_BUDGETS.filter(b => b.kind === 'Category');
  const over = SE_BUDGETS.filter(b => b.status === 'Over budget');
  const limit = SE_BUDGETS.filter(b => b.status === 'At the limit');
  if(el('bgPill')){ el('bgPill').className = 'badge ' + (over.length ? 'b-crit' : 'b-ok');
    el('bgPill').textContent = over.length + ' over · ' + limit.length + ' at the limit'; }
  put('bgKpis', [
    ['Operating budget', seM(SE_SET.monthlyOperatingBudget), 'For the month', ''],
    ['Committed', seM(s.budgetActual), Math.round(s.budgetUtil) + '% of the budget', s.budgetUtil > 100 ? 'red' : ''],
    ['Remaining', seM(Math.max(0, SE_SET.monthlyOperatingBudget - s.budgetActual)), 'Still to spend', ''],
    ['Utilisation', Math.round(s.budgetUtil) + '%', 'Anything above 100% is an overrun', s.budgetUtil > 100 ? 'red' : ''],
    ['Department budgets', seM(sum(dept, b => b.monthly)), num(dept.length) + ' departments', ''],
    ['Category budgets', seM(sum(cats, b => b.monthly)), num(cats.length) + ' categories', ''],
    ['Over budget', num(over.length), seM(sum(over, b => Math.abs(b.variance))) + ' above plan', over.length ? 'red' : ''],
    ['At the limit', num(limit.length), 'Within 10% of the ceiling', '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join(''));

  put('bgTopBox', meter('The operating budget', Math.round(s.budgetUtil),
    seM(s.budgetActual) + ' of ' + seM(SE_SET.monthlyOperatingBudget), 100)
    + kvRow('Payroll', seM(SE_SET.payrollBudget) + ' · ' + seM(s.salaryTotal) + ' used')
    + kvRow('System charges', seM(SE_SET.systemBudget) + ' · ' + seM(s.systemActual) + ' used')
    + kvRow('Business expenses', seM(SE_SET.businessBudget) + ' · ' + seM(s.expensesThisMonth) + ' used')
    + (s.budgetUtil > 100 ? `<div class="note red" style="margin-top:8px"><div>The month is ${Math.round(s.budgetUtil - 100)}% over the operating budget.</div></div>` : ''));

  if(el('bgCount')) el('bgCount').textContent = num(SE_BUDGETS.length) + ' budgets';
  const list = SE_BUDGETS.filter(sePass).slice().sort((a, b) => b.variance - a.variance);
  list.forEach(r => { r._open = () => { openBudget(r); }; });
  renderTable('bgBody', [
    {k: 'scope', label: 'Budget'},
    {k: 'kind', label: 'Kind'},
    {k: 'costCentre', label: 'Cost centre'},
    {k: 'monthly', label: 'Budget', num: true, html: v => esc(seM(v))},
    {k: 'actual', label: 'Actual', num: true, html: v => esc(seM(v))},
    {k: 'variance', label: 'Variance', num: true, html: v => v > 0 ? `<span class="neg">+${esc(seM(v))}</span>` : esc(seM(v))},
    {k: 'status', label: 'State', html: v => okb(v)}
  ], list, {sort: 'variance', pageSize: 9});

  put('bgVarBox', SE_BUDGETS.slice().sort((a, b) => b.variance - a.variance).slice(0, 6).map(b => `<div class="risk">
      <div><div class="rn">${esc(b.scope)}</div><div class="rs">${esc(b.kind)} · ${esc(b.costCentre)}</div></div>
      <div class="rv">${b.variance > 0 ? `<span class="neg">+${esc(seM(b.variance))}</span>` : esc(seM(b.variance))}</div></div>`).join(''));
  put('bgAlertBox', over.length || limit.length
    ? over.map(b => `<div class="note red"><div><b>${esc(b.scope)}</b> is ${esc(seM(Math.abs(b.variance)))} over its budget — ${esc(seM(b.actual))} against ${esc(seM(b.monthly))}.</div></div>`).join('')
      + limit.map(b => `<div class="note gold"><div><b>${esc(b.scope)}</b> has ${esc(seM(Math.max(0, b.remaining)))} left of ${esc(seM(b.monthly))} — at the limit.</div></div>`).join('')
    : '<div class="note gray"><div>Every budget is comfortably within its limit.</div></div>');

  if(el('bgMsg') && !String(el('bgMsg').textContent || '').trim())
    el('bgMsg').textContent = 'A revision replaces the monthly budget and is written to the revision list and the change history.';
  seFillSel('bgRevScope', SE_BUDGETS.map(b => [b.id, b.scope + ' · ' + seM(b.monthly)]));
  if(el('bgRevBody')){
    if(!el('bgRevBody').innerHTML.trim()){
      el('bgRevBody').innerHTML = '<tr><td colspan="6" class="empty">No budget revision has been raised from this page yet.</td></tr>';
    }
  }
  if(el('bgRevPill')) el('bgRevPill').textContent = num(SE_BUDGET_REVISIONS.length) + ' revisions';
  renderTable('bgRevBody', [
    {k: 'id', label: 'Request'},
    {k: 'scope', label: 'Budget'},
    {k: 'from', label: 'From', num: true, html: v => esc(seM(v))},
    {k: 'to', label: 'To', num: true, html: v => esc(seM(v))},
    {k: 'status', label: 'State', html: v => okb(v)},
    {k: 'when', label: 'Raised', html: v => esc(fmtDate(v))}
  ], SE_BUDGET_REVISIONS, {sort: 'when', pageSize: 6});

  put('bgGrid',
    chartBox({title: 'Budget against actual by department', sub: 'This month, MWK', type: 'bar', h: 210,
      cats: dept.map(b => b.scope.split(' ')[0]),
      series: [{name: 'Budget', data: dept.map(b => b.monthly), colour: '#9AA3B2'},
        {name: 'Actual', data: dept.map(b => b.actual), colour: '#C9A227'}],
      value: compact(sum(dept, b => b.monthly))}) +
    chartBox({title: 'How the budget is used', sub: 'Payroll, expenses and system', type: 'donut', h: 210,
      cats: ['Payroll', 'Expenses', 'System'],
      series: [{name: 'Used', data: [s.salaryTotal, s.expensesThisMonth, s.systemActual]}],
      value: compact(s.budgetActual)}));
}
function openBudget(b){
  if(!b) return;
  openModal('Budget · ' + b.scope, b.kind + ' · ' + b.costCentre + ' · ' + filterLine(),
    `<div class="pfields">
      ${field('Monthly budget', esc(seM(b.monthly)))}${field('Annual budget', esc(seM(b.annual)))}
      ${field('Actual', esc(seM(b.actual)))}${field('Remaining', esc(seM(b.remaining)))}
      ${field('Variance', esc(seM(b.variance)))}${field('State', okb(b.status))}
    </div>
    <div class="qhint" style="margin-top:8px">Actual spend is payroll for the department plus the operating expenses charged to it. A revision is written to the budget history.</div>`,
    [{label: 'Close', act: 'close'}]);
}
function seBudgetRevise(){
  const id = el('bgRevScope').value;
  const b = SE_BUDGETS.find(x => x.id === id);
  const amount = Number(el('bgRevAmount').value) || 0;
  const reason = (el('bgRevReason').value || '').trim();
  if(!b){ toast('Pick a budget', 'err'); return; }
  if(amount <= 0){ toast('The new budget must be above zero', 'err'); return; }
  if(!reason){ toast('A revision needs a reason', 'err'); return; }
  const from = b.monthly;
  b.monthly = amount; b.annual = amount * 12; b.remaining = amount - b.actual; b.variance = b.actual - amount;
  b.status = b.actual > amount ? 'Over budget' : b.actual > amount * 0.9 ? 'At the limit' : 'Within budget';
  SE_BUDGET_REVISIONS.unshift({id: 'BRQ-' + pad(120 + SE_BUDGET_REVISIONS.length, 3), scope: b.scope, when: TODAY + ' ' + seNow(),
    from, to: amount, reason, status: 'Approved', by: 'STF-007', approver: 'STF-009',
    lane: 'Budgets', severity: 'Medium', owner: 'STF-007', region: 'Lilongwe'});
  SE_BUDGET_HISTORY.unshift({when: TODAY, scope: b.scope, change: 'Budget revised', from: seM(from), to: seM(amount), by: 'STF-009', status: 'Approved'});
  seLogChange('Budgets', b.scope + ' budget', seM(from), seM(amount));
  seAudit('Revise budget', b.id, seM(from) + ' to ' + seM(amount) + ' · ' + reason);
  el('bgRevAmount').value = ''; el('bgRevReason').value = '';
  renderAll();
  toast(b.scope + ' budget is now ' + seM(amount));
}
</script>
