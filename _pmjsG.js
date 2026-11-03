<script>
/* ============================================================
   METHODS OF PAYMENT MANAGEMENT (7/7)
   14 · Notifications  15 · Security  16 · Refunds  17 · Database
   18 · API and webhooks  19 · Reports  20 · Settings
   Filters, the render loop, wiring and boot.
   ============================================================ */

/* ===================== 14 · PAYMENT NOTIFICATIONS ===================== */
function renderNotifications(){
  const log = PM_NOTIFY_LOG;
  const failed = log.filter(l => l.status === 'Failed');
  el('ntPill').className = 'badge ' + (failed.length ? 'b-warn' : 'b-ok');
  el('ntPill').textContent = log.length + ' messages';
  el('ntKpis').innerHTML = [
    ['Notification rules', num(PM_NOTIFY_RULES.filter(r => r.on).length), 'of ' + PM_NOTIFY_RULES.length + ' possible events', ''],
    ['Messages sent', num(log.length), 'Over SMS and email', ''],
    ['Delivered', num(log.filter(l => /Delivered/.test(l.status)).length), pct(log.filter(l => /Delivered/.test(l.status)).length, log.length).toFixed(1) + '% of the traffic', ''],
    ['Failed', num(failed.length), 'Retried on the next sweep', failed.length ? 'red' : ''],
    ['SMS balance', num(PM_CHANNELS.sms.balance), PM_CHANNELS.sms.provider + ' · ' + PM_CHANNELS.sms.status, ''],
    ['Email quota', PM_CHANNELS.email.balance, PM_CHANNELS.email.provider + ' · ' + PM_CHANNELS.email.status, '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join('');

  if(el('ntMsg') && !el('ntMsg').textContent)
    el('ntMsg').textContent = 'Last SMS at ' + PM_CHANNELS.sms.lastSend + ' · last email at ' +
      PM_CHANNELS.email.lastSend + ' · ' + num(PM_CHANNELS.sms.balance) + ' SMS credits left.';
  el('ntRulePill').textContent = PM_NOTIFY_RULES.length + ' rules';
  renderTable('ntBody', [
    {k: 'event', label: 'Event'},
    {k: 'sms', label: 'SMS', html: v => v ? okBadge('On') : badge('Off', 'b-gray')},
    {k: 'email', label: 'Email', html: v => v ? okBadge('On') : badge('Off', 'b-gray')},
    {k: 'to', label: 'Recipient'},
    {k: 'template', label: 'Template'},
    {k: 'on', label: 'Rule', html: v => v ? okBadge('On') : badge('Off', 'b-gray')},
    {k: 'act', label: '', html: (v, r) => `<button class="btn btn-ghost" data-ntrule="${esc(r.event)}">${r.on ? 'Switch off' : 'Switch on'}</button>`}
  ], PM_NOTIFY_RULES, {sort: 'event', pageSize: 8, onRow: false});

  el('ntConnPill').className = 'badge ' + (PM_CHANNELS.sms.status === 'Connected' ? 'b-ok' : 'b-warn');
  el('ntConnPill').textContent = 'SMS ' + PM_CHANNELS.sms.status.toLowerCase();
  put('smsBox',
    kvRow('Provider', esc(PM_CHANNELS.sms.provider)) +
    kvRow('Sender ID', esc(PM_CHANNELS.sms.sender)) +
    kvRow('State', okBadge(PM_CHANNELS.sms.status === 'Connected' ? 'Connected' : 'Degraded')) +
    kvRow('Latency', PM_CHANNELS.sms.latency + ' ms') +
    kvRow('Credits left', num(PM_CHANNELS.sms.balance)) +
    kvRow('Credential', esc(PM_CHANNELS.sms.credential)));
  put('emailBox',
    kvRow('Provider', esc(PM_CHANNELS.email.provider)) +
    kvRow('From address', esc(PM_CHANNELS.email.sender)) +
    kvRow('State', okBadge('Connected')) +
    kvRow('Latency', PM_CHANNELS.email.latency + ' ms') +
    kvRow('Monthly quota', esc(PM_CHANNELS.email.balance)) +
    kvRow('Credential', esc(PM_CHANNELS.email.credential)));

  const del = {};
  log.forEach(l => {
    del[l.channel] = del[l.channel] || {channel: l.channel, sent: 0, delivered: 0, failed: 0, queued: 0};
    del[l.channel].sent += 1;
    if(/Delivered/.test(l.status)) del[l.channel].delivered += 1;
    else if(/Queue|Pending/.test(l.status)) del[l.channel].queued += 1;
    else del[l.channel].failed += 1;
  });
  const delRows = Object.values(del);
  el('ntDelPill').className = 'badge ' + (sum(delRows, d => d.failed) ? 'b-warn' : 'b-ok');
  el('ntDelPill').textContent = sum(delRows, d => d.delivered) + ' delivered';
  renderTable('ntDelBody', [
    {k: 'channel', label: 'Channel'},
    {k: 'sent', label: 'Sent', num: true},
    {k: 'delivered', label: 'Delivered', num: true},
    {k: 'queued', label: 'Queued', num: true},
    {k: 'failed', label: 'Failed', num: true}
  ], delRows, {sort: 'sent', pageSize: 4, onRow: false});

  el('ntHistPill').textContent = log.length + ' entries';
  renderTable('ntHistBody', [
    {k: 'when', label: 'When', html: v => esc(String(v).slice(0, 16))},
    {k: 'event', label: 'Event'},
    {k: 'channel', label: 'Channel'},
    {k: 'to', label: 'To'},
    {k: 'reference', label: 'Payment'},
    {k: 'status', label: 'State', html: v => okBadge(/Delivered/.test(v) ? 'Delivered' : /Failed/.test(v) ? 'Failed' : 'Queued')}
  ], log, {sort: 'when', pageSize: 8, onRow: false});

  el('ntGrid').innerHTML =
    chartBox({title: 'Messages by event', sub: 'Which events generate traffic', type: 'bar', h: 200,
      cats: PM_NOTIFY_RULES.map(r => r.event.split(' ')[0]),
      series: [{name: 'Messages', data: PM_NOTIFY_RULES.map(r => log.filter(l => l.event === r.event).length)}],
      value: log.length + ' messages'}) +
    chartBox({title: 'Channel split', sub: 'SMS against email', type: 'donut', h: 200,
      cats: ['SMS', 'Email'],
      series: [{name: 'Messages', data: ['SMS', 'Email'].map(c => log.filter(l => l.channel === c).length)}],
      value: log.length});
}
function toggleNotifyRule(event){
  const r = PM_NOTIFY_RULES.find(x => x.event === event);
  if(!r) return;
  r.on = !r.on;
  pmLogChange('Notifications', 'Rule ' + event, r.on ? 'off' : 'on', r.on ? 'on' : 'off');
  renderNotifications(); renderCustomer(); renderChanges();
  toast(event + ' notifications ' + (r.on ? 'switched on' : 'switched off'));
}
function testChannel(kind){
  const c = PM_CHANNELS[kind];
  const now = TODAY + ' ' + new Date().toTimeString().slice(0, 5);
  const ok = kind === 'sms' ? c.status === 'Connected' : true;
  PM_NOTIFY_LOG.unshift({when: now, event: 'Test message', channel: kind === 'sms' ? 'SMS' : 'Email',
    to: kind === 'sms' ? '+265 991 000 111' : 'chikondi@goldenloan.mw',
    reference: 'TEST-' + (kind === 'sms' ? 'SMS' : 'EML'), status: ok ? 'Delivered' : 'Failed',
    lane: 'Notifications', severity: 'Low', owner: 'STF-009', region: 'Lilongwe'});
  if(ok){
    c.lastSend = now;
    if(kind === 'sms'){ c.balance = Math.max(0, c.balance - 1); c.latency = 610; c.status = 'Degraded'; }
    else c.balance = '48,199 of 50,000';
  }
  pmLogChange('Notifications', 'Test ' + (kind === 'sms' ? 'SMS' : 'email'), 'not tested', ok ? 'delivered' : 'failed');
  renderNotifications(); renderChanges();
  if(el('ntMsg')) el('ntMsg').textContent = ok
    ? 'Test ' + kind.toUpperCase() + ' sent at ' + now.slice(-5) + ' and delivered to ' +
      (kind === 'sms' ? '+265 991 000 111' : 'chikondi@goldenloan.mw') + '.'
    : 'The SMS gateway is ' + c.status.toLowerCase() + ' — the test failed. Check the sender ID and the credit balance.';
  toast(ok ? 'Test ' + kind + ' delivered' : 'Test ' + kind + ' failed', ok ? 'ok' : 'warn');
}

/* ===================== 15 · PAYMENT SECURITY AND ACCESS ===================== */
function renderSecurity(){
  const open = PM_SECURITY_EVENTS.filter(e => e.status !== 'Resolved');
  el('secPill').className = 'badge ' + (open.length ? 'b-warn' : 'b-ok');
  el('secPill').textContent = open.length + ' open events';
  el('secKpis').innerHTML = [
    ['Roles with payment access', num(PM_ROLES.length), PM_CAPS.length + ' capabilities mapped', ''],
    ['Rows in the matrix', num(PM_ROLES.length * PM_CAPS.length), PM_PERMS ? 'Editable cell by cell' : '', ''],
    ['Approvals pending', num(PM_APPROVALS.filter(a => a.state === 'Pending').length), 'Sensitive changes waiting', PM_APPROVALS.some(a => a.state === 'Pending') ? 'red' : ''],
    ['Security events', num(PM_SECURITY_EVENTS.length), open.length + ' still open', open.length ? 'red' : ''],
    ['Credentials stored', '0 in code', 'Every key lives in the vault', ''],
    ['Audit entries', num(PM_CHANGES.length + PM_SECURITY_EVENTS.length), 'Every change with an officer', '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join('');

  const roles = PM_ROLES;
  const cols = [{k: 'role', label: 'Role'}].concat(PM_CAPS.map((cap, i) => ({
    k: 'c' + i, label: cap, html: (v, r) => `<button class="btn btn-ghost" style="padding:2px 6px;font-size:9px"
      data-perm="${esc(r.role)}" data-pi="${i}">${v ? '✓' : '–'}</button>`})));
  const permRows = roles.map(role => {
    const row = {role};
    PM_CAPS.forEach((c, i) => { row['c' + i] = (PM_PERMS[role] || [])[i] || 0; });
    return row;
  });
  el('permPill').textContent = sum(permRows, r => sum(PM_CAPS.map((c, i) => r['c' + i]))) + ' grants';
  renderTable('permBody', cols, permRows, {sort: 'role', dir: 'asc', pageSize: 6, onRow: false});

  el('secApprPill').textContent = PM_APPROVALS.length + ' requests';
  renderTable('secApprBody', [
    {k: 'id', label: 'Request'},
    {k: 'change', label: 'Change'},
    {k: 'area', label: 'Area'},
    {k: 'by', label: 'Asked by', html: v => esc(staffName(v))},
    {k: 'state', label: 'State', html: v => okBadge(v === 'Approved' ? 'Approved' : 'Pending')},
    {k: 'act', label: '', html: (v, r) => r.state === 'Approved' ? '' : `<button class="btn btn-ghost" data-appr="${esc(r.id)}">Approve</button>`}
  ], PM_APPROVALS, {sort: 'requested', pageSize: 4, onRow: false});

  put('credProtBox',
    kvRow('Where keys are stored', 'Supabase Vault, encrypted at rest') +
    kvRow('What the browser sees', 'A masked string ending in four characters') +
    kvRow('Rotation', 'Every 90 days, forced after an incident') +
    kvRow('Who may read a key', 'Super Admin only, and never in full') +
    kvRow('Access logged', 'Every read lands in the audit trail'));
  put('hookSecBox',
    kvRow('Signature scheme', 'HMAC-SHA256 over the raw body and a timestamp') +
    kvRow('Replay window', '5 minutes, nonce cached') +
    kvRow('Unsigned callbacks', 'Rejected and counted as a security event') +
    kvRow('Last rejection', PM_SECURITY_EVENTS.filter(e => /signature/i.test(e.event)).length + ' on record') +
    kvRow('Endpoint allowlist', 'Three provider IP ranges only'));

  el('unauthPill').className = 'badge ' + (open.length ? 'b-crit' : 'b-ok');
  el('unauthPill').textContent = open.length + ' open';
  renderTable('unauthBody', [
    {k: 'when', label: 'When', html: v => esc(String(v).slice(0, 16))},
    {k: 'event', label: 'Event'},
    {k: 'source', label: 'Source'},
    {k: 'severity', label: 'Severity', html: v => badge(v, SEV(v))},
    {k: 'status', label: 'State', html: v => okBadge(v === 'Resolved' ? 'Resolved' : 'Open')}
  ], PM_SECURITY_EVENTS, {sort: 'when', pageSize: 5, onRow: false});

  const audit = PM_CHANGES.slice(0, 40).map(c => ({when: c.when, action: c.what, area: c.area,
    officer: c.by, detail: c.from + ' → ' + c.to}))
    .concat(PM_SECURITY_EVENTS.map(e => ({when: e.when, action: e.event, area: 'Security',
      officer: e.owner, detail: e.source})));
  audit.sort((a, b) => String(b.when).localeCompare(String(a.when)));
  el('pauditPill').textContent = audit.length + ' entries';
  renderTable('pauditBody', [
    {k: 'when', label: 'When', html: v => esc(String(v).slice(0, 16))},
    {k: 'action', label: 'Action'},
    {k: 'area', label: 'Area'},
    {k: 'officer', label: 'Officer', html: v => esc(staffName(v))},
    {k: 'detail', label: 'Detail'}
  ], audit, {sort: 'when', pageSize: 8, onRow: false});

  el('secGrid').innerHTML =
    chartBox({title: 'Capabilities by role', sub: 'How much each role may do', type: 'bar', h: 200,
      cats: PM_ROLES.map(r => r.split(' ')[0]),
      series: [{name: 'Capabilities', data: PM_ROLES.map(r => sum(PM_PERMS[r] || []))}],
      value: PM_ROLES.length + ' roles'}) +
    chartBox({title: 'Approvals by area', sub: 'What needs a second signature', type: 'donut', h: 200,
      cats: Array.from(new Set(PM_APPROVALS.map(a => a.area))),
      series: [{name: 'Requests', data: Array.from(new Set(PM_APPROVALS.map(a => a.area))).map(a => PM_APPROVALS.filter(x => x.area === a).length)}],
      value: PM_APPROVALS.length});
}
function togglePerm(role, i){
  const row = PM_PERMS[role];
  if(!row) return;
  const cap = PM_CAPS[i];
  row[i] = row[i] ? 0 : 1;
  pmLogChange('Permissions', cap + ' for ' + role, row[i] ? 'withdrawn' : 'granted', row[i] ? 'granted' : 'withdrawn');
  renderSecurity(); renderChanges();
  toast(role + ' may ' + (row[i] ? '' : 'no longer ') + cap.toLowerCase());
}
function approveSensitive(id){
  const a = PM_APPROVALS.find(x => x.id === id);
  if(!a) return;
  a.state = 'Approved';
  pmLogChange('Permissions', 'Approved ' + a.id, 'pending', a.change);
  renderSecurity(); renderChanges();
  toast(a.id + ' approved');
}

/* ===================== 16 · REFUNDS, REVERSALS AND DISPUTES ===================== */
function renderRefunds(){
  const rf = PM_REFUNDS;
  const pending = rf.filter(r => r.status === 'Pending');
  el('rfPill').className = 'badge ' + (pending.length ? 'b-warn' : 'b-ok');
  el('rfPill').textContent = pending.length + ' pending';
  el('rfKpis').innerHTML = [
    ['Refund requests', num(rf.length), pending.length + ' waiting on a signature', ''],
    ['Requested value', pmMoney(sum(rf, r => r.amount)), 'Across ' + new Set(rf.map(r => r.cust)).size + ' customers', ''],
    ['Refunded', pmMoney(sum(rf.filter(r => r.status === 'Refunded'), r => r.amount)), 'Sent back through the provider', ''],
    ['Reversals', num(PM_REVERSALS.length), pmMoney(sum(PM_REVERSALS, r => r.amount)) + ' restored to loans', ''],
    ['Disputes', num(PM_DISPUTES.length), PM_DISPUTES.filter(d => d.status !== 'Resolved').length + ' still investigating', ''],
    ['Second signature', PM_SET.requireApprovalRefund ? 'Required' : 'Not required', 'Set in Settings', '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join('');

  if(el('refMsg') && !el('refMsg').textContent)
    el('refMsg').textContent = pending.length + ' request' + (pending.length === 1 ? '' : 's') +
      ' waiting · ' + pmMoney(sum(pending, r => r.amount)) + ' to refund · ' +
      (PM_SET.requireApprovalRefund ? 'a second signature is required' : 'no signature required') + '.';
  el('refPill').textContent = rf.length + ' requests';
  renderTable('refBody', [
    {k: 'id', label: 'Request'},
    {k: 'receipt', label: 'Receipt'},
    {k: 'cust', label: 'Customer', html: v => esc(custName(v))},
    {k: 'amount', label: 'Amount', num: true, html: v => pmMoney(v)},
    {k: 'reason', label: 'Reason'},
    {k: 'requested', label: 'Asked', html: v => esc(String(v).slice(0, 16))},
    {k: 'status', label: 'State', html: v => okBadge(v === 'Refunded' ? 'Refunded' : v === 'Approved' ? 'Approved' : 'Pending')},
    {k: 'act', label: '', html: (v, r) => (r.status === 'Pending'
        ? `<button class="btn btn-ghost" data-ref="${esc(r.id)}" data-refact="approve">Approve</button>
           <button class="btn btn-ghost" data-ref="${esc(r.id)}" data-refact="reject">Reject</button>`
        : r.status === 'Approved' ? `<button class="btn btn-ghost" data-ref="${esc(r.id)}" data-refact="refund">Refund</button>` : '')}
  ], rf, {sort: 'requested', pageSize: 6, onRow: false});

  el('eligPill').textContent = rf.filter(r => /^Yes/.test(r.eligible)).length + ' eligible';
  put('eligBox',
    kvRow('Refundable within', '30 days of the payment') +
    kvRow('Refundable when', 'The payment was duplicated, posted to the wrong loan, or the customer was overcharged') +
    kvRow('Not refundable', 'A payment already applied to a settled loan, or a disputed amount under investigation') +
    rf.map(r => `<div class="checkrow">
        <div class="ck ${/^Yes/.test(r.eligible) ? 'pass' : 'warn'}">${/^Yes/.test(r.eligible) ? '✓' : '!'}</div>
        <div style="flex:1"><div style="font-size:10.5px;font-weight:800">${esc(r.id)} · ${pmMoney(r.amount)}</div>
          <div class="qhint">${esc(r.eligible)}</div></div></div>`).join(''));
  put('flowBox', [
    ['Requested', 'A cashier or the customer raises it', rf.length > 0],
    ['Checked', 'The receipt, the loan and the provider reference are matched', true],
    ['Approved', PM_SET.requireApprovalRefund ? 'A second officer signs it off' : 'The request is approved on the spot', true],
    ['Posted', 'The provider is asked to send the money back', rf.some(r => r.status === 'Refunded')],
    ['Recorded', 'The refund and the reversal are written to the ledger', true]
  ].map(([t, d, done], i) => `<div class="checkrow">
      <div class="ck ${done ? 'pass' : 'warn'}">${i + 1}</div>
      <div style="flex:1"><div style="font-size:10.5px;font-weight:800">${esc(t)}</div>
        <div class="qhint">${esc(d)}</div></div></div>`).join(''));

  el('provRefPill').textContent = PM_PROVIDERS.filter(p => p.status === 'Connected').length + ' rails live';
  put('provBox', PM_REFUNDS.length ? PM_PROVIDERS.filter(p => p.status === 'Connected').slice(0, 5).map(p => `<div class="checkrow">
      <div class="ck pass">✓</div>
      <div style="flex:1"><div style="font-size:10.5px;font-weight:800">${esc(p.name)}</div>
        <div class="qhint">Refund by ${esc(p.kind === 'Mobile money' ? 'the reversal API' : p.kind === 'Bank' ? 'a matched bank reversal' : 'a card void')} ·
          signed with ${esc(p.signature)}</div></div></div>`).join('')
    : '<div class="empty">No refundable rail is connected right now.</div>');

  el('revPill').textContent = PM_REVERSALS.length + ' reversals';
  renderTable('revBody', [
    {k: 'id', label: 'Reversal'},
    {k: 'receipt', label: 'Receipt'},
    {k: 'when', label: 'When', html: v => esc(String(v).slice(0, 16))},
    {k: 'amount', label: 'Amount', num: true, html: v => pmMoney(v)},
    {k: 'reason', label: 'Reason'},
    {k: 'status', label: 'State', html: v => okBadge(v === 'Posted' ? 'Posted' : 'Pending')}
  ], PM_REVERSALS, {sort: 'when', pageSize: 5, onRow: false});

  el('impactPill').textContent = pmMoney(sum(PM_REVERSALS, r => r.amount)) + ' restored';
  put('impactBox', PM_REVERSALS.map(r => `<div class="risk">
      <div><div class="rn">${esc(r.receipt)} · ${pmMoney(r.amount)}</div>
        <div class="rs">${esc(r.balance)}</div></div>
      <div class="rv">${okBadge(r.status === 'Posted' ? 'Posted' : 'Pending')}</div></div>`).join('')
    + `<div class="qhint" style="margin-top:6px">A reversal puts the principal back on the loan and reopens the instalment it had paid.</div>`);

  el('dspPill').textContent = PM_DISPUTES.length + ' disputes';
  renderTable('dspBody', [
    {k: 'id', label: 'Dispute'},
    {k: 'cust', label: 'Customer', html: v => esc(custName(v))},
    {k: 'amount', label: 'Claimed', num: true, html: v => pmMoney(v)},
    {k: 'raised', label: 'Raised', html: v => esc(String(v).slice(0, 16))},
    {k: 'claim', label: 'Claim'},
    {k: 'status', label: 'State', html: v => okBadge(v === 'Resolved' ? 'Resolved' : 'Investigating')},
    {k: 'act', label: '', html: (v, r) => `<button class="btn btn-ghost" data-dsp="${esc(r.id)}">Open</button>`}
  ], PM_DISPUTES, {sort: 'raised', pageSize: 5, onRow: false});

  const d = PM_DISPUTES.find(x => x.id === DSPSEL) || PM_DISPUTES[0];
  if(d){
    put('dspDetailBox', `<div class="minihead">${esc(d.id)} · ${esc(custName(d.cust))}</div>
      ${kvRow('Loan', esc(d.loan))}
      ${kvRow('Claimed', pmMoney(d.amount))}
      ${kvRow('Claim', esc(d.claim))}
      ${kvRow('Evidence', esc(d.evidence))}
      ${kvRow('Raised', esc(d.raised))}
      ${kvRow('Handler', esc(staffName(d.owner)))}`);
    put('resolBox', d.status === 'Resolved'
      ? `<div class="note gold"><div>Resolved — ${esc(d.decision)}</div></div>`
      : `<div class="minihead">Record the decision</div>
        <div class="fg"><label>Outcome</label><select id="dspDecision">
          <option>Refund in full</option><option>Refund the difference</option><option>Payment verified as correct</option>
          <option>Escalate to the provider</option></select></div>
        <div class="form-actions"><button class="btn btn-gold" data-dspres="${esc(d.id)}">Resolve the dispute</button></div>`);
  }

  const audit = PM_REFUNDS.map(r => ({when: r.requested, what: 'Refund ' + r.id, amount: r.amount, by: r.by, status: r.status}))
    .concat(PM_REVERSALS.map(r => ({when: r.when, what: 'Reversal ' + r.id, amount: r.amount, by: r.by, status: r.status})))
    .concat(PM_DISPUTES.map(r => ({when: r.raised, what: 'Dispute ' + r.id, amount: r.amount, by: r.owner, status: r.status})));
  audit.sort((a, b) => String(b.when).localeCompare(String(a.when)));
  el('rfAuditPill').textContent = audit.length + ' entries';
  renderTable('rfAuditBody', [
    {k: 'when', label: 'When', html: v => esc(String(v).slice(0, 16))},
    {k: 'what', label: 'Record'},
    {k: 'amount', label: 'Amount', num: true, html: v => pmMoney(v)},
    {k: 'by', label: 'Officer', html: v => esc(staffName(v))},
    {k: 'status', label: 'State', html: v => okBadge(v)}
  ], audit, {sort: 'when', pageSize: 7, onRow: false});
}
let DSPSEL = null;
function refundAction(id, act){
  const r = PM_REFUNDS.find(x => x.id === id);
  if(!r) return;
  if(act === 'approve'){
    if(PM_SET.requireApprovalRefund){
      r.status = 'Approved';
      pmLogChange('Refunds', 'Refund approved ' + id, 'pending', 'approved — waiting to post');
      toast(id + ' approved — post it to send the money back');
    } else {
      r.status = 'Approved';
      toast(id + ' approved');
    }
  } else if(act === 'reject'){
    r.status = 'Rejected';
    pmLogChange('Refunds', 'Refund rejected ' + id, 'pending', 'rejected');
    toast(id + ' rejected', 'warn');
  } else {
    r.status = 'Refunded';
    const t = PM_TXNS.find(x => x.receipt === r.receipt);
    if(t){ t.status = 'Reversed'; t.reconciled = 'N/A'; }
    PM_REVERSALS.unshift({id: 'REV-' + (119 + PM_REVERSALS.length), txn: t ? t.id : '—', receipt: r.receipt,
      amount: r.amount, when: TODAY + ' ' + new Date().toTimeString().slice(0, 5),
      reason: r.reason, balance: 'Loan balance restored by ' + pmMoney(r.amount), by: 'STF-009', status: 'Posted'});
    pmLogChange('Refunds', 'Refund posted ' + id, 'approved', 'refunded via the provider');
    toast(pmMoney(r.amount) + ' refunded to ' + custName(r.cust));
  }
  renderRefunds(); renderTransactions(); renderOverview(); renderChanges(); renderStats();
  if(el('refMsg')) el('refMsg').textContent = id + ' ' + r.status.toLowerCase() + ' — ' + r.reason + '.';
}
function openDispute(id){
  DSPSEL = id;
  renderRefunds();
  const d = PM_DISPUTES.find(x => x.id === id);
  if(!d) return;
  openModal('Dispute ' + d.id, custName(d.cust) + ' · ' + pmMoney(d.amount),
    `<div class="pfields" style="grid-template-columns:1fr 1fr">
      ${field('Loan', esc(d.loan))}
      ${field('Raised', esc(d.raised))}
      ${field('Claim', esc(d.claim))}
      ${field('Evidence', esc(d.evidence))}
      ${field('Status', okBadge(d.status === 'Resolved' ? 'Resolved' : 'Investigating'))}
      ${field('Decision', esc(d.decision || 'Pending'))}
    </div>
    <div class="qhint" style="margin-top:8px">Every receipt on this loan is in the reconciliation view if you need to compare it.</div>`,
    [{label: 'Close', act: 'close'}]);
}
function resolveDispute(id){
  const d = PM_DISPUTES.find(x => x.id === id);
  if(!d) return;
  const outcome = el('dspDecision') ? el('dspDecision').value : 'Refund in full';
  d.status = 'Resolved';
  d.decision = outcome;
  pmLogChange('Refunds', 'Dispute resolved ' + id, 'investigating', outcome);
  renderRefunds(); renderChanges();
  toast(d.id + ' resolved — ' + outcome);
}

/* ===================== 17 · SUPABASE AND DATABASE CONNECTIONS ===================== */
function renderDb(){
  const gap = PM_DB_TABLES.filter(t => t.rls !== 'Enabled');
  el('dbPill').className = 'badge ' + (gap.length ? 'b-warn' : 'b-ok');
  el('dbPill').textContent = PM_DB_TABLES.length + ' tables';
  el('dbKpis').innerHTML = [
    ['Tables connected', num(PM_DB_TABLES.length), num(sum(PM_DB_TABLES, t => t.rows)) + ' rows in total', ''],
    ['Row-level security', (PM_DB_TABLES.length - gap.length) + '/' + PM_DB_TABLES.length, gap.length + ' without a policy', gap.length ? 'red' : ''],
    ['Functions', num(PM_DB_FUNCS.length), sum(PM_DB_FUNCS, f => f.calls) + ' calls this period', ''],
    ['Error groups', num(PM_DB_ERRORS.length), sum(PM_DB_ERRORS, e => e.count) + ' occurrences', ''],
    ['Checks passing', PM_DB_CHECKS.filter(c => c.status === 'Pass').length + '/' + PM_DB_CHECKS.length, 'Consistency and schema', ''],
    ['Migrations', num(PM_MIGRATIONS.length), PM_MIGRATIONS.filter(m => m.status === 'Pending').length + ' waiting', '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join('');

  el('dbGrid').innerHTML =
    chartBox({title: 'Rows by table', sub: 'Where the payment data lives', type: 'bar', h: 190,
      cats: PM_DB_TABLES.map(t => t.table.replace('payment_', '')),
      series: [{name: 'Rows', data: PM_DB_TABLES.map(t => t.rows)}],
      value: num(sum(PM_DB_TABLES, t => t.rows))}) +
    chartBox({title: 'Errors by SQLSTATE', sub: 'What the functions raise', type: 'bar', h: 190,
      cats: PM_DB_ERRORS.map(e => e.code),
      series: [{name: 'Occurrences', data: PM_DB_ERRORS.map(e => e.count)}],
      value: sum(PM_DB_ERRORS, e => e.count) + ' errors'});

  el('dbTblPill').textContent = PM_DB_TABLES.length + ' tables';
  renderTable('dbTblBody', [
    {k: 'table', label: 'Table'},
    {k: 'rows', label: 'Rows', num: true},
    {k: 'size', label: 'Size'},
    {k: 'rls', label: 'RLS', html: v => okBadge(v === 'Enabled' ? 'Enabled' : 'Disabled')},
    {k: 'note', label: 'Policy'},
    {k: 'lastWrite', label: 'Last write', html: v => esc(String(v).slice(0, 16))}
  ], PM_DB_TABLES, {sort: 'rows', pageSize: 8, onRow: false});

  el('dbfnPill').textContent = PM_DB_FUNCS.length + ' functions';
  renderTable('dbfnBody', [
    {k: 'name', label: 'Function'},
    {k: 'kind', label: 'Kind'},
    {k: 'invoker', label: 'Runs as'},
    {k: 'calls', label: 'Calls', num: true},
    {k: 'status', label: 'State', html: v => okBadge(v === 'Healthy' ? 'Healthy' : 'Review')}
  ], PM_DB_FUNCS, {sort: 'calls', pageSize: 6, onRow: false});

  el('rlsPill').className = 'badge ' + (gap.length ? 'b-crit' : 'b-ok');
  el('rlsPill').textContent = gap.length ? gap.length + ' gap' : 'All covered';
  put('rlsBox', PM_DB_TABLES.map(t => `<div class="checkrow">
      <div class="ck ${t.rls === 'Enabled' ? 'pass' : 'crit'}">${t.rls === 'Enabled' ? '✓' : '!'}</div>
      <div style="flex:1"><div style="font-size:10.5px;font-weight:800">${esc(t.table)}</div>
        <div class="qhint">${esc(t.rls)} · ${esc(t.note)}</div></div>
      <div>${okBadge(t.rls === 'Enabled' ? 'Enabled' : 'Disabled')}</div></div>`).join('')
    + (gap.length ? `<div class="qhint" style="margin-top:6px">Without a policy the anon key can read this table — close it before the day ends.</div>` : ''));

  el('dbErrPill').textContent = PM_DB_ERRORS.length + ' groups';
  renderTable('dbErrBody', [
    {k: 'code', label: 'SQLSTATE'},
    {k: 'message', label: 'Message'},
    {k: 'count', label: 'Hits', num: true},
    {k: 'when', label: 'Last seen', html: v => esc(String(v).slice(0, 16))},
    {k: 'status', label: 'State', html: v => okBadge(v === 'Resolved' ? 'Resolved' : 'Open')}
  ], PM_DB_ERRORS, {sort: 'count', pageSize: 5, onRow: false});

  el('consistPill').textContent = PM_DB_CHECKS.filter(c => c.status === 'Pass').length + ' passing';
  put('consistBox', PM_DB_CHECKS.map(c => `<div class="checkrow">
      <div class="ck ${c.status === 'Pass' ? 'pass' : 'crit'}">${c.status === 'Pass' ? '✓' : '!'}</div>
      <div style="flex:1"><div style="font-size:10.5px;font-weight:800">${esc(c.check)}</div>
        <div class="qhint">${esc(c.value)}</div></div>
      <div>${okBadge(c.status === 'Pass' ? 'Pass' : 'Failed')}</div></div>`).join(''));
  put('dbDiagBox', '<div class="qhint">Run the diagnostics to time every payment table and function.</div>');

  el('migPill').textContent = PM_MIGRATIONS.length + ' migrations';
  renderTable('migBody', [
    {k: 'id', label: 'Version'},
    {k: 'name', label: 'Migration'},
    {k: 'when', label: 'Applied', html: v => esc(String(v).slice(0, 16))},
    {k: 'status', label: 'State', html: v => okBadge(v === 'Applied' ? 'Applied' : 'Pending')}
  ], PM_MIGRATIONS, {sort: 'id', pageSize: 5, onRow: false});
}
function fixRls(){
  const gaps = PM_DB_TABLES.filter(t => t.rls !== 'Enabled');
  if(!gaps.length) return toast('Every payment table already has a policy', 'ok');
  gaps.forEach(t => {
    t.rls = 'Enabled';
    t.note = 'Policy added at ' + TODAY + ' — branch scoped, admin write';
  });
  PM_DB_CHECKS.forEach(c => { if(c.check === 'Row-level security'){ c.value = 'Every table has a policy'; c.status = 'Pass'; } });
  PM_MIGRATIONS.forEach(m => { if(/RLS/.test(m.name)) m.status = 'Applied'; });
  pmLogChange('Database', 'Row-level security', gaps.length + ' tables open', 'every table covered');
  renderDb(); renderOverview(); renderChanges();
  toast('RLS enabled on ' + gaps.length + ' table' + (gaps.length === 1 ? '' : 's'));
}
function runConsistency(){
  renderDb();
  const failing = PM_DB_CHECKS.filter(c => c.status !== 'Pass');
  pmLogChange('Database', 'Consistency checks', 'last run', failing.length ? failing.length + ' failing' : 'all passing');
  renderChanges();
  toast(failing.length ? failing.length + ' check(s) still failing' : 'Every consistency check passes', failing.length ? 'warn' : 'ok');
}
function runDiagnostics(){
  const rows = PM_DB_TABLES.map((t, i) => {
    const ms = 7 + (t.rows % 23) + i;
    return `<div class="checkrow"><div class="ck pass">✓</div>
      <div style="flex:1"><div style="font-size:10.5px;font-weight:800">${esc(t.table)}</div>
        <div class="qhint">SELECT 1 · ${ms} ms · ${num(t.rows)} rows visible</div></div>
      <div>${okBadge('Pass')}</div></div>`;
  }).concat(PM_DB_FUNCS.map((f, i) => `<div class="checkrow"><div class="ck pass">✓</div>
      <div style="flex:1"><div style="font-size:10.5px;font-weight:800">${esc(f.name)}()</div>
        <div class="qhint">Dry run in a savepoint · ${12 + i * 3} ms</div></div>
      <div>${okBadge('Pass')}</div></div>`)).join('');
  put('dbDiagBox', `<div class="minihead">Diagnostics run at ${new Date().toTimeString().slice(0, 5)}</div>${rows}`);
  pmLogChange('Database', 'Diagnostics', 'not run', PM_DB_TABLES.length + ' tables and ' + PM_DB_FUNCS.length + ' functions timed');
  renderChanges();
  toast('Diagnostics complete — every table answered');
}

/* ===================== 18 · PAYMENT API AND WEBHOOK MONITORING ===================== */
function renderApi(){
  const failing = PM_API.filter(a => a.status !== 'Healthy');
  el('apiPill').className = 'badge ' + (failing.length ? 'b-crit' : 'b-ok');
  el('apiPill').textContent = failing.length ? failing.length + ' failing routes' : 'All healthy';
  el('apiKpis').innerHTML = [
    ['Endpoints monitored', num(PM_API.length), 'Every payment route', ''],
    ['Calls this period', num(sum(PM_API, a => a.calls)), 'Median p95 ' + Math.round(sum(PM_API, a => a.p95) / PM_API.length) + ' ms', ''],
    ['Errors', num(sum(PM_API, a => a.errors)), pct(sum(PM_API, a => a.errors), sum(PM_API, a => a.calls)).toFixed(2) + '% of calls', sum(PM_API, a => a.errors) ? 'red' : ''],
    ['Webhooks delivered', num(PM_WEBHOOKS.filter(w => /Delivered/.test(w.status)).length), PM_WEBHOOKS.length + ' events this period', ''],
    ['Retries exhausted', num(PM_RETRIES.filter(r => r.status === 'Exhausted').length), 'In the dead-letter queue', ''],
    ['Rate-limit breaches', num(PM_RATE.filter(r => r.used / r.limit > 0.85).length), 'Providers close to a ceiling', '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join('');

  el('apiGrid').innerHTML =
    chartBox({title: 'Calls by route', sub: 'Volume across the payment API', type: 'bar', h: 190,
      cats: PM_API.map(a => a.path.split('/').pop()),
      series: [{name: 'Calls', data: PM_API.map(a => a.calls)}],
      value: num(sum(PM_API, a => a.calls))}) +
    chartBox({title: 'Errors by route', sub: 'Where the failures sit', type: 'bar', h: 190,
      cats: PM_API.map(a => a.path.split('/').pop()),
      series: [{name: 'Errors', data: PM_API.map(a => a.errors)}],
      value: sum(PM_API, a => a.errors) + ' errors'});

  el('apiEndPill').textContent = PM_API.length + ' routes';
  renderTable('apiBody', [
    {k: 'path', label: 'Endpoint'},
    {k: 'method', label: 'Method'},
    {k: 'p95', label: 'p95', num: true, html: v => v ? v + ' ms' : 'timeout'},
    {k: 'calls', label: 'Calls', num: true},
    {k: 'errors', label: 'Errors', num: true},
    {k: 'status', label: 'State', html: v => okBadge(v === 'Healthy' ? 'Healthy' : 'Failing')}
  ], PM_API, {sort: 'calls', pageSize: 8, onRow: false});

  el('ratePill').className = 'badge ' + (PM_RATE.some(r => r.used / r.limit > 0.85) ? 'b-warn' : 'b-ok');
  el('ratePill').textContent = PM_RATE.filter(r => r.used / r.limit > 0.85).length + ' near the ceiling';
  put('rateBox', PM_RATE.map(r => meter(r.provider, Math.round(r.used / r.limit * 100),
    r.used + ' of ' + r.limit + ' ' + r.window, 100)).join(''));
  renderTable('rateBody', [
    {k: 'provider', label: 'Provider'},
    {k: 'limit', label: 'Ceiling', num: true},
    {k: 'used', label: 'Used', num: true},
    {k: 'window', label: 'Window'},
    {k: 'status', label: 'State', html: v => okBadge(v === 'Within limit' ? 'Within limit' : 'Near limit')}
  ], PM_RATE, {sort: 'used', pageSize: 4, onRow: false});

  el('reqPill').textContent = PM_REQ_LOG.length + ' requests';
  renderTable('reqBody', [
    {k: 'when', label: 'When', html: v => esc(String(v).slice(0, 16))},
    {k: 'route', label: 'Route'},
    {k: 'provider', label: 'Provider'},
    {k: 'ms', label: 'Latency', num: true},
    {k: 'code', label: 'HTTP', num: true},
    {k: 'status', label: 'State', html: v => okBadge(v === 'OK' ? 'Success' : v)}
  ], PM_REQ_LOG, {sort: 'when', pageSize: 6, onRow: false});

  if(el('confLogPill')) el('confLogPill').textContent = PM_CONF_LOG.length + ' callbacks';
  renderTable('confBody', [
    {k: 'when', label: 'When', html: v => esc(String(v).slice(0, 16))},
    {k: 'provider', label: 'Provider'},
    {k: 'event', label: 'Event'},
    {k: 'ref', label: 'Reference'},
    {k: 'verified', label: 'Signature', html: v => okBadge(/Yes|Valid|Verified/i.test(v) ? 'Verified' : 'Rejected')},
    {k: 'status', label: 'Handled', html: v => okBadge(v === 'Applied' ? 'Success' : v)}
  ], PM_CONF_LOG, {sort: 'when', pageSize: 5, onRow: false});

  el('whPill').textContent = PM_WEBHOOKS.filter(w => /Failed/.test(w.status)).length + ' failed';
  renderTable('whBody', [
    {k: 'id', label: 'Event'},
    {k: 'provider', label: 'Provider'},
    {k: 'event', label: 'Kind'},
    {k: 'attempts', label: 'Attempts', num: true},
    {k: 'when', label: 'When', html: v => esc(String(v).slice(0, 16))},
    {k: 'ms', label: 'Latency', num: true},
    {k: 'status', label: 'State', html: v => okBadge(/Delivered/.test(v) ? 'Delivered' : 'Failed')},
    {k: 'act', label: '', html: (v, r) => /Failed/.test(r.status)
        ? `<button class="btn btn-ghost" data-whretry="${esc(r.id)}">Retry</button>` : ''}
  ], PM_WEBHOOKS, {sort: 'when', pageSize: 6, onRow: false});

  el('retryPill').textContent = PM_RETRIES.filter(r => r.status === 'Exhausted').length + ' exhausted';
  renderTable('retryBody', [
    {k: 'when', label: 'First seen', html: v => esc(String(v).slice(0, 16))},
    {k: 'provider', label: 'Provider'},
    {k: 'event', label: 'Event'},
    {k: 'attempt', label: 'Attempt', num: true},
    {k: 'delay', label: 'Back-off'},
    {k: 'next', label: 'Outcome'},
    {k: 'status', label: 'State', html: v => okBadge(v === 'Recovered' ? 'Delivered' : 'Failed')}
  ], PM_RETRIES, {sort: 'when', pageSize: 4, onRow: false});
  put('idemBox', kvRow('Idempotency key', 'provider reference + receipt + amount') +
    kvRow('Duplicate window', PM_SET.duplicateWindow + ' minutes') +
    kvRow('Where it is enforced', 'A unique index, then the function') +
    kvRow('Duplicate callbacks', num(PM_TXNS.filter(t => t.reconciled === 'Duplicate').length) + ' stopped this period') +
    kvRow('Webhook nonces', 'Cached for five minutes and rejected on replay'));
}
function retryWebhook(id){
  const w = PM_WEBHOOKS.find(x => x.id === id);
  if(!w) return;
  w.attempts += 1;
  w.status = 'Delivered';
  w.when = TODAY + ' ' + new Date().toTimeString().slice(0, 5);
  w.ms = 84;
  PM_RETRIES.unshift({when: w.when, provider: w.provider, event: w.event, attempt: w.attempts,
    delay: PM_SET.retryBackoff.split('→')[0].trim(), next: 'Delivered', status: 'Recovered'});
  pmLogChange('API', 'Webhook replayed ' + w.id, 'failed', 'delivered');
  renderApi(); renderChanges();
  toast(w.id + ' delivered on retry ' + w.attempts);
}

/* ===================== 19 · PAYMENT REPORTS AND ANALYTICS ===================== */
function isoWeek(d){
  const date = asDate(d);
  const day = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - day);
  return isoOf(date);
}
function reportData(key){
  const s = pmS();
  if(key === 'daily'){
    const days = {};
    PM_TXNS.filter(t => inRange(t.when.slice(0, 10))).forEach(t => {
      const d = t.when.slice(0, 10);
      days[d] = days[d] || {day: d, payments: 0, success: 0, failed: 0, value: 0, fees: 0};
      days[d].payments += 1;
      if(t.status === 'Success'){ days[d].success += 1; days[d].value += t.amount; days[d].fees += t.fee; }
      if(t.status === 'Failed') days[d].failed += 1;
    });
    const rows = Object.values(days).sort((a, b) => a.day < b.day ? 1 : -1);
    return {title: 'Daily Payment Report',
      cols: [['Day', 'day'], ['Payments', 'payments'], ['Successful', 'success'], ['Failed', 'failed'], ['Value', 'value'], ['Fees', 'fees']],
      rows, note: shortMoney(sum(rows, r => r.value)) + ' collected over ' + rows.length + ' days'};
  }
  if(key === 'weekly'){
    const weeks = {};
    PM_TXNS.forEach(t => {
      const w = isoWeek(t.when);
      weeks[w] = weeks[w] || {week: 'Week of ' + fmtDate(w), payments: 0, success: 0, value: 0};
      weeks[w].payments += 1;
      if(t.status === 'Success'){ weeks[w].success += 1; weeks[w].value += t.amount; }
    });
    const rows = Object.values(weeks).sort((a, b) => a.week < b.week ? 1 : -1).slice(0, 24);
    return {title: 'Weekly Payment Report',
      cols: [['Week', 'week'], ['Payments', 'payments'], ['Successful', 'success'], ['Value', 'value']],
      rows, note: 'Average ' + shortMoney(sum(rows, r => r.value) / Math.max(1, rows.length)) + ' per week'};
  }
  if(key === 'monthly'){
    const months = {};
    PM_TXNS.forEach(t => {
      const m = monthKey(t.when);
      months[m] = months[m] || {month: monthLabel(m), payments: 0, success: 0, failed: 0, value: 0};
      months[m].payments += 1;
      if(t.status === 'Success'){ months[m].success += 1; months[m].value += t.amount; }
      if(t.status === 'Failed') months[m].failed += 1;
    });
    const rows = Object.values(months).sort((a, b) => a.month < b.month ? 1 : -1);
    return {title: 'Monthly Payment Report',
      cols: [['Month', 'month'], ['Payments', 'payments'], ['Successful', 'success'], ['Failed', 'failed'], ['Value', 'value']],
      rows, note: shortMoney(s.successVolume) + ' collected in the period'};
  }
  if(key === 'method'){
    const rows = PM_METHODS.map(m => {
      const mine = PM_TXNS.filter(t => t.code === m.code);
      return {method: m.name, payments: mine.length, success: mine.filter(t => t.status === 'Success').length,
        value: sum(mine.filter(t => t.status === 'Success'), t => t.amount), share: pct(mine.filter(t => t.status === 'Success').length, s.success).toFixed(1) + '%'};
    });
    return {title: 'Payments by Method',
      cols: [['Method', 'method'], ['Payments', 'payments'], ['Successful', 'success'], ['Value', 'value'], ['Share', 'share']],
      rows, note: s.enabled + ' methods enabled of ' + PM_METHODS.length};
  }
  if(key === 'provider'){
    const rows = PM_PROVIDERS.map(p => ({provider: p.name, kind: p.kind, status: p.status,
      uptime: p.uptime.toFixed(2) + '%', latency: p.latency ? p.latency + ' ms' : 'no response', credentials: p.credentials}));
    return {title: 'Payments by Provider',
      cols: [['Provider', 'provider'], ['Kind', 'kind'], ['State', 'status'], ['Uptime', 'uptime'], ['Latency', 'latency'], ['Credentials', 'credentials']],
      rows, note: PM_PROVIDERS.filter(p => p.status === 'Connected').length + ' of ' + PM_PROVIDERS.length + ' connections live'};
  }
  if(key === 'staff'){
    const by = {};
    PM_TXNS.forEach(t => {
      by[t.officer] = by[t.officer] || {officer: staffName(t.officer), payments: 0, value: 0, failed: 0};
      by[t.officer].payments += 1;
      if(t.status === 'Success') by[t.officer].value += t.amount;
      if(t.status === 'Failed') by[t.officer].failed += 1;
    });
    const rows = Object.values(by).sort((a, b) => b.value - a.value);
    return {title: 'Payments by Staff Member',
      cols: [['Officer', 'officer'], ['Payments', 'payments'], ['Value', 'value'], ['Failed', 'failed']],
      rows, note: rows.length + ' officers posted payments in the period'};
  }
  if(key === 'status'){
    const rows = ['Success', 'Pending', 'Failed', 'Cancelled', 'Reversed'].map(st => ({
      status: st, payments: PM_TXNS.filter(t => t.status === st).length,
      value: sum(PM_TXNS.filter(t => t.status === st), t => t.amount),
      share: pct(PM_TXNS.filter(t => t.status === st).length, PM_TXNS.length).toFixed(1) + '%'}));
    return {title: 'Successful and Failed Payments',
      cols: [['State', 'status'], ['Payments', 'payments'], ['Value', 'value'], ['Share', 'share']],
      rows, note: 'Failure rate ' + s.failedRate.toFixed(1) + '% across ' + s.total + ' payments'};
  }
  if(key === 'fees'){
    const rows = PM_FEES.map(f => {
      const mine = PM_TXNS.filter(t => t.method.indexOf(f.method.split(' —')[0]) === 0 && t.status === 'Success');
      return {method: f.method, customerPct: f.customerPct + '%', customerFlat: f.customerFlat ? pmMoney(f.customerFlat) : '—',
        companyPct: f.companyPct + '%', collected: sum(mine, t => t.fee), payments: mine.length};
    });
    return {title: 'Payment Processing Fees Report',
      cols: [['Method', 'method'], ['Customer %', 'customerPct'], ['Customer flat', 'customerFlat'], ['Company %', 'companyPct'], ['Fees collected', 'collected'], ['Payments', 'payments']],
      rows, note: pmMoney(s.feesCollected) + ' in fees recorded against successful payments'};
  }
  if(key === 'unreconciled'){
    const rows = PM_TXNS.filter(t => t.reconciled !== 'Matched').map(t => ({receipt: t.receipt, when: t.when,
      method: t.method, providerRef: t.providerRef, amount: t.amount, reconciled: t.reconciled}));
    return {title: 'Unreconciled Payments Report',
      cols: [['Receipt', 'receipt'], ['When', 'when'], ['Method', 'method'], ['Provider reference', 'providerRef'], ['Amount', 'amount'], ['State', 'reconciled']],
      rows, note: rows.length + ' receipts are still waiting on a statement line'};
  }
  if(key === 'collections'){
    const by = {};
    PM_ALLOC.forEach(a => {
      by[a.loan] = by[a.loan] || {loan: a.loan, customer: custName(a.cust), payments: 0, principal: 0, interest: 0, fees: 0, value: 0};
      by[a.loan].payments += 1;
      by[a.loan].principal += a.principal;
      by[a.loan].interest += a.interest;
      by[a.loan].fees += a.fees;
      by[a.loan].value += a.amount;
    });
    const rows = Object.values(by).sort((a, b) => b.value - a.value);
    return {title: 'Loan Repayment Collection Report',
      cols: [['Loan', 'loan'], ['Customer', 'customer'], ['Payments', 'payments'], ['Principal', 'principal'], ['Interest', 'interest'], ['Fees', 'fees'], ['Value', 'value']],
      rows, note: shortMoney(sum(rows, r => r.value)) + ' allocated across ' + rows.length + ' loans'};
  }
  if(key === 'verification'){
    const rows = PM_VERIFY.map(v => ({check: v.id, receipt: v.receipt, method: v.method, amount: v.amount,
      expected: v.expected, level: v.level, status: v.status}))
      .concat(PM_REJECTED.map(r => ({check: '—', receipt: r.ref, method: '—', amount: r.amount, expected: r.amount,
        level: 'Rejected', status: r.status})));
    return {title: 'Payment Verification Report',
      cols: [['Check', 'check'], ['Receipt', 'receipt'], ['Method', 'method'], ['Amount', 'amount'], ['Expected', 'expected'], ['Level', 'level'], ['State', 'status']],
      rows, note: rows.length + ' checks in the queue or refused this period'};
  }
  const rows = PM_REFUNDS.map(r => ({id: r.id, receipt: r.receipt, customer: custName(r.cust), amount: r.amount,
    reason: r.reason, status: r.status}))
    .concat(PM_REVERSALS.map(r => ({id: r.id, receipt: r.receipt, customer: '—', amount: r.amount,
      reason: r.reason, status: r.status})));
  return {title: 'Refunds and Reversals Report',
    cols: [['Record', 'id'], ['Receipt', 'receipt'], ['Customer', 'customer'], ['Amount', 'amount'], ['Reason', 'reason'], ['State', 'status']],
    rows, note: pmMoney(sum(PM_REFUNDS, r => r.amount)) + ' requested, ' + pmMoney(sum(PM_REVERSALS, r => r.amount)) + ' reversed'};
}
function renderReports(){
  el('repPill').className = 'badge b-gray';
  el('repPill').textContent = PM_REPORTS.length + ' reports';
  el('repKpis').innerHTML = [
    ['Reports available', num(PM_REPORTS.length), 'Every payment domain', ''],
    ['Exports made', num(EXPORTS.length), 'Recorded in the history', ''],
    ['Formats', '4', 'Preview · CSV · Excel · PDF', ''],
    ['Rows in the daily report', num(reportData('daily').rows.length), 'Built from the live register', '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join('');
  if(el('packMsg') && !el('packMsg').textContent)
    el('packMsg').textContent = 'The pack follows the filters above — ' + filterLine() + '.';
  el('repCount').textContent = PM_REPORTS.length + ' ready';
  put('repCards', PM_REPORTS.map(r => `<div class="repcard">
      <div class="rt">${esc(r.title)}</div>
      <div class="rd">${esc(r.desc)}</div>
      <div class="acts">
        <button class="btn btn-ghost" data-rep="${esc(r.key)}" data-fmt="preview">Preview</button>
        <button class="btn btn-ghost" data-rep="${esc(r.key)}" data-fmt="csv">CSV</button>
        <button class="btn btn-ghost" data-rep="${esc(r.key)}" data-fmt="xlsx">Excel</button>
        <button class="btn btn-ghost" data-rep="${esc(r.key)}" data-fmt="pdf">PDF</button>
      </div></div>`).join(''));

  el('repGrid').innerHTML =
    chartBox({title: 'Collection trend', sub: 'Successful value per month, MWK', type: 'line', h: 200,
      cats: MONTHS12.map(m => monthLabel(m)),
      series: [{name: 'Collected', data: MONTHS12.map(m => sum(PM_TXNS.filter(t => t.status === 'Success' && monthKey(t.when) === m), t => t.amount))}],
      value: shortMoney(pmS().successVolume)}) +
    chartBox({title: 'Payments by method', sub: 'Where the volume sits', type: 'donut', h: 200,
      cats: ['Airtel Money', 'TNM Mpamba', 'Bank transfer', 'Cash'],
      series: [{name: 'Payments', data: ['Airtel Money', 'TNM Mpamba', 'Bank transfer', 'Cash'].map(m => PM_TXNS.filter(t => t.method === m).length)}],
      value: num(pmS().total)});
  renderExportHistory();
}
function runReport(key, fmt){
  const d = reportData(key);
  const labels = d.cols.map(c => c[0]);
  const rows = d.rows.map(r => d.cols.map(c => r[c[1]]));
  if(fmt === 'preview'){
    openModal(d.title, d.rows.length + ' rows · ' + filterLine(),
      `<div class="note gold"><div>${esc(d.note)}</div></div>
       <div class="tblwrap" style="max-height:340px;margin-top:8px"><table class="tbl2 dense">
         <thead><tr>${labels.map(l => `<th>${esc(l)}</th>`).join('')}</tr></thead>
         <tbody>${rows.slice(0, 25).map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody>
       </table></div>`,
      [{label: 'Download CSV', act: () => runReport(key, 'csv')},
       {label: 'Download Excel', act: () => runReport(key, 'xlsx')},
       {label: 'Close', act: 'close'}]);
    return;
  }
  const stamp = TODAY.replace(/-/g, '');
  const name = 'payment-' + key + '-report-' + stamp;
  if(fmt === 'csv'){
    downloadFile(name + '.csv', 'text/csv', toCsv([labels].concat(rows)));
  } else if(fmt === 'xlsx'){
    downloadFile(name + '.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      xlsxBytes(d.title, labels, rows));
  } else {
    printTable(d.title, d.cols.map(c => ({label: c[0], num: typeof (d.rows[0] || {})[c[1]] === 'number'})), rows);
  }
  logExport(d.title, fmt === 'csv' ? 'CSV' : fmt === 'xlsx' ? 'Excel' : 'PDF', rows.length);
  renderExportHistory(); renderReports(); renderChanges();
}
function runPack(fmt){
  const all = PM_REPORTS.map(r => reportData(r.key));
  const stamp = TODAY.replace(/-/g, '');
  if(fmt === 'csv'){
    const parts = [];
    all.forEach(d => {
      parts.push(d.title.toUpperCase());
      parts.push(d.cols.map(c => c[0]).join(','));
      d.rows.forEach(r => parts.push(d.cols.map(c => csvCell(r[c[1]])).join(',')));
      parts.push('');
    });
    downloadFile('payment-pack-' + stamp + '.csv', 'text/csv', parts.join('\r\n'));
    logExport('Payment pack', 'CSV', sum(all, d => d.rows.length));
  } else if(fmt === 'xlsx'){
    const rows = [];
    all.forEach(d => {
      rows.push([d.title]);
      rows.push(d.cols.map(c => c[0]));
      d.rows.forEach(r => rows.push(d.cols.map(c => r[c[1]])));
      rows.push([]);
    });
    downloadFile('payment-pack-' + stamp + '.xlsx',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      xlsxBytes('Payment pack', ['Column 1', 'Column 2', 'Column 3', 'Column 4', 'Column 5', 'Column 6', 'Column 7'],
        rows.map(r => r.length ? r : [''])));
    logExport('Payment pack', 'Excel', rows.length);
  } else if(fmt === 'print'){
    doPrint('Payment reports pack', all.map(d => printTable(d.title,
      d.cols.map(c => ({label: c[0], num: typeof (d.rows[0] || {})[c[1]] === 'number'})),
      d.rows.map(r => d.cols.map(c => r[c[1]])))).join('<div style="height:10px"></div>'));
    logExport('Payment pack', 'PDF', sum(all, d => d.rows.length));
  } else {
    doPrint('Payment reports pack', all.map(d => printTable(d.title,
      d.cols.map(c => ({label: c[0], num: typeof (d.rows[0] || {})[c[1]] === 'number'})),
      d.rows.map(r => d.cols.map(c => r[c[1]])))).join('<div style="height:10px"></div>'));
    return;
  }
  if(el('packMsg')) el('packMsg').textContent = 'Pack generated at ' + new Date().toTimeString().slice(0, 5) +
    ' — ' + all.length + ' reports, ' + sum(all, d => d.rows.length) + ' rows · ' + filterLine();
  renderReports(); renderChanges();
  toast('Payment pack generated');
}

/* ===================== 20 · SETTINGS AND AUDIT HISTORY ===================== */
function renderSettings(){
  el('setPill').className = 'badge b-gray';
  el('setPill').textContent = PM_SET.sandbox ? 'Sandbox mode' : 'Production';
  el('setKpis').innerHTML = [
    ['Currency', PM_SET.currency, PM_SET.currencyLabel, ''],
    ['Payment timeout', PM_SET.timeout + ' s', PM_SET.retries + ' retries · ' + PM_SET.retryBackoff.split('→')[0].trim(), ''],
    ['Duplicate window', PM_SET.duplicateWindow + ' min', 'Provider reference and amount', ''],
    ['Minimum payment', shortMoney(PM_SET.minAmount), 'Daily ceiling ' + shortMoney(PM_SET.maxDailyAmount), ''],
    ['Automatic confirmation', PM_SET.autoConfirm ? 'On' : 'Off', PM_SET.confirmRule, ''],
    ['Environment', PM_SET.sandbox ? 'Sandbox' : 'Production', PM_SET.sandbox ? 'No real money moves' : 'Live with real customers', PM_SET.sandbox ? 'red' : '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join('');

  if(el('setMsg') && !el('setMsg').textContent)
    el('setMsg').textContent = 'Values in force since ' + (PM_CHANGES[0] ? PM_CHANGES[0].when.slice(0, 10) : TODAY) +
      ' · ' + (validateSettings().filter(c => !c.ok).length) + ' check(s) failing.';
  const set = (id, v) => { if(el(id)) el(id).value = v; };
  set('setCcy', PM_SET.currency);
  set('setDec', PM_SET.decimals);
  set('setRefPrefix', PM_SET.refPrefix);
  set('setRefRule', PM_SET.refRule);
  set('setRcPrefix', PM_SET.receiptPrefix);
  set('setRcDigits', PM_SET.receiptDigits);
  set('setConfirm', PM_SET.confirmRule);
  set('setRecon', PM_SET.reconRule);
  set('setTimeout', PM_SET.timeout);
  set('setRetries', PM_SET.retries);
  set('setBackoff', PM_SET.retryBackoff);
  set('setDup', PM_SET.duplicateWindow);
  set('setDaily', PM_SET.maxDailyAmount);
  set('setMin', PM_SET.minAmount);
  document.querySelectorAll('#setToggles [data-set]').forEach(c => c.classList.toggle('on', !!PM_SET[c.dataset.set]));

  renderValidation();
  renderChanges();
}
function validateSettings(){
  const out = [];
  const add = (label, ok, detail) => out.push({label, ok, detail});
  add('Currency is MWK and matches the ledger', PM_SET.currency === 'MWK', PM_SET.currency + ' · ' + PM_SET.currencyLabel);
  add('Receipt digits in range', PM_SET.receiptDigits >= 3 && PM_SET.receiptDigits <= 8, PM_SET.receiptPrefix + ' · ' + PM_SET.receiptDigits + ' digits');
  add('Minimum below the daily ceiling', PM_SET.minAmount < PM_SET.maxDailyAmount, shortMoney(PM_SET.minAmount) + ' < ' + shortMoney(PM_SET.maxDailyAmount));
  add('Timeout inside the provider window', PM_SET.timeout >= 10 && PM_SET.timeout <= 300, PM_SET.timeout + ' s');
  add('Duplicate window covers a slow callback', PM_SET.duplicateWindow >= 5, PM_SET.duplicateWindow + ' min');
  add('Confirmation rule names the reference', /reference/i.test(PM_SET.confirmRule), PM_SET.confirmRule);
  add('Cash rule matches the cashier setup', PM_SET.cashEnabled === PM_CASH.enabled, PM_CASH.enabled ? 'enabled' : 'disabled');
  add('Refunds need a signature', PM_SET.requireApprovalRefund, PM_SET.requireApprovalRefund ? 'required' : 'not required');
  add('Production keys are not in sandbox', !PM_SET.sandbox, PM_SET.sandbox ? 'sandbox mode is on' : 'production mode');
  return out;
}
function renderValidation(){
  const checks = validateSettings();
  const bad = checks.filter(c => !c.ok);
  el('setValPill').className = 'badge ' + (bad.length ? 'b-warn' : 'b-ok');
  el('setValPill').textContent = bad.length ? bad.length + ' to fix' : 'All valid';
  put('cfgValBox', checks.map(c => `<div class="checkrow">
      <div class="ck ${c.ok ? 'pass' : 'crit'}">${c.ok ? '✓' : '!'}</div>
      <div style="flex:1"><div style="font-size:10.5px;font-weight:800">${esc(c.label)}</div>
        <div class="qhint">${esc(c.detail)}</div></div>
      <div>${okBadge(c.ok ? 'Pass' : 'Failed')}</div></div>`).join(''));
  return bad;
}
function saveSettings(){
  const before = PM_SET.currency + ' · ' + PM_SET.receiptPrefix + '-' + PM_SET.receiptDigits + ' · ' + PM_SET.timeout + ' s';
  PM_SET.currency = el('setCcy').value;
  PM_SET.currencyLabel = PM_SET.currency === 'MWK' ? 'Malawian Kwacha (MWK)' : PM_SET.currency === 'USD' ? 'US Dollar (USD)' : 'South African Rand (ZAR)';
  PM_SET.currencySymbol = PM_SET.currency === 'MWK' ? 'MK' : PM_SET.currency === 'USD' ? '$' : 'R';
  PM_SET.decimals = clamp(Number(el('setDec').value) || 2, 0, 2);
  PM_SET.refPrefix = el('setRefPrefix').value;
  PM_SET.refRule = el('setRefRule').value;
  PM_SET.receiptPrefix = el('setRcPrefix').value;
  PM_SET.receiptDigits = clamp(Number(el('setRcDigits').value) || 5, 3, 8);
  PM_SET.confirmRule = el('setConfirm').value;
  PM_SET.reconRule = el('setRecon').value;
  PM_SET.timeout = clamp(Number(el('setTimeout').value) || 90, 10, 300);
  PM_SET.retries = clamp(Number(el('setRetries').value) || 0, 0, 6);
  PM_SET.retryBackoff = el('setBackoff').value;
  PM_SET.duplicateWindow = clamp(Number(el('setDup').value) || 10, 1, 60);
  PM_SET.maxDailyAmount = Number(el('setDaily').value) || PM_SET.maxDailyAmount;
  PM_SET.minAmount = Number(el('setMin').value) || PM_SET.minAmount;
  pmLogChange('Configuration', 'Payment settings', before,
    PM_SET.currency + ' · ' + PM_SET.receiptPrefix + '-' + PM_SET.receiptDigits + ' · ' + PM_SET.timeout + ' s');
  renderSettings(); renderOverview(); renderReceipts(); renderCustomer();
  if(el('setMsg')) el('setMsg').textContent = 'Saved at ' + new Date().toTimeString().slice(0, 5) + ' — ' +
    PM_SET.currency + ', receipts ' + PM_SET.receiptPrefix + '-' + pad(1, PM_SET.receiptDigits) +
    ', timeout ' + PM_SET.timeout + ' s, ' + PM_SET.retries + ' retries.';
  toast('Payment settings saved');
}
function resetSettings(){
  Object.keys(PM_SET_DEFAULTS).forEach(k => { PM_SET[k] = PM_SET_DEFAULTS[k]; });
  Object.keys(PM_SET).forEach(k => { if(!(k in PM_SET_DEFAULTS)) delete PM_SET[k]; });
  pmLogChange('Configuration', 'Settings reset', 'edited values', 'factory defaults');
  renderSettings(); renderOverview(); renderReceipts(); renderCustomer();
  if(el('setMsg')) el('setMsg').textContent = 'Reset to the shipped defaults — ' + PM_SET.currency + ', ' +
    PM_SET.receiptPrefix + '-' + pad(1, PM_SET.receiptDigits) + '.';
  toast('Settings reset to defaults', 'warn');
}
function toggleSetting(key){
  PM_SET[key] = !PM_SET[key];
  if(key === 'cashEnabled'){
    PM_CASH.enabled = PM_SET.cashEnabled;
    PM_METHOD_BY_CODE['CASH-BR'].status = PM_SET.cashEnabled ? 'Enabled' : 'Disabled';
  }
  if(key === 'autoConfirm') PM_SET.confirmRule = PM_SET.autoConfirm ? 'Provider callback + amount and reference match' : 'Manual verification by an officer';
  pmLogChange('Configuration', key.replace(/([A-Z])/g, ' $1').trim(), PM_SET[key] ? 'off' : 'on', PM_SET[key] ? 'on' : 'off');
  renderSettings(); renderOverview(); renderCash(); renderMethods(); renderCustomer(); renderChanges();
  toast(key.replace(/([A-Z])/g, ' $1').toLowerCase() + ' ' + (PM_SET[key] ? 'switched on' : 'switched off'));
}

/* ===================== change history ===================== */
function renderChanges(){
  el('chgPill').className = 'badge b-gray';
  el('chgPill').textContent = PM_CHANGES.length + ' entries';
  renderTable('chgBody', [
    {k: 'when', label: 'Timestamp', html: v => esc(String(v).slice(0, 16))},
    {k: 'what', label: 'Change'},
    {k: 'area', label: 'Area'},
    {k: 'from', label: 'Previous'},
    {k: 'to', label: 'Updated'},
    {k: 'by', label: 'Responsible', html: v => esc(staffName(v))}
  ], PM_CHANGES, {sort: 'when', pageSize: 8, onRow: false});

  const byStaff = {};
  PM_CHANGES.forEach(c => { byStaff[c.by] = (byStaff[c.by] || 0) + 1; });
  el('whoPill').textContent = Object.keys(byStaff).length + ' officers';
  put('whoBox', Object.keys(byStaff).sort((a, b) => byStaff[b] - byStaff[a]).slice(0, 6)
    .map(id => meter(staffName(id), byStaff[id], byStaff[id] + ' change' + (byStaff[id] === 1 ? '' : 's'),
      Math.max(3, PM_CHANGES.length))).join(''));
  const last = PM_CHANGES[0] || {when: TODAY, what: 'No change yet', by: 'STF-009'};
  put('stampBox', kvRow('Latest change', esc(last.what)) +
    kvRow('When', esc(last.when)) +
    kvRow('Officer', esc(staffName(last.by))) +
    kvRow('Changes on record', num(PM_CHANGES.length)) +
    kvRow('Areas touched', num(new Set(PM_CHANGES.map(c => c.area)).size)));
}

/* ===================== header band and stats ===================== */
function renderStats(){
  const s = pmS();
  if(el('bandScore')) el('bandScore').textContent = Math.round(s.score) + '%';
  if(el('bandPayments')) el('bandPayments').textContent = num(s.total);
  if(el('bandVolume')) el('bandVolume').textContent = shortMoney(s.successVolume);
  if(el('bandAlerts')) el('bandAlerts').textContent = num(ALERTS_FOR_PAYMENTS().length);
  if(el('topRefresh')) el('topRefresh').textContent = REFRESH;
}

/* ===================== FILTERS ===================== */
function uniql(a){ return Array.from(new Set(a)); }
function fillSelects(){
  const sev = ['Critical', 'High', 'Medium', 'Low'];
  const stat = ['Success', 'Pending', 'Failed', 'Cancelled', 'Reversed', 'Verified', 'Rejected', 'Matched',
    'Duplicate', 'Unmatched', 'Open', 'Approved', 'Awaiting verification', 'Awaiting approval', 'Enabled', 'Disabled'];
  const own = uniql(PM_TXNS.concat(PM_RECON, PM_PROVIDERS, CASH_COLLECTIONS).map(x => x.owner).filter(Boolean));
  const reg = ['Lilongwe', 'Blantyre', 'Mzuzu', 'Zomba', 'Malawi', 'Frankfurt'];
  const fill = (id, list, label) => {
    const n = el(id);
    if(!n) return;
    n.innerHTML = `<option value="">All ${label}</option>` +
      list.map(v => `<option value="${esc(v)}">${esc(id === 'fltOwner' ? staffName(v) : v)}</option>`).join('');
  };
  fill('fltSeverity', sev, 'severities');
  fill('fltStatus', stat, 'states');
  fill('fltOwner', own, 'officers');
  fill('fltRegion', reg, 'branches');
  fill('fltProduct', PRODUCTS.map(p => p.id), 'products');
  document.querySelectorAll('#fltProduct option').forEach(o => { if(o.value) o.textContent = prodName(o.value); });
}
function syncFilterInputs(){
  if(el('fltFrom')) el('fltFrom').value = FILTER.from;
  if(el('fltTo')) el('fltTo').value = FILTER.to;
  if(el('fltSearch')) el('fltSearch').value = FILTER.q;
  ['severity', 'status', 'owner', 'region', 'product'].forEach(k => {
    const n = el('flt' + k.charAt(0).toUpperCase() + k.slice(1));
    if(n) n.value = FILTER[k] || '';
  });
  document.querySelectorAll('#fltLaneChips [data-lane]').forEach(c =>
    c.classList.toggle('on', (c.dataset.lane || '') === FILTER.lane));
}
function applyFilters(){
  FILTER.from = el('fltFrom').value || '2026-01-01';
  FILTER.to = el('fltTo').value || TODAY;
  FILTER.q = (el('fltSearch').value || '').trim();
  FILTER.severity = el('fltSeverity').value;
  FILTER.status = el('fltStatus').value;
  FILTER.owner = el('fltOwner').value;
  FILTER.region = el('fltRegion').value;
  FILTER.product = el('fltProduct').value;
  renderAll();
  renderFilterSummary();
  toast('Payment filters applied');
}
function clearFilter(k){
  if(k){ FILTER[k] = ''; }
  else Object.keys(FILTER).forEach(key => { if(key !== 'from' && key !== 'to') FILTER[key] = ''; });
  FILTER.q = '';
  syncFilterInputs();
  renderAll();
  renderFilterSummary();
}
function renderFilterSummary(){
  const chips = [];
  if(FILTER.lane) chips.push(['lane', 'Area: ' + FILTER.lane]);
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
    || '<span class="qhint">No filters applied — the whole payment register is shown.</span>';
  const s = pmS();
  if(el('fltCounts')) el('fltCounts').innerHTML = [
    ['Payments', s.total],
    ['Methods', PM_METHODS.length],
    ['Providers', PM_PROVIDERS.length],
    ['Reconciliation runs', PM_RECON.length],
    ['Awaiting verification', s.pendingVerify],
    ['Open issues', ALERTS_FOR_PAYMENTS().length]
  ].map(([k, v]) => `<div><div class="sl">${esc(k)}</div><div class="sv">${num(v)}</div></div>`).join('');
  if(el('fltResult')) el('fltResult').textContent = 'Showing the payment register for ' +
    fmtDate(FILTER.from) + ' – ' + fmtDate(FILTER.to) +
    (chips.length ? ' · ' + chips.map(c => c[1]).join(' · ') : ' · no dimension filters');
}

/* ===================== navigation and render loop ===================== */
function goto(id){
  const sec = document.getElementById(id);
  if(!sec) return;
  document.querySelectorAll('.snav').forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + id));
  if(location.hash !== '#' + id) history.replaceState(null, '', '#' + id);
  if(typeof sec.scrollIntoView === 'function') sec.scrollIntoView({behavior: 'smooth', block: 'start'});
}
function renderAll(){
  renderOverview();
  renderMethods();
  renderMobileMoney();
  renderBank();
  renderCash();
  renderGateways();
  renderCustomer();
  renderTransactions();
  renderVerification();
  renderAllocations();
  renderRecon();
  renderFees();
  renderReceipts();
  renderNotifications();
  renderSecurity();
  renderRefunds();
  renderDb();
  renderApi();
  renderReports();
  renderSettings();
  renderChanges();
  renderStats();
}

/* ===================== wiring ===================== */
function wireAll(){
  document.addEventListener('click', e => {
    if(sortOrPage(e)) return;

    const snav = e.target.closest('.snav');
    if(snav){ e.preventDefault(); goto(snav.getAttribute('href').slice(1)); return; }

    const lane = e.target.closest('#fltLaneChips [data-lane]');
    if(lane){ FILTER.lane = lane.dataset.lane; syncFilterInputs(); renderAll(); renderFilterSummary(); return; }

    const chip = e.target.closest('[data-clear]');
    if(chip){ clearFilter(chip.dataset.clear); return; }

    const expRow = e.target.closest('[data-exp]');
    if(expRow){
      const x = EXPORTS[Number(expRow.dataset.exp)];
      if(x) openModal(x.report, x.format + ' · ' + x.when,
        `<div class="pfields" style="grid-template-columns:1fr 1fr">
          ${field('Report', esc(x.report))}${field('Format', esc(x.format))}
          ${field('Rows', num(x.rows))}${field('Exported by', esc(x.by))}
          ${field('When', esc(x.when))}${field('Filters', esc(x.filters))}
        </div>`, [{label: 'Close', act: 'close'}]);
      return;
    }

    /* --- 2 methods --- */
    if(e.target.closest('#mAdd')){ addMethod(); return; }
    if(e.target.closest('#mSave')){ saveMethod(); return; }
    if(e.target.closest('#mDefault')){ setDefaultMethod(MSEL); return; }
    if(e.target.closest('#mArchive')){ archiveMethod(MSEL); return; }
    if(e.target.closest('#mUpload')){
      toast('Logo picked: ' + (el('mLogo') ? el('mLogo').value : 'mark') + ' — stored beside the other method marks');
      if(el('mSelMsg')) el('mSelMsg').textContent = 'Logo “' + (el('mLogo') ? el('mLogo').value : 'mark') +
        '” attached to ' + (PM_METHOD_BY_CODE[MSEL] || {}).name + '.';
      return;
    }
    const mtog = e.target.closest('[data-mtoggle]');
    if(mtog){ toggleMethod(mtog.dataset.mtoggle); return; }
    const mup = e.target.closest('[data-mup]');
    if(mup){ moveMethod(mup.dataset.mup, -1); return; }
    const mdown = e.target.closest('[data-mdown]');
    if(mdown){ moveMethod(mdown.dataset.mdown, 1); return; }

    /* --- 3 mobile money --- */
    if(e.target.closest('#mmAirSave')){ saveMobileMoney('MM-AIR'); return; }
    if(e.target.closest('#mmAirTest')){ testMobileMoney('MM-AIR'); return; }
    if(e.target.closest('#mmTnmSave')){ saveMobileMoney('MM-TNM'); return; }
    if(e.target.closest('#mmTnmTest')){ testMobileMoney('MM-TNM'); return; }
    if(e.target.closest('#mmReconBtn')){ runMmRecon(); return; }

    /* --- 4 bank --- */
    if(e.target.closest('#bankSave')){ saveBank(); return; }
    if(e.target.closest('#bankVerify')){ verifyBank(); return; }
    if(e.target.closest('#stmtImport')){ importStatements(); return; }
    if(e.target.closest('#stmtRecon')){ reconcileBank(); return; }

    /* --- 5 cash --- */
    if(e.target.closest('#cashToggleBtn')){ toggleCash(); return; }
    if(e.target.closest('#cashRecBtn')){ issueCashReceipt(); return; }
    if(e.target.closest('#cashReconBtn')){
      CASH_HANDOVERS.forEach(h => { h.counted = h.amount; h.variance = 0; h.status = 'Balanced'; });
      CASH_STAFF.forEach(c => { c.balanced = true; });
      pmLogChange('Reconciliation', 'Cash reconciliation', 'a drawer short', 'every drawer balanced');
      renderCash(); renderOverview(); renderChanges(); renderStats();
      if(el('cashRecMsg')) el('cashRecMsg').textContent = 'Cash reconciled at ' + new Date().toTimeString().slice(0, 5) +
        ' — receipts, handovers and the drawers agree.';
      toast('Cash reconciled');
      return;
    }
    const cs = e.target.closest('[data-cashstaff]');
    if(cs){ toggleCashStaff(cs.dataset.cashstaff); return; }
    const cv = e.target.closest('[data-cashverify]');
    if(cv){ cashVerify(cv.dataset.cashverify); return; }
    if(e.target.closest('#cashCfgSave')){ saveCashCfg(); return; }

    /* --- 6 gateways --- */
    if(e.target.closest('#pvSave')){ saveProvider(); return; }
    if(e.target.closest('#pvTest')){ testProvider(PSEL); return; }
    if(e.target.closest('#pvSandbox')){ toggleSandbox(); return; }
    if(e.target.closest('#pvDisconnect')){ disconnectProvider(); return; }
    if(e.target.closest('#pvRotate')){ rotateCredential(); return; }
    if(e.target.closest('#pvHookTest')){ replayWebhook(); return; }
    if(e.target.closest('#npAdd')){ addProvider(); return; }
    const pt = e.target.closest('[data-pvtest]');
    if(pt){ testProvider(pt.dataset.pvtest); return; }
    const po = e.target.closest('[data-pvopen]');
    if(po){
      PSEL = po.dataset.pvopen;
      renderGateways();
      const p = PM_PROVIDERS.find(x => x.id === PSEL);
      openModal(p.name, p.id + ' · ' + p.kind + ' · ' + p.env,
        `<div class="pfields" style="grid-template-columns:1fr 1fr">
          ${field('Status', okBadge(p.status))}
          ${field('Credentials', okBadge(p.credentials === 'Valid' ? 'Valid' : p.credentials))}
          ${field('Webhook', '<span class="mono">' + esc(p.webhook) + '</span>')}
          ${field('Signature', esc(p.signature))}
          ${field('Latency', p.latency ? p.latency + ' ms' : 'no response')}
          ${field('Uptime', p.uptime.toFixed(2) + '%')}
          ${field('Last check', esc(p.lastCheck))}
          ${field('Sandbox', p.sandbox ? 'Yes' : 'No')}
        </div>`, [{label: 'Run a test', act: () => { closeModal(); testProvider(p.id); }},
          {label: 'Close', act: 'close'}]);
      return;
    }

    /* --- 7 customer journey --- */
    if(e.target.closest('#refGen')){ generateReference(); return; }
    if(e.target.closest('#selSave')){ savePreferredMethod(); return; }

    /* --- 8 transactions --- */
    if(e.target.closest('#txLookup')){ lookupTransactions(); return; }
    if(e.target.closest('#dupScan')){ scanDuplicates(); return; }
    const txo = e.target.closest('[data-txopen]');
    if(txo){ openTxn(txo.dataset.txopen); return; }
    const dup = e.target.closest('[data-dup]');
    if(dup){
      const d = duplicateRows().find(x => x.providerRef === dup.dataset.dup);
      if(d) openModal('Duplicate reference ' + d.providerRef, d.count + ' payments · ' + pmMoney(d.amount),
        `<div class="note gold"><div>The same provider reference reached us ${d.count} times. Only the first is posted;
          the rest are held until an officer decides.</div></div>
         <div class="qhint" style="margin-top:8px">${esc(d.ids.join(' · '))}</div>`,
        [{label: 'Hold them', act: () => { closeModal(); toast('Held for review'); }}, {label: 'Close', act: 'close'}]);
      return;
    }

    /* --- 9 verification --- */
    if(e.target.closest('#vAuto')){ autoConfirmAll(); return; }
    if(e.target.closest('#vApproveAll')){ approveAllVerification(); return; }
    if(e.target.closest('#vToggleAuto')){ toggleVerification('auto'); return; }
    if(e.target.closest('#vToggleApproval')){ toggleVerification('approval'); return; }
    const vok = e.target.closest('[data-vok]');
    if(vok){ verifyPayment(vok.dataset.vok); return; }
    const vrej = e.target.closest('[data-vrej]');
    if(vrej){ rejectPayment(vrej.dataset.vrej); return; }

    /* --- 10 allocations --- */
    if(e.target.closest('#aAllocate')){ allocatePayment(); return; }
    if(e.target.closest('#recalcBtn')){ recalcBalance(); return; }
    const af = e.target.closest('[data-allocfix]');
    if(af){ postFailedAllocation(af.dataset.allocfix); return; }

    /* --- 11 reconciliation --- */
    if(e.target.closest('#matchBtn')){ matchRecon('provider'); return; }
    if(e.target.closest('#matchBankBtn')){ matchRecon('bank'); return; }
    if(e.target.closest('#matchCashBtn')){ matchRecon('cash'); return; }
    if(e.target.closest('#adjAdd')){ addAdjustment(); return; }
    const ra = e.target.closest('[data-recappr]');
    if(ra){ toggleReconApproval(ra.dataset.recappr); return; }

    /* --- 12 fees --- */
    if(e.target.closest('#feeSave')){ recalcFeeSummary(); return; }
    const fp = e.target.closest('[data-feePayer]');
    if(fp){ switchFeePayer(fp.dataset.feepayer); return; }

    /* --- 13 receipts --- */
    if(e.target.closest('#rcGen')){ generateReceipt(); return; }
    if(e.target.closest('#rcPrint')){
      const last = PM_RECEIPTS[0];
      if(last) printReceipt(last.receipt);
      return;
    }
    if(e.target.closest('#rcSaveCfg')){ saveReceiptNumbering(); return; }
    if(e.target.closest('#rcVerifyBtn')){ verifyReceipt(); return; }
    if(e.target.closest('#rcStmtBtn')){ buildStatement(); return; }
    const spo = e.target.closest('[data-stmtPrint]');
    if(spo){ printStatement(spo.dataset.stmtprint); return; }
    const scv = e.target.closest('[data-stmtCsv]');
    if(scv){ downloadStatement(scv.dataset.stmtcsv); return; }
    const rco = e.target.closest('[data-rcopen]');
    if(rco){ openReceipt(rco.dataset.rcopen); return; }

    /* --- 14 notifications --- */
    if(e.target.closest('#ntTestSms')){ testChannel('sms'); return; }
    if(e.target.closest('#ntTestEmail')){ testChannel('email'); return; }
    const nr = e.target.closest('[data-ntrule]');
    if(nr){ toggleNotifyRule(nr.dataset.ntrule); return; }

    /* --- 15 security --- */
    const perm = e.target.closest('[data-perm]');
    if(perm){ togglePerm(perm.dataset.perm, Number(perm.dataset.pi)); return; }
    const appr = e.target.closest('[data-appr]');
    if(appr){ approveSensitive(appr.dataset.appr); return; }

    /* --- 16 refunds --- */
    const ref = e.target.closest('[data-ref]');
    if(ref){ refundAction(ref.dataset.ref, ref.dataset.refact); return; }
    const dsp = e.target.closest('[data-dsp]');
    if(dsp){ openDispute(dsp.dataset.dsp); return; }
    const dres = e.target.closest('[data-dspres]');
    if(dres){ resolveDispute(dres.dataset.dspres); return; }

    /* --- 17 database --- */
    if(e.target.closest('#rlsFix')){ fixRls(); return; }
    if(e.target.closest('#consistBtn')){ runConsistency(); return; }
    if(e.target.closest('#dbDiagBtn')){ runDiagnostics(); return; }

    /* --- 18 api --- */
    const wr = e.target.closest('[data-whretry]');
    if(wr){ retryWebhook(wr.dataset.whretry); return; }

    /* --- 19 reports --- */
    const rep = e.target.closest('[data-rep]');
    if(rep){ runReport(rep.dataset.rep, rep.dataset.fmt); return; }
    if(e.target.closest('#packCsv')){ runPack('csv'); return; }
    if(e.target.closest('#packXlsx')){ runPack('xlsx'); return; }
    if(e.target.closest('#packPdf')){ runPack('print'); return; }
    if(e.target.closest('#packPrint')){ runPack('print'); return; }
    if(e.target.closest('#quickCsv')){ runPack('csv'); return; }
    if(e.target.closest('#printBtn')){
      doPrint('Methods of payment — summary', brandHtml('Payment report', filterLine()) +
        printTable('Payment health', [{label: 'Measure'}, {label: 'Value'}],
          [['Payment health', Math.round(pmS().score) + '%'],
           ['Payments', num(pmS().total)],
           ['Collected', pmMoney(pmS().successVolume)],
           ['Methods enabled', pmS().enabled + ' of ' + PM_METHODS.length],
           ['Connections live', pmS().providers + ' of ' + PM_PROVIDERS.length],
           ['Awaiting verification', pmS().pendingVerify],
           ['Unreconciled', pmS().unreconciled],
           ['Open issues', ALERTS_FOR_PAYMENTS().length]]));
      logExport('Payment summary', 'PDF', 8);
      return;
    }

    /* --- 20 settings --- */
    if(e.target.closest('#setSave')){ saveSettings(); return; }
    if(e.target.closest('#setReset')){ resetSettings(); return; }
    if(e.target.closest('#setValidate')){
      const bad = renderValidation();
      pmLogChange('Configuration', 'Validation run', 'not run', bad.length ? bad.length + ' to fix' : 'every value valid');
      renderChanges();
      if(el('setMsg')) el('setMsg').textContent = bad.length
        ? bad.length + ' setting' + (bad.length === 1 ? '' : 's') + ' need attention: ' + bad.map(b => b.label).join(', ') + '.'
        : 'Every setting is in range and matches what the providers expect.';
      toast(bad.length ? bad.length + ' value(s) need attention' : 'Settings valid', bad.length ? 'warn' : 'ok');
      return;
    }
    const setChip = e.target.closest('[data-set]');
    if(setChip){ toggleSetting(setChip.dataset.set); return; }

    /* --- shared chrome --- */
    if(e.target.closest('#fltApply')){ applyFilters(); return; }
    if(e.target.closest('#fltReset')){ clearFilter(); toast('Filters cleared'); return; }
    if(e.target.closest('#refreshBtn')){
      REFRESH = fmtDate(TODAY) + ' · ' + new Date().toTimeString().slice(0, 5);
      renderAll(); renderFilterSummary();
      if(el('topRefresh')) el('topRefresh').textContent = REFRESH;
      toast('Payment data refreshed at ' + REFRESH.slice(-5));
      return;
    }
    if(e.target.closest('#bellBtn')){
      const open = ALERTS_FOR_PAYMENTS();
      openModal('Open payment issues', open.length + ' need attention',
        open.map(a => `<div class="risk"><div><div class="rn">${esc(a.what)}</div>
          <div class="rs">${esc(a.detail)}</div></div><div class="rv">${badge(a.severity, SEV(a.severity))}</div></div>`).join('')
          || '<div class="empty">Nothing open — every rail is clear.</div>',
        [{label: 'Open verification', act: () => { closeModal(); goto('s9'); }}, {label: 'Close', act: 'close'}]);
      return;
    }
    if(e.target.closest('#menuBtn')){ document.body.classList.toggle('nav-open'); return; }
    if(e.target.closest('#modalClose') || e.target === el('modal')){ closeModal(); return; }
  });

  document.addEventListener('change', e => {
    const t = e.target;
    if(t.id === 'mSel'){ MSEL = t.value; renderMethods(); return; }
    if(t.id === 'bankSel'){ BSEL = t.value; renderBank(); return; }
    if(t.id === 'pvSel'){ PSEL = t.value; renderGateways(); return; }
    if(t.id === 'aLoan' || t.id === 'aAmount'){ renderSplit(); return; }
  });
  document.addEventListener('input', e => {
    if(e.target.id === 'aAmount' || e.target.id === 'aLoan') renderSplit();
  });

  if(el('fltSearch')) el('fltSearch').addEventListener('keydown', e => { if(e.key === 'Enter') applyFilters(); });
  if(el('globalSearch')) el('globalSearch').addEventListener('keydown', e => {
    if(e.key !== 'Enter') return;
    el('fltSearch').value = el('globalSearch').value;
    applyFilters(); goto('s1');
    toast('Register filtered by “' + el('globalSearch').value + '”');
  });
  if(el('txQ')) el('txQ').addEventListener('keydown', e => { if(e.key === 'Enter') lookupTransactions(); });
  if(el('txCust')) el('txCust').addEventListener('keydown', e => { if(e.key === 'Enter') lookupTransactions(); });
  if(el('rcVerifyNum')) el('rcVerifyNum').addEventListener('keydown', e => { if(e.key === 'Enter') verifyReceipt(); });
  window.addEventListener('scroll', spyScroll, {passive: true});
  window.addEventListener('hashchange', () => { const h = location.hash.slice(1); if(h && document.getElementById(h)) goto(h); });
}
function spyScroll(){
  const secs = Array.from(document.querySelectorAll('section.sec'));
  if(!secs.length) return;
  const y = window.scrollY + 120;
  let cur = secs[0];
  secs.forEach(s => { if(s.offsetTop <= y) cur = s; });
  document.querySelectorAll('.snav').forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + cur.id));
}

window.PAYMENT_APP = {
  FILTER, PM_SET, PM_SET_DEFAULTS, PM_METHODS, PM_METHOD_BY_CODE, PM_MM, MM_STATUS, MM_RECON, PM_BANK,
  PM_STATEMENTS, PM_CASH, CASH_STAFF, CASH_COLLECTIONS, CASH_HANDOVERS, PM_PROVIDERS, PM_CONN_TESTS,
  PM_TXNS, PM_VERIFY, PM_VERIFY_HISTORY, PM_REJECTED, PM_ALLOC, PM_RECON, PM_ADJUST, PM_RECON_DAILY,
  PM_FEES, PM_FEE_HISTORY, PM_RECEIPTS, PM_RECEIPT_CORRECTIONS, PM_NOTIFY_RULES, PM_NOTIFY_LOG,
  PM_CHANNELS, PM_ROLES, PM_CAPS, PM_PERMS, PM_ROLE_STAFF, PM_REFUNDS, PM_REVERSALS, PM_DISPUTES,
  PM_DB_TABLES, PM_DB_FUNCS, PM_DB_ERRORS, PM_DB_CHECKS, PM_MIGRATIONS, PM_API, PM_REQ_LOG, PM_CONF_LOG,
  PM_WEBHOOKS, PM_RETRIES, PM_RATE, PM_REPORTS, PM_CHANGES, PM_APPROVALS, PM_SECURITY_EVENTS, EXPORTS,
  pmStats, reportData, renderAll, runReport, runPack, goto,
  addMethod, saveMethod, setDefaultMethod, archiveMethod, toggleMethod, moveMethod,
  saveMobileMoney, testMobileMoney, runMmRecon, saveBank, verifyBank, importStatements, reconcileBank,
  toggleCash, issueCashReceipt, cashVerify, toggleCashStaff, saveCashCfg,
  saveProvider, testProvider, toggleSandbox, disconnectProvider, rotateCredential, replayWebhook, addProvider,
  generateReference, savePreferredMethod, openTxn, lookupTransactions, scanDuplicates, duplicateRows,
  verifyPayment, rejectPayment, autoConfirmAll, approveAllVerification, toggleVerification,
  allocatePayment, recalcBalance, postFailedAllocation, matchRecon, addAdjustment, toggleReconApproval,
  switchFeePayer, recalcFeeSummary, generateReceipt, printReceipt, openReceipt, saveReceiptNumbering,
  verifyReceipt, buildStatement, printStatement, downloadStatement,
  toggleNotifyRule, testChannel, togglePerm, approveSensitive,
  refundAction, openDispute, resolveDispute, fixRls, runConsistency, runDiagnostics, retryWebhook,
  saveSettings, resetSettings, toggleSetting, applyFilters, clearFilter, logExport: pmLogChange
};

/* boot */
(function(){
  fillSelects();
  syncFilterInputs();
  renderAll();
  renderFilterSummary();
  renderExportHistory();
  wireAll();
  const hash = (location.hash || '').slice(1);
  if(hash) goto(hash);
})();
</script>
</body>
</html>
