#!/bin/bash
# Rebuilds charts.html from partials
# (run after editing _charts.css, _chbody*.html or _chjs*.js)
set -e
cd "$(dirname "$0")"
python3 _compose.py _chhead.html charts
cat _chhead.html _chbodyA.html _chbodyB.html _chbodyC.html _chbodyD.html _chbodyE.html \
    _chjsA.js _chjsB.js _chjsC.js _chjsD.js _chjsE.js _chjsF.js _chjsG.js > charts.html
python3 - <<'PY'
import pathlib
p = pathlib.Path('charts.html'); s = p.read_text()
s = s.replace('<title>Module — GOLDEN FINANCIAL SERVICES</title>',
              '<title>Charts &amp; Analytics — GOLDEN FINANCIAL SERVICES</title>')
s = s.replace('<div class="page-title">Graphing &amp; Tabulation</div>',
              '<div class="page-title">Charts &amp; Analytics</div>')
p.write_text(s)
print('built charts.html', len(s), 'bytes')
PY
python3 inject_backnav.py charts.html
