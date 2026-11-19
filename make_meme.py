#!/usr/bin/env python3
"""Overlay meme captions on the GTA 6 base artwork.

Reads the AI-generated base image (skeleton waiting in Vice City + the
make.fun ghost) and burns in large, high-contrast captions so the joke
stays readable when X / the judge shrinks the picture to 480x480.

Usage: python3 make_meme.py [base.png] [out.png]
"""
import sys
from PIL import Image, ImageDraw, ImageFont

BASE = "media-generation-gta6-meme-base-0-b0200807-77e3-42f3-8024-4f353bd641bf.png"
OUT = "meme.png"
FONT_PATH = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

TOP_LINES = ["WAITING FOR GTA 6", "SINCE 2013"]
BOTTOM_LINES = ["MEANWHILE MY AI AGENT", "ALREADY GOT PAID ON MAKE.FUN"]


def fit_font(draw, lines, max_width, start_size):
    """Largest bold font size at which every line fits max_width."""
    size = start_size
    while size > 20:
        font = ImageFont.truetype(FONT_PATH, size)
        if all(draw.textlength(line, font=font) <= max_width for line in lines):
            return font
        size -= 4
    return ImageFont.truetype(FONT_PATH, 20)


def draw_caption(draw, img, lines, y_top, band_color):
    """Center lines in a translucent band; white fill, thick black stroke."""
    w = img.width
    font = fit_font(draw, lines, int(w * 0.92), 150)
    line_h = int(font.size * 1.12)
    band_h = line_h * len(lines) + 36
    overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    band = ImageDraw.Draw(overlay)
    band.rectangle([0, y_top, w, y_top + band_h], fill=band_color)
    img.paste(Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB"), (0, 0))
    draw = ImageDraw.Draw(img)
    y = y_top + 18
    for line in lines:
        draw.text(
            (w / 2, y),
            line,
            font=font,
            fill=(255, 255, 255),
            stroke_width=max(4, font.size // 14),
            stroke_fill=(0, 0, 0),
            anchor="ma",
        )
        y += line_h
    return y_top + band_h


def main():
    base_path = sys.argv[1] if len(sys.argv) > 1 else BASE
    out_path = sys.argv[2] if len(sys.argv) > 2 else OUT
    img = Image.open(base_path).convert("RGB")
    draw = ImageDraw.Draw(img)
    # Top caption sits over the sky; bottom caption over the curb/sand.
    draw_caption(draw, img, TOP_LINES, 0, (0, 0, 0, 110))
    bottom_h = 0
    font = fit_font(draw, BOTTOM_LINES, int(img.width * 0.92), 130)
    bottom_h = int(font.size * 1.12) * len(BOTTOM_LINES) + 36
    draw_caption(draw, img, BOTTOM_LINES, img.height - bottom_h, (0, 0, 0, 110))
    img.save(out_path, "PNG")
    print(f"wrote {out_path} {img.size}")


if __name__ == "__main__":
    main()
