<script>
/* ============================================================
   WEBSITE MANAGEMENT & CONNECTIONS (4/7)
   1 · Overview   2 · Public website   3 · Content   4 · Pages
   ============================================================ */

/* ---------------- small building blocks ---------------- */
function tone(s){
  if(/^(Healthy|Connected|Pass|Live|Published|OK|Resolved|Applied|Success|Enabled|Set|Valid|Linked|Open|Good|Cleared|Approved)$/i.test(s)) return 'b-ok';
  if(/^(Degraded|Slow|Review|Watch|Pending|Monitoring|Draft|Hidden|Superseded|Expiring|Needs work|Closed for renovation)$/i.test(s)) return 'b-warn';
  if(/^(Failing|Failed|Broken|Expired|Open|Disabled|Missing|Critical|Breaching|Rolled back|Not linked|Private)$/i.test(s)) return 'b-crit';
  return 'b-gray';
}
const okBadge = s => badge(s, tone(s));
const pctClass = v => v >= 90 ? 'b-ok' : v >= 70 ? 'b-warn' : 'b-crit';
function meter(label, value, sub, max){
  const v = clamp(Number(value) || 0, 0, max || 100);
  return `<div class="meterrow"><div style="flex:1">
      <div class="sl"><b>${esc(label)}</b><span>${esc(sub || '')}</span></div>
      <div class="meter"><i style="width:${(v / (max || 100) * 100).toFixed(1)}%"></i></div>
    </div><div class="sv">${num(value)}${max ? '' : '%'}</div></div>`;
}
const kvRow = (k, v) => `<div class="risk"><div><div class="rn">${esc(k)}</div></div><div class="rv">${v}</div></div>`;
const strip = rows => `<div class="strip">${rows.map(([k, v]) => `<div><div class="sl">${esc(k)}</div><div class="sv">${v}</div></div>`).join('')}</div>`;
const chartBox = o => chartCard(Object.assign({chart: chart(o)}, o));

/* ===================== 1 · WEBSITE OVERVIEW ===================== */
function renderOverview(){
  const s = wmStats();
  el('bandScore').textContent = Math.round(s.score) + '%';
  el('bandUptime').textContent = s.up.toFixed(2) + '%';
  el('bandApis').textContent = num(s.endpoints);
  el('bandAlerts').textContent = num(s.openAlerts);

  el('ovStatusPill').className = 'badge ' + (s.score >= 85 ? 'b-ok' : s.score >= 70 ? 'b-warn' : 'b-crit');
  el('ovStatusPill').textContent = s.score >= 85 ? 'All connections healthy' : s.score >= 70 ? 'Attention needed' : 'Degraded';
  el('ovStamp').textContent = 'Checked ' + lastRefresh();

  el('wmKpis').innerHTML = [
    ['Connection score', Math.round(s.score) + '%', s.crit + ' critical alert' + (s.crit === 1 ? '' : 's') + ' open', s.score >= 85 ? '' : 'red'],
    ['Website status', WM_SITE.published ? 'Published' : 'Unpublished', 'Version ' + WM_SITE.version + ' · built ' + fmtDate(WM_SITE.publishedOn), WM_SITE.published ? '' : 'red'],
    ['Uptime (14 days)', s.up.toFixed(2) + '%', AVAILABILITY.filter(d => d.uptime < 100).length + ' days below 100%', ''],
    ['API endpoints', num(s.endpoints), s.failing + ' failing · ' + s.degraded + ' degraded', s.failing ? 'red' : ''],
    ['Average p95', s.avgP95 + ' ms', 'Across every route', ''],
    ['Open alerts', num(s.openAlerts), ALERTS.length + ' raised in the period', s.crit ? 'red' : ''],
    ['Broken links', num(s.brokenLinks), LINKS.length + ' internal links checked', s.brokenLinks ? 'red' : ''],
    ['RLS coverage', (TABLES.length - s.rlsGap) + '/' + TABLES.length, s.rlsGap + ' table without row security', s.rlsGap ? 'red' : '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join('');

  const integr = INTEGRATIONS.filter(i => i.status === 'Connected').length;
  el('ovMeters').innerHTML =
    meter('Public availability', s.up, 'Target ' + WM_SET.uptimeTarget + '% · 14-day average') +
    meter('Endpoint health', pct(s.endpoints - s.failing - s.degraded, s.endpoints), s.endpoints - s.failing - s.degraded + ' of ' + s.endpoints + ' routes healthy') +
    meter('Integrations connected', pct(integr, INTEGRATIONS.length), integr + ' of ' + INTEGRATIONS.length + ' services') +
    meter('Database security', pct(TABLES.length - s.rlsGap, TABLES.length), TABLES.length - s.rlsGap + ' of ' + TABLES.length + ' tables behind RLS') +
    meter('Content readiness', pct(CONTENT.filter(c => c.status === 'Published').length, CONTENT.length), CONTENT.filter(c => c.status === 'Published').length + ' of ' + CONTENT.length + ' items published');

  const connPillTone = s.openAlerts > 6 ? 'b-crit' : s.openAlerts > 2 ? 'b-warn' : 'b-ok';
  el('ovConnPill').className = 'badge ' + connPillTone;
  el('ovConnPill').textContent = integr + '/' + INTEGRATIONS.length + ' connected';
  const cells = [
    ['Public website', WM_SITE.published ? 'Live' : 'Offline', WM_SITE.published ? '200 in 142 ms' : 'Maintenance page shown', WM_SITE.published ? 'ok' : 'crit'],
    ['Admin portal', 'Live', 'Sign-in required', 'ok'],
    ['Backend server', BACKEND.uptime + '%', BACKEND.instances + ' instances · ' + BACKEND.region, BACKEND.uptime > 99.5 ? 'ok' : 'warn'],
    ['Supabase', DB_HEALTH.some(h => h.status === 'Fail') ? 'Degraded' : 'Connected', SUPA.project + ' · ' + SUPA.engine, DB_HEALTH.some(h => h.status === 'Fail') ? 'warn' : 'ok'],
    ['Email and SMS', INTEGRATIONS.find(i => i.kind === 'SMS').status, 'Africa’s Talking · Resend', 'warn'],
    ['Payments', INTEGRATIONS.find(i => i.name.indexOf('TNM') === 0).status + ' · TNM Mpamba', 'Airtel Money connected', 'crit']
  ];
  el('connGrid').innerHTML = cells.map(([n, st, sub, t]) => `<div class="scell">
      <div class="dotbg ${t}"></div>
      <div class="stat-dot ${t}"></div>
      <div style="flex:1"><div style="font-size:10.5px;font-weight:800">${esc(n)}</div>
        <div class="qhint">${esc(sub)}</div></div>
      <div style="text-align:right"><div style="font-size:10px;font-weight:800">${esc(st)}</div></div></div>`).join('');

  el('ovGrid').innerHTML =
    chartBox({title: 'Website availability', sub: 'Uptime per day, last fourteen days', type: 'bar', h: 190,
      cats: AVAILABILITY.slice(0, 14).reverse().map(d => fmtShort(d.date)),
      series: [{name: 'Uptime %', data: AVAILABILITY.slice(0, 14).reverse().map(d => d.uptime)}],
      value: s.up.toFixed(2) + '%'}) +
    chartBox({title: 'Requests through the day', sub: 'Backend traffic and errors, today', type: 'line', h: 190,
      cats: TRAFFIC.map(t => t.hour),
      series: [{name: 'Requests', data: TRAFFIC.map(t => t.requests)}, {name: 'Errors', data: TRAFFIC.map(t => t.errors)}],
      value: num(sum(TRAFFIC, t => t.requests))}) +
    chartBox({title: 'Open alerts by area', sub: 'Where the current pressure sits', type: 'donut', h: 190,
      cats: ['Website', 'Backend', 'Supabase', 'Auth', 'Integrations'],
      series: [{name: 'Alerts', data: ['Website', 'Backend', 'Supabase', 'Auth', 'Integrations'].map(a => ALERTS.filter(x => x.lane === a && x.status !== 'Resolved').length)}],
      value: num(ALERTS.filter(a => a.status !== 'Resolved').length)});

  const open = ALERTS.filter(a => a.status === 'Open');
  el('ovAlertPill').className = 'badge ' + (open.some(a => a.severity === 'Critical') ? 'b-crit' : open.length ? 'b-warn' : 'b-ok');
  el('ovAlertPill').textContent = open.length + ' open';
  el('ovAlerts').innerHTML = open.slice(0, 5).map(a => `<div class="risk">
      <div><div class="rn">${esc(a.kind)} · ${esc(a.target)}</div>
        <div class="rs">${esc(a.note)} · ${esc(a.raised)}</div></div>
      <div class="rv">${okBadge(a.severity)}</div></div>`).join('')
    || '<div class="empty">No open connection alerts.</div>';

  const passed = INTEGRATIONS.filter(i => i.status === 'Connected').slice(0, 6);
  el('ovFeed').innerHTML = `<div class="tblwrap"><table class="tbl2 dense">
      <thead><tr><th>Check</th><th>Target</th><th class="num">Latency</th><th>Last success</th></tr></thead>
      <tbody>${passed.map(i => `<tr><td>${esc(i.name)}</td><td>${esc(i.provider)}</td>
        <td class="num">${num(i.latency)} ms</td><td>${esc(i.lastCheck)}</td></tr>`).join('')}</tbody></table></div>`;
}

/* ===================== 2 · PUBLIC WEBSITE MANAGEMENT ===================== */
let THEME_DIRTY = false;
function renderPreview(){
  const t = WM_THEMES.find(x => x.name === WM_SITE.theme) || WM_THEMES[0];
  const dark = /Charcoal/.test(t.name);
  const nav = WM_NAV.filter(n => n.visible).sort((a, b) => a.order - b.order);
  const secs = WM_SECTIONS.filter(s => s.on).sort((a, b) => a.order - b.order);
  el('previewBox').innerHTML = `<div class="prevframe">
    <div class="prevbar"><i></i><i></i><i></i><span>${esc(WM_SET.publicUrl.replace('https://', ''))}</span></div>
    <div class="prevsite" style="background:${dark ? '#14161C' : t.bg};color:${dark ? '#F3EFE3' : '#171A20'}">
      <div class="prevhead">
        <div class="prevlogo" style="color:${t.accent}">G</div>
        <div><div class="prevname">${esc(WM_SITE.name)}</div>
          <div class="prevtag" style="color:${t.accent}">${esc(WM_SITE.tagline)}</div></div>
        <div class="prevnav">${nav.map(n => `<span>${esc(n.label)}</span>`).join('')}</div>
      </div>
      <div class="prevhero">
        <div class="prevh1">Business loans from <b style="color:${t.accent}">MK 50,000</b></div>
        <div class="prevsub">${secs.slice(0, 3).map(s => esc(s.name)).join(' · ')}</div>
        <div class="prevcta" style="background:${t.accent}">Apply in eight minutes</div>
      </div>
      <div class="prevblocks">${secs.map(s => `<div class="prevblock" style="border-color:${t.accent}33">
        <div class="pb-n">${esc(s.name)}</div><div class="pb-s">${esc(s.note)}</div></div>`).join('')}</div>
      <div class="prevfoot">${esc(WM_CONTACT.phone)} · ${esc(WM_CONTACT.email)} · Lilongwe · Blantyre · Mzuzu · Zomba</div>
    </div></div>`;
}

function renderSite(){
  const published = CONTENT.filter(c => c.status === 'Published').length;
  el('sitePill').className = 'badge ' + (WM_SITE.published ? 'b-ok' : 'b-crit');
  el('sitePill').textContent = WM_SITE.published ? 'Live' : 'Maintenance';
  el('publishState').className = 'badge ' + (WM_SITE.published ? 'b-ok' : 'b-warn');
  el('publishState').textContent = WM_SITE.published ? 'Live' : 'Maintenance';

  el('siteKpis').innerHTML = [
    ['Website state', WM_SITE.published ? 'Live' : 'Maintenance', 'Version ' + WM_SITE.version, WM_SITE.published ? '' : 'red'],
    ['Pages live', num(PAGES.filter(p => p.visibility === 'Public').length), 'of ' + PAGES.length + ' in the directory', ''],
    ['Homepage sections', num(WM_SECTIONS.filter(s => s.on).length) + ' on', WM_SECTIONS.length + ' configured', ''],
    ['Menu items', num(WM_NAV.filter(n => n.visible).length), WM_NAV.length + ' in the menu', ''],
    ['Visitors (30 d)', num(WM_SITE.visitors30d), 'Across four branches', ''],
    ['Published content', published + '/' + CONTENT.length, 'items on the public site', '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join('');

  const brand = el('brandBox');
  if(brand){
    brand.innerHTML = `
      <div class="form-grid">
        <div class="fg"><label>Logo</label><select id="brandLogo">${WM_LOGOS.map(l => `<option${l === WM_SITE.logo ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select></div>
        <div class="fg"><label>Logo variant</label><select id="brandVariant">
          ${['Gold on charcoal', 'Charcoal on gold', 'White on photo'].map(v => `<option${v === WM_SITE.logoVariant ? ' selected' : ''}>${esc(v)}</option>`).join('')}</select></div>
        <div class="fg"><label>Typeface</label><select id="brandFont">
          ${['Inter / system stack', 'Source Serif headings', 'Manrope'].map(v => `<option${v === WM_SITE.font ? ' selected' : ''}>${esc(v)}</option>`).join('')}</select></div>
        <div class="fg"><label>Site name</label><input id="brandName" value="${esc(WM_SITE.name)}" /></div>
      </div>
      <div class="fh" style="margin-top:10px">Theme</div>
      <div class="chips" id="themeChips">${WM_THEMES.map(t => `<span class="fchip${t.name === WM_SITE.theme ? ' on' : ''}" data-theme="${esc(t.name)}">
        <i style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${t.accent};margin-right:5px"></i>${esc(t.name)}</span>`).join('')}</div>
      <div class="form-grid" style="margin-top:8px">
        <div class="fg"><label>Accent colour</label><input id="brandAccent" type="color" value="${esc(WM_SITE.accent)}" /></div>
        <div class="fg"><label>&nbsp;</label><button class="btn btn-gold" id="brandSave" style="width:100%">Save branding</button></div>
      </div>
      <div class="qhint" id="brandMsg" style="margin-top:4px"></div>`;
  }
  el('themePill').className = 'badge b-gray';
  el('themePill').textContent = WM_SITE.theme;

  el('sectionList').innerHTML = WM_SECTIONS.slice().sort((a, b) => a.order - b.order).map(s => `
    <div class="checkrow">
      <div class="ck ${s.on ? 'pass' : 'warn'}">${s.on ? '✓' : '–'}</div>
      <div style="flex:1"><div style="font-size:10.5px;font-weight:800">${esc(s.name)}</div>
        <div class="qhint">${esc(s.note)}</div></div>
      <button class="btn btn-ghost" data-hsec="${esc(s.name)}">${s.on ? 'Switch off' : 'Switch on'}</button>
    </div>`).join('');
  el('secPill').textContent = WM_SECTIONS.filter(s => s.on).length + ' on';

  el('navList').innerHTML = WM_NAV.slice().sort((a, b) => a.order - b.order).map((n, i) => `
    <div class="checkrow">
      <div class="ck ${n.visible ? 'pass' : 'warn'}">${n.visible ? '✓' : '–'}</div>
      <div style="flex:1"><div style="font-size:10.5px;font-weight:800">${esc(n.label)}</div>
        <div class="qhint">${esc(n.path)} · position ${n.order}</div></div>
      <button class="btn btn-ghost" data-navup="${esc(n.label)}" ${i === 0 ? 'disabled' : ''}>↑</button>
      <button class="btn btn-ghost" data-navdown="${esc(n.label)}" ${i === WM_NAV.length - 1 ? 'disabled' : ''}>↓</button>
      <button class="btn btn-ghost" data-navtoggle="${esc(n.label)}">${n.visible ? 'Hide' : 'Show'}</button>
      <button class="btn btn-ghost" data-navdel="${esc(n.label)}" title="Remove from the menu">✕</button>
    </div>`).join('');
  el('navPill').textContent = WM_NAV.length + ' items';

  const c = el('contactBox');
  if(c){
    c.innerHTML = [
      ['ctPhone', 'Telephone', WM_CONTACT.phone], ['ctWhatsapp', 'WhatsApp', WM_CONTACT.whatsapp],
      ['ctEmail', 'Email', WM_CONTACT.email], ['ctSupport', 'Support email', WM_CONTACT.support],
      ['ctAddress', 'Head office', WM_CONTACT.address], ['ctPostal', 'Postal address', WM_CONTACT.postal]
    ].map(([id, label, value]) => `<div class="fg"><label>${esc(label)}</label><input id="${id}" value="${esc(value)}" /></div>`).join('');
  }

  if(el('contactMsg') && !el('contactMsg').textContent)
    el('contactMsg').textContent = 'Published from the branch register · changes appear on the site at the next build.';
  el('hfBox').innerHTML = `<div class="form-grid">
      <div class="fg"><label>Header style</label><select id="hfHeader">${['Sticky, two-tier', 'Simple, one row', 'Transparent over hero'].map(v => `<option${v === WM_SITE.header ? ' selected' : ''}>${esc(v)}</option>`).join('')}</select></div>
      <div class="fg"><label>Footer style</label><select id="hfFooter">${['Four columns', 'Three columns + newsletter', 'Compact bar'].map(v => `<option${v === WM_SITE.footer ? ' selected' : ''}>${esc(v)}</option>`).join('')}</select></div>
    </div>`;
  el('hfPill').textContent = WM_SITE.header.split(',')[0];
  el('socialList').innerHTML = `<div class="fh" style="margin-top:10px">Social links</div>` +
    WM_SOCIAL.map(s => `<div class="checkrow">
      <div class="ck ${s.linked ? 'pass' : 'warn'}">${s.linked ? '✓' : '–'}</div>
      <div style="flex:1"><div style="font-size:10.5px;font-weight:800">${esc(s.channel)}</div>
        <div class="qhint">${esc(s.handle)}${s.linked ? ' · ' + num(s.followers) + ' followers' : ' · not on the site'}</div></div>
      <button class="btn btn-ghost" data-social="${esc(s.channel)}">${s.linked ? 'Unlink' : 'Link'}</button>
    </div>`).join('');

  el('officePill').textContent = WM_OFFICES.length + ' branches';
  renderTable('officeBody', [
    {k: 'branch', label: 'Branch'},
    {k: 'address', label: 'Address'},
    {k: 'phone', label: 'Telephone'},
    {k: 'hours', label: 'Business hours'},
    {k: 'staff', label: 'Staff', num: true},
    {k: 'status', label: 'Status', html: v => okBadge(v)}
  ], WM_OFFICES, {sort: 'branch', dir: 'asc', pageSize: 4});

  if(el('publishMsg') && !el('publishMsg').textContent)
    el('publishMsg').textContent = 'Live since ' + fmtDate(WM_SITE.publishedOn) + ' · version ' + WM_SITE.version + ' · ' + num(WM_SITE.visitors30d) + ' visitors in thirty days.';
  el('publishBox').innerHTML = strip([
    ['Version', WM_SITE.version],
    ['Published', fmtDate(WM_SITE.publishedOn)],
    ['Last build', WM_SET.build],
    ['Cache TTL', WM_SET.cacheTtl + ' s']
  ]) + `<div class="qhint" style="margin-top:6px">Publishing writes the built site to the CDN and records the change for the audit trail.</div>`;

  renderPreview();
}

/* ===================== 3 · CONTENT MANAGEMENT ===================== */
let EDITING = 'about';
function contentRows(){
  return CONTENT.filter(c => inRange(c.updated) && (passLane(c) || true) && passSeverity(c) && passOwner(c) && passRegion(c)
    && matchQ(c.title, c.type, c.status, c.key));
}
function renderContent(){
  const rows = contentRows();
  const published = CONTENT.filter(c => c.status === 'Published').length;
  el('contentPill').className = 'badge ' + (rows.length ? 'b-gray' : 'b-warn');
  el('contentPill').textContent = rows.length + ' items';
  el('contentCount').textContent = rows.length + ' of ' + CONTENT.length;
  const publishedAt = CONTENT.filter(c => c.status === 'Published').map(c => +new Date(c.updated)).filter(n => n > 0);
  const lastPublish = publishedAt.length ? isoOf(new Date(Math.max(...publishedAt))) : '';
  el('contentKpis').innerHTML = [
    ['Content items', num(CONTENT.length), published + ' published · ' + CONTENT.filter(c => c.status === 'Draft').length + ' draft', ''],
    ['In review', num(CONTENT.filter(c => c.status === 'Review').length), 'Waiting on approval', CONTENT.some(c => c.status === 'Review') ? 'red' : ''],
    ['Words published', num(sum(CONTENT.filter(c => c.status === 'Published'), c => c.words)), 'Across every live page', ''],
    ['Legal pages', num(CONTENT.filter(c => c.type === 'Legal').length), 'Terms and privacy', ''],
    ['Last publish', lastPublish ? fmtDate(lastPublish) : '—', CONTENT_HISTORY[0] && CONTENT_HISTORY[0].by ? staffName(CONTENT_HISTORY[0].by) : 'No publish yet', ''],
    ['Feeds', num(CONTENT.filter(c => c.type === 'Feed').length), 'Announcements and blog', '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join('');

  renderTable('contentBody', [
    {k: 'title', label: 'Item'},
    {k: 'type', label: 'Type'},
    {k: 'status', label: 'State', html: v => okBadge(v)},
    {k: 'words', label: 'Words', num: true},
    {k: 'updated', label: 'Updated', html: v => fmtShort(v)},
    {k: 'by', label: 'Editor', html: v => esc(staffName(v))}
  ], rows.map(c => Object.assign({}, c, {_open: () => selectContent(c.key)})),
    {sort: 'updated', pageSize: 10, onRow: true});

  const item = CONTENT.find(c => c.key === EDITING) || CONTENT[0];
  el('edPill').className = 'badge ' + tone(item.status);
  el('edPill').textContent = item.status;
  el('editorBox').innerHTML = `
    <div class="form-grid">
      <div class="fg" style="grid-column:1/-1"><label>Item</label>
        <select id="edSelect">${CONTENT.map(c => `<option value="${c.key}"${c.key === item.key ? ' selected' : ''}>${esc(c.title)}</option>`).join('')}</select></div>
      <div class="fg" style="grid-column:1/-1"><label>Headline</label><input id="edTitle" value="${esc(item.title)}" /></div>
      <div class="fg"><label>Type</label><select id="edType">${['Page', 'Feed', 'Legal'].map(v => `<option${v === item.type ? ' selected' : ''}>${v}</option>`).join('')}</select></div>
      <div class="fg"><label>Owner</label><select id="edOwner">${STAFF.slice(0, 12).map(s => `<option value="${s.id}"${s.id === item.owner ? ' selected' : ''}>${esc(s.name)}</option>`).join('')}</select></div>
    </div>
    <div class="fg" style="margin-top:8px"><label>Body copy</label>
      <textarea id="edBody" rows="4" style="width:100%">${esc(ITEM_BODIES[item.key] || '')}</textarea></div>
    <div class="form-actions">
      <button class="btn btn-gold" id="edSave">Save draft</button>
      <button class="btn btn-ghost" id="edReview">Send for approval</button>
      <button class="btn btn-ghost" id="edPublish">Publish now</button>
    </div>
    <div class="qhint" id="edMsg" style="margin-top:6px">Last edited by ${esc(staffName(item.by))} on ${fmtDate(item.updated)} · ${num(item.words)} words</div>`;

  el('chPill').textContent = CONTENT_HISTORY.length + ' events';
  renderTable('chBody', [
    {k: 'when', label: 'When', html: v => esc(String(v).slice(0, 16))},
    {k: 'item', label: 'Item'},
    {k: 'action', label: 'Action'},
    {k: 'version', label: 'Version'},
    {k: 'by', label: 'By', html: v => esc(staffName(v))}
  ], CONTENT_HISTORY, {sort: 'when', pageSize: 8, dir: 'desc'});

  el('contentGrid').innerHTML =
    chartBox({title: 'Words by content type', sub: 'Published copy', type: 'bar', h: 180,
      cats: ['Page', 'Feed', 'Legal'], series: [{name: 'Words', data: ['Page', 'Feed', 'Legal'].map(t => sum(CONTENT.filter(c => c.type === t), c => c.words))}],
      value: num(sum(CONTENT, c => c.words))}) +
    chartBox({title: 'Content state', sub: 'Every item on the register', type: 'donut', h: 180,
      cats: ['Published', 'Review', 'Draft'],
      series: [{name: 'Items', data: ['Published', 'Review', 'Draft'].map(s => CONTENT.filter(c => c.status === s).length)}],
      value: CONTENT.length + ' items'});
}
const ITEM_BODIES = {
  about: 'Golden Financial Services has lent to Malawian businesses since 2011. Four branches, 34 staff and one promise: clear terms, no hidden fees.',
  services: 'Salary-backed loans, business working capital, asset finance and a savings-linked product for market traders.',
  products: 'Business loans from MK 50,000 to MK 8,000,000 over 6 to 24 months. Salary loans to MK 3,000,000. Asset finance on vehicles and equipment.',
  rates: 'Interest from 3.5% a month on the declining balance. Arrangement fee 4%, insurance 1.2% a month of the outstanding balance.',
  faq: 'How long does approval take? What do I need to apply? Can I repay through Airtel Money or TNM Mpamba? Answers to the ten questions we are asked most.',
  announcements: 'Lilongwe head office moves to Golden House on 4 November. Zomba branch closed for renovation until 15 November.',
  blog: 'Notes on cash flow, choosing a lender, reading a loan agreement and keeping a repayment record.',
  terms: 'Terms of business: eligibility, fees, default, early settlement and dispute resolution.',
  privacy: 'What we collect, why we collect it, how long we keep it and how to ask for a copy.',
  help: 'Step-by-step help with applying, uploading documents, repaying and resetting a portal password.'
};
function selectContent(key){
  const c = CONTENT.find(x => x.key === key);
  if(!c) return;
  EDITING = key;
  renderContent();
  openModal(c.title, c.type + ' · ' + c.status + ' · last edited ' + fmtDate(c.updated),
    `<div class="pfields" style="grid-template-columns:1fr 1fr">
      ${field('Item', esc(c.title))}${field('Type', esc(c.type))}
      ${field('State', okBadge(c.status))}${field('Words', num(c.words))}
      ${field('Last edited', fmtDate(c.updated))}${field('Editor', esc(staffName(c.by)))}
      ${field('Region', esc(c.region))}${field('Owner', esc(staffName(c.owner)))}
    </div>
    <div class="qhint" style="margin-top:8px">Publishing this item writes to the public site and is recorded in the change history.</div>`,
    [{label: 'Edit in the panel', act: () => {
        closeModal();
        const host = el('editorBox');
        if(host && host.scrollIntoView) try{ host.scrollIntoView({block: 'center'}); }catch(e){}
        toast('Editing “' + c.title + '”', 'info');
      }},
     {label: 'Publish now', act: () => { closeModal(); EDITING = key; editorAction('publish'); }},
     {label: 'Close', act: 'close'}]);
}
function bodyDraft(){
  const t = el('edBody');
  return t ? t.value.trim() : '';
}
function editorAction(kind){
  const item = CONTENT.find(c => c.key === EDITING) || CONTENT[0];
  const title = (el('edTitle') || {}).value || item.title;
  const body = bodyDraft();
  const words = body ? body.split(/\s+/).filter(Boolean).length : item.words;
  if(kind === 'save' || kind === 'review' || kind === 'publish'){
    const prev = item.status;
    item.title = title;
    item.words = words;
    item.updated = TODAY;
    item.by = 'STF-009';
    if(kind === 'save') item.status = 'Draft';
    if(kind === 'review') item.status = 'Review';
    if(kind === 'publish') item.status = 'Published';
    CONTENT_HISTORY.unshift({when: TODAY + ' ' + new Date().toTimeString().slice(0, 5), item: title,
      action: kind === 'save' ? 'Saved as draft' : kind === 'review' ? 'Submitted for review' : 'Published',
      version: 'v' + (1 + Math.floor(Math.random() * 60)), by: 'STF-009'});
    logChange('Content', title, prev, item.status);
    renderContent(); renderChanges(); renderOverview();
    toast(kind === 'publish' ? '“' + title + '” is live' : 'Saved “' + title + '”');
  }
}

/* ===================== 4 · PAGES MANAGEMENT ===================== */
function pageRows(){
  return PAGES.filter(p => inRange(p.updated) && passSeverity(p) && passOwner(p) && passRegion(p)
    && matchQ(p.title, p.path, p.visibility, p.access, p.seo));
}
function renderPages(){
  const rows = pageRows();
  const broken = LINKS.filter(l => l.status === 'Broken');
  el('pagePill').className = 'badge ' + (broken.length ? 'b-warn' : 'b-ok');
  el('pagePill').textContent = PAGES.length + ' pages';
  el('pageCount').textContent = rows.length + ' of ' + PAGES.length;
  el('pageKpis').innerHTML = [
    ['Pages in the directory', num(PAGES.length), PAGES.filter(p => p.visibility === 'Public').length + ' public', ''],
    ['Hidden or private', num(PAGES.filter(p => p.visibility !== 'Public').length), 'Not linked from the menu', ''],
    ['Broken links', num(broken.length), LINKS.length + ' checked overnight', broken.length ? 'red' : ''],
    ['Page errors', num(PAGE_ERRORS.filter(e => e.status === 'Open').length), 'Open against routes', PAGE_ERRORS.some(e => e.status === 'Open') ? 'red' : ''],
    ['SEO titles set', num(PAGES.filter(p => p.seo).length) + '/' + PAGES.length, 'Unique title per page', ''],
    ['Edits this period', num(sum(PAGES, p => p.edits)), 'Across every route', '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join('');

  renderTable('pageBody', [
    {k: 'title', label: 'Page'},
    {k: 'path', label: 'Path'},
    {k: 'visibility', label: 'Visibility', html: (v, r) => `<select data-vis="${esc(r.path)}" style="font-size:9px">
        ${['Public', 'Hidden', 'Private'].map(o => `<option${o === v ? ' selected' : ''}>${o}</option>`).join('')}</select>`},
    {k: 'access', label: 'Access', html: (v, r) => `<select data-acc="${esc(r.path)}" style="font-size:9px">
        ${['Everyone', 'Staff', 'Admins'].map(o => `<option${o === v ? ' selected' : ''}>${o}</option>`).join('')}</select>`},
    {k: 'edits', label: 'Edits', num: true},
    {k: 'status', label: 'State', html: v => okBadge(v)}
  ], rows.map(p => Object.assign({}, p, {_open: () => openPage(p.path)})), {sort: 'edits', pageSize: 10, onRow: true});

  el('orderList').innerHTML = PAGES.slice().sort((a, b) => a.order - b.order).slice(0, 8).map((p, i) => `
    <div class="checkrow"><div class="ck pass">${i + 1}</div>
      <div style="flex:1"><div style="font-size:10.5px;font-weight:800">${esc(p.title)}</div>
        <div class="qhint">${esc(p.path)} · ${esc(p.visibility)}</div></div>
      <button class="btn btn-ghost" data-pgup="${esc(p.path)}" ${i === 0 ? 'disabled' : ''}>↑</button>
      <button class="btn btn-ghost" data-pgdown="${esc(p.path)}">↓</button>
    </div>`).join('');

  el('linkPill').className = 'badge ' + (broken.length ? 'b-crit' : 'b-ok');
  el('linkPill').textContent = broken.length + ' broken';
  renderTable('linkBody', [
    {k: 'from', label: 'From'},
    {k: 'to', label: 'Links to'},
    {k: 'label', label: 'Anchor'},
    {k: 'status', label: 'State', html: v => okBadge(v)},
    {k: 'act', label: '', html: (v, r) => r.status === 'Broken'
        ? `<button class="btn btn-ghost" data-fix="${esc(r.from)}|${esc(r.to)}">Fix</button>` : ''}
  ], LINKS.filter(l => matchQ(l.from, l.to, l.label)), {sort: 'status', dir: 'asc', pageSize: 8});

  el('pgerrPill').textContent = PAGE_ERRORS.filter(e => e.status === 'Open').length + ' open';
  renderTable('pgerrBody', [
    {k: 'path', label: 'Route'},
    {k: 'code', label: 'Code'},
    {k: 'detail', label: 'What happened'},
    {k: 'count', label: 'Hits', num: true},
    {k: 'status', label: 'State', html: v => okBadge(v)},
    {k: 'act', label: '', html: (v, r) => r.status === 'Open'
        ? `<button class="btn btn-ghost" data-pgerr="${esc(r.path)}|${esc(r.code)}">Acknowledge</button>` : ''}
  ], PAGE_ERRORS, {sort: 'count', pageSize: 6});

  const thin = PAGES.filter(p => !p.seo || p.seo.length < 30);
  el('seoBox').innerHTML = strip([
    ['Titles', PAGES.length - thin.length + '/' + PAGES.length],
    ['Descriptions', PAGES.length + '/' + PAGES.length],
    ['Sitemap', 'Submitted'],
    ['Robots', 'Allow all public routes']
  ]) + `<div class="minihead" style="margin-top:9px">Largest contentful paint and SEO score by page</div>` +
    PAGES.slice(0, 6).map(p => `<div class="risk"><div><div class="rn">${esc(p.title)}</div>
      <div class="rs">${esc(p.seo)}</div></div>
      <div class="rv">${okBadge(p.seo && p.seo.length >= 30 ? 'Good' : 'Review')}</div></div>`).join('');

  el('pageGrid').innerHTML =
    chartBox({title: 'Edits by page', sub: 'How often each route changes', type: 'bar', h: 180,
      cats: PAGES.slice(0, 8).map(p => p.path), series: [{name: 'Edits', data: PAGES.slice(0, 8).map(p => p.edits)}],
      value: num(sum(PAGES, p => p.edits))}) +
    chartBox({title: 'Page visibility', sub: 'Public, hidden and private', type: 'donut', h: 180,
      cats: ['Public', 'Hidden', 'Private'],
      series: [{name: 'Pages', data: ['Public', 'Hidden', 'Private'].map(v => PAGES.filter(p => p.visibility === v).length)}],
      value: PAGES.length + ' pages'});
}
function openPage(path){
  const p = PAGES.find(x => x.path === path);
  if(!p) return;
  openModal(p.title + ' — ' + p.path, p.visibility + ' · access: ' + p.access,
    `<div class="pfields" style="grid-template-columns:1fr 1fr">
      ${field('Path', esc(p.path))}${field('Visibility', okBadge(p.visibility))}
      ${field('Access', esc(p.access))}${field('Order', num(p.order))}
      ${field('Last edited', fmtDate(p.updated))}${field('Edits', num(p.edits))}
      ${field('SEO title', esc(p.seo))}${field('State', okBadge(p.status))}
    </div>`,
    [{label: 'Make public', act: () => { p.visibility = 'Public'; closeModal(); renderPages(); toast(p.title + ' is public'); }},
     {label: 'Edit SEO', act: () => openSeo(p)},
     {label: 'Close', act: 'close'}]);
}
function openSeo(p){
  openModal('Metadata and SEO — ' + p.title, p.path,
    `<div class="fg"><label>Page title</label><input id="seoTitle" value="${esc(p.title)}" /></div>
     <div class="fg" style="margin-top:8px"><label>Meta description</label><textarea id="seoDesc" rows="3" style="width:100%">${esc(p.seo)}</textarea></div>`,
    [{label: 'Save', cls: 'btn-gold', act: () => {
        p.seo = (el('seoDesc').value || '').trim() || p.seo;
        p.updated = TODAY;
        closeModal(); renderPages(); logChange('Pages', p.path + ' metadata', 'previous description', p.seo.slice(0, 40));
        toast('Metadata saved');
      }}, {label: 'Close', act: 'close'}]);
}
</script>
