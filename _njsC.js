
/* ============================================================
   SECTION 10 · CHANNELS
   ============================================================ */
function renderChannels(){
  el('channelCards').innerHTML = CHANNELS.map((c,i)=>{
    const rate = ((c.delivered/(c.delivered+c.failed))*100).toFixed(1);
    return `<div class="chcard">
      <div class="chh">
        <div class="chi" style="background:${c.color}1A;color:${c.color}">${c.icon}</div>
        <div style="flex:1;min-width:0"><b style="font-size:12px">${c.name}</b>
          <div class="tiny muted">${c.enabled?'Available':'Suspended'}</div></div>
        <button class="toggle ${c.enabled?'on':''}" data-act="toggle-channel" data-idx="${i}"></button>
      </div>
      <div class="chv"><span class="muted">Sent</span><b>${nf(c.sent)}</b></div>
      <div class="chv"><span class="muted">Delivered</span><b>${nf(c.delivered)}</b></div>
      <div class="chv"><span class="muted">Failed</span><b style="color:${c.failed?'#B32C2C':'#157A50'}">${nf(c.failed)}</b></div>
      <div class="chv"><span class="muted">Success rate</span><b style="color:#157A50">${rate}%</b></div>
      <div class="chv"><span class="muted">Cost</span><b>${c.cost}</b></div>
    </div>`;
  }).join('');

  el('channelUsage').innerHTML = CHANNELS.map(c=>`
    <tr><td style="font-weight:600">${c.name}</td><td class="num">${nf(c.sent)}</td>
      <td class="num">${nf(c.delivered)}</td><td class="num" style="color:#B32C2C">${nf(c.failed)}</td>
      <td class="num">${((c.delivered/(c.delivered+c.failed))*100).toFixed(1)}%</td>
      <td class="num">${c.cost}</td></tr>`).join('');

  el('channelFailures').innerHTML = [
    ['SMS — retry twice at 15 minute intervals, then flag the officer'],
    ['SMS — invalid numbers marked undeliverable and removed from the list'],
    ['Email — bounce handling with suppression list'],
    ['In-app — queued until the recipient next signs in'],
    ['Portal — fallback to SMS when unread for 48 hours'],
    ['All channels — failures recorded with provider response codes']
  ].map(([t])=>`<div class="check"><div class="ck y">✓</div><div><b>${t}</b></div></div>`).join('');
}

/* ============================================================
   SECTION 11 · TEMPLATES
   ============================================================ */
function renderTemplates(){
  el('tplCount').textContent = TEMPLATES.filter(t=>t[4]).length + ' active';
  el('templateGrid').innerHTML = TEMPLATES.map((t,i)=>`
    <div class="tpl ${t[4]?'':'off'}">
      <div class="tph">
        <div style="flex:1;min-width:0">
          <div class="tpt">${t[1]}</div>
          <div class="tps">${t[0]} · ${t[2]} · ${t[3]}</div>
        </div>
        <button class="toggle ${t[4]?'on':''}" data-act="toggle-tpl" data-idx="${i}" title="Activate / deactivate"></button>
      </div>
      <div class="tpbody">${t[5]}</div>
      <div class="tpfoot">
        <button class="btn btn-ghost btn-sm" data-act="edit-tpl" data-idx="${i}">Edit</button>
        <button class="btn btn-ghost btn-sm" data-act="preview-tpl" data-idx="${i}">Preview</button>
        <button class="btn btn-ghost btn-sm" data-act="use-tpl" data-idx="${i}">Use</button>
      </div>
    </div>`).join('');
}

function editTemplate(i){
  const t = TEMPLATES[i];
  openModal(`Edit template ${t[0]}`, t[1], `
    <div class="form-grid">
      <div class="fg"><label>Template name</label><input id="tpName" value="${t[1]}" /></div>
      <div class="fg"><label>Channel</label><select id="tpChannel">${['SMS','Email','In-App','Customer Portal','Staff Dashboard']
        .map(c=>`<option ${c===t[2]?'selected':''}>${c}</option>`).join('')}</select></div>
      <div class="fg"><label>Category</label><select id="tpCat">${['Customer','Loan','Repayment','Disbursement','System','Staff']
        .map(c=>`<option ${c===t[3]?'selected':''}>${c}</option>`).join('')}</select></div>
      <div class="fg"><label>Status</label><select id="tpActive">
        <option value="1" ${t[4]?'selected':''}>Active</option><option value="0" ${t[4]?'':'selected'}>Inactive</option></select></div>
      <div class="fg" style="grid-column:1/-1"><label>Message body</label>
        <textarea id="tpBody" rows="4">${t[5]}</textarea>
        <div class="hint">Merge fields: {{first_name}} {{loan_no}} {{amount}} {{due_date}} {{reference}}</div></div>
    </div>`,
    [{label:'Cancel', cls:'btn-ghost', act:'close'},
     {label:'Save template', cls:'btn-gold', act:()=>{
        TEMPLATES[i] = [t[0], el('tpName').value, el('tpChannel').value, el('tpCat').value,
          el('tpActive').value==='1', el('tpBody').value];
        S.audit.unshift([stamp(), t[0], 'Modified', 'C. Mwale', 'Template wording updated', '196.44.21.4', 'Success']);
        closeModal(); renderTemplates(); renderAudit(); toast('Template saved', 'ok');
     }}]);
}

/* ============================================================
   SECTION 12 · AUTOMATIONS
   ============================================================ */
function renderAutomations(){
  el('automationBody').innerHTML = AUTOMATIONS.map((a,i)=>`
    <tr>
      <td class="auto-name"><b>${a[0]}</b><span style="color:${a[4]?'#157A50':'#8A6D0F'}">${a[4]?'● Running':'● Paused'}</span></td>
      <td class="tiny muted">${a[1]}</td>
      <td class="tiny">${a[2]}</td>
      <td class="num">${a[3]}</td>
      <td><button class="btn ${a[4]?'btn-ghost':'btn-gold'} btn-sm" data-act="toggle-auto" data-idx="${i}">${a[4]?'Pause':'Resume'}</button></td>
    </tr>`).join('');

  el('automationHistory').innerHTML = [
    ['Automatic repayment reminders · 412 delivered','30 Oct 08:00 · 3 failed'],
    ['Upcoming due-date alerts · 286 delivered','30 Oct 08:00 · 1 failed'],
    ['Overdue payment alerts · 164 delivered','29 Oct 09:00 · 2 failed'],
    ['Pending approval reminders · 34 delivered','29 Oct 16:00 · all delivered'],
    ['Collection follow-up reminders · 96 delivered','29 Oct 11:00 · 0 failed']
  ].map(([t,s])=>`<div class="li"><div class="av">↻</div>
    <div><div class="t1">${t}</div><div class="t2">${s}</div></div></div>`).join('');
}

/* ============================================================
   SECTION 13 · DELIVERY TRACKING
   ============================================================ */
function renderDelivery(){
  const pending = NTF.filter(n=>n.status==='Pending');
  const queued = NTF.filter(n=>n.status==='Queued');
  const sent = NTF.filter(n=>n.status==='Sent');
  const delivered = NTF.filter(n=>n.status==='Delivered');
  const failed = NTF.filter(n=>n.status==='Failed');
  el('queueCount').textContent = (pending.length+queued.length) + ' in queue';

  const tiles = [
    ['Pending Delivery', pending.length, 'Awaiting dispatch', '#9A6A0D', 'var(--amber-soft)', 'card'],
    ['Queued', queued.length, 'Held by provider queue', '#5A3FCB', 'var(--purple-soft)', 'doc'],
    ['Sent', sent.length, 'Handed to the provider', '#2456C4', 'var(--blue-soft)', 'doc'],
    ['Delivered', delivered.length, 'Confirmed by provider', '#157A50', 'var(--green-soft)', 'check'],
    ['Failed', failed.length, 'Provider rejected', '#B32C2C', 'var(--red-soft)', 'alert']
  ];
  el('deliveryTiles').innerHTML = tiles.map(([l,v,s,c,bg,ic])=>`
    <div class="card stat">
      <div class="stat-top"><div class="stat-label">${l}</div>
        <div class="stat-ic" style="background:${bg};color:${c}">${ICONS[ic]}</div></div>
      <div class="stat-val">${v}</div>
      <div class="stat-foot">${s}</div>
    </div>`).join('');

  el('deliveryBody').innerHTML = failed.length ? failed.map(n=>`
    <tr>
      <td class="tiny" style="font-weight:700;white-space:nowrap">${n.ref}</td>
      <td class="tiny" style="white-space:nowrap">${n.recipient}<div class="muted">${n.channel}</div></td>
      <td class="tiny" style="color:#B32C2C;max-width:190px">${providerError(n)}
        <div class="muted">${n.attempts} attempts</div></td>
      <td><button class="btn btn-gold btn-sm" data-act="retry" data-ref="${n.ref}">Retry</button></td>
    </tr>`).join('')
    : `<tr><td colspan="4"><div class="empty">No failed deliveries.</div></td></tr>`;

  el('deliveryHistory').innerHTML = NTF.slice(0,6).map(n=>`
    <div class="li"><div class="av" style="background:${CAT_COLORS[n.cat]}1A;color:${CAT_COLORS[n.cat]}">${initials(n.recipient)}</div>
      <div><div class="t1">${n.recipient}</div><div class="t2">${n.channel} · ${n.provider||'—'} · ${n.created}</div></div>
      <div class="amt">${statusChip(n)}</div></div>`).join('');
}
function providerError(n){
  if(n.channel==='SMS') return 'AM-ERR-7741 · wallet unreachable';
  if(n.channel==='Email') return 'SMTP 550 · mailbox unavailable';
  return 'TIMEOUT · no response in 30s';
}

/* ============================================================
   SECTION 14 · ANNOUNCEMENTS
   ============================================================ */
function renderAnnouncements(){
  el('annCount').textContent = ANNOUNCEMENTS.length + ' published';
  el('annList').innerHTML = ANNOUNCEMENTS.map((a,i)=>{
    const pct = Math.round((a[7]/a[6])*100);
    return `<div class="ann" style="margin-bottom:10px">
      <div class="anh">
        <div style="flex:1;min-width:0">
          <div class="ant">${a[1]}</div>
          <div class="ans">${a[0]} · ${a[2]} · ${a[5]} · <span style="color:${a[4]==='High'?'#B32C2C':'#5A6172'};font-weight:700">${a[4]} priority</span></div>
          <div class="anb">${a[3]}</div>
        </div>
      </div>
      <div class="prog-row" style="margin-top:9px">
        <div class="prog-top"><b>Read by ${a[7]} of ${a[6]}</b><span>${pct}%</span></div>
        <div class="bar ${pct>80?'green':''}"><i style="width:${pct}%"></i></div>
      </div>
      <div style="display:flex;gap:6px;margin-top:9px">
        <button class="btn btn-ghost btn-sm" data-act="edit-ann" data-idx="${i}">Edit</button>
        <button class="btn btn-red btn-sm" data-act="withdraw-ann" data-idx="${i}">Withdraw</button>
      </div>
    </div>`;
  }).join('') || '<div class="empty">No announcements published.</div>';
}

function publishAnnouncement(){
  const title = el('annTitle').value.trim();
  const body = el('annBody').value.trim();
  if(!title || !body) return toast('Title and message are required', 'err');
  const audience = el('annAudience').value + (el('annTarget').value!=='All' ? ' · '+el('annTarget').value : '');
  const size = el('annAudience').value.includes('staff') ? 24 : 118;
  ANNOUNCEMENTS.unshift(['ANN-'+(104+ANNOUNCEMENTS.length), title, audience, body,
    el('annPriority').value, '30 Oct 2026', size, 0]);
  S.audit.unshift([stamp(), 'ANN-NEW', 'Broadcast', 'C. Mwale', 'Published: ' + title, '196.44.21.4', 'Success']);
  el('annTitle').value=''; el('annBody').value='';
  toast(`Announcement published to ${size} recipients`, 'ok');
  renderAnnouncements(); renderAudit();
}

/* ============================================================
   SECTION 15 · PREFERENCES
   ============================================================ */
function row(title, sub, on, locked){
  return `<div class="setrow">
    <div><div class="sk">${title}</div><div class="ss">${sub}</div></div>
    <div class="sv">${locked
      ? `<span class="badge b-gray">Mandatory</span>`
      : `<button class="toggle ${on?'on':''}" data-act="toggle"></button>`}</div>
  </div>`;
}
function renderPrefs(){
  el('prefCustomer').innerHTML =
    row('SMS notifications','Repayment reminders, receipts and alerts',true) +
    row('Email notifications','Statements and formal notices',true) +
    row('In-app notifications','Portal messages',true) +
    row('Repayment reminders','3 days before and on the due date',true) +
    row('Marketing messages','Promotions and product offers',false) +
    row('Quiet hours','No non-critical messages between 20:00 and 07:00',true);

  el('prefStaff').innerHTML =
    row('Staff dashboard notifications','Approvals, assignments and queues',true) +
    row('Email notifications','Digests and escalation',true) +
    row('SMS alerts','Critical escalations only',false) +
    row('Approval reminders','Repeat every 2 hours while pending',true) +
    row('Collection task alerts','New follow-ups assigned to me',true);

  el('prefConsent').innerHTML =
    row('Explicit opt-in required','Customers must consent before marketing messages',true) +
    row('Opt-out honoured within 24 hours','Suppression list applied across channels',true) +
    row('Re-confirm consent annually','Consent expiry and refresh campaign',true) +
    row('Keep delivery logs for audit','Retained with message content',true);

  el('prefLocked').innerHTML = `
    <div class="locked" style="margin-bottom:8px">🔒 Security alerts are always delivered to the account holder and administrator.</div>
    <div class="locked" style="margin-bottom:8px">🔒 Password reset and sign-in alerts cannot be disabled by users.</div>
    <div class="locked">🔒 Account lockout and fraud notices bypass quiet hours.</div>`;
}

/* ============================================================
   SECTION 16 · REPORTS
   ============================================================ */
const REPORTS = [
  ['Daily Notification Report','Volume, failures and channel split for a day'],
  ['Weekly Notification Report','Seven-day roll-up by category'],
  ['Monthly Notification Report','Full month with delivery performance'],
  ['Notifications by Category','Customer, staff, loan, repayment, disbursement, system'],
  ['Notifications by Channel','SMS, email, in-app and portal usage'],
  ['Delivery Success Rate','Provider performance over time'],
  ['Failed Delivery Report','Failures with provider response codes'],
  ['Customer Notification Report','Borrower messaging history'],
  ['Staff Notification Report','Internal alert volumes and read rates'],
  ['Automated Reminder Report','Reminder engine output and outcomes'],
  ['SMS & Email Usage Summary','Volumes and cost by provider'],
  ['Notification Audit Report','Creation, sending and modification trail']
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

  const monthTotal = CHANNELS.reduce((a,c)=>a+c.sent,0);
  mkHBars(el('chCategory'), Object.keys(TYPES).map(c=>({
    label:c, value:Math.round(monthTotal*CAT_SHARE[c]), color:CAT_COLORS[c]
  })));

  const chData = CHANNELS.map(c=>({label:c.name, value:c.sent, color:c.color}));
  el('chChannel').innerHTML = '<div id="chChannelDonut"></div><div id="chChannelLegend" style="min-width:180px"></div>';
  mkDonut(el('chChannelDonut'), chData, {size:158, center:nf(chData.reduce((s,d)=>s+d.value,0)), caption:'MESSAGES'});
  el('chChannelLegend').innerHTML = chData.map(d=>`
    <div class="kv"><span class="k" style="display:flex;align-items:center;gap:6px">
      <i style="width:7px;height:7px;border-radius:50%;background:${d.color};display:block"></i>${d.label}</span>
      <span class="v">${nf(d.value)}</span></div>`).join('');

  mkChart(el('chSuccess'), {type:'line', height:210, suffix:'%', yMax:100,
    labels:['21','22','23','24','25','26','27','28','29','30'],
    series:[{name:'Success rate', color:'#1E9E6A', data:[96.2,95.8,97.1,96.4,98.0,97.2,96.6,97.4,96.9,96.8]}]});

  mkChart(el('chVolume'), {type:'bar', height:210,
    labels:['21','22','23','24','25','26','27','28','29','30'],
    series:[
      {name:'Delivered', color:'#C9A227', data:[184,192,176,208,196,214,188,226,202,248]},
      {name:'Failed', color:'#D93F3F', data:[7,8,5,7,4,6,3,6,5,5]}
    ]});
}

/* ============================================================
   SECTION 17 · AUDIT
   ============================================================ */
function renderAudit(){
  const q=(el('auditSearch').value||'').toLowerCase();
  const act=el('auditAction').value;
  const rows = S.audit.filter(a=>{
    if(q && !(a[1]+a[3]+a[4]).toLowerCase().includes(q)) return false;
    if(act && a[2]!==act) return false;
    return true;
  });
  el('auditBody').innerHTML = rows.length ? rows.map(a=>`
    <tr><td class="tiny muted">${a[0]}</td><td class="tiny" style="font-weight:700">${a[1]}</td>
      <td class="tiny">${a[2]}</td><td class="tiny">${a[3]}</td><td class="tiny muted">${a[4]}</td>
      <td class="tiny muted">${a[5]}</td>
      <td><span class="chip ${a[6]==='Blocked'||a[6]==='Failed'?'st-fail':'st-ok'}">${a[6]}</span></td></tr>`).join('')
    : `<tr><td colspan="7"><div class="empty">No audit entries match your filters.</div></td></tr>`;

  el('auditBlocked').innerHTML = [
    ['L. Chirwa','Attempted broadcast to all customers without approval','06:58'],
    ['Unknown session','Attempted to read SMS content for an unrelated customer','07:41']
  ].map(([who,what,t])=>`<div class="li"><div class="av" style="background:var(--red-soft);color:#B32C2C">!</div>
    <div><div class="t1">${what}</div><div class="t2">${who} · ${t}</div></div>
    <div class="amt"><b class="tiny" style="color:#B32C2C">Blocked</b></div></div>`).join('');

  el('auditSensitive').innerHTML = [
    ['C. Mwale','Viewed message content for NTF-10324','09:12'],
    ['C. Mwale','Exported 42 notification records','08:40'],
    ['System','Masked customer numbers in delivery log','06:00']
  ].map(([who,what,t])=>`<div class="li"><div class="av">${initials(who)}</div>
    <div><div class="t1">${what}</div><div class="t2">${who} · ${t}</div></div></div>`).join('');
}

/* ============================================================
   SECTION 18 · SETTINGS
   ============================================================ */
function field(title, sub, html){
  return `<div class="setrow">
    <div><div class="sk">${title}</div><div class="ss">${sub}</div></div>
    <div class="sv">${html}</div>
  </div>`;
}
const num = v => `<input type="number" value="${v}" />`;
const sel = (opts, cur) => `<select>${opts.map(o=>`<option ${o===cur?'selected':''}>${o}</option>`).join('')}</select>`;

function renderSettings(){
  el('setCategories').innerHTML =
    row('Customer notifications','Lifecycle messages to borrowers',true) +
    row('Staff notifications','Internal operational alerts',true) +
    row('Loan &amp; application alerts','Pipeline events',true) +
    row('Repayment &amp; collection alerts','Reminders and arrears',true) +
    row('Disbursement notifications','Release workflow',true) +
    field('Default channel','Applied when a message has no channel','<select><option>In-App</option><option>SMS</option><option>Email</option></select>');

  el('setPriority').innerHTML =
    row('High priority bypasses quiet hours','Security and arrears notices',true) +
    field('Escalate unread high priority after','Hours before escalation to a supervisor', num(4)) +
    field('Reminder timing','Days before the due date', num(3)) +
    field('Repeat overdue reminders','Hours between reminders until paid', num(24));

  el('setDelivery').innerHTML =
    row('Retry failed deliveries','Automatic retry when a provider rejects',true) +
    field('Retry interval','Minutes between attempts', num(15)) +
    field('Daily SMS limit','Per recipient, per day', num(5)) +
    field('Retention period','Months before archival', sel(['12 months','24 months','84 months'],'24 months'));

  el('setProviders').innerHTML = `
    <div class="setrow"><div><div class="sk">SMS provider</div><div class="ss">Primary gateway</div></div>
      <div class="sv"><span class="badge b-appr">Airtel / TNM · connected</span></div></div>
    <div class="setrow"><div><div class="sk">Sender ID</div><div class="ss">Shown to recipients</div></div>
      <div class="sv"><input type="text" value="GOLDENFS" /></div></div>
    <div class="setrow"><div><div class="sk">Email provider</div><div class="ss">SMTP relay</div></div>
      <div class="sv"><span class="badge b-appr">Postmark · connected</span></div></div>
    <div class="setrow"><div><div class="sk">In-app / realtime keys</div><div class="ss">Supabase channel</div></div>
      <div class="sv"><span class="badge b-appr">Healthy</span></div></div>
    <div class="setrow"><div><div class="sk">Who can send broadcasts</div><div class="ss">Minimum role</div></div>
      <div class="sv">${sel(['Administrator','Manager','Loan Officer'],'Administrator')}</div></div>
    <div class="setrow"><div><div class="sk">Require approval for bulk sends</div><div class="ss">Above 100 recipients</div></div>
      <div class="sv"><button class="toggle on" data-act="toggle"></button></div></div>`;
}

/* ============================================================
   ACTIONS
   ============================================================ */
const findN = ref => NTF.find(n=>n.ref===ref);

function viewNotification(ref){
  const n = findN(ref); if(!n) return;
  n.read = true;
  openModal(n.subject, `${n.ref} · ${n.cat} · ${n.channel}`, `
    <div class="grid g2" style="gap:10px">
      <div>
        <div class="kv"><span class="k">Recipient</span><span class="v">${n.recipient}</span></div>
        <div class="kv"><span class="k">Recipient type</span><span class="v">${n.rtype}</span></div>
        <div class="kv"><span class="k">Channel</span><span class="v">${n.channel}</span></div>
        <div class="kv"><span class="k">Status</span><span class="v">${statusChip(n)}</span></div>
      </div>
      <div>
        <div class="kv"><span class="k">Created</span><span class="v">${n.created}</span></div>
        <div class="kv"><span class="k">Sender</span><span class="v">${n.sender}</span></div>
        <div class="kv"><span class="k">Provider ref</span><span class="v">${n.provider||'—'}</span></div>
        <div class="kv"><span class="k">Attempts</span><span class="v">${n.attempts}</span></div>
      </div>
    </div>
    <div class="preview" style="margin-top:12px">
      <div class="phead"><span>GOLDEN FS</span><span>${n.channel}</span></div>
      <div class="pbody"><div class="psub">${n.subject}</div><div style="white-space:pre-wrap;color:#C7CBD4">${n.body}</div></div>
      <div class="pfoot"><span>To: ${n.recipient}</span><span>${n.created}</span></div>
    </div>
    ${n.status==='Failed'?`<div class="note red" style="margin-top:10px">${providerError(n)}</div>`:''}`,
    [{label:'Close', cls:'btn-ghost', act:'close'},
     {label:'Mark unread', cls:'btn-ghost', act:()=>{ n.read=false; closeModal(); renderAll(); }},
     n.status==='Failed'
       ? {label:'Retry delivery', cls:'btn-gold', act:()=>{ closeModal(); retryNotification(ref); }}
       : {label:'Archive', cls:'btn-red', act:()=>{ n.archived=true; closeModal(); renderAll(); toast('Archived','info'); }}]);
}

function retryNotification(ref){
  const n = findN(ref); if(!n) return;
  n.attempts++;
  n.status = 'Delivered'; n.read = true;
  S.audit.unshift([stamp(), ref, 'Retried', 'C. Mwale', 'Redelivered after provider error', '196.44.21.4', 'Success']);
  toast(`${ref} redelivered`, 'ok');
  renderAll(); renderAudit();
}

function openModal(title, sub, body, actions=[]){
  el('modalTitle').textContent = title;
  el('modalSub').textContent = sub;
  el('modalBody').innerHTML = body;
  el('modalFoot').innerHTML = '';
  actions.forEach(a=>{
    const b = document.createElement('button');
    b.className = 'btn ' + (a.cls||'btn-ghost');
    b.textContent = a.label;
    b.onclick = a.act==='close' ? closeModal : a.act;
    el('modalFoot').appendChild(b);
  });
  el('modal').classList.add('on');
}
function closeModal(){ el('modal').classList.remove('on'); }

function exportCSV(rows, name){
  const csv = rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], {type:'text/csv'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name; a.click();
  URL.revokeObjectURL(a.href);
  toast('Export ready · ' + name, 'ok');
}

/* ============================================================
   EVENT DELEGATION
   ============================================================ */
document.addEventListener('click', e=>{
  const t = e.target.closest('[data-act]');
  if(!t) return;
  const act = t.dataset.act, ref = t.dataset.ref;
  switch(act){
    case 'view': viewNotification(ref); break;
    case 'toggle-read': { const n=findN(ref); n.read=!n.read; renderAll(); break; }
    case 'archive': { const n=findN(ref); n.archived=!n.archived;
      S.audit.unshift([stamp(), ref, 'Archived','C. Mwale', n.archived?'Archived notification':'Restored notification','196.44.21.4','Success']);
      renderAll(); renderAudit(); toast(n.archived?'Notification archived':'Notification restored','info'); break; }
    case 'retry': retryNotification(ref); break;
    case 'prev': S.page=Math.max(1,S.page-1); renderRegister(); break;
    case 'next': S.page++; renderRegister(); break;
    case 'quick-type': quickCompose(t.dataset.cat, ref); break;
    case 'toggle-channel': { CHANNELS[+t.dataset.idx].enabled = !CHANNELS[+t.dataset.idx].enabled;
      renderChannels(); toast(`${CHANNELS[+t.dataset.idx].name} ${CHANNELS[+t.dataset.idx].enabled?'enabled':'suspended'}`,'info'); break; }
    case 'toggle-tpl': { const i=+t.dataset.idx; TEMPLATES[i][4]=!TEMPLATES[i][4]; renderTemplates();
      toast(`${TEMPLATES[i][1]} ${TEMPLATES[i][4]?'activated':'deactivated'}`,'info'); break; }
    case 'edit-tpl': editTemplate(+t.dataset.idx); break;
    case 'preview-tpl': {
      const tp = TEMPLATES[+t.dataset.idx];
      const sample = tp[5].replace('{{first_name}}','Thokozani').replace('{{loan_no}}','LN-2026-1842')
        .replace('{{customer_no}}','CUS-004286').replace('{{amount}}','2,500,000')
        .replace('{{net_amount}}','2,412,500').replace('{{channel}}','Airtel Money')
        .replace('{{reference}}','DIS-2026-1042').replace('{{due_date}}','2 Nov 2026')
        .replace('{{days}}','14').replace('{{balance}}','842,000').replace('{{date}}','30 Oct 2026')
        .replace('{{link}}','https://portal.goldenfs.mw/reset/8f2c').replace('{{action_required}}','Approval required')
        .replace('{{count}}','3').replace('{{title}}',tp[1]).replace('{{message}}','Scheduled maintenance');
      openModal(tp[1], `${tp[0]} · ${tp[2]} · ${tp[3]}`, `
        <div class="preview"><div class="phead"><span>GOLDEN FS</span><span>${tp[2]}</span></div>
          <div class="pbody"><div class="psub">${tp[1]}</div>
          <div style="white-space:pre-wrap;color:#C7CBD4">${sample}</div></div>
          <div class="pfoot"><span>Preview with sample merge fields</span><span>${new Date().toLocaleDateString()}</span></div></div>`,
        [{label:'Close', cls:'btn-ghost', act:'close'},
         {label:'Use this template', cls:'btn-gold', act:()=>{ closeModal(); useTemplate(+t.dataset.idx); }}]);
      break; }
    case 'use-tpl': useTemplate(+t.dataset.idx); break;
    case 'toggle-auto': { const i=+t.dataset.idx; AUTOMATIONS[i][4]=!AUTOMATIONS[i][4];
      renderAutomations(); toast(`${AUTOMATIONS[i][0]} ${AUTOMATIONS[i][4]?'resumed':'paused'}`,'info'); break; }
    case 'withdraw-ann': { const i=+t.dataset.idx; const a=ANNOUNCEMENTS.splice(i,1)[0];
      S.audit.unshift([stamp(), a[0], 'Broadcast','C. Mwale','Withdrawn: '+a[1],'196.44.21.4','Success']);
      renderAnnouncements(); renderAudit(); toast('Announcement withdrawn','info'); break; }
    case 'edit-ann': {
      const i=+t.dataset.idx, a=ANNOUNCEMENTS[i];
      openModal('Edit announcement', a[0], `
        <div class="form-grid">
          <div class="fg" style="grid-column:1/-1"><label>Title</label><input id="eaTitle" value="${a[1]}" /></div>
          <div class="fg"><label>Priority</label><select id="eaPri">${['High','Normal','Low']
            .map(p=>`<option ${p===a[4]?'selected':''}>${p}</option>`).join('')}</select></div>
          <div class="fg"><label>Audience</label><input id="eaAud" value="${a[2]}" /></div>
          <div class="fg" style="grid-column:1/-1"><label>Message</label>
            <textarea id="eaBody" rows="4">${a[3]}</textarea></div>
        </div>`,
        [{label:'Cancel', cls:'btn-ghost', act:'close'},
         {label:'Save changes', cls:'btn-gold', act:()=>{
            a[1]=el('eaTitle').value; a[4]=el('eaPri').value; a[2]=el('eaAud').value; a[3]=el('eaBody').value;
            closeModal(); renderAnnouncements(); toast('Announcement updated','ok');
         }}]);
      break; }
    case 'report-pdf': toast(`${ref} · PDF generated`, 'ok'); break;
    case 'report-xls': toast(`${ref} · Excel generated`, 'ok'); break;
    case 'report-csv':
      exportCSV([['Reference','Category','Type','Recipient','Channel','Status','Created','Subject'],
        ...NTF.map(n=>[n.ref,n.cat,n.type,n.recipient,n.channel,n.status,n.created,n.subject])],
        ref.toLowerCase().replace(/[^a-z]+/g,'-')+'.csv');
      break;
    case 'toggle': t.classList.toggle('on'); break;
  }
});

function useTemplate(i){
  const tp = TEMPLATES[i];
  AUD = tp[3]==='Staff' ? 'Staff' : 'Customer';
  document.querySelectorAll('#audienceSeg button').forEach(b=>b.classList.toggle('on', b.dataset.aud===AUD));
  renderSendForm();
  el('sendTemplate').value = tp[0];
  el('sendSubject').value = tp[1];
  el('sendBody').value = tp[5];
  el('sendChannel').value = tp[2];
  updatePreview();
  document.getElementById('s9').scrollIntoView({behavior:'smooth'});
  toast(`Template “${tp[1]}” loaded`, 'info');
}

/* ============================================================
   WIRING
   ============================================================ */
el('modalClose').onclick = closeModal;
el('modal').addEventListener('click', e=>{ if(e.target.id==='modal') closeModal(); });
document.addEventListener('keydown', e=>{ if(e.key==='Escape') closeModal(); });
el('menuBtn').onclick = ()=> document.getElementById('sidebar').classList.toggle('open');

document.querySelectorAll('.nav-item').forEach(item=>{
  item.addEventListener('click', e=>{
    const p = item.dataset.page;
    if(['dashboard','disbursements','staff'].includes(p)) return;
    e.preventDefault(); toast('This module is queued for build.','info');
    document.getElementById('sidebar').classList.remove('open');
  });
});

const secs=[...document.querySelectorAll('.sec')], chips=[...document.querySelectorAll('.snav')];
const spy=()=>{ let cur=secs[0]; for(const s of secs) if(s.getBoundingClientRect().top<=150) cur=s;
  chips.forEach(c=>c.classList.toggle('on', c.getAttribute('href')==='#'+cur.id)); };
window.addEventListener('scroll', spy, {passive:true});
chips.forEach(c=>c.addEventListener('click', e=>{
  e.preventDefault();
  const t=document.querySelector(c.getAttribute('href'));
  if(t) window.scrollTo({top:t.offsetTop-112, behavior:'smooth'});
}));

/* filters */
['fltSearch','fltFrom','fltTo','fltType','fltChannel','fltStatus','fltRecipient'].forEach(id=>{
  const h=()=>{ S.page=1; renderRegister(); };
  el(id).addEventListener('input',h); el(id).addEventListener('change',h);
});
el('fltReset').onclick = ()=>{ ['fltSearch','fltFrom','fltTo'].forEach(i=>el(i).value='');
  ['fltType','fltChannel','fltStatus','fltRecipient'].forEach(i=>el(i).value=''); S.page=1; renderRegister(); };

/* bulk + selection */
document.addEventListener('change', e=>{
  const cb = e.target.closest('[data-sel]');
  if(!cb) return;
  if(cb.checked) S.selected.add(cb.dataset.sel); else S.selected.delete(cb.dataset.sel);
});
el('selAll').addEventListener('change', e=>{
  const rows = filtered().slice((S.page-1)*S.size, S.page*S.size);
  if(e.target.checked) rows.forEach(n=>S.selected.add(n.ref)); else S.selected.clear();
  renderRegister();
});
el('bulkRead').onclick = ()=>{ if(!S.selected.size) return toast('Select notifications first','err');
  NTF.forEach(n=>{ if(S.selected.has(n.ref)) n.read=true; }); toast(`${S.selected.size} marked read`,'ok'); renderAll(); };
el('bulkUnread').onclick = ()=>{ if(!S.selected.size) return toast('Select notifications first','err');
  NTF.forEach(n=>{ if(S.selected.has(n.ref)) n.read=false; }); toast(`${S.selected.size} marked unread`,'ok'); renderAll(); };
el('bulkArchive').onclick = ()=>{ if(!S.selected.size) return toast('Select notifications first','err');
  NTF.forEach(n=>{ if(S.selected.has(n.ref)) n.archived=true; }); toast(`${S.selected.size} archived`,'info'); renderAll(); };
el('bulkExport').onclick = ()=>{
  const rows = S.selected.size ? NTF.filter(n=>S.selected.has(n.ref)) : filtered();
  exportCSV([['Reference','Category','Type','Recipient','Channel','Status','Created','Subject'],
    ...rows.map(n=>[n.ref,n.cat,n.type,n.recipient,n.channel,n.status,n.created,n.subject])],
    'golden-notifications-2026-10-30.csv');
};
el('exportAll').onclick = ()=> el('bulkExport').click();

/* send form */
document.querySelectorAll('#audienceSeg button').forEach(b=>{
  b.addEventListener('click', ()=>{
    document.querySelectorAll('#audienceSeg button').forEach(x=>x.classList.remove('on'));
    b.classList.add('on'); AUD = b.dataset.aud; renderSendForm();
  });
});
['sendChannel','sendRecipient','sendSubject','sendBody','sendWhen','sendAt'].forEach(id=>{
  el(id).addEventListener('input', updatePreview);
  el(id).addEventListener('change', updatePreview);
});
el('sendWhen').addEventListener('change', e=>{ el('sendAt').disabled = e.target.value==='Immediately'; });
el('sendTemplate').addEventListener('change', e=>{
  const tp = TEMPLATES.find(t=>t[0]===e.target.value);
  if(tp){ el('sendSubject').value = tp[1]; el('sendBody').value = tp[5]; el('sendChannel').value = tp[2]; updatePreview(); }
});
el('sendBtn').onclick = sendNotification;
el('previewBtn').onclick = ()=>{ updatePreview(); toast('Preview updated','info'); };
el('clearSend').onclick = ()=>{ el('sendSubject').value=''; el('sendBody').value=''; el('sendTemplate').value=''; updatePreview(); };

/* announcements */
el('publishAnn').onclick = publishAnnouncement;
el('clearAnn').onclick = ()=>{ el('annTitle').value=''; el('annBody').value=''; };
el('quickAnnounce').onclick = ()=> document.getElementById('s14').scrollIntoView({behavior:'smooth'});
el('annWhen').addEventListener('change', e=>{
  if(e.target.value==='Schedule') toast('Scheduled announcements use the automation sending window','info');
});

/* templates / automations / settings */
el('newTemplate').onclick = ()=>{
  const id = 'TPL-' + String(TEMPLATES.length+1).padStart(2,'0');
  TEMPLATES.push([id,'New template','SMS','Customer',false,'Type your approved wording here with {{first_name}} merge fields.']);
  renderTemplates(); editTemplate(TEMPLATES.length-1);
  toast('New template created','info');
};
el('automationSettings').onclick = ()=>{ document.getElementById('s12').scrollIntoView({behavior:'smooth'}); };
el('saveWindow').onclick = ()=> toast('Sending window updated','ok');
el('savePrefs').onclick = ()=> toast('Notification preferences saved','ok');
el('settingsSave').onclick = ()=> toast('Notification settings saved','ok');
el('settingsReset').onclick = ()=>{ renderSettings(); toast('Changes discarded','info'); };

/* audit + misc */
['auditSearch','auditAction'].forEach(id=>{
  el(id).addEventListener('input', renderAudit); el(id).addEventListener('change', renderAudit);
});
el('auditReset').onclick = ()=>{ el('auditSearch').value=''; el('auditAction').value=''; renderAudit(); };
el('auditExport').onclick = ()=>
  exportCSV([['Time','Reference','Action','User','Detail','IP','Outcome'], ...S.audit], 'golden-notification-audit.csv');
el('markAllRead').onclick = ()=>{ NTF.forEach(n=>n.read=true); renderAll(); toast('All notifications marked read','ok'); };
el('actAll').onclick = ()=> document.getElementById('s2').scrollIntoView({behavior:'smooth'});
el('bellBtn').onclick = ()=> document.getElementById('s2').scrollIntoView({behavior:'smooth'});
el('quickSend').onclick = ()=> document.getElementById('s9').scrollIntoView({behavior:'smooth'});
el('globalSearch').addEventListener('keydown', e=>{
  if(e.key==='Enter'){ el('fltSearch').value = e.target.value; S.page=1; renderRegister();
    document.getElementById('s2').scrollIntoView({behavior:'smooth'}); }
});
el('savePrefs').onclick = ()=> toast('Notification preferences saved','ok');

/* boot */
function renderAll(){
  renderOverview(); renderRegister(); renderTypeSection('Customer','custTypes','custList','custCount');
  renderTypeSection('Staff','staffTypes','staffList','staffCount');
  renderTypeSection('Loan','loanTypes','loanList','loanCount');
  renderTypeSection('Repayment','repayTypes','repayList','repayCount');
  renderTypeSection('Disbursement','disbTypes','disbList','disbCount');
  renderTypeSection('System','sysTypes','sysList','sysCount');
  renderSendForm(); renderChannels(); renderTemplates(); renderAutomations(); renderDelivery();
  renderAnnouncements(); renderPrefs(); renderReports(); renderAudit(); renderSettings();
}
window.NOTIF_APP = {NTF, TEMPLATES, CHANNELS, AUTOMATIONS, ANNOUNCEMENTS, S, renderAll, filtered, TYPES};
el('fltRecipient').innerHTML = '<option value="">All recipients</option>' +
  [...new Set(NTF.map(n=>n.recipient))].sort().map(r=>`<option>${r}</option>`).join('');
renderAll();
spy();
</script>
</body>
</html>
