/* ============================================================
   AN TRADERS — Admin Panel JavaScript (Fixed & Complete)
============================================================ */
const API_URL = 'https://antraders-live.onrender.com/api';

const token = localStorage.getItem('admin_token');
if (!token) window.location.href = 'login.html';

function getAuthHeaders() {
    return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
}

// ── Overrides HTML inline functions ──────────────────────────
function logout() {
    localStorage.removeItem('admin_token');
    window.location.href = 'login.html';
}

function showSection(section, el) {
    // Hide all sections
    document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
    document.getElementById(section + '-section').classList.add('active');

    // Update sidebar active state
    document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));
    if (el) el.classList.add('active');

    // Update top header title
    const titles = {
        dashboard: '<i class="fa-solid fa-chart-pie" style="color:#2563eb;margin-right:8px;"></i>Dashboard Overview',
        products:  '<i class="fa-solid fa-box-open" style="color:#2563eb;margin-right:8px;"></i>Products',
        customers: '<i class="fa-solid fa-users" style="color:#7c3aed;margin-right:8px;"></i>Customers',
        orders:    '<i class="fa-solid fa-receipt" style="color:#f97316;margin-right:8px;"></i>Orders',
        settings:  '<i class="fa-solid fa-sliders" style="color:#2563eb;margin-right:8px;"></i>Settings',
    };
    const hdr = document.getElementById('header-title');
    if (hdr) hdr.innerHTML = titles[section] || section;

    // Load data for selected section
    if (section === 'orders') fetchOrders(true);
    if (section === 'customers') fetchCustomers();
    if (section === 'dashboard') { fetchDashboardStats(); fetchOrders(false); }
}

function resetForm() {
    document.getElementById('add-product-form').reset();
    document.getElementById('product-id').value = '';
    document.getElementById('form-title').textContent = 'Add New Product';
    const submitBtn = document.getElementById('submit-btn');
    submitBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Save Product';
    document.getElementById('cancel-btn').style.display = 'none';
    [1,2,3,4].forEach(i => {
        const f = document.getElementById('img-file-' + i);
        if (f) f.value = '';
    });
}

// ── Toast notification ────────────────────────────────────────
function showToast(message, type = 'success') {
    let toast = document.getElementById('admin-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'admin-toast';
        toast.style.cssText = `
            position:fixed; bottom:2rem; right:2rem; z-index:9999;
            padding:1rem 1.5rem; border-radius:12px; font-family:Inter,sans-serif;
            font-size:0.9rem; font-weight:600; display:flex; align-items:center;
            gap:0.6rem; box-shadow:0 8px 24px rgba(0,0,0,0.15);
            transform:translateY(100px); transition:transform 0.3s ease;
            max-width:360px;
        `;
        document.body.appendChild(toast);
    }
    const colors = {
        success: { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0', icon: '✅' },
        error:   { bg: '#fef2f2', color: '#dc2626', border: '#fecaca', icon: '❌' },
        info:    { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe', icon: 'ℹ️' },
    };
    const c = colors[type] || colors.success;
    toast.style.background = c.bg;
    toast.style.color = c.color;
    toast.style.border = `1px solid ${c.border}`;
    toast.innerHTML = `${c.icon} ${message}`;
    toast.style.transform = 'translateY(0)';
    setTimeout(() => { toast.style.transform = 'translateY(100px)'; }, 3000);
}

// ── Boot ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    fetchDashboardStats();
    fetchOrders(false);
    fetchProducts();
    fetchCustomers();
    fetchSettings();
    setupProductForm();
    setupSettingsForm();

    // Live clock
    function tick() {
        const el = document.getElementById('live-time');
        if (el) {
            const now = new Date();
            el.textContent = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                + ' | ' + now.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
        }
    }
    tick();
    setInterval(tick, 1000);
});

// ── Dashboard Stats ───────────────────────────────────────────
async function fetchDashboardStats() {
    try {
        const res = await fetch(`${API_URL}/stats`, { headers: getAuthHeaders() });
        if (res.status === 401) return logout();
        const stats = await res.json();
        document.getElementById('total-products').textContent  = stats.total_products;
        document.getElementById('pending-orders').textContent  = stats.pending_orders;
        document.getElementById('total-revenue').textContent   = `₹${parseFloat(stats.total_revenue).toFixed(2)}`;
        document.getElementById('total-customers').textContent = stats.total_customers;
    } catch (e) { console.error('Stats error:', e); }
}

// ── Orders ────────────────────────────────────────────────────
async function fetchOrders(fillAllTable) {
    try {
        const res = await fetch(`${API_URL}/orders`, { headers: getAuthHeaders() });
        if (res.status === 401) return logout();
        const orders = await res.json();

        const statusMap = {
            'Pending':   'status-pending',
            'Delivered': 'status-delivered',
            'Cancelled': 'status-cancelled'
        };

        const renderRows = (list) => list.length === 0
            ? '<tr><td colspan="5"><div class="empty-state"><i class="fa-solid fa-receipt"></i><p>No orders yet</p></div></td></tr>'
            : list.map(o => {
                const cls  = statusMap[o.status] || 'status-pending';
                const date = o.created_at ? new Date(o.created_at).toLocaleDateString('en-IN') : '—';
                return `<tr>
                    <td><strong>#${String(o.id).padStart(3,'0')}</strong></td>
                    <td>${o.customer_name || '—'}</td>
                    <td><strong>₹${parseFloat(o.amount).toFixed(2)}</strong></td>
                    <td><span class="status-badge ${cls}">${o.status}</span></td>
                    <td>${date}</td>
                </tr>`;
            }).join('');

        const dashTbl = document.getElementById('orders-table-body');
        if (dashTbl) dashTbl.innerHTML = renderRows(orders.slice(0, 10));

        if (fillAllTable) {
            const allTbl = document.getElementById('all-orders-table-body');
            if (allTbl) allTbl.innerHTML = renderRows(orders);
        }
    } catch (e) { console.error('Orders error:', e); }
}

// ── Customers ─────────────────────────────────────────────────
async function fetchCustomers() {
    try {
        const res = await fetch(`${API_URL}/customers`, { headers: getAuthHeaders() });
        if (res.status === 401) return logout();
        const customers = await res.json();

        const countEl = document.getElementById('customer-count');
        if (countEl) countEl.textContent = `${customers.length} customers`;

        const tbl = document.getElementById('customers-table-body');
        if (!tbl) return;

        if (!customers.length) {
            tbl.innerHTML = '<tr><td colspan="5"><div class="empty-state"><i class="fa-solid fa-users"></i><p>No customers registered yet</p></div></td></tr>';
            return;
        }
        tbl.innerHTML = customers.map((c, i) => {
            const reg = c.created_at ? new Date(c.created_at).toLocaleDateString('en-IN') : '—';
            const initials = (c.name || 'U')[0].toUpperCase();
            return `<tr>
                <td><strong>#${i+1}</strong></td>
                <td>
                    <span style="display:flex;align-items:center;gap:8px;">
                        <span style="width:30px;height:30px;border-radius:50%;background:linear-gradient(135deg,#7c3aed,#a78bfa);display:flex;align-items:center;justify-content:center;color:white;font-size:0.75rem;font-weight:700;flex-shrink:0;">${initials}</span>
                        ${c.name}
                    </span>
                </td>
                <td>${c.email}</td>
                <td>${c.phone || '<span style="color:#94a3b8;">—</span>'}</td>
                <td>${reg}</td>
            </tr>`;
        }).join('');
    } catch (e) { console.error('Customers error:', e); }
}

// ── Products ──────────────────────────────────────────────────
let allProducts = [];

async function fetchProducts() {
    try {
        const res = await fetch(`${API_URL}/products`);
        allProducts = await res.json();

        const countEl = document.getElementById('product-count');
        if (countEl) countEl.textContent = `${allProducts.length} items`;

        const tbl = document.getElementById('products-table-body');
        if (!tbl) return;

        if (!allProducts.length) {
            tbl.innerHTML = '<tr><td colspan="6"><div class="empty-state"><i class="fa-solid fa-box-open"></i><p>No products added yet. Use the form above to add your first product.</p></div></td></tr>';
            return;
        }

        tbl.innerHTML = allProducts.map(p => {
            const img = (p.images && p.images.length) ? p.images[0].image_url : '';
            const stockBadge = p.stock > 0
                ? `<span style="color:#16a34a;font-weight:700;">${p.stock}</span>`
                : `<span style="color:#dc2626;font-weight:700;">0 <small>(Out)</small></span>`;
            const discHtml = p.discount_rupees > 0
                ? `<span style="color:#dc2626;font-weight:600;">-₹${parseFloat(p.discount_rupees).toFixed(0)}</span>`
                : `<span style="color:#94a3b8;">—</span>`;

            return `<tr>
                <td>
                    <div class="product-name-cell">
                        <div class="product-thumb" style="${img ? `background-image:url('${img}')` : ''}"></div>
                        <span style="font-weight:600;color:#0f172a;">${p.name}</span>
                    </div>
                </td>
                <td><span style="background:#eff6ff;color:#2563eb;padding:3px 10px;border-radius:20px;font-size:0.78rem;font-weight:700;">${p.category || '—'}</span></td>
                <td><strong>₹${parseFloat(p.price).toFixed(2)}</strong></td>
                <td>${discHtml}</td>
                <td>${stockBadge}</td>
                <td>
                    <div style="display:flex;gap:6px;">
                        <button class="btn-edit" onclick="editProduct(${p.id})"><i class="fa-solid fa-pen"></i> Edit</button>
                        <button class="btn-danger" onclick="deleteProduct(${p.id})"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </td>
            </tr>`;
        }).join('');
    } catch (e) { console.error('Products error:', e); }
}

// ── Product Form Submit (Add/Edit) ────────────────────────────
function setupProductForm() {
    const form = document.getElementById('add-product-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = document.getElementById('submit-btn');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
        submitBtn.disabled = true;

        try {
            // Handle images
            const imgUrls = [];
            for (let i = 1; i <= 4; i++) {
                const fileInput  = document.getElementById(`img-file-${i}`);
                const urlInput   = document.getElementById(`img-url-${i}`);
                const colorInput = document.getElementById(`img-color-${i}`);
                const colorVal   = colorInput.value.trim() || null;

                if (fileInput && fileInput.files.length > 0) {
                    const formData = new FormData();
                    formData.append('file', fileInput.files[0]);
                    try {
                        const uploadRes = await fetch(`${API_URL}/upload-image`, {
                            method: 'POST',
                            headers: { 'Authorization': `Bearer ${token}` },
                            body: formData
                        });
                        if (uploadRes.ok) {
                            const data = await uploadRes.json();
                            imgUrls.push({ url: data.url, color: colorVal });
                        } else {
                            showToast(`Image ${i} upload failed`, 'error');
                            submitBtn.innerHTML = originalText;
                            submitBtn.disabled = false;
                            return;
                        }
                    } catch {
                        showToast(`Image ${i} upload error`, 'error');
                        submitBtn.innerHTML = originalText;
                        submitBtn.disabled = false;
                        return;
                    }
                } else if (urlInput && urlInput.value.trim()) {
                    imgUrls.push({ url: urlInput.value.trim(), color: colorVal });
                }
            }

            const productId = document.getElementById('product-id').value;
            const payload = {
                name:            document.getElementById('product-name').value.trim(),
                category:        document.getElementById('product-category').value,
                price:           parseFloat(document.getElementById('product-price').value),
                discount_rupees: parseFloat(document.getElementById('product-discount').value || 0),
                stock:           parseInt(document.getElementById('product-stock').value || 0),
                is_trending:     document.getElementById('product-trending').checked,
                sizes:           document.getElementById('product-sizes').value.trim() || null,
                colors:          document.getElementById('product-colors').value.trim() || null,
                description:     document.getElementById('product-description').value.trim() || null,
                image_data:      imgUrls
            };

            const url    = productId ? `${API_URL}/products/${productId}` : `${API_URL}/products`;
            const method = productId ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: getAuthHeaders(),
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                showToast(productId ? '✏️ Product updated successfully!' : '🎉 Product added successfully!');
                resetForm();
                fetchProducts();
                fetchDashboardStats();
            } else {
                const err = await res.json().catch(() => ({}));
                showToast(err.detail || 'Failed to save product', 'error');
            }
        } catch (err) {
            console.error('Product save error:', err);
            showToast('An error occurred. Check console.', 'error');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });
}

// ── Edit Product ──────────────────────────────────────────────
function editProduct(id) {
    const p = allProducts.find(x => x.id === id);
    if (!p) return;

    // Switch to products section
    showSection('products', document.getElementById('nav-products'));

    // Scroll form to top
    setTimeout(() => {
        const formPanel = document.getElementById('add-product-form');
        if (formPanel) formPanel.closest('.panel').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);

    document.getElementById('form-title').textContent = `Edit: ${p.name}`;
    document.getElementById('product-id').value         = p.id;
    document.getElementById('product-name').value       = p.name;
    document.getElementById('product-category').value   = p.category || 'Kurti';
    document.getElementById('product-price').value      = p.price;
    document.getElementById('product-discount').value   = p.discount_rupees || 0;
    document.getElementById('product-stock').value      = p.stock || 0;
    document.getElementById('product-trending').checked = p.is_trending || false;
    document.getElementById('product-sizes').value      = p.sizes || '';
    document.getElementById('product-colors').value     = p.colors || '';
    document.getElementById('product-description').value = p.description || '';

    // Reset image fields then fill
    [1,2,3,4].forEach(i => {
        document.getElementById(`img-url-${i}`).value   = '';
        document.getElementById(`img-color-${i}`).value = '';
        const f = document.getElementById(`img-file-${i}`);
        if (f) f.value = '';
    });
    if (p.images) {
        p.images.slice(0, 4).forEach((img, i) => {
            document.getElementById(`img-url-${i+1}`).value   = img.image_url || '';
            document.getElementById(`img-color-${i+1}`).value = img.color_name || '';
        });
    }

    const submitBtn = document.getElementById('submit-btn');
    submitBtn.innerHTML = '<i class="fa-solid fa-pen-to-square"></i> Update Product';
    document.getElementById('cancel-btn').style.display = 'inline-flex';
}

// ── Delete Product ────────────────────────────────────────────
async function deleteProduct(id) {
    const p = allProducts.find(x => x.id === id);
    if (!confirm(`Delete "${p ? p.name : 'this product'}"? This cannot be undone.`)) return;
    try {
        const res = await fetch(`${API_URL}/products/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        if (res.ok) {
            showToast('🗑️ Product deleted');
            fetchProducts();
            fetchDashboardStats();
        } else {
            showToast('Failed to delete product', 'error');
        }
    } catch (e) {
        showToast('Server error', 'error');
    }
}

// ── Settings ──────────────────────────────────────────────────
async function fetchSettings() {
    try {
        const res = await fetch(`${API_URL}/settings`);
        if (!res.ok) return;
        const s = await res.json();

        const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
        set('set-name',      s.business_name);
        set('set-ceo',       s.ceo_name);
        set('set-partner',   s.partner_name);
        set('set-phone',     s.phone);
        set('set-email',     s.email);
        set('set-address',   s.address);
        set('set-map',       s.map_embed_url);
        set('set-facebook',  s.facebook_url);
        set('set-instagram', s.instagram_url);
        set('set-youtube',   s.youtube_url);
        set('set-twitter',   s.twitter_url);
    } catch (e) { console.error('Settings fetch error:', e); }
}

function setupSettingsForm() {
    const form = document.getElementById('settings-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = form.querySelector('button[type="submit"]');
        const orig = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
        submitBtn.disabled = true;

        try {
            const get = (id) => { const el = document.getElementById(id); return el ? el.value.trim() : ''; };
            const payload = {
                business_name: get('set-name'),
                ceo_name:      get('set-ceo')      || null,
                partner_name:  get('set-partner')  || null,
                phone:         get('set-phone'),
                email:         get('set-email'),
                address:       get('set-address'),
                map_embed_url: get('set-map')       || null,
                facebook_url:  get('set-facebook')  || null,
                instagram_url: get('set-instagram') || null,
                youtube_url:   get('set-youtube')   || null,
                twitter_url:   get('set-twitter')   || null,
            };

            const res = await fetch(`${API_URL}/settings`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                showToast('⚙️ Settings saved! Changes live on store now.');
            } else {
                const err = await res.json().catch(() => ({}));
                showToast(err.detail || 'Failed to save settings', 'error');
            }
        } catch (err) {
            showToast('Server error', 'error');
        } finally {
            submitBtn.innerHTML = orig;
            submitBtn.disabled = false;
        }
    });
}
