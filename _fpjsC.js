<script>
/* ============================================================
   FEES & PENALTIES (3/8)
   The charge book: fee types and rules, every assessed fee and
   penalty, the waivers, the reversals, the collections, the
   double-entry ledger, the notices, the permissions, the database
   view, the report catalogue, the settings and the audit trail.
   Every row is generated from the applications, loans and
   repayments in (1/8), so a charge always points at a real loan.
   ============================================================ */

/* ===================== 1 · FEE TYPES ===================== */
/* basis: Percentage (of the loan or the application), Fixed, or Per day */
const FEE_TYPES = [
  {code:'APF', name:'Application processing fee',      group:'Application', basis:'Percentage', pct:1.00, fixed:0,     min:5000,  max:75000,  products:['SL','BB','EL','AF','GL'], graceDays:0, enabled:true,  effective:'2026-01-01', status:'Active', lane:'Fees', severity:'Low', owner:'STF-009', region:'Head office', description:'Charged when an application is submitted; covers the credit assessment.'},
  {code:'ADF', name:'Application administration fee',  group:'Application', basis:'Fixed',      pct:0,    fixed:15000, min:0,     max:15000,  products:['SL','BB','EL','AF','GL'], graceDays:0, enabled:true,  effective:'2026-01-01', status:'Active', lane:'Fees', severity:'Low', owner:'STF-009', region:'Head office', description:'Covers file opening, storage and the paper trail.'},
  {code:'AVF', name:'Application verification fee',    group:'Application', basis:'Fixed',      pct:0,    fixed:5000,  min:0,     max:5000,   products:['SL','BB','EL','AF','GL'], graceDays:0, enabled:true,  effective:'2026-03-01', status:'Active', lane:'Fees', severity:'Low', owner:'STF-009', region:'Head office', description:'Identity, employer and guarantor checks.'},
  {code:'LPF', name:'Loan processing fee',             group:'Origination', basis:'Percentage', pct:1.50, fixed:0,     min:10000, max:250000, products:['SL','BB','EL','AF','GL'], graceDays:0, enabled:true,  effective:'2026-01-01', status:'Active', lane:'Fees', severity:'Medium', owner:'STF-003', region:'Lilongwe', description:'Deducted at disbursement unless the customer pays it separately.'},
  {code:'LAF', name:'Loan administration fee',         group:'Origination', basis:'Fixed',      pct:0,    fixed:25000, min:0,     max:25000,  products:['SL','BB','AF','GL'],      graceDays:0, enabled:true,  effective:'2026-01-01', status:'Active', lane:'Fees', severity:'Low', owner:'STF-003', region:'Lilongwe', description:'A flat charge for maintaining the facility.'},
  {code:'LAF2',name:'Loan arrangement fee',            group:'Origination', basis:'Percentage', pct:1.00, fixed:0,     min:15000, max:180000, products:['BB','AF','GL'],          graceDays:0, enabled:true,  effective:'2026-02-15', status:'Active', lane:'Fees', severity:'Medium', owner:'STF-003', region:'Lilongwe', description:'Only on the larger commercial facilities.'},
  {code:'LDF', name:'Loan disbursement fee',           group:'Origination', basis:'Percentage', pct:0.50, fixed:0,     min:5000,  max:90000,  products:['SL','BB','EL','AF','GL'], graceDays:0, enabled:true,  effective:'2026-01-01', status:'Active', lane:'Fees', severity:'Low', owner:'STF-007', region:'Lilongwe', description:'Covers the rail cost of paying the loan out.'},
  {code:'AMF', name:'Account maintenance fee',         group:'Administrative', basis:'Fixed',   pct:0,    fixed:7500,  min:0,     max:7500,   products:['SL','BB','AF','GL'],      graceDays:7, enabled:true,  effective:'2026-01-01', status:'Active', lane:'Fees', severity:'Low', owner:'STF-009', region:'Head office', description:'Charged once a quarter on an open loan account.'},
  {code:'STF', name:'Statement fee',                   group:'Administrative', basis:'Fixed',   pct:0,    fixed:3500,  min:0,     max:3500,   products:['SL','BB','EL','AF','GL'], graceDays:7, enabled:true,  effective:'2026-01-01', status:'Active', lane:'Fees', severity:'Low', owner:'STF-008', region:'Mzuzu', description:'A printed statement requested at the branch.'},
  {code:'PPF', name:'Payment processing fee',          group:'Administrative', basis:'Percentage', pct:0.50, fixed:0,  min:500,   max:25000,  products:['SL','BB','EL','AF','GL'], graceDays:0, enabled:true,  effective:'2026-01-01', status:'Active', lane:'Fees', severity:'Low', owner:'STF-007', region:'Lilongwe', description:'Only on mobile money repayments; cash and bank transfers are free.'},
  {code:'FPC', name:'Failed payment charge',           group:'Administrative', basis:'Fixed',   pct:0,    fixed:4500,  min:0,     max:4500,   products:['SL','BB','EL','AF','GL'], graceDays:0, enabled:true,  effective:'2026-04-01', status:'Active', lane:'Fees', severity:'Medium', owner:'STF-007', region:'Lilongwe', description:'A bounced debit order or a rail that timed out.'},
  {code:'RSF', name:'Rescheduling fee',                group:'Administrative', basis:'Fixed',   pct:0,    fixed:30000, min:0,     max:30000,  products:['SL','BB','GL'],          graceDays:0, enabled:true,  effective:'2026-01-01', status:'Active', lane:'Fees', severity:'Medium', owner:'STF-003', region:'Lilongwe', description:'An approved change to the repayment dates.'},
  {code:'CAF', name:'Contract amendment fee',          group:'Administrative', basis:'Fixed',   pct:0,    fixed:45000, min:0,     max:45000,  products:['BB','AF','GL'],          graceDays:0, enabled:true,  effective:'2026-02-15', status:'Active', lane:'Fees', severity:'Medium', owner:'STF-003', region:'Blantyre', description:'A change to the amount, term or security after signing.'},
  {code:'ESF', name:'Early settlement fee',            group:'Administrative', basis:'Percentage', pct:1.00, fixed:0,  min:10000, max:120000, products:['AF','BB'],               graceDays:0, enabled:true,  effective:'2026-05-01', status:'Active', lane:'Fees', severity:'Medium', owner:'STF-003', region:'Lilongwe', description:'Where the product permits an early payoff.'},
  {code:'OSC', name:'Other approved service charge',   group:'Administrative', basis:'Fixed',   pct:0,    fixed:12000, min:0,     max:12000,  products:['SL','BB','EL','AF','GL'], graceDays:7, enabled:true,  effective:'2026-01-01', status:'Active', lane:'Fees', severity:'Low', owner:'STF-009', region:'Head office', description:'Anything else the tariff permits, always disclosed first.'},

  {code:'LTP', name:'Late repayment penalty',          group:'Penalty', basis:'Daily',     pct:0.20, fixed:5000, min:5000, max:150000, products:['SL','BB','EL','AF','GL'], graceDays:5, enabled:true, effective:'2026-01-01', status:'Active', lane:'Penalties', severity:'High', owner:'STF-005', region:'Lilongwe', description:'A percentage of the overdue amount for every day past the grace period.'},
  {code:'MSP', name:'Missed payment penalty',          group:'Penalty', basis:'Percentage', pct:5.00, fixed:0,  min:10000, max:120000, products:['SL','BB','EL','AF','GL'], graceDays:5, enabled:true, effective:'2026-01-01', status:'Active', lane:'Penalties', severity:'High', owner:'STF-005', region:'Lilongwe', description:'A one-off charge for an instalment that was never paid at all.'},
  {code:'ODC', name:'Overdue instalment charge',       group:'Penalty', basis:'Fixed',      pct:0,    fixed:7500, min:0,     max:7500,   products:['EL','GL'],               graceDays:5, enabled:true, effective:'2026-01-01', status:'Active', lane:'Penalties', severity:'Medium', owner:'STF-006', region:'Blantyre', description:'A flat charge per overdue instalment on the short-term products.'},
  {code:'RLP', name:'Repeated late payment penalty',   group:'Penalty', basis:'Percentage', pct:7.50, fixed:0,  min:12000, max:200000, products:['SL','BB','EL','AF','GL'], graceDays:5, enabled:false, effective:'2026-06-01', status:'Paused', lane:'Penalties', severity:'High', owner:'STF-005', region:'Lilongwe', description:'Only applies after a third late payment in the same facility; currently paused pending review.'}
];
const FEE_TYPE_BY_CODE = Object.fromEntries(FEE_TYPES.map(t => [t.code, t]));
const FEE_TYPE_NAME = code => (FEE_TYPE_BY_CODE[code] || {}).name || code;
/* who a charge may be raised on — the eligible-customer segments */
const FP_SEGMENTS = [
  ['all',     'All customers'],
  ['salary',  'Salaried employees'],
  ['business','Business owners'],
  ['group',   'Group lending members'],
  ['civil',   'Civil servants'],
  ['women',   'Women-led enterprises'],
  ['first',   'First-time borrowers'],
  ['repeat',  'Repeat customers']
];
const FP_SEG_BY_KEY = Object.fromEntries(FP_SEGMENTS.map(([k, l]) => [k, l]));
const FP_SEG_DEFAULT = { ESF: ['business', 'salary'], RSF: ['all'], CAF: ['business', 'group'],
  AMF: ['all'], STF: ['all'], OSC: ['all'] };
const fpSegmentsOf = t => (t && t.segments && t.segments.length) ? t.segments
  : (FP_SEG_DEFAULT[t && t.code] || ['all']);
const fpSegNames = t => fpSegmentsOf(t).map(k => FP_SEG_BY_KEY[k] || k).join(', ');

const FEE_PENALTY_TYPES = FEE_TYPES.filter(t => t.group === 'Penalty');
const FEE_CHARGE_TYPES  = FEE_TYPES.filter(t => t.group !== 'Penalty');

/* ===================== 2 · PENALTY RULES AND SETTINGS ===================== */
const FEE_RULES = {
  graceDays: 5,
  penaltyBasis: 'Daily percentage of the overdue amount',
  dailyPct: 0.20,
  fixedAmount: 5000,
  missedPaymentPct: 5.00,
  overdueInstalmentFlat: 7500,
  capPerCharge: 150000,
  capPercentOfOverdue: 25,
  repeatedLateAfter: 3,
  repeatedLatePct: 7.50,
  partialPaymentRule: 'Penalise the unpaid part only',
  duplicateWindowHours: 24,
  assessmentApprovalAbove: 100000,
  waiverApprovalAbove: 50000,
  reversalApprovalAbove: 25000,
  deductAtDisbursement: true,
  disclosureBeforeAcceptance: true,
  preserveHistoricalRules: true
};
const FEE_SET_DEFAULTS = {
  currency: 'MK', decimals: 0, feeRadius: 'Whole portfolio',
  graceDays: 5, dailyPct: 0.20, capPerCharge: 150000, capPercent: 25,
  assessmentApprovalAbove: 100000, waiverApprovalAbove: 50000, reversalApprovalAbove: 25000,
  deductAtDisbursement: true, disclosureBeforeAcceptance: true,
  statementFee: 3500, maintenanceFee: 7500, paymentFeePct: 0.50,
  notifySms: true, notifyEmail: true, autoWaiverExpiry: 14, policyVersion: '2026.1'
};
const FEE_SET = Object.assign({}, FEE_SET_DEFAULTS);
const FEE_STAFF_REF = 'STF-009';

/* ===================== 3 · THE CHARGE BOOK ===================== */
const CHARGES = [];
let chgSeq = 1001;

function fpRound(v){ return Math.round(Number(v) || 0); }
function fpCap(type, v){
  let out = fpRound(v);
  if(type.min) out = Math.max(out, type.min);
  if(type.max) out = Math.min(out, type.max);
  return out;
}
function fpChargeTypeAmount(code, base){
  const t = FEE_TYPE_BY_CODE[code];
  if(!t) return 0;
  if(t.basis === 'Fixed') return fpCap(t, t.fixed);
  if(t.basis === 'Percentage') return fpCap(t, base * t.pct / 100);
  return fpCap(t, base * t.pct / 100);          /* per-day types are computed by the penalty engine */
}
function fpStatusFor(dateOut){
  /* older charges are settled; the recent ones are still moving */
  const age = daysBetween(dateOut, TODAY);
  if(age > 150) return 'Paid';
  if(age > 60) return 'Paid';
  if(age > 30) return 'Part paid';
  if(age > 14) return 'Outstanding';
  return 'Outstanding';
}
function addCharge(o){
  const t = FEE_TYPE_BY_CODE[o.type] || {};
  const id = 'CHG-2026-' + pad(chgSeq++, 4);
  const amount = o.amount === undefined ? fpChargeTypeAmount(o.type, o.base) : fpRound(o.amount);
  const rec = {
    id, kind: t.group === 'Penalty' ? 'Penalty' : 'Fee', type: o.type, typeName: t.name || o.type,
    group: t.group || 'Fee', cust: o.cust, loan: o.loan || '', app: o.app || '', product: o.product || '',
    base: o.base || 0, basis: t.basis || 'Fixed', rate: t.basis === 'Fixed' ? '' : t.pct,
    assessed: o.assessed, due: o.due || o.assessed, amount,
    paid: 0, waived: 0, reversed: 0, balance: amount,
    status: o.status || 'Outstanding', method: o.method || '', receipt: '',
    officer: o.officer || 'STF-009', region: o.region || 'Lilongwe',
    reason: o.reason || '', source: o.source || 'Assessment run',
    graceDays: t.graceDays || 0, daysLate: o.daysLate || 0,
    calc: o.calc || '', lane: t.group === 'Penalty' ? 'Penalties' : 'Fees',
    severity: t.severity || 'Low', owner: o.officer || 'STF-009'
  };
  CHARGES.push(rec);
  return rec;
}

/* ---- 3a. application fees, one set per application ---- */
APPS.forEach((a, i) => {
  const decided = a.decided || addDays(a.submitted, 3);
  ['APF','ADF','AVF'].forEach((code, k) => {
    const t = FEE_TYPE_BY_CODE[code];
    if(!t.products.includes(a.product)) return;
    const assessed = addDays(a.submitted, k === 0 ? 0 : 1);
    const amount = fpChargeTypeAmount(code, a.amount);
    const rec = addCharge({type: code, cust: a.cust, app: a.ref, product: a.product, base: a.amount,
      amount, assessed, due: addDays(assessed, t.graceDays || 7),
      officer: a.officer, region: a.region, source: 'Application assessment',
      calc: t.basis === 'Fixed' ? 'Fixed ' + money(t.fixed) : fpPct(t.pct) + ' of ' + money(a.amount) + ' → ' + money(amount)});
    /* application fees are paid up front in almost every case */
    const paidChance = daysBetween(a.submitted, TODAY) > 20 ? 0.94 : 0.7;
    if(rnd() < paidChance){
      rec.paid = amount; rec.balance = 0; rec.status = 'Paid';
      rec.method = pick(METHODS); rec.receipt = 'RCP-' + pad(6100 + CHARGES.length, 5);
    } else if(rnd() < 0.3){
      rec.waived = amount; rec.balance = 0; rec.status = 'Waived';
      rec.reason = 'Fee exemption approved — repeat customer';
    } else if(rnd() < 0.12){
      rec.reversed = amount; rec.balance = 0; rec.status = 'Reversed';
      rec.reason = 'Application withdrawn before assessment was posted';
    } else {
      const part = Math.round(amount * 0.5);
      rec.paid = part; rec.balance = amount - part; rec.status = 'Part paid';
      rec.method = pick(METHODS); rec.receipt = 'RCP-' + pad(6100 + CHARGES.length, 5);
    }
  });
});

/* ---- 3b. origination fees, deducted at disbursement or paid separately ---- */
LOANS.forEach((l, i) => {
  const product = PROD_BY_ID[l.product] || PRODUCTS[0];
  const codes = ['LPF','LAF','LAF2','LDF'].filter(code => {
    const t = FEE_TYPE_BY_CODE[code];
    return t.enabled && t.products.includes(l.product) && (code !== 'LAF2' || l.amount >= 800000);
  });
  codes.forEach((code, k) => {
    const t = FEE_TYPE_BY_CODE[code];
    const amount = fpChargeTypeAmount(code, l.amount);
    const assessed = addDays(l.date, -1);
    const separate = !t.deductAtDisbursement && rnd() < 0.25;
    const rec = addCharge({type: code, cust: l.cust, loan: l.ref, product: l.product, base: l.amount,
      amount, assessed, due: addDays(assessed, 7), officer: l.officer, region: l.region,
      source: separate ? 'Paid separately' : 'Deducted at disbursement',
      status: separate ? 'Outstanding' : 'Paid',
      calc: t.basis === 'Fixed' ? 'Fixed ' + money(t.fixed) : fpPct(t.pct) + ' of ' + money(l.amount) + ' → ' + money(amount)});
    if(!separate){
      rec.paid = amount; rec.balance = 0; rec.status = 'Paid';
      rec.method = 'Deducted at disbursement'; rec.receipt = 'RCP-' + pad(6200 + i * 4 + k, 5);
    } else {
      const paid = rnd() < 0.55 ? amount : Math.round(amount * 0.5);
      rec.paid = paid; rec.balance = amount - paid; rec.status = paid === amount ? 'Paid' : 'Part paid';
      rec.method = pick(METHODS);
      if(paid) rec.receipt = 'RCP-' + pad(6300 + i * 4 + k, 5);
    }
  });
});

/* ---- 3c. repayment penalties, one per overdue instalment ---- */
LOANS.forEach(l => {
  if(!l.unpaidInstalments || l.dpd <= 0) return;
  const t = FEE_TYPE_BY_CODE['LTP'];
  const instalment = l.instalment;
  const count = Math.min(6, Math.max(1, Math.round(l.unpaidInstalments)));
  for(let k = 0; k < count; k++){
    const dueDate = addMonths(l.date, k + 1);
    const daysLate = Math.max(1, daysBetween(dueDate, TODAY) - FEE_RULES.graceDays);
    if(daysLate <= 0) continue;
    const overdue = instalment;
    const rawPenalty = overdue * (FEE_RULES.dailyPct / 100) * Math.min(daysLate, 60) + FEE_RULES.fixedAmount;
    const capAmount = Math.min(FEE_RULES.capPerCharge, overdue * FEE_RULES.capPercentOfOverdue / 100 + FEE_RULES.fixedAmount);
    const amount = fpRound(Math.min(rawPenalty, capAmount));
    const atCap = amount >= capAmount - 1;
    const rec = addCharge({type: 'LTP', cust: l.cust, loan: l.ref, product: l.product, base: overdue,
      amount, assessed: addDays(dueDate, FEE_RULES.graceDays + 1), due: addDays(dueDate, FEE_RULES.graceDays + 1),
      daysLate, officer: l.officer, region: l.region, source: 'Penalty run',
      status: atCap ? 'At the cap' : 'Outstanding',
      calc: fpPct(FEE_RULES.dailyPct) + '/day × ' + daysLate + ' days on ' + money(overdue) + ' + ' + money(FEE_RULES.fixedAmount) + ' → ' + money(amount) + (atCap ? ' (capped)' : '')});
    /* penalties are usually collected with the next payment */
    if(rnd() < 0.42){
      rec.paid = amount; rec.balance = 0; rec.status = 'Paid';
      rec.method = pick(METHODS); rec.receipt = 'RCP-' + pad(6500 + CHARGES.length, 5);
    } else if(rnd() < 0.1){
      rec.waived = Math.round(amount * 0.5); rec.paid = amount - rec.waived; rec.balance = 0;
      rec.status = 'Waived'; rec.reason = 'Half waived on a hardship request';
    }
  }
  /* a missed instalment on the short products carries the flat charge as well */
  if(['EL','GL'].includes(l.product) && rnd() < 0.5){
    const t2 = FEE_TYPE_BY_CODE['ODC'];
    addCharge({type:'ODC', cust:l.cust, loan:l.ref, product:l.product, base:instalment,
      amount:t2.fixed, assessed:addDays(TODAY, -ri(3,60)), due:addDays(TODAY, -ri(1,50)),
      officer:l.officer, region:l.region, source:'Penalty run',
      calc:'Fixed ' + money(t2.fixed) + ' per overdue instalment'});
  }
});

/* ---- 3d. the administrative charges ---- */
const ADMIN_SAMPLE = [
  {code:'PPF', n:140, source:'Repayment posting'},
  {code:'AMF', n:44,  source:'Quarterly maintenance'},
  {code:'STF', n:26,  source:'Branch request'},
  {code:'FPC', n:14,  source:'Rail failure'},
  {code:'RSF', n:9,   source:'Approved rescheduling'},
  {code:'CAF', n:7,   source:'Contract amendment'},
  {code:'ESF', n:5,   source:'Early settlement'},
  {code:'OSC', n:11,  source:'Service charge'}
];
ADMIN_SAMPLE.forEach(spec => {
  const t = FEE_TYPE_BY_CODE[spec.code];
  for(let i = 0; i < spec.n; i++){
    const l = LOANS[ri(0, LOANS.length - 1)] || LOANS[0];
    const base = spec.code === 'PPF' ? (PAYS[ri(0, PAYS.length - 1)] || {}).amount || 250000 : l.amount;
    const assessed = addDays(TODAY, -ri(2, 240));
    const amount = spec.code === 'FPC' ? t.fixed
      : spec.code === 'PPF' ? fpCap(t, (base || 250000) * t.pct / 100)
      : spec.code === 'ESF' ? fpCap(t, l.amount * t.pct / 100)
      : fpChargeTypeAmount(spec.code, l.amount);
    const rec = addCharge({type: spec.code, cust: l.cust, loan: l.ref, product: l.product, base,
      amount, assessed, due: addDays(assessed, t.graceDays || 7), officer: l.officer, region: l.region,
      source: spec.source,
      calc: t.basis === 'Fixed' ? 'Fixed ' + money(t.fixed) : fpPct(t.pct) + ' of ' + money(base) + ' → ' + money(amount)});
    const age = daysBetween(assessed, TODAY);
    if(age > 45){ rec.paid = amount; rec.balance = 0; rec.status = 'Paid'; rec.method = pick(METHODS);
      rec.receipt = 'RCP-' + pad(6600 + i, 5); }
    else if(age > 20 && rnd() < 0.55){ rec.paid = amount; rec.balance = 0; rec.status = 'Paid';
      rec.method = pick(METHODS); rec.receipt = 'RCP-' + pad(6700 + i, 5); }
    else if(rnd() < 0.09){ rec.reversed = amount; rec.balance = 0; rec.status = 'Reversed';
      rec.reason = 'Charge raised twice — duplicate reversed'; }
  }
});

/* a dozen assessments sit in the approval queue, as the rules require */
for(let i = 0; i < 12; i++){
  const l = LOANS[ri(0, LOANS.length - 1)] || LOANS[0];
  const t = pick(FEE_PENALTY_TYPES.filter(x => x.enabled));
  const amount = ri(12, 30) * 5000;
  addCharge({type: t.code, cust: l.cust, loan: l.ref, product: l.product, base: l.amount,
    amount, assessed: addDays(TODAY, -ri(0, 4)), due: addDays(TODAY, ri(3, 10)),
    officer: pick(STAFF.filter(s => ['Collections Officer','Loan Officer'].includes(s.role))).id,
    region: l.region, source: 'Penalty run', status: 'Pending approval',
    calc: 'Above ' + money(FEE_RULES.assessmentApprovalAbove) + ' — needs a second signature'});
}

CHARGES.sort((a, b) => a.assessed < b.assessed ? 1 : -1);
CHARGES.forEach(c => { c.balance = Math.max(0, c.amount - c.paid - c.waived - c.reversed); });
const CHARGE_BY_ID = Object.fromEntries(CHARGES.map(c => [c.id, c]));

/* ===================== 4 · WAIVERS ===================== */
const WAIVER_REASONS = ['Financial hardship','Bereavement','Medical emergency','Bank error','Staff error',
  'Repeat customer goodwill','Natural disaster','Retrenchment','Policy exemption'];
const WAIVERS = [];
let wvSeq = 1;
CHARGES.filter(c => c.waived > 0).slice(0, 22).forEach((c, i) => {
  const decided = daysBetween(c.assessed, TODAY) > 20;
  const full = c.waived >= c.amount - 1;
  WAIVERS.push({
    id: 'WVR-2026-' + pad(wvSeq++, 3), charge: c.id, cust: c.cust, loan: c.loan, type: c.type, typeName: c.typeName,
    kind: c.kind, amount: c.amount, waived: c.waived, scope: full ? 'Full waiver' : 'Partial waiver',
    reason: c.reason || pick(WAIVER_REASONS), document: pick(['Hardship letter', 'Medical report', 'Retrenchment letter', 'Bank statement', 'No document']),
    requestedBy: pick(STAFF.filter(s => ['Collections Officer','Loan Officer','Customer Care'].includes(s.role))).id,
    requestedOn: addDays(c.assessed, ri(1, 6)),
    status: decided ? 'Approved' : 'Pending',
    decidedBy: decided ? 'STF-003' : '', decidedOn: decided ? addDays(c.assessed, ri(7, 20)) : '',
    selfApproval: false, note: decided ? 'Approved within the delegated limit' : 'Waiting on the head of credit',
    lane: 'Waivers', severity: c.kind === 'Penalty' ? 'Medium' : 'Low', owner: c.officer, region: c.region
  });
});
/* a few requests still in the queue, some rejected, one self-approval attempt blocked */
for(let i = 0; i < 9; i++){
  const c = CHARGES[ri(0, Math.min(300, CHARGES.length - 1))];
  const partial = i % 3 === 0;
  const amount = partial ? Math.round(c.amount * 0.4) : c.amount;
  const status = i < 6 ? 'Pending' : i === 6 ? 'Rejected' : i === 7 ? 'Approved' : 'Pending';
  WAIVERS.push({
    id: 'WVR-2026-' + pad(wvSeq++, 3), charge: c.id, cust: c.cust, loan: c.loan, type: c.type, typeName: c.typeName,
    kind: c.kind, amount: c.amount, waived: amount, scope: partial ? 'Partial waiver' : 'Full waiver',
    reason: pick(WAIVER_REASONS), document: pick(['Hardship letter', 'Medical report', 'Retrenchment letter']),
    requestedBy: pick(STAFF).id, requestedOn: addDays(TODAY, -ri(0, 12)),
    status, decidedBy: status === 'Pending' ? '' : 'STF-003',
    decidedOn: status === 'Pending' ? '' : addDays(TODAY, -ri(0, 4)),
    selfApproval: i === 8, note: status === 'Rejected' ? 'The evidence did not support a waiver' : '',
    lane: 'Waivers', severity: 'Medium', owner: c.officer, region: c.region
  });
}
WAIVERS.sort((a, b) => a.requestedOn < b.requestedOn ? 1 : -1);

/* ===================== 5 · REVERSALS AND CORRECTIONS ===================== */
const REVERSAL_REASONS = ['Incorrect fee assessment','Incorrect penalty assessment','Duplicate charge',
  'Wrong loan attached','Wrong product rate applied','Customer not liable','System error','Approved goodwill'];
const REVERSALS = [];
let rvSeq = 1;
CHARGES.filter(c => c.reversed > 0).slice(0, 16).forEach(c => {
  REVERSALS.push({
    id: 'REV-2026-' + pad(rvSeq++, 3), charge: c.id, cust: c.cust, loan: c.loan, type: c.type, typeName: c.typeName,
    kind: c.kind, amount: c.reversed, reason: c.reason || pick(REVERSAL_REASONS),
    requestedBy: pick(STAFF).id, requestedOn: addDays(c.assessed, ri(1, 8)),
    approvedBy: 'STF-003', approvedOn: addDays(c.assessed, ri(9, 20)), status: 'Approved',
    refund: c.paid > 0 ? 'Refunded to the customer' : 'No cash taken — charge cancelled',
    lane: 'Reversals', severity: 'Medium', owner: c.officer, region: c.region
  });
});
for(let i = 0; i < 5; i++){
  const c = CHARGES[ri(0, 200)];
  REVERSALS.push({
    id: 'REV-2026-' + pad(rvSeq++, 3), charge: c.id, cust: c.cust, loan: c.loan, type: c.type, typeName: c.typeName,
    kind: c.kind, amount: c.amount, reason: pick(REVERSAL_REASONS),
    requestedBy: pick(STAFF).id, requestedOn: addDays(TODAY, -ri(0, 9)),
    approvedBy: '', approvedOn: '', status: i < 3 ? 'Pending' : 'Rejected',
    refund: 'Nothing collected yet', lane: 'Reversals', severity: 'Medium', owner: c.officer, region: c.region
  });
}
REVERSALS.sort((a, b) => a.requestedOn < b.requestedOn ? 1 : -1);

/* duplicate detection: same type, same loan, inside the window */
const DUPLICATES = [];
CHARGES.forEach(c => {
  const twin = CHARGES.find(o => o !== c && o.loan === c.loan && o.type === c.type
    && Math.abs(daysBetween(o.assessed, c.assessed)) <= 1 && o.cust === c.cust);
  if(twin && !DUPLICATES.some(d => d.charge === c.id)) {
    DUPLICATES.push({charge: c.id, twin: twin.id, cust: c.cust, loan: c.loan, type: c.type,
      amount: c.amount, when: c.assessed, status: c.status === 'Reversed' ? 'Reversed' : 'Under review',
      lane: 'Reversals', severity: 'High', owner: c.officer, region: c.region});
  }
});
DUPLICATES.splice(9);

/* ===================== 6 · COLLECTIONS ===================== */
const COLLECTIONS = [];
let colSeq = 5001;
CHARGES.filter(c => c.paid > 0).forEach(c => {
  const split = c.status === 'Part paid' || rnd() < 0.18;
  const parts = split ? [Math.round(c.paid * 0.6), c.paid - Math.round(c.paid * 0.6)] : [c.paid];
  parts.filter(v => v > 0).forEach((amt, k) => {
    COLLECTIONS.push({
      id: 'COL-2026-' + pad(colSeq++, 4), when: addDays(c.assessed, k === 0 ? ri(0, 8) : ri(9, 24)),
      charge: c.id, cust: c.cust, loan: c.loan, type: c.type, kind: c.kind, amount: amt,
      method: c.method || pick(METHODS), receipt: k === 0 ? (c.receipt || 'RCP-' + pad(colSeq, 5)) : 'RCP-' + pad(colSeq, 5),
      officer: c.officer, region: c.region, status: rnd() < 0.02 ? 'Reversed' : 'Allocated',
      lane: 'Collections', severity: 'Low', owner: c.officer
    });
  });
});
COLLECTIONS.sort((a, b) => a.when < b.when ? 1 : -1);

/* ===================== 7 · LEDGER (double entry) ===================== */
const FEE_LEDGER = [];
let lgSeq = 1;
function postEntry(when, charge, narration, debit, credit, amount, side){
  FEE_LEDGER.push({id: 'FJE-2026-' + pad(lgSeq++, 5), when, charge: (charge && charge.id) || String(charge), narration,
    account: side === 'Dr' ? debit : credit, side, amount,
    debit: side === 'Dr' ? amount : 0, credit: side === 'Cr' ? amount : 0,
    loan: charge.loan, cust: charge.cust, type: charge.type,
    status: 'Posted', lane: 'Ledger', severity: 'Low', owner: 'STF-009', region: 'Head office'});
}
CHARGES.forEach(c => {
  if(c.reversed === c.amount && c.reversed > 0) return;
  const amt = c.amount - c.reversed;
  postEntry(c.assessed, c, 'Assessment of ' + c.typeName, 'Fee receivable', c.kind === 'Penalty' ? 'Penalty income' : 'Fee income', amt, 'Dr');
  postEntry(c.assessed, c, 'Assessment of ' + c.typeName, 'Fee receivable', c.kind === 'Penalty' ? 'Penalty income' : 'Fee income', amt, 'Cr');
  if(c.paid > 0){
    postEntry(addDays(c.assessed, 2), c, 'Collection of ' + c.typeName, 'Cash and bank', 'Fee receivable', c.paid, 'Dr');
    postEntry(addDays(c.assessed, 2), c, 'Collection of ' + c.typeName, 'Cash and bank', 'Fee receivable', c.paid, 'Cr');
  }
  if(c.waived > 0){
    postEntry(addDays(c.assessed, 5), c, 'Waiver of ' + c.typeName, 'Waiver expense', 'Fee receivable', c.waived, 'Dr');
    postEntry(addDays(c.assessed, 5), c, 'Waiver of ' + c.typeName, 'Waiver expense', 'Fee receivable', c.waived, 'Cr');
  }
  if(c.reversed > 0){
    postEntry(c.assessed, c, 'Reversal of ' + c.typeName, c.kind === 'Penalty' ? 'Penalty income' : 'Fee income', 'Fee receivable', c.reversed, 'Dr');
    postEntry(c.assessed, c, 'Reversal of ' + c.typeName, c.kind === 'Penalty' ? 'Penalty income' : 'Fee income', 'Fee receivable', c.reversed, 'Cr');
  }
});

/* ===================== 8 · NOTICES ===================== */
const FEE_CHANNELS = {
  sms:   {provider: 'Africa’s Talking', sender: 'GOLDENFS', balance: 12480, status: 'Connected', latency: 610, lastSend: TODAY + ' 08:10'},
  email: {provider: 'SendGrid', sender: 'fees@goldenloan.mw', balance: 0, status: 'Connected', latency: 420, lastSend: TODAY + ' 08:12'}
};
const FEE_NOTIFY_RULES = [
  {id: 'fee-assessed', event: 'New fee assessment', channel: 'SMS', to: 'The customer', template: 'FEE-NEW-01', on: true},
  {id: 'penalty', event: 'Late payment penalty', channel: 'SMS', to: 'The customer', template: 'PEN-LATE-02', on: true},
  {id: 'reminder', event: 'Outstanding charges reminder', channel: 'SMS', to: 'The customer', template: 'FEE-DUE-03', on: true},
  {id: 'warning', event: 'Upcoming penalty warning', channel: 'SMS', to: 'The customer', template: 'PEN-SOON-04', on: true},
  {id: 'paid', event: 'Fee payment confirmation', channel: 'SMS', to: 'The customer', template: 'FEE-PAID-05', on: true},
  {id: 'waiver-ok', event: 'Waiver approved', channel: 'SMS', to: 'The customer', template: 'WVR-OK-06', on: true},
  {id: 'waiver-no', event: 'Waiver rejected', channel: 'Email', to: 'The customer', template: 'WVR-NO-07', on: true},
  {id: 'corrected', event: 'Charge correction', channel: 'Email', to: 'The customer', template: 'CHG-FIX-08', on: true},
  {id: 'internal', event: 'Approval needed', channel: 'Email', to: 'The approver', template: 'APR-NEED-09', on: true},
  {id: 'digest', event: 'Weekly charge digest', channel: 'Email', to: 'The finance team', template: 'FEE-DIG-10', on: false}
];
const FEE_NOTIFY_LOG = [];
for(let i = 0; i < 130; i++){
  const rule = pick(FEE_NOTIFY_RULES);
  const c = CHARGES[ri(0, CHARGES.length - 1)];
  const failed = rnd() < 0.07;
  FEE_NOTIFY_LOG.push({
    when: addDays(TODAY, -ri(0, 45)) + ' ' + pad(7 + (i % 12), 2) + ':' + pad((i * 11) % 60, 2),
    event: rule.event, channel: rule.channel, to: rule.channel === 'SMS'
      ? (CUST_BY_ID[c.cust] || {}).phone || '+265 991 000 000' : (CUST_BY_ID[c.cust] || {}).name || 'customer',
    reference: c.id, template: rule.template, status: failed ? 'Failed' : (rnd() < 0.12 ? 'Queued' : 'Delivered'),
    lane: 'Notifications', severity: 'Low', owner: 'STF-008', region: c.region
  });
}
FEE_NOTIFY_LOG.sort((a, b) => a.when < b.when ? 1 : -1);

/* ===================== 9 · PERMISSIONS ===================== */
const FEE_ROLES = ['Finance Officer', 'Collections Officer', 'Head of Credit', 'Internal Auditor', 'Administrator'];
const FEE_ROLE_STAFF = {
  'Finance Officer': 'STF-007', 'Collections Officer': 'STF-005', 'Head of Credit': 'STF-003',
  'Internal Auditor': 'STF-004', 'Administrator': 'STF-009'
};
const FEE_CAPS = ['View charges', 'Create fee types', 'Change rates', 'Assess fees', 'Assess penalties',
  'Record collections', 'Approve waivers', 'Approve reversals', 'Change settings', 'Export audit'];
const FEE_PERMS = {
  'Finance Officer':     [1,0,0,1,0,1,0,0,0,1],
  'Collections Officer': [1,0,0,1,1,1,0,0,0,0],
  'Head of Credit':      [1,1,1,1,1,1,1,1,0,1],
  'Internal Auditor':    [1,0,0,0,0,0,0,0,0,1],
  'Administrator':       [1,1,1,1,1,1,1,1,1,1]
};
const FEE_STAFF_ACTIONS = [];
for(let i = 0; i < 60; i++){
  const who = pick(STAFF);
  FEE_STAFF_ACTIONS.push({
    when: addDays(TODAY, -ri(0, 40)) + ' ' + pad(8 + (i % 10), 2) + ':' + pad((i * 13) % 60, 2),
    staff: who.id, action: pick(['Assessed a fee', 'Assessed a penalty', 'Approved a waiver', 'Reversed a charge',
      'Changed a fee rate', 'Exported the audit trail', 'Recorded a collection']),
    record: pick(CHARGES).id, outcome: rnd() < 0.94 ? 'Allowed' : 'Blocked',
    lane: 'Security', severity: rnd() < 0.12 ? 'High' : 'Low', owner: who.id, region: who.branch
  });
}
FEE_STAFF_ACTIONS.sort((a, b) => a.when < b.when ? 1 : -1);

/* ===================== 10 · DATABASE ===================== */
const FEE_DB_TABLES = [
  {table: 'fee_types', rows: FEE_TYPES.length, size: '24 kB', rls: 'Enabled', note: 'One row per charge definition; versioned by effective date', function: 'fn_fee_rate_on(code, date)', lastWrite: TODAY + ' 06:12'},
  {table: 'fee_assessments', rows: CHARGES.length, size: '486 kB', rls: 'Enabled', note: 'Every assessed fee and penalty, with the calculation kept', function: 'fn_assess_fee(loan, type)', lastWrite: TODAY + ' 08:04'},
  {table: 'fee_payments', rows: COLLECTIONS.length, size: '212 kB', rls: 'Enabled', note: 'Collections allocated against an assessment', function: 'fn_allocate_fee_payment(payment, charge)', lastWrite: TODAY + ' 08:22'},
  {table: 'fee_waivers', rows: WAIVERS.length, size: '38 kB', rls: 'Enabled', note: 'Requests, reasons, evidence and decisions', function: 'fn_approve_waiver(id, approver)', lastWrite: TODAY + ' 07:40'},
  {table: 'fee_reversals', rows: REVERSALS.length, size: '26 kB', rls: 'Enabled', note: 'Corrections never overwrite the original row', function: 'fn_reverse_charge(id, reason)', lastWrite: addDays(TODAY, -1) + ' 16:20'},
  {table: 'fee_ledger', rows: FEE_LEDGER.length, size: '694 kB', rls: 'Enabled', note: 'Double entry; debits equal credits on every batch', function: 'fn_post_fee_ledger(entry)', lastWrite: TODAY + ' 08:24'},
  {table: 'loans', rows: LOANS.length, size: '318 kB', rls: 'Enabled', note: 'Read-only here; the charge points at the loan', function: 'fn_loan_exposure(loan)', lastWrite: TODAY + ' 07:02'},
  {table: 'loan_products', rows: PRODUCTS.length, size: '18 kB', rls: 'Enabled', note: 'Product fee assignment and thresholds', function: 'fn_product_fees(product)', lastWrite: TODAY + ' 06:40'},
  {table: 'repayments', rows: PAYS.length, size: '742 kB', rls: 'Enabled', note: 'Charges are allocated after the instalment split', function: 'fn_split_repayment(payment)', lastWrite: TODAY + ' 08:20'},
  {table: 'repayment_schedules', rows: LOANS.length * 12, size: '1.2 MB', rls: 'Enabled', note: 'The due dates the penalty engine reads', function: 'fn_schedule_due(loan)', lastWrite: TODAY + ' 06:58'},
  {table: 'payment_receipts', rows: PAYS.length + COLLECTIONS.length, size: '560 kB', rls: 'Enabled', note: 'A receipt for every collection', function: 'fn_issue_receipt(payment)', lastWrite: TODAY + ' 08:25'},
  {table: 'audit_log', rows: 4820, size: '896 kB', rls: 'Enabled', note: 'Append only; the module audit reads this', function: 'fn_log_change(table, row)', lastWrite: TODAY + ' 08:26'}
];
const FEE_DB_FUNCS = [
  {name: 'fn_assess_fee', purpose: 'Assess one charge against a loan or application', invoker: 'Service role', calls: 8420, status: 'Healthy', lastRun: TODAY + ' 08:04'},
  {name: 'fn_penalty_run', purpose: 'Walk overdue instalments and assess penalties once', invoker: 'Scheduled job', calls: 620, status: 'Healthy', lastRun: TODAY + ' 06:00'},
  {name: 'fn_allocate_fee_payment', purpose: 'Split a payment into fee and penalty allocations', invoker: 'Service role', calls: 5140, status: 'Healthy', lastRun: TODAY + ' 08:22'},
  {name: 'fn_approve_waiver', purpose: 'Record a waiver decision and post the ledger', invoker: 'Head of credit', calls: 318, status: 'Healthy', lastRun: TODAY + ' 07:40'},
  {name: 'fn_reverse_charge', purpose: 'Reverse a charge without losing the original', invoker: 'Head of credit', calls: 196, status: 'Healthy', lastRun: addDays(TODAY, -1) + ' 16:20'},
  {name: 'fn_post_fee_ledger', purpose: 'Write a balanced pair of ledger entries', invoker: 'Service role', calls: 9640, status: 'Healthy', lastRun: TODAY + ' 08:26'},
  {name: 'fn_guard_self_approval', purpose: 'Refuse a waiver or reversal signed by its requester', invoker: 'Trigger', calls: 4820, status: 'Healthy', lastRun: TODAY + ' 08:19'},
  {name: 'fn_duplicate_charge', purpose: 'Block a second identical charge inside the window', invoker: 'Trigger', calls: 4820, status: 'Degraded', lastRun: TODAY + ' 08:21'}
];
const FEE_DB_ERRORS = [
  {when: TODAY + ' 08:21', code: '23505', message: 'duplicate key in fee_assessments — the duplicate guard held the second row', count: 2, status: 'Held'},
  {when: addDays(TODAY, -1) + ' 17:04', code: 'P0001', message: 'waiver refused: the requester may not approve their own request', count: 1, status: 'Blocked'},
  {when: addDays(TODAY, -2) + ' 09:32', code: '23514', message: 'penalty above the cap rejected by the check constraint', count: 3, status: 'Held'},
  {when: addDays(TODAY, -4) + ' 14:11', code: '40001', message: 'deadlock on fee_payments — retried and committed', count: 1, status: 'Retried'}
];
const FEE_MIGRATIONS = [
  {id: '20260101_01', name: 'fee_types and fee_assessments', when: '2026-01-01', status: 'Applied'},
  {id: '20260101_02', name: 'fee_ledger with a balance constraint', when: '2026-01-01', status: 'Applied'},
  {id: '20260301_01', name: 'fee_waivers with evidence', when: '2026-03-01', status: 'Applied'},
  {id: '20260401_01', name: 'failed payment charge and the duplicate guard', when: '2026-04-01', status: 'Applied'},
  {id: '20260501_01', name: 'early settlement fee on asset finance', when: '2026-05-01', status: 'Applied'},
  {id: '20260601_01', name: 'repeated late penalty (paused)', when: '2026-06-01', status: 'Applied'},
  {id: '20261020_01', name: 'penalty cap as a percentage of the overdue amount', when: '2026-10-20', status: 'Applied'}
];

/* ===================== 11 · REPORTS ===================== */
const FEE_REPORTS = [
  {key: 'fees', title: 'Fees assessed', desc: 'Every fee raised in the period, by type and product'},
  {key: 'penalties', title: 'Penalties assessed', desc: 'Late and missed payment penalties with the calculation'},
  {key: 'feecollected', title: 'Fees collected', desc: 'What was actually paid against each assessment'},
  {key: 'pencollected', title: 'Penalties collected', desc: 'Penalty collections, by method and officer'},
  {key: 'outstanding', title: 'Outstanding charges', desc: 'Everything still owed, aged by due date'},
  {key: 'waivers', title: 'Waivers and exemptions', desc: 'Requests, decisions, amounts and the reason given'},
  {key: 'reversed', title: 'Reversed charges', desc: 'Corrections with the original and the restated figure'},
  {key: 'byproduct', title: 'Charges by loan product', desc: 'Assessed, collected and outstanding per product'},
  {key: 'bycustomer', title: 'Charges by customer', desc: 'The customers carrying the most charges'},
  {key: 'bystaff', title: 'Charges by staff member', desc: 'Who assessed what, and who collected it'},
  {key: 'monthly', title: 'Monthly fee revenue', desc: 'Fee and penalty income month by month'},
  {key: 'recon', title: 'Reconciliation', desc: 'Assessed against collected against outstanding'}
];

/* ===================== 12 · AUDIT AND CONFIGURATION HISTORY ===================== */
const FEE_AUDIT = [];
let auSeq = 1;
function fpAudit(kind, what, from, to, by, reason, lane){
  const stamp = TODAY + ' ' + fpNow();
  const latest = FEE_AUDIT.reduce((m, a) => (a.when > m ? a.when : m), '');
  const entry = {id: 'FAU-2026-' + pad(auSeq++, 4), when: stamp > latest ? stamp : latest,
    kind, what, from, to, by, reason, lane: lane || 'Configuration',
    severity: kind === 'Penalty rule' ? 'High' : 'Medium', owner: by, region: (STAFF_BY_ID[by] || {}).branch || 'Lilongwe'};
  FEE_AUDIT.push(entry);
  return entry;
}
fpAudit('Fee configuration', 'Application processing fee (APF)', '1.00% · max MK 75,000', '1.00% · max MK 75,000 · unchanged', 'STF-009', 'Quarterly tariff review — no change', 'Configuration');
fpAudit('Fee configuration', 'Loan processing fee (LPF)', '1.25%', '1.50%', 'STF-003', 'Cost of funds increased in July', 'Configuration');
fpAudit('Penalty rule', 'Daily penalty rate', '0.15% per day', '0.20% per day', 'STF-003', 'Board resolution 2026/07', 'Penalties');
fpAudit('Penalty rule', 'Grace period', '7 days', '5 days', 'STF-003', 'Aligned to the repayment calendar', 'Penalties');
fpAudit('Penalty rule', 'Maximum penalty', 'MK 250,000 flat', 'MK 150,000 or 25% of overdue', 'STF-003', 'Cap expressed as a share of the overdue amount', 'Penalties');
fpAudit('Fee configuration', 'Repeated late payment penalty', 'Enabled at 7.50%', 'Paused', 'STF-003', 'Under review after customer feedback', 'Penalties');
fpAudit('Fee configuration', 'Statement fee', 'MK 3,000', 'MK 3,500', 'STF-009', 'Print and courier cost', 'Configuration');
fpAudit('Fee configuration', 'Payment processing fee', '—', '0.50% on mobile money only', 'STF-007', 'Rail charges passed on at cost', 'Configuration');
fpAudit('Approval threshold', 'Assessment needs a second signature above', 'MK 75,000', 'MK 100,000', 'STF-003', 'Delegation updated for the busy season', 'Security');
fpAudit('Approval threshold', 'Waiver approval threshold', 'MK 25,000', 'MK 50,000', 'STF-003', 'Head of credit may now sign up to MK 50,000', 'Security');
fpAudit('Settings', 'Disclosure before acceptance', 'Off', 'On', 'STF-009', 'Malawi disclosure requirement', 'Configuration');
fpAudit('Settings', 'Preserve historical rules', 'Off', 'On', 'STF-009', 'Charges must be reproducible', 'Configuration');
FEE_AUDIT.reverse();

const FEE_RULE_HISTORY = FEE_AUDIT.filter(a => a.kind === 'Penalty rule');
const FEE_CONFIG_HISTORY = FEE_AUDIT.filter(a => a.kind !== 'Penalty rule');

/* assessment history: the charge rows already carry their calculation */
const FEE_ASSESS_HISTORY = CHARGES.slice(0, 200).map(c => ({
  when: c.assessed, charge: c.id, kind: c.kind, type: c.typeName, cust: c.cust, loan: c.loan,
  amount: c.amount, calc: c.calc, officer: c.officer, status: c.status,
  lane: c.lane, severity: c.severity, owner: c.officer, region: c.region
}));

/* ===================== 13 · AGGREGATES ===================== */
function fpCharges(){
  return CHARGES.filter(c => inRange(c.assessed)
    && (!FILTER.kind || c.kind === FILTER.kind)
    && (!FILTER.type || c.type === FILTER.type)
    && passSeverity(c) && passStatus2(c) && passOwner(c) && passRegion(c) && passProduct(c)
    && (!FILTER.lane || c.lane === FILTER.lane)
    && matchQ(c.id, c.typeName, custName(c.cust), c.loan, c.status, c.reason));
}
function passStatus2(c){
  if(!FILTER.status) return true;
  return c.status === FILTER.status;
}
function fpWaivers(){ return WAIVERS.filter(w => inRange(w.requestedOn) && matchQ(w.id, w.charge, custName(w.cust), w.reason, w.status)); }
function fpReversals(){ return REVERSALS.filter(r => inRange(r.requestedOn) && matchQ(r.id, r.charge, custName(r.cust), r.reason, r.status)); }
function fpCollections(){ return COLLECTIONS.filter(c => inRange(c.when) && matchQ(c.id, c.charge, custName(c.cust), c.receipt, c.method)); }

function fpStats(){
  const cs = CHARGES;
  const fees = cs.filter(c => c.kind === 'Fee' && c.status !== 'Reversed');
  const pens = cs.filter(c => c.kind === 'Penalty' && c.status !== 'Reversed');
  const assessedFees = sum(fees, c => c.amount);
  const assessedPens = sum(pens, c => c.amount);
  const collectedFees = sum(cs.filter(c => c.kind === 'Fee'), c => c.paid);
  const collectedPens = sum(cs.filter(c => c.kind === 'Penalty'), c => c.paid);
  const outstandingFees = sum(cs.filter(c => c.kind === 'Fee'), c => c.balance);
  const outstandingPens = sum(cs.filter(c => c.kind === 'Penalty'), c => c.balance);
  const waived = sum(cs, c => c.waived);
  const reversed = sum(cs, c => c.reversed);
  const pendingAssess = cs.filter(c => c.status === 'Pending approval').length;
  const pendingWaivers = WAIVERS.filter(w => w.status === 'Pending').length;
  const reversedCount = cs.filter(c => c.status === 'Reversed').length;
  const total = assessedFees + assessedPens;
  const collectionRate = total ? (collectedFees + collectedPens) / total * 100 : 0;
  const atCap = cs.filter(c => c.status === 'At the cap').length;
  const score = clamp(100 - (pendingAssess * 1.4) - (pendingWaivers * 1.1) - (reversedCount * 0.5)
    - (outstandingPens / Math.max(1, assessedPens) * 18) - (atCap * 0.8), 0, 100);
  return {fees: fees.length, penalties: pens.length, assessedFees, assessedPens, collectedFees, collectedPens,
    outstandingFees, outstandingPens, waived, reversed, pendingAssess, pendingWaivers, reversedCount,
    total, collectionRate, score, atCap, outstanding: outstandingFees + outstandingPens,
    collected: collectedFees + collectedPens};
}

/* the things worth a red flag on the overview */
function fpIssues(){
  const out = [];
  WAIVERS.filter(w => w.status === 'Pending').slice(0, 3).forEach(w => out.push({
    when: w.requestedOn, label: 'Waiver waiting for a decision', detail: w.id + ' · ' + custName(w.cust) + ' · ' + money(w.waived), severity: 'Medium'
  }));
  CHARGES.filter(c => c.status === 'Pending approval').slice(0, 3).forEach(c => out.push({
    when: c.assessed, label: 'Assessment above the approval line', detail: c.id + ' · ' + c.typeName + ' · ' + money(c.amount), severity: 'High'
  }));
  DUPLICATES.slice(0, 2).forEach(d => out.push({
    when: d.when, label: 'Possible duplicate charge', detail: d.charge + ' · twin ' + d.twin, severity: 'High'
  }));
  CHARGES.filter(c => c.status === 'At the cap').slice(0, 2).forEach(c => out.push({
    when: c.assessed, label: 'Penalty reached the maximum', detail: c.id + ' · ' + custName(c.cust) + ' · ' + money(c.amount), severity: 'Medium'
  }));
  REVERSALS.filter(r => r.status === 'Pending').slice(0, 2).forEach(r => out.push({
    when: r.requestedOn, label: 'Reversal waiting for approval', detail: r.id + ' · ' + r.typeName + ' · ' + money(r.amount), severity: 'Medium'
  }));
  return out;
}
/* keep the history views live: a change written now appears in the history at once */
(function(){
  const base = fpAudit;
  fpAudit = function(kind, what, from, to, by, reason, lane){
    const e = base(kind, what, from, to, by, reason, lane);
    if(e) (kind === 'Penalty rule' ? FEE_RULE_HISTORY : FEE_CONFIG_HISTORY).unshift(e);
    return e;
  };
})();
</script>
