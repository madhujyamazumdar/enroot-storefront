# Enroot Storefront

A plain HTML, CSS, and JavaScript storefront with Netlify Functions for persistent order records.

## Preview

Open `index.html` in a web browser. You can also start a local preview server from this folder:

```powershell
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Pages and features

- Home, shop, product details, cart and checkout, about, and contact pages
- Responsive layouts with a mobile navigation menu
- Product information in `js/products.js`
- Cart saved in the browser with `localStorage`
- Checkout orders validated and saved to private Netlify Blobs before WhatsApp opens
- Password-protected order dashboard at `orders.html`
- Customer-data consent and privacy notice at `privacy.html`
- Local fashion photos and a placeholder UPI QR image

## Editing the store

- Add or edit products in `js/products.js` and put their image files in `images/`.
- Change the WhatsApp numbers and customer email in `js/main.js`.
- Replace the sample UPI ID and QR image in `cart.html`.
- Review the sample size measurements and shipping, return, and delivery details before publishing.
- Update the store description and discovery notes in `PROJECT_BRIEF.md` as the business takes shape.
- Follow `README-orders.md` to configure the private order-dashboard token and run Netlify Dev.

## Publishing

Deploy on Netlify so the order-recording Function and Blobs storage are available; GitHub Pages will only serve the static pages and cannot save orders. Checkout saves the order first, then opens prefilled WhatsApp chats. Customers must still press Send in WhatsApp. The contact form opens the visitor's email app. UPI details are a placeholder until replaced with the store's verified payment information.