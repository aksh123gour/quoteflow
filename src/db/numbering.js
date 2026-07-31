import { db, getActiveCompanyId } from './index';

function fyLabel(date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const startYear = month >= 3 ? year : year - 1;
  const endYearShort = String((startYear + 1) % 100).padStart(2, '0');
  return `${startYear}-${endYearShort}`;
}

async function nextDocumentNumber(prefixSettingKey, defaultPrefix, seqSettingKeyBase, issueDate) {
  const fy = fyLabel(issueDate);
  const prefixRow = await db.settings.get(prefixSettingKey);
  const prefix = prefixRow ? prefixRow.value : defaultPrefix;

  const seqKey = `${seqSettingKeyBase}_${fy}`;
  const row = await db.settings.get(seqKey);
  const next = row ? parseInt(row.value, 10) : 1;
  const padded = String(next).padStart(3, '0');
  const documentNumber = `${prefix}/${fy}/${padded}`;

  await db.settings.put({ key: seqKey, value: String(next + 1) });
  return documentNumber;
}

export async function generateQuoteNumber(companyId, issueDate = new Date()) {
  return nextDocumentNumber(
    `company_${companyId}_numbering_prefix`, 'QF',
    `company_${companyId}_numbering_next`, issueDate
  );
}

export async function generateInvoiceNumber(companyId, issueDate = new Date()) {
  return nextDocumentNumber(
    `company_${companyId}_invoice_prefix`, 'INV',
    `company_${companyId}_inv_numbering_next`, issueDate
  );
}

export async function generateChallanNumber(companyId, issueDate = new Date()) {
  return nextDocumentNumber(
    `company_${companyId}_challan_prefix`, 'DC',
    `company_${companyId}_challan_numbering_next`, issueDate
  );
}

export async function generateCreditNoteNumber(companyId, issueDate = new Date()) {
  return nextDocumentNumber(
    `company_${companyId}_credit_note_prefix`, 'CN',
    `company_${companyId}_credit_note_numbering_next`, issueDate
  );
}

export async function generateDebitNoteNumber(companyId, issueDate = new Date()) {
  return nextDocumentNumber(
    `company_${companyId}_debit_note_prefix`, 'DN',
    `company_${companyId}_debit_note_numbering_next`, issueDate
  );
}

export { fyLabel };
