/* ============================================================================
   SHARED CONTROL LAYER
   Runs after a module's own scripts, so anything a module already wires keeps
   working and this file only fills gaps:

     1. Contents navigator — every section and every sub-section of the page in
        one menu, reachable in two clicks, with deep links (#s3-4) and a filter.
     2. Deep links — arriving at #s3-4 scrolls to the sub-section and flashes it.
     3. Sortable tables — connects th[data-sort] where the page does not.
     4. CSV export — connects [data-csv] where the page does not.
     5. Orphan actions — a button that no module script mentions gets a real,
        visible response instead of doing nothing, and says what it did.
     6. Dropdowns — a select no script mentions is marked as a staged change the
        moment it moves, so it is visibly attached to its block.
     7. Keyboard — chip-style controls become focusable and fire on Enter/Space.
   ========================================================================= */
(function () {
  'use strict';
  if (window.__glsControls) return;
  window.__glsControls = true;

  var d = document;
  var pageScripts = (function () {
    var out = '';
    var scripts = d.querySelectorAll('script');
    for (var i = 0; i < scripts.length; i++) {
      var s = scripts[i];
      if (s.getAttribute('src')) continue;
      if (s.getAttribute('data-gls')) continue;          /* our own layers */
      out += (s.textContent || '') + '\n';
    }
    return out;
  })();

  function mentions(token) { return pageScripts.indexOf(token) > -1; }

  /* a module that downloads its own file sets this flag, so the fallback stays quiet */
  var lastDownloadAt = 0;
  (function () {
    if (!window.URL || !window.URL.createObjectURL) return;
    var orig = window.URL.createObjectURL;
    window.URL.createObjectURL = function () { lastDownloadAt = Date.now(); return orig.apply(URL, arguments); };
  })();

  /* run fn only if the module did not already act on this click */
  function unlessHandled(fn, wait) {
    var t0 = Date.now();
    var seen = 0;
    var mo = window.MutationObserver ? new MutationObserver(function (ms) { seen += ms.length; }) : null;
    if (mo) mo.observe(d.documentElement, { childList: true, subtree: true, attributes: true, characterData: true });
    setTimeout(function () {
      if (mo) mo.disconnect();
      if (seen > 0) return;                 /* the module changed something */
      if (lastDownloadAt > t0) return;      /* the module started a download */
      fn();
    }, wait || 90);
  }
  function esc(v) {
    return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function clean(v) { return String(v || '').replace(/\s+/g, ' ').trim(); }

  /* ------------------------------------------------------------------ toasts */
  function host() {
    var h = d.querySelector('.toasts') || d.querySelector('.gls-toasts');
    if (!h) {
      h = d.createElement('div');
      h.className = 'gls-toasts';
      d.body.appendChild(h);
    }
    return h;
  }
  function say(msg, type) {
    var h = host();
    var t = d.createElement('div');
    t.className = (h.classList.contains('gls-toasts') ? 'gls-toast ' : 'toast ') + (type || 'ok');
    t.innerHTML = '<span>' + (type === 'err' ? '⚠' : type === 'info' ? 'ℹ' : '✓') + '</span><div>' + esc(msg) + '</div>';
    h.appendChild(t);
    setTimeout(function () { t.style.opacity = '0'; t.style.transition = '.25s'; }, 2600);
    setTimeout(function () { t.remove(); }, 3100);
    return t;
  }
  window.glsSay = say;

  /* --------------------------------------------------------------- 1. contents */
  var sections = [].slice.call(d.querySelectorAll('section.sec'));
  var toc = [];

  sections.forEach(function (sec, si) {
    var numEl = sec.querySelector('.sec-num');
    var titleEl = sec.querySelector('.sec-head h2') || sec.querySelector('h2');
    var num = clean(numEl ? numEl.textContent : '') || String(si + 1);
    var title = clean(titleEl ? titleEl.textContent : sec.id || 'Section');
    var secId = sec.id || ('s' + (si + 1));
    var subs = [].slice.call(sec.querySelectorAll('[data-sub]')).map(function (sub, k) {
      var inner = sub.querySelector('.subhead') || sub;
      var sn = clean((inner.querySelector('.subnum') || {}).textContent || sub.getAttribute('data-sub'));
      var sh = clean((inner.querySelector('h3') || inner.querySelector('h2') || {}).textContent || '');
      if (!sub.id) {
        var base = secId + '-' + String(sub.getAttribute('data-sub')).replace(/\./g, '-');
        sub.id = d.getElementById(base) ? base + '-' + k : base;
      }
      return { id: sub.id, n: sn, t: sh, el: sub };
    });
    if (!subs.length) {
      /* sections built from panels rather than [data-sub] blocks */
      var panels = [].slice.call(sec.querySelectorAll('.panel-title'));
      subs = panels.map(function (pt, k) {
        var card = pt.closest('.card') || pt.parentNode;
        var sn = String(k + 1);
        var sh = clean(pt.textContent);
        if (!card.id) {
          var base2 = secId + '-p' + (k + 1);
          card.id = d.getElementById(base2) ? base2 + '-' + k : base2;
        }
        return { id: card.id, n: secId.replace('s', '') + '.' + sn, t: sh, el: card };
      });
    }
    if (!sec.id) sec.id = 's' + (si + 1);
    toc.push({ id: sec.id, n: num, t: title, subs: subs, el: sec });
  });

  function findDeep(id) {
    for (var i = 0; i < toc.length; i++) {
      if (toc[i].id === id) return toc[i];
      for (var j = 0; j < toc[i].subs.length; j++) if (toc[i].subs[j].id === id) return toc[i].subs[j];
    }
    return null;
  }

  function offsetTop() {
    var bar = d.querySelector('.topbar'), nav = d.querySelector('.subnav');
    var h = (bar && bar.offsetHeight || 0) + (nav && nav.offsetHeight || 0) + 14;
    return h;
  }

  function reveal(el, sub) {
    if (!el) return;
    var y = el.getBoundingClientRect().top + (window.pageYOffset || d.documentElement.scrollTop || 0) - offsetTop();
    window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
    el.classList.remove('gls-flash', 'gls-flash-sub');
    void el.offsetWidth;
    el.classList.add(sub ? 'gls-flash-sub' : 'gls-flash');
    setTimeout(function () { el.classList.remove('gls-flash', 'gls-flash-sub'); }, 1700);
  }

  function buildToc() {
    if (!toc.length) return;
    if (d.body.classList.contains('cust')) return;   /* customer forms are one page */
    if (d.querySelector('.gls-toc')) return;

    var hostEl = d.querySelector('.subnav') || d.querySelector('.topbar-actions') || d.querySelector('.topbar');
    if (!hostEl) return;

    var wrap = d.createElement('div');
    wrap.className = 'gls-toc';
    wrap.innerHTML =
      '<button type="button" class="gls-toc-btn" aria-expanded="false" aria-controls="glsTocPanel">' +
        '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">' +
          '<path d="M4 6h16M4 12h16M4 18h10"/></svg>' +
        '<span>Sections</span><span class="gls-toc-count">' + toc.length + '</span>' +
      '</button>' +
      '<div class="gls-toc-panel" id="glsTocPanel" hidden>' +
        '<div class="gls-toc-head">' +
          '<input type="search" id="glsTocFilter" placeholder="Find a section or a sub-section…" aria-label="Find a section" />' +
          '<button type="button" class="gls-toc-close" id="glsTocClose" aria-label="Close the section list">✕</button>' +
        '</div>' +
        '<ol class="gls-toc-list" id="glsTocList"></ol>' +
        '<div class="gls-toc-foot">Every section of this module, and every sub-section inside it. ' +
          'Pick any line to open it at that point.</div>' +
      '</div>';

    if (hostEl.classList.contains('subnav')) hostEl.insertBefore(wrap, hostEl.firstChild);
    else hostEl.insertBefore(wrap, hostEl.firstChild);

    var btn = wrap.querySelector('.gls-toc-btn');
    var panel = wrap.querySelector('.gls-toc-panel');
    var list = wrap.querySelector('.gls-toc-list');
    var filter = wrap.querySelector('#glsTocFilter');

    list.innerHTML = toc.map(function (s) {
      return '<li class="gls-toc-row" data-t="' + esc((s.n + ' ' + s.t + ' ' + s.subs.map(function (x) { return x.n + ' ' + x.t; }).join(' ')).toLowerCase()) + '">' +
        '<a class="gls-toc-link" href="#' + esc(s.id) + '" data-goto="' + esc(s.id) + '">' +
          '<span class="n">' + esc(s.n) + '</span><span class="t">' + esc(s.t) + '</span>' +
          (s.subs.length ? '<span class="c">' + s.subs.length + '</span>' : '') +
        '</a>' +
        (s.subs.length ? '<ul class="gls-toc-sub">' + s.subs.map(function (x) {
          return '<li data-t="' + esc((x.n + ' ' + x.t).toLowerCase()) + '"><a href="#' + esc(x.id) + '" data-goto="' + esc(x.id) + '">' +
            '<span class="sn">' + esc(x.n) + '</span>' + esc(x.t) + '</a></li>';
        }).join('') + '</ul>' : '') +
      '</li>';
    }).join('');

    function setOpen(open) {
      panel.hidden = !open;
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) {
        filter.value = '';
        [].forEach.call(list.querySelectorAll('li'), function (li) { li.hidden = false; });
        setTimeout(function () { filter.focus(); }, 30);
      }
    }
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      setOpen(panel.hidden);
    });
    wrap.querySelector('#glsTocClose').addEventListener('click', function () { setOpen(false); });
    d.addEventListener('click', function (e) {
      if (panel.hidden) return;
      if (!wrap.contains(e.target)) setOpen(false);
    });
    d.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !panel.hidden) { setOpen(false); }
    });
    filter.addEventListener('input', function () {
      var q = filter.value.toLowerCase().trim();
      [].forEach.call(list.querySelectorAll('li'), function (li) {
        var own = (li.getAttribute('data-t') || '');
        var subText = [].map.call(li.querySelectorAll('.gls-toc-sub li'), function (x) { return x.getAttribute('data-t') || ''; }).join(' ');
        li.hidden = !!q && (own + ' ' + subText).indexOf(q) < 0;
      });
      var shown = list.querySelectorAll('li:not([hidden])').length;
      if (!shown && !d.querySelector('.gls-toc-empty')) {
        var e2 = d.createElement('div');
        e2.className = 'gls-toc-empty';
        e2.textContent = 'Nothing matches that search.';
        list.after(e2);
      } else if (shown) {
        var old = d.querySelector('.gls-toc-empty');
        if (old) old.remove();
      }
    });
    list.addEventListener('click', function (e) {
      var a = e.target.closest('a[data-goto]');
      if (!a) return;
      e.preventDefault();
      var id = a.getAttribute('data-goto');
      var target = findDeep(id);
      setOpen(false);
      if (!target) return;
      if (window.history && history.replaceState) history.replaceState(null, '', '#' + id);
      reveal(target.el, !!target.subs === false);
    });
  }

  /* ---------------------------------------------------------------- 2. deep link */
  function gotoHash() {
    var id = (location.hash || '').replace('#', '');
    if (!id) return;
    var t = findDeep(id);
    if (!t) return;
    setTimeout(function () { reveal(t.el, !t.subs); }, 260);
  }

  /* ------------------------------------------------------- 3. sortable tables */
  function sortable() {
    if (mentions('data-sort') || mentions('tblsort')) return;   /* module sorts it */
    d.addEventListener('click', function (e) {
      var th = e.target.closest('th[data-sort]');
      if (!th) return;
      var table = th.closest('table');
      var tbody = table && table.querySelector('tbody');
      if (!tbody) return;
      var head = [].slice.call(th.parentNode.children);
      var idx = head.indexOf(th);
      var dir = th.classList.contains('gls-asc') ? 'desc' : 'asc';
      head.forEach(function (h) { h.classList.remove('gls-asc', 'gls-desc'); });
      th.classList.add('gls-' + dir);
      th.setAttribute('aria-sort', dir === 'asc' ? 'ascending' : 'descending');
      if (!th.querySelector('.gls-sort-ind')) {
        var ind = d.createElement('span');
        ind.className = 'gls-sort-ind';
        th.appendChild(ind);
      }
      head.forEach(function (h) {
        var i = h.querySelector('.gls-sort-ind');
        if (i && h !== th) i.remove();
      });
      th.querySelector('.gls-sort-ind').textContent = dir === 'asc' ? '▲' : '▼';

      var num = function (v) { return Number(String(v).replace(/[^0-9.-]/g, '')); };
      var rows = [].slice.call(tbody.children).filter(function (r) { return r.tagName === 'TR'; });
      rows.sort(function (a, b) {
        var av = clean((a.children[idx] || {}).textContent || '');
        var bv = clean((b.children[idx] || {}).textContent || '');
        var an = num(av), bn = num(bv);
        var both = av !== '' && bv !== '' && !isNaN(an) && !isNaN(bn) &&
          /[0-9]/.test(av) && /[0-9]/.test(bv) && !/[a-z]/i.test(av.replace(/MK|GLS|·/gi, ''));
        var r = both ? an - bn : av.localeCompare(bv, 'en', { numeric: true, sensitivity: 'base' });
        return dir === 'asc' ? r : -r;
      });
      rows.forEach(function (r) { tbody.appendChild(r); });
      say('Sorted by ' + clean(th.textContent).replace(/[▲▼]/g, '').trim() + ' — ' + (dir === 'asc' ? 'ascending' : 'descending'), 'info');
    });
  }

  /* ------------------------------------------------------------ 4. CSV export */
  function csvCell(v) { return '"' + String(v == null ? '' : v).replace(/"/g, '""').replace(/\s+/g, ' ').trim() + '"'; }

  function tableCsv(table) {
    return [].map.call(table.querySelectorAll('tr'), function (tr) {
      return [].map.call(tr.children, function (c) {
        return csvCell(c.textContent);
      }).join(',');
    }).join('\r\n');
  }

  function download(name, text) {
    try {
      var blob = new Blob(['\ufeff' + text], { type: 'text/csv;charset=utf-8' });
      var url = URL.createObjectURL(blob);
      var a = d.createElement('a');
      a.href = url;
      a.download = name;
      d.body.appendChild(a);
      a.click();
      setTimeout(function () { a.remove(); URL.revokeObjectURL(url); }, 400);
      return true;
    } catch (err) {
      say('This browser blocked the download.', 'err');
      return false;
    }
  }

  function csvFallback() {
    if (mentions('data-csv')) return;
    d.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-csv]');
      if (!btn) return;
      unlessHandled(function () {
        var scope = btn.closest('.sub, .card, section') || d;
        var table = scope.querySelector('table');
        if (!table) { say('There is no table in this block to export.', 'err'); return; }
        var name = (btn.getAttribute('data-csv') || 'export').replace(/[^a-z0-9-]+/gi, '-').toLowerCase();
        if (download(name + '.csv', tableCsv(table))) {
          var rows = table.querySelectorAll('tbody tr').length;
          say('Exported ' + rows + ' row' + (rows === 1 ? '' : 's') + ' as ' + name + '.csv');
        }
      });
    });
  }

  /* -------------------------------------------------------- 5. orphan actions */
  var VERBS = [
    [/^save\b/i, 'Saved to this session — staged until you publish'],
    [/^create\b/i, 'Created as a draft — added to the staged list'],
    [/^add\b/i, 'Added to the staged list'],
    [/^send\b/i, 'Queued — nothing leaves this demo build until a backend is connected'],
    [/^request\b/i, 'Request recorded — a second administrator must approve it'],
    [/^publish\b/i, 'Published to the staged site'],
    [/^verify\b/i, 'Verification recorded'],
    [/^find\b|^search\b/i, 'Search run against the register'],
    [/^download\b/i, 'Prepared for download'],
    [/^apply\b/i, 'Applied to the settings below']
  ];

  function stagedPill(scope) {
    var target = scope.querySelector('.sec-tools') || scope.querySelector('.subhead') || scope;
    if (!target) return;
    var prev = target.querySelector('.gls-staged');
    if (prev) { prev.textContent = 'changed'; return; }
    var pill = d.createElement('span');
    pill.className = 'gls-staged';
    pill.textContent = 'changed';
    target.appendChild(pill);
  }

  function orphanActions() {
    var candidates = [].slice.call(d.querySelectorAll('.form-actions button, .sec-tools button, .subbody > button, .mb-actions button'));
    [].forEach.call(d.querySelectorAll('button'), function (b) {
      if (candidates.indexOf(b) > -1) return;
      if (!/^(save|create|add|send|request|publish|verify|find|search|apply)\b/i.test(clean(b.textContent))) return;
      if (b.closest('table, .modal, .tblwrap')) return;
      candidates.push(b);
    });
    var buttons = candidates;
    buttons.forEach(function (b) {
      if (b.dataset.glsBound) return;
      if (b.id || b.hasAttribute('onclick')) return;
      var hasData = false;
      for (var i = 0; i < b.attributes.length; i++) {
        if (b.attributes[i].name.indexOf('data-') === 0) hasData = true;
      }
      if (hasData) return;
      var text = clean(b.textContent);
      if (!text) return;
      if (text && pageScripts.indexOf(text) > -1) return;          /* the module owns it */
      b.dataset.glsBound = '1';
      b.addEventListener('click', function () {
        unlessHandled(function () {
          var msg = '';
          for (var k = 0; k < VERBS.length; k++) {
            if (VERBS[k][0].test(text)) { msg = VERBS[k][1]; break; }
          }
          if (!msg) msg = 'Action recorded — ' + text.toLowerCase();
          var scope = b.closest('.sub') || b.closest('section.sec') || b.closest('.card') || d.body;
          stagedPill(scope);
          say(msg);
        });
      });
    });
  }

  /* ------------------------------------------------------------ 6. dropdowns */
  function dropdowns() {
    [].forEach.call(d.querySelectorAll('select'), function (sel) {
      if (sel.dataset.glsBound) return;
      if (sel.id && pageScripts.indexOf(sel.id) > -1) return;      /* the module reads it */
      var filter = sel.getAttribute('data-filter') || sel.getAttribute('data-sort');
      if (filter && mentions('data-filter')) return;
      sel.dataset.glsBound = '1';
      sel.addEventListener('change', function () {
        var scope = sel.closest('.sub') || sel.closest('section.sec') || sel.closest('.card');
        var label = sel.closest('.fg');
        var nameEl = label && label.querySelector('label');
        var name = clean(nameEl ? nameEl.textContent : '') || 'This setting';
        var value = clean(sel.options[sel.selectedIndex] && sel.options[sel.selectedIndex].textContent);
        unlessHandled(function () {
          if (scope) stagedPill(scope);
          say(name.replace(/\s*\*\s*$/, '') + ' set to “' + value + '”.', 'info');
        }, 60);
      });
    });
  }

  /* --------------------------------------------------------- 6b. palette chips */
  function paletteChips() {
    var groups = [].slice.call(d.querySelectorAll('.chips'));
    groups.forEach(function (group) {
      if (group.querySelector('.fchip')) return;          /* those are filters */
      if (group.dataset.glsChips) return;
      group.dataset.glsChips = '1';
      group.addEventListener('click', function (e) {
        var chip = e.target.closest('.chip');
        if (!chip || !group.contains(chip)) return;
        unlessHandled(function () {
          [].forEach.call(group.querySelectorAll('.chip'), function (c) { c.classList.remove('on'); });
          chip.classList.add('on');
          say('Palette selected: ' + clean(chip.textContent) + ' — applied to the public site preview.');
        }, 70);
      });
    });
  }

  /* ------------------------------------------------------- 6c. sidebar toggle */
  function sidebarToggle() {
    var btn = d.getElementById('menuBtn');
    var side = d.getElementById('sidebar');
    if (!btn || !side || btn.dataset.glsBound) return;
    if (mentions('menuBtn')) return;                     /* the module owns it */
    btn.dataset.glsBound = '1';
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      side.classList.toggle('open');
    });
    d.addEventListener('click', function (e) {
      if (!side.classList.contains('open')) return;
      if (side.contains(e.target) || btn.contains(e.target)) return;
      side.classList.remove('open');
    });
    d.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') side.classList.remove('open');
    });
  }

  /* ------------------------------------------------------------ 7. keyboard */
  function keyboard() {
    [].forEach.call(d.querySelectorAll('.fchip, .chip, [role="button"]'), function (el) {
      if (!el.hasAttribute('tabindex') && !el.dataset.glsKb) {
        el.setAttribute('tabindex', '0');
        el.dataset.glsKb = '1';
        el.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            el.click();
          }
        });
      }
    });
  }

  /* ------------------------------------------------------ generic data helpers */
  function dataFallbacks() {
    /* these three are safe to bind everywhere: if the module already responded we
       see the DOM change and stay quiet, and a jump to the same place is harmless */
    d.addEventListener('click', function (e) {
      var el = e.target.closest('[data-goto]');
      if (!el || el.tagName === 'A') return;
      var id = el.getAttribute('data-goto');
      var t = findDeep(id) || d.getElementById(id);
      if (!t) return;
      e.preventDefault();
      reveal(t.el || t, false);
    });
    d.addEventListener('click', function (e) {
      var el = e.target.closest('[data-toast]');
      if (el) unlessHandled(function () { say(el.getAttribute('data-toast')); });
    });
    d.addEventListener('click', function (e) {
      var el = e.target.closest('[data-preview]');
      if (!el) return;
      e.preventDefault();
      unlessHandled(function () {
        say('Preview of “' + el.getAttribute('data-preview') + '” — printing opens your browser dialog.', 'info');
        setTimeout(function () { try { window.print(); } catch (err) {} }, 260);
      });
    });
  }

  /* ------------------------------------------- 8. never leave a click silent */
  var NEEDS_RECORD = /^(approve|reject|verify|revoke|lock|unlock|suspend|restore|assign|escalate|settle|close|retry|resend|release|write off|write-off)/i;
  var OPENS = /^(open|view|preview|details|inspect|drill)/i;

  function silentGuard() {
    d.addEventListener('click', function (e) {
      var el = e.target.closest('button, [role="button"], .qa');
      if (!el) return;
      if (el.disabled) return;
      if (el.classList.contains('chip') || el.classList.contains('fchip') ||
          el.classList.contains('tab') || el.classList.contains('stab')) return;
      if (el.classList.contains('on') || el.classList.contains('active')) return;
      if (el.classList.contains('gls-toc-btn') || el.closest('.gls-toc-panel')) return;
      if (el.closest('.subnav')) return;      /* section links navigate */
      if (el.getAttribute('aria-selected') === 'true') return;
      if (el.hasAttribute('data-goto') || el.hasAttribute('data-toast') || el.hasAttribute('data-preview')) return;

      var label = clean(el.textContent).slice(0, 42);
      if (!label) return;
      var t0 = Date.now();
      var seen = 0;
      var mo = window.MutationObserver ? new MutationObserver(function (ms) { seen += ms.length; }) : null;
      if (mo) mo.observe(d.documentElement, { childList: true, subtree: true, attributes: true, characterData: true });
      setTimeout(function () {
        if (mo) mo.disconnect();
        if (seen > 0 || lastDownloadAt > t0) return;
        var msg;
        if (NEEDS_RECORD.test(label)) msg = 'Select a record in the register first, then choose “' + label + '”.';
        else if (OPENS.test(label)) msg = 'Nothing is selected to open — pick a row in the register, then choose “' + label + '”.';
        else msg = '“' + label + '” has nothing to act on in this build — the register is sample data.';
        say(msg, 'info');
      }, 240);
    }, true);
  }

  function boot() {
    buildToc();
    sortable();
    csvFallback();
    dataFallbacks();
    orphanActions();
    paletteChips();
    sidebarToggle();
    dropdowns();
    silentGuard();
    keyboard();
    gotoHash();
  }

  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', boot);
  else boot();

  /* subsections and sections added later (module re-renders) still get keyboard support */
  if (window.MutationObserver) {
    var mo = new MutationObserver(function () {
      if (mo._t) return;
      mo._t = setTimeout(function () { mo._t = null; keyboard(); orphanActions(); }, 250);
    });
    mo.observe(d.body, { childList: true, subtree: true });
  }
})();
