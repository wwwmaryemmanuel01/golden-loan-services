<script>
/* ============================================================
   GRAPHING & TABULATION (4/5)
   Sections 9 (financial summaries), 10 (comparison & trends),
   11 (filters & data exploration).
   ============================================================ */

/* ===================== 9 · FINANCIAL SUMMARY TABLES ===================== */
const SUM = {period:'month'};

function summaryKeys(){
  const d = Math.max(1, daysBetween(FILTER.from, FILTER.to));
  if(SUM.period === 'day'){
    const out = [];
    for(let i=Math.min(13,d);i>=0;i--) out.push({key:addDays(FILTER.to,-i), label:fmtDate(addDays(FILTER.to,-i))});
    return out;
  }
  if(SUM.period === 'week'){
    const out = [];
    let cur = FILTER.to;
    for(let i=0;i<8 && cur >= FILTER.from;i++){
      const start = addDays(cur,-6);
      out.unshift({key:start + '|' + cur, label:fmtShort(start) + ' – ' + fmtShort(cur)});
      cur = addDays(start,-1);
    }
    return out;
  }
  if(SUM.period === 'year'){
    return [...new Set(MONTHS.map(m=>m.slice(0,4)))].sort().map(y=>({key:y, label:y}));
  }
  return MONTHS.filter(m=> m >= FILTER.from.slice(0,7) && m <= FILTER.to.slice(0,7))
    .map(m=>({key:m, label:monthLabel(m)}));
}
function inBucket(date, key){
  const d = String(date).slice(0,10);
  if(key.includes('|')){ const [a,b] = key.split('|'); return d >= a && d <= b; }
  if(key.length === 4) return d.slice(0,4) === key;
  if(key.length === 7) return d.slice(0,7) === key;
  return d === key;
}

function summaryRows(){
  const keys = summaryKeys();
  const loans = filterLoans(), pays = filterPays();
  return keys.map(({key,label})=>{
    const l = loans.filter(x=>inBucket(x.date,key));
    const p = pays.filter(x=>inBucket(x.date,key));
    const disb = sum(l,x=>x.amount), coll = sum(p,x=>x.amount);
    const interest = sum(p,x=>x.interest), fees = sum(p,x=>x.fees);
    const expense = expenseForBucket(key);
    return {label, l, p, disb, coll, interest, fees, expense,
      principal: sum(p,x=>x.principal), loans:l.length, receipts:p.length,
      net: coll - expense, ratio: disb ? coll/disb*100 : 0};
  });
}

function renderSummaries(){
  el('sumPeriod').querySelectorAll('[data-sp]').forEach(b=>{
    b.classList.toggle('on', b.dataset.sp === SUM.period);
    b.onclick = ()=>{ SUM.period = b.dataset.sp; renderSummaries(); };
  });
  const rows = summaryRows();

  /* daily / weekly / monthly / annual summary */
  el('sumHead').innerHTML = '<tr><th>Period</th><th class="num">Loans</th><th class="num">Disbursed</th>' +
    '<th class="num">Receipts</th><th class="num">Collected</th><th class="num">Interest</th><th class="num">Fees</th>' +
    '<th class="num">Expenses</th><th class="num">Net cash<br><span style="font-weight:500;font-size:8px">collections − expenses</span></th></tr>';
  el('sumBody').innerHTML = rows.map(r=>`<tr>
    <td>${esc(r.label)}</td><td class="num">${num(r.loans)}</td><td class="num">${money(r.disb)}</td>
    <td class="num">${num(r.receipts)}</td><td class="num">${money(r.coll)}</td><td class="num">${money(r.interest)}</td>
    <td class="num">${money(r.fees)}</td><td class="num">${money(r.expense)}</td>
    <td class="num" style="color:${r.net<0?'#B32C2C':'#157A50'}">${money(r.net)}</td></tr>`).join('') ||
    '<tr><td colspan="9" class="empty">No activity in this period.</td></tr>';
  el('sumFoot').innerHTML = `<tr style="font-weight:800;background:#FAFBFC"><td>Total</td>
    <td class="num">${num(sum(rows,r=>r.loans))}</td><td class="num">${money(sum(rows,r=>r.disb))}</td>
    <td class="num">${num(sum(rows,r=>r.receipts))}</td><td class="num">${money(sum(rows,r=>r.coll))}</td>
    <td class="num">${money(sum(rows,r=>r.interest))}</td><td class="num">${money(sum(rows,r=>r.fees))}</td>
    <td class="num">${money(sum(rows,r=>r.expense))}</td><td class="num">${money(sum(rows,r=>r.net))}</td></tr>`;

  /* disbursements vs repayments */
  el('sumDisbHead').innerHTML = '<tr><th>Period</th><th class="num">Disbursed</th><th class="num">Collected</th>' +
    '<th class="num">Difference</th><th class="num">Collection ratio</th></tr>';
  el('sumDisbBody').innerHTML = rows.map(r=>`<tr>
    <td>${esc(r.label)}</td><td class="num">${money(r.disb)}</td><td class="num">${money(r.coll)}</td>
    <td class="num" style="color:${r.coll-r.disb<0?'#B32C2C':'#157A50'}">${money(r.coll-r.disb)}</td>
    <td class="num">${r.disb ? r1(r.coll/r.disb*100)+'%' : '—'}</td></tr>`).join('');

  /* principal vs interest */
  el('sumSplitHead').innerHTML = '<tr><th>Period</th><th class="num">Principal</th><th class="num">Interest</th>' +
    '<th class="num">Fees &amp; penalties</th><th class="num">Total collected</th><th class="num">Interest share</th></tr>';
  el('sumSplitBody').innerHTML = rows.map(r=>`<tr>
    <td>${esc(r.label)}</td><td class="num">${money(r.principal)}</td><td class="num">${money(r.interest)}</td>
    <td class="num">${money(r.fees)}</td><td class="num">${money(r.coll)}</td>
    <td class="num">${r.coll ? r1(r.interest/r.coll*100)+'%' : '—'}</td></tr>`).join('') +
    `<tr style="font-weight:800;background:#FAFBFC"><td>Total</td>
      <td class="num">${money(sum(rows,r=>r.principal))}</td><td class="num">${money(sum(rows,r=>r.interest))}</td>
      <td class="num">${money(sum(rows,r=>r.fees))}</td><td class="num">${money(sum(rows,r=>r.coll))}</td><td class="num">—</td></tr>`;

  /* fees summary */
  const latePays = filterPays().filter(p=>p.fees>0);
  const processing = sum(filterDisb().filter(d=>d.status==='Successful'), d=>Math.round(d.amount*0.015));
  el('sumFeesBody').innerHTML = `
    <tr><td>Processing fees</td><td class="num">${num(filterDisb().filter(d=>d.status==='Successful').length)}</td>
      <td class="num">${money(processing)}</td><td class="num">${r1(pct(processing, processing+sum(latePays,p=>p.fees)))}%</td></tr>
    <tr><td>Late payment penalties</td><td class="num">${num(latePays.length)}</td>
      <td class="num">${money(sum(latePays,p=>p.fees))}</td><td class="num">${r1(pct(sum(latePays,p=>p.fees), processing+sum(latePays,p=>p.fees)))}%</td></tr>
    <tr><td>Other charges</td><td class="num">${num(filterTxns().filter(t=>t.type==='Fee').length)}</td>
      <td class="num">${money(sum(filterTxns().filter(t=>t.type==='Fee'), t=>t.amount))}</td><td class="num">—</td></tr>
    <tr style="font-weight:800;background:#FAFBFC"><td>Total fees and penalties</td><td class="num">—</td>
      <td class="num">${money(processing + sum(latePays,p=>p.fees) + sum(filterTxns().filter(t=>t.type==='Fee'), t=>t.amount))}</td><td class="num">100%</td></tr>`;

  /* outstanding by product */
  const loans = filterLoans();
  el('sumOutBody').innerHTML = PRODUCTS.map(p=>{
    const mine = loans.filter(l=>l.product===p.id && l.status !== 'Closed');
    const out = sum(mine,l=>l.outstanding);
    return `<tr><td>${esc(p.name)}</td><td class="num">${num(mine.length)}</td>
      <td class="num">${money(out)}</td><td class="num">${money(sum(mine,l=>l.arrears))}</td>
      <td class="num">${r1(pct(out, sum(loans.filter(l=>l.status!=='Closed'), l=>l.outstanding)))}%</td></tr>`;
  }).join('') + `<tr style="font-weight:800;background:#FAFBFC"><td>Total</td>
    <td class="num">${num(loans.filter(l=>l.status!=='Closed').length)}</td>
    <td class="num">${money(kpis().outstanding)}</td><td class="num">${money(kpis().arrears)}</td><td class="num">100%</td></tr>`;

  /* arrears by aging */
  const active = loans.filter(l=>l.status==='Active');
  el('sumAgeBody').innerHTML = AGES.map(a=>{
    const mine = active.filter(l=>l.ageBucket===a);
    return `<tr><td>${a}</td><td class="num">${num(mine.length)}</td>
      <td class="num">${money(sum(mine,l=>l.arrears))}</td>
      <td class="num">${r1(pct(sum(mine,l=>l.arrears), Math.max(1,sum(active,l=>l.arrears))))}%</td></tr>`;
  }).join('') + `<tr style="font-weight:800;background:#FAFBFC"><td>Total</td><td class="num">${num(active.length)}</td>
    <td class="num">${money(sum(active,l=>l.arrears))}</td><td class="num">100%</td></tr>`;
}

/* ===================== 10 · COMPARISON & TRENDS ===================== */
function windowStats(from, to){
  const loans = LOANS.filter(l=> l.date >= from && l.date <= to);
  const pays = PAYS.filter(p=> p.date >= from && p.date <= to);
  const apps = APPS.filter(a=> a.submitted >= from && a.submitted <= to);
  const custs = CUSTOMERS.filter(c=> c.joined >= from && c.joined <= to);
  const disb = sum(loans,l=>l.amount), coll = sum(pays,p=>p.amount);
  return {loans:loans.length, disb, coll, interest:sum(pays,p=>p.interest),
    fees:sum(pays,p=>p.fees), apps:apps.length,
    approved:apps.filter(a=>a.status==='Approved').length,
    rejected:apps.filter(a=>a.status==='Rejected').length,
    custs:custs.length, receipts:pays.length,
    rate: disb ? coll/disb*100 : 0};
}

function renderComparison(){
  const days = Math.max(1, daysBetween(FILTER.from, FILTER.to));
  const prevFrom = addDays(FILTER.from, -days-1), prevTo = addDays(FILTER.from, -1);
  const cur = windowStats(FILTER.from, FILTER.to), prev = windowStats(prevFrom, prevTo);
  const change = (a,b) => b ? (a-b)/b*100 : (a ? 100 : 0);
  // Growth reads as a percentage, except where the base period is so thin that a
  // percentage becomes meaningless noise (e.g. 24,452%): then show a multiplier.
  const growth = (a,b) => {
    const c = change(a,b), v = Math.abs(c), up = a >= b;
    if (v >= 999.5) return (up?'▲ ':'▼ ') + num(Math.round(v/100)) + '× the previous period';
    return (up?'▲ ':'▼ ') + r1(v) + '% the previous period';
  };

  el('cmpRange').textContent = `${fmtDate(FILTER.from)} – ${fmtDate(FILTER.to)} vs ${fmtDate(prevFrom)} – ${fmtDate(prevTo)}`;
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
    const v = change(a,b);
    const show = x => kind === 'm' ? money(x) : kind === 'p' ? r1(x)+'%' : num(x);
    return `<tr><td>${label}</td><td class="num">${show(a)}</td><td class="num">${show(b)}</td>
      <td class="num">${delta(v)}</td><td class="num">${show(a-b)}</td></tr>`;
  }).join('');
  el('cmpKpis').innerHTML = [
    ['Collections vs previous', money(cur.coll), growth(cur.coll,prev.coll), cur.coll>=prev.coll?'':'red'],
    ['Disbursements vs previous', money(cur.disb), growth(cur.disb,prev.disb), cur.disb>=prev.disb?'':'red'],
    ['Approval rate', r1(pct(cur.approved, cur.approved+cur.rejected))+'%', `Previous ${r1(pct(prev.approved, prev.approved+prev.rejected))}%`, ''],
    ['New customers', num(cur.custs), growth(cur.custs,prev.custs), '']
  ].map(([l,v,s,k])=>kpiCard(l,v,s,k)).join('');

  /* month-on-month */
  const mRows = MONTHS12.map(m=>{
    const lo = LOANS.filter(l=>l.date.slice(0,7)===m), pa = PAYS.filter(p=>p.date.slice(0,7)===m);
    return {m, disb:sum(lo,l=>l.amount), coll:sum(pa,p=>p.amount), n:lo.length};
  });
  el('momHead').innerHTML = '<tr><th>Month</th><th class="num">Loans</th><th class="num">Disbursed</th>' +
    '<th class="num">MoM</th><th class="num">Collected</th><th class="num">MoM</th></tr>';
  el('momBody').innerHTML = mRows.map((r,i)=>{
    const p = mRows[i-1];
    const dD = p ? change(r.disb, p.disb) : 0, dC = p ? change(r.coll, p.coll) : 0;
    return `<tr><td>${monthLabel(r.m)}</td><td class="num">${num(r.n)}</td><td class="num">${money(r.disb)}</td>
      <td class="num">${p?delta(dD):'—'}</td><td class="num">${money(r.coll)}</td><td class="num">${p?delta(dC):'—'}</td></tr>`;
  }).join('');

  /* year on year */
  const yoy = ['2025','2026'].map(y=>{
    const lo = LOANS.filter(l=> l.date.slice(0,4)===y && l.date.slice(5,7) === FILTER.to.slice(5,7));
    const pa = PAYS.filter(p=> p.date.slice(0,4)===y && p.date.slice(5,7) === FILTER.to.slice(5,7));
    return {y, disb:sum(lo,l=>l.amount), coll:sum(pa,p=>p.amount), n:lo.length};
  });
  const y0 = yoy[0], y1 = yoy[1];
  el('yoyBody').innerHTML = [
    ['Loans issued', y0.n, y1.n, 'n'],['Disbursed', y0.disb, y1.disb, 'm'],['Collected', y0.coll, y1.coll, 'm']
  ].map(([l,a,b,k])=>{
    const show = x => k==='m' ? money(x) : num(x);
    return `<tr><td>${l} · ${MONTH_NAMES[Number(FILTER.to.slice(5,7))-1]}</td><td class="num">${show(a)}</td>
      <td class="num">${show(b)}</td><td class="num">${delta(change(b,a))}</td></tr>`;
  }).join('');

  /* trend charts */
  const approval = MONTHS12.map(m=>{
    const a = APPS.filter(x=>x.submitted.slice(0,7)===m && (x.status==='Approved'||x.status==='Rejected'));
    return a.length ? Math.round(a.filter(x=>x.status==='Approved').length/a.length*100) : 0;
  });
  const repayRate = MONTHS12.map(m=>{
    const due = sum(LOANS.filter(l=> addMonths(l.date,1).slice(0,7) <= m), l=>0);
    const pa = PAYS.filter(p=>p.date.slice(0,7)===m);
    const on = pa.filter(p=>p.timing==='On time').length;
    return pa.length ? Math.round(on/pa.length*100) : 0;
  });
  const arrearsSeries = MONTHS12.map(m=>{
    const end = addMonths(m+'-01',1);
    return sum(LOANS.filter(l=>l.date <= end && l.status!=='Closed'), l=>{
      const dueInst = Math.min(l.term, Math.max(0, monthsBetween(l.date, end) + 1));
      const paid = (PAYS_BY_LOAN[l.ref]||[]).filter(p=>p.date <= end)
        .reduce((s,p)=> s + (p.status==='Full'?1:0.5), 0);
      return Math.max(0, dueInst - paid) * l.instalment;
    });
  });
  const custGrowth = MONTHS12.map(m=> CUSTOMERS.filter(c=>c.joined.slice(0,7) <= m).length);

  el('cmpGrid').innerHTML = [
    chartCard({title:'Loan approval rate trends', sub:'Approved share of decided applications', value:r1(approval[approval.length-1])+'%',
      chart: chart({type:'line', cats:MONTHS12.map(monthLabel), series:[{name:'Approval %', data:approval, colour:'#1E9E6A'}], h:200})}),
    chartCard({title:'Repayment rate trends', sub:'Share of receipts paid on time', value:r1(repayRate[repayRate.length-1])+'%',
      chart: chart({type:'line', cats:MONTHS12.map(monthLabel), series:[{name:'On-time %', data:repayRate, colour:'#2F6FED'}], h:200})}),
    chartCard({title:'Arrears growth or reduction', sub:'Estimated arrears at each month end', value:money(arrearsSeries[arrearsSeries.length-1]),
      chart: chart({type:'area', cats:MONTHS12.map(monthLabel), series:[{name:'Arrears', data:arrearsSeries, colour:'#D93F3F'}], h:200})}),
    chartCard({title:'Customer growth trends', sub:'Cumulative registered customers', value:num(custGrowth[custGrowth.length-1]),
      chart: chart({type:'area', cats:MONTHS12.map(monthLabel), series:[{name:'Customers', data:custGrowth, colour:'#C9A227'}], h:200})}),
    chartCard({title:'Financial target vs actual', sub:'Monthly disbursement target against what was released', value:money(sum(MONTHS12.map(m=>sum(LOANS.filter(l=>l.date.slice(0,7)===m),l=>l.amount)))),
      chart: chart({type:'bar', cats:MONTHS12.map(monthLabel), series:[
        {name:'Target', data:MONTHS12.map(m=>TARGETS[m].disburse), colour:'#8A90A0'},
        {name:'Actual', data:MONTHS12.map(m=>sum(LOANS.filter(l=>l.date.slice(0,7)===m),l=>l.amount)), colour:'#C9A227'}], h:200})}),
    chartCard({title:'Staff performance comparison', sub:'Collections per officer, current against target', value:r1(sum(staffMetrics(),x=>x.achievement)/Math.max(1,staffMetrics().length))+'%',
      chart: chart({type:'bar', cats:staffMetrics().map(x=>x.s.name.split(' ')[0]),
        series:[{name:'Collected', data:staffMetrics().map(x=>x.collected), colour:'#1E9E6A'},
                {name:'Target', data:staffMetrics().map(x=>Math.round(x.target)), colour:'#8A90A0'}], h:200})})
  ].join('');
}

/* ===================== 11 · FILTERS & DATA EXPLORATION ===================== */
function renderFilters(){
  el('fltFrom').value = FILTER.from;
  el('fltTo').value = FILTER.to;
  el('fltProduct').innerHTML = '<option value="">All products</option>' +
    PRODUCTS.map(p=>`<option value="${p.id}" ${FILTER.product===p.id?'selected':''}>${p.name}</option>`).join('');
  el('fltStatus').innerHTML = '<option value="">All statuses</option>' +
    ['Active','Closed','Written off','Approved','Rejected','Pending','Withdrawn']
      .map(s=>`<option value="${s}" ${FILTER.status===s?'selected':''}>${s}</option>`).join('');
  el('fltStaff').innerHTML = '<option value="">All staff</option>' +
    STAFF.map(s=>`<option value="${s.id}" ${FILTER.staff===s.id?'selected':''}>${esc(s.name)}</option>`).join('');
  el('fltMethod').innerHTML = '<option value="">All methods</option>' +
    METHODS.map(m=>`<option value="${m}" ${FILTER.method===m?'selected':''}>${m}</option>`).join('');
  el('fltRegion').innerHTML = '<option value="">All regions</option>' +
    REGIONS.map(r=>`<option value="${r}" ${FILTER.region===r?'selected':''}>${r}</option>`).join('');
  el('fltCustomer').innerHTML = '<option value="">All customers</option>' +
    CUSTOMERS.slice(0,60).map(c=>`<option value="${c.id}" ${FILTER.customer===c.id?'selected':''}>${esc(c.name)} · ${c.id}</option>`).join('');
  el('fltGrain').querySelectorAll('[data-grain]').forEach(b=>{
    b.classList.toggle('on', b.dataset.grain === FILTER.grain);
    b.onclick = ()=>{ FILTER.grain = b.dataset.grain; renderAll(); toast('Period view set to ' + b.textContent.trim().toLowerCase() + '.'); };
  });
  el('fltPreset').querySelectorAll('[data-preset]').forEach(b=>{
    b.onclick = ()=>{
      const p = b.dataset.preset;
      if(p === '7d'){ FILTER.from = addDays(TODAY,-6); FILTER.to = TODAY; }
      if(p === '30d'){ FILTER.from = addDays(TODAY,-29); FILTER.to = TODAY; }
      if(p === 'qtd'){ FILTER.from = addMonths(TODAY,-2).slice(0,8)+'01'; FILTER.to = TODAY; }
      if(p === 'ytd'){ FILTER.from = '2026-01-01'; FILTER.to = TODAY; }
      if(p === 'all'){ FILTER.from = MONTHS[0]+'-01'; FILTER.to = TODAY; }
      renderAll();
      toast('Date range applied: ' + fmtDate(FILTER.from) + ' – ' + fmtDate(FILTER.to));
    };
  });

  const chips = [];
  if(FILTER.product) chips.push(['product', 'Product: ' + PROD_BY_ID[FILTER.product].name]);
  if(FILTER.status) chips.push(['status', 'Status: ' + FILTER.status]);
  if(FILTER.staff) chips.push(['staff', 'Staff: ' + (STAFF_BY_ID[FILTER.staff]||{}).name]);
  if(FILTER.method) chips.push(['method', 'Method: ' + FILTER.method]);
  if(FILTER.region) chips.push(['region', 'Region: ' + FILTER.region]);
  if(FILTER.customer) chips.push(['customer', 'Customer: ' + (CUST_BY_ID[FILTER.customer]||{}).name]);
  if(FILTER.q) chips.push(['q', 'Search: “' + FILTER.q + '”']);
  el('fltChips').innerHTML = chips.length
    ? chips.map(([k,l])=>`<span class="fchip on">${esc(l)}<span class="x" data-chip="${k}">✕</span></span>`).join('')
    : '<span class="fchip">No filters applied — the whole book is in view</span>';
  el('fltChips').querySelectorAll('[data-chip]').forEach(x=>{
    x.onclick = ()=>{ FILTER[x.dataset.chip] = ''; renderAll(); };
  });

  const counts = [
    ['Loans', filterLoans().length], ['Repayments', filterPays().length], ['Applications', filterApps().length],
    ['Disbursements', filterDisb().length], ['Customers', filterCust().length], ['Transactions', filterTxns().length]
  ];
  el('fltCounts').innerHTML = counts.map(([l,n])=>
    `<div><div class="sl">${l}</div><div class="sv">${num(n)}</div></div>`).join('');
  el('fltSummary').textContent = `${fmtDate(FILTER.from)} – ${fmtDate(FILTER.to)} · ${FILTER.grain} view · ` +
    (chips.length ? chips.length + ' filter(s) applied' : 'no filters');
  el('fltSearch').value = FILTER.q;
  el('fltResult').innerHTML = `This filter currently covers <b>${num(filterLoans().length)}</b> loans worth
    <b>${money(kpis().disbursed)}</b>, <b>${num(filterPays().length)}</b> receipts worth
    <b>${money(kpis().collected)}</b> and <b>${num(filterCust().length)}</b> customer records.`;
}

function filterTxns(){
  return TXNS.filter(t=> inRange(t.date)
    && (!FILTER.method || t.method === FILTER.method)
    && (!FILTER.customer || (LOAN_BY_REF[t.loan]||{}).cust === FILTER.customer)
    && (!FILTER.product || (LOAN_BY_REF[t.loan]||{}).product === FILTER.product));
}

function applyFilters(){
  FILTER.from = el('fltFrom').value || FILTER.from;
  FILTER.to = el('fltTo').value || FILTER.to;
  if(FILTER.from > FILTER.to){ const t = FILTER.from; FILTER.from = FILTER.to; FILTER.to = t; }
  FILTER.product = el('fltProduct').value;
  FILTER.status = el('fltStatus').value;
  FILTER.staff = el('fltStaff').value;
  FILTER.method = el('fltMethod').value;
  FILTER.region = el('fltRegion').value;
  FILTER.customer = el('fltCustomer').value;
  FILTER.q = el('fltSearch').value.trim();
  renderAll();
  toast('Filters applied · ' + num(filterLoans().length) + ' loans in view');
}
function resetFilters(){
  FILTER.from = MONTHS[0] + '-01';
  FILTER.to = TODAY;
  FILTER.grain = 'month';
  FILTER.product = ''; FILTER.status = ''; FILTER.customer = ''; FILTER.staff = '';
  FILTER.method = ''; FILTER.region = ''; FILTER.q = '';
  renderAll();
  toast('All filters cleared.', 'info');
}
</script>
