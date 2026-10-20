/* ============================================================
   UMBRA — product catalogue
   One entry per piece. product.html?p=<id> renders from this.
   Prices are in EUR and are placeholders until final pricing.
   ============================================================ */
window.UMBRA_PRODUCTS = {
  hoodie: {
    id: "hoodie",
    name: "The Hoodie",
    price: 290,
    tagline: "Knowledge shows the way. Love gives it meaning.",
    description: "A boxy, heavyweight hoodie with a double-layer funnel hood that stands on its own. The back carries a hand-placed sunset print, finished so the fabric grain shows through the ink.",
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    soldOut: ["XS"],
    fit: "Oversized and boxy with dropped shoulders. Take your usual size for the intended fit, or one down for a closer cut.",
    images: [
      { src: "assets/hoodie-front.jpg", alt: "The Hoodie, front" },
      { src: "assets/hoodie-back.jpg", alt: "The Hoodie, back, with the sunset print and quote" },
      { src: "assets/cap-fabric.jpg", alt: "Close-up of the heavyweight loopback fleece" },
      { src: "assets/cap-seams.jpg", alt: "Close-up of the tonal double-needle seams" }
    ],
    details: [
      "Double-layer funnel hood, no drawcords",
      "Diagonal panel seams and curved back yoke",
      "Angled welt pockets with bonded edges",
      "Flat zip pocket on the left sleeve",
      "Back print with the line Knowledge shows the way, love gives it meaning"
    ],
    fabric: "480 GSM brushed-back cotton loopback fleece. Machine wash cold inside out, do not tumble dry, do not iron the print."
  },
  tee: {
    id: "tee",
    name: "The Tee",
    price: 140,
    tagline: "One seam down the back.",
    description: "A heavyweight boxy tee with a bonded chest yoke and a single raised seam running down the centre back to a split vent. The broken-square mark is embroidered in gunmetal thread.",
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    soldOut: [],
    fit: "Boxy with dropped shoulders, wide elbow-length sleeves and a slightly cropped length. Take your usual size.",
    images: [
      { src: "assets/tee-front.jpg", alt: "The Tee, front" },
      { src: "assets/tee-back.jpg", alt: "The Tee, back, with the centre seam and split vent" },
      { src: "assets/note-emblem.jpg", alt: "Gunmetal embroidered emblem" },
      { src: "assets/note-collar.jpg", alt: "Thick ribbed collar" },
      { src: "assets/note-seam.jpg", alt: "Double-needle seam where the yoke meets the side panel" }
    ],
    details: [
      "3 cm ribbed collar that holds its shape",
      "Double-layer bonded chest yoke",
      "Raised flat-felled centre-back seam with split vent",
      "Gunmetal embroidered broken-square mark"
    ],
    fabric: "300 GSM combed cotton jersey with a matte finish. Machine wash cold, dry flat."
  },
  trouser: {
    id: "trouser",
    name: "The Trouser",
    price: 320,
    tagline: "Built heavy. Worn quiet.",
    description: "A wide-leg trouser in heavyweight cotton twill with a sculpted waistband, an asymmetric panel on the left leg and gunmetal hardware throughout. Cord-locks at the hems let you gather the leg.",
    sizes: ["28", "30", "32", "34", "36"],
    soldOut: ["36"],
    fit: "Relaxed wide leg with a slightly raised waist. Side adjusters take in up to 3 cm. Order your usual waist size.",
    images: [
      { src: "assets/trouser-front.jpg", alt: "The Trouser, front" },
      { src: "assets/trouser-back.jpg", alt: "The Trouser, back" },
      { src: "assets/cap-silhouette.jpg", alt: "The Trouser worn with The Tee" },
      { src: "assets/cap-hardware.jpg", alt: "Gunmetal snap, zip and cord-lock" }
    ],
    details: [
      "Contoured 6 cm waistband with side adjusters",
      "Asymmetric panel with hidden-zip welt pocket",
      "Back welt pockets, one with snap flap",
      "Drawcord hems with gunmetal cord-locks"
    ],
    fabric: "400 GSM cotton twill. Machine wash cold, hang to dry, warm iron inside out."
  }
};
