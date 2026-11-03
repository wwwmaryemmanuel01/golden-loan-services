/* =====================================================================
   SHARED RECORD SHEETS — injected into every page by inject_backnav.py
   ---------------------------------------------------------------------
   1. Any modal body that is a read-only fieldset (.pfields) is re-rendered
      as a labelled record sheet: human labels, formatted dates, money,
      JSON objects flattened, and staff / customer codes resolved to names.
   2. Any table row that does nothing when clicked opens a record sheet
      built from its own column headers, so every register behaves the same.
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

  function human(v){
    var s = String(v == null ? '' : v).trim();
    if (!s || s === 'null' || s === 'undefined' || s === '—' || s === '-') return '';
    if (s === 'true') return 'Yes';
    if (s === 'false') return 'No';
    if (s.charAt(0) === '{' || s.charAt(0) === '['){
      try {
        var o = JSON.parse(s);
        if (o && typeof o === 'object') {
          if (Array.isArray(o)) return o.map(function(x){ return typeof x === 'object' ? human(JSON.stringify(x)) : String(x); }).join(' · ');
          return Object.keys(o).map(function(k){ return label(k) + ': ' + (human(o[k]) || String(o[k])); }).join(' · ');
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
               '<div class="pv">' + (p.html != null ? p.html : esc(human(text))) + '</div></div>');
    });
    return out;
  }

  /* ---- 1. upgrade an existing read-only fieldset into a record sheet ---- */
  function upgrade(body){
    if (!body) return;
    if (body.querySelector('input,select,textarea')) return;   /* a form, not a record */
    var blocks = body.querySelectorAll('.pfields');
    for (var i = 0; i < blocks.length; i++){
      var block = blocks[i];
      if (block.getAttribute('data-rsc') === '1') continue;
      var fields = block.children, pairs = [];
      for (var j = 0; j < fields.length; j++){
        var f = fields[j];
        if (!f.classList || !f.classList.contains('pfield')) continue;
        var k = f.querySelector('.pk'), v = f.querySelector('.pv');
        if (!k || !v) continue;
        var raw = v.textContent.trim();
        pairs.push({ label: k.textContent, text: raw, html: v.children.length ? v.innerHTML : null });
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
      busy = false;
    });
    try { mo.observe(body, { childList: true, subtree: true }); } catch(e){}
    try { upgrade(body); } catch(e){}
  }

  /* headers carry sort arrows, so strip them before they become labels */
  function cleanHead(t){
    return String(t || '').replace(/[\u25B2\u25BC\u25B4\u25BE\u2191\u2193\u2195\u25C2\u25B8\u2303\u2304]/g, '')
      .replace(/\(click to sort\)/ig, '').replace(/\s+/g, ' ').trim();
  }

  /* ---- 2. any inert register row opens a sheet built from its headers ---- */
  function closeEnough(a, b){ return Math.abs(a - b) < 3; }

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
      pairs.push({ label: lab, text: td.textContent, html: hasBadge ? td.innerHTML : null });
    });
    var built = items(pairs);
    if (built.length < 2) return null;

    var first = cells[0] ? cells[0].textContent.trim() : '';
    var title = first || (tr.getAttribute('data-ref') || 'Record');
    var panel = tr.closest('.panel,.card');
    var ptitle = panel ? panel.querySelector('.panel-title') : null;
    var sub = ptitle ? ptitle.textContent.trim() : '';
    var body = '<div class="recsheet"><div class="recgrid">' + built.join('') + '</div>' +
               (sub ? '<div class="recsrc">' + esc(sub) + '</div>' : '') + '</div>';
    return { title: title, sub: sub, body: body };
  }

  function show(sheet){
    try {
      if (typeof openModal === 'function') { openModal(sheet.title, sheet.sub, sheet.body); return true; }
    } catch(e){}
    var m = document.getElementById('modal');
    if (!m) return false;
    var t = document.getElementById('modalTitle'), s = document.getElementById('modalSub'), b = document.getElementById('modalBody');
    if (t) t.textContent = sheet.title;
    if (s) s.textContent = sheet.sub || '';
    if (b) b.innerHTML = sheet.body;
    m.classList.add('on');
    return true;
  }

  function modalOpen(){
    var m = document.getElementById('modal');
    return !!(m && m.classList && m.classList.contains('on'));
  }

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
    var before = document.body.textContent.length;
    setTimeout(function(){
      if (modalOpen()) return;                        /* the module opened its own sheet */
      if (!closeEnough(before, document.body.textContent.length)) return;  /* a panel updated */
      var sheet = null;
      try { sheet = sheetFromRow(tr); } catch(err){ sheet = null; }
      if (!sheet) return;
      if (!show(sheet)) return;
      try { tr.setAttribute('data-rsc-hit', '1'); } catch(err){}
    }, 60);
  }, false);

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function(){ watch(0); });
  else watch(0);
})();
