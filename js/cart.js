/* ============================================================
   UMBRA — bag (cart)
   Shared by every page. Keeps line items in localStorage so the bag
   survives page changes in this browser. Checkout hands the bag to
   Shopify (js/shopify.js) when shop-config.js is filled in; until then
   it shows a "coming soon" note.
   Exposes window.UMBRA_BAG.add(productId, size) and .open().
   ============================================================ */
(function () {
  "use strict";

  var KEY = "umbra-bag-v1";
  var PRODUCTS = window.UMBRA_PRODUCTS || {};
  var items = load();
  var lastFocus = null;

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      var parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.filter(function (i) { return PRODUCTS[i.id]; }) : [];
    } catch (e) {
      return [];
    }
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(items)); } catch (e) { /* private mode: bag lives for this page only */ }
  }
  function currency() {
    var first = items[0] && PRODUCTS[items[0].id];
    return (first && first.currency) || "EUR";
  }
  function money(n, cur) {
    return new Intl.NumberFormat("en-IE", { style: "currency", currency: cur || currency(), maximumFractionDigits: 0 }).format(n);
  }
  function count() { return items.reduce(function (s, i) { return s + i.qty; }, 0); }
  function subtotal() { return items.reduce(function (s, i) { return s + PRODUCTS[i.id].price * i.qty; }, 0); }

  /* ---------- drawer markup (injected once per page) ---------- */
  var drawer = document.createElement("div");
  drawer.className = "bag";
  drawer.hidden = true;
  drawer.innerHTML =
    '<div class="bag-scrim" data-close-bag></div>' +
    '<aside class="bag-panel" role="dialog" aria-modal="true" aria-labelledby="bagTitle">' +
      '<div class="bag-head">' +
        '<h2 id="bagTitle" class="bag-title">Bag <span class="bag-title-count"></span></h2>' +
        '<button class="bag-close" type="button" data-close-bag aria-label="Close bag">' +
          '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 6l12 12M18 6L6 18"/></svg>' +
        '</button>' +
      '</div>' +
      '<p class="bag-status" aria-live="polite"></p>' +
      '<ul class="bag-items"></ul>' +
      '<div class="bag-empty"><p>Your bag is empty.</p><a href="index.html#work" class="bag-link" data-close-bag>Shop Drop 01</a></div>' +
      '<div class="bag-foot">' +
        '<div class="bag-row"><span>Subtotal</span><span class="bag-subtotal"></span></div>' +
        '<p class="bag-note">Shipping and taxes are calculated at checkout.</p>' +
        '<button class="btn btn-primary bag-checkout" type="button">Checkout</button>' +
        '<p class="bag-note bag-pay-note" hidden>Secure payment with PayPal or card. Your bag stays here until payment is complete.</p>' +
        '<p class="bag-note bag-checkout-msg" role="status" hidden></p>' +
      '</div>' +
    '</aside>';
  document.body.appendChild(drawer);

  var list = drawer.querySelector(".bag-items");
  var status = drawer.querySelector(".bag-status");
  var panel = drawer.querySelector(".bag-panel");

  function render() {
    var n = count();
    document.querySelectorAll("[data-bag-count]").forEach(function (el) { el.textContent = n; });
    drawer.querySelector(".bag-title-count").textContent = n ? "(" + n + ")" : "";
    drawer.classList.toggle("is-empty", !items.length);
    drawer.querySelector(".bag-subtotal").textContent = money(subtotal());
    list.innerHTML = items.map(function (it, idx) {
      var p = PRODUCTS[it.id];
      return '<li class="bag-item">' +
        '<a href="product.html?p=' + p.id + '" class="bag-thumb"><img src="' + p.images[0].src + '" alt=""></a>' +
        '<div class="bag-info">' +
          '<div class="bag-line"><a href="product.html?p=' + p.id + '" class="bag-name">' + p.name + '</a><span>' + money(p.price * it.qty) + '</span></div>' +
          '<p class="bag-size">Size ' + it.size + '</p>' +
          '<div class="bag-line">' +
            '<div class="qty" role="group" aria-label="Quantity for ' + p.name + ', size ' + it.size + '">' +
              '<button type="button" data-qty="-1" data-idx="' + idx + '" aria-label="Decrease quantity">−</button>' +
              '<span aria-live="polite">' + it.qty + '</span>' +
              '<button type="button" data-qty="1" data-idx="' + idx + '" aria-label="Increase quantity">+</button>' +
            '</div>' +
            '<button type="button" class="bag-remove" data-remove="' + idx + '">Remove</button>' +
          '</div>' +
        '</div>' +
      '</li>';
    }).join("");
  }

  function add(id, size) {
    if (!PRODUCTS[id] || !size) return;
    var found = items.filter(function (i) { return i.id === id && i.size === size; })[0];
    if (found) found.qty = Math.min(found.qty + 1, 9);
    else items.push({ id: id, size: size, qty: 1 });
    save();
    render();
    status.textContent = PRODUCTS[id].name + ", size " + size + " added.";
    open();
  }

  function open() {
    lastFocus = document.activeElement;
    drawer.hidden = false;
    document.documentElement.classList.add("bag-open");
    void drawer.offsetWidth; // commit the closed state so the slide-in transition runs
    drawer.classList.add("is-open");
    drawer.querySelector(".bag-close").focus();
  }
  function close() {
    drawer.classList.remove("is-open");
    document.documentElement.classList.remove("bag-open");
    var cb = drawer.querySelector(".bag-checkout");
    cb.disabled = false;
    cb.textContent = usesPaypal ? "Checkout with PayPal" : "Checkout";
    drawer.querySelector(".bag-checkout-msg").hidden = true;
    setTimeout(function () { drawer.hidden = true; status.textContent = ""; }, 350);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  drawer.addEventListener("click", function (e) {
    var t = e.target.closest("button, a, .bag-scrim");
    if (!t) return;
    if (t.hasAttribute("data-close-bag")) { close(); return; }
    if (t.hasAttribute("data-qty")) {
      var it = items[+t.getAttribute("data-idx")];
      it.qty += +t.getAttribute("data-qty");
      if (it.qty < 1) items.splice(+t.getAttribute("data-idx"), 1);
      else it.qty = Math.min(it.qty, 9);
      save(); render();
      return;
    }
    if (t.hasAttribute("data-remove")) {
      items.splice(+t.getAttribute("data-remove"), 1);
      save(); render();
      status.textContent = "Item removed.";
      return;
    }
    if (t.classList.contains("bag-checkout")) startCheckout(t);
  });

  function startCheckout(btn) {
    var msg = drawer.querySelector(".bag-checkout-msg");
    var shop = window.UMBRA_SHOP;
    var paypal = window.UMBRA_PAYPAL;
    if ((!shop || !shop.enabled) && paypal && paypal.enabled) {
      btn.disabled = true;
      btn.textContent = "Opening PayPal…";
      location.href = paypal.checkoutUrl(items);
      return;
    }
    if (!shop || !shop.enabled) {
      msg.textContent = "Checkout opens with Drop 01. Join the list to be first in.";
      msg.hidden = false;
      return;
    }
    btn.disabled = true;
    btn.textContent = "Opening secure checkout…";
    msg.hidden = true;
    shop.checkout(items).then(function (url) {
      location.href = url;
    }).catch(function (err) {
      btn.disabled = false;
      btn.textContent = "Checkout";
      msg.textContent = "Checkout could not open: " + err.message + ". Please try again.";
      msg.hidden = false;
    });
  }

  // live prices and stock from Shopify
  document.addEventListener("umbra:shop-ready", render);

  var usesPaypal = !(window.UMBRA_SHOP && window.UMBRA_SHOP.enabled) && window.UMBRA_PAYPAL && window.UMBRA_PAYPAL.enabled;
  if (usesPaypal) {
    drawer.querySelector(".bag-pay-note").hidden = false;
    drawer.querySelector(".bag-checkout").textContent = "Checkout with PayPal";
  }

  document.addEventListener("keydown", function (e) {
    if (drawer.hidden) return;
    if (e.key === "Escape") close();
    if (e.key === "Tab") {
      // keep focus inside the panel while it is open
      var f = panel.querySelectorAll("a[href], button:not([disabled])");
      var vis = Array.prototype.filter.call(f, function (el) { return el.offsetParent !== null; });
      if (!vis.length) return;
      var first = vis[0], last = vis[vis.length - 1];
      if (e.shiftKey && document.activeElement === first) { last.focus(); e.preventDefault(); }
      else if (!e.shiftKey && document.activeElement === last) { first.focus(); e.preventDefault(); }
    }
  });

  document.querySelectorAll("[data-open-bag]").forEach(function (b) {
    b.addEventListener("click", function (e) { e.preventDefault(); open(); });
  });

  // keep several open tabs in step
  window.addEventListener("storage", function (e) {
    if (e.key === KEY) { items = load(); render(); }
  });

  render();
  window.UMBRA_BAG = {
    add: add,
    open: open,
    clear: function () { items = []; save(); render(); }
  };
})();
