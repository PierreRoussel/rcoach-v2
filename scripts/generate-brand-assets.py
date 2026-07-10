#!/usr/bin/env python3
"""Generate favicon, PWA and Android launcher assets from assets/brand/logo.png."""

from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets" / "brand" / "logo.png"
PUBLIC = ROOT / "public"
ANDROID_RES = ROOT / "android" / "app" / "src" / "main" / "res"

LAUNCHER_SIZES = {
    "mipmap-mdpi": 48,
    "mipmap-hdpi": 72,
    "mipmap-xhdpi": 96,
    "mipmap-xxhdpi": 144,
    "mipmap-xxxhdpi": 192,
}

FOREGROUND_SIZES = {
    "mipmap-mdpi": 108,
    "mipmap-hdpi": 162,
    "mipmap-xhdpi": 216,
    "mipmap-xxhdpi": 324,
    "mipmap-xxxhdpi": 432,
}


def square_image(image: Image.Image) -> Image.Image:
    width, height = image.size
    side = min(width, height)
    left = (width - side) // 2
    top = (height - side) // 2
    return image.crop((left, top, left + side, top + side))


def resize(image: Image.Image, size: int) -> Image.Image:
    return image.resize((size, size), Image.Resampling.LANCZOS)


def save_png(image: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path, format="PNG", optimize=True)
    print(f"  wrote {path.relative_to(ROOT)}")


def main() -> None:
    if not SOURCE.exists():
        raise SystemExit(f"Missing source image: {SOURCE}")

    source = square_image(Image.open(SOURCE).convert("RGBA"))

    print("Web / PWA")
    save_png(resize(source, 512), PUBLIC / "logo.png")
    save_png(resize(source, 512), PUBLIC / "pwa-512.png")
    save_png(resize(source, 192), PUBLIC / "pwa-192.png")
    save_png(resize(source, 180), PUBLIC / "apple-touch-icon.png")
    save_png(resize(source, 32), PUBLIC / "favicon-32x32.png")
    save_png(resize(source, 16), PUBLIC / "favicon-16x16.png")

    print("Android launcher")
    for folder, size in LAUNCHER_SIZES.items():
        icon = resize(source, size)
        base = ANDROID_RES / folder
        save_png(icon, base / "ic_launcher.png")
        save_png(icon, base / "ic_launcher_round.png")

    for folder, size in FOREGROUND_SIZES.items():
        save_png(resize(source, size), ANDROID_RES / folder / "ic_launcher_foreground.png")

    print("Done.")


if __name__ == "__main__":
    main()
