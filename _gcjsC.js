/* ============================================================
   GUARANTORS & COLLATERAL (3/3)
   Sections 8–14 and the wiring: filters, exports, modal,
   coverage check, deep links and the initial render.
   ============================================================ */

/* ---------------- 8 · TITLE & CHARGE ---------------- */
function renderTitle(){
  const cols = [
    { k:'id', label:'Security ID' },
    { k:'desc', label:'Asset' },
    { k:'reg', label:'Title / registration' },
    { k:'owner', label:'Registered owner' },
    { k:'search', label:'Registry search', html:v => badge(v, v === 'Clean' ? 'b-ok' : 'b-crit') },
    { k:'charge', label:'Charge', html:v => badge(v) },
    { k:'stamp', label:'Stamp duty', html:v => v ? badge('Paid', 'b-ok') : badge('Outstanding', 'b-warn') },
    { k:'perfect', label:'Perfected', html:(v, r) => (r.charge === 'Charged' && r.search === 'Clean' && r.stamp) ? badge('Perfected', 'b-ok') : badge('Not perfected', 'b-warn') }
  ];
  renderTable('tBody', cols, COLLATERAL.map(c => ({ ...c, perfect:'' })), { onOpen: openCollateral });
  const enc = COLLATERAL.filter(c => c.search !== 'Clean' || c.charge !== 'Charged' || !c.stamp);
  put('tPill', (COLLATERAL.length - enc.length) + ' of ' + COLLATERAL.length + ' perfected');
  put('tNotes', enc.length ? enc.map(c => `
    <div class="risk"><div><div class="rn">${esc(c.type)} · ${esc(c.reg)}</div>
      <div class="rs">${esc(c.owner)} · ${esc([c.search !== 'Clean' ? 'registry search ' + c.search.toLowerCase() : '', c.charge !== 'Charged' ? 'charge ' + c.charge.toLowerCase() : '', !c.stamp ? 'stamp duty outstanding' : ''].filter(Boolean).join(' · '))}</div></div>
      <div class="rv">${badge(c.status)}</div></div>`).join('')
    : '<div class="empty" style="padding:18px 0">Every security is searched, charged and stamped.</div>');
}

/* ---------------- 9 · INSURANCE ---------------- */
function renderInsurance(){
  const f = el('insFilter');
  if(f && !f.options.length) f.innerHTML = '<option value="">Every policy state</option><option value="due">Expiring in 45 days</option><option value="expired">Expired</option><option value="none">Not insured</option>';
  let rows = COLLATERAL.map(c => ({ ...c, days: insExpiring(c.insExpiry) }));
  if(f && f.value === 'due') rows = rows.filter(r => r.days !== null && r.days >= 0 && r.days <= 45);
  if(f && f.value === 'expired') rows = rows.filter(r => r.days !== null && r.days < 0);
  if(f && f.value === 'none') rows = rows.filter(r => !r.insured);
  const cols = [
    { k:'id', label:'Security ID' },
    { k:'type', label:'Type' },
    { k:'insurer', label:'Insurer' },
    { k:'policy', label:'Policy' },
    { k:'cover', label:'Cover', num:true, html:v => v ? money(v) : '—' },
    { k:'valuation', label:'Market value', num:true, html:v => money(v) },
    { k:'insExpiry', label:'Expires', html:v => v ? fmtDate(v) : '—' },
    { k:'days', label:'Days left', num:true, html:v => v === null ? '—' : `<b style="color:${v < 0 ? '#A62424' : v <= 45 ? '#8A5B08' : '#116B49'}">${num(v)}</b>` },
    { k:'state', label:'State', html:(v, r) => !r.insured ? badge('Not insured', 'b-crit') : r.days < 0 ? badge('Expired', 'b-crit') : r.days <= 45 ? badge('Renewal due', 'b-warn') : badge('Current', 'b-ok') }
  ];
  renderTable('insBody', cols, rows.map(r => ({ ...r, state:'' })), { onOpen: openCollateral });
  put('insPill', COLLATERAL.filter(c => c.insured).length + ' insured · ' + COLLATERAL.filter(c => !c.insured).length + ' not');
}

/* ---------------- 10 · CUSTODY ---------------- */
function renderCustody(){
  const f = el('cusFilter');
  if(f && !f.options.length) f.innerHTML = '<option value="">Every custody state</option><option value="due">Inspection overdue</option><option value="held">Held by the lender</option><option value="borrower">With the borrower</option>';
  let rows = COLLATERAL.map(c => ({ ...c, overdue: daysBetween(c.nextInsp, TODAY) }));
  if(f && f.value === 'due') rows = rows.filter(r => r.overdue > 0);
  if(f && f.value === 'held') rows = rows.filter(r => /branch|vault|safe/i.test(r.custody));
  if(f && f.value === 'borrower') rows = rows.filter(r => /borrower|third/i.test(r.custody));
  const cols = [
    { k:'id', label:'Security ID' },
    { k:'type', label:'Type' },
    { k:'desc', label:'Asset' },
    { k:'custody', label:'Held by' },
    { k:'condition', label:'Condition', html:v => badge(v, /Good|Held/.test(v) ? 'b-ok' : v === 'Fair' ? 'b-warn' : 'b-crit') },
    { k:'photos', label:'Photographs', num:true, html:v => v ? num(v) : '—' },
    { k:'lastInsp', label:'Last inspected', html:v => fmtDate(v) },
    { k:'nextInsp', label:'Next due', html:v => fmtDate(v) },
    { k:'overdue', label:'Overdue by', num:true, html:v => v > 0 ? `<b style="color:#A62424">${num(v)} d</b>` : badge('On schedule', 'b-ok') }
  ];
  renderTable('cusBody', cols, rows, { sort:'overdue', onOpen: openCollateral });
  put('cusPill', rows.filter(r => r.overdue > 0).length + ' overdue');
}

/* ---------------- 11 · COVERAGE ---------------- */
function renderCoverage(){
  put('covTiles', COVER.map(c => {
    const gp = clamp(pct(c.guarantee, Math.max(c.exposure, 1)), 0, 100);
    const sp = clamp(pct(c.security, Math.max(c.exposure, 1)), 0, 100 - gp);
    const gapP = Math.max(0, 100 - gp - sp);
    return `<div class="extile">
      <div class="exh"><div><div class="exn">${esc(c.loan.borrower)}</div><div class="exb">${esc(c.loan.id)} · ${esc(c.loan.product)}</div></div>
        ${badge(c.gap > 0 ? 'Short' : 'Covered', c.gap > 0 ? 'b-crit' : 'b-ok')}</div>
      <div class="exv">${money(c.exposure)}</div>
      <div class="exseg"><i style="background:#C9A227;width:${gp.toFixed(1)}%"></i><i style="background:#1E9E6A;width:${sp.toFixed(1)}%"></i><i style="background:#D93F3F;width:${gapP.toFixed(1)}%"></i></div>
      <div class="exleg"><span>Guarantee <b>${money(c.guarantee)}</b></span><span>Security <b>${money(c.security)}</b></span><span>Gap <b>${money(c.gap)}</b></span></div>
    </div>`;
  }).join(''));

  const cols = [
    { k:'id', label:'Loan' },
    { k:'borrower', label:'Borrower' },
    { k:'guarantors', label:'Guarantors' },
    { k:'assets', label:'Assets pledged' },
    { k:'outstanding', label:'Outstanding', num:true, html:v => money(v) },
    { k:'guarantee', label:'Guarantee', num:true, html:v => money(v) },
    { k:'security', label:'Realisable security', num:true, html:v => money(v) },
    { k:'ratio', label:'Cover', num:true, html:v => `<b style="color:${v >= 100 ? '#116B49' : v >= 75 ? '#8A5B08' : '#A62424'}">${r1(v)}%</b>` },
    { k:'gap', label:'Shortfall', num:true, html:v => v ? `<b style="color:#A62424">${money(v)}</b>` : '—' }
  ];
  const rows = COVER.map(c => ({
    id:c.loan.id, borrower:c.loan.borrower,
    guarantors:guarantorsOfLoan(c.loan.id).map(g => g.name).join(', ') || '—',
    assets:collateralOfLoan(c.loan.id).map(x => x.type).join(', ') || '—',
    outstanding:c.exposure, guarantee:c.guarantee, security:c.security, ratio:c.ratio, gap:c.gap
  }));
  renderTable('covBody', cols, rows, { sort:'ratio', onOpen:r => { const c = coverOf(r.id); openModal(r.id, 'Coverage detail', `
    <div class="recgrid">
      <div class="pfield"><div class="pk">Borrower</div><div class="pv">${esc(c.loan.borrower)}</div></div>
      <div class="pfield"><div class="pk">Outstanding</div><div class="pv">${money(c.exposure)}</div></div>
      <div class="pfield"><div class="pk">Enforceable guarantee</div><div class="pv">${money(c.guarantee)}</div></div>
      <div class="pfield"><div class="pk">Realisable security</div><div class="pv">${money(c.security)}</div></div>
      <div class="pfield"><div class="pk">Cover</div><div class="pv">${r1(c.ratio)}% · ${c.gap ? money(c.gap) + ' short' : 'fully covered'}</div></div>
    </div>`, [{ label:'Close', act:'close', cls:'btn-gold' }]); }});
  put('covPill', COVER.filter(c => c.ratio >= 100).length + ' of ' + LOANS.length + ' fully covered');
}

/* ---------------- 12 · RELEASE ---------------- */
const STEPS = [
  ['Settlement confirmed', 'The final instalment clears and the loan shows zero'], 
  ['No outstanding fees', 'Fees, penalties and storage charges settled'],
  ['Guarantor discharge letter', 'Deed of guarantee marked discharged and the guarantor told in writing'],
  ['Charge removal lodged', 'Discharge lodged with the registry or the bank lien lifted'],
  ['Title and keys returned', 'Documents handed over against a signed receipt'],
  ['System updated', 'Security and guarantee statuses set to Released; coverage recalculated'],
  ['Certificate issued', 'A release certificate is filed on the customer record']
];
const RELEASES = [
  { id:'REL-2026-014', loan:'LN-2025-0092', party:'Grace Mtemang\'ombe', kind:'Guarantor discharge', asked:'2026-10-18', stage:'Charge removal lodged', status:'In progress' },
  { id:'REL-2026-015', loan:'LN-2025-0118', party:'Blessings Tembo',     kind:'Collateral release',   asked:'2026-10-22', stage:'Settlement confirmed',  status:'In progress' },
  { id:'REL-2026-016', loan:'LN-2026-0101', party:'Henry Chikondi',       kind:'Substitution',         asked:'2026-10-25', stage:'Awaiting new guarantor', status:'Pending' },
  { id:'REL-2026-017', loan:'LN-2025-0043', party:'Esnart Nyirenda',      kind:'Partial discharge',    asked:'2026-10-27', stage:'Valuation of remaining security', status:'Pending' },
  { id:'REL-2026-018', loan:'LN-2025-0071', party:'Isaac Mponda',         kind:'Guarantor discharge',  asked:'2026-10-29', stage:'Certificate issued',    status:'Complete' }
];
function renderRelease(){
  put('relFlow', STEPS.map((s, i) => `<div class="fstep"><div class="fd">${i + 1}</div><div><div class="ft">${esc(s[0])}</div><div class="fq">${esc(s[1])}</div></div></div>`).join(''));
  const cols = [
    { k:'id', label:'Request' }, { k:'loan', label:'Loan' }, { k:'party', label:'Party released' },
    { k:'kind', label:'Kind' }, { k:'asked', label:'Asked on', html:v => fmtDate(v) },
    { k:'stage', label:'At step' }, { k:'status', label:'Status', html:v => badge(v) }
  ];
  renderTable('relBody', cols, RELEASES, { onOpen:r => openModal(r.id, r.kind, `
    <div class="recgrid">
      <div class="pfield"><div class="pk">Loan</div><div class="pv">${esc(r.loan)}</div></div>
      <div class="pfield"><div class="pk">Party</div><div class="pv">${esc(r.party)}</div></div>
      <div class="pfield"><div class="pk">Asked on</div><div class="pv">${esc(fmtDate(r.asked))}</div></div>
      <div class="pfield"><div class="pk">At step</div><div class="pv">${esc(r.stage)}</div></div>
      <div class="pfield"><div class="pk">Status</div><div class="pv">${esc(r.status)}</div></div>
    </div>`, [{ label:'Close', act:'close', cls:'btn-gold' }]) });
  put('relPill', RELEASES.filter(r => r.status !== 'Complete').length + ' open');
  put('relCount', String(RELEASES.filter(r => r.status !== 'Complete').length));
}

/* ---------------- 13 · FLAGS ---------------- */
function buildFlags(){
  const out = [];
  GUARANTORS.filter(g => !g.signature).forEach(g => out.push({
    level:'hi', icon:'!', name:'Guarantee not signed', sub:`${g.name} stands behind ${money(g.committed)} on ${g.loan} but no signature is on file.`, action:'Get the deed signed'
  }));
  GUARANTORS.filter(g => g.status === 'Watchlist').forEach(g => out.push({
    level:'hi', icon:'!', name:'Guarantor on the watchlist', sub:`${g.name} is in arrears on his own facility and guarantees ${g.loan}.`, action:'Review the guarantee'
  }));
  GUARANTORS.filter(g => g.status === 'Expired').forEach(g => out.push({
    level:'md', icon:'↻', name:'Guarantor KYC expired', sub:`${g.name} needs income evidence refreshed for ${g.loan}.`, action:'Refresh KYC'
  }));
  GUARANTORS.filter(g => chargeShare(g) > 40).forEach(g => out.push({
    level: chargeShare(g) > 60 ? 'hi' : 'md', icon:'%', name:'Guarantor over-committed', sub:`${g.name} would commit ${r1(chargeShare(g))}% of annual income to guarantees.`, action:'Reduce or substitute'
  }));
  COLLATERAL.filter(c => c.search !== 'Clean').forEach(c => out.push({
    level:'hi', icon:'⚖', name:'Prior encumbrance on title', sub:`${c.type} ${c.reg} shows a registry search result of "${c.search}".`, action:'Obtain discharge'
  }));
  COLLATERAL.filter(c => c.charge !== 'Charged').forEach(c => out.push({
    level:'hi', icon:'✕', name:'Charge not perfected', sub:`${c.type} ${c.reg} is ${c.charge.toLowerCase()} — the lender has no registered security.`, action:'Perfect the charge'
  }));
  COLLATERAL.filter(c => { const d = insExpiring(c.insExpiry); return d !== null && d <= 45; }).forEach(c => out.push({
    level: insExpiring(c.insExpiry) < 0 ? 'hi' : 'md', icon:'☂', name: insExpiring(c.insExpiry) < 0 ? 'Insurance expired' : 'Insurance expiring', sub:`${c.type} ${c.reg} · ${c.policy} ${insExpiring(c.insExpiry) < 0 ? 'expired' : 'expires in ' + insExpiring(c.insExpiry) + ' days'}.`, action:'Chase renewal'
  }));
  COLLATERAL.filter(c => daysBetween(c.nextInsp, TODAY) > 0).forEach(c => out.push({
    level:'md', icon:'⌕', name:'Inspection overdue', sub:`${c.type} ${c.reg} was due for inspection ${daysBetween(c.nextInsp, TODAY)} days ago.`, action:'Schedule inspection'
  }));
  COLLATERAL.filter(c => valAge(c) > 365).forEach(c => out.push({
    level:'md', icon:'₤', name:'Valuation out of date', sub:`${c.type} ${c.reg} was valued ${num(valAge(c))} days ago.`, action:'Revalue'
  }));
  COLLATERAL.filter(c => c.condition === 'Poor').forEach(c => out.push({
    level:'md', icon:'△', name:'Security in poor condition', sub:`${c.type} ${c.reg} is recorded as poor; recovery value is uncertain.`, action:'Re-inspect'
  }));
  COVER.filter(c => c.gap > 0).forEach(c => out.push({
    level: c.ratio < 75 ? 'hi' : 'md', icon:'!', name:'Loan under-covered', sub:`${c.loan.id} · ${c.loan.borrower} is ${money(c.gap)} short of cover at ${r1(c.ratio)}%.`, action:'Add security or guarantee'
  }));
  COLLATERAL.filter(c => c.type === 'Household goods').forEach(c => out.push({
    level:'lo', icon:'i', name:'Security of low realisable value', sub:`${c.type} on ${c.loan} is unlikely to recover much at forced sale.`, action:'Consider stronger security'
  }));
  return out;
}
function renderFlags(){
  const f = el('fLevel');
  if(f && !f.options.length) f.innerHTML = '<option value="">Every level</option><option value="hi">High</option><option value="md">Medium</option><option value="lo">Low</option>';
  const all = buildFlags();
  const rows = (f && f.value) ? all.filter(x => x.level === f.value) : all;
  put('fCount', rows.length + ' flag(s)');
  put('fPill', all.filter(x => x.level === 'hi').length + ' high');
  put('flagList', rows.length ? rows.map(x => `
    <div class="flag ${x.level}">
      <div class="fi">${esc(x.icon)}</div>
      <div style="min-width:0"><div class="fn">${esc(x.name)}</div><div class="fs">${esc(x.sub)}</div></div>
      <div class="fa">${badge(x.action, x.level === 'hi' ? 'b-crit' : x.level === 'md' ? 'b-warn' : 'b-blue')}</div>
    </div>`).join('') : '<div class="empty" style="padding:18px 0">No flags at this level.</div>');
}

/* ---------------- 14 · REPORTS ---------------- */
const REPORTS = [
  { id:'guarantor-schedule', name:'Guarantor schedule', sub:'Every guarantor, the loan, the amount and the consent state', cols:G_COLS, rows:() => GUARANTORS },
  { id:'security-schedule', name:'Security schedule', sub:'Every pledged asset with valuation, charge and custody', cols:C_COLS, rows:() => COLLATERAL },
  { id:'coverage', name:'Coverage report', sub:'Exposure against guarantee and security, with the shortfall', cols:[
      { k:'id', label:'Loan' }, { k:'borrower', label:'Borrower' },
      { k:'exposure', label:'Outstanding', html:v => money(v) }, { k:'guarantee', label:'Guarantee', html:v => money(v) },
      { k:'security', label:'Security', html:v => money(v) }, { k:'ratio', label:'Cover %', html:v => r1(v) + '%' },
      { k:'gap', label:'Shortfall', html:v => money(v) }
    ], rows:() => COVER.map(c => ({ id:c.loan.id, borrower:c.loan.borrower, exposure:c.exposure, guarantee:c.guarantee, security:c.security, ratio:c.ratio, gap:c.gap })) },
  { id:'insurance-diary', name:'Insurance diary', sub:'Policies by expiry, 45-day renewal window', cols:[
      { k:'id', label:'Security' }, { k:'type', label:'Type' }, { k:'insurer', label:'Insurer' },
      { k:'policy', label:'Policy' }, { k:'cover', label:'Cover', html:v => v ? money(v) : '—' },
      { k:'insExpiry', label:'Expires', html:v => v ? fmtDate(v) : '—' }
    ], rows:() => COLLATERAL.filter(c => c.insured).sort((a, b) => String(a.insExpiry).localeCompare(String(b.insExpiry))) },
  { id:'flags', name:'Exceptions report', sub:'Every flag with the action it needs', cols:[
      { k:'level', label:'Level' }, { k:'name', label:'Flag' }, { k:'sub', label:'Detail' }, { k:'action', label:'Action' }
    ], rows:() => buildFlags() }
];
const AUDIT = [
  { when:'2026-10-30 09:12', kind:'Collateral', ref:'C-2026-005', actor:'G. Mtemang\'ombe', what:'Insurance renewal chased', from:'Expiring 21 days', to:'Chase logged' },
  { when:'2026-10-29 16:40', kind:'Guarantor',  ref:'G-2026-014', actor:'A. Mbewe',        what:'Status changed',            from:'Verified',           to:'Expired' },
  { when:'2026-10-29 11:05', kind:'Collateral', ref:'C-2026-013', actor:'T. Nkhoma',       what:'Revaluation requested',     from:'Valued 2025-09-18',  to:'Instruction issued' },
  { when:'2026-10-28 15:22', kind:'Guarantee',  ref:'G-2026-013', actor:'T. Nkhoma',       what:'Consent recorded',          from:'Not signed',         to:'Signature pending' },
  { when:'2026-10-28 10:18', kind:'Collateral', ref:'C-2026-006', actor:'A. Mbewe',        what:'Charge status',             from:'Pending',            to:'Pledged (unstamped)' },
  { when:'2026-10-27 14:31', kind:'Guarantor',  ref:'G-2026-006', actor:'T. Nkhoma',       what:'Watchlist flag added',      from:'Verified',           to:'Watchlist' },
  { when:'2026-10-27 09:44', kind:'Guarantee',  ref:'G-2026-011', actor:'G. Mtemang\'ombe', what:'Capacity recomputed',      from:'38.9%',              to:'40.4%' },
  { when:'2026-10-26 16:02', kind:'Collateral', ref:'C-2026-009', actor:'A. Mbewe',        what:'Charge registered',         from:'Pending',            to:'Charged' },
  { when:'2026-10-26 08:47', kind:'Release',    ref:'REL-2026-018', actor:'A. Mbewe',      what:'Certificate issued',        from:'In progress',        to:'Complete' },
  { when:'2026-10-25 13:15', kind:'Collateral', ref:'C-2026-015', actor:'G. Mtemang\'ombe', what:'Security rejected',        from:'Pledged',            to:'Rejected' }
];
function renderReports(){
  put('repGrid', REPORTS.map(r => `<div class="kpi">
      <div class="kl">${esc(r.name)}</div>
      <div class="ks" style="margin-top:3px">${esc(r.sub)}</div>
      <div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap">
        <button class="btn btn-ghost btn-sm" data-rep="${esc(r.id)}">Print</button>
        <button class="btn btn-ghost btn-sm" data-repcsv="${esc(r.id)}">CSV</button>
      </div></div>`).join(''));
  put('repGrid', el('repGrid').innerHTML + `<div class="kpi">
      <div class="kl">Whole module</div>
      <div class="ks" style="margin-top:3px">Both registers, every flag and every audit line in one workbook</div>
      <div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap">
        <button class="btn btn-gold btn-sm" id="repAll">Export everything</button>
      </div></div>`);
  el('repGrid').querySelectorAll('[data-rep]').forEach(b => b.onclick = () => {
    const r = REPORTS.find(x => x.id === b.dataset.rep);
    printTable(r.name, r.cols, r.rows());
  });
  el('repGrid').querySelectorAll('[data-repcsv]').forEach(b => b.onclick = () => {
    const r = REPORTS.find(x => x.id === b.dataset.repcsv);
    csvDownload(r.id + '.csv', r.cols, r.rows());
  });
  if(el('repAll')) el('repAll').onclick = () => {
    csvDownload('golden-guarantors-collateral.csv', [
      { k:'kind', label:'Register' }, { k:'ref', label:'Reference' }, { k:'name', label:'Party' },
      { k:'detail', label:'Detail' }, { k:'value', label:'Value' }, { k:'status', label:'Status' }
    ], [
      ...GUARANTORS.map(g => ({ kind:'Guarantor', ref:g.id, name:g.name, detail:g.loan + ' · ' + g.relation, value:money(g.committed), status:g.status })),
      ...COLLATERAL.map(c => ({ kind:'Collateral', ref:c.id, name:c.owner, detail:c.type + ' · ' + c.reg, value:money(c.valuation), status:c.status }))
    ]);
  };
  put('rPill', REPORTS.length + ' reports');

  const f = el('audKind');
  if(f && !f.options.length) f.innerHTML = '<option value="">Every kind</option>' + [...new Set(AUDIT.map(a => a.kind))].map(v => `<option>${esc(v)}</option>`).join('');
  const rows = (f && f.value) ? AUDIT.filter(a => a.kind === f.value) : AUDIT;
  renderTable('audBody', [
    { k:'when', label:'When' }, { k:'kind', label:'Kind' }, { k:'ref', label:'Reference' },
    { k:'actor', label:'Actor' }, { k:'what', label:'Change' }, { k:'from', label:'From' }, { k:'to', label:'To' }
  ], rows, { onOpen:r => openModal(r.ref, r.what, `
    <div class="recgrid">
      <div class="pfield"><div class="pk">When</div><div class="pv">${esc(r.when)}</div></div>
      <div class="pfield"><div class="pk">Kind</div><div class="pv">${esc(r.kind)}</div></div>
      <div class="pfield"><div class="pk">Reference</div><div class="pv">${esc(r.ref)}</div></div>
      <div class="pfield"><div class="pk">Actor</div><div class="pv">${esc(r.actor)}</div></div>
      <div class="pfield"><div class="pk">Change</div><div class="pv">${esc(r.from)} → ${esc(r.to)}</div></div>
    </div>`, [{ label:'Close', act:'close', cls:'btn-gold' }]) });
  put('audCount', String(rows.length));
}

/* ---------------- wiring ---------------- */
function renderAll(){
  renderOverview(); renderGuarantors(); renderKyc(); renderCapacity(); renderConsent();
  renderCollateral(); renderValuation(); renderTitle(); renderInsurance(); renderCustody();
  renderCoverage(); renderRelease(); renderFlags(); renderReports();
}

function wire(){
  const menu = el('menuBtn'), side = el('sidebar');
  if(menu && side) menu.onclick = () => side.classList.toggle('open');
  const close = el('modalClose'); if(close) close.onclick = closeModal;
  const modal = el('modal');
  if(modal) modal.addEventListener('click', e => { if(e.target === modal) closeModal(); });
  document.addEventListener('keydown', e => { if(e.key === 'Escape') closeModal(); });

  const gs = el('globalSearch');
  if(gs) gs.addEventListener('input', () => { renderGuarantors(); renderCollateral(); });

  ['gStatus','gRel','gDist'].forEach(id => { const n = el(id); if(n) n.onchange = renderGuarantors; });
  const gc = el('gClear');
  if(gc) gc.onclick = () => { ['gStatus','gRel','gDist'].forEach(id => { const n = el(id); if(n) n.value = ''; });
    if(gs) gs.value = ''; renderGuarantors(); renderCollateral(); toast('Filters cleared.', 'info'); };
  ['colType','colStatus','colOwner'].forEach(id => { const n = el(id); if(n) n.onchange = renderCollateral; });
  const cc = el('colClear');
  if(cc) cc.onclick = () => { ['colType','colStatus','colOwner'].forEach(id => { const n = el(id); if(n) n.value = ''; }); renderCollateral(); };
  ['capFilter','cConsent','valFilter','insFilter','cusFilter','fLevel','audKind'].forEach(id => {
    const n = el(id);
    if(n) n.onchange = () => {
      if(id === 'capFilter') renderCapacity();
      if(id === 'cConsent') renderConsent();
      if(id === 'valFilter') renderValuation();
      if(id === 'insFilter') renderInsurance();
      if(id === 'cusFilter') renderCustody();
      if(id === 'fLevel') renderFlags();
      if(id === 'audKind') renderReports();
    };
  });

  const ex = el('exportAll');
  if(ex) ex.onclick = () => csvDownload('guarantors.csv', G_COLS, GUARANTORS);
  const pr = el('printBtn');
  if(pr) pr.onclick = () => printTable('Guarantor Schedule', G_COLS, GUARANTORS);
  const ce = el('covExport');
  if(ce) ce.onclick = () => {
    const r = REPORTS.find(x => x.id === 'coverage');
    csvDownload('coverage.csv', r.cols, r.rows());
  };
  const cb = el('coverageBtn');
  if(cb) cb.onclick = () => {
    const short = COVER.filter(c => c.gap > 0);
    openModal('Coverage check', 'Guarantee plus realisable security against every open balance', `
      <div class="recgrid">
        <div class="pfield"><div class="pk">Loans checked</div><div class="pv">${LOANS.length}</div></div>
        <div class="pfield"><div class="pk">Fully covered</div><div class="pv">${COVER.filter(c => c.ratio >= 100).length}</div></div>
        <div class="pfield"><div class="pk">Short</div><div class="pv">${short.length}</div></div>
        <div class="pfield"><div class="pk">Total shortfall</div><div class="pv">${money(sum(short, c => c.gap))}</div></div>
      </div>
      ${short.length ? '<div class="minihead" style="margin-top:10px">Loans below 100% cover</div>' + short.map(c => `<div class="risk"><div><div class="rn">${esc(c.loan.id)} · ${esc(c.loan.borrower)}</div><div class="rs">${r1(c.ratio)}% covered · short ${money(c.gap)}</div></div></div>`).join('') : ''}
    `, [{ label:'Print coverage', act: () => { const r = REPORTS.find(x => x.id === 'coverage'); printTable(r.name, r.cols, r.rows()); } }, { label:'Close', act:'close', cls:'btn-gold' }]);
  };
  const ng = el('newGuarantor');
  if(ng) ng.onclick = () => openModal('Add a guarantor', 'The full undertaking, captured at the counter', `
    <div class="form-grid">
      <div class="fg"><label>Full name</label><input id="ngName" placeholder="As printed on the national ID" /></div>
      <div class="fg"><label>National ID number</label><input id="ngId" placeholder="e.g. LIL-4472-991" /></div>
      <div class="fg"><label>Phone</label><input id="ngPhone" placeholder="+265 …" /></div>
      <div class="fg"><label>District</label><input id="ngDist" placeholder="e.g. Lilongwe" /></div>
      <div class="fg"><label>Relationship to borrower</label><input id="ngRel" placeholder="Spouse, brother, director…" /></div>
      <div class="fg"><label>Occupation and employer</label><input id="ngJob" placeholder="e.g. Teacher · Ministry of Education" /></div>
      <div class="fg"><label>Monthly income (MK)</label><input id="ngIncome" type="number" min="0" /></div>
      <div class="fg"><label>Declared net worth (MK)</label><input id="ngWorth" type="number" min="0" /></div>
      <div class="fg"><label>Loan guaranteed</label><select id="ngLoan">${LOANS.map(l => `<option value="${esc(l.id)}">${esc(l.id)} · ${esc(l.borrower)}</option>`).join('')}</select></div>
      <div class="fg"><label>Amount guaranteed (MK)</label><input id="ngAmount" type="number" min="0" /></div>
      <div class="fg"><label>Existing guarantees (MK)</label><input id="ngOther" type="number" min="0" value="0" /></div>
      <div class="fg"><label>Officer</label><input id="ngOfficer" value="System Administrator" /></div>
    </div>
    <div class="qhint" style="margin-top:8px">The deed of guarantee and the signature are captured on the customer-facing application form; a guarantor stays
      <b>Pending</b> until identity, address, income, bureau and sanctions checks are all on file.</div>
  `, [
    { label:'Cancel', act:'close' },
    { label:'Add guarantor', cls:'btn-gold', act: () => {
        const name = (el('ngName').value || '').trim();
        if(!name){ toast('A guarantor needs a name.', 'err'); return; }
        const id = 'G-2026-' + pad(GUARANTORS.length + 1, 3);
        GUARANTORS.push({
          id, name, sex:'—', phone:el('ngPhone').value || '—', district:el('ngDist').value || '—',
          relation:el('ngRel').value || 'Other', occupation:el('ngJob').value || '—', employer:'—',
          income:Number(el('ngIncome').value) || 0, netWorth:Number(el('ngWorth').value) || 0,
          otherCommit:Number(el('ngOther').value) || 0, committed:Number(el('ngAmount').value) || 0,
          loan:el('ngLoan').value, idType:'National ID', idNo:el('ngId').value || '—',
          consent:TODAY, signature:false, witness:'—', advised:false, score:0, status:'Pending',
          added:TODAY, officer:el('ngOfficer').value || '—',
          kyc:{ id:!!el('ngId').value, photo:false, address:false, income:!!el('ngIncome').value, bureau:false, sanctions:false },
          assets:'Not yet declared', liabilities:'Not yet declared'
        });
        renderAll();
        closeModal();
        toast(name + ' added as ' + id + ' · Pending.');
      } }
  ]);
  const cr = el('cReprint');
  if(cr) cr.onclick = () => {
    const f = el('cConsent');
    const rows = (f && f.value === 'signed') ? GUARANTORS.filter(g => g.signature)
      : (f && f.value === 'unsigned') ? GUARANTORS.filter(g => !g.signature) : GUARANTORS;
    printTable('Deeds of Guarantee', [{ label:'Guarantor' }, { label:'Loan' }, { label:'Amount', html:g => money(g.committed) },
      { label:'Signed' }, { label:'Witness' }], rows.map(g => ({ name:g.name, loan:g.loan, committed:g.committed,
      signed:g.signature ? fmtDate(g.consent) : 'Not signed', witness:g.witness })));
  };

  /* subnav: mark the section in view, open deep links */
  const links = [...document.querySelectorAll('.subnav .snav')];
  const secs = [...document.querySelectorAll('section.sec')];
  links.forEach(a => a.addEventListener('click', e => {
    const t = document.querySelector(a.getAttribute('href'));
    if(!t) return;
    e.preventDefault();
    t.scrollIntoView({ behavior:'smooth', block:'start' });
    links.forEach(x => x.classList.remove('on')); a.classList.add('on');
  }));
  if('IntersectionObserver' in window){
    const io = new IntersectionObserver(es => es.forEach(en => {
      if(!en.isIntersecting) return;
      const id = '#' + en.target.id;
      links.forEach(a => a.classList.toggle('on', a.getAttribute('href') === id));
    }), { rootMargin:'-45% 0px -50% 0px' });
    secs.forEach(s => io.observe(s));
  }
}

if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { wire(); renderAll(); });
else { wire(); renderAll(); }
</script>
</body>
</html>
