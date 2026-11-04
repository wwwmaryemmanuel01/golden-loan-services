#!/bin/bash
# Rebuilds agreement.html (terms, conditions and acceptance) from its partials.
set -e
cd "$(dirname "$0")"
python3 _compose_customer.py _agrhead.html "Loan Agreement &amp; Terms — GOLDEN FINANCIAL SERVICES" _apply.css agreement.html
cat _agrhead.html _agrbodyA.html _agrjs.js > agreement.html
python3 inject_backnav.py agreement.html || true
python3 - <<'PY'
import pathlib
p = pathlib.Path('agreement.html'); s = p.read_text()
print('built agreement.html', len(s), 'bytes')
PY
