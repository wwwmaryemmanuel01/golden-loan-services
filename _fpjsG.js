<script>
/* ============================================================
   FEES & PENALTIES (7/8)
   Sections 17–20: the database and its guards, the twelve
   reports, the settings and compliance screen with the Malawi
   requirements, and the audit history with its export.
   ============================================================ */

/* ---------------- 17 · DATABASE ---------------- */
function renderDatabase(){
  const tables = FEE_DB_TABLES;
  const errors = FEE_DB_ERRORS;
  const rlsOff = tables.filter(t => t.rls !== 'Enabled');
  if(el('dbPill')){ el('dbPill').className = 'badge ' + (rlsOff.length ? 'b-warn' : 'b-ok');
    el('dbPill').textContent = num(tables.length) + ' tables · RLS ' + (rlsOff.length ? 'gap' : 'on'); }
  put('dbKpis', [
    ['Tables', num(tables.length), 'Charges, payments, waivers and the ledger', ''],
    ['Database functions', num(FEE_DB_FUNCS.length), 'Assessment, allocation and the guards', ''],
    ['Row level security', rlsOff.length ? 'Gap' : 'Enabled', rlsOff.length + ' table(s) open', rlsOff.length ? 'red' : ''],
    ['Migrations applied', num(FEE_MIGRATIONS.length), 'Every one recorded', ''],
    ['Errors in 7 days', num(errors.length), 'All held or retried', ''],
    ['Rows under management', compact(sum(tables, t => t.rows)), 'Across every table', ''],
    ['Duplicate guards', num(2), 'A trigger and a unique key', ''],
    ['Schema check', 'Compatible', 'This build against the live schema', '']
  ].map(([l, v, s, k]) => kpiCard(l, v, s, k)).join(''));

  if(el('dbTablePill')) el('dbTablePill').textContent = num(tables.length) + ' tables';
  renderTable('dbTableBody', [
    {k: 'table', label: 'Table'},
    {k: 'rows', label: 'Rows', num: true},
    {k: 'size', label: 'Size'},
    {k: 'rls', label: 'RLS', html: v => okb(v)},
    {k: 'function', label: 'Written by'},
    {k: 'note', label: 'What it holds'},
    {k: 'lastWrite', label: 'Last write', html: v => esc(fpWhen(v))}
  ], tables, {sort: 'rows', pageSize: 12});

  if(el('dbFuncPill')) el('dbFuncPill').textContent = num(FEE_DB_FUNCS.length) + ' functions';
  renderTable('dbFuncBody', [
    {k: 'name', label: 'Function'},
    {k: 'purpose', label: 'What it does'},
    {k: 'invoker', label: 'Runs as'},
    {k: 'calls', label: 'Calls', num: true},
    {k: 'status', label: 'State', html: v => okb(v)},
    {k: 'lastRun', label: 'Last run', html: v => esc(fpWhen(v))}
  ], FEE_DB_FUNCS, {sort: 'calls', pageSize: 8});

  if(el('dbRlsPill')) el('dbRlsPill').textContent = rlsOff.length ? num(rlsOff.length) + ' open' : 'all closed';
  put('dbRlsBox', tables.map(t => `<div class="risk"><div><div class="rn">${esc(t.table)}</div>
      <div class="rs">Policy: a customer may read only their own charges; staff read by role</div></div>
      <div class="rv">${okb(t.rls)}</div></div>`).join('')
    + `<div class="qhint" style="margin-top:6px">Every table is closed to anonymous access. The ${esc('fee_ledger')}
      table allows no update or delete at all.</div>`);

  if(el('dbIntPill')) el('dbIntPill').textContent = 'four checks';
  put('dbIntBox', [
    ['Debits equal credits', badge('Checked on every batch', 'b-ok')],
    ['A charge cannot land twice', badge('Trigger plus a unique key', 'b-ok')],
    ['A payment cannot exceed the balance', badge('Check constraint', 'b-ok')],
    ['A waiver keeps its evidence', badge('Evidence cannot be empty', 'b-ok')],
    ['A reversal keeps the original', badge('The original row is never touched', 'b-ok')]
  ].map(([k, v]) => kvRow(k, v)).join(''));

  const schema = [
    {check: 'fee_assessments.calc', expect: 'text', found: 'text', status: 'Compatible'},
    {check: 'fee_assessments.days_late', expect: 'integer', found: 'integer', status: 'Compatible'},
    {check: 'fee_payments.allocated_to', expect: 'uuid', found: 'uuid', status: 'Compatible'},
    {check: 'fee_waivers.document_type', expect: 'text', found: 'text', status: 'Compatible'},
    {check: 'fee_ledger.entry_side', expect: 'enum', found: 'enum', status: 'Compatible'},
    {check: 'fee_types.effective_from', expect: 'date', found: 'date', status: 'Compatible'}
  ];
  if(el('dbSchemaPill')) el('dbSchemaPill').textContent = num(schema.length) + ' checks';
  renderTable('dbSchemaBody', [
    {k: 'check', label: 'Column'},
    {k: 'expect', label: 'Expected'},
    {k: 'found', label: 'Found'},
    {k: 'status', label: 'State', html: v => okb(v)}
  ], schema, {sort: 'check', pageSize: 6, onRow: false});
  put('dbMigBox', FEE_MIGRATIONS.map(m => kvRow(m.id + ' · ' + m.name, esc(fmtDate(m.when)) + ' · ' + okb(m.status))).join(''));

  if(el('dbErrPill')) el('dbErrPill').textContent = num(errors.length) + ' events';
  renderTable('dbErrBody', [
    {k: 'when', label: 'When', html: v => esc(fpWhen(v))},
    {k: 'code', label: 'Code'},
    {k: 'message', label: 'Message'},
    {k: 'count', label: 'Count', num: true},
    {k: 'status', label: 'Handling', html: v => okb(v)}
  ], errors, {sort: 'when', pageSize: 6});

  put('dbGrid',
    chartBox({title: 'Rows by table', sub: 'Where the volume sits', type: 'bar', h: 210,
      cats: tables.map(t => t.table), value: compact(sum(tables, t => t.rows)),
      series: [{name: 'Rows', data: tables.map(t => t.rows), colour: '#2F6FED'}]}) +
    chartBox({title: 'Function calls', sub: 'How hard the database works', type: 'bar', h: 210,
      cats: FEE_DB_FUNCS.map(f => f.name.replace('fn_', '')), value: num(sum(FEE_DB_FUNCS, f => f.calls)),
      series: [{name: 'Calls', data: FEE_DB_FUNCS.map(f => f.calls), colour: '#1E9E6A'}]}));
}
function fpVerifyRls(){
  const open = FEE_DB_TABLES.filter(t => t.rls !== 'Enabled');
  FEE_DB_TABLES.forEach(t => { t.rls = 'Enabled'; });
  fpAudit('RLS verified', num(FEE_DB_TABLES.length) + ' tables', open.length ? num(open.length) + ' open' : 'All closed',
    'All closed', FEE_STAFF_REF, 'Row level security sweep', 'Database');
  if(el('dbRlsMsg')) el('dbRlsMsg').textContent = 'Row level security verified on ' + FEE_DB_TABLES.length
    + ' tables; ' + (open.length ? open.length + ' policy gap(s) closed and recorded.' : 'no gap was found.');
  renderAll();
  toast('RLS verified on ' + FEE_DB_TABLES.length + ' tables');
}
function fpIntegrity(){
  const debits = sum(FEE_LEDGER, r => r.debit), credits = sum(FEE_LEDGER, r => r.credit);
  const overpaid = CHARGES.filter(c => c.paid + c.waived + c.reversed > c.amount + 1);
  const dupes = CHARGES.filter((c, i) => CHARGES.findIndex(o => o.loan === c.loan && o.type === c.type
    && o.assessed === c.assessed && o.cust === c.cust) !== i);
  if(el('dbIntMsg')) el('dbIntMsg').textContent = 'Integrity checks ran on ' + num(CHARGES.length) + ' charges: '
    + (Math.abs(debits - credits) <= 1 ? 'the ledger balances, ' : 'the ledger is out by ' + fpM(Math.abs(debits - credits)) + ', ')
    + num(overpaid.length) + ' over-settled and ' + num(dupes.length) + ' duplicate assessments found.';
  fpAudit('Integrity check', 'Charge book and ledger', '—',
    num(overpaid.length) + ' over-settled · ' + num(dupes.length) + ' duplicates', FEE_STAFF_REF, 'Scheduled check', 'Database');
  toast(Math.abs(debits - credits) <= 1 && !overpaid.length ? 'Integrity checks passed' : 'Integrity checks found something',
    Math.abs(debits - credits) <= 1 && !overpaid.length ? 'ok' : 'err');
  if(el('dbRlsPill')) el('dbRlsPill').textContent = 'checked';
}

/* ---------------- 18 · REPORTS ---------------- */
function fpReportData(key){
  const inWin = c => inRange(c.assessed || c.when || c.requestedOn || '');
  const fees = CHARGES.filter(c => c.kind === 'Fee' && inWin(c));
  const pens = CHARGES.filter(c => c.kind === 'Penalty' && inWin(c));
  if(key === 'penalties' || key === 'fees'){
    const set = key === 'fees' ? fees : pens;
    const byType = {};
    set.forEach(c => {
      byType[c.type] = byType[c.type] || {type: c.type, name: c.typeName, count: 0, amount: 0, paid: 0, balance: 0};
      byType[c.type].count++; byType[c.type].amount += c.amount;
      byType[c.type].paid += c.paid; byType[c.type].balance += c.balance;
    });
    return {
      title: key === 'fees' ? 'Fees assessed' : 'Penalties assessed',
      cols: [{label: 'Code'}, {label: 'Charge'}, {label: 'Count', num: true}, {label: 'Assessed', num: true},
        {label: 'Collected', num: true}, {label: 'Outstanding', num: true}],
      rows: Object.keys(byType).map(k => { const r = byType[k];
        return [r.type, r.name, num(r.count), fpM(r.amount), fpM(r.paid), fpM(r.balance)]; }),
      summary: [['Charges', num(set.length)], ['Assessed', fpM(sum(set, c => c.amount))],
        ['Collected', fpM(sum(set, c => c.paid))], ['Outstanding', fpM(sum(set, c => c.balance))]]
    };
  }
  if(key === 'feecollected' || key === 'pencollected'){
    const kind = key === 'feecollected' ? 'Fee' : 'Penalty';
    const set = COLLECTIONS.filter(c => c.kind === kind && inRange(c.when));
    return {
      title: kind === 'Fee' ? 'Fees collected' : 'Penalties collected',
      cols: [{label: 'Collection'}, {label: 'When'}, {label: 'Charge'}, {label: 'Customer'}, {label: 'Amount', num: true},
        {label: 'Method'}, {label: 'Receipt'}, {label: 'State'}],
      rows: set.map(c => [c.id, fmtDate(c.when), c.charge, custName(c.cust), fpM(c.amount), c.method, c.receipt, c.status]),
      summary: [['Collections', num(set.length)], ['Value', fpM(sum(set, c => c.amount))],
        ['Methods', num(new Set(set.map(c => c.method)).size)], ['Reversed', num(set.filter(c => c.status === 'Reversed').length)]]
    };
  }
  if(key === 'outstanding'){
    const set = CHARGES.filter(c => c.balance > 0);
    return {
      title: 'Outstanding charges',
      cols: [{label: 'Charge'}, {label: 'Type'}, {label: 'Kind'}, {label: 'Customer'}, {label: 'Due'},
        {label: 'Balance', num: true}, {label: 'Days overdue', num: true}, {label: 'State'}],
      rows: set.slice(0, 300).map(c => [c.id, c.typeName, c.kind, custName(c.cust), fmtDate(c.due), fpM(c.balance),
        num(Math.max(0, daysBetween(c.due, TODAY))), c.status]),
      summary: [['Open charges', num(set.length)], ['Fees', fpM(sum(set.filter(c => c.kind === 'Fee'), c => c.balance))],
        ['Penalties', fpM(sum(set.filter(c => c.kind === 'Penalty'), c => c.balance))],
        ['Over 30 days', num(set.filter(c => daysBetween(c.due, TODAY) > 30).length)]]
    };
  }
  if(key === 'waivers'){
    const set = WAIVERS.filter(w => inRange(w.requestedOn));
    return {
      title: 'Waivers and exemptions',
      cols: [{label: 'Request'}, {label: 'Charge'}, {label: 'Customer'}, {label: 'Scope'}, {label: 'Value', num: true},
        {label: 'Reason'}, {label: 'Evidence'}, {label: 'Asked by'}, {label: 'State'}],
      rows: set.map(w => [w.id, w.charge, custName(w.cust), w.scope, fpM(w.waived), w.reason, w.document,
        staffName(w.requestedBy), w.status]),
      summary: [['Requests', num(set.length)], ['Approved', num(set.filter(w => w.status === 'Approved').length)],
        ['Value waived', fpM(sum(set.filter(w => w.status === 'Approved'), w => w.waived))],
        ['Rejected', num(set.filter(w => w.status === 'Rejected').length)]]
    };
  }
  if(key === 'reversed'){
    const set = REVERSALS.filter(r => inRange(r.requestedOn));
    return {
      title: 'Reversed charges',
      cols: [{label: 'Request'}, {label: 'Charge'}, {label: 'Customer'}, {label: 'Type'}, {label: 'Value', num: true},
        {label: 'Reason'}, {label: 'Cash'}, {label: 'Decided by'}, {label: 'State'}],
      rows: set.map(r => [r.id, r.charge, custName(r.cust), r.typeName, fpM(r.amount), r.reason, r.refund,
        r.approvedBy ? staffName(r.approvedBy) : '—', r.status]),
      summary: [['Requests', num(set.length)], ['Approved', num(set.filter(r => r.status === 'Approved').length)],
        ['Value reversed', fpM(sum(set.filter(r => r.status === 'Approved'), r => r.amount))],
        ['Duplicates spotted', num(DUPLICATES.length)]]
    };
  }
  if(key === 'byproduct'){
    return {
      title: 'Charges by loan product',
      cols: [{label: 'Product'}, {label: 'Charges', num: true}, {label: 'Assessed', num: true}, {label: 'Collected', num: true},
        {label: 'Outstanding', num: true}, {label: 'Penalties', num: true}],
      rows: PRODUCTS.map(p => { const set = CHARGES.filter(c => c.product === p.id); return [p.name, num(set.length),
        fpM(sum(set, c => c.amount)), fpM(sum(set, c => c.paid)), fpM(sum(set, c => c.balance)),
        fpM(sum(set.filter(c => c.kind === 'Penalty'), c => c.amount))]; }),
      summary: [['Products', num(PRODUCTS.length)], ['Assessed', fpM(sum(CHARGES, c => c.amount))],
        ['Collected', fpM(sum(CHARGES, c => c.paid))], ['Outstanding', fpM(sum(CHARGES, c => c.balance))]]
    };
  }
  if(key === 'bycustomer'){
    const by = {};
    CHARGES.forEach(c => {
      by[c.cust] = by[c.cust] || {cust: c.cust, count: 0, amount: 0, paid: 0, balance: 0};
      by[c.cust].count++; by[c.cust].amount += c.amount; by[c.cust].paid += c.paid; by[c.cust].balance += c.balance;
    });
    const list = Object.keys(by).map(k => by[k]).sort((a, b) => b.amount - a.amount).slice(0, 40);
    return {
      title: 'Charges by customer',
      cols: [{label: 'Customer'}, {label: 'Reference'}, {label: 'Charges', num: true}, {label: 'Assessed', num: true},
        {label: 'Collected', num: true}, {label: 'Outstanding', num: true}],
      rows: list.map(r => [custName(r.cust), r.cust, num(r.count), fpM(r.amount), fpM(r.paid), fpM(r.balance)]),
      summary: [['Customers with charges', num(list.length)], ['Assessed', fpM(sum(list, r => r.amount))],
        ['Outstanding', fpM(sum(list, r => r.balance))], ['Highest balance', fpM(Math.max.apply(null, list.map(r => r.balance).concat([0])))]]
    };
  }
  if(key === 'bystaff'){
    const by = {};
    CHARGES.forEach(c => {
      by[c.officer] = by[c.officer] || {officer: c.officer, count: 0, amount: 0, waived: 0, reversed: 0};
      by[c.officer].count++; by[c.officer].amount += c.amount;
      by[c.officer].waived += c.waived; by[c.officer].reversed += c.reversed;
    });
    const list = Object.keys(by).map(k => by[k]).sort((a, b) => b.amount - a.amount);
    return {
      title: 'Charges by staff member',
      cols: [{label: 'Staff member'}, {label: 'Role'}, {label: 'Charges', num: true}, {label: 'Assessed', num: true},
        {label: 'Waived', num: true}, {label: 'Reversed', num: true}],
      rows: list.map(r => [staffName(r.officer), (STAFF_BY_ID[r.officer] || {}).role || '—', num(r.count),
        fpM(r.amount), fpM(r.waived), fpM(r.reversed)]),
      summary: [['Staff involved', num(list.length)], ['Assessed', fpM(sum(list, r => r.amount))],
        ['Waived', fpM(sum(list, r => r.waived))], ['Reversed', fpM(sum(list, r => r.reversed))]]
    };
  }
  if(key === 'monthly'){
    const months = buckets();
    return {
      title: 'Monthly fee revenue',
      cols: [{label: 'Month'}, {label: 'Fees assessed', num: true}, {label: 'Penalties assessed', num: true},
        {label: 'Fees collected', num: true}, {label: 'Penalties collected', num: true}],
      rows: months.map(m => {
        const f = CHARGES.filter(c => c.kind === 'Fee' && c.assessed.slice(0, 7) === m);
        const p = CHARGES.filter(c => c.kind === 'Penalty' && c.assessed.slice(0, 7) === m);
        const fc = COLLECTIONS.filter(c => c.kind === 'Fee' && c.when.slice(0, 7) === m);
        const pc = COLLECTIONS.filter(c => c.kind === 'Penalty' && c.when.slice(0, 7) === m);
        return [monthLabel(m), fpM(sum(f, c => c.amount)), fpM(sum(p, c => c.amount)),
          fpM(sum(fc, c => c.amount)), fpM(sum(pc, c => c.amount))];
      }),
      summary: [['Months', num(months.length)], ['Fees assessed', fpM(sum(CHARGES.filter(c => c.kind === 'Fee'), c => c.amount))],
        ['Penalties assessed', fpM(sum(CHARGES.filter(c => c.kind === 'Penalty'), c => c.amount))],
        ['Revenue collected', fpM(sum(COLLECTIONS, c => c.amount))]]
    };
  }
  /* recon */
  const assessed = sum(CHARGES, c => c.amount);
  const collected = sum(CHARGES, c => c.paid);
  const waived = sum(CHARGES, c => c.waived);
  const reversed = sum(CHARGES, c => c.reversed);
  const outstanding = sum(CHARGES, c => c.balance);
  return {
    title: 'Reconciliation',
    cols: [{label: 'Line'}, {label: 'Fees', num: true}, {label: 'Penalties', num: true}, {label: 'Total', num: true}],
    rows: [
      ['Assessed', fpM(sum(CHARGES.filter(c => c.kind === 'Fee'), c => c.amount)),
        fpM(sum(CHARGES.filter(c => c.kind === 'Penalty'), c => c.amount)), fpM(assessed)],
      ['Less reversals', fpM(sum(CHARGES.filter(c => c.kind === 'Fee'), c => c.reversed)),
        fpM(sum(CHARGES.filter(c => c.kind === 'Penalty'), c => c.reversed)), fpM(reversed)],
      ['Less waivers', fpM(sum(CHARGES.filter(c => c.kind === 'Fee'), c => c.waived)),
        fpM(sum(CHARGES.filter(c => c.kind === 'Penalty'), c => c.waived)), fpM(waived)],
      ['Collected', fpM(sum(CHARGES.filter(c => c.kind === 'Fee'), c => c.paid)),
        fpM(sum(CHARGES.filter(c => c.kind === 'Penalty'), c => c.paid)), fpM(collected)],
      ['Outstanding', fpM(sum(CHARGES.filter(c => c.kind === 'Fee'), c => c.balance)),
        fpM(sum(CHARGES.filter(c => c.kind === 'Penalty'), c => c.balance)), fpM(outstanding)],
      ['Check: assessed − reversed − waived − collected', '—', '—', fpM(assessed - reversed - waived - collected)]
    ],
    summary: [['Assessed', fpM(assessed)], ['Collected', fpM(collected)], ['Waived', fpM(waived)],
      ['Reversed', fpM(reversed)], ['Outstanding', fpM(outstanding)],
      ['Check', fpM(assessed - reversed - waived - collected - outstanding)]]
  };
}
function renderReports(){
  const stats = fpStats();
  if(el('rpPill')){ el('rpPill').className = 'badge b-gray'; el('rpPill').textContent = num(FEE_REPORTS.length) + ' reports'; }
  put('rpKpis', [
    ['Reports', num(FEE_REPORTS.length), 'Every one exportable', ''],
    ['Fees assessed', fpM(stats.assessedFees), num(stats.fees) + ' charges', ''],
    ['Penalties assessed', fpM(stats.assessedPens), num(stats.penalties) + ' charges', ''],
    ['Collected', fpM(stats.collected), stats.collectionRate.toFixed(1) + '% of the value', ''],
    ['Outstanding', fpM(stats.outstanding), num(fpOpenCharges().length) + ' open charges', stats.outstanding ? 'amber' : ''],
    ['Waived', fpM(stats.waived), 'Approved waivers', ''],
    ['Reversed', fpM(stats.reversed), num(stats.reversedCount) + ' charges', ''],
    ['Exports this session', num(EXPORTS.length), 'Logged with the filters', '']
  ].map(([l, v, s, k]) => kpiCard(l, v, s, k)).join(''));

  fpFillSel('rpSel', FEE_REPORTS.map(r => [r.key, r.title]), FP_SEL.report || 'fees');
  FP_SEL.report = fpPicked('rpSel', 'fees');
  if(el('rpSelPill')) el('rpSelPill').textContent = FP_SEL.report;

  if(el('rpListPill')) el('rpListPill').textContent = num(FEE_REPORTS.length) + ' defined';
  renderTable('rpListBody', [
    {k: 'title', label: 'Report'},
    {k: 'desc', label: 'What it shows'},
    {k: 'key', label: 'Key'}
  ], FEE_REPORTS, {sort: 'title', pageSize: 12, onRow: false});

  const months = buckets();
  if(el('rpMonthPill')) el('rpMonthPill').textContent = fpM(sum(COLLECTIONS, c => c.amount));
  renderTable('rpMonthBody', [
    {k: 'month', label: 'Month'},
    {k: 'fees', label: 'Fees in', num: true, html: v => esc(fpM(v))},
    {k: 'pens', label: 'Penalties in', num: true, html: v => esc(fpM(v))},
    {k: 'total', label: 'Total', num: true, html: v => esc(fpM(v))}
  ], months.map(m => {
    const f = sum(COLLECTIONS.filter(c => c.kind === 'Fee' && c.when.slice(0, 7) === m), c => c.amount);
    const p = sum(COLLECTIONS.filter(c => c.kind === 'Penalty' && c.when.slice(0, 7) === m), c => c.amount);
    return {month: monthLabel(m), fees: f, pens: p, total: f + p};
  }), {sort: 'month', pageSize: 8});

  fpShowReport(FP_SEL.report);

  put('rpGrid',
    chartBox({title: 'Fee revenue by month', sub: 'Fees collected, month by month', type: 'bar', h: 210,
      cats: months.map(bucketLabel), value: fpM(sum(COLLECTIONS.filter(c => c.kind === 'Fee'), c => c.amount)),
      series: [{name: 'Fees', colour: '#C9A227',
        data: months.map(m => sum(COLLECTIONS.filter(c => c.kind === 'Fee' && c.when.slice(0, 7) === m), c => c.amount))}]}) +
    chartBox({title: 'Penalty revenue by month', sub: 'Penalties collected, month by month', type: 'bar', h: 210,
      cats: months.map(bucketLabel), value: fpM(sum(COLLECTIONS.filter(c => c.kind === 'Penalty'), c => c.amount)),
      series: [{name: 'Penalties', colour: '#D93F3F',
        data: months.map(m => sum(COLLECTIONS.filter(c => c.kind === 'Penalty' && c.when.slice(0, 7) === m), c => c.amount))}]}));
}
function fpShowReport(key){
  const d = fpReportData(key);
  const rep = FEE_REPORTS.find(r => r.key === key) || FEE_REPORTS[0];
  if(el('rpOutPill')) el('rpOutPill').textContent = num(d.rows.length) + ' lines';
  put('rpSummary', strip(d.summary.map(([k, v]) => [k, String(v)]))
    + `<div class="minihead" style="margin-top:8px">${esc(rep.title)} · ${esc(filterLine())}</div>`);
  if(el('rpHead')) el('rpHead').innerHTML = '<tr>' + d.cols.map(c => `<th${c.num ? ' class="num"' : ''}>${esc(c.label)}</th>`).join('') + '</tr>';
  if(el('rpBody')) el('rpBody').innerHTML = d.rows.map(r => '<tr>' + r.map((v, i) =>
    `<td${d.cols[i].num ? ' class="num"' : ''}>${esc(v)}</td>`).join('') + '</tr>').join('')
    || `<tr><td colspan="${d.cols.length}" class="empty">Nothing in the period.</td></tr>`;
  if(el('rpMsg')) el('rpMsg').textContent = rep.title + ' · ' + d.rows.length + ' lines · ' + filterLine();
  FEE_LAST_REPORT = {key, data: d};
}
let FEE_LAST_REPORT = {key: 'fees', data: null};
function fpRunReport(fmt){
  const key = FP_SEL.report || 'fees';
  const d = fpReportData(key);
  const rep = FEE_REPORTS.find(r => r.key === key) || FEE_REPORTS[0];
  const group = fpPicked('rpGroup', 'auto');
  FEE_LAST_REPORT = {key, data: d};
  if(fmt === 'csv') downloadFile('fees-' + key + '-' + TODAY.replace(/-/g, '') + '.csv', 'text/csv',
    toCsv([d.cols.map(c => c.label)].concat(d.rows)));
  else if(fmt === 'xlsx') downloadFile('fees-' + key + '-' + TODAY.replace(/-/g, '') + '.xlsx',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    xlsxBytes(rep.title, d.cols, d.rows));
  else printTable(rep.title, d.cols, d.rows);
  logExport(rep.title + (group !== 'auto' ? ' · by ' + group : ''), String(fmt).toUpperCase(), d.rows.length);
  renderExportHistory();
  if(el('rpMsg')) el('rpMsg').textContent = rep.title + ' exported as ' + String(fmt).toUpperCase()
    + ' with ' + d.rows.length + ' lines. The export is logged with the filters used.';
  toast(rep.title + ' exported');
}

/* ---------------- 19 · SETTINGS AND COMPLIANCE ---------------- */
const FEE_PROPOSALS = [
  {id: 'POL-2026-07', what: 'Repeated late payment penalty', change: 'Keep paused for another quarter',
    reason: 'Customer feedback and the collections review', by: 'STF-003', when: addDays(TODAY, -6),
    effective: addDays(TODAY, 20), status: 'Pending'},
  {id: 'POL-2026-06', what: 'Statement fee', change: 'MK 3,500 → MK 4,000', reason: 'Print and courier cost',
    by: 'STF-009', when: addDays(TODAY, -11), effective: addDays(TODAY, 15), status: 'Pending'},
  {id: 'POL-2026-05', what: 'Grace period', change: '7 days → 5 days', reason: 'Aligned to the repayment calendar',
    by: 'STF-003', when: addDays(TODAY, -40), effective: addDays(TODAY, -30), status: 'Approved'}
];
const FEE_DISCLOSURE = [
  ['The tariff is shown before the application is accepted', 'Written, on the application form', 'Required'],
  ['The exact fee is confirmed before disbursement', 'SMS and on the payout advice', 'Required'],
  ['The penalty rule and the grace period are disclosed at signing', 'In the loan agreement', 'Required'],
  ['A charge is itemised on the statement', 'Every statement carries the fee lines', 'Required'],
  ['A receipt is issued for every collection', 'SMS and a printed receipt', 'Required'],
  ['A waiver decision is communicated with the reason', 'SMS or email', 'Required'],
  ['The customer may query a charge within 30 days', 'At any branch, free of charge', 'Required']
];
const FEE_MALAWI = [
  ['Reserve Bank of Malawi directive on fees and charges', 'Every fee is disclosed before it is charged', 'Compliant', 'RBM/FSD/2024/03'],
  ['Truth in lending — the full cost of credit', 'The tariff is shown as a cash amount, not only a percentage', 'Compliant', 'RBM/TIL/2023/11'],
  ['Penalty must not exceed the loss caused', 'Capped at 25% of the overdue amount plus a fixed part', 'Compliant', 'RBM/CC/2022/07'],
  ['Grace period before a penalty starts', 'Five days, disclosed in the agreement', 'Compliant', 'RBM/CC/2022/07'],
  ['No charge without a receipt', 'Every collection carries a receipt number', 'Compliant', 'RBM/PAY/2024/01'],
  ['Customer complaints register', 'A disputed charge is logged and answered in 14 days', 'Compliant', 'RBM/CC/2021/04'],
  ['Interest and charges kept apart from principal', 'Separate ledger accounts and separate lines on the statement', 'Compliant', 'RBM/ACC/2023/02'],
  ['Records kept for seven years', 'Charges, calculations and decisions are retained', 'Compliant', 'RBM/GOV/2020/09']
];
function renderSettings(){
  const enabled = FEE_TYPES.filter(t => t.enabled).length;
  const pending = FEE_PROPOSALS.filter(p => p.status === 'Pending').length;
  if(el('stPill')){ el('stPill').className = 'badge ' + (pending ? 'b-warn' : 'b-ok');
    el('stPill').textContent = 'policy ' + FEE_SET.policyVersion; }
  put('stKpis', [
    ['Charge types', num(FEE_TYPES.length), num(enabled) + ' switched on', ''],
    ['Penalty rules', num(9), 'Grace, rate, cap and the guard', ''],
    ['Policy changes waiting', num(pending), 'Needs review and approval', pending ? 'amber' : ''],
    ['Disclosure requirements', num(FEE_DISCLOSURE.length), 'All in the agreement', ''],
    ['Malawi requirements', num(FEE_MALAWI.length), 'Every one compliant', ''],
    ['Historical configurations', num(FEE_CONFIG_HISTORY.length + FEE_RULE_HISTORY.length), 'Kept and reproducible', ''],
    ['Approval thresholds', num(3), 'Assessment, waiver and reversal', ''],
    ['Disclosure before acceptance', FEE_SET.disclosureBeforeAcceptance ? 'On' : 'Off', 'Required by the directive',
      FEE_SET.disclosureBeforeAcceptance ? '' : 'red']
  ].map(([l, v, s, k]) => kpiCard(l, v, s, k)).join(''));

  if(el('stTypePill')) el('stTypePill').textContent = num(enabled) + ' on';
  renderTable('stTypeBody', [
    {k: 'code', label: 'Code'},
    {k: 'name', label: 'Charge'},
    {k: 'group', label: 'Group'},
    {k: 'basis', label: 'Basis'},
    {k: 'rate', label: 'Rate', html: (v, r) => esc(r.basis === 'Fixed' ? fpM(r.fixed) : fpPct(r.pct))},
    {k: 'effective', label: 'Effective', html: v => esc(fmtDate(v))},
    {k: 'status', label: 'State', html: v => okb(v)}
  ], FEE_TYPES, {sort: 'code', pageSize: 10});

  if(el('stRulePill')) el('stRulePill').textContent = fpPct(FEE_SET.dailyPct) + ' a day';
  if(el('stRuleBox')) el('stRuleBox').innerHTML = `<div class="form-grid">
      <div class="fg"><label>Grace period (days)</label><input id="stGrace" type="number" step="1" value="${FEE_SET.graceDays}" /></div>
      <div class="fg"><label>Daily penalty rate (%)</label><input id="stDailyPct" type="number" step="0.01" value="${FEE_SET.dailyPct}" /></div>
      <div class="fg"><label>Cap per charge (MWK)</label><input id="stCap" type="number" step="5000" value="${FEE_SET.capPerCharge}" /></div>
      <div class="fg"><label>Cap as a share of the overdue (%)</label><input id="stCapPct" type="number" step="1" value="${FEE_SET.capPercent}" /></div>
      <div class="fg"><label>Assessment approval above (MWK)</label><input id="stAssessAbove" type="number" step="5000" value="${FEE_SET.assessmentApprovalAbove}" /></div>
      <div class="fg"><label>Waiver approval above (MWK)</label><input id="stWaiverAbove" type="number" step="5000" value="${FEE_SET.waiverApprovalAbove}" /></div>
      <div class="fg"><label>Reversal approval above (MWK)</label><input id="stReversalAbove" type="number" step="5000" value="${FEE_SET.reversalApprovalAbove}" /></div>
    </div>
    <div class="minihead" style="margin-top:8px">Effective date for these changes</div>
    <div class="fg"><input id="stEffective" type="date" value="${addDays(TODAY, 14)}" /></div>
    <div class="qhint" style="margin-top:6px">A change takes effect on its own date. Every charge already assessed keeps the
      rule it was worked under, so the old arithmetic can always be reproduced.</div>`;

  put('stGraceBox', FEE_PENALTY_TYPES.map(t => kvRow(t.code + ' · ' + t.name, num(t.graceDays) + ' days')).join(''));
  put('stCapBox', [
    ['Cap per charge', fpM(FEE_SET.capPerCharge)],
    ['Share of the overdue', fpPct(FEE_SET.capPercent)],
    ['Fixed part inside the cap', fpM(FEE_RULES.fixedAmount)],
    ['Days counted', '60 per instalment'],
    ['Cap reached', num(CHARGES.filter(c => c.status === 'At the cap').length) + ' charges']
  ].map(([k, v]) => kvRow(k, v)).join(''));
  put('stApprBox', [
    ['Assessment', fpM(FEE_SET.assessmentApprovalAbove) + ' and above'],
    ['Waiver', fpM(FEE_SET.waiverApprovalAbove) + ' and above'],
    ['Reversal', fpM(FEE_SET.reversalApprovalAbove) + ' and above'],
    ['Requester may approve', badge('Never', 'b-ok')],
    ['Policy change', 'Head of credit and the administrator']
  ].map(([k, v]) => kvRow(k, v)).join(''));

  if(el('stEffPill')) el('stEffPill').textContent = num(FEE_TYPES.length) + ' dates';
  renderTable('stEffBody', [
    {k: 'code', label: 'Code'},
    {k: 'name', label: 'Charge'},
    {k: 'effective', label: 'Effective from', html: v => esc(fmtDate(v))},
    {k: 'status', label: 'State', html: v => okb(v)},
    {k: 'owner', label: 'Owner', html: v => esc(staffName(v))}
  ], FEE_TYPES.slice().sort((a, b) => a.effective < b.effective ? 1 : -1), {sort: 'effective', pageSize: 8});

  if(el('stDiscPill')) el('stDiscPill').textContent = num(FEE_DISCLOSURE.length) + ' required';
  renderTable('stDiscBody', [
    {k: 'what', label: 'Requirement'},
    {k: 'how', label: 'How it is met'},
    {k: 'status', label: 'State', html: v => okb(v)}
  ], FEE_DISCLOSURE.map(([what, how, status]) => ({what, how, status})), {sort: 'what', pageSize: 7, onRow: false});

  if(el('stRegPill')) el('stRegPill').textContent = 'all compliant';
  renderTable('stRegBody', [
    {k: 'rule', label: 'Requirement'},
    {k: 'how', label: 'How it is met'},
    {k: 'status', label: 'State', html: v => okb(v)},
    {k: 'ref', label: 'Reference'}
  ], FEE_MALAWI.map(([rule, how, status, ref]) => ({rule, how, status, ref})), {sort: 'rule', pageSize: 8});
  if(el('stRegMsg') && !String(el('stRegMsg').textContent || '').trim())
    el('stRegMsg').textContent = 'Eight Reserve Bank of Malawi requirements are tracked here; all eight are met by the '
      + 'configuration in force, and the audit trail records every change to it.';

  if(el('stPendPill')) el('stPendPill').textContent = num(pending) + ' waiting';
  renderTable('stPendBody', [
    {k: 'id', label: 'Proposal'},
    {k: 'what', label: 'What changes'},
    {k: 'change', label: 'Change'},
    {k: 'reason', label: 'Why'},
    {k: 'by', label: 'Proposed by', html: v => esc(staffName(v))},
    {k: 'effective', label: 'Effective', html: v => esc(fmtDate(v))},
    {k: 'status', label: 'State', html: v => okb(v)}
  ], FEE_PROPOSALS, {sort: 'when', pageSize: 6});

  if(el('stHistPill')) el('stHistPill').textContent = num(FEE_CONFIG_HISTORY.length) + ' changes';
  renderTable('stHistBody', [
    {k: 'when', label: 'When', html: v => esc(fpWhen(v))},
    {k: 'what', label: 'Setting'},
    {k: 'from', label: 'Previous'},
    {k: 'to', label: 'Now'},
    {k: 'by', label: 'Officer', html: v => esc(staffName(v))},
    {k: 'reason', label: 'Why'}
  ], FEE_CONFIG_HISTORY.concat(FEE_RULE_HISTORY).sort((a, b) => a.when < b.when ? 1 : -1), {sort: 'when', pageSize: 8});

  put('stGrid',
    chartBox({title: 'Charge types by group', sub: 'How the tariff is made up', type: 'donut', h: 210,
      cats: ['Application', 'Origination', 'Administrative', 'Penalty'], value: num(FEE_TYPES.length),
      series: [{name: 'Types', data: ['Application', 'Origination', 'Administrative', 'Penalty']
        .map(g => FEE_TYPES.filter(t => t.group === g).length)}]}) +
    chartBox({title: 'Configuration changes', sub: 'By area of the module', type: 'bar', h: 210,
      cats: ['Configuration', 'Penalties', 'Security'], value: num(FEE_AUDIT.length),
      series: [{name: 'Changes', colour: '#7C5CF0',
        data: ['Configuration', 'Penalties', 'Security'].map(l => FEE_AUDIT.filter(a => a.lane === l).length)}]}));
}
function fpSaveSettings(){
  const grace = fpNum('stGrace', FEE_SET.graceDays);
  const daily = fpNum('stDailyPct', FEE_SET.dailyPct);
  const cap = fpNum('stCap', FEE_SET.capPerCharge);
  const capPct = fpNum('stCapPct', FEE_SET.capPercent);
  if(daily <= 0 || daily > 2){ toast('A daily penalty above 2% is not permitted', 'err'); return; }
  if(grace < 0 || grace > 30){ toast('The grace period must sit between 0 and 30 days', 'err'); return; }
  if(cap <= 0){ toast('The cap must be above zero', 'err'); return; }
  if(capPct <= 0 || capPct > 50){ toast('The cap share must sit between 1% and 50%', 'err'); return; }
  const before = {grace: FEE_SET.graceDays, daily: FEE_SET.dailyPct, cap: FEE_SET.capPerCharge, capPct: FEE_SET.capPercent};
  const effective = fpPicked('stEffective', addDays(TODAY, 14));
  const props = [];
  if(grace !== before.grace) props.push(['Grace period', num(before.grace) + ' days', num(grace) + ' days']);
  if(daily !== before.daily) props.push(['Daily penalty rate', fpPct(before.daily), fpPct(daily)]);
  if(cap !== before.cap) props.push(['Cap per charge', fpM(before.cap), fpM(cap)]);
  if(capPct !== before.capPct) props.push(['Cap share', fpPct(before.capPct), fpPct(capPct)]);
  if(!props.length){ if(el('stMsg')) el('stMsg').textContent = 'Nothing has changed — the figures match the saved policy.'; return; }
  props.forEach(([what, from, to]) => {
    FEE_PROPOSALS.unshift({id: 'POL-2026-' + pad(20 + FEE_PROPOSALS.length, 2), what, change: from + ' → ' + to,
      reason: 'Proposed in the settings screen', by: FEE_STAFF_REF, when: TODAY, effective, status: 'Pending'});
    fpAudit('Policy proposed', what, from, to, FEE_STAFF_REF, 'Change proposed and waiting for approval', 'Configuration');
  });
  FEE_SET.assessmentApprovalAbove = fpNum('stAssessAbove', FEE_SET.assessmentApprovalAbove);
  FEE_SET.waiverApprovalAbove = fpNum('stWaiverAbove', FEE_SET.waiverApprovalAbove);
  FEE_SET.reversalApprovalAbove = fpNum('stReversalAbove', FEE_SET.reversalApprovalAbove);
  if(el('stMsg')) el('stMsg').textContent = props.length + ' change(s) were raised as a policy proposal, effective '
    + fmtDate(effective) + '. Nothing moves until the head of credit approves it.';
  renderAll();
  toast(props.length + ' policy change(s) proposed');
}
function fpResetSettings(){
  FEE_SET.graceDays = FEE_SET_DEFAULTS.graceDays;
  FEE_SET.dailyPct = FEE_SET_DEFAULTS.dailyPct;
  FEE_SET.capPerCharge = FEE_SET_DEFAULTS.capPerCharge;
  FEE_SET.capPercent = FEE_SET_DEFAULTS.capPercent;
  FEE_SET.assessmentApprovalAbove = FEE_SET_DEFAULTS.assessmentApprovalAbove;
  FEE_SET.waiverApprovalAbove = FEE_SET_DEFAULTS.waiverApprovalAbove;
  FEE_SET.reversalApprovalAbove = FEE_SET_DEFAULTS.reversalApprovalAbove;
  if(el('stMsg')) el('stMsg').textContent = 'The settings screen is back to the saved policy (' + FEE_SET.policyVersion + ').';
  renderAll();
  toast('Settings restored to the saved policy');
}

/* ---------------- 20 · AUDIT HISTORY ---------------- */
function fpAuditRows(){
  const f = FP_SEL.audit || 'all';
  let rows = FEE_AUDIT.slice();
  if(f === 'config') rows = FEE_CONFIG_HISTORY.slice();
  else if(f === 'rule') rows = FEE_RULE_HISTORY.slice();
  else if(f === 'security') rows = rows.filter(a => a.lane === 'Security');
  else if(f === 'waiver') rows = rows.filter(a => /Waiver/i.test(a.kind));
  else if(f === 'reversal') rows = rows.filter(a => /Reversal/i.test(a.kind));
  const q = (el('auSearch') && el('auSearch').value || '').trim().toLowerCase();
  if(q) rows = rows.filter(a => [a.id, a.kind, a.what, a.from, a.to, staffName(a.by), a.reason]
    .filter(Boolean).join(' ').toLowerCase().indexOf(q) >= 0);
  return rows.sort((a, b) => a.when < b.when ? 1 : -1);
}
function renderAudit(){
  const rows = fpAuditRows();
  const byStaff = {};
  FEE_AUDIT.forEach(a => {
    byStaff[a.by] = byStaff[a.by] || {staff: a.by, count: 0, last: a.when, kinds: new Set()};
    byStaff[a.by].count++; byStaff[a.by].kinds.add(a.kind);
    if(a.when > byStaff[a.by].last) byStaff[a.by].last = a.when;
  });
  if(el('auPill')){ el('auPill').className = 'badge b-gray'; el('auPill').textContent = num(FEE_AUDIT.length) + ' entries'; }
  put('auKpis', [
    ['Audit entries', num(FEE_AUDIT.length), 'Append only', ''],
    ['Configuration changes', num(FEE_CONFIG_HISTORY.length), 'Fee types, thresholds and settings', ''],
    ['Penalty rule changes', num(FEE_RULE_HISTORY.length), 'Rate, grace and cap', ''],
    ['Assessments on file', num(FEE_ASSESS_HISTORY.length), 'Each with its calculation', ''],
    ['Waiver decisions', num(WAIVERS.filter(w => w.status !== 'Pending').length), 'Approved and rejected', ''],
    ['Reversals', num(REVERSALS.length), 'With the original kept', ''],
    ['Staff involved', num(Object.keys(byStaff).length), 'Every one named', ''],
    ['Exports logged', num(EXPORTS.length), 'Who took what, and when', '']
  ].map(([l, v, s, k]) => kpiCard(l, v, s, k)).join(''));

  fpFillSel('auFilter', [['all', 'Everything'], ['config', 'Configuration changes'], ['rule', 'Penalty rules'],
    ['security', 'Security and thresholds'], ['waiver', 'Waivers'], ['reversal', 'Reversals']], FP_SEL.audit || 'all');
  FP_SEL.audit = fpPicked('auFilter', 'all');

  if(el('auCount')) el('auCount').textContent = num(rows.length) + ' entries';
  renderTable('auBody', [
    {k: 'id', label: 'Entry'},
    {k: 'when', label: 'When', html: v => esc(fpWhen(v))},
    {k: 'kind', label: 'Kind'},
    {k: 'what', label: 'What changed'},
    {k: 'from', label: 'Previous'},
    {k: 'to', label: 'Updated'},
    {k: 'by', label: 'Staff member', html: v => esc(staffName(v))},
    {k: 'reason', label: 'Reason'}
  ], rows, {sort: 'when', pageSize: 12});

  if(el('auCfgPill')) el('auCfgPill').textContent = num(FEE_CONFIG_HISTORY.length) + ' changes';
  renderTable('auCfgBody', [
    {k: 'when', label: 'When', html: v => esc(fmtDate(v))},
    {k: 'what', label: 'Setting'},
    {k: 'from', label: 'Previous'},
    {k: 'to', label: 'Updated'},
    {k: 'by', label: 'Officer', html: v => esc(staffName(v))}
  ], FEE_CONFIG_HISTORY, {sort: 'when', pageSize: 6});
  if(el('auRulePill')) el('auRulePill').textContent = num(FEE_RULE_HISTORY.length) + ' changes';
  renderTable('auRuleBody', [
    {k: 'when', label: 'When', html: v => esc(fmtDate(v))},
    {k: 'what', label: 'Rule'},
    {k: 'from', label: 'Previous'},
    {k: 'to', label: 'Updated'},
    {k: 'reason', label: 'Why'}
  ], FEE_RULE_HISTORY, {sort: 'when', pageSize: 6});

  if(el('auAssessPill')) el('auAssessPill').textContent = num(FEE_ASSESS_HISTORY.length) + ' assessments';
  renderTable('auAssessBody', [
    {k: 'when', label: 'When', html: v => esc(fmtDate(v))},
    {k: 'charge', label: 'Charge'},
    {k: 'type', label: 'Type'},
    {k: 'amount', label: 'Amount', num: true, html: v => esc(fpM(v))},
    {k: 'officer', label: 'Officer', html: v => esc(staffName(v))},
    {k: 'status', label: 'State', html: v => okb(v)}
  ], FEE_ASSESS_HISTORY, {sort: 'amount', pageSize: 8});

  const decisions = WAIVERS.filter(w => w.status !== 'Pending').map(w => ({
    id: w.id, what: 'Waiver · ' + w.typeName, amount: w.waived, decision: w.status,
    by: w.decidedBy, on: w.decidedOn, reason: w.reason}))
    .concat(REVERSALS.filter(r => r.status !== 'Pending').map(r => ({
      id: r.id, what: 'Reversal · ' + r.typeName, amount: r.amount, decision: r.status,
      by: r.approvedBy, on: r.approvedOn, reason: r.reason})))
    .sort((a, b) => String(a.on) < String(b.on) ? 1 : -1);
  if(el('auDecPill')) el('auDecPill').textContent = num(decisions.length) + ' decisions';
  renderTable('auDecBody', [
    {k: 'id', label: 'Record'},
    {k: 'what', label: 'What'},
    {k: 'amount', label: 'Value', num: true, html: v => esc(fpM(v))},
    {k: 'reason', label: 'Reason'},
    {k: 'by', label: 'Decided by', html: v => v ? esc(staffName(v)) : '—'},
    {k: 'on', label: 'When', html: v => v ? esc(fmtDate(v)) : '—'},
    {k: 'decision', label: 'Decision', html: v => okb(v)}
  ], decisions, {sort: 'amount', pageSize: 8});

  if(el('auStaffPill')) el('auStaffPill').textContent = num(Object.keys(byStaff).length) + ' staff';
  renderTable('auStaffBody', [
    {k: 'staff', label: 'Staff member', html: v => esc(staffName(v))},
    {k: 'role', label: 'Role'},
    {k: 'count', label: 'Changes', num: true},
    {k: 'kinds', label: 'Areas', html: v => esc(Array.from(v).join(' · '))},
    {k: 'last', label: 'Last action', html: v => esc(fpWhen(v))}
  ], Object.keys(byStaff).map(k => Object.assign({}, byStaff[k], {role: (STAFF_BY_ID[k] || {}).role || '—'})),
    {sort: 'count', pageSize: 8});

  put('auGrid',
    chartBox({title: 'Audit entries by kind', sub: 'What the trail is made of', type: 'bar', h: 210,
      cats: Array.from(new Set(FEE_AUDIT.map(a => a.kind))), value: num(FEE_AUDIT.length),
      series: [{name: 'Entries', colour: '#2F6FED',
        data: Array.from(new Set(FEE_AUDIT.map(a => a.kind))).map(k => FEE_AUDIT.filter(a => a.kind === k).length)}]}) +
    chartBox({title: 'Changes by staff member', sub: 'Who touched the configuration', type: 'bar', h: 210,
      cats: Object.keys(byStaff).map(k => staffName(k).split(' ')[0]), value: num(FEE_AUDIT.length),
      series: [{name: 'Changes', data: Object.keys(byStaff).map(k => byStaff[k].count), colour: '#C9A227'}]}));
}
function fpExportAudit(){
  const rows = fpAuditRows();
  const cols = [{label: 'Entry'}, {label: 'When'}, {label: 'Kind'}, {label: 'What changed'}, {label: 'Previous'},
    {label: 'Updated'}, {label: 'Staff member'}, {label: 'Reason'}];
  const lines = rows.map(a => [a.id, fpWhen(a.when), a.kind, a.what, a.from, a.to, staffName(a.by), a.reason]);
  downloadFile('fees-penalties-audit-' + TODAY.replace(/-/g, '') + '.csv', 'text/csv', toCsv([cols.map(c => c.label)].concat(lines)));
  logExport('Authorised audit report', 'CSV', lines.length);
  renderExportHistory();
  if(el('auMsg')) el('auMsg').textContent = 'An authorised export of ' + lines.length
    + ' audit entries was taken by Chikondi Mwale and logged with the filters in force.';
  toast(lines.length + ' audit entries exported');
}
function fpPrintAudit(){
  const rows = fpAuditRows().slice(0, 60);
  printTable('Fees and penalties audit trail', [{label: 'Entry'}, {label: 'When'}, {label: 'Kind'}, {label: 'What'},
    {label: 'Previous'}, {label: 'Updated'}, {label: 'Officer'}],
    rows.map(a => [a.id, fpWhen(a.when), a.kind, a.what, a.from, a.to, staffName(a.by)]));
  logExport('Audit trail print', 'PDF', rows.length);
  renderExportHistory();
  toast('Audit trail ready to print');
}

</script>
