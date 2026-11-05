#!/usr/bin/env python3
"""
Builds the VISA Card Management body from the twenty-section specification.

Every numbered sub-item becomes a numbered panel of its own (1.1 … 20.4), so
nothing in the specification is implicit.  The page is generated so the
figures agree across sections: one card registry, one movement ledger, one
linking-code desk, one verification position, one audit trail — the same rows
re-cut per view.  Only the last four digits of any card appear anywhere.
"""
import html
from _gen_common import (esc, money, pill, okb, kv, strip, table, checks, bars,
                         svg_bars, svg_donut, note, bullets, form, sub, sec)

TODAY = "04 Nov 2026"
NOW = "09:35"

# ----------------------------------------------------------------- data ----
SUBS = [
    (1, "Overview"), (2, "Card registry"), (3, "Linking codes"), (4, "Applications"),
    (5, "Activation"), (6, "Limits & controls"), (7, "Charges by card"), (8, "Expenses by card"),
    (9, "Income received"), (10, "Card transactions"), (11, "Statements"), (12, "Settlement"),
    (13, "Fees & pricing"), (14, "Verification"), (15, "Security"), (16, "Lost & blocked"),
    (17, "Disputes"), (18, "Renewals & expiry"), (19, "Providers & BIN"), (20, "Reports & audit"),
]

# ref, holder, kind, last4, expiry, state, limit, month_spend, issuer, code, officer
CARDS = [
    ("VC-2026-0301", "Golden Financial Services · Main", "Corporate", "4242", "09/28", "Active",
     5_000_000, 498_500, "Standard Bank", "GLSVC-7K2M-9QX4", "Chikondi Mwale"),
    ("VC-2026-0302", "Fuel card · Kanengo depot", "Fuel", "4417", "03/28", "Active",
     400_000, 186_400, "NBS Bank", "GLSVC-2RD8-N6WJ", "Linda Mhango"),
    ("VC-2026-0303", "Yamikani Banda", "Staff purchase", "5302", "11/27", "Active",
     800_000, 96_200, "Standard Bank", "GLSVC-8H3T-K2PQ", "Chikondi Mwale"),
    ("VC-2026-0304", "Blessings Tembo", "Staff purchase", "7714", "01/28", "Active",
     800_000, 41_000, "Standard Bank", "GLSVC-5W9C-M4XD", "Chikondi Mwale"),
    ("VC-2026-0305", "Tadala Msonthi", "Staff purchase", "6068", "05/28", "Active",
     800_000, 128_750, "Nedbank", "GLSVC-Q3N7-V9SB", "Chikondi Mwale"),
    ("VC-2026-0306", "Online subscriptions · IT", "Virtual", "8821", "12/27", "Active",
     300_000, 214_300, "Nedbank", "GLSVC-T6Y2-R5HK", "Ekari Phiri"),
    ("VC-2026-0307", "Fuel card · Lilongwe pool", "Fuel", "3195", "08/28", "Active",
     400_000, 158_900, "NBS Bank", "GLSVC-M4JD-C8TW", "Linda Mhango"),
    ("VC-2026-0308", "Linda Mhango", "Staff purchase", "9246", "02/28", "Active",
     800_000, 52_300, "Standard Bank", "GLSVC-K7PB-X2RN", "Chikondi Mwale"),
    ("VC-2026-0309", "SMS gateway · notifications", "Virtual", "4570", "07/28", "Active",
     300_000, 189_600, "Nedbank", "GLSVC-D9XW-H3QL", "Ekari Phiri"),
    ("VC-2026-0310", "Blantyre branch · office", "Corporate", "2084", "06/28", "Active",
     5_000_000, 642_000, "Standard Bank", "GLSVC-V2KM-P7YT", "Madalitso Mponda"),
    ("VC-2026-0311", "Esther Mwale", "Staff purchase", "6653", "04/28", "Active",
     800_000, 74_150, "NBS Bank", "GLSVC-B5RT-J8M2", "Chikondi Mwale"),
    ("VC-2026-0312", "Cloud backup · storage", "Virtual", "7301", "10/27", "Blocked",
     300_000, 0, "Nedbank", "GLSVC-N8QC-L4ZD", "Ekari Phiri"),
    ("VC-2026-0313", "Chikondi Mwale", "Staff purchase", "5829", "09/28", "Active",
     800_000, 38_900, "Standard Bank", "GLSVC-P3WV-Y6KB", "Chikondi Mwale"),
    ("VC-2026-0314", "PayChangu settlement", "Corporate", "9902", "12/28", "Review",
     5_000_000, 132_800, "Standard Bank", "GLSVC-X4HG-S9FD", "Madalitso Mponda"),
    ("VC-2026-0315", "Alinafe Nyirenda", "Staff purchase", "1478", "01/28", "Active",
     800_000, 61_400, "NBS Bank", "GLSVC-J6MC-T2WQ", "Chikondi Mwale"),
    ("VC-2026-0316", "Email service · Resend", "Virtual", "3394", "11/26", "Expired",
     300_000, 0, "Nedbank", "GLSVC-Z9TD-B5NH", "Ekari Phiri"),
    ("VC-2026-0317", "Email service · Resend (reissue)", "Virtual", "5017", "11/29", "Active",
     300_000, 34_000, "Nedbank", "GLSVC-W2FS-K7LV", "Ekari Phiri"),
    ("VC-2026-0318", "Madalitso Mponda", "Staff purchase", "8246", "06/28", "Replacement",
     800_000, 0, "Standard Bank", "GLSVC-H7QN-D3XP", "Chikondi Mwale"),
]

# ref, when, card, type, party, amount, state, provider ref, officer
CTXNS = [
    ("CTX-2026-0931", "04 Nov 2026 · 09:12", "···· 8821", "Charge", "Vercel · website hosting", 46_500, "Successful", "VCL-99120", "System"),
    ("CTX-2026-0930", "04 Nov 2026 · 08:54", "···· 4242", "Charge", "Supabase · database hosting", 165_000, "Successful", "SB-77120", "System"),
    ("CTX-2026-0929", "04 Nov 2026 · 08:40", "···· 4417", "Expense", "Fuel · Kanengo depot", 62_300, "Approved", "NBS-90412", "Linda Mhango"),
    ("CTX-2026-0928", "04 Nov 2026 · 08:21", "···· 4242", "Income", "Provider refund · PayChangu", 120_000, "Received", "VSR-000031", "System"),
    ("CTX-2026-0927", "04 Nov 2026 · 07:58", "···· 5302", "Expense", "Office supplies · Lilongwe", 38_500, "Approved", "NBS-90408", "Yamikani Banda"),
    ("CTX-2026-0926", "04 Nov 2026 · 07:31", "···· 9902", "Repayment", "Corporate settlement · Oct", 1_240_000, "Settled", "PC-4410", "Madalitso Mponda"),
    ("CTX-2026-0925", "04 Nov 2026 · 07:04", "···· 4570", "Charge", "Africa's Talking · SMS", 96_400, "Successful", "AT-81220", "System"),
    ("CTX-2026-0924", "03 Nov 2026 · 18:47", "···· 6068", "Expense", "Travel · Mponela site visit", 84_000, "Approved", "NDB-33217", "Tadala Msonthi"),
    ("CTX-2026-0923", "03 Nov 2026 · 16:22", "···· 8821", "Fee", "Monthly card fee · virtual", 7_500, "Successful", "NDB-33210", "System"),
    ("CTX-2026-0922", "03 Nov 2026 · 14:09", "···· 3195", "Expense", "Fuel · Lilongwe pool", 48_600, "Approved", "NBS-90396", "Linda Mhango"),
    ("CTX-2026-0921", "03 Nov 2026 · 11:35", "···· 4242", "Refund", "Duplicate charge reversed · Resend", 34_000, "Received", "VSR-000030", "System"),
    ("CTX-2026-0920", "03 Nov 2026 · 09:50", "···· 7714", "Expense", "Courier · agreements to Blantyre", 22_700, "Pending", "—", "Blessings Tembo"),
    ("CTX-2026-0919", "02 Nov 2026 · 17:12", "···· 2084", "Expense", "Blantyre branch · water", 76_500, "Approved", "STD-91288", "Madalitso Mponda"),
    ("CTX-2026-0918", "02 Nov 2026 · 15:44", "···· 5017", "Charge", "Resend · email service", 34_000, "Successful", "RSD-3310", "System"),
    ("CTX-2026-0917", "02 Nov 2026 · 10:26", "···· 4417", "Dispute", "Unknown fuel purchase · investigation", 41_800, "Disputed", "DSP-2011", "Linda Mhango"),
    ("CTX-2026-0916", "01 Nov 2026 · 16:03", "···· 6653", "Expense", "Stationery · claims printing", 18_200, "Approved", "NBS-90341", "Esther Mwale"),
    ("CTX-2026-0915", "01 Nov 2026 · 09:38", "···· 9902", "Income", "Scheme rebate · Q3 volumes", 210_000, "Received", "VSR-000029", "System"),
    ("CTX-2026-0914", "01 Nov 2026 · 08:15", "···· 8821", "Charge", "Sentry / Cloudflare · monitoring", 74_200, "Successful", "CF-2210", "System"),
]

# code, issued, state, card, officer
CODES = [
    ("GLSVC-7K2M-9QX4", "22 Sep 2026 · 10:12", "Used", "VC-2026-0301 · ···· 4242", "Chikondi Mwale"),
    ("GLSVC-2RD8-N6WJ", "01 Oct 2026 · 09:03", "Used", "VC-2026-0302 · ···· 4417", "Linda Mhango"),
    ("GLSVC-8H3T-K2PQ", "06 Oct 2026 · 14:47", "Used", "VC-2026-0303 · ···· 5302", "Chikondi Mwale"),
    ("GLSVC-R4M9-T2XK", "03 Nov 2026 · 08:55", "Awaiting use", "— · awaiting the card details", "Chikondi Mwale"),
    ("GLSVC-C6VP-K8DN", "01 Nov 2026 · 11:20", "Awaiting use", "— · awaiting the card details", "Madalitso Mponda"),
    ("GLSVC-Q3N7-V9SB", "18 Aug 2026 · 09:41", "Expired", "expired unused after 30 days", "Chikondi Mwale"),
    ("GLSVC-W2FS-K7LV", "28 Oct 2026 · 15:36", "Used", "VC-2026-0317 · ···· 5017", "Ekari Phiri"),
    ("GLSVC-H7QN-D3XP", "30 Oct 2026 · 10:05", "Used", "VC-2026-0318 · ···· 8246", "Chikondi Mwale"),
]

APPLICATIONS = [
    ("VCA-2026-0119", "Ruth Phiri", "Staff purchase", "800,000", "Marketing · fuel top-up", "06 Nov 2026", "Submitted"),
    ("VCA-2026-0118", "Isaac Zulu", "Staff purchase", "800,000", "Internal audit · travel", "05 Nov 2026", "Screening"),
    ("VCA-2026-0117", "Zomba branch", "Corporate", "5,000,000", "Branch opening · office card", "04 Nov 2026", "Committee"),
    ("VCA-2026-0116", "Mphatso Mhango", "Virtual", "300,000", "Payroll tool subscription", "03 Nov 2026", "Approved"),
]

ACTIVATIONS = [
    ("VC-2026-0318 · ···· 8246", "30 Oct 2026 · 11:32", "Activated", "OTP + linking code · first use 31 Oct", "Madalitso Mponda"),
    ("VC-2026-0317 · ···· 5017", "28 Oct 2026 · 15:58", "Activated", "OTP + linking code · first use 02 Nov", "Ekari Phiri"),
    ("VC-2026-0309 · ···· 4570", "14 Sep 2026 · 09:19", "Activated", "OTP + linking code · first use 14 Sep", "Ekari Phiri"),
    ("VC-2026-0307 · ···· 3195", "02 Sep 2026 · 13:44", "Activated", "In-branch · ID + linking code", "Linda Mhango"),
]

LIMITS = [
    ("Corporate", "MK 5,000,000 / day", "MK 1,200,000 per transaction", "ATM off · online on", "Two signatures above MK 1,000,000"),
    ("Staff purchase", "MK 800,000 / month", "MK 150,000 per transaction", "ATM off · online on", "Line manager approves the claim"),
    ("Fuel", "MK 400,000 / month", "MK 90,000 per fill", "Fuel stations only · whitelisted", "Odometer recorded per fill"),
    ("Virtual", "MK 300,000 / month", "MK 90,000 per transaction", "Online only · 3-D Secure forced", "IT custodian holds the card"),
]

CHARGE_ROWS = [
    ("Website hosting", "Vercel", "VCL-99120", "···· 8821", 46_500, "Paid"),
    ("Database hosting", "Supabase", "SB-77120", "···· 4242", 165_000, "Paid"),
    ("Supabase service charges", "Supabase", "SB-77121", "···· 4242", 68_500, "Paid"),
    ("SMS and notification charges", "Africa's Talking", "AT-81220", "···· 4570", 96_400, "Paid"),
    ("Payment gateway charges", "PayChangu", "PC-4410", "···· 9902", 132_800, "Paid"),
    ("Email service", "Resend", "RSD-3310", "···· 5017", 34_000, "Paid"),
    ("Security and monitoring", "Sentry / Cloudflare", "CF-2210", "···· 8821", 74_200, "Paid"),
    ("Cloud server charges", "Railway", "RWY-55120", "···· 4242", 228_400, "Paid"),
]

EXPENSE_ROWS = [
    ("EXP-7264", "Fuel · Kanengo depot", "Transport and fuel", "···· 4417", 62_300, "Paid"),
    ("EXP-7261", "Office supplies · Lilongwe", "Office supplies", "···· 5302", 38_500, "Paid"),
    ("EXP-7259", "Travel · Mponela site visit", "Travel and accommodation", "···· 6068", 84_000, "Paid"),
    ("EXP-7256", "Fuel · Lilongwe pool", "Transport and fuel", "···· 3195", 48_600, "Paid"),
    ("EXP-7253", "Courier · agreements to Blantyre", "Transport and fuel", "···· 7714", 22_700, "Awaiting approval"),
    ("EXP-7250", "Blantyre branch · water", "Water and sanitation", "···· 2084", 76_500, "Paid"),
    ("EXP-7247", "Stationery · claims printing", "Office supplies", "···· 6653", 18_200, "Paid"),
]

INCOME_ROWS = [
    ("VSR-000031", "Provider refund · PayChangu", "···· 4242", 120_000, "Received", "04 Nov 2026"),
    ("VSR-000030", "Duplicate charge reversed · Resend", "···· 4242", 34_000, "Received", "03 Nov 2026"),
    ("VSR-000029", "Scheme rebate · Q3 volumes", "···· 9902", 210_000, "Received", "01 Nov 2026"),
    ("VSR-000028", "Double payment returned · Africa's Talking", "···· 4570", 96_400, "Received", "27 Oct 2026"),
    ("VSR-000027", "Interest on settlement balance", "···· 9902", 41_200, "Received", "25 Oct 2026"),
]

STATEMENTS = [
    ("Oct 2026", "VC-2026-0301 · ···· 4242", "Corporate", 118, 3_942_600, 1_240_000, "Closed"),
    ("Sep 2026", "VC-2026-0301 · ···· 4242", "Corporate", 104, 3_508_900, 3_508_900, "Closed"),
    ("Oct 2026", "VC-2026-0310 · ···· 2084", "Corporate", 41, 642_000, 642_000, "Closed"),
    ("Oct 2026", "All virtual cards", "Virtual", 63, 437_900, 437_900, "Closed"),
    ("Nov 2026 (running)", "All cards", "—", 18, 4_115_550, "—", "Open"),
]

SETTLEMENTS = [
    ("SET-2026-1104", "04 Nov 2026", "Corporate · ···· 4242", 18, 1_240_000, "Settled", "Direct debit · Standard Bank"),
    ("SET-2026-1103", "03 Nov 2026", "Virtual pool", 9, 214_300, "Settled", "Direct debit · Nedbank"),
    ("SET-2026-1102", "02 Nov 2026", "Fuel cards", 6, 158_900, "Settled", "Direct debit · NBS Bank"),
    ("SET-2026-1101", "01 Nov 2026", "Corporate · ···· 2084", 4, 96_000, "Settled", "Direct debit · Standard Bank"),
]

FEES = [
    ("Card issuance", "MK 15,000", "Once per card", "Company account"),
    ("Monthly card fee", "MK 7,500", "Every month, per card", "Company account"),
    ("Virtual card fee", "MK 2,500", "Every month, per card", "Company account"),
    ("ATM withdrawal", "2.5% · min MK 3,500", "Corporate ATM is off", "—"),
    ("Foreign transaction", "3.0%", "On the converted amount", "Cardholder cost centre"),
    ("Replacement card", "MK 7,500", "Lost, stolen or damaged", "Company account"),
    ("Dispute handling", "Free", "Chargebacks raised in time", "—"),
]

DISPUTES = [
    ("DSP-2011", "02 Nov 2026", "···· 4417", 41_800, "Unknown fuel purchase", "Evidence sent to NBS", "Under review"),
    ("DSP-2010", "28 Oct 2026", "···· 6068", 122_500, "Charged twice · hotel", "Provisional credit given", "Resolved"),
    ("DSP-2009", "21 Oct 2026", "···· 8821", 18_900, "Service not received", "Merchant refunded in full", "Refunded"),
    ("DSP-2008", "14 Oct 2026", "···· 5302", 65_000, "Wrong amount captured", "Issuer upheld the dispute", "Won"),
]

RENEWALS = [
    ("VC-2026-0316 · ···· 3394", "30 Nov 2026", "22 days", "Reissued as ···· 5017", "Done"),
    ("VC-2026-0303 · ···· 5302", "30 Nov 2027", "12 months", "Auto-renews · card design unchanged", "Scheduled"),
    ("VC-2026-0312 · ···· 7301", "31 Oct 2027", "12 months", "Auto-renews · blocked until review clears", "Scheduled"),
    ("VC-2026-0301 · ···· 4242", "30 Sep 2028", "23 months", "Auto-renews · main corporate card", "Scheduled"),
    ("VC-2026-0302 · ···· 4417", "31 Mar 2028", "17 months", "Auto-renews · fuel whitelist carries over", "Scheduled"),
]

PROVIDERS = [
    ("Standard Bank", "VISA Business / Corporate", "456728·· ····", "Active", "Main issuer · corporate and staff cards", "toggle"),
    ("NBS Bank", "VISA Purchasing · Fuel", "453915·· ····", "Active", "Fuel whitelist · pool cards", "toggle"),
    ("Nedbank", "VISA Virtual", "471104·· ····", "Active", "Virtual cards for online services", "toggle"),
    ("PayChangu", "VISA acquiring · settlement", "—", "Review", "Gateway charges and refunds land here", "toggle"),
]

AUDIT = [
    ("04 Nov 2026 · 09:12", "Charge paid", "Supabase · SB-77120 · ···· 4242", "System"),
    ("04 Nov 2026 · 08:21", "Income received", "Provider refund · PayChangu · MK 120,000", "System"),
    ("03 Nov 2026 · 18:47", "Expense paid", "EXP-7259 · ···· 6068 · MK 84,000", "Tadala Msonthi"),
    ("03 Nov 2026 · 14:09", "Fee charged", "Monthly card fee · ···· 8821 · MK 7,500", "System"),
    ("02 Nov 2026 · 15:44", "Card blocked", "VC-2026-0312 · ···· 7301 · pending review", "Ekari Phiri"),
    ("30 Oct 2026 · 11:32", "Card activated", "VC-2026-0318 · ···· 8246", "Madalitso Mponda"),
    ("28 Oct 2026 · 15:36", "Linking code used", "GLSVC-W2FS-K7LV · ···· 5017", "Ekari Phiri"),
    ("22 Sep 2026 · 10:12", "Card linked", "GLSVC-7K2M-9QX4 · ···· 4242 · main corporate", "Chikondi Mwale"),
]

# ------------------------------------------------------------ derived ------
SPEND = sum(c[7] for c in CARDS)
ACTIVE = len([c for c in CARDS if c[5] == "Active"])
CHARGES_TOTAL = sum(r[4] for r in CHARGE_ROWS)
EXPENSES_TOTAL = sum(r[4] for r in EXPENSE_ROWS)
INCOME_TOTAL = sum(r[3] for r in INCOME_ROWS)
LIMIT_TOTAL = sum(c[6] for c in CARDS)
KIND_COUNTS = {k: len([c for c in CARDS if c[2] == k]) for k in ("Corporate", "Staff purchase", "Fuel", "Virtual")}


def card_table(rows, csv_name):
    return table(
        ["Reference", "Holder", "Kind", "Card", "Expiry", "State", "Limit", "This month", "Issuer", "Linking code", "Custodian"],
        [[r[0], r[1], r[2], "VISA ···· " + r[3], r[4], okb(r[5]) if r[5] in ("Active", "Blocked") else pill(r[5], "b-gray" if r[5] == "Replacement" else "b-warn"),
          money(r[6]), money(r[7]), r[8], r[9], r[10]] for r in rows],
        csv_name=csv_name, num_cols=(6, 7))


def ctx_table(rows, csv_name):
    return table(
        ["Reference", "When", "Card", "Type", "Party", "Amount", "State", "Provider ref", "Officer"],
        [[r[0], r[1], r[2], r[3], r[4], money(r[5]), okb(r[6]) if r[6] in ("Successful", "Approved", "Received", "Settled") else pill(r[6], "b-warn"),
          r[7], r[8]] for r in rows],
        csv_name=csv_name, num_cols=(5,))


def by_type(kind):
    return [t for t in CTXNS if t[3] == kind]


# ------------------------------------------------------------- sections ----
def section1():
    inner = "".join([
        sub("1.1", "November at a glance", strip([
            ("Cards on file", "<b>" + str(len(CARDS)) + "</b>"),
            ("Active today", "<b>" + str(ACTIVE) + "</b>"),
            ("Moved this month", "<b>" + money(SPEND) + "</b>"),
            ("Income received", "<b>" + money(INCOME_TOTAL) + "</b>"),
            ("Open items", "<b>7</b>"),
        ])),
        sub("1.2", "Where the spend sits by kind",
            svg_donut([("Corporate", KIND_COUNTS["Corporate"], "#1A1F71"), ("Staff purchase", KIND_COUNTS["Staff purchase"], "#2F6FED"),
                       ("Fuel", KIND_COUNTS["Fuel"], "#C9A227"), ("Virtual", KIND_COUNTS["Virtual"], "#1E9E6A")], size=130)
            + kv([("Corporate · " + str(KIND_COUNTS["Corporate"]) + " cards", money(sum(c[7] for c in CARDS if c[2] == "Corporate"))),
                  ("Staff purchase · " + str(KIND_COUNTS["Staff purchase"]) + " cards", money(sum(c[7] for c in CARDS if c[2] == "Staff purchase"))),
                  ("Fuel · " + str(KIND_COUNTS["Fuel"]) + " cards", money(sum(c[7] for c in CARDS if c[2] == "Fuel"))),
                  ("Virtual · " + str(KIND_COUNTS["Virtual"]) + " cards", money(sum(c[7] for c in CARDS if c[2] == "Virtual")))])),
        sub("1.3", "Card volume, last 14 days",
            svg_bars(["22", "23", "24", "25", "26", "27", "28", "29", "30", "31", "01", "02", "03", "04"],
                     [22, 26, 19, 31, 24, 18, 28, 33, 30, 12, 15, 21, 17, 18],
                     unit="Card movements per day · charges, expenses, income, repayments and fees.",
                     colour="#1A1F71"), badge="14 days"),
        sub("1.4", "Needs attention now", checks([
            ("fail", "VC-2026-0316 expired", "Email service card · reissued as ···· 5017, old card hotlisted", "1 card"),
            ("warn", "VC-2026-0312 blocked", "Cloud backup card held pending the storage review", "1 card"),
            ("warn", "VC-2026-0314 in review", "PayChangu settlement card · BIN sponsor checking the mandate", "1 card"),
            ("warn", "Dispute open", "Unknown fuel purchase on ···· 4417 · evidence with NBS", "1 dispute"),
            ("pass", "Linking codes", "Every used code retired · 2 codes awaiting use, inside their 30 days", "Healthy"),
        ])),
        sub("1.5", "Direction of the money", bars([
            ("Charges paid by card", CHARGES_TOTAL, CHARGES_TOTAL + INCOME_TOTAL, money(CHARGES_TOTAL)),
            ("Expenses paid by card", EXPENSES_TOTAL, CHARGES_TOTAL + INCOME_TOTAL, money(EXPENSES_TOTAL)),
            ("Income received on cards", INCOME_TOTAL, CHARGES_TOTAL + INCOME_TOTAL, money(INCOME_TOTAL)),
        ], colour="#2F6FED")),
    ])
    return sec(1, "Card Programme Overview", "The whole VISA programme at a glance — cards, kinds, the money that moved and the items that need a person",
               inner, badge="live · " + NOW)


def section2():
    inner = "".join([
        sub("2.1", "Every card, one row each", card_table(CARDS, "visa-card-registry"),
            badge=str(len(CARDS)) + " cards"),
        sub("2.2", "How a card is numbered", kv([
            ("Format", "VC-YYYY-NNNN"),
            ("Prefix", "VC · shared by every kind"),
            ("Next reference", "VC-2026-0319"),
            ("On file", str(len(CARDS)) + " cards since the programme opened"),
            ("Scheme", "VISA · verified every time the card is used"),
            ("Stored digits", "Last four only — the full number is never kept"),
        ])),
        sub("2.3", "The four kinds of card", bullets([
            "<b>Corporate</b> — the company's own cards: the main account, branches and settlement. Two signatures above MK 1,000,000.",
            "<b>Staff purchase</b> — issued to a named officer for approved purchases; the line manager approves every claim afterwards.",
            "<b>Fuel</b> — whitelisted to fuel stations only, odometer recorded per fill, capped per fill and per month.",
            "<b>Virtual</b> — number-only cards for online services, one service per card so a leak is contained and traceable.",
        ])),
        sub("2.4", "The states a card moves through", bullets([
            "<b>Applied</b> — requested, screening against the KYC and the card policy.",
            "<b>Issued</b> — the envelope or the virtual number has arrived; waiting for activation.",
            "<b>Active</b> — linked by its linking code and in use.",
            "<b>Blocked</b> — held by us or the issuer; no new movements until it clears.",
            "<b>Replacement</b> — a reissue in flight; the old reference stays for the history.",
            "<b>Expired</b> — past its expiry; hotlisted and kept for the audit trail.",
        ])),
    ])
    return sec(2, "Card Registry", "One register of every VISA card — corporate, staff, fuel and virtual — with its custodian, limit and state",
               inner, badge=str(len(CARDS)) + " cards")


def section3():
    inner = "".join([
        sub("3.1", "How the linking code pairs a card", note(
            "A linking code is how the platform and a VISA card are introduced. The code is generated here, shared with the "
            "cardholder through the secure channel, and entered once together with the card details — in this module or in "
            "Salaries · Payment Processing. The moment it is used, the code is retired and a fresh one is needed for the next "
            "card. Only the last four digits of the card are ever stored.", "gold")),
        sub("3.2", "Issue a linking code now",
            form([
                ("Purpose of the card", '<input id="vcPurpose" placeholder="e.g. New staff card · Ruth Phiri" />'),
                ("Custodian", '<select id="vcCustodian"><option>Chikondi Mwale</option><option>Madalitso Mponda</option><option>Linda Mhango</option><option>Ekari Phiri</option></select>'),
                ("Kind", '<select id="vcKind"><option>Staff purchase</option><option>Corporate</option><option>Fuel</option><option>Virtual</option></select>'),
                ("Linking code issued", '<input id="linkCodeOut" readonly="readonly" value="GLSVC-R4M9-T2XK" />'),
            ], "Generate a fresh linking code", button_id="issueCodeBtn",
               msg="The code is single-use: it pairs exactly one card, it expires after 30 days, and it is retired the moment it is used."),
            badge="2 awaiting use"),
        sub("3.3", "Every code issued", table(
            ["Linking code", "Issued", "State", "Paired with", "Issued by"],
            [[c[0], c[1], okb(c[2]) if c[2] == "Used" else pill(c[2], "b-info" if c[2] == "Awaiting use" else "b-crit"), c[3], c[4]] for c in CODES],
            csv_name="visa-linking-codes"),
            badge=str(len(CODES)) + " codes"),
        sub("3.4", "The rules a code lives by", checks([
            ("pass", "Single use", "One code pairs one card; reuse is refused by the platform", "Enforced"),
            ("pass", "30-day expiry", "A code nobody uses dies after 30 days — 1 has expired unused", "Enforced"),
            ("pass", "Retired on use", "The code that linked ···· 4242 can never link another card", "Enforced"),
            ("pass", "Regenerated on demand", "Generate a fresh code any time; the old awaiting code dies with it", "Enforced"),
            ("warn", "Codes awaiting use", "2 codes are live right now — collect them or let them expire", "2 codes"),
        ])),
    ])
    return sec(3, "Card Linking Codes", "The GLSVC pairing codes that connect a VISA card to the platform — issue, track and retire them here",
               inner, badge="single-use")


def section4():
    inner = "".join([
        sub("4.1", "Applications waiting", table(
            ["Reference", "Applicant", "Kind", "Requested limit", "Purpose", "Committee", "State"],
            [[a[0], a[1], a[2], "MK " + a[3], a[4], a[5], pill(a[6], "b-ok" if a[6] == "Approved" else "b-warn")] for a in APPLICATIONS],
            csv_name="visa-card-applications", num_cols=(3,)),
            badge=str(len(APPLICATIONS)) + " applications"),
        sub("4.2", "From application to a card in the wallet", bullets([
            "<b>1 · Apply</b> — the custodian applies, stating the kind, the purpose and the requested limit.",
            "<b>2 · Screen</b> — the applicant is checked against the card policy; staff cards need a line manager's note.",
            "<b>3 · Approve</b> — corporate limits go to the card committee; staff cards are approved by the administrator.",
            "<b>4 · Issue</b> — the issuer produces the card; a virtual number arrives at once, a plastic takes 3–5 working days.",
            "<b>5 · Pair</b> — a linking code is issued here and the card is paired with the platform.",
            "<b>6 · Activate</b> — the cardholder activates and the card joins the registry as Active.",
        ])),
        sub("4.3", "What the screening refuses", checks([
            ("pass", "Limits within policy", "Every requested limit matches the kind's ceiling in section 6", "In policy"),
            ("pass", "One card per purpose", "No duplicate purpose found on the register", "Clean"),
            ("warn", "Zomba branch card", "New corporate card — needs the committee minute attached", "1 item"),
            ("pass", "No adverse record", "All four applicants clear of the card default list", "Clean"),
        ])),
    ])
    return sec(4, "Card Applications & Issuance", "New cards requested, screened and issued — the pipeline every card walked through",
               inner, badge=str(len(APPLICATIONS)) + " open")


def section5():
    inner = "".join([
        sub("5.1", "Activate a card",
            form([
                ("Card reference", '<input placeholder="VC-2026-0318" />'),
                ("Last four digits", '<input placeholder="8246" />'),
                ("Linking code", '<input placeholder="GLSVC-XXXX-XXXX" />'),
                ("Activation OTP", '<input placeholder="6-digit OTP from the issuer" />'),
            ], "Activate the card",
               msg="Activation needs the linking code and the issuer OTP together — either alone is refused.")),
        sub("5.2", "The first-use rules", bullets([
            "A card is <b>issued but not live</b> until it is activated with the linking code and the OTP.",
            "The <b>first transaction</b> must be a small one — the issuer runs it as a verification hold (MK 1 typical).",
            "Virtual cards activate instantly but stay <b>online-only</b>; ATM use is impossible by design.",
            "Fuel cards activate against the <b>station whitelist</b>; any other merchant is declined at the terminal.",
            "If the OTP fails three times the card is <b>held for the branch</b> — identity is checked in person.",
        ])),
        sub("5.3", "Activation log", table(
            ["Card", "When", "State", "How it was activated", "By"],
            [[a[0], a[1], pill(a[2], "b-ok"), a[3], a[4]] for a in ACTIVATIONS],
            csv_name="visa-activations"),
            badge=str(len(ACTIVATIONS)) + " recent"),
    ])
    return sec(5, "Activation & First Use", "Turning an issued card into a live one — the pairing, the OTP and the first small charge",
               inner, badge="OTP + code")


def section6():
    inner = "".join([
        sub("6.1", "Limits by kind of card", table(
            ["Kind", "Period ceiling", "Per movement", "Channel controls", "Approval rule"],
            [list(l) for l in LIMITS], csv_name="visa-card-limits"),
            badge=str(len(LIMITS)) + " kinds"),
        sub("6.2", "Controls the platform enforces itself", bullets([
            "<b>Merchant categories</b> — fuel cards are whitelisted to stations; virtual cards cannot be used at an ATM even if the number leaks.",
            "<b>Two signatures</b> — corporate movements above MK 1,000,000 need a second approver inside the portal before settlement.",
            "<b>Per-card ceilings</b> — a card that reaches its monthly ceiling is declined; the decline is logged against the card.",
            "<b>Receipt rule</b> — every card expense needs a receipt above MK 100,000 before the claim is reimbursed.",
        ])),
        sub("6.3", "Change a limit",
            form([
                ("Card reference", '<input placeholder="VC-2026-0303" />'),
                ("New monthly ceiling", '<input placeholder="800000" />'),
                ("Reason", '<input placeholder="Project work in Mzuzu, December" />'),
                ("Approved by", '<select><option>Madalitso Mponda · Finance Manager</option><option>Chikondi Mwale · Administrator</option></select>'),
            ], "Apply the new limit",
               msg="A limit change is logged in the audit trail with both names — the requester and the approver.")),
    ])
    return sec(6, "Card Limits & Controls", "What each card may do — ceilings per day, month and movement, and the channel controls",
               inner, badge=str(len(CARDS)) + " cards under limit")


def section7():
    inner = "".join([
        sub("7.1", "System operating charges on the cards", table(
            ["Service", "Provider", "Invoice", "Card", "Amount", "State"],
            [[r[0], r[1], r[2], r[3], money(r[4]), okb(r[5])] for r in CHARGE_ROWS],
            csv_name="visa-card-charges", num_cols=(4,)),
            badge=money(CHARGES_TOTAL) + " this month"),
        sub("7.2", "How the charges flow", bullets([
            "The provider emails its invoice; the charge is booked in <b>Salaries · System Operating Charges</b>.",
            "The charge is paid with the <b>default corporate card</b> — ···· 4242 unless the panel says otherwise.",
            "The card movement lands here with the provider reference, and the invoice is marked Paid at the source.",
            "Annual contracts are charged to the corporate card and spread in the budget; monthly ones settle as they arrive.",
        ])),
        sub("7.3", "This month's charge picture", strip([
            ("Charges paid", "<b>" + money(CHARGES_TOTAL) + "</b>"),
            ("Providers", "<b>8</b>"),
            ("Largest", "<b>" + money(max(r[4] for r in CHARGE_ROWS)) + "</b> · Railway"),
            ("Cards used", "<b>4</b>"),
            ("Failed charges", "<b>0</b>"),
        ])),
        sub("7.4", "Auto-pay rules", checks([
            ("pass", "Monthly charges", "Paid on arrival with the default card when under the per-movement ceiling", "Automatic"),
            ("warn", "Annual contracts", "Above the ceiling — each needs a second signature before payment", "Manual"),
            ("pass", "New invoice check", "Every invoice is matched to the contract before the card is charged", "Enforced"),
            ("pass", "Failed payment retry", "A declined charge retries once after 2 hours, then alerts the administrator", "Enforced"),
        ])),
    ])
    return sec(7, "Charges Paid by Card", "The system's own running costs — hosting, database, SMS, email and monitoring — settled with the cards",
               inner, badge=money(CHARGES_TOTAL))


def section8():
    inner = "".join([
        sub("8.1", "Business expenses on the cards", table(
            ["Expense", "What it bought", "Category", "Card", "Amount", "State"],
            [[r[0], r[1], r[2], r[3], money(r[4]), (okb(r[5]) if r[5] == "Paid" else pill(r[5], "b-warn"))] for r in EXPENSE_ROWS],
            csv_name="visa-card-expenses", num_cols=(4,)),
            badge=money(EXPENSES_TOTAL) + " this month"),
        sub("8.2", "The approval gate", bullets([
            "An expense on a card is <b>captured first, approved second</b> — the money has left, but the claim is not done.",
            "Only an <b>Approved</b> expense closes; a pending one sits with the line manager exactly like a cash claim.",
            "Above <b>MK 150,000</b> the finance manager signs; above <b>MK 1,000,000</b> the second signature applies.",
            "A receipt is attached from the card statement; missing receipts block reimbursement and appear in the alerts.",
        ])),
        sub("8.3", "What the card may never buy", checks([
            ("pass", "Cash at an ATM", "ATM access is off on every card — cash needs the petty-cash route", "Blocked"),
            ("pass", "Personal purchases", "Staff cards are for business purposes; breaches go to the administrator", "Policy"),
            ("pass", "Splitting a purchase", "Two swipes to dodge a ceiling are matched by merchant + minute and flagged", "Monitored"),
            ("warn", "Courier · EXP-7253", "Awaiting the line manager — the card paid, the claim is open", "1 item"),
        ])),
    ])
    return sec(8, "Expenses Paid by Card", "The business expenses that went through the cards — each one still walks the approval gate",
               inner, badge=money(EXPENSES_TOTAL))


def section9():
    inner = "".join([
        sub("9.1", "Income received on the cards", table(
            ["Reference", "Source", "Card", "Amount", "State", "When"],
            [[r[0], r[1], r[2], money(r[3]), okb(r[4]), r[5]] for r in INCOME_ROWS],
            csv_name="visa-card-income", num_cols=(3,)),
            badge=money(INCOME_TOTAL) + " received"),
        sub("9.2", "Where card income comes from", kv([
            ("Provider refunds", "A provider returns money — a duplicate charge, a cancelled service, an over-billing."),
            ("Scheme rebates", "VISA volume rebates paid to the corporate settlement card each quarter."),
            ("Reversed disputes", "A dispute won in time returns the money to the card it left."),
            ("Interest", "Credit balances on the settlement account are swept back onto the card."),
            ("Recorded at source", "Every refund lands here and in Salaries · Incomes — the same figure, once."),
        ])),
        sub("9.3", "Allocation rules", bullets([
            "A refund of a <b>charge</b> is netted against that system charge line before it hits the budget.",
            "A refund of an <b>expense</b> follows the expense back to its cost centre.",
            "Rebates and interest are <b>other income</b> — budgeted separately and never netted against spend.",
        ])),
    ])
    return sec(9, "Income Received on the Cards", "Refunds, rebates and reversals that came back to the cards — recorded once, at the source",
               inner, badge=money(INCOME_TOTAL))


def section10():
    inner = "".join([
        sub("10.1", "Every card movement, one row each", ctx_table(CTXNS, "visa-card-transactions"),
            badge=str(len(CTXNS)) + " of the month shown"),
        sub("10.2", "How a card movement is numbered", kv([
            ("Format", "CTX-YYYY-NNNN"),
            ("Prefix", "CTX · shared by every type"),
            ("Next reference", "CTX-2026-0932"),
            ("Idempotency key", "Provider ref + card last4 + minute"),
            ("Income references", "VSR-… so refunds and rebates are distinct at a glance"),
        ])),
        sub("10.3", "The types of movement", bullets([
            "<b>Charge</b> — a system operating cost paid with a card (section 7).",
            "<b>Expense</b> — a business purchase on a card, still walking the approval gate (section 8).",
            "<b>Income</b> — a refund, rebate or reversal received onto a card (section 9).",
            "<b>Repayment</b> — the settlement that clears the corporate balance (section 12).",
            "<b>Fee</b> — card fees the issuer charged (section 13).",
            "<b>Dispute</b> — a movement under challenge (section 17).",
        ])),
        sub("10.4", "Finding any movement", note(
            "The filters above the register — kind, state, type and officer — narrow every panel on this page at once. "
            "The search matches a reference, a party, a card's last four or a provider reference. Every table sorts by "
            "clicking its headers and exports with its CSV button.", "gold")),
    ])
    return sec(10, "Card Transactions Register", "One ledger of everything the cards did — charges, expenses, income, repayments, fees and disputes",
               inner, badge=str(len(CTXNS)) + " movements")


def section11():
    inner = "".join([
        sub("11.1", "Statement calendar", table(
            ["Period", "Card", "Kind", "Movements", "Closing value", "Settled", "State"],
            [[r[0], r[1], r[2], r[3], money(r[4]), money(r[5]) if isinstance(r[5], int) else r[5], pill(r[6], "b-ok" if r[6] == "Closed" else "b-warn")] for r in STATEMENTS],
            csv_name="visa-card-statements", num_cols=(3, 4, 5)),
            badge=str(len(STATEMENTS)) + " statements"),
        sub("11.2", "What a statement shows",
            '<div class="form-actions"><button class="btn btn-gold" data-preview="Statement · Oct 2026 · ···· 4242">Preview the October statement</button></div>'
            + kv([("Opening", "The balance carried from the close of the previous month."),
                  ("Lines", "Every movement with its date, party, amount and provider reference."),
                  ("Fees", "The month's card fees itemised on their own lines."),
                  ("Closing", "What the settlement in section 12 must clear, and by which date.")]),
            badge="preview"),
        sub("11.3", "The running month", strip([
            ("Period", "<b>Nov 2026</b>"),
            ("Movements so far", "<b>" + str(len(CTXNS)) + "</b>"),
            ("Value so far", "<b>" + money(SPEND) + "</b>"),
            ("Statement cut", "<b>30 Nov 2026</b>"),
            ("Settlement due", "<b>07 Dec 2026</b>"),
        ])),
    ])
    return sec(11, "Card Statements", "The monthly statements — what each card closed at, what settled and what is still running",
               inner, badge="cut 30 Nov")


def section12():
    inner = "".join([
        sub("12.1", "Settlement runs",
            table(
                ["Run", "When", "Covers", "Movements", "Value", "State", "How"],
                [[r[0], r[1], r[2], r[3], money(r[4]), okb(r[5]), r[6]] for r in SETTLEMENTS],
                csv_name="visa-card-settlements", num_cols=(3, 4))
            + '<div class="form-actions"><button class="btn btn-gold" data-run-recon>Run today\u2019s settlement check</button></div>',
            badge=str(len(SETTLEMENTS)) + " runs"),
        sub("12.2", "How the corporate balance clears", kv([
            ("Method", "Direct debit on the settlement account, 7 days after the statement cut."),
            ("Full balance", "Corporate cards are cleared in full — the programme carries no revolving balance."),
            ("Disputed lines", "Held out of the settlement while the chargeback runs; only clean lines settle."),
            ("Funding", "The settlement account is funded from the main account two days before the debit."),
            ("Proof", "Each run files its debit note here and in the Transactions register."),
        ])),
        sub("12.3", "If a settlement fails", bullets([
            "The debit bounces — the issuer is called the same day and the run is repeated within 24 hours.",
            "A second failure <b>blocks all corporate cards</b> until the balance clears; fuel and staff cards keep their ceilings.",
            "The failure is written to the alerts and to the audit trail with the reason the bank gave.",
        ])),
    ])
    return sec(12, "Repayments & Settlement", "Clearing the corporate balance — the runs, the direct debit and what happens when one fails",
               inner, badge="full balance")


def section13():
    inner = "".join([
        sub("13.1", "The fee schedule", table(
            ["Fee", "Amount", "When it applies", "Charged to"],
            [list(f) for f in FEES], csv_name="visa-card-fees"),
            badge=str(len(FEES)) + " fees"),
        sub("13.2", "Foreign transactions", note(
            "A card used abroad or in a foreign currency online converts at the scheme rate plus <b>3.0%</b>. The portal "
            "records both the kwacha amount and the original currency on the movement, and the cost lands on the card's "
            "cost centre — virtual cards rarely leave kwacha, so the FX line is normally a fuel or travel card.", "gold")),
        sub("13.3", "Fees this month", strip([
            ("Monthly fees", money(97_500)),
            ("Foreign transaction", money(0)),
            ("Replacements", money(7_500)),
            ("Dispute fees", money(0) + " · raised in time"),
            ("Total fees", "<b>" + money(105_000) + "</b>"),
        ])),
    ])
    return sec(13, "Fees & Pricing", "What the programme costs to run — issuance, monthly fees, ATM, FX and replacements",
               inner, badge=money(105_000) + " fees this month")


def section14():
    inner = "".join([
        sub("14.1", "Run the verification checks",
            checks([
                ("warn", "Luhn checksum", "The modulus-10 test every VISA number must pass — run it on demand", "Ready"),
                ("warn", "BIN range", "The first digits identify the scheme and the issuer bank", "Ready"),
                ("warn", "Expiry window", "The card must be inside its MM/YY life", "Ready"),
                ("warn", "Duplicate guard", "The last four + issuer must not already sit on the register", "Ready"),
                ("warn", "Storage rule", "Only the last four may be written anywhere — full numbers are refused", "Ready"),
            ])
            + '<div class="form-actions"><button class="btn btn-gold" data-run-tests>Run the verification suite</button></div>',
            badge="5 checks"),
        sub("14.2", "What each check proves", bullets([
            "<b>Luhn</b> — the typed digits satisfy the ISO checksum; a typo or a invented number is refused instantly.",
            "<b>BIN</b> — the number starts 4 (VISA) and the issuer bank matches the card's stated sponsor.",
            "<b>Expiry</b> — the card is alive; an expired card can be linked only as a historical record, never to pay.",
            "<b>Duplicate</b> — the same plastic cannot be linked twice, even under a fresh linking code.",
            "<b>Storage</b> — the pairing writes <b>last four + expiry + holder</b>. Nothing else. Ever.",
        ])),
        sub("14.3", "The storage rule, in plain words", note(
            "A full card number exists only while it is being typed. The moment the platform keeps anything, it keeps the "
            "last four digits, the expiry and the holder name — enough to recognise the card on a statement, never enough "
            "to spend on it. The CVV is not even held in memory.", "gold")),
    ])
    return sec(14, "Verification Desk", "Every card is proven before it is trusted — checksum, BIN, expiry, duplicates and the storage rule",
               inner, badge="VISA · Luhn · BIN")


def section15():
    inner = "".join([
        sub("15.1", "Controls in force today", checks([
            ("pass", "3-D Secure", "Every online card payment runs the issuer challenge", "Enforced"),
            ("pass", "Last-four storage", "The register, the ledger and every export carry last four only", "Verified"),
            ("pass", "Tokenisation", "The issuers hold the numbers; the platform holds tokens", "Enforced"),
            ("pass", "Signed webhooks", "Provider callbacks are HMAC-verified before they touch the ledger", "Enforced"),
            ("pass", "Role separation", "Issuing a card, paying with it and settling it are three different roles", "Enforced"),
        ])),
        sub("15.2", "Alerts the programme raises", bullets([
            "A card is <b>declined three times</b> in an hour — the custodian is alerted.",
            "A movement appears from a <b>new merchant country</b> — the card is held until the custodian answers.",
            "A <b>linking code is used</b> — both the issuer log and the audit trail record the pairing.",
            "A statement <b>fails to close</b> on its cut date — the administrator is alerted before settlement day.",
        ])),
        sub("15.3", "Who may do what", kv([
            ("Issue a linking code", "Administrator · Finance Manager"),
            ("Link a card", "Administrator · the cardholder (with the code)"),
            ("Pay a charge or expense", "Finance Manager · Payroll Officer (prepared, approved by signature)"),
            ("Settle the balance", "Finance Manager · second signature above MK 1,000,000"),
            ("Block or hotlist", "Administrator · Issuer hotline (both, always)"),
        ])),
        sub("15.4", "The card data that leaves this portal", checks([
            ("pass", "Exports", "CSV exports carry last four only — verified by the automated page tests", "Safe"),
            ("pass", "Printed statements", "Masked to last four by the print stylesheet", "Safe"),
            ("pass", "Notification messages", "Reference and amount only — no card data in any SMS or email", "Safe"),
        ])),
    ])
    return sec(15, "Security Controls", "The rules that keep the cards safe — 3-D Secure, storage, roles and the alerts",
               inner, badge="3-D Secure")


def section16():
    inner = "".join([
        sub("16.1", "Freeze or release a card", table(
            ["Reference", "Holder", "Kind", "Card", "State", "Action"],
            [[c[0], c[1], c[2], "VISA ···· " + c[3], okb(c[5]) if c[5] == "Active" else pill(c[5], "b-crit" if c[5] == "Blocked" else "b-gray"),
              '<button class="btn btn-ghost btn-sm" data-toggle-card="' + esc(c[1]) + '">' + ("Release" if c[5] == "Blocked" else "Freeze") + '</button>']
             for c in CARDS if c[5] in ("Active", "Blocked")],
            csv_name="visa-card-blocks"),
            badge=str(len([c for c in CARDS if c[5] == "Blocked"])) + " blocked"),
        sub("16.2", "Lost or stolen — the five minutes that matter", bullets([
            "<b>1 · Freeze here</b> — the card is stopped on the platform at once; nothing new can pair or pay with it.",
            "<b>2 · Call the issuer hotline</b> — the hotlist at the bank stops the plastic even offline.",
            "<b>3 · Record it</b> — the block is written to the audit trail with who, when and why.",
            "<b>4 · Reissue</b> — a replacement card walks the normal pipeline; a fresh linking code pairs it.",
            "<b>5 · Review movements</b> — the last 24 hours are checked for anything not recognised.",
        ])),
        sub("16.3", "Blocks on the register", kv([
            ("VC-2026-0312 · ···· 7301", "Blocked by the custodian pending the storage review — releases with the review."),
            ("VC-2026-0316 · ···· 3394", "Expired and hotlisted; replaced by ···· 5017 under a fresh linking code."),
            ("Replacement in flight", "···· 8246 issued for Madalitso Mponda — activates with its own code."),
        ])),
    ])
    return sec(16, "Lost, Stolen & Blocking", "Stopping a card in minutes — the freeze here, the hotlist at the bank, the reissue after",
               inner, badge="freeze · hotlist")


def section17():
    inner = "".join([
        sub("17.1", "Disputes and chargebacks", table(
            ["Reference", "Raised", "Card", "Amount", "Claim", "Position", "State"],
            [[d[0], d[1], d[2], money(d[3]), d[4], d[5], pill(d[6], "b-ok" if d[6] == "Resolved" else "b-info" if d[6] == "Refunded" else "b-warn")] for d in DISPUTES],
            csv_name="visa-card-disputes", num_cols=(3,)),
            badge=str(len(DISPUTES)) + " disputes"),
        sub("17.2", "The life of a dispute", bullets([
            "<b>Day 0</b> — the custodian challenges the movement; evidence is attached from the statement.",
            "<b>Day 1–3</b> — the platform raises it with the issuer; the line is marked Disputed and held from settlement.",
            "<b>Day 10</b> — <b>provisional credit</b> returns the amount to the card while the scheme investigates.",
            "<b>Day 45–90</b> — the scheme rules; won disputes keep the credit, lost ones return it.",
        ])),
        sub("17.3", "Dispute discipline", checks([
            ("pass", "Raised in time", "Every dispute inside the 60-day window — chargeback fees stay at zero", "On time"),
            ("pass", "Evidence attached", "Statement extract and the merchant contact recorded for each case", "Complete"),
            ("warn", "DSP-2011 open", "Unknown fuel purchase on ···· 4417 — NBS is investigating", "Under review"),
            ("pass", "Provisional credit", "Granted on day 10 in every eligible case so far", "4 of 4"),
        ])),
    ])
    return sec(17, "Disputes & Chargebacks", "Movements we did not authorise — the challenge, the provisional credit and the outcome",
               inner, badge="1 open")


def section18():
    inner = "".join([
        sub("18.1", "Expiry diary", table(
            ["Card", "Expires", "Countdown", "Plan", "State"],
            [[r[0], r[1], r[2], r[3], pill(r[4], "b-ok" if r[4] == "Done" else "b-info")] for r in RENEWALS],
            csv_name="visa-card-renewals"),
            badge=str(len(RENEWALS)) + " entries"),
        sub("18.2", "How renewal works", bullets([
            "A card is reissued <b>30 days before</b> its expiry; the new plastic or virtual number arrives in the old name.",
            "The <b>fresh linking code</b> pairs the replacement — the old code retired with the old card.",
            "Limits, whitelists and custodians <b>carry over</b>; nothing about the policy changes with the plastic.",
            "The old card is <b>hotlisted on the cut-over day</b> and stays on the register for the audit trail.",
        ])),
        sub("18.3", "Renewal queue now", checks([
            ("pass", "···· 3394 → ···· 5017", "The email-service reissue completed; old card hotlisted", "Done"),
            ("info", "Next expiry", "···· 5302 in Nov 2027 — auto-renewal scheduled, nothing to do", "12 months"),
            ("pass", "Blocked card review", "···· 7301 renews only when the storage review clears it", "Watched"),
        ])),
    ])
    return sec(18, "Renewals & Expiry", "The expiry diary — reissues in flight, auto-renewals scheduled and nothing caught by surprise",
               inner, badge="next · Nov 2027")


def section19():
    inner = "".join([
        sub("19.1", "BIN sponsors and the gateway", table(
            ["Provider", "VISA product", "BIN range", "State", "What it carries", ""],
            [[p[0], p[1], p[2], okb(p[3]) if p[3] == "Active" else pill(p[3], "b-warn"), p[4],
              '<button class="btn btn-ghost btn-sm" data-toggle-provider="' + esc(p[0]) + '">' + ("Pause" if p[3] == "Active" else "Resume") + '</button>']
             for p in PROVIDERS],
            csv_name="visa-card-providers"),
            badge=str(len(PROVIDERS)) + " providers"),
        sub("19.2", "Reading a BIN", kv([
            ("First digit 4", "The scheme is VISA — the verification desk refuses anything else."),
            ("Digits 2–6", "The issuer bank — Standard Bank, NBS or Nedbank on this programme."),
            ("The masked middle", "Held by the issuer only; this portal never writes it down."),
            ("Last four", "What the portal stores, shows and searches by."),
        ])),
        sub("19.3", "Scheme rules the programme obeys", checks([
            ("pass", "No full-number storage", "PCI-aligned: numbers stay at the issuers; the portal holds tokens and last four", "Compliant"),
            ("pass", "Chargeback windows", "Disputes raised inside 60 days — the scheme's own clock", "Compliant"),
            ("pass", "3-D Secure on every CNP transaction", "Forced at the gateway for virtual and online use", "Compliant"),
            ("warn", "PayChangu mandate", "The settlement card's mandate is in review with the sponsor", "1 item"),
        ])),
    ])
    return sec(19, "Providers & BIN Sponsors", "The banks behind the cards and the gateway that settles — who carries what, and the BINs they own",
               inner, badge=str(len(PROVIDERS)) + " providers")


def section20():
    inner = "".join([
        sub("20.1", "The report pack",
            '<div class="form-actions">'
            '<button class="btn btn-gold" data-toast="Card programme report queued — it lands in Reports when built">Build the month\u2019s card report</button>'
            '<button class="btn btn-ghost" id="quickCsv2" data-csv="visa-export-pack">Export the whole register pack</button>'
            '</div>'
            + kv([("Monthly", "Registry, movements, charges, expenses, income, fees and the settlement position."),
                  ("Quarterly", "Scheme rebates, dispute outcomes and the fee review."),
                  ("Ad hoc", "Any table on this page exports to CSV from its own button.")]),
            badge="pack"),
        sub("20.2", "Audit trail", table(
            ["When", "Action", "Detail", "Officer"],
            [list(a) for a in AUDIT], csv_name="visa-card-audit"),
            badge=str(len(AUDIT)) + " recent entries"),
        sub("20.3", "How long the records are kept", kv([
            ("Card registry", "Life of the programme — a card never leaves the register, even when hotlisted."),
            ("Movement ledger", "7 years, aligned with the tax retention rule."),
            ("Linking-code log", "3 years after the code is retired."),
            ("Dispute files", "3 years after the scheme's final ruling."),
        ])),
        sub("20.4", "Programme settings",
            form([
                ("Default card for charges", '<select><option>VC-2026-0301 · ···· 4242</option><option>VC-2026-0310 · ···· 2084</option></select>'),
                ("Statement cut day", '<select><option>30th of the month</option><option>Month end</option></select>'),
                ("Settlement debit", '<select><option>7 days after cut</option><option>14 days after cut</option></select>'),
                ("Reminder before expiry", '<input value="30 days" />'),
            ], "Save the programme settings",
               msg="Every change here is written to the audit trail with the officer and the time.")),
    ])
    return sec(20, "Reports & Audit", "The report pack, the audit trail of every card action, retention and the programme settings",
               inner, badge="7-year retention")


# ---------------------------------------------------------------- chrome ---
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
      <div class="page-title">VISA Card Management &amp; Card Payments</div>
      <div class="page-sub">Every card, every linking code, every movement · <span id="topRefresh">{TODAY}</span></div>
    </div>
    <div class="search">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9AA0AC" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
      <input placeholder="Search a card, holder, code or reference…" id="globalSearch" autocomplete="off" />
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
      <h1>Every VISA card, in one place</h1>
      <p>Linking codes, the card registry, the charges and expenses the cards pay, the income they receive, limits,
        verification, disputes and the audit trail. Twenty sections, each traceable to a real card row.</p>
    </div>
    <div class="band-stats">
      <div class="band-stat"><b>{len(CARDS)}</b><span>Cards on file</span></div>
      <div class="band-stat"><b>{money(SPEND)}</b><span>Moved this month</span></div>
      <div class="band-stat"><b>{money(INCOME_TOTAL)}</b><span>Income received</span></div>
      <div class="band-stat"><b>4</b><span>Kinds of card</span></div>
    </div>
    <div class="mb-actions">
      <button class="btn btn-gold" data-goto="s14">Verify a card</button>
      <button class="btn btn-ghost" data-goto="s2">Open the registry</button>
    </div>
  </div>
'''


def filterbar():
    defs = [("Kind", ["All kinds", "Corporate", "Staff purchase", "Fuel", "Virtual"]),
            ("State", ["All states", "Active", "Blocked", "Expired", "Replacement", "Review"]),
            ("Type", ["All types", "Charge", "Expense", "Income", "Repayment", "Fee", "Refund", "Dispute"]),
            ("Officer", ["All officers", "Chikondi Mwale", "Madalitso Mponda", "Linda Mhango",
                         "Ekari Phiri", "Yamikani Banda", "Tadala Msonthi", "Esther Mwale", "System"])]
    sels = "".join(
        '<div class="fg"><label>' + esc(l) + '</label><select data-filter="' + esc(l.lower()) + '">' +
        "".join(f"<option>{esc(o)}</option>" for o in opts) + "</select></div>" for l, opts in defs)
    return f'''
  <div class="card panel filterpanel">
    <div class="panel-head"><div><div class="panel-title">Filter the card register</div>
      <div class="panel-sub">Every panel below narrows with these controls — kind, state, type and custodian</div></div>
      <span class="badge b-gray" id="filterCount">no filters</span></div>
    <div class="form-grid four">{sels}
      <div class="fg"><label>Search</label><input id="filterSearch" placeholder="reference, holder, last four…" /></div>
    </div>
    <div class="form-actions">
      <button class="btn btn-gold" id="applyFilters">Apply the filters</button>
      <button class="btn btn-ghost" id="clearFilters">Clear everything</button>
    </div>
    <div class="qhint" id="filterMsg">No filters applied — all twenty sections are shown.</div>
  </div>
'''


PANEL_CSS_SOURCE = "_website2.css"

CSS_EXTRA = r"""
/* ---------- visa-cards-specific extras ---------- */
.filterpanel{margin-bottom:13px}
.sub .hbar:last-child{margin-bottom:0}
.strip .sv{overflow-wrap:anywhere}
.vcflag{font-size:9px;font-weight:800;letter-spacing:.3px;color:#7A5E10;
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

    with open("_vc2body.html", "w", encoding="utf-8") as fh:
        fh.write(html_out)
    with open("_visacards2.css", "w", encoding="utf-8") as fh:
        fh.write(css_out)
    n_sub = html_out.count("data-sub=")
    print("wrote _vc2body.html (%d bytes, %d panels), _visacards2.css (%d)"
          % (len(html_out), n_sub, len(css_out)))


if __name__ == "__main__":
    main()
