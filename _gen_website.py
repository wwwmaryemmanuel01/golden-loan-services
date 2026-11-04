#!/usr/bin/env python3
"""
Builds the Website Management & Connections body from the approved
20-section specification.

Every numbered sub-item in the specification becomes a panel of its own,
carrying its number, so nothing in the brief is left implicit.  The page is
generated rather than hand-written so the figures stay consistent across
sections: one status board, one page directory, one service register, one
alert list, one audit trail.
"""
import html
from urllib.parse import quote

TODAY = "30 Oct 2026"
TODAY_ISO = "2026-10-30"
NOW = "08:15"

# ----------------------------------------------------------------- data ----
SITE = {
    "url": "goldenloan.mw",
    "api": "api.goldenloan.mw/v1",
    "supabase": "glsvc-prod.supabase.co",
    "version": "2.14.3",
    "built": "28 Oct 2026",
    "commit": "a41f9c2",
    "host": "Netlify Pro",
    "region": "Frankfurt (eu-central-1)",
    "backend": "gls-api · Node 20 LTS · fra",
    "uptime": "99.94%",
    "p95": "200 ms",
    "domain_expiry": "12 Apr 2027",
}

STATUS = [
    ("Public website", "Live", "200 in 142 ms", "ok", "https://goldenloan.mw"),
    ("Admin portal", "Live", "Sign-in required", "ok", "https://admin.goldenloan.mw"),
    ("Backend server", "3 of 3 instances", "Health check 61 ms", "ok", "api.goldenloan.mw/v1"),
    ("Supabase database", "Degraded", "Pool exhausted 40 s at 07:22", "warn", "glsvc-prod"),
    ("API gateway", "1 route failing", "44 callbacks refused", "crit", "api.goldenloan.mw/v1"),
    ("Authentication", "Degraded", "OTP delivery failed 9 times", "warn", "supabase auth"),
    ("Email service", "Connected", "p95 204 ms", "ok", "Resend"),
    ("SMS service", "Connected", "p95 268 ms", "ok", "Africa's Talking"),
    ("Payment rails", "1 of 2 failing", "TNM Mpamba 502", "crit", "Airtel Money · TNM Mpamba"),
    ("File storage", "Connected", "128 ms", "ok", "Supabase Storage"),
]

PAGES = [
    # path, title, visibility, access, order, seo, edits, state, load, lcp, cls, score
    ("/", "Home", "Public", "Everyone", 1, "Golden Financial Services · Loans that move", 14, "Live", 2410, 1980, 0.03, 92),
    ("/apply", "Apply for a loan", "Public", "Everyone", 2, "Apply for a loan online in Malawi", 11, "Live", 3860, 3640, 0.09, 68),
    ("/products", "Loan products", "Public", "Everyone", 3, "Loan products, terms and eligibility", 9, "Live", 2620, 2410, 0.04, 86),
    ("/calculator", "Loan calculator", "Public", "Everyone", 4, "Work out your monthly repayment", 8, "Live", 3180, 2920, 0.06, 74),
    ("/rates", "Interest rates and fees", "Public", "Everyone", 5, "Published interest rates and fee tariff", 6, "Live", 2210, 2040, 0.03, 88),
    ("/faq", "FAQ", "Public", "Everyone", 6, "Frequently asked questions", 7, "Live", 2460, 2210, 0.02, 90),
    ("/about", "About us", "Public", "Everyone", 7, "Who we are and where we work", 6, "Live", 2180, 1960, 0.03, 91),
    ("/branches", "Branches", "Public", "Everyone", 8, "Four branches across Malawi", 4, "Live", 2280, 2050, 0.03, 88),
    ("/blog", "Blog", "Public", "Everyone", 9, "News, guides and announcements", 22, "Live", 2960, 2480, 0.05, 82),
    ("/contact", "Contact", "Public", "Everyone", 10, "Talk to a loan officer", 5, "Live", 2320, 2090, 0.03, 87),
    ("/portal", "Customer portal", "Private", "Customers", 11, "Your loan account", 18, "Live", 3420, 3100, 0.07, 72),
    ("/portal/apply", "Portal application", "Private", "Customers", 12, "Continue your application", 4, "Live", 3680, 3300, 0.08, 70),
    ("/portal/statements", "Statements", "Private", "Customers", 13, "Download your statement", 3, "Live", 3420, 3100, 0.07, 72),
    ("/staff", "Staff console", "Hidden", "Staff only", 14, "Staff administration", 12, "Live", 1980, 1760, 0.02, 93),
    ("/careers", "Careers", "Hidden", "Draft", 15, "Work with us", 2, "Draft", 0, 0, 0, 0),
]

CONTENT = [
    ("About Us", "Page", "Published", 620, "21 Oct 2026", "Chikondi Mwale"),
    ("Our Services", "Page", "Published", 480, "18 Oct 2026", "Chikondi Mwale"),
    ("Loan Products and Terms", "Page", "Published", 910, "28 Oct 2026", "Tadala Msonthi"),
    ("Interest Rates and Fees", "Page", "Review", 540, "29 Oct 2026", "Tadala Msonthi"),
    ("Frequently Asked Questions", "Page", "Published", 880, "24 Oct 2026", "Esther Mwale"),
    ("Announcements and Notices", "Feed", "Published", 210, "30 Oct 2026", "Chikondi Mwale"),
    ("Blog and News", "Feed", "Published", 3150, "26 Oct 2026", "Esther Mwale"),
    ("Terms and Conditions", "Page", "Published", 1240, "12 Sep 2026", "Linda Mhango"),
    ("Privacy Policy", "Page", "Published", 980, "12 Sep 2026", "Linda Mhango"),
    ("Help and Support", "Page", "Draft", 760, "25 Oct 2026", "Esther Mwale"),
]

SERVICES = [
    ("Supabase Auth", "Authentication", "Connected", 88, "5/7 credentials valid", "STF-009"),
    ("Customer portal API", "REST API", "Connected", 118, "Token valid to 12 Jan 2027", "STF-009"),
    ("Resend", "Email", "Connected", 204, "Key rotated 02 Oct 2026", "STF-003"),
    ("Africa's Talking", "SMS", "Connected", 268, "Key rotated 14 Sep 2026", "STF-003"),
    ("Airtel Money", "Payments", "Connected", 312, "Merchant key valid", "STF-007"),
    ("TNM Mpamba", "Payments", "Failing", 0, "502 on callback since 07:12", "STF-007"),
    ("Supabase Storage", "Storage", "Connected", 128, "Service key restricted", "STF-009"),
    ("Sentry", "Monitoring", "Connected", 96, "DSN public, read-only", "STF-009"),
    ("UptimeRobot", "Monitoring", "Connected", 142, "Monitor key valid", "STF-003"),
    ("Google Analytics 4", "Analytics", "Connected", 118, "Measurement ID public", "STF-008"),
]

ENDPOINTS = [
    ("GET", "/v1/healthz", "Health probe", 200, "61 ms", "Healthy"),
    ("GET", "/v1/loans", "Loan register", 200, "184 ms", "Healthy"),
    ("POST", "/v1/applications", "New application", 201, "242 ms", "Healthy"),
    ("GET", "/v1/repayments", "Repayment register", 200, "196 ms", "Healthy"),
    ("POST", "/v1/payments", "Repayment submission", 201, "318 ms", "Degraded"),
    ("POST", "/v1/contact", "Contact form", 201, "148 ms", "Healthy"),
    ("POST", "/v1/register", "Customer registration", 201, "286 ms", "Healthy"),
    ("GET", "/v1/calculator", "Loan calculator data", 200, "402 ms", "Degraded"),
    ("POST", "/v1/auth/otp", "One-time code", 200, "268 ms", "Healthy"),
    ("POST", "/v1/integrations/mobile-money/callback", "Mobile money callback", 502, "—", "Failing"),
    ("GET", "/v1/documents", "Document list", 200, "174 ms", "Healthy"),
    ("GET", "/v1/statements", "Statement download", 200, "512 ms", "Degraded"),
    ("POST", "/v1/auth/reset", "Password reset", 200, "232 ms", "Healthy"),
    ("GET", "/v1/reports", "Report catalogue", 200, "168 ms", "Healthy"),
]

TABLES = [
    ("customers", 60, "412 MB", "on", "customer_self_read, staff_read"),
    ("loans", 77, "286 MB", "on", "staff_read, customer_own"),
    ("applications", 128, "194 MB", "on", "staff_read, customer_own"),
    ("repayment_schedules", 924, "248 MB", "on", "staff_read, customer_own"),
    ("payments", 402, "312 MB", "on", "staff_read, customer_own"),
    ("disbursements", 77, "88 MB", "on", "staff_read"),
    ("staff", 15, "4 MB", "on", "staff_read"),
    ("content_pages", 14, "2 MB", "on", "public_read"),
    ("guide_content", 62, "6 MB", "on", "public_read"),
    ("field_mappings", 138, "3 MB", "on", "staff_read"),
    ("intake_records", 96, "18 MB", "on", "staff_read"),
    ("audit_log", 5124, "96 MB", "OFF", "none — flagged"),
]

MIGRATIONS = [
    ("2026.10.28.1", "Add content_pages table", "28 Oct 2026", 412, "Applied"),
    ("2026.10.21.2", "Index payments(loan_id, paid_on)", "21 Oct 2026", 1240, "Applied"),
    ("2026.10.14.1", "Add guide_content table", "14 Oct 2026", 386, "Applied"),
    ("2026.10.02.1", "Tighten customers RLS policy", "02 Oct 2026", 214, "Applied"),
    ("2026.09.24.1", "Add fn_schedule_due function", "24 Sep 2026", 512, "Applied"),
    ("2026.09.17.1", "Add intake_records table", "17 Sep 2026", 298, "Applied"),
    ("2026.09.10.1", "Drop legacy payments_view", "10 Sep 2026", 164, "Applied"),
    ("2026.09.03.1", "Add field_mappings table", "03 Sep 2026", 208, "Applied"),
]

FUNCTIONS = [
    ("fn_schedule_due", "SQL · stable", "Reads due dates", 3120, "Secure"),
    ("fn_penalty_calc", "SQL · immutable", "Computes a late penalty", 2880, "Secure"),
    ("fn_customer_balance", "SQL · stable", "Balance for one loan", 2410, "Secure"),
    ("fn_apply_allocation", "PL/pgSQL", "Splits a repayment", 402, "Secure"),
    ("fn_audit_write", "Trigger", "Writes the audit row", 5124, "Secure"),
    ("verify-staff", "Edge function", "Staff sign-in", 940, "Verify JWT"),
    ("reset-staff-password", "Edge function", "Staff password reset", 62, "Verify JWT"),
    ("otp-send", "Edge function", "Send a one-time code", 2410, "Public, rate limited"),
    ("otp-verify", "Edge function", "Check a one-time code", 2388, "Public, rate limited"),
    ("statement-build", "Edge function", "Build a PDF statement", 96, "Verify JWT"),
]

ALERTS = [
    ("WAL-4101", "Website offline", "goldenloan.mw", "Critical", "Open", "30 Oct 2026 · 07:58", "Homepage returned 503 for 90 seconds"),
    ("WAL-4103", "Supabase connection failure", "glsvc-prod", "High", "Open", "30 Oct 2026 · 07:22", "Connection pool exhausted for 40 seconds"),
    ("WAL-4104", "Authentication failure", "Customer login", "High", "Open", "30 Oct 2026 · 07:20", "OTP delivery failed 9 times"),
    ("WAL-4105", "API error", "/integrations/mobile-money/callback", "Critical", "Open", "30 Oct 2026 · 07:12", "502 from TNM Mpamba, 44 callbacks refused"),
    ("WAL-4106", "Backend disconnection", "api.goldenloan.mw", "Critical", "Open", "30 Oct 2026 · 06:40", "Instance 2 lost its database pool"),
    ("WAL-4107", "Form submission error", "/api/calculator", "Medium", "Open", "30 Oct 2026 · 06:12", "31 refusals in the last hour"),
    ("WAL-4109", "SSL certificate expiry", "goldenloan.mw", "Low", "Monitoring", "29 Oct 2026 · 18:04", "66 days left on the certificate"),
    ("WAL-4102", "Deployment failure", "DEP-2409", "High", "Resolved", "28 Oct 2026 · 15:20", "Build failed on a missing environment variable"),
    ("WAL-4098", "Website offline", "goldenloan.mw", "Critical", "Resolved", "24 Oct 2026 · 09:41", "DNS propagation after the domain move"),
    ("WAL-4095", "Integration failure", "Airtel Money", "Medium", "Resolved", "21 Oct 2026 · 11:02", "Rate limit reached on the collections API"),
]

CHANGES = [
    ("30 Oct 2026 · 08:14", "Homepage hero copy", "Content", "Borrow with confidence", "Loans that move at the speed of your business", "Chikondi Mwale"),
    ("29 Oct 2026 · 17:02", "Interest rates page", "Content", "3.5% monthly", "3.2% monthly", "Tadala Msonthi"),
    ("29 Oct 2026 · 14:38", "Accent colour", "Branding", "#C9A227", "#D6AE2E", "Chikondi Mwale"),
    ("28 Oct 2026 · 16:12", "Deployed 2.14.3", "Deployment", "2.14.2", "2.14.3", "Tadala Msonthi"),
    ("28 Oct 2026 · 11:20", "API base URL", "Configuration", "api.goldenloan.mw/v1", "api.goldenloan.mw/v1", "Chikondi Mwale"),
    ("27 Oct 2026 · 09:44", "Resend API key", "Integration", "key…9f21", "key…4c07", "Tadala Msonthi"),
    ("26 Oct 2026 · 15:06", "Blog page visibility", "Pages", "Hidden", "Public", "Esther Mwale"),
    ("24 Oct 2026 · 10:31", "Website Editor permissions", "Permissions", "3 capabilities", "5 capabilities", "Chikondi Mwale"),
    ("21 Oct 2026 · 08:55", "Uptime check interval", "Configuration", "10 minutes", "5 minutes", "Tadala Msonthi"),
    ("18 Oct 2026 · 13:10", "Customer registration form", "Forms", "Validation off", "Validation on", "Esther Mwale"),
    ("15 Oct 2026 · 16:40", "Storage bucket policy", "Storage", "Public", "Signed URLs only", "Chikondi Mwale"),
    ("12 Oct 2026 · 09:12", "Sentry DSN", "Monitoring", "—", "Added", "Tadala Msonthi"),
]

REPORTS = [
    ("Website Availability", "Uptime, downtime and incidents, day by day", 14),
    ("Connection Health", "Every connection, its state and its latency", 10),
    ("API Performance", "Endpoint volume, p95 and error counts", 14),
    ("Database Connectivity", "Tables, RLS coverage and query health", 12),
    ("Authentication Service", "Sign-in volume, failures and lockouts", 6),
    ("Deployment", "Every release, its checks and its outcome", 8),
    ("Website Errors", "Page errors, broken links and 4xx/5xx", 21),
    ("Integration Reliability", "Uptime and failure rate per service", 10),
]

DNS = [
    ("A", "@", "75.2.60.5", "3600", "Set"),
    ("CNAME", "www", "goldenloan.netlify.app", "3600", "Set"),
    ("CNAME", "api", "gls-api.fly.dev", "300", "Set"),
    ("CNAME", "admin", "goldenloan.netlify.app", "3600", "Set"),
    ("TXT", "@", "v=spf1 include:resend.dev ~all", "3600", "Set"),
    ("TXT", "_dmarc", "v=DMARC1; p=quarantine", "3600", "Pending"),
]

DEPLOYS = [
    ("DEP-2412", "2.14.3", "28 Oct 2026 · 08:12", "Production", "Passed", "a41f9c2"),
    ("DEP-2411", "2.14.2", "24 Oct 2026 · 15:40", "Production", "Passed", "9c7e114"),
    ("DEP-2409", "2.14.1", "24 Oct 2026 · 11:02", "Production", "Failed", "3ba0f76"),
    ("DEP-2408", "2.14.0", "18 Oct 2026 · 09:26", "Production", "Passed", "77d2e30"),
    ("DEP-2407", "2.13.6", "11 Oct 2026 · 14:18", "Production", "Passed", "d41c882"),
    ("DEP-2406", "2.13.5", "04 Oct 2026 · 10:05", "Production", "Passed", "e8b1a44"),
    ("DEP-2413", "2.15.0-rc1", "30 Oct 2026 · 06:02", "Staging", "Passed", "f02c7a1"),
    ("DEP-2414", "2.15.0-rc2", "30 Oct 2026 · 07:48", "Staging", "Running", "1d4b90c"),
]

BUCKETS = [
    ("images", 612, 123, "Public read", "Images used on the website"),
    ("documents", 388, 214, "Signed URLs", "IDs, contracts and payslips"),
    ("customers", 742, 96, "Signed URLs", "Customer-uploaded documents"),
    ("backups", 1012, 56, "Private", "Database and storage copies"),
]

IMAGES = [
    ("hero-loans.jpg", "412 KB", "/", "Optimised"),
    ("branch-lilongwe.jpg", "286 KB", "/branches", "Optimised"),
    ("faq-header.jpg", "1.1 MB", "/faq", "Review"),
    ("branch-mzuzu.jpg", "1.4 MB", "/branches", "Review"),
    ("calculator-bg.png", "980 KB", "/calculator", "Review"),
    ("logo-gold.svg", "18 KB", "every page", "Optimised"),
    ("crest-charcoal.svg", "22 KB", "/about", "Optimised"),
    ("og-default.jpg", "168 KB", "metadata", "Optimised"),
]

STAFF = [
    ("STF-009", "Chikondi Mwale", "Super Admin", 6, "Unrestricted"),
    ("STF-003", "Tadala Msonthi", "Administrator", 6, "Unrestricted"),
    ("STF-008", "Esther Mwale", "Website Editor", 5, "Content only"),
    ("STF-010", "Linda Mhango", "Compliance Officer", 3, "Read-only"),
    ("STF-002", "Blessings Tembo", "Credit Analyst", 1, "Read-only"),
    ("STF-006", "Yamikani Banda", "Auditor", 2, "Audit trail only"),
]

CAPS = ["Manage website content", "Edit branding and theme", "Configure integrations", "Deploy releases",
        "Run connection tests", "Approve configuration changes", "View audit trail"]
GRANTS = {
    "Super Admin": [1, 1, 1, 1, 1, 1, 1],
    "Administrator": [1, 1, 1, 1, 1, 1, 1],
    "Website Editor": [1, 1, 0, 0, 1, 0, 1],
    "Compliance Officer": [0, 0, 0, 0, 1, 1, 1],
    "Credit Analyst": [0, 0, 0, 0, 0, 0, 1],
    "Auditor": [0, 0, 0, 0, 1, 0, 1],
}

TESTS = [
    ("DGN-01", "Website connection test", "https://goldenloan.mw", "Pass", 142),
    ("DGN-02", "Backend connectivity", "https://api.goldenloan.mw/v1/healthz", "Pass", 61),
    ("DGN-03", "Supabase connectivity", "https://glsvc-prod.supabase.co", "Pass", 88),
    ("DGN-04", "Authentication functions", "verify-staff · otp-send", "Fail", 412),
    ("DGN-05", "API endpoints", "14 routes", "Pass", 196),
    ("DGN-06", "Storage access", "bucket: customers", "Pass", 128),
    ("DGN-07", "External integrations", "Airtel · Mpamba · Resend", "Fail", 2260),
    ("DGN-08", "SSL and DNS", "goldenloan.mw", "Pass", 96),
]

FORMS = [
    ("Contact form", "/api/contact", 186, 0, "Healthy"),
    ("Customer registration", "/api/register", 64, 2, "Healthy"),
    ("Loan application", "/api/applications", 128, 18, "Degraded"),
    ("Loan calculator", "/api/calculator", 9260, 31, "Degraded"),
    ("Repayment submission", "/api/payments", 402, 4, "Healthy"),
]

ENV = [
    ("PUBLIC_SITE_URL", "https://goldenloan.mw", "Production", "public"),
    ("API_BASE_URL", "https://api.goldenloan.mw/v1", "Production", "public"),
    ("SUPABASE_URL", "https://glsvc-prod.supabase.co", "Production", "public"),
    ("SUPABASE_ANON_KEY", "eyJhbGci…(truncated)", "Production", "public"),
    ("SUPABASE_SERVICE_ROLE_KEY", "not in this build", "Server only", "secret"),
    ("RESEND_API_KEY", "re_…(server only)", "Server only", "secret"),
    ("AT_API_KEY", "atsk_…(server only)", "Server only", "secret"),
]

from _gen_common import *  # esc, money, pill, okb, kv, strip, table, checks, bars, svg_bars, svg_donut, note, bullets, form, sub, sec


# ============================================================== section 1 ===
def section1():
    s = []
    s.append(sub("1.1", "Website Status", strip([
        ("State", pill("Live", "b-ok")),
        ("Version", esc(SITE["version"])),
        ("Built", esc(SITE["built"])),
        ("Host", esc(SITE["host"])),
    ]) + kv([
        ("Public URL", "https://goldenloan.mw"),
        ("Admin portal", "https://admin.goldenloan.mw"),
        ("Certificate", "Let’s Encrypt R3 · TLS 1.3 · 66 days left"),
        ("Last content publish", "30 Oct 2026 · 08:14"),
    ]), badge="Live"))
    s.append(sub("1.2", "Public Website Availability", kv([
        ("14-day uptime", SITE["uptime"]),
        ("Target", "99.90%"),
        ("Days below target", "5 of 14"),
        ("Worst day", "24 Oct 2026 · 97.4% · domain move"),
        ("Checks a day", "288 · every 5 minutes"),
    ]) + svg_bars(["17", "19", "21", "23", "25", "27", "29"], [100, 100, 97, 100, 100, 99, 100],
                  unit="Uptime % per check day, 17–30 Oct")))
    s.append(sub("1.3", "Admin Portal Availability", kv([
        ("State", pill("Live", "b-ok")),
        ("Uptime (14 d)", "99.98%"),
        ("Sign-ins today", "1,180 staff sessions"),
        ("Failed sign-ins", "6 · three staff, second factor"),
        ("Last outage", "None in the period"),
    ])))
    s.append(sub("1.4", "Backend Server Status", kv([
        ("Service", SITE["backend"]),
        ("Instances", "3 behind the edge"),
        ("Health endpoint", "https://api.goldenloan.mw/v1/healthz"),
        ("Last check", "61 ms · 30 Oct 2026 · 08:15"),
        ("Deploy strategy", "Rolling, 3 instances"),
        ("Restarts (30 d)", "2 · last 24 Oct 2026"),
    ]), badge="3 of 3"))
    s.append(sub("1.5", "Supabase Connection Status", kv([
        ("Project", "glsvc-prod"),
        ("Engine", "PostgreSQL 15.6 · eu-central-1"),
        ("Connections", "18 of 60 · transaction pooler"),
        ("Database size", "1.8 GB across 12 tables"),
        ("State", pill("Degraded", "b-warn") + " pool exhausted for 40 s at 07:22"),
        ("RLS coverage", "11 of 12 tables · audit_log outstanding"),
    ]), badge="Degraded"))
    s.append(sub("1.6", "API Health Status", table(
        ["Route", "Method", "State", "p95"],
        [(e[1], e[0], okb(e[5]), e[4]) for e in ENDPOINTS[:8]], csv_name="api-health"), wide=True))
    s.append(sub("1.7", "Last Successful Connection", table(
        ["Check", "Target", "Latency", "Last success"],
        [("Supabase Auth", "Supabase", "88 ms", "30 Oct 2026 · 08:10"),
         ("Customer portal API", "gls-api", "118 ms", "30 Oct 2026 · 08:10"),
         ("Resend email", "Resend", "204 ms", "30 Oct 2026 · 08:09"),
         ("Airtel Money", "Airtel Malawi", "312 ms", "30 Oct 2026 · 08:10"),
         ("Supabase Storage", "Supabase", "128 ms", "30 Oct 2026 · 08:10"),
         ("Sentry", "Sentry", "96 ms", "30 Oct 2026 · 08:05")], csv_name="last-good"), wide=True))
    s.append(sub("1.8", "Website Errors and Warnings", note(
        "<b>4 critical, 3 high.</b> The homepage returned 503 for 90 seconds at 07:58, the Supabase pool was "
        "exhausted at 07:22 and TNM Mpamba has refused 44 callbacks since 07:12. Each is open in section 16 "
        "with an owner and an acknowledge action.", "warn") + checks([
            ("fail", "Website offline", "goldenloan.mw returned 503 for 90 s", "07:58"),
            ("fail", "Database pool", "18 of 60 connections, exhausted 40 s", "07:22"),
            ("warn", "OTP delivery", "9 failures on customer login", "07:20"),
            ("fail", "Payment callback", "502 from TNM Mpamba, 44 refused", "07:12"),
            ("warn", "Calculator", "31 validation refusals in an hour", "06:12"),
        ]), wide=True))
    return sec(1, "Website Overview",
               "Website status at a glance — public availability, the admin portal, the backend, Supabase, API "
               "health, the last successful connection and everything currently warning", "".join(s), "Degraded · 61%")


# ============================================================== section 2 ===
def section2():
    s = []
    s.append(sub("2.1", "Homepage Management",
                 kv([("Headline", "Loans that move at the speed of your business"),
                     ("Sub-headline", "Working capital for Malawian businesses, approved in 48 hours"),
                     ("Hero image", "hero-loans.jpg · 412 KB · optimised"),
                     ("Primary button", "Apply for a loan → /apply")]) +
                 form([("Headline", "Loans that move at the speed of your business"),
                       ("Sub-headline", "Working capital for Malawian businesses, approved in 48 hours")],
                      "Save the homepage", "Changes are staged until you publish in 2.11."), wide=True))
    s.append(sub("2.2", "Website Logo and Branding",
                 '<div class="logogrid">'
                 '<div class="logotile"><div class="logomark">G</div><div>Monogram · gold on charcoal</div></div>'
                 '<div class="logotile light"><div class="logomark">GFS</div><div>Wordmark · charcoal on gold</div></div>'
                 '<div class="logotile"><div class="logomark">✧</div><div>Crest · white on photo</div></div>'
                 '</div>' + kv([("Primary logo", "logo-gold.svg · 18 KB"),
                                ("Crest", "crest-charcoal.svg · 22 KB"),
                                ("Favicon", "favicon.ico · 16×16, 32×32"),
                                ("OG image", "og-default.jpg · 1200×630")]), badge="4 assets"))
    s.append(sub("2.3", "Website Theme and Colours",
                 kv([("Palette", "Charcoal &amp; gold"),
                     ("Accent", '<span class="swatch" style="background:#C9A227"></span> #C9A227'),
                     ("Ink", '<span class="swatch" style="background:#0F1115"></span> #0F1115'),
                     ("Paper", '<span class="swatch" style="background:#F4F5F8"></span> #F4F5F8'),
                     ("Headings", "Source Serif"),
                     ("Body", "Inter / system stack")], ) +
                 '<div class="chips"><button class="chip on">Charcoal &amp; gold</button>'
                 '<button class="chip">Daylight</button><button class="chip">Mzuzu green</button></div>'))
    s.append(sub("2.4", "Navigation Menu Management", table(
        ["#", "Label", "Target", "Visible"],
        [(1, "Home", "/", "Yes"), (2, "Loan products", "/products", "Yes"),
         (3, "Apply", "/apply", "Yes"), (4, "Calculator", "/calculator", "Yes"),
         (5, "Branches", "/branches", "Yes"), (6, "About", "/about", "Yes"),
         (7, "Contact", "/contact", "No")], csv_name="menu"), wide=True))
    s.append(sub("2.5", "Header and Footer Management",
                 kv([("Header", "Logo left, six links, Apply button right"),
                     ("Announcement bar", "On · “Branch hours change from 1 November”"),
                     ("Footer columns", "Company · Products · Support · Legal"),
                     ("Footer note", "Golden Financial Services Ltd · MW licence 0417"),
                     ("Copyright", "© 2026 Golden Financial Services")])))
    s.append(sub("2.6", "Homepage Sections", table(
        ["Section", "Order", "State"],
        [("Hero and tagline", 1, "On"), ("Why us", 2, "On"), ("Loan products", 3, "On"),
         ("Calculator teaser", 4, "On"), ("How to apply", 5, "On"),
         ("Branches", 6, "On"), ("Testimonials", 7, "Off"), ("Call to action", 8, "On")],
        csv_name="home-sections"), wide=True))
    s.append(sub("2.7", "Contact Information", kv([
        ("Phone", "+265 1 774 200"),
        ("WhatsApp", "+265 999 120 400"),
        ("Email", "hello@goldenloan.mw"),
        ("Support email", "support@goldenloan.mw"),
        ("Postal", "P.O. Box 31128, Lilongwe 3"),
    ])))
    s.append(sub("2.8", "Office Locations and Business Hours", table(
        ["Branch", "Address", "Weekdays", "Saturday"],
        [("Lilongwe", "Area 3, City Centre", "08:00–17:00", "08:00–12:00"),
         ("Blantyre", "Kanjedza House, Victoria Ave", "08:00–17:00", "08:00–12:00"),
         ("Mzuzu", "Katoto, Mzuzu Main Road", "08:00–16:30", "Closed"),
         ("Zomba", "Old Town, next to the market", "08:00–16:30", "Closed")], csv_name="branches"), wide=True))
    s.append(sub("2.9", "Social Media Links", kv([
        ("Facebook", "facebook.com/goldenloansmw · 12,400 followers"),
        ("LinkedIn", "linkedin.com/company/golden-loan-services"),
        ("X", "x.com/goldenloansmw"),
        ("Instagram", "Not connected"),
        ("YouTube", "youtube.com/@goldenloansmw"),
    ])))
    s.append(sub("2.10", "Website Preview",
                 '<div class="preview"><div class="preview-bar">goldenloan.mw</div>'
                 '<div class="preview-body"><div class="preview-hero"><span class="pv-mark">G</span>'
                 '<div><b>Golden Financial Services</b><div class="muted">Loans that move at the speed of your business</div></div></div>'
                 '<div class="preview-nav">Home · Loan products · About · Contact</div>'
                 '<div class="preview-cards"><div></div><div></div><div></div></div></div></div>'
                 '<button class="btn btn-ghost" style="margin-top:8px" data-toast="The preview opens in a new tab in production">Open the full preview</button>',
                 wide=True, badge="Live render"))
    s.append(sub("2.11", "Publish and Unpublish Content",
                 kv([("Current state", pill("Published", "b-ok") + " since 28 Oct 2026 · 08:12"),
                     ("Staged changes", "2 · homepage copy, rates page"),
                     ("Approval needed", "Yes for the rates page · Tadala Msonthi"),
                     ("Last publish", "30 Oct 2026 · 08:14 · Chikondi Mwale")]) +
                 '<div class="form-actions"><button class="btn btn-gold" data-toast="2 staged changes published to goldenloan.mw">Publish now</button>'
                 '<button class="btn btn-ghost" data-toast="Submitted to Tadala Msonthi for approval">Send for approval</button>'
                 '<button class="btn btn-ghost" data-toast="Draft saved">Save draft</button>'
                 '<button class="btn btn-ghost" data-toast="The site is now unpublished — visitors see a holding page">Unpublish</button></div>', wide=True))
    return sec(2, "Public Website Management",
               "The homepage, branding, theme, menu, header and footer, contact details, four branches and social "
               "links — then publish or unpublish", "".join(s), "11 pages live")


# ============================================================== section 3 ===
def section3():
    s = []
    edit = lambda title, words, state: (
        kv([("Item", title), ("State", okb(state)), ("Words", str(words)),
            ("Last edited", "28 Oct 2026 · Tadala Msonthi"), ("Visibility", "Public")]) +
        '<div class="form-actions"><button class="btn btn-ghost" data-toast="' + title + ' opened in the editor">Edit</button>'
        '<button class="btn btn-ghost" data-toast="Preview of ' + title + '">Preview</button></div>')
    s.append(sub("3.1", "About Us", edit("About Us", 620, "Published")))
    s.append(sub("3.2", "Our Services", edit("Our Services", 480, "Published")))
    s.append(sub("3.3", "Loan Products and Terms", edit("Loan Products and Terms", 910, "Published")))
    s.append(sub("3.4", "Interest Rates and Fees",
                 note("The published tariff is generated from the Fees &amp; Penalties module, so the website can "
                      "never quote a rate the ledger does not charge.", "gold") +
                 table(["Product", "Monthly rate", "Fee", "Published"],
                       [("Salary loan", "3.2%", "1.5% processing", "Yes"),
                        ("Business boost", "3.8%", "1.5% + 1.0% arrangement", "Yes"),
                        ("Emergency loan", "4.5%", "1.5% processing", "Yes"),
                        ("Asset finance", "3.4%", "1.5% + 0.5% disbursement", "Yes")], csv_name="rates"), wide=True))
    s.append(sub("3.5", "Frequently Asked Questions", kv([
        ("Questions published", "24"),
        ("Categories", "Applying · Repaying · Fees · Documents"),
        ("Last edit", "24 Oct 2026 · Esther Mwale"),
        ("Most read", "“What happens if I pay late?”"),
    ])))
    s.append(sub("3.6", "Announcements and Notices", table(
        ["Announcement", "Published", "Expires"],
        [("Branch hours change from 1 November", "30 Oct 2026", "30 Nov 2026"),
         ("Mobile money maintenance, 2 November", "28 Oct 2026", "03 Nov 2026"),
         ("New Zomba branch opening", "14 Oct 2026", "—")], csv_name="announcements"), wide=True))
    s.append(sub("3.7", "Blog and News", table(
        ["Post", "Author", "Published", "Reads"],
        [("How to build a repayment plan", "Esther Mwale", "26 Oct 2026", 412),
         ("What a guarantor signs for", "Chikondi Mwale", "19 Oct 2026", 288),
         ("Understanding the late payment rule", "Tadala Msonthi", "12 Oct 2026", 502)],
        csv_name="blog", num_cols=(3,)), wide=True))
    s.append(sub("3.8", "Terms and Conditions",
                 kv([("Version", "v4.1"), ("In force", "12 Sep 2026"),
                     ("Words", "1,240"), ("Approved by", "Linda Mhango · Compliance")]) +
                 '<button class="btn btn-ghost" data-toast="Terms and Conditions opened in the editor">Edit</button>'))
    s.append(sub("3.9", "Privacy Policy",
                 kv([("Version", "v3.2"), ("In force", "12 Sep 2026"),
                     ("Words", "980"), ("Covers", "Data collected, retention, customer rights")]) +
                 '<button class="btn btn-ghost" data-toast="Privacy Policy opened in the editor">Edit</button>'))
    s.append(sub("3.10", "Help and Support Content", kv([
        ("Articles", "18 · guides, forms, contacts"),
        ("State", pill("Draft", "b-warn") + " 1 draft waiting"),
        ("Last edit", "25 Oct 2026 · Esther Mwale"),
        ("Linked from", "/faq, /contact and the customer portal"),
    ])))
    s.append(sub("3.11", "Content Approval and Publishing History", table(
        ["When", "Item", "Action", "By"],
        [("30 Oct 2026 · 08:14", "Homepage hero", "Published", "Chikondi Mwale"),
         ("29 Oct 2026 · 17:02", "Interest rates", "Sent for review", "Tadala Msonthi"),
         ("28 Oct 2026 · 11:20", "Loan products", "Published", "Tadala Msonthi"),
         ("26 Oct 2026 · 15:06", "Blog page", "Published", "Esther Mwale"),
         ("25 Oct 2026 · 09:31", "Help and support", "Saved as draft", "Esther Mwale")],
        csv_name="content-history"), wide=True))
    return sec(3, "Website Content Management",
               "About us, services, products and terms, rates, FAQ, announcements, blog, the legal pages and help "
               "content — with the approval and publishing history behind each one", "".join(s), "10 items · 1 draft")


# ============================================================== section 4 ===
def section4():
    dir_rows = [(p[0], p[1], okb(p[2]), p[3], p[4]) for p in PAGES]
    s = []
    s.append(sub("4.1", "Page Directory", table(
        ["Path", "Page", "Visibility", "Access", "Order"],
        dir_rows, csv_name="page-directory"), wide=True, badge="14 pages"))
    s.append(sub("4.2", "Create and Edit Pages",
                 form([("Page title", "Careers"), ("Path", "/careers"),
                       ("Template", '<select><option>Standard page</option><option>Landing page</option>'
                                    '<option>Legal page</option></select>')],
                      "Create the page", "The page starts hidden until it is published in 2.11.")
                 ))
    s.append(sub("4.3", "Page Visibility", table(
        ["Page", "Visibility", "In the menu", "State"],
        [(p[1], okb(p[2]), "Yes" if p[4] <= 7 else "No", okb(p[7])) for p in PAGES[:8]],
        csv_name="visibility"), wide=True))
    s.append(sub("4.4", "Page Access Permissions", table(
        ["Page group", "Who may read", "Who may edit"],
        [("Public marketing pages", "Everyone", "Website Editor, Administrator"),
         ("Customer portal", "Signed-in customers", "Administrator"),
         ("Statements", "The account owner", "Administrator"),
         ("Staff console", "Staff with a session", "Super Admin only"),
         ("Legal pages", "Everyone", "Compliance Officer, Administrator")], csv_name="page-access"), wide=True))
    s.append(sub("4.5", "Page Ordering", kv([
        ("Menu order", "Home → Products → Apply → Calculator → Branches → About → Contact"),
        ("Footer order", "Legal · Company · Support"),
        ("Hidden pages", "Staff console, Careers"),
        ("Drag to reorder", "Enabled in the editor"),
    ]) + '<button class="btn btn-ghost" data-toast="Page order saved">Save the order</button>'))
    s.append(sub("4.6", "Page Metadata and SEO", table(
        ["Page", "Title", "Description set", "Canonical"],
        [(p[1], p[5][:34] + ("…" if len(p[5]) > 34 else ""), "Yes", "Yes") for p in PAGES[:6]],
        csv_name="seo"), wide=True, badge="14/14 titles"))
    s.append(sub("4.7", "Broken Links Detection", note(
        "10 internal links were checked overnight. <b>2 are broken</b>: /careers is linked from the footer but the "
        "page is a draft, and the old /loans page redirects nowhere.", "warn") + table(
        ["From", "Links to", "Anchor text", "State"],
        [("/", "/loans", "Our loan products", okb("Broken")),
         ("/about", "/careers", "Work with us", okb("Broken")),
         ("/faq", "/contact", "Talk to us", okb("Live")),
         ("/products", "/calculator", "Work it out", okb("Live"))], csv_name="broken-links"), wide=True))
    s.append(sub("4.8", "Page Availability and Error Monitoring", table(
        ["Route", "Code", "What happened", "Hits"],
        [("/apply", 500, "Calculator bundle failed to load", 12),
         ("/blog", 404, "Old slug still in a newsletter", 6),
         ("/portal/statements", 504, "Statement edge function timed out", 3)],
        csv_name="page-errors", num_cols=(1, 3)), wide=True))
    return sec(4, "Website Pages Management",
               "The page directory with visibility and access, ordering, metadata and SEO, broken links and the "
               "errors each route is throwing", "".join(s), "14 pages · 2 broken links")


# ============================================================== section 5 ===
def section5():
    s = []
    s.append(sub("5.1", "Website Domain Information", kv([
        ("Primary domain", "goldenloan.mw"),
        ("Registrar", "MalawiNet"),
        ("Registered", "12 Apr 2021"),
        ("Expires", SITE["domain_expiry"] + " · auto-renew on"),
        ("WWW", "www.goldenloan.mw · CNAME to Netlify"),
        ("Nameservers", "ns1.malawinet.mw · ns2.malawinet.mw"),
    ]), badge="66 days to renewal"))
    s.append(sub("5.2", "Custom Domain Configuration", kv([
        ("Apex", "A record → 75.2.60.5"),
        ("www", "CNAME → goldenloan.netlify.app"),
        ("admin", "CNAME → goldenloan.netlify.app"),
        ("api", "CNAME → gls-api.fly.dev"),
        ("Force HTTPS", "On"),
        ("Primary domain", "goldenloan.mw (apex)"),
    ])))
    s.append(sub("5.3", "DNS Configuration Status", table(
        ["Type", "Host", "Value", "TTL", "State"],
        [(d[0], d[1], d[2], d[3], okb(d[4])) for d in DNS], csv_name="dns"), wide=True, badge="5 of 6 set"))
    s.append(sub("5.4", "SSL/TLS Certificate Status", kv([
        ("Issuer", "Let’s Encrypt R3"),
        ("Covers", "goldenloan.mw, www.goldenloan.mw, admin.goldenloan.mw"),
        ("Protocol", "TLS 1.3 · 1.2 minimum"),
        ("Expires", "04 Jan 2027 · 66 days"),
        ("Auto-renew", "On · renews at 30 days"),
        ("Last check", "30 Oct 2026 · 08:14 · valid"),
    ]), badge="Valid"))
    s.append(sub("5.5", "Hosting Provider Information", kv([
        ("Provider", SITE["host"]),
        ("Region", SITE["region"]),
        ("Build", "Static site · GitHub-connected deploy"),
        ("CDN", "Global edge, 24 PoPs"),
        ("Plan", "Pro · 1 TB bandwidth"),
        ("Support tier", "Standard · 24 h response"),
    ])))
    s.append(sub("5.6", "Deployment Status", kv([
        ("Current", pill("Live", "b-ok") + " DEP-2412 · 2.14.3"),
        ("Deployed", "28 Oct 2026 · 08:12"),
        ("Commit", SITE["commit"]),
        ("Build time", "1 m 48 s"),
        ("Preview build", "DEP-2414 · 2.15.0-rc2 · running"),
        ("Rollback ready", "2.14.2 · DEP-2411"),
    ]), badge="Live"))
    s.append(sub("5.7", "Production Website URL", kv([
        ("Production", "https://goldenloan.mw"),
        ("WWW", "https://www.goldenloan.mw → 301 to apex"),
        ("Admin", "https://admin.goldenloan.mw"),
        ("API", "https://api.goldenloan.mw/v1"),
        ("Health", "https://api.goldenloan.mw/v1/healthz"),
    ])))
    s.append(sub("5.8", "Deployment History", table(
        ["Deployment", "Version", "When", "Environment", "Result"],
        [(d[0], d[1], d[2], d[3], okb(d[4])) for d in DEPLOYS], csv_name="deployments"), wide=True))
    s.append(sub("5.9", "Website Availability Checks", svg_bars(
        ["17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30"],
        [100, 100, 100, 100, 100, 100, 97, 100, 100, 100, 100, 100, 100, 99],
        unit="Uptime % per day · 14 days · 288 checks a day") + kv([
            ("Checks a day", "288 · every 5 minutes"),
            ("Failed checks (14 d)", "5"),
            ("Average response", "142 ms"),
            ("Slowest check", "1,860 ms · 24 Oct 2026"),
        ]), wide=True))
    return sec(5, "Domain and Hosting Connections",
               "The domain, its DNS records, the certificate, the hosting provider, the production website and "
               "every deployment that reached it", "".join(s), "99.94% uptime")


# ============================================================== section 6 ===
def section6():
    s = []
    s.append(sub("6.1", "Backend Connection Status", strip([
        ("Service", "gls-api"),
        ("Region", "fra"),
        ("Instances", "3"),
        ("Uptime 30 d", "99.94%"),
    ]) + kv([("Version", SITE["version"]), ("Last deploy", "28 Oct 2026 · 08:12"),
             ("Connection", pill("Connected", "b-ok")), ("Pool", "18 of 60 connections in use")]), badge="Connected"))
    s.append(sub("6.2", "Server Health Check", checks([
        ("pass", "Process responding", "/healthz 200 in 61 ms", "Pass"),
        ("pass", "CPU across instances", "34% average, 58% peak", "Pass"),
        ("pass", "Memory", "61% of 2 GB", "Pass"),
        ("pass", "Database pool", "18 of 60 in use", "Pass"),
        ("warn", "Queue depth", "12 jobs waiting on the mail worker", "Watch"),
        ("pass", "Disk", "42% of 40 GB", "Pass"),
    ]) + '<div class="form-actions"><button class="btn btn-gold" data-run-health>Run health check</button></div>',
        wide=True, badge="8/8 passed"))
    s.append(sub("6.3", "API Endpoint Directory", table(
        ["Method", "Route", "Purpose", "p95", "State"],
        [(e[0], e[1], e[2], e[4], okb(e[5])) for e in ENDPOINTS], csv_name="endpoints"), wide=True,
        badge="14 routes"))
    s.append(sub("6.4", "API Response Status", table(
        ["Route", "2xx", "4xx", "5xx", "p95"],
        [("/v1/loans", 4820, 12, 0, "184 ms"), ("/v1/applications", 1280, 18, 0, "242 ms"),
         ("/v1/payments", 4020, 22, 4, "318 ms"), ("/v1/calculator", 9260, 31, 0, "402 ms"),
         ("/integrations/mobile-money/callback", 0, 44, 44, "—")],
        csv_name="api-status", num_cols=(1, 2, 3)), wide=True))
    s.append(sub("6.5", "Server Error Monitoring", table(
        ["Route", "Code", "Message", "Hits", "State"],
        [("/v1/integrations/mobile-money/callback", 502, "Upstream refused the connection", 44, okb("Open")),
         ("/v1/statements", 504, "Statement build exceeded 30 s", 3, okb("Open")),
         ("/v1/payments", 500, "Allocation constraint violated", 4, okb("Fixed")),
         ("/v1/loans", 429, "Rate limit on the public API", 18, okb("Monitoring"))],
        csv_name="server-errors", num_cols=(1, 3)), wide=True))
    s.append(sub("6.6", "Request and Response Monitoring", svg_bars(
        ["00", "03", "06", "09", "12", "15", "18", "21"],
        [1420, 980, 3120, 8640, 7420, 6980, 4180, 2260], colour="#2F6FED",
        unit="Requests by hour today · 48,536 in total · 204 errors") + kv([
            ("Requests today", "48,536"),
            ("Errors today", "204 · 0.42%"),
            ("Slowest route", "/v1/statements · 512 ms p95"),
            ("Busiest route", "/v1/calculator · 9,260 calls"),
        ]), wide=True))
    s.append(sub("6.7", "Server Environment Status", kv([
        ("Runtime", "Node 20 LTS"),
        ("Region", "fra · 3 instances"),
        ("Memory", "2 GB per instance"),
        ("Deploy", "Rolling, health-gated"),
        ("Environment", "Production"),
        ("Secrets", "Injected at deploy · never in the bundle"),
    ])))
    s.append(sub("6.8", "Server Restart and Recovery Information",
                 note("A restart is a rolling deploy of the current image: one instance at a time, behind the "
                      "health check. No data is lost, and no request is dropped while two instances stay up.", "gold") +
                 kv([("Last restart", "24 Oct 2026 · 11:04 · incident"), ("Restarts (30 d)", "2"),
                     ("Recovery time", "38 seconds to full capacity"), ("Rollback", "Redeploy the previous image")]) +
                 '<div class="form-actions"><button class="btn btn-ghost" data-toast="Rolling restart requested — one instance at a time">Request a rolling restart</button></div>',
                 wide=True))
    return sec(6, "Backend Server Connection",
               "Connection state, health checks, the endpoint directory, server errors, request monitoring, the "
               "runtime environment and how a restart works", "".join(s), "8/8 checks pass")


# ============================================================== section 7 ===
def section7():
    s = []
    s.append(sub("7.1", "Supabase Project Connection", kv([
        ("Project", "glsvc-prod"),
        ("URL", "https://glsvc-prod.supabase.co"),
        ("Engine", "PostgreSQL 15.6"),
        ("Region", "eu-central-1 · Frankfurt"),
        ("Plan", "Pro · 7-day PITR"),
        ("Anon key", "Public · RLS enforced on every table"),
        ("Service key", "Server only · never in the browser bundle"),
    ]), badge="Degraded"))
    s.append(sub("7.2", "Database Connectivity Status", checks([
        ("pass", "Connection", "18 of 60 pooler connections", "Pass"),
        ("pass", "Round trip", "12 ms to the pooler", "Pass"),
        ("warn", "Pool saturation", "Reached 60 of 60 at 07:22 for 40 s", "Watch"),
        ("pass", "Replication", "No replica on this plan", "n/a"),
    ])))
    s.append(sub("7.3", "Database Health Checks", checks([
        ("pass", "Size", "1.8 GB of 8 GB", "Pass"),
        ("pass", "Cache hit ratio", "99.2%", "Pass"),
        ("pass", "Deadlocks", "0 in 24 hours", "Pass"),
        ("warn", "Slow queries", "1 statement over 1 s", "Watch"),
        ("pass", "Backup", "Daily 02:00 · verified", "Pass"),
    ])))
    s.append(sub("7.4", "Table and Schema Inventory", table(
        ["Table", "Rows", "Size", "RLS", "Policy"],
        [(t[0], format(t[1], ","), t[2], okb(t[3].replace("on", "on") if t[3] == "on" else "off"), t[4])
         for t in TABLES], csv_name="tables", num_cols=(1,)), wide=True, badge="12 tables"))
    s.append(sub("7.5", "Schema Version", kv([
        ("Schema version", "2026.10.28.1"),
        ("Migrations applied", "8"),
        ("Pending", "1 · applied at deploy time"),
        ("Compatible with", "app 2.14.3"),
        ("Checked", "30 Oct 2026 · 08:12"),
    ])))
    s.append(sub("7.6", "Database Migration History", table(
        ["Version", "What it does", "When", "Run (ms)", "State"],
        [(m[0], m[1], m[2], m[3], okb(m[4])) for m in MIGRATIONS], csv_name="migrations", num_cols=(3,)), wide=True))
    s.append(sub("7.7", "Database Query Errors", table(
        ["SQLSTATE", "Message", "Hits", "State"],
        [("23505", "duplicate key value violates payments_reference_key", 4, okb("Fixed")),
         ("57014", "canceling statement due to statement timeout", 3, okb("Open")),
         ("42501", "permission denied for table audit_log", 12, okb("Monitoring"))],
        csv_name="query-errors", num_cols=(2,)), wide=True))
    s.append(sub("7.8", "Row-Level Security Status",
                 note("<b>11 of 12 tables are behind RLS.</b> <code>audit_log</code> is the exception: it is written "
                      "by a trigger and read only through a security-definer function. That is a gap and it is "
                      "flagged in section 16.", "warn") +
                 table(["Table", "RLS", "Policies"],
                       [(t[0], okb("on" if t[3] == "on" else "Off"), t[4]) for t in TABLES], csv_name="rls"),
                 wide=True, badge="11/12"))
    s.append(sub("7.9", "Database Function Status", table(
        ["Function", "Kind", "Purpose", "Calls", "State"],
        [(f[0], f[1], f[2], format(f[3], ","), okb(f[4])) for f in FUNCTIONS],
        csv_name="functions", num_cols=(3,)), wide=True, badge="10 functions"))
    s.append(sub("7.10", "Connection and Query Performance", bars([
        ("Loan portfolio query", 402, 600, "402 ms p95"),
        ("Customer statement", 512, 600, "512 ms p95"),
        ("Payments by loan", 184, 600, "184 ms p95"),
        ("Overdue instalment scan", 268, 600, "268 ms p95"),
        ("Audit event write", 12, 600, "12 ms p95"),
        ("Content page read", 8, 600, "8 ms p95"),
    ], "#2F6FED") + kv([("Slowest shape", "customer statement · 512 ms"),
                        ("Statement timeout", "30 s"), ("Slow queries today", "1")]), wide=True))
    return sec(7, "Supabase Database Connection",
               "Project connection, database health, the table inventory, migrations, query errors, row-level "
               "security, functions and query performance", "".join(s), "6/8 checks pass")


# ============================================================== section 8 ===
def section8():
    s = []
    s.append(sub("8.1", "Connected Services Directory", table(
        ["Service", "Kind", "State", "Latency", "Credential"],
        [(x[0], x[1], okb(x[2]), str(x[3]) + " ms" if x[3] else "—", x[4]) for x in SERVICES],
        csv_name="services", num_cols=(3,)), wide=True, badge="8 of 10 connected"))
    s.append(sub("8.2", "REST API Connections", kv([
        ("Customer portal API", pill("Connected", "b-ok") + " · p95 118 ms · 24,180 calls"),
        ("Staff console API", pill("Connected", "b-ok") + " · p95 142 ms · 18,400 calls"),
        ("Public API", pill("Degraded", "b-warn") + " · p95 168 ms · 72,740 calls"),
        ("Webhooks", pill("Connected", "b-ok") + " · 4 endpoints · 2,410 deliveries"),
    ])))
    s.append(sub("8.3", "Authentication Service", kv([
        ("Provider", "Supabase Auth"),
        ("Methods", "Email + password + TOTP for staff · phone OTP for customers"),
        ("Sessions today", "3,590 sign-ins"),
        ("State", pill("Degraded", "b-warn") + " OTP delivery failed 9 times"),
        ("JWKS", "Rotated 02 Oct 2026"),
    ]), badge="Degraded"))
    s.append(sub("8.4", "Email Service Integration", kv([
        ("Provider", "Resend"),
        ("Sending domain", "mail.goldenloan.mw"),
        ("DKIM / SPF / DMARC", "Pass / Pass / quarantine"),
        ("Sent (30 d)", "18,402 · bounce rate 0.4%"),
        ("State", pill("Connected", "b-ok") + " p95 204 ms"),
    ])))
    s.append(sub("8.5", "SMS Service Integration", kv([
        ("Provider", "Africa’s Talking"),
        ("Sender ID", "GOLDENFIN"),
        ("Sent (30 d)", "26,880 · delivery 97.2%"),
        ("Balance", "12,400 credits"),
        ("State", pill("Connected", "b-ok") + " p95 268 ms"),
    ])))
    s.append(sub("8.6", "Payment Service Integration", table(
        ["Rail", "Purpose", "State", "Last callback"],
        [("Airtel Money", "Collections", okb("Connected"), "30 Oct 2026 · 08:12"),
         ("TNM Mpamba", "Collections", okb("Failing"), "30 Oct 2026 · 07:12"),
         ("Bank transfer", "Manual reconciliation", okb("Connected"), "30 Oct 2026 · 07:40")],
        csv_name="payment-rails"), wide=True))
    s.append(sub("8.7", "File Storage Integration", kv([
        ("Provider", "Supabase Storage"),
        ("Buckets", "4 · images, documents, customers, backups"),
        ("Access", "Public read on images · signed URLs elsewhere"),
        ("Used", "2.68 GB of 19 GB"),
        ("State", pill("Connected", "b-ok")),
    ])))
    s.append(sub("8.8", "Third-Party Service Status", checks([
        ("pass", "Sentry", "error tracking · 26 events captured", "Connected"),
        ("pass", "UptimeRobot", "8 monitors · 142 ms average", "Connected"),
        ("pass", "Google Analytics 4", "measurement ID public", "Connected"),
        ("fail", "TNM Mpamba", "502 on the callback route", "Failing"),
        ("warn", "Africa’s Talking", "delivery 97.2% · 12,400 credits left", "Watch"),
    ])))
    s.append(sub("8.9", "API Credentials Status", table(
        ["Credential", "Scope", "Rotated", "Expires"],
        [("Resend API key", "Send email", "02 Oct 2026", "Never"),
         ("Africa’s Talking key", "Send SMS", "14 Sep 2026", "Never"),
         ("Airtel merchant key", "Collections", "01 Aug 2026", "31 Dec 2026"),
         ("TNM Mpamba key", "Collections", "01 Aug 2026", "Expired"),
         ("Supabase service key", "Server only", "12 Jul 2026", "Rotate by 12 Jan 2027"),
         ("Sentry DSN", "Write events", "12 Oct 2026", "Never"),
         ("Analytics ID", "Read reports", "11 Mar 2026", "Never")],
        csv_name="credentials"), wide=True, badge="5 of 7 valid"))
    s.append(sub("8.10", "Integration Test Results", checks([
        ("pass", "Resend", "test message delivered in 204 ms", "Pass"),
        ("pass", "Africa’s Talking", "test SMS queued, delivered in 268 ms", "Pass"),
        ("pass", "Airtel Money", "callback accepted", "Pass"),
        ("fail", "TNM Mpamba", "502 from the upstream", "Fail"),
        ("pass", "Supabase Storage", "signed URL issued", "Pass"),
    ]) + '<div class="form-actions"><button class="btn btn-gold" data-run-tests>Run every integration test</button></div>',
        wide=True, badge="6 of 8 passed"))
    return sec(8, "API and Service Integrations",
               "Every connected service — REST APIs, authentication, email, SMS, payments and storage — with its "
               "credentials and the results of its integration test", "".join(s), "8/10 connected")


# ============================================================== section 9 ===
def section9():
    s = []
    s.append(sub("9.1", "Staff Login Connection", checks([
        ("pass", "Sign-in", "email, password, TOTP · 1,180 calls · p95 212 ms", "Healthy"),
        ("pass", "Second factor", "TOTP verified in 940 sessions", "Healthy"),
        ("warn", "Failures", "6 failed sign-ins across 3 staff", "Watch"),
    ]) + kv([("Lockout rule", "5 failures in 15 minutes"), ("Session length", "8 hours idle timeout")])))
    s.append(sub("9.2", "Customer Login Connection", checks([
        ("pass", "Phone + OTP", "2,410 calls · p95 268 ms", "Healthy"),
        ("fail", "OTP delivery", "9 failures between 07:10 and 07:20", "Degraded"),
        ("pass", "Session", "18,400 authenticated calls today", "Healthy"),
    ])))
    s.append(sub("9.3", "Registration Service", kv([
        ("Route", "POST /v1/register"),
        ("Self-registration", "On · phone number is the identifier"),
        ("Submissions (30 d)", "64"),
        ("Rejected", "2 · duplicate phone"),
        ("State", pill("Healthy", "b-ok")),
    ])))
    s.append(sub("9.4", "Password Recovery Service",
                 kv([("Route", "POST /v1/auth/reset"),
                     ("Staff", "Email link, 30-minute expiry"),
                     ("Customers", "OTP to the registered phone"),
                     ("Requests (30 d)", "212 · completed 198"),
                     ("State", pill("Healthy", "b-ok"))]) +
                 form([("Account", "chikondi@goldenloan.mw"), ("Channel", '<select><option>Email</option><option>SMS</option></select>')],
                      "Send a test reset", "A test message is sent to the connected service, not to a real user.")
                 ))
    s.append(sub("9.5", "Staff Authentication Functions", table(
        ["Function", "Purpose", "Calls", "p95", "State"],
        [("verify-staff", "Staff sign-in", "940", "176 ms", okb("Healthy")),
         ("reset-staff-password", "Reset a staff password", "62", "142 ms", okb("Healthy")),
         ("grant-capability", "Change a capability", "18", "96 ms", okb("Healthy"))], csv_name="staff-auth"), wide=True))
    s.append(sub("9.6", "Customer Authentication Functions", table(
        ["Function", "Purpose", "Calls", "p95", "State"],
        [("otp-send", "Send a one-time code", "2,410", "268 ms", okb("Degraded")),
         ("otp-verify", "Check a one-time code", "2,388", "184 ms", okb("Healthy")),
         ("customer-session", "Issue a session", "18,400", "42 ms", okb("Healthy"))], csv_name="customer-auth"), wide=True))
    s.append(sub("9.7", "Session Validation", kv([
        ("Checks today", "18,400"),
        ("JWT verification", "Local, against the cached JWKS"),
        ("Rejected tokens", "12 · expired or wrong audience"),
        ("Average check", "3 ms"),
        ("Refresh window", "7 days"),
    ])))
    s.append(sub("9.8", "Authentication Error Logs", table(
        ["When", "Service", "Code", "Hits", "Severity"],
        [("30 Oct 2026 · 07:20", "otp-send", "SMS_FAILED", 9, okb("High")),
         ("30 Oct 2026 · 06:44", "otp-verify", "OTP_EXPIRED", 14, okb("Low")),
         ("29 Oct 2026 · 21:02", "verify-staff", "TOTP_INVALID", 4, okb("Medium")),
         ("29 Oct 2026 · 18:20", "customer-session", "JWT_AUDIENCE", 2, okb("Medium"))],
        csv_name="auth-errors", num_cols=(3,)), wide=True))
    s.append(sub("9.9", "Login Service Health", svg_bars(
        ["00", "06", "09", "12", "15", "18", "21"], [42, 268, 980, 742, 604, 720, 234],
        colour="#1E9E6A", unit="Sign-ins by hour today · 3,590 staff and customers") + kv([
            ("Success rate", "99.4%"), ("Median sign-in", "212 ms"),
            ("Slowest service", "otp-send · 268 ms p95")]), wide=True))
    return sec(9, "Authentication Connections",
               "Staff login, customer login, registration, password recovery, the authentication functions, "
               "session validation and the error log", "".join(s), "2 degraded")


# ============================================================= section 10 ===
def section10():
    s = []
    s.append(sub("10.1", "Public Website to Backend", kv([
        ("Base URL", "https://api.goldenloan.mw/v1"),
        ("State", pill("Connected", "b-ok")),
        ("p95", "168 ms"), ("Requests (24 h)", "41,220"),
        ("Timeouts", "74"), ("CORS", "goldenloan.mw and www only"),
    ])))
    s.append(sub("10.2", "Admin Portal to Backend", kv([
        ("Base URL", "https://api.goldenloan.mw/v1"),
        ("State", pill("Connected", "b-ok")),
        ("p95", "142 ms"), ("Requests (24 h)", "18,400"),
        ("Timeouts", "12"), ("Auth", "Bearer JWT, refreshed at 7 days"),
    ])))
    s.append(sub("10.3", "Customer Portal to Backend", kv([
        ("Base URL", "https://api.goldenloan.mw/v1"),
        ("State", pill("Degraded", "b-warn") + " statement build timing out"),
        ("p95", "302 ms"), ("Requests (24 h)", "13,120"),
        ("Timeouts", "51"), ("Auth", "Customer JWT, 7-day refresh"),
    ]), badge="Degraded"))
    s.append(sub("10.4", "Frontend API Configuration", table(
        ["Key", "Value", "Environment", "State"],
        [(e[0], e[1], e[2], okb("ok")) for e in ENV if e[3] == "public"], csv_name="frontend-config"), wide=True))
    s.append(sub("10.5", "Data Request and Response Validation", checks([
        ("pass", "Response schema", "every route validated against its contract", "6 of 6"),
        ("warn", "Payload mismatch", "/v1/statements returns an extra field", "2 to review"),
        ("pass", "Required fields", "every required field is present", "Pass"),
        ("warn", "Enum drift", "one new payment status not in the client enum", "1"),
    ]), badge="4 of 6 pass"))
    s.append(sub("10.6", "Connection Timeout Monitoring", kv([
        ("Client timeout", "20 s · 3 retries with backoff"),
        ("Timeouts today", "137"),
        ("Worst route", "/v1/statements · 51 timeouts"),
        ("Retry success", "82% succeed on the second attempt"),
    ]) + bars([("Public website", 74, 140, "74"), ("Admin portal", 12, 140, "12"),
               ("Customer portal", 51, 140, "51")], "#E08C1E")))
    s.append(sub("10.7", "Failed Request Tracking", table(
        ["Client", "Route", "Code", "Hits", "State"],
        [("Public website", "/v1/calculator", 500, 12, okb("Open")),
         ("Customer portal", "/v1/statements", 504, 51, okb("Open")),
         ("Public website", "/v1/payments", 409, 4, okb("Monitoring")),
         ("Admin portal", "/v1/loans", 429, 18, okb("Monitoring"))],
        csv_name="failed-requests", num_cols=(2, 3)), wide=True))
    s.append(sub("10.8", "Frontend Error Reporting", table(
        ["Route", "Error", "Hits", "Captured by"],
        [("/apply", "TypeError: calculator bundle failed to load", 12, "Sentry"),
         ("/portal", "NetworkError: statement request aborted", 51, "Sentry"),
         ("/calculator", "ReferenceError: rate is not defined", 8, "Sentry")],
        csv_name="frontend-errors", num_cols=(2,)), wide=True))
    s.append(sub("10.9", "Integration Test Results", checks([
        ("pass", "Public website → backend", "GET /v1/healthz 200 in 168 ms", "Pass"),
        ("pass", "Admin portal → backend", "session validated, 142 ms", "Pass"),
        ("fail", "Customer portal → backend", "statement build timed out at 30 s", "Fail"),
        ("warn", "Response validation", "extra field on /v1/statements", "Watch"),
    ]) + '<div class="form-actions"><button class="btn btn-gold" data-run-tests>Run the integration tests</button></div>',
        wide=True, badge="3 of 4"))
    return sec(10, "Frontend and Backend Integration",
                "Public website, admin portal and customer portal against the backend — configuration, validation, "
                "timeouts, failed requests, frontend errors and the test results", "".join(s), "1 client degraded")


# ============================================================= section 11 ===
def section11():
    s = []
    def formrow(f):
        return sub("11.%d" % f, {
            1: "Contact Form Connection", 2: "Customer Registration Form", 3: "Loan Application Form",
            4: "Loan Calculator Data Connection", 5: "Repayment Submission Connection"}[f],
            kv([("Endpoint", FORMS[f - 1][1]), ("Submissions (30 d)", format(FORMS[f - 1][2], ",")),
                ("Rejected", str(FORMS[f - 1][3])), ("State", okb(FORMS[f - 1][4])),
                ("Last submission", "30 Oct 2026 · 08:14")]) +
            '<div class="form-actions"><button class="btn btn-ghost" data-test-form="' + esc(FORMS[f-1][0]) +
            '">Send test</button></div>')
    s += [formrow(i) for i in range(1, 6)]
    s.append(sub("11.6", "Form Validation Status", checks([
        ("pass", "Contact form", "required fields, email shape, honeypot", "Pass"),
        ("pass", "Registration", "phone shape, duplicate check", "Pass"),
        ("warn", "Loan application", "18 refusals · missing payslip", "Watch"),
        ("warn", "Calculator", "31 refusals · amount outside the product range", "Watch"),
        ("pass", "Repayment", "reference and amount validated", "Pass"),
    ]), badge="4 of 6 pass"))
    s.append(sub("11.7", "Form Submission Error Logs", table(
        ["Form", "Field", "Error", "Hits", "State"],
        [("Loan calculator", "amount", "outside the product range", 31, okb("Open")),
         ("Loan application", "payslip", "file missing", 18, okb("Open")),
         ("Registration", "phone", "already registered", 2, okb("Resolved")),
         ("Repayment", "reference", "unknown loan reference", 4, okb("Monitoring"))],
        csv_name="form-errors", num_cols=(3,)), wide=True))
    s.append(sub("11.8", "Successful Submission Monitoring", svg_bars(
        ["Contact", "Register", "Apply", "Calcul.", "Repay"], [186, 64, 128, 9260, 402],
        colour="#1E9E6A", unit="Successful submissions in the last 30 days · 10,040 in total"), wide=True))
    return sec(11, "Website Forms and Data Connections",
                "The contact form, registration, loan application, calculator and repayment submission — with "
                "validation, errors and successful submission monitoring", "".join(s), "5 forms · 2 degraded")


# ============================================================= section 12 ===
def section12():
    s = []
    thumbs = "".join(f'<div class="thumb"><div class="thumb-img">▤</div><div class="thumb-n">{esc(i[0])}</div>'
                     f'<div class="thumb-m">{esc(i[1])} · {esc(i[2])}</div></div>' for i in IMAGES)
    s.append(sub("12.1", "Website Image Library",
                 f'<div class="thumbs">{thumbs}</div>' + kv([
                     ("Images", "123 · 6.1 MB total"),
                     ("Not optimised", "3 · over 900 KB each"),
                     ("Formats", "JPEG, PNG, SVG, WebP"),
                     ("Last upload", "29 Oct 2026 · Esther Mwale"),
                 ]), wide=True, badge="3 oversized"))
    s.append(sub("12.2", "Logo and Brand Assets", kv([
        ("Primary logo", "logo-gold.svg · 18 KB"),
        ("Crest", "crest-charcoal.svg · 22 KB"),
        ("Favicon", "favicon.ico · 16 px and 32 px"),
        ("Social card", "og-default.jpg · 1200×630"),
        ("Brand guide", "brand-guidelines.pdf · 2.4 MB"),
    ])))
    s.append(sub("12.3", "Document Storage Connection", kv([
        ("Bucket", "documents"),
        ("Objects", "214 · 388 MB"),
        ("Access", "Signed URLs, 15-minute expiry"),
        ("Uploads (30 d)", "38"),
        ("State", pill("Connected", "b-ok")),
    ])))
    s.append(sub("12.4", "Customer Document Storage", kv([
        ("Bucket", "customers"),
        ("Objects", "96 · 742 MB"),
        ("Contents", "IDs, payslips, bank statements, contracts"),
        ("Access", "Customer and assigned officer only"),
        ("Retention", "7 years after the loan closes"),
    ])))
    s.append(sub("12.5", "File Upload Configuration", kv([
        ("Maximum size", "10 MB per file"),
        ("Accepted types", "PDF, JPEG, PNG, DOCX"),
        ("Virus scan", "On · ClamAV edge function"),
        ("Naming", "customer/loan/type-timestamp"),
        ("Failed uploads (30 d)", "6 · size limit"),
    ])))
    s.append(sub("12.6", "File Access Permissions", table(
        ["Bucket", "Read", "Write", "Delete"],
        [("images", "Everyone", "Website Editor", "Super Admin"),
         ("documents", "Signed URL · 15 min", "Officer on the account", "Super Admin"),
         ("customers", "Owner + assigned officer", "Owner + officer", "Super Admin"),
         ("backups", "Nobody in the app", "Backup job", "Nobody")], csv_name="file-access"), wide=True))
    s.append(sub("12.7", "Storage Usage Monitoring", bars([
        ("images", 612, 1980, "612 MB"),
        ("documents", 388, 1980, "388 MB"),
        ("customers", 742, 1980, "742 MB"),
        ("backups", 1012, 1980, "1.01 GB"),
    ], "#2F6FED") + kv([("Used", "2.75 GB of 19 GB · 14.5%"),
                        ("Growth (30 d)", "218 MB"),
                        ("Largest object", "customer contract · 9.4 MB")]), wide=True, badge="2.75 GB"))
    s.append(sub("12.8", "Missing File Detection", note(
        "4 files are referenced by a page or a record but are not in the bucket. Each one shows as a broken "
        "image or a dead download on the page that points at it.", "warn") + table(
        ["Missing file", "Referenced by", "First seen", "Severity"],
        [("careers-hero.jpg", "/careers", "25 Sep 2026", okb("Medium")),
         ("branch-zomba.jpg", "/branches", "14 Oct 2026", okb("Medium")),
         ("tariff-2025.pdf", "/rates", "02 Oct 2026", okb("High")),
         ("logo-white.svg", "/portal", "18 Oct 2026", okb("Low"))], csv_name="missing-files"), wide=True))
    return sec(12, "Files and Media Management",
                "The image library, brand assets, document storage, customer documents, upload configuration, "
                "access permissions, storage use and the files that have gone missing", "".join(s), "4 missing")


# ============================================================= section 13 ===
def section13():
    s = []
    rows = [(p[1], str(p[8]), str(p[9]), f"{p[10]}", str(p[11]),
             okb("Pass" if p[11] >= 85 else "Review")) for p in PAGES if p[11]]
    s.append(sub("13.1", "Page Loading Performance",
                 table(["Page", "Load (ms)", "LCP (ms)", "CLS", "Score", "Verdict"], rows,
                       csv_name="page-speed", num_cols=(1, 2, 4)), wide=True, badge="2.65 s average"))
    s.append(sub("13.2", "API Response Times", table(
        ["Route", "p50", "p95", "p99"],
        [("/v1/loans", "96 ms", "184 ms", "312 ms"), ("/v1/calculator", "188 ms", "402 ms", "740 ms"),
         ("/v1/payments", "142 ms", "318 ms", "604 ms"), ("/v1/statements", "284 ms", "512 ms", "1,240 ms")],
        csv_name="api-times"), wide=True))
    s.append(sub("13.3", "Database Response Times", bars([
        ("Loan portfolio", 402, 600, "402 ms"), ("Customer statement", 512, 600, "512 ms"),
        ("Payments by loan", 184, 600, "184 ms"), ("Audit write", 12, 600, "12 ms"),
    ], "#2F6FED") + kv([("Average query", "457 ms"), ("Slowest", "512 ms · statement")])))
    s.append(sub("13.4", "Website Availability History", svg_bars(
        ["17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30"],
        [100, 100, 100, 100, 100, 100, 97, 100, 100, 100, 100, 100, 100, 99],
        unit="Uptime % per day · 14 days")))
    s.append(sub("13.5", "Failed Request Statistics", kv([
        ("Failed requests (24 h)", "114 · 0.16%"),
        ("5xx", "51 · statements and the payment callback"),
        ("4xx", "63 · validation and unknown references"),
        ("Timeouts", "137 · 82% recovered on retry"),
    ])))
    s.append(sub("13.6", "Resource Usage Monitoring", bars([
        ("CPU", 34, 100, "34%"), ("Memory", 61, 100, "61%"), ("Disk", 42, 100, "42%"),
        ("Database size", 22, 100, "1.8 of 8 GB"), ("Storage", 15, 100, "2.75 of 19 GB"),
        ("Bandwidth (30 d)", 38, 100, "38% of the plan"),
    ], "#1E9E6A"), wide=True))
    s.append(sub("13.7", "Mobile Responsiveness Checks", checks([
        ("pass", "Home", "fits 360 px · no horizontal scroll", "Pass"),
        ("pass", "Apply", "form fields stack to one column", "Pass"),
        ("pass", "Calculator", "inputs and result both readable", "Pass"),
        ("warn", "Statement download", "buttons wrap under the table", "Review"),
        ("fail", "Branches", "map iframe forces a sideways scroll", "Fail"),
    ]), badge="4 of 6 pass"))
    s.append(sub("13.8", "Performance Reports", table(
        ["Report", "Covers", "Last run"],
        [("Page speed", "12 pages, 4G profile", "30 Oct 2026"),
         ("API latency", "14 routes, p50/p95/p99", "30 Oct 2026"),
         ("Database latency", "6 query shapes", "30 Oct 2026"),
         ("Availability", "14 days, per check", "30 Oct 2026")],
        csv_name="perf-reports"), wide=True))
    return sec(13, "Website Performance",
                "Page loading, API and database response times, availability history, failed requests, resource "
                "use, mobile responsiveness and the performance reports", "".join(s), "4 slow pages")


# ============================================================= section 14 ===
def section14():
    s = []
    names = {1: ("14.1", "Run Website Connection Test", "DGN-01"),
             2: ("14.2", "Test Backend Connectivity", "DGN-02"),
             3: ("14.3", "Test Supabase Connectivity", "DGN-03"),
             4: ("14.4", "Test Authentication Functions", "DGN-04"),
             5: ("14.5", "Test API Endpoints", "DGN-05"),
             6: ("14.6", "Test Storage Access", "DGN-06"),
             7: ("14.7", "Test External Integrations", "DGN-07")}
    for i in range(1, 8):
        num, title, code = names[i]
        t = next(x for x in TESTS if x[0] == code)
        s.append(sub(num, title,
                     kv([("Test", t[2]), ("Last result", okb(t[3])),
                         ("Latency", str(t[4]) + " ms"), ("Last run", "30 Oct 2026 · 08:16")]) +
                     '<div class="form-actions"><button class="btn btn-ghost" data-run-test="' + code +
                     '">Run test</button></div>'))
    s.append(sub("14.8", "Connection Test Results", table(
        ["Test", "Probe", "Result", "Latency", "Last run"],
        [(t[1], t[2], okb(t[3]), str(t[4]) + " ms", "08:16") for t in TESTS],
        csv_name="diagnostics", num_cols=(3,)), wide=True, badge="4 of 8 passing"))
    s.append(sub("14.9", "Recommended Troubleshooting Actions", note(
        "<b>Two probes fail.</b> Each failure carries the action that clears it, so nobody has to guess what to do "
        "next at seven in the morning.", "warn") + table(
        ["Failing test", "What to do", "Owner"],
        [("Authentication functions", "Check the Africa’s Talking balance and the SMS sender ID, then re-run DGN-04", "Tadala Msonthi"),
         ("External integrations", "TNM Mpamba is returning 502 — raise a ticket and switch the rail to Airtel only", "Blessings Tembo"),
         ("Statement timeout", "Raise the statement function timeout to 60 s and re-deploy", "Chikondi Mwale")],
        csv_name="troubleshooting"), wide=True))
    return sec(14, "Connection Diagnostics",
                "Run the website, backend, Supabase, authentication, API, storage and integration probes — and read "
                "what to do about anything that fails", "".join(s), "4/8 passing")


# ============================================================= section 15 ===
def section15():
    s = []
    s.append(sub("15.1", "Current Production Version", strip([
        ("Version", SITE["version"]), ("Commit", SITE["commit"]),
        ("Released", "28 Oct 2026"), ("Environment", "Production"),
    ]) + kv([("Built from", "main · a41f9c2"), ("Build time", "1 m 48 s"),
             ("Serving", pill("Live", "b-ok")), ("Previous", "2.14.2 · DEP-2411")]), badge="Live"))
    s.append(sub("15.2", "Latest Deployed Version", kv([
        ("Production", "2.14.3 · 28 Oct 2026 · 08:12"),
        ("Staging", "2.15.0-rc2 · 30 Oct 2026 · 07:48 · running"),
        ("Last failed", "2.14.1 · DEP-2409 · missing environment variable"),
    ])))
    s.append(sub("15.3", "Deployment Status", checks([
        ("pass", "Build", "compiled in 1 m 48 s", "Pass"),
        ("pass", "Health check", "all 3 instances answered", "Pass"),
        ("pass", "Smoke tests", "6 of 6 routes", "Pass"),
        ("warn", "Pending migration", "1 applies at deploy time", "Watch"),
    ])))
    s.append(sub("15.4", "Deployment History", table(
        ["Deployment", "Version", "When", "Environment", "Result", "Commit"],
        [(d[0], d[1], d[2], d[3], okb(d[4]), d[5]) for d in DEPLOYS], csv_name="deploy-history"), wide=True))
    s.append(sub("15.5", "Release Notes", note(
        "<b>2.14.3</b> — content pages table, guide content, faster calculator.<br>"
        "<b>2.14.2</b> — fix: duplicate payment reference on retry.<br>"
        "<b>2.14.1</b> — failed: missing SUPABASE_ANON_KEY in the build environment.", "gold") + kv([
            ("Notes written by", "Tadala Msonthi"), ("Linked issues", "4"), ("Rollback tested", "Yes · 24 Oct 2026")]),
        wide=True))
    s.append(sub("15.6", "Environment Configuration Checks", table(
        ["Variable", "Expected", "Present", "State"],
        [(e[0], e[1], "Yes" if e[3] == "public" else "Server only", okb("ok")) for e in ENV],
        csv_name="env-checks"), wide=True, badge="7 of 7"))
    s.append(sub("15.7", "Failed Deployment Alerts", note(
        "<b>1 failed build in the last 30 days.</b> DEP-2409 stopped before it reached production: the build needed "
        "SUPABASE_ANON_KEY and the variable was missing from the environment. Nothing was published.", "warn") +
        table(["Deployment", "When", "Reason", "State"],
              [("DEP-2409", "24 Oct 2026 · 11:02", "Missing SUPABASE_ANON_KEY", okb("Resolved"))],
              csv_name="failed-deploys"), wide=True))
    s.append(sub("15.8", "Rollback Information", kv([
        ("Rollback target", "2.14.2 · DEP-2411 · 9c7e114"),
        ("Last rollback", "24 Oct 2026 · 11:08 · 2.13.6 → 2.13.5"),
        ("Time to roll back", "2 m 10 s"),
        ("Data effect", "None — the schema is backwards compatible"),
        ("Who may roll back", "Super Admin, Administrator"),
    ]) + '<div class="form-actions"><button class="btn btn-ghost" data-toast="Rollback to 2.14.2 requested — needs a second approver">Roll back to 2.14.2</button></div>'))
    s.append(sub("15.9", "Pre-Deployment Health Checks", checks([
        ("fail", "Environment variables", "1 missing in staging", "Blocked"),
        ("pass", "Build", "compiles clean", "Pass"),
        ("pass", "Type check", "no errors", "Pass"),
        ("warn", "Migration", "1 pending, applies at deploy", "Watch"),
        ("pass", "Smoke tests on staging", "6 of 6", "Pass"),
        ("warn", "Bundle size", "412 KB · 12% over budget", "Watch"),
    ]) + note("A production deploy is held while any check shows <b>Blocked</b>.", "gold"), wide=True))
    return sec(15, "Deployment and Version Management",
                "The production version, deployment status, the release history and notes, environment checks, "
                "failed deployment alerts, rollback information and the pre-deployment checks", "".join(s), "1 pending migration")


# ============================================================= section 16 ===
def section16():
    s = []
    rules = [
        ("16.1", "Website Offline Alerts", "goldenloan.mw returns a non-200 for 3 consecutive checks", "5 minutes", "1 raised"),
        ("16.2", "Backend Disconnection Alerts", "Any instance fails the health check twice", "2 minutes", "1 raised"),
        ("16.3", "Supabase Connection Failure Alerts", "Pooler refuses a connection", "Immediate", "1 raised"),
        ("16.4", "Authentication Failure Alerts", "More than 5 sign-in failures in 10 minutes", "10 minutes", "1 raised"),
        ("16.5", "API Error Alerts", "5xx rate above 1% for 5 minutes", "5 minutes", "1 raised"),
        ("16.6", "Integration Failure Alerts", "A service fails two integration tests in a row", "15 minutes", "1 raised"),
        ("16.7", "SSL Certificate Expiry Alerts", "Certificate within 30 days of expiry", "Daily", "1 monitoring"),
        ("16.8", "Deployment Failure Alerts", "A build or a health-gated deploy fails", "Immediate", "1 raised"),
    ]
    for num, title, rule, window, count in rules:
        s.append(sub(num, title, kv([("Rule", rule), ("Window", window), ("Raised in the period", count),
                                     ("Notifies", "Super Admin, Administrator"), ("Channels", "Email, SMS, in-app")]),
                     badge=count))
    s.append(sub("16.9", "Alert History", table(
        ["Alert", "Kind", "Target", "Severity", "State", "Raised", "Action"],
        [(a[0], a[1], a[2], okb(a[3]), okb(a[4]), a[5],
          '<button class="btn btn-ghost btn-sm" data-ack="' + a[0] + '">Acknowledge</button>') for a in ALERTS],
        csv_name="alerts"), wide=True, badge="7 open"))
    return sec(16, "Connection Alerts and Notifications",
                "Website offline, backend disconnection, Supabase failure, authentication failure, API errors, "
                "integration failure, SSL expiry and deployment failure alerts — with the rules and the history",
                "".join(s), "7 open · 4 critical")


# ============================================================= section 17 ===
def section17():
    s = []
    s.append(sub("17.1", "Website Management Permissions",
                 '<div class="tblwrap"><table class="tbl2 dense"><thead><tr><th>Role</th><th>People</th>'
                 '<th>Capabilities</th><th>Scope</th></tr></thead><tbody>' +
                 "".join(f'<tr><td>{esc(r[1])}</td><td class="num">{r[3]}</td><td class="num">{r[4]}</td><td>{esc(r[5])}</td></tr>'
                         for r in [(0,) + x for x in STAFF]) +
                 '</tbody></table></div>', wide=True, badge="23 grants"))
    s.append(sub("17.2", "Content Editor Permissions", kv([
        ("Who", "Website Editor"),
        ("May", "Create and edit pages, publish content, edit branding, run tests, read the audit trail"),
        ("May not", "Configure integrations, deploy, approve a configuration change"),
        ("People", "1 · Esther Mwale"),
    ])))
    s.append(sub("17.3", "Integration Configuration Permissions", kv([
        ("Who", "Super Admin, Administrator"),
        ("May", "Read and rotate credentials, change service configuration"),
        ("Second signature", "Required above MK 0 — any change is approved by another administrator"),
        ("People", "2"),
    ])))
    s.append(sub("17.4", "Deployment Permissions", kv([
        ("Who", "Super Admin, Administrator"),
        ("May", "Deploy to staging freely, deploy to production only when every pre-flight check passes"),
        ("Rollback", "Super Admin, Administrator"),
        ("People", "2"),
    ])))
    s.append(sub("17.5", "Connection Testing Permissions", kv([
        ("Who", "Super Admin, Administrator, Website Editor, Compliance Officer, Auditor"),
        ("May", "Run any diagnostic probe and read the results"),
        ("May not", "Change the configuration a probe points at"),
        ("People", "5"),
    ])))
    s.append(sub("17.6", "Configuration Change History", table(
        ["When", "Change", "Area", "Previous", "Updated", "By"],
        [(c[0], c[1], c[2], c[3], c[4], c[5]) for c in CHANGES if c[2] in ("Configuration", "Permissions", "Integration")],
        csv_name="config-changes"), wide=True, badge="5 changes"))
    s.append(sub("17.7", "Administrative Approval Requirements", checks([
        ("pass", "Publish to the public site", "Website Editor may publish content", "1 approver"),
        ("pass", "Change an integration credential", "A second administrator must approve", "2 approvers"),
        ("pass", "Deploy to production", "Held until every pre-flight check passes", "Automatic gate"),
        ("pass", "Roll back production", "Second approver required", "2 approvers"),
        ("pass", "Change a permission", "Super Admin only, written to the audit trail", "1 approver"),
    ]), wide=True))
    return sec(17, "Website Access and Permissions",
                "Who may manage the website, edit content, change the integration configuration, deploy or run "
                "connection tests — with the approval rules and the change history", "".join(s), "23 grants")


# ============================================================= section 18 ===
def section18():
    s = []
    for i, (title, blurb, rows) in enumerate(REPORTS, start=1):
        s.append(sub(f"18.{i}", f"{title} Reports",
                     kv([("Covers", blurb), ("Rows in the last run", str(rows)),
                         ("Formats", "Preview · CSV · Excel · PDF")]) +
                     '<div class="form-actions">'
                     f'<button class="btn btn-ghost" data-preview="{esc(title)}">Preview</button>'
                     f'<button class="btn btn-ghost" data-csv="{esc(title.lower().replace(" ", "-"))}">CSV</button>'
                     f'<button class="btn btn-ghost" data-toast="Excel export of the {esc(title)} report queued">Excel</button>'
                     f'<button class="btn btn-ghost" data-toast="PDF of the {esc(title)} report queued">PDF</button>'
                     '</div>'))
    return sec(18, "Website Management Reports",
                "Availability, connection health, API performance, database connectivity, authentication, "
                "deployment, website error and integration reliability reports — each as PDF, Excel or CSV",
                "".join(s), "8 reports")


# ============================================================= section 19 ===
def section19():
    s = []
    s.append(sub("19.1", "Public Website URL", kv([
        ("Public URL", "https://goldenloan.mw"),
        ("WWW", "https://www.goldenloan.mw · 301 to the apex"),
        ("Canonical", "https://goldenloan.mw on every page"),
        ("Force HTTPS", "On"),
    ]) + form([("Public website URL", "https://goldenloan.mw")], "Save", "Used by every link and every canonical tag.")))
    s.append(sub("19.2", "Backend API Base URL", kv([
        ("Base URL", "https://api.goldenloan.mw/v1"),
        ("Health", "https://api.goldenloan.mw/v1/healthz"),
        ("CORS", "goldenloan.mw, www.goldenloan.mw, admin.goldenloan.mw"),
        ("Version", "v1 · v2 in staging"),
    ])))
    s.append(sub("19.3", "Supabase Project URL", kv([
        ("Project URL", "https://glsvc-prod.supabase.co"),
        ("Anon key", "Public · RLS enforced"),
        ("Service key", "Server only · never in the bundle"),
        ("Realtime", "Off"),
    ]) + note("The service-role key is referenced by name only. It is never printed, exported or sent to the "
              "browser, and it never appears in a backup.", "gold")))
    s.append(sub("19.4", "Public Application Configuration", table(
        ["Key", "Value", "Environment", "State"],
        [(e[0], e[1], e[2], okb("ok")) for e in ENV], csv_name="app-config"), wide=True))
    s.append(sub("19.5", "Connection Timeout Settings", form([
        ("Connection timeout (s)", "20"), ("Retries", "3"),
        ("Backoff", '<select><option>Exponential</option><option>Linear</option><option>None</option></select>'),
        ("Idle timeout (min)", "8")], "Save timeouts", "A retry only repeats a request that failed inside the timeout.")))
    s.append(sub("19.6", "Health Check Intervals", form([
        ("Website probe (min)", "5"), ("Backend probe (min)", "2"),
        ("Database probe (min)", "5"), ("Integration sweep (min)", "15")], "Save intervals",
        "Six probes a day per service at 5 minutes; every check is stored for 30 days.")))
    s.append(sub("19.7", "Monitoring Preferences", checks([
        ("pass", "Email alerts", "to 2 administrators and the on-call address", "On"),
        ("pass", "SMS alerts", "critical only, to the on-call phone", "On"),
        ("pass", "In-app alerts", "the bell in the admin portal", "On"),
        ("warn", "Auto-rollback", "rolls back when the health check fails twice", "Off"),
        ("pass", "Uptime alerts", "public status page", "On"),
    ]), badge="4 of 5 on"))
    s.append(sub("19.8", "Environment Configuration Validation", checks([
        ("pass", "Required variables", "7 of 7 present", "Pass"),
        ("pass", "Secret exposure", "no service key in the bundle", "Pass"),
        ("pass", "URL shape", "every URL is https", "Pass"),
        ("warn", "Analytics ID", "present, but the property is in test mode", "Watch"),
    ]), wide=True, badge="3 of 4 pass"))
    return sec(19, "System Configuration",
                "The URLs, timeouts, health-check intervals and monitoring preferences every connection reads from",
                "".join(s), "Saved")


# ============================================================= section 20 ===
def section20():
    s = []
    def trail(title, kinds):
        rows = [c for c in CHANGES if c[2] in kinds]
        return table(["When", "Change", "Previous", "Updated", "By"],
                     [(c[0], c[1], c[3], c[4], c[5]) for c in rows],
                     csv_name=title.lower().replace(" ", "-"))
    s.append(sub("20.1", "Website Content Changes", trail("content", ("Content", "Pages")), wide=True))
    s.append(sub("20.2", "Branding and Theme Changes", trail("branding", ("Branding",)), wide=True))
    s.append(sub("20.3", "Connection Configuration Changes", trail("config", ("Configuration",)), wide=True))
    s.append(sub("20.4", "Integration Changes", trail("integration", ("Integration", "Monitoring")), wide=True))
    s.append(sub("20.5", "Deployment Activity", trail("deployments", ("Deployment",)), wide=True))
    s.append(sub("20.6", "Staff Member Responsible", table(
        ["Staff", "Role", "Changes in the period"],
        [("Chikondi Mwale", "Super Admin", "5"), ("Tadala Msonthi", "Administrator", "4"),
         ("Esther Mwale", "Website Editor", "2"), ("Linda Mhango", "Compliance Officer", "1")],
        csv_name="staff-changes"), wide=True))
    s.append(sub("20.7", "Change Timestamp", kv([
        ("First change", "12 Oct 2026 · 09:12"),
        ("Latest change", "30 Oct 2026 · 08:14"),
        ("Timestamp source", "Server clock, UTC+2"),
        ("Every row carries", "date, time, actor and both values"),
    ])))
    s.append(sub("20.8", "Previous and Updated Values", table(
        ["Change", "Previous", "Updated"],
        [(c[1], c[3], c[4]) for c in CHANGES], csv_name="before-after"), wide=True) +
        note("The audit trail is append-only. Nothing on this page can be edited or deleted from the page itself, "
             "and a reset never clears it.", "gold"))
    return sec(20, "Change History and Audit Trail",
                "Content, branding, connection configuration, integration and deployment changes — who made each "
                "one, when, and what the value was before", "".join(s), "12 entries")


# ================================================================ shell ====
SUBS = [
    (1, "Overview"), (2, "Public website"), (3, "Content"), (4, "Pages"),
    (5, "Domain & hosting"), (6, "Backend"), (7, "Supabase"), (8, "Integrations"),
    (9, "Authentication"), (10, "Frontend"), (11, "Forms"), (12, "Files & media"),
    (13, "Performance"), (14, "Diagnostics"), (15, "Deployment"), (16, "Alerts"),
    (17, "Permissions"), (18, "Reports"), (19, "Configuration"), (20, "Change history"),
]


def topbar():
    nav = "".join(
        f'<a class="snav{" on" if n == 1 else ""}" href="#s{n}">{n} · {esc(t)}</a>'
        for n, t in SUBS)
    return f'''
<div class="main">
  <header class="topbar">
    <button class="menu-btn" id="menuBtn" aria-label="Menu">
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#0F1115" stroke-width="2"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
    </button>
    <div class="tb-title">
      <div class="page-title">Website Management &amp; Connections</div>
      <div class="page-sub">The public site and every service behind it · <span id="topRefresh">{TODAY}</span></div>
    </div>
    <div class="search">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9AA0AC" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
      <input placeholder="Search a page, endpoint, service or figure…" id="globalSearch" autocomplete="off" />
    </div>
    <button class="icon-btn" id="bellBtn" title="Open alerts">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3A3F4A" stroke-width="1.8"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 8-3 8h18s-3-1-3-8"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>
    </button>
    <button class="btn btn-ghost" id="quickCsv">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v12M7 10l5 5 5-5M4 21h16"/></svg>
      Export pack
    </button>
    <button class="btn btn-ghost" id="printBtn">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9V3h12v6M6 18H4v-6h16v6h-2M8 14h8v7H8z"/></svg>
      Print
    </button>
  </header>
  <nav class="subnav wrap" id="subnav">{nav}</nav>
'''


def band():
    return f'''
  <div class="modband">
    <div>
      <h1>Website &amp; connections</h1>
      <p>The public site, the admin portal, the backend API, the Supabase project and the ten services they depend
        on — twenty sections, each one traceable to a real record.</p>
    </div>
    <div class="band-stats">
      <div class="band-stat"><b>61%</b><span>Connection score</span></div>
      <div class="band-stat"><b>{SITE["uptime"]}</b><span>Uptime 14 d</span></div>
      <div class="band-stat"><b>14</b><span>API endpoints</span></div>
      <div class="band-stat"><b>7</b><span>Open alerts</span></div>
    </div>
    <div class="mb-actions">
      <button class="btn btn-gold" data-goto="s14">Run diagnostics</button>
      <button class="btn btn-ghost" data-goto="s16">Open alerts</button>
    </div>
  </div>
'''


def filterbar():
    defs = [("Area", ["All areas", "Website", "Backend", "Supabase", "Integrations", "Authentication", "Storage", "Deployment"]),
            ("Severity", ["All severities", "Critical", "High", "Medium", "Low"]),
            ("State", ["All states", "Live", "Degraded", "Failing", "Open", "Resolved", "Draft", "Pending"]),
            ("Owner", ["All owners", "Chikondi Mwale", "Tadala Msonthi", "Esther Mwale", "Linda Mhango", "Blessings Tembo"])]
    sels = "".join(
        '<div class="fg"><label>' + esc(l) + '</label><select data-filter="' + esc(l.lower()) + '">' +
        "".join(f"<option>{esc(o)}</option>" for o in opts) + "</select></div>" for l, opts in defs)
    return f'''
  <div class="card panel filterpanel">
    <div class="panel-head"><div><div class="panel-title">Filter the connection register</div>
      <div class="panel-sub">Every section below follows these controls — area, severity, state and owner</div></div>
      <span class="badge b-gray" id="filterCount">no filters</span></div>
    <div class="form-grid four">{sels}
      <div class="fg"><label>Search</label><input id="filterSearch" placeholder="endpoint, page, service…" /></div>
    </div>
    <div class="form-actions">
      <button class="btn btn-gold" id="applyFilters">Apply the filters</button>
      <button class="btn btn-ghost" id="clearFilters">Clear everything</button>
    </div>
    <div class="qhint" id="filterMsg">No filters applied — all twenty sections are shown.</div>
  </div>
'''


CSS = r"""
/* ---------- sub-item panels ---------- */
.subgrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:11px}
.subgrid>.sub.wide{grid-column:1/-1}
.sub{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:12px 13px;min-width:0}
.subhead{display:flex;align-items:center;gap:8px;margin-bottom:8px;flex-wrap:wrap}
.subnum{flex:0 0 auto;font-size:10px;font-weight:800;letter-spacing:.3px;color:#7A5E10;
  background:var(--gold-soft,#FBF3D6);border:1px solid #E8D488;border-radius:6px;padding:2px 6px;
  font-variant-numeric:tabular-nums}
.subhead h3{font-size:12.5px;font-weight:800;letter-spacing:-.15px;margin:0;flex:1 1 auto;min-width:0}
.subpill{font-size:9px;font-weight:800;color:var(--muted);background:#F1F2F6;border-radius:20px;padding:2px 7px}
.subbody{min-width:0}
.sub .tblwrap{max-height:300px}
.sub .kvlist{margin-top:2px}
.sub .form-grid{margin-top:6px}
.sub .strip{margin-bottom:8px}
.sub .form-actions{margin-top:8px;flex-wrap:wrap;gap:6px}
.sub .note{margin:0 0 8px}
@media(max-width:1100px){ .subgrid{grid-template-columns:1fr} }

/* ---------- small pieces used by the generated panels ---------- */
.plainlist{margin:0;padding-left:16px;font-size:11px;line-height:1.7;color:#3A3F4A}
.plainlist li{margin-bottom:2px}
.muted{color:var(--muted)}
.kvlist .kvrow b{max-width:58%;text-align:right;overflow-wrap:anywhere}
.checkrow .cl b{font-weight:700}
.hbar{display:grid;grid-template-columns:minmax(0,1fr) 92px 62px;align-items:center;gap:8px;margin-bottom:6px}
.hbar-l{font-size:10.5px;font-weight:600;color:#3A3F4A;overflow-wrap:anywhere}
.hbar-t{height:8px;background:#EEF0F4;border-radius:20px;overflow:hidden}
.hbar-t i{display:block;height:100%;border-radius:20px}
.hbar-v{font-size:10px;font-weight:800;text-align:right;font-variant-numeric:tabular-nums;color:var(--muted)}
.swatch{display:inline-block;width:9px;height:9px;border-radius:2px;margin-right:4px;vertical-align:middle;
  border:1px solid rgba(0,0,0,.12)}
.thumbs{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px;margin-bottom:9px}
.thumb{border:1px solid var(--line-2);border-radius:9px;padding:7px;background:#FCFDFF;min-width:0}
.thumb-img{height:44px;border-radius:6px;background:linear-gradient(135deg,#EDEFF4,#DDE1EA);
  display:grid;place-items:center;color:#9AA0AC;font-size:16px}
.thumb-n{font-size:9.5px;font-weight:800;margin-top:5px;overflow-wrap:anywhere}
.thumb-m{font-size:9px;color:var(--muted);margin-top:1px}
.logogrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px;margin-bottom:9px}
.logotile{background:#0F1115;color:#E8C860;border-radius:10px;padding:12px 10px;text-align:center;font-size:9.5px}
.logotile.light{background:var(--gold-soft,#FBF3D6);color:#0F1115}
.logomark{font-size:20px;font-weight:800;margin-bottom:6px}
.preview{border:1px solid var(--line);border-radius:11px;overflow:hidden;background:#fff}
.preview-bar{background:#0F1115;color:#C7CBD4;font-size:9px;padding:4px 9px}
.preview-body{padding:11px}
.preview-hero{display:flex;align-items:center;gap:9px;margin-bottom:9px}
.pv-mark{width:26px;height:26px;border-radius:7px;display:grid;place-items:center;font-weight:800;
  background:linear-gradient(145deg,#E8C860,#B58C1B);color:#2A2100}
.preview-nav{font-size:9px;color:var(--muted);border-top:1px solid var(--line-2);
  border-bottom:1px solid var(--line-2);padding:5px 0;margin-bottom:8px}
.preview-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}
.preview-cards div{height:38px;border-radius:6px;background:#F4F5F8;border:1px solid var(--line-2)}
.filterpanel{margin-bottom:13px}
.filterpanel .form-grid{grid-template-columns:repeat(auto-fit,minmax(150px,1fr))}
.snav{white-space:nowrap}
.sub.hide{display:none}
.sec.hide{display:none}
"""

JS = r"""
/* ============================================================
   WEBSITE & CONNECTIONS — page behaviour
   Everything here is defensive: a missing element never throws.
   ============================================================ */
(function(){
  var el = function(id){ return document.getElementById(id); };
  var all = function(sel, root){ return Array.prototype.slice.call((root||document).querySelectorAll(sel)); };

  function toast(msg, kind){
    var host = el('toasts');
    if(!host) return;
    var t = document.createElement('div');
    t.className = 'toast ' + (kind || 'ok');
    t.innerHTML = '<span>' + (kind === 'err' ? '⚠' : kind === 'info' ? 'ℹ' : '✓') + '</span><div>' + msg + '</div>';
    host.appendChild(t);
    setTimeout(function(){ t.style.opacity = '0'; t.style.transform = 'translateX(16px)'; t.style.transition = '.25s'; }, 2600);
    setTimeout(function(){ if(t.parentNode) t.parentNode.removeChild(t); }, 3000);
  }

  function openModal(title, sub, body){
    if(!el('modal')) return;
    el('modalTitle').textContent = title;
    el('modalSub').textContent = sub || '';
    el('modalBody').innerHTML = body;
    el('modal').classList.add('on');
  }
  function closeModal(){ if(el('modal')) el('modal').classList.remove('on'); }

  /* ---------- CSV out of any rendered table ---------- */
  function tableToCsv(table){
    var rows = all('tr', table).map(function(tr){
      return all('th,td', tr).map(function(c){
        var v = (c.textContent || '').replace(/\s+/g, ' ').trim();
        return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
      }).join(',');
    });
    return rows.join('\n');
  }
  function download(name, text){
    try{
      var blob = new Blob([text], {type: 'text/csv;charset=utf-8'});
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url; a.download = name; document.body.appendChild(a); a.click();
      setTimeout(function(){ URL.revokeObjectURL(url); if(a.parentNode) a.parentNode.removeChild(a); }, 400);
      toast(name + ' downloaded');
    }catch(e){
      openModal('Export ready', name, '<div class="note gold"><div>This browser blocked the download. ' +
        'The table is on screen and can be copied, or opened outside the embedded preview.</div></div>');
    }
  }
  function exportNearest(btn){
    var host = btn.closest('.sub') || btn.closest('.sec') || document;
    var table = host.querySelector('table');
    if(!table){ toast('Nothing to export in this panel', 'err'); return; }
    var name = (btn.getAttribute('data-csv') || 'export').replace(/[^a-z0-9-]+/gi, '-').toLowerCase() + '.csv';
    download(name + '', tableToCsv(table));
  }

  /* ---------- sorting ---------- */
  function sortTable(th){
    var table = th.closest('table');
    if(!table) return;
    var idx = all('th', th.parentNode).indexOf(th);
    var body = table.querySelector('tbody');
    if(!body) return;
    var dir = th.getAttribute('data-dir') === 'asc' ? 'desc' : 'asc';
    all('th', th.parentNode).forEach(function(h){ h.removeAttribute('data-dir'); });
    th.setAttribute('data-dir', dir);
    var rows = all('tr', body);
    rows.sort(function(a, b){
      var x = (a.children[idx] ? a.children[idx].textContent : '').trim();
      var y = (b.children[idx] ? b.children[idx].textContent : '').trim();
      var nx = parseFloat(x.replace(/[^0-9.\-]/g, '')), ny = parseFloat(y.replace(/[^0-9.\-]/g, ''));
      var cmp = (!isNaN(nx) && !isNaN(ny) && /\d/.test(x) && /\d/.test(y)) ? nx - ny : x.localeCompare(y);
      return dir === 'asc' ? cmp : -cmp;
    });
    rows.forEach(function(r){ body.appendChild(r); });
  }

  /* ---------- filters ---------- */
  function applyFilters(){
    var area = (document.querySelector('[data-filter="area"]') || {}).value || 'All areas';
    var sev = (document.querySelector('[data-filter="severity"]') || {}).value || 'All severities';
    var state = (document.querySelector('[data-filter="state"]') || {}).value || 'All states';
    var owner = (document.querySelector('[data-filter="owner"]') || {}).value || 'All owners';
    var text = ((el('filterSearch') || {}).value || '').trim().toLowerCase();
    var active = [area, sev, state, owner].filter(function(v){ return v && v.indexOf('All ') !== 0; });
    var subs = all('.sub'), shown = 0;

    subs.forEach(function(node){
      var hay = (node.textContent || '').toLowerCase();
      var ok = true;
      if(area !== 'All areas' && hay.indexOf(area.toLowerCase()) < 0) ok = false;
      if(sev !== 'All severities' && hay.indexOf(sev.toLowerCase()) < 0) ok = false;
      if(state !== 'All states' && hay.indexOf(state.toLowerCase()) < 0) ok = false;
      if(owner !== 'All owners' && hay.indexOf(owner.toLowerCase()) < 0) ok = false;
      if(text && hay.indexOf(text) < 0) ok = false;
      node.classList.toggle('hide', !ok);
      if(ok) shown++;
    });
    /* a section with nothing left visible is hidden too */
    all('section.sec').forEach(function(s){
      var any = s.querySelector('.sub:not(.hide)');
      s.classList.toggle('hide', !any);
    });

    var msg = el('filterMsg');
    if(msg) msg.textContent = (active.length || text)
      ? shown + ' of ' + subs.length + ' panels match' + (active.length ? ' · ' + active.join(' · ') : '') +
        (text ? ' · “' + text + '”' : '')
      : 'No filters applied — all twenty sections are shown.';
    var pill = el('filterCount');
    if(pill) pill.textContent = (active.length || text) ? shown + ' match' : 'no filters';
    return shown;
  }
  function clearFilters(){
    all('[data-filter]').forEach(function(s){ s.selectedIndex = 0; });
    if(el('filterSearch')) el('filterSearch').value = '';
    all('.sub').forEach(function(n){ n.classList.remove('hide'); });
    all('section.sec').forEach(function(n){ n.classList.remove('hide'); });
    var msg = el('filterMsg');
    if(msg) msg.textContent = 'No filters applied — all twenty sections are shown.';
    if(el('filterCount')) el('filterCount').textContent = 'no filters';
  }

  /* ---------- section chips ---------- */
  function spy(){
    var chips = all('.snav');
    var secs = all('section.sec');
    if(!chips.length || !secs.length) return;
    function mark(){
      var best = secs[0], top = -1e9;
      secs.forEach(function(s){
        var r = s.getBoundingClientRect ? s.getBoundingClientRect() : {top: 0};
        if(r.top <= 180 && r.top > top){ top = r.top; best = s; }
      });
      chips.forEach(function(c){ c.classList.toggle('on', c.getAttribute('href') === '#' + best.id); });
    }
    window.addEventListener('scroll', mark, {passive: true});
    mark();
  }

  /* ---------- delegated clicks ---------- */
  document.addEventListener('click', function(e){
    var t = e.target;

    var csv = t.closest && t.closest('[data-csv]');
    if(csv){ exportNearest(csv); return; }

    var th = t.closest && t.closest('th');
    if(th && th.parentNode && th.parentNode.parentNode && th.parentNode.parentNode.tagName === 'THEAD'){ sortTable(th); return; }

    var goto = t.closest && t.closest('[data-goto]');
    if(goto){
      var target = el(goto.getAttribute('data-goto'));
      if(target && target.scrollIntoView && target.scrollIntoView) target.scrollIntoView({behavior: 'smooth', block: 'start'});
      return;
    }

    var ack = t.closest && t.closest('[data-ack]');
    if(ack){
      var row = ack.closest('tr');
      if(row){
        var cells = all('td', row);
        for(var i = 0; i < cells.length; i++){
          if(/Open|Monitoring/.test(cells[i].textContent)) cells[i].innerHTML = '<span class="badge b-ok">Acknowledged</span>';
        }
        ack.textContent = 'Acknowledged';
        ack.disabled = true;
        var n = all('[data-ack]:not([disabled])').length;
        var pill = el('alertCount');
        if(pill) pill.textContent = n + ' open';
        toast(ack.getAttribute('data-ack') + ' acknowledged and written to the alert history');
      }
      return;
    }

    var runTest = t.closest && t.closest('[data-run-test]');
    if(runTest){
      var code = runTest.getAttribute('data-run-test');
      var panel = runTest.closest('.sub');
      var badge = panel && panel.querySelector('.subpill');
      if(badge) badge.textContent = 'Running…';
      setTimeout(function(){
        if(badge) badge.textContent = 'Pass · ' + (90 + Math.floor(Math.random() * 120)) + ' ms';
        toast(code + ' passed');
      }, 650);
      return;
    }

    if(t.closest && t.closest('[data-run-tests]')){
      toast('All eight probes queued — results appear in 14.8');
      return;
    }
    if(t.closest && t.closest('[data-run-health]')){
      toast('Health check passed on all three instances');
      return;
    }
    var tf = t.closest && t.closest('[data-test-form]');
    if(tf){
      toast('Test submission accepted for the ' + tf.getAttribute('data-test-form'));
      return;
    }
    var prev = t.closest && t.closest('[data-preview]');
    if(prev){
      var name = prev.getAttribute('data-preview');
      var host = prev.closest('.sub');
      var tbl = host && host.querySelector('table');
      openModal(name + ' report', 'Preview · rows as they would be exported',
        tbl ? tbl.outerHTML : '<div class="note gold"><div>This report has no rows in the current period.</div></div>');
      return;
    }
    var tst = t.closest && t.closest('[data-toast]');
    if(tst){ toast(tst.getAttribute('data-toast')); return; }

    if(t.closest && t.closest('#applyFilters')){ applyFilters(); return; }
    if(t.closest && t.closest('#clearFilters')){ clearFilters(); return; }
    if(t.closest && t.closest('#printBtn')){ try{ window.print(); }catch(e){} return; }
    if(t.closest && t.closest('#menuBtn')){ var sb = el('sidebar'); if(sb) sb.classList.toggle('open'); return; }
    if(t.closest && t.closest('#bellBtn')){ var al = el('s16'); if(al && al.scrollIntoView) al.scrollIntoView({behavior: 'smooth'}); return; }
    if(t.closest && t.closest('#quickCsv')){
      var pack = [];
      all('table').slice(0, 6).forEach(function(tbl, i){ pack.push('# table ' + (i + 1)); pack.push(tableToCsv(tbl)); });
      download('website-connections-pack.csv', pack.join('\n\n'));
      return;
    }
    if(t.closest && t.closest('#modalClose')){ closeModal(); return; }
    if(t.closest && t.closest('#modal')){ if(e.target === el('modal')) closeModal(); }
  });

  /* ---------- search ---------- */
  var searchTimer = null;
  var gs = el('globalSearch');
  if(gs){
    gs.addEventListener('input', function(){
      clearTimeout(searchTimer);
      searchTimer = setTimeout(function(){
        if(el('filterSearch')) el('filterSearch').value = gs.value;
        applyFilters();
      }, 220);
    });
  }

  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape') closeModal();
    if(e.key === '/' && document.activeElement !== gs && gs){ e.preventDefault(); gs.focus(); }
  });

  spy();
  window.__wmReady = 1;
})();
"""


# ================================================================= main ====
def main():
    body = [topbar(), band(), filterbar(), '<div class="content">']
    for fn in (section1, section2, section3, section4, section5, section6, section7, section8,
               section9, section10, section11, section12, section13, section14, section15,
               section16, section17, section18, section19, section20):
        body.append(fn())
    body.append('</div></div>')
    body.append('<div id="toasts"></div>')
    body.append('''<div class="modal" id="modal">
  <div class="modal-card">
    <div class="modal-head"><div><h3 id="modalTitle">Report</h3><p id="modalSub"></p></div>
      <button class="modal-x" id="modalClose" aria-label="Close">✕</button></div>
    <div class="modal-body" id="modalBody"></div>
    <div class="modal-foot" id="modalFoot"></div>
  </div>
</div>''')
    html_out = "\n".join(body)

    with open("_wm2body.html", "w", encoding="utf-8") as fh:
        fh.write(html_out)
    with open("_website2.css", "w", encoding="utf-8") as fh:
        fh.write(CSS)
    with open("_wm2js.js", "w", encoding="utf-8") as fh:
        fh.write("<script>\n" + JS + "\n</script>\n")
    print("wrote _wm2body.html (%d bytes), _website2.css (%d), _wm2js.js (%d)"
          % (len(html_out), len(CSS), len(JS)))


if __name__ == "__main__":
    main()
