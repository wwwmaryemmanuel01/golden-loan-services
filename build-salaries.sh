#!/bin/bash
# Rebuilds salaries.html from its partials.
# Run after editing _salaries.css, _slbody*.html, _sljs*.js or adding a nav entry.
set -e
cd "$(dirname "$0")"
python3 _compose.py _slhead.html salaries
cat _slhead.html _slbodyA.html _slbodyB.html _slbodyC.html _slbodyD.html _slbodyE.html \
    _sljsA.js _sljsB.js _sljsC.js _sljsD.js _sljsE.js _sljsF.js _sljsG.js _sljsH.js _sljsI.js > salaries.html
python3 - <<'PY'
import pathlib
p = pathlib.Path('salaries.html'); s = p.read_text()
s = s.replace('<title>Module — GOLDEN FINANCIAL SERVICES</title>',
              '<title>Salaries, Expenses &amp; Operating Charges — GOLDEN FINANCIAL SERVICES</title>')
p.write_text(s)
print('built salaries.html', len(s), 'bytes')
PY
python3 inject_backnav.py salaries.html
