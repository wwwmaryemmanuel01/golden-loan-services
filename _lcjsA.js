<script>
/* ============================================================
   LOAN CALCULATOR (1/2)
   The products, the formatters and the arithmetic. Nothing in
   this file touches the DOM, so the figures can be checked on
   their own — and the same functions run for the comparison.
   ============================================================ */

/* ---- every major product on the book ---- */
const LC_PRODUCTS = [
  {name:'Personal Loans',       code:'PL-01', min:50000,   max:1000000,  rate:3.0, fee:2.0, method:'flat',     terms:[1,3,6,12],
   desc:'Individual financial needs and emergencies.'},
  {name:'Business Loans',       code:'BL-02', min:100000,  max:10000000, rate:3.5, fee:2.5, method:'reducing', terms:[6,9,12,18,24,36],
   desc:'Business operations, expansion and stock purchases.'},
  {name:'Agricultural Loans',   code:'AL-03', min:40000,   max:1500000,  rate:3.0, fee:2.0, method:'flat',     terms:[3,6,9,12],
   desc:'Farming, livestock and agricultural equipment.'},
  {name:'Salary Advance Loans', code:'SA-04', min:50000,   max:800000,   rate:2.5, fee:1.5, method:'flat',     terms:[1,3,6],
   desc:'Short-term loans for employed customers.'},
  {name:'Collateral Loans',     code:'CL-05', min:500000,  max:10000000, rate:2.8, fee:2.0, method:'reducing', terms:[12,18,24,36],
   desc:'Loans secured by approved assets.'}
];

/* the defaults the page opens on, and the reset target */
const LC_DEFAULTS = {
  product:'custom',
  principal:500000,
  method:'flat',
  rate:1,
  durValue:1,
  durUnit:'months',
  annual:12,
  fee:1,
  freq:'monthly',
  redStyle:'equal-instalment'
};

const LC_MON  = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const LC_DOW  = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const LC_FREQ = {monthly:{label:'Monthly', short:'month', ppy:12}, fortnightly:{label:'Fortnightly', short:'fortnight', ppy:26}, weekly:{label:'Weekly', short:'week', ppy:52}};

/* ---- formatters ---- */
function lcEl(id){ return document.getElementById(id); }
function lcEsc(s){
  return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
  });
}
function lcK(n){ return Math.round(Number(n) || 0).toLocaleString('en-US'); }
function lcMoney(n){ return 'MK ' + lcK(n); }
function lcPct(n, dp){ return (Number(n) || 0).toFixed(dp == null ? 2 : dp) + '%'; }
function lcPad(n){ return String(n).length < 2 ? '0' + n : String(n); }

function lcDateText(d){
  return lcPad(d.getDate()) + ' ' + LC_MON[d.getMonth()] + ' ' + d.getFullYear();
}
function lcDateFull(d){
  return LC_DOW[d.getDay()] + ' ' + lcDateText(d);
}
function lcISO(d){
  return d.getFullYear() + '-' + lcPad(d.getMonth() + 1) + '-' + lcPad(d.getDate());
}
function lcParseDate(s){
  var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || ''));
  if (!m) return lcToday();
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}
function lcToday(){ var d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
function lcDaysInMonth(y, m){ return new Date(y, m + 1, 0).getDate(); }

/* the date one period after the start, clamped at the month end */
function lcDueOn(start, k, freq){
  if (freq === 'weekly')      return new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7 * k);
  if (freq === 'fortnightly') return new Date(start.getFullYear(), start.getMonth(), start.getDate() + 14 * k);
  var y = start.getFullYear(), m = start.getMonth() + k;
  y += Math.floor(m / 12); m = ((m % 12) + 12) % 12;
  var day = Math.min(start.getDate(), lcDaysInMonth(y, m));
  return new Date(y, m, day);
}
function lcDaysBetween(a, b){ return Math.round((b - a) / 86400000); }

/* ---- the shapes of the calculation ---- */
function lcPPY(freq){ return (LC_FREQ[freq] || LC_FREQ.monthly).ppy; }
function lcMonths(value, unit){
  var v = Math.max(0, Number(value) || 0);
  if (unit === 'years')  return v * 12;
  if (unit === 'weeks')  return v * 12 / 52;
  return v;
}
function lcMonthsText(months){
  var m = Math.round(months * 10) / 10;
  if (m === 12) return '1 year';
  if (m > 11.9 && m % 12 === 0) return (m / 12) + ' years';
  if (m === 1) return '1 month';
  if (m < 1) return m + ' months';
  return m + ' months';
}
/* how the user typed the term: "6 weeks", "2 years", "1 month" */
function lcDurationLabel(v, unit){
  var n = Number(v) || 0;
  var u = unit === 'years' ? 'year' : unit === 'weeks' ? 'week' : 'month';
  return n + ' ' + u + (n === 1 ? '' : 's');
}

/* The one function everything else calls.
   c = {principal, rate, durValue, durUnit, annual, fee, method, freq, redStyle, start} */
function lcCompute(c){
  var P        = Math.max(0, Number(c.principal) || 0);
  var months   = lcMonths(c.durValue, c.durUnit);
  var freq     = LC_FREQ[c.freq] ? c.freq : 'monthly';
  var ppy      = lcPPY(freq);
  var n        = Math.max(1, Math.round(months / 12 * ppy));
  var annualM  = Math.max(1, Number(c.annual) || 12);
  var rateM    = Math.max(0, Number(c.rate) || 0) / 100;      /* per month, as quoted */
  var annual   = rateM * annualM;                             /* cost of one annual period */
  var i        = annual / ppy;                                /* rate per instalment */
  var feePct   = Math.max(0, Number(c.fee) || 0);
  var feeTotal = P * feePct / 100;
  var start    = lcParseDate(c.start);

  var rows = [], interestTotal = 0, bal = P, k, int, prin, pmt;

  if (c.method === 'flat'){
    /* flat: interest on the original principal for the whole term */
    interestTotal = P * rateM * months;
    var perInt  = interestTotal / n;
    var perPrin = P / n;
    for (k = 1; k <= n; k++){
      int  = perInt;
      prin = perPrin;
      if (k === n){ int = interestTotal - perInt * (n - 1); prin = P - perPrin * (n - 1); }
      rows.push({no:k, date:lcDueOn(start, k, freq), days:lcDaysBetween(start, lcDueOn(start, k, freq)),
                 opening:bal, interest:int, principal:prin, instalment:int + prin, closing:bal - prin});
      bal -= prin;
    }
    pmt = P / n + interestTotal / n;
  } else if (c.redStyle === 'equal-principal'){
    /* reducing balance, principal repaid in equal slices */
    var slice = P / n;
    for (k = 1; k <= n; k++){
      int  = bal * i;
      prin = (k === n) ? bal : slice;
      rows.push({no:k, date:lcDueOn(start, k, freq), days:lcDaysBetween(start, lcDueOn(start, k, freq)),
                 opening:bal, interest:int, principal:prin, instalment:int + prin, closing:bal - prin});
      interestTotal += int;
      bal -= prin;
    }
    pmt = null;
  } else {
    /* reducing balance, one steady instalment */
    pmt = i > 0 ? P * i / (1 - Math.pow(1 + i, -n)) : P / n;
    for (k = 1; k <= n; k++){
      int  = bal * i;
      prin = (k === n) ? bal : pmt - int;
      rows.push({no:k, date:lcDueOn(start, k, freq), days:lcDaysBetween(start, lcDueOn(start, k, freq)),
                 opening:bal, interest:int, principal:prin, instalment:int + prin, closing:bal - prin});
      interestTotal += int;
      bal -= prin;
    }
  }

  /* the schedule closes at zero by construction; guard the last kwanza */
  if (rows.length){
    var last = rows[rows.length - 1];
    if (Math.abs(last.closing) < 1) last.closing = 0;
  }

  var totalFees = feeTotal;                       /* the only fee in this calculation */
  /* the fee is netted at disbursement, the way the book charges it, so it is a
     cost of the loan rather than a second charge to repay */
  var totalRepay = P + interestTotal;
  var firstInst  = rows.length ? rows[0].instalment : 0;
  var lastInst   = rows.length ? rows[rows.length - 1].instalment : 0;

  return {
    principal:P, months:months, monthsText:lcMonthsText(months), n:n, freq:freq, ppy:ppy,
    ratePerMonth:rateM * 100, ratePerInstalment:i * 100, annualRate:annual * 100, annualMonths:annualM,
    method:c.method, redStyle:c.redStyle, feePct:feePct, feeTotal:feeTotal, totalFees:totalFees,
    interestTotal:interestTotal, totalRepay:totalRepay,
    netCash:P - feeTotal, costOfCredit:interestTotal + totalFees,
    costShare:P > 0 ? (interestTotal + totalFees) / P * 100 : 0,
    firstInstalment:firstInst, lastInstalment:lastInst,
    level:pmt != null, start:start, rows:rows
  };
}
</script>
