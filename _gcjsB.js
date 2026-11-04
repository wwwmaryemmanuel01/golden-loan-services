<script>
/* ============================================================
   GUARANTORS & COLLATERAL (2/3)
   Sections 1–7: overview, register, KYC, capacity, consent,
   collateral register and valuation.
   ============================================================ */

/* a horizontal bar list, used where a full chart would be overkill */
function barList(rows, opts){
  const o = opts || {};
  const max = Math.max(1, ...rows.map(r => r.v));
  return '<div style="display:grid;gap:9px">' + rows.map(r => `
    <div>
      <div style="display:flex;justify-content:space-between;gap:10px;font-size:10.5px;font-weight:700;color:#2B303B">
        <span style="min-width:0;overflow-wrap:break-word">${esc(r.k)}</span>
        <span style="font-variant-numeric:tabular-nums;color:#667085;white-space:nowrap">${o.fmt ? o.fmt(r.v) : num(r.v)}</span>
      </div>
      <div style="height:8px;border-radius:20px;background:#EEF1F6;overflow:hidden;margin-top:4px">
        <i style="display:block;height:100%;width:${clamp(pct(r.v, max), 1, 100).toFixed(1)}%;background:${r.c || '#0E9F6E'}"></i>
      </div>
      ${r.s ? `<div class="qhint" style="margin-top:2px">${esc(r.s)}</div>` : ''}
    </div>`).join('') + '</div>';
}
const meter = (label, value, good, ok, hint) => {
  const cls = value >= good ? 'ok' : value >= ok ? 'warn' : 'bad';
  return `<div class="perfm">
    <div class="mt"><div>${esc(label)}</div><span>${r1(value)}%</span></div>
    <div class="mbar"><i class="${cls}" style="width:${clamp(value, 0, 100).toFixed(1)}%"></i></div>
    <div class="qhint" style="margin-top:1px">${esc(hint)}</div>
  </div>`;
};
const coverBar = (g, s, e) => {
  const gp = clamp(pct(g, Math.max(e, 1)), 0, 100), sp = clamp(pct(s, Math.max(e, 1)), 0, 100 - gp);
  const short = (g + s) < e;
  return `<div class="cvr">
    <div class="cvrl"><span>Cover ${r1(pct(g + s, e))}%</span><span>${money(g + s)}</span></div>
    <div class="cvrt">${short ? `<i class="short" style="width:${(100 - gp - sp).toFixed(1)}%"></i>` : ''}<i class="g" style="width:${gp.toFixed(1)}%"></i><i class="c" style="width:${sp.toFixed(1)}%"></i></div>
  </div>`;
};

/* ---------------- 1 · OVERVIEW ---------------- */
function renderOverview(){
  const G = GUARANTORS.length, V = verified().length;
  const covered = COVER.filter(c => c.ratio >= 100).length;
  const short = COVER.filter(c => c.gap > 0);
  const expiring = COLLATERAL.filter(c => { const d = insExpiring(c.insExpiry); return d !== null && d >= 0 && d <= 45; });
  const kycPct = pct(sum(GUARANTORS, kycDone), G * 6);
  const sigPct = pct(GUARANTORS.filter(g => g.signature).length, G);
  const securedPct = pct(COLLATERAL.filter(c => c.status === 'Charged').length, COLLATERAL.length);
  const insOk = pct(COLLATERAL.filter(c => !c.insured || (insExpiring(c.insExpiry) ?? -1) > 45).length, COLLATERAL.length);
  const valOk = pct(COLLATERAL.filter(c => valAge(c) <= 365).length, COLLATERAL.length);
  const covPct = pct(sum(COVER, c => Math.min(c.total, c.exposure)), totalExposure());

  put('bandStats', [
    ['Guarantors', G], ['Verified', V], ['Guaranteed', money(totalGuaranteed())],
    ['Security', money(totalSecurity())], ['Exposure', money(totalExposure())]
  ].map(([k, v]) => `<div><div class="bl">${esc(k)}</div><div class="bv">${typeof v === 'number' ? num(v) : v}</div></div>`).join(''));

  put('ovKpis', [
    kpiCard('Guarantors on file', num(G), V + ' verified · ' + (G - V) + ' pending or lapsed', 'gold'),
    kpiCard('Guarantee value', money(totalGuaranteed()), 'Committed and enforceable', 'green'),
    kpiCard('Pledged security', money(totalSecurity()), COLLATERAL.length + ' assets · ' + money(sum(COLLATERAL, c => c.valuation)) + ' valued', 'blue'),
    kpiCard('Balance outstanding', money(totalExposure()), LOANS.length + ' open loans', ''),
    kpiCard('Fully covered loans', covered + ' of ' + LOANS.length, covered === LOANS.length ? 'Every loan covered' : short.length + ' with a shortfall', short.length ? 'amber' : 'green'),
    kpiCard('Shortfall', money(sum(short, c => c.gap)), short.length + ' loan(s) below 100% cover', short.length ? 'red' : 'green')
  ].join(''));

  put('ovMeters', [
    meter('KYC completeness', kycPct, 95, 80, 'six checks per guarantor'),
    meter('Signed consent', sigPct, 95, 80, 'signature on the deed of guarantee'),
    meter('Security charged', securedPct, 90, 70, 'charge or pledge registered'),
    meter('Insurance current', insOk, 95, 80, 'policies in force beyond 45 days'),
    meter('Valuations current', valOk, 90, 70, 'valued within the last 12 months'),
    meter('Exposure covered', covPct, 100, 85, 'guarantee plus realisable security')
  ].join(''));
  put('ovStamp', 'Refreshed ' + fmtDate(TODAY));

  put('ovSplit', COVER.slice(0, 6).map(c => `
    <div style="padding:7px 0;border-bottom:1px dashed #DCEAE3">
      <div style="display:flex;justify-content:space-between;gap:10px;font-size:11px;font-weight:700;color:#2B303B">
        <span style="min-width:0;overflow-wrap:break-word">${esc(c.loan.borrower)} · ${esc(c.loan.id)}</span>
        <span style="font-variant-numeric:tabular-nums;white-space:nowrap">${money(c.exposure)}</span>
      </div>
      ${coverBar(c.guarantee, c.security, c.exposure)}
    </div>`).join('') + `<div class="qhint" style="margin-top:6px">Gold is the guarantee, green is realisable security, red is the gap.</div>`);

  put('ovNotes', [
    ['Guarantee and security together cover ' + r1(pct(sum(COVER, c => c.total), totalExposure())) + '% of the book', 'Against ' + money(totalExposure()) + ' outstanding across ' + LOANS.length + ' loans'],
    ['Guarantors carry ' + money(totalGuaranteed()) + ' of the exposure', 'The first call on a default is the guarantor, not the asset'],
    ['Security realises ' + money(totalSecurity()) + ' at forced sale', r1(pct(totalSecurity(), sum(COLLATERAL, c => c.valuation))) + '% of open-market valuation'],
    [short.length + ' loan(s) are not fully covered', 'Together ' + money(sum(short, c => c.gap)) + ' short — see section 11']
  ].map(([n, s]) => `<div class="risk"><div><div class="rn">${esc(n)}</div><div class="rs">${esc(s)}</div></div></div>`).join(''));

  const att = COVER.filter(c => c.gap > 0 || guarantorsOfLoan(c.loan.id).some(g => g.status !== 'Verified') ||
    collateralOfLoan(c.loan.id).some(x => { const d = insExpiring(x.insExpiry); return d !== null && d <= 45; }));
  put('ovAttPill', String(att.length));
  const attCols = [
    { k:'id', label:'Loan' }, { k:'borrower', label:'Borrower' },
    { k:'outstanding', label:'Outstanding', num:true, html:v => money(v) },
    { k:'cover', label:'Cover', html:(v, r) => coverBar(r.guarantee, r.security, r.outstanding) },
    { k:'gap', label:'Gap', num:true, html:v => v > 0 ? `<b style="color:#A62424">${money(v)}</b>` : badge('Covered') },
    { k:'why', label:'Why it is here', html:v => esc(v) }
  ];
  const attRows = att.map(c => ({
    id:c.loan.id, borrower:c.loan.borrower, outstanding:c.outstanding, guarantee:c.guarantee, security:c.security, gap:c.gap,
    cover:'', why:[
      c.gap > 0 ? 'Shortfall ' + money(c.gap) : '',
      guarantorsOfLoan(c.loan.id).filter(g => g.status !== 'Verified').map(g => g.name + ' ' + g.status.toLowerCase()).join(', '),
      collateralOfLoan(c.loan.id).filter(x => { const d = insExpiring(x.insExpiry); return d !== null && d <= 45; }).map(x => x.type + ' insurance expiring').join(', ')
    ].filter(Boolean).join(' · ') || 'Routine review'
  }));
  renderTable('ovAttBody', attCols, attRows, { onOpen: r => {
    const c = coverOf(r.id);
    openModal(r.id + ' · ' + r.borrower, 'Coverage against exposure', `
      <div class="recgrid">
        <div class="pfield"><div class="pk">Balance outstanding</div><div class="pv">${money(c.exposure)}</div></div>
        <div class="pfield"><div class="pk">Guarantee (enforceable)</div><div class="pv">${money(c.guarantee)}</div></div>
        <div class="pfield"><div class="pk">Realisable security</div><div class="pv">${money(c.security)}</div></div>
        <div class="pfield"><div class="pk">Gap</div><div class="pv">${c.gap ? money(c.gap) : 'None'}</div></div>
        <div class="pfield"><div class="pk">Guarantors</div><div class="pv">${guarantorsOfLoan(c.loan.id).map(g => esc(g.name) + ' (' + g.status + ')').join('<br>') || '—'}</div></div>
        <div class="pfield"><div class="pk">Security</div><div class="pv">${collateralOfLoan(c.loan.id).map(x => esc(x.type) + ' · ' + money(x.forced) + ' · ' + x.status).join('<br>') || '—'}</div></div>
      </div>`, [{ label:'Close', act:'close', cls:'btn-gold' }]);
  }});
}

/* ---------------- 2 · GUARANTOR REGISTER ---------------- */
const G_COLS = [
  { k:'id', label:'Guarantor ID' },
  { k:'name', label:'Name' },
  { k:'phone', label:'Phone' },
  { k:'relation', label:'Relationship' },
  { k:'district', label:'District' },
  { k:'loan', label:'Loan' },
  { k:'committed', label:'Guaranteed', num:true, html:v => money(v) },
  { k:'status', label:'Status', html:v => badge(v) },
  { k:'officer', label:'Officer' }
];
function renderGuarantors(){
  const st = el('gStatus'), rl = el('gRel'), di = el('gDist');
  if(st && !st.options.length){
    st.innerHTML = '<option value="">Every status</option>' + [...new Set(GUARANTORS.map(g => g.status))].map(v => `<option>${esc(v)}</option>`).join('');
    rl.innerHTML = '<option value="">Every relationship</option>' + [...new Set(GUARANTORS.map(g => g.relation))].map(v => `<option>${esc(v)}</option>`).join('');
    di.innerHTML = '<option value="">Every district</option>' + [...new Set(GUARANTORS.map(g => g.district))].map(v => `<option>${esc(v)}</option>`).join('');
  }
  const q = (el('globalSearch') && el('globalSearch').value || '').toLowerCase();
  const rows = GUARANTORS.filter(g =>
    (!st || !st.value || g.status === st.value) &&
    (!rl || !rl.value || g.relation === rl.value) &&
    (!di || !di.value || g.district === di.value) &&
    (!q || (g.name + g.id + g.loan + g.phone + g.district + g.relation).toLowerCase().includes(q))
  );
  renderTable('gBody', G_COLS, rows, { onOpen: g => openGuarantor(g) });
  put('gPill', rows.length + ' of ' + GUARANTORS.length);
  put('gFoot', `${rows.length} guarantor(s) · ${money(sum(rows, g => g.committed))} guaranteed · ${rows.filter(g => g.status === 'Verified').length} verified`);
}
function openGuarantor(g){
  const c = coverOf(g.loan);
  const body = `
    <div class="recgrid">
      <div class="pfield"><div class="pk">Guarantor</div><div class="pv">${esc(g.name)}</div></div>
      <div class="pfield"><div class="pk">Guarantor ID</div><div class="pv">${esc(g.id)}</div></div>
      <div class="pfield"><div class="pk">Phone</div><div class="pv">${esc(g.phone)}</div></div>
      <div class="pfield"><div class="pk">District</div><div class="pv">${esc(g.district)}</div></div>
      <div class="pfield"><div class="pk">Relationship</div><div class="pv">${esc(g.relation)}</div></div>
      <div class="pfield"><div class="pk">Occupation</div><div class="pv">${esc(g.occupation)} · ${esc(g.employer)}</div></div>
      <div class="pfield"><div class="pk">Monthly income</div><div class="pv">${money(g.income)}</div></div>
      <div class="pfield"><div class="pk">Net worth</div><div class="pv">${money(g.netWorth)}</div></div>
      <div class="pfield"><div class="pk">Guaranteed</div><div class="pv">${money(g.committed)} on ${esc(g.loan)}</div></div>
      <div class="pfield"><div class="pk">Commitment to income</div><div class="pv">${r1(chargeShare(g))}% of annual income</div></div>
      <div class="pfield"><div class="pk">Identity</div><div class="pv">${esc(g.idType)} · ${esc(g.idNo)}</div></div>
      <div class="pfield"><div class="pk">Consent</div><div class="pv">${g.signature ? 'Signed ' + esc(fmtDate(g.consent)) + ' · witness ' + esc(g.witness) : 'Not signed'}</div></div>
      <div class="pfield"><div class="pk">KYC</div><div class="pv">${docs(g.kyc)}</div></div>
      <div class="pfield"><div class="pk">Credit score</div><div class="pv">${g.score} · ${esc(g.status)}</div></div>
      <div class="pfield"><div class="pk">Assets declared</div><div class="pv">${esc(g.assets)}</div></div>
      <div class="pfield"><div class="pk">Liabilities declared</div><div class="pv">${esc(g.liabilities)}</div></div>
      ${c ? `<div class="pfield"><div class="pk">Loan covered</div><div class="pv">${esc(c.loan.borrower)} · ${money(c.exposure)} outstanding · cover ${r1(c.ratio)}%</div></div>` : ''}
    </div>`;
  openModal(g.name, g.id + ' · deed of guarantee', body, [
    { label:'Print undertaking', act: () => printTable('Deed of Guarantee · ' + g.name, [{label:'Field'},{label:'Value'}], [
        ['Guarantor', g.name], ['Guarantor ID', g.id], ['National ID', g.idNo], ['Loan guaranteed', g.loan],
        ['Amount guaranteed', money(g.committed)], ['Relationship', g.relation], ['Consent signed', fmtDate(g.consent)],
        ['Witness', g.witness], ['Advised of consequences', g.advised ? 'Yes' : 'No'], ['Status', g.status]
      ]) },
    { label:'Close', act:'close', cls:'btn-gold' }
  ]);
}

/* ---------------- 3 · KYC ---------------- */
function renderKyc(){
  const cols = [
    { k:'name', label:'Guarantor' },
    { k:'idNo', label:'National ID' },
    { k:'docs', label:'Checks on file', html:(v, r) => docs(r.kyc) },
    { k:'done', label:'Complete', num:true, html:v => badge(v + ' / 6', v === 6 ? 'b-ok' : v >= 4 ? 'b-warn' : 'b-crit') },
    { k:'score', label:'Bureau score', num:true },
    { k:'status', label:'Status', html:v => badge(v) }
  ];
  renderTable('kBody', cols, GUARANTORS.map(g => ({ ...g, done: kycDone(g) })), { sort:'done', onOpen: openGuarantor });
  const missing = ['id','photo','address','income','bureau','sanctions'].map(k => ({
    k, who: GUARANTORS.filter(g => !g.kyc[k]).map(g => g.name)
  })).filter(x => x.who.length);
  put('kPill', kycDone({ kyc:{ id:true, photo:true, address:true, income:true, bureau:true, sanctions:true } }) ?
    sum(GUARANTORS, kycDone) + ' / ' + (GUARANTORS.length * 6) : '—');
  put('kMissing', missing.length ? missing.map(m => `
    <div class="risk"><div><div class="rn">${esc({ id:'National ID', photo:'Photograph', address:'Proof of address', income:'Income evidence', bureau:'Credit-bureau search', sanctions:'Sanctions screen' }[m.k])}</div>
    <div class="rs">${m.who.length} guarantor(s): ${esc(m.who.join(', '))}</div></div>
    <div class="rv">${badge(m.who.length + ' to chase', 'b-warn')}</div></div>`).join('')
    : '<div class="empty" style="padding:18px 0">Every guarantor has all six checks on file.</div>');
}

/* ---------------- 4 · CAPACITY ---------------- */
function renderCapacity(){
  const f = el('capFilter');
  if(f && !f.options.length) f.innerHTML = '<option value="">Every guarantor</option><option value="over">Over 40% committed</option><option value="ok">Within limits</option>';
  let rows = GUARANTORS.map(g => ({ ...g, share: chargeShare(g), headroom: g.income * 12 * 0.4 - (g.committed + g.otherCommit) }));
  if(f && f.value === 'over') rows = rows.filter(r => r.share > 40);
  if(f && f.value === 'ok') rows = rows.filter(r => r.share <= 40);
  const cols = [
    { k:'name', label:'Guarantor' },
    { k:'income', label:'Monthly income', num:true, html:v => money(v) },
    { k:'netWorth', label:'Net worth', num:true, html:v => money(v) },
    { k:'otherCommit', label:'Other commitments', num:true, html:v => v ? money(v) : '—' },
    { k:'committed', label:'This guarantee', num:true, html:v => money(v) },
    { k:'share', label:'Of annual income', num:true, html:v => `<b style="color:${v > 60 ? '#A62424' : v > 40 ? '#8A5B08' : '#116B49'}">${r1(v)}%</b>` },
    { k:'verdict', label:'Capacity', html:(v, r) => badge(r.share > 60 ? 'Not acceptable' : r.share > 40 ? 'Review' : 'Within limits', r.share > 60 ? 'b-crit' : r.share > 40 ? 'b-warn' : 'b-ok') }
  ];
  renderTable('capBody', cols, rows.map(r => ({ ...r, verdict:'' })), { sort:'share', onOpen: openGuarantor });
  put('capPill', rows.filter(r => r.share > 40).length + ' over 40%');
  const nwCols = [
    { k:'name', label:'Guarantor' },
    { k:'assets', label:'Assets declared' },
    { k:'liabilities', label:'Liabilities declared' },
    { k:'netWorth', label:'Net worth', num:true, html:v => money(v) },
    { k:'verified', label:'Verified', html:(v, r) => badge(r.kyc.income ? 'Verified' : 'Declared only', r.kyc.income ? 'b-ok' : 'b-warn') }
  ];
  renderTable('nwBody', nwCols, GUARANTORS.map(g => ({ ...g, verified:'' })), { sort:'netWorth', onOpen: openGuarantor });
}

/* ---------------- 5 · CONSENT ---------------- */
function renderConsent(){
  const f = el('cConsent');
  if(f && !f.options.length) f.innerHTML = '<option value="">Every consent state</option><option value="signed">Signed</option><option value="unsigned">Not signed</option>';
  let rows = GUARANTORS.map(g => ({ ...g, state: g.signature ? 'Signed' : 'Not signed' }));
  if(f && f.value === 'signed') rows = rows.filter(r => r.signature);
  if(f && f.value === 'unsigned') rows = rows.filter(r => !r.signature);
  const cols = [
    { k:'name', label:'Guarantor' },
    { k:'loan', label:'Loan' },
    { k:'consent', label:'Consent given', html:v => v ? fmtDate(v) : '—' },
    { k:'state', label:'Signature', html:v => badge(v, v === 'Signed' ? 'b-ok' : 'b-crit') },
    { k:'witness', label:'Witnessed by' },
    { k:'advised', label:'Advised of default', html:v => v ? badge('Yes', 'b-ok') : badge('No', 'b-warn') },
    { k:'sig', label:'On file', html:(v, r) => `<div class="sigbox" style="min-height:34px;padding:3px 7px;font-size:9px">${r.signature ? 'signature captured · ' + esc(fmtDate(r.consent)) : 'no signature'}</div>` }
  ];
  renderTable('cBody', cols, rows.map(r => ({ ...r, sig:'' })), { onOpen: openGuarantor });
  put('cPill', rows.filter(r => r.signature).length + ' signed');
}

/* ---------------- 6 · COLLATERAL ---------------- */
const C_COLS = [
  { k:'id', label:'Security ID' },
  { k:'type', label:'Type' },
  { k:'desc', label:'Description' },
  { k:'owner', label:'Owner' },
  { k:'district', label:'District' },
  { k:'valuation', label:'Valuation', num:true, html:v => money(v) },
  { k:'forced', label:'Forced sale', num:true, html:v => money(v) },
  { k:'loan', label:'Secures' },
  { k:'status', label:'Status', html:v => badge(v) }
];
function renderCollateral(){
  const t = el('colType'), s = el('colStatus'), o = el('colOwner');
  if(t && !t.options.length){
    t.innerHTML = '<option value="">Every type</option>' + [...new Set(COLLATERAL.map(c => c.type))].map(v => `<option>${esc(v)}</option>`).join('');
    s.innerHTML = '<option value="">Every status</option>' + [...new Set(COLLATERAL.map(c => c.status))].map(v => `<option>${esc(v)}</option>`).join('');
    o.innerHTML = '<option value="">Any owner</option>' + [...new Set(COLLATERAL.map(c => c.ownerType))].map(v => `<option>${esc(v)}</option>`).join('');
  }
  const q = (el('globalSearch') && el('globalSearch').value || '').toLowerCase();
  const rows = COLLATERAL.filter(c =>
    (!t || !t.value || c.type === t.value) &&
    (!s || !s.value || c.status === s.value) &&
    (!o || !o.value || c.ownerType === o.value) &&
    (!q || (c.id + c.type + c.desc + c.owner + c.reg + c.loan).toLowerCase().includes(q))
  );
  renderTable('colBody', C_COLS, rows, { onOpen: openCollateral });
  put('colPill', rows.length + ' of ' + COLLATERAL.length);
  put('colFoot', `${rows.length} asset(s) · ${money(sum(rows, c => c.valuation))} valued · ${money(sum(rows, c => c.forced))} at forced sale`);

  const byType = [...new Set(COLLATERAL.map(c => c.type))].map(type => {
    const set = COLLATERAL.filter(c => c.type === type);
    return { k:type, v:sum(set, c => c.valuation), s:set.length + ' asset(s) · ' + money(sum(set, c => c.forced)) + ' realisable' };
  }).sort((a, b) => b.v - a.v);
  put('colTypeChart', barList(byType, { fmt:money }));
}

/* ---------------- 7 · VALUATION ---------------- */
function renderValuation(){
  const f = el('valFilter');
  if(f && !f.options.length) f.innerHTML = '<option value="">Every asset</option><option value="hi">LTV above 80%</option><option value="old">Valuation over 12 months</option>';
  let rows = COLLATERAL.map(c => ({ ...c, ltv: c.valuation ? pct(LOAN_OUT(c.loan), c.forced) : 0, age: valAge(c) }));
  if(f && f.value === 'hi') rows = rows.filter(r => r.ltv > 80);
  if(f && f.value === 'old') rows = rows.filter(r => r.age > 365);
  const cols = [
    { k:'id', label:'Security ID' },
    { k:'type', label:'Type' },
    { k:'valuer', label:'Valued by' },
    { k:'valDate', label:'Valued on', html:v => fmtDate(v) },
    { k:'age', label:'Age (days)', num:true, html:v => `<b style="color:${v > 365 ? '#A62424' : '#116B49'}">${num(v)}</b>` },
    { k:'valuation', label:'Market value', num:true, html:v => money(v) },
    { k:'forced', label:'Forced sale', num:true, html:v => money(v) },
    { k:'loan', label:'Secures balance', html:v => money(LOAN_OUT(v)) },
    { k:'ltv', label:'LTV', num:true, html:v => `<b style="color:${v > 80 ? '#A62424' : v > 70 ? '#8A5B08' : '#116B49'}">${r1(v)}%</b>` }
  ];
  renderTable('valBody', cols, rows, { sort:'ltv', onOpen: openCollateral });
  put('valPill', rows.filter(r => r.ltv > 80).length + ' over 80% LTV');
}
function openCollateral(c){
  const body = `
    <div class="recgrid">
      <div class="pfield"><div class="pk">Security</div><div class="pv">${esc(c.type)} · ${esc(c.desc)}</div></div>
      <div class="pfield"><div class="pk">Security ID</div><div class="pv">${esc(c.id)}</div></div>
      <div class="pfield"><div class="pk">Owner</div><div class="pv">${esc(c.owner)} (${esc(c.ownerType)})</div></div>
      <div class="pfield"><div class="pk">Registration</div><div class="pv">${esc(c.reg)} · ${esc(c.district)}</div></div>
      <div class="pfield"><div class="pk">Valuation</div><div class="pv">${money(c.valuation)} on ${esc(fmtDate(c.valDate))} by ${esc(c.valuer)}</div></div>
      <div class="pfield"><div class="pk">Forced sale value</div><div class="pv">${money(c.forced)} · ${r1(pct(c.forced, c.valuation))}% of market</div></div>
      <div class="pfield"><div class="pk">Loan-to-value</div><div class="pv">${r1(pct(LOAN_OUT(c.loan), c.forced))}% of ${money(LOAN_OUT(c.loan))}</div></div>
      <div class="pfield"><div class="pk">Charge</div><div class="pv">${esc(c.charge)} · registry search ${esc(c.search)} · stamp duty ${c.stamp ? 'paid' : 'outstanding'}</div></div>
      <div class="pfield"><div class="pk">Insurance</div><div class="pv">${c.insured ? esc(c.insurer) + ' · ' + esc(c.policy) + ' · ' + money(c.cover) + ' to ' + esc(fmtDate(c.insExpiry)) : 'Not insured'}</div></div>
      <div class="pfield"><div class="pk">Custody</div><div class="pv">${esc(c.custody)} · condition ${esc(c.condition)} · ${c.photos} photograph(s)</div></div>
      <div class="pfield"><div class="pk">Inspection</div><div class="pv">Last ${esc(fmtDate(c.lastInsp))} · next ${esc(fmtDate(c.nextInsp))}</div></div>
      <div class="pfield"><div class="pk">Status</div><div class="pv">${esc(c.status)} · secures ${esc(c.loan)}</div></div>
      <div class="pfield"><div class="pk">Notes</div><div class="pv">${esc(c.notes)}</div></div>
    </div>`;
  openModal(c.type + ' · ' + c.id, c.desc, body, [
    { label:'Print security file', act: () => printTable('Security File · ' + c.id, [{label:'Field'},{label:'Value'}], [
        ['Security', c.type + ' — ' + c.desc], ['Owner', c.owner + ' (' + c.ownerType + ')'], ['Registration', c.reg],
        ['Valuation', money(c.valuation)], ['Valued by', c.valuer], ['Valued on', fmtDate(c.valDate)],
        ['Forced sale', money(c.forced)], ['Charge', c.charge], ['Insurance', c.insured ? c.insurer + ' ' + c.policy : 'None'],
        ['Custody', c.custody], ['Status', c.status], ['Secures', c.loan]
      ]) },
    { label:'Close', act:'close', cls:'btn-gold' }
  ]);
}
</script>
<script>
