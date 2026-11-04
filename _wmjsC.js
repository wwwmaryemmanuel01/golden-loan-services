/* =====================================================================
   GOLDEN FINANCIAL SERVICES · WEBSITE MANAGEMENT & CONNECTIONS (3/7)
   Data universe — the website, its hosting, backend, Supabase project,
   every integration, form, media asset, deployment and change record.
   ===================================================================== */
<script>

/* ---------------- system configuration ---------------- */
const WM_SET_DEFAULTS = {
  publicUrl: 'https://goldenloan.mw',
  adminUrl: 'https://portal.goldenloan.mw',
  apiBase: 'https://api.goldenloan.mw/v1',
  supabaseUrl: 'https://glsvc-prod.supabase.co',
  env: 'Production',
  version: '2.14.3',
  build: '2026.10.28-a41f9c2',
  timeout: 20,
  retries: 3,
  healthInterval: 5,
  uptimeTarget: 99.9,
  cacheTtl: 300,
  monitoring: '24 × 7 — PagerDuty + email',
  maintenance: false,
  alertEmail: true,
  alertSms: true,
  autoRollback: true
};
const WM_SET = Object.assign({}, WM_SET_DEFAULTS);

/* ---------------- public website ---------------- */
const WM_SITE = {
  name: 'Golden Financial Services',
  tagline: 'Loans that move at the speed of your business',
  logo: 'GFS monogram',
  logoVariant: 'Gold on charcoal',
  theme: 'Charcoal & gold',
  accent: '#C9A227',
  font: 'Inter / system stack',
  header: 'Sticky, two-tier',
  footer: 'Four columns',
  published: true,
  publishedOn: '2026-10-28',
  version: '2.14.3',
  pagesLive: 11,
  visitors30d: 18420
};
const WM_THEMES = [
  {name: 'Charcoal & gold', accent: '#C9A227', bg: '#14161C', note: 'The house default'},
  {name: 'Daylight', accent: '#B58C1B', bg: '#FFFFFF', note: 'High contrast for branch screens'},
  {name: 'Mzuzu green', accent: '#1E9E6A', bg: '#F7FBF8', note: 'Northern region campaign'}
];
const WM_LOGOS = ['GFS monogram', 'GFS wordmark', 'GFS crest', 'Golden coin mark'];
const WM_SECTIONS = [
  {name: 'Hero and tagline', on: true, order: 1, note: 'Headline, sub-copy and the two calls to action'},
  {name: 'Trust strip', on: true, order: 2, note: 'Licence number, RBM registration and years trading'},
  {name: 'Loan products', on: true, order: 3, note: 'Six product cards pulled from the product table'},
  {name: 'Loan calculator', on: true, order: 4, note: 'Live calculator wired to /api/calculator'},
  {name: 'How it works', on: true, order: 5, note: 'Four steps, from application to payout'},
  {name: 'Testimonials', on: true, order: 6, note: 'Three customer stories, names shortened'},
  {name: 'Branch locations', on: true, order: 7, note: 'Lilongwe, Blantyre, Mzuzu and Zomba with hours'},
  {name: 'Newsletter sign-up', on: false, order: 8, note: 'Paused while the mailing list is rebuilt'}
];
const WM_NAV = [
  {label: 'Home', path: '/', order: 1, visible: true},
  {label: 'Loan products', path: '/products', order: 2, visible: true},
  {label: 'About us', path: '/about', order: 3, visible: true},
  {label: 'Calculator', path: '/calculator', order: 4, visible: true},
  {label: 'Blog', path: '/blog', order: 5, visible: true},
  {label: 'Contact', path: '/contact', order: 6, visible: true},
  {label: 'Careers', path: '/careers', order: 7, visible: false}
];
const WM_CONTACT = {
  phone: '+265 1 771 200',
  whatsapp: '+265 999 771 200',
  email: 'hello@goldenloan.mw',
  support: 'support@goldenloan.mw',
  address: 'Golden House, Area 3, Lilongwe',
  postal: 'P.O. Box 30211, Lilongwe 3'
};
const WM_OFFICES = [
  {branch: 'Lilongwe (head office)', address: 'Golden House, Area 3, Lilongwe', phone: '+265 1 771 200', hours: 'Mon–Fri 08:00–17:00 · Sat 08:00–12:00', staff: 14, lane: 'Website', region: 'Lilongwe', status: 'Open'},
  {branch: 'Blantyre', address: 'Kanjedza House, Victoria Avenue', phone: '+265 1 823 410', hours: 'Mon–Fri 08:00–17:00 · Sat 08:00–12:00', staff: 9, lane: 'Website', region: 'Blantyre', status: 'Open'},
  {branch: 'Mzuzu', address: 'City Centre, Orton Chirwa Avenue', phone: '+265 1 312 088', hours: 'Mon–Fri 08:00–16:30', staff: 6, lane: 'Website', region: 'Mzuzu', status: 'Open'},
  {branch: 'Zomba', address: 'Mango House, Zomba Market Road', phone: '+265 1 525 130', hours: 'Mon–Fri 08:00–16:30 · Sat 08:00–11:30', staff: 5, lane: 'Website', region: 'Zomba', status: 'Closed for renovation'}
];
const WM_SOCIAL = [
  {channel: 'Facebook', handle: '@goldenfinancialmw', url: '/go/facebook', linked: true, followers: 12480, lane: 'Website', status: 'Linked'},
  {channel: 'X', handle: '@goldenloanmw', url: '/go/x', linked: true, followers: 3180, lane: 'Website', status: 'Linked'},
  {channel: 'LinkedIn', handle: 'Golden Financial Services', url: '/go/linkedin', linked: true, followers: 2410, lane: 'Website', status: 'Linked'},
  {channel: 'Instagram', handle: '@goldenloanmw', url: '/go/instagram', linked: true, followers: 5620, lane: 'Website', status: 'Linked'},
  {channel: 'WhatsApp Business', handle: '+265 999 771 200', url: '/go/whatsapp', linked: false, followers: 0, lane: 'Website', status: 'Not linked'}
];

/* ---------------- content ---------------- */
const CONTENT = [
  {key: 'about', title: 'About Us', type: 'Page', status: 'Published', updated: addDays(TODAY, -9), by: 'STF-009', words: 620, lane: 'Website', severity: 'Low', owner: 'STF-009', region: 'Lilongwe'},
  {key: 'services', title: 'Our Services', type: 'Page', status: 'Published', updated: addDays(TODAY, -12), by: 'STF-009', words: 480, lane: 'Website', severity: 'Low', owner: 'STF-009', region: 'Lilongwe'},
  {key: 'products', title: 'Loan Products and Terms', type: 'Page', status: 'Published', updated: addDays(TODAY, -2), by: 'STF-003', words: 910, lane: 'Website', severity: 'Medium', owner: 'STF-003', region: 'Lilongwe'},
  {key: 'rates', title: 'Interest Rates and Fees', type: 'Page', status: 'Review', updated: addDays(TODAY, -1), by: 'STF-003', words: 540, lane: 'Website', severity: 'High', owner: 'STF-003', region: 'Lilongwe'},
  {key: 'faq', title: 'Frequently Asked Questions', type: 'Page', status: 'Published', updated: addDays(TODAY, -18), by: 'STF-005', words: 1240, lane: 'Website', severity: 'Low', owner: 'STF-005', region: 'Lilongwe'},
  {key: 'announcements', title: 'Announcements and Notices', type: 'Feed', status: 'Published', updated: TODAY, by: 'STF-009', words: 210, lane: 'Website', severity: 'Medium', owner: 'STF-009', region: 'Lilongwe'},
  {key: 'blog', title: 'Blog and News', type: 'Feed', status: 'Published', updated: addDays(TODAY, -4), by: 'STF-005', words: 3150, lane: 'Website', severity: 'Low', owner: 'STF-005', region: 'Blantyre'},
  {key: 'terms', title: 'Terms & Conditions', type: 'Legal', status: 'Published', updated: addDays(TODAY, -64), by: 'STF-004', words: 2800, lane: 'Website', severity: 'High', owner: 'STF-004', region: 'Lilongwe'},
  {key: 'privacy', title: 'Privacy Policy', type: 'Legal', status: 'Published', updated: addDays(TODAY, -64), by: 'STF-004', words: 2210, lane: 'Website', severity: 'High', owner: 'STF-004', region: 'Lilongwe'},
  {key: 'help', title: 'Help and Support', type: 'Page', status: 'Draft', updated: addDays(TODAY, -5), by: 'STF-005', words: 760, lane: 'Website', severity: 'Low', owner: 'STF-005', region: 'Mzuzu'}
];
const CONTENT_HISTORY = [
  {when: TODAY + ' 08:14', item: 'Loan Products and Terms', action: 'Published', version: 'v14', by: 'STF-003'},
  {when: addDays(TODAY, -1) + ' 16:40', item: 'Interest Rates and Fees', action: 'Submitted for review', version: 'v9', by: 'STF-003'},
  {when: addDays(TODAY, -2) + ' 11:20', item: 'Announcements and Notices', action: 'Published', version: 'v31', by: 'STF-009'},
  {when: addDays(TODAY, -4) + ' 09:05', item: 'Blog and News', action: 'Published', version: 'v52', by: 'STF-005'},
  {when: addDays(TODAY, -5) + ' 14:12', item: 'Help and Support', action: 'Saved as draft', version: 'v3', by: 'STF-005'},
  {when: addDays(TODAY, -9) + ' 10:30', item: 'About Us', action: 'Published', version: 'v11', by: 'STF-009'},
  {when: addDays(TODAY, -12) + ' 15:48', item: 'Our Services', action: 'Published', version: 'v8', by: 'STF-009'},
  {when: addDays(TODAY, -64) + ' 08:00', item: 'Terms & Conditions', action: 'Published', version: 'v6', by: 'STF-004'}
];

/* ---------------- pages ---------------- */
const PAGES = [
  {path: '/', title: 'Home', visibility: 'Public', access: 'Everyone', order: 1, status: 'Live', edits: 14, updated: addDays(TODAY, -2), seo: 'Golden Financial Services — business loans in Malawi', lane: 'Website', severity: 'Low', owner: 'STF-009', region: 'Lilongwe'},
  {path: '/products', title: 'Loan products', visibility: 'Public', access: 'Everyone', order: 2, status: 'Live', edits: 9, updated: addDays(TODAY, -2), seo: 'Business loans, salary loans and asset finance', lane: 'Website', severity: 'Low', owner: 'STF-003', region: 'Lilongwe'},
  {path: '/calculator', title: 'Loan calculator', visibility: 'Public', access: 'Everyone', order: 3, status: 'Live', edits: 5, updated: addDays(TODAY, -7), seo: 'Work out your monthly repayment in MWK', lane: 'Website', severity: 'Low', owner: 'STF-003', region: 'Lilongwe'},
  {path: '/apply', title: 'Apply for a loan', visibility: 'Public', access: 'Everyone', order: 4, status: 'Live', edits: 11, updated: addDays(TODAY, -3), seo: 'Apply online in eight minutes', lane: 'Website', severity: 'High', owner: 'STF-001', region: 'Lilongwe'},
  {path: '/about', title: 'About us', visibility: 'Public', access: 'Everyone', order: 5, status: 'Live', edits: 6, updated: addDays(TODAY, -9), seo: 'Licensed lender since 2011', lane: 'Website', severity: 'Low', owner: 'STF-009', region: 'Lilongwe'},
  {path: '/branches', title: 'Branches', visibility: 'Public', access: 'Everyone', order: 6, status: 'Live', edits: 4, updated: addDays(TODAY, -16), seo: 'Lilongwe, Blantyre, Mzuzu and Zomba', lane: 'Website', severity: 'Low', owner: 'STF-009', region: 'Lilongwe'},
  {path: '/blog', title: 'Blog', visibility: 'Public', access: 'Everyone', order: 7, status: 'Live', edits: 22, updated: addDays(TODAY, -4), seo: 'Money and business notes from the team', lane: 'Website', severity: 'Low', owner: 'STF-005', region: 'Blantyre'},
  {path: '/contact', title: 'Contact', visibility: 'Public', access: 'Everyone', order: 8, status: 'Live', edits: 3, updated: addDays(TODAY, -21), seo: 'Talk to a lending officer today', lane: 'Website', severity: 'Low', owner: 'STF-009', region: 'Lilongwe'},
  {path: '/faq', title: 'FAQ', visibility: 'Public', access: 'Everyone', order: 9, status: 'Live', edits: 7, updated: addDays(TODAY, -18), seo: 'Answers to the questions we are asked most', lane: 'Website', severity: 'Low', owner: 'STF-005', region: 'Lilongwe'},
  {path: '/legal/terms', title: 'Terms and conditions', visibility: 'Public', access: 'Everyone', order: 10, status: 'Live', edits: 2, updated: addDays(TODAY, -64), seo: 'Terms of business', lane: 'Website', severity: 'Low', owner: 'STF-004', region: 'Lilongwe'},
  {path: '/legal/privacy', title: 'Privacy policy', visibility: 'Public', access: 'Everyone', order: 11, status: 'Live', edits: 2, updated: addDays(TODAY, -64), seo: 'How we handle your data', lane: 'Website', severity: 'Low', owner: 'STF-004', region: 'Lilongwe'},
  {path: '/careers', title: 'Careers', visibility: 'Hidden', access: 'Everyone', order: 12, status: 'Draft', edits: 5, updated: addDays(TODAY, -2), seo: 'Work with us', lane: 'Website', severity: 'Low', owner: 'STF-009', region: 'Lilongwe'},
  {path: '/staff', title: 'Staff portal entry', visibility: 'Private', access: 'Staff only', order: 13, status: 'Live', edits: 1, updated: addDays(TODAY, -40), seo: 'Staff sign-in', lane: 'Auth', severity: 'High', owner: 'STF-001', region: 'Lilongwe'},
  {path: '/preview', title: 'Preview shell', visibility: 'Private', access: 'Admins', order: 14, status: 'Live', edits: 1, updated: addDays(TODAY, -33), seo: 'Internal preview', lane: 'Website', severity: 'Low', owner: 'STF-001', region: 'Lilongwe'}
];
const LINKS = [
  {from: '/', to: '/products', label: 'View products', status: 'OK', checked: TODAY, lane: 'Website', severity: 'Low', owner: 'STF-009', region: 'Lilongwe'},
  {from: '/', to: '/calculator', label: 'Try the calculator', status: 'OK', checked: TODAY, lane: 'Website', severity: 'Low', owner: 'STF-009', region: 'Lilongwe'},
  {from: '/products', to: '/apply', label: 'Apply now', status: 'OK', checked: TODAY, lane: 'Website', severity: 'Low', owner: 'STF-003', region: 'Lilongwe'},
  {from: '/about', to: '/branches', label: 'Find a branch', status: 'OK', checked: TODAY, lane: 'Website', severity: 'Low', owner: 'STF-009', region: 'Lilongwe'},
  {from: '/blog', to: '/blog/how-to-read-a-loan-agreement', label: 'Read the post', status: 'OK', checked: TODAY, lane: 'Website', severity: 'Low', owner: 'STF-005', region: 'Blantyre'},
  {from: '/contact', to: '/careers', label: 'Careers', status: 'Broken', checked: TODAY, lane: 'Website', severity: 'High', owner: 'STF-009', region: 'Lilongwe'},
  {from: '/faq', to: '/help/repayments', label: 'Repayment help', status: 'Broken', checked: TODAY, lane: 'Website', severity: 'High', owner: 'STF-005', region: 'Lilongwe'},
  {from: '/', to: '/legal/terms', label: 'Terms', status: 'OK', checked: TODAY, lane: 'Website', severity: 'Low', owner: 'STF-004', region: 'Lilongwe'},
  {from: '/', to: '/legal/privacy', label: 'Privacy', status: 'OK', checked: TODAY, lane: 'Website', severity: 'Low', owner: 'STF-004', region: 'Lilongwe'},
  {from: '/branches', to: '/staff', label: 'Staff sign-in', status: 'OK', checked: TODAY, lane: 'Auth', severity: 'Medium', owner: 'STF-001', region: 'Lilongwe'}
];
const PAGE_ERRORS = [
  {when: TODAY + ' 07:41', path: '/apply', code: '422', detail: 'Application form rejected a phone number in local format', count: 4, status: 'Open', severity: 'High', lane: 'Website', owner: 'STF-001', region: 'Lilongwe'},
  {when: addDays(TODAY, -1) + ' 19:02', path: '/blog', code: '404', detail: 'Two inbound links point at a deleted post', count: 12, status: 'Open', severity: 'Medium', lane: 'Website', owner: 'STF-005', region: 'Blantyre'},
  {when: addDays(TODAY, -2) + ' 12:15', path: '/careers', code: '503', detail: 'Draft route served a maintenance response', count: 1, status: 'Resolved', severity: 'Low', lane: 'Website', owner: 'STF-009', region: 'Lilongwe'},
  {when: addDays(TODAY, -3) + ' 08:26', path: '/calculator', code: '500', detail: 'Calculator API returned a timeout as a server error', count: 3, status: 'Open', severity: 'High', lane: 'Website', owner: 'STF-001', region: 'Lilongwe'},
  {when: addDays(TODAY, -4) + ' 16:44', path: '/', code: '200', detail: 'Slow first paint on a 3G connection (4.8 s)', count: 9, status: 'Monitoring', severity: 'Medium', lane: 'Website', owner: 'STF-009', region: 'Lilongwe'},
  {when: addDays(TODAY, -6) + ' 10:10', path: '/contact', code: '429', detail: 'Rate limit hit by one form bot', count: 27, status: 'Resolved', severity: 'Low', lane: 'Website', owner: 'STF-001', region: 'Lilongwe'}
];

/* ---------------- domain, hosting, deployments ---------------- */
const DOMAIN = {
  name: 'goldenloan.mw', registrar: 'MalawiNet', registered: '2023-04-12', expires: '2027-04-12',
  nameservers: 'dns1.p01.nsone.net · dns2.p01.nsone.net', dnssec: 'Enabled', autoRenew: 'On',
  contacts: 'Domains (STF-001) · Registrant (Golden Financial Services)'
};
const DNS = [
  {record: '@', type: 'A', value: '75.2.60.5', ttl: 3600, status: 'Resolved', lane: 'Website', severity: 'High', owner: 'STF-001', region: 'Global'},
  {record: 'www', type: 'CNAME', value: 'gfs-site.netlify.app', ttl: 3600, status: 'Resolved', lane: 'Website', severity: 'High', owner: 'STF-001', region: 'Global'},
  {record: 'portal', type: 'CNAME', value: 'gfs-admin.netlify.app', ttl: 3600, status: 'Resolved', lane: 'Website', severity: 'High', owner: 'STF-001', region: 'Global'},
  {record: 'api', type: 'CNAME', value: 'gls-api.fly.dev', ttl: 300, status: 'Resolved', lane: 'Backend', severity: 'Critical', owner: 'STF-001', region: 'Global'},
  {record: '_dmarc', type: 'TXT', value: 'v=DMARC1; p=quarantine; rua=mailto:dmarc@goldenloan.mw', ttl: 3600, status: 'Resolved', lane: 'Integrations', severity: 'Medium', owner: 'STF-001', region: 'Global'},
  {record: 'status', type: 'CNAME', value: 'stats.uptimerobot.com', ttl: 1800, status: 'Pending', lane: 'Website', severity: 'Low', owner: 'STF-001', region: 'Global'}
];
const SSL_CERT = {issuer: 'Let’s Encrypt R3', validFrom: '2026-08-12', validTo: '2026-11-10', daysLeft: 66, protocol: 'TLS 1.3', hsts: 'On (max-age 31536000)', autoRenew: 'On', lastRenew: '2026-08-12'};
const HOSTING = {provider: 'Netlify', plan: 'Pro', region: 'Frankfurt (eu-central-1)', edge: 'Netlify Edge · 3 POPs in Africa', storage: '1.2 GB of 100 GB', bandwidth: '412 GB of 1 TB', buildMinutes: '180 of 3000', sso: 'Enabled', publishedAt: '2026-10-28 08:12'};
const DEPLOYMENTS = [
  {id: 'DEP-2412', version: '2.14.3', env: 'Production', when: '2026-10-28 08:12', status: 'Success', duration: '2 m 41 s', by: 'STF-001', commit: 'a41f9c2'},
  {id: 'DEP-2411', version: '2.14.2', env: 'Production', when: '2026-10-24 17:05', status: 'Success', duration: '2 m 18 s', by: 'STF-001', commit: '9de11b4'},
  {id: 'DEP-2410', version: '2.14.1', env: 'Production', when: '2026-10-21 09:40', status: 'Success', duration: '2 m 33 s', by: 'STF-009', commit: '77ac0d1'},
  {id: 'DEP-2409', version: '2.14.0', env: 'Production', when: '2026-10-18 14:22', status: 'Failed', duration: '48 s', by: 'STF-001', commit: 'c02e7f8'},
  {id: 'DEP-2408', version: '2.14.0', env: 'Staging', when: '2026-10-18 13:10', status: 'Success', duration: '2 m 04 s', by: 'STF-001', commit: 'c02e7f8'},
  {id: 'DEP-2407', version: '2.13.6', env: 'Production', when: '2026-10-12 10:02', status: 'Success', duration: '2 m 26 s', by: 'STF-009', commit: '5b19aa3'},
  {id: 'DEP-2406', version: '2.13.5', env: 'Production', when: '2026-10-06 16:35', status: 'Success', duration: '2 m 12 s', by: 'STF-001', commit: '1f4d7c9'},
  {id: 'DEP-2405', version: '2.13.4', env: 'Production', when: '2026-09-29 08:55', status: 'Success', duration: '2 m 39 s', by: 'STF-001', commit: 'b7e2c40'},
  {id: 'DEP-2404', version: '2.13.3', env: 'Production', when: '2026-09-22 11:18', status: 'Success', duration: '2 m 08 s', by: 'STF-009', commit: 'e8a0f61'},
  {id: 'DEP-2403', version: '2.13.2', env: 'Production', when: '2026-09-15 09:44', status: 'Success', duration: '2 m 21 s', by: 'STF-001', commit: 'd3c9b12'}
];
const AVAILABILITY = [
  {date: '2026-10-30', uptime: 99.98, downMin: 1, checks: 288, incidents: 0, status: 'Pass', lane: 'Website', region: 'Lilongwe'},
  {date: '2026-10-29', uptime: 100, downMin: 0, checks: 288, incidents: 0, status: 'Pass', lane: 'Website', region: 'Lilongwe'},
  {date: '2026-10-28', uptime: 99.65, downMin: 15, checks: 288, incidents: 1, status: 'Degraded', lane: 'Website', region: 'Lilongwe'},
  {date: '2026-10-27', uptime: 100, downMin: 0, checks: 288, incidents: 0, status: 'Pass', lane: 'Website', region: 'Lilongwe'},
  {date: '2026-10-26', uptime: 100, downMin: 0, checks: 288, incidents: 0, status: 'Pass', lane: 'Website', region: 'Lilongwe'},
  {date: '2026-10-25', uptime: 99.86, downMin: 6, checks: 288, incidents: 1, status: 'Degraded', lane: 'Website', region: 'Lilongwe'},
  {date: '2026-10-24', uptime: 100, downMin: 0, checks: 288, incidents: 0, status: 'Pass', lane: 'Website', region: 'Lilongwe'},
  {date: '2026-10-23', uptime: 100, downMin: 0, checks: 288, incidents: 0, status: 'Pass', lane: 'Website', region: 'Lilongwe'},
  {date: '2026-10-22', uptime: 99.93, downMin: 3, checks: 288, incidents: 1, status: 'Pass', lane: 'Website', region: 'Lilongwe'},
  {date: '2026-10-21', uptime: 100, downMin: 0, checks: 288, incidents: 0, status: 'Pass', lane: 'Website', region: 'Lilongwe'},
  {date: '2026-10-20', uptime: 100, downMin: 0, checks: 288, incidents: 0, status: 'Pass', lane: 'Website', region: 'Lilongwe'},
  {date: '2026-10-19', uptime: 99.72, downMin: 12, checks: 288, incidents: 1, status: 'Degraded', lane: 'Website', region: 'Lilongwe'},
  {date: '2026-10-18', uptime: 100, downMin: 0, checks: 288, incidents: 0, status: 'Pass', lane: 'Website', region: 'Lilongwe'},
  {date: '2026-10-17', uptime: 100, downMin: 0, checks: 288, incidents: 0, status: 'Pass', lane: 'Website', region: 'Lilongwe'}
];

/* ---------------- backend ---------------- */
const BACKEND = {
  name: 'gls-api', runtime: 'Node 20 LTS', region: 'fra·fly', instances: 3, cpu: 34, memory: 61,
  restarts30d: 2, lastRestart: addDays(TODAY, -6) + ' 02:14', uptime: 99.94, version: 'v2.14.3',
  healthUrl: 'https://api.goldenloan.mw/v1/healthz', deployStrategy: 'Rolling, 3 instances',
  lastDeploy: '2026-10-28 08:12'
};
const SERVER_HEALTH = [
  {check: 'Process responding', value: '/healthz 200 in 61 ms', status: 'Pass', lane: 'Backend', severity: 'Critical', owner: 'STF-001', region: 'Frankfurt'},
  {check: 'CPU across instances', value: '34% average, 58% peak', status: 'Pass', lane: 'Backend', severity: 'High', owner: 'STF-001', region: 'Frankfurt'},
  {check: 'Memory across instances', value: '61% average of 2 GB', status: 'Pass', lane: 'Backend', severity: 'High', owner: 'STF-001', region: 'Frankfurt'},
  {check: 'Database pool', value: '18 of 40 connections in use', status: 'Pass', lane: 'Backend', severity: 'High', owner: 'STF-001', region: 'Frankfurt'},
  {check: 'Queue backlog', value: '42 jobs, oldest 3 minutes', status: 'Pass', lane: 'Backend', severity: 'Medium', owner: 'STF-001', region: 'Frankfurt'},
  {check: 'Disk on the build volume', value: '62% of 20 GB', status: 'Pass', lane: 'Backend', severity: 'Medium', owner: 'STF-001', region: 'Frankfurt'},
  {check: 'TLS between edge and origin', value: 'TLS 1.3, certificate valid', status: 'Pass', lane: 'Backend', severity: 'High', owner: 'STF-001', region: 'Frankfurt'},
  {check: 'Error rate last hour', value: '0.42% — under the 1% budget', status: 'Pass', lane: 'Backend', severity: 'Medium', owner: 'STF-001', region: 'Frankfurt'}
];
const API_ENDPOINTS = [
  {path: '/healthz', method: 'GET', group: 'Platform', auth: 'None', p95: 61, calls: 8640, errors: 0, status: 'Healthy', lane: 'Backend', severity: 'Low', owner: 'STF-001', region: 'Frankfurt'},
  {path: '/auth/v1/token', method: 'POST', group: 'Auth', auth: 'API key', p95: 158, calls: 6840, errors: 22, status: 'Healthy', lane: 'Auth', severity: 'Critical', owner: 'STF-001', region: 'Frankfurt'},
  {path: '/customers', method: 'GET', group: 'Customers', auth: 'JWT', p95: 142, calls: 5120, errors: 9, status: 'Healthy', lane: 'Backend', severity: 'High', owner: 'STF-003', region: 'Frankfurt'},
  {path: '/customers/:id/kyc', method: 'PUT', group: 'Customers', auth: 'JWT + role', p95: 196, calls: 880, errors: 3, status: 'Healthy', lane: 'Backend', severity: 'High', owner: 'STF-003', region: 'Frankfurt'},
  {path: '/applications', method: 'POST', group: 'Loans', auth: 'JWT', p95: 238, calls: 1460, errors: 18, status: 'Degraded', lane: 'Backend', severity: 'High', owner: 'STF-002', region: 'Frankfurt'},
  {path: '/applications/:id/decision', method: 'POST', group: 'Loans', auth: 'JWT + role', p95: 284, calls: 640, errors: 4, status: 'Healthy', lane: 'Backend', severity: 'High', owner: 'STF-002', region: 'Frankfurt'},
  {path: '/loans', method: 'GET', group: 'Loans', auth: 'JWT', p95: 176, calls: 6210, errors: 7, status: 'Healthy', lane: 'Backend', severity: 'High', owner: 'STF-003', region: 'Frankfurt'},
  {path: '/disbursements', method: 'POST', group: 'Money', auth: 'JWT + role', p95: 420, calls: 210, errors: 2, status: 'Slow', lane: 'Backend', severity: 'Critical', owner: 'STF-001', region: 'Frankfurt'},
  {path: '/payments', method: 'POST', group: 'Money', auth: 'JWT', p95: 312, calls: 3480, errors: 14, status: 'Healthy', lane: 'Backend', severity: 'Critical', owner: 'STF-001', region: 'Frankfurt'},
  {path: '/payments/:id/reverse', method: 'POST', group: 'Money', auth: 'JWT + role', p95: 366, calls: 96, errors: 1, status: 'Healthy', lane: 'Backend', severity: 'Critical', owner: 'STF-001', region: 'Frankfurt'},
  {path: '/calculator', method: 'POST', group: 'Platform', auth: 'None', p95: 88, calls: 9260, errors: 31, status: 'Degraded', lane: 'Website', severity: 'Medium', owner: 'STF-009', region: 'Frankfurt'},
  {path: '/contact', method: 'POST', group: 'Platform', auth: 'None', p95: 104, calls: 640, errors: 0, status: 'Healthy', lane: 'Website', severity: 'Medium', owner: 'STF-009', region: 'Frankfurt'},
  {path: '/integrations/mobile-money/callback', method: 'POST', group: 'Money', auth: 'HMAC', p95: 128, calls: 3820, errors: 88, status: 'Failing', lane: 'Integrations', severity: 'Critical', owner: 'STF-001', region: 'Frankfurt'},
  {path: '/files/upload-url', method: 'POST', group: 'Storage', auth: 'JWT', p95: 132, calls: 1240, errors: 5, status: 'Healthy', lane: 'Storage', severity: 'Medium', owner: 'STF-001', region: 'Frankfurt'}
];
const SERVER_ERRORS = [
  {when: TODAY + ' 07:12', endpoint: '/integrations/mobile-money/callback', code: '502', message: 'TNM Mpamba returned an HTML error page', count: 44, severity: 'Critical', status: 'Open', lane: 'Integrations', owner: 'STF-001', region: 'Frankfurt'},
  {when: TODAY + ' 06:48', endpoint: '/calculator', code: '504', message: 'Upstream calculator timed out after 5 s', count: 12, severity: 'High', status: 'Open', lane: 'Website', owner: 'STF-001', region: 'Frankfurt'},
  {when: addDays(TODAY, -1) + ' 21:30', endpoint: '/applications', code: '422', message: 'Validation rejected a phone number in local format', count: 7, severity: 'Medium', status: 'Open', lane: 'Backend', owner: 'STF-002', region: 'Frankfurt'},
  {when: addDays(TODAY, -1) + ' 15:02', endpoint: '/payments', code: '409', message: 'Duplicate idempotency key replayed', count: 3, severity: 'Medium', status: 'Resolved', lane: 'Backend', owner: 'STF-001', region: 'Frankfurt'},
  {when: addDays(TODAY, -2) + ' 09:26', endpoint: '/auth/v1/token', code: '429', message: 'Rate limit reached for one address', count: 18, severity: 'Low', status: 'Resolved', lane: 'Auth', owner: 'STF-001', region: 'Frankfurt'},
  {when: addDays(TODAY, -3) + ' 18:44', endpoint: '/files/upload-url', code: '413', message: 'Upload larger than the 5 MB policy', count: 5, severity: 'Low', status: 'Resolved', lane: 'Storage', owner: 'STF-001', region: 'Frankfurt'}
];
const TRAFFIC = [
  {hour: '00:00', requests: 1420, errors: 6, avgMs: 118},
  {hour: '03:00', requests: 980, errors: 3, avgMs: 104},
  {hour: '06:00', requests: 3120, errors: 14, avgMs: 132},
  {hour: '09:00', requests: 8640, errors: 41, avgMs: 168},
  {hour: '12:00', requests: 7420, errors: 28, avgMs: 152},
  {hour: '15:00', requests: 6980, errors: 22, avgMs: 146},
  {hour: '18:00', requests: 4180, errors: 12, avgMs: 128},
  {hour: '21:00', requests: 2260, errors: 8, avgMs: 116}
];
const RESTARTS = [
  {when: addDays(TODAY, -6) + ' 02:14', reason: 'Memory pressure on instance 2', by: 'STF-001', duration: '38 s', result: 'Healthy'},
  {when: addDays(TODAY, -18) + ' 03:40', reason: 'Routine platform patch', by: 'STF-001', duration: '1 m 12 s', result: 'Healthy'},
  {when: addDays(TODAY, -34) + ' 02:05', reason: 'Release 2.13.1 rollout', by: 'STF-001', duration: '2 m 26 s', result: 'Healthy'}
];

/* ---------------- supabase ---------------- */
const SUPA = {
  project: 'glsvc-prod', url: WM_SET.supabaseUrl, region: 'eu-central-1 · Frankfurt',
  engine: 'PostgreSQL 15.6', tier: 'Pro', connections: '18 of 60', size: '1.8 GB',
  schemaVersion: '2026.10.28.1', migrationsApplied: 41, lastMigration: addDays(TODAY, -2),
  pitr: '7 days', dailyBackup: '03:00 CAT'
};
const DB_HEALTH = [
  {check: 'Database reachable', value: 'SELECT 1 in 12 ms', status: 'Pass', lane: 'Supabase', severity: 'Critical', owner: 'STF-001', region: 'Frankfurt'},
  {check: 'Connection pool', value: '18 of 60 in use', status: 'Pass', lane: 'Supabase', severity: 'High', owner: 'STF-001', region: 'Frankfurt'},
  {check: 'Replication lag', value: '0.4 s behind the read replica', status: 'Pass', lane: 'Supabase', severity: 'Medium', owner: 'STF-001', region: 'Frankfurt'},
  {check: 'Disk usage', value: '1.8 GB of 8 GB', status: 'Pass', lane: 'Supabase', severity: 'Medium', owner: 'STF-001', region: 'Frankfurt'},
  {check: 'Slow query budget', value: '3 queries over 500 ms today', status: 'Review', lane: 'Supabase', severity: 'Medium', owner: 'STF-001', region: 'Frankfurt'},
  {check: 'Row-level security coverage', value: '11 of 12 public tables', status: 'Fail', lane: 'Supabase', severity: 'Critical', owner: 'STF-001', region: 'Frankfurt'},
  {check: 'Point-in-time recovery', value: 'Enabled, 7-day window', status: 'Pass', lane: 'Supabase', severity: 'High', owner: 'STF-001', region: 'Frankfurt'},
  {check: 'Extensions', value: 'pgcrypto, pg_stat_statements, pgaudit', status: 'Pass', lane: 'Supabase', severity: 'Low', owner: 'STF-001', region: 'Frankfurt'}
];
const TABLES = [
  {table: 'customers', rows: 60, size: '3.1 MB', rls: 'Enabled', note: 'Branch + role scoped', lastAnalyze: addDays(TODAY, -1), lane: 'Supabase', severity: 'High', owner: 'STF-001', region: 'Frankfurt'},
  {table: 'loans', rows: 77, size: '2.4 MB', rls: 'Enabled', note: 'Officer + branch scoped', lastAnalyze: addDays(TODAY, -1), lane: 'Supabase', severity: 'High', owner: 'STF-001', region: 'Frankfurt'},
  {table: 'payments', rows: 402, size: '4.8 MB', rls: 'Enabled', note: 'Branch scoped', lastAnalyze: addDays(TODAY, -1), lane: 'Supabase', severity: 'High', owner: 'STF-001', region: 'Frankfurt'},
  {table: 'applications', rows: 128, size: '2.9 MB', rls: 'Enabled', note: 'Officer + branch scoped', lastAnalyze: addDays(TODAY, -2), lane: 'Supabase', severity: 'High', owner: 'STF-001', region: 'Frankfurt'},
  {table: 'staff', rows: 15, size: '512 KB', rls: 'Enabled', note: 'Admin read, self read', lastAnalyze: addDays(TODAY, -2), lane: 'Supabase', severity: 'High', owner: 'STF-001', region: 'Frankfurt'},
  {table: 'documents', rows: 214, size: '612 KB', rls: 'Enabled', note: 'Owner + compliance', lastAnalyze: addDays(TODAY, -3), lane: 'Supabase', severity: 'Medium', owner: 'STF-001', region: 'Frankfurt'},
  {table: 'content_pages', rows: 14, size: '96 KB', rls: 'Enabled', note: 'Public read, editor write', lastAnalyze: addDays(TODAY, -2), lane: 'Supabase', severity: 'Medium', owner: 'STF-009', region: 'Frankfurt'},
  {table: 'guide_content', rows: 62, size: '288 KB', rls: 'Enabled', note: 'Public read, editor write', lastAnalyze: addDays(TODAY, -4), lane: 'Supabase', severity: 'Medium', owner: 'STF-009', region: 'Frankfurt'},
  {table: 'field_mappings', rows: 138, size: '144 KB', rls: 'Enabled', note: 'Public read, editor write', lastAnalyze: addDays(TODAY, -5), lane: 'Supabase', severity: 'Low', owner: 'STF-009', region: 'Frankfurt'},
  {table: 'intake_records', rows: 96, size: '212 KB', rls: 'Enabled', note: 'Officer scoped', lastAnalyze: addDays(TODAY, -1), lane: 'Supabase', severity: 'Medium', owner: 'STF-001', region: 'Frankfurt'},
  {table: 'audit_events', rows: 8120, size: '38 MB', rls: 'Enabled', note: 'Insert-only, admin read', lastAnalyze: addDays(TODAY, -1), lane: 'Supabase', severity: 'High', owner: 'STF-001', region: 'Frankfurt'},
  {table: 'settings', rows: 42, size: '48 KB', rls: 'Disabled', note: 'Any authenticated user can read', lastAnalyze: addDays(TODAY, -9), lane: 'Supabase', severity: 'Critical', owner: 'STF-001', region: 'Frankfurt'}
];
const MIGRATIONS = [
  {id: '20261028_01', name: 'add content_pages and guide_content', when: '2026-10-28 07:44', status: 'Applied', by: 'STF-001', ms: 420, lane: 'Supabase', severity: 'Medium', owner: 'STF-001', region: 'Frankfurt'},
  {id: '20261021_02', name: 'index payments(branch, received_at)', when: '2026-10-21 09:12', status: 'Applied', by: 'STF-001', ms: 1180, lane: 'Supabase', severity: 'Low', owner: 'STF-001', region: 'Frankfurt'},
  {id: '20261014_01', name: 'tighten customers RLS policy', when: '2026-10-14 18:26', status: 'Applied', by: 'STF-001', ms: 260, lane: 'Supabase', severity: 'High', owner: 'STF-001', region: 'Frankfurt'},
  {id: '20261002_03', name: 'add audit_events insert-only trigger', when: '2026-10-02 11:40', status: 'Applied', by: 'STF-001', ms: 540, lane: 'Supabase', severity: 'High', owner: 'STF-001', region: 'Frankfurt'},
  {id: '20260923_01', name: 'backfill loan_products.rates', when: '2026-09-23 08:05', status: 'Applied', by: 'STF-003', ms: 2240, lane: 'Supabase', severity: 'Medium', owner: 'STF-003', region: 'Frankfurt'},
  {id: '20260911_02', name: 'enable pgaudit on role changes', when: '2026-09-11 14:58', status: 'Applied', by: 'STF-001', ms: 380, lane: 'Supabase', severity: 'Medium', owner: 'STF-001', region: 'Frankfurt'},
  {id: '20260830_01', name: 'create intake_records', when: '2026-08-30 10:22', status: 'Applied', by: 'STF-001', ms: 610, lane: 'Supabase', severity: 'Low', owner: 'STF-001', region: 'Frankfurt'},
  {id: '20261101_01', name: 'enable RLS on settings', when: '2026-11-01 06:00', status: 'Pending', by: 'STF-001', ms: 0, lane: 'Supabase', severity: 'Critical', owner: 'STF-001', region: 'Frankfurt'}
];
const DB_ERRORS = [
  {when: TODAY + ' 06:51', code: '57014', message: 'Canceled statement: statement timeout for /loans?status=overdue', count: 3, severity: 'High', status: 'Open', lane: 'Supabase', owner: 'STF-001', region: 'Frankfurt'},
  {when: addDays(TODAY, -1) + ' 22:08', code: '23505', message: 'Duplicate key on payments.idempotency_key', count: 2, severity: 'Medium', status: 'Resolved', lane: 'Supabase', owner: 'STF-001', region: 'Frankfurt'},
  {when: addDays(TODAY, -2) + ' 13:37', code: '42501', message: 'Permission denied writing settings without an admin role', count: 6, severity: 'Low', status: 'Resolved', lane: 'Supabase', owner: 'STF-001', region: 'Frankfurt'},
  {when: addDays(TODAY, -3) + ' 10:14', code: '40001', message: 'Serialization failure during a payout batch', count: 1, severity: 'Medium', status: 'Resolved', lane: 'Supabase', owner: 'STF-001', region: 'Frankfurt'},
  {when: addDays(TODAY, -5) + ' 16:29', code: '53300', message: 'Too many connections — pool exhausted for 40 s', count: 1, severity: 'High', status: 'Resolved', lane: 'Supabase', owner: 'STF-001', region: 'Frankfurt'},
  {when: addDays(TODAY, -8) + ' 09:02', code: '22001', message: 'Value too long for national_id on an import', count: 4, severity: 'Low', status: 'Resolved', lane: 'Supabase', owner: 'STF-001', region: 'Frankfurt'}
];
const DB_FUNCS = [
  {name: 'handle_new_customer', kind: 'Trigger', invoker: 'Definer', risk: 'Medium', calls: 60, status: 'Healthy', lane: 'Supabase', severity: 'Medium', owner: 'STF-001', region: 'Frankfurt'},
  {name: 'recalculate_arrears', kind: 'Function', invoker: 'Invoker', risk: 'Low', calls: 288, status: 'Healthy', lane: 'Supabase', severity: 'Low', owner: 'STF-001', region: 'Frankfurt'},
  {name: 'verify_staff', kind: 'Edge function', invoker: 'Service role', risk: 'High', calls: 940, status: 'Healthy', lane: 'Auth', severity: 'High', owner: 'STF-001', region: 'Frankfurt'},
  {name: 'send_otp', kind: 'Edge function', invoker: 'Service role', risk: 'High', calls: 1520, status: 'Degraded', lane: 'Auth', severity: 'High', owner: 'STF-001', region: 'Frankfurt'},
  {name: 'log_audit_event', kind: 'Trigger', invoker: 'Definer', risk: 'Medium', calls: 8120, status: 'Healthy', lane: 'Supabase', severity: 'Medium', owner: 'STF-001', region: 'Frankfurt'},
  {name: 'purge_expired_documents', kind: 'Scheduled', invoker: 'Definer', risk: 'Medium', calls: 30, status: 'Healthy', lane: 'Storage', severity: 'Medium', owner: 'STF-001', region: 'Frankfurt'}
];
const QUERY_PERF = [
  {query: 'loan portfolio with arrears', calls: 6210, avgMs: 68, p95: 176, rows: 1240, lane: 'Supabase', status: 'Healthy', severity: 'Medium', owner: 'STF-001'},
  {query: 'customer statement window', calls: 3480, avgMs: 52, p95: 142, rows: 620, lane: 'Supabase', status: 'Healthy', severity: 'Medium', owner: 'STF-001'},
  {query: 'payments by branch and month', calls: 2140, avgMs: 74, p95: 188, rows: 402, lane: 'Supabase', status: 'Healthy', severity: 'Medium', owner: 'STF-001'},
  {query: 'overdue instalment sweep', calls: 288, avgMs: 940, p95: 2210, rows: 4320, lane: 'Supabase', status: 'Slow', severity: 'High', owner: 'STF-001'},
  {query: 'audit event search', calls: 640, avgMs: 310, p95: 720, rows: 8120, lane: 'Supabase', status: 'Slow', severity: 'Medium', owner: 'STF-001'},
  {query: 'content page render join', calls: 18400, avgMs: 12, p95: 38, rows: 14, lane: 'Website', status: 'Healthy', severity: 'Low', owner: 'STF-009'},
  {query: 'guide content search', calls: 4200, avgMs: 24, p95: 62, rows: 62, lane: 'Website', status: 'Healthy', severity: 'Low', owner: 'STF-009'},
  {query: 'document lookup by customer', calls: 1240, avgMs: 44, p95: 118, rows: 214, lane: 'Storage', status: 'Healthy', severity: 'Medium', owner: 'STF-001'},
  {query: 'settings read on boot', calls: 8640, avgMs: 8, p95: 22, rows: 42, lane: 'Supabase', status: 'Healthy', severity: 'Low', owner: 'STF-001'},
  {query: 'payout batch reconciliation', calls: 210, avgMs: 380, p95: 890, rows: 96, lane: 'Supabase', status: 'Degraded', severity: 'High', owner: 'STF-001'}
];

/* ---------------- integrations ---------------- */
const INTEGRATIONS = [
  {name: 'Supabase Auth', kind: 'Auth', provider: 'Supabase', status: 'Connected', lastCheck: TODAY + ' 08:10', latency: 88, uptime: 99.98, creds: 'Valid', lane: 'Auth', severity: 'High', owner: 'STF-001', region: 'Ireland'},
  {name: 'Customer portal API', kind: 'REST API', provider: 'Internal gls-api', status: 'Connected', lastCheck: TODAY + ' 08:10', latency: 118, uptime: 99.94, creds: 'Valid', lane: 'Backend', severity: 'High', owner: 'STF-001', region: 'Frankfurt'},
  {name: 'Resend email', kind: 'Email', provider: 'Resend', status: 'Connected', lastCheck: TODAY + ' 08:09', latency: 204, uptime: 99.9, creds: 'Valid', lane: 'Integrations', severity: 'Medium', owner: 'STF-001', region: 'EU'},
  {name: 'Africa’s Talking SMS', kind: 'SMS', provider: 'Africa’s Talking', status: 'Degraded', lastCheck: TODAY + ' 08:08', latency: 740, uptime: 99.2, creds: 'Expiring', lane: 'Integrations', severity: 'High', owner: 'STF-005', region: 'Malawi'},
  {name: 'Airtel Money collections', kind: 'Payments', provider: 'Airtel Malawi', status: 'Connected', lastCheck: TODAY + ' 08:10', latency: 312, uptime: 99.87, creds: 'Valid', lane: 'Integrations', severity: 'High', owner: 'STF-001', region: 'Malawi'},
  {name: 'TNM Mpamba collections', kind: 'Payments', provider: 'TNM', status: 'Failing', lastCheck: TODAY + ' 08:07', latency: 0, uptime: 97.4, creds: 'Expired', lane: 'Integrations', severity: 'Critical', owner: 'STF-001', region: 'Malawi'},
  {name: 'Supabase Storage', kind: 'Storage', provider: 'Supabase', status: 'Connected', lastCheck: TODAY + ' 08:10', latency: 128, uptime: 99.95, creds: 'Valid', lane: 'Storage', severity: 'Medium', owner: 'STF-001', region: 'Ireland'},
  {name: 'Sentry error tracking', kind: 'Monitoring', provider: 'Sentry', status: 'Connected', lastCheck: TODAY + ' 08:05', latency: 96, uptime: 99.99, creds: 'Valid', lane: 'Integrations', severity: 'Low', owner: 'STF-001', region: 'EU'},
  {name: 'Google Analytics 4', kind: 'Analytics', provider: 'Google', status: 'Connected', lastCheck: TODAY + ' 08:00', latency: 142, uptime: 99.96, creds: 'Valid', lane: 'Website', severity: 'Low', owner: 'STF-009', region: 'Global'},
  {name: 'UptimeRobot monitors', kind: 'Monitoring', provider: 'UptimeRobot', status: 'Connected', lastCheck: TODAY + ' 08:10', latency: 74, uptime: 99.99, creds: 'Valid', lane: 'Website', severity: 'Low', owner: 'STF-001', region: 'Global'}
];
const API_CREDS = [
  {name: 'Supabase service role', service: 'Supabase', scope: 'Server only', rotated: addDays(TODAY, -34), expires: addDays(TODAY, 56), state: 'Valid', lane: 'Supabase', severity: 'Critical', owner: 'STF-001', region: 'Ireland'},
  {name: 'Resend API key', service: 'Resend email', scope: 'Send only', rotated: addDays(TODAY, -58), expires: addDays(TODAY, 32), state: 'Valid', lane: 'Integrations', severity: 'Medium', owner: 'STF-001', region: 'EU'},
  {name: 'Africa’s Talking key', service: 'Africa’s Talking SMS', scope: 'Send only', rotated: addDays(TODAY, -84), expires: addDays(TODAY, 6), state: 'Expiring', lane: 'Integrations', severity: 'High', owner: 'STF-005', region: 'Malawi'},
  {name: 'Airtel Money client id', service: 'Airtel Money', scope: 'Collect only', rotated: addDays(TODAY, -72), expires: addDays(TODAY, 108), state: 'Valid', lane: 'Integrations', severity: 'High', owner: 'STF-001', region: 'Malawi'},
  {name: 'TNM Mpamba key', service: 'TNM Mpamba', scope: 'Collect only', rotated: addDays(TODAY, -96), expires: addDays(TODAY, -3), state: 'Expired', lane: 'Integrations', severity: 'Critical', owner: 'STF-001', region: 'Malawi'},
  {name: 'Sentry DSN', service: 'Sentry', scope: 'Client (write)', rotated: addDays(TODAY, -200), expires: addDays(TODAY, 165), state: 'Valid', lane: 'Integrations', severity: 'Low', owner: 'STF-001', region: 'EU'},
  {name: 'Netlify deploy token', service: 'Netlify', scope: 'Deploy', rotated: addDays(TODAY, -120), expires: addDays(TODAY, 245), state: 'Valid', lane: 'Website', severity: 'High', owner: 'STF-001', region: 'Global'}
];
const INTEGRATION_TESTS = [
  {service: 'Supabase Auth', test: 'Issue and validate a staff token', when: TODAY + ' 08:11', result: 'Pass', ms: 96, lane: 'Auth', severity: 'High', owner: 'STF-001', region: 'Ireland'},
  {service: 'Customer portal API', test: 'Fetch a loan statement', when: TODAY + ' 08:11', result: 'Pass', ms: 118, lane: 'Backend', severity: 'High', owner: 'STF-001', region: 'Frankfurt'},
  {service: 'Resend email', test: 'Send a template to the test inbox', when: TODAY + ' 08:09', result: 'Pass', ms: 204, lane: 'Integrations', severity: 'Medium', owner: 'STF-001', region: 'EU'},
  {service: 'Africa’s Talking SMS', test: 'Send one SMS to +265 999 000 111', when: TODAY + ' 08:08', result: 'Slow', ms: 1480, lane: 'Integrations', severity: 'High', owner: 'STF-005', region: 'Malawi'},
  {service: 'Airtel Money', test: 'Initiate a MWK 1 collection', when: TODAY + ' 08:10', result: 'Pass', ms: 312, lane: 'Integrations', severity: 'High', owner: 'STF-001', region: 'Malawi'},
  {service: 'TNM Mpamba', test: 'Initiate a MWK 1 collection', when: TODAY + ' 08:07', result: 'Fail', ms: 0, lane: 'Integrations', severity: 'Critical', owner: 'STF-001', region: 'Malawi'},
  {service: 'Supabase Storage', test: 'Upload and read one 40 KB file', when: TODAY + ' 08:10', result: 'Pass', ms: 128, lane: 'Storage', severity: 'Medium', owner: 'STF-001', region: 'Ireland'},
  {service: 'Sentry', test: 'Send a synthetic event', when: TODAY + ' 08:05', result: 'Pass', ms: 96, lane: 'Integrations', severity: 'Low', owner: 'STF-001', region: 'EU'}
];

/* ---------------- authentication connections ---------------- */
const AUTH_SERVICES = [
  {name: 'Staff login', kind: 'Sign-in', status: 'Healthy', p95: 212, calls24h: 1180, errors: 6, note: 'Email, password and TOTP', lane: 'Auth', severity: 'Critical', owner: 'STF-001', region: 'Lilongwe'},
  {name: 'Customer login', kind: 'Sign-in', status: 'Degraded', p95: 198, calls24h: 2410, errors: 11, note: 'Phone number and one-time code', lane: 'Auth', severity: 'Critical', owner: 'STF-001', region: 'Lilongwe'},
  {name: 'Registration service', kind: 'Sign-up', status: 'Healthy', p95: 340, calls24h: 186, errors: 2, note: 'Creates the customer and KYC shell', lane: 'Auth', severity: 'High', owner: 'STF-003', region: 'Lilongwe'},
  {name: 'Password recovery', kind: 'Recovery', status: 'Healthy', p95: 244, calls24h: 320, errors: 2, note: 'Email link and SMS code', lane: 'Auth', severity: 'High', owner: 'STF-001', region: 'Lilongwe'},
  {name: 'Staff authentication functions', kind: 'Edge function', status: 'Healthy', p95: 176, calls24h: 940, errors: 3, note: 'verify-staff, reset-staff-password', lane: 'Auth', severity: 'High', owner: 'STF-001', region: 'Lilongwe'},
  {name: 'Customer authentication functions', kind: 'Edge function', status: 'Degraded', p95: 268, calls24h: 1520, errors: 9, note: 'otp-send, otp-verify, session-refresh', lane: 'Auth', severity: 'High', owner: 'STF-001', region: 'Lilongwe'},
  {name: 'Session validation', kind: 'Middleware', status: 'Healthy', p95: 24, calls24h: 18400, errors: 1, note: 'Runs on every authenticated request', lane: 'Auth', severity: 'Medium', owner: 'STF-001', region: 'Lilongwe'}
];
const AUTH_ERRORS = [
  {when: TODAY + ' 07:58', service: 'Customer login', code: 'otp_expired', detail: 'Code expired before entry (5 min window)', count: 6, severity: 'Medium', status: 'Open', lane: 'Auth', owner: 'STF-001', region: 'Lilongwe'},
  {when: TODAY + ' 07:20', service: 'Customer authentication functions', code: 'otp_send_failed', detail: 'SMS gateway 503 from Africa’s Talking', count: 9, severity: 'High', status: 'Open', lane: 'Auth', owner: 'STF-001', region: 'Lilongwe'},
  {when: addDays(TODAY, -1) + ' 19:12', service: 'Staff login', code: 'mfa_failed', detail: 'TOTP rejected three times, account locked', count: 3, severity: 'Medium', status: 'Resolved', lane: 'Auth', owner: 'STF-001', region: 'Lilongwe'},
  {when: addDays(TODAY, -1) + ' 11:40', service: 'Session validation', code: 'token_revoked', detail: 'Session revoked after a password reset', count: 4, severity: 'Low', status: 'Resolved', lane: 'Auth', owner: 'STF-001', region: 'Lilongwe'},
  {when: addDays(TODAY, -2) + ' 16:05', service: 'Registration service', code: 'phone_taken', detail: 'Duplicate phone number on a new registration', count: 2, severity: 'Low', status: 'Resolved', lane: 'Auth', owner: 'STF-003', region: 'Lilongwe'},
  {when: addDays(TODAY, -3) + ' 08:22', service: 'Customer login', code: 'rate_limited', detail: 'Nine attempts from one address in an hour', count: 9, severity: 'Medium', status: 'Monitoring', lane: 'Auth', owner: 'STF-001', region: 'Lilongwe'},
  {when: addDays(TODAY, -4) + ' 21:48', service: 'Password recovery', code: 'link_used', detail: 'Single-use reset link opened twice', count: 1, severity: 'Low', status: 'Resolved', lane: 'Auth', owner: 'STF-001', region: 'Lilongwe'},
  {when: addDays(TODAY, -5) + ' 07:15', service: 'Staff authentication functions', code: 'edge_timeout', detail: 'reset-staff-password timed out at 10 s', count: 2, severity: 'Medium', status: 'Resolved', lane: 'Auth', owner: 'STF-001', region: 'Lilongwe'}
];
const AUTH_DAILY = [
  {day: '24 Oct', staff: 96, customer: 210, failed: 7},
  {day: '25 Oct', staff: 88, customer: 198, failed: 9},
  {day: '26 Oct', staff: 102, customer: 226, failed: 6},
  {day: '27 Oct', staff: 110, customer: 244, failed: 11},
  {day: '28 Oct', staff: 98, customer: 232, failed: 8},
  {day: '29 Oct', staff: 104, customer: 251, failed: 12},
  {day: '30 Oct', staff: 76, customer: 188, failed: 4}
];

/* ---------------- frontend integration ---------------- */
const FE_CONNECTIONS = [
  {name: 'Public website → backend', origin: 'https://goldenloan.mw', target: 'api.goldenloan.mw/v1', status: 'Connected', p95: 168, requests: 38420, errors: 74, note: 'Content and forms read', lane: 'Website', severity: 'Critical', owner: 'STF-001', region: 'Lilongwe'},
  {name: 'Admin portal → backend', origin: 'https://portal.goldenloan.mw', target: 'api.goldenloan.mw/v1', status: 'Connected', p95: 142, requests: 21840, errors: 31, note: 'Staff operations', lane: 'Backend', severity: 'Critical', owner: 'STF-001', region: 'Lilongwe'},
  {name: 'Customer portal → backend', origin: 'https://my.goldenloan.mw', target: 'api.goldenloan.mw/v1', status: 'Degraded', p95: 302, requests: 12480, errors: 118, note: 'Statements and repayments', lane: 'Auth', severity: 'High', owner: 'STF-001', region: 'Lilongwe'}
];
const FE_CONFIG = [
  {key: 'NEXT_PUBLIC_API_URL', value: 'https://api.goldenloan.mw/v1', env: 'Production', status: 'Set', lane: 'Website', severity: 'High', owner: 'STF-001', region: 'Lilongwe'},
  {key: 'NEXT_PUBLIC_SUPABASE_URL', value: 'https://glsvc-prod.supabase.co', env: 'Production', status: 'Set', lane: 'Website', severity: 'High', owner: 'STF-001', region: 'Lilongwe'},
  {key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', value: 'eyJhbGciOi… (safe to expose)', env: 'Production', status: 'Set', lane: 'Website', severity: 'Medium', owner: 'STF-001', region: 'Lilongwe'},
  {key: 'NEXT_PUBLIC_SENTRY_DSN', value: 'https://…ingest.sentry.io/4501', env: 'Production', status: 'Set', lane: 'Website', severity: 'Low', owner: 'STF-001', region: 'Lilongwe'},
  {key: 'NEXT_PUBLIC_API_TIMEOUT_MS', value: '20000', env: 'Production', status: 'Set', lane: 'Website', severity: 'Medium', owner: 'STF-001', region: 'Lilongwe'},
  {key: 'NEXT_PUBLIC_ENABLE_CALCULATOR', value: 'true', env: 'Production', status: 'Set', lane: 'Website', severity: 'Low', owner: 'STF-009', region: 'Lilongwe'}
];
const VALIDATION_CHECKS = [
  {check: 'Request payload schema', scope: 'All write routes', status: 'Pass', detail: 'Zod schema on 38 routes, unknown keys dropped', lane: 'Backend', severity: 'High', owner: 'STF-001', region: 'Frankfurt'},
  {check: 'Response shape matches the client contract', scope: '12 client calls', status: 'Pass', detail: 'Checked nightly against the OpenAPI document', lane: 'Backend', severity: 'Medium', owner: 'STF-001', region: 'Frankfurt'},
  {check: 'Nullability handling', scope: 'Customer and loan objects', status: 'Review', detail: 'Three optional fields rendered blank on the apply form', lane: 'Website', severity: 'Medium', owner: 'STF-009', region: 'Lilongwe'},
  {check: 'Numeric precision (MWK)', scope: 'Money fields', status: 'Pass', detail: 'Integer tambala, no float arithmetic in the client', lane: 'Backend', severity: 'High', owner: 'STF-001', region: 'Frankfurt'},
  {check: 'Pagination contract', scope: 'List endpoints', status: 'Pass', detail: 'cursor + limit honoured on all six list routes', lane: 'Backend', severity: 'Low', owner: 'STF-001', region: 'Frankfurt'},
  {check: 'Error envelope consistency', scope: 'All routes', status: 'Review', detail: 'Two legacy routes return a bare string', lane: 'Backend', severity: 'Medium', owner: 'STF-001', region: 'Frankfurt'}
];
const TIMEOUTS = [
  {route: '/applications', p50: 168, p95: 238, limit: 20000, breaches: 12, status: 'Watch', lane: 'Backend', severity: 'High', owner: 'STF-001', region: 'Frankfurt'},
  {route: '/calculator', p50: 44, p95: 88, limit: 20000, breaches: 31, status: 'Watch', lane: 'Website', severity: 'Medium', owner: 'STF-009', region: 'Frankfurt'},
  {route: '/disbursements', p50: 280, p95: 420, limit: 20000, breaches: 2, status: 'Watch', lane: 'Backend', severity: 'Medium', owner: 'STF-001', region: 'Frankfurt'},
  {route: '/payments', p50: 190, p95: 312, limit: 20000, breaches: 4, status: 'Watch', lane: 'Backend', severity: 'Medium', owner: 'STF-001', region: 'Frankfurt'},
  {route: '/customers', p50: 92, p95: 142, limit: 20000, breaches: 0, status: 'OK', lane: 'Backend', severity: 'Low', owner: 'STF-001', region: 'Frankfurt'},
  {route: '/loans', p50: 104, p95: 176, limit: 20000, breaches: 0, status: 'OK', lane: 'Backend', severity: 'Low', owner: 'STF-001', region: 'Frankfurt'},
  {route: '/files/upload-url', p50: 82, p95: 132, limit: 20000, breaches: 0, status: 'OK', lane: 'Storage', severity: 'Low', owner: 'STF-001', region: 'Frankfurt'},
  {route: '/integrations/mobile-money/callback', p50: 68, p95: 128, limit: 10000, breaches: 88, status: 'Breaching', lane: 'Integrations', severity: 'Critical', owner: 'STF-001', region: 'Frankfurt'}
];
const FAILED_REQUESTS = [
  {when: TODAY + ' 07:12', origin: 'Public website', path: '/api/payments/callback', code: '502', count: 44, status: 'Open', lane: 'Integrations', severity: 'Critical', owner: 'STF-001', region: 'Lilongwe'},
  {when: TODAY + ' 06:48', origin: 'Public website', path: '/api/calculator', code: '504', count: 12, status: 'Open', lane: 'Website', severity: 'High', owner: 'STF-009', region: 'Lilongwe'},
  {when: addDays(TODAY, -1) + ' 18:20', origin: 'Customer portal', path: '/api/loans?status=overdue', code: '57014', count: 31, status: 'Open', lane: 'Auth', severity: 'High', owner: 'STF-001', region: 'Lilongwe'},
  {when: addDays(TODAY, -1) + ' 12:04', origin: 'Admin portal', path: '/api/customers/:id/kyc', code: '422', count: 6, status: 'Resolved', lane: 'Backend', severity: 'Medium', owner: 'STF-003', region: 'Lilongwe'},
  {when: addDays(TODAY, -2) + ' 09:40', origin: 'Public website', path: '/api/applications', code: '429', count: 18, status: 'Resolved', lane: 'Backend', severity: 'Low', owner: 'STF-001', region: 'Lilongwe'},
  {when: addDays(TODAY, -3) + ' 15:32', origin: 'Customer portal', path: '/api/payments', code: '409', count: 3, status: 'Resolved', lane: 'Backend', severity: 'Low', owner: 'STF-001', region: 'Lilongwe'}
];
const FE_ERRORS = [
  {when: TODAY + ' 07:44', page: '/apply', error: 'Script error while reading the contact phone field', count: 4, severity: 'High', status: 'Open', lane: 'Website', owner: 'STF-009', region: 'Lilongwe'},
  {when: TODAY + ' 06:58', page: '/calculator', error: 'Chunk load failed for calculator widget', count: 9, severity: 'High', status: 'Open', lane: 'Website', owner: 'STF-009', region: 'Lilongwe'},
  {when: addDays(TODAY, -1) + ' 20:10', page: '/blog', error: 'Hydration mismatch on the post list', count: 2, severity: 'Medium', status: 'Monitoring', lane: 'Website', owner: 'STF-005', region: 'Blantyre'},
  {when: addDays(TODAY, -2) + ' 11:25', page: '/', error: 'Console warning: missing alt text on two images', count: 1, severity: 'Low', status: 'Resolved', lane: 'Website', owner: 'STF-009', region: 'Lilongwe'},
  {when: addDays(TODAY, -3) + ' 14:50', page: '/products', error: 'Intl.NumberFormat fallback used for MWK', count: 3, severity: 'Low', status: 'Resolved', lane: 'Website', owner: 'STF-003', region: 'Lilongwe'},
  {when: addDays(TODAY, -4) + ' 09:15', page: '/portal/statements', error: 'Fetch aborted after 20 s timeout', count: 7, severity: 'Medium', status: 'Open', lane: 'Auth', owner: 'STF-001', region: 'Lilongwe'}
];

/* ---------------- forms ---------------- */
const FORMS = [
  {name: 'Contact form', endpoint: '/api/contact', submissions: 186, last: TODAY + ' 08:02', validation: 'Server + client', status: 'Healthy', errors: 0, lane: 'Website', severity: 'Medium', owner: 'STF-009', region: 'Lilongwe'},
  {name: 'Customer registration form', endpoint: '/api/register', submissions: 64, last: TODAY + ' 07:36', validation: 'Server + client', status: 'Healthy', errors: 2, lane: 'Auth', severity: 'High', owner: 'STF-003', region: 'Lilongwe'},
  {name: 'Loan application form', endpoint: '/api/applications', submissions: 128, last: TODAY + ' 07:12', validation: 'Server + client', status: 'Degraded', errors: 18, lane: 'Backend', severity: 'Critical', owner: 'STF-002', region: 'Lilongwe'},
  {name: 'Loan calculator data connection', endpoint: '/api/calculator', submissions: 9260, last: TODAY + ' 08:14', validation: 'Client only', status: 'Degraded', errors: 31, lane: 'Website', severity: 'Medium', owner: 'STF-009', region: 'Lilongwe'},
  {name: 'Repayment submission', endpoint: '/api/payments', submissions: 402, last: TODAY + ' 08:08', validation: 'Server + client', status: 'Healthy', errors: 4, lane: 'Backend', severity: 'High', owner: 'STF-001', region: 'Lilongwe'}
];
const FORM_DAILY = [
  {day: '24 Oct', contact: 12, registration: 5, application: 9, repayment: 31},
  {day: '25 Oct', contact: 8, registration: 3, application: 6, repayment: 24},
  {day: '26 Oct', contact: 15, registration: 7, application: 11, repayment: 38},
  {day: '27 Oct', contact: 14, registration: 6, application: 10, repayment: 42},
  {day: '28 Oct', contact: 11, registration: 4, application: 8, repayment: 36},
  {day: '29 Oct', contact: 13, registration: 6, application: 12, repayment: 40},
  {day: '30 Oct', contact: 9, registration: 3, application: 7, repayment: 28}
];
const FORM_ERRORS = [
  {when: TODAY + ' 07:12', form: 'Loan application form', field: 'phone', error: 'Local format rejected — 0999… instead of +265 999…', count: 11, severity: 'High', status: 'Open', lane: 'Backend', owner: 'STF-002', region: 'Lilongwe'},
  {when: TODAY + ' 06:40', form: 'Loan calculator data connection', field: 'term_months', error: 'Timeout after 5 s (upstream calculator)', count: 9, severity: 'High', status: 'Open', lane: 'Website', owner: 'STF-009', region: 'Lilongwe'},
  {when: addDays(TODAY, -1) + ' 16:20', form: 'Customer registration form', field: 'national_id', error: 'Duplicate national ID detected', count: 2, severity: 'Medium', status: 'Resolved', lane: 'Auth', owner: 'STF-003', region: 'Lilongwe'},
  {when: addDays(TODAY, -1) + ' 10:05', form: 'Contact form', field: 'message', error: 'Spam score above threshold, entry quarantined', count: 3, severity: 'Low', status: 'Resolved', lane: 'Website', owner: 'STF-009', region: 'Lilongwe'},
  {when: addDays(TODAY, -2) + ' 13:44', form: 'Repayment submission', field: 'reference', error: 'Airtel Money reference already used', count: 1, severity: 'Medium', status: 'Resolved', lane: 'Backend', owner: 'STF-001', region: 'Lilongwe'},
  {when: addDays(TODAY, -3) + ' 09:12', form: 'Loan application form', field: 'amount', error: 'Requested amount below the MK 50,000 minimum', count: 4, severity: 'Low', status: 'Resolved', lane: 'Backend', owner: 'STF-002', region: 'Lilongwe'}
];

/* ---------------- media ---------------- */
const IMAGES = [
  {name: 'hero-borrowers.jpg', path: '/images/hero-borrowers.jpg', size: '412 KB', optimized: true, usedOn: '/', alt: 'Two business owners in a Lilongwe market', lane: 'Storage', severity: 'Low', owner: 'STF-009', region: 'Lilongwe'},
  {name: 'branch-lilongwe.jpg', path: '/images/branch-lilongwe.jpg', size: '286 KB', optimized: true, usedOn: '/branches', alt: 'Golden House, Area 3', lane: 'Storage', severity: 'Low', owner: 'STF-009', region: 'Lilongwe'},
  {name: 'branch-blantyre.jpg', path: '/images/branch-blantyre.jpg', size: '312 KB', optimized: true, usedOn: '/branches', alt: 'Kanjedza House on Victoria Avenue', lane: 'Storage', severity: 'Low', owner: 'STF-009', region: 'Blantyre'},
  {name: 'branch-mzuzu.jpg', path: '/images/branch-mzuzu.jpg', size: '1.9 MB', optimized: false, usedOn: '/branches', alt: 'Mzuzu city centre branch', lane: 'Storage', severity: 'Medium', owner: 'STF-009', region: 'Mzuzu'},
  {name: 'branch-zomba.jpg', path: '/images/branch-zomba.jpg', size: '2.4 MB', optimized: false, usedOn: '/branches', alt: 'Mango House, Zomba', lane: 'Storage', severity: 'Medium', owner: 'STF-009', region: 'Zomba'},
  {name: 'calculator-illustration.svg', path: '/images/calculator.svg', size: '18 KB', optimized: true, usedOn: '/calculator', alt: 'Repayment illustration', lane: 'Storage', severity: 'Low', owner: 'STF-003', region: 'Lilongwe'},
  {name: 'team-photo.jpg', path: '/images/team.jpg', size: '640 KB', optimized: true, usedOn: '/about', alt: 'The credit team at head office', lane: 'Storage', severity: 'Low', owner: 'STF-009', region: 'Lilongwe'},
  {name: 'blog-cover-agreement.jpg', path: '/images/blog-agreement.jpg', size: '520 KB', optimized: true, usedOn: '/blog', alt: 'Loan agreement on a desk', lane: 'Storage', severity: 'Low', owner: 'STF-005', region: 'Blantyre'},
  {name: 'blog-cover-savings.jpg', path: '/images/blog-savings.jpg', size: '498 KB', optimized: true, usedOn: '/blog', alt: 'Market trader counting cash', lane: 'Storage', severity: 'Low', owner: 'STF-005', region: 'Blantyre'},
  {name: 'airtel-money.svg', path: '/images/channels/airtel.svg', size: '12 KB', optimized: true, usedOn: '/products', alt: 'Airtel Money', lane: 'Storage', severity: 'Low', owner: 'STF-003', region: 'Lilongwe'},
  {name: 'tnm-mpamba.svg', path: '/images/channels/tnm.svg', size: '11 KB', optimized: true, usedOn: '/products', alt: 'TNM Mpamba', lane: 'Storage', severity: 'Low', owner: 'STF-003', region: 'Lilongwe'},
  {name: 'faq-header.jpg', path: '/images/faq-header.jpg', size: '1.1 MB', optimized: false, usedOn: '/faq', alt: 'Customer service desk', lane: 'Storage', severity: 'Low', owner: 'STF-005', region: 'Lilongwe'}
];
const BRAND_ASSETS = [
  {name: 'GFS monogram (SVG)', format: 'SVG', size: '9 KB', variants: 'Gold, charcoal, white', updated: addDays(TODAY, -40)},
  {name: 'GFS wordmark (SVG)', format: 'SVG', size: '14 KB', variants: 'Horizontal, stacked', updated: addDays(TODAY, -40)},
  {name: 'Favicon set', format: 'ICO + PNG', size: '22 KB', variants: '16, 32, 180, 512', updated: addDays(TODAY, -96)},
  {name: 'Brand guidelines', format: 'PDF', size: '2.8 MB', variants: 'v3, English', updated: addDays(TODAY, -120)}
];
const DOCUMENTS = [
  {name: 'Loan agreement template.pdf', folder: 'templates', size: '318 KB', access: 'Staff', downloads: 128, status: 'OK', lane: 'Storage', severity: 'Medium', owner: 'STF-004', region: 'Lilongwe'},
  {name: 'KYC checklist.pdf', folder: 'templates', size: '142 KB', access: 'Staff', downloads: 96, status: 'OK', lane: 'Storage', severity: 'Medium', owner: 'STF-003', region: 'Lilongwe'},
  {name: 'Customer privacy notice.pdf', folder: 'public', size: '86 KB', access: 'Everyone', downloads: 1840, status: 'OK', lane: 'Storage', severity: 'Low', owner: 'STF-004', region: 'Lilongwe'},
  {name: 'Fee schedule 2026.pdf', folder: 'public', size: '124 KB', access: 'Everyone', downloads: 942, status: 'OK', lane: 'Storage', severity: 'Low', owner: 'STF-003', region: 'Lilongwe'},
  {name: 'CUS-0019 statement.pdf', folder: 'customers', size: '64 KB', access: 'Owner + compliance', downloads: 3, status: 'OK', lane: 'Storage', severity: 'High', owner: 'STF-001', region: 'Lilongwe'},
  {name: 'CUS-0021 payslip.pdf', folder: 'customers', size: '312 KB', access: 'Owner + compliance', downloads: 1, status: 'OK', lane: 'Storage', severity: 'High', owner: 'STF-001', region: 'Blantyre'},
  {name: 'CUS-0034 national-id.jpg', folder: 'customers', size: '1.2 MB', access: 'Owner + compliance', downloads: 0, status: 'Missing', lane: 'Storage', severity: 'High', owner: 'STF-003', region: 'Mzuzu'},
  {name: 'CUS-0042 proof-of-address.pdf', folder: 'customers', size: '0 KB', access: 'Owner + compliance', downloads: 0, status: 'Missing', lane: 'Storage', severity: 'High', owner: 'STF-003', region: 'Zomba'}
];
const MISSING_FILES = [
  {path: '/documents/customers/CUS-0034/national-id.jpg', firstSeen: addDays(TODAY, -4), referencedBy: 'KYC record and application', severity: 'High', status: 'Open', lane: 'Storage', owner: 'STF-003', region: 'Mzuzu'},
  {path: '/documents/customers/CUS-0042/proof-of-address.pdf', firstSeen: addDays(TODAY, -2), referencedBy: 'KYC record', severity: 'High', status: 'Open', lane: 'Storage', owner: 'STF-003', region: 'Zomba'},
  {path: '/images/partners/rbm-logo.png', firstSeen: addDays(TODAY, -12), referencedBy: 'Footer trust strip', severity: 'Medium', status: 'Open', lane: 'Website', owner: 'STF-009', region: 'Lilongwe'},
  {path: '/images/blog/cover-2025-11.jpg', firstSeen: addDays(TODAY, -21), referencedBy: 'Two archived blog posts', severity: 'Low', status: 'Open', lane: 'Website', owner: 'STF-005', region: 'Blantyre'}
];
const UPLOAD_CFG = [
  {setting: 'Maximum upload size', value: '5 MB', scope: 'All uploads'},
  {setting: 'Accepted image types', value: 'jpg, jpeg, png, webp, svg', scope: 'Image library'},
  {setting: 'Accepted document types', value: 'pdf, docx, jpg, png', scope: 'Customer documents'},
  {setting: 'Image optimisation', value: 'On — server side, webp fallback', scope: 'All images'},
  {setting: 'Virus scan', value: 'On — ClamAV before a file is kept', scope: 'Customer documents'}
];
const FILE_ACCESS = [
  {folder: '/public', rule: 'Anyone, read only', signed: 'No', note: 'Marketing assets'},
  {folder: '/templates', rule: 'Any staff member', signed: 'Yes (5 min)', note: 'Contract templates'},
  {folder: '/customers', rule: 'Owning officer + compliance', signed: 'Yes (60 s)', note: 'KYC and statements'},
  {folder: '/brand', rule: 'Any staff member', signed: 'No', note: 'Logos and guidelines'},
  {folder: '/backups', rule: 'Administrators only', signed: 'Yes (60 s)', note: 'Database dumps'}
];
const STORAGE_USAGE = [
  {bucket: 'images', files: 1284, size: '612 MB', limit: '2 GB'},
  {bucket: 'documents', files: 214, size: '388 MB', limit: '2 GB'},
  {bucket: 'customers', files: 512, size: '742 MB', limit: '5 GB'},
  {bucket: 'backups', files: 41, size: '1.6 GB', limit: '10 GB'}
];

/* ---------------- performance ---------------- */
const PAGE_PERF = [
  {page: '/', load: 2140, lcp: 1980, cls: 0.02, score: 92, mobile: 'Good', lane: 'Website', severity: 'Low', owner: 'STF-009', region: 'Lilongwe'},
  {page: '/products', load: 2620, lcp: 2410, cls: 0.04, score: 86, mobile: 'Good', lane: 'Website', severity: 'Low', owner: 'STF-003', region: 'Lilongwe'},
  {page: '/calculator', load: 3180, lcp: 2920, cls: 0.06, score: 74, mobile: 'Needs work', lane: 'Website', severity: 'High', owner: 'STF-009', region: 'Lilongwe'},
  {page: '/apply', load: 3860, lcp: 3640, cls: 0.09, score: 68, mobile: 'Needs work', lane: 'Website', severity: 'High', owner: 'STF-001', region: 'Lilongwe'},
  {page: '/blog', load: 2960, lcp: 2480, cls: 0.05, score: 82, mobile: 'Good', lane: 'Website', severity: 'Medium', owner: 'STF-005', region: 'Blantyre'},
  {page: '/about', load: 1980, lcp: 1740, cls: 0.01, score: 94, mobile: 'Good', lane: 'Website', severity: 'Low', owner: 'STF-009', region: 'Lilongwe'},
  {page: '/branches', load: 2280, lcp: 2050, cls: 0.03, score: 88, mobile: 'Good', lane: 'Website', severity: 'Low', owner: 'STF-009', region: 'Lilongwe'},
  {page: '/contact', load: 1820, lcp: 1620, cls: 0.01, score: 95, mobile: 'Good', lane: 'Website', severity: 'Low', owner: 'STF-009', region: 'Lilongwe'},
  {page: '/faq', load: 2460, lcp: 2210, cls: 0.02, score: 90, mobile: 'Good', lane: 'Website', severity: 'Low', owner: 'STF-005', region: 'Lilongwe'},
  {page: '/portal/statements', load: 3420, lcp: 3100, cls: 0.07, score: 72, mobile: 'Needs work', lane: 'Auth', severity: 'Medium', owner: 'STF-001', region: 'Lilongwe'},
  {page: '/portal/apply', load: 3680, lcp: 3300, cls: 0.08, score: 70, mobile: 'Needs work', lane: 'Auth', severity: 'Medium', owner: 'STF-001', region: 'Lilongwe'},
  {page: '/legal/privacy', load: 1420, lcp: 1280, cls: 0.00, score: 98, mobile: 'Good', lane: 'Website', severity: 'Low', owner: 'STF-004', region: 'Lilongwe'}
];
const QUERY_PERF_SERIES = [
  {day: '24 Oct', api: 148, db: 62},
  {day: '25 Oct', api: 156, db: 68},
  {day: '26 Oct', api: 142, db: 58},
  {day: '27 Oct', api: 168, db: 74},
  {day: '28 Oct', api: 176, db: 82},
  {day: '29 Oct', api: 186, db: 96},
  {day: '30 Oct', api: 162, db: 71}
];
const RESOURCES = [
  {metric: 'CPU across instances', value: '34% average', note: 'Peak 58% at 09:10', status: 'Healthy'},
  {metric: 'Memory', value: '61% of 6 GB', note: 'No pressure signal', status: 'Healthy'},
  {metric: 'Database size', value: '1.8 GB', note: 'Growing 40 MB a month', status: 'Healthy'},
  {metric: 'Bandwidth', value: '412 GB of 1 TB', note: '41% of the monthly allowance', status: 'Healthy'}
];
const MOBILE_CHECKS = [
  {check: 'Viewport and zoom', result: 'Pass', detail: 'No horizontal scroll at 360 px'},
  {check: 'Tap target size', result: 'Pass', detail: 'All controls at least 44 px'},
  {check: 'Font legibility', result: 'Pass', detail: 'Minimum 14 px body text'},
  {check: 'Sticky header behaviour', result: 'Review', detail: 'Header covers 92 px on a 640 px screen'},
  {check: 'Form field zoom', result: 'Fail', detail: 'iOS zooms on focus below 16 px inputs'},
  {check: 'Table scrolling', result: 'Pass', detail: 'Wrapped in a horizontal scroller'}
];

/* ---------------- diagnostics ---------------- */
const DIAG_TESTS = [
  {id: 'DGN-01', name: 'Website connection test', target: WM_SET.publicUrl, kind: 'Website', status: 'Pass', lastRun: TODAY + ' 08:16', ms: 142, detail: 'Homepage returned 200 with the expected title'},
  {id: 'DGN-02', name: 'Backend connectivity', target: WM_SET.apiBase + '/healthz', kind: 'Backend', status: 'Pass', lastRun: TODAY + ' 08:16', ms: 61, detail: 'Three instances answered the health check'},
  {id: 'DGN-03', name: 'Supabase connectivity', target: WM_SET.supabaseUrl, kind: 'Supabase', status: 'Pass', lastRun: TODAY + ' 08:16', ms: 88, detail: 'SELECT 1 returned in 12 ms'},
  {id: 'DGN-04', name: 'Authentication functions', target: 'verify_staff · send_otp', kind: 'Auth', status: 'Fail', lastRun: TODAY + ' 08:15', ms: 1840, detail: 'send_otp returned 503 from the SMS gateway'},
  {id: 'DGN-05', name: 'API endpoints', target: '14 routes', kind: 'API', status: 'Fail', lastRun: TODAY + ' 08:15', ms: 940, detail: '13 healthy or degraded, 1 failing (mobile-money callback)'},
  {id: 'DGN-06', name: 'Storage access', target: 'bucket customers', kind: 'Storage', status: 'Pass', lastRun: TODAY + ' 08:14', ms: 128, detail: 'Signed upload URL issued and used'},
  {id: 'DGN-07', name: 'External integrations', target: '10 services', kind: 'Integrations', status: 'Fail', lastRun: TODAY + ' 08:14', ms: 2260, detail: 'TNM Mpamba credential expired — collections refused'},
  {id: 'DGN-08', name: 'DNS and certificate', target: DOMAIN.name, kind: 'Website', status: 'Fail', lastRun: TODAY + ' 08:13', ms: 320, detail: '5 of 6 records resolved, certificate valid for 66 days'}
];
const TROUBLESHOOT = [
  {applies: 'DGN-04', step: 'Rotate the Africa’s Talking key, then re-run send_otp', owner: 'STF-005'},
  {applies: 'DGN-07', step: 'Replace the TNM Mpamba key in the secret store and verify a MWK 1 collection', owner: 'STF-001'},
  {applies: 'DGN-08', step: 'Publish the status CNAME on the registrar, then re-check records', owner: 'STF-001'},
  {applies: 'All', step: 'If three tests fail at once, check the hosting status page before touching configuration', owner: 'STF-001'}
];

/* ---------------- deployment ---------------- */
const RELEASES = [
  {version: '2.14.3', when: '2026-10-28 08:12', env: 'Production', status: 'Live', notes: 'Content pages table, guide content, faster calculator', by: 'STF-001', sha: 'a41f9c2'},
  {version: '2.14.2', when: '2026-10-24 17:05', env: 'Production', status: 'Superseded', notes: 'Fix: duplicate payment reference on retry', by: 'STF-001', sha: '9de11b4'},
  {version: '2.14.1', when: '2026-10-21 09:40', env: 'Production', status: 'Superseded', notes: 'Branch pages, Zomba hours', by: 'STF-009', sha: '77ac0d1'},
  {version: '2.14.0', when: '2026-10-18 14:22', env: 'Production', status: 'Failed', notes: 'Calculator rewrite — build failed on a missing env var', by: 'STF-001', sha: 'c02e7f8'},
  {version: '2.13.6', when: '2026-10-12 10:02', env: 'Production', status: 'Rolled back', notes: 'Session refresh change — rolled back after 26 minutes', by: 'STF-009', sha: '5b19aa3'},
  {version: '2.13.5', when: '2026-10-06 16:35', env: 'Production', status: 'Superseded', notes: 'KYC document upload limits', by: 'STF-001', sha: '1f4d7c9'},
  {version: '2.13.4', when: '2026-09-29 08:55', env: 'Production', status: 'Superseded', notes: 'Airtel Money retry policy', by: 'STF-001', sha: 'b7e2c40'},
  {version: '2.13.3', when: '2026-09-22 11:18', env: 'Production', status: 'Superseded', notes: 'FAQ restructure and search', by: 'STF-009', sha: 'e8a0f61'}
];
const ENV_CHECKS = [
  {check: 'Required environment variables', value: '14 of 14 present', status: 'Pass'},
  {check: 'Node runtime', value: '20.11.1 (pinned)', status: 'Pass'},
  {check: 'Database URL reachable', value: 'Pooler responds in 12 ms', status: 'Pass'},
  {check: 'Storage bucket permissions', value: 'customers bucket private', status: 'Pass'},
  {check: 'SMS gateway credential', value: 'Expires in 6 days', status: 'Review'},
  {check: 'Payment provider credential', value: 'TNM Mpamba expired 3 days ago', status: 'Fail'},
  {check: 'Build cache', value: 'Warm, 41 s restore', status: 'Pass'},
  {check: 'Feature flags', value: 'calculator_v2 on, newsletter off', status: 'Pass'}
];
const PRE_DEPLOY = [
  {check: 'Build passes', status: 'Pass', detail: '2 m 41 s, no warnings'},
  {check: 'Unit and integration tests', status: 'Pass', detail: '248 of 248'},
  {check: 'Database migrations', status: 'Pass', detail: '1 pending migration, reversible'},
  {check: 'Environment variables', status: 'Pass', detail: 'All present in the target environment'},
  {check: 'Integration smoke tests', status: 'Fail', detail: 'TNM Mpamba collection refused'},
  {check: 'Rollback plan', status: 'Pass', detail: 'Previous build 2.14.2 kept warm'}
];
const ROLLBACKS = [
  {version: '2.13.6', to: '2.13.5', when: '2026-10-12 10:28', reason: 'Session refresh loop on the customer portal', by: 'STF-001', minutes: 26},
  {version: '2.11.2', to: '2.11.1', when: '2026-07-19 15:44', reason: 'Statement totals rounded twice', by: 'STF-001', minutes: 51},
  {version: '2.09.4', to: '2.09.3', when: '2026-05-08 11:06', reason: 'Calculator returned a stale rate table', by: 'STF-009', minutes: 18}
];

/* ---------------- alerts ---------------- */
const ALERTS = [
  {id: 'WAL-4101', kind: 'Website offline', target: 'goldenloan.mw', severity: 'Critical', raised: TODAY + ' 07:58', status: 'Open', owner: 'STF-001', note: 'Homepage returned 503 for 90 seconds', lane: 'Website', region: 'Global'},
  {id: 'WAL-4102', kind: 'Backend disconnection', target: 'api.goldenloan.mw', severity: 'Critical', raised: TODAY + ' 06:40', status: 'Open', owner: 'STF-001', note: 'Instance 2 lost its database pool', lane: 'Backend', region: 'Frankfurt'},
  {id: 'WAL-4103', kind: 'Supabase connection failure', target: 'glsvc-prod', severity: 'High', raised: TODAY + ' 07:22', status: 'Open', owner: 'STF-001', note: 'Connection pool exhausted for 40 seconds', lane: 'Supabase', region: 'Frankfurt'},
  {id: 'WAL-4104', kind: 'Authentication failure', target: 'Customer login', severity: 'High', raised: TODAY + ' 07:20', status: 'Open', owner: 'STF-001', note: 'OTP delivery failed 9 times', lane: 'Auth', region: 'Lilongwe'},
  {id: 'WAL-4105', kind: 'API error', target: '/integrations/mobile-money/callback', severity: 'Critical', raised: TODAY + ' 07:12', status: 'Open', owner: 'STF-001', note: '502 from TNM Mpamba, 44 callbacks refused', lane: 'Integrations', region: 'Frankfurt'},
  {id: 'WAL-4106', kind: 'Integration failure', target: 'TNM Mpamba', severity: 'Critical', raised: TODAY + ' 06:05', status: 'Open', owner: 'STF-001', note: 'Credential expired — collections refused', lane: 'Integrations', region: 'Malawi'},
  {id: 'WAL-4107', kind: 'SSL certificate expiry', target: 'goldenloan.mw', severity: 'Medium', raised: addDays(TODAY, -1) + ' 09:00', status: 'Monitoring', owner: 'STF-001', note: 'Certificate expires in 11 days; auto-renew is on', lane: 'Website', region: 'Global'},
  {id: 'WAL-4108', kind: 'Deployment failure', target: 'DEP-2409', severity: 'High', raised: '2026-10-18 14:22', status: 'Resolved', owner: 'STF-001', note: 'Build failed on a missing environment variable', lane: 'Backend', region: 'Frankfurt'},
  {id: 'WAL-4109', kind: 'Form submission error', target: 'Loan application form', severity: 'High', raised: TODAY + ' 07:12', status: 'Open', owner: 'STF-002', note: 'Phone validation rejected 11 entries', lane: 'Website', region: 'Lilongwe'},
  {id: 'WAL-4110', kind: 'Page availability', target: '/careers', severity: 'Low', raised: addDays(TODAY, -2) + ' 12:15', status: 'Resolved', owner: 'STF-009', note: 'Draft route served a maintenance response', lane: 'Website', region: 'Lilongwe'}
];
const ALERT_RULES = [
  {kind: 'Website offline', channel: 'Email + SMS', threshold: '2 failed checks in 3 minutes', to: 'On-call engineer, STF-001', on: true},
  {kind: 'Backend disconnection', channel: 'Email + SMS + PagerDuty', threshold: '1 failed health check', to: 'On-call engineer, STF-001', on: true},
  {kind: 'Supabase connection failure', channel: 'Email + PagerDuty', threshold: '3 failed queries in 5 minutes', to: 'Platform, STF-001', on: true},
  {kind: 'Authentication failure', channel: 'Email', threshold: '5 failures per service per hour', to: 'Security, STF-001', on: true},
  {kind: 'API error', channel: 'Email', threshold: '1% error rate over 15 minutes', to: 'Platform, STF-001', on: true},
  {kind: 'Integration failure', channel: 'Email + SMS', threshold: 'Any failed integration test', to: 'Integrations owner', on: true},
  {kind: 'SSL certificate expiry', channel: 'Email', threshold: '30, 14 and 7 days before expiry', to: 'Platform, STF-001', on: true},
  {kind: 'Deployment failure', channel: 'Email + SMS', threshold: 'Any failed production build', to: 'Release manager, STF-001', on: true},
  {kind: 'Form submission error', channel: 'Email', threshold: '3 failed submissions per form per hour', to: 'Website editor, STF-009', on: false}
];

/* ---------------- access and permissions ---------------- */
const WM_ROLES = ['Super Admin', 'Administrator', 'Website Editor', 'Compliance Officer', 'Credit Analyst', 'Auditor'];
const WM_CAPS = ['Manage website content', 'Edit branding and theme', 'Configure integrations', 'Deploy releases',
  'Run connection tests', 'Approve configuration changes', 'View audit trail'];
const WM_PERMS = {
  'Super Admin': [1, 1, 1, 1, 1, 1, 1],
  'Administrator': [1, 1, 1, 1, 1, 1, 1],
  'Website Editor': [1, 1, 0, 0, 1, 0, 1],
  'Compliance Officer': [0, 0, 0, 0, 1, 0, 1],
  'Credit Analyst': [0, 0, 0, 0, 0, 0, 1],
  'Auditor': [0, 0, 0, 0, 1, 0, 1]
};
const WM_ROLE_STAFF = {
  'Super Admin': 'Chikondi Mwale', 'Administrator': 'Thokozani Banda', 'Website Editor': 'Limbani Phiri',
  'Compliance Officer': 'Grace Nyirenda', 'Credit Analyst': 'Yamikani Gondwe', 'Auditor': 'Mphatso Chirwa'
};
const WM_APPROVALS = [
  {id: 'APR-2201', change: 'Enable RLS on settings', area: 'Database', requested: addDays(TODAY, -3), by: 'STF-001', approver: 'STF-009', state: 'Pending'},
  {id: 'APR-2202', change: 'Rotate TNM Mpamba key', area: 'Integration', requested: addDays(TODAY, -1), by: 'STF-001', approver: 'STF-002', state: 'Pending'},
  {id: 'APR-2203', change: 'Publish Interest Rates and Fees', area: 'Content', requested: addDays(TODAY, -1), by: 'STF-003', approver: 'STF-009', state: 'Pending'},
  {id: 'APR-2204', change: 'Grant deploy rights to the editor', area: 'Permissions', requested: addDays(TODAY, -6), by: 'STF-009', approver: 'STF-001', state: 'Approved'}
];
const WM_CHANGES = [
  {when: TODAY + ' 08:14', what: 'Homepage hero copy', area: 'Content', from: 'Borrow with confidence', to: 'Loans that move at the speed of your business', by: 'STF-009'},
  {when: TODAY + ' 08:12', what: 'Production release', area: 'Deployment', from: '2.14.2', to: '2.14.3', by: 'STF-001'},
  {when: addDays(TODAY, -1) + ' 16:30', what: 'Accent colour', area: 'Branding', from: '#B58C1B', to: '#C9A227', by: 'STF-009'},
  {when: addDays(TODAY, -2) + ' 11:02', what: 'Careers page visibility', area: 'Pages', from: 'Public', to: 'Hidden', by: 'STF-009'},
  {when: addDays(TODAY, -2) + ' 09:41', what: 'Content pages table', area: 'Database', from: 'Not in schema', to: 'content_pages created', by: 'STF-001'},
  {when: addDays(TODAY, -3) + ' 14:18', what: 'API timeout', area: 'Configuration', from: '15000 ms', to: '20000 ms', by: 'STF-001'},
  {when: addDays(TODAY, -5) + ' 10:44', what: 'Navigation order', area: 'Navigation', from: 'Blog before About', to: 'About before Blog', by: 'STF-009'},
  {when: addDays(TODAY, -6) + ' 09:12', what: 'TNM Mpamba secret', area: 'Integration', from: 'v1 key', to: 'v2 key (expired yesterday)', by: 'STF-001'},
  {when: addDays(TODAY, -8) + ' 15:02', what: 'Portal session refresh', area: 'Deployment', from: '2.13.6', to: '2.13.5 (rolled back)', by: 'STF-001'},
  {when: addDays(TODAY, -11) + ' 13:26', what: 'SMS sender id', area: 'Integration', from: 'GFSLOAN', to: 'GOLDENFS', by: 'STF-005'},
  {when: addDays(TODAY, -15) + ' 08:50', what: 'Homepage testimonials', area: 'Content', from: 'Shown', to: 'Hidden pending consent', by: 'STF-009'},
  {when: addDays(TODAY, -19) + ' 12:04', what: 'Health-check interval', area: 'Configuration', from: '10 minutes', to: '5 minutes', by: 'STF-001'}
];

/* ---------------- reports ---------------- */
const WM_REPORTS = [
  {key: 'availability', title: 'Website Availability Report', desc: 'Uptime, downtime and incidents, day by day', icon: 'uptime'},
  {key: 'connections', title: 'Connection Health Report', desc: 'Every connection, its state and its latency', icon: 'link'},
  {key: 'api', title: 'API Performance Report', desc: 'Endpoint volume, p95 and error counts', icon: 'speed'},
  {key: 'database', title: 'Database Connectivity Report', desc: 'Tables, RLS coverage and query health', icon: 'db'},
  {key: 'auth', title: 'Authentication Service Report', desc: 'Sign-in volume, failures and lockouts', icon: 'lock'},
  {key: 'deployment', title: 'Deployment Report', desc: 'Releases, environments, durations and rollbacks', icon: 'rocket'},
  {key: 'errors', title: 'Website Error Report', desc: 'Frontend and page errors with affected routes', icon: 'bug'},
  {key: 'integration', title: 'Integration Reliability Report', desc: 'Uptime, latency and credential state per service', icon: 'plug'}
];

/* ---------------- derived numbers ---------------- */
function wmStats(){
  const openAlerts = ALERTS.filter(a => a.status === 'Open').length;
  const crit = ALERTS.filter(a => a.status === 'Open' && a.severity === 'Critical').length;
  const up = AVAILABILITY.reduce((s, d) => s + d.uptime, 0) / AVAILABILITY.length;
  const endpoints = API_ENDPOINTS.length;
  const failing = API_ENDPOINTS.filter(e => e.status === 'Failing').length;
  const degraded = API_ENDPOINTS.filter(e => e.status === 'Degraded' || e.status === 'Slow').length;
  const rlsGap = TABLES.filter(t => t.rls === 'Disabled').length;
  const brokenLinks = LINKS.filter(l => l.status === 'Broken').length;
  const connErrors = FE_CONNECTIONS.reduce((s, c) => s + c.errors, 0);
  const integrationsDown = INTEGRATIONS.filter(i => i.status === 'Failing').length;
  const avgP95 = Math.round(API_ENDPOINTS.reduce((s, e) => s + e.p95, 0) / endpoints);
  const score = clamp(100
    - (100 - up) * 32
    - failing * 7
    - degraded * 1.6
    - crit * 3.4
    - (openAlerts - crit) * 1.1
    - rlsGap * 3
    - brokenLinks * 1.5
    - integrationsDown * 2, 0, 100);
  return {up, openAlerts, crit, failing, degraded, rlsGap, brokenLinks, connErrors, integrationsDown, avgP95, endpoints, score};
}

/* placeholder row templates kept here so the renderers stay short */
const WM_LOGO_PREVIEW = '<svg viewBox="0 0 120 44" width="120" height="44"><rect width="120" height="44" rx="8" fill="#14161C"/><circle cx="26" cy="22" r="11" fill="none" stroke="#C9A227" stroke-width="2.4"/><path d="M26 15v14M22.5 18.6h5.6a2.6 2.6 0 0 1 0 5.2h-4.4a2.6 2.6 0 0 0 0 5.2h5.8" stroke="#C9A227" stroke-width="1.8" fill="none" stroke-linecap="round"/><text x="46" y="19" fill="#F3EFE3" font-size="9" font-weight="800" font-family="Inter,system-ui,sans-serif">GOLDEN</text><text x="46" y="30" fill="#C9A227" font-size="7" font-weight="700" font-family="Inter,system-ui,sans-serif">FINANCIAL SERVICES</text></svg>';

</script>
