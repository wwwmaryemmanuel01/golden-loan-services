#!/usr/bin/env python3
"""
Builds the Statistics body from the twenty-section specification.

Every numbered sub-item becomes a numbered panel of its own (1.1 … 20.4), so
nothing in the specification is implicit.  The page is generated so the
figures agree across sections: one book, one month series, one client base —
the same rows re-cut per view.
"""
import html
from _gen_common import (esc, money, pill, okb, kv, strip, table, checks, bars,
                         svg_bars, svg_donut, note, bullets, form, sub, sec)

TODAY = "05 Nov 2026"
NOW = "09:05"

# ----------------------------------------------------------------- data ----
SUBS = [
    (1, "Overview"), (2, "Portfolio"), (3, "Disbursements"), (4, "Repayments"),
    (5, "Arrears & ageing"), (6, "Collections"), (7, "Clients"), (8, "Products"),
    (9, "Branches"), (10, "Officers"), (11, "Channels"), (12, "Income"),
    (13, "Cycle & tenure"), (14, "Cohorts"), (15, "Conversion"), (16, "Risk & scores"),
    (17, "Savings"), (18, "Web & portal"), (19, "Data quality"), (20, "Reports & audit"),
]

# the twelve rolling months, oldest first
MONTHS = ["Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov"]
DISB_M = [8_200_000, 9_100_000, 7_800_000, 10_400_000, 9_600_000, 11_200_000,
          10_800_000, 12_500_000, 11_900_000, 13_100_000, 12_400_000, 14_000_000]
DUE_M = [7_900_000, 8_600_000, 8_100_000, 9_700_000, 9_900_000, 10_600_000,
         11_100_000, 11_800_000, 12_300_000, 12_600_000, 13_200_000, 13_400_000]
COLL_M = [7_420_000, 8_180_000, 7_560_000, 9_130_000, 9_420_000, 10_070_000,
          10_540_000, 11_260_000, 11_730_000, 12_090_000, 12_670_000, 12_860_000]
ONTIME = [88.4, 89.1, 87.6, 89.8, 90.2, 90.6, 91.0, 91.4, 91.8, 92.1, 92.6, 93.0]

# code, product, active, disbursed ytd, outstanding, par30, avg term
PRODUCTS = [
    ("PL-01", "Personal Loans", 312, 41_800_000, 18_640_000, 4.1, "1–12 months"),
    ("BL-02", "Business Loans", 158, 78_400_000, 41_250_000, 6.3, "6–36 months"),
    ("AL-03", "Agricultural Loans", 96, 26_900_000, 15_480_000, 9.4, "3–12 months"),
    ("SA-04", "Salary Advance Loans", 204, 22_100_000, 8_940_000, 1.8, "1–6 months"),
    ("CL-05", "Collateral Loans", 62, 31_600_000, 19_730_000, 3.2, "12–36 months"),
]
BOOK = sum(p[4] for p in PRODUCTS)
ACTIVE_LOANS = sum(p[2] for p in PRODUCTS)
DISB_YTD = sum(DISB_M)
PAR30 = round(sum(p[4] * p[5] for p in PRODUCTS) / BOOK, 1)

# bucket, loans, amount, share of book
AGEING = [
    ("Current", 624, BOOK - 9_860_000, "95.3%"),
    ("1–30 days", 38, 4_120_000, "2.1%"),
    ("31–60 days", 21, 2_760_000, "1.4%"),
    ("61–90 days", 13, 1_730_000, "0.9%"),
    ("90+ days", 12, 1_250_000, "0.6%"),
]

BRANCHES = [
    ("Lilongwe · HQ", 612, 398, 41_060_000, 2.9, 24),
    ("Blantyre", 384, 241, 26_730_000, 4.6, 18),
    ("Mzuzu", 216, 118, 17_850_000, 6.1, 11),
    ("Zomba", 158, 75, 18_400_000, 5.4, 9),
]
CLIENTS = sum(b[1] for b in BRANCHES)

# officer, active loans, outstanding, collected 90d, on-time %, promises kept
OFFICERS = [
    ("Yamikani Banda", 92, 9_640_000, 8_120_000, 93.8, "96%"),
    ("Blessings Tembo", 88, 8_910_000, 7_640_000, 92.4, "94%"),
    ("Tadala Msonthi", 84, 9_280_000, 7_910_000, 91.6, "93%"),
    ("Linda Mhango", 81, 8_450_000, 7_380_000, 93.1, "95%"),
    ("Esther Mwale", 76, 7_620_000, 6_540_000, 90.8, "92%"),
    ("Fatsani Gondwe", 71, 6_980_000, 5_870_000, 89.4, "90%"),
    ("Alinafe Nyirenda", 64, 6_140_000, 5_210_000, 91.2, "93%"),
    ("Memory Phiri", 58, 5_560_000, 4_680_000, 88.7, "89%"),
]

CHANNELS = [
    ("Airtel Money", 4_128, 38_420_000, 98.2, "1.5%"),
    ("TNM Mpamba", 1_966, 17_240_000, 96.4, "1.5%"),
    ("Bank transfer", 1_214, 96_800_000, 99.1, "0%"),
    ("Cash at branch", 1_806, 21_340_000, 100.0, "0%"),
    ("Internal transfer", 804, 24_910_000, 100.0, "0%"),
]

INCOME_M = [1_240_000, 1_310_000, 1_260_000, 1_420_000, 1_380_000, 1_510_000,
            1_470_000, 1_590_000, 1_560_000, 1_680_000, 1_640_000, 1_760_000]
FEE_SHARE = 18

COHORTS = [
    ("2025 Q3", 118, "87.3%", "62%", "2.1 loans"),
    ("2025 Q4", 146, "88.4%", "58%", "1.9 loans"),
    ("2026 Q1", 172, "90.1%", "61%", "1.8 loans"),
    ("2026 Q2", 198, "91.2%", "57%", "1.6 loans"),
    ("2026 Q3", 214, "92.6%", "—", "1.3 loans"),
]

FUNNEL = [
    ("Applications received", 1_240),
    ("Screened complete", 1_102),
    ("Approved", 866),
    ("Offer accepted", 841),
    ("Disbursed", 812),
    ("Active today", 734),
]

SCORES = [
    ("300–579 · high risk", 41, "12.6%", 2_8),
    ("580–669 · sub-prime", 168, "8.9%", 4_1),
    ("670–739 · near-prime", 642, "4.7%", 6_4),
    ("740–799 · prime", 1_020, "2.3%", 9_8),
    ("800–850 · super-prime", 1_399, "0.9%", 13_2),
]
# fix score tuple shape: (band, clients, share, avg_rate_x100)
SCORES = [(b, c, s, r / 10) for b, c, s, r in SCORES]

SAVINGS = [
    ("Savings accounts", 1_104, 38_640_000, 3.0),
    ("Fixed deposits", 186, 52_180_000, 8.5),
    ("Group savings", 34, 9_420_000, 2.6),
]

WEB = [
    ("Site visits · Oct", 12_840),
    ("Calculator uses · Oct", 3_166),
    ("Applications started online", 428),
    ("Applications submitted online", 302),
    ("Conversion · visit → application", "2.4%"),
]

DATAQ = [
    ("Client records complete", "KYC, ID and contact on every active client", "99.2%"),
    ("Loans with full schedule", "Every active loan carries its schedule", "100%"),
    ("Repayments matched same day", "Receipts matched to the ledger within the day", "97.6%"),
    ("Branch data posted by the 3rd", "Monthly branch returns on time", "4 of 4"),
    ("No orphan transactions", "Every movement sits on a client and a loan", "Clean"),
]

AUDIT = [
    ("05 Nov 2026 · 08:40", "Statistics refreshed", "Portfolio, collections and client counts rebuilt", "System"),
    ("04 Nov 2026 · 17:12", "Report pack exported", "October statistics pack · PDF and CSV", "Madalitso Mponda"),
    ("03 Nov 2026 · 09:26", "Definition changed", "PAR30 now uses instalment-level ageing", "Chikondi Mwale"),
    ("01 Nov 2026 · 16:05", "Branch return posted", "Zomba September return posted late · noted", "Linda Mhango"),
    ("28 Oct 2026 · 11:30", "Cohort rebuilt", "2026 Q3 cohort closed at 214 clients", "System"),
]

# --------------------------------------------------------------- shared ----
def month_table(values, label, csv_name):
    return table(
        ["Month"] + [esc(m) for m in MONTHS],
        [[label] + [money(v) for v in values]],
        csv_name=csv_name)


def rate_table(values, label):
    return table(
        ["Month"] + [esc(m) for m in MONTHS],
        [[label] + [f"{v:.1f}%" for v in values]])


# ------------------------------------------------------------- sections ----
def section1():
    inner = "".join([
        sub("1.1", "The book at a glance", strip([
            ("Loans active", "<b>" + str(ACTIVE_LOANS) + "</b>"),
            ("Clients", "<b>" + str(CLIENTS) + "</b>"),
            ("Book outstanding", "<b>" + money(BOOK) + "</b>"),
            ("Disbursed YTD", "<b>" + money(DISB_YTD) + "</b>"),
            ("PAR30", "<b>" + f"{PAR30}%" + "</b>"),
        ])),
        sub("1.2", "Disbursements, last 12 months",
            svg_bars(MONTHS, [v // 100_000 for v in DISB_M],
                     unit="MK 100,000 per unit · disbursement has grown every quarter of 2026.",
                     colour="#0C4A6E"), badge="12 months"),
        sub("1.3", "Where the book sits by product",
            svg_donut([(p[1], p[4], c) for p, c in
                       zip(PRODUCTS, ["#0C4A6E", "#2F6FED", "#C9A227", "#1E9E6A", "#7C5CF0"])], size=130)
            + kv([(p[1], money(p[4])) for p in PRODUCTS])),
        sub("1.4", "Needs attention now", checks([
            ("warn", "Agricultural PAR30 at 9.4%", "The rains late the book — collections watching the Feb–Apr cohort", "1 product"),
            ("warn", "12 loans beyond 90 days", money(1_250_000) + " in the oldest bucket · 6 with the branch counsel", "12 loans"),
            ("pass", "Repayment rate", "Collected " + money(COLL_M[-1]) + " of " + money(DUE_M[-1]) + " due in October", "96.0%"),
            ("pass", "Data quality", "Client records complete at 99.2% — see section 19", "Healthy"),
            ("pass", "Reporting calendar", "Every branch posted its October return", "On time"),
        ])),
        sub("1.5", "The month against last month", strip([
            ("Disbursed", "<b>" + money(DISB_M[-1]) + "</b> · +" + money(DISB_M[-1] - DISB_M[-2]) + " on Sep"),
            ("Collected", "<b>" + money(COLL_M[-1]) + "</b> · +" + money(COLL_M[-1] - COLL_M[-2]) + " on Sep"),
            ("On-time rate", "<b>" + f"{ONTIME[-1]}%" + "</b> · +" + f"{round(ONTIME[-1]-ONTIME[-2],1)}" + " pts"),
            ("New clients", "<b>146</b> · October intake"),
            ("PAR30", "<b>" + f"{PAR30}%" + "</b> · steady"),
        ])),
    ])
    return sec(1, "Statistics Overview", "The whole book in numbers — size, growth, quality and the items that need a person",
               inner, badge="live · " + NOW)


def section2():
    inner = "".join([
        sub("2.1", "The portfolio by product", table(
            ["Code", "Product", "Active loans", "Disbursed YTD", "Outstanding", "PAR30", "Terms"],
            [[p[0], p[1], p[2], money(p[3]), money(p[4]), f"{p[5]}%", p[6]] for p in PRODUCTS],
            csv_name="statistics-portfolio", num_cols=(2, 3, 4)),
            badge=str(ACTIVE_LOANS) + " active loans"),
        sub("2.2", "Outstanding mix",
            svg_donut([(p[1], p[4], c) for p, c in
                       zip(PRODUCTS, ["#0C4A6E", "#2F6FED", "#C9A227", "#1E9E6A", "#7C5CF0"])], size=120)
            + kv([("Largest", "Business Loans · " + money(41_250_000)),
                  ("Smallest", "Salary Advance · " + money(8_940_000)),
                  ("Total book", money(BOOK))])),
        sub("2.3", "Book size, month by month",
            svg_bars(MONTHS, [18_400 + i * 1_150 for i in range(12)],
                     unit="Outstanding in MK 100,000 units · the book has grown 2.1× in twelve months.",
                     colour="#2F6FED"), badge="12 months"),
        sub("2.4", "How the portfolio is counted", kv([
            ("Active loan", "A loan with an outstanding balance above zero."),
            ("Outstanding", "Principal plus earned interest not yet paid."),
            ("PAR30", "Share of the book with a instalment 30+ days late."),
            ("Cut-off", "Every figure on this page is as at close of " + TODAY + "."),
        ])),
    ])
    return sec(2, "Portfolio Statistics", "What the book holds, by product — active loans, outstanding and quality",
               inner, badge=money(BOOK))


def section3():
    inner = "".join([
        sub("3.1", "Disbursed per month", month_table(DISB_M, "Disbursed", "statistics-disbursements"),
            badge=money(DISB_YTD) + " YTD"),
        sub("3.2", "Average loan size",
            svg_bars(MONTHS, [v // n // 1000 for v, n in
                              zip(DISB_M, [64, 68, 66, 72, 74, 78, 80, 84, 86, 90, 92, 96])],
                     unit="Average new-loan size in MK 1,000 units · rising with the business mix.",
                     colour="#0C4A6E"), badge="12 months"),
        sub("3.3", "This month by product", bars(
            [(p[1], p[3], DISB_M[-1] * 6, money(p[3])) for p in PRODUCTS], colour="#0C4A6E")),
        sub("3.4", "Speed of payout", strip([
            ("Same-day payout", "<b>94.2%</b>"),
            ("Next-day payout", "<b>5.1%</b>"),
            ("Longer", "<b>0.7%</b> · collateral valuations"),
            ("Median approval-to-cash", "<b>3.2 hours</b>"),
            ("Fastest", "<b>26 minutes</b>"),
        ])),
    ])
    return sec(3, "Disbursement Statistics", "How much goes out the door, how big the average loan is, and how fast it lands",
               inner, badge=money(DISB_M[-1]) + " in October")


def section4():
    inner = "".join([
        sub("4.1", "Due against collected", table(
            ["Month"] + [esc(m) for m in MONTHS],
            [["Due"] + [money(v) for v in DUE_M],
             ["Collected"] + [money(v) for v in COLL_M],
             ["Rate"] + [f"{round(c / d * 100, 1)}%" for c, d in zip(COLL_M, DUE_M)]],
            csv_name="statistics-repayments"),
            badge="12 months"),
        sub("4.2", "Collection rate trend",
            svg_bars(MONTHS, [round(c / d * 100) for c, d in zip(COLL_M, DUE_M)],
                     unit="Collected as a share of what fell due · the yellow line never lies.",
                     colour="#C9A227"), badge="trending up"),
        sub("4.3", "On-time repayment", rate_table(ONTIME, "On-time") +
            kv([("October", f"{ONTIME[-1]}% of instalments paid on or before the due date"),
                ("Best month", f"{max(ONTIME)}%"),
                ("Twelve-month average", f"{round(sum(ONTIME)/12,1)}%")])),
        sub("4.4", "How collection is measured", note(
            "A repayment is <b>collected</b> when the money is confirmed by the channel and matched to the loan. "
            "An instalment is <b>on time</b> when it lands on or before its due date. Prepayments are counted in the "
            "month they arrive; arrears recoveries are counted against the month the instalment fell due, so the rate "
            "never flatters the collector.", "gold")),
    ])
    return sec(4, "Repayment Statistics", "What fell due, what came in, and how much of it arrived on time",
               inner, badge=f"{round(COLL_M[-1]/DUE_M[-1]*100,1)}%" + " · October")


def section5():
    inner = "".join([
        sub("5.1", "The ageing buckets", table(
            ["Bucket", "Loans", "Amount", "Share of book"],
            [[a[0], a[1], money(a[2]), a[3]] for a in AGEING],
            csv_name="statistics-ageing", num_cols=(1, 2)),
            badge=str(sum(a[1] for a in AGEING[1:])) + " loans in arrears"),
        sub("5.2", "Where the arrears sit",
            svg_donut([(a[0], a[1], c) for a, c in
                       zip(AGEING[1:], ["#E4B33A", "#E4813A", "#E4453A", "#8A1E1E"])], size=120)
            + kv([(a[0], money(a[2])) for a in AGEING[1:]])),
        sub("5.3", "PAR30 by product", bars(
            [(p[1], int(p[5] * 10), 94, f"{p[5]}%") for p in PRODUCTS], colour="#E4453A")),
        sub("5.4", "The watchlist", checks([
            ("fail", "90+ days · 12 loans", money(1_250_000) + " · 6 handed to counsel, 6 in restructuring", "12 loans"),
            ("warn", "61–90 days · 13 loans", money(1_730_000) + " · officer visits booked this week", "13 loans"),
            ("warn", "Agricultural season", "AL-03 carries the rains risk until the April harvest", "9.4% PAR"),
            ("pass", "Recoveries in October", money(412_000) + " brought back from the older buckets", "Recovered"),
        ])),
    ])
    return sec(5, "Arrears & Ageing", "The book that has stopped paying, bucket by bucket — and who is on the watchlist",
               inner, badge=f"{PAR30}% PAR30")


def section6():
    inner = "".join([
        sub("6.1", "Promises kept", table(
            ["Officer", "Promises taken", "Kept", "Broken", "Rate"],
            [[o[0], 40 + i * 3, "", "", o[5]] for i, o in enumerate(OFFICERS)],
            csv_name="statistics-collections"),
            badge="October"),
        sub("6.2", "The month in collections", strip([
            ("Visits made", "<b>218</b>"),
            ("Calls logged", "<b>1,042</b>"),
            ("Recovered", "<b>" + money(412_000) + "</b>"),
            ("Restructures agreed", "<b>9</b>"),
            ("Handed to counsel", "<b>6</b>"),
        ])),
        sub("6.3", "Officer leaderboard", table(
            ["Officer", "Active loans", "Outstanding", "Collected 90d", "On-time"],
            [[o[0], o[1], money(o[2]), money(o[3]), f"{o[4]}%"] for o in
             sorted(OFFICERS, key=lambda o: -o[3])],
            csv_name="statistics-officers-collections", num_cols=(1, 2, 3)),
            badge="top 8"),
        sub("6.4", "The rules of the board", bullets([
            "Only <b>confirmed</b> money counts — a promise of a payment is not a payment.",
            "Restructured loans leave the officer's arrears but stay on the branch's record.",
            "Counsel cases are counted at <b>both</b> the branch and the legal recovery line — nothing disappears.",
        ])),
    ])
    return sec(6, "Collection Efficiency", "Visits, promises, recoveries and the officers who bring the money home",
               inner, badge=money(412_000) + " recovered")


def section7():
    inner = "".join([
        sub("7.1", "The client base", table(
            ["Branch", "Clients", "Active loans", "Outstanding", "PAR30", "Staff"],
            [[b[0], b[1], b[2], money(b[3]), f"{b[4]}%", b[5]] for b in BRANCHES],
            csv_name="statistics-clients", num_cols=(1, 2, 3)),
            badge=str(CLIENTS) + " clients"),
        sub("7.2", "Client growth, 12 months",
            svg_bars(MONTHS, [640 + i * 28 for i in range(12)],
                     unit="Active clients at month end · 1,370 today, 640 twelve months ago.",
                     colour="#1E9E6A"), badge="2.1× in a year"),
        sub("7.3", "KYC completeness",
            svg_donut([("Complete", 97_2, "#1E9E6A"), ("Pending documents", 2_8, "#E4B33A")], size=110)
            + kv([("Complete", "ID, photo, contact and next-of-kin on file"),
                  ("Pending", "34 clients have a document chase open"),
                  ("Rule", "No disbursement without complete KYC")])),
        sub("7.4", "Who counts as a client", kv([
            ("Active", "A client with a loan or a savings balance today."),
            ("New", "First loan disbursed inside the month."),
            ("Dormant", "No loan and no transaction for 90 days."),
            ("Graduated", "A group client who took an individual loan."),
        ])),
    ])
    return sec(7, "Client Statistics", "Who we serve — the base, its growth, its KYC completeness and the definitions",
               inner, badge=str(CLIENTS) + " clients")


def section8():
    inner = "".join([
        sub("8.1", "The five official products", table(
            ["Code", "Product", "Active", "Disbursed YTD", "Outstanding", "PAR30", "Terms"],
            [[p[0], p[1], p[2], money(p[3]), money(p[4]), f"{p[5]}%", p[6]] for p in PRODUCTS],
            csv_name="statistics-products", num_cols=(2, 3, 4)),
            badge="PL-01 … CL-05"),
        sub("8.2", "Uptake by product",
            svg_donut([(p[1], p[2], c) for p, c in
                       zip(PRODUCTS, ["#0C4A6E", "#2F6FED", "#C9A227", "#1E9E6A", "#7C5CF0"])], size=120)
            + kv([(p[1], str(p[2]) + " loans") for p in PRODUCTS])),
        sub("8.3", "Terms on the book", bars([
            ("1–6 months", 286, 624, "286 loans"),
            ("6–12 months", 224, 624, "224 loans"),
            ("12–24 months", 118, 624, "118 loans"),
            ("24–36 months", 62, 624, "62 loans"),
        ], colour="#0C4A6E")),
        sub("8.4", "What the numbers say", bullets([
            "<b>Business Loans</b> carry the book — the largest outstanding and the steadiest repayment.",
            "<b>Salary Advance</b> is the cleanest product: 1.8% PAR30 on the payroll deduction rail.",
            "<b>Agricultural Loans</b> carry the rains — the committee reviews the ceiling every February.",
            "<b>Collateral Loans</b> price for the asset: the lowest rate, the longest term, the deepest checks.",
        ])),
    ])
    return sec(8, "Product Performance", "The five products against each other — uptake, book, quality and terms",
               inner, badge="5 products")


def section9():
    inner = "".join([
        sub("9.1", "The branches", table(
            ["Branch", "Clients", "Active loans", "Outstanding", "PAR30", "Staff"],
            [[b[0], b[1], b[2], money(b[3]), f"{b[4]}%", b[5]] for b in BRANCHES],
            csv_name="statistics-branches", num_cols=(1, 2, 3)),
            badge="4 branches"),
        sub("9.2", "Share of the book",
            svg_donut([(b[0].split(" · ")[0], b[3], c) for b, c in
                       zip(BRANCHES, ["#0C4A6E", "#2F6FED", "#C9A227", "#1E9E6A"])], size=120)
            + kv([(b[0], money(b[3])) for b in BRANCHES])),
        sub("9.3", "Cost to serve", strip([
            ("Cost per loan · HQ", "<b>MK 41,200</b>"),
            ("Cost per loan · Blantyre", "<b>MK 48,900</b>"),
            ("Cost per loan · Mzuzu", "<b>MK 63,400</b>"),
            ("Cost per loan · Zomba", "<b>MK 57,800</b>"),
            ("Target", "<b>MK 45,000</b> by mid-2027"),
        ])),
        sub("9.4", "Expansion watchlist", checks([
            ("pass", "Blantyre", "PAR down from 6.1% to 4.6% after the collections reset", "Improving"),
            ("warn", "Mzuzu", "Highest PAR and cost — a senior collections officer is being posted", "6.1%"),
            ("pass", "Zomba", "Newest branch, ahead of its year-one plan", "Ahead"),
            ("pass", "HQ", "Carries 44% of the book at the lowest cost to serve", "Steady"),
        ])),
    ])
    return sec(9, "Branch Statistics", "The four branches against each other — book, quality, staff and what a loan costs there",
               inner, badge="4 branches")


def section10():
    inner = "".join([
        sub("10.1", "The officers", table(
            ["Officer", "Active loans", "Outstanding", "Collected 90d", "On-time", "Promises kept"],
            [[o[0], o[1], money(o[2]), money(o[3]), f"{o[4]}%", o[5]] for o in OFFICERS],
            csv_name="statistics-officers", num_cols=(1, 2, 3)),
            badge="8 loan officers"),
        sub("10.2", "Productivity", bars(
            [(o[0], o[1], 92, str(o[1]) + " loans") for o in OFFICERS], colour="#2F6FED")),
        sub("10.3", "Quality of the book", checks([
            ("pass", "Nobody above 100 loans", "The ceiling protects the quality of the follow-up", "Enforced"),
            ("warn", "Two officers under 90% on-time", "Coaching booked with the collections lead", "2 officers"),
            ("pass", "Promises kept above 89%", "Every officer clears the 85% house rule", "8 of 8"),
            ("pass", "No self-approval", "The statistics carry the audit trail of every decision", "Clean"),
        ])),
        sub("10.4", "How the board is read", note(
            "Productivity is loans carried; quality is on-time and promises kept. An officer is rewarded on the "
            "<b>pair</b>, never on volume alone — a book that does not pay is not a book.", "gold")),
    ])
    return sec(10, "Officer Statistics", "The people behind the numbers — books carried, money collected, promises kept",
               inner, badge="8 officers")


def section11():
    inner = "".join([
        sub("11.1", "The channels", table(
            ["Channel", "Movements · Oct", "Value · Oct", "Success", "Customer fee"],
            [[c[0], c[1], money(c[2]), f"{c[3]}%", c[4]] for c in CHANNELS],
            csv_name="statistics-channels", num_cols=(1, 2)),
            badge="5 channels"),
        sub("11.2", "Value by channel",
            svg_donut([(c[0], c[2], col) for c, col in
                       zip(CHANNELS, ["#E4453A", "#1E9E6A", "#2F6FED", "#C9A227", "#7C5CF0"])], size=120)
            + kv([(c[0], money(c[2])) for c in CHANNELS])),
        sub("11.3", "Success rates", bars(
            [(c[0], int(c[3] * 10), 1000, f"{c[3]}%") for c in CHANNELS], colour="#1E9E6A")),
        sub("11.4", "What a movement costs", strip([
            ("Airtel Money", "<b>MK 612</b> blended"),
            ("TNM Mpamba", "<b>MK 596</b> blended"),
            ("Bank transfer", "<b>MK 190</b>"),
            ("Cash at branch", "<b>MK 2,100</b> · teller time"),
            ("Internal", "<b>MK 0</b>"),
        ])),
    ])
    return sec(11, "Channel Statistics", "Where the money travels — movements, value, success and the cost of every rail",
               inner, badge="5 channels")


def section12():
    inner = "".join([
        sub("12.1", "Interest and fee income by month", month_table(INCOME_M, "Income", "statistics-income"),
            badge=money(sum(INCOME_M)) + " YTD"),
        sub("12.2", "The income mix",
            svg_donut([("Interest", 100 - FEE_SHARE, "#0C4A6E"), ("Fees", FEE_SHARE, "#C9A227")], size=110)
            + kv([("Interest", money(round(sum(INCOME_M) * (100 - FEE_SHARE) / 100))),
                  ("Fees and penalties", money(round(sum(INCOME_M) * FEE_SHARE / 100))),
                  ("Rule", "Fees are never counted as interest")])),
        sub("12.3", "Yield on the book", strip([
            ("Portfolio yield", "<b>3.8% / month</b>"),
            ("Effective annual", "<b>56.7%</b>"),
            ("Cost of funds", "<b>—</b> · self-funded"),
            ("Operating cost ratio", "<b>46.2%</b>"),
            ("Contribution", "<b>53.8%</b>"),
        ])),
        sub("12.4", "How income is recognised", bullets([
            "Interest is recognised <b>as it is earned</b> — day by day on the outstanding balance.",
            "A fee is recognised <b>when it is earned</b>: the application fee when the loan is approved, the insurance fee when the cover starts.",
            "Penalties are recognised <b>when they are levied</b> and reversed in full when waived.",
            "Write-offs reverse the unpaid interest the day the loan is written off.",
        ])),
    ])
    return sec(12, "Interest & Fee Income", "What the book earns — interest, fees and penalties, month by month",
               inner, badge=money(INCOME_M[-1]) + " in October")


def section13():
    inner = "".join([
        sub("13.1", "Terms on the book", table(
            ["Term band", "Loans", "Share", "Typical products"],
            [["1–6 months", 286, "35.7%", "Salary Advance · short Personal"],
             ["6–12 months", 224, "27.9%", "Personal · Agricultural"],
             ["12–24 months", 118, "14.7%", "Business · Collateral"],
             ["24–36 months", 62, "7.7%", "Business · Collateral"],
             ["Seasonal", 112, "14.0%", "Agricultural · harvest-aligned"]],
            csv_name="statistics-tenure", num_cols=(1,)),
            badge=str(ACTIVE_LOANS) + " loans"),
        sub("13.2", "The shape of a loan", strip([
            ("Average term", "<b>8.4 months</b>"),
            ("Average instalments", "<b>8.1</b>"),
            ("Average size", "<b>" + money(131_400) + "</b>"),
            ("Smallest this month", "<b>" + money(25_000) + "</b>"),
            ("Largest this month", "<b>" + money(2_400_000) + "</b>"),
        ])),
        sub("13.3", "Repeat borrowing", bars([
            ("First loan", 428, 812, "428 loans"),
            ("Second loan", 244, 812, "244 loans"),
            ("Third loan or more", 140, 812, "140 loans"),
        ], colour="#0C4A6E")),
        sub("13.4", "Why tenure matters", note(
            "Term statistics drive the liquidity plan: a book that shortens must be replaced faster. The average term "
            "has moved from 9.6 to 8.4 months as Salary Advance grows — the treasury sees this panel before the "
            "committee sets the month's ceilings.", "gold")),
    ])
    return sec(13, "Loan Cycle & Tenure", "How long the money stays out — terms, sizes and the cycle of a loan",
               inner, badge="8.4 months average")


def section14():
    inner = "".join([
        sub("14.1", "The cohorts", table(
            ["Cohort", "Clients", "Still active", "Repeat rate", "Loans per client"],
            [[c[0], c[1], c[2], c[3], c[4]] for c in COHORTS],
            csv_name="statistics-cohorts", num_cols=(1,)),
            badge="5 cohorts"),
        sub("14.2", "Retention by cohort", bars(
            [(c[0], int(float(c[2][:-1])), 100, c[2]) for c in COHORTS], colour="#1E9E6A")),
        sub("14.3", "What retention costs and earns", strip([
            ("Cost to acquire a client", "<b>MK 18,400</b>"),
            ("Cost to keep a client", "<b>MK 4,100</b>"),
            ("Repeat loan value", "<b>" + money(186_000) + " average</b>"),
            ("Referrals per retained client", "<b>0.8</b>"),
            ("House rule", "<b>Retention before acquisition</b>"),
        ])),
        sub("14.4", "How a cohort is read", kv([
            ("Joined", "A client joins the cohort of the quarter of their <b>first disbursement</b>."),
            ("Still active", "Has an open loan or a balance at the quarter's end, twelve months later."),
            ("Repeat rate", "Took a second loan inside twelve months of the first."),
            ("Read with care", "The newest cohort always looks best — judge at the twelve-month mark."),
        ])),
    ])
    return sec(14, "Cohorts & Retention", "The clients we keep — quarter by quarter, and what a kept client is worth",
               inner, badge="92.6% newest cohort")


def section15():
    inner = "".join([
        sub("15.1", "From application to active loan", table(
            ["Stage", "Count", "Through-rate"],
            [[FUNNEL[0][0], FUNNEL[0][1], "—"]] +
            [[FUNNEL[i][0], FUNNEL[i][1],
              f"{round(FUNNEL[i][1] / FUNNEL[i - 1][1] * 100, 1)}%"] for i in range(1, len(FUNNEL))],
            csv_name="statistics-funnel", num_cols=(1,)),
            badge="October"),
        sub("15.2", "Where applications stop", bars([
            ("Screening (documents, KYC)", 138, 138, "138 stopped"),
            ("Appraisal & committee", 236, 236, "236 stopped"),
            ("Offer not accepted", 25, 25, "25 stopped"),
            ("Disbursement pending", 29, 29, "29 in flight"),
        ], colour="#E4B33A")),
        sub("15.3", "Conversion by source", table(
            ["Source", "Applications", "Disbursed", "Conversion"],
            [["Branch walk-in", 612, 452, "73.9%"],
             ["Online portal", 302, 196, "64.9%"],
             ["Phone / WhatsApp", 208, 118, "56.7%"],
             ["Referrals", 118, 86, "72.9%"]],
            csv_name="statistics-conversion", num_cols=(1, 2)),
            badge="4 sources"),
        sub("15.4", "Funnel discipline", checks([
            ("pass", "Every decline carries a reason", "The funnel counts reasons, not guesses", "100%"),
            ("pass", "Screening inside 48 hours", "Median 6.1 hours in October", "Met"),
            ("warn", "Committee queue", "The Zomba branch opening added 22 corporate applications", "3-day wait"),
            ("pass", "No gatekept funnel", "Every stage is timed and published on this panel", "Open"),
        ])),
    ])
    return sec(15, "Conversion Funnel", "From application to active loan — where clients enter, and where they stop",
               inner, badge="812 disbursed")


def section16():
    inner = "".join([
        sub("16.1", "Credit score bands", table(
            ["Band", "Clients", "Share", "Average rate / month"],
            [[s[0], s[1], s[2], f"{s[3]}%"] for s in SCORES],
            csv_name="statistics-scores", num_cols=(1,)),
            badge="scored book"),
        sub("16.2", "PAR30 by band", bars(
            [(s[0].split(" · ")[1], int(float(s[2][:-1]) * 10), 130, s[2] + " PAR30") for s in SCORES],
            colour="#E4453A")),
        sub("16.3", "Risk events, this quarter", strip([
            ("Cheque / debit bounces", "<b>22</b>"),
            ("Risk reclassifications", "<b>17 loans</b>"),
            ("Fraud attempts blocked", "<b>4</b>"),
            ("Write-offs", "<b>3 loans · " + money(680_000) + "</b>"),
            ("Provisions held", "<b>" + money(2_140_000) + "</b>"),
        ])),
        sub("16.4", "The risk rules the stats obey", bullets([
            "A loan 30+ days late is <b>reclassified</b> the same day; its interest stops accruing to income.",
            "Every write-off carries <b>the reason and the recovery attempt log</b> — nothing is written off quietly.",
            "Provisions follow the ageing bucket, <b>25% at 90 days</b>, 100% at write-off.",
        ])),
    ])
    return sec(16, "Risk & Credit Scores", "The book by risk band — scores, PAR by band, and the quarter's risk events",
               inner, badge="PAR30 " + f"{PAR30}%")


def section17():
    inner = "".join([
        sub("17.1", "Savings and deposits", table(
            ["Product", "Accounts", "Balances", "Share"],
            [[s[0], s[1], money(s[2]), f"{s[3]}%"] for s in SAVINGS],
            csv_name="statistics-savings", num_cols=(1, 2)),
            badge=money(sum(s[2] for s in SAVINGS)) + " held"),
        sub("17.2", "Savings growth, 12 months",
            svg_bars(MONTHS, [6_200 + i * 850 for i in range(12)],
                     unit="Total balances in MK 100,000 units · deposits fund the book, so they are watched weekly.",
                     colour="#1E9E6A"), badge="12 months"),
        sub("17.3", "Where the balances sit",
            svg_donut([(s[0], s[2], c) for s, c in
                       zip(SAVINGS, ["#1E9E6A", "#0C4A6E", "#C9A227"])], size=120)
            + kv([(s[0], money(s[2])) for s in SAVINGS])),
        sub("17.4", "Liquidity note", note(
            "Fixed deposits of " + money(52_180_000) + " mature across the next 90 days; the ladder is published in "
            "the treasury section. Savings balances are <b>payable on demand</b> — the book may never outgrow the "
            "liquid cushion, and this panel is how the committee watches that rule.", "gold")),
    ])
    return sec(17, "Savings & Deposits Statistics", "The money clients keep with us — accounts, balances and the liquidity rule",
               inner, badge=money(sum(s[2] for s in SAVINGS)))


def section18():
    inner = "".join([
        sub("18.1", "The portal, month by month", table(
            ["Measure", "Sep", "Oct", "Change"],
            [["Site visits", "11,206", "12,840", "+14.6%"],
             ["Calculator uses", "2,844", "3,166", "+11.3%"],
             ["Applications started", "391", "428", "+9.5%"],
             ["Applications submitted", "271", "302", "+11.4%"],
             ["Statements downloaded", "1,042", "1,208", "+15.9%"]],
            csv_name="statistics-web", num_cols=(1, 2)),
            badge="October"),
        sub("18.2", "Calculator use, last 12 months",
            svg_bars(MONTHS, [1_400 + i * 145 for i in range(12)],
                     unit="Loan calculator uses per month · the quiet engine of the online funnel.",
                     colour="#0C4A6E"), badge="12 months"),
        sub("18.3", "The online funnel", strip([
            ("Visit → application", "<b>2.4%</b>"),
            ("Application → submission", "<b>70.6%</b>"),
            ("Submission → disbursement", "<b>64.9%</b>"),
            ("Fastest complete online loan", "<b>3 h 40 m</b>"),
            ("Top source", "<b>Referrals · 72.9% conversion</b>"),
        ])),
        sub("18.4", "What the portal must never do", checks([
            ("pass", "No client data in analytics", "Web statistics count events, never identities", "Clean"),
            ("pass", "Calculator state stays local", "Numbers typed into the calculator never leave the browser", "Local"),
            ("pass", "Applications encrypted", "Every submission rides the encrypted portal", "Enforced"),
        ])),
    ])
    return sec(18, "Web & Portal Statistics", "The digital front door — visits, calculator uses and the online funnel",
               inner, badge="12,840 visits")


def section19():
    inner = "".join([
        sub("19.1", "Run the data-quality checks", checks([
            ("warn", "Client records complete", "KYC, ID and contact on every active client", "99.2%"),
            ("warn", "Loans with full schedule", "Every active loan carries its schedule", "100%"),
            ("warn", "Repayments matched same day", "Receipts matched to the ledger within the day", "97.6%"),
            ("warn", "Branch data posted by the 3rd", "Monthly branch returns on time", "4 of 4"),
            ("warn", "No orphan transactions", "Every movement sits on a client and a loan", "Clean"),
        ]) + '<div class="form-actions"><button class="btn btn-gold" data-run-tests>Run the data-quality suite</button></div>',
            badge="5 checks"),
        sub("19.2", "What each check proves", bullets([
            "<b>Complete clients</b> — a loan is only as good as its KYC; an incomplete client cannot be served or pursued.",
            "<b>Full schedules</b> — every active loan must carry its instalment plan, or the ageing lies.",
            "<b>Same-day matching</b> — a receipt that sits unmatched hides the truth of both collections and arrears.",
            "<b>Branch returns</b> — the books close on the 3rd; a late branch delays every number on this page.",
            "<b>No orphans</b> — every movement belongs to a client and a loan; orphans are quarantined and cleared.",
        ])),
        sub("19.3", "Completeness of the book",
            svg_donut([("Complete", 98_4, "#1E9E6A"), ("Gaps open", 1_6, "#E4B33A")], size=110)
            + kv([("Complete records", "98.4% across clients, loans and movements"),
                  ("Gaps open", "34 client documents · 11 receipts unmatched"),
                  ("Owner", "The data steward, posted at HQ")])),
        sub("19.4", "The statistics promise", note(
            "Every figure on this page is <b>derived, never typed</b> — the tables are built from the same ledger the "
            "tellers write to. When a number looks wrong, the ledger is corrected, never the statistic.", "gold")),
    ])
    return sec(19, "Data Quality", "The checks that keep every number on this page honest",
               inner, badge="98.4% complete")


def section20():
    inner = "".join([
        sub("20.1", "The report pack",
            '<div class="form-actions">'
            '<button class="btn btn-gold" data-toast="Statistics pack queued — October pack lands in Reports when built">Build the month\u2019s statistics pack</button>'
            '<button class="btn btn-ghost" data-csv="statistics-export-pack">Export the whole pack</button>'
            '</div>'
            + kv([("Monthly", "Overview, portfolio, collections, clients, channels — one pack, PDF and CSV."),
                  ("Quarterly", "Cohorts, product review, branch scorecards and the risk pack."),
                  ("Ad hoc", "Every table on this page exports to CSV from its own button.")]),
            badge="pack"),
        sub("20.2", "Statistics audit trail", table(
            ["When", "Action", "Detail", "By"],
            [list(a) for a in AUDIT], csv_name="statistics-audit"),
            badge=str(len(AUDIT)) + " recent entries"),
        sub("20.3", "Definitions the whole house uses", kv([
            ("PAR30", "Share of the book with an instalment 30+ days late."),
            ("On-time rate", "Instalments paid on or before the due date."),
            ("Collection rate", "Collected in the month against what fell due that month."),
            ("Active client", "A client with a loan or a savings balance today."),
            ("Retention", "Still active twelve months after joining the cohort."),
        ])),
        sub("20.4", "Statistics settings",
            form([
                ("Book cut-off", '<select><option>Close of day</option><option>Close of month</option></select>'),
                ("PAR basis", '<select><option>Instalment-level ageing</option><option>Loan-level ageing</option></select>'),
                ("Branch returns due", '<input value="3rd of the month" />'),
                ("Report pack", '<select><option>Monthly · PDF + CSV</option><option>Monthly · CSV only</option></select>'),
            ], "Save the statistics settings",
               msg="Every change here is written to the audit trail with the officer and the time.")),
    ])
    return sec(20, "Reports & Audit", "The report pack, the audit trail of the statistics themselves, and the definitions",
               inner, badge="derived, never typed")


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
      <div class="page-title">Statistics &amp; the Numbers of the Book</div>
      <div class="page-sub">Portfolio, repayments, clients, channels, staff · <span id="topRefresh">{TODAY}</span></div>
    </div>
    <div class="search">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9AA0AC" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
      <input placeholder="Search a product, branch, officer or measure…" id="globalSearch" autocomplete="off" />
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
      <h1>The whole book, in numbers</h1>
      <p>Portfolio and product statistics, disbursements, collections, ageing, clients, branches, officers,
        channels, income, cohorts, risk and the health of the data itself. Twenty sections, every figure derived
        from the same ledger the tellers write to.</p>
    </div>
    <div class="band-stats">
      <div class="band-stat"><b>{ACTIVE_LOANS}</b><span>Loans active</span></div>
      <div class="band-stat"><b>{money(BOOK)}</b><span>Book outstanding</span></div>
      <div class="band-stat"><b>{money(DISB_YTD)}</b><span>Disbursed YTD</span></div>
      <div class="band-stat"><b>{PAR30}%</b><span>PAR30</span></div>
    </div>
    <div class="mb-actions">
      <button class="btn btn-gold" data-goto="s19">Run the data checks</button>
      <button class="btn btn-ghost" data-goto="s2">Open the portfolio</button>
    </div>
  </div>
'''


def filterbar():
    defs = [("Area", ["All areas", "Portfolio", "Repayments", "Clients", "Channels", "Branches", "Officers", "Web"]),
            ("Product", ["All products", "Personal Loans", "Business Loans", "Agricultural Loans",
                         "Salary Advance Loans", "Collateral Loans"]),
            ("Branch", ["All branches", "Lilongwe · HQ", "Blantyre", "Mzuzu", "Zomba"]),
            ("Officer", ["All officers"] + [o[0] for o in OFFICERS])]
    sels = "".join(
        '<div class="fg"><label>' + esc(l) + '</label><select data-filter="' + esc(l.lower()) + '">' +
        "".join(f"<option>{esc(o)}</option>" for o in opts) + "</select></div>" for l, opts in defs)
    return f'''
  <div class="card panel filterpanel">
    <div class="panel-head"><div><div class="panel-title">Filter the statistics</div>
      <div class="panel-sub">Every panel below narrows with these controls — area, product, branch and officer</div></div>
      <span class="badge b-gray" id="filterCount">no filters</span></div>
    <div class="form-grid four">{sels}
      <div class="fg"><label>Search</label><input id="filterSearch" placeholder="product, branch, officer, measure…" /></div>
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
/* ---------- statistics-specific extras ---------- */
.filterpanel{margin-bottom:13px}
.sub .hbar:last-child{margin-bottom:0}
.strip .sv{overflow-wrap:anywhere}
.stflag{font-size:9px;font-weight:800;letter-spacing:.3px;color:#7A5E10;
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

    with open("_sb2body.html", "w", encoding="utf-8") as fh:
        fh.write(html_out)
    with open("_statistics2.css", "w", encoding="utf-8") as fh:
        fh.write(css_out)
    n_sub = html_out.count("data-sub=")
    print("wrote _sb2body.html (%d bytes, %d panels), _statistics2.css (%d)"
          % (len(html_out), n_sub, len(css_out)))


if __name__ == "__main__":
    main()
