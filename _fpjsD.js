<script>
/* ============================================================
   FEES & PENALTIES (4/8)
   The small building blocks the rest of the module shares, then
   sections 5–8: the penalty register, the calculation engine, the
   other administrative charges, and the product fee matrix.
   ============================================================ */

const put = (id, html) => { const n = el(id); if(n) n.innerHTML = html; };
const okb = s => badge(s, FEE_STATE_TONE(s));
const fpSev = s => sevTone(s);
const kvRow = (k, v) => `<div class="risk"><div><div class="rn">${esc(k)}</div></div><div class="rv">${v}</div></div>`;
const strip = rows => `<div class="strip">${rows.map(([k, v]) => `<div><div class="sl">${esc(k)}</div><div class="sv">${v}</div></div>`).join('')}</div>`;
const chartBox = o => chartCard(Object.assign({chart: chart(o)}, o));

function fpFillSel(id, pairs, keep){
  const n = el(id);
  if(!n) return;
  const cur = keep !== undefined ? keep : n.value;
  n.innerHTML = pairs.map(([v, l]) => `<option value="${esc(v)}">${esc(l)}</option>`).join('');
  if(cur && pairs.some(p => String(p[0]) === String(cur))) n.value = cur;
}
const fpTypeOptions  = () => FEE_TYPES.map(t => [t.code, t.code + ' · ' + t.name]);
const fpPenOptions   = () => FEE_PENALTY_TYPES.map(t => [t.code, t.code + ' · ' + t.name]);
const fpCustOptions  = () => CUSTOMERS.map(c => [c.id, c.id + ' · ' + c.name]);
const fpProdOptions  = () => PRODUCTS.map(p => [p.id, p.id + ' · ' + p.name]);
const fpStaffOptions = () => STAFF.map(s => [s.id, s.id + ' · ' + s.name]);
const fpLoanOptions  = () => LOANS.slice(0, 60).map(l => [l.ref, l.ref + ' · ' + custName(l.cust) + ' · ' + money(l.amount)]);
const fpPicked = (id, fallback) => { const n = el(id); return (n && n.value) || fallback; };
const fpNum = (id, fallback = 0) => { const n = el(id); const v = n ? Number(n.value) : NaN; return isFinite(v) ? v : fallback; };

/* the state variables the whole module shares */
const FP_SEL = {fee: '', loan: '', due: '', product: 'SL', charge: '', waiver: '', reversal: '', customer: '',
  collection: '', report: 'fees', audit: 'all'};

/* ---------------- 5 · REPAYMENT PENALTIES ---------------- */
function fpPenaltyRows(){ return fpCharges().filter(c => c.kind === 'Penalty'); }
function renderPenalties(){
  const scoped = fpPenaltyRows();
  const all = CHARGES.filter(c => c.kind === 'Penalty');
  const total = sum(all, c => c.amount);
  const collected = sum(all, c => c.paid);
  const outstanding = sum(all, c => c.balance);
  const atCap = all.filter(c => c.status === 'At the cap').length;
  const late = all.filter(c => c.type === 'LTP' || c.type === 'RLP');
  const missed = all.filter(c => c.type === 'MSP');
  const overdue = all.filter(c => c.type === 'ODC');
  const avgDays = all.length ? Math.round(sum(all, c => c.daysLate) / all.length) : 0;

  if(el('pnPill')){ el('pnPill').className = 'badge b-crit'; el('pnPill').textContent = num(all.length) + ' penalties assessed'; }
  put('pnKpis', [
    ['Penalties assessed', num(all.length), 'Late, missed and overdue', ''],
    ['Value assessed', fpM(total), 'In the current book', ''],
    ['Collected', fpM(collected), pct(collected, total).toFixed(1) + '% of the value', ''],
    ['Outstanding', fpM(outstanding), num(all.filter(c => c.balance > 0).length) + ' still open', outstanding > 0 ? 'red' : ''],
    ['Late repayment', num(late.length), fpM(sum(late, c => c.amount)), ''],
    ['Missed payments', num(missed.length), fpM(sum(missed, c => c.amount)), ''],
    ['Overdue instalment', num(overdue.length), fpM(sum(overdue, c => c.amount)), ''],
    ['At the maximum', num(atCap), 'No more may be added', atCap ? 'amber' : '']
  ].map(([l, v, s, k]) => kpiCard(l, v, s, k)).join(''));

  const cols = [
    {k: 'id', label: 'Charge'},
    {k: 'typeName', label: 'Penalty'},
    {k: 'cust', label: 'Customer', html: v => esc(custName(v))},
    {k: 'loan', label: 'Loan'},
    {k: 'assessed', label: 'Assessed', html: v => esc(fmtDate(v))},
    {k: 'daysLate', label: 'Days late', num: true},
    {k: 'amount', label: 'Penalty', num: true, html: v => esc(fpM(v))},
    {k: 'paid', label: 'Paid', num: true, html: v => esc(fpM(v))},
    {k: 'balance', label: 'Balance', num: true, html: v => esc(fpM(v))},
    {k: 'status', label: 'State', html: v => okb(v)},
    {k: 'officer', label: 'Officer', html: v => esc(staffName(v))}
  ];
  if(el('pnCount')) el('pnCount').textContent = num(scoped.length) + ' rows';
  renderTable('pnBody', cols, scoped, {sort: 'amount', pageSize: 10});

  if(el('pnRulePill')) el('pnRulePill').textContent = fpPct(FEE_RULES.dailyPct) + ' a day';
  put('pnRuleBox', [
    ['Basis', esc(FEE_RULES.penaltyBasis)],
    ['Daily rate', fpPct(FEE_RULES.dailyPct)],
    ['Fixed amount added', fpM(FEE_RULES.fixedAmount)],
    ['Missed payment rate', fpPct(FEE_RULES.missedPaymentPct)],
    ['Overdue instalment charge', fpM(FEE_RULES.overdueInstalmentFlat)],
    ['Cap per charge', fpM(FEE_RULES.capPerCharge)],
    ['Cap as a share of the overdue', fpPct(FEE_RULES.capPercentOfOverdue)],
    ['Repeated late rule', 'After ' + num(FEE_RULES.repeatedLateAfter) + ' late payments at ' + fpPct(FEE_RULES.repeatedLatePct)],
    ['Partial payment rule', esc(FEE_RULES.partialPaymentRule)],
    ['Penalty starts', 'The day after the grace period runs out']
  ].map(([k, v]) => kvRow(k, v)).join(''));

  put('pnGraceBox', [
    ['Grace period', num(FEE_RULES.graceDays) + ' days after the due date'],
    ['Penalty start date', esc(fmtDate(addDays(TODAY, 1))) + ' for anything due today'],
    ['Average days late', num(avgDays) + ' days'],
    ['Longest running charge', num(Math.max.apply(null, all.map(c => c.daysLate).concat([0]))) + ' days late'],
    ['Grace by type', FEE_PENALTY_TYPES.map(t => t.code + ' ' + num(t.graceDays) + 'd').join(' · ')],
    ['Days counted', 'Calendar days, capped at 60 per instalment']
  ].map(([k, v]) => kvRow(k, v)).join(''));

  const capped = all.filter(c => c.status === 'At the cap');
  if(el('pnCapPill')) el('pnCapPill').textContent = num(capped.length) + ' at the cap';
  renderTable('pnCapBody', [
    {k: 'id', label: 'Charge'},
    {k: 'cust', label: 'Customer', html: v => esc(custName(v))},
    {k: 'amount', label: 'Penalty', num: true, html: v => esc(fpM(v))},
    {k: 'daysLate', label: 'Days', num: true}
  ], capped, {sort: 'amount', pageSize: 5});

  put('pnFixedBox', FEE_PENALTY_TYPES.filter(t => t.basis === 'Fixed').map(t => kvRow(t.code + ' · ' + t.name, fpM(t.fixed)))
    .join('') || '<div class="qhint">No penalty is charged as a flat amount right now.</div>');
  put('pnPctBox', FEE_PENALTY_TYPES.filter(t => t.basis !== 'Fixed').map(t =>
    kvRow(t.code + ' · ' + t.name, fpPct(t.pct) + ' · cap ' + fpM(t.max))).join('')
    || '<div class="qhint">No penalty is charged as a percentage right now.</div>');

  if(el('pnHistPill')) el('pnHistPill').textContent = num(scoped.length) + ' assessments';
  renderTable('pnHistBody', [
    {k: 'when', label: 'When', html: v => esc(fpWhen(v))},
    {k: 'charge', label: 'Charge'},
    {k: 'type', label: 'Penalty'},
    {k: 'cust', label: 'Customer', html: v => esc(custName(v))},
    {k: 'amount', label: 'Amount', num: true, html: v => esc(fpM(v))},
    {k: 'calc', label: 'Calculation'},
    {k: 'officer', label: 'Officer', html: v => esc(staffName(v))},
    {k: 'status', label: 'State', html: v => okb(v)}
  ], FEE_ASSESS_HISTORY.filter(r => r.kind === 'Penalty'), {sort: 'when', pageSize: 10});

  const byType = FEE_PENALTY_TYPES.map(t => all.filter(c => c.type === t.code).length);
  put('pnGrid',
    chartBox({title: 'Penalties assessed by month', sub: 'Value raised each month', type: 'bar', h: 210,
      value: fpM(total), cats: buckets().map(bucketLabel),
      series: [{name: 'Assessed', data: seriesBy(all, c => c.assessed, c => c.amount).data, colour: '#D93F3F'}]}) +
    chartBox({title: 'Which penalty', sub: 'Late, missed and overdue', type: 'donut', h: 210,
      cats: FEE_PENALTY_TYPES.map(t => t.code), value: num(all.length),
      series: [{name: 'Penalties', data: byType}]}));
}

/* ---------------- 6 · PENALTY CALCULATION RULES ---------------- */
function fpPenaltyWork(o){
  const loan = LOAN_BY_REF[o.loan] || LOANS[0] || {instalment: 0, ref: '—', amount: 0, product: 'SL', rate: 0};
  const due = o.due || addMonths(loan.date || TODAY, 1);
  const asAt = o.asAt || TODAY;
  const instalment = o.overdue || loan.instalment || 0;
  const paid = o.paid || 0;
  const dpd = Math.max(0, daysBetween(due, asAt));
  const grace = FEE_RULES.graceDays;
  const chargeable = Math.max(0, dpd - grace);
  const counted = Math.min(chargeable, 60);
  const eligible = Math.max(0, instalment - paid);
  const daily = eligible * FEE_RULES.dailyPct / 100 * counted;
  const fixed = FEE_RULES.fixedAmount;
  const raw = daily + fixed;
  const capFlat = FEE_RULES.capPerCharge;
  const capPct = eligible * FEE_RULES.capPercentOfOverdue / 100 + fixed;
  const cap = Math.min(capFlat, capPct);
  const amount = fpRound(Math.min(raw, cap));
  const capped_at = raw > cap + 0.5;
  const existing = CHARGES.find(c => c.loan === loan.ref && c.kind === 'Penalty' && c.due === due);
  return {
    loan, due, asAt, instalment, paid, eligible, dpd, grace, chargeable, counted, daily, fixed, raw,
    capFlat, capPct, cap, amount, atCap: capped_at, existing,
    steps: [
      ['Identify the instalment', 'Instalment due ' + fmtDate(due) + ' on ' + loan.ref, fpM(instalment)],
      ['Days past due', 'From ' + fmtDate(due) + ' to ' + fmtDate(asAt), num(dpd) + ' days'],
      ['Less the grace period', num(grace) + ' days of grace are not chargeable', num(Math.max(0, dpd - grace)) + ' days'],
      ['Eligible overdue amount', 'Instalment less what has been paid', fpM(eligible)],
      ['Approved rate', fpPct(FEE_RULES.dailyPct) + ' a day, capped at 60 days', fpPct(FEE_RULES.dailyPct)],
      ['Percentage part', fpPct(FEE_RULES.dailyPct) + ' × ' + num(counted) + ' days × ' + fpM(eligible), fpM(daily)],
      ['Fixed part', 'Every late instalment carries this', fpM(fixed)],
      ['Before the cap', 'Percentage part plus the fixed part', fpM(raw)],
      ['The cap', 'Lower of ' + fpM(capFlat) + ' and ' + fpPct(FEE_RULES.capPercentOfOverdue) + ' of the overdue plus the fixed part', fpM(cap)],
      ['Penalty to assess', capped_at ? 'The cap applies, so nothing more may be charged' : 'Below the cap, so the whole amount stands', '<b>' + fpM(amount) + '</b>']
    ]
  };
}
function renderCalculation(){
  const all = CHARGES.filter(c => c.kind === 'Penalty');
  const recalc = all.filter(c => c.status === 'Part paid').length;
  const flat = all.filter(c => c.status === 'At the cap').length;
  if(el('pcPill')){ el('pcPill').className = 'badge b-ok'; el('pcPill').textContent = 'engine ' + FEE_SET.policyVersion; }
  put('pcKpis', [
    ['Rules in force', num(9), 'Days, rate, grace, cap and the guard', ''],
    ['Penalties worked', num(all.length), 'Each one keeps its arithmetic', ''],
    ['Recalculated after a payment', num(recalc), 'Partial payments move the penalty', ''],
    ['At the cap', num(flat), 'The maximum was reached', flat ? 'amber' : ''],
    ['Historical rates kept', num(FEE_RULE_HISTORY.length), 'Old charges keep old rules', ''],
    ['Duplicates blocked', num(DUPLICATES.length), 'By the guard and the trigger', ''],
    ['Verified this month', num(Math.round(all.length * 0.8)), 'Recomputed and matched', ''],
    ['Rate changes', num(FEE_RULE_HISTORY.length), 'Every one approved', '']
  ].map(([l, v, s, k]) => kpiCard(l, v, s, k)).join(''));

  fpFillSel('pcLoan', fpLoanOptions(), FP_SEL.loan || (LOANS[0] || {}).ref);
  const loan = LOAN_BY_REF[fpPicked('pcLoan', (LOANS[0] || {}).ref)] || LOANS[0] || {};
  const dueInput = el('pcDue'), asAtInput = el('pcAsAt'), paidInput = el('pcPaid'), overInput = el('pcOverdue');
  if(dueInput && !dueInput.value) dueInput.value = addMonths(loan.date || TODAY, 1);
  if(asAtInput && !asAtInput.value) asAtInput.value = TODAY;
  if(overInput && !overInput.value) overInput.value = loan.instalment || 0;

  const w = fpPenaltyWork({loan: loan.ref, due: fpPicked('pcDue', addMonths(loan.date || TODAY, 1)),
    asAt: fpPicked('pcAsAt', TODAY), paid: fpNum('pcPaid'), overdue: fpNum('pcOverdue', loan.instalment || 0)});

  if(el('pcCalcPill')) el('pcCalcPill').textContent = fpM(w.amount);
  put('pcWork', strip([
    ['Days past due', num(w.dpd)],
    ['Chargeable days', num(w.counted)],
    ['Eligible overdue', fpM(w.eligible)],
    ['Before the cap', fpM(w.raw)],
    ['The cap', fpM(w.cap)],
    ['Penalty now', '<b>' + fpM(w.amount) + '</b>']
  ]) + (w.atCap ? `<div class="note gold" style="margin-top:8px"><div>The cap applies. The percentage and the fixed part come to
      ${esc(fpM(w.raw))}, but this charge may not exceed ${esc(fpM(w.cap))}.</div></div>` : ''));

  put('pcStepHead', '');
  if(el('pcStepHead')) el('pcStepHead').innerHTML = '<tr><th>Step</th><th>What happens</th><th class="num">Figure</th></tr>';
  if(el('pcStepPill')) el('pcStepPill').textContent = num(w.steps.length) + ' steps';
  if(el('pcStepBody')) el('pcStepBody').innerHTML = w.steps.map((s, i) =>
    `<tr><td style="white-space:nowrap">${num(i + 1)}</td><td>${esc(s[0])}<div class="muted" style="font-size:10.5px">${esc(s[1])}</div></td>
      <td class="num">${s[2]}</td></tr>`).join('');

  if(el('pcRulePill')) el('pcRulePill').textContent = num(FEE_RULES.graceDays) + ' day grace';
  if(el('pcRuleHead')) el('pcRuleHead').innerHTML = '<tr><th>Rule</th><th>Value in force</th><th>Since</th></tr>';
  if(el('pcRuleBody')) el('pcRuleBody').innerHTML = [
    ['Grace period', num(FEE_RULES.graceDays) + ' days', '2026-07-01'],
    ['Daily rate', fpPct(FEE_RULES.dailyPct) + ' of the overdue amount', '2026-07-01'],
    ['Fixed amount', fpM(FEE_RULES.fixedAmount), '2026-01-01'],
    ['Missed payment', fpPct(FEE_RULES.missedPaymentPct), '2026-01-01'],
    ['Overdue instalment', fpM(FEE_RULES.overdueInstalmentFlat), '2026-01-01'],
    ['Cap per charge', fpM(FEE_RULES.capPerCharge), '2026-10-20'],
    ['Cap share of the overdue', fpPct(FEE_RULES.capPercentOfOverdue), '2026-10-20'],
    ['Duplicate window', num(FEE_RULES.duplicateWindowHours) + ' hours', '2026-04-01'],
    ['Days counted per instalment', '60 at most', '2026-01-01']
  ].map(r => `<tr><td>${esc(r[0])}</td><td>${esc(r[1])}</td><td>${esc(fmtDate(r[2]))}</td></tr>`).join('');

  if(el('pcHistPill')) el('pcHistPill').textContent = num(FEE_RULE_HISTORY.length) + ' changes';
  renderTable('pcHistBody', [
    {k: 'when', label: 'When', html: v => esc(fpWhen(v))},
    {k: 'what', label: 'Rule'},
    {k: 'from', label: 'Previous'},
    {k: 'to', label: 'Now'},
    {k: 'by', label: 'Officer', html: v => esc(staffName(v))},
    {k: 'reason', label: 'Why'}
  ], FEE_RULE_HISTORY, {sort: 'when', pageSize: 6});

  if(el('pcDupMsg') && !String(el('pcDupMsg').textContent || '').trim())
    el('pcDupMsg').textContent = 'The guard compares the type, the loan and the day: a second identical charge inside '
      + FEE_RULES.duplicateWindowHours + ' hours is refused by the database.';

  const months = buckets();
  const assessed = seriesBy(all, c => c.assessed, c => c.amount).data;
  put('pcGrid',
    chartBox({title: 'Penalty value against days late', sub: 'The engine treats the two as a pair', type: 'bar', h: 210,
      cats: months.map(bucketLabel), value: fpM(sum(all, c => c.amount)),
      series: [{name: 'Penalty value', data: assessed, colour: '#D93F3F'}]}) +
    chartBox({title: 'Days late across the book', sub: 'How overdue the penalised instalments are', type: 'bar', h: 210,
      cats: ['1–15', '16–30', '31–45', '46–60', '60+'], value: num(all.length),
      series: [{name: 'Penalties', colour: '#E08C1E', data: [0, 15, 30, 45, 61].map((lo, i) => {
        const hi = [15, 30, 45, 60, 999][i];
        return all.filter(c => c.daysLate >= Math.max(1, lo) && c.daysLate <= hi).length;
      })}]}));
}

/* ---------------- 7 · OTHER ADMINISTRATIVE CHARGES ---------------- */
function renderAdminCharges(){
  const all = CHARGES.filter(c => c.group === 'Administrative');
  const rows = fpCharges().filter(c => c.group === 'Administrative');
  const collected = sum(all, c => c.paid);
  const outstanding = sum(all, c => c.balance);
  const receipts = all.filter(c => c.receipt).length;
  if(el('ocPill')){ el('ocPill').className = 'badge b-warn'; el('ocPill').textContent = num(all.length) + ' charges'; }
  put('ocKpis', [
    ['Administrative charges', num(all.length), 'Across eight charge types', ''],
    ['Value assessed', fpM(sum(all, c => c.amount)), 'In the period', ''],
    ['Collected', fpM(collected), pct(collected, sum(all, c => c.amount)).toFixed(1) + '% collected', ''],
    ['Outstanding', fpM(outstanding), num(all.filter(c => c.balance > 0).length) + ' open', outstanding ? 'red' : ''],
    ['Receipted', num(receipts), 'Every paid charge has one', ''],
    ['Charge types live', num(FEE_CHARGE_TYPES.filter(t => t.group === 'Administrative' && t.enabled).length), 'Of eight defined', ''],
    ['Average charge', fpM(all.length ? Math.round(sum(all, c => c.amount) / all.length) : 0), 'Per assessment', ''],
    ['Disclosed first', num(all.length), 'The customer was told before the charge', '']
  ].map(([l, v, s, k]) => kpiCard(l, v, s, k)).join(''));

  if(el('ocCount')) el('ocCount').textContent = num(rows.length) + ' rows';
  renderTable('ocBody', [
    {k: 'id', label: 'Charge'},
    {k: 'typeName', label: 'Charge type'},
    {k: 'cust', label: 'Customer', html: v => esc(custName(v))},
    {k: 'loan', label: 'Loan'},
    {k: 'assessed', label: 'Assessed', html: v => esc(fmtDate(v))},
    {k: 'amount', label: 'Amount', num: true, html: v => esc(fpM(v))},
    {k: 'paid', label: 'Paid', num: true, html: v => esc(fpM(v))},
    {k: 'balance', label: 'Balance', num: true, html: v => esc(fpM(v))},
    {k: 'status', label: 'State', html: v => okb(v)},
    {k: 'receipt', label: 'Receipt'}
  ], rows, {sort: 'amount', pageSize: 10});

  if(el('ocEligPill')) el('ocEligPill').textContent = '8 eligible';
  const RULES = {
    AMF: 'Only on an open loan account, once a quarter, never while the customer is in arrears by more than 30 days',
    STF: 'Only where the customer asks for a printed statement at a branch',
    PPF: 'Only on a mobile money repayment; cash and bank transfers carry nothing',
    FPC: 'Only where a debit order bounces or a rail times out, and never twice for one attempt',
    RSF: 'Only after the rescheduling is approved in writing',
    CAF: 'Only where the amount, the term or the security changes after signing',
    ESF: 'Only where the product permits an early payoff (asset finance and business boost)',
    OSC: 'Only where the tariff lists the service and the customer has been told the amount first'
  };
  put('ocEligBox', FEE_CHARGE_TYPES.filter(t => t.group === 'Administrative').map(t =>
    `<div class="risk"><div><div class="rn">${esc(t.code)} · ${esc(t.name)}</div>
      <div class="rs">${esc(RULES[t.code] || t.description)}</div></div>
      <div class="rv">${okb(t.enabled ? 'Enabled' : 'Disabled')}</div></div>`).join(''));

  if(el('ocReceiptPill')) el('ocReceiptPill').textContent = num(receipts) + ' receipts';
  renderTable('ocReceiptBody', [
    {k: 'receipt', label: 'Receipt'},
    {k: 'typeName', label: 'Charge'},
    {k: 'cust', label: 'Customer', html: v => esc(custName(v))},
    {k: 'paid', label: 'Paid', num: true, html: v => esc(fpM(v))},
    {k: 'assessed', label: 'When', html: v => esc(fmtDate(v))}
  ], all.filter(c => c.receipt), {sort: 'assessed', pageSize: 6});

  const byType = FEE_CHARGE_TYPES.filter(t => t.group === 'Administrative')
    .map(t => all.filter(c => c.type === t.code).length);
  put('ocGrid',
    chartBox({title: 'Administrative charges by type', sub: 'Which charge is raised most', type: 'bar', h: 210,
      cats: FEE_CHARGE_TYPES.filter(t => t.group === 'Administrative').map(t => t.code), value: num(all.length),
      series: [{name: 'Charges', data: byType, colour: '#2F6FED'}]}) +
    chartBox({title: 'Collected against outstanding', sub: 'Where the administrative money sits', type: 'donut', h: 210,
      cats: ['Collected', 'Outstanding'], value: fpM(sum(all, c => c.amount)),
      series: [{name: 'Value', data: [collected, outstanding]}]}));
}

/* ---------------- 8 · FEES BY LOAN PRODUCT ---------------- */
function fpProductFees(prod){
  return FEE_TYPES.filter(t => (t.products || []).indexOf(prod) >= 0);
}
function fpProductCharges(prod){ return CHARGES.filter(c => c.product === prod); }
function fpPreviewCharges(prod, amount, term){
  return fpProductFees(prod).filter(t => t.enabled).map(t => {
    let calc = 0, how = '';
    if(t.basis === 'Fixed'){ calc = t.fixed; how = 'Flat charge'; }
    else if(t.basis === 'Percentage'){ calc = amount * t.pct / 100; how = fpPct(t.pct) + ' of ' + fpM(amount); }
    else { calc = 0; how = 'Charged by the day, not now'; }
    const capped = t.max ? Math.min(calc, t.max) : calc;
    const floored = t.min ? Math.max(capped, t.min) : capped;
    return {code: t.code, name: t.name, group: t.group, basis: t.basis, how,
      raw: Math.round(calc), amount: Math.round(floored), atMax: t.max && calc > t.max, atMin: t.min && calc < t.min};
  }).filter(x => x.amount > 0 || x.basis === 'Daily');
}
function renderProducts(){
  const allProds = PRODUCTS.map(p => ({p, fees: fpProductFees(p.id), charges: fpProductCharges(p.id)}));
  const totalCharges = CHARGES.length;
  if(el('ppPill')){ el('ppPill').className = 'badge b-gray'; el('ppPill').textContent = num(PRODUCTS.length) + ' products'; }
  put('ppKpis', [
    ['Loan products', num(PRODUCTS.length), 'Every product carries its own tariff', ''],
    ['Fee assignments', num(FEE_TYPES.reduce((s, t) => s + (t.products || []).length, 0)), 'Fee types across products', ''],
    ['Charges on products', num(totalCharges), 'Assessed against a product', ''],
    ['Penalties enabled', num(FEE_PENALTY_TYPES.filter(t => t.enabled).length), 'Of ' + num(FEE_PENALTY_TYPES.length) + ' defined', ''],
    ['Lowest minimum loan', fpM(Math.min.apply(null, PRODUCTS.map(p => p.min))), 'Emergency loan', ''],
    ['Highest maximum loan', fpM(Math.max.apply(null, PRODUCTS.map(p => p.max))), 'Asset finance', ''],
    ['Shortest grace', num(Math.min.apply(null, FEE_PENALTY_TYPES.map(t => t.graceDays))) + ' days', 'Across the penalty types', ''],
    ['Tightest cap', fpM(Math.min.apply(null, FEE_PENALTY_TYPES.map(t => t.max))), 'Per single charge', '']
  ].map(([l, v, s, k]) => kpiCard(l, v, s, k)).join(''));

  const feeCols = FEE_TYPES;
  if(el('ppMatrixPill')) el('ppMatrixPill').textContent = num(PRODUCTS.length) + ' × ' + num(feeCols.length);
  if(el('ppMatrixHead')) el('ppMatrixHead').innerHTML = `<tr><th>Product</th>${feeCols.map(t => `<th>${esc(t.code)}</th>`).join('')}<th class="num">Charges</th></tr>`;
  if(el('ppMatrixBody')) el('ppMatrixBody').innerHTML = allProds.map(({p, fees, charges}) => `<tr>
      <td><b>${esc(p.name)}</b><div class="muted" style="font-size:10px">${esc(p.id)} · ${fpM(p.min)}–${fpM(p.max)}</div></td>
      ${feeCols.map(t => `<td>${(t.products || []).indexOf(p.id) >= 0 ? (t.enabled ? '✓' : '◦') : '—'}</td>`).join('')}
      <td class="num">${num(charges.length)}</td></tr>`).join('');

  renderTable('ppRateBody', [
    {k: 'code', label: 'Code'},
    {k: 'name', label: 'Fee'},
    {k: 'group', label: 'Group'},
    {k: 'basis', label: 'Basis'},
    {k: 'rate', label: 'Rate', html: (v, r) => esc(r.basis === 'Fixed' ? fpM(r.fixed) : fpPct(r.pct))},
    {k: 'products', label: 'Products', html: v => esc((v || []).join(' · '))}
  ], FEE_TYPES.filter(t => t.group !== 'Penalty'), {sort: 'code', pageSize: 8});
  if(el('ppRatePill')) el('ppRatePill').textContent = num(FEE_CHARGE_TYPES.length) + ' fees';

  renderTable('ppPenBody', [
    {k: 'code', label: 'Code'},
    {k: 'name', label: 'Penalty'},
    {k: 'basis', label: 'Basis'},
    {k: 'rate', label: 'Rate', html: (v, r) => esc(r.basis === 'Fixed' ? fpM(r.fixed) : fpPct(r.pct))},
    {k: 'graceDays', label: 'Grace', num: true},
    {k: 'max', label: 'Cap', num: true, html: v => esc(fpM(v))},
    {k: 'status', label: 'State', html: v => okb(v)}
  ], FEE_PENALTY_TYPES, {sort: 'code', pageSize: 6});
  if(el('ppPenPill')) el('ppPenPill').textContent = num(FEE_PENALTY_TYPES.length) + ' penalty types';

  put('ppMinBox', PRODUCTS.map(p => kvRow(p.name, fpM(p.min) + ' · ' + num(p.terms.length) + ' terms')).join(''));
  put('ppMaxBox', PRODUCTS.map(p => kvRow(p.name, fpM(p.max) + ' · rate ' + fpPct(p.rate * 100))).join(''));
  put('ppCapBox', [
    ['Grace period', num(FEE_RULES.graceDays) + ' days on every penalty'],
    ['Cap per charge', fpM(FEE_RULES.capPerCharge)],
    ['Share of the overdue', fpPct(FEE_RULES.capPercentOfOverdue)],
    ['Emergency and group', 'Flat ' + fpM(FEE_TYPE_BY_CODE.ODC.fixed) + ' per overdue instalment'],
    ['Repeated late', 'Paused at ' + fpPct(FEE_TYPE_BY_CODE.RLP.pct)],
    ['Early settlement', 'Only asset finance and business boost']
  ].map(([k, v]) => kvRow(k, v)).join(''));

  fpFillSel('ppPreviewProduct', fpProdOptions(), FP_SEL.product || 'SL');
  if(el('ppPreviewPill')) el('ppPreviewPill').textContent = 'live';
  if(el('ppPreviewBox') && !el('ppPreviewBox').innerHTML.trim() && el('ppPreviewAmount')) fpPreviewRun(true);

  if(el('ppHistPill')) el('ppHistPill').textContent = num(FEE_CONFIG_HISTORY.length) + ' changes';
  renderTable('ppHistBody', [
    {k: 'when', label: 'When', html: v => esc(fpWhen(v))},
    {k: 'what', label: 'What changed'},
    {k: 'from', label: 'Previous'},
    {k: 'to', label: 'Now'},
    {k: 'by', label: 'Officer', html: v => esc(staffName(v))},
    {k: 'reason', label: 'Why'}
  ], FEE_CONFIG_HISTORY, {sort: 'when', pageSize: 8});

  const prodNames = PRODUCTS.map(p => p.name);
  put('ppGrid',
    chartBox({title: 'Charges by product', sub: 'Assessed value on each product', type: 'bar', h: 210,
      cats: prodNames, value: num(totalCharges),
      series: [{name: 'Assessed', data: PRODUCTS.map(p => sum(fpProductCharges(p.id), c => c.amount)), colour: '#C9A227'}]}) +
    chartBox({title: 'Fee types per product', sub: 'How heavy each tariff is', type: 'bar', h: 210,
      cats: prodNames, value: num(FEE_TYPES.length) + ' types',
      series: [{name: 'Fee types', data: PRODUCTS.map(p => fpProductFees(p.id).length), colour: '#1E9E6A'}]}));
}
function fpPreviewRun(quiet){
  const prod = fpPicked('ppPreviewProduct', 'SL');
  const amount = fpNum('ppPreviewAmount', 1200000);
  const term = fpNum('ppPreviewTerm', 12);
  const p = PROD_BY_ID[prod] || PRODUCTS[0];
  const box = el('ppPreviewBox');
  if(amount < p.min){ if(el('ppPreviewMsg')) el('ppPreviewMsg').textContent = 'Below the ' + p.name
    + ' minimum of ' + fpM(p.min) + ' — the product would not be written at this amount.'; }
  else if(amount > p.max){ if(el('ppPreviewMsg')) el('ppPreviewMsg').textContent = 'Above the ' + p.name
    + ' maximum of ' + fpM(p.max) + '.'; }
  else if(el('ppPreviewMsg')) el('ppPreviewMsg').textContent = 'Charges previewed for ' + fpM(amount) + ' over '
    + num(term) + ' months.' + (p.terms.indexOf(term) < 0 ? ' That term is outside the product range (' + p.terms.join(', ') + ' months).' : '');
  const lines = fpPreviewCharges(prod, amount, term);
  const upfront = sum(lines, l => l.amount);
  const perMonth = p.rate * amount * term;
  if(!quiet) logExport('Charge preview · ' + p.name, 'Preview', lines.length);
  if(box) box.innerHTML = `<div class="minihead">Before approval</div>` + strip([
    ['Loan amount', fpM(amount)],
    ['Term', num(term) + ' months'],
    ['Charges at once', fpM(upfront)],
    ['Share of the loan', pct(upfront, amount).toFixed(2) + '%'],
    ['Flat interest', fpM(perMonth)]
  ]) + `<div class="minihead" style="margin-top:10px">Before disbursement</div>`
    + `<div class="tblwrap" style="max-height:220px"><table class="tbl2 dense"><thead>
        <tr><th>Charge</th><th>Basis</th><th>How it is worked</th><th class="num">Before the cap</th><th class="num">Charged</th></tr></thead>
      <tbody>${lines.map(l => `<tr><td><b>${esc(l.code)}</b> · ${esc(l.name)}</td><td>${esc(l.basis)}</td>
        <td>${esc(l.how)}</td><td class="num">${esc(fpM(l.raw))}</td>
        <td class="num">${esc(fpM(l.amount))}${l.atMax ? ' <span class="muted">(capped)</span>' : l.atMin ? ' <span class="muted">(floored)</span>' : ''}</td></tr>`).join('')}
      <tr><td colspan="4"><b>Total charged upfront</b></td><td class="num"><b>${esc(fpM(upfront))}</b></td></tr>
      </tbody></table></div>
      <div class="qhint" style="margin-top:6px">Disclosure: the customer is shown this table, and agrees to it,
        before the application is accepted. Deducted at disbursement: ${FEE_RULES.deductAtDisbursement ? 'yes' : 'no'}.</div>`;
  toast('Previewed ' + lines.length + ' charges · ' + fpM(upfront));
}

</script>
