#!/usr/bin/env bash
# Muxes the soundtrack onto the rendered picture. Encoding the AAC here (instead of inside
# the Remotion render) gets an edit list that skips the encoder's priming samples; without
# it the audio plays ~43 ms late, which scripts/sync_check.py catches.
set -euo pipefail
root=$(cd "$(dirname "$0")/.." && pwd)
npx remotion ffmpeg -v error -i "$root/out/picture.mp4" -i "$root/public/audio/soundtrack.wav" \
  -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 320k -movflags +faststart -shortest -y "$root/out/showreel.mp4" < /dev/null
echo "out/showreel.mp4"
