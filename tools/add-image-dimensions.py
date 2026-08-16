#!/usr/bin/env python3
"""
add-image-dimensions.py — stamp width/height onto every local <img> in index.html.

    pip install pillow
    python3 tools/add-image-dimensions.py

Why this matters: an <img> with no width/height occupies zero space until it
downloads, so the page grows underneath the reader as images arrive. Combined
with loading="lazy" that means the layout shifts while you scroll and the
"Index" links land in the wrong place.

The attributes are only used for the aspect ratio — CSS still controls the
rendered size (width:100%; height:auto) — so the numbers can be the full
intrinsic dimensions.

Re-run this any time you add, replace, or re-compress an image.

The 43 images still hosted on i.postimg.cc can't be measured from here. Pull
them into assets/ and re-run this, and the layout stops shifting entirely.
"""

import os
import re
import sys

try:
    from PIL import Image
except ImportError:
    sys.exit("Pillow is required:  pip install pillow")

Image.MAX_IMAGE_PIXELS = None  # some of these are genuinely enormous

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HTML = os.path.join(ROOT, "index.html")

added = updated = remote = missing = 0


def intrinsic(src):
    path = os.path.join(ROOT, src)
    if not os.path.exists(path):
        return None
    try:
        with Image.open(path) as im:
            return im.size
    except Exception:
        return None


def rewrite(match):
    global added, updated, remote, missing
    tag = match.group(0)

    src_match = re.search(r'src="([^"]+)"', tag)
    if not src_match:
        return tag
    src = src_match.group(1)

    if not src or src.startswith(("data:", "http://", "https://")):
        remote += 1
        return tag

    size = intrinsic(src)
    if not size:
        missing += 1
        print(f"  ! missing on disk: {src}")
        return tag

    w, h = size
    had = "width=" in tag

    tag = re.sub(r'\s+width="\d+"', "", tag)
    tag = re.sub(r'\s+height="\d+"', "", tag)

    extras = []
    if "loading=" not in tag:
        extras.append('loading="lazy"')
    if "decoding=" not in tag:
        extras.append('decoding="async"')
    extras.append(f'width="{w}" height="{h}"')

    if had:
        updated += 1
    else:
        added += 1

    return tag[:-1].rstrip() + " " + " ".join(extras) + ">"


html = open(HTML, encoding="utf-8").read()

start = html.index('<div class="projects-section">')
end = html.index('<div class="dot"')
body = re.sub(r"<img\b[^>]*>", rewrite, html[start:end])

open(HTML, "w", encoding="utf-8").write(html[:start] + body + html[end:])

print(f"\n  {added} images stamped, {updated} refreshed")
print(f"  {remote} still remote (no dimensions possible)")
if missing:
    print(f"  {missing} referenced but not found on disk")
