<script>
/* ============================================================
   WEBSITE MANAGEMENT & CONNECTIONS (3/7)
   The website, hosting, backend, Supabase, integration, form,
   storage and deployment registers. Everything below is built
   once and deterministically, so every figure agrees with the
   register it is drawn from.
   ============================================================ */

/* ---------------- configuration (section 19 owns it) ---------------- */
const WM_SET = {
  publicUrl: 'https://goldenloan.mw',
  adminUrl: 'https://portal.goldenloan.mw',
  apiBase: 'https://api.goldenloan.mw/v1',
  supabaseUrl: 'https://glsvc-prod.supabase.co',
  env: 'Production',
  timeout: 20,            // seconds
  retries: 3,
  healthInterval: 5,      // minutes
  cacheTtl: 300,          // seconds
  uptimeTarget: 99.9,
  monitoring: '24 × 7 — uptime pings, error budget alerts, on-call rota',
  maintenance: false
};
const WM_SET_DEFAULTS = Object.assign({}, WM_SET);

const WM_SITE = {
  name: 'Golden Financial Services',
  tagline: 'Loans that move at the speed of your business',
  logo: 'GFS monogram',
  logoVariant: 'Gold on charcoal',
  theme: 'Charcoal & gold',
  accent: '#C9A227',
  font: 'Inter / system stack',
  headerStyle: 'Sticky, two-tier with contact strip',
  footerStyle: 'Four columns with regulator line',
  published: true,
  publishedOn: addDays(TODAY, -2),
  pagesLive: 14
};

const WM_THEMES = [
  {id: 'charcoal', name: 'Charcoal & gold', accent: '#C9A227', bg: '#0F1115', note: 'The live theme'},
  {id: 'daylight', name: 'Daylight', accent: '#1F6FEB', bg: '#FFFFFF', note: 'High-contrast light'},
  {id: 'malawi', name: 'Malawi green', accent: '#1E9E6A', bg: '#0B1F18', note: 'Branch campaign theme'}
];
const WM_LOGOS = ['GFS monogram', 'GFS wordmark', 'GFS roundel', 'GFS stack (legacy)'];

const WM_NAV = [
  {label: 'Home', path: '/', order: 1, visible: true},
  {label: 'Loan products', path: '/products', order: 2, visible: true},
  {label: 'How it works', path: '/how-it-works', order: 3, visible: true},
  {label: 'About us', path: '/about', order: 4, visible: true},
  {label: 'Blog', path: '/blog', order: 5, visible: true},
  {label: 'Contact', path: '/contact', order: 6, visible: true},
  {label: 'Careers', path: '/careers', order: 7, visible: false}
];

const WM_SECTIONS = [
  {name: 'Hero with loan calculator', on: true, order: 1, note: 'Live calculator, rates from the product register'},
  {name: 'Trust strip (regulator, branches, years)', on: true, order: 2, note: 'Four counters, fed from the register'},
  {name: 'Loan products grid', on: true, order: 3, note: 'Five products, terms and fees'},
  {name: 'How it works — three steps', on: true, order: 4, note: 'Application, approval, payout'},
  {name: 'Branch map and hours', on: true, order: 5, note: 'Lilongwe, Blantyre, Mzuzu, Zomba'},
  {name: 'Repayment channels', on: true, order: 6, note: 'Airtel Money, TNM Mpamba, bank, cash'},
  {name: 'Testimonials', on: false, order: 7, note: 'Hidden until the consent forms are signed'},
  {name: 'Newsletter sign-up', on: true, order: 8, note: 'Posts to the email service'}
];

const WM_CONTACT = {
  phone: '+265 1 771 200', whatsapp: '+265 999 771 200',
  email: 'hello@goldenloan.mw', support: 'support@goldenloan.mw',
  address: 'Golden House, Area 3, Lilongwe, Malawi'
};
const WM_OFFICES = [
  {branch: 'Lilongwe (head office)', address: 'Golden House, Area 3', phone: '+265 1 771 200', hours: 'Mon–Fri 08:00–17:00 · Sat 08:00–12:00'},
  {branch: 'Blantyre', address: 'Victoria Avenue, near Clock Tower', phone: '+265 1 822 410', hours: 'Mon–Fri 08:00–17:00'},
  {branch: 'Mzuzu', address: 'Mchengautuwa, Shop 4', phone: '+265 1 312 760', hours: 'Mon–Fri 08:30–16:30'},
  {branch: 'Zomba', address: 'Livingstonia Road, Shop 9', phone: '+265 1 525 330', hours: 'Mon–Fri 08:30–16:30'}
];
const WM_SOCIAL = [
  {channel: 'Facebook', handle: '/goldenfinancialmw', linked: true},
  {channel: 'X', handle: '@goldenloanmw', linked: true},
  {channel: 'LinkedIn', handle: '/company/golden-financial-services', linked: true},
  {channel: 'Instagram', handle: '@goldenloanmw', linked: false},
  {channel: 'WhatsApp Business', handle: '+265 999 771 200', linked: true}
];

/* ---------------- content (section 3) ---------------- */
const CONTENT = [
  {key: 'about', title: 'About us', type: 'Page', status: 'Published', updated: addDays(TODAY, -9), by: 'STF-009', words: 620, lane: 'Website', severity: 'Low', owner: 'STF-009', region: 'Lilongwe'},
  {key: 'services', title: 'Our services', type: 'Page', status: 'Published', updated: addDays(TODAY, -12), by: 'STF-009', words: 480, lane: 'Website', severity: 'Low', owner: 'STF-009', region: 'Lilongwe'},
  {key: 'products', title: 'Loan products and terms', type: 'Page', status: 'Published', updated: addDays(TODAY, -2), by: 'STF-003', words: 910, lane: 'Website', severity: 'Medium', owner: 'STF-003', region: 'Lilongwe'},
  {key: 'rates', title: 'Interest rates and fees', type: 'Page', status: 'Review', updated: addDays(TODAY, -1), by: 'STF-003', words: 540, lane: 'Website', severity: 'High', owner: 'STF-003', region: 'Lilongwe'},
  {key: 'faq', title: 'Frequently asked questions', type: 'Page', status: 'Published', updated: addDays(TODAY, -18), by: 'STF-005', words: 1240, lane: 'Website', severity: 'Low', owner: 'STF-005', region: 'Lilongwe'},
  {key: 'announcements', title: 'Announcements and notices', type: 'Feed', status: 'Published', updated: TODAY, by: 'STF-009', words: 210, lane: 'Website', severity: 'Medium', owner: 'STF-009', region: 'Lilongwe'},
  {key: 'blog', title: 'Blog and news', type: 'Feed', status: 'Published', updated: addDays(TODAY, -4), by: 'STF-005', words: 3150, lane: 'Website', severity: 'Low', owner: 'STF-005', region: 'Blantyre'},
  {key: 'terms', title: 'Terms and conditions', type: 'Legal', status: 'Published', updated: addDays(TODAY, -64), by: 'STF-004', words: 2800, lane: 'Website', severity: 'High', owner: 'STF-004', region: 'Lilongwe'},
  {key: 'privacy', title: 'Privacy policy', type: 'Legal', status: 'Published', updated: addDays(TODAY, -64), by: 'STF-004', words: 2210, lane: 'Website', severity: 'High', owner: 'STF-004', region: 'Lilongwe'},
  {key: 'help', title: 'Help and support content', type: 'Page', status: 'Draft', updated: addDays(TODAY, -5), by: 'STF-005', words: 760, lane: 'Website', severity: 'Low', owner: 'STF-005', region: 'Mzuzu'}
];
const CONTENT_HISTORY = [];
CONTENT.forEach((c, i) => {
  CONTENT_HISTORY.push({when: c.updated, item: c.title, action: i % 3 === 0 ? 'Published' : i % 3 === 1 ? 'Edited' : 'Approved',
    by: c.by, version: 'v' + (2 + (i % 4)) + '.' + (i % 9)});
});
CONTENT_HISTORY.push({when: addDays(TODAY, -3), item: 'Announcements and notices', action: 'Unpublished', by: 'STF-009', version: 'v2.1'});
CONTENT_HISTORY.push({when: addDays(TODAY, -6), item: 'Interest rates and fees', action: 'Submitted for review', by: 'STF-003', version: 'v3.0'});
CONTENT_HISTORY.sort((a, b) => a.when < b.when ? 1 : -1);

/* ---------------- pages (section 4) ---------------- */
const PAGES = [
  {path: '/', title: 'Home', visibility: 'Public', access: 'Everyone', order: 1, seo: 'Golden Financial Services — loans in Malawi', meta: 58, status: 'Live', updated: addDays(TODAY, -2), errors: 0, lane: 'Website', severity: 'Low', owner: 'STF-009', region: 'Lilongwe'},
  {path: '/products', title: 'Loan products', visibility: 'Public', access: 'Everyone', order: 2, seo: 'Loan products, terms and interest rates', meta: 61, status: 'Live', updated: addDays(TODAY, -2), errors: 0, lane: 'Website', severity: 'Low', owner: 'STF-003', region: 'Lilongwe'},
  {path: '/how-it-works', title: 'How it works', visibility: 'Public', access: 'Everyone', order: 3, seo: 'How to apply for a loan in Malawi', meta: 54, status: 'Live', updated: addDays(TODAY, -21), errors: 0, lane: 'Website', severity: 'Low', owner: 'STF-009', region: 'Lilongwe'},
  {path: '/rates', title: 'Rates and fees', visibility: 'Public', access: 'Everyone', order: 4, seo: 'Interest rates and fees', meta: 41, status: 'Warning', updated: addDays(TODAY, -1), errors: 2, lane: 'Website', severity: 'Medium', owner: 'STF-003', region: 'Lilongwe'},
  {path: '/about', title: 'About us', visibility: 'Public', access: 'Everyone', order: 5, seo: 'About Golden Financial Services', meta: 57, status: 'Live', updated: addDays(TODAY, -9), errors: 0, lane: 'Website', severity: 'Low', owner: 'STF-009', region: 'Lilongwe'},
  {path: '/blog', title: 'Blog and news', visibility: 'Public', access: 'Everyone', order: 6, seo: 'Loan advice and company news', meta: 49, status: 'Live', updated: addDays(TODAY, -4), errors: 0, lane: 'Website', severity: 'Low', owner: 'STF-005', region: 'Blantyre'},
  {path: '/contact', title: 'Contact', visibility: 'Public', access: 'Everyone', order: 7, seo: 'Contact the Lilongwe, Blantyre, Mzuzu and Zomba branches', meta: 66, status: 'Live', updated: addDays(TODAY, -14), errors: 1, lane: 'Website', severity: 'Medium', owner: 'STF-009', region: 'Lilongwe'},
  {path: '/faq', title: 'FAQ', visibility: 'Public', access: 'Everyone', order: 8, seo: 'Frequently asked questions', meta: 44, status: 'Live', updated: addDays(TODAY, -18), errors: 0, lane: 'Website', severity: 'Low', owner: 'STF-005', region: 'Lilongwe'},
  {path: '/help', title: 'Help and support', visibility: 'Draft', access: 'Staff', order: 9, seo: 'Help centre', meta: 32, status: 'Draft', updated: addDays(TODAY, -5), errors: 0, lane: 'Website', severity: 'Low', owner: 'STF-005', region: 'Mzuzu'},
  {path: '/apply', title: 'Apply for a loan', visibility: 'Public', access: 'Customers', order: 10, seo: 'Apply for a loan online', meta: 52, status: 'Live', updated: addDays(TODAY, -7), errors: 3, lane: 'Backend', severity: 'High', owner: 'STF-003', region: 'Lilongwe'},
  {path: '/portal/login', title: 'Customer portal sign-in', visibility: 'Public', access: 'Customers', order: 11, seo: 'Sign in to your Golden loan', meta: 46, status: 'Live', updated: addDays(TODAY, -11), errors: 0, lane: 'Auth', severity: 'Medium', owner: 'STF-001', region: 'Lilongwe'},
  {path: '/terms', title: 'Terms and conditions', visibility: 'Public', access: 'Everyone', order: 12, seo: 'Terms and conditions', meta: 38, status: 'Live', updated: addDays(TODAY, -64), errors: 0, lane: 'Website', severity: 'High', owner: 'STF-004', region: 'Lilongwe'},
  {path: '/privacy', title: 'Privacy policy', visibility: 'Public', access: 'Everyone', order: 13, seo: 'Privacy policy and data protection', meta: 55, status: 'Live', updated: addDays(TODAY, -64), errors: 0, lane: 'Website', severity: 'High', owner: 'STF-004', region: 'Lilongwe'},
  {path: '/careers', title: 'Careers', visibility: 'Hidden', access: 'Everyone', order: 14, seo: 'Work with us', meta: 28, status: 'Hidden', updated: addDays(TODAY, -120), errors: 0, lane: 'Website', severity: 'Low', owner: 'STF-009', region: 'Lilongwe'}
];

const LINKS = [
  {from: '/', to: '/products', label: 'Loan products', status: 'OK', checked: addDays(TODAY, -1)},
  {from: '/', to: '/apply', label: 'Apply now', status: 'OK', checked: addDays(TODAY, -1)},
  {from: '/', to: '/rates', label: 'See our rates', status: 'Broken', checked: addDays(TODAY, -1)},
  {from: '/products', to: '/apply?product=salary', label: 'Salary loan', status: 'OK', checked: addDays(TODAY, -1)},
  {from: '/products', to: '/documents/loan-terms-2025.pdf', label: 'Download terms (2025)', status: 'Broken', checked: addDays(TODAY, -1)},
  {from: '/about', to: '/careers', label: 'Careers', status: 'Redirect', checked: addDays(TODAY, -2)},
  {from: '/faq', to: '/contact', label: 'Still need help?', status: 'OK', checked: addDays(TODAY, -2)},
  {from: '/contact', to: 'mailto:support@goldenloan.mw', label: 'Email support', status: 'OK', checked: addDays(TODAY, -2)},
  {from: '/blog', to: '/products#group', label: 'Group loans', status: 'OK', checked: addDays(TODAY, -3)},
  {from: '/apply', to: '/privacy', label: 'Data consent', status: 'OK', checked: addDays(TODAY, -3)},
  {from: '/portal/login', to: '/portal/reset', label: 'Forgot password', status: 'OK', checked: addDays(TODAY, -3)},
  {from: '/help', to: '/faq', label: 'Read the FAQ', status: 'Broken', checked: addDays(TODAY, -4)}
];

const PAGE_ERRORS = [
  {when: TODAY + ' 07:12', page: '/apply', error: '502 from POST /applications', count: 3, severity: 'High', status: 'Open', lane: 'Backend', owner: 'STF-001', region: 'Lilongwe'},
  {when: TODAY + ' 06:48', page: '/rates', error: 'Missing image: rates-table-2025.png', count: 2, severity: 'Medium', status: 'Open', lane: 'Website', owner: 'STF-003', region: 'Lilongwe'},
  {when: addDays(TODAY, -1) + ' 18:02', page: '/contact', error: 'Form endpoint returned 500', count: 1, severity: 'Medium', status: 'Resolved', lane: 'Integrations', owner: 'STF-001', region: 'Lilongwe'},
  {when: addDays(TODAY, -2) + ' 15:31', page: '/', error: 'Font preload warning', count: 4, severity: 'Low', status: 'Resolved', lane: 'Website', owner: 'STF-009', region: 'Lilongwe'},
  {when: addDays(TODAY, -3) + ' 09:14', page: '/blog', error: 'Stale cache served an old header', count: 2, severity: 'Low', status: 'Closed', lane: 'Website', owner: 'STF-005', region: 'Blantyre'}
];

/* ---------------- domain and hosting (section 5) ---------------- */
const DOMAIN = {
  name: 'goldenloan.mw', registrar: 'MalawiNet', registered: '2023-04-12', expires: '2027-04-12',
  autoRenew: true, dnssec: 'Enabled', nameservers: 'dns1.netlify.com · dns2.netlify.com',
  idProtection: 'On'
};
const DNS = [
  {record: '@', type: 'A', value: '75.2.60.5', ttl: '3600', status: 'Propagated'},
  {record: 'www', type: 'CNAME', value: 'golden-loan-services.netlify.app', ttl: '3600', status: 'Propagated'},
  {record: 'portal', type: 'CNAME', value: 'golden-loan-services.netlify.app', ttl: '3600', status: 'Propagated'},
  {record: 'api', type: 'CNAME', value: 'gls-api.fly.dev', ttl: '300', status: 'Propagated'},
  {record: '@', type: 'MX', value: '10 mx1.improvmx.com', ttl: '3600', status: 'Propagated'},
  {record: '_dmarc', type: 'TXT', value: 'v=DMARC1; p=quarantine; rua=mailto:dmarc@goldenloan.mw', ttl: '3600', status: 'Propagated'},
  {record: 'status', type: 'CNAME', value: 'stats.uptimerobot.com', ttl: '300', status: 'Pending'}
];
const SSL_CERT = {
  issuer: "Let's Encrypt R3", validFrom: addDays(TODAY, -24), validTo: addDays(TODAY, 66),
  daysLeft: 66, protocol: 'TLS 1.3', hsts: true, ocsp: 'Stapled', keyType: 'ECDSA P-256'
};
const HOSTING = {
  provider: 'Netlify', plan: 'Pro', region: 'Frankfurt (eu-central-1)', cdn: 'Cloudflare edge, 310 PoPs',
  storage: '1.2 GB of 100 GB build cache', buildMinutes: '412 of 25,000 used',
  repo: 'wwwmaryemmanuel01/golden-loan-services', branch: 'main'
};

const DEPLOYMENTS = [
  {id: 'DEP-2412', when: TODAY + ' 08:12', version: '2.14.3', env: 'Production', status: 'Live', took: '2 m 41 s', by: 'STF-001', commit: 'a41f9c2'},
  {id: 'DEP-2411', when: addDays(TODAY, -2) + ' 17:40', version: '2.14.2', env: 'Production', status: 'Live', took: '2 m 18 s', by: 'STF-001', commit: '7d2e0b1'},
  {id: 'DEP-2410', when: addDays(TODAY, -2) + ' 11:02', version: '2.14.1', env: 'Staging', status: 'Superseded', took: '1 m 56 s', by: 'STF-009', commit: '3c9aa74'},
  {id: 'DEP-2409', when: addDays(TODAY, -5) + ' 09:25', version: '2.14.0', env: 'Production', status: 'Superseded', took: '3 m 04 s', by: 'STF-001', commit: '91bb0e8'},
  {id: 'DEP-2408', when: addDays(TODAY, -8) + ' 14:16', version: '2.13.6', env: 'Production', status: 'Rolled back', took: '2 m 33 s', by: 'STF-001', commit: 'f01d3c7'},
  {id: 'DEP-2407', when: addDays(TODAY, -11) + ' 10:04', version: '2.13.5', env: 'Production', status: 'Superseded', took: '2 m 12 s', by: 'STF-009', commit: '5ae7c90'},
  {id: 'DEP-2406', when: addDays(TODAY, -16) + ' 16:48', version: '2.13.4', env: 'Staging', status: 'Failed', took: '—', by: 'STF-009', commit: 'c4b21a6'},
  {id: 'DEP-2405', when: addDays(TODAY, -19) + ' 08:55', version: '2.13.3', env: 'Production', status: 'Superseded', took: '2 m 27 s', by: 'STF-001', commit: 'e88f502'},
  {id: 'DEP-2404', when: addDays(TODAY, -24) + ' 12:30', version: '2.13.2', env: 'Production', status: 'Superseded', took: '2 m 45 s', by: 'STF-001', commit: 'b7c13d4'},
  {id: 'DEP-2403', when: addDays(TODAY, -29) + ' 09:11', version: '2.13.1', env: 'Production', status: 'Superseded', took: '2 m 09 s', by: 'STF-009', commit: '0a55e18'}
];

const UPTIME = [];
for(let i = 13; i >= 0; i--){
  const down = i === 4 ? 42 : i === 9 ? 12 : 0;
  UPTIME.push({date: addDays(TODAY, -i), uptime: down ? 100 - Math.round(down / 14.4 * 10) / 10 : 100,
    downMin: down, checks: 288, incidents: down ? 1 : 0});
}

/* ---------------- backend (section 6) ---------------- */
const BACKEND = {
  name: 'gls-api', runtime: 'Node 20 · Fastify 4', region: 'fra1 · Frankfurt', instances: 3,
  cpu: 34, memory: 61, disk: 22, restarts30d: 2, lastRestart: addDays(TODAY, -9) + ' 03:40',
  version: '2.14.3', healthUrl: '/healthz', status: 'Healthy', redis: 'Connected · 14 ms', queue: '0 backed up'
};
const SERVER_HEALTH = [
  {check: 'Process alive', value: '3 of 3 instances responding', status: 'Pass'},
  {check: 'Health endpoint', value: '/healthz returned 200 in 61 ms', status: 'Pass'},
  {check: 'Database pool', value: '14 of 60 connections used', status: 'Pass'},
  {check: 'Redis cache', value: 'Connected, 14 ms round trip', status: 'Pass'},
  {check: 'Background queue', value: '0 jobs backed up, 412 processed today', status: 'Pass'},
  {check: 'Disk headroom', value: '22% of 40 GB used', status: 'Pass'},
  {check: 'Memory pressure', value: '61% — above the 55% target', status: 'Review'},
  {check: 'TLS termination', value: 'TLS 1.3, HSTS on', status: 'Pass'}
];

const API_ENDPOINTS = [
  {path: '/healthz', method: 'GET', group: 'Platform', auth: 'Public', p95: 61, calls: 8640, errors: 0, status: 'Healthy', lane: 'Backend', severity: 'Low', owner: 'STF-001', region: 'Frankfurt'},
  {path: '/auth/staff/login', method: 'POST', group: 'Auth', auth: 'Public', p95: 212, calls: 1180, errors: 6, status: 'Healthy', lane: 'Auth', severity: 'High', owner: 'STF-001', region: 'Frankfurt'},
  {path: '/auth/customer/login', method: 'POST', group: 'Auth', auth: 'Public', p95: 198, calls: 2410, errors: 11, status: 'Degraded', lane: 'Auth', severity: 'High', owner: 'STF-001', region: 'Frankfurt'},
  {path: '/auth/reset', method: 'POST', group: 'Auth', auth: 'Public', p95: 244, calls: 320, errors: 2, status: 'Healthy', lane: 'Auth', severity: 'Medium', owner: 'STF-001', region: 'Frankfurt'},
  {path: '/customers', method: 'GET', group: 'Customers', auth: 'Staff token', p95: 143, calls: 5620, errors: 3, status: 'Healthy', lane: 'Backend', severity: 'Medium', owner: 'STF-001', region: 'Frankfurt'},
  {path: '/applications', method: 'POST', group: 'Loans', auth: 'Customer token', p95: 388, calls: 940, errors: 14, status: 'Degraded', lane: 'Backend', severity: 'High', owner: 'STF-003', region: 'Frankfurt'},
  {path: '/loans/:ref', method: 'GET', group: 'Loans', auth: 'Token', p95: 121, calls: 3180, errors: 1, status: 'Healthy', lane: 'Backend', severity: 'Medium', owner: 'STF-003', region: 'Frankfurt'},
  {path: '/repayments', method: 'POST', group: 'Repayments', auth: 'Staff token', p95: 264, calls: 2070, errors: 5, status: 'Healthy', lane: 'Backend', severity: 'High', owner: 'STF-005', region: 'Frankfurt'},
  {path: '/payments/airtel/webhook', method: 'POST', group: 'Payments', auth: 'Signature', p95: 96, calls: 1480, errors: 4, status: 'Healthy', lane: 'Integrations', severity: 'High', owner: 'STF-001', region: 'Frankfurt'},
  {path: '/payments/mpamba/webhook', method: 'POST', group: 'Payments', auth: 'Signature', p95: 104, calls: 860, errors: 7, status: 'Degraded', lane: 'Integrations', severity: 'High', owner: 'STF-001', region: 'Frankfurt'},
  {path: '/documents/sign', method: 'POST', group: 'Storage', auth: 'Staff token', p95: 318, calls: 720, errors: 2, status: 'Healthy', lane: 'Storage', severity: 'Medium', owner: 'STF-001', region: 'Frankfurt'},
  {path: '/reports/export', method: 'GET', group: 'Reports', auth: 'Staff token', p95: 640, calls: 310, errors: 3, status: 'Slow', lane: 'Backend', severity: 'Medium', owner: 'STF-001', region: 'Frankfurt'},
  {path: '/notifications/send', method: 'POST', group: 'Notifications', auth: 'Service key', p95: 176, calls: 1620, errors: 8, status: 'Healthy', lane: 'Integrations', severity: 'Medium', owner: 'STF-001', region: 'Frankfurt'},
  {path: '/legacy/export', method: 'GET', group: 'Legacy', auth: 'None', p95: 1240, calls: 42, errors: 19, status: 'Failing', lane: 'Backend', severity: 'Critical', owner: 'STF-001', region: 'Frankfurt'}
];

const SERVER_ERRORS = [
  {when: TODAY + ' 07:12', endpoint: '/applications', code: 502, message: 'Upstream timeout while writing to Supabase', count: 14, severity: 'Critical', status: 'Open', lane: 'Backend', owner: 'STF-001', region: 'Frankfurt'},
  {when: TODAY + ' 06:20', endpoint: '/legacy/export', code: 500, message: 'Cannot read properties of undefined (reading rows)', count: 19, severity: 'High', status: 'Open', lane: 'Backend', owner: 'STF-001', region: 'Frankfurt'},
  {when: addDays(TODAY, -1) + ' 21:04', endpoint: '/auth/customer/login', code: 429, message: 'Rate limit reached on the customer login', count: 11, severity: 'Medium', status: 'Monitoring', lane: 'Auth', owner: 'STF-001', region: 'Frankfurt'},
  {when: addDays(TODAY, -1) + ' 15:38', endpoint: '/payments/mpamba/webhook', code: 400, message: 'Signature mismatch on the TNM callback', count: 7, severity: 'High', status: 'Open', lane: 'Integrations', owner: 'STF-001', region: 'Frankfurt'},
  {when: addDays(TODAY, -2) + ' 11:52', endpoint: '/reports/export', code: 504, message: 'Gateway timeout at 640 ms p95', count: 3, severity: 'Medium', status: 'Monitoring', lane: 'Backend', owner: 'STF-001', region: 'Frankfurt'},
  {when: addDays(TODAY, -3) + ' 18:26', endpoint: '/documents/sign', code: 403, message: 'Expired storage token', count: 2, severity: 'Medium', status: 'Resolved', lane: 'Storage', owner: 'STF-001', region: 'Frankfurt'}
];

const TRAFFIC = [];
for(let i = 11; i >= 0; i--){
  const h = 8 + (11 - i);
  TRAFFIC.push({hour: pad(h, 2) + ':00', requests: 620 + ((i * 137) % 940), errors: (i % 4) + (i > 8 ? 3 : 0), avgMs: 118 + ((i * 29) % 90)});
}
const RESTARTS = [
  {when: addDays(TODAY, -9) + ' 03:40', reason: 'Scheduled platform patching', took: '38 s', by: 'Platform'},
  {when: addDays(TODAY, -21) + ' 22:15', reason: 'Memory pressure on instance 2', took: '1 m 04 s', by: 'On-call'},
  {when: addDays(TODAY, -33) + ' 04:10', reason: 'Scheduled platform patching', took: '36 s', by: 'Platform'}
];

/* ---------------- Supabase (section 7) ---------------- */
const SUPA = {
  project: 'glsvc-prod', url: 'https://glsvc-prod.supabase.co', region: 'eu-west-1 · Ireland',
  engine: 'PostgreSQL 15.8', tier: 'Pro', connections: '14 of 60', size: '412 MB of 8 GB',
  schemaVersion: '2026.10.28.1', pooler: 'Transaction mode', latency: '42 ms'
};
const DB_HEALTH = [
  {check: 'Primary connectivity', value: 'Round trip 42 ms, 0 failed probes today', status: 'Pass'},
  {check: 'Connection pool', value: '14 of 60 in use, no wait queue', status: 'Pass'},
  {check: 'Replication lag', value: '0.4 s behind the read replica', status: 'Pass'},
  {check: 'Disk usage', value: '412 MB of 8 GB', status: 'Pass'},
  {check: 'Slow query budget', value: '2 queries above 500 ms', status: 'Review'},
  {check: 'Backup freshness', value: 'Nightly copy 9 hours old', status: 'Pass'},
  {check: 'Row-level security', value: 'Enabled on 11 of 12 tables', status: 'Gap'},
  {check: 'Auth configuration', value: 'JWT expiry 3600 s, OTP length 6', status: 'Pass'}
];
const TABLES = [
  {table: 'customers', rows: 60, size: '3.1 MB', rls: 'Enabled', policy: 'Branch + role scoped', lastWrite: addDays(TODAY, -1), lane: 'Supabase', owner: 'STF-001'},
  {table: 'loans', rows: 77, size: '2.4 MB', rls: 'Enabled', policy: 'Role scoped — credit and compliance', lastWrite: TODAY, lane: 'Supabase', owner: 'STF-001'},
  {table: 'applications', rows: 132, size: '4.8 MB', rls: 'Enabled', policy: 'Applicant or credit role', lastWrite: TODAY, lane: 'Supabase', owner: 'STF-003'},
  {table: 'repayments', rows: 402, size: '6.2 MB', rls: 'Enabled', policy: 'Branch scoped, insert only for cashiers', lastWrite: TODAY, lane: 'Supabase', owner: 'STF-005'},
  {table: 'disbursements', rows: 86, size: '1.1 MB', rls: 'Enabled', policy: 'Finance roles only', lastWrite: addDays(TODAY, -1), lane: 'Supabase', owner: 'STF-001'},
  {table: 'documents', rows: 214, size: '88 MB', rls: 'Enabled', policy: 'Signed URLs, 60-second life', lastWrite: addDays(TODAY, -2), lane: 'Storage', owner: 'STF-001'},
  {table: 'staff_profiles', rows: 9, size: '412 KB', rls: 'Enabled', policy: 'Self or administrator', lastWrite: addDays(TODAY, -4), lane: 'Supabase', owner: 'STF-001'},
  {table: 'audit_log', rows: 4820, size: '12 MB', rls: 'Enabled', policy: 'Read-only for auditors', lastWrite: TODAY, lane: 'Supabase', owner: 'STF-004'},
  {table: 'content_pages', rows: 14, size: '310 KB', rls: 'Enabled', policy: 'Public read, editor write', lastWrite: addDays(TODAY, -2), lane: 'Website', owner: 'STF-009'},
  {table: 'site_settings', rows: 38, size: '96 KB', rls: 'Enabled', policy: 'Administrator only', lastWrite: TODAY, lane: 'Website', owner: 'STF-009'},
  {table: 'integrations', rows: 10, size: '84 KB', rls: 'Enabled', policy: 'Administrator only', lastWrite: addDays(TODAY, -3), lane: 'Integrations', owner: 'STF-001'},
  {table: 'settings', rows: 24, size: '72 KB', rls: 'Disabled', policy: 'No policy — readable by any authenticated user', lastWrite: addDays(TODAY, -6), lane: 'Supabase', owner: 'STF-001'}
];
const MIGRATIONS = [
  {id: 'MIG-0912', name: 'add content_pages and site_settings', when: addDays(TODAY, -2) + ' 09:41', status: 'Applied', by: 'STF-001', ms: 412},
  {id: 'MIG-0911', name: 'index repayments(loan_ref, paid_at)', when: addDays(TODAY, -6) + ' 14:20', status: 'Applied', by: 'STF-001', ms: 1180},
  {id: 'MIG-0910', name: 'integration health columns', when: addDays(TODAY, -11) + ' 10:05', status: 'Applied', by: 'STF-001', ms: 226},
  {id: 'MIG-0909', name: 'fix documents policy for signed URLs', when: addDays(TODAY, -18) + ' 16:44', status: 'Applied', by: 'STF-001', ms: 640},
  {id: 'MIG-0908', name: 'add audit_log partitions', when: addDays(TODAY, -24) + ' 08:12', status: 'Applied', by: 'STF-001', ms: 2140},
  {id: 'MIG-0907', name: 'customer portal tokens', when: addDays(TODAY, -31) + ' 11:58', status: 'Rolled back', by: 'STF-001', ms: 380},
  {id: 'MIG-0906', name: 'staff_profiles mfa columns', when: addDays(TODAY, -38) + ' 09:30', status: 'Applied', by: 'STF-001', ms: 190},
  {id: 'MIG-0905', name: 'settings table (legacy import)', when: addDays(TODAY, -52) + ' 13:16', status: 'Applied', by: 'STF-001', ms: 905}
];
const DB_ERRORS = [
  {when: TODAY + ' 07:12', code: '57014', message: 'canceling statement due to statement timeout', count: 14, severity: 'High', status: 'Open', lane: 'Supabase', owner: 'STF-001'},
  {when: TODAY + ' 05:40', code: '23505', message: 'duplicate key value violates repayments_ref_key', count: 6, severity: 'Medium', status: 'Open', lane: 'Supabase', owner: 'STF-005'},
  {when: addDays(TODAY, -1) + ' 20:18', code: '42501', message: 'permission denied for table settings', count: 4, severity: 'High', status: 'Monitoring', lane: 'Supabase', owner: 'STF-001'},
  {when: addDays(TODAY, -2) + ' 12:02', code: '53300', message: 'remaining connection slots are reserved', count: 2, severity: 'High', status: 'Resolved', lane: 'Supabase', owner: 'STF-001'},
  {when: addDays(TODAY, -4) + ' 09:36', code: '22007', message: 'invalid input syntax for type timestamp', count: 3, severity: 'Low', status: 'Resolved', lane: 'Supabase', owner: 'STF-001'},
  {when: addDays(TODAY, -7) + ' 15:44', code: '42P01', message: 'relation "legacy_loans" does not exist', count: 19, severity: 'Critical', status: 'Open', lane: 'Supabase', owner: 'STF-001'}
];
const DB_FUNCS = [
  {name: 'calc_arrears(loan_ref)', args: 'text', risk: 'Low', invoker: 'Caller rights', status: 'Healthy', runs: 4120},
  {name: 'next_loan_ref()', args: '—', risk: 'Low', invoker: 'Definer', status: 'Healthy', runs: 940},
  {name: 'refresh_branch_totals()', args: '—', risk: 'Low', invoker: 'Definer', status: 'Healthy', runs: 288},
  {name: 'legacy_export(table_name)', args: 'text', risk: 'High', invoker: 'Definer (service role)', status: 'Vulnerable', runs: 42},
  {name: 'set_updated_at()', args: '—', risk: 'Low', invoker: 'Trigger', status: 'Healthy', runs: 6820},
  {name: 'has_branch_access(branch)', args: 'text', risk: 'Low', invoker: 'Caller rights', status: 'Healthy', runs: 12400}
];
const QUERY_PERF = [
  {query: 'select * from loans where ref = $1', calls: 3180, avg: 4, p95: 11, rows: 1},
  {query: 'select * from repayments where loan_ref = $1 order by paid_at desc', calls: 2070, avg: 18, p95: 44, rows: 12},
  {query: 'select … from applications where status = $1 limit 50', calls: 940, avg: 62, p95: 148, rows: 50},
  {query: 'select … from customers where branch = $1', calls: 5620, avg: 9, p95: 22, rows: 60},
  {query: 'insert into repayments …', calls: 402, avg: 12, p95: 30, rows: 1},
  {query: 'select … from audit_log order by created_at desc limit 100', calls: 310, avg: 410, p95: 880, rows: 100},
  {query: 'select … from documents where customer_id = $1', calls: 214, avg: 26, p95: 61, rows: 8},
  {query: 'select … from settings', calls: 88, avg: 6, p95: 14, rows: 24},
  {query: 'refresh materialized view branch_totals', calls: 288, avg: 220, p95: 460, rows: 4},
  {query: 'select legacy_export($1)', calls: 42, avg: 1240, p95: 3120, rows: 0}
];

/* ---------------- integrations (section 8) ---------------- */
const INTEGRATIONS = [
  {name: 'Supabase Auth', kind: 'Authentication', provider: 'Supabase', status: 'Connected', lastCheck: TODAY + ' 08:10', latency: 88, uptime: 99.98, creds: 'Valid', lane: 'Auth', severity: 'High', owner: 'STF-001', region: 'Ireland'},
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
  {name: 'SUPABASE_SERVICE_ROLE_KEY', service: 'Supabase', scope: 'server', rotated: addDays(TODAY, -34), expires: addDays(TODAY, 56), state: 'Valid'},
  {name: 'SUPABASE_ANON_KEY', service: 'Supabase', scope: 'browser', rotated: addDays(TODAY, -120), expires: 'Never', state: 'Valid'},
  {name: 'RESEND_API_KEY', service: 'Resend', scope: 'server', rotated: addDays(TODAY, -61), expires: addDays(TODAY, 29), state: 'Valid'},
  {name: 'AT_API_KEY', service: 'Africa’s Talking', scope: 'server', rotated: addDays(TODAY, -88), expires: addDays(TODAY, 2), state: 'Expiring'},
  {name: 'AIRTEL_MONEY_CLIENT_SECRET', service: 'Airtel Money', scope: 'server', rotated: addDays(TODAY, -40), expires: addDays(TODAY, 50), state: 'Valid'},
  {name: 'TNM_MPAMBA_KEY', service: 'TNM Mpamba', scope: 'server', rotated: addDays(TODAY, -96), expires: addDays(TODAY, -1), state: 'Expired'},
  {name: 'SENTRY_DSN', service: 'Sentry', scope: 'browser', rotated: addDays(TODAY, -200), expires: 'Never', state: 'Valid'}
];

const INTEGRATION_TESTS = [
  {service: 'Supabase Auth', test: 'Token exchange and refresh', when: addDays(TODAY, -1), result: 'Pass', ms: 88},
  {service: 'Resend email', test: 'Send a templated receipt', when: addDays(TODAY, -1), result: 'Pass', ms: 204},
  {service: 'Africa’s Talking SMS', test: 'Send to a test handset', when: TODAY, result: 'Slow', ms: 740},
  {service: 'Airtel Money', test: 'Collections callback signature', when: TODAY, result: 'Pass', ms: 312},
  {service: 'TNM Mpamba', test: 'Collections callback signature', when: TODAY, result: 'Fail', ms: 0},
  {service: 'Supabase Storage', test: 'Signed URL upload and read', when: addDays(TODAY, -2), result: 'Pass', ms: 128},
  {service: 'Customer portal API', test: 'Round trip from the browser', when: TODAY, result: 'Pass', ms: 118},
  {service: 'Sentry', test: 'Test event delivery', when: addDays(TODAY, -3), result: 'Pass', ms: 96}
];

/* ---------------- authentication (section 9) ---------------- */
const AUTH_SERVICES = [
  {name: 'Staff login', kind: 'Sign-in', status: 'Healthy', p95: 212, calls24h: 1180, errors: 6, note: 'Email, password and TOTP', lane: 'Auth', owner: 'STF-001'},
  {name: 'Customer login', kind: 'Sign-in', status: 'Degraded', p95: 198, calls24h: 2410, errors: 11, note: 'Phone number and one-time code', lane: 'Auth', owner: 'STF-001'},
  {name: 'Registration service', kind: 'Sign-up', status: 'Healthy', p95: 340, calls24h: 186, errors: 2, note: 'Creates the customer and KYC shell', lane: 'Auth', owner: 'STF-003'},
  {name: 'Password recovery', kind: 'Recovery', status: 'Healthy', p95: 244, calls24h: 320, errors: 2, note: 'Email link and SMS code', lane: 'Auth', owner: 'STF-001'},
  {name: 'Staff authentication functions', kind: 'Edge function', status: 'Healthy', p95: 176, calls24h: 940, errors: 3, note: 'verify-staff, reset-staff-password', lane: 'Auth', owner: 'STF-001'},
  {name: 'Customer authentication functions', kind: 'Edge function', status: 'Degraded', p95: 268, calls24h: 1520, errors: 9, note: 'otp-send, otp-verify, session-refresh', lane: 'Auth', owner: 'STF-001'},
  {name: 'Session validation', kind: 'Middleware', status: 'Healthy', p95: 24, calls24h: 18400, errors: 1, note: 'Runs on every authenticated request', lane: 'Auth', owner: 'STF-001'}
];
const AUTH_ERRORS = [
  {when: TODAY + ' 07:58', service: 'Customer login', code: 'otp_expired', detail: 'Code expired before entry (5 min window)', count: 6, severity: 'Medium', status: 'Open', lane: 'Auth', owner: 'STF-001'},
  {when: TODAY + ' 07:20', service: 'Customer authentication functions', code: 'otp_send_failed', detail: 'SMS gateway 503 from Africa’s Talking', count: 9, severity: 'High', status: 'Open', lane: 'Auth', owner: 'STF-001'},
  {when: addDays(TODAY, -1) + ' 19:12', service: 'Staff login', code: 'mfa_failed', detail: 'TOTP rejected three times, account locked', count: 3, severity: 'Medium', status: 'Resolved', lane: 'Auth', owner: 'STF-001'},
  {when: addDays(TODAY, -1) + ' 13:40', service: 'Session validation', code: 'token_expired', detail: 'JWT lifetime 3600 s reached mid-session', count: 4, severity: 'Low', status: 'Monitoring', lane: 'Auth', owner: 'STF-001'},
  {when: addDays(TODAY, -2) + ' 16:05', service: 'Password recovery', code: 'reset_throttled', detail: 'Second reset inside ten minutes', count: 2, severity: 'Low', status: 'Closed', lane: 'Auth', owner: 'STF-001'},
  {when: addDays(TODAY, -3) + ' 10:22', service: 'Registration service', code: 'duplicate_phone', detail: 'Phone already on a customer record', count: 2, severity: 'Medium', status: 'Resolved', lane: 'Auth', owner: 'STF-003'},
  {when: addDays(TODAY, -4) + ' 08:44', service: 'Customer login', code: 'rate_limited', detail: '429 after ten attempts in a minute', count: 11, severity: 'High', status: 'Monitoring', lane: 'Auth', owner: 'STF-001'}
];
const AUTH_DAILY = MONTHS.slice(-6).map((mk, i) => ({mk, staff: 120 + ((i * 47) % 90), customers: 480 + ((i * 113) % 260), failed: 8 + ((i * 17) % 22)}));

/* ---------------- frontend integration (section 10) ---------------- */
const FE_CONNECTIONS = [
  {name: 'Public website to backend', origin: 'https://goldenloan.mw', target: 'api.goldenloan.mw', status: 'Connected', p95: 142, errors: 4, note: 'Forms, calculator and content fetches', lane: 'Website', owner: 'STF-001'},
  {name: 'Admin portal to backend', origin: 'https://portal.goldenloan.mw', target: 'api.goldenloan.mw', status: 'Connected', p95: 118, errors: 2, note: 'Staff session, reports and writes', lane: 'Backend', owner: 'STF-001'},
  {name: 'Customer portal to backend', origin: 'https://goldenloan.mw/portal', target: 'api.goldenloan.mw', status: 'Degraded', p95: 302, errors: 14, note: 'Loan status, statements and applications', lane: 'Backend', owner: 'STF-003'}
];
const FE_CONFIG = [
  {key: 'NEXT_PUBLIC_API_URL', value: 'https://api.goldenloan.mw/v1', env: 'Production', status: 'Set', lane: 'Website', owner: 'STF-001'},
  {key: 'NEXT_PUBLIC_SUPABASE_URL', value: 'https://glsvc-prod.supabase.co', env: 'Production', status: 'Set', lane: 'Website', owner: 'STF-001'},
  {key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', value: 'eyJhbGciOi… (safe to expose)', env: 'Production', status: 'Set', lane: 'Website', owner: 'STF-001'},
  {key: 'NEXT_PUBLIC_SENTRY_DSN', value: 'https://…ingest.sentry.io/4501', env: 'Production', status: 'Set', lane: 'Website', owner: 'STF-001'},
  {key: 'API_TIMEOUT_MS', value: '20000', env: 'Production', status: 'Set', lane: 'Website', owner: 'STF-001'},
  {key: 'PORTAL_FEATURE_APPLICATIONS', value: 'true', env: 'Production', status: 'Set', lane: 'Backend', owner: 'STF-003'},
  {key: 'LEGACY_EXPORT_ENABLED', value: 'true', env: 'Production', status: 'Review', lane: 'Backend', owner: 'STF-001'}
];
const VALIDATION_CHECKS = [
  {scope: 'Request schema', rule: 'Zod schema on every POST body', status: 'Pass', note: 'Rejects unknown keys'},
  {scope: 'Response schema', rule: 'Typed client, shape checked in tests', status: 'Pass', note: 'Contract tests in CI'},
  {scope: 'Number coercion', rule: 'Amounts are integers in tambala', status: 'Pass', note: 'No float money'},
  {scope: 'Date handling', rule: 'ISO 8601 date-only for business dates', status: 'Review', note: 'Two endpoints echo timestamps'},
  {scope: 'Pagination', rule: 'Capped at 200 rows per request', status: 'Pass', note: 'Exports run server-side'},
  {scope: 'Error envelope', rule: '{ code, message, traceId }', status: 'Pass', note: 'Trace id logged in Sentry'}
];
const TIMEOUTS = [
  {route: '/applications', p50: 210, p95: 388, limit: 20000, breaches: 14},
  {route: '/customers', p50: 88, p95: 143, limit: 20000, breaches: 0},
  {route: '/repayments', p50: 164, p95: 264, limit: 20000, breaches: 1},
  {route: '/reports/export', p50: 380, p95: 640, limit: 60000, breaches: 3},
  {route: '/legacy/export', p50: 980, p95: 1240, limit: 20000, breaches: 19},
  {route: '/documents/sign', p50: 240, p95: 318, limit: 20000, breaches: 2},
  {route: '/auth/customer/login', p50: 142, p95: 198, limit: 15000, breaches: 11},
  {route: '/payments/mpamba/webhook', p50: 74, p95: 104, limit: 10000, breaches: 7}
];
const FAILED_REQUESTS = [
  {when: TODAY + ' 07:12', route: '/applications', code: 502, origin: 'Customer portal', count: 14, severity: 'Critical', status: 'Open', lane: 'Backend', owner: 'STF-001'},
  {when: TODAY + ' 07:05', route: '/payments/mpamba/webhook', code: 400, origin: 'TNM Mpamba', count: 7, severity: 'High', status: 'Open', lane: 'Integrations', owner: 'STF-001'},
  {when: TODAY + ' 06:22', route: '/legacy/export', code: 500, origin: 'Admin portal', count: 19, severity: 'High', status: 'Open', lane: 'Backend', owner: 'STF-001'},
  {when: addDays(TODAY, -1) + ' 21:04', route: '/auth/customer/login', code: 429, origin: 'Customer portal', count: 11, severity: 'Medium', status: 'Monitoring', lane: 'Auth', owner: 'STF-001'},
  {when: addDays(TODAY, -1) + ' 12:10', route: '/documents/sign', code: 403, origin: 'Admin portal', count: 2, severity: 'Medium', status: 'Resolved', lane: 'Storage', owner: 'STF-001'},
  {when: addDays(TODAY, -2) + ' 09:38', route: '/reports/export', code: 504, origin: 'Admin portal', count: 3, severity: 'Medium', status: 'Resolved', lane: 'Backend', owner: 'STF-001'}
];
const FE_ERRORS = [
  {when: TODAY + ' 07:14', page: '/apply', message: 'Unhandled promise rejection: 502 from /applications', count: 9, severity: 'Critical', status: 'Open', lane: 'Backend', owner: 'STF-001'},
  {when: TODAY + ' 06:51', page: '/rates', message: 'Failed to load image rates-table-2025.png', count: 2, severity: 'Medium', status: 'Open', lane: 'Website', owner: 'STF-003'},
  {when: addDays(TODAY, -1) + ' 18:02', page: '/contact', message: 'TypeError: cannot read property length of undefined', count: 3, severity: 'High', status: 'Resolved', lane: 'Website', owner: 'STF-001'},
  {when: addDays(TODAY, -2) + ' 14:40', page: '/portal/login', message: 'OTP request timed out after 15 s', count: 11, severity: 'High', status: 'Monitoring', lane: 'Auth', owner: 'STF-001'},
  {when: addDays(TODAY, -3) + ' 11:05', page: '/blog', message: 'Chunk load failed (network)', count: 1, severity: 'Low', status: 'Closed', lane: 'Website', owner: 'STF-005'},
  {when: addDays(TODAY, -4) + ' 08:12', page: '/', message: 'Font preload took longer than 1 s', count: 4, severity: 'Low', status: 'Resolved', lane: 'Website', owner: 'STF-009'}
];

/* ---------------- forms (section 11) ---------------- */
const FORMS = [
  {name: 'Contact form', endpoint: '/api/contact', submissions: 148, last: TODAY + ' 07:40', validation: 'Pass', status: 'Connected', errors7d: 1, owner: 'STF-009', lane: 'Website', severity: 'Low'},
  {name: 'Customer registration form', endpoint: '/api/register', submissions: 186, last: TODAY + ' 06:58', validation: 'Pass', status: 'Connected', errors7d: 2, owner: 'STF-003', lane: 'Auth', severity: 'High'},
  {name: 'Loan application form', endpoint: '/applications', submissions: 320, last: TODAY + ' 07:12', validation: 'Pass', status: 'Degraded', errors7d: 14, owner: 'STF-003', lane: 'Backend', severity: 'Critical'},
  {name: 'Loan calculator', endpoint: '/api/quote', submissions: 4820, last: TODAY + ' 08:02', validation: 'Pass', status: 'Connected', errors7d: 0, owner: 'STF-009', lane: 'Website', severity: 'Medium'},
  {name: 'Repayment submission', endpoint: '/repayments', submissions: 402, last: TODAY + ' 07:55', validation: 'Pass', status: 'Connected', errors7d: 1, owner: 'STF-005', lane: 'Backend', severity: 'High'}
];
const FORM_ERRORS = [
  {when: TODAY + ' 07:12', form: 'Loan application form', field: 'submit', reason: '502 from the applications endpoint', count: 14, severity: 'Critical', status: 'Open', lane: 'Backend', owner: 'STF-003'},
  {when: addDays(TODAY, -1) + ' 16:20', form: 'Customer registration form', field: 'phone', reason: 'Duplicate phone on two applications', count: 2, severity: 'Medium', status: 'Open', lane: 'Auth', owner: 'STF-003'},
  {when: addDays(TODAY, -2) + ' 11:48', form: 'Contact form', field: 'message', reason: 'Below the 20-character minimum', count: 1, severity: 'Low', status: 'Resolved', lane: 'Website', owner: 'STF-009'},
  {when: addDays(TODAY, -3) + ' 09:05', form: 'Loan application form', field: 'national_id', reason: 'Checksum failed on a 7-digit ID', count: 5, severity: 'Medium', status: 'Monitoring', lane: 'Backend', owner: 'STF-003'},
  {when: addDays(TODAY, -5) + ' 14:33', form: 'Repayment submission', field: 'reference', reason: 'Mobile money reference already used', count: 1, severity: 'Medium', status: 'Resolved', lane: 'Backend', owner: 'STF-005'}
];
const FORM_DAILY = [];
for(let i = 13; i >= 0; i--){
  FORM_DAILY.push({date: addDays(TODAY, -i), contact: 3 + (i % 5), register: 6 + (i % 7), apply: 11 + (i % 9),
    quote: 160 + ((i * 37) % 120), repay: 14 + (i % 6)});
}

/* ---------------- media and storage (section 12) ---------------- */
const IMAGES = [
  {name: 'hero-lilongwe.jpg', folder: '/images/hero', size: '842 KB', used: 6, optimised: true, owner: 'STF-009'},
  {name: 'branch-blantyre.jpg', folder: '/images/branches', size: '614 KB', used: 2, optimised: true, owner: 'STF-009'},
  {name: 'branch-mzuzu.jpg', folder: '/images/branches', size: '588 KB', used: 2, optimised: true, owner: 'STF-009'},
  {name: 'branch-zomba.jpg', folder: '/images/branches', size: '602 KB', used: 2, optimised: true, owner: 'STF-009'},
  {name: 'product-salary.jpg', folder: '/images/products', size: '318 KB', used: 3, optimised: true, owner: 'STF-003'},
  {name: 'product-business.jpg', folder: '/images/products', size: '344 KB', used: 3, optimised: true, owner: 'STF-003'},
  {name: 'airtel-money.png', folder: '/images/rails', size: '46 KB', used: 4, optimised: true, owner: 'STF-005'},
  {name: 'tnm-mpamba.png', folder: '/images/rails', size: '38 KB', used: 4, optimised: true, owner: 'STF-005'},
  {name: 'rates-table-2025.png', folder: '/images/content', size: '—', used: 1, optimised: false, owner: 'STF-003'},
  {name: 'team-lilongwe.jpg', folder: '/images/team', size: '1.2 MB', used: 1, optimised: false, owner: 'STF-009'},
  {name: 'og-default.jpg', folder: '/images/social', size: '212 KB', used: 14, optimised: true, owner: 'STF-009'},
  {name: 'favicon-32.png', folder: '/images/brand', size: '4 KB', used: 14, optimised: true, owner: 'STF-009'}
];
const BRAND_ASSETS = [
  {name: 'gfs-monogram.svg', kind: 'Logo', size: '12 KB', version: 'v4', updated: addDays(TODAY, -60), owner: 'STF-009'},
  {name: 'gfs-wordmark.svg', kind: 'Logo', size: '18 KB', version: 'v4', updated: addDays(TODAY, -60), owner: 'STF-009'},
  {name: 'favicon-32.png', kind: 'Icon', size: '4 KB', version: 'v4', updated: addDays(TODAY, -60), owner: 'STF-009'},
  {name: 'brand-guide-2026.pdf', kind: 'Guideline', size: '4.2 MB', version: 'v3', updated: addDays(TODAY, -120), owner: 'STF-004'}
];
const DOCUMENTS = [
  {name: 'loan-agreement-v4.pdf', bucket: 'documents', size: '412 KB', access: 'Signed URL', scans: 'Clean', owner: 'STF-003'},
  {name: 'national-id-template.pdf', bucket: 'templates', size: '88 KB', access: 'Staff only', scans: 'Clean', owner: 'STF-004'},
  {name: 'kyc-checklist.pdf', bucket: 'templates', size: '64 KB', access: 'Staff only', scans: 'Clean', owner: 'STF-004'},
  {name: 'customer-0004-id.jpg', bucket: 'kyc', size: '1.8 MB', access: 'Signed URL', scans: 'Clean', owner: 'STF-003'},
  {name: 'customer-0011-payslip.pdf', bucket: 'kyc', size: '620 KB', access: 'Signed URL', scans: 'Clean', owner: 'STF-003'},
  {name: 'customer-0019-id.jpg', bucket: 'kyc', size: '2.1 MB', access: 'Signed URL', scans: 'Clean', owner: 'STF-003'},
  {name: 'receipt-batch-oct.pdf', bucket: 'reports', size: '340 KB', access: 'Finance', scans: 'Clean', owner: 'STF-005'},
  {name: 'loan-terms-2025.pdf', bucket: 'documents', size: '—', access: 'Public', scans: 'Missing', owner: 'STF-009'}
];
const UPLOAD_CFG = [
  {rule: 'Maximum file size', value: '10 MB per file', note: 'Enforced in the storage policy'},
  {rule: 'Allowed image types', value: 'jpg, jpeg, png, webp, svg', note: 'MIME sniffed, not trusted'},
  {rule: 'Allowed documents', value: 'pdf only for KYC', note: 'Scanned before it is served'},
  {rule: 'Bulk upload', value: 'Disabled — one file at a time', note: 'Bulk requests are refused'},
  {rule: 'Virus scan', value: 'ClamAV on every upload', note: 'Quarantine bucket on failure'}
];
const FILE_ACCESS = [
  {bucket: 'kyc', read: 'Compliance, credit, assigned officer', write: 'Assigned officer', public: false},
  {bucket: 'documents', read: 'Any signed-in staff member', write: 'Credit and compliance', public: false},
  {bucket: 'templates', read: 'Any signed-in staff member', write: 'Administrator', public: false},
  {bucket: 'images', read: 'Everyone', write: 'Content editor', public: true},
  {bucket: 'reports', read: 'Finance and auditor', write: 'Finance', public: false}
];
const MISSING_FILES = [
  {path: '/documents/loan-terms-2025.pdf', referenced: '/products', status: 'Missing', since: addDays(TODAY, -4)},
  {path: '/images/content/rates-table-2025.png', referenced: '/rates', status: 'Missing', since: TODAY},
  {path: '/images/team/team-2024.jpg', referenced: '/about', status: 'Missing', since: addDays(TODAY, -18)},
  {path: '/images/branches/branch-mzuzu-old.jpg', referenced: '/contact', status: 'Orphaned', since: addDays(TODAY, -30)}
];
const STORAGE_USAGE = [
  {bucket: 'kyc', size: 268, files: 148},
  {bucket: 'documents', size: 62, files: 34},
  {bucket: 'images', size: 48, files: 42},
  {bucket: 'templates', size: 6, files: 8},
  {bucket: 'reports', size: 28, files: 19}
];

/* ---------------- performance (section 13) ---------------- */
const PAGE_PERF = [
  {page: '/', load: 1180, lcp: 1620, cls: 0.02, size: 412, score: 96},
  {page: '/products', load: 1340, lcp: 1840, cls: 0.04, size: 486, score: 93},
  {page: '/how-it-works', load: 1020, lcp: 1440, cls: 0.01, size: 318, score: 97},
  {page: '/rates', load: 1680, lcp: 2210, cls: 0.12, size: 512, score: 81},
  {page: '/apply', load: 2240, lcp: 3120, cls: 0.09, size: 604, score: 74},
  {page: '/portal/login', load: 1460, lcp: 1980, cls: 0.03, size: 288, score: 90},
  {page: '/contact', load: 1120, lcp: 1520, cls: 0.02, size: 264, score: 95},
  {page: '/blog', load: 1540, lcp: 2120, cls: 0.06, size: 720, score: 86},
  {page: '/about', load: 1080, lcp: 1480, cls: 0.02, size: 342, score: 96},
  {page: '/faq', load: 980, lcp: 1320, cls: 0.01, size: 226, score: 98},
  {page: '/terms', load: 860, lcp: 1180, cls: 0.01, size: 188, score: 99},
  {page: '/privacy', load: 880, lcp: 1220, cls: 0.01, size: 196, score: 99}
];
const RESOURCES = [
  {metric: 'CPU (api)', value: 34, unit: '%', note: '3 instances, autoscale at 70%'},
  {metric: 'Memory (api)', value: 61, unit: '%', note: 'Above the 55% target'},
  {metric: 'Database size', value: 412, unit: 'MB', note: 'Of 8 GB included'},
  {metric: 'Storage size', value: 412, unit: 'MB', note: 'Of 100 GB'},
  {metric: 'CDN bandwidth (30 d)', value: 84, unit: 'GB', note: 'Of 1 TB included'},
  {metric: 'Build minutes (30 d)', value: 412, unit: 'min', note: 'Of 25,000 included'}
];
const MOBILE_CHECKS = [
  {page: '/', result: 'Pass', note: '360 px, 390 px and 768 px checked'},
  {page: '/products', result: 'Pass', note: 'Product cards stack cleanly'},
  {page: '/rates', result: 'Review', note: 'Rate table overflows at 360 px'},
  {page: '/apply', result: 'Review', note: 'Form footer covered by the keyboard'},
  {page: '/portal/login', result: 'Pass', note: 'OTP input is 44 px tall'},
  {page: '/contact', result: 'Pass', note: 'Map loads without horizontal scroll'}
];
const AVAIL_HISTORY = UPTIME.map(u => ({date: u.date, uptime: u.uptime, downMin: u.downMin}));

/* ---------------- diagnostics (section 14) ---------------- */
const DIAG_TESTS = [
  {id: 'DGN-01', name: 'Website connection', target: 'https://goldenloan.mw', status: 'Pass', lastRun: TODAY + ' 08:10', ms: 118, detail: '200 OK, certificate valid for 66 more days'},
  {id: 'DGN-02', name: 'Backend connectivity', target: '/healthz', status: 'Pass', lastRun: TODAY + ' 08:10', ms: 61, detail: '3 of 3 instances responded'},
  {id: 'DGN-03', name: 'Supabase connectivity', target: 'glsvc-prod', status: 'Pass', lastRun: TODAY + ' 08:10', ms: 42, detail: 'Round trip 42 ms, pool 14 of 60'},
  {id: 'DGN-04', name: 'Authentication functions', target: 'otp-send, otp-verify', status: 'Fail', lastRun: TODAY + ' 08:09', ms: 0, detail: 'otp-send returned 503 from the SMS gateway'},
  {id: 'DGN-05', name: 'API endpoints', target: '14 routes', status: 'Pass', lastRun: TODAY + ' 08:09', ms: 264, detail: '12 healthy, 2 degraded (/applications, /legacy/export)'},
  {id: 'DGN-06', name: 'Storage access', target: 'kyc bucket', status: 'Pass', lastRun: TODAY + ' 08:08', ms: 128, detail: 'Signed upload and read both succeeded'},
  {id: 'DGN-07', name: 'External integrations', target: '10 services', status: 'Fail', lastRun: TODAY + ' 08:08', ms: 740, detail: 'TNM Mpamba credential expired; SMS gateway slow'},
  {id: 'DGN-08', name: 'DNS and TLS', target: 'goldenloan.mw', status: 'Pass', lastRun: TODAY + ' 08:08', ms: 34, detail: 'All records propagated, TLS 1.3 negotiated'}
];
const TROUBLESHOOT = [
  {priority: 'Critical', action: 'Rotate the TNM Mpamba key and re-run the collections callback test', owner: 'STF-001', section: 's8'},
  {priority: 'High', action: 'Raise the /applications write timeout and add a retry around the Supabase call', owner: 'STF-001', section: 's6'},
  {priority: 'High', action: 'Enable RLS on the settings table before the next deploy', owner: 'STF-001', section: 's7'},
  {priority: 'Medium', action: 'Renew the Africa’s Talking API key before it expires in 2 days', owner: 'STF-005', section: 's8'},
  {priority: 'Medium', action: 'Replace the two broken asset references on /rates and /products', owner: 'STF-009', section: 's4'}
];

/* ---------------- deployment (section 15) ---------------- */
const RELEASES = [
  {version: '2.14.3', when: TODAY, env: 'Production', status: 'Live', notes: 'Content editor, live rates page and connection console', by: 'STF-001', size: 'island'},
  {version: '2.14.2', when: addDays(TODAY, -2), env: 'Production', status: 'Superseded', notes: 'Fix the OTP resend timer', by: 'STF-001'},
  {version: '2.14.1', when: addDays(TODAY, -2), env: 'Staging', status: 'Superseded', notes: 'Branch hours content update', by: 'STF-009'},
  {version: '2.14.0', when: addDays(TODAY, -5), env: 'Production', status: 'Superseded', notes: 'New apply flow and calculator', by: 'STF-001'},
  {version: '2.13.6', when: addDays(TODAY, -8), env: 'Production', status: 'Rolled back', notes: 'Portal session refresh — rolled back after 40 minutes', by: 'STF-001'},
  {version: '2.13.4', when: addDays(TODAY, -16), env: 'Staging', status: 'Failed', notes: 'Build failed on a missing env var', by: 'STF-009'},
  {version: '2.13.3', when: addDays(TODAY, -19), env: 'Production', status: 'Superseded', notes: 'Image optimisation pass', by: 'STF-001'},
  {version: '2.13.2', when: addDays(TODAY, -24), env: 'Production', status: 'Superseded', notes: 'SEO metadata for product pages', by: 'STF-009'}
];
const ENV_CHECKS = [
  {key: 'SUPABASE_URL', environments: 'prod · staging · local', status: 'Set', note: 'Points at glsvc-prod'},
  {key: 'SUPABASE_SERVICE_ROLE_KEY', environments: 'prod only', status: 'Set', note: 'Never in the browser bundle'},
  {key: 'API_BASE_URL', environments: 'prod · staging · local', status: 'Set', note: 'api.goldenloan.mw/v1'},
  {key: 'TNM_MPAMBA_KEY', environments: 'prod', status: 'Expired', note: 'Expired yesterday'},
  {key: 'AT_API_KEY', environments: 'prod', status: 'Expiring', note: '2 days left'},
  {key: 'SENTRY_DSN', environments: 'prod · staging', status: 'Set', note: 'Client and server'},
  {key: 'FEATURE_LEGACY_EXPORT', environments: 'prod', status: 'Review', note: 'Still true in production'},
  {key: 'NODE_ENV', environments: 'prod · staging · local', status: 'Set', note: 'production / staging / development'}
];
const ROLLBACKS = [
  {version: '2.13.6', when: addDays(TODAY, -8) + ' 15:02', reason: 'Portal session refresh logged staff out', took: '1 m 48 s', by: 'STF-001', restored: '2.13.5'},
  {version: '2.12.9', when: addDays(TODAY, -46) + ' 12:20', reason: 'Repayment receipts rendered in the wrong currency', took: '2 m 05 s', by: 'STF-001', restored: '2.12.8'},
  {version: '2.11.4', when: addDays(TODAY, -78) + ' 09:40', reason: 'Customer portal looped on sign-in', took: '1 m 30 s', by: 'STF-001', restored: '2.11.3'}
];
const PRE_DEPLOY = [
  {check: 'Type check and lint', status: 'Pass', detail: 'No errors'},
  {check: 'Unit and contract tests', status: 'Pass', detail: '412 tests, 0 failures'},
  {check: 'Database migrations', status: 'Pass', detail: '1 pending, applied in staging'},
  {check: 'Environment variables', status: 'Fail', detail: 'TNM_MPAMBA_KEY expired'},
  {check: 'Bundle size budget', status: 'Pass', detail: '412 KB of 500 KB'},
  {check: 'Accessibility checks', status: 'Review', detail: '2 contrast warnings on /rates'}
];

/* ---------------- alerts and notifications (section 16) ---------------- */
const ALERTS = [
  {id: 'WAL-4101', kind: 'Website offline', severity: 'Critical', target: 'goldenloan.mw', raised: TODAY + ' 07:12', status: 'Open', owner: 'STF-001', lane: 'Website', channel: 'PagerDuty + email'},
  {id: 'WAL-4102', kind: 'Backend disconnection', severity: 'Critical', target: 'gls-api · instance 2', raised: TODAY + ' 07:05', status: 'Open', owner: 'STF-001', lane: 'Backend', channel: 'PagerDuty'},
  {id: 'WAL-4103', kind: 'Supabase connection failure', severity: 'High', target: 'glsvc-prod', raised: addDays(TODAY, -1) + ' 20:18', status: 'Monitoring', owner: 'STF-001', lane: 'Supabase', channel: 'Email'},
  {id: 'WAL-4104', kind: 'Authentication failure spike', severity: 'High', target: 'customer login', raised: TODAY + ' 07:20', status: 'Open', owner: 'STF-001', lane: 'Auth', channel: 'PagerDuty'},
  {id: 'WAL-4105', kind: 'API error rate', severity: 'High', target: '/applications', raised: TODAY + ' 07:12', status: 'Open', owner: 'STF-003', lane: 'Backend', channel: 'Slack + email'},
  {id: 'WAL-4106', kind: 'Integration failure', severity: 'Critical', target: 'TNM Mpamba', raised: TODAY + ' 06:40', status: 'Open', owner: 'STF-001', lane: 'Integrations', channel: 'PagerDuty'},
  {id: 'WAL-4107', kind: 'SSL certificate expiry', severity: 'Low', target: 'goldenloan.mw', raised: addDays(TODAY, -2) + ' 09:00', status: 'Closed', owner: 'STF-001', lane: 'Website', channel: 'Email'},
  {id: 'WAL-4108', kind: 'Deployment failure', severity: 'High', target: 'DEP-2406', raised: addDays(TODAY, -16) + ' 16:48', status: 'Resolved', owner: 'STF-009', lane: 'Backend', channel: 'Slack'},
  {id: 'WAL-4109', kind: 'Storage quota', severity: 'Medium', target: 'kyc bucket', raised: addDays(TODAY, -5) + ' 13:22', status: 'Resolved', owner: 'STF-001', lane: 'Storage', channel: 'Email'},
  {id: 'WAL-4110', kind: 'DNS record missing', severity: 'Medium', target: 'status.goldenloan.mw', raised: addDays(TODAY, -3) + ' 10:14', status: 'Open', owner: 'STF-001', lane: 'Website', channel: 'Email'}
];
const ALERT_RULES = [
  {kind: 'Website offline', condition: '2 failed checks in a row', channel: 'PagerDuty + email', recipients: 'On-call, administrator', on: true},
  {kind: 'Backend disconnection', condition: '/healthz not 200 for 90 s', channel: 'PagerDuty', recipients: 'On-call', on: true},
  {kind: 'Supabase connection failure', condition: '3 failed probes in 5 minutes', channel: 'Email', recipients: 'Administrator', on: true},
  {kind: 'Authentication failure rate', condition: 'More than 5% of attempts in 15 minutes', channel: 'PagerDuty', recipients: 'On-call', on: true},
  {kind: 'API error rate', condition: 'More than 2% of calls in 5 minutes', channel: 'Slack + email', recipients: 'Engineering', on: true},
  {kind: 'Integration failure', condition: 'Two failed tests in a row', channel: 'PagerDuty', recipients: 'On-call', on: true},
  {kind: 'SSL certificate expiry', condition: '30, 14 and 7 days before expiry', channel: 'Email', recipients: 'Administrator', on: true},
  {kind: 'Deployment failure', condition: 'Any non-zero build exit', channel: 'Slack', recipients: 'Engineering', on: true},
  {kind: 'Performance budget breach', condition: 'LCP above 2.5 s on any page', channel: 'Email', recipients: 'Content editor', on: false}
];

/* ---------------- access and permissions (section 17) ---------------- */
const WM_CAPS = ['Manage website content', 'Edit branding and theme', 'Configure integrations', 'Deploy releases',
  'Run connection tests', 'Change system configuration', 'Approve configuration changes'];
const WM_ROLES = ['Super Admin', 'Administrator', 'Content Editor', 'Finance', 'Auditor', 'Customer Care'];
const WM_PERMS = {
  'Super Admin': [1, 1, 1, 1, 1, 1, 1],
  'Administrator': [1, 1, 1, 1, 1, 1, 0],
  'Content Editor': [1, 1, 0, 0, 0, 0, 0],
  'Finance': [0, 0, 0, 0, 1, 0, 0],
  'Auditor': [0, 0, 0, 0, 1, 0, 0],
  'Customer Care': [0, 0, 0, 0, 0, 0, 0]
};
const WM_ROLE_STAFF = {'Super Admin': 'STF-001', 'Administrator': 'STF-009', 'Content Editor': 'STF-005',
  'Finance': 'STF-006', 'Auditor': 'STF-004', 'Customer Care': 'STF-008'};
const WM_APPROVALS = [
  {id: 'APR-701', change: 'Custom domain switch to goldenloan.mw', requested: 'STF-001', approver: 'STF-001', when: addDays(TODAY, -30), status: 'Approved'},
  {id: 'APR-702', change: 'Enable public application form', requested: 'STF-009', approver: 'STF-001', when: addDays(TODAY, -12), status: 'Approved'},
  {id: 'APR-703', change: 'Rotate SMTP and SMS credentials', requested: 'STF-001', approver: 'STF-004', when: addDays(TODAY, -4), status: 'Approved'},
  {id: 'APR-704', change: 'Publish the new rates page', requested: 'STF-003', approver: '—', when: TODAY, status: 'Awaiting approval'}
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

/* ---------------- reports (section 18) ---------------- */
const WM_REPORTS = [
  {key: 'avail', title: 'Website Availability Report', desc: 'Fourteen days of checks, downtime and incidents.', rows: 14, cols: 6},
  {key: 'conn', title: 'Connection Health Report', desc: 'Every connection point, its state and what it depends on.', rows: 24, cols: 6},
  {key: 'api', title: 'API Performance Report', desc: 'Route-level volume, p95 latency and error counts.', rows: 14, cols: 7},
  {key: 'db', title: 'Database Connectivity Report', desc: 'Supabase health, tables, RLS and query timings.', rows: 12, cols: 6},
  {key: 'auth', title: 'Authentication Service Report', desc: 'Sign-in, registration and recovery services.', rows: 7, cols: 6},
  {key: 'deploy', title: 'Deployment Report', desc: 'Releases, environment and rollbacks.', rows: 10, cols: 7},
  {key: 'errors', title: 'Website Error Report', desc: 'Page and frontend errors with counts.', rows: 11, cols: 6},
  {key: 'integrity', title: 'Integration Reliability Report', desc: 'Uptime, latency and credential state per service.', rows: 10, cols: 7}
];

/* ---------------- derived statistics ---------------- */
function wmStats(){
  const up = UPTIME.length ? sum(UPTIME, u => u.uptime) / UPTIME.length : 100;
  const downMin = sum(UPTIME, u => u.downMin);
  const openAlerts = ALERTS.filter(a => a.status === 'Open');
  const critical = ALERTS.filter(a => a.severity === 'Critical' && a.status !== 'Closed' && a.status !== 'Resolved');
  const failing = INTEGRATIONS.filter(i => i.status === 'Failing' || i.status === 'Degraded');
  const endpointsDown = API_ENDPOINTS.filter(e => e.status === 'Failing');
  const rlsGap = TABLES.filter(t => t.rls !== 'Enabled');
  const connErrors = sum(SERVER_ERRORS, e => e.count) + sum(FE_ERRORS, e => e.count) + sum(FORM_ERRORS, e => e.count);
  const avgP95 = r1(sum(API_ENDPOINTS, e => e.p95) / API_ENDPOINTS.length);
  const score = Math.round(
    clamp(up, 0, 100) * 0.26 +
    pct(INTEGRATIONS.filter(i => i.status === 'Connected').length, INTEGRATIONS.length) * 0.18 +
    clamp(100 - critical.length * 12, 0, 100) * 0.16 +
    pct(API_ENDPOINTS.filter(e => e.status !== 'Failing' && e.status !== 'Degraded').length, API_ENDPOINTS.length) * 0.14 +
    pct(TABLES.filter(t => t.rls === 'Enabled').length, TABLES.length) * 0.12 +
    clamp(100 - connErrors / 3, 0, 100) * 0.14
  );
  return {up: r1(up), downMin, openAlerts, critical, failing, endpointsDown, rlsGap, connErrors, avgP95, score};
}
</script>
