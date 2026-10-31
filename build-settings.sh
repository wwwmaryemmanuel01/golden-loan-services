#!/bin/bash
# Rebuilds settings.html from partials (run after editing any _st*.html/_st*.js/_settings.css)
set -e
cd "$(dirname "$0")"
python3 _compose.py _sthead.html settings
cat _sthead.html _stbodyA.html _stbodyB.html _stbodyC.html _stbodyD.html \
    _stjsA.js _stjsB.js _stjsC.js _stjsD.js > settings.html
python3 - <<'PY'
import pathlib
p = pathlib.Path('settings.html'); s = p.read_text()
s = s.replace('<title>Module — GOLDEN FINANCIAL SERVICES</title>',
              '<title>System Settings — GOLDEN FINANCIAL SERVICES</title>')
p.write_text(s)
print('built settings.html', len(s), 'bytes')
PY
python3 inject_backnav.py settings.html
