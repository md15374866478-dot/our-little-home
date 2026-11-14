"""Pixel-resource checks for artist handoff (requires Pillow)."""
from pathlib import Path
from PIL import Image, ImageChops

ROOT = Path(__file__).resolve().parents[1]
MAPS = ROOT / 'src' / 'assets' / 'maps'
CHARACTERS = ROOT / 'src' / 'assets' / 'characters'

def rgba(path, size):
    image = Image.open(path)
    assert image.mode == 'RGBA', f'{path}: expected RGBA PNG'
    assert image.size == size, f'{path}: expected {size}, got {image.size}'
    return image

for role in ('mashuo', 'mendu'):
    sheet = rgba(CHARACTERS / f'{role}.png', (256, 192))
    for frame in range(32):
        crop = sheet.crop(((frame % 8) * 32, (frame // 8) * 48, (frame % 8 + 1) * 32, (frame // 8 + 1) * 48))
        bounds = crop.getchannel('A').getbbox()
        assert bounds is not None, f'{role}: empty frame {frame}'
        assert crop.getpixel((0, 0))[3] == 0, f'{role}: frame {frame} has opaque padding'
        if frame < 16:
            assert bounds[3] == 47, f'{role}: frame {frame} shifted its foot baseline'
    for direction in range(4):
        frames = [sheet.crop((((direction * 4 + phase) % 8) * 32, ((direction * 4 + phase) // 8) * 48,
                             ((direction * 4 + phase) % 8 + 1) * 32, ((direction * 4 + phase) // 8 + 1) * 48)) for phase in range(4)]
        assert len({frame.tobytes() for frame in frames}) == 4, f'{role}: repeated walking frame in direction {direction}'
    print(f'{role}: 32 RGBA frames, 16 distinct walking frames, stable foot baseline')

full = rgba(MAPS / 'home.png', (480, 384))
base = rgba(MAPS / 'home-base-sample.png', (480, 384))
bed = rgba(MAPS / 'home-bed-sample.png', (131, 113))
assert base.getchannel('A').getextrema() == (255, 255)
assert bed.getchannel('A').getextrema() == (0, 255)
composed = base.copy()
composed.alpha_composite(bed, (30, 33))
assert ImageChops.difference(composed, full).getbbox() is None, 'bed layer does not reproduce the sample room'
front = rgba(MAPS / 'home-front.png', (480, 384))
other = rgba(MAPS / 'home-other-front-sample.png', (480, 384))
bed_front = rgba(MAPS / 'home-bed-front-sample.png', (126, 16))
other.alpha_composite(bed_front, (33, 129))
assert ImageChops.difference(other, front).getbbox() is None, 'front occlusion composition changed'
for season in ('spring', 'summer', 'autumn', 'winter'):
    yard = rgba(MAPS / f'yard-{season}.png', (704, 544))
    assert yard.getchannel('A').getextrema() == (255, 255), f'{season}: holes in yard base'
print('indoor layer composition and four seasonal yard bases: valid')
