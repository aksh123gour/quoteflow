import * as XLSX from 'xlsx';
import { downloadBuffer } from '../utils.js';

function sanitize(s) { return String(s || '').replace(/[\/\\:*?"<>|]/g, '-'); }

function fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return isNaN(d) ? iso : d.toLocaleDateString('en-IN');
}

// Excel export for a single document (quotation or invoice)
export function exportDocumentExcel(doc, company, docType) {
  const rows = (doc.items || []).map((it, i) => ({
    '#': i + 1,
    'Description': it.description || '',
    'HSN Code': it.hsn_code || '',
    'Qty': Number(it.qty),
    'Unit Price (₹)': Number(it.unit_price),
    'GST Rate (%)': Number(it.gst_rate),
    'Amount (₹)': Number(it.line_total)
  }));

  rows.push({});
  rows.push({ 'Description': 'Subtotal', 'Amount (₹)': Number(doc.subtotal) });
  if (Number(doc.cgst_amount) > 0) {
    rows.push({ 'Description': 'CGST', 'Amount (₹)': Number(doc.cgst_amount) });
    rows.push({ 'Description': 'SGST', 'Amount (₹)': Number(doc.sgst_amount) });
  }
  if (Number(doc.igst_amount) > 0) rows.push({ 'Description': 'IGST', 'Amount (₹)': Number(doc.igst_amount) });
  if (Number(doc.discount) > 0) rows.push({ 'Description': 'Discount', 'Amount (₹)': -Number(doc.discount) });
  rows.push({ 'Description': 'TOTAL', 'Amount (₹)': Number(doc.total) });

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, docType);

  // Info sheet
  const info = [
    ['Document Type', docType],
    ['Document Number', doc.quote_number || doc.invoice_number || doc.note_number || ''],
    ['Date', fmtDate(doc.issue_date)],
    ['Company', company.name],
    ['Customer', doc.company_name || doc.contact_name || ''],
    ['GSTIN', doc.customer_gst || ''],
  ];
  if (doc.bilty_number) {
    info.splice(3, 0, ['Bilty / LR No.', doc.bilty_number]);
  }
  const wsInfo = XLSX.utils.aoa_to_sheet(info);
  XLSX.utils.book_append_sheet(wb, wsInfo, 'Info');

  const filename = sanitize(doc.quote_number || doc.invoice_number || doc.note_number || 'document') + '.xlsx';
  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  downloadBuffer(buf, filename, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  return { success: true };
}

// GSTR-1 Sales Register export
export function exportSalesRegister(invoices, company, label = 'All Time') {
  const rows = invoices.map((inv) => ({
    'Invoice Number': inv.invoice_number,
    'Date': fmtDate(inv.issue_date),
    'Bilty / LR No': inv.bilty_number || '',
    'Customer Name': inv.company_name || inv.contact_name || '',
    'Customer GSTIN': inv.customer_gst || '',
    'Taxable Amount (₹)': Number(inv.subtotal),
    'CGST (₹)': Number(inv.cgst_amount),
    'SGST (₹)': Number(inv.sgst_amount),
    'IGST (₹)': Number(inv.igst_amount),
    'Discount (₹)': Number(inv.discount || 0),
    'Total (₹)': Number(inv.total),
    'Amount Paid (₹)': Number(inv.amount_paid || 0),
    'Payment Status': inv.payment_status || '',
    'Invoice Status': inv.status || ''
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'GSTR-1 Sales Register');

  // Summary sheet
  const totalTaxable = invoices.reduce((s, i) => s + Number(i.subtotal), 0);
  const totalCgst = invoices.reduce((s, i) => s + Number(i.cgst_amount), 0);
  const totalSgst = invoices.reduce((s, i) => s + Number(i.sgst_amount), 0);
  const totalIgst = invoices.reduce((s, i) => s + Number(i.igst_amount), 0);
  const totalAmount = invoices.reduce((s, i) => s + Number(i.total), 0);

  const summary = [
    ['GSTR-1 Sales Register', ''],
    ['Company', company.name],
    ['GSTIN', company.gst_number || ''],
    ['Period', label],
    ['Generated On', new Date().toLocaleDateString('en-IN')],
    [],
    ['Total Invoices', invoices.length],
    ['Total Taxable Amount', totalTaxable.toFixed(2)],
    ['Total CGST', totalCgst.toFixed(2)],
    ['Total SGST', totalSgst.toFixed(2)],
    ['Total IGST', totalIgst.toFixed(2)],
    ['Total Invoice Value', totalAmount.toFixed(2)],
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summary);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

  const from = label.replace(/\s+/g, '-');
  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  downloadBuffer(buf, `sales-register-${from}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  return { success: true, count: invoices.length };
}

// Monthly Ledger export
export function exportMonthlyLedgerExcel(ledgerData, company, year) {
  const summaryRows = (ledgerData.months || []).map(m => ({
    'Month': m.month_name,
    'Invoices Issued': m.invoice_count,
    'Total Invoiced (₹)': m.total_invoiced,
    'Payments Received (₹)': m.total_received,
    'Outstanding Balance (₹)': m.balance_due
  }));

  summaryRows.push({});
  summaryRows.push({
    'Month': 'TOTAL (' + year + ')',
    'Invoices Issued': ledgerData.grand_invoice_count,
    'Total Invoiced (₹)': ledgerData.grand_total_invoiced,
    'Payments Received (₹)': ledgerData.grand_total_received,
    'Outstanding Balance (₹)': ledgerData.grand_balance_due
  });

  const wb = XLSX.utils.book_new();
  const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Monthly Summary');

  // Detailed Invoices Sheet
  const allInvoices = [];
  (ledgerData.months || []).forEach(m => {
    (m.invoices || []).forEach(inv => {
      allInvoices.push({
        'Month': m.month_name,
        'Invoice Number': inv.invoice_number,
        'Date': fmtDate(inv.issue_date),
        'Bilty / LR No': inv.bilty_number || '',
        'Customer Name': inv.company_name || inv.contact_name || '',
        'Total (₹)': Number(inv.total),
        'Amount Paid (₹)': Number(inv.amount_paid || 0),
        'Balance Due (₹)': Number(inv.total) - Number(inv.amount_paid || 0),
        'Payment Status': inv.payment_status || '',
        'Invoice Status': inv.status || ''
      });
    });
  });

  if (allInvoices.length > 0) {
    const wsInvoices = XLSX.utils.json_to_sheet(allInvoices);
    XLSX.utils.book_append_sheet(wb, wsInvoices, 'Invoice Breakdown');
  }

  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  downloadBuffer(buf, `monthly-ledger-${year}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  return { success: true, count: ledgerData.months.length };
}
