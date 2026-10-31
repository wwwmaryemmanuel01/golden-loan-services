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

_module.css             shared module CSS
_notifications.css      page CSS for Notifications
_staff.css              page CSS for Staff Management
_reports.css            page CSS for Reports
_settings.css           page CSS for System Settings

_compose.py             extracts the shell from index.html and writes a head fragment
build.sh                rebuilds disbursements.html from its partials
build-notifications.sh  rebuilds notifications.html from its partials
build-staff.sh          rebuilds staff.html from its partials
build-reports.sh        rebuilds reports.html from its partials
build-settings.sh       rebuilds settings.html from its partials
_backnav.html           shared back-navigation script (injected into every page)
inject_backnav.py       appends the back-navigation script before </body>

_bodyA/B/C.html  _jsA/B/C*.js          disbursements partials
_nbodyA/B/C.html _njsA/B/C*.js         notifications partials
_sbodyA/B/C.html _sjsA/B/C*/D.js       staff partials
_rbodyA/B.html   _rjsA/B/C*/D*/E.js    reports partials (_rjsE.js = xlsx writer)
_stbodyA/B/C/D.html _stjsA/B/C/D.js  settings partials

preview-*.png           full-page screenshots at 1280px
```

### Rebuilding a module page

Each built page is assembled from partials so the shared shell stays in one place:

```bash
./build-staff.sh          # staff.html
./build-notifications.sh  # notifications.html
./build-settings.sh       # settings.html
./build-reports.sh        # reports.html
./build.sh                # disbursements.html
```

`_compose.py` pulls the `<style>` block and sidebar out of `index.html`, appends
`_module.css` plus the page CSS, and emits the head fragment that the build script
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
