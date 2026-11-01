#!/bin/bash
# Rebuilds analytics.html from partials
# (run after editing _analytics.css, _anbody*.html or _anjs*.js)
set -e
cd "$(dirname "$0")"
python3 _compose.py _anhead.html analytics
cat _anhead.html _anbodyA.html _anbodyB.html _anbodyC.html _anbodyD.html _anbodyE.html \
    _anjsA.js _anjsB.js _anjsC.js _anjsD.js _anjsE.js > analytics.html
python3 - <<'PY'
import pathlib
p = pathlib.Path('analytics.html'); s = p.read_text()
s = s.replace('<title>Module — GOLDEN FINANCIAL SERVICES</title>',
              '<title>Graphing &amp; Tabulation — GOLDEN FINANCIAL SERVICES</title>')
p.write_text(s)
print('built analytics.html', len(s), 'bytes')
PY
python3 inject_backnav.py analytics.html
