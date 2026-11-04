#!/bin/bash
# Rebuilds guarantors-collateral.html from its partials.
# Run after editing _gc.css, _gcbody*.html or _gcjs*.js, or adding a nav entry.
set -e
cd "$(dirname "$0")"
python3 _compose.py _gchead.html guarantors _gc.css
cat _gchead.html _gcbodyA.html _gcbodyB.html _gcbodyC.html \
    _gcjsA.js _gcjsB.js _gcjsC.js > guarantors-collateral.html
python3 - <<'PY'
import pathlib
p = pathlib.Path('guarantors-collateral.html'); s = p.read_text()
s = s.replace('<title>Module — GOLDEN FINANCIAL SERVICES</title>',
              '<title>Guarantors &amp; Collateral — GOLDEN FINANCIAL SERVICES</title>')
p.write_text(s)
print('built guarantors-collateral.html', len(s), 'bytes')
PY
python3 inject_backnav.py guarantors-collateral.html
