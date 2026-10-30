
/* ============================================================
   EXPORTS, PRINT, WIRING, BOOT
   ============================================================ */
const clean = v => String(v).replace(/<[^>]+>/g,'').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').trim();
/* the portal is often embedded in a sandboxed preview frame, where browsers block
   downloads and the print dialog — detect that so we never claim a false success */
const EMBEDDED = (()=>{ try{ return window.self !== window.top; }catch(e){ return true; } })();

function download(name, mime, data){
  try{
    const b = (data instanceof Blob) ? data : new Blob([data], {type:mime});
    const u = URL.createObjectURL(b);
    const a = document.createElement('a');
    a.href = u; a.download = name; a.rel = 'noopener';
    document.body.appendChild(a); a.click();
    setTimeout(()=>{ URL.revokeObjectURL(u); a.remove(); }, 1500);
    return true;
  }catch(e){ return false; }
}
function tableFor(rep, rows){
  const head = '<tr>' + rep.cols.map(c=>`<th>${clean(c)}</th>`).join('') + '</tr>';
  const body = rows.map(r=>'<tr>' + r.map(v=>`<td>${clean(v)}</td>`).join('') + '</tr>').join('');
  return head + body;
}
function tableView(rep, rows, max){
  const shown = rows.slice(0, 400);
  return `<div class="tblwrap" style="max-height:${max||320}px;border:1px solid var(--line);border-radius:10px">
      <table class="tbl2"><thead><tr>${rep.cols.map(c=>`<th>${clean(c)}</th>`).join('')}</tr></thead>
      <tbody>${shown.map(r=>`<tr>${r.map(v=>`<td>${v}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
    ${rows.length>400 ? `<div class="tiny muted" style="margin-top:6px">Previewing the first 400 of ${nf(rows.length)} rows.</div>` : ''}`;
}
function legacyCopy(text, done){
  try{
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.left = '-9999px';
    document.body.appendChild(ta); ta.select();
    const ok = document.execCommand('copy'); ta.remove(); done && done(ok);
  }catch(e){ done && done(false); }
}
function copyText(text, done){
  try{
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(text).then(()=>done&&done(true)).catch(()=>legacyCopy(text, done));
      return;
    }
  }catch(e){}
  legacyCopy(text, done);
}
function previewExport(rep, rows, label, text){
  openModal(rep.n + ' · ' + label + ' preview',
    rep.id + ' · ' + nf(rows.length) + ' rows · nothing was sent anywhere',
    `<div class="note" style="margin-bottom:10px;align-items:flex-start">
       <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex:0 0 14px;margin-top:1px"><circle cx="12" cy="12" r="9"/><path d="M12 8v4.5M12 16h.01"/></svg>
       <div>This page is running inside an embedded preview frame, and browsers block file
       downloads and the print dialog there. The ${label} content is below — copy it, or open
       <b>reports.html</b> in its own browser tab (or the live site) to download the file.</div>
     </div>${tableView(rep, rows, 340)}`,
    `<button class="btn btn-ghost" id="copyExport">Copy ${label}</button>
     <button class="btn btn-dark" id="closeExport">Close</button>`);
  const cp = el('copyExport');
  if(cp) cp.onclick = ()=> copyText(text || '', ok =>
    toast(ok ? label + ' copied to the clipboard' : 'Copy blocked — select the table and copy manually.', ok ? 'ok' : 'err'));
  const cl = el('closeExport'); if(cl) cl.onclick = closeModal;
}
function doExport(kind){
  const rep = byId(STATE.id);
  if(!canRun(rep)) return toast(`Access denied: ${VIEWROLE} cannot export ${rep.cat.name}.`,'err');
  readFilters();
  const rows = buildView(rep, STATE.f).rows;
  if(!rows.length) return toast('Nothing to export — no rows match these filters.','err');

  if(kind === 'csv'){
    const csv = [rep.cols.map(c=>`"${clean(c).replace(/"/g,'""')}"`).join(',')]
      .concat(rows.map(r=>r.map(v=>`"${clean(v).replace(/"/g,'""')}"`).join(','))).join('\r\n');
    logRun(rep, rows.length, EMBEDDED ? 'CSV · preview' : 'CSV');
    if(EMBEDDED) return previewExport(rep, rows, 'CSV', csv);
    const ok = download(`GFS_${rep.id}_2026-10-30.csv`, 'text/csv;charset=utf-8', '\ufeff' + csv);
    return ok ? toast(`CSV downloaded · ${nf(rows.length)} rows`,'ok')
              : toast('The browser blocked the download. Open the page in its own tab and retry.','err');
  }

  if(kind === 'xls'){
    let blob = null;
    try { blob = xlsxBlob(sheetFor(rep, rows, STATE.f)); } catch(e){ blob = null; }
    logRun(rep, rows.length, EMBEDDED ? 'Excel · preview' : 'Excel');
    if(!blob) return toast('Could not build the workbook.','err');
    if(EMBEDDED){
      const tsv = [rep.cols.map(clean).join('\t')]
        .concat(rows.map(r=>r.map(v=>clean(v)).join('\t'))).join('\n');
      return previewExport(rep, rows, 'Excel', tsv);
    }
    const ok = download(`GFS_${rep.id}_2026-10-30.xlsx`, blob.type, blob);
    return ok ? toast(`Excel workbook downloaded · ${nf(rows.length)} rows (.xlsx)`,'ok')
              : toast('The browser blocked the download. Open the page in its own tab and retry.','err');
  }

  if(EMBEDDED){
    logRun(rep, rows.length, kind === 'pdf' ? 'PDF · preview' : 'Print · preview');
    openModal(rep.n + (kind === 'pdf' ? ' · PDF export' : ' · Print preview'),
      rep.id + ' · ' + nf(rows.length) + ' rows',
      `<div class="note" style="margin-bottom:10px;align-items:flex-start">
         <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex:0 0 14px;margin-top:1px"><circle cx="12" cy="12" r="9"/><path d="M12 8v4.5M12 16h.01"/></svg>
         <div>Embedded previews cannot open the print dialog. This is exactly what the printed
         ${kind === 'pdf' ? 'PDF' : 'report'} would contain — open <b>reports.html</b> in its own tab to
         ${kind === 'pdf' ? 'save it as PDF' : 'print it'}.</div></div>${tableView(rep, rows, 380)}`,
      `<button class="btn btn-dark" id="closePrint">Close</button>`);
    const c = el('closePrint'); if(c) c.onclick = closeModal;
    return;
  }
  printReport(rep, rows.length, kind === 'pdf' ? 'PDF' : 'Print');
}
function printReport(rep, count, label){
  const prevSize = STATE.size;
  STATE.size = 100000; renderReport();
  el('s11').classList.add('print-target');
  let restored = false;
  const done = ()=>{
    if(restored) return; restored = true;
    el('s11').classList.remove('print-target');
    STATE.size = prevSize; renderReport();
    window.removeEventListener('afterprint', done);
  };
  window.addEventListener('afterprint', done);
  setTimeout(()=>{ try{ window.print(); }catch(e){ toast('This browser blocked the print dialog.','err'); done(); } }, 150);
  setTimeout(done, 60000);                       /* safety net if afterprint never fires */
  logRun(rep, count, label);
  toast(label === 'PDF' ? 'Choose “Save as PDF” in the print dialog.' : 'Print dialog opened — printing the full report.','info');
}

/* ---------- live search over the tile catalogue ---------- */
function tileSearch(q){
  q = (q||'').toLowerCase().trim();
  let shown = 0;
  CATS.forEach(c=>{
    let n = 0;
    el('grid'+c.n).querySelectorAll('.repcard').forEach(card=>{
      const r = byId(card.dataset.id);
      const hit = !q || (r.n+' '+r.d+' '+r.id+' '+c.name).toLowerCase().includes(q);
      card.style.display = hit ? '' : 'none';
      if(hit){ n++; shown++; }
    });
    const cnt = el('c'+c.n+'count');
    if(cnt) cnt.textContent = q ? `${n} of ${R_SETS[c.n-1].length} reports` : `${R_SETS[c.n-1].length} reports`;
  });
  const bt = el('bandReports'); if(bt) bt.textContent = q ? shown : REPORTS.length;
}

/* ---------- wiring ---------- */
function wire(){
  el('menuBtn').onclick = ()=> document.getElementById('sidebar').classList.toggle('open');
  document.querySelectorAll('.nav-item').forEach(item=>{
    item.addEventListener('click', e=>{
      const p = item.dataset.page;
      if(['dashboard','disbursements','notifications','staff','reports'].includes(p)) return;
      e.preventDefault(); toast('This module is queued for build.','info');
      document.getElementById('sidebar').classList.remove('open');
    });
  });

  const secs = [...document.querySelectorAll('.sec')], chips = [...document.querySelectorAll('.snav')];
  const spy = ()=>{ let cur = secs[0];
    for(const s of secs) if(s.getBoundingClientRect().top <= 150) cur = s;
    chips.forEach(c=>c.classList.toggle('on', c.getAttribute('href')==='#'+cur.id)); };
  window.addEventListener('scroll', spy, {passive:true}); spy();
  chips.forEach(c=>c.addEventListener('click', e=>{
    e.preventDefault();
    const t = document.querySelector(c.getAttribute('href'));
    if(t) window.scrollTo({top:t.offsetTop-104, behavior:'smooth'});
  }));

  el('datePresets').querySelectorAll('button').forEach(b=>b.onclick = ()=> presetDates(b.dataset.p));
  el('applyBtn').onclick = applyAndToast;
  el('resetBtn').onclick = ()=>{
    el('dtFrom').value = '2026-10-01'; el('dtTo').value = '2026-10-30';
    ['fldOfficer','fldBranch','fldProduct','fldStatus','advDpd','advSort'].forEach(id=>el(id).value='');
    ['advMin','advMax','advRef','repSearch'].forEach(id=>el(id).value='');
    document.querySelectorAll('#datePresets button').forEach(b=>b.classList.toggle('on', b.dataset.p==='30d'));
    readFilters(); renderReport();
    toast('Filters reset to the default 30 day range.','ok');
  };
  el('advToggle').onclick = ()=>{
    const p = el('advPanel'), open = p.style.display === 'none';
    p.style.display = open ? 'block' : 'none';
    el('advToggle').textContent = open ? 'Hide advanced filters' : 'Advanced filters';
  };
  let qT;
  el('repSearch').addEventListener('input', e=>{
    clearTimeout(qT);
    qT = setTimeout(()=>{ STATE.f.q = e.target.value.trim(); STATE.page = 1; renderReport(); }, 180);
  });
  ['fldOfficer','fldBranch','fldProduct','fldStatus','advDpd','advSort'].forEach(id=>{
    el(id).addEventListener('change', ()=>{ readFilters(); renderReport(); });
  });
  el('advMin').addEventListener('change', ()=>{ readFilters(); renderReport(); });
  el('advMax').addEventListener('change', ()=>{ readFilters(); renderReport(); });
  el('advRef').addEventListener('input', e=>{
    clearTimeout(qT);
    qT = setTimeout(()=>{ STATE.f.ref = e.target.value.trim(); STATE.page = 1; renderReport(); }, 200);
  });
  document.querySelectorAll('[data-act]').forEach(b=>{
    b.onclick = ()=>{
      const a = b.dataset.act;
      doExport(a==='exp-pdf' ? 'pdf' : a==='exp-xls' ? 'xls' : a==='exp-csv' ? 'csv' : 'print');
    };
  });

  el('viewRole').onchange = e=>{
    VIEWROLE = e.target.value;
    el('accessBadge').textContent = ROLEOF[VIEWROLE]==='full' ? 'Full access' : 'Read-only access';
    const bg = el('bandRole'); if(bg) bg.textContent = VIEWROLE.split(' /')[0];
    renderTiles(); renderReport();
    const cur = byId(STATE.id);
    toast(canRun(cur)
      ? `Now viewing as ${VIEWROLE} — ${ACCESS[VIEWROLE].length} of 10 categories available.`
      : `${VIEWROLE} cannot open ${cur.cat.name} reports — tiles for that category are locked.`,
      canRun(cur) ? 'ok' : 'info');
  };
  el('histExport').onclick = ()=>{
    const csv = ['"Time","Report","Report ID","User","Rows","Format"']
      .concat(HIST.map(h=>`"${h.t}","${h.name}","${h.id}","${h.user}",${h.rows},"${h.fmt}"`)).join('\r\n');
    download('report_generation_history.csv','text/csv;charset=utf-8','\ufeff'+csv);
    toast(`Generation log exported · ${HIST.length} entries`,'ok');
  };
  el('bellBtn').onclick = ()=>{ el('histBody').closest('.card').scrollIntoView({behavior:'smooth', block:'center'});
    toast(`${HIST.length} report generations logged`,'info'); };
  el('histBtn').onclick = ()=> el('histBody').closest('.card').scrollIntoView({behavior:'smooth', block:'center'});
  el('consoleBtn').onclick = ()=> el('s11').scrollIntoView({behavior:'smooth'});
  el('quickRun').onclick = ()=>{ el('s11').scrollIntoView({behavior:'smooth'});
    toast('Pick any report tile or use the console selector.','info'); };
  el('printBtn').onclick = ()=> doExport('print');
  let gT;
  el('globalSearch').addEventListener('input', e=>{
    clearTimeout(gT);
    gT = setTimeout(()=>tileSearch(e.target.value), 160);
  });
  el('modalClose').onclick = closeModal;
  el('modal').addEventListener('click', e=>{ if(e.target.id==='modal') closeModal(); });
  document.addEventListener('keydown', e=>{ if(e.key==='Escape') closeModal(); });
}
function closeModal(){ el('modal').classList.remove('on'); }
function openModal(title, sub, body, foot){
  el('modalTitle').textContent = title; el('modalSub').textContent = sub;
  el('modalBody').innerHTML = body; el('modalFoot').innerHTML = foot || '';
  el('modal').classList.add('on');
}
function fillSelects(){
  el('fldOfficer').innerHTML = '<option value="">All officers</option>' +
    OFFICERS.map(o=>`<option>${o}</option>`).join('');
  el('fldBranch').innerHTML = '<option value="">All branches</option>' +
    BRANCHES.map(b=>`<option>${b}</option>`).join('');
  el('fldProduct').innerHTML = '<option value="">All products</option>' +
    PRODUCTS.map(p=>`<option>${p}</option>`).join('');
  el('fldStatus').innerHTML = '<option value="">All statuses</option>' +
    ['Active','Fully Paid','Pending','Approved','Rejected','Cancelled','Posted','Partial','Reversed','Disputed','Inactive','Blocked']
      .map(s=>`<option>${s}</option>`).join('');
}

/* ---------- boot ---------- */
(function boot(){
  fillSelects();
  renderTiles();
  drawCharts();
  renderHist();
  renderAccess();
  renderReport();
  wire();
  const bt = el('bandToday'); if(bt) bt.textContent = HIST.filter(h=>h.t.startsWith('2026-10-30')).length;
  setTimeout(()=>toast(`${REPORTS.length} reports ready · ${REPAYS.length} receipts, ${LOANS.length} loans in the sample period`,'ok'), 500);
})();

/* never used in this module but kept for shared shell parity */
function openReportHelp(){
  openModal('How the report console works','Filters · totals · exports · history',
    '<ul style="font-size:12px;line-height:1.7;padding-left:18px">'+
    '<li>Pick any tile or use the console to load a report.</li>'+
    '<li>Date presets, officer, branch, product and status filters run together.</li>'+
    '<li>Totals, pagination and exports always reflect the filtered set.</li>'+
    '<li>Every export and print is written to the generation history.</li></ul>','');
}
</script>
</body>
</html>
