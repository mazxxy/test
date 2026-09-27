"""Builds contact-sheet.png: one hero frame per skill, labelled like the reel's HUD.

    python3 scripts/contact_sheet.py out/showreel.mp4
"""
import subprocess
import sys
from pathlib import Path

from fontTools.ttLib import TTFont
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
video = Path(sys.argv[1]).resolve()
tmp = ROOT / "out" / "sheet"
tmp.mkdir(parents=True, exist_ok=True)

SHOTS = [
    (60, "01", "SQUASH & STRETCH"),
    (165, "02", "KINETIC TYPE"),
    (292, "03", "SHAPE MORPHING"),
    (372, "04", "3D & LIGHTING"),
    (474, "05", "PARTICLE SIM"),
    (566, "06", "LIQUID FX"),
    (680, "07", "SYSTEMS & LOOPS"),
    (860, "08", "IDENTITY"),
]
INK, PAPER, DIM, ORANGE = (13, 13, 16), (242, 238, 230), (130, 127, 120), (255, 90, 31)

# PIL cannot read woff2: convert the reel's mono face once.
ttf = tmp / "JetBrainsMono.ttf"
if not ttf.exists():
    f = TTFont(ROOT / "public" / "fonts" / "JetBrainsMono.woff2")
    f.flavor = None
    f.save(ttf)
bold = ImageFont.truetype(str(ttf), 22)
bold.set_variation_by_axes([800])
reg = ImageFont.truetype(str(ttf), 22)
reg.set_variation_by_axes([400])
small = ImageFont.truetype(str(ttf), 18)
small.set_variation_by_axes([400])

W, H, COLS, PAD, GAP, LABEL = 600, 338, 4, 56, 28, 54
rows = (len(SHOTS) + COLS - 1) // COLS
sheet = Image.new("RGB", (PAD * 2 + COLS * W + (COLS - 1) * GAP, PAD * 2 + 70 + rows * (H + LABEL) + (rows - 1) * GAP), INK)
d = ImageDraw.Draw(sheet)
d.text((PAD, PAD - 6), "CLAUDE", font=bold, fill=PAPER)
d.text((PAD + 104, PAD - 6), "MOTION DESIGN REEL  ·  15 s  ·  1920×1080  ·  60 fps", font=reg, fill=DIM)
d.rectangle([sheet.width - PAD - 14, PAD - 2, sheet.width - PAD, PAD + 12], fill=ORANGE)

for i, (frame, idx, label) in enumerate(SHOTS):
    png = tmp / f"f{frame:03d}.png"
    t = max(0.0, (frame - 0.25) / 60)
    subprocess.run(
        ["npx", "remotion", "ffmpeg", "-v", "error", "-ss", f"{t}", "-i", str(video), "-frames:v", "1", "-update", "1", "-y", str(png)],
        cwd=ROOT,
        check=True,
        stdin=subprocess.DEVNULL,
    )
    im = Image.open(png).convert("RGB").resize((W, H), Image.LANCZOS)
    c, r = i % COLS, i // COLS
    x = PAD + c * (W + GAP)
    y = PAD + 70 + r * (H + LABEL + GAP)
    sheet.paste(im, (x, y))
    d.text((x, y + H + 16), idx, font=bold, fill=PAPER)
    d.text((x + 36, y + H + 16), f"/ 08  {label}", font=reg, fill=DIM)
    tc = f"00:00:{frame // 60:02d}:{frame % 60:02d}"
    tw = d.textlength(tc, font=small)
    d.text((x + W - tw, y + H + 19), tc, font=small, fill=DIM)

out = ROOT / "contact-sheet.png"
sheet.save(out, optimize=True)
print(out.relative_to(ROOT), sheet.size)
