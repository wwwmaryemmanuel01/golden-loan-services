# GOLDEN FINANCIAL SERVICES — Admin Portal

A single-page-per-module administration system for a loan services business.
Plain HTML + CSS + vanilla JS — no build step, no dependencies, no external requests
(fonts, icons and charts are inline SVG, so it works fully offline).

## Modules

| Module | File | Sections |
|---|---|---|
| Dashboard | `index.html` | 13 |
| Disbursements | `disbursements.html` | 18 |
| Notifications | `notifications.html` | 18 |
| Staff Management | `staff.html` | 18 |

Open `index.html` and use the sidebar to move between modules — every module shares
the same shell (sidebar, topbar, design tokens) and cross-links to the others.

## Structure

```
index.html              Dashboard (master source of the shared <style> + sidebar)
disbursements.html      Module 2  (built)
notifications.html      Module 3  (built)
staff.html              Module 4  (built)

_module.css             shared module CSS
_notifications.css      page CSS for Notifications
_staff.css              page CSS for Staff Management

_compose.py             extracts the shell from index.html and writes a head fragment
build.sh                rebuilds disbursements.html from its partials
build-notifications.sh  rebuilds notifications.html from its partials
build-staff.sh          rebuilds staff.html from its partials

_bodyA/B/C.html  _jsA/B/C*.js          disbursements partials
_nbodyA/B/C.html _njsA/B/C*.js         notifications partials
_sbodyA/B/C.html _sjsA/B/C*/D.js       staff partials

preview-*.png           full-page screenshots at 1280px
```

### Rebuilding a module page

Each built page is assembled from partials so the shared shell stays in one place:

```bash
./build-staff.sh          # staff.html
./build-notifications.sh  # notifications.html
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
