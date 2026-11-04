<script>
/* ============================================================
   LOAN AGREEMENT — reading, acceptance and the local record
   The acceptance is stored under gls_agreement_v1, the same key
   apply.html checks before it unlocks the form.
   ============================================================ */
(function(){
  'use strict';
  const AGREEMENT = 'gls_agreement_v1';
  const $ = id => document.getElementById(id);
  const $$ = s => Array.prototype.slice.call(document.querySelectorAll(s));
  const esc = s => String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const today = () => new Date().toISOString().slice(0, 10);

  function read(){
    try { return JSON.parse(localStorage.getItem(AGREEMENT) || 'null'); } catch(e){ return null; }
  }

  function toast(msg, type){
    const host = $('toasts');
    if(!host) return;
    const t = document.createElement('div');
    t.className = 'toast ' + (type || 'ok');
    t.innerHTML = '<span>' + (type === 'err' ? '⚠' : '✓') + '</span><div>' + esc(msg) + '</div>';
    host.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; t.style.transition = '.25s'; }, 2800);
    setTimeout(() => t.remove(), 3200);
  }

  /* ---------------- state banner ---------------- */
  function paint(){
    const a = read();
    const ok = !!(a && a.accepted);
    const box = $('stateBox'), txt = $('stateText'), pill = $('accPill');
    if(box) box.classList.toggle('ok', ok), box.classList.toggle('locked', !ok);
    if(txt) txt.innerHTML = ok
      ? 'Accepted by <b>' + esc(a.name || 'the applicant') + '</b> on ' + esc(a.date || '—') + ' at ' + esc(a.place || '—') + '. The application form is unlocked on this device.'
      : 'Not yet accepted. The application form stays locked until you accept this agreement below.';
    if(pill){ pill.textContent = ok ? 'Accepted' : 'Not accepted'; pill.className = 'badge ' + (ok ? 'b-ok' : 'b-gray'); }
    if(ok && $('a_name')) $('a_name').value = a.name || '';
    if(ok && $('a_nid')) $('a_nid').value = a.nid || '';
    if(ok && $('a_place') && !$('a_place').value) $('a_place').value = a.place || '';
    ['a_read','a_under','a_data','a_accept'].forEach(id => { if(ok && $(id)) $(id).checked = true; });
    if($('acceptBtn')) $('acceptBtn').textContent = ok ? 'Update my acceptance' : 'Accept and continue to the form';
    if($('withdraw')) $('withdraw').disabled = !ok;
  }

  /* ---------------- the pad ---------------- */
  const pad = { drawn:false };
  function initPad(){
    const cv = $('sig_agree');
    if(!cv) return;
    let ctx = null;
    try { ctx = cv.getContext && cv.getContext('2d'); } catch(e){ ctx = null; }
    const meta = $('sig_agree_meta');
    if(!ctx){ if(meta) meta.textContent = 'This browser cannot draw — type your name in full instead.'; return; }
    ctx.lineWidth = 2.4; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#10221B';
    const pos = ev => {
      const r = cv.getBoundingClientRect();
      const p = ev.touches ? ev.touches[0] : ev;
      return { x:(p.clientX - r.left) * (cv.width / (r.width || cv.width)),
               y:(p.clientY - r.top) * (cv.height / (r.height || cv.height)) };
    };
    let on = false;
    const start = ev => { ev.preventDefault(); on = true; pad.drawn = true; cv.classList.add('touched');
      const p = pos(ev); ctx.beginPath(); ctx.moveTo(p.x, p.y); if(meta) meta.textContent = 'Signature captured.'; };
    const move = ev => { if(!on) return; ev.preventDefault(); const p = pos(ev); ctx.lineTo(p.x, p.y); ctx.stroke(); };
    const end = () => { on = false; };
    ['pointerdown','mousedown','touchstart'].forEach(e => cv.addEventListener(e, start, { passive:false }));
    ['pointermove','mousemove','touchmove'].forEach(e => cv.addEventListener(e, move, { passive:false }));
    ['pointerup','mouseup','mouseleave','touchend','pointercancel'].forEach(e => cv.addEventListener(e, end));
    $$('[data-clearsig="agree"]').forEach(b => b.onclick = () => {
      ctx.clearRect(0, 0, cv.width, cv.height); pad.drawn = false;
      cv.classList.remove('touched'); if(meta) meta.textContent = 'Cleared — sign again.';
    });
  }

  function fail(id, msg){
    const n = $(id), e = document.querySelector('[data-err="' + id + '"]');
    if(n) n.classList.add('bad');
    if(e) e.textContent = msg;
    return false;
  }
  function clear(id){
    const n = $(id), e = document.querySelector('[data-err="' + id + '"]');
    if(n) n.classList.remove('bad');
    if(e) e.textContent = '';
  }

  /* ---------------- accept ---------------- */
  function accept(){
    ['a_name','a_nid','a_date'].forEach(clear);
    const e = document.querySelector('[data-err="sig_agree"]'); if(e) e.textContent = '';
    const eA = document.querySelector('[data-err="accept"]'); if(eA) eA.textContent = '';
    let ok = true;
    if(![$('a_read'),$('a_under'),$('a_data'),$('a_accept')].every(n => n && n.checked)){
      if(eA) eA.textContent = 'All four confirmations must be ticked.';
      ok = false;
    }
    if(!String($('a_name').value || '').trim()) ok = fail('a_name', 'Type your full name');
    if(!String($('a_nid').value || '').trim()) ok = fail('a_nid', 'Enter your national ID number');
    if(!$('a_date').value) ok = fail('a_date', 'Enter the date you sign');
    if(!pad.drawn){ if(e) e.textContent = 'Draw your signature in the box.'; ok = false; }
    if(!ok){ toast('A few items are still missing — they are marked in red.', 'err'); return; }

    let sig = '';
    try { sig = $('sig_agree').toDataURL('image/png'); } catch(err){ sig = ''; }
    const rec = {
      accepted:true,
      name:$('a_name').value.trim(),
      nid:$('a_nid').value.trim(),
      place:$('a_place').value.trim(),
      date:$('a_date').value,
      when:new Date().toISOString(),
      version:'GLS-TC-2026.1',
      checks:{ read:$('a_read').checked, understanding:$('a_under').checked, data:$('a_data').checked, accept:$('a_accept').checked },
      signature:sig
    };
    try { localStorage.setItem(AGREEMENT, JSON.stringify(rec)); } catch(err){ toast('This device will not store the acceptance.', 'err'); return; }
    paint();
    toast('Agreement accepted. Taking you to the application form…');
    setTimeout(() => { window.location.href = 'apply.html'; }, 1100);
  }

  function withdraw(){
    try { localStorage.removeItem(AGREEMENT); } catch(e){}
    ['a_read','a_under','a_data','a_accept'].forEach(id => { if($(id)) $(id).checked = false; });
    const cv = $('sig_agree');
    if(cv && cv.getContext){ const c = cv.getContext('2d'); c.clearRect(0, 0, cv.width, cv.height); }
    pad.drawn = false;
    paint();
    toast('Acceptance withdrawn. The application form is locked again.', 'info');
  }

  function init(){
    initPad();
    if($('a_date') && !$('a_date').value) $('a_date').value = today();
    paint();
    if($('acceptBtn')) $('acceptBtn').onclick = accept;
    if($('withdraw')) $('withdraw').onclick = withdraw;
    if($('printAgr')) $('printAgr').onclick = () => window.print();
    $$('.terms .clause h3').forEach(h => {
      const link = $('a_accept');
      h.style.cursor = 'default';
      if(link) h.addEventListener('dblclick', () => {});
    });
    if(window.addEventListener){
      window.addEventListener('scroll', () => {
        const bar = $('stateBox');
        if(!bar) return;
        const r = bar.getBoundingClientRect();
        if(r.bottom < 0 && !document.querySelector('.agrslim')){
          const s = document.createElement('div');
          s.className = 'custhint agrslim';
          s.style.cssText = 'position:fixed;left:12px;right:12px;bottom:12px;z-index:40;box-shadow:0 8px 24px -14px rgba(6,78,59,.7)';
          s.innerHTML = '<span id="slimText"></span><a class="btn btn-gold btn-sm" href="#accept">Accept the agreement</a>';
          document.body.appendChild(s);
        } else if(r.bottom >= 0){
          const s = document.querySelector('.agrslim');
          if(s) s.remove();
        }
        const st = $('slimText');
        if(st && !st.textContent) st.textContent = read() ? 'You have accepted this agreement.' : 'Read the clauses, then accept to unlock the application.';
      }, { passive:true });
    }
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
</script>
</body>
</html>
