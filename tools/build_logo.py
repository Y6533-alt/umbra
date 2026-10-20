"""Build the UMBRA logo set from one shared geometry.

The lettering is drawn here as polygons on a 100-unit cap height (no font
files involved), so the logo is fully original and renders identically
everywhere. Outputs SVG + PNG into assets/brand/.

Run from the site folder:  python tools/build_logo.py
"""
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "brand"
OUT.mkdir(parents=True, exist_ok=True)

INK = "#ECEAE5"      # light ink for dark backgrounds
BLACK = "#0B0B0C"    # obsidian
SAND = "#C9A36B"     # accent

S = 12.5             # stroke weight in units (cap height = 100); equals the mark's stroke at size 100
CAP = 100
TRACK = 40           # generous letter spacing


def rect(x0, y0, x1, y1):
    return [(x0, y0), (x1, y0), (x1, y1), (x0, y1)]


# ---------- the mark: broken square, two interlocking offset right angles ----------
def mark(size=100):
    # drawn edge-to-edge on the letter grid: at size 100 it is exactly cap
    # height and its arms carry the same stroke weight as the letters
    k = size / 100
    t, arm = S, 58
    a = [(0, 0), (arm, 0), (arm, t), (t, t), (t, arm), (0, arm)]
    b = [(100, 100), (100 - arm, 100), (100 - arm, 100 - t), (100 - t, 100 - t), (100 - t, 100 - arm), (100, 100 - arm)]
    return [[(x * k, y * k) for x, y in a], [(x * k, y * k) for x, y in b]], size


# ---------- lettering: square, constructed, one stroke weight ----------
def letter_U(w=72):
    return [rect(0, 0, S, CAP), rect(w - S, 0, w, CAP), rect(0, CAP - S, w, CAP)], w


def letter_M(w=96):
    mid = (w - S) / 2
    return [rect(0, 0, S, CAP), rect(w - S, 0, w, CAP), rect(0, 0, w, S),
            rect(mid, 0, mid + S, 62)], w


def letter_B(w=72):
    upper = w - 10                     # narrower upper bowl, like a drawn B
    m0 = (CAP - S) / 2 - 2
    return [rect(0, 0, S, CAP),
            rect(0, 0, upper, S),
            rect(upper - S, 0, upper, m0 + S),
            rect(0, m0, w, m0 + S),
            rect(w - S, m0, w, CAP),
            rect(0, CAP - S, w, CAP)], w


def letter_R(w=72):
    m0 = (CAP - S) / 2 - 2
    leg = [(w - S - 26, m0 + S), (w - S - 26 + S * 1.25, m0 + S), (w, CAP), (w - S * 1.25, CAP)]
    return [rect(0, 0, S, CAP), rect(0, 0, w, S), rect(w - S, 0, w, m0 + S),
            rect(0, m0, w, m0 + S), leg], w


def letter_A(w=72):
    m0 = (CAP - S) / 2 + 4
    return [rect(0, 0, S, CAP), rect(w - S, 0, w, CAP), rect(0, 0, w, S),
            rect(0, m0, w, m0 + S)], w


def wordmark():
    polys, x = [], 0
    for fn in (letter_U, letter_M, letter_B, letter_R, letter_A):
        ps, w = fn()
        polys += [[(px + x, py) for px, py in p] for p in ps]
        x += w + TRACK
    return polys, x - TRACK


def shift(polys, dx, dy, k=1.0):
    return [[(px * k + dx, py * k + dy) for px, py in p] for p in polys]


# ---------- lockups ----------
def lockup(kind):
    m, ms = mark(100)
    w, ww = wordmark()
    if kind == "mark":
        return m, ms, ms
    if kind == "wordmark":
        return w, ww, CAP
    if kind == "horizontal":
        # mark is exactly cap height, so mark and letters share one stroke weight
        gap = 70
        return m + shift(w, ms + gap, 0), ms + gap + ww, CAP
    if kind == "stacked":
        mk = 1.2
        m2 = shift(m, (ww - ms * mk) / 2, 0, mk)
        return m2 + shift(w, 0, ms * mk + 56), ww, ms * mk + 56 + CAP
    raise ValueError(kind)


def to_svg(polys, w, h, fill, pad, bg=None):
    vb = f"{-pad} {-pad} {w + pad * 2:.1f} {h + pad * 2:.1f}"
    body = "".join(
        '<path d="M' + " L".join(f"{x:.2f} {y:.2f}" for x, y in p) + ' Z"/>' for p in polys)
    bg_rect = f'<rect x="{-pad}" y="{-pad}" width="{w + pad * 2:.1f}" height="{h + pad * 2:.1f}" fill="{bg}"/>' if bg else ""
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" role="img" aria-label="UMBRA">'
            f'{bg_rect}<g fill="{fill}">{body}</g></svg>\n')


def to_png(polys, w, h, fill, pad, scale, bg=None):
    W, H = round((w + pad * 2) * scale), round((h + pad * 2) * scale)
    ss = 4  # supersample for smooth edges
    im = Image.new("RGBA", (W * ss, H * ss), bg or (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    for p in polys:
        d.polygon([((x + pad) * scale * ss, (y + pad) * scale * ss) for x, y in p], fill=fill)
    return im.resize((W, H), Image.LANCZOS)


VARIANTS = {"light": INK, "dark": BLACK, "sand": SAND}

if __name__ == "__main__":
    for kind in ("mark", "wordmark", "horizontal", "stacked"):
        polys, w, h = lockup(kind)
        pad = 0 if kind == "mark" else 0
        for name, colour in VARIANTS.items():
            (OUT / f"umbra-{kind}-{name}.svg").write_text(to_svg(polys, w, h, colour, pad), encoding="utf-8")
            scale = 2048 / max(w, h)
            to_png(polys, w, h, colour, pad, scale).save(OUT / f"umbra-{kind}-{name}.png")
    # social avatar: mark centred on obsidian, safe inside a circle crop
    polys, w, h = lockup("mark")
    to_png(polys, w, h, INK, 55, 1024 / (w + 110), bg=BLACK).save(OUT / "umbra-avatar.png")
    print("built", len(list(OUT.iterdir())), "files")
