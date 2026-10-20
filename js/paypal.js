/* ============================================================
   UMBRA — PayPal checkout (no server, no business account)
   Builds a PayPal cart link for the bag and sends the customer there.
   The money goes to the email in shop-config.js (paypal.email).
   PayPal asks the customer for a shipping address and emails you
   the order: items, sizes and address.
   Exposes window.UMBRA_PAYPAL = { enabled, checkoutUrl(items) }.
   ============================================================ */
(function () {
  "use strict";

  var cfg = (window.UMBRA_SHOP_CONFIG || {}).paypal || {};
  var PRODUCTS = window.UMBRA_PRODUCTS || {};
  var enabled = /\S+@\S+\.\S+/.test(cfg.email || "");

  function orderRef() {
    var d = new Date();
    var stamp = d.getFullYear().toString().slice(2) +
      String(d.getMonth() + 1).padStart(2, "0") + String(d.getDate()).padStart(2, "0");
    return "UMB-" + stamp + "-" + Math.random().toString(36).slice(2, 6).toUpperCase();
  }

  function checkoutUrl(items) {
    var ref = orderRef();
    var params = {
      cmd: "_cart",
      upload: "1",
      business: cfg.email,
      currency_code: cfg.currency || "EUR",
      invoice: ref,
      no_shipping: "2",   // ask the customer for a shipping address
      charset: "utf-8",
      return: new URL("thank-you.html?order=" + ref, location.href).href,
      cancel_return: location.href
    };
    items.forEach(function (it, i) {
      var p = PRODUCTS[it.id];
      var n = i + 1;
      params["item_name_" + n] = "UMBRA " + p.name;
      params["on0_" + n] = "Size";
      params["os0_" + n] = it.size;
      params["amount_" + n] = p.price.toFixed(2);
      params["quantity_" + n] = it.qty;
    });
    return "https://www.paypal.com/cgi-bin/webscr?" + new URLSearchParams(params).toString();
  }

  window.UMBRA_PAYPAL = { enabled: enabled, checkoutUrl: checkoutUrl };
})();
