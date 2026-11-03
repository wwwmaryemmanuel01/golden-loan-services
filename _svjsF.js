<script>
/* ============================================================
   SAVINGS MANAGEMENT & CONNECTIONS (6/8)
   Sections 9–12: savings goals, the payment method connections,
   the transaction monitoring and the statements and receipts.
   ============================================================ */

/* ===================== 9 · SAVINGS GOALS ===================== */
const SV_GOAL_STATE = {sel: ''};
function svGoalItem(){
  return SV_GOALS.find(g => g.id === SV_GOAL_STATE.sel) || SV_GOALS.filter(g => g.status === 'Active')[0] || SV_GOALS[0];
}
function renderGoals(){
  const rows = SV_GOALS.filter(svPass);
  const active = SV_GOALS.filter(g => g.status === 'Active');
  const done = SV_GOALS.filter(g => g.status === 'Completed');
  if(el('glPill')){ el('glPill').className = 'badge b-ok'; el('glPill').textContent = num(active.length) + ' active goals'; }
  put('glKpis', [
    ['Goals in view', num(rows.length), 'Of ' + num(SV_GOALS.length) + ' created', ''],
    ['Active', num(active.length), 'Still saving', ''],
    ['Completed', num(done.length), 'Target reached', ''],
    ['Cancelled', num(SV_GOALS.filter(g => g.status === 'Cancelled').length), 'Abandoned', ''],
    ['Target value', svM(sum(SV_GOALS, g => g.target)), 'Across every goal', ''],
    ['Saved so far', svM(sum(SV_GOALS, g => g.saved)), 'Held against the targets', ''],
    ['Average progress', Math.round(pct(sum(SV_GOALS, g => g.saved), Math.max(1, sum(SV_GOALS, g => g.target)))) + '%', 'Of the combined target', ''],
    ['Goals past their date', num(active.filter(g => g.targetDate < TODAY).length), 'Target date has passed', '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join(''));

  svFillSel('glCust', svCustOptions());
  const glCust = el('glCust') ? el('glCust').value : CUSTOMERS[0].id;
  if(el('glAcct')) svFillSel('glAcct', SV_ACCOUNTS.filter(a => a.cust === glCust && a.type === 'Savings').map(a => [a.id, a.id + ' · ' + svM(a.available)]));
  if(el('glDate') && !el('glDate').value) el('glDate').value = addDays(TODAY, 180);
  if(el('glMsg') && !String(el('glMsg').textContent || '').trim())
    el('glMsg').textContent = 'A goal is a label on real savings; contributions post a deposit to the account.';

  if(el('glCount')) el('glCount').textContent = num(rows.length) + ' goals';
  const list = rows.slice().sort((a, b) => b.saved / Math.max(1, b.target) - a.saved / Math.max(1, a.target));
  list.forEach(g => { g._open = () => { SV_GOAL_STATE.sel = g.id; renderGoals(); }; });
  renderTable('glBody', [
    {k: 'name', label: 'Goal'},
    {k: 'cust', label: 'Customer', html: v => esc(custName(v))},
    {k: 'target', label: 'Target', num: true, html: v => esc(svM(v))},
    {k: 'saved', label: 'Saved', num: true, html: v => esc(svM(v))},
    {k: '_p', label: 'Progress', num: true, html: (v, r) => Math.round(pct(r.saved, r.target)) + '%'},
    {k: 'targetDate', label: 'By', html: v => esc(fmtDate(v))},
    {k: 'status', label: 'State', html: v => okb(v)}
  ], list, {sort: 'saved', pageSize: 8});

  const g = svGoalItem();
  if(el('glSelPill')) el('glSelPill').textContent = g ? g.id : '—';
  const pctDone = g ? Math.round(pct(g.saved, g.target)) : 0;
  put('glDetail', g ? kvRow('Goal', g.name) + kvRow('Customer', custName(g.cust))
    + kvRow('Account', g.account) + kvRow('Target', svM(g.target))
    + kvRow('Saved', svM(g.saved)) + kvRow('Remaining', svM(Math.max(0, g.target - g.saved)))
    + kvRow('Target date', fmtDate(g.targetDate)) + kvRow('Created', fmtDate(g.created))
    + kvRow('Contributions', num(g.contributions)) + kvRow('State', okb(g.status))
    : '<div class="empty">No goal selected.</div>');
  put('glProgress', g ? `<div class="minihead">Progress</div>
      <div class="meter"><i style="width:${clamp(pctDone, 0, 100)}%"></i></div>
      <div class="qhint" style="margin-top:4px">${pctDone}% of ${esc(svM(g.target))} · ${esc(svM(Math.max(0, g.target - g.saved)))} to go
        ${g.targetDate < TODAY && g.status === 'Active' ? ' · <b style="color:#B42318">past the target date</b>' : ''}</div>` : '');
  if(el('glNewDate') && g && !el('glNewDate').value) el('glNewDate').value = g.targetDate;

  const hist = SV_GOAL_HISTORY.filter(x => x.goal === (g || {}).id);
  if(el('glHistPill')) el('glHistPill').textContent = num(hist.length) + ' rows';
  renderTable('glHistBody', [
    {k: 'when', label: 'When', html: v => esc(svWhen(v))},
    {k: 'goal', label: 'Goal'},
    {k: 'action', label: 'Action'},
    {k: 'amount', label: 'Amount', num: true, html: v => v ? esc(svM(v)) : '—'},
    {k: 'by', label: 'Officer', html: v => esc(staffName(v))}
  ], hist.concat(SV_GOALS.filter(x => x.status !== 'Active').map(x => ({
    when: x.created, goal: x.id, action: 'Goal ' + x.status.toLowerCase(), amount: x.saved, by: 'STF-001'
  }))).slice(0, 12), {sort: 'when', pageSize: 6});
}

/* ===================== 10 · PAYMENT METHOD CONNECTIONS ===================== */
const SV_PAY_STATE = {};
SV_METHODS.filter(m => m.direction !== 'Internal' && m.direction !== 'Credit only').forEach(m => {
  SV_PAY_STATE[m.method] = {status: 'Connected', fee: 0, window: 'Instant', uptime: 97 + (m.method.length % 3)};
});
function svRailRows(){
  return SV_METHODS.filter(m => m.direction === 'Both').map(m => {
    const st = SV_PAY_STATE[m.method];
    const txns = SV_TXN.filter(t => t.method === m.method && t.status === 'Completed');
    return {method: m.method, rail: m.rail, provider: m.provider, prefix: m.prefix,
      direction: m.direction, status: st.status, uptime: st.uptime,
      count: txns.length, value: sum(txns, t => t.amount),
      window: st.window, lane: m.lane, severity: st.status === 'Connected' ? 'Low' : 'High',
      owner: 'STF-001', region: 'Lilongwe'};
  });
}
function renderPayments(){
  const rails = svRailRows();
  const down = rails.filter(r => r.status !== 'Connected');
  if(el('pmPill')){ el('pmPill').className = down.length ? 'badge b-crit' : 'badge b-ok';
    el('pmPill').textContent = down.length ? num(down.length) + ' rail paused' : 'All rails connected'; }
  put('pmKpis', [
    ['Rails connected', num(rails.filter(r => r.status === 'Connected').length) + ' of ' + num(rails.length), 'Deposit and payout rails', ''],
    ['Money in', svM(sum(SV_DEPOSITS.filter(t => t.status === 'Completed'), t => t.amount)), num(SV_DEPOSITS.length) + ' deposits', ''],
    ['Money out', svM(sum(SV_WITHDRAWALS.filter(t => t.status === 'Completed'), t => t.amount)), num(SV_WITHDRAWALS.length) + ' payouts', ''],
    ['Provider references', num(SV_TXN.filter(t => t.ref).length), 'Returned by the rails', ''],
    ['Callbacks received', num(SV_TXN.filter(t => t.status === 'Completed' || t.status === 'Failed').length), 'Confirmations that arrived', ''],
    ['Failures', num(SV_FAILED.length), 'Refused or timed out', SV_FAILED.length ? 'red' : ''],
    ['Awaiting a callback', num(SV_TXN.filter(t => t.status === 'Processing').length), 'At the provider', ''],
    ['Median confirmation', '3.2 s', 'From request to callback', '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join(''));

  if(el('pmCount')) el('pmCount').textContent = num(rails.length) + ' rails';
  if(el('pmHead')) el('pmHead').innerHTML = '<tr><th>Method</th><th>Rail</th><th>Provider</th><th>Prefix</th>'
    + '<th class="num">Uptime</th><th class="num">Transactions</th><th class="num">Value</th><th>State</th><th>Control</th></tr>';
  if(el('pmBody')) el('pmBody').innerHTML = rails.map(r => `<tr>
      <td><b>${esc(r.method)}</b></td><td>${esc(r.rail)}</td><td>${esc(r.provider)}</td><td>${esc(r.prefix)}</td>
      <td class="num">${r.uptime}%</td><td class="num">${num(r.count)}</td><td class="num">${esc(svM(r.value))}</td>
      <td>${okb(r.status)}</td>
      <td><button class="btn btn-ghost" data-rail="${esc(r.method)}">${r.status === 'Connected' ? 'Pause' : 'Connect'}</button></td>
    </tr>`).join('');

  const depRows = rails.map(r => ({method: r.method, provider: r.provider,
    count: SV_TXN.filter(t => t.method === r.method && t.kind === 'Deposit').length,
    completed: SV_TXN.filter(t => t.method === r.method && t.kind === 'Deposit' && t.status === 'Completed').length,
    value: sum(SV_TXN.filter(t => t.method === r.method && t.kind === 'Deposit' && t.status === 'Completed'), t => t.amount),
    status: r.status, severity: r.severity, owner: 'STF-001', region: 'Lilongwe', lane: r.lane}));
  if(el('pmDepPill')) el('pmDepPill').textContent = num(SV_DEPOSITS.length) + ' deposits';
  renderTable('pmDepBody', [
    {k: 'method', label: 'Method'},
    {k: 'provider', label: 'Provider'},
    {k: 'count', label: 'Requests', num: true},
    {k: 'completed', label: 'Completed', num: true},
    {k: 'value', label: 'Value', num: true, html: v => esc(svM(v))},
    {k: 'status', label: 'State', html: v => okb(v)}
  ], depRows, {sort: 'value', pageSize: 5});

  const wdrRows = rails.map(r => ({method: r.method, provider: r.provider,
    count: SV_TXN.filter(t => t.method === r.method && t.kind === 'Withdrawal').length,
    completed: SV_TXN.filter(t => t.method === r.method && t.kind === 'Withdrawal' && t.status === 'Completed').length,
    fee: sum(SV_TXN.filter(t => t.method === r.method && t.kind === 'Withdrawal' && t.status === 'Completed'), t => t.fee),
    status: r.status, severity: r.severity, owner: 'STF-001', region: 'Lilongwe', lane: r.lane}));
  if(el('pmWdrPill')) el('pmWdrPill').textContent = num(SV_WITHDRAWALS.length) + ' payouts';
  renderTable('pmWdrBody', [
    {k: 'method', label: 'Method'},
    {k: 'provider', label: 'Provider'},
    {k: 'count', label: 'Requests', num: true},
    {k: 'completed', label: 'Completed', num: true},
    {k: 'fee', label: 'Fees', num: true, html: v => esc(svM(v))},
    {k: 'status', label: 'State', html: v => okb(v)}
  ], wdrRows, {sort: 'count', pageSize: 5});

  if(el('pmRefPill')) el('pmRefPill').textContent = num(SV_TXN.filter(t => t.ref).length) + ' references';
  renderTable('pmRefBody', [
    {k: 'ref', label: 'Reference'},
    {k: 'method', label: 'Method'},
    {k: 'when', label: 'When', html: v => esc(svWhen(v))},
    {k: 'txn', label: 'Transaction', html: (v, r) => esc(r.id)},
    {k: 'amount', label: 'Amount', num: true, html: v => esc(svM(v))},
    {k: 'status', label: 'State', html: v => okb(v)}
  ], SV_TXN.filter(t => t.ref).slice(0, 40), {sort: 'when', pageSize: 6});

  if(el('pmFailPill')) el('pmFailPill').textContent = num(SV_FAILED.length) + ' failed';
  put('pmConfirmBody', `<div class="minihead">Confirmation monitoring</div>`
    + kvRow('Callbacks received today', String(SV_TXN.filter(t => svIsos(t.when) === TODAY && ['Completed', 'Failed'].includes(t.status)).length))
    + kvRow('Still at the provider', String(SV_TXN.filter(t => t.status === 'Processing').length))
    + kvRow('No callback after 60 seconds', String(SV_FAILED.length))
    + kvRow('Retry queue', String(SV_FAILED.filter(f => f.retryable === 'Yes').length) + ' are retryable'));

  renderTable('pmFailBody', [
    {k: 'ref', label: 'Reference'},
    {k: 'method', label: 'Method'},
    {k: 'amount', label: 'Amount', num: true, html: v => esc(svM(v))},
    {k: 'reason', label: 'Reason', html: v => esc(String(v).slice(0, 30))},
    {k: 'retryable', label: 'Retry', html: v => badge(v, v === 'Yes' ? 'b-warn' : 'b-crit')}
  ], SV_FAILED, {sort: 'amount', pageSize: 5});

  put('pmReconBox', rails.map(r => `<div class="risk"><div><div class="rn">${esc(r.method)} · ${esc(r.provider)}</div>
      <div class="rs">${num(r.count)} completed transactions · ${esc(svM(r.value))}</div></div>
      <div class="rv">${okb(r.status === 'Connected' ? 'Matched' : 'Rail paused')}</div></div>`).join(''));

  put('pmGrid',
    chartBox({title: 'Money in by rail', sub: 'Completed deposits, MWK', type: 'bar', h: 200,
      cats: rails.map(r => r.method),
      series: [{name: 'Deposits', data: rails.map(r => sum(SV_DEPOSITS.filter(t => t.method === r.method && t.status === 'Completed'), t => t.amount)), colour: '#1E9E6A'}],
      value: svM(sum(SV_DEPOSITS.filter(t => t.status === 'Completed'), t => t.amount))}) +
    chartBox({title: 'Requests by rail', sub: 'Deposits and payouts together', type: 'donut', h: 200,
      cats: rails.map(r => r.method),
      series: [{name: 'Requests', data: rails.map(r => SV_TXN.filter(t => t.method === r.method).length)}],
      value: num(SV_TXN.length)}));
}

/* ===================== 11 · TRANSACTION MONITORING ===================== */
const SV_TX_STATE = {status: 'All', q: '', sel: ''};
function svTxItem(){
  return SV_TXN.find(t => t.id === SV_TX_STATE.sel) || null;
}
function renderMonitoring(){
  const base = SV_TXN.filter(t => SV_TX_STATE.status === 'All' || t.status === SV_TX_STATE.status)
    .filter(t => !SV_TX_STATE.q || matchQ(t.id, t.ref, t.account, t.amount, t.method, t.kind, custName(t.cust)));
  const rows = base.filter(svPass);
  if(el('txPill')){ el('txPill').className = 'badge b-gray'; el('txPill').textContent = num(rows.length) + ' in view'; }
  put('txKpis', [
    ['Transactions in view', num(rows.length), 'Of ' + num(SV_TXN.length) + ' on the register', ''],
    ['Value in view', svM(sum(rows, t => t.amount)), 'Whatever the state', ''],
    ['Completed', num(rows.filter(t => t.status === 'Completed').length), svM(sum(rows.filter(t => t.status === 'Completed'), t => t.amount)), ''],
    ['Pending', num(rows.filter(t => t.status.startsWith('Pending')).length), 'Verification or approval', rows.filter(t => t.status.startsWith('Pending')).length ? 'red' : ''],
    ['Failed', num(rows.filter(t => t.status === 'Failed').length), 'The provider refused', ''],
    ['Rejected', num(rows.filter(t => t.status === 'Rejected').length), 'An officer refused', ''],
    ['Reversed', num(rows.filter(t => t.status === 'Reversed').length), 'Undone after posting', ''],
    ['Duplicates held', num(SV_DUPLICATES.length), 'Groups with a repeated reference', SV_DUPLICATES.length ? 'red' : '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join(''));

  if(el('txChips')) el('txChips').innerHTML = ['All'].concat(SV_STATUSES).map(s =>
    `<button class="chip ${SV_TX_STATE.status === s ? 'on' : ''}" data-txstatus="${esc(s)}">${esc(s)} <b>${s === 'All' ? SV_TXN.length : SV_TXN.filter(t => t.status === s).length}</b></button>`).join('');
  if(el('txCount')) el('txCount').textContent = num(rows.length) + ' transactions';
  if(el('txSearch') && !el('txSearch').value && SV_TX_STATE.q) el('txSearch').value = SV_TX_STATE.q;
  if(el('txSearchBox')) el('txSearchBox').innerHTML = SV_TX_STATE.q
    ? `<div class="note gold"><div>Searching for “${esc(SV_TX_STATE.q)}” found ${num(rows.length)} transaction(s)
        in ${esc(SV_TX_STATE.status === 'All' ? 'every state' : SV_TX_STATE.status)}.</div></div>`
    : '<div class="qhint">Type a reference, account, customer or amount, then search the register.</div>';

  const list = rows.slice().sort((a, b) => String(b.when).localeCompare(String(a.when)));
  list.forEach(t => { t._open = () => { SV_TX_STATE.sel = t.id; renderMonitoring(); }; });
  renderTable('txBody', [
    {k: 'when', label: 'Date', html: v => esc(svWhen(v))},
    {k: 'id', label: 'Transaction'},
    {k: 'ref', label: 'Reference'},
    {k: 'cust', label: 'Customer', html: v => esc(custName(v))},
    {k: 'kind', label: 'Kind'},
    {k: 'method', label: 'Method'},
    {k: 'amount', label: 'Amount', num: true, html: v => esc(svM(v))},
    {k: 'status', label: 'State', html: v => okb(v)}
  ], list, {sort: 'when', pageSize: 10});

  const t = svTxItem();
  if(el('txSelPill')) el('txSelPill').textContent = t ? t.id : '—';
  put('txDetail', t ? kvRow('Transaction', t.id) + kvRow('Reference', t.ref)
    + kvRow('Customer', custName(t.cust)) + kvRow('Account', t.account)
    + kvRow('Kind', t.kind) + kvRow('Method', t.method + ' · ' + t.provider)
    + kvRow('Amount', svM(t.amount)) + kvRow('Fee', svM(t.fee))
    + kvRow('Source', String(t.source)) + kvRow('Destination', String(t.destName || t.dest))
    + kvRow('Status', okb(t.status)) + kvRow('Stage', esc(t.stage))
    + kvRow('Proof', t.proof ? okb('Attached') : badge('None', 'b-warn'))
    : '<div class="qhint">Click a transaction to see the whole record and its status history.</div>');
  if(el('txHistHead')) el('txHistHead').innerHTML = '<tr><th>When</th><th>State</th><th>Stage</th><th>Officer</th></tr>';
  const histRows = t ? [
    {when: t.when, status: 'Raised', stage: t.initiatedBy === 'Customer' ? 'By the customer' : 'By ' + staffName(t.initiatedBy), by: t.officer},
    {when: t.when, status: 'Pending verification', stage: 'Checks run automatically', by: 'The system'},
    {when: t.when, status: 'Verified', stage: t.verifiedBy ? 'Identity and proof agreed' : 'Still waiting', by: t.verifiedBy || '—'},
    {when: t.when, status: 'Approved', stage: t.approvedBy ? 'Within the officer limit' : 'Still waiting', by: t.approvedBy || '—'},
    {when: t.when, status: t.status, stage: t.stage, by: t.officer}
  ] : [];
  if(el('txHistBody')) el('txHistBody').innerHTML = histRows.map(h => `<tr>
      <td>${esc(svWhen(h.when))}</td><td>${okb(h.status)}</td><td>${esc(h.stage)}</td><td>${esc(h.by)}</td></tr>`).join('')
    || '<tr><td colspan="4" class="empty">Nothing selected.</td></tr>';

  if(el('txDupPill')) el('txDupPill').textContent = num(SV_DUPLICATES.length) + ' groups';
  if(el('txDupHead')) el('txDupHead').innerHTML = '<tr><th>Reference</th><th class="num">Rows</th><th class="num">Amount</th><th>Transactions</th><th>State</th></tr>';
  if(el('txDupBody')) el('txDupBody').innerHTML = SV_DUPLICATES.map(d => `<tr>
      <td><b>${esc(d.ref)}</b></td><td class="num">${d.count}</td><td class="num">${esc(svM(d.amount))}</td>
      <td>${esc(d.ids)}</td><td>${okb(d.status)}</td></tr>`).join('')
    || '<tr><td colspan="5" class="empty">No reference appears twice inside the window.</td></tr>';
  put('txDupBox', `<div class="qhint">A reference seen twice inside ${num(SV_SET.duplicateWindow)} minutes is held, never credited.
    Rescanning looks at every completed transaction again.</div>`);
}

/* ===================== 12 · STATEMENTS AND RECEIPTS ===================== */
const SV_STMT_STATE = {rows: [], title: ''};
function svBuildStatement(){
  const type = el('stType') ? el('stType').value : 'Individual';
  const cust = el('stCust') ? el('stCust').value : CUSTOMERS[0].id;
  const from = (el('stFrom') && el('stFrom').value) || addDays(TODAY, -30);
  const to = (el('stTo') && el('stTo').value) || TODAY;
  const acct = SV_ACC_OF_CUST(cust, 'Savings');
  const txns = SV_TXN.filter(t => (type === 'Individual' ? t.cust === cust : true)
    && svIsos(t.when) >= from && svIsos(t.when) <= to);
  const cols = ['Date', 'Transaction', 'Reference', 'Account', 'Customer', 'Kind', 'Method', 'Amount', 'Fee', 'Status'];
  const rows = txns.map(t => [svIsos(t.when), t.id, t.ref, t.account, custName(t.cust), t.kind, t.method, t.amount, t.fee, t.status]);
  SV_STMT_STATE.rows = rows;
  SV_STMT_STATE.title = type + ' savings statement · ' + (type === 'Individual' ? custName(cust) : 'All customers') + ' · ' + from + ' to ' + to;
  const inAmt = sum(txns.filter(t => t.kind === 'Deposit' || t.kind === 'Interest credit'), t => t.amount);
  const outAmt = sum(txns.filter(t => t.kind === 'Withdrawal' || t.kind === 'Transfer'), t => t.amount + t.fee);
  if(el('stPill')){ el('stPill').className = 'badge b-ok'; el('stPill').textContent = type + ' statement'; }
  put('stBox', `<div class="stmt">
      <div class="stmt-head"><div><div class="stmt-brand">Golden Loan Services</div>
        <div class="qhint">Savings statement · ${esc(type.toLowerCase())}</div></div>
        <div class="stmt-meta">
          <div><b>${esc(type === 'Individual' ? custName(cust) : 'All customers')}</b></div>
          <div>${esc(acct ? acct.id : 'Every savings account')}</div>
          <div>${esc(from)} → ${esc(to)}</div>
          <div>Generated ${esc(TODAY)}</div>
        </div></div>
      <div class="strip" style="margin:8px 0">
        <div><div class="sl">Opening</div><div class="sv">${esc(svM(acct ? acct.opening : 0))}</div></div>
        <div><div class="sl">Credits</div><div class="sv">${esc(svM(inAmt))}</div></div>
        <div><div class="sl">Debits</div><div class="sv">${esc(svM(outAmt))}</div></div>
        <div><div class="sl">Closing</div><div class="sv">${esc(svM(acct ? acct.available : 0))}</div></div>
      </div>
      <div class="qhint">${num(rows.length)} line${rows.length === 1 ? '' : 's'} · printed or downloaded from the buttons above</div>
    </div>`);
  toast('Statement built · ' + num(rows.length) + ' lines');
}
function renderStatements(){
  const s = svStats();
  if(el('stKpis')) put('stKpis', [
    ['Statements issued', num(SV_STATEMENTS.length), 'Individual, monthly and annual', ''],
    ['Receipts issued', num(SV_RECEIPTS.length), 'One per completed transaction', ''],
    ['Reissued receipts', num(SV_RECEIPTS.filter(r => r.issued === 'Reissued').length), 'After a correction', ''],
    ['Corrections logged', num(SV_RECEIPT_CORRECTIONS.length), 'Fields changed on a receipt', ''],
    ['Deposit receipts', num(SV_RECEIPTS.filter(r => r.kind === 'Deposit').length), 'Money in', ''],
    ['Withdrawal receipts', num(SV_RECEIPTS.filter(r => r.kind === 'Withdrawal').length), 'Money out', ''],
    ['Interest statements', num(SV_INTEREST_HISTORY.length), 'One per month posted', ''],
    ['Fees receipted', svM(sum(SV_RECEIPTS, r => r.fee)), 'Charged on those receipts', '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join(''));

  svFillSel('stCust', svCustOptions());
  if(el('stFrom') && !el('stFrom').value) el('stFrom').value = addDays(TODAY, -30);
  if(el('stTo') && !el('stTo').value) el('stTo').value = TODAY;

  if(el('rcpPill')) el('rcpPill').textContent = num(SV_RECEIPTS.length) + ' receipts';
  renderTable('rcpBody', [
    {k: 'receipt', label: 'Receipt'},
    {k: 'when', label: 'When', html: v => esc(svWhen(v))},
    {k: 'cust', label: 'Customer', html: v => esc(custName(v))},
    {k: 'kind', label: 'Kind'},
    {k: 'amount', label: 'Amount', num: true, html: v => esc(svM(v))},
    {k: 'issued', label: 'Issued', html: v => okb(v)}
  ], SV_RECEIPTS, {sort: 'when', pageSize: 8});

  const q = String((el('rcpVerifyInput') || {}).value || '').trim();
  if(el('rcpVerifyBox')){
    if(!q){
      el('rcpVerifyBox').innerHTML = '<div class="qhint">Type a receipt number, for example ' + esc(SV_RECEIPTS[0].receipt) + ', then verify it.</div>';
    }else{
      const r = SV_RECEIPTS.find(x => x.receipt.toLowerCase() === q.toLowerCase());
      if(!r) el('rcpVerifyBox').innerHTML = `<div class="checkrow"><div class="ck crit">!</div>
        <div style="flex:1"><div style="font-size:10.5px;font-weight:800">${esc(q)} is not on the register</div>
        <div class="qhint">No receipt with that number has been issued.</div></div><div>${badge('Not found', 'b-crit')}</div></div>`;
      else{
        const t = SV_TXN.find(x => x.id === r.txn) || {};
        el('rcpVerifyBox').innerHTML = `<div class="checkrow"><div class="ck pass">✓</div>
          <div style="flex:1"><div style="font-size:10.5px;font-weight:800">${esc(r.receipt)} is genuine</div>
          <div class="qhint">${esc(custName(r.cust))} · ${esc(svM(r.amount))} · ${esc(r.kind)} · ${esc(svWhen(r.when))}</div></div>
          <div>${okb('Verified')}</div></div>
          ${kvRow('Transaction', r.txn + ' · ' + r.status)}${kvRow('Account', r.account)}
          ${kvRow('Method', r.method)}${kvRow('Fee', svM(r.fee))}`;
      }
    }
  }
  if(el('rcpReissueHead')) el('rcpReissueHead').innerHTML = '<tr><th>Correction</th><th>Receipt</th><th>Field</th><th>From</th><th>To</th><th>State</th></tr>';
  if(el('rcpReissueBody')) el('rcpReissueBody').innerHTML = SV_RECEIPT_CORRECTIONS.map(c => `<tr>
      <td>${esc(c.id)}</td><td>${esc(c.receipt)}</td><td>${esc(c.field)}</td>
      <td>${esc(c.from)}</td><td>${esc(c.to)}</td><td>${okb(c.status)}</td></tr>`).join('')
    || '<tr><td colspan="6" class="empty">No correction recorded.</td></tr>';

  if(el('stGenPill')) el('stGenPill').textContent = num(SV_STATEMENTS.length) + ' generated';
  renderTable('stGenBody', [
    {k: 'id', label: 'Statement'},
    {k: 'when', label: 'Generated', html: v => esc(svWhen(v))},
    {k: 'cust', label: 'Customer', html: v => esc(custName(v))},
    {k: 'scope', label: 'Scope'},
    {k: 'rows', label: 'Lines', num: true},
    {k: 'by', label: 'Officer', html: v => esc(staffName(v))},
    {k: 'status', label: 'State', html: v => okb(v)}
  ], SV_STATEMENTS, {sort: 'when', pageSize: 6});
}
</script>
