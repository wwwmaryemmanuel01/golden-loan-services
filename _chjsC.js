<script>
/* ============================================================
   CHARTS & ANALYTICS (3/7)
   1 · Analytics overview      2 · Financial performance charts
   ============================================================ */

/* chart card with an optional drill-down affordance */
function cc(o){
  return `<div class="chartcard${o.drill ? ' drillable' : ''}"${o.drill ? ` data-drill="${o.drill}"` : ''}>
    <div class="ch">
      <div><div class="ct">${esc(o.title)}</div><div class="cs">${esc(o.sub || '')}</div></div>
      <div style="text-align:right">${o.value !== undefined ? `<div class="cv">${o.value}</div>` : ''}
        ${o.delta !== undefined ? delta(o.delta) : ''}</div>
    </div>
    ${o.chart || ''}
    ${o.note ? `<div class="qhint">${o.note}</div>` : ''}
    ${o.drill ? '<div class="drillhint">Click for the records behind this chart</div>' : ''}
  </div>`;
}
function goto(id){
  const s = el(id);
  if(!s) return;
  if(typeof s.scrollIntoView === 'function') s.scrollIntoView({behavior:'smooth', block:'start'});
  document.querySelectorAll('.snav').forEach(a=> a.classList.toggle('on', a.getAttribute('href') === '#' + id));
}
const band = () => {
  const k = kpis();
  el('bandLoans').textContent = num(k.loans);
  el('bandDisbursed').textContent = compact(k.disbursed);
  el('bandCollected').textContent = compact(k.collected);
  el('bandOutstanding').textContent = compact(k.outstanding);
  el('bandArrears').textContent = compact(k.arrears);
};

/* outstanding principal still on the book at the close of a given date */
function outstandingAt(date){
  let out = 0;
  LOANS.forEach(l=>{
    if(l.date > date) return;
    const paid = sum(PAYS_BY_LOAN[l.ref] || [], p=> p.date <= date ? p.principal : 0);
    out += Math.max(0, l.amount - paid);
  });
  return out;
}
function bucketEnd(key){
  if(FILTER.grain === 'day') return key;
  if(FILTER.grain === 'week'){ const parts = String(key).split('|'); return parts[parts.length-1]; }
  if(FILTER.grain === 'year') return key + '-12-28';
  return key + '-28';
}

/* ===================== 1 · ANALYTICS OVERVIEW ===================== */
function renderOverview(){
  const k = kpis();
  const loans = filterLoans(), pays = filterPays();

  el('ovStamp').textContent = 'Last refresh — ' + lastRefresh();

  el('ovKpis').innerHTML = [
    ['Total loans issued', num(k.loans), `${k.active} active · ${k.closed} closed · ${k.written} written off`, 'gold'],
    ['Total amount disbursed', money(k.disbursed), `${num(filterDisb().filter(d=>d.status==='Successful').length)} successful payouts`, ''],
    ['Repayments collected', money(k.collected), `${num(k.receipts)} receipts in the period`, ''],
    ['Total outstanding balance', money(k.outstanding), 'Principal still with customers', ''],
    ['Total arrears', money(k.arrears), `${num(loans.filter(l=>l.status==='Active' && l.arrears>0).length)} accounts past due`, k.arrears ? 'red' : ''],
    ['Total interest collected', money(k.interest), `${r1(pct(k.interest, k.collected || 1))}% of cash received`, ''],
    ['Active customers', num(k.activeCust), `${num(k.customers)} on the register in scope`, ''],
    ['Pending loan applications', num(k.pending), `${num(k.apps)} applications in the period`, k.pending ? 'blue' : '']
  ].map(([l,v,s,kk])=>kpiCard(l,v,s,kk)).join('');

  /* overall portfolio performance score */
  const collectionRatio = pct(k.collected, k.disbursed || 1);
  const parRatio = pct(k.arrears, k.outstanding || 1);
  const approval = pct(k.approved, k.approved + k.rejected || 1);
  const onTime = pct(k.onTime, k.receipts || 1);
  const utilisation = pct(k.active, k.loans || 1);
  const scoreOf = (v, good, ok) => v >= good ? 100 : v >= ok ? 70 : 40;
  const parts = [
    ['Collection strength', collectionRatio, 70, 50, 'of disbursed cash recovered'],
    ['Portfolio quality', 100 - parRatio, 88, 75, 'of principal not in arrears'],
    ['Approval quality', approval, 60, 45, 'of decisions approved'],
    ['Payment timeliness', onTime, 70, 55, 'of receipts paid on time'],
    ['Book utilisation', utilisation, 55, 30, 'of facilities still open']
  ];
  const score = Math.round(sum(parts, p=> scoreOf(p[1], p[2], p[3]))/parts.length);
  el('ovScorePill').className = 'badge ' + (score >= 80 ? 'b-ok' : score >= 60 ? 'b-warn' : 'b-crit');
  el('ovScorePill').textContent = score + ' / 100 · ' + (score >= 80 ? 'healthy' : score >= 60 ? 'watch' : 'at risk');
  el('ovPerf').innerHTML = parts.map(([label, v, good, ok, hint])=>{
    const cls = v >= good ? 'ok' : v >= ok ? 'warn' : 'bad';
    return `<div class="meter">
      <div class="mt"><div>${label}</div><span>${r1(v)}%</span></div>
      <div class="mbar"><i class="${cls}" style="width:${clamp(v,0,100).toFixed(1)}%"></i></div>
      <div class="qhint" style="margin-top:1px">${hint}</div>
    </div>`;
  }).join('');

  el('ovInsights').innerHTML = [
    `<div class="risk"><div><div class="rn">${money(k.collected)} collected</div>
      <div class="rs">${r1(collectionRatio)}% of the ${money(k.disbursed)} disbursed in this window</div></div></div>`,
    `<div class="risk"><div><div class="rn">${money(k.outstanding)} outstanding</div>
      <div class="rs">${r1(parRatio)}% of it is in arrears (${money(k.arrears)}) · section 8 breaks it by ageing</div></div></div>`,
    `<div class="risk"><div><div class="rn">${r1(approval)}% approval rate</div>
      <div class="rs">${num(k.approved)} approved, ${num(k.rejected)} rejected, ${num(k.pending)} still pending · section 9</div></div></div>`,
    `<div class="risk"><div><div class="rn">${money(k.interest)} interest and ${money(k.fees)} fees</div>
      <div class="rs">Together ${r1(pct(k.interest + k.fees, k.collected || 1))}% of everything received · section 2</div></div></div>`
  ].join('');

  /* trend */
  const disb = seriesBy(loans, l=>l.date, l=>l.amount);
  const coll = seriesBy(pays, p=>p.date, p=>p.amount);
  el('ovTrend').innerHTML = chart({type:'bar', cats:disb.cats, h:230, series:[
    {name:'Disbursed', data:disb.data, colour:'#8A90A0'},
    {name:'Collected', data:coll.data, colour:'#C9A227'}
  ]});
  el('ovTrendNote').innerHTML = `Period view: <b>${FILTER.grain}</b> · ${bucket()}. ` +
    `Disbursed ${money(sum(disb.data))} against ${money(sum(coll.data))} collected — ` +
    `a collection ratio of <b>${r1(pct(sum(coll.data), sum(disb.data) || 1))}%</b>.`;

  /* latest receipts */
  const recent = pays.slice(0, 8);
  el('ovRecent').innerHTML = recent.map((p,i)=>`<tr class="rowlink" data-pay="${i}">
    <td>${fmtDate(p.date)}</td><td>${esc(p.receipt)}</td><td>${esc(custName(p.cust))}</td>
    <td>${esc(p.method)}</td><td class="num">${money(p.amount)}</td>
    <td><span class="badge ${p.timing==='On time'?'b-ok':'b-warn'}">${p.timing}</span></td></tr>`).join('') ||
    '<tr><td colspan="6" class="empty">No receipts in the current selection.</td></tr>';
  el('ovRecent').querySelectorAll('[data-pay]').forEach(tr=>{
    tr.onclick = ()=> drillPayment(recent[Number(tr.dataset.pay)]);
  });

  /* attention list */
  const failed = filterDisb().filter(d=>d.status !== 'Successful');
  const items = [
    ['Arrears exposure', `${num(loans.filter(l=>l.status==='Active' && l.arrears>0).length)} accounts · ${money(k.arrears)}`, 's8', 'Open'],
    ['Failed disbursements', `${num(failed.length)} payouts did not complete`, 's5', 'Review'],
    ['Partial payments', `${num(k.partial)} receipts part-paid`, 's4', 'View'],
    ['Decision queue', `${num(k.pending)} applications awaiting a decision`, 's9', 'Open']
  ];
  el('ovAttentionPill').textContent = items.length;
  el('ovAttention').innerHTML = items.map(([t,s,go,act])=>`
    <div class="risk"><div><div class="rn">${t}</div><div class="rs">${s}</div></div>
      <div class="rv"><button class="btn btn-ghost" data-goto="${go}">${act}</button></div></div>`).join('');
}

const bucket = () => FILTER.grain === 'day' ? 'daily buckets'
  : FILTER.grain === 'week' ? 'weekly buckets'
  : FILTER.grain === 'year' ? 'annual buckets' : 'monthly buckets';

/* ===================== 2 · FINANCIAL PERFORMANCE CHARTS ===================== */
function renderFinancial(){
  const loans = filterLoans(), pays = filterPays();
  const disb = seriesBy(loans, l=>l.date, l=>l.amount);
  const coll = seriesBy(pays, p=>p.date, p=>p.amount);
  const intr = seriesBy(pays, p=>p.date, p=>p.interest);
  const fees = seriesBy(pays, p=>p.date, p=>p.fees);
  const keys = disb.keys;
  const bal = keys.map(k=> outstandingAt(bucketEnd(k)));
  const expense = keys.map(k=> Math.round(expenseForBucket(k)));
  const income = keys.map((k,i)=> (intr.data[i]||0) + (fees.data[i]||0));
  const net = keys.map((k,i)=> (coll.data[i]||0) - (disb.data[i]||0));
  let cDisb = 0, cColl = 0;
  const growthD = keys.map((k,i)=>{ cDisb += disb.data[i]||0; return cDisb; });
  const growthC = keys.map((k,i)=>{ cColl += coll.data[i]||0; return cColl; });

  el('fpGrainNote').textContent = `Period view: ${FILTER.grain} · ${keys.length} buckets`;

  const cards = [
    {title:'Monthly disbursement trends', sub:'Principal released per period',
     value:money(sum(disb.data)), drill:'loans',
     chart: chart({type:'bar', cats:disb.cats, h:190, series:[{name:'Disbursed', data:disb.data, colour:'#C9A227'}]})},
    {title:'Monthly repayment trends', sub:'Cash received per period',
     value:money(sum(coll.data)), drill:'pays',
     chart: chart({type:'line', cats:coll.cats, h:190, series:[{name:'Collected', data:coll.data, colour:'#1E9E6A'}]})},
    {title:'Outstanding loan balance trends', sub:'Principal still on the book at each period end',
     value:money(bal.length ? bal[bal.length-1] : 0), drill:'loans',
     chart: chart({type:'area', cats:disb.cats, h:190, series:[{name:'Outstanding', data:bal, colour:'#2F6FED'}]})},
    {title:'Interest income trends', sub:'Interest recognised as receipts are posted',
     value:money(sum(intr.data)), drill:'pays',
     chart: chart({type:'area', cats:intr.cats, h:190, series:[{name:'Interest', data:intr.data, colour:'#7C5CF0'}]})},
    {title:'Fees and penalties collected', sub:'Late-payment penalties and charges',
     value:money(sum(fees.data)), drill:'pays',
     chart: chart({type:'bar', cats:fees.cats, h:190, series:[{name:'Fees', data:fees.data, colour:'#E08C1E'}]})},
    {title:'Monthly income trends', sub:'Interest plus fees, the revenue side of the book',
     value:money(sum(income)),
     chart: chart({type:'stacked', cats:intr.cats, h:190, series:[
        {name:'Interest', data:intr.data, colour:'#1E9E6A'},
        {name:'Fees', data:fees.data, colour:'#E08C1E'}]})},
    {title:'Cash flow trends', sub:'Collections less disbursements per period',
     value:money(sum(net)),
     chart: chart({type:'bar', cats:coll.cats, h:190, series:[{name:'Net cash', data:net, colour:'#0E9AA7'}]})},
    {title:'Income vs expenses', sub:'Revenue earned against running costs',
     value:money(sum(income) - sum(expense)),
     chart: chart({type:'bar', cats:disb.cats, h:190, series:[
        {name:'Income', data:income, colour:'#1E9E6A'},
        {name:'Expenses', data:expense, colour:'#D93F3F'}]})},
    {title:'Financial growth trends', sub:'Cumulative disbursed against cumulative collected',
     value:r1(pct(sum(growthC.slice(-1)), sum(growthD.slice(-1)) || 1)) + '%',
     chart: chart({type:'line', cats:disb.cats, h:190, series:[
        {name:'Cumulative disbursed', data:growthD, colour:'#8A90A0'},
        {name:'Cumulative collected', data:growthC, colour:'#C9A227'}]})}
  ];
  el('fpGrid').innerHTML = cards.map(cc).join('');

  const cols = ['Period','Disbursed','Collected','Interest','Fees','Expenses','Net cash'];
  el('fpTableHead').innerHTML = '<tr>' + cols.map((c,i)=>`<th class="${i?'num':''}">${c}</th>`).join('') + '</tr>';
  el('fpTableBody').innerHTML = keys.map((k,i)=>`<tr>
      <td>${esc(bucketLabel(k))}</td>
      <td class="num">${money(disb.data[i])}</td>
      <td class="num">${money(coll.data[i])}</td>
      <td class="num">${money(intr.data[i])}</td>
      <td class="num">${money(fees.data[i])}</td>
      <td class="num">${money(expense[i])}</td>
      <td class="num" style="color:${net[i] < 0 ? '#B32C2C' : 'inherit'}">${money(net[i])}</td></tr>`).join('');
  el('fpTableFoot').innerHTML = `<tr style="font-weight:800;border-top:2px solid var(--line)">
      <td>Total</td><td class="num">${money(sum(disb.data))}</td><td class="num">${money(sum(coll.data))}</td>
      <td class="num">${money(sum(intr.data))}</td><td class="num">${money(sum(fees.data))}</td>
      <td class="num">${money(sum(expense))}</td><td class="num">${money(sum(net))}</td></tr>`;
}
</script>
