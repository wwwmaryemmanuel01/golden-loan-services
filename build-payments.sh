#!/bin/bash
# Rebuilds payments.html from its partials.
# Run after editing _payments.css, _pmbody*.html or _pmjs*.js.
set -e
cd "$(dirname "$0")"
python3 _compose.py _pmhead.html payments
cat _pmhead.html _pmbodyA.html _pmbodyB.html _pmbodyC.html _pmbodyD.html _pmbodyE.html \
    _pmjsA.js _pmjsB.js _pmjsC.js _pmjsD.js _pmjsE.js _pmjsF.js _pmjsG.js > payments.html
python3 - <<'PY'
import pathlib
p = pathlib.Path('payments.html'); s = p.read_text()
s = s.replace('<title>Module — GOLDEN FINANCIAL SERVICES</title>',
              '<title>Methods of Payment Management — GOLDEN FINANCIAL SERVICES</title>')
s = s.replace('<div class="page-title">Graphing &amp; Tabulation</div>',
              '<div class="page-title">Methods of Payment Management</div>')
p.write_text(s)
print('built payments.html', len(s), 'bytes')
PY
python3 inject_backnav.py payments.html
