import { createHash, randomUUID, timingSafeEqual } from "node:crypto";
import { getStore } from "@netlify/blobs";

const STORE_NAME = "enroot-orders";
const STORE_REGION = "ap-southeast-1";
const PRIVACY_POLICY_VERSION = "2026-09-28";
const MAX_BODY_BYTES = 64 * 1024;
const MAX_ORDERS_IN_DASHBOARD = 200;
const PRODUCTS = {
  "1": { name: "The Everyday Linen Shirt", category: "Tops", unitPrice: 1290, sizes: ["XS", "S", "M", "L", "XL"] },
  "2": { name: "The Quiet Hour Kurta", category: "Kurtas", unitPrice: 1450, sizes: ["XS", "S", "M", "L", "XL"] },
  "3": { name: "The Sunday Wrap", category: "Layers", unitPrice: 890, sizes: ["One size"] },
  "4": { name: "The Form Trousers", category: "Bottoms", unitPrice: 1390, sizes: ["XS", "S", "M", "L", "XL"] }
};

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "application/json; charset=utf-8"
    }
  });
}

function normalizedText(value, maxLength) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function parseOrder(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;
  if (payload.consent !== true || normalizedText(payload.website, 200)) return null;

  const customer = {
    name: normalizedText(payload.customer?.name, 120),
    phone: normalizedText(payload.customer?.phone, 15),
    email: normalizedText(payload.customer?.email, 254)
  };
  if (!customer.name || !/^[0-9]{10,15}$/.test(customer.phone)) return null;
  if (customer.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) return null;

  const sourceAddress = payload.shippingAddress;
  if (!sourceAddress || typeof sourceAddress !== "object" || Array.isArray(sourceAddress)) return null;
  const shippingAddress = {
    addressLine1: normalizedText(sourceAddress.addressLine1, 180),
    addressLine2: normalizedText(sourceAddress.addressLine2, 180),
    locality: normalizedText(sourceAddress.locality, 120),
    city: normalizedText(sourceAddress.city, 120),
    district: normalizedText(sourceAddress.district, 120),
    state: normalizedText(sourceAddress.state, 120),
    postalCode: normalizedText(sourceAddress.postalCode, 12),
    country: normalizedText(sourceAddress.country, 120),
    landmark: normalizedText(sourceAddress.landmark, 180),
    deliveryInstructions: normalizedText(sourceAddress.deliveryInstructions, 500)
  };
  if (!shippingAddress.addressLine1 || !shippingAddress.locality || !shippingAddress.city || !shippingAddress.state || !shippingAddress.postalCode || !shippingAddress.country) return null;

  if (!Array.isArray(payload.items) || payload.items.length < 1 || payload.items.length > 30) return null;
  const items = [];
  for (const sourceItem of payload.items) {
    const quantity = Number(sourceItem?.quantity);
    const product = PRODUCTS[normalizedText(sourceItem?.id, 80)];
    const item = {
      id: normalizedText(sourceItem?.id, 80),
      size: normalizedText(sourceItem?.size, 40),
      quantity,
      name: product?.name || "",
      category: product?.category || "",
      unitPrice: product?.unitPrice || 0
    };
    if (!product || !product.sizes.includes(item.size) || !Number.isInteger(quantity) || quantity < 1 || quantity > 10) return null;
    item.lineTotal = Math.round(quantity * item.unitPrice * 100) / 100;
    items.push(item);
  }

  const paymentPreference = normalizedText(payload.paymentPreference, 40);
  if (!["UPI", "Cash on Delivery"].includes(paymentPreference)) return null;

  return {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    status: "New",
    customer,
    shippingAddress,
    items,
    subtotal: Math.round(items.reduce((sum, item) => sum + item.lineTotal, 0) * 100) / 100,
    currency: "INR",
    paymentPreference,
    consent: { granted: true, policyVersion: PRIVACY_POLICY_VERSION, recordedAt: new Date().toISOString() }
  };
}

function hasAdminAccess(request) {
  const expected = process.env.ORDER_ADMIN_TOKEN || "";
  const authorization = request.headers.get("authorization") || "";
  const provided = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (expected.length < 32 || !provided) return false;
  const expectedDigest = createHash("sha256").update(expected).digest();
  const providedDigest = createHash("sha256").update(provided).digest();
  return timingSafeEqual(expectedDigest, providedDigest);
}

function ordersStore() {
  return getStore({ name: STORE_NAME, region: STORE_REGION, consistency: "strong" });
}

export default async function handler(request) {
  try {
    if (request.method === "POST") {
      const origin = request.headers.get("origin");
      if (origin && new URL(origin).origin !== new URL(request.url).origin) return jsonResponse({ error: "Request origin is not allowed." }, 403);
      const contentLength = Number(request.headers.get("content-length") || 0);
      if (contentLength > MAX_BODY_BYTES) return jsonResponse({ error: "Order details are too large." }, 413);
      if (!request.headers.get("content-type")?.includes("application/json")) return jsonResponse({ error: "Expected JSON order details." }, 415);
      const rawBody = await request.text();
      if (Buffer.byteLength(rawBody, "utf8") > MAX_BODY_BYTES) return jsonResponse({ error: "Order details are too large." }, 413);
      let payload;
      try {
        payload = JSON.parse(rawBody);
      } catch {
        return jsonResponse({ error: "Order details could not be read." }, 400);
      }
      const order = parseOrder(payload);
      if (!order) return jsonResponse({ error: "Please check the required customer, delivery, consent, and item details." }, 400);
      const key = `orders/${Date.now()}_${order.id}.json`;
      await ordersStore().setJSON(key, order, { onlyIfNew: true });
      return jsonResponse({ id: order.id, createdAt: order.createdAt, subtotal: order.subtotal, currency: order.currency, items: order.items }, 201);
    }

    if (request.method === "GET") {
      if ((process.env.ORDER_ADMIN_TOKEN || "").length < 32) return jsonResponse({ error: "Order dashboard access is not configured." }, 503);
      if (!hasAdminAccess(request)) return jsonResponse({ error: "Unauthorized." }, 401);
      const store = ordersStore();
      const { blobs } = await store.list({ prefix: "orders/" });
      const latest = blobs.sort((first, second) => second.key.localeCompare(first.key)).slice(0, MAX_ORDERS_IN_DASHBOARD);
      const storedOrders = await Promise.all(latest.map(({ key }) => store.get(key)));
      const orders = storedOrders.map((entry) => {
        if (typeof entry !== "string") return null;
        try {
          return JSON.parse(entry);
        } catch {
          return null;
        }
      });
      return jsonResponse({ total: blobs.length, orders: orders.filter(Boolean) });
    }

    return jsonResponse({ error: "Method not allowed." }, 405);
  } catch (error) {
    console.error("Order storage request failed.", error);
    return jsonResponse({ error: "Order service is temporarily unavailable. Please try again." }, 500);
  }
}

export const config = { path: "/api/orders" };
