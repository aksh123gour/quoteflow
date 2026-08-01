const viewRoot = document.getElementById('view-root');
const viewTitle = document.getElementById('view-title');
const navItems = document.querySelectorAll('.nav-item');
const modalOverlay = document.getElementById('modal-overlay');
const modal = document.getElementById('modal');

const VIEW_LABELS = {
  dashboard: 'Dashboard',
  quotes: 'Quotes',
  invoices: 'Invoices',
  customers: 'Customers',
  products: 'Products',
  reports: 'Reports',
  settings: 'Settings'
};

// Nav order for keyboard navigation (W/S/Up/Down cycles through these)
const NAV_ORDER = ['dashboard', 'quotes', 'invoices', 'challans', 'notes', 'customers', 'products', 'reports', 'settings'];
let currentNavIndex = 0;

navItems.forEach((btn) => {
  btn.onclick = () => switchView(btn.dataset.view);
});

// ─── Sidebar toggle ────────────────────────────────────────────────────────

const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebar-overlay');
const sidebarToggleBtn = document.getElementById('sidebar-toggle-btn');
const sidebarCloseBtn = document.getElementById('sidebar-close-btn');

function isMobile() { return window.innerWidth <= 768; }

function openMobileSidebar() {
  sidebar.classList.add('sidebar-open');
  sidebarOverlay.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeMobileSidebar() {
  if (isMobile()) {
    sidebar.classList.remove('sidebar-open');
    sidebarOverlay.classList.add('hidden');
    document.body.style.overflow = '';
  }
}

function toggleDesktopSidebar() {
  const app = document.querySelector('.app');
  app.classList.toggle('sidebar-hidden');
  const isHidden = app.classList.contains('sidebar-hidden');
  sidebarToggleBtn.setAttribute('aria-expanded', String(!isHidden));
  try { localStorage.setItem('qf_sidebar_hidden', isHidden ? '1' : '0'); } catch (e) {}
}

function toggleSidebar() {
  if (isMobile()) {
    if (sidebar.classList.contains('sidebar-open')) {
      closeMobileSidebar();
    } else {
      openMobileSidebar();
    }
  } else {
    toggleDesktopSidebar();
  }
}

// Restore desktop sidebar state from storage
try {
  if (!isMobile() && localStorage.getItem('qf_sidebar_hidden') === '1') {
    document.querySelector('.app').classList.add('sidebar-hidden');
  }
} catch (e) {}

sidebarToggleBtn.addEventListener('click', toggleSidebar);
if (sidebarCloseBtn) sidebarCloseBtn.addEventListener('click', closeMobileSidebar);
sidebarOverlay.addEventListener('click', closeMobileSidebar);

// Close mobile sidebar on viewport resize (if user rotates device)
window.addEventListener('resize', () => {
  if (!isMobile()) {
    sidebar.classList.remove('sidebar-open');
    sidebarOverlay.classList.add('hidden');
    document.body.style.overflow = '';
  }
});

// ─── Keyboard Navigation ─────────────────────────────────────────────────────
// Enable keyboard-nav class on first keydown (disable on mouse)
document.addEventListener('keydown', () => document.body.classList.add('keyboard-nav'), { capture: true });
document.addEventListener('mousedown', () => document.body.classList.remove('keyboard-nav'), { capture: true });

document.addEventListener('keydown', (e) => {
  // Don't intercept when focus is inside input/textarea/select or a modal is open
  const tag = document.activeElement?.tagName;
  const inInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || document.activeElement?.isContentEditable;
  const modalOpen = !modalOverlay.classList.contains('hidden') ||
                    !document.getElementById('pdf-preview-overlay').classList.contains('hidden') ||
                    !document.getElementById('sync-panel-overlay').classList.contains('hidden');

  // Escape: close any open modal / sidebar
  if (e.key === 'Escape') {
    if (modalOpen) {
      closeModal();
      document.getElementById('pdf-preview-overlay').classList.add('hidden');
      document.getElementById('sync-panel-overlay').classList.add('hidden');
      return;
    }
    if (isMobile() && sidebar.classList.contains('sidebar-open')) {
      closeMobileSidebar();
      return;
    }
  }

  // Ctrl+K: focus global search
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    document.getElementById('global-search-input')?.focus();
    return;
  }

  // M: toggle sidebar
  if (!inInput && !modalOpen && (e.key === 'm' || e.key === 'M')) {
    e.preventDefault();
    toggleSidebar();
    return;
  }

  // Skip all other navigation shortcuts if in input or modal
  if (inInput || modalOpen) return;

  // W / ArrowUp: previous nav item
  if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') {
    e.preventDefault();
    currentNavIndex = (currentNavIndex - 1 + NAV_ORDER.length) % NAV_ORDER.length;
    switchView(NAV_ORDER[currentNavIndex]);
    return;
  }

  // S / ArrowDown: next nav item
  if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') {
    e.preventDefault();
    currentNavIndex = (currentNavIndex + 1) % NAV_ORDER.length;
    switchView(NAV_ORDER[currentNavIndex]);
    return;
  }

  // Number shortcuts: 1–9 jump to specific section
  const numMap = { '1':'dashboard','2':'quotes','3':'invoices','4':'challans','5':'notes','6':'customers','7':'products','8':'reports','9':'settings' };
  if (!e.ctrlKey && !e.altKey && !e.metaKey && numMap[e.key]) {
    e.preventDefault();
    switchView(numMap[e.key]);
    return;
  }

  // Tab within sidebar nav (handled natively), but also support Enter on focused nav item
  if (e.key === 'Enter' && document.activeElement?.classList.contains('nav-item')) {
    document.activeElement.click();
  }
});


function switchView(view) {
  // Update nav─index tracker
  const idx = NAV_ORDER.indexOf(view);
  if (idx !== -1) currentNavIndex = idx;

  navItems.forEach((b) => b.classList.toggle('active', b.dataset.view === view));
  viewTitle.textContent = VIEW_LABELS[view] || view;

  // Auto-close mobile sidebar when a view is selected
  closeMobileSidebar();

  if (view === 'customers') renderCustomers();
  else if (view === 'products') renderProducts();
  else if (view === 'quotes') renderQuotesList();
  else if (view === 'invoices') renderInvoicesList();
  else if (view === 'challans') renderChallansList();
  else if (view === 'notes') renderNotesList();
  else if (view === 'dashboard') renderDashboard();
  else if (view === 'reports') renderReports();
  else if (view === 'settings') renderSettings();
  else renderPlaceholder(VIEW_LABELS[view]);
}

function renderPlaceholder(label) {
  viewRoot.innerHTML = `<div class="placeholder">${label} — coming in a later step.</div>`;
}

// ─── Modal helpers ───────────────────────────────────────────────────────────

function openModal(html) {
  modal.className = 'modal';
  modal.innerHTML = html;
  modalOverlay.classList.remove('hidden');

  // Fresh binding every open — no stacked listeners, no stale references.
  const closeBtn = modal.querySelector('.modal-close');
  const cancelBtn = modal.querySelector('.modal-cancel');
  if (closeBtn) closeBtn.onclick = closeModal;
  if (cancelBtn) cancelBtn.onclick = closeModal;

  modalOverlay.onclick = (e) => {
    if (e.target === modalOverlay) closeModal();
  };
}

function closeModal() {
  modalOverlay.classList.add('hidden');
  modal.innerHTML = '';
  modalOverlay.onclick = null;
}

function openConfirm(message, onConfirm, confirmLabel = 'Delete') {
  openModal(`
    <div class="modal-header">
      <h2>Please confirm</h2>
      <button class="modal-close">&times;</button>
    </div>
    <div class="confirm-body">${escapeHtml(message)}</div>
    <div class="modal-footer">
      <button class="btn modal-cancel">Cancel</button>
      <button class="btn btn-primary" id="confirm-yes-btn" style="background:var(--danger)">${escapeHtml(confirmLabel)}</button>
    </div>
  `);
  modal.classList.add('confirm-modal');
  document.getElementById('confirm-yes-btn').onclick = async () => {
    closeModal();
    await onConfirm();
  };
}

function showFormError(message) {
  const body = modal.querySelector('.modal-body');
  let banner = body.querySelector('.form-error');
  if (!banner) {
    banner = document.createElement('div');
    banner.className = 'form-error';
    body.prepend(banner);
  }
  banner.textContent = message;
}

function openInfo(message, title = "Can't Delete") {
  openModal(`
    <div class="modal-header">
      <h2>${escapeHtml(title)}</h2>
      <button class="modal-close">&times;</button>
    </div>
    <div class="confirm-body">${escapeHtml(message)}</div>
    <div class="modal-footer">
      <button class="btn btn-primary modal-cancel">OK</button>
    </div>
  `);
  modal.classList.add('confirm-modal');
}

// ─── Customers ───────────────────────────────────────────────────────────────

async function renderCustomers() {
  const customers = await window.api.customers.list();

  viewRoot.innerHTML = `
    <div class="view-toolbar">
      <button class="btn btn-primary" id="add-customer-btn">+ Add Customer</button>
    </div>
    ${customers.length === 0
      ? `<div class="empty-state">No customers yet. Add your first one to get started.</div>`
      : `<table class="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Company</th>
              <th>Category</th>
              <th>Phone</th>
              <th>GST Number</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${customers.map((c) => `
              <tr>
                <td>${escapeHtml(c.contact_name)}</td>
                <td>${escapeHtml(c.company_name || '—')}</td>
                <td>${escapeHtml(c.category_name || '—')}</td>
                <td>${escapeHtml(c.phone || '—')}</td>
                <td>${escapeHtml(c.gst_number || '—')}</td>
                <td class="row-actions">
                  <button class="edit-customer" data-id="${c.id}">Edit</button>
                  <button class="danger delete-customer" data-id="${c.id}">Delete</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>`
    }
  `;

  document.getElementById('add-customer-btn').onclick = () => openCustomerForm();

  document.querySelectorAll('.edit-customer').forEach((btn) => {
    btn.onclick = () => {
      const customer = customers.find((c) => c.id === Number(btn.dataset.id));
      openCustomerForm(customer);
    };
  });

  document.querySelectorAll('.delete-customer').forEach((btn) => {
    btn.onclick = () => {
      openConfirm('Delete this customer? This cannot be undone.', async () => {
        const result = await window.api.customers.delete(Number(btn.dataset.id));
        if (result.success) {
          renderCustomers();
        } else {
          openInfo(result.reason);
        }
      });
    };
  });
}

async function openCustomerForm(customer) {
  const [categories, priceLists] = await Promise.all([
    window.api.customerCategories.list(),
    window.api.priceLists.list()
  ]);

  const isEdit = !!customer;

  openModal(`
    <div class="modal-header">
      <h2>${isEdit ? 'Edit Customer' : 'Add Customer'}</h2>
      <button class="modal-close">&times;</button>
    </div>
    <div class="modal-body">
      <div class="form-row">
        <div class="form-group">
          <label>Contact Name *</label>
          <input id="f-contact-name" value="${escapeAttr(customer?.contact_name || '')}">
        </div>
        <div class="form-group">
          <label>Company Name</label>
          <input id="f-company-name" value="${escapeAttr(customer?.company_name || '')}">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Category</label>
          <select id="f-category">
            <option value="">—</option>
            ${categories.map((c) => `<option value="${c.id}" ${customer?.category_id === c.id ? 'selected' : ''}>${escapeHtml(c.name)}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Price List</label>
          <select id="f-price-list">
            <option value="">—</option>
            ${priceLists.map((p) => `<option value="${p.id}" ${customer?.price_list_id === p.id ? 'selected' : ''}>${escapeHtml(p.name)}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>State *</label>
          <input id="f-state" value="${escapeAttr(customer?.state || '')}" placeholder="e.g. Madhya Pradesh">
        </div>
        <div class="form-group">
          <label>GST Number</label>
          <input id="f-gst" value="${escapeAttr(customer?.gst_number || '')}">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Phone</label>
          <input id="f-phone" value="${escapeAttr(customer?.phone || '')}">
        </div>
        <div class="form-group">
          <label>Email</label>
          <input id="f-email" value="${escapeAttr(customer?.email || '')}">
        </div>
      </div>
      <div class="form-group">
        <label>Address</label>
        <textarea id="f-address" rows="2">${escapeHtml(customer?.address || '')}</textarea>
      </div>
      <div class="form-group">
        <label>Payment Terms</label>
        <input id="f-payment-terms" value="${escapeAttr(customer?.payment_terms || '')}" placeholder="e.g. Net 30">
      </div>
      <div class="form-group">
        <label>Notes</label>
        <textarea id="f-notes" rows="2">${escapeHtml(customer?.notes || '')}</textarea>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn modal-cancel">Cancel</button>
      <button class="btn btn-primary" id="save-customer-btn">${isEdit ? 'Save Changes' : 'Add Customer'}</button>
    </div>
  `);

  document.getElementById('save-customer-btn').onclick = async () => {
    const data = {
      contact_name: document.getElementById('f-contact-name').value.trim(),
      company_name: document.getElementById('f-company-name').value.trim(),
      category_id: document.getElementById('f-category').value || null,
      price_list_id: document.getElementById('f-price-list').value || null,
      state: document.getElementById('f-state').value.trim(),
      gst_number: document.getElementById('f-gst').value.trim(),
      phone: document.getElementById('f-phone').value.trim(),
      email: document.getElementById('f-email').value.trim(),
      address: document.getElementById('f-address').value.trim(),
      payment_terms: document.getElementById('f-payment-terms').value.trim(),
      notes: document.getElementById('f-notes').value.trim()
    };

    if (!data.contact_name || !data.state) {
      showFormError('Contact Name and State are required.');
      return;
    }

    if (isEdit) {
      await window.api.customers.update(customer.id, data);
    } else {
      await window.api.customers.create(data);
    }

    closeModal();
    renderCustomers();
  };
}

// ─── Products ────────────────────────────────────────────────────────────────

async function renderProducts() {
  const products = await window.api.products.list();

  viewRoot.innerHTML = `
    <div class="view-toolbar">
      <button class="btn btn-primary" id="add-product-btn">+ Add Product</button>
    </div>
    ${products.length === 0
      ? `<div class="empty-state">No products yet. Add your first one to get started.</div>`
      : `<table class="data-table">
          <thead>
            <tr>
              <th style="width:56px"></th>
              <th>Name</th>
              <th>SKU</th>
              <th>Category</th>
              <th>Unit Price</th>
              <th>GST %</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${products.map((p) => `
              <tr>
                <td style="padding:6px;">
                  ${p.image
                    ? `<img src="${p.image}" alt="" style="width:44px;height:44px;object-fit:contain;border-radius:4px;border:1px solid #e5e7eb;background:#f9fafb;display:block;">`
                    : `<div style="width:44px;height:44px;border-radius:4px;border:1px dashed #d1d5db;background:#f9fafb;display:flex;align-items:center;justify-content:center;color:#9ca3af;font-size:18px;">&#128247;</div>`
                  }
                </td>
                <td><strong>${escapeHtml(p.name)}</strong>${p.description ? `<div style="font-size:11px;color:#6b7280;margin-top:2px;">${escapeHtml(p.description.slice(0,60))}${p.description.length>60?'…':''}</div>` : ''}</td>
                <td>${escapeHtml(p.sku || '—')}</td>
                <td>${escapeHtml(p.category_name || '—')}</td>
                <td>₹${Number(p.base_price).toFixed(2)}</td>
                <td>${p.gst_rate}%</td>
                <td class="row-actions">
                  <button class="edit-product" data-id="${p.id}">Edit</button>
                  <button class="danger delete-product" data-id="${p.id}">Delete</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>`
    }
  `;

  document.getElementById('add-product-btn').onclick = () => openProductForm();

  document.querySelectorAll('.edit-product').forEach((btn) => {
    btn.onclick = () => {
      const product = products.find((p) => p.id === Number(btn.dataset.id));
      openProductForm(product);
    };
  });

  document.querySelectorAll('.delete-product').forEach((btn) => {
    btn.onclick = () => {
      openConfirm('Delete this product? This cannot be undone.', async () => {
        const result = await window.api.products.delete(Number(btn.dataset.id));
        if (result.success) {
          renderProducts();
        } else {
          openInfo(result.reason);
        }
      });
    };
  });
}

async function openProductForm(product) {
  const [categories, settings] = await Promise.all([
    window.api.productCategories.list(),
    window.api.settings.get()
  ]);
  const defaultGstRate = settings.default_gst_rate || 18;
  const isEdit = !!product;

  openModal(`
    <div class="modal-header">
      <h2>${isEdit ? 'Edit Product' : 'Add Product'}</h2>
      <button class="modal-close">&times;</button>
    </div>
    <div class="modal-body">
      <div class="form-row">
        <div class="form-group">
          <label>Product Name *</label>
          <input id="f-name" value="${escapeAttr(product?.name || '')}">
        </div>
        <div class="form-group">
          <label>SKU</label>
          <input id="f-sku" value="${escapeAttr(product?.sku || '')}">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Category</label>
          <select id="f-category">
            <option value="">—</option>
            ${categories.map((c) => `<option value="${c.id}" ${product?.category_id === c.id ? 'selected' : ''}>${escapeHtml(c.name)}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Unit</label>
          <input id="f-unit" value="${escapeAttr(product?.unit || 'unit')}">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Base Price (₹) *</label>
          <input id="f-price" type="number" step="0.01" value="${product?.base_price ?? 0}">
        </div>
        <div class="form-group">
          <label>GST Rate (%)</label>
          <input id="f-gst-rate" type="number" step="0.01" value="${product?.gst_rate ?? defaultGstRate}">
        </div>
      </div>
      <div class="form-group">
        <label>HSN Code</label>
        <input id="f-hsn" value="${escapeAttr(product?.hsn_code || '')}">
      </div>
      <div class="form-group">
        <label>Description</label>
        <textarea id="f-description" rows="2">${escapeHtml(product?.description || '')}</textarea>
      </div>
      <div class="form-group">
        <label>Product Image <span style="font-weight:400;color:#6b7280;">(optional – shown in product list &amp; quotations)</span></label>
        <div style="display:flex;align-items:flex-start;gap:14px;margin-top:4px;">
          <div id="prod-img-preview" style="width:80px;height:80px;border-radius:8px;border:1px solid #e5e7eb;background:#f9fafb;display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0;">
            ${product?.image
              ? `<img src="${product.image}" style="width:100%;height:100%;object-fit:contain;"/>`
              : `<span style="font-size:28px;color:#d1d5db;">&#128247;</span>`
            }
          </div>
          <div style="display:flex;flex-direction:column;gap:8px;">
            <label class="btn" style="cursor:pointer;margin:0;" for="prod-img-input">Upload Image</label>
            <input id="prod-img-input" type="file" accept="image/*" style="display:none;">
            <button id="prod-img-remove" class="btn" style="color:#ba1a1a;border-color:#ba1a1a;background:transparent;${product?.image ? '' : 'display:none;'}">Remove Image</button>
            <span style="font-size:11px;color:#6b7280;">JPG, PNG, WebP. Max 2 MB.</span>
          </div>
        </div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn modal-cancel">Cancel</button>
      <button class="btn btn-primary" id="save-product-btn">${isEdit ? 'Save Changes' : 'Add Product'}</button>
    </div>
  `);

  // ── Image upload ──────────────────────────────────────────────────────────
  let _productImageDataUrl = product?.image || null; // tracks current image state

  document.getElementById('prod-img-input').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      openInfo('Image must be under 2 MB.');
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      _productImageDataUrl = ev.target.result;
      const preview = document.getElementById('prod-img-preview');
      preview.innerHTML = `<img src="${_productImageDataUrl}" style="width:100%;height:100%;object-fit:contain;">`;
      const removeBtn = document.getElementById('prod-img-remove');
      if (removeBtn) removeBtn.style.display = '';
    };
    reader.readAsDataURL(file);
  });

  const removeBtn = document.getElementById('prod-img-remove');
  if (removeBtn) {
    removeBtn.onclick = () => {
      _productImageDataUrl = null;
      const preview = document.getElementById('prod-img-preview');
      preview.innerHTML = `<span style="font-size:28px;color:#d1d5db;">&#128247;</span>`;
      removeBtn.style.display = 'none';
      document.getElementById('prod-img-input').value = '';
    };
  }

  document.getElementById('save-product-btn').onclick = async () => {
    const data = {
      name: document.getElementById('f-name').value.trim(),
      sku: document.getElementById('f-sku').value.trim(),
      category_id: document.getElementById('f-category').value || null,
      unit: document.getElementById('f-unit').value.trim() || 'unit',
      base_price: document.getElementById('f-price').value,
      gst_rate: document.getElementById('f-gst-rate').value,
      hsn_code: document.getElementById('f-hsn').value.trim(),
      description: document.getElementById('f-description').value.trim(),
      image: _productImageDataUrl  // always pass so API knows the current state
    };

    if (!data.name || data.base_price === '') {
      showFormError('Product Name and Base Price are required.');
      return;
    }

    if (isEdit) {
      await window.api.products.update(product.id, data);
    } else {
      await window.api.products.create(data);
    }

    closeModal();
    renderProducts();
  };
}

// ─── Quotes List ─────────────────────────────────────────────────────────────

const STATUS_CLASSES = {
  Draft: 'badge-gray',
  Ready: 'badge-blue',
  Sent: 'badge-blue',
  Negotiation: 'badge-amber',
  Approved: 'badge-green',
  Rejected: 'badge-red',
  Expired: 'badge-red',
  Archived: 'badge-gray'
};

const ALL_STATUSES = ['Draft', 'Ready', 'Sent', 'Negotiation', 'Approved', 'Rejected', 'Expired', 'Archived'];

let selectedQuoteIds = new Set();

async function renderQuotesList() {
  const quotes = await window.api.quotations.list();
  selectedQuoteIds = new Set();

  viewRoot.innerHTML = `
    <div class="view-toolbar">
      <button class="btn" id="export-selected-btn" disabled>Export Selected (0)</button>
      <button class="btn btn-primary" id="add-quote-btn">+ New Quote</button>
    </div>
    ${quotes.length === 0
      ? `<div class="empty-state">No quotations yet. Create your first one to get started.</div>`
      : `<table class="data-table">
          <thead>
            <tr>
              <th class="checkbox-col"><input type="checkbox" id="select-all-quotes"></th>
              <th>Quote #</th>
              <th>Customer</th>
              <th>Status</th>
              <th>Valid Until</th>
              <th>Total</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${quotes.map((q) => `
              <tr>
                <td class="checkbox-col"><input type="checkbox" class="select-quote" data-id="${q.id}"></td>
                <td class="mono">${escapeHtml(q.quote_number)}</td>
                <td>${escapeHtml(q.company_name || q.contact_name)}</td>
                <td>
                  <select class="status-select ${STATUS_CLASSES[q.status] || 'badge-gray'}" data-id="${q.id}">
                    ${ALL_STATUSES.map((s) => `<option value="${s}" ${s === q.status ? 'selected' : ''}>${s}</option>`).join('')}
                  </select>
                </td>
                <td>${q.valid_until ? escapeHtml(q.valid_until) : '—'}</td>
                <td class="mono">₹${Number(q.total).toFixed(2)}</td>
                <td class="row-actions">
                  <button class="edit-quote" data-id="${q.id}">Edit</button>
                  <div class="export-wrap"><button class="export-menu-btn" data-doctype="quotation" data-id="${q.id}">Export <span class="chevron">▾</span></button></div>
                  <button class="followup-quote" data-id="${q.id}">+ Follow-up</button>
                  ${q.status === 'Approved' ? `<button class="convert-quote" data-id="${q.id}">Convert to Invoice</button>` : ''}
                  <button class="danger delete-quote" data-id="${q.id}">Delete</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>`
    }
  `;

  document.getElementById('add-quote-btn').onclick = () => renderQuoteBuilder();

  document.querySelectorAll('.status-select').forEach((sel) => {
    sel.onchange = async () => {
      await window.api.quotations.updateStatus(Number(sel.dataset.id), sel.value);
      renderQuotesList();
    };
  });

  const exportSelectedBtn = document.getElementById('export-selected-btn');
  const selectAllBox = document.getElementById('select-all-quotes');
  const rowBoxes = document.querySelectorAll('.select-quote');

  function updateSelectionUI() {
    exportSelectedBtn.textContent = `Export Selected (${selectedQuoteIds.size})`;
    exportSelectedBtn.disabled = selectedQuoteIds.size === 0;
  }

  if (selectAllBox) {
    selectAllBox.onchange = () => {
      rowBoxes.forEach((box) => {
        box.checked = selectAllBox.checked;
        const id = Number(box.dataset.id);
        if (selectAllBox.checked) selectedQuoteIds.add(id);
        else selectedQuoteIds.delete(id);
      });
      updateSelectionUI();
    };
  }

  rowBoxes.forEach((box) => {
    box.onchange = () => {
      const id = Number(box.dataset.id);
      if (box.checked) selectedQuoteIds.add(id);
      else selectedQuoteIds.delete(id);
      if (selectAllBox) selectAllBox.checked = selectedQuoteIds.size === rowBoxes.length;
      updateSelectionUI();
    };
  });

  exportSelectedBtn.onclick = async () => {
    const ids = Array.from(selectedQuoteIds);
    const original = exportSelectedBtn.textContent;
    exportSelectedBtn.textContent = 'Exporting…';
    exportSelectedBtn.disabled = true;
    const result = await window.api.quotations.exportSelectedPdf(ids);
    if (result.success) {
      exportSelectedBtn.textContent = `Exported ${result.count} PDFs`;
      setTimeout(() => renderQuotesList(), 2000);
    } else {
      exportSelectedBtn.textContent = original;
      exportSelectedBtn.disabled = selectedQuoteIds.size === 0;
    }
  };

  document.querySelectorAll('.edit-quote').forEach((btn) => {
    btn.onclick = () => renderQuoteBuilder(Number(btn.dataset.id));
  });

  attachExportMenus();

  document.querySelectorAll('.followup-quote').forEach((btn) => {
    btn.onclick = () => openFollowUpModal(Number(btn.dataset.id));
  });

  document.querySelectorAll('.convert-quote').forEach((btn) => {
    btn.onclick = async () => {
      const original = btn.textContent;
      btn.textContent = 'Converting…';
      btn.disabled = true;
      const result = await window.api.quotations.convertToInvoice(Number(btn.dataset.id));
      if (result.already_existed) {
        openInfo(`This quotation was already converted to invoice ${result.invoice_number}.`, 'Already Converted');
        btn.textContent = original;
        btn.disabled = false;
      } else {
        openInfo(`Invoice ${result.invoice_number} created. You can find it in the Invoices list.`, 'Invoice Created');
      }
    };
  });

  document.querySelectorAll('.delete-quote').forEach((btn) => {
    btn.onclick = () => {
      openConfirm('Delete this quotation? This cannot be undone.', async () => {
        await window.api.quotations.delete(Number(btn.dataset.id));
        renderQuotesList();
      });
    };
  });
}

function openFollowUpModal(quotationId) {
  openModal(`
    <div class="modal-header">
      <h2>Schedule Follow-up</h2>
      <button class="modal-close">&times;</button>
    </div>
    <div class="modal-body">
      <div class="form-group">
        <label>Due Date *</label>
        <input type="date" id="fu-date">
      </div>
      <div class="form-group">
        <label>Reason / Note</label>
        <textarea id="fu-reason" rows="2" placeholder="e.g. Call customer to confirm pricing"></textarea>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn modal-cancel">Cancel</button>
      <button class="btn btn-primary" id="save-followup-btn">Schedule</button>
    </div>
  `);

  document.getElementById('save-followup-btn').onclick = async () => {
    const dueDate = document.getElementById('fu-date').value;
    if (!dueDate) {
      showFormError('Due date is required.');
      return;
    }
    await window.api.followUps.create({
      quotation_id: quotationId,
      due_date: dueDate,
      reason: document.getElementById('fu-reason').value.trim()
    });
    closeModal();
  };
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

async function renderDashboard() {
  const data = await window.api.dashboard.summary();

  const statusOrder = ['Draft', 'Ready', 'Sent', 'Negotiation', 'Approved', 'Rejected', 'Expired', 'Archived'];
  const statusMap = Object.fromEntries(data.statusCounts.map((s) => [s.status, s.n]));
  const totalQuotes = data.statusCounts.reduce((sum, s) => sum + s.n, 0);

  viewRoot.innerHTML = `
    <div class="stat-grid">
      <div class="card stat-card">
        <div class="stat-label">Pending Quotes</div>
        <div class="stat-value">${data.pendingCount}</div>
      </div>
      <div class="card stat-card">
        <div class="stat-label">Today's Quotes</div>
        <div class="stat-value">${data.todayCount}</div>
      </div>
      <div class="card stat-card">
        <div class="stat-label">Revenue (This Month)</div>
        <div class="stat-value">₹${Number(data.revenueThisMonth).toFixed(2)}</div>
        <div class="stat-note">Approved quotes only</div>
      </div>
    </div>

    <div class="card">
      <h3>Pipeline</h3>
      ${totalQuotes === 0
        ? `<div class="inline-note">No quotations yet.</div>`
        : `<div class="pipeline-bar">
            ${statusOrder.filter((s) => statusMap[s]).map((s) => `
              <div class="pipeline-segment ${STATUS_CLASSES[s]}" style="flex:${statusMap[s]}" title="${s}: ${statusMap[s]}"></div>
            `).join('')}
          </div>
          <div class="pipeline-legend">
            ${statusOrder.filter((s) => statusMap[s]).map((s) => `
              <span class="legend-item"><span class="legend-dot ${STATUS_CLASSES[s]}"></span>${s} (${statusMap[s]})</span>
            `).join('')}
          </div>`
      }
    </div>

    <div class="dash-grid">
      <div class="card">
        <h3>Follow-ups Due</h3>
        ${data.followUpsDue.length === 0
          ? `<div class="inline-note">Nothing due in the next 7 days.</div>`
          : data.followUpsDue.map((f) => `
              <div class="list-row">
                <div>
                  <div class="list-row-title">${escapeHtml(f.company_name || f.contact_name)} &middot; <span class="mono">${escapeHtml(f.quote_number)}</span></div>
                  <div class="list-row-sub">${f.reason ? escapeHtml(f.reason) + ' — ' : ''}Due ${escapeHtml(f.due_date)}</div>
                </div>
                <button class="btn complete-followup" data-id="${f.id}">Done</button>
              </div>
            `).join('')
        }
      </div>

      <div class="card">
        <h3>Recent Activity</h3>
        ${data.recentActivity.length === 0
          ? `<div class="inline-note">No activity yet.</div>`
          : data.recentActivity.map((a) => `
              <div class="list-row">
                <div>
                  <div class="list-row-title">${escapeHtml(a.content)}</div>
                  <div class="list-row-sub">${a.quote_number ? escapeHtml(a.quote_number) + ' — ' : ''}${formatRelativeTime(a.created_at)}</div>
                </div>
              </div>
            `).join('')
        }
      </div>

      <div class="card">
        <h3>Top Customers</h3>
        ${data.topCustomers.length === 0
          ? `<div class="inline-note">No quotations yet.</div>`
          : data.topCustomers.map((c) => `
              <div class="list-row">
                <div>
                  <div class="list-row-title">${escapeHtml(c.company_name || c.contact_name)}</div>
                  <div class="list-row-sub">${c.quote_count} quote${c.quote_count === 1 ? '' : 's'}</div>
                </div>
                <div class="mono">₹${Number(c.value).toFixed(2)}</div>
              </div>
            `).join('')
        }
      </div>

      <div class="card">
        <h3>Top Products</h3>
        ${data.topProducts.length === 0
          ? `<div class="inline-note">No quoted products yet.</div>`
          : data.topProducts.map((p) => `
              <div class="list-row">
                <div>
                  <div class="list-row-title">${escapeHtml(p.name)}</div>
                  <div class="list-row-sub">${p.qty} units quoted</div>
                </div>
                <div class="mono">₹${Number(p.value).toFixed(2)}</div>
              </div>
            `).join('')
        }
      </div>
    </div>
  `;

  document.querySelectorAll('.complete-followup').forEach((btn) => {
    btn.onclick = async () => {
      await window.api.followUps.complete(Number(btn.dataset.id));
      renderDashboard();
    };
  });
}

function formatRelativeTime(isoStr) {
  const then = new Date(isoStr.replace(' ', 'T') + 'Z');
  const diffMs = Date.now() - then.getTime();
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.round(diffHr / 24);
  return `${diffDay}d ago`;
}

function formatShortDate(isoStr) {
  if (!isoStr) return '—';
  const d = new Date(isoStr.includes('T') ? isoStr : isoStr.replace(' ', 'T') + 'Z');
  if (isNaN(d)) return isoStr;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ─── Invoices ────────────────────────────────────────────────────────────────

const INVOICE_STATUS_CLASSES = { Issued: 'badge-green', Cancelled: 'badge-red' };
const PAYMENT_STATUS_CLASSES = { Unpaid: 'badge-red', 'Partially Paid': 'badge-amber', Paid: 'badge-green' };
const PAYMENT_MODES = ['Cash', 'Bank Transfer', 'UPI', 'Cheque', 'Card', 'Other'];

async function renderInvoicesList() {
  const invoices = await window.api.invoices.list();

  viewRoot.innerHTML = `
    <div class="view-toolbar">
      <button class="btn btn-primary" id="new-invoice-btn">+ New Direct Invoice</button>
    </div>
    ${invoices.length === 0
      ? `<div class="empty-state">No invoices yet. Approve a quotation and convert it to generate one, or click '+ New Direct Invoice' to create one directly.</div>`
      : `<table class="data-table">
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Customer</th>
              <th>Status</th>
              <th>Payment</th>
              <th>Due Date</th>
              <th>Total</th>
              <th>Paid</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${invoices.map((inv) => {
              const needsEway = inv.status === 'Issued' && Number(inv.total) > 50000 && !inv.eway_bill_number;
              const ewayBadge = needsEway ? ` <span class="badge badge-amber" title="E-Way Bill Required">⚠ E-Way</span>` : '';
              return `
              <tr>
                <td class="mono">${escapeHtml(inv.invoice_number)}</td>
                <td>${escapeHtml(inv.company_name || inv.contact_name)}${ewayBadge}</td>
                <td><span class="badge ${INVOICE_STATUS_CLASSES[inv.status] || 'badge-gray'}">${escapeHtml(inv.status)}</span></td>
                <td><span class="badge ${PAYMENT_STATUS_CLASSES[inv.payment_status] || 'badge-gray'}">${escapeHtml(inv.payment_status)}</span></td>
                <td>${inv.due_date ? escapeHtml(inv.due_date) : '—'}</td>
                <td class="mono">₹${Number(inv.total).toFixed(2)}</td>
                <td class="mono">₹${Number(inv.amount_paid).toFixed(2)}</td>
                <td class="row-actions">
                  ${inv.status === 'Issued' ? `<button class="record-payment" data-id="${inv.id}">Payments</button>` : ''}
                  ${inv.status === 'Issued' ? `<button class="edit-invoice-eway" data-id="${inv.id}">E-Way Bill</button>` : ''}
                  <div class="export-wrap"><button class="export-menu-btn" data-doctype="invoice" data-id="${inv.id}">Export <span class="chevron">▾</span></button></div>
                  ${inv.status === 'Issued' ? `<button class="danger cancel-invoice" data-id="${inv.id}">Cancel</button>` : ''}
                </td>
              </tr>
            `;
            }).join('')}
          </tbody>
        </table>`
    }
  `;

  document.getElementById('new-invoice-btn').onclick = () => openDirectInvoiceModal();

  document.querySelectorAll('.edit-invoice-eway').forEach((btn) => {
    btn.onclick = () => openInvoiceEwayBillModal(Number(btn.dataset.id));
  });

  attachExportMenus();

  document.querySelectorAll('.record-payment').forEach((btn) => {
    btn.onclick = () => openInvoicePaymentsModal(Number(btn.dataset.id));
  });

  document.querySelectorAll('.cancel-invoice').forEach((btn) => {
    btn.onclick = () => {
      openConfirm(
        'Cancel this invoice? The invoice number is retained for GST record-keeping — this cannot be undone.',
        async () => {
          await window.api.invoices.cancel(Number(btn.dataset.id));
          renderInvoicesList();
        },
        'Cancel Invoice'
      );
    };
  });
}

function openInvoiceEwayBillModal(invoiceId) {
  openModal(`
    <div class="modal-header">
      <h2>E-Way Bill Details</h2>
      <button class="modal-close">&times;</button>
    </div>
    <div class="modal-body">
      <div class="form-row">
        <div class="form-group">
          <label>E-Way Bill Number</label>
          <input id="inv-eway-num" placeholder="e.g. EWB1234567890">
        </div>
        <div class="form-group">
          <label>E-Way Bill Date</label>
          <input id="inv-eway-date" type="date">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Vehicle Number</label>
          <input id="inv-vehicle-num" placeholder="e.g. MP09AB1234">
        </div>
        <div class="form-group">
          <label>Distance (km)</label>
          <input id="inv-distance" type="number" min="0" step="0.1">
        </div>
      </div>
      <div class="form-group">
        <label>Transporter Name</label>
        <input id="inv-transporter" placeholder="e.g. V-Trans Express">
      </div>
      <div class="form-group" style="margin-top:4px;">
        <label>Bilty / LR / Consignment No. <span style="font-weight:400;color:#888;">(optional)</span></label>
        <input id="inv-bilty-num" placeholder="e.g. LR-98765">
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn modal-cancel">Cancel</button>
      <button class="btn btn-primary" id="save-inv-eway-btn">Save</button>
    </div>
  `);

  window.api.invoices.get(invoiceId).then(inv => {
    if (inv) {
      document.getElementById('inv-eway-num').value = inv.eway_bill_number || '';
      document.getElementById('inv-eway-date').value = inv.eway_bill_date || '';
      document.getElementById('inv-vehicle-num').value = inv.vehicle_number || '';
      document.getElementById('inv-distance').value = inv.distance_km || '';
      document.getElementById('inv-transporter').value = inv.transporter_name || '';
      document.getElementById('inv-bilty-num').value = inv.bilty_number || '';
    }
  });

  document.getElementById('save-inv-eway-btn').onclick = async () => {
    await window.api.invoices.updateEwayBill(invoiceId, {
      eway_bill_number: document.getElementById('inv-eway-num').value.trim() || null,
      eway_bill_date: document.getElementById('inv-eway-date').value || null,
      vehicle_number: document.getElementById('inv-vehicle-num').value.trim() || null,
      transporter_name: document.getElementById('inv-transporter').value.trim() || null,
      distance_km: document.getElementById('inv-distance').value || null,
      bilty_number: document.getElementById('inv-bilty-num').value.trim() || null
    });
    closeModal();
    renderInvoicesList();
  };
}

let directInvoiceItems = [];
let directInvoiceProducts = [];
let invoiceCompanyState = '';
let invoiceCustomerState = '';

async function openDirectInvoiceModal() {
  const [customers, company] = await Promise.all([
    window.api.customers.list(),
    window.api.company.get()
  ]);
  invoiceCompanyState = company?.state || '';
  directInvoiceItems = [{ product_id: null, description: '', hsn_code: '', qty: 1, unit: 'unit', unit_price: 0, gst_rate: 18, line_total: 0 }];
  directInvoiceProducts = [];
  invoiceCustomerState = '';

  openModal(`
    <div class="modal-header">
      <h2>New Direct Invoice</h2>
      <button class="modal-close">&times;</button>
    </div>
    <div class="modal-body">
      <div class="form-row">
        <div class="form-group">
          <label>Customer *</label>
          <select id="di-customer">
            <option value="">Select a customer&hellip;</option>
            ${customers.map((c) => `<option value="${c.id}" data-state="${escapeAttr(c.state || '')}">${escapeHtml(c.company_name || c.contact_name)} &middot; ${escapeHtml(c.contact_name)}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Issue Date *</label>
          <input type="date" id="di-issue-date" value="${new Date().toISOString().slice(0, 10)}">
        </div>
        <div class="form-group">
          <label>Due Date</label>
          <input type="date" id="di-due-date">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Payment Terms</label>
          <input id="di-payment-terms" placeholder="e.g. Net 30 Days">
        </div>
        <div class="form-group">
          <label>Notes</label>
          <input id="di-notes" placeholder="e.g. Thank you for your business">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Bilty / LR / Consignment No. <span style="font-weight:400;color:#888;">(optional)</span></label>
          <input id="di-bilty-number" placeholder="e.g. LR-98765 / Bilty-001">
        </div>
      </div>
      <div class="form-group">
        <label>Items</label>
        <div id="no-customer-note-di" class="inline-note">Select a customer to enable product pricing lookup, or add items manually below.</div>
        <div id="di-items-list"></div>
        <button class="link-add" id="add-di-item-btn" style="margin-top:8px;">+ Add Item</button>
      </div>
      <div class="totals-section" style="margin-top:16px; padding:12px; background:#f3f5f7; border-radius:6px;">
        <div class="summary-line"><span>Subtotal:</span> <span id="di-subtotal">₹0.00</span></div>
        <div id="di-tax-breakdown"></div>
        <div class="summary-line">
          <span>Discount (₹):</span>
          <input type="number" id="di-discount" value="0" min="0" step="0.01" style="width:100px; text-align:right;">
        </div>
        <div class="summary-line total" style="margin-top:8px; border-top:1px solid #ccc; padding-top:8px;">
          <span>Grand Total:</span> <span id="di-grand-total">₹0.00</span>
        </div>
      </div>
      <div id="di-eway-banner" style="margin-top:16px;"></div>
    </div>
    <div class="modal-footer">
      <button class="btn modal-cancel">Cancel</button>
      <button class="btn btn-primary" id="save-di-btn">Create Invoice</button>
    </div>
  `);

  renderDirectInvoiceItemRows();

  const custSelect = document.getElementById('di-customer');
  custSelect.onchange = async (e) => {
    const customerId = Number(e.target.value);
    if (!customerId) {
      directInvoiceProducts = [];
      invoiceCustomerState = '';
      renderDirectInvoiceItemRows();
      return;
    }
    const opt = custSelect.options[custSelect.selectedIndex];
    invoiceCustomerState = opt.dataset.state || '';
    directInvoiceProducts = await window.api.quotations.productsForCustomer(customerId);
    renderDirectInvoiceItemRows();
  };

  document.getElementById('add-di-item-btn').onclick = () => {
    directInvoiceItems.push({ product_id: null, description: '', hsn_code: '', qty: 1, unit: 'unit', unit_price: 0, gst_rate: 18, line_total: 0 });
    renderDirectInvoiceItemRows();
  };

  document.getElementById('di-discount').oninput = renderDirectInvoiceItemRows;

  document.getElementById('save-di-btn').onclick = async () => {
    const customerId = Number(custSelect.value) || null;
    if (!customerId) {
      showFormError('Please select a customer.');
      return;
    }
    if (directInvoiceItems.some(it => !it.description || Number(it.qty) <= 0 || Number(it.unit_price) < 0)) {
      showFormError('Every item needs a description, quantity > 0, and valid price.');
      return;
    }
    const ewayNum = document.getElementById('di-eway-number');
    
    const result = await window.api.invoices.create({
      customer_id: customerId,
      issue_date: document.getElementById('di-issue-date').value || null,
      due_date: document.getElementById('di-due-date').value || null,
      payment_terms: document.getElementById('di-payment-terms').value.trim() || null,
      notes: document.getElementById('di-notes').value.trim() || null,
      discount: Number(document.getElementById('di-discount').value) || 0,
      items: directInvoiceItems,
      bilty_number: document.getElementById('di-bilty-number') ? document.getElementById('di-bilty-number').value.trim() || null : null,
      eway_bill_number: ewayNum ? ewayNum.value.trim() || null : null,
      eway_bill_date: document.getElementById('di-eway-date') ? document.getElementById('di-eway-date').value || null : null,
      vehicle_number: document.getElementById('di-vehicle-num') ? document.getElementById('di-vehicle-num').value.trim() || null : null,
      transporter_name: document.getElementById('di-transporter') ? document.getElementById('di-transporter').value.trim() || null : null,
      distance_km: document.getElementById('di-distance') ? document.getElementById('di-distance').value || null : null
    });
    
    if (result.success !== false) {
      closeModal();
      renderInvoicesList();
      // Optional toast/notification here if preferred
    } else {
      showFormError(result.reason);
    }
  };
}

function renderDirectInvoiceItemRows() {
  const list = document.getElementById('di-items-list');
  const noCustomerNote = document.getElementById('no-customer-note-di');
  if (noCustomerNote) {
    noCustomerNote.classList.toggle('hidden', directInvoiceProducts.length > 0);
  }

  list.innerHTML = directInvoiceItems.map((item, i) => `
    <div class="item-row">
      <select data-idx="${i}" class="di-product">
        <option value="">Custom item</option>
        ${directInvoiceProducts.map((p) => `
          <option value="${p.id}" ${item.product_id === p.id ? 'selected' : ''}>${escapeHtml(p.name)}</option>
        `).join('')}
      </select>
      <input class="di-desc" data-idx="${i}" placeholder="Description" value="${escapeAttr(item.description)}">
      <input class="di-hsn" data-idx="${i}" placeholder="HSN" value="${escapeAttr(item.hsn_code)}" style="width:80px;">
      <input class="di-qty" data-idx="${i}" type="number" min="0" step="1" placeholder="Qty" value="${item.qty}" style="width:70px;">
      <input class="di-price" data-idx="${i}" type="number" min="0" step="0.01" placeholder="Price" value="${item.unit_price}" style="width:100px;">
      <select class="di-gst" data-idx="${i}" style="width:70px;">
        ${[0, 5, 12, 18, 28].map(r => `<option value="${r}" ${item.gst_rate == r ? 'selected' : ''}>${r}%</option>`).join('')}
      </select>
      <div style="width:80px; text-align:right; align-self:center; font-family:monospace;">₹${item.line_total.toFixed(2)}</div>
      ${directInvoiceItems.length > 1 ? `<button class="remove-line" data-idx="${i}">&times;</button>` : ''}
    </div>
  `).join('');

  list.querySelectorAll('.di-product').forEach((el) => {
    el.onchange = () => {
      const idx = Number(el.dataset.idx);
      const product = directInvoiceProducts.find((p) => p.id === Number(el.value));
      if (product) {
        directInvoiceItems[idx] = {
          ...directInvoiceItems[idx],
          product_id: product.id,
          description: product.name,
          hsn_code: product.hsn_code || '',
          unit: product.unit || 'unit',
          unit_price: product.resolved_price,
          gst_rate: product.gst_rate || 18,
        };
      } else {
        directInvoiceItems[idx].product_id = null;
      }
      recalcDirectInvoice();
    };
  });

  const attachEvent = (cls, key, numeric) => {
    list.querySelectorAll(cls).forEach((el) => el.oninput = (e) => {
      directInvoiceItems[Number(e.target.dataset.idx)][key] = numeric ? Number(e.target.value) : e.target.value;
      if (numeric) recalcDirectInvoice();
    });
  };
  attachEvent('.di-desc', 'description', false);
  attachEvent('.di-hsn', 'hsn_code', false);
  attachEvent('.di-qty', 'qty', true);
  attachEvent('.di-price', 'unit_price', true);
  list.querySelectorAll('.di-gst').forEach(el => el.onchange = (e) => {
    directInvoiceItems[Number(e.target.dataset.idx)].gst_rate = Number(e.target.value);
    recalcDirectInvoice();
  });
  list.querySelectorAll('.remove-line').forEach((el) => el.onclick = (e) => {
    directInvoiceItems.splice(Number(e.target.dataset.idx), 1);
    recalcDirectInvoice();
  });

  recalcDirectInvoice(false);
}

function recalcDirectInvoice(reRender = true) {
  let subtotal = 0;
  let cgst = 0;
  let sgst = 0;
  let igst = 0;

  const normalize = (s) => String(s || '').trim().toLowerCase();
  const sameState = normalize(invoiceCompanyState) === normalize(invoiceCustomerState);

  directInvoiceItems.forEach(item => {
    const qty = Number(item.qty) || 0;
    const price = Number(item.unit_price) || 0;
    item.line_total = qty * price;
    subtotal += item.line_total;

    const tax = item.line_total * (Number(item.gst_rate) / 100);
    if (sameState) {
      cgst += tax / 2;
      sgst += tax / 2;
    } else {
      igst += tax;
    }
  });

  const discount = Number(document.getElementById('di-discount')?.value || 0);
  const total = subtotal + cgst + sgst + igst - discount;

  const diSub = document.getElementById('di-subtotal');
  const diTax = document.getElementById('di-tax-breakdown');
  const diGrand = document.getElementById('di-grand-total');

  if (diSub) diSub.textContent = `₹${subtotal.toFixed(2)}`;
  if (diGrand) diGrand.textContent = `₹${total.toFixed(2)}`;
  
  if (diTax) {
    if (sameState) {
      diTax.innerHTML = `
        <div class="summary-line"><span>CGST:</span> <span>₹${cgst.toFixed(2)}</span></div>
        <div class="summary-line"><span>SGST:</span> <span>₹${sgst.toFixed(2)}</span></div>
      `;
    } else {
      diTax.innerHTML = `<div class="summary-line"><span>IGST:</span> <span>₹${igst.toFixed(2)}</span></div>`;
    }
  }

  const ewayBanner = document.getElementById('di-eway-banner');
  if (ewayBanner) {
    if (total > 50000) {
      if (!document.getElementById('di-eway-number')) {
        ewayBanner.innerHTML = `
          <div class="eway-warning" style="background:#fff3cd; border:1px solid #ffe69c; padding:12px; border-radius:6px; color:#856404;">
            <strong>⚠️ E-Way Bill Required (Total exceeds ₹50,000)</strong>
            <div class="form-row" style="margin-top:8px;">
              <div class="form-group"><label>E-Way Bill Number</label><input id="di-eway-number" placeholder="e.g. EWB123"></div>
              <div class="form-group"><label>E-Way Bill Date</label><input id="di-eway-date" type="date"></div>
            </div>
            <div class="form-row">
              <div class="form-group"><label>Vehicle No.</label><input id="di-vehicle-num" placeholder="e.g. MP09AB1234"></div>
              <div class="form-group"><label>Distance (km)</label><input id="di-distance" type="number" min="0" step="0.1"></div>
            </div>
            <div class="form-group"><label>Transporter Name</label><input id="di-transporter" placeholder="e.g. V-Trans"></div>
          </div>
        `;
      }
    } else {
      ewayBanner.innerHTML = '';
    }
  }

  if (reRender) {
    // Only update lines, avoid full recreation to keep focus if needed
    // In simpler approach, just re-render fully but we must not lose input focus.
    // Instead of full render, let's just update the line total text nodes.
    const list = document.getElementById('di-items-list');
    if (list) {
      Array.from(list.children).forEach((row, i) => {
        const valDiv = row.querySelector('div[style*="text-align:right"]');
        if (valDiv && directInvoiceItems[i]) {
          valDiv.textContent = `₹${directInvoiceItems[i].line_total.toFixed(2)}`;
        }
      });
    }
  }
}

// Payment history + record-payment form for one invoice. Reopens itself after any
// change so the balance-due figure and history list are always current.
async function openInvoicePaymentsModal(invoiceId) {
  const invoice = await window.api.invoices.get(invoiceId);
  if (!invoice) return;
  const balanceDue = round2(Number(invoice.total) - Number(invoice.amount_paid));

  openModal(`
    <div class="modal-header">
      <h2>Payments — ${escapeHtml(invoice.invoice_number)}</h2>
      <button class="modal-close">&times;</button>
    </div>
    <div class="modal-body">
      <div class="summary-lines">
        <div class="summary-line"><span>Invoice Total</span><span>₹${Number(invoice.total).toFixed(2)}</span></div>
        <div class="summary-line"><span>Amount Paid</span><span>₹${Number(invoice.amount_paid).toFixed(2)}</span></div>
        <div class="summary-line total"><span>Balance Due</span><span>₹${balanceDue.toFixed(2)}</span></div>
      </div>

      ${balanceDue > 0 ? `
      <div class="form-row">
        <div class="form-group">
          <label>Amount *</label>
          <input type="number" id="pay-amount" step="0.01" min="0.01" max="${balanceDue}" value="${balanceDue.toFixed(2)}">
        </div>
        <div class="form-group">
          <label>Date *</label>
          <input type="date" id="pay-date" value="${new Date().toISOString().slice(0, 10)}">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Mode</label>
          <select id="pay-mode">
            <option value="">—</option>
            ${PAYMENT_MODES.map((m) => `<option value="${m}">${m}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Reference</label>
          <input type="text" id="pay-reference" placeholder="Txn ID / cheque no.">
        </div>
      </div>
      <button class="btn btn-primary" id="save-payment-btn">Record Payment</button>
      ` : `<div class="inline-note">Invoice fully paid.</div>`}

      <h3 style="margin-top:16px">History</h3>
      ${invoice.payments.length === 0
        ? `<div class="inline-note">No payments recorded yet.</div>`
        : invoice.payments.map((p) => `
            <div class="list-row">
              <div>
                <div class="list-row-title">₹${Number(p.amount).toFixed(2)}${p.mode ? ' — ' + escapeHtml(p.mode) : ''}</div>
                <div class="list-row-sub">${escapeHtml(p.payment_date.slice(0, 10))}${p.reference ? ' · ' + escapeHtml(p.reference) : ''}</div>
              </div>
              <button class="danger delete-payment" data-id="${p.id}">Delete</button>
            </div>
          `).join('')
      }
    </div>
    <div class="modal-footer">
      <button class="btn modal-cancel">Close</button>
    </div>
  `);

  const saveBtn = document.getElementById('save-payment-btn');
  if (saveBtn) {
    saveBtn.onclick = async () => {
      const amount = Number(document.getElementById('pay-amount').value);
      const paymentDate = document.getElementById('pay-date').value;
      if (!amount || amount <= 0) {
        showFormError('Enter an amount greater than zero.');
        return;
      }
      if (!paymentDate) {
        showFormError('Payment date is required.');
        return;
      }
      await window.api.invoicePayments.create({
        invoice_id: invoiceId,
        amount,
        payment_date: paymentDate,
        mode: document.getElementById('pay-mode').value || null,
        reference: document.getElementById('pay-reference').value.trim() || null
      });
      openInvoicePaymentsModal(invoiceId);
      renderInvoicesList();
    };
  }

  document.querySelectorAll('.delete-payment').forEach((btn) => {
    btn.onclick = () => {
      openConfirm('Delete this payment record?', async () => {
        await window.api.invoicePayments.delete(Number(btn.dataset.id));
        openInvoicePaymentsModal(invoiceId);
        renderInvoicesList();
      });
    };
  });
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

// ─── Delivery Challans ───────────────────────────────────────────────────────

const CHALLAN_STATUS_CLASSES = { Issued: 'badge-green', Cancelled: 'badge-red' };

async function renderChallansList() {
  const challans = await window.api.challans.list();

  viewRoot.innerHTML = `
    <div class="view-toolbar">
      <button class="btn btn-primary" id="new-challan-btn">+ New Delivery Challan</button>
    </div>
    ${challans.length === 0
      ? `<div class="empty-state">No delivery challans yet.</div>`
      : `<table class="data-table">
          <thead>
            <tr>
              <th>Challan #</th>
              <th>Customer</th>
              <th>Against Invoice</th>
              <th>Value</th>
              <th>E-Way Bill</th>
              <th>Status</th>
              <th>Date</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${challans.map((ch) => {
              const ewayRequired = Number(ch.total_value) > EWAY_BILL_THRESHOLD;
              const ewayCell = ch.eway_bill_number
                ? `<span class="badge badge-green">${escapeHtml(ch.eway_bill_number)}</span>`
                : (ewayRequired ? `<span class="badge badge-red">Required</span>` : `<span class="inline-note">—</span>`);
              return `
              <tr>
                <td class="mono">${escapeHtml(ch.challan_number)}</td>
                <td>${escapeHtml(ch.company_name || ch.contact_name)}</td>
                <td>${ch.invoice_number ? `<span class="mono">${escapeHtml(ch.invoice_number)}</span>` : '<span class="inline-note">Standalone</span>'}</td>
                <td class="mono">₹${Number(ch.total_value).toFixed(2)}</td>
                <td>${ewayCell}</td>
                <td><span class="badge ${CHALLAN_STATUS_CLASSES[ch.status] || 'badge-gray'}">${escapeHtml(ch.status)}</span></td>
                <td>${formatShortDate(ch.issue_date)}</td>
                <td class="row-actions">
                  <div class="export-wrap"><button class="export-menu-btn" data-doctype="challan" data-id="${ch.id}">Export <span class="chevron">▾</span></button></div>
                  <button class="edit-eway-btn" data-id="${ch.id}" data-number="${escapeAttr(ch.eway_bill_number || '')}" data-date="${escapeAttr(ch.eway_bill_date || '')}">E-Way Bill</button>
                  ${ch.status === 'Issued' ? `<button class="danger cancel-challan" data-id="${ch.id}">Cancel</button>` : ''}
                </td>
              </tr>
            `;
            }).join('')}
          </tbody>
        </table>`
    }
  `;

  document.getElementById('new-challan-btn').onclick = () => openChallanForm();

  document.querySelectorAll('.edit-eway-btn').forEach((btn) => {
    btn.onclick = () => openEwayBillModal(Number(btn.dataset.id), btn.dataset.number, btn.dataset.date);
  });

  attachExportMenus();

  document.querySelectorAll('.cancel-challan').forEach((btn) => {
    btn.onclick = () => {
      openConfirm(
        'Cancel this delivery challan? This cannot be undone.',
        async () => {
          await window.api.challans.cancel(Number(btn.dataset.id));
          renderChallansList();
        },
        'Cancel Challan'
      );
    };
  });
}

function openEwayBillModal(challanId, currentNumber, currentDate) {
  window.api.challans.get(challanId).then(ch => {
    openModal(`
      <div class="modal-header">
        <h2>E-Way Bill &amp; Transport Details</h2>
        <button class="modal-close">&times;</button>
      </div>
      <div class="modal-body">
        <div class="form-row">
          <div class="form-group">
            <label>E-Way Bill Number</label>
            <input id="eway-modal-number" value="${escapeAttr(currentNumber)}" placeholder="e.g. EWB1234567890">
          </div>
          <div class="form-group">
            <label>E-Way Bill Date</label>
            <input id="eway-modal-date" type="date" value="${escapeAttr(currentDate)}">
          </div>
        </div>
        <div class="form-group">
          <label>Bilty / LR / Consignment No. <span style="font-weight:400;color:#888;">(optional)</span></label>
          <input id="eway-modal-bilty" value="${escapeAttr(ch ? ch.bilty_number || '' : '')}" placeholder="e.g. LR-98765">
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn modal-cancel">Cancel</button>
        <button class="btn btn-primary" id="save-eway-btn">Save</button>
      </div>
    `);

    document.getElementById('save-eway-btn').onclick = async () => {
      await window.api.challans.updateEwayBill(challanId, {
        eway_bill_number: document.getElementById('eway-modal-number').value.trim(),
        eway_bill_date: document.getElementById('eway-modal-date').value || null,
        bilty_number: document.getElementById('eway-modal-bilty').value.trim() || null
      });
      closeModal();
      renderChallansList();
    };
  });
}

let challanFormItems = [];
let challanFormProducts = [];

async function openChallanForm() {
  const customers = await window.api.customers.list();
  challanFormItems = [{ product_id: null, description: '', hsn_code: '', qty: 1, unit: 'unit', unit_value: 0 }];
  challanFormProducts = [];

  openModal(`
    <div class="modal-header">
      <h2>New Delivery Challan</h2>
      <button class="modal-close">&times;</button>
    </div>
    <div class="modal-body">
      <div class="form-row">
        <div class="form-group">
          <label>Customer *</label>
          <select id="ch-customer">
            <option value="">Select a customer&hellip;</option>
            ${customers.map((c) => `<option value="${c.id}">${escapeHtml(c.company_name || c.contact_name)} &middot; ${escapeHtml(c.contact_name)}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Against Invoice (optional)</label>
          <select id="ch-invoice">
            <option value="">Not linked — standalone challan</option>
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Transport Mode</label>
          <input id="ch-transport-mode" placeholder="e.g. Road">
        </div>
        <div class="form-group">
          <label>Vehicle Number</label>
          <input id="ch-vehicle" placeholder="e.g. MP09AB1234">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Bilty / LR / Consignment No. <span style="font-weight:400;color:#888;">(optional)</span></label>
          <input id="ch-bilty-number" placeholder="e.g. LR-98765 / Bilty-001">
        </div>
      </div>
      <div class="form-group">
        <label>Items</label>
        <div id="no-customer-note-challan" class="inline-note">Select a customer to enable product pricing lookup, or add items manually below.</div>
        <div id="challan-items-list"></div>
        <button class="link-add" id="add-challan-item-btn" style="margin-top:8px;">+ Add Item</button>
      </div>
      <div id="eway-bill-banner"></div>
      <div class="form-row">
        <div class="form-group">
          <label>E-Way Bill Number</label>
          <input id="ch-eway-number" placeholder="Enter after generating on the GST portal">
        </div>
        <div class="form-group">
          <label>E-Way Bill Date</label>
          <input id="ch-eway-date" type="date">
        </div>
      </div>
      <div class="form-group">
        <label>Notes</label>
        <textarea id="ch-notes" rows="2"></textarea>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn modal-cancel">Cancel</button>
      <button class="btn btn-primary" id="save-challan-btn">Create Challan</button>
    </div>
  `);

  renderChallanItemRows();
  updateEwayBillBanner();

  document.getElementById('ch-customer').onchange = async (e) => {
    const customerId = Number(e.target.value);
    const invoiceSelect = document.getElementById('ch-invoice');
    if (!customerId) {
      invoiceSelect.innerHTML = `<option value="">Not linked — standalone challan</option>`;
      challanFormProducts = [];
      renderChallanItemRows();
      return;
    }
    const invoices = await window.api.invoices.list();
    const customerInvoices = invoices.filter((inv) => inv.status === 'Issued');
    invoiceSelect.innerHTML = `
      <option value="">Not linked — standalone challan</option>
      ${customerInvoices.map((inv) => `<option value="${inv.id}">${escapeHtml(inv.invoice_number)} &middot; ${escapeHtml(inv.company_name || inv.contact_name)}</option>`).join('')}
    `;

    challanFormProducts = await window.api.quotations.productsForCustomer(customerId);
    renderChallanItemRows();
  };

  document.getElementById('add-challan-item-btn').onclick = () => {
    challanFormItems.push({ product_id: null, description: '', hsn_code: '', qty: 1, unit: 'unit', unit_value: 0 });
    renderChallanItemRows();
    updateEwayBillBanner();
  };

  document.getElementById('save-challan-btn').onclick = async () => {
    const customerId = Number(document.getElementById('ch-customer').value) || null;
    if (!customerId) {
      showFormError('Please select a customer.');
      return;
    }
    if (challanFormItems.some((it) => !it.description || Number(it.qty) <= 0)) {
      showFormError('Every item needs a description and a quantity greater than 0.');
      return;
    }
    const result = await window.api.challans.create({
      customer_id: customerId,
      invoice_id: Number(document.getElementById('ch-invoice').value) || null,
      transport_mode: document.getElementById('ch-transport-mode').value.trim(),
      vehicle_number: document.getElementById('ch-vehicle').value.trim(),
      bilty_number: document.getElementById('ch-bilty-number') ? document.getElementById('ch-bilty-number').value.trim() || null : null,
      eway_bill_number: document.getElementById('ch-eway-number').value.trim(),
      eway_bill_date: document.getElementById('ch-eway-date').value || null,
      notes: document.getElementById('ch-notes').value.trim(),
      items: challanFormItems
    });
    if (result.success) {
      closeModal();
      renderChallansList();
    } else {
      showFormError(result.reason);
    }
  };
}

function renderChallanItemRows() {
  const list = document.getElementById('challan-items-list');
  const noCustomerNote = document.getElementById('no-customer-note-challan');
  if (noCustomerNote) {
    noCustomerNote.classList.toggle('hidden', challanFormProducts.length > 0);
  }

  list.innerHTML = challanFormItems.map((item, i) => `
    <div class="item-row">
      <select data-idx="${i}" class="ci-product">
        <option value="">Custom item</option>
        ${challanFormProducts.map((p) => `
          <option value="${p.id}" ${item.product_id === p.id ? 'selected' : ''}>${escapeHtml(p.name)}</option>
        `).join('')}
      </select>
      <input class="ci-desc" data-idx="${i}" placeholder="Description" value="${escapeAttr(item.description)}">
      <input class="ci-hsn" data-idx="${i}" placeholder="HSN" value="${escapeAttr(item.hsn_code)}" style="width:80px;">
      <input class="ci-qty" data-idx="${i}" type="number" min="0" step="1" placeholder="Qty" value="${item.qty}" style="width:70px;">
      <input class="ci-unit" data-idx="${i}" placeholder="Unit" value="${escapeAttr(item.unit)}" style="width:80px;">
      <input class="ci-value" data-idx="${i}" type="number" min="0" step="0.01" placeholder="Ref. Value" value="${item.unit_value}" style="width:100px;">
      ${challanFormItems.length > 1 ? `<button class="remove-line" data-idx="${i}">&times;</button>` : ''}
    </div>
  `).join('');

  list.querySelectorAll('.ci-product').forEach((el) => {
    el.onchange = () => {
      const idx = Number(el.dataset.idx);
      const product = challanFormProducts.find((p) => p.id === Number(el.value));
      if (product) {
        challanFormItems[idx] = {
          ...challanFormItems[idx],
          product_id: product.id,
          description: product.name,
          hsn_code: product.hsn_code || '',
          unit: product.unit || 'unit',
          unit_value: product.resolved_price
        };
      } else {
        challanFormItems[idx].product_id = null;
      }
      renderChallanItemRows();
      updateEwayBillBanner();
    };
  });

  list.querySelectorAll('.ci-desc').forEach((el) => el.oninput = (e) => { challanFormItems[Number(e.target.dataset.idx)].description = e.target.value; });
  list.querySelectorAll('.ci-hsn').forEach((el) => el.oninput = (e) => { challanFormItems[Number(e.target.dataset.idx)].hsn_code = e.target.value; });
  list.querySelectorAll('.ci-qty').forEach((el) => el.oninput = (e) => {
    challanFormItems[Number(e.target.dataset.idx)].qty = e.target.value;
    updateEwayBillBanner();
  });
  list.querySelectorAll('.ci-unit').forEach((el) => el.oninput = (e) => { challanFormItems[Number(e.target.dataset.idx)].unit = e.target.value; });
  list.querySelectorAll('.ci-value').forEach((el) => el.oninput = (e) => {
    challanFormItems[Number(e.target.dataset.idx)].unit_value = e.target.value;
    updateEwayBillBanner();
  });
  list.querySelectorAll('.remove-line').forEach((el) => el.onclick = (e) => {
    challanFormItems.splice(Number(e.target.dataset.idx), 1);
    renderChallanItemRows();
    updateEwayBillBanner();
  });
}

const EWAY_BILL_THRESHOLD = 50000;

function updateEwayBillBanner() {
  const banner = document.getElementById('eway-bill-banner');
  if (!banner) return;
  const totalValue = challanFormItems.reduce((sum, it) => sum + (Number(it.qty) || 0) * (Number(it.unit_value) || 0), 0);
  banner.innerHTML = totalValue > EWAY_BILL_THRESHOLD
    ? `<div class="eway-warning">Goods value ₹${totalValue.toFixed(2)} exceeds the ₹${EWAY_BILL_THRESHOLD.toLocaleString('en-IN')} threshold — an E-Way Bill is required under GST rules. Record the number below once generated on the GST portal.</div>`
    : '';
}

// ─── Credit / Debit Notes ────────────────────────────────────────────────────

const NOTE_STATUS_CLASSES = { Issued: 'badge-green', Cancelled: 'badge-red' };

async function renderNotesList() {
  const notes = await window.api.creditDebitNotes.list();

  viewRoot.innerHTML = `
    <div class="view-toolbar">
      <button class="btn btn-primary" id="new-note-btn">+ New Credit/Debit Note</button>
    </div>
    ${notes.length === 0
      ? `<div class="empty-state">No credit or debit notes yet. These correct an already-issued invoice.</div>`
      : `<table class="data-table">
          <thead>
            <tr>
              <th>Note #</th>
              <th>Type</th>
              <th>Against Invoice</th>
              <th>Customer</th>
              <th>Status</th>
              <th>Amount</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${notes.map((n) => `
              <tr>
                <td class="mono">${escapeHtml(n.note_number)}</td>
                <td><span class="badge ${n.note_type === 'Credit' ? 'badge-blue' : 'badge-amber'}">${escapeHtml(n.note_type)}</span></td>
                <td class="mono">${escapeHtml(n.invoice_number)}</td>
                <td>${escapeHtml(n.company_name || n.contact_name)}</td>
                <td><span class="badge ${NOTE_STATUS_CLASSES[n.status] || 'badge-gray'}">${escapeHtml(n.status)}</span></td>
                <td class="mono">₹${Number(n.total).toFixed(2)}</td>
                <td class="row-actions">
                  <div class="export-wrap"><button class="export-menu-btn" data-doctype="note" data-id="${n.id}">Export <span class="chevron">▾</span></button></div>
                  ${n.status === 'Issued' ? `<button class="danger cancel-note" data-id="${n.id}">Cancel</button>` : ''}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>`
    }
  `;

  document.getElementById('new-note-btn').onclick = () => openNoteForm();

  attachExportMenus();

  document.querySelectorAll('.cancel-note').forEach((btn) => {
    btn.onclick = () => {
      openConfirm(
        'Cancel this note? The note number is retained for GST record-keeping — this cannot be undone.',
        async () => {
          await window.api.creditDebitNotes.cancel(Number(btn.dataset.id));
          renderNotesList();
        },
        'Cancel Note'
      );
    };
  });
}

let noteFormItems = [];

async function openNoteForm() {
  const invoices = await window.api.invoices.list();
  const issuedInvoices = invoices.filter((inv) => inv.status === 'Issued');
  noteFormItems = [{ product_id: null, description: '', hsn_code: '', qty: 1, unit_price: 0, gst_rate: 18 }];

  openModal(`
    <div class="modal-header">
      <h2>New Credit / Debit Note</h2>
      <button class="modal-close">&times;</button>
    </div>
    <div class="modal-body">
      <div class="form-row">
        <div class="form-group">
          <label>Against Invoice *</label>
          <select id="n-invoice">
            <option value="">Select an invoice&hellip;</option>
            ${issuedInvoices.map((inv) => `<option value="${inv.id}">${escapeHtml(inv.invoice_number)} &middot; ${escapeHtml(inv.company_name || inv.contact_name)}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Note Type *</label>
          <select id="n-type">
            <option value="Credit">Credit Note (reduces amount owed)</option>
            <option value="Debit">Debit Note (increases amount owed)</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label>Reason</label>
        <input id="n-reason" placeholder="e.g. Damaged goods returned">
      </div>
      <div class="form-group">
        <label>Items</label>
        <div id="note-items-list"></div>
        <button class="link-add" id="add-note-item-btn" style="margin-top:8px;">+ Add Item</button>
      </div>
      <div class="form-group">
        <label>Notes</label>
        <textarea id="n-notes" rows="2"></textarea>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn modal-cancel">Cancel</button>
      <button class="btn btn-primary" id="save-note-btn">Issue Note</button>
    </div>
  `);

  renderNoteItemRows();

  document.getElementById('add-note-item-btn').onclick = () => {
    noteFormItems.push({ product_id: null, description: '', hsn_code: '', qty: 1, unit_price: 0, gst_rate: 18 });
    renderNoteItemRows();
  };

  document.getElementById('save-note-btn').onclick = async () => {
    const invoiceId = Number(document.getElementById('n-invoice').value) || null;
    if (!invoiceId) {
      showFormError('Please select the invoice this note applies to.');
      return;
    }
    if (noteFormItems.some((it) => !it.description || Number(it.qty) <= 0)) {
      showFormError('Every item needs a description and a quantity greater than 0.');
      return;
    }
    const result = await window.api.creditDebitNotes.create({
      invoice_id: invoiceId,
      note_type: document.getElementById('n-type').value,
      reason: document.getElementById('n-reason').value.trim(),
      notes: document.getElementById('n-notes').value.trim(),
      items: noteFormItems
    });
    if (result.success) {
      closeModal();
      renderNotesList();
    } else {
      showFormError(result.reason);
    }
  };
}

function renderNoteItemRows() {
  const list = document.getElementById('note-items-list');
  list.innerHTML = noteFormItems.map((item, i) => `
    <div class="item-row">
      <input class="ni-desc" data-idx="${i}" placeholder="Description" value="${escapeAttr(item.description)}">
      <input class="ni-qty" data-idx="${i}" type="number" min="0" step="1" placeholder="Qty" value="${item.qty}" style="width:70px;">
      <input class="ni-price" data-idx="${i}" type="number" min="0" step="0.01" placeholder="Unit Price" value="${item.unit_price}" style="width:100px;">
      <input class="ni-gst" data-idx="${i}" type="number" min="0" step="0.01" placeholder="GST %" value="${item.gst_rate}" style="width:80px;">
      ${noteFormItems.length > 1 ? `<button class="remove-line" data-idx="${i}">&times;</button>` : ''}
    </div>
  `).join('');

  list.querySelectorAll('.ni-desc').forEach((el) => el.oninput = (e) => { noteFormItems[Number(e.target.dataset.idx)].description = e.target.value; });
  list.querySelectorAll('.ni-qty').forEach((el) => el.oninput = (e) => { noteFormItems[Number(e.target.dataset.idx)].qty = e.target.value; });
  list.querySelectorAll('.ni-price').forEach((el) => el.oninput = (e) => { noteFormItems[Number(e.target.dataset.idx)].unit_price = e.target.value; });
  list.querySelectorAll('.ni-gst').forEach((el) => el.oninput = (e) => { noteFormItems[Number(e.target.dataset.idx)].gst_rate = e.target.value; });
  list.querySelectorAll('.remove-line').forEach((el) => el.onclick = (e) => {
    noteFormItems.splice(Number(e.target.dataset.idx), 1);
    renderNoteItemRows();
  });
}

// ─── Reports ─────────────────────────────────────────────────────────────────

function getDateRangePreset(preset) {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const fmt = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  let from, to;
  if (preset === 'last_month') {
    from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    to = new Date(now.getFullYear(), now.getMonth(), 0);
  } else if (preset === 'this_quarter') {
    const q = Math.floor(now.getMonth() / 3);
    from = new Date(now.getFullYear(), q * 3, 1);
    to = new Date(now.getFullYear(), q * 3 + 3, 0);
  } else if (preset === 'this_year') {
    from = new Date(now.getFullYear(), 0, 1);
    to = new Date(now.getFullYear(), 11, 31);
  } else if (preset === 'all_time') {
    from = new Date(2000, 0, 1);
    to = new Date(2100, 0, 1);
  } else {
    preset = 'this_month';
    from = new Date(now.getFullYear(), now.getMonth(), 1);
    to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  }
  return { from: fmt(from), to: fmt(to), preset };
}

async function renderReports(range) {
  const currentRange = range || getDateRangePreset('this_month');
  const data = await window.api.reports.summary(currentRange);

  viewRoot.innerHTML = `
    <div class="reports-toolbar">
      <select id="report-range">
        <option value="this_month">This Month</option>
        <option value="last_month">Last Month</option>
        <option value="this_quarter">This Quarter</option>
        <option value="this_year">This Year</option>
        <option value="all_time">All Time</option>
      </select>
    </div>
    <div class="stat-grid">
      <div class="card stat-card"><div class="stat-label">Created</div><div class="stat-value">${data.created}</div></div>
      <div class="card stat-card"><div class="stat-label">Pending</div><div class="stat-value">${data.pending}</div></div>
      <div class="card stat-card"><div class="stat-label">Approved</div><div class="stat-value">${data.approved}</div></div>
    </div>
    <div class="stat-grid">
      <div class="card stat-card"><div class="stat-label">Rejected</div><div class="stat-value">${data.rejected}</div></div>
      <div class="card stat-card" style="grid-column: span 2;">
        <div class="stat-label">Revenue</div>
        <div class="stat-value">₹${Number(data.revenue).toFixed(2)}</div>
        <div class="stat-note">Approved quotes in selected range</div>
      </div>
    </div>
    <div class="dash-grid">
      <div class="card">
        <h3>Top Customers</h3>
        ${data.topCustomers.length === 0 ? `<div class="inline-note">No data in this range.</div>` :
          data.topCustomers.map((c) => `
            <div class="list-row">
              <div>
                <div class="list-row-title">${escapeHtml(c.company_name || c.contact_name)}</div>
                <div class="list-row-sub">${c.quote_count} quote${c.quote_count === 1 ? '' : 's'}</div>
              </div>
              <div class="mono">₹${Number(c.value).toFixed(2)}</div>
            </div>
          `).join('')
        }
      </div>
      <div class="card">
        <h3>Top Products</h3>
        ${data.topProducts.length === 0 ? `<div class="inline-note">No data in this range.</div>` :
          data.topProducts.map((p) => `
            <div class="list-row">
              <div>
                <div class="list-row-title">${escapeHtml(p.name)}</div>
                <div class="list-row-sub">${p.qty} units quoted</div>
              </div>
              <div class="mono">₹${Number(p.value).toFixed(2)}</div>
            </div>
          `).join('')
        }
      </div>
    </div>
    <div class="card" style="margin-top:16px;">
      <h3>Sales Register</h3>
      <div class="settings-note">Exports every invoice in the selected date range as a spreadsheet — invoice number, date, customer, GST split, and status. Handy for handing off to an accountant.</div>
      <div class="backup-actions">
        <button class="btn" id="export-sales-register-btn">Export Sales Register (Excel)</button>
        <span class="save-status" id="sales-register-status"></span>
      </div>
    </div>
    <div class="card" style="margin-top:16px;">
      <div class="card-header" style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
        <h3 style="margin:0;">Monthly Sales &amp; Collections Ledger</h3>
        <div style="margin-left:auto;display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
          <select id="monthly-ledger-year" style="padding:4px 8px;border-radius:6px;border:1px solid #ccc;">
            ${Array.from({length:5},(_,i)=>new Date().getFullYear()-i).map(y=>`<option value="${y}" ${y===new Date().getFullYear()?'selected':''}>${y}</option>`).join('')}
          </select>
          <button class="btn" id="export-monthly-ledger-excel-btn">Export Excel</button>
          <button class="btn" id="print-monthly-ledger-pdf-btn">Print / PDF</button>
        </div>
      </div>
      <div class="settings-note">Summarises every month's invoiced total, payments received, and outstanding balance for the selected year.</div>
      <div id="monthly-ledger-table-wrap" style="margin-top:12px;"></div>
    </div>
    <div class="card" style="margin-top:16px;">
      <div class="card-header">
        <h3>Document Audit Log</h3>
        <select id="audit-log-filter">
          <option value="">All document types</option>
          <option value="Quotation">Quotations</option>
          <option value="Invoice">Invoices</option>
          <option value="Challan">Delivery Challans</option>
          <option value="Credit Note">Credit Notes</option>
          <option value="Debit Note">Debit Notes</option>
        </select>
      </div>
      <div class="settings-note">Every quotation, invoice, challan, and note is created/cancelled here — this log tracks who did what, when, since those documents can't simply be deleted.</div>
      <div id="audit-log-table"></div>
    </div>
    <div class="card" style="margin-top:16px;">
      <h3>Backup &amp; Restore</h3>
      <div class="backup-actions">
        <button class="btn" id="backup-create-btn">Backup Now</button>
        <button class="btn" id="backup-restore-btn">Restore from Backup</button>
      </div>
      <div class="backup-note">Backup saves a complete copy of your database to a file you choose. Restoring replaces all current data with the backup and restarts the app.</div>
    </div>
  `;

  await renderAuditLogTable();
  document.getElementById('audit-log-filter').onchange = (e) => renderAuditLogTable(e.target.value);

  document.getElementById('export-sales-register-btn').onclick = async () => {
    const btn = document.getElementById('export-sales-register-btn');
    const status = document.getElementById('sales-register-status');
    const original = btn.textContent;
    btn.textContent = 'Exporting…';
    btn.disabled = true;
    const rangeLabels = { this_month: 'This Month', last_month: 'Last Month', this_quarter: 'This Quarter', this_year: 'This Year', all_time: 'All Time' };
    const result = await window.api.reports.exportSalesRegister({ ...currentRange, label: rangeLabels[currentRange.preset] });
    btn.textContent = original;
    btn.disabled = false;
    if (result.success) {
      status.textContent = `Exported ${result.count} invoice${result.count === 1 ? '' : 's'}`;
      status.className = 'save-status success';
      setTimeout(() => { status.textContent = ''; }, 3000);
    }
  };

  document.getElementById('report-range').value = currentRange.preset;
  document.getElementById('report-range').onchange = (e) => {
    renderReports(getDateRangePreset(e.target.value));
  };

  // ─── Monthly Ledger ──────────────────────────────────────────────────────
  const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  async function renderMonthlyLedger(year) {
    const wrap = document.getElementById('monthly-ledger-table-wrap');
    if (!wrap) return;
    wrap.innerHTML = `<div class="inline-note">Loading…</div>`;
    const ledger = await window.api.reports.monthlyLedger(year);
    if (!ledger || !ledger.months || ledger.months.length === 0) {
      wrap.innerHTML = `<div class="inline-note">No invoice data found for ${year}.</div>`;
      return;
    }
    const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', {minimumFractionDigits:2, maximumFractionDigits:2})}`;
    wrap.innerHTML = `
      <table class="data-table">
        <thead>
          <tr>
            <th>Month</th>
            <th class="r">Invoices</th>
            <th class="r">Total Invoiced</th>
            <th class="r">Payments Received</th>
            <th class="r">Outstanding Balance</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${ledger.months.map((m, idx) => `
            <tr>
              <td><strong>${escapeHtml(m.month_name || (MONTH_NAMES[idx] + ' ' + year))}</strong></td>
              <td class="r mono">${m.invoice_count}</td>
              <td class="r mono">${fmt(m.total_invoiced)}</td>
              <td class="r mono" style="color:#1a7f4b;">${fmt(m.payments_received ?? m.total_received ?? 0)}</td>
              <td class="r mono" style="color:${(m.outstanding_balance ?? m.balance_due ?? 0) > 0 ? '#c0392b' : '#1a7f4b'};">${fmt(m.outstanding_balance ?? m.balance_due ?? 0)}</td>
              <td>${m.invoice_count > 0 ? `<button class="btn btn-sm view-month-details" data-idx="${idx}" style="white-space:nowrap;">View Details</button>` : ''}</td>
            </tr>
          `).join('')}
        </tbody>
        <tfoot>
          <tr style="font-weight:700;border-top:2px solid #ccc;">
            <td>Year Total</td>
            <td class="r mono">${ledger.months.reduce((s,m)=>s+m.invoice_count,0)}</td>
            <td class="r mono">${fmt(ledger.months.reduce((s,m)=>s+m.total_invoiced,0))}</td>
            <td class="r mono" style="color:#1a7f4b;">${fmt(ledger.months.reduce((s,m)=>s+(m.payments_received ?? m.total_received ?? 0),0))}</td>
            <td class="r mono" style="color:#c0392b;">${fmt(ledger.months.reduce((s,m)=>s+(m.outstanding_balance ?? m.balance_due ?? 0),0))}</td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    `;
    wrap.querySelectorAll('.view-month-details').forEach(btn => {
      btn.onclick = () => {
        const m = ledger.months[Number(btn.dataset.idx)];
        const fmt2 = (n) => `₹${Number(n || 0).toLocaleString('en-IN', {minimumFractionDigits:2, maximumFractionDigits:2})}`;
        openModal(`
          <div class="modal-header">
            <h2>${MONTH_NAMES[m.month-1]} ${year} — Invoice Breakdown</h2>
            <button class="modal-close">&times;</button>
          </div>
          <div class="modal-body">
            ${m.invoices && m.invoices.length > 0 ? `
              <table class="data-table">
                <thead><tr>
                  <th>Invoice No.</th>
                  <th>Bilty / LR</th>
                  <th>Date</th>
                  <th>Customer</th>
                  <th class="r">Total</th>
                  <th class="r">Paid</th>
                  <th class="r">Balance</th>
                  <th>Status</th>
                </tr></thead>
                <tbody>
                  ${m.invoices.map(inv => `
                    <tr>
                      <td class="mono">${escapeHtml(inv.invoice_number || '—')}</td>
                      <td class="mono">${escapeHtml(inv.bilty_number || '—')}</td>
                      <td>${formatShortDate(inv.issue_date)}</td>
                      <td>${escapeHtml(inv.customer_name || '—')}</td>
                      <td class="r mono">${fmt2(inv.total)}</td>
                      <td class="r mono" style="color:#1a7f4b;">${fmt2(inv.paid)}</td>
                      <td class="r mono" style="color:${inv.balance > 0 ? '#c0392b' : '#1a7f4b'};">${fmt2(inv.balance)}</td>
                      <td><span class="status-badge status-${(inv.payment_status||'').toLowerCase()}">${escapeHtml(inv.payment_status || inv.status || '—')}</span></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            ` : '<div class="inline-note">No invoices in this month.</div>'}
          </div>
          <div class="modal-footer">
            <button class="btn modal-cancel">Close</button>
          </div>
        `);
      };
    });
  }

  const ledgerYearSel = document.getElementById('monthly-ledger-year');
  if (ledgerYearSel) {
    renderMonthlyLedger(Number(ledgerYearSel.value));
    ledgerYearSel.onchange = () => renderMonthlyLedger(Number(ledgerYearSel.value));
  }

  document.getElementById('export-monthly-ledger-excel-btn').onclick = async () => {
    const year = Number(document.getElementById('monthly-ledger-year').value);
    const btn = document.getElementById('export-monthly-ledger-excel-btn');
    const orig = btn.textContent;
    btn.textContent = 'Exporting…';
    btn.disabled = true;
    await window.api.reports.exportMonthlyLedgerExcel(year);
    btn.textContent = orig;
    btn.disabled = false;
  };

  document.getElementById('print-monthly-ledger-pdf-btn').onclick = async () => {
    const year = Number(document.getElementById('monthly-ledger-year').value);
    const btn = document.getElementById('print-monthly-ledger-pdf-btn');
    const orig = btn.textContent;
    btn.textContent = 'Preparing…';
    btn.disabled = true;
    await window.api.reports.printMonthlyLedgerPdf(year);
    btn.textContent = orig;
    btn.disabled = false;
  };
  // ─── End Monthly Ledger ──────────────────────────────────────────────────


  document.getElementById('backup-create-btn').onclick = async () => {
    const btn = document.getElementById('backup-create-btn');
    const original = btn.textContent;
    btn.textContent = 'Saving…';
    btn.disabled = true;
    const result = await window.api.backup.create();
    btn.textContent = result.success ? 'Backup Saved' : original;
    btn.disabled = false;
    if (result.success) setTimeout(() => { btn.textContent = original; }, 2000);
  };

  document.getElementById('backup-restore-btn').onclick = () => {
    openConfirm(
      'Restoring will replace all current data with the selected backup and restart the app. Continue?',
      async () => { await window.api.backup.restore(); },
      'Restore & Restart'
    );
  };
}

async function renderAuditLogTable(documentType) {
  const container = document.getElementById('audit-log-table');
  const entries = await window.api.auditLog.list(documentType ? { documentType } : {});

  container.innerHTML = entries.length === 0
    ? `<div class="inline-note">No audit entries yet.</div>`
    : `<table class="data-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Type</th>
            <th>Number</th>
            <th>Action</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          ${entries.map((e) => `
            <tr>
              <td>${formatShortDate(e.created_at)}</td>
              <td>${escapeHtml(e.document_type)}</td>
              <td class="mono">${escapeHtml(e.document_number)}</td>
              <td>${escapeHtml(e.action)}</td>
              <td class="list-row-sub">${escapeHtml(e.details || '—')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>`;
}

// ─── Global Search ───────────────────────────────────────────────────────────

let searchDebounceTimer = null;
const searchInput = document.getElementById('global-search-input');
const searchResultsEl = document.getElementById('global-search-results');

searchInput.oninput = () => {
  clearTimeout(searchDebounceTimer);
  const query = searchInput.value;
  if (query.trim().length < 2) {
    searchResultsEl.classList.add('hidden');
    return;
  }
  searchDebounceTimer = setTimeout(async () => {
    const results = await window.api.search.global(query);
    renderSearchResults(results);
  }, 250);
};

document.addEventListener('click', (e) => {
  if (!e.target.closest('.global-search')) searchResultsEl.classList.add('hidden');
});

function renderSearchResults(results) {
  const total = results.customers.length + results.products.length + results.quotations.length;

  searchResultsEl.innerHTML = total === 0
    ? `<div class="search-empty">No matches found.</div>`
    : `
      ${results.customers.length ? `
        <div class="search-group-label">Customers</div>
        ${results.customers.map((c) => `
          <div class="search-result-item" data-type="customer" data-id="${c.id}">
            <div class="search-result-title">${escapeHtml(c.company_name || c.contact_name)}</div>
            <div class="search-result-sub">${escapeHtml(c.contact_name)}${c.phone ? ' &middot; ' + escapeHtml(c.phone) : ''}</div>
          </div>
        `).join('')}` : ''
      }
      ${results.products.length ? `
        <div class="search-group-label">Products</div>
        ${results.products.map((p) => `
          <div class="search-result-item" data-type="product" data-id="${p.id}">
            <div class="search-result-title">${escapeHtml(p.name)}</div>
            <div class="search-result-sub">${p.sku ? 'SKU: ' + escapeHtml(p.sku) : ''}</div>
          </div>
        `).join('')}` : ''
      }
      ${results.quotations.length ? `
        <div class="search-group-label">Quotations</div>
        ${results.quotations.map((q) => `
          <div class="search-result-item" data-type="quotation" data-id="${q.id}">
            <div class="search-result-title">${escapeHtml(q.quote_number)}</div>
            <div class="search-result-sub">${escapeHtml(q.company_name || q.contact_name)} &middot; ₹${Number(q.total).toFixed(2)}</div>
          </div>
        `).join('')}` : ''
      }
    `;

  searchResultsEl.classList.remove('hidden');
  searchResultsEl.querySelectorAll('.search-result-item').forEach((el) => {
    el.onclick = () => openSearchResult(el.dataset.type, Number(el.dataset.id));
  });
}

async function openSearchResult(type, id) {
  searchResultsEl.classList.add('hidden');
  searchInput.value = '';

  if (type === 'customer') {
    navItems.forEach((b) => b.classList.toggle('active', b.dataset.view === 'customers'));
    viewTitle.textContent = 'Customers';
    await renderCustomers();
    const customers = await window.api.customers.list();
    const c = customers.find((x) => x.id === id);
    if (c) openCustomerForm(c);
  } else if (type === 'product') {
    navItems.forEach((b) => b.classList.toggle('active', b.dataset.view === 'products'));
    viewTitle.textContent = 'Products';
    await renderProducts();
    const products = await window.api.products.list();
    const p = products.find((x) => x.id === id);
    if (p) openProductForm(p);
  } else if (type === 'quotation') {
    navItems.forEach((b) => b.classList.toggle('active', b.dataset.view === 'quotes'));
    viewTitle.textContent = 'Quotes';
    renderQuoteBuilder(id);
  }
}

function openDocumentLayoutModal(L = {}) {
  openModal(`
    <div class="modal-header">
      <h2>Document Layout Defaults & PDF Formatting</h2>
      <button class="modal-close">&times;</button>
    </div>
    <div class="modal-body">
      <p style="font-size:13px;color:var(--muted);margin-bottom:14px;">
        These layout settings apply to all generated PDFs (Quotations, Invoices, Delivery Challans, Credit/Debit Notes).
      </p>
      <div class="form-row">
        <div class="form-group"><label>Margin Top (mm)</label><input id="l-marginTop" type="number" value="${L.marginTop ?? 18}"></div>
        <div class="form-group"><label>Margin Right (mm)</label><input id="l-marginRight" type="number" value="${L.marginRight ?? 16}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Margin Bottom (mm)</label><input id="l-marginBottom" type="number" value="${L.marginBottom ?? 18}"></div>
        <div class="form-group"><label>Margin Left (mm)</label><input id="l-marginLeft" type="number" value="${L.marginLeft ?? 16}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Accent Color</label><div class="color-swatch-row"><input type="color" id="l-accentColor" value="${L.accentColor || '#004ac6'}"></div></div>
        <div class="form-group"><label>Base Font Size (px)</label><input id="l-fontSize" type="number" value="${L.fontSize ?? 12}"></div>
      </div>
      <div class="form-group">
        <label>Font Family</label>
        <input id="l-fontFamily" value="${escapeAttr(L.fontFamily || "'Segoe UI', Arial, sans-serif")}">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Table Spacing</label>
          <select id="l-tableSpacing">
            <option value="compact" ${L.tableSpacing === 'compact' ? 'selected' : ''}>Compact</option>
            <option value="normal" ${(L.tableSpacing || 'normal') === 'normal' ? 'selected' : ''}>Normal</option>
            <option value="spacious" ${L.tableSpacing === 'spacious' ? 'selected' : ''}>Spacious</option>
          </select>
        </div>
        <div class="form-group">
          <label>Header Alignment</label>
          <select id="l-headerAlign">
            <option value="split" ${(L.headerAlign || 'split') === 'split' ? 'selected' : ''}>Split</option>
            <option value="center" ${L.headerAlign === 'center' ? 'selected' : ''}>Center</option>
            <option value="right" ${L.headerAlign === 'right' ? 'selected' : ''}>Right</option>
          </select>
        </div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn modal-cancel">Cancel</button>
      <button class="btn btn-primary" id="save-layout-btn">Save Layout Defaults</button>
    </div>
  `);

  document.getElementById('save-layout-btn').onclick = async () => {
    await window.api.layout.save({
      marginTop: Number(document.getElementById('l-marginTop').value),
      marginRight: Number(document.getElementById('l-marginRight').value),
      marginBottom: Number(document.getElementById('l-marginBottom').value),
      marginLeft: Number(document.getElementById('l-marginLeft').value),
      accentColor: document.getElementById('l-accentColor').value,
      fontSize: Number(document.getElementById('l-fontSize').value),
      fontFamily: document.getElementById('l-fontFamily').value.trim(),
      tableSpacing: document.getElementById('l-tableSpacing').value,
      headerAlign: document.getElementById('l-headerAlign').value
    });
    closeModal();
    renderSettings();
  };
}

// ─── Settings ────────────────────────────────────────────────────────────────

async function renderSettings() {
  const [company, settings, layout, customerCats, productCats, priceLists, templates, letterheads] = await Promise.all([
    window.api.company.get(),
    window.api.settings.get(),
    window.api.layout.get(),
    window.api.customerCategories.list(),
    window.api.productCategories.list(),
    window.api.priceLists.list(),
    window.api.templates.list(),
    window.api.letterheads.list()
  ]);

  const L = layout || {};

  viewRoot.innerHTML = `
    <div class="card" style="margin-bottom:16px;">
      <h3>Company Profile</h3>
      <div class="form-row">
        <div class="form-group"><label>Company Name *</label><input id="s-name" value="${escapeAttr(company.name || '')}"></div>
        <div class="form-group"><label>GST Number</label><input id="s-gst" value="${escapeAttr(company.gst_number || '')}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>State *</label><input id="s-state" value="${escapeAttr(company.state || '')}" placeholder="e.g. Madhya Pradesh"></div>
        <div class="form-group"><label>Phone</label><input id="s-phone" value="${escapeAttr(company.phone || '')}"></div>
      </div>
      <div class="form-group"><label>Email</label><input id="s-email" value="${escapeAttr(company.email || '')}"></div>
      <div class="form-group"><label>Address</label><textarea id="s-address" rows="2">${escapeHtml(company.address || '')}</textarea></div>
      <div class="form-group"><label>Bank Details</label><textarea id="s-bank" rows="2" placeholder="Account name, number, IFSC, bank name">${escapeHtml(company.bank_details || '')}</textarea></div>
      <div class="form-group">
        <label>Highlight Color</label>
        <div class="color-swatch-row">
          <input type="color" id="s-theme-color" value="${escapeAttr(company.theme_color || '#004ac6')}">
          <span class="settings-note" style="margin:0;">Used throughout the app while this company is active.</span>
        </div>
      </div>
      <div class="settings-note">Your state determines whether quotations use CGST+SGST or IGST — make sure this is correct before creating real quotes.</div>
      <div class="settings-actions">
        <button class="btn btn-primary" id="save-company-btn">Save Company Profile</button>
        <span class="save-status" id="company-save-status"></span>
      </div>
    </div>

    <div class="card" style="margin-bottom:16px;">
      <h3>Payment QR Code (UPI / Bank QR)</h3>
      <div class="settings-note">Upload your UPI or bank payment QR code. It will be automatically printed on every invoice. The image persists until you replace or remove it.</div>
      <div class="form-row" style="align-items:flex-start;gap:20px;flex-wrap:wrap;margin-top:12px;">
        <div style="flex:1;min-width:200px;">
          <div class="form-group">
            <label>UPI ID <span style="font-weight:400;color:#888;">(optional — auto-generates QR if no image uploaded)</span></label>
            <input id="s-upi-id" value="${escapeAttr(company.upi_id || '')}" placeholder="e.g. businessname@upi">
          </div>
          <div class="form-group" style="margin-top:8px;">
            <label>Upload QR Code Image</label>
            <input type="file" id="s-qr-upload" accept="image/*" style="margin-top:4px;">
          </div>
          <div class="settings-actions" style="margin-top:8px;">
            <button class="btn btn-primary" id="save-qr-btn">Save QR Settings</button>
            <button class="btn" id="remove-qr-btn" style="${company.upi_qr_image ? '' : 'display:none;'}">Remove QR Image</button>
            <span class="save-status" id="qr-save-status"></span>
          </div>
        </div>
        <div id="qr-preview-wrap" style="flex-shrink:0;">
          ${company.upi_qr_image ? `<div style="text-align:center;"><img id="qr-preview-img" src="${company.upi_qr_image}" alt="QR Code" style="width:120px;height:120px;object-fit:contain;border:1px solid #ddd;border-radius:8px;padding:6px;background:#fff;"><div style="font-size:11px;color:#888;margin-top:4px;">Current QR</div></div>` : `<div id="qr-preview-empty" style="width:120px;height:120px;display:flex;align-items:center;justify-content:center;border:1px dashed #ccc;border-radius:8px;color:#aaa;font-size:12px;text-align:center;">No QR<br>uploaded</div>`}
        </div>
      </div>
    </div>

    <div class="card" style="margin-bottom:16px;">
      <h3>Quotation Defaults</h3>
      <div class="form-row">
        <div class="form-group"><label>Numbering Prefix</label><input id="s-prefix" value="${escapeAttr(settings.numbering_prefix || 'QF')}"></div>
        <div class="form-group"><label>Default GST Rate for New Products (%)</label><input id="s-default-gst" type="number" step="0.01" value="${settings.default_gst_rate || 18}"></div>
      </div>
      <div class="settings-note">New quotations use the format PREFIX/FinancialYear/Number, e.g. ${escapeHtml(settings.numbering_prefix || 'QF')}/2026-27/001. Changing the prefix only affects quotes created after the change.</div>
      <div class="settings-actions">
        <button class="btn btn-primary" id="save-defaults-btn">Save Defaults</button>
        <span class="save-status" id="defaults-save-status"></span>
      </div>
    </div>

    <div class="dash-grid">
      <div class="card">
        <h3>Customer Categories</h3>
        <div class="tag-list" id="customer-cat-list">
          ${customerCats.map((c) => `
            <span class="tag">${escapeHtml(c.name)}<button class="tag-remove" data-type="customer" data-id="${c.id}">&times;</button></span>
          `).join('') || '<div class="inline-note">None yet.</div>'}
        </div>
        <div class="tag-add-row">
          <input id="new-customer-cat" placeholder="New category name">
          <button class="btn" id="add-customer-cat-btn">Add</button>
        </div>
      </div>

      <div class="card">
        <h3>Product Categories</h3>
        <div class="tag-list" id="product-cat-list">
          ${productCats.map((c) => `
            <span class="tag">${escapeHtml(c.name)}<button class="tag-remove" data-type="product" data-id="${c.id}">&times;</button></span>
          `).join('') || '<div class="inline-note">None yet.</div>'}
        </div>
        <div class="tag-add-row">
          <input id="new-product-cat" placeholder="New category name">
          <button class="btn" id="add-product-cat-btn">Add</button>
        </div>
      </div>
    </div>

    <div class="card" style="margin-top:16px;">
      <h3>Price Lists</h3>
      ${priceLists.length === 0
        ? `<div class="inline-note">No price lists yet.</div>`
        : priceLists.map((pl) => `
            <div class="list-row">
              <div class="list-row-title">${escapeHtml(pl.name)}</div>
              <div class="row-actions">
                <button class="manage-pricing-btn" data-id="${pl.id}" data-name="${escapeAttr(pl.name)}">Manage Pricing</button>
                <button class="danger delete-price-list" data-id="${pl.id}">Delete</button>
              </div>
            </div>
          `).join('')
      }
      <div class="tag-add-row" style="margin-top:12px;">
        <input id="new-price-list" placeholder="New price list name">
        <button class="btn" id="add-price-list-btn">Add</button>
      </div>
    </div>

    <div class="dash-grid" style="margin-top:16px;">
      <div class="card">
        <h3>Quote Templates & Document Layouts</h3>
        ${templates.length === 0
          ? `<div class="inline-note">No custom templates — using default layout.</div>`
          : templates.map((t) => `
              <div class="list-row">
                <div class="list-row-title">${escapeHtml(t.name)}</div>
                <div class="row-actions">
                  <button class="edit-template-btn" data-id="${t.id}">Edit</button>
                  <button class="danger delete-template-btn" data-id="${t.id}">Delete</button>
                </div>
              </div>
            `).join('')
        }
        <div class="settings-actions" style="margin-top:12px; gap:8px;">
          <button class="btn" id="new-template-btn">+ New Template</button>
          <button class="btn btn-primary" id="open-layout-studio-btn">⚙ Layout Defaults</button>
        </div>
      </div>

      <div class="card">
        <h3>Letterheads</h3>
        ${letterheads.length === 0
          ? `<div class="inline-note">No letterheads uploaded yet.</div>`
          : letterheads.map((l) => `
              <div class="list-row">
                <div class="list-row-title">${escapeHtml(l.name)}</div>
                <div class="row-actions">
                  <button class="danger delete-letterhead-btn" data-id="${l.id}">Delete</button>
                </div>
              </div>
            `).join('')
        }
        <div class="settings-actions" style="margin-top:12px;">
          <button class="btn" id="upload-letterhead-btn">+ Upload Letterhead</button>
        </div>
      </div>
    </div>

    <div class="card" style="margin-top:16px;">
      <h3>⌨ Keyboard Shortcuts</h3>
      <div class="settings-note" style="margin-bottom:12px;">These shortcuts work anywhere in the app when you are not typing in a text field. Use a mouse or touchscreen normally — keyboard mode activates automatically when you press a key.</div>
      <table class="shortcut-table">
        <thead>
          <tr>
            <th>Key(s)</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr><td><kbd class="kbd">W</kbd> or <kbd class="kbd">↑</kbd></td><td>Navigate to previous section</td></tr>
          <tr><td><kbd class="kbd">S</kbd> or <kbd class="kbd">↓</kbd></td><td>Navigate to next section</td></tr>
          <tr><td><kbd class="kbd">1</kbd> – <kbd class="kbd">9</kbd></td><td>Jump directly to a section (1=Dashboard, 2=Quotes, 3=Invoices, 4=Challans, 5=Notes, 6=Customers, 7=Products, 8=Reports, 9=Settings)</td></tr>
          <tr><td><kbd class="kbd">M</kbd></td><td>Toggle sidebar open / closed</td></tr>
          <tr><td><kbd class="kbd">Ctrl</kbd>+<kbd class="kbd">K</kbd></td><td>Focus global search bar</td></tr>
          <tr><td><kbd class="kbd">Esc</kbd></td><td>Close open modal or sidebar</td></tr>
          <tr><td><kbd class="kbd">Tab</kbd> / <kbd class="kbd">Shift</kbd>+<kbd class="kbd">Tab</kbd></td><td>Move focus between interactive elements</td></tr>
          <tr><td><kbd class="kbd">Enter</kbd></td><td>Activate the focused button or nav item</td></tr>
      </table>
    </div>

    <div class="card" style="margin-top:16px;">
      <h3>🛡️ Data Security & Anti-Wipe Protection</h3>
      <div class="settings-note" style="margin-bottom:12px;">
        To prevent Android/iOS from wiping your data when deleting other PWAs or clearing browser cache, QuoteFlow uses <strong>Persistent Storage Locks</strong> and 1-Click Offline Backups.
      </div>
      <div style="background:var(--bg);padding:12px 14px;border-radius:8px;border:1px solid var(--border);margin-bottom:14px;display:flex;align-items:center;justify-content:space-between;gap:12px;">
        <div>
          <div style="font-weight:600;font-size:13px;" id="storage-status-title">Checking OS Protection Status…</div>
          <div style="font-size:11.5px;color:var(--muted);margin-top:2px;" id="storage-status-desc">Persistent Storage prevents your phone from automatically deleting database records.</div>
        </div>
        <button class="btn" id="req-persist-btn" style="flex-shrink:0;">Protect Storage</button>
      </div>
      <div class="settings-actions" style="gap:10px;">
        <button class="btn btn-primary" id="settings-export-backup-btn">⬇ Export Backup File (.qfbackup)</button>
        <button class="btn" id="settings-import-backup-btn">⬆ Restore Backup File</button>
      </div>
    </div>

    <div class="card danger-zone" style="margin-top:16px;">
      <h3>Danger Zone</h3>
      <div class="settings-note">This permanently deletes every company, customer, product, quotation, invoice, delivery challan, credit/debit note, template, and letterhead. There is no undo — a factory reset cannot be recovered except from a backup you made beforehand.</div>
      <div class="settings-actions" style="margin-bottom:12px;">
        <button class="btn" id="pre-reset-backup-btn">Backup Now First</button>
      </div>
      <div class="form-group">
        <label>Type <strong>DELETE EVERYTHING</strong> to enable the reset button</label>
        <input id="factory-reset-confirm-input" placeholder="Type here" autocomplete="off">
      </div>
      <div class="settings-actions">
        <button class="btn danger-btn" id="factory-reset-btn" disabled>Factory Reset — Erase All Data</button>
      </div>
    </div>
  `;

  // Storage persistence status check
  const checkStorageProtection = async () => {
    const titleEl = document.getElementById('storage-status-title');
    const descEl = document.getElementById('storage-status-desc');
    const reqBtn = document.getElementById('req-persist-btn');

    if (!navigator.storage || !navigator.storage.persist) {
      if (titleEl) titleEl.textContent = 'Storage API Not Supported';
      if (descEl) descEl.textContent = 'Use 1-Click Backups to save copy to your device.';
      if (reqBtn) reqBtn.style.display = 'none';
      return;
    }

    const isPersisted = await navigator.storage.persisted();
    if (isPersisted) {
      if (titleEl) titleEl.innerHTML = '<span style="color:#146c3a;">✓ Protected: Storage Lock Active</span>';
      if (descEl) descEl.textContent = 'Android & Chrome will NEVER clear this app\'s database during OS low-memory cleanup.';
      if (reqBtn) {
        reqBtn.textContent = 'Protected';
        reqBtn.disabled = true;
        reqBtn.style.background = '#e6f4ea';
        reqBtn.style.color = '#137333';
        reqBtn.style.borderColor = '#ceead6';
      }
    } else {
      if (titleEl) titleEl.textContent = 'Storage Status: Best Effort (Unprotected)';
      if (descEl) descEl.textContent = 'Tap Protect Storage to request persistent lock from Android/Chrome.';
      if (reqBtn) {
        reqBtn.onclick = async () => {
          reqBtn.disabled = true;
          reqBtn.textContent = 'Requesting…';
          const granted = await navigator.storage.persist();
          await checkStorageProtection();
        };
      }
    }
  };
  checkStorageProtection();

  // Export / Import Backup handlers in Settings
  const exportBackupBtn = document.getElementById('settings-export-backup-btn');
  if (exportBackupBtn) {
    exportBackupBtn.onclick = async () => {
      exportBackupBtn.disabled = true;
      exportBackupBtn.textContent = 'Generating Backup…';
      const result = await window.api.backup.create();
      exportBackupBtn.textContent = result.success ? 'Backup Downloaded!' : 'Export Failed';
      setTimeout(() => {
        exportBackupBtn.disabled = false;
        exportBackupBtn.textContent = '⬇ Export Backup File (.qfbackup)';
      }, 2500);
    };
  }

  const importBackupBtn = document.getElementById('settings-import-backup-btn');
  if (importBackupBtn) {
    importBackupBtn.onclick = () => {
      openConfirm(
        'Restoring from a backup will replace your current data with the contents of the backup file. Proceed?',
        async () => {
          await window.api.backup.restore();
          renderSettings();
        },
        'Restore Backup'
      );
    };
  }

  document.getElementById('pre-reset-backup-btn').onclick = async () => {
    const btn = document.getElementById('pre-reset-backup-btn');
    const original = btn.textContent;
    btn.textContent = 'Saving…';
    btn.disabled = true;
    const result = await window.api.backup.create();
    btn.textContent = result.success ? 'Backup Saved' : original;
    btn.disabled = false;
    if (result.success) setTimeout(() => { btn.textContent = original; }, 2000);
  };

  const resetInput = document.getElementById('factory-reset-confirm-input');
  const resetBtn = document.getElementById('factory-reset-btn');
  resetInput.oninput = () => {
    resetBtn.disabled = resetInput.value !== 'DELETE EVERYTHING';
  };

  resetBtn.onclick = () => {
    openConfirm(
      'This is the final confirmation. Every company, customer, product, quotation, invoice, challan, and note will be permanently erased and the app will restart empty. This cannot be undone.',
      async () => {
        await window.api.app.factoryReset();
      },
      'Erase Everything'
    );
  };

  document.getElementById('save-company-btn').onclick = async () => {
    const status = document.getElementById('company-save-status');
    const data = {
      name: document.getElementById('s-name').value.trim(),
      gst_number: document.getElementById('s-gst').value.trim(),
      state: document.getElementById('s-state').value.trim(),
      phone: document.getElementById('s-phone').value.trim(),
      email: document.getElementById('s-email').value.trim(),
      address: document.getElementById('s-address').value.trim(),
      bank_details: document.getElementById('s-bank').value.trim(),
      theme_color: document.getElementById('s-theme-color').value
    };
    if (!data.name || !data.state) {
      status.textContent = 'Name and State are required.';
      status.className = 'save-status error';
      return;
    }
    await window.api.company.update(data);
    applyTheme(data.theme_color);
    refreshCompanySwitcherLabel();
    status.textContent = 'Saved';
    status.className = 'save-status success';
    setTimeout(() => { status.textContent = ''; }, 2000);
  };

  // ─── QR Code handlers ─────────────────────────────────────────────────────
  const qrUploadInput = document.getElementById('s-qr-upload');
  const qrPreviewWrap = document.getElementById('qr-preview-wrap');
  let pendingQrDataUrl = null;

  if (qrUploadInput) {
    qrUploadInput.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        pendingQrDataUrl = ev.target.result;
        qrPreviewWrap.innerHTML = `<div style="text-align:center;"><img id="qr-preview-img" src="${pendingQrDataUrl}" alt="QR Code" style="width:120px;height:120px;object-fit:contain;border:1px solid #ddd;border-radius:8px;padding:6px;background:#fff;"><div style="font-size:11px;color:#888;margin-top:4px;">Preview (unsaved)</div></div>`;
        const removeQrBtn = document.getElementById('remove-qr-btn');
        if (removeQrBtn) removeQrBtn.style.display = '';
      };
      reader.readAsDataURL(file);
    };
  }

  document.getElementById('save-qr-btn').onclick = async () => {
    const qrStatus = document.getElementById('qr-save-status');
    const upiId = document.getElementById('s-upi-id').value.trim();
    // Save UPI ID via company update
    await window.api.company.update({
      ...(await window.api.company.get()),
      upi_id: upiId || null
    });
    // Save QR image if a new one was selected
    if (pendingQrDataUrl !== null) {
      await window.api.company.updateQr(pendingQrDataUrl);
      pendingQrDataUrl = null;
    }
    qrStatus.textContent = 'Saved';
    qrStatus.className = 'save-status success';
    setTimeout(() => { qrStatus.textContent = ''; }, 2000);
  };

  document.getElementById('remove-qr-btn').onclick = async () => {
    await window.api.company.updateQr(null);
    pendingQrDataUrl = null;
    qrPreviewWrap.innerHTML = `<div id="qr-preview-empty" style="width:120px;height:120px;display:flex;align-items:center;justify-content:center;border:1px dashed #ccc;border-radius:8px;color:#aaa;font-size:12px;text-align:center;">No QR<br>uploaded</div>`;
    document.getElementById('remove-qr-btn').style.display = 'none';
    const qrStatus = document.getElementById('qr-save-status');
    qrStatus.textContent = 'QR Removed';
    qrStatus.className = 'save-status success';
    setTimeout(() => { qrStatus.textContent = ''; }, 2000);
  };
  // ─── End QR handlers ──────────────────────────────────────────────────────

  document.getElementById('save-defaults-btn').onclick = async () => {
    await window.api.settings.update({
      numbering_prefix: document.getElementById('s-prefix').value.trim() || 'QF',
      default_gst_rate: document.getElementById('s-default-gst').value || 18
    });
    const status = document.getElementById('defaults-save-status');
    status.textContent = 'Saved';
    status.className = 'save-status success';
    setTimeout(() => { status.textContent = ''; }, 2000);
  };

  const openLayoutBtn = document.getElementById('open-layout-studio-btn');
  if (openLayoutBtn) {
    openLayoutBtn.onclick = () => openDocumentLayoutModal(L);
  }


  document.getElementById('add-customer-cat-btn').onclick = async () => {
    const input = document.getElementById('new-customer-cat');
    if (!input.value.trim()) return;
    await window.api.customerCategories.create(input.value.trim());
    renderSettings();
  };

  document.getElementById('add-product-cat-btn').onclick = async () => {
    const input = document.getElementById('new-product-cat');
    if (!input.value.trim()) return;
    await window.api.productCategories.create(input.value.trim());
    renderSettings();
  };

  document.getElementById('add-price-list-btn').onclick = async () => {
    const input = document.getElementById('new-price-list');
    if (!input.value.trim()) return;
    await window.api.priceLists.create(input.value.trim());
    renderSettings();
  };

  document.querySelectorAll('.tag-remove').forEach((btn) => {
    btn.onclick = async () => {
      const api = btn.dataset.type === 'customer' ? window.api.customerCategories : window.api.productCategories;
      const result = await api.delete(Number(btn.dataset.id));
      if (result.success) renderSettings();
      else openInfo(result.reason);
    };
  });

  document.querySelectorAll('.delete-price-list').forEach((btn) => {
    btn.onclick = () => {
      openConfirm('Delete this price list? This cannot be undone.', async () => {
        const result = await window.api.priceLists.delete(Number(btn.dataset.id));
        if (result.success) renderSettings();
        else openInfo(result.reason);
      });
    };
  });

  document.querySelectorAll('.manage-pricing-btn').forEach((btn) => {
    btn.onclick = () => openPriceListPricingModal(Number(btn.dataset.id), btn.dataset.name);
  });

  document.getElementById('new-template-btn').onclick = () => openTemplateEditor();

  document.querySelectorAll('.edit-template-btn').forEach((btn) => {
    btn.onclick = () => {
      const t = templates.find((x) => x.id === Number(btn.dataset.id));
      openTemplateEditor(t);
    };
  });

  document.querySelectorAll('.delete-template-btn').forEach((btn) => {
    btn.onclick = () => {
      openConfirm('Delete this template? This cannot be undone.', async () => {
        const result = await window.api.templates.delete(Number(btn.dataset.id));
        if (result.success) renderSettings();
        else openInfo(result.reason);
      });
    };
  });

  document.getElementById('upload-letterhead-btn').onclick = async () => {
    const btn = document.getElementById('upload-letterhead-btn');
    const original = btn.textContent;
    btn.textContent = 'Uploading…';
    btn.disabled = true;
    const result = await window.api.letterheads.upload();
    btn.textContent = original;
    btn.disabled = false;
    if (result.success) renderSettings();
  };

  document.querySelectorAll('.delete-letterhead-btn').forEach((btn) => {
    btn.onclick = () => {
      openConfirm('Delete this letterhead? This cannot be undone.', async () => {
        const result = await window.api.letterheads.delete(Number(btn.dataset.id));
        if (result.success) renderSettings();
        else openInfo(result.reason);
      });
    };
  });
}

async function openPriceListPricingModal(priceListId, priceListName) {
  const products = await window.api.priceListItems.getForList(priceListId);

  openModal(`
    <div class="modal-header">
      <h2>Pricing — ${escapeHtml(priceListName)}</h2>
      <button class="modal-close">&times;</button>
    </div>
    <div class="modal-body">
      ${products.length === 0
        ? `<div class="inline-note">No products yet — add products first.</div>`
        : `<table class="data-table">
            <thead>
              <tr><th>Product</th><th class="num">Base Price</th><th class="num">Override Price</th></tr>
            </thead>
            <tbody>
              ${products.map((p) => `
                <tr>
                  <td>${escapeHtml(p.name)}${p.sku ? `<div class="hsn-note">SKU: ${escapeHtml(p.sku)}</div>` : ''}</td>
                  <td class="num mono">₹${Number(p.base_price).toFixed(2)}</td>
                  <td class="num">
                    <input type="number" step="0.01" min="0" data-product-id="${p.id}" class="override-price-input"
                      value="${p.override_price != null ? p.override_price : ''}" placeholder="Use base price">
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="inline-note">Leave blank to use the base price for this product.</div>`
      }
    </div>
    <div class="modal-footer">
      <button class="btn modal-cancel">Cancel</button>
      <button class="btn btn-primary" id="save-pricing-btn">Save Pricing</button>
    </div>
  `);

  const saveBtn = document.getElementById('save-pricing-btn');
  if (saveBtn) {
    saveBtn.onclick = async () => {
      const items = Array.from(document.querySelectorAll('.override-price-input')).map((input) => ({
        product_id: Number(input.dataset.productId),
        price: input.value.trim() === '' ? null : input.value
      }));
      await window.api.priceListItems.save(priceListId, items);
      closeModal();
    };
  }
}

// ─── Template Editor ─────────────────────────────────────────────────────────

const BLOCK_LABELS = {
  header: 'Company Header',
  customer: 'Customer Details',
  items: 'Line Items',
  totals: 'Totals & GST',
  payments: 'Payment History (Invoices only)',
  payment_terms: 'Payment Terms',
  notes: 'Notes',
  bank: 'Bank Details',
  signature: 'Signature',
  footer: 'Footer'
};

const DEFAULT_TEMPLATE_BLOCKS = [
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

let templateEditorBlocks = [];
let templateEditorId = null;

function openTemplateEditor(template) {
  templateEditorId = template ? template.id : null;
  templateEditorBlocks = template ? [...template.blocks] : DEFAULT_TEMPLATE_BLOCKS.map((b) => ({ ...b }));

  openModal(`
    <div class="modal-header">
      <h2>${template ? 'Edit Template' : 'New Template'}</h2>
      <button class="modal-close">&times;</button>
    </div>
    <div class="modal-body">
      <div class="form-group">
        <label>Template Name *</label>
        <input id="t-name" value="${escapeAttr(template?.name || '')}" placeholder="e.g. Standard Quote">
      </div>
      <div class="form-group">
        <label>Sections (toggle and reorder)</label>
        <div id="template-blocks-list" class="template-blocks-list"></div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn modal-cancel">Cancel</button>
      <button class="btn btn-primary" id="save-template-btn">${template ? 'Save Changes' : 'Create Template'}</button>
    </div>
  `);

  renderTemplateBlocksList();

  document.getElementById('save-template-btn').onclick = async () => {
    const name = document.getElementById('t-name').value.trim();
    if (!name) {
      showFormError('Template name is required.');
      return;
    }
    if (templateEditorId) {
      await window.api.templates.update(templateEditorId, { name, blocks: templateEditorBlocks });
    } else {
      await window.api.templates.create({ name, blocks: templateEditorBlocks });
    }
    closeModal();
    renderSettings();
  };
}

function renderTemplateBlocksList() {
  const list = document.getElementById('template-blocks-list');
  list.innerHTML = templateEditorBlocks.map((b, i) => `
    <div class="template-block-row">
      <label class="template-block-check">
        <input type="checkbox" data-idx="${i}" class="block-enabled-check" ${b.enabled ? 'checked' : ''}>
        ${escapeHtml(BLOCK_LABELS[b.type] || b.type)}
      </label>
      <div class="template-block-move">
        <button class="move-up" data-idx="${i}" ${i === 0 ? 'disabled' : ''}>&uarr;</button>
        <button class="move-down" data-idx="${i}" ${i === templateEditorBlocks.length - 1 ? 'disabled' : ''}>&darr;</button>
      </div>
    </div>
    ${b.type === 'header' ? `
      <div class="template-block-subrow">
        <label class="template-block-subcheck">
          <input type="checkbox" data-idx="${i}" class="header-sub-check" data-field="showCompanyName" ${b.showCompanyName !== false ? 'checked' : ''}>
          Show company name
        </label>
        <label class="template-block-subcheck">
          <input type="checkbox" data-idx="${i}" class="header-sub-check" data-field="showCompanyContact" ${b.showCompanyContact !== false ? 'checked' : ''}>
          Show address/phone/GSTIN
        </label>
        <div class="settings-note" style="margin:4px 0 0;">Turn these off if your letterhead image already shows your branding — the quote number and dates stay either way.</div>
      </div>
    ` : ''}
  `).join('');

  list.querySelectorAll('.block-enabled-check').forEach((cb) => {
    cb.onchange = () => {
      templateEditorBlocks[Number(cb.dataset.idx)].enabled = cb.checked;
    };
  });

  list.querySelectorAll('.header-sub-check').forEach((cb) => {
    cb.onchange = () => {
      templateEditorBlocks[Number(cb.dataset.idx)][cb.dataset.field] = cb.checked;
    };
  });

  list.querySelectorAll('.move-up').forEach((btn) => {
    btn.onclick = () => {
      const i = Number(btn.dataset.idx);
      if (i === 0) return;
      [templateEditorBlocks[i - 1], templateEditorBlocks[i]] = [templateEditorBlocks[i], templateEditorBlocks[i - 1]];
      renderTemplateBlocksList();
    };
  });

  list.querySelectorAll('.move-down').forEach((btn) => {
    btn.onclick = () => {
      const i = Number(btn.dataset.idx);
      if (i === templateEditorBlocks.length - 1) return;
      [templateEditorBlocks[i + 1], templateEditorBlocks[i]] = [templateEditorBlocks[i], templateEditorBlocks[i + 1]];
      renderTemplateBlocksList();
    };
  });
}

// ─── Quote Builder ───────────────────────────────────────────────────────────

let builderState = null; // { company, customers, allCustomers, items, customerProducts, editingId }

async function renderQuoteBuilder(quoteId) {
  const [company, customers, templates, letterheads] = await Promise.all([
    window.api.company.get(),
    window.api.customers.list(),
    window.api.templates.list(),
    window.api.letterheads.list()
  ]);

  let existing = null;
  if (quoteId) existing = await window.api.quotations.get(quoteId);

  builderState = {
    company,
    customers,
    editingId: quoteId || null,
    customerProducts: [],
    items: existing
      ? existing.items.map((it) => ({ ...it }))
      : [{ product_id: null, description: '', hsn_code: '', qty: 1, unit_price: 0, gst_rate: 18 }]
  };

  if (existing) {
    builderState.customerProducts = await window.api.quotations.productsForCustomer(existing.customer_id);
  }

  viewRoot.innerHTML = `
    <button class="link-back" id="back-to-quotes">&larr; Back to Quotes</button>
    <div class="builder">
      <div class="builder-main">
        <div class="card">
          <div class="form-row">
            <div class="form-group">
              <label>Customer *</label>
              <select id="b-customer">
                <option value="">Select a customer&hellip;</option>
                ${customers.map((c) => `
                  <option value="${c.id}" ${existing?.customer_id === c.id ? 'selected' : ''}>
                    ${escapeHtml(c.company_name || c.contact_name)} &middot; ${escapeHtml(c.contact_name)}
                  </option>
                `).join('')}
              </select>
            </div>
            <div class="form-group">
              <label>Valid Until</label>
              <input type="date" id="b-valid-until" value="${existing?.valid_until || ''}">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Template</label>
              <select id="b-template">
                <option value="">Default Layout</option>
                ${templates.map((t) => `
                  <option value="${t.id}" ${existing?.template_id === t.id ? 'selected' : ''}>${escapeHtml(t.name)}</option>
                `).join('')}
              </select>
            </div>
            <div class="form-group">
              <label>Letterhead</label>
              <select id="b-letterhead">
                <option value="">None</option>
                ${letterheads.map((l) => `
                  <option value="${l.id}" ${existing?.letterhead_id === l.id ? 'selected' : ''}>${escapeHtml(l.name)}</option>
                `).join('')}
              </select>
            </div>
          </div>
          <div class="form-group">
            <label>Payment Terms</label>
            <input id="b-payment-terms" value="${escapeAttr(existing?.payment_terms || '')}" placeholder="e.g. Net 30">
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h3>Line Items</h3>
            <button class="link-add" id="add-line-btn">+ Add Item</button>
          </div>
          <table class="data-table line-items-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Description</th>
                <th class="num">Qty</th>
                <th class="num">Unit Price</th>
                <th class="num">GST %</th>
                <th class="num">Line Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody id="line-items-body"></tbody>
          </table>
          <div id="no-customer-note" class="inline-note hidden">Select a customer to enable product pricing lookup.</div>
        </div>

        <div class="card">
          <div class="form-group">
            <label>Notes / Terms</label>
            <textarea id="b-notes" rows="3">${escapeHtml(existing?.notes || '')}</textarea>
          </div>
        </div>
      </div>

      <div class="builder-side">
        <div class="card">
          <h3>Summary</h3>
          <div class="form-group">
            <label>Discount (₹)</label>
            <input type="number" id="b-discount" min="0" step="0.01" value="${existing?.discount ?? 0}">
          </div>
          <div class="summary-lines" id="summary-lines"></div>
        </div>
        <div class="card actions">
          <button class="btn" id="save-draft-btn">Save as Draft</button>
          <button class="btn btn-primary" id="save-ready-btn">Save &amp; Mark Ready</button>
        </div>
      </div>
    </div>
  `;

  document.getElementById('back-to-quotes').onclick = () => renderQuotesList();
  document.getElementById('b-customer').onchange = onBuilderCustomerChange;
  document.getElementById('add-line-btn').onclick = addBuilderLine;
  document.getElementById('b-discount').oninput = updateBuilderSummary;
  document.getElementById('save-draft-btn').onclick = () => saveBuilderQuote('Draft');
  document.getElementById('save-ready-btn').onclick = () => saveBuilderQuote('Ready');

  renderBuilderLines();
  updateBuilderSummary();
}

async function onBuilderCustomerChange() {
  const customerId = Number(document.getElementById('b-customer').value) || null;
  builderState.customerProducts = customerId
    ? await window.api.quotations.productsForCustomer(customerId)
    : [];

  const customer = builderState.customers.find((c) => c.id === customerId);
  if (customer?.payment_terms) {
    document.getElementById('b-payment-terms').value = customer.payment_terms;
  }

  renderBuilderLines();
  updateBuilderSummary();
}

function addBuilderLine() {
  builderState.items.push({ product_id: null, description: '', hsn_code: '', qty: 1, unit_price: 0, gst_rate: 18 });
  renderBuilderLines();
  updateBuilderSummary();
}

function removeBuilderLine(index) {
  if (builderState.items.length <= 1) return;
  builderState.items.splice(index, 1);
  renderBuilderLines();
  updateBuilderSummary();
}

function renderBuilderLines() {
  const body = document.getElementById('line-items-body');
  const products = builderState.customerProducts;
  const noCustomerNote = document.getElementById('no-customer-note');
  noCustomerNote.classList.toggle('hidden', products.length > 0 || !document.getElementById('b-customer').value);

  body.innerHTML = builderState.items.map((item, i) => `
    <tr>
      <td>
        <select data-idx="${i}" class="line-product">
          <option value="">Custom item</option>
          ${products.map((p) => `
            <option value="${p.id}" ${item.product_id === p.id ? 'selected' : ''}>${escapeHtml(p.name)}</option>
          `).join('')}
        </select>
      </td>
      <td><input data-idx="${i}" class="line-description" value="${escapeAttr(item.description)}" placeholder="Item description"></td>
      <td><input data-idx="${i}" type="number" min="0" step="1" class="line-qty num-input" value="${item.qty}"></td>
      <td><input data-idx="${i}" type="number" min="0" step="0.01" class="line-price num-input" value="${item.unit_price}"></td>
      <td><input data-idx="${i}" type="number" min="0" step="0.01" class="line-gst num-input" value="${item.gst_rate}"></td>
      <td class="num mono">₹${(Number(item.qty) * Number(item.unit_price)).toFixed(2)}</td>
      <td><button class="remove-line" data-idx="${i}">&times;</button></td>
    </tr>
  `).join('');

  body.querySelectorAll('.line-product').forEach((el) => {
    el.onchange = () => {
      const idx = Number(el.dataset.idx);
      const product = products.find((p) => p.id === Number(el.value));
      if (product) {
        builderState.items[idx] = {
          ...builderState.items[idx],
          product_id: product.id,
          description: product.name,
          hsn_code: product.hsn_code || '',
          unit_price: product.resolved_price,
          gst_rate: product.gst_rate
        };
      } else {
        builderState.items[idx].product_id = null;
      }
      renderBuilderLines();
      updateBuilderSummary();
    };
  });

  bindLineInput(body, '.line-description', 'description', (v) => v);
  bindLineInput(body, '.line-qty', 'qty', Number);
  bindLineInput(body, '.line-price', 'unit_price', Number);
  bindLineInput(body, '.line-gst', 'gst_rate', Number);

  body.querySelectorAll('.remove-line').forEach((el) => {
    el.onclick = () => removeBuilderLine(Number(el.dataset.idx));
  });
}

function bindLineInput(body, selector, field, transform) {
  body.querySelectorAll(selector).forEach((el) => {
    el.oninput = () => {
      const idx = Number(el.dataset.idx);
      builderState.items[idx][field] = transform(el.value);
      // Re-render only the affected line total + summary, not the whole table (keeps focus while typing)
      const row = el.closest('tr');
      const totalCell = row.querySelector('.num.mono');
      const item = builderState.items[idx];
      totalCell.textContent = `₹${(Number(item.qty) * Number(item.unit_price)).toFixed(2)}`;
      updateBuilderSummary();
    };
  });
}

function updateBuilderSummary() {
  const customerId = Number(document.getElementById('b-customer').value) || null;
  const customer = builderState.customers.find((c) => c.id === customerId);
  const discount = Number(document.getElementById('b-discount').value) || 0;
  const sameState = customer && normalizeStateClient(customer.state) === normalizeStateClient(builderState.company.state);

  let subtotal = 0, cgst = 0, sgst = 0, igst = 0;
  builderState.items.forEach((it) => {
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
  const total = subtotal - discount + cgst + sgst + igst;

  const lines = document.getElementById('summary-lines');
  lines.innerHTML = `
    <div class="summary-line"><span>Subtotal</span><span class="mono">₹${subtotal.toFixed(2)}</span></div>
    ${!customer ? `<div class="inline-note">Select a customer to calculate GST.</div>` : sameState
      ? `<div class="summary-line"><span>CGST</span><span class="mono">₹${cgst.toFixed(2)}</span></div>
         <div class="summary-line"><span>SGST</span><span class="mono">₹${sgst.toFixed(2)}</span></div>`
      : `<div class="summary-line"><span>IGST</span><span class="mono">₹${igst.toFixed(2)}</span></div>`
    }
    <div class="summary-line"><span>Discount</span><span class="mono">−₹${discount.toFixed(2)}</span></div>
    <div class="summary-line total"><span>Total</span><span class="mono">₹${total.toFixed(2)}</span></div>
  `;
}

async function saveBuilderQuote(status) {
  const customerId = Number(document.getElementById('b-customer').value) || null;
  if (!customerId) {
    showBuilderError('Please select a customer.');
    return;
  }
  if (builderState.items.some((it) => !it.description || Number(it.unit_price) < 0 || Number(it.qty) <= 0)) {
    showBuilderError('Every line item needs a description, a quantity greater than 0, and a valid price.');
    return;
  }

  const payload = {
    customer_id: customerId,
    template_id: Number(document.getElementById('b-template').value) || null,
    letterhead_id: Number(document.getElementById('b-letterhead').value) || null,
    valid_until: document.getElementById('b-valid-until').value || null,
    payment_terms: document.getElementById('b-payment-terms').value.trim(),
    notes: document.getElementById('b-notes').value.trim(),
    discount: Number(document.getElementById('b-discount').value) || 0,
    status,
    items: builderState.items
  };

  if (builderState.editingId) {
    await window.api.quotations.update(builderState.editingId, payload);
  } else {
    await window.api.quotations.create(payload);
  }

  renderQuotesList();
}

function showBuilderError(message) {
  let banner = document.querySelector('.builder .form-error');
  if (!banner) {
    banner = document.createElement('div');
    banner.className = 'form-error';
    document.querySelector('.builder-main').prepend(banner);
  }
  banner.textContent = message;
}

function normalizeStateClient(s) {
  return String(s || '').trim().toLowerCase();
}

// ─── Company Switcher ────────────────────────────────────────────────────────

const companySwitcherBtn = document.getElementById('company-switcher-btn');
const companySwitcherMenu = document.getElementById('company-switcher-menu');
const activeCompanyNameEl = document.getElementById('active-company-name');

function applyTheme(color) {
  document.documentElement.style.setProperty('--primary', color || '#004ac6');
}

async function refreshCompanySwitcherLabel() {
  const company = await window.api.company.get();
  if (company) {
    activeCompanyNameEl.textContent = company.name;
    applyTheme(company.theme_color);
  }
}

async function initCompanySwitcher() {
  await refreshCompanySwitcherLabel();

  companySwitcherBtn.onclick = async (e) => {
    e.stopPropagation();
    if (!companySwitcherMenu.classList.contains('hidden')) {
      companySwitcherMenu.classList.add('hidden');
      return;
    }
    await renderCompanySwitcherMenu();
    companySwitcherMenu.classList.remove('hidden');
  };

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.company-switcher')) companySwitcherMenu.classList.add('hidden');
  });
}

async function renderCompanySwitcherMenu() {
  const companies = await window.api.companies.list();

  companySwitcherMenu.innerHTML = `
    <div class="csm-header">Your Business Profiles</div>
    ${companies.map((c) => `
      <div class="company-option ${c.is_active ? 'active' : ''}" data-id="${c.id}">
        <span class="company-option-select" data-id="${c.id}">
          <span class="company-option-dot" style="background:${escapeAttr(c.theme_color || '#004ac6')}"></span>
          <span class="company-option-name">
            ${escapeHtml(c.name)}
            ${c.gst_number ? `<span class="company-option-gstin">${escapeHtml(c.gst_number)}</span>` : ''}
          </span>
        </span>
        <span class="company-option-right">
          ${c.is_active
            ? `<span class="company-active-check" title="Active">✓</span>`
            : `<button class="company-delete-btn delete-company-option" data-id="${c.id}" title="Delete this profile">✕</button>`
          }
        </span>
      </div>
    `).join('')}
    <div class="company-switcher-divider"></div>
    <div class="company-switcher-add" id="add-company-option">
      <span class="csm-add-icon">＋</span> Add New Business Profile
    </div>
  `;

  companySwitcherMenu.querySelectorAll('.company-option-select').forEach((el) => {
    el.onclick = async () => {
      const id = Number(el.dataset.id);
      const companies = await window.api.companies.list();
      const target = companies.find(c => c.id === id);
      if (target && target.is_active) {
        companySwitcherMenu.classList.add('hidden');
        return; // already active, just close
      }
      await window.api.companies.setActive(id);
      companySwitcherMenu.classList.add('hidden');
      await refreshCompanySwitcherLabel();
      const activeNav = document.querySelector('.nav-item.active');
      switchView(activeNav ? activeNav.dataset.view : 'dashboard');
    };
  });

  companySwitcherMenu.querySelectorAll('.delete-company-option').forEach((el) => {
    el.onclick = async (e) => {
      e.stopPropagation();
      const id = Number(el.dataset.id);
      companySwitcherMenu.classList.add('hidden');
      openConfirm(
        'Delete this company profile? All associated data (customers, products, invoices) will be permanently removed.',
        async () => {
          const result = await window.api.companies.delete(id);
          if (!result.success) {
            openInfo(result.reason, 'Cannot Delete');
          } else {
            await refreshCompanySwitcherLabel();
            const activeNav = document.querySelector('.nav-item.active');
            switchView(activeNav ? activeNav.dataset.view : 'dashboard');
          }
        },
        'Delete Profile'
      );
    };
  });

  document.getElementById('add-company-option').onclick = () => {
    companySwitcherMenu.classList.add('hidden');
    openCompanyCreateModal();
  };
}

function openCompanyCreateModal() {
  openModal(`
    <div class="modal-header">
      <h2>Add Business Profile</h2>
      <button class="modal-close">&times;</button>
    </div>
    <div class="modal-body">
      <p style="font-size:13px;color:var(--muted);margin-bottom:18px">
        Enter your company name to get started. You can add GSTIN, address, bank details and more from <strong>Settings</strong> after the profile is created.
      </p>
      <div class="form-group">
        <label>Company / Business Name <span style="color:var(--danger)">*</span></label>
        <input id="nc-name" placeholder="e.g. Sharma Traders Pvt. Ltd." style="font-size:15px;padding:10px 12px;" autofocus>
      </div>
      <div class="form-group" style="margin-top:12px">
        <label>Profile Colour <span style="font-size:11px;color:var(--muted)"> — helps distinguish profiles in the sidebar</span></label>
        <div class="csm-color-row">
          <input type="color" id="nc-color" value="#004ac6" title="Pick a colour">
          <button class="csm-preset" data-color="#004ac6" style="background:#004ac6" title="Corporate Blue"></button>
          <button class="csm-preset" data-color="#0d6e4c" style="background:#0d6e4c" title="Emerald"></button>
          <button class="csm-preset" data-color="#5b21b6" style="background:#5b21b6" title="Royal Violet"></button>
          <button class="csm-preset" data-color="#be123c" style="background:#be123c" title="Crimson"></button>
          <button class="csm-preset" data-color="#c2740a" style="background:#c2740a" title="Amber"></button>
          <button class="csm-preset" data-color="#334155" style="background:#334155" title="Slate"></button>
        </div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn modal-cancel">Cancel</button>
      <button class="btn btn-primary" id="create-company-btn">Create Profile & Go to Settings →</button>
    </div>
  `);

  // Colour preset buttons
  modal.querySelectorAll('.csm-preset').forEach(btn => {
    btn.onclick = () => {
      document.getElementById('nc-color').value = btn.dataset.color;
    };
  });

  // Allow pressing Enter to submit
  document.getElementById('nc-name').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.getElementById('create-company-btn').click();
  });

  document.getElementById('create-company-btn').onclick = async () => {
    const name = document.getElementById('nc-name').value.trim();
    if (!name) {
      showFormError('Please enter a company name to continue.');
      return;
    }
    const btn = document.getElementById('create-company-btn');
    btn.disabled = true;
    btn.textContent = 'Creating…';
    const result = await window.api.companies.create({
      name,
      theme_color: document.getElementById('nc-color').value
    });
    await window.api.companies.setActive(result.id);
    closeModal();
    await refreshCompanySwitcherLabel();
    switchView('settings');
  };
}

// ─── Utilities ───────────────────────────────────────────────────────────────

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function escapeAttr(str) {
  return escapeHtml(str);
}

// ─── Shared Export Dropdown ────────────────────────────────────────────────
// docType: 'quotation' | 'invoice' | 'challan' | 'note'

const API_MAP = {
  quotation: () => window.api.quotations,
  invoice:   () => window.api.invoices,
  challan:   () => window.api.challans,
  note:      () => window.api.creditDebitNotes,
};

// Returns true if the docType has an Excel export
const HAS_EXCEL = { quotation: true, invoice: true, challan: false, note: true };

let _activeExportWrap = null; // track which wrap is open

function closeAllExportMenus() {
  document.querySelectorAll('.export-dropdown').forEach((d) => {
    // Remove stored outside-click handler
    if (d._closeHandler) {
      document.removeEventListener('click', d._closeHandler, { capture: true });
    }
    d.remove();
  });
  document.querySelectorAll('.export-menu-btn.open').forEach((b) => b.classList.remove('open'));
  _activeExportWrap = null;
}

function openExportDropdown(wrap, docType, id) {
  // Toggle: close if already open
  if (_activeExportWrap === wrap) {
    closeAllExportMenus();
    return;
  }
  closeAllExportMenus();
  _activeExportWrap = wrap;

  const btn = wrap.querySelector('.export-menu-btn');
  btn.classList.add('open');

  const api = API_MAP[docType]?.();
  if (!api) return;

  const hasExcel = HAS_EXCEL[docType];

  const dropdown = document.createElement('div');
  dropdown.className = 'export-dropdown';

  const items = [
    { cls: 'edi-preview', label: 'Preview',            action: async () => { await api.previewPdf(id); } },
    { cls: 'edi-pdf',     label: 'Export PDF',         action: async () => { setLoading(btn, true); await api.exportPdf(id); setLoading(btn, false); } },
    { cls: 'edi-word',    label: 'Export Word (.docx)', action: async () => { setLoading(btn, true); await api.exportWord(id); setLoading(btn, false); } },
    hasExcel && { cls: 'edi-excel', label: 'Export Excel (.xlsx)', action: async () => { setLoading(btn, true); await api.exportExcel(id); setLoading(btn, false); } },
    { cls: 'edi-share',   label: 'Share via WhatsApp', action: async () => { setLoading(btn, true); await shareViaWhatsApp(docType, id); setLoading(btn, false); } },
  ].filter(Boolean);

  items.forEach((item) => {
    const el = document.createElement('button');
    el.className = `export-dropdown-item ${item.cls}`;
    el.innerHTML = `<span>${item.label}</span>`;
    el.onclick = async () => {
      closeAllExportMenus();
      await item.action();
    };
    dropdown.appendChild(el);
  });

  // ── Key fix: append to body with fixed positioning to escape overflow:hidden ──
  dropdown.style.position = 'fixed';
  dropdown.style.zIndex = '9999';
  document.body.appendChild(dropdown);

  // Position below the button, aligned to its right edge
  const rect = btn.getBoundingClientRect();
  const dropW = 200; // approximate min-width
  let top  = rect.bottom + 5;
  let left = rect.right - dropW;

  // Keep within viewport horizontally
  if (left < 8) left = 8;
  if (left + dropW > window.innerWidth - 8) left = window.innerWidth - dropW - 8;

  // If dropdown would go off bottom, flip it above the button
  if (top + 200 > window.innerHeight && rect.top > 200) {
    top = rect.top - 200;
  }

  dropdown.style.top  = `${top}px`;
  dropdown.style.left = `${left}px`;

  // Close on scroll or outside click
  const closeHandler = (e) => {
    if (!dropdown.contains(e.target) && e.target !== btn) {
      closeAllExportMenus();
    }
  };
  setTimeout(() => {
    document.addEventListener('click', closeHandler, { capture: true });
    document.addEventListener('scroll', closeAllExportMenus, { once: true, passive: true, capture: true });
    // Store handler so closeAllExportMenus can remove it
    dropdown._closeHandler = closeHandler;
  }, 0);
}


function setLoading(btn, isLoading) {
  if (isLoading) {
    btn.dataset.origText = btn.innerHTML;
    btn.innerHTML = 'Working… <span class="chevron">▾</span>';
    btn.disabled = true;
  } else {
    btn.innerHTML = btn.dataset.origText || 'Export <span class="chevron">▾</span>';
    btn.disabled = false;
  }
}

async function shareViaWhatsApp(docType, id) {
  const api = API_MAP[docType]?.();
  if (!api) return;

  try {
    // 1. Generate the actual PDF File object
    const res = await api.getPdfFile(id);
    if (!res || !res.file) {
      throw new Error('Failed to generate PDF file.');
    }

    const { file, fileName, docNumber } = res;
    const shareTitle = docNumber || 'QuoteFlow Document';
    const messageText = `Please find ${docNumber ? `document ${docNumber}` : 'the attached document'} from QuoteFlow.`;

    // 2. Check if device & browser support sharing files via Web Share API
    const canShareFiles = typeof navigator.share === 'function' &&
                          typeof navigator.canShare === 'function' &&
                          navigator.canShare({ files: [file] });

    if (canShareFiles) {
      try {
        await navigator.share({
          title: shareTitle,
          text: messageText,
          files: [file]
        });
        return;
      } catch (err) {
        if (err.name === 'AbortError') return; // User closed system share sheet
        console.warn('Native file share failed, falling back to download:', err);
      }
    }

    // 3. Fallback for desktop / unsupported browsers:
    // Download the PDF file to user's device and open WhatsApp with an explanatory message
    const blobUrl = URL.createObjectURL(file);
    const downloadLink = document.createElement('a');
    downloadLink.href = blobUrl;
    downloadLink.download = fileName;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);

    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const promptMessage = encodeURIComponent(`${messageText}\n\n(The PDF file "${fileName}" has been downloaded to your device. Please attach it to this chat.)`);
    const waUrl = isMobile
      ? `https://api.whatsapp.com/send?text=${promptMessage}`
      : `https://web.whatsapp.com/send?text=${promptMessage}`;

    window.open(waUrl, '_blank');
  } catch (err) {
    console.error('WhatsApp share error:', err);
    if (typeof openInfo === 'function') {
      openInfo('Could not generate PDF for sharing: ' + (err.message || err));
    }
  }
}

function attachExportMenus() {
  document.querySelectorAll('.export-menu-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation(); // prevent the outside-click handler from immediately closing
      const wrap = btn.closest('.export-wrap');
      const docType = btn.dataset.doctype;
      const id = Number(btn.dataset.id);
      openExportDropdown(wrap, docType, id);
    });
  });
}

// ─── Init ────────────────────────────────────────────────────────────────────

initCompanySwitcher();
switchView('customers');
