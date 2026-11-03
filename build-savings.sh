#!/bin/bash
# Rebuilds savings.html from its partials.
# Run after editing _savings.css, _svbody*.html, _svjs*.js or adding a nav entry.
set -e
cd "$(dirname "$0")"
python3 _compose.py _svhead.html savings
cat _svhead.html _svbodyA.html _svbodyB.html _svbodyC.html _svbodyD.html _svbodyE.html \
    _svjsA.js _svjsB.js _svjsC.js _svjsD.js _svjsE.js _svjsF.js _svjsG.js _svjsH.js > savings.html
python3 - <<'PY'
import pathlib
p = pathlib.Path('savings.html'); s = p.read_text()
s = s.replace('<title>Module — GOLDEN FINANCIAL SERVICES</title>',
              '<title>Savings Management — GOLDEN FINANCIAL SERVICES</title>')
p.write_text(s)
print('built savings.html', len(s), 'bytes')
PY
python3 inject_backnav.py savings.html
