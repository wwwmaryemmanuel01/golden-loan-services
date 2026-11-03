"""Post-processes built pages: shared back navigation + shared record sheets.

Injects three shared snippets so every module behaves the same way:
  * _backnav.html     — the Back control (window.__glsBack)
  * _recordsheet.css  — record-sheet styles and the small-screen layout rules
  * _recordsheet.js   — labelled record sheets for any modal or register row

Uses the LAST </head> and </body> in the file: module scripts legitimately
contain those strings inside exported-HTML templates, so the first match is
unsafe. Every insertion is idempotent — a page that already carries a snippet
is left alone.
"""
import pathlib, re, sys

root = pathlib.Path(__file__).parent
backnav = (root / '_backnav.html').read_text()
rs_css = (root / '_recordsheet.css').read_text()
rs_js = (root / '_recordsheet.js').read_text()

BACK_MARK = 'window.__glsBack'
CSS_MARK = 'data-gls="records-css"'
JS_MARK = 'data-gls="records-js"'

for name in sys.argv[1:]:
    p = root / name
    if not p.exists():
        print('missing page', name)
        continue
    s = p.read_text()
    changed = False

    if BACK_MARK not in s:
        i = s.rfind('</body>')
        if i < 0:
            print('no </body> in', name)
        else:
            s = s[:i] + backnav + s[i:]
            changed = True
            print('back nav injected into', name)

    style_block = '<style ' + CSS_MARK + '>\n' + rs_css + '\n</style>\n'
    if CSS_MARK in s:
        fresh = re.sub(r'<style data-gls="records-css">.*?</style>\n?', lambda m: style_block, s, count=1, flags=re.S)
        if fresh != s:
            s = fresh
            changed = True
            print('record-sheet css refreshed in', name)
    else:
        i = s.rfind('</head>')
        if i < 0:
            print('no </head> in', name)
        else:
            s = s[:i] + style_block + s[i:]
            changed = True
            print('record-sheet css injected into', name)

    js_block = '<script ' + JS_MARK + '>\n' + rs_js + '\n</script>\n'
    if JS_MARK in s:
        fresh = re.sub(r'<script data-gls="records-js">.*?</script>\n?', lambda m: js_block, s, count=1, flags=re.S)
        if fresh != s:
            s = fresh
            changed = True
            print('record-sheet js refreshed in', name)
    else:
        i = s.rfind('</body>')
        if i < 0:
            print('no </body>', name)
        else:
            s = s[:i] + js_block + s[i:]
            changed = True
            print('record-sheet js injected into', name)

    if changed:
        p.write_text(s)
    else:
        print('shared snippets already present in', name)
