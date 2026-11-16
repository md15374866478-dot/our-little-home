"""Pack V3.1 review art into exact, transparent Phaser walking atlases.

The two high-resolution, AI-assisted sources were generated from the supplied
design board. The board itself is not a sprite sheet and no board pixels are
cropped. This deterministic preparation only isolates the 16 source poses,
resamples them to the chosen 40×60 game-pixel frame, and aligns the foot line.
Interaction frames and the alternate outfit are intentionally out of scope.
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'art-source' / 'characters-v31'
OUT = ROOT / 'src' / 'assets' / 'characters' / 'review'
OUT.mkdir(parents=True, exist_ok=True)
FRAME = (40, 60)
COLS = 8

# Transparent gutters in the generated source were measured before packing.
# Each (x0,x1) / (y0,y1) encloses exactly one isolated pose in that column/row.
BANDS = {
    'mashuo': {
        'size': (1261, 1247),
        'x': [(81, 264), (388, 559), (705, 875), (1022, 1190)],
        'y': [(13, 299), (324, 601), (631, 910), (942, 1231)],
    },
    'mendu': {
        'size': (1247, 1261),
        'x': [(126, 287), (403, 562), (680, 838), (958, 1118)],
        'y': [(6, 303), (326, 612), (636, 926), (951, 1243)],
    },
}


def isolate(source, x_band, y_band):
    x0, x1 = x_band
    y0, y1 = y_band
    crop = source.crop((x0 - 5, y0 - 5, x1 + 5, y1 + 5))
    # Ignore only very faint generation noise outside the silhouette.
    bounds = crop.getchannel('A').point(lambda alpha: 255 if alpha > 60 else 0).getbbox()
    assert bounds, 'empty source pose'
    left, top, right, bottom = bounds
    return crop.crop((max(0, left - 2), max(0, top - 2), min(crop.width, right + 2), min(crop.height, bottom + 2)))


def pack(role):
    spec = BANDS[role]
    source = Image.open(SOURCE / f'{role}-walk-source.png').convert('RGBA')
    assert source.size == spec['size'], f'{role}: source dimensions changed'
    poses = [isolate(source, spec['x'][col], spec['y'][row])
             for row in range(4) for col in range(4)]
    max_w = max(pose.width for pose in poses)
    max_h = max(pose.height for pose in poses)
    scale = min((FRAME[0] - 4) / max_w, (FRAME[1] - 3) / max_h)
    sheet = Image.new('RGBA', (FRAME[0] * COLS, FRAME[1] * 2), (0, 0, 0, 0))
    for index, pose in enumerate(poses):
        size = (round(pose.width * scale), round(pose.height * scale))
        pixel = pose.resize(size, Image.Resampling.NEAREST)
        # Keep hard transparent edges at the final game pixel size.
        alpha = pixel.getchannel('A').point(lambda value: 255 if value >= 125 else 0)
        pixel.putalpha(alpha)
        bounds = alpha.getbbox()
        assert bounds, f'{role}: blank packed frame {index}'
        pixel = pixel.crop(bounds)
        x = (FRAME[0] - pixel.width) // 2
        y = FRAME[1] - 1 - pixel.height
        assert x >= 0 and y >= 0, f'{role}: frame {index} exceeds canvas'
        sheet.alpha_composite(pixel, ((index % COLS) * FRAME[0] + x, (index // COLS) * FRAME[1] + y))
    dest = OUT / f'{role}-v31-walk.png'
    sheet.save(dest, optimize=True)
    print(dest.relative_to(ROOT), sheet.size, '16 RGBA frames', FRAME)


if __name__ == '__main__':
    for name in BANDS:
        pack(name)
