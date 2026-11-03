<script>
/* ============================================================
   TRANSFERS MANAGEMENT & CONNECTIONS (7/8)
   Sections 13–16: beneficiaries, receipts and statements, failed
   transfers and reversals, and fraud and security.
   ============================================================ */

const TR_BEN_HISTORY = TR_BEN_CHANGES.map(b => ({when: b.when, ben: b.cust, name: custName(b.cust), action: 'Edited ' + b.field.toLowerCase(),
  from: b.from, to: b.to, by: b.by, status: b.status, lane: b.lane, severity: b.severity, owner: b.owner, region: b.region}));
const TR_RECEIPT_VERIFIED = [];

/* ===================== 13 · BENEFICIARY MANAGEMENT ===================== */
function trBenItem(){
  return TR_BENEFICIARIES.find(b => b.id === TR_SEL.ben) || TR_BENEFICIARIES[0];
}
function renderBeneficiaries(){
  const rows = TR_BENEFICIARIES.filter(trPass);
  const sel = trBenItem();
  if(el('bnPill')){ el('bnPill').className = 'badge b-gray'; el('bnPill').textContent = num(TR_BENEFICIARIES.length) + ' saved'; }
  put('bnKpis', [
    ['Saved beneficiaries', num(TR_BENEFICIARIES.length), 'Across every customer', ''],
    ['Verified', num(TR_BENEFICIARIES.filter(b => b.verified === 'Verified').length), 'Ready to pay', ''],
    ['Unverified', num(TR_BENEFICIARIES.filter(b => b.verified !== 'Verified').length), 'Must be checked first', 'red'],
    ['Disabled', num(TR_BENEFICIARIES.filter(b => b.status === 'Disabled').length), 'Cannot receive a payout', ''],
    ['Bank accounts', num(TR_BENEFICIARIES.filter(b => b.kind === 'Bank account').length), 'Paid over the bank rail', ''],
    ['Mobile wallets', num(TR_BENEFICIARIES.filter(b => b.kind === 'Mobile money').length), 'Paid over Airtel or Mpamba', ''],
    ['Internal payees', num(TR_BENEFICIARIES.filter(b => b.kind === 'Internal account').length), 'Paid inside the ledger', ''],
    ['Value sent to them', trM(sum(TR_COMPLETED.filter(t => TR_BENEFICIARIES.some(b => b.name === t.destName)), t => t.amount)), 'On completed transfers', '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join(''));

  if(el('bnCount')) el('bnCount').textContent = num(rows.length) + ' rows';
  const list = rows.slice();
  list.forEach(b => { b._open = () => { TR_SEL.ben = b.id; renderBeneficiaries(); }; });
  renderTable('bnBody', [
    {k: 'id', label: 'Beneficiary'},
    {k: 'name', label: 'Name'},
    {k: 'kind', label: 'Kind'},
    {k: 'cust', label: 'Customer', html: v => esc(custName(v))},
    {k: 'account', label: 'Account or wallet'},
    {k: 'provider', label: 'Rail'},
    {k: 'verified', label: 'Verification', html: v => okb(v)},
    {k: 'status', label: 'State', html: v => okb(v)}
  ], rows, {sort: 'name', pageSize: 7, dir: 'asc'});

  if(el('bnSelPill')) el('bnSelPill').textContent = sel ? sel.id : '—';
  trFillSel('bnCust', trCustOptions(), sel ? sel.cust : undefined);
  trFillSel('bnBank', TR_BANKS.concat(TR_MOBILE).map(x => [x, x]), sel ? (sel.bank || 'Airtel Money') : undefined);
  if(el('bnName') && !el('bnName').value) el('bnName').value = sel ? sel.name : '';
  if(el('bnAcct') && !el('bnAcct').value) el('bnAcct').value = sel ? sel.account : '';
  if(el('bnKind') && sel) el('bnKind').value = sel.kind;

  const kind = el('bnKind') ? el('bnKind').value : 'Bank account';
  const cust = el('bnCust') ? el('bnCust').value : (sel ? sel.cust : CUSTOMERS[0].id);
  const acctNo = el('bnAcct') ? el('bnAcct').value.trim() : '';
  const checks = [
    ['The customer exists and is active', !!CUST_BY_ID[cust], cust],
    ['The name is complete', (el('bnName') ? el('bnName').value.trim().length : 0) >= 4, el('bnName') ? el('bnName').value : ''],
    ['The account or wallet number has the right length',
      kind === 'Bank account' ? /^\d{8,20}$/.test(acctNo.replace(/\s/g, '')) : /^0\d{9}$/.test(acctNo.replace(/\s/g, '')),
      kind === 'Bank account' ? 'Eight to twenty digits' : 'Ten digits starting with zero'],
    ['The rail matches the kind', kind === 'Internal account' ? /^(CUR|SAV)-/.test(acctNo) : kind === 'Mobile money' ? /^0/.test(acctNo) : true,
      kind],
    ['Not already saved for this customer', !TR_BENEFICIARIES.some(b => b.cust === cust && b.account === acctNo && b.id !== (sel || {}).id), 'Checked against the saved list'],
    ['The customer has no unverified change in the last day',
      !TR_BEN_CHANGES.some(b => b.cust === cust && b.status === 'Unverified'), 'Beneficiary change lock']
  ];
  put('bnChecks', checks.map(([l, ok, d]) => `<div class="checkrow"><div class="ck ${ok ? 'pass' : 'crit'}">${ok ? '✓' : '!'}</div>
      <div style="flex:1"><div style="font-size:10.5px;font-weight:800">${esc(l)}</div><div class="qhint">${esc(String(d))}</div></div>
      <div>${okb(ok ? 'Pass' : 'Failed')}</div></div>`).join(''));

  put('bnDetail', sel ? kvRow('Beneficiary', sel.name) + kvRow('Reference', sel.id)
    + kvRow('Kind', sel.kind) + kvRow('Rail', sel.provider)
    + kvRow('Bank or network', sel.bank || 'Wallet')
    + kvRow('Account or wallet', sel.account)
    + kvRow('Verification', okb(sel.verified)) + kvRow('State', okb(sel.status))
    + kvRow('Added', fmtDate(sel.added)) + kvRow('Last used', fmtDate(sel.lastUsed))
    + kvRow('Customer', custName(sel.cust))
    : '<div class="empty">Nothing selected.</div>');
  if(el('bnDetailPill')) el('bnDetailPill').textContent = sel ? sel.verified : '—';
  if(el('bnMsg') && !String(el('bnMsg').textContent || '').trim())
    el('bnMsg').textContent = 'A new payee is held until a person verifies it; a disabled payee cannot be paid.';

  if(el('bnHistPill')) el('bnHistPill').textContent = num(TR_BEN_HISTORY.length) + ' changes';
  renderTable('bnHistBody', [
    {k: 'when', label: 'When', html: v => esc(trWhen(v))},
    {k: 'action', label: 'Change'},
    {k: 'from', label: 'From', html: v => esc(String(v).slice(0, 18))},
    {k: 'to', label: 'To', html: v => esc(String(v).slice(0, 18))},
    {k: 'by', label: 'Officer', html: v => esc(staffName(v))},
    {k: 'status', label: 'State', html: v => okb(v)}
  ], TR_BEN_HISTORY, {sort: 'when', pageSize: 5});
}

/* ===================== 14 · RECEIPTS AND STATEMENTS ===================== */
function trReceiptItem(){
  return TR_RECEIPTS.find(r => r.receipt === TR_SEL.receipt) || TR_RECEIPTS[0];
}
function renderReceipts(){
  const rows = TR_RECEIPTS.filter(trPass);
  const sel = trReceiptItem();
  if(el('rcPill')){ el('rcPill').className = 'badge b-ok'; el('rcPill').textContent = num(TR_RECEIPTS.length) + ' receipts'; }
  put('rcKpis', [
    ['Receipts issued', num(TR_RECEIPTS.length), 'One per completed transfer', ''],
    ['Value receipted', trM(sum(TR_RECEIPTS, r => r.amount)), 'Across every rail', ''],
    ['Issued automatically', num(TR_RECEIPTS.filter(r => r.issued === 'Automatic').length), 'On completion', ''],
    ['Reissued', num(TR_RECEIPTS.filter(r => r.issued === 'Reissued').length), 'A replacement was printed', ''],
    ['Corrected', num(TR_RECEIPT_CORRECTIONS.length), 'Fields changed after issue', ''],
    ['Verified today', num(TR_RECEIPT_VERIFIED.length), 'Checked against the register', ''],
    ['Numbering', TR_SET.receiptPrefix + '-#####', 'Sequential, never reused', ''],
    ['Fees receipted', trM(sum(TR_RECEIPTS, r => r.fee)), 'Included on the receipt', '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join(''));

  if(el('rcCount')) el('rcCount').textContent = num(rows.length) + ' rows';
  const list = rows.slice();
  list.forEach(r => { r._open = () => { TR_SEL.receipt = r.receipt; renderReceipts(); }; });
  renderTable('rcBody', [
    {k: 'receipt', label: 'Receipt'},
    {k: 'when', label: 'Issued', html: v => esc(trWhen(v))},
    {k: 'cust', label: 'Customer', html: v => esc(custName(v))},
    {k: 'method', label: 'Method'},
    {k: 'amount', label: 'Amount', num: true, html: v => esc(trM(v))},
    {k: 'fee', label: 'Fee', num: true, html: v => esc(trM(v))},
    {k: 'issued', label: 'Issue', html: v => badge(v, v === 'Automatic' ? 'b-ok' : 'b-warn')}
  ], rows, {sort: 'when', pageSize: 7});

  if(el('rcSelPill')) el('rcSelPill').textContent = sel ? sel.receipt : '—';
  put('rcPreview', sel ? brandHtml('Transfer Receipt', sel.receipt)
    + `<div class="pfields" style="grid-template-columns:1fr 1fr">
        ${field('Receipt number', esc(sel.receipt))}
        ${field('Transfer', esc(sel.txn))}
        ${field('Customer', esc(custName(sel.cust)))}
        ${field('Issued', esc(trWhen(sel.when)))}
        ${field('From', esc(sel.source))}
        ${field('To', esc(sel.destName))}
        ${field('Method', esc(sel.method))}
        ${field('Amount', esc(trM(sel.amount)))}
        ${field('Fee', esc(trM(sel.fee)))}
        ${field('Total debited', esc(trM(sel.amount + sel.fee)))}
        ${field('Provider reference', esc(sel.providerRef))}
        ${field('Issue type', esc(sel.issued))}
      </div><div class="qhint" style="margin-top:6px">This receipt is proof of a completed transfer only. A receipt is never issued for a draft, a failed payout or a reversal.</div>`
    : '<div class="empty">Select a receipt in the list.</div>');

  put('rcPartyBox', sel ? kvRow('Paid by', custName(sel.cust)) + kvRow('Source account', sel.source)
    + kvRow('Paid to', sel.destName) + kvRow('Destination', sel.dest)
    + kvRow('Rail', sel.method) + kvRow('Fee payer', ((TR_FEES.find(f => f.method === sel.method) || {}).payer || 'Customer')) : '');

  if(el('rcVerPill')) el('rcVerPill').textContent = num(TR_RECEIPT_VERIFIED.length) + ' verified';
  if(el('rcVerifyInput') && !el('rcVerifyInput').value && sel) el('rcVerifyInput').value = sel.receipt;
  const q = el('rcVerifyInput') ? el('rcVerifyInput').value.trim().toUpperCase() : '';
  const found = TR_RECEIPTS.find(r => r.receipt.toUpperCase() === q);
  put('rcVerifyBox', q ? (found ? `<div class="risk"><div><div class="rn">${esc(found.receipt)} is genuine</div>
      <div class="rs">${esc(found.txn)} · ${esc(custName(found.cust))} · ${esc(trM(found.amount))} · ${esc(trWhen(found.when))}</div></div>
      <div class="rv">${okb('Valid')}</div></div>` : `<div class="risk"><div><div class="rn">${esc(q)} not found</div>
      <div class="rs">No receipt on the register carries that number.</div></div><div class="rv">${badge('Missing', 'b-crit')}</div></div>`)
    : `<div class="qhint">Type a receipt number to check it against the register.</div>`);

  if(el('rcReissueHead')) el('rcReissueHead').textContent = TR_RECEIPT_CORRECTIONS.length + ' corrections';
  renderTable('rcReissueBody', [
    {k: 'receipt', label: 'Receipt'},
    {k: 'when', label: 'Corrected', html: v => esc(trWhen(v))},
    {k: 'field', label: 'Field'},
    {k: 'from', label: 'From'},
    {k: 'to', label: 'To'},
    {k: 'by', label: 'Officer', html: v => esc(staffName(v))},
    {k: 'status', label: 'State', html: v => okb(v)}
  ], TR_RECEIPT_CORRECTIONS, {sort: 'when', pageSize: 4});

  trFillSel('rcStmtCust', trCustOptions(), TR_SEL.stmtCust || undefined);
  if(el('rcFrom') && !el('rcFrom').value) el('rcFrom').value = addDays(TODAY, -30);
  if(el('rcTo') && !el('rcTo').value) el('rcTo').value = TODAY;
  if(el('rcStmtPill')) el('rcStmtPill').textContent = 'On demand';
  renderStatement();
}

function renderStatement(){
  const cust = el('rcStmtCust') ? el('rcStmtCust').value : (CUSTOMERS[0] || {}).id;
  const from = trIsos(el('rcFrom') ? el('rcFrom').value : addDays(TODAY, -30)) || addDays(TODAY, -30);
  const to = trIsos(el('rcTo') ? el('rcTo').value : TODAY) || TODAY;
  TR_SEL.stmtCust = cust;
  const rows = TR_TXN.filter(t => t.cust === cust && trIsos(t.when) >= from && trIsos(t.when) <= to)
    .sort((a, b) => String(b.when).localeCompare(String(a.when)));
  const credit = sum(rows.filter(t => /^SAV|^CUR/.test(t.dest) && t.status === 'Completed'), t => t.amount);
  const debit = sum(rows.filter(t => t.status === 'Completed'), t => t.amount + t.fee);
  put('rcStmtBox', brandHtml('Transfer Statement', custName(cust))
    + strip([['Transfers', num(rows.length)], ['Value out', trM(debit)], ['Value in', trM(credit)], ['Period', fmtDate(from) + ' – ' + fmtDate(to)]])
    + `<div class="tblwrap" style="max-height:280px;margin-top:8px"><table class="tbl2 dense">
        <thead><tr><th>Date</th><th>Reference</th><th>Method</th><th>To</th><th class="num">Amount</th><th>Status</th></tr></thead>
        <tbody>${rows.length ? rows.slice(0, 40).map(t => `<tr><td style="white-space:nowrap">${esc(trWhen(t.when))}</td>
          <td>${esc(t.id)}</td><td>${esc(t.method)}</td><td>${esc(String(t.destName).slice(0, 22))}</td>
          <td class="num">${esc(trM(t.amount))}</td><td>${okb(t.status)}</td></tr>`).join('')
          : '<tr><td colspan="6" class="empty">No transfers in this period.</td></tr>'}</tbody></table></div>`
    + `<div class="qhint" style="margin-top:6px">${esc(custName(cust))} · ${esc(cust)} · statement generated ${fmtDate(TODAY)} from the transfer register.</div>`);
}

/* ===================== 15 · FAILED TRANSFERS AND REVERSALS ===================== */
function trFailedItem(){
  return TR_FAILED.find(f => f.ref === TR_SEL.failed) || TR_FAILED[0];
}
function renderFailed(){
  const rows = TR_FAILED.filter(trPass);
  const sel = trFailedItem();
  const pendingRev = TR_REVERSALS.filter(r => r.status === 'Pending');
  if(el('fqPill')){ el('fqPill').className = 'badge b-crit'; el('fqPill').textContent = num(TR_FAILED.length) + ' failed'; }
  put('fqKpis', [
    ['Failed transfers', num(TR_FAILED.length), 'Refused by a rail', 'red'],
    ['Value lost to failure', trM(sum(TR_FAILED, f => f.amount)), 'Never reached the recipient', ''],
    ['Retryable', num(TR_FAILED.filter(f => /^Yes/.test(f.retryable)).length), 'Can be sent again', ''],
    ['Needs new details', num(TR_FAILED.filter(f => !/^Yes/.test(f.retryable)).length), 'The payee must be fixed', ''],
    ['Reversals raised', num(TR_REVERSALS.length), 'Restoring the source', ''],
    ['Reversals pending', num(pendingRev.length), 'Awaiting a signature', pendingRev.length ? 'red' : ''],
    ['Balances restored', trM(sum(TR_REVERSALS.filter(r => r.restored === 'Yes'), r => r.amount)), 'Back in the customer’s account', ''],
    ['Failure rate', Math.round(pct(TR_FAILED.length, Math.max(1, TR_TXN.length))) + '%', 'Of every transfer recorded', '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join(''));

  if(el('fqQueuePill')) el('fqQueuePill').textContent = num(rows.length) + ' in the queue';
  const list = rows.slice();
  list.forEach(f => { f._open = () => { TR_SEL.failed = f.ref; renderFailed(); }; });
  renderTable('fqBody', [
    {k: 'ref', label: 'Reference'},
    {k: 'txn', label: 'Transfer'},
    {k: 'when', label: 'Failed', html: v => esc(trWhen(v))},
    {k: 'cust', label: 'Customer', html: v => esc(custName(v))},
    {k: 'method', label: 'Method'},
    {k: 'amount', label: 'Amount', num: true, html: v => esc(trM(v))},
    {k: 'reason', label: 'Reason', html: v => esc(String(v).slice(0, 30))},
    {k: 'retryable', label: 'Retry', html: v => badge(v, /^Yes/.test(v) ? 'b-ok' : 'b-warn')},
    {k: '_act', label: '', html: (v, r) => r.status === 'Retried' ? okb('Retried')
      : `<button class="btn btn-ghost" data-fqretry="${esc(r.ref)}">Retry</button>`}
  ], rows, {sort: 'when', pageSize: 6});

  trFillSel('fqReason', ['Provider refused the payout', 'Beneficiary details wrong', 'Recipient wallet not registered',
    'Duplicate transfer', 'Customer asked for it to be stopped', 'Other'].map(x => [x, x]));
  const reason = (el('fqReason') && el('fqReason').value) || 'Provider refused the payout';
  put('fqGuard', `<div class="minihead">What may happen next</div>`
    + kvRow('Selected transfer', sel ? sel.ref : '—')
    + kvRow('Reason', reason)
    + kvRow('Retry allowed', sel && /^Yes/.test(sel.retryable) && reason !== 'Beneficiary details wrong' ? okb('Yes') : badge('No', 'b-warn'))
    + kvRow('Reversal allowed', sel ? 'Yes — the source is restored' : 'No')
    + kvRow('Customer told', okb('Notified by SMS'))
    + kvRow('Second signature', sel && sel.amount > TR_SET.approvalThreshold ? badge('Required', 'b-warn') : 'Not required'));

  if(el('rvPill')){ el('rvPill').className = 'badge b-warn'; el('rvPill').textContent = num(TR_REVERSALS.length) + ' reversals'; }
  const rv = TR_REVERSALS.filter(trPass);
  renderTable('rvBody', [
    {k: 'id', label: 'Reversal'},
    {k: 'txn', label: 'Transfer'},
    {k: 'requested', label: 'Requested', html: v => esc(trWhen(v))},
    {k: 'amount', label: 'Amount', num: true, html: v => esc(trM(v))},
    {k: 'reason', label: 'Reason', html: v => esc(String(v).slice(0, 36))},
    {k: 'status', label: 'State', html: v => okb(v)},
    {k: 'restored', label: 'Restored', html: v => badge(v, v === 'Yes' ? 'b-ok' : 'b-warn')},
    {k: '_act', label: '', html: (v, r) => r.status === 'Posted' ? okb('Restored')
      : `<button class="btn btn-ghost" data-rvid="${esc(r.id)}" data-rvact="${r.status === 'Pending' ? 'approve' : 'post'}">${r.status === 'Pending' ? 'Approve' : 'Post reversal'}</button>`}
  ], rv, {sort: 'requested', pageSize: 5});
  if(el('rvMsg') && !String(el('rvMsg').textContent || '').trim())
    el('rvMsg').textContent = 'A reversal writes the opposite ledger entries and returns the money to the source account.';

  if(el('rvFlowPill')) el('rvFlowPill').textContent = num(TR_REVERSALS.filter(r => r.status === 'Posted').length) + ' posted';
  put('rvFlow', chartBox({title: 'Where reversals stand', sub: 'Count by state', type: 'donut', h: 190,
    cats: ['Pending', 'Approved', 'Posted'],
    series: [{name: 'Reversals', data: ['Pending', 'Approved', 'Posted'].map(st => TR_REVERSALS.filter(r => r.status === st).length)}],
    value: num(TR_REVERSALS.length)}));

  const r1 = TR_REVERSALS[0] || {};
  put('rvRestore', `<div class="minihead">Balance to restore</div>`
    + kvRow('Source account', r1.txn ? ((TR_TXN.find(t => t.id === r1.txn) || {}).source || '—') : '—')
    + kvRow('Amount', trM(r1.amount || 0))
    + kvRow('Fee to refund', trM(r1.txn ? ((TR_TXN.find(t => t.id === r1.txn) || {}).fee || 0) : 0))
    + kvRow('Total restored', trM((r1.amount || 0) + (r1.txn ? ((TR_TXN.find(t => t.id === r1.txn) || {}).fee || 0) : 0)))
    + kvRow('Ledger entries', 'Two opposite entries'));
  if(el('rvProvider')) el('rvProvider').innerHTML = `<div class="minihead">Provider position</div>`
    + kvRow('Provider', r1.type === 'Bank' ? 'FDH Bank' : r1.type === 'Mobile' ? 'Airtel Money' : 'Golden ledger')
    + kvRow('Debit reversed', okb('Yes'))
    + kvRow('Provider reference', r1.ref || '—')
    + kvRow('Confirmation', r1.status === 'Posted' ? okb('Received') : badge('Pending', 'b-warn'));
  if(el('rvDupPill')) el('rvDupPill').textContent = num(TR_DUPLICATES.length) + ' held';
  if(el('rvDup')) el('rvDup').innerHTML = TR_DUPLICATES.length ? TR_DUPLICATES.map(d => `<div class="risk">
      <div><div class="rn">${esc(d.ref)}</div><div class="rs">${esc(d.ids)} · ${esc(trM(d.amount))}</div></div>
      <div class="rv">${badge(d.status, 'b-crit')}</div></div>`).join('')
    : '<div class="qhint">No duplicate reference is held.</div>';
  if(el('rvRecon')) el('rvRecon').innerHTML = `<div class="minihead">Reconciliation after a reversal</div>`
    + kvRow('Account ledger equals balance', Math.abs(sum(TR_DISCREPANCY, d => d.difference)) === 0 ? okb('Balanced') : badge('Discrepancy', 'b-crit'))
    + kvRow('Open discrepancies', String(TR_DISCREPANCY.length))
    + kvRow('Last reconciled', trWhen(TODAY + ' 08:15'))
    + kvRow('Reversal posted to both sides', okb('Yes'));
  if(el('rvNotify')) el('rvNotify').innerHTML = `<div class="minihead">Who is told</div>`
    + kvRow('Customer', okb('SMS and email'))
    + kvRow('Recipient', 'Notified that the payout failed')
    + kvRow('Officer', okb('In-app'))
    + kvRow('Template', 'TRF_REV');

  if(el('rvAuditPill')) el('rvAuditPill').textContent = num(TR_REV_AUDIT.length) + ' entries';
  renderTable('rvAuditBody', [
    {k: 'id', label: 'Reversal'},
    {k: 'txn', label: 'Transfer'},
    {k: 'requested', label: 'Requested', html: v => esc(trWhen(v))},
    {k: 'by', label: 'Raised by', html: v => esc(staffName(v))},
    {k: 'approver', label: 'Signed by', html: v => esc(staffName(v))},
    {k: 'status', label: 'State', html: v => okb(v)}
  ], TR_REV_AUDIT, {sort: 'requested', pageSize: 5});
}

/* ===================== 16 · FRAUD AND SECURITY ===================== */
function renderFraud(){
  const s = trS();
  if(el('frPill')){ el('frPill').className = 'badge b-gray'; el('frPill').textContent = num(TR_FRAUD.length) + ' alerts'; }
  put('frKpis', [
    ['Open security alerts', num(TR_FRAUD.filter(f => f.status !== 'Resolved').length), 'Fraud and misuse', 'red'],
    ['Critical', num(TR_FRAUD.filter(f => f.severity === 'Critical').length), 'Needs an immediate look', ''],
    ['Identity checks', num(TR_ID_CHECKS.length), 'On file for transfers', ''],
    ['Identity pending', num(TR_ID_CHECKS.filter(i => i.checked !== 'Verified').length), 'Not yet checked', ''],
    ['Suspicious patterns', num(TR_AMOUNT_ALERTS.length), 'Amount and behaviour alerts', ''],
    ['Velocity breaches', num(TR_VELOCITY.filter(v => v.status === 'Breach').length), 'Over the 24-hour count', ''],
    ['Beneficiary changes', num(TR_BEN_CHANGES.length), 'One still unverified', ''],
    ['Sensitive actions', num(TR_SENSITIVE.length), 'Need a second signature', '']
  ].map(([l, v, sub, k]) => kpiCard(l, v, sub, k)).join(''));

  if(el('frIdPill')) el('frIdPill').textContent = num(TR_ID_CHECKS.length) + ' checks';
  renderTable('frIdBody', [
    {k: 'ref', label: 'Transfer'},
    {k: 'cust', label: 'Customer', html: v => esc(custName(v))},
    {k: 'doc', label: 'Document'},
    {k: 'number', label: 'Number'},
    {k: 'checked', label: 'Checked', html: v => okb(v)},
    {k: 'by', label: 'Officer', html: v => v && v !== '—' ? esc(staffName(v)) : '—'}
  ], TR_ID_CHECKS, {sort: 'when', pageSize: 6});

  const susp = TR_TXN.filter(t => t.status === 'Pending approval' || t.severity === 'High').filter(trPass);
  if(el('frSuspPill')) el('frSuspPill').textContent = num(susp.length) + ' held';
  const sl = susp.slice();
  sl.forEach(t => { t._open = () => { TR_SEL.txn = t.id; openTransfer(t); }; });
  renderTable('frSuspBody', [
    {k: 'id', label: 'Transfer'},
    {k: 'cust', label: 'Customer', html: v => esc(custName(v))},
    {k: 'method', label: 'Method'},
    {k: 'amount', label: 'Amount', num: true, html: v => esc(trM(v))},
    {k: 'status', label: 'State', html: v => okb(v)}
  ], sl, {sort: 'amount', pageSize: 5});

  if(el('frPatPill')) el('frPatPill').textContent = TR_AMOUNT_ALERTS.length + ' patterns';
  renderTable('frAmtBody', [
    {k: 'ref', label: 'Transfer'},
    {k: 'cust', label: 'Customer', html: v => esc(custName(v))},
    {k: 'amount', label: 'Amount', num: true, html: v => esc(trM(v))},
    {k: 'band', label: 'Pattern'},
    {k: 'status', label: 'State', html: v => okb(v)}
  ], TR_AMOUNT_ALERTS, {sort: 'amount', pageSize: 5});

  if(el('frDupHead')) el('frDupHead').textContent = TR_DUPLICATES.length + ' groups';
  renderTable('frDupBody', [
    {k: 'ref', label: 'Reference'},
    {k: 'count', label: 'Seen', num: true},
    {k: 'ids', label: 'Transfers'},
    {k: 'status', label: 'State', html: v => badge(v, 'b-crit')}
  ], TR_DUPLICATES, {sort: 'count', pageSize: 4});

  if(el('frVel')) el('frVel').innerHTML = `<div class="minihead">Velocities in the last 24 hours</div>`
    + TR_VELOCITY.slice(0, 6).map(v => meter(custName(v.cust), v.transfers24h, v.transfers24h + ' of ' + v.limit + ' transfers · ' + trM(v.amount24h), 6)).join('');
  if(el('frLimit')) el('frLimit').innerHTML = `<div class="minihead">Limits applied to a flagged transfer</div>`
    + kvRow('Per-customer daily', trM(TR_SET.perCustomerDailyLimit))
    + kvRow('Daily across the book', trM(TR_SET.dailyTransferLimit))
    + kvRow('Approval threshold', trM(TR_SET.approvalThreshold))
    + kvRow('Second signature above', trM(TR_SET.secondApprovalThreshold))
    + kvRow('Duplicate window', TR_SET.duplicateWindow + ' minutes')
    + kvRow('Third-party internal', TR_SET.allowThirdPartyInternal ? okb('Allowed') : badge('Blocked', 'b-crit'));

  if(el('frBenPill')) el('frBenPill').textContent = TR_BEN_CHANGES.length + ' changes';
  renderTable('frBenBody', [
    {k: 'when', label: 'When', html: v => esc(trWhen(v))},
    {k: 'cust', label: 'Customer', html: v => esc(custName(v))},
    {k: 'field', label: 'Field'},
    {k: 'from', label: 'From', html: v => esc(String(v).slice(0, 18))},
    {k: 'to', label: 'To', html: v => esc(String(v).slice(0, 18))},
    {k: 'status', label: 'State', html: v => okb(v)}
  ], TR_BEN_CHANGES, {sort: 'when', pageSize: 4});

  if(el('frPermPill')) el('frPermPill').textContent = TR_ROLES.length + ' roles';
  renderTable('frPermBody', [
    {k: 'role', label: 'Role'},
    {k: 'cap', label: 'Capability'},
    {k: 'allowed', label: 'Allowed', html: v => badge(v ? 'Yes' : 'No', v ? 'b-ok' : 'b-gray')}
  ], TR_ROLES.map(r => r).flatMap((r, ri2) => TR_CAPS.map((c, ci) => ({role: r, cap: c, allowed: (TR_PERMS[r] || [])[ci]})))
    .filter(x => x.allowed || x.cap === 'Reverse a transfer'), {sort: 'role', pageSize: 8});

  renderTable('frSensBody', [
    {k: 'id', label: 'Action'},
    {k: 'txn', label: 'Transfer'},
    {k: 'amount', label: 'Amount', num: true, html: v => esc(trM(v))},
    {k: 'level', label: 'Level'},
    {k: 'reason', label: 'Reason', html: v => esc(String(v).slice(0, 34))},
    {k: 'status', label: 'State', html: v => okb(v)}
  ], TR_SENSITIVE, {sort: 'amount', pageSize: 4});

  if(el('frAuditPill')) el('frAuditPill').textContent = num(TR_FRAUD.length + TR_AUDIT_LOG.length) + ' events';
  const events = TR_FRAUD.map(f => ({when: f.when, event: f.event, subject: f.subject, severity: f.severity, status: f.status, owner: f.owner}))
    .concat(TR_AUDIT_LOG.slice(0, 20).map(a => ({when: a.when, event: a.action + ' · ' + a.target, subject: a.detail, severity: a.severity, status: 'Logged', owner: a.owner})))
    .sort((a, b) => String(b.when).localeCompare(String(a.when)));
  put('frAlerts', events.slice(0, 6).map(e => `<div class="risk"><div><div class="rn">${esc(e.event)}</div>
      <div class="rs">${esc(trWhen(e.when))} · ${esc(String(e.subject))} · ${esc(staffName(e.owner))}</div></div>
      <div class="rv">${badge(e.severity, TR_SEV(e.severity))}</div></div>`).join('')
    || '<div class="empty">No security events recorded.</div>');
  renderTable('frAuditBody', [
    {k: 'when', label: 'When', html: v => esc(trWhen(v))},
    {k: 'event', label: 'Event'},
    {k: 'subject', label: 'Subject', html: v => esc(String(v).slice(0, 40))},
    {k: 'severity', label: 'Severity', html: v => badge(v, TR_SEV(v))},
    {k: 'status', label: 'State', html: v => okb(v)}
  ], events, {sort: 'when', pageSize: 6});

  put('frData', `<div class="minihead">What the security layer watches</div>`
    + kvRow('Identity verified before an external payout', TR_SET.requireIdentityForBank ? okb('Required') : badge('Not required', 'b-warn'))
    + kvRow('Beneficiary approved before first use', TR_SET.requireBeneficiaryApproval ? okb('Required') : badge('Not required', 'b-warn'))
    + kvRow('External transfers', TR_SET.allowExternalTransfers ? okb('Allowed') : badge('Blocked', 'b-crit'))
    + kvRow('Sandbox mode', TR_SET.sandbox ? badge('On', 'b-warn') : okb('Off'))
    + kvRow('Audit rows held', num(TR_AUDIT.length + TR_FRAUD.length)));

  put('frGrid',
    chartBox({title: 'Alerts by severity', sub: 'Fraud and security events', type: 'donut', h: 190,
      cats: ['Critical', 'High', 'Medium', 'Low'],
      series: [{name: 'Alerts', data: ['Critical', 'High', 'Medium', 'Low'].map(sv => TR_FRAUD.filter(f => f.severity === sv).length
        + TR_AUDIT.filter(a => a.severity === sv).length)}],
      value: num(TR_FRAUD.length)}) +
    chartBox({title: 'Transfers held for review', sub: 'By state', type: 'bar', h: 190,
      cats: ['Pending approval', 'Pending verification', 'Failed', 'Reversed'],
      series: [{name: 'Transfers', data: ['Pending approval', 'Pending verification', 'Failed', 'Reversed'].map(st => TR_TXN.filter(t => t.status === st).length)}],
      value: num(s.pending)}));
}
</script>
