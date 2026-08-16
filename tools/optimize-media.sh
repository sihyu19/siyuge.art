#!/usr/bin/env bash
#
# optimize-media.sh — shrink assets/ from ~352 MB to ~14 MB.
#
# Requires ffmpeg:   brew install ffmpeg
# Run from the repo root:   ./tools/optimize-media.sh
#
# Originals are moved to assets-original/ (NOT deleted, NOT committed —
# assets-original/ is in .gitignore). Check the output looks right, then
# delete that folder yourself.
#
# What it does:
#   *.gif            -> .mp4 (H.264) + .webm (VP9)   ~98% smaller
#   *.png/.jpg/.jpeg -> .webp, capped at 2000px wide ~97% smaller
#
# 2000px is deliberate: the biggest these are ever displayed is the lightbox
# at 90vw, so ~2000px still covers a retina 1440 screen with room to spare.
# Several of the current PNGs are 8000+ px wide for a 260px slot.

set -euo pipefail

SRC="assets"
BACKUP="assets-original"
MAX_WIDTH=2000
WEBP_QUALITY=82
H264_CRF=26

command -v ffmpeg >/dev/null || { echo "ffmpeg not found. brew install ffmpeg"; exit 1; }
[ -d "$SRC" ] || { echo "Run this from the repo root (no ./$SRC here)."; exit 1; }

mkdir -p "$BACKUP"

before=$(du -sk "$SRC" | cut -f1)
converted=0

shopt -s nullglob nocaseglob

# ---------------------------------------------------------------- GIFs -> video
for f in "$SRC"/*.gif; do
  base="$(basename "${f%.*}")"
  echo "  video  $base"
  ffmpeg -loglevel error -y -i "$f" \
    -movflags +faststart -pix_fmt yuv420p \
    -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" \
    -c:v libx264 -crf "$H264_CRF" -preset slow -an \
    "$SRC/$base.mp4"
  ffmpeg -loglevel error -y -i "$f" \
    -c:v libvpx-vp9 -crf 34 -b:v 0 -row-mt 1 -an \
    "$SRC/$base.webm"
  # A still frame, so the browser has something to show before the video decodes.
  ffmpeg -loglevel error -y -i "$f" -frames:v 1 \
    -vf "scale='min($MAX_WIDTH,iw)':-2" -c:v libwebp -quality "$WEBP_QUALITY" \
    "$SRC/$base-poster.webp"
  mv "$f" "$BACKUP/"
  converted=$((converted + 1))
done

# ------------------------------------------------------------- stills -> WebP
for f in "$SRC"/*.png "$SRC"/*.jpg "$SRC"/*.jpeg; do
  base="$(basename "${f%.*}")"
  [ -f "$SRC/$base.webp" ] && continue   # skip posters we just made
  echo "  webp   $base"
  ffmpeg -loglevel error -y -i "$f" \
    -vf "scale='min($MAX_WIDTH,iw)':-2" \
    -c:v libwebp -quality "$WEBP_QUALITY" \
    "$SRC/$base.webp"
  mv "$f" "$BACKUP/"
  converted=$((converted + 1))
done

after=$(du -sk "$SRC" | cut -f1)

echo
echo "  converted $converted files"
echo "  assets/  $((before / 1024)) MB  ->  $((after / 1024)) MB"
echo
echo "  Originals are in $BACKUP/ (gitignored). Delete once you're happy."
echo
echo "  NEXT: update the file extensions in index.html."
echo "    - stills:  .png/.jpg -> .webp  (straight find-and-replace)"
echo "    - gifs:    <img src=\"x.gif\"> becomes a <video> element."
echo "               See the notes in the optimization report."
