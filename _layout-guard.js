/* ============================================================================
   LAYOUT GUARD — shared by every page (see _layout-guard.css)

   Widens any card that sits in a half- or third-width grid column but holds a
   table too wide for it, and puts bare tables inside a scrolling wrapper.

   Runs after the page's own scripts have filled the tables, because most of
   these registers are rendered by JavaScript — the columns only exist later.
   Defensive throughout: a missing element or an unsupported API never throws.
   ========================================================================= */
(function () {
  'use strict';

  var WIDE_COLUMNS = 5;          /* a table with this many columns needs the full width */
  var GRID_SELECTOR = '.g2 > *, .g3 > *, .g4 > *';
  var timers = [];

  function columnCount(table) {
    var heads = table.querySelectorAll('thead th');
    if (heads.length) return heads.length;
    var first = table.querySelector('tbody tr');
    return first ? first.children.length : 0;
  }

  function widen(card) {
    if (!card || card.classList.contains('gls-wide')) return false;
    /* only cards that are actually in a multi-column grid need widening */
    var parent = card.parentNode;
    if (!parent || !parent.classList) return false;
    if (!/\bg[234]\b/.test(parent.className || '')) return false;
    card.classList.add('gls-wide');
    return true;
  }

  function wrapForScroll(table) {
    if (table.closest('.tblwrap')) return false;
    var parent = table.parentNode;
    if (!parent) return false;
    var box = document.createElement('div');
    box.className = 'tblwrap';
    parent.insertBefore(box, table);
    box.appendChild(table);
    return true;
  }

  function pass() {
    var changed = 0;

    /* 1. a wide table in a narrow grid column takes the whole row */
    var cards = document.querySelectorAll(GRID_SELECTOR);
    for (var i = 0; i < cards.length; i++) {
      var table = cards[i].querySelector('table');
      if (table && columnCount(table) >= WIDE_COLUMNS) {
        if (widen(cards[i])) changed++;
      }
    }

    /* 2. a wide table with no scroll wrapper gets one, so it cannot push the
          page wider than the screen */
    var tables = document.querySelectorAll('table');
    for (var j = 0; j < tables.length; j++) {
      var t = tables[j];
      if (columnCount(t) >= WIDE_COLUMNS && t.closest('.card, .panel')) {
        if (wrapForScroll(t)) changed++;
      }
    }
    return changed;
  }

  function schedule(delay) {
    var id = setTimeout(function () { try { pass(); } catch (e) {} }, delay);
    timers.push(id);
  }

  function boot() {
    try { pass(); } catch (e) {}
    /* the registers are filled by the page's own scripts, so re-check */
    schedule(120);
    schedule(400);
    schedule(1200);

    /* and again whenever a script redraws a register or a filter re-renders it */
    try {
      var pending = null;
      var observer = new MutationObserver(function () {
        if (pending) clearTimeout(pending);
        pending = setTimeout(function () { try { pass(); } catch (e) {} }, 140);
      });
      observer.observe(document.body, { childList: true, subtree: true });
    } catch (e) {}

    window.__glsLayoutGuard = pass;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
