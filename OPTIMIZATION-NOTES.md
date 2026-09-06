# siyuge.art — optimization notes

Everything is on the branch `optimize` (pushed as `optimize-loading-responsive-cleanup`
from my side). Desktop appearance is unchanged — verified pixel-for-pixel at
1440 and 1920.

---

## 1. The loading screen

**It wasn't measuring anything.** The old version ran a `setTimeout` for exactly
2500ms and a counter that ticked 1→100 on a 20ms interval. Neither was connected
to a single byte of the page. The screen always left after 2.5 seconds — whether
the site had finished loading or, given the 353MB of assets, whether it had
barely started.

So on a phone the sequence was: watch a fake progress counter for 2.5 seconds,
then get dropped into a page that is still loading for another minute or two.
The loading screen was actively making things worse — it delayed you *and* told
you a load had completed that hadn't.

**Now it tracks real work.** It waits on the six loader frames, `document.fonts.ready`,
and the window `load` event, and the number reflects how many of those have
actually settled. Two guards: a 2.2s floor so it can't
flash past on a fast connection, and an 8s ceiling so a hanging request can't
trap you. The floor lives in `MIN_LOADING_MS` at the top of `script.js` if you
want it longer or shorter.

The number is paced against whichever constraint is actually binding — asset
progress or the floor — so it never races ahead and then parks, and an
asymptotic creep keeps it moving toward 95 if the network stalls. What stays
honest is the *exit*: it leaves when the assets are genuinely done, not when a
timer says so.

I also moved the "hide the page" flag from `DOMContentLoaded` into an inline
`<head>` script, **above the stylesheet links**. That position matters: a
parser-blocking inline script placed after a pending stylesheet waits for it,
so with the script below the Typekit link, a hanging font request stalled the
parser before `<body>` existed — the failsafe could never fire and the page
stayed blank for as long as the font host took to give up. Moved above, it
reveals the page at 9s regardless. Moving it out of `DOMContentLoaded` also
fixes a flash — the page used to paint and *then* get hidden.

Measured across four network conditions:

| Condition | Counter | Screen leaves at |
|---|---|---|
| Warm cache | `4 12 29 45 56 68 80 91 100` | 2.5s |
| Normal (~600ms/asset) | climbs, brief pause at 75 | 8.9s |
| Bad (~2.5s/asset) | climbs steadily | 5.4s |
| Network fully dead | JS never runs | 9.1s (failsafe) |

---

## 2. Dead code

Things the code claimed to do but didn't:

| | |
|---|---|
| `position: sticky` on every `.project-info` | **Never worked.** `overflow-x: hidden` on `<body>` makes body a scroll container, which silently disables sticky. The info column scrolled away instead of pinning. Changed to `overflow-x: clip`, which clips without creating a scroll container. It now pins at exactly `top: 40px`. |
| Mobile sizes for both Lottie animations | **Never applied.** The base rules sat at the bottom of the file, below the media queries. Same specificity means source order wins, so the phone was rendering a 500×500 element. This is a large part of why mobile looked wrong — see §3. |
| `.project-images-grid img:first-child { grid-column: auto }` | `grid-column` on a `column-count` container. Not a grid. |
| `.project-images-grid iframe`, `video`, `> div`, `.single-project-image video` | No iframes, videos, or divs exist in those containers. |
| `.services-arrow-lottie:hover { opacity: 1 }` | Opacity was already 1. Nothing to override. |
| `border-width: 6px` on `.picture-frame` | No `border-style`, so no border. |
| A duplicated `@media (max-width: 768px)` block | Same `.picture-frame` and `.loading-counter` rules declared twice. |

Also removed:

- `openProMo()` and `openATD()` — not called from anywhere.
- `loadingComplete` — assigned, never read.
- A `Proxy` wrapper around `getTotalLength()` to set `strokeDasharray`. Replaced
  with a plain function.
- ~10 Webflow `data-*` attributes per Lottie container (`data-w-id`,
  `data-is-ix2-target`, `data-default-duration`…). Inert — `script.js` loads the
  animations manually.
- The 2.5KB SVG path, duplicated verbatim across both `<path>` elements.
  `script.js` copies it at runtime now.
- The duplicate closing `</body>` tag.

**One real fragility worth calling out.** Lottie loaded as a blocking `<script>`
in `<head>` from a CDN, and `lottie.loadAnimation()` was called bare inside the
`DOMContentLoaded` handler. If cdnjs was slow, blocked, or down, that call threw
and **aborted the rest of the handler** — killing the custom cursor, the header
tilt, and the "MY WORK" animation with it. I hit this immediately in testing.
Both scripts are `defer`red now and Lottie is wrapped so a CDN failure costs you
two decorative animations and nothing else.

---

## 3. Responsive

### Why mobile looked "funky" — the actual mechanism

Your phone was **not rendering at 375px.** It was rendering at ~505px and then
scaling the whole page down to about 73% to fit. That's why everything looked
uniformly small and slightly off rather than broken in one specific place.

The cause: `.background-blob` is `position: absolute` with no positioned
ancestor, so its containing block is the *initial containing block* — which sits
outside `<body>`, meaning `body { overflow-x: hidden }` could never clip it. Its
keyframes apply `scale(1.4) skew(30deg)`, and skew inflates an element's bounding
box by roughly its own height again. A 300px blob became a 540px box on a 375px
screen, and the browser widened the layout viewport to fit it.

Fixed by wrapping it in `position: absolute; inset: 0` with `overflow-x: clip`.
That rectangle *is* the initial containing block, so `top: 50%; left: 70%`
resolve to exactly the same place — the blob renders identically and simply gets
clipped sideways now. Only the x axis: clipping both cut the blur off at a hard
horizontal line at 100vh, since the wrapper is viewport-height. `clip` is what
makes that split legal — with `hidden`, one axis hidden forces the other to
`auto` and you get a scroll container back. This also removed 120–220px of sideways scroll on desktop, which I doubt
you'd noticed but was there at every width below 1600.

### The other big one: images pushed off-screen on laptops

`.project-images-grid img` had a hard `width: 260px`, and the grid track holding
it was `1fr`. A grid track defaults to `min-width: auto`, so it can't shrink
below its content's min-content width — which for a 4-column layout of 260px
images is 1088px, regardless of how much room actually exists.

Result, measured:

| Viewport | Content overflowed by |
|---|---|
| 1100px | **378px** |
| 1280px | 198px |
| 1440px | 38px |

The rightmost column of images was cut off, hidden by `overflow-x: hidden`.
Images are `width: 100%` now with `min-width: 0` on the track.

*One knock-on:* at exactly 1440px your grid images go from 260px to 238px wide,
because they now fit inside the container instead of overhanging it. At 1920 it's
253px vs 260px. This is the fix working, but it's the one place the desktop
rendering is not byte-identical, so flagging it.

### Columns

Four columns on a 375px phone gave **75px images** — and the page was rendering
at 505px and scaling down, so they were effectively smaller still. Column count
stays at 4 by preference (the grid is a contact sheet you tap into via the
lightbox), but the viewport fix plus tighter padding and gaps takes them to
**80px** at a true 375px.

| Width | Columns | Image width at that size |
|---|---|---|
| ≥1025px | 4 | 238–253px |
| 769–1024px | 3 | ~230px |
| 561–768px | 4 | 127–174px |
| ≤560px | 4 | 67–94px |

Measured trade if you want bigger images: 3 columns gives 102px on a 375px
screen and costs about one extra screen of scroll (11 vs 10). Change
`column-count` in the `≤560px` block and the `768px` block above it.

### Also fixed

- `.single-project-image img` was a hard `width: 1080px`. Now `100%` with a
  1080px cap — it was overflowing every viewport under ~1200px.
- `100vh` on the loading screen → `100dvh`, so mobile Safari's URL bar doesn't
  make it taller than the screen.
- The custom cursor is disabled on touch devices, and `cursor: none` is lifted
  there. It was also flashing in the top-left corner on load; now it fades in on
  first movement.
- The index panel opened *underneath* the fixed nav (z-index 40 vs 100). Swapped.
- Added `prefers-reduced-motion` handling for the blob, the marquee, and the tilt.
- `filter: blur(150px)` on a continuously animating element is the most expensive
  thing on the page for a phone GPU. Dropped to 80px on mobile (indistinguishable
  at that size) and added `will-change: transform` so the blur rasterizes once
  instead of re-computing every frame.
- Mobile body text was `0.8em` — quite small. Now `0.95em`.

Verified from 320px to 2560px: no layout-viewport widening, no horizontal scroll
at any width.

---

## 4. Making the media smaller

**This is the big one. `assets/` is 352MB. It should be about 14MB.**

Worst offenders:

| File | Size | Note |
|---|---|---|
| `flying phish!.gif` | 74.3 MB | 250 frames |
| `hallway.gif` | 40.7 MB | |
| `vinyl.gif` | 26.8 MB | |
| `mymet6.png` | 15.1 MB | 8333×9575 |
| `mymet3.png` | 8.3 MB | 8333×**17908** — 149 megapixels, displayed at 260px |

### Run this

```bash
pip3 install pillow
brew install ffmpeg
python3 tools/optimize-media.py
```

Measured on your actual assets: **344 MB → 9 MB in 2m18s, 47 files, 0 failures.**

Pillow does the WebP encoding rather than ffmpeg or cwebp, which is worth
knowing if you ever change this. Homebrew's ffmpeg is not built with libwebp
(`Unknown encoder 'libwebp'`), and its `cwebp` binary links against libtiff,
which breaks the moment `brew cleanup` removes a version it points at
(`Library not loaded: libtiff.6.dylib`). Pillow bundles its own codecs and has
neither failure mode. ffmpeg is still used for the GIF→MP4 step, where it
works fine.

It converts everything and moves originals to `assets-original/` (gitignored —
delete once you're happy). Measured results on your actual files:

| | Before | After | |
|---|---|---|---|
| `flying phish!.gif` → `.mp4` | 74.3 MB | **0.46 MB** | 99.4% smaller |
| `hallway.gif` → `.mp4` | 40.7 MB | **0.76 MB** | 98.1% |
| `vinyl.gif` → `.mp4` | 26.8 MB | **0.64 MB** | 97.6% |
| `mug mockup.png` → `.webp` | 13.6 MB | **0.08 MB** | 99.4% |
| `stoopid2.jpg` → `.webp` | 12.7 MB | **0.10 MB** | 99.2% |
| `mymet6.png` → `.webp` | 15.1 MB | **0.56 MB** | 96.3% |
| **All of `assets/`** | **352 MB** | **~14 MB** | |

### The three levers, in order of payoff

**1. GIF is the wrong format for a render. Use video.** A GIF can't do
interframe compression the way H.264 can, and it's capped at 256 colors, so
you're paying enormous file size for *worse* quality. Your 74MB GIF is 0.46MB as
MP4 — 161× smaller — and looks better.

**2. Resize before you compress.** Your images are displayed at ~260px in the
grid and at most ~1300px in the lightbox. `mymet3.png` is 8333px wide. The script
caps everything at 2000px, which still covers a retina lightbox with room to
spare, and that resize alone does most of the work.

**3. WebP instead of PNG for photographic content.** PNG is lossless, which is
right for flat graphics and wasteful for renders and photos. WebP at quality 82
is visually indistinguishable here and ~95% smaller.

### The GIF swap needs a markup change

`.webp` stills are a straight find-and-replace on the file extension. The GIFs
become `<video>` elements:

```html
<video autoplay muted loop playsinline preload="metadata"
       poster="assets/vinyl-poster.webp"
       width="800" height="800" aria-label="Vinyl record animation">
  <source src="assets/vinyl.mp4" type="video/mp4">
</video>
```

MP4 only — H.264 plays everywhere since ~2011, so WebM would save about 1 MB
against an already-98% reduction while doubling encode time.

`muted` and `playsinline` are both required or iOS won't autoplay. Then add to
`styles.css` next to the image rules:

```css
.project-images-grid video {
  width: 100%;
  height: auto;
  border-radius: 4px;
  display: block;
  margin-bottom: 16px;
  break-inside: avoid;
}
```

and widen the lightbox selector in the inline script at the bottom of
`index.html` from `.project-images-grid img` to
`.project-images-grid img, .project-images-grid video`.

I deliberately did **not** pre-add the video CSS — it'd be dead code until you
run the conversion, which is exactly what you asked me to clear out.

### Two related things

**Your `.git` folder is 414MB.** Compressing the files won't shrink it, because
every old version is still in the history, and Vercel clones the whole repo on
every build. After you've committed the compressed assets and are confident, you
can rewrite history with [`git-filter-repo`](https://github.com/newren/git-filter-repo):

```bash
git filter-repo --path assets --invert-paths --force   # then re-add compressed assets
```

That's a destructive, force-push operation — take a backup copy of the folder
first. It's optional; the site works fine without it, builds are just slower.

**43 of your images are hosted on i.postimg.cc, 47 are in the repo.** I'd move
them all into `assets/`. Three reasons: postimg can rate-limit or disappear and
takes half your portfolio with it; you can't compress what you don't host; and I
can't stamp dimensions on them, which matters below.

---

## Smaller things I changed

- `loading="lazy"` and `decoding="async"` on all 90 project images.
- Intrinsic `width`/`height` on all 47 local images. Without these, a lazy image
  occupies zero height until it downloads, so the page grows underneath you as
  you scroll and the Index links land in the wrong place. Re-run
  `tools/add-image-dimensions.py` whenever you add or re-compress an image.
- IDs with spaces (`id="adobe creative meetup"`, `"shift merch"`, `"better cafe"`)
  → hyphenated. These technically work with `getElementById` but break any CSS or
  `querySelector` targeting, and they're invalid in a URL fragment.
- Alt text. Most images had none or repeated ones (four different posters all
  labelled "Diag poster"). Now descriptive — this is what screen readers announce
  and what Google indexes.
- Added `<meta name="description">` and Open Graph tags, so links to the site in
  a message or a post show a title and description instead of a bare URL.
- Index panel said "Chromatic Memories"; the project is "Chromatic Memoirs".
- Deleted 3 orphaned assets (7.9MB — `923 state street.JPG`,
  `mascot performative2.png`, `resume for website.png`), plus the committed
  `.DS_Store` files and `.vscode/`. Added a `.gitignore`.

---

## Things I left alone

- **The Lottie animations load from `cdn.prod.website-files.com`** — a Webflow
  CDN belonging to someone else's site. Those two JSON files could vanish
  whenever that site changes. They're small; download them into `assets/` and
  point at your own copies.
- **Index links take ~4 seconds to scroll.** `scrollIntoView({behavior:'smooth'})`
  scales its duration with distance in Chrome, and your page is 9000px tall.
  Fixing it means a custom eased scroll with a capped duration — happy to do it,
  but it's a behaviour change rather than a bug fix.
- **`.name-title` is positioned against the viewport, not the hero section.**
  `top: 40%` resolves against viewport *height*, so the headline sits in a
  different spot relative to your text on a 900px-tall window than on a 1080px
  one. Nothing overlaps at any size I tested, so I left it — but it's why the
  hero composition feels inconsistent between machines. The fix is one line
  (`position: relative` on `.hero-section`) and it *would* move the headline, so
  it needs your eye rather than mine.
- **The favicon.** There isn't one.
