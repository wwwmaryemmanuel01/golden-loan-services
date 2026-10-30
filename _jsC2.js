
/* ============================================================
   SECTION 15 · REPORTS
   ============================================================ */
const REPORTS = [
  ['Daily Disbursement Report','Releases, values and exceptions for a single day'],
  ['Weekly Disbursement Report','Seven-day roll-up by branch and officer'],
  ['Monthly Disbursement Report','Full month with targets and variances'],
  ['Disbursements by Loan Product','Volume and value per product'],
  ['Disbursements by Payment Method','Channel mix and failure rate'],
  ['Disbursements by Staff Member','Officer productivity and limits'],
  ['Successful Disbursement Report','Confirmed and activated releases'],
  ['Failed Disbursement Report','Exceptions with resolution status'],
  ['Pending Disbursement Report','Pipeline awaiting authorization or release'],
  ['Fees & Deductions Report','Processing fees, insurance and waivers'],
  ['Disbursement Reconciliation Report','Authorized vs actual by channel'],
  ['Disbursement Audit Report','Full action trail for compliance']
];

function renderReports(){
  el('reportCards').innerHTML = REPORTS.map(([t,s])=>`
    <div class="card panel" style="padding:13px">
      <div class="panel-title" style="font-size:12.5px">${t}</div>
      <div class="panel-sub" style="min-height:30px">${s}</div>
      <div style="display:flex;gap:6px;margin-top:6px">
        <button class="btn btn-ghost btn-sm" data-act="report-pdf" data-ref="${t}">PDF</button>
        <button class="btn btn-ghost btn-sm" data-act="report-xls" data-ref="${t}">Excel</button>
        <button class="btn btn-ghost btn-sm" data-act="report-csv" data-ref="${t}">CSV</button>
      </div>
    </div>`).join('');

  mkHBars(el('chProduct'), [
    {label:'Business Growth', value:26.4, color:'#C9A227', display:'26.4M'},
    {label:'Asset Finance', value:14.2, color:'#2F6FED', display:'14.2M'},
    {label:'Agri Input', value:8.6, color:'#1E9E6A', display:'8.6M'},
    {label:'Group Loan', value:6.1, color:'#7C5CF0', display:'6.1M'},
    {label:'Salary Advance', value:5.4, color:'#E08C1E', display:'5.4M'},
    {label:'Emergency', value:2.7, color:'#D93F3F', display:'2.7M'}
  ]);

  const methodData = [
    {label:'Bank Transfer', value:18.4, color:'#2F6FED'},
    {label:'Airtel Money', value:3.2, color:'#D93F3F'},
    {label:'TNM Mpamba', value:2.1, color:'#1E9E6A'},
    {label:'Cash', value:1.4, color:'#C9A227'}
  ];
  el('chMethod').innerHTML = '<div id="chMethodDonut"></div><div id="chMethodLegend" style="min-width:180px"></div>';
  mkDonut(el('chMethodDonut'), methodData, {size:160, center:'MK 25.1M', caption:'RELEASED'});
  el('chMethodLegend').innerHTML = methodData.map(d=>`
    <div class="kv"><span class="k" style="display:flex;align-items:center;gap:6px">
      <i style="width:7px;height:7px;border-radius:50%;background:${d.color};display:block"></i>${d.label}</span>
      <span class="v">MK ${d.value.toFixed(1)}M</span></div>`).join('');

  mkHBars(el('chStaff'), [
    {label:'T. Phiri', value:18.4, color:'#C9A227', display:'18.4M'},
    {label:'L. Chirwa', value:16.2, color:'#2F6FED', display:'16.2M'},
    {label:'S. Zimba', value:14.8, color:'#7C5CF0', display:'14.8M'},
    {label:'A. Mbewe', value:8.6, color:'#1E9E6A', display:'8.6M'},
    {label:"G. Mtemang'ombe", value:5.4, color:'#E08C1E', display:'5.4M'}
  ]);

  mkChart(el('chTrend'), {type:'line', height:220,
    labels:['17','18','21','22','23','24','25','28','29','30'],
    series:[{name:'Released', color:'#C9A227', data:[4.2,5.1,6.3,4.8,5.6,7.1,5.2,6.4,6.1,7.8]}]});
}

/* ============================================================
   SECTION 16 · NOTIFICATIONS
   ============================================================ */
function renderNotifications(){
  el('notifRules').innerHTML = [
    ['Approval requested → authorizers (in-app + email)'],
    ['Pending authorization > 2 hours → reminder'],
    ['Disbursement released → finance + officer'],
    ['Customer disbursement confirmation → SMS'],
    ['Failed transaction → officer + supervisor'],
    ['Loan activated → customer SMS with first due date'],
    ['Daily reconciliation summary → administrator']
  ].map(([t])=>`<div class="check"><div class="ck y">✓</div><div><b>${t}</b></div></div>`).join('');

  el('notifHist').innerHTML = state.notifs.map(([t,to,ch,msg,st])=>`
    <tr><td class="tiny muted">${t}</td><td class="tiny" style="font-weight:600">${to}</td>
      <td class="tiny">${ch}</td><td class="tiny muted">${msg}</td>
      <td><span class="chip ${st==='Failed'?'st-fail':st==='Unread'?'st-await':'st-ok'}">${st}</span></td></tr>`).join('');
}

/* ============================================================
   SECTION 17 · AUDIT
   ============================================================ */
function renderAudit(){
  const q = (el('auditSearch').value||'').toLowerCase();
  const act = el('auditAction').value;
  const rows = state.audit.filter(a=>{
    if(q && !(a[1]+a[3]+a[4]).toLowerCase().includes(q)) return false;
    if(act && a[2]!==act) return false;
    return true;
  });
  el('auditBody').innerHTML = rows.length ? rows.map(a=>`
    <tr><td class="tiny muted">${a[0]}</td><td class="tiny" style="font-weight:700">${a[1]}</td>
      <td class="tiny">${a[2]}</td><td class="tiny">${a[3]}</td><td class="tiny muted">${a[4]}</td>
      <td class="tiny muted">${a[5]}</td>
      <td><span class="chip ${a[6]==='Blocked'?'st-fail':'st-ok'}">${a[6]}</span></td></tr>`).join('')
    : `<tr><td colspan="7"><div class="empty">No audit entries match your filters.</div></td></tr>`;

  el('auditAlerts').innerHTML = [
    ['L. Chirwa','Attempted to authorize MK 9,200,000 above personal limit','08:02','Blocked'],
    ['Unknown session','Disbursement record accessed from unrecognised device','07:41','Flagged']
  ].map(([who,what,t,st])=>`
    <div class="li"><div class="av" style="background:var(--red-soft);color:#B32C2C">!</div>
      <div><div class="t1">${what}</div><div class="t2">${who} · ${t}</div></div>
      <div class="amt"><b class="tiny" style="color:#B32C2C">${st}</b></div></div>`).join('');
}

/* ============================================================
   SECTION 18 · SETTINGS
   ============================================================ */
function renderSettings(){
  el('setMethods').innerHTML = METHODS.map((m,i)=>`
    <div class="setrow">
      <div><div class="sk">${m.name}</div><div class="ss">${m.fee}</div></div>
      <div class="sv"><button class="toggle ${m.enabled?'on':''}" data-act="toggle-method" data-idx="${i}"></button></div>
    </div>`).join('') + `
    <div class="setrow"><div><div class="sk">Per-transaction ceiling</div>
      <div class="ss">Above this amount, two authorizers are required</div></div>
      <div class="sv"><input type="number" value="5000000" /></div></div>`;

  el('setApproval').innerHTML = `
    <div class="setrow"><div><div class="sk">Require second-line authorization</div>
      <div class="ss">Preparer cannot authorize their own instruction</div></div>
      <div class="sv"><button class="toggle on" data-act="toggle"></button></div></div>
    <div class="setrow"><div><div class="sk">Officer release limit</div><div class="ss">Per user role</div></div>
      <div class="sv"><input type="number" value="5000000" /></div></div>
    <div class="setrow"><div><div class="sk">Committee limit</div><div class="ss">Credit committee sign-off</div></div>
      <div class="sv"><input type="number" value="15000000" /></div></div>
    <div class="setrow"><div><div class="sk">Re-authorization after edit</div>
      <div class="ss">Any change to amount or recipient restarts approval</div></div>
      <div class="sv"><button class="toggle on" data-act="toggle"></button></div></div>
    <div class="setrow"><div><div class="sk">Require authorization notes</div><div class="ss">Mandatory comment on rejection</div></div>
      <div class="sv"><button class="toggle on" data-act="toggle"></button></div></div>`;

  el('setRules').innerHTML = `
    <div class="setrow"><div><div class="sk">Required documents before release</div>
      <div class="ss">Signed agreement, ID, proof of income</div></div>
      <div class="sv"><select><option>All required</option><option>Agreement + ID only</option></select></div></div>
    <div class="setrow"><div><div class="sk">Block release when documents are missing</div>
      <div class="ss">Draft is kept, authorization blocked</div></div>
      <div class="sv"><button class="toggle on" data-act="toggle"></button></div></div>
    <div class="setrow"><div><div class="sk">Eligibility: KYC verified</div><div class="ss">Customer must pass KYC</div></div>
      <div class="sv"><button class="toggle on" data-act="toggle"></button></div></div>
    <div class="setrow"><div><div class="sk">Duplicate release window</div><div class="ss">Hours used for duplicate detection</div></div>
      <div class="sv"><input type="number" value="24" /></div></div>
    <div class="setrow"><div><div class="sk">Auto-activate loan on confirmation</div>
      <div class="ss">Generate schedule immediately</div></div>
      <div class="sv"><button class="toggle" data-act="toggle"></button></div></div>`;

  el('setFees').innerHTML = `
    <div class="setrow"><div><div class="sk">Disbursement reference format</div>
      <div class="ss">Prefix and sequence</div></div>
      <div class="sv"><input type="text" value="DIS-YYYY-NNNN" /></div></div>
    <div class="setrow"><div><div class="sk">Processing fee</div><div class="ss">% of approved amount</div></div>
      <div class="sv"><input type="number" step="0.1" value="2.5" /></div></div>
    <div class="setrow"><div><div class="sk">Insurance / credit life</div><div class="ss">% of approved amount</div></div>
      <div class="sv"><input type="number" step="0.1" value="1" /></div></div>
    <div class="setrow"><div><div class="sk">Payment confirmation required</div>
      <div class="ss">Before activation</div></div>
      <div class="sv"><button class="toggle on" data-act="toggle"></button></div></div>
    <div class="setrow"><div><div class="sk">Customer SMS on release</div><div class="ss">Notify recipient instantly</div></div>
      <div class="sv"><button class="toggle on" data-act="toggle"></button></div></div>`;
}
