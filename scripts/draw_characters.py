"""Original pixel-art stand-ins, drawn on a strict 32x48 RGBA grid.

The supplied character board is visual reference only. It has a painted background,
text and nonuniform figures, so no pixels are copied or cropped from it.
"""
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'src' / 'assets' / 'characters'
OUT.mkdir(parents=True, exist_ok=True)
W, H, COLS = 32, 48, 8
TRANSPARENT = (0, 0, 0, 0)

P = {
    'outline': '#292125', 'skin': '#f1b99a', 'skinlight': '#ffd9b8',
    'skinshade': '#d88f77', 'cheek': '#d47d79', 'eye': '#34272a',
    'hair': '#29252b', 'hairshade': '#43333a', 'hairlight': '#665057',
    'hairglint': '#8d6a65', 'cream': '#f5e9d2', 'creamshade': '#d7c7b2',
    'dress': '#684742', 'dresslight': '#8f6052', 'plaid': '#b88262',
    'plaidshade': '#513b3c', 'boot': '#292629', 'bootlight': '#514449',
    'hoodie': '#353239', 'hoodielight': '#59545d', 'hoodieshade': '#29282e',
    'jacket': '#443d43', 'zip': '#b5a7a0', 'trouser': '#38383b',
}


def frame(role, direction='down', phase=1, action='walk'):
    img = Image.new('RGBA', (W, H), TRANSPARENT)
    d = ImageDraw.Draw(img)
    def box(x0, y0, x1, y1, c): d.rectangle((x0, y0, x1, y1), fill=P.get(c, c))
    def line(points, c, width=1): d.line(points, fill=P.get(c, c), width=width)
    def dot(x, y, c): d.point((x, y), fill=P.get(c, c))
    bob = [0, -1, 0, -1][phase] if action == 'walk' else 0
    left_step = [2, 0, -2, 0][phase] if action == 'walk' else 0
    right_step = -left_step
    if action in ('sit', 'rise'):
        bob = 5 if action == 'sit' else 3
    if action in ('lie', 'sleep', 'wake'):
        # A genuinely horizontal silhouette rather than a standing frame.
        box(2, 26, 29, 40, 'outline')
        box(3, 27, 12, 38, 'hair')
        box(5, 29, 11, 36, 'skin')
        box(9, 30, 11, 32, 'skinlight')
        if action == 'wake': box(9, 31, 10, 31, 'eye')
        box(12, 29, 27, 38, 'dress' if role == 'mashuo' else 'hoodie')
        box(14, 30, 23, 32, 'plaid' if role == 'mashuo' else 'hoodielight')
        box(26, 31, 30, 38, 'boot')
        box(3, 40, 28, 41, 'hairshade')
        if action == 'sleep': box(8, 33, 9, 33, 'eye')
        return img
    # Feet anchor remains at the same bottom pixel for every frame.
    box(7 + left_step, 43, 14 + left_step, 46, 'outline')
    box(17 + right_step, 43, 24 + right_step, 46, 'outline')
    box(8 + left_step, 41, 13 + left_step, 45, 'boot')
    box(18 + right_step, 41, 23 + right_step, 45, 'boot')
    box(9 + left_step, 43, 12 + left_step, 44, 'bootlight')
    box(19 + right_step, 43, 22 + right_step, 44, 'bootlight')
    if action == 'sit':
        box(7, 37, 24, 44, 'outline')
        box(8, 38, 23, 41, 'dress' if role == 'mashuo' else 'trouser')
        box(10, 42, 15, 45, 'boot')
        box(18, 42, 24, 45, 'boot')
    # Long hair behind the shoulders; different crown shape for the two roles.
    if role == 'mashuo':
        box(5, 10+bob, 26, 33+bob, 'outline')
        box(6, 10+bob, 25, 31+bob, 'hair')
        box(6, 17+bob, 10, 33+bob, 'hairshade')
        box(22, 17+bob, 25, 34+bob, 'hairshade')
        line([(7, 20+bob), (7, 29+bob), (9, 32+bob)], 'hairlight')
        line([(24, 20+bob), (24, 31+bob), (22, 34+bob)], 'hairlight')
    # Torso, arms and fabric have three value levels.
    if role == 'mashuo':
        box(8, 25+bob, 23, 39+bob, 'outline')
        box(9, 26+bob, 22, 37+bob, 'dress')
        box(10, 27+bob, 21, 29+bob, 'dresslight')
        box(10, 31+bob, 21, 38+bob, 'dresslight')
        for xx in (12, 17, 21):
            line([(xx, 30+bob), (xx, 37+bob)], 'plaidshade')
        for yy in (32, 36):
            line([(10, yy+bob), (21, yy+bob)], 'plaid')
        box(13, 25+bob, 18, 28+bob, 'cream')
        box(14, 27+bob, 17, 29+bob, 'creamshade')
        dot(16, 32+bob, 'cream'); dot(16, 35+bob, 'cream')
        box(6, 27+bob, 9, 35+bob, 'outline'); box(7, 28+bob, 8, 34+bob, 'dress')
        box(22, 27+bob, 25, 35+bob, 'outline'); box(23, 28+bob, 24, 34+bob, 'dress')
    else:
        box(7, 24+bob, 24, 39+bob, 'outline')
        box(8, 25+bob, 23, 37+bob, 'hoodie')
        box(10, 26+bob, 21, 30+bob, 'hoodielight')
        box(11, 30+bob, 20, 36+bob, 'hoodie')
        box(15, 25+bob, 17, 36+bob, 'hoodieshade')
        line([(16, 27+bob), (16, 35+bob)], 'zip')
        box(10, 34+bob, 13, 36+bob, 'hoodieshade')
        box(19, 34+bob, 22, 36+bob, 'hoodieshade')
        box(6, 26+bob, 9, 36+bob, 'outline'); box(7, 27+bob, 8, 34+bob, 'hoodie')
        box(23, 26+bob, 26, 36+bob, 'outline'); box(24, 27+bob, 25, 34+bob, 'hoodie')
        box(10, 38+bob, 22, 41+bob, 'trouser')
    # Hands animate opposite to legs. Pose frames move the arms visibly.
    arm_swing = [-2, 1, 2, -1][phase] if action == 'walk' else 0
    box(6, 34+bob+arm_swing, 8, 37+bob+arm_swing, 'skin')
    box(24, 34+bob-arm_swing, 26, 37+bob-arm_swing, 'skin')
    if action in ('hand-start', 'hand', 'hand-end'):
        reach = 28 if action != 'hand-start' else 26
        box(24, 29+bob, reach, 32+bob, 'outline')
        box(25, 30+bob, reach, 31+bob, 'skin')
        if action == 'hand': dot(reach, 31+bob, 'skinlight')
    if action in ('hug-start', 'hug-a', 'hug-b'):
        reach = 28 if action != 'hug-start' else 26
        box(3, 28+bob, 8, 32+bob, 'outline'); box(4, 29+bob, 8, 31+bob, 'skin')
        box(23, 28+bob, reach, 32+bob, 'outline'); box(23, 29+bob, reach-1, 31+bob, 'skin')
        if action == 'hug-b': box(4, 27+bob, 7, 29+bob, 'skinlight')
    # Face and hair; redraw topmost locks and bangs.
    if role == 'mashuo':
        box(6, 4+bob, 25, 24+bob, 'outline')
        box(7, 5+bob, 24, 23+bob, 'hair')
        if direction != 'up':
            box(9, 13+bob, 22, 23+bob, 'skin')
            box(10, 14+bob, 21, 17+bob, 'skinlight')
            box(8, 9+bob, 24, 13+bob, 'hair')
            box(10, 12+bob, 15, 15+bob, 'hair')
            box(18, 12+bob, 23, 15+bob, 'hair')
            if direction == 'down':
                box(12, 19+bob, 13, 20+bob, 'eye'); box(19, 19+bob, 20, 20+bob, 'eye')
                dot(10, 21+bob, 'cheek'); dot(22, 21+bob, 'cheek')
                if action == 'talk-b': box(16, 22+bob, 17, 22+bob, 'eye')
            elif direction == 'left': box(10, 19+bob, 11, 20+bob, 'eye')
            else: box(20, 19+bob, 21, 20+bob, 'eye')
        else:
            line([(9, 12+bob), (11, 20+bob), (14, 25+bob)], 'hairshade', 2)
            line([(21, 11+bob), (22, 21+bob)], 'hairshade', 2)
        # Cream ribbon, taken as a temporary shape cue from the supplied board.
        box(20, 4+bob, 26, 7+bob, 'cream')
        box(23, 7+bob, 28, 10+bob, 'cream')
        box(21, 8+bob, 23, 10+bob, 'creamshade')
        for xx, yy in ((9,8), (12,6), (19,7), (23,12), (8,22), (24,25)):
            dot(xx, yy+bob, 'hairlight')
    else:
        # Irregular layered black hair and relaxed fringe.
        for x0,y0,x1,y1 in ((5,8,10,16),(7,4,14,16),(12,3,20,15),(18,5,26,17),(23,8,28,18),(4,13,8,22)):
            box(x0,y0+bob,x1,y1+bob,'outline')
        box(7, 7+bob, 25, 22+bob, 'hair')
        if direction != 'up':
            box(9, 14+bob, 23, 24+bob, 'skin')
            box(10, 15+bob, 22, 18+bob, 'skinlight')
            box(7, 8+bob, 24, 14+bob, 'hair')
            box(10, 12+bob, 16, 17+bob, 'hair')
            box(19, 11+bob, 24, 16+bob, 'hair')
            if direction == 'down':
                box(12, 20+bob, 13, 20+bob, 'eye'); box(20, 20+bob, 21, 20+bob, 'eye')
                dot(10, 22+bob, 'cheek'); dot(23, 22+bob, 'cheek')
                if action == 'talk-b': box(17, 23+bob, 18, 23+bob, 'eye')
            elif direction == 'left': dot(10, 20+bob, 'eye')
            else: dot(22, 20+bob, 'eye')
        else:
            box(10, 15+bob, 23, 22+bob, 'hairshade')
        for xx, yy in ((7,11),(11,5),(16,7),(23,9),(26,15),(9,19)):
            line([(xx, yy+bob), (xx+2, yy+bob-1)], 'hairlight')
        dot(15, 5+bob, 'hairglint'); dot(24, 13+bob, 'hairglint')
    return img


def build(role):
    sheet = Image.new('RGBA', (W * COLS, H * 4), TRANSPARENT)
    specs = []
    for direction in ('down', 'left', 'right', 'up'):
        for phase in range(4): specs.append((direction, phase, 'walk'))
    specials = [
        ('down',1,'sit'), ('down',1,'rise'), ('right',1,'hand-start'), ('right',1,'hand'),
        ('right',1,'hand-end'), ('left',1,'hug-start'), ('left',1,'hug-a'), ('left',1,'hug-b'),
        ('down',1,'lie'), ('down',1,'sleep'), ('down',1,'sleep'), ('down',1,'wake'),
        ('down',1,'talk-a'), ('down',1,'talk-b'), ('down',1,'walk'), ('up',1,'walk'),
    ]
    specs.extend(specials)
    for i,(direction,phase,action) in enumerate(specs):
        sprite = frame(role,direction,phase,action)
        sheet.alpha_composite(sprite, ((i % COLS) * W, (i // COLS) * H))
    path = OUT / f'{role}.png'
    sheet.save(path, optimize=True)
    return path

if __name__ == '__main__':
    for actor in ('mashuo','mendu'):
        print(build(actor))
