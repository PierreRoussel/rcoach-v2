#!/usr/bin/env python3
"""Découpe `sheet-sports-candy.svg` (image.svg, grille 4×4) en SVG par clé."""

from __future__ import annotations

import re
from fractions import Fraction
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'public' / 'badges' / 'sources' / 'sheet-sports-candy.svg'
OUT_DIR = ROOT / 'public' / 'badges' / 'tiles'

CANVAS = Fraction(1024, 1)
TILE = CANVAS / 4
INSET = Fraction(2, 1)

TILES: list[tuple[int, int, str]] = [
    (0, 0, 'nutrition_streak_7'),
    (0, 1, 'nutrition_streak_30'),
    (0, 2, 'nutrition_streak_100'),
    (0, 3, 'workout_streak_4'),
    (1, 0, 'workout_streak_12'),
    (1, 1, 'workout_streak_52'),
    (1, 2, 'sessions_10'),
    (1, 3, 'sessions_50'),
    (2, 0, 'sessions_100'),
    (2, 1, 'sessions_365'),
    (2, 2, 'first_pr'),
    (2, 3, 'pr_10'),
    (3, 0, 'pr_50'),
    (3, 1, 'volume_10k'),
    (3, 2, 'volume_100k'),
    (3, 3, 'volume_1m'),
]


def _float(value: Fraction) -> str:
    return format(float(value), '.4f').rstrip('0').rstrip('.')


def extract_svg_inner(svg_text: str) -> str:
    match = re.search(r'<svg[^>]*>(.*)</svg>\s*$', svg_text, flags=re.DOTALL)
    if not match:
        raise ValueError('SVG source invalide')
    return match.group(1)


def write_badge_svgs() -> None:
    inner = extract_svg_inner(SOURCE.read_text(encoding='utf-8'))
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    for row, col, key in TILES:
        left = TILE * col
        top = TILE * row
        view_left = left + INSET
        view_top = top + INSET
        view_w = TILE - INSET * 2
        view_h = TILE - INSET * 2

        svg = (
            '<?xml version="1.0" encoding="UTF-8"?>\n'
            f'<svg xmlns="http://www.w3.org/2000/svg" '
            f'viewBox="{_float(view_left)} {_float(view_top)} {_float(view_w)} {_float(view_h)}">\n'
            f'{inner}\n'
            '</svg>\n'
        )
        (OUT_DIR / f'{key}.svg').write_text(svg, encoding='utf-8')
        print(key, f'viewBox={_float(view_left)} {_float(view_top)} {_float(view_w)} {_float(view_h)}')

    print(f'Wrote {len(TILES)} SVG badges to {OUT_DIR}')


if __name__ == '__main__':
    write_badge_svgs()
