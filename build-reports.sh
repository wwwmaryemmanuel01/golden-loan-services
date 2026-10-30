#!/bin/bash
set -e
cd "$(dirname "$0")"
python3 _compose.py _head_reports.html reports
cat _head_reports.html _rbodyA.html _rbodyB.html \
    _rjsA.js _rjsB.js _rjsC.js _rjsC2.js _rjsC3.js _rjsD1.js _rjsD2.js _rjsD3.js _rjsE.js _rjsD4.js > reports.html
python3 - <<'PY'
import pathlib
p = pathlib.Path('reports.html'); s = p.read_text()
s = s.replace('<title>Module — GOLDEN FINANCIAL SERVICES</title>',
              '<title>Reports — GOLDEN FINANCIAL SERVICES</title>')
p.write_text(s)
print('built reports.html', len(s), 'bytes')
PY
python3 inject_backnav.py reports.html
