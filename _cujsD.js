<script>
/* ============================================================
   GOLDEN FINANCIAL SERVICES · CUSTOMERS  (4/4)
   Sections 12–14, exports, reports, boot.
   ============================================================ */

/* ---------- downloads & printing ---------- */
function downloadFile(name, mime, text){
  if(window.self !== window.top){
    openModal('Export preview', name, `
      <div class="note gold"><div>Downloads are blocked inside this embedded preview frame. Copy the contents
        below, or open the portal in its own tab to save the file.</div></div>
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
      <div class="note gold"><div>The print dialog is unavailable inside this embedded preview. Open the
        portal in its own tab and use Print — the document is already print-formatted.</div></div>`,
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
function printBlock(id, title){
  const node = document.getElementById(id);
  if(!node){ doPrint(title); return; }
  doPrint(title);
}
function csvCell(v){ const s = String(v==null?'':v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g,'""') + '"' : s; }
function toCsv(rows){ return rows.map(r=>r.map(csvCell).join(',')).join('\r\n'); }

function exportRows(base, headers, rows, title){
  const all = [headers].concat(rows);
  downloadFile(base + '.csv', 'text/csv;charset=utf-8', '\ufeff' + toCsv(all));
  toast('Exported ' + (rows.length) + ' rows · ' + title);
}

/* ---- minimal .xlsx writer (stored zip, inline strings) ---- */
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
function buildXlsx(name, d){
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
  if(window.self !== window.top){
    openModal('Excel export ready', name + ' · ' + d.rows.length + ' rows', `
      <div class="note gold"><div>A real .xlsx workbook was built in the browser (${(bytes.length/1024).toFixed(1)} KB),
        but downloads are blocked inside this embedded preview. Open the portal in its own tab to save it.</div></div>`,
      [{label:'Close', act:'close'}]);
    return;
  }
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
        but this browser blocked the download. Open the portal in its own tab, or export CSV instead.</div></div>
      <div class="inline-note">Sheet: ${esc(d.title)} · ${d.rows.length} data rows · ${d.cols.length} columns</div>`,
      [{label:'Close', act:'close'}]);
  }
}

/* ===================== 12 · SUPPORT ===================== */
const TICKETS = [];
let tkSeq = 1040;
const TICKET_SEED = [
  [5,'Complaint','Instalment deducted twice','Airtel Money deducted MK 42,000 twice for the same instalment on LN-2413. The customer wants the duplicate refunded.','Escalated',-11,'High'],
  [8,'Payment Dispute','Payment not reflected','The customer paid MK 35,000 at the branch on 12 Oct but the loan still shows the instalment as missed.','In progress',-8,'High'],
  [2,'Inquiry','Balance enquiry','Customer wants a written breakdown of principal and interest paid on LN-2407.','Resolved',-19,'Normal'],
  [11,'Account Correction','Wrong phone number','The phone number on the record belongs to a relative. Update to +265 995 220 118.','Closed',-26,'Normal'],
  [16,'Balance Dispute','Penalty charged in error','A MK 25,000 penalty was charged while the customer was in hospital. Requesting a waiver.','In progress',-6,'High'],
  [20,'Inquiry','Settlement figure','Customer wants a settlement quotation to close both facilities early.','New',-2,'Normal'],
  [23,'Complaint','Officer conduct','Customer reports an officer called a relative about the arrears. Wants the practice stopped.','Escalated',-4,'High'],
  [25,'Payment Dispute','Mpamba payment missing','MK 18,500 sent by Mpamba on 20 Oct is not showing against the loan.','New',-3,'High'],
  [28,'Inquiry','Portal access','Customer cannot log in to the portal after changing phones.','Resolved',-15,'Normal'],
  [30,'Account Correction','Name spelling','Surname printed as "Banda" instead of "Bandah" on the agreement.','Closed',-33,'Low'],
  [13,'Complaint','Delayed disbursement','Approved loan has not been disbursed after four working days.','In progress',-5,'High'],
  [18,'Account Correction','Income update','Salary increased after promotion — update income to MK 920,000.','Resolved',-21,'Normal'],
  [33,'Inquiry','Early repayment','Customer asks whether early repayment attracts a discount.','New',-1,'Normal'],
  [9,'Complaint','Statement request','Business customer needs a statement for a bank facility application.','Closed',-29,'Normal'],
  [15,'Balance Dispute','Arrears shown after payment','Customer says the arrears were cleared but the record still shows MK 12,000.','New',-2,'Normal'],
  [26,'Account Correction','Next of kin change','Customer wants a sibling recorded as next of kin instead of a parent.','Closed',-24,'Low']
];

function seedTickets(){
  if(TICKETS.length) return;
  TICKET_SEED.forEach((s,i)=>{
    const [ci, type, subject, body, status, offset, priority] = s;
    const c = CUSTOMERS[ci];
    if(!c) return;
    const opened = addDays(TODAY, offset);
    const t = {
      id: 'TCK-' + (++tkSeq), cust: c.no, custName: c.name, type, subject, body,
      status, priority, opened, assignee: OFFICER_NAMES[(i+2) % OFFICER_NAMES.length],
      updates: [{when:opened, by:'Customer care', note:'Ticket logged from the ' +
        (type === 'Inquiry' ? 'customer portal' : type === 'Complaint' ? 'branch visit' : 'call centre') + '.', status:'New'}]
    };
    if(status !== 'New'){
      t.updates.push({when:addDays(opened, 1), by:t.assignee, note:'Assigned and acknowledged to the customer by SMS.', status:'In progress'});
    }
    if(status === 'Escalated'){
      t.updates.push({when:addDays(opened, 2), by:'Head of Credit', note:'Escalated to management — response required within 48 hours.', status:'Escalated'});
    }
    if(status === 'Resolved' || status === 'Closed'){
      t.updates.push({when:addDays(opened, Math.min(6, Math.abs(offset) - 1)), by:t.assignee,
        note:'Issue resolved and the customer confirmed by phone.', status:'Resolved'});
    }
    if(status === 'Closed'){
      t.updates.push({when:addDays(opened, Math.min(9, Math.abs(offset))), by:'Customer care',
        note:'Closed after the customer confirmed no further action needed.', status:'Closed'});
    }
    TICKETS.push(t);
    c.tickets.push(t.id);
  });
}

const SUP = {cust:'', type:'', status:'', q:'', sel:null};

function renderSupport(){
  const open = TICKETS.filter(t=>t.status !== 'Closed' && t.status !== 'Resolved');
  el('tkOpenPill').textContent = open.length + ' open';
  el('tkCount').textContent = TICKETS.length + ' tickets';
  el('tkStats').innerHTML = [
    {l:'Open tickets', v:nf(open.length), s:'Awaiting resolution', k:'gold'},
    {l:'In progress', v:nf(TICKETS.filter(t=>t.status==='In progress').length), s:'Owned by an officer'},
    {l:'Escalated', v:nf(TICKETS.filter(t=>t.status==='Escalated').length), s:'With management', k:'red'},
    {l:'Resolved', v:nf(TICKETS.filter(t=>t.status==='Resolved').length), s:'Confirmed by the customer'},
    {l:'Closed', v:nf(TICKETS.filter(t=>t.status==='Closed').length), s:'No further action'},
    {l:'High priority', v:nf(TICKETS.filter(t=>t.priority==='High' && t.status!=='Closed').length), s:'Needs attention today', k:'red'}
  ].map(t=>`<div class="kpi ${t.k||''}"><div class="kl">${t.l}</div><div class="kv">${t.v}</div>
    <div class="ks">${t.s}</div></div>`).join('');

  const q = SUP.q.trim().toLowerCase();
  const rows = TICKETS.filter(t=>
    (!SUP.cust || t.cust === SUP.cust) &&
    (!SUP.type || t.type === SUP.type) &&
    (!SUP.status || t.status === SUP.status) &&
    (!q || (t.id + ' ' + t.subject + ' ' + t.custName + ' ' + t.body).toLowerCase().includes(q))
  ).sort((a,b)=> a.opened < b.opened ? 1 : -1);

  el('tkList').innerHTML = rows.map(t=>`
    <div class="ticket ${t.status==='New'?'new':(t.status==='Closed'||t.status==='Resolved')?'closed':''}" data-tk="${t.id}" style="cursor:pointer">
      <div class="th"><span class="tt">${esc(t.subject)}</span>
        <span class="badge ${t.priority==='High'?'b-rej':t.priority==='Low'?'b-proc':'b-await'}">${t.priority}</span>
        <span class="badge ${statusTone(t.status)}">${t.status}</span></div>
      <div class="tb">${esc(t.body)}</div>
      <div class="tf"><span class="mono">${t.id}</span><span>·</span><span>${esc(t.custName)}</span>
        <span>·</span><span>${t.type}</span>
        <span style="margin-left:auto">${fmtDate(t.opened)} · ${esc(t.assignee)}</span></div>
    </div>`).join('') || '<div class="empty">No tickets match these filters.</div>';
  el('tkList').querySelectorAll('[data-tk]').forEach(card=>{
    card.onclick = ()=>{ SUP.sel = card.dataset.tk; renderSupportDetail(); };
  });
  if(!SUP.sel || !TICKETS.some(t=>t.id === SUP.sel)) SUP.sel = rows[0] ? rows[0].id : null;
  renderSupportDetail();
}

function renderSupportDetail(){
  const t = TICKETS.find(x=>x.id === SUP.sel);
  if(!t){ el('tkDetail').innerHTML = '<div class="empty">Select a ticket from the register.</div>';
    el('tkSub').textContent = 'Select a ticket'; el('tkRef').textContent = '—'; return; }
  const c = cust(t.cust);
  el('tkRef').textContent = t.id;
  el('tkSub').textContent = t.subject + ' · ' + t.type;
  el('tkDetail').innerHTML = `
    <div class="custhead" style="margin-bottom:8px">
      <div class="avatar-lg">${initials(t.custName)}</div>
      <div><div class="cname">${esc(t.custName)}</div>
        <div class="cmeta">${t.cust} · ${esc(c.phone)} · opened ${fmtDate(t.opened)}</div>
        <div class="cchips"><span class="badge ${statusTone(t.status)}">${t.status}</span>
          <span class="badge ${t.priority==='High'?'b-rej':'b-await'}">${t.priority} priority</span>
          <span class="chip">${esc(t.assignee)}</span></div></div>
    </div>
    <div style="font-size:11.5px;line-height:1.6;color:#2B303B">${esc(t.body)}</div>
    <div class="minihead">Interaction history</div>
    ${t.updates.map(u=>`<div class="lrow">
      <div class="lic" style="background:${u.status==='Resolved'?'var(--green-soft)':'var(--gold-soft)'};
        color:${u.status==='Resolved'?'#157A50':'var(--gold-dark)'};font-size:9px">${fmtShort(u.when)}</div>
      <div><div class="lt">${esc(u.status)}</div><div class="ls" style="white-space:normal">${esc(u.note)}</div>
        <div class="ls">${esc(u.by)}</div></div></div>`).join('')}
    <div class="fg" style="margin-top:9px"><label>Add an update</label>
      <textarea id="tkNote" style="min-height:60px" placeholder="What was done, who was spoken to, what was agreed"></textarea></div>
    <div class="form-actions">
      ${t.status!=='Resolved' && t.status!=='Closed' ? `<button class="btn btn-ghost" data-tkact="progress">Start</button>
        <button class="btn btn-ghost" data-tkact="escalate">Escalate</button>
        <button class="btn btn-gold" data-tkact="resolve">Resolve</button>` : ''}
      ${t.status!=='Closed' ? '<button class="btn btn-ghost" data-tkact="close">Close ticket</button>' : ''}
      <button class="btn btn-ghost" data-tkact="update">Add update</button>
      <button class="btn btn-ghost" data-tkact="sms">SMS the customer</button>
    </div>`;
  el('tkDetail').querySelectorAll('[data-tkact]').forEach(b=>{
    b.onclick = ()=> ticketAction(t, b.dataset.tkact);
  });
}

function ticketAction(t, act){
  const c = cust(t.cust);
  const note = (el('tkNote') && el('tkNote').value.trim()) || '';
  if(act === 'update'){
    if(note.length < 3){ toast('Write the update first.', 'err'); return; }
    t.updates.push({when:TODAY, by:'Chikondi Mwale', note, status:t.status});
    logAct(c, 'Support ticket ' + t.id + ' updated');
    renderSupport(); toast('Update added to ' + t.id + '.');
    return;
  }
  if(act === 'sms'){
    openModal('Message the customer', t.id + ' · ' + t.custName,
      `<div class="fg"><label>Message</label><textarea id="tkSms" style="min-height:90px">Dear ${c.first || c.name}, regarding your ticket ${t.id}: ${note || 'we are looking into it and will update you within 24 hours.'}</textarea></div>`,
      [{label:'Cancel', act:'close'}, {label:'Send SMS', cls:'btn-gold', act:()=>{
        const body = el('tkSms').value.trim();
        c.messages.push({when:TODAY, channel:'SMS', type:'Support', body, by:'Chikondi Mwale'});
        t.updates.push({when:TODAY, by:'Chikondi Mwale', note:'SMS sent: ' + body, status:t.status});
        logAct(c, 'Support SMS sent for ' + t.id);
        renderSupport(); renderComms(); closeModal(); toast('SMS sent to ' + esc(c.phone) + '.');
      }}]);
    return;
  }
  const next = {progress:'In progress', escalate:'Escalated', resolve:'Resolved', close:'Closed'}[act];
  if(!next) return;
  t.status = next;
  t.updates.push({when:TODAY, by:'Chikondi Mwale',
    note: note || ({progress:'Work started on the ticket.', escalate:'Escalated to management.',
      resolve:'Issue resolved to the customer\u2019s satisfaction.', close:'Ticket closed.'}[next]),
    status:next});
  logAct(c, 'Support ticket ' + t.id + ' marked ' + next);
  renderSupport(); renderOverview();
  toast(t.id + ' marked ' + next + '.');
}

function wireSupport(){
  el('tkCust').addEventListener('change', ()=>{ SUP.cust = el('tkCust').value; renderSupport(); });
  el('tkType').addEventListener('change', ()=>{ SUP.type = el('tkType').value; renderSupport(); });
  el('tkStatus').addEventListener('change', ()=>{ SUP.status = el('tkStatus').value; renderSupport(); });
  el('tkSearch').addEventListener('input', ()=>{ SUP.q = el('tkSearch').value; renderSupport(); });
  el('tkNew').onclick = ()=>{
    openModal('Log a support ticket', 'Inquiry, complaint, dispute or correction', `
      <div class="form-grid">
        <div class="fg"><label>Customer</label><select id="ntCust">
          ${CUSTOMERS.map(c=>`<option value="${c.no}">${c.no} · ${esc(c.name)}</option>`).join('')}</select></div>
        <div class="fg"><label>Type</label><select id="ntType">
          <option>Inquiry</option><option>Complaint</option><option>Payment Dispute</option>
          <option>Account Correction</option><option>Balance Dispute</option></select></div>
        <div class="fg"><label>Priority</label><select id="ntPriority">
          <option>Normal</option><option>High</option><option>Low</option></select></div>
        <div class="fg"><label>Assign to</label><select id="ntAssign">
          ${OFFICER_NAMES.map(o=>`<option>${o}</option>`).join('')}</select></div>
        <div class="fg" style="grid-column:1/-1"><label>Subject</label>
          <input id="ntSubject" placeholder="Short summary of the issue"></div>
        <div class="fg" style="grid-column:1/-1"><label>Details</label>
          <textarea id="ntBody" style="min-height:74px" placeholder="What did the customer report?"></textarea></div>
      </div>`,
      [{label:'Cancel', act:'close'}, {label:'Log ticket', cls:'btn-gold', act:()=>{
        const subject = el('ntSubject').value.trim();
        const body = el('ntBody').value.trim();
        if(subject.length < 4){ toast('Give the ticket a subject.', 'err'); return; }
        const no = el('ntCust').value;
        const c = cust(no);
        const t = {id:'TCK-' + (++tkSeq), cust:no, custName:c.name, type:el('ntType').value,
          subject, body: body || 'No details captured.', status:'New', priority:el('ntPriority').value,
          opened:TODAY, assignee:el('ntAssign').value,
          updates:[{when:TODAY, by:'Chikondi Mwale', note:'Ticket logged at the counter.', status:'New'}]};
        TICKETS.unshift(t);
        c.tickets.push(t.id);
        logAct(c, 'Support ticket logged — ' + subject);
        SUP.sel = t.id;
        renderSupport(); renderOverview(); closeModal();
        toast('Ticket ' + t.id + ' logged for ' + esc(c.name) + '.');
      }}]);
  };
}

/* ===================== 13 · ACCOUNT ACTIONS ===================== */
const ACT = {cust: CUSTOMERS[0].no};

const ACTION_DEFS = [
  {key:'edit',     label:'Edit profile',      icon:'✎', note:'Correct personal and contact details'},
  {key:'verify',   label:'Verify KYC',        icon:'✓', note:'Approve the verification checks'},
  {key:'activate', label:'Activate account',  icon:'▶', note:'Allow borrowing and portal access'},
  {key:'deactivate', label:'Deactivate',      icon:'❙❙', note:'Pause the account without closing it'},
  {key:'suspend',  label:'Suspend',           icon:'!', note:'Block transactions pending review', danger:true},
  {key:'restore',  label:'Restore',           icon:'↺', note:'Lift a suspension or blacklisting'},
  {key:'portal',   label:'Reset portal access', icon:'⌘', note:'Issue a new temporary PIN'},
  {key:'merge',    label:'Merge duplicates',  icon:'⇄', note:'Combine two records into one'},
  {key:'close',    label:'Close account',     icon:'✕', note:'Close the record permanently', danger:true}
];

function renderActions(){
  const c = cust(el('actCust').value || ACT.cust);
  ACT.cust = c.no;
  el('actStatusPill').textContent = c.status;
  el('actStatusPill').className = 'badge ' + statusTone(c.status);

  el('actSummary').innerHTML = `
    <div class="custhead">
      <div class="avatar-lg ${c.type==='Business'?'biz':''}">${initials(c.name)}</div>
      <div style="flex:1;min-width:180px">
        <div class="cname">${esc(c.name)}</div>
        <div class="cmeta">${c.no} · ${c.type} · ${c.district} · ${esc(c.phone)}</div>
        <div class="cchips">
          <span class="badge ${statusTone(c.status)}">${c.status}</span>
          <span class="badge ${kycTone(c)}">KYC ${kycLabel(c)}</span>
          <span class="badge ${statusTone(c.risk)}">${c.risk} risk</span>
          <span class="chip">${c.portal ? 'Portal active' : 'No portal'}</span>
          <span class="chip">${activeCount(c.no)} live loans</span>
          ${c.mergedInto ? `<span class="chip">Merged into ${c.mergedInto}</span>` : ''}
        </div>
      </div>
      <div class="statstrip" style="margin:0;max-width:340px">
        <div><b>${mk2(exposure(c.no))}</b><span>Exposure</span></div>
        <div><b>${openTickets(c.no)}</b><span>Tickets</span></div>
        <div><b>${c.activity.length}</b><span>Logged actions</span></div>
      </div>
    </div>`;

  el('actGrid').innerHTML = ACTION_DEFS.map(a=>`
    <button class="abtn ${a.danger?'danger':''}" data-act="${a.key}" title="${a.note}">
      <span class="ai">${a.icon}</span>
      <span><span style="display:block">${a.label}</span>
        <span style="display:block;font-weight:500;font-size:9px;color:var(--muted);margin-top:2px">${a.note}</span></span>
    </button>`).join('');
  el('actGrid').querySelectorAll('[data-act]').forEach(b=>{
    b.onclick = ()=> accountAction(c, b.dataset.act);
  });

  el('actHistCount').textContent = c.activity.length;
  el('actHistory').innerHTML = c.activity.slice(0, 24).map(a=>`
    <div class="lrow"><div class="lic" style="background:var(--gold-soft);color:var(--gold-dark);font-size:9px">${fmtShort(a.when)}</div>
      <div><div class="lt">${esc(a.what)}</div><div class="ls">${fmtDate(a.when)} · ${esc(a.time || '')} · ${esc(a.by)}</div></div></div>`).join('') ||
    '<div class="empty">No actions logged yet.</div>';

  renderDuplicates(c);
}

function dupCandidates(c){
  const norm = s => String(s||'').toLowerCase().replace(/[^a-z]/g,'');
  const myLast = norm(c.last || c.name.split(' ').slice(-1)[0]);
  return CUSTOMERS.filter(o=>{
    if(o.no === c.no || o.mergedInto) return false;
    const samePhone = o.phone.replace(/\s/g,'') === c.phone.replace(/\s/g,'');
    const sameNrc = o.nrc && o.nrc === c.nrc;
    const sameLast = myLast && norm(o.last || o.name.split(' ').slice(-1)[0]) === myLast;
    const sameDistrict = o.district === c.district;
    return samePhone || sameNrc || (sameLast && sameDistrict);
  });
}

function renderDuplicates(c){
  const dups = dupCandidates(c);
  el('actDupes').innerHTML = dups.length ? dups.map(o=>`
    <div class="lrow">
      <div class="lic" style="background:var(--amber-soft);color:#9A6A0D;font-size:9px">${initials(o.name)}</div>
      <div><div class="lt">${esc(o.name)}</div>
        <div class="ls">${o.no} · ${esc(o.phone)} · ${o.status} · ${mk2(exposure(o.no))} exposure</div></div>
      <div class="lr"><button class="btn btn-ghost" data-merge="${o.no}">Merge</button></div>
    </div>`).join('') :
    '<div class="empty">No duplicate records detected for this customer.</div>';
  el('actDupes').querySelectorAll('[data-merge]').forEach(b=>{
    b.onclick = ()=> mergeInto(c, cust(b.dataset.merge));
  });
}

function mergeInto(c, o){
  openModal('Merge duplicate records', c.no + ' ← ' + o.no,
    `<div class="note gold"><div>The surviving record is <b>${c.no} · ${esc(c.name)}</b>. Loans, repayments,
      messages and tickets on <b>${o.no} · ${esc(o.name)}</b> move across and the duplicate is retired.</div></div>
     <div class="statstrip">
       <div><b>${liveLoansOf(o.no).length}</b><span>Loans moving</span></div>
       <div><b>${paysOf(o.no).length}</b><span>Payments moving</span></div>
       <div><b>${o.messages.length}</b><span>Messages</span></div>
       <div><b>${mk2(exposure(o.no))}</b><span>Exposure</span></div>
     </div>`,
    [{label:'Cancel', act:'close'}, {label:'Merge records', cls:'btn-gold', act:()=>{
      LOANS.filter(l=>l.cust === o.no).forEach(l=>{ l.cust = c.no; l.custName = c.name; });
      PAYMENTS.filter(p=>p.cust === o.no).forEach(p=>{ p.cust = c.no; });
      o.messages.forEach(m=> c.messages.push(m));
      o.notes.forEach(n=> c.notes.push(n));
      o.guarantors.forEach(g=> c.guarantors.push(g));
      o.collateral.forEach(k=> c.collateral.push(k));
      o.assessments.forEach(a=> c.assessments.push(a));
      o.tickets.forEach(t=>{ if(!c.tickets.includes(t)) c.tickets.push(t); });
      const moved = o.no;
      o.status = 'Inactive';
      o.mergedInto = c.no;
      o.notes = [];
      o.history.unshift({when:TODAY, what:'Record merged into ' + c.no, amount:0, by:'Chikondi Mwale'});
      c.history.unshift({when:TODAY, what:'Duplicate record ' + moved + ' merged into this customer', amount:0, by:'Chikondi Mwale'});
      logAct(c, 'Merged duplicate ' + moved);
      logAct(o, 'Retired after merge into ' + c.no);
      renderAll(); fillDistrictFilter(); closeModal();
      toast('Merged ' + moved + ' into ' + c.no + '.');
    }}]);
}

function accountAction(c, key){
  if(key === 'edit'){ editProfile(c); return; }
  if(key === 'verify'){
    if(c.kyc === 'Verified'){ toast(esc(c.name) + ' is already verified.', 'info'); return; }
    goto('s5'); KYC.cust = c.no; renderKYC(); return;
  }
  if(key === 'portal'){
    const pin = String(Math.floor(1000 + Math.random()*9000));
    c.portal = true;
    c.messages.push({when:TODAY, channel:'SMS', type:'Portal',
      body:`Your Golden portal access has been reset. Temporary PIN ${pin}. Change it after signing in.`,
      by:'Chikondi Mwale'});
    c.history.unshift({when:TODAY, what:'Portal access reset — temporary PIN issued', amount:0, by:'Chikondi Mwale'});
    logAct(c, 'Portal access reset');
    renderAll();
    openModal('Portal access reset', c.no + ' · ' + c.name,
      `<div class="statstrip"><div><b>${pin}</b><span>Temporary PIN</span></div>
        <div><b>${esc(c.phone)}</b><span>Activation SMS</span></div></div>
       <div class="inline-note" style="margin-top:8px">The customer must change the PIN at first sign-in. The PIN is
         valid for 72 hours.</div>`,
      [{label:'Done', cls:'btn-gold', act:'close'}]);
    return;
  }
  if(key === 'merge'){ renderDuplicates(c); goto('s13');
    const dups = dupCandidates(c);
    if(!dups.length){ toast('No duplicates detected for ' + esc(c.name) + '.', 'info'); return; }
    mergeInto(c, dups[0]);
    return;
  }
  if(key === 'activate' || key === 'deactivate' || key === 'suspend' || key === 'restore' || key === 'close'){
    const map = {
      activate:  {title:'Activate account', next:'Active', reason:false},
      deactivate:{title:'Deactivate account', next:'Inactive', reason:true},
      suspend:   {title:'Suspend account', next:'Suspended', reason:true},
      restore:   {title:'Restore account', next:'Active', reason:true},
      close:     {title:'Close account', next:'Inactive', reason:true, close:true}
    }[key];
    const blocking = key === 'close' && liveLoansOf(c.no).length;
    openModal(map.title, c.no + ' · ' + c.name, `
      ${blocking ? `<div class="note gold"><div><b>Open facilities:</b> ${liveLoansOf(c.no).length} loan(s) with
        ${mk(exposure(c.no))} outstanding. Closing the record does not write these off — refer the balance to
        collections first.</div></div>` : ''}
      <div class="fg"><label>Current status</label><input value="${c.status}" disabled></div>
      <div class="fg" style="margin-top:8px"><label>New status</label><input value="${map.next}" disabled></div>
      ${map.reason ? `<div class="fg" style="margin-top:8px"><label>Reason</label>
        <select id="actReason">${(key==='restore' ? ['Arrears cleared','Appeal upheld','KYC completed','Management approval']
          : key==='close' ? ['Customer request','Dormant for over 12 months','Duplicate record','Business closed']
          : ['Arrears and failed contact','Fraud investigation','Customer request','KYC failure']).map(r=>`<option>${r}</option>`).join('')}</select></div>
        <div class="fg" style="margin-top:8px"><label>Notes</label><textarea id="actNotes" style="min-height:56px"></textarea></div>` : ''}
      ${key === 'close' ? `<div class="check" style="cursor:default"><span class="ck y">✓</span>
        <div><b>Portal access will be revoked</b><span class="s">The customer can no longer sign in after closure</span></div></div>` : ''}`,
      [{label:'Cancel', act:'close'}, {label:map.title, cls:'btn-gold', act:()=>{
        const reason = el('actReason') ? el('actReason').value : 'Administrative action';
        const notes = el('actNotes') ? el('actNotes').value.trim() : '';
        const prev = c.status;
        c.status = map.next;
        if(key === 'close'){ c.portal = false; c.closed = TODAY; }
        if(key === 'suspend') c.portal = false;
        const what = map.title + ' — ' + reason + (notes ? ' (' + notes + ')' : '');
        c.history.unshift({when:TODAY, what, amount:0, by:'Chikondi Mwale'});
        logAct(c, 'Status ' + prev + ' → ' + map.next + ' · ' + reason);
        if(key === 'suspend' || key === 'close'){
          c.messages.push({when:TODAY, channel:'SMS', type:'Account',
            body:`Dear ${c.first || c.name}, your account has been ${key === 'close' ? 'closed' : 'suspended'}. Reason: ${reason}. Call 0888 000 111 to discuss.`,
            by:'System'});
        }
        renderAll(); closeModal();
        toast(c.no + ' is now ' + map.next + '.');
      }}]);
  }
}

function wireActions(){
  el('actCust').addEventListener('change', ()=>{ ACT.cust = el('actCust').value; renderActions(); });
  el('actDupScan').onclick = ()=>{
    const c = cust(el('actCust').value || ACT.cust);
    renderDuplicates(c);
    const n = dupCandidates(c).length;
    toast(n ? n + ' possible duplicate(s) found.' : 'No duplicates found.', n ? 'info' : 'ok');
  };
}

/* ===================== 14 · REPORTS ===================== */
const RPT = {key:'register', as:''};

function reportData(key, as){
  const scoped = as ? CUSTOMERS.filter(c=>c.no === as) : CUSTOMERS;
  const D = (label, num) => num ? [label, 1] : [label];
  if(key === 'register'){
    return {title:'Customer register', sub:'Every customer record on the book',
      cols:[D('Customer no'),D('Name'),D('Type'),D('Category'),D('District'),D('Phone'),D('Status'),D('KYC'),D('Risk'),D('Joined'),D('Exposure',1),D('Arrears',1)],
      rows: scoped.map(c=>[c.no,c.name,c.type,c.category,c.district,c.phone,c.status,c.kyc,c.risk,c.joined,exposure(c.no),arrearsOf(c.no)]),
      sums:[10,11]};
  }
  if(key === 'new'){
    const rows = scoped.filter(c=>daysBetween(c.joined, TODAY) <= 60);
    return {title:'New registrations', sub:'Customers registered in the last 60 days',
      cols:[D('Customer no'),D('Name'),D('Type'),D('District'),D('Phone'),D('Status'),D('KYC'),D('Joined'),D('Days on book',1)],
      rows: rows.map(c=>[c.no,c.name,c.type,c.district,c.phone,c.status,c.kyc,c.joined,daysBetween(c.joined,TODAY)]),
      sums:[]};
  }
  if(key === 'kyc'){
    return {title:'Verified vs unverified', sub:'KYC position across the register',
      cols:[D('Customer no'),D('Name'),D('KYC status'),D('Checks passed',1),D('Documents missing',1),D('ID expiry'),D('Account status')],
      rows: scoped.map(c=>[c.no,c.name,c.kyc,kycScore(c),missingDocs(c),c.idExpiry,c.status]),
      sums:[3,4]};
  }
  if(key === 'borrowers'){
    const rows = scoped.filter(c=>liveLoansOf(c.no).length);
    return {title:'Active borrowers', sub:'Customers with at least one live facility',
      cols:[D('Customer no'),D('Name'),D('District'),D('Live loans',1),D('Outstanding',1),D('Arrears',1),D('Next due'),D('Risk')],
      rows: rows.map(c=>{
        const loans = liveLoansOf(c.no);
        const next = loans.map(l=>l.nextDue).filter(Boolean).sort()[0] || '';
        return [c.no,c.name,c.district,loans.length,exposure(c.no),arrearsOf(c.no),next,c.risk];
      }), sums:[4,5]};
  }
  if(key === 'overdue'){
    const rows = scoped.filter(c=>hasOverdue(c.no));
    return {title:'Overdue customers', sub:'Customers with instalments past their due date',
      cols:[D('Customer no'),D('Name'),D('District'),D('Phone'),D('Arrears',1),D('Days past due',1),D('Loans in arrears',1),D('Risk')],
      rows: rows.map(c=>{
        const loans = liveLoansOf(c.no).filter(l=>l.arrears > 0);
        return [c.no,c.name,c.district,c.phone,arrearsOf(c.no),Math.max(0,...loans.map(l=>l.dpd)),loans.length,c.risk];
      }), sums:[4,5]};
  }
  if(key === 'loans'){
    const rows = LOANS.filter(l=>!as || l.cust === as);
    return {title:'Loan history', sub:'Every facility on the customer book',
      cols:[D('Loan'),D('Customer'),D('Name'),D('Product'),D('Principal',1),D('Outstanding',1),D('Status'),D('Disbursed'),D('Closed')],
      rows: rows.map(l=>[l.id,l.cust,l.custName,l.product,l.principal,l.outstanding,l.status,l.disb,l.close||'']),
      sums:[4,5]};
  }
  if(key === 'repayments'){
    const rows = PAYMENTS.filter(p=>!as || p.cust === as).slice(0, 60);
    return {title:'Repayment history', sub:'Payments, fees and penalties received',
      cols:[D('Date'),D('Receipt'),D('Loan'),D('Customer'),D('Amount',1),D('Principal',1),D('Interest',1),D('Fees',1),D('Penalty',1),D('Type')],
      rows: rows.map(p=>[p.date,p.id,p.loan,p.cust,p.amount,p.principal,p.interest,p.fees,p.penalty,p.type]),
      sums:[4,5,6,7,8]};
  }
  if(key === 'financial'){
    const rows = scoped.map(c=>{
      const f = finOf(c.no);
      return [c.no,c.name,f.borrowed,f.prinRepaid,f.intPaid,f.fees,f.outPrin,f.outInt,f.arrears];
    });
    return {title:'Financial summary', sub:'Borrowed, repaid and owed by customer',
      cols:[D('Customer no'),D('Name'),D('Borrowed',1),D('Principal repaid',1),D('Interest paid',1),D('Fees & penalties',1),D('Outstanding principal',1),D('Outstanding interest',1),D('Arrears',1)],
      rows, sums:[2,3,4,5,6,7,8]};
  }
  const rowsScoped = scoped.map(c=>{
    const alerts = docAlertsFor(c);
    return [c.no,c.name,DOC_DEFS.filter(d=>c.docs[d.key].state==='ok').length,
      DOC_DEFS.filter(d=>c.docs[d.key].state==='missing').length,
      DOC_DEFS.filter(d=>c.docs[d.key].state==='expired').length,
      alerts.length, alerts.slice(0,3).map(a=>a.label).join('; ')];
  });
  return {title:'Documents & expiry', sub:'Document completeness and expiry alerts',
    cols:[D('Customer no'),D('Name'),D('On file',1),D('Missing',1),D('Expired',1),D('Alerts',1),D('Outstanding documents')],
    rows: rowsScoped, sums:[2,3,4,5]};
}

const REPORT_TILES = [
  ['register','Customer register','Every record on the book'],
  ['new','New registrations','Last 60 days'],
  ['kyc','Verified vs unverified','KYC position'],
  ['borrowers','Active borrowers','Live facilities'],
  ['overdue','Overdue customers','Arrears and DPD'],
  ['loans','Loan history','Every facility'],
  ['repayments','Repayment history','Receipts and penalties'],
  ['financial','Financial summary','Borrowed vs repaid'],
  ['docs','Documents & expiry','KYC document status']
];

function renderReports(){
  if(el('rpAs')) RPT.as = el('rpAs').value;
  const d = reportData(RPT.key, RPT.as);
  el('rpTiles').innerHTML = REPORT_TILES.map(([k,t,s])=>{
    const on = k === RPT.key;
    const rows = reportData(k, RPT.as).rows.length;
    return `<div class="mcard" data-rpt="${k}" style="cursor:pointer;${on?'border-color:var(--gold);background:#FFFCF0':''}">
      <div class="mh"><div class="mi">${on?'●':String(REPORT_TILES.findIndex(x=>x[0]===k)+1)}</div>
        <div><div class="mn">${t}</div><div class="md">${s}</div></div></div>
      <div class="mv">${rows} <small style="font-size:9px;font-weight:600;color:var(--muted)">rows</small></div>
    </div>`;
  }).join('');
  el('rpTiles').querySelectorAll('[data-rpt]').forEach(b=>{
    b.onclick = ()=>{ RPT.key = b.dataset.rpt; renderReports(); };
  });
  el('rpTitle').textContent = d.title;
  el('rpSub').textContent = d.sub + (RPT.as ? ' · ' + cust(RPT.as).name : '');
  el('rpRows').textContent = d.rows.length + ' rows';
  el('rpHead').innerHTML = '<tr>' + d.cols.map(([c,num])=>`<th${num?' class="num"':''}>${c}</th>`).join('') + '</tr>';
  el('rpBody').innerHTML = d.rows.length ? d.rows.map(r=>'<tr>' + r.map((v,i)=>{
    const num = d.cols[i] && d.cols[i][1];
    return `<td${num?' class="num"':''}>${num ? (typeof v === 'number' ? nf(v) : esc(v)) : esc(v)}</td>`;
  }).join('') + '</tr>').join('') :
    `<tr><td colspan="${d.cols.length}" class="empty">No rows for this report.</td></tr>`;
  el('rpNote').innerHTML = (d.sums || []).length ?
    '<b>Totals:</b> ' + d.sums.map(i=>`${d.cols[i][0]}: ${mk(sum(d.rows, r=>Number(r[i])||0))}`).join(' · ') :
    'No money columns in this report.';
}

function reportCsvRows(d){
  return [d.cols.map(c=>c[0])].concat(d.rows.map(r=>r.map(v=>typeof v === 'number' ? v : String(v))));
}

function exportReport(kind){
  const d = reportData(RPT.key, RPT.as);
  const base = d.title.toLowerCase().replace(/[^a-z0-9]+/g,'-');
  if(kind === 'csv'){
    downloadFile(base + '.csv', 'text/csv;charset=utf-8', '\ufeff' + toCsv(reportCsvRows(d)));
    toast('Exported ' + d.rows.length + ' rows to ' + base + '.csv');
  } else if(kind === 'xlsx'){
    try{ buildXlsx(base + '.xlsx', d); }
    catch(e){ downloadFile(base + '.csv', 'text/csv;charset=utf-8', '\ufeff' + toCsv(reportCsvRows(d))); }
  } else {
    printHtml(d.title, `<div class="tblwrap" style="max-height:none"><table class="tbl2">
      <thead><tr>${d.cols.map(([c,num])=>`<th${num?' class="num"':''}>${c}</th>`).join('')}</tr></thead>
      <tbody>${d.rows.map(r=>'<tr>' + r.map((v,i)=>{
        const num = d.cols[i] && d.cols[i][1];
        return `<td${num?' class="num"':''}>${num ? (typeof v==='number'?nf(v):esc(v)) : esc(v)}</td>`;
      }).join('') + '</tr>').join('')}</tbody></table></div>`);
  }
  logAct(cust(CUSTOMERS[0].no), 'Report exported — ' + d.title);
}

function wireReports(){
  el('rpAs').addEventListener('change', ()=>{ RPT.as = el('rpAs').value; renderReports(); });
  el('rpCsv').onclick = ()=>exportReport('csv');
  el('rpExcel').onclick = ()=>exportReport('xlsx');
  el('rpPrint').onclick = ()=>exportReport('pdf');
}

/* ===================== top bar & navigation ===================== */
function wireTop(){
  el('globalSearch').addEventListener('input', ()=>{
    CU.q = el('globalSearch').value;
    if(el('dirSearch')) el('dirSearch').value = CU.q;
    CU.page = 1;
    renderDirectory();
  });
  el('globalSearch').addEventListener('keydown', e=>{
    if(e.key === 'Enter'){ goto('s3'); }
  });
  el('newCustBtn').onclick = ()=>{ goto('s2'); if(el('cuFirst')) el('cuFirst').focus(); };
  el('newCustBtn2').onclick = ()=>{ goto('s2'); if(el('cuFirst')) el('cuFirst').focus(); };
  el('kycBtn').onclick = ()=>{ renderKYC(); goto('s5'); };
  el('ovOpenDir') && (el('ovOpenDir').onclick = ()=>{ CU.tab=''; CU.page = 1; syncDirTabs(); renderDirectory(); goto('s3'); });
  el('exportAll').onclick = ()=>exportRows('customers-all',
    ['Customer no','Name','Type','Category','District','Phone','Email','NRC','Status','KYC','Risk','Joined','Exposure','Arrears','Live loans'],
    custRows(), 'All customers');
  el('bellBtn').onclick = ()=>{
    const kyc = CUSTOMERS.filter(c=>c.kyc !== 'Verified');
    const arr = CUSTOMERS.filter(c=>hasOverdue(c.no));
    const tickets = TICKETS.filter(t=>t.status === 'New');
    openModal('Alerts', 'KYC, arrears and support',
      `<div class="lrow"><div class="lic" style="background:var(--amber-soft);color:#9A6A0D;font-size:9px">KYC</div>
        <div><div class="lt">${kyc.length} customers not verified</div>
          <div class="ls">${kyc.filter(c=>c.kyc==='Expired').length} with expired IDs</div></div>
        <div class="lr"><button class="btn btn-ghost" data-jump="s5">Open</button></div></div>
       <div class="lrow"><div class="lic" style="background:var(--red-soft);color:#B32C2C;font-size:9px">!</div>
        <div><div class="lt">${arr.length} customers in arrears</div>
          <div class="ls">${mk(sum(arr, c=>arrearsOf(c.no)))} past due</div></div>
        <div class="lr"><button class="btn btn-ghost" data-jump="s6">Open</button></div></div>
       <div class="lrow"><div class="lic" style="background:#EAF1FE;color:#2456C4;font-size:9px">TCK</div>
        <div><div class="lt">${tickets.length} new support tickets</div>
          <div class="ls">Logged and not yet picked up</div></div>
        <div class="lr"><button class="btn btn-ghost" data-jump="s12">Open</button></div></div>`,
      [{label:'Close', act:'close'}]);
    el('modalBody').querySelectorAll('[data-jump]').forEach(b=>{
      b.onclick = ()=>{ closeModal(); goto(b.dataset.jump); };
    });
  };
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
  renderDirectory();
  renderProfile();
  renderKYC();
  renderLoanAccounts();
  renderRepayments();
  renderFinancial();
  renderDocs();
  renderComms();
  renderRisk();
  renderSupport();
  renderActions();
  renderReports();
}

function boot(){
  fillSelects();
  fillDistrictFilter();
  seedHistory();
  seedExtras();
  seedTickets();
  CUSTOMERS.forEach(c=>{ if(!c.activity.length) logAct(c, 'Record opened for review'); });

  wireTop();
  wireRegistration();
  wireDirectory();
  wireProfile();
  wireKYC();
  wireLoanAccounts();
  wireRepayments();
  wireFinancial();
  wireDocs();
  wireComms();
  wireRisk();
  wireSupport();
  wireActions();
  wireReports();

  renderAll();
  spy();
}

window.CUSTOMERS_APP = {
  CUSTOMERS, LOANS, PAYMENTS, TICKETS, DOC_DEFS, PRODUCTS,
  renderAll, reportData, finOf, exposure, arrearsOf, kycScore,
  buildXlsx, exportReport, openCustomer, submitCustomer, mergeInto,
  pmt, statusTone, income: c=>c.income
};

boot();
</script>
</body>
</html>
