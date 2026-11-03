#!/bin/bash
# Rebuilds roles-permissions.html from its partials.
# Run after editing _roles.css, _rlbody*.html, _rljs*.js or adding a nav entry.
set -e
cd "$(dirname "$0")"
python3 _compose.py _rlhead.html roles-permissions
cat _rlhead.html _rlbodyA.html _rlbodyB.html _rlbodyC.html \
    _rljsA.js _rljsB.js _rljsC.js _rljsD.js _rljsE.js _rljsF.js > roles-permissions.html
python3 - <<'PY'
import pathlib
p = pathlib.Path('roles-permissions.html'); s = p.read_text()
s = s.replace('<title>Module — GOLDEN FINANCIAL SERVICES</title>',
              '<title>Staff Roles &amp; Permissions — GOLDEN FINANCIAL SERVICES</title>')
p.write_text(s)
print('built roles-permissions.html', len(s), 'bytes')
PY
python3 inject_backnav.py roles-permissions.html
