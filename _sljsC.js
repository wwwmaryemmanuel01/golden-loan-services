<script>
/* ============================================================
   SALARIES, EXPENSES & OPERATING CHARGES (3/8)
   The data universe: settings, staff, salary records, payroll
   periods and lines, allowances, deductions, payslips, expense
   claims, business expenses, system operating charges, recurring
   billing, categories and departments, budgets, payments,
   approvals, the ledger, suppliers, notifications, permissions,
   the database and the reports.
   ============================================================ */

/* ---------------- settings ---------------- */
const SE_SET_DEFAULTS = {
  currency: 'MWK', currencyLabel: 'Malawian Kwacha (MWK)', currencySymbol: 'MK', decimals: 2,
  payrollPrefix: 'PRL', payslipPrefix: 'PSP', claimPrefix: 'CLM', expensePrefix: 'EXP',
  paymentPrefix: 'PAY', supplierPrefix: 'SUP', salaryPrefix: 'SAL',
  payDay: 28, cutOffDay: 24, payFrequency: 'Monthly', payMode: 'Bank transfer',
  payeBands: 'First 100,000 at 0%; 100,001–500,000 at 25%; above 500,000 at 30%',
  pensionEmployeePct: 5, pensionEmployerPct: 10, nhimaEmployeePct: 1.5, nhimaEmployerPct: 1.5,
  overtimeRate: 1.5, harvestBonusPct: 8,
  salaryApproval: 150000, highValueApproval: 1000000, budgetOverrideThreshold: 2000000,
  claimLimit: 250000, receiptRequiredAbove: 25000, expenseLimit: 500000,
  payrollBudget: 30000000, systemBudget: 2900000, businessBudget: 6000000,
  monthlyOperatingBudget: 39000000, budgetYear: '2026',
  duplicateWindow: 10, reminderDays: 7, approvalSlaHours: 48,
  notifySms: true, notifyEmail: true,
  salaryRule: 'A salary record is effective from its stated date; an adjustment above the approval limit needs a second signature',
  claimRule: 'A claim above MK 25,000 must carry a receipt; a claim above MK 250,000 needs a manager and a finance signature',
  payrollRule: 'Payroll is locked on the cut-off day, approved once, paid once, and may never be edited after payment',
  expenseRule: 'An expense is charged to a category and a cost centre; anything above the category limit needs a budget override',
  recurringRule: 'A recurring charge renews automatically unless it is cancelled before the renewal date',
  securityRule: 'Salary figures are visible to payroll, finance and audit only; every read is written to the access log'
};
const SE_SET = Object.assign({}, SE_SET_DEFAULTS);
const seM = v => money(v);
const seNetLabel = v => Math.abs(v) < 1 ? 'Balanced at MK 0' : 'Out by MK ' + num(Math.abs(v));

/* ---------------- departments ---------------- */
const SE_DEPARTMENTS = [
  {name: 'Credit', head: 'STF-003', costCentre: 'CC-100', budget: 6300000},
  {name: 'Collections', head: 'STF-005', costCentre: 'CC-110', budget: 3750000},
  {name: 'Finance', head: 'STF-007', costCentre: 'CC-200', budget: 4950000},
  {name: 'Customer Care', head: 'STF-008', costCentre: 'CC-120', budget: 2940000},
  {name: 'Operations', head: 'STF-004', costCentre: 'CC-130', budget: 3360000},
  {name: 'Information Technology', head: 'STF-009', costCentre: 'CC-210', budget: 4740000},
  {name: 'Human Resources', head: 'STF-006', costCentre: 'CC-220', budget: 2160000},
  {name: 'Administration', head: 'STF-001', costCentre: 'CC-230', budget: 1620000}
];
const SE_DEPT_NAMES = SE_DEPARTMENTS.map(d => d.name);

/* ---------------- staff and salary records ---------------- */
const SE_ROLE_DEPT = {
  'Loan Officer': 'Credit', 'Head of Credit': 'Credit', 'Credit Analyst': 'Credit',
  'Collections Officer': 'Collections', 'Cashier': 'Finance', 'Customer Care': 'Customer Care',
  'Administrator': 'Information Technology', 'Finance Manager': 'Finance', 'Operations Officer': 'Operations',
  'Payroll Officer': 'Finance', 'IT Support': 'Information Technology', 'HR Officer': 'Human Resources',
  'Compliance Officer': 'Credit', 'Marketing Officer': 'Administration', 'Driver': 'Administration',
  'Receptionist': 'Administration', 'Internal Auditor': 'Finance', 'Data Analyst': 'Information Technology'
};
const SE_EXTRA_ROLES = ['Finance Manager', 'Operations Officer', 'Payroll Officer', 'IT Support', 'HR Officer',
  'Compliance Officer', 'Marketing Officer', 'Driver', 'Receptionist', 'Internal Auditor', 'Data Analyst'];
const SE_STAFF = [];
STAFF.forEach((s, i) => {
  SE_STAFF.push({id: s.id, name: s.name, role: s.role, dept: SE_ROLE_DEPT[s.role] || 'Operations',
    region: s.branch === 'Head office' ? 'Lilongwe' : s.branch, branch: s.branch,
    employment: i === 8 ? 'Contract' : i % 6 === 5 ? 'Probation' : 'Permanent',
    joined: addMonths(TODAY, -(18 + i * 5)), status: 'Active',
    tin: 'TIN-' + pad(300100 + i, 6), bank: ['FDH Bank', 'National Bank', 'Standard Bank', 'NBS Bank'][i % 4],
    account: '10' + pad(ri(100000, 999999), 6), pensionNo: 'PN-' + pad(7100 + i, 5),
    phone: '+265 99' + ri(100, 999) + ' ' + pad(ri(1000, 9999), 4),
    email: s.name.toLowerCase().replace(/[^a-z]+/g, '.') + '@goldenloan.mw'});
});
for(let i = 0; i < 33; i++){
  const role = SE_EXTRA_ROLES[i % SE_EXTRA_ROLES.length];
  const name = NAMES[(i * 3 + 11) % NAMES.length];
  SE_STAFF.push({id: 'STF-' + pad(10 + i, 3), name, role, dept: SE_ROLE_DEPT[role] || 'Operations',
    region: ['Lilongwe', 'Blantyre', 'Mzuzu', 'Zomba'][i % 4],
    branch: ['Lilongwe', 'Blantyre', 'Mzuzu', 'Zomba'][i % 4],
    employment: i % 9 === 4 ? 'Contract' : i % 13 === 7 ? 'Probation' : 'Permanent',
    joined: addMonths(TODAY, -(3 + (i * 4) % 60)), status: i === 12 ? 'Suspended' : 'Active',
    tin: 'TIN-' + pad(301000 + i, 6), bank: ['FDH Bank', 'National Bank', 'Standard Bank', 'NBS Bank'][i % 4],
    account: '10' + pad(ri(100000, 999999), 6), pensionNo: 'PN-' + pad(7200 + i, 5),
    phone: '+265 88' + ri(100, 999) + ' ' + pad(ri(1000, 9999), 4),
    email: name.toLowerCase().replace(/[^a-z]+/g, '.') + i + '@goldenloan.mw'});
}
const SE_STAFF_BY_ID = Object.fromEntries(SE_STAFF.map(s => [s.id, s]));
const seStaffName = id => (SE_STAFF_BY_ID[id] || {}).name || '—';
const SE_BASIC = {
  'Head of Credit': 1450000, 'Finance Manager': 1380000, 'Administrator': 1250000, 'Internal Auditor': 980000,
  'Loan Officer': 720000, 'Credit Analyst': 690000, 'Payroll Officer': 640000, 'Operations Officer': 620000,
  'Compliance Officer': 610000, 'Data Analyst': 590000, 'Collections Officer': 540000, 'HR Officer': 520000,
  'IT Support': 500000, 'Cashier': 460000, 'Marketing Officer': 430000, 'Customer Care': 380000,
  'Receptionist': 330000, 'Driver': 290000
};
const SE_SALARIES = SE_STAFF.map((s, i) => {
  const basic = Math.round(((SE_BASIC[s.role] || 420000) + (i % 5) * 15000) / 500) * 500;
  const housing = Math.round(basic * 0.12 / 500) * 500;
  const transport = Math.round(basic * 0.08 / 500) * 500;
  const comm = 25000 + (i % 3) * 5000;
  const meal = 30000;
  const allowances = {Transport: transport, Housing: housing, Communication: comm, Meal: meal};
  const allowanceTotal = sum(Object.values(allowances));
  const gross = basic + allowanceTotal;
  const paye = Math.round(Math.max(0, Math.min(gross - 100000, 400000)) * 0.25 + Math.max(0, gross - 500000) * 0.30);
  const pension = Math.round(basic * SE_SET.pensionEmployeePct / 100);
  const nhima = Math.round(basic * SE_SET.nhimaEmployeePct / 100);
  const loanDeduction = i % 7 === 3 ? 60000 : 0;
  const advance = i % 11 === 5 ? 40000 : 0;
  const deductions = paye + pension + nhima + loanDeduction + advance;
  return {
    id: SE_SET.salaryPrefix + '-' + pad(1001 + i, 4), staff: s.id, basic,
    frequency: s.employment === 'Contract' ? 'Contractual' : 'Monthly',
    effective: addMonths(TODAY, -(2 + (i % 14))), review: addMonths(TODAY, 6 - (i % 6)),
    allowances, allowanceTotal, gross, paye, pension, nhima, loanDeduction, advance,
    deductions, net: gross - deductions, currency: 'MWK',
    status: s.status === 'Suspended' ? 'Suspended' : i % 17 === 8 ? 'Pending approval' : 'Active',
    bank: s.bank, account: s.account, taxId: s.tin, pensionNo: s.pensionNo,
    band: s.role.indexOf('Head') === 0 || s.role === 'Administrator' ? 'Management' : s.employment === 'Contract' ? 'Contract' : 'Standard',
    lastPayment: i % 13 === 4 ? 'Pending' : 'Paid',
    region: s.region, dept: s.dept,
    lane: 'Salaries', severity: 'Low', owner: 'STF-007', region2: s.region
  };
});
const SE_SAL_BY_ID = Object.fromEntries(SE_SALARIES.map(s => [s.id, s]));
const seSalOf = id => SE_SALARIES.find(s => s.staff === id);
const SE_SALARY_TOTAL = sum(SE_SALARIES, s => s.basic);
const SE_ALLOWANCE_TOTAL = sum(SE_SALARIES, s => s.allowanceTotal);
const SE_DEDUCTION_TOTAL = sum(SE_SALARIES, s => s.deductions);
const SE_NET_TOTAL = sum(SE_SALARIES, s => s.net);

/* salary adjustments */
const SE_ADJ_TYPE = ['Increase', 'Reduction'];
const SE_ADJUSTMENTS = [];
for(let i = 0; i < 14; i++){
  const sal = SE_SALARIES[(i * 5 + 3) % SE_SALARIES.length];
  const type = i % 3 === 0 ? 'Reduction' : 'Increase';
  const delta = type === 'Increase' ? Math.round(sal.basic * (0.04 + rnd() * 0.1) / 500) * 500
    : -Math.round(sal.basic * (0.02 + rnd() * 0.04) / 500) * 500;
  SE_ADJUSTMENTS.push({
    id: 'ADJ-' + pad(3100 + i, 4), salary: sal.id, staff: sal.staff, when: addDays(TODAY, -(6 + i * 9)),
    type, from: sal.basic, to: sal.basic + delta, delta, effective: addMonths(TODAY, -(i % 5)),
    reason: type === 'Increase' ? ['Annual review', 'Promotion', 'Market alignment', 'Extra responsibility'][i % 4]
      : ['Unpaid leave', 'Role re-graded', 'Attendance', 'Contract renegotiated'][i % 4],
    by: 'STF-007', approver: 'STF-009',
    status: i % 5 === 0 ? 'Pending approval' : i % 7 === 3 ? 'Rejected' : 'Approved',
    lane: 'Salaries', severity: 'Low', owner: 'STF-007', region: sal.region
  });
}

/* ---------------- payroll ---------------- */
const SE_PAYROLL = [];
const SE_PAYROLL_LINES = [];
const sePayPeriods = ['2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10'];
sePayPeriods.forEach((p, pi) => {
  const staffCount = SE_STAFF.filter(s => s.status === 'Active').length - (pi % 3);
  const gross = SE_SALARY_TOTAL + pi * 18000;
  const allowances = SE_ALLOWANCE_TOTAL + pi * 9000;
  const bonuses = pi === 4 ? 620000 : pi === 2 ? 310000 : 0;
  const deductions = SE_DEDUCTION_TOTAL + pi * 7000;
  const net = gross + bonuses - deductions;
  const status = pi === 5 ? 'Pending approval' : 'Paid';
  SE_PAYROLL.push({
    id: SE_SET.payrollPrefix + '-' + p.slice(2, 7).replace('-', ''), period: p,
    label: monthLabel(p), from: p + '-01', to: p + '-' + (pi === 5 ? '31' : '30'),
    payDate: p + '-' + pad(SE_SET.payDay, 2), cutOff: p + '-' + pad(SE_SET.cutOffDay, 2),
    staffCount, gross, allowances, bonuses, deductions, net,
    employerPension: Math.round(sum(SE_SALARIES, s => s.basic) * SE_SET.pensionEmployerPct / 100),
    status, approvedBy: status === 'Paid' ? 'STF-009' : '',
    paidOn: status === 'Paid' ? p + '-' + pad(SE_SET.payDay, 2) : '',
    reference: status === 'Paid' ? 'PAY-' + pad(5600 + pi, 5) : '',
    lane: 'Payroll', severity: status === 'Paid' ? 'Low' : 'Medium', owner: 'STF-007', region: 'Lilongwe'
  });
});
const SE_OPEN_PERIOD = SE_PAYROLL[SE_PAYROLL.length - 1];
SE_STAFF.filter(s => s.status === 'Active').forEach((s, i) => {
  const sal = seSalOf(s.id);
  if(!sal) return;
  const bonus = i % 9 === 2 ? 120000 : 0;
  const status = i % 17 === 5 ? 'Failed' : i % 11 === 7 ? 'Pending' : 'Pending';
  SE_PAYROLL_LINES.push({
    id: SE_OPEN_PERIOD.id + '-' + pad(i + 1, 3), payroll: SE_OPEN_PERIOD.id, staff: s.id,
    gross: sal.gross, allowances: sal.allowanceTotal, bonus, deductions: sal.deductions,
    net: sal.gross + bonus - sal.deductions, status,
    reference: status === 'Failed' ? '' : 'PAY-' + pad(5900 + i, 5),
    method: i % 6 === 4 ? 'Mobile money' : 'Bank transfer',
    failure: status === 'Failed' ? 'Beneficiary account name did not match the payroll record' : '',
    lane: 'Payroll', severity: status === 'Failed' ? 'High' : 'Low', owner: 'STF-007', region: s.region
  });
});

/* ---------------- allowances ---------------- */
const SE_ALLOWANCE_TYPES = [
  {type: 'Transport', basis: 'Per month', rate: '8% of basic', eligibility: 'Every employee', approval: 'Automatic', taxable: 'No'},
  {type: 'Housing', basis: 'Per month', rate: '12% of basic', eligibility: 'Permanent staff', approval: 'Payroll officer', taxable: 'No'},
  {type: 'Communication', basis: 'Per month', rate: 'MK 25,000 – 35,000', eligibility: 'Every employee', approval: 'Automatic', taxable: 'No'},
  {type: 'Meal', basis: 'Per month', rate: 'MK 30,000', eligibility: 'Every employee', approval: 'Automatic', taxable: 'Yes'},
  {type: 'Travel', basis: 'Per trip', rate: 'Actual, capped at MK 150,000', eligibility: 'Approved travel', approval: 'Line manager', taxable: 'No'},
  {type: 'Overtime', basis: 'Per hour', rate: '1.5× the hourly rate', eligibility: 'Non-management', approval: 'Line manager', taxable: 'Yes'},
  {type: 'Performance bonus', basis: 'Per quarter', rate: 'Up to 8% of gross', eligibility: 'Target met', approval: 'Management', taxable: 'Yes'},
  {type: 'Commission', basis: 'Per collection', rate: '0.5% of the amount collected', eligibility: 'Collections staff', approval: 'Head of Credit', taxable: 'Yes'},
  {type: 'Other approved benefit', basis: 'Ad hoc', rate: 'As approved', eligibility: 'By exception', approval: 'Finance manager', taxable: 'Varies'}
];
const SE_ALLOWANCE_LINES = [];
SE_SALARIES.forEach((sal, i) => {
  Object.keys(sal.allowances).forEach((k, ki) => {
    SE_ALLOWANCE_LINES.push({
      id: 'ALW-' + pad(4100 + SE_ALLOWANCE_LINES.length, 4), staff: sal.staff, salary: sal.id,
      type: k, amount: sal.allowances[k], period: SE_OPEN_PERIOD.period,
      basis: (SE_ALLOWANCE_TYPES.find(t => t.type === k) || {}).basis || 'Per month',
      status: sal.status === 'Suspended' ? 'On hold' : i % 13 === 6 ? 'Pending' : 'Approved',
      approvedBy: i % 13 === 6 ? '' : 'STF-007', when: SE_OPEN_PERIOD.from,
      lane: 'Allowances', severity: 'Low', owner: 'STF-007', region: sal.region
    });
  });
});
const SE_ALLOWANCE_HISTORY = SE_ALLOWANCE_TYPES.map((t, i) => ({
  when: addDays(TODAY, -(8 + i * 6)), type: t.type, change: i % 3 === 0 ? 'Rate increased' : 'Eligibility widened',
  from: i % 2 ? 'MK 20,000' : 'Permanent staff', to: i % 2 ? 'MK 25,000' : 'Every employee', by: 'STF-009',
  lane: 'Allowances', severity: 'Low', owner: 'STF-009', region: 'Lilongwe'
}));

/* ---------------- deductions and statutory ---------------- */
const SE_DEDUCTIONS = [
  {type: 'PAYE (income tax)', basis: 'Statutory', rule: SE_SET.payeBands, remitTo: 'Malawi Revenue Authority',
    frequency: 'Monthly', amount: sum(SE_SALARIES, s => s.paye), status: 'Paid', dueDay: 14},
  {type: 'Pension — employee', basis: 'Statutory', rule: SE_SET.pensionEmployeePct + '% of basic',
    remitTo: 'NICO Pension', frequency: 'Monthly', amount: sum(SE_SALARIES, s => s.pension), status: 'Paid', dueDay: 14},
  {type: 'Pension — employer', basis: 'Statutory', rule: SE_SET.pensionEmployerPct + '% of basic',
    remitTo: 'NICO Pension', frequency: 'Monthly', amount: Math.round(sum(SE_SALARIES, s => s.basic) * SE_SET.pensionEmployerPct / 100),
    status: 'Paid', dueDay: 14},
  {type: 'NHIMA — employee', basis: 'Statutory', rule: SE_SET.nhimaEmployeePct + '% of basic',
    remitTo: 'NHIMA', frequency: 'Monthly', amount: sum(SE_SALARIES, s => s.nhima), status: 'Pending', dueDay: 14},
  {type: 'Staff loan recovery', basis: 'Authorised', rule: 'Fixed instalment on the approved schedule',
    remitTo: 'Staff loan book', frequency: 'Monthly', amount: sum(SE_SALARIES, s => s.loanDeduction), status: 'Paid', dueDay: 28},
  {type: 'Salary advance recovery', basis: 'Authorised', rule: 'Repayable over three months',
    remitTo: 'Salary advance register', frequency: 'Monthly', amount: sum(SE_SALARIES, s => s.advance), status: 'Paid', dueDay: 28},
  {type: 'Welfare fund', basis: 'Voluntary', rule: 'MK 5,000 a month where signed',
    remitTo: 'Staff welfare committee', frequency: 'Monthly', amount: 9 * 5000, status: 'Paid', dueDay: 28}
];
const SE_STATUTORY = [
  {id: 'STA-2609-A', item: 'PAYE', period: '2026-09', amount: sum(SE_SALARIES, s => s.paye),
   due: '2026-10-14', paid: '2026-10-12', reference: 'MRA-99120', status: 'Paid', body: 'Malawi Revenue Authority'},
  {id: 'STA-2609-B', item: 'Pension', period: '2026-09',
   amount: Math.round(sum(SE_SALARIES, s => s.pension) + sum(SE_SALARIES, s => s.basic) * SE_SET.pensionEmployerPct / 100),
   due: '2026-10-14', paid: '2026-10-13', reference: 'NICO-4410', status: 'Paid', body: 'NICO Pension'},
  {id: 'STA-2609-C', item: 'NHIMA', period: '2026-09', amount: sum(SE_SALARIES, s => s.nhima) * 2,
   due: '2026-10-14', paid: '', reference: '', status: 'Overdue', body: 'NHIMA'},
  {id: 'STA-2610-A', item: 'PAYE', period: '2026-10', amount: sum(SE_SALARIES, s => s.paye),
   due: '2026-11-14', paid: '', reference: '', status: 'Pending', body: 'Malawi Revenue Authority'},
  {id: 'STA-2610-B', item: 'Pension', period: '2026-10',
   amount: Math.round(sum(SE_SALARIES, s => s.pension) + sum(SE_SALARIES, s => s.basic) * SE_SET.pensionEmployerPct / 100),
   due: '2026-11-14', paid: '', reference: '', status: 'Pending', body: 'NICO Pension'},
  {id: 'STA-2610-C', item: 'NHIMA', period: '2026-10', amount: sum(SE_SALARIES, s => s.nhima) * 2,
   due: '2026-11-14', paid: '', reference: '', status: 'Pending', body: 'NHIMA'}
];
const SE_DEDUCTION_RULES = [
  {rule: 'PAYE follows the published bands', detail: SE_SET.payeBands, status: 'Enforced'},
  {rule: 'Pension is 5% employee and 10% employer', detail: 'On basic salary only', status: 'Enforced'},
  {rule: 'NHIMA is 1.5% employee and 1.5% employer', detail: 'On basic salary', status: 'Enforced'},
  {rule: 'A deduction may not exceed a third of gross', detail: 'Except a statutory deduction', status: 'Enforced'},
  {rule: 'Staff loan recovery stops at zero balance', detail: 'Checked before each payroll', status: 'Enforced'},
  {rule: 'An advance is recovered over three months', detail: 'No advance while one is running', status: 'Enforced'}
];
const SE_PAYROLL_CHECKS = () => [
  {check: 'Every active staff member has a salary record', value: SE_STAFF.filter(s => s.status === 'Active' && !seSalOf(s.id)).length + ' without one',
   status: SE_STAFF.some(s => s.status === 'Active' && !seSalOf(s.id)) ? 'Fail' : 'Pass'},
  {check: 'Net salary equals gross less deductions', value: seNetLabel(sum(SE_SALARIES, s => s.gross - s.deductions - s.net)),
   status: Math.abs(sum(SE_SALARIES, s => s.gross - s.deductions - s.net)) < 1 ? 'Pass' : 'Fail'},
  {check: 'Payroll total matches the salary records', value: seM(SE_SALARY_TOTAL), status: 'Pass'},
  {check: 'Statutory remittances are up to date', value: SE_STATUTORY.filter(s => s.status === 'Overdue').length + ' overdue',
   status: SE_STATUTORY.some(s => s.status === 'Overdue') ? 'Fail' : 'Pass'},
  {check: 'Deductions never exceed a third of gross', value: SE_SALARIES.filter(s => s.deductions > s.gross / 3).length + ' above',
   status: SE_SALARIES.some(s => s.deductions > s.gross / 3) ? 'Fail' : 'Pass'},
  {check: 'The payroll period is locked before payment', value: 'Cut-off ' + SE_OPEN_PERIOD.cutOff, status: 'Pass'},
  {check: 'Row-level security on the payroll tables', value: SE_DB_TABLES.filter(t => t.rls !== 'Enabled').length + ' table without a policy',
   status: SE_DB_TABLES.some(t => t.rls !== 'Enabled') ? 'Fail' : 'Pass'}
];

/* ---------------- payslips ---------------- */
const SE_PAYSLIPS = [];
['2026-09', '2026-08', '2026-07'].forEach((p, pi) => {
  const period = SE_PAYROLL.find(x => x.period === p);
  SE_STAFF.slice(0, 20).forEach((s, i) => {
    const sal = seSalOf(s.id);
    if(!sal || !period) return;
    SE_PAYSLIPS.push({
      id: SE_SET.payslipPrefix + '-' + p.slice(2, 7).replace('-', '') + '-' + pad(i + 1, 3),
      period: p, payroll: period.id, staff: s.id, gross: sal.gross, allowances: sal.allowanceTotal,
      bonus: i % 11 === 3 ? 80000 : 0, paye: sal.paye, pension: sal.pension, nhima: sal.nhima,
      other: sal.loanDeduction + sal.advance, net: sal.net, paidOn: period.payDate,
      reference: 'PAY-' + pad(5300 + pi * 20 + i, 5),
      status: i % 19 === 7 ? 'Corrected' : 'Issued',
      delivery: i % 4 === 0 ? 'Printed' : i % 3 === 0 ? 'SMS' : 'Email',
      lane: 'Payslips', severity: 'Low', owner: 'STF-007', region: s.region
    });
  });
});
const SE_PAYSLIP_CORRECTIONS = [
  {id: 'PSC-118', payslip: SE_PAYSLIPS[2].id, when: addDays(TODAY, -4) + ' 10:12', field: 'Housing allowance',
   from: 'MK 66,000', to: 'MK 78,000', reason: 'The grade was entered from the old band', by: 'STF-007', approver: 'STF-009',
   status: 'Approved', lane: 'Payslips', severity: 'Low', owner: 'STF-007', region: 'Lilongwe'},
  {id: 'PSC-117', payslip: SE_PAYSLIPS[14].id, when: addDays(TODAY, -9) + ' 15:40', field: 'Staff loan deduction',
   from: 'MK 75,000', to: 'MK 60,000', reason: 'The instalment was the closing balance', by: 'STF-007', approver: 'STF-009',
   status: 'Approved', lane: 'Payslips', severity: 'Low', owner: 'STF-007', region: 'Blantyre'}
];
const SE_PAYSLIP_PERMS = [
  {role: 'Payroll Officer', scope: 'Every payslip', format: 'PDF', reason: 'Runs the payroll'},
  {role: 'Finance Manager', scope: 'Every payslip', format: 'PDF, Excel', reason: 'Approves the payroll'},
  {role: 'Internal Auditor', scope: 'Every payslip', format: 'PDF', reason: 'Audit, read only'},
  {role: 'Line manager', scope: 'Their own team', format: 'PDF', reason: 'Sees their team, never the bank details'},
  {role: 'Employee', scope: 'Their own payslip', format: 'PDF, portal', reason: 'Self-service'}
];
const SE_PAYSLIP_RULES = [
  'A payslip is issued only after the payroll has been paid',
  'A correction creates a reissued payslip and keeps the original',
  'A payslip never shows another employee\'s figures',
  'Every download is written to the access log with the officer and the time'
];

/* ---------------- expense claims ---------------- */
const SE_CLAIM_CATEGORIES = ['Travel', 'Accommodation', 'Fuel', 'Meals', 'Office supplies', 'Client entertainment',
  'Communication', 'Training', 'Medical', 'Other approved'];
const SE_CLAIMS = [];
for(let i = 0; i < 46; i++){
  const s = SE_STAFF[(i * 3) % 24];
  const amount = Math.round((12000 + rnd() * 460000) / 500) * 500;
  const roll = rnd();
  const status = roll < 0.30 ? 'Pending approval' : roll < 0.45 ? 'Approved' : roll < 0.62 ? 'Paid'
    : roll < 0.72 ? 'Rejected' : roll < 0.82 ? 'Returned' : 'Submitted';
  SE_CLAIMS.push({
    id: SE_SET.claimPrefix + '-' + pad(5200 + i, 4), staff: s.id, dept: s.dept,
    when: addDays(TODAY, -(1 + (i * 3) % 55)), category: SE_CLAIM_CATEGORIES[i % SE_CLAIM_CATEGORIES.length],
    description: ['Fuel for field visits', 'Night stop after a late recovery', 'Printing and stationery',
      'Lunch with a client', 'Data bundle for the month', 'Training materials', 'Clinic visit while on duty',
      'Toll and parking', 'Repair of the office printer', 'Team meeting refreshments'][i % 10],
    amount, receipt: i % 6 === 0 ? 'None' : 'REC-' + pad(8100 + i, 4) + '.pdf',
    project: i % 4 === 0 ? 'Field recovery drive' : i % 5 === 0 ? 'Branch expansion' : 'Operations',
    status, notes: status === 'Rejected' ? 'No receipt and the claim is above the receipt limit'
      : status === 'Returned' ? 'Split the fuel and the meals into separate claims' : '',
    approvedBy: ['Approved', 'Paid'].includes(status) ? 'STF-009' : '',
    paidOn: status === 'Paid' ? addDays(TODAY, -(1 + i % 9)) : '',
    reference: status === 'Paid' ? 'PAY-' + pad(6100 + i, 5) : '',
    submitted: addDays(TODAY, -(1 + (i * 3) % 55)),
    lane: 'Claims', severity: amount > SE_SET.claimLimit ? 'High' : 'Low', owner: s.id, region: s.region
  });
}
const seClaimById = id => SE_CLAIMS.find(c => c.id === id);

/* ---------------- business operating expenses ---------------- */
const SE_CATEGORIES = [
  {name: 'Office rent', type: 'Indirect', classification: 'Operating', limit: 1200000, supplier: 'SUP-001'},
  {name: 'Electricity and utilities', type: 'Indirect', classification: 'Operating', limit: 320000, supplier: 'SUP-002'},
  {name: 'Water and sanitation', type: 'Indirect', classification: 'Operating', limit: 90000, supplier: 'SUP-003'},
  {name: 'Internet and telephone', type: 'Indirect', classification: 'Operating', limit: 280000, supplier: 'SUP-004'},
  {name: 'Office supplies', type: 'Direct', classification: 'Operating', limit: 180000, supplier: 'SUP-005'},
  {name: 'Furniture and equipment', type: 'Direct', classification: 'Capital', limit: 750000, supplier: 'SUP-006'},
  {name: 'Repairs and maintenance', type: 'Indirect', classification: 'Operating', limit: 300000, supplier: 'SUP-006'},
  {name: 'Transport and fuel', type: 'Direct', classification: 'Operating', limit: 450000, supplier: 'SUP-007'},
  {name: 'Travel and accommodation', type: 'Direct', classification: 'Operating', limit: 400000, supplier: 'SUP-007'},
  {name: 'Security services', type: 'Indirect', classification: 'Operating', limit: 260000, supplier: 'SUP-008'},
  {name: 'Insurance', type: 'Indirect', classification: 'Operating', limit: 380000, supplier: 'SUP-009'},
  {name: 'Professional and legal services', type: 'Indirect', classification: 'Operating', limit: 520000, supplier: 'SUP-010'},
  {name: 'Marketing and advertising', type: 'Direct', classification: 'Operating', limit: 600000, supplier: 'SUP-011'},
  {name: 'Licences and business permits', type: 'Indirect', classification: 'Operating', limit: 220000, supplier: 'SUP-012'},
  {name: 'Other approved operating expenses', type: 'Indirect', classification: 'Operating', limit: 150000, supplier: 'SUP-013'}
];
const SE_EXPENSES = [];
const SE_EXPENSE_MONTHS = ['2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10'];
SE_EXPENSE_MONTHS.forEach((m, mi) => {
  SE_CATEGORIES.forEach((c, ci) => {
    if((mi + ci) % 3 === 0 && mi > 0) return;
    const amount = Math.round(c.limit * (0.55 + rnd() * 0.6) / 500) * 500;
    const roll = rnd();
    SE_EXPENSES.push({
      id: SE_SET.expensePrefix + '-' + pad(7200 + SE_EXPENSES.length, 4), month: m, category: c.name,
      type: c.type, classification: c.classification, dept: SE_DEPT_NAMES[(ci + mi) % SE_DEPT_NAMES.length],
      costCentre: SE_DEPARTMENTS[(ci + mi) % SE_DEPARTMENTS.length].costCentre,
      supplier: c.supplier, when: m + '-' + pad(3 + (ci * 2) % 24, 2),
      amount, invoice: 'INV-' + pad(4300 + SE_EXPENSES.length, 4),
      status: roll < 0.62 ? 'Paid' : roll < 0.78 ? 'Approved' : roll < 0.9 ? 'Pending approval' : 'Overdue',
      reference: roll < 0.62 ? 'PAY-' + pad(6800 + SE_EXPENSES.length, 5) : '',
      lane: 'Expenses', severity: amount > c.limit ? 'Medium' : 'Low', owner: 'STF-007', region: 'Lilongwe'
    });
  });
});
const seExpThisMonth = SE_EXPENSES.filter(e => e.month === SE_OPEN_PERIOD.period);
const SE_EXPENSE_TOTAL = sum(SE_EXPENSES, e => e.amount);

/* ---------------- system operating charges ---------------- */
const SE_SYSTEM = [
  {name: 'Website hosting', provider: 'Vercel', cycle: 'Monthly', expected: 48000, actual: 46500,
   invoice: 'VCL-99120', renewal: addDays(TODAY, 6), start: addMonths(TODAY, -14), end: addMonths(TODAY, 10), dept: 'Information Technology'},
  {name: 'Domain registration and renewal', provider: 'Namecheap', cycle: 'Annual', expected: 96000, actual: 94000,
   invoice: 'NCH-2201', renewal: addDays(TODAY, 42), start: addMonths(TODAY, -10), end: addMonths(TODAY, 2), dept: 'Information Technology'},
  {name: 'Cloud server charges', provider: 'Railway', cycle: 'Monthly', expected: 210000, actual: 228400,
   invoice: 'RWY-55120', renewal: addDays(TODAY, 3), start: addMonths(TODAY, -18), end: addMonths(TODAY, 6), dept: 'Information Technology'},
  {name: 'Database hosting', provider: 'Supabase', cycle: 'Monthly', expected: 165000, actual: 165000,
   invoice: 'SB-77120', renewal: addDays(TODAY, 9), start: addMonths(TODAY, -11), end: addMonths(TODAY, 1), dept: 'Information Technology'},
  {name: 'Supabase service charges', provider: 'Supabase', cycle: 'Monthly', expected: 72000, actual: 68500,
   invoice: 'SB-77121', renewal: addDays(TODAY, 9), start: addMonths(TODAY, -11), end: addMonths(TODAY, 1), dept: 'Information Technology'},
  {name: 'Railway hosting', provider: 'Railway', cycle: 'Monthly', expected: 58000, actual: 57400,
   invoice: 'RWY-55121', renewal: addDays(TODAY, 3), start: addMonths(TODAY, -8), end: addMonths(TODAY, 4), dept: 'Information Technology'},
  {name: 'Email service', provider: 'Resend', cycle: 'Monthly', expected: 34000, actual: 34000,
   invoice: 'RSD-3310', renewal: addDays(TODAY, 12), start: addMonths(TODAY, -9), end: addMonths(TODAY, 3), dept: 'Information Technology'},
  {name: 'SMS and notification charges', provider: 'Africa’s Talking', cycle: 'Monthly', expected: 190000, actual: 214300,
   invoice: 'AT-81220', renewal: addDays(TODAY, 4), start: addMonths(TODAY, -22), end: addMonths(TODAY, 2), dept: 'Customer Care'},
  {name: 'Payment gateway charges', provider: 'PayChangu', cycle: 'Monthly', expected: 145000, actual: 132800,
   invoice: 'PC-4410', renewal: addDays(TODAY, 5), start: addMonths(TODAY, -16), end: addMonths(TODAY, 8), dept: 'Finance'},
  {name: 'API usage charges', provider: 'Airtel / TNM aggregator', cycle: 'Monthly', expected: 88000, actual: 91300,
   invoice: 'AGG-6612', renewal: addDays(TODAY, 7), start: addMonths(TODAY, -13), end: addMonths(TODAY, 5), dept: 'Information Technology'},
  {name: 'File storage', provider: 'Supabase Storage', cycle: 'Monthly', expected: 42000, actual: 42000,
   invoice: 'SB-77122', renewal: addDays(TODAY, 9), start: addMonths(TODAY, -11), end: addMonths(TODAY, 1), dept: 'Information Technology'},
  {name: 'Backup and recovery', provider: 'Backblaze', cycle: 'Monthly', expected: 62000, actual: 58800,
   invoice: 'BB-9910', renewal: addDays(TODAY, 21), start: addMonths(TODAY, -7), end: addMonths(TODAY, 5), dept: 'Information Technology'},
  {name: 'Software subscriptions', provider: 'Microsoft 365', cycle: 'Annual', expected: 980000, actual: 964000,
   invoice: 'MS-1120', renewal: addDays(TODAY, 66), start: addMonths(TODAY, -10), end: addMonths(TODAY, 2), dept: 'Administration'},
  {name: 'Security and monitoring', provider: 'Sentry / Cloudflare', cycle: 'Monthly', expected: 76000, actual: 74200,
   invoice: 'CF-2210', renewal: addDays(TODAY, 15), start: addMonths(TODAY, -6), end: addMonths(TODAY, 6), dept: 'Information Technology'},
  {name: 'Developer and maintenance', provider: 'Contract developer', cycle: 'Monthly', expected: 320000, actual: 320000,
   invoice: 'DEV-4401', renewal: addDays(TODAY, 1), start: addMonths(TODAY, -19), end: addMonths(TODAY, 5), dept: 'Information Technology'},
  {name: 'System licence renewals', provider: 'Accounting software', cycle: 'Annual', expected: 420000, actual: 0,
   invoice: 'LIC-8810', renewal: addDays(TODAY, 28), start: addMonths(TODAY, -2), end: addMonths(TODAY, 10), dept: 'Finance'}
].map((c, i) => Object.assign(c, {
  id: 'SYS-' + pad(2100 + i, 4), status: i === 15 ? 'Unpaid' : i === 3 ? 'Review' : 'Paid',
  billing: c.cycle === 'Annual' ? 'Paid annually in advance' : 'Charged monthly in arrears',
  variance: c.actual - c.expected,
  lane: 'System', severity: c.actual > c.expected * 1.1 ? 'Medium' : 'Low', owner: 'STF-009', region: 'Lilongwe'
}));
const SE_SYSTEM_TOTAL = sum(SE_SYSTEM, c => c.expected);
const SE_SYSTEM_ACTUAL = sum(SE_SYSTEM, c => c.actual);

/* ---------------- recurring expenses ---------------- */
const SE_RECURRING = SE_SYSTEM.map((c, i) => Object.assign({}, {
  id: 'REC-' + pad(3100 + i, 4), charge: c.id, name: c.name, provider: c.provider, cycle: c.cycle,
  expected: c.expected, actual: c.actual, renewal: c.renewal, contractStart: c.start, contractEnd: c.end,
  reminder: addDays(c.renewal, -SE_SET.reminderDays),
  approval: c.expected > 400000 ? 'Finance manager' : 'Automatic', status: c.status,
  lane: 'Recurring', severity: c.actual > c.expected * 1.1 ? 'Medium' : 'Low', owner: 'STF-009', region: 'Lilongwe'
}));
const SE_RECURRING_APPR = SE_RECURRING.filter(r => r.approval !== 'Automatic').map((r, i) => ({
  id: 'RAQ-' + pad(700 + i, 3), recurring: r.id, name: r.name, amount: r.expected,
  reason: 'Renewal of ' + r.name + ' for another ' + r.cycle.toLowerCase() + ' term',
  status: i === 0 ? 'Pending' : 'Approved', by: 'STF-009', when: addDays(TODAY, -(2 + i * 3)),
  lane: 'Recurring', severity: 'Low', owner: 'STF-009', region: 'Lilongwe'
}));
const SE_RECURRING_HISTORY = SE_RECURRING.slice(0, 8).map((r, i) => ({
  when: addDays(TODAY, -(5 + i * 7)), name: r.name, change: i % 3 === 0 ? 'Cycle changed' : 'Provider changed',
  from: i % 3 === 0 ? 'Quarterly' : 'Railway', to: i % 3 === 0 ? 'Monthly' : r.provider, by: 'STF-009',
  lane: 'Recurring', severity: 'Low', owner: 'STF-009', region: 'Lilongwe'
}));

/* ---------------- budgets ---------------- */
const SE_BUDGETS = SE_DEPARTMENTS.map((d, i) => {
  const actual = sum(SE_SALARIES.filter(s => s.dept === d.name), s => s.gross)
    + sum(seExpThisMonth.filter(e => e.dept === d.name), e => e.amount) * 3;
  return {
    id: 'BGT-' + pad(4100 + i, 4), scope: d.name, kind: 'Department', annual: d.budget * 12,
    monthly: d.budget, actual, remaining: d.budget - actual, variance: actual - d.budget,
    status: actual > d.budget ? 'Over budget' : actual > d.budget * 0.9 ? 'At the limit' : 'Within budget',
    costCentre: d.costCentre, lane: 'Budgets', severity: actual > d.budget ? 'High' : 'Low',
    owner: d.head, region: 'Lilongwe'
  };
});
SE_CATEGORIES.forEach((c, i) => {
  const spent = sum(seExpThisMonth.filter(e => e.category === c.name), e => e.amount);
  SE_BUDGETS.push({id: 'BGT-C' + pad(100 + i, 3), scope: c.name, kind: 'Category', annual: c.limit * 12,
    monthly: c.limit, actual: spent, remaining: c.limit - spent, variance: spent - c.limit,
    status: spent > c.limit ? 'Over budget' : spent > c.limit * 0.9 ? 'At the limit' : 'Within budget',
    costCentre: SE_DEPARTMENTS[i % SE_DEPARTMENTS.length].costCentre,
    lane: 'Budgets', severity: spent > c.limit ? 'High' : 'Low', owner: 'STF-007', region: 'Lilongwe'});
});
const SE_BUDGET_REVISIONS = [
  {id: 'BRQ-118', scope: 'Marketing and advertising', when: addDays(TODAY, -3) + ' 09:20', from: 600000, to: 780000,
   reason: 'Brand campaign ahead of the branch opening', status: 'Pending', by: 'STF-006', approver: 'STF-009',
   lane: 'Budgets', severity: 'Medium', owner: 'STF-006', region: 'Lilongwe'},
  {id: 'BRQ-117', scope: 'Human Resources', when: addDays(TODAY, -11) + ' 14:05', from: 720000, to: 860000,
   reason: 'Two new hires started a month earlier than planned', status: 'Approved', by: 'STF-009', approver: 'STF-009',
   lane: 'Budgets', severity: 'Low', owner: 'STF-009', region: 'Lilongwe'},
  {id: 'BRQ-116', scope: 'Information Technology', when: addDays(TODAY, -18) + ' 11:40', from: 1580000, to: 1720000,
   reason: 'Cloud spend rose with the new savings module', status: 'Approved', by: 'STF-009', approver: 'STF-009',
   lane: 'Budgets', severity: 'Low', owner: 'STF-009', region: 'Lilongwe'}
];
const SE_BUDGET_HISTORY = SE_BUDGET_REVISIONS.map(r => ({
  when: r.when, scope: r.scope, change: 'Budget revised', from: seM(r.from), to: seM(r.to), by: r.by, status: r.status
}));

/* ---------------- payments ---------------- */
const SE_SUPPLIER_NAMES = ['Kanengo Properties', 'ESCOM', 'Access Communications', 'TotalEnergies Malawi',
  'G4S Malawi', 'NICO General Insurance', 'Savjani & Co', 'Zodiak Promotions', 'Vercel', 'Supabase'];
const SE_PAYMENTS = [];
for(let i = 0; i < 34; i++){
  const kind = i % 3 === 0 ? 'Salary' : i % 3 === 1 ? 'Expense' : 'Supplier';
  const amount = kind === 'Salary' ? Math.round((540000 + rnd() * 560000) / 500) * 500
    : Math.round((60000 + rnd() * 720000) / 500) * 500;
  const roll = rnd();
  const status = roll < 0.52 ? 'Paid' : roll < 0.66 ? 'Pending confirmation' : roll < 0.78 ? 'Approved'
    : roll < 0.88 ? 'Processing' : 'Failed';
  SE_PAYMENTS.push({
    id: SE_SET.paymentPrefix + '-' + pad(6400 + i, 5), kind,
    payee: kind === 'Salary' ? seStaffName(SE_STAFF[i % SE_STAFF.length].id)
      : kind === 'Expense' ? SE_DEPARTMENTS[i % SE_DEPARTMENTS.length].name + ' department'
      : SE_SUPPLIER_NAMES[i % SE_SUPPLIER_NAMES.length],
    method: ['Bank transfer', 'Mobile money', 'Cash'][i % 3],
    when: addDays(TODAY, -(1 + (i * 2) % 40)), amount,
    reference: status === 'Paid' ? 'PAY-' + pad(7000 + i, 5) : '',
    status, receipt: status === 'Paid' ? 'RCT-' + pad(5100 + i, 4) : '',
    reconciled: status === 'Paid' ? (i % 7 === 0 ? 'No' : 'Yes') : 'No',
    failure: status === 'Failed' ? ['Beneficiary account closed', 'Wallet number not registered',
      'Bank rejected the batch', 'Insufficient funds in the operating account'][i % 4] : '',
    lane: 'Payments', severity: status === 'Failed' ? 'High' : 'Low', owner: 'STF-007', region: 'Lilongwe'
  });
}

/* ---------------- approvals ---------------- */
const SE_APPROVAL_LIMITS = [
  {role: 'Payroll Officer', salary: 0, expense: 0, supplier: 0, note: 'Prepares, never approves'},
  {role: 'Line manager', salary: 0, expense: 150000, supplier: 0, note: 'Approves their team claims'},
  {role: 'Finance Manager', salary: 500000, expense: 800000, supplier: 1000000, note: 'Approves payroll and expenses'},
  {role: 'Administrator', salary: 1500000, expense: 2000000, supplier: 3000000, note: 'Second signature'},
  {role: 'Super Admin', salary: 5000000, expense: 5000000, supplier: 5000000, note: 'Emergency only, logged'}
];
const SE_APPROVALS = [];
for(let i = 0; i < 26; i++){
  const kind = ['Salary change', 'Payroll', 'Allowance', 'Expense claim', 'Supplier invoice',
    'System subscription', 'High-value expense', 'Budget override'][i % 8];
  const amount = kind === 'Payroll' ? SE_PAYROLL[SE_PAYROLL.length - 1].net
    : kind === 'Salary change' ? Math.round((80000 + rnd() * 400000) / 500) * 500
    : Math.round((25000 + rnd() * 1800000) / 500) * 500;
  const status = i < 4 ? 'Pending' : i % 9 === 8 ? 'Rejected' : i % 5 === 4 ? 'Returned' : 'Approved';
  SE_APPROVALS.push({
    id: 'APV-' + pad(8200 + i, 4), kind, when: addDays(TODAY, -(1 + i * 2)), amount,
    requester: ['STF-007', 'STF-005', 'STF-009', 'STF-003'][i % 4],
    approver: amount > SE_SET.highValueApproval ? 'STF-001' : 'STF-009',
    level: amount > SE_SET.highValueApproval ? 'Two signatures' : 'One signature',
    subject: kind === 'Payroll' ? SE_PAYROLL[SE_PAYROLL.length - 1].id
      : kind === 'Expense claim' ? SE_CLAIMS[i % SE_CLAIMS.length].id
      : kind === 'Supplier invoice' ? 'INV-' + pad(4300 + i, 4)
      : kind === 'Budget override' ? SE_BUDGET_REVISIONS[i % SE_BUDGET_REVISIONS.length].id
      : 'SAL-' + pad(1001 + i, 4),
    comment: status === 'Rejected' ? 'The supporting invoice is missing' : status === 'Returned' ? 'Reattach the receipt and resubmit' : '',
    status, selfApproval: i % 13 === 12,
    lane: 'Approvals', severity: amount > SE_SET.highValueApproval ? 'High' : 'Low', owner: 'STF-009', region: 'Lilongwe'
  });
}
const SE_APPROVAL_HISTORY = SE_APPROVALS.filter(a => a.status !== 'Pending').slice(0, 10).map((a, i) => ({
  when: a.when, request: a.id, kind: a.kind, amount: a.amount, decision: a.status,
  by: a.approver, comment: a.comment || 'Approved within the officer limit'
}));

/* ---------------- ledger ---------------- */
const SE_LEDGER = [];
const SE_LEDGER_KINDS = ['Salary expense', 'Allowance', 'Statutory liability', 'Business expense',
  'System operating cost', 'Supplier payable', 'Cashbook', 'Cost centre allocation', 'Accrual', 'Prepaid'];
SE_LEDGER_KINDS.forEach((kind, i) => {
  const amount = Math.round((180000 + i * 210000) / 500) * 500;
  const when = addDays(TODAY, -(2 + i * 3));
  const ref = ['SLR', 'ALW', 'STA', 'EXP', 'SYS', 'SUP', 'CSH', 'CCT', 'ACR', 'PRE'][i] + '-' + pad(5100 + i, 4);
  const debitAccount = ['Salaries expense', 'Allowances expense', 'Statutory payable', 'Operating expense',
    'Hosting expense', 'Supplier payable', 'Bank', 'Department cost centre', 'Accrued expense', 'Prepaid expense'][i];
  const creditAccount = ['Payroll payable', 'Payroll payable', 'Cash', 'Accounts payable', 'Accounts payable',
    'Bank', 'Salary expense', 'Salaries expense', 'Expense payable', 'Operating expense'][i];
  SE_LEDGER.push({entry: 'LED-' + pad(8100 + i * 2, 5), when, ref, kind, account: debitAccount,
    costCentre: SE_DEPARTMENTS[i % SE_DEPARTMENTS.length].costCentre, side: 'Debit', amount, balance: amount,
    lane: 'Ledger', severity: 'Low', owner: 'STF-007', region: 'Lilongwe'});
  SE_LEDGER.push({entry: 'LED-' + pad(8101 + i * 2, 5), when, ref, kind, account: creditAccount,
    costCentre: SE_DEPARTMENTS[i % SE_DEPARTMENTS.length].costCentre, side: 'Credit', amount, balance: -amount,
    lane: 'Ledger', severity: 'Low', owner: 'STF-007', region: 'Lilongwe'});
});
const SE_LEDGER_SUMMARY = SE_LEDGER_KINDS.map((kind, i) => {
  const rows = SE_LEDGER.filter(e => e.kind === kind);
  return {kind, entries: rows.length, debit: sum(rows.filter(r => r.side === 'Debit'), r => r.amount),
    credit: sum(rows.filter(r => r.side === 'Credit'), r => r.amount),
    net: sum(rows, r => r.side === 'Debit' ? r.amount : -r.amount),
    account: rows[0] ? rows[0].account : '—'};
});
const SE_LEDGER_CLASS = [
  {item: 'Office furniture', treatment: 'Capitalised and depreciated', value: 750000, note: 'Over the capital limit'},
  {item: 'Laptop for a new hire', treatment: 'Capitalised', value: 620000, note: 'Asset register updated'},
  {item: 'Stationery', treatment: 'Expensed in the month', value: 48000, note: 'Below the capital limit'},
  {item: 'Annual software licence', treatment: 'Prepaid then amortised', value: 964000, note: 'Twelve months'},
  {item: 'Office rent', treatment: 'Accrued monthly', value: 1200000, note: 'Paid quarterly'}
];
const SE_PREPAID = [
  {item: 'Microsoft 365', from: addMonths(TODAY, -1), to: addMonths(TODAY, 11), total: 964000, monthly: 80333, remaining: 8},
  {item: 'Insurance premium', from: addMonths(TODAY, -4), to: addMonths(TODAY, 8), total: 456000, monthly: 38000, remaining: 8},
  {item: 'Domain renewal', from: addMonths(TODAY, -10), to: addMonths(TODAY, 2), total: 94000, monthly: 7833, remaining: 2}
];

/* ---------------- suppliers ---------------- */
const SE_SUPPLIERS = [
  {id: 'SUP-001', name: 'Kanengo Properties', category: 'Office rent', contact: 'Mr. Chirwa', phone: '+265 991 220 118',
   email: 'accounts@kanengo.mw', bank: 'FDH Bank', account: '10' + pad(224411, 6), verified: 'Verified', payments: 6, total: 7200000},
  {id: 'SUP-002', name: 'ESCOM', category: 'Electricity and utilities', contact: 'Billing desk', phone: '+265 888 000 111',
   email: 'billing@escom.mw', bank: 'National Bank', account: '10' + pad(331122, 6), verified: 'Verified', payments: 6, total: 1840000},
  {id: 'SUP-003', name: 'Blantyre Water Board', category: 'Water and sanitation', contact: 'Billing desk', phone: '+265 999 114 220',
   email: 'billing@bwb.mw', bank: 'Standard Bank', account: '10' + pad(441133, 6), verified: 'Verified', payments: 6, total: 486000},
  {id: 'SUP-004', name: 'Access Communications', category: 'Internet and telephone', contact: 'Sales desk', phone: '+265 777 660 220',
   email: 'sales@access.mw', bank: 'NBS Bank', account: '10' + pad(551144, 6), verified: 'Verified', payments: 12, total: 3120000},
  {id: 'SUP-005', name: 'Chichiri Stationers', category: 'Office supplies', contact: 'Mrs. Kalua', phone: '+265 992 441 118',
   email: 'orders@chichiri.mw', bank: 'FDH Bank', account: '10' + pad(661155, 6), verified: 'Verified', payments: 9, total: 1280000},
  {id: 'SUP-006', name: 'Mwaiwathu Furnishers', category: 'Furniture and equipment', contact: 'Mr. Gondwe', phone: '+265 881 220 119',
   email: 'sales@mwaiwathu.mw', bank: 'National Bank', account: '10' + pad(771166, 6), verified: 'Review', payments: 3, total: 2140000},
  {id: 'SUP-007', name: 'TotalEnergies Malawi', category: 'Transport and fuel', contact: 'Fleet desk', phone: '+265 993 001 220',
   email: 'fleet@total.mw', bank: 'Standard Bank', account: '10' + pad(881177, 6), verified: 'Verified', payments: 18, total: 4260000},
  {id: 'SUP-008', name: 'G4S Malawi', category: 'Security services', contact: 'Operations desk', phone: '+265 994 220 113',
   email: 'ops@g4s.mw', bank: 'FDH Bank', account: '10' + pad(991188, 6), verified: 'Verified', payments: 6, total: 1560000},
  {id: 'SUP-009', name: 'NICO General Insurance', category: 'Insurance', contact: 'Mr. Phiri', phone: '+265 888 220 114',
   email: 'claims@nicogeneral.mw', bank: 'NICO', account: '10' + pad(112299, 6), verified: 'Verified', payments: 4, total: 1824000},
  {id: 'SUP-010', name: 'Savjani & Co', category: 'Professional and legal services', contact: 'Mrs. Savjani', phone: '+265 991 220 115',
   email: 'legal@savjani.mw', bank: 'Standard Bank', account: '10' + pad(223311, 6), verified: 'Verified', payments: 3, total: 2940000},
  {id: 'SUP-011', name: 'Zodiak Promotions', category: 'Marketing and advertising', contact: 'Mr. Banda', phone: '+265 995 220 116',
   email: 'hello@zodiak.mw', bank: 'NBS Bank', account: '10' + pad(334422, 6), verified: 'Unverified', payments: 2, total: 1120000},
  {id: 'SUP-012', name: 'Malawi Revenue Authority', category: 'Licences and business permits', contact: 'Licensing desk', phone: '+265 888 220 117',
   email: 'licensing@mra.mw', bank: 'Reserve Bank', account: '10' + pad(445533, 6), verified: 'Verified', payments: 2, total: 440000},
  {id: 'SUP-013', name: 'Vercel', category: 'System operating charges', contact: 'Billing', phone: '+1 415 000 1122',
   email: 'billing@vercel.com', bank: 'Card', account: 'CARD-4412', verified: 'Verified', payments: 14, total: 651000},
  {id: 'SUP-014', name: 'Supabase', category: 'System operating charges', contact: 'Billing', phone: '+1 628 000 4411',
   email: 'billing@supabase.com', bank: 'Card', account: 'CARD-8820', verified: 'Verified', payments: 11, total: 2560500}
];
const SE_SUP_BY_ID = Object.fromEntries(SE_SUPPLIERS.map(s => [s.id, s]));
const SE_SUPPLIER_INVOICES = SE_EXPENSES.slice(0, 42).map((e, i) => ({
  id: e.invoice, supplier: e.supplier, when: e.when, amount: e.amount, due: addDays(e.when, 30),
  status: e.status === 'Paid' ? 'Paid' : e.status === 'Overdue' ? 'Overdue' : 'Open',
  reference: e.reference, approvedBy: e.status === 'Paid' ? 'STF-009' : '',
  lane: 'Suppliers', severity: e.status === 'Overdue' ? 'High' : 'Low', owner: 'STF-007', region: 'Lilongwe'
}));
const SE_SUPPLIER_PAYMENTS = SE_PAYMENTS.filter(p => p.kind === 'Supplier').map(p => ({
  when: p.when, supplier: p.payee, amount: p.amount, reference: p.reference, method: p.method,
  status: p.status === 'Paid' ? 'Paid' : p.status
}));
const SE_SUPPLIER_CHANGES = [
  {when: addDays(TODAY, -6) + ' 10:20', supplier: 'Zodiak Promotions', field: 'Bank account',
   from: '•••• 4411', to: '•••• 7788', by: 'STF-009', approved: 'Yes', lane: 'Suppliers', severity: 'High', owner: 'STF-009', region: 'Lilongwe'},
  {when: addDays(TODAY, -14) + ' 09:05', supplier: 'Mwaiwathu Furnishers', field: 'Contact phone',
   from: '+265 881 220 100', to: '+265 881 220 119', by: 'STF-007', approved: 'Yes', lane: 'Suppliers', severity: 'Low', owner: 'STF-007', region: 'Lilongwe'},
  {when: addDays(TODAY, -21) + ' 14:40', supplier: 'Access Communications', field: 'Category',
   from: 'Office supplies', to: 'Internet and telephone', by: 'STF-007', approved: 'Yes', lane: 'Suppliers', severity: 'Low', owner: 'STF-007', region: 'Lilongwe'}
];

/* ---------------- staff connections ---------------- */
const SE_STAFF_LINKS = SE_STAFF.slice(0, 18).map((s, i) => {
  const sal = seSalOf(s.id);
  return {staff: s.id, name: s.name, role: s.role, dept: s.dept, salary: sal ? sal.id : '—',
    basic: sal ? sal.basic : 0, employment: s.employment, status: s.status,
    verified: i % 9 === 0 ? 'Unverified' : 'Verified',
    claims: SE_CLAIMS.filter(c => c.staff === s.id).length,
    claimValue: sum(SE_CLAIMS.filter(c => c.staff === s.id), c => c.amount),
    lane: 'Staff', severity: i % 9 === 0 ? 'Medium' : 'Low', owner: 'STF-007', region: s.region};
});

/* ---------------- notifications ---------------- */
const SE_CHANNELS = {
  sms: {provider: 'Africa’s Talking', sender: 'GOLDENHR', balance: 4820, status: 'Connected', latency: 640, lastSend: TODAY + ' 07:50'},
  email: {provider: 'Resend', sender: 'payroll@goldenloan.mw', balance: '38,110 of 50,000', status: 'Connected', latency: 210, lastSend: TODAY + ' 08:05'}
};
const SE_NOTIFY_RULES = [
  {event: 'Upcoming payroll', channel: 'SMS and email', to: 'Payroll and finance', template: 'SE_PAYROLL_DUE', on: true, last: addDays(TODAY, -3)},
  {event: 'Salary paid', channel: 'SMS and email', to: 'The employee', template: 'SE_SALARY_PAID', on: true, last: addDays(TODAY, -1)},
  {event: 'Claim pending approval', channel: 'Email', to: 'The approver', template: 'SE_CLAIM_PENDING', on: true, last: addDays(TODAY, -2)},
  {event: 'Claim decision', channel: 'SMS and email', to: 'The employee', template: 'SE_CLAIM_DECIDED', on: true, last: addDays(TODAY, -1)},
  {event: 'Subscription renewal', channel: 'Email', to: 'Finance and IT', template: 'SE_RENEWAL', on: true, last: addDays(TODAY, -4)},
  {event: 'Overdue supplier invoice', channel: 'Email', to: 'Finance', template: 'SE_INVOICE_OVERDUE', on: true, last: addDays(TODAY, -5)},
  {event: 'Budget limit reached', channel: 'SMS and email', to: 'The department head', template: 'SE_BUDGET_ALERT', on: true, last: addDays(TODAY, -6)},
  {event: 'Failed payment', channel: 'SMS', to: 'Finance and the payee', template: 'SE_PAYMENT_FAILED', on: true, last: addDays(TODAY, -2)},
  {event: 'Statutory remittance due', channel: 'Email', to: 'Finance', template: 'SE_STATUTORY', on: false, last: addDays(TODAY, -12)}
];
const SE_NOTIFY_LOG = SE_NOTIFY_RULES.concat(SE_NOTIFY_RULES.slice(0, 3)).map((r, i) => ({
  when: addDays(TODAY, -(i % 12)) + ' 0' + (7 + i % 3) + ':' + pad(10 + i, 2),
  event: r.event, channel: i % 3 === 0 ? 'SMS' : 'Email', to: r.to,
  reference: ['PRL-2610', 'SAL-1004', 'CLM-5203', 'APV-8201', 'REC-3103', 'INV-4302', 'BGT-4102', 'PAY-6411', 'STA-2610-A'][i % 9],
  status: i % 11 === 0 ? 'Failed' : i % 7 === 0 ? 'Queued' : 'Delivered',
  lane: 'Notifications', severity: 'Low', owner: 'STF-007', region: 'Lilongwe'
}));

/* ---------------- security ---------------- */
const SE_ROLES = ['Super Admin', 'Administrator', 'Finance Manager', 'Payroll Officer', 'Department Head', 'Internal Auditor'];
const SE_CAPS = ['See every salary', 'Edit a salary record', 'Run the payroll', 'Approve the payroll',
  'Approve an expense claim', 'Pay a supplier', 'Change the budget', 'See the audit log'];
const SE_PERMS = {
  'Super Admin': [1,1,1,1,1,1,1,1],
  'Administrator': [1,1,1,1,1,1,1,1],
  'Finance Manager': [1,1,1,1,1,1,1,1],
  'Payroll Officer': [1,1,1,0,0,0,0,0],
  'Department Head': [0,0,0,0,1,0,0,0],
  'Internal Auditor': [1,0,0,0,0,0,0,1]
};
const SE_ROLE_STAFF = {'Super Admin': 'STF-001', 'Administrator': 'STF-009', 'Finance Manager': 'STF-003',
  'Payroll Officer': 'STF-007', 'Department Head': 'STF-005', 'Internal Auditor': 'STF-004'};
const SE_SENSITIVE = [
  {id: 'SNS-311', staff: 'STF-003', field: 'Salary record', reason: 'Management band figures', access: 'Payroll, finance, audit', status: 'Restricted'},
  {id: 'SNS-312', staff: 'STF-009', field: 'Bank account', reason: 'Payment destination', access: 'Payroll only', status: 'Restricted'},
  {id: 'SNS-313', staff: 'STF-007', field: 'Payslip history', reason: 'Payroll officer records', access: 'Finance manager', status: 'Restricted'},
  {id: 'SNS-314', staff: 'STF-001', field: 'Supplier bank details', reason: 'Change requires two signatures', access: 'Finance manager and administrator', status: 'Restricted'}
];
const SE_STAFF_ACTIVITY = STAFF.slice(0, 8).map((s, i) => ({
  staff: s.id, name: s.name, role: s.role,
  payslips: 12 + (i % 7), claims: SE_CLAIMS.filter(c => c.staff === s.id).length,
  approvals: SE_APPROVALS.filter(a => a.approver === s.id).length,
  lastAction: addDays(TODAY, -(i % 4)) + ' 1' + (i % 9) + ':20',
  status: i % 7 === 6 ? 'Review' : 'Normal', lane: 'Security', severity: 'Low', owner: s.id, region: 'Lilongwe'
}));
const SE_UNAUTHORISED = [
  {when: addDays(TODAY, -1) + ' 21:14', staff: 'STF-012', action: 'Tried to open a salary record',
   target: 'SAL-1004', result: 'Blocked', lane: 'Security', severity: 'High', owner: 'STF-009', region: 'Lilongwe'},
  {when: addDays(TODAY, -3) + ' 08:22', staff: 'STF-018', action: 'Tried to download payslips outside their team',
   target: 'PSP-2609-006', result: 'Blocked', lane: 'Security', severity: 'Medium', owner: 'STF-009', region: 'Blantyre'},
  {when: addDays(TODAY, -8) + ' 16:40', staff: 'STF-005', action: 'Tried to approve their own claim',
   target: 'CLM-5208', result: 'Blocked', lane: 'Security', severity: 'High', owner: 'STF-009', region: 'Lilongwe'}
];
const SE_DATA_RULES = [
  ['Salary figures seen by', 'Payroll, finance and audit'],
  ['Bank details masked', 'Every screen except payroll'],
  ['Records encrypted', 'At rest and in transit'],
  ['Retention', 'Seven years after the employee leaves'],
  ['Access logged', 'Every read and every download']
];

/* ---------------- database ---------------- */
const SE_DB_TABLES = [
  {table: 'staff_profiles', rows: SE_STAFF.length, size: '184 KB', rls: 'Enabled', note: 'Employment details, never the salary', function: 'staff_profile', lastWrite: TODAY + ' 08:02'},
  {table: 'staff_salaries', rows: SE_SALARIES.length, size: '212 KB', rls: 'Enabled', note: 'Basic, allowances and effective date', function: 'salary_record', lastWrite: TODAY + ' 08:04'},
  {table: 'payroll_runs', rows: SE_PAYROLL.length, size: '96 KB', rls: 'Enabled', note: 'One row per period, locked after payment', function: 'run_payroll', lastWrite: TODAY + ' 07:40'},
  {table: 'payroll_lines', rows: SE_PAYROLL_LINES.length, size: '648 KB', rls: 'Enabled', note: 'One row per employee per period', function: 'post_payroll_line', lastWrite: TODAY + ' 07:41'},
  {table: 'salary_adjustments', rows: SE_ADJUSTMENTS.length, size: '72 KB', rls: 'Enabled', note: 'Every increase and reduction with a reason', function: 'apply_adjustment', lastWrite: TODAY + ' 08:06'},
  {table: 'expense_claims', rows: SE_CLAIMS.length, size: '348 KB', rls: 'Enabled', note: 'An employee reads their own claims', function: 'submit_claim', lastWrite: TODAY + ' 08:10'},
  {table: 'claim_attachments', rows: 84, size: '12.4 MB', rls: 'Missing policy', note: 'Storage-backed receipts', function: 'attach_claim_receipt', lastWrite: TODAY + ' 08:11'},
  {table: 'operating_expenses', rows: SE_EXPENSES.length, size: '512 KB', rls: 'Enabled', note: 'Business expenses by category and cost centre', function: 'post_expense', lastWrite: TODAY + ' 08:12'},
  {table: 'system_charges', rows: SE_SYSTEM.length, size: '88 KB', rls: 'Enabled', note: 'Provider, cycle, expected and actual', function: 'charge_schedule', lastWrite: TODAY + ' 08:13'},
  {table: 'recurring_expenses', rows: SE_RECURRING.length, size: '96 KB', rls: 'Enabled', note: 'Renewal dates and contract terms', function: 'renewal_due', lastWrite: TODAY + ' 08:13'},
  {table: 'suppliers', rows: SE_SUPPLIERS.length, size: '64 KB', rls: 'Enabled', note: 'Bank details readable by finance only', function: 'supplier_record', lastWrite: addDays(TODAY, -1) + ' 15:20'},
  {table: 'payments', rows: SE_PAYMENTS.length, size: '296 KB', rls: 'Enabled', note: 'Every request, reference and receipt', function: 'post_payment', lastWrite: TODAY + ' 08:15'},
  {table: 'accounting_ledger', rows: SE_LEDGER.length, size: '1.2 MB', rls: 'Enabled', note: 'Append-only debit and credit entries', function: 'write_ledger', lastWrite: TODAY + ' 08:15'},
  {table: 'budgets', rows: SE_BUDGETS.length, size: '132 KB', rls: 'Enabled', note: 'Department and category budgets', function: 'budget_actuals', lastWrite: TODAY + ' 06:30'}
];
const SE_DB_FUNCS = [
  {name: 'run_payroll', kind: 'Function', invoker: 'Definer', calls: 31, status: 'Healthy', note: 'Builds the period, the lines and the totals in one transaction'},
  {name: 'post_payroll_line', kind: 'Function', invoker: 'Definer', calls: 1240, status: 'Healthy', note: 'Writes salary, allowance and deduction rows together'},
  {name: 'apply_adjustment', kind: 'Trigger', invoker: 'Definer', calls: 14, status: 'Healthy', note: 'Keeps the salary record and the history in step'},
  {name: 'submit_claim', kind: 'Function', invoker: 'Definer', calls: 46, status: 'Healthy', note: 'Validates the receipt rule before it saves'},
  {name: 'approve_payment', kind: 'Function', invoker: 'Definer', calls: 88, status: 'Review', note: 'Enforces requester and approver being different people'},
  {name: 'post_expense', kind: 'Function', invoker: 'Definer', calls: 210, status: 'Healthy', note: 'Expense, cost centre and ledger in one call'},
  {name: 'write_ledger', kind: 'Function', invoker: 'Definer', calls: 402, status: 'Healthy', note: 'Append-only, refuses an unbalanced pair'},
  {name: 'renewal_due', kind: 'View', invoker: 'Invoker', calls: 620, status: 'Healthy', note: 'Recurring charges inside the reminder window'}
];
const SE_DB_ERRORS = [
  {when: TODAY + ' 07:52', code: '23505', message: 'duplicate key value violates unique constraint "payroll_lines_period_staff_key"', count: 2, status: 'Open'},
  {when: addDays(TODAY, -1) + ' 19:20', code: '42501', message: 'permission denied for table claim_attachments', count: 4, status: 'Open'},
  {when: addDays(TODAY, -2) + ' 11:04', code: '40001', message: 'could not serialize access due to concurrent update', count: 1, status: 'Resolved'},
  {when: addDays(TODAY, -4) + ' 16:48', code: '23514', message: 'new row for relation "payments" violates check constraint "amount_positive"', count: 1, status: 'Resolved'}
];
const SE_DB_CHECKS = () => [
  {check: 'Every payroll line has a salary record', value: SE_PAYROLL_LINES.filter(l => !seSalOf(l.staff)).length + ' without one',
   status: SE_PAYROLL_LINES.some(l => !seSalOf(l.staff)) ? 'Fail' : 'Pass'},
  {check: 'Debits and credits net to zero', value: seNetLabel(sum(SE_LEDGER, e => e.side === 'Debit' ? e.amount : -e.amount)),
   status: Math.abs(sum(SE_LEDGER, e => e.side === 'Debit' ? e.amount : -e.amount)) < 1 ? 'Pass' : 'Fail'},
  {check: 'No payment without an approval', value: SE_PAYMENTS.filter(p => p.status === 'Paid' && p.amount > SE_SET.highValueApproval).length + ' above the limit',
   status: 'Pass'},
  {check: 'Statutory remittances up to date', value: SE_STATUTORY.filter(s => s.status === 'Overdue').length + ' overdue',
   status: SE_STATUTORY.some(s => s.status === 'Overdue') ? 'Fail' : 'Pass'},
  {check: 'Row-level security on every payroll table', value: SE_DB_TABLES.filter(t => t.rls !== 'Enabled').length + ' without a policy',
   status: SE_DB_TABLES.some(t => t.rls !== 'Enabled') ? 'Fail' : 'Pass'},
  {check: 'Claims above the receipt limit carry a receipt', value: SE_CLAIMS.filter(c => c.amount > SE_SET.receiptRequiredAbove && c.receipt === 'None').length + ' without one',
   status: SE_CLAIMS.some(c => c.amount > SE_SET.receiptRequiredAbove && c.receipt === 'None') ? 'Fail' : 'Pass'},
  {check: 'Schema version matches the app', value: '2026.10.30.3', status: 'Pass'}
];
const SE_MIGRATIONS = [
  {id: '20261030_07', name: 'add payroll_lines and payroll_runs', when: addDays(TODAY, -2) + ' 07:44', status: 'Applied'},
  {id: '20261023_05', name: 'index expense_claims(staff, status)', when: addDays(TODAY, -9) + ' 09:12', status: 'Applied'},
  {id: '20261016_04', name: 'supplier bank details vault', when: addDays(TODAY, -16) + ' 18:26', status: 'Applied'},
  {id: '20261009_02', name: 'check constraint amount_positive on payments', when: addDays(TODAY, -23) + ' 10:02', status: 'Applied'},
  {id: '20261101_03', name: 'enable RLS on claim_attachments', when: addDays(TODAY, -1) + ' 06:00', status: 'Pending'}
];

/* ---------------- reports and history ---------------- */
const SE_REPORTS = [
  {key: 'payroll', title: 'Monthly Payroll Report', desc: 'Gross, allowances, deductions and net for the period'},
  {key: 'annual', title: 'Annual Salary Report', desc: 'Every salary record and what the year costs'},
  {key: 'allowances', title: 'Allowances and Benefits Report', desc: 'What is paid on top of basic, by type'},
  {key: 'statutory', title: 'Statutory Deductions Report', desc: 'PAYE, pension and NHIMA with remittance status'},
  {key: 'expenses', title: 'Business Expenses Report', desc: 'Every operating expense by category'},
  {key: 'system', title: 'System Operating Charges Report', desc: 'Providers, cycles, expected and actual'},
  {key: 'suppliers', title: 'Supplier Payments Report', desc: 'What each supplier was paid and when'},
  {key: 'recurring', title: 'Recurring Expenses Report', desc: 'What renews, when, and for how much'},
  {key: 'budget', title: 'Budget Versus Actual Report', desc: 'Every budget against what has been spent'},
  {key: 'obligations', title: 'Outstanding Payment Obligations', desc: 'What is still owed and when it falls due'},
  {key: 'trends', title: 'Expense Trends and Forecasts', desc: 'Six months of spend, with a forward view'},
  {key: 'responsible', title: 'Staff Member Responsible', desc: 'Who owns each cost and each approval'},
  {key: 'changes', title: 'Record Creation and Modification History', desc: 'Every change with the officer and the time'},
  {key: 'authorised', title: 'Export Authorised Reports', desc: 'Who may export what, and what has been exported'}
];
const SE_CHANGES = [
  {when: TODAY + ' 08:12', what: 'Withdrawal fee', area: 'Expenses', from: 'MK 800', to: 'MK 1,000', by: 'STF-007'},
  {when: TODAY + ' 08:02', what: 'Payroll approval limit', area: 'Approvals', from: 'MK 120,000', to: 'MK 150,000', by: 'STF-009'},
  {when: addDays(TODAY, -1) + ' 17:40', what: 'Monthly operating budget', area: 'Budgets', from: 'MK 8,400,000', to: 'MK 9,000,000', by: 'STF-003'},
  {when: addDays(TODAY, -2) + ' 09:15', what: 'Claim receipt limit', area: 'Claims', from: 'MK 20,000', to: 'MK 25,000', by: 'STF-009'},
  {when: addDays(TODAY, -4) + ' 14:22', what: 'Pension employee rate', area: 'Deductions', from: '4.5%', to: '5.0%', by: 'STF-007'},
  {when: addDays(TODAY, -6) + ' 11:30', what: 'Overtime multiplier', area: 'Allowances', from: '1.4×', to: '1.5×', by: 'STF-009'}
];
const SE_AUDIT = [];

/* ---------------- keep every row inside the reporting window ---------------- */
[SE_SALARIES, SE_ADJUSTMENTS, SE_PAYROLL, SE_PAYROLL_LINES, SE_ALLOWANCE_LINES, SE_PAYSLIPS,
 SE_CLAIMS, SE_EXPENSES, SE_SUPPLIER_INVOICES, SE_PAYMENTS, SE_APPROVALS, SE_LEDGER, SE_NOTIFY_LOG,
 SE_CHANGES, SE_MIGRATIONS, SE_BUDGET_REVISIONS].forEach(list => list.forEach(r => {
  ['when', 'effective', 'renewal', 'start', 'end', 'paidOn', 'due', 'paid', 'review', 'lastWrite', 'reminder',
   'contractStart', 'contractEnd', 'submitted'].forEach(k => {
    const v = r[k];
    if(typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v) && v.slice(0, 10) > TODAY)
      r[k] = addDays(TODAY, -1) + v.slice(10);
  });
}));

/* ---------------- stats ---------------- */
const SE_STATUS_COUNTS = () => {
  const c = {total: SE_PAYROLL_LINES.length};
  ['Pending', 'Paid', 'Failed'].forEach(s => { c[s.toLowerCase()] = SE_PAYROLL_LINES.filter(l => l.status === s).length; });
  return c;
};
function seAlerts(){
  return SE_CLAIMS.filter(c => c.status === 'Submitted').length
    + SE_PAYROLL_LINES.filter(l => l.status === 'Failed').length
    + SE_EXPENSES.filter(e => e.status === 'Overdue').length
    + SE_STATUTORY.filter(s => s.status === 'Overdue').length
    + SE_DB_TABLES.filter(t => t.rls !== 'Enabled').length
    + SE_APPROVALS.filter(a => a.status === 'Pending').length;
}
function seStats(){
  const pendingApproval = SE_APPROVALS.filter(a => a.status === 'Pending');
  const paidPayroll = SE_PAYROLL.filter(p => p.status === 'Paid');
  const dueRenewals = SE_RECURRING.filter(r => r.renewal <= addDays(TODAY, SE_SET.reminderDays));
  const unpaidExpenses = SE_EXPENSES.filter(e => ['Pending approval', 'Approved', 'Overdue'].includes(e.status));
  const claimsOpen = SE_CLAIMS.filter(c => ['Submitted', 'Pending approval', 'Returned'].includes(c.status));
  const thisMonth = SE_OPEN_PERIOD;
  const score = clamp(100
    - SE_PAYROLL_LINES.filter(l => l.status === 'Failed').length * 2
    - SE_STATUTORY.filter(s => s.status === 'Overdue').length * 4
    - SE_EXPENSES.filter(e => e.status === 'Overdue').length * 1.5
    - SE_DB_TABLES.filter(t => t.rls !== 'Enabled').length * 5
    - SE_BUDGETS.filter(b => b.status === 'Over budget').length * 1.5
    - SE_CLAIMS.filter(c => c.status === 'Rejected').length * 0.5, 0, 100);
  return {
    total: SE_PAYROLL_LINES.length,
    staff: SE_STAFF.length,
    activeStaff: SE_STAFF.filter(s => s.status === 'Active').length,
    salaries: SE_SALARIES.length,
    salaryTotal: SE_SALARY_TOTAL,
    allowanceTotal: SE_ALLOWANCE_TOTAL,
    bonusTotal: sum(SE_OPEN_PERIOD ? [SE_OPEN_PERIOD] : [], p => p.bonuses) + sum(SE_PAYROLL_LINES, l => l.bonus),
    deductionTotal: SE_DEDUCTION_TOTAL,
    netTotal: SE_NET_TOTAL,
    paye: sum(SE_SALARIES, s => s.paye),
    pension: sum(SE_SALARIES, s => s.pension),
    nhima: sum(SE_SALARIES, s => s.nhima),
    employerPension: Math.round(sum(SE_SALARIES, s => s.basic) * SE_SET.pensionEmployerPct / 100),
    payrollThisMonth: thisMonth ? thisMonth.net : 0,
    payrollGross: thisMonth ? thisMonth.gross : 0,
    payrollStatus: thisMonth ? thisMonth.status : '—',
    payrollPaid: sum(paidPayroll, p => p.net),
    outstandingSalary: sum(SE_PAYROLL_LINES.filter(l => l.status !== 'Paid'), l => l.net),
    paidLines: SE_PAYROLL_LINES.filter(l => l.status === 'Paid').length,
    failedLines: SE_PAYROLL_LINES.filter(l => l.status === 'Failed').length,
    expenses: SE_EXPENSE_TOTAL,
    expensesThisMonth: sum(seExpThisMonth, e => e.amount),
    systemCharges: SE_SYSTEM_TOTAL,
    systemActual: SE_SYSTEM_ACTUAL,
    recurring: SE_RECURRING.length,
    renewalsDue: dueRenewals.length,
    renewalValue: sum(dueRenewals, r => r.expected),
    claims: SE_CLAIMS.length,
    claimsOpen: claimsOpen.length,
    claimsValue: sum(claimsOpen, c => c.amount),
    claimsPaid: sum(SE_CLAIMS.filter(c => c.status === 'Paid'), c => c.amount),
    unpaidExpenses: sum(unpaidExpenses, e => e.amount),
    unpaidCount: unpaidExpenses.length,
    pendingApprovals: pendingApproval.length,
    pendingValue: sum(pendingApproval, a => a.amount),
    suppliers: SE_SUPPLIERS.length,
    supplierUnverified: SE_SUPPLIERS.filter(s => s.verified !== 'Verified').length,
    payments: SE_PAYMENTS.length,
    paymentsFailed: SE_PAYMENTS.filter(p => p.status === 'Failed').length,
    paymentsPending: SE_PAYMENTS.filter(p => p.status === 'Pending confirmation').length,
    paymentsPaid: sum(SE_PAYMENTS.filter(p => p.status === 'Paid'), p => p.amount),
    ledgerNet: sum(SE_LEDGER, e => e.side === 'Debit' ? e.amount : -e.amount),
    operatingCost: SE_SALARY_TOTAL + sum(seExpThisMonth, e => e.amount) + SE_SYSTEM_ACTUAL,
    budgetTotal: SE_SET.monthlyOperatingBudget,
    budgetActual: SE_SALARY_TOTAL + sum(seExpThisMonth, e => e.amount) + SE_SYSTEM_ACTUAL,
    budgetUtil: pct(SE_SALARY_TOTAL + sum(seExpThisMonth, e => e.amount) + SE_SYSTEM_ACTUAL, SE_SET.monthlyOperatingBudget),
    overBudget: SE_BUDGETS.filter(b => b.status === 'Over budget').length,
    statutoryOverdue: SE_STATUTORY.filter(s => s.status === 'Overdue').length,
    payslips: SE_PAYSLIPS.length,
    alerts: seAlerts(),
    score
  };
}
</script>
