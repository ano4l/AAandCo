const PRODUCT_PRICE = 185;
const DELIVERY_FEE = 60;
const STAFF_PIN = "Cannafrica2026";

const storageKeys = {
  age: "aa-age-confirmed",
  cart: "aa-cart",
  stock: "aa-stock",
  orders: "aa-orders",
  purchases: "aa-purchases",
  admin: "aa-admin-unlocked"
};

const products = [
  { id: "blue-razz", sku: "AA-BR", flavour: "Blue Razz", profile: "Berry ice", category: "berry", stock: 3, image: "Vape Images/BlueRazz.png", loneImage: "Vape Images/BlueRazzLone.png" },
  { id: "grape", sku: "AA-GR", flavour: "Grape", profile: "Berry", category: "berry", stock: 3, image: "Vape Images/Grape.png", loneImage: "Vape Images/GrapeLone.png" },
  { id: "peach", sku: "AA-PE", flavour: "Peach", profile: "Fruit", category: "fruit", stock: 3, image: "Vape Images/Peach.png" },
  { id: "cherry-strazz", sku: "AA-CS", flavour: "Cherry Strazz", profile: "Cherry berry", category: "berry", stock: 3, image: "Vape Images/CherryStrazz.png", loneImage: "Vape Images/CherryStrazzLone.png" },
  { id: "pink-lemonade", sku: "AA-PL", flavour: "Pink Lemonade", profile: "Citrus fruit", category: "fruit", stock: 3, image: "Vape Images/PinkLemonade.png" },
  { id: "california-cherry", sku: "AA-CC", flavour: "California Cherry", profile: "Cherry", category: "fruit", stock: 3, image: "Vape Images/CaliforniaCherry.png", loneImage: "Vape Images/CaliforniaCherryLone.png" },
  { id: "miami-mint", sku: "AA-MM", flavour: "Miami Mint", profile: "Mint", category: "mint", stock: 3, image: "Vape Images/MiamiMint.png", loneImage: "Vape Images/MiamiMintLone.png" },
  { id: "watermelon", sku: "AA-WM", flavour: "Watermelon", profile: "Fruit", category: "fruit", stock: 3, image: "Vape Images/Watermelon.png", loneImage: "Vape Images/WatermelonLone.png" },
  { id: "sour-lush", sku: "AA-SL", flavour: "Sour Lush", profile: "Sour fruit", category: "sour", stock: 3, image: "Vape Images/Sour Lush.png", loneImage: "Vape Images/SourLushLone.png" },
  { id: "dragon-strawnana", sku: "AA-DS", flavour: "Dragon Strawnana", profile: "Dragon fruit", category: "fruit", stock: 2, image: "Vape Images/DragonStrawnana.png", loneImage: "Vape Images/DragonStrawnanaLone.png" },
  { id: "mango", sku: "AA-MG", flavour: "Mango", profile: "Tropical", category: "fruit", stock: 1, image: "Vape Images/Mango.png" }
];

const qs = (selector, root = document) => root.querySelector(selector);
const qsa = (selector, root = document) => [...root.querySelectorAll(selector)];
const productById = (id) => products.find((product) => product.id === id);
const loneOrDefault = (product) => product?.loneImage || product?.image;
const money = (value) => `R${Number(value || 0).toFixed(2)}`;

const productGrid = qs("[data-products]");
const cartDrawer = qs("[data-cart-drawer]");
const cartItems = qs("[data-cart-items]");
const toast = qs("[data-toast]");
const cartButtons = qsa("[data-open-cart]");
const menuButton = qs("[data-menu-toggle]");
const siteHeader = qs(".site-header");
const primaryNav = qs(".primary-nav");
const resultCount = qs("[data-result-count]");
const checkoutModal = qs("[data-checkout-modal]");
const checkoutForm = qs("[data-checkout-form]");
const checkoutItems = qs("[data-checkout-items]");
const checkoutSuccess = qs("[data-checkout-success]");
const ownerModal = qs("[data-owner-modal]");
const adminGate = qs("[data-admin-gate]");
const adminConsole = qs("[data-admin-console]");
const adminContent = qs("[data-admin-content]");
const ageModal = qs("[data-age-modal]");

function safeParse(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function loadStock() {
  const saved = safeParse(storageKeys.stock, {});
  return products.reduce((stock, product) => {
    const savedValue = Number(saved[product.id]);
    stock[product.id] = Number.isFinite(savedValue) ? Math.max(0, savedValue) : product.stock;
    return stock;
  }, {});
}

const state = {
  filter: "all",
  sort: "featured",
  query: "",
  adminTab: "overview",
  stock: loadStock(),
  cart: safeParse(storageKeys.cart, {}),
  orders: safeParse(storageKeys.orders, []),
  purchases: safeParse(storageKeys.purchases, [])
};

function saveCart() {
  localStorage.setItem(storageKeys.cart, JSON.stringify(state.cart));
}

function saveStock() {
  localStorage.setItem(storageKeys.stock, JSON.stringify(state.stock));
}

function saveOrders() {
  localStorage.setItem(storageKeys.orders, JSON.stringify(state.orders));
}

function savePurchases() {
  localStorage.setItem(storageKeys.purchases, JSON.stringify(state.purchases));
}

function stockFor(id) {
  return Number(state.stock[id] || 0);
}

function setStock(id, value) {
  state.stock[id] = Math.max(0, Math.floor(Number(value) || 0));
  saveStock();
}

function cartEntries() {
  return Object.entries(state.cart)
    .map(([id, quantity]) => ({ product: productById(id), quantity: Number(quantity) || 0 }))
    .filter((entry) => entry.product && entry.quantity > 0);
}

function sanitizeCart() {
  let changed = false;
  Object.keys(state.cart).forEach((id) => {
    const product = productById(id);
    if (!product) {
      delete state.cart[id];
      changed = true;
      return;
    }
    const capped = Math.min(Math.max(0, Number(state.cart[id]) || 0), stockFor(id));
    if (capped <= 0) {
      delete state.cart[id];
      changed = true;
    } else if (capped !== state.cart[id]) {
      state.cart[id] = capped;
      changed = true;
    }
  });
  if (changed) saveCart();
}

function cartTotals(deliveryMethod = "delivery") {
  const entries = cartEntries();
  const subtotal = entries.reduce((sum, entry) => sum + PRODUCT_PRICE * entry.quantity, 0);
  const delivery = subtotal > 0 && deliveryMethod === "delivery" ? DELIVERY_FEE : 0;
  return { entries, subtotal, delivery, total: subtotal + delivery };
}

function filteredProducts() {
  const query = state.query.trim().toLowerCase();
  const visible = products.filter((product) => {
    const matchesFilter =
      state.filter === "all" ||
      product.category === state.filter ||
      (state.filter === "low" && stockFor(product.id) <= 1);
    const matchesSearch = [product.flavour, product.profile, product.sku]
      .join(" ")
      .toLowerCase()
      .includes(query);
    return matchesFilter && matchesSearch;
  });

  return visible.sort((a, b) => {
    if (state.sort === "stock-high") return stockFor(b.id) - stockFor(a.id);
    if (state.sort === "stock-low") return stockFor(a.id) - stockFor(b.id);
    if (state.sort === "name") return a.flavour.localeCompare(b.flavour);
    return products.indexOf(a) - products.indexOf(b);
  });
}

function stockBadge(stock) {
  if (stock <= 0) return `<span class="stock-badge out">Sold out</span>`;
  if (stock <= 1) return `<span class="stock-badge low">${stock} left</span>`;
  return `<span class="stock-badge">${stock} in stock</span>`;
}

function renderProducts() {
  const visibleProducts = filteredProducts();
  if (resultCount) {
    resultCount.innerHTML = `Showing <strong>${visibleProducts.length}</strong> of <strong>${products.length}</strong> flavours`;
  }

  productGrid.innerHTML = visibleProducts.map((product) => {
    const stock = stockFor(product.id);
    const inCart = Number(state.cart[product.id] || 0);
    const disabled = stock <= 0 || inCart >= stock;
    const buttonText = stock <= 0 ? "Sold out" : inCart >= stock ? "Max in cart" : "Add";
    return `
      <article class="product-card reveal">
        <div class="image-tile">
          <img src="${product.image}" alt="${product.flavour} vape" />
          <span class="badge">R185</span>
          ${stockBadge(stock)}
          <span class="flavour-chip">${product.profile}</span>
        </div>
        <div class="product-meta">
          <div>
            <h3>${product.flavour}</h3>
            <p>${product.profile} profile. ${stock > 1 ? `${stock} units available` : stock === 1 ? "Last unit available" : "Currently sold out"} before delivery.</p>
            <div class="product-specs">
              <span>${product.sku}</span>
              <span>${product.category}</span>
              <span>${stock} available</span>
            </div>
          </div>
          <div class="product-buy">
            <strong>${money(PRODUCT_PRICE)}</strong>
            <button class="add-button" type="button" data-add="${product.id}" ${disabled ? "disabled" : ""} aria-label="Add ${product.flavour} to cart">${buttonText}</button>
          </div>
        </div>
      </article>
    `;
  }).join("") || `<div class="empty-state">No products match this search.</div>`;
}

function renderStockRibbon() {
  const ribbon = qs("[data-stock-ribbon]");
  if (!ribbon) return;
  const items = products.map((product) => `<span>${product.flavour}: ${stockFor(product.id)} in stock</span>`).join("");
  ribbon.innerHTML = items + items;
}

function renderHeroStats() {
  const totalStock = products.reduce((sum, product) => sum + stockFor(product.id), 0);
  const totalStockElement = qs("[data-total-stock]");
  const productCountElement = qs("[data-product-count]");
  if (totalStockElement) totalStockElement.textContent = `${totalStock} units`;
  if (productCountElement) productCountElement.textContent = `${products.length}`;
}

function renderCart() {
  sanitizeCart();
  const { entries, subtotal, delivery, total } = cartTotals("delivery");
  const count = entries.reduce((sum, entry) => sum + entry.quantity, 0);

  qs("[data-cart-count]").textContent = count;
  qs("[data-cart-title]").textContent = `${count} ${count === 1 ? "item" : "items"}`;
  qs("[data-subtotal]").textContent = money(subtotal);
  qs("[data-delivery]").textContent = money(delivery);
  qs("[data-total]").textContent = money(total);

  cartItems.innerHTML = entries.length ? entries.map(({ product, quantity }) => {
    const stock = stockFor(product.id);
    return `
      <article class="cart-item">
        <img src="${loneOrDefault(product)}" alt="${product.flavour} vape" />
        <div>
          <h4>${product.flavour}</h4>
          <p>${stock} available now</p>
          <div class="cart-controls">
            <div class="qty-controls" aria-label="Quantity controls">
              <button type="button" data-dec="${product.id}" aria-label="Decrease quantity">-</button>
              <strong>${quantity}</strong>
              <button type="button" data-inc="${product.id}" ${quantity >= stock ? "disabled" : ""} aria-label="Increase quantity">+</button>
            </div>
            <span class="cart-price">${money(PRODUCT_PRICE * quantity)}</span>
          </div>
          <button class="remove-button" type="button" data-remove="${product.id}">Remove</button>
        </div>
      </article>
    `;
  }).join("") : `<div class="empty-cart">Your cart is empty.<br />Add a flavour from the catalog.</div>`;

  renderCheckout();
}

function renderCheckout() {
  const method = qs("[data-delivery-method]")?.value || "delivery";
  const { entries, subtotal, delivery, total } = cartTotals(method);

  checkoutItems.innerHTML = entries.length ? entries.map(({ product, quantity }) => `
    <div class="checkout-line">
      <img src="${loneOrDefault(product)}" alt="${product.flavour} vape" />
      <div>
        <strong>${product.flavour}</strong>
        <span>${money(PRODUCT_PRICE)} x ${quantity}</span>
      </div>
      <strong>${money(PRODUCT_PRICE * quantity)}</strong>
    </div>
  `).join("") : `<div class="empty-cart">Your checkout is empty.</div>`;

  qs("[data-checkout-subtotal]").textContent = money(subtotal);
  qs("[data-checkout-delivery]").textContent = money(delivery);
  qs("[data-checkout-total]").textContent = money(total);
}

function renderAll() {
  renderHeroStats();
  renderStockRibbon();
  renderProducts();
  renderCart();
  renderAdmin();
}

function showToast(message = "Done") {
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 1600);
}

function animateToCart(button) {
  const sourceImage = button.closest(".product-card")?.querySelector(".image-tile img");
  const cartButton = qs("[data-open-cart]");
  if (!sourceImage || !cartButton) return;

  const imageRect = sourceImage.getBoundingClientRect();
  const cartRect = cartButton.getBoundingClientRect();
  const flyer = sourceImage.cloneNode();
  flyer.className = "fly-image";
  flyer.style.left = `${imageRect.left + imageRect.width / 2 - 38}px`;
  flyer.style.top = `${imageRect.top + imageRect.height / 2 - 38}px`;
  document.body.appendChild(flyer);

  requestAnimationFrame(() => {
    const x = cartRect.left + cartRect.width / 2 - (imageRect.left + imageRect.width / 2);
    const y = cartRect.top + cartRect.height / 2 - (imageRect.top + imageRect.height / 2);
    flyer.style.transform = `translate(${x}px, ${y}px) scale(0.24) rotate(8deg)`;
    flyer.style.opacity = "0.16";
  });

  window.setTimeout(() => flyer.remove(), 700);
}

function addToCart(id, button) {
  const product = productById(id);
  if (!product) return;
  const stock = stockFor(id);
  const current = Number(state.cart[id] || 0);
  if (stock <= 0) {
    showToast(`${product.flavour} is sold out`);
    return;
  }
  if (current >= stock) {
    showToast(`Only ${stock} ${product.flavour} available`);
    return;
  }

  state.cart[id] = current + 1;
  saveCart();
  renderAll();
  if (button) animateToCart(button);
  qsa("[data-open-cart]").forEach((cartButton) => {
    cartButton.classList.add("bump");
    window.setTimeout(() => cartButton.classList.remove("bump"), 260);
  });
  showToast(`${product.flavour} added`);
}

function openCart() {
  cartDrawer.classList.add("open");
  cartDrawer.setAttribute("aria-hidden", "false");
  updateBodyLock();
}

function closeCart() {
  cartDrawer.classList.remove("open");
  cartDrawer.setAttribute("aria-hidden", "true");
  updateBodyLock();
}

function openCheckout() {
  if (!cartEntries().length) {
    showToast("Add a product first");
    return;
  }
  closeCart();
  checkoutForm.hidden = false;
  checkoutSuccess.hidden = true;
  renderCheckout();
  checkoutModal.classList.add("open");
  checkoutModal.setAttribute("aria-hidden", "false");
  updateBodyLock();
}

function closeCheckout() {
  checkoutModal.classList.remove("open");
  checkoutModal.setAttribute("aria-hidden", "true");
  updateBodyLock();
}

function updateBodyLock() {
  document.body.classList.toggle(
    "cart-open",
    cartDrawer.classList.contains("open") ||
      checkoutModal.classList.contains("open") ||
      ownerModal.classList.contains("open")
  );
}

function createOrder({ source, customer, deliveryMethod, address, paymentMethod, items, delivery }) {
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  return {
    id: `AA-${Date.now().toString(36).toUpperCase()}`,
    createdAt: new Date().toISOString(),
    source,
    customer,
    deliveryMethod,
    address,
    paymentMethod,
    paymentStatus: paymentMethod === "cash" ? "Due on delivery" : "Pending card payment",
    fulfilmentStatus: source === "Counter sale" ? "Fulfilled" : "New",
    items,
    subtotal,
    delivery,
    total: subtotal + delivery
  };
}

function checkoutHasStock(entries) {
  return entries.every((entry) => stockFor(entry.product.id) >= entry.quantity);
}

function decrementStock(items) {
  items.forEach((item) => {
    setStock(item.id, stockFor(item.id) - item.quantity);
  });
}

function handleCheckoutSubmit(event) {
  event.preventDefault();
  const { entries, delivery } = cartTotals(qs("[data-delivery-method]")?.value || "delivery");
  if (!entries.length) {
    showToast("Cart is empty");
    return;
  }
  if (!checkoutHasStock(entries)) {
    sanitizeCart();
    renderAll();
    showToast("Cart updated to match available stock");
    return;
  }

  const form = new FormData(checkoutForm);
  const deliveryMethod = String(form.get("delivery_method") || "delivery");
  const address = String(form.get("address") || "").trim();
  if (deliveryMethod === "delivery" && !address) {
    showToast("Add a delivery address");
    return;
  }

  const order = createOrder({
    source: "Online checkout",
    customer: {
      name: String(form.get("customer_name") || "Customer").trim(),
      phone: String(form.get("phone") || "").trim(),
      email: String(form.get("email") || "").trim()
    },
    deliveryMethod,
    address,
    paymentMethod: String(form.get("payment_method") || "cash"),
    delivery,
    items: entries.map(({ product, quantity }) => ({
      id: product.id,
      sku: product.sku,
      flavour: product.flavour,
      unitPrice: PRODUCT_PRICE,
      quantity
    }))
  });

  state.orders.unshift(order);
  decrementStock(order.items);
  state.cart = {};
  saveOrders();
  saveCart();
  saveStock();
  checkoutForm.reset();
  qs("[data-success-order]").textContent = order.id;
  checkoutForm.hidden = true;
  checkoutSuccess.hidden = false;
  renderAll();
}

function productOptions(selectedId = "") {
  return products.map((product) => `<option value="${product.id}" ${product.id === selectedId ? "selected" : ""}>${product.flavour} (${stockFor(product.id)} in stock)</option>`).join("");
}

function orderItemText(order) {
  return order.items.map((item) => `${item.flavour} x ${item.quantity}`).join(", ");
}

function orderUnits(order) {
  return order.items.reduce((sum, item) => sum + item.quantity, 0);
}

function formatDate(value) {
  return new Intl.DateTimeFormat("en-ZA", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function salesStats() {
  const activeOrders = state.orders.filter((order) => order.fulfilmentStatus !== "Cancelled");
  const totalRevenue = activeOrders.reduce((sum, order) => sum + order.total, 0);
  const unitsSold = activeOrders.reduce((sum, order) => sum + orderUnits(order), 0);
  const cashTotal = activeOrders.filter((order) => order.paymentMethod === "cash").reduce((sum, order) => sum + order.total, 0);
  const cardTotal = activeOrders.filter((order) => order.paymentMethod === "card").reduce((sum, order) => sum + order.total, 0);
  const totalStock = products.reduce((sum, product) => sum + stockFor(product.id), 0);
  return { activeOrders, totalRevenue, unitsSold, cashTotal, cardTotal, totalStock };
}

function renderAdmin() {
  if (!adminConsole || adminConsole.hidden) return;
  qsa("[data-admin-tab]").forEach((button) => button.classList.toggle("active", button.dataset.adminTab === state.adminTab));
  const views = {
    overview: renderAdminOverview,
    inventory: renderAdminInventory,
    sales: renderAdminSales,
    counter: renderAdminCounter,
    purchases: renderAdminPurchases
  };
  adminContent.innerHTML = (views[state.adminTab] || renderAdminOverview)();
}

function renderAdminOverview() {
  const stats = salesStats();
  const lowStock = products.filter((product) => stockFor(product.id) <= 1);
  const recentOrders = state.orders.slice(0, 4);
  return `
    <div class="stat-grid">
      <article class="stat-card"><span>Stock</span><strong>${stats.totalStock}</strong><p>Units available</p></article>
      <article class="stat-card"><span>Value</span><strong>${money(stats.totalStock * PRODUCT_PRICE)}</strong><p>Retail stock value</p></article>
      <article class="stat-card"><span>Sold</span><strong>${stats.unitsSold}</strong><p>Units recorded</p></article>
      <article class="stat-card"><span>Revenue</span><strong>${money(stats.totalRevenue)}</strong><p>Cash ${money(stats.cashTotal)} / Card ${money(stats.cardTotal)}</p></article>
    </div>
    <div class="admin-grid">
      <section class="admin-panel">
        <h3>Low stock</h3>
        <div class="ledger-list">
          ${lowStock.length ? lowStock.map((product) => `
            <article class="ledger-row">
              <div class="ledger-head">
                <div><span>${product.sku}</span><strong>${product.flavour}</strong></div>
                <strong>${stockFor(product.id)} left</strong>
              </div>
              <p>${product.profile} profile at ${money(PRODUCT_PRICE)} each.</p>
            </article>
          `).join("") : `<div class="empty-state">No low stock products.</div>`}
        </div>
      </section>
      <section class="admin-panel">
        <h3>Recent sales</h3>
        <div class="ledger-list">
          ${recentOrders.length ? recentOrders.map((order) => `
            <article class="ledger-row">
              <div class="ledger-head">
                <div><span>${order.source}</span><strong>${order.id}</strong></div>
                <strong>${money(order.total)}</strong>
              </div>
              <p>${orderItemText(order)}. ${order.paymentMethod.toUpperCase()} / ${order.fulfilmentStatus}</p>
            </article>
          `).join("") : `<div class="empty-state">No sales recorded yet.</div>`}
        </div>
      </section>
    </div>
  `;
}

function renderAdminInventory() {
  return `
    <div class="inventory-table">
      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th>Stock</th>
            <th>Sold</th>
            <th>Retail value</th>
            <th>Update stock</th>
          </tr>
        </thead>
        <tbody>
          ${products.map((product) => {
            const sold = state.orders
              .filter((order) => order.fulfilmentStatus !== "Cancelled")
              .flatMap((order) => order.items)
              .filter((item) => item.id === product.id)
              .reduce((sum, item) => sum + item.quantity, 0);
            return `
              <tr>
                <td>
                  <div class="inventory-product">
                    <img src="${product.image}" alt="${product.flavour} vape" />
                    <div><strong>${product.flavour}</strong><span>${product.sku} / ${product.profile}</span></div>
                  </div>
                </td>
                <td>${stockFor(product.id)}</td>
                <td>${sold}</td>
                <td>${money(stockFor(product.id) * PRODUCT_PRICE)}</td>
                <td>
                  <div class="stock-controls">
                    <input type="number" min="0" data-stock-input="${product.id}" value="${stockFor(product.id)}" aria-label="Stock for ${product.flavour}" />
                    <button type="button" data-stock-action="decrement" data-stock-id="${product.id}" aria-label="Decrease stock">-</button>
                    <button type="button" data-stock-action="set" data-stock-id="${product.id}" aria-label="Set stock">OK</button>
                    <button type="button" data-stock-action="increment" data-stock-id="${product.id}" aria-label="Increase stock">+</button>
                  </div>
                </td>
              </tr>
            `;
          }).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderAdminSales() {
  return `
    <div class="order-list">
      ${state.orders.length ? state.orders.map((order) => `
        <article class="order-card">
          <div class="order-head">
            <div>
              <span>${order.source} / ${formatDate(order.createdAt)}</span>
              <strong>${order.id}</strong>
            </div>
            <strong>${money(order.total)}</strong>
          </div>
          <p>${order.customer.name || "Customer"} ${order.customer.phone ? "/ " + order.customer.phone : ""}</p>
          <div class="order-items">
            ${order.items.map((item) => `<span>${item.flavour} x ${item.quantity}</span>`).join("")}
          </div>
          <div class="status-row">
            <label><span>Payment</span>
              <select data-order-field="paymentStatus" data-order-id="${order.id}">
                ${["Due on delivery", "Pending card payment", "Paid", "Refunded"].map((status) => `<option value="${status}" ${order.paymentStatus === status ? "selected" : ""}>${status}</option>`).join("")}
              </select>
            </label>
            <label><span>Fulfilment</span>
              <select data-order-field="fulfilmentStatus" data-order-id="${order.id}">
                ${["New", "Packed", "Out for delivery", "Fulfilled", "Cancelled"].map((status) => `<option value="${status}" ${order.fulfilmentStatus === status ? "selected" : ""}>${status}</option>`).join("")}
              </select>
            </label>
          </div>
        </article>
      `).join("") : `<div class="empty-state">No sales recorded yet.</div>`}
    </div>
  `;
}

function renderAdminCounter() {
  return `
    <form class="quick-form" data-counter-form>
      <h3>Record counter sale</h3>
      <div class="form-grid">
        <label><span>Product</span><select name="product_id">${productOptions()}</select></label>
        <label><span>Quantity</span><input name="quantity" type="number" min="1" value="1" /></label>
        <label><span>Payment</span>
          <select name="payment_method">
            <option value="cash">Cash</option>
            <option value="card">Card</option>
          </select>
        </label>
        <label><span>Customer note</span><input name="customer_name" type="text" placeholder="Walk-in customer" /></label>
      </div>
      <button class="primary-button" type="submit">Record sale</button>
    </form>
  `;
}

function renderAdminPurchases() {
  return `
    <div class="admin-grid">
      <form class="quick-form" data-purchase-form>
        <h3>Log stock purchase</h3>
        <div class="form-grid">
          <label><span>Product</span><select name="product_id">${productOptions()}</select></label>
          <label><span>Quantity bought</span><input name="quantity" type="number" min="1" value="1" /></label>
          <label><span>Unit cost</span><input name="unit_cost" type="number" min="0" step="0.01" placeholder="0.00" /></label>
          <label><span>Paid by</span>
            <select name="payment_method">
              <option value="cash">Cash</option>
              <option value="card">Card</option>
            </select>
          </label>
        </div>
        <label><span>Supplier or note</span><textarea name="note" rows="3" placeholder="Supplier, invoice, or stock note"></textarea></label>
        <button class="primary-button" type="submit">Save purchase</button>
      </form>
      <section class="admin-panel">
        <h3>Purchase log</h3>
        <div class="ledger-list">
          ${state.purchases.length ? state.purchases.map((purchase) => `
            <article class="ledger-row">
              <div class="ledger-head">
                <div><span>${formatDate(purchase.createdAt)}</span><strong>${purchase.flavour} x ${purchase.quantity}</strong></div>
                <strong>${money(purchase.totalCost)}</strong>
              </div>
              <p>${purchase.paymentMethod.toUpperCase()}${purchase.note ? " / " + purchase.note : ""}</p>
            </article>
          `).join("") : `<div class="empty-state">No purchases logged yet.</div>`}
        </div>
      </section>
    </div>
  `;
}

function handleCounterSale(event) {
  event.preventDefault();
  const form = new FormData(event.target);
  const product = productById(String(form.get("product_id")));
  const quantity = Math.max(1, Math.floor(Number(form.get("quantity")) || 1));
  if (!product) return;
  if (stockFor(product.id) < quantity) {
    showToast(`Only ${stockFor(product.id)} ${product.flavour} available`);
    return;
  }

  const order = createOrder({
    source: "Counter sale",
    customer: {
      name: String(form.get("customer_name") || "Walk-in customer").trim() || "Walk-in customer",
      phone: "",
      email: ""
    },
    deliveryMethod: "collection",
    address: "Counter sale",
    paymentMethod: String(form.get("payment_method") || "cash"),
    delivery: 0,
    items: [{
      id: product.id,
      sku: product.sku,
      flavour: product.flavour,
      unitPrice: PRODUCT_PRICE,
      quantity
    }]
  });
  order.paymentStatus = "Paid";

  state.orders.unshift(order);
  decrementStock(order.items);
  saveOrders();
  saveStock();
  event.target.reset();
  renderAll();
  showToast("Counter sale recorded");
}

function handlePurchase(event) {
  event.preventDefault();
  const form = new FormData(event.target);
  const product = productById(String(form.get("product_id")));
  const quantity = Math.max(1, Math.floor(Number(form.get("quantity")) || 1));
  const unitCost = Math.max(0, Number(form.get("unit_cost")) || 0);
  if (!product) return;

  const purchase = {
    id: `PO-${Date.now().toString(36).toUpperCase()}`,
    createdAt: new Date().toISOString(),
    productId: product.id,
    flavour: product.flavour,
    quantity,
    unitCost,
    totalCost: quantity * unitCost,
    paymentMethod: String(form.get("payment_method") || "cash"),
    note: String(form.get("note") || "").trim()
  };

  state.purchases.unshift(purchase);
  setStock(product.id, stockFor(product.id) + quantity);
  savePurchases();
  event.target.reset();
  renderAll();
  showToast("Stock purchase logged");
}

function unlockAdmin() {
  sessionStorage.setItem(storageKeys.admin, "yes");
  adminGate.hidden = true;
  adminConsole.hidden = false;
  renderAdmin();
}

function lockAdmin() {
  sessionStorage.removeItem(storageKeys.admin);
  adminGate.hidden = false;
  adminConsole.hidden = true;
  qs("[data-admin-error]").textContent = "";
}

function openOwnerConsole() {
  ownerModal.classList.add("open");
  ownerModal.setAttribute("aria-hidden", "false");
  if (sessionStorage.getItem(storageKeys.admin) === "yes") {
    unlockAdmin();
  } else {
    lockAdmin();
    window.setTimeout(() => adminGate.querySelector("input")?.focus(), 80);
  }
  updateBodyLock();
}

function closeOwnerConsole() {
  ownerModal.classList.remove("open");
  ownerModal.setAttribute("aria-hidden", "true");
  updateBodyLock();
}

function shouldOpenOwnerConsole() {
  const params = new URLSearchParams(window.location.search);
  return params.get("owner") === "1" || window.location.hash === "#owner" || window.location.hash === "#internal";
}

function openOwnerConsoleFromRoute() {
  if (shouldOpenOwnerConsole()) openOwnerConsole();
}

function toggleMenu() {
  const isOpen = siteHeader.classList.toggle("menu-open");
  menuButton.setAttribute("aria-expanded", String(isOpen));
  menuButton.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
}

function closeMenu() {
  siteHeader.classList.remove("menu-open");
  menuButton.setAttribute("aria-expanded", "false");
  menuButton.setAttribute("aria-label", "Open menu");
}

function initAgeGate() {
  if (localStorage.getItem(storageKeys.age) === "yes") return;
  ageModal.classList.add("open");
  ageModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("age-locked");
}

document.addEventListener("click", (event) => {
  const add = event.target.closest("[data-add]");
  const inc = event.target.closest("[data-inc]");
  const dec = event.target.closest("[data-dec]");
  const remove = event.target.closest("[data-remove]");
  const adminTab = event.target.closest("[data-admin-tab]");
  const stockButton = event.target.closest("[data-stock-action]");

  if (add) addToCart(add.dataset.add, add);

  if (inc) {
    const id = inc.dataset.inc;
    if (Number(state.cart[id] || 0) < stockFor(id)) {
      state.cart[id] = Number(state.cart[id] || 0) + 1;
      saveCart();
      renderAll();
    }
  }

  if (dec) {
    const id = dec.dataset.dec;
    state.cart[id] = Number(state.cart[id] || 0) - 1;
    if (state.cart[id] <= 0) delete state.cart[id];
    saveCart();
    renderAll();
  }

  if (remove) {
    delete state.cart[remove.dataset.remove];
    saveCart();
    renderAll();
  }

  if (adminTab) {
    state.adminTab = adminTab.dataset.adminTab;
    renderAdmin();
  }

  if (stockButton) {
    const id = stockButton.dataset.stockId;
    const input = qs(`[data-stock-input="${id}"]`);
    if (stockButton.dataset.stockAction === "increment") setStock(id, stockFor(id) + 1);
    if (stockButton.dataset.stockAction === "decrement") setStock(id, stockFor(id) - 1);
    if (stockButton.dataset.stockAction === "set") setStock(id, input?.value);
    renderAll();
    showToast("Stock updated");
  }
});

qsa("[data-filter]").forEach((button) => {
  button.addEventListener("click", () => {
    state.filter = button.dataset.filter;
    qsa("[data-filter]").forEach((item) => item.classList.toggle("active", item === button));
    renderProducts();
  });
});

qs("[data-sort]").addEventListener("change", (event) => {
  state.sort = event.target.value;
  renderProducts();
});

qs("[data-search]").addEventListener("input", (event) => {
  state.query = event.target.value;
  renderProducts();
});

cartButtons.forEach((button) => button.addEventListener("click", openCart));
qs("[data-close-cart]").addEventListener("click", closeCart);
qs("[data-open-checkout]").addEventListener("click", openCheckout);
qs("[data-close-checkout]").addEventListener("click", closeCheckout);
qs("[data-close-success]").addEventListener("click", closeCheckout);
qs("[data-close-admin]").addEventListener("click", closeOwnerConsole);
qs("[data-delivery-method]").addEventListener("change", renderCheckout);
checkoutForm.addEventListener("submit", handleCheckoutSubmit);

adminGate.addEventListener("submit", (event) => {
  event.preventDefault();
  const pin = new FormData(adminGate).get("pin");
  if (pin === STAFF_PIN) {
    qs("[data-admin-error]").textContent = "";
    adminGate.reset();
    unlockAdmin();
  } else {
    qs("[data-admin-error]").textContent = "Incorrect PIN.";
  }
});

qs("[data-admin-lock]").addEventListener("click", lockAdmin);

document.addEventListener("submit", (event) => {
  if (event.target.matches("[data-counter-form]")) handleCounterSale(event);
  if (event.target.matches("[data-purchase-form]")) handlePurchase(event);
});

document.addEventListener("change", (event) => {
  const orderField = event.target.closest("[data-order-field]");
  if (!orderField) return;
  const order = state.orders.find((item) => item.id === orderField.dataset.orderId);
  if (!order) return;
  order[orderField.dataset.orderField] = orderField.value;
  saveOrders();
  renderAdmin();
  showToast("Order updated");
});

menuButton.addEventListener("click", toggleMenu);
primaryNav.addEventListener("click", (event) => {
  if (event.target.closest("a, button")) closeMenu();
});
cartDrawer.addEventListener("click", (event) => {
  if (event.target === cartDrawer) closeCart();
});
checkoutModal.addEventListener("click", (event) => {
  if (event.target === checkoutModal) closeCheckout();
});
ownerModal.addEventListener("click", (event) => {
  if (event.target === ownerModal) closeOwnerConsole();
});
window.addEventListener("keydown", (event) => {
  if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "o") {
    event.preventDefault();
    openOwnerConsole();
    return;
  }
  if (event.key === "Escape") {
    closeCart();
    closeCheckout();
    closeOwnerConsole();
    closeMenu();
  }
});
window.addEventListener("resize", () => {
  if (window.innerWidth > 760) closeMenu();
});
window.addEventListener("hashchange", openOwnerConsoleFromRoute);

qs("[data-confirm-age]").addEventListener("click", () => {
  localStorage.setItem(storageKeys.age, "yes");
  ageModal.classList.remove("open");
  ageModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("age-locked");
});

if (sessionStorage.getItem(storageKeys.admin) === "yes") {
  unlockAdmin();
}

renderAll();
initAgeGate();
openOwnerConsoleFromRoute();
