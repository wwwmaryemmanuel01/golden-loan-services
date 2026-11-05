"""Shared HTML helpers for the generated module pages."""
import html

# ------------------------------------------------------------- utilities ---
def esc(v):
    return html.escape(str(v), quote=True)


def money(n):
    return "MK " + format(int(n), ",")


def pill(text, cls="b-gray"):
    return f'<span class="badge {cls}">{esc(text)}</span>'


def okb(state):
    s = str(state).lower()
    if s in ("live", "verified", "pass", "passed", "published", "connected", "healthy", "applied",
             "optimised", "set", "resolved", "active", "ok", "on"):
        return pill(state, "b-ok")
    if s in ("degraded", "review", "pending", "monitoring", "running", "draft", "warning", "warn"):
        return pill(state, "b-warn")
    if s in ("failing", "failed", "offline", "critical", "broken", "expired", "crit"):
        return pill(state, "b-crit")
    if s in ("off", "hidden", "private", "open"):
        return pill(state, "b-info")
    return pill(state)


def kv(rows, cls=""):
    body = "".join(
        f'<div class="kvrow"><span>{esc(k)}</span><b>{v if isinstance(v, str) and v.startswith("<") else esc(v)}</b></div>'
        for k, v in rows)
    return f'<div class="kvlist {cls}">{body}</div>'


def strip(items):
    cells = "".join(f'<div><div class="sl">{esc(l)}</div><div class="sv">{v}</div></div>' for l, v in items)
    return f'<div class="strip">{cells}</div>'


def table(headers, rows, csv_name=None, sort_col=0, num_cols=()):
    head = "".join(
        f'<th class="{"num" if i in num_cols else ""}" data-sort="i">{esc(h)}</th>'
        for i, h in enumerate(headers))
    body = []
    for r in rows:
        cells = "".join(
            f'<td class="{"num" if i in num_cols else ""}">{v if isinstance(v, str) and v.startswith("<") else esc(v)}</td>'
            for i, v in enumerate(r))
        body.append(f"<tr>{cells}</tr>")
    btn = (f'<button class="btn btn-ghost btn-sm" data-csv="{esc(csv_name)}">'
           f'<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">'
           f'<path d="M12 3v12M7 10l5 5 5-5M4 21h16"/></svg> CSV</button>') if csv_name else ""
    return (f'<div class="tblwrap"><table class="tbl2 dense"><thead><tr>{head}</tr></thead>'
            f'<tbody>{"".join(body)}</tbody></table></div>{btn}')


def checks(rows):
    out = []
    for state, label, detail, value in rows:
        cls = {"pass": "pass", "warn": "warn", "fail": "fail"}.get(state, "")
        icon = {"pass": "✓", "warn": "!", "fail": "✕"}.get(state, "·")
        out.append(
            f'<div class="checkrow"><span class="ck {cls}">{icon}</span>'
            f'<span class="cl"><b>{esc(label)}</b> <span class="muted">· {esc(detail)}</span></span>'
            f'<span class="cn">{esc(value)}</span></div>')
    return "".join(out)


def bars(rows, colour="#C9A227"):
    """Horizontal bar list: (label, value, max, display)."""
    out = []
    for label, value, top, shown in rows:
        pct = 0 if not top else max(2, round(value / top * 100))
        out.append(f'<div class="hbar"><div class="hbar-l">{esc(label)}</div>'
                   f'<div class="hbar-t"><i style="width:{pct}%;background:{colour}"></i></div>'
                   f'<div class="hbar-v">{esc(shown)}</div></div>')
    return "".join(out)


def svg_bars(labels, values, colour="#C9A227", height=120, unit=""):
    if not values:
        return ""
    top = max(values) or 1
    w, gap = 100.0 / len(values), 0
    bar = w * 0.62
    parts = []
    for i, v in enumerate(values):
        h = (v / top) * (height - 22)
        x = i * w + (w - bar) / 2
        y = height - 16 - h
        parts.append(f'<rect x="{x:.2f}" y="{y:.2f}" width="{bar:.2f}" height="{h:.2f}" rx="1.2" fill="{colour}"/>')
    axis = "".join(
        f'<text x="{i*w + w/2:.2f}" y="{height-4}" font-size="4.4" font-weight="600" text-anchor="middle" fill="#1F2430">{esc(l)}</text>'
        for i, l in enumerate(labels))
    return (f'<div class="chartsvg"><svg viewBox="0 0 100 {height}" preserveAspectRatio="none" '
            f'style="height:{height}px;width:100%">{axis}{"".join(parts)}</svg></div>'
            f'<div class="qhint" style="margin-top:4px">{esc(unit)}</div>')


def svg_donut(parts, size=120):
    """parts: list of (label, value, colour)."""
    total = sum(p[1] for p in parts) or 1
    r, cx, cy, stroke = 34, 50, 50, 13
    circ = 2 * 3.14159 * r
    acc, segs, legend = 0.0, [], []
    for label, value, colour in parts:
        frac = value / total
        segs.append(f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="none" stroke="{colour}" stroke-width="{stroke}" '
                    f'stroke-dasharray="{frac*circ:.2f} {circ:.2f}" stroke-dashoffset="{-acc*circ:.2f}" '
                    f'transform="rotate(-90 50 50)"/>')
        legend.append(f'<span><i style="background:{colour}"></i>{esc(label)} <b>{round(frac*100)}%</b></span>')
        acc += frac
    return (f'<div class="chartsvg"><svg viewBox="0 0 100 100" style="height:{size}px;width:{size}px;margin:0 auto">'
            f'{"".join(segs)}<text x="50" y="52" font-size="9" text-anchor="middle" fill="#0F1115" '
            f'font-weight="700">{int(total)}</text></svg></div>'
            f'<div class="legend">{"".join(legend)}</div>')


def note(text, kind="gold"):
    return f'<div class="note {kind}"><div>{text}</div></div>'


def bullets(items):
    return '<ul class="plainlist">' + "".join(f"<li>{i}</li>" for i in items) + "</ul>"


def form(fields, button, msg="", button_id=""):
    rows = ""
    for lbl, fld in fields:
        if not str(fld).lstrip().startswith("<"):
            fld = '<input value="' + esc(fld) + '" />'
        rows += '<div class="fg"><label>' + esc(lbl) + '</label>' + str(fld) + '</div>' 
    bid = f' id="{button_id}"' if button_id else ""
    return (f'<div class="form-grid">{rows}</div>'
            f'<div class="form-actions"><button class="btn btn-gold"{bid}>{esc(button)}</button></div>'
            + (f'<div class="qhint" style="margin-top:6px">{msg}</div>' if msg else ""))


def sub(num, title, body, wide=False, badge="", hint=""):
    if "<table" in body or "<svg" in body:
        wide = True
    cls = "sub wide" if wide else "sub"
    b = f'<span class="subpill">{badge}</span>' if badge else ""
    h = f'<div class="subhint">{hint}</div>' if hint else ""
    return (f'<div class="{cls}" data-sub="{num}">'
            f'<div class="subhead"><span class="subnum">{num}</span><h3>{esc(title)}</h3>{b}</div>'
            f'{h}<div class="subbody">{body}</div></div>')


def sec(n, title, blurb, inner, badge=""):
    b = f'<span class="badge b-gray">{esc(badge)}</span>' if badge else ""
    return (f'<section class="sec" id="s{n}">'
            f'<div class="sec-head"><div class="sec-num">{n}</div>'
            f'<div><h2>{esc(title)}</h2><p>{esc(blurb)}</p></div>'
            f'<div class="sec-tools">{b}</div></div>{inner}</section>')


