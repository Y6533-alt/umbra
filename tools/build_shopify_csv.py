"""Write a Shopify product import CSV for the four UMBRA products.

Handles and Size values match js/shop-config.js so the site finds each
product and variant after import. Images point at the live GitHub Pages site.

Run from the site folder:  python tools/build_shopify_csv.py
Output: shopify-products.csv
"""
import csv
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE_URL = "https://y6533-alt.github.io/umbra/"
STOCK_PER_SIZE = 10  # placeholder starting stock; change in Shopify after import

# Read the catalogue straight from js/products.js so the CSV never drifts
src = (ROOT / "js" / "products.js").read_text(encoding="utf-8")
body = src[src.index("{", src.index("UMBRA_PRODUCTS")):src.rindex("}") + 1]
body = re.sub(r"/\*.*?\*/", "", body, flags=re.S)
body = re.sub(r"(\s)([a-zA-Z_]+):", r'\1"\2":', body)     # quote keys
body = re.sub(r",(\s*[}\]])", r"\1", body)                # trailing commas
products = json.loads(body)

handles = dict(re.findall(r'(\w+): "(the-[\w-]+)"',
                          (ROOT / "js" / "shop-config.js").read_text(encoding="utf-8")))

cols = ["Handle", "Title", "Body (HTML)", "Vendor", "Type", "Tags", "Published",
        "Option1 Name", "Option1 Value", "Variant SKU", "Variant Inventory Tracker",
        "Variant Inventory Qty", "Variant Inventory Policy", "Variant Fulfillment Service",
        "Variant Price", "Variant Requires Shipping", "Variant Taxable",
        "Image Src", "Image Position", "Image Alt Text", "Status"]

with open(ROOT / "shopify-products.csv", "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=cols)
    w.writeheader()
    for pid, p in products.items():
        handle = handles[pid]
        html = (f"<p>{p['description']}</p><ul>"
                + "".join(f"<li>{d}</li>" for d in p["details"])
                + f"</ul><p>{p['fabric']}</p>")
        rows = max(len(p["sizes"]), len(p["images"]))
        for i in range(rows):
            row = {"Handle": handle}
            if i == 0:
                row.update({"Title": p["name"], "Body (HTML)": html, "Vendor": "UMBRA",
                            "Type": "Apparel", "Tags": "Drop 01", "Published": "TRUE",
                            "Option1 Name": "Size", "Status": "active"})
            if i < len(p["sizes"]):
                size = p["sizes"][i]
                row.update({"Option1 Value": size,
                            "Variant SKU": f"UMB-{pid.upper()}-{size}",
                            "Variant Inventory Tracker": "shopify",
                            "Variant Inventory Qty": 0 if size in p["soldOut"] else STOCK_PER_SIZE,
                            "Variant Inventory Policy": "deny",
                            "Variant Fulfillment Service": "manual",
                            "Variant Price": f"{p['price']:.2f}",
                            "Variant Requires Shipping": "TRUE",
                            "Variant Taxable": "TRUE"})
            if i < len(p["images"]):
                img = p["images"][i]
                row.update({"Image Src": SITE_URL + img["src"].split("?")[0],
                            "Image Position": i + 1,
                            "Image Alt Text": img["alt"]})
            w.writerow(row)
        print(handle, len(p["sizes"]), "sizes,", len(p["images"]), "images")
