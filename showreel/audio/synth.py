"""Synthesizes the reel's soundtrack from scratch, locked to src/timeline.json.

Every instrument and effect is generated here (numpy/scipy, no samples), placed on the
same beat grid the picture uses, then mixed and mastered to public/audio/soundtrack.wav.

    python3 audio/synth.py            # writes the WAV and prints loudness
    python3 audio/synth.py --plot     # also writes out/soundtrack.png (spectrogram + cues)
"""

import json
import sys
from pathlib import Path

import numpy as np
from scipy import signal
from scipy.io import wavfile

ROOT = Path(__file__).resolve().parent.parent
TL = json.loads((ROOT / "src" / "timeline.json").read_text())
SR = 48000
BPM = TL["bpm"]
FPS = TL["fps"]
SPB = 60 / BPM  # seconds per beat
DUR = TL["beats"] * SPB
N = int(round(DUR * SR))
CUE = TL["cues"]
rng = np.random.default_rng(2026)


def sec(beat):
    return beat * SPB


def frame_s(frame):
    return frame / FPS


def fr(beat):
    """Beat -> frame, exactly as src/timeline.ts rounds it."""
    return int(round(beat * FPS * 60 / BPM))


# ----------------------------------------------------------------------------- DSP helpers

def t_axis(length):
    return np.arange(int(length * SR)) / SR


def env_exp(length, tau, attack=0.001):
    t = t_axis(length)
    a = np.clip(t / max(attack, 1e-6), 0, 1)
    return a * np.exp(-t / tau)


def butter(x, kind, freq, order=2):
    nyq = SR / 2
    if isinstance(freq, (list, tuple)):
        wn = [min(f / nyq, 0.999) for f in freq]
    else:
        wn = min(freq / nyq, 0.999)
    sos = signal.butter(order, wn, btype=kind, output="sos")
    return signal.sosfilt(sos, x)


def sweep_filter(x, f_start, f_end, kind="bandpass", q=1.2, blocks=64):
    """Time-varying filter: process in blocks with a geometric cutoff sweep (smooth enough for noise)."""
    out = np.zeros_like(x)
    n = len(x)
    edges = np.linspace(0, n, blocks + 1).astype(int)
    zi = None
    for b in range(blocks):
        a, e = edges[b], edges[b + 1]
        fc = f_start * (f_end / f_start) ** ((b + 0.5) / blocks)
        if kind == "bandpass":
            lo, hi = fc / (1 + 1 / (2 * q)), fc * (1 + 1 / (2 * q))
            sos = signal.butter(2, [lo / (SR / 2), min(hi / (SR / 2), 0.99)], btype="bandpass", output="sos")
        else:
            sos = signal.butter(2, min(fc / (SR / 2), 0.99), btype=kind, output="sos")
        if zi is None:
            zi = signal.sosfilt_zi(sos) * 0
        seg, zi = signal.sosfilt(sos, x[a:e], zi=zi)
        out[a:e] = seg
    return out


def noise(length):
    return rng.standard_normal(int(length * SR))


def pink(length):
    w = noise(length)
    b = [0.049922035, -0.095993537, 0.050612699, -0.004408786]
    a = [1, -2.494956002, 2.017265875, -0.522189400]
    return signal.lfilter(b, a, w) * 6


def saw(freq, length, detune_cents=0.0):
    t = t_axis(length)
    f = freq * 2 ** (detune_cents / 1200)
    ph = (t * f + rng.random()) % 1.0
    s = 2 * ph - 1
    return s


def sine_glide(f0, f1, length, curve=0.04):
    t = t_axis(length)
    f = f1 + (f0 - f1) * np.exp(-t / curve)
    return np.sin(2 * np.pi * np.cumsum(f) / SR)


def note(name):
    names = {"C": -9, "C#": -8, "D": -7, "D#": -6, "E": -5, "F": -4, "F#": -3, "G": -2, "G#": -1, "A": 0, "A#": 1, "B": 2}
    n, octv = name[:-1], int(name[-1])
    return 440.0 * 2 ** ((names[n] + 12 * (octv - 4)) / 12)


def biquad(x, kind, f0, gain_db=0.0, q=0.707):
    """RBJ cookbook peaking / high-shelf / low-shelf filters."""
    A = 10 ** (gain_db / 40)
    w = 2 * np.pi * f0 / SR
    cw, sw = np.cos(w), np.sin(w)
    alpha = sw / (2 * q)
    if kind == "peak":
        b = [1 + alpha * A, -2 * cw, 1 - alpha * A]
        a = [1 + alpha / A, -2 * cw, 1 - alpha / A]
    else:
        sq = 2 * np.sqrt(A) * alpha
        if kind == "highshelf":
            b = [A * ((A + 1) + (A - 1) * cw + sq), -2 * A * ((A - 1) + (A + 1) * cw), A * ((A + 1) + (A - 1) * cw - sq)]
            a = [(A + 1) - (A - 1) * cw + sq, 2 * ((A - 1) - (A + 1) * cw), (A + 1) - (A - 1) * cw - sq]
        else:  # lowshelf
            b = [A * ((A + 1) - (A - 1) * cw + sq), 2 * A * ((A - 1) - (A + 1) * cw), A * ((A + 1) - (A - 1) * cw - sq)]
            a = [(A + 1) + (A - 1) * cw + sq, -2 * ((A - 1) + (A + 1) * cw), (A + 1) + (A - 1) * cw - sq]
    return signal.lfilter(np.array(b) / a[0], np.array(a) / a[0], x)


def softclip(x, drive=1.0):
    return np.tanh(x * drive) / np.tanh(drive)


# ----------------------------------------------------------------------------- mixer

class Bus:
    def __init__(self):
        self.l = np.zeros(N + SR * 4)
        self.r = np.zeros(N + SR * 4)

    def add(self, x, at, gain=1.0, pan=0.0, width=0.0):
        """Place mono x at time `at` (s). pan -1..1 (constant power). width adds a Haas spread."""
        i = int(round(at * SR))
        if i >= len(self.l):
            return
        x = x * gain
        th = (pan + 1) * np.pi / 4
        gl, gr = np.cos(th), np.sin(th)
        n = min(len(x), len(self.l) - i)
        if i < 0:
            x = x[-i:]
            n = min(len(x), len(self.l))
            i = 0
        self.l[i : i + n] += gl * x[:n]
        if width > 0:
            d = int(width * SR)
            xr = np.concatenate([np.zeros(d), x])[:n]
            self.r[i : i + n] += gr * xr
        else:
            self.r[i : i + n] += gr * x[:n]

    def add_stereo(self, lr, at, gain=1.0):
        i = int(round(at * SR))
        l, r = lr
        n = min(len(l), len(self.l) - i)
        if n <= 0:
            return
        self.l[i : i + n] += gain * l[:n]
        self.r[i : i + n] += gain * r[:n]

    def stereo(self):
        return np.stack([self.l, self.r])


def reverb_ir(rt60, predelay=0.012, bright=6000, length=None):
    length = length or rt60 * 1.2
    t = t_axis(length)
    decay = np.exp(-6.9 * t / rt60)
    irs = []
    for _ in range(2):
        n = rng.standard_normal(len(t)) * decay
        n = butter(n, "lowpass", bright)
        n = np.concatenate([np.zeros(int(predelay * SR)), n])
        irs.append(n / np.sqrt(np.sum(n**2)))
    return irs


def convolve_bus(bus, ir):
    out = [signal.fftconvolve(ch, ir[k])[: len(ch)] for k, ch in enumerate(bus.stereo())]
    return np.stack(out)


def delay_pingpong(bus, time, feedback=0.35, taps=5, lp=3500):
    src = bus.stereo()
    out = np.zeros_like(src)
    d = int(time * SR)
    for k in range(1, taps + 1):
        g = feedback ** (k - 1)
        ch = k % 2
        shifted = np.zeros(src.shape[1])
        shifted[d * k :] = (src[0] + src[1])[: src.shape[1] - d * k] * 0.5
        out[ch] += g * shifted
    return np.stack([butter(out[0], "lowpass", lp), butter(out[1], "lowpass", lp)])


# ----------------------------------------------------------------------------- instruments

def kick(punch=1.0):
    L = 0.5
    t = t_axis(L)
    f = 46 + 130 * np.exp(-t / 0.026) * punch
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * env_exp(L, 0.26, 0.0015)
    click = butter(noise(L), "highpass", 2500) * env_exp(L, 0.003) * 0.35
    return softclip(body * 1.25 + click, 1.3)


def clap():
    L = 0.5
    x = np.zeros(int(L * SR))
    for k, dt in enumerate([0, 0.008, 0.017, 0.027]):
        burst = noise(L) * env_exp(L, 0.006 if k < 3 else 0.11)
        i = int(dt * SR)
        x[i:] += burst[: len(x) - i] * (0.8 if k < 3 else 1.0)
    return butter(x, "bandpass", [850, 2600]) * 0.9


def hat(open_=False):
    L = 0.35 if open_ else 0.08
    x = noise(L)
    x = butter(x, "highpass", 7000) + 0.4 * butter(x, "bandpass", [9000, 13000])
    return x * env_exp(L, 0.12 if open_ else 0.022, 0.0005) * 0.5


def bass_note(freq, length):
    t = t_axis(length)
    sub = np.sin(2 * np.pi * freq * t)
    grit = sum(np.sin(2 * np.pi * freq * h * t + h) / h for h in range(2, 9))
    grit = butter(grit, "lowpass", 520)
    a = np.clip(t / 0.004, 0, 1)
    rel = np.clip((length - t) / 0.03, 0, 1)
    env = a * (0.55 + 0.45 * np.exp(-t / 0.09)) * rel
    return softclip((sub * 0.9 + grit * 0.45) * env, 1.4)


CHORD_AM9 = ["A3", "C4", "E4", "G4", "B4"]
CHORD_FMAJ9 = ["F3", "A3", "C4", "E4", "G4"]
CHORD_G6 = ["G3", "B3", "D4", "E4", "A4"]


def stab(chord, length=0.45, bright=1.0):
    t = t_axis(length)
    x = np.zeros(len(t))
    for n in chord:
        for dc in (-8, 0, 8):
            x += saw(note(n), length, dc)
    x /= len(chord) * 3
    # Filter envelope, applied as a crossfade between a bright and a dark copy.
    brt = butter(x, "lowpass", 5200 * bright)
    drk = butter(x, "lowpass", 900)
    fe = np.exp(-t / 0.07)
    y = brt * fe + drk * (1 - fe)
    return y * env_exp(length, 0.2, 0.003) * 2.6


def pad(chord, length, cutoff=1400):
    t = t_axis(length)
    xl = np.zeros(len(t))
    xr = np.zeros(len(t))
    for n in chord:
        f = note(n)
        xl += saw(f, length, -9) + saw(f, length, 4)
        xr += saw(f, length, 9) + saw(f, length, -4)
    lfo = 0.5 + 0.5 * np.sin(2 * np.pi * 0.35 * t)
    xl = butter(xl, "lowpass", cutoff) * (0.85 + 0.15 * lfo)
    xr = butter(xr, "lowpass", cutoff) * (0.85 + 0.15 * (1 - lfo))
    k = 1 / (len(chord) * 2)
    return xl * k, xr * k


def marimba(freq, length=1.2, hard=1.0):
    t = t_axis(length)
    x = (
        np.sin(2 * np.pi * freq * t) * np.exp(-t / 0.42)
        + 0.32 * np.sin(2 * np.pi * freq * 3.93 * t) * np.exp(-t / 0.07)
        + 0.1 * np.sin(2 * np.pi * freq * 9.2 * t) * np.exp(-t / 0.025)
    )
    mallet = butter(noise(length), "lowpass", 2500) * env_exp(length, 0.004) * 0.25 * hard
    a = np.clip(t / 0.001, 0, 1)
    return (x * a + mallet) * 0.8


def sub_boom(length=1.4, f0=72, f1=40):
    t = t_axis(length)
    f = f1 + (f0 - f1) * np.exp(-t / 0.18)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * env_exp(length, 0.55, 0.002)
    thump = butter(noise(length), "lowpass", 160) * env_exp(length, 0.05) * 1.4
    return softclip(x * 1.2 + thump, 1.6)


def crash(length=2.2):
    l = butter(noise(length), "highpass", 3800) * env_exp(length, 0.55, 0.001)
    r = butter(noise(length), "highpass", 3800) * env_exp(length, 0.55, 0.001)
    shim = 0.3 * butter(noise(length), "bandpass", [6000, 9000]) * env_exp(length, 0.9)
    return l * 0.5 + shim, r * 0.5 + shim


def whoosh(length, f0, f1, shape="bell", q=1.6):
    x = pink(length)
    x = sweep_filter(x, f0, f1, "bandpass", q)
    t = np.linspace(0, 1, len(x))
    if shape == "bell":
        env = np.sin(np.pi * t) ** 1.6
    elif shape == "rise":  # swells into a hard stop
        env = t**3
    else:  # "fall"
        env = (1 - t) ** 2
    return x * env


def riser(length):
    x = whoosh(length, 400, 7000, "rise", q=2.2)
    t = np.linspace(0, 1, int(length * SR))
    f = 180 * (1400 / 180) ** (t**1.6)
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) * t**2 * 0.25
    return x + tone


def blip(freq, length=0.09, tau=0.012):
    t = t_axis(length)
    return np.sin(2 * np.pi * freq * t) * env_exp(length, tau, 0.0005) + butter(noise(length), "highpass", 3000) * env_exp(length, 0.0015) * 0.3


def bloop(f0, rise=2.6, length=0.22, tau=0.07):
    t = t_axis(length)
    f = f0 * (1 + (rise - 1) * (1 - np.exp(-t / 0.035)))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env_exp(length, tau, 0.002)


def clatter(bus, at, length, density, pan_spread=0.9, gain=0.2, lo=1800, hi=7000):
    """Many micro-clicks with a decaying rate: pins rattling, sparks crackling."""
    t = 0.0
    while t < length:
        rate = density * np.exp(-t / (length * 0.35))
        t += rng.exponential(1 / max(rate, 1e-3))
        if t >= length:
            break
        fc = rng.uniform(lo, hi)
        L = 0.012
        c = butter(noise(L), "bandpass", [fc * 0.8, fc * 1.25]) * env_exp(L, 0.0018)
        bus.add(c, at + t, gain * rng.uniform(0.4, 1.0) * np.exp(-t / length), pan=rng.uniform(-pan_spread, pan_spread))


# ----------------------------------------------------------------------------- arrangement

drums = Bus()
bass = Bus()
music = Bus()  # pads, stabs, marimba (reverb + delay sends)
fx = Bus()  # impacts, whooshes (reverb send)
ui = Bus()  # clicks, ticks (dry)
rev_send = Bus()
dly_send = Bus()

kick_times = []


def play_kick(beat, gain=1.0, punch=1.0):
    k = kick(punch)
    drums.add(k, sec(beat), gain)
    kick_times.append(sec(beat))


# --- Intro: the ball (b0-b6) -------------------------------------------------------------
ball_notes = ["A4", "C5", "E5", "G5"]
for i, b in enumerate(CUE["ballImpacts"]):
    m = marimba(note(ball_notes[i]))
    pan = -0.55 + i * 0.3
    music.add(m, sec(b), 0.5, pan)
    rev_send.add(m, sec(b), 0.25, pan)
    dly_send.add(m, sec(b), 0.18, pan)
    drums.add(kick(0.6), sec(b), 0.38)
    # the word rising into place just before the hit
    fx.add(whoosh(0.28, 900, 4200, "rise", q=2.5), sec(b) - 0.3, 0.1, pan)
# the period lands: tonic, a touch harder, and the jelly settle
music.add(marimba(note("A5"), hard=1.3), sec(CUE["periodLand"]), 0.5, 0.6)
music.add(marimba(note("E5")), sec(CUE["periodLand"]), 0.2, 0.6)
rev_send.add(marimba(note("A5")), sec(CUE["periodLand"]), 0.35, 0.6)
drums.add(kick(0.5), sec(CUE["periodLand"]), 0.3)

# pad swelling under the intro, filter opening into the drop
pl, pr = pad(CHORD_AM9, sec(6.2), cutoff=900)
fade = np.clip(np.linspace(0, 1, len(pl)) * 1.3, 0, 1) ** 2
music.add_stereo((pl * fade, pr * fade), 0, 0.16)
# HUD name typing on
for k in range(22):
    ui.add(blip(3200 + (k % 3) * 300, 0.03, 0.004), frame_s(3 + k * 1.2), 0.035, 0.6)
# riser + the suck-in through the period
z0, z1 = CUE["zoom"]
fx.add(riser(sec(6) - sec(4.6)), sec(4.6), 0.22)
fx.add(whoosh(sec(z1) - sec(z0), 300, 5200, "rise", q=1.2), sec(z0), 0.5, 0.0, width=0.012)

# --- Drop A (b6-b14): groove, morphs, 3D ------------------------------------------------
def chord_for(root):
    return {note("A1"): CHORD_AM9, note("F1"): CHORD_FMAJ9, note("G1"): CHORD_G6}[root]


def groove(b_from, b_to, clap_off=1, open_hat=False, bass_prog=None, chords=True):
    b = b_from
    while b < b_to - 1e-6:
        play_kick(b, 0.82)
        # House chord rhythm: syncopated, filtered, sitting behind the kick.
        if chords and bass_prog:
            for off in ((0.75,) if int(round(b - b_from)) % 2 == 0 else (0.5,)):
                ch = chord_for(bass_prog(b))
                s_ = stab(ch, 0.28, 0.55)
                music.add(s_, sec(b + off), 0.5, -0.15 if off == 0.75 else 0.15)
                dly_send.add(s_, sec(b + off), 0.06)
        if int(round(b - b_from)) % 2 == clap_off:
            c = clap()
            drums.add(c, sec(b), 0.5, 0.05)
            rev_send.add(c, sec(b), 0.22)
        drums.add(hat(open_hat), sec(b + 0.5), 0.3 if open_hat else 0.42, 0.25)
        drums.add(hat(), sec(b + 0.25), 0.12, -0.3)
        drums.add(hat(), sec(b + 0.75), 0.14, -0.2)
        if bass_prog:
            root = bass_prog(b)
            bass.add(bass_note(root, SPB * 0.45), sec(b + 0.5), 0.8)
        b += 1


def prog_a(b):
    rel = (b - 6) % 8
    return note("A1") if rel < 4 else note("F1") if rel < 6 else note("G1")


groove(6, 14, bass_prog=prog_a)


def pad_bed(b_from, b_to, progression, gain):
    """Quiet sustained chords under a groove, following the bass progression per beat."""
    b = b_from
    while b < b_to - 1e-6:
        ch = chord_for(progression(b))
        span = 1
        while b + span < b_to and chord_for(progression(b + span)) is ch:
            span += 1
        l_, r_ = pad(ch, sec(span) + 0.3, cutoff=1300)
        tt = np.linspace(0, 1, len(l_))
        e_ = np.clip(tt * 12, 0, 1) * np.clip((1 - tt) * 10, 0, 1)
        music.add_stereo((l_ * e_, r_ * e_), sec(b), gain)
        b += span


pad_bed(6, 14, prog_a, 0.14)
# drop hit
fx.add(sub_boom(), sec(CUE["drop"]), 0.55)
fx.add_stereo(crash(), sec(CUE["drop"]), 0.26)
s = stab(CHORD_AM9, 0.6, 1.2)
music.add(s, sec(CUE["drop"]), 0.42)
rev_send.add(s, sec(CUE["drop"]), 0.3)
# morph stabs: circle -> square -> triangle -> star, rising voicings
for b, ch in zip(CUE["morphs"], [CHORD_AM9, CHORD_FMAJ9, CHORD_G6]):
    s = stab(ch, 0.4)
    music.add(s, sec(b) - 0.01, 0.7, 0.0)
    dly_send.add(s, sec(b), 0.22)
    fx.add(whoosh(0.22, 1500, 6000, "fall", q=3), sec(b) - 0.03, 0.08, 0.3)
for b in CUE["wipes"]:
    fx.add(whoosh(0.35, 600, 3000, "fall", q=1.5), sec(b), 0.2, -0.2, width=0.01)
ui.add(blip(2400, 0.06, 0.008), sec(CUE["starSpin"]), 0.12)
music.add(stab(CHORD_AM9, 0.3, 1.4), sec(CUE["starSpin"]), 0.2, 0.4)

# 3D: extrusion swoop, the slam, the ripple, pulses, lift-off
fx.add(whoosh(sec(1.0), 250, 1800, "bell", q=1.2), sec(CUE["extrude"]) - 0.05, 0.4, -0.3, width=0.015)
fx.add(sub_boom(1.8, 90, 38), sec(CUE["slam"]), 1.0)
fx.add_stereo(crash(2.6), sec(CUE["slam"]), 0.32)
rev_send.add(sub_boom(0.6, 120, 40), sec(CUE["slam"]), 0.3)
clatter(fx, sec(CUE["slam"]) + 0.03, 0.9, 900, gain=0.22)
for p in CUE["pulses"]:
    clatter(fx, sec(p) + 0.02, 0.35, 380, gain=0.1)
    fx.add(sub_boom(0.4, 90, 45), sec(p), 0.18)
fx.add(whoosh(sec(14) - sec(CUE["liftoff"]), 300, 4500, "rise", q=1.4), sec(CUE["liftoff"]), 0.32, 0.2, width=0.01)

# --- Breakdown (b14-b20): particles, liquid ------------------------------------------------
fx.add(sub_boom(1.2, 110, 42), sec(CUE["burst"]), 0.6)
burst = butter(noise(1.2), "highpass", 1200) * env_exp(1.2, 0.18, 0.001)
fx.add(burst, sec(CUE["burst"]), 0.3, 0.0, width=0.014)
rev_send.add(burst, sec(CUE["burst"]), 0.3)
clatter(fx, sec(CUE["burst"]), 1.6, 1400, gain=0.13, lo=3500, hi=11000)
# the vortex: a long swirl, panned around the listener
vl = sec(CUE["condense"][0]) - sec(14.4)
v = whoosh(vl, 500, 2400, "bell", q=2.0)
pan_lfo = np.sin(np.linspace(0, 2 * np.pi * 1.5, len(v)))
fx.add_stereo((v * (0.5 - 0.5 * pan_lfo), v * (0.5 + 0.5 * pan_lfo)), sec(14.4), 0.5)
# condense: suck-in into the liquid
fx.add(whoosh(sec(CUE["liquid"]) - sec(CUE["condense"][0]), 200, 3800, "rise", q=1.3), sec(CUE["condense"][0]), 0.35)
# pad and held bass through the breakdown
pl, pr = pad(CHORD_FMAJ9, sec(6.4), cutoff=1100)
t = np.linspace(0, 1, len(pl))
fenv = np.clip(t * 6, 0, 1) * np.clip((1 - t) * 8, 0, 1)
music.add_stereo((pl * fenv, pr * fenv), sec(14), 0.2)
bass.add(bass_note(note("F1"), sec(3)) * np.linspace(1, 0.2, int(sec(3) * SR)), sec(14), 0.35)
bass.add(bass_note(note("G1"), sec(3)) * np.linspace(0.8, 0.5, int(sec(3) * SR)), sec(17), 0.3)
# sparse hats keep time
for b in np.arange(14.5, 20, 1.0):
    drums.add(hat(), sec(b), 0.18, 0.3)
# liquid: blooping on every beat of the choreography
fx.add(bloop(180, 3.2, 0.3, 0.09), sec(CUE["liquid"]), 0.45)
for k in range(6):  # six droplets split off, panned by where they fly
    ang = np.radians(k * 60 - 90)
    fx.add(bloop(300 + 45 * k, 2.4), sec(CUE["split"]) + 0.012 * k, 0.28, float(np.cos(ang)) * 0.8)
fx.add(whoosh(0.4, 700, 2200, "bell", q=2.5), sec(CUE["orbit"]) - 0.08, 0.14, -0.4, width=0.01)
squelch = butter(noise(0.25), "bandpass", [250, 900]) * env_exp(0.25, 0.06)
fx.add(squelch, sec(CUE["bounce"]), 0.25)
for k in range(6):
    fx.add(bloop(520 - 40 * k, 0.6, 0.18, 0.05), sec(CUE["merge"]) - 0.08 + 0.018 * k, 0.2, float(np.cos(np.radians(k * 60 - 90))) * 0.7)
fx.add(bloop(120, 2.0, 0.4, 0.14), sec(CUE["merge"]) + 0.05, 0.45)
# build into drop B: snare-roll of claps accelerating, and a riser
roll_t = sec(18.5)
while roll_t < sec(20) - 0.02:
    step = SPB / 4 if roll_t < sec(19.25) else SPB / 8
    prog_amt = (roll_t - sec(18.5)) / (sec(20) - sec(18.5))
    drums.add(clap(), roll_t, 0.1 + 0.3 * prog_amt, 0.1)
    roll_t += step
fx.add(riser(sec(20) - sec(18.2)), sec(18.2), 0.28)

# --- Drop B (b20-b24): the wall ---------------------------------------------------------
def prog_b(b):
    rel = (b - 20) % 4
    return note("A1") if rel < 2 else note("F1") if rel < 3 else note("G1")


groove(20, 24, open_hat=True, bass_prog=prog_b)
pad_bed(20, 24, prog_b, 0.14)
fx.add(sub_boom(), sec(20), 0.5)
fx.add_stereo(crash(), sec(20), 0.26)
s = stab(CHORD_AM9, 0.6, 1.2)
music.add(s, sec(20), 0.36)
rev_send.add(s, sec(20), 0.25)
p0, p1 = CUE["pullout"]
fx.add(whoosh(sec(p1) - sec(p0) + 0.3, 1200, 250, "bell", q=1.1), sec(p0), 0.45, 0.0, width=0.018)
# tiles popping in: one tick each, pitched by distance from the liquid tile
LIQ_C, LIQ_R = 1, 1
cells_at = fr(CUE["cellsIn"][0])
for i in range(12):
    c, r = i % 4, i // 4
    steps = abs(c - LIQ_C) + abs(r - LIQ_R)
    if steps == 0:
        continue
    at = frame_s(cells_at + steps * 5)
    ui.add(blip(1500 + 260 * steps + 40 * i, 0.07, 0.01), at, 0.17, (c - 1.5) / 2)
# the collapse: everything sucked into one point
c0, c1 = CUE["collapse"]
fx.add(whoosh(sec(c1) - sec(c0), 400, 6000, "rise", q=1.6), sec(c0), 0.45, 0.0, width=0.012)

# --- Outro (b24-b30): identity --------------------------------------------------------
hit = sec(CUE["logoHit"])
fx.add(sub_boom(2.2, 80, 40), hit, 0.7)
fx.add_stereo(crash(3.0), hit, 0.28)
s = stab(CHORD_AM9, 1.6, 1.0)
music.add(s, hit, 0.4)
rev_send.add(s, hit, 0.55)
pl, pr = pad(CHORD_AM9, DUR - hit + 0.5, cutoff=1800)
t = np.linspace(0, 1, len(pl))
penv = np.clip(t * 10, 0, 1) * (1 - t) ** 1.5
music.add_stereo((pl * penv, pr * penv), hit, 0.2)
ui.add(bloop(420, 1.8, 0.12, 0.03), hit - 0.02, 0.22)  # the ball pops out
# shimmer
for k, n in enumerate(["A6", "E7", "B6", "G6"]):
    tt = t_axis(2.6)
    sh = np.sin(2 * np.pi * note(n) * tt) * np.clip(tt / 0.25, 0, 1) * np.exp(-tt / 1.0)
    music.add(sh, hit + 0.05 * k, 0.03, [-0.6, 0.6, -0.2, 0.3][k])
    rev_send.add(sh, hit + 0.05 * k, 0.05)
# the period lands again: the intro motif resolves
land = sec(CUE["logoPeriod"])
music.add(marimba(note("A4"), 1.6, 1.2), land, 0.5, 0.35)
music.add(marimba(note("E5"), 1.6), land + 0.004, 0.25, 0.35)
rev_send.add(marimba(note("A4"), 1.6), land, 0.4, 0.35)
dly_send.add(marimba(note("E5"), 1.6), land, 0.2, 0.35)
drums.add(kick(0.5), land, 0.35)
fx.add(whoosh(0.5, 2000, 800, "fall", q=2), land, 0.08, 0.35)
# tagline words
tag = sec(CUE["tagline"])
fx.add(whoosh(0.3, 800, 3000, "bell", q=2), tag - 0.05, 0.1, -0.1)
fx.add(whoosh(0.3, 900, 3400, "bell", q=2), tag + frame_s(4) - 0.05, 0.1, 0.1)
# typewriter: a soft data chatter
type_start = fr(CUE["tagline"]) + 10
for k in range(0, 35, 3):
    ui.add(blip(2600 + 200 * (k % 2), 0.025, 0.003), frame_s(type_start + k / 1.2), 0.04, 0.1)
# heartbeat of the period
for n in (3, 4):
    at = land + n * SPB
    fx.add(sine_glide(130, 70, 0.3, 0.05) * env_exp(0.3, 0.08), at, 0.35, 0.35)
# HUD ticker ticks on every label change
for lab in TL["labels"][1:]:
    ui.add(blip(2800, 0.05, 0.006), sec(lab["at"]), 0.06, -0.7)

# ----------------------------------------------------------------------------- mix + master

# Sidechain: everything melodic ducks under the kick.
duck = np.ones(len(bass.l))
for kt in kick_times:
    i = int(kt * SR)
    L = int(0.32 * SR)
    seg = 1 - 0.75 * np.exp(-np.arange(L) / (0.09 * SR))
    j = min(i + L, len(duck))
    duck[i:j] = np.minimum(duck[i:j], seg[: j - i])
for bus, amt in ((bass, 1.0), (music, 0.4)):
    g = 1 - amt * (1 - duck)
    bus.l *= g
    bus.r *= g

hall = reverb_ir(2.2, 0.02, 5500)
room = reverb_ir(0.7, 0.008, 7000)
wet = convolve_bus(rev_send, hall) * 0.9 + convolve_bus(fx, room) * 0.18
dly = delay_pingpong(dly_send, SPB * 0.75, 0.38)

mix = (
    drums.stereo() * 0.95
    + bass.stereo() * 0.9
    + music.stereo() * 1.0
    + fx.stereo() * 0.85
    + ui.stereo() * 1.0
    + wet * 0.55
    + dly * 0.5
)
mix = mix[:, :N]
# Master EQ, from the long-term octave analysis: trim sub below the kick's fundamental,
# warm the thin 125-250 Hz region, pull back the hissy top octave.
def master_eq(ch):
    ch = butter(ch, "highpass", 34, order=4)
    ch = biquad(ch, "peak", 170, 2.5, 0.8)
    ch = biquad(ch, "peak", 520, -1.5, 1.0)
    ch = biquad(ch, "highshelf", 9000, -5.0)
    return ch


mix = np.stack([master_eq(ch) for ch in mix])

# glue: RMS compressor (block envelope follower), then a soft-clip limiter
# downsampled envelope follower for speed
def compress_fast(x, **kw):
    hop = 64
    pad_n = (-x.shape[1]) % hop
    xp = np.pad(x, ((0, 0), (0, pad_n)))
    blocks = xp.reshape(2, -1, hop)
    lvl = np.sqrt(np.mean(blocks**2, axis=(0, 2)) + 1e-12)
    att, rel = kw.get("att", 0.008), kw.get("rel", 0.16)
    a = np.exp(-hop / (att * SR))
    r = np.exp(-hop / (rel * SR))
    env = np.zeros_like(lvl)
    e = 0.0
    for i, v in enumerate(lvl):
        c = a if v > e else r
        e = c * e + (1 - c) * v
        env[i] = e
    db = 20 * np.log10(env + 1e-9)
    over = np.maximum(0, db - kw.get("thresh_db", -16))
    gain_db = -over * (1 - 1 / kw.get("ratio", 2.5))
    g = np.repeat(10 ** (gain_db / 20), hop)[: x.shape[1]]
    g = np.convolve(g, np.ones(128) / 128, mode="same")
    return x * g


mix = compress_fast(mix, thresh_db=-18, ratio=2.2)
try:
    import pyloudnorm as pyln

    meter = pyln.Meter(SR)
    lufs = meter.integrated_loudness(mix.T)
    mix *= 10 ** ((-13.5 - lufs) / 20)
except Exception as e:  # pragma: no cover
    print("loudness normalisation skipped:", e)
mix = softclip(mix, 1.15) * 0.93
peak = np.max(np.abs(mix))
if peak > 0.93:
    mix *= 0.93 / peak
# fade the very end so the last sample is silence
fl = int(0.25 * SR)
mix[:, -fl:] *= np.linspace(1, 0, fl) ** 2

out = ROOT / "public" / "audio" / "soundtrack.wav"
out.parent.mkdir(parents=True, exist_ok=True)
dither = (rng.random(mix.shape) - rng.random(mix.shape)) / 32768
pcm = np.clip((mix + dither) * 32767, -32768, 32767).astype(np.int16)
wavfile.write(out, SR, pcm.T)
try:
    import pyloudnorm as pyln

    final_lufs = pyln.Meter(SR).integrated_loudness(mix.T)
except Exception:
    final_lufs = float("nan")
print(f"wrote {out.relative_to(ROOT)}  {DUR:.2f}s  peak {20*np.log10(np.max(np.abs(mix))):.2f} dBFS  {final_lufs:.1f} LUFS")

if "--plot" in sys.argv:
    import matplotlib

    matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    fig, ax = plt.subplots(2, 1, figsize=(18, 8), sharex=True, gridspec_kw={"height_ratios": [1, 2]})
    mono = mix.mean(axis=0)
    tt = np.arange(len(mono)) / SR
    ax[0].plot(tt, mono, lw=0.3, color="#333")
    ax[0].set_ylim(-1, 1)
    f_, t_, S = signal.spectrogram(mono, SR, nperseg=2048, noverlap=1536)
    ax[1].pcolormesh(t_, f_, 10 * np.log10(S + 1e-12), shading="auto", cmap="magma", vmin=-110, vmax=-30)
    ax[1].set_yscale("symlog", linthresh=200)
    ax[1].set_ylim(30, 16000)
    for b in range(TL["beats"] + 1):
        for a in ax:
            a.axvline(sec(b), color="#00aaff" if b % 4 == 2 else "#888", lw=0.5, alpha=0.5)
    for name, (a_, b_) in TL["scenes"].items():
        ax[0].text(sec(a_) + 0.02, 0.85, name, fontsize=9)
    ax[1].set_xlabel("seconds (grey = beats)")
    plt.tight_layout()
    png = ROOT / "out" / "soundtrack.png"
    png.parent.mkdir(exist_ok=True)
    plt.savefig(png, dpi=80)
    print("wrote", png.relative_to(ROOT))
