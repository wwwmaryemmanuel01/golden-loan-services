# GOLDEN FINANCIAL SERVICES — Admin Portal

A single-page-per-module administration system for a loan services business.
Plain HTML + CSS + vanilla JS — no build step, no dependencies, no external requests
(fonts, icons and charts are inline SVG, so it works fully offline).

## Reports module

`reports.html` holds 89 individual reports in 10 categories (Executive 7, Portfolio 9,
Repayments 9, Arrears 9, Financial 9, Customers 9, Applications 9, Staff 8, Risk 8,
Audit & Statements 12) plus a report console: date presets and range, officer / branch /
product / status filters, advanced filters, in-report search, summary totals, paginated
records table, CSV / Excel / PDF export, print, generation history and a role-based
access matrix.

Exports are real files: CSV (`text/csv` with BOM), **Excel as a genuine `.xlsx`**
(hand-built Office Open XML in a STORE zip — no libraries, no "format does not match"
warning) and PDF through the browser print dialog. When the page is opened inside a
sandboxed preview frame — where browsers block downloads and the print dialog — each
export falls back to an in-page preview modal with a **Copy** button instead of failing
silently. Nothing is a static screenshot — every figure is recomputed from the
sample dataset when a filter changes.

## Settings module

`settings.html` is the system configuration console: **18 sections** covering organisation
details and branding, users and staff, roles and permissions, authentication and security,
loan products, the approval workflow, repayments and financial rules, payment methods,
notifications, the customer portal, data and backups, audit logs, documents, reporting,
integrations and API, maintenance, localization and compliance — roughly 390 individual
settings.

Every control is live. Toggles, selects, number fields and text inputs write straight into
an in-page configuration object, and each section tracks its own **unsaved changes** —
`Save section` / `Discard` act on that section alone, `Save all changes` commits everything,
and every save appends an entry to the audit log in section 12. Changing a value that
legitimately appears in two places (currency in §1 and §17, for example) updates both.

Above the page a **search** finds any setting across all 18 sections by name or keyword,
dims the sections with no match and reports where the hits are — the only practical way
to navigate 390 settings.

The tables are real: creating a staff account, suspending, unlocking and resetting a
password, creating or deleting a role, editing the permission matrix, adding a loan
product or an approval level, reordering the payment allocation priority (with a live
allocation simulator), enabling payment methods, scheduling a report, revoking an API key,
adding a holiday and resolving a data correction request all mutate the in-page state and
re-render. Nothing is a static screenshot.

## Loan Applications module

`applications.html` is intake-to-disbursement: **15 sections** covering the overview, the
master register, capture of a new application, verification and KYC, credit assessment,
documents and agreements, review and decision, approval and authorization, pending files,
rejected and closed files, assignment and workflow, disbursement handover, customer
communication, reports and the audit trail.

The workflow is a real state machine, not a series of screenshots. Submitting an
application on section 3 creates the record (and the customer, if you register a new one),
places it in intake and stamps a review deadline. Verification then walks nine checks —
identity, contact, address, employment, income, documents, existing loans, balances and
repayment history — that you can mark pending, verified or flagged, and only completes when
all nine are verified. Assessment recomputes instalment, total repayable and debt-to-income
from whatever you type, classifies the risk and writes a recommendation. The reviewer then
recommends, rejects, returns or requests information, and each of those moves the file to
the right stage with the reason recorded. Approval enforces the authority matrix — a
1,000,000 limit at level 1, 5,000,000 at level 2 — and refuses an amount above the signer's
limit (and logs the blocked attempt). Handover runs six final checks, generates a real
repayment schedule from the approved terms, prepares a printable disbursement instruction
and forwards the file; forwarding is blocked until all six checks are ticked.

The rest is wired to the same records: documents can be received, marked invalid or
requested; the pending view groups files by what they are actually waiting for and lets you
record follow-ups; closed files can be reopened for reconsideration; officers can be
reassigned with a note; messages are sent from seven templates and land in the
communication history; and every action appends to the audit log, which is filterable and
pageable, alongside blocked-attempt alerts and the role permission matrix.

Reports (13) compute from the live register and export as CSV or a genuine hand-built
`.xlsx` (Office Open XML in a STORE zip, no libraries) and PDF through the browser print
dialog, with an in-page preview fallback inside sandboxed frames.

## Customers module

`clients.html` is the customer book: **14 sections** — customer overview, registration,
the directory, profile management, verification (KYC), loan accounts, repayment history,
financial summary, documents and agreements, communication, risk and credit history,
support and complaints, account actions, and reports and exports.

It runs on one in-memory register of 34 customers, 35 facilities and 211 payments, and
every section reads and writes that same state, so a change in one place shows up
everywhere else. Registering a customer (individual or business, with consent, bank and
mobile money details and attached documents) creates the record with a real customer
number, puts it in the KYC queue and seeds the welcome message; the profile preview and
the eight-point registration checklist update as you type.

Verification is a genuine gate: six checks (identity, address, employment, income,
documents, phone consent) can each be marked verified or outstanding, and approval is
refused — with the outstanding items listed — until all six pass and the documents are on
file. Approving lifts the customer from *Pending Verification* to *Active* and writes to
the verification history. Expired IDs are flagged everywhere they matter: the overview,
the document alerts, the KYC queue and the reports.

The customer's money is computed, never typed in. Each facility carries a real repayment
schedule built from the product rate and term, and every figure — outstanding principal
and interest, arrears, days past due, next instalment, settlement amount at any early
settlement discount, punctuality — is derived from it. Payments can be drilled down
receipt by receipt, statements and settlement letters print (or save to PDF), and
documents can be received, renewed or requested by SMS.

Account actions are live state changes with a reason and an audit trail: activate,
deactivate, suspend, restore, reset portal access (a temporary PIN is issued and texted),
merge a duplicate record (loans, payments, messages and tickets move across and the
duplicate is retired), and close an account. Reports (9) compute from the live register
and export as CSV or a real `.xlsx` workbook, with a print/PDF preview fallback.

## Audit Logs module

`audit.html` is the audit and compliance console: **18 sections** — overview, the all-logs
register, staff activity, administrator activity, customer record audit, loan application
audit, disbursement audit, repayment & collections audit, financial transaction audit,
authentication & security, roles & permissions, system configuration, system events &
errors, audit event details, search & investigation, security alerts, reports & exports,
and retention & integrity.

It runs on one seeded ledger of **560 audit events** (plus **132 sealed archive events**)
generated from 83 event templates across eleven staff accounts (including an auditor)
and the system principal.
Every event carries an event ID, timestamp, user ID, username, role, action, module,
affected record, outcome, severity, before/after values, transaction reference, correlation
ID, source IP, device, storage block and hash — so every section is a different lens on the
same data rather than a separate mock.

Filters are live: the all-logs register searches by user, username, action or record
reference and filters by date range, role, module, action type, outcome and severity, with
pagination and CSV export. Staff, administrator, customer, loan, disbursement, repayment,
financial, security, permission, configuration and system sections each carry their own
record-type tabs that re-query the ledger. Customer, financial and configuration events show
real previous/updated field diffs; loan and disbursement references open chronological
trails.

Work happens on the ledger, not in it: unlocking a locked account, approving or rejecting a
permission request, assigning, escalating, resolving or reopening a security alert, closing
an error investigation, saving an investigation with notes, editing the retention policy,
running an integrity check, archiving events and raising a backup all append genuine audit
events — which immediately appear in the overview, the registers and the event picker.

Retention and integrity are enforced rather than described: an SHA-style hash chain is
computed per 25-event storage block with a chain head, the checker reports gaps, archiving
moves events older than the configured age into the sealed store (still searchable) and
removes them from the live register, and a deletion request inside the retention period is
refused automatically and logged as a denied critical event. Reports (9, daily/weekly/
monthly summaries through staff, administrator, financial, security, permission and critical
reports) compute from the live ledger and export as CSV, a real `.xlsx` workbook or print/
PDF, with every export written to the export history.

## Repayments & Collections module

`repayments.html` is the collection and repayment console: **18 sections** — overview,
record a repayment, the all-repayments register, payment verification, allocation,
schedules, collections, arrears and delinquency, payment methods, receipts,
settlements and early repayment, reversals and adjustments, collection officers,
reconciliation, reports, notifications, audit and repayment settings.

It is a working console, not a mockup. Recording a repayment issues a real receipt from
the running sequence (`RCP-000513…`), runs the reference duplicate check, queues the
payment for verification and writes to the audit log — after which it appears in the
register, the KPI tiles, the schedules and the receipt book. Verification moves a payment
from pending to verified (individually, with notes and a rejection reason, or in bulk for
everything that has a matching reference); allocation then splits it across penalties,
fees, interest and principal, using the configured order, and reduces the loan balance.
Excess stays visible until it is applied to the next instalment, held as credit or
refunded. Reversals never delete: the original receipt, allocation and audit entry stay
in place with a reversing entry on top, and settlement closes a loan outright.

The five tools that are easy to fake are real here:

- **Arrears ageing** — 1–30 / 31–60 / 61–90 / 90+ buckets computed from DPD per loan.
- **Receipts** — printable receipt card, reprint history with a reason, and voiding that
  needs supervisor authorization and is logged separately from the payment.
- **Reconciliation** — per-channel recorded vs confirmed with differences, an
  investigation modal that posts adjustments, and a "run reconciliation" that balances
  the day and appends to the history.
- **Officers** — targets against collections with a portfolio drill-down.
- **Exports** — CSV, and a genuine hand-built **`.xlsx`** (Office Open XML in a STORE zip,
  no libraries) validated to open in Excel; PDF through the browser print dialog. Inside a
  sandboxed preview frame, where downloads and print are blocked, each falls back to an
  in-page preview instead of failing silently.

## Graphing & Tabulation module

`analytics.html` is the analytics console: **15 sections** — analytics overview, financial
graphs, loan portfolio graphs, repayment & collection graphs, customer analytics, staff
performance, disbursement graphs, tabular data and registers, financial summary tables,
comparison and trend analysis, filters and data exploration, graph types and visualization,
report exports and printing, data accuracy and reconciliation, and graphing & tabulation
settings.

One seeded book feeds the whole page: 60 customers, 77 facilities, 132 applications,
86 payouts, 402 receipts, 512 financial transactions and 140 audit events across 15 months
and five products (Salary Loan, Business Boost, Emergency Loan, Asset Finance, Group
Lending) in four regions. Every figure — disbursed, collected, outstanding, arrears,
interest, fees, ageing, approval rate, recovery — is derived from those records, so a chart,
its total and the register underneath can never disagree.

Charts are drawn as inline SVG by a small chart engine with no libraries: line, area, bar,
grouped bar, stacked bar, pie and donut, with axis ticks, gridlines, tooltips and legends,
all respecting the display settings. There are 56 charts on load, each paired with the
number it is drawing.

Exploration is live. The filter panel (date range with presets, daily/weekly/monthly/annual
grain, product, status, customer, staff, payment method, region and free-text search) drives
every section at once; the ten registers (loans, customers, applications, disbursements,
repayments, arrears, collections, staff, transactions, audit) sort by any column, search,
paginate and open the underlying record on click. Section 9 holds nine summary tables, and
section 10 computes current-vs-previous period, month-on-month and year-on-year growth,
approval and repayment rate trends, arrears movement, customer growth and target vs actual.

Section 12 rebuilds any of seven measures as any of six chart types with the matching data
table. Section 13 exports CSV, a real `.xlsx` workbook (own stored-zip writer), print-ready
PDF via the browser dialog with the company brand block, date range and filters, PNG images
of the current chart, and an executive summary — every export is written to the export
history. Section 14 recomputes eight reconciliation checks and compares each headline figure
with its source records. Section 15 controls currency (MK/MWK/K), precision, number format,
default range and chart type, table columns and sorting, chart gridlines/legend/values and
the access matrix — and the figures reformat immediately when applied.

## Charts & Analytics module

`charts.html` is the read-only analytics console: **15 sections** — analytics overview,
financial performance, loan portfolio, repayment & collection, disbursement, customer,
staff performance, arrears & credit risk, loan application, payment method, comparison &
trend analysis, interactive charts, filters & data exploration, analytics reports &
exports, and data accuracy & analytics settings.

Every card, chart and table is computed from one seeded book — 60 customers, 77 facilities,
132 applications, 86 payouts, 402 receipts and 512 transactions over 15 months, five
products (Salary, Business Boost, Emergency, Asset Finance, Group Lending) in four regions
(Lilongwe, Blantyre, Mzuzu, Zomba) across Airtel Money, TNM Mpamba, bank transfer and cash.

- **78 charts** on load, all inline SVG from a small engine (line, area, bar, grouped bar,
  stacked bar, pie, donut) with gridlines, axis ticks, legends and hover tooltips, plus an
  optional least-squares trend line on any series.
- **Risk analytics** with real ageing: overdue value per 1–30 / 31–60 / 61–90 / 90+ bucket,
  PAR trend computed from the instalment schedule, a written-off default rate, an arrears
  recovery series and a ranked high-risk account list.
- **Applied analytics** for the pipeline (volume, queue age, approval and rejection rates,
  average processing time, pending by officer) and for channels (value in/out per rail,
  cash vs digital, success and failure rates, unreconciled transactions).
- **Filters drive all 15 sections at once**: date range with six presets, daily / weekly /
  monthly / annual grain, product, status, customer, staff, method, region and free-text
  search — plus a separate two-period comparison tool and a refresh stamp.
- **Drill-down everywhere**: any chart card, table row or gallery record opens the
  underlying loan, customer, receipt, application, payout, transaction or officer.
- **Seven ready reports** (financial performance, loan portfolio, repayment performance,
  disbursement, customer growth, staff performance, arrears and risk) with preview, CSV,
  a real `.xlsx` workbook, and PDF through the print dialog; the whole pack can be taken at
  once, and chart images export as PNG. Every export is written to the export history with
  the filters it ran under.
- **Eight reconciliation checks** recomputed on every render (chart totals against tables,
  receipt allocation, outstanding against principal, payouts against disbursed value,
  arrears against the schedule, application statuses, orphans and duplicate keys) — plus a
  figure-by-figure comparison with source records and a missing/duplicate panel.
- **Settings** for currency (MK/MWK/K), precision, number format, default range, default
  chart type, table sorting, gridlines/legend/value labels and sensitive-data masking, with
  an access matrix per role.

## Compliance & Intelligence module

`compliance.html` is the control room: **15 sections** — compliance overview, customer
verification & KYC, loan compliance, financial transaction monitoring, fraud & suspicious
activity, credit risk intelligence, staff compliance & access, regulatory & policy, alerts &
case management, audit & investigation, reports & analytics, customer data protection, rules
& thresholds, the intelligence dashboard, and settings & security.

It runs on the same seeded book as Charts & Analytics (60 customers, 77 facilities, 132
applications, 86 payouts, 402 receipts, 512 transactions, five products, four regions,
Airtel Money / TNM Mpamba / bank / cash) and derives every register from it:

- **KYC register** — five document types weighted 30/20/10/20/20 into a completeness score,
  contact and address verification, missing and expired documents, duplicate identity
  groups, a review queue that can be approved or rejected (each decision is written to the
  verification history and moves the overall compliance score).
- **Loan compliance** — nine policy tests per facility (eligibility, approval authority,
  amount limit, interest rate, fees & penalties, agreement, required documents, term and
  approval workflow) with the breaches listed against each loan and an exception register.
- **Transaction monitoring** — duplicate receipts inside a configurable window, large or
  unusual movements above the threshold, channel-reference verification, unallocated
  payments, reconciliation exceptions, repeated failures and reversals, and investigation
  history.
- **Fraud signals** — customers sharing identifiers, refused sign-ins, suspicious
  application patterns, receipts edited after posting, unusual payout patterns and the
  investigation records they produced.
- **Credit risk** — exposure and arrears by customer and product, ageing buckets derived
  from the instalment schedule, repeat-late patterns, PAR, default indicators and a monthly
  risk-classification history.
- **Staff & access** — permission reviews, privileged accounts, payouts released above the
  approving officer's limit, segregation-of-duties checks, refused and after-hours access,
  role changes and review history.
- **Regulatory & policy** — twelve requirements with evidence status, internal lending and
  data-protection policies, required disclosures, a task register, an evidence repository
  and the quarterly reporting pack.
- **Alerts & cases** — every case carries an owner, due date, severity, notes, evidence,
  corrective actions and a full history; assign, escalate, resolve and close all mutate
  state and recompute every other section.
- **Audit** — finding register with ratings and recommendations, internal audit reviews,
  corrective-action tracking, and the investigations raised from transactions, customers
  and staff.
- **Nine standing reports** — customer verification, loan compliance, suspicious
  transactions, arrears & credit risk, staff access, policy exceptions, audit findings,
  open cases and corrective-action status — each with a preview, CSV, a real `.xlsx`
  workbook and PDF through the print dialog, plus the whole pack in one click.
- **Data protection** — access monitoring with purpose checks, sensitive-field controls,
  consent records, correction/export requests, retention rules, breach incidents and review
  history.
- **Rules & thresholds** — every test on the page reads its limit from one place; changing
  a threshold and saving recalculates all fifteen sections and writes the old and new value
  to the rule audit trail, with a rule-change approval queue.
- **Intelligence dashboard** — ranked high-risk customers, staff access risk scoring,
  repeated policy exceptions, unresolved cases and five prioritised actions that jump
  straight to the section that fixes them.
- **Filters drive all fifteen sections at once** — date range, lane, severity, case state,
  owner, region, product and free text, with removable chips and a live result summary.

## Security & Protection module

`security.html` is the security control room: **18 sections** — security overview, staff
account security, authentication, roles & access control, sessions & devices, customer data
protection, financial transaction security, database & Supabase security, application & API
security, fraud monitoring, alerts & incidents, audit logs, backup & recovery, encryption &
secrets, compliance & privacy, security reports, testing & maintenance, and security settings.

- **Security score** — a weighted index (account hygiene, failed sign-ins, open critical
  incidents, MFA coverage, remediated vulnerabilities, RLS coverage, closed findings) that
  moves as you act on the page.
- **Live mutations** — lock, unlock, suspend, restore, deactivate and re-activate accounts,
  force password resets, revoke one session or every session for an officer, approve payment
  reversals and financial adjustments, progress data export/correction requests, rotate
  secrets, remediate vulnerabilities and file/close incidents from the case workspace.
- **Incident workspace** — assign a reviewer, add investigation notes and evidence, record
  corrective actions, escalate and resolve; each change is written to the incident history
  and to the section's audit rows.
- **Filters drive all eighteen sections at once** — date range, lane, severity, state, owner,
  region and free text, with removable chips and a live result summary.
- **Ten security reports** — daily summary, failed logins, staff account security, privileged
  access, suspicious activity, financial security incidents, database, API, backup and
  incident resolution — each with an on-screen preview, CSV, Excel (xlsx) and print/PDF
  output, plus a combined security pack.
- **Settings that bite** — password rules, attempt limits, lockout, session timeout, MFA,
  sensitive-transaction thresholds, alert thresholds, audit retention and escalation rules are
  editable, validated, saved and recorded in a configuration change history.

## Website Management & Connections module

`website.html` is the public-facing control room: **20 sections** — website overview, public
website management, content management, pages, domain & hosting, backend server connection,
Supabase database connection, API & service integrations, authentication connections,
frontend–backend integration, forms & data connections, files & media, performance,
connection diagnostics, deployment & versions, connection alerts, access & permissions,
reports, system configuration, and change history.

- **Connection score** — a weighted index (uptime, endpoint health, integration failures,
  RLS coverage, open connection alerts, SSL days remaining, deploy success) that moves as you
  act on the page.
- **Live mutations** — publish and unpublish the site, purge the CDN cache, switch theme and
  accent, toggle homepage sections, reorder/hide/add navigation items, save contact details,
  edit and publish content, change page visibility and access, create pages, repair broken
  links, acknowledge page errors, re-check DNS, renew the certificate, restart the backend,
  fix RLS gaps, rotate API credentials, verify an integration, run an auth or frontend test,
  submit a test form entry, restore or purge a missing file, run diagnostics, deploy to
  staging or production, roll back a release, acknowledge alerts, toggle alert rules, grant
  or withdraw role capabilities, and save or reset configuration.
- **Eight reports** — availability, connection health, API performance, database connectivity,
  authentication service, deployment, website errors and integration reliability — each with
  an on-screen preview, CSV, Excel (xlsx) and print/PDF output, plus a combined pack.
- **Filters drive all twenty sections at once** — date range, area, severity, state, owner and
  free text, with removable chips and a live result summary.
- **Audit trail that writes itself** — every mutation lands in Change History with the area,
  previous value, new value and responsible officer.

## Methods of Payment Management & Connections module

`payments.html` is the money-in control room: **20 sections** — payment overview, payment
methods management, mobile money, bank transfer, cash, gateway connections, the customer
payment experience, transaction monitoring, verification, the loan repayment connection,
reconciliation, fees and limits, receipts and statements, notifications, security and access,
refunds, reversals and disputes, the Supabase/database connections, API and webhook
monitoring, reports, and settings with its audit history.

- **Every rail in one place** — Airtel Money, TNM Mpamba, FDH and Standard Bank transfers,
  cash at the branch, the PayChangu gateway and the agent tills, each with its merchant
  number, reference rule, limits, fee and connection state.
- **Live mutations** — add, enable, disable, reorder, default and archive a payment method;
  save mobile money, bank and gateway configuration; test a provider connection; toggle
  sandbox; rotate credentials; replay a signed webhook; import and reconcile statements;
  issue and verify cash receipts; verify, auto-confirm or reject a payment; allocate a payment
  across principal, interest and fees; run provider, bank and cash reconciliation; add
  adjustments and sign a run off; switch who pays a fee; generate, verify and print a receipt;
  build a customer statement; toggle notifications; grant or withdraw role capabilities;
  approve a sensitive change; approve, reject or post a refund; reverse a payment; resolve a
  dispute; fix an RLS gap; run consistency checks and diagnostics; retry a failed webhook;
  and save, validate or reset the payment settings.
- **Twelve reports** — daily, weekly and monthly payment, by method, by provider, by staff
  member, successful and failed, processing fees, unreconciled payments, loan repayment
  collections, verification and refunds/reversals — each with an on-screen preview, CSV,
  Excel (xlsx) and print/PDF output, plus a combined pack.
- **Filters drive all twenty sections at once** — date range, area, severity, payment state,
  officer, branch, product and free text, with removable chips and a live result summary.
- **Reconciliation that adds up** — provider statements, bank lines and cash receipts are
  matched to the same receipts the rest of the portal runs on; the gaps, the adjustments, the
  daily summary and the audit trail all follow the filters.
- **Audit trail that writes itself** — every mutation lands in Configuration Change History
  with the area, the previous value, the updated value and the responsible officer.

## Transfers Management & Connections module

`transfers.html` is the movement register: **20 sections** — the transfers overview, transfer
management, internal account transfers, savings transfers, loan-related transfers, external bank
transfers, mobile money transfers, transfer verification, approvals, status tracking and
processing, balance and ledger management, fees and limits, beneficiary management, receipts and
statements, failed transfers and reversals, fraud prevention and security, the transfer,
payment-gateway and service connections, the Supabase/database connections, notifications, and
reports with the settings and audit history.

- **One book for every rail** — internal, savings, loan, bank, Airtel Money, TNM Mpamba and the
  card gateway are read from the same customer accounts, loans and ledger the rest of the portal
  runs on: 120 current and savings accounts, ~390 transfers, a live ledger, twelve approvals,
  a verification queue, 26 beneficiaries and 70 receipts.
- **Live mutations** — create a transfer in any state; post an internal transfer between own or
  third-party accounts (ownership, restriction and balance checks run first, then both ledger
  sides and a receipt are written); move money into, out of or between savings accounts; apply a
  repayment or disbursement to a loan and watch the outstanding balance follow; submit bank and
  wallet payouts after verifying the beneficiary; verify, reject, bulk-verify or auto-verify the
  queue; give first-level and management approval (self-approval is refused); move a transfer
  between states; issue a receipt; scan duplicate provider references; recalculate balances;
  reconcile the ledger; post an adjustment; edit and save per-rail limits and fees; add, edit,
  verify, enable or disable a beneficiary; print a receipt or a customer statement; retry a
  failed payout; approve, post or reject a reversal; test and rotate a provider connection;
  acknowledge a connection alert; fix the RLS gap; run the integrity and schema checks; send a
  test SMS or email; toggle a notification rule; export any report; and save or reset the module
  settings.
- **Twelve reports** — daily, weekly and monthly, by method, by customer, by staff member,
  high-value, failed and reversed, fees, reconciliation, beneficiaries and authorised transfers —
  each with an on-screen preview, CSV, Excel (xlsx) and print/PDF output, plus a combined pack and
  an export-you-are-authorised-for list.
- **Filters drive all twenty sections at once** — date range, area (internal, savings, loan,
  bank, mobile money, reversals, receipts, security, database), severity, transfer state, officer,
  branch, product and free text, with removable chips and a live result summary.
- **Balance work that adds up** — available, reserved and ledger balances are derived from the
  transfers themselves; discrepancies are shown against the ledger; every correction writes an
  opposite ledger entry instead of editing a figure, and a transfer may never write a loan
  balance directly.
- **Audit trail that writes itself** — every mutation lands in Configuration Change History and
  the module audit log with the previous value, the updated value, the officer and the timestamp.

## Savings Management & Connections module

`savings.html` is the customer savings book: **20 sections** — the savings overview, savings
account management, customer savings profiles, savings deposits, savings withdrawals, balance and
ledger management, interest management, savings products and plans, savings goals, payment method
connections, transaction monitoring, statements and receipts, fees, limits and penalties,
transfers, notifications and reminders, dormant and restricted accounts, security and fraud
prevention, the Supabase/database connections, reports and analytics, and the settings with the
audit history.

- **One book for every savings product** — 240 customer accounts (120 savings, 120 current),
  six products from Standard Savings at 6.5% to Fixed-Term 12 months at 11.5%, ~390 recorded
  transactions, twenty goals, eighteen beneficiaries, a double-entry ledger, receipts,
  interest accrual and the monthly postings all read from the same customers the rest of the
  portal runs on.
- **Live mutations** — open an account (the number is generated from the configured prefix and
  sequence) and watch it appear in the register; edit the permitted details; activate, restrict,
  suspend or close (a close with money in it is refused); record a deposit and verify it so the
  balance, the ledger and a receipt all follow; raise a withdrawal after verifying the identity,
  then verify, approve, reject, cancel or process it; recalculate balances from the ledger and
  reconcile them; post an adjustment with a reason (a change without one is refused); change the
  interest rate and the accrual follows; calculate interest on an amount; build a goal, contribute
  to it, move its date, complete or cancel it; pause or resume a rail; record, verify and receipt
  a deposit; search the register by state; verify a receipt; reconcile the rails and the
  transfers; save fees through an editable panel; request a fee waiver; post a transfer between
  accounts and pay a loan out of savings; toggle permission grants, notification rules and
  dormancy detection; fix the RLS gap; run the integrity and schema checks; send a test SMS or
  email; export any report; and save or restore the module settings.
- **Twelve reports** — total savings, growth, deposits and withdrawals, by customer, by product,
  interest accrual, interest paid, dormant accounts, pending transactions, reconciliation, fees
  and penalties, and the export-authorised list — each with an on-screen preview, CSV, Excel
  (xlsx) and print/PDF output, plus a combined pack and a generation history.
- **Filters drive all twenty sections at once** — date range, area (savings, deposits,
  withdrawals, interest, goals, dormant, security, database), severity, transaction state,
  officer, branch, product and free text, with removable chips and a live result summary.
- **Money that reconciles** — available = opening balance + confirmed credits − completed debits −
  reserved, and available plus reserved equals the ledger entry for entry; two accounts are
  deliberately short so the discrepancy checks bite, and every correction writes an opposite
  ledger row instead of editing a figure.
- **Rules that cannot be bypassed** — a deposit is credited only after verification, a duplicate
  reference inside the window is held, a payout needs a verified identity and refuses to break
  the minimum balance, and the approval route follows the configured thresholds.
- **Audit trail that writes itself** — every mutation lands in the configuration change history
  and the module audit log with the previous value, the updated value, the officer and the
  timestamp.
- **Every row opens a readable record sheet** — clicking any table row opens a labelled sheet
  (Account, Customer, Opened, Available, Rate, Status …) instead of raw column keys: dates read
  `30 Oct 2026 · 18:48`, counts and money are formatted, customer and staff codes resolve to
  names, internal keys are hidden, and the same value never prints twice.
- **Works on a phone** — below 760px the record sheet goes full width, filter and form grids
  collapse to one column, charts stack, and every register scrolls inside its own pane with the
  first column pinned, so no table pushes the page sideways.

## Salaries, Expenses & Operating Charges module

`salaries.html` is the payroll and operating-cost book: **20 sections** — the financial overview,
staff salary management, payroll processing, allowances and benefits, salary deductions and
statutory items, staff payslips, staff expense claims, business operating expenses, system
operating charges, recurring expenses, expense categories and departments, budgets, payments,
the approval workflow, the accounting ledger, staff and supplier records, notifications and
reminders, security and access control, the Supabase/database connections, and the reports,
configuration and audit history.

- **One book for every cost** — 42 staff and 42 salary records, six payroll periods
  (05/2026 to 10/2026) with 41 live payroll lines, nine allowance types, 168 allowance lines,
  seven deductions, six statutory remittances, 60 payslips, 46 expense claims, fifteen expense
  categories, 65 operating expenses over six months, sixteen system providers, sixteen recurring
  contracts, 23 budgets, 34 payments, 26 approval requests, a balanced ledger, fourteen
  suppliers and eighteen staff-to-salary links, all built from the staff and customers the rest
  of the portal runs on.
- **Live mutations** — create a salary record (the net is derived, never typed); adjust it with
  a reason and watch gross, PAYE, pension, NHIMA and net follow; create a payroll period,
  recalculate it, approve it, pay it (a paid period can no longer be recalculated) and retry
  failed lines; record an allowance; remit every outstanding statutory item; build, print and
  email a payslip; submit a claim (a claim above the receipt limit without a receipt is
  refused), approve, reject, return or reimburse it; record an expense, approve it and mark it
  paid; pay a system charge or renew a subscription; renew or cancel a recurring contract; edit
  a category limit and open a new one; revise a budget; raise a payment (anything above the
  high-value limit creates a two-signature approval), confirm it, fail it or reconcile the bank;
  approve, reject or return a request (self-approval is blocked); reconcile the ledger; verify a
  supplier and read their masked bank details; toggle notification rules and send a test SMS or
  email; flip a permission; close the RLS gap; run the database checks; export any report; and
  save or restore the module settings.
- **Fourteen reports** — monthly payroll, annual salary, allowances and benefits, statutory
  deductions, business expenses, system charges, supplier payments, recurring expenses, budget
  against actual, outstanding obligations, expense trends and forecasts, staff member
  responsible, record creation and modification history, and the export-authorised list — each
  with an on-screen preview, CSV, Excel (xlsx) and print/PDF output, plus a combined pack and a
  generation history.
- **Filters drive all twenty sections at once** — date range, area (salaries, payroll,
  allowances, claims, expenses, system, suppliers, budgets), severity, state, officer,
  department, category and free text, with removable chips and a live result summary.
- **Money that reconciles** — net = gross − PAYE − pension − NHIMA − loan recovery − advance;
  the ledger's debits and credits net to zero; and the month's payroll, expenses and system
  charges land at 91% of the MWK 39,000,000 operating budget.
- **Rules that cannot be bypassed** — the cut-off must fall before the pay date, a claim above
  the receipt limit needs a receipt, a deduction may not exceed a third of gross, a requester
  may never approve their own request, a supplier bank change needs two signatures, and a
  payroll is locked once it has been paid.
- **Audit trail that writes itself** — every mutation lands in the configuration change history
  and the module audit log with the previous value, the updated value, the officer and the
  timestamp; the financial health score (65%) and the twelve open issues are derived from the
  registers rather than typed.

## Deposits & Withdrawals Management & Connections module

`deposits.html` is the money-movement register: **18 sections** — financial overview, deposit
management, withdrawal management, deposit verification, withdrawal approvals, the customer
account connections, the loan account connections, the payment method connections, transaction
processing, balance and ledger management, limits and fees, refunds and reversals, receipts and
statements, customer notifications, fraud prevention and security, the Supabase/database
connections, reports, and settings with its audit history.

- **One book for both directions** — every deposit and every payout is read from the same
  customer accounts, loans and ledger the rest of the portal runs on, so an available balance
  here is the available balance everywhere: 60 customer accounts, 390 movements, a 90-entry
  ledger, 12 approvals and a live verification queue.
- **Live mutations** — record a deposit (it posts the ledger credit, the receipt and the
  account balance, or queues itself for verification); submit a withdrawal against nine live
  checks; verify an identity; approve, reject or auto-verify a deposit; give first-level and
  management approval to a payout (the debit posts and the reservation releases); cancel an
  eligible request; reconcile an account; update a loan balance from the deposits linked to it;
  validate a provider reference; move a transaction between states; generate a receipt; scan for
  duplicates; recalculate every balance; reconcile the ledger; post an adjustment; edit and save
  method ceilings; calculate a fee; approve, post or reject a reversal; verify a receipt; print
  or download a customer statement; send a test SMS or email; toggle a notification rule; grant
  or withdraw a role capability; fix the RLS gap; run the integrity and schema checks; and save,
  validate or reset the settings.
- **Twelve reports** — daily deposits, daily withdrawals, the weekly and monthly summary,
  deposits and withdrawals by method, deposits and withdrawals by customer, pending, failed,
  reconciliation, fees and authorised transactions — each with an on-screen preview, CSV, Excel
  (xlsx) and print/PDF output, plus a combined pack.
- **Filters drive all eighteen sections at once** — date range, area (deposits, withdrawals,
  ledger, cash, mobile money, bank, reversals, security, database), severity, transaction state,
  officer, branch, product and free text, with removable chips and a live result summary.
- **Balance work that adds up** — opening, available, reserved and ledger balances are derived
  from the movements themselves, discrepancies are shown against the ledger, and every
  correction writes an opposite ledger entry instead of editing a figure.
- **Audit trail that writes itself** — every mutation lands in Configuration Change History and
  the module audit log with the area, the previous value, the updated value and the officer.

## Brand: the logo across the system

The GOLDEN FINANCIAL SERVICES logo from `assets/logo-master.png` is used everywhere the
business appears, and it is added to the pages by a build step rather than by hand.

`make-assets.sh` derives every size from the master file:

| File | Use |
|---|---|
| `assets/logo.png` | full lock-up, transparent background — light surfaces and print |
| `assets/logo-dark.png` | full lock-up on black — sidebar splash and the sign-in panel |
| `assets/logo-mark.png` | the emblem alone ($ and arrow), transparent |
| `assets/logo-mark-96.png` | small emblem, embedded as a data URI in printed documents |
| `assets/favicon-32.png`, `favicon-64.png`, `favicon.ico` | browser tab and bookmarks |
| `assets/apple-touch-icon.png` | home-screen icon on a dark rounded tile |

Transparency is generated from the pixel's brightest channel, so the gold keeps its
shading and the glow fades out instead of leaving a black rectangle behind it.

`inject_brand.py` runs from `inject_backnav.py` during every build and puts the mark in:

1. **Headers** — a wide dark bar, the same ink as the sidebar (`#0F1115`, hairline `#23262E`),
   96px tall on a desktop, carrying the emblem and then the words **GOLDEN FINANCIAL SERVICES**
   in 21px extra-bold white with wide tracking, **ADMINISTRATION PORTAL** under it in spaced gold
   (`#E4C264`), then the module name. Type steps down at 1380 / 1120 / 900 / 620px so the bar
   never crowds the controls; the page title ellipsises rather than pushing buttons off-screen.
2. **Sidebar** — the `GF` monogram becomes the emblem, on every page.
3. **Footers** — a page footer with the mark, the company line, real links and the year.
4. **Receipts** — the gold `GF` tile on a repayment receipt is the emblem (a dark tile
   behind it so the gold always reads), and the collection and proof-of-payment receipts
   carry the emblem above their letterhead.
5. **Sign-in** — `login.html`, a standalone screen: the full logo on the dark panel and the
   emblem on the form card.
6. **Documents** — every printed table, receipt and export goes through the modules'
   `printTable` / `doPrint`, which now emit a branded letterhead band with the emblem
   embedded as a data URI, so a document printed or saved later still carries the logo.
   Printed pages also get a print-only header band with the full lock-up, the branch line
   and the print time.
7. **Every section is spread open.** Modules are laid out flat, as designed: each section's
   heading and its full content are shown one under the other, down the page, with nothing to
   tap to reveal it. An earlier build folded the sections into a one-at-a-time accordion
   (closed bodies, state chips, a "Close section" bar, a header chip); that layer has been
   removed and no page carries it any more — `inject_brand.py` strips any leftover blocks and
   `_sections.css` / `_sections.js` are gone. The section headings keep the gutter fix: they
   carry no negative margin, so titles start inside the page padding and never clip.
8. **Side bar that closes itself.** On a phone the side bar is off-canvas: tapping the menu
   slides it in and it slides back out once you stop using it (6 seconds idle, restarted by any
   touch, scroll or key press inside it). `Escape` and a tap outside close it immediately, so it
   can never sit over the page swallowing clicks. The delay is configurable with
   `document.documentElement.dataset.sidebarIdle` in milliseconds.
9. **No loading overlay.** An earlier build covered the page with a splash while it loaded;
   it is gone. It could hold the overlay over the sidebar when a navigation did not actually
   happen, which made the sidebar look broken (clicks swallowed). Pages now paint directly —
   nothing sits between the pointer and the page.
10. **Favicon and app icons** — set on all 24 pages, plus `theme-color`.

**Nothing starts at the screen edge.** Six pages place their sections straight inside `.main`
with no `.content` wrapper, so they had **no gutter at all**; the section heading also carried a
negative margin, which pulled it a further 8px past the edge and clipped the first letters of
every title and the chevron on the right. Now every page has a 16px gutter (15px on a phone),
headings use padding and never a negative margin, `scroll-padding-top` keeps a heading clear of
the sticky header when a section chip or `#sN` link jumps to it, and the sticky chip bar keeps
its full-width background inside that gutter.

**The stat band.** Fees, salaries and savings render their headline figures in
`<div class="band">` with `.bl` / `.bv` children, but the stylesheet they build from only styles
`.modband` — so that strip appeared as bare text above the content. It now has the same dark band
as every other module.

**On a phone.** The header keeps the name on one line (clipped with an ellipsis, never wrapped
onto three lines that made the bar taller than its own sticky offset) and drops the module name,
which the page body already carries. The bar's real height is measured at run time into
`--gls-topbar-h`, and the sticky section bar and anchor offsets are derived from it — so content
can no longer slide under the header. `text-size-adjust:100%` stops mobile Chrome from enlarging
small labels inside fixed rows, which used to clip the top or bottom off the letters.

**Tables on a phone.** A register no longer breaks words at every character (the stacked
`R E F E R E N C E` columns): a header keeps its word whole, a cell breaks only between words,
and a register wider than its card scrolls sideways inside it. Checked on all 847 tables.

**Text contrast.** Every label in the shell was checked against its background for a contrast
ratio of at least 4.5:1: header name 19:1, gold portal line 11:1, page subtitle 11:1, sidebar
navigation 13:1, sidebar role line 8.9:1, search placeholder 6.4:1. The footer is now the same
dark band as the header: `#C7CBD4` text (11.2:1) and `#E4C264` links (10.8:1) on `#0F1115`.
Colour is never used to carry meaning on its own.

Every insertion is idempotent: running a build twice replaces its own blocks rather than
stacking them. `python3 inject_brand.py` alone re-brands existing pages without a rebuild.

## Sign-in screen

`login.html` is the portal's entry screen — not a generated module page. It carries its own
layout (brand panel on the left, form on the right), the logo, a show/hide password control
and a live "Forgot?" note. It is a design preview: **no password is sent or stored**, and
two-factor authentication is not enforced yet, which the screen states plainly instead of
implying protection that is not there. The sidebar footer carries a sign-out link back to it.

## Back navigation

Every page carries a shared back control in the topbar (`_backnav.html`, injected at the end
of each build by `inject_backnav.py`). It keeps a per-tab stack of the pages you actually
visited, so **Back** walks that stack — reports → staff → dashboard — and stops (disabled) on
the dashboard, the home page. Opening a module directly from a bookmark falls back to
`index.html`. On the dashboard it also steps out of a drill-down view back to the overview.

- Desktop: labelled `‹ Back` button showing the destination in its tooltip (`row` of the stack).
- Tablet / phone (≤860px): icon-only 36–38px touch target, kept leftmost before the menu button.
- Keyboard: the browser's own back shortcut keeps working; this is additive.
- In print: the control is excluded with the rest of the topbar.

## Record sheets and small screens

Every module now behaves the same way when you open a record or pick up a phone.

- **Any row opens a readable sheet.** A row in any register, in any module, opens a labelled
  sheet: friendly labels (`interestRate` reads *Interest Rate*), values formatted (`MK 990,500`,
  `30 Oct 2026 · 18:48`), `STF-` and `GF-` codes resolved to names, blank fields and repeated
  label/value pairs dropped, dates embedded in a sentence still read as dates, and JSON objects
  flattened into `Key: value` lines instead of a raw blob.
- **Grouped, not dumped.** A savings record reads *At a glance* first, then *Balances and
  amounts*, *Dates and timing* and *Other details*, with officer, branch, area and severity
  chips at the foot.
- **One shared implementation.** `_recordsheet.css` and `_recordsheet.js` are injected into
  every page by `inject_backnav.py`, so a page that has its own hand-built modal is upgraded in
  place and a table that never opened anything now opens a sheet built from its own column
  headers. Forms are never touched.
- **Detail panels wrap.** Long names, references and notes wrap inside the card instead of
  running off it; on a phone the label sits above the value, one field per line.
- **Phone layout.** ≤1100px four-column blocks fold to two; ≤760px the sidebar becomes an
  off-canvas panel, grids and filter bars go single column, charts stack, the modal becomes a
  full-width sheet and every register scrolls sideways inside its own pane with the first column
  pinned; ≤460px the sheet fills the screen and the KPI row goes one column.

## Modules

| Module | File | Sections |
|---|---|---|
| Dashboard | `index.html` | 13 |
| Disbursements | `disbursements.html` | 18 |
| Notifications | `notifications.html` | 18 |
| Staff Management | `staff.html` | 18 |
| Reports & Analytics | `reports.html` | 11 · 89 reports |
| System Settings | `settings.html` | 18 · ~390 settings |
| Repayments & Collections | `repayments.html` | 18 |
| Loan Applications | `applications.html` | 15 |
| Customers | `clients.html` | 14 |
| Audit Logs | `audit.html` | 18 |
| Graphing & Tabulation | `analytics.html` | 15 · 56 charts |
| Charts & Analytics | `charts.html` | 15 · 78 charts |
| Compliance & Intelligence | `compliance.html` | 15 · 26 charts · 9 reports |
| Security & Protection | `security.html` | 29 · 125 panels |
| Website Management & Connections | `website.html` | 20 · 39 charts · 8 reports |
| Methods of Payment Management | `payments.html` | 20 · 31 charts · 12 reports |
| Deposits & Withdrawals Management | `deposits.html` | 18 · 21 charts · 12 reports |
| Transfers Management | `transfers.html` | 20 · 17 charts · 12 reports |
| Savings Management | `savings.html` | 20 · 22 charts · 12 reports |
| Salaries, Expenses & Operating Charges | `salaries.html` | 20 · 39 charts · 14 reports |

| Fees & Penalties | `fees-penalties.html` | 20 |
| Roles & Permissions | `roles-permissions.html` | 11 |
| Data Recovery | `data-recovery.html` | 12 |
| Sign-in | `login.html` | standalone entry screen |

Open `index.html` and use the sidebar to move between modules — every module shares
the same shell (sidebar, topbar, design tokens) and cross-links to the others.

## Structure

```
index.html              Dashboard (master source of the shared <style> + sidebar)
disbursements.html      Module 2  (built)
notifications.html      Module 3  (built)
staff.html              Module 4  (built)
reports.html            Module 5  (built · 89 reports in 10 categories + console)
settings.html           Module 6  (built · 18 configuration sections)
repayments.html         Module 7  (built · 18 collections sections)
applications.html       Module 8  (built · 15 application sections)
clients.html            Module 9  (built · 14 customer sections)
audit.html              Module 10 (built · 18 audit sections)
analytics.html          Module 11 (built · 15 graphing sections)
charts.html             Module 12 (built · 15 analytics sections)
compliance.html         Module 13 (built · 15 compliance sections)
security.html           Module 14 (built · 18 security sections)
website.html            Module 15 (built · 20 website & connection sections)
payments.html           Module 16 (built · 20 payment & connection sections)
deposits.html           Module 17 (built · 18 deposit & withdrawal sections)
transfers.html          Module 18 (built · 20 transfer sections)

assets/                 logo, emblem, favicons (built by make-assets.sh)
login.html              sign-in screen (standalone, not generated)
_brand.css              logo placement, footer, splash, print band
_brand.js               footer, print header, splash, document letterheads
inject_brand.py         injects the brand into every page during a build
make-assets.sh          rebuilds the logo sizes from assets/logo-master.png
_module.css             shared module CSS
_notifications.css      page CSS for Notifications
_staff.css              page CSS for Staff Management
_reports.css            page CSS for Reports
_settings.css           page CSS for System Settings
_repayments.css         page CSS for Repayments & Collections
_applications.css       page CSS for Loan Applications
_customers.css          page CSS for Customers
_audit.css              page CSS for Audit Logs
_analytics.css          page CSS for Graphing & Tabulation
_charts.css             page CSS for Charts & Analytics
_compliance.css         page CSS for Compliance & Intelligence
_website.css            page CSS for Website Management & Connections
_payments.css           page CSS for Methods of Payment Management & Connections
_deposits.css           page CSS for Deposits & Withdrawals Management & Connections
_transfers.css          page CSS for Transfers Management & Connections
_savings.css            page CSS for Savings Management & Connections
_salaries.css           page CSS for Salaries, Expenses & Operating Charges

_compose.py             extracts the shell from index.html and writes a head fragment
build.sh                rebuilds disbursements.html from its partials
build-notifications.sh  rebuilds notifications.html from its partials
build-staff.sh          rebuilds staff.html from its partials
build-reports.sh        rebuilds reports.html from its partials
build-settings.sh       rebuilds settings.html from its partials
build-repayments.sh     rebuilds repayments.html from its partials
build-applications.sh   rebuilds applications.html from its partials
build-clients.sh        rebuilds clients.html from its partials
build-audit.sh          rebuilds audit.html from its partials
build-analytics.sh      rebuilds analytics.html from its partials
build-charts.sh         rebuilds charts.html from its partials
build-compliance.sh     rebuilds compliance.html from its partials
build-security.sh       rebuilds security.html from its partials
build-website.sh        rebuilds website.html from its partials
build-payments.sh       rebuilds payments.html from its partials
build-deposits.sh       rebuilds deposits.html from its partials
build-transfers.sh      rebuilds transfers.html from its partials
build-savings.sh        rebuilds savings.html from its partials
build-salaries.sh       rebuilds salaries.html from its partials
_backnav.html           shared back-navigation script (injected into every page)
_recordsheet.css        record-sheet styles and the small-screen layout rules
_recordsheet.js         labelled record sheets for any modal or register row
inject_backnav.py       post-processes every built page: back navigation, record-sheet CSS and JS

_bodyA/B/C.html  _jsA/B/C*.js          disbursements partials
_nbodyA/B/C.html _njsA/B/C*.js         notifications partials
_sbodyA/B/C.html _sjsA/B/C*/D.js       staff partials
_rbodyA/B.html   _rjsA/B/C*/D*/E.js    reports partials (_rjsE.js = xlsx writer)
_stbodyA/B/C/D.html _stjsA/B/C/D.js  settings partials
_repbodyA/B/C/D.html _repjsA/B/C/D.js  repayments partials
_apbodyA/B/C/D.html _apjsA/B/C/D.js    applications partials
_cubodyA/B/C/D.html _cujsA/B/C/D.js    customers partials
_audbodyA/B/C/D.html _audjsA/B/C/D.js  audit partials
_anbodyA/B/C/D/E.html _anjsA/B/C/D/E.js graphing partials
_chbodyA–E.html _chjsA–G.js  charts & analytics partials
_cobodyA–D.html _cojsA–G.js  compliance & intelligence partials
_sebodyA–E.html _sejsA–G.js  security & protection partials
_wmbodyA–E.html _wmjsA–G.js  website & connections partials
_pmbodyA–E.html _pmjsA–G.js  methods of payment partials
_dwbodyA–E.html _dwjsA–G.js  deposits & withdrawals partials
_trbodyA–E.html _trjsA–H.js  transfers partials
_slbodyA–E.html _sljsA–H.js  salaries & expenses partials

preview-*.png           full-page screenshots at 1280px
```

### Rebuilding a module page

Each built page is assembled from partials so the shared shell stays in one place:

```bash
./build-staff.sh          # staff.html
./build-notifications.sh  # notifications.html
./build-settings.sh       # settings.html
./build-repayments.sh     # repayments.html
./build-applications.sh   # applications.html
./build-clients.sh        # clients.html
./build-audit.sh          # audit.html
./build-analytics.sh      # analytics.html
./build-charts.sh         # charts.html
./build-compliance.sh     # compliance.html
./build-security.sh       # security.html
./build-website.sh        # website.html
./build-payments.sh       # payments.html
./build-deposits.sh       # deposits.html
./build-transfers.sh      # transfers.html
./build-reports.sh        # reports.html
./build.sh                # disbursements.html
```

`_compose.py` pulls the `<style>` block and sidebar out of `index.html`, appends
`_module.css` plus the page CSS (the `clients` slug maps to `_customers.css`), and emits
the head fragment that the build script
concatenates with the body and script partials.

## Data

All data is sample data held in memory — creating staff, changing statuses, assigning
tasks, resetting passwords and processing closures all update the in-page state so the
full lifecycle can be walked end to end. Nothing is sent anywhere and no credentials
are stored or displayed.

### Clipping and crush guards

Two presentation faults are now guard-railed system-wide, because both are
invisible in code review and obvious on a phone:

* **A component may not borrow another component's class.** The performance
  meters (label, bar and hint stacked) used `.meter`, which the shell also uses
  for the thin 6px progress bar. A module that restyled `.meter` only added
  `display:grid`, so the leftover `height:6px` and `overflow:hidden` sliced
  every row to a sliver of text. The stack now uses `.perfm`, defined complete
  in `_brand.css`.
* **No register may crush to one letter per line.** Table headers are
  `white-space:nowrap` (with `!important`), cells break between words, every
  table sits in a `.tblwrap` / `.tbl-wrap` that scrolls sideways, and the page
  itself is `overflow-x:clip`, so a wide register can never push the sidebar
  off the left edge of the screen.

### Delivery-status wording

SMS, email and in-app delivery logs use three states: **Delivered**, **Awaiting provider**
and **Failed**. "Awaiting provider" means the gateway has accepted the message but has not
yet confirmed it — it is not a build or job queue, so the word "Queued" is not used for
delivery anywhere in the interface (KPI tiles, charts, registers, filters, settings panels,
table badges and chart captions all say "Awaiting provider", rendered in the amber/warn
tone). The only remaining "Queued" wording in the portal describes other concepts
(audit-event queueing, pending disbursement releases, rail-side settlement hints, deploy
counts) and is intentionally left as-is.

## Deploying to GitHub Pages

Target repository: `https://github.com/wwwmaryemmanuel01/golden-loan-services`

**Fastest route** — run the helper (it commits, sets the remote and pushes):

```bash
./push-to-github.sh
```

or, with a fine-grained token instead of an interactive login:

```bash
GH_TOKEN=github_pat_xxx ./push-to-github.sh
```

**Manual route**:

```bash
git remote add origin https://github.com/wwwmaryemmanuel01/golden-loan-services.git
git branch -M main
git push -u origin main
```

3. Repository **Settings → Pages → Source: Deploy from a branch → `main` / `/ (root)`**.
4. The portal appears at `https://<user>.github.io/<repo>/` (entry point `index.html`).

The `.nojekyll` file is included so GitHub Pages serves the partials as static files
instead of filtering names that start with an underscore.
