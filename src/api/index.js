// ─── Browser API Shim ──────────────────────────────────────────────────────────
// This module implements the exact same window.api interface as preload.js in the
// original Electron app. renderer.js calls window.api.* exactly as before — this
// shim translates those calls to async Dexie.js IndexedDB operations instead of
// Electron IPC + SQLite.

import { db, getActiveCompanyId, getActiveCompany } from '../db/index.js';
import {
  generateQuoteNumber, generateInvoiceNumber,
  generateChallanNumber, generateCreditNoteNumber, generateDebitNoteNumber
} from '../db/numbering.js';
import {
  calculateTotals, round2, normalizeCustomer, normalizeProduct,
  downloadBuffer, sanitizeFilename
} from '../utils.js';
import {
  buildQuotationHtml, buildInvoiceHtml, buildChallanHtml,
  buildCreditDebitNoteHtml, DEFAULT_BLOCKS, printHtmlAsPdf, generatePdfFile
} from '../docs/pdf.js';
import { exportDocumentExcel, exportSalesRegister, exportMonthlyLedgerExcel } from '../docs/excel.js';

// ─── Helper: full document fetchers ──────────────────────────────────────────

async function getFullQuoteById(id) {
  const quote = await db.quotations.get(id);
  if (!quote) return null;
  const customer = await db.customers.get(quote.customer_id);
  if (!customer) return null;
  const rawItems = await db.quotation_items.where('quotation_id').equals(id).sortBy('id');
  // Enrich items with product image
  const items = await Promise.all(rawItems.map(async (it) => {
    if (it.product_id) {
      const prod = await db.products.get(it.product_id);
      return { ...it, product_image: prod?.image || null };
    }
    return { ...it, product_image: null };
  }));
  return {
    ...quote,
    contact_name: customer.contact_name,
    company_name: customer.company_name,
    customer_state: customer.state,
    customer_gst: customer.gst_number,
    customer_address: customer.address,
    customer_phone: customer.phone,
    customer_email: customer.email,
    price_list_id: customer.price_list_id,
    items
  };
}

async function getFullInvoiceById(id) {
  const invoice = await db.invoices.get(id);
  if (!invoice) return null;
  const customer = await db.customers.get(invoice.customer_id);
  if (!customer) return null;
  const items = await db.invoice_items.where('invoice_id').equals(id).sortBy('id');
  const payments = await db.invoice_payments.where('invoice_id').equals(id).reverse().sortBy('payment_date');
  return {
    ...invoice,
    contact_name: customer.contact_name,
    company_name: customer.company_name,
    customer_state: customer.state,
    customer_gst: customer.gst_number,
    customer_address: customer.address,
    customer_phone: customer.phone,
    customer_email: customer.email,
    items, payments,
    balance_due: round2(Number(invoice.total) - Number(invoice.amount_paid || 0))
  };
}

async function getFullChallanById(id) {
  const challan = await db.delivery_challans.get(id);
  if (!challan) return null;
  const customer = await db.customers.get(challan.customer_id);
  if (!customer) return null;
  let invoice_number = null;
  if (challan.invoice_id) {
    const inv = await db.invoices.get(challan.invoice_id);
    if (inv) invoice_number = inv.invoice_number;
  }
  const items = await db.delivery_challan_items.where('challan_id').equals(id).sortBy('id');
  const total_value = round2(items.reduce((sum, it) => sum + Number(it.qty) * Number(it.unit_value || 0), 0));
  return {
    ...challan,
    contact_name: customer.contact_name,
    company_name: customer.company_name,
    customer_address: customer.address,
    customer_phone: customer.phone,
    invoice_number,
    items, total_value
  };
}

async function getFullNoteById(id) {
  const note = await db.credit_debit_notes.get(id);
  if (!note) return null;
  const customer = await db.customers.get(note.customer_id);
  if (!customer) return null;
  const invoice = await db.invoices.get(note.invoice_id);
  const items = await db.credit_debit_note_items.where('note_id').equals(id).sortBy('id');
  return {
    ...note,
    contact_name: customer.contact_name,
    company_name: customer.company_name,
    customer_gst: customer.gst_number,
    customer_state: customer.state,
    invoice_number: invoice ? invoice.invoice_number : '',
    items
  };
}

async function recomputeInvoicePayment(invoiceId) {
  const invoice = await db.invoices.get(invoiceId);
  if (!invoice) return;
  const payments = await db.invoice_payments.where('invoice_id').equals(invoiceId).toArray();
  const amountPaid = round2(payments.reduce((s, p) => s + Number(p.amount), 0));
  let paymentStatus = 'Unpaid';
  if (amountPaid > 0 && amountPaid < invoice.total) paymentStatus = 'Partially Paid';
  else if (amountPaid >= invoice.total && invoice.total > 0) paymentStatus = 'Paid';
  await db.invoices.update(invoiceId, { amount_paid: amountPaid, payment_status: paymentStatus });
}

async function resolveLetterhead(letterheadId) {
  if (!letterheadId) return null;
  const row = await db.letterheads.get(letterheadId);
  return row ? row.data_url : null;
}

async function resolveTemplateAndLetterhead(doc) {
  let template = { blocks: DEFAULT_BLOCKS };
  if (doc.template_id) {
    const t = await db.templates.get(doc.template_id);
    if (t) template = { blocks: typeof t.blocks_json === 'string' ? JSON.parse(t.blocks_json) : t.blocks_json };
  }
  const letterheadPath = await resolveLetterhead(doc.letterhead_id);
  return { template, letterheadPath };
}

async function logActivity(quotationId, type, content) {
  await db.activities.add({ quotation_id: quotationId, type, content, created_at: new Date().toISOString() });
}

async function logDocumentAudit(companyId, documentType, documentId, documentNumber, action, details) {
  await db.document_audit_log.add({
    company_id: companyId, document_type: documentType, document_id: documentId,
    document_number: documentNumber, action, details: details || null,
    created_at: new Date().toISOString()
  });
}

async function insertItems(quotationId, items) {
  for (const it of items) {
    await db.quotation_items.add({
      quotation_id: quotationId,
      product_id: it.product_id || null,
      description: it.description,
      hsn_code: it.hsn_code || null,
      qty: Number(it.qty),
      unit_price: Number(it.unit_price),
      gst_rate: Number(it.gst_rate) || 0,
      line_total: round2(Number(it.qty) * Number(it.unit_price))
    });
  }
}

async function insertInvoiceItems(invoiceId, items) {
  for (const it of items) {
    await db.invoice_items.add({
      invoice_id: invoiceId,
      product_id: it.product_id || null,
      description: it.description,
      hsn_code: it.hsn_code || null,
      qty: Number(it.qty),
      unit_price: Number(it.unit_price),
      gst_rate: Number(it.gst_rate) || 0,
      line_total: round2(Number(it.qty) * Number(it.unit_price))
    });
  }
}

// ─── Build window.api ─────────────────────────────────────────────────────────

export function buildWindowApi() {
  const api = {

    // ─── Companies ─────────────────────────────────────────────────────────

    companies: {
      list: async () => {
        const activeId = await getActiveCompanyId();
        const all = await db.companies.orderBy('name').toArray();
        return all.map(c => ({ ...c, is_active: c.id === activeId }));
      },
      get: async (id) => db.companies.get(id),
      create: async (data) => {
        const id = await db.companies.add({
          name: data.name || '',
          trade_name: data.trade_name || null,
          gst_number: data.gst_number || null,
          state: data.state || null,
          address: data.address || null,
          pincode: data.pincode || null,
          phone: data.phone || null,
          email: data.email || null,
          bank_name: data.bank_name || null,
          account_number: data.account_number || null,
          ifsc_code: data.ifsc_code || null,
          branch: data.branch || null,
          upi_id: data.upi_id || null,
          theme_color: data.theme_color || '#004ac6',
          created_at: new Date().toISOString()
        });
        return { id };
      },
      update: async (id, data) => {
        await db.companies.update(id, {
          name: data.name || '',
          trade_name: data.trade_name || null,
          gst_number: data.gst_number || null,
          state: data.state || null,
          address: data.address || null,
          pincode: data.pincode || null,
          phone: data.phone || null,
          email: data.email || null,
          bank_name: data.bank_name || null,
          account_number: data.account_number || null,
          ifsc_code: data.ifsc_code || null,
          branch: data.branch || null,
          upi_id: data.upi_id || null,
          theme_color: data.theme_color || '#004ac6'
        });
        return { success: true };
      },
      setActive: async (id) => {
        await db.settings.put({ key: 'active_company_id', value: String(id) });
        return { success: true };
      },
      delete: async (id) => {
        const total = await db.companies.count();
        if (total <= 1) return { success: false, reason: 'Cannot delete the only company profile.' };
        const [cCount, pCount, qCount] = await Promise.all([
          db.customers.where('company_id').equals(id).count(),
          db.products.where('company_id').equals(id).count(),
          db.quotations.where('company_id').equals(id).count()
        ]);
        if (cCount > 0 || pCount > 0 || qCount > 0) {
          return { success: false, reason: 'This company has customers, products, or quotations on record and cannot be deleted.' };
        }
        await db.companies.delete(id);
        const activeId = await getActiveCompanyId();
        if (activeId === id) {
          const first = await db.companies.orderBy('id').first();
          if (first) await db.settings.put({ key: 'active_company_id', value: String(first.id) });
        }
        return { success: true };
      }
    },

    company: {
      get: async () => getActiveCompany(),
      update: async (data) => {
        const companyId = await getActiveCompanyId();
        const update = {
          name: data.name, gst_number: data.gst_number || null, state: data.state,
          address: data.address || null, phone: data.phone || null, email: data.email || null,
          bank_details: data.bank_details || null, theme_color: data.theme_color || '#004ac6',
          upi_id: data.upi_id || null
        };
        // Only update QR image if caller explicitly included the key
        if ('upi_qr_image' in data) update.upi_qr_image = data.upi_qr_image;
        await db.companies.update(companyId, update);
        return { success: true };
      },
      updateQr: async (imageDataUrl) => {
        const companyId = await getActiveCompanyId();
        await db.companies.update(companyId, { upi_qr_image: imageDataUrl || null });
        return { success: true };
      }
    },

    // ─── Customer Categories ────────────────────────────────────────────────

    customerCategories: {
      list: async () => {
        const id = await getActiveCompanyId();
        return db.customer_categories.where('company_id').equals(id).sortBy('name');
      },
      create: async (name) => {
        const id = await getActiveCompanyId();
        const newId = await db.customer_categories.add({ company_id: id, name });
        return { id: newId };
      },
      delete: async (id) => {
        const count = await db.customers.where('category_id').equals(id).count();
        if (count > 0) return { success: false, reason: `${count} customer${count === 1 ? '' : 's'} use this category and it can't be deleted.` };
        await db.customer_categories.delete(id);
        return { success: true };
      }
    },

    // ─── Product Categories ─────────────────────────────────────────────────

    productCategories: {
      list: async () => {
        const id = await getActiveCompanyId();
        return db.product_categories.where('company_id').equals(id).sortBy('name');
      },
      create: async (name) => {
        const id = await getActiveCompanyId();
        const newId = await db.product_categories.add({ company_id: id, name });
        return { id: newId };
      },
      delete: async (id) => {
        const count = await db.products.where('category_id').equals(id).count();
        if (count > 0) return { success: false, reason: `${count} product${count === 1 ? '' : 's'} use this category and it can't be deleted.` };
        await db.product_categories.delete(id);
        return { success: true };
      }
    },

    // ─── Price Lists ────────────────────────────────────────────────────────

    priceLists: {
      list: async () => {
        const id = await getActiveCompanyId();
        return db.price_lists.where('company_id').equals(id).sortBy('name');
      },
      create: async (name) => {
        const id = await getActiveCompanyId();
        const newId = await db.price_lists.add({ company_id: id, name });
        return { id: newId };
      },
      delete: async (id) => {
        const count = await db.customers.where('price_list_id').equals(id).count();
        if (count > 0) return { success: false, reason: `${count} customer${count === 1 ? '' : 's'} use this price list and it can't be deleted.` };
        await db.price_list_items.where('price_list_id').equals(id).delete();
        await db.price_lists.delete(id);
        return { success: true };
      }
    },

    priceListItems: {
      getForList: async (priceListId) => {
        const companyId = await getActiveCompanyId();
        const products = await db.products.where('company_id').equals(companyId).sortBy('name');
        const items = await db.price_list_items.where('price_list_id').equals(priceListId).toArray();
        const itemMap = {};
        items.forEach(it => { itemMap[it.product_id] = it.price; });
        return products.map(p => ({
          id: p.id, name: p.name, sku: p.sku, base_price: p.base_price,
          override_price: itemMap[p.id] != null ? itemMap[p.id] : null
        }));
      },
      save: async (priceListId, items) => {
        for (const it of items) {
          if (it.price === null || it.price === '' || it.price === undefined) {
            await db.price_list_items.where('[price_list_id+product_id]').equals([priceListId, it.product_id]).delete();
          } else {
            const existing = await db.price_list_items.where('[price_list_id+product_id]').equals([priceListId, it.product_id]).first();
            if (existing) {
              await db.price_list_items.update(existing.id, { price: Number(it.price) });
            } else {
              await db.price_list_items.add({ price_list_id: priceListId, product_id: it.product_id, price: Number(it.price) });
            }
          }
        }
        return { success: true };
      }
    },

    // ─── Customers ──────────────────────────────────────────────────────────

    customers: {
      list: async () => {
        const companyId = await getActiveCompanyId();
        const customers = await db.customers.where('company_id').equals(companyId).reverse().sortBy('created_at');
        const categories = await db.customer_categories.toArray();
        const priceLists = await db.price_lists.toArray();
        const catMap = {}, plMap = {};
        categories.forEach(c => { catMap[c.id] = c.name; });
        priceLists.forEach(pl => { plMap[pl.id] = pl.name; });
        return customers.map(c => ({
          ...c,
          category_name: catMap[c.category_id] || null,
          price_list_name: plMap[c.price_list_id] || null
        }));
      },
      create: async (data) => {
        const companyId = await getActiveCompanyId();
        const id = await db.customers.add({
          company_id: companyId, ...normalizeCustomer(data),
          created_at: new Date().toISOString()
        });
        return { id };
      },
      update: async (id, data) => {
        await db.customers.update(id, normalizeCustomer(data));
        return { success: true };
      },
      delete: async (id) => {
        const quoteCount = await db.quotations.where('customer_id').equals(id).count();
        if (quoteCount > 0) {
          return { success: false, reason: `This customer has ${quoteCount} quotation${quoteCount === 1 ? '' : 's'} on record and can't be deleted.` };
        }
        await db.customers.delete(id);
        return { success: true };
      }
    },

    // ─── Products ───────────────────────────────────────────────────────────

    products: {
      list: async () => {
        const companyId = await getActiveCompanyId();
        const products = await db.products.where('company_id').equals(companyId).reverse().sortBy('created_at');
        const categories = await db.product_categories.toArray();
        const catMap = {};
        categories.forEach(c => { catMap[c.id] = c.name; });
        return products.map(p => ({ ...p, category_name: catMap[p.category_id] || null }));
      },
      create: async (data) => {
        const companyId = await getActiveCompanyId();
        const payload = {
          company_id: companyId, ...normalizeProduct(data),
          image: data.image || null,
          created_at: new Date().toISOString()
        };
        const id = await db.products.add(payload);
        return { id };
      },
      update: async (id, data) => {
        const updates = normalizeProduct(data);
        // Only write image if explicitly provided (prevents wiping on edit without changing image)
        if ('image' in data) updates.image = data.image || null;
        await db.products.update(id, updates);
        return { success: true };
      },
      delete: async (id) => {
        const itemCount = await db.quotation_items.where('product_id').equals(id).count();
        if (itemCount > 0) {
          return { success: false, reason: `This product appears in ${itemCount} quotation line item${itemCount === 1 ? '' : 's'} and can't be deleted.` };
        }
        await db.price_list_items.where('product_id').equals(id).delete();
        await db.products.delete(id);
        return { success: true };
      }
    },

    // ─── Templates & Letterheads ────────────────────────────────────────────

    templates: {
      list: async () => {
        const companyId = await getActiveCompanyId();
        const templates = await db.templates.where('company_id').equals(companyId).sortBy('name');
        return templates.map(t => ({
          ...t, blocks: typeof t.blocks_json === 'string' ? JSON.parse(t.blocks_json) : t.blocks_json
        }));
      },
      create: async ({ name, blocks }) => {
        const companyId = await getActiveCompanyId();
        const id = await db.templates.add({ company_id: companyId, name, blocks_json: JSON.stringify(blocks) });
        return { id };
      },
      update: async (id, { name, blocks }) => {
        await db.templates.update(id, { name, blocks_json: JSON.stringify(blocks) });
        return { success: true };
      },
      delete: async (id) => {
        const count = await db.quotations.where('template_id').equals(id).count();
        if (count > 0) return { success: false, reason: `${count} quotation${count === 1 ? '' : 's'} use this template and it can't be deleted.` };
        await db.templates.delete(id);
        return { success: true };
      }
    },

    letterheads: {
      list: async () => {
        const companyId = await getActiveCompanyId();
        return db.letterheads.where('company_id').equals(companyId).sortBy('name');
      },
      upload: async () => {
        // In the PWA, we use a browser file picker instead of Electron dialog
        return new Promise((resolve) => {
          const input = document.getElementById('letterhead-file-input');
          if (!input) return resolve({ success: false, canceled: true });
          input.onchange = async () => {
            const file = input.files[0];
            if (!file) return resolve({ success: false, canceled: true });
            const reader = new FileReader();
            reader.onload = async (e) => {
              const dataUrl = e.target.result;
              const companyId = await getActiveCompanyId();
              const name = file.name.replace(/\.[^.]+$/, '');
              const id = await db.letterheads.add({ company_id: companyId, name, data_url: dataUrl });
              resolve({ success: true, id, name, file_path: dataUrl });
            };
            reader.readAsDataURL(file);
            input.value = '';
          };
          input.click();
        });
      },
      delete: async (id) => {
        const count = await db.quotations.where('letterhead_id').equals(id).count();
        if (count > 0) return { success: false, reason: `${count} quotation${count === 1 ? '' : 's'} use this letterhead and it can't be deleted.` };
        await db.letterheads.delete(id);
        return { success: true };
      }
    },

    // ─── Settings ───────────────────────────────────────────────────────────

    settings: {
      get: async () => {
        const companyId = await getActiveCompanyId();
        const prefix = `company_${companyId}_`;
        const all = await db.settings.toArray();
        const result = {};
        all.filter(r => r.key.startsWith(prefix)).forEach(r => {
          result[r.key.replace(prefix, '')] = r.value;
        });
        return result;
      },
      update: async (updates) => {
        const companyId = await getActiveCompanyId();
        for (const [key, value] of Object.entries(updates)) {
          await db.settings.put({ key: `company_${companyId}_${key}`, value: String(value) });
        }
        return { success: true };
      }
    },
    
    layout: {
      get: async (docType = 'universal') => {
        const row = await db.settings.get(`layout_${docType}`);
        return row ? JSON.parse(row.value) : null;
      },
      save: async (docType = 'universal', prefs) => {
        await db.settings.put({ key: `layout_${docType}`, value: JSON.stringify(prefs) });
        return { success: true };
      },
      getEffective: async (docType) => {
        const specific = await db.settings.get(`layout_${docType}`);
        if (specific) return JSON.parse(specific.value);
        const universal = await db.settings.get('layout_universal');
        if (universal) return JSON.parse(universal.value);
        return null;
      }
    },

    // ─── Quotations ──────────────────────────────────────────────────────────

    quotations: {
      productsForCustomer: async (customerId) => {
        const customer = await db.customers.get(customerId);
        const priceListId = customer ? customer.price_list_id : null;
        const companyId = await getActiveCompanyId();
        const products = await db.products.where('company_id').equals(companyId).sortBy('name');
        let itemMap = {};
        if (priceListId) {
          const items = await db.price_list_items.where('price_list_id').equals(priceListId).toArray();
          items.forEach(it => { itemMap[it.product_id] = it.price; });
        }
        return products.map(p => ({
          ...p, override_price: itemMap[p.id] != null ? itemMap[p.id] : null,
          resolved_price: itemMap[p.id] != null ? itemMap[p.id] : p.base_price
        }));
      },
      list: async () => {
        const companyId = await getActiveCompanyId();
        const quotes = await db.quotations.where('company_id').equals(companyId).reverse().sortBy('created_at');
        const customers = await db.customers.toArray();
        const custMap = {};
        customers.forEach(c => { custMap[c.id] = c; });
        return quotes.map(q => {
          const c = custMap[q.customer_id] || {};
          return { ...q, contact_name: c.contact_name, company_name: c.company_name };
        });
      },
      get: async (id) => getFullQuoteById(id),
      create: async (payload) => {
        const company = await getActiveCompany();
        const customer = await db.customers.get(payload.customer_id);
        if (!customer) throw new Error('Customer not found');
        const calc = calculateTotals(payload.items, company.state, customer.state, payload.discount || 0);
        const user = await db.users.toCollection().first();
        const quoteNumber = await generateQuoteNumber(company.id, new Date());
        const now = new Date().toISOString();
        const id = await db.quotations.add({
          company_id: company.id, user_id: user ? user.id : null,
          customer_id: payload.customer_id, template_id: payload.template_id || null,
          letterhead_id: payload.letterhead_id || null, quote_number: quoteNumber,
          revision_number: 1, status: payload.status || 'Draft',
          issue_date: payload.issue_date || now, valid_until: payload.valid_until || null,
          payment_terms: payload.payment_terms || null, notes: payload.notes || null,
          subtotal: calc.subtotal, cgst_amount: calc.cgst, sgst_amount: calc.sgst,
          igst_amount: calc.igst, discount: Number(payload.discount || 0),
          total: calc.total, created_at: now
        });
        await insertItems(id, payload.items);
        await logActivity(id, 'status_change', `Quote ${quoteNumber} created as ${payload.status || 'Draft'}`);
        await logDocumentAudit(company.id, 'Quotation', id, quoteNumber, 'Created', `Status: ${payload.status || 'Draft'}`);
        return { id, quote_number: quoteNumber };
      },
      update: async (id, payload) => {
        const company = await getActiveCompany();
        const customer = await db.customers.get(payload.customer_id);
        if (!customer) throw new Error('Customer not found');
        const calc = calculateTotals(payload.items, company.state, customer.state, payload.discount || 0);
        await db.quotations.update(id, {
          customer_id: payload.customer_id, template_id: payload.template_id || null,
          letterhead_id: payload.letterhead_id || null, status: payload.status || 'Draft',
          valid_until: payload.valid_until || null, payment_terms: payload.payment_terms || null,
          notes: payload.notes || null, subtotal: calc.subtotal, cgst_amount: calc.cgst,
          sgst_amount: calc.sgst, igst_amount: calc.igst, discount: Number(payload.discount || 0),
          total: calc.total
        });
        await db.quotation_items.where('quotation_id').equals(id).delete();
        await insertItems(id, payload.items);
        return { success: true };
      },
      delete: async (id) => {
        await db.quotation_items.where('quotation_id').equals(id).delete();
        await db.follow_ups.where('quotation_id').equals(id).delete();
        await db.activities.where('quotation_id').equals(id).delete();
        await db.quotations.delete(id);
        return { success: true };
      },
      updateStatus: async (id, status) => {
        const quote = await db.quotations.get(id);
        await db.quotations.update(id, { status });
        await logActivity(id, 'status_change', `Status changed to ${status}`);
        if (quote) await logDocumentAudit(quote.company_id, 'Quotation', id, quote.quote_number, 'Status Changed', `New status: ${status}`);
        return { success: true };
      },
      convertToInvoice: async (id) => {
        const quote = await getFullQuoteById(id);
        if (!quote) throw new Error('Quotation not found');
        const existing = await db.invoices.where('quotation_id').equals(id).first();
        if (existing) return { id: existing.id, invoice_number: existing.invoice_number, already_existed: true };
        const company = await getActiveCompany();
        const invoiceNumber = await generateInvoiceNumber(company.id, new Date());
        const now = new Date().toISOString();
        const invoiceId = await db.invoices.add({
          company_id: quote.company_id, quotation_id: quote.id, customer_id: quote.customer_id,
          template_id: quote.template_id || null, letterhead_id: quote.letterhead_id || null,
          invoice_number: invoiceNumber, status: 'Issued', issue_date: now,
          due_date: quote.valid_until || null, payment_terms: quote.payment_terms || null,
          notes: quote.notes || null, subtotal: quote.subtotal, cgst_amount: quote.cgst_amount,
          sgst_amount: quote.sgst_amount, igst_amount: quote.igst_amount, discount: quote.discount,
          total: quote.total, amount_paid: 0, payment_status: 'Unpaid', created_at: now
        });
        await insertInvoiceItems(invoiceId, quote.items);
        await logActivity(quote.id, 'status_change', `Converted to invoice ${invoiceNumber}`);
        await logDocumentAudit(quote.company_id, 'Invoice', invoiceId, invoiceNumber, 'Created', `Converted from Quotation ${quote.quote_number}`);
        if (quote.status !== 'Approved') await db.quotations.update(quote.id, { status: 'Approved' });
        return { id: invoiceId, invoice_number: invoiceNumber };
      },
      previewPdf: async (id) => {
        const quote = await getFullQuoteById(id);
        if (!quote) throw new Error('Quotation not found');
        const company = await db.companies.get(quote.company_id);
        const { template, letterheadPath } = await resolveTemplateAndLetterhead(quote);
        const layout = await api.layout.getEffective('quotation') || {};
        const html = buildQuotationHtml(quote, company, template, letterheadPath, layout);
        printHtmlAsPdf(html, `Preview — ${quote.quote_number}`, { docTitle: 'Quotation', docNumber: quote.quote_number });
        return { success: true };
      },
      exportPdf: async (id) => {
        const quote = await getFullQuoteById(id);
        if (!quote) throw new Error('Quotation not found');
        const company = await db.companies.get(quote.company_id);
        const { template, letterheadPath } = await resolveTemplateAndLetterhead(quote);
        const layout = await api.layout.getEffective('quotation') || {};
        const html = buildQuotationHtml(quote, company, template, letterheadPath, layout);
        printHtmlAsPdf(html, `Export — ${quote.quote_number}`, { docTitle: 'Quotation', docNumber: quote.quote_number });
        return { success: true };
      },
      // getShareContext: open the preview with WhatsApp share button pre-wired
      getPdfFile: async (id) => {
        return api.quotations.exportPdf(id);
      },
      exportSelectedPdf: async (ids) => {
        for (const id of ids) {
          const quote = await getFullQuoteById(id);
          if (!quote) continue;
          const company = await db.companies.get(quote.company_id);
          const { template, letterheadPath } = await resolveTemplateAndLetterhead(quote);
          const layout = await api.layout.getEffective('quotation') || {};
          const html = buildQuotationHtml(quote, company, template, letterheadPath, layout);
          printHtmlAsPdf(html, `Export — ${quote.quote_number}`);
          await new Promise(r => setTimeout(r, 500));
        }
        return { success: true, count: ids.length };
      },
      exportExcel: async (id) => {
        const quote = await getFullQuoteById(id);
        if (!quote) throw new Error('Quotation not found');
        const company = await db.companies.get(quote.company_id);
        return exportDocumentExcel(quote, company, 'QUOTATION');
      },
      exportWord: async (id) => {
        // Word export not available in PWA (requires heavy library) — open PDF instead
        return api.quotations.exportPdf(id);
      }
    },

    // ─── Invoices ────────────────────────────────────────────────────────────

    invoices: {
      list: async () => {
        const companyId = await getActiveCompanyId();
        const invoices = await db.invoices.where('company_id').equals(companyId).reverse().sortBy('created_at');
        const customers = await db.customers.toArray();
        const custMap = {};
        customers.forEach(c => { custMap[c.id] = c; });
        return invoices.map(inv => {
          const c = custMap[inv.customer_id] || {};
          return { ...inv, contact_name: c.contact_name, company_name: c.company_name };
        });
      },
      get: async (id) => getFullInvoiceById(id),
      create: async (payload) => {
        const company = await getActiveCompany();
        const customer = await db.customers.get(payload.customer_id);
        if (!customer) throw new Error('Customer not found');
        const calc = calculateTotals(payload.items, company.state, customer.state, payload.discount || 0);
        const invoiceNumber = await generateInvoiceNumber(company.id, new Date());
        const now = new Date().toISOString();
        const invoiceId = await db.invoices.add({
          company_id: company.id, quotation_id: null, customer_id: payload.customer_id,
          template_id: payload.template_id || null, letterhead_id: payload.letterhead_id || null,
          invoice_number: invoiceNumber, status: 'Issued', issue_date: payload.issue_date || now,
          due_date: payload.due_date || null, payment_terms: payload.payment_terms || null,
          notes: payload.notes || null, subtotal: calc.subtotal, cgst_amount: calc.cgst,
          sgst_amount: calc.sgst, igst_amount: calc.igst, discount: Number(payload.discount || 0),
          total: calc.total, amount_paid: 0, payment_status: 'Unpaid',
          bilty_number: payload.bilty_number || null,
          eway_bill_number: payload.eway_bill_number || null, eway_bill_date: payload.eway_bill_date || null,
          vehicle_number: payload.vehicle_number || null, transporter_name: payload.transporter_name || null, distance_km: payload.distance_km || null,
          created_at: now
        });
        await insertInvoiceItems(invoiceId, payload.items);
        await logDocumentAudit(company.id, 'Invoice', invoiceId, invoiceNumber, 'Created', 'Direct Tax Invoice');
        return { id: invoiceId, invoice_number: invoiceNumber };
      },
      cancel: async (id) => {
        const invoice = await db.invoices.get(id);
        await db.invoices.update(id, { status: 'Cancelled' });
        if (invoice) await logDocumentAudit(invoice.company_id, 'Invoice', id, invoice.invoice_number, 'Cancelled', null);
        return { success: true };
      },
      delete: async (id) => {
        await db.invoice_items.where('invoice_id').equals(id).delete();
        await db.invoice_payments.where('invoice_id').equals(id).delete();
        await db.invoices.delete(id);
        return { success: true };
      },
      updateEwayBill: async (id, data) => {
        await db.invoices.update(id, {
          bilty_number: data.bilty_number || null,
          eway_bill_number: data.eway_bill_number || null,
          eway_bill_date: data.eway_bill_date || null,
          vehicle_number: data.vehicle_number || null,
          transporter_name: data.transporter_name || null,
          distance_km: data.distance_km || null
        });
        return { success: true };
      },
      previewPdf: async (id) => {
        const invoice = await getFullInvoiceById(id);
        if (!invoice) throw new Error('Invoice not found');
        const company = await db.companies.get(invoice.company_id);
        const { template, letterheadPath } = await resolveTemplateAndLetterhead(invoice);
        const layout = await api.layout.getEffective('invoice') || {};
        const html = buildInvoiceHtml(invoice, company, template, letterheadPath, null, layout);
        printHtmlAsPdf(html, `Preview — ${invoice.invoice_number}`, { docTitle: 'Invoice', docNumber: invoice.invoice_number });
        return { success: true };
      },
      exportPdf: async (id) => {
        const invoice = await getFullInvoiceById(id);
        if (!invoice) throw new Error('Invoice not found');
        const company = await db.companies.get(invoice.company_id);
        const { template, letterheadPath } = await resolveTemplateAndLetterhead(invoice);
        const layout = await api.layout.getEffective('invoice') || {};
        const html = buildInvoiceHtml(invoice, company, template, letterheadPath, null, layout);
        printHtmlAsPdf(html, `Export — ${invoice.invoice_number}`, { docTitle: 'Invoice', docNumber: invoice.invoice_number });
        return { success: true };
      },
      // getPdfFile now opens the preview (which includes the WhatsApp share button)
      getPdfFile: async (id) => {
        return api.invoices.exportPdf(id);
      },
      exportExcel: async (id) => {
        const invoice = await getFullInvoiceById(id);
        if (!invoice) throw new Error('Invoice not found');
        const company = await db.companies.get(invoice.company_id);
        return exportDocumentExcel(invoice, company, 'TAX INVOICE');
      },
      exportWord: async (id) => {
        return api.invoices.exportPdf(id);
      }
    },

    // ─── Invoice Payments ────────────────────────────────────────────────────

    invoicePayments: {
      list: async (invoiceId) => {
        return db.invoice_payments.where('invoice_id').equals(invoiceId).reverse().sortBy('payment_date');
      },
      create: async (payload) => {
        const invoice = await db.invoices.get(payload.invoice_id);
        if (!invoice) throw new Error('Invoice not found');
        const amount = Number(payload.amount);
        if (!amount || amount <= 0) throw new Error('Payment amount must be greater than zero');
        const id = await db.invoice_payments.add({
          invoice_id: payload.invoice_id, amount,
          payment_date: payload.payment_date || new Date().toISOString(),
          mode: payload.mode || null, reference: payload.reference || null,
          notes: payload.notes || null
        });
        await recomputeInvoicePayment(payload.invoice_id);
        if (invoice.quotation_id) {
          await logActivity(invoice.quotation_id, 'note', `Payment of ₹${amount.toFixed(2)} recorded against ${invoice.invoice_number}`);
        }
        return { id };
      },
      delete: async (id) => {
        const payment = await db.invoice_payments.get(id);
        if (!payment) return { success: false, reason: 'Payment not found' };
        await db.invoice_payments.delete(id);
        await recomputeInvoicePayment(payment.invoice_id);
        return { success: true };
      }
    },

    // ─── Challans ────────────────────────────────────────────────────────────

    challans: {
      list: async () => {
        const companyId = await getActiveCompanyId();
        const challans = await db.delivery_challans.where('company_id').equals(companyId).reverse().sortBy('created_at');
        const customers = await db.customers.toArray();
        const invoices = await db.invoices.toArray();
        const custMap = {}, invMap = {};
        customers.forEach(c => { custMap[c.id] = c; });
        invoices.forEach(inv => { invMap[inv.id] = inv; });

        const result = [];
        for (const ch of challans) {
          const items = await db.delivery_challan_items.where('challan_id').equals(ch.id).toArray();
          const total_value = round2(items.reduce((s, it) => s + Number(it.qty) * Number(it.unit_value || 0), 0));
          const c = custMap[ch.customer_id] || {};
          const inv = invMap[ch.invoice_id] || {};
          result.push({
            ...ch, contact_name: c.contact_name, company_name: c.company_name,
            invoice_number: inv.invoice_number || null, total_value
          });
        }
        return result;
      },
      get: async (id) => getFullChallanById(id),
      create: async (payload) => {
        const company = await getActiveCompany();
        const customer = await db.customers.get(payload.customer_id);
        if (!customer) throw new Error('Customer not found');
        if (!payload.items || payload.items.length === 0) return { success: false, reason: 'Add at least one item before saving.' };
        const challanNumber = await generateChallanNumber(company.id, new Date());
        const now = new Date().toISOString();
        const challanId = await db.delivery_challans.add({
          company_id: company.id, customer_id: payload.customer_id,
          invoice_id: payload.invoice_id || null, letterhead_id: payload.letterhead_id || null,
          challan_number: challanNumber, status: 'Issued',
          issue_date: payload.issue_date || now,
          transport_mode: payload.transport_mode || null, vehicle_number: payload.vehicle_number || null,
          bilty_number: payload.bilty_number || null,
          eway_bill_number: payload.eway_bill_number || null, eway_bill_date: payload.eway_bill_date || null,
          notes: payload.notes || null, created_at: now
        });
        for (const it of payload.items) {
          await db.delivery_challan_items.add({
            challan_id: challanId, product_id: it.product_id || null,
            description: it.description, hsn_code: it.hsn_code || null,
            qty: Number(it.qty), unit: it.unit || 'unit', unit_value: Number(it.unit_value) || 0
          });
        }
        await logDocumentAudit(company.id, 'Challan', challanId, challanNumber, 'Created', payload.invoice_id ? `Linked to invoice ID ${payload.invoice_id}` : 'Standalone');
        return { success: true, id: challanId, challan_number: challanNumber };
      },
      updateEwayBill: async (id, data) => {
        await db.delivery_challans.update(id, {
          bilty_number: data.bilty_number || null,
          eway_bill_number: data.eway_bill_number || null,
          eway_bill_date: data.eway_bill_date || null,
          transport_mode: data.transport_mode || null,
          vehicle_number: data.vehicle_number || null
        });
        return { success: true };
      },
      cancel: async (id) => {
        const challan = await db.delivery_challans.get(id);
        await db.delivery_challans.update(id, { status: 'Cancelled' });
        if (challan) await logDocumentAudit(challan.company_id, 'Challan', id, challan.challan_number, 'Cancelled', null);
        return { success: true };
      },
      previewPdf: async (id) => {
        const challan = await getFullChallanById(id);
        if (!challan) throw new Error('Challan not found');
        const company = await db.companies.get(challan.company_id);
        const letterheadPath = await resolveLetterhead(challan.letterhead_id);
        const layout = await api.layout.getEffective('challan') || {};
        const html = buildChallanHtml(challan, company, letterheadPath, layout);
        printHtmlAsPdf(html, `Preview — ${challan.challan_number}`);
        return { success: true };
      },
      exportPdf: async (id) => {
        const challan = await getFullChallanById(id);
        if (!challan) throw new Error('Challan not found');
        const company = await db.companies.get(challan.company_id);
        const letterheadPath = await resolveLetterhead(challan.letterhead_id);
        const layout = await api.layout.getEffective('challan') || {};
        const html = buildChallanHtml(challan, company, letterheadPath, layout);
        printHtmlAsPdf(html, `Export — ${challan.challan_number}`, { docTitle: 'Delivery Challan', docNumber: challan.challan_number });
        return { success: true };
      },
      getPdfFile: async (id) => api.challans.exportPdf(id),
      exportWord: async (id) => api.challans.exportPdf(id),
      updateEwayBill: async (id, data) => {
        await db.delivery_challans.update(id, {
          eway_bill_number: data.eway_bill_number || null,
          eway_bill_date: data.eway_bill_date || null,
          bilty_number: 'bilty_number' in data ? (data.bilty_number || null) : undefined
        });
        return { success: true };
      }
    },

    // ─── Credit/Debit Notes ──────────────────────────────────────────────────

    creditDebitNotes: {
      list: async () => {
        const companyId = await getActiveCompanyId();
        const notes = await db.credit_debit_notes.where('company_id').equals(companyId).reverse().sortBy('created_at');
        const customers = await db.customers.toArray();
        const invoices = await db.invoices.toArray();
        const custMap = {}, invMap = {};
        customers.forEach(c => { custMap[c.id] = c; });
        invoices.forEach(inv => { invMap[inv.id] = inv; });
        return notes.map(n => ({
          ...n,
          contact_name: (custMap[n.customer_id] || {}).contact_name,
          company_name: (custMap[n.customer_id] || {}).company_name,
          invoice_number: (invMap[n.invoice_id] || {}).invoice_number
        }));
      },
      get: async (id) => getFullNoteById(id),
      create: async (payload) => {
        const company = await getActiveCompany();
        const invoice = await db.invoices.get(payload.invoice_id);
        if (!invoice) throw new Error('Invoice not found');
        if (invoice.status !== 'Issued') return { success: false, reason: 'Notes can only be issued against an active (non-cancelled) invoice.' };
        if (!payload.items || payload.items.length === 0) return { success: false, reason: 'Add at least one item before saving.' };
        const customer = await db.customers.get(invoice.customer_id);
        const calc = calculateTotals(payload.items, company.state, customer.state, 0);
        const noteNumber = payload.note_type === 'Debit'
          ? await generateDebitNoteNumber(company.id, new Date())
          : await generateCreditNoteNumber(company.id, new Date());
        const now = new Date().toISOString();
        const noteId = await db.credit_debit_notes.add({
          company_id: company.id, invoice_id: payload.invoice_id, customer_id: invoice.customer_id,
          letterhead_id: payload.letterhead_id || null,
          note_type: payload.note_type === 'Debit' ? 'Debit' : 'Credit',
          note_number: noteNumber, status: 'Issued', reason: payload.reason || null,
          issue_date: payload.issue_date || now, subtotal: calc.subtotal,
          cgst_amount: calc.cgst, sgst_amount: calc.sgst, igst_amount: calc.igst,
          total: calc.total, notes: payload.notes || null, created_at: now
        });
        for (const it of payload.items) {
          await db.credit_debit_note_items.add({
            note_id: noteId, product_id: it.product_id || null,
            description: it.description, hsn_code: it.hsn_code || null,
            qty: Number(it.qty), unit_price: Number(it.unit_price),
            gst_rate: Number(it.gst_rate) || 0,
            line_total: round2(Number(it.qty) * Number(it.unit_price))
          });
        }
        await logDocumentAudit(company.id, payload.note_type === 'Debit' ? 'Debit Note' : 'Credit Note', noteId, noteNumber, 'Created', `Against invoice ${invoice.invoice_number}`);
        return { success: true, id: noteId, note_number: noteNumber };
      },
      cancel: async (id) => {
        const note = await db.credit_debit_notes.get(id);
        await db.credit_debit_notes.update(id, { status: 'Cancelled' });
        if (note) await logDocumentAudit(note.company_id, note.note_type === 'Debit' ? 'Debit Note' : 'Credit Note', id, note.note_number, 'Cancelled', null);
        return { success: true };
      },
      previewPdf: async (id) => {
        const note = await getFullNoteById(id);
        if (!note) throw new Error('Note not found');
        const company = await db.companies.get(note.company_id);
        const letterheadPath = await resolveLetterhead(note.letterhead_id);
        const layout = await api.layout.getEffective('note') || {};
        const html = buildCreditDebitNoteHtml(note, company, letterheadPath, layout);
        const label = note.note_type === 'Debit' ? 'Debit Note' : 'Credit Note';
        printHtmlAsPdf(html, `Preview — ${note.note_number}`, { docTitle: label, docNumber: note.note_number });
        return { success: true };
      },
      exportPdf: async (id) => {
        const note = await getFullNoteById(id);
        if (!note) throw new Error('Note not found');
        const company = await db.companies.get(note.company_id);
        const letterheadPath = await resolveLetterhead(note.letterhead_id);
        const layout = await api.layout.getEffective('note') || {};
        const html = buildCreditDebitNoteHtml(note, company, letterheadPath, layout);
        const label = note.note_type === 'Debit' ? 'Debit Note' : 'Credit Note';
        printHtmlAsPdf(html, `Export — ${note.note_number}`, { docTitle: label, docNumber: note.note_number });
        return { success: true };
      },
      getPdfFile: async (id) => api.creditDebitNotes.exportPdf(id),
      exportExcel: async (id) => {
        const note = await getFullNoteById(id);
        if (!note) throw new Error('Note not found');
        const company = await db.companies.get(note.company_id);
        return exportDocumentExcel(note, company, `${note.note_type.toUpperCase()} NOTE`);
      },
      exportWord: async (id) => api.creditDebitNotes.exportPdf(id)
    },

    // ─── Follow-ups ──────────────────────────────────────────────────────────

    followUps: {
      create: async (payload) => {
        const id = await db.follow_ups.add({
          quotation_id: payload.quotation_id, due_date: payload.due_date,
          reason: payload.reason || null, completed: 0
        });
        await logActivity(payload.quotation_id, 'note', `Follow-up scheduled for ${payload.due_date}`);
        return { id };
      },
      complete: async (id) => {
        const followUp = await db.follow_ups.get(id);
        await db.follow_ups.update(id, { completed: 1 });
        if (followUp) await logActivity(followUp.quotation_id, 'note', 'Follow-up marked complete');
        return { success: true };
      }
    },

    // ─── Dashboard ───────────────────────────────────────────────────────────

    dashboard: {
      summary: async () => {
        const companyId = await getActiveCompanyId();
        const allQuotes = await db.quotations.where('company_id').equals(companyId).toArray();
        const now = new Date();
        const todayStr = now.toISOString().slice(0, 10);
        const thisMonthStr = now.toISOString().slice(0, 7);
        const sevenDaysAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

        const pendingCount = allQuotes.filter(q => ['Draft','Ready','Sent','Negotiation'].includes(q.status)).length;
        const todayCount = allQuotes.filter(q => (q.created_at || '').slice(0, 10) === todayStr).length;
        const revenueThisMonth = allQuotes
          .filter(q => q.status === 'Approved' && (q.issue_date || '').slice(0, 7) === thisMonthStr)
          .reduce((s, q) => s + Number(q.total), 0);

        const statusMap = {};
        allQuotes.forEach(q => { statusMap[q.status] = (statusMap[q.status] || 0) + 1; });
        const statusCounts = Object.entries(statusMap).map(([status, n]) => ({ status, n }));

        // Top customers
        const custMap = {};
        allQuotes.forEach(q => {
          if (!custMap[q.customer_id]) custMap[q.customer_id] = { value: 0, count: 0 };
          custMap[q.customer_id].value += Number(q.total);
          custMap[q.customer_id].count++;
        });
        const customers = await db.customers.toArray();
        const topCustomers = customers
          .filter(c => custMap[c.id])
          .map(c => ({ id: c.id, contact_name: c.contact_name, company_name: c.company_name, value: custMap[c.id].value, quote_count: custMap[c.id].count }))
          .sort((a, b) => b.value - a.value).slice(0, 5);

        // Top products
        const allItems = await db.quotation_items.toArray();
        const quoteIdSet = new Set(allQuotes.map(q => q.id));
        const prodMap = {};
        allItems.filter(it => quoteIdSet.has(it.quotation_id)).forEach(it => {
          if (!prodMap[it.product_id]) prodMap[it.product_id] = { value: 0, qty: 0 };
          prodMap[it.product_id].value += Number(it.line_total);
          prodMap[it.product_id].qty += Number(it.qty);
        });
        const products = await db.products.toArray();
        const topProducts = products
          .filter(p => prodMap[p.id])
          .map(p => ({ id: p.id, name: p.name, value: prodMap[p.id].value, qty: prodMap[p.id].qty }))
          .sort((a, b) => b.value - a.value).slice(0, 5);

        // Follow-ups due within 7 days
        const followUps = await db.follow_ups.toArray();
        const quoteById = {};
        allQuotes.forEach(q => { quoteById[q.id] = q; });
        const custById = {};
        customers.forEach(c => { custById[c.id] = c; });

        const followUpsDue = followUps
          .filter(f => !f.completed && (f.due_date || '') <= sevenDaysAhead)
          .map(f => {
            const q = quoteById[f.quotation_id] || {};
            const c = custById[q.customer_id] || {};
            return { ...f, quotation_id: f.quotation_id, quote_number: q.quote_number, quote_status: q.status, contact_name: c.contact_name, company_name: c.company_name };
          })
          .sort((a, b) => (a.due_date || '') < (b.due_date || '') ? -1 : 1).slice(0, 10);

        // Recent activity
        const activities = await db.activities.orderBy('created_at').reverse().limit(8).toArray();
        const recentActivity = activities.map(a => {
          const q = quoteById[a.quotation_id] || {};
          return { ...a, quote_number: q.quote_number };
        });

        return { pendingCount, todayCount, revenueThisMonth, statusCounts, topCustomers, topProducts, followUpsDue, recentActivity };
      }
    },

    // ─── Reports ─────────────────────────────────────────────────────────────

    reports: {
      summary: async (range) => {
        const companyId = await getActiveCompanyId();
        const from = range?.from || '0000-01-01';
        const to = range?.to || '9999-12-31';
        const allQuotes = await db.quotations.where('company_id').equals(companyId).toArray();
        const filtered = allQuotes.filter(q => {
          const d = (q.issue_date || '').slice(0, 10);
          return d >= from && d <= to;
        });
        const created = filtered.length;
        const pending = filtered.filter(q => ['Draft','Ready','Sent','Negotiation'].includes(q.status)).length;
        const approved = filtered.filter(q => q.status === 'Approved').length;
        const rejected = filtered.filter(q => q.status === 'Rejected').length;
        const revenue = filtered.filter(q => q.status === 'Approved').reduce((s, q) => s + Number(q.total), 0);

        const customers = await db.customers.toArray();
        const products = await db.products.toArray();
        const custById = {}, prodById = {};
        customers.forEach(c => { custById[c.id] = c; });
        products.forEach(p => { prodById[p.id] = p; });

        const custMap = {}, prodMap = {};
        filtered.forEach(q => {
          if (!custMap[q.customer_id]) custMap[q.customer_id] = { value: 0, count: 0 };
          custMap[q.customer_id].value += Number(q.total);
          custMap[q.customer_id].count++;
        });

        const quoteIds = new Set(filtered.map(q => q.id));
        const items = await db.quotation_items.toArray();
        items.filter(it => quoteIds.has(it.quotation_id)).forEach(it => {
          if (!prodMap[it.product_id]) prodMap[it.product_id] = { value: 0, qty: 0 };
          prodMap[it.product_id].value += Number(it.line_total);
          prodMap[it.product_id].qty += Number(it.qty);
        });

        const topCustomers = customers
          .filter(c => custMap[c.id])
          .map(c => ({ contact_name: c.contact_name, company_name: c.company_name, value: custMap[c.id].value, quote_count: custMap[c.id].count }))
          .sort((a, b) => b.value - a.value).slice(0, 5);

        const topProducts = products
          .filter(p => prodMap[p.id])
          .map(p => ({ name: p.name, value: prodMap[p.id].value, qty: prodMap[p.id].qty }))
          .sort((a, b) => b.value - a.value).slice(0, 5);

        return { created, pending, approved, rejected, revenue, topCustomers, topProducts };
      },
      exportSalesRegister: async (range) => {
        const companyId = await getActiveCompanyId();
        const company = await getActiveCompany();
        const from = range?.from || '0000-01-01';
        const to = range?.to || '9999-12-31';
        const invoices = await db.invoices.where('company_id').equals(companyId).toArray();
        const customers = await db.customers.toArray();
        const custMap = {};
        customers.forEach(c => { custMap[c.id] = c; });
        const filtered = invoices
          .filter(inv => { const d = (inv.issue_date || '').slice(0, 10); return d >= from && d <= to; })
          .map(inv => {
            const c = custMap[inv.customer_id] || {};
            return { ...inv, contact_name: c.contact_name, company_name: c.company_name, customer_gst: c.gst_number };
          })
          .sort((a, b) => (a.issue_date || '') < (b.issue_date || '') ? -1 : 1);
        return exportSalesRegister(filtered, company, range?.label || 'All Time');
      },
      monthlyLedger: async (year) => {
        const companyId = await getActiveCompanyId();
        const company = await getActiveCompany();
        const selectedYear = Number(year) || new Date().getFullYear();
        
        const allInvoices = await db.invoices.where('company_id').equals(companyId).toArray();
        const customers = await db.customers.toArray();
        const custMap = {};
        customers.forEach(c => { custMap[c.id] = c; });

        const yearInvoices = allInvoices.filter(inv => {
          if (!inv.issue_date) return false;
          const y = new Date(inv.issue_date).getFullYear();
          return y === selectedYear;
        });

        const monthNames = [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'
        ];

        const monthsData = monthNames.map((name, idx) => {
          const monthNum = String(idx + 1).padStart(2, '0');
          const monthKey = `${selectedYear}-${monthNum}`;
          
          const monthInvoices = yearInvoices.filter(inv => (inv.issue_date || '').slice(0, 7) === monthKey).map(inv => {
            const c = custMap[inv.customer_id] || {};
            return {
              ...inv,
              contact_name: c.contact_name,
              company_name: c.company_name,
              customer_gst: c.gst_number
            };
          });

          const totalInvoiced = round2(monthInvoices.reduce((s, inv) => s + Number(inv.total || 0), 0));
          const totalReceived = round2(monthInvoices.reduce((s, inv) => s + Number(inv.amount_paid || 0), 0));
          const balanceDue = round2(totalInvoiced - totalReceived);

          return {
            month: idx + 1,
            month_key: monthKey,
            month_name: `${name} ${selectedYear}`,
            month_short: name,
            invoice_count: monthInvoices.length,
            total_invoiced: totalInvoiced,
            total_received: totalReceived,
            payments_received: totalReceived,
            balance_due: balanceDue,
            outstanding_balance: balanceDue,
            invoices: monthInvoices
          };
        });

        const grand_invoice_count = monthsData.reduce((s, m) => s + m.invoice_count, 0);
        const grand_total_invoiced = round2(monthsData.reduce((s, m) => s + m.total_invoiced, 0));
        const grand_total_received = round2(monthsData.reduce((s, m) => s + m.total_received, 0));
        const grand_balance_due = round2(grand_total_invoiced - grand_total_received);

        return {
          year: selectedYear,
          months: monthsData,
          grand_invoice_count,
          grand_total_invoiced,
          grand_total_received,
          grand_balance_due,
          company
        };
      },
      exportMonthlyLedgerExcel: async (year) => {
        const companyId = await getActiveCompanyId();
        const company = await getActiveCompany();
        const data = await api.reports.monthlyLedger(year);
        return exportMonthlyLedgerExcel(data, company, year);
      },
      printMonthlyLedgerPdf: async (year) => {
        const data = await api.reports.monthlyLedger(year);
        const company = data.company || {};
        const html = `
          <!DOCTYPE html><html><head><meta charset="UTF-8">
          <title>Monthly Ledger Summary — ${data.year}</title>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; padding: 24px; color: #191c1d; }
            h1 { font-size: 20px; color: #004ac6; margin-bottom: 4px; }
            .subtitle { font-size: 13px; color: #666; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 12px; }
            th { background: #f1f5f9; padding: 8px 10px; text-align: left; border-bottom: 2px solid #cbd5e1; text-transform: uppercase; font-size: 10px; color: #475569; }
            td { padding: 9px 10px; border-bottom: 1px solid #e2e8f0; }
            td.r, th.r { text-align: right; }
            .grand-row td { font-weight: 700; background: #f8fafc; border-top: 2px solid #191c1d; font-size: 13px; }
            .due { color: #ba1a1a; font-weight: 600; }
            .paid { color: #146c3a; font-weight: 600; }
          </style>
          </head><body>
            <h1>${company.name || 'QuoteFlow'} — Monthly Sales &amp; Collections Ledger</h1>
            <div class="subtitle">Financial Year / Period: <strong>${data.year}</strong> &middot; Generated on ${new Date().toLocaleDateString('en-IN')}</div>
            <table>
              <thead>
                <tr>
                  <th>Month</th>
                  <th class="r">Invoices Issued</th>
                  <th class="r">Total Invoiced (₹)</th>
                  <th class="r">Payments Received (₹)</th>
                  <th class="r">Outstanding Balance (₹)</th>
                </tr>
              </thead>
              <tbody>
                ${data.months.map(m => `
                  <tr>
                    <td><strong>${m.month_name}</strong></td>
                    <td class="r">${m.invoice_count}</td>
                    <td class="r">₹${m.total_invoiced.toFixed(2)}</td>
                    <td class="r paid">₹${m.total_received.toFixed(2)}</td>
                    <td class="r ${m.balance_due > 0 ? 'due' : ''}">₹${m.balance_due.toFixed(2)}</td>
                  </tr>
                `).join('')}
                <tr class="grand-row">
                  <td>TOTAL (${data.year})</td>
                  <td class="r">${data.grand_invoice_count}</td>
                  <td class="r">₹${data.grand_total_invoiced.toFixed(2)}</td>
                  <td class="r paid">₹${data.grand_total_received.toFixed(2)}</td>
                  <td class="r ${data.grand_balance_due > 0 ? 'due' : ''}">₹${data.grand_balance_due.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </body></html>
        `;
        printHtmlAsPdf(html, `Monthly Ledger — ${year}`);
        return { success: true };
      }
    },

    // ─── Audit Log ───────────────────────────────────────────────────────────

    auditLog: {
      list: async (filters) => {
        const companyId = await getActiveCompanyId();
        let records = await db.document_audit_log.where('company_id').equals(companyId).reverse().sortBy('created_at');
        if (filters?.documentType) records = records.filter(r => r.document_type === filters.documentType);
        return records.slice(0, 200);
      }
    },

    // ─── Global Search ────────────────────────────────────────────────────────

    search: {
      global: async (query) => {
        if (!query || query.trim().length < 2) return { customers: [], products: [], quotations: [] };
        const q = query.trim().toLowerCase();
        const companyId = await getActiveCompanyId();

        const allCustomers = await db.customers.where('company_id').equals(companyId).toArray();
        const customers = allCustomers.filter(c =>
          (c.contact_name || '').toLowerCase().includes(q) ||
          (c.company_name || '').toLowerCase().includes(q) ||
          (c.phone || '').toLowerCase().includes(q) ||
          (c.email || '').toLowerCase().includes(q) ||
          (c.gst_number || '').toLowerCase().includes(q)
        ).slice(0, 5);

        const allProducts = await db.products.where('company_id').equals(companyId).toArray();
        const products = allProducts.filter(p =>
          (p.name || '').toLowerCase().includes(q) ||
          (p.sku || '').toLowerCase().includes(q) ||
          (p.hsn_code || '').toLowerCase().includes(q)
        ).slice(0, 5);

        const custMap = {};
        allCustomers.forEach(c => { custMap[c.id] = c; });

        const allQuotes = await db.quotations.where('company_id').equals(companyId).toArray();
        const quotations = allQuotes.filter(qr => {
          const c = custMap[qr.customer_id] || {};
          return (qr.quote_number || '').toLowerCase().includes(q) ||
            (qr.notes || '').toLowerCase().includes(q) ||
            (c.contact_name || '').toLowerCase().includes(q) ||
            (c.company_name || '').toLowerCase().includes(q);
        }).slice(0, 5).map(qr => {
          const c = custMap[qr.customer_id] || {};
          return { ...qr, contact_name: c.contact_name, company_name: c.company_name };
        });

        const allInvoices = await db.invoices.where('company_id').equals(companyId).toArray();
        const invoices = allInvoices.filter(inv => {
          const c = custMap[inv.customer_id] || {};
          return (inv.invoice_number || '').toLowerCase().includes(q) ||
            (inv.bilty_number || '').toLowerCase().includes(q) ||
            (inv.eway_bill_number || '').toLowerCase().includes(q) ||
            (c.contact_name || '').toLowerCase().includes(q) ||
            (c.company_name || '').toLowerCase().includes(q);
        }).slice(0, 5).map(inv => {
          const c = custMap[inv.customer_id] || {};
          return { ...inv, contact_name: c.contact_name, company_name: c.company_name };
        });

        const allChallans = await db.delivery_challans.where('company_id').equals(companyId).toArray();
        const challans = allChallans.filter(ch => {
          const c = custMap[ch.customer_id] || {};
          return (ch.challan_number || '').toLowerCase().includes(q) ||
            (ch.bilty_number || '').toLowerCase().includes(q) ||
            (ch.eway_bill_number || '').toLowerCase().includes(q) ||
            (c.contact_name || '').toLowerCase().includes(q) ||
            (c.company_name || '').toLowerCase().includes(q);
        }).slice(0, 5).map(ch => {
          const c = custMap[ch.customer_id] || {};
          return { ...ch, contact_name: c.contact_name, company_name: c.company_name };
        });

        return { customers, products, quotations, invoices, challans };
      }
    },

    // ─── Backup & Restore ────────────────────────────────────────────────────

    backup: {
      create: async () => {
        const tables = [
          'companies','users','customer_categories','price_lists','price_list_items',
          'customers','product_categories','products','templates','letterheads',
          'quotations','quotation_items','invoices','invoice_items','invoice_payments',
          'delivery_challans','delivery_challan_items','credit_debit_notes',
          'credit_debit_note_items','activities','follow_ups','document_audit_log','settings'
        ];
        const backup = { version: 1, created_at: new Date().toISOString(), tables: {} };
        for (const table of tables) {
          backup.tables[table] = await db[table].toArray();
        }
        const json = JSON.stringify(backup, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `quoteflow-backup-${timestamp}.qfbackup`;
        a.click();
        URL.revokeObjectURL(a.href);
        return { success: true };
      },
      restore: async () => {
        return new Promise((resolve) => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = '.qfbackup';
          input.onchange = async () => {
            const file = input.files[0];
            if (!file) return resolve({ success: false, canceled: true });
            try {
              const text = await file.text();
              const backup = JSON.parse(text);
              if (!backup.tables) throw new Error('Invalid backup file');

              // Clear and restore each table
              const tables = Object.keys(backup.tables);
              for (const table of tables) {
                if (db[table]) {
                  await db[table].clear();
                  const rows = backup.tables[table];
                  if (rows && rows.length > 0) {
                    await db[table].bulkAdd(rows);
                  }
                }
              }
              resolve({ success: true });
              setTimeout(() => window.location.reload(), 500);
            } catch (e) {
              resolve({ success: false, reason: e.message });
            }
          };
          input.click();
        });
      }
    },

    // ─── App ────────────────────────────────────────────────────────────────

    app: {
      factoryReset: async () => {
        const tables = [
          'companies','users','customer_categories','price_lists','price_list_items',
          'customers','product_categories','products','templates','letterheads',
          'quotations','quotation_items','invoices','invoice_items','invoice_payments',
          'delivery_challans','delivery_challan_items','credit_debit_notes',
          'credit_debit_note_items','activities','follow_ups','document_audit_log','settings'
        ];
        for (const table of tables) {
          if (db[table]) await db[table].clear();
        }
        window.location.reload();
        return { success: true };
      }
    }
  };

  return api;
}

// Auto-initialize window.api as soon as this module is loaded
if (typeof window !== 'undefined') {
  window.api = buildWindowApi();
}

