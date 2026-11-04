"""Puts the GOLDEN FINANCIAL SERVICES logo on every page.

Runs from inject_backnav.py during every build, after the module markup is
complete, so the generated pages never have to be edited by hand.

It does six things, each idempotent (a second run replaces its own work):

  1. icons      — favicon, legacy .ico, home-screen icon, theme colour
  2. stylesheet — _brand.css, injected as <style data-gls="brand-css">
  3. sidebar    — the "GF" monogram in .brand-mark becomes the emblem
  4. header     — the emblem sits at the start of the top bar
  5. sign-out   — a link from the sidebar footer to the sign-in screen
  6. runtime    — _brand.js, which adds the footer, the print header band,
                  the loading splash and the logo on printed documents
"""
import pathlib
import re

ROOT = pathlib.Path(__file__).parent
CSS = (ROOT / '_brand.css').read_text()
JS = (ROOT / '_brand.js').read_text()

CSS_MARK = 'data-gls="brand-css"'
JS_MARK = 'data-gls="brand-js"'
ICON_MARK = 'data-gls="brand-icons"'

ICONS = (
    '<link data-gls="brand-icons" rel="icon" type="image/png" sizes="32x32" href="assets/favicon-32.png">\n'
    '<link data-gls="brand-icons" rel="icon" type="image/png" sizes="64x64" href="assets/favicon-64.png">\n'
    '<link data-gls="brand-icons" rel="icon" href="assets/favicon.ico" sizes="any">\n'
    '<link data-gls="brand-icons" rel="apple-touch-icon" href="assets/apple-touch-icon.png">\n'
    '<link data-gls="brand-icons" rel="mask-icon" href="assets/logo-mark.png" color="#C9A227">\n'
    '<meta data-gls="brand-icons" name="theme-color" content="#C9A227">\n'
    '<meta data-gls="brand-icons" property="og:image" content="assets/logo.png">\n'
    '<meta data-gls="brand-icons" name="application-name" content="GOLDEN FINANCIAL SERVICES">\n'
)

CSS_BLOCK = '<style ' + CSS_MARK + '>\n' + CSS + '\n</style>\n'
JS_BLOCK = '<script ' + JS_MARK + '>\n' + JS + '\n</script>\n'

BRAND_IMG = ('<img src="assets/logo-mark.png" width="44" height="44" '
             'alt="GOLDEN FINANCIAL SERVICES" loading="eager">')
TOP_LOGO = ('<img class="gls-topbar-logo" src="assets/logo-mark.png" width="34" height="34" '
            'alt="GOLDEN FINANCIAL SERVICES">')
# the words themselves, large, in the header — board-facing name and the portal
# it belongs to. Kept as text (not baked into an image) so it stays crisp and
# readable by a screen reader.
HEADER_BRAND = (
    '<div class="gls-brandbar">'
    '<div class="gls-brandbar-name">GOLDEN FINANCIAL SERVICES</div>'
    '<div class="gls-brandbar-sub">ADMINISTRATION PORTAL</div>'
    '</div>'
    '<span class="gls-brandbar-sep" aria-hidden="true"></span>'
)
SIGNOUT = (
    '<a class="gls-signout" href="login.html" title="Sign out" aria-label="Sign out">'
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">'
    '<path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3"/>'
    '<path d="M10 8l-4 4 4 4M6 12h9"/></svg></a>'
)


def script_spans(html):
    """Character ranges occupied by <script>…</script> elements."""
    spans = []
    for m in re.finditer(r'<script\b[^>]*>', html):
        if JS_MARK in m.group(0):
            continue
        end = html.find('</script>', m.end())
        if end < 0:
            continue
        spans.append((m.start(), end + len('</script>')))
    return spans


def inside(spans, pos):
    return any(a <= pos < b for a, b in spans)


def head_at(html):
    spans = script_spans(html)
    start = html.find('<head')
    if start < 0:
        return -1
    pos = html.find('</head>', start)
    while pos >= 0 and inside(spans, pos):
        pos = html.find('</head>', pos + 1)
    return pos


def body_at(html):
    spans = script_spans(html)
    pos = html.rfind('</body>')
    while pos >= 0 and inside(spans, pos):
        pos = html.rfind('</body>', 0, pos)
    return pos


def strip_previous(html):
    html = re.sub(r'<style data-gls="brand-css">.*?</style>\n?', '', html, flags=re.S)
    html = re.sub(r'<script data-gls="brand-js">.*?</script>\n?', '', html, flags=re.S)
    html = re.sub(r'<link data-gls="brand-icons"[^>]*>\n?', '', html)
    html = re.sub(r'<meta data-gls="brand-icons"[^>]*>\n?', '', html)
    # header logo and the brand words next to it
    html = re.sub(r'<img class="gls-topbar-logo"[^>]*>\n?\s*', '', html)
    html = re.sub(r'<div class="gls-brandbar">.*?</div>\s*<span class="gls-brandbar-sep"[^>]*></span>\n?\s*',
                  '', html, flags=re.S)
    # sign-out link
    html = re.sub(r'\s*<a class="gls-signout".*?</a>', '', html, flags=re.S)
    return html


def mark_brand(html):
    """The GF monogram in the sidebar becomes the emblem (safe to re-run)."""
    if re.search(r'<div class="brand-mark[^"]*">\s*<img src="assets/logo-mark\.png"', html):
        return re.sub(r'<div class="brand-mark(?! has-logo)"', '<div class="brand-mark has-logo"', html)
    return re.sub(r'<div class="brand-mark[^"]*"\s*>\s*GF\s*</div>',
                  '<div class="brand-mark has-logo">' + BRAND_IMG + '</div>', html)


def add_header_logo(html):
    """Put the emblem before the page title, after the menu button."""
    if '<img class="gls-topbar-logo"' in html:
        return html
    block = TOP_LOGO + '\n    ' + HEADER_BRAND + '\n    '
    m = re.search(r'<button class="menu-btn".*?</button>\s*', html, re.S)
    if m:
        return html[:m.end()] + block + html[m.end():]
    m = re.search(r'<header class="topbar"[^>]*>\s*', html)
    if m:
        return html[:m.end()] + block + html[m.end():]
    return html


def add_signout(html):
    """A way back to the sign-in screen, from the sidebar footer."""
    if '<a class="gls-signout"' in html:
        return html
    m = re.search(r'<div class="sidebar-foot">.*?(</div>\s*</aside>)', html, re.S)
    if not m:
        return html
    cut = m.start(1)
    return html[:cut] + '  ' + SIGNOUT + '\n  ' + html[cut:]


def transform(html):
    html = strip_previous(html)

    # element swaps first: the stylesheet below mentions these class names,
    # so checking for them afterwards would find the CSS instead of the markup
    html = mark_brand(html)
    html = add_header_logo(html)
    html = add_signout(html)

    i = head_at(html)
    if i >= 0:
        html = html[:i] + ICONS + CSS_BLOCK + html[i:]

    i = body_at(html)
    if i >= 0:
        html = html[:i] + JS_BLOCK + html[i:]
    return html


if __name__ == '__main__':
    import sys
    files = sys.argv[1:] or sorted(p.name for p in ROOT.glob('*.html')
                                   if not p.name.startswith('_'))
    for name in files:
        p = ROOT / name
        if not p.exists():
            print('missing page', name)
            continue
        old = p.read_text()
        new = transform(old)
        if new != old:
            p.write_text(new)
            print('branded', name)
        else:
            print('brand already in place in', name)
