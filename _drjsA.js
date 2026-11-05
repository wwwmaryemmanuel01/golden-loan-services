<script>
/* ============================================================
   DATA RECOVERY, SYSTEM BACKUP & FACTORY RESET (1/6)
   Formatters, the inline-SVG chart engine, the sortable/paged
   table renderer and the small UI primitives every section of
   this module draws with. Nothing here touches a provider: the
   figures come from the backup book in (2/6).
   ============================================================ */
const el = id => document.getElementById(id);
const esc = s => String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const sum = (a,f) => a.reduce((s,x)=>s+(f?Number(f(x))||0:Number(x)||0),0);
const clamp = (v,a,b) => Math.max(a, Math.min(b, v));
const pct = (a,b) => b ? (a/b*100) : 0;
const r1 = v => Math.round(v*10)/10;
const pad = (s,n) => String(s).padStart(n,'0');

/* ---------------- display settings ---------------- */
const SET = { currency:'MK', decimals:0, numberFormat:'comma', showLegend:true };

function num(v, dec){
  const d = dec === undefined ? SET.decimals : dec;
  const n = Number(v)||0;
  const parts = Math.abs(n).toFixed(d).split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return (n<0?'-':'') + parts.join('.');
}
function money(v, dec){
  const n = Number(v)||0;
  return 'MK ' + (n<0?'-':'') + num(Math.abs(n), dec);
}
function compact(v){
  const a = Math.abs(Number(v)||0), sign = v<0 ? '-' : '';
  if(a >= 1e9) return sign+'MK '+(a/1e9).toFixed(1)+'B';
  if(a >= 1e6) return sign+'MK '+(a/1e6).toFixed(a>=1e7?0:1)+'M';
  if(a >= 1e3) return sign+'MK '+Math.round(a/1e3)+'k';
  return sign+'MK '+Math.round(a);
}
const shortNum = v => {
  const a = Math.abs(Number(v)||0);
  if(a >= 1e6) return (v/1e6).toFixed(a>=1e7?0:1)+'M';
  if(a >= 1e3) return Math.round(v/1e3)+'k';
  return String(Math.round(v));
};
const bytes = mb => mb >= 1024 ? (mb/1024).toFixed(mb>=10240?0:1) + ' GB' : (Math.round(mb*10)/10) + ' MB';

/* ---------------- dates ---------------- */
const TODAY = '2026-10-30';
const NOW = '2026-10-30 09:42';
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DOW = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const asDate = iso => new Date(String(iso).slice(0,10) + 'T00:00:00');
const isoOf = d => d.toISOString().slice(0,10);
const addDays = (iso,n) => { const d = asDate(iso); d.setDate(d.getDate()+n); return isoOf(d); };
const addMonths = (iso,n) => { const d = asDate(iso); const day = d.getDate(); d.setDate(1); d.setMonth(d.getMonth()+n); d.setDate(Math.min(day,28)); return isoOf(d); };
const daysBetween = (a,b) => Math.round((asDate(b) - asDate(a))/86400000);
const monthKey = iso => String(iso).slice(0,7);
const monthLabel = k => MONTH_NAMES[Number(k.slice(5,7))-1] + ' ' + k.slice(2,4);
function fmtDate(iso){
  if(!iso) return '—';
  const d = asDate(iso);
  return String(d.getDate()).padStart(2,'0') + ' ' + MONTH_NAMES[d.getMonth()] + ' ' + d.getFullYear();
}
const fmtShort = iso => fmtDate(iso).slice(0,6);
/* a stored timestamp reads as a date, with the time when one is held */
function drWhen(v){
  const s = String(v == null ? '' : v).trim();
  if(!s) return '—';
  const day = s.slice(0,10), time = s.length > 10 ? s.slice(11,16) : '';
  const out = /^\d{4}-\d{2}-\d{2}$/.test(day) ? fmtDate(day) : day;
  return time ? out + ' · ' + time : out;
}
const ageLabel = iso => {
  const d = daysBetween(String(iso).slice(0,10), TODAY);
  if(d <= 0) return 'today';
  return d === 1 ? '1 day ago' : d + ' days ago';
};
const MONTHS = (()=>{ const out=[]; let y=2025,m=8;
  for(let i=0;i<15;i++){ out.push(y+'-'+pad(m,2)); m++; if(m>12){m=1;y++;} }
  return out; })();
const MONTHS12 = MONTHS.slice(-12);

/* ---------------- seeded random ---------------- */
let SEED = 20261103;
function rnd(){ SEED = (SEED*1664525 + 1013904223) % 4294967296; return SEED/4294967296; }
function ri(a,b){ return a + Math.floor(rnd()*(b-a+1)); }
function pick(a){ return a[Math.floor(rnd()*a.length)]; }

/* ---------------- toast, modal, confirm ---------------- */
function toast(msg, type='ok'){
  const t = document.createElement('div');
  t.className = 'toast ' + type;
  t.innerHTML = `<span>${type==='err'?'⚠':type==='info'?'ℹ':'✓'}</span><div>${esc(msg)}</div>`;
  const host = el('toasts'); if(!host) return;
  host.appendChild(t);
  setTimeout(()=>{ t.style.opacity='0'; t.style.transform='translateX(16px)'; t.style.transition='.25s'; }, 2600);
  setTimeout(()=>t.remove(), 3000);
}
function openModal(title, sub, body, actions=[]){
  el('modalTitle').textContent = title;
  el('modalSub').textContent = sub;
  el('modalBody').innerHTML = body;
  el('modalFoot').innerHTML = '';
  actions.forEach(a=>{
    const b = document.createElement('button');
    b.className = 'btn ' + (a.cls || 'btn-ghost');
    b.textContent = a.label;
    if(a.id) b.id = a.id;
    b.onclick = a.act === 'close' ? closeModal : a.act;
    el('modalFoot').appendChild(b);
  });
  el('modal').classList.add('on');
}
function closeModal(){
  const m = el('modal');
  if(m) m.classList.remove('on');
}

const PALETTE = ['#C9A227','#1E9E6A','#2F6FED','#D93F3F','#7C5CF0','#E08C1E','#0E9AA7','#8A90A0','#B58C1B','#4A5160'];

function niceMax(v){
  if(!isFinite(v) || v <= 0) return 10;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v/p;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10;
  return step*p;
}
function axisFmt(v){
  const a = Math.abs(v);
  if(a >= 1e6) return (v/1e6).toFixed(a>=1e7?0:1)+'M';
  if(a >= 1e3) return Math.round(v/1e3)+'k';
  return String(Math.round(v*10)/10);
}

function chart(o){
  const type = o.type || 'bar';
  const series = (o.series||[]).filter(s=>s && s.data);
  const cats = o.cats || (series[0] ? series[0].data.map((_,i)=> String(i+1)) : []);
  const H = o.h || 210;
  if(!series.length || !series.some(s=> s.data.some(v=> Number(v)!==0))){
    return `<div class="empty" style="padding:26px 0">No data for the selected filters.</div>`;
  }
  if(type === 'pie' || type === 'donut'){
    const vals = series[0].data.map((v,i)=>({label: cats[i], value: Number(v)||0, colour: (o.colours||PALETTE)[i%PALETTE.length]}));
    return pieSvg(vals, type === 'donut', H) + legend(vals.map(v=>({name:v.label, colour:v.colour})));
  }
  return cartesian({...o, type, series, cats, H});
}

function legend(items){
  if(!SET.showLegend) return '';
  return `<div class="legend">${items.map(i=>`<b><i style="background:${i.colour}"></i>${esc(i.name)}</b>`).join('')}</div>`;
}

function pieSvg(items, donut, H){
  const total = items.reduce((s,i)=>s+i.value,0) || 1;
  const W = 380, h = H, cx = 120, cy = h/2, R = Math.min(h/2-8, 88), r = donut ? R*0.58 : 0;
  let a0 = -Math.PI/2, out = '';
  items.forEach(it=>{
    const frac = it.value/total;
    const a1 = a0 + frac*Math.PI*2;
    const large = frac > 0.5 ? 1 : 0;
    const x0 = cx + R*Math.cos(a0), y0 = cy + R*Math.sin(a0);
    const x1 = cx + R*Math.cos(a1), y1 = cy + R*Math.sin(a1);
    let d;
    if(frac > 0.999){
      d = `M ${cx} ${cy-R} A ${R} ${R} 0 1 1 ${cx-0.01} ${cy-R} Z`;
    } else if(donut){
      const ix0 = cx + r*Math.cos(a1), iy0 = cy + r*Math.sin(a1);
      const ix1 = cx + r*Math.cos(a0), iy1 = cy + r*Math.sin(a0);
      d = `M ${x0.toFixed(1)} ${y0.toFixed(1)} A ${R} ${R} 0 ${large} 1 ${x1.toFixed(1)} ${y1.toFixed(1)} L ${ix0.toFixed(1)} ${iy0.toFixed(1)} A ${r} ${r} 0 ${large} 0 ${ix1.toFixed(1)} ${iy1.toFixed(1)} Z`;
    } else {
      d = `M ${cx} ${cy} L ${x0.toFixed(1)} ${y0.toFixed(1)} A ${R} ${R} 0 ${large} 1 ${x1.toFixed(1)} ${y1.toFixed(1)} Z`;
    }
    out += `<path d="${d}" fill="${it.colour}" stroke="#fff" stroke-width="1.5"><title>${esc(it.label)}: ${num(it.value)} (${(frac*100).toFixed(1)}%)</title></path>`;
    a0 = a1;
  });
  const centre = donut ? `<text x="${cx}" y="${cy-2}" text-anchor="middle" font-size="15" font-weight="800" fill="#0F1115">${num(total)}</text>
    <text x="${cx}" y="${cy+13}" text-anchor="middle" font-size="9" fill="#1F2430">TOTAL</text>` : '';
  const rows = items.map((it,i)=>`
    <g>
      <rect x="236" y="${16+i*20}" width="9" height="9" rx="2" fill="${it.colour}"></rect>
      <text x="251" y="${24+i*20}" font-size="10" fill="#2B303B">${esc(String(it.label).slice(0,22))}</text>
      <text x="366" y="${24+i*20}" font-size="10" text-anchor="end" fill="#1F2430">${(it.value/total*100).toFixed(1)}%</text>
    </g>`).join('');
  return `<div class="chartsvg"><svg viewBox="0 0 ${W} ${h}" role="img" aria-label="${esc(o_label||'chart')}">${out}${centre}${rows}</svg></div>`;
}
const o_label = 'chart';

function cartesian(o){
  const {type, series, cats, H} = o;
  const stacked = type === 'stacked';
  const W = 720, padL = 52, padR = 12, padT = 14;
  const padB = cats.length > 9 ? 40 : 26;
  const iw = W - padL - padR, ih = H - padT - padB;
  let maxV;
  if(stacked){
    maxV = Math.max(...cats.map((_,i)=> series.reduce((s,x)=> s + (Number(x.data[i])||0), 0)));
  } else {
    maxV = Math.max(...series.map(s=> Math.max(...s.data.map(v=> Number(v)||0))));
  }
  const minV = Math.min(0, ...series.flatMap(s=> s.data.map(v=> Number(v)||0)));
  const top = niceMax(maxV || 1);
  const bot = minV < 0 ? -niceMax(-minV) : 0;
  const y = v => padT + ih - ((v - bot)/(top - bot))*ih;
  const stepX = cats.length ? iw/cats.length : iw;
  let g = '';
  /* grid */
  const ticks = 4;
  for(let i=0;i<=ticks;i++){
    const v = bot + (top-bot)*i/ticks;
    const yy = y(v);
    g += `<line x1="${padL}" y1="${yy.toFixed(1)}" x2="${W-padR}" y2="${yy.toFixed(1)}" stroke="#EDEFF4" stroke-width="1" ${SET.showGrid?'':'opacity="0"'}/>`;
    g += `<text x="${padL-7}" y="${(yy+3).toFixed(1)}" font-size="9" text-anchor="end" fill="#1F2430">${axisFmt(v)}</text>`;
  }
  /* x labels */
  cats.forEach((c,i)=>{
    const x = padL + stepX*i + stepX/2;
    const label = String(c);
    if(cats.length > 9 && i % 2) return;
    g += `<text x="${x.toFixed(1)}" y="${H-8}" font-size="9" text-anchor="middle" fill="#1F2430">${esc(label)}</text>`;
  });
  if(type === 'bar' || type === 'stacked'){
    const bw = stacked ? Math.min(38, stepX*0.62) : Math.min(22, stepX*0.7/series.length);
    cats.forEach((c,i)=>{
      let acc = 0;
      series.forEach((s,si)=>{
        const v = Number(s.data[i])||0;
        const colour = s.colour || PALETTE[si%PALETTE.length];
        if(stacked){
          const y0 = y(acc + v), y1 = y(acc);
          const x = padL + stepX*i + stepX/2 - bw/2;
          if(v) g += `<rect x="${x.toFixed(1)}" y="${y0.toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(0,(y1-y0)).toFixed(1)}" fill="${colour}" rx="1.5"><title>${esc(s.name)} · ${esc(String(c))}: ${num(v)}</title></rect>`;
          acc += v;
        } else {
          const x = padL + stepX*i + stepX/2 - (bw*series.length)/2 + si*bw;
          const y0 = y(Math.max(0,v)), y1 = y(Math.max(0,0));
          const yTop = v >= 0 ? y0 : y(0);
          const hgt = Math.abs(y(v) - y(0));
          g += `<rect x="${x.toFixed(1)}" y="${(v>=0?y(v):y(0)).toFixed(1)}" width="${Math.max(2,bw-1).toFixed(1)}" height="${Math.max(0,hgt).toFixed(1)}" fill="${colour}" rx="1.5"><title>${esc(s.name)} · ${esc(String(c))}: ${num(v)}</title></rect>`;
          if(SET.showValues && v && cats.length <= 14)
            g += `<text x="${(x+bw/2).toFixed(1)}" y="${(y(v)-3).toFixed(1)}" font-size="8" text-anchor="middle" fill="#1F2430">${shortNum(v)}</text>`;
        }
      });
    });
  } else {
    series.forEach((s,si)=>{
      const colour = s.colour || PALETTE[si%PALETTE.length];
      const pts = s.data.map((v,i)=> [padL + stepX*i + stepX/2, y(Number(v)||0)]);
      if(type === 'area'){
        const base = y(0);
        const path = `M ${pts[0][0].toFixed(1)} ${base.toFixed(1)} ` + pts.map(p=>`L ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ') + ` L ${pts[pts.length-1][0].toFixed(1)} ${base.toFixed(1)} Z`;
        g += `<path d="${path}" fill="${colour}" opacity="0.16"></path>`;
      }
      g += `<polyline fill="none" stroke="${colour}" stroke-width="2.2" stroke-linejoin="round" points="${pts.map(p=>p[0].toFixed(1)+','+p[1].toFixed(1)).join(' ')}"></polyline>`;
      pts.forEach((p,i)=>{
        g += `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="2.6" fill="#fff" stroke="${colour}" stroke-width="2"><title>${esc(s.name)} · ${esc(String(cats[i]))}: ${num(s.data[i])}</title></circle>`;
        if(SET.showValues && cats.length <= 14)
          g += `<text x="${p[0].toFixed(1)}" y="${(p[1]-7).toFixed(1)}" font-size="8" text-anchor="middle" fill="#1F2430">${shortNum(Number(s.data[i])||0)}</text>`;
      });
    });
  }
  return `<div class="chartsvg"><svg viewBox="0 0 ${W} ${H}" role="img">${g}</svg></div>` +
    legend(series.map((s,i)=>({name:s.name, colour:s.colour || PALETTE[i%PALETTE.length]})));
}

/* card wrapper used by every graph section */
function chartCard(o){
  const body = o.chart || '';
  return `<div class="chartcard">
    <div class="ch">
      <div><div class="ct">${esc(o.title)}</div><div class="cs">${esc(o.sub || '')}</div></div>
      <div style="text-align:right">${o.value !== undefined ? `<div class="cv">${o.value}</div>` : ''}
        ${o.delta !== undefined ? delta(o.delta) : ''}</div>
    </div>
    ${body}
    ${o.note ? `<div class="qhint">${o.note}</div>` : ''}
  </div>`;
}
function delta(v, invert){
  const good = invert ? v <= 0 : v >= 0;
  const cls = Math.abs(v) < 0.05 ? 'flat' : good ? 'up' : 'down';
  const arrow = Math.abs(v) < 0.05 ? '→' : v > 0 ? '▲' : '▼';
  const mag = Math.abs(v);
  // A percentage beyond 999% on a thin base reads as noise — show a multiplier instead.
  const text = mag >= 999.5 ? num(Math.round(mag/100)) + '×' : mag.toFixed(1) + '%';
  return `<span class="delta ${cls}">${arrow} ${text}</span>`;
}

function expectedByBucket(loans){
  const keys = buckets();
  const monthDue = {};
  loans.forEach(l=>{
    for(let k=1;k<=l.term;k++){
      const mk = addMonths(l.date, k).slice(0,7);
      monthDue[mk] = (monthDue[mk]||0) + l.instalment;
    }
  });
  return keys.map(key=>{
    if(FILTER.grain === 'year')
      return Object.entries(monthDue).filter(([m])=> m.slice(0,4) === key).reduce((s,[,v])=> s+v, 0);
    const mk = FILTER.grain === 'month' ? key : key.slice(0,7);
    const factor = FILTER.grain === 'day' ? 1/30 : FILTER.grain === 'week' ? 7/30 : 1;
    return (monthDue[mk]||0) * factor;
  });
}

const kpiCard = (l, v, s, k='') => `<div class="kpi ${k}"><div class="kl">${l}</div><div class="kv">${v}</div><div class="ks">${s}</div></div>`;

/* ---------------- sortable, paged table ---------------- */
const TBL = {};
function table(hostId, cols, rows, opts = {}){
  const st = TBL[hostId] = TBL[hostId] || {sort: opts.sort || cols[0].k, dir: opts.dir || 'desc', page: 1};
  const pageSize = opts.pageSize || 8;
  const list = rows.slice();
  const col = cols.find(c => c.k === st.sort) || cols[0];
  list.sort((a,b)=>{
    const x = col.num ? Number(a[st.sort])||0 : String(a[st.sort]==null?'':a[st.sort]).toLowerCase();
    const y = col.num ? Number(b[st.sort])||0 : String(b[st.sort]==null?'':b[st.sort]).toLowerCase();
    if(x < y) return st.dir === 'asc' ? -1 : 1;
    if(x > y) return st.dir === 'asc' ? 1 : -1;
    return 0;
  });
  const pages = Math.max(1, Math.ceil(list.length / pageSize));
  st.page = Math.min(st.page, pages);
  st.rows = list;
  const slice = list.slice((st.page-1)*pageSize, st.page*pageSize);
  const head = cols.map(c => `<th class="sortable${c.num?' num':''}" data-drtsort="${hostId}" data-k="${c.k}">`
    + `${esc(c.label)}${st.sort === c.k ? `<span class="ar">${st.dir==='asc'?'▲':'▼'}</span>` : ''}</th>`).join('');
  const body = slice.map((r,i) => {
    const idx = (st.page-1)*pageSize + i;
    return `<tr class="rowlink" data-drrow="${hostId}" data-i="${idx}">`
      + cols.map(c => `<td${c.num?' class="num"':''}>${drCell(c, r)}</td>`).join('') + '</tr>';
  }).join('') || `<tr><td colspan="${cols.length}" class="empty">Nothing matches the current filters.</td></tr>`;
  const host = el(hostId); if(!host) return;
  const table_el = host.closest('table') || host;
  const thead = table_el.querySelector('thead');
  if(thead) thead.innerHTML = '<tr>' + head + '</tr>';
  host.innerHTML = body;
  const foot = el(hostId + 'Foot');
  if(foot) foot.innerHTML = `<div class="tblfoot"><span>${num(list.length)} row${list.length===1?'':'s'} · page ${st.page} of ${pages}</span>
    <div class="pager">
      <button class="btn btn-ghost" data-drtpage="${hostId}" data-p="-1" ${st.page<=1?'disabled':''}>‹ Prev</button>
      <button class="btn btn-ghost" data-drtpage="${hostId}" data-p="1" ${st.page>=pages?'disabled':''}>Next ›</button>
    </div></div>`;
}
function drCell(c, r){
  const v = r[c.k];
  if(c.html) return c.html(v, r);
  if(c.num) return num(v);
  return esc(v == null || v === '' ? '—' : v);
}

/* ---------------- csv, download, print ---------------- */
const csvCell = v => { const s = String(v == null ? '' : v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g,'""') + '"' : s; };
const toCsv = rows => rows.map(r => r.map(csvCell).join(',')).join('\r\n');
function downloadFile(name, mime, data){
  try{
    const blob = new Blob([data], {type: mime});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(a.href), 2000);
    toast('Exported ' + name);
    return true;
  }catch(err){
    openModal('Export ready', name, `<div class="note gold"><div>This browser blocked the download inside the
      embedded preview. Open the portal in its own tab to save the file.</div></div>`, [{label:'Close', act:'close'}]);
    return false;
  }
}
function printRows(title, cols, rows){
  const html = `<div class="brandblock"><div class="bm">G</div><div><h1>${esc(title)}</h1>
      <div style="font-size:9px;color:#6B7280">Golden Financial Services · ${fmtDate(TODAY)}</div></div></div>
    <table style="width:100%;border-collapse:collapse;font-size:10px">
      <thead><tr>${cols.map(c=>`<th style="text-align:${c.num?'right':'left'};border-bottom:1px solid #E6E8EE;padding:5px">${esc(c.label)}</th>`).join('')}</tr></thead>
      <tbody>${rows.slice(0,300).map(r=>`<tr>${r.map((v,i)=>
        `<td style="text-align:${cols[i].num?'right':'left'};border-bottom:1px dashed #EDEFF4;padding:4px">${esc(v)}</td>`).join('')}</tr>`).join('')}</tbody>
    </table>`;
  try{
    const frame = document.createElement('iframe');
    frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0';
    document.body.appendChild(frame);
    const doc = frame.contentWindow.document;
    doc.open();
    doc.write(`<html><head><title>${esc(title)}</title><style>
      body{font-family:"Segoe UI",Arial,sans-serif;padding:22px;color:#0F1115}
      h1{font-size:16px;margin:0 0 4px} .brandblock{display:flex;align-items:center;gap:9px;
        padding-bottom:8px;border-bottom:2px solid #C9A227;margin-bottom:10px}
      .bm{width:30px;height:30px;border-radius:8px;background:#C9A227;display:grid;place-items:center;
        font-weight:800;color:#2A2100}
    </style></head><body>${html}</body></html>`);
    doc.close();
    setTimeout(()=>{ try{ frame.contentWindow.focus(); frame.contentWindow.print(); }catch(e){} setTimeout(()=>frame.remove(), 1200); }, 200);
  }catch(e){ openModal('Print preview', title, html, [{label:'Close', act:'close'}]); }
}

/* ---------------- small UI primitives ---------------- */

const tile = (title, value, note, tone='') =>
  `<div class="tile ${tone}"><span class="tband"></span><div class="tt">${esc(title)}</div>
   <div class="tv">${value}</div><div class="tx">${note}</div></div>`;
const kv = (k, v) => `<div class="kvrow"><span>${esc(k)}</span><b>${v}</b></div>`;
const kvList = items => items.map(([k,v]) => kv(k, v)).join('');
const progBar = (p, tone) => `<div class="prog"><i class="${tone||''}" style="width:${clamp(p,0,100)}%"></i></div>`;
const checkRow = (state, label, note) => {
  const tone = /^(pass|ok|yes|verified|true)$/i.test(state) ? 'pass'
    : /^(warn|pending|partial)$/i.test(state) ? 'warn'
    : /^(fail|no|blocked|error)$/i.test(state) ? 'fail' : '';
  const mark = tone === 'pass' ? '✓' : tone === 'warn' ? '!' : tone === 'fail' ? '✕' : '·';
  return `<div class="checkrow"><span class="ck ${tone}">${mark}</span><span class="cl">${label}</span>
    <span class="cn">${note||''}</span></div>`;
};
const meterRow = (label, val, max, tone) => {
  const p = max ? clamp(val/max*100, 0, 100) : 0;
  return `<div class="meterrow"><div style="flex:1;min-width:0">
      <div class="sl"><b>${esc(label)}</b><span>${esc(tone || '')}</span></div>
      <div class="meter"><i class="${tone==='bad'?'bad':''}" style="width:${p}%"></i></div></div></div>`;
};
const tlItem = (tone, head, sub, when) =>
  `<div class="ti ${tone}"><span class="td2"></span><div class="th">${head}</div>
   <div class="ts">${sub}</div>${when ? `<div class="tw">${esc(when)}</div>` : ''}</div>`;
const stepsBar = (steps, active) => `<div class="steps">${steps.map((s,i) =>
  `<div class="step${i < active ? ' done' : i === active ? ' on' : ''}${/approve|confirm|production|danger/i.test(s) ? ' danger' : ''}">
     <span class="stepnum">${i < active ? '✓' : i+1}</span>${esc(s)}</div>`).join('')}</div>`;

/* state pills keyed to the vocabulary of this module */
const DR_TONE = {
  Verified:'b-ok', Completed:'b-ok', Passed:'b-ok', Pass:'b-ok', Success:'b-ok', Approved:'b-ok',
  Secured:'b-ok', Enabled:'b-ok', Active:'b-ok', Holding:'b-ok', Current:'b-ok', Balanced:'b-ok',
  Running:'b-info', Queued:'b-info', Pending:'b-warn', 'In progress':'b-info', Scheduled:'b-info',
  Failed:'b-crit', Blocked:'b-crit', Expired:'b-gray', Refused:'b-crit', Deleted:'b-gray',
  Partial:'b-warn', Warning:'b-warn', Overdue:'b-warn', Drifted:'b-warn', Untested:'b-warn',
  'Not available':'b-gray', Unavailable:'b-gray', Disabled:'b-gray', Idle:'b-gray'
};
const pill = s => `<span class="badge ${DR_TONE[s] || 'b-gray'}">${esc(s)}</span>`;
</script>
