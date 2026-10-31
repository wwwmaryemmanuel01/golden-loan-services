<script>
/* ============================================================
   GOLDEN FINANCIAL SERVICES · REPAYMENTS & COLLECTIONS  (1/4)
   Core helpers, sample loan book, register and the first three
   sections: overview, record repayment, all repayments.
   ============================================================ */
const el = id => document.getElementById(id);
const nf = n => Math.round(Number(n)||0).toLocaleString('en-US');
const nf2 = n => Number(n||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
const mk = n => 'MK ' + nf(n);
const mk2 = n => 'MK ' + nf2(n);
const TODAY = '2026-10-30';
const initials = s => String(s).split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase();
const nowTime = () => new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});

function toast(msg, type='ok'){
  const t=document.createElement('div');
  t.className='toast '+type;
  t.innerHTML=`<span>${type==='err'?'⚠':type==='info'?'ℹ':'✓'}</span><div>${msg}</div>`;
  el('toasts').appendChild(t);
  setTimeout(()=>{t.style.opacity='0';t.style.transform='translateX(16px)';t.style.transition='.25s';},2600);
  setTimeout(()=>t.remove(),3000);
}
function openModal(title, sub, body, actions=[]){
  el('modalTitle').textContent = title;
  el('modalSub').textContent = sub;
  el('modalBody').innerHTML = body;
  el('modalFoot').innerHTML = '';
  actions.forEach(a=>{
    const b=document.createElement('button');
    b.className='btn '+(a.cls||'btn-ghost'); b.textContent=a.label;
    b.onclick = a.act==='close' ? closeModal : a.act;
    el('modalFoot').appendChild(b);
  });
  el('modal').classList.add('on');
}
function closeModal(){ el('modal').classList.remove('on'); }
document.addEventListener('keydown', e=>{ if(e.key==='Escape') closeModal(); });

/* ----- dates ----- */
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const fmtDate = iso => { const d = new Date(iso+'T00:00:00'); return d.getDate().toString().padStart(2,'0')+' '+MONTHS[d.getMonth()]+' '+d.getFullYear(); };
const fmtShort = iso => { const d = new Date(iso+'T00:00:00'); return d.getDate().toString().padStart(2,'0')+' '+MONTHS[d.getMonth()]; };
const addMonths = (iso, n) => { const d = new Date(iso+'T00:00:00'); d.setMonth(d.getMonth()+n); return d.toISOString().slice(0,10); };
const daysBetween = (a,b) => Math.round((new Date(b+'T00:00:00') - new Date(a+'T00:00:00'))/86400000);

/* ===================== SAMPLE LOAN BOOK ===================== */
const LOANS = [
  {no:'LN-2026-0481', cust:'Chisomo Kachale',  acct:'GF-000481', phone:'+265 999 481 220', product:'Business Boost',  principal:500000,  outstanding:486250, inst:48250,  first:'2026-09-30', term:12, paid:1, dpd:0,   status:'Current',  officer:'Yamikani Banda',    branch:'Blantyre', penalty:0},
  {no:'LN-2026-0479', cust:'Tadala Msonthi',   acct:'GF-000479', phone:'+265 991 220 018', product:'Agri Season',     principal:800000,  outstanding:762000, inst:84000,  first:'2026-09-28', term:12, paid:0, dpd:2,   status:'Current',  officer:'Tadala Msonthi',     branch:'Mangochi', penalty:0},
  {no:'LN-2026-0476', cust:'Memory Phiri',     acct:'GF-000476', phone:'+265 888 220 481', product:'Emergency Cash',  principal:300000,  outstanding:262000, inst:52000,  first:'2026-09-15', term:6,  paid:1, dpd:15,  status:'Arrears',  officer:'Blessings Tembo',    branch:'Limbe',    penalty:2600},
  {no:'LN-2026-0470', cust:'Blessings Tembo',  acct:'GF-000470', phone:'+265 999 610 774', product:'Salary Advance',  principal:250000,  outstanding:205000, inst:45000,  first:'2026-08-30', term:6,  paid:2, dpd:25,  status:'Arrears',  officer:'Linda Mhango',       branch:'Blantyre', penalty:4500},
  {no:'LN-2026-0466', cust:'Alinafe Nyirenda', acct:'GF-000466', phone:'+265 881 442 019', product:'Business Boost',  principal:1200000, outstanding:1180000,inst:112000, first:'2026-09-12', term:12, paid:0, dpd:34,  status:'Arrears',  officer:'Yamikani Banda',    branch:'Lilongwe', penalty:11200},
  {no:'LN-2026-0459', cust:'Esther Mwale',     acct:'GF-000459', phone:'+265 995 118 200', product:'Group Lending',   principal:400000,  outstanding:305000, inst:38000,  first:'2026-07-20', term:12, paid:3, dpd:52,  status:'Delinquent', officer:'Linda Mhango',     branch:'Blantyre', penalty:7600},
  {no:'LN-2026-0455', cust:'Fatsani Gondwe',   acct:'GF-000455', phone:'+265 888 770 040', product:'Asset Finance',   principal:3500000, outstanding:3280000,inst:295000, first:'2026-08-05', term:12, paid:1, dpd:63,  status:'Delinquent', officer:'Tadala Msonthi',   branch:'Kasungu',  penalty:29500},
  {no:'LN-2026-0448', cust:'Linda Mhango',     acct:'GF-000448', phone:'+265 999 004 812', product:'Emergency Cash',  principal:180000,  outstanding:96000,  inst:34000,  first:'2026-06-25', term:6,  paid:2, dpd:78,  status:'Delinquent', officer:'Blessings Tembo',  branch:'Mzuzu',    penalty:10200},
  {no:'LN-2026-0441', cust:'Peter Chirwa',     acct:'GF-000441', phone:'+265 993 220 771', product:'Salary Advance',  principal:220000,  outstanding:205000, inst:48000,  first:'2026-05-30', term:6,  paid:1, dpd:95,  status:'Legal',     officer:'Linda Mhango',     branch:'Mzuzu',    penalty:14400},
  {no:'LN-2026-0437', cust:'Grace Mvula',      acct:'GF-000437', phone:'+265 997 118 004', product:'Business Boost',  principal:900000,  outstanding:860000, inst:88000,  first:'2026-04-15', term:12, paid:0, dpd:110, status:'Legal',     officer:'Yamikani Banda',   branch:'Head Office', penalty:26400},
  {no:'LN-2026-0430', cust:'Joseph Kalua',     acct:'GF-000430', phone:'+265 991 004 220', product:'Agri Season',     principal:600000,  outstanding:415000, inst:62000,  first:'2026-10-05', term:12, paid:1, dpd:0,   status:'Current',  officer:'Tadala Msonthi',   branch:'Zomba',    penalty:0},
  {no:'LN-2026-0425', cust:'Agnes Chikopa',    acct:'GF-000425', phone:'+265 888 118 991', product:'Group Lending',   principal:350000,  outstanding:88000,  inst:31000,  first:'2026-10-25', term:12, paid:8, dpd:3,   status:'Current',  officer:'Blessings Tembo',  branch:'Blantyre', penalty:0}
];
const loanBy = no => LOANS.find(l => l.no === no);
const overdueOf = l => l.dpd > 0 ? Math.round(l.inst * Math.ceil(l.dpd/30)) : 0;
const bucketOf = d => d<=0 ? 'Current' : d<=30 ? '1–30' : d<=60 ? '31–60' : d<=90 ? '61–90' : '90+';

/* ===================== REPAYMENT REGISTER ===================== */
/* [date, time, loan, method, amount, status, reference] */
const SEED = [
  ['2026-10-30','09:12','LN-2026-0481','Cash',48250,'Allocated',null],
  ['2026-10-30','08:58','LN-2026-0479','Airtel Money',84000,'Pending verification','AM-88214051'],
  ['2026-10-30','08:41','LN-2026-0430','Bank transfer',62000,'Verified','NBM-7712094'],
  ['2026-10-30','08:22','LN-2026-0476','Cash',26000,'Pending verification',null],
  ['2026-10-30','08:05','LN-2026-0470','TNM Mpamba',45000,'Allocated','MP-4412093'],
  ['2026-10-30','07:48','LN-2026-0425','Cash',31000,'Allocated',null],
  ['2026-10-29','16:40','LN-2026-0476','Bank transfer',52000,'Allocated','NBM-7710228'],
  ['2026-10-29','16:12','LN-2026-0466','Airtel Money',112000,'Allocated','AM-88190322'],
  ['2026-10-29','15:30','LN-2026-0455','Bank transfer',295000,'Allocated','STD-4410221'],
  ['2026-10-29','14:55','LN-2026-0481','Cash',48250,'Allocated',null],
  ['2026-10-29','13:20','LN-2026-0459','TNM Mpamba',19000,'Verified','MP-4401882'],
  ['2026-10-29','11:48','LN-2026-0448','Cash',34000,'Rejected',null],
  ['2026-10-29','10:15','LN-2026-0479','Airtel Money',84000,'Reversed','AM-88110455'],
  ['2026-10-28','16:05','LN-2026-0437','Bank transfer',88000,'Allocated','FDH-2201938'],
  ['2026-10-28','15:22','LN-2026-0430','Cash',62000,'Allocated',null],
  ['2026-10-28','12:40','LN-2026-0425','Airtel Money',31000,'Allocated','AM-88071110'],
  ['2026-10-28','11:10','LN-2026-0481','Cash',48250,'Allocated',null],
  ['2026-10-27','16:35','LN-2026-0476','Airtel Money',26000,'Allocated','AM-88041208'],
  ['2026-10-27','14:02','LN-2026-0455','Cheque',100000,'Pending verification','CHQ-002841'],
  ['2026-10-27','10:44','LN-2026-0441','Cash',48000,'Allocated',null],
  ['2026-10-26','15:18','LN-2026-0466','Bank transfer',112000,'Allocated','NBM-7708112'],
  ['2026-10-26','09:32','LN-2026-0459','TNM Mpamba',38000,'Allocated','MP-4388211'],
  ['2026-10-25','13:05','LN-2026-0470','Cash',45000,'Allocated',null],
  ['2026-10-25','11:22','LN-2026-0430','Airtel Money',62000,'Allocated','AM-87990221'],
  ['2026-10-24','16:48','LN-2026-0437','Cash',48000,'Pending verification',null],
  ['2026-10-24','14:10','LN-2026-0425','Cash',31000,'Allocated',null],
  ['2026-10-23','15:35','LN-2026-0481','Bank transfer',48250,'Allocated','NBM-7701440'],
  ['2026-10-23','12:02','LN-2026-0476','Cash',26000,'Allocated',null],
  ['2026-10-22','16:20','LN-2026-0455','Bank transfer',295000,'Allocated','STD-4398810'],
  ['2026-10-22','10:05','LN-2026-0466','Airtel Money',56000,'Allocated','AM-87881220'],
  ['2026-10-21','14:38','LN-2026-0448','Cash',34000,'Allocated',null],
  ['2026-10-21','09:15','LN-2026-0459','Bank transfer',38000,'Allocated','NBM-7698811'],
  ['2026-10-20','16:44','LN-2026-0470','TNM Mpamba',45000,'Allocated','MP-4371204'],
  ['2026-10-20','11:30','LN-2026-0441','Cash',15000,'Allocated',null],
  ['2026-10-19','15:12','LN-2026-0437','Airtel Money',88000,'Allocated','AM-87711404'],
  ['2026-10-19','10:02','LN-2026-0425','Cash',31000,'Allocated',null],
  ['2026-10-18','14:26','LN-2026-0481','Cash',48250,'Allocated',null],
  ['2026-10-17','13:40','LN-2026-0466','Bank transfer',112000,'Allocated','NBM-7689012'],
  ['2026-10-16','09:50','LN-2026-0479','Airtel Money',84000,'Allocated','AM-87612090'],
  ['2026-10-15','16:08','LN-2026-0459','Cash',38000,'Allocated',null]
];
let RCPT_SEQ = 512;
const REPAYMENTS = SEED.map((r,i)=>({
  id: 'PAY-'+(1000-i),
  date: r[0], time: r[1], loan: r[2],
  cust: loanBy(r[2]) ? loanBy(r[2]).cust : '—',
  method: r[3], amount: r[4], status: r[5], ref: r[6],
  receipt: 'RCP-' + String(RCPT_SEQ - i).padStart(6,'0'),
  officer: ['Memory Phiri','Fatsani Gondwe','Esther Mwale'][i % 3],
  notes: '', evidence: r[3]==='Cash' ? null : (r[6] ? 'slip-' + r[6].toLowerCase() + '.jpg' : null),
  verifiedBy: ['Allocated','Verified','Reversed'].includes(r[5]) ? 'Thandiwe Kamanga' : null,
  verifiedAt: ['Allocated','Verified','Reversed'].includes(r[5]) ? r[0] + ' · ' + r[1] : null,
  rejected: r[5]==='Rejected' ? 'Deposit slip not found at the bank' : null,
  rejReason: r[5]==='Rejected' ? 'No matching deposit on the bank statement' : null,
  alloc: null
}));
/* push the oldest rows back across the previous two months so the month-to-date
   totals differ from all-time and the register has real history */
const shiftISO = (iso, days) => {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0,10);
};
REPAYMENTS.forEach((p,i)=>{
  if(i >= 33) p.date = shiftISO(p.date, 61);
  else if(i >= 25) p.date = shiftISO(p.date, 30);
});

/* allocation split for the already-allocated rows */
REPAYMENTS.filter(p=>p.status==='Allocated').forEach(p=>{
  const pen = loanBy(p.loan).penalty ? Math.min(loanBy(p.loan).penalty, Math.round(p.amount*0.1)) : 0;
  const fees = 0;
  const interest = Math.min(Math.round(p.amount*0.15), p.amount - pen);
  const principal = p.amount - pen - fees - interest;
  p.alloc = {pen, fees, interest, principal};
});

/* ===================== AUDIT / MESSAGE / TASK STORES ===================== */
const AUDIT = [];
function logPay(cat, action, record, amount, result='Success', actor='Memory Phiri'){
  AUDIT.unshift({time:nowTime(), date:TODAY, cat, action, record, amount, result, actor, ip:'197.210.14.22'});
  if(AUDIT.length > 200) AUDIT.pop();
}
[
  ['Verification','Payment verified · RCP-000505','RCP-000505',84000,'Success','Thandiwe Kamanga'],
  ['Allocation','Allocated to interest & principal · RCP-000512','RCP-000512',48250,'Success','Thandiwe Kamanga'],
  ['Creation','Repayment recorded · RCP-000512','RCP-000512',48250,'Success','Memory Phiri'],
  ['Receipt','Receipt printed · RCP-000512','RCP-000512',48250,'Success','Memory Phiri'],
  ['Reversal','Reversal approved · RCP-000501','RCP-000501',84000,'Success','Chikondi Mwale'],
  ['Access','Repayment register opened','register',0,'Success','Grace Mvula'],
  ['Creation','Repayment rejected · RCP-000503','RCP-000503',34000,'Warning','Thandiwe Kamanga'],
  ['Correction','Allocation corrected · RCP-000498','RCP-000498',19000,'Success','Chikondi Mwale'],
  ['Verification','Cheque verification pending · CHQ-002841','RCP-000516',100000,'Warning','Thandiwe Kamanga']
].forEach(([cat,action,record,amount,result,actor])=>AUDIT.push({time:'08:30',date:'2026-10-29',cat,action,record,amount,result,actor,ip:'197.210.14.31'}));

/* ===================== SMALL CHART HELPERS ===================== */
function mkBars(host, labels, series, opt={}){
  if(!host) return;
  const W=640,H=opt.height||210,L=44,R=10,T=14,B=26, iw=W-L-R, ih=H-T-B;
  const max = Math.max(1, ...series.flatMap(s=>s.data));
  const yMax = Math.ceil(max/1000000)*1000000 || max;
  const step = iw/labels.length;
  let g='';
  for(let i=0;i<=4;i++){
    const v=yMax/4*i, y=T+ih-(v/yMax)*ih;
    g+=`<line x1="${L}" y1="${y.toFixed(1)}" x2="${W-R}" y2="${y.toFixed(1)}" stroke="#EEF0F4"/>`;
    g+=`<text x="${L-7}" y="${(y+3).toFixed(1)}" text-anchor="end" font-size="8.5" fill="#9AA0AC" font-family="inherit">${(v/1000000).toFixed(1)}m</text>`;
  }
  labels.forEach((lb,i)=>g+=`<text x="${(L+step*i+step/2).toFixed(1)}" y="${H-8}" text-anchor="middle" font-size="9" fill="#8A90A0" font-weight="600" font-family="inherit">${lb}</text>`);
  const bw = Math.min(15,(step-10)/series.length);
  labels.forEach((lb,i)=>{
    const gx = L + step*i + step/2;
    series.forEach((s,j)=>{
      const v = s.data[i]||0, h=(v/yMax)*ih;
      const x = gx - (series.length*bw)/2 + j*bw;
      const y = T+ih-h, r=Math.min(3,bw/2);
      g+=`<path d="M${x.toFixed(1)} ${(y+r).toFixed(1)} q0 ${-r} ${r} ${-r} h${(bw-4).toFixed(1)} q${r} 0 ${r} ${r} v${(h-r).toFixed(1)} h${(-bw+4).toFixed(1)} Z" fill="${s.color}"><title>${lb} · ${s.name}: ${mk(v)}</title></path>`;
    });
  });
  host.innerHTML = g;
}
function mkDonut(host, data, center){
  if(!host) return;
  const total = data.reduce((s,d)=>s+d.value,0)||1;
  const c=75, r=52, sw=16, C=2*Math.PI*r, GAP=2.5;
  let off=0, arcs='';
  data.forEach(d=>{
    const len=(d.value/total)*C, dash=Math.max(len-GAP,0.6);
    arcs+=`<circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="${d.color}" stroke-width="${sw}"
      stroke-dasharray="${dash.toFixed(2)} ${(C-dash).toFixed(2)}" stroke-dashoffset="${(-off).toFixed(2)}"
      transform="rotate(-90 ${c} ${c})"><title>${d.label}: ${mk(d.value)}</title></circle>`;
    off+=len;
  });
  host.innerHTML = `<circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="#F1F2F6" stroke-width="${sw}"/>${arcs}
    <text x="${c}" y="${c-2}" text-anchor="middle" font-size="17" font-weight="800" fill="#0F1115" font-family="inherit">${center}</text>
    <text x="${c}" y="${c+13}" text-anchor="middle" font-size="8" font-weight="700" fill="#8A90A0" font-family="inherit">TOTAL</text>`;
}
function progressRows(host, rows){
  if(!host) return;
  host.innerHTML = rows.map(r=>`<div class="prow">
    <div class="pl" title="${r.label}">${r.label}</div>
    <div class="pt"><i style="width:${Math.max(2,Math.min(100,r.pct))}%;background:${r.color||'#C9A227'}"></i></div>
    <div class="pv">${r.display}</div></div>`).join('');
}

/* ===================== DERIVED TOTALS ===================== */
const sum = (arr,f) => arr.reduce((s,x)=>s+(f?f(x):x),0);
const collected = () => sum(REPAYMENTS.filter(p=>['Allocated','Verified'].includes(p.status)), p=>p.amount);
const allocatedTotal = () => sum(REPAYMENTS.filter(p=>p.status==='Allocated'), p=>p.amount);
const pendingList = () => REPAYMENTS.filter(p=>p.status==='Pending verification');
const unallocList = () => REPAYMENTS.filter(p=>p.status==='Verified');
const todayList = () => REPAYMENTS.filter(p=>p.date===TODAY);
const monthList = () => REPAYMENTS.filter(p=>p.date.slice(0,7)==='2026-10');
/* October target: instalments falling due this month plus the arrears the branch
   is working to recover (see the arrears section for the overdue book). */
const EXPECTED_MONTH = 1750000;
const cleared = p => p.status === 'Allocated' || p.status === 'Verified';
const octoberCleared = () => sum(monthList().filter(cleared), p=>p.amount);
const todayCleared   = () => sum(todayList().filter(cleared), p=>p.amount);

/* ===================== 1 · OVERVIEW ===================== */
function renderOverview(){
  const pend = pendingList(), un = unallocList(), tod = todayList(), mon = monthList();
  const received = collected();
  const mtd = octoberCleared();
  const overdueTotal = sum(LOANS, overdueOf);
  const partials = LOANS.filter(l=>l.dpd>0).length;
  const expectedToday = sum(LOANS.filter(l=>scheduleFor(l).some(s=>s.due===TODAY)), l=>l.inst);

  const tiles = [
    ['Total received', mk(received), 'All time · '+REPAYMENTS.filter(cleared).length+' cleared payments', 'gold', ''],
    ['Today', mk(todayCleared()), tod.length+' recorded · expected '+mk(expectedToday), '', ''],
    ['This month', mk(octoberCleared()), Math.round(octoberCleared()/EXPECTED_MONTH*100)+'% of expected', '', ''],
    ['Expected · October', mk(EXPECTED_MONTH), 'Scheduled for the month', 'blue', ''],
    ['Outstanding book', mk(sum(LOANS,l=>l.outstanding)), LOANS.length+' active loans', '', ''],
    ['Overdue', mk(overdueTotal), LOANS.filter(l=>l.dpd>0).length+' accounts behind', 'red', ''],
    ['Partially paid', String(partials), 'instalments across the book', '', ''],
    ['Unallocated', mk(sum(un,p=>p.amount)), un.length+' payments awaiting allocation', un.length?'gold':'', ''],
    ['Pending verification', mk(sum(pend,p=>p.amount)), pend.length+' payments to confirm', pend.length?'red':'', ''],
    ['Recovery rate', Math.round(octoberCleared()/EXPECTED_MONTH*100)+'%', 'of the month target', '', '']
  ];
  el('ovTiles').innerHTML = tiles.map(([l,v,s,cls,extra])=>`
    <div class="kpi ${cls}"><div class="kl">${l}</div><div class="kv">${v}</div>
      <div class="ks">${s}</div></div>`).join('');

  const labels = ['May','Jun','Jul','Aug','Sep','Oct'];
  mkBars(el('ovTrend'), labels, [
    {name:'Expected', color:'#2F6FED', data:[1560000,1620000,1640000,1690000,1720000,EXPECTED_MONTH]},
    {name:'Received', color:'#C9A227', data:[1184000,1306000,1242000,1388000,1404500,mtd]}
  ]);
  el('ovTrendFoot').innerHTML = `<b><i style="background:#C9A227"></i>Month to date ${mk(mtd)}</b>
    <b><i style="background:#2F6FED"></i>Expected ${mk(EXPECTED_MONTH)}</b>
    <b style="color:${mtd>EXPECTED_MONTH*0.8?'#157A50':'#B32C2C'}">${Math.round(mtd/EXPECTED_MONTH*100)}% collected</b>`;

  const byMethod = ['Cash','Bank transfer','Airtel Money','TNM Mpamba','Cheque'].map(m=>({
    label:m, value: sum(REPAYMENTS.filter(p=>p.method===m && !['Rejected','Reversed'].includes(p.status)), p=>p.amount),
    color: {'Cash':'#C9A227','Bank transfer':'#2F6FED','Airtel Money':'#1E9E6A','TNM Mpamba':'#5A3FCB','Cheque':'#E08C1E'}[m]
  })).filter(d=>d.value>0);
  const totalMix = byMethod.reduce((s,d)=>s+d.value,0);
  mkDonut(el('ovMix'), byMethod, (totalMix/1000000).toFixed(1)+'m');
  el('ovMixLegend').innerHTML = byMethod.map(d=>`
    <div style="display:flex;justify-content:space-between;gap:8px;font-size:10.5px;padding:4px 0;border-bottom:1px dashed #EDEFF4">
      <span style="display:flex;align-items:center;gap:6px;color:#3A3F4A;font-weight:600">
        <i style="width:8px;height:8px;border-radius:2px;background:${d.color};display:inline-block"></i>${d.label}</span>
      <b style="font-variant-numeric:tabular-nums">${Math.round(d.value/totalMix*100)}%</b></div>`).join('');

  el('ovRecent').innerHTML = REPAYMENTS.slice(0,9).map(p=>`<tr>
    <td style="font-variant-numeric:tabular-nums;white-space:nowrap">${fmtShort(p.date)} · ${p.time}</td>
    <td style="font-size:10px;font-family:ui-monospace,monospace">${p.receipt}</td>
    <td>${p.cust}</td><td class="num">${nf(p.amount)}</td><td>${p.method}</td>
    <td><span class="chip ${statusChip(p.status)}">${p.status}</span></td></tr>`).join('');

  const alerts = [];
  if(pend.length) alerts.push(['Payments awaiting verification', pend.length+' · '+mk(sum(pend,p=>p.amount)), 'High', 's4']);
  if(un.length) alerts.push(['Verified but not allocated', un.length+' · '+mk(sum(un,p=>p.amount)), 'High', 's5']);
  const rej = REPAYMENTS.filter(p=>p.status==='Rejected').length;
  if(rej) alerts.push(['Rejected payments', rej+' needing a corrected entry', 'Medium', 's3']);
  alerts.push(['Instalments due today', LOANS.filter(l=>scheduleFor(l).some(s=>s.due===TODAY&&s.status!=='Paid')).length+' loans · '+mk(expectedToday), 'Medium', 's6']);
  el('ovAlertCount').textContent = alerts.length;
  el('ovAlerts').innerHTML = alerts.map(([t,s,lvl,sec])=>`<div class="lrow">
    <div class="lic" style="background:${lvl==='High'?'#FDEDEC':'#FFF4E0'};color:${lvl==='High'?'#B32C2C':'#9A6A0D'}">!</div>
    <div><div class="lt">${t}</div><div class="ls">${s}</div></div>
    <div class="lr"><button class="btn btn-ghost btn-sm" data-jump="${sec}">Open</button></div></div>`).join('');
  el('ovAlerts').querySelectorAll('[data-jump]').forEach(b=>b.onclick=()=>gotoSec(b.dataset.jump));

  progressRows(el('ovRecovery'), [
    {label:'This month', pct:mtd/EXPECTED_MONTH*100, display:Math.round(mtd/EXPECTED_MONTH*100)+'%'},
    {label:'Target · 95%', pct:95, display:'MK '+nf(EXPECTED_MONTH*0.95), color:'#1E9E6A'},
    {label:'Overdue recovered', pct:62, display:'62%', color:'#D93F3F'},
    {label:'Promises kept', pct:74, display:'74%', color:'#2F6FED'}
  ]);

  el('bandCollected').textContent = mk(octoberCleared());
  el('bandToday').textContent = mk(todayCleared());
  el('bandPending').textContent = pend.length;
  el('bandOverdue').textContent = mk(overdueTotal);
}
function statusChip(s){
  return {'Allocated':'st-ok','Verified':'st-conf','Pending verification':'st-await',
    'Rejected':'st-rej','Reversed':'st-rev'}[s] || 'st-pending';
}
function gotoSec(id){
  const t = document.querySelector('#s'+id);
  if(t) window.scrollTo({top:t.offsetTop-112, behavior:'smooth'});
}

/* ===================== 2 · RECORD REPAYMENT ===================== */
const RC = {loan:null, evidence:[]};
function nextReceipt(){
  return 'RCP-' + String(RCPT_SEQ + REPAYMENTS.filter(p=>p.id.startsWith('PAY-N')).length + 1).padStart(6,'0');
}
function renderRecord(){
  const sel = el('rcLoan');
  if(sel){
    sel.innerHTML = '<option value="">Select loan account…</option>' + LOANS.map(l=>
      `<option value="${l.no}"${RC.loan===l.no?' selected':''}>${l.no} · ${l.cust} · ${l.product}</option>`).join('');
  }
  el('rcReceipt').value = nextReceipt();
  el('rcTodayCount').textContent = todayList().length + ' receipts';
  el('rcToday').innerHTML = todayList().slice(0,6).map(p=>`<div class="lrow">
    <div class="lic">${p.receipt.slice(-3)}</div>
    <div><div class="lt">${p.cust}</div><div class="ls">${p.method} · ${p.time}</div></div>
    <div class="lr"><b style="font-variant-numeric:tabular-nums;font-size:11px">${mk(p.amount)}</b>
      <span class="chip ${statusChip(p.status)}">${p.status.split(' ')[0]}</span></div></div>`).join('')
    || '<div class="empty">No receipts issued yet today.</div>';
  renderRcLoan();
}
function renderRcLoan(){
  const l = RC.loan ? loanBy(RC.loan) : null;
  if(!l){
    el('rcLoanSub').textContent = 'No loan selected';
    el('rcLoanCard').innerHTML = `<div class="empty">Search for a customer or pick a loan account to see its position.</div>`;
    el('rcAlloc').innerHTML = `<div class="empty">Select a loan and enter an amount.</div>`;
    el('allocInst').innerHTML = '<option value="">Apply to arrears first</option>';
    return;
  }
  const paid = l.term - Math.ceil(l.outstanding / l.inst);
  el('rcLoanSub').textContent = l.no + ' · ' + l.product;
  el('rcLoanCard').innerHTML = `
    <div style="display:flex;align-items:center;gap:9px;margin-top:2px">
      <div class="sav" style="width:34px;height:34px;border-radius:10px;display:grid;place-items:center;
        background:var(--gold-soft);color:var(--gold-dark);font-size:11px;font-weight:800">${initials(l.cust)}</div>
      <div><div style="font-size:12px;font-weight:700">${l.cust}</div>
        <div style="font-size:10px;color:var(--muted)">${l.acct} · ${l.phone}</div></div>
      <span class="chip ${l.dpd?'st-rev':'st-ok'}" style="margin-left:auto">${l.status}</span>
    </div>
    <div class="kv" style="margin-top:9px"><span class="k">Outstanding balance</span><span class="v big">${mk(l.outstanding)}</span></div>
    <div class="kv"><span class="k">Monthly instalment</span><span class="v">${mk(l.inst)}</span></div>
    <div class="kv"><span class="k">Next payment due</span><span class="v">${fmtDate(nextDueOf(l))}</span></div>
    <div class="kv"><span class="k">Arrears</span><span class="v" style="color:${l.dpd?'#B32C2C':'#157A50'}">${l.dpd?mk(overdueOf(l)):'None'}</span></div>
    <div class="kv"><span class="k">Days past due</span><span class="v">${l.dpd}</span></div>
    <div class="kv"><span class="k">Penalties outstanding</span><span class="v">${mk(l.penalty)}</span></div>
    <div class="kv"><span class="k">Collection officer</span><span class="v">${l.officer}</span></div>`;
  el('rcAmountHint').textContent = 'Scheduled instalment: ' + mk(l.inst);
  el('allocInst').innerHTML = '<option value="">Apply to arrears first</option>' +
    scheduleFor(l).filter(s=>s.status!=='Paid').map(s=>
      `<option value="${s.n}">Instalment ${s.n} · ${fmtDate(s.due)} · ${mk(s.amount)}</option>`).join('');
  renderRcAlloc();
}
function nextDueOf(l){
  const s = scheduleFor(l).find(x=>x.status!=='Paid');
  return s ? s.due : addMonths(l.first, l.term-1);
}
function splitPayment(l, amount){
  const pen = Math.min(l.penalty, Math.round(amount*0.10));
  let rest = amount - pen;
  const fees = Math.min(2000, rest);
  rest -= fees;
  const interest = Math.min(Math.round(l.outstanding*0.045), rest);
  rest -= interest;
  const principal = rest;
  return {pen, fees, interest, principal};
}
function renderRcAlloc(){
  const l = RC.loan ? loanBy(RC.loan) : null;
  const amt = Number(el('rcAmount').value) || 0;
  if(!l){ el('rcAlloc').innerHTML = `<div class="empty">Select a loan and enter an amount.</div>`; return; }
  const a = splitPayment(l, amt);
  const total = a.pen+a.fees+a.interest+a.principal || 1;
  const seg = (v,c)=> v>0 ? `<span style="width:${(v/total*100).toFixed(1)}%;background:${c}"></span>` : '';
  el('rcAlloc').innerHTML = `
    <div class="allocbar">${seg(a.pen,'#D93F3F')}${seg(a.fees,'#E08C1E')}${seg(a.interest,'#2F6FED')}${seg(a.principal,'#1E9E6A')}</div>
    <div class="allocleg">
      <b><i style="background:#D93F3F"></i>Penalty ${mk(a.pen)}</b>
      <b><i style="background:#E08C1E"></i>Fees ${mk(a.fees)}</b>
      <b><i style="background:#2F6FED"></i>Interest ${mk(a.interest)}</b>
      <b><i style="background:#1E9E6A"></i>Principal ${mk(a.principal)}</b>
    </div>
    <div class="kv" style="margin-top:9px"><span class="k">Balance after payment</span>
      <span class="v big">${mk(Math.max(0, l.outstanding - a.principal))}</span></div>
    <div class="kv"><span class="k">Overpayment</span>
      <span class="v" style="color:${amt > l.outstanding ? '#9A6A0D' : '#157A50'}">${amt > l.outstanding ? mk(amt - l.outstanding) + ' → unallocated' : 'None'}</span></div>`;
}
function rcSearchLoans(){
  const q = el('rcSearch').value.trim().toLowerCase();
  const box = el('rcResults');
  if(!q){ box.innerHTML=''; return; }
  const hits = LOANS.filter(l => (l.cust+' '+l.no+' '+l.acct+' '+l.phone+' '+l.product).toLowerCase().includes(q)).slice(0,6);
  box.innerHTML = hits.length ? `<div class="card" style="margin-top:9px;padding:4px">` + hits.map(l=>`
    <div class="lrow" data-pick="${l.no}" style="padding:8px 10px;cursor:pointer;border-radius:8px">
      <div class="lic">${initials(l.cust)}</div>
      <div><div class="lt">${l.cust}</div>
        <div class="ls">${l.no} · ${l.product} · ${l.acct}</div></div>
      <div class="lr"><div style="text-align:right"><b style="font-size:11px;font-variant-numeric:tabular-nums">${mk(l.outstanding)}</b>
        <div style="font-size:9px;color:${l.dpd?'#B32C2C':'var(--muted)'}">${l.dpd?l.dpd+' days late':'Current'}</div></div></div>
    </div>`).join('') + `</div>` : `<div class="note" style="margin-top:9px"><div>No loan matches “${q}”.</div></div>`;
  box.querySelectorAll('[data-pick]').forEach(row=>{
    row.onclick = ()=>{ selectLoan(row.dataset.pick); box.innerHTML=''; el('rcSearch').value=''; };
  });
}
function selectLoan(no){
  RC.loan = no;
  el('rcLoan').value = no;
  const l = loanBy(no);
  el('rcAmount').value = l.inst;
  renderRcLoan(); renderRcAlloc();
}
function addEvidence(){
  const names = ['bank-slip.jpg','airtel-sms.png','mpamba-screenshot.png','deposit-slip.pdf'];
  const name = names[RC.evidence.length % names.length];
  RC.evidence.push(name);
  el('rcEvidenceList').innerHTML = RC.evidence.map((f,i)=>`<div class="evidence">
    <div class="ei">${f.split('.').pop().toUpperCase()}</div>
    <div><b>${f}</b><span>Attached · 1.2 MB · sample file</span></div>
    <button class="btn btn-ghost btn-sm" data-rm="${i}" style="margin-left:auto">Remove</button></div>`).join('');
  el('rcEvidenceList').querySelectorAll('[data-rm]').forEach(b=>{
    b.onclick = ()=>{ RC.evidence.splice(Number(b.dataset.rm),1); addEvidenceRefresh(); };
  });
  el('rcEvidence').textContent = 'Attach another file (PDF, JPG, PNG · max 5 MB)';
}
function addEvidenceRefresh(){
  if(!RC.evidence.length){
    el('rcEvidenceList').innerHTML='';
    el('rcEvidence').textContent = 'Click to attach a receipt photo, bank slip or mobile money screenshot (PDF, JPG, PNG · max 5 MB)';
    return;
  }
  const list = RC.evidence.map((f,i)=>`<div class="evidence">
    <div class="ei">${f.split('.').pop().toUpperCase()}</div>
    <div><b>${f}</b><span>Attached · 1.2 MB · sample file</span></div>
    <button class="btn btn-ghost btn-sm" data-rm="${i}" style="margin-left:auto">Remove</button></div>`).join('');
  el('rcEvidenceList').innerHTML = list;
  el('rcEvidenceList').querySelectorAll('[data-rm]').forEach(b=>{
    b.onclick = ()=>{ RC.evidence.splice(Number(b.dataset.rm),1); addEvidenceRefresh(); };
  });
}
function submitRepayment(verifyNow){
  const l = RC.loan ? loanBy(RC.loan) : null;
  const amt = Number(el('rcAmount').value) || 0;
  const method = el('rcMethod').value;
  const ref = el('rcRef').value.trim();
  if(!l){ toast('Select a loan account first.','err'); return; }
  if(amt <= 0){ toast('Enter a payment amount.','err'); return; }
  if(method !== 'Cash' && !ref){ toast('A transaction reference is required for '+method+'.','err'); return; }
  if(amt > 500000 && method !== 'Cash' && !RC.evidence.length && !verifyNow){
    toast('Attach payment evidence for amounts above MK 500,000.','err'); return;
  }
  if(REPAYMENTS.some(p=>p.ref && p.ref.toLowerCase()===ref.toLowerCase() && ref)){
    toast('That transaction reference has already been used.','err');
    logPay('Creation','Duplicate reference blocked · '+ref,'register',amt,'Warning');
    return;
  }
  const status = verifyNow ? 'Verified' : 'Pending verification';
  const p = {
    id:'PAY-N'+(REPAYMENTS.filter(x=>x.id.startsWith('PAY-N')).length+1),
    date: el('rcDate').value || TODAY, time: nowTime(), loan: l.no, cust: l.cust,
    method, amount: amt, status, ref: ref || null, receipt: el('rcReceipt').value,
    officer: 'Memory Phiri', notes: el('rcNotes').value.trim(),
    evidence: RC.evidence[0] || null,
    verifiedBy: verifyNow ? 'Memory Phiri' : null,
    verifiedAt: verifyNow ? TODAY + ' · ' + nowTime() : null,
    alloc: null
  };
  REPAYMENTS.unshift(p);
  logPay('Creation', 'Repayment recorded · '+p.receipt, p.receipt, amt);
  logPay('Receipt', 'Receipt issued · '+p.receipt, p.receipt, amt);
  if(verifyNow) logPay('Verification','Payment verified on capture · '+p.receipt, p.receipt, amt);
  toast(`${mk(amt)} recorded for ${l.cust} · ${p.receipt} (${status.toLowerCase()}).`);
  RC.loan = null; RC.evidence = [];
  el('rcAmount').value=''; el('rcRef').value=''; el('rcNotes').value='';
  el('rcEvidenceList').innerHTML='';
  el('rcEvidence').textContent = 'Click to attach a receipt photo, bank slip or mobile money screenshot (PDF, JPG, PNG · max 5 MB)';
  renderAll();
}

/* ===================== 3 · ALL REPAYMENTS ===================== */
const REG = {by:'customer', q:'', from:'2026-10-01', to:'2026-10-30', method:'', status:'', page:1, per:10};
function regFiltered(){
  const q = REG.q.trim().toLowerCase();
  return REPAYMENTS.filter(p=>{
    if(REG.method && p.method !== REG.method) return false;
    if(REG.status && p.status !== REG.status) return false;
    if(REG.from && p.date < REG.from) return false;
    if(REG.to && p.date > REG.to) return false;
    if(!q) return true;
    const field = {
      customer: p.cust, account: (loanBy(p.loan)||{}).acct || '', loan: p.loan,
      receipt: p.receipt, ref: p.ref || ''
    }[REG.by] || '';
    return String(field).toLowerCase().includes(q);
  });
}
function renderRegister(){
  const rows = regFiltered();
  const pages = Math.max(1, Math.ceil(rows.length/REG.per));
  if(REG.page > pages) REG.page = pages;
  const slice = rows.slice((REG.page-1)*REG.per, REG.page*REG.per);
  el('regBody').innerHTML = slice.length ? slice.map(p=>`<tr>
    <td style="font-family:ui-monospace,monospace;font-size:10px">${p.receipt}</td>
    <td style="white-space:nowrap;font-size:10.5px">${fmtShort(p.date)} ${p.time}</td>
    <td>${p.cust}</td>
    <td style="font-size:10px;color:var(--muted)">${p.loan}</td>
    <td class="num">${nf(p.amount)}</td>
    <td>${p.method}</td>
    <td style="font-size:10px;font-family:ui-monospace,monospace">${p.ref || '—'}</td>
    <td><span class="chip ${statusChip(p.status)}">${p.status}</span></td>
    <td style="text-align:right"><button class="btn btn-ghost btn-sm" data-pay="${p.id}"
      style="padding:2px 7px;font-size:10px">View</button></td></tr>`).join('')
    : `<tr><td colspan="9" class="empty">No payments match these filters.</td></tr>`;
  el('regCount').textContent = rows.length + ' payments';
  el('regPager').innerHTML = rows.length ? `<span>Showing ${(REG.page-1)*REG.per+1}–${Math.min(REG.page*REG.per,rows.length)} of ${rows.length}</span>
    <button id="regPrev" ${REG.page===1?'disabled':''}>‹ Prev</button>
    <button id="regNext" ${REG.page===pages?'disabled':''}>Next ›</button>` : '';
  if(el('regPrev')) el('regPrev').onclick = ()=>{ REG.page--; renderRegister(); };
  if(el('regNext')) el('regNext').onclick = ()=>{ REG.page++; renderRegister(); };
  el('regBody').querySelectorAll('[data-pay]').forEach(b=>{
    b.onclick = ()=>payModal(REPAYMENTS.find(p=>p.id===b.dataset.pay));
  });
}
function payModal(p){
  if(!p) return;
  const l = loanBy(p.loan) || {};
  const a = p.alloc;
  openModal('Repayment ' + p.receipt, p.cust + ' · ' + p.loan + ' · ' + p.status, `
    <div class="split even">
      <div>
        <div class="kv"><span class="k">Receipt</span><span class="v">${p.receipt}</span></div>
        <div class="kv"><span class="k">Date &amp; time</span><span class="v">${fmtDate(p.date)} · ${p.time}</span></div>
        <div class="kv"><span class="k">Customer</span><span class="v">${p.cust}</span></div>
        <div class="kv"><span class="k">Loan</span><span class="v">${p.loan}</span></div>
        <div class="kv"><span class="k">Amount</span><span class="v big">${mk2(p.amount)}</span></div>
        <div class="kv"><span class="k">Method</span><span class="v">${p.method}</span></div>
        <div class="kv"><span class="k">Reference</span><span class="v">${p.ref || '—'}</span></div>
        <div class="kv"><span class="k">Recorded by</span><span class="v">${p.officer}</span></div>
      </div>
      <div>
        <div class="kv"><span class="k">Status</span><span class="v">${p.status}</span></div>
        <div class="kv"><span class="k">Verified by</span><span class="v">${p.verifiedBy || '—'}</span></div>
        <div class="kv"><span class="k">Verified at</span><span class="v">${p.verifiedAt || '—'}</span></div>
        <div class="kv"><span class="k">Outstanding after</span><span class="v">${mk(Math.max(0,(l.outstanding||0) - (a?a.principal:0)))}</span></div>
        <div class="kv"><span class="k">Notes</span><span class="v" style="white-space:normal;text-align:right">${p.notes || '—'}</span></div>
        ${p.rejReason?`<div class="note red" style="margin-top:8px"><div><b>Rejected:</b> ${p.rejReason}</div></div>`:''}
      </div>
    </div>
    ${a?`<div class="minihead" style="margin-top:12px">Allocation</div>
      <div class="allocbar">
        <span style="width:${a.pen/p.amount*100}%;background:#D93F3F"></span>
        <span style="width:${a.fees/p.amount*100}%;background:#E08C1E"></span>
        <span style="width:${a.interest/p.amount*100}%;background:#2F6FED"></span>
        <span style="width:${a.principal/p.amount*100}%;background:#1E9E6A"></span></div>
      <div class="allocleg"><b>Penalty ${mk(a.pen)}</b><b>Fees ${mk(a.fees)}</b>
        <b>Interest ${mk(a.interest)}</b><b>Principal ${mk(a.principal)}</b></div>`:''}
    <div class="minihead" style="margin-top:12px">Audit trail</div>
    <div class="tl">
      <div class="tl-item"><b>Recorded</b><span>${fmtDate(p.date)} ${p.time} · ${p.officer}</span></div>
      ${p.verifiedAt?`<div class="tl-item"><b>${p.status==='Rejected'?'Rejected':'Verified'}</b><span>${p.verifiedAt} · ${p.verifiedBy||'—'}</span></div>`:''}
      ${p.alloc?`<div class="tl-item"><b>Allocated</b><span>Principal ${mk(p.alloc.principal)} · interest ${mk(p.alloc.interest)}</span></div>`:''}
    </div>`,
    [{label:'Close', act:'close'},
     {label:'View receipt', cls:'btn-ghost', act:()=>{ closeModal(); receiptModal(p); }},
     ...(p.status==='Pending verification' ? [{label:'Verify now', cls:'btn-gold', act:()=>{
        verifyPayment(p); closeModal();
     }}] : [])]);
}
