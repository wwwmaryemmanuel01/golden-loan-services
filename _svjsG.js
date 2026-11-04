<script>
/* ============================================================
   SAVINGS MANAGEMENT & CONNECTIONS (7/8)
   Sections 13–16: fees, limits and penalties; transfers between
   accounts; notifications and reminders; and the dormant and
   restricted accounts.
   ============================================================ */

/* ===================== 13 · FEES, LIMITS AND PENALTIES ===================== */
const SV_FEE_STATE = {fees: SV_FEES.map(f => Object.assign({}, f)), hist: SV_FEE_HISTORY.slice(), waiver: SV_WAIVERS.slice()};
function renderFees(){
  const s = svStats();
  if(el('flPill')){ el('flPill').className = 'badge b-warn'; el('flPill').textContent = SV_FEE_STATE.fees.length + ' fees in force'; }
  put('flKpis', [
    ['Fees in force', num(SV_FEE_STATE.fees.length), 'Maintenance, withdrawal, transfer and penalties', ''],
    ['Fees collected', svM(s.fees), 'On completed transactions', ''],
    ['Withdrawal fee', SV_SET.withdrawalFeePct + '% + ' + svM(SV_SET.withdrawalFeeFlat), 'Charged on every payout', ''],
    ['Maintenance fee', svM(SV_SET.maintenanceFee), 'Per account, per month', ''],
    ['Early withdrawal penalty', SV_SET.earlyPenaltyPct + '%', 'On a fixed-term plan', ''],
    ['Deposit limits', svM(SV_SET.minDeposit) + ' – ' + svM(SV_SET.maxDeposit), 'Per deposit', ''],
    ['Daily withdrawal limit', svM(SV_SET.dailyWithdrawalLimit), 'Per account', ''],
    ['Waivers logged', num(SV_FEE_STATE.waiver.length), svM(sum(SV_FEE_STATE.waiver, w => w.amount)) + ' waived', '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join(''));

  if(el('flCount')) el('flCount').textContent = SV_LIMITS.length + ' rails';
  if(el('flLimitsHead')) el('flLimitsHead').innerHTML = '<tr><th>Method</th><th class="num">Minimum</th><th class="num">Maximum</th>'
    + '<th class="num">Daily</th><th class="num">Per customer</th><th>Effective</th></tr>';
  if(el('flLimitsBody')) el('flLimitsBody').innerHTML = SV_LIMITS.map(l => `<tr>
      <td><b>${esc(l.method)}</b><div class="qhint">${esc(l.rail)}</div></td>
      <td class="num">${esc(svM(l.min))}</td><td class="num">${esc(svM(l.max))}</td>
      <td class="num">${esc(svM(l.daily))}</td><td class="num">${esc(svM(l.perCustomer))}</td>
      <td>${esc(fmtDate(l.effective))}</td></tr>`).join('')
    || '<tr><td colspan="6" class="empty">No rail configured.</td></tr>';

  if(el('flFeesHead')) el('flFeesHead').innerHTML = '<tr><th>Fee</th><th>Basis</th><th class="num">Flat</th><th class="num">Rate</th><th class="num">Waived</th><th>Payer</th></tr>';
  if(el('flFeesBody')) el('flFeesBody').innerHTML = SV_FEE_STATE.fees.map(f => `<tr>
      <td><b>${esc(f.fee)}</b></td><td>${esc(f.basis)}</td>
      <td class="num">${f.amount ? esc(svM(f.amount)) : '—'}</td>
      <td class="num">${f.pct ? f.pct + '%' : '—'}</td>
      <td class="num">${num(f.waived)}</td><td>${esc(f.payer)}</td></tr>`).join('')
    || '<tr><td colspan="6" class="empty">No fee configured.</td></tr>';

  put('flPenaltyBox', `<div class="minihead">Early withdrawal penalty</div>`
    + kvRow('Rate', SV_SET.earlyPenaltyPct + '% of the amount withdrawn')
    + kvRow('Applies to', 'Fixed-term plans, before maturity')
    + kvRow('Charged', 'At the moment of the withdrawal')
    + kvRow('Waived when', 'The customer dies, or the branch closes the plan'));
  put('flDormantBox', `<div class="minihead">Dormant account rules</div>`
    + kvRow('Dormant after', SV_SET.dormantDays + ' days without customer movement')
    + kvRow('Monthly dormancy fee', svM(SV_SET.dormancyFee))
    + kvRow('Deposits allowed', okb('Yes'))
    + kvRow('Withdrawals allowed', badge('Branch only', 'b-warn'))
    + kvRow('Dormant accounts now', String(SV_SAVINGS.filter(a => a.status === 'Dormant').length)));

  svFillSel('flWaiverCust', svCustOptions());
  svFillSel('flWaiverFee', SV_FEE_STATE.fees.map(f => [f.fee, f.fee]));
  if(el('flWaiverPill')) el('flWaiverPill').textContent = num(SV_FEE_STATE.waiver.length) + ' waivers';
  if(el('flWaiverHead')) el('flWaiverHead').innerHTML = '<tr><th>Waiver</th><th>Customer</th><th>Fee</th><th class="num">Amount</th><th>State</th></tr>';
  if(el('flWaiverBody')) el('flWaiverBody').innerHTML = SV_FEE_STATE.waiver.slice(0, 6).map(w => `<tr>
      <td>${esc(w.id)}</td><td>${esc(custName(w.cust))}</td><td>${esc(w.fee)}</td>
      <td class="num">${esc(svM(w.amount))}</td><td>${okb(w.status)}</td></tr>`).join('')
    || '<tr><td colspan="5" class="empty">Nothing waived.</td></tr>';
  if(el('flMsg') && !String(el('flMsg').textContent || '').trim())
    el('flMsg').textContent = 'The limits below are read from the settings section — saving there updates this page.';

  if(el('flHistPill')) el('flHistPill').textContent = num(SV_FEE_STATE.hist.length) + ' changes';
  if(el('flHistHead')) el('flHistHead').innerHTML = '<tr><th>When</th><th>Scope</th><th>From</th><th>To</th><th>Officer</th></tr>';
  if(el('flHistBody')) el('flHistBody').innerHTML = SV_FEE_STATE.hist.slice(0, 10).map(h => `<tr>
      <td>${esc(svWhen(h.when))}</td><td>${esc(h.scope)}</td><td>${esc(h.from)}</td>
      <td>${esc(h.to)}</td><td>${esc(staffName(h.by))}</td></tr>`).join('')
    || '<tr><td colspan="5" class="empty">No change recorded.</td></tr>';

  put('flGrid',
    chartBox({title: 'What the fees brought in', sub: 'By fee, MWK', type: 'bar', h: 200,
      cats: SV_FEE_STATE.fees.map(f => f.fee.split(' ')[0]),
      series: [{name: 'Charged', data: SV_FEE_STATE.fees.map(f => (f.amount || 0) * (10 + f.waived))}],
      value: svM(s.fees)}) +
    chartBox({title: 'Withdrawals against the daily limit', sub: 'Last seven days, MWK', type: 'line', h: 200,
      cats: SV_DAILY.map(d => d.label),
      series: [{name: 'Withdrawn', data: SV_DAILY.map(d => d.withdrawals), colour: '#C9A227'},
        {name: 'Limit', data: SV_DAILY.map(d => d.limit), colour: '#98A2B3'}],
      value: svM(SV_SET.dailyWithdrawalLimit)}));
}

/* ===================== 14 · SAVINGS TRANSFERS ===================== */
const SV_SM_STATE = {sel: ''};
/* live loans carry a ref, not an id: map them once so the repayment form
   and the transfer ledger agree on the same row */
function svLoanRows(){
  SV_LOAN_ROWS.length = 0;
  LOANS.filter(l => l.status === 'Active').slice(0, 20).forEach(l => {
    const outstanding = Math.max(1000, Math.round(l.amount * (l.status === 'Active' ? 0.72 : 0) / 500) * 500);
    SV_LOAN_ROWS.push({id: l.ref, cust: l.cust, balance: outstanding, amount: l.amount,
      status: l.status, region: l.region, ref: l.ref});
  });
  return SV_LOAN_ROWS;
}
const SV_LOAN_ROWS = [];
function svTransferRows(){
  return SV_TXN.filter(t => t.kind === 'Transfer');
}
function svSmChecks(){
  const from = SV_ACC_BY_ID[el('smFrom') ? el('smFrom').value : ''] || SV_SAVINGS[0];
  const to = SV_ACC_BY_ID[el('smTo') ? el('smTo').value : ''] || SV_ACCOUNTS[1];
  const amount = Number(el('smAmount') ? el('smAmount').value : 0) || 0;
  const fee = SV_SET.transferFeeFlat;
  const checks = [
    ['Source and destination differ', !!from && !!to && from.id !== to.id, from && to ? from.id + ' → ' + to.id : '—'],
    ['Source account is active', !!from && from.status === 'Active', from ? from.status : '—'],
    ['Destination can receive', !!to && to.status !== 'Suspended', to ? to.status : '—'],
    ['Available balance covers the amount and the fee', !!from && amount + fee <= from.available,
      from ? svM(from.available) + ' available' : '—'],
    ['Keeps the minimum balance', !!from && from.available - amount - fee >= from.minBalance,
      from ? svM(from.minBalance) + ' must remain' : '—'],
    ['Third-party transfers allowed', SV_SET.allowThirdPartyTransfers !== false || (from && to && from.cust === to.cust),
      SV_SET.allowThirdPartyTransfers ? 'Enabled' : 'Only within the same customer'],
    ['Inside the daily limit', amount <= SV_SET.dailyWithdrawalLimit, svM(SV_SET.dailyWithdrawalLimit)],
    ['Approval route', amount > SV_SET.approvalThreshold ? 'A manager must sign it' : 'A cashier may post it',
      svM(SV_SET.approvalThreshold)]
  ];
  return {from, to, amount, fee, checks, pass: checks.slice(0, 7).every(c => c[1])};
}
function renderTransfers(){
  const rows = svTransferRows();
  const sm = svSmChecks();
  const s = svStats();
  if(el('smPill')){ el('smPill').className = 'badge b-gray'; el('smPill').textContent = num(rows.length) + ' transfers'; }
  put('smKpis', [
    ['Transfers', num(rows.length), 'Between savings and current accounts', ''],
    ['Value moved', svM(sum(rows.filter(t => t.status === 'Completed'), t => t.amount)), 'Completed transfers', ''],
    ['Completed', num(rows.filter(t => t.status === 'Completed').length), 'Posted to both sides', ''],
    ['Awaiting approval', num(rows.filter(t => t.status === 'Pending approval').length), 'Needs a signature', ''],
    ['Failed', num(rows.filter(t => t.status === 'Failed').length), 'Provider or balance refused', ''],
    ['Transfer fees', svM(sum(rows.filter(t => t.status === 'Completed'), t => t.fee)), 'At ' + svM(SV_SET.transferFeeFlat) + ' each', ''],
    ['Beneficiaries saved', num(SV_BENEFICIARIES.length), 'Accounts and wallets on file', ''],
    ['Average transfer', svM(rows.length ? sum(rows, t => t.amount) / rows.length : 0), 'Per transfer', '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join(''));

  svFillSel('smFrom', svAllAccounts());
  const from = SV_ACC_BY_ID[el('smFrom') ? el('smFrom').value : ''] || SV_ACCOUNTS[0];
  const destPairs = SV_ACCOUNTS.filter(a => a.id !== (from || {}).id).map(a => [a.id, a.id + ' · ' + custName(a.cust) + ' · ' + svM(a.available)]);
  if(el('smTo')) svFillSel('smTo', destPairs);
  if(el('smPurpose') && !el('smPurpose').value) el('smPurpose').value = 'Sweep to the current account';
  put('smChecks', svSmChecks().checks.map(([l, ok, d]) => `<div class="checkrow"><div class="ck ${ok ? 'pass' : 'crit'}">${ok ? '✓' : '!'}</div>
      <div style="flex:1"><div style="font-size:10.5px;font-weight:800">${esc(l)}</div><div class="qhint">${esc(String(d))}</div></div>
      <div>${okb(ok ? 'Pass' : 'Failed')}</div></div>`).join(''));
  if(el('smMsg') && !String(el('smMsg').textContent || '').trim())
    el('smMsg').textContent = 'Posting a transfer debits one account, credits the other and writes two ledger legs in one transaction.';

  const loanRows = svLoanRows();
  svFillSel('smLoan', loanRows.map(l => [l.id, l.id + ' · ' + custName(l.cust) + ' · ' + svM(l.balance)]));
  if(el('smLoanPill')) el('smLoanPill').textContent = num(loanRows.length) + ' live loans';
  renderTable('smLoanBody', [
    {k: 'id', label: 'Loan'},
    {k: 'cust', label: 'Customer', html: v => esc(custName(v))},
    {k: 'balance', label: 'Balance', num: true, html: v => esc(svM(v))},
    {k: 'status', label: 'State', html: v => okb(v)}
  ], loanRows, {sort: 'balance', pageSize: 4});

  const tracked = rows.filter(t => !['Completed', 'Cancelled'].includes(t.status));
  put('smTrack', tracked.length ? tracked.slice(0, 5).map(t => `<div class="risk"><div>
      <div class="rn">${esc(t.id)} · ${esc(svM(t.amount))}</div>
      <div class="rs">${esc(custName(t.cust))} · ${esc(t.source)} → ${esc(String(t.dest))} · ${esc(svWhen(t.when))}</div></div>
      <div class="rv">${okb(t.status)}</div></div>`).join('')
    : '<div class="qhint">Every transfer has settled — nothing is in flight.</div>');
  put('smDupBox', `<div class="minihead">Duplicate prevention</div>`
    + kvRow('Window', SV_SET.duplicateWindow ? 'Inside ' + SV_SET.duplicateWindow + ' minutes' : 'Ten minutes')
    + kvRow('Same source, destination and amount', 'Held')
    + kvRow('Groups held now', String(SV_DUPLICATES.length))
    + kvRow('Confirmed by the customer', 'Required before a second attempt'));

  if(el('smFailHead')) el('smFailHead').innerHTML = '<tr><th>Transaction</th><th class="num">Amount</th><th>Reason</th></tr>';
  if(el('smFailBody')) el('smFailBody').innerHTML = SV_FAILED.filter(f => f.kind === 'Transfer' || f.kind === 'Deposit').slice(0, 5)
    .map(f => `<tr><td>${esc(f.ref)}</td><td class="num">${esc(svM(f.amount))}</td><td><span class="wraptext">${esc(f.reason)}</span></td></tr>`).join('')
    || '<tr><td colspan="3" class="empty">No transfer has failed.</td></tr>';

  if(el('smHistPill')) el('smHistPill').textContent = num(rows.length) + ' transfers';
  const list = rows.slice().sort((a, b) => String(b.when).localeCompare(String(a.when)));
  list.forEach(t => { t._open = () => { SV_SM_STATE.sel = t.id; openSavingsTxn(t); }; });
  renderTable('smBody', [
    {k: 'id', label: 'Transfer'},
    {k: 'when', label: 'When', html: v => esc(svWhen(v))},
    {k: 'cust', label: 'Customer', html: v => esc(custName(v))},
    {k: 'source', label: 'From'},
    {k: '_to', label: 'To', html: (v, r) => esc(String(r.destName && r.dest !== r.account ? r.dest : (r.dest || '—')))},
    {k: 'amount', label: 'Amount', num: true, html: v => esc(svM(v))},
    {k: 'fee', label: 'Fee', num: true, html: v => esc(svM(v))},
    {k: 'status', label: 'State', html: v => okb(v)}
  ], list, {sort: 'when', pageSize: 8});

  put('smReconBox', `<div class="minihead">Reconciliation</div>`
    + kvRow('Transfers posted', String(rows.filter(t => t.status === 'Completed').length))
    + kvRow('Value out of the source', svM(sum(rows.filter(t => t.status === 'Completed'), t => t.amount + t.fee)))
    + kvRow('Value into the destination', svM(sum(rows.filter(t => t.status === 'Completed'), t => t.amount)))
    + kvRow('Fees retained', svM(sum(rows.filter(t => t.status === 'Completed'), t => t.fee)))
    + kvRow('Both legs present', okb('Yes')));

  if(el('smAuditPill')) el('smAuditPill').textContent = num(SV_AUDIT_LOG.filter(a => /transfer/i.test(a.action)).length) + ' actions';
  if(el('smAuditHead')) el('smAuditHead').innerHTML = '<tr><th>When</th><th>Action</th><th>Target</th><th>Officer</th></tr>';
  if(el('smAuditBody')) el('smAuditBody').innerHTML = SV_AUDIT_LOG.filter(a => /transfer/i.test(a.action)).slice(0, 8)
    .map(a => `<tr><td>${esc(a.when)}</td><td>${esc(a.action)}</td><td>${esc(a.target)}</td><td>${esc(a.by)}</td></tr>`).join('')
    || '<tr><td colspan="4" class="empty">No transfer has been posted from this page yet.</td></tr>';
}

/* ===================== 15 · NOTIFICATIONS AND REMINDERS ===================== */
function renderNotifications(){
  const rules = SV_NOTIFY_RULES;
  const log = SV_NOTIFY_LOG;
  const delivered = log.filter(l => l.status === 'Delivered');
  if(el('ntPill')){ el('ntPill').className = 'badge b-ok'; el('ntPill').textContent = SV_CHANNELS.sms.status + ' · ' + SV_CHANNELS.email.status; }
  put('ntKpis', [
    ['Messages sent', num(log.length), 'SMS and email together', ''],
    ['Delivered', num(delivered.length), num(Math.round(pct(delivered.length, Math.max(1, log.length)))) + '% of those sent', ''],
    ['Awaiting provider', num(log.filter(l => l.status === 'Awaiting provider').length), 'The provider has not confirmed delivery', ''],
    ['Failed', num(log.filter(l => l.status === 'Failed').length), 'The provider refused', log.some(l => l.status === 'Failed') ? 'red' : ''],
    ['SMS credit', num(SV_CHANNELS.sms.balance), 'Messages left on the account', ''],
    ['Email quota', SV_CHANNELS.email.balance, 'This month', ''],
    ['Rules switched on', num(rules.filter(r => r.on).length) + ' of ' + num(rules.length), 'Events that send a message', ''],
    ['SMS latency', SV_CHANNELS.sms.latency + ' ms', 'From request to handset', '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join(''));

  if(el('ntRulePill')) el('ntRulePill').textContent = num(rules.length) + ' rules';
  if(el('ntHead')) el('ntHead').innerHTML = '<tr><th>Event</th><th>Recipient</th><th>Template</th><th>SMS</th><th>Email</th><th>Control</th></tr>';
  if(el('ntBody')) el('ntBody').innerHTML = rules.map(r => `<tr>
      <td><b>${esc(r.event)}</b><div class="qhint">${r.sms ? 'SMS' : ''}${r.sms && r.email ? ' · ' : ''}${r.email ? 'Email' : ''}</div></td>
      <td>${esc(r.to)}</td><td>${esc(r.template)}</td>
      <td>${r.sms ? okb('On') : badge('Off', 'b-gray')}</td>
      <td>${r.email ? okb('On') : badge('Off', 'b-gray')}</td>
      <td><button class="btn btn-ghost" data-ntrule="${esc(r.event)}">${r.on ? 'Switch off' : 'Switch on'}</button></td>
    </tr>`).join('');

  put('ntConn', kvRow('SMS provider', SV_CHANNELS.sms.provider)
    + kvRow('SMS sender', SV_CHANNELS.sms.sender)
    + kvRow('SMS status', okb(SV_CHANNELS.sms.status))
    + kvRow('SMS credential', SV_CHANNELS.sms.credential)
    + kvRow('Email provider', SV_CHANNELS.email.provider)
    + kvRow('Email sender', SV_CHANNELS.email.sender)
    + kvRow('Email status', okb(SV_CHANNELS.email.status))
    + kvRow('Last send', esc(svWhen(SV_CHANNELS.email.lastSend))));
  if(el('ntMsg') && !String(el('ntMsg').textContent || '').trim())
    el('ntMsg').textContent = 'A test message is queued against the live connection and lands in the history below.';

  const low = SV_SAVINGS.filter(a => a.available < SV_SET.lowBalanceThreshold);
  put('ntLowBox', `<div class="minihead">Low balance alerts</div>`
    + kvRow('Threshold', svM(SV_SET.lowBalanceThreshold))
    + kvRow('Accounts below it', String(low.length))
    + kvRow('Most recent', low[0] ? low[0].id + ' · ' + svM(low[0].available) : 'None')
    + kvRow('Rule', rules.find(r => /Low balance/i.test(r.event)) ? okb('On') : badge('Off', 'b-gray')));
  const goals = SV_GOALS.filter(g => g.status === 'Active' && g.targetDate <= addDays(TODAY, SV_SET.goalReminderDays));
  put('ntGoalBox', `<div class="minihead">Goal reminders</div>`
    + kvRow('Reminder horizon', SV_SET.goalReminderDays + ' days before the target date')
    + kvRow('Goals inside it', String(goals.length))
    + kvRow('Nearest', goals[0] ? goals[0].name + ' · ' + fmtDate(goals[0].targetDate) : 'None')
    + kvRow('Rule', rules.find(r => /goal/i.test(r.event)) ? okb('On') : badge('Off', 'b-gray')));
  const fixed = SV_SAVINGS.filter(a => (SV_PROD_BY_ID[a.product] || {}).kind === 'Fixed-term');
  put('ntMatBox', `<div class="minihead">Fixed-term maturity</div>`
    + kvRow('Plans on the book', String(fixed.length))
    + kvRow('Value', svM(sum(fixed, a => a.available)))
    + kvRow('Next to mature', fixed[0] ? fixed[0].id + ' · ' + fmtDate(addDays(TODAY, 21)) : 'None')
    + kvRow('Rule', rules.find(r => /maturity/i.test(r.event)) ? okb('On') : badge('Off', 'b-gray')));
  put('ntDormBox', `<div class="minihead">Dormant account notices</div>`
    + kvRow('Dormant now', String(SV_SAVINGS.filter(a => a.status === 'Dormant').length))
    + kvRow('Dormancy period', SV_SET.dormantDays + ' days')
    + kvRow('Notice sent', esc(fmtDate(addDays(TODAY, -5))))
    + kvRow('Rule', rules.find(r => /Dormant/i.test(r.event)) ? okb('On') : badge('Off', 'b-gray')));

  if(el('ntDelPill')) el('ntDelPill').textContent = num(delivered.length) + ' delivered';
  const byChannel = ['SMS', 'Email'].map(ch => {
    const sub = log.filter(l => l.channel === ch);
    return {channel: ch, sent: sub.length,
      delivered: sub.filter(l => l.status === 'Delivered').length,
      queued: sub.filter(l => l.status === 'Awaiting provider').length,
      failed: sub.filter(l => l.status === 'Failed').length,
      rate: Math.round(pct(sub.filter(l => l.status === 'Delivered').length, Math.max(1, sub.length))) + '%'};
  });
  renderTable('ntDelBody', [
    {k: 'channel', label: 'Channel'},
    {k: 'sent', label: 'Sent', num: true},
    {k: 'delivered', label: 'Delivered', num: true},
    {k: 'queued', label: 'Awaiting provider', num: true},
    {k: 'failed', label: 'Failed', num: true},
    {k: 'rate', label: 'Rate'}
  ], byChannel, {sort: 'sent', pageSize: 4});

  if(el('ntHistPill')) el('ntHistPill').textContent = num(log.length) + ' messages';
  renderTable('ntHistBody', [
    {k: 'when', label: 'When', html: v => esc(svWhen(v))},
    {k: 'event', label: 'Event'},
    {k: 'channel', label: 'Channel'},
    {k: 'to', label: 'To'},
    {k: 'status', label: 'State', html: v => okb(v)}
  ], log, {sort: 'when', pageSize: 7});

  put('ntGrid',
    chartBox({title: 'Messages by event', sub: 'SMS and email together', type: 'bar', h: 200,
      cats: rules.map(r => r.event.split(' ')[0]),
      series: [{name: 'Messages', data: rules.map(r => log.filter(l => l.event === r.event).length)}],
      value: num(log.length)}) +
    chartBox({title: 'Delivery by channel', sub: 'Delivered messages', type: 'donut', h: 200,
      cats: ['SMS', 'Email'],
      series: [{name: 'Delivered', data: byChannel.map(c => c.delivered)}],
      value: num(delivered.length)}));
}

/* ===================== 16 · DORMANT AND RESTRICTED ===================== */
function renderDormant(){
  const dormant = SV_SAVINGS.filter(a => a.status === 'Dormant' || (a.status !== 'Suspended' && daysBetween(a.lastMove, TODAY) > SV_SET.dormantDays));
  const suspended = SV_SAVINGS.filter(a => a.status === 'Suspended');
  const restricted = SV_SAVINGS.filter(a => a.status === 'Restricted' || (a.restriction !== 'None' && a.status !== 'Active'));
  if(el('drPill')){ el('drPill').className = 'badge b-warn'; el('drPill').textContent = num(dormant.length) + ' dormant'; }
  put('drKpis', [
    ['Dormant accounts', num(dormant.length), 'No movement for ' + SV_SET.dormantDays + ' days', ''],
    ['Value in dormant accounts', svM(sum(dormant, a => a.available)), 'Still the customer\'s money', ''],
    ['Restricted accounts', num(restricted.length), 'A condition applies', ''],
    ['Suspended accounts', num(suspended.length), 'Blocked until re-verified', ''],
    ['Reactivation requests', num(SV_REACTIVATIONS.length), 'Waiting for a decision', ''],
    ['Dormancy period', SV_SET.dormantDays + ' days', 'Configured in the settings', ''],
    ['Monthly dormancy fee', svM(SV_SET.dormancyFee), 'Charged once dormant', ''],
    ['Unclaimed records', num(SV_UNCLAIMED.length), svM(sum(SV_UNCLAIMED, u => u.balance)) + ' held', '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join(''));

  if(el('drCfgDays') && !el('drCfgDays').value) el('drCfgDays').value = SV_SET.dormantDays;
  if(el('drCfgFee') && !el('drCfgFee').value) el('drCfgFee').value = SV_SET.dormancyFee;
  if(el('drMsg') && !String(el('drMsg').textContent || '').trim())
    el('drMsg').textContent = 'Saving a shorter period brings more accounts into the dormant register at once.';

  if(el('drHead')) el('drHead').innerHTML = '<tr><th>Account</th><th>Customer</th><th class="num">Balance</th><th>Last movement</th>'
    + '<th class="num">Days idle</th><th>State</th><th>Control</th></tr>';
  if(el('drBody')) el('drBody').innerHTML = dormant.slice(0, 24).map(a => `<tr>
      <td><b>${esc(a.id)}</b></td><td>${esc(custName(a.cust))}</td>
      <td class="num">${esc(svM(a.available))}</td><td>${esc(fmtDate(a.lastMove))}</td>
      <td class="num">${num(daysBetween(a.lastMove, TODAY))}</td><td>${okb(a.status)}</td>
      <td><button class="btn btn-ghost" data-dract="${esc(a.id)}">${a.status === 'Dormant' ? 'Reactivate' : 'Restrict'}</button></td></tr>`).join('')
    || '<tr><td colspan="7" class="empty">No account is dormant at this period.</td></tr>';

  if(el('drRestrictPill')) el('drRestrictPill').textContent = num(restricted.length) + ' restricted';
  if(el('drRestrictHead')) el('drRestrictHead').innerHTML = '<tr><th>Account</th><th>Customer</th><th>Restriction</th><th>Since</th><th>State</th></tr>';
  if(el('drRestrictBody')) el('drRestrictBody').innerHTML = restricted.slice(0, 12).map(a => `<tr>
      <td><b>${esc(a.id)}</b></td><td>${esc(custName(a.cust))}</td>
      <td><span class="wraptext">${esc(a.restriction)}</span></td><td>${esc(fmtDate(addDays(TODAY, -21)))}</td>
      <td>${okb(a.status)}</td></tr>`).join('')
    || '<tr><td colspan="5" class="empty">No account is restricted.</td></tr>';

  if(el('drReqPill')) el('drReqPill').textContent = num(SV_REACTIVATIONS.length) + ' requests';
  if(el('drSuspHead')) el('drSuspHead').innerHTML = '<tr><th>Account</th><th>Customer</th><th class="num">Balance</th><th>State</th></tr>';
  if(el('drSuspBody')) el('drSuspBody').innerHTML = suspended.slice(0, 6).map(a => `<tr>
      <td><b>${esc(a.id)}</b></td><td>${esc(custName(a.cust))}</td>
      <td class="num">${esc(svM(a.available))}</td><td>${okb(a.status)}</td></tr>`).join('')
    || '<tr><td colspan="4" class="empty">No account is suspended.</td></tr>';
  if(el('drReqHead')) el('drReqHead').innerHTML = '<tr><th>Request</th><th>Account</th><th>Reason</th><th>State</th><th>Control</th></tr>';
  if(el('drReqBody')) el('drReqBody').innerHTML = SV_REACTIVATIONS.map(r => `<tr>
      <td>${esc(r.id)}</td><td>${esc(r.account)}</td><td>${esc(String(r.reason).slice(0, 30))}</td>
      <td>${okb(r.status)}</td>
      <td><button class="btn btn-ghost" data-drreq="${esc(r.id)}">${r.status === 'Pending' ? 'Approve' : 'Re-verify'}</button></td></tr>`).join('')
    || '<tr><td colspan="5" class="empty">No reactivation request is open.</td></tr>';

  if(el('drUncHead')) el('drUncHead').innerHTML = '<tr><th>Account</th><th>Customer</th><th class="num">Balance</th><th class="num">Years</th><th>Holder</th></tr>';
  if(el('drUncBody')) el('drUncBody').innerHTML = SV_UNCLAIMED.map(u => `<tr>
      <td>${esc(u.account)}</td><td>${esc(custName(u.cust))}</td>
      <td class="num">${esc(svM(u.balance))}</td><td class="num">${num(u.years)}</td>
      <td>${esc(u.holder)}</td></tr>`).join('')
    || '<tr><td colspan="5" class="empty">Nothing has been unclaimed for long enough.</td></tr>';

  if(el('drHistPill')) el('drHistPill').textContent = num(SV_RESTRICTIONS.length + SV_REACTIVATIONS.length) + ' events';
  if(el('drHistHead')) el('drHistHead').innerHTML = '<tr><th>When</th><th>Account</th><th>Event</th><th>Officer</th><th>State</th></tr>';
  if(el('drHistBody')) el('drHistBody').innerHTML =
    SV_RESTRICTIONS.slice(0, 6).map(r => `<tr><td>${esc(fmtDate(r.since))}</td><td>${esc(r.account)}</td>
      <td>Restriction applied</td><td>${esc(staffName(r.by))}</td><td>${okb(r.status)}</td></tr>`).join('')
    + SV_REACTIVATIONS.map(r => `<tr><td>${esc(svWhen(r.when))}</td><td>${esc(r.account)}</td>
      <td>Reactivation requested</td><td>${esc(staffName(r.by))}</td><td>${okb(r.status)}</td></tr>`).join('')
    || '<tr><td colspan="5" class="empty">Nothing recorded.</td></tr>';
}
</script>
