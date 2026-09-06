#!/usr/bin/env python3
"""
optimize-media.py — shrink assets/ from ~350 MB to ~14 MB.

    pip3 install pillow
    brew install ffmpeg          # only needed for the GIFs
    python3 tools/optimize-media.py

  *.gif            -> .mp4 (H.264, via ffmpeg) + a .webp poster   ~98% smaller
  *.png/.jpg/.jpeg -> .webp, capped at 2000px wide                ~97% smaller

Originals move to assets-original/ (gitignored, NOT deleted). Check the output,
then delete that folder yourself.

Safe to re-run: anything already converted is skipped, so a partial run just
needs running again.

Why Pillow rather than ffmpeg or cwebp for the WebP encoding: Homebrew's ffmpeg
is not built with libwebp, and its cwebp binary links against libtiff, which
breaks whenever `brew cleanup` removes a version something still points at.
Pillow bundles its own codecs and has neither problem.

2000px is deliberate: the largest these ever display is the lightbox at 90vw,
so it still covers a retina 1440 screen with room to spare. Several of the
current PNGs are 8000+ px wide for a 260px slot.
"""

import os
import shutil
import subprocess
import sys

try:
    from PIL import Image
except ImportError:
    sys.exit("Pillow is required:  pip3 install pillow")

Image.MAX_IMAGE_PIXELS = None  # several of these are genuinely enormous

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "assets")
BACKUP = os.path.join(ROOT, "assets-original")

MAX_WIDTH = 2000
WEBP_QUALITY = 82
H264_CRF = 26

VIDEO_EXT = {".gif"}
STILL_EXT = {".png", ".jpg", ".jpeg"}

have_ffmpeg = shutil.which("ffmpeg") is not None


def mb(path):
    return os.path.getsize(path) / 1048576


def save_webp(im, out):
    # WebP cannot store palette or CMYK; RGBA is fine and preserves transparency.
    if im.mode in ("P", "PA"):
        im = im.convert("RGBA" if "transparency" in im.info else "RGB")
    elif im.mode not in ("RGB", "RGBA", "L"):
        im = im.convert("RGB")

    if im.width > MAX_WIDTH:
        h = round(im.height * MAX_WIDTH / im.width)
        im = im.resize((MAX_WIDTH, h), Image.LANCZOS)

    im.save(out, "WEBP", quality=WEBP_QUALITY, method=6)


def convert_gif(path, stem):
    mp4 = os.path.join(SRC, stem + ".mp4")
    poster = os.path.join(SRC, stem + "-poster.webp")

    if not have_ffmpeg:
        raise RuntimeError("ffmpeg not found (brew install ffmpeg)")

    # -pix_fmt yuv420p is required, not cosmetic: these GIFs carry a
    # transparency index in the header that no pixel actually uses, and ffmpeg
    # picks an alpha pixel format from it that H.264 rejects. The scale filter
    # forces even dimensions, which yuv420p also requires.
    result = subprocess.run([
        "ffmpeg", "-loglevel", "error", "-y", "-i", path,
        "-movflags", "+faststart",
        "-pix_fmt", "yuv420p",
        "-vf", "scale=trunc(iw/2)*2:trunc(ih/2)*2",
        "-c:v", "libx264", "-crf", str(H264_CRF), "-preset", "slow", "-an",
        mp4,
    ], capture_output=True, text=True)

    if result.returncode != 0:
        raise RuntimeError(result.stderr.strip().splitlines()[-1] if result.stderr.strip() else "ffmpeg failed")

    with Image.open(path) as im:
        im.seek(0)
        save_webp(im.copy(), poster)

    return mb(mp4) + mb(poster)


def convert_still(path, stem):
    out = os.path.join(SRC, stem + ".webp")
    with Image.open(path) as im:
        save_webp(im.copy(), out)
    return mb(out)


def main():
    if not os.path.isdir(SRC):
        sys.exit(f"No assets/ directory at {SRC}")
    os.makedirs(BACKUP, exist_ok=True)

    before = sum(mb(os.path.join(SRC, f)) for f in os.listdir(SRC)
                 if os.path.isfile(os.path.join(SRC, f)))

    entries = sorted(f for f in os.listdir(SRC)
                     if os.path.isfile(os.path.join(SRC, f))
                     and not f.startswith("."))

    converted = skipped = 0
    failures = []

    for name in entries:
        path = os.path.join(SRC, name)
        stem, ext = os.path.splitext(name)
        ext = ext.lower()

        if ext in VIDEO_EXT:
            done = (os.path.exists(os.path.join(SRC, stem + ".mp4"))
                    and os.path.exists(os.path.join(SRC, stem + "-poster.webp")))
            fn, label = convert_gif, "video"
        elif ext in STILL_EXT:
            done = os.path.exists(os.path.join(SRC, stem + ".webp"))
            fn, label = convert_still, "webp "
        else:
            continue

        if done:
            print(f"  skip   {name}")
            shutil.move(path, os.path.join(BACKUP, name))
            skipped += 1
            continue

        was = mb(path)
        print(f"  {label}  {name} ({was:.1f} MB) ... ", end="", flush=True)
        try:
            now = fn(path, stem)
            shutil.move(path, os.path.join(BACKUP, name))
            converted += 1
            pct = 100 * (1 - now / was) if was else 0
            print(f"{now:.2f} MB  ({pct:.0f}% smaller)")
        except Exception as e:
            failures.append((name, str(e)[:90]))
            print(f"FAILED — {str(e)[:90]}")

    after = sum(mb(os.path.join(SRC, f)) for f in os.listdir(SRC)
                if os.path.isfile(os.path.join(SRC, f)))

    print()
    print(f"  converted {converted}   skipped {skipped}   failed {len(failures)}")
    print(f"  assets/  {before:.0f} MB  ->  {after:.0f} MB")

    if failures:
        print("\n  Failed (originals untouched, safe to re-run):")
        for n, e in failures:
            print(f"    - {n}\n        {e}")

    print(f"\n  Originals are in assets-original/ (gitignored). Delete once you're happy.")
    print(f"  NEXT: update the file extensions in index.html. See OPTIMIZATION-NOTES.md.")


if __name__ == "__main__":
    main()
