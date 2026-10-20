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
  domain: "",
  // Storefront API public access token from the Headless channel
  token: "",
  // Storefront API version
  apiVersion: "2026-07",
  // Shopify product handle for each site product (the last part of the product URL in Shopify)
  handles: {
    hoodie: "the-hoodie",
    tee: "the-tee",
    trouser: "the-trouser"
  },
  // Name of the variant option that holds the size
  sizeOption: "Size"
};
