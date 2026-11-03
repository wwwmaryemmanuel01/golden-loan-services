<script>
/* ============================================================
   FEES & PENALTIES (8/8)
   Sections 1–4: the overview, fee management, application fees
   and origination fees. Then the filter bar, the navigation, the
   render loop, the wiring and the boot sequence.
   ============================================================ */

/* ---------------- 1 · OVERVIEW ---------------- */
function renderOverview(){
  const s = fpStats();
  const issues = fpIssues();
  const pending = CHARGES.filter(c => c.status === 'Pending approval');
  const reversed = CHARGES.filter(c => c.status === 'Reversed');

  if(el('ovPill')){ el('ovPill').className = 'badge ' + (issues.length ? 'b-warn' : 'b-ok');
    el('ovPill').textContent = num(issues.length) + ' open items'; }
  put('fpKpis', [
    ['Fees assessed', fpM(s.assessedFees), num(s.fees) + ' charges', ''],
    ['Penalties assessed', fpM(s.assessedPens), num(s.penalties) + ' charges', ''],
    ['Fees collected', fpM(s.collectedFees), pct(s.collectedFees, s.assessedFees).toFixed(1) + '% of the fees', ''],
    ['Penalties collected', fpM(s.collectedPens), pct(s.collectedPens, s.assessedPens).toFixed(1) + '% of the penalties', ''],
    ['Outstanding fees', fpM(s.outstandingFees), 'Still owed to the business', s.outstandingFees ? 'amber' : ''],
    ['Outstanding penalties', fpM(s.outstandingPens), 'Unpaid penalty balances', s.outstandingPens ? 'red' : ''],
    ['Pending assessments', num(s.pendingAssess), 'Above the approval line', s.pendingAssess ? 'amber' : ''],
    ['Pending waivers', num(s.pendingWaivers), 'Waiting on the head of credit', s.pendingWaivers ? 'amber' : ''],
    ['Reversed charges', num(s.reversedCount), fpM(s.reversed) + ' taken off', ''],
    ['At the cap', num(s.atCap), 'No more may be added', '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join(''));

  if(el('ovBoardPill')) el('ovBoardPill').textContent = s.collectionRate.toFixed(1) + '% collected';
  put('fpBoard', [
    ['Assessed', fpM(s.total)],
    ['Collected', fpM(s.collected)],
    ['Outstanding', '<b>' + fpM(s.outstanding) + '</b>'],
    ['Waived', fpM(s.waived)],
    ['Reversed', fpM(s.reversed)],
    ['Collection rate', s.collectionRate.toFixed(1) + '%'],
    ['Charge health', Math.round(s.score) + '%']
  ].map(([k, v]) => `<div><div class="sl">${esc(k)}</div><div class="sv">${v}</div></div>`).join(''));

  put('ovMix', [
    ['Fees', s.assessedFees, s.collectedFees, s.outstandingFees],
    ['Penalties', s.assessedPens, s.collectedPens, s.outstandingPens]
  ].map(([label, assessed, collected, out]) => `<div class="risk">
      <div style="flex:1"><div class="rn">${esc(label)} · ${fpM(assessed)} assessed</div>
        <div class="rs">${fpM(collected)} collected · ${fpM(out)} outstanding · ${pct(collected, assessed).toFixed(1)}% settled</div>
        <div class="meter" style="margin-top:6px"><i style="width:${clamp(pct(collected, assessed), 0, 100).toFixed(1)}%"></i></div></div>
      <div class="rv">${badge(pct(collected, assessed) > 60 ? 'Healthy' : 'Watch', pct(collected, assessed) > 60 ? 'b-ok' : 'b-warn')}</div>
    </div>`).join('') + `<div class="qhint" style="margin-top:6px">Fees and penalties are kept apart at every step:
      the ledger posts to separate income accounts and a repayment shows both lines.</div>`);

  if(el('ovIssuePill')) el('ovIssuePill').textContent = num(issues.length) + ' to decide';
  put('ovIssues', issues.length ? issues.map(i => `<div class="risk">
      <div><div class="rn">${esc(i.label)}</div><div class="rs">${esc(i.detail)} · ${esc(fmtDate(i.when))}</div></div>
      <div class="rv">${badge(i.severity, fpSev(i.severity))}</div></div>`).join('')
    : '<div class="qhint">Nothing is waiting for a decision.</div>');

  const ageing = ['Current', '1–30 days', '31–60 days', '61–90 days', '90+ days'];
  const ageOf = c => {
    const d = daysBetween(c.due, TODAY);
    return d <= 0 ? 'Current' : d <= 30 ? '1–30 days' : d <= 60 ? '31–60 days' : d <= 90 ? '61–90 days' : '90+ days';
  };
  const open = fpOpenCharges();
  if(el('ovAgePill')) el('ovAgePill').textContent = fpM(sum(open, c => c.balance));
  put('ovAge', ageing.map(a => {
    const set = open.filter(c => ageOf(c) === a);
    return `<div class="meterrow"><div style="flex:1">
        <div class="sl"><b>${esc(a)}</b><span>${num(set.length)} charges · ${fpM(sum(set, c => c.balance))}</span></div>
        <div class="meter"><i style="width:${clamp(pct(sum(set, c => c.balance), Math.max(1, sum(open, c => c.balance))), 0, 100).toFixed(1)}%"></i></div>
      </div><div class="sv">${pct(sum(set, c => c.balance), Math.max(1, sum(open, c => c.balance))).toFixed(0)}%</div></div>`;
  }).join(''));

  const activity = [];
  CHARGES.slice(0, 40).forEach(c => activity.push({when: c.assessed, event: 'Assessed', ref: c.id,
    what: c.typeName, party: custName(c.cust), amount: c.amount, by: c.officer, state: c.kind}));
  COLLECTIONS.slice(0, 40).forEach(c => activity.push({when: String(c.when).slice(0, 10), event: 'Collected', ref: c.id,
    what: c.type + ' payment', party: custName(c.cust), amount: c.amount, by: c.officer, state: c.status}));
  WAIVERS.slice(0, 20).forEach(w => activity.push({when: w.requestedOn, event: 'Waiver', ref: w.id,
    what: w.typeName, party: custName(w.cust), amount: w.waived, by: w.requestedBy, state: w.status}));
  REVERSALS.slice(0, 20).forEach(r => activity.push({when: r.requestedOn, event: 'Correction', ref: r.id,
    what: r.typeName, party: custName(r.cust), amount: r.amount, by: r.requestedBy, state: r.status}));
  activity.sort((a, b) => String(a.when) < String(b.when) ? 1 : -1);
  if(el('ovActPill')) el('ovActPill').textContent = num(activity.length) + ' moves';
  renderTable('ovActivityBody', [
    {k: 'when', label: 'When', html: v => esc(fpWhen(v))},
    {k: 'event', label: 'Event'},
    {k: 'ref', label: 'Reference'},
    {k: 'what', label: 'What'},
    {k: 'party', label: 'Customer'},
    {k: 'amount', label: 'Amount', num: true, html: v => esc(fpM(v))},
    {k: 'by', label: 'Officer', html: v => esc(staffName(v))},
    {k: 'state', label: 'State', html: v => okb(v)}
  ], activity, {sort: 'when', pageSize: 10});

  put('ovGrid',
    chartBox({title: 'Fees and penalties assessed', sub: 'Month by month', type: 'bar', h: 220,
      value: fpM(s.total), cats: buckets().map(bucketLabel),
      series: [{name: 'Fees', colour: '#C9A227', data: seriesBy(CHARGES.filter(c => c.kind === 'Fee'), c => c.assessed, c => c.amount).data},
        {name: 'Penalties', colour: '#D93F3F', data: seriesBy(CHARGES.filter(c => c.kind === 'Penalty'), c => c.assessed, c => c.amount).data}]}) +
    chartBox({title: 'Collected against outstanding', sub: 'The whole charge book', type: 'donut', h: 220,
      cats: ['Collected', 'Outstanding', 'Waived', 'Reversed'], value: fpM(s.total),
      series: [{name: 'Value', data: [s.collected, s.outstanding, s.waived, s.reversed]}]}) +
    chartBox({title: 'Fees by type', sub: 'Where the fee value comes from', type: 'bar', h: 220,
      cats: FEE_CHARGE_TYPES.map(t => t.code), value: num(FEE_CHARGE_TYPES.length) + ' types',
      series: [{name: 'Assessed', colour: '#2F6FED',
        data: FEE_CHARGE_TYPES.map(t => sum(CHARGES.filter(c => c.type === t.code), c => c.amount))}]}) +
    chartBox({title: 'Penalties by month', sub: 'What lateness costs the customer', type: 'bar', h: 220,
      cats: MONTHS12.map(bucketLabel), value: fpM(s.assessedPens),
      series: [{name: 'Penalties', colour: '#E08C1E', data: seriesBy(CHARGES.filter(c => c.kind === 'Penalty'), c => c.assessed, c => c.amount).data.slice(-12)}]}));
}

/* ---------------- 2 · FEE MANAGEMENT ---------------- */
function renderFeeTypes(){
  const on = FEE_TYPES.filter(t => t.enabled);
  const types = fpCharges();
  if(el('ftPill')){ el('ftPill').className = 'badge b-ok'; el('ftPill').textContent = num(on.length) + ' enabled'; }
  put('ftKpis', [
    ['Charge types', num(FEE_TYPES.length), 'Fees and penalties in the tariff', ''],
    ['Switched on', num(on.length), 'Live on new assessments', ''],
    ['Percentage based', num(FEE_TYPES.filter(t => t.basis === 'Percentage').length), 'A share of the base', ''],
    ['Fixed amount', num(FEE_TYPES.filter(t => t.basis === 'Fixed').length), 'The same every time', ''],
    ['Daily', num(FEE_TYPES.filter(t => t.basis === 'Daily').length), 'Charged by the day late', ''],
    ['With a floor and cap', num(FEE_TYPES.filter(t => t.min || t.max).length), 'Bounded both ways', ''],
    ['Paused', num(FEE_TYPES.filter(t => !t.enabled).length), 'Not raised while paused', ''],
    ['Configurations on file', num(FEE_CONFIG_HISTORY.length), 'Every change kept', '']
  ].map(([l, v, s, k]) => kpiCard(l, v, s, k)).join(''));

  if(el('ftCount')) el('ftCount').textContent = num(types.length) + ' charge types';
  renderTable('ftBody', [
    {k: 'code', label: 'Code'},
    {k: 'name', label: 'Charge'},
    {k: 'group', label: 'Group'},
    {k: 'basis', label: 'Basis'},
    {k: 'rate', label: 'Rate', html: (v, r) => esc(r.basis === 'Fixed' ? fpM(r.fixed) : fpPct(r.pct))},
    {k: 'min', label: 'Floor', num: true, html: v => esc(v ? fpM(v) : '—')},
    {k: 'max', label: 'Ceiling', num: true, html: v => esc(v ? fpM(v) : '—')},
    {k: 'products', label: 'Products', html: v => esc((v || []).join(', '))},
    {k: 'effective', label: 'Effective', html: v => esc(fmtDate(v))},
    {k: 'status', label: 'State', html: v => okb(v)}
  ], FEE_TYPES, {sort: 'code', pageSize: 12});

  fpFillSel('ftSel', fpTypeOptions(), FP_SEL.fee || 'APF');
  const t = FEE_TYPE_BY_CODE[fpPicked('ftSel', 'APF')] || FEE_TYPES[0];
  FP_SEL.fee = t.code;
  if(el('ftSelPill')) el('ftSelPill').textContent = t.code;
  put('ftDetail', strip([
    ['Code', esc(t.code)],
    ['Group', esc(t.group)],
    ['Basis', esc(t.basis)],
    ['State', okb(t.status)],
    ['Products', num((t.products || []).length)]
  ]) + [
    ['Rate', t.basis === 'Fixed' ? fpM(t.fixed) : fpPct(t.pct)],
    ['Floor', t.min ? fpM(t.min) : '—'],
    ['Ceiling', t.max ? fpM(t.max) : '—'],
    ['Effective from', esc(fmtDate(t.effective))],
    ['Grace days', num(t.graceDays)],
    ['Owner', esc(staffName(t.owner))],
    ['Description', esc(t.description)],
    ['Charges raised', num(CHARGES.filter(c => c.type === t.code).length)]
  ].map(([k, v]) => kvRow(k, v)).join(''));

  if(el('ftName')) el('ftName').value = t.name;
  if(el('ftDesc')) el('ftDesc').value = t.description;
  if(el('ftBasis')) el('ftBasis').value = t.basis;
  if(el('ftPct')) el('ftPct').value = t.pct || 0;
  if(el('ftFixed')) el('ftFixed').value = t.fixed || 0;
  if(el('ftMin')) el('ftMin').value = t.min || 0;
  if(el('ftMax')) el('ftMax').value = t.max || 0;
  if(el('ftEffective')) el('ftEffective').value = t.effective;
  if(el('ftProducts')) el('ftProducts').innerHTML = PRODUCTS.map(p => {
    const on2 = (t.products || []).indexOf(p.id) >= 0;
    return `<button class="chip${on2 ? ' on' : ''}" data-ftprod="${esc(p.id)}">${esc(p.id)} · ${esc(p.name)}</button>`;
  }).join('');

  if(el('ftHistPill')) el('ftHistPill').textContent = num(FEE_CONFIG_HISTORY.length) + ' changes';
  renderTable('ftHistBody', [
    {k: 'when', label: 'When', html: v => esc(fpWhen(v))},
    {k: 'what', label: 'Setting'},
    {k: 'from', label: 'Previous'},
    {k: 'to', label: 'Updated'},
    {k: 'by', label: 'Officer', html: v => esc(staffName(v))},
    {k: 'reason', label: 'Why'}
  ], FEE_CONFIG_HISTORY, {sort: 'when', pageSize: 8});

  put('ftGrid',
    chartBox({title: 'Charges raised by fee type', sub: 'Count against value', type: 'bar', h: 210,
      cats: FEE_CHARGE_TYPES.map(x => x.code), value: num(CHARGES.filter(c => c.kind === 'Fee').length),
      series: [{name: 'Charges', colour: '#C9A227',
        data: FEE_CHARGE_TYPES.map(x => CHARGES.filter(c => c.type === x.code).length)}]}) +
    chartBox({title: 'Tariff by basis', sub: 'How the charges are worked out', type: 'donut', h: 210,
      cats: ['Percentage', 'Fixed', 'Daily'], value: num(FEE_TYPES.length),
      series: [{name: 'Types', data: ['Percentage', 'Fixed', 'Daily'].map(b => FEE_TYPES.filter(x => x.basis === b).length)}]}));
}
function fpFeeSave(){
  const t = FEE_TYPE_BY_CODE[FP_SEL.fee];
  if(!t){ toast('Pick a fee type first', 'err'); return; }
  const name = (el('ftName') && el('ftName').value || '').trim();
  const desc = (el('ftDesc') && el('ftDesc').value || '').trim();
  const basis = fpPicked('ftBasis', t.basis);
  const pctv = fpNum('ftPct', t.pct);
  const fixed = fpNum('ftFixed', t.fixed);
  const min = fpNum('ftMin', t.min);
  const max = fpNum('ftMax', t.max);
  if(!name){ toast('A fee needs a name', 'err'); return; }
  if(basis === 'Percentage' && (pctv <= 0 || pctv > 20)){ toast('A percentage charge must sit between 0 and 20%', 'err'); return; }
  if(basis === 'Fixed' && fixed <= 0){ toast('A fixed charge must be above zero', 'err'); return; }
  if(max && min && max < min){ toast('The ceiling cannot sit below the floor', 'err'); return; }
  const before = t.basis === 'Fixed' ? fpM(t.fixed) : fpPct(t.pct);
  t.name = name; t.description = desc; t.basis = basis; t.pct = pctv; t.fixed = fixed;
  t.min = min; t.max = max;
  t.effective = fpPicked('ftEffective', t.effective);
  const after = t.basis === 'Fixed' ? fpM(t.fixed) : fpPct(t.pct);
  fpAudit('Fee configuration', t.code + ' · ' + t.name, before, after, FEE_STAFF_REF,
    'Configuration changed in the fee screen', 'Configuration');
  if(el('ftMsg')) el('ftMsg').textContent = t.code + ' saved — ' + after
    + (min ? ', floor ' + fpM(min) : '') + (max ? ', ceiling ' + fpM(max) : '')
    + ', effective ' + fmtDate(t.effective) + '. Every earlier charge keeps the rate it was assessed at.';
  renderAll();
  toast(t.code + ' configuration saved');
}
function fpFeeToggle(){
  const t = FEE_TYPE_BY_CODE[FP_SEL.fee];
  if(!t){ toast('Pick a fee type first', 'err'); return; }
  t.enabled = !t.enabled;
  t.status = t.enabled ? 'Active' : 'Paused';
  fpAudit('Fee ' + (t.enabled ? 'enabled' : 'disabled'), t.code + ' · ' + t.name, t.enabled ? 'Paused' : 'Active',
    t.status, FEE_STAFF_REF, 'Switched in the fee screen', 'Configuration');
  if(el('ftMsg')) el('ftMsg').textContent = t.code + ' is now ' + t.status.toLowerCase()
    + '. A disabled fee is not raised on any new assessment; the charges already on file stand.';
  renderAll();
  toast(t.code + ' ' + t.status.toLowerCase());
}
function fpFeeProduct(prod){
  const t = FEE_TYPE_BY_CODE[FP_SEL.fee];
  if(!t) return;
  const list = (t.products || []).slice();
  const i = list.indexOf(prod);
  if(i >= 0) list.splice(i, 1); else list.push(prod);
  t.products = list;
  fpAudit('Fee products', t.code, '—', list.join(', ') || 'none', FEE_STAFF_REF,
    'Product assignment changed', 'Configuration');
  renderAll();
  toast(t.code + ' now applies to ' + (list.length ? list.join(', ') : 'no product'));
}

/* ---------------- 3 · APPLICATION FEES ---------------- */
function renderApplicationFees(){
  const all = CHARGES.filter(c => c.group === 'Application');
  const rows = fpCharges().filter(c => c.group === 'Application');
  const collected = sum(all, c => c.paid);
  const exempt = CHARGES.filter(c => c.group === 'Application' && c.waived > 0);
  const refunds = all.filter(c => /refund/i.test(c.source || '') || (c.reversed > 0 && c.paid > 0));
  if(el('afPill')){ el('afPill').className = 'badge b-warn'; el('afPill').textContent = num(all.length) + ' application fees'; }
  put('afKpis', [
    ['Application fees', num(all.length), 'Processing, administration and verification', ''],
    ['Assessed', fpM(sum(all, c => c.amount)), 'Against ' + num(new Set(all.map(c => c.app)).size) + ' applications', ''],
    ['Collected', fpM(collected), pct(collected, sum(all, c => c.amount)).toFixed(1) + '% of the value', ''],
    ['Outstanding', fpM(sum(all, c => c.balance)), num(all.filter(c => c.balance > 0).length) + ' unpaid', ''],
    ['Exempted or waived', num(exempt.length), fpM(sum(exempt, c => c.waived)) + ' waived', ''],
    ['Refund requests', num(refunds.length), 'Where a fee was taken and not earned', refunds.length ? 'amber' : ''],
    ['Receipts', num(all.filter(c => c.receipt).length), 'Every payment has one', ''],
    ['Average fee', fpM(all.length ? Math.round(sum(all, c => c.amount) / all.length) : 0), 'Per application', '']
  ].map(([l, v, s, k]) => kpiCard(l, v, s, k)).join(''));

  if(el('afCount')) el('afCount').textContent = num(rows.length) + ' rows';
  renderTable('afBody', [
    {k: 'id', label: 'Charge'},
    {k: 'app', label: 'Application'},
    {k: 'typeName', label: 'Fee'},
    {k: 'cust', label: 'Customer', html: v => esc(custName(v))},
    {k: 'product', label: 'Product', html: v => esc(v ? prodName(v) : '—')},
    {k: 'assessed', label: 'Assessed', html: v => esc(fmtDate(v))},
    {k: 'amount', label: 'Amount', num: true, html: v => esc(fpM(v))},
    {k: 'paid', label: 'Paid', num: true, html: v => esc(fpM(v))},
    {k: 'balance', label: 'Balance', num: true, html: v => esc(fpM(v))},
    {k: 'status', label: 'State', html: v => okb(v)}
  ], rows, {sort: 'amount', pageSize: 10});

  const byType = ['APF', 'ADF', 'AVF'].map(code => {
    const set = all.filter(c => c.type === code);
    return {type: code, name: FEE_TYPE_NAME(code), count: set.length, amount: sum(set, c => c.amount),
      paid: sum(set, c => c.paid), balance: sum(set, c => c.balance)};
  });
  if(el('afTypePill')) el('afTypePill').textContent = num(byType.length) + ' fee kinds';
  renderTable('afTypeBody', [
    {k: 'type', label: 'Code'},
    {k: 'name', label: 'Fee'},
    {k: 'count', label: 'Charges', num: true},
    {k: 'amount', label: 'Assessed', num: true, html: v => esc(fpM(v))},
    {k: 'paid', label: 'Paid', num: true, html: v => esc(fpM(v))},
    {k: 'balance', label: 'Balance', num: true, html: v => esc(fpM(v))}
  ], byType, {sort: 'amount', pageSize: 6, onRow: false});

  if(el('afStatusPill')) el('afStatusPill').textContent = pct(collected, sum(all, c => c.amount)).toFixed(1) + '% paid';
  const statuses = ['Paid', 'Part paid', 'Outstanding', 'Waived', 'Reversed', 'Pending approval'];
  put('afStatusBox', statuses.map(st => {
    const set = all.filter(c => c.status === st);
    return `<div class="meterrow"><div style="flex:1">
        <div class="sl"><b>${esc(st)}</b><span>${num(set.length)} charges · ${fpM(sum(set, c => c.amount))}</span></div>
        <div class="meter"><i style="width:${clamp(pct(set.length, Math.max(1, all.length)), 0, 100).toFixed(1)}%"></i></div>
      </div><div class="sv">${num(set.length)}</div></div>`;
  }).join(''));

  if(el('afExemptPill')) el('afExemptPill').textContent = num(exempt.length) + ' exempt';
  renderTable('afExemptBody', [
    {k: 'id', label: 'Charge'},
    {k: 'cust', label: 'Customer', html: v => esc(custName(v))},
    {k: 'typeName', label: 'Fee'},
    {k: 'waived', label: 'Waived', num: true, html: v => esc(fpM(v))},
    {k: 'reason', label: 'Reason'},
    {k: 'status', label: 'State', html: v => okb(v)}
  ], exempt, {sort: 'waived', pageSize: 5});

  if(el('afReceiptPill')) el('afReceiptPill').textContent = num(all.filter(c => c.receipt).length) + ' receipts';
  renderTable('afReceiptBody', [
    {k: 'receipt', label: 'Receipt'},
    {k: 'app', label: 'Application'},
    {k: 'cust', label: 'Customer', html: v => esc(custName(v))},
    {k: 'paid', label: 'Paid', num: true, html: v => esc(fpM(v))},
    {k: 'method', label: 'Method'}
  ], all.filter(c => c.receipt), {sort: 'paid', pageSize: 6});

  if(el('afHistPill')) el('afHistPill').textContent = num(all.length) + ' events';
  renderTable('afHistBody', [
    {k: 'assessed', label: 'When', html: v => esc(fmtDate(v))},
    {k: 'id', label: 'Charge'},
    {k: 'app', label: 'Application'},
    {k: 'typeName', label: 'Fee'},
    {k: 'amount', label: 'Amount', num: true, html: v => esc(fpM(v))},
    {k: 'status', label: 'State', html: v => okb(v)},
    {k: 'officer', label: 'Officer', html: v => esc(staffName(v))}
  ], all, {sort: 'assessed', pageSize: 8});

  put('afGrid',
    chartBox({title: 'Application fees by month', sub: 'Assessed against collected', type: 'bar', h: 210,
      cats: buckets().map(bucketLabel), value: fpM(sum(all, c => c.amount)),
      series: [{name: 'Assessed', data: seriesBy(all, c => c.assessed, c => c.amount).data, colour: '#C9A227'}]}) +
    chartBox({title: 'By fee kind', sub: 'Processing, administration and verification', type: 'donut', h: 210,
      cats: byType.map(t => t.type), value: num(all.length),
      series: [{name: 'Charges', data: byType.map(t => t.count)}]}));
}
function fpRefundRequest(){
  const cands = CHARGES.filter(c => c.group === 'Application' && c.paid > 0 && c.status !== 'Reversed');
  if(!cands.length){ if(el('afRefundMsg')) el('afRefundMsg').textContent = 'No paid application fee is available to refund.'; return; }
  const c = cands[0];
  const r = {id: 'REV-2026-' + pad(700 + REVERSALS.length, 3), charge: c.id, cust: c.cust, loan: c.loan,
    type: c.type, typeName: c.typeName, kind: c.kind, amount: c.paid, reason: 'Approved goodwill',
    requestedBy: FEE_STAFF_REF, requestedOn: TODAY, approvedBy: '', approvedOn: '', status: 'Pending',
    refund: 'Refunded to the customer', lane: 'Reversals', severity: 'Medium', owner: c.officer, region: c.region};
  REVERSALS.unshift(r);
  fpAudit('Refund requested', r.id, '—', fpM(c.paid) + ' on ' + c.id, FEE_STAFF_REF,
    'Application fee refund request', 'Reversals');
  if(el('afRefundMsg')) el('afRefundMsg').textContent = 'A refund of ' + fpM(c.paid) + ' was requested for '
    + c.id + ' (' + custName(c.cust) + '). It waits in the corrections queue as ' + r.id + '.';
  renderAll();
  toast('Refund request ' + r.id + ' raised');
}

/* ---------------- 4 · ORIGINATION FEES ---------------- */
function renderOriginationFees(){
  const all = CHARGES.filter(c => c.group === 'Origination');
  const rows = fpCharges().filter(c => c.group === 'Origination');
  const collected = sum(all, c => c.paid);
  const deducted = all.filter(c => /disbursement/i.test(c.source || ''));
  const separate = all.filter(c => /separate/i.test(c.source || ''));
  if(el('ofPill')){ el('ofPill').className = 'badge b-warn'; el('ofPill').textContent = num(all.length) + ' origination fees'; }
  put('ofKpis', [
    ['Origination fees', num(all.length), 'Processing, administration, arrangement and disbursement', ''],
    ['Assessed', fpM(sum(all, c => c.amount)), 'On ' + num(new Set(all.map(c => c.loan)).size) + ' loans', ''],
    ['Collected', fpM(collected), pct(collected, sum(all, c => c.amount)).toFixed(1) + '% of the value', ''],
    ['Outstanding', fpM(sum(all, c => c.balance)), num(all.filter(c => c.balance > 0).length) + ' open', ''],
    ['Deducted at payout', num(deducted.length), fpM(sum(deducted, c => c.amount)), ''],
    ['Paid separately', num(separate.length), fpM(sum(separate, c => c.amount)), ''],
    ['Average fee', fpM(all.length ? Math.round(sum(all, c => c.amount) / all.length) : 0), 'Per loan', ''],
    ['Disclosed first', num(all.length), 'Shown before the customer accepted', '']
  ].map(([l, v, s, k]) => kpiCard(l, v, s, k)).join(''));

  if(el('ofCount')) el('ofCount').textContent = num(rows.length) + ' rows';
  renderTable('ofBody', [
    {k: 'id', label: 'Charge'},
    {k: 'loan', label: 'Loan'},
    {k: 'typeName', label: 'Fee'},
    {k: 'cust', label: 'Customer', html: v => esc(custName(v))},
    {k: 'base', label: 'Loan amount', num: true, html: v => esc(fpM(v))},
    {k: 'amount', label: 'Fee', num: true, html: v => esc(fpM(v))},
    {k: 'paid', label: 'Settled', num: true, html: v => esc(fpM(v))},
    {k: 'balance', label: 'Balance', num: true, html: v => esc(fpM(v))},
    {k: 'status', label: 'State', html: v => okb(v)}
  ], rows, {sort: 'amount', pageSize: 10});

  fpFillSel('ofLoan', fpLoanOptions(), FP_SEL.ofLoan || (LOANS[0] || {}).ref);
  const loan = LOAN_BY_REF[fpPicked('ofLoan', (LOANS[0] || {}).ref)] || LOANS[0];
  if(loan){
    const mine = CHARGES.filter(c => c.loan === loan.ref && c.group === 'Origination');
    const total = sum(mine, c => c.amount);
    if(el('ofCalcPill')) el('ofCalcPill').textContent = num(mine.length) + ' fees · ' + fpM(total);
    if(el('ofRulePill')) el('ofRulePill').textContent = FEE_RULES.deductAtDisbursement ? 'Deducted at payout' : 'Paid separately';
    put('ofCalcBox', strip([
      ['Loan', esc(loan.ref)],
      ['Amount', fpM(loan.amount)],
      ['Term', num(loan.term) + ' months'],
      ['Fees', fpM(total)],
      ['Share of the loan', pct(total, loan.amount).toFixed(2) + '%']
    ]) + mine.map(c => kvRow(c.typeName, fpM(c.amount) + ' · ' + esc(c.basis.toLowerCase())
      + (c.rate ? ' ' + fpPct(c.rate) : ''))).join(''));
    put('ofRuleBox', [
      ['Deduct at disbursement', badge(FEE_RULES.deductAtDisbursement ? 'On' : 'Off', FEE_RULES.deductAtDisbursement ? 'b-ok' : 'b-warn')],
      ['Separate payment allowed', 'Yes, where the customer chooses to pay the fee first'],
      ['Paid separately on this loan', num(mine.filter(c => /separate/i.test(c.source || '')).length) + ' fee(s)'],
      ['Deducted at payout', num(mine.filter(c => /disbursement/i.test(c.source || '')).length) + ' fee(s)'],
      ['Net paid out', fpM(loan.amount - sum(mine.filter(c => /disbursement/i.test(c.source || '')), c => c.amount))]
    ].map(([k, v]) => kvRow(k, v)).join(''));
  }
  if(el('ofDiscloseBox')) put('ofDiscloseBox', [
    ['Shown before acceptance', badge(FEE_RULES.disclosureBeforeAcceptance ? 'Required' : 'Not required',
      FEE_RULES.disclosureBeforeAcceptance ? 'b-ok' : 'b-crit')],
    ['What the customer sees', 'A cash amount for every fee, and the total taken at payout'],
    ['Agreement', 'The loan agreement itemises every fee and the customer signs for it'],
    ['Recorded', 'The disclosure and the acceptance are both in the file']
  ].map(([k, v]) => kvRow(k, v)).join(''));

  if(el('ofReceiptPill')) el('ofReceiptPill').textContent = num(all.filter(c => c.receipt).length) + ' receipts';
  renderTable('ofReceiptBody', [
    {k: 'receipt', label: 'Receipt'},
    {k: 'loan', label: 'Loan'},
    {k: 'typeName', label: 'Fee'},
    {k: 'paid', label: 'Paid', num: true, html: v => esc(fpM(v))}
  ], all.filter(c => c.receipt), {sort: 'paid', pageSize: 6});

  if(el('ofHistPill')) el('ofHistPill').textContent = num(all.length) + ' events';
  renderTable('ofHistBody', [
    {k: 'assessed', label: 'When', html: v => esc(fmtDate(v))},
    {k: 'id', label: 'Charge'},
    {k: 'loan', label: 'Loan'},
    {k: 'typeName', label: 'Fee'},
    {k: 'amount', label: 'Amount', num: true, html: v => esc(fpM(v))},
    {k: 'source', label: 'How it was settled'},
    {k: 'status', label: 'State', html: v => okb(v)}
  ], all, {sort: 'assessed', pageSize: 8});

  put('ofGrid',
    chartBox({title: 'Origination fees by kind', sub: 'Where the value comes from', type: 'bar', h: 210,
      cats: ['LPF', 'LAF', 'LAF2', 'LDF'], value: fpM(sum(all, c => c.amount)),
      series: [{name: 'Assessed', colour: '#2F6FED',
        data: ['LPF', 'LAF', 'LAF2', 'LDF'].map(code => sum(all.filter(c => c.type === code), c => c.amount))}]}) +
    chartBox({title: 'Deducted against paid separately', sub: 'How the loan fees settle', type: 'donut', h: 210,
      cats: ['At payout', 'Separately'], value: num(all.length),
      series: [{name: 'Fees', data: [deducted.length, separate.length]}]}));
}

/* ===================== filter bar ===================== */
function fpFillFilters(){
  const fill = (id, list, label) => {
    const n = el(id);
    if(!n) return;
    n.innerHTML = `<option value="">All ${esc(label)}</option>` +
      list.map(v => `<option value="${esc(v)}">${esc(v)}</option>`).join('');
  };
  fill('fltType', FEE_TYPES.map(t => t.code), 'charge types');
  fill('fltSeverity', ['Low', 'Medium', 'High', 'Critical'], 'severities');
  fill('fltStatus', ['Paid', 'Part paid', 'Outstanding', 'Waived', 'Reversed', 'At the cap', 'Pending approval'], 'states');
  fill('fltRegion', REGIONS.concat(['Head office']), 'branches');
  const own = el('fltOwner');
  if(own) own.innerHTML = '<option value="">All officers</option>' +
    STAFF.map(s => `<option value="${esc(s.id)}">${esc(s.name)}</option>`).join('');
  const prod = el('fltProduct');
  if(prod) prod.innerHTML = '<option value="">All products</option>' +
    PRODUCTS.map(p => `<option value="${esc(p.id)}">${esc(p.name)}</option>`).join('');
  fpSyncFilters();
}
function fpSyncFilters(){
  if(el('fltFrom')) el('fltFrom').value = FILTER.from;
  if(el('fltTo')) el('fltTo').value = FILTER.to;
  if(el('fltSearch')) el('fltSearch').value = FILTER.q;
  [['kind', 'fltKind'], ['type', 'fltType'], ['severity', 'fltSeverity'], ['status', 'fltStatus'],
    ['owner', 'fltOwner'], ['region', 'fltRegion'], ['product', 'fltProduct']]
    .forEach(([k, id]) => { if(el(id)) el(id).value = FILTER[k] || ''; });
  document.querySelectorAll('#fltLaneChips [data-lane]').forEach(c =>
    c.classList.toggle('on', (c.dataset.lane || '') === FILTER.lane));
}
function fpApplyFilters(){
  FILTER.from = (el('fltFrom') && el('fltFrom').value) || '2026-01-01';
  FILTER.to = (el('fltTo') && el('fltTo').value) || TODAY;
  FILTER.q = ((el('fltSearch') && el('fltSearch').value) || '').trim();
  FILTER.kind = el('fltKind') ? el('fltKind').value : '';
  FILTER.type = el('fltType') ? el('fltType').value : '';
  FILTER.severity = el('fltSeverity') ? el('fltSeverity').value : '';
  FILTER.status = el('fltStatus') ? el('fltStatus').value : '';
  FILTER.owner = el('fltOwner') ? el('fltOwner').value : '';
  FILTER.region = el('fltRegion') ? el('fltRegion').value : '';
  FILTER.product = el('fltProduct') ? el('fltProduct').value : '';
  renderAll(); fpFilterSummary();
  toast('Filters applied');
}
function fpClearFilter(k){
  if(k) FILTER[k] = '';
  else Object.keys(FILTER).forEach(key => { if(key !== 'from' && key !== 'to') FILTER[key] = ''; });
  fpSyncFilters(); renderAll(); fpFilterSummary();
  toast(k ? 'Filter cleared' : 'All filters cleared');
}
function fpFilterSummary(){
  const chips = [];
  if(FILTER.lane) chips.push(['lane', 'Area: ' + FILTER.lane]);
  if(FILTER.kind) chips.push(['kind', 'Kind: ' + FILTER.kind]);
  if(FILTER.type) chips.push(['type', 'Type: ' + FEE_TYPE_NAME(FILTER.type)]);
  if(FILTER.severity) chips.push(['severity', 'Severity: ' + FILTER.severity]);
  if(FILTER.status) chips.push(['status', 'State: ' + FILTER.status]);
  if(FILTER.owner) chips.push(['owner', 'Officer: ' + staffName(FILTER.owner)]);
  if(FILTER.region) chips.push(['region', 'Branch: ' + FILTER.region]);
  if(FILTER.product) chips.push(['product', 'Product: ' + prodName(FILTER.product)]);
  if(FILTER.q) chips.push(['q', 'Search: “' + FILTER.q + '”']);
  if(el('fltSummary')) el('fltSummary').textContent = chips.length
    ? chips.length + ' filter' + (chips.length === 1 ? '' : 's') + ' · ' + fmtDate(FILTER.from) + ' – ' + fmtDate(FILTER.to)
    : 'Date range only';
  if(el('fltChips')) el('fltChips').innerHTML = chips.map(([k, label]) =>
    `<span class="fchip on" data-clear="${k}">${esc(label)} <b style="margin-left:4px">×</b></span>`).join('')
    || '<span class="qhint">No filters applied — the whole charge book is shown.</span>';
  const s = fpStats();
  if(el('fltCounts')) el('fltCounts').innerHTML = [
    ['Charges', CHARGES.length], ['Fees', s.fees], ['Penalties', s.penalties],
    ['Outstanding', fpOpenCharges().length], ['Collections', COLLECTIONS.length],
    ['Waivers', WAIVERS.length], ['Corrections', REVERSALS.length], ['Open issues', fpIssues().length]
  ].map(([k, v]) => `<div><div class="sl">${esc(k)}</div><div class="sv">${num(v)}</div></div>`).join('');
  if(el('fltResult')) el('fltResult').textContent = 'Showing the charge book for ' + fmtDate(FILTER.from) + ' – '
    + fmtDate(FILTER.to) + (chips.length ? ' · ' + chips.map(c => c[1]).join(' · ') : ' · no dimension filters');
}

/* ===================== navigation, render loop, wiring ===================== */
function goto(id){
  const sec = document.getElementById(id);
  if(!sec) return;
  document.querySelectorAll('.snav').forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + id));
  if(location.hash !== '#' + id) history.replaceState(null, '', '#' + id);
  if(typeof sec.scrollIntoView === 'function') sec.scrollIntoView({behavior: 'smooth', block: 'start'});
}
function renderBand(){
  const s = fpStats();
  const set = (id, v) => { if(el(id)) el(id).textContent = v; };
  set('bandScore', Math.round(s.score) + '%');
  set('bandFees', fpM(s.assessedFees));
  set('bandPen', fpM(s.assessedPens));
  set('bandOut', fpM(s.outstanding));
  set('bandAlerts', num(fpIssues().length));
  set('topRefresh', REFRESH);
}
function renderAll(){
  renderOverview();
  renderFeeTypes();
  renderApplicationFees();
  renderOriginationFees();
  renderPenalties();
  renderCalculation();
  renderAdminCharges();
  renderProducts();
  renderCustomerAccounts();
  renderCollections();
  renderWaivers();
  renderReversals();
  renderNotices();
  renderLedger();
  renderPaymentLinks();
  renderSecurity();
  renderDatabase();
  renderReports();
  renderSettings();
  renderAudit();
  renderBand();
}
function fpQuickCsv(){
  const cols = ['Charge', 'Kind', 'Type', 'Customer', 'Loan', 'Assessed', 'Due', 'Amount', 'Paid', 'Balance', 'State'];
  const rows = fpCharges().map(c => [c.id, c.kind, c.typeName, custName(c.cust), c.loan,
    fmtDate(c.assessed), fmtDate(c.due), fpM(c.amount), fpM(c.paid), fpM(c.balance), c.status]);
  downloadFile('charge-register-' + TODAY.replace(/-/g, '') + '.csv', 'text/csv', toCsv([cols].concat(rows)));
  logExport('Charge register', 'CSV', rows.length);
  renderExportHistory();
  toast(rows.length + ' charges exported');
}
function fpPrintPage(){
  printTable('Fees and penalties register',
    [{label: 'Charge'}, {label: 'Type'}, {label: 'Customer'}, {label: 'Amount', num: true},
      {label: 'Balance', num: true}, {label: 'State'}],
    CHARGES.slice(0, 80).map(c => [c.id, c.typeName, custName(c.cust), fpM(c.amount), fpM(c.balance), c.status]));
  logExport('Charge register print', 'PDF', 80);
  renderExportHistory();
  toast('Register ready to print');
}
function wireAll(){
  document.addEventListener('click', e => {
    if(sortOrPage(e)) return;

    if(e.target.closest('#modalClose') || e.target.id === 'modal'){ closeModal(); return; }

    const snav = e.target.closest('.snav');
    if(snav){ e.preventDefault(); goto(snav.getAttribute('href').slice(1)); return; }

    const lane = e.target.closest('#fltLaneChips [data-lane]');
    if(lane){ FILTER.lane = lane.dataset.lane; fpSyncFilters(); renderAll(); fpFilterSummary(); return; }

    const chip = e.target.closest('[data-clear]');
    if(chip){ fpClearFilter(chip.dataset.clear); return; }

    const jump = e.target.closest('[data-goto]');
    if(jump){ goto(jump.dataset.goto); return; }

    const prodBtn = e.target.closest('[data-ftprod]');
    if(prodBtn){ fpFeeProduct(prodBtn.dataset.ftprod); return; }

    const notif = e.target.closest('[data-fpnotif]');
    if(notif){ fpNotifyToggle(Number(notif.dataset.fpnotif)); return; }

    const perm = e.target.closest('[data-fpperm]');
    if(perm){ fpTogglePerm(perm.dataset.fpperm, Number(perm.dataset.cap)); return; }

    if(e.target.closest('#menuBtn')){ el('sidebar').classList.toggle('open'); return; }
    if(e.target.closest('#fltApply')){ fpApplyFilters(); return; }
    if(e.target.closest('#fltReset')){ fpClearFilter(''); return; }
    if(e.target.closest('#refreshBtn')){ REFRESH = TODAY + ' · ' + fpNow(); renderAll(); renderExportHistory(); toast('Every figure recalculated'); return; }
    if(e.target.closest('#printBtn')){ fpPrintPage(); return; }
    if(e.target.closest('#quickCsv')){ fpQuickCsv(); return; }
    if(e.target.closest('#bellBtn')){ goto('s13'); return; }

    /* 2 · fee management */
    if(e.target.closest('#ftSaveBtn')){ fpFeeSave(); return; }
    if(e.target.closest('#ftToggleBtn')){ fpFeeToggle(); return; }
    /* 3 · application fees */
    if(e.target.closest('#afRefundBtn')){ fpRefundRequest(); return; }
    /* 6 · calculation */
    if(e.target.closest('#pcCalcBtn')){ renderCalculation(); toast('Penalty recalculated'); return; }
    if(e.target.closest('#pcDupBtn')){
      const w = fpPenaltyWork({loan: fpPicked('pcLoan', ''), due: fpPicked('pcDue', TODAY),
        asAt: fpPicked('pcAsAt', TODAY), paid: fpNum('pcPaid'), overdue: fpNum('pcOverdue')});
      if(el('pcDupMsg')) el('pcDupMsg').textContent = w.existing
        ? 'A penalty already sits on ' + w.loan.ref + ' for the instalment due ' + fmtDate(w.due) + ': ' + w.existing.id
          + ' at ' + fpM(w.existing.amount) + '. The engine will not raise a second one.'
        : 'No penalty exists yet on ' + w.loan.ref + ' for the instalment due ' + fmtDate(w.due) + '. One may be raised.';
      toast(w.existing ? 'A duplicate would be refused' : 'No existing penalty found', w.existing ? 'err' : 'ok');
      return; }
    if(e.target.closest('#pcVerifyBtn')){
      const w = fpPenaltyWork({loan: fpPicked('pcLoan', ''), due: fpPicked('pcDue', TODAY),
        asAt: fpPicked('pcAsAt', TODAY), paid: fpNum('pcPaid'), overdue: fpNum('pcOverdue')});
      const manual = Math.min(w.raw, w.cap);
      const ok = Math.abs(fpRound(manual) - w.amount) <= 1;
      if(el('pcVerifyMsg')) el('pcVerifyMsg').textContent = (ok ? 'Verified: ' : 'A difference appeared: ')
        + 'the engine produced ' + fpM(w.amount) + ' and the arithmetic by hand gives ' + fpM(fpRound(manual)) + '.';
      toast(ok ? 'The arithmetic checks out' : 'The arithmetic does not match', ok ? 'ok' : 'err');
      return; }
    /* 7 · other charges */
    if(e.target.closest('#ocDiscloseBtn')){
      if(el('ocDiscloseMsg')) el('ocDiscloseMsg').textContent = 'Disclosure for administrative charges: "This charge of '
        + fpM(FEE_TYPE_BY_CODE.AMF.fixed) + ' is an account maintenance fee, charged once a quarter on an open loan account. '
        + 'It is itemised on your statement and a receipt is issued when it is paid."';
      toast('Disclosure text shown'); return; }
    /* 8 · products */
    if(e.target.closest('#ppPreviewBtn')){ fpPreviewRun(); return; }
    /* 9 · customer accounts */
    if(e.target.closest('#caStmtBtn')){ fpCustomerStatement(); return; }
    /* 10 · collections */
    if(e.target.closest('#clPayBtn')){ fpRecordCollection(); return; }
    if(e.target.closest('#clReceiptBtn')){
      const c = CHARGES.find(x => x.id === fpPicked('clCharge', ''));
      if(!c || !c.receipt){ toast('Nothing has been collected on that charge yet', 'err'); return; }
      openModal('Receipt ' + c.receipt, c.id + ' · ' + custName(c.cust),
        `<div class="receiptdoc">
          <div class="sliphead">GOLDEN FINANCIAL SERVICES</div>
          <div class="qhint">Lilongwe · Malawi · receipt ${esc(c.receipt)}</div>
          ${kvRow('Charge', esc(c.id))}${kvRow('Type', esc(c.typeName))}
          ${kvRow('Amount', fpM(c.amount))}${kvRow('Paid', fpM(c.paid))}
          ${kvRow('Balance', fpM(c.balance))}${kvRow('Method', esc(c.method || '—'))}
        </div>`, [{label: 'Print', act: () => printTable('Receipt ' + c.receipt,
          [{label: 'Item'}, {label: 'Value'}], [['Charge', c.id], ['Type', c.typeName], ['Paid', fpM(c.paid)],
            ['Balance', fpM(c.balance)], ['Method', c.method || '—']])},
          {label: 'Close', act: 'close'}]);
      return; }
    if(e.target.closest('#clReconBtn')){ fpReconcileCollections(); return; }
    /* 11 · waivers */
    if(e.target.closest('#wvSubmitBtn')){ fpWaiverSubmit(); return; }
    if(e.target.closest('#wvApproveBtn')){ fpWaiverDecision('approve'); return; }
    if(e.target.closest('#wvRejectBtn')){ fpWaiverDecision('reject'); return; }
    if(e.target.closest('#wvSelfBtn')){
      const w = WAIVERS.find(x => x.id === FP_SEL.waiver);
      if(!w){ toast('Pick a waiver request first', 'err'); return; }
      const mine = Object.assign({}, w, {requestedBy: FEE_STAFF_REF, status: 'Pending'});
      WAIVERS[WAIVERS.indexOf(w)] = mine;
      fpWaiverDecision('approve');
      return; }
    /* 12 · reversals */
    if(e.target.closest('#rvSubmitBtn')){ fpReversalSubmit(); return; }
    if(e.target.closest('#rvApproveBtn')){ fpReversalDecision('approve'); return; }
    if(e.target.closest('#rvRejectBtn')){ fpReversalDecision('reject'); return; }
    if(e.target.closest('#rvRecalcBtn')){ fpRecalcOutstanding(); return; }
    /* 13 · notices */
    if(e.target.closest('#ntTestSms')){ fpTestChannel('sms'); return; }
    if(e.target.closest('#ntTestEmail')){ fpTestChannel('email'); return; }
    /* 14 · ledger */
    if(e.target.closest('#lgReconBtn')){ fpLedgerReconcile(); return; }
    /* 17 · database */
    if(e.target.closest('#dbRlsBtn')){ fpVerifyRls(); return; }
    if(e.target.closest('#dbIntBtn')){ fpIntegrity(); return; }
    /* 18 · reports */
    if(e.target.closest('#rpRunBtn')){ FP_SEL.report = fpPicked('rpSel', 'fees'); fpShowReport(FP_SEL.report);
      toast('Report run'); return; }
    if(e.target.closest('#rpCsvBtn')){ fpRunReport('csv'); return; }
    if(e.target.closest('#rpPrintBtn')){ fpRunReport('print'); return; }
    /* 19 · settings */
    if(e.target.closest('#stSaveBtn')){ fpSaveSettings(); return; }
    if(e.target.closest('#stResetBtn')){ fpResetSettings(); return; }
    /* 20 · audit */
    if(e.target.closest('#auExportBtn')){ fpExportAudit(); return; }
    if(e.target.closest('#auPrintBtn')){ fpPrintAudit(); return; }
  });

  document.addEventListener('change', e => {
    const t = e.target;
    if(!t || !t.id) return;
    if(t.id === 'ftSel'){ FP_SEL.fee = t.value; renderFeeTypes(); return; }
    if(t.id === 'ofLoan'){ FP_SEL.ofLoan = t.value; renderOriginationFees(); return; }
    if(t.id === 'caSel'){ FP_SEL.customer = t.value; renderCustomerAccounts(); return; }
    if(t.id === 'clCharge'){ FP_SEL.collection = t.value; if(el('clAmount')) el('clAmount').value = '';
      renderCollections(); return; }
    if(t.id === 'rpSel'){ FP_SEL.report = t.value; fpShowReport(t.value); return; }
    if(t.id === 'auFilter'){ FP_SEL.audit = t.value; renderAudit(); return; }
    if(t.id === 'ppPreviewProduct'){ FP_SEL.product = t.value; return; }
    if(t.id === 'pcLoan' || t.id === 'pcDue' || t.id === 'pcPaid' || t.id === 'pcAsAt' || t.id === 'pcOverdue'){
      renderCalculation(); return; }
    if(/^flt(Kind|Type|Severity|Status|Owner|Region|Product)$/.test(t.id)){ fpApplyFilters(); return; }
  });

  document.addEventListener('input', e => {
    if(!e.target || !e.target.id) return;
    if(e.target.id === 'globalSearch'){ FILTER.q = e.target.value.trim(); renderAll(); fpFilterSummary(); return; }
    if(e.target.id === 'auSearch'){ renderAudit(); return; }
  });

  window.addEventListener('hashchange', () => {
    const id = (location.hash || '').slice(1);
    if(id && document.getElementById(id)) goto(id);
  });
  document.addEventListener('keydown', e => { if(e.key === 'Escape') closeModal(); });
}

/* boot */
(function(){
  fpFillFilters();
  renderAll();
  fpFilterSummary();
  renderExportHistory();
  wireAll();
  const hash = (location.hash || '').slice(1);
  if(hash) goto(hash);
})();

window.FEES_APP = {
  version: '1.0.0',
  today: TODAY,
  stats: fpStats,
  issues: fpIssues,
  report: (key, fmt) => { FP_SEL.report = key || 'fees'; fpShowReport(FP_SEL.report); if(fmt) fpRunReport(fmt); },
  export: (key, fmt) => { FP_SEL.report = key || 'fees'; fpRunReport(fmt || 'csv'); },
  set: FEE_SET,
  save: fpSaveSettings,
  reset: fpResetSettings,
  counts: () => ({
    chargeTypes: FEE_TYPES.length, charges: CHARGES.length, waivers: WAIVERS.length,
    reversals: REVERSALS.length, collections: COLLECTIONS.length, ledger: FEE_LEDGER.length,
    notices: FEE_NOTIFY_LOG.length, audit: FEE_AUDIT.length, tables: FEE_DB_TABLES.length
  })
};
</script>
</body>
</html>
