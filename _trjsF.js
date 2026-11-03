<script>
/* ============================================================
   TRANSFERS MANAGEMENT & CONNECTIONS (6/8)
   Sections 9–12: approvals, status and processing, the balance
   and the ledger, and the fees and limits that govern a transfer.
   ============================================================ */

/* ===================== 9 · TRANSFER APPROVALS ===================== */
function trApproveItem(){
  return TR_APPROVALS.find(a => a.id === TR_SEL.approve) || TR_APPROVALS.find(a => a.status === 'Pending') || TR_APPROVALS[0];
}
function trRiskOf(a){
  return TR_RISK.find(r => r.ref === (a || {}).ref) || {checks: [], score: 'Low'};
}
function renderApprovals(){
  const queue = TR_APPROVALS.filter(a => a.status === 'Pending' && trPass(a));
  const high = TR_APPROVALS.filter(a => a.risk === 'High');
  const sel = trApproveItem();
  const risk = trRiskOf(sel);
  const s = trS();
  if(el('taPill')){ el('taPill').className = 'badge ' + (queue.length ? 'b-warn' : 'b-ok');
    el('taPill').textContent = num(queue.length) + ' waiting'; }
  put('taKpis', [
    ['Waiting for approval', num(queue.length), 'Above the approval threshold', queue.length ? 'red' : ''],
    ['Value waiting', trM(sum(queue, a => a.amount)), 'Held until signed', ''],
    ['First level', num(queue.filter(a => a.level === 'First level').length), 'One signature', ''],
    ['Management level', num(queue.filter(a => a.level === 'Management').length), 'Second signature', ''],
    ['High risk', num(high.length), 'Needs a second pair of eyes', high.length ? 'red' : ''],
    ['Self-approvals blocked', num(TR_APPROVALS.filter(a => a.selfApproval).length), 'The raiser may not sign', ''],
    ['Approved today', num(TR_APPROVALS.filter(a => a.level1 === 'Approved' && a.status !== 'Pending').length), 'Cleared the queue', ''],
    ['Approval threshold', trM(TR_SET.approvalThreshold), 'Second signature above ' + trM(TR_SET.secondApprovalThreshold), '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join(''));

  if(el('taqPill')) el('taqPill').textContent = num(queue.length) + ' in the queue';
  const rows = queue.slice();
  rows.forEach(a => { a._open = () => { TR_SEL.approve = a.id; renderApprovals(); }; });
  renderTable('taqBody', [
    {k: 'id', label: 'Queue'},
    {k: 'ref', label: 'Transfer'},
    {k: 'when', label: 'Raised', html: v => esc(trWhen(v))},
    {k: 'cust', label: 'Customer', html: v => esc(custName(v))},
    {k: 'method', label: 'Method'},
    {k: 'amount', label: 'Amount', num: true, html: v => esc(trM(v))},
    {k: 'level', label: 'Level', html: v => badge(v, v === 'Management' ? 'b-warn' : 'b-gray')},
    {k: 'risk', label: 'Risk', html: v => badge(v, TR_SEV(v))}
  ], rows, {sort: 'amount', pageSize: 8});

  if(el('taThrPill')) el('taThrPill').textContent = num(TR_THRESHOLDS.length) + ' bands';
  renderTable('taThrBody', [
    {k: 'band', label: 'Amount band'},
    {k: 'level1', label: 'First approval'},
    {k: 'level2', label: 'Second approval'},
    {k: 'days', label: 'Timing'}
  ], TR_THRESHOLDS, {sort: 'band', pageSize: 4, dir: 'asc'});

  if(el('taAppr1') && !el('taAppr1').value) el('taAppr1').value = TR_SET.approvalThreshold;
  if(el('taAppr2') && !el('taAppr2').value) el('taAppr2').value = TR_SET.secondApprovalThreshold;

  put('taDualBox', `<div class="minihead">Dual authorisation</div>`
    + kvRow('First signature', sel && sel.level1 === 'Approved' ? okb('Approved') : badge('Pending', 'b-warn'))
    + kvRow('Second signature', sel && sel.level2 === 'Approved' ? okb('Approved') : badge('Pending', 'b-warn'))
    + kvRow('Amount', sel ? trM(sel.amount) : '—')
    + kvRow('Required level', sel ? sel.level : '—')
    + kvRow('Above the second threshold', sel && sel.amount > TR_SET.secondApprovalThreshold ? 'Yes' : 'No')
    + `<div class="qhint" style="margin-top:6px">Two different officers must sign anything above ${trM(TR_SET.secondApprovalThreshold)}.</div>`);
  put('taSelfBox', `<div class="minihead">Self-approval guard</div>`
    + kvRow('Officer who raised it', staffName('STF-001'))
    + kvRow('Approver', staffName('STF-009'))
    + kvRow('Same person', sel && sel.selfApproval ? badge('Yes — blocked', 'b-crit') : okb('No'))
    + kvRow('Rule', 'The raiser may never sign their own transfer')
    + kvRow('Attempts blocked today', num(TR_APPROVALS.filter(a => a.selfApproval).length)));

  if(el('taHighPill')) el('taHighPill').textContent = num(high.length) + ' high risk';
  renderTable('taHighBody', [
    {k: 'ref', label: 'Transfer'},
    {k: 'cust', label: 'Customer', html: v => esc(custName(v))},
    {k: 'amount', label: 'Amount', num: true, html: v => esc(trM(v))},
    {k: 'selfApproval', label: 'Self-approval', html: v => badge(v ? 'Attempted' : 'No', v ? 'b-crit' : 'b-ok')},
    {k: 'risk', label: 'Risk', html: v => badge(v, TR_SEV(v))}
  ], high, {sort: 'amount', pageSize: 5});

  if(el('taAuditPill')) el('taAuditPill').textContent = num(TR_APPROVAL_HISTORY.length) + ' decisions';
  renderTable('taAuditBody', [
    {k: 'when', label: 'When', html: v => esc(trWhen(v))},
    {k: 'ref', label: 'Transfer'},
    {k: 'action', label: 'Decision', html: v => okb(v)},
    {k: 'level', label: 'Level'},
    {k: 'by', label: 'Officer', html: v => esc(staffName(v))},
    {k: 'notes', label: 'Note', html: v => esc(String(v).slice(0, 46))}
  ], TR_APPROVAL_HISTORY, {sort: 'when', pageSize: 6});

  if(el('taRiskBox')){
    put('taRiskBox', risk.checks.length ? risk.checks.map(([l, ok]) => `<div class="checkrow">
        <div class="ck ${ok ? 'pass' : 'crit'}">${ok ? '✓' : '!'}</div>
        <div style="flex:1"><div style="font-size:10.5px;font-weight:800">${esc(l)}</div></div>
        <div>${okb(ok ? 'Pass' : 'Failed')}</div></div>`).join('')
      : '<div class="empty">Select a transfer in the queue.</div>');
  }
  if(el('taMsg') && !String(el('taMsg').textContent || '').trim())
    el('taMsg').textContent = 'Select a transfer, read the risk checks, then approve it at the level it needs.';
}

/* ===================== 10 · STATUS TRACKING & PROCESSING ===================== */
function renderProcessing(){
  const rows = TR_TXN.filter(trPass);
  const s = trS();
  if(el('stPill')){ el('stPill').className = 'badge b-gray'; el('stPill').textContent = num(rows.length) + ' in view'; }
  put('stKpis', [
    ['In view', num(rows.length), 'After the filter bar', ''],
    ['Drafts', num(rows.filter(t => t.status === 'Draft').length), 'Not submitted', ''],
    ['Awaiting verification', num(rows.filter(t => t.status === 'Pending verification').length), 'Queue eight', ''],
    ['Awaiting approval', num(rows.filter(t => t.status === 'Pending approval').length), 'Queue nine', ''],
    ['At the provider', num(rows.filter(t => t.status === 'Processing').length), 'Waiting for a reference', ''],
    ['Completed', num(rows.filter(t => t.status === 'Completed').length), 'Posted both sides', ''],
    ['Failed or rejected', num(rows.filter(t => ['Failed', 'Rejected'].includes(t.status)).length), 'Needs a decision', ''],
    ['Reversed', num(rows.filter(t => t.status === 'Reversed').length), 'Restored to the source', '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join(''));

  if(el('stCount')) el('stCount').textContent = num(rows.length) + ' rows';
  const chips = ['All'].concat(TR_STATUSES);
  if(el('stChips')){
    el('stChips').innerHTML = chips.map(c => {
      const active = c === 'All' ? !FILTER.status : FILTER.status === c;
      const n = c === 'All' ? rows.length : rows.filter(t => t.status === c).length;
      return `<button class="chip${active ? ' on' : ''}" data-stchip="${esc(c)}">${esc(c)} · ${num(n)}</button>`;
    }).join('');
  }

  const view = rows.filter(t => !FILTER.status || t.status === FILTER.status);
  const sel = TR_TXN.find(t => t.id === TR_SEL.txn) || view[0] || rows[0];
  const sorted = view.slice().sort((a, b) => String(b.when).localeCompare(String(a.when)));
  sorted.forEach(t => { t._open = () => { TR_SEL.txn = t.id; renderProcessing(); }; });
  renderTable('stBody', [
    {k: 'id', label: 'Reference'},
    {k: 'when', label: 'Date', html: v => esc(trWhen(v))},
    {k: 'cust', label: 'Customer', html: v => esc(custName(v))},
    {k: 'method', label: 'Method'},
    {k: 'amount', label: 'Amount', num: true, html: v => esc(trM(v))},
    {k: 'status', label: 'Status', html: v => okb(v)},
    {k: 'stage', label: 'Where it is', html: v => esc(String(v).slice(0, 28))}
  ], sorted, {sort: 'when', pageSize: 8});

  if(el('stSelPill')) el('stSelPill').textContent = sel ? sel.id : '—';
  put('stDetail', sel ? strip([
    ['Reference', sel.id],
    ['Amount', trM(sel.amount)],
    ['Method', sel.method],
    ['Status', sel.status]
  ]) + `<div class="minihead" style="margin-top:8px">The parties</div>`
    + kvRow('Customer', (custName(sel.cust) || '—') + (sel.cust ? ' · ' + sel.cust : ''))
    + kvRow('Source', sel.source || '—')
    + kvRow('Destination', (sel.destName || '—') + (sel.dest ? ' · ' + sel.dest : ''))
    + kvRow('Provider reference', sel.ref)
    + kvRow('Officer', staffName(sel.officer))
    + kvRow('Verified by', sel.verifiedBy ? staffName(sel.verifiedBy) : 'Not verified')
    + kvRow('Approved by', sel.approvedBy ? staffName(sel.approvedBy) : 'Not approved')
    : '<div class="empty">Select a transfer.</div>');

  const conn = TR_CONNS.find(c => (sel && sel.method === 'Bank transfer' && c.rail === 'Bank')
    || (sel && sel.method === 'Airtel Money' && c.name === 'Airtel Money')
    || (sel && sel.method === 'TNM Mpamba' && c.name === 'TNM Mpamba')
    || (sel && sel.rail === 'Internal' && c.rail === 'Internal')) || TR_CONNS[0];
  if(el('stProvBox')){
    el('stProvBox').innerHTML = `<div class="minihead">The provider carrying it</div>`
      + kvRow('Provider', conn.provider) + kvRow('Status', okb(conn.status))
      + kvRow('Latency', conn.latency + ' ms') + kvRow('Uptime', conn.uptime + '%')
      + kvRow('Webhook', conn.signature)
      + kvRow('Last check', trWhen(conn.lastCheck))
      + `<div class="qhint" style="margin-top:6px">${esc(sel ? sel.stage : '')}</div>`;
  }
  trFillSel('stStatusSel', TR_STATUSES.map(x => [x, x]), sel ? sel.status : 'Completed');

  if(el('stHistPill')) el('stHistPill').textContent = num(sorted.length) + ' reached';
  renderTable('stHistBody', [
    {k: 'status', label: 'State', html: v => okb(v)},
    {k: 'n', label: 'Transfers', num: true},
    {k: 'value', label: 'Value', num: true, html: v => esc(trM(v))}
  ], TR_STATUSES.map(st => ({status: st, n: TR_TXN.filter(t => t.status === st).length,
    value: sum(TR_TXN.filter(t => t.status === st), t => t.amount)})), {sort: 'n', pageSize: 10});

  if(el('stDupHead')) el('stDupHead').textContent = TR_DUPLICATES.length + ' groups';
  renderTable('stDupBody', [
    {k: 'ref', label: 'Provider reference'},
    {k: 'count', label: 'Occurrences', num: true},
    {k: 'ids', label: 'Transfers'},
    {k: 'amount', label: 'Value', num: true, html: v => esc(trM(v))},
    {k: 'status', label: 'State', html: v => okb(v)}
  ], TR_DUPLICATES, {sort: 'amount', pageSize: 4});

  put('stGrid',
    chartBox({title: 'Transfers by state', sub: 'Every row on the register', type: 'donut', h: 200,
      cats: TR_STATUSES, series: [{name: 'Transfers', data: TR_STATUSES.map(st => TR_TXN.filter(t => t.status === st).length)}],
      value: num(TR_TXN.length)}) +
    chartBox({title: 'Where value sits', sub: 'MWK by state', type: 'bar', h: 200,
      cats: TR_STATUSES.map(x => x.split(' ')[0]),
      series: [{name: 'Value', data: TR_STATUSES.map(st => sum(TR_TXN.filter(t => t.status === st), t => t.amount))}],
      value: compact(s.totalAmount)}));
}

/* ===================== 11 · BALANCE AND LEDGER ===================== */
function renderLedger(){
  const done = TR_COMPLETED;
  const debits = sum(TR_LEDGER.filter(e => e.side === 'Debit'), e => Math.abs(e.amount));
  const credits = sum(TR_LEDGER.filter(e => e.side === 'Credit'), e => e.amount);
  const net = sum(TR_LEDGER, e => e.amount);
  const s = trS();
  if(el('ldPill')){ el('ldPill').className = 'badge b-gray'; el('ldPill').textContent = num(TR_LEDGER.length) + ' ledger entries'; }
  put('ldKpis', [
    ['Ledger entries', num(TR_LEDGER.length), 'A debit and a credit per transfer', ''],
    ['Debits posted', trM(debits), 'Money leaving an account', ''],
    ['Credits posted', trM(credits), 'Money landing in an account', ''],
    ['Net movement', trM(net), Math.abs(net) < 1 ? 'Balanced at zero' : 'Out of balance', Math.abs(net) < 1 ? '' : 'red'],
    ['Accounts tracked', num(TR_ACCOUNTS.length), 'Every current and savings account', ''],
    ['Discrepancies', num(TR_DISCREPANCY.length), 'Ledger against available balance', TR_DISCREPANCY.length ? 'red' : ''],
    ['Adjustments', num(TR_ADJUST.length), 'Manual corrections on record', ''],
    ['Available across the book', trM(s.availableTotal), trM(s.reservedTotal) + ' reserved', '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join(''));

  if(el('ldCompPill')) el('ldCompPill').textContent = num(done.length) + ' completed';
  put('ldComp', strip([
    ['Completed transfers', num(done.length)],
    ['Value moved', trM(sum(done, t => t.amount))],
    ['Fees charged', trM(sum(done, t => t.fee))],
    ['Reserved now', trM(s.reservedTotal)]
  ]) + `<div class="qhint" style="margin-top:6px">Every completed transfer writes one debit and one credit. Nothing else may touch an account balance.</div>`);

  if(el('ldFlowPill')) el('ldFlowPill').textContent = Math.abs(net) < 1 ? 'Balanced' : 'Out of balance';
  put('ldFlow', chartBox({title: 'Debits against credits', sub: 'By day, MWK', type: 'bar', h: 200,
    cats: TR_DAILY.map(d => d.label),
    series: [{name: 'Debits', data: TR_DAILY.map(d => sum(TR_LEDGER.filter(e => e.side === 'Debit' && String(e.when).slice(0, 10) === d.day), e => Math.abs(e.amount))), colour: '#D93F3F'},
      {name: 'Credits', data: TR_DAILY.map(d => sum(TR_LEDGER.filter(e => e.side === 'Credit' && String(e.when).slice(0, 10) === d.day), e => e.amount)), colour: '#1E9E6A'}],
    value: trM(credits)}));

  const led = TR_LEDGER.filter(trPass);
  if(el('ldLedgerPill')) el('ldLedgerPill').textContent = num(led.length) + ' rows';
  const sorted = led.slice().sort((a, b) => String(b.when).localeCompare(String(a.when)));
  renderTable('ldBody', [
    {k: 'entry', label: 'Entry'},
    {k: 'when', label: 'When', html: v => esc(trWhen(v))},
    {k: 'account', label: 'Account'},
    {k: 'cust', label: 'Customer', html: v => esc(custName(v))},
    {k: 'txn', label: 'Transfer'},
    {k: 'side', label: 'Side', html: v => badge(v, v === 'Credit' ? 'b-ok' : 'b-warn')},
    {k: 'amount', label: 'Amount', num: true, html: v => `<b style="color:${Number(v) < 0 ? '#B42318' : '#1E7A4F'}">${esc(trM(v))}</b>`},
    {k: 'balance', label: 'Balance after', num: true, html: v => esc(trM(v))}
  ], sorted, {sort: 'when', pageSize: 8});

  if(el('ldDiscPill')) el('ldDiscPill').textContent = num(TR_DISCREPANCY.length) + ' open';
  put('ldDisc', TR_DISCREPANCY.map(d => `<div class="risk"><div><div class="rn">${esc(d.account)} · ${esc(custName(d.cust))}</div>
      <div class="rs">${esc(d.note)}</div></div><div class="rv">${badge(trM(Math.abs(d.difference)) + ' out', TR_SEV(d.severity))}</div></div>`).join('')
    || '<div class="empty">The ledger and the balances agree on every account.</div>');

  trFillSel('ldAdjAcct', TR_ACCOUNTS.slice(0, 60).map(a => [a.id, a.id + ' · ' + custName(a.cust) + ' · ' + trM(a.available)]));
  const adjAcct = TR_ACC_BY_ID[el('ldAdjAcct') ? el('ldAdjAcct').value : ''] || TR_ACCOUNTS[0];
  const adjAmt = Number(el('ldAdjAmount') ? el('ldAdjAmount').value : 0) || 0;
  if(el('ldAdjPill')) el('ldAdjPill').textContent = num(TR_ADJUST.length) + ' adjustments';
  if(el('ldMsg') && !String(el('ldMsg').textContent || '').trim())
    el('ldMsg').textContent = 'An adjustment needs an account, an amount and a reason — it is posted with your name on it.';
  if(el('ldGuardPill')) el('ldGuardPill').textContent = 'Guards on';
  if(el('ldGuard')) el('ldGuard').innerHTML = `<div class="minihead">Effect of the pending adjustment</div>`
    + kvRow('Account', adjAcct.id) + kvRow('Balance now', trM(adjAcct.available))
    + kvRow('Adjustment', (adjAmt >= 0 ? '+' : '−') + trM(Math.abs(adjAmt)))
    + kvRow('Balance after', trM(Math.max(0, adjAcct.available + adjAmt)))
    + kvRow('Reason given', el('ldAdjReason') && el('ldAdjReason').value ? esc(el('ldAdjReason').value) : badge('Required', 'b-warn'));

  renderTable('ldAdjBody', [
    {k: 'id', label: 'Adjustment'},
    {k: 'when', label: 'When', html: v => esc(trWhen(v))},
    {k: 'account', label: 'Account'},
    {k: 'amount', label: 'Amount', num: true, html: v => esc(trM(v))},
    {k: 'reason', label: 'Reason', html: v => esc(String(v).slice(0, 34))},
    {k: 'by', label: 'Posted by', html: v => esc(staffName(v))},
    {k: 'status', label: 'Status', html: v => okb(v)}
  ], TR_ADJUST.filter(trPass), {sort: 'when', pageSize: 5});
}

/* ===================== 12 · FEES AND LIMITS ===================== */
function renderFees(){
  const limits = TR_LIMITS.filter(trPass);
  const fees = TR_FEES;
  const s = trS();
  const wallet = TR_TXN.filter(t => t.rail === 'External');
  if(el('flPill')){ el('flPill').className = 'badge b-gray'; el('flPill').textContent = num(limits.length) + ' rails'; }
  put('flKpis', [
    ['Rails with limits', num(limits.length), 'Internal, savings, loan, bank, wallet, gateway', ''],
    ['Fees in force', num(fees.filter(f => f.pct || f.flat).length), 'Rails that carry a charge', ''],
    ['Fees collected', trM(s.fees), 'On completed transfers', ''],
    ['Free rails', num(fees.filter(f => !f.pct && !f.flat).length), 'Internal, savings and loan', ''],
    ['Highest percentage', '1.5%', 'Card gateway', ''],
    ['Highest flat fee', trM(3500), 'Bank transfer', ''],
    ['Daily transfer limit', trM(TR_SET.dailyTransferLimit), 'Across all rails', ''],
    ['Per-customer daily', trM(TR_SET.perCustomerDailyLimit), 'One customer, one day', '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join(''));

  if(el('flCount')) el('flCount').textContent = num(limits.length) + ' rows';
  if(el('flHead')) el('flHead').innerHTML = '<tr><th>Method</th><th>Rail</th><th class="num">Minimum</th>'
    + '<th class="num">Maximum</th><th class="num">Daily</th><th class="num">Provider ceiling</th><th>Since</th></tr>';
  if(el('flBody')) el('flBody').innerHTML = TR_LIMITS.map((l, i) => `<tr>
      <td>${esc(l.method)}</td><td>${esc(l.rail)}</td>
      <td class="num"><input class="num" id="limMin${i}" type="number" step="100" value="${l.min}" style="width:92px" /></td>
      <td class="num"><input class="num" id="limMax${i}" type="number" step="1000" value="${l.max}" style="width:104px" /></td>
      <td class="num"><input class="num" id="limDaily${i}" type="number" step="1000" value="${l.daily}" style="width:104px" /></td>
      <td class="num">${esc(trM(l.providerCeiling))}</td>
      <td>${esc(fmtDate(l.effective))}</td></tr>`).join('')
    || '<tr><td colspan="7" class="empty">Nothing matches the current filters.</td></tr>';

  trFillSel('flCalcMethod', TR_METHODS.map(m => [m.method, m.method]));
  const calcMethod = (el('flCalcMethod') ? el('flCalcMethod').value : 'Bank transfer') || 'Bank transfer';
  const calcAmount = Number(el('flCalcAmount') ? el('flCalcAmount').value : 0) || 0;
  const f = fees.find(x => x.method === calcMethod) || fees[0];
  const calcFee = Math.round(calcAmount * f.pct / 100) + f.flat;
  put('flCalcBox', `<div class="minihead">Fee for ${esc(calcMethod)}</div>`
    + kvRow('Amount', trM(calcAmount))
    + kvRow('Rate', f.pct ? f.pct + '% + ' + trM(f.flat) : 'Free')
    + kvRow('Fee', trM(calcFee))
    + kvRow('Paid by', okb(f.payer))
    + kvRow('Customer pays', trM(f.payer === 'Customer' ? calcAmount + calcFee : calcAmount))
    + kvRow('Company absorbs', trM(f.payer === 'Company' ? calcFee : 0))
    + `<div class="qhint" style="margin-top:6px">The fee is added to the amount debited from the source account unless the company absorbs it.</div>`);

  if(el('flCustPill')) el('flCustPill').textContent = num(TR_VELOCITY.length) + ' customers';
  renderTable('flCustBody', [
    {k: 'cust', label: 'Customer', html: v => esc(custName(v))},
    {k: 'transfers24h', label: 'Last 24h', num: true},
    {k: 'amount24h', label: 'Value 24h', num: true, html: v => esc(trM(v))},
    {k: 'status', label: 'Against the limit', html: v => okb(v)}
  ], TR_VELOCITY, {sort: 'amount24h', pageSize: 6});

  put('flCcyBox', `<div class="minihead">Currency and rounding</div>`
    + kvRow('Currency', TR_SET.currencyLabel) + kvRow('Symbol', TR_SET.currencySymbol)
    + kvRow('Decimals kept', String(TR_SET.decimals))
    + kvRow('Rounding', 'To the nearest MK 500 on entry')
    + kvRow('Minimum transfer', trM(TR_SET.minTransfer))
    + kvRow('Maximum transfer', trM(TR_SET.maxTransfer))
    + kvRow('Amounts in view', num(wallet.length) + ' external transfers'));

  if(el('flPayerPill')) el('flPayerPill').textContent = TR_SET.feePayer;
  renderTable('flPayerBody', [
    {k: 'method', label: 'Method'},
    {k: 'pct', label: 'Rate %', num: true},
    {k: 'flat', label: 'Flat', num: true, html: v => esc(trM(v))},
    {k: 'payer', label: 'Paid by', html: v => badge(v, v === 'Customer' ? 'b-gray' : 'b-ok')},
    {k: 'effective', label: 'Since', html: v => esc(fmtDate(v))}
  ], fees, {sort: 'flat', pageSize: 7});

  if(el('flHistPill')) el('flHistPill').textContent = num(TR_FEE_HISTORY.length) + ' changes';
  renderTable('flHistBody', [
    {k: 'when', label: 'When', html: v => esc(trWhen(v))},
    {k: 'scope', label: 'What changed'},
    {k: 'from', label: 'From'},
    {k: 'to', label: 'To'},
    {k: 'by', label: 'Officer', html: v => esc(staffName(v))}
  ], TR_FEE_HISTORY, {sort: 'when', pageSize: 4});

  put('flGrid',
    chartBox({title: 'Fees by method', sub: 'Collected on completed transfers, MWK', type: 'bar', h: 200,
      cats: TR_METHODS.map(m => m.method.replace(' transfer', '')),
      colours: TR_METHODS.map(m => TR_COLOURS[m.method]),
      series: [{name: 'Fees', data: TR_METHODS.map(m => sum(TR_COMPLETED.filter(t => t.method === m.method), t => t.fee))}],
      value: trM(s.fees)}) +
    chartBox({title: 'Value against the daily limit', sub: 'Last seven days, MWK', type: 'line', h: 200,
      cats: TR_DAILY.map(d => d.label),
      series: [{name: 'Value', data: TR_DAILY.map(d => d.value)},
        {name: 'Limit', data: TR_DAILY.map(d => d.limit), colour: '#8A90A0'}],
      value: compact(s.totalAmount)}));
}
</script>
