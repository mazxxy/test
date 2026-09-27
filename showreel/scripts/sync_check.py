"""Verifies picture/sound sync: finds transient onsets in the audio muxed into the MP4 and
compares them with the timeline's cue times (and with the source WAV).

    python3 scripts/sync_check.py out/showreel.mp4
"""
import json
import subprocess
import sys
from pathlib import Path

import numpy as np
from scipy import signal
from scipy.io import wavfile

ROOT = Path(__file__).resolve().parent.parent
TL = json.loads((ROOT / "src" / "timeline.json").read_text())
SPB = 60 / TL["bpm"]
c = TL["cues"]
CUES = {
    "bounce 1": c["ballImpacts"][0], "bounce 2": c["ballImpacts"][1], "bounce 3": c["ballImpacts"][2],
    "bounce 4": c["ballImpacts"][3], "period": c["periodLand"], "drop": c["drop"], "slam": c["slam"],
    "burst": c["burst"], "liquid": c["liquid"], "wall": c["pullout"][0], "logo": c["logoHit"], "land": c["logoPeriod"],
}

def load(path):
    if path.suffix == ".mp4":
        wav = ROOT / "out" / "muxed-audio.wav"
        subprocess.run(["npx", "remotion", "ffmpeg", "-v", "error", "-i", str(path), "-vn", "-acodec", "pcm_s16le", "-y", str(wav)],
                       cwd=ROOT, check=True, stdin=subprocess.DEVNULL)
        path = wav
    sr, x = wavfile.read(path)
    return sr, x.astype(float).mean(axis=1) / 32768

def onsets(sr, x):
    # Energy flux in 5 ms hops: rises of short-term energy mark transients.
    hop = int(sr * 0.005)
    e = np.array([np.sum(x[i:i + hop] ** 2) for i in range(0, len(x) - hop, hop)])
    e = np.log10(e + 1e-9)
    flux = np.maximum(0, np.diff(e, prepend=e[0]))
    return flux, hop / sr

def nearest(flux, dt, t, win=0.06):
    a, b = int((t - win) / dt), int((t + win) / dt)
    k = a + int(np.argmax(flux[a:b]))
    return k * dt

video = Path(sys.argv[1]).resolve()
src = ROOT / "public" / "audio" / "soundtrack.wav"
fs, ff = onsets(*load(video))
ss, sf = onsets(*load(src))
worst = 0.0
print(f"{'cue':10} {'expected':>9} {'in mp4':>9} {'in wav':>9}  mp4-wav")
for name, beat in CUES.items():
    t = beat * SPB
    tm, tw = nearest(fs, ff, t), nearest(ss, sf, t)
    worst = max(worst, abs(tm - tw))
    print(f"{name:10} {t:9.3f} {tm:9.3f} {tw:9.3f}  {1000 * (tm - tw):+6.1f} ms")
print(f"worst mp4/wav offset: {1000 * worst:.1f} ms (one video frame = 16.7 ms)")
