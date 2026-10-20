/* ============================================================
   UMBRA — product page
   Renders product.html?p=<id> from window.UMBRA_PRODUCTS:
   gallery (stacked on desktop, swipe on mobile), sizes, add to bag.
   ============================================================ */
(function () {
  "use strict";

  var PRODUCTS = window.UMBRA_PRODUCTS || {};
  var ORDER = ["hoodie", "tee", "trouser"];
  var id = new URLSearchParams(location.search).get("p");
  var p = PRODUCTS[id] || PRODUCTS[ORDER[0]];
  var selected = null;

  // Garment measurements in cm, laid flat
  var GUIDES = {
    top: {
      head: ["Size", "Chest width", "Length", "Sleeve"],
      rows: [["XS", 60, 66, 21], ["S", 62, 68, 22], ["M", 64, 70, 23], ["L", 66, 72, 24], ["XL", 68, 74, 25], ["XXL", 70, 76, 26]]
    },
    trouser: {
      head: ["Size", "Waist", "Hip", "Inseam", "Leg opening"],
      rows: [["28", 72, 108, 80, 30], ["30", 77, 112, 81, 31], ["32", 82, 116, 82, 32], ["34", 87, 120, 83, 33], ["36", 92, 124, 84, 34]]
    }
  };

  function $(s) { return document.getElementById(s); }
  function money(n, cur) {
    return new Intl.NumberFormat("en-IE", { style: "currency", currency: cur || "EUR", maximumFractionDigits: 0 }).format(n);
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  /* ---------- copy ---------- */
  document.title = p.name + " — UMBRA";
  $("pdpCrumb").textContent = p.name;
  $("pdpName").textContent = p.name;
  $("pdpTagline").textContent = p.tagline;
  $("pdpDesc").textContent = p.description;
  $("pdpFit").textContent = p.fit;
  $("pdpFabric").textContent = p.fabric;
  $("pdpDetails").innerHTML = p.details.map(function (d) { return "<li>" + esc(d) + "</li>"; }).join("");

  /* ---------- gallery ---------- */
  var gallery = $("pdpGallery");
  var dots = $("pdpDots");
  gallery.innerHTML = p.images.map(function (im, i) {
    return '<figure class="pdp-shot' + (i < 2 ? " is-main" : "") + '">' +
      '<img src="' + im.src + '" alt="' + esc(im.alt) + '"' + (i > 1 ? ' loading="lazy"' : "") + '>' +
    '</figure>';
  }).join("");
  dots.innerHTML = p.images.map(function (_, i) { return '<span class="' + (i === 0 ? "is-active" : "") + '"></span>'; }).join("");
  var dotEls = dots.querySelectorAll("span");
  gallery.addEventListener("scroll", function () {
    // only meaningful in the horizontal (mobile) layout
    if (gallery.scrollWidth <= gallery.clientWidth) return;
    var i = Math.round(gallery.scrollLeft / gallery.clientWidth);
    dotEls.forEach(function (d, j) { d.classList.toggle("is-active", j === i); });
  }, { passive: true });

  /* ---------- sizes ---------- */
  var grid = $("sizeGrid");
  function renderSizes() {
    $("pdpPrice").textContent = money(p.price, p.currency);
    if (selected && p.soldOut.indexOf(selected) > -1) {
      selected = null;
      $("sizeChosen").textContent = "";
    }
    grid.innerHTML = p.sizes.map(function (s) {
      var out = p.soldOut.indexOf(s) > -1;
      return '<label class="size-opt' + (out ? " is-out" : "") + '">' +
        '<input type="radio" name="size" value="' + s + '"' + (out ? " disabled" : "") + (s === selected ? " checked" : "") + '>' +
        '<span>' + s + (out ? '<span class="visually-hidden"> sold out</span>' : "") + '</span>' +
      '</label>';
    }).join("");
  }
  renderSizes();
  // Shopify's live price and stock replace the catalogue placeholders
  document.addEventListener("umbra:shop-ready", function () { renderSizes(); renderMore(); });
  grid.addEventListener("change", function (e) {
    selected = e.target.value;
    $("sizeChosen").textContent = "— " + selected;
    $("sizeError").hidden = true;
  });

  var guide = p.id === "trouser" ? GUIDES.trouser : GUIDES.top;
  $("sizeGuide").innerHTML =
    '<table><thead><tr>' + guide.head.map(function (h) { return '<th scope="col">' + h + "</th>"; }).join("") + "</tr></thead><tbody>" +
    guide.rows.map(function (r) {
      return "<tr>" + r.map(function (c, i) { return i ? "<td>" + c + "</td>" : '<th scope="row">' + c + "</th>"; }).join("") + "</tr>";
    }).join("") +
    "</tbody></table><p class=\"size-guide-note\">Measurements in cm, garment laid flat.</p>";

  /* ---------- add to bag ---------- */
  $("pdpForm").addEventListener("submit", function (e) {
    e.preventDefault();
    if (!selected) {
      $("sizeError").hidden = false;
      var first = grid.querySelector("input:not([disabled])");
      if (first) first.focus();
      return;
    }
    if (window.UMBRA_BAG) window.UMBRA_BAG.add(p.id, selected);
  });

  /* ---------- complete the look ---------- */
  function renderMore() {
  $("moreGrid").innerHTML = ORDER.filter(function (k) { return k !== p.id; }).map(function (k) {
    var o = PRODUCTS[k];
    return '<article class="product-card">' +
      '<a href="product.html?p=' + o.id + '" class="product-media" aria-label="' + esc(o.name) + '">' +
        '<img src="' + o.images[0].src + '" alt="' + esc(o.images[0].alt) + '" class="img-front" loading="lazy">' +
        '<img src="' + o.images[1].src + '" alt="" class="img-back" loading="lazy">' +
      '</a>' +
      '<div class="product-info"><h3 class="product-name"><a href="product.html?p=' + o.id + '">' + esc(o.name) + '</a></h3>' +
      '<p class="product-price">' + money(o.price, o.currency) + "</p></div>" +
    "</article>";
  }).join("");
  }
  renderMore();
})();
