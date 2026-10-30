"""Injects the shared back-navigation script (_backnav.html) into built pages.

Uses the LAST </body> in the file: module scripts legitimately contain the string
"</body>" inside exported-HTML templates, so the first match is unsafe."""
import pathlib, sys
root = pathlib.Path(__file__).parent
snip = (root / '_backnav.html').read_text()
for name in sys.argv[1:]:
    p = root / name
    s = p.read_text()
    if 'window.__glsBack' in s:
        print('back nav already present in', name); continue
    i = s.rfind('</body>')
    if i < 0:
        print('no </body> in', name); continue
    p.write_text(s[:i] + snip + s[i:])
    print('back nav injected into', name)
