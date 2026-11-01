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
_backnav.html           shared back-navigation script (injected into every page)
inject_backnav.py       appends the back-navigation script before </body>

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
