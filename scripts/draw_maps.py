"""Draw original, deterministic pixel-map layers at the existing 16 px grid.

These are editable source sketches, not artwork cropped from reference games.
Collision footprints remain defined in src/game/maps.ts.
"""
from pathlib import Path
from random import Random
from PIL import Image, ImageChops, ImageDraw

OUT = Path(__file__).resolve().parents[1] / 'src' / 'assets' / 'maps'
OUT.mkdir(parents=True, exist_ok=True)
T = 16

def rgb(value):
    return tuple(bytes.fromhex(value.lstrip('#')))

class Art:
    def __init__(self, w, h, seed=12):
        self.image = Image.new('RGBA', (w, h), (0, 0, 0, 0))
        self.d = ImageDraw.Draw(self.image)
        self.r = Random(seed)
    def box(self, x, y, w, h, color):
        self.d.rectangle((round(x), round(y), round(x+w-1), round(y+h-1)), fill=color)
    def line(self, points, color, width=1): self.d.line(points, fill=color, width=width)
    def ellipse(self, box, color): self.d.ellipse(box, fill=color)
    def poly(self, points, color): self.d.polygon(points, fill=color)
    def save(self, filename): self.image.save(OUT / filename, optimize=True)

def framed_box(a, x, y, w, h, outline, face, highlight, shade=0):
    a.box(x, y, w, h, outline)
    a.box(x+2, y+2, w-4, h-4, face)
    a.line([(x+3,y+3),(x+w-4,y+3)], highlight)
    if shade: a.box(x+2, y+h-shade-2, w-4, shade, outline)

def flower(a, x, y, petal='#f5e6c9', leaf='#607c56', size=2):
    a.box(x, y+size, 1, size+3, leaf)
    for dx,dy in ((-size,0),(size,0),(0,-size),(0,size)):
        a.box(x+dx,y+dy,size,size,petal)
    a.box(x,y,2,2,'#e8b65e')

def rug(a,x,y,w,h):
    a.box(x+3,y+4,w,h,'#845d4b')
    a.box(x,y,w,h,'#e3c89c')
    a.box(x+3,y+3,w-6,h-6,'#f4dfb8')
    a.box(x+7,y+7,w-14,h-14,'#b79076')
    a.box(x+10,y+10,w-20,h-20,'#d7b294')
    a.box(x+13,y+13,w-26,h-26,'#ead2a9')
    for i in range(0,w-12,9):
        for yy in (y+5,y+h-7): a.box(x+8+i,yy,3,2,'#8d6754')
    for i in range(0,h-12,9):
        for xx in (x+5,x+w-7): a.box(xx,y+8+i,2,3,'#8d6754')
    for xx in (x+25,x+w-28):
        for yy in (y+20,y+h-23):
            a.box(xx-2,yy,5,5,'#b99473'); a.box(xx,yy-2,2,9,'#e5c69d')
    for i in range(0,w,4):
        a.box(x+i,y+h,2,2,'#e5cb9f')

def window(a,x,y,w=54,h=28,night=False):
    a.box(x+3,y+4,w,h,'#5c4032')
    a.box(x,y,w,h,'#92684a')
    a.box(x+3,y+3,w-6,h-6,'#ead1a4')
    a.box(x+6,y+6,w-12,h-12,'#8fc2b1' if not night else '#52627b')
    # Distant hills and garden beyond the panes.
    a.poly([(x+6,y+h-8),(x+18,y+12),(x+28,y+h-8)],'#659270' if not night else '#40566e')
    a.poly([(x+20,y+h-7),(x+35,y+14),(x+w-6,y+h-7)],'#7ea36d' if not night else '#4a6a6e')
    a.box(x+w//2-2,y+3,4,h-6,'#ead5ad')
    a.box(x+3,y+h//2, w-6,3,'#f9dfaf')
    a.box(x-4,y+h-2,w+8,4,'#7a5037')
    a.box(x-4,y+h-2,w+8,2,'#d4a372')
    # Curtain ties and irregular folds.
    for side in (0,1):
        sx=x-7 if side==0 else x+w-8
        a.poly([(sx,y-3),(sx+13,y-3),(sx+12,y+8),(sx+8,y+18),(sx+12,y+27),(sx+3,y+23),(sx+1,y+10)],'#f3dbb5')
        a.line([(sx+4,y),(sx+7,y+9),(sx+6,y+21)],'#c99575',2)
        a.box(sx+3,y+17,9,2,'#ae7759')

def plank_floor(a):
    a.box(0,0,480,384,'#674433')
    a.box(16,18,448,350,'#b47d51')
    board=['#b98655','#c28d59','#d09a64','#b98251','#c7925f','#bd8757']
    for row,y in enumerate(range(28,369,12)):
        a.box(16,y,448,12,board[row%len(board)])
        a.box(16,y,448,1,'#8b5c3f')
        a.box(16,y+1,448,1,'#deb079')
        seam=(row*37)%57
        for x in range(16+seam,464,58):
            a.box(x,y+2,1,10,'#986847')
            a.box(x+2,y+3,1,8,'#d9a46f')
        for _ in range(26):
            xx=a.r.randrange(19,460); yy=y+a.r.randrange(4,10)
            a.line([(xx,yy),(xx+a.r.randrange(2,12),yy)],a.r.choice(['#a7724b','#daaa72','#ad784f']))
    # Warm diamond-shaped sun patches are pixel stepped and semi-transparent.
    for yy in range(95,175,11):
        x=255+(yy-95)//4
        a.box(x,yy,44,6,'#ddb07b')
    a.box(0,0,480,25,'#76503a')
    for x in range(0,480,32):
        a.box(x,0,1,22,'#5b3b2f'); a.box(x+2,3,24,1,'#9b6547')
    a.box(0,20,480,4,'#392f2c')
    a.box(0,24,480,4,'#daaa79')
    for x in (0,464):
        a.box(x,0,16,384,'#674533')
        a.box(x+3,28,3,337,'#9a6748')
        a.box(x+10,28,2,337,'#4e352e')
    a.box(0,368,480,16,'#51392f')
    a.box(0,368,480,3,'#d5a170')
    for x in range(0,480,20):
        a.box(x,373,1,10,'#382f2c'); a.box(x+3,375,13,1,'#906447')

def indoor():
    a=Art(480,384,10); front=Art(480,384,11)
    plank_floor(a)
    window(a,69,7,63,31)
    window(a,293,7,58,31)
    rug(a,29,42,138,116)
    rug(a,172,185,145,122)
    rug(a,343,196,111,103)
    before_bed=a.image.copy()
    # Bed frame and soft textiles, 2,2 through 9,8.
    a.box(30,33,131,113,'#5c3b2f')
    a.box(33,36,126,105,'#906042')
    a.box(36,36,120,13,'#5f3e30')
    a.box(40,37,112,4,'#c08b58')
    for x in range(42,153,13):
        a.box(x,40,8,2,'#d2a06d')
        a.box(x+3,43,2,3,'#81543b')
    a.box(37,40,118,94,'#d8b181')
    a.box(40,43,112,89,'#f5dfb7')
    for x in (40,149):
        a.box(x,35,6,105,'#6e4634');a.box(x+1,39,3,95,'#c08a5b')
        a.box(x-2,33,9,5,'#4d342d')
        a.box(x-1,36,6,3,'#dfae76')
        for yy in range(46,132,15):a.box(x+2,yy,1,7,'#8d5c3e')
    for x in (43,96):
        a.box(x,46,49,28,'#b6a089')
        a.box(x+2,46,45,24,'#fff0d4')
        a.box(x+5,50,38,2,'#fff8e8')
        a.box(x+7,66,32,2,'#dfcbb0')
        a.box(x+3,49,2,16,'#f8e5cb')
        a.box(x+44,50,2,16,'#dfccb6')
        for ox,oy in ((14,55),(27,61)):
            a.box(x+ox,oy,5,4,'#d1ae91')
            a.box(x+ox+1,oy-1,3,5,'#e5bea2')
            a.box(x+ox+2,oy+1,1,2,'#c58276')
    a.box(42,78,108,52,'#788365')
    a.box(44,80,104,47,'#89986d')
    a.box(44,79,104,6,'#d8c5a7')
    a.box(47,82,98,3,'#f0ddbc')
    for yy in range(84,126,7):
        for xx in range(48,147,12):
            if (xx+yy)%3: a.box(xx,yy,5,2,'#a9ae82')
            else: a.box(xx+2,yy+2,3,3,'#677b60')
    for yy in range(89,126,12):
        a.line([(46,yy),(145,yy)],'#73855f')
        a.line([(46,yy+1),(145,yy+1)],'#a5ac80')
    for xx in range(49,145,12):
        a.line([(xx,86),(xx,125)],'#768761')
        a.line([(xx+1,86),(xx+1,125)],'#b0b48a')
    for x,y in ((57,97),(85,105),(117,94),(137,117)):
        a.box(x,y,5,4,'#e4d2ac')
        a.box(x+1,y-1,3,6,'#e8dcbb')
        a.box(x+2,y+1,1,2,'#bd8e71')
    a.box(43,126,106,4,'#667752')
    a.box(44,128,104,2,'#c8b58f')
    front.box(33,129,126,16,'#5e3e30')
    front.box(36,130,120,9,'#a6744d')
    front.box(38,132,116,2,'#d5a370')
    for x in range(43,151,18):front.box(x,135,10,1,'#704b36')
    for x in (38,148): front.box(x,139,7,6,'#4e342d')
    after_bed=a.image.copy()
    # Bookshelf 11,2, four tiles wide.
    a.box(174,34,67,52,'#60412f')
    a.box(179,38,57,45,'#af7950')
    for sy in (41,59):
        a.box(180,sy+14,55,4,'#6e4631');a.box(180,sy+14,55,2,'#d29c65')
        for i in range(9):
            xx=181+i*6; hh=a.r.choice((10,11,12,13))
            a.box(xx,sy+14-hh,4,hh,a.r.choice(('#6d806c','#b4795b','#d3aa68','#745a67','#dbc192')))
            a.box(xx+1,sy+16-hh,1,hh-2,'#e5c99d')
    a.box(179,82,58,5,'#5b3d30')
    a.box(230,47,5,6,'#e4c798')
    # Wardrobe 21,2: inset doors, woodgrain, handles, feet.
    a.box(334,35,114,68,'#4d362d')
    a.box(338,38,106,59,'#b47b4e')
    a.box(339,40,104,3,'#dfaa71')
    for x in (341,375,409):
        framed_box(a,x,44,31,45,'#70472f','#ba8453','#dda46e')
        for yy in (49,55,63,73,81): a.line([(x+5,yy),(x+25,yy)],'#a16f49')
        a.box(x+24,63,2,8,'#dfbe7e')
        a.box(x+24,64,1,5,'#fff1ad')
    a.box(341,91,98,7,'#805337')
    for x in (343,435): a.box(x,99,6,5,'#4f372e')
    a.box(421,39,18,3,'#cf9b6b')
    # Gallery and wall sconces.
    for x,y in ((251,37),(253,71)):
        framed_box(a,x,y,30,25,'#624232','#ba875b','#e3bb7f')
        a.poly([(x+5,y+17),(x+12,y+9),(x+17,y+15),(x+23,y+7),(x+25,y+18)],'#789171')
    for x,y in ((164,111),(415,113)):
        a.box(x,y,3,13,'#714a37');a.box(x-6,y+2,15,7,'#f3d07e');a.box(x-3,y-1,9,5,'#fff0ae')
        a.box(x-9,y+8,21,2,'#ae7c4d')
    # Sofa, 3,14 through 10,17. Front edge is its own depth layer.
    a.box(46,223,132,67,'#455d50')
    a.box(51,225,122,48,'#6e8a6c')
    a.box(55,231,52,35,'#90a286');a.box(111,231,56,35,'#899d81')
    a.box(56,232,50,3,'#adc0a0');a.box(111,233,54,3,'#a3b397')
    a.box(53,224,9,55,'#577562');a.box(165,224,11,55,'#526f60')
    for x,y,color in ((67,238,'#dbad83'),(139,239,'#f2dec0')):
        a.box(x,y+3,25,23,'#4e5f52'); a.box(x+2,y,21,22,color)
        for i in range(3): a.line([(x+3,y+5+i*5),(x+19,y+8+i*5)],'#a9836f')
    front.box(51,263,124,25,'#4c6656')
    front.box(54,263,118,15,'#6d896d')
    front.box(57,264,113,3,'#a1b797')
    for x in (57,165):front.box(x,282,9,9,'#644630')
    # Coffee table at 14,13; books and small vase.
    a.box(223,212,49,29,'#533c32');a.box(225,210,45,24,'#9a6847')
    a.box(228,212,39,18,'#c3925d')
    for x in (226,264):a.box(x,233,5,11,'#694831')
    a.box(232,216,17,9,'#ede1c8');a.box(234,214,13,3,'#788968')
    a.box(255,213,7,8,'#f5debf');flower(a,258,210,'#e7a7a2',size=2)
    # Desk 22,13, six by five, plus chair and personal items.
    a.box(351,210,98,80,'#594031')
    a.box(354,213,91,24,'#9d6945')
    a.box(356,213,88,17,'#c18c59')
    for xx in (358,440):a.box(xx,231,8,51,'#75492f')
    a.box(366,219,29,12,'#fff0d1')
    a.line([(371,224),(389,224)],'#aa8f6c')
    a.box(397,216,17,9,'#6f7a70');a.box(399,213,15,4,'#dfb98a')
    a.box(420,215,12,15,'#76533c');a.box(423,216,7,9,'#dbc399')
    a.box(434,208,3,15,'#694f3b');a.box(429,206,11,5,'#f9d797')
    a.box(430,207,8,2,'#fff0b5')
    for x in (366,421):
        a.box(x,245,15,13,'#825534');a.box(x+2,247,11,9,'#a77549');a.box(x+7,251,2,3,'#f6d39d')
    a.box(390,263,24,14,'#704c36');a.box(392,265,20,10,'#a4774d')
    a.box(395,278,14,11,'#64412f')
    # Houseplants, lanterns and small lived-in details.
    for x,y in ((352,320),(21,301)):
        a.ellipse((x-8,y+13,x+12,y+18),'#6d5843')
        a.box(x-5,y+4,14,14,'#9b7150')
        a.box(x-7,y+2,18,4,'#dfae78')
        for dx,dy in ((-10,-9),(-5,-17),(2,-20),(8,-13),(12,-7),(-1,-10)):
            a.ellipse((x+dx,y+dy,x+dx+8,y+dy+10),'#587a57')
            a.box(x+dx+2,y+dy+2,3,3,'#a2bc75')
    for x,y in ((48,334),(428,329)):
        a.box(x,y,8,23,'#6f513a');a.box(x-4,y+5,16,13,'#f6cc7a')
        a.box(x-2,y+6,12,9,'#ffe5a0');a.box(x-3,y+3,14,2,'#7d6044')
    a.box(210,367,62,17,'#4a3029')
    a.box(218,367,46,14,'#a5754c')
    a.box(229,371,24,13,'#593d2e')
    a.box(221,376,40,2,'#d3a171')
    a.save('home.png'); front.save('home-front.png')
    # Art-review sample: the bed becomes a separately replaceable transparent PNG.
    bed_box=(30,33,161,146)
    bed_before=before_bed.crop(bed_box)
    bed_after=after_bed.crop(bed_box)
    changed=ImageChops.difference(bed_before,bed_after).convert('RGB').convert('L').point(lambda value:255 if value else 0)
    bed_after.putalpha(changed)
    bed_after.save(OUT/'home-bed-sample.png',optimize=True)
    base=a.image.copy()
    base.paste(bed_before,bed_box[:2])
    base.save(OUT/'home-base-sample.png',optimize=True)
    bed_front_box=(33,129,159,145)
    front.image.crop(bed_front_box).save(OUT/'home-bed-front-sample.png',optimize=True)
    other_front=front.image.copy()
    other_front.paste((0,0,0,0),bed_front_box)
    other_front.save(OUT/'home-other-front-sample.png',optimize=True)

SEASONS={
    'spring': {'grass':('#76955e','#89a46d','#688653'), 'leaf':('#6d9563','#92ad72','#537b55'), 'flower':('#f3b7b5','#fff0ce','#d7a7c4')},
    'summer': {'grass':('#638953','#749c5d','#567b4e'), 'leaf':('#4f8051','#77a369','#426d48'), 'flower':('#eaca82','#f6d3a6','#ed9d8d')},
    'autumn': {'grass':('#8d955d','#a4a16a','#7b8151'), 'leaf':('#ac7648','#d69a55','#8f6244'), 'flower':('#efc681','#e4aa79','#d49375')},
    'winter': {'grass':('#a0ada2','#b5bbb0','#8e9e94'), 'leaf':('#879889','#aeb6a1','#72867c'), 'flower':('#e8e8d9','#f6eddd','#d0d5d2')},
}

def yard(season,p):
    a=Art(704,544,33); tree_front=Art(704,544,33); bench_front=Art(704,544,33)
    grass=p['grass']; leaves=p['leaf']; petals=p['flower']
    a.box(0,0,704,544,grass[0])
    for ty in range(34):
        for tx in range(44):
            r=a.r.randrange(7)
            if r<3:a.box(tx*T,ty*T,16,16,grass[r])
            for _ in range(3):
                xx=tx*T+a.r.randrange(2,15); yy=ty*T+a.r.randrange(2,15)
                a.box(xx,yy,2,1,a.r.choice(('#b3bd81','#5d8050',grass[1])))
                if a.r.randrange(55)==0:flower(a,xx,yy,a.r.choice(petals),size=1)
    # Winding cobblestone route leaves the collision map untouched.
    for ty in range(14,33):
        for tx in range(20,25):
            xx=tx*T;yy=ty*T
            a.box(xx,yy,16,16,a.r.choice(('#bcb397','#cfc29f','#d9caa6')))
            for i in range(4):
                sx=xx+a.r.randrange(2,14);sy=yy+a.r.randrange(2,14)
                a.box(sx,sy,a.r.randrange(2,6),a.r.randrange(1,3),a.r.choice(('#a69b84','#e8dbb8','#b2a489')))
    for tx in range(14,31):
        for ty in range(22,25):
            if (tx+ty)%3==0:continue
            xx=tx*T;yy=ty*T
            a.box(xx+1,yy+3,14,10,a.r.choice(('#c7bc9c','#d2c4a4','#bdb296')))
            a.box(xx+4,yy+5,3,2,'#aa9f85')
    for i in range(130):
        xx=a.r.randrange(48,660);yy=a.r.randrange(218,510)
        if 19*T<xx<26*T or (xx<175 and yy>260) or (xx>490 and yy>350):continue
        if i%4==0:flower(a,xx,yy,a.r.choice(petals),size=1)
        else:
            a.box(xx,yy,2,1,'#536c4d');a.box(xx+4,yy+2,2,1,'#bed089')
    # Fence posts, rails, knots and shadows; south gate is open.
    for tx in range(2,42):
        for ty in (10,32):
            if ty==32 and 20<=tx<=24:continue
            x=tx*T;y=ty*T
            a.box(x,y+5,16,10,'#5d4737');a.box(x,y+3,16,7,'#ae805a')
            a.box(x,y+4,16,2,'#d3a475');a.box(x+2,y+10,12,1,'#76523b')
            if tx%2==0:
                a.box(x+3,y-5,10,22,'#654734')
                a.box(x+4,y-7,8,17,'#bd9167')
                a.box(x+5,y-6,6,2,'#e3ba80')
                a.box(x+8,y+2,1,6,'#8d6245')
    for ty in range(10,33):
        for tx in (2,41):
            x=tx*T;y=ty*T
            a.box(x,y+2,16,12,'#9d7150');a.box(x+3,y-4,10,20,'#b98d62')
            a.box(x+4,y-4,8,2,'#e1b37a')
    for x in (19*T,25*T):
        a.box(x+3,31*T-7,10,41,'#543d2e');a.box(x+5,31*T-7,6,38,'#b88d62')
        a.box(x+2,31*T-8,12,3,'#dcb078')
    a.box(20*T,32*T+8,5*T,5,'#e3ca92')
    # House shadow and masonry, roof shingles, trim and doorstep.
    a.box(12*T+7,13*T,21*T,13,'#58754e')
    a.box(12*T,5*T,21*T,9*T,'#694b3a')
    a.box(13*T,6*T,19*T,7*T,'#e5c99a')
    for yy in range(6*T,13*T,14):
        a.box(13*T,yy,19*T,1,'#d1ae82')
        for xx in range(13*T+(yy%27),32*T,34):
            a.box(xx,yy+2,2,10,'#cba47a')
    a.box(11*T,4*T,23*T,4*T,'#5c3e36')
    for row,yy in enumerate(range(2*T,8*T,12)):
        inset=max(0,3-row)*8
        a.box(12*T+inset,yy,21*T-inset*2,13,a.r.choice(('#8e5948','#9c6551','#a77659')))
        a.box(12*T+inset,yy+10,21*T-inset*2,2,'#623e37')
        for xx in range(12*T+inset+(row%2)*13,33*T-inset,26):
            a.box(xx,yy+3,1,7,'#6b443b')
            a.box(xx+2,yy+3,20,1,'#c28a66')
    a.box(14*T,1*T+12,17*T,8,'#b47d5b')
    a.box(12*T,7*T,21*T,6,'#644534')
    a.box(13*T,7*T+5,19*T,2,'#dcac77')
    for x in (15*T,27*T):
        framed_box(a,x,8*T,4*T,4*T,'#624534','#d9b180','#f1d29b')
        a.box(x+6,8*T+7,4*T-12,4*T-14,'#a9bdad')
        a.poly([(x+6,11*T-8),(x+24,9*T+13),(x+42,11*T-8)],'#6f9b76')
        a.box(x+2*T-2,8*T+5,4,4*T-10,'#f4dfb4')
        a.box(x+5,10*T-1,4*T-10,3,'#f1d8a9')
        a.box(x-5,12*T-5,4*T+10,6,'#9b6945')
        a.box(x-5,12*T-5,4*T+10,2,'#e3b47d')
        a.box(x-4,8*T+2,10,4*T-1,'#f0d2a6')
        a.box(x+4*T-5,8*T+2,9,4*T-1,'#f0d2a6')
    a.box(21*T,10*T,3*T,4*T,'#513a30')
    a.box(21*T+5,10*T+4,3*T-10,4*T-4,'#9d6846')
    for yy in range(10*T+10,14*T,7):a.box(21*T+7,yy,3*T-15,1,'#bd8456')
    a.box(23*T+2,12*T+2,3,4,'#f5d186')
    a.box(20*T,14*T,5*T,7,'#6e513d')
    a.box(20*T+4,14*T+1,5*T-8,3,'#d8ad75')
    for xx in range(20*T+8,25*T-4,12):a.box(xx,14*T+4,9,4,'#aa7954')
    for x in (14*T-6,31*T+4):
        a.box(x,10*T,12,3*T,'#8e684d')
        a.box(x+3,10*T,3,3*T,'#c79b70')
    # Memorial tree: trunk in base, canopy in depth-sorted front layer.
    tx,ty=7*T,17*T
    a.ellipse((tx+7,ty+60,tx+70,ty+86),'#5e7650')
    a.box(tx+34,ty+39,16,58,'#523d2f')
    a.box(tx+39,ty+41,8,50,'#a4744b')
    a.box(tx+42,ty+45,2,33,'#d6a16a')
    a.line([(tx+36,ty+58),(tx+18,ty+45)],'#68482e',6)
    a.line([(tx+47,ty+55),(tx+65,ty+40)],'#68482e',6)
    for ox,oy,r in ((6,12,30),(30,0,34),(52,14,28),(18,31,29),(47,33,26)):
        tree_front.ellipse((tx+ox,ty+oy,tx+ox+r*2,ty+oy+r*2),leaves[2])
        tree_front.ellipse((tx+ox+3,ty+oy+2,tx+ox+r*2-4,ty+oy+r*2-8),leaves[0])
        tree_front.ellipse((tx+ox+10,ty+oy+6,tx+ox+r*2-13,ty+oy+r),leaves[1])
    for _ in range(90):
        x=tx+a.r.randrange(14,95); y=ty+a.r.randrange(7,68)
        if tree_front.image.getpixel((x,y))[3]>0:
            tree_front.box(x,y,a.r.choice((2,3,4)),2,a.r.choice((leaves[0],leaves[1],'#d3bc72')))
    # Long bench and layered wooden slats, at 31,22.
    bx,by=31*T,22*T
    a.box(bx-2,by+3,6*T+4,43,'#504034')
    a.box(bx,by+1,6*T,16,'#926541')
    for yy in (by+3,by+8,by+13):
        a.box(bx+5,yy,6*T-10,3,'#c79861')
        a.box(bx+5,yy+3,6*T-10,1,'#68452f')
    a.box(bx+5,by+20,6*T-10,16,'#b78754')
    a.box(bx+5,by+21,6*T-10,3,'#dfad73')
    for x in (bx+10,bx+6*T-19):a.box(x,by+32,7,21,'#694a34')
    bench_front.box(bx+2,by+34,6*T-4,7,'#644733')
    bench_front.box(bx+5,by+34,6*T-10,3,'#d3a06a')
    # Raised flower beds; flower colors change with seasons.
    for fx,fy in ((5,25),(34,16)):
        xx=fx*T;yy=fy*T
        a.box(xx,yy,5*T,3*T,'#70533f')
        a.box(xx+3,yy+3,5*T-6,3*T-6,'#536d48')
        a.box(xx+1,yy+1,5*T-2,4,'#bd9160')
        a.box(xx+1,yy+3*T-5,5*T-2,4,'#a77d53')
        for i in range(19):
            px=xx+8+(i%5)*14+a.r.randrange(4)
            py=yy+8+(i//5)*10+a.r.randrange(3)
            flower(a,px,py,a.r.choice(petals),a.r.choice(leaves),2)
    # Lanterns, little field stones and leaf litter.
    for lx,ly in ((18,20),(27,20)):
        x=lx*T+7;y=ly*T
        a.box(x,y,5,35,'#584739')
        a.box(x-6,y-6,17,16,'#504438')
        a.box(x-3,y-4,11,12,'#f6cf7c')
        a.box(x,y-3,5,8,'#fff2ad')
        a.box(x-8,y-8,21,3,'#9b8056')
    for i in range(70):
        xx=a.r.randrange(48,672);yy=a.r.randrange(231,510)
        if 20*T<xx<25*T or (xx<183 and yy>285) or (xx>485 and yy>350):continue
        a.ellipse((xx,yy,xx+a.r.randrange(2,6),yy+2),a.r.choice(('#ad9b79','#d3be8e',grass[2])))
    a.save(f'yard-{season}.png')
    tree_front.save(f'yard-{season}-tree-front.png')
    bench_front.save(f'yard-{season}-bench-front.png')

if __name__=='__main__':
    indoor()
    for season,palette in SEASONS.items():yard(season,palette)
    print('Generated indoor and four seasonal yard layers in',OUT)
