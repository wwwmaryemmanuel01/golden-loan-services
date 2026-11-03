<script>
/* ============================================================
   METHODS OF PAYMENT MANAGEMENT (4/7)
   1 · Overview  2 · Methods  3 · Mobile money  4 · Bank  5 · Cash
   ============================================================ */

/* ---------------- shared building blocks ---------------- */
function tone(s){
  if(/^(Enabled|Success|Connected|Pass|Verified|Matched|Balanced|Allocated|Issued|Delivered|Delivered \(retry\)|Approved|Healthy|OK|Cleared|Live|Active|Valid|On|Refunded|Resolved|Posted|Paid out|Within limit|Recovered|Balanced|Good|Low)$/i.test(s)) return 'b-ok';
  if(/^(Pending|Queued|Awaiting|Awaiting verification|Awaiting approval|Partially matched|Slow|Review|Variance|Near limit|Handover pending|Investigating|Monitoring|Issued|Adjustment|Disabled|Expiring|Unmatched|Open|Medium)$/i.test(s)) return 'b-warn';
  if(/^(Failed|Failing|Rejected|Expired|Blocked|Missing|Duplicate|Unauthorised|Critical|High|Unmatched|Exhausted|Timed out|Timed out|Variance|Archived)$/i.test(s)) return 'b-crit';
  return 'b-gray';
}
const okBadge = s => badge(s, tone(s));
const SEV = s => s === 'Critical' ? 'b-crit' : s === 'High' ? 'b-crit' : s === 'Medium' ? 'b-warn' : 'b-gray';
function meter(label, value, sub, max){
  const v = clamp(Number(value) || 0, 0, max || 100);
  return `<div class="meterrow"><div style="flex:1">
      <div class="sl"><b>${esc(label)}</b><span>${esc(sub || '')}</span></div>
      <div class="meter"><i style="width:${(v / (max || 100) * 100).toFixed(1)}%"></i></div>
    </div><div class="sv">${max ? num(value) : num(value) + '%'}</div></div>`;
}
const kvRow = (k, v) => `<div class="risk"><div><div class="rn">${esc(k)}</div></div><div class="rv">${v}</div></div>`;
const strip = rows => `<div class="strip">${rows.map(([k, v]) => `<div><div class="sl">${esc(k)}</div><div class="sv">${v}</div></div>`).join('')}</div>`;
const chartBox = o => chartCard(Object.assign({chart: chart(o)}, o));
const pmMoney = v => 'MK ' + num(Math.round(v));
const shortMoney = v => v >= 1000000 ? 'MK ' + (v / 1000000).toFixed(1) + 'm' : v >= 1000 ? 'MK ' + Math.round(v / 1000) + 'k' : 'MK ' + num(v);
function pmLogChange(area, what, from, to){
  PM_CHANGES.unshift({when: TODAY + ' ' + new Date().toTimeString().slice(0, 5), what, area, from, to, by: 'STF-009'});
  PM_CHANGES.length = Math.min(PM_CHANGES.length, 60);
}
function pmMethodOptions(){
  return PM_METHODS.filter(m => !m.archived).map(m => [m.code, m.name]);
}
function pmFillSel(id, pairs, keep){
  const n = el(id);
  if(!n) return;
  const cur = keep !== undefined ? keep : n.value;
  n.innerHTML = pairs.map(([v, l]) => `<option value="${esc(v)}">${esc(l)}</option>`).join('');
  if(cur && pairs.some(p => p[0] === cur)) n.value = cur;
}
function pmLoanOptions(){
  return LOANS.slice(0, 40).map(l => [l.ref, l.ref + ' · ' + custName(l.cust) + ' · ' + shortMoney(l.outstanding)]);
}
function pmCustOptions(){
  return CUSTOMERS.slice(0, 40).map(c => [c.id, c.id + ' · ' + c.name]);
}

/* ===================== 1 · PAYMENT OVERVIEW ===================== */
function renderOverview(){
  const s = pmStats();
  el('ovPill').className = 'badge ' + (s.score >= 85 ? 'b-ok' : s.score >= 70 ? 'b-warn' : 'b-crit');
  el('ovPill').textContent = s.score >= 85 ? 'Payments healthy' : s.score >= 70 ? 'Attention needed' : 'Degraded';
  el('ovStamp').textContent = 'Checked ' + lastRefresh();

  el('pmKpis').innerHTML = [
    ['Configured methods', num(PM_METHODS.length), PM_METHODS.filter(m => m.archived).length + ' archived', ''],
    ['Active methods', num(s.enabled), PM_METHODS.filter(m => m.status === 'Disabled' && !m.archived).length + ' disabled', ''],
    ['Connected services', s.providers + '/' + PM_PROVIDERS.length, (PM_PROVIDERS.length - s.providers) + ' not connected', s.providers < PM_PROVIDERS.length ? 'red' : ''],
    ['Pending confirmations', num(s.pendingVerify), s.pending + ' payments waiting on the provider', s.pending ? 'red' : ''],
    ['Successful payments', num(s.success), shortMoney(s.successVolume) + ' collected', ''],
    ['Failed payments', num(s.failed + s.cancelled), s.failedRate.toFixed(1) + '% of the register', s.failed ? 'red' : ''],
    ['Unreconciled', num(s.unreconciled), s.openRecon + ' reconciliation gaps', s.unreconciled ? 'red' : ''],
    ['Payment health', Math.round(s.score) + '%', s.duplicates + ' duplicates held', s.score >= 85 ? '' : 'red']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join('');

  el('pmMeters').innerHTML =
    meter('Payment success rate', pct(s.success, s.total), s.success + ' of ' + s.total + ' payments') +
    meter('Verification cleared', pct(PM_VERIFY.length - s.pendingVerify + PM_VERIFY.filter(v => v.status === 'Rejected').length, PM_VERIFY.length + 4), s.pendingVerify + ' still waiting') +
    meter('Reconciliation', s.reconRate, s.unreconciled + ' receipts without a statement line') +
    meter('Provider availability', pct(s.providers, PM_PROVIDERS.length), s.providers + ' of ' + PM_PROVIDERS.length + ' connections live') +
    meter('Method coverage', pct(s.enabled, PM_METHODS.filter(m => !m.archived).length), s.enabled + ' rails open to customers');

  const cells = [
    ['Airtel Money', PM_MM['MM-AIR'].status, PM_MM['MM-AIR'].uptime + '% · ' + PM_MM['MM-AIR'].latency + ' ms', PM_MM['MM-AIR'].status === 'Connected' ? 'ok' : 'crit'],
    ['TNM Mpamba', PM_MM['MM-TNM'].status, PM_MM['MM-TNM'].uptime + '% · credential expired', PM_MM['MM-TNM'].status === 'Connected' ? 'ok' : 'crit'],
    ['Bank transfers', 'Connected', PM_BANK.filter(b => b.status === 'Verified').length + ' accounts verified', 'ok'],
    ['Cash at branch', PM_CASH.enabled ? 'Enabled' : 'Disabled', num(CASH_STAFF.filter(c => c.authorised).length) + ' authorised officers', PM_CASH.enabled ? 'ok' : 'warn'],
    ['Card gateway', PM_PROVIDERS.find(p => p.id === 'PRV-03').status, 'PayChangu · 268 ms', 'ok'],
    ['SMS alerts', PM_CHANNELS.sms.status, 'Africa’s Talking · ' + PM_CHANNELS.sms.latency + ' ms', 'warn'],
    ['Email alerts', PM_CHANNELS.email.status, 'Resend · ' + PM_CHANNELS.email.latency + ' ms', 'ok'],
    ['Bank statement feeds', 'Connected', '2 feeds · morning pull', 'ok']
  ];
  el('ovConnPill').className = 'badge ' + (s.providers === PM_PROVIDERS.length ? 'b-ok' : 'b-warn');
  el('ovConnPill').textContent = s.providers + '/' + PM_PROVIDERS.length + ' live';
  el('pmBoard').innerHTML = cells.map(([n, st, sub, t]) => `<div class="scell">
      <div class="dotbg ${t}"></div><div class="stat-dot ${t}"></div>
      <div style="flex:1"><div style="font-size:10.5px;font-weight:800">${esc(n)}</div>
        <div class="qhint">${esc(sub)}</div></div>
      <div style="text-align:right"><div style="font-size:10px;font-weight:800">${esc(st)}</div></div></div>`).join('');

  const methodCats = ['Airtel Money', 'TNM Mpamba', 'Bank transfer', 'Cash'];
  el('pmGrid').innerHTML =
    chartBox({title: 'Collected by method', sub: 'Successful payments, MWK', type: 'bar', h: 190,
      cats: methodCats,
      series: [{name: 'Collected', data: methodCats.map(m => sum(PM_TXNS.filter(t => t.method === m && t.status === 'Success'), t => t.amount))}],
      value: shortMoney(s.successVolume)}) +
    chartBox({title: 'Payment outcomes', sub: 'Every transaction on the register', type: 'donut', h: 190,
      cats: ['Success', 'Pending', 'Failed', 'Cancelled', 'Reversed'],
      series: [{name: 'Payments', data: ['Success', 'Pending', 'Failed', 'Cancelled', 'Reversed'].map(k => PM_TXNS.filter(t => t.status === k).length)}],
      value: num(s.total)}) +
    chartBox({title: 'Daily volume', sub: 'Receipts per day this week', type: 'line', h: 190,
      cats: PM_RECON_DAILY.map(d => d.day),
      series: [{name: 'Matched', data: PM_RECON_DAILY.map(d => d.matched)}, {name: 'Unmatched', data: PM_RECON_DAILY.map(d => d.unmatched)}],
      value: num(sum(PM_RECON_DAILY, d => d.matched))});

  const openAlerts = ALERTS_FOR_PAYMENTS();
  el('ovAlertPill').className = 'badge ' + (openAlerts.some(a => a.severity === 'Critical') ? 'b-crit' : openAlerts.length ? 'b-warn' : 'b-ok');
  el('ovAlertPill').textContent = openAlerts.length + ' open';
  el('pmAlerts').innerHTML = openAlerts.slice(0, 5).map(a => `<div class="risk">
      <div><div class="rn">${esc(a.what)}</div><div class="rs">${esc(a.detail)}</div></div>
      <div class="rv">${badge(a.severity, SEV(a.severity))}</div></div>`).join('')
    || '<div class="empty">Nothing open — every rail is clear.</div>';

  el('pmFeed').innerHTML = `<div class="tblwrap"><table class="tbl2 dense">
      <thead><tr><th>Receipt</th><th>Customer</th><th>Method</th><th class="num">Amount</th><th>State</th></tr></thead>
      <tbody>${PM_TXNS.slice(0, 7).map(t => `<tr><td>${esc(t.receipt)}</td><td>${esc(custName(t.cust))}</td>
        <td>${esc(t.method)}</td><td class="num">${pmMoney(t.amount)}</td><td>${okBadge(t.status)}</td></tr>`).join('')}</tbody></table></div>`;
}
function ALERTS_FOR_PAYMENTS(){
  const out = [];
  PM_TXNS.filter(t => t.status === 'Failed').slice(0, 2).forEach(t => out.push({
    what: 'Failed payment · ' + t.method, detail: t.receipt + ' · ' + t.error, severity: 'High'}));
  PM_TXNS.filter(t => t.reconciled === 'Duplicate').slice(0, 1).forEach(t => out.push({
    what: 'Duplicate transaction held', detail: t.id + ' · same provider reference twice', severity: 'High'}));
  PM_RECON.filter(r => r.status === 'Blocked' || r.status === 'Variance').forEach(r => out.push({
    what: 'Reconciliation ' + r.status.toLowerCase(), detail: r.source + ' · ' + (r.difference ? pmMoney(Math.abs(r.difference)) + ' variance' : r.missing + ' missing lines'), severity: r.severity}));
  PM_PROVIDERS.filter(p => p.status !== 'Connected').forEach(p => out.push({
    what: 'Provider ' + p.status.toLowerCase(), detail: p.name + ' · ' + p.credentials + ' credentials', severity: p.severity}));
  PM_VERIFY.filter(v => v.status === 'Awaiting approval').forEach(v => out.push({
    what: 'Verification awaiting a second signature', detail: v.receipt + ' · ' + v.check, severity: 'Medium'}));
  return out;
}

/* ===================== 2 · PAYMENT METHODS ===================== */
let MSEL = 'MM-AIR';
function renderMethods(){
  const active = PM_METHODS.filter(m => m.status === 'Enabled' && !m.archived);
  const archived = PM_METHODS.filter(m => m.archived);
  el('mPill').className = 'badge ' + (active.length ? 'b-ok' : 'b-crit');
  el('mPill').textContent = active.length + ' active';
  el('mKpis').innerHTML = [
    ['Methods configured', num(PM_METHODS.length), archived.length + ' archived', ''],
    ['Enabled', num(active.length), PM_METHODS.filter(m => m.status === 'Disabled' && !m.archived).length + ' disabled', ''],
    ['Default method', (PM_METHODS.find(m => m.isDefault) || {}).name || '—', 'Shown first to every customer', ''],
    ['Customer-facing', num(PM_METHODS.filter(m => m.availability !== 'Branch only' && m.status === 'Enabled').length), 'Visible in the portal', ''],
    ['Branch-only rails', num(PM_METHODS.filter(m => m.availability === 'Branch only' && !m.archived).length), 'Cash and agent tills', ''],
    ['Methods with payments', num(PM_METHODS.filter(m => m.payments > 0).length), 'Carrying money this period', '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join('');

  el('mCount').textContent = PM_METHODS.length + ' methods';
  renderTable('mBody', [
    {k: 'name', label: 'Method'},
    {k: 'type', label: 'Type'},
    {k: 'provider', label: 'Provider'},
    {k: 'status', label: 'State', html: v => okBadge(v === 'Enabled' ? 'Enabled' : 'Disabled')},
    {k: 'isDefault', label: 'Default', html: v => v ? badge('Default', 'b-ok') : ''},
    {k: 'order', label: 'Order', num: true},
    {k: 'availability', label: 'Availability'},
    {k: 'min', label: 'Min', num: true, html: (v, r) => shortMoney(r.min)},
    {k: 'max', label: 'Max', num: true, html: (v, r) => shortMoney(r.max)},
    {k: 'payments', label: 'Payments', num: true},
    {k: 'act', label: '', html: (v, r) => `<button class="btn btn-ghost" data-mtoggle="${esc(r.code)}">${r.status === 'Enabled' ? 'Disable' : 'Enable'}</button>
       <button class="btn btn-ghost" data-mup="${esc(r.code)}">↑</button>
       <button class="btn btn-ghost" data-mdown="${esc(r.code)}">↓</button>`}
  ], PM_METHODS.filter(m => matchQ(m.name, m.type, m.provider, m.status, m.availability)), {sort: 'order', dir: 'asc', pageSize: 9, onRow: true});

  /* keep the drawer's rows openable */
  (STORE_ROWS['mBody'] || []).forEach(r => { r._open = () => openMethod(r.code); });

  const sel = PM_METHODS.find(m => m.code === MSEL) || PM_METHODS[0];
  el('mSelPill').className = 'badge ' + tone(sel.status === 'Enabled' ? 'Enabled' : 'Disabled');
  el('mSelPill').textContent = sel.status;
  pmFillSel('mSel', PM_METHODS.map(m => [m.code, m.name + (m.archived ? ' (archived)' : '')]), MSEL);
  if(el('mAvail')) el('mAvail').value = sel.availability;
  if(el('mMin')) el('mMin').value = sel.min;
  if(el('mMax')) el('mMax').value = sel.max;
  if(el('mInstr')) el('mInstr').value = sel.instructions;
  if(el('mLogo')) el('mLogo').innerHTML = ['Airtel Money mark', 'TNM Mpamba mark', 'FDH Bank mark', 'Standard Bank mark',
    'NBS mark', 'Cash mark', 'PayChangu mark', 'Agent mark', 'Agent till mark']
    .map(v => `<option${v === sel.logo ? ' selected' : ''}>${esc(v)}</option>`).join('');

  if(el('mMsg') && !el('mMsg').textContent)
    el('mMsg').textContent = 'A new rail starts disabled. Set its limits and instructions, then enable it from the table above.';
  if(el('mSelMsg') && !el('mSelMsg').textContent)
    el('mSelMsg').textContent = 'Editing ' + sel.name + ' · ' + sel.availability + ' · ' +
      shortMoney(sel.min) + ' to ' + shortMoney(sel.max) + ' · ' + sel.feePayer + ' pays the fee.';
  el('mchgPill').textContent = PM_CHANGES.filter(c => /Method|Limits|Reference|Fees/.test(c.area)).length + ' changes';
  renderTable('mchgBody', [
    {k: 'when', label: 'When', html: v => esc(String(v).slice(0, 16))},
    {k: 'what', label: 'Setting'},
    {k: 'from', label: 'Previous'},
    {k: 'to', label: 'Updated'},
    {k: 'by', label: 'By', html: v => esc(staffName(v))}
  ], PM_CHANGES.filter(c => /Method|Limits|Reference|Fees/.test(c.area)), {sort: 'when', pageSize: 6});
}
function openMethod(code){
  const m = PM_METHOD_BY_CODE[code];
  if(!m) return;
  const txn = PM_TXNS.filter(t => t.code === code || (code === 'BT-FDH' && t.code === 'BT-STD'));
  openModal(m.name, m.type + ' · ' + m.provider + ' · ' + m.status,
    `<div class="pfields" style="grid-template-columns:1fr 1fr">
      ${field('Code', esc(m.code))}${field('State', okBadge(m.status === 'Enabled' ? 'Enabled' : 'Disabled'))}
      ${field('Default', m.isDefault ? 'Yes' : 'No')}${field('Display order', num(m.order))}
      ${field('Availability', esc(m.availability))}${field('Limits', shortMoney(m.min) + ' – ' + shortMoney(m.max))}
      ${field('Fee', m.feePct + '%' + (m.feeFlat ? ' + ' + shortMoney(m.feeFlat) : '') + ' · ' + m.feePayer + ' pays')}
      ${field('Payments', num(m.payments))}${field('Collected', pmMoney(m.volume))}
      ${field('Last payment', esc(m.last))}${field('Owner', esc(staffName(m.owner)))}
      ${field('Updated', fmtDate(m.updated))}
    </div>
    <div class="minihead" style="margin-top:10px">Customer instructions</div>
    <div class="qhint">${esc(m.instructions)}</div>
    <div class="qhint" style="margin-top:8px">${num(txn.length)} transactions on this rail · ${shortMoney(sum(txn, t => t.amount))} total</div>`,
    [{label: 'Edit in the panel', act: () => { closeModal(); MSEL = code; renderMethods();
        const host = el('mSel'); if(host && host.scrollIntoView) try{ host.scrollIntoView({block: 'center'}); }catch(e){} }},
     {label: m.status === 'Enabled' ? 'Disable' : 'Enable', act: () => { closeModal(); toggleMethod(code); }},
     {label: 'Close', act: 'close'}]);
}
function toggleMethod(code){
  const m = PM_METHOD_BY_CODE[code];
  if(!m) return;
  if(m.isDefault && m.status === 'Enabled') return toast('The default method cannot be disabled — pick another default first', 'warn');
  const was = m.status;
  m.status = was === 'Enabled' ? 'Disabled' : 'Enabled';
  m.updated = TODAY; m.by = 'STF-009';
  pmLogChange('Methods', m.name + ' state', was, m.status);
  renderMethods(); renderOverview(); renderChanges(); renderStats();
  toast(m.name + ' ' + m.status.toLowerCase());
}
function moveMethod(code, dir){
  const list = PM_METHODS.slice().sort((a, b) => a.order - b.order);
  const i = list.findIndex(m => m.code === code);
  const j = i + dir;
  if(i < 0 || j < 0 || j >= list.length) return;
  const a = list[i], b = list[j];
  const t = a.order; a.order = b.order; b.order = t;
  pmLogChange('Methods', 'Display order', a.name + ' / ' + b.name, 'reordered');
  renderMethods(); renderChanges();
  toast('Display order updated');
}
function saveMethod(){
  const m = PM_METHOD_BY_CODE[MSEL];
  if(!m) return;
  const before = m.availability + ' · ' + m.min + '–' + m.max;
  m.availability = el('mAvail').value;
  m.min = Number(el('mMin').value) || m.min;
  m.max = Number(el('mMax').value) || m.max;
  m.instructions = el('mInstr').value;
  m.updated = TODAY;
  m.by = 'STF-009';
  if(m.min > m.max){ m.max = m.min + 1000; }
  pmLogChange('Methods', m.name + ' configuration', before, m.availability + ' · ' + m.min + '–' + m.max);
  renderMethods(); renderCustomer(); renderFees(); renderChanges();
  if(el('mSelMsg')) el('mSelMsg').textContent = 'Saved ' + m.name + ' · ' + m.availability + ' · ' +
    shortMoney(m.min) + ' to ' + shortMoney(m.max) + '.';
  toast('Method saved');
}
function addMethod(){
  const name = (el('mNewName').value || '').trim();
  if(!name) return toast('Give the method a name', 'warn');
  if(PM_METHODS.some(m => m.name.toLowerCase() === name.toLowerCase())) return toast('That method already exists', 'warn');
  const code = 'PM-' + (PM_METHODS.length + 1);
  PM_METHODS.push({code, name, type: el('mNewType').value, provider: (el('mNewProvider').value || 'Unassigned').trim(),
    status: 'Disabled', isDefault: false, order: PM_METHODS.length + 1, availability: 'All channels',
    min: 500, max: 1000000, feePayer: 'Customer', feePct: 0, feeFlat: 0,
    instructions: 'Add the customer instructions before this method is enabled.',
    logo: 'Cash mark', archived: false, lane: 'Bank', severity: 'Low', owner: 'STF-009', region: 'Lilongwe',
    updated: TODAY, by: 'STF-009', payments: 0, volume: 0, last: '—'});
  PM_METHOD_BY_CODE[code] = PM_METHODS[PM_METHODS.length - 1];
  el('mNewName').value = ''; el('mNewProvider').value = '';
  pmLogChange('Methods', 'Method created', 'not configured', name);
  MSEL = code;
  renderMethods(); renderOverview(); renderChanges(); renderStats();
  if(el('mMsg')) el('mMsg').textContent = '“' + name + '” added as a disabled method — set its limits, instructions and logo, then enable it.';
  toast('Payment method added');
}
function setDefaultMethod(code){
  const m = PM_METHOD_BY_CODE[code || MSEL];
  if(!m) return;
  const prev = PM_METHODS.find(x => x.isDefault);
  PM_METHODS.forEach(x => { x.isDefault = false; });
  m.isDefault = true;
  if(m.status !== 'Enabled') m.status = 'Enabled';
  pmLogChange('Methods', 'Default method', prev ? prev.name : 'none', m.name);
  renderMethods(); renderCustomer(); renderChanges();
  toast(m.name + ' is now the default method');
}
function archiveMethod(code){
  const m = PM_METHOD_BY_CODE[code || MSEL];
  if(!m) return;
  if(m.isDefault) return toast('Pick a different default before archiving the default method', 'warn');
  const was = m.archived ? 'Archived' : 'Active';
  m.archived = !m.archived;
  if(m.archived) m.status = 'Disabled';
  pmLogChange('Methods', m.name + ' archive', was, m.archived ? 'Archived' : 'Restored');
  renderMethods(); renderOverview(); renderChanges();
  toast(m.name + (m.archived ? ' archived' : ' restored'));
}

/* ===================== 3 · MOBILE MONEY ===================== */
function mmField(id, label, value, type){
  return `<div class="fg"><label>${esc(label)}</label><input id="${id}" value="${esc(value)}"${type === 'number' ? ' type="number"' : ''} /></div>`;
}
function renderMobileMoney(){
  const air = PM_MM['MM-AIR'], tnm = PM_MM['MM-TNM'];
  const mmTxns = PM_TXNS.filter(t => t.lane === 'Mobile money');
  el('mmPill').className = 'badge ' + (air.status === 'Connected' && tnm.status === 'Connected' ? 'b-ok' : 'b-crit');
  el('mmPill').textContent = (air.status === 'Connected' ? 1 : 0) + ' of 2 connected';
  el('mmKpis').innerHTML = [
    ['Airtel Money', air.status, air.uptime + '% uptime · ' + air.latency + ' ms', air.status === 'Connected' ? '' : 'red'],
    ['TNM Mpamba', tnm.status, tnm.uptime + '% uptime · ' + tnm.token, 'red'],
    ['Mobile money payments', num(mmTxns.length), shortMoney(sum(mmTxns.filter(t => t.status === 'Success'), t => t.amount)) + ' collected', ''],
    ['Mobile success rate', pct(mmTxns.filter(t => t.status === 'Success').length, mmTxns.length).toFixed(1) + '%', mmTxns.filter(t => t.status === 'Failed').length + ' failed', ''],
    ['Merchant codes', '552341 · 7125', 'Airtel till and Mpamba bill', ''],
    ['Reconciliation', MM_RECON.filter(r => r.status === 'Matched').length + '/' + MM_RECON.length, 'Airtel clean, Mpamba blocked', 'red']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join('');

  if(el('mmAirMsg') && !el('mmAirMsg').textContent)
    el('mmAirMsg').textContent = 'Merchant ' + air.code + ' · till ' + air.till + ' · last saved ' +
      fmtDate(PM_METHOD_BY_CODE['MM-AIR'].updated) + ' by ' + staffName(PM_METHOD_BY_CODE['MM-AIR'].by) + '.';
  if(el('mmTnmMsg') && !el('mmTnmMsg').textContent)
    el('mmTnmMsg').textContent = 'Merchant ' + tnm.code + ' · bill ' + tnm.till + ' · credential ' +
      tnm.token.toLowerCase() + ' — run a connection test after saving.';
  el('mmAirPill').className = 'badge ' + (air.status === 'Connected' ? 'b-ok' : 'b-crit');
  el('mmAirPill').textContent = air.status;
  el('mmAirtelBox').innerHTML =
    mmField('mmAirMerchant', 'Merchant account', air.merchant) +
    mmField('mmAirCode', 'Merchant code', air.code) +
    mmField('mmAirTill', 'Till number', air.till) +
    mmField('mmAirRef', 'Reference requirement', air.reference) +
    mmField('mmAirBase', 'API base URL', air.apiBase) +
    mmField('mmAirAuth', 'Authentication', air.auth);

  el('mmTnmPill').className = 'badge ' + (tnm.status === 'Connected' ? 'b-ok' : 'b-crit');
  el('mmTnmPill').textContent = tnm.status;
  el('mmTnmBox').innerHTML =
    mmField('mmTnmMerchant', 'Merchant account', tnm.merchant) +
    mmField('mmTnmCode', 'Bill number', tnm.code) +
    mmField('mmTnmTill', 'Till number', tnm.till) +
    mmField('mmTnmRef', 'Reference requirement', tnm.reference) +
    mmField('mmTnmBase', 'API base URL', tnm.apiBase) +
    mmField('mmTnmAuth', 'Authentication', tnm.auth);

  el('mmMerchantBox').innerHTML =
    kvRow('Airtel Money merchant', esc(air.merchant) + ' · code ' + esc(air.code)) +
    kvRow('TNM Mpamba merchant', esc(tnm.merchant) + ' · bill ' + esc(tnm.code)) +
    kvRow('Airtel till', esc(air.till) + ' · ' + esc(air.account)) +
    kvRow('Mpamba till', esc(tnm.till) + ' · ' + esc(tnm.account)) +
    kvRow('Reference, Airtel', esc(air.reference)) +
    kvRow('Reference, Mpamba', esc(tnm.reference)) +
    kvRow('Receipt on payment', 'Issued automatically from the receipt sequence');

  el('mmConnPill').className = 'badge ' + (tnm.status === 'Connected' ? 'b-ok' : 'b-warn');
  el('mmConnPill').textContent = 'Requests: ' + (tnm.status === 'Connected' ? 'both live' : '1 of 2');
  el('mmConnBox').innerHTML =
    kvRow('Airtel request mode', esc(air.requestMode)) +
    kvRow('Airtel confirmation', esc(air.confirmMode)) +
    kvRow('Airtel token', okBadge('Valid') + ' <span class="qhint">' + esc(air.token) + '</span>') +
    kvRow('Mpamba request mode', esc(tnm.requestMode)) +
    kvRow('Mpamba confirmation', esc(tnm.confirmMode)) +
    kvRow('Mpamba credential', okBadge('Expired') + ' <span class="qhint">' + esc(tnm.token) + '</span>');

  el('mmStatusPill').textContent = MM_STATUS.length + ' requests';
  renderTable('mmBody', [
    {k: 'when', label: 'When', html: v => esc(String(v).slice(0, 16))},
    {k: 'method', label: 'Method'},
    {k: 'ref', label: 'Provider ref'},
    {k: 'txn', label: 'Payment'},
    {k: 'amount', label: 'Amount', num: true, html: (v) => pmMoney(v)},
    {k: 'stage', label: 'Stage'},
    {k: 'ms', label: 'Latency', num: true},
    {k: 'status', label: 'State', html: v => okBadge(v)}
  ], MM_STATUS, {sort: 'when', pageSize: 8});

  renderTable('mmrecBody', [
    {k: 'date', label: 'Day', html: v => fmtShort(v)},
    {k: 'method', label: 'Method'},
    {k: 'providerTxn', label: 'Provider lines', num: true},
    {k: 'systemTxn', label: 'Ledger lines', num: true},
    {k: 'amount', label: 'Statement value', num: true, html: v => shortMoney(v)},
    {k: 'difference', label: 'Difference', num: true},
    {k: 'status', label: 'State', html: v => okBadge(v)}
  ], MM_RECON, {sort: 'date', pageSize: 6});

  el('mmGrid').innerHTML =
    chartBox({title: 'Airtel Money against TNM Mpamba', sub: 'Value collected per day, MWK', type: 'bar', h: 190,
      cats: MM_RECON.slice(0, 6).reverse().map(r => fmtShort(r.date)),
      series: [{name: 'Airtel', data: MM_RECON.slice(0, 6).reverse().map(r => r.method === 'Airtel Money' ? r.amount : 0)},
               {name: 'Mpamba', data: MM_RECON.slice(0, 6).reverse().map(r => r.method === 'TNM Mpamba' ? r.amount : 0)}],
      value: shortMoney(sum(MM_RECON, r => r.amount))}) +
    chartBox({title: 'Request stages', sub: 'Where mobile money requests end up', type: 'donut', h: 190,
      cats: ['Confirmed', 'Awaiting customer', 'Callback rejected', 'Refused by customer'],
      series: [{name: 'Requests', data: ['Confirmed', 'Awaiting customer', 'Callback rejected', 'Refused by customer'].map(s => MM_STATUS.filter(r => r.stage === s).length)}],
      value: MM_STATUS.length + ' requests'});
}
function saveMobileMoney(which){
  const cfg = PM_MM[which];
  const p = which === 'MM-AIR' ? 'mmAir' : 'mmTnm';
  cfg.merchant = el(p + 'Merchant').value;
  cfg.code = el(p + 'Code').value;
  cfg.till = el(p + 'Till').value;
  cfg.reference = el(p + 'Ref').value;
  cfg.apiBase = el(p + 'Base').value;
  cfg.auth = el(p + 'Auth').value;
  const m = PM_METHOD_BY_CODE[which];
  if(m){ m.provider = cfg.merchant; m.updated = TODAY; }
  pmLogChange('Methods', (which === 'MM-AIR' ? 'Airtel Money' : 'TNM Mpamba') + ' configuration', 'previous merchant settings',
    cfg.merchant + ' · ' + cfg.code);
  renderMobileMoney(); renderMethods(); renderChanges();
  const msg = el(which === 'MM-AIR' ? 'mmAirMsg' : 'mmTnmMsg');
  if(msg) msg.textContent = 'Saved at ' + lastRefresh().slice(-5) + ' · merchant ' + cfg.code + ' · reference “' + cfg.reference + '”.';
  toast(which === 'MM-AIR' ? 'Airtel Money configuration saved' : 'TNM Mpamba configuration saved');
}
function testMobileMoney(which){
  const cfg = PM_MM[which];
  const was = cfg.status;
  if(which === 'MM-TNM'){
    cfg.status = 'Connected'; cfg.latency = 296; cfg.token = 'Valid, 58 min left';
    PM_PROVIDERS.filter(p => p.id === 'PRV-02').forEach(p => { p.status = 'Connected'; p.credentials = 'Valid'; p.latency = 296; });
    PM_TXNS.filter(t => t.method === 'TNM Mpamba' && t.status === 'Failed').slice(0, 3).forEach(t => { t.status = 'Pending'; t.error = ''; });
    PM_CONN_TESTS.filter(c => /Mpamba/.test(c.provider)).forEach(c => { c.result = 'Pass'; c.ms = 296; });
  } else {
    cfg.status = 'Connected'; cfg.token = 'Valid, 55 min left';
  }
  PM_METHOD_BY_CODE[which].updated = TODAY;
  pmLogChange('Methods', (which === 'MM-AIR' ? 'Airtel Money' : 'TNM Mpamba') + ' connection test', was, cfg.status);
  renderMobileMoney(); renderGateways(); renderOverview(); renderChanges(); renderStats();
  const msg = el(which === 'MM-AIR' ? 'mmAirMsg' : 'mmTnmMsg');
  if(msg) msg.textContent = 'Connection test at ' + lastRefresh().slice(-5) + ' — ' + cfg.status.toLowerCase() + ' in ' + cfg.latency + ' ms.';
  toast((which === 'MM-AIR' ? 'Airtel Money' : 'TNM Mpamba') + ' connection ' + cfg.status.toLowerCase());
}
function runMmRecon(){
  MM_RECON.forEach(r => {
    r.providerTxn = r.systemTxn;
    r.difference = 0;
    r.status = 'Matched';
    r.note = 'Matched at ' + new Date().toTimeString().slice(0, 5);
  });
  PM_RECON.filter(r => r.lane === 'Mobile money' && r.status !== 'Approved').forEach(r => {
    r.matched = r.lines; r.missing = 0; r.difference = 0; r.status = 'Matched';
  });
  pmLogChange('Reconciliation', 'Mobile money reconciliation', 'TNM Mpamba blocked', 'every line matched');
  renderMobileMoney(); renderRecon(); renderOverview(); renderChanges(); renderStats();
  toast('Mobile money reconciled — provider and ledger agree');
}

/* ===================== 4 · BANK TRANSFER ===================== */
let BSEL = 'FDH Bank';
function renderBank(){
  const verified = PM_BANK.filter(b => b.status === 'Verified');
  const stmtOpen = PM_STATEMENTS.filter(s => !/Matched$/.test(s.status));
  el('bankPill').className = 'badge ' + (verified.length === PM_BANK.length - 1 ? 'b-ok' : 'b-warn');
  el('bankPill').textContent = verified.length + ' verified';
  el('bankKpis').innerHTML = [
    ['Bank accounts', num(PM_BANK.length), verified.length + ' verified · ' + PM_BANK.filter(b => b.status === 'Archived').length + ' archived', ''],
    ['Bank transfers', num(PM_TXNS.filter(t => t.method === 'Bank transfer').length), shortMoney(sum(PM_TXNS.filter(t => t.method === 'Bank transfer' && t.status === 'Success'), t => t.amount)) + ' received', ''],
    ['Statements imported', num(PM_STATEMENTS.filter(s => s.matched > 0 || s.status === 'Matched').length), PM_STATEMENTS.length + ' files this week', ''],
    ['Unmatched bank lines', num(sum(PM_STATEMENTS, s => Math.max(0, s.lines - s.matched))), 'Waiting on a receipt', 'red'],
    ['Supported currencies', '3', 'MWK · USD · ZAR', ''],
    ['Transfer fee', 'MK 2,500', 'FDH, paid by the customer', '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join('');

  const b = PM_BANK.find(x => x.bank === BSEL) || PM_BANK[0];
  if(el('bankMsg') && !el('bankMsg').textContent)
    el('bankMsg').textContent = b.bank + ' · ' + b.verification + ' · ' + b.currency + ' account ' + b.account + '.';
  if(el('stmtMsg') && !el('stmtMsg').textContent)
    el('stmtMsg').textContent = PM_STATEMENTS.length + ' statements this week · ' +
      sum(PM_STATEMENTS, s => Math.max(0, s.lines - s.matched)) + ' bank lines still unmatched.';
  el('bankSelPill').className = 'badge ' + tone(b.status);
  el('bankSelPill').textContent = b.status;
  pmFillSel('bankSel', PM_BANK.map(x => [x.bank, x.bank]), BSEL);
  if(el('bankName')) el('bankName').value = b.accountName;
  if(el('bankAcct')) el('bankAcct').value = b.account;
  if(el('bankBranch')) el('bankBranch').value = b.branch;
  if(el('bankCode')) el('bankCode').value = b.branchCode;
  if(el('bankCcy')) el('bankCcy').value = b.currency;
  if(el('bankRef')) el('bankRef').value = b.reference;

  el('stmtPill').className = 'badge ' + (stmtOpen.length ? 'b-warn' : 'b-ok');
  el('stmtPill').textContent = stmtOpen.length + ' open';
  renderTable('stmtBody', [
    {k: 'id', label: 'Statement'},
    {k: 'bank', label: 'Bank'},
    {k: 'period', label: 'Period'},
    {k: 'lines', label: 'Lines', num: true},
    {k: 'matched', label: 'Matched', num: true},
    {k: 'amount', label: 'Value', num: true, html: v => shortMoney(v)},
    {k: 'status', label: 'State', html: v => okBadge(/Matched$/.test(v) ? 'Matched' : v)}
  ], PM_STATEMENTS, {sort: 'id', pageSize: 5});

  el('bankAcctPill').textContent = PM_BANK.length + ' accounts';
  renderTable('bankBody', [
    {k: 'bank', label: 'Bank'},
    {k: 'accountName', label: 'Account name'},
    {k: 'account', label: 'Number'},
    {k: 'branch', label: 'Branch'},
    {k: 'branchCode', label: 'Code'},
    {k: 'currency', label: 'Ccy'},
    {k: 'status', label: 'State', html: v => okBadge(v)}
  ], PM_BANK.filter(x => matchQ(x.bank, x.account, x.accountName)), {sort: 'bank', dir: 'asc', pageSize: 3});

  const variance = sum(PM_STATEMENTS, s => Math.max(0, s.lines - s.matched));
  el('bankRecPill').className = 'badge ' + (variance ? 'b-warn' : 'b-ok');
  el('bankRecPill').textContent = variance ? variance + ' lines open' : 'All matched';
  el('bankRecBox').innerHTML = PM_STATEMENTS.slice(0, 4).map(s => {
    const open = Math.max(0, s.lines - s.matched);
    return `<div class="checkrow">
      <div class="ck ${open ? 'warn' : 'pass'}">${open ? '!' : '✓'}</div>
      <div style="flex:1"><div style="font-size:10.5px;font-weight:800">${esc(s.bank)} · ${esc(s.period)}</div>
        <div class="qhint">${s.matched} of ${s.lines} lines matched · ${shortMoney(s.amount)}</div></div>
      <div>${okBadge(open ? 'Unmatched' : 'Matched')}</div></div>`;
  }).join('') + `<div class="qhint" style="margin-top:6px">A bank line becomes a payment only when a receipt quotes the same reference and amount.</div>`;

  el('bankGrid').innerHTML =
    chartBox({title: 'Bank transfer value', sub: 'Received per account this period', type: 'bar', h: 190,
      cats: PM_BANK.map(b => b.bank.replace(' Bank', '')),
      series: [{name: 'Value', data: PM_BANK.map(b => sum(PM_TXNS.filter(t => t.method === 'Bank transfer' && t.provider === b.bank && t.status === 'Success'), t => t.amount))}],
      value: shortMoney(sum(PM_TXNS.filter(t => t.method === 'Bank transfer' && t.status === 'Success'), t => t.amount))}) +
    chartBox({title: 'Statement lines', sub: 'Matched against unmatched', type: 'stacked', h: 190,
      cats: PM_STATEMENTS.map(s => s.id.slice(-4)),
      series: [{name: 'Matched', data: PM_STATEMENTS.map(s => s.matched)},
               {name: 'Open', data: PM_STATEMENTS.map(s => Math.max(0, s.lines - s.matched))}],
      value: sum(PM_STATEMENTS, s => s.lines) + ' lines'});
}
function saveBank(){
  const b = PM_BANK.find(x => x.bank === BSEL);
  if(!b) return;
  const before = b.account + ' · ' + b.branchCode;
  b.accountName = el('bankName').value;
  b.account = el('bankAcct').value;
  b.branch = el('bankBranch').value;
  b.branchCode = el('bankCode').value;
  b.currency = el('bankCcy').value;
  b.reference = el('bankRef').value;
  b.status = 'Pending verification';
  pmLogChange('Methods', b.bank + ' account details', before, b.account + ' · ' + b.branchCode);
  renderBank(); renderMethods(); renderChanges();
  if(el('bankMsg')) el('bankMsg').textContent = 'Saved — ' + b.bank + ' account ' + b.account + ' now reads “' + b.reference + '”. Verification is pending.';
  toast('Bank details saved');
}
function verifyBank(){
  const b = PM_BANK.find(x => x.bank === BSEL);
  if(!b) return;
  const was = b.status;
  b.status = 'Verified';
  b.verification = 'Two-person check, verified ' + fmtDate(TODAY);
  pmLogChange('Methods', b.bank + ' verification', was, 'Verified');
  renderBank(); renderOverview(); renderChanges();
  if(el('bankMsg')) el('bankMsg').textContent = b.bank + ' verified at ' + lastRefresh().slice(-5) + ' by two officers.';
  toast(b.bank + ' verified');
}
function importStatements(){
  const now = TODAY + ' ' + new Date().toTimeString().slice(0, 5);
  PM_STATEMENTS.unshift({id: 'STMT-' + (3013 + PM_STATEMENTS.length), bank: 'FDH Bank', period: '30 Oct 2026',
    lines: 6, amount: 986000, imported: now, matched: 4, status: 'Partially matched',
    lane: 'Bank', severity: 'Medium', owner: 'STF-009', region: 'Lilongwe'});
  pmLogChange('Reconciliation', 'Statement import', 'no file for today', 'FDH Bank · 6 lines');
  renderBank(); renderRecon(); renderChanges(); renderStats();
  if(el('stmtMsg')) el('stmtMsg').textContent = 'Imported FDH Bank statement at ' + now.slice(-5) + ' — 6 lines, MK 986,000, 4 matched automatically.';
  toast('Statement imported: 6 lines');
}
function reconcileBank(){
  PM_STATEMENTS.forEach(s => { s.matched = s.lines; s.status = 'Matched'; });
  PM_RECON.filter(r => r.lane === 'Bank').forEach(r => { r.matched = r.lines; r.missing = 0; r.difference = 0; r.status = 'Matched'; });
  pmLogChange('Reconciliation', 'Bank reconciliation', 'lines outstanding', 'every bank line matched');
  renderBank(); renderRecon(); renderOverview(); renderChanges(); renderStats();
  if(el('stmtMsg')) el('stmtMsg').textContent = 'Bank lines reconciled at ' + lastRefresh().slice(-5) + ' — every statement line now has a receipt.';
  toast('Bank statements reconciled');
}

/* ===================== 5 · CASH ===================== */
function renderCash(){
  const auth = CASH_STAFF.filter(c => c.authorised);
  const pending = CASH_COLLECTIONS.filter(c => c.status !== 'Verified' && c.status !== 'Handed over');
  const variance = sum(CASH_HANDOVERS, h => h.variance);
  el('cashPill').className = 'badge ' + (PM_CASH.enabled ? 'b-ok' : 'b-crit');
  el('cashPill').textContent = PM_CASH.enabled ? 'Enabled' : 'Disabled';
  el('cashKpis').innerHTML = [
    ['Cash payments', PM_CASH.enabled ? 'Enabled' : 'Disabled', PM_CASH.till, PM_CASH.enabled ? '' : 'red'],
    ['Authorised officers', num(auth.length), CASH_STAFF.length + ' on the register', ''],
    ['Cash receipts', num(CASH_COLLECTIONS.length), shortMoney(sum(CASH_COLLECTIONS, c => c.amount)) + ' collected', ''],
    ['Next receipt number', 'CSH-26-' + pad(PM_CASH.nextReceipt, 5), 'Format ' + PM_CASH.receiptFormat, ''],
    ['Handovers pending', num(pending.length), 'Before 17:30 each day', pending.length ? 'red' : ''],
    ['Handover variance', variance ? pmMoney(variance) : 'MK 0', variance ? 'Mzuzu drawer short' : 'Every drawer balances', variance ? 'red' : '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join('');

  if(el('cashRecMsg') && !el('cashRecMsg').textContent)
    el('cashRecMsg').textContent = 'Next receipt is CSH-26-' + pad(PM_CASH.nextReceipt, 5) +
      ' · drawer ' + PM_CASH.till + ' · verified by the ' + PM_CASH.verifyBy.toLowerCase() + '.';
  el('cashStatePill').className = 'badge ' + (PM_CASH.enabled ? 'b-ok' : 'b-crit');
  el('cashStatePill').textContent = PM_CASH.enabled ? 'Enabled' : 'Disabled';
  el('cashCfgBox').innerHTML =
    kvRow('Cash drawer', esc(PM_CASH.till) + ' · float limit ' + shortMoney(PM_CASH.floatLimit)) +
    kvRow('Receipt format', esc(PM_CASH.receiptFormat) + ' · next CSH-26-' + pad(PM_CASH.nextReceipt, 5)) +
    kvRow('Handover required', PM_CASH.requireHandover ? 'Yes — ' + esc(PM_CASH.handoverWindow) : 'No') +
    kvRow('Verified by', esc(PM_CASH.verifyBy)) +
    `<div class="form-grid" style="margin-top:8px">
       <div class="fg"><label>Next receipt number</label><input id="cashNext" type="number" value="${PM_CASH.nextReceipt}" min="1" /></div>
       <div class="fg"><label>Float limit (MWK)</label><input id="cashFloat" type="number" step="10000" value="${PM_CASH.floatLimit}" /></div>
     </div>
     <div class="form-actions"><button class="btn btn-ghost" id="cashCfgSave">Save cash settings</button></div>`;
  const btn = el('cashToggleBtn');
  if(btn) btn.textContent = PM_CASH.enabled ? 'Disable cash payments' : 'Enable cash payments';

  el('cashStaffPill').textContent = auth.length + ' authorised';
  el('cashStaffBox').innerHTML = CASH_STAFF.map(c => `<div class="checkrow">
      <div class="ck ${c.authorised ? 'pass' : 'warn'}">${c.authorised ? '✓' : '–'}</div>
      <div style="flex:1"><div style="font-size:10.5px;font-weight:800">${esc(staffName(c.id))}</div>
        <div class="qhint">${esc(c.role)} · ${esc(c.branch)} · ${num(c.receipts)} receipts · ${shortMoney(c.collected)}${c.balanced ? '' : ' · drawer not balanced'}</div></div>
      <button class="btn btn-ghost" data-cashstaff="${esc(c.id)}">${c.authorised ? 'Withdraw' : 'Authorise'}</button>
    </div>`).join('');

  el('cashCollPill').textContent = CASH_COLLECTIONS.length + ' receipts';
  renderTable('cashBody', [
    {k: 'receipt', label: 'Receipt'},
    {k: 'when', label: 'When', html: v => esc(String(v).slice(0, 16))},
    {k: 'cust', label: 'Customer', html: v => esc(custName(v))},
    {k: 'amount', label: 'Amount', num: true, html: v => pmMoney(v)},
    {k: 'officer', label: 'Officer', html: v => esc(staffName(v))},
    {k: 'branch', label: 'Branch'},
    {k: 'status', label: 'State', html: v => okBadge(v === 'Handed over' ? 'Posted' : v)},
    {k: 'act', label: '', html: (v, r) => r.status === 'Verified' || r.status === 'Handed over'
        ? '' : `<button class="btn btn-ghost" data-cashverify="${esc(r.receipt)}">Verify</button>`}
  ], CASH_COLLECTIONS, {sort: 'when', pageSize: 6});

  el('hndPill').textContent = CASH_HANDOVERS.length + ' handovers';
  renderTable('hndBody', [
    {k: 'id', label: 'Handover'},
    {k: 'officer', label: 'Officer', html: v => esc(staffName(v))},
    {k: 'branch', label: 'Branch'},
    {k: 'receipts', label: 'Receipts', num: true},
    {k: 'amount', label: 'Expected', num: true, html: v => pmMoney(v)},
    {k: 'counted', label: 'Counted', num: true, html: v => pmMoney(v)},
    {k: 'variance', label: 'Variance', num: true, html: v => v ? `<b style="color:#B32C2C">${pmMoney(v)}</b>` : 'MK 0'},
    {k: 'status', label: 'State', html: v => okBadge(v === 'Balanced' ? 'Balanced' : 'Variance')}
  ], CASH_HANDOVERS, {sort: 'when', pageSize: 4});

  const receiptsValue = sum(CASH_COLLECTIONS, c => c.amount);
  const handedValue = sum(CASH_HANDOVERS, h => h.counted);
  el('cashReconPill').className = 'badge ' + (variance ? 'b-warn' : 'b-ok');
  el('cashReconPill').textContent = variance ? 'Variance' : 'Balanced';
  el('cashReconBox').innerHTML =
    meter('Receipts against handovers', pct(handedValue, receiptsValue), shortMoney(handedValue) + ' of ' + shortMoney(receiptsValue)) +
    kvRow('Receipts issued', num(CASH_COLLECTIONS.length)) +
    kvRow('Handovers recorded', num(CASH_HANDOVERS.length)) +
    kvRow('Variance in the period', variance ? `<b style="color:#B32C2C">${pmMoney(variance)}</b>` : 'MK 0') +
    kvRow('Drawers unbalanced', num(CASH_HANDOVERS.filter(h => h.variance).length));

  const audit = CASH_HANDOVERS.map(h => ({when: h.when, what: 'Handover ' + h.id, officer: h.officer,
    detail: h.receipts + ' receipts · ' + pmMoney(h.amount), status: h.status}))
    .concat(CASH_COLLECTIONS.slice(0, 4).map(c => ({when: c.when, what: 'Receipt ' + c.receipt, officer: c.officer,
      detail: pmMoney(c.amount) + ' · ' + c.branch, status: c.status})));
  el('cashAuditPill').textContent = audit.length + ' entries';
  renderTable('cashAuditBody', [
    {k: 'when', label: 'When', html: v => esc(String(v).slice(0, 16))},
    {k: 'what', label: 'Action'},
    {k: 'officer', label: 'Officer', html: v => esc(staffName(v))},
    {k: 'detail', label: 'Detail'},
    {k: 'status', label: 'State', html: v => okBadge(v)}
  ], audit, {sort: 'when', pageSize: 7});

  el('cashGrid').innerHTML =
    chartBox({title: 'Cash collected by branch', sub: 'Receipts recorded per branch', type: 'bar', h: 190,
      cats: ['Lilongwe', 'Blantyre', 'Mzuzu', 'Zomba'],
      series: [{name: 'Collected', data: ['Lilongwe', 'Blantyre', 'Mzuzu', 'Zomba'].map(b => sum(CASH_COLLECTIONS.filter(c => c.branch === b), c => c.amount))}],
      value: shortMoney(receiptsValue)}) +
    chartBox({title: 'Receipts per officer', sub: 'Who is taking the cash', type: 'bar', h: 190,
      cats: CASH_STAFF.filter(c => c.authorised).map(c => staffName(c.id).split(' ')[0]),
      series: [{name: 'Receipts', data: CASH_STAFF.filter(c => c.authorised).map(c => c.receipts)}],
      value: num(sum(CASH_STAFF, c => c.receipts))});
}
function toggleCash(){
  PM_CASH.enabled = !PM_CASH.enabled;
  PM_SET.cashEnabled = PM_CASH.enabled;
  const m = PM_METHOD_BY_CODE['CASH-BR'];
  m.status = PM_CASH.enabled ? 'Enabled' : 'Disabled';
  pmLogChange('Methods', 'Cash payments', PM_CASH.enabled ? 'disabled' : 'enabled', PM_CASH.enabled ? 'enabled' : 'disabled');
  renderCash(); renderMethods(); renderOverview(); renderSettings(); renderChanges(); renderStats();
  if(el('cashRecMsg')) el('cashRecMsg').textContent = 'Cash payments ' + (PM_CASH.enabled ? 'enabled' : 'disabled') +
    ' at ' + lastRefresh().slice(-5) + '.';
  toast('Cash payments ' + (PM_CASH.enabled ? 'enabled' : 'disabled'), PM_CASH.enabled ? 'ok' : 'warn');
}
function issueCashReceipt(){
  if(!PM_CASH.enabled) return toast('Cash payments are disabled', 'warn');
  const loan = LOANS[3];
  const amount = 145000;
  const receipt = 'CSH-26-' + pad(PM_CASH.nextReceipt, 5);
  PM_CASH.nextReceipt += 1;
  const officer = (CASH_STAFF.find(c => c.authorised) || CASH_STAFF[0]);
  CASH_COLLECTIONS.unshift({receipt, when: TODAY + ' ' + new Date().toTimeString().slice(0, 5),
    cust: loan.cust, loan: loan.ref, amount, officer: officer.id, branch: officer.branch,
    status: 'Handover pending', lane: 'Cash', severity: 'Medium', owner: officer.id, region: officer.branch});
  PM_TXNS.unshift({id: 'PMT-' + (8000 + PM_TXNS.length), when: TODAY + ' ' + new Date().toTimeString().slice(0, 5),
    receipt: PM_SET.receiptPrefix + '-' + pad(9800 + PM_TXNS.length, PM_SET.receiptDigits), loan: loan.ref, cust: loan.cust, amount,
    method: 'Cash', code: 'CASH-BR', provider: 'Branch counter', providerRef: receipt,
    status: 'Success', officer: officer.id, branch: officer.branch, fee: 0, feePayer: 'Company',
    verified: 'Awaiting', reconciled: 'Unmatched', error: '',
    lane: 'Cash', severity: 'Low', owner: officer.id, region: officer.branch});
  pmLogChange('Methods', 'Cash receipt issued', 'next number ' + pad(PM_CASH.nextReceipt - 1, 5), receipt);
  renderCash(); renderTransactions(); renderOverview(); renderChanges(); renderStats();
  openModal('Cash receipt ' + receipt, pmMoney(amount) + ' · ' + custName(loan.cust),
    receiptHtml(PM_TXNS[0], 'Customer copy'), [{label: 'Close', act: 'close'}]);
  if(el('cashRecMsg')) el('cashRecMsg').textContent = 'Issued ' + receipt + ' for ' + pmMoney(amount) + ' to ' + custName(loan.cust) +
    '. The next number is CSH-26-' + pad(PM_CASH.nextReceipt, 5) + '.';
  toast('Cash receipt ' + receipt + ' issued');
}
function cashVerify(receipt){
  const c = CASH_COLLECTIONS.find(x => x.receipt === receipt);
  if(!c) return;
  c.status = 'Verified';
  const t = PM_TXNS.find(x => x.providerRef === receipt);
  if(t){ t.verified = 'Verified'; t.reconciled = 'Matched'; }
  pmLogChange('Verification', 'Cash receipt verified', receipt, 'Verified');
  renderCash(); renderVerification(); renderTransactions(); renderOverview(); renderChanges();
  toast(receipt + ' verified');
}
function toggleCashStaff(id){
  const c = CASH_STAFF.find(x => x.id === id);
  if(!c) return;
  c.authorised = !c.authorised;
  pmLogChange('Permissions', 'Cash receiving rights', staffName(id), c.authorised ? 'authorised' : 'withdrawn');
  renderCash(); renderSecurity(); renderChanges();
  toast(staffName(id) + (c.authorised ? ' may now take cash' : ' can no longer take cash'));
}
function saveCashCfg(){
  PM_CASH.nextReceipt = Number(el('cashNext').value) || PM_CASH.nextReceipt;
  PM_CASH.floatLimit = Number(el('cashFloat').value) || PM_CASH.floatLimit;
  pmLogChange('Methods', 'Cash drawer settings', 'previous float', shortMoney(PM_CASH.floatLimit));
  renderCash(); renderChanges();
  toast('Cash settings saved');
}
</script>
