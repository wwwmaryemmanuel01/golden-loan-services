<script>
/* ============================================================
   DEPOSITS & WITHDRAWALS MANAGEMENT & CONNECTIONS (2/7)
   Filter state, lookups, sortable/paginated tables, record
   drill-down, and the export/print utilities.
   ============================================================ */

const prodName  = id => (PROD_BY_ID[id] || {}).name || '—';
const staffName = id => (STAFF_BY_ID[id] || {}).name || '—';
const custName  = id => (CUST_BY_ID[id] || {}).name || '—';

let REFRESH = '30 Oct 2026 · 08:15';
const lastRefresh = () => REFRESH;

/* ---------------- filter state ---------------- */
const FILTER = {
  from: '2026-01-01', to: TODAY,
  lane: '',        // Deposits / Withdrawals / Ledger / Cash / Mobile money / Bank / Security
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
      + cols.map(c => `<td${c.num ? ' class="num"' : ''}>${c.html ? c.html(r[c.k], r) : esc(r[c.k])}</td>`).join('')
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

function openRecord(host, rec){
  const cfg = TBL_CFG[host] || {cols: []};
  const label = (cfg.cols[0] && rec[cfg.cols[0].k]) || 'Record';
  const body = cfg.cols.map(c => {
    const v = rec[c.k];
    if(v == null || typeof v === 'object') return '';
    return field(c.label, esc(String(v)));
  }).join('');
  const extra = Object.keys(rec).filter(k => k.charAt(0) !== '_' && !cfg.cols.some(c => c.k === k)
    && (typeof rec[k] === 'string' || typeof rec[k] === 'number'));
  openModal(String(label), `${num(cfg.rows ? cfg.rows.length : 0)} rows in this register · click any column header to sort`,
    `<div class="pfields" style="grid-template-columns:1fr 1fr">${body}</div>`
    + (extra.length ? `<div class="minihead" style="margin-top:10px">Other fields</div>
       <div class="pfields" style="grid-template-columns:1fr 1fr">${extra.map(k => field(k, esc(String(rec[k])))).join('')}</div>` : ''),
    [{label:'Close', act:'close'}]);
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
  {when: TODAY + ' 08:52', report: 'Daily Deposits Report', format: 'CSV', rows: 21, by: 'Chikondi Mwale', filters: '30 Oct 2026'},
  {when: addDays(TODAY, -1) + ' 17:20', report: 'Withdrawals by Payment Method', format: 'Excel', rows: 11, by: 'Thokozani Banda', filters: '01 Oct 2026 – 29 Oct 2026'},
  {when: addDays(TODAY, -2) + ' 09:05', report: 'Reconciliation Report', format: 'PDF', rows: 26, by: 'Grace Nyirenda', filters: '01 Jan 2026 – 28 Oct 2026'},
  {when: addDays(TODAY, -4) + ' 14:42', report: 'Transaction Fees Report', format: 'CSV', rows: 14, by: 'Chikondi Mwale', filters: '01 Sep 2026 – 30 Oct 2026'}
];
function brandHtml(title, sub){
  return `<div class="brandblock"><img src="${window.GLS_DOC_MARK || 'assets/logo-mark-96.png'}" alt="" style="height:32px;width:auto;display:block">
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
