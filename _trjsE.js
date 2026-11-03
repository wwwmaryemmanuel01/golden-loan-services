<script>
/* ============================================================
   TRANSFERS MANAGEMENT & CONNECTIONS (5/8)
   Sections 5–8: loan-related transfers, external bank transfers,
   mobile money payouts and the verification queue.
   ============================================================ */

/* ===================== 5 · LOAN-RELATED TRANSFERS ===================== */
function trLoanOf(id){ return LOAN_BY_REF[id] || LOANS[0]; }
function renderLoan(){
  const rows = TR_TXN.filter(t => t.type === 'Loan' && trPass(t));
  const s = trS();
  const disb = rows.filter(t => t.category === 'Loan disbursement');
  const repay = rows.filter(t => t.category === 'Loan repayment');
  if(el('lnPill')){ el('lnPill').className = 'badge b-gray'; el('lnPill').textContent = num(rows.length) + ' loan movements'; }
  put('lnKpis', [
    ['Loan transfers', num(rows.length), 'Disbursements and repayments', ''],
    ['Value applied', trM(sum(rows.filter(t => t.status === 'Completed'), t => t.amount)), 'Posted to a loan balance', ''],
    ['Disbursements', num(disb.length), trM(sum(disb, t => t.amount)), ''],
    ['Repayments', num(repay.length), trM(sum(repay, t => t.amount)), ''],
    ['Loans reached', num(new Set(rows.map(t => t.dest)).size), 'Facilities with a movement', ''],
    ['Active loans', num(LOANS.filter(l => l.status === 'Active').length), 'Facilities still running', ''],
    ['In arrears', num(LOANS.filter(l => l.arrears > 0).length), trM(sum(LOANS.filter(l => l.arrears > 0), l => l.arrears)) + ' overdue', 'red'],
    ['Unauthorised edits', '0', 'Balance changes only happen through a posted transfer', '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join(''));

  const active = LOANS.filter(l => l.status !== 'Written off').slice(0, 60);
  trFillSel('lnLoan', active.map(l => [l.ref, l.ref + ' · ' + custName(l.cust) + ' · ' + trM(l.outstanding) + ' outstanding']));
  const loan = trLoanOf(el('lnLoan') ? el('lnLoan').value : '');
  if(el('lnLoan') && !el('lnLoan').value) el('lnLoan').value = active[0] ? active[0].ref : '';
  const accts = TR_ACCOUNTS.filter(a => a.cust === loan.cust && a.eligible);
  trFillSel('lnSource', (accts.length ? accts : TR_ACCOUNTS.filter(a => a.cust === loan.cust))
    .map(a => [a.id, a.id + ' · ' + a.type + ' · ' + trM(a.available)]));
  const src = TR_ACC_BY_ID[el('lnSource') ? el('lnSource').value : ''] || accts[0] || TR_ACCOUNTS[0];
  const kind = el('lnType') ? el('lnType').value : 'Loan repayment';
  const amount = Number(el('lnAmount') ? el('lnAmount').value : 0) || 0;
  const repayment = kind === 'Loan repayment';

  if(el('lnSchedPill')) el('lnSchedPill').textContent = loan.ref + ' · ' + loan.status;
  put('lnOwnBox', kvRow('Loan', loan.ref + ' · ' + prodName(loan.product))
    + kvRow('Loan owner', custName(loan.cust) + ' · ' + loan.cust)
    + kvRow('Source account owner', custName(src.cust) + ' · ' + src.cust)
    + kvRow('Ownership', loan.cust === src.cust ? okb('Verified') : badge('Account is not the borrower’s', 'b-crit'))
    + kvRow('Loan status', okb(loan.status)));

  const checks = [
    ['The loan belongs to the customer', loan.cust === src.cust, loan.cust === src.cust ? 'Same customer' : 'Different customer'],
    ['The loan is not written off', loan.status !== 'Written off', loan.status],
    ['The source account is open', src.status === 'Active', src.status],
    ['The source account is eligible', !!src.eligible, src.eligible ? 'Eligible' : 'Not eligible'],
    ['Funds cover the amount', repayment ? amount <= src.available : amount <= loan.outstanding, repayment ? trM(src.available) + ' available' : trM(loan.outstanding) + ' outstanding'],
    ['Inside the loan transfer maximum', amount <= TR_SET.maxInternal, trM(TR_SET.maxInternal)]
  ];
  put('lnChecks', checks.map(([l, ok, d]) => `<div class="checkrow"><div class="ck ${ok ? 'pass' : 'crit'}">${ok ? '✓' : '!'}</div>
      <div style="flex:1"><div style="font-size:10.5px;font-weight:800">${esc(l)}</div><div class="qhint">${esc(d)}</div></div>
      <div>${okb(ok ? 'Pass' : 'Failed')}</div></div>`).join(''));

  put('lnBalBox', strip([
    ['Outstanding', trM(loan.outstanding)],
    ['Instalment', trM(loan.instalment)],
    ['Paid to date', trM(loan.collected)],
    ['Arrears', trM(loan.arrears)],
    ['Unpaid instalments', num(loan.unpaidInstalments)]
  ]) + `<div class="qhint" style="margin-top:6px">${repayment
    ? (amount > 0 && amount <= loan.outstanding ? 'After posting, the outstanding balance becomes ' + trM(loan.outstanding - amount) + '.'
      : 'Enter an amount that the outstanding balance can absorb.')
    : 'A disbursement is only allowed on a loan that is approved and not yet closed.'}</div>`);
  if(el('lnMsg') && !String(el('lnMsg').textContent || '').trim())
    el('lnMsg').textContent = 'Choose the movement, the loan and the account, then post the transfer.';

  const pays = (PAYS_BY_LOAN[loan.ref] || []).slice(0, 8);
  renderTable('lnPayBody', [
    {k: 'ref', label: 'Payment'},
    {k: 'date', label: 'Paid', html: v => esc(fmtDate(v))},
    {k: 'due', label: 'Due', html: v => esc(fmtDate(v))},
    {k: 'amount', label: 'Amount', num: true, html: v => esc(trM(v))},
    {k: 'status', label: 'State', html: v => okb(v)},
    {k: 'timing', label: 'Timing', html: v => badge(v, v === 'On time' ? 'b-ok' : 'b-warn')}
  ], pays, {sort: 'date', pageSize: 6});

  const guards = [
    ['A transfer may not write the loan balance directly', 'Balance moves only through post_transfer', 'b-ok'],
    ['Only a verified transfer can be applied', 'Verification and approval must both be signed', 'b-ok'],
    ['The borrower must own the source account', loan.cust === src.cust ? 'Ownership agrees' : 'Ownership fails', loan.cust === src.cust ? 'b-ok' : 'b-crit'],
    ['A written-off loan refuses every repayment', loan.status === 'Written off' ? 'This loan is written off' : 'The loan accepts movements', loan.status === 'Written off' ? 'b-crit' : 'b-ok'],
    ['Every application leaves an audit row', 'Written by apply_loan_transfer', 'b-ok']
  ];
  if(el('lnGuardPill')){ el('lnGuardPill').className = 'badge ' + (checks.every(c => c[1]) ? 'b-ok' : 'b-crit');
    el('lnGuardPill').textContent = checks.every(c => c[1]) ? 'Guarded' : 'Blocked'; }
  put('lnGuard', guards.map(([l, d, tone]) => `<div class="risk"><div><div class="rn">${esc(l)}</div>
      <div class="rs">${esc(d)}</div></div><div class="rv">${badge(tone === 'b-ok' ? 'Enforced' : 'Failing', tone)}</div></div>`).join(''));

  const sorted = rows.slice().sort((a, b) => String(b.when).localeCompare(String(a.when)));
  sorted.forEach(t => { t._open = () => { TR_SEL.txn = t.id; openTransfer(t); }; });
  renderTable('lnHistBody', [
    {k: 'when', label: 'Date', html: v => esc(trWhen(v))},
    {k: 'id', label: 'Reference'},
    {k: 'category', label: 'Movement', html: v => badge(v, v === 'Loan repayment' ? 'b-ok' : 'b-warn')},
    {k: 'dest', label: 'Loan'},
    {k: 'amount', label: 'Amount', num: true, html: v => esc(trM(v))},
    {k: 'status', label: 'Status', html: v => okb(v)}
  ], sorted, {sort: 'when', pageSize: 6});
}

/* ===================== 6 · EXTERNAL BANK TRANSFERS ===================== */
function renderBank(){
  const rows = TR_TXN.filter(t => t.type === 'Bank' && trPass(t));
  const done = rows.filter(t => t.status === 'Completed');
  const failed = rows.filter(t => ['Failed', 'Rejected', 'Reversed'].includes(t.status));
  if(el('bkPill')){ el('bkPill').className = 'badge b-warn'; el('bkPill').textContent = num(rows.length) + ' bank transfers'; }
  put('bkKpis', [
    ['Bank transfers', num(rows.length), 'To an external bank', ''],
    ['Value sent', trM(sum(done, t => t.amount)), 'Completed payouts', ''],
    ['Banks used', num(new Set(rows.map(t => String(t.dest).split(' · ')[0])).size), 'Across the register', ''],
    ['Completed', num(done.length), 'The bank confirmed', ''],
    ['Awaiting confirmation', num(rows.filter(t => t.status === 'Processing').length), 'Sent, not yet acknowledged', ''],
    ['Failed', num(failed.length), 'Refused or reversed', failed.length ? 'red' : ''],
    ['Bank charges', trM(sum(done, t => t.fee)), 'Charged per payout', ''],
    ['Average payout', trM(done.length ? sum(done, t => t.amount) / done.length : 0), 'Across every bank', '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join(''));

  trFillSel('bkSource', trAcctOptions());
  trFillSel('bkBank', TR_BANKS.map(b => [b, b]));
  const conn = TR_CONNS.find(c => c.rail === 'Bank') || TR_CONNS[0];
  const src = TR_ACC_BY_ID[el('bkSource') ? el('bkSource').value : ''] || TR_ACCOUNTS[0];
  const amount = Number(el('bkAmount') ? el('bkAmount').value : 0) || 0;
  const fee = trFeeFor('Bank', amount);
  const lim = TR_LIMITS.find(l => l.method === 'Bank transfer') || TR_LIMITS[0];
  if(el('bkProvPill')) el('bkProvPill').textContent = conn.provider + ' · ' + conn.status;
  put('bkLimitBox', `<div class="minihead">Limits for this payout</div>`
    + kvRow('Minimum', trM(lim.min)) + kvRow('Maximum', trM(lim.max))
    + kvRow('Daily limit', trM(lim.daily)) + kvRow('Provider ceiling', trM(lim.providerCeiling))
    + kvRow('Amount requested', amount ? trM(amount) : 'Not set')
    + kvRow('Fee', trM(fee) + ' · paid by ' + ((TR_FEES.find(f => f.method === 'Bank transfer') || {}).payer || 'Company'))
    + kvRow('Inside the limit', amount > 0 && amount <= lim.max && amount >= lim.min ? okb('Within limit') : badge('Outside the limit', 'b-warn'))
    + kvRow('Source available', trM(src.available)));
  put('bkConnBox', `<div class="minihead">The line the payout travels over</div>`
    + kvRow('Provider', conn.provider) + kvRow('Status', okb(conn.status))
    + kvRow('Latency', conn.latency + ' ms') + kvRow('Uptime', conn.uptime + '%')
    + kvRow('Webhook', okb('Signature checked'))
    + kvRow('Credential', conn.credential)
    + kvRow('Last check', trWhen(conn.lastCheck)));

  if(el('bkTrackPill')) el('bkTrackPill').textContent = num(rows.length) + ' sent';
  const track = rows.slice().sort((a, b) => String(b.when).localeCompare(String(a.when)));
  track.forEach(t => { t._open = () => { TR_SEL.txn = t.id; openTransfer(t); }; });
  renderTable('bkTrackBody', [
    {k: 'id', label: 'Transfer'},
    {k: 'when', label: 'Sent', html: v => esc(trWhen(v))},
    {k: 'bank', label: 'Bank', html: (v, r) => esc(String(r.dest).split(' · ')[0])},
    {k: 'destName', label: 'Beneficiary'},
    {k: 'ref', label: 'Provider reference'},
    {k: 'amount', label: 'Amount', num: true, html: v => esc(trM(v))},
    {k: 'status', label: 'Confirmation', html: v => okb(v === 'Completed' ? 'Cleared' : v === 'Processing' ? 'Awaiting' : v)}
  ], track, {sort: 'when', pageSize: 7});

  const fails = TR_FAILED.filter(f => f.method === 'Bank transfer');
  if(el('bkFailPill')) el('bkFailPill').textContent = num(fails.length) + ' failed';
  renderTable('bkFailBody', [
    {k: 'ref', label: 'Reference'},
    {k: 'cust', label: 'Customer', html: v => esc(custName(v))},
    {k: 'amount', label: 'Amount', num: true, html: v => esc(trM(v))},
    {k: 'reason', label: 'Why it failed'},
    {k: 'retryable', label: 'Retry', html: v => badge(v, /^Yes/.test(v) ? 'b-ok' : 'b-warn')}
  ], fails, {sort: 'amount', pageSize: 5});
  if(el('bkMsg') && !String(el('bkMsg').textContent || '').trim())
    el('bkMsg').textContent = 'Enter the beneficiary, verify them against the bank record, then submit the payout.';
}

/* ===================== 7 · MOBILE MONEY TRANSFERS ===================== */
function renderMobile(){
  const rows = TR_TXN.filter(t => t.type === 'Mobile' && trPass(t));
  const done = rows.filter(t => t.status === 'Completed');
  const provider = el('mmProvider') ? el('mmProvider').value : 'Airtel Money';
  trFillSel('mmSource', trAcctOptions());
  const src = TR_ACC_BY_ID[el('mmSource') ? el('mmSource').value : ''] || TR_ACCOUNTS[0];
  const amount = Number(el('mmAmount') ? el('mmAmount').value : 0) || 0;
  if(el('mmPill')){ el('mmPill').className = 'badge b-warn'; el('mmPill').textContent = num(rows.length) + ' wallet payouts'; }
  put('mmKpis', [
    ['Wallet transfers', num(rows.length), 'Airtel Money and TNM Mpamba', ''],
    ['Value sent', trM(sum(done, t => t.amount)), 'Completed payouts', ''],
    ['Airtel Money', num(rows.filter(t => t.method === 'Airtel Money').length), 'On the Airtel rail', ''],
    ['TNM Mpamba', num(rows.filter(t => t.method === 'TNM Mpamba').length), 'On the Mpamba rail', ''],
    ['Completed', num(done.length), 'The wallet acknowledged it', ''],
    ['Failed or pending', num(rows.filter(t => ['Failed', 'Processing'].includes(t.status)).length), 'Needs a look', ''],
    ['Fees', trM(sum(done, t => t.fee)), 'Charged on the payout', ''],
    ['Average payout', trM(done.length ? sum(done, t => t.amount) / done.length : 0), 'Across both networks', '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join(''));

  const conn = TR_CONNS.filter(c => c.rail === 'Mobile money').find(c => c.name === provider) || TR_CONNS[3];
  const lim = TR_LIMITS.find(l => l.method === provider) || TR_LIMITS[4];
  const fee = trFeeFor(provider, amount);
  if(el('mmProvPill')) el('mmProvPill').textContent = provider + ' · ' + conn.status;
  put('mmLimitBox', `<div class="minihead">${esc(provider)} limits</div>`
    + kvRow('Minimum', trM(lim.min)) + kvRow('Maximum', trM(lim.max))
    + kvRow('Daily limit', trM(lim.daily)) + kvRow('Provider ceiling', trM(lim.providerCeiling))
    + kvRow('Fee', trM(fee)) + kvRow('Amount requested', amount ? trM(amount) : 'Not set')
    + kvRow('Inside the limit', amount > 0 && amount <= lim.max && amount >= lim.min ? okb('Within limit') : badge('Outside the limit', 'b-warn'))
    + kvRow('Source available', trM(src.available)));
  put('mmApiBox', `<div class="minihead">Provider API behind the payout</div>`
    + kvRow('Provider', conn.provider) + kvRow('Status', okb(conn.status))
    + kvRow('Latency', conn.latency + ' ms') + kvRow('Uptime', conn.uptime + '%')
    + kvRow('Webhook', conn.webhook) + kvRow('Signature', conn.signature)
    + kvRow('Credential', conn.credential)
    + `<div class="qhint" style="margin-top:6px">A wallet payout only counts as complete when the provider returns its own reference — a timeout is never treated as a success.</div>`);

  if(el('mmStatusPill')) el('mmStatusPill').textContent = num(rows.length) + ' references';
  const sorted = rows.slice().sort((a, b) => String(b.when).localeCompare(String(a.when)));
  sorted.forEach(t => { t._open = () => { TR_SEL.txn = t.id; openTransfer(t); }; });
  renderTable('mmStatusBody', [
    {k: 'id', label: 'Transfer'},
    {k: 'when', label: 'Sent', html: v => esc(trWhen(v))},
    {k: 'method', label: 'Network'},
    {k: 'dest', label: 'Wallet'},
    {k: 'destName', label: 'Recipient', html: v => esc(String(v || '').slice(0, 20))},
    {k: 'ref', label: 'Provider reference'},
    {k: 'amount', label: 'Amount', num: true, html: v => esc(trM(v))},
    {k: 'status', label: 'Status', html: v => okb(v)}
  ], sorted, {sort: 'when', pageSize: 6});

  const stuck = rows.filter(t => ['Failed', 'Processing'].includes(t.status));
  if(el('mmFailPill')) el('mmFailPill').textContent = num(stuck.length) + ' stuck';
  renderTable('mmFailBody', [
    {k: 'id', label: 'Transfer'},
    {k: 'cust', label: 'Customer', html: v => esc(custName(v))},
    {k: 'method', label: 'Network'},
    {k: 'amount', label: 'Amount', num: true, html: v => esc(trM(v))},
    {k: 'status', label: 'State', html: v => okb(v)},
    {k: 'stage', label: 'Where it stopped', html: v => esc(String(v).slice(0, 30))}
  ], stuck, {sort: 'amount', pageSize: 5});

  if(el('mmHistPill')) el('mmHistPill').textContent = num(rows.length) + ' payouts';
  renderTable('mmHistBody', [
    {k: 'when', label: 'Date', html: v => esc(trWhen(v))},
    {k: 'id', label: 'Transfer'},
    {k: 'cust', label: 'Customer', html: v => esc(custName(v))},
    {k: 'dest', label: 'Wallet'},
    {k: 'amount', label: 'Amount', num: true, html: v => esc(trM(v))},
    {k: 'fee', label: 'Fee', num: true, html: v => esc(trM(v))},
    {k: 'status', label: 'Status', html: v => okb(v)}
  ], sorted, {sort: 'when', pageSize: 6});
  if(el('mmMsg') && !String(el('mmMsg').textContent || '').trim())
    el('mmMsg').textContent = 'Enter the wallet number in the 0991 000 111 form, verify the name, then submit.';
}

/* ===================== 8 · TRANSFER VERIFICATION ===================== */
function trVerifyItem(){
  return TR_VERIFY.find(v => v.id === TR_SEL.verify) || TR_VERIFY.find(v => v.status === 'Pending') || TR_VERIFY[0];
}
function trVerifyPassed(v){
  return v && Object.values(v.checks).every(Boolean);
}
function renderVerify(){
  const pending = TR_VERIFY.filter(v => v.status === 'Pending' && trPass(v));
  const passed = pending.filter(trVerifyPassed);
  if(el('tvPill')){ el('tvPill').className = 'badge b-warn'; el('tvPill').textContent = num(pending.length) + ' awaiting verification'; }
  put('tvKpis', [
    ['Awaiting verification', num(pending.length), 'Nobody has signed them yet', pending.length ? 'red' : ''],
    ['Pass every check', num(passed.length), 'Ready for approval', ''],
    ['Failing a check', num(pending.length - passed.length), 'Must be corrected first', ''],
    ['Value in the queue', trM(sum(pending, v => v.amount)), 'Held at verification', ''],
    ['Verified today', num(TR_VERIFY.filter(v => v.status === 'Verified').length), 'Signed by a person', ''],
    ['Rejected today', num(TR_VERIFY.filter(v => v.status === 'Rejected').length), 'Sent back', ''],
    ['With a document', num(pending.filter(v => v.docs !== 'No document attached').length), 'Proof attached', ''],
    ['Oldest in the queue', pending.length ? trWhen(pending[pending.length - 1].when) : '—', 'Raised', '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join(''));

  if(el('tvqPill')) el('tvqPill').textContent = num(pending.length) + ' in the queue';
  const sel = trVerifyItem();
  const rows = pending.slice();
  rows.forEach(v => { v._open = () => { TR_SEL.verify = v.id; renderVerify(); }; });
  renderTable('tvqBody', [
    {k: 'id', label: 'Queue'},
    {k: 'ref', label: 'Transfer'},
    {k: 'when', label: 'Raised', html: v => esc(trWhen(v))},
    {k: 'cust', label: 'Customer', html: v => esc(custName(v))},
    {k: 'method', label: 'Method'},
    {k: 'amount', label: 'Amount', num: true, html: v => esc(trM(v))},
    {k: 'checks', label: 'Checks', html: (v, r) => badge(Object.values(r.checks).filter(Boolean).length + '/6 passed',
      Object.values(r.checks).every(Boolean) ? 'b-ok' : 'b-crit')},
    {k: 'status', label: 'State', html: v => okb(v === 'Pending' ? 'Pending' : v)}
  ], rows, {sort: 'amount', pageSize: 8});

  const all = TR_VERIFY.filter(trPass);
  if(el('tvCheckPill')) el('tvCheckPill').textContent = sel ? sel.id : '—';
  if(sel){
    const labels = {source: 'Source account verified', destination: 'Destination account verified',
      funds: 'Funds available', amount: 'Amount inside the limits', beneficiary: 'Beneficiary verified',
      duplicate: 'No duplicate reference'};
    put('tvChecks', (sel ? Object.keys(labels) : []).map(k => {
      const ok = sel.checks[k];
      return `<div class="checkrow"><div class="ck ${ok ? 'pass' : 'crit'}">${ok ? '✓' : '!'}</div>
        <div style="flex:1"><div style="font-size:10.5px;font-weight:800">${esc(labels[k])}</div>
          <div class="qhint">${esc(k === 'funds' ? trM((TR_ACC_BY_ID[sel.source] || {}).available || 0) + ' available for ' + trM(sel.amount)
            : k === 'duplicate' ? 'Checked across the last ' + TR_SET.duplicateWindow + ' minutes'
            : k === 'amount' ? trM(TR_SET.minTransfer) + ' – ' + trM(TR_SET.maxTransfer)
            : k === 'beneficiary' ? (sel.method === 'Bank transfer' ? 'Name must match the bank record' : 'Wallet or account must be live')
            : 'Ownership and status checked')}</div></div>
        <div>${okb(ok ? 'Pass' : 'Failed')}</div></div>`;
    }).join(''));
  }
  const dup = TR_DUPLICATES[0];
  if(el('tvDocPill')) el('tvDocPill').textContent = sel && sel.docs !== 'No document attached' ? 'Attached' : 'None';
  put('tvDocs', sel ? kvRow('Transfer', sel.ref + ' · ' + trM(sel.amount))
    + kvRow('Supporting document', sel.docs === 'No document attached' ? badge('Not attached', 'b-warn') : badge(sel.docs, 'b-ok'))
    + kvRow('Method', sel.method) + kvRow('Raised', trWhen(sel.when))
    + kvRow('Verifier', staffName('STF-001')) : '<div class="empty">Nothing selected.</div>');
  put('tvDupBox', `<div class="minihead">Duplicate check</div>`
    + (dup ? kvRow('Reference seen before', dup.ref) + kvRow('Occurrences', String(dup.count))
      + kvRow('Transfers', dup.ids) + kvRow('Held', badge('Yes', 'b-crit'))
      : kvRow('Duplicate reference', okb('None found')))
    + kvRow('Window', TR_SET.duplicateWindow + ' minutes')
    + `<div class="qhint" style="margin-top:6px">A reference seen inside the window is held, never auto-approved.</div>`);

  if(el('tvHistPill')) el('tvHistPill').textContent = num(TR_VERIFY_HISTORY.length) + ' decisions';
  renderTable('tvHistBody', [
    {k: 'when', label: 'When', html: v => esc(trWhen(v))},
    {k: 'ref', label: 'Transfer'},
    {k: 'action', label: 'Decision', html: v => okb(v)},
    {k: 'by', label: 'Officer', html: v => esc(staffName(v))},
    {k: 'notes', label: 'Note', html: v => esc(String(v).slice(0, 46))}
  ], TR_VERIFY_HISTORY, {sort: 'when', pageSize: 6});
}
</script>
