#!/bin/bash
# Rebuilds data-recovery.html from its partials.
# Run after editing _data-recovery.css, _drbody*.html, _drjs*.js or adding a nav entry.
set -e
cd "$(dirname "$0")"
python3 _compose.py _drhead.html recovery _data-recovery.css
cat _drhead.html _drbodyA.html _drbodyB.html _drbodyC.html \
    _drjsA.js _drjsB.js _drjsC.js _drjsD.js _drjsE.js _drjsF.js _drjsG.js > data-recovery.html
python3 - <<'PY'
import pathlib
p = pathlib.Path('data-recovery.html'); s = p.read_text()
s = s.replace('<title>Module — GOLDEN FINANCIAL SERVICES</title>',
              '<title>Data Recovery, Backup &amp; Factory Reset — GOLDEN FINANCIAL SERVICES</title>')
p.write_text(s)
print('built data-recovery.html', len(s), 'bytes')
PY
python3 inject_backnav.py data-recovery.html
