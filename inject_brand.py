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
                  the header geometry and the logo on printed documents

Sections are NOT folded: every module section is displayed open and spread, as
it was originally designed. The collapse/expand layer was retired — this script
strips any of its leftover blocks it still finds in a page.
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

# ---------------------------------------------------------------------------
# per-module accent colours — the one hue each main module is known by. Deep
# tones only, and they colour the module band, section badges and active chip
# — never the system header, which stays the house black on every page.
MODULE_ACCENTS = {
    'index':                '#0F1115',   # dashboard — the house black
    'transactions':         '#1E1B4B',   # deep midnight indigo
    'visacards':            '#1A1F71',   # VISA deep navy
    'statistics':           '#0C4A6E',   # deep marine
    'statements':           '#365314',   # deep moss
    'applications':         '#1E3A8A',   # deep blue
    'clients':              '#115E59',   # deep teal
    'repayments':           '#14532D',   # forest green
    'disbursements':        '#312E81',   # deep indigo
    'guarantors-collateral':'#581C87',   # deep plum
    'loan-calculator':      '#7C2D12',   # deep rust
    'fees-penalties':       '#7F1D1D',   # deep maroon
    'savings':              '#064E3B',   # deep emerald
    'deposits':             '#164E63',   # deep petrol
    'transfers':            '#0C4A6E',   # deep ocean
    'payments':             '#4C1D95',   # deep violet
    'salaries':             '#78350F',   # deep tan
    'compliance':           '#365314',   # deep olive
    'audit':                '#3F3F46',   # deep zinc
    'reports':              '#172554',   # deep navy
    'charts':               '#881337',   # deep wine
    'analytics':            '#4A044E',   # deep mulberry
    'notifications':        '#9A3412',   # deep copper
    'staff':                '#334155',   # deep slate
    'roles-permissions':    '#3730A3',   # deep iris
    'settings':             '#1C1917',   # warm charcoal
    'security':             '#3D0C11',   # oxblood
    'data-recovery':        '#422006',   # deep umber
    'website':              '#264653',   # deep canal
}

def add_module_accent(html, name=None):
    """Tags <body> with data-gls-module="stem" so _brand.css can pick the
    module's accent colour. Idempotent: an existing tag is replaced."""
    if not name:
        return html
    stem = name.rsplit('.', 1)[0] if '.' in name else name
    if stem not in MODULE_ACCENTS:
        return html
    m = re.search(r'<body\b[^>]*>', html)
    if not m:
        return html
    tag = m.group(0)
    clean = re.sub(r'\s*data-gls-module="[^"]*"', '', tag)
    new_tag = clean[:-1] + ' data-gls-module="%s">' % stem
    return html[:m.start()] + new_tag + html[m.end():]

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
    # retired fold layer — remove it wherever an older page still carries it
    html = re.sub(r'<style data-gls="sections-css">.*?</style>\n?', '', html, flags=re.S)
    html = re.sub(r'<script data-gls="sections-js">.*?</script>\n?', '', html, flags=re.S)
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


def transform(html, name=None):
    html = strip_previous(html)

    # element swaps first: the stylesheet below mentions these class names,
    # so checking for them afterwards would find the CSS instead of the markup
    html = mark_brand(html)
    html = add_header_logo(html)
    html = add_signout(html)
    html = add_module_accent(html, name)

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
