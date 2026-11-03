<script>
/* ============================================================
   FEES & PENALTIES (2/8)
   Filter state, lookups, sortable/paginated tables with readable
   cells, the record drill-down, and the export/print utilities.
   ============================================================ */

const prodName  = id => (PROD_BY_ID[id] || {}).name || '—';
const staffName = id => (STAFF_BY_ID[id] || {}).name || '—';
const custName  = id => (CUST_BY_ID[id] || {}).name || '—';

let REFRESH = '30 Oct 2026 · 08:15';
const lastRefresh = () => REFRESH;

/* ---------------- filter state ---------------- */
const FILTER = {
  from: '2026-01-01', to: TODAY,
  lane: '',        // Fees / Penalties / Waivers / Reversals / Collections / Configuration
  kind: '',
  type: '',
  severity: '',
  status: '',
  owner: '',
  region: '',
  product: '',
  q: ''
};
const inRange = d => (!FILTER.from || d >= FILTER.from) && (!FILTER.to || d <= FILTER.to);
const matchQ = (...bits) => {
  const q = FILTER.q.trim().toLowerCase();
  if(!q) return true;
  return bits.filter(Boolean).join(' ').toLowerCase().includes(q);
};
function passLane(item){
  if(!FILTER.lane) return true;
  return item.lane === FILTER.lane;
}
function passSeverity(item){
  if(!FILTER.severity) return true;
  return item.severity === FILTER.severity;
}
function passStatus(item){
  if(!FILTER.status) return true;
  return item.status === FILTER.status;
}
function passOwner(item){
  if(!FILTER.owner) return true;
  return item.owner === FILTER.owner;
}
function passRegion(item){
  if(!FILTER.region) return true;
  return item.region === FILTER.region;
}
function passProduct(item){
  if(!FILTER.product) return true;
  return item.product === FILTER.product;
}

/* ---------------- period buckets (monthly, always) ---------------- */
function buckets(){
  return MONTHS.filter(m => m >= FILTER.from.slice(0,7) && m <= FILTER.to.slice(0,7));
}
function bucketKey(date){ return String(date).slice(0,7); }
function bucketLabel(k){ return monthLabel(k); }
function seriesBy(items, dateOf, valueOf){
  const keys = buckets(), idx = {};
  keys.forEach(k => idx[k] = 0);
  items.forEach(it => {
    const k = bucketKey(dateOf(it));
    if(k in idx) idx[k] += Number(valueOf(it)) || 0;
  });
  return {cats: keys.map(bucketLabel), keys, data: keys.map(k => idx[k])};
}
function countBy(items, dateOf){
  return seriesBy(items, dateOf, () => 1);
}

/* ---------------- sortable, paginated tables ---------------- */
/* a plain column still reads properly: dates as dates, dashes for blanks */
function fpCell(col, row){
  const v = row[col.k];
  if(col.html){
    const html = String(col.html(v, row));
    const t = html.trim();
    if(/^\d{4}-\d{2}-\d{2}([ T]\d{2}:\d{2})?$/.test(t)) return esc(fpWhen(t));
    return html;
  }
  if(v === null || v === undefined || v === '') return '<span class="muted">—</span>';
  const s = String(v);
  if(/^\d{4}-\d{2}-\d{2}([ T]\d{2}:\d{2})?$/.test(s)) return esc(fpWhen(s));
  if(/^(month|period)$/i.test(col.k) && /^\d{4}-\d{2}$/.test(s)) return esc(monthLabel(s));
  return esc(s);
}
const TBL = {}, TBL_CFG = {}, STORE_ROWS = {};
function renderTable(hostId, cols, rows, opts = {}){
  const st = TBL[hostId] = TBL[hostId] || {sort: opts.sort || (cols.find(c => c.num) || cols[0]).k,
    dir: opts.dir || 'desc', page: 1};
  const pageSize = opts.pageSize || 8;
  rows = rows.slice();
  const col = cols.find(c => c.k === st.sort) || cols[0];
  rows.sort((a, b) => {
    const x = col.num ? Number(a[st.sort]) || 0 : String(a[st.sort] == null ? '' : a[st.sort]).toLowerCase();
    const y = col.num ? Number(b[st.sort]) || 0 : String(b[st.sort] == null ? '' : b[st.sort]).toLowerCase();
    if(x < y) return st.dir === 'asc' ? -1 : 1;
    if(x > y) return st.dir === 'asc' ? 1 : -1;
    return 0;
  });
  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  st.page = Math.min(st.page, pages);
  const slice = rows.slice((st.page - 1) * pageSize, st.page * pageSize);
  const head = cols.map(c => `<th class="sortable${c.num ? ' num' : ''}" data-tblsort="${hostId}" data-k="${c.k}">`
    + `${esc(c.label)}${st.sort === c.k ? `<span class="ar">${st.dir === 'asc' ? '▲' : '▼'}</span>` : ''}</th>`).join('');
  const clickable = opts.onRow !== false;
  const body = slice.map((r, i) => {
    const idx = (st.page - 1) * pageSize + i;
    return `<tr${clickable ? ` class="rowlink" data-tblrow="${hostId}" data-i="${idx}"` : ''}>`
      + cols.map(c => `<td${c.num ? ' class="num"' : ''}>${fpCell(c, r)}</td>`).join('')
      + '</tr>';
  }).join('') || `<tr><td colspan="${cols.length}" class="empty">Nothing matches the current filters.</td></tr>`;
  const host = el(hostId);
  if(!host) return;
  TBL_CFG[hostId] = {cols, rows: rows.slice(), opts};
  STORE_ROWS[hostId] = rows;
  const foot = `<tr><td colspan="${cols.length}" style="border:0;padding-top:7px">
      <div class="tblfoot"><span>${num(rows.length)} row${rows.length === 1 ? '' : 's'} · page ${st.page} of ${pages}</span>
      <div class="pager">
        <button class="btn btn-ghost" data-tblpage="${hostId}" data-p="-1" ${st.page <= 1 ? 'disabled' : ''}>‹ Prev</button>
        <button class="btn btn-ghost" data-tblpage="${hostId}" data-p="1" ${st.page >= pages ? 'disabled' : ''}>Next ›</button>
      </div></div></td></tr>`;
  const table = host.closest('table') || host;
  const thead = table.querySelector('thead');
  if(thead) thead.innerHTML = '<tr>' + head + '</tr>';
  host.innerHTML = body + foot;
}
function sortOrPage(e){
  const th = e.target.closest('[data-tblsort]');
  if(th){
    const host = th.dataset.tblsort, key = th.dataset.k;
    const st = TBL[host] = TBL[host] || {sort: key, dir: 'desc', page: 1};
    if(st.sort === key) st.dir = st.dir === 'asc' ? 'desc' : 'asc';
    else { st.sort = key; st.dir = 'desc'; }
    st.page = 1;
    const cfg = TBL_CFG[host];
    if(cfg) renderTable(host, cfg.cols, cfg.rows, cfg.opts);
    return true;
  }
  const pg = e.target.closest('[data-tblpage]');
  if(pg){
    const host = pg.dataset.tblpage;
    TBL[host] = TBL[host] || {sort: '', dir: 'desc', page: 1};
    TBL[host].page = Math.max(1, TBL[host].page + Number(pg.dataset.p));
    const cfg = TBL_CFG[host];
    if(cfg) renderTable(host, cfg.cols, cfg.rows, cfg.opts);
    return true;
  }
  const row = e.target.closest('[data-tblrow]');
  if(row && !e.target.closest('button')){
    const host = row.dataset.tblrow;
    const rec = (STORE_ROWS[host] || [])[Number(row.dataset.i)];
    if(rec && rec._open) rec._open();
    else if(rec) openRecord(host, rec);
    return true;
  }
  return false;
}

/* the label map keeps camelCase keys reading as words */
const FP_LABELS = {
  id:'Charge', ref:'Reference', charge:'Charge', kind:'Kind', type:'Fee type', typeName:'Fee type',
  cust:'Customer', loan:'Loan', app:'Application', product:'Product', base:'Base amount',
  basis:'Basis', rate:'Rate', assessed:'Assessed', due:'Due', amount:'Amount', paid:'Paid',
  waived:'Waived', reversed:'Reversed', balance:'Balance', status:'State', officer:'Officer',
  region:'Branch', method:'Method', receipt:'Receipt', reason:'Reason', source:'Raised from',
  graceDays:'Grace days', daysLate:'Days late', calc:'Calculation', note:'Note', notes:'Notes',
  requestedBy:'Requested by', requestedOn:'Requested on', decidedBy:'Decided by',
  decidedOn:'Decided on', approvedBy:'Approved by', approvedOn:'Approved on', selfApproval:'Self-approval',
  document:'Supporting document', refund:'Paid back to', entry:'Entry', debit:'Debit', credit:'Credit',
  account:'Account', when:'When', to:'To', channel:'Channel', event:'Event', template:'Template',
  job:'Job', runs:'Runs', lastRun:'Last run', rows:'Rows', size:'Size', rls:'Row policy',
  function:'Written by', lastWrite:'Last write', invoker:'Invoker', calls:'Calls', message:'Message',
  code:'Code', severity:'Severity', area:'Area', from:'Previous', to2:'Updated', by:'Officer',
  what:'Setting', key:'Report', title:'Report', desc:'What it shows', formats:'Formats'
};
const fpLabel = k => FP_LABELS[k] || String(k).replace(/_/g, ' ').replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/^./, c => c.toUpperCase());
const FP_MONEY = /^(amount|paid|waived|reversed|balance|base|debit|credit|assessed|refund|fee|penalty|total|outstanding|collected)$/i;
const FP_DATE  = /^(assessed|due|requestedOn|decidedOn|approvedOn|when|lastRun|lastWrite|effective)$/i;

function fpValue(key, v){
  if(v === null || v === undefined || v === '') return '<span class="muted">—</span>';
  if(typeof v === 'object') return esc(JSON.stringify(v));
  const s = String(v);
  if(FP_DATE.test(key) && /^\d{4}-\d{2}-\d{2}/.test(s)) return esc(fpWhen(s));
  if(/^(cust)$/i.test(key) && CUST_BY_ID[s]) return esc(custName(s) + ' · ' + s);
  if(/^(officer|by|requestedBy|decidedBy|approvedBy)$/i.test(key) && STAFF_BY_ID[s]) return esc(staffName(s) + ' · ' + s);
  if(/^(product)$/i.test(key) && PROD_BY_ID[s]) return esc(prodName(s));
  if(/^(status|kind|severity)$/i.test(key)) return fpState(s);
  if(FP_MONEY.test(key) && /^-?\d+(\.\d+)?$/.test(s)) return esc(money(Number(s)));
  if(/^(rate)$/i.test(key) && /^-?\d+(\.\d+)?$/.test(s)) return esc(Number(s) <= 1 ? fpPct(Number(s) * 100) : Number(s) + '%');
  return esc(s);
}

function openRecord(host, rec){
  const cfg = TBL_CFG[host] || {cols: []};
  const idCol = (cfg.cols || []).find(c => /^[A-Z]{2,5}-/.test(String(rec[c.k] || '')) && !/^\d{4}-/.test(String(rec[c.k])));
  const head = (idCol && rec[idCol.k]) || (cfg.cols[0] && rec[cfg.cols[0].k]) || rec.id || 'Record';
  const used = {}, usedVals = {};
  const main = [];
  (cfg.cols || []).forEach(c => {
    const v = rec[c.k];
    if(v === null || v === undefined || typeof v === 'object') return;
    const html = fpValue(c.k, v);
    if(html.indexOf('class="muted"') >= 0) return;
    if(usedVals[html]) return;
    used[c.label] = 1; usedVals[html] = 1;
    main.push(`<div class="pfield"><div class="pk">${esc(c.label)}</div><div class="pv">${html}</div></div>`);
  });
  const COL_KEYS = (cfg.cols || []).map(c => c.k);
  const extras = [];
  Object.keys(rec).forEach(k => {
    if(k.charAt(0) === '_' || COL_KEYS.indexOf(k) >= 0) return;
    const v = rec[k];
    if(v === null || v === undefined || typeof v === 'object' || v === '') return;
    const label = fpLabel(k);
    const html = fpValue(k, v);
    if(html.indexOf('class="muted"') >= 0) return;
    if(used[label] || usedVals[html]) return;
    used[label] = 1; usedVals[html] = 1;
    extras.push({k, label, html});
  });
  const money2 = extras.filter(x => FP_MONEY.test(x.k));
  const dates = extras.filter(x => FP_DATE.test(x.k) && money2.indexOf(x) < 0);
  const rest  = extras.filter(x => money2.indexOf(x) < 0 && dates.indexOf(x) < 0);
  const block = (title, list) => list.length
    ? `<div class="recsub">${esc(title)}</div><div class="recgrid">${list.map(x =>
        `<div class="pfield"><div class="pk">${esc(x.label)}</div><div class="pv">${x.html}</div></div>`).join('')}</div>`
    : '';
  openModal(String(head),
    (cfg.rows ? num(cfg.rows.length) + ' rows in this register' : 'The whole record') + ' · ' + filterLine(),
    `<div class="recsheet">
      <div class="recgrid">${main.join('')}</div>
      ${block('Money on this record', money2)}
      ${block('Dates and timing', dates)}
      ${block('Other details', rest)}
    </div>`,
    [{label: 'Close', act: 'close'}]);
}

/* ---------------- record panels ---------------- */
const field = (label, value) =>
  `<div class="pfield"><div class="pk">${esc(label)}</div><div class="pv">${value}</div></div>`;
const badge = (text, tone) => `<span class="badge ${tone}">${esc(text)}</span>`;
const sevTone = s => s === 'Critical' ? 'b-crit' : s === 'High' ? 'b-crit' : s === 'Medium' ? 'b-warn' : 'b-gray';
const statTone = s => /^(Cleared|Compliant|Verified|Resolved|Closed|Approved|Pass)$/i.test(s) ? 'b-ok'
  : /^(Open|Pending|In review|Assigned|Escalated|Investigating|Exception|Breach|Overdue|Failed)$/i.test(s) ? 'b-warn'
  : /^(Blocked|Rejected|Critical|Violation|Expired|Flagged)$/i.test(s) ? 'b-crit' : 'b-gray';

/* ---------------- exports ---------------- */
const EXPORTS = [
  {when: TODAY + ' 08:42', report: 'Fees Assessed Report', format: 'CSV', rows: 640, by: 'Chikondi Mwale', filters: '01 Jan 2026 – 30 Oct 2026'},
  {when: addDays(TODAY, -1) + ' 17:05', report: 'Penalties Collected Report', format: 'Excel', rows: 210, by: 'Esther Mwale', filters: '01 Oct 2026 – 29 Oct 2026'},
  {when: addDays(TODAY, -2) + ' 09:20', report: 'Outstanding Charges Report', format: 'PDF', rows: 318, by: 'Tadala Msonthi', filters: '01 Jan 2026 – 28 Oct 2026'},
  {when: addDays(TODAY, -5) + ' 14:35', report: 'Charges by Loan Product', format: 'CSV', rows: 5, by: 'Chikondi Mwale', filters: '01 Jul 2026 – 30 Oct 2026'}
];
function brandHtml(title, sub){
  return `<div class="brandblock"><div class="bm">G</div>
    <div><div style="font-weight:800;font-size:12px">GOLDEN FINANCIAL SERVICES</div>
      <div style="font-size:9px;letter-spacing:1px;color:#8A6D0F;font-weight:700">LILONGWE · MALAWI</div></div>
    <div style="margin-left:auto;text-align:right;font-size:9px;color:#6B7280">
      ${esc(title)}<br>${esc(sub)}<br>${fmtDate(TODAY)}</div></div>`;
}
function filterLine(){
  const bits = [`${fmtDate(FILTER.from)} – ${fmtDate(FILTER.to)}`];
  if(FILTER.lane) bits.push('area: ' + FILTER.lane);
  if(FILTER.severity) bits.push('severity: ' + FILTER.severity);
  if(FILTER.status) bits.push('status: ' + FILTER.status);
  if(FILTER.owner) bits.push('owner: ' + staffName(FILTER.owner));
  if(FILTER.region) bits.push('region: ' + FILTER.region);
  if(FILTER.product) bits.push('product: ' + prodName(FILTER.product));
  if(FILTER.q) bits.push('search: "' + FILTER.q + '"');
  return bits.join(' · ');
}
function logExport(report, format, rows){
  EXPORTS.unshift({when: TODAY + ' ' + new Date().toTimeString().slice(0, 5), report, format, rows,
    by: 'Chikondi Mwale', filters: filterLine()});
  renderExportHistory();
}
function renderExportHistory(){
  const body = el('expHistoryBody');
  const count = el('expCount');
  if(count) count.textContent = EXPORTS.length;
  if(!body) return;
  body.innerHTML = EXPORTS.slice(0, 12).map((x, i) => `<tr class="rowlink" data-exp="${i}">
    <td style="white-space:nowrap">${esc(x.when)}</td><td>${esc(x.report)}</td><td>${x.format}</td>
    <td class="num">${num(x.rows)}</td><td>${esc(x.by)}</td><td style="font-size:9.5px">${esc(x.filters)}</td></tr>`).join('')
    || '<tr><td colspan="6" class="empty">No exports yet — generate a report below.</td></tr>';
}

function csvCell(v){ const s = String(v == null ? '' : v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }
function toCsv(rows){ return rows.map(r => r.map(csvCell).join(',')).join('\r\n'); }
function downloadFile(name, mime, data){
  try{
    const blob = new Blob([data], {type: mime});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    toast('Exported ' + name);
    return true;
  }catch(err){
    openModal('Export ready', name, `<div class="note gold"><div>This browser blocked the download inside the
      embedded preview. Open the portal in its own tab to save the file.</div></div>`, [{label: 'Close', act: 'close'}]);
    return false;
  }
}

/* compact stored-zip .xlsx writer */
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for(let n = 0; n < 256; n++){ let c = n; for(let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
  return t;
})();
function crc32(bytes){ let c = 0xFFFFFFFF; for(let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
function utf8(str){
  const out = [];
  for(let i = 0; i < str.length; i++){
    let c = str.charCodeAt(i);
    if(c < 0x80) out.push(c);
    else if(c < 0x800){ out.push(0xC0 | (c >> 6), 0x80 | (c & 63)); }
    else if(c < 0xD800 || c >= 0xE000){ out.push(0xE0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63)); }
    else {
      i++; const c2 = str.charCodeAt(i); const cp = 0x10000 + ((c - 0xD800) << 10) + (c2 - 0xDC00);
      out.push(0xF0 | (cp >> 18), 0x80 | ((cp >> 12) & 63), 0x80 | ((cp >> 6) & 63), 0x80 | (cp & 63));
    }
  }
  return new Uint8Array(out);
}
function zipStore(files){
  const chunks = [], central = []; let offset = 0;
  files.forEach(f => {
    const name = utf8(f.name), data = f.data, crc = crc32(data);
    const lh = new Uint8Array(30 + name.length), dv = new DataView(lh.buffer);
    dv.setUint32(0, 0x04034b50, true); dv.setUint16(4, 20, true); dv.setUint32(14, crc, true);
    dv.setUint32(18, data.length, true); dv.setUint32(22, data.length, true); dv.setUint16(26, name.length, true);
    lh.set(name, 30); chunks.push(lh, data);
    const ch = new Uint8Array(46 + name.length), cv = new DataView(ch.buffer);
    cv.setUint32(0, 0x02014b50, true); cv.setUint16(4, 20, true); cv.setUint16(6, 20, true);
    cv.setUint32(16, crc, true); cv.setUint32(20, data.length, true); cv.setUint32(24, data.length, true);
    cv.setUint16(28, name.length, true); cv.setUint32(42, offset, true); ch.set(name, 46);
    central.push(ch); offset += lh.length + data.length;
  });
  const cdSize = central.reduce((s, c) => s + c.length, 0);
  const end = new Uint8Array(22), ev = new DataView(end.buffer);
  ev.setUint32(0, 0x06054b50, true); ev.setUint16(8, files.length, true); ev.setUint16(10, files.length, true);
  ev.setUint32(12, cdSize, true); ev.setUint32(16, offset, true);
  const parts = [...chunks, ...central, end];
  const out = new Uint8Array(parts.reduce((s, p) => s + p.length, 0));
  let pos = 0; parts.forEach(p => { out.set(p, pos); pos += p.length; });
  return out;
}
function colName(i){ let s = ''; i++; while(i > 0){ const m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); } return s; }
function xlsxBytes(title, cols, rows){
  let body = '';
  [cols.map(c => (c && typeof c === 'object') ? c.label : c)].concat(rows).forEach((row, ri) => {
    let cells = '';
    row.forEach((v, ci) => {
      const ref = colName(ci) + (ri + 1);
      cells += typeof v === 'number'
        ? `<c r="${ref}"><v>${v}</v></c>`
        : `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${esc(v)}</t></is></c>`;
    });
    body += `<row r="${ri + 1}">${cells}</row>`;
  });
  const files = [
    {name: '[Content_Types].xml', data: utf8(`<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>`)},
    {name: '_rels/.rels', data: utf8(`<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`)},
    {name: 'xl/workbook.xml', data: utf8(`<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${esc(String(title).slice(0, 28))}" sheetId="1" r:id="rId1"/></sheets></workbook>`)},
    {name: 'xl/_rels/workbook.xml.rels', data: utf8(`<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>`)},
    {name: 'xl/worksheets/sheet1.xml', data: utf8(`<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${body}</sheetData></worksheet>`)}
  ];
  return zipStore(files);
}
function printTable(title, cols, rows){
  const html = `${brandHtml(title, filterLine())}
    <table style="width:100%;border-collapse:collapse;font-size:10px">
      <thead><tr>${cols.map(c => `<th style="text-align:${c.num ? 'right' : 'left'};border-bottom:1px solid #E6E8EE;padding:5px">${esc(c.label)}</th>`).join('')}</tr></thead>
      <tbody>${rows.slice(0, 400).map(r => `<tr>${r.map((v, i) =>
        `<td style="text-align:${cols[i].num ? 'right' : 'left'};border-bottom:1px dashed #EDEFF4;padding:4px">${esc(v)}</td>`).join('')}</tr>`).join('')}</tbody>
    </table>
    <div style="font-size:8px;color:#8A90A0;margin-top:8px">Generated ${fmtDate(TODAY)} · Golden Financial Services · ${esc(filterLine())}</div>`;
  doPrint(title, html);
}
function doPrint(title, html){
  try{
    const frame = document.createElement('iframe');
    frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0';
    document.body.appendChild(frame);
    const doc = frame.contentWindow.document;
    doc.open();
    doc.write(`<html><head><title>${esc(title)}</title><style>
      body{font-family:"Segoe UI",Arial,sans-serif;padding:22px;color:#0F1115}
      h1{font-size:16px;margin:0 0 4px} table{width:100%;border-collapse:collapse;font-size:10px}
      .brandblock{display:flex;align-items:center;gap:9px;padding-bottom:8px;border-bottom:2px solid #C9A227;margin-bottom:10px}
      .bm{width:30px;height:30px;border-radius:8px;background:#C9A227;display:grid;place-items:center;font-weight:800;color:#2A2100}
      @media print{ @page{margin:12mm} }
    </style></head><body>${html}</body></html>`);
    doc.close();
    setTimeout(() => {
      try{ frame.contentWindow.focus(); frame.contentWindow.print(); }catch(e){}
      setTimeout(() => frame.remove(), 1500);
    }, 250);
    toast('Print dialog opened — choose Save as PDF for a PDF copy.');
  }catch(err){
    openModal('Print preview', title, `<div class="note gold"><div>Printing is blocked inside this embedded preview.
      Open the portal in its own tab and use Print.</div></div>`, [{label: 'Close', act: 'close'}]);
  }
}
function exportChartImage(hostId){
  const host = el(hostId);
  const svg = host && host.querySelector('svg');
  if(!svg) return toast('Nothing to export here yet — build the chart first.', 'err');
  try{
    const data = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = (svg.viewBox.baseVal.width || 720) * 2;
      canvas.height = (svg.viewBox.baseVal.height || 210) * 2;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = 'compliance-chart-' + hostId + '-' + TODAY + '.png';
      document.body.appendChild(a); a.click(); a.remove();
      toast('Chart image exported as PNG');
      logExport('Chart image · ' + hostId, 'PNG', 1);
    };
    img.onerror = () => toast('This browser could not rasterise the chart — use Print instead.', 'err');
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(data)));
  }catch(err){
    toast('Image export is not supported in this browser.', 'err');
  }
}
</script>
