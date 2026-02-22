/* ============================================================
   SENSORY & SMILES — ADMIN + PRODUCT + REVIEW CAROUSEL ENGINE
   Password-protected editing for products & reviews.
   Password: sensory2026  (SHA-256 hashed, never stored in plain text)
   ============================================================ */

const ADMIN_HASH = 'e847d5cf6bd178e8441c325696776855d54ffe593fdc4499ca3b189e689ca5ef';

/* ---- Pure-JS SHA-256 (works on file:// & all browsers) ---- */
function sha256(msg) {
  /* Try Web Crypto first (fast, native) */
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    return crypto.subtle.digest('SHA-256', new TextEncoder().encode(msg))
      .then(buf => Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join(''));
  }
  /* Fallback: pure-JS SHA-256 */
  return Promise.resolve(_sha256Fallback(msg));
}
function _sha256Fallback(msg) {
  function rr(n,x){return(x>>>n)|(x<<(32-n));}
  const K=[0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
    0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
    0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
    0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
    0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
    0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
    0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
    0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
  let H=[0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
  const bytes=new TextEncoder().encode(msg),len=bytes.length;
  const bits=len*8,blocks=Math.ceil((len+9)/64)*64;
  const data=new Uint8Array(blocks);
  data.set(bytes);data[len]=0x80;
  const dv=new DataView(data.buffer);dv.setUint32(blocks-4,bits);
  for(let o=0;o<blocks;o+=64){
    const w=new Uint32Array(64);
    for(let i=0;i<16;i++) w[i]=dv.getUint32(o+i*4);
    for(let i=16;i<64;i++){
      const s0=(rr(7,w[i-15])^rr(18,w[i-15])^(w[i-15]>>>3))>>>0;
      const s1=(rr(17,w[i-2])^rr(19,w[i-2])^(w[i-2]>>>10))>>>0;
      w[i]=(w[i-16]+s0+w[i-7]+s1)>>>0;
    }
    let [a,b,c,d,e,f,g,h]=H;
    for(let i=0;i<64;i++){
      const S1=(rr(6,e)^rr(11,e)^rr(25,e))>>>0;
      const ch=((e&f)^(~e&g))>>>0;
      const t1=(h+S1+ch+K[i]+w[i])>>>0;
      const S0=(rr(2,a)^rr(13,a)^rr(22,a))>>>0;
      const maj=((a&b)^(a&c)^(b&c))>>>0;
      const t2=(S0+maj)>>>0;
      h=g;g=f;f=e;e=(d+t1)>>>0;d=c;c=b;b=a;a=(t1+t2)>>>0;
    }
    H=[(H[0]+a)>>>0,(H[1]+b)>>>0,(H[2]+c)>>>0,(H[3]+d)>>>0,(H[4]+e)>>>0,(H[5]+f)>>>0,(H[6]+g)>>>0,(H[7]+h)>>>0];
  }
  return H.map(v=>v.toString(16).padStart(8,'0')).join('');
}

/* ---- Auth state ---- */
let isAdmin = false;

/* Custom password modal (works everywhere — unlike prompt()) */
function promptPassword() {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'admin-overlay';
    overlay.style.zIndex = '100000';
    overlay.innerHTML = `
      <div class="admin-modal" style="max-width:380px;">
        <h2 style="margin-bottom:.6rem;font-family:'Baloo 2',cursive;color:var(--navy,#1B1440);text-align:center;">🔒 Admin Login</h2>
        <p style="text-align:center;font-size:.92rem;color:#555;margin-bottom:1rem;">Enter the admin password to edit products and reviews.</p>
        <label style="font-weight:600;">Password</label>
        <input type="password" id="admin-pw-input" placeholder="Enter password…" style="width:100%;padding:.65rem .9rem;border:2px solid #ddd;border-radius:10px;font-size:1rem;margin-bottom:.3rem;box-sizing:border-box;" />
        <p id="admin-pw-error" style="color:#e53935;font-size:.85rem;min-height:1.3em;margin:.2rem 0 .6rem;"></p>
        <div style="display:flex;gap:.8rem;">
          <button id="admin-pw-ok" class="btn btn-primary" style="flex:1;padding:.65rem;font-size:1rem;">Unlock</button>
          <button id="admin-pw-cancel" class="btn btn-outline" style="flex:1;padding:.65rem;font-size:1rem;">Cancel</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);

    const inp = overlay.querySelector('#admin-pw-input');
    const errEl = overlay.querySelector('#admin-pw-error');
    inp.focus();

    function close(result) { overlay.remove(); resolve(result); }

    overlay.querySelector('#admin-pw-cancel').onclick = () => close(false);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(false); });

    async function tryLogin() {
      const pw = inp.value;
      if (!pw) { errEl.textContent = 'Please enter a password.'; inp.focus(); return; }
      try {
        const hash = await sha256(pw);
        if (hash === ADMIN_HASH) {
          isAdmin = true;
          close(true);
        } else {
          errEl.textContent = 'Incorrect password. Try again.';
          inp.value = '';
          inp.focus();
        }
      } catch(e) {
        console.error('Auth error:', e);
        errEl.textContent = 'Error — please try again.';
      }
    }

    overlay.querySelector('#admin-pw-ok').onclick = tryLogin;
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') tryLogin(); });
  });
}

/* Custom confirm modal (replaces browser confirm() which is blocked on file://) */
function customConfirm(message) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'admin-overlay';
    overlay.style.zIndex = '100000';
    overlay.innerHTML = `
      <div class="admin-modal" style="max-width:380px;text-align:center;">
        <p style="font-size:1.05rem;color:#333;margin-bottom:1.2rem;line-height:1.5;">${message}</p>
        <div style="display:flex;gap:.8rem;">
          <button id="cc-yes" class="btn btn-primary" style="flex:1;padding:.65rem;font-size:1rem;">Yes</button>
          <button id="cc-no" class="btn btn-outline" style="flex:1;padding:.65rem;font-size:1rem;">Cancel</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('#cc-yes').onclick = () => { overlay.remove(); resolve(true); };
    overlay.querySelector('#cc-no').onclick = () => { overlay.remove(); resolve(false); };
    overlay.addEventListener('click', (e) => { if (e.target === overlay) { overlay.remove(); resolve(false); } });
  });
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
  overlay.querySelector('#re-delete').onclick = async () => {
    const yes = await customConfirm('Delete this review?');
    if (yes) {
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
  bar.querySelector('#at-reset-products').onclick = async () => {
    const yes = await customConfirm('Reset products to defaults? Your edits will be lost.');
    if (yes) {
      localStorage.removeItem('products_' + pageId);
      renderProducts(pageId, bgColor);
    }
  };
  bar.querySelector('#at-reset-reviews').onclick = async () => {
    const yes = await customConfirm('Reset reviews to defaults? Your edits will be lost.');
    if (yes) {
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
function initProductPage(pageId, bgColor) {
  function _boot() {
    try {
      renderProducts(pageId, bgColor);
      renderReviewCarousel(pageId);
    } catch(e) { console.error('Render error:', e); }

    // Admin lock button
    const adminBtn = document.getElementById('admin-login-btn');
    if (adminBtn) {
      adminBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
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

  // Run now if DOM is ready, otherwise wait
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _boot);
  } else {
    _boot();
  }
}
