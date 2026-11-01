#!/bin/bash
# Rebuilds compliance.html from partials
# (run after editing _compliance.css, _cobody*.html or _cojs*.js)
set -e
cd "$(dirname "$0")"
python3 _compose.py _cohead.html compliance
cat _cohead.html _cobodyA.html _cobodyB.html _cobodyC.html _cobodyD.html \
    _cojsA.js _cojsB.js _cojsC.js _cojsD.js _cojsE.js _cojsF.js _cojsG.js > compliance.html
python3 - <<'PY'
import pathlib
p = pathlib.Path('compliance.html'); s = p.read_text()
s = s.replace('<title>Module — GOLDEN FINANCIAL SERVICES</title>',
              '<title>Compliance &amp; Intelligence — GOLDEN FINANCIAL SERVICES</title>')
s = s.replace('<div class="page-title">Graphing &amp; Tabulation</div>',
              '<div class="page-title">Compliance &amp; Intelligence</div>')
p.write_text(s)
print('built compliance.html', len(s), 'bytes')
PY
python3 inject_backnav.py compliance.html
