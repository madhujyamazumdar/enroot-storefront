/* Shared storefront behavior: navigation, product cards, cart, and checkout. */
(() => {
  "use strict";

  const CART_KEY = "enroot-cart";
  const SHOP_PHONES = ["916000758804", "919116584882"];
  const SHOP_EMAIL = "hello@enroot.in"; // Replace with your customer support email.
  const CURRENCY = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
  const products = window.ENROOT_PRODUCTS || [];
  const byId = (id) => products.find((product) => product.id === String(id));
  const money = (value) => CURRENCY.format(value);
  const safeText = (value) => String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
  const formatPhone = (phone) => `+${phone.slice(0, 2)} ${phone.slice(2, 7)} ${phone.slice(7)}`;
  const whatsappUrl = (phone, message) => `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

  function openWhatsAppChats(message) {
    SHOP_PHONES.forEach((phone) => {
      window.open(whatsappUrl(phone, message), "_blank", "noopener,noreferrer");
    });
  }

  function readCart() {
    try {
      const stored = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
      return Array.isArray(stored) ? stored.filter((item) => byId(item.id) && Number.isInteger(item.quantity) && item.quantity > 0) : [];
    } catch {
      return [];
    }
  }

  function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartCount();
  }

  function updateCartCount() {
    const count = readCart().reduce((total, item) => total + item.quantity, 0);
    document.querySelectorAll(".cart-count").forEach((element) => { element.textContent = count; });
  }

  function productCard(product) {
    const badge = product.badge ? `<span class="product-badge">${safeText(product.badge)}</span>` : "";
    const previous = product.originalPrice ? `<del>${money(product.originalPrice)}</del>` : "";
    return `<article class="product-card"><a class="product-image-wrap" href="product.html?id=${encodeURIComponent(product.id)}">${badge}<img src="${safeText(product.image)}" alt="${safeText(product.imageAlt)}" loading="lazy"></a><div class="product-card-info"><div><p class="product-category">${safeText(product.category)} · ${safeText(product.color)}</p><h3><a href="product.html?id=${encodeURIComponent(product.id)}">${safeText(product.name)}</a></h3></div><div class="product-price">${money(product.price)} ${previous}</div></div><button class="quick-add" type="button" data-add-to-cart="${safeText(product.id)}">Add to bag <span aria-hidden="true">+</span></button></article>`;
  }

  function addToCart(id, size) {
    const product = byId(id);
    if (!product) return;
    const selectedSize = size || product.sizes[0];
    const cart = readCart();
    const existing = cart.find((item) => item.id === product.id && item.size === selectedSize);
    if (existing) existing.quantity += 1;
    else cart.push({ id: product.id, size: selectedSize, quantity: 1 });
    saveCart(cart);
    const button = document.querySelector(`[data-add-to-cart="${CSS.escape(product.id)}"]`);
    if (button) {
      const original = button.innerHTML;
      button.innerHTML = 'Added to bag <span aria-hidden="true">✓</span>';
      window.setTimeout(() => { button.innerHTML = original; }, 1400);
    }
  }

  function renderProductLists() {
    const featured = document.querySelector("[data-featured-products]");
    if (featured) featured.innerHTML = products.slice(0, 3).map(productCard).join("");
    const shop = document.querySelector("[data-shop-products]");
    if (shop) {
      const sort = document.querySelector("[data-sort]");
      const draw = () => {
        const sorted = [...products];
        if (sort.value === "price-low") sorted.sort((a, b) => a.price - b.price);
        if (sort.value === "price-high") sorted.sort((a, b) => b.price - a.price);
        shop.innerHTML = sorted.map(productCard).join("");
      };
      sort.addEventListener("change", draw);
      draw();
      const count = document.querySelector("[data-product-count]");
      if (count) count.textContent = products.length;
    }
  }

  function renderProductDetail() {
    const container = document.querySelector("[data-product-detail]");
    if (!container) return;
    const params = new URLSearchParams(window.location.search);
    const product = byId(params.get("id")) || products[0];
    if (!product) {
      container.innerHTML = '<section class="page-intro"><h1>No pieces found.</h1><a class="button button-dark" href="shop.html">Back to shop</a></section>';
      return;
    }
    document.title = `${product.name} | Enroot`;
    const description = document.querySelector('meta[name="description"]');
    if (description) description.content = product.description;
    const socialTitle = document.querySelector('meta[property="og:title"]');
    if (socialTitle) socialTitle.content = `${product.name} | Enroot`;
    const socialDescription = document.querySelector('meta[property="og:description"]');
    if (socialDescription) socialDescription.content = product.description;
    const socialImage = document.querySelector('meta[property="og:image"]');
    if (socialImage) socialImage.content = product.image;
    const sizes = product.sizes.map((size, index) => `<label class="size-option"><input type="radio" name="size" value="${safeText(size)}" ${index === 0 ? "checked" : ""}><span>${safeText(size)}</span></label>`).join("");
    container.innerHTML = `<nav class="breadcrumbs" aria-label="Breadcrumb"><a href="index.html">Home</a><span>/</span><a href="shop.html">Shop</a><span>/</span><span>${safeText(product.name)}</span></nav><section class="product-detail-layout"><div class="detail-image"><img src="${safeText(product.image)}" alt="${safeText(product.imageAlt)}"></div><div class="detail-copy"><p class="eyebrow">${safeText(product.category)} · ${safeText(product.color)}</p><h1>${safeText(product.name)}</h1><p class="detail-price">${money(product.price)} ${product.originalPrice ? `<del>${money(product.originalPrice)}</del>` : ""}</p><p class="detail-description">${safeText(product.description)}</p><p class="fit-note">${safeText(product.fit)}</p><fieldset class="size-picker"><legend>Choose a size <a href="contact.html#size-guide">Size guide ↗</a></legend><div>${sizes}</div></fieldset><button class="button button-dark detail-add" type="button" data-detail-add="${safeText(product.id)}">Add to bag <span aria-hidden="true">+</span></button><p class="detail-assurance">Complimentary shipping on orders over ₹999 · UPI & Cash on Delivery</p><details class="detail-accordion"><summary>Shipping & returns</summary><p>We'll confirm delivery timing on WhatsApp. Contact us within 7 days of delivery for help with an unused item in its original condition.</p></details></div></section><section class="related-products"><div class="section-heading"><div><p class="eyebrow">A few more to love</p><h2>Keep it <em>simple.</em></h2></div><a class="text-link" href="shop.html">Shop all <span aria-hidden="true">↗</span></a></div><div class="product-grid">${products.filter((item) => item.id !== product.id).slice(0, 3).map(productCard).join("")}</div></section>`;
  }

  function renderCart() {
    const container = document.querySelector("[data-cart-items]");
    if (!container) return;
    const cart = readCart();
    const panel = document.querySelector("[data-checkout-panel]");
    const totalElement = document.querySelector("[data-cart-total]");
    if (!cart.length) {
      container.innerHTML = '<div class="empty-cart"><p class="eyebrow">A fresh beginning</p><h2>Your bag is waiting.</h2><p>Find a piece that feels like you.</p><a class="button button-dark" href="shop.html">Explore the collection <span aria-hidden="true">↗</span></a></div>';
      if (panel) panel.classList.add("checkout-disabled");
      if (totalElement) totalElement.textContent = money(0);
      return;
    }
    if (panel) panel.classList.remove("checkout-disabled");
    container.innerHTML = cart.map((item) => {
      const product = byId(item.id);
      return `<article class="cart-item"><img src="${safeText(product.image)}" alt="${safeText(product.imageAlt)}"><div class="cart-item-info"><p class="product-category">${safeText(product.category)} · ${safeText(product.color)}</p><h2><a href="product.html?id=${encodeURIComponent(product.id)}">${safeText(product.name)}</a></h2><p>Size: ${safeText(item.size)}</p><strong>${money(product.price)}</strong><div class="cart-item-actions"><label>Qty <select data-quantity="${safeText(item.id)}" data-size="${safeText(item.size)}" aria-label="Quantity for ${safeText(product.name)}">${Array.from({ length: 10 }, (_, index) => `<option value="${index + 1}" ${item.quantity === index + 1 ? "selected" : ""}>${index + 1}</option>`).join("")}</select></label><button class="remove-item" type="button" data-remove="${safeText(item.id)}" data-size="${safeText(item.size)}">Remove</button></div></div><strong class="cart-item-subtotal">${money(product.price * item.quantity)}</strong></article>`;
    }).join("");
    const total = cart.reduce((sum, item) => sum + byId(item.id).price * item.quantity, 0);
    if (totalElement) totalElement.textContent = money(total);
  }

  function handleCheckout(event) {
    event.preventDefault();
    const cart = readCart();
    if (!cart.length) return;
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const formData = new FormData(form);
    const lines = cart.map((item) => {
      const product = byId(item.id);
      return `- ${product.name} (${item.size}) x ${item.quantity}: ${money(product.price * item.quantity)}`;
    });
    const total = cart.reduce((sum, item) => sum + byId(item.id).price * item.quantity, 0);
    const addressLines = [
      `Address line 1: ${formData.get("addressLine1")}`,
      formData.get("addressLine2") && `Address line 2: ${formData.get("addressLine2")}`,
      `Area / locality: ${formData.get("locality")}`,
      `City / town / village: ${formData.get("city")}`,
      formData.get("district") && `District: ${formData.get("district")}`,
      `State / province / UT: ${formData.get("state")}`,
      `PIN / postal code: ${formData.get("postalCode")}`,
      `Country: ${formData.get("country")}`,
      formData.get("landmark") && `Landmark: ${formData.get("landmark")}`,
      formData.get("deliveryInstructions") && `Delivery instructions: ${formData.get("deliveryInstructions")}`
    ].filter(Boolean);
    const message = ["Hello Enroot, I'd like to place this order:", "", ...lines, "", `Subtotal: ${money(total)}`, `Payment preference: ${formData.get("payment")}`, "", `Name: ${formData.get("name")}`, `Phone: ${formData.get("phone")}`, "", "Delivery address:", ...addressLines].join("\n");
    openWhatsAppChats(message);
    const status = document.querySelector("[data-checkout-message]");
    if (status) status.textContent = "Both WhatsApp chats are ready. Send the order message in each chat to share it with both numbers.";
  }

  function updateBusinessDetails() {
    document.querySelectorAll("[data-whatsapp]").forEach((link) => {
      const text = link.classList.contains("whatsapp-float") ? "Hello Enroot, I have a question about your collection." : "Hello Enroot, I have a question.";
      link.href = whatsappUrl(SHOP_PHONES[0], text);
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.addEventListener("click", () => {
        SHOP_PHONES.slice(1).forEach((phone) => window.open(whatsappUrl(phone, text), "_blank", "noopener,noreferrer"));
      });
    });
    document.querySelectorAll("[data-contact-phone]").forEach((item) => { item.textContent = SHOP_PHONES.map(formatPhone).join(" · "); });
    document.querySelectorAll("[data-phone]").forEach((item) => { item.textContent = formatPhone(SHOP_PHONES[0]); });
    document.querySelectorAll("[data-phone-link]").forEach((link) => { link.href = `tel:+${SHOP_PHONES[0]}`; });
    document.querySelectorAll("[data-email]").forEach((item) => { item.textContent = SHOP_EMAIL; });
    document.querySelectorAll("[data-email-link]").forEach((link) => { link.href = `mailto:${SHOP_EMAIL}`; });
  }

  function setupInteractions() {
    const menuButton = document.querySelector(".menu-toggle");
    const nav = document.querySelector(".main-nav");
    if (menuButton && nav) menuButton.addEventListener("click", () => {
      const expanded = menuButton.getAttribute("aria-expanded") === "true";
      menuButton.setAttribute("aria-expanded", String(!expanded));
      menuButton.setAttribute("aria-label", expanded ? "Open navigation" : "Close navigation");
      nav.classList.toggle("is-open", !expanded);
      document.body.classList.toggle("menu-open", !expanded);
    });
    document.addEventListener("click", (event) => {
      const addButton = event.target.closest("[data-add-to-cart]");
      if (addButton) addToCart(addButton.dataset.addToCart);
      const detailButton = event.target.closest("[data-detail-add]");
      if (detailButton) {
        const size = document.querySelector('input[name="size"]:checked')?.value;
        addToCart(detailButton.dataset.detailAdd, size);
        detailButton.textContent = "Added to bag ✓";
        window.setTimeout(() => { detailButton.innerHTML = 'Add to bag <span aria-hidden="true">+</span>'; }, 1400);
      }
      const removeButton = event.target.closest("[data-remove]");
      if (removeButton) {
        saveCart(readCart().filter((item) => !(item.id === removeButton.dataset.remove && item.size === removeButton.dataset.size)));
        renderCart();
      }
    });
    document.addEventListener("change", (event) => {
      if (!event.target.matches("[data-quantity]")) return;
      const { size } = event.target.dataset;
      const id = event.target.dataset.quantity;
      const cart = readCart();
      const item = cart.find((entry) => entry.id === id && entry.size === size);
      if (item) item.quantity = Number(event.target.value);
      saveCart(cart);
      renderCart();
    });
    const checkout = document.querySelector("[data-checkout-form]");
    if (checkout) checkout.addEventListener("submit", handleCheckout);
    const contactForm = document.querySelector("[data-contact-form]");
    if (contactForm) contactForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const values = new FormData(contactForm);
      const subject = encodeURIComponent(`Enroot website message from ${values.get("name")}`);
      const body = encodeURIComponent(`Name: ${values.get("name")}\nEmail: ${values.get("email")}\n\n${values.get("message")}`);
      window.location.href = `mailto:${SHOP_EMAIL}?subject=${subject}&body=${body}`;
      contactForm.querySelector(".form-message").textContent = "Your email app will open with your message ready to send.";
    });
    document.querySelectorAll("[data-newsletter]").forEach((form) => form.addEventListener("submit", (event) => {
      event.preventDefault();
      form.parentElement.querySelector(".form-message").textContent = "Thank you. Newsletter sign-up will be available soon.";
      form.reset();
    }));
    document.querySelectorAll("[data-year]").forEach((item) => { item.textContent = new Date().getFullYear(); });
  }

  document.addEventListener("DOMContentLoaded", () => {
    updateCartCount();
    renderProductLists();
    renderProductDetail();
    renderCart();
    updateBusinessDetails();
    setupInteractions();
  });
})();