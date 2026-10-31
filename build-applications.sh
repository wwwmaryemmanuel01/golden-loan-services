#!/bin/bash
# Rebuilds applications.html from partials
# (run after editing _applications.css, _apbody*.html or _apjs*.js)
set -e
cd "$(dirname "$0")"
python3 _compose.py _aphead.html applications
cat _aphead.html _apbodyA.html _apbodyB.html _apbodyC.html _apbodyD.html \
    _apjsA.js _apjsB.js _apjsC.js _apjsD.js > applications.html
python3 - <<'PY'
import pathlib
p = pathlib.Path('applications.html'); s = p.read_text()
s = s.replace('<title>Module — GOLDEN FINANCIAL SERVICES</title>',
              '<title>Loan Applications — GOLDEN FINANCIAL SERVICES</title>')
p.write_text(s)
print('built applications.html', len(s), 'bytes')
PY
python3 inject_backnav.py applications.html
