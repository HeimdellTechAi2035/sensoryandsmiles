/* ============================================================
   SENSORY & SMILES — SITE-WIDE FEATURES
   Shopping cart, announcements, cookie consent, scroll effects
   ============================================================ */

/* ============ SHOPPING CART ============ */
const Cart = {
  KEY: 'ss_cart',
  get() { return JSON.parse(localStorage.getItem(this.KEY) || '[]'); },
  save(items) { localStorage.setItem(this.KEY, JSON.stringify(items)); this.updateBadge(); },
  add(name, price, image, emoji) {
    const items = this.get();
    const existing = items.find(i => i.name === name);
    if (existing) { existing.qty++; } else { items.push({ name, price, image: image || '', emoji: emoji || '📦', qty: 1 }); }
    this.save(items);
    this.showNotification(name);
    this.openDrawer();
  },
  remove(index) {
    const items = this.get();
    items.splice(index, 1);
    this.save(items);
    this.renderDrawer();
  },
  changeQty(index, delta) {
    const items = this.get();
    items[index].qty += delta;
    if (items[index].qty < 1) items.splice(index, 1);
    this.save(items);
    this.renderDrawer();
  },
  clear() { this.save([]); this.renderDrawer(); },
  count() { return this.get().reduce((s, i) => s + i.qty, 0); },
  total() {
    return this.get().reduce((s, i) => {
      const p = parseFloat(i.price.replace(/[^0-9.]/g, '')) || 0;
      return s + p * i.qty;
    }, 0).toFixed(2);
  },

  /* Badge in nav */
  updateBadge() {
    const badges = document.querySelectorAll('.cart-badge');
    const c = this.count();
    badges.forEach(b => { b.textContent = c; b.style.display = c > 0 ? 'flex' : 'none'; });
  },

  /* Toast notification */
  showNotification(name) {
    const existing = document.querySelector('.cart-toast');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.className = 'cart-toast';
    toast.innerHTML = `✅ <strong>${name}</strong> added to cart`;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 300); }, 2500);
  },

  /* Slide-out drawer */
  openDrawer() {
    let drawer = document.getElementById('cart-drawer');
    if (!drawer) {
      drawer = document.createElement('div');
      drawer.id = 'cart-drawer';
      drawer.innerHTML = `
        <div class="cart-drawer-overlay"></div>
        <div class="cart-drawer-panel">
          <div class="cart-drawer-header">
            <h3>🛒 Your Cart</h3>
            <button class="cart-drawer-close">&times;</button>
          </div>
          <div class="cart-drawer-items"></div>
          <div class="cart-drawer-footer"></div>
        </div>`;
      document.body.appendChild(drawer);
      drawer.querySelector('.cart-drawer-overlay').addEventListener('click', () => this.closeDrawer());
      drawer.querySelector('.cart-drawer-close').addEventListener('click', () => this.closeDrawer());
    }
    this.renderDrawer();
    requestAnimationFrame(() => drawer.classList.add('open'));
  },
  closeDrawer() {
    const drawer = document.getElementById('cart-drawer');
    if (drawer) drawer.classList.remove('open');
  },
  renderDrawer() {
    const drawer = document.getElementById('cart-drawer');
    if (!drawer) return;
    const items = this.get();
    const container = drawer.querySelector('.cart-drawer-items');
    const footer = drawer.querySelector('.cart-drawer-footer');

    if (items.length === 0) {
      container.innerHTML = '<p style="text-align:center;padding:2rem;color:#888;">Your cart is empty</p>';
      footer.innerHTML = '';
      return;
    }

    container.innerHTML = items.map((item, i) => `
      <div class="cart-item">
        <div class="cart-item-img">${item.image ? '<img src="' + item.image + '" alt="" />' : '<span>' + item.emoji + '</span>'}</div>
        <div class="cart-item-info">
          <strong>${item.name}</strong>
          <span class="cart-item-price">${item.price}</span>
        </div>
        <div class="cart-item-qty">
          <button onclick="Cart.changeQty(${i},-1)">−</button>
          <span>${item.qty}</span>
          <button onclick="Cart.changeQty(${i},1)">+</button>
        </div>
        <button class="cart-item-remove" onclick="Cart.remove(${i})">🗑️</button>
      </div>`).join('');

    footer.innerHTML = `
      <div class="cart-total">
        <span>Total:</span><strong>£${this.total()}</strong>
      </div>
      <button class="btn btn-primary cart-checkout-btn" style="width:100%;padding:.75rem;font-size:1.05rem;margin-top:.5rem;">Proceed to Checkout</button>
      <button class="btn btn-outline cart-clear-btn" style="width:100%;padding:.55rem;font-size:.88rem;margin-top:.4rem;" onclick="Cart.clear()">Clear Cart</button>`;

    footer.querySelector('.cart-checkout-btn').addEventListener('click', () => {
      window.location.href = 'cart.html';
    });
  }
};

/* ============ ANNOUNCEMENT BAR ============ */
function initAnnouncementBar() {
  const dismissed = sessionStorage.getItem('ss_announce_dismissed');
  if (dismissed) return;

  const bar = document.createElement('div');
  bar.className = 'announcement-bar';
  bar.innerHTML = `
    <p>🎉 <strong>Free Shipping</strong> on orders over £50! Use code <strong>SENSORY10</strong> for 10% off your first order</p>
    <button class="announcement-close" aria-label="Close">&times;</button>`;
  document.body.prepend(bar);

  bar.querySelector('.announcement-close').addEventListener('click', () => {
    bar.classList.add('hiding');
    setTimeout(() => bar.remove(), 300);
    sessionStorage.setItem('ss_announce_dismissed', '1');
  });
}

/* ============ COOKIE CONSENT ============ */
function initCookieConsent() {
  if (localStorage.getItem('ss_cookies_accepted')) return;

  const banner = document.createElement('div');
  banner.className = 'cookie-banner';
  banner.innerHTML = `
    <p>🍪 We use cookies to improve your experience and store your cart & preferences. By continuing, you agree to our <a href="privacy-policy.html">Privacy Policy</a>.</p>
    <div class="cookie-btns">
      <button class="btn btn-primary cookie-accept" style="padding:.5rem 1.5rem;font-size:.9rem;">Accept</button>
      <button class="btn btn-outline cookie-decline" style="padding:.5rem 1.5rem;font-size:.9rem;">Decline</button>
    </div>`;
  document.body.appendChild(banner);
  requestAnimationFrame(() => banner.classList.add('show'));

  banner.querySelector('.cookie-accept').addEventListener('click', () => {
    localStorage.setItem('ss_cookies_accepted', '1');
    banner.classList.remove('show');
    setTimeout(() => banner.remove(), 300);
  });
  banner.querySelector('.cookie-decline').addEventListener('click', () => {
    banner.classList.remove('show');
    setTimeout(() => banner.remove(), 300);
  });
}

/* ============ BACK TO TOP BUTTON ============ */
function initBackToTop() {
  const btn = document.createElement('button');
  btn.className = 'back-to-top';
  btn.innerHTML = '↑';
  btn.setAttribute('aria-label', 'Back to top');
  document.body.appendChild(btn);

  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 400);
  });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

/* ============ WHATSAPP / CHAT BUTTON ============ */
function initChatButton() {
  const btn = document.createElement('a');
  btn.className = 'chat-float';
  btn.href = 'https://wa.me/447414909674?text=Hi!%20I%20have%20a%20question%20about%20Sensory%20%26%20Smiles%20toys';
  btn.target = '_blank';
  btn.rel = 'noopener';
  btn.setAttribute('aria-label', 'Chat with us on WhatsApp');
  btn.innerHTML = `<svg viewBox="0 0 24 24" width="28" height="28" fill="#fff"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>`;
  document.body.appendChild(btn);
}

/* ============ SCROLL ANIMATIONS ============ */
function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.section, .product-item, .benefit-card, .category-card, .review-card, .carousel-card, .content-block, .info-card, .contact-card').forEach(el => {
    el.classList.add('animate-ready');
    observer.observe(el);
  });
}

/* ============ ADD-TO-CART DELEGATION ============ */
function initCartButtons() {
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('a.btn.btn-primary');
    if (!btn) return;
    if (btn.textContent.trim() === 'Add to Cart') {
      e.preventDefault();
      const card = btn.closest('.product-item');
      if (!card) return;
      const name = card.querySelector('h3')?.textContent || 'Product';
      const price = card.querySelector('.price')?.childNodes[0]?.textContent?.trim() || '£0';
      const imgEl = card.querySelector('.product-item-img img');
      const image = imgEl ? imgEl.src : '';
      const emojiEl = card.querySelector('.product-item-img span');
      const emoji = emojiEl ? emojiEl.textContent : '📦';
      Cart.add(name, price, image, emoji);
    }
  });
}

/* ============ CART NAV BUTTON ============ */
function initCartNav() {
  /* Replace "Shop Now" nav button with a cart icon on product pages, or add cart icon after it */
  const navUl = document.querySelector('nav ul');
  if (!navUl) return;
  const li = document.createElement('li');
  li.innerHTML = `<button class="cart-nav-btn" aria-label="Open cart" onclick="Cart.openDrawer()">
    🛒 <span class="cart-badge" style="display:none;">0</span>
  </button>`;
  navUl.appendChild(li);
  Cart.updateBadge();
}

/* ============ BOOT ============ */
document.addEventListener('DOMContentLoaded', () => {
  initAnnouncementBar();
  initCartNav();
  initCartButtons();
  initCookieConsent();
  initBackToTop();
  initChatButton();
  // Delay animations slightly so elements are laid out
  setTimeout(initScrollAnimations, 200);
});
