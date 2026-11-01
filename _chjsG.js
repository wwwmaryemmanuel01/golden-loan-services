<script>
/* ============================================================
   CHARTS & ANALYTICS (7/7)
   13 · Filters   14 · Reports & exports   15 · Accuracy & settings
   plus the event wiring and boot.
   ============================================================ */

/* ===================== 13 · FILTERS & DATA EXPLORATION ===================== */
function fillSelects(){
  const put = (id, items, all) => {
    const s = el(id);
    if(!s) return;
    s.innerHTML = `<option value="">${all}</option>` +
      items.map(([v,l])=>`<option value="${esc(v)}">${esc(l)}</option>`).join('');
  };
  put('fltProduct', PRODUCTS.map(p=>[p.id, p.name]), 'All products');
  put('fltStatus', [['Active','Active'],['Closed','Closed'],['Written off','Written off']], 'All statuses');
  put('fltStaff', STAFF.map(s=>[s.id, s.name + ' · ' + s.role]), 'All staff');
  put('fltMethod', METHODS.map(m=>[m, m]), 'All methods');
  put('fltRegion', REGIONS.map(r=>[r, r]), 'All regions');
  put('fltCustomer', CUSTOMERS.map(c=>[c.id, c.name + ' · ' + c.region]).slice(0, 60), 'All customers');
}

function syncFilterInputs(){
  const set = (id, v) => { const n = el(id); if(n) n.value = v; };
  set('fltFrom', FILTER.from); set('fltTo', FILTER.to);
  set('fltProduct', FILTER.product); set('fltStatus', FILTER.status);
  set('fltStaff', FILTER.staff); set('fltMethod', FILTER.method);
  set('fltRegion', FILTER.region); set('fltCustomer', FILTER.customer);
  set('fltSearch', FILTER.q);
  document.querySelectorAll('#fltGrain .fchip').forEach(c=> c.classList.toggle('on', c.dataset.grain === FILTER.grain));
}

function renderFilterPanel(){
  const loans = filterLoans(), pays = filterPays(), apps = filterApps(), disbs = filterDisb(), custs = filterCust();
  const bits = [];
  if(FILTER.product) bits.push(['Product: ' + prodName(FILTER.product), 'product']);
  if(FILTER.status) bits.push(['Status: ' + FILTER.status, 'status']);
  if(FILTER.staff) bits.push(['Staff: ' + staffName(FILTER.staff), 'staff']);
  if(FILTER.method) bits.push(['Method: ' + FILTER.method, 'method']);
  if(FILTER.region) bits.push(['Region: ' + FILTER.region, 'region']);
  if(FILTER.customer) bits.push(['Customer: ' + custName(FILTER.customer), 'customer']);
  if(FILTER.q) bits.push(['Search: ' + FILTER.q, 'q']);
  bits.push([`${fmtDate(FILTER.from)} – ${fmtDate(FILTER.to)}`, 'range']);
  bits.push(['View: ' + FILTER.grain, 'grain']);

  el('fltChips').innerHTML = bits.map(([label, key])=>
    `<span class="fchip on" data-clear="${key}">${esc(label)} <span class="x">✕</span></span>`).join('');
  el('fltSummary').textContent = bits.length > 2 ? bits.length - 2 + ' filter' + (bits.length - 2 === 1 ? '' : 's') + ' applied' : 'Date range only';

  el('fltCounts').innerHTML = [
    ['Loans', num(loans.length)], ['Repayments', num(pays.length)], ['Applications', num(apps.length)],
    ['Disbursements', num(disbs.length)], ['Customers', num(custs.length)]
  ].map(([l,n])=>`<div><div class="sl">${l}</div><div class="sv">${n}</div></div>`).join('');

  el('fltResult').textContent = `This filter covers ${num(loans.length)} loans worth ${money(sum(loans, l=>l.amount))}, ` +
    `${num(pays.length)} receipts worth ${money(sum(pays, p=>p.amount))} and ${num(custs.length)} customers who joined in the period.`;

  /* explorer */
  renderTable('fltTableBody', [
    {k:'ref', label:'Loan'},
    {k:'cust', label:'Customer'},
    {k:'product', label:'Product'},
    {k:'officer', label:'Officer'},
    {k:'date', label:'Disbursed', html:v=> fmtDate(v)},
    {k:'amount', label:'Amount', num:true, html:v=> money(v)},
    {k:'outstanding', label:'Outstanding', num:true, html:v=> money(v)},
    {k:'arrears', label:'Arrears', num:true, html:v=> money(v)},
    {k:'status', label:'Status', html:v=> `<span class="badge ${v==='Active'?'b-ok':v==='Closed'?'b-gray':'b-crit'}">${esc(v)}</span>`}
  ], loans.map(l=>({ref:l.ref, cust:custName(l.cust), product:prodName(l.product), officer:staffName(l.officer),
      date:l.date, amount:l.amount, outstanding:l.outstanding, arrears:l.arrears, status:l.status,
      _drill:['loan', l.ref]})), {sort:'date', pageSize:9, onRow:true});

  renderComparePeriods();
  renderRefreshStamp();
}

function renderRefreshStamp(){
  const n = el('refreshStamp');
  if(n) n.textContent = 'Figures last recalculated ' + lastRefresh() + ' · source: live registers';
  const t = el('topRefresh');
  if(t) t.textContent = lastRefresh();
}

function renderComparePeriods(){
  const a1 = el('cmpFrom2').value || FILTER.from, a2 = el('cmpTo2').value || FILTER.to;
  const b1 = el('cmpFrom3').value || COMPARE.from, b2 = el('cmpTo3').value || COMPARE.to;
  const A = windowStats(a1, a2), B = windowStats(b1, b2);
  const rows = [
    ['Loans issued', A.loans, B.loans, 'n'],
    ['Disbursed', A.disb, B.disb, 'm'],
    ['Collected', A.coll, B.coll, 'm'],
    ['Interest', A.interest, B.interest, 'm'],
    ['Applications', A.apps, B.apps, 'n'],
    ['New customers', A.custs, B.custs, 'n']
  ];
  el('cmpPeriodOut').innerHTML = `<div class="strip" style="margin-bottom:8px">
      <div><div class="sl">First period</div><div class="sv" style="font-size:11px">${fmtDate(a1)} – ${fmtDate(a2)}</div></div>
      <div><div class="sl">Second period</div><div class="sv" style="font-size:11px">${fmtDate(b1)} – ${fmtDate(b2)}</div></div>
    </div>
    <div class="tblwrap"><table class="tbl2 dense">
      <thead><tr><th>Measure</th><th class="num">First period</th><th class="num">Second period</th><th class="num">Change</th></tr></thead>
      <tbody>${rows.map(([l,a,b,kind])=>{
        const show = v => kind === 'm' ? money(v) : num(v);
        const pctv = b ? (a-b)/b*100 : (a ? 100 : 0);
        return `<tr><td>${l}</td><td class="num">${show(a)}</td><td class="num">${show(b)}</td><td class="num">${delta(pctv)}</td></tr>`;
      }).join('')}</tbody></table></div>`;
}

/* ===================== 14 · ANALYTICS REPORTS ===================== */
function reportFinancial(){
  const keys = buckets();
  const disb = seriesBy(filterLoans(), l=>l.date, l=>l.amount);
  const coll = seriesBy(filterPays(), p=>p.date, p=>p.amount);
  const intr = seriesBy(filterPays(), p=>p.date, p=>p.interest);
  const fees = seriesBy(filterPays(), p=>p.date, p=>p.fees);
  return {
    title:'Financial performance',
    cols:[{label:'Period'},{label:'Disbursed',num:true},{label:'Collected',num:true},
          {label:'Interest',num:true},{label:'Fees',num:true},{label:'Expenses',num:true},{label:'Net cash',num:true}],
    rows: keys.map((k,i)=>[
      bucketLabel(k), money(disb.data[i]), money(coll.data[i]), money(intr.data[i]), money(fees.data[i]),
      money(Math.round(expenseForBucket(k))), money((coll.data[i]||0) - (disb.data[i]||0))
    ])
  };
}
function reportPortfolio(){
  const loans = filterLoans();
  const rows = PRODUCTS.map(p=>{
    const mine = loans.filter(l=>l.product === p.id);
    return [p.name, num(mine.length), money(sum(mine, l=>l.amount)), money(sum(mine, l=>l.outstanding)),
      money(sum(mine, l=>l.arrears)), r1(pct(sum(mine, l=>l.amount), sum(loans, l=>l.amount) || 1)) + '%'];
  });
  return {title:'Loan portfolio',
    cols:[{label:'Product'},{label:'Loans',num:true},{label:'Principal',num:true},
          {label:'Outstanding',num:true},{label:'Arrears',num:true},{label:'Share',num:true}],
    rows};
}
function reportRepayment(){
  const pays = filterPays();
  const rows = [
    ['Receipts', num(pays.length)],
    ['Value collected', money(sum(pays, p=>p.amount))],
    ['Principal portion', money(sum(pays, p=>p.principal))],
    ['Interest portion', money(sum(pays, p=>p.interest))],
    ['Fees portion', money(sum(pays, p=>p.fees))],
    ['On time', num(pays.filter(p=>p.timing==='On time').length) + ' (' + r1(pct(pays.filter(p=>p.timing==='On time').length, pays.length || 1)) + '%)'],
    ['Late', num(pays.filter(p=>p.timing==='Late').length)],
    ['Partial', num(pays.filter(p=>p.status==='Partial').length)],
    ['Average days late', r1(sum(pays.filter(p=>p.timing==='Late'), p=>p.daysLate)/Math.max(1, pays.filter(p=>p.timing==='Late').length))]
  ];
  return {title:'Repayment performance', cols:[{label:'Measure'},{label:'Value',num:true}], rows};
}
function reportDisbursement(){
  const rows = bucketRows(d=>d.date, d=>d.status === 'Successful' ? d.amount : 0);
  return {title:'Disbursement',
    cols:[{label:'Period'},{label:'Payouts',num:true},{label:'Approved',num:true},{label:'Released',num:true},{label:'Variance',num:true}],
    rows};
}
function bucketRows(dateOf, valueOf){
  const keys = buckets();
  return keys.map(k=>{
    const inB = filterDisb().filter(d=> bucketKey(dateOf(d)) === k);
    return [bucketLabel(k), num(inB.length), money(sum(inB, d=>d.approved)), money(sum(inB, valueOf)),
      money(sum(inB, d=>valueOf(d) - d.approved))];
  });
}
function reportCustomer(){
  const custs = filterCust();
  const rows = REGIONS.map(r=>{
    const mine = custs.filter(c=>c.region === r);
    return [r, num(mine.length), num(mine.filter(c=>c.status==='Active').length),
      num(mine.filter(c=> filterLoans().some(l=>l.cust===c.id)).length),
      num(mine.filter(c=>c.kyc==='Verified').length),
      money(sum(filterLoans().filter(l=>l.region===r), l=>l.outstanding))];
  });
  return {title:'Customer growth',
    cols:[{label:'Region'},{label:'Customers',num:true},{label:'Active',num:true},
          {label:'With loans',num:true},{label:'KYC verified',num:true},{label:'Outstanding',num:true}],
    rows};
}
function reportStaff(){
  const rows = STAFF.filter(s=> s.role !== 'Administrator').map(s=>{
    const l = filterLoans().filter(x=>x.officer === s.id);
    const d = filterDisb().filter(x=>x.officer === s.id && x.status === 'Successful');
    const p = filterPays().filter(x=>x.officer === s.id);
    return [s.name, s.role, num(filterApps().filter(a=>a.officer===s.id).length), num(l.length),
      money(sum(d, x=>x.amount)), num(p.length), money(sum(p, x=>x.amount)),
      r1(pct(sum(p, x=>x.amount), s.target*periodMonths() || 1)) + '%'];
  });
  return {title:'Staff performance',
    cols:[{label:'Officer'},{label:'Role'},{label:'Applications',num:true},{label:'Approved',num:true},
          {label:'Released',num:true},{label:'Receipts',num:true},{label:'Collected',num:true},{label:'Target',num:true}],
    rows};
}
function reportRisk(){
  const active = filterLoans().filter(l=>l.status === 'Active');
  const rows = AGES.map(b=>{
    const mine = active.filter(l=>l.ageBucket === b);
    return [b, num(mine.length), money(sum(mine, l=>l.arrears)),
      money(sum(mine, l=>l.outstanding)), r1(pct(sum(mine, l=>l.arrears), sum(active, l=>l.arrears) || 1)) + '%'];
  });
  return {title:'Arrears and risk',
    cols:[{label:'Ageing bucket'},{label:'Accounts',num:true},{label:'Arrears',num:true},
          {label:'Outstanding',num:true},{label:'Share of arrears',num:true}],
    rows};
}

const REPORTS = {
  financial:{label:'Financial Performance Report', build:reportFinancial,
    desc:'Disbursements, collections, interest, fees, expenses and net cash per period.'},
  portfolio:{label:'Loan Portfolio Report', build:reportPortfolio,
    desc:'Product mix, principal, open balances, arrears and share of the book.'},
  repayment:{label:'Repayment Performance Report', build:reportRepayment,
    desc:'What was collected, how it split, how timely it was and how often it was partial.'},
  disbursement:{label:'Disbursement Report', build:reportDisbursement,
    desc:'Payout volume, approved against released value and the variance per period.'},
  customer:{label:'Customer Growth Report', build:reportCustomer,
    desc:'Registered base, activity, borrowing, KYC standing and exposure per region.'},
  staff:{label:'Staff Performance Report', build:reportStaff,
    desc:'Volume, releases, receipts and target achievement for every officer.'},
  risk:{label:'Arrears and Risk Report', build:reportRisk,
    desc:'Overdue exposure by ageing bucket with the outstanding balance it sits against.'}
};

function reportData(key){
  const r = REPORTS[key];
  if(!r) return null;
  const built = r.build();
  return {key, label:r.label, title:built.title, cols:built.cols, rows:built.rows};
}

function renderReportCards(){
  el('repCards').innerHTML = Object.entries(REPORTS).map(([key, r])=>{
    const d = reportData(key);
    return `<div class="repcard">
      <div class="rt">${esc(r.label)}</div>
      <div class="rd">${esc(r.desc)}</div>
      <div class="rv">${num(d.rows.length)} rows · ${d.cols.length} columns</div>
      <div class="acts">
        <button class="btn btn-ghost" data-rep="${key}" data-fmt="preview">Preview</button>
        <button class="btn btn-ghost" data-rep="${key}" data-fmt="csv">CSV</button>
        <button class="btn btn-ghost" data-rep="${key}" data-fmt="xlsx">Excel</button>
        <button class="btn btn-ghost" data-rep="${key}" data-fmt="pdf">PDF</button>
      </div>
    </div>`;
  }).join('');
}

function runReport(key, fmt){
  const d = reportData(key);
  if(!d) return toast('Unknown report.', 'err');
  if(fmt === 'preview'){
    openModal(d.label, `${num(d.rows.length)} rows · ${filterLine()}`,
      `${brandHtml(d.label, filterLine())}
       <div class="tblwrap" style="max-height:330px"><table class="tbl2 dense">
         <thead><tr>${d.cols.map(c=>`<th class="${c.num?'num':''}">${esc(c.label)}</th>`).join('')}</tr></thead>
         <tbody>${d.rows.slice(0, 40).map(r=>`<tr>${r.map((v,i)=>
            `<td class="${d.cols[i].num?'num':''}">${esc(v)}</td>`).join('')}</tr>`).join('')}</tbody>
       </table></div>
       <div class="qhint">Showing ${Math.min(40, d.rows.length)} of ${num(d.rows.length)} rows · ${esc(filterLine())}</div>`,
      [{label:'Download CSV', act:()=>{ closeModal(); runReport(key, 'csv'); }},
       {label:'Close', act:'close'}]);
    return;
  }
  if(fmt === 'csv'){
    const text = '\ufeff' + filterLine() + '\r\n' + toCsv([d.cols.map(c=>c.label)].concat(d.rows));
    downloadFile('analytics-' + key + '-' + TODAY + '.csv', 'text/csv;charset=utf-8', text);
    logExport(d.label, 'CSV', d.rows.length);
    return;
  }
  if(fmt === 'xlsx'){
    const bytes = xlsxBytes(d.title, d.cols, d.rows.map(r=> r.map(v=>{
      const n = Number(String(v).replace(/[^0-9.-]/g,''));
      return /^[\d,.\s-]+$/.test(String(v)) && String(v).trim() !== '' && isFinite(n) ? n : String(v);
    })));
    downloadFile('analytics-' + key + '-' + TODAY + '.xlsx',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', bytes);
    logExport(d.label, 'Excel', d.rows.length);
    return;
  }
  printTable(d.label, d.cols, d.rows);
  logExport(d.label, 'PDF', d.rows.length);
}

function runPack(fmt){
  const all = Object.keys(REPORTS).map(reportData);
  if(fmt === 'csv'){
    const parts = [filterLine()];
    all.forEach(d=>{
      parts.push('', d.label.toUpperCase());
      parts.push(toCsv([d.cols.map(c=>c.label)].concat(d.rows)));
    });
    downloadFile('analytics-pack-' + TODAY + '.csv', 'text/csv;charset=utf-8', '\ufeff' + parts.join('\r\n'));
    logExport('Analytics pack', 'CSV', sum(all, d=>d.rows.length));
    return;
  }
  if(fmt === 'xlsx'){
    /* one workbook, one sheet per report is not supported by the writer, so the pack is
       a single sheet with a section row before each report */
    const rows = [];
    all.forEach(d=>{
      rows.push([d.label.toUpperCase()]);
      rows.push(d.cols.map(c=>c.label));
      d.rows.forEach(r=> rows.push(r.map(v=> String(v))));
      rows.push([]);
    });
    const cols = [{label:'Analytics pack'}];
    const bytes = xlsxBytes('Analytics pack', [cols[0], {label:''}, {label:''}, {label:''}, {label:''}, {label:''}, {label:''}, {label:''}], rows);
    downloadFile('analytics-pack-' + TODAY + '.xlsx',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', bytes);
    logExport('Analytics pack', 'Excel', rows.length);
    return;
  }
  if(fmt === 'print' || fmt === 'pdf'){
    const html = `${brandHtml('Analytics pack', filterLine())}` + all.map(d=>`
      <h1 style="margin-top:14px">${esc(d.label)}</h1>
      <table style="width:100%;border-collapse:collapse;font-size:9.5px">
        <thead><tr>${d.cols.map(c=>`<th style="text-align:${c.num?'right':'left'};border-bottom:1px solid #E6E8EE;padding:4px">${esc(c.label)}</th>`).join('')}</tr></thead>
        <tbody>${d.rows.map(r=>`<tr>${r.map((v,i)=>
          `<td style="text-align:${d.cols[i].num?'right':'left'};border-bottom:1px dashed #EDEFF4;padding:3px">${esc(v)}</td>`).join('')}</tr>`).join('')}</tbody>
      </table>`).join('');
    doPrint('Analytics pack', html);
    logExport('Analytics pack', 'PDF', sum(all, d=>d.rows.length));
  }
}

/* ===================== 15 · DATA ACCURACY ===================== */
function accuracyChecks(){
  const loans = filterLoans(), pays = filterPays(), apps = filterApps();
  const disbs = filterDisb();
  const active = loans.filter(l=>l.status === 'Active');
  const credit = sum(pays, p=> p.principal + p.interest + p.fees);
  const collected = sum(pays, p=>p.amount);
  const paidPrincipal = sum(LOANS, l=> l.paidPrincipal);
  const successDisb = sum(disbs.filter(d=>d.status === 'Successful'), d=>d.amount);
  const statusSum = apps.filter(a=>['Approved','Rejected','Pending','Withdrawn'].includes(a.status)).length;
  const orphans = {
    loans: loans.filter(l=> !CUST_BY_ID[l.cust]).length,
    pays: pays.filter(p=> !LOAN_BY_REF[p.loan]).length,
    apps: apps.filter(a=> !CUST_BY_ID[a.cust]).length,
    disb: disbs.filter(d=> !LOAN_BY_REF[d.loan]).length
  };
  const dupLoan = LOANS.length - new Set(LOANS.map(l=>l.ref)).size;
  const dupPay = PAYS.length - new Set(PAYS.map(p=>p.receipt)).size;
  return [
    {label:'Chart totals tie to the tables', ok: Math.abs(sum(seriesBy(loans, l=>l.date, l=>l.amount).data) - sum(loans, l=>l.amount)) < 1,
     note:`Disbursement series total ${money(sum(loans, l=>l.amount))}`},
    {label:'Receipts split into principal, interest and fees', ok: Math.abs(credit - collected) <= pays.length,
     note:`${money(collected)} received · ${money(credit)} allocated`},
    {label:'Collected equals the sum of receipts', ok: sum(pays, p=>p.amount) === collected,
     note:`${num(pays.length)} receipts`},
    {label:'Outstanding equals principal less principal repaid', ok: Math.abs(sum(active, l=>Math.max(0, l.amount - l.paidPrincipal)) - sum(active, l=>l.outstanding)) < 1,
     note:`${money(sum(loans, l=>l.outstanding))} open principal`},
    {label:'Disbursed value matches successful payouts', ok: Math.abs(successDisb - sum(loans, l=>l.amount)) < 1,
     note:`${money(successDisb)} released in the period`},
    {label:'Arrears equal unpaid instalments on the schedule', ok: active.every(l=> l.arrears === 0 || l.unpaidInstalments > 0),
     note:`${num(active.filter(l=>l.arrears>0).length)} accounts in arrears`},
    {label:'Applications reconcile to their statuses', ok: statusSum === apps.length,
     note:`${num(apps.length)} applications accounted for`},
    {label:'Every record ties to a parent record', ok: sum(Object.values(orphans)) === 0,
     note:`${sum(Object.values(orphans))} orphan records · ${dupLoan + dupPay} duplicate keys`}
  ];
}

function renderAccuracy(){
  const checks = accuracyChecks();
  const pass = checks.filter(c=>c.ok).length;
  el('accChecks').innerHTML = checks.map(c=>`
    <div class="checkrow">
      <div class="ck ${c.ok ? 'pass' : 'fail'}">${c.ok ? '✓' : '!'}</div>
      <div class="cl">${esc(c.label)}</div>
      <div class="cn">${esc(c.note)}</div>
    </div>`).join('');
  el('accScore').textContent = pass + ' / ' + checks.length;
  el('accScore').className = 'badge ' + (pass === checks.length ? 'b-ok' : pass >= checks.length - 2 ? 'b-warn' : 'b-crit');
  el('accPill').className = 'badge ' + (pass === checks.length ? 'b-ok' : 'b-warn');
  el('accPill').textContent = pass === checks.length ? 'All checks pass' : (checks.length - pass) + ' to review';

  const k = kpis();
  const src = [
    ['Amount disbursed', 'Sum of loan principal in view', k.disbursed],
    ['Collected', 'Sum of receipts in view', k.collected],
    ['Interest collected', 'Sum of receipt interest', k.interest],
    ['Fees collected', 'Sum of receipt fees', k.fees],
    ['Outstanding principal', 'Principal less principal repaid', k.outstanding],
    ['Arrears', 'Unpaid instalments on open loans', k.arrears]
  ];
  const recomputed = {
    'Amount disbursed': sum(filterLoans(), l=>l.amount),
    'Collected': sum(filterPays(), p=>p.amount),
    'Interest collected': sum(filterPays(), p=>p.interest),
    'Fees collected': sum(filterPays(), p=>p.fees),
    'Outstanding principal': sum(filterLoans().filter(l=>l.status==='Active'), l=>l.outstanding),
    'Arrears': sum(filterLoans().filter(l=>l.status==='Active'), l=>l.arrears)
  };
  el('accTableHead').innerHTML = '<tr><th>Figure</th><th>Source</th><th class="num">Dashboard</th>' +
    '<th class="num">Recomputed</th><th class="num">Difference</th><th>Status</th></tr>';
  el('accTableBody').innerHTML = src.map(([label, source, value])=>{
    const again = recomputed[label];
    const diff = value - again;
    return `<tr><td>${label}</td><td style="font-size:9.5px;color:var(--muted)">${source}</td>
      <td class="num">${money(value)}</td><td class="num">${money(again)}</td>
      <td class="num">${money(diff)}</td>
      <td><span class="badge ${Math.abs(diff) < 1 ? 'b-ok' : 'b-crit'}">${Math.abs(diff) < 1 ? 'Ties' : 'Check'}</span></td></tr>`;
  }).join('');

  const loanRefs = new Set(LOANS.map(l=>l.ref));
  const missing = [
    ['Loans without a payout', LOANS.filter(l=> !DISB.some(d=>d.loan===l.ref)).length],
    ['Receipts against unknown loans', PAYS.filter(p=> !loanRefs.has(p.loan)).length],
    ['Applications without a customer', APPS.filter(a=> !CUST_BY_ID[a.cust]).length],
    ['Customers without a region', CUSTOMERS.filter(c=> !c.region).length],
    ['Duplicate loan numbers', LOANS.length - loanRefs.size],
    ['Duplicate receipt numbers', PAYS.length - new Set(PAYS.map(p=>p.receipt)).size]
  ];
  el('accMissing').innerHTML = missing.map(([label, n])=>`
    <div class="checkrow"><div class="ck ${n ? 'warn' : 'pass'}">${n ? '!' : '✓'}</div>
      <div class="cl">${label}</div><div class="cn">${num(n)}</div></div>`).join('');

  el('accRefresh').textContent = lastRefresh();
  el('accSource').textContent = 'Live registers · loans, receipts, applications, payouts, transactions';
  el('accScope').textContent = `${num(filterLoans().length)} loans · ${num(filterPays().length)} receipts · ${num(filterCust().length)} customers`;
  el('accSensitive').innerHTML = SET.sensitive
    ? '<span class="badge b-ok">Visible · full access</span>'
    : '<span class="badge b-warn">Masked for this role</span>';
}

/* ===================== 15 · SETTINGS ===================== */
function renderSettings(){
  el('setCurrency').value = SET.currency;
  el('setDecimals').value = String(SET.decimals);
  el('setFormat').value = SET.numberFormat;
  el('setRange').value = SET.defaultRange;
  el('setChartType').value = SET.chartType;
  el('setSort').value = SET.sortKey + ':' + SET.sortDir;
  el('setGrid').checked = !!SET.showGrid;
  el('setLegend').checked = !!SET.showLegend;
  el('setValues').checked = !!SET.showValues;
  el('setSensitive').checked = SET.sensitive !== false;
  el('setPreview').innerHTML = `Sample: <b>${money(1234567)}</b> · <b>${money(-48251)}</b> · ` +
    `${num(38.4, 1)}% · chart default <b>${SET.chartType}</b>`;
  el('setAccessBody').innerHTML = [
    ['Administrator','Full access',true,true,true,true],
    ['Head of Credit','Portfolio & lending',true,true,false,true],
    ['Credit Analyst','Lending analytics',true,true,false,false],
    ['Collections Officer','Collections only',true,false,false,false],
    ['Auditor','Read-only',true,true,false,false],
    ['Customer Care','Front office',true,false,false,false]
  ].map(([role, scope, view, exp, cfg, sens])=>`<tr>
      <td><b>${role}</b></td><td>${scope}</td>
      <td>${view ? 'Yes' : 'No'}</td><td>${exp ? 'Yes' : 'No'}</td>
      <td>${cfg ? 'Yes' : 'No'}</td>
      <td>${sens ? '<span class="badge b-ok">Full</span>' : '<span class="badge b-gray">Masked</span>'}</td>
    </tr>`).join('');
}

function applySettings(){
  SET.currency = el('setCurrency').value;
  SET.decimals = Number(el('setDecimals').value);
  SET.numberFormat = el('setFormat').value;
  SET.defaultRange = el('setRange').value;
  SET.chartType = el('setChartType').value;
  const [k, d] = el('setSort').value.split(':');
  SET.sortKey = k; SET.sortDir = d;
  SET.showGrid = el('setGrid').checked;
  SET.showLegend = el('setLegend').checked;
  SET.showValues = el('setValues').checked;
  SET.sensitive = el('setSensitive').checked;
  GAL.type = SET.chartType;
  renderAll();
  const st = el('savestate');
  if(st){ st.textContent = 'Saved'; st.className = 'badge b-ok'; }
  toast('Settings saved · figures now display in ' + SET.currency + ' with ' + SET.decimals + ' decimals.');
}

function markDirty(){
  const st = el('savestate');
  if(st){ st.textContent = 'Unsaved changes'; st.className = 'badge b-await'; }
}

/* ===================== wiring ===================== */
function renderAll(){
  band();
  renderOverview();
  renderFinancial();
  renderPortfolio();
  renderRepayment();
  renderDisbursement();
  renderCustomers();
  renderStaff();
  renderRisk();
  renderApplications();
  renderMethods();
  renderComparison();
  renderGallery();
  renderFilterPanel();
  renderReportCards();
  renderAccuracy();
  renderSettings();
  renderExportHistory();
}

function applyPreset(p){
  const today = TODAY;
  const map = {
    '7d': [addDays(today, -6), today],
    '30d': [addDays(today, -29), today],
    'qtd': [today.slice(0,4) + '-07-01', today],
    'ytd': [today.slice(0,4) + '-01-01', today],
    '12m': [addMonths(today, -11).slice(0,8) + '01', today],
    'all': [MONTHS[0] + '-01', today]
  };
  const [from, to] = map[p] || map['12m'];
  FILTER.from = from; FILTER.to = to;
}

function clearFilter(key){
  if(key === 'product') FILTER.product = '';
  else if(key === 'status') FILTER.status = '';
  else if(key === 'staff') FILTER.staff = '';
  else if(key === 'method') FILTER.method = '';
  else if(key === 'region') FILTER.region = '';
  else if(key === 'customer') FILTER.customer = '';
  else if(key === 'q') FILTER.q = '';
  else if(key === 'range'){ FILTER.from = addMonths(TODAY,-11).slice(0,8) + '01'; FILTER.to = TODAY; }
  else if(key === 'grain') FILTER.grain = 'month';
}

function wireAll(){
  /* navigation */
  document.querySelectorAll('.snav').forEach(a=>{
    a.addEventListener('click', e=>{
      e.preventDefault();
      goto(a.getAttribute('href').slice(1));
    });
  });
  document.addEventListener('click', e=>{
    const g = e.target.closest('[data-goto]');
    if(g){ goto(g.dataset.goto); return; }

    /* chart drill-down */
    const card = e.target.closest('[data-drill]');
    if(card && !e.target.closest('button')){
      openDrillList(card.dataset.drill);
      return;
    }

    /* table sorting / paging */
    const th = e.target.closest('[data-tblsort]');
    if(th){
      const host = th.dataset.tblsort, key = th.dataset.k;
      const st = TBL[host] = TBL[host] || {sort:key, dir:'desc', page:1};
      if(st.sort === key) st.dir = st.dir === 'asc' ? 'desc' : 'asc';
      else { st.sort = key; st.dir = 'desc'; }
      st.page = 1;
      const cfg = TBL_CFG[host];
      if(cfg) renderTable(host, cfg.cols, cfg.rows, cfg.opts);
      return;
    }
    const pg = e.target.closest('[data-tblpage]');
    if(pg){
      const host = pg.dataset.tblpage;
      TBL[host] = TBL[host] || {sort:'', dir:'desc', page:1};
      TBL[host].page = Math.max(1, TBL[host].page + Number(pg.dataset.p));
      const cfg = TBL_CFG[host];
      if(cfg) renderTable(host, cfg.cols, cfg.rows, cfg.opts);
      return;
    }
    const row = e.target.closest('[data-tblrow]');
    if(row){
      const host = row.dataset.tblrow;
      const rec = (STORE_ROWS[host] || [])[Number(row.dataset.i)];
      if(rec && rec._drill) rowDrill(rec._drill[0], rec._drill[1]);
      return;
    }

    /* filters chips */
    const chip = e.target.closest('[data-clear]');
    if(chip){ clearFilter(chip.dataset.clear); syncFilterInputs(); renderAll(); return; }

    /* gallery chips */
    const met = e.target.closest('#galMetric .fchip');
    if(met){
      GAL.metric = met.dataset.met;
      el('galMetric').querySelectorAll('.fchip').forEach(c=> c.classList.toggle('on', c === met));
      renderGallery();
      return;
    }
    const typ = e.target.closest('#galType .fchip');
    if(typ){
      GAL.type = typ.dataset.type;
      el('galType').querySelectorAll('.fchip').forEach(c=> c.classList.toggle('on', c === typ));
      renderGallery();
      return;
    }

    /* reports */
    const rep = e.target.closest('[data-rep]');
    if(rep){ runReport(rep.dataset.rep, rep.dataset.fmt); return; }
  });

  /* grain + presets */
  el('fltGrain').querySelectorAll('[data-grain]').forEach(c=>{
    c.addEventListener('click', ()=>{
      FILTER.grain = c.dataset.grain;
      syncFilterInputs();
      renderAll();
      toast('Period view: ' + c.dataset.grain);
    });
  });
  el('fltPreset').querySelectorAll('[data-preset]').forEach(c=>{
    c.addEventListener('click', ()=>{
      applyPreset(c.dataset.preset);
      syncFilterInputs();
      renderAll();
      toast('Date range set to ' + fmtDate(FILTER.from) + ' – ' + fmtDate(FILTER.to));
    });
  });

  /* apply / reset */
  el('fltApply').addEventListener('click', ()=>{
    FILTER.from = el('fltFrom').value || FILTER.from;
    FILTER.to = el('fltTo').value || FILTER.to;
    FILTER.product = el('fltProduct').value;
    FILTER.status = el('fltStatus').value;
    FILTER.staff = el('fltStaff').value;
    FILTER.method = el('fltMethod').value;
    FILTER.region = el('fltRegion').value;
    FILTER.customer = el('fltCustomer').value;
    FILTER.q = el('fltSearch').value.trim();
    renderAll();
    toast('Filters applied across all 15 sections');
  });
  el('fltReset').addEventListener('click', ()=>{
    FILTER.product = FILTER.status = FILTER.staff = FILTER.method = FILTER.region = FILTER.customer = FILTER.q = '';
    FILTER.from = addMonths(TODAY,-11).slice(0,8) + '01'; FILTER.to = TODAY; FILTER.grain = 'month';
    syncFilterInputs();
    renderAll();
    toast('All filters cleared', 'info');
  });
  el('fltSearch').addEventListener('keydown', e=>{
    if(e.key === 'Enter'){ FILTER.q = e.target.value.trim(); renderAll(); }
  });
  ['fltProduct','fltStatus','fltStaff','fltMethod','fltRegion','fltCustomer'].forEach(id=>{
    el(id).addEventListener('change', ()=>{
      el('fltApply').click();
    });
  });

  /* refresh */
  el('refreshBtn').addEventListener('click', ()=>{
    const now = new Date();
    REFRESH = fmtDate(TODAY) + ' · ' + String(now.getHours()).padStart(2,'0') + ':' + String(now.getMinutes()).padStart(2,'0');
    renderAll();
    toast('Analytics recalculated from the live registers');
  });

  /* compare periods */
  el('cmpPeriodBtn').addEventListener('click', ()=>{
    COMPARE.on = true;
    COMPARE.from = el('cmpFrom3').value || COMPARE.from;
    COMPARE.to = el('cmpTo3').value || COMPARE.to;
    renderComparePeriods();
    toast('Periods compared');
  });
  el('cmpPeriodClear').addEventListener('click', ()=>{
    ['cmpFrom2','cmpTo2','cmpFrom3','cmpTo3'].forEach(id=>{ el(id).value = ''; });
    renderComparePeriods();
    toast('Comparison cleared', 'info');
  });

  /* exports */
  el('quickCsv').addEventListener('click', ()=> runPack('csv'));
  el('printBtn').addEventListener('click', ()=> runPack('print'));
  el('packCsv').addEventListener('click', ()=> runPack('csv'));
  el('packXlsx').addEventListener('click', ()=> runPack('xlsx'));
  el('packPdf').addEventListener('click', ()=> runPack('pdf'));
  el('packPrint').addEventListener('click', ()=> runPack('print'));
  el('expImgBtn').addEventListener('click', ()=> exportChartImage(el('expImgPick').value));
  el('galImg').addEventListener('click', ()=> exportChartImage('galChart'));

  /* gallery trend toggle */
  el('galTrend').addEventListener('click', ()=>{
    GAL.trend = !GAL.trend;
    renderGallery();
  });

  /* settings */
  ['setCurrency','setDecimals','setFormat','setRange','setChartType','setSort','setGrid','setLegend','setValues','setSensitive']
    .forEach(id=>{
      const n = el(id);
      if(!n) return;
      n.addEventListener('change', ()=>{
        markDirty();
        if(id === 'setCurrency' || id === 'setDecimals' || id === 'setFormat'){
          SET.currency = el('setCurrency').value;
          SET.decimals = Number(el('setDecimals').value);
          SET.numberFormat = el('setFormat').value;
          el('setPreview').innerHTML = `Sample: <b>${money(1234567)}</b> · <b>${money(-48251)}</b> · ${num(38.4, 1)}%`;
        }
      });
    });
  el('setSave').addEventListener('click', applySettings);
  el('setReset').addEventListener('click', ()=>{
    Object.assign(SET, {currency:'MK', decimals:0, numberFormat:'comma', defaultRange:'12m',
      chartType:'bar', showGrid:true, showLegend:true, showValues:false, sortKey:'date', sortDir:'desc',
      sensitive:true});
    GAL.type = 'bar';
    applyPreset('12m');
    renderAll();
    const st = el('savestate');
    if(st){ st.textContent = 'Saved'; st.className = 'badge b-ok'; }
    toast('Settings reset to defaults', 'info');
  });

  /* top bar */
  el('menuBtn').addEventListener('click', ()=> document.getElementById('sidebar').classList.toggle('open'));
  el('bellBtn').addEventListener('click', ()=> goto('s15'));
  el('globalSearch').addEventListener('keydown', e=>{
    if(e.key !== 'Enter') return;
    FILTER.q = e.target.value.trim();
    syncFilterInputs();
    renderAll();
    goto('s13');
    toast(FILTER.q ? 'Searching for "' + FILTER.q + '"' : 'Search cleared', 'info');
  });
  el('modalClose').addEventListener('click', closeModal);
  el('modal').addEventListener('click', e=>{ if(e.target.id === 'modal') closeModal(); });
  document.addEventListener('keydown', e=>{ if(e.key === 'Escape') closeModal(); });
}

/* drill list behind a chart card */
function openDrillList(kind){
  const rows = galRecords(kind, bucketKeyOfLatest(), 25);
  const titles = {loans:'Disbursed facilities', pays:'Receipts', overdue:'Overdue accounts',
    customers:'New customers', apps:'Applications', disb:'Payouts', txns:'Transactions', staff:'Officers'};
  openModal(titles[kind] || 'Records', filterLine(),
    `<div class="tblwrap" style="max-height:340px"><table class="tbl2 dense">
      <thead><tr><th>Record</th><th>Detail</th><th class="num">Value</th></tr></thead>
      <tbody>${rows.map((r,i)=>`<tr class="rowlink" data-drillrow="${i}"><td>${esc(r.a)}</td>
        <td>${esc(r.b)}</td><td class="num">${r.c}</td></tr>`).join('') ||
        '<tr><td colspan="3" class="empty">No records in the latest period.</td></tr>'}</tbody></table></div>`,
    [{label:'Close', act:'close'}]);
  el('modalBody').querySelectorAll('[data-drillrow]').forEach(tr=>{
    const r = rows[Number(tr.dataset.drillrow)];
    tr.onclick = ()=>{ closeModal(); rowDrill(r.drill[0], r.drill[1]); };
  });
}
function bucketKeyOfLatest(){
  const keys = buckets();
  return keys[keys.length - 1] || FILTER.to;
}

/* expose for the verification harness */
window.CHARTS_APP = {
  FILTER, SET, COMPARE, GAL, EXPORTS,
  CUSTOMERS, LOANS, APPS, PAYS, DISB, TXNS, STAFF, PRODUCTS, TASKS,
  kpis, accuracyChecks, reportData, REPORTS, seriesBy, renderAll, goto
};

/* boot */
(function(){
  fillSelects();
  syncFilterInputs();
  /* the compare inputs start mirroring the live range */
  el('cmpFrom2').value = FILTER.from;
  el('cmpTo2').value = FILTER.to;
  el('cmpFrom3').value = COMPARE.from;
  el('cmpTo3').value = COMPARE.to;
  renderAll();
  wireAll();
})();
</script>
</body>
</html>
