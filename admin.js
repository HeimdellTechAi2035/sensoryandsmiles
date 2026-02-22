/* ============================================================
   SENSORY & SMILES — ADMIN + PRODUCT + REVIEW CAROUSEL ENGINE
   Password-protected editing for products & reviews.
   Password: sensory2026  (SHA-256 hashed, never stored in plain text)
   ============================================================ */

const ADMIN_HASH = 'e847d5cf6bd178e8441c325696776855d54ffe593fdc4499ca3b189e689ca5ef';

/* ---- SHA-256 helper (Web Crypto API) ---- */
async function sha256(msg) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(msg));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

/* ---- Auth state ---- */
let isAdmin = false;

async function promptPassword() {
  const pw = prompt('Enter admin password:');
  if (!pw) return false;
  const hash = await sha256(pw);
  if (hash === ADMIN_HASH) { isAdmin = true; return true; }
  alert('Incorrect password.');
  return false;
}

/* ============================================================
   PRODUCT SYSTEM
   ============================================================ */
// pageId is set per-page, e.g. "weighted", "fidget", etc.
function getProducts(pageId) {
  const saved = localStorage.getItem('products_' + pageId);
  if (saved) return JSON.parse(saved);
  return window['DEFAULT_PRODUCTS_' + pageId] || [];
}
function saveProducts(pageId, products) {
  localStorage.setItem('products_' + pageId, JSON.stringify(products));
}

/* Render 4 product cards into .products-grid */
function renderProducts(pageId, bgColor) {
  const grid = document.querySelector('.products-grid');
  if (!grid) return;
  const products = getProducts(pageId);
  grid.innerHTML = '';

  products.forEach((p, i) => {
    const card = document.createElement('div');
    card.className = 'product-item';
    card.setAttribute('data-index', i);

    const imgContent = p.image
      ? `<img src="${p.image}" alt="${p.name}" style="width:100%;height:100%;object-fit:cover;border-radius:14px 14px 0 0;" />`
      : `<span style="font-size:3.5rem;">${p.emoji || '📦'}</span>`;

    card.innerHTML = `
      <div class="product-item-img" style="background:${bgColor};">${imgContent}</div>
      <div class="product-item-body">
        <h3>${p.name}</h3>
        <div class="price">${p.price}${p.oldPrice ? ' <span class="old-price">' + p.oldPrice + '</span>' : ''}</div>
        <p class="item-desc">${p.desc}</p>
        <div class="item-tags">${(p.tags || []).map(t => '<span class="tag">' + t + '</span>').join('')}</div>
        <a href="#" class="btn btn-primary" style="padding:.5rem 1.2rem;font-size:.88rem;">Add to Cart</a>
        ${isAdmin ? '<button class="btn btn-secondary admin-edit-product" data-index="' + i + '" style="padding:.4rem 1rem;font-size:.82rem;margin-top:.5rem;">✏️ Edit</button>' : ''}
      </div>`;
    grid.appendChild(card);
  });

  // bind edit buttons
  grid.querySelectorAll('.admin-edit-product').forEach(btn => {
    btn.addEventListener('click', () => openProductEditor(pageId, parseInt(btn.dataset.index), bgColor));
  });
}

/* Product editor modal */
function openProductEditor(pageId, index, bgColor) {
  const products = getProducts(pageId);
  const p = products[index];
  const overlay = document.createElement('div');
  overlay.className = 'admin-overlay';
  overlay.innerHTML = `
    <div class="admin-modal">
      <h2 style="margin-bottom:1rem;font-family:'Baloo 2',cursive;color:var(--navy);">Edit Product #${index + 1}</h2>
      <label>Name</label>
      <input type="text" id="ae-name" value="${p.name}" />
      <label>Price (e.g. $34.99)</label>
      <input type="text" id="ae-price" value="${p.price}" />
      <label>Old Price (optional, e.g. $45.00)</label>
      <input type="text" id="ae-oldprice" value="${p.oldPrice || ''}" />
      <label>Description</label>
      <textarea id="ae-desc" rows="3">${p.desc}</textarea>
      <label>Tags (comma-separated)</label>
      <input type="text" id="ae-tags" value="${(p.tags || []).join(', ')}" />
      <label>Emoji (fallback if no image)</label>
      <input type="text" id="ae-emoji" value="${p.emoji || ''}" />
      <label>Product Image</label>
      <input type="file" id="ae-image" accept="image/*" />
      ${p.image ? '<img src="' + p.image + '" style="max-height:80px;border-radius:8px;margin:.5rem 0;" />' : ''}
      <div style="display:flex;gap:.8rem;margin-top:1.2rem;">
        <button id="ae-save" class="btn btn-primary" style="flex:1;padding:.6rem;">Save</button>
        <button id="ae-cancel" class="btn btn-outline" style="flex:1;padding:.6rem;">Cancel</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);

  overlay.querySelector('#ae-cancel').onclick = () => overlay.remove();
  overlay.querySelector('#ae-save').onclick = () => {
    p.name = overlay.querySelector('#ae-name').value;
    p.price = overlay.querySelector('#ae-price').value;
    p.oldPrice = overlay.querySelector('#ae-oldprice').value || '';
    p.desc = overlay.querySelector('#ae-desc').value;
    p.tags = overlay.querySelector('#ae-tags').value.split(',').map(t => t.trim()).filter(Boolean);
    p.emoji = overlay.querySelector('#ae-emoji').value;

    const fileInput = overlay.querySelector('#ae-image');
    if (fileInput.files.length) {
      const reader = new FileReader();
      reader.onload = (e) => {
        p.image = e.target.result;
        products[index] = p;
        saveProducts(pageId, products);
        overlay.remove();
        renderProducts(pageId, bgColor);
      };
      reader.readAsDataURL(fileInput.files[0]);
    } else {
      products[index] = p;
      saveProducts(pageId, products);
      overlay.remove();
      renderProducts(pageId, bgColor);
    }
  };
}

/* ============================================================
   REVIEW CAROUSEL
   ============================================================ */
function getReviews(pageId) {
  const saved = localStorage.getItem('reviews_' + pageId);
  if (saved) return JSON.parse(saved);
  return window['DEFAULT_REVIEWS_' + pageId] || defaultReviews();
}
function saveReviews(pageId, reviews) {
  localStorage.setItem('reviews_' + pageId, JSON.stringify(reviews));
}

function defaultReviews() {
  return [
    { name: 'Sarah M.', stars: 5, text: 'My daughter absolutely loves these! Incredible quality and fast shipping. Will definitely be ordering more.' },
    { name: 'James K.', stars: 5, text: 'Bought this for my son with autism and it has made such a difference. He uses it every day to self-regulate.' },
    { name: 'Emily R.', stars: 4, text: 'Great sensory toy — really well made. My kids fight over who gets to play with it first!' },
    { name: 'Priya D.', stars: 5, text: 'As an OT, I recommend Sensory & Smiles to all my clients. Best quality I\'ve found online.' },
    { name: 'Mark T.', stars: 5, text: 'Perfect gift for my nephew. He was so excited when he opened it! The colours are vibrant and it feels very durable.' },
    { name: 'Lisa W.', stars: 4, text: 'Arrived quickly and exactly as described. My toddler can\'t put it down. Already looking at the next purchase!' },
    { name: 'David H.', stars: 5, text: 'We use these in our special education classroom. The kids are so much calmer and more focused. A game-changer!' },
    { name: 'Anna C.', stars: 5, text: 'Beautiful packaging and the product is even better in person. My daughter sleeps so much better now.' },
  ];
}

function renderReviewCarousel(pageId) {
  const section = document.querySelector('.review-carousel-section');
  if (!section) return;
  const reviews = getReviews(pageId);
  const track = section.querySelector('.carousel-track');
  track.innerHTML = '';

  reviews.forEach((r, i) => {
    const card = document.createElement('div');
    card.className = 'carousel-card';
    card.innerHTML = `
      <div class="carousel-stars">${'★'.repeat(r.stars)}${'☆'.repeat(5 - r.stars)}</div>
      <p class="carousel-text">"${r.text}"</p>
      <p class="carousel-author">— ${r.name}</p>
      ${isAdmin ? '<button class="btn btn-secondary admin-edit-review" data-index="' + i + '" style="padding:.3rem .8rem;font-size:.78rem;margin-top:.4rem;">✏️ Edit</button>' : ''}`;
    track.appendChild(card);
  });

  // duplicate cards for infinite scroll illusion
  reviews.forEach(r => {
    const card = document.createElement('div');
    card.className = 'carousel-card';
    card.innerHTML = `
      <div class="carousel-stars">${'★'.repeat(r.stars)}${'☆'.repeat(5 - r.stars)}</div>
      <p class="carousel-text">"${r.text}"</p>
      <p class="carousel-author">— ${r.name}</p>`;
    track.appendChild(card);
  });

  // auto-scroll
  startCarouselScroll(track);

  // bind edit buttons
  section.querySelectorAll('.admin-edit-review').forEach(btn => {
    btn.addEventListener('click', () => openReviewEditor(pageId, parseInt(btn.dataset.index)));
  });
}

function startCarouselScroll(track) {
  let scrollPos = 0;
  const speed = 0.5; // px per frame
  let paused = false;

  track.addEventListener('mouseenter', () => paused = true);
  track.addEventListener('mouseleave', () => paused = false);
  track.addEventListener('touchstart', () => paused = true);
  track.addEventListener('touchend', () => { setTimeout(() => paused = false, 2000); });

  function step() {
    if (!paused) {
      scrollPos += speed;
      // reset when we've scrolled through the original set
      if (scrollPos >= track.scrollWidth / 2) scrollPos = 0;
      track.style.transform = `translateX(-${scrollPos}px)`;
    }
    requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

/* Review editor modal */
function openReviewEditor(pageId, index) {
  const reviews = getReviews(pageId);
  const r = reviews[index];
  const overlay = document.createElement('div');
  overlay.className = 'admin-overlay';
  overlay.innerHTML = `
    <div class="admin-modal">
      <h2 style="margin-bottom:1rem;font-family:'Baloo 2',cursive;color:var(--navy);">Edit Review #${index + 1}</h2>
      <label>Reviewer Name</label>
      <input type="text" id="re-name" value="${r.name}" />
      <label>Stars (1-5)</label>
      <input type="number" id="re-stars" min="1" max="5" value="${r.stars}" />
      <label>Review Text</label>
      <textarea id="re-text" rows="4">${r.text}</textarea>
      <div style="display:flex;gap:.8rem;margin-top:1.2rem;">
        <button id="re-save" class="btn btn-primary" style="flex:1;padding:.6rem;">Save</button>
        <button id="re-delete" class="btn btn-secondary" style="padding:.6rem;font-size:.85rem;">🗑️ Delete</button>
        <button id="re-cancel" class="btn btn-outline" style="flex:1;padding:.6rem;">Cancel</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);

  overlay.querySelector('#re-cancel').onclick = () => overlay.remove();
  overlay.querySelector('#re-delete').onclick = () => {
    if (confirm('Delete this review?')) {
      reviews.splice(index, 1);
      saveReviews(pageId, reviews);
      overlay.remove();
      renderReviewCarousel(pageId);
    }
  };
  overlay.querySelector('#re-save').onclick = () => {
    r.name = overlay.querySelector('#re-name').value;
    r.stars = parseInt(overlay.querySelector('#re-stars').value) || 5;
    r.text = overlay.querySelector('#re-text').value;
    reviews[index] = r;
    saveReviews(pageId, reviews);
    overlay.remove();
    renderReviewCarousel(pageId);
  };
}

/* Add new review (admin only) */
function openAddReview(pageId) {
  const overlay = document.createElement('div');
  overlay.className = 'admin-overlay';
  overlay.innerHTML = `
    <div class="admin-modal">
      <h2 style="margin-bottom:1rem;font-family:'Baloo 2',cursive;color:var(--navy);">Add New Review</h2>
      <label>Reviewer Name</label>
      <input type="text" id="re-name" value="" placeholder="Jane D." />
      <label>Stars (1-5)</label>
      <input type="number" id="re-stars" min="1" max="5" value="5" />
      <label>Review Text</label>
      <textarea id="re-text" rows="4" placeholder="Write the review text here..."></textarea>
      <div style="display:flex;gap:.8rem;margin-top:1.2rem;">
        <button id="re-save" class="btn btn-primary" style="flex:1;padding:.6rem;">Add Review</button>
        <button id="re-cancel" class="btn btn-outline" style="flex:1;padding:.6rem;">Cancel</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);

  overlay.querySelector('#re-cancel').onclick = () => overlay.remove();
  overlay.querySelector('#re-save').onclick = () => {
    const reviews = getReviews(pageId);
    reviews.push({
      name: overlay.querySelector('#re-name').value || 'Anonymous',
      stars: parseInt(overlay.querySelector('#re-stars').value) || 5,
      text: overlay.querySelector('#re-text').value || ''
    });
    saveReviews(pageId, reviews);
    overlay.remove();
    renderReviewCarousel(pageId);
  };
}

/* ============================================================
   ADMIN TOOLBAR (shown after auth)
   ============================================================ */
function showAdminToolbar(pageId, bgColor) {
  const bar = document.createElement('div');
  bar.className = 'admin-toolbar';
  bar.innerHTML = `
    <span>🔓 Admin Mode</span>
    <button id="at-add-review" class="btn btn-primary" style="padding:.35rem 1rem;font-size:.82rem;">+ Add Review</button>
    <button id="at-reset-products" class="btn btn-outline" style="padding:.35rem 1rem;font-size:.82rem;border-color:#fff;color:#fff;">Reset Products</button>
    <button id="at-reset-reviews" class="btn btn-outline" style="padding:.35rem 1rem;font-size:.82rem;border-color:#fff;color:#fff;">Reset Reviews</button>
    <button id="at-logout" class="btn btn-secondary" style="padding:.35rem 1rem;font-size:.82rem;">Lock 🔒</button>`;
  document.body.appendChild(bar);

  bar.querySelector('#at-add-review').onclick = () => openAddReview(pageId);
  bar.querySelector('#at-reset-products').onclick = () => {
    if (confirm('Reset products to defaults? Your edits will be lost.')) {
      localStorage.removeItem('products_' + pageId);
      renderProducts(pageId, bgColor);
    }
  };
  bar.querySelector('#at-reset-reviews').onclick = () => {
    if (confirm('Reset reviews to defaults? Your edits will be lost.')) {
      localStorage.removeItem('reviews_' + pageId);
      renderReviewCarousel(pageId);
    }
  };
  bar.querySelector('#at-logout').onclick = () => {
    isAdmin = false;
    bar.remove();
    renderProducts(pageId, bgColor);
    renderReviewCarousel(pageId);
  };
}

/* ============================================================
   PAGE INIT — called from each product page
   ============================================================ */
async function initProductPage(pageId, bgColor) {
  // Render products + reviews immediately (visitor mode)
  renderProducts(pageId, bgColor);
  renderReviewCarousel(pageId);

  // Admin lock button (hidden in footer area)
  const adminBtn = document.getElementById('admin-login-btn');
  if (adminBtn) {
    adminBtn.addEventListener('click', async () => {
      if (isAdmin) return;
      const ok = await promptPassword();
      if (ok) {
        showAdminToolbar(pageId, bgColor);
        renderProducts(pageId, bgColor);
        renderReviewCarousel(pageId);
      }
    });
  }
}
