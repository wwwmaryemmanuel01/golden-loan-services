<script>
/* ============================================================
   CHARTS & ANALYTICS (4/7)
   3 · Loan portfolio   4 · Repayment & collection   5 · Disbursements
   ============================================================ */

const AMOUNT_BANDS = [
  ['Up to 500k', 0, 500000],
  ['500k – 1M', 500000, 1000000],
  ['1M – 2M', 1000000, 2000000],
  ['2M – 3M', 2000000, 3000000],
  ['Over 3M', 3000000, Infinity]
];

/* ===================== 3 · LOAN PORTFOLIO ANALYTICS ===================== */
function renderPortfolio(){
  const loans = filterLoans(), apps = filterApps();
  const active = loans.filter(l=>l.status === 'Active');
  const closed = loans.filter(l=>l.status === 'Closed');
  const written = loans.filter(l=>l.status === 'Written off');
  const byProduct = PRODUCTS.map(p=>{
    const mine = loans.filter(l=>l.product === p.id);
    const open = mine.filter(l=>l.status === 'Active');
    return {id:p.id, name:p.name, loans:mine.length, principal:sum(mine, l=>l.amount),
      collected:sum(mine, l=>l.collected), outstanding:sum(open, l=>l.outstanding),
      arrears:sum(open, l=>l.arrears)};
  });
  const outstandingTotal = sum(byProduct, p=>p.outstanding);

  el('lpKpis').innerHTML = [
    ['Loans in view', num(loans.length), `${num(active.length)} active · ${num(closed.length)} closed`, 'gold'],
    ['Principal issued', money(sum(loans, l=>l.amount)), 'Disbursed in the period', ''],
    ['Principal outstanding', money(outstandingTotal), 'Open balances only', ''],
    ['Average loan size', money(loans.length ? sum(loans, l=>l.amount)/loans.length : 0), 'Per facility', ''],
    ['Approval rate', r1(pct(apps.filter(a=>a.status==='Approved').length,
      apps.filter(a=>a.status==='Approved'||a.status==='Rejected').length || 1)) + '%',
      `${num(apps.filter(a=>a.status==='Approved').length)} approved · ${num(apps.filter(a=>a.status==='Rejected').length)} rejected`, ''],
    ['Written off', num(written.length), money(sum(written, l=>l.amount)) + ' of principal', written.length ? 'red' : '']
  ].map(([l,v,s,kk])=>kpiCard(l,v,s,kk)).join('');

  /* portfolio growth = cumulative principal issued by bucket */
  const disb = seriesBy(loans, l=>l.date, l=>l.amount);
  let run = 0;
  const cumulative = disb.data.map(v=>{ run += v; return run; });
  const bandCounts = AMOUNT_BANDS.map(([label, lo, hi])=> loans.filter(l=>l.amount >= lo && l.amount < hi).length);
  const bandValue = AMOUNT_BANDS.map(([label, lo, hi])=> sum(loans.filter(l=>l.amount >= lo && l.amount < hi), l=>l.amount));
  const terms = [...new Set(loans.map(l=>l.term))].sort((a,b)=>a-b);

  el('lpGrid').innerHTML = [
    {title:'Active vs closed loans', sub:'What is still running against what has finished', value:num(active.length) + ' active',
     chart: chart({type:'donut', cats:['Active','Closed','Written off'], h:200,
       series:[{data:[active.length, closed.length, written.length]}], colours:['#1E9E6A','#8A90A0','#D93F3F']})},
    {title:'Loans by product', sub:'Facility count per product', value:num(loans.length) + ' loans',
     chart: chart({type:'bar', cats:PRODUCTS.map(p=>pShort(p.id)), h:200,
       series:[{name:'Loans', data:PRODUCTS.map(p=> loans.filter(l=>l.product===p.id).length), colour:'#C9A227'}]})},
    {title:'Loans by loan amount', sub:'Ticket-size distribution', value:money(sum(loans, l=>l.amount)),
     chart: chart({type:'bar', cats:AMOUNT_BANDS.map(b=>b[0]), h:200,
       series:[{name:'Loans', data:bandCounts, colour:'#2F6FED'}]})},
    {title:'Loans by repayment period', sub:'Term length in months', value:num(terms.length) + ' terms',
     chart: chart({type:'bar', cats:terms.map(t=>t + 'm'), h:200,
       series:[{name:'Loans', data:terms.map(t=> loans.filter(l=>l.term===t).length), colour:'#7C5CF0'}]})},
    {title:'Approved vs rejected applications', sub:'Decisions by period', value:r1(pct(apps.filter(a=>a.status==='Approved').length, apps.length || 1)) + '% approved',
     drill:'apps',
     chart: chart({type:'stacked', cats:seriesBy(apps, a=>a.submitted, ()=>1).cats, h:200,
       series:[
         {name:'Approved', data:seriesBy(apps.filter(a=>a.status==='Approved'), a=>a.submitted, ()=>1).data, colour:'#1E9E6A'},
         {name:'Rejected', data:seriesBy(apps.filter(a=>a.status==='Rejected'), a=>a.submitted, ()=>1).data, colour:'#D93F3F'},
         {name:'Pending', data:seriesBy(apps.filter(a=>a.status==='Pending'), a=>a.submitted, ()=>1).data, colour:'#E08C1E'}]})},
    {title:'Loan portfolio growth', sub:'Cumulative principal issued', value:money(run),
     chart: chart({type:'area', cats:disb.cats, h:200, series:[{name:'Cumulative', data:cumulative, colour:'#1E9E6A'}]})},
    {title:'Principal outstanding by product', sub:'Open balance per product', value:money(outstandingTotal),
     chart: chart({type:'bar', cats:PRODUCTS.map(p=>pShort(p.id)), h:200,
       series:[{name:'Outstanding', data:PRODUCTS.map(p=> sum(active.filter(l=>l.product===p.id), l=>l.outstanding)), colour:'#0E9AA7'}]})},
    {title:'Loan status distribution', sub:'Share of facilities by status', value:num(written.length) + ' written off',
     chart: chart({type:'pie', cats:['Active','Closed','Written off'], h:200,
       series:[{data:[active.length, closed.length, written.length]}], colours:['#1E9E6A','#8A90A0','#D93F3F']})}
  ].map(cc).join('');

  /* composition table */
  el('lpTableHead').innerHTML = '<tr><th>Product</th><th class="num">Loans</th><th class="num">Principal</th>' +
    '<th class="num">Collected</th><th class="num">Outstanding</th><th class="num">Arrears</th><th class="num">Share</th></tr>';
  el('lpTableBody').innerHTML = byProduct.map(p=>`<tr class="rowlink" data-prod="${p.id}">
      <td><b>${esc(p.name)}</b></td><td class="num">${num(p.loans)}</td><td class="num">${money(p.principal)}</td>
      <td class="num">${money(p.collected)}</td><td class="num">${money(p.outstanding)}</td>
      <td class="num">${money(p.arrears)}</td>
      <td class="num">${r1(pct(p.principal, sum(byProduct, x=>x.principal) || 1))}%</td></tr>`).join('');
  el('lpTableFoot').innerHTML = `<tr style="font-weight:800;border-top:2px solid var(--line)">
      <td>Total</td><td class="num">${num(sum(byProduct, p=>p.loans))}</td>
      <td class="num">${money(sum(byProduct, p=>p.principal))}</td>
      <td class="num">${money(sum(byProduct, p=>p.collected))}</td>
      <td class="num">${money(outstandingTotal)}</td>
      <td class="num">${money(sum(byProduct, p=>p.arrears))}</td><td class="num">100%</td></tr>`;
  el('lpTableBody').querySelectorAll('[data-prod]').forEach(tr=>{
    tr.onclick = ()=>{ FILTER.product = tr.dataset.prod; syncFilterInputs(); renderAll(); toast('Filtered to ' + prodName(tr.dataset.prod)); };
  });

  el('lpOutBody').innerHTML = byProduct.filter(p=>p.outstanding > 0).map(p=>`<tr>
      <td>${esc(p.name)}</td><td class="num">${num(active.filter(l=>l.product===p.id).length)}</td>
      <td class="num">${money(p.outstanding)}</td><td class="num">${money(p.arrears)}</td>
      <td class="num">${r1(pct(p.outstanding, outstandingTotal || 1))}%</td></tr>`).join('') ||
    '<tr><td colspan="5" class="empty">No open balances in this selection.</td></tr>';
}

/* ===================== 4 · REPAYMENT & COLLECTION ANALYTICS ===================== */
function renderRepayment(){
  const loans = filterLoans(), pays = filterPays();
  const active = loans.filter(l=>l.status === 'Active');
  const overdue = active.filter(l=>l.arrears > 0).sort((a,b)=> b.arrears - a.arrears);
  const expectedArr = expectedByBucket(loansForSchedule());
  const actual = seriesBy(pays, p=>p.date, p=>p.amount);
  const expTotal = sum(expectedArr);
  const collTotal = sum(pays, p=>p.amount);
  const recovered = pays.filter(p=> (LOAN_BY_REF[p.loan]||{}).arrears > 0);
  const late = pays.filter(p=>p.timing === 'Late');

  el('rcKpis').innerHTML = [
    ['Collected', money(collTotal), `${num(pays.length)} receipts`, 'gold'],
    ['Expected', money(expTotal), 'Instalments that fell due', ''],
    ['Recovery rate', r1(pct(collTotal, expTotal || 1)) + '%', 'Collected against what fell due', ''],
    ['On-time payments', r1(pct(pays.filter(p=>p.timing==='On time').length, pays.length || 1)) + '%',
      `${num(pays.filter(p=>p.timing==='On time').length)} of ${num(pays.length)} receipts`, ''],
    ['Partial payments', num(pays.filter(p=>p.status==='Partial').length), money(sum(pays.filter(p=>p.status==='Partial'), p=>p.amount)), ''],
    ['Overdue accounts', num(overdue.length), money(sum(overdue, l=>l.arrears)) + ' in arrears', overdue.length ? 'red' : ''],
    ['Average days late', r1(sum(late, p=>p.daysLate)/Math.max(1, late.length)), 'Across late receipts', '']
  ].map(([l,v,s,kk])=>kpiCard(l,v,s,kk)).join('');

  const byProduct = PRODUCTS.map(p=>{
    const mine = pays.filter(x=> (LOAN_BY_REF[x.loan]||{}).product === p.id);
    const exp = sum(expectedArr) ? null : null;
    return {id:p.id, name:p.name, n:mine.length,
      onTime: pct(mine.filter(x=>x.timing==='On time').length, mine.length || 1),
      value: sum(mine, x=>x.amount)};
  });
  const aging = ['1–30 days','31–60 days','61–90 days','91–180 days','180+ days'].map(b=>
    [b, sum(active.filter(l=>l.ageBucket===b), l=>l.arrears)]);

  el('rcGrid').innerHTML = [
    {title:'Expected vs actual repayments', sub:'Instalments due against cash received', value:money(collTotal),
     chart: chart({type:'bar', cats:actual.cats, h:200, series:[
       {name:'Expected', data:expectedArr, colour:'#8A90A0'},
       {name:'Actual', data:actual.data, colour:'#C9A227'}]})},
    {title:'Monthly collection trends', sub:'Cash collected per period', value:money(sum(actual.data)),
     drill:'pays',
     chart: chart({type:'line', cats:actual.cats, h:200, series:[{name:'Collected', data:actual.data, colour:'#1E9E6A'}]})},
    {title:'On-time vs late payments', sub:'Receipt count by timing', value:r1(pct(pays.length - late.length, pays.length || 1)) + '% on time',
     drill:'pays',
     chart: chart({type:'stacked', cats:seriesBy(pays, p=>p.date, ()=>1).cats, h:200, series:[
       {name:'On time', data:seriesBy(pays.filter(p=>p.timing==='On time'), p=>p.date, ()=>1).data, colour:'#1E9E6A'},
       {name:'Late', data:seriesBy(late, p=>p.date, ()=>1).data, colour:'#D93F3F'}]})},
    {title:'Full vs partial payments', sub:'How complete each receipt was', value:num(pays.filter(p=>p.status==='Full').length) + ' full',
     chart: chart({type:'donut', cats:['Full','Partial'], h:200,
       series:[{data:[pays.filter(p=>p.status==='Full').length, pays.filter(p=>p.status==='Partial').length]}],
       colours:['#1E9E6A','#E08C1E']})},
    {title:'Arrears aging distribution', sub:'Overdue value by days past due', value:money(sum(overdue, l=>l.arrears)), drill:'overdue',
     chart: chart({type:'bar', cats:aging.map(a=>a[0]), h:200,
       series:[{name:'Arrears', data:aging.map(a=>a[1]), colour:'#D93F3F'}]})},
    {title:'Collection recovery rates', sub:'Collected as a share of what fell due', value:r1(pct(collTotal, expTotal || 1)) + '%',
     chart: chart({type:'line', cats:actual.cats, h:200, series:[{name:'Recovery %',
       data:expectedArr.map((e,i)=> e ? r1(actual.data[i]/e*100) : 0), colour:'#0E9AA7'}]})},
    {title:'Repayment performance by product', sub:'Share of receipts paid on time', value:num(pays.length) + ' receipts',
     chart: chart({type:'bar', cats:PRODUCTS.map(p=>pShort(p.id)), h:200,
       series:[{name:'On time %', data:byProduct.map(p=> r1(p.onTime)), colour:'#1E9E6A'}]})},
    {title:'Overdue loan accounts', sub:'Arrears value per ageing bucket', value:num(overdue.length) + ' accounts',
     drill:'overdue',
     chart: chart({type:'bar', cats:aging.map(a=>a[0]), h:200,
       series:[{name:'Accounts', data:['1–30 days','31–60 days','61–90 days','91–180 days','180+ days']
         .map(b=> active.filter(l=>l.ageBucket===b).length), colour:'#E08C1E'}]})}
  ].map(cc).join('');

  el('rcOverduePill').textContent = overdue.length;
  renderTable('rcOverdueBody', [
    {k:'ref', label:'Loan'},
    {k:'cust', label:'Customer'},
    {k:'product', label:'Product'},
    {k:'dpd', label:'Days late', num:true},
    {k:'outstanding', label:'Outstanding', num:true, html:v=> money(v)},
    {k:'arrears', label:'Arrears', num:true, html:v=> money(v)},
    {k:'age', label:'Bucket'}
  ], overdue.map(l=>({ref:l.ref, cust:custName(l.cust), product:prodName(l.product), dpd:l.dpd,
      outstanding:l.outstanding, arrears:l.arrears, age:l.ageBucket, _drill:['loan', l.ref]})),
    {sort:'dpd', pageSize:8, onRow:true});
}

/* ===================== 5 · DISBURSEMENT ANALYTICS ===================== */
function renderDisbursement(){
  const all = filterDisb();
  const ok = all.filter(d=>d.status === 'Successful');
  const failed = all.filter(d=>d.status === 'Failed');
  const reversed = all.filter(d=>d.status === 'Reversed');
  const byMethod = METHODS.map(m=>({m, n: all.filter(d=>d.method===m).length, v: sum(all.filter(d=>d.method===m), d=>d.amount)}));

  /* last 30 calendar days of payout activity, independent of the grain switch */
  const days = [];
  for(let i=29;i>=0;i--) days.push(addDays(TODAY, -i));
  const daily = days.map(d=> sum(all.filter(x=>x.date === d), x=>x.amount));

  const approved = seriesBy(all, d=>d.date, d=>d.approved);
  const actual = seriesBy(ok, d=>d.date, d=>d.amount);
  const byStaff = STAFF.map(s=>({id:s.id, name:s.name, v: sum(ok.filter(d=>d.officer===s.id), d=>d.amount), n: ok.filter(d=>d.officer===s.id).length}))
    .filter(s=>s.n).sort((a,b)=>b.v-a.v);

  el('dbKpis').innerHTML = [
    ['Payouts in period', num(all.length), `${num(ok.length)} successful`, 'gold'],
    ['Value released', money(sum(ok, d=>d.amount)), 'Only successful payouts counted', ''],
    ['Failed payouts', num(failed.length), money(sum(failed, d=>d.amount)) + ' not released', failed.length ? 'red' : ''],
    ['Reversed payouts', num(reversed.length), money(sum(reversed, d=>d.amount)) + ' returned', reversed.length ? 'red' : ''],
    ['Average payout', money(ok.length ? sum(ok, d=>d.amount)/ok.length : 0), 'Per successful payout', ''],
    ['Success rate', r1(pct(ok.length, all.length || 1)) + '%', 'Of all payout attempts', '']
  ].map(([l,v,s,kk])=>kpiCard(l,v,s,kk)).join('');

  el('dbGrid').innerHTML = [
    {title:'Daily disbursement totals', sub:'Every day of the last 30 days', value:money(sum(daily)),
     chart: chart({type:'bar', cats:days.map(d=>fmtShort(d)), h:200,
       series:[{name:'Released', data:daily, colour:'#C9A227'}]})},
    {title:'Monthly disbursement trends', sub:'Released value per period', value:money(sum(actual.data)),
     drill:'disb',
     chart: chart({type:'line', cats:actual.cats, h:200, series:[{name:'Released', data:actual.data, colour:'#1E9E6A'}]})},
    {title:'Successful vs failed disbursements', sub:'Payout count by outcome', value:num(all.length) + ' attempts',
     drill:'disb',
     chart: chart({type:'stacked', cats:seriesBy(all, d=>d.date, ()=>1).cats, h:200, series:[
       {name:'Successful', data:seriesBy(ok, d=>d.date, ()=>1).data, colour:'#1E9E6A'},
       {name:'Failed', data:seriesBy(failed, d=>d.date, ()=>1).data, colour:'#D93F3F'},
       {name:'Reversed', data:seriesBy(reversed, d=>d.date, ()=>1).data, colour:'#E08C1E'}]})},
    {title:'Disbursements by payment method', sub:'Value released per channel', value:num(METHODS.length) + ' channels',
     chart: chart({type:'bar', cats:byMethod.map(m=>m.m), h:200,
       series:[{name:'Released', data:byMethod.map(m=>m.v), colour:'#2F6FED'}]})},
    {title:'Disbursements by loan product', sub:'Value released per product', value:money(sum(ok, d=>d.amount)),
     chart: chart({type:'bar', cats:PRODUCTS.map(p=>pShort(p.id)), h:200,
       series:[{name:'Released', data:PRODUCTS.map(p=> sum(ok.filter(d=> (LOAN_BY_REF[d.loan]||{}).product === p.id), d=>d.amount)), colour:'#7C5CF0'}]})},
    {title:'Disbursements by staff member', sub:'Value released per officer', value:num(byStaff.length) + ' officers',
     chart: chart({type:'bar', cats:byStaff.map(s=>s.name.split(' ')[0]), h:200,
       series:[{name:'Released', data:byStaff.map(s=>s.v), colour:'#0E9AA7'}]})},
    {title:'Approved vs actually disbursed', sub:'What was authorised against what left the account', value:money(sum(ok, d=>d.amount)),
     chart: chart({type:'bar', cats:actual.cats, h:200, series:[
       {name:'Approved', data:approved.data, colour:'#8A90A0'},
       {name:'Released', data:actual.data, colour:'#C9A227'}]})}
  ].map(cc).join('');

  el('dbTableHead').innerHTML = '<tr><th>Period</th><th class="num">Payouts</th><th class="num">Approved</th>' +
    '<th class="num">Released</th><th class="num">Variance</th><th class="num">Success</th></tr>';
  el('dbTableBody').innerHTML = approved.keys.map((k,i)=>{
    const inBucket = all.filter(d=> bucketKey(d.date) === k);
    const okIn = inBucket.filter(d=>d.status === 'Successful');
    return `<tr><td>${esc(bucketLabel(k))}</td><td class="num">${num(inBucket.length)}</td>
      <td class="num">${money(approved.data[i])}</td><td class="num">${money(actual.data[i])}</td>
      <td class="num" style="color:${approved.data[i] - actual.data[i] > 0 ? '#B32C2C' : 'inherit'}">${money(actual.data[i] - approved.data[i])}</td>
      <td class="num">${r1(pct(okIn.length, inBucket.length || 1))}%</td></tr>`;
  }).join('') || '<tr><td colspan="6" class="empty">No payouts in the current selection.</td></tr>';
}
</script>
