#!/bin/bash
set -e
cd "$(dirname "$0")"
python3 _compose.py _head_staff.html staff
cat _head_staff.html _sbodyA.html _sbodyB.html _sbodyC.html _sjsA.js _sjsB.js _sjsC1.js _sjsC2.js _sjsC3.js _sjsD.js > staff.html
python3 - <<'PY'
import pathlib
p = pathlib.Path('staff.html'); s = p.read_text()
s = s.replace('<title>Module — GOLDEN FINANCIAL SERVICES</title>',
              '<title>Staff Management — GOLDEN FINANCIAL SERVICES</title>')
p.write_text(s)
print('built staff.html', len(s), 'bytes')
PY
