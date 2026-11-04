/* =====================================================================
   SHARED RECORD SHEETS — injected into every page by inject_backnav.py
   ---------------------------------------------------------------------
   1. Any modal body that is a read-only fieldset (.pfields or an already
      built .recgrid) is re-rendered as a labelled record sheet: human
      labels, formatted dates, money, JSON objects flattened, and staff /
      customer codes resolved to names.
   2. Any table row that does nothing when clicked opens a record sheet
      built from its own column headers, so every register behaves the
      same, with a Print action in the footer.
   3. A page without a modal (the dashboard) gets one built on demand.
   Nothing here touches forms, and nothing here throws if a page lacks the
   helpers (staffName, custName, openModal) — everything is defensive.
   ===================================================================== */
(function(){
  if (window.__glsRecords) return;
  window.__glsRecords = 1;

  var MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var LONG_LABEL = /^(description|notes?|message|terms|reason|detail|details|restriction|proof|comment|comments|address|narration|summary|finding|resolution|payload|body)$/i;
  var LABELS = {
    id:'Record', ref:'Reference', txn:'Transaction', cust:'Customer', acct:'Account', account:'Account',
    stf:'Officer', staff:'Staff', amount:'Amount', fee:'Fee', balance:'Balance', when:'When', date:'Date',
    status:'State', state:'State', kind:'Kind', type:'Type', method:'Method', provider:'Provider', rail:'Rail',
    severity:'Severity', lane:'Area', owner:'Officer', officer:'Officer', region:'Branch', branch:'Branch',
    created:'Created', updated:'Updated', opened:'Opened', due:'Due', paid:'Paid', verified:'Verified',
    verifiedBy:'Verified by', approvedBy:'Approved by', initiatedBy:'Raised by', notes:'Notes',
    description:'Description', currency:'Currency', pct:'Rate %', rate:'Rate', qty:'Quantity',
    n:'Count', count:'Times', total:'Total', subtotal:'Subtotal', vat:'VAT', tax:'Tax',
    idNumber:'ID number', idType:'ID type', phone:'Phone', email:'Email', address:'Address',
    code:'Code', label:'Label', name:'Name', role:'Role', level:'Level', type2:'Type'
  };

  function esc(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }
  function label(k){
    k = String(k == null ? '' : k).trim();
    if (!k) return '';
    if (LABELS[k]) return LABELS[k];
    var out = k.replace(/[_-]+/g, ' ').replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/\s+/g, ' ').trim();
    out = out.replace(/^./, function(c){ return c.toUpperCase(); });
    return out.replace(/\b(Id|Url|Api|Sms|Pin|Otp|Rls|Kyc|Vat|Fees?)\b/g, function(w){ return w.toUpperCase(); });
  }
  /* 2026-10-30 or 2026-10-30 14:05 reads as 30 Oct 2026 · 14:05 */
  function dateText(s){
    var m = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?$/.exec(String(s));
    if (!m) return s;
    var out = String(+m[3]) + ' ' + MON[+m[2] - 1] + ' ' + m[1];
    if (m[4]) out += ' · ' + m[4] + ':' + m[5];
    return out;
  }
  function callName(fn, v){
    try { if (typeof fn === 'function') { var n = fn(v); if (n && String(n) !== String(v)) return String(n); } } catch(e){}
    return null;
  }
  function fromArray(list, v){
    try {
      if (!list || !list.length) return null;
      for (var i = 0; i < list.length; i++) {
        var r = list[i];
        if (!r) continue;
        if (r.id === v || r.no === v || r.account === v || r.staffId === v) return r.name || r.staffName || null;
      }
    } catch(e){}
    return null;
  }
  var staffFn = null, custFn = null, STAFF_ARR = null, CUST_ARR = null;
  try { if (typeof staffName === 'function') staffFn = staffName; } catch(e){}
  try { if (typeof custName === 'function') custFn = custName; } catch(e){}
  try { if (typeof STAFF !== 'undefined') STAFF_ARR = STAFF; } catch(e){}
  try { if (typeof CUSTOMERS !== 'undefined') CUST_ARR = CUSTOMERS; } catch(e){}

  /* a bare number reading under a money label becomes MK 1,234,567; a rate
     reads as a percentage. Modules that already format keep their text. */
  var MONEY_LABEL = /(amount|fee|fees|balance|paid|payment|total|subtotal|net|gross|basic|salary|value|cost|price|charge|charges|deduction|deductions|allowance|allowances|bonus|loan|principal|interest|arrears|outstanding|collected|waived|reversed|deposit|withdrawal|limit|budget|actual|expected|credit|debit|vat|tax|paye|pension|nhima|premium|claim|revenue|income|refund|excess|shortfall|contribution|commission|penalty|from|to|previous|updated|current|gross|opening|closing|instalment|installment|emi|repayment|disbursed|received|billed|settled|adjusted|adjustment|difference|variance|overpayment|underpayment|ceiling|floor|cap|minimum|maximum|min|max|threshold|savings|deposits|contributions|dividend|interest paid)/i;
  var RATE_LABEL = /(\brate\b|percent|%|margin|apy|apr)/i;
  function thousands(n){
    var neg = n < 0, a = Math.abs(n);
    var s = String(a);
    var parts = s.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return (neg ? '-' : '') + parts.join('.');
  }
  function moneyText(s){
    var raw = String(s).trim().replace(/\s/g, '');
    if (!/^-?\d{1,3}(,\d{3})+(\.\d{1,2})?$/.test(raw) && !/^-?\d+(\.\d{1,2})?$/.test(raw)) return null;
    var n = Number(raw.replace(/,/g, ''));
    if (!isFinite(n)) return null;
    var dec = /\.\d{1,2}$/.test(raw) ? raw.split('.')[1].length : 0;
    return 'MK ' + thousands(Number(n.toFixed(dec)));
  }
  function rateText(s){
    var t = String(s).trim().replace(/%$/, '');
    if (!/^-?\d+(\.\d+)?$/.test(t)) return null;
    var n = Number(t);
    if (!isFinite(n)) return null;
    if (n > 0 && n <= 1) return (Math.round(n * 1000) / 10) + '%';
    if (n > 1 && n <= 100) return (Math.round(n * 100) / 100) + '%';
    return null;
  }

  function human(v, lab){
    var s = String(v == null ? '' : v).trim();
    if (!s || s === 'null' || s === 'undefined' || s === '—' || s === '-') return '';
    if (lab && RATE_LABEL.test(String(lab)) && !/%/.test(s)) {
      var rt = rateText(s);
      if (rt) return rt;
    }
    if (lab && MONEY_LABEL.test(String(lab)) && !/%/.test(s) && /\d/.test(s)) {
      var mt2 = moneyText(s);
      if (mt2 && Math.abs(Number(String(s).replace(/[\s,]/g, ''))) >= 100) return mt2;
    }
    /* "Transport: 118500 · Housing: 177500" under an allowance heading */
    if (lab && MONEY_LABEL.test(String(lab)) && /:/.test(s) && /\d{3}/.test(s) && !/MK\s/.test(s)) {
      s = s.replace(/(:\s*)(-?\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|-?\d+(?:\.\d{1,2})?)(?=\s*(?:·|$|;))/g, function(_, sep, n){
        var t = moneyText(n);
        return sep + (t || n);
      });
    }
    if (s === 'true') return 'Yes';
    if (s === 'false') return 'No';
    if (s.charAt(0) === '{' || s.charAt(0) === '['){
      try {
        var o = JSON.parse(s);
        if (o && typeof o === 'object') {
          if (Array.isArray(o)) return o.map(function(x){ return typeof x === 'object' ? human(JSON.stringify(x)) : String(x); }).join(' · ');
          var moneyish = !!(lab && MONEY_LABEL.test(String(lab)));
          return Object.keys(o).map(function(k){
            var v = o[k], shown;
            if (v != null && typeof v === 'object') shown = human(JSON.stringify(v), label(k));
            else if (typeof v === 'number' && moneyish && Math.abs(v) >= 100) shown = 'MK ' + thousands(v);
            else shown = human(v, label(k)) || String(v);
            return label(k) + ': ' + shown;
          }).join(' · ');
        }
      } catch(e){}
    }
    var nm;
    if (/^STF-/i.test(s)) { nm = callName(staffFn, s) || fromArray(STAFF_ARR, s); if (nm) return nm + ' · ' + s; }
    if (/^GF-/i.test(s)) { nm = callName(custFn, s) || fromArray(CUST_ARR, s); if (nm) return nm + ' · ' + s; }
    if (/^\d{4}-\d{2}-\d{2}([ T]\d{2}:\d{2})?$/.test(s)) return dateText(s);
    /* a date sitting inside a longer value reads as a date too, and stray
       line breaks from the source markup collapse to single spaces */
    s = s.replace(/(\d{4}-\d{2}-\d{2})(?:[ T](\d{2}:\d{2}))?/g, function(_, d, t){ return dateText(d + (t ? ' ' + t : '')); });
    return s.replace(/\s+/g, ' ').trim();
  }

  /* inside a badge we only correct the value shape — money, rate, date —
     never the words, so a pill keeps its own label */
  function cellText(v, lab){
    var s = String(v == null ? '' : v).trim();
    if (!s) return s;
    if (lab && RATE_LABEL.test(String(lab)) && !/%/.test(s)) {
      var rt = rateText(s);
      if (rt) return rt;
    }
    if (lab && MONEY_LABEL.test(String(lab)) && !/%/.test(s) && /\d/.test(s)) {
      var mt3 = moneyText(s);
      if (mt3 && Math.abs(Number(String(s).replace(/[\s,]/g, ''))) >= 100) return mt3;
    }
    return s.replace(/(\d{4}-\d{2}-\d{2})(?:[ T](\d{2}:\d{2}))?/g, function(_, d, t){ return dateText(d + (t ? ' ' + t : '')); });
  }
  function humanizeHtml(html, lab){
    try {
      var box = document.createElement('div');
      box.innerHTML = html;
      var walker = document.createTreeWalker(box, 4 /* SHOW_TEXT */);
      var n, changed = false;
      while ((n = walker.nextNode())) {
        var t = n.nodeValue;
        if (!t || !t.trim()) continue;
        var next = cellText(t, lab);
        if (next !== t) { n.nodeValue = next; changed = true; }
      }
      return changed ? box.innerHTML : html;
    } catch(e){ return html; }
  }

  function items(pairs){
    var out = [], seen = {};
    pairs.forEach(function(p){
      var lab = String(p.label || '').trim();
      var text = String(p.text == null ? '' : p.text).trim();
      if (!lab || !text) return;
      var key = lab.toLowerCase() + '\u0001' + text.toLowerCase();
      if (seen[key]) return;
      seen[key] = 1;
      var wide = text.length > 88 || LONG_LABEL.test(lab.replace(/[^a-z]/gi, ''));
      out.push('<div class="pfield' + (wide ? ' wide' : '') + '"><div class="pk">' + esc(lab) + '</div>' +
               '<div class="pv">' + (p.html != null ? humanizeHtml(p.html, lab) : esc(human(text, lab))) + '</div></div>');
    });
    return out;
  }

  /* ---- 1. upgrade an existing read-only fieldset into a record sheet ---- */
  function upgrade(body){
    if (!body) return;
    var blocks = body.querySelectorAll('.pfields, .recgrid');
    for (var i = 0; i < blocks.length; i++){
      var block = blocks[i];
      if (block.getAttribute('data-rsc') === '1') continue;
      if (block.querySelector('input,select,textarea')) continue;   /* a form, not a record */
      var fields = block.children, pairs = [];
      for (var j = 0; j < fields.length; j++){
        var f = fields[j];
        if (!f.classList || !f.classList.contains('pfield')) continue;
        var k = f.querySelector('.pk'), v = f.querySelector('.pv');
        if (!k || !v) continue;
        var raw = v.textContent.trim();
        var lab = k.textContent;
        /* a module that hands over a raw key ("id", "staffId") gets a heading */
        if (/^[a-z][A-Za-z0-9]*$/.test(lab.trim()) || /[a-z][A-Z]/.test(lab)) {
          lab = label(lab);
          if (lab === 'Record' && /^[a-z]*id$/i.test(k.textContent.trim())) lab = 'ID';
        }
        pairs.push({ label: lab, text: raw, html: v.children.length ? v.innerHTML : null });
      }
      if (pairs.length < 2) continue;
      var built = items(pairs);
      if (!built.length) continue;
      block.setAttribute('data-rsc', '1');
      block.classList.add('recgrid');
      /* an inline two-column template would beat the sheet grid, so drop it */
      try { block.style.gridTemplateColumns = ''; } catch(e){}
      block.innerHTML = built.join('');
    }
  }

  /* any record a module draws itself gets the same Print control */
  function pairsFromBody(body){
    var out = [], nodes = body.querySelectorAll('.pfield');
    for (var i = 0; i < nodes.length; i++){
      var k = nodes[i].querySelector('.pk'), v = nodes[i].querySelector('.pv');
      if (!k || !v) continue;
      var t = v.textContent.trim();
      if (!t) continue;
      out.push({label: k.textContent.trim(), text: t});
    }
    return out;
  }
  function decorate(body){
    var foot = document.getElementById('modalFoot');
    if (!foot || !body) return;
    if (body.querySelector('input,select,textarea')) return;      /* a form, not a record */
    if (!body.querySelector('.recgrid,.pfields')) return;
    var has = false;
    [].forEach.call(foot.querySelectorAll('button'), function(b){ if (/print/i.test(b.textContent)) has = true; });
    if (has) return;
    var pairs = pairsFromBody(body);
    if (!pairs.length) return;
    var titleEl = document.getElementById('modalTitle'), subEl = document.getElementById('modalSub');
    /* a sheet titled "2026-10-24" or "45000" tells the reader nothing: when the
       title carries no words, use the first field that looks like a reference */
    try {
      var cur = titleEl ? titleEl.textContent.trim() : '';
      if (!cur || cur === '—' || /^\d{4}-\d{2}-\d{2}/.test(cur) || /^-?[\d,]+(\.\d+)?%?$/.test(cur)) {
        var pick = '';
        for (var i0 = 0; i0 < pairs.length; i0++){ if (/^[A-Za-z0-9]{2,6}[-–]/.test(pairs[i0].text)) { pick = pairs[i0].text; break; } }
        if (!pick) for (var i1 = 0; i1 < pairs.length; i1++){
          var v1 = pairs[i1].text;
          if (/[A-Za-z]/.test(v1) && !/^\d{1,2} [A-Z][a-z]{2}\b/.test(v1) && v1.length <= 60) { pick = v1; break; }
        }
        if (pick && titleEl) titleEl.textContent = pick;
      }
    } catch(e){}
    var title = titleEl ? titleEl.textContent : 'Record';
    var sub = subEl ? subEl.textContent : '';
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'btn btn-ghost';
    b.textContent = 'Print';
    b.addEventListener('click', function(){
      try {
        if (typeof printTable === 'function'){
          printTable(title || 'Record', [{label: 'Field'}, {label: 'Value'}],
            pairs.map(function(p){ return [p.label, p.text]; }));
          return;
        }
      } catch(e){}
      printSheet({title: title, sub: sub, pairs: pairs});
    });
    foot.insertBefore(b, foot.firstChild);
  }

  function watch(tries){
    var body = document.getElementById('modalBody');
    if (!body) {
      /* a page without a modal (the dashboard) never needs the watcher, so
         retry a few times for late-built modals and then give up quietly */
      if ((tries || 0) < 6) setTimeout(function(){ watch((tries || 0) + 1); }, 400);
      return;
    }
    var busy = false;
    var mo = new MutationObserver(function(){
      if (busy) return;
      busy = true;
      try { upgrade(body); } catch(e){}
      try { decorate(body); } catch(e){}
      busy = false;
    });
    try { mo.observe(body, { childList: true, subtree: true }); } catch(e){}
    try { upgrade(body); } catch(e){}
    try { decorate(body); } catch(e){}
  }

  /* headers carry sort arrows, so strip them before they become labels */
  var ABBR = {id:'ID', ref:'Ref', no:'No', txn:'Txn', ac:'A/C', amt:'Amount', bal:'Balance', pct:'%'};
  function cleanHead(t){
    var out = String(t || '').replace(/[\u25B2\u25BC\u25B4\u25BE\u2191\u2193\u2195\u25C2\u25B8\u2303\u2304]/g, '')
      .replace(/\(click to sort\)/ig, '').replace(/\s+/g, ' ').trim();
    if (ABBR[out.toLowerCase()]) return ABBR[out.toLowerCase()];
    if (/^[a-z]{1,4}$/.test(out)) return out.toUpperCase();
    return out;
  }

  /* ---- 2. any inert register row opens a sheet built from its headers ---- */
  function closeEnough(a, b){ return Math.abs(a - b) < 3; }

  /* a cell like <div class="who"><div class="av">CZ</div><div class="nm">Chimwemwe Zulu</div></div>
     has no spaces in its textContent ("CZChimwemwe Zulu"), so flatten it with word
     breaks at the block boundaries and leave the decorative initials bubble out */
  function flatText(node){
    var out = '';
    (function walk(n){
      for (var i = 0; i < n.childNodes.length; i++){
        var c = n.childNodes[i];
        if (c.nodeType === 3){ out += c.nodeValue; continue; }
        if (c.nodeType !== 1) continue;
        if (c.tagName === 'BR'){ out += ' '; continue; }
        if (/(^|\s)(av|bar|dot|spark)(\s|$)/.test(c.getAttribute('class') || '')) continue;
        var block = /^(DIV|P|LI|UL|OL|TR|SECTION|H[1-6])$/.test(c.tagName);
        if (block && out && !/\s$/.test(out)) out += ' ';
        walk(c);
        if (block && !/\s$/.test(out)) out += ' ';
      }
    })(node);
    return out.replace(/\s+/g, ' ').trim();
  }

  function sheetFromRow(tr){
    var table = tr.closest ? tr.closest('table') : null;
    if (!table) return null;
    var head = table.querySelector('thead tr');
    var heads = head ? [].slice.call(head.children) : [];
    var cells = [].slice.call(tr.children).filter(function(c){ return c.tagName === 'TD'; });
    if (cells.length < 2) return null;
    var pairs = [];
    cells.forEach(function(td, i){
      var h = heads[Math.min(i, heads.length - 1)];
      var lab = h ? cleanHead(h.textContent) : '';
      if (!lab) return;
      var hasBadge = td.querySelector('.badge,.pill,.sev,.chip');
      var flat = flatText(td);
      if (!flat) return;
      pairs.push({ label: lab, text: flat, html: hasBadge ? td.innerHTML : null });
    });
    var built = items(pairs);
    if (built.length < 2) return null;

    var texts = cells.map(function(td){ return flatText(td); });
    var looksDate = function(t){ return /^\d{4}-\d{2}-\d{2}/.test(t) || /^\d{1,2} [A-Z][a-z]{2}\b/.test(t); };
    var looksNum  = function(t){ return /^-?[\d,]+(\.\d+)?%?$/.test(t); };
    var title = '';
    for (var ti = 0; ti < texts.length; ti++){
      var cand = texts[ti];
      if (!cand || looksDate(cand) || looksNum(cand)) continue;
      title = cand;
      /* a bare code ("STF") reads better with the name beside it */
      if (cand.length < 7 && texts[ti + 1] && !looksNum(texts[ti + 1]) && !looksDate(texts[ti + 1]))
        title = cand + ' · ' + texts[ti + 1];
      break;
    }
    if (!title) title = texts[0] || tr.getAttribute('data-ref') || 'Record';
    if (title.length > 72) title = title.slice(0, 72) + '…';

    var panel = tr.closest('.panel,.card');
    var ptitle = panel ? panel.querySelector('.panel-title') : null;
    var sub = ptitle ? ptitle.textContent.trim() : '';
    var body = '<div class="recsheet"><div class="recgrid">' + built.join('') + '</div>' +
               (sub ? '<div class="recsrc">' + esc(sub) + '</div>' : '') + '</div>';
    var printPairs = [];
    pairs.forEach(function(p){
      var t = String(p.text == null ? '' : p.text).trim();
      if (!p.label || !t) return;
      printPairs.push({label: p.label, text: t});
    });
    return { title: title, sub: sub, body: body, pairs: printPairs };
  }

  function printSheet(sheet){
    var rows = (sheet.pairs || []).map(function(p){
      return '<tr><td>' + esc(p.label) + '</td><td>' + esc(p.text) + '</td></tr>';
    }).join('');
    var html = '<!doctype html><html><head><meta charset="utf-8"><title>' + esc(sheet.title) + '</title>' +
      '<style>body{font:12px "Segoe UI",Arial,sans-serif;color:#0F1115;padding:18px}' +
      'h1{font-size:15px;margin:0 0 3px}p{font-size:10.5px;color:#6B7280;margin:0 0 12px}' +
      'table{width:100%;border-collapse:collapse}td{border-bottom:1px solid #E6E8EE;padding:6px 4px;vertical-align:top}' +
      'td:first-child{width:38%;color:#6B7280;text-transform:uppercase;font-size:9.5px;letter-spacing:.4px}</style>' +
      '</head><body>' + ((typeof window.glsDocBand === "function") ? window.glsDocBand(sheet.title) : '') +
      '<h1>' + esc(sheet.title) + '</h1><p>' + esc(sheet.sub || '') + '</p><table>' + rows + '</table></body></html>';
    try {
      var w = window.open('', '_blank');
      if (!w) return false;
      w.document.write(html); w.document.close();
      setTimeout(function(){ try { w.focus(); w.print(); } catch(e){} }, 250);
      return true;
    } catch(e){ return false; }
  }
  function sheetActions(sheet){
    var acts = [];
    if (sheet.pairs && sheet.pairs.length) {
      acts.push({label: 'Print', act: function(){
        try {
          if (typeof printTable === 'function'){
            printTable(sheet.title || 'Record', [{label: 'Field'}, {label: 'Value'}],
              sheet.pairs.map(function(p){ return [p.label, p.text]; }));
            return;
          }
        } catch(e){}
        printSheet(sheet);
      }});
    }
    acts.push({label: 'Close', act: 'close'});
    return acts;
  }

  /* a page without its own modal (the dashboard) still gets a sheet */
  function ensureModal(){
    var m = document.getElementById('modal');
    if (m) return m;
    m = document.createElement('div');
    m.className = 'modal';
    m.id = 'modal';
    m.innerHTML = '<div class="modal-card"><div class="modal-head"><div><h3 id="modalTitle">Record</h3>' +
      '<p id="modalSub"></p></div><button class="x" id="modalClose" aria-label="Close">\u2715</button></div>' +
      '<div class="modal-body" id="modalBody"></div><div class="modal-foot" id="modalFoot"></div></div>';
    document.body.appendChild(m);
    m.addEventListener('click', function(e){
      if (e.target === m || e.target.id === 'modalClose') m.classList.remove('on');
    });
    document.addEventListener('keydown', function(e){ if (e.key === 'Escape') m.classList.remove('on'); });
    return m;
  }
  function localOpen(title, sub, body, actions){
    var m = ensureModal();
    document.getElementById('modalTitle').textContent = title || 'Record';
    document.getElementById('modalSub').textContent = sub || '';
    document.getElementById('modalBody').innerHTML = body || '';
    var foot = document.getElementById('modalFoot');
    foot.innerHTML = '';
    (actions || []).forEach(function(a){
      var b = document.createElement('button');
      b.className = 'btn ' + (a.act === 'close' ? 'btn-ghost' : 'btn-gold');
      b.type = 'button';
      b.textContent = a.label;
      b.addEventListener('click', function(){
        if (a.act === 'close') { m.classList.remove('on'); return; }
        try { a.act(); } catch(e){}
      });
      foot.appendChild(b);
    });
    m.classList.add('on');
  }

  function show(sheet){
    var acts = sheetActions(sheet);
    try {
      if (typeof openModal === 'function') { openModal(sheet.title, sheet.sub, sheet.body, acts); return true; }
    } catch(e){}
    localOpen(sheet.title, sheet.sub, sheet.body, acts);
    return true;
  }

  function modalOpen(){
    var m = document.getElementById('modal');
    return !!(m && m.classList && m.classList.contains('on'));
  }

  /* capture phase: a module may redraw its table on click, detaching the row,
     so the record is read before that happens */
  document.addEventListener('click', function(e){
    var t = e.target;
    if (!t || !t.closest) return;
    if (t.closest('a,button,input,select,textarea,label,.badge')) return;
    var tr = t.closest('tbody tr');
    if (!tr) return;
    if (tr.closest('[data-nosheet]')) return;
    var table = tr.closest('table');
    if (!table || table.getAttribute('data-nosheet') !== null) return;
    if (modalOpen()) return;
    var early = null;
    try { early = sheetFromRow(tr); } catch(err){ early = null; }
    var before = document.body.textContent.length;
    var clickedAt = Date.now();
    setTimeout(function(){
      if (modalOpen()) return;                        /* the module opened its own sheet */
      /* a date sweep landing inside the window changes lengths by itself */
      var sweepRan = lastSweep > clickedAt;
      if (!sweepRan && !closeEnough(before, document.body.textContent.length)) return;  /* a panel updated */
      var sheet = early;
      if (!sheet) { try { sheet = sheetFromRow(tr); } catch(err){ sheet = null; } }
      if (!sheet) return;
      if (!show(sheet)) return;
      try { tr.setAttribute('data-rsc-hit', '1'); } catch(err){}
    }, 60);
  }, true);

  /* ---- 3. table cells print dates as dates, not as 2026-10-30 08:12 ---- */
  var ISO_CELL = /^\d{4}-\d{2}-\d{2}([ T]\d{2}:\d{2})?$/;

  function fixCells(root){
    if (!root || root.nodeType !== 1) return;
    var cells;
    if (root.matches && root.matches('td,th')) cells = [root];
    else if (root.querySelectorAll) cells = root.querySelectorAll('td,th');
    else return;
    for (var i = 0; i < cells.length; i++){
      var td = cells[i];
      if (td.children.length) continue;            /* keep badges and links intact */
      var t = td.textContent.trim();
      if (t.length > 16 || !ISO_CELL.test(t)) continue;
      td.textContent = dateText(t);
    }
  }

  var pending = false;
  var lastSweep = 0;
  function sweep(){
    pending = false;
    try { fixCells(document.body); } catch(e){}
    lastSweep = Date.now();
  }
  function queueSweep(){
    if (pending) return;
    pending = true;
    if (window.requestAnimationFrame) requestAnimationFrame(sweep);
    else setTimeout(sweep, 40);
  }

  function watchTables(){
    try {
      var mo = new MutationObserver(function(list){
        for (var i = 0; i < list.length; i++){
          var added = list[i].addedNodes;
          for (var j = 0; j < added.length; j++){
            var n = added[j];
            if (n.nodeType === 1 && (n.tagName === 'TR' || n.tagName === 'TD' || n.tagName === 'TABLE')) {
              queueSweep(); return;
            }
          }
          if (list[i].type === 'characterData'){ queueSweep(); return; }
        }
      });
      mo.observe(document.body, {childList: true, subtree: true, characterData: true});
    } catch(e){}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function(){ watch(0); queueSweep(); watchTables(); });
  } else {
    watch(0); queueSweep(); watchTables();
  }
})();
