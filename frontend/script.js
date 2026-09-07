const API_URL = 'https://antraders-live.onrender.com/api';
let WHATSAPP_NUMBER = '919876543210';
let cart = [];

const translations = {
    en: {
        nav_home: "Home", nav_products: "Products", nav_about: "About Us", nav_contact: "Contact",
        hero_title: "Welcome to AN Traders",
        hero_desc: "Your one-stop destination for premium quality products. Experience the best in class service and unbeatable prices.",
        btn_explore: "Explore Products",
        featured_title: "Our Featured Products",
        about_title: "About Us",
        about_desc: "At AN Traders, we believe in providing top-tier products directly to you without compromising on quality or service.",
        ceo_title: "CEO", partner_title: "Partner",
        contact_title: "Get In Touch",
        address: "Address",
        footer_rights: "All rights reserved.",
        add_to_cart: "Add to Cart",
        out_of_stock: "Out of Stock"
    },
    hi: {
        nav_home: "होम", nav_products: "उत्पाद", nav_about: "हमारे बारे में", nav_contact: "संपर्क करें",
        hero_title: "AN Traders में आपका स्वागत है",
        hero_desc: "प्रीमियम गुणवत्ता वाले उत्पादों के लिए आपका वन-स्टॉप गंतव्य। सर्वोत्तम सेवा और अजेय कीमतों का अनुभव करें।",
        btn_explore: "उत्पाद देखें",
        featured_title: "हमारे विशेष उत्पाद",
        about_title: "हमारे बारे में",
        about_desc: "AN Traders में, हम गुणवत्ता या सेवा से समझौता किए बिना आपको सीधे शीर्ष-स्तरीय उत्पाद प्रदान करने में विश्वास करते हैं।",
        ceo_title: "सीईओ", partner_title: "पार्टनर",
        contact_title: "संपर्क करें",
        address: "पता",
        footer_rights: "सर्वाधिकार सुरक्षित।",
        add_to_cart: "कार्ट में डालें",
        out_of_stock: "स्टॉक में नहीं"
    },
    gu: {
        nav_home: "ઘર", nav_products: "ઉત્પાદનો", nav_about: "અમારા વિશે", nav_contact: "સંપર્ક કરો",
        hero_title: "AN Traders માં તમારું સ્વાગત છે",
        hero_desc: "પ્રીમિયમ ગુણવત્તાવાળા ઉત્પાદનો માટે તમારું વન-સ્ટોપ ગંતવ્ય. શ્રેષ્ઠ સેવા અને અજેય કિંમતોનો અનુભવ કરો.",
        btn_explore: "ઉત્પાદનો શોધો",
        featured_title: "અમારા વિશેષ ઉત્પાદનો",
        about_title: "અમારા વિશે",
        about_desc: "AN Traders માં, અમે ગુણવત્તા અથવા સેવા સાથે બાંધછોડ કર્યા વિના તમને સીધા જ ટોચના-સ્તરના ઉત્પાદનો પ્રદાન કરવામાં માનીએ છીએ.",
        ceo_title: "સીઈઓ", partner_title: "ભાગીદાર",
        contact_title: "સંપર્ક કરો",
        address: "સરનામું",
        footer_rights: "સર્વાધિકાર સુરક્ષિત.",
        add_to_cart: "કાર્ટમાં ઉમેરો",
        out_of_stock: "સ્ટોક નથી"
    }
};

let currentLang = 'en';

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if(target) target.scrollIntoView({ behavior: 'smooth' });
        });
    });

    const langSwitcher = document.getElementById('lang-switcher');
    if (langSwitcher) {
        langSwitcher.addEventListener('change', (e) => {
            currentLang = e.target.value;
            applyTranslations();
            fetchProducts();
        });
    }

    // Authentication check
    const token = localStorage.getItem('customer_token');
    const authBtn = document.getElementById('user-auth-btn');
    if (token) {
        authBtn.innerHTML = '<i class="fa-solid fa-sign-out-alt"></i>';
        authBtn.title = "Logout";
        authBtn.href = "#";
        authBtn.onclick = () => {
            localStorage.removeItem('customer_token');
            window.location.reload();
        };
    }

    fetchSettings();
    fetchProducts();
    setupCart();
    applyTranslations();
});

function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[currentLang][key]) {
            // Keep original inner text for dynamics if it's not purely static
            if (el.id !== 'dyn-address' && el.id !== 'hero-biz-name') {
                el.innerText = translations[currentLang][key];
            }
        }
    });
}

async function fetchSettings() {
    try {
        const response = await fetch(`${API_URL}/settings`);
        const settings = await response.json();
        
        if(document.getElementById('nav-biz-name')) document.getElementById('nav-biz-name').innerText = settings.business_name;
        if(document.getElementById('hero-biz-name')) document.getElementById('hero-biz-name').innerText = settings.business_name;
        if(document.getElementById('footer-biz-name')) document.getElementById('footer-biz-name').innerText = settings.business_name;
        if(document.getElementById('dyn-phone-top')) document.getElementById('dyn-phone-top').innerText = settings.phone;

        if(settings.ceo_name) {
            document.getElementById('ceo-box').style.display = 'block';
            document.getElementById('dyn-ceo').innerText = settings.ceo_name;
        }
        if(settings.partner_name) {
            document.getElementById('partner-box').style.display = 'block';
            document.getElementById('dyn-partner').innerText = settings.partner_name;
        }
        
        document.getElementById('dyn-address').innerText = settings.address;
        document.getElementById('dyn-phone').innerText = settings.phone;
        document.getElementById('dyn-email').innerText = settings.email;
        
        if(settings.map_embed_url) {
            document.getElementById('dyn-map').src = settings.map_embed_url;
        }
        
        const socials = ['facebook', 'instagram', 'twitter', 'youtube'];
        socials.forEach(s => {
            if (settings[`${s}_url`]) {
                const el = document.getElementById(`dyn-${s}`);
                if(el) {
                    el.href = settings[`${s}_url`];
                    el.style.display = 'inline-block';
                }
            }
        });
        
        WHATSAPP_NUMBER = settings.phone.replace(/\D/g, '');
        document.getElementById('wa-float-btn').href = `https://wa.me/${WHATSAPP_NUMBER}`;
        
    } catch (e) {
        console.error('Error fetching settings:', e);
    }
}

let allFetchedProducts = [];
let currentCategory = 'all';

function createProductCardHtml(product) {
    let finalPrice = product.price;
    let priceHtml = `<div class="price"><span class="price-final">₹${product.price.toFixed(2)}</span></div>`;
    if (product.discount_rupees > 0) {
        finalPrice = product.price - product.discount_rupees;
        const disc = Math.round((product.discount_rupees / product.price) * 100);
        priceHtml = `<div class="price">
            <span class="price-final">₹${finalPrice.toFixed(2)}</span>
            <span class="price-original">₹${product.price.toFixed(2)}</span>
            <span class="price-discount">${disc}% OFF</span>
        </div>`;
    }
    
    let imgUrl = '';
    if (product.images && product.images.length > 0) {
        imgUrl = product.images[0].image_url;
    }
    
    const catBadge = product.category ? `<span class="cat-badge">${product.category}</span>` : '';
    const outBadge = product.stock <= 0 ? `<span class="stock-out-badge">Out of Stock</span>` : '';
    const trendBadge = product.is_trending ? `<span class="cat-badge" style="background:#f97316; top:10px; right:10px; left:auto;">🔥 Hot</span>` : '';

    return `
        <div class="product-card" onclick="openProductModal(${product.id})">
            ${catBadge}
            ${trendBadge}
            ${outBadge}
            <div class="product-img" 
                 style="${imgUrl ? `background-image:url('${imgUrl}'); background-size:cover; background-position:top;` : 'background:#f1f5f9;'}"
            ></div>
            <div class="product-info">
                <h3>${product.name}</h3>
                ${priceHtml}
            </div>
        </div>
    `;
}

function renderProducts(products) {
    const productList = document.getElementById('product-list');
    if (!productList) return;

    if (products.length === 0) {
        productList.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:4rem; color:#94a3b8;">
            <i class="fa-solid fa-box-open" style="font-size:3rem; margin-bottom:1rem; display:block;"></i>
            <p style="font-size:1.1rem;">No products found.</p>
        </div>`;
        return;
    }

    productList.innerHTML = products.map(createProductCardHtml).join('');
}

function renderTrending(products) {
    const section = document.getElementById('trending-section');
    const container = document.getElementById('trending-container');
    if (!section || !container) return;

    const trending = products.filter(p => p.is_trending);
    
    if (trending.length > 0) {
        section.style.display = 'block';
        // Add a wrapper to the card for the horizontal scrolling context so they don't stretch
        container.innerHTML = trending.map(p => `
            <div style="flex: 0 0 280px; scroll-snap-align: start;">
                ${createProductCardHtml(p)}
            </div>
        `).join('');
    } else {
        section.style.display = 'none';
        container.innerHTML = '';
    }
}

async function fetchProducts() {
    try {
        const response = await fetch(`${API_URL}/products`);
        const products = await response.json();
        allFetchedProducts = products;
        renderProducts(products);
        renderTrending(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        const productList = document.getElementById('product-list');
        if (productList) productList.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:#94a3b8;">Failed to load products.</p>';
    }
}

function filterCategory(cat, btnEl) {
    currentCategory = cat;
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    if (btnEl) btnEl.classList.add('active');
    
    const filtered = cat === 'all' ? allFetchedProducts : allFetchedProducts.filter(p => p.category === cat);
    renderProducts(filtered);
    const section = document.getElementById('products');
    if(section) section.scrollIntoView({behavior:'smooth'});
}

function searchProducts() {
    const q = (document.getElementById('search-input')?.value || '').toLowerCase();
    const filtered = allFetchedProducts.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.category && p.category.toLowerCase().includes(q))
    );
    renderProducts(filtered);
    const section = document.getElementById('products');
    if(section) section.scrollIntoView({behavior:'smooth'});
}

function setModalMainImage(url) {
    document.getElementById('modal-main-img').style.backgroundImage = `url('${url}')`;
    document.querySelectorAll('.thumb').forEach(t => t.classList.remove('active'));
    event?.target?.classList?.add('active');
}

function openProductModal(id) {
    const p = allFetchedProducts.find(x => x.id === id);
    if(!p) return;
    
    document.getElementById('modal-title').innerText = p.name;
    document.getElementById('modal-desc').innerText = p.description || '';
    
    let finalPrice = p.price;
    if (p.discount_rupees > 0) {
        finalPrice = p.price - p.discount_rupees;
        document.getElementById('modal-price').innerHTML = `<span style="text-decoration:line-through; color:#888; font-size:1.2rem; margin-right:10px;">₹${p.price.toFixed(2)}</span> ₹${finalPrice.toFixed(2)}`;
    } else {
        document.getElementById('modal-price').innerText = `₹${p.price.toFixed(2)}`;
    }
    
    // Images
    const mainImg = document.getElementById('modal-main-img');
    const thumbContainer = document.getElementById('modal-thumbnails');
    thumbContainer.innerHTML = '';
    
    if (p.images && p.images.length > 0) {
        mainImg.style.backgroundImage = `url('${p.images[0].image_url}')`;
        p.images.forEach((img, i) => {
            const activeClass = i === 0 ? 'active' : '';
            thumbContainer.innerHTML += `<div class="thumb ${activeClass}" style="background-image:url('${img.image_url}')" onclick="setModalMainImage('${img.image_url}')"></div>`;
        });
    } else {
        mainImg.style.backgroundImage = 'none';
    }
    
    // Attributes (Size/Color)
    let sizeOptions = '', colorOptions = '';
    if (p.sizes) {
        const sizes = p.sizes.split(',').map(s => s.trim());
        sizeOptions = `<select id="modal-size" class="attr-select" style="padding: 1rem;"><option value="">Select Size</option>` + sizes.map(s => `<option value="${s}">${s}</option>`).join('') + `</select>`;
    }
    if (p.colors) {
        const colors = p.colors.split(',').map(c => c.trim());
        colorOptions = `<select id="modal-color" class="attr-select" style="padding: 1rem;"><option value="">Select Color</option>` + colors.map(c => `<option value="${c}">${c}</option>`).join('') + `</select>`;
    }
    document.getElementById('modal-attrs').innerHTML = sizeOptions + colorOptions;
    
    // Switch image on color change
    const colorSelect = document.getElementById('modal-color');
    if (colorSelect && p.images) {
        colorSelect.addEventListener('change', (e) => {
            const selectedColor = e.target.value.toLowerCase();
            const matchedImg = p.images.find(img => img.color_name && img.color_name.toLowerCase() === selectedColor);
            if (matchedImg) {
                setModalMainImage(matchedImg.image_url);
            }
        });
    }
    
    // Button
    const btn = document.getElementById('modal-add-btn');
    const waBtn = document.getElementById('modal-wa-btn');
    if (p.stock > 0) {
        btn.innerText = translations[currentLang].add_to_cart || "Add to Cart";
        btn.className = 'btn-modal-primary';
        btn.onclick = () => addToCart(p.id, p.name, finalPrice);
        
        waBtn.style.display = 'flex';
        waBtn.onclick = () => shareOnWhatsApp(p.name, finalPrice);
    } else {
        btn.innerText = translations[currentLang].out_of_stock || "Out of Stock";
        btn.className = 'btn-modal-primary';
        btn.style.background = '#94a3b8';
        btn.style.cursor = 'not-allowed';
        btn.onclick = null;
        waBtn.style.display = 'none';
    }
    
    document.getElementById('product-modal').style.display = 'block';
}

function shareOnWhatsApp(name, price) {
    let size = '', color = '';
    const sizeEl = document.getElementById(`modal-size`);
    const colorEl = document.getElementById(`modal-color`);
    
    if (sizeEl) size = sizeEl.value;
    if (colorEl) color = colorEl.value;
    
    if (sizeEl && !size) { alert("Please select a size first"); return; }
    if (colorEl && !color) { alert("Please select a color first"); return; }
    
    let itemName = name;
    if (size || color) itemName += ` (${size}${size && color ? ', ' : ''}${color})`;
    
    const msg = `Hi! I'm interested in buying:\n*${itemName}*\nPrice: ₹${price.toFixed(2)}\n\nIs it available?`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
}

function closeProductModal() {
    document.getElementById('product-modal').style.display = 'none';
}

// Close modal when clicking outside of it
window.onclick = function(event) {
    const modal = document.getElementById('product-modal');
    if (event.target == modal) {
        modal.style.display = "none";
    }
}

function addToCart(id, name, price) {
    let size = '', color = '';
    const sizeEl = document.getElementById(`modal-size`);
    const colorEl = document.getElementById(`modal-color`);
    
    if (sizeEl) size = sizeEl.value;
    if (colorEl) color = colorEl.value;
    
    if (sizeEl && !size) { alert("Please select a size"); return; }
    if (colorEl && !color) { alert("Please select a color"); return; }
    
    let itemName = name;
    if (size || color) itemName += ` (${size}${size && color ? ', ' : ''}${color})`;

    cart.push({ id, name: itemName, price });
    updateCartCount();
    closeProductModal();
    openCart();
}

function updateCartCount() {
    const cartCountElement = document.getElementById('cart-count');
    if (cartCountElement) cartCountElement.innerText = cart.length;
}

function openCart(e) {
    if(e) e.preventDefault();
    renderCartSidebar();
    document.getElementById('cart-sidebar').classList.add('open');
    document.getElementById('cart-overlay').classList.add('open');
}

function closeCart() {
    document.getElementById('cart-sidebar').classList.remove('open');
    document.getElementById('cart-overlay').classList.remove('open');
}

function renderCartSidebar() {
    const container = document.getElementById('cart-items');
    const totalEl = document.getElementById('cart-total');
    if (!container) return;

    if (cart.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding:3rem; color:#94a3b8;">
            <i class="fa-solid fa-cart-shopping" style="font-size:3rem; margin-bottom:1rem; display:block;"></i>
            <p>Your cart is empty</p>
        </div>`;
        if(totalEl) totalEl.innerText = '₹0.00';
        return;
    }

    container.innerHTML = '';
    let total = 0;
    cart.forEach((item, i) => {
        total += item.price;
        container.innerHTML += `
            <div class="cart-item">
                <div class="cart-item-info">
                    <strong>${item.name}</strong>
                    <span>₹${item.price.toFixed(2)}</span>
                </div>
                <button class="cart-item-remove" onclick="removeFromCart(${i})"><i class="fa-solid fa-trash"></i></button>
            </div>`;
    });
    if(totalEl) totalEl.innerText = `₹${total.toFixed(2)}`;
}

function removeFromCart(index) {
    cart.splice(index, 1);
    updateCartCount();
    renderCartSidebar();
}

function checkoutWhatsApp() {
    if (cart.length === 0) { alert('Your cart is empty!'); return; }
    const total = cart.reduce((s, i) => s + i.price, 0);
    let msg = `*New Order - AN Traders*\n\n`;
    cart.forEach(item => { msg += `- ${item.name}: ₹${item.price.toFixed(2)}\n`; });
    msg += `\n*Total:* ₹${total.toFixed(2)}`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
}

function setupCart() {
    // Cart is now handled via openCart() called directly from HTML
}

async function placeOrder(customerName, totalAmount) {
    try {
        const response = await fetch(`${API_URL}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                customer_name: customerName,
                amount: totalAmount,
                status: 'Pending'
            })
        });

        if (response.ok) {
            let msg = `*New Order - AN Traders*\n\nName: ${customerName}\nOrder Details:\n`;
            let itemsCount = {};
            cart.forEach(item => {
                itemsCount[item.name] = (itemsCount[item.name] || 0) + 1;
            });
            for(let itemName in itemsCount) {
                msg += `- ${itemsCount[itemName]}x ${itemName}\n`;
            }
            msg += `\n*Total:* ₹${totalAmount.toFixed(2)}`;
            
            const encodedMsg = encodeURIComponent(msg);
            const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMsg}`;
            
            alert('Order saved! Redirecting to WhatsApp to complete...');
            window.open(waUrl, '_blank');

            cart = [];
            updateCartCount();
        } else {
            alert('Failed to place order.');
        }
    } catch (error) {
        console.error('Error placing order:', error);
    }
}
