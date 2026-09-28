# Enroot order records setup

Checkout records are stored in a private, site-wide Netlify Blobs store named `enroot-orders`. Netlify encrypts Blobs in transit and at rest. The store is hosted in Singapore (`ap-southeast-1`). Customers can submit orders publicly, but only the authenticated dashboard can read them.

## Activate the private dashboard

1. Generate a strong token locally, for example in PowerShell:

   ```powershell
   node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
   ```

2. In Netlify, open **Project configuration → Environment variables** and add `ORDER_ADMIN_TOKEN` with that value. Do not put the token in this repository, a URL, or a customer-facing page.
3. Trigger a production deploy so the Function receives the new variable.
4. Open `https://enroot-storefront.netlify.app/orders.html` and enter the token. The token stays in page memory and is discarded when you sign out or reload.

The dashboard shows the 200 most recent records. All records remain in Blobs and can also be reviewed from **Data & storage → Blobs → enroot-orders** in Netlify.

## What gets recorded

Each saved order contains a generated order ID and timestamp, customer name, phone and optional email, the complete shipping address, requested items and quantities, subtotal, payment preference, and the timestamp of the required order-processing consent. The checkout does not collect card or bank credentials. Orders are saved before WhatsApp chats are opened; if saving fails, checkout reports the error and does not open the chats.

When products or prices change in `js/products.js`, update the server-side product catalog in `netlify/functions/orders.mjs` as well. The server intentionally calculates totals from its own catalog instead of trusting browser-submitted prices.

Keep access to the Netlify project and admin token private. Set an appropriate retention period for customer data and remove records when they are no longer needed. Review the customer privacy notice and applicable privacy requirements before launch.

## Local function development

Install dependencies, set a throwaway local dashboard token, and run Netlify Dev:

```powershell
npm install
$env:ORDER_ADMIN_TOKEN = 'use-a-local-token-of-at-least-32-characters'
npx netlify dev
```

Netlify Dev provides a local Blobs sandbox. Local order records are separate from production data.
