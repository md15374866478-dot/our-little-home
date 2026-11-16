"""Pack the approved V3.1 walk poses and new duo action poses into 40×60 atlases.

The supplied board is design reference, not a sprite sheet. These original
AI-assisted action sources have transparent gutters and are offline packed
into exact Phaser frames. No runtime stretch, old sprite enlargement, or scene
art changes are involved. Frame order is documented in ART_SPEC.md.
"""
from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'art-source' / 'characters-v31'
W, H, COLS = 40, 60, 8


def isolate(source, row, column):
    sw, sh = source.size
    cell = source.crop((round(column * sw / 4), round(row * sh / 4),
                        round((column + 1) * sw / 4), round((row + 1) * sh / 4)))
    bounds = cell.getchannel('A').point(lambda value: 255 if value > 60 else 0).getbbox()
    assert bounds, f'blank action source pose {row},{column}'
    left, top, right, bottom = bounds
    return cell.crop((max(0, left - 2), max(0, top - 2),
                      min(cell.width, right + 2), min(cell.height, bottom + 2)))


def make_frame(pose, scale, horizontal=False):
    # Arms may need two fewer pixels of width while the head keeps its size.
    scale = min(scale, (W - 2) / pose.width)
    if horizontal:
        scale = min(scale, (H - 20) / pose.height)
    size = (round(pose.width * scale), round(pose.height * scale))
    pixel = pose.resize(size, Image.Resampling.NEAREST)
    alpha = pixel.getchannel('A').point(lambda value: 255 if value >= 125 else 0)
    pixel.putalpha(alpha)
    bounds = alpha.getbbox()
    assert bounds, 'empty packed action frame'
    # Upright sprites align their head to the same world x; horizontal poses
    # align their whole silhouette so two sleepers fit on the shared bed.
    if horizontal:
        head_center = None
    else:
        head = pose.getchannel('A').crop((0, 0, pose.width, round(pose.height * .42)))
        head_bounds = head.point(lambda value: 255 if value > 60 else 0).getbbox()
        assert head_bounds
        head_center = (head_bounds[0] + head_bounds[2]) / 2 * scale - bounds[0]
    pixel = pixel.crop(bounds)
    x = round((W - pixel.width) / 2) if head_center is None else round(W / 2 - head_center)
    x = max(0, min(W - pixel.width, x))
    y = H - 1 - pixel.height
    assert y >= 0 and pixel.width <= W
    frame = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    frame.alpha_composite(pixel, (x, y))
    return frame


def pack(role):
    source = Image.open(SOURCE / f'{role}-actions-source.png').convert('RGBA')
    assert source.size == (1261, 1247), f'{role}: unexpected action source size'
    poses = [isolate(source, row, col) for row in range(4) for col in range(4)]
    upright_height = max(pose.height for pose in poses[:12])
    upright_scale = (H - 3) / upright_height
    walk = Image.open(ROOT / 'src' / 'assets' / 'characters' / 'review' / f'{role}-v31-walk.png')
    assert walk.size == (W * COLS, H * 2) and walk.mode == 'RGBA'
    sheet = Image.new('RGBA', (W * COLS, H * 4), (0, 0, 0, 0))
    sheet.alpha_composite(walk, (0, 0))
    for index, pose in enumerate(poses):
        frame = make_frame(pose, upright_scale, horizontal=index >= 12)
        # The generated Mendu reach poses extend screen-left; mirror only
        # these three frames so both palms meet with Mendu on Mashuo's left.
        if role == 'mendu' and 4 <= index <= 6:
            frame = ImageOps.mirror(frame)
        cell = index + 16
        sheet.alpha_composite(frame, ((cell % COLS) * W, (cell // COLS) * H))
    dest = ROOT / 'src' / 'assets' / 'characters' / f'{role}-v33.png'
    sheet.save(dest, optimize=True)
    print(dest.relative_to(ROOT), sheet.size, '32 RGBA frames')


if __name__ == '__main__':
    for name in ('mashuo', 'mendu'):
        pack(name)
