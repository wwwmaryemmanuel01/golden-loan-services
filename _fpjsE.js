<script>
/* ============================================================
   FEES & PENALTIES (5/8)
   Sections 9–12: the customer charge account, the collections
   desk, the waiver and exemption workflow, and the reversals and
   corrections register.
   ============================================================ */

const fpOpenCharges = () => CHARGES.filter(c => c.balance > 0);
const fpChargeOptions = list => list.slice(0, 150).map(c =>
  [c.id, c.id + ' · ' + c.typeName + ' · ' + custName(c.cust) + ' · ' + money(c.balance)]);
const fpCustCharges = id => CHARGES.filter(c => c.cust === id);

/* ---------------- 9 · CUSTOMER FEE ACCOUNTS ---------------- */
function renderCustomerAccounts(){
  const scoped = fpCharges();
  const withCharges = CUSTOMERS.filter(c => fpCustCharges(c.id).length);
  const totalOut = sum(CHARGES, c => c.balance);
  if(el('caPill')){ el('caPill').className = 'badge b-gray'; el('caPill').textContent = num(withCharges.length) + ' customer accounts'; }
  put('caKpis', [
    ['Customers with charges', num(withCharges.length), 'Of ' + num(CUSTOMERS.length) + ' on file', ''],
    ['Charges raised', num(CHARGES.length), 'Fees and penalties', ''],
    ['Outstanding', fpM(totalOut), num(fpOpenCharges().length) + ' open charges', totalOut ? 'red' : ''],
    ['Fees outstanding', fpM(sum(CHARGES.filter(c => c.kind === 'Fee'), c => c.balance)), 'Across the book', ''],
    ['Penalties outstanding', fpM(sum(CHARGES.filter(c => c.kind === 'Penalty'), c => c.balance)), 'Across the book', ''],
    ['Customers owing fees', num(new Set(CHARGES.filter(c => c.kind === 'Fee' && c.balance > 0).map(c => c.cust)).size), 'Fee balances only', ''],
    ['Customers owing penalties', num(new Set(CHARGES.filter(c => c.kind === 'Penalty' && c.balance > 0).map(c => c.cust)).size), 'Penalty balances only', ''],
    ['Average balance', fpM(Math.round(totalOut / Math.max(1, fpOpenCharges().length))), 'Per open charge', '']
  ].map(([l, v, s, k]) => kpiCard(l, v, s, k)).join(''));

  fpFillSel('caSel', CUSTOMERS.map(c => [c.id, c.id + ' · ' + c.name + ' · ' + c.region]),
    FP_SEL.customer || withCharges[0] && withCharges[0].id);
  const cust = fpPicked('caSel', (withCharges[0] || CUSTOMERS[0] || {}).id);
  FP_SEL.customer = cust;
  const mine = fpCustCharges(cust);
  const fees = mine.filter(c => c.kind === 'Fee');
  const pens = mine.filter(c => c.kind === 'Penalty');
  const outFees = sum(fees, c => c.balance);
  const outPens = sum(pens, c => c.balance);
  const c = CUST_BY_ID[cust] || {};

  if(el('caSelPill')) el('caSelPill').textContent = num(mine.length) + ' charges';
  put('caDetail', strip([
    ['Customer', esc(c.name || '—')],
    ['Branch', esc(c.region || '—')],
    ['Phone', esc(c.phone || '—')],
    ['Status', okb(c.status || '—')],
    ['KYC', okb(c.kyc || '—')]
  ]) + [
    ['Charges on file', num(mine.length) + ' since ' + esc(fmtDate((mine[mine.length - 1] || {}).assessed || TODAY))],
    ['Fees outstanding', outFees ? '<b>' + fpM(outFees) + '</b>' : fpM(0)],
    ['Penalties outstanding', outPens ? '<b>' + fpM(outPens) + '</b>' : fpM(0)],
    ['Assessed in total', fpM(sum(mine, x => x.amount))],
    ['Paid', fpM(sum(mine, x => x.paid))],
    ['Waived', fpM(sum(mine, x => x.waived))],
    ['Reversed', fpM(sum(mine, x => x.reversed))],
    ['Loans attached', num(new Set(mine.map(x => x.loan).filter(Boolean)).size)]
  ].map(([k, v]) => kvRow(k, v)).join(''));

  if(el('caOutPill')) el('caOutPill').textContent = fpM(outFees + outPens);
  put('caOutBox', strip([
    ['Outstanding fees', fpM(outFees)],
    ['Outstanding penalties', fpM(outPens)],
    ['Total owing', '<b>' + fpM(outFees + outPens) + '</b>'],
    ['Next due', esc(fmtDate((mine.filter(x => x.balance > 0).sort((a, b) => a.due < b.due ? -1 : 1)[0] || {}).due || TODAY))]
  ]));
  renderTable('caOutBody', [
    {k: 'id', label: 'Charge'},
    {k: 'typeName', label: 'Type'},
    {k: 'due', label: 'Due', html: v => esc(fmtDate(v))},
    {k: 'amount', label: 'Amount', num: true, html: v => esc(fpM(v))},
    {k: 'balance', label: 'Balance', num: true, html: v => esc(fpM(v))},
    {k: 'status', label: 'State', html: v => okb(v)}
  ], mine.filter(x => x.balance > 0), {sort: 'balance', pageSize: 6});

  if(el('caLinkPill')) el('caLinkPill').textContent = num(mine.filter(x => x.loan).length) + ' linked';
  renderTable('caLinkBody', [
    {k: 'id', label: 'Charge'},
    {k: 'typeName', label: 'Type'},
    {k: 'loan', label: 'Loan'},
    {k: 'app', label: 'Application'},
    {k: 'product', label: 'Product', html: v => esc(v ? prodName(v) : '—')},
    {k: 'due', label: 'Instalment due', html: v => esc(fmtDate(v))},
    {k: 'base', label: 'Base', num: true, html: v => esc(fpM(v))},
    {k: 'source', label: 'Raised from'}
  ], mine, {sort: 'due', pageSize: 8});

  if(el('caMixPill')) el('caMixPill').textContent = fpM(sum(mine, x => x.amount));
  put('caMixBox', strip([
    ['Assessed', fpM(sum(mine, x => x.amount))],
    ['Paid', fpM(sum(mine, x => x.paid))],
    ['Waived', fpM(sum(mine, x => x.waived))],
    ['Reversed', fpM(sum(mine, x => x.reversed))],
    ['Balance', '<b>' + fpM(sum(mine, x => x.balance)) + '</b>']
  ]));
  if(el('caWaivedHead')) el('caWaivedHead').innerHTML = '<tr><th>Charge</th><th class="num">Waived</th><th>Reason</th></tr>';
  renderTable('caWaivedBody', [
    {k: 'id', label: 'Charge'},
    {k: 'waived', label: 'Waived', num: true, html: v => esc(fpM(v))},
    {k: 'reason', label: 'Reason'}
  ], mine.filter(x => x.waived > 0), {sort: 'waived', pageSize: 4, onRow: false});

  if(el('caHistPill')) el('caHistPill').textContent = num(mine.length) + ' events';
  const events = [];
  mine.forEach(x => {
    events.push({when: x.assessed, what: 'Assessed', charge: x.id, type: x.typeName, amount: x.amount,
      by: x.officer, note: x.calc || x.source});
    if(x.paid > 0) events.push({when: addDays(x.assessed, 2), what: 'Collected', charge: x.id, type: x.typeName,
      amount: x.paid, by: x.officer, note: x.receipt || 'receipt on file'});
    if(x.waived > 0) events.push({when: addDays(x.assessed, 4), what: 'Waived', charge: x.id, type: x.typeName,
      amount: x.waived, by: 'STF-003', note: x.reason || 'waiver approved'});
    if(x.reversed > 0) events.push({when: addDays(x.assessed, 3), what: 'Reversed', charge: x.id, type: x.typeName,
      amount: x.reversed, by: 'STF-003', note: x.reason || 'correction approved'});
  });
  events.sort((a, b) => a.when < b.when ? 1 : -1);
  renderTable('caHistBody', [
    {k: 'when', label: 'When', html: v => esc(fpWhen(v))},
    {k: 'what', label: 'Event'},
    {k: 'charge', label: 'Charge'},
    {k: 'type', label: 'Type'},
    {k: 'amount', label: 'Amount', num: true, html: v => esc(fpM(v))},
    {k: 'by', label: 'Officer', html: v => esc(staffName(v))},
    {k: 'note', label: 'Note'}
  ], events, {sort: 'when', pageSize: 10});

  put('caGrid',
    chartBox({title: 'This customer by type', sub: 'What the charges are for', type: 'donut', h: 200,
      cats: ['Fees', 'Penalties'], value: fpM(sum(mine, x => x.amount)),
      series: [{name: 'Value', data: [sum(fees, x => x.amount), sum(pens, x => x.amount)]}]}) +
    chartBox({title: 'Assessed against settled', sub: 'Paid, waived and reversed', type: 'bar', h: 200,
      cats: ['Paid', 'Waived', 'Reversed', 'Outstanding'], value: fpM(sum(mine, x => x.amount)),
      series: [{name: 'Value', colour: '#1E9E6A', data: [sum(mine, x => x.paid), sum(mine, x => x.waived),
        sum(mine, x => x.reversed), sum(mine, x => x.balance)]}]}));
}
function fpCustomerStatement(){
  const cust = fpPicked('caSel', '');
  const mine = fpCustCharges(cust);
  if(!mine.length){ toast('That customer carries no charges', 'err'); return; }
  const rows = mine.slice().sort((a, b) => a.assessed < b.assessed ? -1 : 1).map(x =>
    [fmtDate(x.assessed), x.id, x.typeName, x.kind, fpM(x.amount), fpM(x.paid), fpM(x.waived), fpM(x.reversed), fpM(x.balance), x.status]);
  const head = ['Assessed', 'Charge', 'Type', 'Kind', 'Amount', 'Paid', 'Waived', 'Reversed', 'Balance', 'State'];
  downloadFile('charge-statement-' + cust + '.csv', 'text/csv', toCsv([head].concat(rows)));
  logExport('Charge statement · ' + custName(cust), 'CSV', rows.length);
  if(el('caStmtMsg')) el('caStmtMsg').textContent = 'A statement of ' + rows.length + ' charges was built for '
    + custName(cust) + ', closing at ' + fpM(sum(mine, x => x.balance)) + ' outstanding.';
  openModal('Charge statement · ' + custName(cust), cust + ' · ' + fmtDate(TODAY),
    `<div class="tblwrap"><table class="tbl2 dense"><thead><tr>${head.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead>
      <tbody>${rows.map(r => `<tr>${r.map(v => `<td>${esc(v)}</td>`).join('')}</tr>`).join('')}
      <tr><td colspan="8"><b>Balance outstanding</b></td><td class="num"><b>${esc(fpM(sum(mine, x => x.balance)))}</b></td><td></td></tr>
      </tbody></table></div>`,
    [{label: 'Print', act: () => printTable('Charge statement · ' + custName(cust),
      head.map((h, i) => ({label: h, num: i >= 4 && i <= 8})), rows)},
     {label: 'Close', act: 'close'}]);
  toast('Statement built for ' + custName(cust));
}

/* ---------------- 10 · FEE AND PENALTY COLLECTIONS ---------------- */
function renderCollections(){
  const rows = fpCollections();
  const all = COLLECTIONS;
  const collected = sum(all, c => c.amount);
  const part = CHARGES.filter(c => c.status === 'Part paid');
  const full = CHARGES.filter(c => c.status === 'Paid');
  const open = CHARGES.filter(c => c.status === 'Outstanding' || c.status === 'Pending approval');
  const reversed = all.filter(c => c.status === 'Reversed');
  if(el('clPill')){ el('clPill').className = 'badge b-ok'; el('clPill').textContent = fpM(collected) + ' collected'; }
  put('clKpis', [
    ['Collections', num(all.length), 'Allocations against a charge', ''],
    ['Collected', fpM(collected), 'Against fees and penalties', ''],
    ['Fully paid', num(full.length), 'Settled in full', ''],
    ['Part paid', num(part.length), 'Something still owing', part.length ? 'amber' : ''],
    ['Outstanding', num(open.length), 'Nothing collected yet', ''],
    ['Failed or reversed', num(reversed.length), 'Backed out of the charge', reversed.length ? 'red' : ''],
    ['Methods live', num(METHODS.length), 'Cash, banks and mobile money', ''],
    ['Average collection', fpM(all.length ? Math.round(collected / all.length) : 0), 'Per allocation', '']
  ].map(([l, v, s, k]) => kpiCard(l, v, s, k)).join(''));

  fpFillSel('clCharge', fpChargeOptions(fpOpenCharges()), FP_SEL.collection || (fpOpenCharges()[0] || {}).id);
  fpFillSel('clMethod', METHODS.map(m => [m, m]), fpPicked('clMethod', METHODS[0]));
  const sel = CHARGES.find(c => c.id === fpPicked('clCharge', '')) || fpOpenCharges()[0];
  FP_SEL.collection = sel ? sel.id : '';

  if(el('clFormPill')) el('clFormPill').textContent = sel ? fpM(sel.balance) + ' owing' : 'nothing open';
  if(sel){
    put('clAllocBox', strip([
      ['Charge', esc(sel.id)],
      ['Type', esc(sel.typeName)],
      ['Kind', okb(sel.kind)],
      ['Assessed', fpM(sel.amount)],
      ['Already paid', fpM(sel.paid)],
      ['Balance', '<b>' + fpM(sel.balance) + '</b>']
    ]) + kvRow('Allocated to', esc(sel.kind === 'Fee' ? 'Fee income' : 'Penalty income') + ' — never to principal or interest'));
    if(el('clAmount') && !el('clAmount').value) el('clAmount').value = sel.balance;
  } else put('clAllocBox', '<div class="qhint">No charge is open for collection.</div>');

  if(el('clSplitPill')) el('clSplitPill').textContent = 'kept apart';
  put('clSplitBox', strip([
    ['Principal', fpM(sum(PAYS, p => p.amount))],
    ['Interest', fpM(Math.round(sum(PAYS, p => p.amount) * 0.32))],
    ['Fees collected', fpM(sum(CHARGES.filter(c => c.kind === 'Fee'), c => c.paid))],
    ['Penalties collected', fpM(sum(CHARGES.filter(c => c.kind === 'Penalty'), c => c.paid))]
  ]) + kvRow('Allocation order', 'Instalment first, then fees, then penalties — a charge never absorbs a principal payment'));

  if(el('clPartPill')) el('clPartPill').textContent = num(part.length) + ' part paid';
  renderTable('clPartBody', [
    {k: 'id', label: 'Charge'},
    {k: 'typeName', label: 'Type'},
    {k: 'cust', label: 'Customer', html: v => esc(custName(v))},
    {k: 'paid', label: 'Paid', num: true, html: v => esc(fpM(v))},
    {k: 'balance', label: 'Left', num: true, html: v => esc(fpM(v))}
  ], part, {sort: 'balance', pageSize: 6});
  if(el('clFullPill')) el('clFullPill').textContent = num(full.length) + ' settled';
  renderTable('clFullBody', [
    {k: 'id', label: 'Charge'},
    {k: 'typeName', label: 'Type'},
    {k: 'cust', label: 'Customer', html: v => esc(custName(v))},
    {k: 'paid', label: 'Paid', num: true, html: v => esc(fpM(v))},
    {k: 'receipt', label: 'Receipt'}
  ], full, {sort: 'paid', pageSize: 6});
  if(el('clOutPill')) el('clOutPill').textContent = num(open.length) + ' open';
  renderTable('clOutBody', [
    {k: 'id', label: 'Charge'},
    {k: 'typeName', label: 'Type'},
    {k: 'cust', label: 'Customer', html: v => esc(custName(v))},
    {k: 'due', label: 'Due', html: v => esc(fmtDate(v))},
    {k: 'balance', label: 'Balance', num: true, html: v => esc(fpM(v))}
  ], open, {sort: 'balance', pageSize: 6});

  if(el('clHistPill')) el('clHistPill').textContent = num(rows.length) + ' allocations';
  renderTable('clHistBody', [
    {k: 'id', label: 'Collection'},
    {k: 'when', label: 'When', html: v => esc(fpWhen(v))},
    {k: 'charge', label: 'Charge'},
    {k: 'cust', label: 'Customer', html: v => esc(custName(v))},
    {k: 'kind', label: 'Kind', html: v => okb(v)},
    {k: 'amount', label: 'Amount', num: true, html: v => esc(fpM(v))},
    {k: 'method', label: 'Method'},
    {k: 'receipt', label: 'Receipt'},
    {k: 'status', label: 'State', html: v => okb(v)},
    {k: 'officer', label: 'Officer', html: v => esc(staffName(v))}
  ], rows, {sort: 'amount', pageSize: 10});

  put('clGrid',
    chartBox({title: 'Collections by method', sub: 'How the charges are paid', type: 'donut', h: 210,
      cats: METHODS, value: fpM(collected),
      series: [{name: 'Collected', data: METHODS.map(m => sum(all.filter(c => c.method === m), c => c.amount))}]}) +
    chartBox({title: 'Collections by month', sub: 'Fees and penalties together', type: 'bar', h: 210,
      cats: buckets().map(bucketLabel), value: fpM(collected),
      series: [{name: 'Collected', data: seriesBy(all, c => c.when, c => c.amount).data, colour: '#1E9E6A'}]}));
}
function fpRecordCollection(){
  const id = fpPicked('clCharge', '');
  const c = CHARGES.find(x => x.id === id);
  if(!c){ toast('Pick a charge to collect against', 'err'); return; }
  const amount = fpNum('clAmount', 0);
  if(amount <= 0){ toast('The payment must be above zero', 'err'); return; }
  if(amount > c.balance){ toast('That is more than the ' + fpM(c.balance) + ' still owed on this charge', 'err'); return; }
  const method = fpPicked('clMethod', 'Cash');
  const receipt = (el('clReceipt') && el('clReceipt').value.trim()) || ('RCP-' + pad(90000 + COLLECTIONS.length, 5));
  c.paid += amount;
  c.balance = Math.max(0, c.amount - c.paid - c.waived - c.reversed);
  c.method = method; c.receipt = receipt;
  c.status = c.balance <= 0 ? 'Paid' : 'Part paid';
  COLLECTIONS.unshift({id: 'COL-2026-' + pad(9000 + COLLECTIONS.length, 4), when: TODAY, charge: c.id, cust: c.cust,
    loan: c.loan, type: c.type, kind: c.kind, amount, method, receipt, officer: 'STF-007', region: c.region,
    status: 'Allocated', lane: 'Collections', severity: 'Low', owner: 'STF-007'});
  fpAudit('Collection', c.id + ' · ' + c.typeName, fpM(c.balance + amount), fpM(c.balance), 'STF-007',
    'Payment of ' + fpM(amount) + ' by ' + method, 'Collections');
  if(el('clMsg')) el('clMsg').textContent = fpM(amount) + ' was allocated to ' + c.id + ' by ' + method
    + '. Receipt ' + receipt + '. Balance now ' + fpM(c.balance) + '.';
  if(el('clAmount')) el('clAmount').value = '';
  if(el('clReceipt')) el('clReceipt').value = '';
  renderAll();
  toast(fpM(amount) + ' collected · ' + receipt);
}
function fpReconcileCollections(){
  const collected = sum(COLLECTIONS.filter(c => c.status !== 'Reversed'), c => c.amount);
  const paidOnCharges = sum(CHARGES, c => c.paid);
  const diff = collected - paidOnCharges;
  if(el('clReconMsg')) el('clReconMsg').textContent = Math.abs(diff) <= 1
    ? 'Reconciled: ' + fpM(collected) + ' of collections agrees with the ' + fpM(paidOnCharges) + ' marked paid on the charges.'
    : 'A difference of ' + fpM(Math.abs(diff)) + ' sits between the collections and the charge balances — worth a look before month end.';
  logExport('Collection reconciliation', 'Recon', COLLECTIONS.length);
  toast(Math.abs(diff) <= 1 ? 'Collections reconciled' : 'Reconciliation shows a difference', Math.abs(diff) <= 1 ? 'ok' : 'err');
}

/* ---------------- 11 · FEE WAIVERS AND EXEMPTIONS ---------------- */
function fpWaiverOptions(){
  return WAIVERS.map(w => [w.id, w.id + ' · ' + w.typeName + ' · ' + custName(w.cust) + ' · ' + money(w.waived) + ' · ' + w.status]);
}
function renderWaivers(){
  const rows = fpWaivers();
  const all = WAIVERS;
  const pending = all.filter(w => w.status === 'Pending');
  const approved = all.filter(w => w.status === 'Approved');
  const rejected = all.filter(w => w.status === 'Rejected');
  const waived = sum(approved, w => w.waived);
  const blocked = all.filter(w => w.selfApproval);
  if(el('wvPill')){ el('wvPill').className = 'badge ' + (pending.length ? 'b-warn' : 'b-ok');
    el('wvPill').textContent = num(pending.length) + ' waiting'; }
  put('wvKpis', [
    ['Requests', num(all.length), 'Fees and penalties', ''],
    ['Waiting for a decision', num(pending.length), 'In the head of credit queue', pending.length ? 'amber' : ''],
    ['Approved', num(approved.length), 'Full and partial', ''],
    ['Rejected', num(rejected.length), 'The evidence did not support it', ''],
    ['Value waived', fpM(waived), 'Off the charge book', ''],
    ['Partial waivers', num(all.filter(w => w.scope === 'Partial waiver').length), 'Part of the charge', ''],
    ['Full waivers', num(all.filter(w => w.scope === 'Full waiver').length), 'The whole charge', ''],
    ['Self-approvals blocked', num(blocked.length), 'Requester may not decide', blocked.length ? 'red' : '']
  ].map(([l, v, s, k]) => kpiCard(l, v, s, k)).join(''));

  fpFillSel('wvCharge', fpChargeOptions(CHARGES.filter(c => c.balance > 0)), FP_SEL.charge || (fpOpenCharges()[0] || {}).id);
  fpFillSel('wvReason', WAIVER_REASONS.map(r => [r, r]), fpPicked('wvReason', WAIVER_REASONS[0]));
  fpFillSel('wvDoc', ['Hardship letter', 'Medical report', 'Retrenchment letter', 'Bank statement', 'Death certificate',
    'Employer letter', 'No document'].map(d => [d, d]), fpPicked('wvDoc', 'Hardship letter'));
  const selCharge = CHARGES.find(c => c.id === fpPicked('wvCharge', ''));
  if(el('wvAmount') && !el('wvAmount').value && selCharge) el('wvAmount').value = selCharge.balance;
  if(el('wvFormPill')) el('wvFormPill').textContent = selCharge ? fpM(selCharge.balance) + ' at stake' : 'nothing open';

  fpFillSel('wvSel', fpWaiverOptions(), FP_SEL.waiver || (pending[0] || all[0] || {}).id);
  const w = WAIVERS.find(x => x.id === fpPicked('wvSel', '')) || pending[0] || all[0];
  FP_SEL.waiver = w ? w.id : '';
  if(el('wvDetailPill')) el('wvDetailPill').textContent = w ? w.status : '—';
  put('wvDetail', w ? strip([
    ['Request', esc(w.id)],
    ['Charge', esc(w.charge)],
    ['Customer', esc(custName(w.cust))],
    ['Type', esc(w.typeName)],
    ['Scope', esc(w.scope)]
  ]) + [
    ['Amount of the charge', fpM(w.amount)],
    ['Amount to waive', '<b>' + fpM(w.waived) + '</b>'],
    ['Reason', esc(w.reason)],
    ['Evidence', esc(w.document)],
    ['Requested by', esc(staffName(w.requestedBy))],
    ['Requested on', esc(fmtDate(w.requestedOn))],
    ['Decided by', w.decidedBy ? esc(staffName(w.decidedBy)) : '—'],
    ['Decided on', w.decidedOn ? esc(fmtDate(w.decidedOn)) : '—'],
    ['State', okb(w.status)],
    ['Note', esc(w.note || '—')]
  ].map(([k, v]) => kvRow(k, v)).join('') : '<div class="qhint">No waiver request is on file.</div>');

  if(el('wvQueuePill')) el('wvQueuePill').textContent = num(rows.length) + ' requests';
  renderTable('wvQueueBody', [
    {k: 'id', label: 'Request'},
    {k: 'charge', label: 'Charge'},
    {k: 'cust', label: 'Customer', html: v => esc(custName(v))},
    {k: 'kind', label: 'Kind', html: v => okb(v)},
    {k: 'scope', label: 'Scope'},
    {k: 'waived', label: 'To waive', num: true, html: v => esc(fpM(v))},
    {k: 'reason', label: 'Reason'},
    {k: 'document', label: 'Evidence'},
    {k: 'requestedBy', label: 'Asked by', html: v => esc(staffName(v))},
    {k: 'requestedOn', label: 'When', html: v => esc(fmtDate(v))},
    {k: 'status', label: 'State', html: v => okb(v)}
  ], rows, {sort: 'waived', pageSize: 10});

  const exempt = CUSTOMERS.filter(c => c.status === 'Inactive').slice(0, 6).map(c => ({
    customer: c.id, who: c.name, exempt: 'Account maintenance fee', basis: 'Dormant customer',
    since: addDays(TODAY, -ri(30, 300)), authorisedBy: 'STF-003', status: 'Active'}))
    .concat(CHARGES.filter(x => /Policy exemption/.test(x.reason || '')).slice(0, 6).map(x => ({
      customer: x.cust, who: custName(x.cust), exempt: x.typeName, basis: x.reason,
      since: x.assessed, authorisedBy: x.officer, status: x.status})));
  if(el('wvExemptPill')) el('wvExemptPill').textContent = num(exempt.length) + ' exemptions';
  renderTable('wvExemptBody', [
    {k: 'who', label: 'Customer'},
    {k: 'customer', label: 'Reference'},
    {k: 'exempt', label: 'Exempt from'},
    {k: 'basis', label: 'Why'},
    {k: 'since', label: 'Since', html: v => esc(fmtDate(v))},
    {k: 'authorisedBy', label: 'Authorised by', html: v => esc(staffName(v))}
  ], exempt, {sort: 'since', pageSize: 6});

  if(el('wvHistPill')) el('wvHistPill').textContent = num(approved.length + rejected.length) + ' decisions';
  renderTable('wvHistBody', [
    {k: 'id', label: 'Request'},
    {k: 'typeName', label: 'Type'},
    {k: 'waived', label: 'Waived', num: true, html: v => esc(fpM(v))},
    {k: 'decidedBy', label: 'Decided by', html: v => esc(staffName(v))},
    {k: 'decidedOn', label: 'When', html: v => esc(fmtDate(v))},
    {k: 'status', label: 'Decision', html: v => okb(v)}
  ], approved.concat(rejected), {sort: 'decidedOn', pageSize: 8});

  const months = buckets();
  put('wvGrid',
    chartBox({title: 'Waivers by month', sub: 'Requests raised', type: 'bar', h: 210,
      cats: months.map(bucketLabel), value: num(all.length),
      series: [{name: 'Requests', data: seriesBy(all, x => x.requestedOn, () => 1).data, colour: '#E08C1E'}]}) +
    chartBox({title: 'Decisions', sub: 'Approved, rejected and waiting', type: 'donut', h: 210,
      cats: ['Approved', 'Rejected', 'Pending'], value: num(all.length),
      series: [{name: 'Requests', data: [approved.length, rejected.length, pending.length]}]}));
}
function fpWaiverDecision(kind){
  const w = WAIVERS.find(x => x.id === FP_SEL.waiver);
  if(!w){ toast('Pick a waiver request first', 'err'); return; }
  if(w.status !== 'Pending'){ toast('That request is already ' + w.status.toLowerCase(), 'err'); return; }
  const me = FEE_STAFF_REF;
  if(kind === 'approve' && w.requestedBy === me){
    if(el('wvSelfMsg')) el('wvSelfMsg').textContent = 'Refused: ' + staffName(me)
      + ' raised ' + w.id + ' and may not approve it. The rule needs a different approver.';
    fpAudit('Self-approval refused', w.id, w.status, w.status, me, 'Requester tried to approve their own request', 'Waivers');
    toast('A requester may not approve their own waiver', 'err');
    renderAll();
    return;
  }
  if(kind === 'approve'){
    w.status = 'Approved'; w.decidedBy = 'STF-003'; w.decidedOn = TODAY;
    w.note = 'Approved at ' + fpM(w.waived) + ' by the head of credit';
    const c = CHARGES.find(x => x.id === w.charge);
    if(c){
      c.waived = Math.min(c.amount - c.reversed, c.waived + w.waived);
      c.balance = Math.max(0, c.amount - c.paid - c.waived - c.reversed);
      c.status = c.balance <= 0 ? 'Waived' : 'Part paid';
      c.reason = w.reason;
    }
    if(el('wvSelfMsg')) el('wvSelfMsg').textContent = w.id + ' approved at ' + fpM(w.waived)
      + '. The charge balance was reduced and the ledger posted a waiver entry.';
  } else {
    w.status = 'Rejected'; w.decidedBy = 'STF-003'; w.decidedOn = TODAY;
    w.note = 'Rejected — the evidence did not support the waiver';
    if(el('wvSelfMsg')) el('wvSelfMsg').textContent = w.id + ' was rejected. The customer keeps the obligation and is told why.';
  }
  fpAudit('Waiver ' + w.status.toLowerCase(), w.id, 'Pending', w.status, 'STF-003', w.reason, 'Waivers');
  renderAll();
  toast(w.id + ' ' + w.status.toLowerCase());
}
function fpWaiverSubmit(){
  const chargeId = fpPicked('wvCharge', '');
  const c = CHARGES.find(x => x.id === chargeId);
  if(!c){ toast('Pick a charge to waive', 'err'); return; }
  if(c.balance <= 0){ toast('That charge has nothing left to waive', 'err'); return; }
  const scope = fpPicked('wvScope', 'Full waiver');
  let amount = fpNum('wvAmount', scope === 'Full waiver' ? c.balance : Math.round(c.balance * 0.4));
  if(scope === 'Full waiver') amount = c.balance;
  if(amount <= 0 || amount > c.balance){ toast('The amount must sit between zero and ' + fpM(c.balance), 'err'); return; }
  const w = {id: 'WVR-2026-' + pad(500 + WAIVERS.length, 3), charge: c.id, cust: c.cust, loan: c.loan,
    type: c.type, typeName: c.typeName, kind: c.kind, amount: c.amount, waived: Math.round(amount),
    scope, reason: fpPicked('wvReason', WAIVER_REASONS[0]), document: fpPicked('wvDoc', 'Hardship letter'),
    requestedBy: FEE_STAFF_REF, requestedOn: TODAY, status: 'Pending', decidedBy: '', decidedOn: '',
    selfApproval: false, note: '', lane: 'Waivers', severity: c.kind === 'Penalty' ? 'Medium' : 'Low',
    owner: c.officer, region: c.region};
  WAIVERS.unshift(w);
  FP_SEL.waiver = w.id;
  fpAudit('Waiver requested', w.id, '—', fpM(w.waived) + ' on ' + c.id, FEE_STAFF_REF, w.reason, 'Waivers');
  if(el('wvMsg')) el('wvMsg').textContent = w.id + ' submitted for ' + fpM(w.waived) + ' on ' + c.id
    + ' with the ' + w.document.toLowerCase() + ' attached. It waits for the head of credit.';
  renderAll();
  toast('Waiver ' + w.id + ' submitted');
}

/* ---------------- 12 · REVERSALS AND CORRECTIONS ---------------- */
function renderReversals(){
  const rows = fpReversals();
  const all = REVERSALS;
  const pending = all.filter(r => r.status === 'Pending');
  const approved = all.filter(r => r.status === 'Approved');
  const rejected = all.filter(r => r.status === 'Rejected');
  const value = sum(approved, r => r.amount);
  if(el('rvPill')){ el('rvPill').className = 'badge ' + (pending.length ? 'b-warn' : 'b-ok');
    el('rvPill').textContent = num(pending.length) + ' in review'; }
  put('rvKpis', [
    ['Correction requests', num(all.length), 'Every charge ever questioned', ''],
    ['Waiting for approval', num(pending.length), 'With the head of credit', pending.length ? 'amber' : ''],
    ['Approved reversals', num(approved.length), 'The charge came off', ''],
    ['Rejected', num(rejected.length), 'The charge stands', ''],
    ['Value reversed', fpM(value), 'Off the charge book', ''],
    ['Duplicates detected', num(DUPLICATES.length), 'Same charge, same loan, same day', DUPLICATES.length ? 'red' : ''],
    ['Refunds owed', fpM(sum(approved.filter(r => /Refunded/.test(r.refund)), r => r.amount)), 'Money already collected', ''],
    ['Originals kept', num(CHARGES.length), 'Nothing is ever deleted', '']
  ].map(([l, v, s, k]) => kpiCard(l, v, s, k)).join(''));

  fpFillSel('rvCharge', fpChargeOptions(CHARGES), FP_SEL.reversal || CHARGES[0] && CHARGES[0].id);
  fpFillSel('rvReason', REVERSAL_REASONS.map(r => [r, r]), fpPicked('rvReason', REVERSAL_REASONS[0]));

  fpFillSel('rvSel', all.map(r => [r.id, r.id + ' · ' + r.charge + ' · ' + money(r.amount) + ' · ' + r.status]),
    FP_SEL.reversal2 || (pending[0] || all[0] || {}).id);
  const r = REVERSALS.find(x => x.id === fpPicked('rvSel', '')) || pending[0] || all[0];
  FP_SEL.reversal2 = r ? r.id : '';
  const charge = r ? CHARGES.find(c => c.id === r.charge) : null;
  if(el('rvDetailPill')) el('rvDetailPill').textContent = r ? r.status : '—';
  if(el('rvFormPill')) el('rvFormPill').textContent = charge ? 'Against ' + charge.id : 'Pick a charge';
  put('rvDetail', r ? strip([
    ['Request', esc(r.id)],
    ['Charge', esc(r.charge)],
    ['Customer', esc(custName(r.cust))],
    ['Type', esc(r.typeName)],
    ['Value', fpM(r.amount)]
  ]) + [
    ['Reason', esc(r.reason)],
    ['Requested by', esc(staffName(r.requestedBy))],
    ['Requested on', esc(fmtDate(r.requestedOn))],
    ['Approved by', r.approvedBy ? esc(staffName(r.approvedBy)) : '—'],
    ['Approved on', r.approvedOn ? esc(fmtDate(r.approvedOn)) : '—'],
    ['Collected already', charge ? fpM(charge.paid) : '—'],
    ['Handling of the cash', esc(r.refund)],
    ['Charge now', charge ? okb(charge.status) : '—'],
    ['State', okb(r.status)]
  ].map(([k, v]) => kvRow(k, v)).join('') : '<div class="qhint">No correction request is on file.</div>');

  if(charge) put('rvRefundBox', strip([
    ['Collected', fpM(charge.paid)],
    ['To refund', fpM(charge.paid)],
    ['Waived so far', fpM(charge.waived)],
    ['Reversed so far', fpM(charge.reversed)]
  ]) + kvRow('How it is handled', charge.paid > 0
      ? 'The money already taken is refunded to the customer and the ledger posts a reversal'
      : 'No cash was taken, so the charge is simply cancelled'));
  else put('rvRefundBox', '<div class="qhint">Pick a request to see the cash position.</div>');

  if(el('rvQueuePill')) el('rvQueuePill').textContent = num(rows.length) + ' requests';
  renderTable('rvQueueBody', [
    {k: 'id', label: 'Request'},
    {k: 'charge', label: 'Charge'},
    {k: 'cust', label: 'Customer', html: v => esc(custName(v))},
    {k: 'kind', label: 'Kind', html: v => okb(v)},
    {k: 'amount', label: 'Value', num: true, html: v => esc(fpM(v))},
    {k: 'reason', label: 'Reason'},
    {k: 'requestedBy', label: 'Asked by', html: v => esc(staffName(v))},
    {k: 'requestedOn', label: 'When', html: v => esc(fmtDate(v))},
    {k: 'refund', label: 'Cash'},
    {k: 'status', label: 'State', html: v => okb(v)}
  ], rows, {sort: 'amount', pageSize: 10});

  if(el('rvDupPill')) el('rvDupPill').textContent = num(DUPLICATES.length) + ' pairs';
  renderTable('rvDupBody', [
    {k: 'charge', label: 'Charge'},
    {k: 'twin', label: 'Twin charge'},
    {k: 'cust', label: 'Customer', html: v => esc(custName(v))},
    {k: 'loan', label: 'Loan'},
    {k: 'type', label: 'Type'},
    {k: 'amount', label: 'Amount', num: true, html: v => esc(fpM(v))},
    {k: 'when', label: 'Assessed', html: v => esc(fmtDate(v))},
    {k: 'status', label: 'State', html: v => okb(v)}
  ], DUPLICATES, {sort: 'amount', pageSize: 6});

  if(el('rvHistPill')) el('rvHistPill').textContent = num(approved.length + rejected.length) + ' decisions';
  renderTable('rvHistBody', [
    {k: 'id', label: 'Request'},
    {k: 'typeName', label: 'Type'},
    {k: 'amount', label: 'Value', num: true, html: v => esc(fpM(v))},
    {k: 'reason', label: 'Reason'},
    {k: 'approvedBy', label: 'Decided by', html: v => esc(v ? staffName(v) : '—')},
    {k: 'approvedOn', label: 'When', html: v => esc(v ? fmtDate(v) : '—')},
    {k: 'status', label: 'State', html: v => okb(v)}
  ], approved.concat(rejected), {sort: 'approvedOn', pageSize: 8});

  put('rvGrid',
    chartBox({title: 'Corrections by reason', sub: 'Why a charge was questioned', type: 'bar', h: 210,
      cats: REVERSAL_REASONS.map(x => x.split(' ')[0]), value: num(all.length),
      series: [{name: 'Requests', colour: '#7C5CF0', data: REVERSAL_REASONS.map(x => all.filter(y => y.reason === x).length)}]}) +
    chartBox({title: 'Reversals by month', sub: 'Requests received', type: 'bar', h: 210,
      cats: buckets().map(bucketLabel), value: fpM(value),
      series: [{name: 'Requests', data: seriesBy(all, x => x.requestedOn, () => 1).data, colour: '#D93F3F'}]}));
}
function fpReversalSubmit(){
  const c = CHARGES.find(x => x.id === fpPicked('rvCharge', ''));
  if(!c){ toast('Pick a charge to correct', 'err'); return; }
  if(c.status === 'Reversed'){ toast('That charge is already reversed', 'err'); return; }
  const r = {id: 'REV-2026-' + pad(600 + REVERSALS.length, 3), charge: c.id, cust: c.cust, loan: c.loan,
    type: c.type, typeName: c.typeName, kind: c.kind, amount: c.balance > 0 ? c.balance : c.amount,
    reason: fpPicked('rvReason', REVERSAL_REASONS[0]), requestedBy: FEE_STAFF_REF, requestedOn: TODAY,
    approvedBy: '', approvedOn: '', status: 'Pending',
    refund: c.paid > 0 ? 'Refunded to the customer' : 'Nothing collected yet',
    lane: 'Reversals', severity: 'Medium', owner: c.officer, region: c.region};
  REVERSALS.unshift(r);
  FP_SEL.reversal2 = r.id;
  fpAudit('Reversal requested', r.id, '—', fpM(r.amount) + ' on ' + c.id, FEE_STAFF_REF, r.reason, 'Reversals');
  if(el('rvMsg')) el('rvMsg').textContent = r.id + ' submitted to reverse ' + fpM(r.amount) + ' on ' + c.id
    + '. The original charge stays on the file while the request is reviewed.';
  renderAll();
  toast('Correction ' + r.id + ' submitted');
}
function fpReversalDecision(kind){
  const r = REVERSALS.find(x => x.id === FP_SEL.reversal2);
  if(!r){ toast('Pick a correction request', 'err'); return; }
  if(r.status !== 'Pending'){ toast('That request is already ' + r.status.toLowerCase(), 'err'); return; }
  if(kind === 'approve'){
    r.status = 'Approved'; r.approvedBy = 'STF-003'; r.approvedOn = TODAY;
    const c = CHARGES.find(x => x.id === r.charge);
    if(c){
      c.reversed = Math.min(c.amount, Math.max(c.reversed, 0) + r.amount);
      c.balance = Math.max(0, c.amount - c.paid - c.waived - c.reversed);
      c.status = c.balance <= 0 ? 'Reversed' : 'Part paid';
      c.reason = r.reason;
      r.refund = c.paid > 0 ? 'Refunded to the customer' : 'Nothing collected yet';
    }
    if(el('rvRecalcMsg')) el('rvRecalcMsg').textContent = r.id + ' approved. ' + fpM(r.amount)
      + ' came off the charge and the outstanding was recalculated to '
      + fpM((CHARGES.find(x => x.id === r.charge) || {}).balance || 0) + '.';
  } else {
    r.status = 'Rejected'; r.approvedBy = 'STF-003'; r.approvedOn = TODAY;
    if(el('rvRecalcMsg')) el('rvRecalcMsg').textContent = r.id + ' rejected — the charge stands unchanged.';
  }
  fpAudit('Reversal ' + r.status.toLowerCase(), r.id, 'Pending', r.status, 'STF-003', r.reason, 'Reversals');
  renderAll();
  toast(r.id + ' ' + r.status.toLowerCase());
}
function fpRecalcOutstanding(){
  let changed = 0;
  CHARGES.forEach(c => {
    const next = Math.max(0, c.amount - c.paid - c.waived - c.reversed);
    if(next !== c.balance){ c.balance = next; changed++; }
  });
  const open = fpOpenCharges().length;
  if(el('rvRecalcMsg')) el('rvRecalcMsg').textContent = 'Outstanding recalculated on ' + num(CHARGES.length)
    + ' charges; ' + num(changed) + ' balance(s) moved and ' + num(open) + ' remain open, worth '
    + fpM(sum(CHARGES, c => c.balance)) + '.';
  fpAudit('Recalculate outstanding', 'Whole charge book', '—', fpM(sum(CHARGES, c => c.balance)), 'STF-009',
    'Balances recomputed from amount, paid, waived and reversed', 'Reversals');
  renderAll();
  toast('Outstanding recalculated · ' + fpM(sum(CHARGES, c => c.balance)));
}

</script>
