"""Tiles frames into a labelled contact sheet: sheet.py out.png f1.png f2.png ..."""
import sys, os, math
from PIL import Image, ImageDraw

out, files = sys.argv[1], sys.argv[2:]
cols = 3 if len(files) > 4 else 2
w, h = 640, 360
rows = math.ceil(len(files) / cols)
sheet = Image.new("RGB", (cols * w + (cols + 1) * 8, rows * (h + 22) + 8), (40, 40, 40))
d = ImageDraw.Draw(sheet)
for i, fp in enumerate(files):
    im = Image.open(fp).convert("RGB").resize((w, h), Image.LANCZOS)
    x = 8 + (i % cols) * (w + 8)
    y = 8 + (i // cols) * (h + 22)
    sheet.paste(im, (x, y + 18))
    d.text((x, y + 2), os.path.basename(fp), fill=(230, 230, 230))
sheet.save(out)
print("\n" + out)
