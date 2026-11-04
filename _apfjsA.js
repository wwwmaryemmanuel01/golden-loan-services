<script>
/* ============================================================
   CUSTOMER APPLICATION FORM
   Draft saving, validation, affordability, the indicative quote,
   the review panel, three signature pads and submission.
   ============================================================ */
(function(){
  'use strict';
  const KEY = 'gls_apply_draft_v1';
  const SUBS = 'gls_applications_v1';
  const AGREEMENT = 'gls_agreement_v1';

  const $ = id => document.getElementById(id);
  const $$ = s => Array.prototype.slice.call(document.querySelectorAll(s));
  const num = v => { const n = Number(String(v).replace(/[^0-9.-]/g, '')); return isFinite(n) ? n : 0; };
  const money = v => 'MK ' + (Number(v) || 0).toLocaleString('en-GB', { maximumFractionDigits: 0 });
  const today = () => new Date().toISOString().slice(0, 10);
  const esc = s => String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

  function toast(msg, type){
    const host = $('toasts');
    if(!host) return;
    const t = document.createElement('div');
    t.className = 'toast ' + (type || 'ok');
    t.innerHTML = '<span>' + (type === 'err' ? '⚠' : type === 'info' ? 'ℹ' : '✓') + '</span><div>' + esc(msg) + '</div>';
    host.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; t.style.transition = '.25s'; }, 2800);
    setTimeout(() => t.remove(), 3200);
  }

  /* ---------------- the agreement gate ---------------- */
  function agreement(){
    try { return JSON.parse(localStorage.getItem(AGREEMENT) || 'null'); } catch(e){ return null; }
  }
  function gate(){
    const a = agreement();
    const box = $('gateBox'), text = $('gateText'), link = $('gateLink');
    const ok = !!(a && a.accepted);
    if(!box) return ok;
    box.classList.toggle('ok', ok);
    box.classList.toggle('locked', !ok);
    if(ok){
      text.innerHTML = 'Agreement accepted by <b>' + esc(a.name || 'the applicant') + '</b> on ' + esc(a.date || '—') + '. You may complete the form.';
      link.textContent = 'Review the agreement';
      link.className = 'btn btn-ghost btn-sm';
    } else {
      text.innerHTML = 'The application is locked until the loan agreement and terms are accepted.';
      link.textContent = 'Read and accept the agreement';
      link.className = 'btn btn-gold btn-sm';
    }
    $$('.sheet input,.sheet select,.sheet textarea').forEach(n => { n.disabled = !ok; });
    $$('button[data-clearsig]').forEach(n => { n.disabled = !ok; });
    if($('submitBtn')) $('submitBtn').disabled = !ok;
    return ok;
  }

  /* ---------------- signature pads ---------------- */
  const pads = {};
  function initPads(){
    $$('.sigpad').forEach(cv => {
      const key = cv.dataset.sig;
      let ctx = null;
      try { ctx = cv.getContext && cv.getContext('2d'); } catch(e){ ctx = null; }
      const state = { canvas:cv, ctx:ctx, drawn:false };
      pads[key] = state;
      const meta = $('sig_' + key + '_meta');
      if(!ctx){
        if(meta) meta.textContent = 'This browser cannot draw here — type your name below instead.';
        return;
      }
      ctx.lineWidth = 2.4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#10221B';
      const pos = ev => {
        const r = cv.getBoundingClientRect();
        const p = ev.touches ? ev.touches[0] : ev;
        return { x:(p.clientX - r.left) * (cv.width / (r.width || cv.width)),
                 y:(p.clientY - r.top) * (cv.height / (r.height || cv.height)) };
      };
      let drawing = false;
      const start = ev => { ev.preventDefault(); drawing = true; const p = pos(ev);
        ctx.beginPath(); ctx.moveTo(p.x, p.y); state.drawn = true; cv.classList.add('touched'); if(meta) meta.textContent = 'Signature captured.'; };
      const move = ev => { if(!drawing) return; ev.preventDefault(); const p = pos(ev); ctx.lineTo(p.x, p.y); ctx.stroke(); };
      const end = () => { drawing = false; if(state.drawn) refresh(); };
      ['pointerdown','mousedown','touchstart'].forEach(e => cv.addEventListener(e, start, { passive:false }));
      ['pointermove','mousemove','touchmove'].forEach(e => cv.addEventListener(e, move, { passive:false }));
      ['pointerup','mouseup','mouseleave','touchend','pointercancel'].forEach(e => cv.addEventListener(e, end));
      $$('[data-clearsig="' + key + '"]').forEach(b => b.onclick = () => {
        ctx.clearRect(0, 0, cv.width, cv.height);
        state.drawn = false;
        cv.classList.remove('touched');
        if(meta) meta.textContent = 'Cleared — sign again if this signature is needed.';
        save(); refresh();
      });
    });
  }
  const sigData = key => {
    const s = pads[key];
    if(s && s.drawn && s.ctx) { try { return s.canvas.toDataURL('image/png'); } catch(e){ return ''; } }
    return '';
  };

  /* ---------------- the draft ---------------- */
  const FIELDS = $$('.sheet input[id], .sheet select[id], .sheet textarea[id]').map(n => n.id);
  function collect(){
    const o = {};
    FIELDS.forEach(id => {
      const n = $(id);
      if(!n) return;
      o[id] = (n.type === 'checkbox') ? n.checked : n.value;
    });
    o.__docs = $$('[data-doc]').filter(n => n.checked).map(n => n.dataset.doc);
    o.__coll = ($$('input[name="coll"]').filter(n => n.checked)[0] || {}).value || 'None';
    o.__sig = { app:sigData('app'), g1:sigData('g1'), g2:sigData('g2') };
    o.__saved = new Date().toISOString();
    return o;
  }
  function save(){
    try { localStorage.setItem(KEY, JSON.stringify(collect())); } catch(e){}
    refresh();
  }
  function restore(){
    let o = null;
    try { o = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch(e){}
    if(!o) return false;
    Object.keys(o).forEach(id => {
      const n = $(id);
      if(!n || id.indexOf('__') === 0) return;
      if(n.type === 'checkbox') n.checked = !!o[id];
      else n.value = o[id];
    });
    (o.__docs || []).forEach(d => { const n = $$('[data-doc]').find(x => x.dataset.doc === d); if(n) n.checked = true; });
    const radio = $$('input[name="coll"]').find(n => n.value === o.__coll);
    if(radio) radio.checked = true;
    return true;
  }

  /* ---------------- validation ---------------- */
  function fail(id, msg){
    const n = $(id);
    const e = document.querySelector('[data-err="' + id + '"]');
    if(n) n.classList.add('bad');
    if(e) e.textContent = msg;
    return false;
  }
  function clearErr(id){
    const n = $(id);
    const e = document.querySelector('[data-err="' + id + '"]');
    if(n) n.classList.remove('bad');
    if(e) e.textContent = '';
  }
  const REQUIRED = [
    ['f_first','Enter your first name'], ['f_surname','Enter your surname'],
    ['f_dob','Choose your date of birth'], ['f_sex','Choose your sex'],
    ['f_nid','Enter your national ID number'], ['f_phone','Enter a mobile number we can reach you on'],
    ['f_district','Choose your district'], ['f_address','Enter your village or street address'],
    ['f_emp','Choose your employment type'], ['f_employer','Enter your employer or business name'],
    ['f_income','Enter your net monthly income'], ['f_amount','Enter the amount you are asking for'],
    ['f_term','Choose a term'], ['f_purpose','Say what the loan is for'],
    ['g1_name','Enter the guarantor\'s full name'], ['g1_nid','Enter the guarantor\'s national ID'],
    ['g1_phone','Enter the guarantor\'s mobile number'], ['g1_rel','Choose the guarantor\'s relationship to you'],
    ['g1_consent','The guarantor must agree to the declaration'], ['app_date','Enter the date you are signing']
  ];
  function validateSection(ids){
    let ok = true;
    ids.forEach(id => {
      clearErr(id);
      const row = REQUIRED.find(r => r[0] === id);
      if(!row) return;
      const n = $(id);
      if(!n) return;
      if(n.type === 'checkbox'){ if(!n.checked) ok = fail(id, row[1]); return; }
      if(!String(n.value || '').trim()) ok = fail(id, row[1]);
      else if(id === 'f_email' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(n.value)) ok = fail(id, 'Check the email address');
      else if((id === 'f_amount') && num(n.value) < 50000) ok = fail(id, 'The smallest loan we make is MK 50,000');
      else if((id === 'f_phone' || id === 'g1_phone') && String(n.value).replace(/\D/g, '').length < 9) ok = fail(id, 'Enter a full mobile number');
    });
    if(ids.indexOf('g1_consent') > -1){
      const sigOk = !!sigData('g1') || String(($('g1_typed') || {}).value || '').trim().length > 3;
      const e = document.querySelector('[data-err="sig_g1"]');
      if(!sigOk){ if(e) e.textContent = 'A drawn or typed signature is required from the first guarantor.'; ok = false; }
      else if(e) e.textContent = '';
    }
    if(ids.indexOf('decls') > -1){
      const all = ['d_truth','d_bureau','d_data','d_terms','d_guar','d_decl'].every(id => $(id) && $(id).checked);
      const e = document.querySelector('[data-err="decls"]');
      if(!all){ if(e) e.textContent = 'Every declaration must be ticked before the application can be submitted.'; ok = false; }
      else if(e) e.textContent = '';
      const sigOk = !!sigData('app') || String(($('app_typed') || {}).value || '').trim().length > 3;
      const e2 = document.querySelector('[data-err="sig_app"]');
      if(!sigOk){ if(e2) e2.textContent = 'Please sign, or type your full name as a signature.'; ok = false; }
      else if(e2) e2.textContent = '';
    }
    return ok;
  }

  /* ---------------- calculations ---------------- */
  function affordability(){
    const income = num(($('f_income') || {}).value) + num(($('f_other_income') || {}).value);
    const out = num(($('f_expenses') || {}).value) + num(($('f_debts') || {}).value);
    const free = Math.max(0, income - out);
    const cap = Math.max(0, Math.min(free, income * 0.4));
    const box = $('affordBox');
    if(!box) return cap;
    box.innerHTML = income ?
      '<div><b>' + money(Math.round(cap)) + '</b> a month is the most we would ask you to repay</div>' +
      '<div class="hint" style="margin-top:3px">Net income ' + money(income) + ' less living costs and existing repayments ' +
      money(out) + ', capped at 40% of income.</div>'
      : 'Enter your income to see what you can afford.';
    return cap;
  }
  function quote(){
    const amount = num(($('f_amount') || {}).value);
    const term = num(($('f_term') || {}).value) || 0;
    const box = $('quoteBox');
    if(!box) return null;
    if(!amount || !term){ box.textContent = 'Enter an amount and a term to see the monthly repayment.'; return null; }
    const rate = 0.065;
    const monthly = amount / term + amount * rate;
    const fee = amount * 0.03;
    const total = monthly * term + fee;
    const afford = affordability();
    box.innerHTML =
      '<div style="display:flex;gap:14px;flex-wrap:wrap;align-items:baseline">' +
        '<div><b style="font-size:16px">' + money(Math.round(monthly)) + '</b> <span class="hint">per month</span></div>' +
        '<div class="hint">Arrangement fee ' + money(Math.round(fee)) + ' · total payable about ' + money(Math.round(total)) + '</div>' +
      '</div>' +
      (afford && monthly > afford
        ? '<div class="signote">This repayment is above the ' + money(Math.round(afford)) + ' you can afford. Consider a longer term or a smaller amount.</div>'
        : '<div class="hint" style="margin-top:4px;color:#116B49;font-weight:700">This fits within what you can afford.</div>');
    return monthly;
  }

  /* ---------------- progress + review ---------------- */
  const SECTION_IDS = {
    a1:['f_first','f_surname','f_dob','f_sex','f_nid'],
    a2:['f_phone','f_district','f_address'],
    a3:['f_emp','f_employer','f_income'],
    a4:['f_product','f_amount','f_term','f_purpose'],
    a5:[],
    a6:['g1_name','g1_nid','g1_phone','g1_rel','g1_consent'],
    a7:[],
    a8:[],
    a9:[],
    a10:['app_date']
  };
  function sectionState(id){
    const req = SECTION_IDS[id] || [];
    const done = req.filter(k => { const n = $(k); return n && (n.type === 'checkbox' ? n.checked : String(n.value || '').trim()); }).length;
    if(!req.length){
      if(id === 'a9'){ const d = $$('[data-doc]').filter(n => n.checked).length; return d ? { done:true, label:d + ' document(s) ticked' } : { done:false, label:'Nothing ticked' }; }
      const any = id === 'a5' ? ['f_bname','f_breg','f_bturnover'].some(k => ($(k) || {}).value)
        : id === 'a7' ? ['g2_name','g2_nid'].some(k => ($(k) || {}).value)
        : id === 'a8' ? ($$('input[name="coll"]').some(n => n.checked && n.value !== 'None'))
        : false;
      return { done:any || id === 'a5' || id === 'a7', label:any ? 'Provided' : (id === 'a5' || id === 'a7' ? 'Optional' : 'No security') };
    }
    return { done:done === req.length, label:done + ' of ' + req.length + ' complete' };
  }
  function refresh(){
    let complete = 0;
    Object.keys(SECTION_IDS).forEach(id => {
      const st = sectionState(id);
      if(st.done) complete++;
      const chip = document.querySelector('[data-sec="' + id + '"]');
      const pill = document.querySelector('[data-state="' + id + '"]');
      if(chip){ chip.classList.toggle('done', st.done); }
      if(pill){ pill.textContent = st.done ? 'Complete' : st.label; pill.className = 'badge ' + (st.done ? 'b-ok' : 'b-gray'); }
    });
    const pctDone = Math.round(complete / 10 * 100);
    if($('progFill')) $('progFill').style.width = pctDone + '%';
    if($('progText')) $('progText').textContent = complete + ' of 10 sections complete · ' + pctDone + '%';
    const ready = validateSection(['f_first','f_surname','f_dob','f_sex','f_nid','f_phone','f_district','f_address',
      'f_emp','f_employer','f_income','f_product','f_amount','f_term','f_purpose','g1_name','g1_nid','g1_phone','g1_rel']) &&
      ['d_truth','d_bureau','d_data','d_terms','d_guar','d_decl'].every(id => $(id) && $(id).checked) &&
      (!!sigData('app') || String(($('app_typed') || {}).value || '').trim().length > 3);
    const pill = $('revPill');
    if(pill){ pill.textContent = ready ? 'Ready to submit' : 'Not ready'; pill.className = 'badge ' + (ready ? 'b-ok' : 'b-warn'); }
    review();
    const dc = $('docCount');
    if(dc){ const d = $$('[data-doc]').filter(n => n.checked).length; dc.textContent = d + ' of ' + $$('[data-doc]').length + ' documents ticked.'; }
    return ready;
  }
  function review(){
    const box = $('reviewBox');
    if(!box) return;
    const rows = [
      ['Applicant', [($('f_first') || {}).value, ($('f_other') || {}).value, ($('f_surname') || {}).value].filter(Boolean).join(' ')],
      ['National ID', ($('f_nid') || {}).value],
      ['Contact', [($('f_phone') || {}).value, ($('f_email') || {}).value].filter(Boolean).join(' · ')],
      ['Address', [($('f_address') || {}).value, ($('f_district') || {}).value].filter(Boolean).join(', ')],
      ['Employment', [($('f_emp') || {}).value, ($('f_employer') || {}).value].filter(Boolean).join(' · ')],
      ['Net monthly income', ($('f_income') || {}).value ? money(num($('f_income').value)) : ''],
      ['Product', ($('f_product') || {}).value],
      ['Amount requested', ($('f_amount') || {}).value ? money(num($('f_amount').value)) : ''],
      ['Term', ($('f_term') || {}).value ? $('f_term').value + ' months' : ''],
      ['Guarantor', [($('g1_name') || {}).value, ($('g1_rel') || {}).value].filter(Boolean).join(' · ')],
      ['Second guarantor', ($('g2_name') || {}).value],
      ['Security offered', ($$('input[name="coll"]').filter(n => n.checked)[0] || {}).value || 'None'],
      ['Documents ticked', $$('[data-doc]').filter(n => n.checked).length + ' of ' + $$('[data-doc]').length],
      ['Signature', sigData('app') ? 'Drawn on screen' : (String(($('app_typed') || {}).value || '').trim() ? 'Typed: ' + $('app_typed').value : 'Not signed')]
    ].filter(r => String(r[1] || '').trim());
    box.innerHTML = rows.length < 5
      ? '<div class="empty" style="padding:18px 0">Fill in the form and the summary appears here.</div>'
      : '<div class="recgrid">' + rows.map(r => '<div class="pfield"><div class="pk">' + esc(r[0]) + '</div><div class="pv">' + esc(r[1]) + '</div></div>').join('') + '</div>';
  }

  /* ---------------- submit ---------------- */
  function submit(){
    if(!gate()){ toast('Accept the loan agreement first.', 'err'); return; }
    const sections = [
      ['f_first','f_surname','f_dob','f_sex','f_nid'],
      ['f_phone','f_district','f_address'],
      ['f_emp','f_employer','f_income'],
      ['f_product','f_amount','f_term','f_purpose'],
      ['g1_name','g1_nid','g1_phone','g1_rel','g1_consent']
    ];
    let ok = true;
    sections.forEach(ids => { if(!validateSection(ids)) ok = false; });
    if(!validateSection(['decls'])) ok = false;
    if(!ok){
      const firstBad = document.querySelector('.fg input.bad, .fg select.bad, .fg textarea.bad');
      if(firstBad && firstBad.scrollIntoView) firstBad.scrollIntoView({ behavior:'smooth', block:'center' });
      toast('Some required answers are missing — they are marked in red.', 'err');
      return;
    }
    const data = collect();
    const ref = 'GLS-APP-' + String(Date.now()).slice(-6);
    let list = [];
    try { list = JSON.parse(localStorage.getItem(SUBS) || '[]'); } catch(e){ list = []; }
    list.push({ ref, when:new Date().toISOString(), name:[data.f_first, data.f_surname].filter(Boolean).join(' '),
      product:data.f_product, amount:num(data.f_amount), term:num(data.f_term), phone:data.f_phone,
      guarantor:data.g1_name, coll:data.__coll, status:'Submitted', data });
    try { localStorage.setItem(SUBS, JSON.stringify(list.slice(-25))); } catch(e){}
    localStorage.removeItem(KEY);
    if($('doneBox')) $('doneBox').style.display = 'block';
    if($('doneRef')) $('doneRef').textContent = ref;
    toast('Application ' + ref + ' submitted.');
    if($('doneBox') && $('doneBox').scrollIntoView) $('doneBox').scrollIntoView({ behavior:'smooth', block:'center' });
    if($('footNote')) $('footNote').textContent = 'Submitted as ' + ref + '. Keep this reference.';
  }

  /* ---------------- wiring ---------------- */
  function init(){
    gate();
    initPads();
    restore();
    if($('app_date') && !$('app_date').value) $('app_date').value = today();
    if($('g1_date') && !$('g1_date').value) $('g1_date').value = today();

    $$('.sheet input[id], .sheet select[id], .sheet textarea[id]').forEach(n => {
      n.addEventListener('input', () => { save(); quote(); });
      n.addEventListener('change', () => { save(); quote(); });
      n.addEventListener('blur', () => { if(n.dataset.req) validateSection([n.id]); });
    });
    $$('[data-doc]').forEach(n => n.addEventListener('change', save));
    $$('input[name="coll"]').forEach(n => n.addEventListener('change', save));
    $$('.progchips a').forEach(a => a.addEventListener('click', e => {
      const t = document.querySelector(a.getAttribute('href'));
      if(!t) return;
      e.preventDefault();
      t.scrollIntoView({ behavior:'smooth', block:'start' });
    }));
    if($('saveDraft')) $('saveDraft').onclick = () => { save(); toast('Draft saved on this device.'); };
    if($('submitBtn')) $('submitBtn').onclick = submit;
    if($('printForm')) $('printForm').onclick = () => window.print();
    if($('printAck')) $('printAck').onclick = () => window.print();
    if($('startAnother')) $('startAnother').onclick = () => { localStorage.removeItem(KEY); };
    if(window.addEventListener) window.addEventListener('beforeunload', save);

    if('IntersectionObserver' in window){
      const io = new IntersectionObserver(es => {
        es.forEach(en => {
          if(!en.isIntersecting) return;
          const id = en.target.id;
          $$('.progchips a').forEach(a => a.classList.toggle('on', a.dataset.sec === id));
        });
      }, { rootMargin:'-45% 0px -50% 0px' });
      $$('section.sec').forEach(s => io.observe(s));
    }

    affordability(); quote(); refresh();
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
</script>
</body>
</html>
