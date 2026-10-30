#!/bin/bash
# Rebuilds disbursements.html from partials (run after editing any _*.html/_*.js/_module.css)
set -e
cd "$(dirname "$0")"
python3 _compose.py _head_disb.html disbursements
cat _head_disb.html _bodyA.html _bodyB.html _bodyC.html _jsA.js _jsB.js _jsC1.js _jsC2.js _jsC3.js > disbursements.html
python3 - <<'PY'
import pathlib
p = pathlib.Path('disbursements.html'); s = p.read_text()
s = s.replace('<div class="grid g4" id="ovTiles" style="margin-bottom:13px"></div>',
              '<div class="grid g3" id="ovTiles" style="margin-bottom:13px"></div>')
s = s.replace('<title>Module — GOLDEN FINANCIAL SERVICES</title>',
              '<title>Disbursements — GOLDEN FINANCIAL SERVICES</title>')
p.write_text(s)
print('built disbursements.html', len(s), 'bytes')
PY
