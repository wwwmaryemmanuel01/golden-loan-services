
/* ============================================================
   REPORT CONSOLE ENGINE
   ============================================================ */
const DATA = {loans:LOANS, reps:REPAYS, custs:CUSTOMERS, apps:APPS, staff:STAFFAGG};
const STATE = {id:'EXE-02', page:1, size:10,
  f:{from:'2026-10-01', to:'2026-10-30', officer:'', branch:'', product:'', status:'',
     min:null, max:null, dpd:'', sort:'', ref:'', q:''}};

const currencyIdx = rows => {
  const n = rows.length || 1;
  for(let i=0;i<(rows[0]||[]).length;i++){
    const hits = rows.filter(r=>typeof r[i]==='string' && r[i].includes('MK')).length;
    if(hits/n > 0.6) return i;
  }
  return null;
};
function filterCustom(rows, f){
  let out = rows;
  if(f.q) out = out.filter(r=>matchQ(r, f.q));
  if(f.ref) out = out.filter(r=>r.join(' ').toLowerCase().includes(f.ref.toLowerCase()));
  if(f.officer) out = out.filter(r=>r.join(' ').includes(f.officer));
  if(f.branch) out = out.filter(r=>r.join(' ').includes(f.branch));
  if(f.product) out = out.filter(r=>r.join(' ').includes(f.product));
  if(f.status) out = out.filter(r=>r.join(' ').includes(f.status));
  if(f.min!=null || f.max!=null){
    const idx = currencyIdx(out);
    if(idx!=null) out = applyAdv(out, f, idx);
  }
  if(f.sort){
    const idx = currencyIdx(out);
    out = applyAdv(out, {sort:f.sort}, idx);
  }
  return out;
}
function buildView(rep, f){
  if(rep.rows){
    return {cols:rep.cols, rows:filterCustom(rep.rows(f), f), objs:null};
  }
  const set = DATA[rep.src] || [];
  let objs = set.filter(x=>baseFilter(x, f, rep.src));
  if(rep.filter) objs = objs.filter(x=>rep.filter(x, f));
  if(f.status) objs = objs.filter(x=>(x.status||x.role||'')===f.status);
  if(f.dpd!=='' && rep.src==='loans') objs = objs.filter(x=>f.dpd==='0' ? x.dpd===0 : x.dpd>=Number(f.dpd));
  if(rep.sort) objs = objs.slice().sort(rep.sort);
  else if(rep.src==='loans') objs = objs.slice().sort((a,b)=>b.balance-a.balance);
  else if(rep.src==='reps') objs = objs.slice().sort((a,b)=>b.date.localeCompare(a.date));
  const rows = objs.map(rep.row);
  return {cols:rep.cols, rows:filterCustom(rows, f), objs};
}
function moneyCell(v){
  const s = String(v);
  if(/MK|%|d$/.test(s) && /\d/.test(s)) return 'num mono';
  if(/^-?[\d,]+(\.\d+)?$/.test(s)) return 'num';
  return '';
}
function amtVal(v){
  const str = String(v).replace(/&nbsp;/g,' ');
  const m = str.match(/(-?\d[\d,]*(?:\.\d+)?)(\s*[MK])?/);
  if(!m) return null;
  let n = parseFloat(m[1].replace(/,/g,''));
  const suf = (m[2]||'').trim();
  if(suf==='M') n *= 1e6; else if(suf==='K') n *= 1e3;
  return isNaN(n) ? null : n;
}
function totalsHTML(rep, rows, objs){
  if(!rep.rows && STATS[rep.src] && objs){
    const st = STATS[rep.src](objs);
    return st.map(c=>`<div class="t"><div class="k">${c.k}</div><div class="v">${c.v}</div>
      <div class="s">${c.s}</div></div>`).join('') +
      `<div class="t"><div class="k">Rows in view</div><div class="v">${nf(rows.length)}</div>
        <div class="s">after filters</div></div>`;
  }
  const n = rows.length, cells = [];
  rep.cols.forEach((c,i)=>{
    const vals = rows.map(r=>r[i]).filter(v=>/MK/.test(String(v)) && !/%/.test(String(v)) && /\d/.test(String(v)));
    if(n && vals.length/n > 0.5){
      const total = vals.reduce((a,v)=>a+(amtVal(v)||0),0);
      cells.push({k:c, v: Math.abs(total)>=1e6 ? mkm(total) : mk(total), s:'column total'});
    }
  });
  const out = [{k:'Rows in view', v:nf(n), s:'after filters'}]
    .concat(cells.slice(0,2));
  out.push({k:'Period', v:(STATE.f.from||'—').slice(5)+' → '+(STATE.f.to||'—').slice(5),
    s: rep.cat.name});
  if(out.length < 3) out.push({k:'Columns', v:nf(rep.cols.length), s:'in this report'});
  return out.slice(0,4).map(c=>`<div class="t"><div class="k">${c.k}</div><div class="v">${c.v}</div>
    <div class="s">${c.s}</div></div>`).join('');
}
function renderReport(){
  const rep = byId(STATE.id);
  if(!rep) return;
  const f = STATE.f;
  el('repCat').textContent = rep.cat.name;
  el('repTitle').textContent = rep.n;
  el('repId').textContent = rep.id;
  el('repDesc').textContent = rep.d;
  const allowed = canRun(rep);
  const view = buildView(rep, f);
  const rows = view.rows;
  const pages = Math.max(1, Math.ceil(rows.length/STATE.size));
  STATE.page = Math.min(STATE.page, pages);
  const start = (STATE.page-1)*STATE.size;
  const slice = rows.slice(start, start+STATE.size);

  el('repHead').innerHTML = '<tr>' + rep.cols.map((c,i)=>`<th class="${i? 'num':''}">${c}</th>`).join('') + '</tr>';
  el('repBody').innerHTML = !allowed
    ? `<tr><td colspan="${rep.cols.length}" style="padding:26px;text-align:center">
        <b>Restricted report</b><div class="tiny muted" style="margin-top:3px">${VIEWROLE} does not have access to
        ${rep.cat.name} reports. Switch the role selector to Super Admin to view it.</div></td></tr>`
    : rows.length===0
    ? `<tr><td colspan="${rep.cols.length}" style="padding:26px;text-align:center" class="muted">
        No records match the current filters. Widen the date range or clear the filters.</td></tr>`
    : slice.map(r=>'<tr>' + r.map((v,i)=>{
        const cls = i===0 ? '' : moneyCell(v);
        return `<td class="${cls}">${v}</td>`;
      }).join('') + '</tr>').join('');

  el('repTotals').innerHTML = allowed ? totalsHTML(rep, rows, view.objs)
    : '<div class="t"><div class="k">Access</div><div class="v">Restricted</div><div class="s">role based</div></div>';

  el('repPager').innerHTML = allowed ? `<span>${rows.length ? start+1 : 0}–${Math.min(start+STATE.size, rows.length)} of ${nf(rows.length)} rows</span>
    <button data-pg="first" ${STATE.page===1?'disabled':''}>«</button>
    <button data-pg="prev" ${STATE.page===1?'disabled':''}>Prev</button>
    <span style="font-weight:700;color:var(--ink)">Page ${STATE.page} / ${pages}</span>
    <button data-pg="next" ${STATE.page===pages?'disabled':''}>Next</button>
    <button data-pg="last" ${STATE.page===pages?'disabled':''}>»</button>
    <select id="pgSize" style="border:1px solid var(--line);border-radius:7px;padding:3px 6px;font-family:inherit;font-size:11px">
      ${[10,25,50,100].map(n=>`<option ${STATE.size===n?'selected':''}>${n}</option>`).join('')}
    </select>` : '';
  const pgSize = el('pgSize');
  if(pgSize) pgSize.onchange = ()=>{ STATE.size = +pgSize.value; STATE.page = 1; renderReport(); };
  el('repPager').querySelectorAll('[data-pg]').forEach(b=>{
    b.onclick = ()=>{
      const a = b.dataset.pg;
      STATE.page = a==='first'?1 : a==='last'? pages : a==='next'? STATE.page+1 : STATE.page-1;
      renderReport();
    };
  });
  document.querySelectorAll('.repcard').forEach(c=>c.classList.toggle('active', c.dataset.id===rep.id));
  const br = el('bandRows'); if(br) br.textContent = nf(rows.length);
  return rows;
}

const ASPLIT = '2026-10-30';
function selectReport(id, scroll){
  const rep = byId(id); if(!rep) return;
  STATE.id = id; STATE.page = 1;
  renderReport();
  if(scroll){
    const t = el('s11');
    window.scrollTo({top:t.offsetTop-104, behavior:'smooth'});
    toast(`${rep.id} · ${rep.n} loaded`,'ok');
  }
}

/* ---------- filters ---------- */
function readFilters(){
  const f = STATE.f;
  f.from = el('dtFrom').value; f.to = el('dtTo').value;
  f.officer = el('fldOfficer').value; f.branch = el('fldBranch').value;
  f.product = el('fldProduct').value; f.status = el('fldStatus').value;
  f.min = el('advMin').value ? +el('advMin').value : null;
  f.max = el('advMax').value ? +el('advMax').value : null;
  f.dpd = el('advDpd').value; f.sort = el('advSort').value;
  f.ref = el('advRef').value.trim(); f.q = el('repSearch').value.trim();
  STATE.page = 1;
}
function presetDates(p){
  const set = (a,b)=>{ el('dtFrom').value = a; el('dtTo').value = b; };
  if(p==='today') set(ASPLIT, ASPLIT);
  else if(p==='7d') set('2026-10-24', ASPLIT);
  else if(p==='30d') set('2026-10-01', ASPLIT);
  else if(p==='mtd') set('2026-10-01', ASPLIT);
  else if(p==='qtd') set('2026-10-01', ASPLIT);
  else if(p==='ytd') set('2026-01-01', ASPLIT);
  document.querySelectorAll('#datePresets button').forEach(b=>b.classList.toggle('on', b.dataset.p===p));
  readFilters(); curRows = renderReport() || [];
}
let curRows = [];
function run(fmt){
  readFilters();
  const rep = byId(STATE.id);
  if(!canRun(rep)) return toast(`Access denied for ${VIEWROLE}.`,'err');
  const rows = renderReport() || [];
  curRows = rows;
  if(fmt) logRun(rep, rows.length, fmt);
  return rows;
}
function applyAndToast(){
  const rows = run();
  toast(`${byId(STATE.id).id} · ${nf(rows.length)} rows match your filters`,'ok');
}
