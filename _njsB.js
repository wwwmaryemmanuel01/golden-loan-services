
/* ============================================================
   SECTION 1 · OVERVIEW
   ============================================================ */
function renderOverview(){
  const active = NTF.filter(n=>!n.archived);
  const unread = active.filter(n=>!n.read && ['Delivered','Sent'].includes(n.status)).length;
  const read = active.filter(n=>n.read && ['Delivered','Sent'].includes(n.status)).length;
  const pending = active.filter(n=>['Pending','Queued'].includes(n.status)).length;
  const delivered = active.filter(n=>n.status==='Delivered').length;
  const failed = active.filter(n=>n.status==='Failed').length;
  const cust = active.filter(n=>n.cat==='Customer').length;
  const staff = active.filter(n=>n.cat==='Staff').length;
  const sys = active.filter(n=>n.cat==='System').length;
  const rate = delivered + failed ? (delivered/(delivered+failed)*100).toFixed(1) : '100.0';

  el('bandTotal').textContent = active.length;
  el('bandUnread').textContent = unread;
  el('bandFailed').textContent = failed;
  el('bandRate').textContent = rate + '%';

  const tiles = [
    ['Total Notifications', active.length, 'All channels · last 30 days', 'doc', '', 'across 6 categories'],
    ['Unread Notifications', unread, 'Awaiting recipient action', 'alert', 'a', 'unread'],
    ['Read Notifications', read, 'Opened by recipients', 'check', 'g', 'read'],
    ['Pending Notifications', pending, 'Queued or not yet dispatched', 'card', 'p', 'in queue'],
    ['Successfully Delivered', delivered, `Delivery rate ${rate}%`, 'check', 'g', 'delivered'],
    ['Failed Notifications', failed, 'Provider rejections and errors', 'alert', 'r', 'needs retry'],
    ['Customer Notifications', cust, 'Borrower lifecycle messaging', 'users', 'b', 'customers'],
    ['Staff Notifications', staff, 'Internal operational alerts', 'users', 'p', 'staff'],
    ['System Alerts', sys, 'Security and infrastructure', 'alert', 'r', 'critical']
  ];
  el('ovTiles').innerHTML = tiles.map(([l,v,f,i,tone,tag])=>`
    <div class="card stat">
      <div class="stat-top"><div class="stat-label">${l}</div><div class="stat-ic ${tone}">${ICONS[i]}</div></div>
      <div class="stat-val">${nf(v)}</div>
      <div class="stat-foot"><span class="badge ${tag==='critical'||tag==='needs retry'?'b-rev':tag==='unread'?'b-pend':'b-appr'}">${tag}</span></div>
      <div class="tiny muted" style="margin-top:4px">${f}</div>
    </div>`).join('');

  el('ovActivity').innerHTML = active.slice(0,7).map(n=>`
    <tr>
      <td class="muted tiny" style="white-space:nowrap">${n.created.replace(' 2026','')}</td>
      <td class="tiny" style="font-weight:700">${n.ref}</td>
      <td class="tiny">${n.recipient}</td>
      <td class="tiny muted" style="max-width:250px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${n.subject}</td>
      <td class="tiny">${n.channel}</td>
      <td>${statusChip(n)}</td>
    </tr>`).join('');
}

const ICONS = {
  doc:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 3v5h5"/><path d="M19 8v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5Z"/></svg>',
  alert:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3 2.5 20h19L12 3Z"/><path d="M12 9v5M12 17.5h.01"/></svg>',
  check:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="m3 13 5 5L21 5"/></svg>',
  card:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2.5" y="6" width="19" height="13" rx="2.5"/><circle cx="12" cy="12.5" r="2.4"/></svg>',
  users:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="8" r="3.2"/><path d="M2.8 20a6.2 6.2 0 0 1 12.4 0"/><path d="M17 5.4a3.2 3.2 0 0 1 0 6.2M18.6 20a6.2 6.2 0 0 0-3-5.2"/></svg>'
};

/* ============================================================
   SECTION 2 · ALL NOTIFICATIONS
   ============================================================ */
function filtered(){
  const q=(el('fltSearch').value||'').toLowerCase();
  const from=el('fltFrom').value, to=el('fltTo').value;
  const type=el('fltType').value, ch=el('fltChannel').value, st=el('fltStatus').value,
        rc=el('fltRecipient').value;
  return NTF.filter(n=>{
    if(q && !(n.recipient+n.subject+n.body+n.ref+n.type).toLowerCase().includes(q)) return false;
    if(from || to){
      const d = isoOf(n.created);
      if(from && d < from) return false;
      if(to && d > to) return false;
    }
    if(type && n.cat!==type) return false;
    if(ch && n.channel!==ch) return false;
    if(rc && n.recipient!==rc) return false;
    if(st==='Unread' && !( !n.read && ['Delivered','Sent'].includes(n.status) && !n.archived )) return false;
    if(st==='Read' && !( n.read && ['Delivered','Sent'].includes(n.status) && !n.archived )) return false;
    if(st==='Archived' && !n.archived) return false;
    if(st && !['Unread','Read','Archived'].includes(st) && n.status!==st) return false;
    if(!st && n.archived) return false;
    return true;
  });
}
function isoOf(created){
  // 'created' looks like '30 Oct 2026 09:42' or '29 Oct 16:40'
  const m = created.match(/(\d{1,2}) (Oct|Nov|Dec|Sep) (?:2026 )?/);
  const day = m ? m[1].padStart(2,'0') : '30';
  return '2026-10-' + day;
}

function renderRegister(){
  const rows = filtered();
  const pages = Math.max(1, Math.ceil(rows.length/S.size));
  if(S.page>pages) S.page = pages;
  const slice = rows.slice((S.page-1)*S.size, S.page*S.size);
  el('allCount').textContent = rows.length + ' notification' + (rows.length===1?'':'s');
  el('allBody').innerHTML = slice.length ? slice.map(n=>`
    <tr class="${n.read?'':'sel'}">
      <td><input type="checkbox" data-sel="${n.ref}" ${S.selected.has(n.ref)?'checked':''} /></td>
      <td class="tiny" style="font-weight:700">${n.ref}</td>
      <td><div class="who"><div class="av">${initials(n.recipient)}</div>
        <div><div class="nm">${n.recipient}</div><div class="id">${n.rtype}</div></div></div></td>
      <td class="msg"><div class="tiny" style="font-weight:600;max-width:168px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${n.subject}</div>
        <div class="tiny muted" style="max-width:168px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${n.body}</div></td>
      <td class="tiny">${n.cat}</td>
      <td class="tiny">${n.channel}</td>
      <td>${statusChip(n)}</td>
      <td class="tiny muted">${n.created.replace(' 2026','')}</td>
      <td>
        <button class="btn btn-ghost btn-sm" data-act="view" data-ref="${n.ref}">View</button>
        <button class="btn btn-ghost btn-sm tick" data-act="toggle-read" data-ref="${n.ref}"
          title="${n.read?'Mark unread':'Mark read'}">${n.read?'○':'✓'}</button>
        <button class="btn btn-ghost btn-sm" data-act="archive" data-ref="${n.ref}">${n.archived?'Restore':'Archive'}</button>
      </td></tr>`).join('')
    : `<tr><td colspan="9"><div class="empty">No notifications match these filters.</div></td></tr>`;
  el('allPager').innerHTML = `
    <span>${rows.length} record${rows.length===1?'':'s'} · page ${S.page} of ${pages}</span>
    <button data-act="prev" ${S.page<=1?'disabled':''}>Prev</button>
    <button data-act="next" ${S.page>=pages?'disabled':''}>Next</button>`;
}

/* ============================================================
   SECTIONS 3–8 · TYPE GROUPS
   ============================================================ */
function renderTypeSection(cat, typesHost, listHost, countHost){
  const list = TYPES[cat] || [];
  el(countHost).textContent = NTF.filter(n=>n.cat===cat).length + ' sent';
  el(typesHost).innerHTML = list.map(([name,desc])=>{
    const n = NTF.filter(x=>x.type===name);
    return `<div class="tcard" data-act="quick-type" data-ref="${name}" data-cat="${cat}">
      <div class="th"><div class="ti" style="background:${CAT_COLORS[cat]}1A;color:${CAT_COLORS[cat]}">${CAT_ICON[cat]}</div>
        <div class="tn">${name}</div></div>
      <div class="tc">${desc}</div>
      <div class="tb"><span class="muted">Sent</span><span class="tn2">${n.length}</span></div>
    </div>`;
  }).join('');

  const recent = NTF.filter(n=>n.cat===cat).slice(0,5);
  el(listHost).innerHTML = recent.length ? recent.map(n=>`
    <div class="nitem ${n.read?'':'unread'}" data-act="view" data-ref="${n.ref}">
      <div class="nic" style="background:${CAT_COLORS[n.cat]}1A;color:${CAT_COLORS[n.cat]}">${CAT_ICON[n.cat]}</div>
      <div style="flex:1;min-width:0">
        <div class="nt">${n.subject} ${n.read?'':'<span class="udot"></span>'}</div>
        <div class="nb">${n.body}</div>
        <div class="nm2"><span>${n.recipient}</span><span>·</span><span>${n.channel}</span><span>·</span><span>${n.created}</span></div>
      </div>
      <div style="flex:0 0 auto">${statusChip(n)}</div>
    </div>`).join('')
    : '<div class="empty">No notifications in this category yet.</div>';
}

/* ============================================================
   SECTION 9 · SEND MANUAL NOTIFICATION
   ============================================================ */
let AUD = 'Customer';

function renderSendForm(){
  const opts = RECIPIENTS[AUD] || [];
  el('sendRecipient').innerHTML = opts.map(r=>`<option>${r}</option>`).join('');
  el('sendTemplate').innerHTML = `<option value="">— choose a template —</option>` +
    TEMPLATES.filter(t=>t[4]).map(t=>`<option value="${t[0]}">${t[1]} (${t[2]})</option>`).join('');
  el('recipientHint').textContent = AUD==='Customer' ? 'Individual customer with a verified contact number.'
    : AUD==='Staff' ? 'Individual staff member — delivered to their dashboard and email.'
    : 'Authorized customer group — bulk send with consent checks.';
  el('sendChannel').value = AUD==='Staff' ? 'Staff Dashboard' : AUD==='Customer' ? 'SMS' : 'SMS';
  updatePreview();
}

function updatePreview(){
  const subject = el('sendSubject').value || 'Your subject appears here';
  const body = el('sendBody').value || 'Your message will appear here as the recipient sees it.';
  const channel = el('sendChannel').value;
  el('pvSubject').textContent = subject;
  el('pvBody').textContent = body;
  el('pvChannel').textContent = channel;
  el('pvTo').textContent = 'To: ' + (el('sendRecipient').value || '—');
  el('pvTime').textContent = el('sendWhen').value === 'Immediately' ? 'Sending now' : (el('sendAt').value || 'Scheduled');
  el('pvFrom').textContent = channel === 'Email' ? 'no-reply@goldenfs.mw'
    : channel === 'SMS' ? 'GOLDEN FS' : 'Golden Financial Services';
  el('previewChannelSub').textContent = channel + ' preview' + (channel==='SMS' ? ' · 160 characters per segment' : '');

  const len = el('sendBody').value.length;
  el('smsSegments').textContent = `${len} / 160 (${Math.max(1,Math.ceil(len/160||1))} segment${len>160?'s':''})`;

  const ch = CHANNELS.find(c=>c.name===(channel==='Email'?'Email':channel==='SMS'?'SMS':channel==='In-App'?'In-App':channel));
  el('sendChecks').innerHTML = [
    ['Recipient selected', !!el('sendRecipient').value],
    ['Channel available', ch ? ch.enabled : true],
    ['Subject entered', el('sendSubject').value.trim().length>2],
    ['Message entered', el('sendBody').value.trim().length>5],
    ['Within consent / opt-in', true],
    ['Outside quiet hours (08:00–18:00)', true],
    ['Daily sending limit not exceeded', true]
  ].map(([t,ok])=>`<div class="check"><div class="ck ${ok?'y':'n'}">${ok?'✓':'✕'}</div><div><b>${t}</b></div></div>`).join('');
}

function sendNotification(){
  const subject = el('sendSubject').value.trim();
  const body = el('sendBody').value.trim();
  if(!subject) return toast('Enter a subject','err');
  if(!body) return toast('Enter a message','err');
  const channel = el('sendChannel').value;
  const when = el('sendWhen').value;
  const scheduled = when !== 'Immediately';
  const n = addN({
    ref:'NTF-'+(++S.seq), cat: AUD==='Customer' ? 'Customer' : AUD==='Staff' ? 'Staff' : 'Staff',
    type: 'Staff Announcement', recipient: el('sendRecipient').value,
    rtype: AUD, channel, status: scheduled ? 'Pending' : 'Sent',
    read:false, priority: el('sendPriority').value,
    created:'30 Oct 2026 ' + (scheduled ? (el('sendAt').value||'14:00').slice(11,16) : stamp()),
    subject, body, sender:'C. Mwale', template: el('sendTemplate').value, attempts:1, provider:''
  });
  S.audit.unshift([stamp(), n.ref, 'Created', 'C. Mwale',
    (scheduled?'Scheduled':'Sent') + ' manual ' + channel + ' to ' + n.recipient, '196.44.21.4', 'Success']);
  el('sendBadge').textContent = scheduled ? 'Scheduled' : 'Sent';
  toast(scheduled ? `Scheduled for ${el('sendAt').value.replace('T',' ')}` : `Notification sent to ${n.recipient}`, 'ok');
  renderAll(); renderAudit();
}

function quickCompose(cat, type){
  AUD = cat==='Staff' ? 'Staff' : 'Customer';
  document.querySelectorAll('#audienceSeg button').forEach(b=>b.classList.toggle('on', b.dataset.aud===AUD));
  renderSendForm();
  const tpl = TEMPLATES.find(t=>t[1].toLowerCase().includes(type.split(' ')[0].toLowerCase()));
  if(tpl) el('sendTemplate').value = tpl[0];
  el('sendSubject').value = type;
  el('sendBody').value = tpl ? tpl[5] : `Automated notice: ${type}. Please contact Golden Financial Services on 111 for assistance.`;
  updatePreview();
  document.getElementById('s9').scrollIntoView({behavior:'smooth'});
  toast(`Template loaded for “${type}”`, 'info');
}
