#!/usr/bin/env python3
"""Mesure les viewBox optimaux par badge sur sheet-sports-candy.svg."""

from __future__ import annotations

import json
import subprocess
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE_SVG = ROOT / 'public' / 'badges' / 'sources' / 'sheet-sports-candy.svg'
SOURCE_PNG = ROOT / 'public' / 'badges' / 'sources' / 'sheet-sports-candy.png'

PLACEMENTS = [
    ('nutrition_streak_7', 0, 0),
    ('nutrition_streak_30', 1, 0),
    ('nutrition_streak_100', 2, 0),
    ('workout_streak_4', 3, 0),
    ('workout_streak_12', 0, 1),
    ('workout_streak_52', 1, 1),
    ('sessions_10', 2, 1),
    ('sessions_50', 3, 1),
    ('sessions_100', 0, 2),
    ('sessions_365', 1, 2),
    ('first_pr', 2, 2),
    ('pr_10', 3, 2),
    ('pr_50', 0, 3),
    ('volume_10k', 1, 3),
    ('volume_100k', 2, 3),
    ('volume_1m', 3, 3),
]


def render_sheet() -> None:
    subprocess.run(
        ['npx', '--yes', '@resvg/resvg-js-cli', str(SOURCE_SVG), str(SOURCE_PNG)],
        check=True,
        cwd=ROOT,
    )


def measure_view_boxes() -> dict[str, dict[str, float]]:
    img = Image.open(SOURCE_PNG).convert('RGBA')
    tile = img.size[0] // 4
    result: dict[str, dict[str, float]] = {}

    for key, col, row in PLACEMENTS:
        left, top = col * tile, row * tile
        crop = img.crop((left, top, left + tile, top + tile))
        px = crop.load()
        minx, miny, maxx, maxy = tile, tile, 0, 0
        found = False

        for y in range(tile):
            for x in range(tile):
                r, g, b, a = px[x, y]
                if a > 10 and not (r < 30 and g < 30 and b < 30):
                    found = True
                    minx = min(minx, x)
                    miny = min(miny, y)
                    maxx = max(maxx, x)
                    maxy = max(maxy, y)

        if not found:
            continue

        pad = 6
        x0 = max(0, minx - pad) + left
        y0 = max(0, miny - pad) + top
        x1 = min(tile, maxx + 1 + pad) + left
        y1 = min(tile, maxy + 1 + pad) + top
        x0 = max(x0, left)
        y0 = max(y0, top)
        x1 = min(x1, left + tile)
        y1 = min(y1, top + tile)

        result[key] = {
            'x': round(x0, 1),
            'y': round(y0, 1),
            'w': round(x1 - x0, 1),
            'h': round(y1 - y0, 1),
        }

    return result


if __name__ == '__main__':
    render_sheet()
    boxes = measure_view_boxes()
    print(json.dumps(boxes, indent=2))
