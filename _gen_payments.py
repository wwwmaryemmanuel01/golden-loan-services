#!/usr/bin/env python3
"""
Builds the Methods of Payment Management & Connections body from the
approved twenty-section specification.

Every numbered sub-item in the brief becomes a numbered panel of its own
(1.1 … 20.10), so nothing in the specification is implicit.  The page is
generated so the figures agree across sections: one method register, one
transaction list, one reconciliation picture, one audit trail.
"""
import html
from _gen_common import (esc, money, pill, okb, kv, strip, table, checks, bars,
                         svg_bars, svg_donut, note, bullets, form, sub, sec)

TODAY = "30 Oct 2026"
NOW = "08:20"

# ----------------------------------------------------------------- data ----
CURRENCY = "MWK"

METHODS = [
    # code, name, kind, state, default, order, min, max, fee, feeBy, provider
    ("AMM", "Airtel Money", "Mobile money", "Active", True, 1, 500, 2_000_000, "1.5%", "Customer", "Airtel Malawi"),
    ("TNM", "TNM Mpamba", "Mobile money", "Active", False, 2, 500, 1_500_000, "1.5%", "Customer", "TNM"),
    ("BNK", "Bank transfer", "Bank", "Active", False, 3, 1_000, 50_000_000, "0", "Company", "NBS · Standard · National"),
    ("CSH", "Cash at branch", "Cash", "Active", False, 4, 100, 500_000, "0", "Company", "Internal"),
    ("CRD", "Card payment", "Gateway", "Disabled", False, 5, 1_000, 5_000_000, "2.9%", "Customer", "PayChangu"),
    ("MCH", "Merchant till", "Mobile money", "Archived", False, 6, 500, 1_000_000, "1.5%", "Customer", "Airtel Malawi"),
]

TXNS = [
    # ref, when, method, customer, loan, amount, state, provider_ref, officer, fee
    ("PAY-2026-88410", "30 Oct 2026 · 08:12", "Airtel Money", "Chifundo Mponda", "SL-2026-0418", 48_000, "Successful", "AM-77120934", "System", 720),
    ("PAY-2026-88409", "30 Oct 2026 · 08:07", "TNM Mpamba", "Ruth Phiri", "BB-2026-0233", 120_000, "Successful", "TNM-556120", "System", 1_800),
    ("PAY-2026-88408", "30 Oct 2026 · 07:58", "Bank transfer", "Patrick Zulu", "AF-2026-0104", 250_000, "Pending", "—", "System", 0),
    ("PAY-2026-88407", "30 Oct 2026 · 07:44", "Airtel Money", "Thoko Phiri", "GL-2026-0071", 15_000, "Failed", "AM-77120880", "System", 0),
    ("PAY-2026-88406", "30 Oct 2026 · 07:31", "Cash at branch", "Madalitso Mponda", "SL-2026-0392", 32_000, "Successful", "RCPT-2026-1204", "Linda Mhango", 0),
    ("PAY-2026-88405", "30 Oct 2026 · 07:18", "Airtel Money", "Isaac Phiri", "EL-2026-0488", 9_500, "Unreconciled", "AM-77120811", "System", 143),
    ("PAY-2026-88404", "30 Oct 2026 · 07:02", "Bank transfer", "Steven Mponda", "BB-2026-0219", 500_000, "Successful", "NBS-88123", "System", 0),
    ("PAY-2026-88403", "30 Oct 2026 · 06:50", "TNM Mpamba", "Limbani Mhango", "SL-2026-0380", 26_500, "Reversed", "TNM-556088", "System", 0),
    ("PAY-2026-88402", "30 Oct 2026 · 06:32", "Airtel Money", "Chimwemwe Mhango", "GL-2026-0064", 12_000, "Cancelled", "—", "System", 0),
    ("PAY-2026-88401", "30 Oct 2026 · 06:14", "Cash at branch", "Tadala Phiri", "EL-2026-0470", 7_500, "Successful", "RCPT-2026-1203", "Blessings Tembo", 0),
]

PROVIDERS = [
    # name, kind, state, mode, webhook, latency, success, last test
    ("Airtel Money", "Mobile money", "Connected", "Production", "Signed · HMAC-256", 312, "99.2%", "30 Oct 2026 · 08:11"),
    ("TNM Mpamba", "Mobile money", "Failing", "Production", "Signed · HMAC-256", 0, "88.4%", "30 Oct 2026 · 07:12"),
    ("PayChangu", "Gateway", "Sandbox", "Test", "Signed · HMAC-256", 286, "100%", "29 Oct 2026 · 16:40"),
    ("NBS Bank", "Bank", "Manual", "Production", "Statement import", 0, "—", "30 Oct 2026 · 07:05"),
]

RECON = [
    ("Airtel Money", 412, 410, 2, 0, "Matched"),
    ("TNM Mpamba", 208, 196, 9, 3, "Gap"),
    ("Bank transfer", 96, 94, 1, 1, "Matched"),
    ("Cash at branch", 142, 142, 0, 0, "Matched"),
    ("Card payment", 0, 0, 0, 0, "Not in use"),
]

FEES = [
    ("Airtel Money", "1.5%", "Customer", 500, 30_000, 2_000_000, 2_000_000),
    ("TNM Mpamba", "1.5%", "Customer", 500, 22_500, 1_500_000, 1_500_000),
    ("Bank transfer", "0", "Company", 1_000, 0, 50_000_000, 20_000_000),
    ("Cash", "0", "Company", 100, 0, 500_000, 500_000),
    ("Card", "2.9%", "Customer", 1_000, 145_000, 5_000_000, 1_000_000),
]

STAFF = [
    ("STF-009", "Chikondi Mwale", "Super Admin", 6, "Unrestricted"),
    ("STF-003", "Tadala Msonthi", "Administrator", 6, "Unrestricted"),
    ("STF-004", "Linda Mhango", "Finance Officer", 5, "May verify and reconcile"),
    ("STF-002", "Blessings Tembo", "Collections Officer", 4, "May record cash and verify"),
    ("STF-006", "Yamikani Banda", "Auditor", 2, "Read-only"),
    ("STF-010", "Esther Mwale", "Credit Analyst", 1, "Read-only"),
]

CAPS = ["View payments", "Record a payment", "Verify a payment", "Configure methods",
        "Connect a provider", "Approve a refund", "Reconcile", "View audit log"]

GRANTS = {
    "Super Admin": [1, 1, 1, 1, 1, 1, 1, 1],
    "Administrator": [1, 1, 1, 1, 1, 1, 1, 1],
    "Finance Officer": [1, 1, 1, 0, 0, 0, 1, 1],
    "Collections Officer": [1, 1, 1, 0, 0, 0, 0, 0],
    "Auditor": [1, 0, 0, 0, 0, 0, 0, 1],
    "Credit Analyst": [1, 0, 0, 0, 0, 0, 0, 0],
}

REFUNDS = [
    ("RFD-2026-014", "PAY-2026-88403", "Limbani Mhango", 26_500, "Duplicate debit", "Approved", "Tadala Msonthi"),
    ("RFD-2026-013", "PAY-2026-88371", "Ruth Phiri", 12_000, "Wrong loan", "Under review", "Linda Mhango"),
    ("RFD-2026-012", "PAY-2026-88355", "Isaac Phiri", 4_500, "Overpayment", "Approved", "Tadala Msonthi"),
    ("RFD-2026-011", "PAY-2026-88320", "Thoko Phiri", 8_000, "Customer dispute", "Rejected", "Tadala Msonthi"),
]

CHANGES = [
    ("30 Oct 2026 · 08:02", "TNM Mpamba", "Method", "Enabled", "Disabled", "Tadala Msonthi"),
    ("29 Oct 2026 · 16:40", "PayChangu sandbox key", "Credential", "key…8a11", "key…22c4", "Chikondi Mwale"),
    ("29 Oct 2026 · 11:12", "Cash at branch limit", "Limit", "MK 250,000", "MK 500,000", "Tadala Msonthi"),
    ("28 Oct 2026 · 15:26", "Airtel Money fee", "Fee", "1.2%", "1.5%", "Chikondi Mwale"),
    ("27 Oct 2026 · 09:40", "Receipt prefix", "Configuration", "GR-", "RCPT-", "Tadala Msonthi"),
    ("26 Oct 2026 · 14:18", "Bank transfer instructions", "Method", "Old wording", "New wording", "Linda Mhango"),
    ("24 Oct 2026 · 10:02", "TNM webhook secret", "Credential", "rotated", "rotated", "Chikondi Mwale"),
    ("21 Oct 2026 · 08:55", "Daily transaction limit", "Limit", "MK 5,000,000", "MK 8,000,000", "Tadala Msonthi"),
]

RECEIPTS = [
    ("RCPT-2026-1204", "PAY-2026-88406", "Madalitso Mponda", 32_000, "30 Oct 2026 · 07:31", "Cash at branch", "Valid"),
    ("RCPT-2026-1203", "PAY-2026-88401", "Tadala Phiri", 7_500, "30 Oct 2026 · 06:14", "Cash at branch", "Valid"),
    ("RCPT-2026-1202", "PAY-2026-88396", "Chifundo Mponda", 48_000, "29 Oct 2026 · 17:20", "Airtel Money", "Valid"),
    ("RCPT-2026-1201", "PAY-2026-88390", "Ruth Phiri", 120_000, "29 Oct 2026 · 16:02", "TNM Mpamba", "Reissued"),
]

NOTIFS = [
    ("Successful payment", "SMS + email", "Customer", 402, "97.4%", 10),
    ("Pending payment", "SMS", "Customer", 8, "100%", 0),
    ("Failed payment", "SMS + email", "Customer", 6, "98.1%", 1),
    ("Payment receipt", "Email", "Customer", 402, "99.2%", 3),
    ("Overdue repayment", "SMS", "Customer", 38, "95.6%", 2),
    ("Staff payment alert", "In-app + email", "Finance", 14, "100%", 0),
]

DB_TABLES = [
    ("payment_methods", 6, "on", "public read for active methods"),
    ("payments", 412, "on", "staff read, customer own"),
    ("payment_receipts", 402, "on", "staff read, customer own"),
    ("repayments", 402, "on", "staff read, customer own"),
    ("repayment_allocations", 1206, "on", "staff read"),
    ("loans", 77, "on", "staff read, customer own"),
    ("customers", 60, "on", "customer self read"),
    ("payment_config", 24, "on", "staff read, admin write"),
    ("payment_webhooks", 1840, "on", "staff read"),
    ("payment_audit", 5124, "OFF", "none — through a definer function"),
]

API_LOG = [
    ("/v1/payments", "POST", 201, "242 ms", 4020, 0),
    ("/v1/payments/verify", "POST", 200, "186 ms", 1204, 2),
    ("/v1/webhooks/airtel", "POST", 200, "312 ms", 1840, 4),
    ("/v1/webhooks/mpamba", "POST", 502, "—", 208, 44),
    ("/v1/payments/status", "GET", 200, "128 ms", 6840, 1),
    ("/v1/receipts", "GET", 200, "164 ms", 1204, 0),
]

HOOKS = [
    ("Airtel Money", "payment.completed", "Delivered", 1840, 0, "142 ms"),
    ("Airtel Money", "payment.failed", "Delivered", 96, 0, "138 ms"),
    ("TNM Mpamba", "payment.completed", "Failing", 208, 44, "—"),
    ("PayChangu", "charge.success", "Delivered", 42, 0, "286 ms"),
    ("Bank import", "statement.ready", "Delivered", 96, 0, "1,240 ms"),
]

REPORTS = [
    ("Daily Payment Report", "Every payment received today, by method", 214),
    ("Weekly Payment Report", "Collections for the week, day by day", 1204),
    ("Monthly Payment Report", "The month to date, by method and provider", 5240),
    ("Payments by Method", "Volume and value for each method", 6),
    ("Payments by Provider", "Success rate and latency per provider", 4),
    ("Payments by Staff Member", "Cash recorded and verified by each officer", 18),
    ("Successful and Failed Payments", "Outcome split with reasons", 412),
    ("Payment Processing Fees", "What the rails cost us", 412),
    ("Unreconciled Payments", "Everything still unmatched", 12),
    ("Loan Repayment Collection", "Collections against the repayment book", 402),
]


# ============================================================== section 1 ===
def section1():
    s = []
    s.append(sub("1.1", "Total Configured Payment Methods", strip([
        ("Methods", "6"), ("Active", "4"), ("Disabled", "1"), ("Archived", "1")]) +
        kv([("Currencies", "MWK"), ("Default method", "Airtel Money"),
            ("Methods a customer may pick", "4 of 6"), ("Last change", "30 Oct 2026 · 08:02")]), badge="6 methods"))
    s.append(sub("1.2", "Active Payment Methods", table(
        ["Code", "Method", "Kind", "Provider"],
        [(m[0], m[1], m[2], m[9]) for m in METHODS if m[3] == "Active"], csv_name="active-methods"),
        wide=True, badge="4 active"))
    s.append(sub("1.3", "Disabled Payment Methods", note(
        "<b>Card payment is disabled</b> while the gateway account is in sandbox, and <b>Merchant till is "
        "archived</b> after the till was closed. Neither can be chosen by a customer.", "warn") + table(
        ["Code", "Method", "State", "Reason"],
        [("CRD", "Card payment", okb("Disabled"), "Gateway account still in sandbox"),
         ("MCH", "Merchant till", okb("Archived"), "Till closed on 14 Sep 2026")], csv_name="disabled"), wide=True))
    s.append(sub("1.4", "Connected Payment Services", table(
        ["Provider", "Kind", "State", "Mode", "Success"],
        [(p[0], p[1], okb(p[2]), p[3], p[6]) for p in PROVIDERS], csv_name="providers"), wide=True, badge="2 of 4 live"))
    s.append(sub("1.5", "Pending Payment Confirmations", table(
        ["Payment", "Method", "Customer", "Amount", "State"],
        [(t[0], t[2], t[3], money(t[5]), okb(t[6])) for t in TXNS if t[6] in ("Pending", "Unreconciled")],
        csv_name="pending", num_cols=(3,)), wide=True, badge="2 waiting"))
    s.append(sub("1.6", "Successful Payments", kv([
        ("Successful today", "402"),
        ("Value today", money(11_739_081)),
        ("Share of attempts", "97.6%"),
        ("Slowest confirmation", "312 ms · Airtel Money"),
    ]) + bars([("Airtel Money", 246, 402, "246"), ("TNM Mpamba", 96, 402, "96"),
               ("Bank transfer", 38, 402, "38"), ("Cash", 22, 402, "22")], "#1E9E6A")))
    s.append(sub("1.7", "Failed Payments", kv([
        ("Failed today", "6"),
        ("Value refused", money(41_500)),
        ("Most common", "Insufficient funds · 4 of 6"),
        ("Provider errors", "TNM Mpamba · 44 callbacks refused since 07:12"),
    ]) + '<div class="form-actions"><button class="btn btn-ghost" data-goto="s8">Open the failed transactions</button></div>'))
    s.append(sub("1.8", "Unreconciled Payments", note(
        "<b>12 payments are unreconciled</b> — 9 on TNM Mpamba, 2 on Airtel Money and 1 bank transfer. "
        "Each is listed in section 11 with the reason it could not be matched.", "warn") + kv([
            ("Unreconciled", "12"), ("Value", money(486_500)),
            ("Oldest", "28 Oct 2026"), ("Owner", "Linda Mhango · Finance"),
        ]), wide=True))
    s.append(sub("1.9", "Recent Payment Activity", table(
        ["Payment", "When", "Method", "Customer", "Amount", "State"],
        [(t[0], t[1], t[2], t[3], money(t[5]), okb(t[6])) for t in TXNS], csv_name="recent"), wide=True))
    return sec(1, "Payment Overview",
               "Every configured method, what is live and what is switched off, the connected services, pending "
               "confirmations, successes, failures, unreconciled money and the latest activity", "".join(s),
               "402 payments today")


# ============================================================== section 2 ===
def section2():
    s = []
    s.append(sub("2.1", "View All Payment Methods", table(
        ["Code", "Method", "Kind", "State", "Default", "Order", "Provider"],
        [(m[0], m[1], m[2], okb(m[3]), "Yes" if m[4] else "—", str(m[5]), m[9]) for m in METHODS],
        csv_name="methods"), wide=True, badge="6 methods"))
    s.append(sub("2.2", "Add a Payment Method",
                 form([("Code", "PCH"), ("Name", "PayChangu card"),
                       ("Kind", '<select><option>Mobile money</option><option>Bank</option><option>Cash</option>'
                                '<option>Gateway</option></select>'),
                       ("Provider", "PayChangu"), ("Display order", "7")],
                      "Add the method", "A new method starts disabled until a provider connection passes its test.")))
    s.append(sub("2.3", "Edit Payment Method Details",
                 form([("Name", "Airtel Money"), ("Kind", "Mobile money"),
                       ("Public description", "Pay from your Airtel Money wallet"),
                       ("Instructions", "Dial *211#, choose Pay Bill, enter the reference shown on your statement")],
                      "Save the details", "The public description and the instructions are what the customer sees.")
                 ))
    s.append(sub("2.4", "Enable or Disable a Payment Method", table(
        ["Method", "State", "Action"],
        [(m[1], okb(m[3]), '<button class="btn btn-ghost btn-sm" data-toggle-method="' + m[0] + '">' +
          ("Disable" if m[3] == "Active" else "Enable") + '</button>') for m in METHODS],
        csv_name="method-state"), wide=True))
    s.append(sub("2.5", "Set Default Payment Method", kv([
        ("Current default", "Airtel Money"),
        ("Shown first on", "The customer repayment screen"),
        ("Fallback order", "Airtel → TNM → Bank → Cash"),
        ("Changed by", "Tadala Msonthi · 12 Oct 2026"),
    ]) + '<div class="form-actions"><button class="btn btn-ghost" data-toast="Airtel Money is the default method">Keep Airtel Money</button>'
         '<button class="btn btn-ghost" data-toast="Default method changed — recorded in the audit trail">Set TNM Mpamba</button></div>'))
    s.append(sub("2.6", "Change Payment Method Display Order", table(
        ["Order", "Method"],
        [(str(m[5]), m[1]) for m in METHODS], csv_name="display-order"), wide=True,
        hint="Use the arrows in the live console to move a method; the order is saved on drop."))
    s.append(sub("2.7", "Set Payment Method Availability", checks([
        ("pass", "Airtel Money", "all customers, all branches", "Available"),
        ("pass", "TNM Mpamba", "all customers, all branches", "Available"),
        ("pass", "Bank transfer", "all customers", "Available"),
        ("pass", "Cash at branch", "four branches, counter only", "Available"),
        ("warn", "Card payment", "disabled while in sandbox", "Off"),
    ])))
    s.append(sub("2.8", "Set Minimum and Maximum Payment Amounts", table(
        ["Method", "Minimum", "Maximum", "Daily cap"],
        [(m[1], money(m[6]), money(m[7]), money(m[7] * 4)) for m in METHODS if m[3] != "Archived"],
        csv_name="limits", num_cols=(1, 2, 3)), wide=True))
    s.append(sub("2.9", "Set Payment Instructions",
                 kv([("Airtel Money", "Dial *211#, choose Pay Bill, business 8871, then your loan reference"),
                     ("TNM Mpamba", "Dial *444#, choose Pay Bill, code 5570, then your loan reference"),
                     ("Bank transfer", "NBS Bank · Golden Financial Services · 1002 4455 8899 · quote your loan reference"),
                     ("Cash", "Any branch, counter 1–4. Ask for a receipt and check the amount on it")]) +
                 form([("Instructions shown to customers", "Dial *211#, choose Pay Bill, business 8871, then your loan reference")],
                      "Save the instructions", "This text appears on the repayment screen and on every statement."), wide=True))
    s.append(sub("2.10", "Upload Payment Method Logo",
                 '<div class="thumbs"><div class="thumb"><div class="thumb-img">▤</div>'
                 '<div class="thumb-n">airtel-money.svg</div><div class="thumb-m">18 KB · 240×80</div></div>'
                 '<div class="thumb"><div class="thumb-img">▤</div><div class="thumb-n">tnm-mpamba.svg</div>'
                 '<div class="thumb-m">16 KB · 240×80</div></div>'
                 '<div class="thumb"><div class="thumb-img">▤</div><div class="thumb-n">bank-transfer.svg</div>'
                 '<div class="thumb-m">12 KB · 240×80</div></div></div>'
                 '<div class="form-actions"><button class="btn btn-ghost" data-toast="Choose a file to upload — SVG or PNG, 240×80">Upload a logo</button></div>',
                 wide=True))
    s.append(sub("2.11", "Archive Retired Payment Methods", note(
        "Archiving hides a method without deleting a single payment that used it. The merchant till was archived "
        "on 14 Sep 2026 and its 96 historical payments still point at it.", "gold") + table(
        ["Method", "Archived", "Payments kept", "Restorable"],
        [("Merchant till", "14 Sep 2026", "96", "Yes")], csv_name="archived"), wide=True))
    s.append(sub("2.12", "Payment Method Change History", table(
        ["When", "Method", "What changed", "Previous", "Updated", "By"],
        [(c[0], c[1], c[2], c[3], c[4], c[5]) for c in CHANGES], csv_name="method-history"), wide=True))
    return sec(2, "Payment Methods Management",
               "Every method, adding and editing one, enabling and disabling, the default, the display order, "
               "availability, limits, instructions, logos, archiving and the change history", "".join(s), "6 methods")


# ============================================================== section 3 ===
def section3():
    s = []
    s.append(sub("3.1", "Airtel Money Configuration", kv([
        ("State", pill("Active", "b-ok") + " · default method"),
        ("Provider", "Airtel Malawi"),
        ("API", "Collections v2 · https://openapi.airtel.africa"),
        ("Mode", "Production"),
        ("Fee", "1.5% · paid by the customer"),
        ("Last successful callback", "30 Oct 2026 · 08:12"),
    ]), badge="Connected"))
    s.append(sub("3.2", "TNM Mpamba Configuration", kv([
        ("State", pill("Active", "b-ok") + " · suspended 08:02"),
        ("Provider", "TNM"),
        ("API", "Mpamba collections v1"),
        ("Mode", "Production"),
        ("Fee", "1.5% · paid by the customer"),
        ("Last successful callback", "30 Oct 2026 · 07:12 · then 502s"),
    ]), badge="Failing"))
    s.append(sub("3.3", "Merchant or Business Account Details", table(
        ["Provider", "Merchant name", "Account type", "Settlement"],
        [("Airtel Malawi", "Golden Financial Services", "Business · collections", "T+1 to NBS 1002 4455 8899"),
         ("TNM", "Golden Financial Services", "Business · collections", "T+1 to NBS 1002 4455 8899"),
         ("PayChangu", "Golden Financial Services", "Merchant · sandbox", "Not settling")], csv_name="merchants"), wide=True))
    s.append(sub("3.4", "Merchant Code or Till Number", table(
        ["Provider", "Code", "Kind", "Verified"],
        [("Airtel Money", "8871", "Business code", okb("Verified")),
         ("TNM Mpamba", "5570", "Bill code", okb("Verified")),
         ("Merchant till", "99120", "Till · archived", okb("Archived"))], csv_name="merchant-codes"), wide=True))
    s.append(sub("3.5", "Payment Reference Requirements", kv([
        ("Format", "Loan reference, e.g. SL-2026-0418"),
        ("Accepted variations", "SL20260418, sl-2026-0418, 0418"),
        ("Rejected", "Anything that matches no active loan"),
        ("Fallback", "Phone number, matched to the customer’s open loan"),
        ("Case sensitive", "No"),
    ]) + note("A payment whose reference matches no loan becomes <b>unreconciled</b> and waits for a human — it is "
              "never guessed onto an account.", "gold")))
    s.append(sub("3.6", "Mobile Money API Connection", checks([
        ("pass", "Airtel collections", "token issued in 88 ms", "Connected"),
        ("warn", "TNM collections", "502 from the upstream", "Failing"),
        ("pass", "Callback endpoint", "/v1/webhooks/airtel · 200", "Connected"),
        ("fail", "TNM callback", "/v1/webhooks/mpamba · 502", "Failing"),
    ])))
    s.append(sub("3.7", "Payment Request Configuration", kv([
        ("Request timeout", "30 seconds"),
        ("Retries", "2 · exponential backoff"),
        ("Push to the customer", "USSD prompt, 60-second expiry"),
        ("Currency", "MWK only"),
        ("Idempotency key", "payment reference + amount + phone"),
    ])))
    s.append(sub("3.8", "Payment Confirmation Connection", checks([
        ("pass", "Airtel callback", "signature verified, 1,840 received today", "Pass"),
        ("fail", "TNM callback", "44 refused since 07:12", "Fail"),
        ("pass", "Polling fallback", "status checked every 2 minutes", "Pass"),
        ("pass", "Duplicate guard", "one payment per provider reference", "Pass"),
    ])))
    s.append(sub("3.9", "Transaction Status Monitoring", table(
        ["Payment", "Provider", "Provider status", "Ours", "Age"],
        [("PAY-2026-88408", "Bank transfer", "Awaiting statement", "Pending", "22 min"),
         ("PAY-2026-88405", "Airtel Money", "Completed", "Unreconciled", "1 h"),
         ("PAY-2026-88403", "TNM Mpamba", "Reversed", "Reversed", "1 h 30")], csv_name="status"), wide=True))
    s.append(sub("3.10", "Mobile Money Reconciliation", kv([
        ("Airtel", "412 provider transactions · 410 matched · 2 open"),
        ("TNM", "208 provider transactions · 196 matched · 9 open · 3 amount differences"),
        ("Unmatched value", money(486_500)),
        ("Owner", "Linda Mhango · Finance"),
        ("Run", "Daily 06:00, plus on demand"),
    ]) + '<div class="form-actions"><button class="btn btn-gold" data-toast="Mobile money reconciliation queued for both providers">Run the reconciliation</button></div>'))
    return sec(3, "Mobile Money Management",
               "Airtel Money and TNM Mpamba configuration, merchant details, the till codes, reference rules, the "
               "API and callback connections, status monitoring and reconciliation", "".join(s), "1 provider failing")


# ============================================================== section 4 ===
def section4():
    s = []
    s.append(sub("4.1", "Bank Name", kv([
        ("Primary bank", "NBS Bank"),
        ("Other banks accepted", "Standard Bank, National Bank, FDH, Ecobank"),
        ("Settlement account", "NBS · 1002 4455 8899"),
        ("Currency", "MWK"),
    ])))
    s.append(sub("4.2", "Account Name", kv([
        ("Account name", "Golden Financial Services Ltd"),
        ("Account type", "Business current"),
        ("Opened", "12 Apr 2021"),
        ("Verified", pill("Verified", "b-ok") + " against a bank letter, 14 Sep 2026"),
    ])))
    s.append(sub("4.3", "Account Number", kv([
        ("Number", "1002 4455 8899"),
        ("Shown to customers", "Yes, with the branch name"),
        ("Verification", "Checksum valid · last verified 02 Oct 2026"),
        ("Change requires", "Two administrators and a bank letter"),
    ])))
    s.append(sub("4.4", "Branch Name", kv([
        ("Branch", "NBS House, Victoria Avenue, Blantyre"),
        ("Branch code", "020"),
        ("SWIFT", "NBSLMWMW"),
        ("For customer transfers", "Quote the branch and the account name exactly"),
    ])))
    s.append(sub("4.5", "Branch Code or Routing Details", table(
        ["Field", "Value", "Used for"],
        [("Branch code", "020", "Domestic transfers"),
         ("SWIFT / BIC", "NBSLMWMW", "International transfers"),
         ("Sort code", "02-00-45", "Legacy standing orders")], csv_name="routing"), wide=True))
    s.append(sub("4.6", "Transfer Reference Instructions", note(
        "A customer must quote the <b>loan reference</b> in the transfer narrative. Without it the payment arrives "
        "with no way to match it and lands in the unreconciled queue until someone reads the statement line.", "gold") +
        kv([("Required in narrative", "SL-2026-0418 or the customer’s phone number"),
            ("Accepted", "Loan reference, phone number, or both"),
            ("Rejected", "“loan payment”, “repayment”, a name alone"),
            ("Example", "SL-2026-0418 REPAY OCT")])))
    s.append(sub("4.7", "Supported Currencies", table(
        ["Currency", "Accepted", "Converted", "Note"],
        [("MWK", "Yes", "—", "The settlement currency"),
         ("USD", "No", "—", "Ask the customer to pay in MWK"),
         ("ZAR", "No", "—", "Not supported on this account")], csv_name="currencies"), wide=True))
    s.append(sub("4.8", "Bank Payment Verification", checks([
        ("pass", "Statement import", "30 Oct 2026 · 96 lines", "Pass"),
        ("pass", "Amount match", "94 of 96 lines matched to a payment", "Pass"),
        ("warn", "Reference missing", "1 line with no reference", "Watch"),
        ("pass", "Duplicate guard", "no line imported twice", "Pass"),
    ]) + '<div class="form-actions"><button class="btn btn-ghost" data-toast="Statement import started — 96 lines">Import a statement</button></div>'))
    s.append(sub("4.9", "Bank Statement Import", table(
        ["Import", "Period", "Lines", "Matched", "State"],
        [("IMP-2026-1030", "30 Oct 2026", "96", "94", okb("Pass")),
         ("IMP-2026-1029", "29 Oct 2026", "104", "104", okb("Pass")),
         ("IMP-2026-1028", "28 Oct 2026", "88", "86", okb("Pass"))], csv_name="imports", num_cols=(2, 3)), wide=True))
    s.append(sub("4.10", "Bank Transfer Reconciliation", kv([
        ("Lines this month", "2,140"),
        ("Matched", "2,128 · 99.4%"),
        ("Unmatched", "12 · 1 bank, 11 mobile money"),
        ("Largest unmatched", money(250_000) + " · PAY-2026-88408"),
    ]) + bars([("Matched", 2128, 2140, "2,128"), ("Unmatched", 12, 2140, "12")], "#2F6FED")))
    return sec(4, "Bank Transfer Management",
               "The bank, account, number, branch and routing details, the reference rules, currencies, "
               "verification, statement import and reconciliation", "".join(s), "99.4% matched")


# ============================================================== section 5 ===
def section5():
    s = []
    s.append(sub("5.1", "Enable or Disable Cash Payments", kv([
        ("Cash at branch", pill("Active", "b-ok")),
        ("Branches accepting cash", "4 of 4"),
        ("Counter limit", money(500_000) + " per receipt"),
        ("Changed", "29 Oct 2026 · Tadala Msonthi"),
    ]) + '<div class="form-actions"><button class="btn btn-ghost" data-toast="Cash payments are enabled at all four branches">Keep enabled</button>'
         '<button class="btn btn-ghost" data-toast="Cash payments disabled — a second administrator must confirm">Disable</button></div>'))
    s.append(sub("5.2", "Authorized Cash-Receiving Staff", table(
        ["Officer", "Branch", "Limit", "Cash authority"],
        [("Linda Mhango", "Lilongwe", money(500_000), okb("Full")),
         ("Blessings Tembo", "Blantyre", money(300_000), okb("Full")),
         ("Yamikani Banda", "Mzuzu", money(300_000), okb("Full")),
         ("Esther Mwale", "Zomba", money(150_000), okb("Limited"))], csv_name="cash-staff"), wide=True))
    s.append(sub("5.3", "Cash Receipt Number Generation", kv([
        ("Format", "RCPT-2026-1204"),
        ("Prefix", "RCPT-"),
        ("Sequence", "Continues from 1204 · never reused"),
        ("Issued by", "The system, at the moment the cash is confirmed"),
        ("Gap policy", "A cancelled receipt keeps its number and shows as cancelled"),
    ])))
    s.append(sub("5.4", "Customer Payment Receipt", kv([
        ("Contents", "Receipt number, date, branch, customer, loan, amount, method, officer"),
        ("Delivery", "Printed at the counter and sent by SMS"),
        ("Verification", "A code on the receipt can be checked at /verify"),
        ("Template", "Cash receipt v3 · approved 12 Sep 2026"),
    ]) + '<div class="form-actions"><button class="btn btn-ghost" data-preview="Cash receipt RCPT-2026-1204">Preview a receipt</button></div>'))
    s.append(sub("5.5", "Cash Collection Records", table(
        ["Receipt", "Time", "Customer", "Amount", "Officer"],
        [(r[0], r[4], r[2], money(r[3]), "Linda Mhango") for r in RECEIPTS if r[5] == "Cash at branch"],
        csv_name="cash-collections", num_cols=(3,)), wide=True))
    s.append(sub("5.6", "Cash Handover Records", table(
        ["Date", "Officer", "Collected", "Handed to", "Counted by"],
        [("30 Oct 2026", "Linda Mhango", money(482_000), "NBS deposit slip 88213", "Tadala Msonthi"),
         ("29 Oct 2026", "Blessings Tembo", money(318_500), "NBS deposit slip 88190", "Linda Mhango"),
         ("28 Oct 2026", "Yamikani Banda", money(204_000), "NBS deposit slip 88171", "Linda Mhango")],
        csv_name="handovers", num_cols=(2,)), wide=True))
    s.append(sub("5.7", "Cash Collection Verification", checks([
        ("pass", "Receipt count", "142 receipts · 142 in the ledger", "Pass"),
        ("pass", "Amount total", money(1_004_500) + " collected", "Pass"),
        ("pass", "Handover match", "3 of 3 handovers tie to a deposit slip", "Pass"),
        ("warn", "Same-day banking", "1 handover banked the next morning", "Watch"),
    ])))
    s.append(sub("5.8", "Cash Reconciliation", kv([
        ("Collected today", money(482_000)),
        ("Banked today", money(482_000)),
        ("Difference", money(0)),
        ("Outstanding float", money(0)),
        ("Reconciled by", "Linda Mhango · 17:40"),
    ]) + '<div class="form-actions"><button class="btn btn-gold" data-toast="Cash reconciliation tied out to the cent">Reconcile today’s cash</button></div>'))
    s.append(sub("5.9", "Cash Collection Audit Trail", table(
        ["When", "Action", "Receipt", "Officer", "Detail"],
        [("30 Oct 2026 · 07:31", "Cash recorded", "RCPT-2026-1204", "Linda Mhango", money(32_000)),
         ("30 Oct 2026 · 07:32", "Receipt printed", "RCPT-2026-1204", "Linda Mhango", "Counter printer"),
         ("30 Oct 2026 · 17:40", "Handover recorded", "—", "Linda Mhango", money(482_000)),
         ("30 Oct 2026 · 17:52", "Handover verified", "—", "Tadala Msonthi", "Counted, no difference")],
        csv_name="cash-audit"), wide=True))
    return sec(5, "Cash Payment Management",
               "Whether cash is accepted, who may take it, how a receipt number is made, what the customer is "
               "given, the collections and handovers, verification, reconciliation and the audit trail",
               "".join(s), "4 branches")


# ============================================================== section 6 ===
def section6():
    s = []
    s.append(sub("6.1", "Connected Payment Providers", table(
        ["Provider", "Kind", "State", "Mode", "Latency"],
        [(p[0], p[1], okb(p[2]), p[3], str(p[5]) + " ms" if p[5] else "—") for p in PROVIDERS],
        csv_name="gateways"), wide=True, badge="2 live"))
    s.append(sub("6.2", "Add Payment Provider Connection",
                 form([("Provider", "PayChangu"), ("Kind", '<select><option>Gateway</option><option>Mobile money</option>'
                                                          '<option>Bank</option></select>'),
                       ("Mode", '<select><option>Sandbox</option><option>Production</option></select>'),
                       ("Base URL", "https://api.paychangu.com/v1")],
                      "Add the connection", "A new connection stays in sandbox until its first test passes.")))
    s.append(sub("6.3", "Provider API Configuration", table(
        ["Provider", "Base URL", "Timeout", "Retries"],
        [("Airtel Money", "https://openapi.airtel.africa", "30 s", "2"),
         ("TNM Mpamba", "https://api.tnm.co.mw/mpamba", "30 s", "2"),
         ("PayChangu", "https://api.paychangu.com/v1", "20 s", "3")], csv_name="provider-api"), wide=True))
    s.append(sub("6.4", "Merchant Account Configuration", kv([
        ("Airtel merchant", "Golden Financial Services · business 8871"),
        ("TNM merchant", "Golden Financial Services · bill 5570"),
        ("Settlement", "T+1 to NBS 1002 4455 8899"),
        ("Statement descriptor", "GOLDENFIN"),
    ])))
    s.append(sub("6.5", "API Credentials Configuration", table(
        ["Credential", "Provider", "Stored", "Rotated", "State"],
        [("Client ID and secret", "Airtel Money", "Server only", "12 Jul 2026", okb("Valid")),
         ("API key", "TNM Mpamba", "Server only", "01 Aug 2026", okb("Expired")),
         ("Public and secret key", "PayChangu", "Server only", "29 Oct 2026", okb("Sandbox")),
         ("Webhook secret", "All", "Server only", "24 Oct 2026", okb("Valid"))],
        csv_name="credentials"), wide=True))
    s.append(sub("6.6", "Webhook Endpoint Configuration", table(
        ["Endpoint", "Provider", "Method", "State"],
        [("/v1/webhooks/airtel", "Airtel Money", "POST", okb("Live")),
         ("/v1/webhooks/mpamba", "TNM Mpamba", "POST", okb("Failing")),
         ("/v1/webhooks/paychangu", "PayChangu", "POST", okb("Sandbox")),
         ("/v1/webhooks/bank", "NBS import hook", "POST", okb("Live"))], csv_name="webhooks"), wide=True))
    s.append(sub("6.7", "Webhook Signature Verification", checks([
        ("pass", "Airtel", "HMAC-256 over the raw body", "Verified"),
        ("pass", "PayChangu", "HMAC-256 with a 5-minute window", "Verified"),
        ("fail", "TNM", "signature valid but the upstream is 502", "Refused"),
        ("pass", "Replay guard", "timestamp and nonce checked", "Verified"),
    ])))
    s.append(sub("6.8", "Provider Connection Health", table(
        ["Provider", "Health", "Success (30 d)", "Errors"]
        , [(p[0], okb(p[2]), p[6], str(p[5]) + " ms" if p[5] else "—") for p in PROVIDERS],
        csv_name="provider-health"), wide=True))
    s.append(sub("6.9", "Provider Sandbox or Test Mode", kv([
        ("In sandbox", "PayChangu"),
        ("Sandbox behaviour", "No real money moves; callbacks are simulated"),
        ("Test card", "4242 4242 4242 4242"),
        ("Promotion", "Requires a passed test and a second approver"),
    ])))
    s.append(sub("6.10", "Production Connection Status", table(
        ["Provider", "Production", "Since", "Approved by"],
        [("Airtel Money", okb("Live"), "12 Apr 2026", "Chikondi Mwale"),
         ("TNM Mpamba", okb("Suspended"), "30 Oct 2026", "Tadala Msonthi"),
         ("PayChangu", okb("Not in production"), "—", "—")], csv_name="production"), wide=True))
    s.append(sub("6.11", "Connection Test Results", checks([
        ("pass", "Airtel Money", "token, callback and status all answered", "Pass"),
        ("fail", "TNM Mpamba", "502 on the callback route", "Fail"),
        ("pass", "PayChangu", "sandbox charge accepted", "Pass"),
        ("pass", "NBS import", "statement directory readable", "Pass"),
    ]) + '<div class="form-actions"><button class="btn btn-gold" data-run-tests>Test every provider</button></div>',
        wide=True))
    s.append(sub("6.12", "Disconnect or Disable a Provider", note(
        "Disconnecting stops new requests and callbacks for that provider. Payments already recorded keep their "
        "provider reference and stay readable — nothing is deleted.", "gold") + kv([
            ("Current state", "TNM Mpamba suspended at 08:02 today"),
            ("Payments affected", "0 new · 208 historical retained"),
            ("Who may disconnect", "Super Admin, Administrator"),
        ]) + '<div class="form-actions"><button class="btn btn-ghost" data-toast="Reconnect requested — the provider must pass a test first">Reconnect TNM Mpamba</button></div>',
        wide=True))
    return sec(6, "Payment Gateway Connections",
               "The providers, adding one, the API and merchant configuration, credentials, webhooks and their "
               "signatures, health, sandbox and production state, test results and disconnection", "".join(s),
               "1 provider failing")


# ============================================================== section 7 ===
def section7():
    s = []
    s.append(sub("7.1", "Payment Methods Displayed to Customers", table(
        ["#", "Method", "Shown", "Note"],
        [(str(m[5]), m[1], okb("Shown" if m[3] == "Active" else "Hidden"),
          "Default" if m[4] else "—") for m in METHODS], csv_name="customer-methods"), wide=True))
    s.append(sub("7.2", "Customer Payment Instructions",
                 kv([("Where they appear", "Repayment screen, statement, SMS receipt"),
                     ("Airtel", "Dial *211#, Pay Bill, business 8871, your reference"),
                     ("TNM", "Dial *444#, Pay Bill, code 5570, your reference"),
                     ("Bank", "NBS 1002 4455 8899, quote your loan reference")]) +
                 '<button class="btn btn-ghost" data-toast="Instructions preview opened">Preview what the customer sees</button>'))
    s.append(sub("7.3", "Loan Repayment Method Selection", kv([
        ("Screen", "/portal/pay"),
        ("Preselected", "Airtel Money · the default"),
        ("Choices offered", "4 of 6 · card and till hidden"),
        ("Remembered", "The last method the customer used"),
    ])))
    s.append(sub("7.4", "Payment Reference Generation", kv([
        ("Format", "The loan reference, e.g. SL-2026-0418"),
        ("Also accepted", "Phone number"),
        ("Uniqueness", "One open loan per customer per product"),
        ("Shown", "On the screen, in the SMS and on the receipt"),
        ("Copied to clipboard", "One tap on the payment screen"),
    ])))
    s.append(sub("7.5", "Customer Payment Confirmation", checks([
        ("pass", "SMS on success", "sent within 8 seconds", "402 today"),
        ("pass", "Email on success", "sent within 30 seconds", "398 today"),
        ("warn", "SMS failures", "10 messages not delivered", "Watch"),
        ("pass", "Duplicate suppression", "one message per payment", "Pass"),
    ])))
    s.append(sub("7.6", "Payment Receipt Display", kv([
        ("On screen", "Immediately after confirmation"),
        ("Downloadable", "PDF, from the portal and from the SMS link"),
        ("Contents", "Receipt number, date, loan, amount, method, balance after"),
        ("Template", "Customer receipt v3"),
    ]) + '<div class="form-actions"><button class="btn btn-ghost" data-preview="Customer payment receipt">Preview the receipt</button></div>'))
    s.append(sub("7.7", "Payment Status Display", table(
        ["Status the customer sees", "Meaning", "What we show"],
        [("Pending", "The provider has not confirmed yet", "Amber, “we are checking”"),
         ("Successful", "Money received and allocated", "Green, balance updated"),
         ("Failed", "The provider refused it", "Red, what to try next"),
         ("Cancelled", "The customer stopped it", "Grey, nothing was taken")], csv_name="status-display"), wide=True))
    s.append(sub("7.8", "Failed Payment Guidance", note(
        "A failed payment always tells the customer what to do next — not just that it failed.", "gold") +
        table(["Reason", "What the customer is told"],
              [("Insufficient funds", "Top up your wallet and try again — nothing was taken"),
               ("Wrong reference", "Use the loan reference on your statement"),
               ("Provider timeout", "Wait 5 minutes, then check your statement before paying again"),
               ("Amount outside the limit", "The minimum is MK 500 and the maximum MK 2,000,000")],
              csv_name="failed-guidance"), wide=True))
    s.append(sub("7.9", "Customer Payment Notifications", table(
        ["Event", "Channel", "Template", "Sent today"],
        [("Payment received", "SMS + email", "PAY-OK-01", "402"),
         ("Payment pending", "SMS", "PAY-WAIT-02", "8"),
         ("Payment failed", "SMS + email", "PAY-FAIL-03", "6"),
         ("Receipt ready", "Email", "PAY-RCPT-04", "402")], csv_name="customer-notifs", num_cols=(3,)), wide=True))
    s.append(sub("7.10", "Mobile-Friendly Payment Interface", checks([
        ("pass", "Repayment screen", "one column at 360 px", "Pass"),
        ("pass", "Method picker", "tap targets 44 px", "Pass"),
        ("pass", "Reference", "copy button and large type", "Pass"),
        ("warn", "Receipt PDF", "downloads, but the button wraps", "Review"),
    ]) + kv([("Tested on", "360 px, 390 px, 768 px"), ("Last check", "30 Oct 2026 · 08:04")])))
    return sec(7, "Customer Payment Experience",
               "Which methods a customer sees, the instructions, choosing a method, the reference, confirmation, "
               "receipts, status, failure guidance, notifications and the mobile interface", "".join(s), "4 methods shown")


# ============================================================== section 8 ===
def section8():
    s = []
    s.append(sub("8.1", "All Payment Transactions", table(
        ["Payment", "When", "Method", "Customer", "Amount", "State"],
        [(t[0], t[1], t[2], t[3], money(t[5]), okb(t[6])) for t in TXNS], csv_name="transactions"),
        wide=True, badge="412 today"))
    def pick(state):
        rows = [(t[0], t[1], t[3], money(t[5]), t[7]) for t in TXNS if t[6] == state]
        return table(["Payment", "When", "Customer", "Amount", "Provider ref"], rows,
                     csv_name=state.lower()) if rows else note("Nothing in this state right now.", "gold")
    s.append(sub("8.2", "Pending Transactions",
                 pick("Pending") + kv([("Count", "4"), ("Value", money(96_000)),
                                       ("Oldest", "22 minutes"), ("Auto-expiry", "60 minutes")])))
    s.append(sub("8.3", "Successful Transactions",
                 pick("Successful") + kv([("Count", "402"), ("Value", money(11_739_081)),
                                          ("Median confirmation", "142 ms")])))
    s.append(sub("8.4", "Failed Transactions",
                 pick("Failed") + note("Every failure carries the provider code and the reason a customer was shown.", "gold")))
    s.append(sub("8.5", "Cancelled Transactions",
                 pick("Cancelled") + kv([("Reason", "The customer dismissed the USSD prompt"),
                                         ("Money moved", "None")])))
    s.append(sub("8.6", "Reversed Transactions",
                 pick("Reversed") + kv([("Count", "3"), ("Value", money(41_000)),
                                        ("Why", "Duplicate debit, provider corrected")])))
    s.append(sub("8.7", "Duplicate Transaction Detection", checks([
        ("pass", "Same provider reference", "blocked by a unique index", "Pass"),
        ("pass", "Same reference and amount within 10 minutes", "flagged for review", "Pass"),
        ("warn", "Same customer, two payments in a minute", "2 flagged today", "Watch"),
        ("pass", "Duplicate receipts", "one receipt per payment", "Pass"),
    ])))
    s.append(sub("8.8", "Transaction Reference Search",
                 form([("Payment or provider reference", "PAY-2026-88410")], "Search the register",
                      "Search matches our reference, the provider reference and the receipt number."),))
    s.append(sub("8.9", "Customer and Loan Search",
                 form([("Customer name or phone", "Chifundo Mponda"), ("Loan reference", "SL-2026-0418")],
                      "Find the payments", "Returns every payment on the customer and on each of their loans.")))
    s.append(sub("8.10", "Transaction Details", kv([
        ("Payment", "PAY-2026-88410"),
        ("Customer", "Chifundo Mponda · +265 999 441 220"),
        ("Loan", "SL-2026-0418 · salary loan · 7 of 12 instalments paid"),
        ("Amount", money(48_000) + " · fee " + money(720) + " · net " + money(47_280)),
        ("Method", "Airtel Money · provider ref AM-77120934"),
        ("Allocated", "Principal " + money(31_400) + " · interest " + money(15_880) + " · fees " + money(720)),
        ("State", pill("Successful", "b-ok") + " · receipt RCPT-2026-1202"),
    ]), wide=True))
    s.append(sub("8.11", "Provider Transaction Reference", table(
        ["Payment", "Provider", "Provider reference", "Verified"],
        [(t[0], t[2], t[7], okb("Verified") if t[7] != "—" else okb("Pending")) for t in TXNS if t[7] != "—"],
        csv_name="provider-refs"), wide=True))
    s.append(sub("8.12", "Payment Error Details", table(
        ["Payment", "Provider code", "Message", "What the customer saw"],
        [("PAY-2026-88407", "MONEY_INSUFFICIENT", "Wallet balance too low", "Top up and try again"),
         ("PAY-2026-88402", "USER_CANCELLED", "Prompt dismissed", "Nothing was taken"),
         ("PAY-2026-88403", "DUPLICATE_DEBIT", "Same reference already posted", "We reversed it — see RFD-2026-014")],
        csv_name="errors"), wide=True))
    return sec(8, "Payment Transaction Monitoring",
               "Every transaction by state, duplicate detection, search by reference, customer or loan, the full "
               "detail of one payment, the provider reference and the error behind a failure", "".join(s),
               "412 today · 6 failed")


# ============================================================== section 9 ===
def section9():
    s = []
    s.append(sub("9.1", "Manual Payment Verification",
                 form([("Payment reference", "PAY-2026-88408"), ("Amount received", "250000"),
                       ("Provider reference", "NBS-88123")],
                      "Verify the payment", "Manual verification needs a second signature above MK 100,000."),))
    s.append(sub("9.2", "Automatic Payment Confirmation", checks([
        ("pass", "Callback received", "1,840 Airtel callbacks today", "Pass"),
        ("pass", "Reference matched", "matched to an open loan automatically", "97.6%"),
        ("warn", "Fallback polling", "status checked every 2 minutes", "Watch"),
        ("fail", "TNM callbacks", "44 refused since 07:12", "Fail"),
    ])))
    s.append(sub("9.3", "Provider Confirmation Verification", table(
        ["Provider", "Confirmation", "Signature", "Latency"],
        [("Airtel Money", "Callback + status poll", okb("Verified"), "312 ms"),
         ("TNM Mpamba", "Callback + status poll", okb("Failing"), "—"),
         ("PayChangu", "Webhook + charge lookup", okb("Sandbox"), "286 ms")],
        csv_name="provider-confirm"), wide=True))
    s.append(sub("9.4", "Transaction Reference Validation", checks([
        ("pass", "Our reference", "format and checksum checked", "Pass"),
        ("pass", "Provider reference", "unique across the register", "Pass"),
        ("pass", "Loan reference", "must match an open loan", "Pass"),
        ("warn", "Free-text reference", "2 payments with no usable reference", "Watch"),
    ])))
    s.append(sub("9.5", "Amount Verification", kv([
        ("Received", money(48_000)),
        ("Expected instalment", money(48_000)),
        ("Fee deducted", money(720)),
        ("Net allocated", money(47_280)),
        ("Difference", money(0)),
    ]) + note("A payment whose amount differs from the instalment is accepted and allocated on account — it is "
              "never silently rounded to the schedule.", "gold")))
    s.append(sub("9.6", "Customer and Loan Matching", checks([
        ("pass", "By reference", "402 of 412 matched on the first pass", "98%"),
        ("warn", "By phone", "8 matched through the customer’s phone", "Watch"),
        ("fail", "No match", "2 could not be matched", "Fail"),
        ("pass", "Multiple loans", "the oldest open loan is chosen and flagged", "Pass"),
    ])))
    s.append(sub("9.7", "Duplicate Receipt Prevention", kv([
        ("Rule", "One receipt per payment reference"),
        ("Enforced by", "A unique index on payment_receipts.payment_id"),
        ("Attempts blocked (30 d)", "4"),
        ("Reissue", "Creates a new number and marks the old one reissued"),
    ])))
    s.append(sub("9.8", "Verification Approval Workflow", table(
        ["Amount", "Who verifies", "Second signature"],
        [("Up to MK 100,000", "Finance Officer or Collections Officer", "No"),
         ("MK 100,000 – 500,000", "Finance Officer", "Administrator"),
         ("Above MK 500,000", "Administrator", "Super Admin"),
         ("Any manual override", "Administrator", "Super Admin")], csv_name="verification-rules"), wide=True))
    s.append(sub("9.9", "Verification History", table(
        ["When", "Payment", "Verified by", "Method", "Outcome"],
        [("30 Oct 2026 · 08:14", "PAY-2026-88410", "Automatic", "Callback", okb("Successful")),
         ("30 Oct 2026 · 07:58", "PAY-2026-88408", "Linda Mhango", "Manual · statement", okb("Pending")),
         ("30 Oct 2026 · 07:20", "PAY-2026-88405", "Linda Mhango", "Manual", okb("Unreconciled")),
         ("30 Oct 2026 · 06:18", "PAY-2026-88401", "Blessings Tembo", "Cash", okb("Successful"))],
        csv_name="verification-history"), wide=True))
    s.append(sub("9.10", "Rejected Payment Records", table(
        ["Payment", "Why it was rejected", "By", "When"],
        [("PAY-2026-88377", "Amount did not match the advice", "Linda Mhango", "29 Oct 2026"),
         ("PAY-2026-88364", "Duplicate of PAY-2026-88355", "Tadala Msonthi", "28 Oct 2026")],
        csv_name="rejected"), wide=True))
    return sec(9, "Payment Verification",
               "Manual and automatic confirmation, provider verification, reference and amount checks, matching to "
               "a customer and loan, duplicate prevention, the approval workflow and the history", "".join(s),
               "97.6% automatic")


# ============================================================= section 10 ===
def section10():
    s = []
    s.append(sub("10.1", "Connect Payments to Customer Accounts", kv([
        ("Connected today", "402 of 402 successful payments"),
        ("By reference", "394"), ("By phone", "8"), ("Manual", "2"),
        ("Unconnected", "2 · waiting on a reference"),
    ])))
    s.append(sub("10.2", "Match Payments to Active Loans", table(
        ["Loan", "Customer", "Product", "Instalments", "Open balance"],
        [("SL-2026-0418", "Chifundo Mponda", "Salary loan", "7 of 12", money(240_000)),
         ("BB-2026-0233", "Ruth Phiri", "Business boost", "4 of 18", money(1_680_000)),
         ("AF-2026-0104", "Patrick Zulu", "Asset finance", "9 of 24", money(2_250_000)),
         ("GL-2026-0071", "Thoko Phiri", "Group lending", "2 of 6", money(75_000))], csv_name="loans"), wide=True))
    s.append(sub("10.3", "Allocate Payments to Repayments", table(
        ["Payment", "Amount", "Allocated", "Rule"],
        [("PAY-2026-88410", money(48_000), "1 instalment + fee", "Oldest unpaid first"),
         ("PAY-2026-88409", money(120_000), "2 instalments", "Oldest unpaid first"),
         ("PAY-2026-88406", money(32_000), "Part instalment", "Partial payment on account")],
        csv_name="allocations", num_cols=(1,)), wide=True))
    s.append(sub("10.4", "Principal Allocation", kv([
        ("Today", money(8_412_600)),
        ("Share of collections", "71.6%"),
        ("Rule", "Principal first on arrears, then interest"),
        ("Updated", "loans.balance_principal on every allocation"),
    ]) + bars([("Principal", 8412, 11739, "8.41M"), ("Interest", 2860, 11739, "2.86M"),
               ("Fees and penalties", 467, 11739, "467k")], "#2F6FED")))
    s.append(sub("10.5", "Interest Allocation", kv([
        ("Today", money(2_860_400)),
        ("Share of collections", "24.4%"),
        ("Rule", "Interest on the current instalment, then arrears"),
    ])))
    s.append(sub("10.6", "Fees and Penalties Allocation", kv([
        ("Today", money(466_081)),
        ("Share", "4.0%"),
        ("Routes to", "The Fees & Penalties module, one line per charge"),
        ("Penalties", money(38_500) + " of that"),
    ])))
    s.append(sub("10.7", "Outstanding Balance Updates", table(
        ["Loan", "Before", "Paid", "After"],
        [("SL-2026-0418", money(288_000), money(48_000), money(240_000)),
         ("BB-2026-0233", money(1_800_000), money(120_000), money(1_680_000))],
        csv_name="balance-updates", num_cols=(1, 2, 3)), wide=True))
    s.append(sub("10.8", "Repayment Schedule Updates", checks([
        ("pass", "Instalment marked paid", "instalment 7 of SL-2026-0418", "Pass"),
        ("pass", "Next due date", "moved to 30 Nov 2026", "Pass"),
        ("pass", "Partial payment", "instalment 3 left part-paid", "Pass"),
        ("warn", "Schedule recalculated", "1 loan recalculated after a reversal", "Watch"),
    ])))
    s.append(sub("10.9", "Loan Balance Recalculation", kv([
        ("Recalculated today", "12 loans"),
        ("Trigger", "A payment, a reversal or a schedule change"),
        ("Method", "Sum of the schedule against the allocation table"),
        ("Mismatches", "0"),
    ])))
    s.append(sub("10.10", "Repayment Receipt Generation", table(
        ["Receipt", "Payment", "Customer", "Amount", "State"],
        [(r[0], r[1], r[2], money(r[3]), okb(r[6])) for r in RECEIPTS], csv_name="receipts", num_cols=(3,)), wide=True))
    s.append(sub("10.11", "Failed Allocation Alerts", note(
        "<b>2 payments could not be allocated</b> — both are in the unreconciled queue with the reason attached, "
        "and neither touched a loan balance.", "warn") + table(
        ["Payment", "Why", "Owner", "Age"],
        [("PAY-2026-88405", "Reference matched an archived loan", "Linda Mhango", "1 h"),
         ("PAY-2026-88408", "Still pending at the bank", "Linda Mhango", "22 min")], csv_name="allocation-alerts"),
        wide=True))
    s.append(sub("10.12", "Allocation History", table(
        ["When", "Payment", "Loan", "Principal", "Interest", "Fees"],
        [("30 Oct 2026 · 08:12", "PAY-2026-88410", "SL-2026-0418", money(31_400), money(15_880), money(720)),
         ("30 Oct 2026 · 08:07", "PAY-2026-88409", "BB-2026-0233", money(86_400), money(31_800), money(1_800)),
         ("30 Oct 2026 · 07:31", "PAY-2026-88406", "SL-2026-0392", money(24_000), money(8_000), money(0))],
        csv_name="allocation-history", num_cols=(3, 4, 5)), wide=True))
    return sec(10, "Loan Repayment Connection",
                "How a payment reaches a customer, a loan and an instalment — principal, interest, fees, the "
                "balance and schedule updates, recalculation, receipts, allocation failures and the history",
                "".join(s), "402 allocated today")


# ============================================================= section 11 ===
def section11():
    s = []
    s.append(sub("11.1", "Reconciliation Dashboard", strip([
        ("Matched", "1,048"), ("Open", "12"), ("Value open", money(486_500)), ("Last run", NOW)]) +
        bars([(r[0], r[2], 412, str(r[2])) for r in RECON]) +
        '<button class="btn btn-gold" data-run-recon style="margin-top:8px">Run the reconciliation</button>', wide=True,
        badge="96.9% matched"))
    s.append(sub("11.2", "Match Provider Transactions to Records", table(
        ["Provider", "Provider txns", "Matched", "Open", "State"],
        [(r[0], str(r[1]), str(r[2]), str(r[3]), okb(r[5])) for r in RECON], csv_name="provider-recon",
        num_cols=(1, 2, 3)), wide=True))
    s.append(sub("11.3", "Match Bank Statements to Payments", checks([
        ("pass", "Statement 30 Oct", "96 lines · 94 matched", "Pass"),
        ("warn", "Line without a reference", "1 line · MK 250,000", "Watch"),
        ("pass", "Duplicate lines", "none", "Pass"),
    ]) + '<div class="form-actions"><button class="btn btn-ghost" data-toast="Statement matched — 94 of 96 lines">Match now</button></div>'))
    s.append(sub("11.4", "Match Cash Receipts to Collections", checks([
        ("pass", "142 receipts", "142 in the ledger", "Pass"),
        ("pass", "Handovers", "3 of 3 tie to a deposit slip", "Pass"),
        ("pass", "Difference", money(0), "Pass"),
    ])))
    s.append(sub("11.5", "Identify Missing Transactions", note(
        "A provider shows a completed transaction that has no payment on our side. These are the most urgent "
        "reconciliation item: the customer has paid and the loan has not moved.", "warn") + table(
        ["Provider", "Provider ref", "Amount", "Date", "Age"],
        [("Airtel Money", "AM-77120780", money(18_000), "29 Oct 2026", "1 day"),
         ("Airtel Money", "AM-77120665", money(64_000), "28 Oct 2026", "2 days")],
        csv_name="missing", num_cols=(2,)), wide=True))
    s.append(sub("11.6", "Identify Duplicate Transactions", table(
        ["Payment", "Twin", "Amount", "Detected"],
        [("PAY-2026-88355", "PAY-2026-88354", money(4_500), "29 Oct 2026"),
         ("PAY-2026-88403", "PAY-2026-88398", money(26_500), "30 Oct 2026")],
        csv_name="duplicates", num_cols=(2,)), wide=True))
    s.append(sub("11.7", "Identify Amount Differences", table(
        ["Payment", "Expected", "Received", "Difference"],
        [("PAY-2026-88396", money(48_000), money(47_000), money(-1_000)),
         ("PAY-2026-88390", money(120_000), money(121_500), money(1_500))],
        csv_name="differences", num_cols=(1, 2, 3)), wide=True))
    s.append(sub("11.8", "Unmatched Payment Records", table(
        ["Payment", "Method", "Amount", "Why it is unmatched"],
        [("PAY-2026-88405", "Airtel Money", money(9_500), "Reference matched an archived loan"),
         ("PAY-2026-88408", "Bank transfer", money(250_000), "Waiting on the bank statement"),
         ("PAY-2026-88371", "TNM Mpamba", money(12_000), "No reference in the payment")],
        csv_name="unmatched", num_cols=(2,)), wide=True, badge="12 open"))
    s.append(sub("11.9", "Reconciliation Adjustments", table(
        ["Adjustment", "Payment", "Amount", "Reason", "Approved by"],
        [("ADJ-2026-041", "PAY-2026-88396", money(1_000), "Short payment accepted", "Tadala Msonthi"),
         ("ADJ-2026-040", "PAY-2026-88390", money(1_500), "Overpayment held on account", "Tadala Msonthi")],
        csv_name="adjustments", num_cols=(2,)), wide=True))
    s.append(sub("11.10", "Reconciliation Approval", kv([
        ("Daily reconciliation", "Approved by Linda Mhango at 17:40"),
        ("Open items carried", "12"),
        ("Second approval above", money(500_000)),
        ("Approver", "Tadala Msonthi · Administrator"),
    ]) + '<div class="form-actions"><button class="btn btn-ghost" data-toast="Today’s reconciliation sent for approval">Send for approval</button></div>'))
    s.append(sub("11.11", "Daily Reconciliation Summary", svg_bars(
        ["24", "25", "26", "27", "28", "29", "30"], [100, 98, 99, 97, 96, 99, 97],
        colour="#1E9E6A", unit="Share of transactions matched, per day · last seven days") + kv([
            ("Today", "96.9% matched"), ("Week average", "98.0%"),
            ("Worst day", "28 Oct 2026 · 96%"), ("Open value", money(486_500)),
        ]), wide=True))
    s.append(sub("11.12", "Reconciliation Audit Trail", table(
        ["When", "Action", "By", "Detail"],
        [("30 Oct 2026 · 08:20", "Reconciliation run", "System", "1,060 provider transactions"),
         ("30 Oct 2026 · 08:22", "12 items left open", "System", money(486_500)),
         ("29 Oct 2026 · 17:40", "Daily reconciliation approved", "Linda Mhango", "11 items carried"),
         ("29 Oct 2026 · 17:44", "Adjustment ADJ-2026-040", "Tadala Msonthi", money(1_500))],
        csv_name="recon-audit"), wide=True))
    return sec(11, "Payment Reconciliation",
                "The reconciliation dashboard, matching providers, bank lines and cash receipts, missing, "
                "duplicate and differing transactions, unmatched records, adjustments, approval, the daily "
                "summary and the audit trail", "".join(s), "96.9% matched")


# ============================================================= section 12 ===
def section12():
    s = []
    s.append(sub("12.1", "Payment Processing Fees", table(
        ["Method", "Rate", "Who pays", "Minimum", "Maximum"],
        [(f[0], f[1], f[2], money(f[3]), money(f[5])) for f in FEES], csv_name="fees", num_cols=(3, 4)), wide=True))
    s.append(sub("12.2", "Customer-Paid Fees", kv([
        ("Airtel Money", "1.5% of the amount, capped at " + money(30_000)),
        ("TNM Mpamba", "1.5%, capped at " + money(22_500)),
        ("Card", "2.9%, capped at " + money(145_000)),
        ("Disclosed", "On the payment screen before the customer confirms"),
        ("Collected today", money(174_500)),
    ])))
    s.append(sub("12.3", "Company-Paid Fees", kv([
        ("Bank transfer", "Absorbed by the company · " + money(0) + " to the customer"),
        ("Cash", "No fee"),
        ("Cost to the business (30 d)", money(38_400) + " in bank charges"),
    ])))
    s.append(sub("12.4", "Minimum Payment Amount", table(
        ["Method", "Minimum", "Why"],
        [(f[0], money(f[3]), "Below this the rail costs more than the payment") for f in FEES],
        csv_name="minimums", num_cols=(1,)), wide=True))
    s.append(sub("12.5", "Maximum Payment Amount", table(
        ["Method", "Maximum", "Daily cap"],
        [(f[0], money(f[5]), money(f[6])) for f in FEES], csv_name="maximums", num_cols=(1, 2)), wide=True))
    s.append(sub("12.6", "Daily Transaction Limits", kv([
        ("Per customer", money(8_000_000) + " across all methods"),
        ("Per method", "See the maximum above"),
        ("Raised", "21 Oct 2026 · from " + money(5_000_000)),
        ("Breaches today", "0"),
    ])))
    s.append(sub("12.7", "Provider-Specific Limits", table(
        ["Provider", "Per transaction", "Per day", "Note"],
        [("Airtel Money", money(2_000_000), money(6_000_000), "Set by the provider"),
         ("TNM Mpamba", money(1_500_000), money(4_000_000), "Set by the provider"),
         ("PayChangu", money(5_000_000), money(10_000_000), "Sandbox figure")],
        csv_name="provider-limits", num_cols=(1, 2)), wide=True))
    s.append(sub("12.8", "Fee Calculation Rules", note(
        "The fee is calculated on the <b>gross</b> amount, rounded to the nearest kwacha, taken before "
        "allocation. Principal, interest and fees are then allocated on the net figure.", "gold") +
        kv([("Rounding", "Nearest MWK"), ("Applied", "At confirmation, never re-calculated later"),
            ("Refunded", "Yes, if the payment is reversed in full"),
            ("Stored on", "Every payment row, so history stays exact")]), wide=True))
    s.append(sub("12.9", "Fee Change History", table(
        ["When", "Method", "Previous", "Updated", "By", "Why"],
        [("28 Oct 2026 · 15:26", "Airtel Money", "1.2%", "1.5%", "Chikondi Mwale", "Provider increased its rate"),
         ("18 Sep 2026 · 09:14", "TNM Mpamba", "1.2%", "1.5%", "Chikondi Mwale", "Aligned with Airtel"),
         ("02 May 2026 · 11:20", "Card", "3.2%", "2.9%", "Tadala Msonthi", "Renegotiated with the gateway")],
        csv_name="fee-history"), wide=True))
    return sec(12, "Payment Fees and Limits",
                "What each rail costs, who pays the fee, the minimum and maximum amounts, daily and provider "
                "limits, how a fee is calculated and the history of every change", "".join(s), "1.5% on mobile money")


# ============================================================= section 13 ===
def section13():
    s = []
    s.append(sub("13.1", "View Payment Receipts", table(
        ["Receipt", "Payment", "Customer", "Amount", "State"],
        [(r[0], r[1], r[2], money(r[3]), okb(r[6])) for r in RECEIPTS], csv_name="receipts"), wide=True,
        badge="402 today"))
    s.append(sub("13.2", "Generate Receipts", kv([
        ("Automatic", "A receipt is created the moment a payment is confirmed"),
        ("Manual", "Allowed for a verified cash payment"),
        ("Generated today", "402"),
        ("Failed to generate", "0"),
    ]) + '<div class="form-actions"><button class="btn btn-gold" data-toast="Receipts generated for every confirmed payment today">Generate for today</button></div>'))
    s.append(sub("13.3", "Download or Print Receipts",
                 kv([("Formats", "PDF, print, and a link in the SMS"),
                     ("Downloaded today", "184"),
                     ("Printed at the counter", "22"),
                     ("Bulk export", "By day, by method, by branch")]) +
                 '<div class="form-actions"><button class="btn btn-ghost" data-preview="Receipt RCPT-2026-1204">Preview</button>'
                 '<button class="btn btn-ghost" data-csv="receipts">Download CSV</button>'
                 '<button class="btn btn-ghost" data-toast="Print dialog opened">Print</button></div>'))
    s.append(sub("13.4", "Receipt Number Configuration",
                 form([("Prefix", "RCPT-"), ("Year segment", "2026"), ("Next number", "1205"),
                       ("Padding", "4")], "Save the rule",
                      "A number is never reused, even when a receipt is cancelled or reissued.")))
    s.append(sub("13.5", "Receipt Verification",
                 form([("Receipt number", "RCPT-2026-1204")], "Verify the receipt",
                      "Anyone holding a receipt can check it at /verify; no account is needed."),))
    s.append(sub("13.6", "Customer Payment Statements", kv([
        ("Period", "01 Jan 2026 – 30 Oct 2026"),
        ("Payments listed", "412"),
        ("Total paid", money(11_739_081)),
        ("Available from", "The customer portal and the branch"),
    ]) + '<div class="form-actions"><button class="btn btn-ghost" data-preview="Customer payment statement">Preview a statement</button></div>'))
    s.append(sub("13.7", "Repayment History", table(
        ["Loan", "Instalment", "Due", "Paid", "State"],
        [("SL-2026-0418", "7 of 12", "30 Oct 2026", money(48_000), okb("Paid")),
         ("SL-2026-0418", "8 of 12", "30 Nov 2026", "—", okb("Pending")),
         ("BB-2026-0233", "4 of 18", "30 Oct 2026", money(120_000), okb("Paid"))],
        csv_name="repayment-history", num_cols=(3,)), wide=True))
    s.append(sub("13.8", "Receipt Correction Workflow", table(
        ["Step", "Who", "What happens"],
        [("1 · Request", "Any officer", "Raise a correction with the reason"),
         ("2 · Review", "Finance Officer", "Checks the payment and the receipt"),
         ("3 · Approve", "Administrator", "Approves; the old receipt is voided, not deleted"),
         ("4 · Reissue", "System", "New number issued, old one marked reissued")], csv_name="correction-flow"), wide=True))
    s.append(sub("13.9", "Receipt Reissue History", table(
        ["Original", "Reissued as", "Why", "When", "By"],
        [("RCPT-2026-1188", "RCPT-2026-1201", "Wrong loan printed", "29 Oct 2026", "Linda Mhango"),
         ("RCPT-2026-1140", "RCPT-2026-1147", "Amount corrected", "18 Oct 2026", "Tadala Msonthi")],
        csv_name="reissues"), wide=True))
    return sec(13, "Payment Receipts and Statements",
                "Reading and generating receipts, downloading and printing them, the numbering rule, "
                "verification, customer statements, repayment history, corrections and reissues", "".join(s),
                "402 receipts today")


# ============================================================= section 14 ===
def section14():
    s = []
    s.append(sub("14.1", "Successful Payment Notifications", kv([
        ("Channel", "SMS and email"),
        ("Sent today", "402"),
        ("Delivered", "392 · 97.5%"),
        ("Template", "PAY-OK-01"),
        ("Median delivery", "8 seconds"),
    ])))
    s.append(sub("14.2", "Pending Payment Notifications", kv([
        ("Sent today", "4"), ("Template", "PAY-WAIT-02"),
        ("Content", "“We are checking your payment — you will hear from us within an hour”"),
    ])))
    s.append(sub("14.3", "Failed Payment Notifications", kv([
        ("Sent today", "6"), ("Template", "PAY-FAIL-03"),
        ("Content", "The reason and what to do next"),
        ("Opt-out", "Never — a failure message is always sent"),
    ])))
    s.append(sub("14.4", "Payment Receipt Notifications", kv([
        ("Channel", "Email with the PDF attached"),
        ("Sent today", "402"), ("Delivered", "399 · 99.3%"),
        ("Template", "PAY-RCPT-04"),
    ])))
    s.append(sub("14.5", "Overdue Repayment Notifications", kv([
        ("Sent today", "38 · three days before, on the day and after"),
        ("Customers in arrears", "27"),
        ("Template", "REPAY-DUE-06"),
        ("Escalation", "A call from the collections officer after 7 days"),
    ])))
    s.append(sub("14.6", "Staff Payment Alerts", kv([
        ("Sent today", "14"),
        ("Triggered by", "A failed payment, an unreconciled item or a large cash receipt"),
        ("Who receives", "Finance Officer, Administrator"),
        ("Channel", "In-app and email"),
    ])))
    s.append(sub("14.7", "SMS Connection", checks([
        ("pass", "Provider", "Africa’s Talking · sender GOLDENFIN", "Connected"),
        ("pass", "Balance", "12,400 credits", "Pass"),
        ("warn", "Delivery", "97.2% over 30 days", "Watch"),
    ])))
    s.append(sub("14.8", "Email Connection", checks([
        ("pass", "Provider", "Resend · mail.goldenloan.mw", "Connected"),
        ("pass", "Authentication", "DKIM, SPF and DMARC pass", "Pass"),
        ("pass", "Bounce rate", "0.4%", "Pass"),
    ])))
    s.append(sub("14.9", "Notification Delivery Status", table(
        ["Notification", "Channel", "Audience", "Sent (30 d)", "Delivered", "Failed"],
        [(n[0], n[1], n[2], str(n[3]), n[4], str(n[5])) for n in NOTIFS], csv_name="notif-status",
        num_cols=(3, 5)), wide=True, badge="98.6% delivered"))
    s.append(sub("14.10", "Notification History", table(
        ["When", "Event", "To", "Channel", "State"],
        [("30 Oct 2026 · 08:12", "Payment received " + money(48_000), "Chifundo Mponda", "SMS", okb("Delivered")),
         ("30 Oct 2026 · 08:12", "Receipt PAY-2026-88410", "Chifundo Mponda", "Email", okb("Delivered")),
         ("30 Oct 2026 · 07:58", "Payment pending", "Patrick Zulu", "SMS", okb("Delivered")),
         ("30 Oct 2026 · 07:44", "Payment failed", "Thoko Phiri", "SMS", okb("Failed"))],
        csv_name="notif-history"), wide=True))
    return sec(14, "Payment Notifications",
                "What a customer and what a staff member is told, on which channel, whether it arrived and the "
                "history behind it", "".join(s), "98.6% delivered")


# ============================================================= section 15 ===
def section15():
    s = []
    s.append(sub("15.1", "Payment Management Permissions",
                 '<div class="tblwrap"><table class="tbl2 dense"><thead><tr><th>Role</th><th>People</th>'
                 '<th>Capabilities</th><th>Scope</th></tr></thead><tbody>' +
                 "".join(f'<tr><td>{esc(r[2])}</td><td class="num">1</td><td class="num">{r[3]}</td>'
                         f'<td>{esc(r[4])}</td></tr>' for r in STAFF) +
                 '</tbody></table></div>', wide=True, badge="23 grants"))
    s.append(sub("15.2", "Payment Verification Permissions", kv([
        ("Who", "Finance Officer, Collections Officer, Administrator, Super Admin"),
        ("Limit", money(500_000) + " alone · above that a second signature"),
        ("May not", "Verify their own cash receipt"),
        ("People", "4"),
    ])))
    s.append(sub("15.3", "Refund and Reversal Permissions", kv([
        ("Who", "Administrator, Super Admin"),
        ("Approval", "A second administrator must approve any refund"),
        ("Self-approval", "Blocked — the requester can never be the approver"),
        ("People", "2"),
    ])))
    s.append(sub("15.4", "Payment Method Configuration Permissions", kv([
        ("Who", "Administrator, Super Admin"),
        ("May", "Add, edit, enable, disable, archive, change limits and fees"),
        ("May not", "Change a method they do not administer"),
        ("People", "2"),
    ])))
    s.append(sub("15.5", "Provider Connection Permissions", kv([
        ("Who", "Super Admin only"),
        ("May", "Add a provider, rotate credentials, switch to production"),
        ("Second signature", "Required to promote a sandbox connection to production"),
        ("People", "1"),
    ])))
    s.append(sub("15.6", "Approval for Sensitive Changes", table(
        ["Change", "Approval needed", "Approvers"],
        [("Change a fee or a limit", "Yes", "2"),
         ("Rotate a provider credential", "Yes", "2"),
         ("Approve a refund", "Yes · never the requester", "2"),
         ("Promote to production", "Yes", "2"),
         ("Disable a live method", "Yes", "2")], csv_name="sensitive"), wide=True))
    s.append(sub("15.7", "API Credential Protection", checks([
        ("pass", "Storage", "server-side only, never in the bundle", "Pass"),
        ("pass", "Display", "masked to the last four characters", "Pass"),
        ("pass", "Rotation", "recorded with actor and time", "Pass"),
        ("pass", "Export", "credentials never appear in a report or a CSV", "Pass"),
    ])))
    s.append(sub("15.8", "Webhook Security", checks([
        ("pass", "Signature", "HMAC-256 over the raw body", "Pass"),
        ("pass", "Replay window", "5 minutes, nonce stored", "Pass"),
        ("pass", "Allow-list", "provider IP ranges only", "Pass"),
        ("warn", "Unknown sender", "2 requests refused today", "Watch"),
    ])))
    s.append(sub("15.9", "Unauthorized Activity Alerts", table(
        ["When", "What was attempted", "By", "Outcome"],
        [("30 Oct 2026 · 06:44", "Verify a payment above the limit", "Collections Officer", okb("Refused")),
         ("29 Oct 2026 · 21:10", "Approve own refund request", "Administrator", okb("Refused")),
         ("29 Oct 2026 · 16:02", "Read provider credentials", "Credit Analyst", okb("Refused"))],
        csv_name="unauthorised"), wide=True))
    s.append(sub("15.10", "Payment Audit Logs", table(
        ["When", "Actor", "Action", "Target", "Result"],
        [("30 Oct 2026 · 08:14", "System", "Payment confirmed", "PAY-2026-88410", okb("Allowed")),
         ("30 Oct 2026 · 08:02", "Tadala Msonthi", "Method disabled", "TNM Mpamba", okb("Allowed")),
         ("30 Oct 2026 · 07:58", "Linda Mhango", "Manual verification", "PAY-2026-88408", okb("Allowed")),
         ("30 Oct 2026 · 06:44", "Blessings Tembo", "Refund requested", "RFD-2026-013", okb("Refused"))],
        csv_name="payment-audit"), wide=True))
    return sec(15, "Payment Security and Access",
                "Who may read, record, verify, refund, configure and connect — with the approval thresholds, "
                "credential protection, webhook security, unauthorised attempts and the audit log", "".join(s),
                "23 grants")


# ============================================================= section 16 ===
def section16():
    s = []
    s.append(sub("16.1", "Refund Requests", table(
        ["Refund", "Payment", "Customer", "Amount", "Reason", "State"],
        [(r[0], r[1], r[2], money(r[3]), r[4], okb(r[5])) for r in REFUNDS],
        csv_name="refunds", num_cols=(3,)), wide=True, badge="2 waiting"))
    s.append(sub("16.2", "Refund Eligibility Checks", checks([
        ("pass", "Payment is confirmed", "only a confirmed payment can be refunded", "Pass"),
        ("pass", "Within 30 days", "the window closes at 30 days", "Pass"),
        ("pass", "Not already refunded", "one refund per payment", "Pass"),
        ("warn", "Loan still open", "the balance is re-opened on approval", "Watch"),
    ])))
    s.append(sub("16.3", "Refund Approval Workflow", table(
        ["Step", "Who", "Rule"],
        [("1 · Request", "Finance or Collections Officer", "Reason and evidence attached"),
         ("2 · Review", "Finance Officer", "Eligibility checked against the rules"),
         ("3 · Approve", "Administrator", "Never the person who requested it"),
         ("4 · Execute", "System", "Calls the provider refund API, then reverses the payment")],
        csv_name="refund-flow"), wide=True))
    s.append(sub("16.4", "Provider Refund Connection", checks([
        ("pass", "Airtel Money", "refund API available · 8 refunds this month", "Connected"),
        ("fail", "TNM Mpamba", "provider is 502 — refunds queued", "Failing"),
        ("pass", "PayChangu", "sandbox refund accepted", "Sandbox"),
        ("pass", "Cash", "reversal recorded by an officer, cash paid back at the counter", "Manual"),
    ])))
    s.append(sub("16.5", "Payment Reversal Records", table(
        ["Reversal", "Payment", "Amount", "Reason", "Reversed", "State"],
        [("REV-2026-031", "PAY-2026-88403", money(26_500), "Duplicate debit", "30 Oct 2026", okb("Applied")),
         ("REV-2026-030", "PAY-2026-88390", money(1_500), "Overpayment", "29 Oct 2026", okb("Applied"))],
        csv_name="reversals", num_cols=(2,)), wide=True))
    s.append(sub("16.6", "Reversal Impact on Loan Balances", table(
        ["Loan", "Balance before", "Reversal", "Balance after"],
        [("SL-2026-0380", money(214_000), money(26_500), money(240_500)),
         ("BB-2026-0233", money(1_680_000), money(1_500), money(1_681_500))],
        csv_name="reversal-impact", num_cols=(1, 2, 3)), wide=True) +
        note("A reversal re-opens the instalment it had settled and writes a new schedule line. The original "
             "allocation is never deleted — both rows stay in the history.", "gold"))
    s.append(sub("16.7", "Customer Payment Disputes", table(
        ["Dispute", "Payment", "Customer", "What they say", "State"],
        [("DSP-2026-008", "PAY-2026-88320", "Thoko Phiri", "“I paid but the loan shows nothing”", okb("Open")),
         ("DSP-2026-007", "PAY-2026-88396", "Chifundo Mponda", "“I was charged twice”", okb("Resolved"))],
        csv_name="disputes"), wide=True))
    s.append(sub("16.8", "Dispute Investigation", kv([
        ("Assigned to", "Linda Mhango · Finance"),
        ("Evidence", "Provider statement, payment log, webhook record, customer SMS"),
        ("Findings recorded", "Yes, on the dispute record"),
        ("Target resolution", "3 working days"),
        ("Open now", "1"),
    ]) + '<div class="form-actions"><button class="btn btn-ghost" data-toast="Investigation opened on DSP-2026-008">Open the investigation</button></div>'))
    s.append(sub("16.9", "Dispute Resolution Records", table(
        ["Dispute", "Resolution", "Decided by", "When"],
        [("DSP-2026-007", "Duplicate confirmed, refunded MK 4,500", "Tadala Msonthi", "29 Oct 2026"),
         ("DSP-2026-006", "Customer mistaken, statement shared", "Linda Mhango", "21 Oct 2026")],
        csv_name="resolutions"), wide=True))
    s.append(sub("16.10", "Refund and Reversal Audit Trail", table(
        ["When", "Action", "Record", "By", "Detail"],
        [("30 Oct 2026 · 08:16", "Refund approved", "RFD-2026-014", "Tadala Msonthi", money(26_500)),
         ("30 Oct 2026 · 08:18", "Reversal applied", "REV-2026-031", "System", "Balance +" + money(26_500)),
         ("29 Oct 2026 · 16:20", "Refund approved", "RFD-2026-012", "Tadala Msonthi", money(4_500)),
         ("29 Oct 2026 · 16:22", "Reversal applied", "REV-2026-030", "System", "Balance +" + money(1_500))],
        csv_name="refund-audit"), wide=True))
    return sec(16, "Refunds, Reversals and Disputes",
                "How a refund is requested, checked, approved and executed, what a reversal does to a loan "
                "balance, how a dispute is investigated and resolved, and the trail behind both", "".join(s),
                "4 refunds · 1 open")


# ============================================================= section 17 ===
def section17():
    s = []
    s.append(sub("17.1", "Payment Method Table Connection", kv([
        ("Table", "payment_methods"),
        ("Rows", "6"), ("State", pill("Connected", "b-ok")),
        ("Policy", "Public read for active methods; write is administrator only"),
        ("Last write", "30 Oct 2026 · 08:02"),
    ])))
    s.append(sub("17.2", "Payment Receipt Table Connection", kv([
        ("Table", "payment_receipts"), ("Rows", "402"),
        ("Unique index", "one receipt per payment"),
        ("Policy", "Customer reads their own; staff read all"),
    ])))
    s.append(sub("17.3", "Repayment Table Connection", kv([
        ("Table", "repayments"), ("Rows", "402"),
        ("Written by", "The allocation function, never by hand"),
        ("Policy", "Staff read, customer own"),
    ])))
    s.append(sub("17.4", "Repayment Allocation Table Connection", kv([
        ("Table", "repayment_allocations"), ("Rows", "1,206"),
        ("One row per", "principal, interest and fee component"),
        ("Integrity", "The sum of the rows equals the payment amount"),
    ])))
    s.append(sub("17.5", "Loan and Customer Record Connections", table(
        ["From", "To", "Key", "Verified"],
        [("payments", "loans", "loan_id", okb("Verified")),
         ("payments", "customers", "customer_id", okb("Verified")),
         ("payments", "payment_receipts", "payment_id", okb("Verified")),
         ("repayments", "repayment_allocations", "repayment_id", okb("Verified"))], csv_name="relations"), wide=True))
    s.append(sub("17.6", "Payment Configuration Persistence", kv([
        ("Table", "payment_config"),
        ("Rows", "24 keys"),
        ("Versioned", "Yes · every change keeps its previous value"),
        ("Reloaded", "On every cold start, cached for 60 seconds"),
    ])))
    s.append(sub("17.7", "Database Function Connections", table(
        ["Function", "Purpose", "Calls", "State"],
        [("fn_apply_payment", "Writes the payment and its allocations", "402", okb("Secure")),
         ("fn_verify_payment", "Checks the reference and the amount", "412", okb("Secure")),
         ("fn_reverse_payment", "Reverses a payment and re-opens the instalment", "3", okb("Secure")),
         ("fn_payment_audit", "Trigger that writes the audit row", "1,840", okb("Secure"))],
        csv_name="functions", num_cols=(2,)), wide=True))
    s.append(sub("17.8", "Row-Level Security Verification",
                 note("<b>9 of 10 tables are behind RLS.</b> <code>payment_audit</code> is written by a trigger and "
                      "read only through a security-definer function — a gap that is flagged, not hidden.", "warn") +
                 table(["Table", "Rows", "RLS", "Policy"],
                       [(t[0], str(t[1]), okb("on" if t[2] == "on" else "Off"), t[3]) for t in DB_TABLES],
                       csv_name="rls"), wide=True))
    s.append(sub("17.9", "Database Error Monitoring", table(
        ["SQLSTATE", "Message", "Hits", "State"],
        [("23505", "duplicate key on payment_receipts.payment_id", 4, okb("Fixed")),
         ("23514", "allocation sum does not equal the payment", 0, okb("Pass")),
         ("57014", "statement timeout on the daily summary", 1, okb("Open"))],
        csv_name="db-errors", num_cols=(2,)), wide=True))
    s.append(sub("17.10", "Data Consistency Checks", checks([
        ("pass", "Allocation sums", "402 payments, every split equals the amount", "Pass"),
        ("pass", "Receipt coverage", "402 payments, 402 receipts", "Pass"),
        ("pass", "Orphan payments", "none without a loan", "Pass"),
        ("pass", "Balance agreement", "loan balances equal the schedule", "Pass"),
    ])))
    s.append(sub("17.11", "Schema and Migration Compatibility", kv([
        ("Schema version", "2026.10.28.1"),
        ("Compatible with", "app 2.14.3"),
        ("Pending migrations", "0 for this module"),
        ("Checked", "30 Oct 2026 · 08:12"),
    ])))
    s.append(sub("17.12", "Database Connection Diagnostics",
                 checks([("pass", "Pooler", "18 of 60 connections", "Pass"),
                         ("pass", "Round trip", "12 ms", "Pass"),
                         ("pass", "Write test", "insert rolled back cleanly", "Pass")]) +
                 '<div class="form-actions"><button class="btn btn-ghost" data-run-test="DB">Run the diagnostics</button></div>',
                 wide=True))
    return sec(17, "Supabase and Database Connections",
                "The tables this module reads and writes, their relationships, the functions behind them, RLS "
                "verification, error monitoring, consistency checks and diagnostics", "".join(s), "9/10 behind RLS")


# ============================================================= section 18 ===
def section18():
    s = []
    s.append(sub("18.1", "Payment API Endpoint Status", table(
        ["Endpoint", "Method", "Code", "p95", "Calls", "Errors"],
        [(a[0], a[1], str(a[2]), a[3], format(a[4], ","), str(a[5])) for a in API_LOG],
        csv_name="api-status", num_cols=(2, 3, 4, 5)), wide=True))
    s.append(sub("18.2", "Payment Request Logs", table(
        ["When", "Endpoint", "Customer", "Amount", "Result"],
        [("30 Oct 2026 · 08:12", "/v1/payments", "Chifundo Mponda", money(48_000), okb("Accepted")),
         ("30 Oct 2026 · 08:07", "/v1/payments", "Ruth Phiri", money(120_000), okb("Accepted")),
         ("30 Oct 2026 · 07:44", "/v1/payments", "Thoko Phiri", money(15_000), okb("Refused"))],
        csv_name="request-logs", num_cols=(3,)), wide=True))
    s.append(sub("18.3", "Payment Confirmation Logs", table(
        ["When", "Provider", "Provider ref", "Result", "Latency"],
        [("30 Oct 2026 · 08:12", "Airtel Money", "AM-77120934", okb("Confirmed"), "312 ms"),
         ("30 Oct 2026 · 08:07", "TNM Mpamba", "TNM-556120", okb("Confirmed"), "246 ms"),
         ("30 Oct 2026 · 07:12", "TNM Mpamba", "—", okb("Refused"), "—")], csv_name="confirm-logs"), wide=True))
    s.append(sub("18.4", "Webhook Delivery Status", table(
        ["Provider", "Event", "State", "Delivered", "Failed", "Latency"],
        [(h[0], h[1], okb(h[2]), str(h[3]), str(h[4]), h[5]) for h in HOOKS],
        csv_name="webhook-status", num_cols=(3, 4)), wide=True, badge="4 of 5 live"))
    s.append(sub("18.5", "Failed Webhook Events", note(
        "<b>44 TNM Mpamba callbacks failed</b> since 07:12 — each one is retried on the schedule below, and the "
        "payments they belong to sit in the pending queue rather than being lost.", "warn") + table(
        ["Event", "Attempts", "Last error", "Next retry"],
        [("payment.completed", 44, "502 Bad Gateway", "in 2 minutes"),
         ("charge.success", 1, "timeout after 20 s", "delivered on retry")], csv_name="failed-hooks"), wide=True))
    s.append(sub("18.6", "Webhook Retry Monitoring", kv([
        ("Policy", "5 attempts · 1 m, 5 m, 15 m, 1 h, 6 h"),
        ("Retried today", "45"),
        ("Recovered on retry", "1"),
        ("Exhausted", "0"),
        ("Queue depth", "44"),
    ]) + bars([("Attempt 1", 45, 45, "45"), ("Attempt 2", 44, 45, "44"),
               ("Attempt 3", 0, 45, "0")], "#E08C1E")))
    s.append(sub("18.7", "API Response Time", svg_bars(
        ["08:00", "09:00", "10:00", "11:00", "12:00"], [186, 242, 318, 402, 286],
        colour="#2F6FED", unit="p95 by hour today · /v1/payments")))
    s.append(sub("18.8", "Rate Limit Monitoring", kv([
        ("Our limit to providers", "20 requests a second"),
        ("Peak today", "6 a second"),
        ("Provider limit to us", "50 a second · Airtel"),
        ("429 responses today", "0"),
    ])))
    s.append(sub("18.9", "Provider Connection Errors", table(
        ["Provider", "Error", "Hits", "Since"],
        [("TNM Mpamba", "502 Bad Gateway", 44, "07:12"),
         ("Airtel Money", "token refresh timeout", 4, "05:40"),
         ("PayChangu", "sandbox key rejected", 2, "29 Oct 2026")], csv_name="provider-errors", num_cols=(2,)), wide=True))
    s.append(sub("18.10", "Idempotency and Duplicate Prevention", checks([
        ("pass", "Idempotency key", "reference + amount + phone", "Pass"),
        ("pass", "Replay of the same webhook", "acknowledged, not re-applied", "Pass"),
        ("pass", "Duplicate payment", "blocked by the unique index", "Pass"),
        ("pass", "Race between two callbacks", "one wins, the other is ignored", "Pass"),
    ]), wide=True))
    return sec(18, "Payment API and Webhook Monitoring",
                "Endpoint status, the request and confirmation logs, webhook delivery, failures and retries, API "
                "response time, rate limits, provider errors and duplicate prevention", "".join(s), "1 route failing")


# ============================================================= section 19 ===
def section19():
    s = []
    s.append(sub("19.1", "Daily Payment Report", kv([
        ("Payments", "412"), ("Value", money(11_739_081)),
        ("Fees collected", money(174_500)), ("Failed", "6"),
    ]) + '<div class="form-actions"><button class="btn btn-ghost" data-preview="Daily payment report">Preview</button>'
         '<button class="btn btn-ghost" data-csv="daily-payments">CSV</button></div>'))
    s.append(sub("19.2", "Weekly Payment Report", kv([
        ("Payments", "2,880"), ("Value", money(78_240_600)),
        ("Busiest day", "Wednesday · 512 payments"),
        ("Best success rate", "99.4% · Airtel"),
    ]) + '<div class="form-actions"><button class="btn btn-ghost" data-preview="Weekly payment report">Preview</button>'
         '<button class="btn btn-ghost" data-csv="weekly-payments">CSV</button></div>'))
    s.append(sub("19.3", "Monthly Payment Report", kv([
        ("Payments", "11,204"), ("Value", money(318_400_000)),
        ("Month to date", "30 of 31 days"),
        ("Compared to September", "+6.2%"),
    ]) + '<div class="form-actions"><button class="btn btn-ghost" data-preview="Monthly payment report">Preview</button>'
         '<button class="btn btn-ghost" data-csv="monthly-payments">CSV</button></div>'))
    s.append(sub("19.4", "Payments by Method", bars([
        ("Airtel Money", 246, 412, "246"), ("TNM Mpamba", 96, 412, "96"),
        ("Bank transfer", 38, 412, "38"), ("Cash", 22, 412, "22"), ("Card", 0, 412, "0"),
    ], "#C9A227") + kv([("Share on mobile money", "83%"), ("Cash at the counter", "5.3%")]), wide=True))
    s.append(sub("19.5", "Payments by Provider", table(
        ["Provider", "Payments", "Value", "Success"],
        [("Airtel Money", "246", money(6_940_000), "99.2%"),
         ("TNM Mpamba", "96", money(2_180_000), "88.4%"),
         ("NBS Bank", "38", money(2_320_000), "98.9%"),
         ("Cash", "22", money(299_081), "100%")], csv_name="by-provider", num_cols=(1, 2)), wide=True))
    s.append(sub("19.6", "Payments by Staff Member", table(
        ["Officer", "Branch", "Payments recorded", "Verified"],
        [("Linda Mhango", "Lilongwe", "84", "96"),
         ("Blessings Tembo", "Blantyre", "42", "38"),
         ("Yamikani Banda", "Mzuzu", "28", "24"),
         ("Esther Mwale", "Zomba", "16", "12")], csv_name="by-staff", num_cols=(2, 3)), wide=True))
    s.append(sub("19.7", "Successful and Failed Payments", svg_donut(
        [("Successful", 402, "#1E9E6A"), ("Pending", 4, "#E08C1E"), ("Failed", 6, "#D93F3F")], 130) +
        kv([("Success rate", "97.6%"), ("Failure rate", "1.5%"), ("Pending", "1.0%")]), wide=True))
    s.append(sub("19.8", "Payment Processing Fees Report", kv([
        ("Customer-paid", money(174_500)),
        ("Company-paid", money(38_400)),
        ("Net cost", money(38_400)),
        ("As a share of collections", "0.33%"),
    ]) + '<div class="form-actions"><button class="btn btn-ghost" data-csv="processing-fees">CSV</button></div>'))
    s.append(sub("19.9", "Unreconciled Payments Report", kv([
        ("Open items", "12"), ("Value", money(486_500)),
        ("Oldest", "28 Oct 2026"),
        ("Owner", "Linda Mhango"),
    ]) + '<div class="form-actions"><button class="btn btn-ghost" data-csv="unreconciled">CSV</button></div>'))
    s.append(sub("19.10", "Loan Repayment Collection Report", table(
        ["Loan", "Collected", "Expected", "Share"],
        [("SL-2026-0418", money(336_000), money(576_000), "58%"),
         ("BB-2026-0233", money(480_000), money(2_160_000), "22%"),
         ("AF-2026-0104", money(2_250_000), money(4_000_000), "56%")],
        csv_name="collection", num_cols=(1, 2)), wide=True))
    s.append(sub("19.11", "Export Authorized Reports", note(
        "Exports carry the requester, the time and the filters. Anything touching a customer’s identity is "
        "restricted to Finance Officer and above, and the export itself is written to the audit trail.", "gold") +
        '<div class="form-actions"><button class="btn btn-gold" data-csv="payments-export">Export every payment</button>'
        '<button class="btn btn-ghost" data-csv="receipts-export">Export receipts</button>'
        '<button class="btn btn-ghost" data-csv="recon-export">Export reconciliation</button></div>', wide=True))
    s.append(sub("19.12", "Report Generation History", table(
        ["When", "Report", "Format", "By", "Rows"],
        [("30 Oct 2026 · 08:18", "Daily payment report", "CSV", "Linda Mhango", "412"),
         ("29 Oct 2026 · 17:44", "Unreconciled payments", "CSV", "Linda Mhango", "11"),
         ("29 Oct 2026 · 09:02", "Payments by method", "PDF", "Tadala Msonthi", "6"),
         ("28 Oct 2026 · 16:30", "Monthly payment report", "Excel", "Tadala Msonthi", "11,204")],
        csv_name="report-history", num_cols=(4,)), wide=True))
    return sec(19, "Payment Reports and Analytics",
                "Daily, weekly and monthly reports, the method, provider and staff breakdowns, success against "
                "failure, fees, unreconciled money, collections, exports and the generation history", "".join(s),
                "10 reports")


# ============================================================= section 20 ===
def section20():
    s = []
    s.append(sub("20.1", "Default Currency Configuration",
                 form([("Currency", "MWK"), ("Symbol", "MK"),
                       ("Minor units", "0"), ("Rounding", '<select><option>Nearest kwacha</option>'
                                                          '<option>Up</option><option>Down</option></select>')],
                      "Save the currency", "Everything in this module is stored and reported in MWK."),))
    s.append(sub("20.2", "Payment Reference Rules", kv([
        ("Accepted", "Loan reference, phone number, or both"),
        ("Case", "Insensitive"),
        ("Spaces", "Ignored"),
        ("Unmatched", "Goes to the unreconciled queue, never guessed"),
        ("Pattern", "^[A-Z]{2}-?\\d{4}-?\\d{4}$ or a 9-digit phone"),
    ])))
    s.append(sub("20.3", "Receipt Number Rules", kv([
        ("Format", "RCPT-YYYY-NNNN"),
        ("Next", "RCPT-2026-1205"),
        ("Reuse", "Never · a cancelled receipt keeps its number"),
        ("Reissue", "A new number, with a link to the original"),
    ])))
    s.append(sub("20.4", "Payment Confirmation Rules", table(
        ["Situation", "Rule"],
        [("Callback received", "Confirm when the signature verifies and the amount matches"),
         ("No callback within 60 s", "Poll the provider status"),
         ("No answer within 60 minutes", "Mark pending and alert finance"),
         ("Duplicate reference", "Ignore the second, keep the first"),
         ("Provider says reversed", "Reverse ours and re-open the instalment")], csv_name="confirm-rules"), wide=True))
    s.append(sub("20.5", "Reconciliation Rules", kv([
        ("Run", "Daily 06:00 and on demand"),
        ("Match on", "Provider reference first, then amount + date + reference"),
        ("Tolerance", "MK 0 · no automatic write-off"),
        ("Approval", "Above MK 500,000 a second approver"),
        ("Carry forward", "Open items carry into the next day"),
    ])))
    s.append(sub("20.6", "Transaction Timeout Settings", form([
        ("Provider request timeout (s)", "30"), ("Status poll interval (s)", "60"),
        ("Pending expiry (min)", "60"), ("Session timeout (min)", "8")], "Save the timeouts",
        "A payment older than the expiry is moved to pending review, never silently failed."),))
    s.append(sub("20.7", "Provider Retry Policies", table(
        ["Provider", "Attempts", "Backoff", "Give up after"],
        [("Airtel Money", "3", "1 m, 5 m, 15 m", "1 hour"),
         ("TNM Mpamba", "5", "1 m, 5 m, 15 m, 1 h, 6 h", "6 hours"),
         ("PayChangu", "3", "30 s, 2 m, 10 m", "30 minutes"),
         ("Webhooks (all)", "5", "1 m, 5 m, 15 m, 1 h, 6 h", "6 hours")], csv_name="retry-policy"), wide=True))
    s.append(sub("20.8", "Configuration Change History", table(
        ["When", "Setting", "Previous", "Updated", "By"],
        [(c[0], c[1], c[3], c[4], c[5]) for c in CHANGES if c[2] in ("Configuration", "Credential", "Limit", "Fee")],
        csv_name="config-history"), wide=True))
    s.append(sub("20.9", "Staff Member Responsible", table(
        ["Staff", "Role", "Changes", "Last change"],
        [("Chikondi Mwale", "Super Admin", "3", "29 Oct 2026 · 16:40"),
         ("Tadala Msonthi", "Administrator", "3", "30 Oct 2026 · 08:02"),
         ("Linda Mhango", "Finance Officer", "1", "26 Oct 2026 · 14:18")], csv_name="staff", num_cols=(2,)), wide=True))
    s.append(sub("20.10", "Timestamp and Change Details", kv([
        ("First change kept", "12 Oct 2026"),
        ("Latest change", "30 Oct 2026 · 08:02"),
        ("Every row carries", "date, time, actor, previous value, updated value and reason"),
        ("Deletable", "No — append-only, and a reset never clears it"),
        ("Retention", "7 years"),
    ])))
    return sec(20, "Payment Settings and Audit History",
                "Currency, reference and receipt rules, confirmation and reconciliation rules, timeouts, retry "
                "policies, the change history, who changed what, and when", "".join(s), "8 changes")


# ================================================================ shell ====
SUBS = [
    (1, "Overview"), (2, "Payment methods"), (3, "Mobile money"), (4, "Bank transfer"),
    (5, "Cash"), (6, "Gateways"), (7, "Customer experience"), (8, "Transactions"),
    (9, "Verification"), (10, "Loan repayment"), (11, "Reconciliation"), (12, "Fees & limits"),
    (13, "Receipts"), (14, "Notifications"), (15, "Security"), (16, "Refunds"),
    (17, "Database"), (18, "API & webhooks"), (19, "Reports"), (20, "Settings & audit"),
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
      <div class="page-title">Methods of Payment Management &amp; Connections</div>
      <div class="page-sub">Every rail, every receipt and every reconciliation · <span id="topRefresh">{TODAY}</span></div>
    </div>
    <div class="search">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9AA0AC" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
      <input placeholder="Search a payment, receipt, method or provider…" id="globalSearch" autocomplete="off" />
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
      <h1>Money in, and everything it touches</h1>
      <p>Six payment methods, four providers, the receipts, the allocations, the reconciliation and the audit
        trail — twenty sections, each one traceable to a real payment.</p>
    </div>
    <div class="band-stats">
      <div class="band-stat"><b>412</b><span>Payments today</span></div>
      <div class="band-stat"><b>97.6%</b><span>Success rate</span></div>
      <div class="band-stat"><b>12</b><span>Unreconciled</span></div>
      <div class="band-stat"><b>6</b><span>Methods</span></div>
    </div>
    <div class="mb-actions">
      <button class="btn btn-gold" data-goto="s11">Reconcile</button>
      <button class="btn btn-ghost" data-goto="s8">Open the register</button>
    </div>
  </div>
'''


def filterbar():
    defs = [("Method", ["All methods", "Airtel Money", "TNM Mpamba", "Bank transfer", "Cash at branch", "Card payment"]),
            ("State", ["All states", "Successful", "Pending", "Failed", "Cancelled", "Reversed", "Unreconciled"]),
            ("Provider", ["All providers", "Airtel Malawi", "TNM", "NBS Bank", "PayChangu", "Internal"]),
            ("Officer", ["All officers", "Linda Mhango", "Blessings Tembo", "Yamikani Banda", "Esther Mwale", "System"])]
    sels = "".join(
        '<div class="fg"><label>' + esc(l) + '</label><select data-filter="' + esc(l.lower()) + '">' +
        "".join(f"<option>{esc(o)}</option>" for o in opts) + "</select></div>" for l, opts in defs)
    return f'''
  <div class="card panel filterpanel">
    <div class="panel-head"><div><div class="panel-title">Filter the payment register</div>
      <div class="panel-sub">Every panel below narrows with these controls — method, state, provider and officer</div></div>
      <span class="badge b-gray" id="filterCount">no filters</span></div>
    <div class="form-grid four">{sels}
      <div class="fg"><label>Search</label><input id="filterSearch" placeholder="payment, receipt, customer…" /></div>
    </div>
    <div class="form-actions">
      <button class="btn btn-gold" id="applyFilters">Apply the filters</button>
      <button class="btn btn-ghost" id="clearFilters">Clear everything</button>
    </div>
    <div class="qhint" id="filterMsg">No filters applied — all twenty sections are shown.</div>
  </div>
'''


# The sub-item panel styling is the one the approved website module uses, so
# this page cannot drift away from the house style: it is taken verbatim from
# the generated _website2.css and only these payment-specific extras are added.
PANEL_CSS_SOURCE = "_website2.css"

CSS_EXTRA = r"""
/* ---------- payment-specific extras ---------- */
.sub .thumb-img{height:40px}
.sub .hbar:last-child{margin-bottom:0}
.strip .sv{overflow-wrap:anywhere}
.payflag{font-size:9px;font-weight:800;letter-spacing:.3px;color:#7A5E10;
  background:var(--gold-soft,#FBF3D6);border:1px solid #E8D488;border-radius:6px;padding:1px 6px}
"""


def main():
    body = [topbar(), band(), filterbar(), '<div class="content">']
    for fn in (section1, section2, section3, section4, section5, section6, section7, section8,
               section9, section10, section11, section12, section13, section14, section15,
               section16, section17, section18, section19, section20):
        body.append(fn())
    body.append('</div></div>')
    body.append('<div id="toasts" class="toasts"></div>')
    body.append('''<div class="modal" id="modal">
  <div class="modal-card">
    <div class="modal-head"><div><h3 id="modalTitle">Record</h3><p id="modalSub"></p></div>
      <button class="x" id="modalClose" aria-label="Close">✕</button></div>
    <div class="modal-body" id="modalBody"></div>
    <div class="modal-foot" id="modalFoot"></div>
  </div>
</div>''')
    html_out = "\n".join(body)

    try:
        panel_css = open(PANEL_CSS_SOURCE, encoding="utf-8").read()
    except OSError:
        raise SystemExit("missing %s — run build-website.sh first, it generates the shared "
                         "panel styling" % PANEL_CSS_SOURCE)
    css_out = panel_css + CSS_EXTRA

    with open("_pm2body.html", "w", encoding="utf-8") as fh:
        fh.write(html_out)
    with open("_payments2.css", "w", encoding="utf-8") as fh:
        fh.write(css_out)
    n_sub = html_out.count('data-sub=')
    print("wrote _pm2body.html (%d bytes, %d panels), _payments2.css (%d)"
          % (len(html_out), n_sub, len(css_out)))


if __name__ == "__main__":
    main()
