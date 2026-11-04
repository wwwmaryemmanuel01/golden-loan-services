<script>
/* ============================================================
   FEES & PENALTIES (6/8)
   Sections 13–16: the customer notices, the double-entry ledger,
   the repayment and payment connections, and the permissions that
   decide who may assess, waive, reverse or configure a charge.
   ============================================================ */

/* ---------------- 13 · CUSTOMER NOTIFICATIONS ---------------- */
function renderNotices(){
  const rulesOn = FEE_NOTIFY_RULES.filter(r => r.on).length;
  const log = FEE_NOTIFY_LOG;
  const delivered = log.filter(l => l.status === 'Delivered').length;
  const failed = log.filter(l => l.status === 'Failed').length;
  const dueSoon = CHARGES.filter(c => c.balance > 0 && daysBetween(TODAY, c.due) >= -30 && daysBetween(TODAY, c.due) <= 14);
  const aboutTo = CHARGES.filter(c => c.kind === 'Penalty' && c.balance > 0 && c.daysLate <= FEE_RULES.graceDays + 3);

  if(el('ntPill')){ el('ntPill').className = 'badge b-ok'; el('ntPill').textContent = num(rulesOn) + ' notices live'; }
  put('ntKpis', [
    ['Notice rules', num(FEE_NOTIFY_RULES.length), 'Every event that tells the customer', ''],
    ['Rules switched on', num(rulesOn), 'A rule off sends nothing', ''],
    ['Messages sent', num(log.length), 'SMS and email', ''],
    ['Delivered', num(delivered), pct(delivered, log.length).toFixed(1) + '% of the traffic', ''],
    ['Failed', num(failed), 'Worth a retry', failed ? 'red' : ''],
    ['Charges due a reminder', num(dueSoon.length), 'Inside the next 14 days', ''],
    ['Penalties approaching', num(aboutTo.length), 'Grace is nearly up', aboutTo.length ? 'amber' : ''],
    ['Channels connected', num(2), 'SMS and email', '']
  ].map(([l, v, s, k]) => kpiCard(l, v, s, k)).join(''));

  if(el('ntRulePill')) el('ntRulePill').textContent = num(rulesOn) + ' on';
  const rules = FEE_NOTIFY_RULES.map((r, i) => Object.assign({}, r, {idx: i}));
  renderTable('ntRuleBody', [
    {k: 'event', label: 'Event'},
    {k: 'channel', label: 'Channel'},
    {k: 'to', label: 'Who'},
    {k: 'template', label: 'Template'},
    {k: 'on', label: 'State', html: (v, r) => `<button class="btn btn-ghost btn-sm" data-fpnotif="${r.idx}">${v ? 'On' : 'Off'}</button>`}
  ], rules, {sort: 'event', pageSize: 10});

  if(el('ntConnPill')) el('ntConnPill').textContent = 'both up';
  put('ntConn', ['sms', 'email'].map(k => {
    const c = FEE_CHANNELS[k];
    return `<div class="risk"><div><div class="rn">${esc(k === 'sms' ? 'SMS' : 'Email')} · ${esc(c.provider)}</div>
      <div class="rs">${esc(c.sender)} · ${k === 'sms' ? num(c.balance) + ' credits left' : 'unlimited'} ·
        ${num(c.latency)} ms · last ${esc(fpWhen(c.lastSend))}</div></div>
      <div class="rv">${okb(c.status)}</div></div>`;
  }).join(''));

  if(el('ntDuePill')) el('ntDuePill').textContent = num(dueSoon.length) + ' due';
  renderTable('ntDueBody', [
    {k: 'id', label: 'Charge'},
    {k: 'typeName', label: 'Type'},
    {k: 'cust', label: 'Customer', html: v => esc(custName(v))},
    {k: 'due', label: 'Due', html: v => esc(fmtDate(v))},
    {k: 'balance', label: 'Balance', num: true, html: v => esc(fpM(v))},
    {k: 'status', label: 'State', html: v => okb(v)}
  ], dueSoon, {sort: 'balance', pageSize: 6});

  if(el('ntWarnPill')) el('ntWarnPill').textContent = num(aboutTo.length) + ' approaching';
  put('ntWarnBox', aboutTo.length ? aboutTo.slice(0, 6).map(c => `<div class="risk">
      <div><div class="rn">${esc(c.id)} · ${esc(custName(c.cust))}</div>
        <div class="rs">${esc(c.typeName)} · ${num(c.daysLate)} days late · grace ${num(FEE_RULES.graceDays)} days ·
          ${esc(fpM(c.balance))} owing</div></div>
      <div class="rv">${badge('Warn now', 'b-warn')}</div></div>`).join('')
    : '<div class="qhint">No penalty is inside the warning window.</div>'
    + `<div class="qhint" style="margin-top:8px">The warning goes out before the first day of penalty, so a customer can
        still pay inside the grace period.</div>`);

  if(el('ntLogPill')) el('ntLogPill').textContent = num(log.length) + ' messages';
  renderTable('ntLogBody', [
    {k: 'when', label: 'When', html: v => esc(fpWhen(v))},
    {k: 'event', label: 'Event'},
    {k: 'channel', label: 'Channel'},
    {k: 'to', label: 'To'},
    {k: 'reference', label: 'Reference'},
    {k: 'template', label: 'Template'},
    {k: 'status', label: 'State', html: v => okb(v)}
  ], log, {sort: 'when', pageSize: 10});

  put('ntGrid',
    chartBox({title: 'Messages by channel', sub: 'SMS against email', type: 'donut', h: 210,
      cats: ['SMS', 'Email'], value: num(log.length),
      series: [{name: 'Messages', data: ['SMS', 'Email'].map(ch => log.filter(l => l.channel === ch).length)}]}) +
    chartBox({title: 'Delivery outcomes', sub: 'Delivered, awaiting the provider and failed', type: 'bar', h: 210,
      cats: ['Delivered', 'Awaiting provider', 'Failed'], value: num(delivered),
      series: [{name: 'Messages', colour: '#1E9E6A', data: ['Delivered', 'Awaiting provider', 'Failed'].map(s => log.filter(l => l.status === s).length)}]}));
}
function fpNotifyToggle(i){
  const r = FEE_NOTIFY_RULES[i];
  if(!r) return;
  r.on = !r.on;
  fpAudit('Notice rule ' + (r.on ? 'enabled' : 'disabled'), r.event, r.on ? 'Off' : 'On', r.on ? 'On' : 'Off',
    FEE_STAFF_REF, 'Customer communication setting', 'Notifications');
  renderAll();
  toast(r.event + ' notices are now ' + (r.on ? 'on' : 'off'), r.on ? 'ok' : 'err');
}
function fpTestChannel(ch){
  const c = FEE_CHANNELS[ch];
  if(!c) return;
  FEE_NOTIFY_LOG.unshift({when: TODAY + ' ' + fpNow(), event: 'Test message',
    channel: ch === 'sms' ? 'SMS' : 'Email',
    to: ch === 'sms' ? '+265 991 000 118' : 'fees@goldenloan.mw',
    reference: 'TEST-' + pad(100 + FEE_NOTIFY_LOG.length, 4), template: 'TEST-01', status: 'Delivered',
    lane: 'Notifications', severity: 'Low', owner: FEE_STAFF_REF, region: 'Head office'});
  c.lastSend = TODAY + ' ' + fpNow();
  fpAudit('Test notification', ch.toUpperCase(), c.provider, 'Delivered', FEE_STAFF_REF, 'Channel checked', 'Notifications');
  if(el('ntMsg')) el('ntMsg').textContent = 'A test ' + (ch === 'sms' ? 'SMS' : 'email')
    + ' was accepted by ' + c.provider + ' at ' + fpNow() + '.';
  renderAll();
  toast('Test ' + ch.toUpperCase() + ' accepted', 'ok');
}

/* ---------------- 14 · ACCOUNTING AND LEDGER ---------------- */
function renderLedger(){
  const rows = FEE_LEDGER;
  const debits = sum(rows, r => r.debit);
  const credits = sum(rows, r => r.credit);
  const balanced = Math.abs(debits - credits) <= 1;
  const accounts = new Set(rows.map(r => r.account));
  const assessed = sum(CHARGES, c => c.amount - c.reversed);
  const collected = sum(CHARGES, c => c.paid);
  if(el('lgPill')){ el('lgPill').className = 'badge ' + (balanced ? 'b-ok' : 'b-crit');
    el('lgPill').textContent = balanced ? 'balanced' : 'out of balance'; }
  put('lgKpis', [
    ['Journal entries', num(rows.length), 'Every assessment, collection, waiver and reversal', ''],
    ['Debits', fpM(debits), 'Must equal the credits', ''],
    ['Credits', fpM(credits), balanced ? 'In balance' : 'A difference is sitting there', balanced ? '' : 'red'],
    ['Accounts touched', num(accounts.size), 'Receivable, income, cash and waiver expense', ''],
    ['Assessed net of reversals', fpM(assessed), 'What the charge book says', ''],
    ['Collected', fpM(collected), 'What the ledger says came in', ''],
    ['Posted this month', num(rows.filter(r => r.when.slice(0, 7) === TODAY.slice(0, 7)).length), 'Current month', ''],
    ['Duplicates refused', num(FEE_DB_ERRORS.filter(e => /duplicate/i.test(e.message)).length), 'The guard held', '']
  ].map(([l, v, s, k]) => kpiCard(l, v, s, k)).join(''));

  if(el('lgCount')) el('lgCount').textContent = num(rows.length) + ' entries';
  renderTable('lgBody', [
    {k: 'id', label: 'Entry'},
    {k: 'when', label: 'When', html: v => esc(fmtDate(v))},
    {k: 'charge', label: 'Charge'},
    {k: 'narration', label: 'Narration'},
    {k: 'account', label: 'Account'},
    {k: 'side', label: 'Dr/Cr'},
    {k: 'debit', label: 'Debit', num: true, html: v => esc(v ? fpM(v) : '—')},
    {k: 'credit', label: 'Credit', num: true, html: v => esc(v ? fpM(v) : '—')},
    {k: 'cust', label: 'Customer', html: v => esc(custName(v))},
    {k: 'status', label: 'State', html: v => okb(v)}
  ], rows, {sort: 'debit', pageSize: 12});

  if(el('lgReconPill')) el('lgReconPill').textContent = balanced ? 'agree' : 'check';
  put('lgReconBox', [
    ['Assessed on the charge book', fpM(assessed)],
    ['Assessed in the ledger', fpM(sum(rows.filter(r => /Assessment/.test(r.narration)), r => r.debit))],
    ['Collected on the charges', fpM(collected)],
    ['Collected in the ledger', fpM(sum(rows.filter(r => /Collection/.test(r.narration)), r => r.debit))],
    ['Difference', fpM(Math.abs(sum(rows.filter(r => /Assessment/.test(r.narration)), r => r.debit) - assessed))]
  ].map(([k, v]) => kvRow(k, v)).join(''));

  if(el('lgBalPill')) el('lgBalPill').textContent = balanced ? 'Dr = Cr' : 'Dr ≠ Cr';
  put('lgBalBox', strip([
    ['Debits', fpM(debits)],
    ['Credits', fpM(credits)],
    ['Difference', fpM(Math.abs(debits - credits))],
    ['Entries', num(rows.length)]
  ]) + kvRow('Double entry', balanced ? badge('Every entry has its pair', 'b-ok') : badge('A pair is missing', 'b-crit')));
  put('lgSplitBox', [
    ['Fee income', fpM(sum(rows.filter(r => r.account === 'Fee income'), r => r.credit))],
    ['Penalty income', fpM(sum(rows.filter(r => r.account === 'Penalty income'), r => r.credit))],
    ['Fee receivable', fpM(sum(rows.filter(r => r.account === 'Fee receivable'), r => r.debit) - sum(rows.filter(r => r.account === 'Fee receivable'), r => r.credit))],
    ['Cash and bank', fpM(sum(rows.filter(r => r.account === 'Cash and bank'), r => r.debit) - sum(rows.filter(r => r.account === 'Cash and bank'), r => r.credit))],
    ['Waiver expense', fpM(sum(rows.filter(r => r.account === 'Waiver expense'), r => r.debit))]
  ].map(([k, v]) => kvRow(k, v)).join(''));

  if(el('lgDupPill')) el('lgDupPill').textContent = 'one per charge';
  const grouped = {};
  rows.forEach(r => { const k = r.charge + '|' + r.narration; grouped[k] = (grouped[k] || 0) + 1; });
  const twins = Object.keys(grouped).filter(k => grouped[k] !== 2);
  put('lgDupBox', twins.length ? twins.slice(0, 6).map(k => kvRow(k.split('|')[0], badge(grouped[k] + ' entries', 'b-crit'))).join('')
    : kvRow('Every charge has exactly one pair of entries', badge('Verified', 'b-ok'))
      + kvRow('Refused by', 'A unique key on the charge and the narration')
      + kvRow('Checked', num(Object.keys(grouped).length) + ' charge and narration pairs'));

  const byAcc = {};
  rows.forEach(r => {
    byAcc[r.account] = byAcc[r.account] || {account: r.account, debit: 0, credit: 0, entries: 0};
    byAcc[r.account].debit += r.debit; byAcc[r.account].credit += r.credit; byAcc[r.account].entries++;
  });
  if(el('lgSumPill')) el('lgSumPill').textContent = num(Object.keys(byAcc).length) + ' accounts';
  renderTable('lgSumBody', [
    {k: 'account', label: 'Account'},
    {k: 'debit', label: 'Debit', num: true, html: v => esc(fpM(v))},
    {k: 'credit', label: 'Credit', num: true, html: v => esc(fpM(v))},
    {k: 'entries', label: 'Entries', num: true},
    {k: 'net', label: 'Net', num: true, html: (v, r) => esc(fpM(r.debit - r.credit))}
  ], Object.keys(byAcc).map(k => byAcc[k]), {sort: 'debit', pageSize: 8});

  put('lgGrid',
    chartBox({title: 'Ledger by account', sub: 'Where the charge money sits', type: 'bar', h: 210,
      cats: Object.keys(byAcc), value: fpM(debits),
      series: [{name: 'Debits', data: Object.keys(byAcc).map(k => byAcc[k].debit), colour: '#2F6FED'},
        {name: 'Credits', data: Object.keys(byAcc).map(k => byAcc[k].credit), colour: '#1E9E6A'}]}) +
    chartBox({title: 'Fee and penalty income', sub: 'Month by month', type: 'bar', h: 210,
      cats: buckets().map(bucketLabel), value: fpM(sum(rows.filter(r => /income/.test(r.account)), r => r.credit)),
      series: [{name: 'Income', data: seriesBy(rows.filter(r => /income/.test(r.account)), r => r.when, r => r.credit).data, colour: '#C9A227'}]}));
}
function fpLedgerReconcile(){
  const assessedLedger = sum(FEE_LEDGER.filter(r => /Assessment/.test(r.narration)), r => r.debit);
  const assessedBook = sum(CHARGES, c => c.amount - c.reversed);
  const collectedLedger = sum(FEE_LEDGER.filter(r => /Collection/.test(r.narration)), r => r.debit);
  const collectedBook = sum(CHARGES, c => c.paid);
  const diff = Math.abs(assessedLedger - assessedBook) + Math.abs(collectedLedger - collectedBook);
  fpAudit('Reconcile the ledger', 'Fee receivable', '—', diff <= 1 ? 'Agrees' : 'Difference ' + fpM(diff),
    FEE_STAFF_REF, 'Assessed against collected', 'Ledger');
  if(el('lgReconPill')) el('lgReconPill').textContent = diff <= 1 ? 'agree' : 'difference';
  put('lgReconBox', [
    ['Assessed on the charge book', fpM(assessedBook)],
    ['Assessed in the ledger', fpM(assessedLedger)],
    ['Collected on the charges', fpM(collectedBook)],
    ['Collected in the ledger', fpM(collectedLedger)],
    ['Result', diff <= 1 ? badge('Reconciled', 'b-ok') : badge('Difference ' + fpM(diff), 'b-crit')]
  ].map(([k, v]) => kvRow(k, v)).join(''));
  toast(diff <= 1 ? 'Ledger reconciled against the charge book' : 'A difference of ' + fpM(diff) + ' remains', diff <= 1 ? 'ok' : 'err');
}

/* ---------------- 15 · PAYMENT AND REPAYMENT CONNECTIONS ---------------- */
function renderPaymentLinks(){
  const linked = CHARGES.filter(c => c.loan);
  const pays = PAYS.slice(0, 200);
  const receipts = COLLECTIONS.filter(c => c.receipt);
  const collected = sum(COLLECTIONS, c => c.amount);
  const failed = COLLECTIONS.filter(c => c.status === 'Reversed');
  if(el('cnPill')){ el('cnPill').className = 'badge b-ok'; el('cnPill').textContent = num(linked.length) + ' charges linked'; }
  put('cnKpis', [
    ['Charges linked to a loan', num(linked.length), 'Every charge points at its loan', ''],
    ['Repayments read', num(PAYS.length), 'Instalments the engine walks', ''],
    ['Schedules read', num(LOANS.length * 12), 'Due dates behind the penalties', ''],
    ['Receipts', num(receipts.length), 'One for every collection', ''],
    ['Allocations', num(COLLECTIONS.length), 'Against a specific charge', ''],
    ['Collected', fpM(collected), 'Through this connection', ''],
    ['Failed or reversed', num(failed.length), 'Backed out of a charge', failed.length ? 'red' : ''],
    ['Part payments', num(PAYS.filter(p => p.status === 'Partial').length), 'Instalments covered in part', '']
  ].map(([l, v, s, k]) => kpiCard(l, v, s, k)).join(''));

  const MAP = [
    {link: 'Repayment records', direction: 'read', rows: PAYS.length, health: 'Connected', use: 'A late instalment is what starts a penalty'},
    {link: 'Repayment schedules', direction: 'read', rows: LOANS.length * 12, health: 'Connected', use: 'The due dates the engine compares against today'},
    {link: 'Payment receipts', direction: 'read and write', rows: PAYS.length + COLLECTIONS.length, health: 'Connected', use: 'Every charge collection gets a receipt'},
    {link: 'Repayment allocations', direction: 'write', rows: COLLECTIONS.length, health: 'Connected', use: 'Principal, interest, fees and penalties kept apart'},
    {link: 'Loan accounts', direction: 'read', rows: LOANS.length, health: 'Connected', use: 'The charge hangs from the loan and the customer'},
    {link: 'Loan products', direction: 'read', rows: PRODUCTS.length, health: 'Connected', use: 'Which fees and penalties apply'},
    {link: 'Payment methods', direction: 'read', rows: METHODS.length, health: 'Connected', use: 'How each charge was paid'},
    {link: 'Payment reversals', direction: 'write', rows: failed.length, health: failed.length ? 'Watch' : 'Connected', use: 'A bounced collection puts the charge back'}
  ];
  if(el('cnMapPill')) el('cnMapPill').textContent = num(MAP.length) + ' connections';
  renderTable('cnMapBody', [
    {k: 'link', label: 'Connection'},
    {k: 'direction', label: 'Direction'},
    {k: 'rows', label: 'Rows', num: true},
    {k: 'use', label: 'What it is for'},
    {k: 'health', label: 'State', html: v => okb(v)}
  ], MAP, {sort: 'rows', pageSize: 8});

  if(el('cnRepayPill')) el('cnRepayPill').textContent = num(PAYS.filter(p => p.fees > 0).length) + ' carried a fee';
  renderTable('cnRepayBody', [
    {k: 'ref', label: 'Receipt'},
    {k: 'loan', label: 'Loan'},
    {k: 'due', label: 'Instalment due', html: v => esc(fmtDate(v))},
    {k: 'date', label: 'Paid on', html: v => esc(fmtDate(v))},
    {k: 'amount', label: 'Amount', num: true, html: v => esc(fpM(v))},
    {k: 'fees', label: 'Fees inside', num: true, html: v => esc(fpM(v))},
    {k: 'timing', label: 'Timing', html: v => okb(v)}
  ], PAYS.filter(p => p.fees > 0 || p.timing === 'Late').slice(0, 120), {sort: 'amount', pageSize: 8});

  if(el('cnSchedPill')) el('cnSchedPill').textContent = num(LOANS.length) + ' schedules';
  renderTable('cnSchedBody', [
    {k: 'ref', label: 'Loan'},
    {k: 'cust', label: 'Customer', html: v => esc(custName(v))},
    {k: 'instalment', label: 'Instalment', num: true, html: v => esc(fpM(v))},
    {k: 'term', label: 'Term', num: true},
    {k: 'unpaidInstalments', label: 'Unpaid', num: true},
    {k: 'dpd', label: 'Days past due', num: true},
    {k: 'ageBucket', label: 'Age', html: v => okb(v)}
  ], LOANS.filter(l => l.unpaidInstalments > 0), {sort: 'dpd', pageSize: 8});

  if(el('cnReceiptPill')) el('cnReceiptPill').textContent = num(receipts.length) + ' receipts';
  renderTable('cnReceiptBody', [
    {k: 'receipt', label: 'Receipt'},
    {k: 'when', label: 'When', html: v => esc(fmtDate(v))},
    {k: 'charge', label: 'Charge'},
    {k: 'amount', label: 'Amount', num: true, html: v => esc(fpM(v))},
    {k: 'method', label: 'Method'}
  ], receipts, {sort: 'amount', pageSize: 6});
  renderTable('cnAllocBody', [
    {k: 'charge', label: 'Charge'},
    {k: 'kind', label: 'Kind', html: v => okb(v)},
    {k: 'amount', label: 'Allocated', num: true, html: v => esc(fpM(v))},
    {k: 'status', label: 'State', html: v => okb(v)}
  ], COLLECTIONS, {sort: 'amount', pageSize: 6});

  if(el('cnMethodPill')) el('cnMethodPill').textContent = num(METHODS.length) + ' methods';
  put('cnMethodBox', METHODS.map(m => {
    const set = COLLECTIONS.filter(c => c.method === m);
    return kvRow(m, num(set.length) + ' · ' + fpM(sum(set, c => c.amount)));
  }).join(''));
  put('cnPartialBox', strip([
    ['Part-paid instalments', num(PAYS.filter(p => p.status === 'Partial').length)],
    ['Part-paid charges', num(CHARGES.filter(c => c.status === 'Part paid').length)],
    ['Value part paid', fpM(sum(CHARGES.filter(c => c.status === 'Part paid'), c => c.balance))]
  ]) + kvRow('Rule', 'A part payment reduces what is owed and the penalty is recalculated on the remainder'));

  renderTable('cnFailBody', [
    {k: 'id', label: 'Collection'},
    {k: 'charge', label: 'Charge'},
    {k: 'amount', label: 'Amount', num: true, html: v => esc(fpM(v))},
    {k: 'when', label: 'When', html: v => esc(fmtDate(v))},
    {k: 'status', label: 'State', html: v => okb(v)}
  ], failed, {sort: 'amount', pageSize: 5});

  if(el('cnReconPill')) el('cnReconPill').textContent = 'matched';
  put('cnReconBox', strip([
    ['Collections', num(COLLECTIONS.length)],
    ['Value collected', fpM(collected)],
    ['Paid on the charges', fpM(sum(CHARGES, c => c.paid))],
    ['Receipts issued', num(receipts.length)],
    ['Difference', fpM(Math.abs(collected - sum(CHARGES, c => c.paid)))]
  ]) + kvRow('Unexplained differences', badge(Math.abs(collected - sum(CHARGES, c => c.paid)) <= 1 ? 'None' : 'One or more',
    Math.abs(collected - sum(CHARGES, c => c.paid)) <= 1 ? 'b-ok' : 'b-crit')));

  put('cnGrid',
    chartBox({title: 'Collections by method', sub: 'How charge payments arrive', type: 'bar', h: 210,
      cats: METHODS, value: fpM(collected),
      series: [{name: 'Collected', data: METHODS.map(m => sum(COLLECTIONS.filter(c => c.method === m), c => c.amount)), colour: '#1E9E6A'}]}) +
    chartBox({title: 'Late repayments that carried a fee', sub: 'Instalments settled after the due date', type: 'donut', h: 210,
      cats: ['On time', 'Late'], value: num(pays.length),
      series: [{name: 'Instalments', data: [pays.filter(p => p.timing === 'On time').length,
        pays.filter(p => p.timing === 'Late').length]}]}));
}

/* ---------------- 16 · SECURITY AND PERMISSIONS ---------------- */
const FP_PERM_STATE = {};
FEE_ROLES.forEach(r => { FP_PERM_STATE[r] = (FEE_PERMS[r] || []).slice(); });
const FP_SENSITIVE = [
  ['Changing a penalty rate', 'Head of credit only', 'Moves the cost of borrowing'],
  ['Approving a waiver', 'Head of credit only', 'Writes value off the charge book'],
  ['Approving a reversal', 'Head of credit only', 'Takes a charge off a customer'],
  ['Deleting a charge', 'Nobody', 'A charge is reversed, never deleted'],
  ['Editing a posted ledger entry', 'Nobody', 'The ledger is append only'],
  ['Approving above MK 100,000', 'Two signatures', 'Above the delegated limit'],
  ['Exporting the audit trail', 'Auditor and administrator', 'Leaves the building'],
  ['Inspecting a customer account', 'Every role, logged', 'Read access is recorded too']
];
function renderSecurity(){
  const blocked = FEE_STAFF_ACTIONS.filter(a => a.outcome === 'Blocked');
  const unauth = FEE_STAFF_ACTIONS.filter(a => a.outcome === 'Blocked' && a.severity === 'High');
  if(el('scPill')){ el('scPill').className = 'badge ' + (unauth.length ? 'b-warn' : 'b-ok');
    el('scPill').textContent = num(blocked.length) + ' refused'; }
  put('scKpis', [
    ['Roles', num(FEE_ROLES.length), 'Each with a defined scope', ''],
    ['Capabilities', num(FEE_CAPS.length), 'From seeing a charge to changing a rate', ''],
    ['Sensitive actions', num(FP_SENSITIVE.length), 'Second signature or nobody', ''],
    ['Actions logged', num(FEE_STAFF_ACTIONS.length), 'Allowed and refused', ''],
    ['Refused attempts', num(blocked.length), 'The permission check held', blocked.length ? 'amber' : ''],
    ['Unauthorised changes', num(unauth.length), 'Worth investigating', unauth.length ? 'red' : ''],
    ['Approval thresholds', num(3), 'Assessment, waiver and reversal', ''],
    ['Self-approval', 'Blocked', 'Requester may not decide', '']
  ].map(([l, v, s, k]) => kpiCard(l, v, s, k)).join(''));

  if(el('scMatrixPill')) el('scMatrixPill').textContent = num(FEE_ROLES.length) + ' roles';
  if(el('scMatrixHead')) el('scMatrixHead').innerHTML = `<tr><th>Role</th>${FEE_CAPS.map(c => `<th>${esc(c)}</th>`).join('')}<th>Holder</th></tr>`;
  if(el('scMatrixBody')) el('scMatrixBody').innerHTML = FEE_ROLES.map(r => `<tr>
      <td><b>${esc(r)}</b></td>
      ${FEE_CAPS.map((c, i) => `<td><button class="btn btn-ghost btn-sm" data-fpperm="${esc(r)}" data-cap="${i}">${(FP_PERM_STATE[r] || [])[i] ? '✓' : '—'}</button></td>`).join('')}
      <td>${esc(staffName(FEE_ROLE_STAFF[r]))}</td></tr>`).join('');

  if(el('scCapPill')) el('scCapPill').textContent = num(FEE_CAPS.length) + ' rights';
  renderTable('scCapBody', [
    {k: 'cap', label: 'Right'},
    {k: 'what', label: 'What it allows'},
    {k: 'held', label: 'Held by', html: v => esc(v)}
  ], FEE_CAPS.map(c => ({cap: c,
    what: ({
      'View charges': 'Read a charge, its calculation and the customer account',
      'Create fee types': 'Add a new fee or penalty to the tariff',
      'Change rates': 'Move a percentage, a fixed amount, a grace period or a cap',
      'Assess fees': 'Raise a fee against an application or a loan',
      'Assess penalties': 'Run the penalty engine on an overdue instalment',
      'Record collections': 'Allocate a payment against a charge',
      'Approve waivers': 'Decide a waiver request',
      'Approve reversals': 'Decide a correction request',
      'Change settings': 'Alter the module configuration and thresholds',
      'Export audit': 'Take the audit trail out of the system'
    })[c] || c,
    held: FEE_ROLES.filter(r => (FP_PERM_STATE[r] || [])[FEE_CAPS.indexOf(c)]).join(', ')})),
    {sort: 'cap', pageSize: 10, onRow: false});

  if(el('scThrPill')) el('scThrPill').textContent = 'three limits';
  put('scThrBox', [
    ['Assessment needs a second signature above', fpM(FEE_RULES.assessmentApprovalAbove)],
    ['Waiver needs the head of credit above', fpM(FEE_RULES.waiverApprovalAbove)],
    ['Reversal needs the head of credit above', fpM(FEE_RULES.reversalApprovalAbove)],
    ['Approver must differ from the requester', badge('Enforced', 'b-ok')],
    ['Escalation', 'Above MK 500,000 the managing director also signs']
  ].map(([k, v]) => kvRow(k, v)).join(''));
  put('scSensBox', FP_SENSITIVE.map(([k, v]) => kvRow(k, esc(v))).join(''));

  if(el('scActPill')) el('scActPill').textContent = num(FEE_STAFF_ACTIONS.length) + ' actions';
  renderTable('scActBody', [
    {k: 'when', label: 'When', html: v => esc(fpWhen(v))},
    {k: 'staff', label: 'Staff member', html: v => esc(staffName(v))},
    {k: 'action', label: 'Action'},
    {k: 'record', label: 'Record'},
    {k: 'outcome', label: 'Outcome', html: v => okb(v)},
    {k: 'severity', label: 'Severity', html: v => badge(v, fpSev(v))}
  ], FEE_STAFF_ACTIONS, {sort: 'when', pageSize: 10});

  if(el('scUnauthPill')) el('scUnauthPill').textContent = num(unauth.length) + ' flagged';
  renderTable('scUnauthBody', [
    {k: 'when', label: 'When', html: v => esc(fpWhen(v))},
    {k: 'staff', label: 'Staff member', html: v => esc(staffName(v))},
    {k: 'action', label: 'Attempted'},
    {k: 'record', label: 'Record'},
    {k: 'outcome', label: 'Outcome', html: v => okb(v)}
  ], unauth.length ? unauth : blocked, {sort: 'when', pageSize: 6});

  if(el('scAuditPill')) el('scAuditPill').textContent = num(FEE_AUDIT.length) + ' entries';
  renderTable('scAuditBody', [
    {k: 'when', label: 'When', html: v => esc(fpWhen(v))},
    {k: 'kind', label: 'Kind'},
    {k: 'what', label: 'Setting'},
    {k: 'by', label: 'Officer', html: v => esc(staffName(v))}
  ], FEE_AUDIT, {sort: 'when', pageSize: 6});

  const byAction = new Set(FEE_STAFF_ACTIONS.map(a => a.action));
  put('scGrid',
    chartBox({title: 'Actions by outcome', sub: 'Allowed against refused', type: 'donut', h: 210,
      cats: ['Allowed', 'Blocked'], value: num(FEE_STAFF_ACTIONS.length),
      series: [{name: 'Actions', data: ['Allowed', 'Blocked'].map(o => FEE_STAFF_ACTIONS.filter(a => a.outcome === o).length)}]}) +
    chartBox({title: 'What staff touch most', sub: 'Action by action', type: 'bar', h: 210,
      cats: Array.from(byAction), value: num(byAction.size) + ' kinds',
      series: [{name: 'Actions', colour: '#7C5CF0',
        data: Array.from(byAction).map(a => FEE_STAFF_ACTIONS.filter(x => x.action === a).length)}]}));
}
function fpTogglePerm(role, cap){
  if(!FP_PERM_STATE[role]) return;
  if(role === 'Administrator' && FEE_CAPS[cap] === 'Approve waivers'){
    toast('Even the administrator may not approve a waiver they requested', 'err');
    return;
  }
  FP_PERM_STATE[role][cap] = FP_PERM_STATE[role][cap] ? 0 : 1;
  fpAudit('Permission changed', role + ' · ' + FEE_CAPS[cap], '—', FP_PERM_STATE[role][cap] ? 'Granted' : 'Withdrawn',
    FEE_STAFF_REF, 'Access review', 'Security');
  renderSecurity();
  toast(role + ' may ' + (FP_PERM_STATE[role][cap] ? 'now' : 'no longer') + ' ' + FEE_CAPS[cap].toLowerCase());
}

</script>
