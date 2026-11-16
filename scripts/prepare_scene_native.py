"""Keep the original room detail; crops map to the unchanged world coordinates."""
from pathlib import Path
from PIL import Image
R=Path(__file__).resolve().parents[1];O=R/'src/assets/maps'
im=Image.open(R/'art-source/indoor-generated-source.png').convert('RGBA')
im.save(O/'home-native.png',optimize=True)
for name,box in {'sofa':(41,257,178,299)}.items():
 x,y,r,b=box
 native=(round(x*im.width/480),round(y*im.height/384),round(r*im.width/480),round(b*im.height/384))
 im.crop(native).save(O/f'home-native-{name}.png',optimize=True)
print('room',im.size,'kept at native density; sofa crop exported')
yard=Image.open(R/'art-source/yard-native/autumn-source.png').convert('RGBA')
yard.save(O/'yard-autumn-native.png',optimize=True)
mask=Image.open(O/'yard-autumn-bench-front.png').getchannel('A').resize(yard.size,Image.Resampling.NEAREST)
front=yard.copy();front.putalpha(mask)
front.crop(mask.getbbox()).save(O/'yard-autumn-native-bench.png',optimize=True)
leaf=Image.open(R/'art-source/yard-native/autumn-canopy-source.png').convert('RGBA')
leaf.putalpha(leaf.getchannel('A').point(lambda a:255 if a>=128 else 0))
leaf=leaf.crop(leaf.getchannel('A').getbbox()).resize((309,270),Image.Resampling.NEAREST)
leaf.save(O/'yard-autumn-native-tree.png',optimize=True)
print('yard',yard.size,'canopy',leaf.size)
