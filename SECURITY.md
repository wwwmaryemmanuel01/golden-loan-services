# Security policy and operating rules

Golden Financial Services — customer and staff portal.

This document is the written half of the controls shown in the portal's
**Security & Protection** page (`security.html`, sections 19–29). It states what is
implemented, what is only required, and how an incident is handled. It deliberately
does **not** claim a protection is active when it has not been configured and tested.

---

## 1. Scope

| System | Where it runs | In this repository |
|---|---|---|
| Portal (23 pages) | GitHub Pages, static | Yes — generated HTML/CSS/JS |
| Database | Supabase Postgres | No — schema and policies live in Supabase |
| Backend API | Railway | No — separate service |
| Payment providers | Airtel Money, TNM Mpamba, PayChangu, NBS | No |

Only the portal is in this repository. Nothing here can configure Supabase, Railway or
the hosting account, and this document does not pretend otherwise.

## 2. What is actually implemented and verified

| Control | How it is enforced | Verified how |
|---|---|---|
| HTTPS on every page | GitHub Pages serves the site over HTTPS only | Pages build + served URL |
| HTTP → HTTPS redirect | Provided by GitHub Pages | Fetched over `http://` |
| Referrer policy | `<meta name="referrer" content="strict-origin-when-cross-origin">` on all 23 pages | 23/23 pages checked |
| Limited CSP | `<meta http-equiv="Content-Security-Policy" content="object-src 'none'; base-uri 'self'; form-action 'self'">` on all 23 pages | 23/23 pages checked |
| No secrets in the repository | `.gitignore` covers `.env`, `*.pem`, `*.key`, `*.p12`; no credential string in 317 tracked files or in history | Secret scan, and the `security-checks` workflow on every push |
| No privileged key in browser code | No service-role key, JWT or private key in any published page | Secret scan over all published HTML/JS |
| Output escaping | Every generated value passes through the escaping helper; no user string is inserted as HTML | Generator review |
| Dependency surface | No npm packages and no runtime dependencies are shipped | No manifest in the repository |

### Known limitations — stated plainly

* **Response headers cannot be set.** GitHub Pages ignores `_headers` and `_redirects`.
  `X-Frame-Options`, `X-Content-Type-Options`, `Strict-Transport-Security` and a real
  `frame-ancestors` need a proxy or CDN in front of the host. They are **not** active.
* **The CSP is intentionally narrow.** The portal is inline-styled and inline-scripted,
  and no browser is available in the build environment to test a stricter policy. It
  blocks plugin content, `<base>` hijacking and cross-origin form posts — it does not
  block inline script injection. Tighten it only with a browser test matrix.
* **No WAF, no malware scanner, no tested backup restore.** These are gaps, not
  features. Section 28 of the security page lists them as open.
* **Supabase and Railway settings are unverified from here.** RLS, grants, definer
  functions, bucket policies and environment variables must be reviewed by someone
  with access to those accounts.

## 3. Secret handling

1. Secrets live in the hosting environment variables (Railway) — never in this
   repository, never in a page, never in a build log.
2. `.env` files are ignored. If an example file is ever added it is `.env.example`
   with placeholder values only.
3. Production, staging and development use different credentials. Production data is
   never copied into development.
4. A suspected exposure is treated as an incident: revoke, rotate, then investigate.
5. The service-role key is server-side only. If it is ever found in front-end code,
   treat it as compromised and rotate immediately.

## 4. Incident response

| Stage | Action | Owner | Limit |
|---|---|---|---|
| Identify | Triage the alert, assign severity, open a case file | Security lead | 1 hour |
| Contain | Revoke every session on the account; rotate the credentials it could reach; disable the affected route | Administrator | 1 hour |
| Preserve | Export logs and affected rows to an evidence location, hash the export | Security lead | before cleanup |
| Investigate | Establish scope: which customers, what data categories, whether money moved | Security lead | 24 hours |
| Recover | Restore or redeploy from a verified clean source into a clean environment | Backend lead | 24 hours |
| Verify | Smoke test, repeat the three-account RLS test, take a fresh backup | Security lead | before return to service |
| Notify | Affected customers, payment providers, and any authority the law requires | Owner | per obligation |
| Close | Cause, corrective actions with owners and dates, blameless review | Owner | 5 days |

The first action in every case is **revoke and rotate** — containment before
investigation, evidence before cleanup.

## 5. Change and deployment rules

1. No change to GitHub, Supabase or Railway settings is made without the owner's
   authorisation.
2. Portal changes are made in the generator or partial and rebuilt — a 300 KB page is
   never hand-edited.
3. Every change is checked before it is committed: 23 pages are parsed, section and
   panel counts are asserted, script errors and broken links must be zero.
4. Rollback is a redeploy of the previous reviewed commit. A live build is never
   patched in place.
5. A database restore goes into a clean database first. Nothing is pointed back at
   traffic until the smoke check passes.

## 6. What this policy cannot promise

Antivirus does not prevent ransomware. A backup that has never been restored is not a
control. A firewall does not stop an insider with valid credentials. The real defences
are least privilege, independent and tested backups, monitoring that someone reads, and
a written procedure that is followed under pressure.

## 7. Review

Reviewed quarterly, and after any change to hosting, database policies, staff roles or
payment providers. The security page's coverage section (§19) and open-alert list
(§28.3) are updated at the same time.

## 8. Reporting a problem

Report suspected vulnerabilities or incidents privately to the owner account that
administers this repository. Do not open a public issue, and do not include customer
data, credentials or exploit details in a public channel.
