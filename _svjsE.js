<script>
/* ============================================================
   SAVINGS MANAGEMENT & CONNECTIONS (5/8)
   Sections 5–8: withdrawals, the balance and the ledger, interest
   management, and the savings products and plans.
   ============================================================ */

/* ===================== 5 · SAVINGS WITHDRAWALS ===================== */
const SV_WD_STATE = {verified: '', identity: null};
function svWdChecks(){
  const acct = SV_ACC_BY_ID[el('wdAcct') ? el('wdAcct').value : ''] || SV_SAVINGS[0];
  const amount = Number(el('wdAmount') ? el('wdAmount').value : 0) || 0;
  const method = el('wdMethod') ? el('wdMethod').value : 'Cash';
  const fee = Math.round(amount * SV_SET.withdrawalFeePct / 100) + SV_SET.withdrawalFeeFlat;
  const identity = SV_WD_STATE.identity;
  const daily = sum(SV_COMPLETED.filter(t => t.cust === (acct || {}).cust && t.kind === 'Withdrawal'
    && svIsos(t.when) === TODAY), t => t.amount);
  const checks = [
    ['Identity verified', !!identity, identity ? identity.doc + ' ' + identity.number : 'Not verified yet'],
    ['Account is open', acct ? acct.status === 'Active' : false, acct ? acct.status : '—'],
    ['No restriction on the account', acct ? acct.restriction === 'None' || acct.status !== 'Active' ? acct.restriction === 'None' : false : false, acct ? acct.restriction : '—'],
    ['Available balance covers the amount and the fee', acct ? amount + fee <= acct.available : false,
      acct ? svM(acct.available) + ' available' : '—'],
    ['Keeps the minimum balance', acct ? acct.available - amount >= acct.minBalance : false,
      acct ? svM(acct.minBalance) + ' must remain' : '—'],
    ['Inside the daily withdrawal limit', amount + daily <= SV_SET.dailyWithdrawalLimit,
      svM(daily) + ' already taken today'],
    ['Inside the per-customer limit', amount <= SV_SET.perCustomerDailyLimit, svM(SV_SET.perCustomerDailyLimit)],
    ['Method is available', (SV_LIMITS.find(l => l.method === method) || {daily: 0}).daily >= amount, method]
  ];
  return {acct, amount, fee, method, checks, pass: checks.every(c => c[1]), daily};
}
function renderWithdrawals(){
  const rows = SV_WITHDRAWALS.filter(svPass);
  const pending = SV_WITHDRAWALS.filter(t => ['Pending verification', 'Pending approval', 'Approved', 'Processing'].includes(t.status));
  const s = svStats();
  if(el('wdPill')){ el('wdPill').className = 'badge b-warn'; el('wdPill').textContent = num(rows.length) + ' withdrawals'; }
  put('wdKpis', [
    ['Withdrawals in view', num(rows.length), 'Of ' + num(SV_WITHDRAWALS.length) + ' recorded', ''],
    ['Value paid out', svM(sum(rows.filter(t => t.status === 'Completed'), t => t.amount)), 'Completed payouts', ''],
    ['Pending requests', num(pending.length), svM(sum(pending, t => t.amount)) + ' held', pending.length ? 'red' : ''],
    ['Awaiting approval', num(rows.filter(t => t.status === 'Pending approval').length), 'Needs a signature', ''],
    ['Awaiting identity', num(rows.filter(t => t.status === 'Pending verification').length), 'Identity not yet checked', ''],
    ['Completed', num(rows.filter(t => t.status === 'Completed').length), 'Money left the account', ''],
    ['Rejected or cancelled', num(rows.filter(t => ['Rejected', 'Cancelled'].includes(t.status)).length), 'Refused or withdrawn', ''],
    ['Fees charged', svM(sum(rows.filter(t => t.status === 'Completed'), t => t.fee)), 'On completed payouts', '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join(''));

  svFillSel('wdCust', svCustOptions());
  svFillSel('wdAcct', svSavingsOptions());
  svFillSel('wdMethod', svMethodOptions());
  const wd = svWdChecks();
  if(el('wdChkPill')) el('wdChkPill').textContent = wd.checks.filter(c => c[1]).length + '/' + wd.checks.length;
  put('wdChecks', wd.checks.map(([l, ok, d]) => `<div class="checkrow"><div class="ck ${ok ? 'pass' : 'crit'}">${ok ? '✓' : '!'}</div>
      <div style="flex:1"><div style="font-size:10.5px;font-weight:800">${esc(l)}</div><div class="qhint">${esc(String(d))}</div></div>
      <div>${okb(ok ? 'Pass' : 'Failed')}</div></div>`).join('')
    + `<div class="qhint" style="margin-top:6px">${wd.pass
      ? 'Everything clears — the request can be submitted.'
      : 'Fix the failing checks first; the request will be refused.'}</div>`);
  put('wdBalBox', `<div class="minihead">The account</div>`
    + kvRow('Account', wd.acct ? wd.acct.id : '—')
    + kvRow('Available', svM(wd.acct ? wd.acct.available : 0))
    + kvRow('Reserved for pending payouts', svM(wd.acct ? wd.acct.reserved : 0))
    + kvRow('Minimum balance', svM(wd.acct ? wd.acct.minBalance : 0))
    + kvRow('Amount requested', svM(wd.amount))
    + kvRow('Fee', svM(wd.fee))
    + kvRow('Balance after', svM(Math.max(0, (wd.acct ? wd.acct.available : 0) - wd.amount - wd.fee))));
  put('wdLimitBox', `<div class="minihead">Limits in force</div>`
    + kvRow('Daily withdrawal limit', svM(SV_SET.dailyWithdrawalLimit))
    + kvRow('Taken today', svM(wd.daily))
    + kvRow('Per-customer daily', svM(SV_SET.perCustomerDailyLimit))
    + kvRow('First approval above', svM(SV_SET.approvalThreshold))
    + kvRow('Second approval above', svM(SV_SET.secondApprovalThreshold)));
  put('wdFlowBox', `<div class="minihead">Approval workflow</div>`
    + kvRow('1 · Identity', SV_WD_STATE.identity ? okb('Verified') : badge('Pending', 'b-warn'))
    + kvRow('2 · Verification', wd.pass ? okb('Pass') : badge('Blocked', 'b-crit'))
    + kvRow('3 · Approval', wd.amount > SV_SET.secondApprovalThreshold ? 'Two signatures needed'
      : wd.amount > SV_SET.approvalThreshold ? 'One manager signature' : 'One cashier signature')
    + kvRow('4 · Processing', 'Debits the savings account and writes the ledger')
    + kvRow('5 · Receipt', 'Issued on completion'));

  if(el('wdPendPill')) el('wdPendPill').textContent = num(pending.length) + ' waiting';
  renderTable('wdPendBody', [
    {k: 'id', label: 'Transaction'},
    {k: 'when', label: 'Requested', html: v => esc(svWhen(v))},
    {k: 'cust', label: 'Customer', html: v => esc(custName(v))},
    {k: 'method', label: 'Method'},
    {k: 'amount', label: 'Amount', num: true, html: v => esc(svM(v))},
    {k: 'status', label: 'State', html: v => okb(v)},
    {k: '_act', label: 'Action', html: (v, r) => r.status === 'Processing' || r.status === 'Approved'
      ? `<button class="btn btn-ghost" data-wdact="process" data-wdid="${esc(r.id)}">Process</button>`
      : r.status === 'Pending approval'
      ? `<button class="btn btn-ghost" data-wdact="approve" data-wdid="${esc(r.id)}">Approve</button>
         <button class="btn btn-ghost" data-wdact="reject" data-wdid="${esc(r.id)}">Reject</button>
         <button class="btn btn-ghost" data-wdact="cancel" data-wdid="${esc(r.id)}">Cancel</button>`
      : `<button class="btn btn-ghost" data-wdact="verify" data-wdid="${esc(r.id)}">Verify</button>`}
  ], pending, {sort: 'amount', pageSize: 6});

  if(el('wdHistPill')) el('wdHistPill').textContent = num(rows.length) + ' payouts';
  const sorted = rows.slice().sort((a, b) => String(b.when).localeCompare(String(a.when)));
  sorted.forEach(t => { t._open = () => { SV_SEL.wdr = t.id; openSavingsTxn(t); }; });
  renderTable('wdHistBody', [
    {k: 'when', label: 'Date', html: v => esc(svWhen(v))},
    {k: 'id', label: 'Transaction'},
    {k: 'cust', label: 'Customer', html: v => esc(custName(v))},
    {k: 'method', label: 'Method'},
    {k: 'amount', label: 'Amount', num: true, html: v => esc(svM(v))},
    {k: 'fee', label: 'Fee', num: true, html: v => esc(svM(v))},
    {k: 'status', label: 'State', html: v => okb(v)}
  ], sorted, {sort: 'when', pageSize: 7});
  if(el('wdMsg') && !String(el('wdMsg').textContent || '').trim())
    el('wdMsg').textContent = 'Verify the identity first, then submit — the balance is reserved while the request waits.';
}

/* ===================== 6 · BALANCE AND LEDGER ===================== */
function renderLedger(){
  const s = svStats();
  const debits = sum(SV_LEDGER.filter(e => e.side === 'Debit'), e => Math.abs(e.amount));
  const credits = sum(SV_LEDGER.filter(e => e.side === 'Credit'), e => e.amount);
  const net = sum(SV_LEDGER, e => e.amount);
  if(el('blPill')){ el('blPill').className = 'badge b-gray'; el('blPill').textContent = num(SV_LEDGER.length) + ' ledger entries'; }
  put('blKpis', [
    ['Ledger entries', num(SV_LEDGER.length), 'One per posted movement', ''],
    ['Opening balances', svM(sum(SV_SAVINGS, a => a.opening)), 'As the accounts were opened', ''],
    ['Available savings', svM(s.savingsTotal), 'What customers can draw', ''],
    ['Pending deposits', svM(s.pendingIn), 'Not yet credited', ''],
    ['Reserved for payouts', svM(s.reserved), 'Held against pending withdrawals', ''],
    ['Confirmed credits', svM(credits), 'Deposits and interest posted', ''],
    ['Completed debits', svM(debits), 'Withdrawals, transfers and fees', ''],
    ['Net movement', svM(net), Math.abs(net) < 1 ? 'Balanced at zero' : 'Out of balance', Math.abs(net) < 1 ? '' : 'red']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join(''));

  if(el('blCompPill')) el('blCompPill').textContent = num(SV_SAVINGS.length) + ' savings accounts';
  put('blComp', strip([
    ['Opening', svM(sum(SV_SAVINGS, a => a.opening))],
    ['Deposited', svM(sum(SV_SAVINGS, a => a.inTotal))],
    ['Withdrawn', svM(sum(SV_SAVINGS, a => a.outTotal))],
    ['Interest', svM(sum(SV_SAVINGS, a => a.interestPaid))]
  ]) + `<div class="qhint" style="margin-top:6px">Available = opening + confirmed credits − completed debits − reserved. Nothing else may touch a balance.</div>`);
  if(el('blMsg') && !String(el('blMsg').textContent || '').trim())
    el('blMsg').textContent = 'Recalculate rebuilds every ledger figure from the posted entries; reconcile compares the two.';

  put('blFlow', chartBox({title: 'Debits against credits', sub: 'By day, MWK', type: 'bar', h: 200,
    cats: SV_DAILY.map(d => d.label),
    series: [{name: 'Credits', data: SV_DAILY.map(d => d.deposits + d.interest), colour: '#1E9E6A'},
      {name: 'Debits', data: SV_DAILY.map(d => d.withdrawals), colour: '#C9A227'}],
    value: svM(credits)}));
  put('blGuard', `<div class="minihead">What protects the balance</div>`
    + kvRow('Balance change without a transaction', SV_DISCREPANCY.length ? badge('Possible', 'b-crit') : okb('None'))
    + kvRow('Interest credits counted as deposits', okb('Separately'))
    + kvRow('Reserved funds shown apart', okb('Yes'))
    + kvRow('Adjustments need a reason', okb('Enforced')));

  const led = SV_LEDGER.filter(svPass).slice().sort((a, b) => String(b.when).localeCompare(String(a.when)));
  if(el('blLedgerPill')) el('blLedgerPill').textContent = num(led.length) + ' rows';
  renderTable('blLedgerBody', [
    {k: 'entry', label: 'Entry'},
    {k: 'when', label: 'When', html: v => esc(svWhen(v))},
    {k: 'account', label: 'Account'},
    {k: 'cust', label: 'Customer', html: v => esc(custName(v))},
    {k: 'kind', label: 'Source'},
    {k: 'side', label: 'Side', html: v => badge(v, v === 'Credit' ? 'b-ok' : 'b-warn')},
    {k: 'amount', label: 'Amount', num: true, html: v => `<b style="color:${Number(v) < 0 ? '#B42318' : '#1E7A4F'}">${esc(svM(v))}</b>`},
    {k: 'balance', label: 'Balance after', num: true, html: v => esc(svM(v))}
  ], led, {sort: 'when', pageSize: 8});

  if(el('blDiscPill')) el('blDiscPill').textContent = num(SV_DISCREPANCY.length) + ' open';
  put('blDiscBox', SV_DISCREPANCY.map(d => `<div class="risk"><div><div class="rn">${esc(d.account)} · ${esc(custName(d.cust))}</div>
      <div class="rs">${esc(d.note)}</div></div><div class="rv">${badge(svM(Math.abs(d.difference)) + ' out', SV_SEV(d.severity))}</div></div>`).join('')
    || '<div class="empty">The ledger and the balances agree on every savings account.</div>');

  svFillSel('blAdjAcct', svSavingsOptions());
  const adjAcct = SV_ACC_BY_ID[el('blAdjAcct') ? el('blAdjAcct').value : ''] || SV_SAVINGS[0];
  const adjAmt = Number(el('blAdjAmount') ? el('blAdjAmount').value : 0) || 0;
  if(el('blAdjReason') && !el('blAdjReason').value) el('blAdjReason').value = '';
  put('blAdjHead', '<tr><th>Adjustment</th><th>When</th><th>Account</th><th class="num">Amount</th><th>Reason</th><th>State</th></tr>');
  if(el('blAdjBody')) el('blAdjBody').innerHTML = SV_ADJUST.filter(svPass).map(a => `<tr>
      <td>${esc(a.id)}</td><td>${esc(svWhen(a.when))}</td><td>${esc(a.account)}</td>
      <td class="num">${esc(svM(a.amount))}</td><td>${esc(String(a.reason).slice(0, 34))}</td>
      <td>${okb(a.status)}</td></tr>`).join('')
    || '<tr><td colspan="6" class="empty">No adjustment recorded.</td></tr>';
  if(el('blAdjAcct')) el('blAdjAcct').dataset.effect =
    `${adjAcct.id} · ${svM(adjAcct.available)} → ${svM(Math.max(0, adjAcct.available + adjAmt))}`;
  if(el('blMsg') && adjAmt)
    el('blMsg').textContent = 'The pending adjustment takes ' + adjAcct.id + ' from ' + svM(adjAcct.available)
      + ' to ' + svM(Math.max(0, adjAcct.available + adjAmt)) + '.';
}

/* ===================== 7 · INTEREST MANAGEMENT ===================== */
function renderInterest(){
  const s = svStats();
  if(el('itPill')){ el('itPill').className = 'badge b-gray'; el('itPill').textContent = SV_SET.interestRate + '% ' + SV_SET.rateType.toLowerCase(); }
  put('itKpis', [
    ['Annual rate', SV_SET.interestRate + '%', SV_SET.rateType + ' · compounds ' + SV_SET.compounding.toLowerCase(), ''],
    ['Interest accrued', svM(s.interestAccrued), 'This month, not yet posted', ''],
    ['Interest paid', svM(s.interestPaid), 'Credited to customers to date', ''],
    ['Accounts earning', num(SV_SAVINGS.filter(a => a.available >= SV_SET.minBalance).length), 'Above the minimum balance', ''],
    ['Accounts below minimum', num(SV_SAVINGS.filter(a => a.available < SV_SET.minBalance).length), 'Earn nothing this month', ''],
    ['Postings made', num(SV_INTEREST_HISTORY.length), 'Monthly, last day of the month', ''],
    ['Accrual rows pending', num(SV_ACCRUAL.filter(a => a.status === 'Pending').length), 'Waiting for the post', ''],
    ['Monthly interest bill', svM(sum(SV_SAVINGS, a => a.monthlyInterest)), 'What the book costs at this rate', '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join(''));

  const setIf = (id, v) => { const n = el(id); if(n && !n.value) n.value = v; };
  setIf('itRate', SV_SET.interestRate);
  if(el('itRateType')) el('itRateType').value = SV_SET.rateType;
  if(el('itCompounding')) el('itCompounding').value = SV_SET.compounding;
  if(el('itBasis')) el('itBasis').value = SV_SET.accrualBasis;
  if(el('itSchedule')) el('itSchedule').value = SV_SET.postingSchedule;
  setIf('itMinBal', SV_SET.minBalance);
  if(el('itMsg') && !String(el('itMsg').textContent || '').trim())
    el('itMsg').textContent = 'Changing the rate writes a configuration change; the accrual for the open month is recalculated.';

  svFillSel('itCalcAcct', svSavingsOptions());
  const calcAcct = SV_ACC_BY_ID[el('itCalcAcct') ? el('itCalcAcct').value : ''] || SV_SAVINGS[0];
  const calcAmount = Number(el('itCalcAmount') ? el('itCalcAmount').value : 0) || 0;
  const mode = el('itCalcMode') ? el('itCalcMode').value : 'Daily';
  const divisor = mode === 'Daily' ? 365 : mode === 'Monthly' ? 12 : 1;
  const calcInterest = Math.round(calcAmount * SV_SET.interestRate / 100 / divisor);
  put('itCalcBox', `<div class="minihead">${esc(mode)} interest on ${esc(svM(calcAmount))}</div>`
    + kvRow('Rate applied', SV_SET.interestRate + '% ' + SV_SET.rateType.toLowerCase())
    + kvRow('Basis', SV_SET.accrualBasis)
    + kvRow('Interest for one ' + mode.toLowerCase().replace('annual', 'year'), svM(calcInterest))
    + kvRow('Monthly equivalent', svM(Math.round(calcAmount * SV_SET.interestRate / 100 / 12)))
    + kvRow('Annual equivalent', svM(Math.round(calcAmount * SV_SET.interestRate / 100)))
    + kvRow('Account used', calcAcct ? calcAcct.id + ' · ' + svM(calcAcct.available) : '—')
    + kvRow('Account earns', calcAcct && calcAcct.available >= SV_SET.minBalance ? okb('Yes') : badge('Below the minimum', 'b-warn')));

  put('itRuleBox', `<div class="minihead">Compounding and simple interest</div>`
    + kvRow('Compounding', esc(SV_SET.compounding))
    + (SV_SET.compounding === 'None (simple)'
      ? kvRow('Simple interest', 'Interest is paid out, never capitalised')
      : kvRow('Compound interest', 'Interest is added to the balance and earns interest next month'))
    + kvRow('Accrual basis', esc(SV_SET.accrualBasis))
    + kvRow('Posting schedule', esc(SV_SET.postingSchedule))
    + kvRow('Minimum balance for interest', svM(SV_SET.minBalance))
    + kvRow('Early closure', 'Accrued interest is forfeited on a fixed-term plan'));
  put('itEligBox', `<div class="minihead">Eligibility</div>`
    + kvRow('Holds the minimum for the whole month', 'Required')
    + kvRow('Account active or dormant', okb('Both earn'))
    + kvRow('Suspended accounts', badge('Do not earn', 'b-crit'))
    + kvRow('Fixed-term plans', 'Interest posts at maturity')
    + kvRow('Accounts eligible now', String(SV_SAVINGS.filter(a => a.available >= SV_SET.minBalance && a.status !== 'Suspended').length) + ' of ' + SV_SAVINGS.length));

  if(el('itAccrualPill')) el('itAccrualPill').textContent = num(SV_ACCRUAL.length) + ' accruals';
  renderTable('itAccrualBody', [
    {k: 'account', label: 'Account'},
    {k: 'cust', label: 'Customer', html: v => esc(custName(v))},
    {k: 'rate', label: 'Rate %', num: true, html: v => esc(v + '%')},
    {k: 'opening', label: 'Balance used', num: true, html: v => esc(svM(v))},
    {k: 'accrued', label: 'Accrued', num: true, html: v => esc(svM(v))},
    {k: 'posted', label: 'Posted', num: true, html: v => esc(svM(v))},
    {k: 'status', label: 'State', html: v => okb(v)}
  ], SV_ACCRUAL.filter(svPass), {sort: 'accrued', pageSize: 7});

  if(el('itHistPill')) el('itHistPill').textContent = num(SV_INTEREST_HISTORY.length) + ' postings';
  renderTable('itHistBody', [
    {k: 'label', label: 'Month'},
    {k: 'rate', label: 'Rate %', num: true, html: v => esc(v + '%')},
    {k: 'accounts', label: 'Accounts', num: true},
    {k: 'accrued', label: 'Posted', num: true, html: v => esc(svM(v))},
    {k: 'postedOn', label: 'Posted on', html: v => esc(fmtDate(v))}
  ], SV_INTEREST_HISTORY, {sort: 'label', pageSize: 6});

  put('itGrid',
    chartBox({title: 'Interest posted by month', sub: 'MWK credited to customers', type: 'bar', h: 200,
      cats: SV_INTEREST_HISTORY.map(h => h.label),
      series: [{name: 'Interest', data: SV_INTEREST_HISTORY.map(h => h.accrued), colour: '#0E9AA7'}],
      value: svM(s.interestPaid)}) +
    chartBox({title: 'Accrual by product', sub: 'Interest earned this month', type: 'donut', h: 200,
      cats: SV_PRODUCTS.map(p => p.name.split(' · ')[0]),
      series: [{name: 'Accrued', data: SV_PRODUCTS.map(p => sum(SV_ACCRUAL.filter(a => a.product === p.id), a => a.accrued))}],
      value: svM(s.interestAccrued)}));
  if(el('itVerifyBox') && !el('itVerifyBox').innerHTML){
    el('itVerifyBox').innerHTML = '<div class="qhint">Verify the calculation to see each rule checked against the posted rows.</div>';
  }
  if(el('itStmtBox') && !el('itStmtBox').innerHTML){
    el('itStmtBox').innerHTML = '<div class="qhint">Build an interest statement to see what each account earned and when it was posted.</div>';
  }
}

/* ===================== 8 · SAVINGS PRODUCTS ===================== */
function svProdItem(){
  return SV_PROD_BY_ID[SV_SEL.prod] || SV_PRODUCTS[0];
}
function renderProducts(){
  const rows = SV_PRODUCTS.filter(svPass);
  const s = svStats();
  if(el('prPill')){ el('prPill').className = 'badge b-gray'; el('prPill').textContent = num(SV_PRODUCTS.length) + ' products'; }
  put('prKpis', [
    ['Savings products', num(SV_PRODUCTS.length), 'Standard, fixed-term and goal-based', ''],
    ['Open products', num(SV_PRODUCTS.filter(p => p.status === 'Open').length), 'Available at the counter', ''],
    ['Paused', num(SV_PRODUCTS.filter(p => p.status !== 'Open').length), 'Cannot be opened', ''],
    ['Accounts across products', num(sum(SV_PRODUCTS, p => p.accounts)), 'Every savings account', ''],
    ['Value held', svM(sum(SV_PRODUCTS, p => p.balance)), 'Across every product', ''],
    ['Highest rate', Math.max.apply(null, SV_PRODUCTS.map(p => p.rate)) + '%', 'Fixed-term, twelve months', ''],
    ['Lowest opening', svM(Math.min.apply(null, SV_PRODUCTS.map(p => p.minOpening))), 'Junior savings', ''],
    ['Goal-based accounts', num(SV_SAVINGS.filter(a => (SV_PROD_BY_ID[a.product] || {}).kind === 'Goal-based').length), 'Saving towards a target', '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join(''));

  if(el('prCount')) el('prCount').textContent = num(rows.length) + ' products';
  const list = rows.slice();
  list.forEach(p => { p._open = () => { SV_SEL.prod = p.id; loadProductForm(p); renderProducts(); }; });
  renderTable('prBody', [
    {k: 'name', label: 'Product'},
    {k: 'kind', label: 'Kind'},
    {k: 'rate', label: 'Rate %', num: true, html: v => esc(v + '%')},
    {k: 'minOpening', label: 'Min opening', num: true, html: v => esc(svM(v))},
    {k: 'minBalance', label: 'Min balance', num: true, html: v => esc(svM(v))},
    {k: 'accounts', label: 'Accounts', num: true},
    {k: 'balance', label: 'Held', num: true, html: v => esc(svM(v))},
    {k: 'status', label: 'State', html: v => okb(v)}
  ], list, {sort: 'rate', pageSize: 6});

  const pr = svProdItem();
  if(el('prSelPill')) el('prSelPill').textContent = pr ? pr.id : '—';
  put('prDetail', pr ? kvRow('Product', pr.name) + kvRow('Kind', pr.kind)
    + kvRow('Rate', pr.rate + '% ' + pr.rateType) + kvRow('Minimum opening', svM(pr.minOpening))
    + kvRow('Minimum balance', svM(pr.minBalance)) + kvRow('Deposit frequency', pr.frequency)
    + kvRow('Withdrawal rule', esc(pr.withdrawal)) + kvRow('Availability', esc(pr.availability))
    + kvRow('Accounts', num(pr.accounts)) + kvRow('Held', svM(pr.balance))
    + kvRow('State', okb(pr.status)) : '<div class="empty">Nothing selected.</div>');
  put('prTermsBox', SV_PRODUCTS.map(p => `<div class="risk"><div><div class="rn">${esc(p.name)}</div>
      <div class="rs">${esc(p.terms)}</div></div><div class="rv">${okb(p.availability)}</div></div>`).join(''));

  put('prGrid',
    chartBox({title: 'Balance by product', sub: 'MWK held', type: 'bar', h: 200,
      cats: SV_PRODUCTS.map(p => p.name.split(' · ')[0]),
      series: [{name: 'Balance', data: SV_PRODUCTS.map(p => p.balance || 0)}],
      value: compact(sum(SV_PRODUCTS, p => p.balance))}) +
    chartBox({title: 'Accounts by product', sub: 'How the book is spread', type: 'donut', h: 200,
      cats: SV_PRODUCTS.map(p => p.name.split(' · ')[0]),
      series: [{name: 'Accounts', data: SV_PRODUCTS.map(p => p.accounts || 0)}],
      value: num(s.savingsAccounts)}));
  if(el('prMsg') && !String(el('prMsg').textContent || '').trim())
    el('prMsg').textContent = 'Saving a new product adds it to the table; saving an existing one updates its terms.';
}

function loadProductForm(p){
  if(!p) return;
  SV_SEL.prod = p.id;
  if(el('prName')) el('prName').value = p.name;
  if(el('prKind')) el('prKind').value = p.kind;
  if(el('prRate')) el('prRate').value = p.rate;
  if(el('prRateType')) el('prRateType').value = p.rateType;
  if(el('prMinOpen')) el('prMinOpen').value = p.minOpening;
  if(el('prMinBal')) el('prMinBal').value = p.minBalance;
  if(el('prFreq')) el('prFreq').value = p.frequency;
  if(el('prWithdrawal')) el('prWithdrawal').value = p.withdrawal;
  if(el('prAvail')) el('prAvail').value = p.availability;
}
</script>
