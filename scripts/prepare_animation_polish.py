"""Pack the new bed and jump key poses with transparent, common origins."""
from pathlib import Path
import numpy as np
from PIL import Image
from scipy.ndimage import label

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'art-source/animation-polish'

def cells(name):
    image = Image.open(SOURCE / f'{name}.png').convert('RGBA')
    for index in range(8):
        col, row = index % 4, index // 4
        frame = image.crop((round(col * image.width / 4), round(row * image.height / 2),
                            round((col + 1) * image.width / 4), round((row + 1) * image.height / 2)))
        components, _ = label(np.asarray(frame.getchannel('A')) >= 180)
        count = np.bincount(components.ravel())
        count[0] = 0
        frame.putalpha(Image.fromarray(((components == count.argmax()) * 255).astype(np.uint8)))
        yield frame.crop(frame.getbbox())

def pack(name, directory, width, height, max_height, max_width):
    frames = list(cells(name))
    scale = min(max_height / frames[0].height, max_width / max(frame.width for frame in frames))
    sheet = Image.new('RGBA', (width * 8, height))
    for index, frame in enumerate(frames):
        frame = frame.resize((round(frame.width * scale), round(frame.height * scale)), Image.Resampling.NEAREST)
        sheet.alpha_composite(frame, (width * index + (width - frame.width) // 2, height - frame.height - 1))
    sheet.save(ROOT / f'src/assets/{directory}/{name}.png', optimize=True)

for person in ('mashuo', 'mendu'):
    pack(f'{person}-bed', 'bed', 40, 60, 53, 38)
pack('lucky-jump', 'coordinated', 40, 40, 30, 36)
