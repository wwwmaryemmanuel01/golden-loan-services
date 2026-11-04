/* ============================================================================
   SECTIONS — open one section at a time (see _sections.css)

   Every section on a module page starts closed. Tapping its heading opens it
   and closes whichever section was open before, so the page never lays all of
   a module's detail on screen at once. The open section is named in three
   places: the state chip on its heading, the bar above the content, and a chip
   in the header.

   Works on every page without touching the generated markup: the body of each
   section is wrapped at run time. Additive and defensive — a page with no
   sections is unaffected, and printing expands everything.
   ========================================================================= */
(function () {
  'use strict';

  var OPEN_CLASS = 'open';
  var bodySeq = 0;

  function head(sec) {
    for (var i = 0; i < sec.children.length; i++) {
      if (sec.children[i].classList && sec.children[i].classList.contains('sec-head')) return sec.children[i];
    }
    return null;
  }

  function label(sec) {
    var h = sec.querySelector('h2');
    return h ? h.textContent.trim() : 'Section';
  }

  function number(sec) {
    var n = sec.querySelector('.sec-num');
    return n ? n.textContent.trim() : '';
  }

  /* ------------------------------------------------------------- open state */
  var sections = [];

  function openBar() {
    var bar = document.querySelector('.gls-openbar');
    if (bar) return bar;
    var host = document.querySelector('.content') || document.querySelector('.main');
    if (!host) return null;
    bar = document.createElement('div');
    bar.className = 'gls-openbar';
    bar.setAttribute('role', 'status');
    bar.innerHTML =
      '<span class="ob-k">Open now</span>' +
      '<span class="ob-n"></span>' +
      '<span class="ob-t"></span>' +
      '<button type="button" class="ob-x">Close section</button>';
    host.insertBefore(bar, host.firstChild);
    bar.querySelector('.ob-x').addEventListener('click', function () {
      closeAll();
      try { window.scrollTo({top: 0, behavior: 'smooth'}); } catch (e) { window.scrollTo(0, 0); }
    });
    return bar;
  }

  function headerChip() {
    var chip = document.querySelector('.gls-open-chip');
    if (chip) return chip;
    var topbar = document.querySelector('.topbar');
    if (!topbar) return null;
    chip = document.createElement('span');
    chip.className = 'gls-open-chip';
    topbar.appendChild(chip);
    return chip;
  }

  function announce(sec) {
    var bar = openBar();
    var chip = headerChip();
    if (sec) {
      var n = number(sec);
      var t = label(sec);
      if (bar) {
        bar.classList.add('on');
        bar.querySelector('.ob-n').textContent = n ? '§' + n : '';
        bar.querySelector('.ob-n').style.display = n ? '' : 'none';
        bar.querySelector('.ob-t').textContent = t;
      }
      if (chip) {
        chip.classList.add('on');
        chip.textContent = (n ? 'Section ' + n + ' open' : 'Section open');
        chip.title = t;
      }
    } else {
      if (bar) bar.classList.remove('on');
      if (chip) { chip.classList.remove('on'); chip.textContent = ''; }
    }
  }

  function closeAll() {
    sections.forEach(function (sec) {
      sec.classList.remove(OPEN_CLASS);
      var b = sec.querySelector('.gls-sec-body');
      if (b) b.setAttribute('aria-hidden', 'true');
      var h = head(sec);
      if (h) {
        h.setAttribute('aria-expanded', 'false');
        var st = h.querySelector('.gls-sec-state');
        if (st) st.lastChild.nodeValue = 'Closed';
      }
    });
    announce(null);
  }

  function open(sec, scroll) {
    if (!sec) return;
    sections.forEach(function (other) {
      if (other === sec) return;
      other.classList.remove(OPEN_CLASS);
      var ob = other.querySelector('.gls-sec-body');
      if (ob) ob.setAttribute('aria-hidden', 'true');
      var h = head(other);
      if (h) {
        h.setAttribute('aria-expanded', 'false');
        var st = h.querySelector('.gls-sec-state');
        if (st) st.lastChild.nodeValue = 'Closed';
      }
    });
    sec.classList.add(OPEN_CLASS);
    var body = sec.querySelector('.gls-sec-body');
    if (body) body.removeAttribute('aria-hidden');
    var h = head(sec);
    if (h) {
      h.setAttribute('aria-expanded', 'true');
      var st = h.querySelector('.gls-sec-state');
      if (st) st.lastChild.nodeValue = 'Open';
    }
    announce(sec);
    if (scroll) {
      try {
        var top = sec.getBoundingClientRect().top + window.pageYOffset - (headerHeight() + 18);
        window.scrollTo({top: Math.max(0, top), behavior: 'smooth'});
      } catch (e) {}
    }
  }

  function headerHeight() {
    var tb = document.querySelector('.topbar');
    return tb ? tb.getBoundingClientRect().height : 64;
  }

  /* ---------------------------------------------------------------- wiring */
  function build(sec, index) {
    if (sec.dataset.glsSection === '1') return false;
    var h = head(sec);
    if (!h) return false;

    var body = document.createElement('div');
    body.className = 'gls-sec-body';
    body.id = 'gls-sec-body-' + (sec.id || 'x' + index);
    body.setAttribute('aria-hidden', 'true');
    while (h.nextSibling) body.appendChild(h.nextSibling);
    sec.appendChild(body);

    h.setAttribute('role', 'button');
    h.setAttribute('tabindex', '0');
    h.setAttribute('aria-expanded', 'false');
    h.setAttribute('aria-controls', body.id);

    var state = document.createElement('span');
    state.className = 'gls-sec-state';
    var dot = document.createElement('span');
    dot.className = 'dotx';
    state.appendChild(dot);
    state.appendChild(document.createTextNode('Closed'));
    var tools = h.querySelector('.sec-tools');
    if (tools) h.insertBefore(state, tools.nextSibling);
    else h.appendChild(state);

    function toggle() {
      if (sec.classList.contains(OPEN_CLASS)) closeAll();
      else open(sec, false);
    }

    h.addEventListener('click', function (ev) {
      /* the buttons inside a heading do their own job */
      if (ev.target.closest && ev.target.closest('button,a,input,select,textarea,.sec-tools')) return;
      toggle();
    });
    h.addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); toggle(); }
    });

    sec.dataset.glsSection = '1';
    return true;
  }

  /* a chip in the section bar, or a link to #sN, opens that section */
  function fromHash(scroll) {
    var id = (location.hash || '').replace('#', '');
    if (!id) return false;
    var sec = document.getElementById(id);
    if (!sec || !sec.classList || !sec.classList.contains('sec')) return false;
    open(sec, scroll);
    return true;
  }

  function boot() {
    var found = document.querySelectorAll('section.sec');
    for (var i = 0; i < found.length; i++) build(found[i], i);
    sections = Array.prototype.slice.call(document.querySelectorAll('section.sec[data-gls-section="1"]'));

    document.addEventListener('click', function (ev) {
      var a = ev.target.closest ? ev.target.closest('a[href^="#"]') : null;
      if (!a) return;
      var id = (a.getAttribute('href') || '').slice(1);
      if (!id) return;
      var sec = document.getElementById(id);
      if (!sec || !sec.classList || !sec.classList.contains('sec')) return;
      ev.preventDefault();
      open(sec, true);
    }, true);

    window.addEventListener('hashchange', function () { fromHash(true); });
    fromHash(false);
    announce(null);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
