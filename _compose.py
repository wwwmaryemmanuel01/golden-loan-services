"""Builds module pages from the master shell defined in index.html.
Extracts the shared <style> block + sidebar, then composes a module page
with its own topbar/sections/script. Keeps one source of truth for the theme."""
import re, sys, pathlib

ROOT = pathlib.Path(__file__).parent
MASTER = (ROOT / "index.html").read_text()

STYLE = re.search(r"<style>(.*?)</style>", MASTER, re.S).group(1)
SIDEBAR = re.search(r'(<aside class="sidebar" id="sidebar">.*?</aside>)', MASTER, re.S).group(1)
FAVICON = re.search(r'(<link rel="icon"[^>]+>)', MASTER).group(1)

def sidebar(active):
    s = SIDEBAR
    s = s.replace('class="nav-item active"', 'class="nav-item"')
    s = s.replace('data-page="dashboard" href="#dashboard"', 'data-page="dashboard" href="index.html"')
    s = s.replace('data-page="disbursements" href="#disbursements"', 'data-page="disbursements" href="disbursements.html"')
    s = s.replace('data-page="notifications" href="#notifications"', 'data-page="notifications" href="notifications.html"')
    s = s.replace('data-page="staff" href="#staff"', 'data-page="staff" href="staff.html"')
    for slug in ["applications","loans","repayments","collections","clients","guarantors",
                 "transactions","reports","settings"]:
        s = s.replace(f'data-page="{slug}" href="#{slug}"', f'data-page="{slug}" href="#"')
    # mark active item
    s = re.sub(r'<a class="nav-item" (data-page="%s")' % re.escape(active),
               r'<a class="nav-item active" \1', s)
    return s

def head(title, extra_css=""):
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
{FAVICON}
<title>{title} — GOLDEN FINANCIAL SERVICES</title>
<style>{STYLE}
{extra_css}</style>
</head>
<body>
{sidebar(sys.argv[2] if len(sys.argv)>2 else "")}
"""

if __name__ == "__main__":
    out = sys.argv[1]
    css_path = ROOT / "_module.css"
    extra = css_path.read_text() if css_path.exists() else ""
    page_css = ROOT / ("_%s.css" % (sys.argv[2] if len(sys.argv)>2 else ""))
    if page_css.exists():
        extra += "\n" + page_css.read_text()
    (ROOT / out).write_text(head("Module", extra))
    print("header written to", out, len(STYLE), "bytes of shared css")
