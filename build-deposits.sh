#!/bin/bash
# Rebuilds deposits.html from its partials.
# Run after editing _deposits.css, _dwbody*.html or _dwjs*.js.
set -e
cd "$(dirname "$0")"
python3 _compose.py _dwhead.html deposits
cat _dwhead.html _dwbodyA.html _dwbodyB.html _dwbodyC.html _dwbodyD.html _dwbodyE.html \
    _dwjsA.js _dwjsB.js _dwjsC.js _dwjsD.js _dwjsE.js _dwjsF.js _dwjsG.js > deposits.html
python3 - <<'PY'
import pathlib
p = pathlib.Path('deposits.html'); s = p.read_text()
s = s.replace('<title>Module — GOLDEN FINANCIAL SERVICES</title>',
              '<title>Deposits &amp; Withdrawals Management — GOLDEN FINANCIAL SERVICES</title>')
s = s.replace('<div class="page-title">Graphing &amp; Tabulation</div>',
              '<div class="page-title">Deposits &amp; Withdrawals Management</div>')
p.write_text(s)
print('built deposits.html', len(s), 'bytes')
PY
python3 inject_backnav.py deposits.html
