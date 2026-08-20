#!/usr/bin/env python3
"""Print-ready PDF of Secret Garden coloring stickers for the Character Bottle template."""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageOps
from reportlab.lib.colors import Color, black
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets" / "coloring-stickers"
PROCESSED = ASSETS / "processed"
OUTPUT_PDF = ASSETS / "secret-garden-mary-stickers.pdf"

# Canva Character Bottle template is 8.5x11". The bottle body is ~2.5–3" wide
# and ~5" tall. Three 1.75" circular stickers fit without covering the bottle.
STICKER_INCHES = 1.75
STICKER_SIZE = STICKER_INCHES * inch
PAGE_W, PAGE_H = letter
DPI = 300

DASH_GRAY = Color(0.45, 0.45, 0.45)

STICKERS = [
    {
        "file": "rusty-key-outline.png",
        "id": "1",
        "title": "Old Key",
        "trait": "Curiosity",
        "note": "Mary never stops searching for the garden's hidden key.",
    },
    {
        "file": "robin-bird-outline.png",
        "id": "2",
        "title": "Robin",
        "trait": "Kindness",
        "note": "Mary befriends the robin and learns to care for living things.",
    },
    {
        "file": "rose-flowers-outline.png",
        "id": "3",
        "title": "Roses",
        "trait": "Hope",
        "note": "The blooming roses show the secret garden coming back to life.",
    },
    {
        "file": "ivy-door-outline.png",
        "id": "4",
        "title": "Secret Door",
        "trait": "Mystery",
        "note": "The locked door hides the garden Mary is determined to find.",
    },
    {
        "file": "watering-can-outline.png",
        "id": "5",
        "title": "Watering Can",
        "trait": "Nurturing",
        "note": "Mary learns to tend the garden and help it grow again.",
    },
    {
        "file": "garden-trowel-outline.png",
        "id": "6",
        "title": "Garden Trowel",
        "trait": "Hard Work",
        "note": "Mary digs, plants, and transforms the neglected garden.",
    },
]


def to_line_art(path: Path) -> Image.Image:
    im = Image.open(path).convert("L")
    im = ImageOps.autocontrast(im)
    im = im.point(lambda p: 255 if p > 180 else 0)
    bbox = im.getbbox()
    if bbox:
        pad = 24
        bbox = (
            max(0, bbox[0] - pad),
            max(0, bbox[1] - pad),
            min(im.width, bbox[2] + pad),
            min(im.height, bbox[3] + pad),
        )
        im = im.crop(bbox)
    return im.convert("RGB")


def fit_in_circle_square(im: Image.Image, size_px: int, inset: float = 0.10) -> Image.Image:
    """Fit drawing inside a white square, leaving margin so cut circle doesn't clip art."""
    inner = int(size_px * (1 - 2 * inset))
    w, h = im.size
    scale = inner / max(w, h)
    new_size = (max(1, int(w * scale)), max(1, int(h * scale)))
    resized = im.resize(new_size, Image.Resampling.LANCZOS)
    square = Image.new("RGB", (size_px, size_px), (255, 255, 255))
    offset = ((size_px - resized.width) // 2, (size_px - resized.height) // 2)
    square.paste(resized, offset)
    return square


def save_processed_images() -> list[dict]:
    PROCESSED.mkdir(parents=True, exist_ok=True)
    prepared = []
    px = int(STICKER_INCHES * DPI)
    for sticker in STICKERS:
        src = ASSETS / sticker["file"]
        line = to_line_art(src)
        fitted = fit_in_circle_square(line, px)
        out_name = f"{sticker['id']}-{sticker['title'].lower().replace(' ', '-')}.png"
        out_path = PROCESSED / out_name
        fitted.save(out_path, dpi=(DPI, DPI))
        prepared.append({**sticker, "path": out_path})
        print(f"Processed {sticker['title']}: {fitted.size}")
    return prepared


def wrap_text(c: canvas.Canvas, text: str, font: str, size: float, max_width: float) -> list[str]:
    words = text.split()
    lines, current = [], ""
    for word in words:
        test = f"{current} {word}".strip()
        if c.stringWidth(test, font, size) <= max_width:
            current = test
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


def draw_cut_circle(c: canvas.Canvas, x: float, y: float, size: float) -> None:
    c.saveState()
    c.setStrokeColor(DASH_GRAY)
    c.setLineWidth(0.7)
    c.setDash(2.5, 2)
    c.circle(x + size / 2, y + size / 2, size / 2)
    c.restoreState()


def draw_sticker_cell(
    c: canvas.Canvas,
    sticker: dict,
    x: float,
    y: float,
    show_number: bool = True,
) -> None:
    c.drawImage(
        str(sticker["path"]),
        x,
        y,
        width=STICKER_SIZE,
        height=STICKER_SIZE,
        preserveAspectRatio=True,
        mask="auto",
    )
    draw_cut_circle(c, x, y, STICKER_SIZE)
    cx = x + STICKER_SIZE / 2
    heading = (
        f"Sticker #{sticker['id']}: {sticker['title']}"
        if show_number
        else sticker["title"]
    )
    c.setFillColor(black)
    c.setFont("Helvetica-Bold", 10)
    c.drawCentredString(cx, y - 14, heading)
    c.setFont("Helvetica-Oblique", 9)
    c.drawCentredString(cx, y - 26, sticker["trait"])
    c.setFont("Helvetica", 7.5)
    note_lines = wrap_text(c, sticker["note"], "Helvetica", 7.5, STICKER_SIZE + 18)
    for i, line in enumerate(note_lines[:3]):
        c.drawCentredString(cx, y - 38 - i * 10, line)


def draw_header(c: canvas.Canvas, title: str, subtitle: str) -> float:
    margin = 0.5 * inch
    c.setFillColor(black)
    c.setFont("Helvetica-Bold", 15)
    c.drawCentredString(PAGE_W / 2, PAGE_H - margin, title)
    c.setFont("Helvetica", 9.5)
    c.drawCentredString(PAGE_W / 2, PAGE_H - margin - 16, subtitle)
    return PAGE_H - margin - 36


def draw_footer(c: canvas.Canvas, extra: str) -> None:
    c.setFont("Helvetica", 8)
    c.setFillColor(DASH_GRAY)
    c.drawCentredString(
        PAGE_W / 2,
        0.42 * inch,
        "Print on letter paper at 100% / Actual Size (do not 'fit to page'). Cut on the dashed circle.",
    )
    c.setFillColor(black)
    c.setFont("Helvetica", 8.5)
    c.drawCentredString(PAGE_W / 2, 0.58 * inch, extra)


def layout_row(c: canvas.Canvas, stickers: list[dict], y: float, numbered: bool) -> None:
    gap = 0.32 * inch
    total_w = 3 * STICKER_SIZE + 2 * gap
    start_x = (PAGE_W - total_w) / 2
    for i, sticker in enumerate(stickers):
        x = start_x + i * (STICKER_SIZE + gap)
        draw_sticker_cell(c, sticker, x, y, show_number=numbered)


def build_pdf(prepared: list[dict]) -> None:
    c = canvas.Canvas(str(OUTPUT_PDF), pagesize=letter)
    c.setTitle("The Secret Garden — Mary Stickers")
    c.setAuthor("Character Bottle project")

    primary = prepared[:3]
    bonus = prepared[3:]

    y_top = draw_header(
        c,
        "The Secret Garden — Mary Stickers",
        "Color • Cut out • Stick on the Character Bottle (use 3 stickers)",
    )
    row1_y = y_top - STICKER_SIZE - 0.08 * inch
    layout_row(c, primary, row1_y, numbered=True)

    c.setFont("Helvetica", 9)
    c.drawCentredString(
        PAGE_W / 2,
        row1_y - 0.85 * inch,
        "Extra copies (same 1.75\" size) — color a second set in case one tears while cutting.",
    )
    row2_y = row1_y - 0.95 * inch - STICKER_SIZE
    layout_row(c, primary, row2_y, numbered=True)
    draw_footer(
        c,
        "Each sticker is 1.75 inches — sized for the water bottle on the Canva template.",
    )

    c.showPage()
    y_top = draw_header(
        c,
        "Bonus Stickers (optional alternates)",
        "Same 1.75\" size — swap these in if you like them better.",
    )
    row1_y = y_top - STICKER_SIZE - 0.08 * inch
    layout_row(c, bonus, row1_y, numbered=False)
    c.setFont("Helvetica", 9)
    c.drawCentredString(
        PAGE_W / 2,
        row1_y - 0.85 * inch,
        "Extra copies of the bonus stickers.",
    )
    row2_y = row1_y - 0.95 * inch - STICKER_SIZE
    layout_row(c, bonus, row2_y, numbered=False)
    draw_footer(
        c,
        "Write 2–3 sentences on the template lines explaining how each sticker shows Mary's traits.",
    )

    c.save()
    print(f"Wrote {OUTPUT_PDF}")


def main() -> None:
    prepared = save_processed_images()
    build_pdf(prepared)


if __name__ == "__main__":
    main()
