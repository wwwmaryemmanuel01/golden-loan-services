#!/bin/bash
# Rebuilds audit.html from partials
# (run after editing _audit.css, _audbody*.html or _audjs*.js)
set -e
cd "$(dirname "$0")"
python3 _compose.py _auhead.html audit
cat _auhead.html _audbodyA.html _audbodyB.html _audbodyC.html _audbodyD.html \
    _audjsA.js _audjsB.js _audjsC.js _audjsD.js > audit.html
python3 - <<'PY'
import pathlib
p = pathlib.Path('audit.html'); s = p.read_text()
s = s.replace('<title>Module — GOLDEN FINANCIAL SERVICES</title>',
              '<title>Audit Logs — GOLDEN FINANCIAL SERVICES</title>')
p.write_text(s)
print('built audit.html', len(s), 'bytes')
PY
python3 inject_backnav.py audit.html
