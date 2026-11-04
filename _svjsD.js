<script>
/* ============================================================
   SAVINGS MANAGEMENT & CONNECTIONS (4/8)
   Shared building blocks, then sections 1–4: the overview, the
   savings accounts, the customer savings profiles and the deposit
   register.
   ============================================================ */

/* ---------------- shared building blocks ---------------- */
function svTone(s){
  const t = String(s == null ? '' : s);
  if(/^(Completed|Verified|Active|Posted|Approved|Pass|Cleared|Delivered|Connected|Enabled|Open|Paid|Generated|Issued|Healthy|Resolved|Normal|Within limit|Genuine|Available|On|Yes|Matched)$/i.test(t)) return 'b-ok';
  if(/^(Pending|Pending verification|Pending approval|Processing|Queued|Awaiting provider|Review|Dormant|Medium|Awaiting|Slow|Restricted|Unverified|Reissued|Held|Partial|Retry queued|Returned for review)$/i.test(t)) return 'b-warn';
  if(/^(Failed|Rejected|Cancelled|Reversed|Suspended|Critical|High|Breach|Flagged|Missing|Expired|Disabled|Violation|Blocked|No)$/i.test(t)) return 'b-crit';
  return 'b-gray';
}
const okb = s => badge(s, svTone(s));
const SV_SEV = s => s === 'Critical' || s === 'High' ? 'b-crit' : s === 'Medium' ? 'b-warn' : 'b-gray';
const put = (id, html) => { const n = el(id); if(n) n.innerHTML = html; };
const svM = v => 'MK ' + num(Math.round(Number(v) || 0));
const svIsos = v => String(v == null ? '' : v).slice(0, 10);
/* a timestamp reads as a date and time everywhere it is printed */
const svWhen = v => v == null || v === '' ? '' : svDateText(String(v).slice(0, 16));
const svNow = () => new Date().toTimeString().slice(0, 5);
const SV_AUDIT_LOG = [];
const SV_ACC_HISTORY = [];
const SV_GOAL_HISTORY = [];

function svLogChange(area, what, from, to){
  SV_CHANGES.unshift({when: TODAY + ' ' + svNow(), what, area, from: String(from), to: String(to), by: 'STF-001'});
  SV_CHANGES.length = Math.min(SV_CHANGES.length, 90);
}
function svAudit(action, target, detail){
  const row = {when: TODAY + ' ' + svNow(), action, target, detail, by: staffName('STF-001'),
    lane: 'Security', severity: 'Low', owner: 'STF-001', region: 'Lilongwe'};
  SV_AUDIT_LOG.unshift(row);
  SV_AUDIT_LOG.length = Math.min(SV_AUDIT_LOG.length, 70);
  SV_AUDIT.unshift(row);
}
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
const SV_SEL = {acc: '', cust: CUSTOMERS[0].id, dep: '', wdr: '', txn: '', conn: '', goal: '', prod: '', receipt: '', months: 6};

function svFillSel(id, pairs, keep){
  const n = el(id);
  if(!n) return;
  const cur = keep !== undefined ? keep : n.value;
  n.innerHTML = pairs.map(([v, l]) => `<option value="${esc(v)}">${esc(l)}</option>`).join('');
  if(cur && pairs.some(p => p[0] === cur)) n.value = cur;
}
const svCustOptions = () => CUSTOMERS.map(c => [c.id, c.id + ' · ' + c.name]);
const svSavingsOptions = () => SV_SAVINGS.map(a => [a.id, a.id + ' · ' + custName(a.cust) + ' · ' + svM(a.available)]);
const svMethodOptions = () => SV_METHODS.filter(m => m.direction === 'Both').map(m => [m.method, m.method + ' · ' + m.provider]);
const svAllAccounts = () => SV_ACCOUNTS.map(a => [a.id, a.id + ' · ' + custName(a.cust) + ' · ' + a.type + ' · ' + svM(a.available)]);

/* every list follows the filter bar; a missing dimension is simply not applied */
function svPass(item){
  const d = item.when || item.requested || item.added || item.opened || item.lastMove || item.lastWrite
    || item.effective || item.created || item.targetDate || item.since || item.lastUsed || TODAY;
  if(!inRange(svIsos(d))) return false;
  const has = k => item[k] !== undefined && item[k] !== null && item[k] !== '';
  return (!has('lane') || passLane(item)) && (!has('severity') || passSeverity(item))
    && (!has('status') || passStatus(item)) && (!has('owner') || passOwner(item))
    && (!has('region') || passRegion(item)) && (!has('product') || passProduct(item))
    && matchQ(item.id, item.ref, item.txn, item.receipt, item.account, item.source, item.dest, item.destName,
      item.name, item.event, item.method, item.provider, item.table, item.function, item.subject, item.kind,
      item.cust ? custName(item.cust) : '', item.amount, item.description, item.notes, item.reason, item.fee);
}

/* ===================== 1 · SAVINGS OVERVIEW ===================== */
function svIssues(){
  const out = [];
  SV_DISCREPANCY.forEach(d => out.push({what: 'Balance discrepancy on ' + d.account,
    detail: custName(d.cust) + ' · ' + svM(Math.abs(d.difference)) + ' out', severity: d.severity, goto: 's6'}));
  SV_DUPLICATES.slice(0, 2).forEach(d => out.push({what: 'Duplicate reference ' + d.ref,
    detail: d.count + ' transactions · ' + svM(d.amount) + ' · ' + d.ids, severity: 'Critical', goto: 's11'}));
  SV_FAILED.slice(0, 3).forEach(f => out.push({what: 'Failed ' + f.kind.toLowerCase() + ' ' + f.ref,
    detail: custName(f.cust) + ' · ' + svM(f.amount) + ' · ' + f.method + ' — ' + f.reason, severity: 'High', goto: 's5'}));
  SV_SAVINGS.filter(a => a.status === 'Suspended').forEach(a => out.push({
    what: 'Savings account ' + a.id + ' is suspended',
    detail: custName(a.cust) + ' · ' + svM(a.available) + ' held · ' + a.restriction, severity: 'High', goto: 's16'}));
  SV_VERIFY.filter(v => !Object.values(v.checks).every(Boolean)).slice(0, 2).forEach(v => out.push({
    what: 'Deposit ' + v.ref + ' fails a check', detail: custName(v.cust) + ' · ' + svM(v.amount), severity: 'Medium', goto: 's4'}));
  SV_CONNS.filter(c => c.status !== 'Connected').forEach(c => out.push({
    what: c.name + ' is ' + c.status.toLowerCase(), detail: c.provider + ' · ' + c.latency + ' ms', severity: 'Medium', goto: 's10'}));
  return out.filter(a => passSeverity(a) && matchQ(a.what, a.detail));
}

function renderOverview(){
  const s = svStats();
  if(el('ovPill')){ el('ovPill').className = 'badge b-gray'; el('ovPill').textContent = num(s.savingsAccounts) + ' savings accounts'; }
  put('ovKpis', [
    ['Savings accounts', num(s.savingsAccounts), num(s.accounts) + ' accounts in total', ''],
    ['Active accounts', num(s.active), num(s.inactive) + ' inactive or restricted', ''],
    ['Total customer savings', svM(s.savingsTotal), 'Available across the book', ''],
    ['Savings deposits', svM(s.deposited), num(s.deposits) + ' deposits recorded', ''],
    ['Savings withdrawals', svM(s.withdrawn), num(s.withdrawals) + ' payouts recorded', ''],
    ['Pending transactions', num(s.pending), num(s.pendingVerification) + ' to verify · ' + num(s.pendingApproval) + ' to approve', s.pending ? 'red' : ''],
    ['Interest accrued', svM(s.interestAccrued), 'This month, not yet posted', ''],
    ['Interest paid', svM(s.interestPaid), 'Credited to customers to date', ''],
    ['Dormant accounts', num(s.dormant), 'No customer movement in ' + SV_SET.dormantDays + ' days', ''],
    ['Net movement', svM(s.net), 'Deposits less withdrawals', ''],
    ['Fees collected', svM(s.fees), 'On completed transactions', ''],
    ['Open alerts', num(s.alerts), 'Discrepancies, duplicates and failures', s.alerts ? 'red' : '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join(''));

  if(el('ovStamp')) el('ovStamp').textContent = 'Updated ' + lastRefresh();
  put('ovMeters',
    meter('Accounts in good standing', Math.round(pct(s.active, Math.max(1, s.savingsAccounts))), num(s.active) + ' of ' + num(s.savingsAccounts) + ' active', 100) +
    meter('Interest posted', Math.round(pct(s.interestPaid, Math.max(1, s.interestAccrued + s.interestPaid))), svM(s.interestPaid) + ' paid against ' + svM(s.interestAccrued) + ' accrued', 100) +
    meter('Goal progress', Math.round(pct(s.goalSaved, Math.max(1, s.goalTarget))), svM(s.goalSaved) + ' saved of ' + svM(s.goalTarget), 100) +
    meter('Reserved for payouts', Math.round(pct(s.reserved, Math.max(1, s.savingsTotal))), svM(s.reserved) + ' held', 100) +
    meter('Queue cleared', Math.round(100 - pct(s.pending, Math.max(1, s.total))), s.pending + ' still waiting', 100) +
    meter('Savings health score', Math.round(s.score), 'Failures, discrepancies, duplicates, RLS and provider health', 100));

  const board = ['Active', 'Dormant', 'Restricted', 'Suspended', 'Closed'].map(st => ({
    st, n: SV_SAVINGS.filter(a => a.status === st).length,
    value: sum(SV_SAVINGS.filter(a => a.status === st), a => a.available)
  }));
  if(el('ovBoardPill')) el('ovBoardPill').textContent = num(s.savingsAccounts) + ' accounts';
  put('ovBoard', board.map(b => `<div class="risk"><div><div class="rn">${esc(b.st)}</div>
      <div class="rs">${num(b.n)} account${b.n === 1 ? '' : 's'} · ${svM(b.value)}</div></div>
      <div class="rv">${okb(b.st)}</div></div>`).join(''));

  put('ovGrid',
    chartBox({title: 'Money in against money out', sub: 'The last seven days, MWK', type: 'bar', h: 200,
      cats: SV_DAILY.map(d => d.label),
      series: [{name: 'Deposits', data: SV_DAILY.map(d => d.deposits), colour: '#1E9E6A'},
        {name: 'Withdrawals', data: SV_DAILY.map(d => d.withdrawals), colour: '#C9A227'}],
      value: compact(s.savingsTotal)}) +
    chartBox({title: 'Savings by product', sub: 'Balance held per product', type: 'donut', h: 200,
      cats: SV_PRODUCTS.map(p => p.name.split(' · ')[0]),
      series: [{name: 'Balance', data: SV_PRODUCTS.map(p => p.balance || 0)}],
      value: compact(s.savingsTotal)}) +
    chartBox({title: 'Transaction mix', sub: 'Count by kind', type: 'bar', h: 200,
      cats: SV_KINDS,
      colours: SV_KINDS.map(k => SV_COLOURS[k]),
      series: [{name: 'Transactions', data: SV_KINDS.map(k => SV_TXN.filter(t => t.kind === k).length)}],
      value: num(s.total)}));

  const issues = svIssues();
  if(el('ovAlertPill')) el('ovAlertPill').textContent = issues.length;
  put('ovAlerts', issues.length ? issues.map(a => `<div class="risk rowlink" data-goto="${a.goto}">
      <div><div class="rn">${esc(a.what)}</div><div class="rs">${esc(a.detail)}</div></div>
      <div class="rv">${badge(a.severity, SV_SEV(a.severity))}</div></div>`).join('')
    : '<div class="empty">Nothing open — every account reconciles and every queue is clear.</div>');

  const feed = SV_TXN.filter(svPass).slice(0, 8);
  put('ovFeed', feed.length ? feed.map(t => `<div class="risk rowlink" data-opentxn="${esc(t.id)}">
      <div><div class="rn">${esc(t.id)} · ${esc(t.kind)} · ${esc(svM(t.amount))}</div>
        <div class="rs">${esc(custName(t.cust))} · ${esc(t.account)} · ${esc(svWhen(t.when))}</div></div>
      <div class="rv">${okb(t.status)}</div></div>`).join('')
    : '<div class="empty">No transaction matches the current filters.</div>');
}

/* ===================== 2 · SAVINGS ACCOUNT MANAGEMENT ===================== */
function svAccItem(){
  return SV_ACC_BY_ID[SV_SEL.acc] || SV_SAVINGS[0];
}
function renderAccounts(){
  const rows = SV_SAVINGS.filter(svPass).concat(SV_ACCOUNTS.filter(a => a.type === 'Current' && svPass(a)));
  const s = svStats();
  if(el('amPill')){ el('amPill').className = 'badge b-gray'; el('amPill').textContent = num(rows.length) + ' in view'; }
  put('amKpis', [
    ['Accounts in view', num(rows.length), 'Savings and current', ''],
    ['Value held', svM(sum(rows, a => a.available)), 'Available now', ''],
    ['Active', num(rows.filter(a => a.status === 'Active').length), 'Open for business', ''],
    ['Dormant', num(rows.filter(a => a.status === 'Dormant').length), 'No movement for ' + SV_SET.dormantDays + ' days', ''],
    ['Restricted', num(rows.filter(a => a.status === 'Restricted').length), 'A condition applies', ''],
    ['Suspended', num(rows.filter(a => a.status === 'Suspended').length), 'Blocked by compliance', ''],
    ['Opened this year', num(SV_ACCOUNTS.filter(a => String(a.opened).slice(0, 4) === '2026').length), 'New accounts', ''],
    ['Average balance', svM(rows.length ? sum(rows, a => a.available) / rows.length : 0), 'Per account in view', '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join(''));

  svFillSel('amCust', svCustOptions());
  svFillSel('amProduct', SV_PRODUCTS.map(p => [p.id, p.name]));
  const cust = el('amCust') ? el('amCust').value : CUSTOMERS[0].id;
  const type = el('amType') ? el('amType').value : 'Savings';
  if(el('amNumber')) el('amNumber').value = SV_SET.accountPrefix + '-' + pad(1001 + SV_ACCOUNTS.length + 1, SV_SET.accountDigits);
  if(el('amMsg') && !String(el('amMsg').textContent || '').trim())
    el('amMsg').textContent = 'The number is generated from the prefix and the next sequence; opening writes the account and its history row.';

  if(el('amCount')) el('amCount').textContent = num(rows.length) + ' accounts';
  const sorted = rows.slice().sort((a, b) => String(b.opened).localeCompare(String(a.opened)));
  sorted.forEach(a => { a._open = () => { SV_SEL.acc = a.id; renderAccounts(); }; });
  renderTable('amBody', [
    {k: 'id', label: 'Account'},
    {k: 'cust', label: 'Customer', html: v => esc(custName(v))},
    {k: 'type', label: 'Type'},
    {k: 'productName', label: 'Product', html: v => `<span class="wraptext">${esc(v)}</span>`},
    {k: 'opened', label: 'Opened', html: v => esc(fmtDate(v))},
    {k: 'available', label: 'Available', num: true, html: v => esc(svM(v))},
    {k: 'interestRate', label: 'Rate', num: true, html: v => esc(v ? v + '%' : '—')},
    {k: 'status', label: 'Status', html: v => okb(v)}
  ], sorted, {sort: 'opened', pageSize: 10});

  const sel = svAccItem();
  if(el('amSelPill')) el('amSelPill').textContent = sel ? sel.id : '—';
  put('amDetail', sel ? kvRow('Account', sel.id) + kvRow('Owner', custName(sel.cust) + ' · ' + sel.cust)
    + kvRow('Type', sel.type) + kvRow('Product', sel.productName)
    + kvRow('Opened', fmtDate(sel.opened)) + kvRow('Status', okb(sel.status))
    + kvRow('Available', svM(sel.available)) + kvRow('Reserved', svM(sel.reserved))
    + kvRow('Ledger', svM(sel.ledger)) + kvRow('Minimum balance', svM(sel.minBalance))
    + kvRow('Interest rate', sel.interestRate ? sel.interestRate + '% ' + sel.rateType : '—')
    + kvRow('Identity', sel.verified + ' · ' + sel.idType + ' ' + sel.idNumber)
    + kvRow('Last movement', fmtDate(sel.lastMove))
    + kvRow('Restriction', sel.restriction === 'None' ? okb('None') : badge(sel.restriction, 'b-warn'))
    : '<div class="empty">Nothing selected.</div>');

  if(el('amHistPill')) el('amHistPill').textContent = num(SV_ACC_HISTORY.filter(h => h.account === (sel || {}).id).length) + ' changes';
  renderTable('amHistBody', [
    {k: 'when', label: 'When', html: v => esc(svWhen(v))},
    {k: 'action', label: 'Change'},
    {k: 'from', label: 'From'},
    {k: 'to', label: 'To'},
    {k: 'by', label: 'Officer', html: v => esc(staffName(v))}
  ], SV_ACC_HISTORY.filter(h => h.account === (sel || {}).id), {sort: 'when', pageSize: 4});

  if(el('amHolder')) el('amHolder').value = sel ? custName(sel.cust) : '';
  if(el('amMeta')) el('amMeta').innerHTML = `<div class="minihead">Account meta</div>`
    + kvRow('Opening balance', svM(sel ? sel.opening : 0))
    + kvRow('Deposits to date', svM(sel ? sel.inTotal : 0))
    + kvRow('Withdrawals to date', svM(sel ? sel.outTotal : 0))
    + kvRow('Interest paid', svM(sel ? sel.interestPaid : 0))
    + kvRow('Pending deposits', svM(sel ? sel.pendingIn : 0));
  if(el('amActMsg') && !String(el('amActMsg').textContent || '').trim())
    el('amActMsg').textContent = 'Closing an account needs a zero available balance; the state change is written to the history.';
}

/* ===================== 3 · CUSTOMER SAVINGS PROFILES ===================== */
function svCustItem(){
  return CUST_BY_ID[SV_SEL.cust] || CUSTOMERS[0];
}
function renderProfiles(){
  const withSavings = [];
  CUSTOMERS.slice(0, 40).forEach(c => {
    const accts = SV_ACCOUNTS.filter(a => a.cust === c.id);
    withSavings.push({cust: c.id, name: c.name, region: c.region,
      accounts: accts.length,
      savings: sum(accts.filter(a => a.type === 'Savings'), a => a.available),
      total: sum(accts, a => a.available),
      goals: SV_GOALS.filter(g => g.cust === c.id).length,
      status: accts.some(a => a.status === 'Suspended') ? 'Suspended'
        : accts.some(a => a.status === 'Dormant') ? 'Dormant'
        : accts.some(a => a.status === 'Restricted') ? 'Restricted' : 'Active',
      verified: (accts[0] || {}).verified || 'Verified',
      lane: 'Savings', severity: 'Low', owner: 'STF-001', region2: c.region});
  });
  const rows = withSavings.filter(svPass);
  const s = svStats();
  if(el('cpPill')){ el('cpPill').className = 'badge b-ok'; el('cpPill').textContent = num(rows.length) + ' customers'; }
  put('cpKpis', [
    ['Customers in view', num(rows.length), 'With a savings profile', ''],
    ['Combined savings', svM(sum(rows, r => r.savings)), 'Across their savings accounts', ''],
    ['Combined balance', svM(sum(rows, r => r.total)), 'Savings and current', ''],
    ['With a goal', num(rows.filter(r => r.goals).length), 'Saving towards something', ''],
    ['Identities unverified', num(rows.filter(r => r.verified !== 'Verified').length), 'Must be checked before a payout', ''],
    ['Restricted customers', num(rows.filter(r => r.status !== 'Active').length), 'Dormant, restricted or suspended', ''],
    ['Average savings', svM(rows.length ? sum(rows, r => r.savings) / rows.length : 0), 'Per customer', ''],
    ['Customers with deposits', num(new Set(SV_DEPOSITS.map(t => t.cust)).size), 'Have paid money in', '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join(''));

  if(el('cpCount')) el('cpCount').textContent = num(rows.length) + ' customers';
  const list = rows.slice();
  list.forEach(r => { r._open = () => { SV_SEL.cust = r.cust; renderProfiles(); }; });
  renderTable('cpBody', [
    {k: 'name', label: 'Customer'},
    {k: 'cust', label: 'Reference'},
    {k: 'region', label: 'Branch'},
    {k: 'accounts', label: 'Accounts', num: true},
    {k: 'savings', label: 'Savings', num: true, html: v => esc(svM(v))},
    {k: 'goals', label: 'Goals', num: true},
    {k: 'verified', label: 'Identity', html: v => okb(v)},
    {k: 'status', label: 'State', html: v => okb(v)}
  ], rows, {sort: 'savings', pageSize: 8});

  const c = svCustItem();
  const accts = SV_ACCOUNTS.filter(a => a.cust === c.id);
  const sav = SV_ACC_OF_CUST(c.id, 'Savings');
  const total = sum(accts, a => a.available);
  if(el('cpSelPill')) el('cpSelPill').textContent = c.id;
  put('cpIdBox', `<div class="minihead">Identification</div>`
    + kvRow('Customer', c.name + ' · ' + c.id)
    + kvRow('Document', (sav ? sav.idType : 'National ID') + ' ' + (sav ? sav.idNumber : '—'))
    + kvRow('Verification', sav ? okb(sav.verified) : '—')
    + kvRow('Branch', c.region) + kvRow('Member since', fmtDate(sav ? sav.opened : TODAY)));
  put('cpContactBox', `<div class="minihead">Contact</div>`
    + kvRow('Phone', sav ? sav.phone : '—') + kvRow('Email', sav ? sav.email : '—')
    + kvRow('Statement cycle', 'Monthly')
    + kvRow('Preferred channel', SV_SET.notifySms ? 'SMS' : 'Email'));
  put('cpVerifyBox', `<div class="minihead">Account verification</div>`
    + kvRow('Identity on file', sav && sav.verified === 'Verified' ? okb('Verified') : badge('Unverified', 'b-warn'))
    + kvRow('Document seen', sav ? sav.idType : '—')
    + kvRow('Last checked', fmtDate(addDays(TODAY, -14)))
    + kvRow('May withdraw', sav && sav.status === 'Active' ? okb('Yes') : badge('Restricted', 'b-warn')));

  put('cpBalBox', strip([
    ['Savings', svM(sum(accts.filter(a => a.type === 'Savings'), a => a.available))],
    ['Current', svM(sum(accts.filter(a => a.type === 'Current'), a => a.available))],
    ['Total', svM(total)],
    ['Reserved', svM(sum(accts, a => a.reserved))]
  ]) + `<div class="qhint" style="margin-top:6px">Every figure is derived from the posted transactions, not typed in.</div>`);
  renderTable('cpAcctBody', [
    {k: 'id', label: 'Account'},
    {k: 'type', label: 'Type'},
    {k: 'available', label: 'Available', num: true, html: v => esc(svM(v))},
    {k: 'interestRate', label: 'Rate', num: true, html: v => esc(v ? v + '%' : '—')},
    {k: 'status', label: 'State', html: v => okb(v)}
  ], accts, {sort: 'available', pageSize: 4});

  const txns = SV_TXN.filter(t => t.cust === c.id);
  if(el('cpTxnPill')) el('cpTxnPill').textContent = num(txns.length) + ' transactions';
  const tl = txns.slice();
  tl.forEach(t => { t._open = () => { SV_SEL.txn = t.id; openSavingsTxn(t); }; });
  renderTable('cpTxnBody', [
    {k: 'when', label: 'Date', html: v => esc(svWhen(v))},
    {k: 'id', label: 'Transaction'},
    {k: 'kind', label: 'Kind', html: v => badge(v, v === 'Deposit' ? 'b-ok' : v === 'Withdrawal' ? 'b-warn' : 'b-gray')},
    {k: 'amount', label: 'Amount', num: true, html: v => esc(svM(v))},
    {k: 'status', label: 'State', html: v => okb(v)}
  ], tl, {sort: 'when', pageSize: 6});

  const goals = SV_GOALS.filter(g => g.cust === c.id);
  put('cpGoalsBox', goals.length ? goals.map(g => `<div class="risk">
      <div><div class="rn">${esc(g.name)}</div>
        <div class="rs">${num(Math.round(pct(g.saved, g.target)))}% · ${esc(svM(g.saved))} of ${esc(svM(g.target))} · by ${esc(fmtDate(g.targetDate))}</div></div>
      <div class="rv">${okb(g.status)}</div></div>`).join('')
    : '<div class="qhint">This customer has not set a savings goal.</div>');
  put('cpRestrictBox', `<div class="minihead">Restrictions</div>`
    + (accts.filter(a => a.restriction !== 'None').length
      ? accts.filter(a => a.restriction !== 'None').map(a => kvRow(a.id, badge(a.restriction, 'b-warn'))).join('')
      : '<div class="qhint">No restriction is in force on any account.</div>'));
}

/* ===================== 4 · SAVINGS DEPOSITS ===================== */
function svDepItem(){
  return SV_DEPOSITS.find(t => t.id === SV_SEL.dep) || SV_DEPOSITS[0];
}
function renderDeposits(){
  const rows = SV_DEPOSITS.filter(svPass);
  const s = svStats();
  if(el('dpPill')){ el('dpPill').className = 'badge b-warn'; el('dpPill').textContent = num(rows.length) + ' deposits'; }
  put('dpKpis', [
    ['Deposits in view', num(rows.length), 'Of ' + num(SV_DEPOSITS.length) + ' recorded', ''],
    ['Value in view', svM(sum(rows, t => t.amount)), 'Whatever the state', ''],
    ['Completed', num(rows.filter(t => t.status === 'Completed').length), svM(sum(rows.filter(t => t.status === 'Completed'), t => t.amount)), ''],
    ['Awaiting verification', num(rows.filter(t => t.status === 'Pending verification').length), 'A person must check the proof', ''],
    ['Awaiting approval', num(rows.filter(t => t.status === 'Pending approval').length), 'A signature is needed', ''],
    ['Customer-initiated', num(rows.filter(t => t.initiatedBy === 'Customer').length), 'Came through a rail', ''],
    ['Staff-recorded', num(rows.filter(t => t.initiatedBy !== 'Customer').length), 'Taken at the counter', ''],
    ['Average deposit', svM(rows.length ? sum(rows, t => t.amount) / rows.length : 0), 'Across every rail', '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join(''));

  svFillSel('dpCust', svCustOptions());
  svFillSel('dpAcct', svSavingsOptions());
  svFillSel('dpMethod', svMethodOptions());
  const acct = SV_ACC_BY_ID[el('dpAcct') ? el('dpAcct').value : ''] || SV_SAVINGS[0];
  if(el('dpCust') && acct && !el('dpCust').value) el('dpCust').value = acct.cust;
  if(el('dpWhen') && !el('dpWhen').value) el('dpWhen').value = TODAY + 'T08:30';
  if(el('dpRef') && !el('dpRef').value) el('dpRef').value = (SV_METHOD_BY_NAME[el('dpMethod') ? el('dpMethod').value : 'Cash'] || {}).prefix + '-' + pad(ri(100000, 999999), 6);
  if(el('dpMsg') && !String(el('dpMsg').textContent || '').trim())
    el('dpMsg').textContent = 'A deposit is credited only after verification; a reference seen inside the window is held instead.';

  if(el('dpCount')) el('dpCount').textContent = num(rows.length) + ' deposits';
  const sorted = rows.slice().sort((a, b) => String(b.when).localeCompare(String(a.when)));
  sorted.forEach(t => { t._open = () => { SV_SEL.dep = t.id; renderDeposits(); }; });
  renderTable('dpBody', [
    {k: 'when', label: 'Date', html: v => esc(svWhen(v))},
    {k: 'ref', label: 'Reference'},
    {k: 'cust', label: 'Customer', html: v => esc(custName(v))},
    {k: 'account', label: 'Account'},
    {k: 'method', label: 'Method'},
    {k: 'amount', label: 'Amount', num: true, html: v => esc(svM(v))},
    {k: 'proof', label: 'Proof', html: v => v ? okb('Attached') : badge('None', 'b-warn')},
    {k: 'status', label: 'State', html: v => okb(v)}
  ], sorted, {sort: 'when', pageSize: 8});

  const sel = svDepItem();
  const amount = Number(el('dpAmount') ? el('dpAmount').value : 0) || 0;
  const method = el('dpMethod') ? el('dpMethod').value : 'Cash';
  const dup = sel ? SV_TXN.filter(t => t.ref === sel.ref).length : 0;
  const checks = [
    ['Customer and account agree', sel ? (SV_ACC_BY_ID[sel.account] || {}).cust === sel.cust : true, sel ? custName(sel.cust) : '—'],
    ['Inside the minimum and maximum deposit', amount >= SV_SET.minDeposit && amount <= SV_SET.maxDeposit,
      svM(SV_SET.minDeposit) + ' – ' + svM(SV_SET.maxDeposit)],
    ['Reference not seen before', sel ? dup < 2 : true, sel ? dup + ' occurrence(s)' : '—'],
    ['Proof of payment present', sel ? (sel.method === 'Cash' || !!sel.proof) : false,
      sel && sel.proof ? sel.proof : 'No proof attached'],
    ['Method available on the rail', !['Airtel Money', 'TNM Mpamba'].includes(method)
      || (SV_CONNS.find(c => c.name === method) || {status: 'Connected'}).status === 'Connected', method],
    ['Account is open to receive', sel ? (SV_ACC_BY_ID[sel.account] || {}).status !== 'Suspended' : true,
      sel ? (SV_ACC_BY_ID[sel.account] || {}).status : '—']
  ];
  if(el('dpChkPill')) el('dpChkPill').textContent = checks.filter(c => c[1]).length + '/' + checks.length;
  put('dpChecks', checks.map(([l, ok, d]) => `<div class="checkrow"><div class="ck ${ok ? 'pass' : 'crit'}">${ok ? '✓' : '!'}</div>
      <div style="flex:1"><div style="font-size:10.5px;font-weight:800">${esc(l)}</div><div class="qhint">${esc(String(d))}</div></div>
      <div>${okb(ok ? 'Pass' : 'Failed')}</div></div>`).join(''));

  if(el('dpDupPill')) el('dpDupPill').textContent = SV_DUPLICATES.length + ' held';
  put('dpDupBox', `<div class="minihead">Duplicate detection</div>`
    + kvRow('Window', SV_SET.duplicateWindow ? SV_SET.duplicateWindow + ' minutes' : '10 minutes')
    + kvRow('Reference groups held', String(SV_DUPLICATES.length))
    + (SV_DUPLICATES[0] ? kvRow('Largest group', SV_DUPLICATES[0].ref + ' · ' + SV_DUPLICATES[0].count + ' rows') : kvRow('Largest group', 'None'))
    + kvRow('Selected deposit reference', sel ? sel.ref : '—')
    + `<div class="qhint" style="margin-top:6px">A duplicate is held for a person to look at; it is never credited automatically.</div>`);

  put('dpGrid',
    chartBox({title: 'Deposits by rail', sub: 'Completed deposits, MWK', type: 'bar', h: 200,
      cats: SV_METHODS.filter(m => m.direction === 'Both').map(m => m.method),
      series: [{name: 'Deposited', data: SV_METHODS.filter(m => m.direction === 'Both').map(m =>
        sum(SV_COMPLETED.filter(t => t.kind === 'Deposit' && t.method === m.method), t => t.amount))}],
      value: compact(s.deposited)}) +
    chartBox({title: 'Deposits against withdrawals', sub: 'Seven days, MWK', type: 'line', h: 200,
      cats: SV_DAILY.map(d => d.label),
      series: [{name: 'Deposits', data: SV_DAILY.map(d => d.deposits), colour: '#1E9E6A'},
        {name: 'Withdrawals', data: SV_DAILY.map(d => d.withdrawals), colour: '#C9A227'}],
      value: compact(s.deposited)}));
}

function openSavingsTxn(t){
  if(!t) return;
  openModal(t.id, t.kind + ' · ' + custName(t.cust) + ' · ' + svWhen(t.when),
    `<div class="pfields" style="grid-template-columns:1fr 1fr">
      ${field('Amount', esc(svM(t.amount)))}${field('Fee', esc(svM(t.fee)))}
      ${field('Account', esc(t.account))}${field('Method', esc(t.method))}
      ${field('Provider', esc(t.provider))}${field('Provider reference', esc(t.ref))}
      ${field('Status', okb(t.status))}${field('Stage', esc(t.stage))}
      ${field('Raised by', esc(t.initiatedBy === 'Customer' ? 'The customer' : staffName(t.initiatedBy)))}
      ${field('Officer', esc(staffName(t.officer)))}
      ${field('Verified by', esc(t.verifiedBy ? staffName(t.verifiedBy) : 'Not verified'))}
      ${field('Approved by', esc(t.approvedBy ? staffName(t.approvedBy) : 'Not approved'))}
    </div>
    <div class="qhint" style="margin-top:8px">${esc(t.description)}${t.proof ? ' · proof ' + esc(t.proof) : ''}</div>`,
    [{label: 'Open in monitoring', act: () => { closeModal(); SV_SEL.txn = t.id; goto('s11'); renderMonitoring(); }},
     {label: 'Close', act: 'close'}]);
}
</script>
