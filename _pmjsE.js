<script>
/* ============================================================
   METHODS OF PAYMENT MANAGEMENT (5/7)
   6 · Gateways  7 · Customer journey  8 · Transactions
   9 · Verification
   ============================================================ */

const put = (id, html) => { const n = el(id); if(n) n.innerHTML = html; };
const pmS = () => pmStats();

/* ===================== 6 · PAYMENT GATEWAY CONNECTIONS ===================== */
let PSEL = 'PRV-01';
function maskedKey(p){
  const seed = p.id.replace(/\D/g, '') + p.name.length;
  return 'sk_' + p.env.toLowerCase().slice(0, 4) + '_' + String(seed).padStart(2, '0') + '••••••••' + String(Number(seed) * 37 % 9000 + 1000);
}
function renderGateways(){
  const s = pmS();
  const live = PM_PROVIDERS.filter(p => p.status === 'Connected');
  el('gwPill').className = 'badge ' + (live.length === PM_PROVIDERS.length ? 'b-ok' : 'b-crit');
  el('gwPill').textContent = live.length + ' of ' + PM_PROVIDERS.length + ' connected';
  el('gwKpis').innerHTML = [
    ['Connections', num(PM_PROVIDERS.length), PM_PROVIDERS.filter(p => p.kind === 'Mobile money').length + ' mobile money · 2 bank feeds', ''],
    ['Connected', num(live.length), (PM_PROVIDERS.length - live.length) + ' need attention', live.length === PM_PROVIDERS.length ? '' : 'red'],
    ['In sandbox', num(PM_PROVIDERS.filter(p => p.sandbox).length), 'Keys never leave the vault', ''],
    ['Credential health', PM_PROVIDERS.filter(p => p.credentials === 'Valid').length + '/' + PM_PROVIDERS.length, PM_PROVIDERS.filter(p => p.credentials !== 'Valid').length + ' expiring or expired', ''],
    ['Webhook endpoints', num(new Set(PM_PROVIDERS.map(p => p.webhook)).size), 'All signed with HMAC-SHA256', ''],
    ['Failed connection tests', num(PM_CONN_TESTS.filter(c => c.result === 'Fail').length), PM_CONN_TESTS.length + ' tests recorded', PM_CONN_TESTS.some(c => c.result === 'Fail') ? 'red' : '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join('');

  const pvDefault = PM_PROVIDERS.find(x => x.id === PSEL) || PM_PROVIDERS[0];
  if(el('pvMsg') && !el('pvMsg').textContent)
    el('pvMsg').textContent = pvDefault.name + ' · ' + pvDefault.env + ' · ' + pvDefault.status.toLowerCase() +
      ' · last checked ' + pvDefault.lastCheck + '.';
  if(el('pvHookMsg') && !el('pvHookMsg').textContent)
    el('pvHookMsg').textContent = 'Last signed event landed at ' + (PM_WEBHOOKS[0] ? PM_WEBHOOKS[0].when : pvDefault.lastCheck) +
      ' · scheme ' + pvDefault.signature + '.';
  if(el('npMsg') && !el('npMsg').textContent)
    el('npMsg').textContent = 'A new connection starts in sandbox mode with no credentials — set them before it takes a payment.';
  el('pvPill').textContent = PM_PROVIDERS.length + ' providers';
  renderTable('pvBody', [
    {k: 'name', label: 'Connection'},
    {k: 'provider', label: 'Provider'},
    {k: 'kind', label: 'Kind'},
    {k: 'env', label: 'Environment'},
    {k: 'status', label: 'State', html: v => okBadge(v)},
    {k: 'credentials', label: 'Credentials', html: v => okBadge(v === 'Valid' ? 'Valid' : v === 'Expired' ? 'Expired' : 'Expiring')},
    {k: 'latency', label: 'Latency', num: true, html: v => v ? v + ' ms' : '—'},
    {k: 'uptime', label: 'Uptime', num: true, html: v => v.toFixed(2) + '%'},
    {k: 'act', label: '', html: (v, r) => `<button class="btn btn-ghost" data-pvtest="${esc(r.id)}">Test</button>
       <button class="btn btn-ghost" data-pvopen="${esc(r.id)}">Open</button>`}
  ], PM_PROVIDERS.filter(p => matchQ(p.name, p.provider, p.kind, p.status, p.env)), {sort: 'id', dir: 'asc', pageSize: 7});

  const p = PM_PROVIDERS.find(x => x.id === PSEL) || PM_PROVIDERS[0];
  el('pvCfgPill').className = 'badge ' + tone(p.status);
  el('pvCfgPill').textContent = p.id + ' · ' + p.status;
  pmFillSel('pvSel', PM_PROVIDERS.map(x => [x.id, x.name]), PSEL);
  if(el('pvEnv')) el('pvEnv').value = p.env;
  if(el('pvMerchant')) el('pvMerchant').value = p.provider;
  if(el('pvBase')) el('pvBase').value = p.base || ('https://api.' + p.provider.toLowerCase().replace(/[^a-z]/g, '') + '.mw/v1');
  if(el('pvHook')) el('pvHook').value = p.webhook;
  if(el('pvSig')) el('pvSig').value = p.signature;
  if(el('pvTimeout')) el('pvTimeout').value = p.timeout || 45;

  el('pvCredPill').className = 'badge ' + (p.credentials === 'Valid' ? 'b-ok' : 'b-warn');
  el('pvCredPill').textContent = p.credentials;
  put('pvCredBox',
    kvRow('Client ID', '<span class="mono">' + esc(p.id.toLowerCase() + '-client') + '</span>') +
    kvRow('Secret', '<span class="mono">' + esc(maskedKey(p)) + '</span>') +
    kvRow('Credential state', okBadge(p.credentials === 'Valid' ? 'Valid' : p.credentials)) +
    kvRow('Rotated', esc(p.lastCheck)) +
    kvRow('Stored in', 'Supabase Vault · never in the bundle') +
    kvRow('Webhook signing', esc(p.signature)) +
    kvRow('Replay window', '5 minutes, nonce cached in Redis'));

  el('pvHealthPill').textContent = live.length + ' live';
  put('pvHealthBox', PM_PROVIDERS.map(x => meter(x.name, x.status === 'Connected' ? Math.round(x.health) : 0,
    x.status + ' · ' + (x.latency ? x.latency + ' ms' : 'no response') + ' · ' + x.uptime.toFixed(2) + '% uptime')));

  el('ctPill').textContent = PM_CONN_TESTS.length + ' tests';
  renderTable('ctBody', [
    {k: 'when', label: 'When', html: v => esc(String(v).slice(0, 16))},
    {k: 'provider', label: 'Connection'},
    {k: 'test', label: 'Test'},
    {k: 'ms', label: 'Latency', num: true, html: v => v ? v + ' ms' : 'timeout'},
    {k: 'result', label: 'Result', html: v => okBadge(v === 'Pass' ? 'Pass' : 'Failed')}
  ], PM_CONN_TESTS, {sort: 'when', pageSize: 6});
}
function saveProvider(){
  const p = PM_PROVIDERS.find(x => x.id === PSEL);
  if(!p) return;
  const before = p.env + ' · ' + p.webhook;
  p.env = el('pvEnv').value;
  p.sandbox = p.env === 'Sandbox';
  p.provider = el('pvMerchant').value;
  p.base = el('pvBase').value;
  p.webhook = el('pvHook').value;
  p.signature = el('pvSig').value;
  p.timeout = Number(el('pvTimeout').value) || 45;
  pmLogChange('Provider', 'Provider connection ' + p.id, before, p.env + ' · ' + p.webhook);
  renderGateways(); renderOverview(); renderChanges();
  if(el('pvMsg')) el('pvMsg').textContent = 'Saved ' + p.name + ' · ' + p.env + ' · timeout ' + p.timeout + ' s · webhook ' + p.webhook;
  toast('Provider saved');
}
function testProvider(id){
  const p = PM_PROVIDERS.find(x => x.id === (id || PSEL));
  if(!p) return;
  const now = TODAY + ' ' + new Date().toTimeString().slice(0, 5);
  const ok = p.credentials !== 'Expired';
  const seed = parseInt(String(p.id).replace(/\D/g, ''), 10) || (String(p.id).length * 7);
  p.latency = ok ? 180 + (seed * 13 % 160) : 0;
  p.status = ok ? 'Connected' : 'Failing';
  p.lastCheck = now;
  p.health = ok ? Math.min(99.99, p.health + 0.02) : p.health;
  PM_CONN_TESTS.unshift({provider: p.name, test: 'OAuth token and a MWK 1 collection', when: now,
    ms: p.latency, result: ok ? 'Pass' : 'Fail', lane: p.lane, severity: ok ? 'Low' : 'Critical', owner: 'STF-001', region: p.region});
  pmLogChange('Provider', 'Connection test ' + p.id, 'previous ' + (ok ? 'pass' : 'failure'), ok ? 'pass in ' + p.latency + ' ms' : 'failed');
  renderGateways(); renderOverview(); renderStats(); renderChanges();
  if(el('pvMsg')) el('pvMsg').textContent = p.name + ' — ' + (ok ? 'connected in ' + p.latency + ' ms' : 'still failing: the credential expired on 27 October');
  toast(p.name + (ok ? ' responded in ' + p.latency + ' ms' : ' failed — rotate the credential'), ok ? 'ok' : 'warn');
}
function toggleSandbox(){
  const p = PM_PROVIDERS.find(x => x.id === PSEL);
  if(!p) return;
  const was = p.env;
  p.sandbox = !p.sandbox;
  p.env = p.sandbox ? 'Sandbox' : 'Production';
  pmLogChange('Provider', 'Environment for ' + p.id, was, p.env);
  renderGateways(); renderSettings(); renderChanges();
  toast(p.name + ' switched to ' + p.env, p.sandbox ? 'warn' : 'ok');
}
function disconnectProvider(){
  const p = PM_PROVIDERS.find(x => x.id === PSEL);
  if(!p) return;
  const was = p.status;
  p.status = p.status === 'Connected' ? 'Disconnected' : 'Connected';
  if(p.status === 'Connected') p.credentials = 'Valid';
  p.lastCheck = TODAY + ' ' + new Date().toTimeString().slice(0, 5);
  pmLogChange('Provider', p.name + ' connection', was, p.status);
  renderGateways(); renderOverview(); renderMethods(); renderChanges(); renderStats();
  if(el('pvMsg')) el('pvMsg').textContent = p.name + ' is now ' + p.status.toLowerCase() + '.';
  toast(p.name + ' ' + p.status.toLowerCase(), p.status === 'Connected' ? 'ok' : 'warn');
}
function rotateCredential(){
  const p = PM_PROVIDERS.find(x => x.id === PSEL);
  if(!p) return;
  p.credentials = 'Valid';
  p.lastCheck = TODAY + ' ' + new Date().toTimeString().slice(0, 5);
  if(p.status === 'Failing'){ p.status = 'Connected'; p.latency = 264; }
  PM_APPROVALS.unshift({id: 'APR-' + (981 + PM_APPROVALS.length), change: 'Rotate ' + p.name + ' key', area: 'Provider',
    requested: TODAY, by: 'STF-001', approver: 'STF-009', state: 'Approved'});
  pmLogChange('Provider', 'Credential rotation ' + p.id, 'credential ' + p.credentials, 'rotated at ' + TODAY);
  renderGateways(); renderSecurity(); renderOverview(); renderChanges();
  if(el('pvHookMsg')) el('pvHookMsg').textContent = 'New secret written to the vault at ' + new Date().toTimeString().slice(0, 5) +
    ' — the old one stays valid for 30 minutes.';
  toast(p.name + ' credentials rotated');
}
function replayWebhook(){
  const p = PM_PROVIDERS.find(x => x.id === PSEL);
  if(!p) return;
  const now = TODAY + ' ' + new Date().toTimeString().slice(0, 5);
  PM_WEBHOOKS.unshift({id: 'WH-' + (9902 + PM_WEBHOOKS.length), provider: p.provider, event: 'payment.success',
    attempts: 1, when: now, ms: 88, status: 'Delivered', lane: 'Webhooks', severity: 'Low', owner: 'STF-001', region: 'Frankfurt'});
  pmLogChange('Provider', 'Signed webhook replayed', 'unverified', p.provider + ' · signature held');
  renderGateways(); renderApi(); renderChanges();
  if(el('pvHookMsg')) el('pvHookMsg').textContent = 'Replay sent to ' + p.webhook + ' at ' + now.slice(-5) +
    ' — the signature verified and the event was stored once.';
  toast('Signed webhook replayed');
}
function addProvider(){
  const name = (el('npName').value || '').trim();
  const provider = (el('npProvider').value || '').trim();
  if(!name || !provider) return toast('A connection needs a name and a provider', 'warn');
  if(PM_PROVIDERS.some(p => p.name.toLowerCase() === name.toLowerCase())) return toast('That connection already exists', 'warn');
  const id = 'PRV-' + pad(PM_PROVIDERS.length + 1, 2);
  PM_PROVIDERS.push({id, name, provider, kind: el('npKind').value, env: 'Sandbox', status: 'Disconnected',
    health: 0, latency: 0, lastCheck: TODAY + ' ' + new Date().toTimeString().slice(0, 5),
    webhook: 'https://api.goldenloan.mw/v1/payments/' + provider.toLowerCase().replace(/[^a-z]/g, '') + '/callback',
    signature: 'HMAC-SHA256', sandbox: true, credentials: 'Not set', uptime: 0,
    lane: 'Gateway', severity: 'Medium', owner: 'STF-009', region: 'Malawi'});
  el('npName').value = ''; el('npProvider').value = '';
  pmLogChange('Provider', 'Connection added', 'not configured', name + ' · ' + provider);
  PSEL = id;
  renderGateways(); renderOverview(); renderChanges(); renderStats();
  if(el('npMsg')) el('npMsg').textContent = name + ' added as ' + id + ' in sandbox mode — set its merchant account and run a test before switching to production.';
  toast('Provider connection added');
}

/* ===================== 7 · CUSTOMER PAYMENT EXPERIENCE ===================== */
function customerMethods(){
  return PM_METHODS.filter(m => m.status === 'Enabled' && !m.archived && m.availability !== 'Branch only')
    .sort((a, b) => a.order - b.order);
}
function receiptHtml(t, kind){
  if(!t) return '<div class="empty">No payment to show yet.</div>';
  return `<div class="receipt">
    <div class="rhead"><div class="rmark">G</div>
      <div><div style="font-weight:800;font-size:11px">GOLDEN FINANCIAL SERVICES</div>
        <div class="qhint">Lilongwe · Malawi · +265 1 771 200</div></div>
      <div style="margin-left:auto;text-align:right"><div class="qhint">${esc(kind || 'Customer copy')}</div>
        <div style="font-weight:800;font-size:11px">${esc(t.receipt)}</div></div></div>
    <div class="pfields" style="grid-template-columns:1fr 1fr;margin-top:9px">
      ${field('Customer', esc(custName(t.cust)))}
      ${field('Loan', esc(t.loan))}
      ${field('Amount', pmMoney(t.amount))}
      ${field('Fee', pmMoney(t.fee) + ' · ' + esc(t.feePayer) + ' paid')}
      ${field('Method', esc(t.method + ' · ' + t.provider))}
      ${field('Provider reference', '<span class="mono">' + esc(t.providerRef) + '</span>')}
      ${field('Received', esc(t.when))}
      ${field('State', okBadge(t.status))}
    </div>
    <div class="qhint" style="margin-top:8px">Keep this receipt. Verify it at goldenloan.mw/verify with the receipt number and the amount.</div>
  </div>`;
}
function renderCustomer(){
  const s = pmS();
  const show = customerMethods();
  if(el('refBox') && !el('refBox').textContent)
    el('refBox').textContent = 'Pick a loan and an amount to generate a reference the customer can quote on the handset.';
  el('cxPill').textContent = show.length + ' methods offered';
  el('cxKpis').innerHTML = [
    ['Methods shown', num(show.length), PM_METHODS.filter(m => m.availability === 'Branch only' && m.status === 'Enabled').length + ' branch-only rails hidden', ''],
    ['Default method', (PM_METHODS.find(m => m.isDefault) || {}).name || '—', 'Preselected on the payment screen', ''],
    ['References issued', num(PM_CHANGES.filter(c => c.area === 'Reference').length + 41), 'Unique per loan and amount', ''],
    ['Confirmation messages', num(PM_NOTIFY_RULES.filter(r => r.on).length) + ' rules', 'SMS and email', ''],
    ['Failed payments with guidance', num(PM_TXNS.filter(t => t.status === 'Failed').length), 'Each one tells the customer what to do', ''],
    ['Receipt status checks', num(PM_TXNS.filter(t => t.status === 'Success').length), 'Live on every open receipt', '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join('');

  el('dispPill').textContent = show.length + ' shown';
  renderTable('dispBody', [
    {k: 'order', label: '#', num: true},
    {k: 'name', label: 'Method'},
    {k: 'min', label: 'From', num: true, html: v => shortMoney(v)},
    {k: 'max', label: 'Up to', num: true, html: v => shortMoney(v)},
    {k: 'feePct', label: 'Fee', html: (v, r) => v ? v + '%' + (r.feeFlat ? ' + ' + shortMoney(r.feeFlat) : '') : (r.feeFlat ? shortMoney(r.feeFlat) : 'Free')},
    {k: 'instructions', label: 'Instruction', html: v => `<span class="qhint">${esc(String(v).slice(0, 64))}…</span>`}
  ], show, {sort: 'order', dir: 'asc', pageSize: 8});

  put('instrBox', show.map(m => `<div class="checkrow">
      <div class="ck pass">${m.order}</div>
      <div style="flex:1"><div style="font-size:10.5px;font-weight:800">${esc(m.name)}${m.isDefault ? ' <span class="badge b-ok">Default</span>' : ''}</div>
        <div class="qhint">${esc(m.instructions)}</div></div></div>`).join('')
    + `<div class="qhint" style="margin-top:7px">Branch-only rails (${esc(PM_METHODS.filter(m => m.availability === 'Branch only').map(m => m.name).join(', ') || 'none')}) are only visible to a cashier, never in the customer portal.</div>`);

  pmFillSel('selLoan', pmLoanOptions());
  pmFillSel('selMethod', show.map(m => [m.code, m.name]));
  if(el('selLoan') && !el('selMsg').textContent)
    el('selMsg').textContent = 'Pick a loan and the rail the customer should be offered on the portal.';

  pmFillSel('refLoan', pmLoanOptions());
  if(el('refAmount') && !el('refAmount').value) el('refAmount').value = 145000;

  const last = PM_TXNS.find(t => t.status === 'Success') || PM_TXNS[0];
  if(el('confPill')) el('confPill').textContent = 'Customer view';
  put('confirmBox',
    `<div class="note gold"><div>“Your payment of ${pmMoney(last.amount)} has been received. Receipt ${esc(last.receipt)}. Thank you.”</div></div>
     ${kvRow('Customer', esc(custName(last.cust)))}
     ${kvRow('Method', esc(last.method + ' · ' + last.provider))}
     ${kvRow('Reference', '<span class="mono">' + esc(last.providerRef) + '</span>')}
     ${kvRow('Receipt', esc(last.receipt))}
     ${kvRow('Loan updated', esc(last.loan))}
     <div class="qhint" style="margin-top:6px">The confirmation carries the receipt number, the amount, the loan and a link to the statement.</div>`);

  el('statusPill').className = 'badge ' + tone(last.status === 'Success' ? 'Success' : last.status);
  el('statusPill').textContent = last.status;
  put('receiptBox', receiptHtml(last, 'Portal copy'));
  put('statusBox', PM_TXNS.slice(0, 5).map(t => `<div class="checkrow">
      <div class="ck ${t.status === 'Success' ? 'pass' : t.status === 'Pending' ? 'warn' : 'crit'}">${t.status === 'Success' ? '✓' : t.status === 'Pending' ? '·' : '!'}</div>
      <div style="flex:1"><div style="font-size:10.5px;font-weight:800">${esc(t.receipt)} · ${pmMoney(t.amount)}</div>
        <div class="qhint">${esc(t.method)} · ${esc(t.status)}${t.error ? ' · ' + esc(t.error) : ''}</div></div>
      <div>${okBadge(t.status)}</div></div>`).join(''));

  const fails = PM_TXNS.filter(t => t.status === 'Failed').slice(0, 4);
  el('failPill').className = 'badge ' + (fails.length ? 'b-warn' : 'b-ok');
  el('failPill').textContent = fails.length + ' examples';
  put('failBox', fails.map(t => `<div class="risk">
      <div><div class="rn">${esc(t.method)} · ${esc(t.error || 'Provider refused the payment')}</div>
        <div class="rs">${esc(advice(t.error))}</div></div>
      <div class="rv">${okBadge(t.status)}</div></div>`).join('')
    || '<div class="empty">No failed payments in the period.</div>');

  el('cxMobilePill').textContent = PM_NOTIFY_RULES.filter(r => r.on).length + ' messages';
  put('notifBox', PM_NOTIFY_RULES.map(r => `<div class="checkrow">
      <div class="ck ${r.on ? 'pass' : 'warn'}">${r.on ? '✓' : '–'}</div>
      <div style="flex:1"><div style="font-size:10.5px;font-weight:800">${esc(r.event)}</div>
        <div class="qhint">${r.sms ? 'SMS' : ''}${r.sms && r.email ? ' + ' : ''}${r.email ? 'Email' : ''} to the ${esc(r.to.toLowerCase())} · template ${esc(r.template)}</div></div></div>`).join(''));
  put('mobileBox',
    meter('Payment screen fits a phone', 100, '375 px · every rail on one screen', 100) +
    meter('Instruction text within two screens', 92, 'Longest: bank transfer reference', 100) +
    meter('Tap targets at least 44 px', 100, 'Method tiles and the pay button', 100));
}
function advice(err){
  const e = String(err || '').toLowerCase();
  if(/insufficient|balance/.test(e)) return 'Ask the customer to top up the wallet, then retry from the portal — the reference stays valid for 24 hours.';
  if(/timeout|timed out|no response/.test(e)) return 'The provider did not answer. Wait two minutes, check the receipt status, and only retry if the status stays pending.';
  if(/reference/.test(e)) return 'The reference did not match a loan. Ask for the exact reference printed on the statement.';
  if(/expired/.test(e)) return 'The wallet session or the provider credential expired. Retry after the credential is rotated.';
  if(/refus|cancel/.test(e)) return 'The customer cancelled on the handset. Nothing was taken — offer the same reference again.';
  return 'Show the reference and the provider message, then offer the branch or a bank transfer as an alternative.';
}
function savePreferredMethod(){
  const loan = LOAN_BY_REF[el('selLoan').value];
  const m = PM_METHOD_BY_CODE[el('selMethod').value];
  if(!loan || !m) return toast('Pick a loan and a method', 'warn');
  const was = loan.preferredMethod || 'not set';
  loan.preferredMethod = m.name;
  pmLogChange('Reference', 'Preferred method for ' + loan.ref, was, m.name);
  el('selMsg').textContent = loan.ref + ' will now be offered ' + m.name + ' first — ' + m.instructions;
  renderChanges();
  toast('Preference saved for ' + loan.ref);
}
function generateReference(){
  const loan = LOAN_BY_REF[el('refLoan').value];
  const amount = Number(el('refAmount').value) || 0;
  if(!loan) return toast('Pick a loan first', 'warn');
  if(amount < PM_SET.minAmount) return toast('The minimum payment is ' + shortMoney(PM_SET.minAmount), 'warn');
  const seq = 41 + PM_CHANGES.filter(c => c.area === 'Reference').length;
  const ref = PM_SET.refPrefix + '-' + loan.ref.replace('LN-', '') + '-' + pad(seq, 3);
  pmLogChange('Reference', 'Payment reference issued', loan.ref + ' · ' + shortMoney(amount), ref);
  put('refBox', `<div class="note gold"><div style="font-size:14px;font-weight:800;letter-spacing:.6px">${esc(ref)}</div>
      <div class="qhint" style="margin-top:3px">Quote this on the handset or on the transfer. It stays valid for 24 hours.</div></div>
    ${kvRow('Loan', esc(loan.ref) + ' · ' + esc(custName(loan.cust)))}
    ${kvRow('Amount', pmMoney(amount))}
    ${kvRow('Method', esc(el('selMethod') ? PM_METHOD_BY_CODE[el('selMethod').value].name : 'Airtel Money'))}
    ${kvRow('Expires', fmtDate(addDays(TODAY, 1)) + ' at 23:59')}
    ${kvRow('Receipt will read', PM_SET.receiptPrefix + '-' + pad(PM_RECEIPTS.length + 1, PM_SET.receiptDigits))}`);
  renderChanges();
  toast('Reference ' + ref + ' generated');
}

/* ===================== 8 · PAYMENT TRANSACTION MONITORING ===================== */
let TXSEL = null;
function txRows(){
  const q = (el('txQ') && el('txQ').value || '').trim().toLowerCase();
  const who = (el('txCust') && el('txCust').value || '').trim().toLowerCase();
  let rows = PM_TXNS.filter(t => inRange(t.when.slice(0, 10)) && passLane(t) && passSeverity(t) && passStatus(t)
    && passOwner(t) && passRegion(t) && matchQ(t.id, t.receipt, t.providerRef, t.loan, custName(t.cust), t.method));
  if(q) rows = rows.filter(t => (t.id + ' ' + t.receipt + ' ' + t.providerRef + ' ' + t.loan).toLowerCase().includes(q));
  if(who) rows = rows.filter(t => (t.cust + ' ' + custName(t.cust) + ' ' + t.loan).toLowerCase().includes(who));
  return rows;
}
function renderTransactions(){
  const s = pmS();
  el('txPill').className = 'badge ' + (s.failed + s.cancelled ? 'b-warn' : 'b-ok');
  el('txPill').textContent = num(s.total) + ' payments';
  el('txKpis').innerHTML = [
    ['Transactions', num(s.total), fmtDate(FILTER.from) + ' – ' + fmtDate(FILTER.to), ''],
    ['Successful', num(s.success), shortMoney(s.successVolume) + ' collected', ''],
    ['Pending', num(s.pending), 'Waiting on the provider', s.pending ? 'red' : ''],
    ['Failed or cancelled', num(s.failed + s.cancelled), s.failedRate.toFixed(1) + '% of the register', s.failed ? 'red' : ''],
    ['Reversed', num(s.reversed), 'Posted back to the loan', ''],
    ['Duplicates held', num(s.duplicates), 'Same provider reference twice', s.duplicates ? 'red' : '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join('');

  const rows = txRows();
  if(el('txQBox') && !el('txQBox').textContent)
    el('txQBox').textContent = num(rows.length) + ' payments in the register for ' + fmtDate(FILTER.from) + ' – ' +
      fmtDate(FILTER.to) + ' · ' + shortMoney(sum(rows, r => r.amount)) + ' in total.';
  el('txCount').textContent = num(rows.length) + ' shown';
  renderTable('txBody', [
    {k: 'when', label: 'When', html: v => esc(String(v).slice(0, 16))},
    {k: 'receipt', label: 'Receipt'},
    {k: 'id', label: 'Transaction'},
    {k: 'method', label: 'Method'},
    {k: 'provider', label: 'Provider'},
    {k: 'providerRef', label: 'Provider ref'},
    {k: 'amount', label: 'Amount', num: true, html: v => pmMoney(v)},
    {k: 'status', label: 'State', html: v => okBadge(v)},
    {k: 'act', label: '', html: (v, r) => `<button class="btn btn-ghost" data-txopen="${esc(r.id)}">Open</button>`}
  ], rows, {sort: 'when', pageSize: 10});
  (STORE_ROWS['txBody'] || []).forEach(r => { r._open = () => openTxn(r.id); });

  if(!TXSEL) TXSEL = (rows[0] || PM_TXNS[0]).id;
  renderTxnDetail();

  const dups = duplicateRows();
  el('dupPill').className = 'badge ' + (dups.length ? 'b-crit' : 'b-ok');
  el('dupPill').textContent = dups.length ? dups.length + ' held' : 'None';
  renderTable('dupBody', [
    {k: 'providerRef', label: 'Provider reference'},
    {k: 'count', label: 'Seen', num: true},
    {k: 'amount', label: 'Value', num: true, html: v => pmMoney(v)},
    {k: 'status', label: 'Handling', html: v => okBadge(v)},
    {k: 'act', label: '', html: (v, r) => `<button class="btn btn-ghost" data-dup="${esc(r.providerRef)}">Inspect</button>`}
  ], dups, {sort: 'count', pageSize: 5, onRow: false});

  el('txGrid').innerHTML =
    chartBox({title: 'Payments by state', sub: 'Every transaction in the period', type: 'donut', h: 200,
      cats: ['Success', 'Pending', 'Failed', 'Cancelled', 'Reversed'],
      series: [{name: 'Payments', data: ['Success', 'Pending', 'Failed', 'Cancelled', 'Reversed'].map(k => rows.filter(t => t.status === k).length)}],
      value: num(rows.length)}) +
    chartBox({title: 'Value by method', sub: 'Successful collections, MWK', type: 'bar', h: 200,
      cats: ['Airtel Money', 'TNM Mpamba', 'Bank transfer', 'Cash'],
      series: [{name: 'Collected', data: ['Airtel Money', 'TNM Mpamba', 'Bank transfer', 'Cash'].map(m => sum(rows.filter(t => t.method === m && t.status === 'Success'), t => t.amount))}],
      value: shortMoney(sum(rows.filter(t => t.status === 'Success'), t => t.amount))});
}
function duplicateRows(){
  const seen = {};
  PM_TXNS.forEach(t => {
    const k = t.providerRef;
    if(!k) return;
    seen[k] = seen[k] || {providerRef: k, count: 0, amount: 0, ids: []};
    seen[k].count += 1;
    seen[k].amount += t.amount;
    seen[k].ids.push(t.id);
  });
  return Object.values(seen).filter(d => d.count > 1).map(d => Object.assign(d, {
    status: 'Duplicate', handling: 'Held for review'}));
}
function renderTxnDetail(){
  const t = PM_TXNS.find(x => x.id === TXSEL) || PM_TXNS[0];
  if(!t) return;
  el('txDetPill').className = 'badge ' + tone(t.status);
  el('txDetPill').textContent = t.id;
  put('txDetailBox', `<div class="pfields" style="grid-template-columns:1fr 1fr">
      ${field('Receipt', esc(t.receipt))}
      ${field('State', okBadge(t.status))}
      ${field('Customer', esc(custName(t.cust)))}
      ${field('Loan', esc(t.loan))}
      ${field('Amount', pmMoney(t.amount))}
      ${field('Fee', pmMoney(t.fee) + ' · ' + esc(t.feePayer))}
      ${field('Method', esc(t.method))}
      ${field('Provider', esc(t.provider))}
      ${field('Provider reference', '<span class="mono">' + esc(t.providerRef) + '</span>')}
      ${field('Officer', esc(staffName(t.officer)))}
      ${field('Branch', esc(t.branch))}
      ${field('Received', esc(t.when))}
      ${field('Verified', okBadge(t.verified === 'Verified' ? 'Verified' : t.verified))}
      ${field('Reconciled', okBadge(t.reconciled === 'Matched' ? 'Matched' : t.reconciled === 'Duplicate' ? 'Duplicate' : 'Unmatched'))}
    </div>
    <div class="minihead" style="margin-top:10px">Provider response</div>
    <div class="qhint">${esc(t.error || 'Accepted — callback received with a matching reference and amount.')}</div>`);
}
function openTxn(id){
  const t = PM_TXNS.find(x => x.id === id);
  if(!t) return;
  TXSEL = id;
  renderTxnDetail();
  openModal('Transaction ' + t.id, t.receipt + ' · ' + t.method + ' · ' + t.status,
    `<div class="pfields" style="grid-template-columns:1fr 1fr">
      ${field('Customer', esc(custName(t.cust)))}
      ${field('Loan', esc(t.loan))}
      ${field('Amount', pmMoney(t.amount))}
      ${field('Fee', pmMoney(t.fee) + ' (' + esc(t.feePayer) + ')')}
      ${field('Provider', esc(t.provider))}
      ${field('Provider reference', '<span class="mono">' + esc(t.providerRef) + '</span>')}
      ${field('Officer', esc(staffName(t.officer)))}
      ${field('Received', esc(t.when))}
      ${field('Verified', okBadge(t.verified))}
      ${field('Reconciled', okBadge(t.reconciled))}
    </div>` + receiptHtml(t, 'Transaction copy'),
    [{label: 'Verify in the queue', act: () => { closeModal(); goto('s9'); }},
     {label: 'Close', act: 'close'}]);
}
function lookupTransactions(){
  const q = (el('txQ').value || '').trim();
  const who = (el('txCust').value || '').trim();
  const rows = txRows();
  renderTransactions();
  put('txQBox', rows.length
    ? `<div class="note gold"><div>${rows.length} match${rows.length === 1 ? '' : 'es'} for
        ${q ? '“' + esc(q) + '”' : 'the register'}${who ? ' · ' + esc(who) : ''} —
        ${shortMoney(sum(rows, r => r.amount))} across ${new Set(rows.map(r => r.method)).size} methods.</div></div>`
    : `<div class="note"><div>Nothing matched “${esc(q || who)}”. Try a receipt number, a provider reference or a loan.</div></div>`);
  toast(rows.length + ' transaction' + (rows.length === 1 ? '' : 's') + ' matched');
}
function scanDuplicates(){
  const dups = duplicateRows();
  PM_TXNS.filter(t => t.reconciled === 'Duplicate').forEach(t => {
    t.reconciled = t.reconciled === 'Duplicate' ? 'Matched' : 'Duplicate';
  });
  pmLogChange('Reconciliation', 'Duplicate scan', 'held transactions', dups.length ? dups.length + ' groups found' : 'none found');
  renderTransactions(); renderOverview(); renderChanges(); renderStats();
  toast(dups.length ? dups.length + ' duplicate group' + (dups.length === 1 ? '' : 's') + ' found' : 'No duplicates in the window',
    dups.length ? 'warn' : 'ok');
}

/* ===================== 9 · PAYMENT VERIFICATION ===================== */
function verifyQueue(){
  return PM_VERIFY.filter(v => /Awaiting/.test(v.status));
}
function renderVerification(){
  const q = verifyQueue();
  const manual = PM_VERIFY_HISTORY.filter(h => /Manual/.test(h.detail)).length;
  el('vPill').className = 'badge ' + (q.length ? 'b-warn' : 'b-ok');
  el('vPill').textContent = q.length + ' waiting';
  el('vKpis').innerHTML = [
    ['Awaiting verification', num(q.filter(v => v.status === 'Awaiting verification').length), 'First check by an officer', q.length ? 'red' : ''],
    ['Awaiting a second signature', num(q.filter(v => v.status === 'Awaiting approval').length), 'Value above the approval threshold', ''],
    ['Verified this period', num(PM_VERIFY_HISTORY.length), 'Manual and automatic', ''],
    ['Rejected', num(PM_REJECTED.length), 'Kept for the trail', PM_REJECTED.length ? 'red' : ''],
    ['Automatic confirmation', PM_SET.autoConfirm ? 'On' : 'Off', PM_SET.confirmRule, ''],
    ['Second signature', PM_SET.requireApprovalLimit ? 'Required' : 'Not required', 'Over ' + shortMoney(PM_SET.maxDailyAmount / 3), '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join('');

  if(el('vMsg') && !el('vMsg').textContent)
    el('vMsg').textContent = q.length + ' payment' + (q.length === 1 ? '' : 's') + ' waiting — ' +
      q.filter(v => v.status === 'Awaiting approval').length + ' carrying a second signature.';
  el('vqPill').textContent = q.length + ' in the queue';
  renderTable('vqBody', [
    {k: 'id', label: 'Check'},
    {k: 'receipt', label: 'Receipt'},
    {k: 'when', label: 'Received', html: v => esc(String(v).slice(0, 16))},
    {k: 'method', label: 'Method'},
    {k: 'amount', label: 'Amount', num: true, html: v => pmMoney(v)},
    {k: 'expected', label: 'Expected', num: true, html: v => pmMoney(v)},
    {k: 'check', label: 'Result'},
    {k: 'level', label: 'Level'},
    {k: 'status', label: 'State', html: v => okBadge(v === 'Awaiting approval' ? 'Awaiting approval' : 'Awaiting verification')},
    {k: 'act', label: '', html: (v, r) => `<button class="btn btn-ghost" data-vok="${esc(r.id)}">Verify</button>
       <button class="btn btn-ghost" data-vrej="${esc(r.id)}">Reject</button>`}
  ], q, {sort: 'when', pageSize: 8, onRow: false});

  const checks = [
    ['Provider reference present', PM_VERIFY.filter(v => v.providerRef).length, PM_VERIFY.length],
    ['Amount matches the receipt', PM_VERIFY.filter(v => v.amount === v.expected).length, PM_VERIFY.length],
    ['Customer matched', PM_VERIFY.filter(v => v.cust).length, PM_VERIFY.length],
    ['Loan matched and open', PM_VERIFY.filter(v => v.loan && LOAN_BY_REF[v.loan]).length, PM_VERIFY.length],
    ['No duplicate receipt', PM_VERIFY.filter(v => !PM_TXNS.some(t => t.receipt === v.receipt && t.reconciled === 'Duplicate')).length, PM_VERIFY.length],
    ['Within the method limit', PM_VERIFY.filter(v => v.amount <= (PM_METHOD_BY_CODE[v.method === 'Airtel Money' ? 'MM-AIR' : v.method === 'TNM Mpamba' ? 'MM-TNM' : 'BT-FDH'] || {max: 15000000}).max).length, PM_VERIFY.length]
  ];
  el('vCheckPill').className = 'badge ' + (checks.every(c => c[1] === c[2]) ? 'b-ok' : 'b-warn');
  el('vCheckPill').textContent = checks.filter(c => c[1] === c[2]).length + '/' + checks.length + ' passing';
  put('vChecksBox', checks.map(([label, pass, total]) => `<div class="checkrow">
      <div class="ck ${pass === total ? 'pass' : 'warn'}">${pass === total ? '✓' : '!'}</div>
      <div style="flex:1"><div style="font-size:10.5px;font-weight:800">${esc(label)}</div>
        <div class="qhint">${num(pass)} of ${num(total)} payments pass this check</div></div></div>`).join(''));

  el('vAutoPill').className = 'badge ' + (PM_SET.autoConfirm ? 'b-ok' : 'b-gray');
  el('vAutoPill').textContent = PM_SET.autoConfirm ? 'Automatic' : 'Manual only';
  put('vAutoBox',
    kvRow('Automatic confirmation', PM_SET.autoConfirm ? okBadge('On') : okBadge('Off')) +
    kvRow('Confirmation rule', esc(PM_SET.confirmRule)) +
    kvRow('Second signature above', shortMoney(PM_SET.maxDailyAmount / 3)) +
    kvRow('Approval required', PM_SET.requireApprovalLimit ? 'Yes — refunds and limit changes too' : 'No') +
    kvRow('Checked by', 'Provider callback, then the amount and reference against the ledger') +
    kvRow('Held when', 'The amount differs, the reference is unknown, or the receipt already exists'));

  el('vHistPill').textContent = PM_VERIFY_HISTORY.length + ' entries';
  renderTable('vHistBody', [
    {k: 'when', label: 'When', html: v => esc(String(v).slice(0, 16))},
    {k: 'ref', label: 'Reference'},
    {k: 'action', label: 'Action', html: v => okBadge(/Reject/i.test(v) ? 'Rejected' : 'Verified')},
    {k: 'by', label: 'By'},
    {k: 'detail', label: 'Detail'}
  ], PM_VERIFY_HISTORY, {sort: 'when', pageSize: 6, onRow: false});

  el('vRejPill').textContent = PM_REJECTED.length + ' rejected';
  renderTable('vRejBody', [
    {k: 'when', label: 'When', html: v => esc(String(v).slice(0, 16))},
    {k: 'ref', label: 'Reference'},
    {k: 'amount', label: 'Amount', num: true, html: v => pmMoney(v)},
    {k: 'reason', label: 'Reason'},
    {k: 'by', label: 'By', html: v => esc(staffName(v))}
  ], PM_REJECTED, {sort: 'when', pageSize: 5, onRow: false});

  el('vGrid').innerHTML =
    chartBox({title: 'How payments were verified', sub: 'Manual against automatic', type: 'donut', h: 200,
      cats: ['Automatic', 'Manual', 'Refused'],
      series: [{name: 'Payments', data: [PM_VERIFY_HISTORY.filter(h => /Automatic/.test(h.detail)).length,
        PM_VERIFY_HISTORY.filter(h => /Manual/.test(h.detail)).length, PM_REJECTED.length]}],
      value: num(PM_VERIFY_HISTORY.length + PM_REJECTED.length)}) +
    chartBox({title: 'Verification queue by method', sub: 'What is waiting right now', type: 'bar', h: 200,
      cats: ['Airtel Money', 'TNM Mpamba', 'Bank transfer', 'Cash'],
      series: [{name: 'Waiting', data: ['Airtel Money', 'TNM Mpamba', 'Bank transfer', 'Cash'].map(m => q.filter(v => v.method === m).length)}],
      value: q.length + ' waiting'});
}
function verifyPayment(id){
  const v = PM_VERIFY.find(x => x.id === id);
  if(!v) return;
  if(v.status === 'Awaiting approval')
    return toast('This one needs a second signature — use “Approve everything awaiting a second signature”', 'warn');
  v.status = 'Verified';
  const t = PM_TXNS.find(x => x.id === v.txn);
  if(t){ t.verified = 'Verified'; t.status = t.status === 'Pending' ? 'Success' : t.status; }
  PM_VERIFY_HISTORY.unshift({when: TODAY + ' ' + new Date().toTimeString().slice(0, 5), ref: v.receipt,
    action: 'Verified', by: 'Chikondi Mwale', detail: 'Manual verification · ' + v.check});
  pmLogChange('Verification', 'Payment verified ' + v.receipt, 'awaiting', 'verified');
  renderVerification(); renderVerificationSafe(); renderOverview();
  toast(v.receipt + ' verified');
}
function renderVerificationSafe(){
  renderTransactions(); renderStats(); renderChanges(); renderMethods();
}
function rejectPayment(id){
  const v = PM_VERIFY.find(x => x.id === id);
  if(!v) return;
  openModal('Reject ' + v.receipt, pmMoney(v.amount) + ' · ' + v.method,
    `<div class="fg"><label>Reason for rejecting</label>
      <select id="rejReason">
        <option>Amount does not match the receipt</option>
        <option>Reference does not belong to this loan</option>
        <option>Duplicate of a payment already posted</option>
        <option>Customer says they did not pay</option>
      </select></div>
     <div class="qhint" style="margin-top:6px">A rejected payment is kept in the trail and the customer is told why.</div>`,
    [{label: 'Reject the payment', cls: 'btn-gold', act: () => {
        const reason = el('rejReason').value;
        PM_VERIFY.splice(PM_VERIFY.indexOf(v), 1);
        PM_REJECTED.unshift({when: TODAY + ' ' + new Date().toTimeString().slice(0, 5), ref: v.receipt,
          amount: v.amount, reason, by: 'STF-009', status: 'Rejected', lane: 'Verification', severity: 'High',
          owner: 'STF-009', region: v.region});
        const t = PM_TXNS.find(x => x.id === v.txn);
        if(t){ t.verified = 'Rejected'; t.status = 'Failed'; t.error = reason; }
        PM_VERIFY_HISTORY.unshift({when: TODAY + ' ' + new Date().toTimeString().slice(0, 5), ref: v.receipt,
          action: 'Rejected', by: 'Chikondi Mwale', detail: 'Manual rejection · ' + reason});
        pmLogChange('Verification', 'Payment rejected ' + v.receipt, 'awaiting', reason);
        closeModal();
        renderVerification(); renderTransactions(); renderOverview(); renderChanges(); renderStats();
        toast(v.receipt + ' rejected — the customer has been told', 'warn');
      }},
     {label: 'Keep it waiting', act: 'close'}]);
}
function autoConfirmAll(){
  if(!PM_SET.autoConfirm) return toast('Automatic confirmation is switched off in Settings', 'warn');
  const q = verifyQueue().filter(v => v.level === 'First check' && v.amount === v.expected);
  if(!q.length) return toast('Nothing to confirm automatically — the queue needs a human', 'warn');
  q.forEach(v => {
    v.status = 'Verified';
    const t = PM_TXNS.find(x => x.id === v.txn);
    if(t){ t.verified = 'Verified'; t.status = 'Success'; }
    PM_VERIFY_HISTORY.unshift({when: TODAY + ' ' + new Date().toTimeString().slice(0, 5), ref: v.receipt,
      action: 'Verified', by: 'Automatic', detail: 'Automatic confirmation · ' + v.check});
  });
  pmLogChange('Verification', 'Automatic confirmation', q.length + ' waiting', q.length + ' confirmed');
  renderVerification(); renderTransactions(); renderOverview(); renderChanges(); renderStats();
  if(el('vMsg')) el('vMsg').textContent = q.length + ' payment' + (q.length === 1 ? '' : 's') +
    ' confirmed automatically at ' + new Date().toTimeString().slice(0, 5) + ' — reference and amount both matched.';
  toast(q.length + ' confirmed automatically');
}
function approveAllVerification(){
  const q = verifyQueue().filter(v => v.status === 'Awaiting approval');
  if(!q.length) return toast('Nothing is waiting for a second signature', 'warn');
  q.forEach(v => {
    v.status = 'Verified';
    const t = PM_TXNS.find(x => x.id === v.txn);
    if(t) t.verified = 'Verified';
    PM_VERIFY_HISTORY.unshift({when: TODAY + ' ' + new Date().toTimeString().slice(0, 5), ref: v.receipt,
      action: 'Verified', by: 'Chikondi Mwale', detail: 'Second signature given · ' + v.check});
  });
  pmLogChange('Verification', 'Second signatures', q.length + ' waiting', q.length + ' approved');
  renderVerification(); renderTransactions(); renderOverview(); renderChanges();
  if(el('vMsg')) el('vMsg').textContent = q.length + ' payment' + (q.length === 1 ? '' : 's') +
    ' carrying a second signature at ' + new Date().toTimeString().slice(0, 5) + '.';
  toast(q.length + ' payments approved');
}
function toggleVerification(kind){
  if(kind === 'auto'){
    PM_SET.autoConfirm = !PM_SET.autoConfirm;
    pmLogChange('Verification', 'Automatic confirmation', PM_SET.autoConfirm ? 'off' : 'on', PM_SET.autoConfirm ? 'on' : 'off');
  } else {
    PM_SET.requireApprovalLimit = !PM_SET.requireApprovalLimit;
    pmLogChange('Verification', 'Second signature', PM_SET.requireApprovalLimit ? 'off' : 'on', PM_SET.requireApprovalLimit ? 'on' : 'off');
  }
  renderVerification(); renderSettings(); renderChanges(); renderOverview();
  toast((kind === 'auto' ? 'Automatic confirmation ' : 'Second signature ') +
    ((kind === 'auto' ? PM_SET.autoConfirm : PM_SET.requireApprovalLimit) ? 'switched on' : 'switched off'));
}
</script>
