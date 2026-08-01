var e=document.getElementById(`view-root`),t=document.getElementById(`view-title`),n=document.querySelectorAll(`.nav-item`),r=document.getElementById(`modal-overlay`),i=document.getElementById(`modal`),a={dashboard:`Dashboard`,quotes:`Quotes`,invoices:`Invoices`,customers:`Customers`,products:`Products`,reports:`Reports`,settings:`Settings`},o=[`dashboard`,`quotes`,`invoices`,`challans`,`notes`,`customers`,`products`,`reports`,`settings`],s=0;n.forEach(e=>{e.onclick=()=>h(e.dataset.view)});var c=document.getElementById(`sidebar`),l=document.getElementById(`sidebar-overlay`),u=document.getElementById(`sidebar-toggle-btn`),d=document.getElementById(`sidebar-close-btn`);function f(){return window.innerWidth<=768}function ee(){c.classList.add(`sidebar-open`),l.classList.remove(`hidden`),document.body.style.overflow=`hidden`}function p(){f()&&(c.classList.remove(`sidebar-open`),l.classList.add(`hidden`),document.body.style.overflow=``)}function te(){let e=document.querySelector(`.app`);e.classList.toggle(`sidebar-hidden`);let t=e.classList.contains(`sidebar-hidden`);u.setAttribute(`aria-expanded`,String(!t));try{localStorage.setItem(`qf_sidebar_hidden`,t?`1`:`0`)}catch{}}function m(){f()?c.classList.contains(`sidebar-open`)?p():ee():te()}try{!f()&&localStorage.getItem(`qf_sidebar_hidden`)===`1`&&document.querySelector(`.app`).classList.add(`sidebar-hidden`)}catch{}u.addEventListener(`click`,m),d&&d.addEventListener(`click`,p),l.addEventListener(`click`,p),window.addEventListener(`resize`,()=>{f()||(c.classList.remove(`sidebar-open`),l.classList.add(`hidden`),document.body.style.overflow=``)}),document.addEventListener(`keydown`,()=>document.body.classList.add(`keyboard-nav`),{capture:!0}),document.addEventListener(`mousedown`,()=>document.body.classList.remove(`keyboard-nav`),{capture:!0}),document.addEventListener(`keydown`,e=>{let t=document.activeElement?.tagName,n=t===`INPUT`||t===`TEXTAREA`||t===`SELECT`||document.activeElement?.isContentEditable,i=!r.classList.contains(`hidden`)||!document.getElementById(`pdf-preview-overlay`).classList.contains(`hidden`)||!document.getElementById(`sync-panel-overlay`).classList.contains(`hidden`);if(e.key===`Escape`){if(i){v(),document.getElementById(`pdf-preview-overlay`).classList.add(`hidden`),document.getElementById(`sync-panel-overlay`).classList.add(`hidden`);return}if(f()&&c.classList.contains(`sidebar-open`)){p();return}}if((e.ctrlKey||e.metaKey)&&e.key===`k`){e.preventDefault(),document.getElementById(`global-search-input`)?.focus();return}if(!n&&!i&&(e.key===`m`||e.key===`M`)){e.preventDefault(),m();return}if(n||i)return;if(e.key===`w`||e.key===`W`||e.key===`ArrowUp`){e.preventDefault(),s=(s-1+o.length)%o.length,h(o[s]);return}if(e.key===`s`||e.key===`S`||e.key===`ArrowDown`){e.preventDefault(),s=(s+1)%o.length,h(o[s]);return}let a={1:`dashboard`,2:`quotes`,3:`invoices`,4:`challans`,5:`notes`,6:`customers`,7:`products`,8:`reports`,9:`settings`};if(!e.ctrlKey&&!e.altKey&&!e.metaKey&&a[e.key]){e.preventDefault(),h(a[e.key]);return}e.key===`Enter`&&document.activeElement?.classList.contains(`nav-item`)&&document.activeElement.click()});function h(e){let r=o.indexOf(e);r!==-1&&(s=r),n.forEach(t=>t.classList.toggle(`active`,t.dataset.view===e)),t.textContent=a[e]||e,p(),e===`customers`?S():e===`products`?C():e===`quotes`?T():e===`invoices`?E():e===`challans`?M():e===`notes`?R():e===`dashboard`?se():e===`reports`?Te():e===`settings`?V():g(a[e])}function g(t){e.innerHTML=`<div class="placeholder">${t} — coming in a later step.</div>`}function _(e){i.className=`modal`,i.innerHTML=e,r.classList.remove(`hidden`);let t=i.querySelector(`.modal-close`),n=i.querySelector(`.modal-cancel`);t&&(t.onclick=v),n&&(n.onclick=v),r.onclick=e=>{e.target===r&&v()}}function v(){r.classList.add(`hidden`),i.innerHTML=``,r.onclick=null}function y(e,t,n=`Delete`){_(`
    <div class="modal-header">
      <h2>Please confirm</h2>
      <button class="modal-close">&times;</button>
    </div>
    <div class="confirm-body">${Y(e)}</div>
    <div class="modal-footer">
      <button class="btn modal-cancel">Cancel</button>
      <button class="btn btn-primary" id="confirm-yes-btn" style="background:var(--danger)">${Y(n)}</button>
    </div>
  `),i.classList.add(`confirm-modal`),document.getElementById(`confirm-yes-btn`).onclick=async()=>{v(),await t()}}function b(e){let t=i.querySelector(`.modal-body`),n=t.querySelector(`.form-error`);n||(n=document.createElement(`div`),n.className=`form-error`,t.prepend(n)),n.textContent=e}function x(e,t=`Can't Delete`){_(`
    <div class="modal-header">
      <h2>${Y(t)}</h2>
      <button class="modal-close">&times;</button>
    </div>
    <div class="confirm-body">${Y(e)}</div>
    <div class="modal-footer">
      <button class="btn btn-primary modal-cancel">OK</button>
    </div>
  `),i.classList.add(`confirm-modal`)}async function S(){let t=await window.api.customers.list();e.innerHTML=`
    <div class="view-toolbar">
      <button class="btn btn-primary" id="add-customer-btn">+ Add Customer</button>
    </div>
    ${t.length===0?`<div class="empty-state">No customers yet. Add your first one to get started.</div>`:`<table class="data-table">
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
            ${t.map(e=>`
              <tr>
                <td>${Y(e.contact_name)}</td>
                <td>${Y(e.company_name||`—`)}</td>
                <td>${Y(e.category_name||`—`)}</td>
                <td>${Y(e.phone||`—`)}</td>
                <td>${Y(e.gst_number||`—`)}</td>
                <td class="row-actions">
                  <button class="edit-customer" data-id="${e.id}">Edit</button>
                  <button class="danger delete-customer" data-id="${e.id}">Delete</button>
                </td>
              </tr>
            `).join(``)}
          </tbody>
        </table>`}
  `,document.getElementById(`add-customer-btn`).onclick=()=>ne(),document.querySelectorAll(`.edit-customer`).forEach(e=>{e.onclick=()=>{ne(t.find(t=>t.id===Number(e.dataset.id)))}}),document.querySelectorAll(`.delete-customer`).forEach(e=>{e.onclick=()=>{y(`Delete this customer? This cannot be undone.`,async()=>{let t=await window.api.customers.delete(Number(e.dataset.id));t.success?S():x(t.reason)})}})}async function ne(e){let[t,n]=await Promise.all([window.api.customerCategories.list(),window.api.priceLists.list()]),r=!!e;_(`
    <div class="modal-header">
      <h2>${r?`Edit Customer`:`Add Customer`}</h2>
      <button class="modal-close">&times;</button>
    </div>
    <div class="modal-body">
      <div class="form-row">
        <div class="form-group">
          <label>Contact Name *</label>
          <input id="f-contact-name" value="${X(e?.contact_name||``)}">
        </div>
        <div class="form-group">
          <label>Company Name</label>
          <input id="f-company-name" value="${X(e?.company_name||``)}">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Category</label>
          <select id="f-category">
            <option value="">—</option>
            ${t.map(t=>`<option value="${t.id}" ${e?.category_id===t.id?`selected`:``}>${Y(t.name)}</option>`).join(``)}
          </select>
        </div>
        <div class="form-group">
          <label>Price List</label>
          <select id="f-price-list">
            <option value="">—</option>
            ${n.map(t=>`<option value="${t.id}" ${e?.price_list_id===t.id?`selected`:``}>${Y(t.name)}</option>`).join(``)}
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>State *</label>
          <input id="f-state" value="${X(e?.state||``)}" placeholder="e.g. Madhya Pradesh">
        </div>
        <div class="form-group">
          <label>GST Number</label>
          <input id="f-gst" value="${X(e?.gst_number||``)}">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Phone</label>
          <input id="f-phone" value="${X(e?.phone||``)}">
        </div>
        <div class="form-group">
          <label>Email</label>
          <input id="f-email" value="${X(e?.email||``)}">
        </div>
      </div>
      <div class="form-group">
        <label>Address</label>
        <textarea id="f-address" rows="2">${Y(e?.address||``)}</textarea>
      </div>
      <div class="form-group">
        <label>Payment Terms</label>
        <input id="f-payment-terms" value="${X(e?.payment_terms||``)}" placeholder="e.g. Net 30">
      </div>
      <div class="form-group">
        <label>Notes</label>
        <textarea id="f-notes" rows="2">${Y(e?.notes||``)}</textarea>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn modal-cancel">Cancel</button>
      <button class="btn btn-primary" id="save-customer-btn">${r?`Save Changes`:`Add Customer`}</button>
    </div>
  `),document.getElementById(`save-customer-btn`).onclick=async()=>{let t={contact_name:document.getElementById(`f-contact-name`).value.trim(),company_name:document.getElementById(`f-company-name`).value.trim(),category_id:document.getElementById(`f-category`).value||null,price_list_id:document.getElementById(`f-price-list`).value||null,state:document.getElementById(`f-state`).value.trim(),gst_number:document.getElementById(`f-gst`).value.trim(),phone:document.getElementById(`f-phone`).value.trim(),email:document.getElementById(`f-email`).value.trim(),address:document.getElementById(`f-address`).value.trim(),payment_terms:document.getElementById(`f-payment-terms`).value.trim(),notes:document.getElementById(`f-notes`).value.trim()};if(!t.contact_name||!t.state){b(`Contact Name and State are required.`);return}r?await window.api.customers.update(e.id,t):await window.api.customers.create(t),v(),S()}}async function C(){let t=await window.api.products.list();e.innerHTML=`
    <div class="view-toolbar">
      <button class="btn btn-primary" id="add-product-btn">+ Add Product</button>
    </div>
    ${t.length===0?`<div class="empty-state">No products yet. Add your first one to get started.</div>`:`<table class="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>SKU</th>
              <th>Category</th>
              <th>Unit Price</th>
              <th>GST %</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${t.map(e=>`
              <tr>
                <td>${Y(e.name)}</td>
                <td>${Y(e.sku||`—`)}</td>
                <td>${Y(e.category_name||`—`)}</td>
                <td>₹${Number(e.base_price).toFixed(2)}</td>
                <td>${e.gst_rate}%</td>
                <td class="row-actions">
                  <button class="edit-product" data-id="${e.id}">Edit</button>
                  <button class="danger delete-product" data-id="${e.id}">Delete</button>
                </td>
              </tr>
            `).join(``)}
          </tbody>
        </table>`}
  `,document.getElementById(`add-product-btn`).onclick=()=>re(),document.querySelectorAll(`.edit-product`).forEach(e=>{e.onclick=()=>{re(t.find(t=>t.id===Number(e.dataset.id)))}}),document.querySelectorAll(`.delete-product`).forEach(e=>{e.onclick=()=>{y(`Delete this product? This cannot be undone.`,async()=>{let t=await window.api.products.delete(Number(e.dataset.id));t.success?C():x(t.reason)})}})}async function re(e){let[t,n]=await Promise.all([window.api.productCategories.list(),window.api.settings.get()]),r=n.default_gst_rate||18,i=!!e;_(`
    <div class="modal-header">
      <h2>${i?`Edit Product`:`Add Product`}</h2>
      <button class="modal-close">&times;</button>
    </div>
    <div class="modal-body">
      <div class="form-row">
        <div class="form-group">
          <label>Product Name *</label>
          <input id="f-name" value="${X(e?.name||``)}">
        </div>
        <div class="form-group">
          <label>SKU</label>
          <input id="f-sku" value="${X(e?.sku||``)}">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Category</label>
          <select id="f-category">
            <option value="">—</option>
            ${t.map(t=>`<option value="${t.id}" ${e?.category_id===t.id?`selected`:``}>${Y(t.name)}</option>`).join(``)}
          </select>
        </div>
        <div class="form-group">
          <label>Unit</label>
          <input id="f-unit" value="${X(e?.unit||`unit`)}">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Base Price (₹) *</label>
          <input id="f-price" type="number" step="0.01" value="${e?.base_price??0}">
        </div>
        <div class="form-group">
          <label>GST Rate (%)</label>
          <input id="f-gst-rate" type="number" step="0.01" value="${e?.gst_rate??r}">
        </div>
      </div>
      <div class="form-group">
        <label>HSN Code</label>
        <input id="f-hsn" value="${X(e?.hsn_code||``)}">
      </div>
      <div class="form-group">
        <label>Description</label>
        <textarea id="f-description" rows="2">${Y(e?.description||``)}</textarea>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn modal-cancel">Cancel</button>
      <button class="btn btn-primary" id="save-product-btn">${i?`Save Changes`:`Add Product`}</button>
    </div>
  `),document.getElementById(`save-product-btn`).onclick=async()=>{let t={name:document.getElementById(`f-name`).value.trim(),sku:document.getElementById(`f-sku`).value.trim(),category_id:document.getElementById(`f-category`).value||null,unit:document.getElementById(`f-unit`).value.trim()||`unit`,base_price:document.getElementById(`f-price`).value,gst_rate:document.getElementById(`f-gst-rate`).value,hsn_code:document.getElementById(`f-hsn`).value.trim(),description:document.getElementById(`f-description`).value.trim()};if(!t.name||t.base_price===``){b(`Product Name and Base Price are required.`);return}i?await window.api.products.update(e.id,t):await window.api.products.create(t),v(),C()}}var ie={Draft:`badge-gray`,Ready:`badge-blue`,Sent:`badge-blue`,Negotiation:`badge-amber`,Approved:`badge-green`,Rejected:`badge-red`,Expired:`badge-red`,Archived:`badge-gray`},ae=[`Draft`,`Ready`,`Sent`,`Negotiation`,`Approved`,`Rejected`,`Expired`,`Archived`],w=new Set;async function T(){let t=await window.api.quotations.list();w=new Set,e.innerHTML=`
    <div class="view-toolbar">
      <button class="btn" id="export-selected-btn" disabled>Export Selected (0)</button>
      <button class="btn btn-primary" id="add-quote-btn">+ New Quote</button>
    </div>
    ${t.length===0?`<div class="empty-state">No quotations yet. Create your first one to get started.</div>`:`<table class="data-table">
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
            ${t.map(e=>`
              <tr>
                <td class="checkbox-col"><input type="checkbox" class="select-quote" data-id="${e.id}"></td>
                <td class="mono">${Y(e.quote_number)}</td>
                <td>${Y(e.company_name||e.contact_name)}</td>
                <td>
                  <select class="status-select ${ie[e.status]||`badge-gray`}" data-id="${e.id}">
                    ${ae.map(t=>`<option value="${t}" ${t===e.status?`selected`:``}>${t}</option>`).join(``)}
                  </select>
                </td>
                <td>${e.valid_until?Y(e.valid_until):`—`}</td>
                <td class="mono">₹${Number(e.total).toFixed(2)}</td>
                <td class="row-actions">
                  <button class="edit-quote" data-id="${e.id}">Edit</button>
                  <div class="export-wrap"><button class="export-menu-btn" data-doctype="quotation" data-id="${e.id}">Export <span class="chevron">▾</span></button></div>
                  <button class="followup-quote" data-id="${e.id}">+ Follow-up</button>
                  ${e.status===`Approved`?`<button class="convert-quote" data-id="${e.id}">Convert to Invoice</button>`:``}
                  <button class="danger delete-quote" data-id="${e.id}">Delete</button>
                </td>
              </tr>
            `).join(``)}
          </tbody>
        </table>`}
  `,document.getElementById(`add-quote-btn`).onclick=()=>Re(),document.querySelectorAll(`.status-select`).forEach(e=>{e.onchange=async()=>{await window.api.quotations.updateStatus(Number(e.dataset.id),e.value),T()}});let n=document.getElementById(`export-selected-btn`),r=document.getElementById(`select-all-quotes`),i=document.querySelectorAll(`.select-quote`);function a(){n.textContent=`Export Selected (${w.size})`,n.disabled=w.size===0}r&&(r.onchange=()=>{i.forEach(e=>{e.checked=r.checked;let t=Number(e.dataset.id);r.checked?w.add(t):w.delete(t)}),a()}),i.forEach(e=>{e.onchange=()=>{let t=Number(e.dataset.id);e.checked?w.add(t):w.delete(t),r&&(r.checked=w.size===i.length),a()}}),n.onclick=async()=>{let e=Array.from(w),t=n.textContent;n.textContent=`Exporting…`,n.disabled=!0;let r=await window.api.quotations.exportSelectedPdf(e);r.success?(n.textContent=`Exported ${r.count} PDFs`,setTimeout(()=>T(),2e3)):(n.textContent=t,n.disabled=w.size===0)},document.querySelectorAll(`.edit-quote`).forEach(e=>{e.onclick=()=>Re(Number(e.dataset.id))}),$(),document.querySelectorAll(`.followup-quote`).forEach(e=>{e.onclick=()=>oe(Number(e.dataset.id))}),document.querySelectorAll(`.convert-quote`).forEach(e=>{e.onclick=async()=>{let t=e.textContent;e.textContent=`Converting…`,e.disabled=!0;let n=await window.api.quotations.convertToInvoice(Number(e.dataset.id));n.already_existed?(x(`This quotation was already converted to invoice ${n.invoice_number}.`,`Already Converted`),e.textContent=t,e.disabled=!1):x(`Invoice ${n.invoice_number} created. You can find it in the Invoices list.`,`Invoice Created`)}}),document.querySelectorAll(`.delete-quote`).forEach(e=>{e.onclick=()=>{y(`Delete this quotation? This cannot be undone.`,async()=>{await window.api.quotations.delete(Number(e.dataset.id)),T()})}})}function oe(e){_(`
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
  `),document.getElementById(`save-followup-btn`).onclick=async()=>{let t=document.getElementById(`fu-date`).value;if(!t){b(`Due date is required.`);return}await window.api.followUps.create({quotation_id:e,due_date:t,reason:document.getElementById(`fu-reason`).value.trim()}),v()}}async function se(){let t=await window.api.dashboard.summary(),n=[`Draft`,`Ready`,`Sent`,`Negotiation`,`Approved`,`Rejected`,`Expired`,`Archived`],r=Object.fromEntries(t.statusCounts.map(e=>[e.status,e.n])),i=t.statusCounts.reduce((e,t)=>e+t.n,0);e.innerHTML=`
    <div class="stat-grid">
      <div class="card stat-card">
        <div class="stat-label">Pending Quotes</div>
        <div class="stat-value">${t.pendingCount}</div>
      </div>
      <div class="card stat-card">
        <div class="stat-label">Today's Quotes</div>
        <div class="stat-value">${t.todayCount}</div>
      </div>
      <div class="card stat-card">
        <div class="stat-label">Revenue (This Month)</div>
        <div class="stat-value">₹${Number(t.revenueThisMonth).toFixed(2)}</div>
        <div class="stat-note">Approved quotes only</div>
      </div>
    </div>

    <div class="card">
      <h3>Pipeline</h3>
      ${i===0?`<div class="inline-note">No quotations yet.</div>`:`<div class="pipeline-bar">
            ${n.filter(e=>r[e]).map(e=>`
              <div class="pipeline-segment ${ie[e]}" style="flex:${r[e]}" title="${e}: ${r[e]}"></div>
            `).join(``)}
          </div>
          <div class="pipeline-legend">
            ${n.filter(e=>r[e]).map(e=>`
              <span class="legend-item"><span class="legend-dot ${ie[e]}"></span>${e} (${r[e]})</span>
            `).join(``)}
          </div>`}
    </div>

    <div class="dash-grid">
      <div class="card">
        <h3>Follow-ups Due</h3>
        ${t.followUpsDue.length===0?`<div class="inline-note">Nothing due in the next 7 days.</div>`:t.followUpsDue.map(e=>`
              <div class="list-row">
                <div>
                  <div class="list-row-title">${Y(e.company_name||e.contact_name)} &middot; <span class="mono">${Y(e.quote_number)}</span></div>
                  <div class="list-row-sub">${e.reason?Y(e.reason)+` — `:``}Due ${Y(e.due_date)}</div>
                </div>
                <button class="btn complete-followup" data-id="${e.id}">Done</button>
              </div>
            `).join(``)}
      </div>

      <div class="card">
        <h3>Recent Activity</h3>
        ${t.recentActivity.length===0?`<div class="inline-note">No activity yet.</div>`:t.recentActivity.map(e=>`
              <div class="list-row">
                <div>
                  <div class="list-row-title">${Y(e.content)}</div>
                  <div class="list-row-sub">${e.quote_number?Y(e.quote_number)+` — `:``}${ce(e.created_at)}</div>
                </div>
              </div>
            `).join(``)}
      </div>

      <div class="card">
        <h3>Top Customers</h3>
        ${t.topCustomers.length===0?`<div class="inline-note">No quotations yet.</div>`:t.topCustomers.map(e=>`
              <div class="list-row">
                <div>
                  <div class="list-row-title">${Y(e.company_name||e.contact_name)}</div>
                  <div class="list-row-sub">${e.quote_count} quote${e.quote_count===1?``:`s`}</div>
                </div>
                <div class="mono">₹${Number(e.value).toFixed(2)}</div>
              </div>
            `).join(``)}
      </div>

      <div class="card">
        <h3>Top Products</h3>
        ${t.topProducts.length===0?`<div class="inline-note">No quoted products yet.</div>`:t.topProducts.map(e=>`
              <div class="list-row">
                <div>
                  <div class="list-row-title">${Y(e.name)}</div>
                  <div class="list-row-sub">${e.qty} units quoted</div>
                </div>
                <div class="mono">₹${Number(e.value).toFixed(2)}</div>
              </div>
            `).join(``)}
      </div>
    </div>
  `,document.querySelectorAll(`.complete-followup`).forEach(e=>{e.onclick=async()=>{await window.api.followUps.complete(Number(e.dataset.id)),se()}})}function ce(e){let t=new Date(e.replace(` `,`T`)+`Z`),n=Date.now()-t.getTime(),r=Math.round(n/6e4);if(r<1)return`just now`;if(r<60)return`${r} min ago`;let i=Math.round(r/60);return i<24?`${i}h ago`:`${Math.round(i/24)}d ago`}function le(e){if(!e)return`—`;let t=new Date(e.includes(`T`)?e:e.replace(` `,`T`)+`Z`);return isNaN(t)?e:t.toLocaleDateString(`en-IN`,{day:`2-digit`,month:`short`,year:`numeric`})}var ue={Issued:`badge-green`,Cancelled:`badge-red`},de={Unpaid:`badge-red`,"Partially Paid":`badge-amber`,Paid:`badge-green`},fe=[`Cash`,`Bank Transfer`,`UPI`,`Cheque`,`Card`,`Other`];async function E(){let t=await window.api.invoices.list();e.innerHTML=`
    <div class="view-toolbar">
      <button class="btn btn-primary" id="new-invoice-btn">+ New Direct Invoice</button>
    </div>
    ${t.length===0?`<div class="empty-state">No invoices yet. Approve a quotation and convert it to generate one, or click '+ New Direct Invoice' to create one directly.</div>`:`<table class="data-table">
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
            ${t.map(e=>{let t=e.status===`Issued`&&Number(e.total)>5e4&&!e.eway_bill_number?` <span class="badge badge-amber" title="E-Way Bill Required">⚠ E-Way</span>`:``;return`
              <tr>
                <td class="mono">${Y(e.invoice_number)}</td>
                <td>${Y(e.company_name||e.contact_name)}${t}</td>
                <td><span class="badge ${ue[e.status]||`badge-gray`}">${Y(e.status)}</span></td>
                <td><span class="badge ${de[e.payment_status]||`badge-gray`}">${Y(e.payment_status)}</span></td>
                <td>${e.due_date?Y(e.due_date):`—`}</td>
                <td class="mono">₹${Number(e.total).toFixed(2)}</td>
                <td class="mono">₹${Number(e.amount_paid).toFixed(2)}</td>
                <td class="row-actions">
                  ${e.status===`Issued`?`<button class="record-payment" data-id="${e.id}">Payments</button>`:``}
                  ${e.status===`Issued`?`<button class="edit-invoice-eway" data-id="${e.id}">E-Way Bill</button>`:``}
                  <div class="export-wrap"><button class="export-menu-btn" data-doctype="invoice" data-id="${e.id}">Export <span class="chevron">▾</span></button></div>
                  ${e.status===`Issued`?`<button class="danger cancel-invoice" data-id="${e.id}">Cancel</button>`:``}
                </td>
              </tr>
            `}).join(``)}
          </tbody>
        </table>`}
  `,document.getElementById(`new-invoice-btn`).onclick=()=>he(),document.querySelectorAll(`.edit-invoice-eway`).forEach(e=>{e.onclick=()=>pe(Number(e.dataset.id))}),$(),document.querySelectorAll(`.record-payment`).forEach(e=>{e.onclick=()=>ge(Number(e.dataset.id))}),document.querySelectorAll(`.cancel-invoice`).forEach(e=>{e.onclick=()=>{y(`Cancel this invoice? The invoice number is retained for GST record-keeping — this cannot be undone.`,async()=>{await window.api.invoices.cancel(Number(e.dataset.id)),E()},`Cancel Invoice`)}})}function pe(e){_(`
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
  `),window.api.invoices.get(e).then(e=>{e&&(document.getElementById(`inv-eway-num`).value=e.eway_bill_number||``,document.getElementById(`inv-eway-date`).value=e.eway_bill_date||``,document.getElementById(`inv-vehicle-num`).value=e.vehicle_number||``,document.getElementById(`inv-distance`).value=e.distance_km||``,document.getElementById(`inv-transporter`).value=e.transporter_name||``,document.getElementById(`inv-bilty-num`).value=e.bilty_number||``)}),document.getElementById(`save-inv-eway-btn`).onclick=async()=>{await window.api.invoices.updateEwayBill(e,{eway_bill_number:document.getElementById(`inv-eway-num`).value.trim()||null,eway_bill_date:document.getElementById(`inv-eway-date`).value||null,vehicle_number:document.getElementById(`inv-vehicle-num`).value.trim()||null,transporter_name:document.getElementById(`inv-transporter`).value.trim()||null,distance_km:document.getElementById(`inv-distance`).value||null,bilty_number:document.getElementById(`inv-bilty-num`).value.trim()||null}),v(),E()}}var D=[],O=[],me=``,k=``;async function he(){let[e,t]=await Promise.all([window.api.customers.list(),window.api.company.get()]);me=t?.state||``,D=[{product_id:null,description:``,hsn_code:``,qty:1,unit:`unit`,unit_price:0,gst_rate:18,line_total:0}],O=[],k=``,_(`
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
            ${e.map(e=>`<option value="${e.id}" data-state="${X(e.state||``)}">${Y(e.company_name||e.contact_name)} &middot; ${Y(e.contact_name)}</option>`).join(``)}
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Issue Date *</label>
          <input type="date" id="di-issue-date" value="${new Date().toISOString().slice(0,10)}">
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
  `),A();let n=document.getElementById(`di-customer`);n.onchange=async e=>{let t=Number(e.target.value);if(!t){O=[],k=``,A();return}k=n.options[n.selectedIndex].dataset.state||``,O=await window.api.quotations.productsForCustomer(t),A()},document.getElementById(`add-di-item-btn`).onclick=()=>{D.push({product_id:null,description:``,hsn_code:``,qty:1,unit:`unit`,unit_price:0,gst_rate:18,line_total:0}),A()},document.getElementById(`di-discount`).oninput=A,document.getElementById(`save-di-btn`).onclick=async()=>{let e=Number(n.value)||null;if(!e){b(`Please select a customer.`);return}if(D.some(e=>!e.description||Number(e.qty)<=0||Number(e.unit_price)<0)){b(`Every item needs a description, quantity > 0, and valid price.`);return}let t=document.getElementById(`di-eway-number`),r=await window.api.invoices.create({customer_id:e,issue_date:document.getElementById(`di-issue-date`).value||null,due_date:document.getElementById(`di-due-date`).value||null,payment_terms:document.getElementById(`di-payment-terms`).value.trim()||null,notes:document.getElementById(`di-notes`).value.trim()||null,discount:Number(document.getElementById(`di-discount`).value)||0,items:D,bilty_number:document.getElementById(`di-bilty-number`)&&document.getElementById(`di-bilty-number`).value.trim()||null,eway_bill_number:t&&t.value.trim()||null,eway_bill_date:document.getElementById(`di-eway-date`)&&document.getElementById(`di-eway-date`).value||null,vehicle_number:document.getElementById(`di-vehicle-num`)&&document.getElementById(`di-vehicle-num`).value.trim()||null,transporter_name:document.getElementById(`di-transporter`)&&document.getElementById(`di-transporter`).value.trim()||null,distance_km:document.getElementById(`di-distance`)&&document.getElementById(`di-distance`).value||null});r.success===!1?b(r.reason):(v(),E())}}function A(){let e=document.getElementById(`di-items-list`),t=document.getElementById(`no-customer-note-di`);t&&t.classList.toggle(`hidden`,O.length>0),e.innerHTML=D.map((e,t)=>`
    <div class="item-row">
      <select data-idx="${t}" class="di-product">
        <option value="">Custom item</option>
        ${O.map(t=>`
          <option value="${t.id}" ${e.product_id===t.id?`selected`:``}>${Y(t.name)}</option>
        `).join(``)}
      </select>
      <input class="di-desc" data-idx="${t}" placeholder="Description" value="${X(e.description)}">
      <input class="di-hsn" data-idx="${t}" placeholder="HSN" value="${X(e.hsn_code)}" style="width:80px;">
      <input class="di-qty" data-idx="${t}" type="number" min="0" step="1" placeholder="Qty" value="${e.qty}" style="width:70px;">
      <input class="di-price" data-idx="${t}" type="number" min="0" step="0.01" placeholder="Price" value="${e.unit_price}" style="width:100px;">
      <select class="di-gst" data-idx="${t}" style="width:70px;">
        ${[0,5,12,18,28].map(t=>`<option value="${t}" ${e.gst_rate==t?`selected`:``}>${t}%</option>`).join(``)}
      </select>
      <div style="width:80px; text-align:right; align-self:center; font-family:monospace;">₹${e.line_total.toFixed(2)}</div>
      ${D.length>1?`<button class="remove-line" data-idx="${t}">&times;</button>`:``}
    </div>
  `).join(``),e.querySelectorAll(`.di-product`).forEach(e=>{e.onchange=()=>{let t=Number(e.dataset.idx),n=O.find(t=>t.id===Number(e.value));n?D[t]={...D[t],product_id:n.id,description:n.name,hsn_code:n.hsn_code||``,unit:n.unit||`unit`,unit_price:n.resolved_price,gst_rate:n.gst_rate||18}:D[t].product_id=null,j()}});let n=(t,n,r)=>{e.querySelectorAll(t).forEach(e=>e.oninput=e=>{D[Number(e.target.dataset.idx)][n]=r?Number(e.target.value):e.target.value,r&&j()})};n(`.di-desc`,`description`,!1),n(`.di-hsn`,`hsn_code`,!1),n(`.di-qty`,`qty`,!0),n(`.di-price`,`unit_price`,!0),e.querySelectorAll(`.di-gst`).forEach(e=>e.onchange=e=>{D[Number(e.target.dataset.idx)].gst_rate=Number(e.target.value),j()}),e.querySelectorAll(`.remove-line`).forEach(e=>e.onclick=e=>{D.splice(Number(e.target.dataset.idx),1),j()}),j(!1)}function j(e=!0){let t=0,n=0,r=0,i=0,a=e=>String(e||``).trim().toLowerCase(),o=a(me)===a(k);D.forEach(e=>{e.line_total=(Number(e.qty)||0)*(Number(e.unit_price)||0),t+=e.line_total;let a=e.line_total*(Number(e.gst_rate)/100);o?(n+=a/2,r+=a/2):i+=a});let s=Number(document.getElementById(`di-discount`)?.value||0),c=t+n+r+i-s,l=document.getElementById(`di-subtotal`),u=document.getElementById(`di-tax-breakdown`),d=document.getElementById(`di-grand-total`);l&&(l.textContent=`₹${t.toFixed(2)}`),d&&(d.textContent=`₹${c.toFixed(2)}`),u&&(o?u.innerHTML=`
        <div class="summary-line"><span>CGST:</span> <span>₹${n.toFixed(2)}</span></div>
        <div class="summary-line"><span>SGST:</span> <span>₹${r.toFixed(2)}</span></div>
      `:u.innerHTML=`<div class="summary-line"><span>IGST:</span> <span>₹${i.toFixed(2)}</span></div>`);let f=document.getElementById(`di-eway-banner`);if(f&&(c>5e4?document.getElementById(`di-eway-number`)||(f.innerHTML=`
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
        `):f.innerHTML=``),e){let e=document.getElementById(`di-items-list`);e&&Array.from(e.children).forEach((e,t)=>{let n=e.querySelector(`div[style*="text-align:right"]`);n&&D[t]&&(n.textContent=`₹${D[t].line_total.toFixed(2)}`)})}}async function ge(e){let t=await window.api.invoices.get(e);if(!t)return;let n=_e(Number(t.total)-Number(t.amount_paid));_(`
    <div class="modal-header">
      <h2>Payments — ${Y(t.invoice_number)}</h2>
      <button class="modal-close">&times;</button>
    </div>
    <div class="modal-body">
      <div class="summary-lines">
        <div class="summary-line"><span>Invoice Total</span><span>₹${Number(t.total).toFixed(2)}</span></div>
        <div class="summary-line"><span>Amount Paid</span><span>₹${Number(t.amount_paid).toFixed(2)}</span></div>
        <div class="summary-line total"><span>Balance Due</span><span>₹${n.toFixed(2)}</span></div>
      </div>

      ${n>0?`
      <div class="form-row">
        <div class="form-group">
          <label>Amount *</label>
          <input type="number" id="pay-amount" step="0.01" min="0.01" max="${n}" value="${n.toFixed(2)}">
        </div>
        <div class="form-group">
          <label>Date *</label>
          <input type="date" id="pay-date" value="${new Date().toISOString().slice(0,10)}">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Mode</label>
          <select id="pay-mode">
            <option value="">—</option>
            ${fe.map(e=>`<option value="${e}">${e}</option>`).join(``)}
          </select>
        </div>
        <div class="form-group">
          <label>Reference</label>
          <input type="text" id="pay-reference" placeholder="Txn ID / cheque no.">
        </div>
      </div>
      <button class="btn btn-primary" id="save-payment-btn">Record Payment</button>
      `:`<div class="inline-note">Invoice fully paid.</div>`}

      <h3 style="margin-top:16px">History</h3>
      ${t.payments.length===0?`<div class="inline-note">No payments recorded yet.</div>`:t.payments.map(e=>`
            <div class="list-row">
              <div>
                <div class="list-row-title">₹${Number(e.amount).toFixed(2)}${e.mode?` — `+Y(e.mode):``}</div>
                <div class="list-row-sub">${Y(e.payment_date.slice(0,10))}${e.reference?` · `+Y(e.reference):``}</div>
              </div>
              <button class="danger delete-payment" data-id="${e.id}">Delete</button>
            </div>
          `).join(``)}
    </div>
    <div class="modal-footer">
      <button class="btn modal-cancel">Close</button>
    </div>
  `);let r=document.getElementById(`save-payment-btn`);r&&(r.onclick=async()=>{let t=Number(document.getElementById(`pay-amount`).value),n=document.getElementById(`pay-date`).value;if(!t||t<=0){b(`Enter an amount greater than zero.`);return}if(!n){b(`Payment date is required.`);return}await window.api.invoicePayments.create({invoice_id:e,amount:t,payment_date:n,mode:document.getElementById(`pay-mode`).value||null,reference:document.getElementById(`pay-reference`).value.trim()||null}),ge(e),E()}),document.querySelectorAll(`.delete-payment`).forEach(t=>{t.onclick=()=>{y(`Delete this payment record?`,async()=>{await window.api.invoicePayments.delete(Number(t.dataset.id)),ge(e),E()})}})}function _e(e){return Math.round(e*100)/100}var ve={Issued:`badge-green`,Cancelled:`badge-red`};async function M(){let t=await window.api.challans.list();e.innerHTML=`
    <div class="view-toolbar">
      <button class="btn btn-primary" id="new-challan-btn">+ New Delivery Challan</button>
    </div>
    ${t.length===0?`<div class="empty-state">No delivery challans yet.</div>`:`<table class="data-table">
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
            ${t.map(e=>{let t=Number(e.total_value)>I,n=e.eway_bill_number?`<span class="badge badge-green">${Y(e.eway_bill_number)}</span>`:t?`<span class="badge badge-red">Required</span>`:`<span class="inline-note">—</span>`;return`
              <tr>
                <td class="mono">${Y(e.challan_number)}</td>
                <td>${Y(e.company_name||e.contact_name)}</td>
                <td>${e.invoice_number?`<span class="mono">${Y(e.invoice_number)}</span>`:`<span class="inline-note">Standalone</span>`}</td>
                <td class="mono">₹${Number(e.total_value).toFixed(2)}</td>
                <td>${n}</td>
                <td><span class="badge ${ve[e.status]||`badge-gray`}">${Y(e.status)}</span></td>
                <td>${le(e.issue_date)}</td>
                <td class="row-actions">
                  <div class="export-wrap"><button class="export-menu-btn" data-doctype="challan" data-id="${e.id}">Export <span class="chevron">▾</span></button></div>
                  <button class="edit-eway-btn" data-id="${e.id}" data-number="${X(e.eway_bill_number||``)}" data-date="${X(e.eway_bill_date||``)}">E-Way Bill</button>
                  ${e.status===`Issued`?`<button class="danger cancel-challan" data-id="${e.id}">Cancel</button>`:``}
                </td>
              </tr>
            `}).join(``)}
          </tbody>
        </table>`}
  `,document.getElementById(`new-challan-btn`).onclick=()=>be(),document.querySelectorAll(`.edit-eway-btn`).forEach(e=>{e.onclick=()=>ye(Number(e.dataset.id),e.dataset.number,e.dataset.date)}),$(),document.querySelectorAll(`.cancel-challan`).forEach(e=>{e.onclick=()=>{y(`Cancel this delivery challan? This cannot be undone.`,async()=>{await window.api.challans.cancel(Number(e.dataset.id)),M()},`Cancel Challan`)}})}function ye(e,t,n){window.api.challans.get(e).then(r=>{_(`
      <div class="modal-header">
        <h2>E-Way Bill &amp; Transport Details</h2>
        <button class="modal-close">&times;</button>
      </div>
      <div class="modal-body">
        <div class="form-row">
          <div class="form-group">
            <label>E-Way Bill Number</label>
            <input id="eway-modal-number" value="${X(t)}" placeholder="e.g. EWB1234567890">
          </div>
          <div class="form-group">
            <label>E-Way Bill Date</label>
            <input id="eway-modal-date" type="date" value="${X(n)}">
          </div>
        </div>
        <div class="form-group">
          <label>Bilty / LR / Consignment No. <span style="font-weight:400;color:#888;">(optional)</span></label>
          <input id="eway-modal-bilty" value="${X(r&&r.bilty_number||``)}" placeholder="e.g. LR-98765">
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn modal-cancel">Cancel</button>
        <button class="btn btn-primary" id="save-eway-btn">Save</button>
      </div>
    `),document.getElementById(`save-eway-btn`).onclick=async()=>{await window.api.challans.updateEwayBill(e,{eway_bill_number:document.getElementById(`eway-modal-number`).value.trim(),eway_bill_date:document.getElementById(`eway-modal-date`).value||null,bilty_number:document.getElementById(`eway-modal-bilty`).value.trim()||null}),v(),M()}})}var N=[],P=[];async function be(){let e=await window.api.customers.list();N=[{product_id:null,description:``,hsn_code:``,qty:1,unit:`unit`,unit_value:0}],P=[],_(`
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
            ${e.map(e=>`<option value="${e.id}">${Y(e.company_name||e.contact_name)} &middot; ${Y(e.contact_name)}</option>`).join(``)}
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
  `),F(),L(),document.getElementById(`ch-customer`).onchange=async e=>{let t=Number(e.target.value),n=document.getElementById(`ch-invoice`);if(!t){n.innerHTML=`<option value="">Not linked — standalone challan</option>`,P=[],F();return}n.innerHTML=`
      <option value="">Not linked — standalone challan</option>
      ${(await window.api.invoices.list()).filter(e=>e.status===`Issued`).map(e=>`<option value="${e.id}">${Y(e.invoice_number)} &middot; ${Y(e.company_name||e.contact_name)}</option>`).join(``)}
    `,P=await window.api.quotations.productsForCustomer(t),F()},document.getElementById(`add-challan-item-btn`).onclick=()=>{N.push({product_id:null,description:``,hsn_code:``,qty:1,unit:`unit`,unit_value:0}),F(),L()},document.getElementById(`save-challan-btn`).onclick=async()=>{let e=Number(document.getElementById(`ch-customer`).value)||null;if(!e){b(`Please select a customer.`);return}if(N.some(e=>!e.description||Number(e.qty)<=0)){b(`Every item needs a description and a quantity greater than 0.`);return}let t=await window.api.challans.create({customer_id:e,invoice_id:Number(document.getElementById(`ch-invoice`).value)||null,transport_mode:document.getElementById(`ch-transport-mode`).value.trim(),vehicle_number:document.getElementById(`ch-vehicle`).value.trim(),bilty_number:document.getElementById(`ch-bilty-number`)&&document.getElementById(`ch-bilty-number`).value.trim()||null,eway_bill_number:document.getElementById(`ch-eway-number`).value.trim(),eway_bill_date:document.getElementById(`ch-eway-date`).value||null,notes:document.getElementById(`ch-notes`).value.trim(),items:N});t.success?(v(),M()):b(t.reason)}}function F(){let e=document.getElementById(`challan-items-list`),t=document.getElementById(`no-customer-note-challan`);t&&t.classList.toggle(`hidden`,P.length>0),e.innerHTML=N.map((e,t)=>`
    <div class="item-row">
      <select data-idx="${t}" class="ci-product">
        <option value="">Custom item</option>
        ${P.map(t=>`
          <option value="${t.id}" ${e.product_id===t.id?`selected`:``}>${Y(t.name)}</option>
        `).join(``)}
      </select>
      <input class="ci-desc" data-idx="${t}" placeholder="Description" value="${X(e.description)}">
      <input class="ci-hsn" data-idx="${t}" placeholder="HSN" value="${X(e.hsn_code)}" style="width:80px;">
      <input class="ci-qty" data-idx="${t}" type="number" min="0" step="1" placeholder="Qty" value="${e.qty}" style="width:70px;">
      <input class="ci-unit" data-idx="${t}" placeholder="Unit" value="${X(e.unit)}" style="width:80px;">
      <input class="ci-value" data-idx="${t}" type="number" min="0" step="0.01" placeholder="Ref. Value" value="${e.unit_value}" style="width:100px;">
      ${N.length>1?`<button class="remove-line" data-idx="${t}">&times;</button>`:``}
    </div>
  `).join(``),e.querySelectorAll(`.ci-product`).forEach(e=>{e.onchange=()=>{let t=Number(e.dataset.idx),n=P.find(t=>t.id===Number(e.value));n?N[t]={...N[t],product_id:n.id,description:n.name,hsn_code:n.hsn_code||``,unit:n.unit||`unit`,unit_value:n.resolved_price}:N[t].product_id=null,F(),L()}}),e.querySelectorAll(`.ci-desc`).forEach(e=>e.oninput=e=>{N[Number(e.target.dataset.idx)].description=e.target.value}),e.querySelectorAll(`.ci-hsn`).forEach(e=>e.oninput=e=>{N[Number(e.target.dataset.idx)].hsn_code=e.target.value}),e.querySelectorAll(`.ci-qty`).forEach(e=>e.oninput=e=>{N[Number(e.target.dataset.idx)].qty=e.target.value,L()}),e.querySelectorAll(`.ci-unit`).forEach(e=>e.oninput=e=>{N[Number(e.target.dataset.idx)].unit=e.target.value}),e.querySelectorAll(`.ci-value`).forEach(e=>e.oninput=e=>{N[Number(e.target.dataset.idx)].unit_value=e.target.value,L()}),e.querySelectorAll(`.remove-line`).forEach(e=>e.onclick=e=>{N.splice(Number(e.target.dataset.idx),1),F(),L()})}var I=5e4;function L(){let e=document.getElementById(`eway-bill-banner`);if(!e)return;let t=N.reduce((e,t)=>e+(Number(t.qty)||0)*(Number(t.unit_value)||0),0);e.innerHTML=t>I?`<div class="eway-warning">Goods value ₹${t.toFixed(2)} exceeds the ₹${I.toLocaleString(`en-IN`)} threshold — an E-Way Bill is required under GST rules. Record the number below once generated on the GST portal.</div>`:``}var xe={Issued:`badge-green`,Cancelled:`badge-red`};async function R(){let t=await window.api.creditDebitNotes.list();e.innerHTML=`
    <div class="view-toolbar">
      <button class="btn btn-primary" id="new-note-btn">+ New Credit/Debit Note</button>
    </div>
    ${t.length===0?`<div class="empty-state">No credit or debit notes yet. These correct an already-issued invoice.</div>`:`<table class="data-table">
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
            ${t.map(e=>`
              <tr>
                <td class="mono">${Y(e.note_number)}</td>
                <td><span class="badge ${e.note_type===`Credit`?`badge-blue`:`badge-amber`}">${Y(e.note_type)}</span></td>
                <td class="mono">${Y(e.invoice_number)}</td>
                <td>${Y(e.company_name||e.contact_name)}</td>
                <td><span class="badge ${xe[e.status]||`badge-gray`}">${Y(e.status)}</span></td>
                <td class="mono">₹${Number(e.total).toFixed(2)}</td>
                <td class="row-actions">
                  <div class="export-wrap"><button class="export-menu-btn" data-doctype="note" data-id="${e.id}">Export <span class="chevron">▾</span></button></div>
                  ${e.status===`Issued`?`<button class="danger cancel-note" data-id="${e.id}">Cancel</button>`:``}
                </td>
              </tr>
            `).join(``)}
          </tbody>
        </table>`}
  `,document.getElementById(`new-note-btn`).onclick=()=>Se(),$(),document.querySelectorAll(`.cancel-note`).forEach(e=>{e.onclick=()=>{y(`Cancel this note? The note number is retained for GST record-keeping — this cannot be undone.`,async()=>{await window.api.creditDebitNotes.cancel(Number(e.dataset.id)),R()},`Cancel Note`)}})}var z=[];async function Se(){let e=(await window.api.invoices.list()).filter(e=>e.status===`Issued`);z=[{product_id:null,description:``,hsn_code:``,qty:1,unit_price:0,gst_rate:18}],_(`
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
            ${e.map(e=>`<option value="${e.id}">${Y(e.invoice_number)} &middot; ${Y(e.company_name||e.contact_name)}</option>`).join(``)}
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
  `),Ce(),document.getElementById(`add-note-item-btn`).onclick=()=>{z.push({product_id:null,description:``,hsn_code:``,qty:1,unit_price:0,gst_rate:18}),Ce()},document.getElementById(`save-note-btn`).onclick=async()=>{let e=Number(document.getElementById(`n-invoice`).value)||null;if(!e){b(`Please select the invoice this note applies to.`);return}if(z.some(e=>!e.description||Number(e.qty)<=0)){b(`Every item needs a description and a quantity greater than 0.`);return}let t=await window.api.creditDebitNotes.create({invoice_id:e,note_type:document.getElementById(`n-type`).value,reason:document.getElementById(`n-reason`).value.trim(),notes:document.getElementById(`n-notes`).value.trim(),items:z});t.success?(v(),R()):b(t.reason)}}function Ce(){let e=document.getElementById(`note-items-list`);e.innerHTML=z.map((e,t)=>`
    <div class="item-row">
      <input class="ni-desc" data-idx="${t}" placeholder="Description" value="${X(e.description)}">
      <input class="ni-qty" data-idx="${t}" type="number" min="0" step="1" placeholder="Qty" value="${e.qty}" style="width:70px;">
      <input class="ni-price" data-idx="${t}" type="number" min="0" step="0.01" placeholder="Unit Price" value="${e.unit_price}" style="width:100px;">
      <input class="ni-gst" data-idx="${t}" type="number" min="0" step="0.01" placeholder="GST %" value="${e.gst_rate}" style="width:80px;">
      ${z.length>1?`<button class="remove-line" data-idx="${t}">&times;</button>`:``}
    </div>
  `).join(``),e.querySelectorAll(`.ni-desc`).forEach(e=>e.oninput=e=>{z[Number(e.target.dataset.idx)].description=e.target.value}),e.querySelectorAll(`.ni-qty`).forEach(e=>e.oninput=e=>{z[Number(e.target.dataset.idx)].qty=e.target.value}),e.querySelectorAll(`.ni-price`).forEach(e=>e.oninput=e=>{z[Number(e.target.dataset.idx)].unit_price=e.target.value}),e.querySelectorAll(`.ni-gst`).forEach(e=>e.oninput=e=>{z[Number(e.target.dataset.idx)].gst_rate=e.target.value}),e.querySelectorAll(`.remove-line`).forEach(e=>e.onclick=e=>{z.splice(Number(e.target.dataset.idx),1),Ce()})}function we(e){let t=new Date,n=e=>String(e).padStart(2,`0`),r=e=>`${e.getFullYear()}-${n(e.getMonth()+1)}-${n(e.getDate())}`,i,a;if(e===`last_month`)i=new Date(t.getFullYear(),t.getMonth()-1,1),a=new Date(t.getFullYear(),t.getMonth(),0);else if(e===`this_quarter`){let e=Math.floor(t.getMonth()/3);i=new Date(t.getFullYear(),e*3,1),a=new Date(t.getFullYear(),e*3+3,0)}else e===`this_year`?(i=new Date(t.getFullYear(),0,1),a=new Date(t.getFullYear(),11,31)):e===`all_time`?(i=new Date(2e3,0,1),a=new Date(2100,0,1)):(e=`this_month`,i=new Date(t.getFullYear(),t.getMonth(),1),a=new Date(t.getFullYear(),t.getMonth()+1,0));return{from:r(i),to:r(a),preset:e}}async function Te(t){let n=t||we(`this_month`),r=await window.api.reports.summary(n);e.innerHTML=`
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
      <div class="card stat-card"><div class="stat-label">Created</div><div class="stat-value">${r.created}</div></div>
      <div class="card stat-card"><div class="stat-label">Pending</div><div class="stat-value">${r.pending}</div></div>
      <div class="card stat-card"><div class="stat-label">Approved</div><div class="stat-value">${r.approved}</div></div>
    </div>
    <div class="stat-grid">
      <div class="card stat-card"><div class="stat-label">Rejected</div><div class="stat-value">${r.rejected}</div></div>
      <div class="card stat-card" style="grid-column: span 2;">
        <div class="stat-label">Revenue</div>
        <div class="stat-value">₹${Number(r.revenue).toFixed(2)}</div>
        <div class="stat-note">Approved quotes in selected range</div>
      </div>
    </div>
    <div class="dash-grid">
      <div class="card">
        <h3>Top Customers</h3>
        ${r.topCustomers.length===0?`<div class="inline-note">No data in this range.</div>`:r.topCustomers.map(e=>`
            <div class="list-row">
              <div>
                <div class="list-row-title">${Y(e.company_name||e.contact_name)}</div>
                <div class="list-row-sub">${e.quote_count} quote${e.quote_count===1?``:`s`}</div>
              </div>
              <div class="mono">₹${Number(e.value).toFixed(2)}</div>
            </div>
          `).join(``)}
      </div>
      <div class="card">
        <h3>Top Products</h3>
        ${r.topProducts.length===0?`<div class="inline-note">No data in this range.</div>`:r.topProducts.map(e=>`
            <div class="list-row">
              <div>
                <div class="list-row-title">${Y(e.name)}</div>
                <div class="list-row-sub">${e.qty} units quoted</div>
              </div>
              <div class="mono">₹${Number(e.value).toFixed(2)}</div>
            </div>
          `).join(``)}
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
            ${Array.from({length:5},(e,t)=>new Date().getFullYear()-t).map(e=>`<option value="${e}" ${e===new Date().getFullYear()?`selected`:``}>${e}</option>`).join(``)}
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
  `,await Ee(),document.getElementById(`audit-log-filter`).onchange=e=>Ee(e.target.value),document.getElementById(`export-sales-register-btn`).onclick=async()=>{let e=document.getElementById(`export-sales-register-btn`),t=document.getElementById(`sales-register-status`),r=e.textContent;e.textContent=`Exporting…`,e.disabled=!0;let i={this_month:`This Month`,last_month:`Last Month`,this_quarter:`This Quarter`,this_year:`This Year`,all_time:`All Time`},a=await window.api.reports.exportSalesRegister({...n,label:i[n.preset]});e.textContent=r,e.disabled=!1,a.success&&(t.textContent=`Exported ${a.count} invoice${a.count===1?``:`s`}`,t.className=`save-status success`,setTimeout(()=>{t.textContent=``},3e3))},document.getElementById(`report-range`).value=n.preset,document.getElementById(`report-range`).onchange=e=>{Te(we(e.target.value))};let i=[`January`,`February`,`March`,`April`,`May`,`June`,`July`,`August`,`September`,`October`,`November`,`December`];async function a(e){let t=document.getElementById(`monthly-ledger-table-wrap`);if(!t)return;t.innerHTML=`<div class="inline-note">Loading…</div>`;let n=await window.api.reports.monthlyLedger(e);if(!n||!n.months||n.months.length===0){t.innerHTML=`<div class="inline-note">No invoice data found for ${e}.</div>`;return}let r=e=>`₹${Number(e||0).toLocaleString(`en-IN`,{minimumFractionDigits:2,maximumFractionDigits:2})}`;t.innerHTML=`
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
          ${n.months.map((t,n)=>`
            <tr>
              <td><strong>${i[t.month-1]} ${e}</strong></td>
              <td class="r mono">${t.invoice_count}</td>
              <td class="r mono">${r(t.total_invoiced)}</td>
              <td class="r mono" style="color:#1a7f4b;">${r(t.payments_received)}</td>
              <td class="r mono" style="color:${t.outstanding_balance>0?`#c0392b`:`#1a7f4b`};">${r(t.outstanding_balance)}</td>
              <td>${t.invoice_count>0?`<button class="btn btn-sm view-month-details" data-idx="${n}" style="white-space:nowrap;">View Details</button>`:``}</td>
            </tr>
          `).join(``)}
        </tbody>
        <tfoot>
          <tr style="font-weight:700;border-top:2px solid #ccc;">
            <td>Year Total</td>
            <td class="r mono">${n.months.reduce((e,t)=>e+t.invoice_count,0)}</td>
            <td class="r mono">${r(n.months.reduce((e,t)=>e+t.total_invoiced,0))}</td>
            <td class="r mono" style="color:#1a7f4b;">${r(n.months.reduce((e,t)=>e+t.payments_received,0))}</td>
            <td class="r mono" style="color:#c0392b;">${r(n.months.reduce((e,t)=>e+t.outstanding_balance,0))}</td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    `,t.querySelectorAll(`.view-month-details`).forEach(t=>{t.onclick=()=>{let r=n.months[Number(t.dataset.idx)],a=e=>`₹${Number(e||0).toLocaleString(`en-IN`,{minimumFractionDigits:2,maximumFractionDigits:2})}`;_(`
          <div class="modal-header">
            <h2>${i[r.month-1]} ${e} — Invoice Breakdown</h2>
            <button class="modal-close">&times;</button>
          </div>
          <div class="modal-body">
            ${r.invoices&&r.invoices.length>0?`
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
                  ${r.invoices.map(e=>`
                    <tr>
                      <td class="mono">${Y(e.invoice_number||`—`)}</td>
                      <td class="mono">${Y(e.bilty_number||`—`)}</td>
                      <td>${le(e.issue_date)}</td>
                      <td>${Y(e.customer_name||`—`)}</td>
                      <td class="r mono">${a(e.total)}</td>
                      <td class="r mono" style="color:#1a7f4b;">${a(e.paid)}</td>
                      <td class="r mono" style="color:${e.balance>0?`#c0392b`:`#1a7f4b`};">${a(e.balance)}</td>
                      <td><span class="status-badge status-${(e.payment_status||``).toLowerCase()}">${Y(e.payment_status||e.status||`—`)}</span></td>
                    </tr>
                  `).join(``)}
                </tbody>
              </table>
            `:`<div class="inline-note">No invoices in this month.</div>`}
          </div>
          <div class="modal-footer">
            <button class="btn modal-cancel">Close</button>
          </div>
        `)}})}let o=document.getElementById(`monthly-ledger-year`);o&&(a(Number(o.value)),o.onchange=()=>a(Number(o.value))),document.getElementById(`export-monthly-ledger-excel-btn`).onclick=async()=>{let e=Number(document.getElementById(`monthly-ledger-year`).value),t=document.getElementById(`export-monthly-ledger-excel-btn`),n=t.textContent;t.textContent=`Exporting…`,t.disabled=!0,await window.api.reports.exportMonthlyLedgerExcel(e),t.textContent=n,t.disabled=!1},document.getElementById(`print-monthly-ledger-pdf-btn`).onclick=async()=>{let e=Number(document.getElementById(`monthly-ledger-year`).value),t=document.getElementById(`print-monthly-ledger-pdf-btn`),n=t.textContent;t.textContent=`Preparing…`,t.disabled=!0,await window.api.reports.printMonthlyLedgerPdf(e),t.textContent=n,t.disabled=!1},document.getElementById(`backup-create-btn`).onclick=async()=>{let e=document.getElementById(`backup-create-btn`),t=e.textContent;e.textContent=`Saving…`,e.disabled=!0;let n=await window.api.backup.create();e.textContent=n.success?`Backup Saved`:t,e.disabled=!1,n.success&&setTimeout(()=>{e.textContent=t},2e3)},document.getElementById(`backup-restore-btn`).onclick=()=>{y(`Restoring will replace all current data with the selected backup and restart the app. Continue?`,async()=>{await window.api.backup.restore()},`Restore & Restart`)}}async function Ee(e){let t=document.getElementById(`audit-log-table`),n=await window.api.auditLog.list(e?{documentType:e}:{});t.innerHTML=n.length===0?`<div class="inline-note">No audit entries yet.</div>`:`<table class="data-table">
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
          ${n.map(e=>`
            <tr>
              <td>${le(e.created_at)}</td>
              <td>${Y(e.document_type)}</td>
              <td class="mono">${Y(e.document_number)}</td>
              <td>${Y(e.action)}</td>
              <td class="list-row-sub">${Y(e.details||`—`)}</td>
            </tr>
          `).join(``)}
        </tbody>
      </table>`}var De=null,Oe=document.getElementById(`global-search-input`),B=document.getElementById(`global-search-results`);Oe.oninput=()=>{clearTimeout(De);let e=Oe.value;if(e.trim().length<2){B.classList.add(`hidden`);return}De=setTimeout(async()=>{ke(await window.api.search.global(e))},250)},document.addEventListener(`click`,e=>{e.target.closest(`.global-search`)||B.classList.add(`hidden`)});function ke(e){B.innerHTML=e.customers.length+e.products.length+e.quotations.length===0?`<div class="search-empty">No matches found.</div>`:`
      ${e.customers.length?`
        <div class="search-group-label">Customers</div>
        ${e.customers.map(e=>`
          <div class="search-result-item" data-type="customer" data-id="${e.id}">
            <div class="search-result-title">${Y(e.company_name||e.contact_name)}</div>
            <div class="search-result-sub">${Y(e.contact_name)}${e.phone?` &middot; `+Y(e.phone):``}</div>
          </div>
        `).join(``)}`:``}
      ${e.products.length?`
        <div class="search-group-label">Products</div>
        ${e.products.map(e=>`
          <div class="search-result-item" data-type="product" data-id="${e.id}">
            <div class="search-result-title">${Y(e.name)}</div>
            <div class="search-result-sub">${e.sku?`SKU: `+Y(e.sku):``}</div>
          </div>
        `).join(``)}`:``}
      ${e.quotations.length?`
        <div class="search-group-label">Quotations</div>
        ${e.quotations.map(e=>`
          <div class="search-result-item" data-type="quotation" data-id="${e.id}">
            <div class="search-result-title">${Y(e.quote_number)}</div>
            <div class="search-result-sub">${Y(e.company_name||e.contact_name)} &middot; ₹${Number(e.total).toFixed(2)}</div>
          </div>
        `).join(``)}`:``}
    `,B.classList.remove(`hidden`),B.querySelectorAll(`.search-result-item`).forEach(e=>{e.onclick=()=>Ae(e.dataset.type,Number(e.dataset.id))})}async function Ae(e,r){if(B.classList.add(`hidden`),Oe.value=``,e===`customer`){n.forEach(e=>e.classList.toggle(`active`,e.dataset.view===`customers`)),t.textContent=`Customers`,await S();let e=(await window.api.customers.list()).find(e=>e.id===r);e&&ne(e)}else if(e===`product`){n.forEach(e=>e.classList.toggle(`active`,e.dataset.view===`products`)),t.textContent=`Products`,await C();let e=(await window.api.products.list()).find(e=>e.id===r);e&&re(e)}else e===`quotation`&&(n.forEach(e=>e.classList.toggle(`active`,e.dataset.view===`quotes`)),t.textContent=`Quotes`,Re(r))}function je(e={}){_(`
    <div class="modal-header">
      <h2>Document Layout Defaults & PDF Formatting</h2>
      <button class="modal-close">&times;</button>
    </div>
    <div class="modal-body">
      <p style="font-size:13px;color:var(--muted);margin-bottom:14px;">
        These layout settings apply to all generated PDFs (Quotations, Invoices, Delivery Challans, Credit/Debit Notes).
      </p>
      <div class="form-row">
        <div class="form-group"><label>Margin Top (mm)</label><input id="l-marginTop" type="number" value="${e.marginTop??18}"></div>
        <div class="form-group"><label>Margin Right (mm)</label><input id="l-marginRight" type="number" value="${e.marginRight??16}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Margin Bottom (mm)</label><input id="l-marginBottom" type="number" value="${e.marginBottom??18}"></div>
        <div class="form-group"><label>Margin Left (mm)</label><input id="l-marginLeft" type="number" value="${e.marginLeft??16}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Accent Color</label><div class="color-swatch-row"><input type="color" id="l-accentColor" value="${e.accentColor||`#004ac6`}"></div></div>
        <div class="form-group"><label>Base Font Size (px)</label><input id="l-fontSize" type="number" value="${e.fontSize??12}"></div>
      </div>
      <div class="form-group">
        <label>Font Family</label>
        <input id="l-fontFamily" value="${X(e.fontFamily||`'Segoe UI', Arial, sans-serif`)}">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Table Spacing</label>
          <select id="l-tableSpacing">
            <option value="compact" ${e.tableSpacing===`compact`?`selected`:``}>Compact</option>
            <option value="normal" ${(e.tableSpacing||`normal`)===`normal`?`selected`:``}>Normal</option>
            <option value="spacious" ${e.tableSpacing===`spacious`?`selected`:``}>Spacious</option>
          </select>
        </div>
        <div class="form-group">
          <label>Header Alignment</label>
          <select id="l-headerAlign">
            <option value="split" ${(e.headerAlign||`split`)===`split`?`selected`:``}>Split</option>
            <option value="center" ${e.headerAlign===`center`?`selected`:``}>Center</option>
            <option value="right" ${e.headerAlign===`right`?`selected`:``}>Right</option>
          </select>
        </div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn modal-cancel">Cancel</button>
      <button class="btn btn-primary" id="save-layout-btn">Save Layout Defaults</button>
    </div>
  `),document.getElementById(`save-layout-btn`).onclick=async()=>{await window.api.layout.save({marginTop:Number(document.getElementById(`l-marginTop`).value),marginRight:Number(document.getElementById(`l-marginRight`).value),marginBottom:Number(document.getElementById(`l-marginBottom`).value),marginLeft:Number(document.getElementById(`l-marginLeft`).value),accentColor:document.getElementById(`l-accentColor`).value,fontSize:Number(document.getElementById(`l-fontSize`).value),fontFamily:document.getElementById(`l-fontFamily`).value.trim(),tableSpacing:document.getElementById(`l-tableSpacing`).value,headerAlign:document.getElementById(`l-headerAlign`).value}),v(),V()}}async function V(){let[t,n,r,i,a,o,s,c]=await Promise.all([window.api.company.get(),window.api.settings.get(),window.api.layout.get(),window.api.customerCategories.list(),window.api.productCategories.list(),window.api.priceLists.list(),window.api.templates.list(),window.api.letterheads.list()]),l=r||{};e.innerHTML=`
    <div class="card" style="margin-bottom:16px;">
      <h3>Company Profile</h3>
      <div class="form-row">
        <div class="form-group"><label>Company Name *</label><input id="s-name" value="${X(t.name||``)}"></div>
        <div class="form-group"><label>GST Number</label><input id="s-gst" value="${X(t.gst_number||``)}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>State *</label><input id="s-state" value="${X(t.state||``)}" placeholder="e.g. Madhya Pradesh"></div>
        <div class="form-group"><label>Phone</label><input id="s-phone" value="${X(t.phone||``)}"></div>
      </div>
      <div class="form-group"><label>Email</label><input id="s-email" value="${X(t.email||``)}"></div>
      <div class="form-group"><label>Address</label><textarea id="s-address" rows="2">${Y(t.address||``)}</textarea></div>
      <div class="form-group"><label>Bank Details</label><textarea id="s-bank" rows="2" placeholder="Account name, number, IFSC, bank name">${Y(t.bank_details||``)}</textarea></div>
      <div class="form-group">
        <label>Highlight Color</label>
        <div class="color-swatch-row">
          <input type="color" id="s-theme-color" value="${X(t.theme_color||`#004ac6`)}">
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
            <input id="s-upi-id" value="${X(t.upi_id||``)}" placeholder="e.g. businessname@upi">
          </div>
          <div class="form-group" style="margin-top:8px;">
            <label>Upload QR Code Image</label>
            <input type="file" id="s-qr-upload" accept="image/*" style="margin-top:4px;">
          </div>
          <div class="settings-actions" style="margin-top:8px;">
            <button class="btn btn-primary" id="save-qr-btn">Save QR Settings</button>
            <button class="btn" id="remove-qr-btn" style="${t.upi_qr_image?``:`display:none;`}">Remove QR Image</button>
            <span class="save-status" id="qr-save-status"></span>
          </div>
        </div>
        <div id="qr-preview-wrap" style="flex-shrink:0;">
          ${t.upi_qr_image?`<div style="text-align:center;"><img id="qr-preview-img" src="${t.upi_qr_image}" alt="QR Code" style="width:120px;height:120px;object-fit:contain;border:1px solid #ddd;border-radius:8px;padding:6px;background:#fff;"><div style="font-size:11px;color:#888;margin-top:4px;">Current QR</div></div>`:`<div id="qr-preview-empty" style="width:120px;height:120px;display:flex;align-items:center;justify-content:center;border:1px dashed #ccc;border-radius:8px;color:#aaa;font-size:12px;text-align:center;">No QR<br>uploaded</div>`}
        </div>
      </div>
    </div>

    <div class="card" style="margin-bottom:16px;">
      <h3>Quotation Defaults</h3>
      <div class="form-row">
        <div class="form-group"><label>Numbering Prefix</label><input id="s-prefix" value="${X(n.numbering_prefix||`QF`)}"></div>
        <div class="form-group"><label>Default GST Rate for New Products (%)</label><input id="s-default-gst" type="number" step="0.01" value="${n.default_gst_rate||18}"></div>
      </div>
      <div class="settings-note">New quotations use the format PREFIX/FinancialYear/Number, e.g. ${Y(n.numbering_prefix||`QF`)}/2026-27/001. Changing the prefix only affects quotes created after the change.</div>
      <div class="settings-actions">
        <button class="btn btn-primary" id="save-defaults-btn">Save Defaults</button>
        <span class="save-status" id="defaults-save-status"></span>
      </div>
    </div>

    <div class="dash-grid">
      <div class="card">
        <h3>Customer Categories</h3>
        <div class="tag-list" id="customer-cat-list">
          ${i.map(e=>`
            <span class="tag">${Y(e.name)}<button class="tag-remove" data-type="customer" data-id="${e.id}">&times;</button></span>
          `).join(``)||`<div class="inline-note">None yet.</div>`}
        </div>
        <div class="tag-add-row">
          <input id="new-customer-cat" placeholder="New category name">
          <button class="btn" id="add-customer-cat-btn">Add</button>
        </div>
      </div>

      <div class="card">
        <h3>Product Categories</h3>
        <div class="tag-list" id="product-cat-list">
          ${a.map(e=>`
            <span class="tag">${Y(e.name)}<button class="tag-remove" data-type="product" data-id="${e.id}">&times;</button></span>
          `).join(``)||`<div class="inline-note">None yet.</div>`}
        </div>
        <div class="tag-add-row">
          <input id="new-product-cat" placeholder="New category name">
          <button class="btn" id="add-product-cat-btn">Add</button>
        </div>
      </div>
    </div>

    <div class="card" style="margin-top:16px;">
      <h3>Price Lists</h3>
      ${o.length===0?`<div class="inline-note">No price lists yet.</div>`:o.map(e=>`
            <div class="list-row">
              <div class="list-row-title">${Y(e.name)}</div>
              <div class="row-actions">
                <button class="manage-pricing-btn" data-id="${e.id}" data-name="${X(e.name)}">Manage Pricing</button>
                <button class="danger delete-price-list" data-id="${e.id}">Delete</button>
              </div>
            </div>
          `).join(``)}
      <div class="tag-add-row" style="margin-top:12px;">
        <input id="new-price-list" placeholder="New price list name">
        <button class="btn" id="add-price-list-btn">Add</button>
      </div>
    </div>

    <div class="dash-grid" style="margin-top:16px;">
      <div class="card">
        <h3>Quote Templates & Document Layouts</h3>
        ${s.length===0?`<div class="inline-note">No custom templates — using default layout.</div>`:s.map(e=>`
              <div class="list-row">
                <div class="list-row-title">${Y(e.name)}</div>
                <div class="row-actions">
                  <button class="edit-template-btn" data-id="${e.id}">Edit</button>
                  <button class="danger delete-template-btn" data-id="${e.id}">Delete</button>
                </div>
              </div>
            `).join(``)}
        <div class="settings-actions" style="margin-top:12px; gap:8px;">
          <button class="btn" id="new-template-btn">+ New Template</button>
          <button class="btn btn-primary" id="open-layout-studio-btn">⚙ Layout Defaults</button>
        </div>
      </div>

      <div class="card">
        <h3>Letterheads</h3>
        ${c.length===0?`<div class="inline-note">No letterheads uploaded yet.</div>`:c.map(e=>`
              <div class="list-row">
                <div class="list-row-title">${Y(e.name)}</div>
                <div class="row-actions">
                  <button class="danger delete-letterhead-btn" data-id="${e.id}">Delete</button>
                </div>
              </div>
            `).join(``)}
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
  `;let u=async()=>{let e=document.getElementById(`storage-status-title`),t=document.getElementById(`storage-status-desc`),n=document.getElementById(`req-persist-btn`);if(!navigator.storage||!navigator.storage.persist){e&&(e.textContent=`Storage API Not Supported`),t&&(t.textContent=`Use 1-Click Backups to save copy to your device.`),n&&(n.style.display=`none`);return}await navigator.storage.persisted()?(e&&(e.innerHTML=`<span style="color:#146c3a;">✓ Protected: Storage Lock Active</span>`),t&&(t.textContent=`Android & Chrome will NEVER clear this app's database during OS low-memory cleanup.`),n&&(n.textContent=`Protected`,n.disabled=!0,n.style.background=`#e6f4ea`,n.style.color=`#137333`,n.style.borderColor=`#ceead6`)):(e&&(e.textContent=`Storage Status: Best Effort (Unprotected)`),t&&(t.textContent=`Tap Protect Storage to request persistent lock from Android/Chrome.`),n&&(n.onclick=async()=>{n.disabled=!0,n.textContent=`Requesting…`,await navigator.storage.persist(),await u()}))};u();let d=document.getElementById(`settings-export-backup-btn`);d&&(d.onclick=async()=>{d.disabled=!0,d.textContent=`Generating Backup…`;let e=await window.api.backup.create();d.textContent=e.success?`Backup Downloaded!`:`Export Failed`,setTimeout(()=>{d.disabled=!1,d.textContent=`⬇ Export Backup File (.qfbackup)`},2500)});let f=document.getElementById(`settings-import-backup-btn`);f&&(f.onclick=()=>{y(`Restoring from a backup will replace your current data with the contents of the backup file. Proceed?`,async()=>{await window.api.backup.restore(),V()},`Restore Backup`)}),document.getElementById(`pre-reset-backup-btn`).onclick=async()=>{let e=document.getElementById(`pre-reset-backup-btn`),t=e.textContent;e.textContent=`Saving…`,e.disabled=!0;let n=await window.api.backup.create();e.textContent=n.success?`Backup Saved`:t,e.disabled=!1,n.success&&setTimeout(()=>{e.textContent=t},2e3)};let ee=document.getElementById(`factory-reset-confirm-input`),p=document.getElementById(`factory-reset-btn`);ee.oninput=()=>{p.disabled=ee.value!==`DELETE EVERYTHING`},p.onclick=()=>{y(`This is the final confirmation. Every company, customer, product, quotation, invoice, challan, and note will be permanently erased and the app will restart empty. This cannot be undone.`,async()=>{await window.api.app.factoryReset()},`Erase Everything`)},document.getElementById(`save-company-btn`).onclick=async()=>{let e=document.getElementById(`company-save-status`),t={name:document.getElementById(`s-name`).value.trim(),gst_number:document.getElementById(`s-gst`).value.trim(),state:document.getElementById(`s-state`).value.trim(),phone:document.getElementById(`s-phone`).value.trim(),email:document.getElementById(`s-email`).value.trim(),address:document.getElementById(`s-address`).value.trim(),bank_details:document.getElementById(`s-bank`).value.trim(),theme_color:document.getElementById(`s-theme-color`).value};if(!t.name||!t.state){e.textContent=`Name and State are required.`,e.className=`save-status error`;return}await window.api.company.update(t),qe(t.theme_color),J(),e.textContent=`Saved`,e.className=`save-status success`,setTimeout(()=>{e.textContent=``},2e3)};let te=document.getElementById(`s-qr-upload`),m=document.getElementById(`qr-preview-wrap`),h=null;te&&(te.onchange=e=>{let t=e.target.files[0];if(!t)return;let n=new FileReader;n.onload=e=>{h=e.target.result,m.innerHTML=`<div style="text-align:center;"><img id="qr-preview-img" src="${h}" alt="QR Code" style="width:120px;height:120px;object-fit:contain;border:1px solid #ddd;border-radius:8px;padding:6px;background:#fff;"><div style="font-size:11px;color:#888;margin-top:4px;">Preview (unsaved)</div></div>`;let t=document.getElementById(`remove-qr-btn`);t&&(t.style.display=``)},n.readAsDataURL(t)}),document.getElementById(`save-qr-btn`).onclick=async()=>{let e=document.getElementById(`qr-save-status`),t=document.getElementById(`s-upi-id`).value.trim();await window.api.company.update({...await window.api.company.get(),upi_id:t||null}),h!==null&&(await window.api.company.updateQr(h),h=null),e.textContent=`Saved`,e.className=`save-status success`,setTimeout(()=>{e.textContent=``},2e3)},document.getElementById(`remove-qr-btn`).onclick=async()=>{await window.api.company.updateQr(null),h=null,m.innerHTML=`<div id="qr-preview-empty" style="width:120px;height:120px;display:flex;align-items:center;justify-content:center;border:1px dashed #ccc;border-radius:8px;color:#aaa;font-size:12px;text-align:center;">No QR<br>uploaded</div>`,document.getElementById(`remove-qr-btn`).style.display=`none`;let e=document.getElementById(`qr-save-status`);e.textContent=`QR Removed`,e.className=`save-status success`,setTimeout(()=>{e.textContent=``},2e3)},document.getElementById(`save-defaults-btn`).onclick=async()=>{await window.api.settings.update({numbering_prefix:document.getElementById(`s-prefix`).value.trim()||`QF`,default_gst_rate:document.getElementById(`s-default-gst`).value||18});let e=document.getElementById(`defaults-save-status`);e.textContent=`Saved`,e.className=`save-status success`,setTimeout(()=>{e.textContent=``},2e3)};let g=document.getElementById(`open-layout-studio-btn`);g&&(g.onclick=()=>je(l)),document.getElementById(`add-customer-cat-btn`).onclick=async()=>{let e=document.getElementById(`new-customer-cat`);e.value.trim()&&(await window.api.customerCategories.create(e.value.trim()),V())},document.getElementById(`add-product-cat-btn`).onclick=async()=>{let e=document.getElementById(`new-product-cat`);e.value.trim()&&(await window.api.productCategories.create(e.value.trim()),V())},document.getElementById(`add-price-list-btn`).onclick=async()=>{let e=document.getElementById(`new-price-list`);e.value.trim()&&(await window.api.priceLists.create(e.value.trim()),V())},document.querySelectorAll(`.tag-remove`).forEach(e=>{e.onclick=async()=>{let t=await(e.dataset.type===`customer`?window.api.customerCategories:window.api.productCategories).delete(Number(e.dataset.id));t.success?V():x(t.reason)}}),document.querySelectorAll(`.delete-price-list`).forEach(e=>{e.onclick=()=>{y(`Delete this price list? This cannot be undone.`,async()=>{let t=await window.api.priceLists.delete(Number(e.dataset.id));t.success?V():x(t.reason)})}}),document.querySelectorAll(`.manage-pricing-btn`).forEach(e=>{e.onclick=()=>Me(Number(e.dataset.id),e.dataset.name)}),document.getElementById(`new-template-btn`).onclick=()=>Ie(),document.querySelectorAll(`.edit-template-btn`).forEach(e=>{e.onclick=()=>{Ie(s.find(t=>t.id===Number(e.dataset.id)))}}),document.querySelectorAll(`.delete-template-btn`).forEach(e=>{e.onclick=()=>{y(`Delete this template? This cannot be undone.`,async()=>{let t=await window.api.templates.delete(Number(e.dataset.id));t.success?V():x(t.reason)})}}),document.getElementById(`upload-letterhead-btn`).onclick=async()=>{let e=document.getElementById(`upload-letterhead-btn`),t=e.textContent;e.textContent=`Uploading…`,e.disabled=!0;let n=await window.api.letterheads.upload();e.textContent=t,e.disabled=!1,n.success&&V()},document.querySelectorAll(`.delete-letterhead-btn`).forEach(e=>{e.onclick=()=>{y(`Delete this letterhead? This cannot be undone.`,async()=>{let t=await window.api.letterheads.delete(Number(e.dataset.id));t.success?V():x(t.reason)})}})}async function Me(e,t){let n=await window.api.priceListItems.getForList(e);_(`
    <div class="modal-header">
      <h2>Pricing — ${Y(t)}</h2>
      <button class="modal-close">&times;</button>
    </div>
    <div class="modal-body">
      ${n.length===0?`<div class="inline-note">No products yet — add products first.</div>`:`<table class="data-table">
            <thead>
              <tr><th>Product</th><th class="num">Base Price</th><th class="num">Override Price</th></tr>
            </thead>
            <tbody>
              ${n.map(e=>`
                <tr>
                  <td>${Y(e.name)}${e.sku?`<div class="hsn-note">SKU: ${Y(e.sku)}</div>`:``}</td>
                  <td class="num mono">₹${Number(e.base_price).toFixed(2)}</td>
                  <td class="num">
                    <input type="number" step="0.01" min="0" data-product-id="${e.id}" class="override-price-input"
                      value="${e.override_price==null?``:e.override_price}" placeholder="Use base price">
                  </td>
                </tr>
              `).join(``)}
            </tbody>
          </table>
          <div class="inline-note">Leave blank to use the base price for this product.</div>`}
    </div>
    <div class="modal-footer">
      <button class="btn modal-cancel">Cancel</button>
      <button class="btn btn-primary" id="save-pricing-btn">Save Pricing</button>
    </div>
  `);let r=document.getElementById(`save-pricing-btn`);r&&(r.onclick=async()=>{let t=Array.from(document.querySelectorAll(`.override-price-input`)).map(e=>({product_id:Number(e.dataset.productId),price:e.value.trim()===``?null:e.value}));await window.api.priceListItems.save(e,t),v()})}var Ne={header:`Company Header`,customer:`Customer Details`,items:`Line Items`,totals:`Totals & GST`,payments:`Payment History (Invoices only)`,payment_terms:`Payment Terms`,notes:`Notes`,bank:`Bank Details`,signature:`Signature`,footer:`Footer`},Pe=[{type:`header`,enabled:!0,showCompanyName:!0,showCompanyContact:!0},{type:`customer`,enabled:!0},{type:`items`,enabled:!0},{type:`totals`,enabled:!0},{type:`payments`,enabled:!0},{type:`payment_terms`,enabled:!0},{type:`notes`,enabled:!0},{type:`bank`,enabled:!0},{type:`signature`,enabled:!0},{type:`footer`,enabled:!0}],H=[],Fe=null;function Ie(e){Fe=e?e.id:null,H=e?[...e.blocks]:Pe.map(e=>({...e})),_(`
    <div class="modal-header">
      <h2>${e?`Edit Template`:`New Template`}</h2>
      <button class="modal-close">&times;</button>
    </div>
    <div class="modal-body">
      <div class="form-group">
        <label>Template Name *</label>
        <input id="t-name" value="${X(e?.name||``)}" placeholder="e.g. Standard Quote">
      </div>
      <div class="form-group">
        <label>Sections (toggle and reorder)</label>
        <div id="template-blocks-list" class="template-blocks-list"></div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn modal-cancel">Cancel</button>
      <button class="btn btn-primary" id="save-template-btn">${e?`Save Changes`:`Create Template`}</button>
    </div>
  `),Le(),document.getElementById(`save-template-btn`).onclick=async()=>{let e=document.getElementById(`t-name`).value.trim();if(!e){b(`Template name is required.`);return}Fe?await window.api.templates.update(Fe,{name:e,blocks:H}):await window.api.templates.create({name:e,blocks:H}),v(),V()}}function Le(){let e=document.getElementById(`template-blocks-list`);e.innerHTML=H.map((e,t)=>`
    <div class="template-block-row">
      <label class="template-block-check">
        <input type="checkbox" data-idx="${t}" class="block-enabled-check" ${e.enabled?`checked`:``}>
        ${Y(Ne[e.type]||e.type)}
      </label>
      <div class="template-block-move">
        <button class="move-up" data-idx="${t}" ${t===0?`disabled`:``}>&uarr;</button>
        <button class="move-down" data-idx="${t}" ${t===H.length-1?`disabled`:``}>&darr;</button>
      </div>
    </div>
    ${e.type===`header`?`
      <div class="template-block-subrow">
        <label class="template-block-subcheck">
          <input type="checkbox" data-idx="${t}" class="header-sub-check" data-field="showCompanyName" ${e.showCompanyName===!1?``:`checked`}>
          Show company name
        </label>
        <label class="template-block-subcheck">
          <input type="checkbox" data-idx="${t}" class="header-sub-check" data-field="showCompanyContact" ${e.showCompanyContact===!1?``:`checked`}>
          Show address/phone/GSTIN
        </label>
        <div class="settings-note" style="margin:4px 0 0;">Turn these off if your letterhead image already shows your branding — the quote number and dates stay either way.</div>
      </div>
    `:``}
  `).join(``),e.querySelectorAll(`.block-enabled-check`).forEach(e=>{e.onchange=()=>{H[Number(e.dataset.idx)].enabled=e.checked}}),e.querySelectorAll(`.header-sub-check`).forEach(e=>{e.onchange=()=>{H[Number(e.dataset.idx)][e.dataset.field]=e.checked}}),e.querySelectorAll(`.move-up`).forEach(e=>{e.onclick=()=>{let t=Number(e.dataset.idx);t!==0&&([H[t-1],H[t]]=[H[t],H[t-1]],Le())}}),e.querySelectorAll(`.move-down`).forEach(e=>{e.onclick=()=>{let t=Number(e.dataset.idx);t!==H.length-1&&([H[t+1],H[t]]=[H[t],H[t+1]],Le())}})}var U=null;async function Re(t){let[n,r,i,a]=await Promise.all([window.api.company.get(),window.api.customers.list(),window.api.templates.list(),window.api.letterheads.list()]),o=null;t&&(o=await window.api.quotations.get(t)),U={company:n,customers:r,editingId:t||null,customerProducts:[],items:o?o.items.map(e=>({...e})):[{product_id:null,description:``,hsn_code:``,qty:1,unit_price:0,gst_rate:18}]},o&&(U.customerProducts=await window.api.quotations.productsForCustomer(o.customer_id)),e.innerHTML=`
    <button class="link-back" id="back-to-quotes">&larr; Back to Quotes</button>
    <div class="builder">
      <div class="builder-main">
        <div class="card">
          <div class="form-row">
            <div class="form-group">
              <label>Customer *</label>
              <select id="b-customer">
                <option value="">Select a customer&hellip;</option>
                ${r.map(e=>`
                  <option value="${e.id}" ${o?.customer_id===e.id?`selected`:``}>
                    ${Y(e.company_name||e.contact_name)} &middot; ${Y(e.contact_name)}
                  </option>
                `).join(``)}
              </select>
            </div>
            <div class="form-group">
              <label>Valid Until</label>
              <input type="date" id="b-valid-until" value="${o?.valid_until||``}">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Template</label>
              <select id="b-template">
                <option value="">Default Layout</option>
                ${i.map(e=>`
                  <option value="${e.id}" ${o?.template_id===e.id?`selected`:``}>${Y(e.name)}</option>
                `).join(``)}
              </select>
            </div>
            <div class="form-group">
              <label>Letterhead</label>
              <select id="b-letterhead">
                <option value="">None</option>
                ${a.map(e=>`
                  <option value="${e.id}" ${o?.letterhead_id===e.id?`selected`:``}>${Y(e.name)}</option>
                `).join(``)}
              </select>
            </div>
          </div>
          <div class="form-group">
            <label>Payment Terms</label>
            <input id="b-payment-terms" value="${X(o?.payment_terms||``)}" placeholder="e.g. Net 30">
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
            <textarea id="b-notes" rows="3">${Y(o?.notes||``)}</textarea>
          </div>
        </div>
      </div>

      <div class="builder-side">
        <div class="card">
          <h3>Summary</h3>
          <div class="form-group">
            <label>Discount (₹)</label>
            <input type="number" id="b-discount" min="0" step="0.01" value="${o?.discount??0}">
          </div>
          <div class="summary-lines" id="summary-lines"></div>
        </div>
        <div class="card actions">
          <button class="btn" id="save-draft-btn">Save as Draft</button>
          <button class="btn btn-primary" id="save-ready-btn">Save &amp; Mark Ready</button>
        </div>
      </div>
    </div>
  `,document.getElementById(`back-to-quotes`).onclick=()=>T(),document.getElementById(`b-customer`).onchange=ze,document.getElementById(`add-line-btn`).onclick=Be,document.getElementById(`b-discount`).oninput=K,document.getElementById(`save-draft-btn`).onclick=()=>He(`Draft`),document.getElementById(`save-ready-btn`).onclick=()=>He(`Ready`),W(),K()}async function ze(){let e=Number(document.getElementById(`b-customer`).value)||null;U.customerProducts=e?await window.api.quotations.productsForCustomer(e):[];let t=U.customers.find(t=>t.id===e);t?.payment_terms&&(document.getElementById(`b-payment-terms`).value=t.payment_terms),W(),K()}function Be(){U.items.push({product_id:null,description:``,hsn_code:``,qty:1,unit_price:0,gst_rate:18}),W(),K()}function Ve(e){U.items.length<=1||(U.items.splice(e,1),W(),K())}function W(){let e=document.getElementById(`line-items-body`),t=U.customerProducts;document.getElementById(`no-customer-note`).classList.toggle(`hidden`,t.length>0||!document.getElementById(`b-customer`).value),e.innerHTML=U.items.map((e,n)=>`
    <tr>
      <td>
        <select data-idx="${n}" class="line-product">
          <option value="">Custom item</option>
          ${t.map(t=>`
            <option value="${t.id}" ${e.product_id===t.id?`selected`:``}>${Y(t.name)}</option>
          `).join(``)}
        </select>
      </td>
      <td><input data-idx="${n}" class="line-description" value="${X(e.description)}" placeholder="Item description"></td>
      <td><input data-idx="${n}" type="number" min="0" step="1" class="line-qty num-input" value="${e.qty}"></td>
      <td><input data-idx="${n}" type="number" min="0" step="0.01" class="line-price num-input" value="${e.unit_price}"></td>
      <td><input data-idx="${n}" type="number" min="0" step="0.01" class="line-gst num-input" value="${e.gst_rate}"></td>
      <td class="num mono">₹${(Number(e.qty)*Number(e.unit_price)).toFixed(2)}</td>
      <td><button class="remove-line" data-idx="${n}">&times;</button></td>
    </tr>
  `).join(``),e.querySelectorAll(`.line-product`).forEach(e=>{e.onchange=()=>{let n=Number(e.dataset.idx),r=t.find(t=>t.id===Number(e.value));r?U.items[n]={...U.items[n],product_id:r.id,description:r.name,hsn_code:r.hsn_code||``,unit_price:r.resolved_price,gst_rate:r.gst_rate}:U.items[n].product_id=null,W(),K()}}),G(e,`.line-description`,`description`,e=>e),G(e,`.line-qty`,`qty`,Number),G(e,`.line-price`,`unit_price`,Number),G(e,`.line-gst`,`gst_rate`,Number),e.querySelectorAll(`.remove-line`).forEach(e=>{e.onclick=()=>Ve(Number(e.dataset.idx))})}function G(e,t,n,r){e.querySelectorAll(t).forEach(e=>{e.oninput=()=>{let t=Number(e.dataset.idx);U.items[t][n]=r(e.value);let i=e.closest(`tr`).querySelector(`.num.mono`),a=U.items[t];i.textContent=`₹${(Number(a.qty)*Number(a.unit_price)).toFixed(2)}`,K()}})}function K(){let e=Number(document.getElementById(`b-customer`).value)||null,t=U.customers.find(t=>t.id===e),n=Number(document.getElementById(`b-discount`).value)||0,r=t&&We(t.state)===We(U.company.state),i=0,a=0,o=0,s=0;U.items.forEach(e=>{let t=Number(e.qty)*Number(e.unit_price);i+=t;let n=Number(e.gst_rate)||0;r?(a+=t*n/200,o+=t*n/200):s+=t*n/100});let c=i-n+a+o+s,l=document.getElementById(`summary-lines`);l.innerHTML=`
    <div class="summary-line"><span>Subtotal</span><span class="mono">₹${i.toFixed(2)}</span></div>
    ${t?r?`<div class="summary-line"><span>CGST</span><span class="mono">₹${a.toFixed(2)}</span></div>
         <div class="summary-line"><span>SGST</span><span class="mono">₹${o.toFixed(2)}</span></div>`:`<div class="summary-line"><span>IGST</span><span class="mono">₹${s.toFixed(2)}</span></div>`:`<div class="inline-note">Select a customer to calculate GST.</div>`}
    <div class="summary-line"><span>Discount</span><span class="mono">−₹${n.toFixed(2)}</span></div>
    <div class="summary-line total"><span>Total</span><span class="mono">₹${c.toFixed(2)}</span></div>
  `}async function He(e){let t=Number(document.getElementById(`b-customer`).value)||null;if(!t){Ue(`Please select a customer.`);return}if(U.items.some(e=>!e.description||Number(e.unit_price)<0||Number(e.qty)<=0)){Ue(`Every line item needs a description, a quantity greater than 0, and a valid price.`);return}let n={customer_id:t,template_id:Number(document.getElementById(`b-template`).value)||null,letterhead_id:Number(document.getElementById(`b-letterhead`).value)||null,valid_until:document.getElementById(`b-valid-until`).value||null,payment_terms:document.getElementById(`b-payment-terms`).value.trim(),notes:document.getElementById(`b-notes`).value.trim(),discount:Number(document.getElementById(`b-discount`).value)||0,status:e,items:U.items};U.editingId?await window.api.quotations.update(U.editingId,n):await window.api.quotations.create(n),T()}function Ue(e){let t=document.querySelector(`.builder .form-error`);t||(t=document.createElement(`div`),t.className=`form-error`,document.querySelector(`.builder-main`).prepend(t)),t.textContent=e}function We(e){return String(e||``).trim().toLowerCase()}var Ge=document.getElementById(`company-switcher-btn`),q=document.getElementById(`company-switcher-menu`),Ke=document.getElementById(`active-company-name`);function qe(e){document.documentElement.style.setProperty(`--primary`,e||`#004ac6`)}async function J(){let e=await window.api.company.get();e&&(Ke.textContent=e.name,qe(e.theme_color))}async function Je(){await J(),Ge.onclick=async e=>{if(e.stopPropagation(),!q.classList.contains(`hidden`)){q.classList.add(`hidden`);return}await Ye(),q.classList.remove(`hidden`)},document.addEventListener(`click`,e=>{e.target.closest(`.company-switcher`)||q.classList.add(`hidden`)})}async function Ye(){q.innerHTML=`
    <div class="csm-header">Your Business Profiles</div>
    ${(await window.api.companies.list()).map(e=>`
      <div class="company-option ${e.is_active?`active`:``}" data-id="${e.id}">
        <span class="company-option-select" data-id="${e.id}">
          <span class="company-option-dot" style="background:${X(e.theme_color||`#004ac6`)}"></span>
          <span class="company-option-name">
            ${Y(e.name)}
            ${e.gst_number?`<span class="company-option-gstin">${Y(e.gst_number)}</span>`:``}
          </span>
        </span>
        <span class="company-option-right">
          ${e.is_active?`<span class="company-active-check" title="Active">✓</span>`:`<button class="company-delete-btn delete-company-option" data-id="${e.id}" title="Delete this profile">✕</button>`}
        </span>
      </div>
    `).join(``)}
    <div class="company-switcher-divider"></div>
    <div class="company-switcher-add" id="add-company-option">
      <span class="csm-add-icon">＋</span> Add New Business Profile
    </div>
  `,q.querySelectorAll(`.company-option-select`).forEach(e=>{e.onclick=async()=>{let t=Number(e.dataset.id),n=(await window.api.companies.list()).find(e=>e.id===t);if(n&&n.is_active){q.classList.add(`hidden`);return}await window.api.companies.setActive(t),q.classList.add(`hidden`),await J();let r=document.querySelector(`.nav-item.active`);h(r?r.dataset.view:`dashboard`)}}),q.querySelectorAll(`.delete-company-option`).forEach(e=>{e.onclick=async t=>{t.stopPropagation();let n=Number(e.dataset.id);q.classList.add(`hidden`),y(`Delete this company profile? All associated data (customers, products, invoices) will be permanently removed.`,async()=>{let e=await window.api.companies.delete(n);if(!e.success)x(e.reason,`Cannot Delete`);else{await J();let e=document.querySelector(`.nav-item.active`);h(e?e.dataset.view:`dashboard`)}},`Delete Profile`)}}),document.getElementById(`add-company-option`).onclick=()=>{q.classList.add(`hidden`),Xe()}}function Xe(){_(`
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
  `),i.querySelectorAll(`.csm-preset`).forEach(e=>{e.onclick=()=>{document.getElementById(`nc-color`).value=e.dataset.color}}),document.getElementById(`nc-name`).addEventListener(`keydown`,e=>{e.key===`Enter`&&document.getElementById(`create-company-btn`).click()}),document.getElementById(`create-company-btn`).onclick=async()=>{let e=document.getElementById(`nc-name`).value.trim();if(!e){b(`Please enter a company name to continue.`);return}let t=document.getElementById(`create-company-btn`);t.disabled=!0,t.textContent=`Creating…`;let n=await window.api.companies.create({name:e,theme_color:document.getElementById(`nc-color`).value});await window.api.companies.setActive(n.id),v(),await J(),h(`settings`)}}function Y(e){return String(e).replace(/[&<>"']/g,e=>({"&":`&amp;`,"<":`&lt;`,">":`&gt;`,'"':`&quot;`,"'":`&#39;`})[e])}function X(e){return Y(e)}var Ze={quotation:()=>window.api.quotations,invoice:()=>window.api.invoices,challan:()=>window.api.challans,note:()=>window.api.creditDebitNotes},Qe={quotation:!0,invoice:!0,challan:!1,note:!0},$e=null;function Z(){document.querySelectorAll(`.export-dropdown`).forEach(e=>{e._closeHandler&&document.removeEventListener(`click`,e._closeHandler,{capture:!0}),e.remove()}),document.querySelectorAll(`.export-menu-btn.open`).forEach(e=>e.classList.remove(`open`)),$e=null}function et(e,t,n){if($e===e){Z();return}Z(),$e=e;let r=e.querySelector(`.export-menu-btn`);r.classList.add(`open`);let i=Ze[t]?.();if(!i)return;let a=Qe[t],o=document.createElement(`div`);o.className=`export-dropdown`,[{cls:`edi-preview`,label:`Preview`,action:async()=>{await i.previewPdf(n)}},{cls:`edi-pdf`,label:`Export PDF`,action:async()=>{Q(r,!0),await i.exportPdf(n),Q(r,!1)}},{cls:`edi-word`,label:`Export Word (.docx)`,action:async()=>{Q(r,!0),await i.exportWord(n),Q(r,!1)}},a&&{cls:`edi-excel`,label:`Export Excel (.xlsx)`,action:async()=>{Q(r,!0),await i.exportExcel(n),Q(r,!1)}},{cls:`edi-share`,label:`Share via WhatsApp`,action:()=>tt(t,n)}].filter(Boolean).forEach(e=>{let t=document.createElement(`button`);t.className=`export-dropdown-item ${e.cls}`,t.innerHTML=`<span>${e.label}</span>`,t.onclick=async()=>{Z(),await e.action()},o.appendChild(t)}),o.style.position=`fixed`,o.style.zIndex=`9999`,document.body.appendChild(o);let s=r.getBoundingClientRect(),c=s.bottom+5,l=s.right-200;l<8&&(l=8),l+200>window.innerWidth-8&&(l=window.innerWidth-200-8),c+260>window.innerHeight&&(c=s.top-260),o.style.top=c+`px`,o.style.left=l+`px`;let u=e=>{!o.contains(e.target)&&e.target!==r&&Z()};setTimeout(()=>{document.addEventListener(`click`,u,{capture:!0}),document.addEventListener(`scroll`,Z,{once:!0,passive:!0,capture:!0}),o._closeHandler=u},0)}function Q(e,t){t?(e.dataset.origText=e.innerHTML,e.innerHTML=`Working… <span class="chevron">▾</span>`,e.disabled=!0):(e.innerHTML=e.dataset.origText||`Export <span class="chevron">▾</span>`,e.disabled=!1)}async function tt(e,t){let n=Ze[e]?.();if(n){if(navigator.share)try{await n.exportPdf(t),await navigator.share({title:`QuoteFlow Document`,text:`Please find the attached document from QuoteFlow.`});return}catch(e){e.name!==`AbortError`&&console.error(`Share failed:`,e);return}window.open(`https://web.whatsapp.com/send?text=Please%20find%20the%20attached%20document%20from%20QuoteFlow.`,`_blank`)}}function $(){document.querySelectorAll(`.export-menu-btn`).forEach(e=>{e.addEventListener(`click`,t=>{t.stopPropagation();let n=e.closest(`.export-wrap`),r=e.dataset.doctype;et(n,r,Number(e.dataset.id))})})}Je(),h(`customers`);