#!/bin/bash
# Rebuilds fees-penalties.html from its partials.
# Run after editing _fees-penalties.css, _fpbody*.html, _fpjs*.js or adding a nav entry.
set -e
cd "$(dirname "$0")"
python3 _compose.py _fphead.html fees-penalties
cat _fphead.html _fpbodyA.html _fpbodyB.html _fpbodyC.html _fpbodyD.html _fpbodyE.html \
    _fpjsA.js _fpjsB.js _fpjsC.js _fpjsD.js _fpjsE.js _fpjsF.js _fpjsG.js _fpjsH.js > fees-penalties.html
python3 - <<'PY'
import pathlib
p = pathlib.Path('fees-penalties.html'); s = p.read_text()
s = s.replace('<title>Module — GOLDEN FINANCIAL SERVICES</title>',
              '<title>Fees &amp; Penalties — GOLDEN FINANCIAL SERVICES</title>')
p.write_text(s)
print('built fees-penalties.html', len(s), 'bytes')
PY
python3 inject_backnav.py fees-penalties.html
