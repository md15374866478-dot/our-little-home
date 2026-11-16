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

for role, source_size in (('mashuo', (1261, 1247)), ('mendu', (1247, 1261))):
    source = rgba(ROOT / 'art-source' / 'characters-v31' / f'{role}-walk-source.png', source_size)
    assert source.getchannel('A').getextrema()[0] == 0, f'{role}: V3.1 source has no transparency'
    sheet = rgba(CHARACTERS / 'review' / f'{role}-v31-walk.png', (320, 120))
    assert set(sheet.getchannel('A').get_flattened_data()) == {0, 255}, f'{role}: V3.1 final edges are not pixel-crisp'
    for direction in range(4):
        frames = []
        tops, centers = [], []
        for phase in range(4):
            index = direction * 4 + phase
            frame = sheet.crop(((index % 8) * 40, (index // 8) * 60,
                                (index % 8 + 1) * 40, (index // 8 + 1) * 60))
            bounds = frame.getchannel('A').getbbox()
            assert bounds and bounds[3] == 59, f'{role}: V3.1 foot baseline shifted at frame {index}'
            assert frame.getpixel((0, 0))[3] == 0, f'{role}: V3.1 background is not transparent at frame {index}'
            tops.append(bounds[1])
            centers.append((bounds[0] + bounds[2]) / 2)
            frames.append(frame)
        assert len({frame.tobytes() for frame in frames}) == 4, f'{role}: V3.1 direction {direction} repeats a walk frame'
        assert max(tops) - min(tops) <= 3, f'{role}: V3.1 direction {direction} jumps vertically'
        assert max(centers) - min(centers) <= 2, f'{role}: V3.1 direction {direction} jumps horizontally'
    print(f'{role}: V3.1 16 transparent 40×60 walk frames, stable foot baseline')

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
detailed = rgba(MAPS / 'home-detailed.png', (480, 384))
assert detailed.getchannel('A').getextrema() == (255, 255), 'detailed room has transparent holes'
source = Image.open(ROOT / 'art-source' / 'indoor-generated-source.png').convert('RGB')
assert detailed.convert('RGB').tobytes() == source.resize((480, 384), Image.Resampling.NEAREST).tobytes(), 'detailed room is not a 1:1 prepared source'
for name, bounds in {
    'home-detailed-blanket-front.png': (43, 101, 150, 132),
    'home-detailed-bed-front.png': (31, 127, 164, 152),
    'home-detailed-sofa-front.png': (41, 257, 178, 299),
}.items():
    crop = rgba(MAPS / name, (bounds[2]-bounds[0], bounds[3]-bounds[1]))
    assert ImageChops.difference(crop, detailed.crop(bounds)).getbbox() is None, f'{name}: crop mismatch'
print('indoor layer composition, detailed candidate, and four seasonal yard bases: valid')
