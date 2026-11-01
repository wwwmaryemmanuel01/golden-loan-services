<script>
/* ============================================================
   CHARTS & ANALYTICS (2/7)
   Filter state, period buckets, roll-ups and the shared helpers:
   sortable/paginated tables, record drill-down, exports, printing.
   ============================================================ */

/* ---------------- refresh stamp (section 15 shows it) ---------------- */
let REFRESH = '30 Oct 2026 · 09:41';
const lastRefresh = () => REFRESH;

/* ---------------- filter state ---------------- */
const FILTER = {from:addMonths(TODAY,-11).slice(0,8)+'01', to:TODAY, grain:'month',
  product:'', status:'', customer:'', staff:'', method:'', region:'', q:''};

/* second range used by "compare selected periods" in section 13 */
const COMPARE = {on:false, from:addMonths(TODAY,-23).slice(0,8)+'01', to:addMonths(TODAY,-12)};

const inRange = d => (!FILTER.from || d >= FILTER.from) && (!FILTER.to || d <= FILTER.to);
const inCompare = d => (!COMPARE.from || d >= COMPARE.from) && (!COMPARE.to || d <= COMPARE.to);

function filterLoans(){
  const q = FILTER.q.trim().toLowerCase();
  return LOANS.filter(l=> inRange(l.date)
    && (!FILTER.product || l.product === FILTER.product)
    && (!FILTER.status || l.status === FILTER.status)
    && (!FILTER.customer || l.cust === FILTER.customer)
    && (!FILTER.staff || l.officer === FILTER.staff)
    && (!FILTER.region || l.region === FILTER.region)
    && (!q || (l.ref + ' ' + l.cust + ' ' + (CUST_BY_ID[l.cust]||{}).name).toLowerCase().includes(q)));
}
function filterPays(){
  const q = FILTER.q.trim().toLowerCase();
  return PAYS.filter(p=> inRange(p.date)
    && (!FILTER.product || (LOAN_BY_REF[p.loan]||{}).product === FILTER.product)
    && (!FILTER.customer || p.cust === FILTER.customer)
    && (!FILTER.staff || p.officer === FILTER.staff)
    && (!FILTER.method || p.method === FILTER.method)
    && (!FILTER.region || (CUST_BY_ID[p.cust]||{}).region === FILTER.region)
    && (!q || (p.ref + ' ' + p.receipt + ' ' + p.loan).toLowerCase().includes(q)));
}
function filterApps(){
  const q = FILTER.q.trim().toLowerCase();
  return APPS.filter(a=> inRange(a.submitted)
    && (!FILTER.product || a.product === FILTER.product)
    && (!FILTER.status || a.status === FILTER.status)
    && (!FILTER.customer || a.cust === FILTER.customer)
    && (!FILTER.staff || a.officer === FILTER.staff)
    && (!FILTER.region || a.region === FILTER.region)
    && (!q || (a.ref + ' ' + (CUST_BY_ID[a.cust]||{}).name).toLowerCase().includes(q)));
}
function filterDisb(){
  const q = FILTER.q.trim().toLowerCase();
  return DISB.filter(d=> inRange(d.date)
    && (!FILTER.product || (LOAN_BY_REF[d.loan]||{}).product === FILTER.product)
    && (!FILTER.staff || d.officer === FILTER.staff)
    && (!FILTER.method || d.method === FILTER.method)
    && (!FILTER.region || (LOAN_BY_REF[d.loan]||{}).region === FILTER.region)
    && (!FILTER.customer || (LOAN_BY_REF[d.loan]||{}).cust === FILTER.customer)
    && (!q || (d.ref + ' ' + d.loan).toLowerCase().includes(q)));
}
function filterCust(){
  const q = FILTER.q.trim().toLowerCase();
  return CUSTOMERS.filter(c=> inRange(c.joined)
    && (!FILTER.customer || c.id === FILTER.customer)
    && (!FILTER.region || c.region === FILTER.region)
    && (!q || (c.id + ' ' + c.name + ' ' + c.phone).toLowerCase().includes(q)));
}
/* loans matching every filter except the date range — used to build the instalment
   schedule, because cash can arrive for facilities opened before the window */
function loansForSchedule(){
  const q = FILTER.q.trim().toLowerCase();
  return LOANS.filter(l=>
    (!FILTER.product || l.product === FILTER.product)
    && (!FILTER.status || l.status === FILTER.status)
    && (!FILTER.customer || l.cust === FILTER.customer)
    && (!FILTER.staff || l.officer === FILTER.staff)
    && (!FILTER.region || l.region === FILTER.region)
    && (!q || (l.ref + ' ' + l.cust + ' ' + (CUST_BY_ID[l.cust]||{}).name).toLowerCase().includes(q)));
}

/* customers matching the filters except join date — the register itself */
function customersInScope(){
  const q = FILTER.q.trim().toLowerCase();
  return CUSTOMERS.filter(c=>
    (!FILTER.customer || c.id === FILTER.customer)
    && (!FILTER.region || c.region === FILTER.region)
    && (!q || (c.id + ' ' + c.name + ' ' + c.phone).toLowerCase().includes(q)));
}

function filterTxn(){
  const q = FILTER.q.trim().toLowerCase();
  return TXNS.filter(t=> inRange(t.date)
    && (!FILTER.method || t.method === FILTER.method)
    && (!FILTER.customer || (LOAN_BY_REF[t.loan]||{}).cust === FILTER.customer)
    && (!FILTER.staff || (LOAN_BY_REF[t.loan]||{}).officer === FILTER.staff)
    && (!FILTER.product || (LOAN_BY_REF[t.loan]||{}).product === FILTER.product)
    && (!FILTER.region || (LOAN_BY_REF[t.loan]||{}).region === FILTER.region)
    && (!q || (t.ref + ' ' + t.loan).toLowerCase().includes(q)));
}

/* ---------------- period buckets honouring the grain switch ---------------- */
function buckets(){
  const keys = [];
  if(FILTER.grain === 'day'){
    let d = FILTER.to;
    for(let i=0;i<14 && d >= FILTER.from;i++){ keys.unshift(d); d = addDays(d,-1); }
    return keys;
  }
  if(FILTER.grain === 'week'){
    let d = FILTER.to;
    for(let i=0;i<12;i++){
      const wk = addDays(d, -6);
      keys.unshift(wk + '|' + d);
      d = addDays(wk,-1);
      if(d < FILTER.from) break;
    }
    return keys;
  }
  if(FILTER.grain === 'year') return [...new Set(MONTHS.map(m=>m.slice(0,4)))].sort();
  return MONTHS.filter(m=> m >= FILTER.from.slice(0,7) && m <= FILTER.to.slice(0,7));
}
function bucketKey(date){
  if(FILTER.grain === 'day') return String(date).slice(0,10);
  if(FILTER.grain === 'week'){
    const d = asDate(date); const dow = (d.getDay()+6)%7;
    return addDays(isoOf(d), -dow);
  }
  if(FILTER.grain === 'year') return String(date).slice(0,4);
  return String(date).slice(0,7);
}
function bucketLabel(k){
  if(FILTER.grain === 'day') return fmtShort(k);
  if(FILTER.grain === 'week') return 'w/c ' + fmtShort(k);
  if(FILTER.grain === 'year') return k;
  return monthLabel(k);
}
function seriesBy(items, dateOf, valueOf){
  const keys = buckets();
  const idx = {};
  keys.forEach(k=> idx[k] = 0);
  items.forEach(it=>{
    const k = bucketKey(dateOf(it));
    if(k in idx) idx[k] += Number(valueOf(it))||0;
  });
  return {cats: keys.map(bucketLabel), keys, data: keys.map(k=>idx[k])};
}
function countBy(items, dateOf){
  const keys = buckets();
  const idx = {};
  keys.forEach(k=> idx[k] = 0);
  items.forEach(it=>{ const k = bucketKey(dateOf(it)); if(k in idx) idx[k]++; });
  return {cats: keys.map(bucketLabel), keys, data: keys.map(k=>idx[k])};
}

/* ---------------- roll-ups ---------------- */
function kpis(){
  const loans = filterLoans(), pays = filterPays(), apps = filterApps();
  const active = loans.filter(l=>l.status === 'Active');
  return {
    loans: loans.length,
    active: active.length,
    closed: loans.filter(l=>l.status === 'Closed').length,
    written: loans.filter(l=>l.status === 'Written off').length,
    disbursed: sum(loans, l=>l.amount),
    disbursedNet: sum(filterDisb().filter(d=>d.status === 'Successful'), d=>d.amount),
    collected: sum(pays, p=>p.amount),
    principal: sum(pays, p=>p.principal),
    interest: sum(pays, p=>p.interest),
    fees: sum(pays, p=>p.fees),
    outstanding: sum(active, l=>l.outstanding),
    arrears: sum(active, l=>l.arrears),
    receipts: pays.length,
    onTime: pays.filter(p=>p.timing === 'On time').length,
    partial: pays.filter(p=>p.status === 'Partial').length,
    activeCust: new Set(active.map(l=>l.cust)).size,
    customers: filterCust().length,
    pending: apps.filter(a=>a.status === 'Pending').length,
    apps: apps.length,
    approved: apps.filter(a=>a.status === 'Approved').length,
    rejected: apps.filter(a=>a.status === 'Rejected').length
  };
}
function windowStats(from, to){
  const loans = LOANS.filter(l=> l.date >= from && l.date <= to);
  const pays = PAYS.filter(p=> p.date >= from && p.date <= to);
  const apps = APPS.filter(a=> a.submitted >= from && a.submitted <= to);
  const custs = CUSTOMERS.filter(c=> c.joined >= from && c.joined <= to);
  const disb = disb => disb.date >= from && disb.date <= to;
  const coll = sum(pays, p=>p.amount), disbs = sum(loans, l=>l.amount);
  return {
    loans: loans.length, disb: disbs, coll,
    interest: sum(pays, p=>p.interest),
    apps: apps.length,
    approved: apps.filter(a=>a.status === 'Approved').length,
    rejected: apps.filter(a=>a.status === 'Rejected').length,
    custs: custs.length, receipts: pays.length,
    rate: disbs ? coll/disbs*100 : 0
  };
}

/* ---------------- shared page helpers ---------------- */
const prodName = id => (PROD_BY_ID[id]||{}).name || '—';
const staffName = id => (STAFF_BY_ID[id]||{}).name || '—';
const custName = id => (CUST_BY_ID[id]||{}).name || '—';

/* sortable, paginated table. opts: {key, cols:[{k,label,num}], rows, onRow, pageSize} */
const TBL = {};
function renderTable(hostId, cols, rows, opts={}){
  const st = TBL[hostId] = TBL[hostId] || {sort:opts.sort || cols.find(c=>c.num)?.k || cols[0].k, dir:opts.dir || 'desc', page:1};
  const pageSize = opts.pageSize || 8;
  rows = rows.slice();
  const col = cols.find(c=>c.k === st.sort) || cols[0];
  rows.sort((a,b)=>{
    const av = a[st.sort], bv = b[st.sort];
    const x = col.num ? Number(av)||0 : String(av==null?'':av).toLowerCase();
    const y = col.num ? Number(bv)||0 : String(bv==null?'':bv).toLowerCase();
    if(x < y) return st.dir === 'asc' ? -1 : 1;
    if(x > y) return st.dir === 'asc' ? 1 : -1;
    return 0;
  });
  const pages = Math.max(1, Math.ceil(rows.length/pageSize));
  st.page = Math.min(st.page, pages);
  const slice = rows.slice((st.page-1)*pageSize, st.page*pageSize);
  const head = cols.map(c=>`<th class="sortable${c.num?' num':''}" data-tblsort="${hostId}" data-k="${c.k}">${esc(c.label)}${st.sort===c.k?`<span class="ar">${st.dir==='asc'?'▲':'▼'}</span>`:''}</th>`).join('');
  const body = slice.map((r,i)=>{
    const idx = (st.page-1)*pageSize + i;
    return `<tr${opts.onRow?` class="rowlink" data-tblrow="${hostId}" data-i="${idx}"`:''}>` +
      cols.map(c=>{
        const v = r[c.k];
        return `<td${c.num?' class="num"':''}>${c.html ? c.html(v, r) : esc(v)}</td>`;
      }).join('') + '</tr>';
  }).join('') || `<tr><td colspan="${cols.length}" class="empty">Nothing matches the current filters.</td></tr>`;
  const host = el(hostId);
  if(!host) return;
  TBL_CFG[hostId] = {cols, rows: rows.slice(), opts};
  const foot = `<tr><td colspan="${cols.length}" style="border:0;padding-top:7px">
      <div class="tblfoot"><span>${num(rows.length)} row${rows.length===1?'':'s'} · page ${st.page} of ${pages}</span>
      <div class="pager">
        <button class="btn btn-ghost" data-tblpage="${hostId}" data-p="-1" ${st.page<=1?'disabled':''}>‹ Prev</button>
        <button class="btn btn-ghost" data-tblpage="${hostId}" data-p="1" ${st.page>=pages?'disabled':''}>Next ›</button>
      </div></div></td></tr>`;
  const table = host.closest('table') || host;
  const thead = table.querySelector('thead');
  if(thead) thead.innerHTML = '<tr>' + head + '</tr>';
  host.innerHTML = body + foot;
  host.dataset.rows = '1';
  STORE_ROWS[hostId] = rows;
}

/* rows kept per table so a row click can open the record it came from,
   and the last render config so sorting/paging can redraw in place */
const STORE_ROWS = {};
const TBL_CFG = {};

/* ---------------- record drill-down ---------------- */
function field(label, value){
  return `<div class="pfield"><div class="pk">${esc(label)}</div><div class="pv">${value}</div></div>`;
}
function drillLoan(ref){
  const l = LOAN_BY_REF[ref];
  if(!l) return toast('Loan ' + ref + ' is outside the current filters.', 'err');
  const mine = (PAYS_BY_LOAN[ref] || []).slice(0, 12);
  openModal('Loan ' + l.ref, prodName(l.product) + ' · ' + custName(l.cust),
    `<div class="pfields">
      ${field('Customer', esc(custName(l.cust)) + ' <span class="muted">' + esc(l.cust) + '</span>')}
      ${field('Product', esc(prodName(l.product)))}
      ${field('Officer', esc(staffName(l.officer)))}
      ${field('Branch / region', esc(l.region))}
      ${field('Disbursed', money(l.amount) + ' · ' + fmtDate(l.date))}
      ${field('Term / rate', l.term + ' months · ' + r1(l.rate*100) + '% flat')}
      ${field('Instalment', money(l.instalment))}
      ${field('Status', `<span class="badge ${l.status==='Active'?'b-ok':l.status==='Closed'?'b-gray':'b-crit'}">${l.status}</span>`)}
      ${field('Collected', money(l.collected))}
      ${field('Outstanding', money(l.outstanding))}
      ${field('Arrears', money(l.arrears) + (l.dpd ? ' · ' + l.dpd + ' days past due' : ''))}
      ${field('Receipts', num(mine.length) + ' posted')}
    </div>
    <div class="minihead">Latest receipts</div>
    <div class="tblwrap" style="max-height:180px"><table class="tbl2 dense">
      <thead><tr><th>Date</th><th>Receipt</th><th class="num">Amount</th><th>Timing</th></tr></thead>
      <tbody>${mine.map(p=>`<tr><td>${fmtDate(p.date)}</td><td>${esc(p.receipt)}</td>
        <td class="num">${money(p.amount)}</td><td>${p.timing}</td></tr>`).join('') ||
        '<tr><td colspan="4" class="empty">No receipts against this loan in the current filters.</td></tr>'}</tbody></table></div>`,
    [{label:'View customer', act:()=>{ closeModal(); drillCustomer(l.cust); }}, {label:'Close', act:'close'}]);
}
function drillCustomer(id){
  const c = CUST_BY_ID[id];
  if(!c) return toast('Customer ' + id + ' is outside the current filters.', 'err');
  const mine = LOANS.filter(l=>l.cust === id);
  openModal(c.name, c.id + ' · ' + c.region,
    `<div class="pfields">
      ${field('Phone', esc(c.phone))}
      ${field('Joined', fmtDate(c.joined))}
      ${field('Status', `<span class="badge ${c.status==='Active'?'b-ok':'b-gray'}">${c.status}</span>`)}
      ${field('KYC', `<span class="badge ${c.kyc==='Verified'?'b-ok':'b-warn'}">${c.kyc}</span>`)}
      ${field('Occupation', esc(c.occupation))}
      ${field('Declared income', money(c.income))}
      ${field('Facilities', num(mine.length) + (c.repeat ? ' · repeat borrower' : ''))}
      ${field('Outstanding', money(sum(mine, l=>l.outstanding)))}
      ${field('Arrears', money(sum(mine, l=>l.arrears)))}
      ${field('Repaid to date', money(sum(mine, l=>l.collected)))}
    </div>
    <div class="minihead">Facilities</div>
    <div class="tblwrap" style="max-height:190px"><table class="tbl2 dense">
      <thead><tr><th>Loan</th><th>Product</th><th class="num">Amount</th><th class="num">Outstanding</th><th>Status</th></tr></thead>
      <tbody>${mine.map(l=>`<tr><td>${esc(l.ref)}</td><td>${esc(prodName(l.product))}</td>
        <td class="num">${money(l.amount)}</td><td class="num">${money(l.outstanding)}</td><td>${l.status}</td></tr>`).join('') ||
        '<tr><td colspan="5" class="empty">No facilities.</td></tr>'}</tbody></table></div>`,
    [{label:'Close', act:'close'}]);
}
function drillPayment(p){
  openModal('Receipt ' + p.receipt, p.ref + ' · ' + fmtDate(p.date),
    `<div class="pfields">
      ${field('Loan', esc(p.loan))}
      ${field('Customer', esc(custName(p.cust)))}
      ${field('Amount', money(p.amount))}
      ${field('Principal', money(p.principal))}
      ${field('Interest', money(p.interest))}
      ${field('Fees', money(p.fees))}
      ${field('Method', esc(p.method))}
      ${field('Recorded by', esc(staffName(p.officer)))}
      ${field('Due date', fmtDate(p.due))}
      ${field('Timing', p.timing + (p.daysLate ? ' · ' + p.daysLate + ' days late' : ''))}
      ${field('Completion', p.status)}
    </div>`, [{label:'Open loan', act:()=>{ closeModal(); drillLoan(p.loan); }}, {label:'Close', act:'close'}]);
}
function drillApp(a){
  openModal('Application ' + a.ref, custName(a.cust) + ' · ' + prodName(a.product),
    `<div class="pfields">
      ${field('Customer', esc(custName(a.cust)))}
      ${field('Product', esc(prodName(a.product)))}
      ${field('Requested', money(a.amount))}
      ${field('Term', a.term + ' months')}
      ${field('Submitted', fmtDate(a.submitted))}
      ${field('Status', `<span class="badge ${a.status==='Approved'?'b-ok':a.status==='Rejected'?'b-crit':a.status==='Pending'?'b-warn':'b-gray'}">${a.status}</span>`)}
      ${field('Decision date', a.decided ? fmtDate(a.decided) : 'Awaiting review')}
      ${field('Processing time', a.decided ? daysBetween(a.submitted, a.decided) + ' days' : '—')}
      ${field('Officer', esc(staffName(a.officer)))}
      ${field('Region', esc(a.region))}
      ${a.reason ? field('Reason', esc(a.reason)) : ''}
    </div>`, [{label:'View customer', act:()=>{ closeModal(); drillCustomer(a.cust); }}, {label:'Close', act:'close'}]);
}
function drillDisb(d){
  openModal('Payout ' + d.ref, d.loan + ' · ' + fmtDate(d.date),
    `<div class="pfields">
      ${field('Loan', esc(d.loan))}
      ${field('Approved amount', money(d.approved))}
      ${field('Released', money(d.amount))}
      ${field('Variance', money(d.amount - d.approved))}
      ${field('Method', esc(d.method))}
      ${field('Processed by', esc(staffName(d.officer)))}
      ${field('Status', `<span class="badge ${d.status==='Successful'?'b-ok':d.status==='Failed'?'b-crit':'b-warn'}">${d.status}</span>`)}
      ${field('Fee charged', money(d.fee))}
    </div>`, [{label:'Open loan', act:()=>{ closeModal(); drillLoan(d.loan); }}, {label:'Close', act:'close'}]);
}
function drillTxn(t){
  openModal('Transaction ' + t.ref, t.type + ' · ' + fmtDate(t.date),
    `<div class="pfields">
      ${field('Type', esc(t.type))}
      ${field('Direction', esc(t.direction))}
      ${field('Amount', money(t.amount))}
      ${field('Loan', esc(t.loan))}
      ${field('Channel', esc(t.method))}
      ${field('Status', `<span class="badge ${t.status==='Posted'?'b-ok':'b-warn'}">${esc(t.status)}</span>`)}
    </div>`, [{label:'Open loan', act:()=>{ closeModal(); drillLoan(t.loan); }}, {label:'Close', act:'close'}]);
}

/* ---------------- exports ---------------- */
const EXPORTS = [];
function brandHtml(title, sub){
  return `<div class="brandblock"><div class="bm">G</div>
    <div><div style="font-weight:800;font-size:12px">GOLDEN FINANCIAL SERVICES</div>
      <div style="font-size:9px;letter-spacing:1px;color:#8A6D0F;font-weight:700">LILONGWE · MALAWI</div></div>
    <div style="margin-left:auto;text-align:right;font-size:9px;color:#6B7280">
      ${esc(title)}<br>${esc(sub)}<br>${fmtDate(TODAY)}</div></div>`;
}
function filterLine(){
  const bits = [`${fmtDate(FILTER.from)} – ${fmtDate(FILTER.to)}`, 'grain: ' + FILTER.grain];
  if(FILTER.product) bits.push('product: ' + prodName(FILTER.product));
  if(FILTER.status) bits.push('status: ' + FILTER.status);
  if(FILTER.staff) bits.push('staff: ' + staffName(FILTER.staff));
  if(FILTER.region) bits.push('region: ' + FILTER.region);
  if(FILTER.method) bits.push('method: ' + FILTER.method);
  if(FILTER.customer) bits.push('customer: ' + custName(FILTER.customer));
  if(FILTER.q) bits.push('search: "' + FILTER.q + '"');
  return bits.join(' · ');
}
function logExport(report, format, rows){
  EXPORTS.unshift({when:TODAY + ' ' + new Date().toTimeString().slice(0,5), report, format, rows,
    by:'Chikondi Mwale', filters:filterLine()});
  renderExportHistory();
}
function renderExportHistory(){
  const body = el('expHistoryBody');
  el('expCount').textContent = EXPORTS.length;
  if(!body) return;
  body.innerHTML = EXPORTS.slice(0,12).map(x=>`<tr>
    <td style="white-space:nowrap">${esc(x.when)}</td><td>${esc(x.report)}</td><td>${x.format}</td>
    <td class="num">${num(x.rows)}</td><td>${esc(x.by)}</td><td style="font-size:9.5px">${esc(x.filters)}</td></tr>`).join('') ||
    '<tr><td colspan="6" class="empty">No exports yet — generate a report above.</td></tr>';
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

function exportChartImage(hostId){
  const host = el(hostId);
  const svg = host && host.querySelector('svg');
  if(!svg) return toast('Nothing to export here yet — build the chart first.', 'err');
  try{
    const data = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    img.onload = ()=>{
      const canvas = document.createElement('canvas');
      canvas.width = svg.viewBox.baseVal.width * 2 || 1440;
      canvas.height = svg.viewBox.baseVal.height * 2 || 420;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = 'chart-' + hostId + '-' + TODAY + '.png';
      document.body.appendChild(a); a.click(); a.remove();
      toast('Chart image exported as PNG');
      logExport('Chart image · ' + hostId, 'PNG', 1);
    };
    img.onerror = ()=> toast('This browser could not rasterise the chart — use Print instead.', 'err');
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(data)));
  }catch(err){
    toast('Image export is not supported in this browser.', 'err');
  }
}
</script>
