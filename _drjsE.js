<script>
/* ============================================================
   DATA RECOVERY, SYSTEM BACKUP & FACTORY RESET (5/7)
   Sections 5–8: the four reset modes with their staged
   confirmation, the guards around a destructive run, the six
   disaster scenarios, and the recovery tests and health monitors.
   ============================================================ */

/* ===================== 5 · SAFE RESET MODES ===================== */
function renderModes(){
  const available = RESET_MODES.filter(m => m.available).length;
  if(el('modePill')){
    el('modePill').className = 'badge b-gray';
    el('modePill').textContent = available + ' of 4 modes available · D waits on review';
  }

  put('modesHost', RESET_MODES.map(m => {
    const tone = m.id.toLowerCase();
    const canRun = m.available;
    return `<div class="modecard ${tone}${canRun ? '' : ' locked'}">
      <div class="m-band"></div>
      <div class="m-top">
        <span class="ml">${esc(m.id)}</span>
        <div style="flex:1;min-width:0">
          <div class="mt">${esc(m.name)}</div>
          <div class="ms">${esc(m.summary)}</div>
        </div>
        <span class="badge ${m.risk === 'Low' ? 'b-ok' : m.risk === 'Medium' ? 'b-warn' : m.risk === 'High' ? 'b-warn' : 'b-crit'}">${esc(m.risk)}</span>
      </div>
      <div class="m-lists">
        <div><div class="mh">What it changes</div><ul>${m.changes.map(c =>
          `<li><span class="cross">✕</span><span>${esc(c)}</span></li>`).join('')}</ul></div>
        <div><div class="mh">What it preserves</div><ul>${m.preserves.map(c =>
          `<li><span class="tick">✓</span><span>${esc(c)}</span></li>`).join('')}</ul></div>
      </div>
      <div class="m-foot">
        <span class="inline-lock">🔒 ${esc(m.permission)}</span>
        <span class="badge b-plain" style="margin-left:auto">${esc(m.minutes)}</span>
        ${canRun
          ? `<button class="btn btn-ghost" data-dr="mode" data-mode="${esc(m.id)}" style="padding:4px 9px;font-size:9.5px">Start Mode ${esc(m.id)}</button>`
          : `<button class="btn btn-ghost" data-dr="modeLocked" data-mode="${esc(m.id)}" style="padding:4px 9px;font-size:9.5px">Disabled — review pending</button>`}
      </div>
      ${m.approval ? '<div class="qhint" style="margin-top:1px">A second person must approve this run.</div>' : ''}
    </div>`;
  }).join(''));

  const steps = ['Target and consequences', 'Reauthenticate', 'Type to confirm', 'Second approver', 'Run'];
  put('modeSteps', stepsBar(steps, DR.modePick ? DR.modeStep : -1));
  if(el('modeStepPill')){
    el('modeStepPill').textContent = DR.modePick ? 'Mode ' + DR.modePick + ' · step ' + Math.min(DR.modeStep + 1, 5) : 'idle';
    el('modeStepPill').className = 'badge ' + (DR.modePick ? 'b-warn' : 'b-gray');
  }
  renderModeWizard();

  put('modePreserve', MODE_PRESERVE.map(([what, note]) => checkRow('pass', esc(what), esc(note))).join(''));

  table('modeRoleBody', [
    {k:'role', label:'Role'},
    {k:'a', label:'Mode A', html:v => modeMark(v)},
    {k:'b', label:'Mode B', html:v => modeMark(v)},
    {k:'c', label:'Mode C', html:v => modeMark(v)},
    {k:'d', label:'Mode D', html:v => modeMark(v)}
  ], MODE_ROLES, {sort:'role', dir:'asc', pageSize:8});
}
function modeMark(v){
  if(v === 'Yes') return '<span class="tick">✓</span>';
  if(v === 'No') return '<span class="cross">✕</span>';
  return `<span class="badge b-warn">${esc(v)}</span>`;
}

function renderModeWizard(){
  const m = MODE_BY_ID[DR.modePick];
  if(!m){
    put('modeWizard', `<div class="empty">Choose a mode above. Nothing runs until every step has been completed.</div>`);
    return;
  }
  const env = ENV_BY_ID[DR.env];
  const head = `<div class="envbar ${env.tone === 'prod' ? 'prod' : ''}" style="margin-bottom:9px">
      <span class="envi ${env.tone}"><span class="d"></span>${esc(env.label)}</span>
      <div><div class="eb-t">Mode ${esc(m.id)} · ${esc(m.name)}</div>
        <div class="eb-s">${esc(env.host)}</div></div>
    </div>`;

  let body = '';
  if(DR.modeStep === 0){
    body = `<div class="minihead">What this run will change</div>
      <ul class="runbook">${m.changes.map(c => `<li>${esc(c)} — <b>changed</b></li>`).join('')}</ul>
      <div class="minihead">What it leaves alone</div>
      <ul class="runbook">${m.preserves.map(c => `<li>${esc(c)} — <b>preserved</b></li>`).join('')}</ul>
      <div class="form-actions"><button class="btn btn-gold" data-dr="modeNext">I understand — continue</button>
        <button class="btn btn-ghost" data-dr="modeAbort">Cancel</button></div>`;
  } else if(DR.modeStep === 1){
    body = `<div class="note gold"><div>Re-enter your password. A standing session is not accepted for a reset above Mode A.</div></div>
      <div class="form-grid" style="margin-top:9px">
        <div class="fg"><label>Your password</label><input id="mzPw" type="password" autocomplete="off" /></div>
        <div class="fg"><label>Your account</label><input value="${esc(staffName(OPERATOR))} · ${esc((STAFF_BY_ID[OPERATOR]||{}).role || '')}" disabled /></div>
      </div>
      <div class="qhint" id="mzMsg">Signed in as ${esc(staffName(OPERATOR))}. MFA is ${(STAFF_BY_ID[OPERATOR]||{}).mfa ? 'on' : 'off'} for this account.</div>
      <div class="form-actions"><button class="btn btn-gold" data-dr="modeNext">Reauthenticate</button>
        <button class="btn btn-ghost" data-dr="modeAbort">Cancel</button></div>`;
  } else if(DR.modeStep === 2){
    body = `<div class="note red"><div><b>${env.tone === 'prod' ? 'You are about to reset PRODUCTION.' : 'Confirm the reset target.'}</b>
        ${esc(m.summary)}</div></div>
      <div class="form-grid" style="margin-top:9px">
        <div class="fg"><label>Type <b>${esc(env.label.toUpperCase())}</b> to confirm</label>
          <input id="mzType" placeholder="${esc(env.label.toUpperCase())}" autocomplete="off" /></div>
        <div class="fg"><label>Reset mode</label><input value="Mode ${esc(m.id)} · ${esc(m.name)}" disabled /></div>
      </div>
      <div class="qhint" id="mzMsg">The environment name must match exactly. A mismatch stops the run here.</div>
      <div class="form-actions"><button class="btn btn-gold" data-dr="modeNext">Continue to approval</button>
        <button class="btn btn-ghost" data-dr="modeAbort">Cancel</button></div>`;
  } else if(DR.modeStep === 3){
    const needs = m.approval;
    body = `<div class="note gold"><div>${needs
        ? 'A second person must approve this run. The requester cannot approve their own reset.'
        : 'Mode A needs no second name: it touches only your own interface.'}</div></div>
      <div class="form-grid" style="margin-top:9px">
        ${needs ? `<div class="fg"><label>Approver</label><select id="mzApprover">
            <option value="">Choose a second name…</option>
            ${DR_STAFF.filter(s => s.id !== OPERATOR).map(s =>
              `<option value="${esc(s.id)}">${esc(s.name)} · ${esc(s.role)}</option>`).join('')}
          </select></div>` : ''}
        <div class="fg"><label>Reason (written to the audit trail)</label><input id="mzReason" placeholder="Why this reset is needed" /></div>
      </div>
      <div class="qhint" id="mzMsg">A recent verified copy exists (${esc((lastGood()||{}).id || '—')}), so the guard in section 6 will hold.</div>
      <div class="form-actions"><button class="btn ${env.tone === 'prod' ? 'btn-red' : 'btn-gold'}" data-dr="modeRun">
          ${needs ? 'Approve and run' : 'Run the reset'} · ${esc(env.label)}</button>
        <button class="btn btn-ghost" data-dr="modeAbort">Cancel</button></div>`;
  } else {
    body = `<div class="tl2">
        ${tlItem('ok', 'Reset complete', 'Mode ' + esc(m.id) + ' applied in ' + esc(env.label), drWhen(TODAY + ' ' + nowClock()))}
        ${tlItem('ok', 'Configuration written as one transaction', 'Nothing half-applied')}
        ${tlItem('ok', 'Audit record written outside the environment', 'It survives the run')}
      </div>
      <div class="form-actions"><button class="btn btn-ghost" data-dr="modeAbort">Done</button></div>`;
  }
  put('modeWizard', head + body);
}

function drStartMode(id){
  const m = MODE_BY_ID[id];
  if(!m) return;
  if(!m.available){
    openModal('Mode ' + id + ' is disabled', 'Full reinitialisation runs under a separate procedure',
      `<div class="note red"><div>Mode D destroys the database and rebuilds the environment. It is not offered as a button.
        It requires: a declared disaster or decommissioning, a written security review, a verified recovery point, a tested
        recovery plan, the Managing Director and the Head of Credit as two separate approvers, and a rehearsal in staging first.</div></div>
       <div class="minihead" style="margin-top:9px">Gates still open</div>
       ${GATES.filter(g => g.state === 'Blocked').map(g => checkRow('fail', esc(g.gate), esc(g.note))).join('')}`,
      [{label:'Close', act:'close'}]);
    return;
  }
  if(!m.available) return;
  DR.modePick = id;
  DR.modeStep = 0;
  renderModes();
  toast('Mode ' + id + ' staged — nothing has run yet', 'info');
}

function drModeNext(){
  const m = MODE_BY_ID[DR.modePick];
  if(!m) return;
  if(DR.modeStep === 1){
    const pw = (el('mzPw') && el('mzPw').value || '').trim();
    if(!pw){ toast('Enter your password to continue', 'err'); return; }
  }
  if(DR.modeStep === 2){
    const typed = (el('mzType') && el('mzType').value || '').trim();
    const want = ENV_BY_ID[DR.env].label.toUpperCase();
    if(typed !== want){ toast('Type ' + want + ' exactly to continue', 'err'); return; }
  }
  DR.modeStep = Math.min(DR.modeStep + 1, 4);
  renderModes();
}

function drModeAbort(){
  DR.modePick = '';
  DR.modeStep = 0;
  renderModes();
  toast('Staged reset discarded — nothing ran', 'info');
}

function drModeRun(){
  const m = MODE_BY_ID[DR.modePick];
  if(!m) return;
  const env = ENV_BY_ID[DR.env];
  const approver = m.approval ? fpVal('mzApprover', '') : '';
  const reason = (el('mzReason') && el('mzReason').value || '').trim();
  if(m.approval && !approver){ toast('A second approver is required', 'err'); return; }
  if(m.approval && approver === OPERATOR){ toast('The approver must be somebody else', 'err'); return; }
  if(!reason){ toast('A reason is required', 'err'); return; }

  const id = 'JOB-2026-' + pad(++jobSeq, 4);
  const key = m.id.toLowerCase() + '-' + checksumOf({id, when:TODAY}).slice(0,4) + '-' + env.id.slice(0,3);
  if(JOBS.some(j => j.key === key && /Running/.test(j.status))){
    toast('That request is already running — the lock refused a duplicate', 'err');
    return;
  }
  JOBS.unshift({id, mode:m.id, env:env.id, what:'Mode ' + m.id + ' · ' + m.name, status:'Success', progress:100,
    started:TODAY + ' ' + nowClock(), finished:TODAY + ' ' + nowClock(), by:OPERATOR,
    approvedBy:approver || '—', key, note:reason});
  NOTICES.unshift({when:TODAY + ' ' + nowClock(), event:'Reset finished', job:id, env:env.id,
    to:'Administrator' + (approver ? ', Head of Credit' : ''), channel:'Email', state:'Delivered'});
  NOTICES.unshift({when:TODAY + ' ' + nowClock(), event:'Reset started', job:id, env:env.id,
    to:'Administrator' + (approver ? ', Head of Credit, Internal Auditor' : ''), channel:'In-app', state:'Delivered'});
  drAudit('Reset', 'Mode ' + m.id + ' executed', 'previous ' + (m.id === 'B' ? 'configuration' : 'build') + ' state',
    'defaults applied · ' + env.label, reason, 'Reset');
  DR.modeStep = 4;
  renderAll();
  toast('Mode ' + m.id + ' finished on ' + env.label);
}

/* ===================== 6 · FACTORY RESET PROTECTION ===================== */
function renderProtection(){
  const env = ENV_BY_ID[DR.env];
  if(el('envPill')){ el('envPill').className = 'badge ' + (env.tone === 'prod' ? 'b-crit' : 'b-gray'); el('envPill').textContent = env.label; }
  put('envChips', ENVIRONMENTS.map(e =>
    `<button class="fchip${DR.env === e.id ? ' on' : ''}" data-dr="env" data-env="${esc(e.id)}">
       <span class="envi ${e.tone}" style="padding:1px 6px;font-size:8px"><span class="d"></span>${esc(e.label)}</span>
     </button>`).join(''));

  put('envDetail', kvList([
    ['Host', esc(env.host)],
    ['Data', esc(env.data)],
    ['Restore policy', esc(env.restorePolicy)],
    ['Warning', esc(env.warning)]
  ]) + (env.tone === 'prod'
    ? `<div class="note red" style="margin-top:8px"><div><b>Production.</b> Every destructive action here needs reauthentication,
        a typed environment name and a second approver. There is no one-click reset.</div></div>`
    : `<div class="note gold" style="margin-top:8px"><div>${esc(env.label)}. ${esc(env.warning)}</div></div>`));

  put('maintBox', `<div class="meterrow" style="border:0;padding:0"><div style="flex:1">
      <div class="sl"><b>${DR.maint ? 'Maintenance mode is ON' : 'Maintenance mode is off'}</b>
        <span>${DR.maint ? 'writes are paused' : 'transactions flow normally'}</span></div>
      <div class="qhint">${DR.maint
        ? 'New applications, repayments and disbursements are refused while the mode is on. Customer records stay readable.'
        : 'Switch this on before a restore so nothing is written into a database that is about to be replaced.'}</div>
    </div></div>
    <div class="form-actions"><button class="btn ${DR.maint ? 'btn-gold' : 'btn-ghost'}" data-dr="maint">
      ${DR.maint ? 'Lift maintenance mode' : 'Put ' + esc(env.label) + ' into maintenance mode'}</button></div>`);

  if(el('guardPill')) el('guardPill').textContent = GUARDS.length + ' of ' + GUARDS.length + ' holding';
  put('guardList', GUARDS.map(g => checkRow('pass', `<b>${esc(g.name)}</b>
    <div class="qhint" style="margin-top:1px">${esc(g.note)}</div>`, esc(g.state))).join(''));

  if(el('jobCount')) el('jobCount').textContent = JOBS.length + ' jobs';
  const running = JOBS.filter(j => j.status === 'Running');
  put('jobOut', running.length
    ? running.map(j => `<div class="risk"><div style="flex:1"><div class="rn">${esc(j.id)} · ${esc(j.what)}</div>
        <div class="rs">${esc(envLabel(j.env))} · started ${esc(drWhen(j.started))}</div>
        ${progBar(j.progress, 'warn')}</div><div class="rv">${j.progress}%<span>${esc(j.status)}</span></div></div>`).join('')
    : `<div class="qhint" style="margin-bottom:6px">No job is running. The lock is free, and a new request starts immediately.</div>`);

  table('jobBody', [
    {k:'id', label:'Job', html:v => `<span class="mono">${esc(v)}</span>`},
    {k:'mode', label:'Mode', html:v => `<span class="badge b-gray">${esc(v)}</span>`},
    {k:'env', label:'Environment', html:v => { const e = ENV_BY_ID[v]; return `<span class="envi ${e.tone}" style="font-size:8px">${esc(e.label)}</span>`; }},
    {k:'what', label:'Operation'},
    {k:'started', label:'Started', html:v => esc(drWhen(v))},
    {k:'by', label:'By', html:v => esc(staffName(v))},
    {k:'approvedBy', label:'Approved by', html:v => v === '—' ? '—' : esc(staffName(v))},
    {k:'status', label:'State', html:v => pill(v)},
    {k:'progress', label:'Progress', num:true, html:v => v + '%'}
  ], JOBS, {sort:'started', pageSize:6});

  if(el('ntfCount')) el('ntfCount').textContent = NOTICES.length + ' notices';
  table('ntfBody', [
    {k:'when', label:'When', html:v => esc(drWhen(v))},
    {k:'event', label:'Event'},
    {k:'env', label:'Environment', html:v => { const e = ENV_BY_ID[v]; return `<span class="envi ${e.tone}" style="font-size:8px">${esc(e.label)}</span>`; }},
    {k:'to', label:'Told'},
    {k:'channel', label:'Channel'},
    {k:'state', label:'Delivery', html:v => pill(v === 'Delivered' ? 'Passed' : v)}
  ], NOTICES, {sort:'when', pageSize:6});

  put('protNotes', PROTECT_NOTES.map(([h, t]) => checkRow('pass', `<b>${esc(h)}</b>
    <div class="qhint" style="margin-top:1px">${esc(t)}</div>`, '')).join(''));
}

const envLabel = id => (ENV_BY_ID[id] || {}).label || id;

function drSetEnv(id){
  if(DR.runningJob){ toast('A job is running — the environment is locked', 'err'); return; }
  DR.env = id;
  DR.modePick = ''; DR.modeStep = 0;
  renderAll();
  toast('Target set to ' + envLabel(id), 'info');
}

function drToggleMaint(){
  DR.maint = !DR.maint;
  drAudit('Configuration', 'Maintenance mode ' + (DR.maint ? 'enabled' : 'lifted'), DR.maint ? 'writes open' : 'writes paused',
    DR.maint ? 'writes paused' : 'writes open', 'Administrator switched maintenance mode in ' + envLabel(DR.env), 'Configuration');
  renderAll();
  toast('Maintenance mode ' + (DR.maint ? 'on — writes are paused' : 'off — transactions flow again'));
}

/* ===================== 7 · DISASTER SCENARIOS ===================== */
function renderScenarios(){
  const tested = SCENARIOS.filter(s => /SC-[1-3]/.test(s.id)).length;
  if(el('scPill')){ el('scPill').className = 'badge b-warn'; el('scPill').textContent = '4 of 6 rehearsed'; }
  put('scKpis', [
    ['Scenarios documented', num(SCENARIOS.length), 'Each with a runbook', ''],
    ['Rehearsed', '4', 'Two still to test', 'amber'],
    ['Longest RTO', '4 hours', 'Hosting outage', ''],
    ['Shortest RTO', '20 minutes', 'Failed deployment', ''],
    ['Worst RPO', '24 hours', 'When PITR is unavailable', 'amber'],
    ['Unrecoverable items', '7', 'Stated in plain terms', ''],
    ['Escalation stages', num(IR_RUNBOOK.length), 'Detect to review', ''],
    ['Last rehearsal', '27 Sep 2026', 'Mode D in staging', '']
  ].map(([l,v,s,k]) => kpiCard(l, v, s, k)).join(''));

  put('scHost', SCENARIOS.map(s => `<div class="tile ${s.tone}">
      <span class="tband"></span>
      <div class="tt">${esc(s.id)}</div>
      <div class="tv" style="font-size:12px">${esc(s.title)}</div>
      <div class="tx">${esc(s.route)}</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:2px">
        <span class="badge b-gray">RPO ${esc(s.rpo)}</span>
        <span class="badge b-gray">RTO ${esc(s.rto)}</span>
      </div>
      <div style="margin-top:4px"><button class="btn btn-ghost" data-dr="scenario" data-id="${esc(s.id)}"
        style="padding:3px 8px;font-size:9px">Open the runbook</button></div>
    </div>`).join(''));

  put('irRunbook', IR_RUNBOOK.map(([h, t]) => `<li><b>${esc(h)}.</b> ${esc(t)}</li>`).join(''));
  put('limitList', LIMITS.map(([h, t]) => checkRow('fail', `<b>${esc(h)}</b>
    <div class="qhint" style="margin-top:1px">${esc(t)}</div>`, '')).join(''));

  put('scGrid',
    chartCard({title:'Recovery time by scenario', sub:'How long the business is down', type:'bar',
      value:'4 h worst case',
      chart: chart({type:'bar', h:210, cats: SCENARIOS.map(s => s.id.replace('SC-','#')) ,
        series:[{name:'Minutes', colour:'#D64545', data: SCENARIOS.map(s => /hour/.test(s.rto) ? Math.round(parseFloat(s.rto)*60) : Math.round(parseFloat(s.rto)))}]})}) +
    chartCard({title:'Recovery point by scenario', sub:'How much work could be lost', type:'bar',
      value:'7 h on the clock',
      chart: chart({type:'bar', h:210, cats: SCENARIOS.map(s => s.id.replace('SC-','#')),
        series:[{name:'Hours', colour:'#C9A227', data: SCENARIOS.map(s => /24/.test(s.rpo) ? 24 : /7/.test(s.rpo) ? 7 : 0)}]})}) +
    chartCard({title:'Rehearsal coverage', sub:'Which scenarios have actually been tested', type:'donut',
      value:'4 of 6',
      chart: chart({type:'donut', h:210, cats:['Rehearsed','Still to test'],
        series:[{name:'Scenarios', data:[4, 2]}]})}));
}

function drScenario(id){
  const s = SC_BY_ID[id];
  if(!s) return;
  openModal(s.title, s.id + ' · RPO ' + s.rpo + ' · RTO ' + s.rto,
    `<div class="note gold" style="margin-bottom:9px"><div><b>Route.</b> ${esc(s.route)}</div></div>
     <div class="minihead">What can be recovered</div>
     ${s.recoverable.map(r => checkRow('pass', esc(r), '')).join('')}
     <div class="minihead">What cannot, and the provider limit</div>
     ${s.limits.map(r => checkRow('fail', esc(r), '')).join('')}
     <div class="minihead">Step by step</div>
     <ul class="runbook">${s.steps.map(st => `<li>${esc(st)}</li>`).join('')}</ul>`,
    [{label:'Print the runbook', act:() => printRows(s.title + ' · runbook',
        [{label:'#', num:true},{label:'Step', num:false}], s.steps.map((st, i) => [i+1, st]))},
     {label:'Close', act:'close'}]);
}

/* ===================== 8 · TESTING AND HEALTH ===================== */
function renderTesting(){
  const passed = TESTS.filter(t => t.result === 'Passed').length;
  if(el('tstPill')){ el('tstPill').className = 'badge ' + (passed >= 4 ? 'b-ok' : 'b-warn');
    el('tstPill').textContent = passed + ' of ' + TESTS.length + ' tests passed'; }
  put('tstKpis', [
    ['Tests recorded', num(TESTS.length), 'Every rehearsal, failed ones included', ''],
    ['Passed', num(passed), 'Verified by a restore, not by a status', 'green'],
    ['Partial or failed', num(TESTS.filter(t => t.result !== 'Passed').length), 'Both corrected and recorded', 'amber'],
    ['Next test due', '27 Dec 2026', 'Quarterly cadence', ''],
    ['Last test', '27 Sep 2026', 'Passed in staging', ''],
    ['Smoke tests', num(SMOKE.length), 'Login, records, reports', ''],
    ['Monitors', num(HEALTH.length), 'Watched continuously', ''],
    ['RPO / RTO', '7 h · 4 h', 'Agreed with the board', '']
  ].map(([l,v,s,k]) => kpiCard(l, v, s, k)).join(''));

  if(el('tstCount')) el('tstCount').textContent = TESTS.length + ' tests';
  table('tstBody', [
    {k:'when', label:'When', html:v => esc(drWhen(v))},
    {k:'env', label:'Environment', html:v => `<span class="envi ${(ENV_BY_ID[v]||{}).tone || 'dev'}" style="font-size:8px">${esc(envLabel(v))}</span>`},
    {k:'point', label:'Copy tested', html:v => `<span class="mono">${esc(v)}</span>`},
    {k:'result', label:'Result', html:v => pill(v)},
    {k:'duration', label:'Took'},
    {k:'rows', label:'Rows', num:true},
    {k:'failures', label:'Failures'},
    {k:'action', label:'Corrective action'}
  ], TESTS, {sort:'when', pageSize:6});

  put('smokeList', SMOKE.map(t => checkRow(DR.smokeRun ? t.state : 'pending',
    `<b>${esc(t.name)}</b><div class="qhint" style="margin-top:1px">Expects ${esc(t.expect)}</div>`,
    DR.smokeRun ? esc(t.detail) : 'not run')).join(''));
  if(el('smokePill')) el('smokePill').textContent = DR.smokeRun ? SMOKE.length + ' of ' + SMOKE.length + ' passed' : 'not run';

  put('verifyHost', VERIFY_AFTER.map(([label, note, tone]) => checkRow(tone,
    `<b>${esc(label)}</b><div class="qhint" style="margin-top:1px">${esc(note)}</div>`, '')).join(''));

  put('objHost', OBJECTIVES.map(([l, v, s, tone]) => tile(l, esc(v), esc(s), tone)).join(''));

  if(el('healthPill')) el('healthPill').textContent = 'watched';
  put('healthList', HEALTH.map(h => `<div class="meterrow"><div style="flex:1;min-width:0">
      <div class="sl"><b>${esc(h.name)}</b><span>${num(h.value)}${h.unit ? ' ' + h.unit : ''} of ${num(h.max)}${h.unit ? ' ' + h.unit : ''}</span></div>
      <div class="meter"><i class="${h.tone === 'warn' ? 'warn' : h.tone === 'bad' ? 'bad' : ''}"
        style="width:${clamp(h.value/h.max*100, 3, 100)}%"></i></div>
      <div class="qhint" style="margin-top:3px">${esc(h.note)}</div></div></div>`).join(''));

  put('tstGrid',
    chartCard({title:'Test outcomes over time', sub:'A green backup is not a green restore', type:'bar',
      value: passed + ' passed',
      chart: chart({type:'bar', h:200, cats: TESTS.slice().reverse().map(t => fmtShort(t.when)),
        series:[{name:'Failures found', colour:'#D64545', data: TESTS.slice().reverse().map(t => Number(t.failures) || 0)}]})}) +
    chartCard({title:'Restore duration', sub:'Minutes spent restoring in staging', type:'bar',
      value:'41 min average',
      chart: chart({type:'bar', h:200, cats: TESTS.slice().reverse().map(t => fmtShort(t.when)),
        series:[{name:'Minutes', colour:'#2F6FED', data: TESTS.slice().reverse().map(t => {
          const m = String(t.duration).match(/(\d+)\s*h?\s*(\d+)?/); return m ? Number(m[1]) * (/h/.test(t.duration) ? 60 : 1) + Number(m[2] || 0) : 40; })}]})}) +
    chartCard({title:'Data verified per test', sub:'Rows counted against the recovery point', type:'bar',
      value:'183k average',
      chart: chart({type:'bar', h:200, cats: TESTS.slice().reverse().map(t => fmtShort(t.when)),
        series:[{name:'Rows', colour:'#1E9E6A', data: TESTS.slice().reverse().map(t => Number(String(t.rows).replace(/[^\d]/g,'')) || 0)}]})}));
}

function drScheduleTest(){
  const when = addDays(TODAY, 58);
  TESTS.unshift({when:when + ' 08:00', env:'staging', point:(lastGood()||{}).id || '—', result:'Pending',
    duration:'—', rows:'—', failures:'—', action:'Scheduled from the admin portal; a verified copy is reserved for it'});
  drAudit('Configuration', 'Recovery test scheduled', 'no test booked', fmtDate(when) + ' in staging',
    'Quarterly rehearsal booked', 'Configuration');
  renderAll();
  if(el('tstMsg')) el('tstMsg').textContent = 'A restore rehearsal is booked for ' + fmtDate(when) +
    ' in staging against ' + ((lastGood()||{}).id || 'the next verified copy') + '. It is not evidence until it passes.';
  toast('Test scheduled for ' + fmtDate(when));
}

function drRunSmoke(){
  DR.smokeRun = true;
  SMOKE.forEach(s => { s.state = 'Pass'; });
  drAudit('Restore', 'Smoke tests run', '0 tests', SMOKE.length + ' passed', 'Post-recovery smoke test', 'Restore');
  renderAll();
  if(el('smokeMsg')) el('smokeMsg').textContent = 'All ' + SMOKE.length + ' smoke tests passed: customer and staff login, ' +
    'loan and repayment records, reports and the fee book. Maintenance mode can be lifted.';
  toast('Smoke tests passed — ' + SMOKE.length + ' of ' + SMOKE.length);
}
</script>
