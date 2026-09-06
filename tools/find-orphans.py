#!/usr/bin/env python3
"""
find-orphans.py — list files in assets/ that index.html never references.

    python3 tools/find-orphans.py            # report only
    python3 tools/find-orphans.py --delete   # actually remove them

Every hosting byte costs you on a repo this size, but deleting the wrong file
costs more. So this reads index.html, resolves every src= and poster= it finds,
and reports only what genuinely nothing points at.

Note especially: `<name>-poster.webp` files are NOT spare copies. They are the
`poster=` frame each <video> shows before it has decoded anything, so a viewer
on a slow connection sees the still rather than a black rectangle. All eleven
together are under 300 KB. This script will correctly report them as used.
"""

import argparse
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "assets")
HTML = os.path.join(ROOT, "index.html")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--delete", action="store_true", help="remove the orphans")
    args = ap.parse_args()

    html = open(HTML, encoding="utf-8").read()
    # also sweep the CSS and JS, in case something is referenced from there
    extra = ""
    for sub in ("css", "js"):
        d = os.path.join(ROOT, sub)
        if os.path.isdir(d):
            for f in os.listdir(d):
                if f.endswith((".css", ".js")):
                    extra += open(os.path.join(d, f), encoding="utf-8").read()

    refs = set(re.findall(r'assets/([^"\')\s]+(?:\.[A-Za-z0-9]+))', html + extra))
    # filenames contain spaces, so also match the quoted forms directly
    refs |= set(re.findall(r'(?:src|poster)="assets/([^"]+)"', html))

    disk = sorted(f for f in os.listdir(SRC)
                  if os.path.isfile(os.path.join(SRC, f)) and not f.startswith("."))

    orphans = [f for f in disk if f not in refs]
    used = [f for f in disk if f in refs]
    missing = sorted(r for r in refs if not os.path.exists(os.path.join(SRC, r)))

    print(f"  {len(used)} referenced, {len(orphans)} orphaned, {len(missing)} referenced-but-missing\n")

    if missing:
        print("  REFERENCED BUT NOT ON DISK — fix these, they are broken images:")
        for m in missing:
            print(f"    ! {m}")
        print()

    if not orphans:
        print("  No orphans. Nothing to clean up.")
        return

    total = sum(os.path.getsize(os.path.join(SRC, f)) for f in orphans)
    print("  ORPHANS (nothing in index.html, css/ or js/ points at these):")
    for f in orphans:
        print(f"    {os.path.getsize(os.path.join(SRC, f)) / 1024:8.0f} KB  {f}")
    print(f"\n  {total / 1048576:.2f} MB total")

    if args.delete:
        for f in orphans:
            os.remove(os.path.join(SRC, f))
        print(f"\n  Deleted {len(orphans)} files.")
    else:
        print("\n  Re-run with --delete to remove them.")


if __name__ == "__main__":
    main()
