<script>
/* ============================================================
   CHARTS & ANALYTICS (5/7)
   6 · Customer analytics   7 · Staff performance
   8 · Arrears & credit risk   9 · Loan applications
   ============================================================ */

/* ===================== 6 · CUSTOMER ANALYTICS ===================== */
function renderCustomers(){
  const custs = filterCust();                 // customers who joined inside the window
  const register = customersInScope();        // the whole register, filtered by region only
  const loans = filterLoans();
  const active = register.filter(c=>c.status === 'Active');
  const withLoans = register.filter(c=> loans.some(l=>l.cust === c.id && l.status === 'Active'));
  const joined = seriesBy(custs, c=>c.joined, ()=>1);
  const growthRate = joined.data.map((v,i)=> i ? r1(pct(v - joined.data[i-1], joined.data[i-1] || 1)) : 0);
  const repeat = register.filter(c=> loans.filter(l=>l.cust === c.id).length > 1)
    .map(c=>{
      const mine = loans.filter(l=>l.cust === c.id);
      const pays = PAYS.filter(p=>p.cust === c.id && inRange(p.date));
      return {id:c.id, name:c.name, region:c.region, loans:mine.length,
        outstanding:sum(mine, l=>l.outstanding), arrears:sum(mine, l=>l.arrears),
        onTime: pct(pays.filter(p=>p.timing==='On time').length, pays.length || 1),
        collected:sum(mine, l=>l.collected), _drill:['customer', c.id]};
    }).sort((a,b)=>b.loans - a.loans);
  const byProd = PRODUCTS.map(p=>({id:p.id, name:p.name,
    n: register.filter(c=> loans.some(l=>l.cust === c.id && l.product === p.id)).length}));
  const newThis = custs.filter(c=> c.joined >= bucketStartOfCurrent()).length;

  el('cuKpis').innerHTML = [
    ['Registered customers', num(register.length), `${num(active.length)} active · ${num(register.length - active.length)} inactive`, 'gold'],
    ['New in period', num(joined.data.reduce((a,b)=>a+b,0)), 'Joined within the date filter', ''],
    ['Customers with active loans', num(withLoans.length), r1(pct(withLoans.length, register.length || 1)) + '% of the register', ''],
    ['Repeat borrowers', num(repeat.length), r1(pct(repeat.length, register.length || 1)) + '% hold more than one facility', ''],
    ['KYC verified', num(register.filter(c=>c.kyc === 'Verified').length), `${num(register.filter(c=>c.kyc !== 'Verified').length)} pending`, ''],
    ['Customer growth rate', growthRate.length ? r1(growthRate[growthRate.length-1]) + '%' : '0%',
      joined.data.length && joined.data[joined.data.length-1] === 0
        ? 'No new customers in the latest period'
        : 'Latest period against the one before', '']
  ].map(([l,v,s,kk])=>kpiCard(l,v,s,kk)).join('');

  const regionRows = REGIONS.map(r=>{
    const mine = register.filter(c=>c.region === r);
    const mineLoans = loans.filter(l=>l.region === r);
    return {r, n:mine.length, withLoans: mine.filter(c=> loans.some(l=>l.cust === c.id)).length,
      disb: sum(mineLoans, l=>l.amount),
      arrears: sum(mineLoans.filter(l=>l.status==='Active'), l=>l.arrears)};
  });

  el('cuGrid').innerHTML = [
    {title:'Customer registration trends', sub:'New customers per period', value:num(joined.data.reduce((a,b)=>a+b,0)) + ' joined',
     drill:'customers',
     chart: chart({type:'bar', cats:joined.cats, h:200, series:[{name:'New customers', data:joined.data, colour:'#C9A227'}]})},
    {title:'Customer growth rate', sub:'Period on period percentage change', value:(growthRate.length ? r1(growthRate[growthRate.length-1]) : 0) + '%',
     chart: chart({type:'line', cats:joined.cats, h:200, series:[{name:'Growth %', data:growthRate, colour:'#1E9E6A'}]})},
    {title:'Active vs inactive customers', sub:'Register status split', value:num(active.length) + ' active',
     chart: chart({type:'donut', cats:['Active','Inactive'], h:200,
       series:[{data:[active.length, register.length - active.length]}], colours:['#1E9E6A','#8A90A0']})},
    {title:'Customers with active loans', sub:'Borrowing customers per product', value:num(withLoans.length) + ' borrowing',
     chart: chart({type:'bar', cats:PRODUCTS.map(p=>pShort(p.id)), h:200,
       series:[{name:'Customers', data:byProd.map(p=>p.n), colour:'#2F6FED'}]})},
    {title:'Customers by loan product', sub:'Product reach across the register', value:num(PRODUCTS.length) + ' products',
     chart: chart({type:'pie', cats:PRODUCTS.map(p=>pShort(p.id)), h:200,
       series:[{data:byProd.map(p=>p.n)}]})},
    {title:'Customers by region', sub:'Registered base per branch region', value:num(REGIONS.length) + ' regions',
     chart: chart({type:'bar', cats:REGIONS, h:200,
       series:[{name:'Customers', data:regionRows.map(r=>r.n), colour:'#7C5CF0'}]})},
    {title:'Repeat borrowers', sub:'Customers with more than one facility', value:num(repeat.length) + ' customers',
     chart: chart({type:'bar', cats:REGRANGE, h:200,
       series:[{name:'Customers', data:REGRANGE.map(n=> repeat.filter(c=>c.loans === n).length), colour:'#0E9AA7'}]})},
    {title:'Customer repayment performance', sub:'On-time receipts per region', value:num(PAYS.filter(p=> inRange(p.date)).length) + ' receipts',
     chart: chart({type:'bar', cats:REGIONS, h:200, series:[{name:'On time %', data:REGIONS.map(r=>{
        const p = PAYS.filter(x=> inRange(x.date) && (CUST_BY_ID[x.cust]||{}).region === r);
        return r1(pct(p.filter(x=>x.timing==='On time').length, p.length || 1));
      }), colour:'#1E9E6A'}]})}
  ].map(cc).join('');

  renderTable('cuRepeatBody', [
    {k:'name', label:'Customer'},
    {k:'region', label:'Region'},
    {k:'loans', label:'Facilities', num:true},
    {k:'outstanding', label:'Outstanding', num:true, html:v=> money(v)},
    {k:'arrears', label:'Arrears', num:true, html:v=> money(v)},
    {k:'onTime', label:'On time', num:true, html:v=> r1(v) + '%'}
  ], repeat, {sort:'loans', pageSize:7, onRow:true});

  el('cuRegionBody').innerHTML = regionRows.map(r=>`<tr>
      <td><b>${esc(r.r)}</b></td><td class="num">${num(r.n)}</td><td class="num">${num(r.withLoans)}</td>
      <td class="num">${money(r.disb)}</td><td class="num">${money(r.arrears)}</td></tr>`).join('') +
    `<tr style="font-weight:800;border-top:2px solid var(--line)"><td>Total</td>
      <td class="num">${num(sum(regionRows, r=>r.n))}</td><td class="num">${num(sum(regionRows, r=>r.withLoans))}</td>
      <td class="num">${money(sum(regionRows, r=>r.disb))}</td><td class="num">${money(sum(regionRows, r=>r.arrears))}</td></tr>`;
}
const REGRANGE = [2,3,4,5];

function bucketStartOfCurrent(){
  const keys = buckets();
  const last = keys[keys.length-1];
  if(!last) return FILTER.from;
  if(FILTER.grain === 'day') return last;
  if(FILTER.grain === 'week') return String(last).split('|')[0];
  if(FILTER.grain === 'year') return last + '-01-01';
  return last + '-01';
}

/* ===================== 7 · STAFF PERFORMANCE ANALYTICS ===================== */
function renderStaff(){
  const apps = filterApps(), loans = filterLoans(), disbs = filterDisb(), pays = filterPays();
  const pm = periodMonths();
  const rows = STAFF.filter(s=> s.role !== 'Administrator').map(s=>{
    const a = apps.filter(x=>x.officer === s.id);
    const l = loans.filter(x=>x.officer === s.id);
    const d = disbs.filter(x=>x.officer === s.id && x.status === 'Successful');
    const p = pays.filter(x=>x.officer === s.id);
    const collected = sum(p, x=>x.amount);
    return {id:s.id, name:s.name, role:s.role, branch:s.branch, apps:a.length, approved:l.length,
      disb:d.length, disbVal:sum(d, x=>x.amount), receipts:p.length, collected,
      onTime: pct(p.filter(x=>x.timing==='On time').length, p.length || 1),
      tasks: TASKS.filter(t=> t.staff === s.id && t.status === 'Open').length,
      achievement: s.target ? pct(collected, s.target*pm) : 0,
      _drill:['staff', s.id]};
  }).sort((a,b)=> b.collected - a.collected);
  const openTasks = TASKS.filter(t=>t.status === 'Open');

  el('sfKpis').innerHTML = [
    ['Applications processed', num(sum(rows, r=>r.apps)), 'Across the lending team', 'gold'],
    ['Loans approved', num(sum(rows, r=>r.approved)), money(sum(loans, l=>l.amount)) + ' principal', ''],
    ['Disbursements processed', num(sum(rows, r=>r.disb)), money(sum(rows, r=>r.disbVal)) + ' released', ''],
    ['Repayments recorded', num(sum(rows, r=>r.receipts)), money(sum(rows, r=>r.collected)) + ' received', ''],
    ['Open tasks', num(openTasks.length), `${num(TASKS.length - openTasks.length)} completed`, openTasks.length ? 'red' : ''],
    ['Collection success', r1(pct(sum(rows, r=> Math.round(r.onTime*r.receipts/100)), Math.max(1, sum(rows, r=>r.receipts)))) + '%',
      'Share of all receipts paid on time', '']
  ].map(([l,v,s,kk])=>kpiCard(l,v,s,kk)).join('');

  el('sfGrid').innerHTML = [
    {title:'Applications processed by staff', sub:'Volume handled in the period', value:num(sum(rows, r=>r.apps)),
     chart: chart({type:'bar', cats:rows.map(r=>r.name.split(' ')[0]), h:200,
       series:[{name:'Applications', data:rows.map(r=>r.apps), colour:'#C9A227'}]})},
    {title:'Loans approved by staff', sub:'Facilities approved per officer', value:num(sum(rows, r=>r.approved)),
     chart: chart({type:'bar', cats:rows.map(r=>r.name.split(' ')[0]), h:200,
       series:[{name:'Approved', data:rows.map(r=>r.approved), colour:'#1E9E6A'}]})},
    {title:'Disbursements processed by staff', sub:'Payouts released per officer', value:money(sum(rows, r=>r.disbVal)),
     chart: chart({type:'bar', cats:rows.map(r=>r.name.split(' ')[0]), h:200,
       series:[{name:'Released', data:rows.map(r=>r.disbVal), colour:'#2F6FED'}]})},
    {title:'Repayments recorded by staff', sub:'Receipts posted per officer', value:num(sum(rows, r=>r.receipts)),
     chart: chart({type:'bar', cats:rows.map(r=>r.name.split(' ')[0]), h:200,
       series:[{name:'Receipts', data:rows.map(r=>r.receipts), colour:'#7C5CF0'}]})},
    {title:'Collections by officer', sub:'Cash brought in per officer', value:money(sum(rows, r=>r.collected)),
     drill:'staff',
     chart: chart({type:'bar', cats:rows.map(r=>r.name.split(' ')[0]), h:200,
       series:[{name:'Collected', data:rows.map(r=>r.collected), colour:'#0E9AA7'}]})},
    {title:'Staff productivity comparisons', sub:'Receipts per application handled', value:num(rows.length) + ' officers',
     chart: chart({type:'bar', cats:rows.map(r=>r.name.split(' ')[0]), h:200,
       series:[{name:'Receipts per application', data:rows.map(r=> r.apps ? r1(r.receipts/r.apps) : 0), colour:'#C9A227'}]})},
    {title:'Collection success rates', sub:'Share of receipts paid on time', value:r1(sum(rows, r=>r.onTime)/Math.max(1, rows.length)) + '%',
     chart: chart({type:'bar', cats:rows.map(r=>r.name.split(' ')[0]), h:200,
       series:[{name:'On time %', data:rows.map(r=>r1(r.onTime)), colour:'#1E9E6A'}]})},
    {title:'Outstanding assigned tasks', sub:'Open work items per officer', value:num(openTasks.length) + ' open',
     chart: chart({type:'bar', cats:rows.map(r=>r.name.split(' ')[0]), h:200,
       series:[{name:'Open tasks', data:rows.map(r=>r.tasks), colour:'#E08C1E'}]})}
  ].map(cc).join('');

  renderTable('sfTableBody', [
    {k:'name', label:'Officer', html:v=> `<b>${esc(v)}</b>`},
    {k:'role', label:'Role'},
    {k:'apps', label:'Applications', num:true},
    {k:'approved', label:'Approved', num:true},
    {k:'disbVal', label:'Released', num:true, html:v=> money(v)},
    {k:'receipts', label:'Receipts', num:true},
    {k:'collected', label:'Collected', num:true, html:v=> money(v)},
    {k:'onTime', label:'On time', num:true, html:v=> r1(v) + '%'},
    {k:'tasks', label:'Open tasks', num:true},
    {k:'achievement', label:'Target', num:true, html:v=> `<span style="color:${v>=100?'#157A50':v>=70?'inherit':'#B32C2C'}">${r1(v)}%</span>`}
  ], rows, {sort:'collected', pageSize:9, onRow:true});

  el('sfTaskCount').textContent = openTasks.length;
  el('sfTasks').innerHTML = openTasks.map(t=>`
    <div class="risk"><div>
      <div class="rn">${esc(t.title)}</div>
      <div class="rs">${esc(staffName(t.staff))} · due ${fmtDate(t.due)} · ${esc(t.id)}</div></div>
      <div class="rv"><span class="badge ${t.priority==='High'?'b-crit':t.priority==='Medium'?'b-warn':'b-gray'}">${t.priority}</span></div></div>`).join('') ||
    '<div class="empty">No outstanding tasks.</div>';
}

/* ===================== 8 · ARREARS & CREDIT RISK ===================== */
function riskAt(end){
  let outstanding = 0, due = 0, paid = 0;
  LOANS.forEach(l=>{
    if(l.date > end) return;
    const mine = (PAYS_BY_LOAN[l.ref] || []).filter(p=> p.date <= end);
    const paidPrin = sum(mine, p=>p.principal);
    outstanding += Math.max(0, l.amount - paidPrin);
    for(let k=1;k<=l.term;k++){
      if(addMonths(l.date, k) <= end) due += l.instalment;
    }
    paid += sum(mine, p=>p.amount);
  });
  return {outstanding, arrears: Math.max(0, due - paid), due, paid};
}

function renderRisk(){
  const loans = filterLoans(), active = loans.filter(l=>l.status === 'Active');
  const pays = filterPays();
  const overdue = active.filter(l=>l.arrears > 0);
  const bucketsRisk = AGES.map(b=> [b, sum(active.filter(l=>l.ageBucket === b), l=>l.arrears)]);
  const totalOverdue = sum(overdue, l=>l.arrears);
  const b1 = sum(active.filter(l=>l.ageBucket === '1–30 days'), l=>l.arrears);
  const b2 = sum(active.filter(l=>l.ageBucket === '31–60 days'), l=>l.arrears);
  const b3 = sum(active.filter(l=>l.ageBucket === '61–90 days'), l=>l.arrears);
  const b4 = sum(active.filter(l=>l.ageBucket === '91–180 days' || l.ageBucket === '180+ days'), l=>l.arrears);
  const written = loans.filter(l=>l.status === 'Written off');
  const par = pct(totalOverdue, sum(active, l=>l.outstanding) || 1);
  const defaultRate = pct(sum(written, l=>l.amount), sum(loans, l=>l.amount) || 1);
  const overdueLoans = active.filter(l=>l.arrears > 0);
  const recoveries = pays.filter(p=> (LOAN_BY_REF[p.loan]||{}).arrears > 0);
  const recSeries = seriesBy(recoveries, p=>p.date, p=>p.amount);

  const keys = buckets();
  const parTrend = keys.map(k=>{
    const r = riskAt(bucketEnd(k));
    return r1(pct(r.arrears, r.outstanding || 1));
  });
  const overdueTrend = keys.map(k=> riskAt(bucketEnd(k)).arrears);

  el('arKpis').innerHTML = [
    ['Total overdue amount', money(totalOverdue), `${num(overdue.length)} accounts in arrears`, totalOverdue ? 'red' : ''],
    ['1–30 days', money(b1), `${num(active.filter(l=>l.ageBucket==='1–30 days').length)} accounts`, ''],
    ['31–60 days', money(b2), `${num(active.filter(l=>l.ageBucket==='31–60 days').length)} accounts`, b2 ? 'gold' : ''],
    ['61–90 days', money(b3), `${num(active.filter(l=>l.ageBucket==='61–90 days').length)} accounts`, b3 ? 'red' : ''],
    ['Over 90 days', money(b4), `${num(active.filter(l=>l.ageBucket==='91–180 days'||l.ageBucket==='180+ days').length)} accounts`, b4 ? 'red' : ''],
    ['Portfolio at risk', r1(par) + '%', 'Arrears over outstanding principal', par > 12 ? 'red' : ''],
    ['Default rate', r1(defaultRate) + '%', money(sum(written, l=>l.amount)) + ' written off', written.length ? 'red' : '']
  ].map(([l,v,s,kk])=>kpiCard(l,v,s,kk)).join('');

  el('arRiskPill').className = 'badge ' + (par > 15 ? 'b-crit' : par > 8 ? 'b-warn' : 'b-ok');
  el('arRiskPill').textContent = 'PAR ' + r1(par) + '%';
  el('arNote').innerHTML = `<div><b>How these are measured.</b> Arrears are unpaid instalments on open facilities; ` +
    `every account here is verified against its own schedule. Portfolio at risk is arrears over outstanding principal ` +
    `(${money(totalOverdue)} of ${money(sum(active, l=>l.outstanding))}). The default rate uses written-off principal ` +
    `(${money(sum(written, l=>l.amount))} of ${money(sum(loans, l=>l.amount))}) — the only reliable charge-off measure in the book.</div>`;

  const highRisk = [...overdue].sort((a,b)=> b.dpd - a.dpd || b.arrears - a.arrears).slice(0, 40);

  el('arGrid').innerHTML = [
    {title:'Arrears ageing distribution', sub:'Overdue value by days past due', value:money(totalOverdue),
     drill:'overdue',
     chart: chart({type:'bar', cats:bucketsRisk.map(b=>b[0]), h:200,
       series:[{name:'Arrears', data:bucketsRisk.map(b=>b[1]), colour:'#D93F3F'}]})},
    {title:'Loans by aging category', sub:'Account count per bucket', value:num(overdue.length) + ' accounts',
     chart: chart({type:'bar', cats:AGES, h:200,
       series:[{name:'Accounts', data:AGES.map(b=> active.filter(l=>l.ageBucket===b).length), colour:'#E08C1E'}]})},
    {title:'Arrears movement', sub:'Overdue balance at each period end', value:money(overdueTrend.length ? overdueTrend[overdueTrend.length-1] : 0),
     chart: chart({type:'line', cats:keys.map(bucketLabel), h:200,
       series:[{name:'Arrears', data:overdueTrend, colour:'#D93F3F'}]})},
    {title:'Portfolio at risk trend', sub:'Arrears as a share of outstanding', value:r1(par) + '%',
     chart: chart({type:'line', cats:keys.map(bucketLabel), h:200,
       series:[{name:'PAR %', data:parTrend, colour:'#7C5CF0'}]})},
    {title:'Arrears recovery trend', sub:'Cash received from accounts in arrears', value:money(sum(recSeries.data)),
     drill:'pays',
     chart: chart({type:'area', cats:recSeries.cats, h:200,
       series:[{name:'Recovered', data:recSeries.data, colour:'#1E9E6A'}]})},
    {title:'High-risk exposure', sub:'Largest overdue balances', value:money(totalOverdue),
     drill:'overdue',
     chart: chart({type:'bar', cats:highRisk.slice(0,8).map(l=>l.ref.replace('LN-','#')), h:200,
       series:[{name:'Arrears', data:highRisk.slice(0,8).map(l=>l.arrears), colour:'#B32C2C'}]})}
  ].map(cc).join('');

  el('arHighPill').textContent = highRisk.length;
  renderTable('arHighBody', [
    {k:'ref', label:'Loan'},
    {k:'cust', label:'Customer'},
    {k:'product', label:'Product'},
    {k:'dpd', label:'Days past due', num:true},
    {k:'age', label:'Bucket'},
    {k:'outstanding', label:'Outstanding', num:true, html:v=> money(v)},
    {k:'arrears', label:'Arrears', num:true, html:v=> money(v)},
    {k:'score', label:'Risk', html:v=> `<span class="badge ${v==='High'?'b-crit':v==='Elevated'?'b-warn':'b-gray'}">${v}</span>`}
  ], highRisk.map(l=>({ref:l.ref, cust:custName(l.cust), product:prodName(l.product), dpd:l.dpd,
      age:l.ageBucket, outstanding:l.outstanding, arrears:l.arrears,
      score: l.dpd > 90 ? 'High' : l.dpd > 45 ? 'Elevated' : 'Watch',
      _drill:['loan', l.ref]})), {sort:'dpd', pageSize:9, onRow:true});
}

/* ===================== 9 · LOAN APPLICATION ANALYTICS ===================== */
function renderApplications(){
  const apps = filterApps();
  const pending = apps.filter(a=>a.status === 'Pending');
  const approved = apps.filter(a=>a.status === 'Approved');
  const rejected = apps.filter(a=>a.status === 'Rejected');
  const decided = apps.filter(a=>a.status === 'Approved' || a.status === 'Rejected');
  const decidedTime = apps.filter(a=>a.decided);
  const avgDays = decidedTime.length ? sum(decidedTime, a=> daysBetween(a.submitted, a.decided))/decidedTime.length : 0;
  const recv = seriesBy(apps, a=>a.submitted, ()=>1);
  const apprSeries = seriesBy(approved, a=>a.submitted, ()=>1);
  const rejSeries = seriesBy(rejected, a=>a.submitted, ()=>1);
  const rateSeries = recv.keys.map((k,i)=>{
    const n = recv.data[i], a = apprSeries.data[i], r = rejSeries.data[i];
    return n ? r1(pct(a, a + r || 1)) : 0;
  });

  el('apKpis').innerHTML = [
    ['Applications received', num(apps.length), 'Within the selected period', 'gold'],
    ['Awaiting review', num(pending.length), money(sum(pending, a=>a.amount)) + ' requested', pending.length ? 'blue' : ''],
    ['Approval rate', r1(pct(approved.length, decided.length || 1)) + '%', `${num(approved.length)} of ${num(decided.length)} decided`, ''],
    ['Rejection rate', r1(pct(rejected.length, decided.length || 1)) + '%', `${num(rejected.length)} rejected`, ''],
    ['Average processing time', r1(avgDays) + ' days', 'Submission to decision', ''],
    ['Withdrawn', num(apps.filter(a=>a.status === 'Withdrawn').length), 'Pulled by the customer', '']
  ].map(([l,v,s,kk])=>kpiCard(l,v,s,kk)).join('');

  const ageBuckets = [['0–3 days',0,3],['4–7 days',4,7],['8–14 days',8,14],['15–30 days',15,30],['Over 30 days',31,9999]];
  const pendingAge = ageBuckets.map(([label, lo, hi])=>
    pending.filter(a=>{ const d = daysBetween(a.submitted, TODAY); return d >= lo && d <= hi; }).length);

  el('apGrid').innerHTML = [
    {title:'Applications received over time', sub:'Volume per period', value:num(apps.length) + ' applications',
     drill:'apps',
     chart: chart({type:'bar', cats:recv.cats, h:200, series:[{name:'Received', data:recv.data, colour:'#C9A227'}]})},
    {title:'Applications by status', sub:'Where the pipeline sits', value:num(pending.length) + ' pending',
     chart: chart({type:'donut', cats:['Approved','Rejected','Pending','Withdrawn'], h:200,
       series:[{data:[approved.length, rejected.length, pending.length, apps.filter(a=>a.status==='Withdrawn').length]}],
       colours:['#1E9E6A','#D93F3F','#E08C1E','#8A90A0']})},
    {title:'Applications by loan product', sub:'Demand per product', value:num(PRODUCTS.length) + ' products',
     chart: chart({type:'bar', cats:PRODUCTS.map(p=>pShort(p.id)), h:200,
       series:[{name:'Applications', data:PRODUCTS.map(p=> apps.filter(a=>a.product===p.id).length), colour:'#2F6FED'}]})},
    {title:'Approval rate trends', sub:'Approved as a share of decisions', value:r1(pct(approved.length, decided.length || 1)) + '%',
     chart: chart({type:'line', cats:recv.cats, h:200, series:[{name:'Approval %', data:rateSeries, colour:'#1E9E6A'}]})},
    {title:'Rejection rate trends', sub:'Rejected as a share of decisions', value:r1(pct(rejected.length, decided.length || 1)) + '%',
     chart: chart({type:'line', cats:recv.cats, h:200, series:[{name:'Rejection %',
       data:recv.keys.map((k,i)=> recv.data[i] ? r1(pct(rejSeries.data[i], apprSeries.data[i] + rejSeries.data[i] || 1)) : 0),
       colour:'#D93F3F'}]})},
    {title:'Awaiting review by age', sub:'How long pending applications have waited', value:num(pending.length) + ' pending',
     chart: chart({type:'bar', cats:ageBuckets.map(b=>b[0]), h:200,
       series:[{name:'Applications', data:pendingAge, colour:'#E08C1E'}]})},
    {title:'Pending applications by staff member', sub:'Who is holding the queue', value:num(pending.length) + ' to decide',
     chart: chart({type:'bar', cats:STAFF.filter(s=>s.role!=='Administrator').map(s=>s.name.split(' ')[0]), h:200,
       series:[{name:'Pending', data:STAFF.filter(s=>s.role!=='Administrator').map(s=> pending.filter(a=>a.officer===s.id).length), colour:'#7C5CF0'}]})},
    {title:'Decision turnaround', sub:'Average days from submission to decision', value:r1(avgDays) + ' days',
     chart: chart({type:'bar', cats:recv.keys.map(bucketLabel), h:200,
       series:[{name:'Days', data:recv.keys.map(k=>{
         const inB = decidedTime.filter(a=> bucketKey(a.submitted) === k);
         return inB.length ? r1(sum(inB, a=> daysBetween(a.submitted, a.decided))/inB.length) : 0;
       }), colour:'#0E9AA7'}]})}
  ].map(cc).join('');

  el('apPendingPill').textContent = pending.length;
  const queue = [...pending].sort((a,b)=> a.submitted < b.submitted ? -1 : 1);
  renderTable('apPendingBody', [
    {k:'ref', label:'Application'},
    {k:'cust', label:'Customer'},
    {k:'product', label:'Product'},
    {k:'amount', label:'Requested', num:true, html:v=> money(v)},
    {k:'submitted', label:'Submitted', html:v=> fmtDate(v)},
    {k:'waiting', label:'Waiting', num:true, html:v=> `${v} days`},
    {k:'officer', label:'Officer'}
  ], queue.map(a=>({ref:a.ref, cust:custName(a.cust), product:prodName(a.product), amount:a.amount,
      submitted:a.submitted, waiting:daysBetween(a.submitted, TODAY), officer:staffName(a.officer),
      _drill:['app', a.ref]})), {sort:'waiting', pageSize:8, onRow:true});
}
</script>
