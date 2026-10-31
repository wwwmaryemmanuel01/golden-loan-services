/* ============================================================
   REPAYMENTS  (4/4) · reports (real CSV + .xlsx), notifications,
   audit, settings and application boot
   ============================================================ */

/* ===================== 15 · REPORTS ===================== */
const REPORTS = [
  {k:'daily', n:'Daily repayment report', c:'Repayments', p:'Today'},
  {k:'weekly', n:'Weekly repayment report', c:'Repayments', p:'This week'},
  {k:'monthly', n:'Monthly repayment report', c:'Repayments', p:'This month'},
  {k:'customer', n:'Customer repayment history', c:'Customers', p:'This month'},
  {k:'performance', n:'Loan repayment performance', c:'Portfolio', p:'This month'},
  {k:'outstanding', n:'Outstanding balance report', c:'Portfolio', p:'As at today'},
  {k:'arrears', n:'Arrears and delinquency report', c:'Risk', p:'As at today'},
  {k:'officers', n:'Collections officer performance', c:'Collections', p:'This month'},
  {k:'methods', n:'Payment method report', c:'Finance', p:'This month'},
  {k:'failed', n:'Failed and reversed payments', c:'Finance', p:'This month'},
  {k:'settlement', n:'Loan settlement report', c:'Settlements', p:'Year to date'},
  {k:'recon', n:'Reconciliation report', c:'Finance', p:'This week'}
];
let CURRENT_RPT = 'daily';
function reportData(key){
  const today = REPAYMENTS.filter(p=>p.date===TODAY);
  const week = REPAYMENTS.filter(p=>daysBetween(p.date, TODAY) <= 7 && p.date <= TODAY);
  const month = monthList();
  switch(key){
    case 'daily': return {
      title:'Daily repayment report', sub:'30 Oct 2026 · all channels',
      cols:[['Receipt',0],['Time',0],['Customer',0],['Loan',0],['Method',0],['Amount',1],['Status',0]],
      rows: today.map(p=>[p.receipt,p.time,p.cust,p.loan,p.method,p.amount,p.status]),
      sums:[5]
    };
    case 'weekly': return {
      title:'Weekly repayment report', sub:'24–30 Oct 2026',
      cols:[['Date',0],['Payments',1],['Cash',1],['Mobile money',1],['Bank / cheque',1],['Total',1],['Status',0]],
      rows: [...new Set(week.map(p=>p.date))].sort().reverse().map(d=>{
        const r = week.filter(p=>p.date===d);
        const cash = sum(r.filter(p=>p.method==='Cash'),p=>p.amount);
        const mob = sum(r.filter(p=>p.method.includes('Money')||p.method.includes('Mpamba')),p=>p.amount);
        const bank = sum(r.filter(p=>['Bank transfer','Cheque'].includes(p.method)),p=>p.amount);
        return [fmtShort(d), r.length, cash, mob, bank, sum(r,p=>p.amount), 'Reconciled'];
      }),
      sums:[1,2,3,4,5]
    };
    case 'monthly': return {
      title:'Monthly repayment report', sub:'October 2026',
      cols:[['Week',0],['Payments',1],['Collected',1],['Expected',1],['Variance',1],['Recovery %',0]],
      rows: [['Week 1 (1–7)',1,7],['Week 2 (8–14)',8,14],['Week 3 (15–21)',15,21],['Week 4 (22–30)',22,30]]
        .map(([label,a,b])=>{
          const r = month.filter(p=>{
            const day = Number(p.date.slice(8,10));
            return day>=a && day<=b && !['Rejected','Reversed'].includes(p.status);
          });
          const got = sum(r,p=>p.amount), exp = Math.round(EXPECTED_MONTH/4);
          return [label, r.length, got, exp, got-exp, Math.round(got/exp*100)+'%'];
        }),
      sums:[1,2,3,4]
    };
    case 'customer': return {
      title:'Customer repayment history', sub:'All customers · this month',
      cols:[['Customer',0],['Loan',0],['Payments',1],['Total paid',1],['Outstanding',1],['Last payment',0]],
      rows: LOANS.map(l=>{
        const r = month.filter(p=>p.loan===l.no && !['Rejected','Reversed'].includes(p.status));
        return [l.cust,l.no,r.length,sum(r,p=>p.amount),l.outstanding, r.length?fmtShort(r[0].date):'—'];
      }),
      sums:[2,3,4]
    };
    case 'performance': return {
      title:'Loan repayment performance', sub:'Paid against scheduled',
      cols:[['Loan',0],['Customer',0],['Instalments paid',0],['Paid',1],['Outstanding',1],['Performance',0]],
      rows: LOANS.map(l=>{
        const paid = l.term - Math.ceil(l.outstanding/l.inst);
        const pct = Math.round(paid/l.term*100);
        return [l.no,l.cust,paid+' / '+l.term, l.principal-l.outstanding, l.outstanding, pct+'%'];
      }),
      sums:[3,4]
    };
    case 'outstanding': return {
      title:'Outstanding balance report', sub:'As at 30 Oct 2026',
      cols:[['Loan',0],['Customer',0],['Product',0],['Principal',1],['Outstanding',1],['Arrears',1],['Status',0]],
      rows: LOANS.map(l=>[l.no,l.cust,l.product,l.principal,l.outstanding,overdueOf(l),l.status]),
      sums:[3,4,5]
    };
    case 'arrears': return {
      title:'Arrears and delinquency report', sub:'Overdue accounts only',
      cols:[['Customer',0],['Loan',0],['DPD',1],['Bucket',0],['Overdue',1],['Penalties',1],['Status',0]],
      rows: LOANS.filter(l=>l.dpd>0).sort((a,b)=>b.dpd-a.dpd)
        .map(l=>[l.cust,l.no,l.dpd,bucketOf(l.dpd),overdueOf(l),l.penalty,l.status]),
      sums:[2,4,5]
    };
    case 'officers': return {
      title:'Collections officer performance', sub:'Targets against collections',
      cols:[['Officer',0],['Branch',0],['Accounts',1],['Collected',1],['Target',1],['Success',0]],
      rows: OFFICERS.map(o=>[o.name,o.branch,o.accounts,o.collected,o.target,o.success+'%']),
      sums:[2,3,4]
    };
    case 'methods': return {
      title:'Payment method report', sub:'October 2026',
      cols:[['Method',0],['Payments',1],['Value',1],['Share',0],['Confirmed',1],['Pending',1]],
      rows: METHODS.map(m=>{
        const r = month.filter(p=>p.method===m && !['Rejected','Reversed'].includes(p.status));
        const v = sum(r,p=>p.amount);
        return [m,r.length,v, Math.round(v/(sum(month.filter(p=>!['Rejected','Reversed'].includes(p.status)),p=>p.amount)||1)*100)+'%',
          r.length - pendingList().filter(p=>p.method===m).length, pendingList().filter(p=>p.method===m).length];
      }),
      sums:[1,2,4,5]
    };
    case 'failed': return {
      title:'Failed and reversed payments report', sub:'October 2026',
      cols:[['Date',0],['Receipt',0],['Customer',0],['Method',0],['Amount',1],['Reason',0]],
      rows: REPAYMENTS.filter(p=>['Rejected','Reversed'].includes(p.status))
        .map(p=>[fmtShort(p.date),p.receipt,p.cust,p.method,p.amount,p.rejReason||'Reversed by supervisor']),
      sums:[4]
    };
    case 'settlement': return {
      title:'Loan settlement report', sub:'Year to date',
      cols:[['Date',0],['Customer',0],['Loan',0],['Settlement',1],['Discount',1],['Confirmed by',0],['Status',0]],
      rows: SETTLE_HIST.map(h=>[fmtShort(h[0]),h[1],h[2],h[3],h[4],h[5],h[6]]),
      sums:[3,4]
    };
    default: return {
      title:'Reconciliation report', sub:'Last five working days',
      cols:[['Date',0],['Recorded',1],['Confirmed',1],['Difference',1],['Adjustments',1],['Signed off by',0],['Status',0]],
      rows: RECON_HIST.map(h=>[fmtShort(h[0]),h[1],h[2],h[3],h[4],h[5],h[6]]),
      sums:[1,2,3,4]
    };
  }
}
function renderReports(){
  el('rptList').innerHTML = REPORTS.map(r=>`<tr>
    <td style="font-weight:700">${r.n}</td><td>${r.c}</td><td>${r.p}</td>
    <td style="font-size:10.5px;color:var(--muted)">30 Oct 2026</td>
    <td style="text-align:right"><button class="btn btn-ghost btn-sm" data-run="${r.k}"
      style="padding:2px 7px;font-size:10px">Run</button></td></tr>`).join('');
  el('rptList').querySelectorAll('[data-run]').forEach(b=>{
    b.onclick = ()=>{ CURRENT_RPT = b.dataset.run; renderReport(); gotoSec('s15'); };
  });
  el('rptCount').textContent = REPORTS.length + ' reports';
  renderReport();
}
function renderReport(){
  const d = reportData(CURRENT_RPT);
  el('rptTitle').textContent = d.title;
  el('rptSub').textContent = d.sub + ' · ' + el('rptPeriod').value;
  el('rptRows').textContent = d.rows.length + ' rows';
  el('rptHead').innerHTML = '<tr>' + d.cols.map(([c,num])=>
    `<th${num?' class="num"':''}>${c}</th>`).join('') + '</tr>';
  el('rptBody').innerHTML = d.rows.length ? d.rows.map(r=>'<tr>' + r.map((v,i)=>{
    const num = d.cols[i] && d.cols[i][1];
    return `<td${num?' class="num"':''}>${num ? (typeof v === 'number' ? nf(v) : v) : v}</td>`;
  }).join('') + '</tr>').join('') : `<tr><td colspan="${d.cols.length}" class="empty">No data for this period.</td></tr>`;

  el('rptTotals').innerHTML = (d.sums||[]).length ? '<div class="legend" style="margin-top:10px">' +
    d.sums.map(i=>`<b>${d.cols[i][0]}: ${mk(sum(d.rows, r=>Number(r[i])||0))}</b>`).join('') + '</div>' : '';

  el('rptExportCfg').innerHTML = `
    <div class="setrow"><div><div class="sk">Report</div><div class="ss">Selected in the catalogue</div></div>
      <div class="sv"><span class="val-tag" style="font-size:10px">${d.title}</span></div></div>
    <div class="setrow"><div><div class="sk">Rows</div><div class="ss">Computed from the live register</div></div>
      <div class="sv"><span class="val-tag">${d.rows.length}</span></div></div>
    <div class="setrow"><div><div class="sk">Currency</div><div class="ss">MWK · 2 decimals</div></div>
      <div class="sv"><span class="val-tag">MWK</span></div></div>`;
}
function reportRows(){
  const d = reportData(CURRENT_RPT);
  return {d, csv: [d.cols.map(c=>c[0])].concat(d.rows.map(r=>r.map(v=>typeof v==='number'?v:String(v))))
    .map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n')};
}
function exportReport(kind){
  const {d, csv} = reportRows();
  const base = d.title.toLowerCase().replace(/[^a-z0-9]+/g,'-');
  if(kind === 'csv'){
    downloadFile(base+'.csv','text/csv;charset=utf-8','\ufeff'+csv);
  } else if(kind === 'xlsx'){
    try{
      buildXlsx(base+'.xlsx', d);
    }catch(e){
      downloadFile(base+'.csv','text/csv;charset=utf-8','\ufeff'+csv);
    }
  } else {
    doPrint(d.title);
  }
  logPay('Access','Report exported: '+d.title,'report.'+CURRENT_RPT,0);
}

/* ---- minimal, dependency-free .xlsx writer (stored zip + inline strings) ---- */
const CRC_TABLE = (()=>{
  const t = new Uint32Array(256);
  for(let n=0;n<256;n++){
    let c = n;
    for(let k=0;k<8;k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(bytes){
  let c = 0xFFFFFFFF;
  for(let i=0;i<bytes.length;i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}
function utf8(str){
  const out = [];
  for(let i=0;i<str.length;i++){
    let c = str.charCodeAt(i);
    if(c < 0x80) out.push(c);
    else if(c < 0x800){ out.push(0xC0 | (c >> 6), 0x80 | (c & 63)); }
    else if(c < 0xD800 || c >= 0xE000){ out.push(0xE0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63)); }
    else { i++; const c2 = str.charCodeAt(i);
      const cp = 0x10000 + ((c - 0xD800) << 10) + (c2 - 0xDC00);
      out.push(0xF0 | (cp >> 18), 0x80 | ((cp >> 12) & 63), 0x80 | ((cp >> 6) & 63), 0x80 | (cp & 63)); }
  }
  return new Uint8Array(out);
}
function zipStore(files){
  const chunks = [], central = [];
  let offset = 0;
  files.forEach(f=>{
    const name = utf8(f.name), data = f.data, crc = crc32(data);
    const lh = new Uint8Array(30 + name.length);
    const dv = new DataView(lh.buffer);
    dv.setUint32(0, 0x04034b50, true); dv.setUint16(4, 20, true); dv.setUint16(6, 0, true);
    dv.setUint16(8, 0, true); dv.setUint16(10, 0, true); dv.setUint16(12, 0, true);
    dv.setUint32(14, crc, true); dv.setUint32(18, data.length, true); dv.setUint32(22, data.length, true);
    dv.setUint16(26, name.length, true); dv.setUint16(28, 0, true);
    lh.set(name, 30);
    chunks.push(lh, data);
    const ch = new Uint8Array(46 + name.length);
    const cv = new DataView(ch.buffer);
    cv.setUint32(0, 0x02014b50, true); cv.setUint16(4, 20, true); cv.setUint16(6, 20, true);
    cv.setUint16(8, 0, true); cv.setUint16(10, 0, true); cv.setUint16(12, 0, true); cv.setUint16(14, 0, true);
    cv.setUint32(16, crc, true); cv.setUint32(20, data.length, true); cv.setUint32(24, data.length, true);
    cv.setUint16(28, name.length, true); cv.setUint32(42, offset, true);
    ch.set(name, 46);
    central.push(ch);
    offset += lh.length + data.length;
  });
  const cdSize = central.reduce((s,c)=>s+c.length,0);
  const end = new Uint8Array(22); const ev = new DataView(end.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(8, files.length, true); ev.setUint16(10, files.length, true);
  ev.setUint32(12, cdSize, true); ev.setUint32(16, offset, true);
  const parts = [...chunks, ...central, end];
  const total = parts.reduce((s,p)=>s+p.length,0);
  const out = new Uint8Array(total);
  let pos = 0;
  parts.forEach(p=>{ out.set(p, pos); pos += p.length; });
  return out;
}
function colName(i){ let s=''; i++; while(i>0){ const m=(i-1)%26; s=String.fromCharCode(65+m)+s; i=Math.floor((i-1)/26); } return s; }
function sheetXml(d){
  const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  let rows = '';
  const all = [d.cols.map(c=>c[0])].concat(d.rows);
  all.forEach((row, ri)=>{
    let cells = '';
    row.forEach((v, ci)=>{
      const ref = colName(ci) + (ri+1);
      if(typeof v === 'number') cells += `<c r="${ref}"><v>${v}</v></c>`;
      else cells += `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${esc(v)}</t></is></c>`;
    });
    rows += `<row r="${ri+1}">${cells}</row>`;
  });
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<sheetData>${rows}</sheetData></worksheet>`;
}
function buildXlsx(name, d){
  const sheetName = d.title.replace(/[\\\/\?\*\[\]:]/g,' ').slice(0,28) || 'Report';
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
<sheets><sheet name="${sheetName.replace(/&/g,'&amp;').replace(/"/g,'&quot;')}" sheetId="1" r:id="rId1"/></sheets></workbook>`)},
    {name:'xl/_rels/workbook.xml.rels', data:utf8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
</Relationships>`)},
    {name:'xl/worksheets/sheet1.xml', data:utf8(sheetXml(d))}
  ];
  const bytes = zipStore(files);
  if(window.self !== window.top){
    openModal('Excel export ready', name + ' · ' + d.rows.length + ' rows', `
      <div class="note gold"><div>A genuine .xlsx workbook was built in the browser
        (${(bytes.length/1024).toFixed(1)} KB), but downloads are blocked inside this embedded preview frame.
        Open the portal in its own tab to save it, or use CSV below.</div></div>`,
      [{label:'Close', act:'close'}]);
    return;
  }
  const blob = new Blob([bytes], {type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(a.href), 2000);
  toast(`Exported ${name} · ${d.rows.length} rows.`);
}

/* ===================== 16 · NOTIFICATIONS ===================== */
const MSGS = [
  ['08:05','Chisomo Kachale','Reminder','SMS','Delivered'],
  ['08:05','Tadala Msonthi','Reminder','SMS','Delivered'],
  ['08:05','Memory Phiri','Overdue','SMS','Failed'],
  ['07:58','Agnes Chikopa','Confirmation','SMS','Delivered'],
  ['07:40','Joseph Kalua','Reminder','Email','Delivered'],
  ['07:12','Blessings Tembo','Follow-up','SMS','Delivered'],
  ['06:45','Grace Mvula','Overdue','Email','Delivered'],
  ['06:20','Fatsani Gondwe','Overdue','SMS','Delivered'],
  ['05:50','Linda Mhango','Reminder','SMS','Delivered'],
  ['05:12','Peter Chirwa','Failed payment','SMS','Failed']
];
function renderNotifications(){
  el('remCfg').innerHTML = [
    [['remDays','Reminder before due date','Days ahead of the instalment date'],'num'],
    [['remTime','Send time','Local time (CAT)'],'time'],
    [['remRepeat','Repeat after due date',''],'repeat'],
    [['remOverdue','Overdue reminder','First alert after the due date'],'num'],
    [['remChannels','Channels','Where the customer is contacted'],'channels']
  ].map(([meta,type])=>{
    const [k,label,sub] = meta;
    let ctrl;
    if(type==='num') ctrl = `<input type="number" data-set="${k}" value="${SET[k]}" style="width:72px"> <span style="font-size:10px;color:var(--muted)">days</span>`;
    else if(type==='time') ctrl = `<select data-set="${k}">${['07:00','08:00','09:00','12:00','17:00'].map(t=>`<option${SET[k]===t?' selected':''}>${t}</option>`).join('')}</select>`;
    else if(type==='repeat') ctrl = `<select data-set="${k}">${['Once only','Every 3 days','Every 7 days','Daily'].map(t=>`<option${SET[k]===t?' selected':''}>${t}</option>`).join('')}</select>`;
    else ctrl = `<select data-set="${k}">${['SMS only','SMS + Email','Email only'].map(t=>`<option${SET[k]===t?' selected':''}>${t}</option>`).join('')}</select>`;
    return `<div class="setrow"><div><div class="sk">${label}</div>${sub?`<div class="ss">${sub}</div>`:''}</div>
      <div class="sv">${ctrl}</div></div>`;
  }).join('') + `
    <div class="minihead" style="margin-top:10px">Collection follow-ups</div>
    <div class="setrow"><div><div class="sk">Follow-up reminder to officer</div>
      <div class="ss">Sent the morning a task is due</div></div>
      <div class="sv"><button class="toggle on" data-toggle="fuRemind" aria-checked="1"></button></div></div>
    <div class="setrow"><div><div class="sk">Promised date reminder</div>
      <div class="ss">SMS two days before and on the day</div></div>
      <div class="sv"><button class="toggle on" data-toggle="promiseRemind" aria-checked="1"></button></div></div>`;

  const rows = MSGS.filter(m=>!MSG_FILTER || m[2]===MSG_FILTER);
  el('msgBody').innerHTML = rows.map(m=>`<tr>
    <td style="font-variant-numeric:tabular-nums">${m[0]}</td><td>${m[1]}</td>
    <td>${m[2]}</td><td>${m[3]}</td>
    <td><span class="chip ${m[4]==='Delivered'?'st-ok':'st-fail'}">${m[4]}</span></td>
    <td style="text-align:right"><button class="btn btn-ghost btn-sm" data-msg="${m[0]}" data-cust="${m[1]}"
      style="padding:2px 7px;font-size:10px">Resend</button></td></tr>`).join('')
    || '<tr><td colspan="6" class="empty">No messages in this view.</td></tr>';
  el('msgBody').querySelectorAll('[data-msg]').forEach(b=>{
    b.onclick = ()=>{
      const m = MSGS.find(x=>x[0]===b.dataset.msg && x[1]===b.dataset.cust);
      if(m){ m[4]='Delivered'; renderNotifications(); }
      toast(`Message resent to ${b.dataset.cust}.`);
      logPay('Verification','Notification resent to '+b.dataset.cust,'msg',0);
    };
  });

  el('msgStats').innerHTML = [
    ['Sent today', String(MSGS.length), 'reminders, confirmations, overdue', ''],
    ['Delivered', String(MSGS.filter(m=>m[4]==='Delivered').length), Math.round(MSGS.filter(m=>m[4]==='Delivered').length/MSGS.length*100)+'% delivery rate', 'gold'],
    ['Failed', String(MSGS.filter(m=>m[4]==='Failed').length), 'retry queued', 'red'],
    ['SMS credit', '48,250', 'about 32 days remaining', '']
  ].map(([t,v,s,cls])=>`<div class="kpi ${cls}"><div class="kl">${t}</div><div class="kv">${v}</div>
    <div class="ks">${s}</div></div>`).join('');
}
let MSG_FILTER = '';

/* ===================== 17 · AUDIT ===================== */
const AUD = {cat:'', q:'', page:1, per:12};
function audFiltered(){
  const q = AUD.q.trim().toLowerCase();
  return AUDIT.filter(a=>(!AUD.cat || a.cat===AUD.cat) &&
    (!q || (a.action+' '+a.record+' '+a.actor).toLowerCase().includes(q)));
}
function renderAudit(){
  const rows = audFiltered();
  const pages = Math.max(1, Math.ceil(rows.length/AUD.per));
  if(AUD.page > pages) AUD.page = pages;
  const slice = rows.slice((AUD.page-1)*AUD.per, AUD.page*AUD.per);
  el('audBody').innerHTML = slice.map(a=>`<tr>
    <td style="white-space:nowrap;font-variant-numeric:tabular-nums">${a.time}</td>
    <td><span class="badge ${a.cat==='Verification'?'b-ok':a.cat==='Reversal'?'b-rej':a.cat==='Correction'?'b-await':'b-draft'}">${a.cat}</span></td>
    <td style="font-weight:600;white-space:nowrap">${a.actor}</td>
    <td class="msg">${a.action}</td>
    <td style="font-family:ui-monospace,monospace;font-size:10px;color:var(--muted)">${a.record}</td>
    <td class="num">${a.amount?nf(a.amount):'—'}</td>
    <td style="font-size:10.5px">${a.ip}</td>
    <td><span class="chip ${a.result==='Success'?'st-ok':a.result==='Warning'?'st-await':'st-fail'}">${a.result}</span></td></tr>`).join('')
    || '<tr><td colspan="8" class="empty">No audit entries match.</td></tr>';
  el('audPager').innerHTML = `<span>Showing ${rows.length?((AUD.page-1)*AUD.per+1):0}–${Math.min(AUD.page*AUD.per,rows.length)} of ${rows.length}</span>
    <button id="audPrev" ${AUD.page===1?'disabled':''}>‹ Prev</button>
    <button id="audNext" ${AUD.page===pages?'disabled':''}>Next ›</button>`;
  if(el('audPrev')) el('audPrev').onclick = ()=>{ AUD.page--; renderAudit(); };
  if(el('audNext')) el('audNext').onclick = ()=>{ AUD.page++; renderAudit(); };

  const SUSP = [
    ['Repeated reversals by one cashier','Memory Phiri · 3 reversals in 7 days','High'],
    ['Round-number payments above MK 500,000','2 cash payments · same branch, same day','Medium'],
    ['Backdated entries','RCP-000503 recorded 2 days after the payment date','Medium'],
    ['Login outside working hours','Fatsani Gondwe · 03:12 · Kasungu','Low']
  ];
  el('suspCount').textContent = SUSP.length;
  el('suspList').innerHTML = SUSP.map(([t,s,lvl])=>`<div class="lrow">
    <div class="lic" style="background:${lvl==='High'?'#FDEDEC':'#FFF4E0'};color:${lvl==='High'?'#B32C2C':'#9A6A0D'}">!</div>
    <div><div class="lt">${t}</div><div class="ls">${s}</div></div>
    <div class="lr"><span class="mini-tag ${lvl==='High'?'r':'a'}">${lvl}</span></div></div>`).join('');

  el('apprHist').innerHTML = [
    ['09:20','Reversal REV-221','Pending','—','Awaiting supervisor'],
    ['08:55','Settlement LN-2026-0425','Approved','Chikondi Mwale','Customer paying off early'],
    ['08:10','Correction RCP-000498','Approved','Chikondi Mwale','Allocation applied to the wrong instalment'],
    ['Yesterday','Reversal RCP-000492','Approved','Chikondi Mwale','Duplicate payment']
  ].map(a=>`<tr><td style="white-space:nowrap;font-size:10.5px">${a[0]}</td><td>${a[1]}</td>
    <td><span class="chip ${a[2]==='Approved'?'st-ok':'st-await'}">${a[2]}</span></td>
    <td style="font-size:10px">${a[3]}</td><td style="font-size:10px;color:var(--muted)">${a[4]}</td></tr>`).join('');

  el('userActivity').innerHTML = ['Memory Phiri','Thandiwe Kamanga','Fatsani Gondwe','Esther Mwale'].map((n,i)=>{
    const acts = AUDIT.filter(a=>a.actor===n).length;
    return `<div class="lrow"><div class="lic">${initials(n)}</div>
      <div><div class="lt">${n}</div><div class="ls">${acts} actions today · last ${['09:12','09:20','08:41','07:58'][i]}</div></div>
      <div class="lr"><span class="mini-tag">${['Cashier','Verifier','Cashier','Support'][i]}</span></div></div>`;
  }).join('');
}

/* ===================== 18 · SETTINGS ===================== */
const SET = {
  mCash:true, mBank:true, mAirtel:true, mMpamba:true, mCheque:false,
  defaultMethod:'Cash',
  refRequired:true, refMin:6, refDupCheck:true,
  allocOrder:'Penalty → Fees → Interest → Principal',
  partialAllow:true, partialMin:25, excessTo:'Next instalment',
  penType:'% of instalment', penValue:5, penGrace:5, penCap:20,
  receiptPrefix:'RCP', receiptPad:6, receiptReset:'Never', receiptBranch:'BLT',
  verifyCash:false, verifyNonCash:true, verifyAbove:500000,
  reversalLevel:'Supervisor', reversalLimit:200000, reversalDual:1000000,
  earlyDiscount:2, earlyNotice:7, earlyFee:0, earlyAllow:true,
  remDays:3, remTime:'08:00', remRepeat:'Every 3 days', remOverdue:1, remChannels:'SMS + Email',
  fuRemind:true, promiseRemind:true,
  escAfter:7, escTo:'Credit committee', escAuto:true
};
const SET_SNAP = Object.assign({}, SET);
let SET_DIRTY = new Set();
function setPill(){
  const p = el('setState');
  if(!p) return;
  p.className = 'savestate ' + (SET_DIRTY.size ? 'dirty' : 'saved');
  p.textContent = SET_DIRTY.size ? SET_DIRTY.size + ' unsaved' : 'Saved';
}
function renderSettings(){
  const tg = (k)=>`<button class="toggle${SET[k]?' on':''}" data-toggle="${k}" aria-checked="${SET[k]?1:0}"></button>`;
  const sel = (k,opts)=>`<select data-set="${k}">${opts.map(o=>`<option${SET[k]===o?' selected':''}>${o}</option>`).join('')}</select>`;
  const num = (k,unitTxt)=>`<input type="number" data-set="${k}" value="${SET[k]}" style="width:78px"> <span style="font-size:10px;color:var(--muted)">${unitTxt||''}</span>`;

  el('setMethods').innerHTML = [
    ['mCash','Cash payments','Counter receipts'],['mBank','Bank transfers','NBM, Standard, FDH'],
    ['mAirtel','Airtel Money','Mobile money'],['mMpamba','TNM Mpamba','Mobile money'],
    ['mCheque','Cheque payments','Requires clearing before allocation']
  ].map(([k,n,s])=>`<div class="setrow"><div><div class="sk">${n}</div><div class="ss">${s}</div></div>
    <div class="sv">${tg(k)}</div></div>`).join('') +
    `<div class="setrow"><div><div class="sk">Default payment method</div><div class="ss">Pre-selected at the counter</div></div>
      <div class="sv">${sel('defaultMethod',['Cash','Bank transfer','Airtel Money','TNM Mpamba'])}</div></div>`;

  el('setRefs').innerHTML = [
    `<div class="setrow"><div><div class="sk">Reference required</div><div class="ss">For every non-cash payment</div></div>
      <div class="sv">${tg('refRequired')}</div></div>`,
    `<div class="setrow"><div><div class="sk">Minimum reference length</div><div class="ss">Characters</div></div>
      <div class="sv">${num('refMin')}</div></div>`,
    `<div class="setrow"><div><div class="sk">Check for duplicate references</div><div class="ss">Block a reference already used</div></div>
      <div class="sv">${tg('refDupCheck')}</div></div>`
  ].join('');

  el('setAlloc').innerHTML = [
    `<div class="setrow"><div><div class="sk">Allocation order</div><div class="ss">Applied to every repayment</div></div>
      <div class="sv"><span class="val-tag" style="font-size:9.5px">${SET.allocOrder}</span></div></div>`,
    `<div class="setrow"><div><div class="sk">Allow partial payments</div><div class="ss">Accept less than the instalment</div></div>
      <div class="sv">${tg('partialAllow')}</div></div>`,
    `<div class="setrow"><div><div class="sk">Minimum partial payment</div><div class="ss">Of the amount due</div></div>
      <div class="sv">${num('partialMin','%')}</div></div>`,
    `<div class="setrow"><div><div class="sk">Excess payments go to</div><div class="ss">Overpayment handling</div></div>
      <div class="sv">${sel('excessTo',['Next instalment','Customer credit','Refund'])}</div></div>`
  ].join('');

  el('setPenalty').innerHTML = [
    `<div class="setrow"><div><div class="sk">Penalty type</div><div class="ss">Late payment charge</div></div>
      <div class="sv">${sel('penType',['% of instalment','Flat amount','Daily rate'])}</div></div>`,
    `<div class="setrow"><div><div class="sk">Penalty value</div><div class="ss">Applied after the grace period</div></div>
      <div class="sv">${num('penValue','%')}</div></div>`,
    `<div class="setrow"><div><div class="sk">Grace period</div><div class="ss">Before a penalty applies</div></div>
      <div class="sv">${num('penGrace','days')}</div></div>`,
    `<div class="setrow"><div><div class="sk">Penalty cap</div><div class="ss">Of the instalment</div></div>
      <div class="sv">${num('penCap','%')}</div></div>`
  ].join('');

  el('setReceipt').innerHTML = [
    `<div class="setrow"><div><div class="sk">Receipt prefix</div><div class="ss">Before the sequence</div></div>
      <div class="sv"><input type="text" data-set="receiptPrefix" value="${SET.receiptPrefix}" style="width:76px"></div></div>`,
    `<div class="setrow"><div><div class="sk">Digits in sequence</div><div class="ss">Zero padded</div></div>
      <div class="sv">${num('receiptPad')}</div></div>`,
    `<div class="setrow"><div><div class="sk">Sequence resets</div><div class="ss">Start a fresh series</div></div>
      <div class="sv">${sel('receiptReset',['Never','Each year','Each month'])}</div></div>`,
    `<div class="setrow"><div><div class="sk">Verification — cash</div><div class="ss">Require a second check</div></div>
      <div class="sv">${tg('verifyCash')}</div></div>`,
    `<div class="setrow"><div><div class="sk">Verification — non-cash</div><div class="ss">Match the channel statement</div></div>
      <div class="sv">${tg('verifyNonCash')}</div></div>`,
    `<div class="setrow"><div><div class="sk">Mandatory above</div><div class="ss">Evidence threshold</div></div>
      <div class="sv">${num('verifyAbove')}</div></div>`
  ].join('');

  el('setEarly').innerHTML = [
    `<div class="setrow"><div><div class="sk">Allow early settlement</div><div class="ss">Pay off before maturity</div></div>
      <div class="sv">${tg('earlyAllow')}</div></div>`,
    `<div class="setrow"><div><div class="sk">Settlement discount</div><div class="ss">Of remaining interest</div></div>
      <div class="sv">${num('earlyDiscount','%')}</div></div>`,
    `<div class="setrow"><div><div class="sk">Notice period</div><div class="ss">Days</div></div>
      <div class="sv">${num('earlyNotice','days')}</div></div>`
  ].join('');

  el('setRemind').innerHTML = [
    `<div class="setrow"><div><div class="sk">Reminder before due date</div></div>
      <div class="sv">${num('remDays','days')}</div></div>`,
    `<div class="setrow"><div><div class="sk">Escalate after</div><div class="ss">Days past due</div></div>
      <div class="sv">${num('escAfter','days')}</div></div>`,
    `<div class="setrow"><div><div class="sk">Escalate to</div></div>
      <div class="sv">${sel('escTo',['Credit committee','Branch supervisor','Legal'])}</div></div>`,
    `<div class="setrow"><div><div class="sk">Automatic escalation</div><div class="ss">No manual trigger needed</div></div>
      <div class="sv">${tg('escAuto')}</div></div>`
  ].join('');

  el('setReverse').innerHTML = [
    `<div class="setrow"><div><div class="sk">Reversal approval level</div></div>
      <div class="sv">${sel('reversalLevel',['Supervisor','Administrator','Credit committee'])}</div></div>`,
    `<div class="setrow"><div><div class="sk">Maximum single reversal</div><div class="ss">Beyond this, dual approval</div></div>
      <div class="sv">${num('reversalLimit')}</div></div>`,
    `<div class="setrow"><div><div class="sk">Dual approval above</div></div>
      <div class="sv">${num('reversalDual')}</div></div>`,
    `<div class="setrow"><div><div class="sk">Keep original records</div><div class="ss">Always on — reversals never delete</div></div>
      <div class="sv"><span class="mini-tag g">Enforced</span></div></div>`
  ].join('');
  setPill();
}
function bindSettings(){
  document.addEventListener('click', e=>{
    const t = e.target.closest('[data-toggle]');
    if(!t) return;
    const k = t.dataset.toggle;
    SET[k] = !SET[k];
    t.classList.toggle('on', SET[k]);
    t.setAttribute('aria-checked', SET[k]?1:0);
    SET_DIRTY.add(k); setPill(); renderNotifications();
  });
  document.addEventListener('change', e=>{
    const f = e.target.closest('[data-set]');
    if(!f) return;
    SET[f.dataset.set] = f.type === 'number' ? Number(f.value) : f.value;
    SET_DIRTY.add(f.dataset.set); setPill();
  });
}
function saveSettings(){
  if(!SET_DIRTY.size){ toast('No settings have changed.','info'); return; }
  const n = SET_DIRTY.size;
  Object.keys(SET).forEach(k=>{ SET_SNAP[k] = SET[k]; });
  SET_DIRTY = new Set();
  setPill();
  toast(`${n} setting${n>1?'s':''} saved.`);
  logPay('Correction', `Repayment settings updated (${n} changes)`, 'settings', 0);
}
function discardSettings(){
  if(!SET_DIRTY.size){ toast('Nothing to discard.','info'); return; }
  Object.keys(SET).forEach(k=>{ SET[k] = SET_SNAP[k]; });
  SET_DIRTY = new Set();
  setPill(); renderNotifications(); renderSettings();
  toast('Changes discarded.','info');
}

/* ===================== BOOT ===================== */
function renderAll(){
  renderOverview();
  renderRecord();
  renderRegister();
  renderVerMethods(); renderVerQueue(); renderVerHistory();
  renderUnalloc();
  renderSchedules();
  renderCollections();
  renderArrears();
  renderMethods();
  renderReceipts();
  renderSettlements();
  renderReversals();
  renderOfficers();
  renderRecon();
  renderReports();
  renderAudit();
}

const on = (id, ev, fn)=>{ const n = el(id); if(n) n.addEventListener(ev, fn); };

function boot(){
  /* topbar */
  on('menuBtn','click', ()=>el('sidebar').classList.toggle('open'));
  on('recordBtn','click', ()=>{ gotoSec('s2'); el('rcSearch').focus(); });
  on('recordBtn2','click', ()=>{ gotoSec('s2'); el('rcSearch').focus(); });
  on('reconBtn','click', ()=>{ gotoSec('s14'); });
  on('exportAll','click', ()=>{
    downloadFile('repayment-register.csv','text/csv;charset=utf-8','\ufeff' +
      ['Receipt,Date,Customer,Loan,Amount,Method,Reference,Status']
        .concat(REPAYMENTS.map(p=>[p.receipt,p.date,p.cust,p.loan,p.amount,p.method,p.ref||'',p.status]
          .map(v=>`"${v}"`).join(','))).join('\n'));
    logPay('Access','Repayment register exported','register',0);
  });
  on('bellBtn','click', ()=>{
    const pend = pendingList();
    openModal('Pending verification', pend.length+' payments · '+mk(sum(pend,p=>p.amount)), `
      ${pend.slice(0,6).map(p=>`<div class="lrow"><div class="lic">${p.receipt.slice(-3)}</div>
        <div><div class="lt">${p.cust} · ${mk(p.amount)}</div><div class="ls">${p.method} · ${p.ref||'no reference'}</div></div>
        <div class="lr"><span class="chip st-await">Pending</span></div></div>`).join('') || '<div class="empty">Nothing pending.</div>'}`,
      [{label:'Close', act:'close'}, {label:'Open verification', cls:'btn-gold', act:()=>{ closeModal(); gotoSec('s4'); }}]);
  });
  on('globalSearch','input', e=>{
    const q = e.target.value.trim();
    if(q.length < 2) return;
    REG.q = q; REG.page = 1;
    renderRegister();
  });

  /* section 1 */
  on('ovOpenRegister','click', ()=>gotoSec('s3'));

  /* section 2 */
  on('rcSearch','input', rcSearchLoans);
  on('rcLoan','change', e=>{ if(e.target.value) selectLoan(e.target.value); });
  on('rcAmount','input', ()=>{ renderRcAlloc(); });
  on('rcAmount','change', ()=>{ renderRcAlloc(); });
  on('rcEvidence','click', addEvidence);
  on('rcSubmit','click', ()=>submitRepayment(false));
  on('rcVerifyNow','click', ()=>submitRepayment(true));
  on('rcClear','click', ()=>{
    RC.loan=null; RC.evidence=[];
    el('rcLoan').value=''; el('rcAmount').value=''; el('rcRef').value=''; el('rcNotes').value='';
    el('rcEvidenceList').innerHTML=''; el('rcResults').innerHTML='';
    renderRcLoan(); toast('Form cleared.','info');
  });

  /* section 3 */
  on('regSearchBy','change', e=>{ REG.by = e.target.value; REG.page=1; renderRegister(); });
  on('regSearch','input', e=>{ REG.q = e.target.value; REG.page=1; renderRegister(); });
  on('regFrom','change', e=>{ REG.from = e.target.value; REG.page=1; renderRegister(); });
  on('regTo','change', e=>{ REG.to = e.target.value; REG.page=1; renderRegister(); });
  on('regMethod','change', e=>{ REG.method = e.target.value; REG.page=1; renderRegister(); });
  on('regStatus','change', e=>{ REG.status = e.target.value; REG.page=1; renderRegister(); });
  on('regExport','click', ()=>{
    const rows = regFiltered();
    downloadFile('repayments.csv','text/csv;charset=utf-8','\ufeff' +
      ['Receipt,Date,Customer,Loan,Amount,Method,Reference,Status']
        .concat(rows.map(p=>[p.receipt,p.date,p.cust,p.loan,p.amount,p.method,p.ref||'',p.status]
          .map(v=>`"${v}"`).join(','))).join('\n'));
    logPay('Access','Register exported ('+rows.length+' rows)','register',0);
  });
  on('regPrint','click', ()=>doPrint('Repayment register'));

  /* section 4 */
  on('verAll','click', ()=>{
    const ready = pendingList().filter(p=>p.method==='Cash' || p.ref);
    if(!ready.length){ toast('Nothing can be auto-verified.','info'); return; }
    ready.forEach(p=>{ p.status='Verified'; p.verifiedBy='Thandiwe Kamanga';
      p.verifiedAt = TODAY+' · '+nowTime(); });
    logPay('Verification', ready.length+' payments verified in bulk','register', sum(ready,p=>p.amount));
    toast(ready.length+' payments verified.','ok');
    renderAll();
  });

  /* section 5 */
  ['allocPen','allocFees','allocInt','allocPrin'].forEach(id=>on(id,'input', renderAllocSummary));
  on('allocAuto','click', ()=>{ const p = REPAYMENTS.find(x=>x.id===ALLOC.sel);
    if(!p){ toast('Select a payment first.','err'); return; } autoFillAlloc(p); renderAllocSummary();
    toast('Allocation filled using the configured order.','info'); });
  on('allocApply','click', applyAllocation);
  on('allocReset','click', ()=>{ const p = REPAYMENTS.find(x=>x.id===ALLOC.sel);
    if(p){ autoFillAlloc(p); renderAllocSummary(); } });
  on('allocCorrect','click', correctAllocModal);

  /* section 6 */
  on('schedLoan','change', e=>{ SCHED.loan = e.target.value; renderSchedules(); });
  el('schedTabs').querySelectorAll('button').forEach(b=>{
    b.onclick = ()=>{
      el('schedTabs').querySelectorAll('button').forEach(x=>x.classList.remove('on'));
      b.classList.add('on'); SCHED.tab = b.dataset.tab; renderSchedules();
    };
  });
  on('schedRegen','click', ()=>{
    openModal('Generate / update schedule', SCHED.loan, `
      <div class="note red"><div>Recalculating rewrites every unpaid instalment from the current principal and
        rate. Paid instalments are preserved. This requires supervisor authorization.</div></div>
      <div class="fg" style="margin-top:10px"><label>Recalculate from</label>
        <select id="regenFrom"><option>Next instalment</option><option>First instalment</option></select></div>
      <div class="fg" style="margin-top:9px"><label>Authorized by</label>
        <input id="regenAuth" value="Chikondi Mwale"></div>`,
      [{label:'Cancel', act:'close'}, {label:'Regenerate', cls:'btn-gold', act:()=>{
        closeModal(); renderSchedules();
        toast(`Schedule for ${SCHED.loan} recalculated · authorized by ${el('regenAuth').value}.`);
        logPay('Correction','Schedule regenerated · '+SCHED.loan,'schedule.'+SCHED.loan,0);
      }}]);
  });
  on('schedPrint','click', ()=>doPrint('Repayment schedule'));

  /* section 7 */
  on('colTaskFilter','change', e=>{ COL.taskFilter = e.target.value; renderCollections(); });
  on('colAssign','click', assignModal);
  on('colNewTask','click', ()=>followUpModal(LOANS.filter(l=>l.dpd>0)[0]));
  on('colPromiseAdd','click', ()=>{
    openModal('Record a collection promise', 'Customer commitment to pay', `
      <div class="fg"><label>Customer</label><select id="prLoan">
        ${LOANS.filter(l=>l.dpd>0).map(l=>`<option value="${l.no}">${l.cust} · ${mk(overdueOf(l))} overdue</option>`).join('')}</select></div>
      <div class="form-grid" style="margin-top:9px">
        <div class="fg"><label>Promised amount</label><input id="prAmt" type="number" value="45000"></div>
        <div class="fg"><label>Promised date</label><input id="prDate" type="date" value="2026-11-04"></div>
      </div>
      <div class="fg" style="margin-top:9px"><label>Notes</label>
        <textarea id="prNote" style="min-height:46px" placeholder="What the customer committed to"></textarea></div>`,
      [{label:'Cancel', act:'close'}, {label:'Record promise', cls:'btn-gold', act:()=>{
        const l = loanBy(el('prLoan').value);
        PROMISES.unshift({cust:l.cust, loan:l.no, amount:Number(el('prAmt').value),
          date:el('prDate').value, status:'Pending'});
        closeModal(); renderCollections();
        toast(`Promise recorded for ${l.cust}.`);
        logPay('Access','Collection promise recorded · '+l.no,'promise',Number(el('prAmt').value));
      }}]);
  });

  /* section 8 */
  on('arFilter','change', e=>{ AR.filter = e.target.value; renderArrears(); });
  on('arExport','click', ()=>{
    downloadFile('arrears-ageing.csv','text/csv;charset=utf-8','\ufeff' +
      ['Customer,Loan,Outstanding,Overdue,DPD,Bucket,Status,Penalties,Officer']
        .concat(LOANS.filter(l=>l.dpd>0).map(l=>[l.cust,l.no,l.outstanding,overdueOf(l),l.dpd,
          bucketOf(l.dpd),l.status,l.penalty,l.officer].map(v=>`"${v}"`).join(','))).join('\n'));
    logPay('Access','Arrears ageing exported','arrears',0);
  });

  /* section 9 */
  on('mthFilter','change', e=>{ MTH.filter = e.target.value; renderMethods(); });
  on('dupCheck','click', duplicateCheck);

  /* section 10 */
  on('rcptSearch','input', renderReceipts);
  on('rcptStatus','change', renderReceipts);
  on('rcptExport','click', ()=>{
    downloadFile('receipts.csv','text/csv;charset=utf-8','\ufeff' +
      ['Receipt,Date,Customer,Loan,Amount,Method,Status,Prints']
        .concat(REPAYMENTS.map(p=>[p.receipt,p.date,p.cust,p.loan,p.amount,p.method,p.status,
          rcMeta(p.receipt).prints].map(v=>`"${v}"`).join(','))).join('\n'));
  });
  on('rcptResendAll','click', ()=>{
    const failed = CONFIRMATIONS.filter(c=>c.status==='Failed');
    failed.forEach(c=>{ c.status='Delivered'; c.sent = TODAY+' · '+nowTime(); });
    renderReceipts();
    toast(failed.length ? `${failed.length} confirmation(s) resent.` : 'Nothing to resend.','info');
  });

  /* section 11 */
  on('settleLoan','change', e=>{ ST.loan = e.target.value; renderSettlements(); });
  on('settleType','change', e=>{ ST.type = e.target.value; renderSettlements(); });
  ['settleDisc','settlePartial'].forEach(id=>on(id,'input', renderSettlements));
  on('settleRequest','click', ()=>settleAction('request'));
  on('settleQuote','click', ()=>settleAction('quote'));
  on('settleVerify','click', ()=>settleAction('verify'));
  on('settleConfirm','click', ()=>settleAction('confirm'));
  on('settleNew','click', ()=>{ ST.loan=''; renderSettlements(); gotoSec('s11'); toast('Pick a loan to calculate its settlement.','info'); });

  /* section 12 */
  on('revNew','click', newReversal);

  /* section 13 */
  on('offReassign','click', assignModal);

  /* section 14 */
  on('reconRun','click', ()=>{
    buildRecon(); RECON.forEach(r=>{ r.confirmed = r.recorded; });
    const total = sum(RECON,r=>r.recorded);
    RECON_HIST.unshift([TODAY,total,total,0,0,'Thandiwe Kamanga','Balanced']);
    renderRecon();
    el('reconStatus').textContent = 'Reconciled today';
    el('reconStatus').className = 'badge b-ok';
    toast('Reconciliation complete · all channels balanced.');
    logPay('Verification','Daily reconciliation completed · '+mk(total),'recon',total);
  });
  on('reconAdjAdd','click', ()=>{
    const amt = Number(el('reconAdjAmt').value)||0;
    if(!amt){ toast('Enter an adjustment amount.','err'); return; }
    ADJUSTMENTS.push({type:el('reconAdjType').value, desc:'Manual', amount:amt, note:el('reconAdjNote').value});
    toast(`Adjustment recorded · ${mk(amt)}.`);
    logPay('Correction','Reconciliation adjustment · '+el('reconAdjType').value,'recon',amt);
  });

  /* section 15 */
  on('rptPeriod','change', renderReport);
  on('rptExport','click', ()=>exportReport('csv'));
  on('rptCsv','click', ()=>exportReport('csv'));
  on('rptXls','click', ()=>exportReport('xlsx'));
  on('rptPdf','click', ()=>exportReport('pdf'));
  on('rptPrint','click', ()=>doPrint('Repayment report'));

  /* section 16 */
  on('msgFilter','change', e=>{ MSG_FILTER = e.target.value; renderNotifications(); });
  on('notifSend','click', ()=>{
    const due = LOANS.filter(l=>scheduleFor(l).some(s=>s.due===TODAY&&s.status!=='Paid'));
    due.forEach((l,i)=>MSGS.unshift([nowTime(), l.cust, 'Reminder', 'SMS', 'Delivered']));
    renderNotifications();
    toast(`Due-today reminders sent to ${due.length} customers.`);
    logPay('Verification','Due-today reminder batch · '+due.length+' customers','msg',0);
  });

  /* section 17 */
  el('audTabs').querySelectorAll('button').forEach(b=>{
    b.onclick = ()=>{
      el('audTabs').querySelectorAll('button').forEach(x=>x.classList.remove('on'));
      b.classList.add('on'); AUD.cat = b.dataset.cat; AUD.page = 1; renderAudit();
    };
  });
  on('audSearch','input', e=>{ AUD.q = e.target.value; AUD.page = 1; renderAudit(); });
  on('audExport','click', ()=>{
    downloadFile('repayment-audit.csv','text/csv;charset=utf-8','\ufeff' +
      ['Time,Category,Actor,Action,Record,Amount,IP,Result']
        .concat(audFiltered().map(a=>[a.time,a.cat,a.actor,a.action.replace(/,/g,';'),a.record,a.amount,a.ip,a.result]
          .map(v=>`"${v}"`).join(','))).join('\n'));
  });

  /* section 18 */
  on('setSave','click', saveSettings);
  on('setDiscard','click', discardSettings);
  bindSettings();

  on('modalClose','click', closeModal);
  el('modal').addEventListener('click', e=>{ if(e.target === el('modal')) closeModal(); });

  /* nav guard */
  document.querySelectorAll('.nav-item').forEach(item=>{
    item.addEventListener('click', e=>{
      const p = item.dataset.page;
      if(['dashboard','disbursements','notifications','staff','reports','settings','repayments','collections'].includes(p)) return;
      e.preventDefault();
      toast('This module is queued for build.','info');
      el('sidebar').classList.remove('open');
    });
  });

  /* section nav */
  const secs = [...document.querySelectorAll('.sec')];
  const chips = [...document.querySelectorAll('.snav')];
  const spy = ()=>{
    let cur = secs[0];
    for(const s of secs) if(s.getBoundingClientRect().top <= 150) cur = s;
    chips.forEach(c=>c.classList.toggle('on', c.getAttribute('href') === '#' + cur.id));
  };
  window.addEventListener('scroll', spy, {passive:true});
  chips.forEach(c=>c.addEventListener('click', e=>{
    e.preventDefault();
    const t = document.querySelector(c.getAttribute('href'));
    if(t) window.scrollTo({top:t.offsetTop-112, behavior:'smooth'});
  }));

  renderAll();
  renderNotifications();
  renderSettings();
  spy();
}

window.REPAYMENTS_APP = {REPAYMENTS, LOANS, OFFICERS, TASKS, PROMISES, SETTLE, REVS, AUDIT,
  renderAll, reportData, scheduleFor, verifyPayment, applyAllocation};

boot();
</script>
</body>
</html>
