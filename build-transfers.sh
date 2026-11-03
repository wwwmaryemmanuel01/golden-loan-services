#!/bin/bash
# Rebuilds transfers.html from its partials.
# Run after editing _transfers.css, _trbody*.html or _trjs*.js.
set -e
cd "$(dirname "$0")"
python3 _compose.py _trhead.html transfers
cat _trhead.html _trbodyA.html _trbodyB.html _trbodyC.html _trbodyD.html _trbodyE.html \
    _trjsA.js _trjsB.js _trjsC.js _trjsD.js _trjsE.js _trjsF.js _trjsG.js _trjsH.js > transfers.html
python3 - <<'PY'
import pathlib
p = pathlib.Path('transfers.html'); s = p.read_text()
s = s.replace('<title>Module — GOLDEN FINANCIAL SERVICES</title>',
              '<title>Transfers Management — GOLDEN FINANCIAL SERVICES</title>')
p.write_text(s)
print('built transfers.html', len(s), 'bytes')
PY
python3 inject_backnav.py transfers.html
