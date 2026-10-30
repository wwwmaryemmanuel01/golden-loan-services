#!/bin/bash
set -e
cd "$(dirname "$0")"
python3 _compose.py _head_notif.html notifications
cat _head_notif.html _nbodyA.html _nbodyB.html _nbodyC.html _njsA.js _njsB.js _njsC.js > notifications.html
python3 - <<'PY'
import pathlib
p = pathlib.Path('notifications.html'); s = p.read_text()
s = s.replace('<title>Module — GOLDEN FINANCIAL SERVICES</title>',
              '<title>Notifications — GOLDEN FINANCIAL SERVICES</title>')
p.write_text(s)
print('built notifications.html', len(s), 'bytes')
PY
