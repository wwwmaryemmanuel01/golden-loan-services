"""Post-processes built pages: shared back navigation + shared record sheets.

Injects three shared snippets so every module behaves the same way:
  * _backnav.html     — the Back control (window.__glsBack)
  * _recordsheet.css  — record-sheet styles and the small-screen layout rules
  * _recordsheet.js   — labelled record sheets for any modal or register row
  * _layout-guard.css  — keeps wide tables out of narrow grid columns
  * _layout-guard.js   — widens those cards and wraps wide tables for scrolling

Placement matters. Module scripts legitimately contain the strings `</head>`
and `</body>` inside print templates, so the injector finds the real closing
tag — one that is NOT inside a <script> block — and strips any earlier copy
that a previous run left in the wrong place. Every insertion is idempotent.
"""
import pathlib, re, sys

import inject_brand

root = pathlib.Path(__file__).parent
backnav = (root / '_backnav.html').read_text()
rs_css = (root / '_recordsheet.css').read_text()
rs_js = (root / '_recordsheet.js').read_text()
lg_css = (root / '_layout-guard.css').read_text()
lg_js = (root / '_layout-guard.js').read_text()
ct_css = (root / '_controls.css').read_text()
ct_js = (root / '_controls.js').read_text()

BACK_MARK = 'window.__glsBack'
CSS_MARK = 'data-gls="records-css"'
JS_MARK = 'data-gls="records-js"'
LG_CSS_MARK = 'data-gls="layout-css"'
LG_JS_MARK = 'data-gls="layout-js"'
CT_CSS_MARK = 'data-gls="controls-css"'
CT_JS_MARK = 'data-gls="controls-js"'
BACK_BANNER = '<!-- ==================== SHARED BACK NAVIGATION ==================== -->'

CSS_BLOCK = '<style ' + CSS_MARK + '>\n' + rs_css + '\n</style>\n'
JS_BLOCK = '<script ' + JS_MARK + '>\n' + rs_js + '\n</script>\n'
LG_CSS_BLOCK = '<style ' + LG_CSS_MARK + '>\n' + lg_css + '\n</style>\n'
LG_JS_BLOCK = '<script ' + LG_JS_MARK + '>\n' + lg_js + '\n</script>\n'
CT_CSS_BLOCK = '<style ' + CT_CSS_MARK + '>\n' + ct_css + '\n</style>\n'
CT_JS_BLOCK = '<script ' + CT_JS_MARK + '>\n' + ct_js + '\n</script>\n'


def script_spans(html):
    """Character ranges occupied by <script>…</script> elements."""
    spans = []
    for m in re.finditer(r'<script\b[^>]*>', html):
        if 'data-gls="records-js"' in m.group(0):
            continue
        end = html.find('</script>', m.end())
        if end < 0:
            continue
        spans.append((m.start(), end + len('</script>')))
    return spans


def inside(spans, pos):
    return any(a <= pos < b for a, b in spans)


def strip_blocks(html):
    """Remove every previously injected copy, wherever it ended up."""
    html = re.sub(r'<style data-gls="records-css">.*?</style>\n?', '', html, flags=re.S)
    html = re.sub(r'<script data-gls="records-js">.*?</script>\n?', '', html, flags=re.S)
    html = re.sub(r'<style data-gls="layout-css">.*?</style>\n?', '', html, flags=re.S)
    html = re.sub(r'<script data-gls="layout-js">.*?</script>\n?', '', html, flags=re.S)
    html = re.sub(r'<style data-gls="controls-css">.*?</style>\n?', '', html, flags=re.S)
    html = re.sub(r'<script data-gls="controls-js">.*?</script>\n?', '', html, flags=re.S)
    html = re.sub(re.escape(BACK_BANNER) + r'\s*<script>.*?</script>\n?', '', html, flags=re.S)
    return html


def head_at(html):
    """The real </head>: the first one that is not inside a script."""
    spans = script_spans(html)
    start = html.find('<head')
    if start < 0:
        return -1
    pos = html.find('</head>', start)
    while pos >= 0 and inside(spans, pos):
        pos = html.find('</head>', pos + 1)
    return pos


def body_at(html):
    """The real </body>: the last one that is not inside a script."""
    spans = script_spans(html)
    pos = html.rfind('</body>')
    while pos >= 0 and inside(spans, pos):
        pos = html.rfind('</body>', 0, pos)
    return pos


for name in sys.argv[1:]:
    p = root / name
    if not p.exists():
        print('missing page', name)
        continue
    original = p.read_text()
    s = strip_blocks(original)
    notes = []

    i_head = head_at(s)
    if i_head < 0:
        print('no </head> in', name)
    else:
        s = s[:i_head] + CSS_BLOCK + LG_CSS_BLOCK + CT_CSS_BLOCK + s[i_head:]
        notes.append('css')

    i_body = body_at(s)
    if i_body < 0:
        print('no </body> in', name)
    else:
        s = s[:i_body] + backnav + JS_BLOCK + LG_JS_BLOCK + CT_JS_BLOCK + s[i_body:]
        notes.append('back nav + sheet js + layout guard + controls')

    s = inject_brand.transform(s, name)

    if s != original:
        p.write_text(s)
        print('refreshed', ', '.join(notes), 'in', name)
    else:
        print('shared snippets already in place in', name)
