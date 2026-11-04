#!/usr/bin/env python3
"""
Builds the Transactions Management & Movement of Money body from the
twenty-section specification.

Every numbered sub-item becomes a numbered panel of its own (1.1 … 20.9), so
nothing in the specification is implicit.  The page is generated so the
figures agree across sections: one transaction register, one channel picture,
one reconciliation position, one audit trail — the same rows re-cut per view.
"""
import html
from _gen_common import (esc, money, pill, okb, kv, strip, table, checks, bars,
                         svg_bars, svg_donut, note, bullets, form, sub, sec)

TODAY = "04 Nov 2026"
NOW = "09:20"

# ----------------------------------------------------------------- data ----
SUBS = [
    (1, "Overview"), (2, "Register"), (3, "Capture"), (4, "Repayments"),
    (5, "Disbursements"), (6, "Deposits"), (7, "Transfers"), (8, "Fees & penalties"),
    (9, "Payroll & expenses"), (10, "Mobile money"), (11, "Bank"), (12, "Cash"),
    (13, "Verification"), (14, "Reconciliation"), (15, "Failed & reversed"),
    (16, "Receipts"), (17, "Costs"), (18, "Limits & risk"),
    (19, "Reports"), (20, "Audit & settings"),
]

CHANNELS = [
    # code, name, kind, state, direction, provider, fee, settle
    ("AMM", "Airtel Money", "Mobile money", "Active", "In & out", "Airtel Malawi", "1.5%", "T+0"),
    ("TNM", "TNM Mpamba", "Mobile money", "Degraded", "In & out", "TNM", "1.5%", "T+0"),
    ("BNK", "Bank transfer", "Bank", "Active", "In & out", "NBS · Standard · Stanbic", "0", "T+0"),
    ("CSH", "Cash at branch", "Cash", "Active", "In", "Internal", "0", "Immediate"),
    ("INT", "Internal transfer", "Internal", "Active", "Internal", "Golden ledger", "0", "Immediate"),
]

# ref, when, type, channel, party, account, amount, state, provider_ref, officer, fee
TXNS = [
    ("TXN-2026-118401", "04 Nov 2026 · 09:12", "Repayment", "Airtel Money", "Chifundo Mponda", "LN-2026-0481", 48_250, "Successful", "AM-77140201", "System", 724),
    ("TXN-2026-118400", "04 Nov 2026 · 09:07", "Repayment", "TNM Mpamba", "Ruth Phiri", "LN-2026-0455", 120_000, "Pending", "—", "System", 0),
    ("TXN-2026-118399", "04 Nov 2026 · 09:01", "Disbursement", "Bank transfer", "Grace Mvula", "LN-2026-0512", 1_500_000, "Successful", "NBS-88410", "Yamikani Banda", 0),
    ("TXN-2026-118398", "04 Nov 2026 · 08:54", "Repayment", "Bank transfer", "Patrick Zulu", "LN-2026-0437", 250_000, "Unreconciled", "—", "System", 0),
    ("TXN-2026-118397", "04 Nov 2026 · 08:47", "Fee", "Airtel Money", "Thoko Phiri", "LN-2026-0476", 2_600, "Successful", "AM-77140166", "System", 39),
    ("TXN-2026-118396", "04 Nov 2026 · 08:40", "Deposit", "Cash at branch", "Branch vault", "BLA-VAULT-1", 850_000, "Successful", "CSH-261104-03", "Linda Mhango", 0),
    ("TXN-2026-118395", "04 Nov 2026 · 08:33", "Transfer", "Internal transfer", "Blantyre → Lilongwe", "GLS-OPS-001", 2_400_000, "Successful", "INT-261104-11", "Chikondi Mwale", 0),
    ("TXN-2026-118394", "04 Nov 2026 · 08:26", "Repayment", "Airtel Money", "Madalitso Mponda", "LN-2026-0466", 112_000, "Successful", "AM-77140130", "System", 1_680),
    ("TXN-2026-118393", "04 Nov 2026 · 08:18", "Payroll", "Bank transfer", "Staff salaries · Nov", "PAYROLL-NOV", 18_600_000, "Pending", "—", "Chikondi Mwale", 0),
    ("TXN-2026-118392", "04 Nov 2026 · 08:11", "Disbursement", "Airtel Money", "Alinafe Nyirenda", "LN-2026-0511", 400_000, "Successful", "AM-77140088", "Esther Mwale", 6_000),
    ("TXN-2026-118391", "04 Nov 2026 · 08:02", "Repayment", "TNM Mpamba", "Isaac Phiri", "LN-2026-0448", 34_000, "Failed", "TNM-557900", "System", 0),
    ("TXN-2026-118390", "04 Nov 2026 · 07:55", "Penalty", "Internal transfer", "Memory Phiri", "LN-2026-0470", 4_500, "Successful", "INT-261104-07", "System", 0),
    ("TXN-2026-118389", "04 Nov 2026 · 07:44", "Transfer", "Internal transfer", "Operations → Vault", "BLA-VAULT-1", 1_200_000, "Successful", "INT-261104-05", "Blessings Tembo", 0),
    ("TXN-2026-118388", "04 Nov 2026 · 07:31", "Deposit", "Bank transfer", "Standard Bank", "STD-COLL-01", 4_800_000, "Successful", "STD-90442", "System", 0),
    ("TXN-2026-118387", "04 Nov 2026 · 07:19", "Repayment", "Cash at branch", "Tadala Phiri", "LN-2026-0479", 84_000, "Successful", "RCPT-2026-1304", "Blessings Tembo", 0),
    ("TXN-2026-118386", "04 Nov 2026 · 07:05", "Expense", "Bank transfer", "Zomba branch rent", "OPS-EXP-441", 450_000, "Successful", "NBS-88377", "Chikondi Mwale", 0),
    ("TXN-2026-118385", "04 Nov 2026 · 06:52", "Repayment", "Airtel Money", "Esther Mwale", "LN-2026-0459", 38_000, "Reversed", "AM-77139976", "System", 0),
    ("TXN-2026-118384", "04 Nov 2026 · 06:40", "Disbursement", "TNM Mpamba", "Joseph Kalua", "LN-2026-0510", 250_000, "Cancelled", "—", "Tadala Msonthi", 0),
]

RECON = [
    ("Airtel Money", 412, 410, 2, 0, "Matched"),
    ("TNM Mpamba", 208, 196, 9, 3, "Gap"),
    ("Bank transfer", 96, 94, 1, 1, "Matched"),
    ("Cash at branch", 142, 142, 0, 0, "Matched"),
    ("Internal transfer", 64, 64, 0, 0, "Matched"),
]

FAILS = [
    ("TXN-2026-118391", "TNM Mpamba", 34_000, "Wallet not active", "Customer advised to activate the wallet; retry allowed"),
    ("TXN-2026-118379", "Airtel Money", 15_000, "Insufficient wallet balance", "Retry scheduled 18:00 · customer notified by SMS"),
    ("TXN-2026-118371", "Bank transfer", 90_000, "Account number invalid", "Returned by NBS · captured again against the corrected account"),
    ("TXN-2026-118366", "TNM Mpamba", 26_500, "Provider timeout", "Status unknown · auto-verify against the provider in the next poll"),
]

COSTS = [
    ("Airtel Money", 1.5, 612, "Customer", 39_880),
    ("TNM Mpamba", 1.5, 296, "Customer", 17_760),
    ("Bank transfer", 0, 190, "Company", 7_500),
    ("Cash at branch", 0, 142, "Company", 2_100),
]

LIMITS = [
    ("Airtel Money", "Per transaction", "MK 500,000", "MK 2,000,000", "3 / hour"),
    ("TNM Mpamba", "Per transaction", "MK 500,000", "MK 1,500,000", "3 / hour"),
    ("Bank transfer", "Per transaction", "MK 10,000,000", "MK 50,000,000", "12 / day"),
    ("Cash at branch", "Per teller session", "MK 300,000", "MK 500,000", "Drawer ceiling"),
    ("Internal transfer", "Per transfer", "—", "MK 10,000,000", "Maker–checker"),
]


# --------------------------------------------------------------- shared ----
def tx_table(rows, csv_name):
    return table(
        ["Reference", "When", "Type", "Channel", "Party", "Account", "Amount", "State", "Provider ref", "Officer", "Fee"],
        rows, csv_name=csv_name, num_cols=(6, 10))


def tx_rows(items):
    out = []
    for t in items:
        out.append([t[0], t[1], t[2], t[3], t[4], t[5],
                    money(t[6]), okb(t[7]), t[8], t[9], money(t[10]) if t[10] else "—"])
    return out


def by_type(kind):
    return [t for t in TXNS if t[2] == kind]


def by_state(state):
    return [t for t in TXNS if t[7] == state]


# ------------------------------------------------------------- sections ----
def section1():
    inner = "".join([
        sub("1.1", "Today at a glance", strip([
            ("Transactions today", "<b>922</b>"),
            ("Value today", "<b>" + money(84_215_000) + "</b>"),
            ("Success rate", "<b>97.6%</b>"),
            ("Open items", "<b>16</b>"),
        ])),
        sub("1.2", "Volume over the last 14 days",
            svg_bars(["21", "22", "23", "24", "25", "26", "27", "28", "29", "30", "31", "01", "02", "03"],
                     [612, 655, 640, 701, 588, 496, 380, 745, 812, 866, 402, 690, 884, 922],
                     unit="Transactions per day · the 31st was a half-day and Sundays run teller-only.",
                    colour="#C9A227"), badge="14 days"),
        sub("1.3", "Where the money moved by channel",
            svg_donut([("Airtel Money", 412, "#E4453A"), ("TNM Mpamba", 208, "#1E9E6A"),
                       ("Bank transfer", 96, "#2F6FED"), ("Cash at branch", 142, "#C9A227"),
                       ("Internal", 64, "#7C5CF0")], size=130)
            + kv([("Airtel Money", money(18_402_000)), ("TNM Mpamba", money(7_216_500)),
                  ("Bank transfer", money(41_500_000)), ("Cash at branch", money(6_142_000)),
                  ("Internal", money(10_954_500))])),
        sub("1.4", "Needs attention now", checks([
            ("warn", "TNM Mpamba reconciliation gap", "9 payments the provider has not confirmed", "9 items"),
            ("warn", "Payroll batch pending", money(18_600_000) + " awaiting the second authorisation", "1 batch"),
            ("fail", "Failed repayment", "TNM wallet not active — customer advised, retry scheduled", "1 item"),
            ("warn", "Unreconciled bank credit", money(250_000) + " awaiting statement match", "1 item"),
            ("pass", "Airtel Money callback stream", "Signed · HMAC-256 · 312 ms median", "Healthy"),
        ])),
        sub("1.5", "Direction of travel", bars([
            ("Inbound (repayments, deposits)", 45_100, 84_215, money(45_100_000)),
            ("Outbound (disbursements, payroll, expenses)", 32_500, 84_215, money(32_500_000)),
            ("Internal (vault, transfers)", 6_615, 84_215, money(6_615_000)),
        ], colour="#1E9E6A")),
    ])
    return sec(1, "Transactions Overview", "Every kwacha that moved today, at a glance — count, value, channels and the items that need a person",
               inner, badge="live · " + NOW)


def section2():
    inner = "".join([
        sub("2.1", "Every transaction, one row each", tx_table(tx_rows(TXNS), "transactions"),
            badge=str(len(TXNS)) + " of 922 shown"),
        sub("2.2", "How a transaction is numbered", kv([
            ("Format", "TXN-YYYY-NNNNNN"),
            ("Prefix", "TXN · shared by every type"),
            ("Next number", "TXN-2026-118402"),
            ("Issued today", "922"),
            ("Scope", "National · single sequence"),
            ("Idempotency key", "Provider ref + amount + minute"),
        ])),
        sub("2.3", "The states a transaction moves through", bullets([
            "<b>Pending</b> — captured or requested, waiting on the provider or a second authorisation.",
            "<b>Successful</b> — confirmed by the provider, the receipt is issued and the ledger is updated.",
            "<b>Unreconciled</b> — successful, but the provider statement has not confirmed it yet.",
            "<b>Failed</b> — the provider refused it; the reason is recorded and a retry may be scheduled.",
            "<b>Cancelled</b> — abandoned before submission; no money moved.",
            "<b>Reversed</b> — succeeded, then pulled back by a reversal or a provider correction.",
        ])),
        sub("2.4", "Finding any transaction", note(
            "Use the filters above the register — channel, state, type and officer narrow every panel on this page "
            "at once. The search box matches a reference, a party, an account or a provider reference. "
            "Every table can be sorted by clicking its headers and exported with its CSV button.", "gold")),
    ])
    return sec(2, "Transaction Register", "One row per movement of money — repayments, disbursements, deposits, transfers, fees, payroll and expenses",
               inner, badge="922 today")


def section3():
    inner = "".join([
        sub("3.1", "Capture a transaction by hand", form([
            ("Type", '<select><option>Repayment</option><option>Deposit</option><option>Transfer</option>'
                     '<option>Fee</option><option>Penalty</option><option>Expense</option></select>'),
            ("Channel", '<select><option>Cash at branch</option><option>Airtel Money</option>'
                        '<option>TNM Mpamba</option><option>Bank transfer</option><option>Internal transfer</option></select>'),
            ("Account or loan", "LN-2026-0481"),
            ("Amount (MK)", "48,250"),
            ("Party", "Chifundo Mponda"),
            ("Reference", "Counter receipt · BLA desk 2"),
        ], "Capture the transaction", msg="Capture is audited: the officer, the terminal and the exact time are stored with the row.",
            button_id="txCapture")),
        sub("3.2", "Validation before the row is written", checks([
            ("pass", "Account exists and is open", "LN-2026-0481 · Chisomo Kachale", "Pass"),
            ("pass", "Amount within the channel limit", "MK 48,250 of MK 500,000", "Pass"),
            ("pass", "Idempotency — no duplicate in 10 minutes", "Same party + amount + minute", "Pass"),
            ("warn", "Amount differs from the instalment due", money(48_250) + " due " + money(48_250) + " · within tolerance", "Info"),
            ("pass", "Officer authority covers the amount", "Teller ceiling " + money(300_000), "Pass"),
        ])),
        sub("3.3", "What happens on submit", bullets([
            "The row is written to the register with its TXN number and the officer's name.",
            "A receipt is raised for inbound money; a payout instruction for outbound.",
            "The ledger, the loan account and the customer statement are updated in the same commit.",
            "The audit trail records who did what, from where, at what time.",
        ])),
    ])
    return sec(3, "Capture a Transaction", "Counter and back-office capture, the validation the row must pass, and what happens the moment it is saved", inner)


def section4():
    rows = by_type("Repayment")
    inner = "".join([
        sub("4.1", "Repayments received today", tx_table(tx_rows(rows), "tx-repayments"),
            badge=str(len(rows)) + " repayments"),
        sub("4.2", "How a repayment reaches the loan", kv([
            ("Allocation order", "Penalties → fees → interest → principal"),
            ("Receipt", "Raised automatically · RCP-000000"),
            ("Statement", "Posted to the customer account the same minute"),
            ("Schedule", "Instalment closed when the allocation covers it"),
            ("Arrears", "Recomputed after every posting"),
        ])),
        sub("4.3", "Short and late payments", table(
            ["Account", "Instalment due", "Paid", "Short by", "Handling"],
            [["LN-2026-0466", money(112_000), money(112_000), "—", "On time · channel Airtel"],
             ["LN-2026-0479", money(84_000), money(84_000), "—", "Paid at the counter · day 2 late"],
             ["LN-2026-0455", money(38_000), money(19_000), money(19_000), "Part payment · remainder due with the next instalment"]],
            csv_name="tx-short-payments", num_cols=(1, 2, 3))),
    ])
    return sec(4, "Repayment Transactions", "Money coming in from customers — the register, the allocation behind it and the short payments", inner, badge="inbound")


def section5():
    rows = by_type("Disbursement")
    inner = "".join([
        sub("5.1", "Disbursements sent today", tx_table(tx_rows(rows), "tx-disbursements"),
            badge=str(len(rows)) + " payouts"),
        sub("5.2", "Payout rail per channel", kv([
            ("Bank transfer", "NBS · Standard · Stanbic — credit instruction, T+0 before 15:00"),
            ("Airtel Money", "Wallet push — confirmed by callback, usually under a minute"),
            ("TNM Mpamba", "Wallet push — callbacks degraded today, verify against the provider portal"),
            ("Cash", "Vault out over the counter against a signed disbursement sheet"),
        ])),
        sub("5.3", "Controls on the way out", checks([
            ("pass", "Loan signed and approved before payout", "Every payout cites an approved application", "Pass"),
            ("pass", "Maker–checker above " + money(1_000_000), "Two officers on every large payout", "Pass"),
            ("pass", "Net of processing fee", "The fee is netted; the customer is told the net figure", "Pass"),
            ("warn", "Callback awaited", "1 payout awaiting the provider confirmation", "Watch"),
        ])),
    ])
    return sec(5, "Disbursement Transactions", "Money going out to customers — the payout register, the rail each channel uses and the controls", inner, badge="outbound")


def section6():
    inner = "".join([
        sub("6.1", "Deposits received today", tx_table(tx_rows(by_type("Deposit")), "tx-deposits"),
            badge="2 deposits"),
        sub("6.2", "Float position by channel", strip([
            ("Airtel float", "<b>" + money(6_980_000) + "</b>"),
            ("Mpamba float", "<b>" + money(5_620_000) + "</b>"),
            ("Bank collections", "<b>" + money(14_220_000) + "</b>"),
            ("Vault cash", "<b>" + money(3_410_000) + "</b>"),
        ])),
        sub("6.3", "Deposit rules", kv([
            ("Vault ceiling", money(2_000_000) + " per branch — banked twice daily above that"),
            ("Banking times", "11:00 and 16:00, cash-in-transit under escort"),
            ("Counted by", "Two people, one counts and one witnesses"),
            ("Slip", "Bank slip scanned and attached to the deposit row"),
        ])),
    ])
    return sec(6, "Deposit Transactions", "Cash and cheque moving into the company's own accounts — deposits, float and the banking rules", inner)


def section7():
    inner = "".join([
        sub("7.1", "Internal transfers today", tx_table(tx_rows(by_type("Transfer")), "tx-transfers"),
            badge="2 transfers"),
        sub("7.2", "Controls on internal movement", checks([
            ("pass", "Maker–checker", "One officer raises, another authorises", "Enforced"),
            ("pass", "Two-person rule on vault movement", "Counted and witnessed", "Enforced"),
            ("pass", "Reason required", "Every transfer carries a written reason", "Complete"),
            ("pass", "Same-day ledger cut", "No internal transfer may straddle a day", "Enforced"),
        ])),
        sub("7.3", "In transit right now", kv([
            ("Blantyre → Lilongwe", money(2_400_000) + " · cash-in-transit, escort dispatched 08:35"),
            ("Operations → Vault", money(1_200_000) + " · arrived, being counted"),
            ("Expected arrival", "Both legs today before the 16:00 close"),
        ])),
    ])
    return sec(7, "Internal Transfer Transactions", "Money moving between accounts, branches and the vault — and the two-person rules around it", inner)


def section8():
    inner = "".join([
        sub("8.1", "Fees and penalties posted today", tx_table(tx_rows(by_type("Fee") + by_type("Penalty")), "tx-fees"),
            badge="2 charges"),
        sub("8.2", "What the charges are", kv([
            ("Processing fee", "Once, a percentage of the principal, netted at disbursement"),
            ("Late payment penalty", "2% a month on the overdue instalment"),
            ("Storage fee", money(25_000) + " a month where a vehicle is held"),
            ("Waivers", "Supervisor authorisation, reason recorded, audit trail entry"),
        ])),
        sub("8.3", "Waivers granted today", table(
            ["Charge", "Customer", "Amount", "Waived by", "Reason"],
            [["Late penalty", "Memory Phiri", money(1_800), "Chikondi Mwale", "First default · long-standing customer"],
             ["Processing fee", "Fatsani Gondwe", money(7_500), "Pending", "Request under review"]],
            csv_name="tx-waivers", num_cols=(2,))),
        sub("8.4", "Reversal policy", note(
            "A charge is never deleted. It is reversed by a matching contra row that cites the original, and both rows "
            "stay on the register for the auditor.", "gold")),
    ])
    return sec(8, "Fee & Penalty Transactions", "Charges the book raises — fees, penalties, the waivers granted against them and the reversal policy", inner)


def section9():
    inner = "".join([
        sub("9.1", "Payroll transactions", tx_table(tx_rows(by_type("Payroll")), "tx-payroll"), badge="1 batch"),
        sub("9.2", "Expense transactions", tx_table(tx_rows(by_type("Expense")), "tx-expenses"), badge="1 payment"),
        sub("9.3", "Controls on staff and operating money", checks([
            ("pass", "Payroll approved by two officers", "Batch " + money(18_600_000) + " · one authorisation still open", "1 of 2"),
            ("pass", "Expense cites an approved budget line", "Zomba rent · facilities budget", "Pass"),
            ("pass", "No cash for payroll", "All staff money moves by bank transfer", "Pass"),
        ])),
    ])
    return sec(9, "Payroll & Expense Transactions", "The company's own outflows — salaries, beneficiary payments and operating expenses", inner)


def section10():
    inner = "".join([
        sub("10.1", "Airtel Money", kv([
            ("State", pill("Connected", "b-ok")),
            ("Mode", "Production · signed callbacks (HMAC-256)"),
            ("Latency", "312 ms median confirmation"),
            ("Success today", "99.2%"),
            ("Float", money(6_980_000)),
        ])),
        sub("10.2", "TNM Mpamba", kv([
            ("State", pill("Degraded", "b-warn")),
            ("Mode", "Production · signed callbacks (HMAC-256)"),
            ("Latency", "Callbacks delayed — portal verification in use"),
            ("Success today", "88.4%"),
            ("Float", money(5_620_000)),
        ])),
        sub("10.3", "Callback health", checks([
            ("pass", "Airtel Money callbacks", "Signed, sequenced, no gaps since 06:00", "Healthy"),
            ("warn", "TNM Mpamba callbacks", "3 timeouts in the last hour — polling fallback active", "Degraded"),
            ("pass", "Replay protection", "Replayed callbacks are dropped by idempotency key", "Pass"),
        ])),
        sub("10.4", "Timeout and retry policy", bullets([
            "A wallet request that is not confirmed in <b>90 seconds</b> is polled, never re-sent blind.",
            "If the poll cannot see the transaction after <b>3 attempts</b> it is marked unreconciled for a person.",
            "A timeout never triggers a second payout — the idempotency key forbids it.",
            "Customers are told the true state: pending means pending, not failed.",
        ])),
    ])
    return sec(10, "Mobile Money Transactions", "The two wallets, how healthy their callbacks are, and exactly what happens when one stalls", inner, badge="TNM degraded")


def section11():
    inner = "".join([
        sub("11.1", "Bank transactions today", tx_table(
            tx_rows([t for t in TXNS if t[3] == "Bank transfer"]), "tx-bank"), badge="5 rows"),
        sub("11.2", "Statement import", kv([
            ("Accounts", "NBS Operations · Standard Collections · Stanbic Disbursements"),
            ("Import", "07:05 daily, then hourly"),
            ("Match keys", "Provider reference, then amount + date"),
            ("Unmatched", money(250_000) + " awaiting the 10:00 statement"),
        ])),
        sub("11.3", "Matching rules", checks([
            ("pass", "Provider reference matches a register row", "Auto-matched, state confirmed", "412 rows"),
            ("warn", "Amount and date only", "Held for a person — two rows could match", "1 row"),
            ("pass", "Credits with no register row", "Raised as unidentified receipts, never auto-allocated", "0 rows"),
        ])),
    ])
    return sec(11, "Bank Transactions", "Transfers through NBS, Standard and Stanbic — the register, the statement import and the matching rules", inner)


def section12():
    inner = "".join([
        sub("12.1", "Teller sessions today", table(
            ["Teller", "Branch", "Opened", "Cash in", "Cash out", "Drawer now", "State"],
            [["Linda Mhango", "Blantyre", "08:00", money(1_240_000), money(390_000), money(850_000), okb("Open")],
             ["Blessings Tembo", "Blantyre", "08:00", money(410_000), money(96_000), money(314_000), okb("Open")],
             ["Yamikani Banda", "Lilongwe", "08:05", money(780_000), money(210_000), money(570_000), okb("Open")],
             ["Esther Mwale", "Mzuzu", "08:10", money(296_000), money(88_000), money(208_000), okb("Open")]],
            csv_name="tx-tellers", num_cols=(3, 4, 5))),
        sub("12.2", "Drawer and vault limits", kv([
            ("Teller drawer ceiling", money(300_000) + " — banked up when passed"),
            ("Branch vault ceiling", money(2_000_000)),
            ("Cash-in-transit", "Escort + two officers above " + money(1_000_000)),
            ("Insurance", "Covered to " + money(5_000_000) + " in transit"),
        ])),
        sub("12.3", "Cash discipline", checks([
            ("pass", "Every cash movement counted by two people", "Drawer and vault", "Enforced"),
            ("pass", "Drawer variance", "Zero variance across all four sessions", "Clean"),
            ("pass", "Counter receipts numbered", "CSH-261104 series", "In sequence"),
        ])),
    ])
    return sec(12, "Cash Transactions", "Teller drawers, the branch vaults and the discipline that keeps the cash honest", inner)


def section13():
    inner = "".join([
        sub("13.1", "Pending verification", table(
            ["Reference", "Channel", "Amount", "Waiting on", "Age"],
            [[t[0], t[3], money(t[6]), reason, age] for t, reason, age in [
                (TXNS[1], "TNM callback delayed", "14 min"),
                (TXNS[3], "Bank statement 10:00", "26 min"),
                (TXNS[8], "Second authorisation", "41 min"),
            ]],
            csv_name="tx-pending", num_cols=(2,))),
        sub("13.2", "Auto-match rules", checks([
            ("pass", "Provider reference exact match", "Confirmed within the same minute", "410 rows"),
            ("pass", "Reference + amount within ±0.5%", "Auto-confirmed with a note", "12 rows"),
            ("warn", "Amount and date only", "Queued for a person", "1 row"),
        ])),
        sub("13.3", "Duplicate detection", checks([
            ("pass", "Same provider reference twice", "Blocked by a unique index", "Enforced"),
            ("pass", "Same party + amount in 10 minutes", "Second row flagged for review", "2 flagged"),
            ("pass", "Same reference, different amount", "Held — never auto-posted", "0 rows"),
        ])),
    ])
    return sec(13, "Verification & Matching", "How a pending transaction is confirmed — the queue, the auto-match rules and the duplicate net", inner, badge="3 open")


def section14():
    inner = "".join([
        sub("14.1", "Reconciliation by channel — today", table(
            ["Channel", "Provider rows", "Register rows", "Unmatched", "Exceptions", "Position"],
            [[c[0], c[1], c[2], c[3], c[4], okb(c[5])] for c in RECON],
            csv_name="tx-recon", num_cols=(1, 2, 3, 4)),
            badge="1,060 provider rows"),
        sub("14.2", "Open discrepancies", table(
            ["Provider ref", "Channel", "Amount", "What differs", "Next step"],
            [["AM-77139976", "Airtel Money", money(38_000), "Reversed by provider after success", "Contra posted · receipt marked void"],
             ["TNM-557900", "TNM Mpamba", money(34_000), "Failed here, pending there", "Auto-verify in the next poll"],
             ["—", "Bank transfer", money(250_000), "Credit with no register row", "Awaiting the 10:00 statement"]],
            csv_name="tx-recon-exceptions", num_cols=(2,))),
        sub("14.3", "Daily close", checks([
            ("pass", "Channels balanced at the 16:00 cut", "Yesterday closed clean", "Passed"),
            ("warn", "TNM gap carried", "9 rows carried from this morning", "Open"),
            ("pass", "Float agrees with the ledger", "Airtel · Mpamba · banks · vault", "Passed"),
        ]),
            ),
    ])
    return sec(14, "Reconciliation", "The provider's rows against the register's rows, per channel — and the discrepancies a person must close", inner)


def section15():
    inner = "".join([
        sub("15.1", "Failures today", table(
            ["Reference", "Channel", "Amount", "Reason", "What happens next"],
            [[f[0], f[1], money(f[2]), f[3], f[4]] for f in FAILS],
            csv_name="tx-failures", num_cols=(2,))),
        sub("15.2", "Reversals and cancellations", tx_table(
            tx_rows(by_state("Reversed") + by_state("Cancelled")), "tx-reversed"), badge="2 rows"),
        sub("15.3", "The reversal workflow", bullets([
            "A reversal is a <b>contra row</b> that cites the original — nothing is ever deleted.",
            "Provider-initiated reversals are matched to the original by reference and posted automatically.",
            "Staff-initiated reversals need a supervisor authorisation and a written reason.",
            "The customer's receipt is marked void; the confirmation records the reversal.",
        ])),
        sub("15.4", "Retry policy", checks([
            ("pass", "Customer-caused failures", "Advised by SMS; retry when they are ready", "No auto-retry"),
            ("pass", "Provider timeouts", "Auto-verify, never a blind re-send", "Enforced"),
            ("warn", "Scheduled retries", "1 retry scheduled at 18:00 (insufficient balance)", "1 item"),
        ])),
    ])
    return sec(15, "Failed, Reversed & Cancelled Transactions", "What went wrong today, the workflow that corrects it, and the rules that keep retries honest", inner, badge="4 failures")


def section16():
    inner = "".join([
        sub("16.1", "Receipts issued today", table(
            ["Receipt", "Against", "Customer", "Amount", "Channel", "Prints"],
            [["RCP-000513", "TXN-2026-118401", "Chifundo Mponda", money(48_250), "SMS", "1"],
             ["RCP-000514", "TXN-2026-118394", "Madalitso Mponda", money(112_000), "SMS", "1"],
             ["RCP-000515", "TXN-2026-118387", "Tadala Phiri", money(84_000), "Printed", "2"],
             ["CSH-261104-03", "TXN-2026-118396", "Branch vault deposit", money(850_000), "Filed", "1"]],
            csv_name="tx-receipts", num_cols=(3, 5))),
        sub("16.2", "Customer confirmations", table(
            ["Receipt", "Customer", "Channel", "Sent", "Status"],
            [["RCP-000513", "Chifundo Mponda", "SMS +265 999 481 220", "09:12", okb("Delivered")],
             ["RCP-000514", "Madalitso Mponda", "SMS +265 888 118 991", "08:26", okb("Delivered")],
             ["RCP-000515", "Tadala Phiri", "Printed at counter", "07:19", okb("Issued")]],
            csv_name="tx-confirmations")),
        sub("16.3", "Confirmation policy", note(
            "Every successful inbound transaction gets a receipt and, where the customer has a number on file, an SMS. "
            "A receipt can be reprinted — the reprint is logged with the officer and the reason. A voided receipt says so, "
            "in red, on its face.", "gold")),
    ])
    return sec(16, "Receipts & Confirmations", "The paper and the message the customer receives — receipts, confirmations and the reprint trail", inner)


def section17():
    inner = "".join([
        sub("17.1", "Provider and bank costs today", table(
            ["Channel", "Rate", "Rows", "Borne by", "Cost today"],
            [[c[0], str(c[1]) + "%", c[2], c[3], money(c[4])] for c in COSTS],
            csv_name="tx-costs", num_cols=(2, 4)), badge=money(67_240)),
        sub("17.2", "Cost per transaction by channel", bars([
            ("Airtel Money", 65, 100, "MK 65 avg"),
            ("TNM Mpamba", 60, 100, "MK 60 avg"),
            ("Bank transfer", 39, 100, "MK 39 avg"),
            ("Cash at branch", 15, 100, "MK 15 avg"),
        ], colour="#7A5E10")),
        sub("17.3", "Recovery rules", kv([
            ("Customer-paid channels", "The 1.5% wallet fee is quoted before the customer confirms"),
            ("Company-paid channels", "Bank and cash costs land in operating expenses, by channel"),
            ("Monthly review", "Charges are reconciled against the provider invoice, line by line"),
        ])),
    ])
    return sec(17, "Transaction Costs", "What it costs to move the money — provider fees, bank charges and who bears each one", inner)


def section18():
    inner = "".join([
        sub("18.1", "Velocity and amount limits", table(
            ["Channel", "Basis", "Soft limit", "Hard ceiling", "Velocity"],
            [[l[0], l[1], l[2], l[3], l[4]] for l in LIMITS],
            csv_name="tx-limits")),
        sub("18.2", "Holds and reviews", table(
            ["Reference", "Hold", "Reason", "Set by", "State"],
            [["TXN-2026-118400", "Manual review", "Amount at the TNM ceiling", "System", okb("Pending")],
             ["TXN-2026-118393", "Second authorisation", "Payroll batch", "Policy", okb("Pending")],
             ["TXN-2026-118384", "Officer hold", "Customer called to stop the payout", "Tadala Msonthi", okb("Held")]],
            csv_name="tx-holds")),
        sub("18.3", "Suspicious patterns watched for", checks([
            ("pass", "Structuring — many just-under-limit rows", "One customer flagged today", "1 case"),
            ("pass", "Rapid in-and-out on a fresh wallet", "No hits today", "Clean"),
            ("warn", "Same device, different customers", "2 sessions flagged for review", "2 cases"),
            ("pass", "Officer concentration", "No officer above 40% of a channel's value", "Clean"),
        ])),
    ])
    return sec(18, "Limits, Controls & Risk", "The ceilings, the holds and the patterns that would make the portal stop and ask a person", inner)


def section19():
    inner = "".join([
        sub("19.1", "Report catalogue", table(
            ["Report", "Covers", "Frequency", "Format"],
            [["Daily transactions", "Every row, every channel", "Daily 16:30", "CSV · PDF"],
             ["Channel reconciliation", "Provider vs register", "Daily 16:30", "CSV"],
             ["Failed & reversed", "Every failure with its reason", "Daily", "CSV"],
             ["Transaction costs", "Provider and bank charges", "Monthly", "XLSX"],
             ["Limits & exceptions", "Rows at ceilings, holds, flags", "Weekly", "CSV"],
             ["Audit extract", "Who did what, from where", "On demand", "CSV"]],
            csv_name="tx-report-catalogue")),
        sub("19.2", "Scheduled exports", table(
            ["Export", "Goes to", "When", "Last run"],
            [["Daily pack", "finance@goldenfinancial.mw", "16:35", okb("Yesterday · passed")],
             ["Recon file", "Head accountant", "16:40", okb("Yesterday · passed")],
             ["Provider claims", "Airtel · TNM portals", "17:00", okb("Yesterday · passed")]],
            csv_name="tx-schedules")),
        sub("19.3", "Take everything now", form([], "Export the transaction pack (every table on this page)", msg="One CSV, every table, in page order — for the file or the auditor.",
            button_id="txPackNow")),
    ])
    return sec(19, "Reports & Exports", "What this module can hand over, on schedule or right now", inner)


def section20():
    inner = "".join([
        sub("20.1", "Transaction audit trail", table(
            ["When", "Action", "Subject", "By", "Outcome"],
            [["09:12", "Receipt issued", "TXN-2026-118401", "System", okb("Success")],
             ["09:07", "Held for review", "TXN-2026-118400", "System", okb("Success")],
             ["09:01", "Disbursement confirmed", "TXN-2026-118399", "Yamikani Banda", okb("Success")],
             ["08:33", "Internal transfer authorised", "TXN-2026-118395", "Chikondi Mwale", okb("Success")],
             ["08:18", "Payroll batch raised", "TXN-2026-118393", "Chikondi Mwale", okb("Success")],
             ["06:52", "Reversal posted", "TXN-2026-118385", "System", okb("Success")]],
            csv_name="tx-audit")),
        sub("20.2", "Numbering and prefixes", kv([
            ("Transactions", "TXN-YYYY-NNNNNN · national sequence"),
            ("Receipts", "RCP-000000 · branch counter series CSH-YYMMDD-NN"),
            ("Provider refs", "AM- · TNM- · NBS- · STD- · stored with the row"),
            ("Idempotency", "Provider ref + amount + minute"),
        ])),
        sub("20.3", "Module settings", kv([
            ("Timeout", "90 seconds before a poll"),
            ("Poll attempts", "3, then a person"),
            ("Retention", "7 years · immutable after the daily close"),
            ("Immutable window", "From the 16:00 reconciliation to the audit extract"),
        ])),
        sub("20.4", "Who may do what", checks([
            ("pass", "Capture", "Tellers and back office", "12 officers"),
            ("pass", "Authorise transfers & payroll", "Supervisors and the head of finance", "4 officers"),
            ("pass", "Reverse", "Supervisors only, reason required", "3 officers"),
            ("pass", "Change limits", "Head of finance + audit notice", "2 officers"),
        ])),
    ])
    return sec(20, "Audit & Settings", "The trail behind every row, the numbering, the settings and who may do what", inner)


# --------------------------------------------------------------- chrome ----
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
      <div class="page-title">Transactions Management &amp; Movement of Money</div>
      <div class="page-sub">Every kwacha, every channel, every state · <span id="topRefresh">{TODAY}</span></div>
    </div>
    <div class="search">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9AA0AC" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
      <input placeholder="Search a transaction, party, account or reference…" id="globalSearch" autocomplete="off" />
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
      <h1>Every kwacha that moves, in one place</h1>
      <p>Repayments, disbursements, deposits, transfers, fees, payroll and expenses — five channels, one register,
        one reconciliation and one audit trail. Twenty sections, each traceable to a real row.</p>
    </div>
    <div class="band-stats">
      <div class="band-stat"><b>922</b><span>Transactions today</span></div>
      <div class="band-stat"><b>{money(84_215_000)}</b><span>Value today</span></div>
      <div class="band-stat"><b>97.6%</b><span>Success rate</span></div>
      <div class="band-stat"><b>5</b><span>Channels</span></div>
    </div>
    <div class="mb-actions">
      <button class="btn btn-gold" data-goto="s14">Reconcile</button>
      <button class="btn btn-ghost" data-goto="s2">Open the register</button>
    </div>
  </div>
'''


def filterbar():
    defs = [("Method", ["All channels", "Airtel Money", "TNM Mpamba", "Bank transfer", "Cash at branch", "Internal transfer"]),
            ("State", ["All states", "Successful", "Pending", "Failed", "Cancelled", "Reversed", "Unreconciled"]),
            ("Type", ["All types", "Repayment", "Disbursement", "Deposit", "Transfer", "Fee", "Penalty", "Payroll", "Expense"]),
            ("Officer", ["All officers", "Linda Mhango", "Blessings Tembo", "Yamikani Banda", "Esther Mwale",
                         "Chikondi Mwale", "Tadala Msonthi", "System"])]
    sels = "".join(
        '<div class="fg"><label>' + esc(l) + '</label><select data-filter="' + esc(l.lower()) + '">' +
        "".join(f"<option>{esc(o)}</option>" for o in opts) + "</select></div>" for l, opts in defs)
    return f'''
  <div class="card panel filterpanel">
    <div class="panel-head"><div><div class="panel-title">Filter the transaction register</div>
      <div class="panel-sub">Every panel below narrows with these controls — channel, state, type and officer</div></div>
      <span class="badge b-gray" id="filterCount">no filters</span></div>
    <div class="form-grid four">{sels}
      <div class="fg"><label>Search</label><input id="filterSearch" placeholder="reference, party, account…" /></div>
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
/* ---------- transactions-specific extras ---------- */
.filterpanel{margin-bottom:13px}
.sub .hbar:last-child{margin-bottom:0}
.strip .sv{overflow-wrap:anywhere}
.txflag{font-size:9px;font-weight:800;letter-spacing:.3px;color:#7A5E10;
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

    with open("_tx2body.html", "w", encoding="utf-8") as fh:
        fh.write(html_out)
    with open("_transactions2.css", "w", encoding="utf-8") as fh:
        fh.write(css_out)
    n_sub = html_out.count("data-sub=")
    print("wrote _tx2body.html (%d bytes, %d panels), _transactions2.css (%d)"
          % (len(html_out), n_sub, len(css_out)))


if __name__ == "__main__":
    main()
