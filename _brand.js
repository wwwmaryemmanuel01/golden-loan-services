/* ============================================================================
   BRAND — logo placement and the loading animation, on every page

   Injected after the module scripts by inject_brand.py, so the page is
   already built when this runs. Everything here is additive and defensive:
   a missing element, a blocked API or a script error elsewhere on the page
   never stops the portal working.

   Puts the mark in:
     * the page footer (with the company line and a few real links)
     * a print header band that only appears when the page is printed
     * every document the modules print (doPrint / printTable / record sheets)

   The document mark is embedded as a data URI so a receipt printed or saved
   later still carries the logo with no network request.
   ========================================================================= */
(function () {
  'use strict';

  var ASSETS = 'assets/';
  /* filled in by make-assets.sh from assets/logo-mark-96.png */
  var GLS_DOC_MARK = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAMAAADVRocKAAABF1BMVEUAAACBSBZuMgC/eg7Yoi7atVrlvFXsvEv+9If+8Xr96nb6647898z37LHx5ajg0IyKSwWoXgOhZx3bvnHv23f02XHoqCXusyj4ykblqzb82lXzzFX+/eTl1qfJu5GhXweybBaqbRfkwWfPfwrDew26cwh5Rgy3kkDj16r9+Kb9+beeWgPDhSvlwEfy2pL94lqSUQHppRueTwG/hRj99pa3dxq8ijewaw391kf952fOlC6GSAT6xzflsTfany/0sRv94U3JnTv0vDTNiBWYVAWBQwXLt3vblxjnsS/aqj3WjxD1tyjUmyHQlhzuuDnwujGxagf8xCz70DrjlgvjnBa9mE7EiSuVWQ7IhBPCllXhjwLJhRi8exN4YvlDAAAAAXRSTlMAQObYZgAAC4ZJREFUaN7tWPt3okgWhlREfEStjgKCM+KDJGoQabUFJWhLbIIyiaDb09Od///v2FuYGB9J957dnXP2nM39IREo7vO7X92Cot7lXd7lXd7lXf6nhP4bdJ5Ef9FpjInH2UQylU6fZbLZ/57+HP6QPc8XOI4XinFBlKR8JpMupdPp337/tW90Wa78YkmlepZKJMR4scjV6jUQJUefUBeX2atGM/2LOE5aTCZ9ffLTJWq70WS1GKpgkI5c02sfuxebZ/Tlebv0209epj9AqKWfGqhUe2wvFYsqe1lB/Wo7/enp0UX35ISi1UzqzSi65+1Co3Qmv52cQbXRYwtqeXPdlgSxcFZidl0E59TU2evuZwuiYaZLSfmNCOhhu9nsseoFNYqukXVjWQbbsPeAekFTF7GCevx6Ni9YlthsNpnuGwF8AqQ0My8QwOMbS5gkk+gwESeUKn4+uPlZMnh+arDNZsp5Q//tWalUqu54O+rbljExpYujpTOKkvZi+MLwLsdbVqLR6JlvlAC1m+nS+V72MBgwRFHtXh4t7lJ33sulF587Lr+wzF6jkZgMXtV/mWo0z2J7+iu2ZFmCIQqCKGbOs3uBIHTi/7G9yNEIIdvS2F4vYUj4Nf2VAhi/6cy27wyZm/vFAxiAygmWobHp9NWuie5y5j8XE5G8xh4sk2UThhW8AgCqW4BnN/jjBj6UWizqQBSLaWBFYohaolEqne2mCi3RbrIrcR7wwGpWwL9iYCSxiYSk4E0AtBSOV64O+kGCe5ImLdlrppvNKrVv4QVfsu1apmnG/EUw9o8NMKaZlObKZr0qhAt9vdY5D3nTqRVHlyifaDSbjaQm7NUPodxoW2WHE0zNo1Cw4NCRflvUJszSWUbun7NiGIzXvA3rYtbUysN/HE9BB2qGwOy9jHKdzY9sXKmNhQkDPeSPx0cGPABLXMYb/VfpxCQMFnzcAe8GU8sioBiEVoE1DSMUpL238SapX/KK4uiBjQnFIOvQgCrd89ywtQEXLvU0w1rwUxGW0THIv+iQnnZQ3hAAUtIel85qxKtso64o87XdJSpG6Ob0wEBmqrvDymxT4Ku0OQl4zpb7OYJVAdqAGJiXKTQxBM/H+T2M+BxNZdvrGkTgdCPPR+gwgN9Z1xl+oJ9aLAUJ4nT7ckTsYVs0RPOOZI6i/Xh/Rs/K+10ESk/PimRPGl6Onijy0EDbVpSXTU7SjECfO5trvwhUZEqb3BXtjYcHr/8jHV+tarWvx4T1XAFmibG87UnoWsiYO4wS5t5rpsm2I8U+Gr32evYszuurlfOmfiojY7k/fKYINJ5OF7yuF6NmGTNmMtFrytGT1/W3jcWY06tRXdEpUqkvB3OBet6SnRvnmeTwoDjmFzxv9cjV3E6yvcZ2yzwWlBeCxWJhRxRSkdqJXqlRPTAwaCnu/ba56ZnNL4CAjBSBIx72QFL02/oNIbSsaiXK8J9Sge2x0gETxRCGJt9hADReBMA9QIzeCHnAv6z0pn5pYoSh4FVuo8tcIQXdfthmVbxcW5Nv2wTTaGqFoD/BNnrVGNNj2YL/hv6BqRkAYw8/IddPsawp8PsG0CescGJ7/nLDuSfczPYiAQ5PpGx0+Zp+XzTNyUSKlXPU1kDSmPL7jTIYYOeePVttb+AFkG6CJakh2hNJM5mE2fRoEjrNJxOmZuYRvQ3egSa1eE7eW/fXYOAKvcb45c7CtOw8G/meMJ+F7ZUyO/CjW16qQZ5Xu9stkJpxSS2c8vp+RoW+Mg2TbX2n6qFTptQ8yyaTz+o18ieZPtvi42sq3SAhnud2mqNc1IQpz3HbMe3qClyJ93XeEqXdSWbTspVYHjRroFzUiAlNS/TaT/WjM6VSswHzJd5tPnwvgv61uzUgZQlPDByeE+KHQBnNbnOznFqVIhtEIASTTW64Ot/rwfyWiisEnp4Xa2fOYlBOS1iAfvfu+chCBkI1jh23btuHg8aJUvsOzTOKEd2SKEYWwAZbJeWF7LO99sMqCoghkEjABKMIU44YuKGoD+3Ml1PKJmNsXJ7/wL5ztMkhfwnlG30C9/Nd2stPtAmIMYljVRInZiLFAP9H6WLAminA75o41deu4xB2v14X41EciLlWWjT+Rr0uI0+biBJJtBcaIGHA3YiGMdEYX3nK/yxPZqEA6P2beO+6c8fh4O5wvVpvHLUH+LYs2/DztWmp4mmwSRImHnWlMAinD6JogCmvXH6GZ6XAAvqnkILvYpHodwICxSLHbZ7LONdpEQPeaxGUPSO0JJKK2ci3Am5K9E9u+jvUjZIJLeS5R1AlFWuO03ciwFx+flL4AXdauF+5tB+f37jMZn97jubxAdjY3mxG6JG3JmE4Mey9PVGGYYnnyKyF47B1/lDk+Z6P9AArCr4Y2pszTTaThhZiraenzpTs/0/6PDEEEdw9xF06Euhf6zoxYNfqylLehzyN+3Vlhp0NV9yZ0J8JM/mcr/n9eD3fxEzdRdR8swHcn753d545h02/SMA/n5PJo+goyvLQAFWp1XDFcTZu1dA5MNhEe96Ugul6Xo+qphrE/Yf14yb7ajiBVgA/UNHSAZq1KEVDDNObou8bmIHya/fJ6oxSJ5Dn0LI311zRqS/7sBvdBUEAdx8rAKeoILBhJA1EIrh352QqoqjOzY/lcqkoBxFgdzCo/Xg5tUkA9jDUNpzg2PBKf2BZYRA8uJCdkxluRREA1xoLsFy+Bx/qS7kP3tlDBeQ62DcwmGO75rzsugPQBTGkMhFErjGucxa4H9g+dNas3ELRhOMlzMlUJwaKN1BYjIkBZ1gHcQ4MIAcV3ReqKGMuJOkQelW4V+4r9v1iPA48DIey0S1ulbEO908Y0wjGC4D2rAhBtloI8jJy7LrjuO6BAcr3prq+7YJlDQ9hth6Px2u338U38bE+1p1Bl3wkyOWgKa9d4tWdBLzjyKQGNuhvtfoEc/xq7q65gyJTqLoY89upYgb+2aB/tQJ4MkV3tYK5miCnO2iBgdyHPsEbehA416mDgZH9tdXqtFp14ipHTi2LwwgoJoQU7MU0B/U137YdwLcvk/RVhnKkv0J3iDV0z62dukLctvvgP24R6AzsMbdYBHeHBlQoorDb/UAFyL6xoW0UXB6RCXowaG38H27W4ft1rb8cEANDv4UBnGRLlEE9AG59aADZUFRpbzJRh0OlruAIvLMcbnU6nVwnV8F31tPUHXcIdIjbvgNcU58DE4y+w4EuDI2jFFHdG8MwC1sLyOfm8PqGnKCsoPu2M5uVOwN3/fQVxi8q5FsSMfDJWYL+FdHqCGTTsMZHBmZDUYMht32VPVU9WwdqWVYiRhh1MP748WP59haST9PX8+dEygxUdkawSfVtx1mt1oAt2hFhzwsXRzWg0NyGwadZSheGzMPcx09qyJmqjHHn6aDXVV54tGWTrHUIMcs6QGI8Bq05XSSnu/FxBNTD4PNZOp1u9pidbS23qTcY8E/Iyev79xcgqHYOoINrZAW30qET3WguAv3c+rVR1sf4CvTD9q3ubf8j3Olg+ftx1b5CaMuaHiFWHweBAex4a2vkAO/OXzFAKYg+PSdbgWYwO8cNJEMRBrXj9fKj7DiRrxiOE+FkQqiiPwX989rrwzgGKrtU89rECICLVPXZgCwP5B/7S2kVeUwxLjGSxMRi+YKYhDEslaUvh3HAR2351rQf4QZ5QhDw4zF48oijCICufVIL9Q/vDnYFy+Ilf4BA/kTdbpemK33Znhbitud5VUaKM8OhR/1MZgPH0ddARSAK1aUQlJemvrmuv9bvfF9F6OCD3wlw7HcFz0aEx7D/6HuM+qtv0Gjw+KgsH/3t9EAcphD1SxkhnMvN6C7E+0X99fL/WCBrHvoX/Pq3RSQiFRhvN61q9TxvVmPnMRAv9tfnw4qhKkCIkTQxIcIxiz07y2R+U9W/0813eZd3eZf/c/kn1kkAR+z0LlsAAAAASUVORK5CYII=';

  window.GLS_DOC_MARK = GLS_DOC_MARK;
  window.GLS_LOGO = ASSETS + 'logo.png';
  window.GLS_LOGO_MARK = ASSETS + 'logo-mark.png';

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  /* ------------------------------------------------------ header geometry */
  /* The header is 96px on a desktop and taller when the name wraps on a phone.
     Its real height is published as --gls-topbar-h so the sticky section bar
     and the anchor offsets always line up with it — otherwise content slides
     under the header and the first line of a section is hidden. */
  function syncHeaderHeight() {
    var tb = document.querySelector('.topbar');
    if (!tb) return;
    var h = Math.round(tb.getBoundingClientRect().height) || tb.offsetHeight || 0;
    if (!h) {
      /* a browser that has not laid the bar out yet: fall back to its floor */
      var mh = parseInt(window.getComputedStyle(tb).minHeight, 10);
      if (isFinite(mh)) h = mh;
    }
    if (h > 0) document.documentElement.style.setProperty('--gls-topbar-h', h + 'px');
  }

  /* --------------------------------------------------- side bar auto-hide */
  /* Tapping the menu button slides the side bar in; it slides back out once the
     user stops using it. Any touch, scroll or key press inside it restarts the
     clock, Escape closes it at once, and a tap outside closes it — so it can
     never sit over the page and swallow clicks. The delay can be changed with
     document.documentElement.dataset.sidebarIdle (milliseconds). */
  function sidebarAutoHide() {
    var bar = document.getElementById('sidebar');
    if (!bar) return;

    var timer = null;

    function delay() {
      var v = parseInt((document.documentElement.getAttribute('data-sidebar-idle') || ''), 10);
      if (!isFinite(v) || v < 800) v = 6000;
      return v;
    }
    function isOpen() { return bar.classList.contains('open'); }
    function isPhone() {
      try { return window.matchMedia('(max-width:860px)').matches; } catch (e) { return false; }
    }
    function close() {
      clearTimeout(timer); timer = null;
      bar.classList.remove('open');
    }
    function arm() {
      clearTimeout(timer);
      timer = null;
      if (!isOpen() || !isPhone()) return;
      timer = setTimeout(close, delay());
    }

    try {
      new MutationObserver(function () { arm(); })
        .observe(bar, {attributes: true, attributeFilter: ['class']});
    } catch (e) {}

    ['pointerdown', 'touchstart', 'wheel', 'keydown'].forEach(function (ev) {
      bar.addEventListener(ev, function () { if (isOpen()) arm(); }, {passive: true});
    });

    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape' && isOpen()) close();
    });

    document.addEventListener('click', function (ev) {
      if (!isOpen()) return;
      var t = ev.target;
      if (bar.contains(t)) return;
      if (t && t.closest && t.closest('#menuBtn')) return;
      close();
    }, true);
  }

  /* ------------------------------------------------------------ build stamp */
  /* the date the browser received this copy, so "is this the latest build?"
     can be answered by looking at the page instead of guessing at a cache */
  function buildStamp() {
    try {
      var t = new Date(document.lastModified);
      if (isNaN(t.getTime())) return '';
      return t.toLocaleString('en-GB', {day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'});
    } catch (e) { return ''; }
  }

  /* ---------------------------------------------------------------- footer */
  function footer() {
    /* inside .content when it exists, so the footer shares the page padding */
    var host = document.querySelector('.content') || document.querySelector('.main');
    if (!host || document.querySelector('.gls-footer')) return;
    var y = new Date().getFullYear();
    var f = el('footer', 'gls-footer');
    f.innerHTML =
      '<div class="gls-foot-brand">' +
        '<img src="' + ASSETS + 'logo-mark.png" alt="">' +
        '<div><div class="gls-foot-name">GOLDEN FINANCIAL SERVICES</div>' +
        '<div class="gls-foot-sub">LILONGWE · MALAWI · LICENSED MONEYLENDER</div></div>' +
      '</div>' +
      '<div class="gls-foot-links">' +
        '<a href="index.html">Dashboard</a>' +
        '<a href="security.html">Security &amp; privacy</a>' +
        '<a href="settings.html">Settings</a>' +
        '<span class="gls-foot-sep"></span>' +
        '<span class="gls-build" title="The time the browser received this copy of the page — if it looks old, the page was cached.">' +
          (buildStamp() ? 'Build ' + buildStamp() : '') + '</span>' +
        '<span>&copy; ' + y + ' Golden Financial Services</span>' +
      '</div>';
    host.appendChild(f);
  }

  /* ----------------------------------------------------------- print header */
  function printHead() {
    var main = document.querySelector('.main');
    if (!main || document.querySelector('.gls-print-head')) return;
    var h = el('div', 'gls-print-head');
    h.innerHTML =
      '<img src="' + ASSETS + 'logo.png" alt="GOLDEN FINANCIAL SERVICES">' +
      '<div class="gls-ph-txt">' +
        '<div class="gls-ph-name">GOLDEN FINANCIAL SERVICES</div>' +
        'Lilongwe, Malawi · Licensed moneylender<br>' +
        'Printed ' + new Date().toLocaleString('en-GB', {day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'}) +
        ' · Confidential' +
      '</div>';
    main.insertBefore(h, main.firstChild);
  }

  /* ------------------------------------------------------- printed documents */
  function docBand(title) {
    var when;
    try { when = new Date().toLocaleString('en-GB', {day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'}); }
    catch (e) { when = ''; }
    return '<div style="display:flex;align-items:center;gap:10px;padding-bottom:8px;' +
      'border-bottom:2px solid #C9A227;margin-bottom:12px">' +
      '<img src="' + GLS_DOC_MARK + '" alt="Golden Financial Services" style="height:38px;width:auto;display:block">' +
      '<div style="margin-left:auto;text-align:right;font-size:8.5px;color:#6B7280;line-height:1.5">' +
        '<div style="font-size:10.5px;font-weight:800;color:#0F1115;letter-spacing:.4px">GOLDEN FINANCIAL SERVICES</div>' +
        'Lilongwe, Malawi · Licensed moneylender<br>' +
        (title ? String(title).replace(/[<>&]/g, '') + ' · ' : '') + when +
      '</div></div>';
  }
  window.glsDocBand = docBand;

  /* the modules print through their own doPrint(); wrap it once, so every
     printed table, receipt and export carries the mark even in modules that
     never had a brand block of their own */
  function wrapPrint() {
    var orig = window.doPrint;
    if (typeof orig !== 'function' || orig.__glsWrapped) return;
    var wrapped = function (title, html) {
      try {
        if (typeof html === 'string' && html.indexOf('brandblock') === -1) {
          html = docBand(title) + html;
        }
      } catch (e) {}
      return orig.call(this, title, html);
    };
    wrapped.__glsWrapped = true;
    window.doPrint = wrapped;
  }

  /* --------------------------------------------------------------- lifecycle */
  /* the block holding the module name, so a phone can drop just that one */
  function markPageTitle() {
    var t = document.querySelector('.topbar .page-title');
    if (t && t.parentNode && t.parentNode.classList) t.parentNode.classList.add('gls-pageid');
  }

  function boot() {
    try { markPageTitle(); } catch (e) {}
    try { syncHeaderHeight(); } catch (e) {}
    try {
      window.addEventListener('resize', syncHeaderHeight);
      window.addEventListener('orientationchange', syncHeaderHeight);
      setTimeout(syncHeaderHeight, 300);
      setTimeout(syncHeaderHeight, 1200);
    } catch (e) {}
    try { sidebarAutoHide(); } catch (e) {}
    try { footer(); } catch (e) {}
    try { printHead(); } catch (e) {}
    try { wrapPrint(); } catch (e) {}
    /* modules that finish rendering late still get a wrapped printer */
    setTimeout(function () { try { wrapPrint(); } catch (e) {} }, 1200);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
