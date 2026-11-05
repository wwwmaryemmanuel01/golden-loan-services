#!/usr/bin/env python3
"""
Builds the Statements body from the twenty-section specification.

Every numbered sub-item becomes a numbered panel of its own (1.1 … 20.3), so
nothing in the specification is implicit.  One statement store feeds every
view: the calendar, the queues, the delivery log, the archive and the audit.
"""
import html
from _gen_common import (esc, money, pill, okb, kv, strip, table, checks, bars,
                         svg_bars, svg_donut, note, bullets, form, sub, sec)

TODAY = "05 Nov 2026"
NOW = "09:20"

# ----------------------------------------------------------------- data ----
SUBS = [
    (1, "Overview"), (2, "Calendar"), (3, "Client statements"), (4, "Loan statements"),
    (5, "Savings statements"), (6, "Company statements"), (7, "Certificates"),
    (8, "Generation queue"), (9, "Templates"), (10, "Delivery"), (11, "Delivery log"),
    (12, "Request desk"), (13, "Corrections"), (14, "Disputed lines"),
    (15, "Reconciliation"), (16, "Exports"), (17, "Archive"), (18, "Access & privacy"),
    (19, "Controls"), (20, "Reports & audit"),
]

# ref, client, kind, period, lines, channel, state, when issued
STATEMENTS = [
    ("ST-2026-8841", "Chifundo Mponda", "Loan", "Oct 2026", 8, "Email", "Sent", "01 Nov 2026"),
    ("ST-2026-8840", "Ruth Phiri", "Loan", "Oct 2026", 6, "SMS link", "Opened", "01 Nov 2026"),
    ("ST-2026-8839", "Kanengo Traders", "Loan", "Oct 2026", 12, "Email", "Sent", "01 Nov 2026"),
    ("ST-2026-8838", "Esther Mwale", "Savings", "Oct 2026", 5, "Portal", "Downloaded", "01 Nov 2026"),
    ("ST-2026-8837", "Patrick Zulu", "Loan", "Oct 2026", 7, "Branch pick-up", "Ready", "02 Nov 2026"),
    ("ST-2026-8836", "Thoko Phiri", "Savings", "Oct 2026", 4, "Email", "Sent", "02 Nov 2026"),
    ("ST-2026-8835", "Grace Mvula", "Loan", "Oct 2026", 9, "Email", "Failed", "02 Nov 2026"),
    ("ST-2026-8834", "Madalitso Kondowe", "Loan", "Sep 2026", 7, "Email", "Sent", "01 Oct 2026"),
]

# instalment, due, paid, amount, balance — the mini schedule on a loan statement
LOAN_LINES = [
    ("Instalment 1 of 6", "05 Jun 2026", "05 Jun 2026", money(84_000), money(402_000)),
    ("Instalment 2 of 6", "05 Jul 2026", "04 Jul 2026", money(84_000), money(318_000)),
    ("Instalment 3 of 6", "05 Aug 2026", "05 Aug 2026", money(84_000), money(234_000)),
    ("Instalment 4 of 6", "05 Sep 2026", "07 Sep 2026", money(84_000) + " · + " + money(1_200) + " penalty", money(151_200)),
    ("Instalment 5 of 6", "05 Oct 2026", "05 Oct 2026", money(84_000), money(67_200)),
    ("Instalment 6 of 6", "05 Nov 2026", "— · due", money(67_200), money(0) + " after payment"),
]

CAL = [
    ("Nov 2026", "30 Nov 2026", "01 Dec 2026", "Client, loan and savings statements", "Scheduled"),
    ("Dec 2026", "31 Dec 2026", "02 Jan 2027", "Client, loan and savings statements", "Scheduled"),
    ("Nov 2026", "30 Nov 2026", "07 Dec 2026", "Company management pack", "Scheduled"),
    ("Oct 2026", "31 Oct 2026", "01 Nov 2026", "Client, loan and savings statements", "Issued"),
    ("Q3 2026", "30 Sep 2026", "06 Oct 2026", "Interest certificates", "Issued"),
]

COMPANY_PL = [
    ("Interest income", money(18_060_000)),
    ("Fee income", money(3_920_000)),
    ("Penalty income", money(486_000)),
    ("Total income", money(22_466_000)),
    ("Operating costs", money(10_382_000)),
    ("Provisions", money(2_140_000)),
    ("Result before tax", money(9_944_000)),
]

COMPANY_BS = [
    ("Cash and bank", money(38_420_000)),
    ("Loan book, net of provisions", money(101_180_000)),
    ("Total assets", money(139_600_000)),
    ("Client savings and deposits", money(100_240_000)),
    ("Provisions", money(2_140_000)),
    ("Retained earnings", money(37_220_000)),
]

CERTS = [
    ("CERT-2026-Q3-0411", "Esther Mwale", "Interest certificate", "Q3 2026", money(41_200), "Issued"),
    ("CERT-2026-Q3-0410", "Kanengo Traders", "Interest certificate", "Q3 2026", money(1_860_000), "Issued"),
    ("CERT-2026-Q3-0409", "Grace Mvula", "Fee certificate", "Q3 2026", money(96_400), "Issued"),
    ("CERT-2026-Q3-0408", "Patrick Zulu", "Interest certificate", "Q3 2026", money(72_800), "Issued"),
]

QUEUE = [
    ("B-2026-1104", "01 Nov 2026 · 06:00", "October client, loan and savings", 1_208, "Built", "8 min 12 s"),
    ("B-2026-1103", "01 Oct 2026 · 06:00", "September client, loan and savings", 1_042, "Built", "7 min 02 s"),
    ("B-2026-1102", "06 Oct 2026 · 09:00", "Q3 interest certificates", 486, "Built", "2 min 48 s"),
    ("B-2026-1105", "30 Nov 2026 · 06:00", "November client, loan and savings", "—", "Scheduled", "—"),
]

DELIVERY = [
    ("Email", 968, "Free", "The default — a signed link, valid 30 days"),
    ("SMS link", 142, "MK 20", "A short link to the PDF, for clients without email"),
    ("Portal download", 76, "Free", "The client pulls it after signing in"),
    ("Branch pick-up", 22, "Free", "Printed, sealed, ID checked at the counter"),
]

LOGROWS = [
    ("DL-2026-7741", "ST-2026-8841 · Chifundo Mponda", "Email", "01 Nov 2026 · 06:14", "Delivered", "—"),
    ("DL-2026-7740", "ST-2026-8840 · Ruth Phiri", "SMS link", "01 Nov 2026 · 06:15", "Opened", "Link used 08:02"),
    ("DL-2026-7739", "ST-2026-8839 · Kanengo Traders", "Email", "01 Nov 2026 · 06:15", "Delivered", "—"),
    ("DL-2026-7738", "ST-2026-8837 · Patrick Zulu", "Branch pick-up", "02 Nov 2026 · 08:30", "Waiting", "Ready at Lilongwe counter"),
    ("DL-2026-7737", "ST-2026-8835 · Grace Mvula", "Email", "02 Nov 2026 · 06:14", "Failed", "Mailbox full · SMS fallback sent"),
]

REQUESTS = [
    ("REQ-2026-0331", "Isaac Phiri", "Loan statement · Jan–Oct 2026", "03 Nov 2026", "Email", "Ready"),
    ("REQ-2026-0330", "Alinafe Nyirenda", "Savings statement · 2026 to date", "03 Nov 2026", "Portal", "Ready"),
    ("REQ-2026-0329", "Joseph Kalua", "Loan statement · full history", "02 Nov 2026", "Branch pick-up", "Building"),
    ("REQ-2026-0328", "Memory Mvula", "Interest certificate · 2025", "01 Nov 2026", "Email", "Issued"),
]

CORRECTIONS = [
    ("CR-2026-0071", "ST-2026-8812 · Kanengo Traders", "A repayment was posted twice; the statement now shows one line", "29 Oct 2026", "Reissued"),
    ("CR-2026-0070", "ST-2026-8798 · Ruth Phiri", "Name misspelt on the header; template field fixed", "21 Oct 2026", "Reissued"),
    ("CR-2026-0069", "ST-2026-8790 · Grace Mvula", "Penalty waived after the fact; statement re-cut", "14 Oct 2026", "Reissued"),
]

DISPUTED = [
    ("DS-2026-0021", "ST-2026-8833 · Patrick Zulu", "Penalty charged on a paid instalment", money(1_200), "Under review"),
    ("DS-2026-0020", "ST-2026-8819 · Joseph Kalua", "A repayment missing from the statement", money(50_000), "Ledger check"),
    ("DS-2026-0019", "ST-2026-8802 · Thoko Phiri", "Interest figure disagrees with the schedule", money(4_800), "Resolved · reissued"),
]

RECON = [
    ("October client statements", 1_208, 1_208, 0, "Matched"),
    ("October loan statements", 812, 812, 0, "Matched"),
    ("October savings statements", 1_104, 1_101, 3, "3 gaps open"),
    ("Q3 certificates", 486, 486, 0, "Matched"),
]

EXPORTS = [
    ("Client statement", "PDF · signed link", "The client's own record", "30 days"),
    ("Loan statement", "PDF · signed link", "Schedule, payments, balance", "30 days"),
    ("Statement batch", "CSV", "The machine-readable batch for auditors", "On request"),
    ("Company pack", "PDF", "The board's management pack", "Each close"),
    ("Interest certificate", "PDF", "For the client's tax records", "Each quarter"),
]

ARCHIVE = [
    ("Client statements", "7 years", "Tax retention rule"),
    ("Loan statements", "7 years", "Tax retention rule"),
    ("Interest certificates", "7 years", "Tax retention rule"),
    ("Delivery logs", "3 years", "Evidence of service"),
    ("Batches", "3 years", "Rebuild provenance"),
]

ACCESS = [
    ("A client", "Their own statements only — portal, email, SMS or the counter"),
    ("Teller", "Print a statement for a client at the counter, ID checked"),
    ("Loan officer", "The statements of their own clients"),
    ("Finance manager", "Company statements and every client statement"),
    ("Auditor", "Read-only on the archive, every access logged"),
]

AUDIT = [
    ("05 Nov 2026 · 08:12", "Statement reissued", "CR-2026-0071 · Kanengo Traders", "Chikondi Mwale"),
    ("03 Nov 2026 · 15:40", "Request served", "REQ-2026-0331 · Isaac Phiri · by email", "Blessings Tembo"),
    ("02 Nov 2026 · 06:20", "Delivery failed", "ST-2026-8835 · mailbox full · SMS fallback", "System"),
    ("01 Nov 2026 · 06:00", "Batch built", "B-2026-1104 · 1,208 statements · 8 min 12 s", "System"),
    ("31 Oct 2026 · 17:45", "Calendar locked", "November cut confirmed for 30 Nov 06:00", "Madalitso Mponda"),
]

SENT_TOTAL = sum(d[1] for d in DELIVERY)
OPEN_ITEMS = 3 + 2 + 1

# ------------------------------------------------------------- sections ----
def section1():
    inner = "".join([
        sub("1.1", "The statement desk at a glance", strip([
            ("Statements this month", "<b>1,208</b>"),
            ("Delivered", "<b>1,205</b>"),
            ("Open requests", "<b>4</b>"),
            ("Corrections", "<b>3</b> this month"),
            ("Disputed lines", "<b>3</b>"),
        ])),
        sub("1.2", "How the statements went out",
            svg_donut([(d[0], d[1], c) for d, c in
                       zip(DELIVERY, ["#2F6FED", "#1E9E6A", "#0C4A6E", "#C9A227"])], size=130)
            + kv([(d[0], str(d[1]) + " · " + d[2]) for d in DELIVERY])),
        sub("1.3", "Statement volume, last 12 months",
            svg_bars(["Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov"],
                     [640, 702, 688, 745, 802, 861, 910, 968, 1_020, 1_042, 1_208, 0],
                     unit="Statements built per month · November builds on the 30th at 06:00.",
                     colour="#365314"), badge="12 months"),
        sub("1.4", "Needs attention now", checks([
            ("fail", "1 delivery failed", "ST-2026-8835 · mailbox full — the SMS fallback already went out", "1 item"),
            ("warn", "3 savings gaps", "Three savings statements disagree with the ledger — reconciliation open", "3 items"),
            ("warn", "4 requests waiting", "Two are ready to serve; the SLA is 48 hours", "4 requests"),
            ("pass", "November cut", "Scheduled for 30 Nov · 06:00, the calendar is locked", "On time"),
            ("pass", "Archive", "Every statement from 2019 onward retrievable in under a minute", "Healthy"),
        ])),
    ])
    return sec(1, "Statements Overview", "Every account, on paper, on time — the month at the statement desk",
               inner, badge="live · " + NOW)


def section2():
    inner = "".join([
        sub("2.1", "The statement calendar", table(
            ["Period", "Cut", "Out by", "What is built", "State"],
            [[c[0], c[1], c[2], c[3], okb(c[4]) if c[4] == "Issued" else pill(c[4], "b-info")] for c in CAL],
            csv_name="statements-calendar"),
            badge=str(len(CAL)) + " entries"),
        sub("2.2", "The next cut", strip([
            ("Period", "<b>November 2026</b>"),
            ("Cut", "<b>30 Nov · 06:00</b>"),
            ("Out by", "<b>01 Dec · 09:00</b>"),
            ("Expected statements", "<b>≈ 1,240</b>"),
            ("Calendar state", "<b>Locked</b>"),
        ])),
        sub("2.3", "How the cut works", bullets([
            "The cut is a <b>photograph at 06:00</b> on the cut day — movements after the cut belong to next month's statement.",
            "A loan statement is cut per loan; a savings statement per account; a client may hold several.",
            "The calendar is <b>locked a month ahead</b> — a cut only moves by committee minute, recorded in the audit trail.",
            "Certificates are cut quarterly; the company pack follows the close by five working days.",
        ])),
    ])
    return sec(2, "Statement Calendar", "The cuts, the locks and what gets built on each date",
               inner, badge="next · 30 Nov")


def section3():
    inner = "".join([
        sub("3.1", "Client statements, most recent first", table(
            ["Reference", "Client", "Kind", "Period", "Lines", "Channel", "State", "Issued"],
            [[s[0], s[1], s[2], s[3], s[4], s[5], okb(s[6]) if s[6] in ("Sent", "Opened", "Downloaded") else pill(s[6], "b-warn"), s[7]] for s in STATEMENTS],
            csv_name="statements-client"),
            badge=str(len(STATEMENTS)) + " recent"),
        sub("3.2", "Read one now",
            '<div class="form-actions"><button class="btn btn-gold" data-preview="Client statement · Chifundo Mponda · Oct 2026">Preview a client statement</button></div>'
            + kv([("Header", "The black portal header, the emblem and the client's name."),
                  ("Body", "Every movement of the period with its date, reference and amount."),
                  ("Footer", "The white house footer with the licence line."),
                  ("Security", "A signed link; the document itself carries the issue time.")])),
        sub("3.3", "What a client statement shows", kv([
            ("Opening balance", "What the account held when the period began."),
            ("Lines", "Every repayment, disbursement, fee and adjustment — one row each."),
            ("Closing balance", "What the account holds after the last line."),
            ("Schedule ahead", "The instalments still to come, with their dates."),
            ("Contact line", "The branch, its phone and the portal address."),
        ])),
    ])
    return sec(3, "Client Statements", "The client's own record of the period — movements, balances and what comes next",
               inner, badge="1,208 this month")


def section4():
    inner = "".join([
        sub("4.1", "Loan statements, most recent first", table(
            ["Reference", "Client", "Loan", "Period", "Instalments", "Channel", "State"],
            [["ST-2026-8841", "Chifundo Mponda", "LN-2026-0481", "Oct 2026", "6", "Email", okb("Sent")],
             ["ST-2026-8840", "Ruth Phiri", "LN-2026-0455", "Oct 2026", "4", "SMS link", okb("Opened")],
             ["ST-2026-8839", "Kanengo Traders", "LN-2026-0512", "Oct 2026", "12", "Email", okb("Sent")],
             ["ST-2026-8837", "Patrick Zulu", "LN-2026-0437", "Oct 2026", "3", "Branch pick-up", pill("Ready", "b-info")],
             ["ST-2026-8835", "Grace Mvula", "LN-2026-0439", "Oct 2026", "9", "Email", pill("Failed", "b-warn")]],
            csv_name="statements-loans"),
            badge="812 loans"),
        sub("4.2", "Inside a loan statement — LN-2026-0481", table(
            ["Line", "Due", "Paid", "Amount", "Balance after"],
            [list(l) for l in LOAN_LINES],
            csv_name="statements-loan-lines"),
            badge="the schedule, told plainly"),
        sub("4.3", "The loan statement promises", checks([
            ("pass", "Every line matches the ledger", "The statement is built from the same rows the tellers write", "Verified"),
            ("pass", "Penalties shown separately", "A penalty never hides inside an instalment", "Clear"),
            ("pass", "The next due date is bold", "Nobody has to work out what is owed next", "Clear"),
            ("pass", "Arrears stated in words", "If the loan is behind, the statement says so and by how much", "Honest"),
        ])),
    ])
    return sec(4, "Loan Statements", "The loan, told plainly — every instalment, every payment, what is next",
               inner, badge="812 this month")


def section5():
    inner = "".join([
        sub("5.1", "Savings statements, most recent first", table(
            ["Reference", "Client", "Product", "Period", "Lines", "Channel", "State"],
            [["ST-2026-8838", "Esther Mwale", "Savings account", "Oct 2026", "5", "Portal", okb("Downloaded")],
             ["ST-2026-8836", "Thoko Phiri", "Savings account", "Oct 2026", "4", "Email", okb("Sent")],
             ["ST-2026-8829", "Kanengo Traders", "Fixed deposit", "Oct 2026", "3", "Email", okb("Sent")],
             ["ST-2026-8825", "Chifundo Mponda", "Group savings", "Oct 2026", "6", "Email", okb("Sent")]],
            csv_name="statements-savings"),
            badge="1,104 accounts"),
        sub("5.2", "Interest posting, in the open", bullets([
            "Savings interest is <b>calculated daily</b> on the closing balance and <b>posted monthly</b> — the statement shows both steps.",
            "Fixed-deposit interest posts <b>at maturity</b>, with the rate and the days printed on the line.",
            "A withdrawal that breaks a fixed deposit costs the accrued interest — the statement carries the warning line.",
            "Every posting carries its reference, so the ledger can be walked line by line.",
        ])),
        sub("5.3", "Preview one",
            '<div class="form-actions"><button class="btn btn-gold" data-preview="Savings statement · Esther Mwale · Oct 2026">Preview a savings statement</button></div>'
            + kv([("Shows", "Opening balance, deposits, withdrawals, interest posted, closing balance."),
                  ("Also shows", "The next interest posting date, so the client knows when to look.")])),
    ])
    return sec(5, "Savings Statements", "The money clients keep with us — deposits, withdrawals and the interest, in the open",
               inner, badge="1,104 accounts")


def section6():
    inner = "".join([
        sub("6.1", "The company result, October", table(
            ["Line", "October"],
            [list(r) for r in COMPANY_PL],
            csv_name="statements-company-pl"),
            badge="management view"),
        sub("6.2", "The company position", table(
            ["Line", "Position"],
            [list(r) for r in COMPANY_BS],
            csv_name="statements-company-bs"),
            badge="as at 31 Oct 2026"),
        sub("6.3", "Where the numbers come from", kv([
            ("The ledger", "Every line is the ledger, grouped — nothing is typed into a statement."),
            ("The provisions", "Follow the ageing buckets in Statistics · Arrears."),
            ("The pack", "Built by the finance manager, signed by the director, shared with the board."),
            ("The audit", "The external auditor reads the same pack each year-end."),
        ])),
    ])
    return sec(6, "Company Statements", "The house's own statements — the result and the position, straight from the ledger",
               inner, badge="Oct 2026")


def section7():
    inner = "".join([
        sub("7.1", "Interest and fee certificates", table(
            ["Reference", "Client", "Certificate", "Period", "Amount", "State"],
            [[c[0], c[1], c[2], c[3], c[4], okb(c[5])] for c in CERTS],
            csv_name="statements-certificates", num_cols=(4,)),
            badge="486 a quarter"),
        sub("7.2", "Preview one",
            '<div class="form-actions"><button class="btn btn-gold" data-preview="Interest certificate · Esther Mwale · Q3 2026">Preview an interest certificate</button></div>'
            + kv([("Carries", "The client, the period, the interest and fees paid, and the house seal."),
                  ("Used for", "The client's own tax records and their employer's or bank's requests."),
                  ("Reissued", "Free, any time — the archive never loses one.")])),
        sub("7.3", "Certificate rules", checks([
            ("pass", "Quarterly cut", "Certificates follow the calendar quarter, cut six days after", "On time"),
            ("pass", "Figures match the year", "The four quarters always add to the annual figure", "Verified"),
            ("pass", "Signed and sealed", "Every certificate carries the signature block and the emblem", "Complete"),
        ])),
    ])
    return sec(7, "Interest & Fee Certificates", "The quarter's paper for the client's tax records — signed, sealed, reissued free",
               inner, badge="486 a quarter")


def section8():
    inner = "".join([
        sub("8.1", "The generation queue", table(
            ["Batch", "Run at", "What it builds", "Statements", "State", "Took"],
            [[q[0], q[1], q[2], q[3], okb(q[4]) if q[4] == "Built" else pill(q[4], "b-info"), q[5]] for q in QUEUE],
            csv_name="statements-queue"),
            badge=str(len(QUEUE)) + " batches"),
        sub("8.2", "Run a batch now",
            checks([
                ("warn", "November batch", "Builds on 30 Nov · 06:00 — client, loan and savings statements", "Scheduled"),
                ("warn", "Company pack", "Follows the close by five working days", "Scheduled"),
            ])
            + '<div class="form-actions"><button class="btn btn-gold" data-run-recon>Dry-run the November batch</button></div>',
            badge="2 scheduled"),
        sub("8.3", "How a build runs", bullets([
            "The build <b>photographs the ledger at the cut</b> — movements after the cut wait for next month.",
            "Every statement is <b>numbered before it is rendered</b>, so a failed build can never duplicate a reference.",
            "A build that fails <b>rolls back whole</b> — there is never a half-built month on the shelf.",
            "The batch log keeps the count, the timing and the checksum of every build.",
        ])),
    ])
    return sec(8, "Generation Queue", "The batches — what builds, when it runs, and the rules a build lives by",
               inner, badge="next · 30 Nov")


def section9():
    inner = "".join([
        sub("9.1", "What every statement carries", kv([
            ("Header", "The black portal header — emblem, house name, licence line, page identity."),
            ("Border", "The house green rule on every statement sheet."),
            ("Body", "The lines, in the house table style, sortable and readable."),
            ("Footer", "The white footer — branch, phone, portal, and the support line."),
            ("Mark", "The issue time and the statement reference on every page."),
        ])),
        sub("9.2", "Preview the template",
            '<div class="form-actions"><button class="btn btn-gold" data-preview="Statement template · house style">Preview the house template</button></div>'
            + kv([("One template", "Client, loan, savings and certificates share one house layout."),
                  ("Language", "English today; Chichewa wording is prepared for the client lines."),
                  ("Paper", "A4, print-ready, the border survives the printer.")])),
        sub("9.3", "Wording rules", bullets([
            "The client is addressed by <b>name</b>, never by account number, in the salutation.",
            "A penalty line always says <b>why</b> — the reason is part of the sentence, not a code.",
            "The next due date is written as a <b>date</b>, never as 'day 30'.",
            "No jargon on a client statement — 'money in', 'money out', 'what you owe next'.",
        ])),
    ])
    return sec(9, "Templates & Branding", "The house layout — header, border, footer — and the wording rules every statement obeys",
               inner, badge="one house style")


def section10():
    inner = "".join([
        sub("10.1", "The delivery channels", table(
            ["Channel", "October", "Cost", "How it works"],
            [[d[0], d[1], d[2], d[3]] for d in DELIVERY],
            csv_name="statements-delivery", num_cols=(1,)),
            badge=str(SENT_TOTAL) + " sent"),
        sub("10.2", "The delivery rules", bullets([
            "Email is the default; the link is <b>signed and dies after 30 days</b> — a fresh one is free.",
            "An SMS link costs <b>MK 20</b> and is only used with the client's consent on file.",
            "A printed statement leaves the counter <b>sealed</b>, and only against ID.",
            "If a channel fails, the <b>fallback fires the same day</b> — nobody waits two days for paper.",
        ])),
        sub("10.3", "Channel health", checks([
            ("pass", "Email", "99.6% delivered in October", "Healthy"),
            ("pass", "SMS links", "Every link opened at least once within 48 hours", "Healthy"),
            ("pass", "Portal", "Downloads authenticated, every one logged", "Healthy"),
            ("warn", "Branch pick-up", "22 uncollected at the Lilongwe counter — SMS reminder queued", "22 waiting"),
        ])),
    ])
    return sec(10, "Delivery Channels", "How a statement reaches the client — email, SMS, portal and the sealed counter copy",
               inner, badge=str(SENT_TOTAL) + " sent")


def section11():
    inner = "".join([
        sub("11.1", "The delivery log", table(
            ["Reference", "Statement", "Channel", "When", "State", "Detail"],
            [[l[0], l[1], l[2], l[3], okb(l[4]) if l[4] in ("Delivered", "Opened") else pill(l[4], "b-warn"), l[5]] for l in LOGROWS],
            csv_name="statements-delivery-log"),
            badge=str(len(LOGROWS)) + " recent"),
        sub("11.2", "The month in delivery", strip([
            ("Delivered first time", "<b>99.6%</b>"),
            ("Failed once, retried", "<b>4</b>"),
            ("Failed, fallback used", "<b>1</b>"),
            ("Median time to open", "<b>3 h 12 m</b>"),
            ("Undelivered now", "<b>0</b>"),
        ])),
        sub("11.3", "Retry the failed one",
            '<div class="form-actions"><button class="btn btn-gold" data-toast="Retry queued — ST-2026-8835 goes out again by email and SMS">Retry ST-2026-8835</button></div>'
            + note("A retry is free and always logged. If the second attempt fails, the branch calls the client — "
                   "the statement never just quietly disappears.", "gold")),
    ])
    return sec(11, "Delivery Log", "Every send, open and failure — with the retry that never gives up",
               inner, badge="99.6% first time")


def section12():
    inner = "".join([
        sub("12.1", "Open requests", table(
            ["Reference", "Client", "What they asked for", "Raised", "Channel", "State"],
            [[r[0], r[1], r[2], r[3], r[4], okb(r[5]) if r[5] in ("Ready", "Issued") else pill(r[5], "b-warn")] for r in REQUESTS],
            csv_name="statements-requests"),
            badge=str(len(REQUESTS)) + " requests"),
        sub("12.2", "Serve a request", form([
            ("Request reference", '<input placeholder="REQ-2026-0331" />'),
            ("Channel to deliver", '<select><option>Email</option><option>SMS link</option><option>Branch pick-up</option></select>'),
            ("Note to the client", '<input placeholder="Anything the client asked to be explained" />'),
        ], "Serve the request",
           msg="The SLA is 48 hours from request to delivery — the desk measures itself on it.")),
        sub("12.3", "The request SLA", checks([
            ("pass", "Median service time", "6.2 hours in October", "Met"),
            ("pass", "Full history requests", "Built from the archive, same SLA", "Met"),
            ("warn", "Two ready to serve", "REQ-2026-0331 and REQ-2026-0330 are waiting on the send", "Today"),
            ("pass", "Free of charge", "A client's own statement is never billed", "Free"),
        ])),
    ])
    return sec(12, "Request Desk", "When a client asks for their own paper — the queue, the service and the SLA",
               inner, badge="48-hour SLA")


def section13():
    inner = "".join([
        sub("13.1", "Corrections and reissues", table(
            ["Reference", "Statement", "What was wrong", "When", "State"],
            [[c[0], c[1], c[2], c[3], okb(c[4])] for c in CORRECTIONS],
            csv_name="statements-corrections"),
            badge=str(len(CORRECTIONS)) + " this month"),
        sub("13.2", "The correction rules", bullets([
            "A statement is <b>never edited</b> — it is reissued with a new reference, and the old one is marked superseded.",
            "The correction note travels <b>on the reissue</b>: the client sees what changed and why.",
            "Both versions stay in the archive <b>forever</b> — the audit trail has no delete button.",
            "A correction caused by our error is <b>delivered with an apology</b>, in writing, on the letter.",
        ])),
        sub("13.3", "Raise a correction", form([
            ("Statement reference", '<input placeholder="ST-2026-8841" />'),
            ("What is wrong", '<input placeholder="The line, the field, the figure" />'),
            ("Approved by", '<select><option>Chikondi Mwale · Administrator</option><option>Madalitso Mponda · Finance Manager</option></select>'),
        ], "Queue the reissue",
           msg="A reissue is numbered CR-… and lands in this table the moment it is queued.")),
    ])
    return sec(13, "Corrections & Reissues", "When the paper is wrong — the reissue, the note and the archive that forgets nothing",
               inner, badge="3 this month")


def section14():
    inner = "".join([
        sub("14.1", "Disputed statement lines", table(
            ["Reference", "Statement", "The client's challenge", "Amount", "State"],
            [[d[0], d[1], d[2], d[3], pill(d[4], "b-ok" if d[4].startswith("Resolved") else "b-warn")] for d in DISPUTED],
            csv_name="statements-disputes", num_cols=(3,)),
            badge=str(len(DISPUTED)) + " disputes"),
        sub("14.2", "The life of a dispute", bullets([
            "<b>Day 0</b> — the client challenges a line at the branch, by phone or on the portal.",
            "<b>Day 0–2</b> — the line is checked against the ledger; most disputes end here.",
            "<b>Day 3–5</b> — a genuine error is corrected and the statement reissued with an apology.",
            "<b>Day 5</b> — if the ledger is right, the client receives the full trail of the line, walked end to end.",
        ])),
        sub("14.3", "Dispute discipline", checks([
            ("pass", "Median resolution", "1.8 days in October", "Met"),
            ("pass", "Ledger wins, politely", "Where the books are right, the client sees the whole trail", "3 of 3"),
            ("warn", "DS-2026-0021 open", "A penalty on a paid instalment — reading now", "Today"),
            ("pass", "No disputed line stays silent", "Every dispute is answered in writing", "100%"),
        ])),
    ])
    return sec(14, "Disputed Lines", "When a client challenges the paper — the check, the answer and the fix",
               inner, badge="1.8-day median")


def section15():
    inner = "".join([
        sub("15.1", "Statements against the ledger", table(
            ["Cut", "Statements", "Ledger lines", "Gaps", "Position"],
            [[r[0], r[1], r[2], r[3], pill(r[4], "b-ok" if r[4] == "Matched" else "b-warn")] for r in RECON],
            csv_name="statements-recon", num_cols=(1, 2, 3))
            + '<div class="form-actions"><button class="btn btn-gold" data-run-recon>Reconcile now</button></div>',
            badge="October cuts"),
        sub("15.2", "How reconciliation works", kv([
            ("The rule", "Every line on every statement must sit on the ledger — one to one, by reference."),
            ("The gaps", "A gap means a statement was cut before a late posting landed, or a line was corrected."),
            ("The fix", "A gap never edits the statement; it schedules a reissue under CR-…."),
            ("The proof", "The reconciliation run is itself logged, with its counts and its checksum."),
        ])),
        sub("15.3", "When the gap is ours", bullets([
            "Three savings statements are open this month — <b>late interest postings</b> landed after the cut.",
            "The clients are <b>told first</b>; the reissue follows the same day the reconciliation closes.",
            "The tellers' cut-off is being moved five minutes earlier so the November cut cannot repeat this.",
        ])),
    ])
    return sec(15, "Reconciliation", "The paper against the ledger — one to one, by reference, with the gaps owned",
               inner, badge="3 gaps open")


def section16():
    inner = "".join([
        sub("16.1", "Export the store",
            '<div class="form-actions">'
            '<button class="btn btn-gold" data-toast="Statement export queued — the pack lands in Reports when built">Build the export pack</button>'
            '<button class="btn btn-ghost" data-csv="statements-export-pack">Export the statement tables</button>'
            '</div>'
            + kv([("Auditors", "A signed CSV of a whole cut, on request, within a day."),
                  ("The board", "The company pack in PDF after every close."),
                  ("The client", "Their own statement, free, any channel.")])),
        sub("16.2", "Formats on the shelf", table(
            ["Document", "Format", "What it serves", "Turnaround"],
            [list(e) for e in EXPORTS], csv_name="statements-exports"),
            badge=str(len(EXPORTS)) + " formats"),
        sub("16.3", "Export rules", checks([
            ("pass", "Masked where it must be", "Card and account numbers ride masked — last four only", "Safe"),
            ("pass", "Signed deliveries", "Every outbound document rides a signed link", "Enforced"),
            ("pass", "Exports are logged", "Who exported what, when — every time", "Logged"),
        ])),
    ])
    return sec(16, "Downloads & Exports", "The store, on request — packs for auditors, the board, and the client",
               inner, badge="5 formats")


def section17():
    inner = "".join([
        sub("17.1", "Retention", table(
            ["What", "Kept", "Why"],
            [list(a) for a in ARCHIVE], csv_name="statements-archive"),
            badge="7-year rule"),
        sub("17.2", "How the archive works", bullets([
            "Every statement is <b>immutable</b> in the archive — a reissue is a new document, never an overwrite.",
            "Retrieval is by reference, client, period or batch — <b>under a minute</b>, tested quarterly.",
            "The archive is <b>replicated</b>; a lost data centre cannot lose a statement.",
            "At year seven a statement is reviewed, not deleted — legal holds keep anything in dispute forever.",
        ])),
        sub("17.3", "The legal note", note(
            "Statements are <b>evidence</b>. The archive exists so that any account, any month, any line can be produced "
            "to the client, the auditor, the regulator or the court — complete, unaltered, and with its delivery history "
            "attached.", "gold")),
    ])
    return sec(17, "Archive & Retention", "The paper that must never be lost — immutable, replicated and quick to produce",
               inner, badge="7 years")


def section18():
    inner = "".join([
        sub("18.1", "Who may see what", kv([(a[0], a[1]) for a in ACCESS])),
        sub("18.2", "Privacy checks", checks([
            ("pass", "Own statements only", "A client sees their own paper — the portal enforces it line by line", "Enforced"),
            ("pass", "Counter ID rule", "No printed statement leaves the counter without ID", "Enforced"),
            ("pass", "Masked numbers", "Card and account numbers ride masked on every statement", "Enforced"),
            ("pass", "Access logged", "Staff reads of statements are logged and reviewed monthly", "Logged"),
        ])),
        sub("18.3", "What a statement never carries", bullets([
            "It never carries <b>another client's</b> data — not a name, not a reference, not a footnote.",
            "It never carries a full card or account number — <b>last four only</b>, everywhere, always.",
            "It never carries internal staff notes — the client sees the record, not the commentary.",
        ])),
    ])
    return sec(18, "Access & Privacy", "Who may read what — and the lines a statement must never cross",
               inner, badge="last four only")


def section19():
    inner = "".join([
        sub("19.1", "Run the statement controls", checks([
            ("warn", "Every statement numbered before render", "A build can never duplicate a reference", "Enforced"),
            ("warn", "Statements match the ledger", "The October reconciliation is running with 3 gaps open", "3 gaps"),
            ("warn", "Deliveries logged end to end", "Send, open, failure, retry — all logged", "100%"),
            ("warn", "Archive retrieval under a minute", "Tested quarterly, last passed 28 Oct", "Pass"),
            ("warn", "Masking on every channel", "PDF, print, portal and CSV all ride last four", "Pass"),
        ]) + '<div class="form-actions"><button class="btn btn-gold" data-run-tests>Run the statement controls</button></div>',
            badge="5 controls"),
        sub("19.2", "What each control proves", bullets([
            "<b>Numbering</b> — the reference is minted before the paper is rendered; duplicates are impossible.",
            "<b>Reconciliation</b> — the paper is the ledger's photograph; the run proves it, gap by gap.",
            "<b>Delivery log</b> — a statement that cannot prove it was sent is treated as unsent.",
            "<b>Retrieval</b> — an archive that cannot produce paper on demand is not an archive.",
            "<b>Masking</b> — the client's identity on paper is theirs; their card number is nobody's on paper.",
        ])),
        sub("19.3", "This month's control position", strip([
            ("Builds clean", "<b>2 of 2</b>"),
            ("Reconciliation gaps", "<b>3</b> · reissues queued"),
            ("Delivery failures", "<b>1</b> · fallback sent"),
            ("Retrieval test", "<b>Pass · 28 Oct</b>"),
            ("Masking audit", "<b>Pass · every channel</b>"),
        ])),
    ])
    return sec(19, "Controls & Checks", "The five controls that keep the statement desk honest — run them any time",
               inner, badge="5 controls")


def section20():
    inner = "".join([
        sub("20.1", "The statement audit trail", table(
            ["When", "Action", "Detail", "By"],
            [list(a) for a in AUDIT], csv_name="statements-audit"),
            badge=str(len(AUDIT)) + " recent entries"),
        sub("20.2", "Retention of the desk itself", kv([
            ("Statements", "7 years, immutable, replicated."),
            ("Delivery logs", "3 years — proof of service for every send."),
            ("Batches", "3 years — the checksum to rebuild any cut."),
            ("Audit trail", "Life of the programme — the desk never forgets."),
        ])),
        sub("20.3", "Statement desk settings",
            form([
                ("Monthly cut", '<select><option>Month end · 06:00</option><option>30th · 06:00</option></select>'),
                ("Delivery SLA", '<input value="48 hours" />'),
                ("Email link life", '<select><option>30 days</option><option>7 days</option></select>'),
                ("Fallback channel", '<select><option>SMS link</option><option>Branch call</option></select>'),
            ], "Save the desk settings",
               msg="Every change here is written to the audit trail with the officer and the time.")),
    ])
    return sec(20, "Reports & Audit", "The audit trail, the retention of the desk itself, and the settings",
               inner, badge="never forgets")


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
      <div class="page-title">Statements &amp; the Paper of Record</div>
      <div class="page-sub">Client, loan, savings and company statements · <span id="topRefresh">{TODAY}</span></div>
    </div>
    <div class="search">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9AA0AC" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
      <input placeholder="Search a statement, client, batch or reference…" id="globalSearch" autocomplete="off" />
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
      <h1>Every account, on paper, on time</h1>
      <p>Client, loan, savings and company statements — the calendar that cuts them, the batches that build them,
        the channels that deliver them, the archive that never loses one. Twenty sections, one immutable store.</p>
    </div>
    <div class="band-stats">
      <div class="band-stat"><b>1,208</b><span>Statements this month</span></div>
      <div class="band-stat"><b>99.6%</b><span>Delivered first time</span></div>
      <div class="band-stat"><b>48 h</b><span>Request SLA</span></div>
      <div class="band-stat"><b>7 yrs</b><span>Retention</span></div>
    </div>
    <div class="mb-actions">
      <button class="btn btn-gold" data-goto="s15">Reconcile the paper</button>
      <button class="btn btn-ghost" data-goto="s3">Open client statements</button>
    </div>
  </div>
'''


def filterbar():
    defs = [("Kind", ["All kinds", "Loan", "Savings", "Company", "Certificate"]),
            ("Period", ["All periods", "Oct 2026", "Sep 2026", "Q3 2026"]),
            ("State", ["All states", "Sent", "Opened", "Downloaded", "Ready", "Failed"]),
            ("Channel", ["All channels", "Email", "SMS link", "Portal", "Branch pick-up"])]
    sels = "".join(
        '<div class="fg"><label>' + esc(l) + '</label><select data-filter="' + esc(l.lower()) + '">' +
        "".join(f"<option>{esc(o)}</option>" for o in opts) + "</select></div>" for l, opts in defs)
    return f'''
  <div class="card panel filterpanel">
    <div class="panel-head"><div><div class="panel-title">Filter the statement desk</div>
      <div class="panel-sub">Every panel below narrows with these controls — kind, period, state and channel</div></div>
      <span class="badge b-gray" id="filterCount">no filters</span></div>
    <div class="form-grid four">{sels}
      <div class="fg"><label>Search</label><input id="filterSearch" placeholder="reference, client, batch…" /></div>
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
/* ---------- statements-specific extras ---------- */
.filterpanel{margin-bottom:13px}
.sub .hbar:last-child{margin-bottom:0}
.strip .sv{overflow-wrap:anywhere}
.smflag{font-size:9px;font-weight:800;letter-spacing:.3px;color:#7A5E10;
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

    with open("_sm2body.html", "w", encoding="utf-8") as fh:
        fh.write(html_out)
    with open("_statements2.css", "w", encoding="utf-8") as fh:
        fh.write(css_out)
    n_sub = html_out.count("data-sub=")
    print("wrote _sm2body.html (%d bytes, %d panels), _statements2.css (%d)"
          % (len(html_out), n_sub, len(css_out)))


if __name__ == "__main__":
    main()
