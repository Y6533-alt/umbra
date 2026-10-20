"""Cut product shots and detail images for the site out of the concept boards.

Run from the site folder:  python tools/crop_assets.py
Sources live in assets/src/, outputs go to assets/.
"""
from pathlib import Path
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets" / "src"
OUT = ROOT / "assets"

hoodie = Image.open(SRC / "hoodie-board.png").convert("RGB")
tee = Image.open(SRC / "tee-board.png").convert("RGB")
pants = Image.open(SRC / "pants-board.png").convert("RGB")


def save(im, name, quality=86):
    im.save(OUT / name, "JPEG", quality=quality, optimize=True, progressive=True)
    print(name, im.size)


def card(board, box, name, size=(1000, 1250), pad=0.08):
    """Fit a garment region onto a portrait card, feathering it wide into a
    flat background that matches the region's top-edge tone, so no rectangle
    shows."""
    region = board.crop(box)
    max_w, max_h = size[0] * (1 - pad * 2), size[1] * (1 - pad * 2)
    scale = min(max_w / region.width, max_h / region.height)
    region = region.resize((round(region.width * scale), round(region.height * scale)), Image.LANCZOS)
    strip = region.crop((0, 0, region.width, 12)).resize((1, 1), Image.BOX)
    canvas = Image.new("RGB", size, strip.getpixel((0, 0)))
    mask = Image.new("L", region.size, 0)
    inset = max(16, region.width // 14)
    mask.paste(255, (inset, inset, region.width - inset, region.height - inset))
    mask = mask.filter(ImageFilter.GaussianBlur(inset * 0.7))
    x = (size[0] - region.width) // 2
    y = (size[1] - region.height) // 2
    canvas.paste(region, (x, y), mask)
    save(canvas, name)


def tall_card(src, box, name, size=(1000, 1250), pad=0.025):
    """For tall garments (the suit): scale the region to nearly the full card
    height and rebuild the side margins from the region's own edge columns,
    row by row, so the studio gradient and glow continue with no visible box."""
    region = src.crop(box)
    h = round(size[1] * (1 - pad * 2))
    w = round(region.width * h / region.height)
    region = region.resize((w, h), Image.LANCZOS)
    edge = 10
    left = region.crop((0, 0, edge, h)).resize((1, h), Image.BOX)
    right = region.crop((w - edge, 0, w, h)).resize((1, h), Image.BOX)
    sides = Image.blend(left, right, 0.5)
    # smooth the column vertically so per-row noise doesn't turn into streaks
    sides = sides.resize((8, h)).filter(ImageFilter.GaussianBlur(40)).resize((1, h), Image.BOX)
    canvas = sides.resize((size[0], h), Image.BILINEAR)
    # a touch of fine grain so the rebuilt margins match the photo's texture
    grain = Image.effect_noise((size[0], h), 6).convert("RGB")
    canvas = Image.blend(canvas, Image.composite(canvas, grain, Image.new("L", (size[0], h), 245)), 1.0)
    # extend the first/last rows into the top and bottom margins
    full = Image.new("RGB", size)
    top = (size[1] - h) // 2
    full.paste(canvas.crop((0, 0, size[0], 1)).resize((size[0], top)), (0, 0))
    full.paste(canvas, (0, top))
    full.paste(canvas.crop((0, h - 1, size[0], h)).resize((size[0], size[1] - top - h)), (0, top + h))
    # feather only the left/right edges of the garment region into it
    mask = Image.new("L", (w, h), 255)
    feather = max(20, w // 7)
    for i in range(feather):
        a = round(255 * i / feather)
        mask.paste(a, (i, 0, i + 1, h))
        mask.paste(a, (w - 1 - i, 0, w - i, h))
    full.paste(region, ((size[0] - w) // 2, top), mask)
    save(full, name)


# Product cards (front + back of each piece)
card(hoodie, (20, 360, 1030, 1560), "hoodie-front.jpg")
card(hoodie, (1018, 360, 2028, 1560), "hoodie-back.jpg")
card(tee, (20, 20, 1080, 1260), "tee-front.jpg")
card(tee, (1020, 20, 2048, 1260), "tee-back.jpg")
card(pants, (20, 120, 700, 2040), "trouser-front.jpg", pad=0.05)
card(pants, (700, 120, 1390, 2040), "trouser-back.jpg", pad=0.05)

# Wide hero slide: both hoodie views together
save(hoodie.crop((0, 300, 2048, 1452)).resize((1920, 1080), Image.LANCZOS), "hero-hoodie.jpg")

# Journal cards: close-up panels from the tee and trouser boards
save(tee.crop((30, 1312, 506, 2003)), "note-collar.jpg")
save(tee.crop((1036, 1312, 1514, 2003)), "note-emblem.jpg")
save(tee.crop((1540, 1312, 2018, 2003)), "note-seam.jpg")
save(pants.crop((1418, 1238, 2048, 1625)), "note-hardware.jpg")

# The Suit: front/back from the board, details from its close-up column,
# plus the floating suit and the campaign shot as wide gallery images
suit = Image.open(SRC / "suit-board.png").convert("RGB")
# front/back are dedicated full-frame 4:5 shots, generated for the product card
for view in ("front", "back"):
    im = Image.open(SRC / f"suit-{view}-full.png").convert("RGB")
    save(im.resize((1000, 1250), Image.LANCZOS), f"suit-{view}.jpg")
save(suit.crop((1412, 0, 2048, 419)).resize((1000, 659), Image.LANCZOS), "suit-lapel.jpg")
save(suit.crop((1412, 428, 2048, 801)).resize((1000, 587), Image.LANCZOS), "suit-button.jpg")
save(suit.crop((1412, 810, 2048, 1201)).resize((1000, 615), Image.LANCZOS), "suit-waistcoat.jpg")
save(suit.crop((1412, 1601, 2048, 2048)).resize((1000, 703), Image.LANCZOS), "suit-cuff.jpg")
for name in ("suit-ghost", "suit-model"):
    im = Image.open(SRC / f"{name}.png").convert("RGB")
    im.thumbnail((1200, 1800), Image.LANCZOS)
    save(im, f"{name}.jpg")
