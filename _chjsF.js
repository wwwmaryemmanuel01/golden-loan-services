<script>
/* ============================================================
   CHARTS & ANALYTICS (6/7)
   10 · Payment methods   11 · Comparisons   12 · Interactive charts
   ============================================================ */

const DIGITAL = ['Airtel Money','TNM Mpamba','Bank transfer'];

/* ===================== 10 · PAYMENT METHOD ANALYTICS ===================== */
function renderMethods(){
  const pays = filterPays(), disbs = filterDisb(), txns = filterTxn();
  const chan = [...METHODS, 'Internal'];
  const byMethod = chan.map(m=>{
    const p = pays.filter(x=>x.method === m);
    const d = disbs.filter(x=>x.method === m && x.status === 'Successful');
    return {m, inN:p.length, inV:sum(p, x=>x.amount), outN:d.length, outV:sum(d, x=>x.amount),
      txns: txns.filter(t=>t.method === m).length};
  });
  const digital = byMethod.filter(b=> DIGITAL.includes(b.m));
  const cash = byMethod.filter(b=> b.m === 'Cash');
  const inTotal = sum(byMethod, b=>b.inV);
  const unrec = txns.filter(t=> t.status !== 'Posted' || !LOAN_BY_REF[t.loan]);
  const failedTxns = txns.filter(t=> t.status === 'Failed' || t.status === 'Reversed');
  const posted = txns.filter(t=> t.status === 'Posted');

  el('pmKpis').innerHTML = [
    ['Repayments collected', money(inTotal), `${num(sum(byMethod, b=>b.inN))} receipts`, 'gold'],
    ['Disbursements released', money(sum(byMethod, b=>b.outV)), `${num(sum(byMethod, b=>b.outN))} payouts`, ''],
    ['Digital share', r1(pct(sum(digital, b=>b.inV), inTotal || 1)) + '%', 'Airtel Money, Mpamba and bank', ''],
    ['Cash share', r1(pct(sum(cash, b=>b.inV), inTotal || 1)) + '%', money(sum(cash, b=>b.inV)) + ' in cash', ''],
    ['Successful transactions', r1(pct(posted.length, txns.length || 1)) + '%', `${num(posted.length)} of ${num(txns.length)} posted`, ''],
    ['Failed transactions', num(failedTxns.length), money(sum(failedTxns, t=>t.amount)) + ' affected', failedTxns.length ? 'red' : ''],
    ['Unreconciled', num(unrec.length), 'Failed, reversed or unmatched', unrec.length ? 'red' : '']
  ].map(([l,v,s,kk])=>kpiCard(l,v,s,kk)).join('');

  el('pmGrid').innerHTML = [
    {title:'Repayments by payment method', sub:'Value received per channel', value:money(inTotal),
     chart: chart({type:'bar', cats:byMethod.map(b=>b.m), h:200,
       series:[{name:'Collected', data:byMethod.map(b=>b.inV), colour:'#1E9E6A'}]})},
    {title:'Disbursements by payment method', sub:'Value released per channel', value:money(sum(byMethod, b=>b.outV)),
     chart: chart({type:'bar', cats:byMethod.map(b=>b.m), h:200,
       series:[{name:'Released', data:byMethod.map(b=>b.outV), colour:'#C9A227'}]})},
    {title:'Cash vs digital payments', sub:'Share of cash received', value:r1(pct(sum(digital, b=>b.inV), inTotal || 1)) + '% digital',
     chart: chart({type:'donut', cats:['Digital','Cash'], h:200,
       series:[{data:[sum(digital, b=>b.inV), sum(cash, b=>b.inV)]}], colours:['#2F6FED','#C9A227']})},
    {title:'Payment volume by channel', sub:'Transaction count per channel', value:num(txns.length) + ' transactions',
     chart: chart({type:'bar', cats:byMethod.map(b=>b.m), h:200,
       series:[{name:'Transactions', data:byMethod.map(b=>b.txns), colour:'#7C5CF0'}]})},
    {title:'Successful transaction rate', sub:'Share of entries posted cleanly', value:r1(pct(posted.length, txns.length || 1)) + '%',
     chart: chart({type:'line', cats:seriesBy(txns, t=>t.date, ()=>1).cats, h:200,
       series:[{name:'Success %', data:seriesBy(txns, t=>t.date, ()=>1).keys.map(k=>{
         const inB = txns.filter(t=> bucketKey(t.date) === k);
         return inB.length ? r1(pct(inB.filter(t=>t.status==='Posted').length, inB.length)) : 0;
       }), colour:'#1E9E6A'}]})},
    {title:'Failed transaction rate', sub:'Share of entries that failed or were reversed', value:r1(pct(failedTxns.length, txns.length || 1)) + '%',
     chart: chart({type:'line', cats:seriesBy(txns, t=>t.date, ()=>1).cats, h:200,
       series:[{name:'Failed %', data:seriesBy(txns, t=>t.date, ()=>1).keys.map(k=>{
         const inB = txns.filter(t=> bucketKey(t.date) === k);
         return inB.length ? r1(pct(inB.filter(t=>t.status!=='Posted').length, inB.length)) : 0;
       }), colour:'#D93F3F'}]})},
    {title:'Payment value by channel', sub:'Money in against money out per channel', value:money(inTotal),
     chart: chart({type:'bar', cats:byMethod.map(b=>b.m), h:200, series:[
       {name:'In', data:byMethod.map(b=>b.inV), colour:'#1E9E6A'},
       {name:'Out', data:byMethod.map(b=>b.outV), colour:'#D93F3F'}]})},
    {title:'Transaction trends over time', sub:'Entries posted per period', value:num(txns.length) + ' entries',
     drill:'txns',
     chart: chart({type:'stacked', cats:seriesBy(txns, t=>t.date, ()=>1).cats, h:200, series:[
       {name:'In', data:seriesBy(txns.filter(t=>t.direction==='In'), t=>t.date, ()=>1).data, colour:'#1E9E6A'},
       {name:'Out', data:seriesBy(txns.filter(t=>t.direction==='Out'), t=>t.date, ()=>1).data, colour:'#C9A227'}]})}
  ].map(cc).join('');

  el('pmUnrecPill').textContent = unrec.length;
  renderTable('pmUnrecBody', [
    {k:'ref', label:'Transaction'},
    {k:'date', label:'Date', html:v=> fmtDate(v)},
    {k:'type', label:'Type'},
    {k:'loan', label:'Loan'},
    {k:'method', label:'Channel'},
    {k:'amount', label:'Amount', num:true, html:v=> money(v)},
    {k:'status', label:'Status', html:v=> `<span class="badge ${v==='Posted'?'b-ok':v==='Failed'?'b-crit':'b-warn'}">${esc(v)}</span>`}
  ], unrec.map(t=>({ref:t.ref, date:t.date, type:t.type, loan:t.loan, method:t.method, amount:t.amount,
      status: LOAN_BY_REF[t.loan] ? t.status : 'Unmatched', _drill:['txn', t.ref]})),
    {sort:'date', pageSize:7, onRow:true});
}

/* ===================== 11 · COMPARISON & TREND ANALYSIS ===================== */
function renderComparison(){
  const days = Math.max(1, daysBetween(FILTER.from, FILTER.to));
  const prevFrom = addDays(FILTER.from, -days - 1), prevTo = addDays(FILTER.from, -1);
  const cur = windowStats(FILTER.from, FILTER.to), prev = windowStats(prevFrom, prevTo);
  const chg = (a,b) => b ? (a-b)/b*100 : (a ? 100 : 0);
  const grow = (a,b) => {
    const v = Math.abs(chg(a,b)), up = a >= b;
    if(v >= 999.5) return `<span class="delta ${up?'up':'down'}">${up?'▲':'▼'} ${num(Math.round(v/100))}×</span>`;
    return delta(chg(a,b));
  };

  el('cmpRange').textContent = `${fmtDate(FILTER.from)} – ${fmtDate(FILTER.to)} vs ${fmtDate(prevFrom)} – ${fmtDate(prevTo)}`;

  el('cmpKpis').innerHTML = [
    ['Collections vs previous', money(cur.coll), grow(cur.coll, prev.coll) + ' the previous period', cur.coll >= prev.coll ? '' : 'red'],
    ['Disbursements vs previous', money(cur.disb), grow(cur.disb, prev.disb) + ' the previous period', cur.disb >= prev.disb ? '' : 'red'],
    ['Approval rate', r1(pct(cur.approved, cur.approved + cur.rejected || 1)) + '%',
      `Previous ${r1(pct(prev.approved, prev.approved + prev.rejected || 1))}%`, ''],
    ['New customers', num(cur.custs), grow(cur.custs, prev.custs) + ' the previous period', '']
  ].map(([l,v,s,k])=>kpiCard(l,v,s,k)).join('');

  const metrics = [
    ['Loans issued', cur.loans, prev.loans, 'n'],
    ['Amount disbursed', cur.disb, prev.disb, 'm'],
    ['Collected', cur.coll, prev.coll, 'm'],
    ['Interest earned', cur.interest, prev.interest, 'm'],
    ['Applications', cur.apps, prev.apps, 'n'],
    ['Approved', cur.approved, prev.approved, 'n'],
    ['New customers', cur.custs, prev.custs, 'n'],
    ['Collection ratio', cur.rate, prev.rate, 'p']
  ];
  el('cmpBody').innerHTML = metrics.map(([label,a,b,kind])=>{
    const show = x => kind === 'm' ? money(x) : kind === 'p' ? r1(x) + '%' : num(x);
    return `<tr><td>${label}</td><td class="num">${show(a)}</td><td class="num">${show(b)}</td>
      <td class="num">${delta(chg(a,b))}</td><td class="num">${show(a-b)}</td></tr>`;
  }).join('');

  /* month on month */
  const mMatch = MONTHS12.map(m=>({
    m,
    disb: sum(LOANS.filter(l=> l.date.slice(0,7) === m), l=>l.amount),
    coll: sum(PAYS.filter(p=> p.date.slice(0,7) === m), p=>p.amount),
    n: LOANS.filter(l=> l.date.slice(0,7) === m).length
  }));
  el('momHead').innerHTML = '<tr><th>Month</th><th class="num">Loans</th><th class="num">Disbursed</th>' +
    '<th class="num">MoM</th><th class="num">Collected</th><th class="num">MoM</th></tr>';
  el('momBody').innerHTML = mMatch.map((r,i)=>{
    const p = mMatch[i-1];
    return `<tr><td>${monthLabel(r.m)}</td><td class="num">${num(r.n)}</td><td class="num">${money(r.disb)}</td>
      <td class="num">${p ? delta(chg(r.disb, p.disb)) : '—'}</td><td class="num">${money(r.coll)}</td>
      <td class="num">${p ? delta(chg(r.coll, p.coll)) : '—'}</td></tr>`;
  }).join('');

  /* year on year — only months present in both years can be compared */
  const bothMonths = [...new Set(MONTHS.map(m=>m.slice(5,7)))].filter(mm=>
    MONTHS.includes('2025-' + mm) && MONTHS.includes('2026-' + mm));
  el('yoyBody').innerHTML = bothMonths.map(mm=>{
    const a = '2025-' + mm, b = '2026-' + mm;
    const row = (label, x, y, kind) => {
      const show = v => kind === 'm' ? money(v) : num(v);
      return `<tr><td>${label} · ${MONTH_NAMES[Number(mm)-1]}</td><td class="num">${show(x)}</td>
        <td class="num">${show(y)}</td><td class="num">${delta(chg(y, x))}</td></tr>`;
    };
    return row('Loans issued', LOANS.filter(l=> l.date.slice(0,7) === a).length,
               LOANS.filter(l=> l.date.slice(0,7) === b).length, 'n') +
           row('Disbursed', sum(LOANS.filter(l=> l.date.slice(0,7) === a), l=>l.amount),
               sum(LOANS.filter(l=> l.date.slice(0,7) === b), l=>l.amount), 'm') +
           row('Collected', sum(PAYS.filter(p=> p.date.slice(0,7) === a), p=>p.amount),
               sum(PAYS.filter(p=> p.date.slice(0,7) === b), p=>p.amount), 'm');
  }).join('') || '<tr><td colspan="4" class="empty">Not enough history for a year-on-year comparison.</td></tr>';

  /* staff comparison */
  const staffRows = STAFF.filter(s=> s.role !== 'Administrator').map(s=>({
    s, apps: filterApps().filter(a=>a.officer===s.id).length,
    released: sum(filterDisb().filter(d=>d.officer===s.id && d.status==='Successful'), d=>d.amount),
    collected: sum(filterPays().filter(p=>p.officer===s.id), p=>p.amount)
  })).filter(r=>r.apps || r.released || r.collected).sort((a,b)=> b.collected - a.collected);
  el('cmpStaffBody').innerHTML = staffRows.map(r=>`<tr>
      <td><b>${esc(r.s.name)}</b><div class="qhint" style="margin:0">${esc(r.s.role)}</div></td>
      <td class="num">${num(r.apps)}</td><td class="num">${money(r.released)}</td>
      <td class="num">${money(r.collected)}</td>
      <td class="num">${r.released ? r1(r.collected/r.released*100) + '%' : '—'}</td></tr>`).join('') ||
    '<tr><td colspan="5" class="empty">No staff activity in this selection.</td></tr>';

  /* charts */
  const keys = buckets();
  const disb = seriesBy(filterLoans(), l=>l.date, l=>l.amount);
  const coll = seriesBy(filterPays(), p=>p.date, p=>p.amount);
  const indexed = arr => {
    const base = arr.find(v=> v > 0) || 1;
    return arr.map(v=> r1(v/base*100));
  };
  const arrearKeys = keys.map(k=> riskAt(bucketEnd(k)).arrears);
  const arrearChange = arrearKeys.map((v,i)=> i ? v - arrearKeys[i-1] : 0);
  const newCust = seriesBy(filterCust(), c=>c.joined, ()=>1);
  const targetRows = MONTHS12.map(m=>({
    m, target: (TARGETS[m] || {disburse:0}).disburse,
    actual: sum(LOANS.filter(l=> l.date.slice(0,7) === m), l=>l.amount)
  }));

  el('cmpGrid').innerHTML = [
    {title:'Loan growth vs repayment growth', sub:'Both indexed to 100 at the first period', value:r1(pct(sum(coll.data), sum(disb.data) || 1)) + '% collected',
     chart: chart({type:'line', cats:disb.cats, h:200, series:[
       {name:'Loans indexed', data:indexed(disb.data), colour:'#C9A227'},
       {name:'Repayments indexed', data:indexed(coll.data), colour:'#1E9E6A'}]})},
    {title:'Arrears increase or reduction', sub:'Change in overdue balance per period', value:money(sum(arrearChange)),
     chart: chart({type:'bar', cats:keys.map(bucketLabel), h:200,
       series:[{name:'Change', data:arrearChange, colour:'#D93F3F'}]})},
    {title:'Customer growth comparisons', sub:'New customers per period', value:num(sum(newCust.data)) + ' joined',
     chart: chart({type:'bar', cats:newCust.cats, h:200,
       series:[{name:'New customers', data:newCust.data, colour:'#2F6FED'}]})},
    {title:'Target vs actual disbursement', sub:'Monthly target against what was released', value:r1(pct(sum(targetRows, r=>r.actual), sum(targetRows, r=>r.target) || 1)) + '% of target',
     chart: chart({type:'bar', cats:targetRows.map(r=>monthLabel(r.m)), h:200, series:[
       {name:'Target', data:targetRows.map(r=>r.target), colour:'#8A90A0'},
       {name:'Actual', data:targetRows.map(r=>r.actual), colour:'#C9A227'}]})},
    {title:'Staff performance comparisons', sub:'Collected against released per officer', value:num(staffRows.length) + ' officers',
     chart: chart({type:'bar', cats:staffRows.map(r=>r.s.name.split(' ')[0]), h:200, series:[
       {name:'Released', data:staffRows.map(r=>r.released), colour:'#8A90A0'},
       {name:'Collected', data:staffRows.map(r=>r.collected), colour:'#1E9E6A'}]})},
    {title:'Collections against target', sub:'Monthly collection target against actual', value:r1(pct(
        sum(MONTHS12.map(m=> sum(PAYS.filter(p=>p.date.slice(0,7)===m), p=>p.amount))),
        sum(MONTHS12.map(m=> (TARGETS[m]||{collect:0}).collect)) || 1)) + '% of target',
     chart: chart({type:'line', cats:MONTHS12.map(monthLabel), h:200, series:[
       {name:'Target', data:MONTHS12.map(m=> (TARGETS[m]||{collect:0}).collect), colour:'#8A90A0'},
       {name:'Collected', data:MONTHS12.map(m=> sum(PAYS.filter(p=>p.date.slice(0,7)===m), p=>p.amount)), colour:'#1E9E6A'}]})}
  ].map(cc).join('');
}

/* ===================== 12 · INTERACTIVE CHARTS ===================== */
const GAL = {metric:'disbursed', type:'bar', trend:false};

function galSeries(){
  const loans = filterLoans(), pays = filterPays(), apps = filterApps(), custs = filterCust();
  switch(GAL.metric){
    case 'collected':   return {...seriesBy(pays, p=>p.date, p=>p.amount), fmt:money, kind:'pays'};
    case 'loans':       return {...countBy(loans, l=>l.date), fmt:num, kind:'loans'};
    case 'outstanding': { const keys = buckets();
                          return {cats:keys.map(bucketLabel), keys, data:keys.map(k=> outstandingAt(bucketEnd(k))), fmt:money, kind:'loans'}; }
    case 'interest':    return {...seriesBy(pays, p=>p.date, p=>p.interest), fmt:money, kind:'pays'};
    case 'fees':        return {...seriesBy(pays, p=>p.date, p=>p.fees), fmt:money, kind:'pays'};
    case 'arrears':     { const keys = buckets();
                          return {cats:keys.map(bucketLabel), keys, data:keys.map(k=> riskAt(bucketEnd(k)).arrears), fmt:money, kind:'overdue'}; }
    case 'customers':   return {...countBy(custs, c=>c.joined), fmt:num, kind:'customers'};
    case 'applications':return {...countBy(apps, a=>a.submitted), fmt:num, kind:'apps'};
    default:            return {...seriesBy(loans, l=>l.date, l=>l.amount), fmt:money, kind:'loans'};
  }
}
const GAL_LABEL = {disbursed:'Disbursements', collected:'Collections', loans:'Loans issued', outstanding:'Outstanding',
  interest:'Interest collected', fees:'Fees & penalties', arrears:'Arrears', customers:'New customers', applications:'Applications'};

function renderGallery(){
  const s = galSeries();
  const total = sum(s.data);
  const peakIdx = s.data.indexOf(Math.max(...s.data));
  const latest = s.data.length ? s.data[s.data.length-1] : 0;
  const prev = s.data.length > 1 ? s.data[s.data.length-2] : 0;
  el('galTitle').textContent = `${GAL_LABEL[GAL.metric]} · ${GAL.type}`;
  el('galTrend').className = 'fchip' + (GAL.trend ? ' on' : '');
  el('galTrend').textContent = 'Trend line: ' + (GAL.trend ? 'on' : 'off');

  el('galKpis').innerHTML = [
    ['Total', s.fmt(total), `Across ${s.data.length} periods`, 'gold'],
    ['Average', s.fmt(s.data.length ? total/s.data.length : 0), 'Per period', ''],
    ['Peak', s.fmt(Math.max(...s.data, 0)), s.cats[peakIdx] || '—', ''],
    ['Latest', s.fmt(latest), prev ? delta(pct(latest - prev, prev)) : '—', '']
  ].map(([l,v,sub,k])=>kpiCard(l,v,sub,k)).join('');

  if(GAL.type === 'pie' || GAL.type === 'donut'){
    el('galChart').innerHTML = chart({type:GAL.type, cats:s.cats, h:250, series:[{data:s.data}], colours:PALETTE});
  } else {
    const series = [{name:GAL_LABEL[GAL.metric], data:s.data, colour:'#C9A227'}];
    if(GAL.trend){
      const n = s.data.length;
      if(n > 1){
        const xs = s.data.map((_,i)=>i);
        const mx = sum(xs, x=>x)/n, my = total/n;
        const num2 = sum(xs.map((x,i)=> (x-mx)*(s.data[i]-my)));
        const den = sum(xs.map(x=> (x-mx)*(x-mx))) || 1;
        const slope = num2/den, intercept = my - slope*mx;
        series.push({name:'Trend', data: xs.map(x=> Math.max(0, Math.round(intercept + slope*x))), colour:'#D93F3F'});
      }
    }
    el('galChart').innerHTML = chart({type:GAL.type, cats:s.cats, h:250, series});
  }
  el('galHint').innerHTML = `Hover any point or bar for its exact value. ` +
    `Period view: <b>${FILTER.grain}</b> · ${esc(filterLine())}.`;

  el('galTableHead').innerHTML = '<tr><th>Period</th><th class="num">Value</th><th class="num">Share</th><th class="num">Change</th></tr>';
  el('galTableBody').innerHTML = s.keys.map((k,i)=>`<tr>
      <td>${esc(bucketLabel(k))}</td><td class="num">${s.fmt(s.data[i])}</td>
      <td class="num">${r1(pct(s.data[i], total || 1))}%</td>
      <td class="num">${i ? delta(pct(s.data[i] - s.data[i-1], s.data[i-1] || 1)) : '—'}</td></tr>`).join('') ||
    '<tr><td colspan="4" class="empty">No data for this measure in the current filters.</td></tr>';

  /* drill list: the records behind the peak period */
  const peakKey = s.keys[peakIdx];
  const rows = galRecords(s.kind, peakKey, 10);
  el('galDrillHead').innerHTML = `<tr><th>Record</th><th>Detail</th><th class="num">Value</th></tr>`;
  el('galDrillBody').innerHTML = rows.map((r,i)=>`<tr class="rowlink" data-galrow="${i}">
      <td>${esc(r.a)}</td><td>${esc(r.b)}</td><td class="num">${r.c}</td></tr>`).join('') ||
    '<tr><td colspan="3" class="empty">No records in the peak period.</td></tr>';
  el('galDrillBody').querySelectorAll('[data-galrow]').forEach(tr=>{
    const r = rows[Number(tr.dataset.galrow)];
    tr.onclick = ()=> rowDrill(r.drill[0], r.drill[1]);
  });
}

function galRecords(kind, key, limit){
  if(kind === 'loans'){
    return filterLoans().filter(l=> bucketKey(l.date) === key).slice(0, limit)
      .map(l=>({a:l.ref, b:custName(l.cust) + ' · ' + prodName(l.product), c:money(l.amount), drill:['loan', l.ref]}));
  }
  if(kind === 'pays'){
    return filterPays().filter(p=> bucketKey(p.date) === key).slice(0, limit)
      .map(p=>({a:p.receipt, b:custName(p.cust) + ' · ' + p.method, c:money(p.amount), drill:['payment', p.receipt]}));
  }
  if(kind === 'overdue'){
    return filterLoans().filter(l=> l.arrears > 0).sort((a,b)=>b.arrears-a.arrears).slice(0, limit)
      .map(l=>({a:l.ref, b:custName(l.cust) + ' · ' + l.dpd + ' days', c:money(l.arrears), drill:['loan', l.ref]}));
  }
  if(kind === 'customers'){
    return filterCust().filter(c=> bucketKey(c.joined) === key).slice(0, limit)
      .map(c=>({a:c.name, b:c.region + ' · joined ' + fmtDate(c.joined), c:money(c.income), drill:['customer', c.id]}));
  }
  if(kind === 'apps'){
    return filterApps().filter(a=> bucketKey(a.submitted) === key).slice(0, limit)
      .map(a=>({a:a.ref, b:custName(a.cust) + ' · ' + a.status, c:money(a.amount), drill:['app', a.ref]}));
  }
  if(kind === 'disb'){
    return filterDisb().filter(d=> bucketKey(d.date) === key).slice(0, limit)
      .map(d=>({a:d.ref, b:d.loan + ' · ' + d.status, c:money(d.amount), drill:['disb', d.ref]}));
  }
  if(kind === 'staff'){
    return STAFF.filter(s=> s.role !== 'Administrator').slice(0, limit)
      .map(s=>({a:s.name, b:s.role + ' · ' + s.branch,
        c:money(sum(filterPays().filter(p=>p.officer===s.id), p=>p.amount)), drill:['staff', s.id]}));
  }
  return filterTxn().filter(t=> bucketKey(t.date) === key).slice(0, limit)
    .map(t=>({a:t.ref, b:t.type + ' · ' + t.method, c:money(t.amount), drill:['txn', t.ref]}));
}

function drillStaff(s){
  const loans = filterLoans().filter(l=>l.officer === s.id);
  const pays = filterPays().filter(p=>p.officer === s.id);
  const disbs = filterDisb().filter(d=>d.officer === s.id);
  openModal(s.name, s.role + ' · ' + s.branch,
    `<div class="pfields">
      ${field('Applications', num(filterApps().filter(a=>a.officer===s.id).length))}
      ${field('Loans approved', num(loans.length))}
      ${field('Value released', money(sum(disbs.filter(d=>d.status==='Successful'), d=>d.amount)))}
      ${field('Receipts recorded', num(pays.length))}
      ${field('Collected', money(sum(pays, p=>p.amount)))}
      ${field('On-time share', r1(pct(pays.filter(p=>p.timing==='On time').length, pays.length || 1)) + '%')}
      ${field('Open tasks', num(TASKS.filter(t=>t.staff===s.id && t.status==='Open').length))}
      ${field('Monthly target', money(s.target))}
    </div>
    <div class="minihead">Facilities handled</div>
    <div class="tblwrap" style="max-height:180px"><table class="tbl2 dense">
      <thead><tr><th>Loan</th><th>Customer</th><th class="num">Amount</th><th>Status</th></tr></thead>
      <tbody>${loans.slice(0,10).map(l=>`<tr><td>${esc(l.ref)}</td><td>${esc(custName(l.cust))}</td>
        <td class="num">${money(l.amount)}</td><td>${l.status}</td></tr>`).join('') ||
        '<tr><td colspan="4" class="empty">No facilities in this selection.</td></tr>'}</tbody></table></div>`,
    [{label:'Close', act:'close'}]);
}

function rowDrill(kind, id){
  if(kind === 'loan') return drillLoan(id);
  if(kind === 'customer') return drillCustomer(id);
  if(kind === 'payment'){
    const p = PAYS.find(x=> x.receipt === id);
    return p ? drillPayment(p) : toast('Receipt not found in this selection.', 'err');
  }
  if(kind === 'app'){
    const a = APPS.find(x=> x.ref === id);
    return a ? drillApp(a) : toast('Application not found.', 'err');
  }
  if(kind === 'disb'){
    const d = DISB.find(x=> x.ref === id);
    return d ? drillDisb(d) : toast('Payout not found.', 'err');
  }
  if(kind === 'txn'){
    const t = TXNS.find(x=> x.ref === id);
    return t ? drillTxn(t) : toast('Transaction not found.', 'err');
  }
  if(kind === 'staff'){
    const s = STAFF_BY_ID[id];
    return s ? drillStaff(s) : toast('Officer not found.', 'err');
  }
}
</script>
