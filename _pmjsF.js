<script>
/* ============================================================
   METHODS OF PAYMENT MANAGEMENT (6/7)
   10 · Loan repayment connection  11 · Reconciliation
   12 · Fees and limits           13 · Receipts and statements
   ============================================================ */

/* ===================== 10 · LOAN REPAYMENT CONNECTION ===================== */
function splitFor(loan, amount){
  const feesDue = Math.min(2500, Math.max(0, loan.arrears ? 2500 : 0));
  const interestDue = Math.max(0, Math.round(loan.flatInterest * (1 - (loan.paidInterest || 0) / Math.max(1, loan.flatInterest))));
  let left = amount;
  const fees = Math.min(feesDue, left); left -= fees;
  const interest = Math.min(interestDue, left); left -= interest;
  const principal = Math.min(loan.outstanding, left);
  const over = Math.max(0, left - principal);
  return {fees, interest, principal, over};
}
function renderAllocations(){
  const alloc = PM_ALLOC;
  const failed = alloc.filter(a => a.status === 'Failed');
  if(el('aMsg') && !el('aMsg').textContent)
    el('aMsg').textContent = 'Fees first, then interest, then principal — the split below follows the ledger rule.';
  el('alPill').className = 'badge ' + (failed.length ? 'b-warn' : 'b-ok');
  el('alPill').textContent = alloc.filter(a => a.status === 'Allocated').length + ' allocated';
  el('alKpis').innerHTML = [
    ['Allocations', num(alloc.length), alloc.filter(a => a.status === 'Allocated').length + ' posted · ' + failed.length + ' held', ''],
    ['Principal collected', shortMoney(sum(alloc, a => a.principal)), 'Applied to the loan first', ''],
    ['Interest collected', shortMoney(sum(alloc, a => a.interest)), 'Then the flat interest', ''],
    ['Fees collected', shortMoney(sum(alloc, a => a.fees)), 'Penalties and processing', ''],
    ['Failed allocations', num(failed.length), 'Held for a human decision', failed.length ? 'red' : ''],
    ['Loans touched', num(new Set(alloc.map(a => a.loan)).size), 'Across ' + new Set(alloc.map(a => a.cust)).size + ' customers', '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join('');

  pmFillSel('aLoan', pmLoanOptions());
  if(el('aAmount') && !el('aAmount').value) el('aAmount').value = 145000;
  renderSplit();

  const loan = LOAN_BY_REF[el('aLoan') ? el('aLoan').value : ''] || LOANS[0];
  el('balPill').className = 'badge ' + (loan.arrears ? 'b-warn' : 'b-ok');
  el('balPill').textContent = loan.arrears ? 'In arrears' : 'Current';
  put('balBox',
    meter('Loan repaid', pct(loan.paidPrincipal, loan.amount), shortMoney(loan.paidPrincipal) + ' of ' + shortMoney(loan.amount), 100) +
    kvRow('Outstanding principal', pmMoney(loan.outstanding)) +
    kvRow('Monthly instalment', pmMoney(loan.instalment)) +
    kvRow('Instalments paid', num(loan.paidCount) + ' of ' + num(loan.term)) +
    kvRow('Arrears', loan.arrears ? pmMoney(loan.arrears) : 'None') +
    kvRow('Status', okBadge(loan.status)));
  put('schedBox', `<div class="minihead">Next instalments</div>` +
    [0, 1, 2].map(i => {
      const due = addMonths(TODAY, i);
      const paid = i === 0 && loan.paidCount >= Math.floor(loan.paidCount);
      return `<div class="checkrow">
        <div class="ck ${paid ? 'pass' : 'warn'}">${paid ? '✓' : '·'}</div>
        <div style="flex:1"><div style="font-size:10.5px;font-weight:800">${esc(fmtDate(due))} · ${pmMoney(loan.instalment)}</div>
          <div class="qhint">Principal ${pmMoney(Math.round(loan.amount / loan.term))} · interest ${pmMoney(Math.round(loan.flatInterest / loan.term))}</div></div>
        <div>${paid ? okBadge('Paid') : okBadge('Pending')}</div></div>`;
    }).join(''));

  el('allocPill').textContent = alloc.length + ' allocations';
  renderTable('allocBody', [
    {k: 'when', label: 'When', html: v => esc(String(v).slice(0, 16))},
    {k: 'receipt', label: 'Receipt'},
    {k: 'loan', label: 'Loan'},
    {k: 'cust', label: 'Customer', html: v => esc(custName(v))},
    {k: 'amount', label: 'Payment', num: true, html: v => pmMoney(v)},
    {k: 'principal', label: 'Principal', num: true, html: v => pmMoney(v)},
    {k: 'interest', label: 'Interest', num: true, html: v => pmMoney(v)},
    {k: 'fees', label: 'Fees', num: true, html: v => pmMoney(v)},
    {k: 'after', label: 'Balance after', num: true, html: v => pmMoney(v)},
    {k: 'status', label: 'State', html: v => okBadge(v)}
  ], alloc, {sort: 'when', pageSize: 9});

  el('failAllocPill').className = 'badge ' + (failed.length ? 'b-crit' : 'b-ok');
  el('failAllocPill').textContent = failed.length + ' held';
  put('failAllocBox', failed.length ? failed.slice(0, 5).map(a => `<div class="risk">
      <div><div class="rn">${esc(a.receipt)} · ${pmMoney(a.amount)}</div>
        <div class="rs">${esc(a.note)} — loan ${esc(a.loan)}</div></div>
      <div class="rv"><button class="btn btn-ghost" data-allocfix="${esc(a.receipt)}">Post it</button></div></div>`).join('')
    : '<div class="empty">Every allocation posted cleanly.</div>');

  el('allocHistPill').textContent = alloc.length + ' receipts';
  renderTable('allocHistBody', [
    {k: 'receipt', label: 'Receipt'},
    {k: 'loan', label: 'Loan'},
    {k: 'amount', label: 'Amount', num: true, html: v => pmMoney(v)},
    {k: 'schedule', label: 'Schedule effect'},
    {k: 'status', label: 'State', html: v => okBadge(v)}
  ], alloc, {sort: 'when', pageSize: 6});

  el('alGrid').innerHTML =
    chartBox({title: 'Allocation split', sub: 'Principal, interest and fees across the period', type: 'bar', h: 200,
      cats: ['Principal', 'Interest', 'Fees'],
      series: [{name: 'Collected', data: [sum(alloc, a => a.principal), sum(alloc, a => a.interest), sum(alloc, a => a.fees)]}],
      value: shortMoney(sum(alloc, a => a.amount))}) +
    chartBox({title: 'Allocations by status', sub: 'Posted against held', type: 'donut', h: 200,
      cats: ['Allocated', 'Failed'],
      series: [{name: 'Allocations', data: [alloc.filter(a => a.status === 'Allocated').length, failed.length]}],
      value: alloc.length});
}
function renderSplit(){
  const loan = LOAN_BY_REF[el('aLoan') ? el('aLoan').value : ''] || LOANS[0];
  const amount = Number(el('aAmount') ? el('aAmount').value : 0) || 0;
  if(!loan){ put('aSplitBox', '<div class="empty">No loan selected.</div>'); return; }
  const s = splitFor(loan, amount);
  put('aSplitBox', `<div class="pfields" style="grid-template-columns:1fr 1fr">
      ${field('Principal', pmMoney(s.principal))}
      ${field('Interest', pmMoney(s.interest))}
      ${field('Fees', pmMoney(s.fees))}
      ${field('Overpayment / credit', pmMoney(s.over))}
    </div>
    ${amount > loan.outstanding + s.interest + s.fees
      ? '<div class="qhint" style="margin-top:6px">This is more than the loan owes — the excess will sit as a customer credit.</div>'
      : '<div class="qhint" style="margin-top:6px">Fees first, then interest, then principal — the order the ledger uses.</div>'}`);
}
function allocatePayment(){
  const loan = LOAN_BY_REF[el('aLoan').value];
  const amount = Number(el('aAmount').value) || 0;
  if(!loan) return toast('Pick a loan first', 'warn');
  if(amount < 500) return toast('The minimum allocation is MK 500', 'warn');
  if(loan.status === 'Closed') return toast('This loan is already settled — allocate to an open loan', 'warn');
  const s = splitFor(loan, amount);
  const before = loan.outstanding;
  loan.paidPrincipal += s.principal;
  loan.paidInterest += s.interest;
  loan.paidFees += s.fees;
  loan.outstanding = Math.max(0, loan.amount - loan.paidPrincipal);
  loan.paidCount = Math.round((loan.paidCount + amount / loan.instalment) * 10) / 10;
  const receipt = PM_SET.receiptPrefix + '-' + pad(PM_RECEIPTS.length + 1, PM_SET.receiptDigits);
  PM_ALLOC.unshift({when: TODAY + ' ' + new Date().toTimeString().slice(0, 5), receipt, loan: loan.ref, cust: loan.cust,
    amount, principal: s.principal, interest: s.interest, fees: s.fees, before, after: loan.outstanding,
    schedule: 'Instalment ' + Math.ceil(loan.paidCount) + ' marked paid', status: 'Allocated',
    note: 'Fees first, then interest, then principal', lane: 'Ledger', severity: 'Low', owner: 'STF-009', region: loan.region});
  PM_RECEIPTS.unshift({receipt, when: TODAY + ' ' + new Date().toTimeString().slice(0, 5), cust: loan.cust, loan: loan.ref,
    amount, method: 'Cash', officer: 'STF-009', status: 'Issued', issued: 'Automatic', verified: 'Verified',
    lane: 'Receipts', severity: 'Low', owner: 'STF-009', region: loan.region, due: addMonths(TODAY, 1)});
  pmLogChange('Ledger', 'Payment allocated to ' + loan.ref, pmMoney(before) + ' outstanding', pmMoney(loan.outstanding) + ' outstanding');
  renderAllocations(); renderReceipts(); renderOverview(); renderChanges(); renderStats();
  if(el('aMsg')) el('aMsg').textContent = pmMoney(amount) + ' allocated to ' + loan.ref + ' — principal ' +
    pmMoney(s.principal) + ', interest ' + pmMoney(s.interest) + ', fees ' + pmMoney(s.fees) +
    '. Receipt ' + receipt + ' issued; the balance is now ' + pmMoney(loan.outstanding) + '.';
  toast('Allocated ' + pmMoney(amount) + ' to ' + loan.ref);
}
function postFailedAllocation(receipt){
  const a = PM_ALLOC.find(x => x.receipt === receipt && x.status === 'Failed');
  if(!a) return;
  a.status = 'Allocated';
  a.note = 'Posted after a manual review of the loan balance';
  a.schedule = 'Instalment marked paid after review';
  pmLogChange('Ledger', 'Held allocation posted', receipt + ' · failed', receipt + ' · allocated');
  renderAllocations(); renderChanges();
  toast(receipt + ' posted');
}
function recalcBalance(){
  const loan = LOAN_BY_REF[el('aLoan').value];
  if(!loan) return;
  const paid = sum(PM_ALLOC.filter(a => a.loan === loan.ref && a.status === 'Allocated'), a => a.principal);
  const before = loan.outstanding;
  loan.outstanding = Math.max(0, loan.amount - Math.max(loan.paidPrincipal, 0));
  pmLogChange('Ledger', 'Balance recalculated for ' + loan.ref, pmMoney(before), pmMoney(loan.outstanding));
  renderAllocations(); renderChanges();
  toast(loan.ref + ' recalculated · ' + pmMoney(loan.outstanding) + ' outstanding');
}

/* ===================== 11 · PAYMENT RECONCILIATION ===================== */
function reconGaps(){
  const rows = [];
  PM_RECON.forEach(r => {
    if(r.missing) rows.push({id: r.id, kind: 'Missing', source: r.source, detail: r.missing + ' statement lines with no receipt', amount: 0, status: 'Open'});
    if(r.duplicates) rows.push({id: r.id, kind: 'Duplicate', source: r.source, detail: r.duplicates + ' provider references seen twice', amount: 0, status: 'Held'});
    if(r.difference) rows.push({id: r.id, kind: 'Difference', source: r.source, detail: 'Statement and ledger differ', amount: r.difference, status: 'Open'});
  });
  PM_ADJUST.filter(a => a.status === 'Pending').forEach(a => rows.push({id: a.id, kind: a.kind, source: a.recon,
    detail: a.reason, amount: a.amount, status: 'Adjustment'}));
  return rows;
}
function renderRecon(){
  const s = pmS();
  const gaps = reconGaps();
  const unmatched = PM_TXNS.filter(t => t.reconciled !== 'Matched').slice(0, 40);
  el('recPill').className = 'badge ' + (gaps.length ? 'b-warn' : 'b-ok');
  el('recPill').textContent = gaps.length ? gaps.length + ' gaps' : 'All matched';
  el('recKpis').innerHTML = [
    ['Reconciliation runs', num(PM_RECON.length), PM_RECON.filter(r => r.status === 'Matched' || r.status === 'Approved').length + ' closed', ''],
    ['Lines matched', num(sum(PM_RECON, r => r.matched)), 'of ' + num(sum(PM_RECON, r => r.lines)) + ' statement lines', ''],
    ['Missing items', num(sum(PM_RECON, r => r.missing)), 'Statement lines without a receipt', sum(PM_RECON, r => r.missing) ? 'red' : ''],
    ['Value difference', pmMoney(Math.abs(sum(PM_RECON, r => r.difference))), 'Adjusted through the ledger', sum(PM_RECON, r => r.difference) ? 'red' : ''],
    ['Open adjustments', num(PM_ADJUST.filter(a => a.status === 'Pending').length), 'Waiting on approval', ''],
    ['Unreconciled receipts', num(unmatched.length), 'Still waiting on a statement line', unmatched.length ? 'red' : '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join('');

  if(el('recMsg') && !el('recMsg').textContent)
    el('recMsg').textContent = 'Last run ' + (PM_RECON[0] ? PM_RECON[0].when : '—') + ' · ' +
      sum(PM_RECON, r => r.missing) + ' missing lines and ' +
      pmMoney(Math.abs(sum(PM_RECON, r => r.difference))) + ' of value differences outstanding.';
  el('recGrid').innerHTML =
    chartBox({title: 'Matched against unmatched', sub: 'Per day this week', type: 'line', h: 190,
      cats: PM_RECON_DAILY.map(d => d.day),
      series: [{name: 'Matched', data: PM_RECON_DAILY.map(d => d.matched)}, {name: 'Unmatched', data: PM_RECON_DAILY.map(d => d.unmatched)}],
      value: num(sum(PM_RECON_DAILY, d => d.matched))}) +
    chartBox({title: 'Reconciliation by source', sub: 'Every run in the period', type: 'bar', h: 190,
      cats: PM_RECON.map(r => r.source.replace(' statement', '')),
      series: [{name: 'Matched', data: PM_RECON.map(r => r.matched)}, {name: 'Missing', data: PM_RECON.map(r => r.missing)}],
      value: shortMoney(sum(PM_RECON, r => r.difference))});

  el('recCount').textContent = PM_RECON.length + ' runs';
  renderTable('recBody', [
    {k: 'id', label: 'Run'},
    {k: 'when', label: 'When', html: v => esc(String(v).slice(0, 16))},
    {k: 'source', label: 'Source'},
    {k: 'lines', label: 'Lines', num: true},
    {k: 'matched', label: 'Matched', num: true},
    {k: 'missing', label: 'Missing', num: true},
    {k: 'duplicates', label: 'Duplicates', num: true},
    {k: 'difference', label: 'Difference', num: true, html: v => v ? pmMoney(v) : '—'},
    {k: 'status', label: 'State', html: v => okBadge(v === 'Matched' ? 'Matched' : v === 'Approved' ? 'Approved' : 'Open')}
  ], PM_RECON, {sort: 'when', pageSize: 8});

  el('gapPill').className = 'badge ' + (gaps.length ? 'b-crit' : 'b-ok');
  el('gapPill').textContent = gaps.length + ' items';
  renderTable('gapBody', [
    {k: 'id', label: 'Run'},
    {k: 'kind', label: 'Kind'},
    {k: 'source', label: 'Source'},
    {k: 'detail', label: 'What was found'},
    {k: 'amount', label: 'Value', num: true, html: v => v ? pmMoney(Math.abs(v)) : '—'},
    {k: 'status', label: 'State', html: v => okBadge(v === 'Held' ? 'Pending' : v === 'Open' ? 'Open' : 'Adjustment')}
  ], gaps, {sort: 'kind', pageSize: 6, onRow: false});

  el('unmPill').className = 'badge ' + (unmatched.length ? 'b-warn' : 'b-ok');
  el('unmPill').textContent = unmatched.length + ' waiting';
  renderTable('unmBody', [
    {k: 'receipt', label: 'Receipt'},
    {k: 'when', label: 'When', html: v => esc(String(v).slice(0, 16))},
    {k: 'method', label: 'Method'},
    {k: 'providerRef', label: 'Provider ref'},
    {k: 'amount', label: 'Amount', num: true, html: v => pmMoney(v)},
    {k: 'reconciled', label: 'State', html: v => okBadge(v === 'Duplicate' ? 'Duplicate' : 'Unmatched')}
  ], unmatched, {sort: 'when', pageSize: 6});

  el('adjPill').textContent = PM_ADJUST.length + ' adjustments';
  renderTable('adjBody', [
    {k: 'id', label: 'Adjustment'},
    {k: 'kind', label: 'Kind'},
    {k: 'amount', label: 'Value', num: true, html: v => v ? pmMoney(v) : '—'},
    {k: 'reason', label: 'Reason'},
    {k: 'status', label: 'State', html: v => okBadge(v === 'Approved' ? 'Approved' : 'Pending')}
  ], PM_ADJUST, {sort: 'when', pageSize: 4, onRow: false});

  const approved = PM_RECON.filter(r => r.status === 'Approved').length;
  el('apprRecPill').className = 'badge ' + (approved === PM_RECON.length ? 'b-ok' : 'b-warn');
  el('apprRecPill').textContent = approved + ' of ' + PM_RECON.length + ' signed off';
  put('apprRecBox',
    PM_RECON.slice(0, 4).map(r => {
      const done = r.status === 'Approved' || r.status === 'Matched';
      return `<div class="checkrow">
        <div class="ck ${done ? 'pass' : 'warn'}">${done ? '✓' : '·'}</div>
        <div style="flex:1"><div style="font-size:10.5px;font-weight:800">${esc(r.id)} · ${esc(r.source)}</div>
          <div class="qhint">${r.matched}/${r.lines} matched · ${r.status}</div></div>
        <button class="btn btn-ghost" data-recappr="${esc(r.id)}">${done ? 'Reopen' : 'Approve'}</button></div>`;
    }).join(''));
  renderTable('dailyBody', [
    {k: 'day', label: 'Day'},
    {k: 'matched', label: 'Matched', num: true},
    {k: 'unmatched', label: 'Unmatched', num: true},
    {k: 'variance', label: 'Variance', num: true, html: v => v ? pmMoney(v) : '—'}
  ], PM_RECON_DAILY, {sort: 'day', pageSize: 4, onRow: false});

  const audit = [];
  PM_RECON.forEach(r => audit.push({when: r.when, what: 'Reconciliation run ' + r.id, officer: r.owner,
    detail: r.source + ' · ' + r.matched + '/' + r.lines, status: r.status}));
  PM_ADJUST.forEach(a => audit.push({when: a.when, what: 'Adjustment ' + a.id, officer: a.by,
    detail: a.kind + ' · ' + pmMoney(a.amount), status: a.status}));
  audit.sort((a, b) => String(b.when).localeCompare(String(a.when)));
  el('recAuditPill').textContent = audit.length + ' entries';
  renderTable('recAuditBody', [
    {k: 'when', label: 'When', html: v => esc(String(v).slice(0, 16))},
    {k: 'what', label: 'Action'},
    {k: 'officer', label: 'Officer', html: v => esc(staffName(v))},
    {k: 'detail', label: 'Detail'},
    {k: 'status', label: 'State', html: v => okBadge(v)}
  ], audit, {sort: 'when', pageSize: 7, onRow: false});
}
function matchRecon(which){
  const map = {provider: 'Mobile money', bank: 'Bank', cash: 'Cash'};
  const lane = map[which] || 'Mobile money';
  const runs = PM_RECON.filter(r => r.lane === lane);
  runs.forEach(r => {
    r.matched = r.lines;
    r.missing = 0;
    r.duplicates = 0;
    r.difference = 0;
    r.status = 'Matched';
    r.when = TODAY + ' ' + new Date().toTimeString().slice(0, 5);
  });
  if(which === 'provider'){
    PM_TXNS.filter(t => t.lane === 'Mobile money' && t.status === 'Success').forEach(t => { t.reconciled = 'Matched'; });
    MM_RECON.forEach(r => { r.providerTxn = r.systemTxn; r.difference = 0; r.status = 'Matched'; });
  }
  if(which === 'bank'){
    PM_TXNS.filter(t => t.method === 'Bank transfer' && t.status === 'Success').forEach(t => { t.reconciled = 'Matched'; });
    PM_STATEMENTS.forEach(s => { s.matched = s.lines; s.status = 'Matched'; });
  }
  if(which === 'cash'){
    PM_TXNS.filter(t => t.method === 'Cash' && t.status === 'Success').forEach(t => { t.reconciled = 'Matched'; });
    CASH_COLLECTIONS.forEach(c => { if(c.status === 'Verified') c.status = 'Handed over'; });
  }
  pmLogChange('Reconciliation', 'Matched ' + lane.toLowerCase() + ' transactions', runs.length + ' runs open',
    'every line matched');
  renderRecon(); renderOverview(); renderTransactions(); renderChanges(); renderStats();
  if(el('recMsg')) el('recMsg').textContent = lane + ' matched at ' + new Date().toTimeString().slice(0, 5) +
    ' — ' + runs.length + ' run' + (runs.length === 1 ? '' : 's') + ' closed, no value difference left.';
  toast(lane + ' reconciled');
}
function addAdjustment(){
  const amount = Number(el('adjAmount').value) || 0;
  const reason = (el('adjReason').value || '').trim();
  if(!reason) return toast('Say why the adjustment is needed', 'warn');
  if(!amount) return toast('Give the adjustment a value', 'warn');
  const run = PM_RECON.find(r => r.status !== 'Approved') || PM_RECON[0];
  PM_ADJUST.unshift({id: 'ADJ-' + (441 + PM_ADJUST.length), when: TODAY + ' ' + new Date().toTimeString().slice(0, 5),
    recon: run.id, kind: el('adjKind').value, amount, reason, by: 'STF-009', approver: 'STF-001', status: 'Pending'});
  el('adjAmount').value = ''; el('adjReason').value = '';
  pmLogChange('Reconciliation', 'Adjustment recorded', run.id, pmMoney(amount) + ' · ' + reason);
  renderRecon(); renderChanges();
  if(el('recMsg')) el('recMsg').textContent = 'Adjustment of ' + pmMoney(amount) + ' recorded against ' + run.id + ' — waiting for a second signature.';
  toast('Adjustment recorded');
}
function toggleReconApproval(id){
  const r = PM_RECON.find(x => x.id === id);
  if(!r) return;
  const was = r.status;
  r.status = was === 'Approved' ? 'Matched' : 'Approved';
  pmLogChange('Reconciliation', 'Sign-off ' + id, was, r.status);
  renderRecon(); renderChanges();
  toast(id + ' ' + r.status.toLowerCase());
}

/* ===================== 12 · PAYMENT FEES AND LIMITS ===================== */
function feeFor(methodName, amount){
  const f = PM_FEES.find(x => x.method === methodName) || {customerPct: 0, customerFlat: 0, companyPct: 0, companyFlat: 0};
  return Math.round(amount * f.customerPct / 100) + f.customerFlat;
}
function renderFees(){
  const charged = sum(PM_TXNS.filter(t => t.status === 'Success'), t => t.fee);
  el('feePill').className = 'badge b-gray';
  el('feePill').textContent = PM_FEES.length + ' methods';
  el('feeKpis').innerHTML = [
    ['Methods with a fee', num(PM_FEES.filter(f => f.customerPct || f.customerFlat || f.companyPct || f.companyFlat).length), 'of ' + PM_FEES.length + ' configured methods', ''],
    ['Customer-paid fees', pmMoney(charged), 'Charged on top of the payment', ''],
    ['Company-paid fees', pmMoney(sum(PM_TXNS.filter(t => t.status === 'Success' && t.feePayer === 'Company'), t => t.fee)), 'Absorbed by Golden', ''],
    ['Highest customer fee', (PM_FEES.slice().sort((a, b) => b.customerPct - a.customerPct)[0] || {}).method || '—', (PM_FEES.slice().sort((a, b) => b.customerPct - a.customerPct)[0] || {}).customerPct + '%', ''],
    ['Fee changes this period', num(PM_FEE_HISTORY.length), 'Each with an effective date', ''],
    ['Limits breached', num(PM_TXNS.filter(t => t.amount > (PM_METHOD_BY_CODE[t.code] || {max: 1e12}).max).length), 'Payments above the method ceiling', '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join('');

  el('feeCount').textContent = PM_FEES.length + ' rows';
  renderTable('feeBody', [
    {k: 'method', label: 'Method'},
    {k: 'customerPct', label: 'Customer %', num: true},
    {k: 'customerFlat', label: 'Customer flat', num: true, html: v => v ? pmMoney(v) : '—'},
    {k: 'companyPct', label: 'Company %', num: true},
    {k: 'companyFlat', label: 'Company flat', num: true, html: v => v ? pmMoney(v) : '—'},
    {k: 'min', label: 'Min', num: true, html: v => shortMoney(v)},
    {k: 'max', label: 'Max', num: true, html: v => shortMoney(v)},
    {k: 'daily', label: 'Daily ceiling', num: true, html: v => shortMoney(v)},
    {k: 'effective', label: 'Effective', html: v => fmtDate(v)}
  ], PM_FEES, {sort: 'method', dir: 'asc', pageSize: 7});

  el('payerPill').textContent = PM_METHODS.filter(m => m.feePayer === 'Customer').length + ' customer-paid';
  put('payerBox', PM_METHODS.filter(m => !m.archived).map(m => `<div class="checkrow">
      <div class="ck ${m.feePayer === 'Customer' ? 'pass' : 'warn'}">${m.feePayer === 'Customer' ? 'C' : 'G'}</div>
      <div style="flex:1"><div style="font-size:10.5px;font-weight:800">${esc(m.name)}</div>
        <div class="qhint">${m.feePct}%${m.feeFlat ? ' + ' + shortMoney(m.feeFlat) : ''} · ${esc(m.feePayer)} pays · a ${shortMoney(100000)} payment costs ${pmMoney(feeFor(m.name, 100000))}</div></div>
      <button class="btn btn-ghost" data-feePayer="${esc(m.code)}">Switch to ${m.feePayer === 'Customer' ? 'Golden' : 'Customer'}</button>
    </div>`).join(''));

  el('limitPill').textContent = PM_FEES.filter(f => f.providerLimit).length + ' ceilings';
  renderTable('limitBody', [
    {k: 'method', label: 'Method'},
    {k: 'providerLimit', label: 'Provider limit', num: true, html: v => shortMoney(v)},
    {k: 'daily', label: 'Our daily ceiling', num: true, html: v => shortMoney(v)},
    {k: 'max', label: 'Per payment', num: true, html: v => shortMoney(v)},
    {k: 'headroom', label: 'Headroom', num: true, html: (v, r) => shortMoney(Math.max(0, r.daily - r.max))}
  ], PM_FEES, {sort: 'daily', pageSize: 7, onRow: false});

  put('feeRuleBox',
    kvRow('Order of calculation', 'Percentage of the payment, then the flat amount') +
    kvRow('Rounded to', 'The nearest ' + PM_SET.currencySymbol + ' 1, never above the cap') +
    kvRow('Never charged on', 'A failed, cancelled or reversed payment') +
    kvRow('Refunded with the payment', 'Yes — a refund returns the fee in full') +
    kvRow('Shown to the customer', 'Before they confirm, with the total they will pay') +
    kvRow('Reconciled against', 'The provider statement, line by line'));

  el('feeHistPill').textContent = PM_FEE_HISTORY.length + ' changes';
  renderTable('feeHistBody', [
    {k: 'when', label: 'When', html: v => esc(String(v).slice(0, 16))},
    {k: 'method', label: 'Method'},
    {k: 'change', label: 'Change'},
    {k: 'from', label: 'Previous'},
    {k: 'to', label: 'Updated'},
    {k: 'by', label: 'By', html: v => esc(staffName(v))}
  ], PM_FEE_HISTORY, {sort: 'when', pageSize: 5, onRow: false});

  el('feeGrid').innerHTML =
    chartBox({title: 'Fees collected by method', sub: 'What the rails cost the customer', type: 'bar', h: 200,
      cats: PM_METHODS.filter(m => !m.archived).map(m => m.name.replace('Bank transfer — ', 'BT ')),
      series: [{name: 'Fees', data: PM_METHODS.filter(m => !m.archived).map(m => sum(PM_TXNS.filter(t => t.code === m.code && t.status === 'Success'), t => t.fee))}],
      value: pmMoney(charged)}) +
    chartBox({title: 'Who carries the fee', sub: 'Customer against company', type: 'donut', h: 200,
      cats: ['Customer', 'Company'],
      series: [{name: 'Value', data: [sum(PM_TXNS.filter(t => t.feePayer === 'Customer' && t.status === 'Success'), t => t.fee),
        sum(PM_TXNS.filter(t => t.feePayer === 'Company' && t.status === 'Success'), t => t.fee)]}],
      value: pmMoney(charged)});
}
function switchFeePayer(code){
  const m = PM_METHOD_BY_CODE[code];
  if(!m) return;
  const was = m.feePayer;
  m.feePayer = was === 'Customer' ? 'Company' : 'Customer';
  const f = PM_FEES.find(x => m.name.indexOf(x.method) === 0 || x.method.indexOf(m.name.split(' — ')[0]) === 0);
  if(f){
    if(m.feePayer === 'Customer'){ f.customerPct = m.feePct; f.customerFlat = m.feeFlat; f.companyPct = 0; f.companyFlat = 0; }
    else { f.companyPct = m.feePct; f.companyFlat = m.feeFlat; f.customerPct = 0; f.customerFlat = 0; }
  }
  PM_FEE_HISTORY.unshift({when: TODAY + ' ' + new Date().toTimeString().slice(0, 5), method: m.name,
    change: 'Who pays', from: was + ' paid', to: m.feePayer + ' paid', by: 'STF-009'});
  pmLogChange('Fees', 'Fee payer for ' + m.name, was, m.feePayer);
  renderFees(); renderMethods(); renderCustomer(); renderChanges();
  toast(m.feePayer + ' now pays the ' + m.name + ' fee');
}
function recalcFeeSummary(){
  renderFees();
  if(el('feePill')) el('feePill').textContent = 'Recalculated ' + new Date().toTimeString().slice(0, 5);
  pmLogChange('Fees', 'Fee summary recalculated', 'cached totals', 'live totals');
  renderChanges();
  toast('Fee summary recalculated from the register');
}

/* ===================== 13 · PAYMENT RECEIPTS AND STATEMENTS ===================== */
function renderReceipts(){
  const issued = PM_RECEIPTS;
  el('rcPill').className = 'badge b-gray';
  el('rcPill').textContent = issued.length + ' receipts';
  el('rcKpis').innerHTML = [
    ['Receipts issued', num(issued.length), 'Every successful payment', ''],
    ['Value receipted', shortMoney(sum(issued, r => r.amount)), 'Matched to the ledger', ''],
    ['Automatic numbering', PM_SET.receiptPrefix + '-' + pad(1, PM_SET.receiptDigits), 'Next ' + PM_SET.receiptPrefix + '-' + pad(issued.length + 1, PM_SET.receiptDigits), ''],
    ['Reissued', num(issued.filter(r => r.status === 'Reissued').length), 'Corrections on record', ''],
    ['Corrections', num(PM_RECEIPT_CORRECTIONS.length), 'Each with a reason', ''],
    ['Statements built', num(new Set(issued.map(r => r.cust)).size), 'One per customer', '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join('');

  el('rcCount').textContent = num(issued.length) + ' receipts';
  renderTable('rcBody', [
    {k: 'receipt', label: 'Receipt'},
    {k: 'when', label: 'When', html: v => esc(String(v).slice(0, 16))},
    {k: 'cust', label: 'Customer', html: v => esc(custName(v))},
    {k: 'loan', label: 'Loan'},
    {k: 'amount', label: 'Amount', num: true, html: v => pmMoney(v)},
    {k: 'method', label: 'Method'},
    {k: 'status', label: 'State', html: v => okBadge(v === 'Reissued' ? 'Issued' : v)},
    {k: 'act', label: '', html: (v, r) => `<button class="btn btn-ghost" data-rcopen="${esc(r.receipt)}">Open</button>`}
  ], issued, {sort: 'when', pageSize: 10});
  (STORE_ROWS['rcBody'] || []).forEach(r => { r._open = () => openReceipt(r.receipt); });

  pmFillSel('rcLoan', pmLoanOptions());
  if(el('rcAmount') && !el('rcAmount').value) el('rcAmount').value = 145000;
  if(el('rcPrefix')) el('rcPrefix').value = PM_SET.receiptPrefix;
  if(el('rcDigits')) el('rcDigits').value = PM_SET.receiptDigits;
  if(el('rcYear')) el('rcYear').value = PM_SET.receiptYear ? 'Yes' : 'No';

  if(el('rcMsg') && !el('rcMsg').textContent)
    el('rcMsg').textContent = 'Numbering ' + PM_SET.receiptPrefix + '-' + pad(1, PM_SET.receiptDigits) +
      ' · next ' + PM_SET.receiptPrefix + '-' + pad(issued.length + 1, PM_SET.receiptDigits) +
      ' · ' + (PM_SET.receiptYear ? 'year included' : 'no year') + '.';
  el('rcVerPill').className = 'badge b-gray';
  el('rcVerPill').textContent = 'Ready to check';
  put('rcVerifyBox', '<div class="qhint">Enter a receipt number to see whether the ledger holds it, who issued it and what it paid.</div>');

  pmFillSel('rcCust', pmCustOptions());
  put('rcStmtBox', '<div class="qhint">Pick a customer and build the statement — it lists every receipt, the loan and the running balance.</div>');

  el('rcCorrPill').textContent = PM_RECEIPT_CORRECTIONS.length + ' corrections';
  renderTable('rcCorrBody', [
    {k: 'receipt', label: 'Receipt'},
    {k: 'field', label: 'Field'},
    {k: 'from', label: 'Was'},
    {k: 'to', label: 'Now'},
    {k: 'by', label: 'By', html: v => esc(staffName(v))},
    {k: 'status', label: 'State', html: v => okBadge(v)}
  ], PM_RECEIPT_CORRECTIONS, {sort: 'when', pageSize: 4, onRow: false});
  renderTable('rcReissueBody', [
    {k: 'receipt', label: 'Receipt'},
    {k: 'when', label: 'Reissued', html: v => esc(String(v).slice(0, 16))},
    {k: 'amount', label: 'Amount', num: true, html: v => pmMoney(v)},
    {k: 'verified', label: 'State', html: v => okBadge(v === 'Reissued' ? 'Issued' : v)}
  ], issued.filter(r => r.status === 'Reissued' || r.verified === 'Reissued'), {sort: 'when', pageSize: 3, onRow: false});

  el('rcGrid').innerHTML =
    chartBox({title: 'Receipts by method', sub: 'How many receipts each rail produced', type: 'bar', h: 200,
      cats: ['Airtel Money', 'TNM Mpamba', 'Bank transfer', 'Cash'],
      series: [{name: 'Receipts', data: ['Airtel Money', 'TNM Mpamba', 'Bank transfer', 'Cash'].map(m => issued.filter(r => r.method === m).length)}],
      value: num(issued.length)}) +
    chartBox({title: 'Value receipted', sub: 'Money on a receipt, by method', type: 'donut', h: 200,
      cats: ['Airtel Money', 'TNM Mpamba', 'Bank transfer', 'Cash'],
      series: [{name: 'Value', data: ['Airtel Money', 'TNM Mpamba', 'Bank transfer', 'Cash'].map(m => sum(issued.filter(r => r.method === m), r => r.amount))}],
      value: shortMoney(sum(issued, r => r.amount))});
}
function openReceipt(no){
  const r = PM_RECEIPTS.find(x => x.receipt === no);
  if(!r) return toast('That receipt is not on the register', 'warn');
  const t = PM_TXNS.find(x => x.receipt === no) || {cust: r.cust, loan: r.loan, amount: r.amount, method: r.method,
    provider: '—', providerRef: '—', when: r.when, fee: 0, feePayer: 'Company', status: 'Success', receipt: r.receipt};
  openModal('Receipt ' + r.receipt, pmMoney(r.amount) + ' · ' + r.method + ' · ' + r.status,
    receiptHtml(t, r.status === 'Reissued' ? 'Reissued copy' : 'Customer copy'),
    [{label: 'Print', cls: 'btn-gold', act: () => printReceipt(r.receipt)},
     {label: 'Verify', act: () => { closeModal(); goto('s13'); if(el('rcVerifyNum')){ el('rcVerifyNum').value = r.receipt; verifyReceipt(); } }},
     {label: 'Close', act: 'close'}]);
}
function printReceipt(no){
  const r = PM_RECEIPTS.find(x => x.receipt === no) || PM_RECEIPTS[0];
  if(!r) return;
  const t = PM_TXNS.find(x => x.receipt === no) || {cust: r.cust, loan: r.loan, amount: r.amount, method: r.method,
    provider: '—', providerRef: '—', when: r.when, fee: 0, feePayer: 'Company', status: 'Success', receipt: r.receipt};
  doPrint('Receipt ' + r.receipt, brandHtml('Payment receipt', r.receipt) + receiptHtml(t, 'Printed copy'));
  logExport('Receipt ' + r.receipt, 'PDF', 1);
  toast('Receipt sent to the print dialog');
}
function generateReceipt(){
  const loan = LOAN_BY_REF[el('rcLoan').value];
  const amount = Number(el('rcAmount').value) || 0;
  if(!loan) return toast('Pick a loan first', 'warn');
  if(amount < 500) return toast('A receipt needs at least MK 500', 'warn');
  const receipt = PM_SET.receiptPrefix + '-' + pad(PM_RECEIPTS.length + 1, PM_SET.receiptDigits);
  const when = TODAY + ' ' + new Date().toTimeString().slice(0, 5);
  PM_RECEIPTS.unshift({receipt, when, cust: loan.cust, loan: loan.ref, amount, method: 'Cash', officer: 'STF-009',
    status: 'Issued', issued: 'Manual', verified: 'Verified', lane: 'Receipts', severity: 'Low',
    owner: 'STF-009', region: loan.region, due: addMonths(TODAY, 1)});
  PM_TXNS.unshift({id: 'PMT-' + (8100 + PM_TXNS.length), when, receipt, loan: loan.ref, cust: loan.cust, amount,
    method: 'Cash', code: 'CASH-BR', provider: 'Branch counter', providerRef: receipt, status: 'Success',
    officer: 'STF-009', branch: loan.region, fee: 0, feePayer: 'Company', verified: 'Verified',
    reconciled: 'Unmatched', error: '', lane: 'Cash', severity: 'Low', owner: 'STF-009', region: loan.region});
  pmLogChange('Receipts', 'Receipt issued', 'next number ' + pad(PM_RECEIPTS.length, PM_SET.receiptDigits), receipt);
  renderReceipts(); renderTransactions(); renderOverview(); renderChanges(); renderStats();
  if(el('rcMsg')) el('rcMsg').textContent = receipt + ' issued for ' + pmMoney(amount) + ' to ' + custName(loan.cust) +
    ' on ' + loan.ref + '. The next number will be ' + PM_SET.receiptPrefix + '-' + pad(PM_RECEIPTS.length + 1, PM_SET.receiptDigits) + '.';
  toast('Receipt ' + receipt + ' issued');
}
function saveReceiptNumbering(){
  const prefix = (el('rcPrefix').value || 'RCP').trim();
  const digits = clamp(Number(el('rcDigits').value) || 5, 3, 8);
  const year = el('rcYear').value === 'Yes';
  const before = PM_SET.receiptPrefix + '-' + pad(1, PM_SET.receiptDigits);
  PM_SET.receiptPrefix = prefix;
  PM_SET.receiptDigits = digits;
  PM_SET.receiptYear = year;
  pmLogChange('Reference', 'Receipt numbering', before, prefix + '-' + pad(1, digits) + (year ? ' · year included' : ''));
  renderReceipts(); renderSettings(); renderChanges();
  if(el('rcMsg')) el('rcMsg').textContent = 'Numbering saved — the next receipt will read ' +
    prefix + '-' + pad(PM_RECEIPTS.length + 1, digits) + (year ? ' with the year' : '') + '.';
  toast('Receipt numbering saved');
}
function verifyReceipt(){
  const no = (el('rcVerifyNum').value || '').trim().toUpperCase();
  if(!no) return toast('Enter a receipt number', 'warn');
  const r = PM_RECEIPTS.find(x => x.receipt.toUpperCase() === no) || PM_TXNS.find(x => x.receipt.toUpperCase() === no);
  if(!r){
    el('rcVerPill').className = 'badge b-crit';
    el('rcVerPill').textContent = 'Not found';
    put('rcVerifyBox', `<div class="note"><div>${esc(no)} is not on the payment ledger. Do not accept it —
      ask the customer for the provider message on the handset.</div></div>`);
    return toast('Receipt ' + no + ' is not on the ledger', 'err');
  }
  const t = PM_TXNS.find(x => x.receipt === no) || r;
  el('rcVerPill').className = 'badge b-ok';
  el('rcVerPill').textContent = 'Verified';
  put('rcVerifyBox', `<div class="note gold"><div>This receipt is genuine — issued ${esc(String(r.when).slice(0, 16))}
      for ${pmMoney(r.amount)} on ${esc(r.loan || t.loan)}.</div></div>
    <div class="pfields" style="grid-template-columns:1fr 1fr;margin-top:8px">
      ${field('Receipt', esc(no))}
      ${field('Customer', esc(custName(r.cust)))}
      ${field('Loan', esc(r.loan || t.loan))}
      ${field('Amount', pmMoney(r.amount))}
      ${field('Method', esc(r.method))}
      ${field('State', okBadge(t.status || 'Success'))}
    </div>`);
  toast('Receipt ' + no + ' verified');
}
function buildStatement(){
  const cust = CUST_BY_ID[el('rcCust').value];
  if(!cust) return toast('Pick a customer', 'warn');
  const rows = PM_RECEIPTS.filter(r => r.cust === cust.id).slice(0, 24);
  const total = sum(rows, r => r.amount);
  put('rcStmtBox', `<div class="note gold"><div>${esc(cust.name)} · ${esc(cust.id)} — ${rows.length} receipt${rows.length === 1 ? '' : 's'},
      ${pmMoney(total)} paid.</div></div>
    <div class="tblwrap" style="max-height:220px;margin-top:8px"><table class="tbl2 dense">
      <thead><tr><th>Receipt</th><th>When</th><th>Loan</th><th class="num">Amount</th><th>Method</th></tr></thead>
      <tbody>${rows.map(r => `<tr><td>${esc(r.receipt)}</td><td>${esc(String(r.when).slice(0, 10))}</td>
        <td>${esc(r.loan)}</td><td class="num">${pmMoney(r.amount)}</td><td>${esc(r.method)}</td></tr>`).join('')}</tbody>
    </table></div>
    <div class="form-actions"><button class="btn btn-ghost" data-stmtPrint="${esc(cust.id)}">Print the statement</button>
      <button class="btn btn-ghost" data-stmtCsv="${esc(cust.id)}">Download CSV</button></div>`);
  toast('Statement built for ' + cust.name);
}
function printStatement(custId){
  const cust = CUST_BY_ID[custId];
  const rows = PM_RECEIPTS.filter(r => r.cust === custId);
  const cols = [{label: 'Receipt', num: false}, {label: 'When', num: false}, {label: 'Loan', num: false},
    {label: 'Amount', num: true}, {label: 'Method', num: false}, {label: 'State', num: false}];
  printTable('Payment statement · ' + cust.name, cols,
    rows.map(r => [r.receipt, String(r.when).slice(0, 10), r.loan, r.amount, r.method, r.status]));
  logExport('Statement · ' + cust.name, 'PDF', rows.length);
}
function downloadStatement(custId){
  const cust = CUST_BY_ID[custId];
  const rows = PM_RECEIPTS.filter(r => r.cust === custId);
  const lines = [['Receipt', 'When', 'Loan', 'Amount', 'Method', 'State']].concat(
    rows.map(r => [r.receipt, String(r.when).slice(0, 10), r.loan, r.amount, r.method, r.status]));
  downloadFile('statement-' + custId + '-' + TODAY.replace(/-/g, '') + '.csv', 'text/csv', toCsv(lines));
  logExport('Statement · ' + cust.name, 'CSV', rows.length);
  renderReceipts();
}
</script>
