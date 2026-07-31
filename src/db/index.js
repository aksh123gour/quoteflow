import Dexie from 'dexie';

export const db = new Dexie('QuoteFlowDB');

db.version(1).stores({
  companies: '++id, name, state',
  users: '++id, name, role',
  customer_categories: '++id, company_id, name',
  price_lists: '++id, company_id, name',
  price_list_items: '++id, [price_list_id+product_id], price_list_id, product_id',
  customers: '++id, company_id, category_id, price_list_id, contact_name, state',
  product_categories: '++id, company_id, name',
  products: '++id, company_id, category_id, name, sku',
  templates: '++id, company_id, name',
  letterheads: '++id, company_id, name',
  quotations: '++id, company_id, customer_id, quote_number, status, issue_date, created_at',
  quotation_items: '++id, quotation_id, product_id',
  invoices: '++id, company_id, quotation_id, customer_id, invoice_number, status, payment_status, issue_date, created_at',
  invoice_items: '++id, invoice_id, product_id',
  invoice_payments: '++id, invoice_id, payment_date',
  delivery_challans: '++id, company_id, customer_id, invoice_id, challan_number, status, issue_date, created_at',
  delivery_challan_items: '++id, challan_id, product_id',
  credit_debit_notes: '++id, company_id, invoice_id, customer_id, note_type, note_number, status, issue_date, created_at',
  credit_debit_note_items: '++id, note_id, product_id',
  activities: '++id, quotation_id, type, created_at',
  follow_ups: '++id, quotation_id, due_date, completed',
  document_audit_log: '++id, company_id, document_type, document_id, created_at',
  settings: 'key'
});




export async function getActiveCompanyId() {
  const row = await db.settings.get('active_company_id');
  if (row && row.value) {
    const exists = await db.companies.get(Number(row.value));
    if (exists) return Number(row.value);
  }
  const first = await db.companies.orderBy('id').first();
  if (first) {
    await db.settings.put({ key: 'active_company_id', value: String(first.id) });
    return first.id;
  }
  return null;
}

export async function getActiveCompany() {
  const id = await getActiveCompanyId();
  if (!id) return null;
  return db.companies.get(id);
}

export async function seedSampleData() {
  const companyCount = await db.companies.count();
  let companyId;

  if (companyCount === 0) {
    companyId = await db.companies.add({
      name: 'Apex Technologies India Pvt Ltd',
      state: 'Madhya Pradesh',
      gst_number: '23AAACA1234A1Z5',
      address: '102 Business Park, M.G. Road, Indore, MP 452001',
      phone: '+91 98765 43210',
      email: 'info@apextech.in',
      bank_details: 'Bank: HDFC Bank\nA/C No: 50200012345678\nIFSC: HDFC0000123\nBranch: Indore Main',
      upi_id: 'apextech@hdfcbank',
      theme_color: '#004ac6',
      created_at: new Date().toISOString()
    });
    await db.users.add({ name: 'Owner', role: 'owner' });
  } else {
    companyId = await getActiveCompanyId();
    await db.companies.update(companyId, {
      name: 'Apex Technologies India Pvt Ltd',
      state: 'Madhya Pradesh',
      gst_number: '23AAACA1234A1Z5',
      address: '102 Business Park, M.G. Road, Indore, MP 452001',
      phone: '+91 98765 43210',
      email: 'info@apextech.in',
      bank_details: 'Bank: HDFC Bank\nA/C No: 50200012345678\nIFSC: HDFC0000123\nBranch: Indore Main',
      upi_id: 'apextech@hdfcbank'
    });
  }

  // Categories & Price Lists
  await db.customer_categories.where('company_id').equals(companyId).delete();
  const catRetail = await db.customer_categories.add({ company_id: companyId, name: 'Retail' });
  const catGovt = await db.customer_categories.add({ company_id: companyId, name: 'Government' });
  const catPrivate = await db.customer_categories.add({ company_id: companyId, name: 'Private' });

  await db.price_lists.where('company_id').equals(companyId).delete();
  const plRetail = await db.price_lists.add({ company_id: companyId, name: 'Retail' });
  const plDealer = await db.price_lists.add({ company_id: companyId, name: 'Dealer' });

  // Customers
  const c1Count = await db.customers.where('company_id').equals(companyId).count();
  if (c1Count === 0) {
    const cust1 = await db.customers.add({
      company_id: companyId,
      category_id: catPrivate,
      price_list_id: plRetail,
      contact_name: 'Rajesh Sharma',
      company_name: 'Reliable Traders & Co.',
      gst_number: '23BBBCC5678B1Z2',
      state: 'Madhya Pradesh',
      address: '45 Commercial Complex, Bhopal, MP 462001',
      phone: '+91 98260 11223',
      email: 'rajesh@reliabletraders.com',
      payment_terms: '50% Advance, 50% on Delivery',
      notes: 'Key client for MP region',
      created_at: new Date().toISOString()
    });

    const cust2 = await db.customers.add({
      company_id: companyId,
      category_id: catGovt,
      price_list_id: plDealer,
      contact_name: 'Anita Patil',
      company_name: 'Skyline Industrial Solutions',
      gst_number: '27CCCDD9012C1Z8',
      state: 'Maharashtra',
      address: '88 BKC Technology Tower, Bandra, Mumbai, MH 400051',
      phone: '+91 98200 44556',
      email: 'anita@skylineind.com',
      payment_terms: 'Net 30 Days',
      notes: 'Inter-state IGST client',
      created_at: new Date().toISOString()
    });

    // Products
    const p1 = await db.products.add({
      company_id: companyId,
      name: 'Industrial Solar Inverter 5kW',
      sku: 'INV-5KW',
      unit: 'unit',
      description: '5kW 3-Phase On-Grid Solar String Inverter with MPPT',
      hsn_code: '85044090',
      gst_rate: 18,
      base_price: 45000,
      created_at: new Date().toISOString()
    });

    const p2 = await db.products.add({
      company_id: companyId,
      name: 'Lithium Battery Storage Pack 10kWh',
      sku: 'BAT-10KW',
      unit: 'set',
      description: '10kWh LiFePO4 Lithium Battery Storage System',
      hsn_code: '85076000',
      gst_rate: 18,
      base_price: 85000,
      created_at: new Date().toISOString()
    });

    const p3 = await db.products.add({
      company_id: companyId,
      name: 'Solar Panel Mounting Aluminum Racks',
      sku: 'RACK-SLR',
      unit: 'set',
      description: 'Anodized Aluminum Mounting Structure for 4 Solar Panels',
      hsn_code: '73089090',
      gst_rate: 18,
      base_price: 3500,
      created_at: new Date().toISOString()
    });

    const now = new Date().toISOString();

    // Quotation 1 (Intra-state MP - CGST + SGST)
    const q1 = await db.quotations.add({
      company_id: companyId,
      customer_id: cust1,
      quote_number: 'QF/2026-27/001',
      revision_number: 1,
      status: 'Approved',
      issue_date: now,
      valid_until: '2026-08-30',
      payment_terms: '50% Advance with Purchase Order, balance prior to dispatch.',
      notes: 'Price includes 1-year onsite warranty and commissioning.',
      subtotal: 104000,
      cgst_amount: 9360,
      sgst_amount: 9360,
      igst_amount: 0,
      discount: 4000,
      total: 118720,
      created_at: now
    });

    await db.quotation_items.add({
      quotation_id: q1, product_id: p1,
      description: 'Industrial Solar Inverter 5kW (85044090)', hsn_code: '85044090',
      qty: 2, unit_price: 45000, gst_rate: 18, line_total: 90000
    });
    await db.quotation_items.add({
      quotation_id: q1, product_id: p3,
      description: 'Solar Panel Mounting Aluminum Racks (73089090)', hsn_code: '73089090',
      qty: 4, unit_price: 3500, gst_rate: 18, line_total: 14000
    });

    // Quotation 2 (Inter-state MH - IGST)
    const q2 = await db.quotations.add({
      company_id: companyId,
      customer_id: cust2,
      quote_number: 'QF/2026-27/002',
      revision_number: 1,
      status: 'Sent',
      issue_date: now,
      valid_until: '2026-09-15',
      payment_terms: 'Net 30 Days from Invoice Date',
      notes: 'Freight charged extra at actuals.',
      subtotal: 130000,
      cgst_amount: 0,
      sgst_amount: 0,
      igst_amount: 23400,
      discount: 0,
      total: 153400,
      created_at: now
    });

    await db.quotation_items.add({
      quotation_id: q2, product_id: p2,
      description: 'Lithium Battery Storage Pack 10kWh (85076000)', hsn_code: '85076000',
      qty: 1, unit_price: 85000, gst_rate: 18, line_total: 85000
    });
    await db.quotation_items.add({
      quotation_id: q2, product_id: p1,
      description: 'Industrial Solar Inverter 5kW (85044090)', hsn_code: '85044090',
      qty: 1, unit_price: 45000, gst_rate: 18, line_total: 45000
    });

    // Invoice 1 (Converted from QF/2026-27/001)
    const inv1 = await db.invoices.add({
      company_id: companyId,
      quotation_id: q1,
      customer_id: cust1,
      invoice_number: 'INV/2026-27/001',
      status: 'Issued',
      payment_status: 'Partially Paid',
      issue_date: now,
      due_date: '2026-08-15',
      payment_terms: '50% Advance with Purchase Order, balance prior to dispatch.',
      notes: 'Thank you for your business!',
      subtotal: 104000,
      cgst_amount: 9360,
      sgst_amount: 9360,
      igst_amount: 0,
      discount: 4000,
      total: 118720,
      amount_paid: 50000,
      created_at: now
    });

    await db.invoice_items.add({
      invoice_id: inv1, product_id: p1,
      description: 'Industrial Solar Inverter 5kW (85044090)', hsn_code: '85044090',
      qty: 2, unit_price: 45000, gst_rate: 18, line_total: 90000
    });
    await db.invoice_items.add({
      invoice_id: inv1, product_id: p3,
      description: 'Solar Panel Mounting Aluminum Racks (73089090)', hsn_code: '73089090',
      qty: 4, unit_price: 3500, gst_rate: 18, line_total: 14000
    });

    // Invoice Payment
    await db.invoice_payments.add({
      invoice_id: inv1,
      amount: 50000,
      payment_date: now,
      mode: 'UPI',
      reference: 'UPI/987612345',
      notes: 'Part advance received via GPay'
    });

    // Delivery Challan
    const ch1 = await db.delivery_challans.add({
      company_id: companyId,
      customer_id: cust1,
      invoice_id: inv1,
      challan_number: 'DC/2026-27/001',
      status: 'Issued',
      issue_date: now,
      transport_mode: 'Road / Truck Transport',
      vehicle_number: 'MP-09-AB-1234',
      eway_bill_number: '341009876543',
      eway_bill_date: now.slice(0, 10),
      notes: 'Dispatched via V-Trans Express',
      created_at: now
    });

    await db.delivery_challan_items.add({
      challan_id: ch1, product_id: p1,
      description: 'Industrial Solar Inverter 5kW', hsn_code: '85044090',
      qty: 2, unit: 'unit', unit_value: 45000
    });
    await db.delivery_challan_items.add({
      challan_id: ch1, product_id: p3,
      description: 'Solar Panel Mounting Aluminum Racks', hsn_code: '73089090',
      qty: 4, unit: 'set', unit_value: 3500
    });

    // Credit Note
    const cn1 = await db.credit_debit_notes.add({
      company_id: companyId,
      invoice_id: inv1,
      customer_id: cust1,
      note_type: 'Credit',
      note_number: 'CN/2026-27/001',
      status: 'Issued',
      reason: 'Volume discount adjustment post issuance',
      issue_date: now,
      subtotal: 5000,
      cgst_amount: 450,
      sgst_amount: 450,
      igst_amount: 0,
      total: 5900,
      notes: 'Credit credited to customer ledger account.',
      created_at: now
    });

    await db.credit_debit_note_items.add({
      note_id: cn1, product_id: p1,
      description: 'Post-sale goodwill discount on Inverter order', hsn_code: '85044090',
      qty: 1, unit_price: 5000, gst_rate: 18, line_total: 5000
    });

    // Activities & Audit logs
    await db.activities.add({ quotation_id: q1, type: 'status_change', content: 'Quotation QF/2026-27/001 approved', created_at: now });
    await db.activities.add({ quotation_id: q1, type: 'note', content: 'Converted to Tax Invoice INV/2026-27/001', created_at: now });
    await db.document_audit_log.add({ company_id: companyId, document_type: 'Quotation', document_id: q1, document_number: 'QF/2026-27/001', action: 'Created', details: 'Status: Approved', created_at: now });
    await db.document_audit_log.add({ company_id: companyId, document_type: 'Invoice', document_id: inv1, document_number: 'INV/2026-27/001', action: 'Created', details: 'Converted from Quotation QF/2026-27/001', created_at: now });
  }

  await db.settings.put({ key: 'active_company_id', value: String(companyId) });
  await db.settings.put({ key: `company_${companyId}_numbering_prefix`, value: 'QF' });
  await db.settings.put({ key: `company_${companyId}_default_gst_rate`, value: '18' });
  await db.settings.put({ key: 'currency', value: 'INR' });
}

export async function seedDefaults() {
  await seedSampleData();
}
