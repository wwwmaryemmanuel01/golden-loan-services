<script>
/* ============================================================
   VISA CARD LINKING & CARD PAYMENTS (9)
   A card linking code pairs the platform with a VISA card; the
   linked card then pays the system operating charges and the
   other expenses, and receives income (refunds, rebates,
   commission). Only the last four digits of a card are stored —
   the full number and the CVV are never kept. Everything here is
   defensive: a missing element never throws.
   ============================================================ */

/* ---- linked cards and the card activity register ---- */
const SE_CARDS = [
  { id: 'VC-0001', code: 'GLSVC-7K2M-9QX4', holder: 'CHIKONDI MWALE', last4: '4242',
    expiry: '09/28', state: 'Default', linked: addDays(TODAY, -38), bank: 'Standard Bank' }
];
const SE_CARD_TXNS = [
  { id: 'VSP-0001', when: addDays(TODAY, -12), what: 'System charge', party: 'Supabase', amount: 412_000,
    reference: 'VS-001201', card: '4242', status: 'Approved' },
  { id: 'VSP-0002', when: addDays(TODAY, -5), what: 'Expense', party: 'EXP-7231 · Fuel', amount: 86_500,
    reference: 'VS-001214', card: '4242', status: 'Approved' },
  { id: 'VSR-0001', when: addDays(TODAY, -2), what: 'Income', party: 'Provider refund · PayChangu', amount: 120_000,
    reference: 'VSR-000031', card: '4242', status: 'Received' }
];
let SE_CARD_CODE = 'GLSVC-3P8W-TRD2';
let SE_CARD_SEQ = 2;

/* ---- helpers ---- */
function seCardDefault(){
  return SE_CARDS.find(c => c.state === 'Default') || null;
}
function seCardLabel(){
  const c = seCardDefault();
  return c ? ('VISA card ···· ' + c.last4) : 'VISA card';
}
function seCardCode(){                       /* GLSVC-####-#### style pairing code */
  const abc = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const blk = n => Array.from({length: n}, () => abc[Math.floor(Math.random() * abc.length)]).join('');
  return 'GLSVC-' + blk(4) + '-' + blk(4);
}
/* Luhn check — the same test every card processor runs */
function seCardLuhn(num){
  const d = num.replace(/[^0-9]/g, '');
  if(d.length < 13 || d.length > 19) return false;
  let sum = 0, dbl = false;
  for(let i = d.length - 1; i >= 0; i--){
    let n = Number(d[i]);
    if(dbl){ n *= 2; if(n > 9) n -= 9; }
    sum += n; dbl = !dbl;
  }
  return sum % 10 === 0;
}
function seCardNextId(prefix){
  return prefix + '-' + pad(++SE_CARD_SEQ, 4);
}
function seCardRef(){
  return 'VS-' + pad(1200 + SE_CARD_TXNS.length + Math.floor(Math.random() * 40), 6);
}

/* ---- record a movement on the default card. Outflows also land in the
        payment queue so the reconciliation sees them; returns false when
        no card is linked, so callers fall back to the old behaviour. ---- */
function seCardRecord(what, party, amount, note){
  const c = seCardDefault();
  if(!c) return false;
  const ref = seCardRef();
  const t = { id: seCardNextId('VSP'), when: TODAY, what, party, amount,
    reference: ref, card: c.last4, status: 'Approved' };
  SE_CARD_TXNS.unshift(t);
  SE_PAYMENTS.unshift({ id: 'PAY-' + pad(7600 + SE_PAYMENTS.length, 5), kind: what,
    payee: party, method: seCardLabel(), when: TODAY, amount, reference: ref,
    status: 'Paid', receipt: t.id, reconciled: 'No', failure: '',
    lane: 'Payments', severity: 'Low', owner: 'STF-007', region: 'Lilongwe' });
  seAudit('Card payment · ' + what, t.id, seM(amount) + ' · VISA ···· ' + c.last4 +
    (note ? ' · ' + note : ''));
  return true;
}

/* ---- render ---- */
function renderCards(){
  const linked = SE_CARDS.filter(c => c.state !== 'Removed');
  const def = seCardDefault();
  const out = SE_CARD_TXNS.filter(t => t.what !== 'Income');
  const inc = SE_CARD_TXNS.filter(t => t.what === 'Income');
  const spent = sum(out, t => t.amount);
  const earned = sum(inc, t => t.amount);

  if(el('vcPill')){ el('vcPill').className = 'badge ' + (def ? 'b-ok' : 'b-warn');
    el('vcPill').textContent = def ? 'card linked ···· ' + def.last4 : 'no card linked'; }
  put('vcKpis', [
    ['Cards linked', num(linked.length), 'VISA cards connected to the platform', ''],
    ['Paid by card', seM(spent), num(out.length) + ' charges and expenses', ''],
    ['Income received', seM(earned), num(inc.length) + ' refunds and rebates', 'green'],
    ['Default card', def ? '···· ' + def.last4 : '—', def ? esc(def.holder) : 'Link a card first', def ? '' : 'red']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join(''));

  if(el('vcCode')) el('vcCode').value = SE_CARD_CODE;
  if(el('vcCount')) el('vcCount').textContent = num(linked.length) + ' cards';
  renderTable('vcBody', [
    {k: 'holder', label: 'Cardholder'},
    {k: 'last4', label: 'Card', html: v => '<span class="mono">VISA ···· ' + esc(v) + '</span>'},
    {k: 'expiry', label: 'Expiry'},
    {k: 'linked', label: 'Linked', html: v => esc(fmtDate(v))},
    {k: 'code', label: 'Linking code', html: v => '<span class="mono">' + esc(v) + '</span>'},
    {k: 'state', label: 'State', html: v => okb(v === 'Default' ? 'Active' : v)},
    {k: 'act', label: '', html: (v, r) => r.state === 'Removed' ? '<span class="muted">removed</span>'
      : (r.state === 'Default'
        ? '<button class="btn btn-ghost btn-sm" data-vc-unlink="' + esc(r.id) + '">Unlink</button>'
        : '<button class="btn btn-ghost btn-sm" data-vc-default="' + esc(r.id) + '">Make default</button> ' +
          '<button class="btn btn-ghost btn-sm" data-vc-unlink="' + esc(r.id) + '">Unlink</button>')}
  ], linked, {pageSize: 6});

  if(el('vcActPill')) el('vcActPill').textContent = num(SE_CARD_TXNS.length) + ' movements';
  renderTable('vcActBody', [
    {k: 'when', label: 'When', html: v => esc(fmtDate(v))},
    {k: 'what', label: 'Kind'},
    {k: 'party', label: 'Party'},
    {k: 'amount', label: 'Amount', num: true, html: v => esc(seM(v))},
    {k: 'reference', label: 'Reference', html: v => '<span class="mono">' + esc(v) + '</span>'},
    {k: 'card', label: 'Card', html: v => '···· ' + esc(v)},
    {k: 'status', label: 'State', html: v => okb(v)}
  ], SE_CARD_TXNS, {pageSize: 8});

  /* the selected charge and the selected expense, ready to be paid */
  const ch = SE_SYSTEM.find(i => i.id === SE_SEL.system) || SE_SYSTEM[0];
  if(el('vcChargeBox')) el('vcChargeBox').innerHTML = ch ? kvRow('Charge', esc(ch.name) + ' · ' + esc(ch.provider)) + kvRow('Amount', seM(ch.actual))
    + kvRow('Invoice', esc(ch.invoice)) + kvRow('State', esc(ch.status)) : '<div class="qhint">No charge picked.</div>';
  const ex = SE_EXPENSES.find(e => e.id === SE_SEL.expense) || SE_EXPENSES[0];
  if(el('vcExpenseBox')) el('vcExpenseBox').innerHTML = ex ? kvRow('Expense', esc(ex.id) + ' · ' + esc(ex.supplier)) + kvRow('Category', esc(ex.category))
    + kvRow('Amount', seM(ex.amount)) + kvRow('State', esc(ex.status)) : '<div class="qhint">No expense picked.</div>';
}

/* ---- actions ---- */
function seCardGenCode(){
  SE_CARD_CODE = seCardCode();
  if(el('vcCode')) el('vcCode').value = SE_CARD_CODE;
  if(el('vcMsg')) el('vcMsg').textContent = 'New linking code generated. It pairs the platform with the card until it is used or replaced.';
  toast('Linking code ' + SE_CARD_CODE + ' generated');
}
function seCardLink(){
  const code = (el('vcCode') && el('vcCode').value || '').trim().toUpperCase();
  const holder = (el('vcHolder') && el('vcHolder').value || '').trim();
  const raw = (el('vcNumber') && el('vcNumber').value || '').replace(/[^0-9]/g, '');
  const expiry = (el('vcExpiry') && el('vcExpiry').value || '').trim();
  if(!/^GLSVC-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code) || code !== SE_CARD_CODE){
    toast('Generate a linking code first — it must match the code on screen', 'err'); return; }
  if(!holder || holder.length < 4){ toast('Enter the cardholder name as printed on the card', 'err'); return; }
  if(!/^4/.test(raw)){ toast('Only VISA cards can be linked — the number must start with 4', 'err'); return; }
  if(!seCardLuhn(raw)){ toast('That card number fails the checksum — check the digits', 'err'); return; }
  if(!/^(0[1-9]|1[0-2])\/[0-9]{2}$/.test(expiry)){ toast('Enter the expiry as MM/YY', 'err'); return; }
  const last4 = raw.slice(-4);
  if(SE_CARDS.some(c => c.state !== 'Removed' && c.last4 === last4)){
    toast('That card is already linked', 'err'); return; }
  if(!SE_CARDS.some(c => c.state === 'Default')){
    SE_CARDS.unshift({ id: seCardNextId('VC'), code, holder: holder.toUpperCase(), last4,
      expiry, state: 'Default', linked: TODAY, bank: 'Standard Bank' });
  } else {
    SE_CARDS.unshift({ id: seCardNextId('VC'), code, holder: holder.toUpperCase(), last4,
      expiry, state: 'Linked', linked: TODAY, bank: 'Standard Bank' });
  }
  seAudit('Link VISA card', last4, holder.toUpperCase() + ' · exp ' + expiry + ' · code ' + code);
  if(el('vcHolder')) el('vcHolder').value = '';
  if(el('vcNumber')) el('vcNumber').value = '';
  if(el('vcExpiry')) el('vcExpiry').value = '';
  SE_CARD_CODE = seCardCode();              /* a used code can never be reused */
  if(el('vcMsg')) el('vcMsg').textContent = 'Card ···· ' + last4 + ' is linked. It now pays the system charges and the expenses, and receives income.';
  renderAll();
  toast('VISA card ···· ' + last4 + ' linked and connected');
}
function seCardAction(act, id){
  const c = SE_CARDS.find(x => x.id === id);
  if(!c || c.state === 'Removed') return;
  if(act === 'unlink'){
    c.state = 'Removed';
    seAudit('Unlink VISA card', c.last4, c.holder);
    if(!seCardDefault()){
      const next = SE_CARDS.find(x => x.state === 'Linked');
      if(next) next.state = 'Default';
    }
    toast('Card ···· ' + c.last4 + ' unlinked — the audit trail keeps the history');
  } else if(act === 'default'){
    SE_CARDS.forEach(x => { if(x.state === 'Default') x.state = 'Linked'; });
    c.state = 'Default';
    seAudit('Default card set', c.last4, c.holder);
    toast('Card ···· ' + c.last4 + ' is now the default card');
  }
  renderAll();
}
function seCardPayCharge(){
  const c = seCardDefault();
  if(!c){ toast('Link a VISA card first', 'err'); return; }
  const x = SE_SYSTEM.find(i => i.id === SE_SEL.system) || SE_SYSTEM[0];
  if(!x){ toast('Pick a system charge in section 9 first', 'err'); return; }
  if(x.status === 'Paid'){ toast('That invoice is already paid', 'err'); return; }
  x.status = 'Paid';
  const recorded = seCardRecord('System charge', x.provider + ' · ' + x.name, x.actual, x.invoice);
  if(!recorded) seAudit('Pay system charge', x.id, x.provider + ' · ' + seM(x.actual));
  put('vcReceiptBox', `<div class="receiptdoc">
    <div class="gls-doc-head">
      <img class="gls-docmark" src="assets/logo-mark-96.png" alt="GOLDEN FINANCIAL SERVICES">
      <div class="sliphead"><div><b>GOLDEN FINANCIAL SERVICES</b><div class="qhint">Card payment confirmation</div></div>
        <div style="text-align:right"><b>${esc(x.invoice)}</b><div class="qhint">${esc(fmtDate(TODAY))}</div></div></div>
    </div>
    <div class="pfields">${field('Paid to', esc(x.provider))}${field('Service', esc(x.name))}
      ${field('Amount', esc(seM(x.actual)))}
      ${field('Card', 'VISA ···· ' + esc(c.last4))}${field('Reference', esc(SE_CARD_TXNS[0].reference))}</div>
    <div class="qhint">Authorised ${esc(fmtDate(TODAY))} · the invoice is settled and the payment queue holds the record.</div></div>`);
  renderAll();
  toast(x.provider + ' paid with the VISA card · ' + seM(x.actual));
}
function seCardPayExpense(){
  const c = seCardDefault();
  if(!c){ toast('Link a VISA card first', 'err'); return; }
  const e = SE_EXPENSES.find(x => x.id === SE_SEL.expense) || SE_EXPENSES[0];
  if(!e){ toast('Pick an expense in section 8 first', 'err'); return; }
  if(e.status === 'Paid'){ toast('That expense is already paid', 'err'); return; }
  if(e.status !== 'Approved'){ toast('Approve the expense before paying it', 'err'); return; }
  e.status = 'Paid';
  e.reference = 'VS-' + pad(1300 + SE_EXPENSES.indexOf(e), 5);
  seCardRecord('Expense', e.supplier + ' · ' + e.category, e.amount, e.id);
  renderAll();
  toast(e.id + ' paid with the VISA card · ' + seM(e.amount));
}
function seCardIncome(){
  const c = seCardDefault();
  if(!c){ toast('Link a VISA card first', 'err'); return; }
  const source = el('vcIncSource') ? el('vcIncSource').value : 'Other income';
  const amount = Number(el('vcIncAmount') && el('vcIncAmount').value) || 0;
  if(amount <= 0){ toast('The income amount must be positive', 'err'); return; }
  const ref = 'VSR-' + pad(31 + SE_CARD_TXNS.filter(t => t.what === 'Income').length, 6);
  SE_CARD_TXNS.unshift({ id: seCardNextId('VSR'), when: TODAY, what: 'Income',
    party: source + ' · received on the card', amount, reference: ref, card: c.last4, status: 'Received' });
  seAudit('Card income received', ref, source + ' · ' + seM(amount) + ' · VISA ···· ' + c.last4);
  renderAll();
  toast(source + ' of ' + seM(amount) + ' received on the card');
}

/* ---- wiring: one delegated listener, house style ---- */
document.addEventListener('click', function(e){
  const t = e.target;
  if(!t || !t.closest) return;
  if(t.closest('#vcGenCode')){ seCardGenCode(); return; }
  if(t.closest('#vcLinkBtn')){ seCardLink(); return; }
  if(t.closest('#vcClearBtn')){
    ['vcHolder', 'vcNumber', 'vcExpiry'].forEach(id => { if(el(id)) el(id).value = ''; });
    return; }
  if(t.closest('#vcPayCharge')){ seCardPayCharge(); return; }
  if(t.closest('#vcPayExpense')){ seCardPayExpense(); return; }
  if(t.closest('#vcIncomeBtn')){ seCardIncome(); return; }
  /* a register row picked in section 8 or 9 updates the card pay boxes at once */
  if((t.closest('#syBody tr') || t.closest('#bxBody tr')) && typeof renderCards === 'function'){
    renderCards(); return; }
  const def = t.closest('[data-vc-default]');
  if(def){ seCardAction('default', def.getAttribute('data-vc-default')); return; }
  const ul = t.closest('[data-vc-unlink]');
  if(ul){ seCardAction('unlink', ul.getAttribute('data-vc-unlink')); return; }
});

/* ---- render with every other panel ---- */
const seBaseRenderAll = renderAll;
renderAll = function(){
  seBaseRenderAll();
  renderCards();
};
renderCards();
</script>
