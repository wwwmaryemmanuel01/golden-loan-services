<script>
/* ============================================================
   STAFF ROLES & PERMISSIONS (1/6)
   Formatters, the small shared builders, the chart engine and the
   modal/print plumbing every section uses.
   ============================================================ */

const el = id => document.getElementById(id);
const esc = s => String(s == null ? '' : s)
  .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const sum = (a, f) => a.reduce((s, x) => s + (f ? Number(f(x)) || 0 : Number(x) || 0), 0);
const pct = (a, b) => b ? (a / b * 100) : 0;
const pad = (s, n) => String(s).padStart(n, '0');
const uniq = a => [...new Set(a)];
const unique = a => [...new Set(a)];

function num(v, dec){
  const d = dec === undefined ? 0 : dec;
  let s = Math.abs(Number(v) || 0).toFixed(d);
  const parts = s.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return (Number(v) < 0 ? '-' : '') + parts.join('.');
}
const money = (v, dec) => 'MK ' + num(v, dec === undefined ? 0 : dec);
const pctText = (a, b) => (b ? (a / b * 100) : 0).toFixed(1) + '%';

/* ---------------- dates ---------------- */
const TODAY = '2026-10-30';
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const asDate = iso => new Date(String(iso).slice(0, 10) + 'T00:00:00');
const isoOf = d => d.toISOString().slice(0, 10);
const addDays = (iso, n) => { const d = asDate(iso); d.setDate(d.getDate() + n); return isoOf(d); };
const addMonths = (iso, n) => { const d = asDate(iso); d.setMonth(d.getMonth() + n); return isoOf(d); };
const daysBetween = (a, b) => Math.round((asDate(b) - asDate(a)) / 86400000);
function fmtDate(iso){
  if(!iso) return '—';
  const d = asDate(iso);
  return pad(d.getDate(), 2) + ' ' + MONTH_NAMES[d.getMonth()] + ' ' + d.getFullYear();
}
const fmtWhen = ts => {
  if(!ts) return '—';
  const s = String(ts);
  return fmtDate(s) + (s.length > 10 ? ' · ' + s.slice(11, 16) : '');
};
const MONTHS12 = (() => {
  const out = []; let y = 2025, m = 11;
  for(let i = 0; i < 12; i++){ out.push(y + '-' + pad(m, 2)); m++; if(m > 12){ m = 1; y++; } }
  return out;
})();
const monthLabel = k => MONTH_NAMES[Number(k.slice(5, 7)) - 1] + ' ' + k.slice(2, 4);

/* ---------------- tones ---------------- */
const TONE = s => /^(Enforced|Passed|Pass|Allowed|Active|Approved|Complete|Completed|Met|Separated|Individual|Classified|Restricted|Full|Cleared)$/i.test(s) ? 'b-ok'
  : /^(Partial|Pending|Review|In review|Due|Limited|Warn|Watch|Approaching|Open|Assigned|Conditional)$/i.test(s) ? 'b-warn'
  : /^(Gap|Failed|Fail|Refused|Blocked|Breach|Conflict|Leaver|Expired|Critical|High)$/i.test(s) ? 'b-crit'
  : 'b-gray';
const badge = (t, tone) => `<span class="badge ${tone || TONE(t)}">${esc(t)}</span>`;
const okb = t => badge(t, TONE(t));
const kpiCard = (l, v, s, k) => `<div class="kpi ${k || ''}"><div class="kl">${esc(l)}</div><div class="kv">${v}</div><div class="ks">${esc(s || '')}</div></div>`;
const kvRow = (k, v) => `<div class="risk"><div><div class="rn">${esc(k)}</div></div><div class="rv">${v}</div></div>`;
const strip = rows => `<div class="strip">${rows.map(([k, v]) => `<div><div class="sl">${esc(k)}</div><div class="sv">${v}</div></div>`).join('')}</div>`;
const put = (id, html) => { const n = el(id); if(n) n.innerHTML = html; };
const ENF = {
  'RLS': '<span class="enf db">RLS</span>',
  'Function': '<span class="enf fn">FUNCTION</span>',
  'Edge function': '<span class="enf fn">EDGE</span>',
  'Interface': '<span class="enf ui">UI</span>',
  'Audit': '<span class="enf audit">AUDIT</span>'
};

/* ---------------- toast + modal ---------------- */
function toast(msg, type = 'ok'){
  const host = el('toasts');
  if(!host) return;
  const t = document.createElement('div');
  t.className = 'toast ' + type;
  t.innerHTML = `<span>${type === 'err' ? '⚠' : type === 'info' ? 'ℹ' : '✓'}</span><div>${esc(msg)}</div>`;
  host.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateX(16px)'; t.style.transition = '.25s'; }, 2600);
  setTimeout(() => t.remove(), 3000);
}
function openModal(title, sub, body, actions = []){
  el('modalTitle').textContent = title;
  el('modalSub').textContent = sub || '';
  el('modalBody').innerHTML = body;
  el('modalFoot').innerHTML = '';
  actions.forEach(a => {
    const b = document.createElement('button');
    b.className = 'btn ' + (a.cls || 'btn-ghost');
    b.textContent = a.label;
    b.onclick = a.act === 'close' ? closeModal : a.act;
    el('modalFoot').appendChild(b);
  });
  el('modal').classList.add('on');
}
function closeModal(){ const m = el('modal'); if(m) m.classList.remove('on'); }
function printTable(title, cols, rows){
  const head = cols.map(c => `<th>${esc(c.label || c)}</th>`).join('');
  const body = rows.map(r => '<tr>' + r.map(c => `<td>${esc(c)}</td>`).join('') + '</tr>').join('');
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title>
    <style>body{font:11px "Segoe UI",Arial,sans-serif;color:#0F1115;padding:16px}
    h1{font-size:14px;margin:0 0 2px}p{font-size:10px;color:#6B7280;margin:0 0 10px}
    table{width:100%;border-collapse:collapse}th{background:#F4F5F8;text-align:left;font-size:9px;
    text-transform:uppercase;letter-spacing:.5px;padding:6px;border-bottom:1px solid #E6E8EE}
    td{padding:5px 6px;border-bottom:1px solid #F0F1F5}</style></head><body>
    <h1>${esc(title)}</h1><p>Golden Financial Services · ${esc(fmtDate(TODAY))}</p>
    <table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></body></html>`;
  try {
    const w = window.open('', '_blank');
    if(!w) return false;
    w.document.write(html); w.document.close();
    setTimeout(() => { try { w.focus(); w.print(); } catch(e){} }, 250);
    return true;
  } catch(e){ return false; }
}

/* ---------------- table builder ---------------- */
function renderTable(hostId, cols, rows, opts){
  const o = opts || {};
  const tb = el(hostId);
  if(!tb) return [];
  const head = document.getElementById(hostId.replace(/Body$/, 'Head'));
  if(head){
    head.innerHTML = '<tr>' + cols.map(c =>
      `<th${c.num ? ' class="num"' : ''}>${esc(c.label)}</th>`).join('') + '</tr>';
  }
  let list = rows.slice();
  if(o.sort){
    const dir = o.desc === false ? 1 : -1;
    list.sort((a, b) => {
      const A = a[o.sort], B = b[o.sort];
      if(typeof A === 'number' || typeof B === 'number') return ((Number(A) || 0) - (Number(B) || 0)) * dir;
      return String(A == null ? '' : A).localeCompare(String(B == null ? '' : B)) * dir;
    });
  }
  if(o.limit) list = list.slice(0, o.limit);
  if(!list.length){
    tb.innerHTML = `<tr><td colspan="${cols.length}" class="empty">Nothing matches the current filters.</td></tr>`;
    return [];
  }
  tb.innerHTML = list.map((r, i) => `<tr class="rowlink" data-row="${i}">` +
    cols.map(c => `<td${c.num ? ' class="num"' : ''}>${c.html ? c.html(r[c.k], r) : esc(r[c.k])}</td>`).join('') +
    '</tr>').join('');
  tb.querySelectorAll('tr[data-row]').forEach(tr => {
    tr.onclick = () => {
      const rec = list[Number(tr.dataset.row)];
      if(rec) openRecord(cols, rec);
    };
  });
  return list;
}
function openRecord(cols, rec){
  const body = `<div class="recsheet"><div class="recgrid">` + cols.map(c => {
    const v = c.html ? String(c.html(rec[c.k], rec)).replace(/<[^>]+>/g, '') : rec[c.k];
    if(v === undefined || v === null || v === '') return '';
    return `<div class="pfield"><div class="pk">${esc(c.label)}</div><div class="pv">${esc(v)}</div></div>`;
  }).join('') + `</div><div class="recsrc">Role and permission register</div></div>`;
  const first = cols[0] ? String(rec[cols[0].k] || '') : '';
  openModal(first || 'Record', 'Roles and permissions', body,
    [{ label: 'Print', act: () => printTable(first || 'Record', [{ label: 'Field' }, { label: 'Value' }],
      cols.map(c => [c.label, c.html ? String(c.html(rec[c.k], rec)).replace(/<[^>]+>/g, '') : rec[c.k]])) },
     { label: 'Close', act: 'close', cls: 'btn-gold' }]);
}

/* ---------------- chart engine ---------------- */
const PALETTE = ['#C9A227','#1E9E6A','#2F6FED','#D93F3F','#7C5CF0','#E08C1E','#0E9AA7','#8A90A0','#B58C1B','#4A5160'];
function niceMax(v){
  if(!isFinite(v) || v <= 0) return 10;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / p;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10;
  return step * p;
}
function axisFmt(v){
  const a = Math.abs(v);
  if(a >= 1e6) return (v / 1e6).toFixed(a >= 1e7 ? 0 : 1) + 'M';
  if(a >= 1e3) return Math.round(v / 1e3) + 'k';
  return String(Math.round(v * 10) / 10);
}
function chart(o){
  const type = o.type || 'bar';
  const series = (o.series || []).filter(s => s && s.data);
  const cats = o.cats || [];
  const H = o.h || 200;
  if(!series.length || !series.some(s => s.data.some(v => Number(v) !== 0)))
    return '<div class="empty" style="padding:24px 0">No data for the selected filters.</div>';
  if(type === 'pie' || type === 'donut') return pieSvg(series[0].data, cats, type === 'donut', H, o.colours);
  return barsSvg(series, cats, H, o.stacked);
}
function barsSvg(series, cats, H, stacked){
  const max = niceMax(Math.max(...series.flatMap(s => s.data.map(v => Number(v) || 0))));
  const W = 520, padL = 34, padR = 6, padT = 8, padB = 20;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const n = series[0].data.length || 1;
  const slot = plotW / n;
  let grid = '';
  for(let i = 0; i <= 4; i++){
    const y = padT + plotH - (plotH * i / 4);
    grid += `<line x1="${padL}" y1="${y.toFixed(1)}" x2="${W - padR}" y2="${y.toFixed(1)}" stroke="#EDEFF4"/>` +
      `<text x="${padL - 5}" y="${(y + 3).toFixed(1)}" text-anchor="end" font-size="8" fill="#8A90A0">${axisFmt(max * i / 4)}</text>`;
  }
  let bars = '';
  const group = series.length;
  const bw = Math.max(3, Math.min(26, (slot * 0.7) / group));
  series[0].data.forEach((_, i) => {
    const cx = padL + slot * i + slot / 2;
    series.forEach((s, si) => {
      const v = Number(s.data[i]) || 0;
      const h = (v / max) * plotH;
      const x = cx - (bw * group) / 2 + si * bw;
      bars += `<rect x="${x.toFixed(1)}" y="${(padT + plotH - h).toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(0, h).toFixed(1)}"
        rx="2" fill="${s.colour || PALETTE[si % PALETTE.length]}"><title>${esc(cats[i] || '')}: ${num(v)}</title></rect>`;
    });
    if(n <= 16) bars += `<text x="${cx.toFixed(1)}" y="${H - 6}" text-anchor="middle" font-size="8" fill="#8A90A0">${esc(String(cats[i] || '').slice(0, 9))}</text>`;
  });
  const legendHtml = series.length > 1
    ? `<div class="legend">${series.map((s, i) => `<b><i style="background:${s.colour || PALETTE[i % PALETTE.length]}"></i>${esc(s.name || '')}</b>`).join('')}</div>`
    : '';
  return `<div class="chartsvg"><svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">${grid}${bars}</svg></div>${legendHtml}`;
}
function pieSvg(data, cats, donut, H, colours){
  const items = data.map((v, i) => ({ label: cats[i] || String(i + 1), value: Number(v) || 0, colour: (colours || PALETTE)[i % (colours || PALETTE).length] }));
  const total = sum(items, i => i.value) || 1;
  const W = 400, h = H, cx = 96, cy = h / 2, R = Math.min(h / 2 - 6, 74), r = donut ? R * 0.58 : 0;
  let a0 = -Math.PI / 2, out = '';
  items.forEach(it => {
    const frac = it.value / total;
    if(frac <= 0) return;
    const a1 = a0 + frac * Math.PI * 2;
    const large = frac > 0.5 ? 1 : 0;
    const x0 = cx + R * Math.cos(a0), y0 = cy + R * Math.sin(a0);
    const x1 = cx + R * Math.cos(a1), y1 = cy + R * Math.sin(a1);
    let d;
    if(frac > 0.999){
      d = `M ${cx} ${cy - R} A ${R} ${R} 0 1 1 ${cx - 0.01} ${cy - R} Z`;
    } else if(donut){
      const ix0 = cx + r * Math.cos(a1), iy0 = cy + r * Math.sin(a1);
      const ix1 = cx + r * Math.cos(a0), iy1 = cy + r * Math.sin(a0);
      d = `M ${x0.toFixed(1)} ${y0.toFixed(1)} A ${R} ${R} 0 ${large} 1 ${x1.toFixed(1)} ${y1.toFixed(1)} L ${ix0.toFixed(1)} ${iy0.toFixed(1)} A ${r} ${r} 0 ${large} 0 ${ix1.toFixed(1)} ${iy1.toFixed(1)} Z`;
    } else {
      d = `M ${cx} ${cy} L ${x0.toFixed(1)} ${y0.toFixed(1)} A ${R} ${R} 0 ${large} 1 ${x1.toFixed(1)} ${y1.toFixed(1)} Z`;
    }
    out += `<path d="${d}" fill="${it.colour}" stroke="#fff" stroke-width="1.5"><title>${esc(it.label)}: ${num(it.value)} (${(frac * 100).toFixed(1)}%)</title></path>`;
    a0 = a1;
  });
  const centre = donut ? `<text x="${cx}" y="${cy - 1}" text-anchor="middle" font-size="16" font-weight="800" fill="#0F1115">${num(total)}</text>
    <text x="${cx}" y="${cy + 12}" text-anchor="middle" font-size="8" fill="#6B7280">TOTAL</text>` : '';
  const rows = items.slice(0, 8).map((it, i) =>
    `<g><rect x="196" y="${12 + i * 19}" width="9" height="9" rx="2" fill="${it.colour}"></rect>
     <text x="210" y="${20 + i * 19}" font-size="9" fill="#2B303B">${esc(String(it.label).slice(0, 26))}</text>
     <text x="392" y="${20 + i * 19}" font-size="9" text-anchor="end" fill="#6B7280">${num(it.value)}</text></g>`).join('');
  return `<div class="chartsvg"><svg viewBox="0 0 ${W} ${h}">${out}${centre}${rows}</svg></div>`;
}
function chartCard(o){
  return `<div class="chartcard">
    <div class="ch"><div><div class="ct">${esc(o.title)}</div><div class="cs">${esc(o.sub || '')}</div></div>
      <div style="text-align:right">${o.value !== undefined ? `<div class="cv">${o.value}</div>` : ''}</div></div>
    ${chart(o)}
    ${o.note ? `<div class="qhint">${esc(o.note)}</div>` : ''}
  </div>`;
}
</script>
