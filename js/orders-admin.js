(() => {
  "use strict";

  const loginForm = document.querySelector("[data-admin-form]");
  const accessPanel = document.querySelector("[data-access-panel]");
  const resultsPanel = document.querySelector("[data-orders-results]");
  const status = document.querySelector("[data-orders-status]");
  const orderList = document.querySelector("[data-orders-list]");
  const orderCount = document.querySelector("[data-order-count]");
  let accessToken = "";

  function addText(parent, tag, text, className) {
    const element = document.createElement(tag);
    element.textContent = text;
    if (className) element.className = className;
    parent.append(element);
    return element;
  }

  function formatMoney(value) {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(value);
  }

  function renderOrder(order) {
    const details = document.createElement("details");
    details.className = "order-record";
    const summary = document.createElement("summary");
    addText(summary, "span", `#${order.id.slice(0, 8)} · ${new Date(order.createdAt).toLocaleString("en-IN")}`, "order-id");
    addText(summary, "strong", order.customer.name, "order-customer");
    addText(summary, "span", formatMoney(order.subtotal), "order-total");
    details.append(summary);

    const content = document.createElement("div");
    content.className = "order-content";
    const customer = document.createElement("section");
    customer.className = "order-block";
    addText(customer, "h3", "Customer");
    addText(customer, "p", order.customer.name);
    addText(customer, "p", order.customer.phone);
    if (order.customer.email) addText(customer, "p", order.customer.email);
    addText(customer, "p", `Payment preference: ${order.paymentPreference}`);
    addText(content, "div", `Order status: ${order.status}`, "order-status");
    content.append(customer);

    const address = document.createElement("section");
    address.className = "order-block";
    addText(address, "h3", "Delivery address");
    [order.shippingAddress.addressLine1, order.shippingAddress.addressLine2, order.shippingAddress.locality, order.shippingAddress.city, order.shippingAddress.district, order.shippingAddress.state, order.shippingAddress.postalCode, order.shippingAddress.country, order.shippingAddress.landmark && `Landmark: ${order.shippingAddress.landmark}`, order.shippingAddress.deliveryInstructions && `Instructions: ${order.shippingAddress.deliveryInstructions}`]
      .filter(Boolean)
      .forEach((line) => addText(address, "p", line));
    content.append(address);

    const items = document.createElement("section");
    items.className = "order-block order-items";
    addText(items, "h3", "Items");
    const list = document.createElement("ul");
    order.items.forEach((item) => addText(list, "li", `${item.name} · ${item.size} · Qty ${item.quantity} · ${formatMoney(item.unitPrice)} each`));
    items.append(list);
    addText(items, "p", `Subtotal: ${formatMoney(order.subtotal)}`, "order-subtotal");
    content.append(items);
    details.append(content);
    return details;
  }

  async function loadOrders() {
    status.textContent = "Loading orders…";
    try {
      const response = await fetch("/api/orders", { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not load orders.");
      orderList.replaceChildren();
      result.orders.forEach((order) => orderList.append(renderOrder(order)));
      orderCount.textContent = `${result.total} stored · showing ${result.orders.length} most recent`;
      accessPanel.hidden = true;
      resultsPanel.hidden = false;
      status.textContent = "";
    } catch (error) {
      status.textContent = error.message === "Unauthorized." ? "That access token was not accepted." : error.message;
      if (error.message === "Unauthorized.") accessToken = "";
    }
  }

  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();
    accessToken = document.querySelector("#admin-token").value;
    loadOrders();
  });
  document.querySelector("[data-refresh]").addEventListener("click", loadOrders);
  document.querySelector("[data-sign-out]").addEventListener("click", () => {
    accessToken = "";
    loginForm.reset();
    orderList.replaceChildren();
    resultsPanel.hidden = true;
    accessPanel.hidden = false;
    document.querySelector("#admin-token").focus();
  });
})();
