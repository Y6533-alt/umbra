/* ============================================================
   UMBRA — Shopify connection settings
   Fill these in to turn on real checkout (see SHOPIFY_SETUP.md).
   While domain or token is empty, the site runs in preview mode:
   the bag works, and Checkout shows a "coming soon" note.

   The Storefront access token is a PUBLIC token made for browsers;
   it is safe to keep here. Never put an Admin API token in this file.
   ============================================================ */
window.UMBRA_SHOP_CONFIG = {
  // e.g. "umbra-studio.myshopify.com" (the .myshopify.com domain, not your custom domain)
  domain: "aznzxe-ae.myshopify.com",
  // Storefront API public access token from the Headless channel
  token: "d7c4b94d9a67304c9f7e1605751d0aca",
  // Who takes payment at checkout: "paypal" or "shopify".
  // Products, prices and stock always come from Shopify once domain/token are set.
  // Switch to "shopify" after payments are activated in Shopify (Settings → Payments).
  checkout: "paypal",
  // Storefront API version
  apiVersion: "2026-07",
  // Shopify product handle for each site product (the last part of the product URL in Shopify)
  handles: {
    hoodie: "the-hoodie",
    tee: "the-tee",
    trouser: "the-trouser",
    suit: "the-suit"
  },
  // Name of the variant option that holds the size
  sizeOption: "Size",

  /* ---------- PayPal (used while Shopify is not connected) ----------
     Put the email of your PayPal account here. Checkout then sends the
     customer to PayPal with the bag filled in, and the money arrives in
     that account. Works with a personal PayPal account. */
  paypal: {
    email: "yuvalpeleg022@gmail.com",
    currency: "ILS"   // must match the prices in js/products.js
  }
};
