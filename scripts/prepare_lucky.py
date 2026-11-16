"""Pack original Lucky pose sources, not the user's presentation board."""
from pathlib import Path
from PIL import Image
R=Path(__file__).resolve().parents[1];S=R/'art-source/lucky';O=R/'src/assets/lucky'
def crisp(im):
 im=im.convert('RGBA');im.putalpha(im.getchannel('A').point(lambda a:255 if a>=150 else 0));return im
def poses(name):
 im=Image.open(S/name).convert('RGBA');out=[]
 for y in range(4):
  for x in range(4):
   c=crisp(im.crop((round(x*im.width/4),round(y*im.height/4),round((x+1)*im.width/4),round((y+1)*im.height/4))))
   b=c.getchannel('A').getbbox();assert b;out.append(c.crop(b))
 return out
sheet=Image.new('RGBA',(320,240))
for group,name in enumerate(['walk-source.png','run-source.png','actions-source.png']):
 frames=poses(name);scale=31/max(c.height for c in frames[:8])
 for i,c in enumerate(frames):
  s=min(scale,38/c.width,36/c.height);c=c.resize((round(c.width*s),round(c.height*s)),Image.Resampling.NEAREST)
  index=group*16+i;sheet.alpha_composite(c,((index%8)*40+(40-c.width)//2,(index//8)*40+39-c.height))
sheet.save(O/'lucky.png',optimize=True);sheet.save(R/'public/lucky-review/lucky.png',optimize=True)
bed=crisp(Image.open(S/'bed-source.png'));bed=bed.crop(bed.getchannel('A').getbbox()).resize((138,90),Image.Resampling.NEAREST)
bed.save(O/'bed.png',optimize=True);bed.crop((0,60,138,90)).save(O/'bed-front.png',optimize=True)
print('Lucky: 48 transparent 40x40 frames; wicker bed 138x90 and foreground 138x30')
