<script>
/* ============================================================
   GUARANTORS & COLLATERAL (1/3)
   Formatters, shared builders, and the sample register this
   module is drawn from. Everything derives from LOANS,
   GUARANTORS and COLLATERAL, so a change in one place shows in
   every section and every total ties back.
   ============================================================ */

const el = id => document.getElementById(id);
const esc = s => String(s == null ? '' : s)
  .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const sum = (a, f) => a.reduce((s, x) => s + (f ? Number(f(x)) || 0 : Number(x) || 0), 0);
const pct = (a, b) => b ? (a / b * 100) : 0;
const pad = (s, n) => String(s).padStart(n, '0');

function num(v, dec){
  const d = dec === undefined ? 0 : dec;
  const s = Math.abs(Number(v) || 0).toFixed(d).split('.');
  s[0] = s[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return (Number(v) < 0 ? '-' : '') + s.join('.');
}
const money = (v, dec) => 'MK ' + num(v, dec === undefined ? 0 : dec);
const r1 = v => (Number(v) || 0).toFixed(1);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

/* ---------------- dates ---------------- */
const TODAY = '2026-10-30';
const MN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const asDate = iso => new Date(String(iso).slice(0, 10) + 'T00:00:00');
const isoOf = d => d.toISOString().slice(0, 10);
const addDays = (iso, n) => { const d = asDate(iso); d.setDate(d.getDate() + n); return isoOf(d); };
const daysBetween = (a, b) => Math.round((asDate(b) - asDate(a)) / 86400000);
function fmtDate(iso){
  if(!iso) return '—';
  const d = asDate(iso);
  return pad(d.getDate(), 2) + ' ' + MN[d.getMonth()] + ' ' + d.getFullYear();
}
const ageDays = iso => daysBetween(iso, TODAY);

/* ---------------- tones + small builders ---------------- */
const TONE = s => /^(Verified|Active|Charged|Released|Paid|Complete|Cleared|Settled|Approved|Passed|Registered|Full|Current|Clean)$/i.test(s) ? 'b-ok'
  : /^(Pending|Review|Partial|Due|Watchlist|Conditional|In progress|Renewal due|Awaiting|Provisional|Substitution)$/i.test(s) ? 'b-warn'
  : /^(Expired|Rejected|Failed|Critical|High|Blacklisted|Unregistered|Missing|Breach|Overdue|Disputed)$/i.test(s) ? 'b-crit'
  : 'b-gray';
const badge = (t, tone) => `<span class="badge ${tone || TONE(t)}">${esc(t)}</span>`;
const kpiCard = (l, v, s, k) => `<div class="kpi ${k || ''}"><div class="kl">${esc(l)}</div><div class="kv">${v}</div><div class="ks">${esc(s || '')}</div></div>`;
const put = (id, html) => { const n = el(id); if(n) n.innerHTML = html; };
const docs = o => `<div class="docs">${[
  ['ID', o.id], ['Photo', o.photo], ['Address', o.address], ['Income', o.income], ['Bureau', o.bureau], ['Sanctions', o.sanctions]
].map(([k, v]) => `<span class="${v ? 'on' : 'off'}">${k} ${v ? '✓' : '✕'}</span>`).join('')}</div>`;

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

/* ---------------- table + export ---------------- */
function renderTable(hostId, cols, rows, opts){
  const o = opts || {};
  const tb = el(hostId);
  if(!tb) return [];
  const head = el(hostId.replace(/Body$/, 'Head'));
  if(head) head.innerHTML = '<tr>' + cols.map(c => `<th${c.num ? ' class="num"' : ''}>${esc(c.label)}</th>`).join('') + '</tr>';
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
    tr.onclick = () => { const rec = list[Number(tr.dataset.row)]; if(rec && o.onOpen) o.onOpen(rec); };
  });
  return list;
}
function csvDownload(name, cols, rows){
  const head = cols.map(c => '"' + String(c.label).replace(/"/g, '""') + '"').join(',');
  const body = rows.map(r => cols.map(c => {
    const v = c.html ? String(c.html(r[c.k], r)).replace(/<[^>]+>/g, '') : r[c.k];
    return '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
  }).join(',')).join('\n');
  try {
    const blob = new Blob(['\ufeff' + head + '\n' + body], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1500);
    toast(name + ' downloaded.');
  } catch(e){ toast('The browser blocked the download.', 'err'); }
}
function printTable(title, cols, rows){
  const head = cols.map(c => `<th>${esc(c.label)}</th>`).join('');
  const body = rows.map(r => '<tr>' + cols.map(c => {
    const v = c.html ? String(c.html(r[c.k], r)).replace(/<[^>]+>/g, '') : r[c.k];
    return `<td>${esc(v)}</td>`;
  }).join('') + '</tr>').join('');
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title>
    <style>body{font:11px "Segoe UI",Arial,sans-serif;color:#0F1115;padding:16px}
    h1{font-size:14px;margin:0 0 2px}p{font-size:10px;color:#6B7280;margin:0 0 10px}
    table{width:100%;border-collapse:collapse}th{background:#F1F8F4;text-align:left;font-size:9px;
    text-transform:uppercase;letter-spacing:.5px;padding:6px;border-bottom:1px solid #A9CDBD}
    td{padding:5px 6px;border-bottom:1px solid #DCEAE3}</style></head><body>
    ${(window.glsDocBand ? window.glsDocBand('') : '')}
    <h1>${esc(title)}</h1><p>Golden Financial Services · Guarantors &amp; Collateral · ${esc(fmtDate(TODAY))}</p>
    <table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></body></html>`;
  try {
    const w = window.open('', '_blank');
    if(!w){ toast('Allow pop-ups to print.', 'err'); return; }
    w.document.write(html); w.document.close();
    setTimeout(() => { try { w.focus(); w.print(); } catch(e){} }, 250);
  } catch(e){ toast('Printing was blocked by the browser.', 'err'); }
}

/* ---------------- loans on the book ---------------- */
const LOANS = [
  { id:'LN-2026-0101', borrower:'Thoko Banda',      product:'Business loan',   amount:2500000, outstanding:1840000, status:'Current',  officer:'G. Mtemang\'ombe', date:'2026-03-12' },
  { id:'LN-2026-0104', borrower:'Mphatso Phiri',    product:'Salary Advance Loans',     amount:1200000, outstanding: 620000, status:'Current',  officer:'A. Mbewe',        date:'2026-05-04' },
  { id:'LN-2026-0108', borrower:'Chisomo Nkhoma',   product:'Collateral Loans',   amount:6800000, outstanding:5120000, status:'Current',  officer:'G. Mtemang\'ombe', date:'2026-01-22' },
  { id:'LN-2026-0112', borrower:'Yamikani Chirwa',  product:'Personal Loans',      amount: 900000, outstanding: 410000, status:'Watchlist', officer:'T. Nkhoma',      date:'2026-06-18' },
  { id:'LN-2026-0115', borrower:'Blessings Tembo',  product:'Business loan',   amount:4500000, outstanding:3960000, status:'Current',  officer:'A. Mbewe',        date:'2026-02-09' },
  { id:'LN-2026-0119', borrower:'Fatsani Kaunda',   product:'Salary Advance Loans',     amount: 750000, outstanding: 210000, status:'Current',  officer:'T. Nkhoma',       date:'2026-07-01' },
  { id:'LN-2026-0123', borrower:'Limbani Zimba',    product:'Collateral Loans',   amount:5200000, outstanding:4380000, status:'Current',  officer:'G. Mtemang\'ombe', date:'2026-04-27' },
  { id:'LN-2026-0127', borrower:'Tiyamike Mvula',   product:'Business loan',   amount:3100000, outstanding:2840000, status:'Watchlist', officer:'A. Mbewe',        date:'2026-03-30' },
  { id:'LN-2026-0131', borrower:'Alinafe Kachale',  product:'Salary Advance Loans',     amount: 980000, outstanding: 705000, status:'Current',  officer:'T. Nkhoma',       date:'2026-08-11' },
  { id:'LN-2026-0136', borrower:'Kondwani Msowoya', product:'Personal Loans',      amount:1500000, outstanding:1180000, status:'Current',  officer:'G. Mtemang\'ombe', date:'2026-05-19' },
  { id:'LN-2026-0140', borrower:'Esnart Nyirenda',  product:'Collateral Loans',   amount:3900000, outstanding:3450000, status:'Current',  officer:'A. Mbewe',        date:'2026-06-02' },
  { id:'LN-2026-0144', borrower:'Pilirani Gondwe',  product:'Business loan',   amount:2200000, outstanding:1970000, status:'Current',  officer:'T. Nkhoma',       date:'2026-07-24' }
];

/* ---------------- guarantors ---------------- */
const GUARANTORS = [
  { id:'G-2026-001', name:'Chikondi Mwale',     sex:'M', phone:'+265 991 204 118', district:'Lilongwe',   relation:'Spouse',        occupation:'Accountant',      employer:'Sunbird Ltd',        income:620000, netWorth:14500000, otherCommit:0,       committed:1500000, loan:'LN-2026-0101', idType:'National ID', idNo:'LIL-4472-991', consent:'2026-03-10', signature:true,  witness:'A. Mbewe',        advised:true,  score:742, status:'Verified', added:'2026-03-08', officer:'G. Mtemang\'ombe', kyc:{ id:true, photo:true, address:true, income:true, bureau:true, sanctions:true }, assets:'House at Area 49, Toyota Hilux, savings', liabilities:'Mortgage MK 2,400,000' },
  { id:'G-2026-002', name:'Grace Mtemang\'ombe', sex:'F', phone:'+265 888 330 714', district:'Blantyre',  relation:'Business partner', occupation:'Trader',        employer:'Self-employed',      income:410000, netWorth: 6800000, otherCommit:320000, committed: 800000, loan:'LN-2026-0115', idType:'National ID', idNo:'BT-1188-330', consent:'2026-02-06', signature:true,  witness:'T. Nkhoma',       advised:true,  score:701, status:'Verified', added:'2026-02-04', officer:'A. Mbewe',        kyc:{ id:true, photo:true, address:true, income:true, bureau:true, sanctions:true }, assets:'Shop stock, minibus', liabilities:'Stock loan MK 900,000' },
  { id:'G-2026-003', name:'Mavuto Chikwakwa',   sex:'M', phone:'+265 999 771 402', district:'Zomba',     relation:'Brother',        occupation:'Teacher',         employer:'Ministry of Education', income:295000, netWorth: 3100000, otherCommit:0,     committed: 650000, loan:'LN-2026-0104', idType:'National ID', idNo:'ZBA-5510-221', consent:'2026-05-02', signature:true,  witness:'A. Mbewe',        advised:true,  score:688, status:'Verified', added:'2026-04-29', officer:'A. Mbewe',        kyc:{ id:true, photo:true, address:true, income:true, bureau:true, sanctions:true }, assets:'Plot in Zomba, savings', liabilities:'None declared' },
  { id:'G-2026-004', name:'Rodrick Kamanga',    sex:'M', phone:'+265 994 118 663', district:'Lilongwe',   relation:'Director',       occupation:'Contractor',      employer:'Kamanga Civils',     income:1250000, netWorth:28000000, otherCommit:2100000, committed:3400000, loan:'LN-2026-0108', idType:'National ID', idNo:'LIL-9902-014', consent:'2026-01-20', signature:true,  witness:'G. Mtemang\'ombe', advised:true, score:766, status:'Verified', added:'2026-01-18', officer:'G. Mtemang\'ombe', kyc:{ id:true, photo:true, address:true, income:true, bureau:true, sanctions:true }, assets:'Commercial building, plant', liabilities:'Equipment finance MK 4,100,000' },
  { id:'G-2026-005', name:'Ellen Chisale',      sex:'F', phone:'+265 881 664 090', district:'Mzimba',    relation:'Mother',         occupation:'Farmer',          employer:'Self-employed',      income:120000, netWorth: 1900000, otherCommit:0,     committed: 300000, loan:'LN-2026-0112', idType:'National ID', idNo:'MZ-2201-664', consent:'2026-06-16', signature:false, witness:'—',               advised:false, score:610, status:'Pending',  added:'2026-06-14', officer:'T. Nkhoma',       kyc:{ id:true, photo:true, address:false, income:false, bureau:true, sanctions:true }, assets:'One hectare, livestock', liabilities:'None declared' },
  { id:'G-2026-006', name:'Steven Kambalame',   sex:'M', phone:'+265 997 402 551', district:'Mangochi',  relation:'Friend',         occupation:'Fisherman',       employer:'Self-employed',      income:180000, netWorth: 1200000, otherCommit:0,     committed: 250000, loan:'LN-2026-0112', idType:'National ID', idNo:'MG-8830-402', consent:'2026-06-16', signature:true,  witness:'T. Nkhoma',       advised:true,  score:598, status:'Watchlist', added:'2026-06-14', officer:'T. Nkhoma',      kyc:{ id:true, photo:false, address:true, income:true, bureau:true, sanctions:true }, assets:'Boats, nets', liabilities:'Informal loan MK 200,000' },
  { id:'G-2026-007', name:'Isaac Mponda',       sex:'M', phone:'+265 888 991 002', district:'Blantyre',  relation:'Uncle',          occupation:'Civil servant',   employer:'Immigration',        income:380000, netWorth: 5200000, otherCommit:150000, committed: 900000, loan:'LN-2026-0119', idType:'National ID', idNo:'BT-3391-991', consent:'2026-06-29', signature:true,  witness:'A. Mbewe',        advised:true,  score:716, status:'Verified', added:'2026-06-27', officer:'T. Nkhoma',       kyc:{ id:true, photo:true, address:true, income:true, bureau:true, sanctions:true }, assets:'House in Chilomoni', liabilities:'Bank loan MK 1,200,000' },
  { id:'G-2026-008', name:'Dorothy Nyasulu',    sex:'F', phone:'+265 992 118 774', district:'Lilongwe',  relation:'Spouse',         occupation:'Nurse',           employer:'Kamuzu Central',     income:455000, netWorth: 7400000, otherCommit:0,     committed:1200000, loan:'LN-2026-0123', idType:'National ID', idNo:'LIL-7712-118', consent:'2026-04-25', signature:true,  witness:'G. Mtemang\'ombe', advised:true, score:734, status:'Verified', added:'2026-04-23', officer:'G. Mtemang\'ombe', kyc:{ id:true, photo:true, address:true, income:true, bureau:true, sanctions:true }, assets:'House at Kanengo, savings', liabilities:'None declared' },
  { id:'G-2026-009', name:'Patrick Mbewe',      sex:'M', phone:'+265 999 664 180', district:'Kasungu',   relation:'Cousin',         occupation:'Mechanic',        employer:'Mbewe Motors',       income:265000, netWorth: 2300000, otherCommit:0,     committed: 600000, loan:'LN-2026-0127', idType:'National ID', idNo:'KS-5518-664', consent:'2026-03-27', signature:true,  witness:'A. Mbewe',        advised:true,  score:664, status:'Verified', added:'2026-03-25', officer:'A. Mbewe',        kyc:{ id:true, photo:true, address:true, income:true, bureau:true, sanctions:true }, assets:'Workshop tools, plot', liabilities:'None declared' },
  { id:'G-2026-010', name:'Agnes Tembo',        sex:'F', phone:'+265 884 220 913', district:'Zomba',     relation:'Sister',         occupation:'Shop owner',      employer:'Self-employed',      income:340000, netWorth: 4100000, otherCommit:0,     committed: 700000, loan:'LN-2026-0131', idType:'National ID', idNo:'ZBA-4471-220', consent:'2026-08-09', signature:true,  witness:'T. Nkhoma',       advised:true,  score:705, status:'Verified', added:'2026-08-07', officer:'T. Nkhoma',       kyc:{ id:true, photo:true, address:true, income:true, bureau:true, sanctions:true }, assets:'Shop, stock', liabilities:'Wholesale credit MK 400,000' },
  { id:'G-2026-011', name:'James Kalua',        sex:'M', phone:'+265 991 883 004', district:'Nkhotakota',relation:'Business partner', occupation:'Transport operator', employer:'Kalua Transport',  income:890000, netWorth:16200000, otherCommit:600000, committed:1500000, loan:'LN-2026-0136', idType:'National ID', idNo:'NK-9910-883', consent:'2026-05-17', signature:true,  witness:'G. Mtemang\'ombe', advised:true, score:751, status:'Verified', added:'2026-05-15', officer:'G. Mtemang\'ombe', kyc:{ id:true, photo:true, address:true, income:true, bureau:true, sanctions:true }, assets:'Three trucks, yard', liabilities:'Truck finance MK 3,800,000' },
  { id:'G-2026-012', name:'Lucy Mwale',         sex:'F', phone:'+265 888 004 221', district:'Lilongwe',  relation:'Mother',         occupation:'Retired teacher', employer:'Pensioner',          income:210000, netWorth: 5600000, otherCommit:0,     committed:1000000, loan:'LN-2026-0140', idType:'National ID', idNo:'LIL-1180-004', consent:'2026-05-31', signature:true,  witness:'A. Mbewe',        advised:true,  score:722, status:'Verified', added:'2026-05-29', officer:'A. Mbewe',        kyc:{ id:true, photo:true, address:true, income:true, bureau:true, sanctions:false }, assets:'House in Area 25', liabilities:'None declared' },
  { id:'G-2026-013', name:'Peter Sanjani',      sex:'M', phone:'+265 993 771 620', district:'Mulanje',   relation:'Uncle',          occupation:'Tea estate worker', employer:'Satemwa',           income:165000, netWorth:  980000, otherCommit:0,     committed: 400000, loan:'LN-2026-0144', idType:'National ID', idNo:'ML-3390-771', consent:'2026-07-22', signature:false, witness:'—',               advised:true,  score:589, status:'Pending',  added:'2026-07-20', officer:'T. Nkhoma',       kyc:{ id:true, photo:true, address:false, income:true, bureau:false, sanctions:true }, assets:'Plot in Mulanje', liabilities:'None declared' },
  { id:'G-2026-014', name:'Henry Chikondi',     sex:'M', phone:'+265 995 220 337', district:'Dedza',     relation:'Friend',         occupation:'Driver',          employer:'Roadline',           income:230000, netWorth: 1400000, otherCommit:0,     committed: 350000, loan:'LN-2026-0101', idType:'National ID', idNo:'DZ-6612-220', consent:'2026-03-11', signature:true,  witness:'G. Mtemang\'ombe', advised:true,  score:641, status:'Expired',  added:'2026-03-09', officer:'G. Mtemang\'ombe', kyc:{ id:true, photo:true, address:true, income:false, bureau:true, sanctions:true }, assets:'Motorcycle, savings', liabilities:'None declared' }
];

/* ---------------- collateral ---------------- */
const COLLATERAL = [
  { id:'C-2026-001', type:'Motor vehicle',      desc:'Toyota Hilux 2019 · silver',        owner:'Thoko Banda',          ownerType:'Borrower', reg:'BW 4471',  district:'Lilongwe', valuer:'Mabuku Valuers', valuation:7800000, valDate:'2026-03-05', forced:6200000, insured:true,  insurer:'Nico General',   policy:'POL-991-4471', cover:7000000, insExpiry:'2026-12-31', charge:'Charged',  search:'Clean',    stamp:true,  custody:'Borrower',  lastInsp:'2026-09-14', nextInsp:'2026-12-14', condition:'Good',    photos:4, status:'Charged',  loan:'LN-2026-0101', notes:'Comprehensive cover; lender noted as loss payee.' },
  { id:'C-2026-002', type:'Fixed deposit',      desc:'Six-month deposit · NBS Bank',      owner:'Chikondi Mwale',       ownerType:'Guarantor', reg:'NBS-77120', district:'Lilongwe', valuer:'Bank statement', valuation:1500000, valDate:'2026-03-11', forced:1500000, insured:false, insurer:'—',              policy:'—',           cover:0,       insExpiry:'',          charge:'Charged',  search:'Clean',    stamp:true,  custody:'Branch vault', lastInsp:'2026-03-11', nextInsp:'2027-03-11', condition:'Held',    photos:0, status:'Charged',  loan:'LN-2026-0101', notes:'Lien marked on the deposit; released on settlement.' },
  { id:'C-2026-003', type:'Land title',         desc:'Plot 44/2 · Area 49, Lilongwe',     owner:'Mphatso Phiri',        ownerType:'Borrower', reg:'LIL-44/2', district:'Lilongwe', valuer:'Kadale & Co',   valuation:9500000, valDate:'2026-04-28', forced:7100000, insured:false, insurer:'—',              policy:'—',           cover:0,       insExpiry:'',          charge:'Charged',  search:'Clean',    stamp:true,  custody:'Safe',      lastInsp:'2026-06-02', nextInsp:'2027-06-02', condition:'Good',    photos:2, status:'Charged',  loan:'LN-2026-0104', notes:'Charge registered at the Ministry of Lands.' },
  { id:'C-2026-004', type:'Commercial property',desc:'Warehouse · Kanengo',               owner:'Rodrick Kamanga',      ownerType:'Borrower', reg:'LIL-118/7',district:'Lilongwe', valuer:'Mabuku Valuers', valuation:18000000,valDate:'2026-01-16', forced:13500000,insured:true,  insurer:'Old Mutual',     policy:'POL-118-0207', cover:13500000,insExpiry:'2027-01-15', charge:'Charged',  search:'Clean',    stamp:true,  custody:'Safe',      lastInsp:'2026-08-20', nextInsp:'2027-08-20', condition:'Good',    photos:5, status:'Charged',  loan:'LN-2026-0108', notes:'First charge; second charge in favour of supplier discharged 2026-02.' },
  { id:'C-2026-005', type:'Motor vehicle',      desc:'Hino 500 truck 2017',               owner:'Rodrick Kamanga',      ownerType:'Borrower', reg:'BT 7710',  district:'Blantyre', valuer:'Auto Assess',   valuation:11500000,valDate:'2026-01-16', forced:8900000, insured:true,  insurer:'Nico General',   policy:'POL-771-1108', cover:9000000, insExpiry:'2026-11-20', charge:'Charged',  search:'Clean',    stamp:true,  custody:'Branch yard',lastInsp:'2026-09-30', nextInsp:'2026-12-30', condition:'Fair',    photos:6, status:'Charged',  loan:'LN-2026-0108', notes:'Policy lapses in 21 days — renewal chased.' },
  { id:'C-2026-006', type:'Household goods',    desc:'Furniture and appliances',          owner:'Yamikani Chirwa',      ownerType:'Borrower', reg:'—',        district:'Lilongwe', valuer:'Internal estimate', valuation:600000, valDate:'2026-06-15', forced:260000,  insured:false, insurer:'—',              policy:'—',           cover:0,       insExpiry:'',          charge:'Pending',  search:'Clean',    stamp:false, custody:'Borrower',  lastInsp:'2026-06-15', nextInsp:'2026-09-15', condition:'Fair',    photos:1, status:'Pledged',  loan:'LN-2026-0112', notes:'Chattel pledge not yet stamped; inspection overdue.' },
  { id:'C-2026-007', type:'Inventory',          desc:'Assorted stock · grocery',          owner:'Blessings Tembo',      ownerType:'Borrower', reg:'—',        district:'Blantyre', valuer:'Internal estimate', valuation:3200000, valDate:'2026-02-06', forced:1900000, insured:true,  insurer:'General Alliance',policy:'POL-330-2210', cover:2000000, insExpiry:'2026-12-05', charge:'Charged',  search:'Clean',    stamp:true,  custody:'Borrower',  lastInsp:'2026-10-02', nextInsp:'2027-01-02', condition:'Good',    photos:3, status:'Charged',  loan:'LN-2026-0115', notes:'Stock drawdown schedule filed monthly.' },
  { id:'C-2026-008', type:'Salary assignment',  desc:'Assignment of half net salary',     owner:'Fatsani Kaunda',       ownerType:'Borrower', reg:'—',        district:'Lilongwe', valuer:'Employer letter',  valuation:540000, valDate:'2026-06-30', forced:540000,  insured:false, insurer:'—',              policy:'—',           cover:0,       insExpiry:'',          charge:'Charged',  search:'Clean',    stamp:true,  custody:'Safe',      lastInsp:'2026-06-30', nextInsp:'2026-12-30', condition:'Held',    photos:0, status:'Charged',  loan:'LN-2026-0119', notes:'Employer acknowledgement on file.' },
  { id:'C-2026-009', type:'Residential property',desc:'House · Chilomoni, Blantyre',      owner:'Dorothy Nyasulu',      ownerType:'Guarantor', reg:'BT-2290/14',district:'Blantyre',valuer:'Kadale & Co',   valuation:14500000,valDate:'2026-04-20', forced:10800000,insured:true,  insurer:'Nico General',   policy:'POL-229-0014', cover:11000000,insExpiry:'2027-04-19', charge:'Charged',  search:'Clean',    stamp:true,  custody:'Safe',      lastInsp:'2026-07-11', nextInsp:'2027-07-11', condition:'Good',    photos:4, status:'Charged',  loan:'LN-2026-0123', notes:'Guarantor-owned security; deed of consent on file.' },
  { id:'C-2026-010', type:'Equipment',          desc:'Maize mill and generator',          owner:'Tiyamike Mvula',       ownerType:'Borrower', reg:'EQ-4471',  district:'Kasungu',  valuer:'Mabuku Valuers', valuation:2900000, valDate:'2026-03-25', forced:1800000, insured:false, insurer:'—',              policy:'—',           cover:0,       insExpiry:'',          charge:'Charged',  search:'Clean',    stamp:true,  custody:'Borrower',  lastInsp:'2026-05-10', nextInsp:'2026-08-10', condition:'Poor',    photos:2, status:'Charged',  loan:'LN-2026-0127', notes:'Condition declined; repair evidence requested.' },
  { id:'C-2026-011', type:'Motor vehicle',      desc:'Toyota Corolla 2020 · white',       owner:'Alinafe Kachale',      ownerType:'Borrower', reg:'LL 2290',  district:'Lilongwe', valuer:'Auto Assess',   valuation:9400000, valDate:'2026-08-05', forced:7300000, insured:true,  insurer:'General Alliance',policy:'POL-229-3011',cover:7500000, insExpiry:'2027-08-04', charge:'Charged',  search:'Clean',    stamp:true,  custody:'Borrower',  lastInsp:'2026-10-12', nextInsp:'2027-01-12', condition:'Good',    photos:5, status:'Charged',  loan:'LN-2026-0131', notes:'Tracking unit fitted.' },
  { id:'C-2026-012', type:'Land title',         desc:'Plot 9 · Nkhotakota roadside',      owner:'James Kalua',          ownerType:'Guarantor', reg:'NK-09/3',  district:'Nkhotakota',valuer:'Kadale & Co',  valuation:6200000, valDate:'2026-05-12', forced:4600000, insured:false, insurer:'—',              policy:'—',           cover:0,       insExpiry:'',          charge:'Charged',  search:'Encumbered',stamp:true, custody:'Safe',      lastInsp:'2026-05-12', nextInsp:'2027-05-12', condition:'Good',    photos:3, status:'Charged',  loan:'LN-2026-0136', notes:'Prior informal charge noted; consent to discharge obtained.' },
  { id:'C-2026-013', type:'Residential property',desc:'House · Area 25, Lilongwe',        owner:'Lucy Mwale',           ownerType:'Guarantor', reg:'LIL-25/88', district:'Lilongwe', valuer:'Mabuku Valuers', valuation:12000000,valDate:'2025-09-18', forced:8800000, insured:true,  insurer:'Old Mutual',     policy:'POL-258-0088', cover:9000000, insExpiry:'2026-11-15', charge:'Charged',  search:'Clean',    stamp:true,  custody:'Safe',      lastInsp:'2026-03-02', nextInsp:'2026-10-02', condition:'Good',    photos:3, status:'Charged',  loan:'LN-2026-0140', notes:'Valuation older than 12 months; refresh requested.' },
  { id:'C-2026-014', type:'Equipment',          desc:'Sewing machines ×8',                owner:'Pilirani Gondwe',      ownerType:'Borrower', reg:'EQ-8810',  district:'Lilongwe', valuer:'Internal estimate', valuation:1100000, valDate:'2026-07-20', forced:620000,  insured:false, insurer:'—',              policy:'—',           cover:0,       insExpiry:'',          charge:'Pending',  search:'Clean',    stamp:false, custody:'Borrower',  lastInsp:'2026-07-20', nextInsp:'2026-10-20', condition:'Good',    photos:2, status:'Pledged',  loan:'LN-2026-0144', notes:'Chattel pledge awaiting stamping.' },
  { id:'C-2026-015', type:'Motor vehicle',      desc:'Nissan Navara 2016',                owner:'Henry Chikondi',       ownerType:'Guarantor', reg:'DZ 1180',  district:'Dedza',    valuer:'Auto Assess',   valuation:6100000, valDate:'2026-03-06', forced:4400000, insured:false, insurer:'—',              policy:'—',           cover:0,       insExpiry:'',          charge:'Unregistered', search:'Clean', stamp:false, custody:'Third party',lastInsp:'2026-03-06',nextInsp:'2026-06-06', condition:'Fair',    photos:1, status:'Rejected', loan:'LN-2026-0101', notes:'Vehicle held by a third party; charge could not be registered.' },
  { id:'C-2026-016', type:'Fixed deposit',      desc:'Deposit · Standard Bank',           owner:'Esnart Nyirenda',      ownerType:'Borrower', reg:'SB-55801', district:'Blantyre', valuer:'Bank statement', valuation:2000000, valDate:'2026-06-01', forced:2000000, insured:false, insurer:'—',              policy:'—',           cover:0,       insExpiry:'',          charge:'Charged',  search:'Clean',    stamp:true,  custody:'Branch vault', lastInsp:'2026-06-01', nextInsp:'2027-06-01', condition:'Held',    photos:0, status:'Charged',  loan:'LN-2026-0140', notes:'Lien confirmed by the bank.' }
];

/* ---------------- derived views ---------------- */
const G_BY_ID = Object.fromEntries(GUARANTORS.map(g => [g.id, g]));
const C_BY_ID = Object.fromEntries(COLLATERAL.map(c => [c.id, c]));

const loansOfGuarantor = g => LOANS.filter(l => l.id === g.loan);
const collateralOfLoan = id => COLLATERAL.filter(c => c.loan === id && c.status !== 'Rejected');
const guarantorsOfLoan = id => GUARANTORS.filter(g => g.loan === id);

/* enforceable guarantee = committed amount for that loan, only when verified */
const guaranteeFor = loanId => sum(guarantorsOfLoan(loanId), g => g.status === 'Verified' ? g.committed : 0);
/* realisable security = forced-sale value of charged or pledged security */
const securityFor = loanId => sum(collateralOfLoan(loanId), c => (c.status === 'Charged' || c.status === 'Pledged') ? c.forced : 0);
const LTV = c => c.valuation ? pct(LOAN_OUT(c.loan), c.forced) : 0;
const LOAN_OUT = loanId => { const l = LOANS.find(x => x.id === loanId); return l ? l.outstanding : 0; };
const coverOf = loanId => { const l = LOANS.find(x => x.id === loanId); if(!l) return null;
  const g = guaranteeFor(loanId), s = securityFor(loanId), e = l.outstanding;
  return { loan: l, guarantee: g, security: s, exposure: e, total: g + s, gap: Math.max(0, e - (g + s)), ratio: pct(g + s, e) };
};
const COVER = LOANS.map(l => coverOf(l.id));

const kycDone = g => ['id','photo','address','income','bureau','sanctions'].filter(k => g.kyc[k]).length;
const verified = () => GUARANTORS.filter(g => g.status === 'Verified');
const totalGuaranteed = () => sum(GUARANTORS, g => g.committed);
const totalExposure = () => sum(LOANS, l => l.outstanding);
const totalSecurity = () => sum(COLLATERAL, c => c.status === 'Charged' || c.status === 'Pledged' ? c.forced : 0);
const chargeShare = g => g.income ? pct(g.committed + g.otherCommit, g.income * 12) : 0;
const insExpiring = d => d ? daysBetween(TODAY, d) : null;
const valAge = c => ageDays(c.valDate);
</script>
