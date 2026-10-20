# UMBRA — Drop 01

Static site for the UMBRA label: home page, product pages and a bag that hands off to Shopify checkout.

- `index.html` home, `product.html?p=hoodie|tee|trouser` product pages
- `js/products.js` catalogue, `js/cart.js` bag, `js/shopify.js` + `js/shop-config.js` Shopify checkout
- Checkout setup: see `SHOPIFY_SETUP.md`

Run locally: `python -m http.server 8080`, then open http://localhost:8080.

See `CREDITS.md` for libraries, fonts and image sources.
