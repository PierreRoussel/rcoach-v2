#!/usr/bin/env python3
"""Génère un SVG autonome par badge (viewBox + paths embarqués)."""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'public' / 'badges' / 'sources' / 'sheet-sports-candy.svg'
OUT_DIR = ROOT / 'public' / 'badges' / 'tiles'

VIEW_BOXES: dict[str, dict[str, int]] = {
    'nutrition_streak_7': {'x': 55, 'y': 52, 'w': 201, 'h': 202},
    'nutrition_streak_30': {'x': 256, 'y': 62, 'w': 256, 'h': 179},
    'nutrition_streak_100': {'x': 523, 'y': 62, 'w': 236, 'h': 181},
    'workout_streak_4': {'x': 793, 'y': 42, 'w': 184, 'h': 214},
    'workout_streak_12': {'x': 45, 'y': 291, 'w': 211, 'h': 221},
    'workout_streak_52': {'x': 256, 'y': 264, 'w': 256, 'h': 244},
    'sessions_10': {'x': 530, 'y': 301, 'w': 238, 'h': 189},
    'sessions_50': {'x': 768, 'y': 256, 'w': 239, 'h': 231},
    'sessions_100': {'x': 48, 'y': 511, 'w': 248, 'h': 244},
    'sessions_365': {'x': 300, 'y': 500, 'w': 192, 'h': 264},
    'first_pr': {'x': 543, 'y': 519, 'w': 206, 'h': 225},
    'pr_10': {'x': 779, 'y': 518, 'w': 213, 'h': 233},
    'pr_50': {'x': 52, 'y': 771, 'w': 204, 'h': 227},
    'volume_10k': {'x': 330, 'y': 776, 'w': 154, 'h': 218},
    'volume_100k': {'x': 544, 'y': 769, 'w': 204, 'h': 222},
    'volume_1m': {'x': 784, 'y': 773, 'w': 201, 'h': 225},
}


def extract_svg_inner(svg_text: str) -> str:
    match = re.search(r'<svg[^>]*>(.*)</svg>\s*$', svg_text, flags=re.DOTALL)
    if not match:
        raise ValueError('SVG source invalide')
    return match.group(1)


def write_tiles() -> None:
    inner = extract_svg_inner(SOURCE.read_text(encoding='utf-8'))
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    for key, box in VIEW_BOXES.items():
        svg = (
            '<?xml version="1.0" encoding="UTF-8"?>\n'
            f'<svg xmlns="http://www.w3.org/2000/svg" '
            f'viewBox="{box["x"]} {box["y"]} {box["w"]} {box["h"]}">\n'
            f'{inner}\n'
            '</svg>\n'
        )
        (OUT_DIR / f'{key}.svg').write_text(svg, encoding='utf-8')

    print(f'Wrote {len(VIEW_BOXES)} standalone SVG tiles to {OUT_DIR}')


if __name__ == '__main__':
    write_tiles()
