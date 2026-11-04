#!/bin/bash
# Rebuilds apply.html (the customer application form) from its partials.
# Run after editing _apply.css, _apfbody*.html or _apfjsA.js.
set -e
cd "$(dirname "$0")"
python3 _compose_customer.py _apfhead.html "Loan Application — GOLDEN FINANCIAL SERVICES" _apply.css apply.html
cat _apfhead.html _apfbodyA.html _apfbodyB.html _apfjsA.js > apply.html
python3 inject_backnav.py apply.html || true
python3 - <<'PY'
import pathlib
p = pathlib.Path('apply.html'); s = p.read_text()
print('built apply.html', len(s), 'bytes')
PY
