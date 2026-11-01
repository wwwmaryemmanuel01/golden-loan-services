#!/bin/bash
# Rebuilds website.html from its partials.
# Run after editing _website.css, _wmbody*.html or _wmjs*.js.
set -e
cd "$(dirname "$0")"
python3 _compose.py _wmhead.html website
cat _wmhead.html _wmbodyA.html _wmbodyB.html _wmbodyC.html _wmbodyD.html _wmbodyE.html \
    _wmjsA.js _wmjsB.js _wmjsC.js _wmjsD.js _wmjsE.js _wmjsF.js _wmjsG.js > website.html
python3 - <<'PY'
import pathlib
p = pathlib.Path('website.html'); s = p.read_text()
s = s.replace('<title>Module — GOLDEN FINANCIAL SERVICES</title>',
              '<title>Website Management &amp; Connections — GOLDEN FINANCIAL SERVICES</title>')
s = s.replace('<div class="page-title">Graphing &amp; Tabulation</div>',
              '<div class="page-title">Website Management &amp; Connections</div>')
p.write_text(s)
print('built website.html', len(s), 'bytes')
PY
python3 inject_backnav.py website.html
