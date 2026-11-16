"""Offline pack original bed/pose sources into exact RGBA game layers."""
from pathlib import Path
from PIL import Image
R=Path(__file__).resolve().parents[1]; S=R/'art-source/bed-v34'; O=R/'src/assets/bed';O.mkdir(exist_ok=True)
def crisp(im):
 im=im.convert('RGBA');im.putalpha(im.getchannel('A').point(lambda x:255 if x>=150 else 0));return im
src=Image.open(S/'bed-layers-candidate.png').convert('RGBA')
bed=crisp(src.crop((74,114,472,580)).resize((128,118),Image.Resampling.NEAREST))
# Independent frame, mattress, pillows, footboard. All share bed-local coordinates.
for name,box in {'frame':(0,0,128,118),'mattress':(13,35,115,99),'pillow-left':(15,12,62,36),'pillow-right':(65,12,112,36),'footboard':(0,98,128,118)}.items():
 layer=Image.new('RGBA',(128,118));layer.paste(bed.crop(box),box[:2]);
 if name=='frame':
  # Remove the entire inset: bedding is supplied by independent layers.
  layer.paste((0,0,0,0),(13,12,115,99))
 layer.save(O/(name+'.png'))
# Reuse the approved quilt's exact weave/pattern, with separate left/right panels.
room=Image.open(R/'src/assets/maps/home-detailed.png').convert('RGBA')
quilt=room.crop((43,78,150,132)).resize((102,62),Image.Resampling.NEAREST)
for role,box in [('mashuo',(0,0,51,62)),('mendu',(51,0,102,62))]:quilt.crop(box).save(O/('quilt-'+role+'.png'))
poses=Image.open(S/'sleep-poses-candidate.png').convert('RGBA')
for col,role in enumerate(['mashuo','mendu']):
 sheet=Image.new('RGBA',(160,60))
 for row in range(4):
  cell=crisp(poses.crop((col*512,row*384,(col+1)*512,(row+1)*384)))
  b=cell.getchannel('A').getbbox();assert b
  cell=cell.crop(b);scale=min(36/cell.width,56/cell.height)
  cell=cell.resize((round(cell.width*scale),round(cell.height*scale)),Image.Resampling.NEAREST)
  sheet.alpha_composite(cell,(row*40+(40-cell.width)//2,2))
 sheet.save(O/(role+'-sleep.png'))
print('Bed layers and two four-pose 40x60 sheets exported')
