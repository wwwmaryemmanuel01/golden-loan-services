
/* ============================================================
   SECTION STRIPS + REPORT TILES
   ============================================================ */
const STRIPS = {
  1: [['Portfolio outstanding', mkm(BOOK.outstanding), 'book under management'],
      ['Collected · October', mkm(BOOK.collected), BOOK.receipts+' receipts posted'],
      ['PAR 30+', BOOK.par30.toFixed(1)+'%', 'target ≤ 8.0%'],
      ['Active borrowers', nf(BOOK.activeBorrowers), 'of '+CUSTOMERS.length+' customers']],
  2: [['Loans on book', nf(LOANS.length), BOOK.active+' currently active'],
      ['Principal disbursed', mkm(BOOK.principal), 'cumulative'],
      ['Outstanding', mkm(BOOK.outstanding), 'closing balances'],
      ['Fully repaid', nf(BOOK.repaid), 'closed accounts']],
  3: [['Receipts posted', nf(BOOK.receipts), 'October 2026'],
      ['Cash collected', mkm(BOOK.collected), 'principal + interest + fees'],
      ['Interest & fees', mkm(BOOK.interest+BOOK.fees), 'income portion'],
      ['Failed / reversed', nf(REPAYS.filter(r=>r.status!=='Posted').length), 'need follow-up']],
  4: [['Overdue balance', mkm(BOOK.overdue), 'past due exposure'],
      ['Loans in arrears', nf(LOANS.filter(l=>l.dpd>0).length), 'of '+LOANS.length+' loans'],
      ['90+ days', nf(LOANS.filter(l=>l.dpd>=90).length), 'non-performing'],
      ['Recovery rate', pct(BOOK.collected, BOOK.overdue), 'collected vs overdue']],
  5: [['Revenue', mkm(BOOK.interest+BOOK.fees), 'interest and fees'],
      ['Cost to income', pct(BOOK.interest*0.34, BOOK.interest+BOOK.fees), 'operating efficiency'],
      ['Cash position', mkm(52.4e6), 'across 6 accounts'],
      ['Provisions', mkm(BOOK.outstanding*0.021), 'loan loss allowance']],
  6: [['Customers', nf(CUSTOMERS.length), 'registered accounts'],
      ['Active borrowers', nf(BOOK.activeBorrowers), 'with open loans'],
      ['In arrears', nf(CUSTOMERS.filter(c=>c.dpd>0).length), 'past due'],
      ['Avg exposure', mkm(BOOK.outstanding/Math.max(1,BOOK.activeBorrowers)), 'per borrower']],
  7: [['Applications', nf(APPS.length), 'in the period'],
      ['Requested value', mkm(APPS.reduce((a,x)=>a+x.amount,0)), 'total asked'],
      ['Pending decision', nf(APPS.filter(a=>a.status==='Pending').length), 'in the queue'],
      ['Avg turnaround', BOOK.avgDays.toFixed(1)+' d', 'submission to decision']],
  8: [['Officers', nf(OFFICERS.length), 'active loan officers'],
      ['Loans handled', nf(LOANS.length), 'across all officer books'],
      ['Collections', mkm(BOOK.collected), 'posted receipts'],
      ['Top officer', STAFFAGG.slice().sort((a,b)=>b.collected-a.collected)[0].officer, 'by value collected']],
  9: [['PAR 30', BOOK.par30.toFixed(1)+'%', 'of outstanding'],
      ['PAR 90', BOOK.par90.toFixed(1)+'%', 'credit impaired'],
      ['Restructured', nf(LOANS.filter(l=>l.dpd>=30&&l.dpd<90).length), 'revised terms'],
      ['Expected credit loss', mkm(BOOK.outstanding*0.021), 'IFRS 9 provision']],
  10:[['Statements ready', nf(CUSTOMERS.filter(c=>c.books>0).length), 'customer accounts'],
      ['Audit events logged', nf(LOGAUDIT.length), 'last 24 hours'],
      ['Compliance returns', '6', '2 in progress'],
      ['Open findings', '1', 'KYC remediation']]
};

function stripHTML(n){
  const cells = (STRIPS[n]||[]);
  return `<div class="cell"><div class="k">Reports available</div>
      <div class="v">${(R_SETS[n-1]||[]).length}</div>
      <div class="s">${CATS[n-1].name}</div></div>` +
    cells.map(([k,v,s])=>`<div class="cell"><div class="k">${k}</div>
      <div class="v">${v}</div><div class="s">${s}</div></div>`).join('');
}
function tileHTML(r){
  const locked = !canRun(r);
  return `<div class="repcard${locked?' locked':''}${STATE.id===r.id?' active':''}" data-id="${r.id}"
      title="${locked?'Your role does not have access to this category':'Open in the report console'}">
    <div class="rh">
      <div class="ric">${r.id.split('-')[1]}</div>
      <div class="rn">${r.n}</div>
    </div>
    <div class="rd">${r.d}</div>
    <div class="rf"><span>${r.id}</span><span>${locked?'⛔ No access':'Run report →'}</span></div>
  </div>`;
}
function renderTiles(){
  CATS.forEach(c=>{
    const g = el('grid'+c.n), s = el('strip'+c.n), cnt = el('c'+c.n+'count');
    if(s) s.innerHTML = stripHTML(c.n);
    if(g) g.innerHTML = R_SETS[c.n-1].map(tileHTML).join('');
    if(cnt) cnt.textContent = R_SETS[c.n-1].length + ' reports';
  });
  const bc = el('bandReports'); if(bc) bc.textContent = REPORTS.length;
  document.querySelectorAll('.repcard').forEach(card=>{
    card.onclick = ()=>{
      const r = byId(card.dataset.id);
      if(!r) return;
      if(!canRun(r)) return toast(`“${r.n}” is restricted for ${VIEWROLE}. Switch role to run it.`,'err');
      selectReport(r.id, true);
    };
  });
}

/* ============================================================
   CHARTS
   ============================================================ */
const C_GOLD='#C9A227', C_GREEN='#1E9E6A', C_RED='#D93F3F', C_BLUE='#2F6FED', C_PURPLE='#7C5CF0';
function drawCharts(){
  const disb = MONTHS.map((m,i)=>+(11.2+i*0.9).toFixed(1));
  const coll = MONTHS.map((m,i)=>+(14.6+i*1.1).toFixed(1));
  const over = MONTHS.map((m,i)=>+(5.4-i*0.22).toFixed(1));
  const s1 = [{name:'Disbursed',color:C_GOLD,data:disb},{name:'Collected',color:C_GREEN,data:coll},
    {name:'Overdue',color:C_RED,data:over}];
  mkChart(el('chTrend'), {type:'line', labels:MONTHS, series:s1, yMax:20});
  legend(el('chTrendLegend'), s1);

  const weeks = ['W1','W2','W3','W4','W5','W6','W7','W8'];
  const s2 = [{name:'Due',color:'#C6CBD6',data:weeks.map((_,i)=>+(16+i*0.7).toFixed(1))},
    {name:'Collected',color:C_GOLD,data:weeks.map((_,i)=>+(13.4+i*0.95).toFixed(1))}];
  mkChart(el('chCollect'), {type:'bar', labels:weeks, series:s2, yMax:24});
  legend(el('chCollectLegend'), s2);

  const s3 = [{name:'NPL ratio',color:C_RED,data:MONTHS.map((_,i)=>+(2.2+i*0.14).toFixed(1))},
    {name:'Write-offs (MK M)',color:C_PURPLE,data:MONTHS.map((_,i)=>+(3.1+i*0.32).toFixed(1))}];
  mkChart(el('chRisk'), {type:'line', labels:MONTHS, series:s3, yMax:8});
  legend(el('chRiskLegend'), s3);

  mkHBars(el('parBars'), [
    {label:'PAR 30', value:BOOK.par30, display:BOOK.par30.toFixed(1)+'%', color:C_GOLD},
    {label:'PAR 60', value:BOOK.par60, display:BOOK.par60.toFixed(1)+'%', color:'#E08C1E'},
    {label:'PAR 90', value:BOOK.par90, display:BOOK.par90.toFixed(1)+'%', color:C_RED},
    {label:'Target', value:8, display:'8.0%', color:'#C6CBD6'}
  ], {max:Math.max(12, BOOK.par30)});

  const tiles = el('execTiles');
  if(tiles){
    const t = [
      ['Disbursed · October', mkm(BOOK.principal*0.32), '+12.4% vs Sep', C_GOLD],
      ['Collected · October', mkm(BOOK.collected), '+4.8% vs Sep', C_GREEN],
      ['Portfolio outstanding', mkm(BOOK.outstanding), BOOK.active+' active loans', C_BLUE],
      ['PAR 30+', BOOK.par30.toFixed(1)+'%', 'target ≤ 8.0%', C_RED]
    ];
    tiles.innerHTML = t.map(([k,v,s,c])=>`<div class="card panel" style="padding:12px">
      <div class="tiny muted" style="font-weight:800">${k.toUpperCase()}</div>
      <div style="font-size:19px;font-weight:800;letter-spacing:-.5px;margin-top:3px">${v}</div>
      <div class="tiny" style="color:${c};font-weight:700;margin-top:2px">${s}</div></div>`).join('');
  }
}

/* ============================================================
   GENERATION HISTORY + RBAC PANELS
   ============================================================ */
let HIST = [];
const HKEY = 'gls_report_hist_v1';
try { const raw = localStorage.getItem(HKEY); if(raw) HIST = JSON.parse(raw); } catch(e) {}
if(!HIST.length){
  const seed = [['EXE-02',3],['PORT-01',6],['REP-02',5],['ARR-03',2],['FIN-08',4],['AUD-11',7]];
  const names = ['Mary Emmanuel','Grace Phiri','Ruth Mbewe','Chikondi Banda','Tadala Nkhoma','Blessings Tembo'];
  HIST = seed.map(([id,rows],i)=>{
    const r = byId(id);
    return {t:`2026-10-30 ${String(9+i).padStart(2,'0')}:${String(11+i*7%50).padStart(2,'0')}`,
      id, name:r?r.n:id, user:names[i], rows, fmt:['PDF','Excel','CSV','Print'][i%4]};
  });
}
function saveHist(){ try { localStorage.setItem(HKEY, JSON.stringify(HIST.slice(0,80))); } catch(e) {} }
function logRun(rep, rows, fmt){
  const d = new Date();
  HIST.unshift({t:`2026-10-30 ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`,
    id:rep.id, name:rep.n, user:VIEWROLE==='Super Admin'?'Mary Emmanuel':VIEWROLE, rows, fmt});
  HIST = HIST.slice(0,80); saveHist(); renderHist();
  const bt = el('bandToday'); if(bt) bt.textContent = HIST.filter(h=>h.t.startsWith('2026-10-30')).length;
}
function renderHist(){
  const b = el('histBody'); if(!b) return;
  b.innerHTML = HIST.slice(0,12).map(h=>`<tr>
    <td class="muted" style="white-space:nowrap">${h.t.slice(11)}</td>
    <td><b>${h.name}</b><div class="tiny muted">${h.id}</div></td>
    <td>${h.user}</td><td class="num">${nf(h.rows)}</td>
    <td><span class="perm-tag">${h.fmt}</span></td></tr>`).join('');
  const bt = el('bandToday'); if(bt) bt.textContent = HIST.filter(h=>h.t.startsWith('2026-10-30')).length;
}
function renderAccess(){
  const b = el('accessBody'); if(!b) return;
  b.innerHTML = CATS.map(c=>{
    const roles = Object.keys(ACCESS).filter(r=>ACCESS[r].includes(c.n));
    const full = roles.filter(r=>ROLEOF[r]==='full').length;
    const tag = roles.length===6 ? '<span class="perm-tag full">All roles</span>'
      : full ? `<span class="perm-tag full">${roles.length} roles</span>`
      : `<span class="perm-tag read">${roles.length} roles</span>`;
    return `<tr><td><b>${c.n}. ${c.name}</b><div class="tiny muted">${(R_SETS[c.n-1]||[]).length} reports</div></td>
      <td>${tag}</td><td class="tiny">${roles.map(r=>r.split(' /')[0]).join(', ')}</td></tr>`;
  }).join('');
}
