"""Prepare a generated art-review room for the fixed 480×384 game canvas.

The high-resolution source is an original AI-assisted visual draft, not a final
artist-authored tile set. Nearest-neighbor reduction happens offline, never via
fractional Phaser scaling. Foreground crops provide bed/sofa occlusion while
the map keeps its own collision grid and interaction anchors.
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'art-source' / 'indoor-generated-source.png'
OUT = ROOT / 'src' / 'assets' / 'maps'
EXPECTED = (480, 384)

source = Image.open(SOURCE).convert('RGB')
assert abs(source.width / source.height - EXPECTED[0] / EXPECTED[1]) < 0.005, 'source aspect ratio changed'
room = source.resize(EXPECTED, Image.Resampling.NEAREST).convert('RGBA')
room.save(OUT / 'home-detailed.png', optimize=True)

# (left, top, right, bottom) in 1:1 game pixels; these crops add no new objects.
foreground = {
    'home-detailed-blanket-front.png': (43, 101, 150, 132),
    'home-detailed-bed-front.png': (31, 127, 164, 152),
    'home-detailed-sofa-front.png': (41, 257, 178, 299),
}
for name, bounds in foreground.items():
    room.crop(bounds).save(OUT / name, optimize=True)
    print(name, (bounds[2] - bounds[0], bounds[3] - bounds[1]))
print('home-detailed.png', room.size)
