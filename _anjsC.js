<script>
/* ============================================================
   GRAPHING & TABULATION (3/5)
   Sections 6 (staff performance), 7 (disbursements),
   8 (tabular registers).
   ============================================================ */

function periodMonths(){
  const d = Math.max(1, daysBetween(FILTER.from, FILTER.to));
  return Math.max(0.2, d/30.4);
}

/* ===================== 6 · STAFF PERFORMANCE ===================== */
const TASKS = [
  {id:'TSK-1041', staff:'STF-005', title:'Chase 12 accounts over 60 days', due:'2026-11-02', status:'Open', priority:'High'},
  {id:'TSK-1042', staff:'STF-006', title:'Verify bank deposits for week 43', due:'2026-10-31', status:'Open', priority:'Medium'},
  {id:'TSK-1043', staff:'STF-001', title:'Site visit — Zomba trading group', due:'2026-11-04', status:'Open', priority:'Medium'},
  {id:'TSK-1044', staff:'STF-003', title:'Approve the pending credit queue', due:'2026-10-30', status:'Open', priority:'High'},
  {id:'TSK-1045', staff:'STF-002', title:'Collect ID copies for three applications', due:'2026-11-06', status:'Open', priority:'Low'},
  {id:'TSK-1046', staff:'STF-004', title:'Re-appraise two restructured facilities', due:'2026-11-03', status:'Open', priority:'Medium'},
  {id:'TSK-1047', staff:'STF-007', title:'Reconcile the cashbook to the bank', due:'2026-10-30', status:'Open', priority:'High'},
  {id:'TSK-1048', staff:'STF-008', title:'Follow up on KYC pending file', due:'2026-11-05', status:'Open', priority:'Low'},
  {id:'TSK-1049', staff:'STF-005', title:'Prepare the weekly arrears report', due:'2026-10-29', status:'Done', priority:'Medium'},
  {id:'TSK-1050', staff:'STF-006', title:'Call customers in the 31–60 bucket', due:'2026-10-28', status:'Done', priority:'Medium'}
];

function staffMetrics(){
  const apps = filterApps(), loans = filterLoans(), disb = filterDisb(), pays = filterPays();
  const pm = periodMonths();
  return STAFF.filter(s=>s.role !== 'Administrator').map(s=>{
    const a = apps.filter(x=>x.officer===s.id);
    const l = loans.filter(x=>x.officer===s.id);
    const d = disb.filter(x=>x.officer===s.id);
    const p = pays.filter(x=>x.officer===s.id);
    const collected = sum(p,x=>x.amount);
    const onTime = p.filter(x=>x.timing==='On time').length;
    return {s, apps:a.length, approved:l.length, disb:d.length, disbVal:sum(d,x=>x.amount),
      pays:p.length, collected, onTime: p.length ? Math.round(onTime/p.length*100) : 0,
      tasks: TASKS.filter(t=>t.staff===s.id && t.status==='Open').length,
      target: s.target*pm, achievement: s.target ? Math.round(collected/(s.target*pm)*100) : 0};
  });
}

function renderStaff(){
  const m = staffMetrics();
  const maxApps = Math.max(1, ...m.map(x=>x.apps));
  el('sfKpis').innerHTML = [
    ['Applications processed', num(sum(m,x=>x.apps)), 'Across the lending team', ''],
    ['Loans approved', num(sum(m,x=>x.approved)), money(sum(m,x=>x.disbVal)), 'gold'],
    ['Disbursements processed', num(sum(m,x=>x.disb)), money(sum(m,x=>x.disbVal)), ''],
    ['Repayments recorded', num(sum(m,x=>x.pays)), money(sum(m,x=>x.collected)), ''],
    ['Open tasks', num(TASKS.filter(t=>t.status==='Open').length), TASKS.filter(t=>t.status==='Open').length + ' assigned', 'red'],
    ['On-time collections', r1(pct(filterPays().filter(p=>p.timing==='On time').length, filterPays().length)) + '%', 'Share of receipts paid on time', '']
  ].map(([l,v,s,kk])=>kpiCard(l,v,s,kk)).join('');

  el('sfGrid').innerHTML = [
    chartCard({title:'Applications processed by staff', sub:'Applications captured in the period', value:num(sum(m,x=>x.apps)),
      chart: chart({type:'bar', cats:m.map(x=>x.s.name.split(' ')[0]), series:[{name:'Applications', data:m.map(x=>x.apps), colour:'#2F6FED'}], h:200})}),
    chartCard({title:'Loans approved by staff', sub:'Facilities approved per officer', value:num(sum(m,x=>x.approved)),
      chart: chart({type:'bar', cats:m.map(x=>x.s.name.split(' ')[0]), series:[{name:'Approved', data:m.map(x=>x.approved), colour:'#1E9E6A'}], h:200})}),
    chartCard({title:'Disbursements processed by staff', sub:'Value released per officer', value:money(sum(m,x=>x.disbVal)),
      chart: chart({type:'bar', cats:m.map(x=>x.s.name.split(' ')[0]), series:[{name:'Disbursed', data:m.map(x=>x.disbVal), colour:'#C9A227'}], h:200})}),
    chartCard({title:'Repayments recorded by staff', sub:'Receipts captured at the counter', value:num(sum(m,x=>x.pays)),
      chart: chart({type:'bar', cats:m.map(x=>x.s.name.split(' ')[0]), series:[{name:'Receipts', data:m.map(x=>x.pays), colour:'#7C5CF0'}], h:200})}),
    chartCard({title:'Collections by officer', sub:'Cash collected per officer', value:money(sum(m,x=>x.collected)),
      chart: chart({type:'bar', cats:m.map(x=>x.s.name.split(' ')[0]), series:[{name:'Collected', data:m.map(x=>x.collected), colour:'#0E9AA7'}], h:200})}),
    chartCard({title:'Staff productivity comparisons', sub:'Applications and approvals side by side', value:num(sum(m,x=>x.apps+x.approved)),
      chart: chart({type:'stacked', cats:m.map(x=>x.s.name.split(' ')[0]), series:[
        {name:'Applications', data:m.map(x=>x.apps), colour:'#2F6FED'},
        {name:'Approved', data:m.map(x=>x.approved), colour:'#1E9E6A'}], h:200})}),
    chartCard({title:'Collection success rates', sub:'On-time share of receipts handled', value:r1(sum(m,x=>x.onTime)/Math.max(1,m.length))+'%',
      chart: chart({type:'bar', cats:m.map(x=>x.s.name.split(' ')[0]), series:[{name:'On-time %', data:m.map(x=>x.onTime), colour:'#E08C1E'}], h:200})}),
    chartCard({title:'Target achievement', sub:'Collected against the monthly target', value:r1(sum(m,x=>x.achievement)/Math.max(1,m.length))+'%',
      chart: chart({type:'bar', cats:m.map(x=>x.s.name.split(' ')[0]), series:[{name:'Achievement %', data:m.map(x=>x.achievement), colour:'#C9A227'}], h:200})})
  ].join('');

  el('sfTableHead').innerHTML = '<tr><th>Staff member</th><th>Role</th><th class="num">Applications</th><th class="num">Approved</th>' +
    '<th class="num">Disbursed</th><th class="num">Repayments</th><th class="num">Collected</th><th class="num">On time</th>' +
    '<th class="num">Tasks</th><th class="num">Target</th></tr>';
  el('sfTableBody').innerHTML = m.map(x=>`
    <tr><td><div style="font-weight:700">${esc(x.s.name)}</div><div style="font-size:9px;color:var(--muted)">${x.s.branch}</div></td>
      <td>${esc(x.s.role)}</td><td class="num">${num(x.apps)}</td><td class="num">${num(x.approved)}</td>
      <td class="num">${money(x.disbVal)}</td><td class="num">${num(x.pays)}</td><td class="num">${money(x.collected)}</td>
      <td class="num">${x.onTime}%</td><td class="num">${x.tasks}</td>
      <td class="num" style="color:${x.achievement>=100?'#157A50':x.achievement>=70?'inherit':'#B32C2C'}">${x.achievement}%</td></tr>`).join('') ||
    '<tr><td colspan="10" class="empty">No staff activity in this period.</td></tr>';

  el('sfTaskCount').textContent = TASKS.filter(t=>t.status==='Open').length;
  el('sfTasks').innerHTML = TASKS.filter(t=>t.status==='Open').slice(0,7).map(t=>`
    <div class="lrow">
      <div class="lic" style="background:${t.priority==='High'?'var(--red-soft)':'var(--gold-soft)'};
        color:${t.priority==='High'?'#B32C2C':'var(--gold-dark)'};font-size:8px">${t.priority[0]}</div>
      <div style="flex:1;min-width:0"><div class="lt">${esc(t.title)}</div>
        <div class="ls">${esc((STAFF_BY_ID[t.staff]||{}).name||'')} · due ${fmtDate(t.due)} · ${t.id}</div></div>
      <div class="lr"><button class="btn btn-ghost" data-task="${t.id}">Done</button></div>
    </div>`).join('') || '<div class="empty">No outstanding tasks.</div>';
  el('sfTasks').querySelectorAll('[data-task]').forEach(b=>{
    b.onclick = ()=>{
      const t = TASKS.find(x=>x.id===b.dataset.task);
      if(!t) return;
      t.status = 'Done';
      renderStaff();
      toast(t.id + ' marked complete.');
    };
  });
}

/* ===================== 7 · DISBURSEMENT GRAPHS ===================== */
function renderDisbursement(){
  const disb = filterDisb();
  const ok = disb.filter(d=>d.status==='Successful');
  const failed = disb.filter(d=>d.status==='Failed');
  const reversed = disb.filter(d=>d.status==='Reversed');
  const monthly = seriesBy(ok, d=>d.date, d=>d.amount);
  const byMethod = METHODS.map(m=>({m, n:disb.filter(d=>d.method===m).length, amt:sum(disb.filter(d=>d.method===m),d=>d.amount)}));
  const byProduct = PRODUCTS.map(p=>({p, amt:sum(ok.filter(d=> (LOAN_BY_REF[d.loan]||{}).product===p.id), d=>d.amount)}));
  const byStaff = STAFF.map(s=>({s, n:disb.filter(d=>d.officer===s.id).length,
    amt:sum(disb.filter(d=>d.officer===s.id), d=>d.amount)})).filter(x=>x.n).sort((a,b)=>b.amt-a.amt);
  const daily = seriesDaily(disb);

  el('dbKpis').innerHTML = [
    ['Payouts in period', num(disb.length), `${num(ok.length)} successful`, 'gold'],
    ['Value disbursed', money(sum(ok,d=>d.amount)), 'Principal released', ''],
    ['Failed payouts', num(failed.length), money(sum(failed,d=>d.amount)) + ' not released', failed.length ? 'red' : ''],
    ['Reversed', num(reversed.length), money(sum(reversed,d=>d.amount)), reversed.length ? 'red' : ''],
    ['Average payout', money(ok.length ? sum(ok,d=>d.amount)/ok.length : 0), 'Per successful payout', ''],
    ['Success rate', r1(pct(ok.length, disb.length)) + '%', 'Of all payout attempts', '']
  ].map(([l,v,s,kk])=>kpiCard(l,v,s,kk)).join('');

  el('dbGrid').innerHTML = [
    chartCard({title:'Daily disbursement totals', sub:'Last 14 days of payout value', value:money(sum(daily.data)),
      chart: chart({type:'bar', cats:daily.cats, series:[{name:'Disbursed', data:daily.data, colour:'#C9A227'}], h:200})}),
    chartCard({title:'Monthly disbursement trends', sub:'Value released per period', value:money(sum(monthly.data)),
      chart: chart({type:'line', cats:monthly.cats, series:[{name:'Disbursed', data:monthly.data, colour:'#1E9E6A'}], h:200})}),
    chartCard({title:'Successful vs failed disbursements', sub:'Payout outcomes by period', value:r1(pct(ok.length,disb.length))+'% success',
      chart: chart({type:'stacked', cats:buckets().map(bucketLabel), series:[
        {name:'Successful', data:bucketCount(ok, d=>d.date), colour:'#1E9E6A'},
        {name:'Failed / reversed', data:bucketCount(failed.concat(reversed), d=>d.date), colour:'#D93F3F'}], h:200})}),
    chartCard({title:'Disbursements by payment method', sub:'How funds reach customers', value:num(disb.length)+' payouts',
      chart: chart({type:'donut', cats:byMethod.map(x=>x.m), series:[{data:byMethod.map(x=>x.amt)}],
        colours:['#C9A227','#1E9E6A','#2F6FED','#7C5CF0'], h:200})}),
    chartCard({title:'Disbursements by loan product', sub:'Value released per product', value:money(sum(byProduct,x=>x.amt)),
      chart: chart({type:'bar', cats:byProduct.map(x=>x.p.name), series:[{name:'Disbursed', data:byProduct.map(x=>x.amt), colour:'#2F6FED'}], h:200})}),
    chartCard({title:'Disbursements by staff member', sub:'Payouts processed per officer', value:num(disb.length),
      chart: chart({type:'bar', cats:byStaff.map(x=>x.s.name.split(' ')[0]), series:[{name:'Payouts', data:byStaff.map(x=>x.amt), colour:'#7C5CF0'}], h:200})}),
    chartCard({title:'Approved vs actually disbursed', sub:'Approved amount against value released', value:money(sum(disb,d=>d.amount)),
      chart: chart({type:'bar', cats:buckets().map(bucketLabel), series:[
        {name:'Approved', data:bucketSum(disb, d=>d.date, d=>d.approved), colour:'#8A90A0'},
        {name:'Disbursed', data:bucketSum(ok, d=>d.date, d=>d.amount), colour:'#C9A227'}], h:200})})
  ].join('');

  el('dbTableHead').innerHTML = '<tr><th>Period</th><th class="num">Approved</th><th class="num">Disbursed</th>' +
    '<th class="num">Variance</th><th class="num">Success rate</th></tr>';
  const cats = buckets();
  el('dbTableBody').innerHTML = cats.map((key,i)=>{
    const rows = disb.filter(d=> bucketKey(d.date) === key);
    const okRows = rows.filter(d=>d.status==='Successful');
    const appr = sum(rows,d=>d.approved), act = sum(okRows,d=>d.amount);
    return `<tr><td>${esc(bucketLabel(key))}</td><td class="num">${money(appr)}</td><td class="num">${money(act)}</td>
      <td class="num" style="color:${appr-act>0?'#B32C2C':'#157A50'}">${money(act-appr)}</td>
      <td class="num">${rows.length ? r1(pct(okRows.length, rows.length)) : 0}%</td></tr>`;
  }).join('') + `<tr style="font-weight:800;background:#FAFBFC"><td>Total</td>
    <td class="num">${money(sum(disb,d=>d.approved))}</td><td class="num">${money(sum(ok,d=>d.amount))}</td>
    <td class="num">${money(sum(ok,d=>d.amount)-sum(disb,d=>d.approved))}</td>
    <td class="num">${r1(pct(ok.length, disb.length))}%</td></tr>`;
}

/* daily series independent of the grain switch */
function seriesDaily(items){
  const cats = [], data = [];
  for(let i=13;i>=0;i--){
    const d = addDays(TODAY,-i);
    cats.push(fmtShort(d));
    data.push(sum(items.filter(x=> String(x.date).slice(0,10)===d), x=>x.amount));
  }
  return {cats, data};
}
function bucketCount(items, dateOf){
  const keys = buckets(); const idx = {}; keys.forEach(k=>idx[k]=0);
  items.forEach(it=>{ const k = bucketKey(dateOf(it)); if(k in idx) idx[k]++; });
  return keys.map(k=>idx[k]);
}
function bucketSum(items, dateOf, valOf){
  const keys = buckets(); const idx = {}; keys.forEach(k=>idx[k]=0);
  items.forEach(it=>{ const k = bucketKey(dateOf(it)); if(k in idx) idx[k] += Number(valOf(it))||0; });
  return keys.map(k=>idx[k]);
}

/* ===================== 8 · TABULAR DATA & REGISTERS ===================== */
const REG_COLS = {
  loans:[['ref','Loan'],['cust','Customer'],['product','Product'],['officer','Officer'],['date','Disbursed',0,1],['amount','Amount',1],['outstanding','Outstanding',1],['status','Status']],
  customers:[['id','Customer no.'],['name','Name'],['region','Region'],['joined','Joined',0,1],['phone','Phone'],['kyc','KYC'],['status','Status']],
  apps:[['ref','Application'],['cust','Customer'],['product','Product'],['submitted','Submitted',0,1],['amount','Amount',1],['officer','Officer'],['status','Status']],
  disb:[['ref','Disbursement'],['loan','Loan'],['date','Date',0,1],['amount','Amount',1],['method','Method'],['officer','Officer'],['status','Status']],
  pays:[['ref','Receipt'],['loan','Loan'],['date','Paid',0,1],['amount','Amount',1],['principal','Principal',1],['interest','Interest',1],['method','Method'],['timing','Timing']],
  arrears:[['ref','Loan'],['cust','Customer'],['outstanding','Outstanding',1],['arrears','Arrears',1],['dpd','Days late',1],['ageBucket','Aging']],
  collections:[['ref','Receipt'],['cust','Customer'],['officer','Officer'],['date','Date',0,1],['amount','Collected',1],['timing','Timing'],['status','Type']],
  staff:[['name','Staff'],['role','Role'],['apps','Applications',1],['approved','Approved',1],['disbVal','Disbursed',1],['collected','Collected',1],['onTime','On-time %',1]],
  txns:[['ref','Transaction'],['date','Date',0,1],['type','Type'],['loan','Loan'],['amount','Amount',1],['method','Method'],['status','Status']],
  audit:[['ts','When'],['user','User'],['action','Action'],['module','Module'],['record','Record'],['outcome','Outcome']]
};

const REG_TABS = [
  ['loans','Loan portfolio'],['customers','Customer register'],['apps','Loan applications'],
  ['disb','Disbursement register'],['pays','Repayment register'],['arrears','Arrears register'],
  ['collections','Collections register'],['staff','Staff performance'],['txns','Financial transactions'],
  ['audit','Audit events']
];
const REG = {key:'loans', page:1, per:12, q:'', sort:'', dir:-1};

function regRows(key){
  const q = REG.q.trim().toLowerCase();
  let rows;
  if(key === 'loans') rows = filterLoans().map(l=>({_id:l.ref, _kind:'loan', ref:l.ref,
    cust:(CUST_BY_ID[l.cust]||{}).name||'—', product:(PROD_BY_ID[l.product]||{}).name||'—',
    officer:(STAFF_BY_ID[l.officer]||{}).name||'—', date:l.date, amount:l.amount, outstanding:l.outstanding, status:l.status}));
  else if(key === 'customers') rows = filterCust().map(c=>({_id:c.id, _kind:'customer', id:c.id, name:c.name,
    region:c.region, joined:c.joined, phone:c.phone, kyc:c.kyc, status:c.status}));
  else if(key === 'apps') rows = filterApps().map(a=>({_id:a.ref, _kind:'app', ref:a.ref,
    cust:(CUST_BY_ID[a.cust]||{}).name||'—', product:(PROD_BY_ID[a.product]||{}).name||'—',
    submitted:a.submitted, amount:a.amount, officer:(STAFF_BY_ID[a.officer]||{}).name||'—', status:a.status}));
  else if(key === 'disb') rows = filterDisb().map(d=>({_id:d.ref, _kind:'disb', ref:d.ref, loan:d.loan,
    date:d.date, amount:d.amount, method:d.method, officer:(STAFF_BY_ID[d.officer]||{}).name||'—', status:d.status}));
  else if(key === 'pays') rows = filterPays().map(p=>({_id:p.ref, _kind:'pay', ref:p.ref, loan:p.loan,
    date:p.date, amount:p.amount, principal:p.principal, interest:p.interest, method:p.method, timing:p.timing}));
  else if(key === 'arrears') rows = filterLoans().filter(l=>l.arrears>0).map(l=>({_id:l.ref, _kind:'loan', ref:l.ref,
    cust:(CUST_BY_ID[l.cust]||{}).name||'—', outstanding:l.outstanding, arrears:l.arrears, dpd:l.dpd, ageBucket:l.ageBucket}));
  else if(key === 'collections') rows = filterPays().map(p=>({_id:p.ref, _kind:'pay', ref:p.ref,
    cust:(CUST_BY_ID[p.cust]||{}).name||'—', officer:(STAFF_BY_ID[p.officer]||{}).name||'—',
    date:p.date, amount:p.amount, timing:p.timing, status:p.status}));
  else if(key === 'staff') rows = staffMetrics().map(m=>({_id:m.s.id, _kind:'staff', name:m.s.name, role:m.s.role,
    apps:m.apps, approved:m.approved, disbVal:m.disbVal, collected:m.collected, onTime:m.onTime}));
  else if(key === 'txns') rows = TXNS.filter(t=> inRange(t.date)).map(t=>({_id:t.ref, _kind:'txn', ref:t.ref,
    date:t.date, type:t.type, loan:t.loan, amount:t.amount, method:t.method, status:t.status}));
  else rows = AUDITS.filter(a=> inRange(a.ts.slice(0,10))).map(a=>({_id:a.id, _kind:'audit', ts:a.ts,
    user:a.user, action:a.action, module:a.module, record:a.record, outcome:a.outcome}));
  if(q) rows = rows.filter(r=> JSON.stringify(r).toLowerCase().includes(q));
  if(REG.sort){
    const k = REG.sort;
    rows = rows.slice().sort((a,b)=>{
      const av = a[k], bv = b[k];
      const n = (typeof av === 'number' && typeof bv === 'number')
        ? av-bv : String(av).localeCompare(String(bv));
      return n * REG.dir;
    });
  }
  return rows;
}

function renderRegisters(){
  el('regTabs').innerHTML = REG_TABS.map(([k,l])=>
    `<button class="regtab ${REG.key===k?'on':''}" data-reg="${k}">${l}</button>`).join('');
  el('regTabs').querySelectorAll('[data-reg]').forEach(b=>{
    b.onclick = ()=>{ REG.key = b.dataset.reg; REG.page = 1; REG.sort = ''; renderRegisters(); };
  });
  const cols = REG_COLS[REG.key];
  const rows = regRows(REG.key);
  const pages = Math.max(1, Math.ceil(rows.length/REG.per));
  if(REG.page > pages) REG.page = pages;
  const slice = rows.slice((REG.page-1)*REG.per, REG.page*REG.per);
  el('regCount').textContent = num(rows.length) + ' records';
  el('regSub').textContent = (REG_TABS.find(t=>t[0]===REG.key)||[])[1] + ' · ' + rows.length + ' rows matching the current filters';

  el('regHead').innerHTML = '<tr>' + cols.map(([k,label,isNum])=>{
    const active = REG.sort === k;
    return `<th class="sortable ${isNum?'num':''}" data-sort="${k}">${label}${active?`<span class="ar">${REG.dir===1?'▲':'▼'}</span>`:''}</th>`;
  }).join('') + '</tr>';
  el('regHead').querySelectorAll('[data-sort]').forEach(th=>{
    th.onclick = ()=>{
      const k = th.dataset.sort;
      if(REG.sort === k) REG.dir = -REG.dir;
      else { REG.sort = k; REG.dir = 1; }
      renderRegisters();
    };
  });
  el('regBody').innerHTML = slice.map(r=>'<tr class="rowlink" data-row="'+r._id+'" data-kind="'+r._kind+'">' +
    cols.map(([k,,isNum])=>{
      let v = r[k];
      if(isNum){
        const moneyCol = ['amount','outstanding','arrears','disbVal','collected','principal','interest'].includes(k);
        return `<td class="num">${v===undefined?'—': moneyCol ? money(v) : num(v)}</td>`;
      }
      if(k === 'status' || k === 'timing' || k === 'outcome'){
        const tone = /Success|Full|On time|Verified|Active|Approved|Posted/.test(v) ? 'b-ok'
          : /Failed|Rejected|Late|Written|Inactive|Withdrawn/.test(v) ? 'b-rej' : 'b-await';
        return `<td><span class="badge ${tone}">${esc(v)}</span></td>`;
      }
      if(k === 'ref' || k === 'loan' || k === 'id' || k === 'record') return `<td class="mono" style="font-size:9.5px">${esc(v)}</td>`;
      if(k === 'date' || k === 'joined' || k === 'submitted' || k === 'ts') return `<td style="white-space:nowrap">${k==='ts'?esc(String(v).slice(0,16)):fmtDate(v)}</td>`;
      return `<td>${esc(v)}</td>`;
    }).join('') + '</tr>').join('') ||
    `<tr><td colspan="${cols.length}" class="empty">No records match the current filters.</td></tr>`;
  el('regBody').querySelectorAll('[data-row]').forEach(tr=>{
    tr.onclick = ()=> openRecord(tr.dataset.kind, tr.dataset.row);
  });
  el('regPager').innerHTML = `<span>Showing ${rows.length? (REG.page-1)*REG.per+1 : 0}–${Math.min(REG.page*REG.per, rows.length)} of ${num(rows.length)}</span>
    <button id="regPrev" ${REG.page===1?'disabled':''}>‹ Prev</button>
    <button id="regNext" ${REG.page>=pages?'disabled':''}>Next ›</button>`;
  if(el('regPrev')) el('regPrev').onclick = ()=>{ REG.page--; renderRegisters(); };
  if(el('regNext')) el('regNext').onclick = ()=>{ REG.page++; renderRegisters(); };
}

function openRecord(kind, id){
  if(kind === 'loan') return drillLoan(id);
  if(kind === 'customer') return drillCustomer(id);
  if(kind === 'pay'){ const p = PAYS.find(x=>x.ref===id); if(p) return drillPayment(p); }
  if(kind === 'app'){ const a = APPS.find(x=>x.ref===id); if(a) return drillApp(a); }
  if(kind === 'disb'){ const d = DISB.find(x=>x.ref===id); if(d) return drillDisb(d); }
  if(kind === 'txn'){ const t = TXNS.find(x=>x.ref===id); if(t) return drillTxn(t); }
  if(kind === 'audit'){ const a = AUDITS.find(x=>x.id===id); if(a) return drillAudit(a); }
  if(kind === 'staff'){
    const s = STAFF.find(x=>x.id===id);
    if(s) openModal(s.name, s.role + ' · ' + s.branch,
      `<div class="pfields">
        <div class="pfield"><div class="pk">Applications</div><div class="pv">${num(filterApps().filter(a=>a.officer===s.id).length)}</div></div>
        <div class="pfield"><div class="pk">Loans</div><div class="pv">${num(filterLoans().filter(l=>l.officer===s.id).length)}</div></div>
        <div class="pfield"><div class="pk">Receipts</div><div class="pv">${num(filterPays().filter(p=>p.officer===s.id).length)}</div></div>
        <div class="pfield"><div class="pk">Open tasks</div><div class="pv">${num(TASKS.filter(t=>t.staff===s.id && t.status==='Open').length)}</div></div>
      </div>`, [{label:'Close', act:'close'}]);
  }
}
</script>
