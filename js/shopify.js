/* ============================================================
   UMBRA — Shopify Storefront API client
   - Loads each product's variants once, then updates
     window.UMBRA_PRODUCTS with live price, currency and per-size stock,
     and fires "umbra:shop-ready" so open pages re-render.
   - checkout(items) creates a Shopify cart and returns its hosted
     checkout URL; payment, shipping and tax all happen on Shopify.
   Exposes window.UMBRA_SHOP. Does nothing until shop-config.js is filled in.
   ============================================================ */
(function () {
  "use strict";

  var cfg = window.UMBRA_SHOP_CONFIG || {};
  var PRODUCTS = window.UMBRA_PRODUCTS || {};
  var enabled = !!(cfg.domain && cfg.token);
  var variants = {}; // { productId: { size: { id, available } } }

  var PRODUCT_QUERY =
    "query Product($handle: String!) {" +
    "  product(handle: $handle) {" +
    "    variants(first: 50) { nodes {" +
    "      id availableForSale" +
    "      selectedOptions { name value }" +
    "      price { amount currencyCode }" +
    "    } }" +
    "  }" +
    "}";

  var CART_CREATE =
    "mutation CartCreate($lines: [CartLineInput!]!) {" +
    "  cartCreate(input: { lines: $lines }) {" +
    "    cart { checkoutUrl }" +
    "    userErrors { message }" +
    "  }" +
    "}";

  function gql(query, variables) {
    var url = "https://" + cfg.domain + "/api/" + cfg.apiVersion + "/graphql.json";
    return fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": cfg.token
      },
      body: JSON.stringify({ query: query, variables: variables })
    }).then(function (r) {
      if (!r.ok) throw new Error("Shopify returned " + r.status);
      return r.json();
    }).then(function (json) {
      if (json.errors && json.errors.length) throw new Error(json.errors[0].message);
      return json.data;
    });
  }

  function loadProduct(id) {
    var handle = cfg.handles && cfg.handles[id];
    if (!handle) return Promise.resolve();
    return gql(PRODUCT_QUERY, { handle: handle }).then(function (data) {
      var p = PRODUCTS[id];
      if (!data.product) {
        console.warn("[UMBRA] No Shopify product with handle \"" + handle + "\" for " + id);
        return;
      }
      var map = {};
      var soldOut = [];
      data.product.variants.nodes.forEach(function (v) {
        var opt = v.selectedOptions.filter(function (o) { return o.name === cfg.sizeOption; })[0];
        if (!opt) return;
        map[opt.value] = { id: v.id, available: v.availableForSale };
        if (!v.availableForSale) soldOut.push(opt.value);
        p.price = Math.round(parseFloat(v.price.amount));
        p.currency = v.price.currencyCode;
      });
      // sizes Shopify doesn't stock count as sold out
      p.sizes.forEach(function (s) { if (!map[s] && soldOut.indexOf(s) < 0) soldOut.push(s); });
      p.soldOut = soldOut;
      variants[id] = map;
    });
  }

  var ready = enabled
    ? Promise.all(Object.keys(PRODUCTS).map(loadProduct)).then(function () {
        // static prices on the home page
        document.querySelectorAll("[data-price-for]").forEach(function (el) {
          var p = PRODUCTS[el.getAttribute("data-price-for")];
          if (p) el.textContent = new Intl.NumberFormat("en-IE", { style: "currency", currency: p.currency || window.UMBRA_CURRENCY || "ILS", currencyDisplay: "narrowSymbol", maximumFractionDigits: 0 }).format(p.price);
        });
        document.dispatchEvent(new CustomEvent("umbra:shop-ready"));
      }).catch(function (err) {
        console.error("[UMBRA] Could not load Shopify products:", err);
        throw err;
      })
    : Promise.resolve();

  function checkout(items) {
    if (!enabled) return Promise.reject(new Error("not-configured"));
    return ready.then(function () {
      var lines = items.map(function (it) {
        var v = variants[it.id] && variants[it.id][it.size];
        if (!v) throw new Error(PRODUCTS[it.id].name + " in size " + it.size + " is not available");
        return { merchandiseId: v.id, quantity: it.qty };
      });
      return gql(CART_CREATE, { lines: lines });
    }).then(function (data) {
      var res = data.cartCreate;
      if (res.userErrors && res.userErrors.length) throw new Error(res.userErrors[0].message);
      return res.cart.checkoutUrl;
    });
  }

  window.UMBRA_SHOP = { enabled: enabled, ready: ready, checkout: checkout };
})();
