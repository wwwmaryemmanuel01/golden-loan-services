<script>
/* ============================================================
   SALARIES, EXPENSES & OPERATING CHARGES (7/8)
   Sections 13–16: payments, the approval workflow, the
   accounting ledger, and the staff and supplier records.
   ============================================================ */

const SE_ROUTES = [
  {route: 'Bank transfer', kind: 'Bank', cost: 3500, limit: 5000000, note: 'Same day before 15:00'},
  {route: 'Mobile money', kind: 'Wallet', cost: 1200, limit: 500000, note: 'Instant, capped per wallet'},
  {route: 'Cash', kind: 'Counter', cost: 0, limit: 200000, note: 'Requires the payee signature'}
];

/* ===================== 13 · PAYMENTS ===================== */
function sePaymentItem(){
  return SE_PAYMENTS.find(p => p.id === SE_SEL.payment) || SE_PAYMENTS[0];
}
function sePayeesFor(kind){
  if(kind === 'Salary') return SE_STAFF.filter(s => s.status === 'Active').map(s => [s.name, s.name]);
  if(kind === 'Expense') return SE_DEPARTMENTS.map(d => [d.name + ' department', d.name + ' department']);
  return SE_SUPPLIERS.map(s => [s.name, s.name]);
}
function renderPayments(){
  const rows = SE_PAYMENTS.filter(sePass);
  const sel = sePaymentItem();
  if(sel) SE_SEL.payment = sel.id;
  const failed = SE_PAYMENTS.filter(p => p.status === 'Failed');
  const pending = SE_PAYMENTS.filter(p => p.status === 'Pending confirmation');
  const unreconciled = SE_PAYMENTS.filter(p => p.status === 'Paid' && p.reconciled === 'No');
  if(el('pyPill')){ el('pyPill').className = 'badge ' + (failed.length ? 'b-crit' : 'b-ok');
    el('pyPill').textContent = failed.length + ' failed · ' + pending.length + ' pending'; }
  put('pyKpis', [
    ['Payments on file', num(SE_PAYMENTS.length), 'Salary, expense and supplier', ''],
    ['Paid', seM(sum(SE_PAYMENTS.filter(p => p.status === 'Paid'), p => p.amount)), num(SE_PAYMENTS.filter(p => p.status === 'Paid').length) + ' settled', ''],
    ['Awaiting confirmation', num(pending.length), seM(sum(pending, p => p.amount)) + ' with the bank', pending.length ? 'red' : ''],
    ['Processing', num(SE_PAYMENTS.filter(p => p.status === 'Processing').length), 'Queued at the rail', ''],
    ['Failed', num(failed.length), seM(sum(failed, p => p.amount)) + ' to retry', failed.length ? 'red' : ''],
    ['Not reconciled', num(unreconciled.length), 'Paid but not matched to the bank', unreconciled.length ? 'red' : ''],
    ['Salary payments', num(SE_PAYMENTS.filter(p => p.kind === 'Salary').length), 'Paid to staff', ''],
    ['Supplier payments', num(SE_PAYMENTS.filter(p => p.kind === 'Supplier').length), 'Paid to suppliers', '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join(''));

  seFillSel('pyMethod', SE_ROUTES.map(r => [r.route, r.route + ' · ' + r.note]));
  if(el('pyKind')){
    const kind = el('pyKind').value || 'Salary';
    seFillSel('pyPayee', sePayeesFor(kind));
  }
  if(el('pyMsg') && !String(el('pyMsg').textContent || '').trim())
    el('pyMsg').textContent = 'A payment needs a kind, a payee, a route and an amount. Anything above ' + seM(SE_SET.highValueApproval) + ' needs two signatures.';

  if(el('pyCount')) el('pyCount').textContent = num(rows.length) + ' payments';
  const list = rows.slice().sort((a, b) => String(b.when).localeCompare(String(a.when)));
  list.forEach(r => { r._open = () => { SE_SEL.payment = r.id; renderPayments(); seRecordModal(r, r.id + ' · ' + r.payee); }; });
  renderTable('pyBody', [
    {k: 'id', label: 'Payment'},
    {k: 'when', label: 'Date', html: v => esc(fmtDate(v))},
    {k: 'kind', label: 'Kind'},
    {k: 'payee', label: 'Payee'},
    {k: 'method', label: 'Route'},
    {k: 'amount', label: 'Amount', num: true, html: v => esc(seM(v))},
    {k: 'reference', label: 'Reference', html: v => v ? esc(v) : badge('None', 'b-warn')},
    {k: 'status', label: 'State', html: v => okb(v)}
  ], list, {sort: 'when', pageSize: 9});

  const byRoute = SE_ROUTES.map(r => {
    const list = SE_PAYMENTS.filter(p => p.method === r.route);
    return {route: r.route, kind: r.kind, note: r.note, count: list.length,
      value: sum(list.filter(p => p.status === 'Paid'), p => p.amount),
      failed: list.filter(p => p.status === 'Failed').length, limit: r.limit, cost: r.cost * list.length};
  });
  if(el('pyRoutePill')) el('pyRoutePill').textContent = num(byRoute.length) + ' routes';
  renderTable('pyRouteBody', [
    {k: 'route', label: 'Route'},
    {k: 'kind', label: 'Rail'},
    {k: 'count', label: 'Payments', num: true},
    {k: 'value', label: 'Value', num: true, html: v => esc(seM(v))},
    {k: 'cost', label: 'Charges', num: true, html: v => esc(seM(v))},
    {k: 'failed', label: 'Failed', num: true},
    {k: 'limit', label: 'Per payment', num: true, html: v => esc(seM(v))}
  ], byRoute, {sort: 'value', pageSize: 3});

  if(el('pySelPill')) el('pySelPill').textContent = sel ? sel.id : '—';
  put('pyDetail', sel ? kvRow('Payment', esc(sel.id)) + kvRow('Kind', esc(sel.kind))
    + kvRow('Payee', esc(sel.payee)) + kvRow('Route', esc(sel.method))
    + kvRow('Date', esc(fmtDate(sel.when))) + kvRow('Amount', seM(sel.amount))
    + kvRow('Reference', sel.reference ? esc(sel.reference) : badge('Not paid', 'b-warn'))
    + kvRow('Receipt', sel.receipt ? esc(sel.receipt) : '—')
    + kvRow('Reconciled', badge(sel.reconciled, sel.reconciled === 'Yes' ? 'b-ok' : 'b-warn'))
    + kvRow('State', okb(sel.status))
    + (sel.failure ? kvRow('Failure', esc(sel.failure)) : '')
    : '<div class="empty">No payment matches the current filters.</div>');
  if(el('pyReceiptBox') && !String(el('pyReceiptBox').innerHTML || '').trim())
    el('pyReceiptBox').innerHTML = '<div class="qhint">Press “Show the receipt” to open the proof of payment for the selected record.</div>';
  if(el('pyReconBox')){
    const rec = SE_PAYMENTS.filter(p => p.reconciled === 'No');
    el('pyReconBox').innerHTML = rec.length ? rec.slice(0, 6).map(p => `<div class="risk">
        <div><div class="rn">${esc(p.id)} · ${esc(p.payee)}</div><div class="rs">${esc(seM(p.amount))} · ${esc(p.status)}</div></div>
        <div class="rv">${badge('Not matched', 'b-warn')}</div></div>`).join('')
      : '<div class="qhint">Every paid record is matched to a bank line.</div>';
  }
  if(el('pyReconPill')) el('pyReconPill').textContent = num(unreconciled.length) + ' open';

  put('pyGrid',
    chartBox({title: 'Payments by route', sub: 'Value through each rail', type: 'bar', h: 200,
      cats: byRoute.map(r => r.route.split(' ')[0]),
      series: [{name: 'Value', data: byRoute.map(r => r.value)}],
      value: compact(sum(byRoute, r => r.value))}) +
    chartBox({title: 'Payments by kind', sub: 'Where the money goes', type: 'donut', h: 200,
      cats: ['Salary', 'Expense', 'Supplier'],
      series: [{name: 'Value', data: ['Salary', 'Expense', 'Supplier'].map(k =>
        sum(SE_PAYMENTS.filter(p => p.kind === k), p => p.amount))}],
      value: compact(sum(SE_PAYMENTS, p => p.amount))}));
}
function sePaymentRequest(){
  const kind = el('pyKind').value, payee = el('pyPayee').value;
  const route = el('pyMethod').value;
  const amount = Number(el('pyAmount').value) || 0;
  const r = SE_ROUTES.find(x => x.route === route);
  if(!payee){ toast('Pick a payee', 'err'); return; }
  if(amount <= 0){ toast('The amount must be positive', 'err'); return; }
  if(r && amount > r.limit){
    el('pyMsg').textContent = route + ' is capped at ' + seM(r.limit) + ' per payment — choose another route.';
    toast('Above the ' + route + ' limit', 'err'); return;
  }
  const two = amount > SE_SET.highValueApproval;
  const rec = {id: SE_SET.paymentPrefix + '-' + pad(6500 + SE_PAYMENTS.length, 5), kind, payee, method: route,
    when: TODAY, amount, reference: '', status: two ? 'Approved' : 'Pending confirmation', receipt: '',
    reconciled: 'No', failure: '',
    lane: 'Payments', severity: two ? 'High' : 'Low', owner: 'STF-007', region: 'Lilongwe'};
  SE_PAYMENTS.unshift(rec);
  SE_SEL.payment = rec.id;
  if(two){
    SE_APPROVALS.unshift({id: 'APV-' + pad(8300 + SE_APPROVALS.length, 4), kind: 'High-value expense', when: TODAY,
      amount, requester: 'STF-007', approver: 'STF-001', level: 'Two signatures',
      subject: rec.id, comment: 'Second signature required above ' + seM(SE_SET.highValueApproval),
      status: 'Pending', selfApproval: false, lane: 'Approvals', severity: 'High', owner: 'STF-001', region: 'Lilongwe'});
  }
  seAudit('Request payment', rec.id, kind + ' · ' + payee + ' · ' + seM(amount) + ' · ' + route);
  el('pyMsg').textContent = 'Payment ' + rec.id + ' raised for ' + payee + ' · ' + seM(amount) +
    (two ? '. It needs a second signature before it can go.' : '. Confirm it to send it.');
  el('pyAmount').value = '';
  renderAll();
  toast('Payment ' + rec.id + ' raised');
}
function sePaymentAction(act){
  const p = SE_PAYMENTS.find(x => x.id === SE_SEL.payment);
  if(!p){ toast('Pick a payment first', 'err'); return; }
  if(act === 'confirm'){
    if(p.status === 'Paid'){ toast('This payment is already settled', 'err'); return; }
    if(p.amount > SE_SET.highValueApproval && !SE_APPROVALS.some(a => a.subject === p.id && a.status === 'Approved')){
      toast('A second signature is still outstanding', 'err'); return;
    }
    p.status = 'Paid'; p.reference = 'PAY-' + pad(7100 + SE_PAYMENTS.indexOf(p), 5);
    p.receipt = 'RCT-' + pad(5300 + SE_PAYMENTS.indexOf(p), 4);
    seAudit('Confirm payment', p.id, seM(p.amount) + ' · ' + p.method);
    el('pyMsg').textContent = 'Payment ' + p.id + ' confirmed · reference ' + p.reference + '.';
    toast(p.id + ' paid · ' + p.reference);
  } else if(act === 'receipt'){
    if(!p.receipt){ toast('A receipt exists only once the payment is settled', 'err'); return; }
    put('pyReceiptBox', `<div class="receiptdoc">
      <div class="gls-doc-head">
        <img class="gls-docmark" src="assets/logo-mark-96.png" alt="GOLDEN FINANCIAL SERVICES">
        <div class="sliphead"><div><b>GOLDEN FINANCIAL SERVICES</b><div class="qhint">Proof of payment</div></div>
          <div style="text-align:right"><b>${esc(p.receipt)}</b><div class="qhint">${esc(fmtDate(p.when))}</div></div></div>
      </div>
      <div class="pfields">${field('Payee', esc(p.payee))}${field('Amount', esc(seM(p.amount)))}
        ${field('Route', esc(p.method))}${field('Reference', esc(p.reference || '—'))}</div>
      <div class="qhint">Kind ${esc(p.kind)} · reconciled ${esc(p.reconciled)} · issued by Chikondi Mwale.</div></div>`);
    toast('Receipt ' + p.receipt + ' opened');
    return;
  } else if(act === 'fail'){
    p.status = 'Failed'; p.failure = 'The bank rejected the instruction';
    seAudit('Payment failed', p.id, p.failure);
    toast(p.id + ' marked failed — retry it from the list', 'err');
  } else if(act === 'recon'){
    const open = SE_PAYMENTS.filter(x => x.status === 'Paid' && x.reconciled === 'No');
    if(!open.length){ toast('Nothing is waiting for reconciliation', 'ok'); return; }
    open.forEach(x => { x.reconciled = 'Yes'; });
    seAudit('Reconcile payments', open.map(x => x.id).join(', '), open.length + ' records matched');
    toast(open.length + ' payments matched to the bank');
  } else if(act === 'reset'){
    el('pyAmount').value = '';
    renderPayments();
    return;
  }
  renderAll();
}

/* ===================== 14 · APPROVALS ===================== */
function seApprovalItem(){
  return SE_APPROVALS.find(a => a.id === SE_SEL.approval) || SE_APPROVALS.find(a => a.status === 'Pending') || SE_APPROVALS[0];
}
function renderApprovals(){
  const rows = SE_APPROVALS.filter(sePass);
  const sel = seApprovalItem();
  if(sel) SE_SEL.approval = sel.id;
  const pending = SE_APPROVALS.filter(a => a.status === 'Pending');
  const two = SE_APPROVALS.filter(a => a.level === 'Two signatures');
  const self = SE_APPROVALS.filter(a => a.selfApproval);
  if(el('apPill')){ el('apPill').className = 'badge ' + (pending.length ? 'b-warn' : 'b-ok');
    el('apPill').textContent = pending.length + ' waiting'; }
  put('apKpis', [
    ['Approval requests', num(SE_APPROVALS.length), 'Salary, expense and budget decisions', ''],
    ['Waiting', num(pending.length), seM(sum(pending, a => a.amount)) + ' to sign', pending.length ? 'red' : ''],
    ['Approved', num(SE_APPROVALS.filter(a => a.status === 'Approved').length), 'Actioned by finance', ''],
    ['Rejected', num(SE_APPROVALS.filter(a => a.status === 'Rejected').length), 'With the reason kept', ''],
    ['Returned', num(SE_APPROVALS.filter(a => a.status === 'Returned').length), 'Sent back for detail', ''],
    ['Two signatures', num(two.length), 'Above ' + seM(SE_SET.highValueApproval), ''],
    ['Self-approval attempts', num(self.length), 'Blocked by policy', self.length ? 'red' : ''],
    ['Decided this month', num(SE_APPROVAL_HISTORY.length), 'In the approval history', '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join(''));

  if(el('apCount')) el('apCount').textContent = num(rows.length) + ' requests';
  const list = rows.slice().sort((a, b) => String(b.when).localeCompare(String(a.when)));
  list.forEach(r => { r._open = () => { SE_SEL.approval = r.id; renderApprovals(); seRecordModal(r, r.id + ' · ' + r.kind); }; });
  renderTable('apBody', [
    {k: 'id', label: 'Request'},
    {k: 'kind', label: 'Kind'},
    {k: 'subject', label: 'Subject'},
    {k: 'when', label: 'Raised', html: v => esc(fmtDate(v))},
    {k: 'amount', label: 'Amount', num: true, html: v => esc(seM(v))},
    {k: 'requester', label: 'Requested by', html: v => esc(staffName(v))},
    {k: 'level', label: 'Signatures'},
    {k: 'status', label: 'State', html: v => okb(v)}
  ], list, {sort: 'when', pageSize: 9});

  if(el('apSelPill')) el('apSelPill').textContent = sel ? sel.id : '—';
  put('apDetail', sel ? kvRow('Request', esc(sel.id)) + kvRow('Kind', esc(sel.kind))
    + kvRow('Subject', esc(sel.subject)) + kvRow('Amount', seM(sel.amount))
    + kvRow('Raised', esc(fmtDate(sel.when))) + kvRow('Requested by', esc(staffName(sel.requester)))
    + kvRow('Approver', esc(staffName(sel.approver))) + kvRow('Signatures', esc(sel.level))
    + kvRow('Self-approval', badge(sel.selfApproval ? 'Attempted' : 'No', sel.selfApproval ? 'b-crit' : 'b-ok'))
    + kvRow('State', okb(sel.status))
    + (sel.comment ? kvRow('Comment', esc(sel.comment)) : '')
    : '<div class="empty">No request matches the current filters.</div>');
  if(el('apMsg') && !String(el('apMsg').textContent || '').trim())
    el('apMsg').textContent = 'A decision is written to the approval history with the officer, the time and the comment.';
  if(el('apComment')) el('apComment').placeholder = sel && sel.comment ? sel.comment : 'Why the decision was taken';

  put('apSepBox', kvRow('One signature up to', seM(SE_SET.highValueApproval))
    + kvRow('Two signatures above', seM(SE_SET.highValueApproval))
    + kvRow('Requests with two', num(two.length))
    + kvRow('Requester may not approve', badge('Enforced', 'b-ok'))
    + `<div class="qhint" style="margin-top:6px">The database refuses an approval where the requester and the approver are the same person.</div>`);
  put('apTypeBox', ['Salary change', 'Payroll', 'Allowance', 'Expense claim', 'Supplier invoice', 'System subscription', 'High-value expense', 'Budget override']
    .map(k => {
      const list = SE_APPROVALS.filter(a => a.kind === k);
      return `<div class="risk"><div><div class="rn">${esc(k)}</div><div class="rs">${num(list.length)} requests</div></div>
        <div class="rv">${esc(seM(sum(list, a => a.amount)))}</div></div>`;
    }).join(''));
  if(el('apLimitPill')) el('apLimitPill').textContent = num(SE_APPROVAL_LIMITS.length) + ' roles';
  renderTable('apLimitBody', [
    {k: 'role', label: 'Role'},
    {k: 'salary', label: 'Salary changes', num: true, html: v => v ? esc(seM(v)) : 'None'},
    {k: 'expense', label: 'Expenses', num: true, html: v => v ? esc(seM(v)) : 'None'},
    {k: 'supplier', label: 'Supplier invoices', num: true, html: v => v ? esc(seM(v)) : 'None'},
    {k: 'note', label: 'Note'}
  ], SE_APPROVAL_LIMITS, {sort: 'expense', pageSize: 5});

  if(el('apHistPill')) el('apHistPill').textContent = num(SE_APPROVAL_HISTORY.length) + ' decisions';
  renderTable('apHistBody', [
    {k: 'when', label: 'When', html: v => esc(fmtDate(v))},
    {k: 'request', label: 'Request'},
    {k: 'kind', label: 'Kind'},
    {k: 'amount', label: 'Amount', num: true, html: v => esc(seM(v))},
    {k: 'decision', label: 'Decision', html: v => okb(v)},
    {k: 'by', label: 'Decided by', html: v => esc(staffName(v))}
  ], SE_APPROVAL_HISTORY, {sort: 'when', pageSize: 7});

  put('apGrid',
    chartBox({title: 'Requests by kind', sub: 'What needs a signature', type: 'bar', h: 200,
      cats: ['Salary', 'Payroll', 'Claims', 'Invoices', 'Budget'],
      series: [{name: 'Requests', data: [SE_APPROVALS.filter(a => a.kind === 'Salary change').length,
        SE_APPROVALS.filter(a => a.kind === 'Payroll').length,
        SE_APPROVALS.filter(a => a.kind === 'Expense claim').length,
        SE_APPROVALS.filter(a => a.kind === 'Supplier invoice').length,
        SE_APPROVALS.filter(a => a.kind === 'Budget override').length]}],
      value: num(SE_APPROVALS.length)}) +
    chartBox({title: 'Decisions', sub: 'How the queue has resolved', type: 'donut', h: 200,
      cats: ['Approved', 'Rejected', 'Returned', 'Pending'],
      series: [{name: 'Requests', data: ['Approved', 'Rejected', 'Returned', 'Pending']
        .map(st => SE_APPROVALS.filter(a => a.status === st).length)}],
      value: num(SE_APPROVALS.length)}));
}
function seApprovalAction(act){
  const a = SE_APPROVALS.find(x => x.id === SE_SEL.approval);
  if(!a){ toast('Pick a request first', 'err'); return; }
  const note = (el('apComment').value || '').trim();
  if(a.status !== 'Pending'){ toast('This request has already been decided', 'err'); return; }
  if(act === 'approve'){
    if(a.selfApproval){ toast('The requester may not approve their own request', 'err');
      a.comment = 'Blocked: self-approval attempted'; renderAll(); return; }
    if(a.level === 'Two signatures' && a.amount > SE_SET.highValueApproval && a.approver === 'STF-009'){
      a.approver = 'STF-001';
    }
    a.status = 'Approved'; a.comment = note || 'Approved within the officer limit';
  } else if(act === 'reject'){
    if(!note){ toast('A rejection needs a reason', 'err'); return; }
    a.status = 'Rejected'; a.comment = note;
  } else if(act === 'return'){
    a.status = 'Returned'; a.comment = note || 'Send it back with the missing detail';
  }
  SE_APPROVAL_HISTORY.unshift({when: TODAY + ' ' + seNow(), request: a.id, kind: a.kind, amount: a.amount,
    decision: a.status, by: a.approver, comment: a.comment});
  seAudit('Approval ' + act, a.id, a.kind + ' · ' + seM(a.amount) + ' · ' + a.status);
  el('apComment').value = '';
  renderAll();
  toast(a.id + ' is now ' + a.status);
}

/* ===================== 15 · LEDGER ===================== */
function renderLedger(){
  const s = seStats();
  const balanced = Math.abs(s.ledgerNet) < 1;
  if(el('lgPill')){ el('lgPill').className = 'badge ' + (balanced ? 'b-ok' : 'b-crit');
    el('lgPill').textContent = balanced ? 'Ledger balanced' : 'Out by ' + seM(Math.abs(s.ledgerNet)); }
  put('lgKpis', [
    ['Ledger entries', num(SE_LEDGER.length), 'Debit and credit pairs', ''],
    ['Debits', seM(sum(SE_LEDGER.filter(e => e.side === 'Debit'), e => e.amount)), 'Everything that was charged', ''],
    ['Credits', seM(sum(SE_LEDGER.filter(e => e.side === 'Credit'), e => e.amount)), 'Everything that was paid', ''],
    ['Net position', seM(Math.abs(s.ledgerNet)), balanced ? 'Balanced' : 'Needs attention', balanced ? '' : 'red'],
    ['Entry kinds', num(SE_LEDGER_KINDS.length), 'Salary to prepaid', ''],
    ['Cost centres', num(SE_DEPARTMENTS.length), 'Every entry is allocated', ''],
    ['Prepaid items', num(SE_PREPAID.length), 'Amortised monthly', ''],
    ['Capitalised items', num(SE_LEDGER_CLASS.filter(c => /Capital/i.test(c.treatment)).length), 'Assets, not expenses', '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join(''));

  if(el('lgCount')) el('lgCount').textContent = num(SE_LEDGER.length) + ' entries';
  const list = SE_LEDGER.filter(sePass).slice().sort((a, b) => String(b.when).localeCompare(String(a.when)));
  renderTable('lgBody', [
    {k: 'entry', label: 'Entry'},
    {k: 'when', label: 'Date', html: v => esc(fmtDate(v))},
    {k: 'ref', label: 'Reference'},
    {k: 'kind', label: 'Kind'},
    {k: 'account', label: 'Account'},
    {k: 'side', label: 'Side', html: v => badge(v, v === 'Debit' ? 'b-warn' : 'b-ok')},
    {k: 'amount', label: 'Amount', num: true, html: v => esc(seM(v))}
  ], list, {sort: 'when', pageSize: 10});

  if(el('lgKindPill')) el('lgKindPill').textContent = num(SE_LEDGER_SUMMARY.length) + ' kinds';
  renderTable('lgKindBody', [
    {k: 'kind', label: 'Kind'},
    {k: 'account', label: 'Account'},
    {k: 'entries', label: 'Entries', num: true},
    {k: 'debit', label: 'Debit', num: true, html: v => esc(seM(v))},
    {k: 'credit', label: 'Credit', num: true, html: v => esc(seM(v))},
    {k: 'net', label: 'Net', num: true, html: v => esc(seM(v))}
  ], SE_LEDGER_SUMMARY, {sort: 'debit', pageSize: 10});

  if(el('lgClassPill')) el('lgClassPill').textContent = num(SE_LEDGER_CLASS.length) + ' items';
  renderTable('lgClassBody', [
    {k: 'item', label: 'Item'},
    {k: 'treatment', label: 'Treatment'},
    {k: 'value', label: 'Value', num: true, html: v => esc(seM(v))},
    {k: 'note', label: 'Note'}
  ], SE_LEDGER_CLASS, {sort: 'value', pageSize: 5});

  if(el('lgPrePill')) el('lgPrePill').textContent = seM(sum(SE_PREPAID, p => p.total)) + ' prepaid';
  renderTable('lgPreBody', [
    {k: 'item', label: 'Item'},
    {k: 'from', label: 'From', html: v => esc(fmtDate(v))},
    {k: 'to', label: 'To', html: v => esc(fmtDate(v))},
    {k: 'total', label: 'Total', num: true, html: v => esc(seM(v))},
    {k: 'monthly', label: 'A month', num: true, html: v => esc(seM(v))},
    {k: 'remaining', label: 'Months left', num: true}
  ], SE_PREPAID, {sort: 'total', pageSize: 3});

  if(el('lgCcPill')) el('lgCcPill').textContent = num(SE_DEPARTMENTS.length) + ' centres';
  put('lgCcBox', SE_DEPARTMENTS.map(d => {
    const list = SE_LEDGER.filter(e => e.costCentre === d.costCentre);
    const net = sum(list, e => e.side === 'Debit' ? e.amount : -e.amount);
    return kvRow(d.name + ' · ' + d.costCentre, num(list.length) + ' entries · ' + seM(net));
  }).join(''));

  put('lgReconBox', kvRow('Debits in the ledger', seM(sum(SE_LEDGER.filter(e => e.side === 'Debit'), e => e.amount)))
    + kvRow('Credits in the ledger', seM(sum(SE_LEDGER.filter(e => e.side === 'Credit'), e => e.amount)))
    + kvRow('Difference', seNetLabel(s.ledgerNet))
    + kvRow('Payments settled', seM(sum(SE_PAYMENTS.filter(p => p.status === 'Paid'), p => p.amount)))
    + kvRow('Result', balanced ? badge('Balanced', 'b-ok') : badge('Out of balance', 'b-crit')));
  if(el('lgReconPill')) el('lgReconPill').textContent = balanced ? 'Balanced' : 'Out';

  put('lgGrid',
    chartBox({title: 'Debits by kind', sub: 'Where the money went', type: 'bar', h: 200,
      cats: SE_LEDGER_SUMMARY.slice(0, 6).map(x => x.kind.split(' ')[0]),
      series: [{name: 'Debit', data: SE_LEDGER_SUMMARY.slice(0, 6).map(x => x.debit)}],
      value: compact(sum(SE_LEDGER_SUMMARY, x => x.debit))}) +
    chartBox({title: 'Cost centre allocation', sub: 'Net charges by centre', type: 'donut', h: 200,
      cats: SE_DEPARTMENTS.map(d => d.name.split(' ')[0]),
      series: [{name: 'Debits', data: SE_DEPARTMENTS.map(d => sum(SE_LEDGER.filter(e => e.costCentre === d.costCentre && e.side === 'Debit'),
        e => e.amount))}],
      value: compact(sum(SE_LEDGER.filter(e => e.side === 'Debit'), e => e.amount))}));
}
function seLedgerReconcile(){
  const s = seStats();
  if(Math.abs(s.ledgerNet) < 1){
    put('lgReconBox', '<div class="note gray"><div>Debits and credits already net to zero — nothing to reconcile.</div></div>');
    toast('The ledger is already balanced', 'ok'); return;
  }
  seAudit('Reconcile ledger', 'All entries', 'Difference of ' + seM(Math.abs(s.ledgerNet)) + ' investigated');
  toast('Ledger reconciliation written to the audit log');
}

/* ===================== 16 · STAFF AND SUPPLIER RECORDS ===================== */
function seSupplierItem(){
  return SE_SUP_BY_ID[SE_SEL.supplier] || SE_SUPPLIERS[0];
}
function renderParties(){
  const links = SE_STAFF_LINKS;
  const sup = SE_SUPPLIERS;
  const sel = seSupplierItem();
  if(sel) SE_SEL.supplier = sel.id;
  const unverified = sup.filter(s => s.verified !== 'Verified');
  if(el('spPill')){ el('spPill').className = 'badge ' + (unverified.length ? 'b-warn' : 'b-ok');
    el('spPill').textContent = num(links.length) + ' staff · ' + num(sup.length) + ' suppliers'; }
  put('spKpis', [
    ['Staff on the payroll', num(SE_STAFF.length), num(SE_STAFF.filter(s => s.status === 'Active').length) + ' active', ''],
    ['Salary records linked', num(SE_SALARIES.length), 'One per staff member', ''],
    ['Staff without a record', num(SE_STAFF.filter(s => !seSalOf(s.id)).length), 'Nothing to pay', ''],
    ['Claims raised', num(SE_CLAIMS.length), seM(sum(SE_CLAIMS, c => c.amount)) + ' claimed', ''],
    ['Suppliers', num(sup.length), 'Mapped to categories', ''],
    ['Verified suppliers', num(sup.length - unverified.length), unverified.length + ' still to check', unverified.length ? 'red' : ''],
    ['Supplier payments', num(SE_SUPPLIER_PAYMENTS.length), seM(sum(sup, s => s.total)) + ' lifetime', ''],
    ['Bank details changed', num(SE_SUPPLIER_CHANGES.length), 'Every change is logged', '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join(''));

  if(el('spLinkPill')) el('spLinkPill').textContent = num(links.length) + ' links';
  if(el('spLinkMsg') && !String(el('spLinkMsg').textContent || '').trim())
    el('spLinkMsg').textContent = 'Every staff member on the payroll is linked to a salary record; the link is what makes a payslip and a payment possible.';
  const linkList = links.map(l => Object.assign({}, l, {_open: undefined}));
  linkList.forEach(r => { r._open = () => { openStaffLink(r.staff); }; });
  renderTable('spLinkBody', [
    {k: 'staff', label: 'Employee'},
    {k: 'name', label: 'Name'},
    {k: 'role', label: 'Role'},
    {k: 'dept', label: 'Department'},
    {k: 'salary', label: 'Salary record'},
    {k: 'basic', label: 'Basic', num: true, html: v => esc(seM(v))},
    {k: 'claims', label: 'Claims', num: true},
    {k: 'verified', label: 'State', html: v => okb(v)}
  ], linkList.filter(sePass), {sort: 'basic', pageSize: 8});

  if(el('spSupPill')) el('spSupPill').textContent = num(sup.length) + ' suppliers';
  const supList = sup.filter(sePass);
  supList.forEach(r => { r._open = () => { SE_SEL.supplier = r.id; renderParties(); seRecordModal(r, r.name + ' · ' + r.id); }; });
  renderTable('spSupBody', [
    {k: 'id', label: 'Supplier'},
    {k: 'name', label: 'Name'},
    {k: 'category', label: 'Category'},
    {k: 'contact', label: 'Contact'},
    {k: 'payments', label: 'Payments', num: true},
    {k: 'total', label: 'Paid', num: true, html: v => esc(seM(v))},
    {k: 'verified', label: 'State', html: v => okb(v)}
  ], supList, {sort: 'total', pageSize: 8});

  if(el('spSelPill')) el('spSelPill').textContent = sel ? sel.id : '—';
  put('spDetail', sel ? kvRow('Supplier', esc(sel.name)) + kvRow('Record', esc(sel.id))
    + kvRow('Category', esc(sel.category)) + kvRow('Contact', esc(sel.contact))
    + kvRow('Phone', esc(sel.phone)) + kvRow('Email', esc(sel.email))
    + kvRow('Bank', esc(sel.bank)) + kvRow('Account', '•••• ' + esc(String(sel.account).slice(-4)))
    + kvRow('Payments', num(sel.payments)) + kvRow('Paid to date', seM(sel.total))
    + kvRow('Verified', okb(sel.verified))
    : '<div class="empty">No supplier matches the current filters.</div>');
  if(el('spBankBox') && !String(el('spBankBox').innerHTML || '').trim())
    el('spBankBox').innerHTML = '<div class="qhint">Press “Bank details” to reveal the masked account for the selected supplier — every read is logged.</div>';

  if(el('spInvPill')) el('spInvPill').textContent = num(SE_SUPPLIER_INVOICES.length) + ' invoices';
  renderTable('spInvBody', [
    {k: 'id', label: 'Invoice'},
    {k: 'supplier', label: 'Supplier'},
    {k: 'when', label: 'Billed', html: v => esc(fmtDate(v))},
    {k: 'due', label: 'Due', html: v => esc(fmtDate(v))},
    {k: 'amount', label: 'Amount', num: true, html: v => esc(seM(v))},
    {k: 'status', label: 'State', html: v => okb(v)}
  ], SE_SUPPLIER_INVOICES.filter(sePass), {sort: 'amount', pageSize: 8});
  if(el('spPayPill')) el('spPayPill').textContent = num(SE_SUPPLIER_PAYMENTS.length) + ' paid';
  renderTable('spPayBody', [
    {k: 'when', label: 'When', html: v => esc(fmtDate(v))},
    {k: 'supplier', label: 'Supplier'},
    {k: 'amount', label: 'Amount', num: true, html: v => esc(seM(v))},
    {k: 'method', label: 'Route'},
    {k: 'reference', label: 'Reference'},
    {k: 'status', label: 'State', html: v => okb(v)}
  ], SE_SUPPLIER_PAYMENTS, {sort: 'when', pageSize: 7});
  if(el('spHistPill')) el('spHistPill').textContent = num(SE_SUPPLIER_CHANGES.length) + ' changes';
  renderTable('spHistBody', [
    {k: 'when', label: 'When', html: v => esc(seWhen(v))},
    {k: 'supplier', label: 'Supplier'},
    {k: 'field', label: 'Field'},
    {k: 'from', label: 'Was'},
    {k: 'to', label: 'Now'},
    {k: 'approved', label: 'Approved', html: v => okb(v)}
  ], SE_SUPPLIER_CHANGES, {sort: 'when', pageSize: 3});
}
function openStaffLink(id){
  const l = SE_STAFF_LINKS.find(x => x.staff === id);
  if(!l) return;
  openModal(l.name + ' · ' + l.staff, l.role + ' · ' + l.dept,
    `<div class="pfields">
      ${field('Salary record', esc(l.salary))}${field('Basic', esc(seM(l.basic)))}
      ${field('Employment', esc(l.employment))}${field('State', okb(l.status))}
      ${field('Claims', num(l.claims))}${field('Claimed', esc(seM(l.claimValue)))}
      ${field('Payslips', num(SE_PAYSLIPS.filter(p => p.staff === id).length))}${field('Verified', okb(l.verified))}
    </div>`, [{label: 'Close', act: 'close'}]);
}
function seLinkVerify(){
  const bad = SE_STAFF_LINKS.filter(l => l.verified !== 'Verified');
  if(!bad.length){ toast('Every staff link is verified', 'ok'); return; }
  bad.forEach(l => { l.verified = 'Verified'; });
  seAudit('Verify staff links', bad.map(l => l.staff).join(', '), bad.length + ' links checked against the payroll');
  el('spLinkMsg').textContent = bad.length + ' staff links verified against their salary record.';
  renderAll();
  toast(bad.length + ' staff links verified');
}
function seSupplierVerify(){
  const s = SE_SUP_BY_ID[SE_SEL.supplier];
  if(!s){ toast('Pick a supplier first', 'err'); return; }
  if(s.verified === 'Verified'){ toast(s.name + ' is already verified', 'ok'); return; }
  s.verified = 'Verified';
  SE_SUPPLIER_CHANGES.unshift({when: TODAY + ' ' + seNow(), supplier: s.name, field: 'Verification',
    from: 'Unverified', to: 'Verified', by: 'STF-009', approved: 'Yes',
    lane: 'Suppliers', severity: 'Low', owner: 'STF-009', region: 'Lilongwe'});
  seAudit('Verify supplier', s.id, s.name + ' checked against the registrar');
  renderAll();
  toast(s.name + ' verified');
}
function seSupplierBank(){
  const s = SE_SUP_BY_ID[SE_SEL.supplier];
  if(!s){ toast('Pick a supplier first', 'err'); return; }
  put('spBankBox', `<div class="receiptdoc">
    <div class="sliphead"><div><b>${esc(s.name)}</b><div class="qhint">Bank details</div></div>
      <div style="text-align:right">${okb(s.verified)}</div></div>
    <div class="pfields">${field('Bank', esc(s.bank))}${field('Account', '•••• ' + esc(String(s.account).slice(-4)))}
      ${field('Currency', 'MWK')}${field('Change policy', 'Two signatures')}</div>
    <div class="qhint">Reading these details is written to the access log. A change needs the Finance Manager and the Administrator.</div></div>`);
  seAudit('Read supplier bank details', s.id, s.name);
  toast('Bank details opened for ' + s.name);
}
function seSupplierStatement(){
  const s = SE_SUP_BY_ID[SE_SEL.supplier];
  if(!s){ toast('Pick a supplier first', 'err'); return; }
  const inv = SE_SUPPLIER_INVOICES.filter(i => i.supplier === s.name);
  const pays = SE_SUPPLIER_PAYMENTS.filter(p => p.supplier === s.name);
  const cols = [['Date', 'when'], ['Document', 'doc'], ['Amount', 'amount'], ['State', 'status']];
  const rows = inv.map(i => ({when: fmtDate(i.when), doc: i.id, amount: seM(i.amount), status: i.status}))
    .concat(pays.map(p => ({when: fmtDate(p.when), doc: p.reference || 'Payment', amount: '− ' + seM(p.amount), status: p.status})));
  downloadFile('supplier-statement-' + s.id + '-' + TODAY.replace(/-/g, '') + '.csv', 'text/csv',
    toCsv([cols.map(c => c[0])].concat(rows.map(r => cols.map(c => r[c[1]])))));
  logExport('Supplier statement · ' + s.name, 'CSV', rows.length);
  renderExportHistory();
  openModal('Statement · ' + s.name, rows.length + ' documents · ' + filterLine(),
    `<div class="tblwrap" style="max-height:320px"><table class="tbl2 dense"><thead><tr>${cols.map(c => `<th>${esc(c[0])}</th>`).join('')}</tr></thead>
      <tbody>${rows.map(r => `<tr>${cols.map(c => `<td>${esc(r[c[1]])}</td>`).join('')}</tr>`).join('') || `<tr><td colspan="4" class="empty">Nothing to show.</td></tr>`}</tbody></table></div>`,
    [{label: 'Print', act: () => printTable('Supplier statement · ' + s.name, cols.map(c => ({label: c[0]})), rows.map(r => cols.map(c => r[c[1]])))},
     {label: 'Close', act: 'close'}]);
  toast('Statement for ' + s.name + ' built');
}
</script>
