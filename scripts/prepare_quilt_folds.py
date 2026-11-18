"""Rasterize the approved quilt into repeatable, nearest-neighbor flipbook frames."""
from pathlib import Path
from math import sin, pi
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'src/assets/bed'
FRAMES = 16
WIDTH, HEIGHT = 51, 62


def pack(name, frames):
    width, height = frames[0].size
    sheet = Image.new('RGBA', (width * 8, height * ((len(frames) + 7) // 8)))
    for index, frame in enumerate(frames):
        sheet.paste(frame, (index % 8 * width, index // 8 * height))
    sheet.save(ASSETS / name, optimize=True)


def tone(pixel, factor):
    return tuple(min(255, round(value * factor)) for value in pixel[:3]) + (pixel[3],)


def half_frame(source, amount, facing):
    if amount == 0:
        return source
    result = Image.new('RGBA', source.size)
    for x in range(WIDTH):
        across = x / (WIDTH - 1)
        if facing == 'mendu':
            across = 1 - across
        # Pull the outside corner first. The seam and foot of the quilt stay put.
        pull = amount * (1 - across) ** .72
        crease = round(36 * pull + 3 * sin(across * 15) * pull)
        lip = round(15 * pull)
        for y in range(HEIGHT):
            if y < crease - lip:
                if y >= crease - lip - 4 and crease > 4:
                    result.putpixel((x, y), (85, 50, 25, (y - crease + lip + 5) * 11))
                continue
            if y < crease + lip and lip > 0:
                # Reverse the weave on the turnover, showing the lighter lining.
                sample = source.getpixel((x, max(0, min(HEIGHT - 1, crease + lip - y))))
                warm = (round(sample[0] * .30 + 152), round(sample[1] * .30 + 124),
                        round(sample[2] * .30 + 88), sample[3])
                depth = (y - crease + lip) / (2 * lip)
                factor = .83 + .23 * sin(depth * pi) + .075 * sin(x * .8 + depth * 4)
                if y == crease - lip:
                    factor *= .80
                result.putpixel((x, y), tone(warm, factor))
                continue
            # The already stationary fabric beneath the folded portion.
            factor = .70 + .30 * min(1, max(0, (y - crease - lip) / 7))
            result.putpixel((x, y), tone(source.getpixel((x, y)), factor))
    return result


def center_frame(source, amount):
    result = Image.new('RGBA', (102, 74))
    for x in range(102):
        dx = abs(x - 50.5)
        envelope = max(0, 1 - (dx / 24) ** 2) ** 2
        lift = round(10 * envelope * amount)
        for y in range(74):
            source_y = y - 12
            # Raise the lip, stretching the weave only near the moving fold.
            distance = max(0, source_y)
            source_y += round(lift * max(0, 1 - distance / 24))
            if source_y < 0 or source_y >= HEIGHT:
                continue
            pixel = source.getpixel((x, source_y))
            if lift >= 2 and source_y < lift * .65:
                pixel = (round(pixel[0] * .40 + 124), round(pixel[1] * .42 + 97),
                         round(pixel[2] * .44 + 69), pixel[3])
            if lift and 0 <= source_y < 16:
                pixel = tone(pixel, 1 + .08 * envelope * amount * sin(source_y * .5))
            result.putpixel((x, y), pixel)
    return result


base = Image.new('RGBA', (102, HEIGHT))
for i, role in enumerate(('mashuo', 'mendu')):
    source = Image.open(ASSETS / f'quilt-{role}.png').convert('RGBA')
    base.paste(source, (i * WIDTH, 0))
    pack(f'fold-{role}.png', [half_frame(source, n / (FRAMES - 1), role) for n in range(FRAMES)])
pack('fold-center.png', [center_frame(base, n / (FRAMES - 1)) for n in range(FRAMES)])

# The top lip rises for the sleeping head. During entry a separate moving
# central fold follows the shoulders from the foot to that lip.
def traveling_fold(source, offset):
    result = center_frame(source, 0)
    for x in range(24, 78):
        across = max(0, 1 - ((x - 50.5) / 27) ** 2)
        for y in range(6, 58):
            distance = (y - offset) / 8
            if abs(distance) >= 1:
                continue
            weight = (1 - distance ** 2) * across
            source_y = max(0, y + round(weight * 4))
            pixel = source.getpixel((x, source_y))
            shade = 1 + weight * (.20 if distance < 0 else -.25)
            result.putpixel((x, y + 12), tone(pixel, shade))
    return result

pack('fold-travel.png', [traveling_fold(base, offset) for offset in range(6, 69, 2)])
