#!/usr/bin/env python3
"""Build a print-ready PDF of Secret Garden coloring stickers sized for the Character Bottle template."""

from __future__ import annotations

import os
from pathlib import Path

from PIL import Image, ImageOps
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib.colors import black, gray
from reportlab.pdfgen import canvas

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets" / "coloring-stickers"
PROCESSED = ASSETS / "processed"
OUTPUT_PDF = ASSETS / "secret-garden-mary-stickers.pdf"

# Template stickers are ~1.5–2" on the water bottle; 1.75" is a good fit.
STICKER_SIZE = 1.75 * inch
PAGE_W, PAGE_H = letter  # 8.5 x 11 in

STICKERS = [
    {
        "file": "rusty-key-outline.png",
        "id": "1",
        "title": "Old Key",
        "trait": "Curiosity — Mary never stops searching for the garden's hidden key.",
    },
    {
        "file": "robin-bird-outline.png",
        "id": "2",
        "title": "Robin",
        "trait": "Kindness — Mary befriends the robin and learns to care for living things.",
    },
    {
        "file": "rose-flowers-outline.png",
        "id": "3",
        "title": "Roses",
        "trait": "Hope — The blooming roses show the secret garden coming back to life.",
    },
    {
        "file": "ivy-door-outline.png",
        "id": "4",
        "title": "Secret Door",
        "trait": "Mystery — The locked door hides the magical world Mary is determined to find.",
    },
    {
        "file": "watering-can-outline.png",
        "id": "5",
        "title": "Watering Can",
        "trait": "Nurturing — Mary learns to tend the garden and help it grow again.",
    },
    {
        "file": "garden-trowel-outline.png",
        "id": "6",
        "title": "Garden Trowel",
        "trait": "Hard Work — Mary digs, plants, and transforms the neglected garden.",
    },
]


def to_line_art(path: Path) -> Image.Image:
    im = Image.open(path).convert("L")
    im = ImageOps.autocontrast(im)
    im = im.point(lambda p: 255 if p > 190 else 0, mode="1")
    bbox = im.getbbox()
    if bbox:
        pad = 16
        bbox = (
            max(0, bbox[0] - pad),
            max(0, bbox[1] - pad),
            min(im.width, bbox[2] + pad),
            min(im.height, bbox[3] + pad),
        )
        im = im.crop(bbox)
    return im


def save_processed_images() -> list[dict]:
    PROCESSED.mkdir(parents=True, exist_ok=True)
    prepared = []
    for sticker in STICKERS:
        src = ASSETS / sticker["file"]
        if not src.exists():
            src = Path("/opt/cursor/artifacts/assets") / sticker["file"]
        line = to_line_art(src)
        out_name = f"{sticker['id']}-{sticker['title'].lower().replace(' ', '-')}.png"
        out_path = PROCESSED / out_name
        line.save(out_path, dpi=(300, 300))
        prepared.append({**sticker, "path": out_path})
        print(f"Processed {sticker['title']}: {line.size}")
    return prepared


def fit_image_in_square(path: Path, size_px: int) -> Image.Image:
    im = Image.open(path).convert("1")
    im = im.resize(
        (
            int(size_px * im.width / max(im.width, im.height)),
            int(size_px * im.height / max(im.width, im.height)),
        ),
        Image.Resampling.LANCZOS,
    )
    square = Image.new("1", (size_px, size_px), 1)
    offset = ((size_px - im.width) // 2, (size_px - im.height) // 2)
    square.paste(im, offset)
    return square


def draw_cut_guides(c: canvas.Canvas, x: float, y: float, size: float) -> None:
    c.setStrokeColor(gray)
    c.setLineWidth(0.5)
    c.setDash(3, 3)
    cx = x + size / 2
    cy = y + size / 2
    c.circle(cx, cy, size / 2)
    c.setDash()
    c.setStrokeColor(black)


def build_pdf(prepared: list[dict]) -> None:
    c = canvas.Canvas(str(OUTPUT_PDF), pagesize=letter)
    margin = 0.6 * inch
    gap = 0.35 * inch
    dpi = 300
    px = int(STICKER_SIZE / inch * dpi)

    # --- Page 1: the 3 stickers for the Character Bottle template ---
    c.setFont("Helvetica-Bold", 16)
    c.drawCentredString(PAGE_W / 2, PAGE_H - margin, "The Secret Garden — Mary Stickers")
    c.setFont("Helvetica", 10)
    c.drawCentredString(
        PAGE_W / 2,
        PAGE_H - margin - 16,
        "Color • Cut out • Stick on your Character Bottle template (Stickers #1–#3)",
    )

    row_y = PAGE_H - margin - 1.1 * inch - STICKER_SIZE
    usable_w = PAGE_W - 2 * margin
    total_w = 3 * STICKER_SIZE + 2 * gap
    start_x = (PAGE_W - total_w) / 2

    primary = prepared[:3]
    for i, sticker in enumerate(primary):
        x = start_x + i * (STICKER_SIZE + gap)
        temp = PROCESSED / f"_temp_{sticker['id']}.png"
        fit_image_in_square(sticker["path"], px).save(temp, dpi=(300, 300))
        c.drawImage(str(temp), x, row_y, width=STICKER_SIZE, height=STICKER_SIZE, mask="auto")
        temp.unlink(missing_ok=True)
        draw_cut_guides(c, x, row_y, STICKER_SIZE)
        c.setFont("Helvetica-Bold", 11)
        c.drawCentredString(x + STICKER_SIZE / 2, row_y - 14, f"Sticker #{sticker['id']}: {sticker['title']}")
        c.setFont("Helvetica", 8)
        trait = sticker["trait"]
        words = trait.split()
        lines, current = [], ""
        for word in words:
            test = f"{current} {word}".strip()
            if c.stringWidth(test, "Helvetica", 8) < STICKER_SIZE + 20:
                current = test
            else:
                lines.append(current)
                current = word
        if current:
            lines.append(current)
        for j, line in enumerate(lines[:3]):
            c.drawCentredString(x + STICKER_SIZE / 2, row_y - 28 - j * 10, line)

    c.setFont("Helvetica", 9)
    c.drawString(
        margin,
        row_y - STICKER_SIZE - 0.55 * inch,
        "Tip: Each sticker is 1.75 inches — sized to fit the water bottle on your Canva template.",
    )
    c.drawString(
        margin,
        row_y - STICKER_SIZE - 0.68 * inch,
        "Use Stickers #1–#3 on the bottle. Write 2–3 sentences about each trait on the template lines.",
    )

    # --- Page 2: bonus alternates ---
    c.showPage()
    c.setFont("Helvetica-Bold", 14)
    c.drawCentredString(PAGE_W / 2, PAGE_H - margin, "Bonus Stickers (optional alternates)")
    c.setFont("Helvetica", 10)
    c.drawCentredString(
        PAGE_W / 2,
        PAGE_H - margin - 14,
        "Same size — pick different ones if you prefer!",
    )

    bonus = prepared[3:]
    row_y2 = PAGE_H - margin - 0.9 * inch - STICKER_SIZE
    total_w2 = 3 * STICKER_SIZE + 2 * gap
    start_x2 = (PAGE_W - total_w2) / 2
    for i, sticker in enumerate(bonus):
        x = start_x2 + i * (STICKER_SIZE + gap)
        temp = PROCESSED / f"_temp_bonus_{sticker['id']}.png"
        fit_image_in_square(sticker["path"], px).save(temp, dpi=(300, 300))
        c.drawImage(str(temp), x, row_y2, width=STICKER_SIZE, height=STICKER_SIZE, mask="auto")
        temp.unlink(missing_ok=True)
        draw_cut_guides(c, x, row_y2, STICKER_SIZE)
        c.setFont("Helvetica-Bold", 10)
        c.drawCentredString(x + STICKER_SIZE / 2, row_y2 - 14, sticker["title"])
        c.setFont("Helvetica", 8)
        c.drawCentredString(x + STICKER_SIZE / 2, row_y2 - 26, sticker["trait"].split("—")[0].strip())

    c.save()
    print(f"Wrote {OUTPUT_PDF}")


def main() -> None:
    prepared = save_processed_images()
    build_pdf(prepared)


if __name__ == "__main__":
    main()
