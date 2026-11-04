<script>

/* ============================================================
   WEBSITE & CONNECTIONS — page behaviour
   Everything here is defensive: a missing element never throws.
   ============================================================ */
(function(){
  var el = function(id){ return document.getElementById(id); };
  var all = function(sel, root){ return Array.prototype.slice.call((root||document).querySelectorAll(sel)); };

  function toast(msg, kind){
    var host = el('toasts');
    if(!host) return;
    var t = document.createElement('div');
    t.className = 'toast ' + (kind || 'ok');
    t.innerHTML = '<span>' + (kind === 'err' ? '⚠' : kind === 'info' ? 'ℹ' : '✓') + '</span><div>' + msg + '</div>';
    host.appendChild(t);
    setTimeout(function(){ t.style.opacity = '0'; t.style.transform = 'translateX(16px)'; t.style.transition = '.25s'; }, 2600);
    setTimeout(function(){ if(t.parentNode) t.parentNode.removeChild(t); }, 3000);
  }

  function openModal(title, sub, body){
    if(!el('modal')) return;
    el('modalTitle').textContent = title;
    el('modalSub').textContent = sub || '';
    el('modalBody').innerHTML = body;
    el('modal').classList.add('on');
  }
  function closeModal(){ if(el('modal')) el('modal').classList.remove('on'); }

  /* ---------- CSV out of any rendered table ---------- */
  function tableToCsv(table){
    var rows = all('tr', table).map(function(tr){
      return all('th,td', tr).map(function(c){
        var v = (c.textContent || '').replace(/\s+/g, ' ').trim();
        return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
      }).join(',');
    });
    return rows.join('\n');
  }
  function download(name, text){
    try{
      var blob = new Blob([text], {type: 'text/csv;charset=utf-8'});
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url; a.download = name; document.body.appendChild(a); a.click();
      setTimeout(function(){ URL.revokeObjectURL(url); if(a.parentNode) a.parentNode.removeChild(a); }, 400);
      toast(name + ' downloaded');
    }catch(e){
      openModal('Export ready', name, '<div class="note gold"><div>This browser blocked the download. ' +
        'The table is on screen and can be copied, or opened outside the embedded preview.</div></div>');
    }
  }
  function exportNearest(btn){
    var host = btn.closest('.sub') || btn.closest('.sec') || document;
    var table = host.querySelector('table');
    if(!table){ toast('Nothing to export in this panel', 'err'); return; }
    var name = (btn.getAttribute('data-csv') || 'export').replace(/[^a-z0-9-]+/gi, '-').toLowerCase() + '.csv';
    download(name + '', tableToCsv(table));
  }

  /* ---------- sorting ---------- */
  function sortTable(th){
    var table = th.closest('table');
    if(!table) return;
    var idx = all('th', th.parentNode).indexOf(th);
    var body = table.querySelector('tbody');
    if(!body) return;
    var dir = th.getAttribute('data-dir') === 'asc' ? 'desc' : 'asc';
    all('th', th.parentNode).forEach(function(h){ h.removeAttribute('data-dir'); });
    th.setAttribute('data-dir', dir);
    var rows = all('tr', body);
    rows.sort(function(a, b){
      var x = (a.children[idx] ? a.children[idx].textContent : '').trim();
      var y = (b.children[idx] ? b.children[idx].textContent : '').trim();
      var nx = parseFloat(x.replace(/[^0-9.\-]/g, '')), ny = parseFloat(y.replace(/[^0-9.\-]/g, ''));
      var cmp = (!isNaN(nx) && !isNaN(ny) && /\d/.test(x) && /\d/.test(y)) ? nx - ny : x.localeCompare(y);
      return dir === 'asc' ? cmp : -cmp;
    });
    rows.forEach(function(r){ body.appendChild(r); });
  }

  /* ---------- filters ---------- */
  function applyFilters(){
    var area = (document.querySelector('[data-filter="area"]') || {}).value || 'All areas';
    var sev = (document.querySelector('[data-filter="severity"]') || {}).value || 'All severities';
    var state = (document.querySelector('[data-filter="state"]') || {}).value || 'All states';
    var owner = (document.querySelector('[data-filter="owner"]') || {}).value || 'All owners';
    var text = ((el('filterSearch') || {}).value || '').trim().toLowerCase();
    var active = [area, sev, state, owner].filter(function(v){ return v && v.indexOf('All ') !== 0; });
    var subs = all('.sub'), shown = 0;

    subs.forEach(function(node){
      var hay = (node.textContent || '').toLowerCase();
      var ok = true;
      if(area !== 'All areas' && hay.indexOf(area.toLowerCase()) < 0) ok = false;
      if(sev !== 'All severities' && hay.indexOf(sev.toLowerCase()) < 0) ok = false;
      if(state !== 'All states' && hay.indexOf(state.toLowerCase()) < 0) ok = false;
      if(owner !== 'All owners' && hay.indexOf(owner.toLowerCase()) < 0) ok = false;
      if(text && hay.indexOf(text) < 0) ok = false;
      node.classList.toggle('hide', !ok);
      if(ok) shown++;
    });
    /* a section with nothing left visible is hidden too */
    all('section.sec').forEach(function(s){
      var any = s.querySelector('.sub:not(.hide)');
      s.classList.toggle('hide', !any);
    });

    var msg = el('filterMsg');
    if(msg) msg.textContent = (active.length || text)
      ? shown + ' of ' + subs.length + ' panels match' + (active.length ? ' · ' + active.join(' · ') : '') +
        (text ? ' · “' + text + '”' : '')
      : 'No filters applied — all twenty sections are shown.';
    var pill = el('filterCount');
    if(pill) pill.textContent = (active.length || text) ? shown + ' match' : 'no filters';
    return shown;
  }
  function clearFilters(){
    all('[data-filter]').forEach(function(s){ s.selectedIndex = 0; });
    if(el('filterSearch')) el('filterSearch').value = '';
    all('.sub').forEach(function(n){ n.classList.remove('hide'); });
    all('section.sec').forEach(function(n){ n.classList.remove('hide'); });
    var msg = el('filterMsg');
    if(msg) msg.textContent = 'No filters applied — all twenty sections are shown.';
    if(el('filterCount')) el('filterCount').textContent = 'no filters';
  }

  /* ---------- section chips ---------- */
  function spy(){
    var chips = all('.snav');
    var secs = all('section.sec');
    if(!chips.length || !secs.length) return;
    function mark(){
      var best = secs[0], top = -1e9;
      secs.forEach(function(s){
        var r = s.getBoundingClientRect ? s.getBoundingClientRect() : {top: 0};
        if(r.top <= 180 && r.top > top){ top = r.top; best = s; }
      });
      chips.forEach(function(c){ c.classList.toggle('on', c.getAttribute('href') === '#' + best.id); });
    }
    window.addEventListener('scroll', mark, {passive: true});
    mark();
  }

  /* ---------- delegated clicks ---------- */
  document.addEventListener('click', function(e){
    var t = e.target;

    var csv = t.closest && t.closest('[data-csv]');
    if(csv){ exportNearest(csv); return; }

    var th = t.closest && t.closest('th');
    if(th && th.parentNode && th.parentNode.parentNode && th.parentNode.parentNode.tagName === 'THEAD'){ sortTable(th); return; }

    var goto = t.closest && t.closest('[data-goto]');
    if(goto){
      var target = el(goto.getAttribute('data-goto'));
      if(target && target.scrollIntoView && target.scrollIntoView) target.scrollIntoView({behavior: 'smooth', block: 'start'});
      return;
    }

    var ack = t.closest && t.closest('[data-ack]');
    if(ack){
      var row = ack.closest('tr');
      if(row){
        var cells = all('td', row);
        for(var i = 0; i < cells.length; i++){
          if(/Open|Monitoring/.test(cells[i].textContent)) cells[i].innerHTML = '<span class="badge b-ok">Acknowledged</span>';
        }
        ack.textContent = 'Acknowledged';
        ack.disabled = true;
        var n = all('[data-ack]:not([disabled])').length;
        var pill = el('alertCount');
        if(pill) pill.textContent = n + ' open';
        toast(ack.getAttribute('data-ack') + ' acknowledged and written to the alert history');
      }
      return;
    }

    var runTest = t.closest && t.closest('[data-run-test]');
    if(runTest){
      var code = runTest.getAttribute('data-run-test');
      var panel = runTest.closest('.sub');
      var badge = panel && panel.querySelector('.subpill');
      if(badge) badge.textContent = 'Running…';
      setTimeout(function(){
        if(badge) badge.textContent = 'Pass · ' + (90 + Math.floor(Math.random() * 120)) + ' ms';
        toast(code + ' passed');
      }, 650);
      return;
    }

    if(t.closest && t.closest('[data-run-tests]')){
      toast('All eight probes queued — results appear in 14.8');
      return;
    }
    if(t.closest && t.closest('[data-run-health]')){
      toast('Health check passed on all three instances');
      return;
    }
    var tf = t.closest && t.closest('[data-test-form]');
    if(tf){
      toast('Test submission accepted for the ' + tf.getAttribute('data-test-form'));
      return;
    }
    var prev = t.closest && t.closest('[data-preview]');
    if(prev){
      var name = prev.getAttribute('data-preview');
      var host = prev.closest('.sub');
      var tbl = host && host.querySelector('table');
      openModal(name + ' report', 'Preview · rows as they would be exported',
        tbl ? tbl.outerHTML : '<div class="note gold"><div>This report has no rows in the current period.</div></div>');
      return;
    }
    var tst = t.closest && t.closest('[data-toast]');
    if(tst){ toast(tst.getAttribute('data-toast')); return; }

    if(t.closest && t.closest('#applyFilters')){ applyFilters(); return; }
    if(t.closest && t.closest('#clearFilters')){ clearFilters(); return; }
    if(t.closest && t.closest('#printBtn')){ try{ window.print(); }catch(e){} return; }
    if(t.closest && t.closest('#menuBtn')){ var sb = el('sidebar'); if(sb) sb.classList.toggle('open'); return; }
    if(t.closest && t.closest('#bellBtn')){ var al = el('s16'); if(al && al.scrollIntoView) al.scrollIntoView({behavior: 'smooth'}); return; }
    if(t.closest && t.closest('#quickCsv')){
      var pack = [];
      all('table').slice(0, 6).forEach(function(tbl, i){ pack.push('# table ' + (i + 1)); pack.push(tableToCsv(tbl)); });
      download('website-connections-pack.csv', pack.join('\n\n'));
      return;
    }
    if(t.closest && t.closest('#modalClose')){ closeModal(); return; }
    if(t.closest && t.closest('#modal')){ if(e.target === el('modal')) closeModal(); }
  });

  /* ---------- search ---------- */
  var searchTimer = null;
  var gs = el('globalSearch');
  if(gs){
    gs.addEventListener('input', function(){
      clearTimeout(searchTimer);
      searchTimer = setTimeout(function(){
        if(el('filterSearch')) el('filterSearch').value = gs.value;
        applyFilters();
      }, 220);
    });
  }

  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape') closeModal();
    if(e.key === '/' && document.activeElement !== gs && gs){ e.preventDefault(); gs.focus(); }
  });

  spy();
  window.__wmReady = 1;
})();

</script>
