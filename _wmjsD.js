<script>
/* ============================================================
   WEBSITE MANAGEMENT & CONNECTIONS (4/7)
   1 · Overview   2 · Public website   3 · Content   4 · Pages
   ============================================================ */

function chartBox(o){
  return `<div class="chartcard">
    <div class="ch">
      <div><div class="ct">${esc(o.title)}</div><div class="cs">${esc(o.sub || '')}</div></div>
      ${o.value !== undefined ? `<div class="cv">${o.value}</div>` : ''}
    </div>
    ${o.chart || ''}
    ${o.note ? `<div class="qhint">${o.note}</div>` : ''}
  </div>`;
}
function meter(label, value, good, ok, hint){
  const cls = value >= good ? 'ok' : value >= ok ? 'warn' : 'bad';
  return `<div class="meter">
    <div class="mt"><div>${esc(label)}</div><span>${r1(value)}${/%$/.test(String(value)) ? '' : '%'}</span></div>
    <div class="mbar"><i class="${cls}" style="width:${clamp(value, 0, 100).toFixed(1)}%"></i></div>
    <div class="qhint" style="margin-top:1px">${esc(hint)}</div>
  </div>`;
}
const kvRow = (k, v) => `<div class="kvrow"><span>${esc(k)}</span><b>${v}</b></div>`;
const stackRow = (label, sub, action, go) => `<div class="risk">
    <div><div class="rn">${esc(label)}</div><div class="rs">${esc(sub)}</div></div>
    <div class="rv">${go ? `<button class="btn btn-ghost" data-goto="${go}">${esc(action)}</button>` : esc(action)}</div>
  </div>`;
const okBadge = v => badge(v, /^(Pass|Set|OK|Healthy|Connected|Live|Published|Propagated|Approved|Valid|Enabled|Cleared|Done|Success|Completed|Ready|Delivered|Applied|Optimised|Current)$/i.test(String(v))
  ? 'b-ok' : /^(Review|Degraded|Warning|Pending|Monitoring|Draft|Expiring|Slow|Redirect|Superseded|Partial|Queued|In review|Awaiting approval|Proposed|Building)$/i.test(String(v))
  ? 'b-warn' : /^(Fail|Failed|Failing|Broken|Expired|Missing|Critical|Open|Hidden|Rolled back|Vulnerable|Down|Offline)$/i.test(String(v))
  ? 'b-crit' : 'b-gray');
const statusCell = (name, value, sub) => `<div class="statuscell">
    <div class="scn">${esc(name)}</div>
    <div class="scv">${okBadge(value)}</div>
    <div class="scs">${esc(sub)}</div>
  </div>`;

/* ===================== 1 · WEBSITE OVERVIEW ===================== */
function renderOverview(){
  const s = wmStats();
  el('bandScore').textContent = s.score + '%';
  el('bandUptime').textContent = r1(s.up) + '%';
  el('bandApis').textContent = num(API_ENDPOINTS.length);
  el('bandAlerts').textContent = num(s.openAlerts.length);
  el('ovStamp').textContent = 'Last refresh — ' + lastRefresh();
  el('ovStatusPill').className = 'badge ' + (s.score >= 90 ? 'b-ok' : s.score >= 75 ? 'b-warn' : 'b-crit');
  el('ovStatusPill').textContent = s.score >= 90 ? 'All systems connected' : s.score >= 75 ? 'Degraded' : 'At risk';

  const lastGood = DIAG_TESTS.filter(t => t.status === 'Pass').length;
  el('wmKpis').innerHTML = [
    ['Connection score', s.score + '%', (s.score >= 90 ? 'Every check inside budget' : s.score >= 75 ? 'Broken wires in two places' : 'Several connections down'), 'gold'],
    ['Public website availability', r1(s.up) + '%', `${num(s.downMin)} minutes down in fourteen days`, s.up >= 99.9 ? '' : 'red'],
    ['Admin portal', 'Online', 'portal.goldenloan.mw · 200 OK in 142 ms', ''],
    ['Backend server', BACKEND.status, `${BACKEND.instances} instances · ${BACKEND.region}`, ''],
    ['Supabase connection', 'Healthy', `${SUPA.engine} · ${SUPA.latency} round trip`, ''],
    ['API health', `${API_ENDPOINTS.filter(e => e.status === 'Healthy').length} of ${API_ENDPOINTS.length}`, `${num(s.endpointsDown.length)} route failing, ${num(API_ENDPOINTS.filter(e => e.status === 'Degraded').length)} degraded`, s.endpointsDown.length ? 'red' : ''],
    ['Last successful connection', '08:10', `${lastGood} of ${DIAG_TESTS.length} probes passed on the last sweep`, ''],
    ['Open connection alerts', num(s.openAlerts.length), `${num(s.critical.length)} critical, ${num(failingCount())} integration failing`, s.openAlerts.length ? 'red' : ''],
    ['Services connected', `${INTEGRATIONS.filter(i => i.status === 'Connected').length} of ${INTEGRATIONS.length}`, s.failing.length + ' degraded or down', ''],
    ['Database tables without RLS', num(s.rlsGap.length), s.rlsGap.length ? s.rlsGap.map(t => t.table).join(', ') : 'Every table is protected', s.rlsGap.length ? 'red' : '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join('');

  el('ovMeters').innerHTML = [
    meter('Website uptime', s.up, 99.9, 99.0, `${r1(s.up)}% over 14 days · ${num(s.downMin)} minutes down`),
    meter('Backend health', 100 - clamp(BACKEND.memory - 50, 0, 50), 85, 70, `Memory at ${BACKEND.memory}%, ${BACKEND.instances} instances up`),
    meter('Database connectivity', pct(TABLES.filter(t => t.rls === 'Enabled').length, TABLES.length), 95, 80, `${TABLES.filter(t => t.rls === 'Enabled').length} of ${TABLES.length} tables with a policy`),
    meter('Authentication services', pct(AUTH_SERVICES.filter(a => a.status === 'Healthy').length, AUTH_SERVICES.length), 90, 75, `${AUTH_SERVICES.filter(a => a.status !== 'Healthy').length} services degraded`),
    meter('Integration reach', pct(INTEGRATIONS.filter(i => i.status === 'Connected').length, INTEGRATIONS.length), 90, 75, `${s.failing.length} of ${INTEGRATIONS.length} services degraded or failing`),
    meter('API success rate', pct(API_ENDPOINTS.filter(e => e.status === 'Healthy').length, API_ENDPOINTS.length), 90, 75, `${num(sum(API_ENDPOINTS, e => e.errors))} errors across ${num(sum(API_ENDPOINTS, e => e.calls))} calls`)
  ].join('');

  el('ovConnPill').className = 'badge ' + (s.failing.length ? 'b-warn' : 'b-ok');
  el('ovConnPill').textContent = s.failing.length ? 'Degraded' : 'All connected';
  el('connGrid').innerHTML = [
    statusCell('Public website', WM_SITE.published ? 'Live' : 'Offline', 'goldenloan.mw · 118 ms'),
    statusCell('Admin portal', 'Live', 'portal.goldenloan.mw · 142 ms'),
    statusCell('Backend API', BACKEND.status, `${BACKEND.instances} instances · fra1`),
    statusCell('Supabase', 'Connected', `${SUPA.region} · ${SUPA.latency}`),
    statusCell('API routes', `${API_ENDPOINTS.filter(e => e.status === 'Healthy').length}/${API_ENDPOINTS.length}`, 'healthy right now'),
    statusCell('Authentication', 'Healthy', `${AUTH_SERVICES.length} services probed`),
    statusCell('Storage', 'Connected', `${sum(STORAGE_USAGE, b => b.size)} MB in five buckets`),
    statusCell('Integrations', s.failing.length ? 'Degraded' : 'Connected', `${s.failing.length} need attention`)
  ].join('');

  el('ovGrid').innerHTML = [
    chartBox({title:'Uptime by day', sub:'Fourteen days of monitor results', value:r1(s.up) + '%',
      chart: chart({type:'line', cats:UPTIME.map(u => u.date.slice(5)), h:190,
        series:[{name:'Uptime %', data:UPTIME.map(u => u.uptime), colour:'#1E9E6A'}]})}),
    chartBox({title:'Requests per hour', sub:'Today, from 08:00', value:num(sum(TRAFFIC, t => t.requests)),
      chart: chart({type:'bar', cats:TRAFFIC.map(t => t.hour), h:190,
        series:[{name:'Requests', data:TRAFFIC.map(t => t.requests), colour:'#2F6FED'},
                {name:'Errors', data:TRAFFIC.map(t => t.errors), colour:'#D93F3F'}]})}),
    chartBox({title:'Errors by area', sub:'Server, frontend and form errors', value:num(s.connErrors),
      chart: chart({type:'donut', cats:['Backend','Website','Auth','Integrations','Storage'], h:190, colours:PALETTE,
        series:[{data:['Backend','Website','Auth','Integrations','Storage'].map(l =>
          sum(SERVER_ERRORS.concat(FE_ERRORS, FORM_ERRORS).filter(e => e.lane === l), e => e.count))}]})})
  ].join('');

  const alerts = ALERTS.filter(a => a.status === 'Open').slice(0, 5);
  el('ovAlertPill').textContent = ALERTS.filter(a => a.status === 'Open').length;
  el('ovAlerts').innerHTML = alerts.map(a => `<div class="risk">
      <div><div class="rn">${esc(a.kind)}</div><div class="rs">${esc(a.target)} · ${esc(a.id)} · ${fmtDate(a.raised)}</div></div>
      <div class="rv">${badge(a.severity, sevTone(a.severity))}
        <button class="btn btn-ghost" data-goto="s16">Open</button></div>
    </div>`).join('') || '<div class="empty">Nothing open — every connection is inside budget.</div>';

  const good = DIAG_TESTS.filter(t => t.status === 'Pass');
  el('ovFeed').innerHTML = `<div class="pfields" style="grid-template-columns:1fr 1fr">
      ${kvRow('Public website', WM_SET.publicUrl + ' · 200 OK')}
      ${kvRow('Admin portal', WM_SET.adminUrl + ' · 200 OK')}
      ${kvRow('Backend health', '/healthz · 61 ms · 3 of 3')}
      ${kvRow('Supabase', SUPA.project + ' · ' + SUPA.latency)}
      ${kvRow('Probes passed', good.length + ' of ' + DIAG_TESTS.length)}
      ${kvRow('Last sweep', '30 Oct 2026 · 08:10')}
    </div>
    <div class="minihead" style="margin-top:10px">Checks that passed</div>
    ${good.map(t => `<div class="checkrow"><div class="ck pass">✓</div>
      <div style="flex:1"><div style="font-size:10px;font-weight:800">${esc(t.name)}</div>
      <div class="qhint">${esc(t.detail)}</div></div>
      <div style="font-size:9.5px;color:var(--muted)">${num(t.ms)} ms</div></div>`).join('')}`;
}
function failingCount(){ return INTEGRATIONS.filter(i => i.status !== 'Connected').length; }

/* ===================== 2 · PUBLIC WEBSITE MANAGEMENT ===================== */
function renderSite(){
  el('sitePill').className = 'badge ' + (WM_SITE.published ? 'b-ok' : 'b-crit');
  el('sitePill').textContent = WM_SITE.published ? 'Published' : 'Unpublished';
  el('siteKpis').innerHTML = [
    ['Website status', WM_SITE.published ? 'Published' : 'Unpublished', 'Version ' + WM_SET.version + ' · built ' + fmtDate(WM_SITE.publishedOn), WM_SITE.published ? '' : 'red'],
    ['Pages live', num(PAGES.filter(p => p.visibility === 'Public').length), 'Of ' + PAGES.length + ' in the directory', ''],
    ['Navigation items', num(WM_NAV.filter(n => n.visible).length), WM_NAV.filter(n => !n.visible).length + ' hidden from the menu', ''],
    ['Homepage sections', num(WM_SECTIONS.filter(s => s.on).length) + ' on', WM_SECTIONS.filter(s => !s.on).length + ' switched off', ''],
    ['Active theme', WM_SITE.theme, 'Accent ' + WM_SITE.accent, ''],
    ['Brand assets in use', WM_SITE.logo, WM_SITE.logoVariant, '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join('');

  /* ---- branding ---- */
  const theme = WM_THEMES.find(t => t.name === WM_SITE.theme) || WM_THEMES[0];
  el('themePill').className = 'badge b-gray';
  el('themePill').textContent = WM_SITE.theme;
  el('brandBox').innerHTML = `
    <div class="form-grid">
      <div class="fg"><label>Logo</label><select id="brandLogo">${WM_LOGOS.map(l =>
        `<option${l === WM_SITE.logo ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select></div>
      <div class="fg"><label>Logo variant</label><select id="brandVariant">
        <option${WM_SITE.logoVariant === 'Gold on charcoal' ? ' selected' : ''}>Gold on charcoal</option>
        <option${WM_SITE.logoVariant === 'Charcoal on gold' ? ' selected' : ''}>Charcoal on gold</option>
        <option${WM_SITE.logoVariant === 'White on photo' ? ' selected' : ''}>White on photo</option></select></div>
      <div class="fg"><label>Typeface</label><select id="brandFont">
        <option${WM_SITE.font === 'Inter / system stack' ? ' selected' : ''}>Inter / system stack</option>
        <option${WM_SITE.font === 'Source Serif headings' ? ' selected' : ''}>Source Serif headings</option>
        <option${WM_SITE.font === 'Manrope' ? ' selected' : ''}>Manrope</option></select></div>
      <div class="fg"><label>Site name</label><input id="brandName" value="${esc(WM_SITE.name)}" /></div>
    </div>
    <div class="fh" style="margin-top:10px">Theme and colours</div>
    <div class="swatches">${WM_THEMES.map(t => `
      <div class="swatch${t.name === WM_SITE.theme ? ' on' : ''}" data-theme="${esc(t.name)}">
        <i style="background:linear-gradient(135deg,${t.accent},${t.bg})"></i>
        <span>${esc(t.name)}</span><small>${esc(t.note)}</small></div>`).join('')}</div>
    <div class="fh" style="margin-top:10px">Accent colour</div>
    <div class="chips" id="accentChips">${['#C9A227', '#1E9E6A', '#2F6FED', '#D93F3F', '#7C5CF0'].map(c =>
      `<span class="fchip${c === WM_SITE.accent ? ' on' : ''}" data-accent="${c}">
        <i style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${c};margin-right:5px"></i>${c}</span>`).join('')}</div>
    <div class="form-actions">
      <button class="btn btn-gold" id="brandSave">Save branding</button>
      <button class="btn btn-ghost" id="brandReset">Reset to default</button>
    </div>
    <div class="qhint" id="brandNote" style="margin-top:6px">Theme colours are applied to the preview immediately and to the live site on publish.</div>`;

  renderPreview();

  /* ---- homepage sections ---- */
  const onCount = WM_SECTIONS.filter(s => s.on).length;
  el('secPill').textContent = onCount + ' of ' + WM_SECTIONS.length + ' on';
  el('sectionList').innerHTML = WM_SECTIONS.slice().sort((a, b) => a.order - b.order).map(s => `
    <div class="checkrow">
      <div class="ck ${s.on ? 'pass' : 'warn'}">${s.on ? '✓' : '–'}</div>
      <div style="flex:1"><div style="font-size:10.5px;font-weight:800">${esc(s.name)}</div>
        <div class="qhint">${esc(s.note)}</div></div>
      <button class="btn btn-ghost" data-hsec="${esc(s.name)}">${s.on ? 'Turn off' : 'Turn on'}</button>
    </div>`).join('');

  /* ---- navigation ---- */
  el('navPill').textContent = WM_NAV.filter(n => n.visible).length + ' visible';
  el('navList').innerHTML = WM_NAV.slice().sort((a, b) => a.order - b.order).map((n, i) => `
    <div class="pagerow">
      <div class="pnum">${i + 1}</div>
      <div style="flex:1;min-width:0"><div class="pttl">${esc(n.label)}${n.visible ? '' : ' <span class="badge b-gray">hidden</span>'}</div>
        <div class="ppath">${esc(n.path)}</div></div>
      <div class="pact">
        <button class="mini" data-navup="${esc(n.label)}" ${i === 0 ? 'disabled' : ''} title="Move up">↑</button>
        <button class="mini" data-navdown="${esc(n.label)}" ${i === WM_NAV.length - 1 ? 'disabled' : ''} title="Move down">↓</button>
        <button class="mini" data-navtoggle="${esc(n.label)}" title="Show or hide">${n.visible ? '◉' : '◎'}</button>
        <button class="mini" data-navdel="${esc(n.label)}" title="Remove">✕</button>
      </div>
    </div>`).join('');

  /* ---- contact ---- */
  if(el('ctPhone')){
    el('ctPhone').value = WM_CONTACT.phone;
    el('ctWhatsapp').value = WM_CONTACT.whatsapp;
    el('ctEmail').value = WM_CONTACT.email;
    el('ctSupport').value = WM_CONTACT.support;
    el('ctAddress').value = WM_CONTACT.address;
  }
  el('contactNote').textContent = 'Shown in the header strip, the footer and on /contact.';

  renderTable('officeBody', [
    {k:'branch', label:'Branch'}, {k:'address', label:'Address'}, {k:'phone', label:'Phone'},
    {k:'hours', label:'Business hours'}
  ], WM_OFFICES, {pageSize:6});

  /* ---- social ---- */
  const linked = WM_SOCIAL.filter(s => s.linked).length;
  el('socialPill').textContent = linked + ' of ' + WM_SOCIAL.length + ' live';
  el('socialList').innerHTML = WM_SOCIAL.map(s => `<div class="checkrow">
      <div class="ck ${s.linked ? 'pass' : 'warn'}">${s.linked ? '✓' : '–'}</div>
      <div style="flex:1"><div style="font-size:10.5px;font-weight:800">${esc(s.channel)}</div>
        <div class="qhint">${esc(s.handle)}</div></div>
      <button class="btn btn-ghost" data-social="${esc(s.channel)}">${s.linked ? 'Unlink' : 'Link'}</button>
    </div>`).join('');

  /* ---- header and footer ---- */
  el('hfBox').innerHTML = `
    <div class="form-grid">
      <div class="fg"><label>Header style</label><select id="hfHeader">
        ${['Sticky, two-tier with contact strip', 'Sticky, single tier', 'Static with a hero overlay'].map(x =>
          `<option${x === WM_SITE.headerStyle ? ' selected' : ''}>${esc(x)}</option>`).join('')}</select></div>
      <div class="fg"><label>Footer style</label><select id="hfFooter">
        ${['Four columns with regulator line', 'Three columns, compact', 'Single row with legal links'].map(x =>
          `<option${x === WM_SITE.footerStyle ? ' selected' : ''}>${esc(x)}</option>`).join('')}</select></div>
    </div>
    <div class="pfields" style="grid-template-columns:1fr 1fr;margin-top:9px">
      ${kvRow('Announcement bar', 'Airtel Money and TNM Mpamba accepted at every branch')}
      ${kvRow('Regulator line', 'Licensed by the Reserve Bank of Malawi')}
      ${kvRow('Legal links', 'Terms · Privacy · Complaints')}
      ${kvRow('Copyright', '© 2026 Golden Financial Services')}
    </div>
    <div class="form-actions"><button class="btn btn-gold" id="hfSave">Save header and footer</button></div>`;

  /* ---- publish ---- */
  el('publishState').className = 'badge ' + (WM_SITE.published ? 'b-ok' : 'b-crit');
  el('publishState').textContent = WM_SITE.published ? 'Live' : 'Maintenance mode';
  el('publishBox').innerHTML = [
    field('Live version', esc(WM_SET.version)),
    field('Last published', fmtDate(WM_SITE.publishedOn)),
    field('Published by', esc(staffName('STF-009'))),
    field('Pending changes', num(WM_SECTIONS.filter(s => !s.on).length + CONTENT.filter(c => c.status !== 'Published').length) + ' draft items'),
    field('CDN cache', WM_SET.cacheTtl + ' s TTL · 310 PoPs'),
    field('Site mode', WM_SET.maintenance ? 'Maintenance' : 'Public')
  ].join('');
}

function renderPreview(){
  const theme = WM_THEMES.find(t => t.name === WM_SITE.theme) || WM_THEMES[0];
  const dark = theme.id !== 'daylight';
  const liveNav = WM_NAV.filter(n => n.visible).sort((a, b) => a.order - b.order).slice(0, 5);
  const heroOn = (WM_SECTIONS.find(s => s.name.indexOf('Hero') === 0) || {}).on;
  const cardsOn = (WM_SECTIONS.find(s => s.name.indexOf('Loan products') === 0) || {}).on;
  el('previewBox').innerHTML = `<div class="sitepreview${dark ? '' : ' light'}">
      <div class="sp-bar"><span class="sp-dot"></span><span class="sp-dot"></span><span class="sp-dot"></span>
        <span class="sp-url">${esc(WM_SET.publicUrl.replace('https://', ''))}</span></div>
      <div class="sp-body" style="background:${dark ? theme.bg : '#FFFFFF'};color:${dark ? '#F6F7F9' : '#14161C'}">
        <div class="sp-nav">${liveNav.map(n => `<span>${esc(n.label)}</span>`).join('')}</div>
        ${heroOn ? `<div class="sp-hero">${esc(WM_SITE.tagline)}</div>
          <div class="sp-sub">${esc(WM_SITE.name)} · ${esc(WM_CONTACT.phone)} · ${esc(WM_CONTACT.address)}</div>
          <span class="sp-cta" style="background:${theme.accent};color:#14161C">Apply for a loan</span>` : '<div class="sp-sub" style="margin-top:14px">Hero section is switched off.</div>'}
        ${cardsOn ? `<div class="sp-cards">
          ${PRODUCTS.slice(0, 3).map(p => `<div class="sp-card"></div>`).join('')}</div>` : ''}
        <div class="sp-sub" style="margin-top:11px;font-size:8.5px;opacity:.6">
          ${esc(WM_SITE.logo)} · ${esc(WM_SITE.logoVariant)} · theme ${esc(WM_SITE.theme)}</div>
      </div>
    </div>`;
}

/* ===================== 3 · WEBSITE CONTENT MANAGEMENT ===================== */
let EDITING = 'about';
function contentRows(){
  return CONTENT.filter(c => passLane(c) && passSeverity(c) && inRange(c.updated) && matchQ(c.title, c.type, c.status));
}
function renderContent(){
  const rows = contentRows();
  const published = CONTENT.filter(c => c.status === 'Published').length;
  el('contentPill').className = 'badge ' + (CONTENT.some(c => c.status === 'Draft') ? 'b-warn' : 'b-ok');
  el('contentPill').textContent = published + ' of ' + CONTENT.length + ' published';
  el('contentKpis').innerHTML = [
    ['Content items', num(CONTENT.length), 'Pages, feeds and legal documents', ''],
    ['Published', num(published), CONTENT.filter(c => c.status === 'Review').length + ' awaiting approval', ''],
    ['Draft or in review', num(CONTENT.filter(c => c.status !== 'Published').length), 'Held back from the live site', CONTENT.filter(c => c.status !== 'Published').length ? 'red' : ''],
    ['Words online', num(sum(CONTENT.filter(c => c.status === 'Published'), c => c.words)), 'Across every published item', ''],
    ['Last edit', fmtDate(CONTENT.slice().sort((a, b) => a.updated < b.updated ? 1 : -1)[0].updated), 'By ' + staffName(staffNameTop()), ''],
    ['Publishing events', num(CONTENT_HISTORY.length), 'Edits, approvals and publishes on record', '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join('');

  el('contentGrid').innerHTML = [
    chartBox({title:'Content by status', sub:'Where every item stands', value:num(CONTENT.length),
      chart: chart({type:'donut', cats:['Published','Review','Draft'], h:190, colours:['#1E9E6A','#E08C1E','#8A90A0'],
        series:[{data:['Published','Review','Draft'].map(st => CONTENT.filter(c => c.status === st).length)}]})}),
    chartBox({title:'Words by content type', sub:'How much reading the site asks for', value:num(sum(CONTENT, c => c.words)),
      chart: chart({type:'bar', cats:['Page','Feed','Legal'], h:190,
        series:[{name:'Words', data:['Page','Feed','Legal'].map(t => sum(CONTENT.filter(c => c.type === t), c => c.words)), colour:'#2F6FED'}]})})
  ].join('');

  el('contentRowPill').textContent = rows.length + ' shown';
  renderTable('contentBody', [
    {k:'title', label:'Content item'},
    {k:'type', label:'Type'},
    {k:'status', label:'Status', html:v => okBadge(v)},
    {k:'words', label:'Words', num:true},
    {k:'updated', label:'Updated', html:v => fmtDate(v)},
    {k:'by', label:'By', html:v => esc(staffName(v))}
  ], rows.map(c => Object.assign({}, c, {_open: () => selectContent(c.key)})), {sort:'updated', pageSize:10, onRow:true});

  renderEditor();
  renderContentHistory();
  el('pipelineBox').innerHTML = [
    ['Draft', num(CONTENT.filter(c => c.status === 'Draft').length)],
    ['In review', num(CONTENT.filter(c => c.status === 'Review').length)],
    ['Published', num(published)],
    ['Publishing events', num(CONTENT_HISTORY.length)],
    ['Words online', num(sum(CONTENT.filter(c => c.status === 'Published'), c => c.words))]
  ].map(([l, v]) => `<div><div class="sl">${l}</div><div class="sv">${v}</div></div>`).join('');
}
function staffNameTop(){
  const top = CONTENT.slice().sort((a, b) => a.updated < b.updated ? 1 : -1)[0];
  return top ? top.by : 'STF-009';
}
function selectContent(key){
  const c = CONTENT.find(x => x.key === key);
  if(!c) return;
  EDITING = key;
  renderEditor();
  openModal(c.title, c.type + ' · ' + c.status + ' · last edited ' + fmtDate(c.updated), `
    <div class="pfields" style="grid-template-columns:1fr 1fr">
      ${field('Item', esc(c.title))}
      ${field('Type', esc(c.type))}
      ${field('Status', okBadge(c.status))}
      ${field('Words', num(c.words))}
      ${field('Last edited', fmtDate(c.updated))}
      ${field('Editor', esc(staffName(c.by)))}
      ${field('Region', esc(c.region))}
      ${field('Owner', esc(staffName(c.owner)))}
    </div>
    <div class="qhint" style="margin-top:8px">Publishing this item writes to the public site and is recorded in the change history.</div>`,
    [{label:'Edit in the panel', act:() => {
      closeModal();
      const host = el('editorBox');
      if(host && host.scrollIntoView) try{ host.scrollIntoView({block:'center'}); }catch(e){}
      toast('Editing “' + c.title + '”', 'info');
    }},
     {label:'Publish now', act:() => { closeModal(); EDITING = key; editorAction('publish'); }},
     {label:'Close', act:'close'}]);
}
function renderEditor(){
  const c = CONTENT.find(x => x.key === EDITING) || CONTENT[0];
  if(!c) return;
  EDITING = c.key;
  el('edState').className = 'badge ' + (c.status === 'Published' ? 'b-ok' : c.status === 'Review' ? 'b-warn' : 'b-gray');
  el('edState').textContent = c.status;
  el('editorBox').innerHTML = `<div class="pfields" style="grid-template-columns:1fr 1fr">
      ${kvRow('Item', esc(c.title))}
      ${kvRow('Type', esc(c.type))}
      ${kvRow('Last edited', fmtDate(c.updated) + ' · ' + esc(staffName(c.by)))}
      ${kvRow('Words', num(c.words))}
    </div>
    <div class="qhint" style="margin-top:6px">Editing this item writes to the CMS draft; publish to send it live.</div>`;
  if(el('edTitle')) el('edTitle').value = c.title;
  if(el('edSummary')) el('edSummary').value = c.title + ' — ' + c.type.toLowerCase() + ' managed by ' + staffName(c.by);
  if(el('edBody')) el('edBody').value = bodyDraft(c);
}
function bodyDraft(c){
  return `${c.title}\n\nGolden Financial Services is a licensed lender operating in Lilongwe, Blantyre, Mzuzu and Zomba. `
    + `This ${c.type.toLowerCase()} covers ${c.words} words and was last edited on ${fmtDate(c.updated)}. `
    + `Repayments are accepted through Airtel Money, TNM Mpamba, bank transfer and cash.`;
}
function renderContentHistory(){
  renderTable('chBody', [
    {k:'when', label:'When', html:v => fmtDate(v)},
    {k:'item', label:'Item'},
    {k:'action', label:'Action', html:v => okBadge(v)},
    {k:'by', label:'By', html:v => esc(staffName(v))},
    {k:'version', label:'Version'}
  ], CONTENT_HISTORY, {sort:'when', pageSize:7});
}
function editorAction(kind){
  const c = CONTENT.find(x => x.key === EDITING);
  if(!c) return;
  const title = (el('edTitle') && el('edTitle').value.trim()) || c.title;
  const words = ((el('edBody') && el('edBody').value) || '').trim().split(/\s+/).filter(Boolean).length;
  if(title !== c.title){
    CONTENT_HISTORY.unshift({when: TODAY, item: `${c.title} → ${title}`, action: 'Edited', by: 'STF-009', version: 'v' + (3 + Math.floor(Math.random() * 3)) + '.0'});
    c.title = title;
  }
  if(kind === 'draft'){
    c.status = 'Draft'; c.updated = TODAY; c.by = 'STF-009'; c.words = words || c.words;
    CONTENT_HISTORY.unshift({when: TODAY, item: c.title, action: 'Draft saved', by: 'STF-009', version: 'draft'});
    toast('Draft saved for “' + c.title + '”');
  } else if(kind === 'review'){
    c.status = 'Review'; c.updated = TODAY; c.by = 'STF-009';
    CONTENT_HISTORY.unshift({when: TODAY, item: c.title, action: 'Submitted for review', by: 'STF-009', version: 'v4.0'});
    toast('“' + c.title + '” sent for approval');
  } else {
    c.status = 'Published'; c.updated = TODAY; c.by = 'STF-009';
    CONTENT_HISTORY.unshift({when: TODAY, item: c.title, action: 'Published', by: 'STF-009', version: 'v4.0'});
    logChange('Content', c.title + ' published', c.status, 'Published');
    toast('“' + c.title + '” is live');
  }
  renderContent();
  renderChanges();
}

/* ===================== 4 · WEBSITE PAGES MANAGEMENT ===================== */
function pageRows(){
  return PAGES.filter(p => passLane(p) && passSeverity(p) && inRange(p.updated) && matchQ(p.path, p.title, p.visibility, p.access));
}
function renderPages(){
  const rows = pageRows();
  const broken = LINKS.filter(l => l.status === 'Broken');
  el('pagePill').className = 'badge ' + (broken.length ? 'b-warn' : 'b-ok');
  el('pagePill').textContent = rows.length + ' of ' + PAGES.length + ' pages';
  el('pageKpis').innerHTML = [
    ['Pages in the directory', num(PAGES.length), PAGES.filter(p => p.visibility === 'Public').length + ' public', ''],
    ['Live pages', num(PAGES.filter(p => p.status === 'Live').length), PAGES.filter(p => p.status !== 'Live').length + ' draft, hidden or warning', ''],
    ['Broken links', num(broken.length), 'Found in the last crawl', broken.length ? 'red' : ''],
    ['Pages with errors', num(PAGES.filter(p => p.errors > 0).length), num(sum(PAGES, p => p.errors)) + ' errors logged today', PAGES.some(p => p.errors) ? 'red' : ''],
    ['Thin metadata', num(PAGES.filter(p => p.meta < 45).length), 'Meta descriptions under 45 characters', PAGES.some(p => p.meta < 45) ? 'red' : ''],
    ['Average meta length', Math.round(sum(PAGES, p => p.meta) / PAGES.length) + ' chars', 'Search engines prefer 50–160', '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join('');

  el('pageGrid').innerHTML = [
    chartBox({title:'Pages by visibility', sub:'Public, drafts and hidden', value:num(PAGES.length),
      chart: chart({type:'donut', cats:['Public','Draft','Hidden'], h:190, colours:['#1E9E6A','#E08C1E','#8A90A0'],
        series:[{data:['Public','Draft','Hidden'].map(v => PAGES.filter(p => p.visibility === v).length)}]})}),
    chartBox({title:'Meta description length', sub:'Characters per page', value:Math.round(sum(PAGES, p => p.meta) / PAGES.length) + ' avg',
      chart: chart({type:'bar', cats:PAGES.map(p => p.path === '/' ? 'home' : p.path.slice(1)), h:190,
        series:[{name:'Characters', data:PAGES.map(p => p.meta), colour:'#2F6FED'}]})})
  ].join('');

  el('pageRowPill').textContent = rows.length + ' shown';
  renderTable('pageBody', [
    {k:'title', label:'Page'},
    {k:'path', label:'Path'},
    {k:'visibility', label:'Visibility', html:(v, r) => `<select data-vis="${esc(r.path)}" style="font-size:9.5px;padding:2px 4px;border:1px solid var(--line);border-radius:6px">
        ${['Public','Draft','Hidden'].map(o => `<option${o === v ? ' selected' : ''}>${o}</option>`).join('')}</select>`},
    {k:'access', label:'Access', html:(v, r) => `<select data-acc="${esc(r.path)}" style="font-size:9.5px;padding:2px 4px;border:1px solid var(--line);border-radius:6px">
        ${['Everyone','Customers','Staff'].map(o => `<option${o === v ? ' selected' : ''}>${o}</option>`).join('')}</select>`},
    {k:'order', label:'Order', num:true},
    {k:'status', label:'Status', html:v => okBadge(v)},
    {k:'updated', label:'Updated', html:v => fmtDate(v)}
  ], rows.map(p => Object.assign({}, p, {_open: () => openPage(p.path)})), {sort:'order', dir:'asc', pageSize:8, onRow:true});

  el('orderList').innerHTML = PAGES.slice().sort((a, b) => a.order - b.order).map((p, i) => `
    <div class="pagerow">
      <div class="pnum">${i + 1}</div>
      <div style="flex:1;min-width:0"><div class="pttl">${esc(p.title)}</div><div class="ppath">${esc(p.path)}</div></div>
      <div class="pact">
        <button class="mini" data-pageup="${esc(p.path)}" ${i === 0 ? 'disabled' : ''}>↑</button>
        <button class="mini" data-pagedown="${esc(p.path)}" ${i === PAGES.length - 1 ? 'disabled' : ''}>↓</button>
      </div>
    </div>`).join('');

  el('seoBox').innerHTML = PAGES.slice().sort((a, b) => a.meta - b.meta).slice(0, 5).map(p => `
    <div class="checkrow">
      <div class="ck ${p.meta >= 45 ? 'pass' : 'warn'}">${p.meta >= 45 ? '✓' : '!'}</div>
      <div style="flex:1"><div style="font-size:10px;font-weight:800">${esc(p.path)} · ${p.meta} chars</div>
        <div class="qhint">${esc(p.seo)}</div></div>
      <button class="btn btn-ghost" data-seo="${esc(p.path)}">Edit SEO</button>
    </div>`).join('');

  el('linkPill').className = 'badge ' + (broken.length ? 'b-crit' : 'b-ok');
  el('linkPill').textContent = broken.length + ' broken of ' + LINKS.length;
  renderTable('linkBody', [
    {k:'from', label:'From'},
    {k:'to', label:'Points at'},
    {k:'label', label:'Link text'},
    {k:'status', label:'Result', html:v => okBadge(v)},
    {k:'act', label:'', html:(v, r) => r.status === 'Broken'
      ? `<button class="btn btn-ghost" data-fix="${esc(r.from)}|${esc(r.to)}">Fix</button>`
      : `<span class="qhint">checked ${fmtDate(r.checked)}</span>`}
  ], LINKS, {sort:'status', dir:'asc', pageSize:8});

  const errs = PAGE_ERRORS.filter(e => passLane(e));
  el('errPill').className = 'badge ' + (errs.some(e => e.status === 'Open') ? 'b-warn' : 'b-ok');
  el('errPill').textContent = errs.filter(e => e.status === 'Open').length + ' open';
  renderTable('pgerrBody', [
    {k:'when', label:'When', html:v => String(v).slice(0, 10) === TODAY ? 'Today ' + String(v).slice(11) : fmtDate(v)},
    {k:'page', label:'Page'},
    {k:'error', label:'Error'},
    {k:'count', label:'Count', num:true},
    {k:'status', label:'Status', html:v => okBadge(v)},
    {k:'act', label:'', html:(v, r) => r.status === 'Open'
      ? `<button class="btn btn-ghost" data-pgerr="${esc(r.page)}">Acknowledge</button>` : '<span class="qhint">—</span>'}
  ], errs, {sort:'when', pageSize:6});
}
function openPage(path){
  const p = PAGES.find(x => x.path === path);
  if(!p) return;
  openModal(p.title + ' · ' + p.path, 'Page metadata, visibility and ordering', `
    <div class="pfields" style="grid-template-columns:1fr 1fr">
      ${field('Path', esc(p.path))}
      ${field('Visibility', okBadge(p.visibility))}
      ${field('Access', esc(p.access))}
      ${field('Order', String(p.order))}
      ${field('Status', okBadge(p.status))}
      ${field('Errors today', num(p.errors))}
    </div>
    <div class="form-grid" style="margin-top:10px">
      <div class="fg"><label>SEO title</label><input id="seoTitle" value="${esc(p.seo)}" /></div>
      <div class="fg"><label>Meta description length</label><input id="seoMeta" type="number" value="${p.meta}" /></div>
    </div>`,
    [{label:'Save metadata', act:() => {
      const t = el('seoTitle') ? el('seoTitle').value.trim() : p.seo;
      const m = el('seoMeta') ? Math.max(0, Number(el('seoMeta').value) || p.meta) : p.meta;
      logChange('Pages', p.path + ' metadata', p.seo + ' · ' + p.meta + ' chars', t + ' · ' + m + ' chars');
      p.seo = t || p.seo; p.meta = m;
      closeModal(); renderPages(); toast('Metadata saved for ' + p.path);
    }}]);
}
function toggleSection(name){
  const s = WM_SECTIONS.find(x => x.name === name);
  if(!s) return;
  s.on = !s.on;
  logChange('Content', 'Homepage section ' + name, s.on ? 'Off' : 'On', s.on ? 'On' : 'Off');
  renderSite();
  toast(name + ' turned ' + (s.on ? 'on' : 'off'));
}
function moveNav(label, dir){
  const list = WM_NAV.slice().sort((a, b) => a.order - b.order);
  const i = list.findIndex(n => n.label === label);
  const j = i + dir;
  if(i < 0 || j < 0 || j >= list.length) return;
  const a = list[i], b = list[j];
  const t = a.order; a.order = b.order; b.order = t;
  renderSite();
  toast(label + ' moved ' + (dir < 0 ? 'up' : 'down'), 'info');
}
function addNav(label, path){
  if(!label || !path) return toast('Give the menu item a label and a path.', 'info');
  WM_NAV.push({label, path, order: WM_NAV.length + 1, visible: true});
  logChange('Navigation', 'Menu item added', '—', label + ' → ' + path);
  renderSite();
  toast(label + ' added to the menu');
}
function publishSite(on){
  WM_SITE.published = on;
  if(on){ WM_SITE.publishedOn = TODAY; WM_SET.version = bumpVersion(WM_SET.version); }
  logChange('Deployment', on ? 'Website published' : 'Website unpublished', on ? 'Draft' : 'Published', on ? 'Published ' + WM_SET.version : 'Maintenance mode');
  renderSite(); renderDeployment(); renderChanges();
  toast(on ? 'Published to production · ' + WM_SET.version : 'The site is now in maintenance mode', on ? 'ok' : 'info');
}
function bumpVersion(v){
  const p = String(v).split('.').map(Number);
  p[2] = (p[2] || 0) + 1;
  return p.join('.');
}
</script>
