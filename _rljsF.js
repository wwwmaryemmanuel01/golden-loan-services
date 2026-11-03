<script>
/* ============================================================
   STAFF ROLES & PERMISSIONS (6/6)
   Boot, the render pass, the wiring, the sidebar and the export.
   ============================================================ */

function renderAll(){
  renderOverview();
  renderCatalogue();
  renderMatrix();
  renderLimits();
  renderDuties();
  renderEnforcement();
  renderData();
  renderReviews();
  renderEmergency();
  renderRules();
  renderAudit();
}

/* ---------------- export ---------------- */
function exportRoles(){
  const cols = ['Code','Role','Tier','Purpose','Permissions','Restrictions','Holders'];
  const rows = ROLES.map(r => [r.code, r.name, r.tier, r.purpose, r.perms.join('; '), r.restr.join('; '), heldBy(r.code).length]);
  const csv = [cols].concat(rows).map(r => r.map(c => {
    const s = String(c == null ? '' : c);
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }).join(',')).join('\r\n');
  try {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'roles-and-permissions-' + TODAY.replace(/-/g, '') + '.csv';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { a.remove(); URL.revokeObjectURL(url); }, 400);
  } catch(e){}
  toast(rows.length + ' roles exported');
}

/* ---------------- wiring ---------------- */
function wireAll(){
  document.addEventListener('click', e => {
    const t = e.target.closest ? e.target : null;
    if(!t) return;

    if(e.target.closest('[data-role]')){
      SEL.role = e.target.closest('[data-role]').dataset.role;
      renderCatalogue();
      return;
    }
    if(e.target.closest('#checkBtn')){
      const p = document.querySelector('#s4');
      if(p && p.scrollIntoView) p.scrollIntoView({ behavior:'smooth', block:'start' });
      setTimeout(() => { const i = el('chkAmount'); if(i) i.focus(); }, 420);
      return;
    }
    if(e.target.closest('#chkBtn')){ checkAction(); return; }
    if(e.target.closest('#exportBtn')){ exportRoles(); return; }
    if(e.target.closest('#printBtn')){ window.print(); return; }
    if(e.target.closest('#bellBtn')){ toast('Access reviews: ' + REVIEWS.filter(r => r.status === 'Due').length + ' due, ' + SOD_BLOCKED.length + ' actions refused this quarter', 'info'); return; }
    if(e.target.closest('#modalClose')){ closeModal(); return; }
    if(e.target.id === 'modal'){ closeModal(); return; }
    if(e.target.closest('.snav')){
      const a = e.target.closest('.snav');
      document.querySelectorAll('.snav').forEach(x => x.classList.remove('on'));
      a.classList.add('on');
    }
    if(e.target.closest('#menuBtn')){
      const sb = el('sidebar');
      if(sb) sb.classList.toggle('open');
    }
  });

  const filter = el('catFilter');
  if(filter) filter.addEventListener('change', () => renderCatalogue());

  const audRole = el('audRole');
  if(audRole) audRole.addEventListener('change', () => renderAudit());
  const audResult = el('audResult');
  if(audResult) audResult.addEventListener('change', () => renderAudit());

  const search = el('globalSearch');
  if(search){
    let timer = null;
    search.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const q = search.value.trim().toLowerCase();
        if(!q){ renderAudit(); return; }
        const hit = ROLES.find(r => (r.name + ' ' + r.code + ' ' + r.purpose).toLowerCase().indexOf(q) >= 0);
        if(hit && hit.code !== SEL.role){ SEL.role = hit.code; renderCatalogue(); }
        renderAudit();
      }, 260);
    });
  }
  ['chkRole','chkAction','chkAmount'].forEach(id => {
    const n = el(id);
    if(n) n.addEventListener('change', checkAction);
  });
  if(el('chkRole') && el('chkAction') && el('chkAmount')) checkAction();

  document.addEventListener('keydown', e => {
    if(e.key === 'Escape'){
      closeModal();
      const sb = el('sidebar');
      if(sb && sb.classList.contains('open')) sb.classList.remove('open');
    }
  });
}

/* ---------------- boot ---------------- */
function boot(){
  renderAll();
  wireAll();
  if(el('topRefresh')) el('topRefresh').textContent = fmtDate(TODAY);
  if(el('chkAmount') && !el('chkAmount').value) el('chkAmount').value = 250000;
  const first = document.querySelector('.snav');
  if(first) first.classList.add('on');

  /* section links keep the sidebar honest while scrolling */
  const sections = [...document.querySelectorAll('section.sec[id]')];
  if('IntersectionObserver' in window && sections.length){
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if(!en.isIntersecting) return;
        const id = en.target.id;
        document.querySelectorAll('.snav').forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + id));
      });
    }, { rootMargin:'-45% 0px -50% 0px' });
    sections.forEach(s => io.observe(s));
  }
}

if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
</script>
</body>
</html>
