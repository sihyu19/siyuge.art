/* ------------------------------------------------------------------
   Loading screen
   Tracks real asset progress instead of a fixed timer.
   The `js-loading` class is added by an inline script in <head> so the
   page never flashes; it is removed here (or by the inline failsafe).
------------------------------------------------------------------- */

const loadingImages = [
  'https://i.postimg.cc/W4SX88dF/circle-ring.png',
  'https://i.postimg.cc/MTFt2Gbz/dimi.png',
  'https://i.postimg.cc/90wbWjJZ/glass-bowl.png',
  'https://i.postimg.cc/jCVX2kF9/phish.png',
  'https://i.postimg.cc/RhPmzKpN/1.png',
  'https://i.postimg.cc/XNx4F6N4/2.png',
];

const MIN_LOADING_MS = 2200;  // how long the screen shows even on a warm cache
const MAX_LOADING_MS = 8000;  // hard ceiling if something never resolves

function preloadImage(src) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = img.onerror = resolve;
    img.src = src;
  });
}

function whenWindowLoaded() {
  return new Promise(resolve => {
    if (document.readyState === 'complete') resolve();
    else window.addEventListener('load', resolve, { once: true });
  });
}

function initializeLoading() {
  const screen = document.getElementById('loadingScreen');
  const image = document.getElementById('loadingImage');
  const counter = document.getElementById('loadingCounter');
  if (!screen || !image || !counter) return;

  const started = performance.now();

  // The things we genuinely wait for. Each one that settles moves the number.
  const jobs = [
    ...loadingImages.map(preloadImage),
    document.fonts ? document.fonts.ready : Promise.resolve(),
    whenWindowLoaded(),
  ];

  let settled = 0;
  const total = jobs.length;
  jobs.forEach(job => Promise.resolve(job).then(bump, bump));
  function bump() { settled++; }

  // Cycle the frames while we wait.
  let frame = 0;
  image.src = loadingImages[0];
  const cycle = setInterval(() => {
    frame = (frame + 1) % loadingImages.length;
    image.src = loadingImages[frame];
  }, 200);

  let shown = 0;
  let finished = false;

  function dismiss() {
    if (finished) return;
    finished = true;
    clearInterval(cycle);
    counter.textContent = '100';
    screen.classList.add('slide-up');
    document.documentElement.classList.remove('js-loading');
    setTimeout(() => { screen.style.display = 'none'; }, 800);
  }

  function tick() {
    const elapsed = performance.now() - started;
    const ready = settled === total && elapsed >= MIN_LOADING_MS;
    const timedOut = elapsed >= MAX_LOADING_MS;

    // Two things gate the exit: assets finishing, and the minimum display time
    // elapsing. Pace against whichever is further behind, so on a warm cache
    // the number climbs over MIN_LOADING_MS instead of racing to 99 and then
    // sitting there waiting out the timer.
    const gated = Math.min(settled / total, elapsed / MIN_LOADING_MS);

    // `gated` alone plateaus: only 8 things are being tracked, and the last
    // two (webfonts, window load) can lag the other six by seconds, which
    // parked the number at 75 while the page was clearly still working.
    // This curve keeps it creeping toward 95 and never quite arriving, so
    // there is always motion without ever claiming to be finished.
    const creep = 0.95 * (1 - Math.exp(-elapsed / MIN_LOADING_MS));

    let target = Math.max(gated, creep) * 100;
    if (!ready && !timedOut) target = Math.min(target, 99);
    else target = 100;

    // Snap harder once we are actually done, so the last stretch to 100 is
    // not itself a wait.
    const rate = (ready || timedOut) ? 0.28 : 0.1;
    shown += Math.max((target - shown) * rate, target > shown ? 0.4 : 0);
    if (shown > target) shown = target;

    counter.textContent = String(Math.max(1, Math.round(shown)));

    if ((ready || timedOut) && shown >= 99.5) dismiss();
    else requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

/* ------------------------------------------------------------------
   External links
------------------------------------------------------------------- */

function openResume() {
  window.open('https://drive.google.com/file/d/1jVhWe34kawkJr_Kx6P_C8qhsTazEddk6/view?usp=sharing', '_blank', 'noopener');
}

function openShiftCreator() {
  window.open('https://shiftcreator.space', '_blank', 'noopener');
}

function openAGS() {
  window.open('https://www.agslogistics.com/', '_blank', 'noopener');
}

function openCSS() {
  window.open('https://lsa.umich.edu/social-solutions', '_blank', 'noopener');
}

function openShiftBrand() {
  window.open('https://drive.google.com/file/d/1V2kt3Fl0RQTvlNComZTrbUXEcsJ1aRbt/view?usp=sharing', '_blank', 'noopener');
}

function openMedium() {
  window.open('https://medium.com/@siyuge', '_blank', 'noopener');
}

/* ------------------------------------------------------------------
   Index panel
------------------------------------------------------------------- */

const toggleIndexPanel = () => {
  document.getElementById('indexPanel').classList.toggle('open');
};

const scrollToProject = (id) => {
  const element = document.getElementById(id);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' });
    toggleIndexPanel();
  }
};

/* ------------------------------------------------------------------
   "MY WORK" line-drawing animation
------------------------------------------------------------------- */

let currentAnimation = null;

function animateSVG() {
  const source = document.querySelector('.background-line');
  const line = document.querySelector('.animated-line');
  if (!source || !line) return;

  // The two paths are identical; copy the geometry instead of shipping it twice.
  if (!line.getAttribute('d')) line.setAttribute('d', source.getAttribute('d'));

  const length = line.getTotalLength();
  const draw = (end) => {
    line.style.strokeDasharray = (length * end) + ' ' + length;
    line.style.strokeDashoffset = '0';
  };

  draw(0);

  if (currentAnimation) cancelAnimationFrame(currentAnimation);

  const duration = 5000;
  const startTime = performance.now();

  function step(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    const eased = progress < 0.5
      ? 2 * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 2) / 2;

    draw(eased);

    if (progress < 1) currentAnimation = requestAnimationFrame(step);
  }

  currentAnimation = requestAnimationFrame(step);
}

/* ------------------------------------------------------------------
   Decorative Lottie animations (optional — never block the page)
------------------------------------------------------------------- */

function loadLottie(selector, path, stroke) {
  if (typeof lottie === 'undefined') return;
  const container = document.querySelector(selector);
  if (!container) return;

  try {
    const animation = lottie.loadAnimation({
      container, renderer: 'svg', loop: true, autoplay: true, path,
    });

    animation.addEventListener('DOMLoaded', () => {
      const svgElement = container.querySelector('svg');
      if (!svgElement) return;
      svgElement.querySelectorAll('path').forEach(p => {
        p.setAttribute('stroke', stroke);
        if (p.getAttribute('fill')) p.setAttribute('fill', stroke);
      });
    });
  } catch (e) {
    /* decorative only — a CDN failure must not take the page down */
  }
}

/* ------------------------------------------------------------------
   Init
------------------------------------------------------------------- */

document.addEventListener('DOMContentLoaded', () => {
  initializeLoading();

  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!reducedMotion) {
    loadLottie('.services-hero-lottie',
      'https://cdn.prod.website-files.com/6285e77eaf03d3b5e63ee110/63b6fa2b52a5b1508ff0c52f_big%20purple%20stars2.json',
      '#f3a5a5');
    loadLottie('.services-arrow-lottie',
      'https://cdn.prod.website-files.com/6285e77eaf03d3b5e63ee110/63909085c2a607e8ca242ced_arrow%20purple.json',
      '#f3a5a5');
  }

  // Header 3D tilt + custom cursor — pointer devices only.
  if (finePointer) {
    const header = document.querySelector('h1');
    const headerContainer = document.querySelector('.header-container');

    if (header && headerContainer) {
      headerContainer.addEventListener('mousemove', (e) => {
        // Read the rect per-move so scrolling and resizing can't desync it.
        const rect = headerContainer.getBoundingClientRect();
        const percentX = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2);
        const percentY = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2);
        header.style.transform = `rotateX(${-percentY * 20}deg) rotateY(${percentX * 20}deg)`;
      });

      headerContainer.addEventListener('mouseleave', () => {
        header.style.transform = 'none';
      });
    }

    const dot = document.getElementById('dot');
    if (dot) {
      document.addEventListener('mousemove', (e) => {
        dot.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`;
        dot.classList.add('active');
      });
    }
  }

  // Draw the "MY WORK" line when it scrolls into view.
  const svgContainer = document.querySelector('.my-work-svg');
  if (svgContainer && !reducedMotion) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) animateSVG();
      });
    }, { threshold: 0.5, rootMargin: '0px 0px -100px 0px' });

    observer.observe(svgContainer);
  }
});
