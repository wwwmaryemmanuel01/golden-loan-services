"""Builds the customer-facing pages (application form, agreement).

They share the system's theme, header band and footer, but not the staff
sidebar — a customer filling in a form must not be shown the internal nav.
Everything else (tokens, cards, fields, buttons, tables, print) is the same CSS
the modules use, taken from index.html so there is still one source of truth.
"""
import re, sys, pathlib

ROOT = pathlib.Path(__file__).parent
MASTER = (ROOT / "index.html").read_text()
STYLE = re.search(r"<style>(.*?)</style>", MASTER, re.S).group(1)
FAVICON = re.search(r'(<link rel="icon"[^>]+>)', MASTER).group(1)
META = ('<meta name="referrer" content="strict-origin-when-cross-origin" />\n'
        '<meta http-equiv="Content-Security-Policy" content="object-src \'none\'; '
        'base-uri \'self\'; form-action \'self\'" />\n')


def head(title, extra_css="", on=""):
    on_agr = ' class="on"' if on == "agreement.html" else ""
    on_apply = ' class="on"' if on == "apply.html" else ""
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
{FAVICON}
{META}<title>{title}</title>
<style>{STYLE}
{extra_css}</style>
</head>
<body class="cust">
<div class="main">
  <header class="topbar custbar">
    <a class="custbrand" href="index.html">
      <img src="assets/logo-mark.png" width="34" height="34" alt="GOLDEN FINANCIAL SERVICES">
      <span><b>GOLDEN FINANCIAL SERVICES</b><i>ADMINISTRATION PORTAL</i></span>
    </a>
    <nav class="custnav">
      <a href="agreement.html"{on_agr}>Loan agreement</a>
      <a href="apply.html"{on_apply}>Application form</a>
      <a href="index.html" class="custsignin">Staff sign-in</a>
    </nav>
  </header>
"""


TAIL = """</div>
</body>
</html>
"""

if __name__ == "__main__":
    out, title, css_name = sys.argv[1], sys.argv[2], sys.argv[3]
    on = sys.argv[4] if len(sys.argv) > 4 else out
    css = ROOT / css_name
    extra = css.read_text() if css.exists() else ""
    (ROOT / out).write_text(head(title, extra, on))
    print("customer header written to", out)
