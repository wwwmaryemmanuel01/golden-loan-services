<script>
/* ============================================================
   GRAPHING & TABULATION (2/5)
   Sections 3 (portfolio), 4 (repayment & collections),
   5 (customer analytics).
   ============================================================ */

const AGES = ['Current','1–30 days','31–60 days','61–90 days','91–180 days','180+ days'];

/* ===================== 3 · LOAN PORTFOLIO ===================== */
function renderPortfolio(){
  const k = kpis();
  const loans = k.loans, apps = k.apps;

  el('pfKpis').innerHTML = [
    ['Loans in view', num(loans.length), `${num(k.active.length)} active · ${num(k.closed)} closed`, ''],
    ['Principal issued', money(sum(loans,l=>l.amount)), 'Disbursed in period', 'gold'],
    ['Principal outstanding', money(k.outstanding), `PAR ${k.outstanding ? r1(k.arrears/k.outstanding*100) : 0}% at risk`, ''],
    ['Average loan size', money(loans.length ? sum(loans,l=>l.amount)/loans.length : 0), 'Per facility', ''],
    ['Approval rate', r1(pct(k.approved, k.approved+k.rejected)) + '%', `${num(k.approved)} approved · ${num(k.rejected)} rejected`, ''],
    ['Written off', num(k.written), money(sum(loans.filter(l=>l.status==='Written off'), l=>l.amount)), k.written ? 'red' : '']
  ].map(([l,v,s,kk])=>kpiCard(l,v,s,kk)).join('');

  /* status + approval trend */
  const statusItems = [['Active',k.active.length,'#C9A227'],['Closed',k.closed,'#1E9E6A'],['Written off',k.written,'#D93F3F']];
  const monthsInView = buckets();
  const appByMonth = { appr:[], rej:[], cats: [] };
  monthsInView.forEach(key=>{
    const rows = apps.filter(a=> bucketKey(a.submitted) === key);
    appByMonth.cats.push(bucketLabel(key));
    appByMonth.appr.push(rows.filter(a=>a.status==='Approved').length);
    appByMonth.rej.push(rows.filter(a=>a.status==='Rejected').length);
  });

  const byProduct = PRODUCTS.map(p=>{
    const mine = loans.filter(l=>l.product===p.id);
    return {p, n:mine.length, amt:sum(mine,l=>l.amount), out:sum(mine.filter(l=>l.status!=='Closed'),l=>l.outstanding),
      arr:sum(mine.filter(l=>l.status==='Active'),l=>l.arrears)};
  });
  const amountBands = [['Under 250k',0,250000],['250k – 500k',250000,500000],['500k – 1M',500000,1000000],
    ['1M – 2M',1000000,2000000],['Over 2M',2000000,Infinity]];
  const bandCounts = amountBands.map(([label,lo,hi])=> loans.filter(l=>l.amount>=lo && l.amount<hi).length);
  const termCounts = [3,6,9,12,18,24,36].map(t=>[t+' mo', loans.filter(l=>l.term===t).length]).filter(x=>x[1]);

  const grid = [
    chartCard({title:'Active vs closed loans', sub:'Facilities by current status', value:num(loans.length)+' loans',
      chart: chart({type:'donut', cats:statusItems.map(s=>s[0]), series:[{data:statusItems.map(s=>s[1])}],
        colours:statusItems.map(s=>s[2]), h:200})}),
    chartCard({title:'Approved vs rejected applications', sub:'Decisions by application month', value:r1(pct(k.approved,k.approved+k.rejected))+'% approved',
      chart: chart({type:'stacked', cats:appByMonth.cats, series:[
        {name:'Approved', data:appByMonth.appr, colour:'#1E9E6A'},
        {name:'Rejected', data:appByMonth.rej, colour:'#D93F3F'}], h:200})}),
    chartCard({title:'Loans by product', sub:'Number and value of facilities', value:num(loans.length),
      chart: chart({type:'bar', cats:byProduct.map(b=>b.p.name), series:[
        {name:'Loans', data:byProduct.map(b=>b.n), colour:'#C9A227'}], h:200}),
      note: byProduct.map(b=>b.p.name + ' ' + money(b.amt)).join(' · ')}),
    chartCard({title:'Loans by amount range', sub:'Ticket size distribution', value:money(loans.length ? sum(loans,l=>l.amount)/loans.length : 0),
      chart: chart({type:'bar', cats:amountBands.map(b=>b[0]), series:[{name:'Loans', data:bandCounts, colour:'#2F6FED'}], h:200})}),
    chartCard({title:'Loans by repayment period', sub:'Term chosen at approval', value:num(loans.length),
      chart: chart({type:'bar', cats:termCounts.map(t=>t[0]), series:[{name:'Loans', data:termCounts.map(t=>t[1]), colour:'#7C5CF0'}], h:200})}),
    chartCard({title:'Loan portfolio growth', sub:'Cumulative disbursed value', value:money(k.disbursed),
      chart: chart({type:'area', cats:seriesBy(loans, l=>l.date, l=>l.amount).cats,
        series:[{name:'Cumulative', data:cumulative(seriesBy(loans, l=>l.date, l=>l.amount).data), colour:'#1E9E6A'}], h:200})}),
    chartCard({title:'Principal outstanding', sub:'Outstanding principal by disbursement period', value:money(k.outstanding),
      chart: chart({type:'line', cats:seriesBy(loans, l=>l.date, l=>l.amount).cats,
        series:[{name:'Outstanding', data:seriesBy(loans.filter(l=>l.status!=='Closed'), l=>l.date, l=>l.outstanding).data, colour:'#E08C1E'}], h:200})}),
    chartCard({title:'Loan status distribution', sub:'Share of facilities', value:num(loans.length),
      chart: chart({type:'pie', cats:statusItems.map(s=>s[0]), series:[{data:statusItems.map(s=>s[1])}],
        colours:statusItems.map(s=>s[2]), h:200})})
  ];
  el('pfGrid').innerHTML = grid.join('');

  el('pfTableHead').innerHTML = '<tr><th>Product</th><th class="num">Loans</th><th class="num">Disbursed</th>' +
    '<th class="num">Outstanding</th><th class="num">Arrears</th><th class="num">Arrears rate</th><th class="num">Avg size</th></tr>';
  el('pfTableBody').innerHTML = byProduct.map(b=>`
    <tr><td><span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${b.p.colour};margin-right:6px"></span>${b.p.name}</td>
      <td class="num">${num(b.n)}</td><td class="num">${money(b.amt)}</td><td class="num">${money(b.out)}</td>
      <td class="num">${money(b.arr)}</td><td class="num">${r1(pct(b.arr, b.out+b.arr))}%</td>
      <td class="num">${money(b.n ? b.amt/b.n : 0)}</td></tr>`).join('') +
    `<tr style="font-weight:800;background:#FAFBFC"><td>Total</td><td class="num">${num(loans.length)}</td>
      <td class="num">${money(sum(byProduct,b=>b.amt))}</td><td class="num">${money(sum(byProduct,b=>b.out))}</td>
      <td class="num">${money(sum(byProduct,b=>b.arr))}</td><td class="num">—</td>
      <td class="num">${money(loans.length ? sum(loans,l=>l.amount)/loans.length : 0)}</td></tr>`;
}

function cumulative(arr){
  let acc = 0;
  return arr.map(v=> acc += v);
}

/* ===================== 4 · REPAYMENT & COLLECTIONS ===================== */
function renderRepayment(){
  const k = kpis();
  const pays = k.pays;
  const expected = expectedByBucket(k.active.concat(k.loans.filter(l=>l.status==='Closed')));
  const actual = seriesBy(pays, p=>p.date, p=>p.amount);
  const monthly = seriesBy(pays, p=>p.date, p=>p.amount);
  const onTime = seriesBy(pays.filter(p=>p.timing==='On time'), p=>p.date, p=>p.amount);
  const late = seriesBy(pays.filter(p=>p.timing==='Late'), p=>p.date, p=>p.amount);
  const partials = pays.filter(p=>p.status==='Partial');
  const fulls = pays.filter(p=>p.status==='Full');
  const overdueLoans = k.active.filter(l=>l.arrears>0).sort((a,b)=>b.arrears-a.arrears);
  const aging = AGES.map(a=>[a, sum(k.active.filter(l=>l.ageBucket===a), l=>l.arrears)]);
  const recovery = buckets().map((key,i)=>{
    const exp = expected[i] || 0;
    return exp ? Math.round(Math.min(140, actual.data[i]/exp*100)) : 0;
  });
  const byProductPerf = PRODUCTS.map(p=>{
    const mine = pays.filter(x=> (LOAN_BY_REF[x.loan]||{}).product === p.id);
    const on = mine.filter(x=>x.timing==='On time').length;
    return {p, rate: mine.length ? Math.round(on/mine.length*100) : 0, n:mine.length};
  });

  el('rpKpis').innerHTML = [
    ['Collected', money(sum(pays,p=>p.amount)), `${num(pays.length)} receipts`, 'gold'],
    ['On time', r1(pct(pays.filter(p=>p.timing==='On time').length, pays.length))+'%',
      `${num(pays.filter(p=>p.timing==='On time').length)} of ${num(pays.length)} receipts on time`, ''],
    ['Partial payments', num(partials.length), money(sum(partials,p=>p.amount)), partials.length ? 'red' : ''],
    ['Overdue accounts', num(overdueLoans.length), money(k.arrears) + ' in arrears', overdueLoans.length ? 'red' : ''],
    ['Recovery rate', r1(sum(actual.data)/Math.max(1,sum(expected))*100)+'%', 'Collected against expected', ''],
    ['Average days late', r1(pays.filter(p=>p.timing==='Late').reduce((s,p)=>s+p.daysLate,0)/Math.max(1,pays.filter(p=>p.timing==='Late').length)), 'Across late receipts', '']
  ].map(([l,v,s,kk])=>kpiCard(l,v,s,kk)).join('');

  el('rpGrid').innerHTML = [
    chartCard({title:'Expected vs actual repayments', sub:'Instalments due against cash received', value:money(sum(actual.data)),
      chart: chart({type:'bar', cats:actual.cats, series:[
        {name:'Expected', data:expected, colour:'#8A90A0'},
        {name:'Actual', data:actual.data, colour:'#C9A227'}], h:200})}),
    chartCard({title:'Monthly collection trends', sub:'Cash collected per period', value:money(sum(monthly.data)),
      chart: chart({type:'line', cats:monthly.cats, series:[{name:'Collected', data:monthly.data, colour:'#1E9E6A'}], h:200})}),
    chartCard({title:'On-time vs late payments', sub:'Value received by timing', value:r1(pct(sum(onTime.data), sum(monthly.data)))+'% on time',
      chart: chart({type:'stacked', cats:monthly.cats, series:[
        {name:'On time', data:onTime.data, colour:'#1E9E6A'},
        {name:'Late', data:late.data, colour:'#D93F3F'}], h:200})}),
    chartCard({title:'Partial vs full payments', sub:'Receipts by completion', value:num(pays.length)+' receipts',
      chart: chart({type:'donut', cats:['Full payments','Partial payments'],
        series:[{data:[fulls.length, partials.length]}], colours:['#1E9E6A','#E08C1E'], h:200})}),
    chartCard({title:'Arrears aging distribution', sub:'Outstanding arrears by days past due', value:money(k.arrears),
      chart: chart({type:'bar', cats:aging.map(a=>a[0]), series:[{name:'Arrears', data:aging.map(a=>a[1]), colour:'#D93F3F'}], h:200})}),
    chartCard({title:'Collection recovery rates', sub:'Collected as a share of expected', value:r1(sum(actual.data)/Math.max(1,sum(expected))*100)+'%',
      chart: chart({type:'line', cats:monthly.cats, series:[{name:'Recovery %', data:recovery, colour:'#2F6FED'}], h:200}),
      note:'Values above 100% mean arrears from an earlier period were cleared in the month.'}),
    chartCard({title:'Repayment performance by product', sub:'Share of payments made on time', value:r1(sum(byProductPerf,p=>p.rate)/byProductPerf.length)+'%',
      chart: chart({type:'bar', cats:byProductPerf.map(b=>b.p.name), series:[{name:'On-time %', data:byProductPerf.map(b=>b.rate), colour:'#7C5CF0'}], h:200})}),
    chartCard({title:'Overdue loan accounts', sub:'Accounts with arrears, by days past due', value:num(overdueLoans.length),
      chart: chart({type:'bar', cats:overdueLoans.slice(0,8).map(l=>l.ref),
        series:[{name:'Arrears', data:overdueLoans.slice(0,8).map(l=>l.arrears), colour:'#E08C1E'}], h:200})})
  ].join('');

  el('rpOverdueHead').innerHTML = '<tr><th>Loan</th><th>Customer</th><th>Product</th><th class="num">Outstanding</th>' +
    '<th class="num">Arrears</th><th class="num">Days past due</th><th>Aging</th></tr>';
  el('rpOverdueBody').innerHTML = overdueLoans.slice(0,12).map(l=>`
    <tr class="rowlink" data-loan="${l.ref}">
      <td class="mono" style="font-size:9.5px">${l.ref}</td>
      <td>${esc((CUST_BY_ID[l.cust]||{}).name || '—')}</td>
      <td>${esc((PROD_BY_ID[l.product]||{}).name || '—')}</td>
      <td class="num">${money(l.outstanding)}</td>
      <td class="num" style="color:#B32C2C">${money(l.arrears)}</td>
      <td class="num">${num(l.dpd)}</td>
      <td><span class="badge ${l.dpd>60?'b-rej':l.dpd>30?'b-await':'b-ok'}">${l.ageBucket}</span></td>
    </tr>`).join('') || '<tr><td colspan="7" class="empty">No overdue accounts — every active loan is current.</td></tr>';
  el('rpOverdueBody').querySelectorAll('[data-loan]').forEach(r=>{
    r.onclick = ()=> drillLoan(r.dataset.loan);
  });
}

/* ===================== 5 · CUSTOMER ANALYTICS ===================== */
function renderCustomers(){
  const custs = filterCust();
  const k = kpis();
  const activeIds = new Set(LOANS.filter(l=>l.status==='Active' && inRange(l.date)).map(l=>l.cust));
  const repeat = custs.filter(c=> LOANS.filter(l=>l.cust===c.id).length > 1);
  const newS = countBy(custs, c=>c.joined);
  const activeCount = custs.filter(c=>c.status==='Active').length;
  const withLoans = custs.filter(c=> LOANS.some(l=>l.cust===c.id && l.status!=='Closed')).length;
  const byRegion = REGIONS.map(rg=>({rg, n:custs.filter(c=>c.region===rg).length}));
  const byProduct = PRODUCTS.map(p=>({p, n:custs.filter(c=> LOANS.some(l=>l.cust===c.id && l.product===p.id)).length}));
  const perfByRegion = REGIONS.map(rg=>{
    const mine = PAYS.filter(p=> (CUST_BY_ID[p.cust]||{}).region === rg && inRange(p.date));
    const on = mine.filter(p=>p.timing==='On time').length;
    return {rg, rate: mine.length ? Math.round(on/mine.length*100) : 0, n: mine.length};
  });

  el('cuKpis').innerHTML = [
    ['Registered customers', num(custs.length), `${num(CUSTOMERS.length)} on the full register`, 'gold'],
    ['New in period', num(custs.filter(c=> inRange(c.joined)).length), 'Joined within the date filter', ''],
    ['Active', num(activeCount), `${num(custs.length-activeCount)} inactive`, ''],
    ['With active loans', num(withLoans), 'At least one open facility', ''],
    ['Repeat borrowers', num(repeat.length), r1(pct(repeat.length, custs.length)) + '% of the book', ''],
    ['KYC verified', num(custs.filter(c=>c.kyc==='Verified').length), `${num(custs.filter(c=>c.kyc!=='Verified').length)} pending`, '']
  ].map(([l,v,s,kk])=>kpiCard(l,v,s,kk)).join('');

  el('cuGrid').innerHTML = [
    chartCard({title:'New customers over time', sub:'Registrations by period', value:num(newS.data.reduce((a,b)=>a+b,0)),
      chart: chart({type:'line', cats:newS.cats, series:[{name:'New customers', data:newS.data, colour:'#C9A227'}], h:200})}),
    chartCard({title:'Active vs inactive customers', sub:'Account status across the book', value:num(custs.length),
      chart: chart({type:'donut', cats:['Active','Inactive'], series:[{data:[activeCount, custs.length-activeCount]}],
        colours:['#1E9E6A','#8A90A0'], h:200})}),
    chartCard({title:'Customers by region', sub:'Branch catchment', value:num(custs.length),
      chart: chart({type:'bar', cats:byRegion.map(r=>r.rg), series:[{name:'Customers', data:byRegion.map(r=>r.n), colour:'#2F6FED'}], h:200})}),
    chartCard({title:'Customers by loan product', sub:'Customers holding each product', value:num(withLoans),
      chart: chart({type:'bar', cats:byProduct.map(b=>b.p.name), series:[{name:'Customers', data:byProduct.map(b=>b.n), colour:'#7C5CF0'}], h:200})}),
    chartCard({title:'Customer repayment performance', sub:'On-time rate by region', value:r1(sum(perfByRegion,r=>r.rate)/perfByRegion.length)+'%',
      chart: chart({type:'bar', cats:perfByRegion.map(r=>r.rg), series:[{name:'On-time %', data:perfByRegion.map(r=>r.rate), colour:'#1E9E6A'}], h:200})}),
    chartCard({title:'Portfolio concentration', sub:'Value held by the largest customers', value:money(k.outstanding),
      chart: chart({type:'bar', cats:topCustomers().map(c=>c.name.split(' ')[0]),
        series:[{name:'Outstanding', data:topCustomers().map(c=>c.out), colour:'#E08C1E'}], h:200})})
  ].join('');

  el('cuRepeatHead').innerHTML = '<tr><th>Customer</th><th>Region</th><th class="num">Loans</th><th class="num">Borrowed</th><th class="num">Repaid</th><th class="num">Outstanding</th><th>Status</th></tr>';
  el('cuRepeatBody').innerHTML = repeat.slice(0,10).map(c=>{
    const mine = LOANS.filter(l=>l.cust===c.id);
    return `<tr class="rowlink" data-cust="${c.id}">
      <td>${esc(c.name)}<div style="font-size:9px;color:var(--muted)">${c.id}</div></td>
      <td>${esc(c.region)}</td><td class="num">${num(mine.length)}</td>
      <td class="num">${money(sum(mine,l=>l.amount))}</td><td class="num">${money(sum(mine,l=>l.collected))}</td>
      <td class="num">${money(sum(mine.filter(l=>l.status!=='Closed'),l=>l.outstanding))}</td>
      <td><span class="badge ${c.status==='Active'?'b-ok':'b-proc'}">${c.status}</span></td></tr>`;
  }).join('') || '<tr><td colspan="7" class="empty">No repeat borrowers in this period.</td></tr>';
  el('cuRepeatBody').querySelectorAll('[data-cust]').forEach(r=>{
    r.onclick = ()=> drillCustomer(r.dataset.cust);
  });

  el('cuActiveHead').innerHTML = '<tr><th>Customer</th><th>Region</th><th class="num">Open loans</th><th class="num">Outstanding</th><th class="num">Arrears</th><th>Joined</th></tr>';
  el('cuActiveBody').innerHTML = custs.filter(c=>activeIds.has(c.id)).slice(0,10).map(c=>{
    const mine = LOANS.filter(l=>l.cust===c.id && l.status==='Active');
    return `<tr class="rowlink" data-cust="${c.id}">
      <td>${esc(c.name)}</td><td>${esc(c.region)}</td><td class="num">${num(mine.length)}</td>
      <td class="num">${money(sum(mine,l=>l.outstanding))}</td>
      <td class="num" style="color:${sum(mine,l=>l.arrears)?'#B32C2C':'inherit'}">${money(sum(mine,l=>l.arrears))}</td>
      <td>${fmtDate(c.joined)}</td></tr>`;
  }).join('') || '<tr><td colspan="6" class="empty">No customers with active loans in this period.</td></tr>';
  el('cuActiveBody').querySelectorAll('[data-cust]').forEach(r=>{
    r.onclick = ()=> drillCustomer(r.dataset.cust);
  });
}

function topCustomers(){
  return CUSTOMERS.map(c=>{
    const mine = LOANS.filter(l=>l.cust===c.id);
    return {name:c.name, out: sum(mine.filter(l=>l.status!=='Closed'), l=>l.outstanding)};
  }).filter(c=>c.out>0).sort((a,b)=>b.out-a.out).slice(0,7);
}
</script>
