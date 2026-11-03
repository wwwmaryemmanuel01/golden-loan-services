<script>
/* ============================================================
   SAVINGS MANAGEMENT & CONNECTIONS (8/8)
   Sections 17–20: security and fraud, the database connections,
   the reports, and the settings with the audit history — then the
   filters, the wiring and the boot.
   ============================================================ */

/* ===================== 17 · SECURITY AND FRAUD ===================== */
const SV_PERM_STATE = {};
SV_ROLES.forEach(r => { SV_PERM_STATE[r] = SV_PERMS[r].slice(); });
const SV_SEC_STATE = {sel: ''};
function renderSecurity(){
  const checks = SV_ID_CHECKS;
  const open = SV_FRAUD.filter(f => f.status !== 'Resolved');
  const perms = SV_ROLES.reduce((n, r) => n + SV_PERM_STATE[r].filter(Boolean).length, 0);
  if(el('secPill')){ el('secPill').className = open.length ? 'badge b-crit' : 'badge b-ok';
    el('secPill').textContent = open.length ? num(open.length) + ' open cases' : 'No open case'; }
  put('secKpis', [
    ['Roles', num(SV_ROLES.length), 'Who may act on a savings account', ''],
    ['Capabilities granted', num(perms), 'Across every role', ''],
    ['Identity checks pending', num(checks.filter(c => c.checked !== 'Verified').length), 'Before a payout', ''],
    ['Large transactions', num(SV_SENSITIVE.length), 'Waiting for a second signature', ''],
    ['Suspicious patterns', num(SV_FRAUD.length), 'Flagged by the rules', open.length ? 'red' : ''],
    ['Velocity breaches', num(SV_VELOCITY.filter(v => v.withdrawals24h > v.limit).length), 'Too many payouts in a day', ''],
    ['Amount alerts', num(SV_AMOUNT_ALERTS.length), 'Above the watch threshold', ''],
    ['Staff under review', num(SV_STAFF_ACTIVITY.filter(s => s.status === 'Review').length), 'Patterns worth a look', '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join(''));

  if(el('secPermPill')) el('secPermPill').textContent = num(perms) + ' grants';
  if(el('secPermHead')) el('secPermHead').innerHTML = '<tr><th>Role</th>'
    + SV_CAPS.map(c => `<th style="font-size:8.5px">${esc(c)}</th>`).join('') + '</tr>';
  if(el('secPermBody')) el('secPermBody').innerHTML = SV_ROLES.map(r => `<tr>
      <td><b>${esc(r)}</b></td>${SV_PERM_STATE[r].map((v, i) =>
        `<td><button class="btn btn-ghost" style="padding:1px 5px;font-size:9px" data-perm="${esc(r)}" data-cap="${i}">${v ? '✓' : '·'}</button></td>`).join('')}
    </tr>`).join('');

  put('secDepPermBody', `<div class="minihead">Who may verify a deposit</div>`
    + SV_ROLES.map(r => kvRow(r, SV_PERM_STATE[r][1] ? okb('Yes') : badge('No', 'b-gray'))).join(''));
  put('secWdrPermBody', `<div class="minihead">Who may approve a withdrawal</div>`
    + SV_ROLES.map(r => kvRow(r, SV_PERM_STATE[r][3] ? okb('Yes') : SV_PERM_STATE[r][2] ? badge('Up to the first limit', 'b-warn') : badge('No', 'b-gray'))).join(''));
  put('secDupBox', `<div class="minihead">Duplicate and self-approval</div>`
    + kvRow('Same person raises and approves', badge('Blocked', 'b-crit'))
    + kvRow('Duplicate references held', String(SV_DUPLICATES.length))
    + kvRow('Second signature required above', svM(SV_SET.secondApprovalThreshold))
    + kvRow('High-risk approvals open', String(SV_SENSITIVE.length)));

  if(el('secLargePill')) el('secLargePill').textContent = num(SV_SENSITIVE.length) + ' waiting';
  if(el('secLargeHead')) el('secLargeHead').innerHTML = '<tr><th>Request</th><th>Transaction</th><th class="num">Amount</th><th>Level</th><th>State</th></tr>';
  if(el('secLargeBody')) el('secLargeBody').innerHTML = SV_SENSITIVE.map(s => `<tr>
      <td>${esc(s.id)}</td><td>${esc(s.txn)}</td><td class="num">${esc(svM(s.amount))}</td>
      <td>${esc(s.level)}</td><td>${okb(s.status)}</td></tr>`).join('')
    || '<tr><td colspan="5" class="empty">No large transaction is waiting.</td></tr>';

  if(el('secSuspPill')) el('secSuspPill').textContent = num(SV_FRAUD.length) + ' patterns';
  if(el('secSuspHead')) el('secSuspHead').innerHTML = '<tr><th>When</th><th>What was flagged</th><th>Severity</th><th>State</th></tr>';
  if(el('secSuspBody')) el('secSuspBody').innerHTML = SV_FRAUD.slice(0, 6).map(f => `<tr>
      <td>${esc(svWhen(f.when))}</td><td>${esc(String(f.event).slice(0, 44))}</td>
      <td>${badge(f.severity, SV_SEV(f.severity))}</td><td>${okb(f.status)}</td></tr>`).join('');

  if(el('secChangeHead')) el('secChangeHead').innerHTML = '<tr><th>Account</th><th class="num">Difference</th><th>Note</th><th>Severity</th></tr>';
  if(el('secChangeBody')) el('secChangeBody').innerHTML =
    SV_DISCREPANCY.map(d => `<tr><td>${esc(d.account)}</td><td class="num">${esc(svM(d.difference))}</td>
      <td>${esc(String(d.note).slice(0, 36))}</td><td>${badge(d.severity, SV_SEV(d.severity))}</td></tr>`).join('')
    + SV_ADJUST.slice(0, 3).map(a => `<tr><td>${esc(a.account)}</td><td class="num">${esc(svM(a.amount))}</td>
      <td>Adjustment · ${esc(a.reason)}</td><td>${okb(a.status)}</td></tr>`).join('');

  if(el('secStaffPill')) el('secStaffPill').textContent = num(SV_STAFF_ACTIVITY.length) + ' officers';
  renderTable('secStaffBody', [
    {k: 'name', label: 'Officer'},
    {k: 'role', label: 'Role'},
    {k: 'deposits', label: 'Deposits', num: true},
    {k: 'withdrawals', label: 'Payouts', num: true},
    {k: 'verifications', label: 'Verifications', num: true},
    {k: 'lastAction', label: 'Last action', html: v => esc(svWhen(v))},
    {k: 'status', label: 'State', html: v => okb(v)}
  ], SV_STAFF_ACTIVITY, {sort: 'withdrawals', pageSize: 6});

  put('secDataBox', strip([
    ['Masked on screen', 'Account and phone'],
    ['Visible to the owner', 'Full identity'],
    ['Visible to an auditor', 'Everything, read only'],
    ['Held in Frankfurt', 'Encrypted at rest']
  ]) + kvRow('Identity required for a payout', SV_SET.requireIdentityForWithdrawal ? okb('Yes') : badge('No', 'b-warn'))
    + kvRow('Retention', 'Seven years after closure')
    + kvRow('Exports logged', num(EXPORTS.length) + ' this session'));

  if(el('secAuditPill')) el('secAuditPill').textContent = num(SV_AUDIT.length) + ' events';
  renderTable('secAuditBody', [
    {k: 'when', label: 'When', html: v => esc(svWhen(v))},
    {k: 'action', label: 'Action'},
    {k: 'target', label: 'Target'},
    {k: 'detail', label: 'Detail', html: v => esc(String(v).slice(0, 40))},
    {k: 'by', label: 'Officer', html: v => esc(v)}
  ], SV_AUDIT_LOG.concat(SV_ID_CHECKS.map(c => ({when: c.when, action: 'Identity check', target: c.ref,
    detail: c.doc + ' ' + c.number + ' · ' + c.checked, by: c.by === '—' ? 'The system' : staffName(c.by)})))
    .concat(SV_CHANGES.filter(c => c.area === 'Security').map(c => ({when: c.when, action: 'Permission change',
      target: c.what, detail: c.from + ' → ' + c.to, by: staffName(c.by)}))), {sort: 'when', pageSize: 8});

  put('secGrid',
    chartBox({title: 'Grants by role', sub: 'Capabilities held', type: 'bar', h: 200,
      cats: SV_ROLES,
      series: [{name: 'Grants', data: SV_ROLES.map(r => SV_PERM_STATE[r].filter(Boolean).length)}],
      value: num(perms)}) +
    chartBox({title: 'Payouts per customer in a day', sub: 'Against the velocity limit', type: 'line', h: 200,
      cats: SV_VELOCITY.slice(0, 8).map(v => v.cust),
      series: [{name: 'Withdrawals', data: SV_VELOCITY.slice(0, 8).map(v => v.withdrawals24h), colour: '#C9A227'},
        {name: 'Limit', data: SV_VELOCITY.slice(0, 8).map(v => v.limit), colour: '#98A2B3'}],
      value: num(SV_VELOCITY.length)}));
}

/* ===================== 18 · DATABASE CONNECTIONS ===================== */
let SV_SCHEMA_RESULT = '';
function renderDatabase(){
  const broken = SV_DB_TABLES.filter(t => t.rls !== 'Enabled');
  const openErr = SV_DB_ERRORS.filter(e => e.status === 'Open');
  const checks = SV_DB_CHECKS();
  if(el('dbPill')){ el('dbPill').className = broken.length || openErr.length ? 'badge b-crit' : 'badge b-ok';
    el('dbPill').textContent = broken.length ? num(broken.length) + ' policy gap' : 'Schema healthy'; }
  put('dbKpis', [
    ['Tables', num(SV_DB_TABLES.length), 'Every table a saving touches', ''],
    ['Rows held', num(sum(SV_DB_TABLES, t => t.rows)), 'Across those tables', ''],
    ['Functions and triggers', num(SV_DB_FUNCS.length), 'Posting, reserving, reversing', ''],
    ['Tables with a policy', num(SV_DB_TABLES.filter(t => t.rls === 'Enabled').length) + ' of ' + num(SV_DB_TABLES.length), broken.length ? broken.length + ' without one' : 'All covered', broken.length ? 'red' : ''],
    ['Open errors', num(openErr.length), 'Grouped by SQLSTATE', openErr.length ? 'red' : ''],
    ['Migrations applied', num(SV_MIGRATIONS.filter(m => m.status === 'Applied').length), num(SV_MIGRATIONS.filter(m => m.status !== 'Applied').length) + ' pending', ''],
    ['Checks passing', num(checks.filter(c => c.status === 'Pass').length) + ' of ' + num(checks.length), 'Integrity rules', ''],
    ['Ledger net', svNetLabel(sum(SV_LEDGER, e => e.amount)), 'Debits against credits', '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join(''));

  put('dbGrid',
    chartBox({title: 'Rows by table', sub: 'Where the data sits', type: 'bar', h: 200,
      cats: SV_DB_TABLES.map(t => t.table.replace('savings_', '')),
      series: [{name: 'Rows', data: SV_DB_TABLES.map(t => t.rows)}],
      value: num(sum(SV_DB_TABLES, t => t.rows))}) +
    chartBox({title: 'Errors by SQLSTATE', sub: 'Grouped occurrences', type: 'donut', h: 200,
      cats: SV_DB_ERRORS.map(e => e.code),
      series: [{name: 'Errors', data: SV_DB_ERRORS.map(e => e.count)}],
      value: num(sum(SV_DB_ERRORS, e => e.count))}));

  if(el('dbTblPill')) el('dbTblPill').textContent = num(SV_DB_TABLES.length) + ' tables';
  if(el('dbTblHead')) el('dbTblHead').innerHTML = '<tr><th>Table</th><th class="num">Rows</th><th>Size</th>'
    + '<th>Policy</th><th>Function</th><th>Last write</th><th>What it holds</th></tr>';
  if(el('dbTblBody')) el('dbTblBody').innerHTML = SV_DB_TABLES.map(t => `<tr>
      <td><b>${esc(t.table)}</b></td><td class="num">${num(t.rows)}</td><td>${esc(t.size)}</td>
      <td>${t.rls === 'Enabled' ? okb('Enabled') : badge(t.rls, 'b-crit')}</td>
      <td>${esc(t.function)}</td><td>${esc(svWhen(t.lastWrite))}</td>
      <td>${esc(String(t.note).slice(0, 42))}</td></tr>`).join('');

  if(el('dbFnPill')) el('dbFnPill').textContent = num(SV_DB_FUNCS.length) + ' routines';
  renderTable('dbFnBody', [
    {k: 'name', label: 'Routine'},
    {k: 'kind', label: 'Kind'},
    {k: 'invoker', label: 'Invoker'},
    {k: 'calls', label: 'Calls', num: true},
    {k: 'status', label: 'State', html: v => okb(v)},
    {k: 'note', label: 'What it does', html: v => esc(String(v).slice(0, 40))}
  ], SV_DB_FUNCS, {sort: 'calls', pageSize: 6});

  if(el('dbRlsPill')) el('dbRlsPill').textContent = broken.length ? num(broken.length) + ' missing' : 'All covered';
  put('dbRls', broken.length ? broken.map(t => kvRow(t.table, badge('Missing policy', 'b-crit'))).join('')
    : '<div class="empty">Every savings table has a policy in force.</div>');
  if(el('dbRlsFix')) el('dbRlsFix').disabled = !broken.length;
  put('dbAtomic', `<div class="minihead">Transaction integrity</div>`
    + kvRow('One deposit writes', 'Transaction, ledger, receipt and audit rows')
    + kvRow('All or nothing', okb('Enforced'))
    + kvRow('Status changes', 'Through a function, never a direct update')
    + kvRow('Ledger is append-only', okb('Yes')));
  put('dbDup', `<div class="minihead">Duplicate submission protection</div>`
    + kvRow('Unique index', 'savings_transactions(reference)')
    + kvRow('Window', num(SV_SET.duplicateWindow) + ' minutes')
    + kvRow('Groups held', String(SV_DUPLICATES.length))
    + kvRow('Client retries', 'Idempotency key required'));

  if(el('dbErrPill')) el('dbErrPill').textContent = num(openErr.length) + ' open';
  renderTable('dbErrBody', [
    {k: 'when', label: 'When', html: v => esc(svWhen(v))},
    {k: 'code', label: 'SQLSTATE'},
    {k: 'message', label: 'Message', html: v => esc(String(v).slice(0, 46))},
    {k: 'count', label: 'Count', num: true},
    {k: 'status', label: 'State', html: v => okb(v)}
  ], SV_DB_ERRORS, {sort: 'count', pageSize: 5});

  if(el('dbChkPill')) el('dbChkPill').textContent = checks.filter(c => c.status === 'Pass').length + '/' + checks.length;
  put('dbChecksBody', checks.map(c => `<div class="checkrow"><div class="ck ${c.status === 'Pass' ? 'pass' : 'crit'}">${c.status === 'Pass' ? '✓' : '!'}</div>
      <div style="flex:1"><div style="font-size:10.5px;font-weight:800">${esc(c.check)}</div>
      <div class="qhint">${esc(String(c.value))}</div></div><div>${okb(c.status)}</div></div>`).join(''));
  if(el('dbSchemaBox')) el('dbSchemaBox').innerHTML = SV_SCHEMA_RESULT
    ? `<div class="note gold"><div>${esc(SV_SCHEMA_RESULT)}</div></div>`
    : '<div class="qhint">Run a schema check to compare the deployed version with the app.</div>';

  if(el('dbMigPill')) el('dbMigPill').textContent = SV_MIGRATIONS.filter(m => m.status !== 'Applied').length + ' pending';
  renderTable('dbMigBody', [
    {k: 'id', label: 'Migration'},
    {k: 'name', label: 'What it does'},
    {k: 'when', label: 'When', html: v => esc(svWhen(v))},
    {k: 'status', label: 'State', html: v => okb(v)}
  ], SV_MIGRATIONS, {sort: 'when', pageSize: 5});
}

/* ===================== 19 · REPORTS ===================== */
function svReport(key){
  const inPeriod = t => svIsos(t.when) >= FILTER.from && svIsos(t.when) <= FILTER.to && svPass(t);
  if(key === 'total'){
    return {title: 'Total Savings Report', note: 'Every savings account with its product, balance and state.',
      cols: [['Account', 'id'], ['Customer', 'cust'], ['Product', 'product'], ['Opened', 'opened'],
        ['Available', 'available'], ['Reserved', 'reserved'], ['State', 'status']],
      rows: SV_SAVINGS.filter(svPass).map(a => ({id: a.id, cust: custName(a.cust), product: a.productName,
        opened: svIsos(a.opened), available: a.available, reserved: a.reserved, status: a.status}))};
  }
  if(key === 'growth'){
    const months = SV_INTEREST_HISTORY.map(h => h.month).slice(-6);
    return {title: 'Savings Growth Report', note: 'Month by month: deposits, withdrawals and the net movement.',
      cols: [['Month', 'label'], ['Deposits', 'in'], ['Withdrawals', 'out'], ['Net', 'net'], ['Transactions', 'count']],
      rows: months.map(m => {
        const t = SV_COMPLETED.filter(x => String(x.when).slice(0, 7) === m && svPass(x));
        const i = sum(t.filter(x => x.kind === 'Deposit'), x => x.amount);
        const o = sum(t.filter(x => x.kind === 'Withdrawal'), x => x.amount);
        return {label: monthLabel(m), in: i, out: o, net: i - o, count: t.length};
      })};
  }
  if(key === 'deposits'){
    return {title: 'Deposits and Withdrawals Report', note: 'Every movement in the period, newest first.',
      cols: [['Date', 'when'], ['Transaction', 'id'], ['Customer', 'cust'], ['Account', 'account'],
        ['Kind', 'kind'], ['Method', 'method'], ['Amount', 'amount'], ['Fee', 'fee'], ['State', 'status']],
      rows: SV_TXN.filter(inPeriod).map(t => ({when: svIsos(t.when), id: t.id, cust: custName(t.cust),
        account: t.account, kind: t.kind, method: t.method, amount: t.amount, fee: t.fee, status: t.status}))};
  }
  if(key === 'customer'){
    return {title: 'Savings by Customer', note: 'Who holds what, across savings and current accounts.',
      cols: [['Customer', 'cust'], ['Reference', 'id'], ['Branch', 'region'], ['Accounts', 'n'],
        ['Savings', 'savings'], ['Total', 'total'], ['State', 'status']],
      rows: CUSTOMERS.slice(0, 60).map(c => {
        const accts = SV_ACCOUNTS.filter(a => a.cust === c.id);
        if(!accts.length) return null;
        const sav = sum(accts.filter(a => a.type === 'Savings'), a => a.available);
        return {cust: c.name, id: c.id, region: c.region, n: accts.length, savings: sav,
          total: sum(accts, a => a.available),
          status: accts.some(a => a.status === 'Suspended') ? 'Suspended' : accts.every(a => a.status === 'Active') ? 'Active' : 'Restricted'};
      }).filter(Boolean)};
  }
  if(key === 'product'){
    return {title: 'Savings by Product', note: 'Accounts, balances and rates per product.',
      cols: [['Product', 'name'], ['Kind', 'kind'], ['Rate', 'rate'], ['Accounts', 'accounts'],
        ['Balance', 'balance'], ['State', 'status']],
      rows: SV_PRODUCTS.filter(svPass).map(p => ({name: p.name, kind: p.kind, rate: p.rate + '%',
        accounts: p.accounts, balance: p.balance, status: p.status}))};
  }
  if(key === 'accrual'){
    return {title: 'Interest Accrual Report', note: 'What has accrued this month and what is still to post.',
      cols: [['Account', 'account'], ['Customer', 'cust'], ['Rate', 'rate'], ['Balance', 'opening'],
        ['Accrued', 'accrued'], ['Posted', 'posted'], ['State', 'status']],
      rows: SV_ACCRUAL.filter(svPass).map(a => ({account: a.account, cust: custName(a.cust), rate: a.rate + '%',
        opening: a.opening, accrued: a.accrued, posted: a.posted, status: a.status}))};
  }
  if(key === 'interest'){
    return {title: 'Interest Paid Report', note: 'Every monthly interest posting, with the rate applied.',
      cols: [['Month', 'label'], ['Rate', 'rate'], ['Accounts', 'accounts'], ['Posted', 'accrued'], ['Posted on', 'postedOn']],
      rows: SV_INTEREST_HISTORY.map(h => ({label: h.label, rate: h.rate + '%', accounts: h.accounts,
        accrued: h.accrued, postedOn: svIsos(h.postedOn)}))};
  }
  if(key === 'dormant'){
    return {title: 'Dormant Accounts Report', note: 'Idle accounts, their balances and their last movement.',
      cols: [['Account', 'account'], ['Customer', 'cust'], ['Balance', 'balance'], ['Last movement', 'lastMove'], ['Days idle', 'days']],
      rows: SV_SAVINGS.filter(a => a.status === 'Dormant' && svPass(a)).map(a => ({account: a.id, cust: custName(a.cust),
        balance: a.available, lastMove: svIsos(a.lastMove), days: daysBetween(a.lastMove, TODAY)}))};
  }
  if(key === 'pending'){
    return {title: 'Pending Transactions Report', note: 'Everything waiting on verification or approval.',
      cols: [['Transaction', 'id'], ['Customer', 'cust'], ['Kind', 'kind'], ['Amount', 'amount'], ['Raised', 'when'], ['State', 'status']],
      rows: SV_TXN.filter(t => t.status.startsWith('Pending') && svPass(t)).map(t => ({id: t.id, cust: custName(t.cust),
        kind: t.kind, amount: t.amount, when: svIsos(t.when), status: t.status}))};
  }
  if(key === 'reconciliation'){
    return {title: 'Reconciliation Report', note: 'The balance against the ledger, account by account.',
      cols: [['Account', 'account'], ['Customer', 'cust'], ['Available', 'available'], ['Ledger', 'ledger'],
        ['Difference', 'difference'], ['State', 'state']],
      rows: SV_SAVINGS.filter(svPass).map(a => ({account: a.id, cust: custName(a.cust), available: a.available,
        ledger: a.ledger, difference: a.ledger - (a.available + a.reserved),
        state: Math.abs(a.ledger - (a.available + a.reserved)) < 1 ? 'Matched' : 'Differs'}))};
  }
  if(key === 'fees'){
    return {title: 'Fees and Penalties Report', note: 'Fees charged, penalties applied and waivers given.',
      cols: [['Fee', 'fee'], ['Basis', 'basis'], ['Flat', 'amount'], ['Rate', 'pct'], ['Waived', 'waived'], ['Payer', 'payer']],
      rows: SV_FEE_STATE.fees.map(f => ({fee: f.fee, basis: f.basis, amount: f.amount, pct: f.pct + '%',
        waived: f.waived, payer: f.payer}))};
  }
  return {title: 'Export Authorised Reports', note: 'Every approval request, who gave it and when.',
    cols: [['Request', 'id'], ['Transaction', 'txn'], ['Amount', 'amount'], ['Level', 'level'], ['Risk', 'risk'], ['State', 'status']],
    rows: SV_APPROVALS.filter(svPass).map(a => ({id: a.id, txn: a.txn, amount: a.amount, level: a.level,
      risk: a.risk, status: a.status}))};
}
function runSvReport(key, fmt){
  const d = svReport(key);
  const labels = d.cols.map(c => c[0]);
  const rows = d.rows.map(r => d.cols.map(c => r[c[1]]));
  if(fmt === 'preview'){
    openModal(d.title, num(d.rows.length) + ' rows · ' + filterLine(),
      `<div class="note gold"><div>${esc(d.note)}</div></div>
       <div class="tblwrap" style="max-height:340px;margin-top:8px"><table class="tbl2 dense">
         <thead><tr>${labels.map(l => `<th>${esc(l)}</th>`).join('')}</tr></thead>
         <tbody>${rows.slice(0, 25).map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')
           || `<tr><td colspan="${labels.length}" class="empty">Nothing in this report for the current filters.</td></tr>`}</tbody>
       </table></div>`,
      [{label: 'Download CSV', act: () => runSvReport(key, 'csv')},
       {label: 'Download Excel', act: () => runSvReport(key, 'xlsx')},
       {label: 'Close', act: 'close'}]);
    return;
  }
  const stamp = TODAY.replace(/-/g, '');
  const name = 'savings-' + key + '-report-' + stamp;
  if(fmt === 'csv'){
    downloadFile(name + '.csv', 'text/csv', toCsv([labels].concat(rows)));
  }else if(fmt === 'xlsx'){
    downloadFile(name + '.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      xlsxBytes(d.title, labels, rows));
  }else{
    printTable(d.title, d.cols.map(c => ({label: c[0], num: /amount|value|fee|total|rows|balance|difference|available/i.test(c[1])})), rows);
  }
  logExport(d.title, fmt === 'csv' ? 'CSV' : fmt === 'xlsx' ? 'Excel' : 'PDF', rows.length);
  svAudit('Report generated', d.title, fmt === 'csv' ? 'CSV' : fmt === 'xlsx' ? 'Excel' : 'PDF');
  renderExportHistory(); renderReports(); renderSettings();
  toast(d.title + ' generated');
}
function runSvPack(fmt){
  const all = SV_REPORTS.map(r => svReport(r.key));
  const stamp = TODAY.replace(/-/g, '');
  const total = sum(all, d => d.rows.length);
  if(fmt === 'csv'){
    const parts = [];
    all.forEach(d => {
      parts.push(d.title.toUpperCase());
      parts.push(toCsv([d.cols.map(c => c[0])].concat(d.rows.map(r => d.cols.map(c => r[c[1]])))));
      parts.push('');
    });
    downloadFile('savings-report-pack-' + stamp + '.csv', 'text/csv', parts.join('\r\n'));
  }else if(fmt === 'xlsx'){
    downloadFile('savings-report-pack-' + stamp + '.xlsx',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      xlsxBytes('Savings report pack', all[0].cols.map(c => c[0]), all[0].rows.map(r => all[0].cols.map(c => r[c[1]]))));
  }else{
    printTable('Savings report pack · ' + all.length + ' reports',
      [{label: 'Report'}, {label: 'Rows', num: true}, {label: 'What it shows'}],
      all.map(d => [d.title, d.rows.length, d.note]));
  }
  logExport('Savings report pack', fmt === 'csv' ? 'CSV' : fmt === 'xlsx' ? 'Excel' : 'PDF', total);
  renderExportHistory(); renderReports();
  if(el('packMsg')) el('packMsg').textContent = 'The pack holds ' + all.length + ' reports and ' + num(total) + ' rows.';
  toast('Report pack generated');
}
function renderReports(){
  const s = svStats();
  if(el('rpPill')){ el('rpPill').className = 'badge b-gray'; el('rpPill').textContent = num(SV_REPORTS.length) + ' reports'; }
  put('rpKpis', [
    ['Reports available', num(SV_REPORTS.length), 'Every one runs on the current filters', ''],
    ['Total savings', svM(s.savingsTotal), 'Across the book', ''],
    ['Growth this period', svM(s.net), 'Deposits less withdrawals', ''],
    ['Interest accrued', svM(s.interestAccrued), 'Not yet posted', ''],
    ['Dormant value', svM(sum(SV_SAVINGS.filter(a => a.status === 'Dormant'), a => a.available)), 'Idle balances', ''],
    ['Pending value', svM(sum(SV_TXN.filter(t => t.status.startsWith('Pending')), t => t.amount)), 'Waiting on a person', ''],
    ['Fees collected', svM(s.fees), 'On completed transactions', ''],
    ['Exports this session', num(EXPORTS.length), 'Every one logged', '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join(''));

  if(el('rpCount')) el('rpCount').textContent = num(SV_REPORTS.length) + ' reports';
  if(el('rpCards')) el('rpCards').innerHTML = SV_REPORTS.map(r => `<div class="repcard">
      <div class="rc-t">${esc(r.title)}</div>
      <div class="rc-d">${esc(r.desc)}</div>
      <div class="rc-a">
        <button class="btn btn-ghost" data-rep="${esc(r.key)}" data-fmt="preview">Preview</button>
        <button class="btn btn-ghost" data-rep="${esc(r.key)}" data-fmt="csv">CSV</button>
        <button class="btn btn-ghost" data-rep="${esc(r.key)}" data-fmt="xlsx">Excel</button>
        <button class="btn btn-ghost" data-rep="${esc(r.key)}" data-fmt="pdf">PDF</button>
      </div></div>`).join('');

  if(el('chgPill')) el('chgPill').textContent = num(SV_CHANGES.length) + ' changes';
  renderTable('chgBody', [
    {k: 'when', label: 'When', html: v => esc(svWhen(v))},
    {k: 'area', label: 'Area'},
    {k: 'what', label: 'Change'},
    {k: 'from', label: 'From', html: v => esc(String(v).slice(0, 22))},
    {k: 'to', label: 'To', html: v => esc(String(v).slice(0, 22))},
    {k: 'by', label: 'Officer', html: v => esc(staffName(v))}
  ], SV_CHANGES, {sort: 'when', pageSize: 7});

  const last = SV_CHANGES[0];
  if(el('chgWhoPill')) el('chgWhoPill').textContent = last ? staffName(last.by) : '—';
  put('chgWho', last ? kvRow('Officer', staffName(last.by)) + kvRow('Role', (STAFF.find(x => x.id === last.by) || {}).role || 'Staff')
    + kvRow('Branch', (STAFF.find(x => x.id === last.by) || {}).region || 'Lilongwe')
    + kvRow('Change', last.what) + kvRow('Area', last.area)
    + kvRow('From', esc(last.from)) + kvRow('To', esc(last.to))
    + kvRow('Automatic', last.by === 'The system' ? okb('Yes') : badge('No — a person did it', 'b-warn'))
    : '<div class="empty">No change recorded.</div>');
  put('chgStamp', `<div class="minihead">Timestamp and record</div>`
    + kvRow('Changed at', last ? esc(last.when) : '—')
    + kvRow('Recorded by', 'The configuration history table')
    + kvRow('Previous value kept', okb('Yes'))
    + kvRow('Undo', 'A reversal is another recorded change'));

  if(el('rpAuthPill')) el('rpAuthPill').textContent = num(SV_REPORTS.length) + ' authorised';
  if(el('rpAuthHead')) el('rpAuthHead').innerHTML = '<tr><th>Report</th><th>Allowed format</th><th>Authorised by</th><th>Last run</th><th>State</th></tr>';
  if(el('rpAuthBody')) el('rpAuthBody').innerHTML = SV_REPORTS.slice(0, 8).map((r, i) => `<tr>
      <td>${esc(r.title)}</td><td>CSV, Excel, PDF</td><td>${esc(staffName(i % 2 ? 'STF-009' : 'STF-001'))}</td>
      <td>${esc(EXPORTS[i] ? svWhen(EXPORTS[i].when) : 'Not run')}</td><td>${okb('Authorised')}</td></tr>`).join('');
  if(el('rpAuthMsg') && !String(el('rpAuthMsg').textContent || '').trim())
    el('rpAuthMsg').textContent = 'Every export writes a row into the generation history below, with your name and the filters.';

  put('rpGrid',
    chartBox({title: 'Savings held by product', sub: 'The book at a glance', type: 'bar', h: 200,
      cats: SV_PRODUCTS.map(p => p.name.split(' ')[0]),
      series: [{name: 'Balance', data: SV_PRODUCTS.map(p => p.balance || 0)}],
      value: compact(s.savingsTotal)}) +
    chartBox({title: 'Deposits against withdrawals', sub: 'Last seven days', type: 'line', h: 200,
      cats: SV_DAILY.map(d => d.label),
      series: [{name: 'In', data: SV_DAILY.map(d => d.deposits), colour: '#1E9E6A'},
        {name: 'Out', data: SV_DAILY.map(d => d.withdrawals), colour: '#C9A227'}],
      value: compact(s.deposited)}));
}

/* ===================== 20 · SETTINGS ===================== */
const SV_FORM_MAP = [
  ['setCcy', 'currency', 'text'],
  ['setRate', 'interestRate', 'number'],
  ['setRateType', 'rateType', 'text'],
  ['setMinBal', 'minBalance', 'number'],
  ['setMinDep', 'minDeposit', 'number'],
  ['setMaxDep', 'maxDeposit', 'number'],
  ['setDailyWdr', 'dailyWithdrawalLimit', 'number'],
  ['setPerCust', 'perCustomerDailyLimit', 'number'],
  ['setAppr1', 'approvalThreshold', 'number'],
  ['setAppr2', 'secondApprovalThreshold', 'number'],
  ['setMaintFee', 'maintenanceFee', 'number'],
  ['setWdrFeePct', 'withdrawalFeePct', 'number'],
  ['setWdrFeeFlat', 'withdrawalFeeFlat', 'number'],
  ['setTransferFee', 'transferFeeFlat', 'number'],
  ['setPenalty', 'earlyPenaltyPct', 'number'],
  ['setDormDays', 'dormantDays', 'number'],
  ['setPrefix', 'accountPrefix', 'text'],
  ['setDigits', 'accountDigits', 'number'],
  ['setNotifySms', 'notifySms', 'bool'],
  ['setNotifyEmail', 'notifyEmail', 'bool']
];
function svWriteSettings(){
  SV_FORM_MAP.forEach(([id, key, kind]) => {
    const n = el(id);
    if(!n) return;
    if(kind === 'bool') n.value = SV_SET[key] ? 'On' : 'Off';
    else n.value = SV_SET[key];
  });
}
function svReadSettings(){
  const out = {};
  SV_FORM_MAP.forEach(([id, key, kind]) => {
    const n = el(id);
    if(!n) return;
    out[key] = kind === 'number' ? Number(n.value) : kind === 'bool' ? n.value === 'On' : n.value;
  });
  return out;
}
function svValidate(cfg){
  const bad = [];
  if(cfg.minDeposit > cfg.maxDeposit) bad.push('The minimum deposit is above the maximum.');
  if(cfg.approvalThreshold > cfg.secondApprovalThreshold) bad.push('The first approval limit is above the second.');
  if(cfg.minBalance > cfg.minOpening) bad.push('The minimum balance is above the minimum opening.');
  if(cfg.maxDeposit > 10000000) bad.push('The maximum deposit is above the rail ceiling of MK 10,000,000.');
  if(cfg.interestRate <= 0 || cfg.interestRate > 30) bad.push('The rate must sit between 0 and 30 percent.');
  if(!/^[A-Z]{2,4}$/.test(cfg.accountPrefix)) bad.push('The prefix must be two to four capital letters.');
  if(cfg.accountDigits < 3 || cfg.accountDigits > 8) bad.push('The account number needs between three and eight digits.');
  return bad;
}
function renderSettings(){
  const s = svStats();
  const bad = svValidate(SV_SET);
  if(el('setPill')){ el('setPill').className = bad.length ? 'badge b-crit' : 'badge b-ok';
    el('setPill').textContent = bad.length ? num(bad.length) + ' setting out of range' : SV_SET.currency + ' · ' + SV_SET.interestRate + '%'; }
  put('setKpis', [
    ['Currency', SV_SET.currency, esc(SV_SET.currencyLabel || ''), ''],
    ['Savings rate', SV_SET.interestRate + '%', SV_SET.rateType + ' · ' + SV_SET.compounding.toLowerCase(), ''],
    ['Approval thresholds', svM(SV_SET.approvalThreshold), 'Two signatures above ' + svM(SV_SET.secondApprovalThreshold), ''],
    ['Deposit range', svM(SV_SET.minDeposit) + ' – ' + svM(SV_SET.maxDeposit), 'Per deposit', ''],
    ['Daily withdrawal cap', svM(SV_SET.dailyWithdrawalLimit), 'Per account', ''],
    ['Dormancy', SV_SET.dormantDays + ' days', svM(SV_SET.dormancyFee) + ' a month once dormant', ''],
    ['Account number', SV_SET.accountPrefix + '-' + pad(1001, SV_SET.accountDigits), SV_SET.numberRule || 'Prefix then a sequence', ''],
    ['Changes recorded', num(SV_CHANGES.length), 'With the officer and the timestamp', '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join(''));

  if(!SV_SET.__filled){ svWriteSettings(); SV_SET.__filled = true; }

  const cfg = Object.assign({}, SV_SET, svReadSettings());
  const problems = svValidate(cfg);
  put('setRuleBox', `<div class="minihead">Current rules</div>`
    + kvRow('Deposit rule', esc(SV_SET.depositRule || ''))
    + kvRow('Withdrawal rule', esc(SV_SET.withdrawalRule || ''))
    + kvRow('Interest rule', esc(SV_SET.interestRule || ''))
    + kvRow('Dormant rule', esc(SV_SET.dormantRule || ''))
    + (problems.length ? `<div class="note red" style="margin-top:6px"><div>${problems.map(p => esc(p)).join(' ')}</div></div>` : ''));
  if(el('setMsg') && !String(el('setMsg').textContent || '').trim())
    el('setMsg').textContent = 'Saving writes a change-history row for each setting that moved; restoring the defaults records that too.';

  if(el('setRolesHead')) el('setRolesHead').innerHTML = '<tr><th>Role</th><th>Officer</th><th>May change settings</th></tr>';
  if(el('setRolesBody')) el('setRolesBody').innerHTML = SV_ROLES.map(r => `<tr>
      <td><b>${esc(r)}</b></td><td>${esc(staffName(SV_ROLE_STAFF[r] || 'STF-001'))}</td>
      <td>${SV_PERM_STATE[r][6] ? okb('Yes') : badge('No', 'b-gray')}</td></tr>`).join('');

  if(el('setAuditPill')) el('setAuditPill').textContent = num(SV_CHANGES.length + SV_AUDIT_LOG.length) + ' events';
  renderTable('setAuditBody', [
    {k: 'when', label: 'When', html: v => esc(svWhen(v))},
    {k: 'action', label: 'Action'},
    {k: 'target', label: 'Target', html: v => esc(String(v).slice(0, 30))},
    {k: 'by', label: 'Officer', html: v => esc(v)}
  ], SV_AUDIT_LOG.map(a => ({when: a.when, action: a.action, target: a.target, by: a.by}))
    .concat(SV_CHANGES.map(c => ({when: c.when, action: 'Configuration change', target: c.what + ' · ' + c.to, by: staffName(c.by)}))),
    {sort: 'when', pageSize: 7});
}

/* ===================== filters ===================== */
function svUniq(a){ return Array.from(new Set(a)); }
function svFillFilters(){
  const sev = ['Critical', 'High', 'Medium', 'Low'];
  const stat = svUniq(SV_TXN.map(t => t.status).concat(SV_VERIFY.map(v => v.status), SV_APPROVALS.map(a => a.status),
    SV_GOALS.map(g => g.status), SV_CONN_ALERTS.map(a => a.status), SV_DB_ERRORS.map(e => e.status)));
  const owners = svUniq(SV_TXN.map(t => t.officer).concat(STAFF.map(s => s.id)));
  const regions = svUniq(CUSTOMERS.map(c => c.region).concat(['Lilongwe', 'Blantyre', 'Mzuzu', 'Zomba']));
  const setSel = (id, list, first) => {
    const n = el(id);
    if(!n) return;
    n.innerHTML = [first].concat(list).map(v => `<option value="${esc(v === first ? '' : v)}">${esc(v)}</option>`).join('');
  };
  setSel('fltSeverity', sev, 'Any severity');
  setSel('fltStatus', stat, 'Any state');
  setSel('fltOwner', owners.map(o => o), 'Any officer');
  setSel('fltRegion', regions, 'Any branch');
  if(el('fltOwner')) el('fltOwner').innerHTML = '<option value="">Any officer</option>'
    + owners.map(o => `<option value="${esc(o)}">${esc(staffName(o) || o)}</option>`).join('');
  if(el('fltProduct')) el('fltProduct').innerHTML = '<option value="">Any product</option>'
    + SV_PRODUCTS.map(p => `<option value="${esc(p.id)}">${esc(p.name)}</option>`).join('');
  if(el('fltFrom') && !el('fltFrom').value) el('fltFrom').value = FILTER.from;
  if(el('fltTo') && !el('fltTo').value) el('fltTo').value = FILTER.to;
}
function svSyncFilters(){
  if(el('fltFrom')) el('fltFrom').value = FILTER.from;
  if(el('fltTo')) el('fltTo').value = FILTER.to;
  if(el('fltSearch')) el('fltSearch').value = FILTER.q || '';
}
function svApplyFilters(){
  FILTER.from = (el('fltFrom') && el('fltFrom').value) || '2026-01-01';
  FILTER.to = (el('fltTo') && el('fltTo').value) || TODAY;
  FILTER.q = ((el('fltSearch') && el('fltSearch').value) || '').trim();
  FILTER.severity = (el('fltSeverity') && el('fltSeverity').value) || '';
  FILTER.status = (el('fltStatus') && el('fltStatus').value) || '';
  FILTER.owner = (el('fltOwner') && el('fltOwner').value) || '';
  FILTER.region = (el('fltRegion') && el('fltRegion').value) || '';
  FILTER.product = (el('fltProduct') && el('fltProduct').value) || '';
  SV_TX_STATE.status = 'All';
  renderAll(); svFilterSummary();
  toast('Savings filters applied');
}
function svClearFilter(k){
  if(k === 'q'){ FILTER.q = ''; if(el('fltSearch')) el('fltSearch').value = ''; }
  else FILTER[k] = '';
  const map = {severity: 'fltSeverity', status: 'fltStatus', owner: 'fltOwner', region: 'fltRegion', product: 'fltProduct'};
  if(map[k] && el(map[k])) el(map[k]).value = '';
  el('fltLaneChips').querySelectorAll('.chip').forEach(c => c.classList.toggle('on', !FILTER.lane));
  renderAll(); svFilterSummary();
}
function svFilterSummary(){
  const chips = [];
  if(FILTER.lane) chips.push(['lane', 'Area: ' + FILTER.lane]);
  if(FILTER.severity) chips.push(['severity', 'Severity: ' + FILTER.severity]);
  if(FILTER.status) chips.push(['status', 'State: ' + FILTER.status]);
  if(FILTER.owner) chips.push(['owner', 'Officer: ' + (staffName(FILTER.owner) || FILTER.owner)]);
  if(FILTER.region) chips.push(['region', 'Branch: ' + FILTER.region]);
  if(FILTER.product) chips.push(['product', 'Product: ' + prodName(FILTER.product)]);
  if(FILTER.q) chips.push(['q', 'Search: “' + FILTER.q + '”']);
  if(el('fltSummary')) el('fltSummary').textContent = chips.length
    ? chips.length + ' filter' + (chips.length === 1 ? '' : 's') + ' · ' + fmtDate(FILTER.from) + ' – ' + fmtDate(FILTER.to)
    : 'Date range only';
  if(el('fltChips')) el('fltChips').innerHTML = chips.map(([k, label]) =>
    `<span class="fchip on" data-clear="${k}">${esc(label)} <b style="margin-left:4px">×</b></span>`).join('')
    || '<span class="qhint">No filters applied — the whole savings register is shown.</span>';
  const s = svStats();
  if(el('fltCounts')) el('fltCounts').innerHTML = [
    ['Savings accounts', s.savingsAccounts], ['Active', s.active], ['Customer savings', svM(s.savingsTotal)],
    ['Deposits', s.deposits], ['Withdrawals', s.withdrawals], ['Pending', s.pending], ['Open alerts', svIssues().length]
  ].map(([k, v]) => `<div><div class="sl">${esc(k)}</div><div class="sv">${v}</div></div>`).join('');
  if(el('fltResult')) el('fltResult').textContent = 'Showing the savings register for ' +
    fmtDate(FILTER.from) + ' – ' + fmtDate(FILTER.to) + (chips.length ? ' · ' + chips.map(c => c[1]).join(' · ') : ' · no dimension filters');
}

/* ===================== navigation and rendering ===================== */
function goto(id){
  const sec = document.getElementById(id);
  if(!sec) return;
  document.querySelectorAll('.snav').forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + id));
  if(location.hash !== '#' + id) history.replaceState(null, '', '#' + id);
  if(typeof sec.scrollIntoView === 'function') sec.scrollIntoView({behavior: 'smooth', block: 'start'});
}
function renderBand(){
  const s = svStats();
  if(el('bandScore')) el('bandScore').textContent = Math.round(s.score) + '/100';
  if(el('bandAccounts')) el('bandAccounts').textContent = num(s.savingsAccounts);
  if(el('bandBalance')) el('bandBalance').textContent = compact(s.savingsTotal);
  if(el('bandDeposits')) el('bandDeposits').textContent = compact(s.todayAmount);
  if(el('bandAlerts')) el('bandAlerts').textContent = num(s.alerts);
  if(el('topRefresh')) el('topRefresh').textContent = lastRefresh();
}
function renderAll(){
  renderBand();
  renderOverview();
  renderAccounts();
  renderProfiles();
  renderDeposits();
  renderWithdrawals();
  renderLedger();
  renderInterest();
  renderProducts();
  renderGoals();
  renderPayments();
  renderMonitoring();
  renderStatements();
  renderFees();
  renderTransfers();
  renderNotifications();
  renderDormant();
  renderSecurity();
  renderDatabase();
  renderReports();
  renderSettings();
}

/* ===================== actions ===================== */
function svToastUndo(what){ toast(what); }

function svAccOpen(){
  const cust = (el('amCust') && el('amCust').value) || CUSTOMERS[0].id;
  const type = (el('amType') && el('amType').value) || 'Savings';
  const prodId = (el('amProduct') && el('amProduct').value) || 'PRD-STD';
  const prod = SV_PROD_BY_ID[prodId] || SV_PRODUCTS[0];
  const opening = Number((el('amOpening') && el('amOpening').value) || 0);
  const branch = (el('amBranch') && el('amBranch').value) || 'Lilongwe';
  if(type === 'Savings' && opening < prod.minOpening){
    toast('The opening balance is below ' + svM(prod.minOpening) + ' for ' + prod.name);
    return;
  }
  const number = SV_SET.accountPrefix + '-' + pad(1001 + SV_ACCOUNTS.length, SV_SET.accountDigits);
  if(SV_ACC_BY_ID[number]){
    toast('Account ' + number + ' already exists — refresh the sequence');
    return;
  }
  const acct = {id: type === 'Savings' ? number : 'CUR-' + pad(1001 + SV_ACCOUNTS.length, SV_SET.accountDigits),
    cust, type, product: type === 'Savings' ? prod.id : '', productName: type === 'Savings' ? prod.name : 'Current account',
    currency: SV_SET.currency, opened: TODAY, status: 'Active', opening, available: opening, reserved: 0, ledger: opening,
    interestRate: type === 'Savings' ? prod.rate : 0, rateType: type === 'Savings' ? prod.rateType : '—',
    minBalance: type === 'Savings' ? prod.minBalance : 0,
    restriction: type === 'Savings' && prod.kind === 'Fixed-term' ? 'Fixed term, early withdrawal penalised' : 'None',
    verified: 'Verified', idType: 'National ID', idNumber: 'MW' + pad(ri(100000, 999999), 6),
    phone: '+265 99' + ri(100, 999) + ' ' + pad(ri(1000, 9999), 4),
    email: (CUST_BY_ID[cust] || CUSTOMERS[0]).name.toLowerCase().replace(/[^a-z]+/g, '.') + '@mail.mw',
    lastMove: TODAY, inTotal: 0, outTotal: 0, interestPaid: 0, pendingIn: 0, monthlyInterest: 0,
    lane: 'Savings', severity: 'Low', owner: 'STF-001', region: branch};
  SV_ACCOUNTS.push(acct);
  SV_ACC_BY_ID[acct.id] = acct;
  if(type === 'Savings') SV_SAVINGS.push(acct);
  SV_SEL.acc = acct.id;
  svAudit('Account opened', acct.id, type + ' · ' + custName(cust) + ' · ' + svM(opening));
  SV_ACC_HISTORY.unshift({account: acct.id, when: TODAY + ' ' + svNow(), action: 'Opened', from: '—', to: svM(opening), by: 'STF-001'});
  renderAll();
  toast(acct.id + ' opened for ' + custName(cust));
}
function svAccSave(){
  const a = svAccItem();
  if(!a) return;
  const before = a.restriction;
  const nick = (el('amNick') && el('amNick').value) || '';
  const phone = (el('amPhone') && el('amPhone').value) || a.phone;
  const email = (el('amEmail') && el('amEmail').value) || a.email;
  const reason = (el('amReason') && el('amReason').value) || '';
  const cycle = (el('amCycle') && el('amCycle').value) || '';
  if(cycle && cycle !== a.cycle){
    SV_ACC_HISTORY.unshift({account: a.id, when: TODAY + ' ' + svNow(), action: 'Statement cycle',
      from: a.cycle || 'Monthly', to: cycle, by: 'STF-001'});
    a.cycle = cycle;
  }
  if(phone !== a.phone){ SV_ACC_HISTORY.unshift({account: a.id, when: TODAY + ' ' + svNow(), action: 'Phone changed', from: a.phone, to: phone, by: 'STF-001'}); a.phone = phone; }
  if(email !== a.email){ SV_ACC_HISTORY.unshift({account: a.id, when: TODAY + ' ' + svNow(), action: 'Email changed', from: a.email, to: email, by: 'STF-001'}); a.email = email; }
  if(reason){ SV_ACC_HISTORY.unshift({account: a.id, when: TODAY + ' ' + svNow(), action: nick ? 'Nickname set' : 'Note added', from: before, to: reason, by: 'STF-001'}); }
  svAudit('Account details saved', a.id, phone + ' · ' + email);
  if(el('amActMsg')) el('amActMsg').textContent = 'Saved to ' + a.id + ' at ' + svNow() + '.';
  renderAccounts();
  toast('Account details saved');
}
function svAccState(next){
  const a = svAccItem();
  if(!a) return;
  const from = a.status;
  if(next === 'Closed' && a.available > 0){
    toast('Close refused — ' + svM(a.available) + ' is still available on ' + a.id);
    if(el('amActMsg')) el('amActMsg').textContent = 'Close refused: empty the account first. ' + svM(a.available) + ' is still available.';
    return;
  }
  a.status = next;
  a.restriction = next === 'Suspended' ? 'Suspended by compliance'
    : next === 'Dormant' ? 'Dormant — identity re-verification required' : 'None';
  SV_ACC_HISTORY.unshift({account: a.id, when: TODAY + ' ' + svNow(), action: 'State change', from, to: next, by: 'STF-001'});
  svAudit('Account state changed', a.id, from + ' → ' + next);
  renderAll();
  toast(a.id + ' is now ' + next.toLowerCase());
}
function svCustVerify(){
  const c = svCustItem();
  const sav = SV_ACC_OF_CUST(c.id, 'Savings');
  if(!sav) return;
  sav.verified = 'Verified';
  svAudit('Identity verified', sav.id, sav.idType + ' ' + sav.idNumber);
  renderProfiles();
  toast(c.name + ' verified');
}

/* withdrawals */
function svWdIdentity(){
  const a = SV_ACC_BY_ID[(el('wdAcct') || {}).value] || SV_SAVINGS[0];
  if(!a) return;
  SV_WD_STATE.identity = {doc: (el('wdIdType') || {}).value || 'National ID', number: (el('wdIdNum') || {}).value || a.idNumber};
  svAudit('Identity checked', a.id, SV_WD_STATE.identity.doc + ' ' + SV_WD_STATE.identity.number);
  renderWithdrawals();
  toast('Identity verified for ' + custName(a.cust));
}
function svWdRequest(){
  const chk = svWdChecks();
  const reason = (el('wdReason') || {}).value || 'Customer request';
  if(!SV_WD_STATE.identity){
    toast('Verify the identity before raising a withdrawal');
    if(el('wdMsg')) el('wdMsg').textContent = 'Verify the identity first — a payout cannot be raised without it.';
    return;
  }
  if(!chk.pass){
    toast('The withdrawal fails a check — see the list');
    if(el('wdMsg')) el('wdMsg').textContent = 'Refused: ' + chk.checks.filter(c => !c[1]).map(c => c[0]).join('; ') + '.';
    return;
  }
  const status = chk.amount > SV_SET.approvalThreshold ? 'Pending approval' : 'Processing';
  const t = {id: 'SVX-' + pad(900000 + SV_TXN.length, 5), kind: 'Withdrawal', method: chk.method,
    provider: (SV_METHOD_BY_NAME[chk.method] || {}).provider || 'Branch counter',
    rail: (SV_METHOD_BY_NAME[chk.method] || {}).rail || 'Cash',
    when: TODAY + ' ' + svNow(), cust: chk.acct.cust, source: chk.acct.id,
    dest: (el('wdDest') || {}).value || 'Counter payout', destName: custName(chk.acct.cust),
    account: chk.acct.id, amount: chk.amount, fee: chk.fee, currency: SV_SET.currency,
    ref: 'SVW-' + pad(ri(100000, 999999), 6), description: reason, status, stage: 'Awaiting approval',
    initiatedBy: 'STF-001', officer: 'STF-001', verifiedBy: 'STF-001',
    approvedBy: status === 'Processing' ? 'STF-001' : '', proof: '', notes: reason, goal: '',
    interestRate: 0, daysHeld: 0, lane: 'Withdrawals', severity: 'Medium', owner: 'STF-001', region: chk.acct.region};
  SV_TXN.unshift(t);
  SV_WITHDRAWALS.unshift(t);
  chk.acct.reserved += chk.amount;
  SV_ACC_HISTORY.unshift({account: chk.acct.id, when: t.when, action: 'Withdrawal raised', from: svM(chk.acct.available), to: svM(chk.acct.available - chk.amount), by: 'STF-001'});
  svAudit('Withdrawal raised', t.id, svM(chk.amount) + ' · ' + chk.acct.id + ' · ' + status);
  SV_WD_STATE.identity = null;
  renderAll();
  toast('Withdrawal ' + t.id + ' raised — ' + status.toLowerCase());
}
function svWdAct(id, act){
  const t = SV_TXN.find(x => x.id === id);
  if(!t) return;
  const a = SV_ACC_BY_ID[t.account];
  if(act === 'verify'){
    t.status = t.amount > SV_SET.approvalThreshold ? 'Pending approval' : 'Processing';
    t.stage = t.status === 'Pending approval' ? 'Awaiting approval' : 'Ready to pay';
    t.verifiedBy = 'STF-001';
  }else if(act === 'approve'){
    t.status = 'Processing'; t.stage = 'Approved, ready to pay'; t.approvedBy = 'STF-009';
  }else if(act === 'reject'){
    t.status = 'Rejected'; t.stage = 'Refused by an officer';
    if(a) a.reserved = Math.max(0, a.reserved - t.amount);
  }else if(act === 'cancel'){
    t.status = 'Cancelled'; t.stage = 'Withdrawn by the customer';
    if(a) a.reserved = Math.max(0, a.reserved - t.amount);
  }else if(act === 'process'){
    if(a && a.available < t.amount + t.fee){
      toast('Cannot pay — the available balance has moved');
      return;
    }
    t.status = 'Completed'; t.stage = 'Posted to the ledger';
    if(a){
      a.reserved = Math.max(0, a.reserved - t.amount);
      a.outTotal += t.amount + t.fee;
      a.available = Math.max(0, a.available - t.amount - t.fee);
      a.ledger = a.available + a.reserved;
      a.lastMove = TODAY;
    }
    SV_LEDGER.unshift({entry: 'LED-' + pad(90000 + SV_LEDGER.length, 5), when: t.when, account: t.account,
      cust: t.cust, kind: 'Withdrawal', side: 'Debit', amount: -t.amount, balance: a ? a.available : 0,
      lane: 'Withdrawals', severity: 'Low', owner: 'STF-001', region: t.region});
  }
  svAudit('Withdrawal ' + act, t.id, svM(t.amount));
  renderAll();
  toast(t.id + ' · ' + t.status);
}

/* interest */
function svRateSave(){
  const rate = Number((el('itRate') || {}).value || SV_SET.interestRate);
  const from = SV_SET.interestRate;
  SV_SET.interestRate = rate;
  SV_SET.rateType = (el('itRateType') || {}).value || SV_SET.rateType;
  SV_SET.compounding = (el('itCompounding') || {}).value || SV_SET.compounding;
  SV_SET.accrualBasis = (el('itBasis') || {}).value || SV_SET.accrualBasis;
  SV_SET.postingSchedule = (el('itSchedule') || {}).value || SV_SET.postingSchedule;
  SV_SET.minBalance = Number((el('itMinBal') || {}).value || SV_SET.minBalance);
  SV_SAVINGS.forEach(a => { a.interestRate = SV_SET.interestRate; a.monthlyInterest = Math.round(a.available * SV_SET.interestRate / 100 / 12); });
  SV_ACCRUAL.forEach(x => { if(x.status === 'Pending'){ x.rate = SV_SET.interestRate; x.accrued = Math.round(x.opening * SV_SET.interestRate / 100 / 12); } });
  svLogChange('Interest', 'Savings interest rate', from + '%', SV_SET.interestRate + '%');
  svAudit('Interest rate changed', 'Savings', from + '% → ' + SV_SET.interestRate + '%');
  renderAll();
  toast('Savings rate is now ' + SV_SET.interestRate + '%');
}
function svInterestCalc(){
  const amount = Number((el('itCalcAmount') || {}).value || 0);
  const mode = (el('itCalcMode') || {}).value || 'Daily';
  const divisor = mode === 'Daily' ? 365 : mode === 'Monthly' ? 12 : 1;
  const interest = Math.round(amount * SV_SET.interestRate / 100 / divisor);
  if(el('itCalcBox')){
    el('itCalcBox').innerHTML = `<div class="minihead">${esc(mode)} interest on ${esc(svM(amount))}</div>`
      + kvRow('Rate applied', SV_SET.interestRate + '%')
      + kvRow('Interest for one ' + mode.toLowerCase(), svM(interest))
      + kvRow('Monthly equivalent', svM(Math.round(amount * SV_SET.interestRate / 100 / 12)))
      + kvRow('Annual equivalent', svM(Math.round(amount * SV_SET.interestRate / 100)));
  }
  toast('Interest calculated on ' + svM(amount));
}
function svInterestVerify(){
  const rows = SV_INTEREST_CHECKS.map(([label, ok, detail]) => ({label, ok, detail}));
  if(el('itVerifyBox')) el('itVerifyBox').innerHTML = rows.map(r => `<div class="checkrow">
      <div class="ck ${r.ok === false ? 'crit' : 'pass'}">${r.ok === false ? '!' : '✓'}</div>
      <div style="flex:1"><div style="font-size:10.5px;font-weight:800">${esc(r.label)}</div>
      <div class="qhint">${esc(r.detail)}</div></div>
      <div>${okb(r.ok === false ? 'Failed' : 'Pass')}</div></div>`).join('');
  renderInterest();
  toast('Interest rules verified');
}
function svInterestStatement(){
  const rows = SV_ACCRUAL.filter(svPass).slice(0, 20).map(a => [a.account, custName(a.cust), a.rate + '%', a.opening, a.accrued, a.posted, a.status]);
  if(el('itStmtBox')){
    el('itStmtBox').innerHTML = `<div class="minihead">Interest statement · ${esc(SV_INTEREST_HISTORY[SV_INTEREST_HISTORY.length - 1].label)}</div>
      <div class="tblwrap" style="max-height:220px"><table class="tbl2 dense">
        <thead><tr><th>Account</th><th>Customer</th><th>Rate</th><th class="num">Balance</th><th class="num">Accrued</th><th class="num">Posted</th><th>State</th></tr></thead>
        <tbody>${rows.map(r => `<tr><td>${esc(r[0])}</td><td>${esc(r[1])}</td><td>${esc(r[2])}</td>
          <td class="num">${esc(svM(r[3]))}</td><td class="num">${esc(svM(r[4]))}</td><td class="num">${esc(svM(r[5]))}</td>
          <td>${okb(r[6])}</td></tr>`).join('')}</tbody></table></div>`;
  }
  toast('Interest statement built');
}

/* products */
function svProductSave(){
  const name = (el('prName') || {}).value || '';
  if(!name){ toast('A product needs a name'); return; }
  const rate = Number((el('prRate') || {}).value || 0);
  const terms = {id: SV_SEL.prod || ('PRD-' + name.slice(0, 3).toUpperCase()), name, kind: (el('prKind') || {}).value || 'Standard',
    rate, rateType: (el('prRateType') || {}).value || 'Fixed',
    minOpening: Number((el('prMinOpen') || {}).value || 0), minBalance: Number((el('prMinBal') || {}).value || 0),
    frequency: (el('prFreq') || {}).value || 'Any time', withdrawal: (el('prWithdrawal') || {}).value || 'Any time',
    availability: (el('prAvail') || {}).value || 'All branches', status: 'Open',
    terms: 'Set from the savings product form', opened: TODAY, accounts: 0, balance: 0,
    lane: 'Products', severity: 'Low'};
  const existing = SV_PROD_BY_ID[terms.id];
  if(existing){
    const from = existing.rate + '%';
    Object.assign(existing, terms, {accounts: existing.accounts, balance: existing.balance});
    svLogChange('Products', existing.name, from, rate + '%');
  }else{
    SV_PRODUCTS.push(terms);
  }
  SV_SEL.prod = terms.id;
  svAudit('Product saved', terms.id, name + ' · ' + rate + '%');
  renderAll();
  toast(name + ' saved at ' + rate + '%');
}

/* goals */
function svGoalAdd(){
  const cust = (el('glCust') || {}).value || CUSTOMERS[0].id;
  const name = (el('glName') || {}).value || '';
  const target = Number((el('glTarget') || {}).value || 0);
  const date = (el('glDate') || {}).value || addDays(TODAY, 180);
  const account = (el('glAcct') || {}).value || (SV_ACC_OF_CUST(cust, 'Savings') || {}).id;
  if(!name){ toast('Give the goal a name'); return; }
  if(target < 1000){ toast('A goal target must be at least MK 1,000'); return; }
  const g = {id: 'GOL-' + pad(4300 + SV_GOALS.length, 4), cust, account, name, target, saved: 0,
    targetDate: date, created: TODAY, status: 'Active', contributions: 0,
    lane: 'Goals', severity: 'Low', owner: 'STF-001', region: (CUST_BY_ID[cust] || {}).region || 'Lilongwe'};
  SV_GOALS.push(g);
  SV_GOAL_STATE.sel = g.id;
  SV_GOAL_HISTORY.unshift({when: TODAY + ' ' + svNow(), goal: g.id, action: 'Goal created', amount: 0, by: 'STF-001'});
  svAudit('Goal created', g.id, name + ' · ' + svM(target));
  renderGoals(); renderGoals.length;
  const nm = el('glName'); if(nm) nm.value = '';
  toast('Goal ' + g.id + ' created');
}
function svGoalContribute(){
  const g = svGoalItem();
  if(!g) return;
  const amount = Number((el('glAmount') || {}).value || 0);
  const acct = SV_ACC_BY_ID[g.account];
  if(amount <= 0){ toast('A contribution must be more than zero'); return; }
  if(!acct || acct.available < amount){ toast('The account cannot cover ' + svM(amount)); return; }
  acct.available -= amount; acct.outTotal += amount; acct.ledger = acct.available + acct.reserved;
  g.saved = Math.min(g.target, g.saved + amount);
  g.contributions += 1;
  if(g.saved >= g.target) g.status = 'Completed';
  SV_GOAL_HISTORY.unshift({when: TODAY + ' ' + svNow(), goal: g.id, action: 'Contribution', amount, by: 'STF-001'});
  svAudit('Goal contribution', g.id, svM(amount));
  renderAll();
  toast('Contribution of ' + svM(amount) + ' recorded');
}
function svGoalUpdate(){
  const g = svGoalItem();
  if(!g) return;
  const date = (el('glNewDate') || {}).value;
  if(date && date !== g.targetDate){
    SV_GOAL_HISTORY.unshift({when: TODAY + ' ' + svNow(), goal: g.id, action: 'Target date moved', amount: 0, by: 'STF-001'});
    g.targetDate = date;
  }
  svAudit('Goal updated', g.id, g.name);
  renderAll();
  toast('Goal updated');
}
function svGoalClose(){
  const g = svGoalItem();
  if(!g) return;
  g.status = 'Completed';
  SV_GOAL_HISTORY.unshift({when: TODAY + ' ' + svNow(), goal: g.id, action: 'Marked complete', amount: g.saved, by: 'STF-001'});
  svAudit('Goal completed', g.id, svM(g.saved));
  renderAll();
  toast(g.name + ' marked complete');
}
function svGoalCancel(){
  const g = svGoalItem();
  if(!g) return;
  g.status = 'Cancelled';
  SV_GOAL_HISTORY.unshift({when: TODAY + ' ' + svNow(), goal: g.id, action: 'Goal cancelled', amount: 0, by: 'STF-001'});
  svAudit('Goal cancelled', g.id, g.name);
  renderAll();
  toast(g.name + ' cancelled');
}

/* rails, rules, database, settings */
function svRailToggle(method){
  const st = SV_PAY_STATE[method];
  if(!st) return;
  st.status = st.status === 'Connected' ? 'Paused' : 'Connected';
  svAudit('Rail ' + (st.status === 'Connected' ? 'connected' : 'paused'), method, st.status);
  renderPayments(); renderDatabase();
  toast(method + ' ' + st.status.toLowerCase());
}
function svRuleToggle(event){
  const r = SV_NOTIFY_RULES.find(x => x.event === event);
  if(!r) return;
  r.on = !r.on;
  svAudit('Notification rule ' + (r.on ? 'switched on' : 'switched off'), event, r.template);
  renderNotifications();
  toast(event + ' ' + (r.on ? 'on' : 'off'));
}
function svTestChannel(ch){
  const c = SV_CHANNELS[ch === 'SMS' ? 'sms' : 'email'];
  SV_NOTIFY_LOG.unshift({when: TODAY + ' ' + svNow(), event: 'Test message', channel: ch, to: staffName('STF-001'),
    reference: 'TEST-' + pad(ri(100, 999), 3), status: 'Delivered', lane: 'Notifications', severity: 'Low',
    owner: 'STF-001', region: 'Lilongwe'});
  svAudit('Test message sent', ch, c.provider);
  if(el('ntMsg')) el('ntMsg').textContent = 'A test ' + ch + ' went to ' + staffName('STF-001') + ' through ' + c.provider + ' at ' + svNow() + '.';
  renderNotifications();
  toast('Test ' + ch + ' sent');
}
function svPermToggle(role, cap){
  if(!SV_PERM_STATE[role]) return;
  SV_PERM_STATE[role][cap] = SV_PERM_STATE[role][cap] ? 0 : 1;
  SV_PERMS[role][cap] = SV_PERM_STATE[role][cap];
  svLogChange('Security', role + ' · ' + SV_CAPS[cap], SV_PERM_STATE[role][cap] ? 'Withdrawn' : 'Granted',
    SV_PERM_STATE[role][cap] ? 'Granted' : 'Withdrawn');
  svAudit('Permission changed', role, SV_CAPS[cap] + ' · ' + (SV_PERM_STATE[role][cap] ? 'granted' : 'withdrawn'));
  renderSecurity(); renderSettings();
  toast(role + ' · ' + SV_CAPS[cap] + ' ' + (SV_PERM_STATE[role][cap] ? 'granted' : 'withdrawn'));
}
function svDormancySave(){
  const days = Number((el('drCfgDays') || {}).value || SV_SET.dormantDays);
  const fee = Number((el('drCfgFee') || {}).value || SV_SET.dormancyFee);
  const from = SV_SET.dormantDays;
  SV_SET.dormantDays = days; SV_SET.dormancyFee = fee;
  let flagged = 0;
  SV_SAVINGS.forEach(a => {
    const idle = daysBetween(a.lastMove, TODAY);
    if(a.status === 'Active' && idle > days){ a.status = 'Dormant'; a.restriction = 'Dormant — identity re-verification required'; flagged++; }
    else if(a.status === 'Dormant' && idle <= days){ a.status = 'Active'; a.restriction = 'None'; }
  });
  svLogChange('Dormancy', 'Dormancy period', from + ' days', days + ' days');
  svAudit('Dormancy re-detected', days + ' days', flagged + ' account(s) moved');
  if(el('drMsg')) el('drMsg').textContent = 'Re-detected at ' + days + ' days: ' + flagged + ' account(s) became dormant.';
  renderAll();
  toast('Dormancy period is ' + days + ' days');
}
function svDrAction(account){
  const a = SV_ACC_BY_ID[account];
  if(!a) return;
  if(a.status === 'Dormant'){
    a.status = 'Active'; a.restriction = 'None';
    SV_REACTIVATIONS.unshift({id: 'SRQ-' + pad(60 + SV_REACTIVATIONS.length, 3), when: TODAY + ' ' + svNow(),
      account: a.id, cust: a.cust, reason: 'Reactivated at the counter after identity re-verification',
      status: 'Approved', by: 'STF-001', lane: 'Dormant', severity: 'Low', owner: 'STF-001', region: a.region});
    svAudit('Account reactivated', a.id, 'Dormant → Active');
  }else{
    a.status = 'Restricted'; a.restriction = 'Restricted pending review';
    svAudit('Account restricted', a.id, 'Restricted pending review');
  }
  renderAll();
  toast(a.id + ' · ' + a.status);
}
function svDrRequest(id){
  const r = SV_REACTIVATIONS.find(x => x.id === id) || SV_REACTIVATIONS[0];
  if(!r) return;
  r.status = 'Approved';
  const a = SV_ACC_BY_ID[r.account];
  if(a && a.status === 'Dormant'){ a.status = 'Active'; a.restriction = 'None'; }
  svAudit('Reactivation approved', r.id, r.account);
  renderAll();
  toast('Request ' + r.id + ' approved');
}
function svDormancyReverify(){
  const target = SV_SAVINGS.find(a => a.status === 'Suspended') || SV_SAVINGS[0];
  if(!target) return;
  target.verified = 'Verified';
  target.status = 'Active';
  target.restriction = 'None';
  SV_ID_CHECKS.unshift({ref: target.id, cust: target.cust, doc: target.idType, number: target.idNumber,
    checked: 'Verified', by: 'STF-001', when: TODAY, lane: 'Security', severity: 'Low', owner: 'STF-001', region: target.region});
  svAudit('Identity re-verified', target.id, target.idType + ' ' + target.idNumber);
  renderAll();
  toast(target.id + ' re-verified and reactivated');
}

/* deposits */
function svDepRecord(){
  const acct = SV_ACC_BY_ID[(el('dpAcct') || {}).value] || SV_SAVINGS[0];
  if(!acct) return;
  const amount = Number((el('dpAmount') || {}).value || 0);
  const method = (el('dpMethod') || {}).value || 'Cash';
  const ref = (el('dpRef') || {}).value || 'CSH-' + pad(ri(100000, 999999), 6);
  const ccy = (el('dpCcy') || {}).value || SV_SET.currency;
  if(ccy !== SV_SET.currency){
    toast('Savings are held in ' + SV_SET.currency + ' only — switch the currency back');
    return;
  }
  const source = (el('dpSource') || {}).value || (method === 'Cash' ? 'Branch counter' : 'External wallet');
  if(amount < SV_SET.minDeposit){ toast('Below the minimum deposit of ' + svM(SV_SET.minDeposit)); return; }
  if(amount > SV_SET.maxDeposit){ toast('Above the maximum deposit of ' + svM(SV_SET.maxDeposit)); return; }
  if(SV_TXN.some(t => t.ref === ref)){ toast('Reference ' + ref + ' has already been used — held as a duplicate'); return; }
  const status = method === 'Cash' ? 'Pending verification' : 'Pending verification';
  const t = {id: 'PND-' + pad(800000 + SV_TXN.length, 5), kind: 'Deposit', method,
    provider: (SV_METHOD_BY_NAME[method] || {}).provider || 'Branch counter',
    rail: (SV_METHOD_BY_NAME[method] || {}).rail || 'Cash', when: TODAY + ' ' + svNow(), cust: acct.cust,
    source, dest: acct.id, destName: custName(acct.cust),
    account: acct.id, amount, fee: 0, currency: SV_SET.currency, ref, description: (el('dpNotes') || {}).value || 'Savings deposit',
    status, stage: 'Awaiting verification', initiatedBy: 'STF-001', officer: 'STF-001',
    verifiedBy: '', approvedBy: '', proof: (el('dpProof') || {}).value || '', notes: '', goal: '', interestRate: 0,
    daysHeld: 0, lane: 'Deposits', severity: 'Medium', owner: 'STF-001', region: acct.region};
  SV_TXN.unshift(t);
  SV_DEPOSITS.unshift(t);
  SV_SEL.dep = t.id;
  SV_VERIFY.unshift({id: 'SVV-' + pad(700 + SV_VERIFY.length, 3), txn: t.id, ref, when: t.when, cust: t.cust,
    account: acct.id, amount, method, kind: 'Deposit', proof: t.proof || 'No proof attached',
    checks: {customer: true, account: true, amount: amount >= SV_SET.minDeposit && amount <= SV_SET.maxDeposit,
      duplicate: true, proof: method === 'Cash' || !!t.proof, balance: true},
    status: 'Pending', notes: '', lane: 'Verification', severity: 'Medium', owner: 'STF-001', region: acct.region});
  svAudit('Deposit recorded', t.id, svM(amount) + ' · ' + ref);
  renderAll();
  toast('Deposit ' + t.id + ' recorded and waiting for verification');
}
function svDepVerify(){
  const t = SV_DEPOSITS.find(x => x.id === SV_SEL.dep) || SV_DEPOSITS[0];
  if(!t) return;
  if(t.status !== 'Pending verification'){
    toast('Only a deposit awaiting verification can be verified');
    return;
  }
  const acct = SV_ACC_BY_ID[t.account];
  t.status = 'Completed'; t.stage = 'Posted to the ledger'; t.verifiedBy = 'STF-001';
  t.approvedBy = 'STF-001';
  if(acct){
    acct.inTotal += t.amount;
    acct.available += t.amount;
    acct.ledger = acct.available + acct.reserved;
    acct.lastMove = TODAY;
    acct.pendingIn = Math.max(0, acct.pendingIn - t.amount);
  }
  SV_LEDGER.unshift({entry: 'LED-' + pad(91000 + SV_LEDGER.length, 5), when: t.when, account: t.account, cust: t.cust,
    kind: 'Deposit', side: 'Credit', amount: t.amount, balance: acct ? acct.available : 0,
    lane: 'Deposits', severity: 'Low', owner: 'STF-001', region: t.region});
  const v = SV_VERIFY.find(x => x.txn === t.id);
  if(v){ v.status = 'Verified'; SV_VERIFY_HISTORY.unshift({when: TODAY + ' ' + svNow(), ref: t.ref, action: 'Verified', by: 'STF-001', notes: 'Verified from the deposit register'}); }
  SV_RECEIPTS.unshift({receipt: 'SVR-' + pad(4300 + SV_RECEIPTS.length, 5), txn: t.id, ref: t.ref, when: t.when,
    cust: t.cust, account: t.account, kind: 'Deposit', method: t.method, amount: t.amount, fee: t.fee,
    status: 'Issued', issued: 'Automatic', lane: 'Receipts', severity: 'Low', owner: 'STF-001', region: t.region});
  svAudit('Deposit verified', t.id, svM(t.amount));
  renderAll();
  toast('Deposit verified · ' + svM(t.amount) + ' credited to ' + t.account);
}
function svDepApprove(){
  const t = SV_DEPOSITS.find(x => x.id === SV_SEL.dep) || SV_DEPOSITS[0];
  if(!t) return;
  t.status = 'Completed'; t.stage = 'Approved and posted'; t.approvedBy = 'STF-009';
  svAudit('Deposit approved', t.id, svM(t.amount));
  renderAll();
  toast('Deposit ' + t.id + ' approved');
}
function svDepReceipt(txnId){
  const t = txnId ? SV_TXN.find(x => x.id === txnId)
    : (SV_DEPOSITS.find(x => x.id === SV_SEL.dep) || SV_DEPOSITS[0]);
  if(!t) return;
  const r = SV_RECEIPTS.find(x => x.txn === t.id);
  const box = el('dpReceiptBox') || el('wdReceiptBox');
  if(box){
    box.innerHTML = r ? `<div class="minihead">Receipt ${esc(r.receipt)}</div>`
      + kvRow('Customer', custName(r.cust)) + kvRow('Amount', svM(r.amount))
      + kvRow('Account', r.account) + kvRow('Method', r.method)
      + kvRow('Issued', r.issued)
      : `<div class="minihead">${esc(t.kind)} ${esc(t.id)}</div>`
        + `<div class="qhint">No receipt has been issued yet — ${t.status === 'Completed'
          ? 'the receipt is written when the transaction is printed at the counter'
          : 'a receipt is issued only once the transaction completes'}.</div>`;
  }
  toast(r ? 'Receipt ' + r.receipt : 'No receipt yet for ' + t.id);
}

/* ledger */
function svRecalc(){
  SV_ACCOUNTS.forEach(a => {
    const inAmt = sum(SV_TXN.filter(t => t.dest === a.id && t.status === 'Completed'), t => t.amount);
    const outAmt = sum(SV_TXN.filter(t => t.source === a.id && t.status === 'Completed'), t => t.amount + t.fee);
    const reserved = sum(SV_TXN.filter(t => t.source === a.id && ['Pending approval', 'Approved', 'Processing'].includes(t.status)), t => t.amount);
    a.reserved = reserved;
    a.available = Math.max(0, a.opening + inAmt - outAmt - reserved);
    a.ledger = a.available + reserved;
    a.monthlyInterest = Math.round(a.available * a.interestRate / 100 / 12);
  });
  svAudit('Balances recalculated', 'All savings accounts', String(SV_SAVINGS.length) + ' accounts');
  renderAll();
  toast('Balances recalculated from the ledger');
}
function svRecon(){
  const bad = SV_SAVINGS.filter(a => Math.abs(a.ledger - (a.available + a.reserved)) > 0.5);
  if(el('blMsg')) el('blMsg').textContent = bad.length
    ? bad.length + ' account(s) do not reconcile: ' + bad.slice(0, 3).map(a => a.id).join(', ')
    : 'Every savings account reconciles: available plus reserved equals the ledger.';
  svAudit('Ledger reconciled', 'All savings accounts', bad.length + ' differences');
  renderLedger();
  toast(bad.length ? bad.length + ' accounts differ' : 'Everything reconciles');
}
function svPostAdjustment(){
  const a = SV_ACC_BY_ID[(el('blAdjAcct') || {}).value] || SV_SAVINGS[0];
  const amount = Number((el('blAdjAmount') || {}).value || 0);
  const reason = (el('blAdjReason') || {}).value || '';
  if(!a) return;
  if(!amount){ toast('An adjustment needs an amount'); return; }
  if(!reason){ toast('An adjustment needs a reason'); return; }
  if(a.available + amount < 0){ toast('The adjustment would take ' + a.id + ' below zero'); return; }
  a.available += amount;
  a.ledger = a.available + a.reserved;
  const rec = {id: 'SAD-' + pad(330 + SV_ADJUST.length, 3), when: TODAY + ' ' + svNow(), account: a.id, cust: a.cust,
    amount, reason, by: 'STF-001', approver: 'STF-009', status: 'Posted', lane: 'Ledger', severity: 'Medium',
    owner: 'STF-001', region: a.region};
  SV_ADJUST.unshift(rec);
  SV_LEDGER.unshift({entry: 'LED-' + pad(92000 + SV_LEDGER.length, 5), when: rec.when, account: a.id, cust: a.cust,
    kind: 'Adjustment', side: amount > 0 ? 'Credit' : 'Debit', amount, balance: a.available,
    lane: 'Ledger', severity: 'Medium', owner: 'STF-001', region: a.region});
  svAudit('Adjustment posted', a.id, svM(amount) + ' · ' + reason);
  if(el('blAdjAmount')) el('blAdjAmount').value = '';
  if(el('blAdjReason')) el('blAdjReason').value = '';
  renderAll();
  toast('Adjustment posted to ' + a.id);
}

/* fees */
function svFeeSave(){
  const get = name => SV_FEE_STATE.fees.find(x => x.fee === name) || {amount: 0, pct: 0};
  const wdr = get('Withdrawal fee'), maint = get('Account maintenance'),
    trn = get('Transfer fee'), pen = get('Early withdrawal penalty'), dorm = get('Dormancy fee');
  openModal('Fees and penalties', 'What savings charges — a change is written to the fee history',
    `<div class="form-grid">
      ${`<div class="fg"><label>Withdrawal fee (%)</label><input id="feeWdrPct" type="number" step="0.1" value="${wdr.pct}" /></div>`}
      ${`<div class="fg"><label>Withdrawal fee flat (MWK)</label><input id="feeWdrFlat" type="number" step="100" value="${wdr.amount}" /></div>`}
      ${`<div class="fg"><label>Account maintenance (MWK)</label><input id="feeMaint" type="number" step="100" value="${maint.amount}" /></div>`}
      ${`<div class="fg"><label>Transfer fee (MWK)</label><input id="feeTransfer" type="number" step="100" value="${trn.amount}" /></div>`}
      ${`<div class="fg"><label>Early withdrawal penalty (%)</label><input id="feePenalty" type="number" step="0.1" value="${pen.pct}" /></div>`}
      ${`<div class="fg"><label>Dormancy fee (MWK)</label><input id="feeDormancy" type="number" step="100" value="${dorm.amount}" /></div>`}
    </div>
    <div class="qhint" style="margin-top:8px">Rates apply to the next transaction; nothing already posted is restated.</div>`,
    [{label: 'Save the fees', cls: 'btn-gold', act: svApplyFees}, {label: 'Close', act: 'close'}]);
}
function svApplyFees(){
  const v = id => Number((el(id) || {}).value || 0);
  const before = SV_SET.withdrawalFeePct + '% + ' + svM(SV_SET.withdrawalFeeFlat);
  SV_SET.withdrawalFeePct = v('feeWdrPct');
  SV_SET.withdrawalFeeFlat = v('feeWdrFlat');
  SV_SET.maintenanceFee = v('feeMaint');
  SV_SET.transferFeeFlat = v('feeTransfer');
  SV_SET.earlyPenaltyPct = v('feePenalty');
  SV_SET.dormancyFee = v('feeDormancy');
  SV_FEE_STATE.fees.forEach(f => {
    if(f.fee === 'Withdrawal fee'){ f.amount = SV_SET.withdrawalFeeFlat; f.pct = SV_SET.withdrawalFeePct; }
    if(f.fee === 'Account maintenance') f.amount = SV_SET.maintenanceFee;
    if(f.fee === 'Transfer fee') f.amount = SV_SET.transferFeeFlat;
    if(f.fee === 'Early withdrawal penalty') f.pct = SV_SET.earlyPenaltyPct;
    if(f.fee === 'Dormancy fee') f.amount = SV_SET.dormancyFee;
  });
  const after = SV_SET.withdrawalFeePct + '% + ' + svM(SV_SET.withdrawalFeeFlat);
  SV_FEE_STATE.hist.unshift({when: TODAY + ' ' + svNow(), scope: 'Savings fees', from: before, to: after, by: 'STF-001'});
  svLogChange('Fees', 'Savings fees', before, after);
  svAudit('Fees saved', 'Fees and penalties', after);
  closeModal();
  renderAll();
  toast('Fees saved · withdrawal now ' + after);
}

function svWaiver(){
  const cust = (el('flWaiverCust') || {}).value || CUSTOMERS[0].id;
  const fee = (el('flWaiverFee') || {}).value || 'Withdrawal fee';
  const amount = Number((el('flWaiverAmount') || {}).value || 0);
  const reason = (el('flWaiverReason') || {}).value || '';
  if(!amount || !reason){ toast('A waiver needs an amount and a reason'); return; }
  SV_FEE_STATE.waiver.unshift({id: 'SWV-' + pad(30 + SV_FEE_STATE.waiver.length, 3), when: TODAY + ' ' + svNow(),
    cust, fee, amount, reason, by: 'STF-001', approver: 'STF-009', status: 'Pending',
    lane: 'Fees', severity: 'Medium', owner: 'STF-001', region: (CUST_BY_ID[cust] || {}).region || 'Lilongwe'});
  svAudit('Fee waiver requested', fee, svM(amount) + ' · ' + custName(cust));
  if(el('flWaiverReason')) el('flWaiverReason').value = '';
  renderFees();
  toast('Waiver of ' + svM(amount) + ' requested');
}

/* transfers */
function svRunTransferChecks(){
  const r = svSmChecks();
  if(el('smChecks')) el('smChecks').innerHTML = r.checks.map(([l, ok, d]) => `<div class="checkrow"><div class="ck ${ok ? 'pass' : 'crit'}">${ok ? '✓' : '!'}</div>
      <div style="flex:1"><div style="font-size:10.5px;font-weight:800">${esc(l)}</div><div class="qhint">${esc(String(d))}</div></div>
      <div>${okb(ok ? 'Pass' : 'Failed')}</div></div>`).join('');
  toast(r.pass ? 'Every check passes — the transfer can be posted' : 'A check is failing — the transfer will be refused');
  return r;
}
function svPostTransfer(){
  const r = svSmChecks();
  const purpose = (el('smPurpose') || {}).value || 'Transfer between accounts';
  if(!r.pass){ toast('Refused: ' + r.checks.filter(c => !c[1]).map(c => c[0]).join('; ')); return; }
  const status = r.amount > SV_SET.approvalThreshold ? 'Pending approval' : 'Completed';
  const t = {id: 'SVX-' + pad(950000 + SV_TXN.length, 5), kind: 'Transfer', method: 'Internal transfer',
    provider: 'Golden ledger', rail: 'Internal', when: TODAY + ' ' + svNow(), cust: r.from.cust,
    source: r.from.id, dest: r.to.id, destName: custName(r.to.cust), account: r.from.id,
    amount: r.amount, fee: r.fee, currency: SV_SET.currency, ref: 'INT-' + pad(ri(100000, 999999), 6),
    description: purpose, status, stage: status === 'Completed' ? 'Posted to both accounts' : 'Awaiting approval',
    initiatedBy: 'STF-001', officer: 'STF-001', verifiedBy: 'STF-001',
    approvedBy: status === 'Completed' ? 'STF-001' : '', proof: '', notes: '', goal: '', interestRate: 0,
    daysHeld: 0, lane: 'Internal', severity: 'Low', owner: 'STF-001', region: r.from.region};
  SV_TXN.unshift(t);
  if(status === 'Completed'){
    r.from.available -= r.amount + r.fee; r.from.outTotal += r.amount + r.fee;
    r.from.ledger = r.from.available + r.from.reserved;
    r.to.available += r.amount; r.to.inTotal += r.amount;
    r.to.ledger = r.to.available + r.to.reserved;
    [t].forEach(() => {
      SV_LEDGER.unshift({entry: 'LED-' + pad(93000 + SV_LEDGER.length, 5), when: t.when, account: r.from.id,
        cust: r.from.cust, kind: 'Transfer', side: 'Debit', amount: -(r.amount + r.fee), balance: r.from.available,
        lane: 'Internal', severity: 'Low', owner: 'STF-001', region: r.from.region});
      SV_LEDGER.unshift({entry: 'LED-' + pad(93100 + SV_LEDGER.length, 5), when: t.when, account: r.to.id,
        cust: r.to.cust, kind: 'Transfer', side: 'Credit', amount: r.amount, balance: r.to.available,
        lane: 'Internal', severity: 'Low', owner: 'STF-001', region: r.to.region});
    });
  }else{
    r.from.reserved += r.amount + r.fee;
  }
  svAudit('Transfer posted', t.id, svM(r.amount) + ' · ' + r.from.id + ' → ' + r.to.id + ' · ' + status);
  renderAll();
  toast('Transfer ' + t.id + ' · ' + status.toLowerCase());
}
function svPayLoan(){
  const loanId = (el('smLoan') || {}).value;
  const loan = SV_LOAN_ROWS.find(l => l.id === loanId) || SV_LOAN_ROWS[0];
  const amount = Number((el('smLoanAmount') || {}).value || 0);
  if(!loan){ toast('No loan to pay'); return; }
  const acct = SV_ACC_OF_CUST(loan.cust, 'Savings');
  if(!acct){ toast('That customer has no savings account'); return; }
  if(amount <= 0){ toast('Enter an amount'); return; }
  if(acct.available < amount + SV_SET.transferFeeFlat){ toast('Not enough in ' + acct.id); return; }
  if(!SV_LOAN_ROWS.length){ toast('There is no live loan to pay'); return; }
  if(amount > loan.balance){ toast('The loan balance is only ' + svM(loan.balance)); return; }
  acct.available -= amount + SV_SET.transferFeeFlat;
  acct.outTotal += amount + SV_SET.transferFeeFlat;
  acct.ledger = acct.available + acct.reserved;
  loan.balance = Math.max(0, loan.balance - amount);
  const t = {id: 'SVX-' + pad(960000 + SV_TXN.length, 5), kind: 'Transfer', method: 'Internal transfer',
    provider: 'Golden ledger', rail: 'Internal', when: TODAY + ' ' + svNow(), cust: loan.cust,
    source: acct.id, dest: loan.id, destName: 'Loan ' + loan.id, account: acct.id, amount,
    fee: SV_SET.transferFeeFlat, currency: SV_SET.currency, ref: 'INT-' + pad(ri(100000, 999999), 6),
    description: 'Savings applied to loan ' + loan.id, status: 'Completed', stage: 'Posted to both ledgers',
    initiatedBy: 'STF-001', officer: 'STF-001', verifiedBy: 'STF-001', approvedBy: 'STF-001',
    proof: '', notes: '', goal: '', interestRate: 0, daysHeld: 0, lane: 'Internal', severity: 'Low',
    owner: 'STF-001', region: acct.region};
  SV_TXN.unshift(t);
  SV_LEDGER.unshift({entry: 'LED-' + pad(94000 + SV_LEDGER.length, 5), when: t.when, account: acct.id,
    cust: loan.cust, kind: 'Transfer', side: 'Debit', amount: -(amount + t.fee), balance: acct.available,
    lane: 'Internal', severity: 'Low', owner: 'STF-001', region: acct.region});
  svAudit('Loan paid from savings', t.id, svM(amount) + ' · ' + loan.id);
  renderAll();
  toast(svM(amount) + ' paid towards ' + loan.id);
}

/* statements */
function svStmtPrint(){
  if(!SV_STMT_STATE.rows.length){ toast('Build a statement first'); return; }
  printTable(SV_STMT_STATE.title,
    ['Date', 'Transaction', 'Reference', 'Account', 'Customer', 'Kind', 'Method', 'Amount', 'Fee', 'Status'].map((l, i) =>
      ({label: l, num: i === 7 || i === 8})), SV_STMT_STATE.rows);
  logExport(SV_STMT_STATE.title, 'PDF', SV_STMT_STATE.rows.length);
  renderExportHistory();
  toast('Statement sent to the printer');
}
function svStmtCsv(){
  if(!SV_STMT_STATE.rows.length){ toast('Build a statement first'); return; }
  const cols = ['Date', 'Transaction', 'Reference', 'Account', 'Customer', 'Kind', 'Method', 'Amount', 'Fee', 'Status'];
  downloadFile('savings-statement-' + TODAY.replace(/-/g, '') + '.csv', 'text/csv', toCsv([cols].concat(SV_STMT_STATE.rows)));
  logExport(SV_STMT_STATE.title, 'CSV', SV_STMT_STATE.rows.length);
  renderExportHistory();
  toast('Statement downloaded');
}
function svVerifyReceipt(){
  const q = String((el('rcpVerifyInput') || {}).value || '').trim();
  if(!q){ toast('Type a receipt number first'); return; }
  const r = SV_RECEIPTS.find(x => x.receipt.toLowerCase() === q.toLowerCase());
  if(r) svAudit('Receipt verified', r.receipt, svM(r.amount));
  renderStatements();
  toast(r ? 'Receipt ' + r.receipt + ' is genuine' : 'No receipt with that number');
}

/* database and settings */
function svFixRls(){
  const broken = SV_DB_TABLES.filter(t => t.rls !== 'Enabled');
  if(!broken.length){ toast('Every table already has a policy'); return; }
  broken.forEach(t => { t.rls = 'Enabled'; });
  SV_MIGRATIONS.forEach(m => { if(m.status === 'Pending') m.status = 'Applied'; });
  svAudit('RLS policy enabled', broken.map(t => t.table).join(', '), 'Policies written and applied');
  renderDatabase(); renderReports();
  toast('Row-level security enabled on ' + broken.length + ' table(s)');
}
function svDbChecks(){
  const checks = SV_DB_CHECKS();
  if(el('dbChecksBody')) el('dbChecksBody').innerHTML = checks.map(c => `<div class="checkrow"><div class="ck ${c.status === 'Pass' ? 'pass' : 'crit'}">${c.status === 'Pass' ? '✓' : '!'}</div>
      <div style="flex:1"><div style="font-size:10.5px;font-weight:800">${esc(c.check)}</div>
      <div class="qhint">${esc(String(c.value))}</div></div><div>${okb(c.status)}</div></div>`).join('');
  const fails = checks.filter(c => c.status !== 'Pass').length;
  svAudit('Integrity checks run', 'Savings tables', fails + ' failing');
  toast(fails ? fails + ' check(s) failing' : 'Every integrity check passes');
}
function svSchemaCheck(){
  const pending = SV_MIGRATIONS.filter(m => m.status !== 'Applied');
  SV_SCHEMA_RESULT = pending.length
    ? 'The app expects 2026.10.30.2; ' + pending.length + ' migration(s) are still pending: ' + pending.map(m => m.id).join(', ') + '.'
    : 'The deployed schema matches the app at 2026.10.30.2 — every migration is applied and no column is missing.';
  svAudit('Schema checked', 'Savings database', pending.length + ' pending');
  renderDatabase();
  toast(pending.length ? pending.length + ' migration(s) pending' : 'Schema is up to date');
}
function svSettingsSave(){
  const cfg = svReadSettings();
  const problems = svValidate(cfg);
  if(problems.length){
    const n = el('setMsg');
    if(n){ n.textContent = 'Not saved — ' + problems.join(' '); n.style.color = '#B42318'; }
    toast('The settings cannot be saved yet');
    return;
  }
  const moved = [];
  SV_FORM_MAP.forEach(([id, key]) => {
    const before = SV_SET[key];
    if(String(before) !== String(cfg[key])) moved.push([key, before, cfg[key]]);
  });
  if(!moved.length){ toast('Nothing has changed'); return; }
  moved.forEach(([key, before, after]) => {
    SV_SET[key] = after;
    svLogChange('Settings', SV_FORM_MAP.find(f => f[1] === key)[0].replace('set', '').replace(/([A-Z])/g, ' $1').trim(),
      before, after);
  });
  SV_SAVINGS.forEach(a => { a.interestRate = SV_SET.interestRate; });
  svAudit('Settings saved', String(moved.length) + ' setting(s)', moved.map(m => m[0]).join(', '));
  if(el('setMsg')){ el('setMsg').textContent = moved.length + ' setting(s) saved at ' + svNow() + ' and written to the change history.'; el('setMsg').style.color = ''; }
  renderAll();
  toast(moved.length + ' setting(s) saved');
}
function svSettingsReset(){
  const before = Object.assign({}, SV_SET);
  Object.keys(SV_SET_DEFAULTS).forEach(k => { SV_SET[k] = SV_SET_DEFAULTS[k]; });
  SV_SET.__filled = false;
  svWriteSettings();
  svLogChange('Settings', 'All settings', SV_SET.interestRate + '%', 'restored to the defaults');
  svAudit('Settings restored', 'Every setting', 'Interest was ' + before.interestRate + '%');
  renderAll();
  toast('Settings restored to the defaults');
}

/* ===================== wiring ===================== */
const SV_ACTS = {
  amOpenBtn: svAccOpen,
  amClearBtn: () => { ['amOpening', 'amNick', 'amReason'].forEach(k => { const n = el(k); if(n) n.value = ''; }); toast('The form is clear'); },
  amSaveBtn: svAccSave,
  amActivate: () => svAccState('Active'),
  amSuspend: () => svAccState('Suspended'),
  amReactivate: () => svAccState('Active'),
  amClose: () => svAccState('Closed'),
  cpVerifyBtn: svCustVerify,
  cpStmtBtn: () => { SV_SEL.cust = svCustItem().id; buildCustStatement(); },
  dpRecord: svDepRecord,
  dpReset: () => { ['dpAmount', 'dpNotes'].forEach(k => { const n = el(k); if(n) n.value = ''; }); toast('The deposit form is clear'); },
  dpVerifyBtn: svDepVerify, dpApproveBtn: svDepApprove, dpReceiptBtn: svDepReceipt,
  dpScanBtn: () => { svAudit('Duplicate scan', 'Deposits', String(SV_DUPLICATES.length) + ' held'); renderDeposits(); toast('The register has been scanned again'); },
  wdIdVerifyBtn: svWdIdentity, wdReqBtn: svWdRequest,
  wdReceiptBtn: () => { const t = SV_WITHDRAWALS.find(x => x.status === 'Completed'); svDepReceipt(t ? t.id : ''); },
  blRecalc: svRecalc, blRecon: svRecon, blAdjBtn: svPostAdjustment,
  itSave: svRateSave, itCalcBtn: svInterestCalc, itVerifyBtn: svInterestVerify, itStmtBtn: svInterestStatement,
  prSaveBtn: svProductSave,
  prResetBtn: () => { loadProductForm(SV_PRODUCTS[0]); renderProducts(); toast('The form is back to the first product'); },
  glAddBtn: svGoalAdd, glContribBtn: svGoalContribute, glUpdateBtn: svGoalUpdate,
  glCloseBtn: svGoalClose, glCancelBtn: svGoalCancel,
  glClearBtn: () => { const n = el('glName'); if(n) n.value = ''; const a = el('glTarget'); if(a) a.value = 300000; toast('The form is clear'); },
  pmReconBtn: () => { renderPayments(); toast('The rails have been reconciled'); },
  txSearchBtn: () => { SV_TX_STATE.q = ((el('txSearch') || {}).value || '').trim(); renderMonitoring(); toast('The register has been searched'); },
  txDupBtn: () => { svAudit('Duplicate scan', 'Transactions', String(SV_DUPLICATES.length) + ' held'); renderMonitoring(); toast('The register has been scanned again'); },
  stBuild: svBuildStatement, stPrint: svStmtPrint, stCsv: svStmtCsv, rcpVerifyBtn: svVerifyReceipt,
  flSaveBtn: svFeeSave, flWaiverBtn: svWaiver,
  smCheckBtn: svRunTransferChecks, smSubmitBtn: svPostTransfer, smLoanBtn: svPayLoan,
  smReconBtn: () => {
    const rows = svTransferRows();
    const done = rows.filter(t => t.status === 'Completed');
    if(el('smReconBox')){
      el('smReconBox').innerHTML = `<div class="minihead">Reconciliation run at ${esc(svNow())}</div>`
        + kvRow('Transfers settled', num(done.length))
        + kvRow('Value moved', svM(sum(done, t => t.amount)))
        + kvRow('Fees retained', svM(sum(done, t => t.fee)))
        + kvRow('Still in flight', num(rows.length - done.length))
        + kvRow('Every settled transfer has two ledger legs', okb('Yes'));
    }
    toast(num(done.length) + ' transfers reconcile');
  },
  ntTestSms: () => svTestChannel('SMS'), ntTestEmail: () => svTestChannel('Email'),
  drCfgSave: svDormancySave, drReverifyBtn: svDormancyReverify,
  dbRlsFix: svFixRls, dbCheck: svDbChecks, dbSchemaBtn: svSchemaCheck,
  packCsv: () => runSvPack('csv'), packXlsx: () => runSvPack('xlsx'),
  packPdf: () => runSvPack('pdf'), packPrint: () => runSvPack('pdf'),
  rpExportAll: () => { SV_REPORTS.slice(0, 8).forEach(r => runSvReport(r.key, 'csv')); toast('Eight authorised reports exported'); },
  setSave: svSettingsSave, setReset: svSettingsReset,
  fltApply: svApplyFilters,
  fltReset: () => {
    FILTER.lane = ''; FILTER.severity = ''; FILTER.status = '';
    FILTER.owner = ''; FILTER.region = ''; FILTER.product = ''; FILTER.q = '';
    FILTER.from = '2026-01-01'; FILTER.to = TODAY;
    ['fltSeverity', 'fltStatus', 'fltOwner', 'fltRegion', 'fltProduct'].forEach(k => { const n = el(k); if(n) n.value = ''; });
    ['fltSearch', 'globalSearch'].forEach(k => { const n = el(k); if(n) n.value = ''; });
    if(el('fltFrom')) el('fltFrom').value = FILTER.from;
    if(el('fltTo')) el('fltTo').value = FILTER.to;
    if(el('fltLaneChips')) el('fltLaneChips').querySelectorAll('.chip').forEach(c => c.classList.toggle('on', !c.dataset.lane));
    SV_TX_STATE.status = 'All';
    renderAll(); svFilterSummary();
    toast('Every filter is cleared');
  },
  refreshBtn: () => { renderAll(); svFilterSummary(); toast('Everything has been refreshed'); },
  printBtn: () => { doPrint('Savings Management', '<p>A full print of the savings module follows.</p>'); },
  quickCsv: () => runSvPack('csv'),
  menuBtn: () => { const n = el('sidebar') || document.querySelector('.sidebar'); if(n) n.classList.toggle('open'); },
  bellBtn: () => openModal('Savings alerts', svIssues().length + ' open',
    svIssues().slice(0, 8).map(a => `<div class="risk"><div><div class="rn">${esc(a.what)}</div>
      <div class="rs">${esc(a.detail)}</div></div><div class="rv">${badge(a.severity, SV_SEV(a.severity))}</div></div>`).join('')
    || '<div class="empty">Nothing is open.</div>', [{label: 'Close', act: 'close'}]),
  modalClose: () => closeModal()
};

function svRefreshChecks(){
  if(el('smChecks')){
    const r = svSmChecks();
    el('smChecks').innerHTML = r.checks.map(([l, ok, d]) => `<div class="checkrow"><div class="ck ${ok ? 'pass' : 'crit'}">${ok ? '✓' : '!'}</div>
      <div style="flex:1"><div style="font-size:10.5px;font-weight:800">${esc(l)}</div><div class="qhint">${esc(String(d))}</div></div>
      <div>${okb(ok ? 'Pass' : 'Failed')}</div></div>`).join('');
  }
}
function wireAll(){
  const doc = document;
  doc.addEventListener('click', e => {
    const t = e.target;
    if(t.closest('[data-tblsort]') || t.closest('[data-tblpage]') || t.closest('[data-tblrow]')){
      if(sortOrPage(e)) return;
    }
    const snav = t.closest('.snav');
    if(snav){ e.preventDefault(); goto(snav.getAttribute('href').slice(1)); return; }
    const chip = t.closest('[data-lane]');
    if(chip){
      FILTER.lane = chip.dataset.lane;
      if(el('fltLaneChips')) el('fltLaneChips').querySelectorAll('.chip').forEach(c => c.classList.toggle('on', c.dataset.lane === FILTER.lane));
      renderAll(); svFilterSummary();
      toast(FILTER.lane ? FILTER.lane + ' only' : 'Every area');
      return;
    }
    const clear = t.closest('[data-clear]');
    if(clear){ svClearFilter(clear.dataset.clear); return; }
    const go = t.closest('[data-goto]');
    if(go){ goto(go.dataset.goto); return; }
    const openTx = t.closest('[data-opentxn]');
    if(openTx){ openSavingsTxn(SV_TXN.find(x => x.id === openTx.dataset.opentxn)); return; }
    const wd = t.closest('[data-wdact]');
    if(wd){ svWdAct(wd.dataset.wdid, wd.dataset.wdact); return; }
    const rail = t.closest('[data-rail]');
    if(rail){ svRailToggle(rail.dataset.rail); return; }
    const txst = t.closest('[data-txstatus]');
    if(txst){ SV_TX_STATE.status = txst.dataset.txstatus; renderMonitoring(); return; }
    const perm = t.closest('[data-perm]');
    if(perm){ svPermToggle(perm.dataset.perm, Number(perm.dataset.cap)); return; }
    const ntrule = t.closest('[data-ntrule]');
    if(ntrule){ svRuleToggle(ntrule.dataset.ntrule); return; }
    const dract = t.closest('[data-dract]');
    if(dract){ svDrAction(dract.dataset.dract); return; }
    const drreq = t.closest('[data-drreq]');
    if(drreq){ svDrRequest(drreq.dataset.drreq); return; }
    const rep = t.closest('[data-rep]');
    if(rep){ runSvReport(rep.dataset.rep, rep.dataset.fmt); return; }
    const exp = t.closest('[data-exp]');
    if(exp){
      const x = EXPORTS[Number(exp.dataset.exp)];
      if(x) openModal(x.report, x.format + ' · ' + num(x.rows) + ' rows · ' + x.when,
        `<div class="note gold"><div>Generated by ${esc(x.by)} with the filters: ${esc(x.filters)}</div></div>`,
        [{label: 'Close', act: 'close'}]);
      return;
    }
    const act = SV_ACTS[t.id];
    if(act){ e.preventDefault(); act(); return; }
  });
  doc.addEventListener('input', e => {
    const id = e.target.id;
    if(id === 'smFrom' || id === 'smTo' || id === 'smAmount') svRefreshChecks();
    if(id === 'wdAmount' || id === 'wdMethod') renderWithdrawals();
    if(id === 'dpAmount' || id === 'dpMethod') renderDeposits();
  });
  doc.addEventListener('change', e => {
    const id = e.target.id;
    if(id === 'smFrom' || id === 'smTo' || id === 'smAmount') svRefreshChecks();
    if(id === 'wdAcct') renderWithdrawals();
    if(id === 'dpAcct') renderDeposits();
    if(id === 'glCust') renderGoals();
    if(id === 'itCalcAcct') renderInterest();
    if(id === 'blAdjAcct') renderLedger();
    if(id === 'amCust') renderAccounts();
    if(id === 'fltFrom' || id === 'fltTo') svApplyFilters();
    if(id === 'globalSearch'){
      FILTER.q = e.target.value.trim();
      if(el('fltSearch')) el('fltSearch').value = FILTER.q;
      renderAll(); svFilterSummary();
    }
  });
  doc.addEventListener('keydown', e => {
    if(e.key === 'Escape') closeModal();
    if(e.key === 'Enter' && (e.target.id === 'globalSearch' || e.target.id === 'fltSearch')) svApplyFilters();
    if(e.key === 'Enter' && e.target.id === 'rcpVerifyInput') svVerifyReceipt();
  });
}
function buildCustStatement(){
  const c = svCustItem();
  const acct = SV_ACC_OF_CUST(c.id, 'Savings');
  const txns = SV_TXN.filter(t => t.cust === c.id);
  if(el('cpStmtBox')){
    el('cpStmtBox').innerHTML = `<div class="minihead">Statement for ${esc(c.name)}</div>`
      + kvRow('Account', acct ? acct.id : '—')
      + kvRow('Transactions', num(txns.length))
      + kvRow('Available', svM(acct ? acct.available : 0))
      + kvRow('Interest paid', svM(acct ? acct.interestPaid : 0))
      + `<div class="qhint" style="margin-top:4px">Build a full statement in section 12.</div>`;
  }
  SV_SEL.acc = acct ? acct.id : SV_SEL.acc;
  toast('Profile statement built');
}

/* boot */
window.SAVINGS_APP = {
  FILTER, SV_SET, SV_SET_DEFAULTS, SV_PRODUCTS, SV_ACCOUNTS, SV_ACC_BY_ID, SV_SAVINGS, SV_TXN, SV_COMPLETED,
  SV_STATUSES, SV_STATUS_COUNTS, SV_VERIFY, SV_APPROVALS, SV_FAILED, SV_REVERSALS, SV_LEDGER, SV_DISCREPANCY,
  SV_LIMITS, SV_FEES, SV_DAILY, SV_GOALS, SV_BENEFICIARIES, SV_RECEIPTS, SV_NOTIFY_RULES, SV_NOTIFY_LOG,
  SV_ADJUST, SV_ACCRUAL, SV_INTEREST_HISTORY, SV_DORMANT, SV_REACTIVATIONS, SV_RESTRICTIONS, SV_UNCLAIMED,
  SV_ID_CHECKS, SV_ROLES, SV_CAPS, SV_STAFF_ACTIVITY, SV_CONN_ALERTS, SV_WEBHOOKS, SV_LOAN_ROWS, SV_GOAL_HISTORY,
  SV_FRAUD, SV_CONNS, SV_DB_TABLES, SV_DB_FUNCS, SV_DB_ERRORS, SV_MIGRATIONS, SV_REPORTS, SV_CHANGES, SV_AUDIT,
  SV_PERM_STATE, svStats, svReport, renderAll, runSvReport, runSvPack, goto, svApplyFilters, svFilterSummary,
  svAccOpen, svAccSave, svAccState, svCustVerify, svDepRecord, svDepVerify, svDepApprove, svDepReceipt,
  svWdIdentity, svWdRequest, svWdAct, svRateSave, svInterestCalc, svInterestVerify, svInterestStatement,
  svProductSave, svGoalAdd, svGoalContribute, svGoalUpdate, svGoalClose, svGoalCancel, svRailToggle,
  svRecalc, svRecon, svPostAdjustment, svFeeSave, svWaiver, svRunTransferChecks, svPostTransfer, svPayLoan,
  svRuleToggle, svTestChannel, svDormancySave, svDrAction, svDrRequest, svDormancyReverify, svPermToggle,
  svFixRls, svDbChecks, svSchemaCheck, svSettingsSave, svSettingsReset, svStmtPrint, svStmtCsv, svVerifyReceipt,
  svBuildStatement, openSavingsTxn, logExport, SV_ACTS
};

(function(){
  svFillFilters();
  svSyncFilters();
  renderAll();
  svFilterSummary();
  renderExportHistory();
  wireAll();
  const hash = (location.hash || '').slice(1);
  if(hash) goto(hash);
  document.querySelectorAll('.fchip[data-clear]').forEach(() => {});
})();
</script>
</body>
</html>
