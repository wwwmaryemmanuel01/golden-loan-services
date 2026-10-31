#!/bin/bash
# Rebuilds clients.html from partials
# (run after editing _customers.css, _cubody*.html or _cujs*.js)
set -e
cd "$(dirname "$0")"
python3 _compose.py _cuhead.html clients
cat _cuhead.html _cubodyA.html _cubodyB.html _cubodyC.html _cubodyD.html \
    _cujsA.js _cujsB.js _cujsC.js _cujsD.js > clients.html
python3 - <<'PY'
import pathlib
p = pathlib.Path('clients.html'); s = p.read_text()
s = s.replace('<title>Module — GOLDEN FINANCIAL SERVICES</title>',
              '<title>Customers — GOLDEN FINANCIAL SERVICES</title>')
p.write_text(s)
print('built clients.html', len(s), 'bytes')
PY
python3 inject_backnav.py clients.html
