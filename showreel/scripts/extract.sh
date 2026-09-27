#!/usr/bin/env bash
# Pulls frames out of an encoded video and tiles them into a labelled contact sheet.
# Usage: scripts/extract.sh out/showreel.mp4 sheetname 0 30 60 ...
# Remotion's bundled ffmpeg has no `select` filter, so frames are found by time: seeking to
# (n - 1/4) / fps returns the first frame at or after that time, which is frame n.
set -euo pipefail
video=$(realpath "$1"); name=$2; shift 2
dir=$(pwd)/out/extract/$name
rm -rf "$dir"; mkdir -p "$dir"
files=()
for f in "$@"; do
  t=$(python3 -c "print(max(0.0, ($f - 0.25) / 60))")
  out="$dir/f$(printf %03d "$f").png"
  npx remotion ffmpeg -v error -ss "$t" -i "$video" -frames:v 1 -update 1 -y "$out" < /dev/null
  files+=("$out")
done
python3 scripts/sheet.py "out/extract/$name.png" "${files[@]}"
