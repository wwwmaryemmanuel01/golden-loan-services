<script>
/* ============================================================
   WEBSITE MANAGEMENT & CONNECTIONS (6/7)
   9 · Authentication   10 · Frontend integration
   11 · Forms           12 · Files and media
   ============================================================ */

/* ===================== 9 · AUTHENTICATION CONNECTIONS ===================== */
function renderAuth(){
  const healthy = AUTH_SERVICES.filter(a => a.status === 'Healthy').length;
  const errs = AUTH_ERRORS.filter(e => e.status === 'Open');
  el('authPill').className = 'badge ' + (healthy === AUTH_SERVICES.length ? 'b-ok' : 'b-warn');
  el('authPill').textContent = healthy + ' of ' + AUTH_SERVICES.length + ' healthy';
  el('authKpis').innerHTML = [
    ['Sign-in services', num(AUTH_SERVICES.length), healthy + ' healthy, ' + (AUTH_SERVICES.length - healthy) + ' degraded', ''],
    ['Staff sign-ins today', num(AUTH_SERVICES[0].calls24h), 'p95 ' + AUTH_SERVICES[0].p95 + ' ms', ''],
    ['Customer sign-ins today', num(AUTH_SERVICES[1].calls24h), 'p95 ' + AUTH_SERVICES[1].p95 + ' ms', ''],
    ['Session validations', num(AUTH_SERVICES[6].calls24h), 'p95 ' + AUTH_SERVICES[6].p95 + ' ms on every request', ''],
    ['Auth errors (24 h)', num(sum(AUTH_ERRORS, e => e.count)), errs.length + ' still open', errs.length ? 'red' : ''],
    ['Registration and recovery', num(AUTH_SERVICES[2].calls24h + AUTH_SERVICES[3].calls24h), 'Sign-ups and password resets combined', '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join('');

  el('authGrid').innerHTML = [
    chartBox({title:'Sign-ins by month', sub:'Staff and customers, six months', value:num(sum(AUTH_DAILY, d => d.staff + d.customers)),
      chart: chart({type:'bar', cats:AUTH_DAILY.map(d => monthLabel(d.mk)), h:190,
        series:[{name:'Staff', data:AUTH_DAILY.map(d => d.staff), colour:'#C9A227'},
                {name:'Customers', data:AUTH_DAILY.map(d => d.customers), colour:'#2F6FED'}]})}),
    chartBox({title:'Failed attempts by month', sub:'Refusals and lockouts', value:num(sum(AUTH_DAILY, d => d.failed)),
      chart: chart({type:'line', cats:AUTH_DAILY.map(d => monthLabel(d.mk)), h:190,
        series:[{name:'Failed', data:AUTH_DAILY.map(d => d.failed), colour:'#D93F3F'}]})}),
    chartBox({title:'Calls by service', sub:'Volume per authentication service', value:num(sum(AUTH_SERVICES, a => a.calls24h)),
      chart: chart({type:'donut', cats:AUTH_SERVICES.map(a => a.name.split(' ')[0]), h:190, colours:PALETTE,
        series:[{data:AUTH_SERVICES.map(a => a.calls24h)}]})})
  ].join('');

  el('asPill').className = 'badge ' + (healthy === AUTH_SERVICES.length ? 'b-ok' : 'b-warn');
  el('asPill').textContent = AUTH_SERVICES.length + ' services';
  renderTable('asBody', [
    {k:'name', label:'Service'}, {k:'kind', label:'Kind'}, {k:'note', label:'How it works'},
    {k:'calls24h', label:'Calls (24 h)', num:true}, {k:'p95', label:'p95 (ms)', num:true},
    {k:'errors', label:'Errors', num:true},
    {k:'status', label:'Status', html:v => okBadge(v)},
    {k:'act', label:'', html:(v, r) => `<button class="btn btn-ghost" data-authtest="${esc(r.name)}">Test</button>`}
  ], AUTH_SERVICES, {sort:'errors', pageSize:7});

  el('staffAuthBox').innerHTML = `<div class="pfields" style="grid-template-columns:1fr 1fr">
      ${kvRow('Method', 'Email, password and TOTP')}
      ${kvRow('Provider', 'Supabase Auth')}
      ${kvRow('MFA', 'Required for every staff account')}
      ${kvRow('Session length', '30 minutes idle timeout')}
      ${kvRow('Failed attempts', '5 before a 30-minute lockout')}
      ${kvRow('p95 latency', AUTH_SERVICES[0].p95 + ' ms')}
    </div>
    <div class="minihead" style="margin-top:9px">Live probes</div>
    <div class="checkrow"><div class="ck pass">✓</div><div style="flex:1"><div style="font-size:10px;font-weight:800">Credential exchange</div>
      <div class="qhint">Token issued in 186 ms for a test staff account</div></div></div>
    <div class="checkrow"><div class="ck pass">✓</div><div style="flex:1"><div style="font-size:10px;font-weight:800">Second factor</div>
      <div class="qhint">TOTP accepted, replay rejected</div></div></div>
    <div class="checkrow"><div class="ck warn">!</div><div style="flex:1"><div style="font-size:10px;font-weight:800">Lockout</div>
      <div class="qhint">4 failed attempts recorded on STF-007 today</div></div></div>`;

  el('custAuthBox').innerHTML = `<div class="pfields" style="grid-template-columns:1fr 1fr">
      ${kvRow('Method', 'Phone number and a one-time code')}
      ${kvRow('Provider', 'Supabase Auth + edge functions')}
      ${kvRow('Code length', '6 digits, 5-minute window')}
      ${kvRow('Session length', '14 days sliding')}
      ${kvRow('Rate limit', '10 attempts a minute')}
      ${kvRow('p95 latency', AUTH_SERVICES[1].p95 + ' ms')}
    </div>
    <div class="minihead" style="margin-top:9px">Live probes</div>
    <div class="checkrow"><div class="ck pass">✓</div><div style="flex:1"><div style="font-size:10px;font-weight:800">OTP delivery</div>
      <div class="qhint">Airtel and TNM numbers both reachable</div></div></div>
    <div class="checkrow"><div class="ck fail">✕</div><div style="flex:1"><div style="font-size:10px;font-weight:800">SMS gateway</div>
      <div class="qhint">Africa’s Talking returned 503 — 9 codes failed today</div></div></div>
    <div class="checkrow"><div class="ck warn">!</div><div style="flex:1"><div style="font-size:10px;font-weight:800">Expiry window</div>
      <div class="qhint">6 codes expired before entry</div></div></div>`;

  el('regBox').innerHTML = `<div class="pfields" style="grid-template-columns:1fr 1fr">
      ${kvRow('Registration', 'Creates the customer and the KYC shell')}
      ${kvRow('Sign-ups (24 h)', num(AUTH_SERVICES[2].calls24h))}
      ${kvRow('Password recovery', 'Email link and SMS code')}
      ${kvRow('Resets (24 h)', num(AUTH_SERVICES[3].calls24h))}
      ${kvRow('Duplicate guard', 'Phone checked against every customer record')}
      ${kvRow('KYC handoff', 'Lands in the compliance queue on submit')}
    </div>`;

  el('sessPill').className = 'badge b-ok';
  el('sessPill').textContent = 'Healthy';
  el('sessBox').innerHTML = `<div class="pfields" style="grid-template-columns:1fr 1fr">
      ${kvRow('Validations (24 h)', num(AUTH_SERVICES[6].calls24h))}
      ${kvRow('p95', AUTH_SERVICES[6].p95 + ' ms')}
      ${kvRow('JWT lifetime', '3600 s')}
      ${kvRow('Refresh', 'Silent, 60 s before expiry')}
      ${kvRow('Revocation', 'Immediate on sign-out or role change')}
      ${kvRow('Failures', num(AUTH_SERVICES[6].errors) + ' token expiry mid-session')}
    </div>
    <div style="margin-top:9px">${meter('Session success rate', 100 - pct(AUTH_SERVICES[6].errors, AUTH_SERVICES[6].calls24h) * 40, 99, 97,
      AUTH_SERVICES[6].errors + ' of ' + num(AUTH_SERVICES[6].calls24h) + ' validations refused')}</div>`;

  renderTable('afBody', [
    {k:'name', label:'Function'}, {k:'note', label:'Covers'},
    {k:'calls24h', label:'Calls (24 h)', num:true}, {k:'p95', label:'p95 (ms)', num:true},
    {k:'errors', label:'Errors', num:true}, {k:'status', label:'Status', html:v => okBadge(v)}
  ], AUTH_SERVICES.filter(a => /function|Session/i.test(a.kind) || /functions|Session/i.test(a.name)), {sort:'calls24h', pageSize:5});

  el('aePill').className = 'badge ' + (errs.length ? 'b-warn' : 'b-ok');
  el('aePill').textContent = num(sum(AUTH_ERRORS, e => e.count)) + ' errors';
  renderTable('aeBody', [
    {k:'when', label:'When', html:v => String(v).slice(0, 10) === TODAY ? 'Today ' + String(v).slice(11) : fmtDate(v)},
    {k:'service', label:'Service'}, {k:'code', label:'Code'}, {k:'detail', label:'Detail'},
    {k:'count', label:'Count', num:true},
    {k:'status', label:'Status', html:v => okBadge(v)},
    {k:'act', label:'', html:(v, r) => r.status === 'Open'
      ? `<button class="btn btn-ghost" data-authfix="${esc(r.code)}">Acknowledge</button>` : '<span class="qhint">—</span>'}
  ], AUTH_ERRORS, {sort:'count', pageSize:7});
}
function testAuthService(name){
  const s = AUTH_SERVICES.find(a => a.name === name);
  if(!s) return;
  if(name === 'Customer authentication functions' || name === 'Customer login'){
    const up = INTEGRATIONS.find(i => /SMS/.test(i.name));
    s.status = up && up.status === 'Connected' ? 'Healthy' : 'Degraded';
  }
  s.p95 = Math.max(20, s.p95 + Math.round(Math.random() * 20) - 10);
  renderAuth(); renderStats();
  toast(name + ' · ' + s.status + ' · p95 ' + s.p95 + ' ms', s.status === 'Healthy' ? 'ok' : 'info');
}

/* ===================== 10 · FRONTEND INTEGRATION ===================== */
const FE_TESTS = [
  {origin: 'Public website', test: 'Load, fetch content, submit the contact form', result: 'Pass', ms: 142, when: TODAY},
  {origin: 'Public website', test: 'Loan calculator quote round trip', result: 'Pass', ms: 96, when: TODAY},
  {origin: 'Admin portal', test: 'Sign in, open a loan, export a report', result: 'Pass', ms: 118, when: TODAY},
  {origin: 'Customer portal', test: 'Sign in and fetch the loan statement', result: 'Fail', ms: 302, when: TODAY},
  {origin: 'Customer portal', test: 'Submit a loan application', result: 'Fail', ms: 388, when: TODAY},
  {origin: 'Public website', test: 'CORS preflight against the API', result: 'Pass', ms: 44, when: addDays(TODAY, -1)}
];
function renderFrontend(){
  const bad = FE_CONNECTIONS.filter(c => c.status !== 'Connected');
  el('fePill').className = 'badge ' + (bad.length ? 'b-warn' : 'b-ok');
  el('fePill').textContent = bad.length ? bad.length + ' degraded' : 'All connected';
  el('feKpis').innerHTML = [
    ['Frontend connections', num(FE_CONNECTIONS.length), FE_CONNECTIONS.filter(c => c.status === 'Connected').length + ' connected', ''],
    ['Degraded origins', num(bad.length), bad.map(c => c.name.split(' to ')[0]).join(', ') || 'None', bad.length ? 'red' : ''],
    ['Failed requests', num(sum(FAILED_REQUESTS, r => r.count)), FAILED_REQUESTS.filter(r => r.status === 'Open').length + ' groups still open', ''],
    ['Browser errors', num(sum(FE_ERRORS, e => e.count)), FE_ERRORS.filter(e => e.status === 'Open').length + ' open in Sentry', ''],
    ['Timeout breaches', num(sum(TIMEOUTS, t => t.breaches)), 'Calls that ran past their budget', sum(TIMEOUTS, t => t.breaches) ? 'red' : ''],
    ['Validation rules', num(VALIDATION_CHECKS.length), VALIDATION_CHECKS.filter(v => v.status === 'Pass').length + ' passing', '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join('');

  el('feGrid').innerHTML = [
    chartBox({title:'Round-trip latency by origin', sub:'p95 in milliseconds', value:num(Math.max(...FE_CONNECTIONS.map(c => c.p95))) + ' ms',
      chart: chart({type:'bar', cats:FE_CONNECTIONS.map(c => c.name.split(' to ')[0]), h:190,
        series:[{name:'p95 ms', data:FE_CONNECTIONS.map(c => c.p95), colour:'#2F6FED'}]})}),
    chartBox({title:'Failed requests by code', sub:'Where the calls died', value:num(sum(FAILED_REQUESTS, r => r.count)),
      chart: chart({type:'donut', cats:['502','400','500','429','403','504'], h:190, colours:PALETTE,
        series:[{data:['502','400','500','429','403','504'].map(c => sum(FAILED_REQUESTS.filter(r => String(r.code) === c), r => r.count))}]})}),
    chartBox({title:'Requests against budget', sub:'p95 as a share of the timeout', value:num(TIMEOUTS.length) + ' routes',
      chart: chart({type:'bar', cats:TIMEOUTS.map(t => t.route.split('/')[1] || 'root'), h:190,
        series:[{name:'% of budget', data:TIMEOUTS.map(t => Math.round(pct(t.p95, t.limit) * 10) / 10), colour:'#C9A227'}]})})
  ].join('');

  el('fcPill').className = 'badge ' + (bad.length ? 'b-warn' : 'b-ok');
  el('fcPill').textContent = FE_CONNECTIONS.length + ' origins';
  renderTable('fcBody', [
    {k:'name', label:'Connection'}, {k:'origin', label:'Origin'}, {k:'target', label:'Target'},
    {k:'p95', label:'p95 (ms)', num:true}, {k:'errors', label:'Errors', num:true},
    {k:'status', label:'Status', html:v => okBadge(v)},
    {k:'act', label:'', html:(v, r) => `<button class="btn btn-ghost" data-fetest="${esc(r.name)}">Test</button>`}
  ], FE_CONNECTIONS, {sort:'errors', pageSize:5});

  renderTable('cfgBody', [
    {k:'key', label:'Variable'}, {k:'value', label:'Value'},
    {k:'env', label:'Environment'},
    {k:'status', label:'State', html:v => okBadge(v)}
  ], FE_CONFIG, {sort:'key', pageSize:7});

  el('valPill').className = 'badge ' + (VALIDATION_CHECKS.some(v => v.status !== 'Pass') ? 'b-warn' : 'b-ok');
  el('valPill').textContent = VALIDATION_CHECKS.filter(v => v.status === 'Pass').length + '/' + VALIDATION_CHECKS.length + ' pass';
  el('valBox').innerHTML = VALIDATION_CHECKS.map(v => `<div class="checkrow">
      <div class="ck ${v.status === 'Pass' ? 'pass' : 'warn'}">${v.status === 'Pass' ? '✓' : '!'}</div>
      <div style="flex:1"><div style="font-size:10px;font-weight:800">${esc(v.scope)} · ${esc(v.rule)}</div>
        <div class="qhint">${esc(v.note)}</div></div>
      <div>${okBadge(v.status)}</div>
    </div>`).join('');

  renderTable('toBody', [
    {k:'route', label:'Route'}, {k:'p50', label:'p50 (ms)', num:true}, {k:'p95', label:'p95 (ms)', num:true},
    {k:'limit', label:'Budget (ms)', num:true}, {k:'breaches', label:'Breaches', num:true},
    {k:'verdict', label:'Verdict', html:(v, r) => okBadge(r.breaches > 5 ? 'Fail' : r.breaches > 0 ? 'Review' : 'Pass')}
  ], TIMEOUTS, {sort:'breaches', pageSize:7});

  el('frPill').className = 'badge ' + (FAILED_REQUESTS.some(r => r.status === 'Open') ? 'b-warn' : 'b-ok');
  el('frPill').textContent = num(sum(FAILED_REQUESTS, r => r.count)) + ' failed';
  renderTable('frBody', [
    {k:'when', label:'When', html:v => String(v).slice(0, 10) === TODAY ? 'Today ' + String(v).slice(11) : fmtDate(v)},
    {k:'route', label:'Route'}, {k:'code', label:'Code', num:true}, {k:'origin', label:'Called from'},
    {k:'count', label:'Count', num:true},
    {k:'status', label:'Status', html:v => okBadge(v)}
  ], FAILED_REQUESTS, {sort:'count', pageSize:6});

  el('feerrPill').className = 'badge ' + (FE_ERRORS.some(e => e.status === 'Open') ? 'b-warn' : 'b-ok');
  el('feerrPill').textContent = num(sum(FE_ERRORS, e => e.count)) + ' captured';
  renderTable('feerrBody', [
    {k:'when', label:'When', html:v => String(v).slice(0, 10) === TODAY ? 'Today ' + String(v).slice(11) : fmtDate(v)},
    {k:'page', label:'Page'}, {k:'message', label:'Message'},
    {k:'count', label:'Count', num:true},
    {k:'status', label:'Status', html:v => okBadge(v)}
  ], FE_ERRORS, {sort:'count', pageSize:6});

  el('feTestBox').innerHTML = FE_TESTS.map(t => `<div class="checkrow">
      <div class="ck ${t.result === 'Pass' ? 'pass' : 'fail'}">${t.result === 'Pass' ? '✓' : '✕'}</div>
      <div style="flex:1"><div style="font-size:10px;font-weight:800">${esc(t.origin)} · ${esc(t.test)}</div>
        <div class="qhint">${fmtDate(t.when)} · ${t.ms} ms</div></div>
      <div>${okBadge(t.result)}</div>
    </div>`).join('');
}
function testFrontendOrigin(name){
  const c = FE_CONNECTIONS.find(x => x.name === name);
  if(!c) return;
  c.errors = Math.max(0, c.errors + (Math.random() < 0.5 ? -1 : 1));
  c.p95 = Math.max(80, c.p95 + Math.round(Math.random() * 30) - 15);
  c.status = c.p95 > 260 || c.errors > 8 ? 'Degraded' : 'Connected';
  renderFrontend(); renderStats();
  toast(name + ' · ' + c.status + ' · p95 ' + c.p95 + ' ms', c.status === 'Connected' ? 'ok' : 'info');
}
function runFeSuite(){
  FE_TESTS.forEach(t => { t.when = TODAY; t.ms = Math.max(40, t.ms + Math.round(Math.random() * 20) - 10); });
  const portal = FE_CONNECTIONS.find(c => /Customer portal/.test(c.name));
  const failing = !!(portal && portal.status === 'Degraded');
  FE_TESTS.filter(t => /Customer portal/.test(t.origin)).forEach(t => { t.result = failing ? 'Fail' : 'Pass'; });
  renderFrontend();
  toast('Frontend suite: ' + FE_TESTS.filter(t => t.result === 'Pass').length + ' of ' + FE_TESTS.length + ' pass');
}

/* ===================== 11 · WEBSITE FORMS ===================== */
function renderForms(){
  const bad = FORMS.filter(f => f.status !== 'Connected');
  el('formPill').className = 'badge ' + (bad.length ? 'b-warn' : 'b-ok');
  el('formPill').textContent = FORMS.filter(f => f.status === 'Connected').length + ' of ' + FORMS.length + ' connected';
  el('formKpis').innerHTML = [
    ['Forms wired', num(FORMS.length), 'Contact, register, apply, calculator, repay', ''],
    ['Submissions (30 days)', num(sum(FORMS, f => f.submissions)), 'Across every form', ''],
    ['Forms degraded', num(bad.length), bad.map(f => f.name).join(', ') || 'None', bad.length ? 'red' : ''],
    ['Validation', FORMS.filter(f => f.validation === 'Pass').length + ' of ' + FORMS.length, 'All five refuse bad input', ''],
    ['Submission errors (7 d)', num(sum(FORMS, f => f.errors7d)), FORM_ERRORS.filter(e => e.status === 'Open').length + ' groups open', ''],
    ['Last submission', 'Today 07:55', 'Repayment submission from Lilongwe', '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join('');

  el('formGrid').innerHTML = [
    chartBox({title:'Submissions by form', sub:'The last thirty days', value:num(sum(FORMS, f => f.submissions)),
      chart: chart({type:'bar', cats:FORMS.map(f => f.name.split(' ')[0]), h:190,
        series:[{name:'Submissions', data:FORMS.map(f => f.submissions), colour:'#2F6FED'}]})}),
    chartBox({title:'Daily submissions', sub:'Fourteen days, contact, register and apply', value:num(sum(FORM_DAILY, d => d.contact + d.register + d.apply)),
      chart: chart({type:'line', cats:FORM_DAILY.map(d => d.date.slice(5)), h:190,
        series:[{name:'Contact', data:FORM_DAILY.map(d => d.contact), colour:'#C9A227'},
                {name:'Register', data:FORM_DAILY.map(d => d.register), colour:'#1E9E6A'},
                {name:'Apply', data:FORM_DAILY.map(d => d.apply), colour:'#2F6FED'}]})}),
    chartBox({title:'Errors by form', sub:'What the forms refused', value:num(sum(FORM_ERRORS, e => e.count)),
      chart: chart({type:'donut', cats:[...new Set(FORM_ERRORS.map(e => e.form))], h:190, colours:PALETTE,
        series:[{data:[...new Set(FORM_ERRORS.map(e => e.form))].map(f => sum(FORM_ERRORS.filter(e => e.form === f), e => e.count))}]})})
  ].join('');

  el('formRowPill').textContent = FORMS.length + ' forms';
  renderTable('formBody', [
    {k:'name', label:'Form'}, {k:'endpoint', label:'Endpoint'},
    {k:'submissions', label:'Submissions', num:true}, {k:'errors7d', label:'Errors (7 d)', num:true},
    {k:'status', label:'Status', html:v => okBadge(v)},
    {k:'act', label:'', html:(v, r) => `<button class="btn btn-ghost" data-formtest="${esc(r.name)}">Send test</button>`}
  ], FORMS, {sort:'errors7d', pageSize:6});

  el('valStatusBox').innerHTML = [
    {form: 'Contact form', rules: 'Name, phone, message ≥ 20 characters', rejects: '3 spam attempts today', state: 'Pass'},
    {form: 'Customer registration', rules: 'Phone, national ID checksum, date of birth', rejects: '2 duplicate phones', state: 'Pass'},
    {form: 'Loan application', rules: 'Amount, product, employer, consent, ID upload', rejects: '5 unreadable IDs', state: 'Pass'},
    {form: 'Loan calculator', rules: 'Amount and term inside the product rules', rejects: '0 — client-side only', state: 'Pass'},
    {form: 'Repayment submission', rules: 'Receipt reference, amount, rail, proof', rejects: '1 reused reference', state: 'Pass'}
  ].map(v => `<div class="checkrow"><div class="ck pass">✓</div>
      <div style="flex:1"><div style="font-size:10px;font-weight:800">${esc(v.form)}</div>
      <div class="qhint">${esc(v.rules)} · ${esc(v.rejects)}</div></div>${okBadge(v.state)}</div>`).join('');

  el('subPill').textContent = num(sum(FORM_DAILY, d => d.contact + d.register + d.apply + d.repay)) + ' in 14 days';
  el('subBox').innerHTML = `<div class="strip">
      ${[['Contact', sum(FORM_DAILY, d => d.contact)], ['Register', sum(FORM_DAILY, d => d.register)],
         ['Apply', sum(FORM_DAILY, d => d.apply)], ['Calculator quotes', sum(FORM_DAILY, d => d.quote)],
         ['Repayments', sum(FORM_DAILY, d => d.repay)]]
        .map(([l, v]) => `<div><div class="sl">${l}</div><div class="sv">${num(v)}</div></div>`).join('')}
    </div>
    <div class="qhint" style="margin-top:7px">Repayment and application submissions land in the same tables the repayments and applications modules read.</div>`;

  el('ferrPill').className = 'badge ' + (FORM_ERRORS.some(e => e.status === 'Open') ? 'b-warn' : 'b-ok');
  el('ferrPill').textContent = num(sum(FORM_ERRORS, e => e.count)) + ' errors';
  renderTable('ferrBody', [
    {k:'when', label:'When', html:v => String(v).slice(0, 10) === TODAY ? 'Today ' + String(v).slice(11) : fmtDate(v)},
    {k:'form', label:'Form'}, {k:'field', label:'Field'}, {k:'reason', label:'Reason'},
    {k:'count', label:'Count', num:true},
    {k:'status', label:'Status', html:v => okBadge(v)}
  ], FORM_ERRORS, {sort:'count', pageSize:6});
}
function testForm(name){
  const f = FORMS.find(x => x.name === name);
  if(!f) return;
  f.submissions += 1;
  f.last = TODAY + ' ' + new Date().toTimeString().slice(0, 5);
  if(name === 'Loan application form'){
    const failing = API_ENDPOINTS.find(e => e.path === '/applications');
    f.status = failing && failing.status === 'Degraded' ? 'Degraded' : 'Connected';
    if(f.status === 'Degraded') f.errors7d += 1;
  }
  renderForms(); renderStats();
  toast('Test submission accepted by ' + name + (f.status === 'Degraded' ? ' — the endpoint is still degraded' : ''),
    f.status === 'Connected' ? 'ok' : 'info');
}

/* ===================== 12 · FILES AND MEDIA ===================== */
function renderMedia(){
  const missing = MISSING_FILES.filter(m => m.status === 'Missing');
  const unoptimised = IMAGES.filter(i => !i.optimised);
  el('mediaPill').className = 'badge ' + (missing.length ? 'b-warn' : 'b-ok');
  el('mediaPill').textContent = IMAGES.length + ' images tracked';
  el('mediaKpis').innerHTML = [
    ['Images in the library', num(IMAGES.length), unoptimised.length + ' not optimised', unoptimised.length ? 'red' : ''],
    ['Brand assets', num(BRAND_ASSETS.length), 'Logos, icons and the guideline', ''],
    ['Documents stored', num(DOCUMENTS.length), 'KYC, templates and reports', ''],
    ['Storage used', num(sum(STORAGE_USAGE, b => b.size)) + ' MB', 'Of 100 GB included in the plan', ''],
    ['Missing files', num(missing.length), missing.map(m => m.path.split('/').pop()).join(', ') || 'None', missing.length ? 'red' : ''],
    ['Buckets', num(FILE_ACCESS.length), FILE_ACCESS.filter(b => !b.public).length + ' private', '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join('');

  el('mediaGrid').innerHTML = [
    chartBox({title:'Storage by bucket', sub:'Megabytes in use', value:num(sum(STORAGE_USAGE, b => b.size)) + ' MB',
      chart: chart({type:'donut', cats:STORAGE_USAGE.map(b => b.bucket), h:190, colours:PALETTE,
        series:[{data:STORAGE_USAGE.map(b => b.size)}]})}),
    chartBox({title:'Files per bucket', sub:'Count of stored objects', value:num(sum(STORAGE_USAGE, b => b.files)),
      chart: chart({type:'bar', cats:STORAGE_USAGE.map(b => b.bucket), h:190,
        series:[{name:'Files', data:STORAGE_USAGE.map(b => b.files), colour:'#1E9E6A'}]})}),
    chartBox({title:'Images by folder', sub:'Where the library is kept', value:num(IMAGES.length),
      chart: chart({type:'bar', cats:[...new Set(IMAGES.map(i => i.folder))], h:190,
        series:[{name:'Images', data:[...new Set(IMAGES.map(i => i.folder))].map(f => IMAGES.filter(i => i.folder === f).length), colour:'#C9A227'}]})})
  ].join('');

  el('imgPill').className = 'badge ' + (unoptimised.length ? 'b-warn' : 'b-ok');
  el('imgPill').textContent = IMAGES.length + ' images · ' + unoptimised.length + ' heavy';
  el('imgGrid').innerHTML = IMAGES.map((im, i) => {
    const cls = ['', 'alt', 'alt2', 'alt3'][i % 4];
    return `<div class="thumb"><div class="tv ${cls}"><b>${esc(im.folder.replace('/images/', ''))}</b></div>
      <div class="ti"><div class="tn" title="${esc(im.name)}">${esc(im.name)}</div>
        <div class="tm">${esc(im.size)} · used ${im.used}×${im.optimised ? '' : ' · not optimised'}</div></div></div>`;
  }).join('');

  renderTable('brandAssetBody', [
    {k:'name', label:'Asset'}, {k:'kind', label:'Kind'}, {k:'size', label:'Size'},
    {k:'version', label:'Version'}, {k:'updated', label:'Updated', html:v => fmtDate(v)}
  ], BRAND_ASSETS, {sort:'updated', pageSize:5});

  el('docPill').className = 'badge ' + (DOCUMENTS.some(d => d.scans === 'Missing') ? 'b-warn' : 'b-ok');
  el('docPill').textContent = DOCUMENTS.filter(d => d.scans === 'Clean').length + ' of ' + DOCUMENTS.length + ' clean';
  renderTable('docBody', [
    {k:'name', label:'File'}, {k:'bucket', label:'Bucket'}, {k:'size', label:'Size'},
    {k:'access', label:'Access'},
    {k:'scans', label:'Scan', html:v => okBadge(v === 'Clean' ? 'Pass' : v === 'Missing' ? 'Missing' : 'Review')}
  ], DOCUMENTS, {sort:'name', pageSize:6});

  const kycRows = CUSTOMERS.slice(0, 6).map(c => ({cust: c.id, name: c.name,
    files: 1 + (Number(String(c.id).slice(-2)) % 3), bucket: 'kyc', status: 'Stored'}));
  el('docStoreBox').innerHTML = `<div class="pfields" style="grid-template-columns:1fr 1fr">
      ${kvRow('KYC bucket', kycRows.length + ' customers with files')}
      ${kvRow('Files on record', num(sum(kycRows, r => r.files)))}
      ${kvRow('Signed URL life', '60 seconds')}
      ${kvRow('Scanning', 'ClamAV before the file is served')}
      ${kvRow('Encryption', 'At rest, AES-256')}
      ${kvRow('Retention', 'Seven years after the facility closes')}
    </div>
    <div class="strip" style="margin-top:9px">
      ${kycRows.slice(0, 4).map(r => `<div><div class="sl">${esc(r.name.split(' ')[0])}</div><div class="sv">${r.files}</div></div>`).join('')}
    </div>`;

  el('uploadBox').innerHTML = UPLOAD_CFG.map(u => `<div class="checkrow">
      <div class="ck pass">✓</div>
      <div style="flex:1"><div style="font-size:10px;font-weight:800">${esc(u.rule)}</div>
        <div class="qhint">${esc(u.note)}</div></div>
      <div style="font-size:9.5px;font-weight:800;color:var(--gold-dark)">${esc(u.value)}</div>
    </div>`).join('');

  renderTable('faBody', [
    {k:'bucket', label:'Bucket'}, {k:'read', label:'Who can read'},
    {k:'write', label:'Who can write'},
    {k:'public', label:'Public', html:v => okBadge(v ? 'No' : 'Enabled')}
  ], FILE_ACCESS, {sort:'bucket', pageSize:5});

  el('storePill').textContent = num(sum(STORAGE_USAGE, b => b.size)) + ' MB used';
  el('storageBox').innerHTML = `<div class="strip">
      ${STORAGE_USAGE.map(b => `<div><div class="sl">${esc(b.bucket)}</div><div class="sv">${b.size} MB</div></div>`).join('')}
    </div>
    <div style="margin-top:9px">${meter('Storage against the plan', pct(sum(STORAGE_USAGE, b => b.size), 102400), 40, 20,
      num(sum(STORAGE_USAGE, b => b.size)) + ' MB of 100 GB used')}</div>`;

  el('missPill').className = 'badge ' + (missing.length ? 'b-crit' : 'b-ok');
  el('missPill').textContent = missing.length + ' missing';
  renderTable('missBody', [
    {k:'path', label:'File'}, {k:'referenced', label:'Referenced by'},
    {k:'status', label:'Status', html:v => okBadge(v)},
    {k:'since', label:'Since', html:v => fmtDate(v)},
    {k:'act', label:'', html:(v, r) => `<button class="btn btn-ghost" data-missfix="${esc(r.path)}">${r.status === 'Missing' ? 'Restore' : 'Purge'}</button>`}
  ], MISSING_FILES, {sort:'since', pageSize:5});
}
function fixMissing(path){
  const m = MISSING_FILES.find(x => x.path === path);
  if(!m) return;
  const was = m.status;
  m.status = was === 'Missing' ? 'Restored' : 'Purged';
  m.since = TODAY;
  if(was === 'Missing'){
    DOCUMENTS.forEach(d => { if(path.indexOf(d.name) >= 0) d.scans = 'Clean'; });
    PAGES.forEach(p => { if(p.path === m.referenced) p.errors = Math.max(0, p.errors - 1); });
  }
  logChange('Content', 'Asset ' + m.path.split('/').pop(), was, m.status);
  renderMedia(); renderPages(); renderChanges();
  toast(m.path.split('/').pop() + ' ' + m.status.toLowerCase());
}
</script>
