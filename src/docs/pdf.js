import QRCode from 'qrcode-svg';
// Note: html2pdf is imported only if needed elsewhere; share path now uses native preview+print

export const DEFAULT_BLOCKS = [
  { type: 'header', enabled: true, showCompanyName: true, showCompanyContact: true },
  { type: 'customer', enabled: true },
  { type: 'items', enabled: true },
  { type: 'totals', enabled: true },
  { type: 'payments', enabled: true },
  { type: 'payment_terms', enabled: true },
  { type: 'notes', enabled: true },
  { type: 'bank', enabled: true },
  { type: 'signature', enabled: true },
  { type: 'footer', enabled: true }
];

function esc(str) {
  return String(str || '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function formatDate(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  if (isNaN(d)) return isoStr;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function getUpiQrSvg(upiId, companyName, amount) {
  if (!upiId) return '';
  try {
    const upiUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(companyName || 'QuoteFlow')}&am=${encodeURIComponent(amount || 0)}&cu=INR`;
    const qr = new QRCode({ text: upiUrl, svgSize: 110, padding: 1 });
    const svgStr = qr.svg();
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svgStr);
  } catch (e) {
    return '';
  }
}

function round2(n) { return Math.round(n * 100) / 100; }
function normalize(s) { return String(s || '').trim().toLowerCase(); }

// In the PWA, letterheadPath is a base64 data URL or null
function letterheadTag(letterheadPath) {
  return letterheadPath ? `<img class="letterhead-img" src="${letterheadPath}">` : '';
}

const DEFAULT_LAYOUT = {
  marginTop: 18,
  marginRight: 16,
  marginBottom: 18,
  marginLeft: 16,
  accentColor: '#004ac6',
  fontSize: 12,
  fontFamily: "'Segoe UI', Arial, sans-serif",
  tableSpacing: 'normal',
  headerAlign: 'split',
  metaAlign: 'right',
  logoAlign: 'left',
};

function buildStyles(layout = {}) {
  const L = { ...DEFAULT_LAYOUT, ...layout };
  const tablePad = L.tableSpacing === 'compact' ? '5px 8px' : L.tableSpacing === 'spacious' ? '14px 12px' : '9px 10px';
  const headerJustify = L.headerAlign === 'split' ? 'space-between' : L.headerAlign === 'center' ? 'center' : L.headerAlign === 'right' ? 'flex-end' : 'flex-start';
  
  return `
    @page { size: A4; margin: ${L.marginTop}mm ${L.marginRight}mm ${L.marginBottom}mm ${L.marginLeft}mm; }
    * { box-sizing: border-box; }
    body { font-family: ${L.fontFamily}; color: #191c1d; font-size: ${L.fontSize}px; }
    .letterhead-img { width: 100%; display: block; margin-bottom: 16px; }
    .header { display: flex; justify-content: ${headerJustify}; align-items: flex-start; border-bottom: 2px solid ${L.accentColor}; padding-bottom: 14px; margin-bottom: 20px; }
    .company-name { font-size: ${Math.round(L.fontSize * 1.67)}px; font-weight: 700; color: ${L.accentColor}; }
    .company-meta { font-size: ${Math.round(L.fontSize * 0.916)}px; color: #555; margin-top: 4px; line-height: 1.5; }
    .quote-meta { text-align: ${L.metaAlign}; }
    .quote-title { font-size: ${Math.round(L.fontSize * 1.33)}px; font-weight: 700; letter-spacing: 0.05em; color: #191c1d; }
    .quote-number { font-size: ${Math.round(L.fontSize * 1.08)}px; font-family: Consolas, monospace; margin-top: 4px; }
    .quote-dates { font-size: ${Math.round(L.fontSize * 0.916)}px; color: #555; margin-top: 6px; line-height: 1.5; }
    .parties { display: flex; justify-content: space-between; margin-bottom: 22px; }
    .party { width: 48%; }
    .party-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #737686; margin-bottom: 4px; }
    .party-name { font-size: ${Math.round(L.fontSize * 1.08)}px; font-weight: 600; }
    .party-meta { font-size: ${Math.round(L.fontSize * 0.916)}px; color: #444; margin-top: 3px; line-height: 1.5; }
    table.items { width: 100%; border-collapse: collapse; margin-bottom: 18px; }
    table.items th { background: #f3f5f7; font-size: 10px; text-transform: uppercase; letter-spacing: 0.03em; color: #555; text-align: left; padding: ${tablePad}; border-bottom: 1px solid #ddd; }
    table.items td { padding: ${tablePad}; border-bottom: 1px solid #eee; font-size: ${Math.round(L.fontSize * 0.958)}px; vertical-align: top; }
    table.items td.c { text-align: center; }
    table.items td.r { text-align: right; }
    .hsn { font-size: 9.5px; color: #888; margin-top: 2px; }
    .totals { display: flex; justify-content: flex-end; margin-bottom: 22px; }
    .totals-box { width: 260px; }
    .totals-line { display: flex; justify-content: space-between; padding: 4px 0; font-size: ${Math.round(L.fontSize * 0.958)}px; }
    .totals-line.grand { border-top: 1.5px solid #191c1d; margin-top: 6px; padding-top: 8px; font-size: ${Math.round(L.fontSize * 1.17)}px; font-weight: 700; }
    .terms { margin-bottom: 18px; }
    .terms-label { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #737686; margin-bottom: 4px; }
    .terms-body { font-size: ${Math.round(L.fontSize * 0.916)}px; color: #333; white-space: pre-wrap; line-height: 1.5; }
    .signature { margin: 40px 0 20px; width: 220px; }
    .signature-line { border-top: 1px solid #999; margin-bottom: 6px; }
    .signature-label { font-size: 10.5px; color: #555; }
    .footer { border-top: 1px solid #ddd; padding-top: 10px; font-size: 9.5px; color: #888; text-align: center; }
    .eway-block { background: #f0f4ff; border: 1px solid #c5d3f5; border-radius: 6px; padding: 10px 14px; margin-bottom: 18px; font-size: 11px; }
    .eway-block-title { font-weight: 700; color: ${L.accentColor}; margin-bottom: 6px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; }
    .eway-grid { display: flex; flex-wrap: wrap; gap: 8px 24px; }
    .eway-field { min-width: 160px; }
    .eway-field label { font-size: 9.5px; color: #666; text-transform: uppercase; display: block; margin-bottom: 2px; }
    .eway-field span { font-weight: 600; color: #191c1d; }
    .eway-notice { background: #fdecea; border: 1px solid #f5c6c2; color: #c62828; font-size: 11px; font-weight: 600; padding: 8px 12px; border-radius: 4px; margin-bottom: 18px; }
    .upi-qr-section { display: flex; align-items: center; gap: 16px; margin-bottom: 18px; padding: 12px; border: 1px solid #ddd; border-radius: 6px; }
    .upi-qr-section img { width: 100px; height: 100px; }
    .upi-qr-info { font-size: 11px; color: #333; }
    .upi-qr-info strong { display: block; margin-bottom: 4px; font-size: 12px; }
  `;
}

function wrapDoc(bodyHtml, layout = {}) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${buildStyles(layout)}</style></head><body>${bodyHtml}</body></html>`;
}

export function buildQuotationHtml(quote, company, template, letterheadPath, layoutOptions = {}) {
  const sameState = normalize(company.state) === normalize(quote.customer_state);
  const blocks = (template && template.blocks) || DEFAULT_BLOCKS;

  const renderers = {
    header: (block) => `
      <div class="header">
        <div>
          ${block.showCompanyName !== false ? `<div class="company-name">${esc(company.name)}</div>` : ''}
          ${block.showCompanyContact !== false ? `
          <div class="company-meta">
            ${company.address ? esc(company.address) + '<br>' : ''}
            ${company.phone ? 'Phone: ' + esc(company.phone) + ' &nbsp;' : ''}${company.email ? 'Email: ' + esc(company.email) : ''}
            ${company.gst_number ? '<br>GSTIN: ' + esc(company.gst_number) : ''}
          </div>` : ''}
        </div>
        <div class="quote-meta">
          <div class="quote-title">QUOTATION</div>
          <div class="quote-number">${esc(quote.quote_number)}${quote.revision_number > 1 ? ' (Rev ' + quote.revision_number + ')' : ''}</div>
          <div class="quote-dates">Issued: ${formatDate(quote.issue_date)}<br>${quote.valid_until ? 'Valid Until: ' + formatDate(quote.valid_until) : ''}</div>
        </div>
      </div>`,
    customer: () => `
      <div class="parties">
        <div class="party">
          <div class="party-label">Bill To</div>
          <div class="party-name">${esc(quote.company_name || quote.contact_name)}</div>
          <div class="party-meta">
            ${quote.company_name ? esc(quote.contact_name) + '<br>' : ''}
            ${quote.customer_address ? esc(quote.customer_address) + '<br>' : ''}
            ${quote.customer_phone ? 'Phone: ' + esc(quote.customer_phone) + '<br>' : ''}
            ${quote.customer_email ? 'Email: ' + esc(quote.customer_email) + '<br>' : ''}
            ${quote.customer_gst ? 'GSTIN: ' + esc(quote.customer_gst) : ''}
          </div>
        </div>
      </div>`,
    items: () => {
      const hasImages = quote.items.some(it => it.product_image);
      return `
      <table class="items">
        <thead><tr>
          ${hasImages ? '<th style="width:44px;padding:6px;"></th>' : ''}
          <th style="width:${hasImages ? '5%' : '5%'}">#</th><th style="width:${hasImages ? '38%' : '42%'}">Description</th>
          <th style="width:10%" class="c">Qty</th><th style="width:16%" class="r">Unit Price</th>
          <th style="width:10%" class="c">GST</th><th style="width:17%" class="r">Amount</th>
        </tr></thead>
        <tbody>
          ${quote.items.map((it, i) => `
            <tr>
              ${hasImages ? `<td style="padding:6px;vertical-align:middle;">${it.product_image ? `<img src="${it.product_image}" style="width:36px;height:36px;object-fit:contain;border-radius:3px;display:block;">` : ''}</td>` : ''}
              <td class="c">${i + 1}</td>
              <td>${esc(it.description)}${it.hsn_code ? `<div class="hsn">HSN: ${esc(it.hsn_code)}</div>` : ''}</td>
              <td class="r">${it.qty}</td><td class="r">₹${Number(it.unit_price).toFixed(2)}</td>
              <td class="c">${it.gst_rate}%</td><td class="r">₹${Number(it.line_total).toFixed(2)}</td>
            </tr>`).join('')}
        </tbody>
      </table>`;
    },
    totals: () => `
      <div class="totals"><div class="totals-box">
        <div class="totals-line"><span>Subtotal</span><span>₹${Number(quote.subtotal).toFixed(2)}</span></div>
        ${sameState
          ? `<div class="totals-line"><span>CGST</span><span>₹${Number(quote.cgst_amount).toFixed(2)}</span></div>
             <div class="totals-line"><span>SGST</span><span>₹${Number(quote.sgst_amount).toFixed(2)}</span></div>`
          : `<div class="totals-line"><span>IGST</span><span>₹${Number(quote.igst_amount).toFixed(2)}</span></div>`}
        ${Number(quote.discount) > 0 ? `<div class="totals-line"><span>Discount</span><span>−₹${Number(quote.discount).toFixed(2)}</span></div>` : ''}
        <div class="totals-line grand"><span>Total</span><span>₹${Number(quote.total).toFixed(2)}</span></div>
      </div></div>`,
    payment_terms: () => quote.payment_terms ? `<div class="terms"><div class="terms-label">Payment Terms</div><div class="terms-body">${esc(quote.payment_terms)}</div></div>` : '',
    notes: () => quote.notes ? `<div class="terms"><div class="terms-label">Notes &amp; Terms</div><div class="terms-body">${esc(quote.notes)}</div></div>` : '',
    bank: () => company.bank_details ? `<div class="terms"><div class="terms-label">Bank Details</div><div class="terms-body">${esc(company.bank_details)}</div></div>` : '',
    payments: () => '',
    signature: () => `<div class="signature"><div class="signature-line"></div><div class="signature-label">Authorized Signatory</div></div>`,
    footer: () => `<div class="footer">This is a computer-generated quotation and does not require a signature unless otherwise stated.</div>`
  };

  const body = `${letterheadTag(letterheadPath)}${blocks.filter(b => b.enabled).map(b => renderers[b.type] ? renderers[b.type](b) : '').join('')}`;
  return wrapDoc(body, layoutOptions);
}

export function buildInvoiceHtml(invoice, company, template, letterheadPath, upiQrDataUrl = null, layoutOptions = {}) {
  const sameState = normalize(company.state) === normalize(invoice.customer_state);
  const blocks = (template && template.blocks) || DEFAULT_BLOCKS;
  const hasPaymentsEntry = blocks.some(b => b.type === 'payments');
  const effectiveBlocks = hasPaymentsEntry ? blocks : (() => {
    const idx = blocks.findIndex(b => b.type === 'totals');
    const copy = [...blocks];
    copy.splice(idx === -1 ? copy.length : idx + 1, 0, { type: 'payments', enabled: true });
    return copy;
  })();
  const balanceDue = round2(Number(invoice.total) - Number(invoice.amount_paid));

  const renderers = {
    header: (block) => `
      <div class="header">
        <div>
          ${block.showCompanyName !== false ? `<div class="company-name">${esc(company.name)}</div>` : ''}
          ${block.showCompanyContact !== false ? `
          <div class="company-meta">
            ${company.address ? esc(company.address) + '<br>' : ''}
            ${company.phone ? 'Phone: ' + esc(company.phone) + ' &nbsp;' : ''}${company.email ? 'Email: ' + esc(company.email) : ''}
            ${company.gst_number ? '<br>GSTIN: ' + esc(company.gst_number) : ''}
          </div>` : ''}
        </div>
        <div class="quote-meta">
          <div class="quote-title">TAX INVOICE</div>
          <div class="quote-number">${esc(invoice.invoice_number)}</div>
          <div class="quote-dates">Issued: ${formatDate(invoice.issue_date)}<br>${invoice.due_date ? 'Due: ' + formatDate(invoice.due_date) : ''}</div>
        </div>
      </div>`,
    customer: () => `
      ${(invoice.eway_bill_number || invoice.bilty_number) ? `
      <div class="eway-block">
        <div class="eway-block-title">📦 Transport &amp; Dispatch Details</div>
        <div class="eway-grid">
          ${invoice.bilty_number ? `<div class="eway-field"><label>Bilty / LR No.</label><span>${esc(invoice.bilty_number)}</span></div>` : ''}
          ${invoice.eway_bill_number ? `<div class="eway-field"><label>E-Way Bill No.</label><span>${esc(invoice.eway_bill_number)}</span></div>` : ''}
          ${invoice.eway_bill_date ? `<div class="eway-field"><label>Date</label><span>${formatDate(invoice.eway_bill_date)}</span></div>` : ''}
          ${invoice.vehicle_number ? `<div class="eway-field"><label>Vehicle No.</label><span>${esc(invoice.vehicle_number)}</span></div>` : ''}
          ${invoice.transporter_name ? `<div class="eway-field"><label>Transporter</label><span>${esc(invoice.transporter_name)}</span></div>` : ''}
          ${invoice.distance_km ? `<div class="eway-field"><label>Distance</label><span>${esc(invoice.distance_km)} km</span></div>` : ''}
        </div>
      </div>` : ''}
      <div class="parties">
        <div class="party">
          <div class="party-label">Bill To</div>
          <div class="party-name">${esc(invoice.company_name || invoice.contact_name)}</div>
          <div class="party-meta">
            ${invoice.company_name ? esc(invoice.contact_name) + '<br>' : ''}
            ${invoice.customer_address ? esc(invoice.customer_address) + '<br>' : ''}
            ${invoice.customer_phone ? 'Phone: ' + esc(invoice.customer_phone) + '<br>' : ''}
            ${invoice.customer_email ? 'Email: ' + esc(invoice.customer_email) + '<br>' : ''}
            ${invoice.customer_gst ? 'GSTIN: ' + esc(invoice.customer_gst) : ''}
          </div>
        </div>
      </div>`,
    items: () => `
      <table class="items">
        <thead><tr>
          <th style="width:5%">#</th><th style="width:42%">Description</th>
          <th style="width:10%" class="c">Qty</th><th style="width:16%" class="r">Unit Price</th>
          <th style="width:10%" class="c">GST</th><th style="width:17%" class="r">Amount</th>
        </tr></thead>
        <tbody>
          ${invoice.items.map((it, i) => `
            <tr>
              <td class="c">${i + 1}</td>
              <td>${esc(it.description)}${it.hsn_code ? `<div class="hsn">HSN: ${esc(it.hsn_code)}</div>` : ''}</td>
              <td class="r">${it.qty}</td><td class="r">₹${Number(it.unit_price).toFixed(2)}</td>
              <td class="c">${it.gst_rate}%</td><td class="r">₹${Number(it.line_total).toFixed(2)}</td>
            </tr>`).join('')}
        </tbody>
      </table>`,
    totals: () => `
      <div class="totals"><div class="totals-box">
        <div class="totals-line"><span>Subtotal</span><span>₹${Number(invoice.subtotal).toFixed(2)}</span></div>
        ${sameState
          ? `<div class="totals-line"><span>CGST</span><span>₹${Number(invoice.cgst_amount).toFixed(2)}</span></div>
             <div class="totals-line"><span>SGST</span><span>₹${Number(invoice.sgst_amount).toFixed(2)}</span></div>`
          : `<div class="totals-line"><span>IGST</span><span>₹${Number(invoice.igst_amount).toFixed(2)}</span></div>`}
        ${Number(invoice.discount) > 0 ? `<div class="totals-line"><span>Discount</span><span>−₹${Number(invoice.discount).toFixed(2)}</span></div>` : ''}
        <div class="totals-line grand"><span>Total</span><span>₹${Number(invoice.total).toFixed(2)}</span></div>
        <div class="totals-line"><span>Amount Paid</span><span>₹${Number(invoice.amount_paid).toFixed(2)}</span></div>
        <div class="totals-line grand" style="color:${balanceDue > 0 ? '#ba1a1a' : '#146c3a'}"><span>Balance Due</span><span>₹${balanceDue.toFixed(2)}</span></div>
      </div></div>`,
    payments: () => (invoice.payments && invoice.payments.length > 0) ? `
      <div class="terms">
        <div class="terms-label">Payment History</div>
        <table class="items" style="margin-top:6px">
          <thead><tr>
            <th style="width:20%">Date</th><th style="width:25%">Mode</th>
            <th style="width:30%">Reference</th><th style="width:25%" class="r">Amount</th>
          </tr></thead>
          <tbody>
            ${invoice.payments.map(p => `
              <tr>
                <td>${formatDate(p.payment_date)}</td><td>${esc(p.mode || '—')}</td>
                <td>${esc(p.reference || '—')}</td><td class="r">₹${Number(p.amount).toFixed(2)}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>` : '',
    payment_terms: () => invoice.payment_terms ? `<div class="terms"><div class="terms-label">Payment Terms</div><div class="terms-body">${esc(invoice.payment_terms)}</div></div>` : '',
    notes: () => invoice.notes ? `<div class="terms"><div class="terms-label">Notes &amp; Terms</div><div class="terms-body">${esc(invoice.notes)}</div></div>` : '',
    bank: () => {
      const bankSection = company.bank_details ? `<div class="terms"><div class="terms-label">Bank Details</div><div class="terms-body">${esc(company.bank_details)}</div></div>` : '';
      
      const qrImgSrc = company.upi_qr_image || upiQrDataUrl || (company.upi_id ? getUpiQrSvg(company.upi_id, company.name, invoice.total) : '');
      const upiSection = qrImgSrc ? `
        <div class="upi-qr-section">
          <img src="${qrImgSrc}" alt="Payment QR Code">
          <div class="upi-qr-info">
            <strong>Scan to Pay via UPI</strong><br>
            Amount: ₹${Number(invoice.total).toFixed(2)}<br>
            ${company.upi_id ? 'UPI ID: <strong>' + esc(company.upi_id) + '</strong>' : ''}
          </div>
        </div>` : '';
      return bankSection + upiSection;
    },
    signature: () => `<div class="signature"><div class="signature-line"></div><div class="signature-label">Authorized Signatory</div></div>`,
    footer: () => `<div class="footer">This is a computer-generated tax invoice.</div>`
  };

  const body = `${letterheadTag(letterheadPath)}${effectiveBlocks.filter(b => b.enabled).map(b => renderers[b.type] ? renderers[b.type](b) : '').join('')}`;
  return wrapDoc(body, layoutOptions);
}

const EWAY_BILL_THRESHOLD = 50000;

export function buildChallanHtml(challan, company, letterheadPath, layoutOptions = {}) {
  const totalValue = challan.total_value != null
    ? Number(challan.total_value)
    : (challan.items || []).reduce((sum, it) => sum + Number(it.qty) * Number(it.unit_value || 0), 0);
  const ewayRequired = totalValue > EWAY_BILL_THRESHOLD;

  const body = `
    ${letterheadTag(letterheadPath)}
    <div class="header">
      <div>
        <div class="company-name">${esc(company.name)}</div>
        <div class="company-meta">
          ${company.address ? esc(company.address) + '<br>' : ''}
          ${company.phone ? 'Phone: ' + esc(company.phone) + ' &nbsp;' : ''}${company.email ? 'Email: ' + esc(company.email) : ''}
          ${company.gst_number ? '<br>GSTIN: ' + esc(company.gst_number) : ''}
        </div>
      </div>
      <div class="quote-meta">
        <div class="quote-title">DELIVERY CHALLAN</div>
        <div class="quote-number">${esc(challan.challan_number)}</div>
        <div class="quote-dates">Issued: ${formatDate(challan.issue_date)}<br>${challan.invoice_number ? 'Against Invoice: ' + esc(challan.invoice_number) : 'Not linked to an invoice'}</div>
      </div>
    </div>
    <div class="parties">
      <div class="party">
        <div class="party-label">Deliver To</div>
        <div class="party-name">${esc(challan.company_name || challan.contact_name)}</div>
        <div class="party-meta">
          ${challan.company_name ? esc(challan.contact_name) + '<br>' : ''}
          ${challan.customer_address ? esc(challan.customer_address) + '<br>' : ''}
          ${challan.customer_phone ? 'Phone: ' + esc(challan.customer_phone) : ''}
        </div>
      </div>
      ${(challan.transport_mode || challan.vehicle_number || challan.bilty_number || ewayRequired) ? `
      <div class="party">
        <div class="party-label">Transport &amp; Dispatch</div>
        <div class="party-meta">
          ${challan.bilty_number ? 'Bilty / LR No: ' + esc(challan.bilty_number) + '<br>' : ''}
          ${challan.transport_mode ? 'Mode: ' + esc(challan.transport_mode) + '<br>' : ''}
          ${challan.vehicle_number ? 'Vehicle No: ' + esc(challan.vehicle_number) + '<br>' : ''}
          ${challan.eway_bill_number
            ? 'E-Way Bill No: ' + esc(challan.eway_bill_number) + (challan.eway_bill_date ? ' (dated ' + formatDate(challan.eway_bill_date) + ')' : '')
            : (ewayRequired ? '<span style="color:#c62828;font-weight:600;">E-Way Bill Required — not yet recorded</span>' : '')}
        </div>
      </div>` : ''}
    </div>
    ${ewayRequired ? `<div class="eway-notice">Goods value ₹${totalValue.toFixed(2)} exceeds the ₹${EWAY_BILL_THRESHOLD.toLocaleString('en-IN')} threshold — an E-Way Bill is required under GST rules.</div>` : ''}
    <table class="items">
      <thead><tr>
        <th style="width:6%">#</th><th style="width:50%">Description</th>
        <th style="width:14%" class="c">HSN</th><th style="width:15%" class="r">Qty</th>
        <th style="width:15%" class="r">Unit</th>
      </tr></thead>
      <tbody>
        ${challan.items.map((it, i) => `
          <tr>
            <td class="c">${i + 1}</td><td>${esc(it.description)}</td>
            <td class="c">${esc(it.hsn_code || '—')}</td>
            <td class="r">${it.qty}</td><td class="r">${esc(it.unit || 'unit')}</td>
          </tr>`).join('')}
      </tbody>
    </table>
    ${challan.notes ? `<div class="terms"><div class="terms-label">Notes</div><div class="terms-body">${esc(challan.notes)}</div></div>` : ''}
    <div class="signature"><div class="signature-line"></div><div class="signature-label">Received in good condition — Signature</div></div>
    <div class="footer">This delivery challan is not a tax invoice.</div>`;

  return wrapDoc(body, layoutOptions);
}

export function buildCreditDebitNoteHtml(note, company, letterheadPath, layoutOptions = {}) {
  const sameState = normalize(company.state) === normalize(note.customer_state);
  const title = note.note_type === 'Debit' ? 'DEBIT NOTE' : 'CREDIT NOTE';

  const body = `
    ${letterheadTag(letterheadPath)}
    <div class="header">
      <div>
        <div class="company-name">${esc(company.name)}</div>
        <div class="company-meta">
          ${company.address ? esc(company.address) + '<br>' : ''}
          ${company.phone ? 'Phone: ' + esc(company.phone) + ' &nbsp;' : ''}${company.email ? 'Email: ' + esc(company.email) : ''}
          ${company.gst_number ? '<br>GSTIN: ' + esc(company.gst_number) : ''}
        </div>
      </div>
      <div class="quote-meta">
        <div class="quote-title">${title}</div>
        <div class="quote-number">${esc(note.note_number)}</div>
        <div class="quote-dates">Issued: ${formatDate(note.issue_date)}<br>Against Invoice: ${esc(note.invoice_number)}</div>
      </div>
    </div>
    <div class="parties">
      <div class="party">
        <div class="party-label">Customer</div>
        <div class="party-name">${esc(note.company_name || note.contact_name)}</div>
        <div class="party-meta">
          ${note.company_name ? esc(note.contact_name) + '<br>' : ''}
          ${note.customer_gst ? 'GSTIN: ' + esc(note.customer_gst) : ''}
        </div>
      </div>
    </div>
    ${note.reason ? `<div class="terms"><div class="terms-label">Reason</div><div class="terms-body">${esc(note.reason)}</div></div>` : ''}
    <table class="items">
      <thead><tr>
        <th style="width:5%">#</th><th style="width:42%">Description</th>
        <th style="width:10%" class="c">Qty</th><th style="width:16%" class="r">Unit Price</th>
        <th style="width:10%" class="c">GST</th><th style="width:17%" class="r">Amount</th>
      </tr></thead>
      <tbody>
        ${note.items.map((it, i) => `
          <tr>
            <td class="c">${i + 1}</td>
            <td>${esc(it.description)}${it.hsn_code ? `<div class="hsn">HSN: ${esc(it.hsn_code)}</div>` : ''}</td>
            <td class="r">${it.qty}</td><td class="r">₹${Number(it.unit_price).toFixed(2)}</td>
            <td class="c">${it.gst_rate}%</td><td class="r">₹${Number(it.line_total).toFixed(2)}</td>
          </tr>`).join('')}
      </tbody>
    </table>
    <div class="totals"><div class="totals-box">
      <div class="totals-line"><span>Subtotal</span><span>₹${Number(note.subtotal).toFixed(2)}</span></div>
      ${sameState
        ? `<div class="totals-line"><span>CGST</span><span>₹${Number(note.cgst_amount).toFixed(2)}</span></div>
           <div class="totals-line"><span>SGST</span><span>₹${Number(note.sgst_amount).toFixed(2)}</span></div>`
        : `<div class="totals-line"><span>IGST</span><span>₹${Number(note.igst_amount).toFixed(2)}</span></div>`}
      <div class="totals-line grand"><span>${note.note_type === 'Debit' ? 'Amount Payable' : 'Amount Credited'}</span><span>₹${Number(note.total).toFixed(2)}</span></div>
    </div></div>
    ${note.notes ? `<div class="terms"><div class="terms-label">Notes</div><div class="terms-body">${esc(note.notes)}</div></div>` : ''}
    <div class="signature"><div class="signature-line"></div><div class="signature-label">Authorized Signatory</div></div>
    <div class="footer">This is a computer-generated ${title.toLowerCase()}, issued against invoice ${esc(note.invoice_number)}.</div>`;

  return wrapDoc(body, layoutOptions);
}

// Opens a print dialog for saving as PDF — the main PDF export mechanism in browsers.
// Optional shareContext: { docTitle, docNumber, htmlBlob } — wires up the WhatsApp share button.
export function printHtmlAsPdf(html, title, shareContext = null) {
  const iframe = document.getElementById('pdf-preview-iframe');
  const overlay = document.getElementById('pdf-preview-overlay');
  const titleEl = document.getElementById('pdf-preview-title');
  if (!iframe || !overlay) return;

  titleEl.textContent = title || 'Document Preview';
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  iframe.src = url;
  overlay.classList.remove('hidden');

  // Store current html blob for share use
  overlay._currentHtml = html;
  overlay._currentTitle = shareContext?.docTitle || title || 'Document';
  overlay._currentDocNumber = shareContext?.docNumber || '';

  document.getElementById('pdf-print-btn').onclick = () => {
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
  };

  // Wire up the WhatsApp share button if it exists
  const waBtn = document.getElementById('pdf-wa-share-btn');
  if (waBtn) {
    waBtn.style.display = '';
    waBtn.onclick = () => shareFromPreview(overlay._currentHtml, overlay._currentDocNumber, overlay._currentTitle);
  }

  document.getElementById('pdf-preview-close').onclick = () => {
    overlay.classList.add('hidden');
    URL.revokeObjectURL(url);
    if (waBtn) waBtn.style.display = 'none';
  };
}

// Share the document from the preview overlay via WhatsApp.
// Generates a real PDF file (html2pdf DOM-injection) and shares it.
async function shareFromPreview(html, docNumber, docTitle) {
  const safeName = (docTitle || 'Document') + (docNumber ? '_' + docNumber : '');
  const pdfName  = safeName.replace(/[\/\\?%*:|"<>\s]/g, '_') + '.pdf';
  const msgText  = 'Please find ' + (docNumber ? 'document ' + docNumber : 'the attached document') + ' from QuoteFlow.';

  const waBtn = document.getElementById('pdf-wa-share-btn');
  const savedLabel = waBtn ? waBtn.innerHTML : '';
  if (waBtn) { waBtn.disabled = true; waBtn.innerHTML = '<span style="opacity:.7">Generating PDF\u2026</span>'; }

  try {
    const pdfBlob = await generatePdfBlob(html, pdfName);
    const pdfFile = new File([pdfBlob], pdfName, { type: 'application/pdf' });

    if (waBtn) { waBtn.disabled = false; waBtn.innerHTML = savedLabel; }

    // Try native Web Share API with the PDF file
    if (typeof navigator.share === 'function' &&
        typeof navigator.canShare === 'function' &&
        navigator.canShare({ files: [pdfFile] })) {
      try {
        await navigator.share({ title: docTitle, text: msgText, files: [pdfFile] });
        return;
      } catch (err) {
        if (err.name === 'AbortError') return;
        console.warn('Native share rejected, falling back:', err);
      }
    }

    // Fallback: download PDF + open WhatsApp
    const blobUrl = URL.createObjectURL(pdfFile);
    const a = document.createElement('a');
    a.href = blobUrl; a.download = pdfName;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);

    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const waMsg = encodeURIComponent(msgText + '\n\n("' + pdfName + '" downloaded \u2014 please attach it to this chat.)');
    window.open(isMobile ? 'https://api.whatsapp.com/send?text=' + waMsg : 'https://web.whatsapp.com/send?text=' + waMsg, '_blank');
  } catch (err) {
    if (waBtn) { waBtn.disabled = false; waBtn.innerHTML = savedLabel; }
    console.error('PDF share error:', err);
    alert('Could not generate PDF: ' + (err.message || err));
  }
}

// Generates a PDF Blob from a full HTML document string.
// IMPORTANT: Renders in the MAIN document DOM (not inside an iframe).
// html2canvas cannot cross iframe browsing context boundaries — this approach avoids that.
export async function generatePdfBlob(html, fileName = 'document.pdf') {
  const { default: html2pdf } = await import('html2pdf.js');

  // Parse the HTML and extract styles + body content
  const parser  = new DOMParser();
  const parsed  = parser.parseFromString(html, 'text/html');
  const rawCSS  = Array.from(parsed.querySelectorAll('style'))
                    .map(s => s.textContent).join('\n')
                    .replace(/@page\s*\{[^}]*\}/g, ''); // @page unsupported by html2canvas

  // Inject styles into the main document head (temporary)
  const styleEl = document.createElement('style');
  styleEl.setAttribute('data-pdf-tmp', '1');
  styleEl.textContent = rawCSS;
  document.head.appendChild(styleEl);

  // Create a hidden off-screen container at A4 pixel width (794px @ 96dpi)
  // position:fixed at x:-9999px is off-screen yet still rendered + painted by the browser
  const container = document.createElement('div');
  container.setAttribute('data-pdf-tmp', '1');
  container.style.cssText = 'position:fixed;left:-9999px;top:0;width:794px;background:#fff;overflow:visible;z-index:-9999;';
  container.innerHTML = parsed.body.innerHTML;
  document.body.appendChild(container);

  try {
    // Give browser time to apply CSS, calculate layout, and load fonts
    await new Promise(r => setTimeout(r, 700));

    const opt = {
      margin:      0,
      filename:    fileName,
      image:       { type: 'jpeg', quality: 0.97 },
      html2canvas: {
        scale:           2,
        useCORS:         true,
        logging:         false,
        windowWidth:     794,
        scrollX:         0,
        scrollY:         0,
        backgroundColor: '#ffffff',
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait', compress: true },
    };

    return await html2pdf().set(opt).from(container).outputPdf('blob');
  } finally {
    document.querySelectorAll('[data-pdf-tmp]').forEach(el => el.remove());
  }
}

export async function generatePdfFile(html, fileName = 'document.pdf') {
  const safeName  = String(fileName || 'document').replace(/[\/\\?%*:|"<>]/g, '_');
  const finalName = safeName.endsWith('.pdf') ? safeName : safeName + '.pdf';
  const blob      = await generatePdfBlob(html, finalName);
  return new File([blob], finalName, { type: 'application/pdf' });
}
