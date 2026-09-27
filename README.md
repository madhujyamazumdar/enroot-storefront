# Enroot Storefront

A simple, static fashion storefront for Enroot, built with plain HTML, CSS, and JavaScript. It needs no framework, package installation, or build step.

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
- Checkout order details prepared as a WhatsApp message
- Local fashion photos and a placeholder UPI QR image

## Editing the store

- Add or edit products in `js/products.js` and put their image files in `images/`.
- Change the WhatsApp number and customer email in `js/main.js`.
- Replace the sample UPI ID and QR image in `cart.html`.
- Review the sample size measurements and shipping, return, and delivery details before publishing.
- Update the store description and discovery notes in `PROJECT_BRIEF.md` as the business takes shape.

## Publishing

This project can be hosted as a static site, for example with GitHub Pages. It has no server-side order handling: checkout opens WhatsApp, and the contact form opens the visitor's email app. UPI details are a placeholder until replaced with the store's verified payment information.