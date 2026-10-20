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
card(suit, (20, 90, 760, 2010), "suit-front.jpg", pad=0.05)
card(suit, (740, 90, 1395, 2010), "suit-back.jpg", pad=0.05)
save(suit.crop((1412, 0, 2048, 419)).resize((1000, 659), Image.LANCZOS), "suit-lapel.jpg")
save(suit.crop((1412, 428, 2048, 801)).resize((1000, 587), Image.LANCZOS), "suit-button.jpg")
save(suit.crop((1412, 810, 2048, 1201)).resize((1000, 615), Image.LANCZOS), "suit-waistcoat.jpg")
save(suit.crop((1412, 1601, 2048, 2048)).resize((1000, 703), Image.LANCZOS), "suit-cuff.jpg")
for name in ("suit-ghost", "suit-model"):
    im = Image.open(SRC / f"{name}.png").convert("RGB")
    im.thumbnail((1200, 1800), Image.LANCZOS)
    save(im, f"{name}.jpg")
