<script>
/* ============================================================
   GOLDEN FINANCIAL SERVICES · AUDIT LOGS  (4/4)
   Sections 12–18, event details, investigation, alerts,
   reports, retention, exports and boot.
   ============================================================ */

/* ---------- downloads & printing ---------- */
function downloadFile(name, mime, text){
  if(window.self !== window.top){
    openModal('Export preview', name, `
      <div class="note gold"><div>Downloads are blocked inside this embedded preview frame. Copy the contents below,
        or open the portal in its own tab to save the file.</div></div>
      <textarea readonly style="width:100%;min-height:240px;font-family:ui-monospace,monospace;font-size:10.5px;
        border:1px solid var(--line);border-radius:9px;padding:10px;margin-top:9px">${esc(String(text).slice(0,4000))}</textarea>`,
      [{label:'Close', act:'close'}]);
    return;
  }
  try{
    const blob = new Blob([text], {type:mime});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(a.href), 2000);
    toast(`Exported ${name}.`);
  }catch(err){
    openModal('Export preview', name, `<textarea readonly style="width:100%;min-height:240px;
      font-family:ui-monospace,monospace;font-size:10.5px;border:1px solid var(--line);border-radius:9px;padding:10px">${esc(String(text).slice(0,4000))}</textarea>`,
      [{label:'Close', act:'close'}]);
  }
}
function doPrint(title){
  if(window.self !== window.top){
    openModal('Print preview', title, `
      <div class="note gold"><div>The print dialog is unavailable inside this embedded preview. Open the portal in
        its own tab and use Print — the document is already print-formatted.</div></div>`,
      [{label:'Close', act:'close'}]);
    return;
  }
  window.print();
}
function printHtml(title, html){
  openModal('Print preview', title,
    `<div class="note"><div>Use your browser's print dialog — choose <b>Save as PDF</b> for a PDF copy.</div></div>
     <div style="margin-top:9px">${html}</div>`,
    [{label:'Print / PDF', act:()=>doPrint(title)}, {label:'Close', act:'close'}]);
}
function csvCell(v){ const s = String(v==null?'':v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g,'""') + '"' : s; }
function toCsv(rows){ return rows.map(r=>r.map(csvCell).join(',')).join('\r\n'); }

/* ---------- minimal .xlsx writer (stored zip, inline strings) ---------- */
const CRC_TABLE = (()=>{
  const t = new Uint32Array(256);
  for(let n=0;n<256;n++){ let c = n; for(let k=0;k<8;k++) c = c&1 ? 0xEDB88320 ^ (c>>>1) : c>>>1; t[n] = c>>>0; }
  return t;
})();
function crc32(bytes){ let c = 0xFFFFFFFF; for(let i=0;i<bytes.length;i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xFF] ^ (c>>>8); return (c ^ 0xFFFFFFFF)>>>0; }
function utf8(str){
  const out = [];
  for(let i=0;i<str.length;i++){
    let c = str.charCodeAt(i);
    if(c < 0x80) out.push(c);
    else if(c < 0x800){ out.push(0xC0 | (c>>6), 0x80 | (c&63)); }
    else if(c < 0xD800 || c >= 0xE000){ out.push(0xE0 | (c>>12), 0x80 | ((c>>6)&63), 0x80 | (c&63)); }
    else { i++; const c2 = str.charCodeAt(i); const cp = 0x10000 + ((c-0xD800)<<10) + (c2-0xDC00);
      out.push(0xF0 | (cp>>18), 0x80 | ((cp>>12)&63), 0x80 | ((cp>>6)&63), 0x80 | (cp&63)); }
  }
  return new Uint8Array(out);
}
function zipStore(files){
  const chunks = [], central = []; let offset = 0;
  files.forEach(f=>{
    const name = utf8(f.name), data = f.data, crc = crc32(data);
    const lh = new Uint8Array(30 + name.length), dv = new DataView(lh.buffer);
    dv.setUint32(0, 0x04034b50, true); dv.setUint16(4, 20, true); dv.setUint16(10, 0, true); dv.setUint16(12, 0, true);
    dv.setUint32(14, crc, true); dv.setUint32(18, data.length, true); dv.setUint32(22, data.length, true);
    dv.setUint16(26, name.length, true);
    lh.set(name, 30);
    chunks.push(lh, data);
    const ch = new Uint8Array(46 + name.length), cv = new DataView(ch.buffer);
    cv.setUint32(0, 0x02014b50, true); cv.setUint16(4, 20, true); cv.setUint16(6, 20, true);
    cv.setUint32(16, crc, true); cv.setUint32(20, data.length, true); cv.setUint32(24, data.length, true);
    cv.setUint16(28, name.length, true); cv.setUint32(42, offset, true);
    ch.set(name, 46);
    central.push(ch);
    offset += lh.length + data.length;
  });
  const cdSize = central.reduce((s,c)=>s+c.length, 0);
  const end = new Uint8Array(22), ev = new DataView(end.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(8, files.length, true); ev.setUint16(10, files.length, true);
  ev.setUint32(12, cdSize, true); ev.setUint32(16, offset, true);
  const parts = [...chunks, ...central, end];
  const out = new Uint8Array(parts.reduce((s,p)=>s+p.length, 0));
  let pos = 0; parts.forEach(p=>{ out.set(p, pos); pos += p.length; });
  return out;
}
function colName(i){ let s = ''; i++; while(i > 0){ const m = (i-1)%26; s = String.fromCharCode(65+m) + s; i = Math.floor((i-1)/26); } return s; }
function sheetXml(d){
  let rows = '';
  [d.cols.map(c=>c[0])].concat(d.rows).forEach((row, ri)=>{
    let cells = '';
    row.forEach((v, ci)=>{
      const ref = colName(ci) + (ri+1);
      cells += typeof v === 'number'
        ? `<c r="${ref}"><v>${v}</v></c>`
        : `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${esc(v)}</t></is></c>`;
    });
    rows += `<row r="${ri+1}">${cells}</row>`;
  });
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${rows}</sheetData></worksheet>`;
}
function buildXlsx(name, d){ return writeXlsx(name, d); }
function writeXlsx(name, d){
  const sheetName = (d.title || 'Report').replace(/[\\\/\?\*\[\]:]/g,' ').slice(0, 28);
  const files = [
    {name:'[Content_Types].xml', data:utf8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
</Types>`)},
    {name:'_rels/.rels', data:utf8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`)},
    {name:'xl/workbook.xml', data:utf8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets><sheet name="${esc(sheetName)}" sheetId="1" r:id="rId1"/></sheets></workbook>`)},
    {name:'xl/_rels/workbook.xml.rels', data:utf8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
</Relationships>`)},
    {name:'xl/worksheets/sheet1.xml', data:utf8(sheetXml(d))}
  ];
  const bytes = zipStore(files);
  if(d.returnBytes) return bytes;
  try{
    const blob = new Blob([bytes], {type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(a.href), 2000);
    toast(`Exported ${name} · ${d.rows.length} rows.`);
  }catch(err){
    openModal('Excel export ready', name + ' · ' + d.rows.length + ' rows', `
      <div class="note gold"><div>A real .xlsx workbook was built in the browser (${(bytes.length/1024).toFixed(1)} KB)
        but this browser blocked the download. Open the portal in its own tab, or export CSV instead.</div></div>`,
      [{label:'Close', act:'close'}]);
  }
}
function exportRows(base, headers, rows, title, authority='Administrator and Auditor'){
  downloadFile(base + '.csv', 'text/csv;charset=utf-8', '\ufeff' + toCsv([headers].concat(rows)));
  logExport(title, 'CSV', rows.length, authority);
  toast('Exported ' + rows.length + ' rows · ' + title);
}
function exportLog(title){
  const rows = logRowsForExport();
  downloadFile('audit-log-' + TODAY + '.csv', 'text/csv;charset=utf-8',
    '\ufeff' + toCsv([['Event ID','Date & time','User','Username','Role','Action','Type','Module','Record','Outcome','Severity','IP','Description']].concat(rows)));
  logExport(title, 'CSV', rows.length);
  toast('Exported ' + rows.length + ' audit events.');
}

/* ===================== mutable records ===================== */
const ALERTS = [];
const INVEST = [];
const EXPORTS = [];
const SYS_INVEST = [];
const RET_HISTORY = [];
const COMP_REVIEWS = [];
const BACKUPS = [];
const INTEGRITY = {ok:true, checked:'2026-10-30 06:00', blocks:[], head:''};

const ALA = {sel:null, status:'', severity:''};

function seedRecords(){
  if(ALERTS.length) return;
  const mk = (o)=>Object.assign({id:'SEC-' + String(101 + ALERTS.length), status:'Open', owner:'Unassigned',
    opened:'2026-10-30', notes:[]}, o);
  ALERTS.push(
    mk({title:'Repeated failed login attempts — emwale', severity:'High', type:'Repeated failed logins',
      when:'2026-10-30 09:12', user:'Esther Mwale', detail:'7 failed attempts in 12 minutes from 10.4.4.05, followed by one success.', status:'Investigating', owner:'Grace Nyirenda'}),
    mk({title:'Permission granted outside the change window', severity:'Critical', type:'Unexpected permission change',
      when:'2026-10-29 17:48', user:'Chikondi Mwale', detail:'Lending approval limit raised to MK 5,000,000 at 17:48, after the 16:00 change cut-off.', owner:'Ruth Nsanja'}),
    mk({title:'Unusual repayment reversal', severity:'Critical', type:'Unusual repayment reversals',
      when:'2026-10-29 15:20', user:'Alinafe Nyirenda', detail:'Three reversals on one day, all on the same collection account, all posted within an hour.', owner:'Tadala Msonthi'}),
    mk({title:'Suspicious disbursement activity', severity:'High', type:'Suspicious disbursement',
      when:'2026-10-28 16:02', user:'Grace Nyirenda', detail:'Two payouts to the same wallet number on different loans within 10 minutes.', status:'Investigating', owner:'Tadala Msonthi'}),
    mk({title:'Repeated transaction failures — payments API', severity:'Medium', type:'Repeated transaction failures',
      when:'2026-10-28 11:40', user:'System', detail:'Six consecutive wallet callback failures with signature mismatch.', status:'Resolved', owner:'Grace Nyirenda',
      resolution:'Callback certificate renewed; failures stopped after 12:05.'}),
    mk({title:'Critical configuration change outside change control', severity:'Critical', type:'Critical configuration change',
      when:'2026-10-27 19:05', user:'Chikondi Mwale', detail:'Password policy and lockout threshold changed without a change request on file.', status:'Resolved', owner:'Ruth Nsanja',
      resolution:'Retrospective change request CHG-0412 approved by the compliance committee.'}),
    mk({title:'Unauthorised privileged action attempt', severity:'High', type:'Unauthorized privileged actions',
      when:'2026-10-27 10:15', user:'Fatsani Gondwe', detail:'Collections officer attempted to open system settings; blocked by role policy.', status:'Resolved', owner:'Grace Nyirenda',
      resolution:'Access was correctly denied; user re-briefed on role boundaries.'}),
    mk({title:'Bulk customer record exports', severity:'Medium', type:'Unusual data export',
      when:'2026-10-26 14:33', user:'Linda Mhango', detail:'Four customer data exports in 20 minutes, above the usual weekly volume.', status:'Dismissed', owner:'Ruth Nsanja',
      resolution:'Legitimate credit review exercise, confirmed with the Head of Credit.'}),
    mk({title:'Database error burst', severity:'Medium', type:'Repeated transaction failures',
      when:'2026-10-26 08:02', user:'System', detail:'Statement timeouts on the collections report; 3 failures in 6 minutes.', status:'Resolved', owner:'Grace Nyirenda',
      resolution:'Index added to the repayments table; no recurrence.'})
  );

  INVEST.push(
    {id:'INV-007', title:'Reversal pattern on collection account GF-000512', status:'Under review', owner:'Ruth Nsanja',
     opened:'2026-10-29', notes:['Three reversals within an hour, all keyed by the same cashier.',
       'Receipts re-checked against bank statement — two were genuine duplicates, one was not.',
       'Requested the till sheet for 29 Oct.'],
     events:EVENTS.filter(e=>e.action === 'Repayment reversed').slice(0,3).map(e=>e.id)},
    {id:'INV-006', title:'Failed logins from 10.4.4.05', status:'Open', owner:'Grace Nyirenda',
     opened:'2026-10-30', notes:['Seven failures then a success — device fingerprint matches the officer\u2019s own laptop.',
       'Likely a forgotten password rather than an attack; confirmation pending.'],
     events:EVENTS.filter(e=>e.type === 'Login' && e.outcome === 'Failed').slice(0,4).map(e=>e.id)}
  );

  EXPORTS.push(
    {when:'2026-10-30 08:41', report:'Daily audit summary', format:'CSV', rows:128, by:'Ruth Nsanja', authority:'Auditor · read-only'},
    {when:'2026-10-29 17:02', report:'Financial transaction audit', format:'Excel', rows:64, by:'Chikondi Mwale', authority:'Administrator'},
    {when:'2026-10-29 09:15', report:'Security events report', format:'PDF', rows:41, by:'Ruth Nsanja', authority:'Auditor · read-only'},
    {when:'2026-10-28 16:38', report:'Staff activity report', format:'CSV', rows:310, by:'Tadala Msonthi', authority:'Head of Credit'}
  );

  SYS_INVEST.push(
    {when:'2026-10-28 11:55', event:'API request failed', owner:'Grace Nyirenda', action:'Certificate renewed on the payments integration', status:'Resolved'},
    {when:'2026-10-26 08:30', event:'Database query failed', owner:'Grace Nyirenda', action:'Index added to repayments(loan_id, paid_at)', status:'Resolved'},
    {when:'2026-10-24 09:12', event:'Notification delivery failed', owner:'Memory Phiri', action:'Gateway retry configured; 14 messages re-sent', status:'Resolved'},
    {when:'2026-10-30 09:40', event:'Disbursement failed', owner:'Alinafe Nyirenda', action:'Wallet number verified with the customer', status:'Open'}
  );

  RET_HISTORY.push(
    {when:'2026-10-01 06:00', what:'Archive run', detail:'1,284 events sealed into the cold store (Jan–Jun 2026)', by:'System'},
    {when:'2026-09-15 14:20', what:'Policy change', detail:'Retention extended from 5 years to 7 years', by:'Chikondi Mwale'},
    {when:'2026-08-01 06:00', what:'Archive run', detail:'640 events sealed into the cold store (2025)', by:'System'},
    {when:'2026-07-12 10:05', what:'Deletion request', detail:'Deletion request DR-0009 refused — retention period not expired', by:'Ruth Nsanja'}
  );

  COMP_REVIEWS.push(
    {when:'2026-10-15', reviewer:'Ruth Nsanja', scope:'Full audit record, Q3 2026', result:'Compliant', notes:'No gaps in the hash chain; two late approvals noted.'},
    {when:'2026-07-20', reviewer:'Ruth Nsanja', scope:'Financial transaction audit', result:'Compliant with findings', notes:'Three reversals lacked a second approver — process tightened.'},
    {when:'2026-04-08', reviewer:'External — RSM Malawi', scope:'Retention and integrity controls', result:'Compliant', notes:'Retention schedule evidenced; archive verified.'}
  );

  BACKUPS.push(
    {when:'2026-10-30 02:30', size:'1.84 GB', status:'Success', target:'Cold store · Malawi'},
    {when:'2026-10-29 02:30', size:'1.81 GB', status:'Success', target:'Cold store · Malawi'},
    {when:'2026-10-28 02:30', size:'1.79 GB', status:'Success', target:'Cold store · Malawi'},
    {when:'2026-10-27 02:30', size:'0 bytes', status:'Failed', target:'Cold store · Malawi'}
  );
}

/* event append helper used by every action in this module */
let auditSeqOffset = 0;
function logEvent(o){
  const ts = `${TODAY} ${clock()}:00`;
  const total = EVENTS.length + ARCHIVE.length + 1;
  const ev = {
    id:'AUD-2026-' + String(total + 900).padStart(6,'0'),
    ts, date:TODAY, time:ts.slice(11,19),
    user:o.user || 'Chikondi Mwale', username:(userByName(o.user || 'Chikondi Mwale').username),
    role:(userByName(o.user || 'Chikondi Mwale').role), userId:(userByName(o.user || 'Chikondi Mwale').id),
    action:o.action, type:o.type || 'Update', module:o.module,
    record:o.record || '—', outcome:o.outcome || 'Success', severity:o.severity || 'Info',
    desc:o.desc || '', changes:o.changes || null, txn:o.txn || '',
    corr:'CRQ-' + String(100000 + Math.floor(Math.random()*899999)),
    ip:userByName(o.user || 'Chikondi Mwale').ip, device:userByName(o.user || 'Chikondi Mwale').device,
    b:o.bucket || {}, archived:false
  };
  ev.block = 'BLK-' + String(Math.floor(EVENTS.length/25) + 1).padStart(3,'0');
  ev.hash = hashOf(ev.id + ev.ts + ev.user + ev.action);
  EVENTS.unshift(ev);
  auditSeqOffset++;
  return ev;
}

/* ===================== 12 · SYSTEM CONFIGURATION ===================== */
const CFG = {view:'', page:1, per:10, sel:null};

function configEvents(){
  return EVENTS.filter(e=>e.b.cfg).filter(e=> !CFG.view || e.b.cfg === CFG.view);
}

function renderConfig(){
  const list = configEvents();
  el('cfgCount').textContent = nf(list.length) + ' changes';
  el('cfgTiles').innerHTML = [
    {l:'Configuration changes', v:nf(EVENTS.filter(e=>e.b.cfg).length), s:'Every settings edit'},
    {l:'Loan products', v:nf(EVENTS.filter(e=>e.b.cfg === 'product').length), s:'Rates, limits and fees'},
    {l:'Approval workflow', v:nf(EVENTS.filter(e=>e.b.cfg === 'workflow').length), s:'Levels and thresholds', k:'red'},
    {l:'Payment methods', v:nf(EVENTS.filter(e=>e.b.cfg === 'payment').length), s:'Wallets and banks'},
    {l:'Security policy', v:nf(EVENTS.filter(e=>e.b.cfg === 'security').length), s:'Password and lockout rules', k:'red'},
    {l:'Backup & retention', v:nf(EVENTS.filter(e=>e.b.cfg === 'backup').length), s:'Schedules and windows'}
  ].map(t=>`<div class="kpi ${t.k||''}"><div class="kl">${t.l}</div><div class="kv">${t.v}</div>
    <div class="ks">${t.s}</div></div>`).join('');

  const pages = Math.max(1, Math.ceil(list.length/CFG.per));
  if(CFG.page > pages) CFG.page = pages;
  const slice = list.slice((CFG.page-1)*CFG.per, CFG.page*CFG.per);
  el('cfgBody').innerHTML = slice.map(e=>{
    const c = e.changes ? e.changes[0] : null;
    return `<tr class="rowlink" data-ev="${e.id}">
      <td style="white-space:nowrap">${fmtShort(e.date)} ${e.time.slice(0,5)}</td>
      <td>${esc(c ? c[0] : e.action)}<div style="font-size:9px;color:var(--muted)">${esc(e.action)}</div></td>
      <td style="font-size:9.5px">${esc(c ? c[1] : '—')}</td>
      <td style="font-size:9.5px;font-weight:700">${esc(c ? c[2] : '—')}</td>
      <td>${esc(e.user)}</td>
    </tr>`;
  }).join('') || '<tr><td colspan="5" class="empty">No configuration changes in this view.</td></tr>';
  el('cfgBody').querySelectorAll('[data-ev]').forEach(r=>{
    r.onclick = ()=>{ CFG.sel = r.dataset.ev; renderConfigDiff(); };
  });
  el('cfgPager').innerHTML = pagerHtml(list.length, CFG.page, CFG.per, 'cfgPrev', 'cfgNext');
  bindPager('cfgPrev', 'cfgNext', CFG, renderConfig);
  if(!CFG.sel || !EVENTS.some(e=>e.id === CFG.sel)) CFG.sel = slice[0] ? slice[0].id : null;
  renderConfigDiff();
}

function renderConfigDiff(){
  const e = byId(CFG.sel);
  if(!e){ el('cfgDiff').innerHTML = '<div class="empty">Select a configuration change.</div>'; return; }
  el('cfgDiff').innerHTML = `
    <div style="font-size:11px;font-weight:700">${esc(e.action)}</div>
    <div class="inline-note">${e.module} · ${e.record} · ${fmtTs(e.ts)}</div>
    ${diffBlock(e.changes)}
    <div class="pfields" style="margin-top:8px">
      <div class="pfield"><div class="pk">Changed by</div><div class="pv">${esc(e.user)}</div></div>
      <div class="pfield"><div class="pk">Role</div><div class="pv">${e.role}</div></div>
      <div class="pfield"><div class="pk">Severity</div><div class="pv">${e.severity}</div></div>
      <div class="pfield"><div class="pk">Event</div><div class="pv">${e.id}</div></div>
    </div>`;
}

function wireConfig(){
  el('cfgTabs').querySelectorAll('[data-cfg]').forEach(b=>{
    b.onclick = ()=>{
      CFG.view = b.dataset.cfg || ''; CFG.page = 1;
      el('cfgTabs').querySelectorAll('[data-cfg]').forEach(x=>x.classList.toggle('on', x === b));
      renderConfig();
    };
  });
  el('cfgExport').onclick = ()=>{
    const rows = configEvents().map(e=>[e.id, e.ts, e.action, e.module, e.record,
      e.changes ? e.changes.map(c=>c[0]+': '+c[1]+' -> '+c[2]).join('; ') : '', e.user, e.severity]);
    exportRows('configuration-audit', ['Event','When','Action','Module','Record','Change','By','Severity'], rows, 'System configuration audit');
  };
}

/* ===================== 13 · SYSTEM EVENTS ===================== */
const SYS = {view:'', page:1, per:10};

function systemEvents(){
  return EVENTS.filter(e=>e.b.sys).filter(e=> !SYS.view || e.b.sys === SYS.view);
}

function renderSystem(){
  const list = systemEvents();
  const open = list.filter(e=>e.outcome === 'Failed').length;
  el('sysOpenPill').textContent = open + ' open';
  el('sysTiles').innerHTML = [
    {l:'Application errors', v:nf(EVENTS.filter(e=>e.b.sys === 'app').length), s:'Unhandled exceptions', k:'red'},
    {l:'Database errors', v:nf(EVENTS.filter(e=>e.b.sys === 'db').length), s:'Timeouts and query failures'},
    {l:'Supabase events', v:nf(EVENTS.filter(e=>e.b.sys === 'supabase').length), s:'Connection pool'},
    {l:'API failures', v:nf(EVENTS.filter(e=>e.b.sys === 'api').length), s:'Upstream 5xx'},
    {l:'Delivery failures', v:nf(EVENTS.filter(e=>e.b.sys === 'notification').length), s:'SMS and email'},
    {l:'Payment errors', v:nf(EVENTS.filter(e=>e.b.sys === 'payment').length), s:'Wallet callbacks', k:'red'},
    {l:'Task failures', v:nf(EVENTS.filter(e=>e.b.sys === 'task').length), s:'Scheduled jobs'},
    {l:'Availability', v:nf(EVENTS.filter(e=>e.b.sys === 'availability').length), s:'Degraded periods'}
  ].map(t=>`<div class="kpi ${t.k||''}"><div class="kl">${t.l}</div><div class="kv">${t.v}</div>
    <div class="ks">${t.s}</div></div>`).join('');

  const pages = Math.max(1, Math.ceil(list.length/SYS.per));
  if(SYS.page > pages) SYS.page = pages;
  const slice = list.slice((SYS.page-1)*SYS.per, SYS.page*SYS.per);
  el('sysBody').innerHTML = slice.map(e=>`
    <tr class="rowlink" data-ev="${e.id}">
      <td style="white-space:nowrap">${fmtShort(e.date)} ${e.time.slice(0,5)}</td>
      <td class="mono" style="font-size:9px">${e.record}</td>
      <td>${esc(e.action)}<div style="font-size:9px;color:var(--muted)">${esc(e.desc)}</div></td>
      <td><span class="sev ${sevClass(e.severity)}">${e.severity}</span></td>
      <td><span class="badge ${outcomeTone(e.outcome)}">${e.outcome}</span></td>
      <td style="text-align:right"><button class="btn btn-ghost" data-ev-btn="${e.id}">Open</button></td>
    </tr>`).join('') || '<tr><td colspan="6" class="empty">No system events in this view.</td></tr>';
  bindRows('sysBody');
  el('sysPager').innerHTML = pagerHtml(list.length, SYS.page, SYS.per, 'sysPrev', 'sysNext');
  bindPager('sysPrev', 'sysNext', SYS, renderSystem);

  const services = [
    ['supabase', 'Supabase', 'db'], ['payments-api', 'Payments API', 'payment'],
    ['sms-gateway', 'SMS gateway', 'notification'], ['auth-service', 'Auth service', 'auth'],
    ['reports-worker', 'Reports worker', 'task']
  ];
  el('sysStatus').innerHTML = services.map(([key, label, bucket])=>{
    const fails = EVENTS.filter(e=>e.b.sys === bucket && e.outcome === 'Failed');
    const today = fails.filter(e=>e.date === TODAY).length;
    const state = today >= 3 ? 'Degraded' : today >= 1 ? 'Watch' : 'Operational';
    const tone = state === 'Operational' ? 'b-ok' : state === 'Watch' ? 'b-await' : 'b-rej';
    return `<div class="lrow">
      <div class="lic" style="background:${state==='Operational'?'var(--green-soft)':state==='Watch'?'var(--amber-soft)':'var(--red-soft)'};
        color:${state==='Operational'?'#157A50':state==='Watch'?'#9A6A0D':'#B32C2C'};font-size:9px">${
        state === 'Operational' ? '✓' : '!'}</div>
      <div><div class="lt">${label}</div>
        <div class="ls">${fails.length} failures on record · last ${fails[0] ? fmtShort(fails[0].date) : '—'}</div></div>
      <div class="lr"><span class="badge ${tone}">${state}</span></div>
    </div>`;
  }).join('');

  el('sysInvestCount').textContent = SYS_INVEST.length;
  el('sysInvest').innerHTML = SYS_INVEST.map((s,i)=>`
    <div class="lrow">
      <div class="lic" style="background:${s.status==='Resolved'?'var(--green-soft)':'var(--amber-soft)'};
        color:${s.status==='Resolved'?'#157A50':'#9A6A0D'};font-size:8px">${s.status==='Resolved'?'OK':'OPEN'}</div>
      <div><div class="lt">${esc(s.event)}</div>
        <div class="ls">${esc(s.action)} · ${esc(s.owner)} · ${fmtShort(s.when)}</div></div>
      <div class="lr">${s.status !== 'Resolved' ? `<button class="btn btn-ghost" data-sysfix="${i}">Resolve</button>` : ''}</div>
    </div>`).join('');
  el('sysInvest').querySelectorAll('[data-sysfix]').forEach(b=>{
    b.onclick = ()=>{
      const s = SYS_INVEST[Number(b.dataset.sysfix)];
      openModal('Close the investigation', s.event, `
        <div class="fg"><label>What fixed it?</label>
          <textarea id="sysFixNote" style="min-height:70px" placeholder="Root cause and the action taken"></textarea></div>`,
        [{label:'Cancel', act:'close'}, {label:'Mark resolved', cls:'btn-gold', act:()=>{
          s.status = 'Resolved';
          s.action = el('sysFixNote').value.trim() || 'Resolved by the platform team';
          logEvent({module:'System', action:'Error investigation closed', type:'Review', user:'Grace Nyirenda',
            record:s.event, desc:s.action, bucket:{sys:'app'}});
          renderAll(); closeModal(); toast('Investigation closed.');
        }}]);
    };
  });
}

function wireSystem(){
  el('sysTabs').querySelectorAll('[data-sys]').forEach(b=>{
    b.onclick = ()=>{
      SYS.view = b.dataset.sys || ''; SYS.page = 1;
      el('sysTabs').querySelectorAll('[data-sys]').forEach(x=>x.classList.toggle('on', x === b));
      renderSystem();
    };
  });
  el('sysExport').onclick = ()=>{
    const rows = systemEvents().map(e=>[e.id, e.ts, e.record, e.action, e.severity, e.outcome, e.desc]);
    exportRows('system-error-log', ['Event','When','Service','Error','Severity','Outcome','Detail'], rows, 'System events and errors');
  };
}

/* ===================== 14 · EVENT DETAILS ===================== */
const EV = {id:null};

function renderEventDetail(){
  const e = byId(EV.id) || EVENTS[0];
  if(!e) return;
  EV.id = e.id;
  el('evSub').textContent = e.action + ' · ' + e.id;
  el('evSev').textContent = e.severity;
  el('evSev').className = 'sev ' + sevClass(e.severity);
  const fields = [
    ['Unique audit event ID', e.id],
    ['Event date and time', fmtDate(tsDate(e.ts)) + ' · ' + e.time],
    ['User ID', e.userId],
    ['Username', e.username],
    ['User name', e.user],
    ['User role', e.role],
    ['Action performed', e.action],
    ['Module / resource', e.module],
    ['Affected record', e.record],
    ['Event outcome', e.outcome],
    ['Reason / description', e.desc],
    ['Related transaction reference', e.txn || '—'],
    ['Request / correlation ID', e.corr],
    ['Source IP address', e.ip],
    ['Device / agent', e.device],
    ['Storage block', e.block],
    ['Record hash', e.hash]
  ];
  el('evDetail').innerHTML = `
    <div class="pfields">${fields.map(([k,v])=>`<div class="pfield"><div class="pk">${k}</div>
      <div class="pv ${(!v || v==='—')?'muted':''}">${esc(v)}</div></div>`).join('')}</div>
    <div class="minihead">Previous values</div>
    ${e.changes ? `<div class="diff"><div class="dh"><span>Field</span><span>Previous</span><span>Updated</span></div>
      ${e.changes.map(c=>`<div class="dr"><span class="k">${esc(c[0])}</span>
        <span class="old">${esc(c[1]) || '—'}</span><span class="new">${esc(c[2]) || '—'}</span></div>`).join('')}</div>`
      : '<div class="inline-note">No previous or updated values recorded for this event type.</div>'}
    <div class="form-actions">
      <button class="btn btn-ghost" id="evLink">Start an investigation</button>
      <button class="btn btn-ghost" id="evExportOne">Export event</button>
    </div>`;
  el('evLink').onclick = ()=>{
    ADV.pivot = e.id;
    el('invTitle').value = e.action + ' — ' + e.record;
    renderAdvSearch();
    goto('s15');
  };
  el('evExportOne').onclick = ()=>{
    const rows = [Object.keys({
      'Event ID':1, 'Date':1, 'Time':1, 'User':1, 'Username':1, 'Role':1, 'Action':1, 'Module':1,
      'Record':1, 'Outcome':1, 'Severity':1, 'Description':1, 'Correlation':1
    })];
    downloadFile('audit-event-' + e.id + '.csv', 'text/csv;charset=utf-8', '\ufeff' + toCsv([
      ['Field','Value'],
      ['Event ID', e.id], ['Date', tsDate(e.ts)], ['Time', e.time], ['User', e.user],
      ['Username', e.username], ['Role', e.role], ['Action', e.action], ['Module', e.module],
      ['Record', e.record], ['Outcome', e.outcome], ['Severity', e.severity], ['Description', e.desc],
      ['Correlation', e.corr]
    ]));
    logExport('Audit event ' + e.id, 'CSV', 1);
  };

  const rel = relatedEvents(e);
  el('evRelCount').textContent = rel.length;
  el('evRelated').innerHTML = rel.map(r=>`
    <div class="evt" data-ev="${r.id}" style="cursor:pointer">
      <div class="eic ${evIcon(r)}">${r.outcome === 'Failed' ? '✕' : '✓'}</div>
      <div class="eb"><div class="et">${esc(r.action)}</div>
        <div class="es">${esc(r.user)} · ${r.record} · ${r.outcome}</div>
        <div class="em">${fmtTs(r.ts)}</div></div>
    </div>`).join('') || '<div class="empty">No related events.</div>';
  bindRows('evRelated');
  if(el('evPick')) el('evPick').value = e.id;
}

function relatedEvents(e){
  const t = new Date(e.ts.replace(' ', 'T'));
  return EVENTS.filter(o=>{
    if(o.id === e.id) return false;
    const sameRef = o.record === e.record || (e.txn && o.txn === e.txn) || o.corr === e.corr;
    if(!sameRef) return false;
    const d = Math.abs(new Date(o.ts.replace(' ', 'T')) - t) / 3600000;
    return d <= 1;
  }).slice(0, 12);
}

function openEvent(id){
  const e = byId(id);
  if(!e) return;
  EV.id = e.id;
  renderEventDetail();
  openModal(e.action, e.id + ' · ' + fmtTs(e.ts), `
    <div class="lrow" style="border-bottom:0">
      <div class="lic" style="background:var(--gold-soft);color:var(--gold-dark);font-size:9px">${initials(e.user)}</div>
      <div><div class="lt">${esc(e.user)} · ${e.role}</div>
        <div class="ls">${e.username} · ${e.ip} · ${esc(e.device)}</div></div>
      <div class="lr"><span class="sev ${sevClass(e.severity)}">${e.severity}</span></div>
    </div>
    <div class="pfields" style="margin-top:6px">
      <div class="pfield"><div class="pk">Module / resource</div><div class="pv">${e.module}</div></div>
      <div class="pfield"><div class="pk">Affected record</div><div class="pv">${e.record}</div></div>
      <div class="pfield"><div class="pk">Outcome</div><div class="pv">${e.outcome}</div></div>
      <div class="pfield"><div class="pk">Action type</div><div class="pv">${e.type}</div></div>
      <div class="pfield"><div class="pk">Correlation ID</div><div class="pv">${e.corr}</div></div>
      <div class="pfield"><div class="pk">Transaction ref</div><div class="pv">${e.txn || '—'}</div></div>
    </div>
    <div class="inline-note" style="margin-top:6px">${esc(e.desc)}</div>
    ${e.changes ? diffBlock(e.changes) : ''}`,
    [{label:'Close', act:'close'},
     {label:'Open in event record', cls:'btn-gold', act:()=>{ closeModal(); renderEventDetail(); goto('s14'); }}]);
}

function wireEventDetail(){
  el('evPick').addEventListener('change', ()=>{ EV.id = el('evPick').value; renderEventDetail(); });
  el('evOpen').onclick = ()=>{
    const q = el('evSearch').value.trim().toUpperCase();
    if(!q){ toast('Enter an audit event ID, or pick one from the list.', 'info'); return; }
    const found = byId(q) || EVENTS.find(e=>e.id.includes(q));
    if(!found){ toast('No event matches ' + q + '.', 'err'); return; }
    EV.id = found.id;
    renderEventDetail();
    toast('Opened ' + found.id);
  };
  el('evSearch').addEventListener('keydown', e=>{ if(e.key === 'Enter') el('evOpen').click(); });
}

/* ===================== 15 · SEARCH & INVESTIGATION ===================== */
const ADV = {pivot:null, ran:false};

function advResults(){
  const user = el('advUser').value;
  const customer = el('advCustomer').value.trim().toLowerCase();
  const loan = el('advLoan').value.trim().toLowerCase();
  const txn = el('advTxn').value.trim().toLowerCase();
  const evid = el('advEventId').value.trim().toLowerCase();
  const module = el('advModule').value;
  const severity = el('advSeverity').value;
  const from = el('advFrom').value;
  const to = el('advTo').value;
  return EVENTS.filter(e=>{
    if(user && e.username !== user) return false;
    if(customer && !(e.record.toLowerCase().includes(customer) || e.user.toLowerCase().includes(customer) ||
      (e.desc||'').toLowerCase().includes(customer))) return false;
    if(loan && !(e.record.toLowerCase().includes(loan) || (e.desc||'').toLowerCase().includes(loan))) return false;
    if(txn && !((e.txn||'').toLowerCase().includes(txn) || e.record.toLowerCase().includes(txn))) return false;
    if(evid && !e.id.toLowerCase().includes(evid)) return false;
    if(module && e.module !== module) return false;
    if(severity && e.severity !== severity) return false;
    if(from && e.date < from) return false;
    if(to && e.date > to) return false;
    return true;
  });
}

function renderAdvSearch(){
  const rows = advResults();
  el('advCount').textContent = nf(rows.length) + ' matches';
  el('advResults').innerHTML = rows.slice(0, 40).map(e=>`
    <tr class="rowlink" data-ev="${e.id}">
      <td class="mono" style="font-size:9px">${e.id}</td>
      <td style="white-space:nowrap">${fmtShort(e.date)} ${e.time.slice(0,5)}</td>
      <td>${esc(e.user)}</td>
      <td>${esc(e.action)}</td>
      <td class="mono" style="font-size:9px">${e.record}</td>
      <td><span class="badge ${outcomeTone(e.outcome)}">${e.outcome}</span></td>
    </tr>`).join('') || '<tr><td colspan="6" class="empty">No events match this search.</td></tr>';
  bindRows('advResults');

  const pivot = ADV.pivot ? byId(ADV.pivot) : rows[0];
  if(!pivot){ el('advTimeline').innerHTML = '<div class="empty">Run a search to see the surrounding events.</div>';
    el('advTlCount').textContent = '0'; return; }
  ADV.pivot = pivot.id;
  const t = new Date(pivot.ts.replace(' ', 'T'));
  const near = EVENTS.filter(e=>{
    const d = Math.abs(new Date(e.ts.replace(' ', 'T')) - t) / 3600000;
    return d <= 1 && (e.user === pivot.user || e.record === pivot.record);
  }).slice(0, 14);
  el('advTlCount').textContent = near.length;
  el('advTimeline').innerHTML = `<div class="inline-note" style="margin-bottom:6px">Pivot ${pivot.id} · ${esc(pivot.action)}</div>` +
    near.map(e=>`
    <div class="evt" data-ev="${e.id}" style="cursor:pointer">
      <div class="eic ${e.id === pivot.id ? 'warn' : evIcon(e)}">${e.id === pivot.id ? '★' : e.outcome === 'Failed' ? '✕' : '✓'}</div>
      <div class="eb"><div class="et">${esc(e.action)}</div>
        <div class="es">${esc(e.user)} · ${e.record}</div>
        <div class="em">${fmtTs(e.ts)}</div></div>
    </div>`).join('');
  bindRows('advTimeline');
  renderInvestigations();
}

function renderInvestigations(){
  el('invCount').textContent = INVEST.length;
  el('invList').innerHTML = INVEST.map(inv=>`
    <div class="lrow" style="align-items:flex-start">
      <div class="lic" style="background:var(--gold-soft);color:var(--gold-dark);font-size:8px">${inv.id}</div>
      <div style="flex:1">
        <div class="lt">${esc(inv.title)}</div>
        <div class="ls">${esc(inv.owner)} · opened ${fmtShort(inv.opened)} · ${inv.notes.length} note${inv.notes.length===1?'':'s'}</div>
        <div style="font-size:9.5px;color:#4A5160;margin-top:3px">${esc(inv.notes[inv.notes.length-1] || '')}</div>
      </div>
      <div class="lr"><span class="badge ${inv.status==='Closed'?'b-proc':inv.status==='Open'?'b-await':'b-ok'}">${inv.status}</span>
        <button class="btn btn-ghost" data-inv="${inv.id}">Open</button></div>
    </div>`).join('') || '<div class="empty">No investigations yet.</div>';
  el('invList').querySelectorAll('[data-inv]').forEach(b=>{
    b.onclick = ()=>{
      const inv = INVEST.find(x=>x.id === b.dataset.inv);
      openModal(inv.title, inv.id + ' · ' + inv.status + ' · ' + inv.owner,
        `<div class="inline-note">Opened ${fmtDate(inv.opened)} · ${inv.events.length} linked events</div>
         ${inv.notes.map((n,i)=>`<div class="evt"><div class="eic warn">${i+1}</div>
           <div class="eb"><div class="et">Findings</div><div class="es">${esc(n)}</div></div></div>`).join('')}`,
        [{label:'Add note', act:()=>{ closeModal(); el('invTitle').value = inv.title; el('invNote').focus(); }},
         {label:'Close', act:'close'}]);
    };
  });
}

function wireAdvSearch(){
  el('advRun').onclick = ()=>{ ADV.ran = true; renderAdvSearch(); toast(advResults().length + ' events returned.'); };
  el('advClear').onclick = ()=>{
    ['advCustomer','advLoan','advTxn','advEventId'].forEach(id=>{ el(id).value = ''; });
    ['advUser','advModule','advSeverity'].forEach(id=>{ el(id).value = ''; });
    el('advFrom').value = '2026-10-01'; el('advTo').value = TODAY;
    ADV.pivot = null; renderAdvSearch(); toast('Search cleared.', 'info');
  };
  el('invSave').onclick = ()=>{
    const title = el('invTitle').value.trim();
    const note = el('invNote').value.trim();
    if(title.length < 4){ toast('Give the investigation a title.', 'err'); return; }
    const owner = el('invOwner').value;
    const status = el('invStatus').value;
    const existing = INVEST.find(i=>i.title === title);
    if(existing){
      if(note) existing.notes.push(note);
      existing.status = status; existing.owner = owner;
    } else {
      INVEST.unshift({id:'INV-' + String(8 + INVEST.length).padStart(3,'0'), title,
        status, owner, opened:TODAY, notes: note ? [note] : [], events: ADV.pivot ? [ADV.pivot] : []});
    }
    logEvent({module:'Security', action:'Investigation record saved', type:'Review', user:'Chikondi Mwale',
      record:ADV.pivot || '—', desc:title + ' — ' + status, bucket:{sec:'suspicious', perm:'privileged'}});
    el('invTitle').value = ''; el('invNote').value = '';
    renderAll();
    toast('Investigation saved (' + status.toLowerCase() + ').');
  };
  el('invNew').onclick = ()=>{
    el('invTitle').focus();
    goto('s15');
    toast('Describe the investigation, then save it.', 'info');
  };
}

/* ===================== 16 · SECURITY ALERTS ===================== */
function alertTiles(){
  const open = ALERTS.filter(a=>a.status === 'Open').length;
  const inv = ALERTS.filter(a=>a.status === 'Investigating').length;
  const res = ALERTS.filter(a=>a.status === 'Resolved' || a.status === 'Dismissed').length;
  const crit = ALERTS.filter(a=>a.severity === 'Critical' && a.status !== 'Resolved' && a.status !== 'Dismissed').length;
  return [
    {l:'Open alerts', v:nf(open), s:'Not yet picked up', k:'red'},
    {l:'Being investigated', v:nf(inv), s:'Assigned to an owner'},
    {l:'Resolved or dismissed', v:nf(res), s:'Closed with an outcome'},
    {l:'Critical severity', v:nf(crit), s:'Needs management attention', k:'red'},
    {l:'Repeat failed logins', v:nf(ALERTS.filter(a=>a.type.includes('failed login')).length), s:'Accounts under attack'},
    {l:'Incidents this month', v:nf(ALERTS.length), s:'Security incident history'}
  ];
}

function renderAlerts(){
  const tiles = alertTiles();
  el('alTiles').innerHTML = tiles.map(t=>`<div class="kpi ${t.k||''}"><div class="kl">${t.l}</div>
    <div class="kv">${t.v}</div><div class="ks">${t.s}</div></div>`).join('');

  const list = ALERTS.filter(a=> (!ALA.status || a.status === ALA.status) && (!ALA.severity || a.severity === ALA.severity))
    .slice().sort((a,b)=>{
      const rank = {Critical:0, High:1, Medium:2, Low:3};
      const closed = s => s === 'Resolved' || s === 'Dismissed';
      return (closed(a.status) ? 1 : 0) - (closed(b.status) ? 1 : 0) ||
        (rank[a.severity]||9) - (rank[b.severity]||9) || (a.when < b.when ? 1 : -1);
    });
  el('alCount').textContent = list.length;
  el('alList').innerHTML = list.map(a=>`
    <div class="alertcard ${a.severity === 'Critical' ? 'crit' : ''} ${(a.status==='Resolved'||a.status==='Dismissed')?'resolved':''}">
      <div class="ah">
        <span class="at">${esc(a.title)}</span>
        <span class="sev ${a.severity === 'Critical' || a.severity === 'High' ? 'sev-crit' : 'sev-warn'}">${a.severity}</span>
        <span class="badge ${a.status==='Resolved'?'b-ok':a.status==='Dismissed'?'b-proc':a.status==='Investigating'?'b-await':'b-rej'}">${a.status}</span>
      </div>
      <div class="ab">${esc(a.detail)}</div>
      ${a.resolution ? `<div class="ab" style="color:#157A50"><b>Outcome:</b> ${esc(a.resolution)}</div>` : ''}
      <div class="af">
        <span class="mono">${a.id}</span><span>·</span><span>${esc(a.type)}</span>
        <span>·</span><span>${esc(a.owner)}</span><span>·</span><span>${fmtTs(a.when)}</span>
        <span style="margin-left:auto;display:flex;gap:5px">
          ${a.status === 'Open' ? `<button class="btn btn-ghost" data-al-act="assign" data-al-id="${a.id}">Assign</button>` : ''}
          ${a.status !== 'Resolved' && a.status !== 'Dismissed'
            ? `<button class="btn btn-ghost" data-al-act="escalate" data-al-id="${a.id}">Escalate</button>
               <button class="btn btn-gold" data-al-act="resolve" data-al-id="${a.id}">Resolve</button>`
            : `<button class="btn btn-ghost" data-al-act="reopen" data-al-id="${a.id}">Reopen</button>`}
          <button class="btn btn-ghost" data-al-act="events" data-al-id="${a.id}">Events</button>
        </span>
      </div>
    </div>`).join('') || '<div class="empty">No alerts match these filters.</div>';
  el('alList').querySelectorAll('[data-al-act]').forEach(b=>{
    b.onclick = ()=> alertAction(ALERTS.find(a=>a.id === b.dataset.alId), b.dataset.alAct);
  });

  el('alHistory').innerHTML = ALERTS.slice().reverse().map(a=>`
    <tr><td class="mono" style="font-size:9px">${a.id}</td>
      <td style="white-space:nowrap">${fmtShort(a.when)}</td>
      <td>${esc(a.type)}</td>
      <td>${esc(a.owner)}</td>
      <td><span class="badge ${a.status==='Resolved'?'b-ok':a.status==='Dismissed'?'b-proc':'b-await'}">${a.status}</span></td></tr>`).join('');
}

function alertAction(a, act){
  if(!a) return;
  if(act === 'events'){
    const evs = EVENTS.filter(e=> e.user === a.user || (a.when && e.date === a.when.slice(0,10) && e.severity !== 'Info')).slice(0, 10);
    openModal('Alert evidence', a.id + ' · ' + a.title,
      `<div class="inline-note">${esc(a.detail)}</div>
       <div style="margin-top:8px">${evs.map(e=>eventRow(e)).join('') || '<div class="empty">No matching events.</div>'}</div>`,
      [{label:'Close', act:'close'}]);
    bindRows('modalBody');
    return;
  }
  if(act === 'assign'){
    openModal('Assign the alert', a.id + ' · ' + a.title, `
      <div class="fg"><label>Assign to</label><select id="alOwner">
        ${USERS.filter(u=>u.role !== 'System').map(u=>`<option>${esc(u.name)}</option>`).join('')}</select></div>
      <div class="fg" style="margin-top:8px"><label>Instruction</label>
        <textarea id="alNote" style="min-height:60px">Review the linked events and confirm whether the activity was authorised.</textarea></div>`,
      [{label:'Cancel', act:'close'}, {label:'Assign', cls:'btn-gold', act:()=>{
        a.owner = el('alOwner').value;
        a.status = 'Investigating';
        a.notes.push(el('alNote').value.trim());
        logEvent({module:'Security', action:'Security alert assigned', type:'Assign', severity:'Warning',
          user:'Chikondi Mwale', record:a.id, desc:a.title + ' assigned to ' + a.owner,
          bucket:{sec:'suspicious', perm:'privileged'}});
        renderAll(); closeModal();
        toast('Alert assigned to ' + esc(a.owner) + '.');
      }}]);
    return;
  }
  if(act === 'resolve'){
    openModal('Resolve the alert', a.id + ' · ' + a.title, `
      <div class="fg"><label>Outcome</label><select id="alOutcome">
        <option>Confirmed and remediated</option><option>Confirmed — no action required</option>
        <option>False positive</option><option>Referred to management</option></select></div>
      <div class="fg" style="margin-top:8px"><label>Resolution notes</label>
        <textarea id="alRes" style="min-height:70px" placeholder="What was found and what was done"></textarea></div>`,
      [{label:'Cancel', act:'close'}, {label:'Resolve alert', cls:'btn-gold', act:()=>{
        a.status = 'Resolved';
        a.resolution = el('alOutcome').value + ' — ' + (el('alRes').value.trim() || 'No further detail recorded.');
        logEvent({module:'Security', action:'Security alert resolved', type:'Review', severity:'Warning',
          user:'Chikondi Mwale', record:a.id, desc:a.title + ' — ' + a.resolution,
          bucket:{sec:'suspicious', perm:'privileged'}});
        renderAll(); closeModal();
        toast('Alert resolved.');
      }}]);
    return;
  }
  if(act === 'escalate'){
    a.status = 'Investigating';
    a.owner = 'Ruth Nsanja';
    a.notes.push('Escalated to compliance for independent review.');
    logEvent({module:'Security', action:'Security alert escalated', type:'Review', severity:'Critical',
      user:'Chikondi Mwale', record:a.id, desc:a.title + ' escalated to the auditor',
      bucket:{sec:'suspicious', perm:'privileged'}});
    renderAll();
    toast('Alert escalated to compliance.');
    return;
  }
  if(act === 'reopen'){
    a.status = 'Investigating';
    a.resolution = '';
    logEvent({module:'Security', action:'Security alert reopened', type:'Review', severity:'Warning',
      user:'Chikondi Mwale', record:a.id, desc:a.title + ' reopened for further review',
      bucket:{sec:'suspicious'}});
    renderAll();
    toast('Alert reopened.');
  }
}

function wireAlerts(){
  el('alStatus').addEventListener('change', ()=>{ ALA.status = el('alStatus').value; renderAlerts(); });
  el('alSeverity').addEventListener('change', ()=>{ ALA.severity = el('alSeverity').value; renderAlerts(); });
  el('alNew').onclick = ()=>{
    openModal('Raise a security alert', 'Recorded against the incident history', `
      <div class="form-grid">
        <div class="fg"><label>Type</label><select id="naType">
          ${['Repeated failed login attempts','Unauthorized privileged actions','Unexpected permission changes',
             'Unusual financial corrections','Repeated transaction failures','Suspicious disbursement activity',
             'Unusual repayment reversals','Critical configuration changes'].map(t=>`<option>${t}</option>`).join('')}
        </select></div>
        <div class="fg"><label>Severity</label><select id="naSev">
          <option>Critical</option><option>High</option><option>Medium</option><option>Low</option></select></div>
        <div class="fg" style="grid-column:1/-1"><label>Title</label><input id="naTitle" placeholder="What was detected?"></div>
        <div class="fg" style="grid-column:1/-1"><label>Detail</label>
          <textarea id="naDetail" style="min-height:70px" placeholder="What the log shows"></textarea></div>
      </div>`,
      [{label:'Cancel', act:'close'}, {label:'Raise alert', cls:'btn-gold', act:()=>{
        const title = el('naTitle').value.trim();
        if(title.length < 5){ toast('Give the alert a title.', 'err'); return; }
        const a = {id:'SEC-' + String(101 + ALERTS.length), title, severity:el('naSev').value,
          type:el('naType').value, when:TODAY + ' ' + clock(), user:'Chikondi Mwale',
          detail:el('naDetail').value.trim() || 'Raised manually by the administrator.',
          status:'Open', owner:'Unassigned', opened:TODAY, notes:[]};
        ALERTS.unshift(a);
        logEvent({module:'Security', action:'Security alert raised', type:'Security', severity:a.severity,
          user:'Chikondi Mwale', record:a.id, desc:title, bucket:{sec:'suspicious'}});
        renderAll(); closeModal();
        toast('Alert ' + a.id + ' raised.');
      }}]);
  };
}

/* ===================== 17 · REPORTS ===================== */
const RP = {key:'daily', period:'day'};

function periodEvents(){
  const days = RP.period === 'day' ? 0 : RP.period === 'week' ? 7 : 30;
  return EVENTS.filter(e=>daysBetween(e.date, TODAY) <= days);
}

function scopeFor(key){
  if(key === 'daily') return EVENTS.filter(e=>e.date === TODAY);
  if(key === 'weekly') return EVENTS.filter(e=>daysBetween(e.date, TODAY) <= 6);
  if(key === 'monthly') return EVENTS.filter(e=>daysBetween(e.date, TODAY) <= 29);
  return periodEvents();
}

function reportData(key){
  const scoped = scopeFor(key);
  const D = (label, num) => num ? [label, 1] : [label];
  if(key === 'daily' || key === 'weekly' || key === 'monthly'){
    const title = key === 'daily' ? 'Daily audit summary' : key === 'weekly' ? 'Weekly audit summary' : 'Monthly audit summary';
    const groups = {};
    scoped.forEach(e=>{
      const k = key === 'daily' ? e.module : (key === 'weekly' ? e.date : e.module);
      groups[k] = groups[k] || {n:0, s:0, f:0, c:0};
      groups[k].n++;
      if(e.outcome === 'Success') groups[k].s++;
      if(e.outcome === 'Failed' || e.outcome === 'Denied') groups[k].f++;
      if(e.severity === 'Critical' || e.severity === 'Security') groups[k].c++;
    });
    const rows = Object.entries(groups).sort((a,b)=>b[1].n - a[1].n)
      .map(([k,v])=>[key === 'weekly' ? fmtDate(k) : k, v.n, v.s, v.f, v.c]);
    return {title, sub: (key === 'daily' ? 'Today' : key === 'weekly' ? 'Last 7 days' : 'Last 30 days') +
      ' · grouped by ' + (key === 'weekly' ? 'day' : 'module'),
      cols:[D(key === 'weekly' ? 'Date' : 'Module'), D('Events',1), D('Success',1), D('Failed',1), D('Critical',1)],
      rows, sums:[1,2,3,4]};
  }
  if(key === 'staff'){
    const rows = USERS.filter(u=>u.role !== 'Administrator' && u.role !== 'System').map(u=>{
      const mine = scoped.filter(e=>e.username === u.username);
      return [u.name, u.role, mine.length, mine.filter(e=>e.type === 'Login').length,
        mine.filter(e=>e.outcome === 'Failed').length, mine.filter(e=>e.b.staff === 'export').length,
        mine[0] ? mine[0].date : ''];
    });
    return {title:'Staff activity report', sub:'Every non-administrator user in the selected period',
      cols:[D('Staff member'), D('Role'), D('Events',1), D('Logins',1), D('Failures',1), D('Exports',1), D('Last activity')],
      rows, sums:[2,3,4,5]};
  }
  if(key === 'admin'){
    const rows = USERS.filter(u=>u.role === 'Administrator').map(u=>{
      const mine = scoped.filter(e=>e.username === u.username);
      return [u.name, mine.length, mine.filter(e=>e.b.admin === 'settings' || e.b.admin === 'product' || e.b.admin === 'payment').length,
        mine.filter(e=>e.b.admin === 'permission' || e.b.admin === 'role').length,
        mine.filter(e=>e.b.admin === 'override').length,
        mine.filter(e=>e.severity === 'Critical').length, mine[0] ? mine[0].date : ''];
    });
    return {title:'Administrator activity report', sub:'Privileged accounts in the period',
      cols:[D('Administrator'), D('Events',1), D('Config changes',1), D('Access changes',1), D('Overrides',1), D('Critical',1), D('Last activity')],
      rows, sums:[1,2,3,4,5]};
  }
  if(key === 'financial'){
    const rows = scoped.filter(isFinancial).map(e=>[e.id, e.date + ' ' + e.time.slice(0,5), e.record, e.action,
      e.user, e.changes ? e.changes.map(c=>c[0] + ': ' + c[1] + ' → ' + c[2]).join('; ') : '', e.txn]);
    return {title:'Financial transaction audit report', sub:'Money movement and corrections in the period',
      cols:[D('Event'), D('When'), D('Record'), D('Action'), D('User'), D('Before and after'), D('Reference')],
      rows, sums:[]};
  }
  if(key === 'security'){
    const rows = scoped.filter(e=>e.module === 'Authentication' || e.b.sec)
      .map(e=>[e.id, e.date + ' ' + e.time.slice(0,5), e.user, e.action, e.ip, e.outcome, e.severity]);
    return {title:'Security events report', sub:'Authentication and access activity in the period',
      cols:[D('Event'), D('When'), D('User'), D('Action'), D('IP address'), D('Outcome'), D('Severity')],
      rows, sums:[]};
  }
  if(key === 'permissions'){
    const rows = scoped.filter(e=>e.b.perm).map(e=>[e.id, e.date, e.user, e.action, e.record,
      e.changes ? e.changes.map(c=>c[1] + ' → ' + c[2]).join('; ') : '', e.outcome]);
    return {title:'Permission changes report', sub:'Grants, revocations and denied attempts',
      cols:[D('Event'), D('When'), D('Actor'), D('Change'), D('Target'), D('Before and after'), D('Outcome')],
      rows, sums:[]};
  }
  const rows = scoped.filter(e=>e.severity === 'Critical').map(e=>[e.id, e.date + ' ' + e.time.slice(0,5),
    e.module, e.action, e.user, e.outcome, e.desc]);
  return {title:'Critical events report', sub:'Every critical event in the period',
    cols:[D('Event'), D('When'), D('Module'), D('Action'), D('User'), D('Outcome'), D('Description')],
    rows, sums:[]};
}

const REPORT_TILES = [
  ['daily', 'Daily audit summary', 'Today by module'],
  ['weekly', 'Weekly audit summary', 'Last 7 days by day'],
  ['monthly', 'Monthly audit summary', 'Last 30 days by module'],
  ['staff', 'Staff activity report', 'Per staff member'],
  ['admin', 'Administrator activity report', 'Privileged accounts'],
  ['financial', 'Financial transaction audit', 'Money movement'],
  ['security', 'Security events report', 'Authentication'],
  ['permissions', 'Permission changes report', 'Grants and denials'],
  ['critical', 'Critical events report', 'Everything critical']
];

function renderReports(){
  RP.period = el('repPeriod').value;
  const d = reportData(RP.key);
  el('repTiles').innerHTML = REPORT_TILES.map(([k,t,s],i)=>{
    const on = k === RP.key;
    const rows = reportData(k).rows.length;
    return `<div class="mcard" data-rpt="${k}" style="cursor:pointer;${on?'border-color:var(--gold);background:#FFFCF0':''}">
      <div class="mh"><div class="mi">${i+1}</div><div><div class="mn">${t}</div><div class="md">${s}</div></div></div>
      <div class="mv">${rows} <small style="font-size:9px;font-weight:600;color:var(--muted)">rows</small></div>
    </div>`;
  }).join('');
  el('repTiles').querySelectorAll('[data-rpt]').forEach(b=>{
    b.onclick = ()=>{ RP.key = b.dataset.rpt; renderReports(); };
  });
  el('repTitle').textContent = d.title;
  el('repSub').textContent = d.sub;
  el('repRows').textContent = d.rows.length + ' rows';
  el('repHead').innerHTML = '<tr>' + d.cols.map(([c,num])=>`<th${num?' class="num"':''}>${c}</th>`).join('') + '</tr>';
  el('repBody').innerHTML = d.rows.length ? d.rows.map(r=>'<tr>' + r.map((v,i)=>{
    const num = d.cols[i] && d.cols[i][1];
    return `<td${num?' class="num"':''}>${num ? (typeof v === 'number' ? nf(v) : esc(v)) : esc(v)}</td>`;
  }).join('') + '</tr>').join('') :
    `<tr><td colspan="${d.cols.length}" class="empty">No rows for this report in the selected period.</td></tr>`;
  el('repNote').innerHTML = (d.sums || []).length
    ? '<b>Totals:</b> ' + d.sums.map(i=>`${d.cols[i][0]}: ${nf(sum(d.rows, r=>Number(r[i])||0))}`).join(' · ')
    : 'No numeric columns in this report.';

  el('expCount').textContent = EXPORTS.length;
  el('expHistory').innerHTML = EXPORTS.map(x=>`
    <tr><td style="white-space:nowrap">${fmtDate(x.when.slice(0,10))} · ${x.when.slice(11)}</td>
      <td>${esc(x.report)}</td><td>${x.format}</td>
      <td class="num">${nf(x.rows)}</td><td>${esc(x.by)}</td><td style="font-size:9.5px">${esc(x.authority)}</td></tr>`).join('')
    || '<tr><td colspan="6" class="empty">No exports recorded.</td></tr>';
}

function logExport(report, format, rows, authority){
  EXPORTS.unshift({when:TODAY + ' ' + clock(), report, format, rows, by:'Chikondi Mwale',
    authority: authority || 'Administrator'});
  if(EXPORTS.length > 40) EXPORTS.length = 40;
}

function exportReport(kind){
  const d = reportData(RP.key);
  const base = d.title.toLowerCase().replace(/[^a-z0-9]+/g,'-');
  if(kind === 'csv'){
    downloadFile(base + '.csv', 'text/csv;charset=utf-8',
      '\ufeff' + toCsv([d.cols.map(c=>c[0])].concat(d.rows)));
    logExport(d.title, 'CSV', d.rows.length);
    toast('Exported ' + d.rows.length + ' rows to ' + base + '.csv');
  } else if(kind === 'xlsx'){
    try{ buildXlsx(base + '.xlsx', d); logExport(d.title, 'Excel', d.rows.length); }
    catch(err){ downloadFile(base + '.csv', 'text/csv;charset=utf-8', '\ufeff' + toCsv([d.cols.map(c=>c[0])].concat(d.rows))); }
  } else {
    logExport(d.title, 'PDF', d.rows.length);
    printHtml(d.title, `<div class="inline-note">${d.rows.length} rows · ${d.sub}</div>
      <div class="tblwrap" style="max-height:none"><table class="tbl2 dense">
        <thead><tr>${d.cols.map(([c,num])=>`<th${num?' class="num"':''}>${c}</th>`).join('')}</tr></thead>
        <tbody>${d.rows.map(r=>'<tr>' + r.map((v,i)=>{
          const num = d.cols[i] && d.cols[i][1];
          return `<td${num?' class="num"':''}>${esc(v)}</td>`;
        }).join('') + '</tr>').join('')}</tbody></table></div>`);
  }
  renderReports();
}

function wireReports(){
  el('repPeriod').addEventListener('change', ()=>{ RP.period = el('repPeriod').value; renderReports(); });
  el('repCsv').onclick = ()=>exportReport('csv');
  el('repXlsx').onclick = ()=>exportReport('xlsx');
  el('repPdf').onclick = ()=>exportReport('pdf');
}

/* ===================== 18 · RETENTION & INTEGRITY ===================== */
const RET = {days:2555, archiveAfter:30, deletion:'Restricted — dual approval',
  exportAuth:'Administrator and Auditor', integrityEvery:'Every 6 hours', storage:'Cold store · Malawi'};
const ACCESS = {
  'Administrator':{view:true, export:true, configure:true, del:false},
  'Auditor':{view:true, export:true, configure:false, del:false},
  'Head of Credit':{view:true, export:false, configure:false, del:false},
  'Credit Analyst':{view:false, export:false, configure:false, del:false},
  'Loan Officer':{view:false, export:false, configure:false, del:false},
  'Collections Officer':{view:false, export:false, configure:false, del:false},
  'Cashier':{view:false, export:false, configure:false, del:false},
  'Customer Care':{view:false, export:false, configure:false, del:false}
};

function renderRetention(){
  const archived = ARCHIVE.length;
  el('retStatusPill').textContent = INTEGRITY.ok ? 'Verified' : 'Attention';
  el('retStatusPill').className = 'badge ' + (INTEGRITY.ok ? 'b-ok' : 'b-rej');
  el('retSaved').textContent = RET.days + ' days';
  el('retTiles').innerHTML = [
    {l:'Live events', v:nf(EVENTS.length), s:'Searchable in this console'},
    {l:'Archived events', v:nf(archived), s:'Sealed cold store'},
    {l:'Retention period', v:RET.days + 'd', s:(RET.days/365).toFixed(1) + ' years', k:'gold'},
    {l:'Archive trigger', v:RET.archiveAfter + 'd', s:'After this age events are sealed'},
    {l:'Integrity', v:INTEGRITY.ok ? 'Verified' : 'Gap', s:'Last check ' + (INTEGRITY.checked || '—'), k: INTEGRITY.ok ? '' : 'red'},
    {l:'Last backup', v:'02:30', s:(BACKUPS[0] ? BACKUPS[0].size + ' · ' + BACKUPS[0].status : '—')}
  ].map(t=>`<div class="kpi ${t.k||''}"><div class="kl">${t.l}</div><div class="kv">${t.v}</div>
    <div class="ks">${t.s}</div></div>`).join('');

  if(el('retDays').value !== String(RET.days)) el('retDays').value = RET.days;
  if(el('retArchiveAfter').value !== String(RET.archiveAfter)) el('retArchiveAfter').value = RET.archiveAfter;
  el('retDelete').value = RET.deletion;
  el('retExportAuth').value = RET.exportAuth;
  el('retIntegrity').value = RET.integrityEvery;
  el('retStorage').value = RET.storage;

  el('retMatrix').innerHTML = Object.entries(ACCESS).map(([role, p])=>`
    <tr><td style="font-weight:700">${role}</td>
      ${['view','export','configure','del'].map(k=>`<td>${
        p[k] ? '<span class="badge b-ok">Yes</span>' : '<span class="badge b-proc">No</span>'}</td>`).join('')}
    </tr>`).join('');

  el('archCount').textContent = archived + ' archived';
  el('archAfter').value = RET.archiveAfter;
  renderArchive();

  renderChain();
  renderRetHistory();
  renderBackups();

  el('compList').innerHTML = COMP_REVIEWS.map(c=>`
    <div class="lrow"><div class="lic" style="background:var(--green-soft);color:#157A50;font-size:8px">✓</div>
      <div><div class="lt">${esc(c.scope)}</div>
        <div class="ls">${fmtShort(c.when)} · ${esc(c.reviewer)} · ${esc(c.result)}</div>
        <div class="ls">${esc(c.notes)}</div></div></div>`).join('');
}

function renderArchive(){
  const q = (el('archSearch').value || '').trim().toLowerCase();
  const list = ARCHIVE.filter(e=> !q || (e.id + ' ' + e.user + ' ' + e.action + ' ' + e.record).toLowerCase().includes(q));
  el('archBody').innerHTML = list.slice(0, 15).map(e=>`
    <div class="evt" data-ev="${e.id}" style="cursor:pointer">
      <div class="eic ok">${e.archiveId ? e.archiveId.slice(-3) : '·'}</div>
      <div class="eb"><div class="et">${esc(e.action)}</div>
        <div class="es">${esc(e.user)} · ${e.record} · ${e.module}</div>
        <div class="em">${fmtDate(e.date)} · ${e.id}</div></div>
    </div>`).join('') || '<div class="empty">Nothing in the archive matches.</div>';
  bindRows('archBody');
}

function renderChain(){
  const blocks = {};
  EVENTS.forEach(e=>{
    blocks[e.block] = blocks[e.block] || {n:0, hash:'', last:''};
    blocks[e.block].n++;
    blocks[e.block].hash = e.hash;
    blocks[e.block].last = e.ts;
  });
  INTEGRITY.blocks = Object.entries(blocks).sort().map(([id, b], i)=>({
    id, events:b.n, last:b.last, hash:b.hash,
    status: b.hash ? 'Verified' : 'Gap'
  }));
  const head = hashOf(INTEGRITY.blocks.map(b=>b.hash).join(''));
  INTEGRITY.head = head;
  INTEGRITY.ok = INTEGRITY.blocks.every(b=>b.status === 'Verified');
  el('chainPill').textContent = INTEGRITY.ok ? 'All blocks verified' : 'Gap detected';
  el('chainBody').innerHTML = INTEGRITY.blocks.slice(0, 12).map(b=>`
    <div class="chain">
      <span class="blk">${b.id}</span>
      <span style="min-width:52px">${b.events} evt</span>
      <span class="hsh">${b.hash}</span>
      <span class="ok">${b.status === 'Verified' ? '✓ verified' : '✕ gap'}</span>
    </div>`).join('') || '<div class="empty">No blocks yet.</div>';
  el('chainHead').textContent = 'chain head · ' + head + ' · last checked ' + (INTEGRITY.checked || 'not yet');
  el('retStatusPill').textContent = INTEGRITY.ok ? 'Verified' : 'Attention';
  el('retStatusPill').className = 'badge ' + (INTEGRITY.ok ? 'b-ok' : 'b-rej');
}

function runIntegrity(){
  INTEGRITY.checked = TODAY + ' ' + clock();
  renderChain();
  const bad = INTEGRITY.blocks.filter(b=>b.status !== 'Verified').length;
  INTEGRITY.ok = bad === 0;
  logEvent({module:'System', action:'Audit integrity check completed', type:'System',
    severity: bad ? 'Critical' : 'Info', user:'Chikondi Mwale', record:'AUDIT-CHAIN',
    desc:`${INTEGRITY.blocks.length} blocks checked; ${bad} gap(s) found`,
    bucket:{sys:'app', perm:'privileged'}});
  renderAll();
  toast(bad ? bad + ' gap(s) found in the chain.' : 'All ' + INTEGRITY.blocks.length + ' blocks verified.', bad ? 'err' : 'ok');
}

function renderRetHistory(){
  el('retHistory').innerHTML = RET_HISTORY.map(h=>`
    <div class="lrow"><div class="lic" style="background:var(--gold-soft);color:var(--gold-dark);font-size:8px">${
      h.what === 'Archive run' ? 'ARC' : h.what === 'Policy change' ? 'POL' : 'REQ'}</div>
      <div><div class="lt">${esc(h.what)}</div>
        <div class="ls">${fmtDate(h.when)} · ${esc(h.by)}</div>
        <div class="ls">${esc(h.detail)}</div></div></div>`).join('');
}

function renderBackups(){
  const last = BACKUPS[0];
  el('backupTiles').innerHTML = `
    <div class="lrow"><div class="lic" style="background:${last && last.status === 'Success' ? 'var(--green-soft)' : 'var(--red-soft)'};
      color:${last && last.status === 'Success' ? '#157A50' : '#B32C2C'};font-size:9px">BK</div>
      <div><div class="lt">${last ? last.status : 'No backup'} · ${last ? last.size : '—'}</div>
        <div class="ls">${last ? fmtDate(last.when) + ' ' + last.when.slice(11) + ' · ' + esc(last.target) : '—'}</div></div>
      <div class="lr"><span class="badge ${last && last.status === 'Success' ? 'b-ok' : 'b-rej'}">${last ? last.status : '—'}</span></div>
    </div>
    <div class="inline-note">${BACKUPS.filter(b=>b.status === 'Failed').length} failed backup(s) in the last 4 runs.</div>`;
}

function archiveNow(){
  const days = clamp(Number(el('archAfter').value) || 30, 1, 3650);
  const cutoff = addDays(TODAY, -days);
  const moving = EVENTS.filter(e=>e.date < cutoff);
  if(!moving.length){ toast('No events are older than ' + days + ' days.', 'info'); return; }
  openModal('Archive audit events', moving.length + ' events older than ' + fmtDate(cutoff), `
    <div class="note gold"><div>Archived events remain searchable in the sealed archive but are removed from the live
      register. The archive is append-only and covered by the same integrity chain.</div></div>
    <div class="pfields" style="margin-top:8px">
      <div class="pfield"><div class="pk">Events moving</div><div class="pv">${nf(moving.length)}</div></div>
      <div class="pfield"><div class="pk">Cut-off date</div><div class="pv">${fmtDate(cutoff)}</div></div>
      <div class="pfield"><div class="pk">Destination</div><div class="pv">${RET.storage}</div></div>
    </div>`,
    [{label:'Cancel', act:'close'}, {label:'Archive now', cls:'btn-gold', act:()=>{
      moving.forEach(e=>{
        e.archived = true;
        e.archiveId = 'ARC-2026-' + String(ARCHIVE.length + 1).padStart(5,'0');
        ARCHIVE.unshift(e);
        const i = EVENTS.indexOf(e);
        if(i >= 0) EVENTS.splice(i, 1);
      });
      RET_HISTORY.unshift({when:TODAY + ' ' + clock(), what:'Archive run',
        detail:`${moving.length} events sealed into ${RET.storage}`, by:'Chikondi Mwale'});
      logEvent({module:'System', action:'Audit events archived', type:'System', severity:'Warning',
        user:'Chikondi Mwale', record:'AUDIT-ARCHIVE', desc:`${moving.length} events archived (older than ${days} days)`,
        bucket:{sys:'app', perm:'privileged'}});
      renderAll(); closeModal();
      toast(moving.length + ' events archived.');
    }}]);
}

function requestDeletion(){
  openModal('Request audit log deletion', 'Append-only record — dual approval required', `
    <div class="note gold"><div><b>Deletion is restricted.</b> No user, including an administrator, can delete an audit
      event directly. A request is raised, logged, and must be approved by a second administrator within the retention
      policy. Requests that fall inside the retention period are refused automatically.</div></div>
    <div class="form-grid" style="margin-top:9px">
      <div class="fg"><label>Reason</label><select id="delReason">
        <option>Data protection request</option><option>Erroneous record</option>
        <option>Court order</option><option>Retention period expired</option></select></div>
      <div class="fg"><label>Approver</label><select id="delApprover">
        ${USERS.filter(u=>u.role === 'Administrator').map(u=>`<option>${esc(u.name)}</option>`).join('')}</select></div>
      <div class="fg" style="grid-column:1/-1"><label>Scope</label>
        <input id="delScope" placeholder="Event IDs or a record reference"></div>
      <div class="fg" style="grid-column:1/-1"><label>Justification</label>
        <textarea id="delJust" style="min-height:60px"></textarea></div>
    </div>`,
    [{label:'Cancel', act:'close'}, {label:'Submit request', cls:'btn-gold', act:()=>{
      const reason = el('delReason').value;
      const scope = el('delScope').value.trim() || 'Not specified';
      const refused = reason !== 'Retention period expired';
      RET_HISTORY.unshift({when:TODAY + ' ' + clock(), what:'Deletion request',
        detail:(refused ? 'Refused — ' : 'Queued — ') + reason + ' · ' + scope
          + (refused ? ' · retention period has not expired' : ' · awaiting second approval'),
        by:'Chikondi Mwale'});
      logEvent({module:'System', action: refused ? 'Audit log deletion refused' : 'Audit log deletion requested',
        type:'Permission', severity:'Critical', outcome: refused ? 'Denied' : 'Success',
        user:'Chikondi Mwale', record:scope,
        desc:reason + ' — ' + (refused ? 'blocked by the retention policy' : 'queued for second approval'),
        bucket:{perm:'privileged', sys:'app'}});
      renderAll(); closeModal();
      toast(refused ? 'Deletion refused by the retention policy.' : 'Deletion request queued for approval.',
        refused ? 'err' : 'ok');
    }}]);
}

function wireRetention(){
  el('retSave').onclick = ()=>{
    const before = {...RET};
    RET.days = clamp(Number(el('retDays').value) || 2555, 90, 36500);
    RET.archiveAfter = clamp(Number(el('retArchiveAfter').value) || 30, 1, 3650);
    RET.deletion = el('retDelete').value;
    RET.exportAuth = el('retExportAuth').value;
    RET.integrityEvery = el('retIntegrity').value;
    RET.storage = el('retStorage').value;
    const changes = [];
    if(before.days !== RET.days) changes.push(['Retention period', before.days + ' days', RET.days + ' days']);
    if(before.archiveAfter !== RET.archiveAfter) changes.push(['Archive trigger', before.archiveAfter + ' days', RET.archiveAfter + ' days']);
    if(before.deletion !== RET.deletion) changes.push(['Deletion policy', before.deletion, RET.deletion]);
    if(before.exportAuth !== RET.exportAuth) changes.push(['Export authorisation', before.exportAuth, RET.exportAuth]);
    if(before.integrityEvery !== RET.integrityEvery) changes.push(['Integrity check', before.integrityEvery, RET.integrityEvery]);
    if(before.storage !== RET.storage) changes.push(['Archive storage', before.storage, RET.storage]);
    if(!changes.length){ toast('No policy changes to save.', 'info'); return; }
    RET_HISTORY.unshift({when:TODAY + ' ' + clock(), what:'Policy change',
      detail:changes.map(c=>c[0] + ': ' + c[1] + ' → ' + c[2]).join('; '), by:'Chikondi Mwale'});
    logEvent({module:'Settings', action:'Audit retention policy changed', type:'Configure', severity:'Critical',
      user:'Chikondi Mwale', record:'AUDIT-POLICY', desc:'Retention and integrity policy updated',
      changes, bucket:{cfg:'backup', perm:'privileged'}});
    renderAll();
    toast('Retention policy saved (' + changes.length + ' change' + (changes.length===1?'':'s') + ').');
  };
  el('retDeleteBtn').onclick = requestDeletion;
  el('chainRun').onclick = runIntegrity;
  el('archRun').onclick = archiveNow;
  el('archSearch').addEventListener('input', renderArchive);
  el('backupRun').onclick = ()=>{
    BACKUPS.unshift({when:TODAY + ' ' + clock(), size:'1.86 GB', status:'Success', target:RET.storage});
    logEvent({module:'System', action:'Audit backup completed', type:'System', user:'Chikondi Mwale',
      record:'AUDIT-BACKUP', desc:'Manual backup of the audit store completed (1.86 GB)',
      bucket:{sys:'app', cfg:'backup'}});
    renderAll();
    toast('Backup completed and verified.');
  };
  el('compAdd').onclick = ()=>{
    openModal('Record a compliance review', 'Independent review of the audit record', `
      <div class="form-grid">
        <div class="fg"><label>Reviewer</label><input id="crvWho" value="Ruth Nsanja"></div>
        <div class="fg"><label>Scope</label><input id="crvScope" placeholder="e.g. Full audit record, Q4 2026"></div>
        <div class="fg"><label>Result</label><select id="crvResult">
          <option>Compliant</option><option>Compliant with findings</option><option>Non-compliant</option></select></div>
        <div class="fg"><label>Findings</label><input id="crvNotes" placeholder="What was found"></div>
      </div>`,
      [{label:'Cancel', act:'close'}, {label:'Save review', cls:'btn-gold', act:()=>{
        COMP_REVIEWS.unshift({when:TODAY, reviewer:el('crvWho').value.trim() || 'Ruth Nsanja',
          scope:el('crvScope').value.trim() || 'Audit record review',
          result:el('crvResult').value, notes:el('crvNotes').value.trim() || 'No findings recorded.'});
        logEvent({module:'Security', action:'Compliance review recorded', type:'Review', severity:'Warning',
          user:'Chikondi Mwale', record:'AUDIT-COMPLIANCE', desc:el('crvScope').value || 'Audit record review',
          bucket:{perm:'sensitive', sec:'suspicious'}});
        renderAll(); closeModal(); toast('Compliance review recorded.');
      }}]);
  };
}

/* ===================== top bar & navigation ===================== */
function wireTop(){
  if(el('menuBtn')) el('menuBtn').onclick = ()=> el('sidebar').classList.toggle('open');
  el('modalClose').onclick = closeModal;
  el('modal').addEventListener('click', e=>{ if(e.target === el('modal')) closeModal(); });
  el('globalSearch').addEventListener('input', ()=>{
    el('lgSearch').value = el('globalSearch').value;
    LG.q = el('globalSearch').value; LG.page = 1;
    renderAllLogs();
  });
  el('globalSearch').addEventListener('keydown', e=>{ if(e.key === 'Enter') goto('s2'); });
  el('exportAll').onclick = ()=>exportLog('All audit logs');
  el('exportBand').onclick = ()=>exportLog('All audit logs');
  el('ovOpenAll').onclick = ()=>goto('s2');
  el('integrityBtn').onclick = runIntegrity;
  el('bellBtn').onclick = ()=>{
    const open = ALERTS.filter(a=>a.status !== 'Resolved' && a.status !== 'Dismissed');
    openModal('Security alerts', open.length + ' open',
      open.slice(0,6).map(a=>`<div class="alertcard ${a.severity === 'Critical' ? 'crit' : ''}">
        <div class="ah"><span class="at">${esc(a.title)}</span>
          <span class="sev ${a.severity === 'Critical' || a.severity === 'High' ? 'sev-crit' : 'sev-warn'}">${a.severity}</span>
          <span class="badge ${a.status === 'Open' ? 'b-rej' : 'b-await'}">${a.status}</span></div>
        <div class="ab">${esc(a.detail)}</div></div>`).join('') || '<div class="empty">No open alerts.</div>',
      [{label:'Open alert queue', cls:'btn-gold', act:()=>{ closeModal(); goto('s16'); }}, {label:'Close', act:'close'}]);
  };
  el('ovRange').addEventListener('change', ()=>{ OV.range = el('ovRange').value; renderOverview(); });
}

function goto(id){
  const t = document.getElementById(id);
  if(!t) return;
  window.scrollTo({top:t.offsetTop - 112, behavior:'smooth'});
  document.querySelectorAll('#subnav .snav').forEach(c=>c.classList.toggle('on', c.getAttribute('href') === '#' + id));
}

function spy(){
  const chips = [...document.querySelectorAll('#subnav .snav')];
  const secs = [...document.querySelectorAll('main .sec')];
  const onScroll = ()=>{
    let cur = secs[0];
    secs.forEach(s=>{ if(s.offsetTop - 130 <= window.scrollY) cur = s; });
    if(cur) chips.forEach(c=>c.classList.toggle('on', c.getAttribute('href') === '#' + cur.id));
  };
  window.addEventListener('scroll', onScroll, {passive:true});
  chips.forEach(c=>c.addEventListener('click', e=>{
    e.preventDefault();
    const t = document.querySelector(c.getAttribute('href'));
    if(t) window.scrollTo({top:t.offsetTop - 112, behavior:'smooth'});
  }));
  onScroll();
}

/* ===================== boot ===================== */
function renderAll(){
  renderBand();
  renderOverview();
  renderAllLogs();
  renderStaff();
  renderAdmin();
  renderCustomerAudit();
  renderLoanAudit();
  renderDisbursements();
  renderRepaymentAudit();
  renderFinancial();
  renderSecurity();
  renderPermissions();
  renderConfig();
  renderSystem();
  renderEventDetail();
  renderAdvSearch();
  renderAlerts();
  renderReports();
  renderRetention();
}

function boot(){
  seedRecords();
  fillLogSelects();
  renderChain();

  wireTop();
  wireAllLogs();
  wireStaff();
  wireAdmin();
  wireCustomerAudit();
  wireLoanAudit();
  wireDisbursements();
  wireRepaymentAudit();
  wireFinancial();
  wireSecurity();
  wirePermissions();
  wireConfig();
  wireSystem();
  wireEventDetail();
  wireAdvSearch();
  wireAlerts();
  wireReports();
  wireRetention();

  renderAll();
  spy();
}

window.AUDIT_APP = {
  USERS, EVENTS, ARCHIVE, ALERTS, INVEST, EXPORTS, TEMPLATES,
  state:{OV, LG, ST, AD, CR, LA, DB, RPA, FIN, SEC, PER, CFG, SYS, ADV, ALA, RP, RET},
  renderAll, reportData, openEvent, logEvent, exportReport,
  runIntegrity, archiveNow, alertAction, resolvePermReq,
  xlsxBytes:(title, cols, rows)=>writeXlsx('test.xlsx', {title, cols, rows, returnBytes:true}),
  byId, isFinancial, isSecurity, INTEGRITY, RET
};

boot();
</script>
</body>
</html>
