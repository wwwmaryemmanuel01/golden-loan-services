<script>
/* ============================================================
   LOAN CALCULATOR (2/2)
   Reading the form, drawing the result sheet and the schedule,
   comparing every product, and taking the figures away.
   ============================================================ */
(function(){
  if (window.__glsCalc) return;
  window.__glsCalc = 1;

  var STORE = 'gls_calc_v1';
  var methodLabel = m => m === 'reducing' ? 'Reducing balance' : 'Flat';
  var fmt = n => lcK(n);
  var dayText = d => lcDateFull(d);

  /* ---------------------------- toast ---------------------------- */
  function toast(msg, type){
    var host = lcEl('toasts');
    if (!host) return;
    var t = document.createElement('div');
    t.className = 'toast ' + (type || 'ok');
    t.innerHTML = '<span>' + (type === 'err' ? '⚠' : type === 'info' ? 'ℹ' : '✓') + '</span><div>' + lcEsc(msg) + '</div>';
    host.appendChild(t);
    setTimeout(function(){ t.style.opacity = '0'; t.style.transform = 'translateX(16px)'; t.style.transition = '.25s'; }, 2600);
    setTimeout(function(){ if (t.parentNode) t.parentNode.removeChild(t); }, 3000);
  }

  /* ---------------------------- modal ---------------------------- */
  function openModal(title, sub, body, actions){
    lcEl('modalTitle').textContent = title;
    lcEl('modalSub').textContent = sub || '';
    lcEl('modalBody').innerHTML = body;
    lcEl('modalFoot').innerHTML = '';
    (actions || []).forEach(function(a){
      var b = document.createElement('button');
      b.className = 'btn ' + (a.cls || 'btn-ghost');
      b.textContent = a.label;
      b.onclick = a.act === 'close' ? function(){ lcEl('modal').classList.remove('on'); } : a.act;
      lcEl('modalFoot').appendChild(b);
    });
    lcEl('modal').classList.add('on');
  }
  var closeBtn = lcEl('modalClose');
  if (closeBtn) closeBtn.onclick = function(){ lcEl('modal').classList.remove('on'); };
  var modal = lcEl('modal');
  if (modal){
    modal.addEventListener('click', function(e){ if (e.target === modal) modal.classList.remove('on'); });
    document.addEventListener('keydown', function(e){ if (e.key === 'Escape') modal.classList.remove('on'); });
  }

  /* ---------------------------- the form ---------------------------- */
  function productList(){
    return LC_PRODUCTS.map(function(p){ return {value:p.code, label:p.name + ' · ' + p.code}; })
      .concat([{value:'custom', label:'Custom loan · your own rates'}]);
  }

  function fillProducts(){
    var sel = lcEl('lcProduct');
    if (!sel) return;
    sel.innerHTML = productList().map(function(o){
      return '<option value="' + lcEsc(o.value) + '">' + lcEsc(o.label) + '</option>';
    }).join('');
  }

  function prodBy(code){
    for (var i = 0; i < LC_PRODUCTS.length; i++) if (LC_PRODUCTS[i].code === code) return LC_PRODUCTS[i];
    return null;
  }

  function cfg(){
    return {
      product:  (lcEl('lcProduct') || {}).value || 'custom',
      principal:num('lcAmount', LC_DEFAULTS.principal),
      method:   (lcEl('lcMethod') || {}).value || 'flat',
      rate:     num('lcRate', LC_DEFAULTS.rate),
      durValue: num('lcDur', LC_DEFAULTS.durValue),
      durUnit:  (lcEl('lcDurUnit') || {}).value || 'months',
      annual:   num('lcAnnual', LC_DEFAULTS.annual),
      fee:      num('lcFee', LC_DEFAULTS.fee),
      freq:     (lcEl('lcFreq') || {}).value || 'monthly',
      redStyle: (lcEl('lcRedStyle') || {}).value || 'equal-instalment',
      start:    (lcEl('lcDate') || {}).value || lcISO(lcToday())
    };
  }
  function num(id, fallback){
    var n = lcEl(id);
    if (!n || n.value === '') return fallback;
    var v = Number(n.value);
    return isNaN(v) ? fallback : v;
  }

  function setVal(id, v){ var n = lcEl(id); if (n != null && v != null) n.value = v; }

  /* the product carries its own rate, fee and method — applied, then editable */
  function applyProduct(code, opts){
    var p = prodBy(code);
    if (!p){
      if (!opts || !opts.quiet) toast('Custom loan — set your own rate, fee and term', 'info');
      return;
    }
    setVal('lcRate', p.rate);
    setVal('lcFee', p.fee);
    setVal('lcMethod', p.method);
    setVal('lcDur', p.terms[0]);
    setVal('lcDurUnit', 'months');
    if (!opts || !opts.quiet) toast(p.name + ' terms loaded — ' + p.rate + '% a month, ' + p.fee + '% fee', 'ok');
  }

  /* ---------------------------- saving ---------------------------- */
  function save(){
    try { localStorage.setItem(STORE, JSON.stringify(cfg())); } catch (e) {}
  }
  function load(){
    var raw = null;
    try { raw = localStorage.getItem(STORE); } catch (e) {}
    if (!raw) return false;
    var c;
    try { c = JSON.parse(raw); } catch (e) { return false; }
    if (!c || typeof c !== 'object') return false;
    /* a product saved under an older catalogue no longer exists — fall back */
    if (c.product != null && c.product !== 'custom' && !prodBy(c.product)) c.product = LC_DEFAULTS.product;
    ['product','method','durUnit','freq','redStyle'].forEach(function(k){
      if (c[k] != null) setVal(k === 'product' ? 'lcProduct' : k === 'method' ? 'lcMethod' : k === 'durUnit' ? 'lcDurUnit' : k === 'freq' ? 'lcFreq' : 'lcRedStyle', c[k]);
    });
    setVal('lcAmount', c.principal);  setVal('lcRate', c.rate);
    setVal('lcDur', c.durValue);      setVal('lcAnnual', c.annual);
    setVal('lcFee', c.fee);           setVal('lcDate', c.start);
    return true;
  }

  function reset(){
    setVal('lcProduct', LC_DEFAULTS.product);
    setVal('lcAmount', LC_DEFAULTS.principal);
    setVal('lcMethod', LC_DEFAULTS.method);
    setVal('lcRate', LC_DEFAULTS.rate);
    setVal('lcDur', LC_DEFAULTS.durValue);
    setVal('lcDurUnit', LC_DEFAULTS.durUnit);
    setVal('lcAnnual', LC_DEFAULTS.annual);
    setVal('lcFee', LC_DEFAULTS.fee);
    setVal('lcFreq', LC_DEFAULTS.freq);
    setVal('lcRedStyle', LC_DEFAULTS.redStyle);
    setVal('lcDate', lcISO(lcToday()));
    render();
    toast('Back to the defaults: 1% a month, 1 month, a 1-year period, a 1% fee');
  }

  /* ---------------------------- the product card ---------------------------- */
  function renderProductCard(c){
    var host = lcEl('lcProdInfo');
    if (!host) return;
    var p = prodBy(c.product);
    if (!p){
      host.innerHTML =
        '<div class="lcprod">' +
          '<div class="pn">Custom loan</div>' +
          '<div class="pc">No product attached · every term is yours to set</div>' +
          '<div class="pgrid">' +
            '<div><div class="pk">Rate</div><div class="pv">' + lcPct(c.rate) + ' a month</div></div>' +
            '<div><div class="pk">Fee</div><div class="pv">' + lcPct(c.fee) + '</div></div>' +
            '<div><div class="pk">Method</div><div class="pv">' + methodLabel(c.method) + '</div></div>' +
            '<div><div class="pk">Duration</div><div class="pv">' + lcEsc(c.durValue + ' ' + c.durUnit) + '</div></div>' +
          '</div>' +
        '</div>' +
        '<div class="qhint" style="margin-top:8px">A custom loan is priced by hand; nothing is checked against a product ticket.</div>';
      return;
    }
    var P = c.principal;
    var out = P < p.min ? 'Below the product minimum of ' + lcMoney(p.min)
            : P > p.max ? 'Above the product maximum of ' + lcMoney(p.max)
            : 'Inside the product range';
    var tone = (P < p.min || P > p.max) ? 'b-await' : 'b-ok';
    host.innerHTML =
      '<div class="lcprod">' +
        '<div style="display:flex;align-items:flex-start;gap:8px">' +
          '<div><div class="pn">' + lcEsc(p.name) + '</div><div class="pc">' + lcEsc(p.code) + '</div></div>' +
          '<span class="badge ' + tone + '" style="margin-left:auto">' + lcEsc(out) + '</span>' +
        '</div>' +
        (p.desc ? '<div class="qhint" style="margin:3px 0 7px">' + lcEsc(p.desc) + '</div>' : '') +
        '<div class="pgrid">' +
          '<div><div class="pk">Range</div><div class="pv">' + fmt(p.min) + ' – ' + fmt(p.max) + '</div></div>' +
          '<div><div class="pk">Rate</div><div class="pv">' + lcPct(p.rate) + ' a month</div></div>' +
          '<div><div class="pk">Processing fee</div><div class="pv">' + lcPct(p.fee) + '</div></div>' +
          '<div><div class="pk">Method</div><div class="pv">' + methodLabel(p.method) + '</div></div>' +
          '<div><div class="pk">Terms offered</div><div class="pv">' + p.terms.join(', ') + ' months</div></div>' +
          '<div><div class="pk">On this loan</div><div class="pv">' + lcEsc(c.monthsText) + '</div></div>' +
        '</div>' +
      '</div>' +
      '<div class="qhint" style="margin-top:8px">Choosing a product loads its rate, fee and method; change any of them and the loan simply reads as a custom one.</div>';
  }

  /* ---------------------------- result sheet ---------------------------- */
  function renderResult(c, r){
    var figs = lcEl('lcFigs');
    if (figs){
      var f = [
        {k:'Principal', v:lcMoney(r.principal), n:'The amount lent before the fee'},
        {k:'Processing fee', v:lcPct(r.feePct), n:lcMoney(r.feeTotal) + ' charged once, up front'},
        {k:'Interest rate', v:lcPct(r.ratePerMonth) + ' a month', n:lcPct(r.annualRate) + ' a year at a ' + r.annualMonths + '-month annual period'},
        {k:'Duration period', v:lcEsc(lcDurationLabel(c.durValue, c.durUnit)), n:r.monthsText + ' · ' + r.n + ' ' + LC_FREQ[r.freq].label.toLowerCase() + ' instalment' + (r.n === 1 ? '' : 's')},
        {k:'Interest', v:lcMoney(r.interestTotal), n:methodLabel(r.method) + ' · ' + lcPct(r.ratePerInstalment) + ' a ' + LC_FREQ[r.freq].short, cls:'blue'},
        {k:'Total fees', v:lcMoney(r.totalFees), n:'Processing fee only — no penalty or insurance'},
        {k:'Total repayment', v:lcMoney(r.totalRepay), n:'Principal + interest; the fee is netted at disbursement', cls:'gold'},
        {k:'Schedule with dates', v:r.rows.length + ' dates', n:lcDateText(r.rows[0].date) + ' to ' + lcDateText(r.rows[r.rows.length - 1].date)}
      ];
      figs.innerHTML = f.map(function(x){
        return '<div class="lcfig ' + (x.cls || '') + '">' +
          '<div class="fk">' + lcEsc(x.k) + '</div>' +
          '<div class="fv">' + x.v + '</div>' +
          '<div class="fn">' + x.n + '</div></div>';
      }).join('');
    }

    var total = lcEl('lcTotal');
    if (total) total.textContent = lcMoney(r.totalRepay);
    var sub = lcEl('lcTotalSub');
    if (sub){
      sub.textContent = r.n + ' × ' + lcMoney(r.firstInstalment) +
        (r.level ? ' a ' + LC_FREQ[r.freq].short : ' at first, falling') +
        ' · ' + lcPct(r.ratePerMonth) + ' a month · ' + lcEsc(r.monthsText);
    }
    var side = lcEl('lcHeroSide');
    if (side){
      side.innerHTML =
        '<div class="hcell"><span>' + (r.level ? 'Instalment' : 'First instalment') + '</span><b>' + lcMoney(r.firstInstalment) + '</b></div>' +
        '<div class="hcell"><span>Net cash</span><b>' + lcMoney(r.netCash) + '</b></div>' +
        '<div class="hcell"><span>Cost of credit</span><b>' + lcMoney(r.costOfCredit) + '</b></div>';
    }

    var p2 = lcEl('lcResPill');
    if (p2) p2.textContent = methodLabel(r.method) + ' · ' + r.n + ' instalment' + (r.n === 1 ? '' : 's');
    var sub2 = lcEl('lcResSub');
    if (sub2){
      var pd = prodBy(c.product);
      sub2.textContent = (pd ? pd.name : 'Custom loan') + ' · ' + lcMoney(r.principal) + ' over ' + r.monthsText +
        ' · disbursed ' + lcDateText(r.start);
    }

    var k1 = lcEl('lcK1'); if (k1) k1.textContent = lcMoney(r.totalRepay);
    var k2 = lcEl('lcK2'); if (k2) k2.textContent = lcMoney(r.firstInstalment);
    var k2s = lcEl('lcK2s'); if (k2s) k2s.textContent = r.level ? 'level, ' + LC_FREQ[r.freq].short + 'ly' : 'then ' + lcMoney(r.lastInstalment);
    var k3 = lcEl('lcK3'); if (k3) k3.textContent = lcPct(r.costShare, 1);
  }

  /* ---------------------------- the schedule ---------------------------- */
  function renderSchedule(c, r){
    var head = lcEl('lcSchHead'), body = lcEl('lcSchBody'), foot = lcEl('lcSchFoot');
    if (!head || !body) return;
    head.innerHTML = '<tr>' +
      '<th style="width:38px">#</th>' +
      '<th>Due date</th>' +
      '<th class="num">Days</th>' +
      '<th class="num">Opening balance</th>' +
      '<th class="num">Interest</th>' +
      '<th class="num">Principal</th>' +
      '<th class="num">Instalment</th>' +
      '<th class="num">Closing balance</th>' +
    '</tr>';

    var sumInt = 0, sumPrin = 0, sumInst = 0;
    body.innerHTML = r.rows.map(function(x, idx){
      sumInt += x.interest; sumPrin += x.principal; sumInst += x.instalment;
      var cls = idx === 0 ? ' class="lcfirst"' : '';
      if (idx === r.rows.length - 1) cls = ' class="lclast"';
      return '<tr' + cls + '>' +
        '<td><b>' + x.no + '</b><div class="dueno">of ' + r.n + '</div></td>' +
        '<td><span style="font-weight:700">' + lcDateText(x.date) + '</span><div class="dueno">' + lcEsc(LC_DOW[x.date.getDay()]) + '</div></td>' +
        '<td class="num">' + x.days + '</td>' +
        '<td class="num">' + fmt(x.opening) + '</td>' +
        '<td class="num">' + fmt(x.interest) + '</td>' +
        '<td class="num">' + fmt(x.principal) + '</td>' +
        '<td class="num"><b>' + fmt(x.instalment) + '</b></td>' +
        '<td class="num">' + fmt(Math.abs(x.closing) < 1 ? 0 : x.closing) + '</td>' +
      '</tr>';
    }).join('') +
    '<tr class="lcfoot">' +
      '<td colspan="2">Total</td>' +
      '<td class="num"></td>' +
      '<td class="num"></td>' +
      '<td class="num">' + fmt(sumInt) + '</td>' +
      '<td class="num">' + fmt(sumPrin) + '</td>' +
      '<td class="num">' + fmt(sumInst) + '</td>' +
      '<td class="num">0</td>' +
    '</tr>';

    var cnt = lcEl('lcSchCount');
    if (cnt) cnt.textContent = r.n + ' instalment' + (r.n === 1 ? '' : 's') + ' · ' + LC_FREQ[r.freq].label.toLowerCase();
    if (foot){
      foot.textContent = 'First instalment ' + lcDateText(r.rows[0].date) + ', last ' +
        lcDateText(r.rows[r.rows.length - 1].date) + '. Every figure is rounded to the nearest kwacha; the fee of ' +
        lcMoney(r.feeTotal) + ' is taken at disbursement, so the customer receives ' + lcMoney(r.netCash) + '.';
    }
  }

  /* ---------------------------- the formulas ---------------------------- */
  function renderFormula(c, r){
    var host = lcEl('lcFormula');
    if (!host) return;
    var P = lcMoney(r.principal);
    var per = LC_FREQ[r.freq].short;
    var lines;
    if (r.method === 'flat'){
      lines = 'Interest = Principal × rate × months<br>' +
        '<b>' + lcMoney(r.interestTotal) + ' = ' + P + ' × ' + lcPct(r.ratePerMonth) + ' × ' + (Math.round(r.months * 100) / 100) + '</b><br>' +
        'Instalment = (Principal + Interest) ÷ ' + r.n + ' = <b>' + lcMoney(r.firstInstalment) + '</b>';
    } else if (r.redStyle === 'equal-principal'){
      lines = 'Rate a ' + per + ' = ' + lcPct(r.ratePerInstalment) + '<br>' +
        'Principal a ' + per + ' = Principal ÷ ' + r.n + ' = <b>' + lcMoney(r.principal / r.n) + '</b><br>' +
        'Interest a ' + per + ' = outstanding balance × ' + lcPct(r.ratePerInstalment) + '<br>' +
        'Total interest = <b>' + lcMoney(r.interestTotal) + '</b>';
    } else {
      lines = 'i = ' + lcPct(r.ratePerInstalment) + ' a ' + per + ' · n = ' + r.n + '<br>' +
        'Instalment = P × i ÷ (1 − (1 + i)<sup>−n</sup>)<br>' +
        '= ' + P + ' × ' + lcPct(r.ratePerInstalment) + ' ÷ (1 − (1 + ' + lcPct(r.ratePerInstalment) + ')<sup>−' + r.n + '</sup>)' +
        ' = <b>' + lcMoney(r.firstInstalment) + '</b><br>' +
        'Total interest = instalments − principal = <b>' + lcMoney(r.interestTotal) + '</b>';
    }
    host.innerHTML = lines;
  }

  function renderDerived(c, r){
    var host = lcEl('lcDerived');
    if (!host) return;
    var cells = [
      ['Instalments', r.n, LC_FREQ[r.freq].label.toLowerCase() + ' · ' + r.ppy + ' a year'],
      ['Rate a ' + LC_FREQ[r.freq].short, lcPct(r.ratePerInstalment, 3), 'from ' + lcPct(r.ratePerMonth) + ' a month'],
      ['Annual cost', lcPct(r.annualRate), 'over a ' + r.annualMonths + '-month annual period'],
      ['Net disbursement', lcMoney(r.netCash), 'after the ' + lcMoney(r.feeTotal) + ' fee'],
      ['Cost of credit', lcPct(r.costShare, 1), 'of the principal, all in']
    ];
    host.innerHTML = cells.map(function(x){
      return '<div class="kpi"><div class="kl">' + lcEsc(x[0]) + '</div><div class="kv">' + lcEsc(x[1]) + '</div>' +
        '<div class="ks">' + lcEsc(x[2]) + '</div></div>';
    }).join('');
  }

  function renderBand(c, r){
    var host = lcEl('lcBand');
    if (!host) return;
    var pd = prodBy(c.product);
    var cells = [
      ['Principal', lcMoney(r.principal)],
      ['Interest', lcMoney(r.interestTotal)],
      ['Total repayment', lcMoney(r.totalRepay)],
      ['Method', methodLabel(r.method)]
    ];
    host.innerHTML = cells.map(function(x){
      return '<div class="band-stat"><b>' + lcEsc(x[1]) + '</b><span>' + lcEsc(x[0]) + '</span></div>';
    }).join('');
    var pill = lcEl('lcProdPill');
    if (pill) pill.textContent = pd ? pd.name + ' · ' + pd.code : 'Custom loan';
    var mp = lcEl('lcMethodPill');
    if (mp) mp.textContent = methodLabel(r.method);
  }

  function renderHints(c, r){
    var h;
    h = lcEl('lcMethodHint');
    if (h) h.textContent = r.method === 'flat'
      ? 'Interest on the original principal for the whole term — every instalment is the same.'
      : (r.redStyle === 'equal-principal'
        ? 'Interest on the reducing balance; the principal is repaid in equal slices and instalments fall.'
        : 'Interest on the reducing balance, paid back in one steady instalment.');
    h = lcEl('lcRateHint');
    if (h) h.textContent = lcPct(r.ratePerMonth) + ' a month · ' + lcPct(r.annualRate) + ' a year at a ' + r.annualMonths + '-month annual period.';
    h = lcEl('lcDurHint');
    if (h) h.textContent = lcEsc(r.monthsText) + ' · ' + r.n + ' ' + LC_FREQ[r.freq].label.toLowerCase() + ' instalment' + (r.n === 1 ? '' : 's') + '.';
    h = lcEl('lcAnnualHint');
    if (h) h.textContent = r.annualMonths === 12 ? 'The rate is annualised over 12 months.' : 'The rate is annualised over ' + r.annualMonths + ' months.';
    h = lcEl('lcFeeHint');
    if (h) h.textContent = lcMoney(r.feeTotal) + ' on this loan, taken at disbursement.';
    h = lcEl('lcFreqHint');
    if (h) h.textContent = LC_FREQ[r.freq].label + ' instalments, ' + r.ppy + ' a year.';
    /* reducing style only applies to a reducing loan */
    var rs = lcEl('lcRedStyle'), wrap = lcEl('lcRedWrap');
    if (rs) rs.disabled = r.method !== 'reducing';
    if (wrap) wrap.style.opacity = r.method === 'reducing' ? '1' : '.55';
  }

  /* ---------------------------- comparison ---------------------------- */
  function renderCompare(c){
    var head = lcEl('lcCmpHead'), body = lcEl('lcCmpBody'), foot = lcEl('lcCmpFoot');
    if (!head || !body) return;

    head.innerHTML = '<tr>' +
      '<th>Loan product</th><th>Method</th><th class="num">Term</th><th class="num">Rate</th>' +
      '<th class="num">Fee</th><th class="num">Interest</th><th class="num">Total fees</th>' +
      '<th class="num">Total repayment</th><th></th>' +
    '</tr>';

    var rows = LC_PRODUCTS.map(function(p){
      var rr = lcCompute({
        principal: c.principal, rate: p.rate, fee: p.fee, method: p.method,
        redStyle: 'equal-instalment', freq: c.freq, annual: c.annual,
        durValue: p.terms[0], durUnit: 'months', start: c.start
      });
      return {p:p, r:rr};
    });

    var cheapest = rows.reduce(function(a, b){ return b.r.totalRepay < a.r.totalRepay ? b : a; }, rows[0]);
    var dearest  = rows.reduce(function(a, b){ return b.r.totalRepay > a.r.totalRepay ? b : a; }, rows[0]);

    body.innerHTML = rows.map(function(x){
      var cls = x === cheapest ? ' class="best"' : '';
      var share = dearest.r.totalRepay > 0 ? Math.round(x.r.totalRepay / dearest.r.totalRepay * 100) : 0;
      return '<tr' + cls + '>' +
        '<td><div style="font-weight:800;font-size:11.5px">' + lcEsc(x.p.name) + '</div>' +
          '<div style="font-size:9.5px;color:var(--muted)">' + lcEsc(x.p.code) + ' · ' + fmt(x.p.min) + '–' + fmt(x.p.max) + '</div>' +
          (x === cheapest ? '<span class="badge b-ok" style="margin-top:3px">Cheapest here</span>' : '') +
        '</td>' +
        '<td style="font-size:10.5px">' + methodLabel(x.p.method) + '</td>' +
        '<td class="num">' + x.p.terms[0] + ' mo</td>' +
        '<td class="num">' + lcPct(x.p.rate) + '</td>' +
        '<td class="num">' + lcPct(x.p.fee) + '</td>' +
        '<td class="num">' + fmt(x.r.interestTotal) + '</td>' +
        '<td class="num">' + fmt(x.r.totalFees) + '</td>' +
        '<td class="num"><b>' + fmt(x.r.totalRepay) + '</b>' +
          '<div class="cbar"><i style="width:' + share + '%"></i></div></td>' +
        '<td><button class="btn btn-ghost btn-sm usebtn" data-use="' + lcEsc(x.p.code) + '">Use</button></td>' +
      '</tr>';
    }).join('');

    var btns = body.querySelectorAll('[data-use]');
    for (var i = 0; i < btns.length; i++){
      btns[i].onclick = function(){
        var code = this.getAttribute('data-use');
        var p = prodBy(code);
        setVal('lcProduct', code);
        applyProduct(code, {quiet:true});
        render();
        toast(p.name + ' loaded into the calculator');
      };
    }

    var pill = lcEl('lcCmpPill');
    if (pill) pill.textContent = LC_PRODUCTS.length + ' products';
    var sub = lcEl('lcCmpSub');
    if (sub) sub.textContent = lcMoney(c.principal) + ' over each product’s shortest term, ' + LC_FREQ[c.freq].label.toLowerCase() + ' instalments.';
    if (foot){
      foot.textContent = 'Cheapest at this amount: ' + cheapest.p.name + ' at ' + lcMoney(cheapest.r.totalRepay) +
        ' total repayment. Dearest: ' + dearest.p.name + ' at ' + lcMoney(dearest.r.totalRepay) + '.';
    }
  }

  /* ---------------------------- downloads ---------------------------- */
  function download(name, rows){
    try {
      var csv = rows.map(function(r){
        return r.map(function(v){
          var s = String(v == null ? '' : v);
          return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
        }).join(',');
      }).join('\r\n');
      var blob = new Blob(['\ufeff' + csv], {type:'text/csv;charset=utf-8'});
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url; a.download = name;
      document.body.appendChild(a);
      a.click();
      setTimeout(function(){ URL.revokeObjectURL(url); if (a.parentNode) a.parentNode.removeChild(a); }, 900);
      toast(name + ' downloaded');
    } catch (e) {
      toast('This browser would not build the file — print the sheet instead', 'err');
    }
  }

  function exportSchedule(){
    var c = cfg(), r = lcCompute(c);
    var rows = [['Golden Financial Services — loan calculator'], []];
    rows.push(['Principal', Math.round(r.principal)]);
    rows.push(['Processing fee', r.feePct + '%', Math.round(r.feeTotal)]);
    rows.push(['Interest rate', r.ratePerMonth + '% a month', r.annualRate + '% a year']);
    rows.push(['Method', methodLabel(r.method)]);
    rows.push(['Duration', r.monthsText, r.n + ' instalment' + (r.n === 1 ? '' : 's')]);
    rows.push(['Frequency', LC_FREQ[r.freq].label]);
    rows.push(['Disbursement date', lcDateText(r.start)]);
    rows.push(['Interest', Math.round(r.interestTotal)]);
    rows.push(['Total fees', Math.round(r.totalFees)]);
    rows.push(['Total repayment', Math.round(r.totalRepay)]);
    rows.push([]);
    rows.push(['#', 'Due date', 'Days', 'Opening balance', 'Interest', 'Principal', 'Instalment', 'Closing balance']);
    r.rows.forEach(function(x){
      rows.push([x.no, lcDateText(x.date), x.days, Math.round(x.opening), Math.round(x.interest),
                 Math.round(x.principal), Math.round(x.instalment), Math.round(Math.abs(x.closing) < 1 ? 0 : x.closing)]);
    });
    download('loan-schedule-' + lcISO(r.start) + '.csv', rows);
  }

  function exportCompare(){
    var c = cfg();
    var rows = [['Product', 'Code', 'Method', 'Term (months)', 'Rate % a month', 'Fee %', 'Interest', 'Total fees', 'Total repayment']];
    LC_PRODUCTS.forEach(function(p){
      var rr = lcCompute({
        principal:c.principal, rate:p.rate, fee:p.fee, method:p.method, redStyle:'equal-instalment',
        freq:c.freq, annual:c.annual, durValue:p.terms[0], durUnit:'months', start:c.start
      });
      rows.push([p.name, p.code, methodLabel(p.method), p.terms[0], p.rate, p.fee,
                 Math.round(rr.interestTotal), Math.round(rr.totalFees), Math.round(rr.totalRepay)]);
    });
    download('loan-product-comparison.csv', rows);
  }

  function printSheet(){
    toast('Opening the print dialog — choose “Save as PDF” to keep the sheet', 'info');
    setTimeout(function(){ try { window.print(); } catch (e) {} }, 260);
  }

  /* ---------------------------- the whole page ---------------------------- */
  function render(){
    var c = cfg();
    var r = lcCompute(c);
    renderBand(c, r);
    renderProductCard(c);
    renderHints(c, r);
    renderFormula(c, r);
    renderDerived(c, r);
    renderResult(c, r);
    renderSchedule(c, r);
    renderCompare(c);
    save();
  }

  /* ---------------------------- quick amounts ---------------------------- */
  function buildChips(){
    var host = lcEl('lcChips');
    if (!host) return;
    var amounts = [100000, 250000, 500000, 1000000, 2500000, 5000000];
    host.innerHTML = amounts.map(function(a){
      return '<button class="lcchip" data-amt="' + a + '">' + fmt(a) + '</button>';
    }).join('');
    var btns = host.querySelectorAll('[data-amt]');
    for (var i = 0; i < btns.length; i++){
      btns[i].onclick = function(){
        setVal('lcAmount', this.getAttribute('data-amt'));
        render();
      };
    }
  }
  function markChips(){
    var host = lcEl('lcChips');
    if (!host) return;
    var now = String(Number((lcEl('lcAmount') || {}).value) || 0);
    var btns = host.querySelectorAll('[data-amt]');
    for (var i = 0; i < btns.length; i++){
      if (btns[i].getAttribute('data-amt') === now) btns[i].classList.add('on');
      else btns[i].classList.remove('on');
    }
  }

  /* ---------------------------- wiring ---------------------------- */
  function init(){
    fillProducts();
    buildChips();

    var dateInput = lcEl('lcDate');
    if (dateInput) dateInput.value = lcISO(lcToday());
    var top = lcEl('topToday');
    if (top) top.textContent = lcDateText(lcToday());

    load();                       /* last used terms, if any */
    if (!dateInput || !dateInput.value) { if (dateInput) dateInput.value = lcISO(lcToday()); }

    render();
    markChips();

    ['lcAmount','lcRate','lcDur','lcAnnual','lcFee','lcDate'].forEach(function(id){
      var n = lcEl(id);
      if (!n) return;
      n.addEventListener('input', function(){ render(); markChips(); });
      n.addEventListener('change', function(){ render(); markChips(); });
    });
    ['lcMethod','lcDurUnit','lcFreq','lcRedStyle'].forEach(function(id){
      var n = lcEl(id);
      if (n) n.addEventListener('change', render);
    });

    var prod = lcEl('lcProduct');
    if (prod) prod.addEventListener('change', function(){
      applyProduct(prod.value, {quiet: prod.value === 'custom'});
      render();
    });

    var chips = lcEl('lcChips');
    if (chips) chips.addEventListener('click', function(){ markChips(); });

    var rb = lcEl('lcReset');    if (rb) rb.onclick = reset;
    var pr = lcEl('lcPrint');    if (pr) pr.onclick = printSheet;
    var p2 = lcEl('lcPrint2');   if (p2) p2.onclick = printSheet;
    var p3 = lcEl('lcPrint3');   if (p3) p3.onclick = printSheet;
    var cs = lcEl('lcCsv');      if (cs) cs.onclick = exportSchedule;
    var cs2 = lcEl('lcCsv2');    if (cs2) cs2.onclick = exportSchedule;
    var cc = lcEl('lcCmpCsv');   if (cc) cc.onclick = exportCompare;

    var ct = lcEl('lcCalcTop');
    if (ct) ct.onclick = function(){ render(); toast('Result sheet recalculated'); };

    var ap = lcEl('lcApply');
    if (ap) ap.onclick = function(){
      var c = cfg(), r = lcCompute(c);
      var pd = prodBy(c.product);
      var body =
        '<div class="lcfigs">' +
          '<div class="lcfig"><div class="fk">Product</div><div class="fv" style="font-size:13px">' + lcEsc(pd ? pd.name : 'Custom loan') + '</div>' +
            '<div class="fn">' + lcEsc(methodLabel(r.method)) + '</div></div>' +
          '<div class="lcfig"><div class="fk">Principal</div><div class="fv">' + lcMoney(r.principal) + '</div>' +
            '<div class="fn">' + lcEsc(r.monthsText) + ' · ' + lcPct(r.ratePerMonth) + ' a month</div></div>' +
          '<div class="lcfig"><div class="fk">Interest</div><div class="fv">' + lcMoney(r.interestTotal) + '</div>' +
            '<div class="fn">Total fees ' + lcMoney(r.totalFees) + ', netted at disbursement</div></div>' +
          '<div class="lcfig gold"><div class="fk">Total repayment</div><div class="fv">' + lcMoney(r.totalRepay) + '</div>' +
            '<div class="fn">' + r.n + ' × ' + lcMoney(r.firstInstalment) + '</div></div>' +
        '</div>' +
        '<div class="note gold" style="margin-top:11px"><div>These are the terms to quote. The application form and the ' +
          'loan agreement print the same schedule, so nothing changes between the counter and the signature.</div></div>';
      openModal('Terms for the customer',
        lcMoney(r.principal) + ' over ' + r.monthsText + ' · ' + (pd ? pd.name : 'custom loan'),
        body,
        [{label:'Print the sheet', act: function(){ lcEl('modal').classList.remove('on'); printSheet(); }},
         {label:'Open the application form', act: function(){ window.location.href = 'apply.html'; }},
         {label:'Close', act:'close', cls:'btn-gold'}]);
    };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
</script>
</body>
</html>
