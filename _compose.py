"""Builds module pages from the master shell defined in index.html.
Extracts the shared <style> block + sidebar, then composes a module page
with its own topbar/sections/script. Keeps one source of truth for the theme."""
import re, sys, pathlib

# Applied to every page composed from the master shell. Only directives the
# browser honours inside a <meta> tag, and only ones that restrict nothing a
# page here actually needs — see SECURITY.md before tightening them.
META = ('<meta name="referrer" content="strict-origin-when-cross-origin" />\n'
        '<meta http-equiv="Content-Security-Policy" content="object-src \'none\'; '
        'base-uri \'self\'; form-action \'self\'" />\n')

ROOT = pathlib.Path(__file__).parent
MASTER = (ROOT / "index.html").read_text()

STYLE = re.search(r"<style>(.*?)</style>", MASTER, re.S).group(1)
SIDEBAR = re.search(r'(<aside class="sidebar" id="sidebar">.*?</aside>)', MASTER, re.S).group(1)
FAVICON = re.search(r'(<link rel="icon"[^>]+>)', MASTER).group(1)

# One mapping for every sidebar entry, so no page can link to a module that
# does not exist and none can fall through to a placeholder.
PAGE_FILES = {
    "dashboard": "index.html",
    "applications": "applications.html",
    "repayments": "repayments.html",
    "clients": "clients.html",
    "disbursements": "disbursements.html",
    "reports": "reports.html",
    "analytics": "analytics.html",
    "charts": "charts.html",
    "compliance": "compliance.html",
    "security": "security.html",
    "website": "website.html",
    "payments": "payments.html",
    "deposits": "deposits.html",
    "transfers": "transfers.html",
    "savings": "savings.html",
    "salaries": "salaries.html",
    "fees-penalties": "fees-penalties.html",
    "notifications": "notifications.html",
    "audit": "audit.html",
    "staff": "staff.html",
    "roles": "roles-permissions.html",
    "recovery": "data-recovery.html",
    "settings": "settings.html",
    # no page of their own yet — they resolve to the dashboard section that covers them
    "calculator": "loan-calculator.html",
    "loans": "index.html#s3",
    "collections": "index.html#s5",
    "guarantors": "guarantors-collateral.html",
    "collateral": "guarantors-collateral.html",
    "apply": "apply.html",
    "agreement": "agreement.html",
    "transactions": "transactions.html",
    "visacards": "visacards.html",
    "statistics": "statistics.html",
    "statements": "statements.html",
}


def sidebar(active):
    s = SIDEBAR
    s = s.replace('class="nav-item active"', 'class="nav-item"')

    def fix(m):
        page = m.group(2)
        return '%s%s"' % (m.group(1), PAGE_FILES.get(page, "index.html"))

    s = re.sub(r'(data-page="([a-z-]+)"\s+href=")[^"]*"', fix, s)
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
{META}<title>{title} — GOLDEN FINANCIAL SERVICES</title>
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
    slug = sys.argv[2] if len(sys.argv)>2 else ""
    css_name = sys.argv[3] if len(sys.argv) > 3 else {"clients": "_customers.css"}.get(slug, "_%s.css" % slug)
    page_css = ROOT / css_name
    if page_css.exists():
        extra += "\n" + page_css.read_text()
    (ROOT / out).write_text(head("Module", extra))
    print("header written to", out, len(STYLE), "bytes of shared css")
