<script>

/* ============================================================
   METHODS OF PAYMENT MANAGEMENT & CONNECTIONS — page behaviour
   Everything here is defensive: a missing element never throws.
   ============================================================ */
(function(){
  var el  = function(id){ return document.getElementById(id); };
  var all = function(sel, root){ return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  /* ------------------------------------------------------------ toast -- */
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

  /* ------------------------------------------------------------ modal -- */
  function openModal(title, sub, body){
    if(!el('modal')) return;
    if(el('modalTitle')) el('modalTitle').textContent = title;
    if(el('modalSub')) el('modalSub').textContent = sub || '';
    if(el('modalBody')) el('modalBody').innerHTML = body;
    if(el('modalFoot')) el('modalFoot').innerHTML = '<button class="btn btn-ghost" data-close>Close</button>';
    el('modal').classList.add('on');
  }
  function closeModal(){ if(el('modal')) el('modal').classList.remove('on'); }

  /* -------------------------------------------------------------- CSV -- */
  function tableToCsv(table){
    return all('tr', table).map(function(tr){
      return all('th,td', tr).map(function(c){
        var v = (c.textContent || '').replace(/\s+/g, ' ').trim();
        return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
      }).join(',');
    }).join('\n');
  }
  function download(name, text){
    try{
      var blob = new Blob([text], {type: 'text/csv;charset=utf-8'});
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url; a.download = name; document.body.appendChild(a); a.click();
      setTimeout(function(){
        try{ URL.revokeObjectURL(url); }catch(e){}
        if(a.parentNode) a.parentNode.removeChild(a);
      }, 400);
      toast(name + ' downloaded');
    }catch(e){
      openModal('Export ready', name,
        '<div class="note gold"><div>This browser blocked the download. The rows are on screen and can be ' +
        'copied, or the page can be opened outside the embedded preview.</div></div>');
    }
  }
  function exportNearest(btn){
    var host = btn.closest('.sub') || btn.closest('section.sec') || document;
    var table = host.querySelector('table');
    if(!table){ toast('Nothing to export in this panel', 'err'); return; }
    var name = (btn.getAttribute('data-csv') || 'payment-export')
      .replace(/[^a-z0-9-]+/gi, '-').toLowerCase() + '.csv';
    download(name, tableToCsv(table));
  }

  /* ------------------------------------------------------------ sort -- */
  function sortTable(th){
    var table = th.closest('table');
    if(!table) return;
    var head = th.parentNode;
    var idx = all('th', head).indexOf(th);
    var body = table.querySelector('tbody');
    if(!body || idx < 0) return;
    var dir = th.getAttribute('data-dir') === 'asc' ? 'desc' : 'asc';
    all('th', head).forEach(function(h){ h.removeAttribute('data-dir'); });
    th.setAttribute('data-dir', dir);
    var rows = all('tr', body);
    rows.sort(function(a, b){
      var x = (a.children[idx] ? a.children[idx].textContent : '').trim();
      var y = (b.children[idx] ? b.children[idx].textContent : '').trim();
      var nx = parseFloat(x.replace(/[^0-9.\-]/g, ''));
      var ny = parseFloat(y.replace(/[^0-9.\-]/g, ''));
      var cmp = (!isNaN(nx) && !isNaN(ny) && /\d/.test(x) && /\d/.test(y)) ? nx - ny : x.localeCompare(y);
      return dir === 'asc' ? cmp : -cmp;
    });
    rows.forEach(function(r){ body.appendChild(r); });
  }

  /* ---------------------------------------------------------- filter -- */
  function readFilter(key){
    var s = document.querySelector('[data-filter="' + key + '"]');
    return s ? s.value : '';
  }
  function applyFilters(){
    var method   = readFilter('method');
    var state    = readFilter('state');
    var provider = readFilter('provider');
    var officer  = readFilter('officer');
    var text     = (el('filterSearch') && el('filterSearch').value || '').toLowerCase().trim();

    var isAll = function(v){ return !v || /^all\b/i.test(v); };
    var active = [];
    if(!isAll(method))   active.push(method);
    if(!isAll(state))    active.push(state);
    if(!isAll(provider)) active.push(provider);
    if(!isAll(officer))  active.push(officer);

    function matches(hay){
      if(!isAll(method)   && hay.indexOf(method.toLowerCase())   < 0) return false;
      if(!isAll(state)    && hay.indexOf(state.toLowerCase())    < 0) return false;
      if(!isAll(provider) && hay.indexOf(provider.toLowerCase()) < 0) return false;
      if(!isAll(officer)  && hay.indexOf(officer.toLowerCase())  < 0) return false;
      if(text && hay.indexOf(text) < 0) return false;
      return true;
    }

    var subs = all('.sub'), shown = 0;
    subs.forEach(function(node){
      var ok = !(active.length || text) || matches((node.textContent || '').toLowerCase());
      node.classList.toggle('hide', !ok);
      if(ok) shown++;
    });
    /* a section with nothing left visible is hidden too */
    all('section.sec').forEach(function(s){
      s.classList.toggle('hide', !s.querySelector('.sub:not(.hide)'));
    });

    var msg = el('filterMsg');
    if(msg) msg.textContent = (active.length || text)
      ? shown + ' of ' + subs.length + ' panels match' +
        (active.length ? ' · ' + active.join(' · ') : '') + (text ? ' · “' + text + '”' : '')
      : 'No filters applied — all twenty sections are shown.';
    var pill = el('filterCount');
    if(pill) pill.textContent = (active.length || text) ? shown + ' match' : 'no filters';
    return shown;
  }
  function clearFilters(){
    all('[data-filter]').forEach(function(s){ s.selectedIndex = 0; });
    if(el('filterSearch')) el('filterSearch').value = '';
    if(el('globalSearch')) el('globalSearch').value = '';
    all('.sub').forEach(function(n){ n.classList.remove('hide'); });
    all('section.sec').forEach(function(n){ n.classList.remove('hide'); });
    if(el('filterMsg')) el('filterMsg').textContent = 'No filters applied — all twenty sections are shown.';
    if(el('filterCount')) el('filterCount').textContent = 'no filters';
    toast('Filters cleared');
  }
  all('[data-filter]').forEach(function(s){ s.addEventListener('change', applyFilters); });

  /* -------------------------------------------------- section tracking -- */
  function spy(){
    var chips = all('.snav');
    var secs  = all('section.sec');
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

  /* --------------------------------------------------------- refresh -- */
  var refresh = el('topRefresh');
  if(refresh){
    var d = new Date();
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    refresh.textContent = d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
  }

  /* ------------------------------------------------------ quick export -- */
  function paymentPack(){
    var pack = ['# Golden Financial Services — payment register', '# exported ' + new Date().toISOString()];
    all('section.sec').forEach(function(s){
      var h2 = s.querySelector('h2');
      var tbl = s.querySelector('table');
      if(!h2 || !tbl) return;
      pack.push('', '# ' + h2.textContent.trim(), tableToCsv(tbl));
    });
    download('payments-export-pack.csv', pack.join('\n'));
  }

  /* ---------------------------------------------------- delegated UI -- */
  document.addEventListener('click', function(e){
    var t = e.target;
    if(!t || !t.closest) return;

    var csv = t.closest('[data-csv]');
    if(csv){ exportNearest(csv); return; }

    var th = t.closest('th');
    if(th && th.parentNode && th.parentNode.parentNode && th.parentNode.parentNode.tagName === 'THEAD'){
      sortTable(th); return;
    }

    var goto = t.closest('[data-goto]');
    if(goto){
      var target = el(goto.getAttribute('data-goto'));
      if(target && target.scrollIntoView) target.scrollIntoView({behavior: 'smooth', block: 'start'});
      return;
    }

    var toggle = t.closest('[data-toggle-method]');
    if(toggle){
      var row = toggle.closest('tr');
      var cells = row ? all('td', row) : [];
      var stateCell = cells[1];
      var wasOn = stateCell && /Active/i.test(stateCell.textContent);
      if(stateCell) stateCell.innerHTML = wasOn
        ? '<span class="badge b-info">Disabled</span>'
        : '<span class="badge b-ok">Active</span>';
      toggle.textContent = wasOn ? 'Enable' : 'Disable';
      var count = all('[data-toggle-method]').filter(function(b){
        var c = all('td', b.closest('tr'))[1];
        return c && /Active/i.test(c.textContent);
      }).length;
      var badge = toggle.closest('.sub').querySelector('.subpill');
      if(badge) badge.textContent = count + ' active';
      toast(toggle.getAttribute('data-toggle-method') + (wasOn
        ? ' disabled — new requests stop immediately, recorded in the audit trail'
        : ' enabled — it is offered to customers again'));
      return;
    }

    var recon = t.closest('[data-run-recon]');
    if(recon){
      recon.disabled = true;
      var label = recon.textContent;
      recon.textContent = 'Reconciling…';
      setTimeout(function(){
        recon.disabled = false;
        recon.textContent = label;
        toast('Reconciliation finished — 1,060 provider transactions, 12 items open', 'info');
      }, 900);
      return;
    }

    var tests = t.closest('[data-run-tests]');
    if(tests){
      var panel = tests.closest('.sub');
      var rows = panel ? all('.checkrow', panel) : [];
      rows.forEach(function(r, i){
        setTimeout(function(){
          var ck = r.querySelector('.ck');
          var cn = r.querySelector('.cn');
          if(ck){ ck.className = 'ck pass'; ck.textContent = '✓'; }
          if(cn) cn.textContent = 'Pass · ' + (120 + i * 37) + ' ms';
        }, 160 * (i + 1));
      });
      setTimeout(function(){ toast('Every provider tested — see the results above', 'info'); }, 160 * (rows.length + 1));
      return;
    }

    var oneTest = t.closest('[data-run-test]');
    if(oneTest){
      var p = oneTest.closest('.sub');
      var pillEl = p && p.querySelector('.subpill');
      if(pillEl) pillEl.textContent = 'Running…';
      setTimeout(function(){
        if(pillEl) pillEl.textContent = 'Pass · ' + (60 + Math.floor(Math.random() * 90)) + ' ms';
        toast(oneTest.getAttribute('data-run-test') + ' diagnostics passed');
      }, 700);
      return;
    }

    var prev = t.closest('[data-preview]');
    if(prev){
      var name = prev.getAttribute('data-preview');
      var host = prev.closest('.sub');
      var tbl = host ? host.querySelector('table') : null;
      openModal(name, 'Preview · what the customer or the auditor receives',
        tbl ? '<div class="tblwrap" style="max-height:none">' + tbl.outerHTML + '</div>'
            : '<div class="note gold"><div>This document is generated from the payment itself, so there is ' +
              'nothing to preview until a payment is chosen.</div></div>');
      return;
    }

    var tst = t.closest('[data-toast]');
    if(tst){ toast(tst.getAttribute('data-toast')); return; }

    var submit = t.closest('.form-actions .btn-gold');
    if(submit && !submit.hasAttribute('data-csv') && !submit.hasAttribute('data-toast') &&
       !submit.hasAttribute('data-preview') && !submit.hasAttribute('data-run-tests') &&
       !submit.hasAttribute('data-run-recon')){
      var box = submit.closest('.sub');
      var inputs = box ? all('input,select,textarea', box) : [];
      var filled = inputs.filter(function(i){ return (i.value || '').trim().length; }).length;
      if(inputs.length && !filled){ toast('Fill the form before saving', 'err'); return; }
      toast('Saved — the change is recorded with your name and the time (' + inputs.length + ' fields)');
      return;
    }

    if(t.closest('#applyFilters')){ var n = applyFilters(); toast(n + ' of 210 panels match the filters', 'info'); return; }
    if(t.closest('#clearFilters')){ clearFilters(); return; }
    if(t.closest('#printBtn')){ try{ window.print(); }catch(err){} return; }
    if(t.closest('#quickCsv')){ paymentPack(); return; }
    if(t.closest('#menuBtn')){ var sb = el('sidebar'); if(sb) sb.classList.toggle('open'); return; }
    if(t.closest('#bellBtn')){ var al = el('s18'); if(al && al.scrollIntoView) al.scrollIntoView({behavior: 'smooth'}); return; }
    if(t.closest('#modalClose') || t.closest('[data-close]')){ closeModal(); return; }
    if(t.closest('#modal') && e.target === el('modal')){ closeModal(); return; }
  });

  /* -------------------------------------------------------- searching -- */
  var timer = null;
  var gs = el('globalSearch');
  if(gs){
    gs.addEventListener('input', function(){
      clearTimeout(timer);
      timer = setTimeout(function(){
        if(el('filterSearch')) el('filterSearch').value = gs.value;
        applyFilters();
      }, 220);
    });
  }
  var fs = el('filterSearch');
  if(fs){
    fs.addEventListener('input', function(){
      clearTimeout(timer);
      timer = setTimeout(applyFilters, 220);
    });
  }

  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape') closeModal();
    if(e.key === '/' && document.activeElement !== gs && gs){ e.preventDefault(); gs.focus(); }
  });

  spy();
  window.__pm2Ready = 1;
})();

</script>
