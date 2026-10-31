#!/bin/bash
# Rebuilds repayments.html from partials
# (run after editing _repayments.css, _repbody*.html or _repjs*.js)
set -e
cd "$(dirname "$0")"
python3 _compose.py _rehead.html repayments
cat _rehead.html _repbodyA.html _repbodyB.html _repbodyC.html _repbodyD.html \
    _repjsA.js _repjsB.js _repjsC.js _repjsD.js > repayments.html
python3 - <<'PY'
import pathlib
p = pathlib.Path('repayments.html'); s = p.read_text()
s = s.replace('<title>Module — GOLDEN FINANCIAL SERVICES</title>',
              '<title>Repayments &amp; Collections — GOLDEN FINANCIAL SERVICES</title>')
p.write_text(s)
print('built repayments.html', len(s), 'bytes')
PY
python3 inject_backnav.py repayments.html
