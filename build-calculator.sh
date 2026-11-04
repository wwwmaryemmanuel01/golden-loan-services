#!/bin/bash
# Rebuilds loan-calculator.html from its partials.
# Run after editing _lc.css, _lcbody*.html or _lcjs*.js, or adding a nav entry.
set -e
cd "$(dirname "$0")"
python3 _compose.py _lchead.html calculator _lc.css
cat _lchead.html _lcbodyA.html _lcbodyB.html _lcbodyC.html \
    _lcjsA.js _lcjsB.js > loan-calculator.html
python3 - <<'PY'
import pathlib
p = pathlib.Path('loan-calculator.html'); s = p.read_text()
s = s.replace('<title>Module — GOLDEN FINANCIAL SERVICES</title>',
              '<title>Loan Calculator — GOLDEN FINANCIAL SERVICES</title>')
p.write_text(s)
print('built loan-calculator.html', len(s), 'bytes')
PY
python3 inject_backnav.py loan-calculator.html
