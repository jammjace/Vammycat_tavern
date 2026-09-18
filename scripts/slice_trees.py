"""Extract the supplied four-tree sheet, preserving its painted pixels."""
import sys
from pathlib import Path
from PIL import Image
source = Image.open(sys.argv[1]).convert('RGBA')
# Slight counter-rotations bring each trunk/crown axis upright.
for i, (box, angle) in enumerate([((40,20,565,580),-9),((585,85,1240,590),-5),((90,590,550,1200),-3),((590,610,1160,1200),-5)],1):
    im = source.crop(box)
    pixels = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r,g,b,a = pixels[x,y]
            # The near-black sheet is well separated from the brown outlines.
            alpha = round(255 * max(0,min(1,(max(r,g,b)-22)/18)))
            pixels[x,y] = (r,g,b,alpha)
    im = im.rotate(angle,Image.Resampling.BICUBIC,expand=True)
    im = im.crop(im.getbbox())
    out = Path('public/assets/scenery') / f'tree-{i}.png'
    im.save(out)
    print(out,im.size)
