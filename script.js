const products = [
  { id: "elfbar-ew9000-cherry", brand: "Elfbar", name: "Elfbar EW9000 Kit", flavour: "California Cherry", price: 295, puffs: "9K", type: "Rechargeable kit", badge: "EW9000", swatch: "pink", more: "+2", image: "Vape Images/CALIFORNIA-CHERRY-ELFBAR9K.webp" },
  { id: "elfbar-ew18000-strawberry", brand: "Elfbar", name: "Elfbar EW18000 Pod", flavour: "Strawberry Ice", price: 279, puffs: "18K", type: "Replacement pod", badge: "EW18000", swatch: "pale", more: "+5", image: "Vape Images/STRAWBERRY-ICE-18K.webp" },
  { id: "elfbar-ew9000-sour", brand: "Elfbar", name: "Elfbar EW9000 Kit", flavour: "Sour Lush", price: 295, puffs: "9K", type: "Rechargeable kit", badge: "Kit", swatch: "lime", more: "", image: "Vape Images/CALIFORNIA-CHERRY-ELFBAR9K.webp" },
  { id: "elfbar-ew18000-berry", brand: "Elfbar", name: "Elfbar EW18000 Pod", flavour: "Berry Grape", price: 279, puffs: "18K", type: "Replacement pod", badge: "Pod", swatch: "purple", more: "+4", image: "Vape Images/STRAWBERRY-ICE-18K.webp" },
  { id: "nasty-9k-berry", brand: "Nasty", name: "Nasty Bar 9K", flavour: "Berry Grape", price: 249, puffs: "9K", type: "Disposable", badge: "9K", swatch: "purple", more: "+6", image: "https://smokeorganic.co.za/cdn/shop/files/Berry_grape_flavour_Nasty_Bar_9k_Disposable_vape.jpg?v=1766139119" },
  { id: "nasty-9k-tropical", brand: "Nasty", name: "Nasty Bar 9K", flavour: "Tropical Cherry", price: 249, puffs: "9K", type: "Disposable", badge: "9K", swatch: "red", more: "", image: "https://smokeorganic.co.za/cdn/shop/files/Tropical_cherry_flavour_Nasty_Bar_9k_Disposable_vape.jpg?v=1766139119" },
  { id: "nasty-9k-red", brand: "Nasty", name: "Nasty Bar 9K", flavour: "Red Energy", price: 249, puffs: "9K", type: "Disposable", badge: "9K", swatch: "orange", more: "", image: "https://smokeorganic.co.za/cdn/shop/files/Red_energy_flavour_Nasty_Bar_9k_Disposable_vape.jpg?v=1766139119" },
  { id: "nasty-9k-watermelon", brand: "Nasty", name: "Nasty Bar 9K", flavour: "Watermelon Raspberry", price: 249, puffs: "9K", type: "Disposable", badge: "9K", swatch: "green", more: "+3", image: "https://smokeorganic.co.za/cdn/shop/files/Watermelon_raspberry_flavour_Nasty_Bar_9k_Disposable_vape.jpg?v=1766139119" }
];

const state = {
  filter: "all",
  sort: "new",
  query: "",
  cart: JSON.parse(localStorage.getItem("cloud-counter-cart") || "{}")
};

const money = (value) => `R${value.toFixed(2)}`;
const productGrid = document.querySelector("[data-products]");
const cartDrawer = document.querySelector("[data-cart-drawer]");
const cartItems = document.querySelector("[data-cart-items]");
const toast = document.querySelector("[data-toast]");
const cartButton = document.querySelector("[data-open-cart]");
const menuButton = document.querySelector("[data-menu-toggle]");
const siteHeader = document.querySelector(".site-header");
const primaryNav = document.querySelector(".primary-nav");
const resultCount = document.querySelector("[data-result-count]");
const checkoutModal = document.querySelector("[data-checkout-modal]");
const checkoutItems = document.querySelector("[data-checkout-items]");

function filteredProducts() {
  const query = state.query.trim().toLowerCase();
  const filtered = products.filter((product) => {
    const inBrand = state.filter === "all" || product.brand === state.filter;
    const inSearch = [product.brand, product.name, product.flavour, product.puffs].join(" ").toLowerCase().includes(query);
    return inBrand && inSearch;
  });

  return filtered.sort((a, b) => {
    if (state.sort === "price-low") return a.price - b.price;
    if (state.sort === "price-high") return b.price - a.price;
    return products.indexOf(a) - products.indexOf(b);
  });
}

function renderProducts() {
  const visibleProducts = filteredProducts();
  resultCount.innerHTML = `Showing <strong>${visibleProducts.length}</strong> of <strong>${products.length}</strong> products`;
  productGrid.innerHTML = visibleProducts.map((product) => `
    <article class="product-card reveal">
      <div class="image-tile">
        <img src="${product.image}" alt="${product.name} ${product.flavour}" loading="lazy" />
        <span class="badge">${product.badge}</span>
        <span class="swatch ${product.swatch}"></span>
        ${product.more ? `<span class="more">${product.more}</span>` : ""}
      </div>
      <div class="product-meta">
        <div>
          <h3>${product.name}</h3>
          <p>${product.flavour} / ${product.puffs}</p>
          <div class="product-specs">
            <span>${product.type}</span>
            <span>${product.brand}</span>
          </div>
          <strong>${money(product.price)}</strong>
        </div>
        <button class="add-button" type="button" data-add="${product.id}" aria-label="Add ${product.name} ${product.flavour} to cart">+</button>
      </div>
    </article>
  `).join("");

  observeReveals();
}

function saveCart() {
  localStorage.setItem("cloud-counter-cart", JSON.stringify(state.cart));
}

function cartEntries() {
  return Object.entries(state.cart)
    .map(([id, quantity]) => ({ product: products.find((item) => item.id === id), quantity }))
    .filter((entry) => entry.product && entry.quantity > 0);
}

function renderCart() {
  const entries = cartEntries();
  const count = entries.reduce((sum, entry) => sum + entry.quantity, 0);
  const subtotal = entries.reduce((sum, entry) => sum + entry.product.price * entry.quantity, 0);
  const total = subtotal > 0 ? subtotal + 60 : 0;

  document.querySelector("[data-cart-count]").textContent = count;
  document.querySelector("[data-cart-title]").textContent = `${count} ${count === 1 ? "item" : "items"}`;
  document.querySelector("[data-subtotal]").textContent = money(subtotal);
  document.querySelector("[data-total]").textContent = money(total);

  cartItems.innerHTML = entries.length ? entries.map(({ product, quantity }) => `
    <article class="cart-item">
      <img src="${product.image}" alt="${product.name} ${product.flavour}" />
      <div>
        <h4>${product.name}</h4>
        <p>${product.flavour}</p>
        <div class="cart-controls">
          <div class="qty-controls" aria-label="Quantity controls">
            <button type="button" data-dec="${product.id}" aria-label="Decrease quantity">-</button>
            <strong>${quantity}</strong>
            <button type="button" data-inc="${product.id}" aria-label="Increase quantity">+</button>
          </div>
          <span class="cart-price">${money(product.price * quantity)}</span>
        </div>
        <button class="remove-button" type="button" data-remove="${product.id}">Remove</button>
      </div>
    </article>
  `).join("") : `<div class="empty-cart">Your cart is empty.<br />Add a flavour from the catalog.</div>`;
  renderCheckout();
}

function renderCheckout() {
  const entries = cartEntries();
  const subtotal = entries.reduce((sum, entry) => sum + entry.product.price * entry.quantity, 0);
  const total = subtotal > 0 ? subtotal + 60 : 0;

  checkoutItems.innerHTML = entries.length ? entries.map(({ product, quantity }) => `
    <div class="checkout-line">
      <img src="${product.image}" alt="${product.name} ${product.flavour}" />
      <div>
        <strong>${product.flavour}</strong>
        <span>${product.name} x ${quantity}</span>
      </div>
      <strong>${money(product.price * quantity)}</strong>
    </div>
  `).join("") : `<div class="empty-cart">Your checkout is empty.</div>`;

  document.querySelector("[data-checkout-subtotal]").textContent = money(subtotal);
  document.querySelector("[data-checkout-total]").textContent = money(total);
}

function animateToCart(button, product) {
  const sourceImage = button.closest(".product-card")?.querySelector(".image-tile img");
  if (!sourceImage) return;

  const imageRect = sourceImage.getBoundingClientRect();
  const cartRect = cartButton.getBoundingClientRect();
  const flyer = sourceImage.cloneNode();
  flyer.className = "fly-image";
  flyer.style.left = `${imageRect.left + imageRect.width / 2 - 36}px`;
  flyer.style.top = `${imageRect.top + imageRect.height / 2 - 36}px`;
  document.body.appendChild(flyer);

  requestAnimationFrame(() => {
    const x = cartRect.left + cartRect.width / 2 - (imageRect.left + imageRect.width / 2);
    const y = cartRect.top + cartRect.height / 2 - (imageRect.top + imageRect.height / 2);
    flyer.style.transform = `translate(${x}px, ${y}px) scale(0.22) rotate(10deg)`;
    flyer.style.opacity = "0.18";
  });

  window.setTimeout(() => flyer.remove(), 700);
}

function addToCart(id, button) {
  const product = products.find((item) => item.id === id);
  state.cart[id] = (state.cart[id] || 0) + 1;
  saveCart();
  renderCart();
  if (button && product) {
    button.classList.add("adding");
    animateToCart(button, product);
    window.setTimeout(() => button.classList.remove("adding"), 220);
  }
  cartButton.classList.add("bump");
  window.setTimeout(() => cartButton.classList.remove("bump"), 260);
  showToast(`${product ? product.flavour : "Item"} added`);
}

function showToast(message = "Done") {
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 1400);
}

function openCart() {
  cartDrawer.classList.add("open");
  cartDrawer.setAttribute("aria-hidden", "false");
  document.body.classList.add("cart-open");
}

function closeCart() {
  cartDrawer.classList.remove("open");
  cartDrawer.setAttribute("aria-hidden", "true");
  document.body.classList.remove("cart-open");
}

function openCheckout() {
  if (!cartEntries().length) {
    showToast("Add a product first");
    return;
  }
  closeCart();
  renderCheckout();
  checkoutModal.classList.add("open");
  checkoutModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("cart-open");
}

function closeCheckout() {
  checkoutModal.classList.remove("open");
  checkoutModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("cart-open");
}

function openMenu() {
  siteHeader.classList.add("menu-open");
  menuButton.setAttribute("aria-expanded", "true");
  menuButton.setAttribute("aria-label", "Close menu");
}

function closeMenu() {
  siteHeader.classList.remove("menu-open");
  menuButton.setAttribute("aria-expanded", "false");
  menuButton.setAttribute("aria-label", "Open menu");
}

function toggleMenu() {
  if (siteHeader.classList.contains("menu-open")) {
    closeMenu();
  } else {
    openMenu();
  }
}

function updateHeroScroll() {
  const y = Math.min(window.scrollY, 720);
  document.documentElement.style.setProperty("--scroll", y);
  document.querySelector(".hero-product-one").style.transform = `translateY(${y * 0.045}px) rotate(${y * -0.012}deg)`;
  document.querySelector(".hero-product-two").style.transform = `translateY(${y * -0.035}px) rotate(${y * 0.01}deg)`;
  document.querySelector(".hero-product-three").style.transform = `translateY(${y * 0.025}px) rotate(${y * 0.014}deg)`;
  document.querySelector(".orbit-ring").style.transform = `rotate(${-18 + y * 0.035}deg) scale(${1 + y * 0.00018})`;
}

let revealObserver;
function observeReveals() {
  if (revealObserver) revealObserver.disconnect();
  revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add("visible");
    });
  }, { threshold: 0.14 });
  document.querySelectorAll(".reveal, .editorial-strip article, .collection-card, .drop-card, .feature-story, .flavour-grid article, .service-band article, .reviews-band article, .faq-news > *").forEach((item) => {
    item.classList.add("reveal");
    revealObserver.observe(item);
  });
}

document.addEventListener("click", (event) => {
  const add = event.target.closest("[data-add]");
  const inc = event.target.closest("[data-inc]");
  const dec = event.target.closest("[data-dec]");
  const remove = event.target.closest("[data-remove]");

  if (add) addToCart(add.dataset.add, add);
  if (inc) {
    state.cart[inc.dataset.inc] += 1;
    saveCart();
    renderCart();
  }
  if (dec) {
    state.cart[dec.dataset.dec] -= 1;
    if (state.cart[dec.dataset.dec] <= 0) delete state.cart[dec.dataset.dec];
    saveCart();
    renderCart();
  }
  if (remove) {
    delete state.cart[remove.dataset.remove];
    saveCart();
    renderCart();
  }
});

document.querySelectorAll("[data-filter]").forEach((button) => {
  button.addEventListener("click", () => {
    state.filter = button.dataset.filter;
    document.querySelectorAll("[data-filter]").forEach((item) => item.classList.toggle("active", item === button));
    renderProducts();
  });
});

document.querySelector("[data-sort]").addEventListener("change", (event) => {
  state.sort = event.target.value;
  renderProducts();
});

document.querySelector("[data-search]").addEventListener("input", (event) => {
  state.query = event.target.value;
  renderProducts();
});

cartButton.addEventListener("click", openCart);
document.querySelector("[data-close-cart]").addEventListener("click", closeCart);
document.querySelector("[data-open-checkout]").addEventListener("click", openCheckout);
document.querySelector("[data-close-checkout]").addEventListener("click", closeCheckout);
document.querySelector("[data-checkout-form]").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.target;

  const order = {
    customer: {
      email: form.email.value,
      phone: form.phone.value,
      first_name: form.first_name.value,
      last_name: form.last_name.value,
      address: form.address.value,
      city: form.city.value,
      postal_code: form.postal_code.value
    },
    items: cartEntries().map(({ product, quantity }) => ({ id: product.id, name: product.name, unit_price: product.price, quantity })),
    subtotal: cartEntries().reduce((s, e) => s + e.product.price * e.quantity, 0)
  };

  try {
    const resp = await fetch('/api/create-stitch-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order)
    });

    const json = await resp.json();
    if (resp.ok) {
      // Stitch (or the provider) commonly responds with a redirect URL or hosted payment id.
      // If a redirect URL is provided, navigate there. Otherwise show a confirmation.
      const redirectUrl = json.redirect_url || json.url || json.payment_url || (json.data && json.data.redirect_url);
      if (redirectUrl) {
        window.location = redirectUrl;
        return;
      }
      showToast('Payment session created — complete in provider UI');
      closeCheckout();
      state.cart = {};
      saveCart();
      renderCart();
      return;
    }

    console.error('Payment init failed', json);
    showToast('Payment initiation failed');
  } catch (err) {
    console.error(err);
    showToast('Payment request error');
  }
});
document.querySelector("[data-open-account]").addEventListener("click", () => alert("Account sign-in opens when customer accounts are enabled."));
document.querySelector(".newsletter").addEventListener("submit", (event) => {
  event.preventDefault();
  showToast("You're on the list");
});
menuButton.addEventListener("click", toggleMenu);
primaryNav.addEventListener("click", (event) => {
  if (event.target.closest("a")) closeMenu();
});
cartDrawer.addEventListener("click", (event) => {
  if (event.target === cartDrawer) closeCart();
});
checkoutModal.addEventListener("click", (event) => {
  if (event.target === checkoutModal) closeCheckout();
});
window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeCart();
    closeCheckout();
    closeMenu();
  }
});
window.addEventListener("resize", () => {
  if (window.innerWidth > 700) closeMenu();
});
window.addEventListener("scroll", updateHeroScroll, { passive: true });

renderProducts();
renderCart();
updateHeroScroll();
