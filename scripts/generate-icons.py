"""One-off script to generate PWA icons for ZarcFit (CA-201).

Draws a rounded-square coral icon with a white "Z" wordmark, matching the
--color-accent brand token in tokens.css (oklch(58% 0.17 35) ~= #CB4A2A).
Not part of the app runtime — run manually if icons need regenerating:

    python scripts/generate-icons.py
"""

import os
from PIL import Image, ImageDraw, ImageFont

ACCENT = (203, 74, 42, 255)  # oklch(58% 0.17 35) -> sRGB, see tokens.css --color-accent
WHITE = (251, 249, 245, 255)  # oklch(98.2% 0.006 85) -> --color-paper

OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "icons")
FONT_PATH = r"C:\Windows\Fonts\arialbd.ttf"


def rounded_square(size: int, radius_ratio: float = 0.22) -> Image.Image:
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    radius = int(size * radius_ratio)
    draw.rounded_rectangle([(0, 0), (size - 1, size - 1)], radius=radius, fill=ACCENT)
    return img


def draw_wordmark(img: Image.Image, text: str, scale: float = 0.56) -> None:
    size = img.size[0]
    draw = ImageDraw.Draw(img)
    font_size = int(size * scale)
    font = ImageFont.truetype(FONT_PATH, font_size)
    bbox = draw.textbbox((0, 0), text, font=font)
    w, h = bbox[2] - bbox[0], bbox[3] - bbox[1]
    x = (size - w) / 2 - bbox[0]
    y = (size - h) / 2 - bbox[1]
    draw.text((x, y), text, font=font, fill=WHITE)


def main() -> None:
    os.makedirs(OUT_DIR, exist_ok=True)

    base = 512
    icon = rounded_square(base, radius_ratio=0.22)
    draw_wordmark(icon, "Z", scale=0.56)
    icon.save(os.path.join(OUT_DIR, "icon-512.png"))
    icon.resize((192, 192), Image.LANCZOS).save(os.path.join(OUT_DIR, "icon-192.png"))

    # Maskable variant: full-bleed background, wordmark kept inside the
    # ~80% "safe zone" so OS icon masks (circle/squircle) don't clip it.
    maskable = rounded_square(base, radius_ratio=0.0)
    draw_wordmark(maskable, "Z", scale=0.42)
    maskable.save(os.path.join(OUT_DIR, "icon-maskable-512.png"))

    print("Wrote icon-192.png, icon-512.png, icon-maskable-512.png to", OUT_DIR)


if __name__ == "__main__":
    main()
