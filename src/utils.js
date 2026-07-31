// ─── Helpers ──────────────────────────────────────────────────────────────────

export function round2(n) { return Math.round(n * 100) / 100; }

export function normalizeState(s) { return String(s || '').trim().toLowerCase(); }

export function sanitizeFilename(s) {
  return String(s || 'document').replace(/[\/\\:*?"<>|]/g, '-');
}

export function calculateTotals(items, companyState, customerState, discount = 0) {
  const sameState = normalizeState(companyState) === normalizeState(customerState);
  let subtotal = 0, cgst = 0, sgst = 0, igst = 0;

  items.forEach((it) => {
    const lineTotal = Number(it.qty) * Number(it.unit_price);
    subtotal += lineTotal;
    const rate = Number(it.gst_rate) || 0;
    if (sameState) {
      cgst += (lineTotal * rate) / 200;
      sgst += (lineTotal * rate) / 200;
    } else {
      igst += (lineTotal * rate) / 100;
    }
  });

  const total = subtotal - Number(discount || 0) + cgst + sgst + igst;
  return { subtotal: round2(subtotal), cgst: round2(cgst), sgst: round2(sgst), igst: round2(igst), total: round2(total) };
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadBuffer(buffer, filename, mimeType) {
  const blob = new Blob([buffer], { type: mimeType });
  downloadBlob(blob, filename);
}

export function formatDate(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  if (isNaN(d)) return isoStr;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function esc(str) {
  return String(str || '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

export function normalizeCustomer(data) {
  return {
    category_id: data.category_id || null,
    price_list_id: data.price_list_id || null,
    contact_name: data.contact_name,
    company_name: data.company_name || null,
    gst_number: data.gst_number || null,
    state: data.state,
    address: data.address || null,
    phone: data.phone || null,
    email: data.email || null,
    payment_terms: data.payment_terms || null,
    notes: data.notes || null
  };
}

export function normalizeProduct(data) {
  return {
    category_id: data.category_id || null,
    name: data.name,
    sku: data.sku || null,
    unit: data.unit || 'unit',
    description: data.description || null,
    hsn_code: data.hsn_code || null,
    gst_rate: data.gst_rate != null ? Number(data.gst_rate) : 18,
    base_price: data.base_price != null ? Number(data.base_price) : 0
  };
}
