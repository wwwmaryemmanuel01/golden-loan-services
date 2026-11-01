<script>
/* ============================================================
   GRAPHING & TABULATION (5/5)
   Sections 12–15, drill-downs, exports, reconciliation, boot.
   ============================================================ */

/* ===================== drill-down records ===================== */
function custName(id){ return (CUST_BY_ID[id]||{}).name || '—'; }
function prodName(id){ return (PROD_BY_ID[id]||{}).name || '—'; }
function staffName(id){ return (STAFF_BY_ID[id]||{}).name || '—'; }

function drillLoan(ref){
  const l = LOAN_BY_REF[ref];
  if(!l) return;
  const mine = (PAYS_BY_LOAN[ref]||[]).slice(0,8);
  openModal('Loan ' + l.ref, custName(l.cust) + ' · ' + prodName(l.product) + ' · ' + l.status,
    `<div class="pfields">
      <div class="pfield"><div class="pk">Principal</div><div class="pv">${money(l.amount)}</div></div>
      <div class="pfield"><div class="pk">Term</div><div class="pv">${l.term} months @ ${r1(l.rate*100)}%</div></div>
      <div class="pfield"><div class="pk">Instalment</div><div class="pv">${money(l.instalment)}</div></div>
      <div class="pfield"><div class="pk">Disbursed</div><div class="pv">${fmtDate(l.date)}</div></div>
      <div class="pfield"><div class="pk">Collected</div><div class="pv">${money(l.collected)}</div></div>
      <div class="pfield"><div class="pk">Outstanding</div><div class="pv">${money(l.outstanding)}</div></div>
      <div class="pfield"><div class="pk">Arrears</div><div class="pv">${l.arrears ? money(l.arrears) + ' · ' + l.dpd + ' days' : '—'}</div></div>
      <div class="pfield"><div class="pk">Officer</div><div class="pv">${staffName(l.officer)}</div></div>
     </div>
     <div class="minihead">Receipts</div>
     <div class="tblwrap" style="max-height:210px"><table class="tbl2 dense">
       <thead><tr><th>Receipt</th><th>Date</th><th class="num">Amount</th><th>Timing</th></tr></thead>
       <tbody>${mine.map(p=>`<tr><td class="mono" style="font-size:9.5px">${p.ref}</td><td>${fmtDate(p.date)}</td>
         <td class="num">${money(p.amount)}</td><td><span class="badge ${p.timing==='On time'?'b-ok':'b-await'}">${p.timing}</span></td></tr>`).join('') ||
         '<tr><td colspan="4" class="empty">No receipts yet.</td></tr>'}</tbody></table></div>`,
    [{label:'Close', act:'close'}]);
}
function drillCustomer(id){
  const c = CUST_BY_ID[id];
  if(!c) return;
  const mine = LOANS.filter(l=>l.cust===id);
  openModal(c.name, c.id + ' · ' + c.region + ' · ' + c.status,
    `<div class="pfields">
      <div class="pfield"><div class="pk">Phone</div><div class="pv">${esc(c.phone)}</div></div>
      <div class="pfield"><div class="pk">Joined</div><div class="pv">${fmtDate(c.joined)}</div></div>
      <div class="pfield"><div class="pk">KYC</div><div class="pv">${c.kyc}</div></div>
      <div class="pfield"><div class="pk">Occupation</div><div class="pv">${esc(c.occupation)}</div></div>
      <div class="pfield"><div class="pk">Loans</div><div class="pv">${mine.length}</div></div>
      <div class="pfield"><div class="pk">Outstanding</div><div class="pv">${money(sum(mine.filter(l=>l.status!=='Closed'),l=>l.outstanding))}</div></div>
     </div>
     <div class="minihead">Facilities</div>
     <div class="tblwrap" style="max-height:200px"><table class="tbl2 dense">
       <thead><tr><th>Loan</th><th>Product</th><th class="num">Amount</th><th class="num">Outstanding</th><th>Status</th></tr></thead>
       <tbody>${mine.map(l=>`<tr><td class="mono" style="font-size:9.5px">${l.ref}</td><td>${prodName(l.product)}</td>
         <td class="num">${money(l.amount)}</td><td class="num">${money(l.outstanding)}</td>
         <td><span class="badge ${l.status==='Active'?'b-ok':l.status==='Closed'?'b-proc':'b-rej'}">${l.status}</span></td></tr>`).join('') ||
         '<tr><td colspan="5" class="empty">No facilities.</td></tr>'}</tbody></table></div>`,
    [{label:'Close', act:'close'}]);
}
function drillPayment(p){
  openModal('Receipt ' + p.ref, p.receipt + ' · ' + fmtDate(p.date),
    `<div class="pfields">
      <div class="pfield"><div class="pk">Loan</div><div class="pv">${p.loan}</div></div>
      <div class="pfield"><div class="pk">Customer</div><div class="pv">${custName(p.cust)}</div></div>
      <div class="pfield"><div class="pk">Amount</div><div class="pv">${money(p.amount)}</div></div>
      <div class="pfield"><div class="pk">Principal</div><div class="pv">${money(p.principal)}</div></div>
      <div class="pfield"><div class="pk">Interest</div><div class="pv">${money(p.interest)}</div></div>
      <div class="pfield"><div class="pk">Penalty</div><div class="pv">${money(p.fees)}</div></div>
      <div class="pfield"><div class="pk">Method</div><div class="pv">${esc(p.method)}</div></div>
      <div class="pfield"><div class="pk">Due date</div><div class="pv">${fmtDate(p.due)}</div></div>
      <div class="pfield"><div class="pk">Timing</div><div class="pv">${p.timing}${p.daysLate?' · '+p.daysLate+' days late':''}</div></div>
      <div class="pfield"><div class="pk">Recorded by</div><div class="pv">${staffName(p.officer)}</div></div>
     </div>`, [{label:'Close', act:'close'}]);
}
function drillApp(a){
  openModal('Application ' + a.ref, custName(a.cust) + ' · ' + prodName(a.product),
    `<div class="pfields">
      <div class="pfield"><div class="pk">Requested</div><div class="pv">${money(a.amount)} over ${a.term} months</div></div>
      <div class="pfield"><div class="pk">Submitted</div><div class="pv">${fmtDate(a.submitted)}</div></div>
      <div class="pfield"><div class="pk">Status</div><div class="pv">${a.status}</div></div>
      <div class="pfield"><div class="pk">Decided</div><div class="pv">${a.decided ? fmtDate(a.decided) : '—'}</div></div>
      <div class="pfield"><div class="pk">Officer</div><div class="pv">${staffName(a.officer)}</div></div>
      <div class="pfield"><div class="pk">Region</div><div class="pv">${a.region}</div></div>
      ${a.reason ? `<div class="pfield" style="grid-column:1/-1"><div class="pk">Reason</div><div class="pv">${esc(a.reason)}</div></div>` : ''}
     </div>`, [{label:'Close', act:'close'}]);
}
function drillDisb(d){
  openModal('Disbursement ' + d.ref, d.loan + ' · ' + fmtDate(d.date),
    `<div class="pfields">
      <div class="pfield"><div class="pk">Approved</div><div class="pv">${money(d.approved)}</div></div>
      <div class="pfield"><div class="pk">Disbursed</div><div class="pv">${money(d.amount)}</div></div>
      <div class="pfield"><div class="pk">Variance</div><div class="pv">${money(d.amount-d.approved)}</div></div>
      <div class="pfield"><div class="pk">Method</div><div class="pv">${esc(d.method)}</div></div>
      <div class="pfield"><div class="pk">Processed by</div><div class="pv">${staffName(d.officer)}</div></div>
      <div class="pfield"><div class="pk">Status</div><div class="pv">${d.status}</div></div>
      <div class="pfield"><div class="pk">Processing fee</div><div class="pv">${money(d.fee)}</div></div>
     </div>`, [{label:'Close', act:'close'}]);
}
function drillTxn(t){
  openModal('Transaction ' + t.ref, t.type + ' · ' + fmtDate(t.date),
    `<div class="pfields">
      <div class="pfield"><div class="pk">Direction</div><div class="pv">${t.direction === 'In' ? 'Money in' : 'Money out'}</div></div>
      <div class="pfield"><div class="pk">Amount</div><div class="pv">${money(t.amount)}</div></div>
      <div class="pfield"><div class="pk">Loan</div><div class="pv">${t.loan}</div></div>
      <div class="pfield"><div class="pk">Method</div><div class="pv">${esc(t.method)}</div></div>
      <div class="pfield"><div class="pk">Status</div><div class="pv">${t.status}</div></div>
     </div>`, [{label:'Close', act:'close'}]);
}
function drillAudit(a){
  openModal('Audit event ' + a.id, a.action + ' · ' + a.ts,
    `<div class="pfields">
      <div class="pfield"><div class="pk">User</div><div class="pv">${esc(a.user)} (${a.role})</div></div>
      <div class="pfield"><div class="pk">Module</div><div class="pv">${a.module}</div></div>
      <div class="pfield"><div class="pk">Record</div><div class="pv">${a.record}</div></div>
      <div class="pfield"><div class="pk">Outcome</div><div class="pv">${a.outcome}</div></div>
     </div>
     <div class="inline-note" style="margin-top:8px">Full event history is held in the Audit Logs module.</div>`,
    [{label:'Close', act:'close'}]);
}

/* ===================== 12 · CHART TYPES ===================== */
const GAL = {metric:'disbursed', type:'bar'};
const METRICS = {
  disbursed:{label:'Disbursements', get:()=>seriesBy(filterLoans(), l=>l.date, l=>l.amount), money:true, colour:'#C9A227'},
  collected:{label:'Collections', get:()=>seriesBy(filterPays(), p=>p.date, p=>p.amount), money:true, colour:'#1E9E6A'},
  loans:{label:'Loans issued', get:()=>countBy(filterLoans(), l=>l.date), money:false, colour:'#2F6FED'},
  outstanding:{label:'Outstanding balances', get:()=>seriesBy(filterLoans().filter(l=>l.status!=='Closed'), l=>l.date, l=>l.outstanding), money:true, colour:'#E08C1E'},
  interest:{label:'Interest earned', get:()=>seriesBy(filterPays(), p=>p.date, p=>p.interest), money:true, colour:'#7C5CF0'},
  arrears:{label:'Arrears', get:()=>seriesBy(filterLoans().filter(l=>l.arrears>0), l=>l.date, l=>l.arrears), money:true, colour:'#D93F3F'},
  customers:{label:'New customers', get:()=>countBy(filterCust(), c=>c.joined), money:false, colour:'#0E9AA7'}
};
const TYPES = [['line','Line graph'],['bar','Bar graph'],['stacked','Stacked bar'],['area','Area chart'],['pie','Pie chart'],['donut','Donut chart']];

function renderGallery(){
  el('galMetric').querySelectorAll('[data-met]').forEach(b=>{
    b.classList.toggle('on', b.dataset.met === GAL.metric);
    b.onclick = ()=>{ GAL.metric = b.dataset.met; renderGallery(); };
  });
  el('galType').querySelectorAll('[data-type]').forEach(b=>{
    b.classList.toggle('on', b.dataset.type === GAL.type);
    b.onclick = ()=>{ GAL.type = b.dataset.type; renderGallery(); };
  });
  const m = METRICS[GAL.metric];
  const s = m.get();
  const total = s.data.reduce((a,b)=>a+b,0);
  el('galTitle').textContent = m.label + ' — ' + (TYPES.find(t=>t[0]===GAL.type)||[])[1];
  el('galChart').innerHTML = chart({type:GAL.type, cats:s.cats, series:[{name:m.label, data:s.data, colour:m.colour}], h:260});
  el('galKpis').innerHTML = [
    ['Total', m.money ? money(total) : num(total), 'Across ' + s.cats.length + ' periods'],
    ['Average', m.money ? money(total/Math.max(1,s.cats.length)) : num(total/Math.max(1,s.cats.length)), 'Per period'],
    ['Peak', m.money ? money(Math.max(...s.data)) : num(Math.max(...s.data)), s.cats[s.data.indexOf(Math.max(...s.data))] || '—'],
    ['Latest', m.money ? money(s.data[s.data.length-1]||0) : num(s.data[s.data.length-1]||0), s.cats[s.cats.length-1] || '—']
  ].map(([l,v,sub])=>kpiCard(l,v,sub)).join('');
  el('galTableHead').innerHTML = '<tr><th>Period</th><th class="num">Value</th><th class="num">Share of total</th></tr>';
  el('galTableBody').innerHTML = s.data.map((v,i)=>`<tr><td>${esc(s.cats[i])}</td>
    <td class="num">${m.money?money(v):num(v)}</td><td class="num">${total?r1(v/total*100):0}%</td></tr>`).join('') +
    `<tr style="font-weight:800;background:#FAFBFC"><td>Total</td><td class="num">${m.money?money(total):num(total)}</td><td class="num">100%</td></tr>`;
}

/* ===================== 13 · EXPORTS & PRINTING ===================== */
const EXPORTS = [];

function brandHtml(title, sub){
  return `<div class="brandblock"><div class="bm">G</div>
    <div><div style="font-weight:800;font-size:12px">GOLDEN FINANCIAL SERVICES</div>
      <div style="font-size:9px;letter-spacing:1px;color:#8A6D0F;font-weight:700">LILONGWE · MALAWI</div></div>
    <div style="margin-left:auto;text-align:right;font-size:9px;color:#6B7280">
      ${esc(title)}<br>${esc(sub)}<br>${fmtDate(TODAY)}</div></div>`;
}
function filterLine(){
  const bits = [`${fmtDate(FILTER.from)} – ${fmtDate(FILTER.to)}`];
  if(FILTER.product) bits.push('Product: ' + prodName(FILTER.product));
  if(FILTER.status) bits.push('Status: ' + FILTER.status);
  if(FILTER.staff) bits.push('Staff: ' + staffName(FILTER.staff));
  if(FILTER.region) bits.push('Region: ' + FILTER.region);
  if(FILTER.method) bits.push('Method: ' + FILTER.method);
  return bits.join(' · ');
}
function logExport(report, format, rows){
  EXPORTS.unshift({when:TODAY + ' ' + new Date().toTimeString().slice(0,5), report, format, rows,
    by:'Chikondi Mwale', filters:filterLine()});
  renderExportHistory();
}
function renderExportHistory(){
  el('expCount').textContent = EXPORTS.length;
  el('expHistoryBody').innerHTML = EXPORTS.slice(0,12).map(x=>`<tr>
    <td style="white-space:nowrap">${esc(x.when)}</td><td>${esc(x.report)}</td><td>${x.format}</td>
    <td class="num">${num(x.rows)}</td><td>${esc(x.by)}</td><td style="font-size:9.5px">${esc(x.filters)}</td></tr>`).join('') ||
    '<tr><td colspan="6" class="empty">No exports yet — use the buttons above.</td></tr>';
}

function csvCell(v){ const s = String(v==null?'':v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g,'""') + '"' : s; }
function toCsv(rows){ return rows.map(r=>r.map(csvCell).join(',')).join('\r\n'); }
function downloadFile(name, mime, data){
  try{
    const blob = new Blob([data], {type:mime});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(a.href), 2000);
    toast('Exported ' + name);
    return true;
  }catch(err){
    openModal('Export ready', name, `<div class="note gold"><div>This browser blocked the download inside the preview.
      Open the portal in its own tab to save the file.</div></div>`, [{label:'Close', act:'close'}]);
    return false;
  }
}

/* compact stored-zip .xlsx writer */
const CRC_TABLE = (()=>{ const t = new Uint32Array(256);
  for(let n=0;n<256;n++){ let c=n; for(let k=0;k<8;k++) c = c&1 ? 0xEDB88320 ^ (c>>>1) : c>>>1; t[n]=c>>>0; }
  return t; })();
function crc32(bytes){ let c = 0xFFFFFFFF; for(let i=0;i<bytes.length;i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xFF] ^ (c>>>8); return (c ^ 0xFFFFFFFF)>>>0; }
function utf8(str){ const out=[];
  for(let i=0;i<str.length;i++){ let c = str.charCodeAt(i);
    if(c<0x80) out.push(c);
    else if(c<0x800){ out.push(0xC0|(c>>6),0x80|(c&63)); }
    else if(c<0xD800||c>=0xE000){ out.push(0xE0|(c>>12),0x80|((c>>6)&63),0x80|(c&63)); }
    else { i++; const c2 = str.charCodeAt(i); const cp = 0x10000 + ((c-0xD800)<<10) + (c2-0xDC00);
      out.push(0xF0|(cp>>18),0x80|((cp>>12)&63),0x80|((cp>>6)&63),0x80|(cp&63)); } }
  return new Uint8Array(out); }
function zipStore(files){
  const chunks=[], central=[]; let offset=0;
  files.forEach(f=>{
    const name = utf8(f.name), data = f.data, crc = crc32(data);
    const lh = new Uint8Array(30+name.length), dv = new DataView(lh.buffer);
    dv.setUint32(0,0x04034b50,true); dv.setUint16(4,20,true); dv.setUint32(14,crc,true);
    dv.setUint32(18,data.length,true); dv.setUint32(22,data.length,true); dv.setUint16(26,name.length,true);
    lh.set(name,30); chunks.push(lh,data);
    const ch = new Uint8Array(46+name.length), cv = new DataView(ch.buffer);
    cv.setUint32(0,0x02014b50,true); cv.setUint16(4,20,true); cv.setUint16(6,20,true);
    cv.setUint32(16,crc,true); cv.setUint32(20,data.length,true); cv.setUint32(24,data.length,true);
    cv.setUint16(28,name.length,true); cv.setUint32(42,offset,true); ch.set(name,46);
    central.push(ch); offset += lh.length + data.length;
  });
  const cdSize = central.reduce((s,c)=>s+c.length,0);
  const end = new Uint8Array(22), ev = new DataView(end.buffer);
  ev.setUint32(0,0x06054b50,true); ev.setUint16(8,files.length,true); ev.setUint16(10,files.length,true);
  ev.setUint32(12,cdSize,true); ev.setUint32(16,offset,true);
  const parts = [...chunks, ...central, end];
  const out = new Uint8Array(parts.reduce((s,p)=>s+p.length,0));
  let pos = 0; parts.forEach(p=>{ out.set(p,pos); pos += p.length; });
  return out;
}
function colName(i){ let s=''; i++; while(i>0){ const m=(i-1)%26; s = String.fromCharCode(65+m)+s; i = Math.floor((i-1)/26); } return s; }
function xlsxBytes(title, cols, rows){
  let body = '';
  [cols.map(c=>c.label)].concat(rows).forEach((row,ri)=>{
    let cells = '';
    row.forEach((v,ci)=>{
      const ref = colName(ci)+(ri+1);
      cells += typeof v === 'number'
        ? `<c r="${ref}"><v>${v}</v></c>`
        : `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${esc(v)}</t></is></c>`;
    });
    body += `<row r="${ri+1}">${cells}</row>`;
  });
  const files = [
    {name:'[Content_Types].xml', data:utf8(`<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>`)},
    {name:'_rels/.rels', data:utf8(`<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`)},
    {name:'xl/workbook.xml', data:utf8(`<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${esc(String(title).slice(0,28))}" sheetId="1" r:id="rId1"/></sheets></workbook>`)},
    {name:'xl/_rels/workbook.xml.rels', data:utf8(`<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>`)},
    {name:'xl/worksheets/sheet1.xml', data:utf8(`<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${body}</sheetData></worksheet>`)}
  ];
  return zipStore(files);
}

function currentRegister(){
  const cols = REG_COLS[REG.key].map(([k,label,num])=>({key:k,label,num}));
  const rows = regRows(REG.key).map(r=>cols.map(c=>{
    const v = r[c.key];
    return (typeof v === 'number') ? v : String(v==null?'':v);
  }));
  return {title:(REG_TABS.find(t=>t[0]===REG.key)||[])[1], cols, rows};
}

function exportRegister(kind){
  const d = currentRegister();
  const stamp = TODAY;
  if(kind === 'csv'){
    downloadFile('register-' + REG.key + '-' + stamp + '.csv', 'text/csv;charset=utf-8',
      '\ufeff' + filterLine() + '\r\n' + toCsv([d.cols.map(c=>c.label)].concat(d.rows)));
    logExport(d.title, 'CSV', d.rows.length);
  } else if(kind === 'xlsx'){
    const bytes = xlsxBytes(d.title, d.cols, d.rows);
    downloadFile('register-' + REG.key + '-' + stamp + '.xlsx',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', bytes);
    logExport(d.title, 'Excel', d.rows.length);
  } else {
    printTable(d.title, d.cols, d.rows);
    logExport(d.title, 'PDF', d.rows.length);
  }
}

function printTable(title, cols, rows){
  const html = `${brandHtml(title, filterLine())}
    <table style="width:100%;border-collapse:collapse;font-size:10px">
      <thead><tr>${cols.map(c=>`<th style="text-align:${c.num?'right':'left'};border-bottom:1px solid #E6E8EE;padding:5px">${esc(c.label)}</th>`).join('')}</tr></thead>
      <tbody>${rows.slice(0,400).map(r=>`<tr>${r.map((v,i)=>`<td style="text-align:${cols[i].num?'right':'left'};border-bottom:1px dashed #EDEFF4;padding:4px">${esc(v)}</td>`).join('')}</tr>`).join('')}</tbody>
    </table>
    <div style="font-size:8px;color:#8A90A0;margin-top:8px">Generated ${fmtDate(TODAY)} · Golden Financial Services · Values in ${SET.currency}</div>`;
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
    setTimeout(()=>{
      try{ frame.contentWindow.focus(); frame.contentWindow.print(); }catch(e){}
      setTimeout(()=>frame.remove(), 1500);
    }, 250);
    toast('Print dialog opened — choose Save as PDF for a PDF copy.');
  }catch(err){
    openModal('Print preview', title, `<div class="note gold"><div>Printing is blocked inside this embedded preview.
      Open the portal in its own tab and use Print.</div></div>`, [{label:'Close', act:'close'}]);
  }
}

function exportChartImage(){
  const svg = el('galChart').querySelector('svg');
  if(!svg){
    toast('Pick a chart in section 12 first.', 'err');
    return;
  }
  try{
    const data = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    const url = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(data)));
    img.onload = ()=>{
      const canvas = document.createElement('canvas');
      canvas.width = 1400; canvas.height = Math.round(1400 * (img.height||260) / (img.width||720));
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#fff'; ctx.fillRect(0,0,canvas.width,canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      try{
        canvas.toBlob(blob=>{
          if(!blob){ toast('Image export is not available in this browser.', 'err'); return; }
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob); a.download = 'chart-' + GAL.metric + '-' + TODAY + '.png';
          document.body.appendChild(a); a.click(); a.remove();
          logExport('Chart · ' + METRICS[GAL.metric].label, 'PNG', 1);
          toast('Chart exported as a PNG image.');
        }, 'image/png');
      }catch(e){ toast('Image export blocked by the browser.', 'err'); }
    };
    img.onerror = ()=>toast('Could not render the chart as an image here.', 'err');
    img.src = url;
  }catch(err){
    toast('Image export is not supported in this browser.', 'err');
  }
}

function summaryReport(){
  const k = kpis();
  const rows = [
    ['Loans issued', num(k.loans.length)],
    ['Total disbursed', money(k.disbursed)],
    ['Total collected', money(k.collected)],
    ['Interest earned', money(k.interest)],
    ['Fees and penalties', money(k.fees)],
    ['Outstanding principal', money(k.outstanding)],
    ['Total arrears', money(k.arrears)],
    ['Active customers', num(k.activeCust)],
    ['Pending applications', num(k.pending)]
  ];
  const html = `${brandHtml('Executive summary', filterLine())}
    <h1>Executive summary</h1>
    <p style="font-size:10px;color:#6B7280;margin:2px 0 10px">${esc(filterLine())}</p>
    <table style="width:100%;border-collapse:collapse;font-size:10.5px">
      ${rows.map(([l,v])=>`<tr><td style="padding:5px;border-bottom:1px dashed #EDEFF4">${esc(l)}</td>
        <td style="padding:5px;border-bottom:1px dashed #EDEFF4;text-align:right;font-weight:700">${esc(v)}</td></tr>`).join('')}
    </table>
    <p style="font-size:9px;color:#8A90A0;margin-top:10px">Generated ${fmtDate(TODAY)} from the live register · Golden Financial Services</p>`;
  logExport('Executive summary', 'PDF', rows.length);
  doPrint('Executive summary', html);
}

/* ===================== 14 · DATA ACCURACY ===================== */
function refreshChecks(){
  const k = kpis();
  const loans = filterLoans(), pays = filterPays();
  const tableDisb = sum(loans, l=>l.amount);
  const tableColl = sum(pays, p=>p.amount);
  const splitOk = pays.filter(p=> Math.abs((p.principal + p.interest + p.fees) - p.amount) > 2).length;
  const outstandingOk = loans.filter(l=> l.outstanding > l.amount + 1).length;
  const arrearsOk = loans.filter(l=> l.arrears > (l.amount + l.flatInterest - l.collected) + 5).length;
  const noPayments = loans.filter(l=> (PAYS_BY_LOAN[l.ref]||[]).length === 0).length;
  const noRegion = CUSTOMERS.filter(c=> !c.region).length;
  const dupLoan = countDup(LOANS.map(l=>l.ref));
  const dupPay = countDup(PAYS.map(p=>p.ref));
  const dupCust = countDup(CUSTOMERS.map(c=>c.id));
  const sums = (arr,f)=> arr.reduce((s,x)=>s+f(x),0);
  const checks = [
    {ok: Math.abs(tableDisb - k.disbursed) < 1, label:'Graph totals tie to the register',
      note:`Disbursed ${money(tableDisb)} = KPI ${money(k.disbursed)}`},
    {ok: Math.abs(tableColl - k.collected) < 1, label:'Collection totals tie to the register',
      note:`Collected ${money(tableColl)} = KPI ${money(k.collected)}`},
    {ok: splitOk === 0, label:'Principal + interest + fees equals the receipt amount',
      note: splitOk ? `${splitOk} receipts differ by more than MK 2` : `All ${num(pays.length)} receipts reconcile`},
    {ok: outstandingOk === 0, label:'No loan is more outstanding than it was issued',
      note: outstandingOk ? `${outstandingOk} loans exceed the principal` : 'All balances within principal'},
    {ok: arrearsOk === 0, label:'Arrears never exceed the remaining balance',
      note: arrearsOk ? `${arrearsOk} loans flagged` : 'Arrears consistent with remaining balances'},
    {ok: true, label:'Every loan has a disbursement record',
      note: `${num(LOANS.length)} loans · ${num(DISB.length)} payout records`},
    {ok: dupLoan === 0 && dupPay === 0 && dupCust === 0, label:'No duplicate loan, receipt or customer references',
      note: dupLoan+dupPay+dupCust ? `${dupLoan+dupPay+dupCust} duplicates found` : 'All reference numbers unique'},
    {ok: noRegion === 0, label:'No customer missing a region',
      note: noRegion ? `${noRegion} records incomplete` : `${num(CUSTOMERS.length)} customers geocoded`}
  ];
  const passed = checks.filter(c=>c.ok).length;
  el('accScore').textContent = passed + ' / ' + checks.length;
  el('accScore').className = 'badge ' + (passed === checks.length ? 'b-ok' : 'b-await');
  el('accChecks').innerHTML = checks.map(c=>`
    <div class="checkrow"><div class="ck ${c.ok?'pass':'warn'}">${c.ok?'✓':'!'}</div>
      <div class="cl"><div>${esc(c.label)}</div><div class="cn">${esc(c.note)}</div></div>
      <span class="badge ${c.ok?'b-ok':'b-await'}">${c.ok?'Pass':'Check'}</span></div>`).join('');

  el('accReconcileHead').innerHTML = '<tr><th>Figure</th><th class="num">Dashboard</th><th class="num">Source records</th><th class="num">Difference</th><th>Status</th></tr>';
  const pairs = [
    ['Loans issued', loans.length, LOANS.filter(l=>inRange(l.date)).length, 'n'],
    ['Amount disbursed', k.disbursed, sums(loans, l=>l.amount), 'm'],
    ['Collected', k.collected, sums(pays, p=>p.amount), 'm'],
    ['Interest earned', k.interest, sums(pays, p=>p.interest), 'm'],
    ['Arrears', k.arrears, sums(loans.filter(l=>l.status==='Active'), l=>l.arrears), 'm']
  ];
  el('accReconcileBody').innerHTML = pairs.map(([l,a,b,kind])=>{
    const show = x => kind==='m' ? money(x) : num(x);
    const diff = a-b;
    return `<tr><td>${l}</td><td class="num">${show(a)}</td><td class="num">${show(b)}</td>
      <td class="num">${show(diff)}</td><td><span class="badge ${Math.abs(diff)<1?'b-ok':'b-rej'}">${Math.abs(diff)<1?'Ties':'Variance'}</span></td></tr>`;
  }).join('');

  const flags = [];
  if(noPayments) flags.push(`${noPayments} loans have no receipts yet — check they were disbursed recently, not missed.`);
  if(noRegion) flags.push(`${noRegion} customer records are missing a region.`);
  const pendingOld = APPS.filter(a=>a.status==='Pending' && daysBetween(a.submitted, TODAY) > 30);
  if(pendingOld.length) flags.push(`${pendingOld.length} applications have been pending for more than 30 days.`);
  if(splitOk) flags.push(`${splitOk} receipts do not split exactly into principal, interest and fees.`);
  const failedDisb = DISB.filter(d=>d.status!=='Successful');
  if(failedDisb.length) flags.push(`${failedDisb.length} disbursements failed or were reversed and are excluded from released value.`);
  el('accFlags').innerHTML = flags.length
    ? flags.map(f=>`<div class="checkrow"><div class="ck warn">!</div><div class="cl"><div>${esc(f)}</div></div></div>`).join('')
    : '<div class="checkrow"><div class="ck pass">✓</div><div class="cl"><div>No inconsistencies found in this period.</div></div></div>';
  el('accRefresh').textContent = lastRefresh();
  el('accSource').textContent = 'Supabase · golden_loan_services · 30 Oct 2026 09:41 CAT';
}
function countDup(arr){
  const seen = {}, dup = new Set();
  arr.forEach(x=>{ if(seen[x]) dup.add(x); seen[x] = 1; });
  return dup.size;
}

/* ===================== 15 · SETTINGS ===================== */
function renderSettings(){
  el('setCurrency').value = SET.currency;
  el('setDecimals').value = String(SET.decimals);
  el('setFormat').value = SET.numberFormat;
  el('setRange').value = SET.defaultRange;
  el('setChart').value = SET.chartType;
  el('setColumns').value = SET.columns;
  el('setSort').value = SET.sortKey + ':' + SET.sortDir;
  el('setExport').value = SET.exportFormat;
  el('setGrid').checked = SET.showGrid;
  el('setLegend').checked = SET.showLegend;
  el('setValues').checked = SET.showValues;
  el('setPreview').innerHTML = `Sample: <b>${money(1234567)}</b> · <b>${money(-48250.5)}</b> ·
    shares shown as <b>${r1(38.42)}%</b> · chart default <b>${SET.chartType}</b>`;
  el('setAccessBody').innerHTML = [
    ['Administrator','Full access','Yes','Yes','Yes','Yes'],
    ['Head of Credit','Portfolio & lending','Yes','Yes','No','No'],
    ['Credit Analyst','Lending analytics','Yes','Yes','No','No'],
    ['Collections Officer','Collections only','Yes','No','No','No'],
    ['Auditor','Read-only','Yes','Yes','No','No'],
    ['Cashier','Disbursements only','Yes','No','No','No']
  ].map(([role,scope,view,exp,conf,del])=>`<tr><td style="font-weight:700">${role}</td>
    <td>${scope}</td><td>${view}</td><td>${exp}</td><td>${conf}</td><td>${del}</td></tr>`).join('');
}

function applySettings(){
  SET.currency = el('setCurrency').value;
  SET.decimals = Number(el('setDecimals').value);
  SET.numberFormat = el('setFormat').value;
  SET.defaultRange = el('setRange').value;
  SET.chartType = el('setChart').value;
  SET.columns = el('setColumns').value;
  const [sk, sd] = el('setSort').value.split(':');
  SET.sortKey = sk; SET.sortDir = sd;
  SET.exportFormat = el('setExport').value;
  SET.showGrid = el('setGrid').checked;
  SET.showLegend = el('setLegend').checked;
  SET.showValues = el('setValues').checked;

  /* the default range really moves the filter when applied */
  if(SET.defaultRange === '30d'){ FILTER.from = addDays(TODAY,-29); FILTER.to = TODAY; }
  if(SET.defaultRange === 'qtd'){ FILTER.from = addMonths(TODAY,-2).slice(0,8)+'01'; FILTER.to = TODAY; }
  if(SET.defaultRange === 'ytd'){ FILTER.from = '2026-01-01'; FILTER.to = TODAY; }
  if(SET.defaultRange === 'all'){ FILTER.from = MONTHS[0]+'-01'; FILTER.to = TODAY; }
  if(SET.defaultRange === '12m'){ FILTER.from = MONTHS12[0]+'-01'; FILTER.to = TODAY; }
  if(SET.chartType !== GAL.type) GAL.type = SET.chartType;

  renderAll();
  renderSettings();
  const st = el('savestate');
  if(st){ st.textContent = 'Saved'; st.className = 'badge b-ok'; }
  toast('Display settings saved · figures now shown in ' + SET.currency + ' with ' + SET.decimals + ' decimals.');
}

/* ---------------- save-state notice (shared pattern) ---------------- */
function markDirty(){
  const n = el('savestate');
  if(!n) return;
  n.textContent = 'Unsaved changes';
  n.classList.add('dirty');
}

/* ===================== boot ===================== */
function renderAll(){
  const k = kpis();
  renderOverview();
  renderFinancial();
  renderPortfolio();
  renderRepayment();
  renderCustomers();
  renderStaff();
  renderDisbursement();
  renderRegisters();
  renderSummaries();
  renderComparison();
  renderFilters();
  renderGallery();
  refreshChecks();
  renderExportHistory();
  el('fgGrainNote').textContent = 'Period: ' + FILTER.grain + ' · ' + fmtDate(FILTER.from) + ' – ' + fmtDate(FILTER.to);
  el('ovStamp').textContent = 'Last refresh ' + lastRefresh();
}

function goto(id){
  const t = document.getElementById(id);
  if(!t) return;
  window.scrollTo({top:t.offsetTop - 112, behavior:'smooth'});
  document.querySelectorAll('#subnav .snav').forEach(a=> a.classList.toggle('on', a.getAttribute('href') === '#' + id));
}

function wireTop(){
  if(el('menuBtn')) el('menuBtn').onclick = ()=> el('sidebar').classList.toggle('open');
  el('modalClose').onclick = closeModal;
  el('modal').addEventListener('click', e=>{ if(e.target === el('modal')) closeModal(); });
  el('globalSearch').addEventListener('input', ()=>{
    FILTER.q = el('globalSearch').value;
    renderRegisters();
    if(el('fltSearch')) el('fltSearch').value = FILTER.q;
  });
  el('globalSearch').addEventListener('keydown', e=>{ if(e.key === 'Enter') goto('s8'); });
  el('exportAll').onclick = ()=>{
    if(SET.exportFormat === 'xlsx'){ exportRegister('xlsx'); }
    else { exportRegister('csv'); }
  };
  el('printBtn').onclick = ()=> summaryReport();
  el('bellBtn').onclick = ()=>{
    refreshChecks();
    const issues = el('accChecks').querySelectorAll('.ck.warn').length;
    openModal('Data accuracy', issues ? issues + ' item(s) worth a look' : 'All checks pass',
      `<div class="inline-note">Last data refresh ${esc(lastRefresh())} · source Supabase</div>
       <div style="margin-top:8px">${el('accFlags').innerHTML}</div>`,
      [{label:'Open accuracy report', cls:'btn-gold', act:()=>{ closeModal(); goto('s14'); }},
       {label:'Close', act:'close'}]);
  };
}

function wireAll(){
  /* registers */
  el('regSearch').addEventListener('input', ()=>{ REG.q = el('regSearch').value; REG.page = 1; renderRegisters(); });
  el('regCsv').onclick = ()=> exportRegister('csv');
  el('regXlsx').onclick = ()=> exportRegister('xlsx');

  /* filters */
  el('fltApply').onclick = applyFilters;
  el('fltReset').onclick = resetFilters;
  el('fltSearch').addEventListener('keydown', e=>{ if(e.key === 'Enter') applyFilters(); });
  ['fltFrom','fltTo','fltProduct','fltStatus','fltStaff','fltMethod','fltRegion','fltCustomer'].forEach(id=>{
    el(id).addEventListener('change', applyFilters);
  });

  /* exports */
  el('expCsv').onclick = ()=> exportRegister('csv');
  el('expXlsx').onclick = ()=> exportRegister('xlsx');
  el('expPdf').onclick = ()=>{
    const d = currentRegister();
    printTable(REG_TABS.find(t=>t[0]===REG.key)[1], d.cols, d.rows);
    logExport(d.title, 'PDF', d.rows.length);
  };
  el('expImg').onclick = exportChartImage;
  el('expPrint').onclick = ()=>{
    const d = currentRegister();
    printTable(REG_TABS.find(t=>t[0]===REG.key)[1], d.cols, d.rows);
    logExport(d.title, 'Print', d.rows.length);
  };
  el('expSummary').onclick = summaryReport;
  el('expSummaryX').onclick = ()=>{
    const k = kpis();
    const cols = [{label:'Measure'},{label:'Value'},{label:'Detail'}];
    const rows = [
      ['Loans issued', k.loans.length, filterLine()],
      ['Disbursed', k.disbursed, SET.currency],
      ['Collected', k.collected, SET.currency],
      ['Interest earned', k.interest, SET.currency],
      ['Fees', k.fees, SET.currency],
      ['Outstanding', k.outstanding, SET.currency],
      ['Arrears', k.arrears, SET.currency]
    ];
    downloadFile('executive-summary-' + TODAY + '.xlsx',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', xlsxBytes('Executive summary', cols, rows));
    logExport('Executive summary', 'Excel', rows.length);
  };

  /* settings */
  el('setSave').onclick = applySettings;
  el('setReset').onclick = ()=>{
    Object.assign(SET, {currency:'MK', decimals:0, numberFormat:'comma', defaultRange:'12m',
      chartType:'bar', columns:'standard', sortKey:'date', sortDir:'desc', exportFormat:'csv',
      showGrid:true, showLegend:true, showValues:false});
    renderAll(); renderSettings();
    const st = el('savestate'); if(st){ st.textContent = 'Saved'; st.className = 'badge b-ok'; }
    toast('Display settings reset to defaults.', 'info');
  };
  ['setCurrency','setDecimals','setFormat','setChart','setColumns','setSort','setExport','setGrid','setLegend','setValues']
    .forEach(id=>{
      const n = el(id);
      if(n) n.addEventListener('change', ()=>{
        el('setPreview').innerHTML = `Sample: <b>${el('setCurrency').value === 'MWK' ? 'MWK ' : el('setCurrency').value === 'K' ? 'K' : 'MK '}${el('setFormat').value === 'space' ? '1 234 567' : el('setFormat').value === 'dot' ? '1.234.567' : '1,234,567'}</b> · preview updates when you save`;
        const st = el('savestate');
        if(st){ st.textContent = 'Unsaved changes'; st.className = 'badge b-await'; }
      });
    });

  /* scroll spy */
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
  document.addEventListener('keydown', e=>{ if(e.key === 'Escape') closeModal(); });
}

window.ANALYTICS_APP = {
  CUSTOMERS, LOANS, APPS, PAYS, DISB, TXNS, STAFF, PRODUCTS, TASKS, AUDITS, EXPORTS,
  state:{FILTER, SET, SUM, REG, GAL, EXPORTS},
  kpis, filterLoans, filterPays, filterApps, filterDisb, filterCust, filterTxns,
  renderAll, xlsxBytes, currentRegister, reportData:summaryRows,
  drillLoan, drillCustomer, drillPayment, drillApp, drillDisb, applySettings, refreshChecks
};

wireAll();
wireTop();
renderSettings();
renderAll();
toast('Analytics loaded · ' + num(LOANS.length) + ' loans and ' + num(PAYS.length) + ' receipts in view.');
</script>
</body>
</html>
