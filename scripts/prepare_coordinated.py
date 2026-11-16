"""Pack new original poses and explicit foreground hand layers; retain base atlases."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageOps
import numpy as np
from scipy.ndimage import label
R=Path(__file__).resolve().parents[1];S=R/'art-source/coordinated';O=R/'src/assets/coordinated'
def cells(name,rows=4):
 im=Image.open(S/name).convert('RGBA');out=[]
 for y in range(rows):
  for x in range(4):
   c=im.crop((round(x*im.width/4),round(y*im.height/rows),round((x+1)*im.width/4),round((y+1)*im.height/rows)))
   a=np.array(c.getchannel('A'))>=150;components,count=label(a);sizes=np.bincount(components.ravel());sizes[0]=0
   main=components==sizes.argmax();c.putalpha(Image.fromarray((main*255).astype('uint8')));b=c.getchannel('A').getbbox();assert b;out.append(c.crop(b))
 return out
def fit(c,w,h,scale):
 scale=min(scale,(w-2)/c.width,(h-2)/c.height);c=c.resize((round(c.width*scale),round(c.height*scale)),Image.Resampling.NEAREST)
 out=Image.new('RGBA',(w,h));out.alpha_composite(c,((w-c.width)//2,h-1-c.height));return out
for role in ['mashuo','mendu']:
 poses=cells(role+'-actions.png');walk=cells(role+'-carry-walk.png');sheet=Image.new('RGBA',(320,240));arms=sheet.copy()
 scale=57/max(poses[i].height for i in [2,6,10,14]);walkscale=57/max(c.height for c in walk)
 for i,c in enumerate(poses+walk):
  if i<16 and i%4==2:c=walk[(i//4)*4]
  frame=fit(c,40,60,walkscale if i>=16 or i%4==2 else scale)
  if role=='mendu' and (20<=i<=23 or i==6):frame=ImageOps.mirror(frame)
  x=(i%8)*40;y=(i//8)*60;sheet.alpha_composite(frame,(x,y))
  row=(i%16)//4
  mask=Image.new('L',(40,60));d=ImageDraw.Draw(mask)
  # Forearms and palms are a distinct foreground; body/head never cover the pet.
  if i<16 and i%4==3:
   box=(1,49,15,59) if row in [0,1] else (25,49,39,59);d.rectangle(box,fill=255)
  elif i>=16 or i%4 in [1,2]:
   top=41 if i>=16 or i%4==2 else 31
   if row==0:d.rectangle((8,top,31,top+10),fill=255)
   elif row==1:d.rectangle((0,top,16,top+10),fill=255)
   elif row==2:d.rectangle((24,top,39,top+10),fill=255)
  foreground=frame.copy();alpha=foreground.getchannel('A');foreground.putalpha(Image.composite(alpha,Image.new('L',(40,60)),mask));arms.alpha_composite(foreground,(x,y))
 sheet.save(O/(role+'-pet.png'),optimize=True);arms.save(O/(role+'-arms.png'),optimize=True)
pet=cells('lucky-anatomy.png');held=cells('lucky-cradled.png',1);pet[:4]=held
# The generated side-facing bite poses are in opposite columns.
pet[5],pet[6]=pet[6],pet[5]
performance=cells('lucky-bed-performance.png');responses=cells('lucky-pet-response.png')
scales=[25/max(c.height for c in held)]*4+[31/max(pet[i].height for i in [14,15])]*12+[31/performance[3].height]*16+[31/max(c.height for c in responses[:4])]*16
frontsleep=cells('lucky-front-sleep.png',1);scales += [31/max(c.width for c in frontsleep)]*4
blink=cells('lucky-cradled-blink.png',1);scales += [25/max(c.height for c in blink)]*4
pet+=performance+responses+frontsleep+blink
sheet=Image.new('RGBA',(320,280))
for i,c in enumerate(pet):
 f=fit(c,40,40,scales[i])
 if 48<=i<52:
  raised=Image.new('RGBA',(40,40));raised.alpha_composite(f,(0,-9));f=raised
 sheet.alpha_composite(f,((i%8)*40,(i//8)*40))
sheet.save(O/'lucky-performance.png',optimize=True)
left=Image.open(R/'src/assets/bed/quilt-mashuo.png');right=Image.open(R/'src/assets/bed/quilt-mendu.png')
center=Image.new('RGBA',(32,62));center.paste(left.crop((35,0,51,62)),(0,0));center.paste(right.crop((0,0,16,62)),(16,0));center.save(O/'quilt-center.png',optimize=True)
# Split the kennel itself into back/frame, cushion, and an independent front rim.
bed=Image.open(R/'src/assets/lucky/bed.png').convert('RGBA');mask=Image.new('L',bed.size);ImageDraw.Draw(mask).ellipse((20,30,118,76),fill=255)
cushion=bed.copy();cushion.putalpha(Image.composite(bed.getchannel('A'),Image.new('L',bed.size),mask));cushion.save(O/'kennel-cushion.png',optimize=True)
back=bed.copy();back.putalpha(Image.composite(Image.new('L',bed.size),bed.getchannel('A'),mask));back.save(O/'kennel-back.png',optimize=True)
print('Packed 32 human poses + hand layers per person, 56 Lucky performance poses, quilt and kennel layers')
