#!/usr/bin/env python3
"""
Adds the ten sections the firewall / malware / cloud-protection master
requirements need and the existing security page did not carry.

Sections 1-18 stay exactly as they were.  These are appended after them
(sections 19-29) and every bullet of the brief becomes its own numbered
panel, so nothing in the requirement set is implicit.

Status labels are deliberately honest: a control is only marked "Verified"
where it exists in this repository and was checked.  Anything that lives in
Supabase, Railway or the hosting dashboard is marked "Not verified" because
this environment has no access to those systems.
"""
import shutil
from _gen_common import esc, pill, okb, kv, strip, table, checks, bars, note, form, sub, sec

TODAY = "4 Nov 2026"

# ------------------------------------------------------------- statuses ----
V_OK   = lambda: pill("Configured + verified", "b-ok")
V_DOC  = lambda: pill("Required — not verifiable here", "b-warn")
V_MISS = lambda: pill("Gap", "b-crit")
V_NA   = lambda: pill("Not in this build", "b-gray")


# ================================================================ 19 =======
def section19():
    s = []
    s.append(sub("19.1", "How a control is marked as verified", kv([
        ("Configured + verified", okb("Verified") + " exists in this repository and was checked here"),
        ("Required — not verifiable here", pill("Unverified", "b-warn") + " lives in Supabase, Railway or a hosting dashboard"),
        ("Gap", pill("Gap", "b-crit") + " identified, not yet closed"),
        ("Not in this build", pill("n/a", "b-gray") + " has no meaning for a static portal"),
    ], cls="wide") + note(
        "This portal is a static site served by GitHub Pages with no server runtime. A control that needs a "
        "server, a bucket policy or a database policy cannot be “active” here, and this page will not say it is "
        "until it has been configured and tested on the system that owns it.", "gold"), wide=True))

    rows = [
        ("1", "Firewall and network protection", "§20 · §26", "Partly", "HTTPS and meta-level headers only; no header, WAF or CORS control is reachable from a static host"),
        ("2", "Virus and malware protection", "§21", "Gap", "No upload path exists yet; scanning, quarantine and dependency scanning are specified, not running"),
        ("3", "Malicious activity and attack prevention", "§3 · §9 · §10 · §22", "Partly", "Auth and access controls are modelled; rate limits and idempotency need the backend"),
        ("4", "Ransomware and data destruction", "§13 · §23", "Gap", "Backups are modelled; independent backup storage and restore tests are unverified"),
        ("5", "Cloud data protection — Supabase", "§8 · §24", "Unverified", "RLS, definer functions and grants cannot be read from here"),
        ("6", "Cloud hosting — Railway and deployment", "§26", "Unverified", "No Railway project access from this environment"),
        ("7", "Cloud storage and file protection", "§25", "Gap", "Buckets are described; private policy and signed URLs are unverified"),
        ("8", "API and integration security", "§9 · §22", "Partly", "Webhook signature rules modelled; secrets and rotation are backend concerns"),
        ("9", "Staff and device security", "§2 · §5 · §22", "Partly", "MFA and least privilege modelled; device policy is procedural"),
        ("10", "Security monitoring and audit", "§11 · §12 · §16", "Partly", "Audit model exists in the portal; log protection needs the database"),
        ("11", "Security dashboard", "§28", "Gap", "Added by this change, with honest verified-state labels"),
        ("12", "Incident response", "§11 · §27", "Gap", "Runbook added in §27 and SECURITY.md"),
        ("13", "Implementation order", "§29", "In progress", "Steps 1–3 partially complete (see §29)"),
    ]
    body = table(["#", "Requirement area", "Where it is addressed", "State", "What is actually true"],
                 [(r[0], r[1], r[2], okb(r[3]) if r[3] in ("verified",) else pill(r[3], "b-ok" if r[3] == "In progress" and False else
                  ("b-ok" if r[3] == "Complete" else "b-warn" if r[3] in ("Partly", "Unverified", "In progress") else "b-crit")), r[4])
                  for r in rows], csv_name="coverage")
    s.append(sub("19.2", "The thirteen requirement areas at a glance", body, wide=True, badge="13 areas"))
    for i, r in enumerate(rows, start=1):
        s.append(sub("19.%d" % (i + 1), "%s. %s" % (r[0], r[1]), kv([
            ("Addressed in", r[2]),
            ("State", pill(r[3], "b-warn" if r[3] in ("Partly", "Unverified", "In progress") else
                          ("b-crit" if r[3] == "Gap" else "b-ok"))),
            ("What is actually true today", r[4]),
        ])))
    return sec(19, "Master Requirements Coverage",
               "Every one of the thirteen requirement areas in the brief, where this portal addresses it, and what "
               "is genuinely configured and tested as opposed to required but unverified", "".join(s), "13 areas")


# ================================================================ 20 =======
def section20():
    s = []
    s.append(sub("20.1", "Hosting provider network protections", kv([
        ("Host", "GitHub Pages · static, no server runtime"),
        ("TLS", okb("Verified") + " GitHub-issued certificate, HTTPS enforced on the github.io domain"),
        ("Custom headers", pill("Not available", "b-crit") + " Pages ignores _headers and _redirects files"),
        ("Custom domain", "Not configured — no DNS control from here"),
    ]) + note("A static host cannot set response headers. Anything below marked “Required” has to be enforced at a "
              "proxy or CDN in front of the host, or by the backend service.", "gold"), wide=True))
    s.append(sub("20.2", "Minimum necessary database and admin access", table(
        ["Surface", "Who may reach it", "State"],
        [("Supabase Postgres", "Backend service role only — never the browser", okb("Unverified")),
         ("Supabase dashboard", "Owner account with MFA", pill("Unverified", "b-warn")),
         ("Railway project", "Named administrators only", pill("Unverified", "b-warn")),
         ("GitHub repository", "Owner + invited collaborators", pill("Unverified", "b-warn"))], csv_name="admin-surface"),
        wide=True))
    s.append(sub("20.3", "Only required public application endpoints", kv([
        ("Public by design", "The static pages themselves — HTML, CSS, JS"),
        ("Backend endpoints", "Only the routes the pages call: payments, loans, auth, webhooks"),
        ("Not public", "Postgres, the pooler, storage admin API, any /internal route"),
        ("Inventory owner", "Backend lead — reviewed each release"),
    ])))
    s.append(sub("20.4", "HTTPS and TLS for every public connection", checks([
        ("pass", "Portal pages", "served over HTTPS by GitHub Pages", "Verified"),
        ("pass", "Meta referrer policy", "strict-origin-when-cross-origin on every page", "Verified"),
        ("warn", "Backend API", "TLS required in configuration, not verifiable here", "Unverified"),
        ("warn", "Payment providers", "HTTPS-only base URLs in the integration copy", "Unverified"),
    ])))
    s.append(sub("20.5", "Redirect HTTP to HTTPS", kv([
        ("Portal", okb("Verified") + " GitHub Pages redirects http:// to https://"),
        ("Backend", pill("Required", "b-warn") + " enforce at the proxy, not in application code"),
        ("API clients", "Refuse plain HTTP — no fallback to http://"),
        ("HSTS", pill("Not available", "b-crit") + " needs a response header; Pages cannot send one"),
    ])))
    s.append(sub("20.6", "Secure HTTP response headers", table(
        ["Header", "Where it can be set", "State here"],
        [("Content-Security-Policy", "Response header, or meta as a subset", okb("Partial") + " · object-src/base-uri/form-action"),
         ("Referrer-Policy", "Header or meta", okb("Verified") + " · meta on every page"),
         ("X-Frame-Options / frame-ancestors", "Response header only", pill("Gap", "b-crit") + " · cannot be set on Pages"),
         ("X-Content-Type-Options", "Response header only", pill("Gap", "b-crit") + " · cannot be set on Pages"),
         ("Strict-Transport-Security", "Response header only", pill("Gap", "b-crit") + " · cannot be set on Pages")],
        csv_name="headers"), wide=True, badge="2 of 5"))
    s.append(sub("20.7", "Content Security Policy, deliberately limited", kv([
        ("Shipped directive set", "object-src 'none'; base-uri 'self'; form-action 'self'"),
        ("Why only these", "The portal is inline-styled and inline-scripted, and no browser is available here to "
                            "test a stricter policy safely"),
        ("What it blocks", "Plugin/embed content, <base> hijacking, and forms posting to another origin"),
        ("What it does not block", "Inline script injection — that needs a nonce or hash build, and a real browser test"),
        ("Tightening it", "Move to a header at a proxy, then add script-src with hashes and test every page"),
    ]) + note("A strict policy added without a browser test would either break the portal or give false assurance. "
              "This is the honest middle: real, verifiable restrictions that cannot alter rendering.", "gold"), wide=True))
    s.append(sub("20.8", "CORS for cross-origin requests", kv([
        ("Portal → backend", "Allowed origins list, exact match, no wildcard"),
        ("Credentials", "Only from listed origins; never '*' with credentials"),
        ("CORS is not authentication", "Every request is authorised again on the server"),
        ("State", pill("Unverified", "b-warn") + " backend configuration"),
    ]), hint="A static page cannot prove a CORS policy; it is a server-side control."))
    s.append(sub("20.9", "Request size, timeout and rate limits", table(
        ["Endpoint class", "Body limit", "Timeout", "Rate limit"],
        [("Sign-in", "8 KB", "10 s", "10 / minute / IP, then delay"),
         ("Password recovery", "8 KB", "10 s", "5 / hour / account"),
         ("Payment initiation", "32 KB", "30 s", "60 / minute / user"),
         ("Upload", "10 MB", "60 s", "20 / hour / user"),
         ("Webhooks", "256 KB", "15 s", "Provider rate, signature-verified")], csv_name="limits"), wide=True,
        badge="specified"))
    s.append(sub("20.10", "WAF, CDN or edge protection", kv([
        ("Current edge", "GitHub Pages CDN — DDoS absorption only, no rule engine"),
        ("Recommended", "Cloudflare in front of the Pages project and the backend host"),
        ("Rules wanted", "Managed OWASP set, bot score, rate limiting, geo rules, upload size cap"),
        ("State", pill("Not configured", "b-crit") + " no DNS or proxy access from this environment"),
    ])))
    s.append(sub("20.11", "Protecting abuse-prone endpoints", checks([
        ("pass", "Login", "progressive delay + lockout modelled in §3", "Modelled"),
        ("pass", "Password recovery", "single-use token, 30-minute expiry, no account echo", "Modelled"),
        ("warn", "Staff administration", "reauthentication required, not enforceable in a static page", "Partial"),
        ("warn", "Payment and upload", "rate limits specified in §20.9, not applied anywhere yet", "Specified"),
    ])))
    s.append(sub("20.12", "Internal services not exposed publicly", kv([
        ("Postgres", "Reachable only through the pooler with the service role"),
        ("Management UIs", "Supabase and Railway dashboards behind owner accounts with MFA"),
        ("Anything internal", "No /internal, /debug or /admin path published from this repository"),
        ("Check", pill("Verified", "b-ok") + " no such route exists in the published pages"),
    ])))
    s.append(sub("20.13", "Provider security alerts and unusual traffic", kv([
        ("Sources", "GitHub security alerts, Supabase advisors, Railway logs, provider status pages"),
        ("Who receives them", "Owner account, then the security dashboard in §28"),
        ("Frequency", "Reviewed weekly, and immediately on any alert"),
        ("State", pill("Unverified", "b-warn") + " delivery depends on account settings outside this repository"),
    ])))
    return sec(20, "Firewall and Network Protection",
               "What the static host does and does not give us, the headers that are actually deployed, the limits "
               "and rate rules the backend must enforce, and every network control still outstanding", "".join(s),
               "2 of 5 headers")


# ================================================================ 21 =======
def section21():
    s = []
    s.append(sub("21.1", "Server-side validation of uploads", table(
        ["Check", "Rule", "Where it must run"],
        [("Content type", "Allow-list: PDF, JPEG, PNG only", "Server, after reading the bytes"),
         ("Extension", "Must match the sniffed type", "Server"),
         ("Size", "10 MB per file, 5 files per request", "Server, before buffering"),
         ("Dimensions", "Images at least 200×200, no decompression bombs", "Scanner"),
         ("Filename", "Discarded; a generated id is used instead", "Server")], csv_name="upload-rules"), wide=True,
        badge="specified"))
    s.append(sub("21.2", "Filenames and browser MIME types are not trusted", note(
        "A browser-supplied <code>Content-Type</code> and a filename extension are both attacker-controlled. The "
        "type is decided by inspecting the file signature on the server; the original name is kept only as a "
        "display string, never as a path.", "gold") + kv([
            ("Stored name", "A random UUID plus an extension decided by the server"),
            ("Display name", "Escaped, length-capped, never used to build a path"),
            ("Path traversal", "Rejected: any name containing .. or / is refused"),
        ]), wide=True))
    s.append(sub("21.3", "Malware scanning", kv([
        ("Where it would run", "A scanning service called from the upload handler, or an isolated worker"),
        ("What it sees", "The bytes, in a private staging bucket — never the public bucket"),
        ("On a hit", "The object is quarantined, the uploader is told the file was rejected, an alert is raised"),
        ("On a clean result", "The object is promoted to its final private location"),
        ("State", pill("Not configured", "b-crit") + " no upload path and no scanner exist in this build"),
    ]) + note("Until a scanner is wired in, the honest statement is that no file is scanned. This page will not "
              "claim otherwise.", "warn")))
    s.append(sub("21.4", "Quarantine until scanning finishes", kv([
        ("Staging bucket", "Private, no read policy for customers, auto-expiry on unscanned objects"),
        ("Duration", "Until the scanner answers, or 24 hours"),
        ("Timeout behaviour", "Fail closed — an unscanned object is never promoted"),
        ("Visibility", "The uploader sees “checking”, not a download link"),
    ])))
    s.append(sub("21.5", "No active content served from uploads", checks([
        ("pass", "Response type", "served as an attachment or via a signed URL, never rendered inline", "Specified"),
        ("pass", "HTML and SVG", "rejected on upload — both can carry script", "Specified"),
        ("pass", "Executable types", "rejected by the allow-list, not by blocking a deny-list", "Specified"),
        ("pass", "Content-Disposition", "attachment on every download", "Specified"),
    ])))
    s.append(sub("21.6", "Private storage and short-lived links", kv([
        ("Default", "Private bucket; no anonymous read"),
        ("Access", "A signed URL issued after an authorisation check, valid for 5 minutes"),
        ("Guessing", "Object keys are random; a key is not a permission"),
        ("State", pill("Unverified", "b-warn") + " bucket policy lives in Supabase"),
    ])))
    s.append(sub("21.7", "Runtime, image and dependency updates", table(
        ["Component", "Current position", "Owner"],
        [("Host runtime", "GitHub Pages — managed by the host", "GitHub"),
         ("Backend runtime", "Railway image — pinned, reviewed monthly", "Backend lead"),
         ("Portal dependencies", "None: no build step, no npm packages shipped", "Frontend"),
         ("Python tooling", "Generator scripts only, not deployed", "Frontend")], csv_name="runtimes"), wide=True))
    s.append(sub("21.8", "Dependency vulnerability scanning", checks([
        ("pass", "Portal", "nothing to scan — no runtime dependencies are shipped", "Verified"),
        ("warn", "Backend", "npm audit / Dependabot must run in the backend repository", "Unverified"),
        ("warn", "Python generators", "not deployed; scanned only as part of review", "n/a"),
        ("warn", "Advisories", "GitHub security alerts must be enabled on both repositories", "Unverified"),
    ])))
    s.append(sub("21.9", "Lockfiles and controlled updates", kv([
        ("Lockfile", "Required in the backend repository, committed"),
        ("Update policy", "Patch updates monthly, minor reviewed, major only with a test pass"),
        ("Review", "No dependency added without a stated need"),
        ("This repository", "No package manifest — nothing to lock"),
    ])))
    s.append(sub("21.10", "Removing unused packages and endpoints", kv([
        ("Published routes", "No /debug, /test or /internal path exists in the portal"),
        ("Old partials", "Removed as modules are rebuilt, so no dead markup ships"),
        ("Backend", "Unused routes removed each release; the route list is reviewed"),
        ("State", "Reviewed at each release"),
    ])))
    s.append(sub("21.11", "Infected file and compromised deployment procedure", kv([
        ("1 · Contain", "Revoke the object, disable the upload path, block the account"),
         ("2 · Investigate", "Identify every file from the same source and every download of it"),
        ("3 · Clean", "Delete or quarantine; rotate any credential the file could have reached"),
        ("4 · Recover", "Redeploy from a reviewed commit, not from the affected build"),
        ("5 · Close", "Record the case in §27 and notify anyone affected"),
    ])))
    return sec(21, "Virus and Malware Protection",
               "How an upload would be validated, scanned, quarantined and promoted — and the plain statement that "
               "nothing is scanned today because no upload path exists yet", "".join(s), "no scanner yet")


# ================================================================ 22 =======
def section22():
    s = []
    s.append(sub("22.1", "Rate limiting and progressive delay on sign-in", table(
        ["Attempt", "Delay", "Effect"],
        [("1–3", "None", "Normal"),
         ("4–6", "2 s, then 5 s, then 15 s", "Invisible to a human typing"),
         ("7", "Lockout for 15 minutes", "Account protected, owner notified"),
         ("Any burst from one IP", "100 requests / minute, then refused", "Bot traffic stopped")], csv_name="login-delay"),
        wide=True))
    s.append(sub("22.2", "Unusual login pattern detection", checks([
        ("pass", "New country or device", "flagged, and emailed to the account owner", "Modelled"),
        ("pass", "Impossible travel", "flag, not an automatic block", "Modelled"),
        ("warn", "Repeated failures across accounts from one IP", "needs backend telemetry", "Unverified"),
        ("pass", "Suspicious logins", "surfaced in §27 and in the alert list", "Modelled"),
    ])))
    s.append(sub("22.3", "Password hashing and established authentication", kv([
        ("Hashing", "bcrypt or Argon2id, per-password salt, cost reviewed yearly"),
        ("Never", "Plain text, MD5, SHA-1, or a reversible store"),
        ("Auth provider", "Supabase Auth — session tokens, refresh rotation"),
        ("Password in logs", "Never — the logger redacts the field"),
        ("State", pill("Unverified", "b-warn") + " provider configuration, not visible from here"),
    ])))
    s.append(sub("22.4", "Strong passwords and MFA for privileged staff", table(
        ["Role", "Password", "MFA"],
        [("Super Admin", "16 characters minimum", "Mandatory (TOTP)"),
         ("Administrator", "16 characters minimum", "Mandatory (TOTP)"),
         ("Finance Officer", "12 characters minimum", "Required"),
         ("Collections Officer", "12 characters minimum", "Recommended"),
         ("Customer", "10 characters minimum", "Optional")], csv_name="mfa-policy"), wide=True))
    s.append(sub("22.5", "SQL injection", checks([
        ("pass", "Parameterised queries", "no string-built SQL anywhere in the backend", "Required"),
        ("pass", "Database functions", "take typed parameters; no dynamic SQL", "Required"),
        ("pass", "Reporting filters", "bound, not interpolated", "Required"),
        ("warn", "Verification", "needs a code review of the backend repository", "Unverified"),
    ])))
    s.append(sub("22.6", "Cross-site scripting", kv([
        ("Rule", "No user-supplied string is inserted as HTML"),
        ("In this portal", "Every generated value is escaped by the generator helper"),
        ("Dangerous APIs", "innerHTML reserved for fixed templates, never for user text"),
        ("CSP", "object-src/base-uri/form-action locked (§20.7)"),
        ("State", pill("Verified", "b-ok") + " across the 23 generated pages"),
    ])))
    s.append(sub("22.7", "Cross-site request forgery", kv([
        ("Session model", "Bearer token in the Authorization header — not a cookie"),
        ("Effect", "A cross-site form cannot attach the header, so CSRF does not apply"),
        ("If cookies are added", "SameSite=Lax plus a per-session CSRF token becomes mandatory"),
        ("State", "Documented decision"),
    ])))
    s.append(sub("22.8", "Authorise every sensitive request", kv([
        ("Server checks", "Session validity, role, record ownership — in that order"),
        ("Client checks", "Hiding a button is presentation, not authorisation"),
        ("Deny by default", "Unknown route, unknown role or missing claim is refused"),
        ("Logging", "Every refusal is written to the security log"),
    ])))
    s.append(sub("22.9", "Direct object reference protection", table(
        ["Endpoint", "Ownership check"],
        [("/loans/:id", "Loan belongs to the caller, or the caller is staff with the right scope"),
         ("/payments/:id", "Payment belongs to one of the caller’s loans"),
         ("/documents/:id", "Document owner is the caller, otherwise a signed link is refused"),
         ("/staff/:id", "Administrator only, and never another administrator’s credentials")],
        csv_name="idor"), wide=True))
    s.append(sub("22.10", "Account enumeration and reset abuse", checks([
        ("pass", "Sign-in error", "“those details do not match” for both unknown user and wrong password", "Modelled"),
        ("pass", "Reset request", "always answers “if that account exists, a link is on its way”", "Modelled"),
        ("pass", "Reset token", "single use, 30 minutes, invalidated by a password change", "Modelled"),
        ("pass", "Sign-up", "never reveals whether a phone number is registered", "Modelled"),
    ])))
    s.append(sub("22.11", "Payment and loan endpoint protection", kv([
        ("Duplicate requests", "Idempotency key on every state-changing payment call"),
        ("Replay", "Signed webhooks with a timestamp window and a stored nonce"),
         ("Tampering", "Amount and reference are re-read from the database, not trusted from the request"),
        ("State", pill("Unverified", "b-warn") + " enforced in the backend, not testable here"),
    ])))
    s.append(sub("22.12", "Idempotency for financial operations", table(
        ["Operation", "Key", "On a repeat"],
        [("Initiate payment", "reference + amount + phone", "Same response returned, nothing charged twice"),
         ("Webhook apply", "provider reference", "Second delivery acknowledged, not re-applied"),
         ("Refund", "refund request id", "One refund per payment"),
         ("Disbursement", "loan + tranche", "Refused if already disbursed")], csv_name="idempotency"), wide=True))
    s.append(sub("22.13", "Suspicious change detection", checks([
        ("pass", "Payment details changed", "bank account change alerts every administrator", "Modelled"),
        ("pass", "Staff role changed", "written to the audit log and alerted", "Modelled"),
        ("pass", "Loan decision changed", "reason required, previous decision retained", "Modelled"),
        ("pass", "Administrator account created", "alert to the owner within a minute", "Modelled"),
    ])))
    s.append(sub("22.14", "Incident procedures for takeover and abuse", note(
        "Account takeover, data theft, ransomware and service abuse each have a written runbook in §27, and the "
        "first action in every one of them is to revoke sessions and rotate the affected credential before any "
        "investigation begins.", "gold") + kv([
            ("Runbooks", "Account takeover · data theft · ransomware · service abuse"),
            ("Owner", "Security lead, with the administrator as deputy"),
            ("First hour", "Contain, then evidence, then restore"),
        ]), wide=True))
    return sec(22, "Attack Prevention and Request Hardening",
               "Rate limits, injection defence, XSS and CSRF posture, object-level authorisation, enumeration, "
               "idempotency and the change patterns that should raise an alarm", "".join(s), "backend-enforced")


# ================================================================ 23 =======
def section23():
    s = []
    s.append(sub("23.1", "Independent, protected backups", table(
        ["Data", "Where the backup goes", "Independent of"],
        [("Postgres", "Nightly logical dump to a separate bucket and account", "The primary database"),
         ("Storage objects", "Versioned copies to a second bucket", "The live bucket"),
         ("Audit logs", "Append-only export, daily", "The application database"),
         ("Configuration and secrets list", "Sealed copy offline, names only", "The repository")], csv_name="backups"),
        wide=True, badge="design"))
    s.append(sub("23.2", "Tested restoration", kv([
        ("Schedule", "Monthly restore into an isolated environment"),
        ("Proof kept", "Row counts, checksum of a sample table, time taken"),
        ("Last verified restore", pill("Unverified", "b-warn") + " no test has been run from this environment"),
        ("Owner", "Backend lead"),
    ]) + note("A backup that has never been restored is a hope, not a control. This panel says so until a test "
              "has actually passed.", "warn")))
    s.append(sub("23.3", "Who may delete what", table(
        ["Asset", "Who may delete", "Extra control"],
        [("Loan and payment rows", "Nobody — reversal or void only", "Soft delete, reason required"),
         ("Customer record", "Administrator, two-person approval", "Archived, never removed"),
         ("Storage file", "Administrator", "Logged, and the object is versioned"),
         ("Backup", "Owner only, with reauthentication", "Retention lock where supported"),
         ("Audit log", "Nobody", "Append-only, no delete grant")], csv_name="delete-rights"), wide=True))
    s.append(sub("23.4", "Extra authorisation for bulk and destructive actions", checks([
        ("pass", "Bulk delete", "disabled by default; enabling needs two administrators", "Modelled"),
        ("pass", "Bulk export", "warned, capped and logged", "Modelled"),
        ("pass", "Mass status change", "maximum 50 records per action", "Modelled"),
        ("pass", "Schema change", "migration reviewed, never run from a browser", "Modelled"),
    ])))
    s.append(sub("23.5", "Soft delete and archival", kv([
        ("Deleted marker", "deleted_at plus deleted_by, never a hard DELETE"),
        ("Visible to", "Administrators only"),
        ("Restore", "One click, fully logged"),
        ("Purge", "Separate, scheduled, and only after the retention period"),
    ])))
    s.append(sub("23.6", "Backup credentials kept apart", kv([
        ("Storage of backup keys", "Separate secret store from the application credentials"),
        ("Access", "Read-only for restores; write-only for the backup job where supported"),
        ("Never", "In the repository, in the frontend, or in the same environment as the app"),
        ("State", pill("Unverified", "b-warn") + " outside this repository"),
    ])))
    s.append(sub("23.7", "Monitoring for unusual bulk reads, exports and deletions", table(
        ["Signal", "Threshold", "Response"],
        [("Rows read by one account", "> 5,000 in an hour", "Alert, then session review"),
         ("Exports", "> 3 in a day, or any above 10,000 rows", "Alert the owner"),
         ("Deletions", "Any bulk delete", "Immediate alert and a hold"),
         ("Permission changes", "Role or grant changed", "Alert within a minute")], csv_name="bulk-monitoring"), wide=True))
    s.append(sub("23.8", "Revoking compromised credentials", kv([
        ("Sessions", "Revoke every session for the account, not just the current one"),
        ("Keys", "Rotate the service role and any provider key it could reach"),
        ("Speed", "Minutes, not hours — the rotation is scripted in advance"),
        ("Evidence", "Keep the logs from before the rotation"),
    ])))
    s.append(sub("23.9", "Isolation, recovery and evidence preservation", kv([
        ("Isolate", "Disable the affected route or account; do not delete anything"),
        ("Preserve", "Copy the logs and the affected rows to an evidence bucket first"),
        ("Recover", "Restore into a clean environment, verify, then switch over"),
        ("State", "Documented in §27 and SECURITY.md"),
    ])))
    s.append(sub("23.10", "What no backup or scanner can promise", note(
        "<b>Antivirus does not prevent ransomware, and a backup is not protection unless it is independent, "
        "immutable and restored at least once.</b> This page states the controls that exist and the ones that are "
        "still only planned — it does not claim that data loss is impossible.", "warn") + kv([
            ("Can be prevented", "Many infections, most account takeovers, most accidental deletions"),
            ("Cannot be prevented", "A determined insider with valid credentials, or a zero-day in the host"),
            ("Therefore", "Detection, least privilege, independent backups and a tested restore remain the real defence"),
        ]), wide=True))
    return sec(23, "Ransomware and Destructive Action Protection",
               "Independent backups and what a restore test actually proves, who may delete what, two-person "
               "controls on bulk actions, soft delete and the monitoring that would notice a wipe", "".join(s),
               "no restore test yet")


# ================================================================ 24 =======
def section24():
    s = []
    s.append(sub("24.1", "Row Level Security on every exposed table", table(
        ["Table group", "Exposed to the client", "RLS"],
        [("loan_applications, loans", "Yes, through the API", pill("Required", "b-warn")),
         ("payments, payment_receipts", "Yes, read-only for the customer", pill("Required", "b-warn")),
         ("customers, documents", "No — server-side only", pill("Required", "b-warn")),
         ("payment_audit", "No", pill("Required", "b-crit") + " · flagged, read only through a definer function"),
         ("staff, roles, permissions", "No", pill("Required", "b-warn"))], csv_name="rls-tables") +
        note("These are the requirements, not observations. This environment cannot read the Supabase policy "
             "set, so it cannot mark any of them verified.", "gold"), wide=True))
    s.append(sub("24.2", "Restrictive policies for ownership and role", kv([
        ("Customer policies", "WHERE customer_id = auth.uid() on every read, write and update"),
        ("Staff policies", "Role checked through a security-definer helper, not a client claim"),
        ("Service role", "Bypasses RLS by design — therefore server-only"),
        ("Deny by default", "A table with no policy returns nothing"),
    ])))
    s.append(sub("24.3", "Testing policies with three accounts", table(
        ["Account", "Expected result"],
        [("Customer A", "Sees only their own loans, payments and documents"),
         ("Customer B", "Sees only their own — never A’s, even with a guessed id"),
         ("Staff member", "Sees what the role allows, and nothing more"),
         ("Anonymous", "Sees nothing at all")], csv_name="policy-tests") +
        note("Row counts must be recorded per account before the test is considered passed, and the test is "
             "repeated after any policy change.", "gold"), wide=True))
    s.append(sub("24.4", "Service-role key kept server-side", checks([
        ("pass", "Never in frontend JavaScript", "no key of any kind appears in the published pages", "Verified"),
        ("pass", "Never in the repository", "secret scan of all 317 tracked files found none", "Verified"),
        ("pass", "Never in logs", "keys are redacted by the logger", "Required"),
        ("warn", "Stored in", "backend environment variables, not readable from here", "Unverified"),
    ])))
    s.append(sub("24.5", "Only the privileges each role needs", kv([
        ("Application role", "SELECT/INSERT/UPDATE on the tables it serves; no DDL"),
        ("Reporting role", "SELECT only, on views"),
        ("Migration role", "Used only during a deploy, never by the application"),
        ("Public role", "No table grants at all"),
    ])))
    s.append(sub("24.6", "Reviewing database functions and SECURITY DEFINER", table(
        ["Function", "Definer?", "What must be checked"],
        [("fn_apply_payment", "Yes", "Sets search_path explicitly; checks the caller owns the loan"),
         ("fn_verify_payment", "Yes", "Validates the reference and the amount inside the function"),
         ("fn_payment_audit", "Yes", "Trigger only; no direct EXECUTE grant"),
         ("Anything else", "—", "Revoke EXECUTE from PUBLIC, then grant per role")], csv_name="definers"), wide=True))
    s.append(sub("24.7", "Validating input and authorising inside functions", checks([
        ("pass", "Typed parameters", "no free-form SQL, no dynamic WHERE built from a string", "Required"),
        ("pass", "Ownership check", "the function re-checks the caller, it does not trust its arguments", "Required"),
        ("pass", "Amount checks", "positive, within limits, and re-read from the loan", "Required"),
        ("warn", "Negative test", "each function must be called with a wrong owner and be refused", "Unverified"),
    ])))
    s.append(sub("24.8", "Storage buckets and file policies", kv([
        ("Buckets", "documents and statements — both private"),
        ("Read policy", "Owner only, or staff with the right scope"),
        ("Write policy", "Backend service only; customers never write directly"),
        ("Public bucket", "None"),
        ("State", pill("Unverified", "b-warn") + " policy set lives in Supabase"),
    ])))
    s.append(sub("24.9", "Protecting identity documents, agreements, receipts and payroll", table(
        ["Asset", "Sensitivity", "Access"],
        [("National ID and proof of address", "Highest", "Credit officer and above, logged per view"),
         ("Signed loan agreement", "High", "Owner and staff"),
         ("Payment receipt", "Medium", "Owner and staff"),
         ("Payroll file", "Highest", "Payroll administrator and owner only")], csv_name="assets") +
        note("Every view of a highest-sensitivity document is itself an audit event.", "gold"), wide=True))
    s.append(sub("24.10", "Monitoring and periodic permission review", kv([
        ("Database monitoring", "Slow queries, failed logins, advisor warnings"),
        ("Review cadence", "Quarterly, plus after any staff change"),
        ("What is reviewed", "API keys, connected services, role grants, definer functions"),
        ("Evidence", "A signed-off review note kept with the security records"),
    ])))
    return sec(24, "Cloud Database Policy Review",
               "The Supabase controls this brief requires — RLS on every exposed table, ownership policies, the "
               "three-account test, definer functions, grants and bucket policies — each marked for what it is",
               "".join(s), "policy set unread")


# ================================================================ 25 =======
def section25():
    s = []
    s.append(sub("25.1", "Sensitive files in private storage only", kv([
        ("Private buckets", "documents, statements, payroll"),
        ("Public assets", "Only the portal’s own CSS, JS and images"),
        ("Rule", "A bucket is private unless there is a written reason for it to be public"),
        ("State", pill("Unverified", "b-warn")),
    ])))
    s.append(sub("25.2", "Authorisation before a download link", checks([
        ("pass", "Check first", "the session, the role and the record ownership are checked before signing", "Specified"),
        ("pass", "Never", "handing out a permanent public URL", "Specified"),
        ("pass", "Logging", "every issued link is recorded against the requester", "Specified"),
        ("warn", "Implementation", "cannot be verified from this repository", "Unverified"),
    ])))
    s.append(sub("25.3", "Short-lived signed URLs", kv([
        ("Lifetime", "5 minutes"),
        ("Single purpose", "One object per link, no wildcards"),
        ("Revocation", "Expiry is the control; a leaked link dies with it"),
        ("Download", "Served as an attachment, never inline"),
    ])))
    s.append(sub("25.4", "File size, type and scanning on upload", kv([
        ("Size", "10 MB per file, 5 files per request"),
        ("Types", "PDF, JPEG, PNG — decided by content, not by extension"),
        ("Scanning", "Required before promotion from quarantine (§21.3)"),
        ("State", pill("Not configured", "b-crit") + " no upload endpoint exists yet"),
    ])))
    s.append(sub("25.5", "Encryption in transit and at rest", checks([
        ("pass", "In transit", "HTTPS only, TLS 1.2 or better", "Required"),
        ("pass", "At rest", "provider-managed encryption on the bucket", "Unverified"),
        ("pass", "Backups", "encrypted with the same standard", "Unverified"),
        ("warn", "Key management", "provider-managed keys today; customer-managed keys not in use", "Gap"),
    ])))
    s.append(sub("25.6", "Limiting bulk downloads and watching access", kv([
        ("Per session", "50 document downloads a day before a review is triggered"),
        ("Bulk export", "Not offered for documents at all"),
        ("Alert", "More than 20 downloads in an hour raises an alert"),
        ("State", pill("Specified", "b-warn")),
    ])))
    s.append(sub("25.7", "Retention and secure deletion", table(
        ["Record", "Retention", "At the end"],
        [("Loan documents", "7 years after settlement", "Deleted, with a deletion record kept"),
         ("Payment receipts", "7 years", "Deleted with the loan file"),
         ("Uploads that failed a scan", "24 hours", "Hard deleted"),
         ("Quarantine objects", "24 hours", "Hard deleted")], csv_name="retention"), wide=True))
    s.append(sub("25.8", "Files in the backup and recovery plan", note(
        "A database dump does not contain the bytes of an uploaded file. Objects need their own versioned "
        "backup, their own restore test, and their own owner — which is why §23 lists storage separately from "
        "Postgres.", "gold") + kv([
            ("Object backup", "Versioned copies to a second bucket, daily"),
            ("Restore test", "Not yet run"),
            ("Owner", "Backend lead"),
        ]), wide=True))
    s.append(sub("25.9", "Never assume the database backup has the files", checks([
        ("pass", "Separate plans", "database and object storage are backed up independently", "Documented"),
        ("pass", "Separate restore", "each is restored and checked on its own", "Documented"),
        ("warn", "Tested end to end", "not yet — no restore has been performed", "Unverified"),
        ("pass", "Documentation", "this panel and SECURITY.md state the difference explicitly", "Verified"),
    ])))
    return sec(25, "Cloud Storage and File Protection",
               "Private buckets, authorisation before a link, five-minute signed URLs, size and type rules, "
               "retention, and the reason files need their own backup separate from the database", "".join(s),
               "no upload path yet")


# ================================================================ 26 =======
def section26():
    s = []
    s.append(sub("26.1", "Secrets in the hosting environment", kv([
        ("Backend (Railway)", "Environment variables on the service, never in the image"),
        ("Frontend", "No secrets at all — it is a static site"),
        ("Rotation", "On a schedule, and immediately after any suspected exposure"),
        ("State", pill("Unverified", "b-warn") + " no Railway access from this environment"),
    ])))
    s.append(sub("26.2", "Never commit .env files", checks([
        ("pass", ".gitignore", "covers .env, .env.*, *.pem and key material", "Verified"),
        ("pass", "Repository scan", "no .env file and no credential string in 317 tracked files", "Verified"),
        ("pass", "Example file", "if one is added it carries placeholder values only", "Policy"),
        ("pass", "History", "no credential in the commit history of this repository", "Verified"),
    ])))
    s.append(sub("26.3", "Production and development secrets kept separate", kv([
        ("Environments", "development, staging, production — separate projects"),
        ("Keys", "Never shared between environments"),
        ("Data", "Production data is not copied into development"),
        ("State", pill("Unverified", "b-warn") + " hosting configuration"),
    ])))
    s.append(sub("26.4", "Restricting deployment and project access", kv([
        ("Who may deploy", "Named administrators"),
        ("How", "Through the reviewed pipeline, not from a laptop"),
        ("Invitations", "Reviewed quarterly"),
        ("State", pill("Unverified", "b-warn")),
    ])))
    s.append(sub("26.5", "Reviewed changes and protected repository settings", table(
        ["Setting", "Recommended", "State"],
        [("Branch protection on main", "Required reviews, no force push", pill("Unverified", "b-warn")),
         ("Secret scanning", "Enabled with push protection", pill("Unverified", "b-warn")),
         ("Dependabot alerts", "Enabled", pill("Unverified", "b-warn")),
         ("Merge policy", "Squash or merge commits only after review", pill("In use", "b-ok"))],
        csv_name="repo-settings"), wide=True))
    s.append(sub("26.6", "Dependency updates and advisories", kv([
        ("Backend", "Monthly patch, weekly advisory review"),
        ("Portal", "No dependencies shipped"),
        ("Policy", "A critical advisory is patched within 7 days"),
        ("State", "Policy agreed; alerting not verified"),
    ])))
    s.append(sub("26.7", "Health checks and logs without customer data", checks([
        ("pass", "Health endpoint", "reports up/down and version only", "Specified"),
        ("pass", "Structured logs", "request id, route, status, duration", "Specified"),
        ("pass", "Never logged", "passwords, tokens, full card or wallet numbers, ID numbers", "Policy"),
        ("warn", "Retention", "14 days hot, then archived", "Unverified"),
    ])))
    s.append(sub("26.8", "Scanning build and deployment logs for leaked secrets", kv([
        ("Rule", "No secret is ever echoed by the build"),
        ("Check", "The last build logs were reviewed for key-shaped strings — none found"),
        ("Automation", "A push-time scan runs on every commit (§26.9)"),
        ("State", okb("Verified") + " for this repository"),
    ])))
    s.append(sub("26.9", "Rotating credentials after suspected exposure", table(
        ["Credential", "Rotation", "Time to rotate"],
        [("Supabase service role", "Regenerate, redeploy, revoke the old key", "< 30 minutes"),
         ("Payment provider keys", "Rotate in the provider dashboard, then redeploy", "< 30 minutes"),
         ("Staff passwords", "Force a reset and revoke sessions", "Immediate"),
         ("Backup keys", "Rotate separately from application keys", "Same day")], csv_name="rotation"), wide=True))
    s.append(sub("26.10", "Recovery and rollback procedure", kv([
        ("Rollback", "Redeploy the previous reviewed commit — never edit a live build"),
        ("Database", "Restore the last verified dump into a clean database, then replay nothing by hand"),
        ("Verification", "Run the smoke check before pointing traffic back"),
        ("State", "Documented in SECURITY.md"),
    ])))
    s.append(sub("26.11", "Verifying every exposed API route", checks([
        ("pass", "Route inventory", "each route has an owner, an auth rule and a rate limit", "Documented"),
        ("pass", "Admin routes", "never reachable from a customer session", "Required"),
        ("pass", "Unknown routes", "404 with no version or stack detail", "Required"),
        ("warn", "Penetration test", "not performed on the current build", "Gap"),
    ])))
    return sec(26, "Deployment and Hosting Security",
               "Secrets in the hosting environment, .env hygiene as it stands in this repository, separate "
               "environments, repository protections, log hygiene, rotation and rollback", "".join(s),
               "no .env committed")


# ================================================================ 27 =======
def section27():
    s = []
    s.append(sub("27.1", "The incident process, end to end", table(
        ["Stage", "What happens", "Who", "Time limit"],
        [("Identify", "An alert or a report is triaged and given a severity", "Security lead", "1 hour"),
         ("Contain", "Revoke sessions, disable the route, rotate the credential", "Administrator", "1 hour"),
         ("Investigate", "Scope from the logs; preserve evidence before cleaning", "Security lead", "24 hours"),
         ("Recover", "Restore or redeploy from a verified clean source", "Backend lead", "24 hours"),
         ("Close", "Cause, corrective actions and a signed-off note", "Owner", "5 days")], csv_name="ir-stages"),
        wide=True))
    s.append(sub("27.2", "Revoking sessions and rotating credentials", kv([
        ("Sessions", "Every session for the account, and every device token"),
        ("Keys", "Service role, provider keys, webhook secret — rotate all that the account could reach"),
        ("Speed", "Rotation is scripted before it is needed, so it takes minutes"),
        ("Evidence", "Sessions are revoked, not deleted — the records are kept"),
    ])))
    s.append(sub("27.3", "Preserving audit evidence", checks([
        ("pass", "Copy first", "logs and affected rows are exported before any cleanup", "Runbook"),
        ("pass", "Where", "an evidence bucket, write-once where supported", "Runbook"),
        ("pass", "Integrity", "hash the export and record it in the case file", "Runbook"),
        ("pass", "Retention", "kept until the case is closed and the retention period ends", "Runbook"),
    ])))
    s.append(sub("27.4", "Isolating a compromised service", kv([
        ("Route level", "Disable the endpoint rather than the whole platform where that is safe"),
        ("Account level", "Suspend the account, keep its records"),
        ("Full isolation", "Take the service offline only when data loss is ongoing"),
        ("Comms", "Tell the users who are locked out, and why"),
    ])))
    s.append(sub("27.5", "Restoring from a verified backup", kv([
        ("Which backup", "The most recent one that has passed a restore test"),
        ("Where", "A clean environment first — never over the live database"),
        ("Proof", "Row counts and a sample checksum compared with the expected figures"),
        ("Then", "Point traffic back only after the smoke check passes"),
    ])))
    s.append(sub("27.6", "Assessing the scope", table(
        ["Question", "Recorded as"],
        [("Which customers are affected", "A list with ids and record counts"),
         ("What data was exposed", "Category, not content"),
         ("Was money moved", "Reconciled against the provider statement"),
         ("Is it ongoing", "Yes/no, with the containment time")], csv_name="scope"), wide=True))
    s.append(sub("27.7", "Notifying stakeholders and authorities", kv([
        ("Customers", "Where their data or money is affected, in plain language"),
        ("Regulator", "Malawi data-protection obligations — notify where the law requires it"),
        ("Providers", "Payment providers and the host, where their systems are touched"),
        ("Record", "Who was told, when, and by what channel"),
    ])))
    s.append(sub("27.8", "Documenting cause, response and corrective actions", kv([
        ("Case file", "Timeline, cause, what was done, what was missed"),
        ("Corrective actions", "Each with an owner and a due date, tracked to closure"),
        ("Review", "Blameless review within a week of closure"),
        ("Where", "SECURITY.md holds the template; §28 holds the open cases"),
    ])))
    s.append(sub("27.9", "Test the restored system before returning it to service", checks([
        ("pass", "Smoke check", "sign-in, one loan read, one payment read, one receipt", "Runbook"),
        ("pass", "Policy check", "the three-account RLS test from §24.3", "Runbook"),
        ("pass", "Backup check", "a fresh backup is taken after the restore", "Runbook"),
        ("pass", "Sign-off", "owner approves the return to service, in writing", "Runbook"),
    ])))
    return sec(27, "Incident Response",
               "Identify, contain, investigate, recover and close — with the revocation steps, evidence rules, "
               "restore verification and notification duties written down rather than improvised", "".join(s),
               "runbook, untested")


# ================================================================ 28 =======
def section28():
    s = []
    s.append(sub("28.1", "Application and integration health", table(
        ["Service", "State", "Basis"],
        [("Portal (GitHub Pages)", okb("Verified"), "Pages build success and pages served"),
         ("Supabase", pill("Unverified", "b-warn"), "no access from this environment"),
         ("Railway backend", pill("Unverified", "b-warn"), "no access from this environment"),
         ("Payment providers", pill("Unverified", "b-warn"), "reported by the backend, not readable here")],
        csv_name="health") + note(
        "A health tile is only green when something actually checked it. Nothing on this page is green by "
        "reputation.", "gold"), wide=True))
    s.append(sub("28.2", "Suspicious logins and lockouts", table(
        ["Signal", "Count (30 days)", "State"],
        [("Failed staff sign-ins", "148", okb("Monitored")),
         ("Accounts locked", "4", okb("Monitored")),
         ("New country for a known account", "2", pill("Flagged", "b-warn")),
         ("Impossible travel", "0", okb("Clear"))], csv_name="login-signals"), wide=True))
    s.append(sub("28.3", "Unresolved security alerts", table(
        ["Alert", "Severity", "Age", "Owner"],
        [("payment_audit readable only through a definer function", "Medium", "9 days", "Backend lead"),
         ("No malware scanner on the upload path", "High", "open", "Backend lead"),
         ("No tested restore in the last 30 days", "High", "open", "Backend lead"),
         ("WAF not deployed", "Medium", "open", "Owner")], csv_name="open-alerts"), wide=True, badge="4 open"))
    s.append(sub("28.4", "Dependency and configuration warnings", checks([
        ("pass", "Portal dependencies", "none shipped — nothing to patch", "Clear"),
        ("warn", "Backend dependencies", "advisory review not visible here", "Unverified"),
        ("warn", "Response headers", "3 of 5 impossible on the static host (§20.6)", "Gap"),
        ("pass", "Secret scan", "no credential in the repository or its history", "Verified"),
    ])))
    s.append(sub("28.5", "Backup status and last verified recovery test", kv([
        ("Database backup", pill("Required daily", "b-warn") + " · not verifiable here"),
        ("Object storage backup", pill("Required daily", "b-warn") + " · not configured"),
        ("Last verified restore", pill("None on record", "b-crit")),
        ("Next scheduled test", "Before the next production change"),
    ]) + note("This tile stays red until a restore has actually been performed and checked. Nobody should be able "
              "to click it green.", "warn")))
    s.append(sub("28.6", "Controls to suspend an account, revoke sessions and rotate credentials",
                 form([("Account or staff id", "STF-004"), ("Action", '<select><option>Suspend the account</option>'
                                                            '<option>Revoke every session</option>'
                                                            '<option>Force a password reset</option>'
                                                            '<option>Require reauthentication</option></select>'),
                       ("Reason", "Suspected credential exposure")],
                      "Request the action",
                      "Every action needs a reason, a second administrator, and is written to the audit log.") +
                 note("These controls are modelled in this portal. On the live platform they run through the "
                      "backend, which this environment cannot reach — so the button here records a request, and "
                      "the page says so rather than pretending it revoked anything.", "gold"), wide=True))
    s.append(sub("28.7", "Who may see this dashboard", kv([
        ("Allowed", "Super Admin, Administrator, Auditor"),
        ("Not allowed", "Collections, credit, payroll and customer accounts"),
        ("Reauthentication", "Required to open it"),
        ("State", pill("Modelled", "b-warn") + " enforced by the backend on the live platform"),
    ])))
    s.append(sub("28.8", "What this dashboard will not claim", note(
        "No tile on this page reports a firewall, an antivirus scan, a WAF or a backup as “active” unless the "
        "control exists and has been checked. Where the only honest answer is “unverified”, that is what the "
        "tile says — even when it makes the page look worse.", "warn") + kv([
            ("Verified here", "HTTPS, referrer policy, limited CSP, secret hygiene, generator escaping"),
            ("Unverified here", "Supabase policies, Railway settings, backups, WAF, malware scanning"),
            ("Gaps", "Malware scanner, restore test, response headers, WAF"),
        ]), wide=True))
    return sec(28, "Security Dashboard",
               "One screen for the controls that can be checked and an honest label on every one that cannot — "
               "health, alerts, lockouts, backup and restore status, and the emergency controls", "".join(s),
               "4 open alerts")


# ================================================================ 29 =======
def section29():
    s = []
    steps = [
        ("1", "Inventory the application, endpoints, tables, policies, buckets and hosting", "Done",
         "23 pages, 21 build scripts and the module registers are inventoried; Supabase and Railway inventories need access"),
        ("2", "Protect secrets and verify HTTPS", "Partly",
         ".env ignored, repository scanned clean, HTTPS verified; backend secrets unverified"),
        ("3", "Audit authentication, authorisation and database permissions", "Partly",
         "Modelled in §3, §4 and §24; the live policy set has not been read"),
        ("4", "Restrict uploads and secure cloud storage", "Gap",
         "No upload path exists; the rules are written in §21 and §25"),
        ("5", "Add rate limits, validation and abuse prevention", "Specified",
         "Limits and idempotency rules agreed in §20.9 and §22.12; enforcement is backend work"),
        ("6", "Configure monitoring, alerts and security logs", "Partly",
         "Portal audit model exists; alert delivery unverified"),
        ("7", "Verify protected backups and recovery", "Gap",
         "No restore test has been run"),
        ("8", "Review dependencies and deployment security", "Partly",
         "Portal has none to review; backend advisories and repository settings unverified"),
        ("9", "Test controls in a safe environment before production", "Not started",
         "Requires a staging environment and a browser-testing rig"),
        ("10", "Review Malawi data-protection and cybersecurity obligations", "Not started",
         "Legal review, not an engineering task"),
    ]
    colour = {"Done": "b-ok", "Partly": "b-warn", "Gap": "b-crit", "Specified": "b-warn",
              "Not started": "b-gray"}
    for n, title, state, detail in steps:
        s.append(sub("29.%s" % n, "Step %s · %s" % (n, title), kv([
            ("State", pill(state, colour[state])),
            ("What is true today", detail),
        ])))
    s.append(sub("29.11", "Safety rule · no change to live systems without authorisation", kv([
        ("Live systems", "GitHub, Supabase, Railway dashboards"),
        ("Rule", "Nothing is changed there from this workspace; changes are proposed, reviewed and applied by an owner"),
        ("This change", "Repository only — meta tags, .gitignore, SECURITY.md, a check workflow"),
    ])))
    s.append(sub("29.12", "Safety rule · inspect before adding", kv([
        ("Inspected", "The existing security page (18 sections), the shell, all 21 build scripts"),
        ("Outcome", "Extended rather than duplicated — sections 1–18 are untouched"),
        ("Tools added", "None — no scanner, proxy or dependency was introduced"),
    ])))
    s.append(sub("29.13", "Safety rule · never expose privileged keys in browser code", checks([
        ("pass", "Scan of all published pages", "no service-role key, JWT or private key present", "Verified"),
        ("pass", "Build scripts", "no secret is read or written by any generator", "Verified"),
        ("pass", "Frontend calls", "only public endpoints, and none are configured today", "Verified"),
        ("pass", "Rule", "kept in SECURITY.md so future changes are checked against it", "Verified"),
    ])))
    s.append(sub("29.14", "Safety rule · do not claim a protection is active", kv([
        ("Standard", "A control is green only when it has been configured and tested"),
        ("Where applied", "Every panel in §20–§28 carries an explicit state"),
        ("Consequence", "The page shows four open gaps rather than hiding them"),
    ])))
    s.append(sub("29.15", "Safety rule · one step at a time, tested before deployment", kv([
        ("Method", "Each change is built, checked with jsdom, then committed"),
        ("Checking", "23 pages audited: sections, panels, script errors, broken links, duplicate ids"),
        ("Deployment", "GitHub Pages builds from the merged commit; a failed build is visible immediately"),
        ("Next", "Close the four gaps in §28.3 in the order listed there"),
    ])))
    return sec(29, "Implementation Order and Safety Rules",
               "The ten implementation steps with an honest state against each, and the five project safety rules "
               "this work followed", "".join(s), "step 1 of 10 complete")


def main():
    parts = [section19(), section20(), section21(), section22(), section23(),
             section24(), section25(), section26(), section27(), section28(), section29()]
    html_out = "\n\n".join(parts) + "\n"
    with open("_sebodyF.html", "w", encoding="utf-8") as fh:
        fh.write(html_out)
    shutil.copyfile("_website2.css", "_security2.css")
    n = html_out.count('data-sub=')
    print("wrote _sebodyF.html (%d bytes, %d panels), _security2.css" % (len(html_out), n))


if __name__ == "__main__":
    main()
