function openBento() {
  window.open('https://bento.me/siyuge', '_blank');
}

function openResume() {
  window.open('https://drive.google.com/file/d/1tQCro1kNr5WpdjznQuV_uc7oUeFMbZm4/view?usp=sharing', '_blank');
}

function openShiftCreator() {
  window.open('https://shiftcreator.space', '_blank');
}

function openProMo() {
  window.open('https://www.instagram.com/product.motion?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==', 'blank');
}

function openATD() {
  window.open('https://alphathetadeltaumich.org/', '_blank');
}

function openRoots() {
  window.open('https://www.rootsapp.org/', '_blank');
}

function openCSS() {
  window.open('https://lsa.umich.edu/social-solutions', '_blank');
}

function openShiftBrand(){
  window.open('https://drive.google.com/file/d/1vynp9f_Jv0CBA5Il71hTPoxmoxte2Ns9/view?usp=sharing', '_blank');
}

// SVG Animation Functions
const svg = {
  createDrawable: function(selector) {
    const elements = document.querySelectorAll(selector);
    return Array.from(elements).map(el => {
      return new Proxy(el, {
        set(target, prop, value) {
          if (prop === 'draw') {
            const [start, end] = value.split(' ').map(Number);
            const length = target.getTotalLength();
            const startLength = length * start;
            const endLength = length * end;
            const dashLength = endLength - startLength;
            
            target.style.strokeDasharray = dashLength + ' ' + length;
            target.style.strokeDashoffset = length - endLength;
          } else {
            target[prop] = value;
          }
          return true;
        },
        get(target, prop) {
          return target[prop];
        }
      });
    });
  }
};

let currentAnimation = null;

function animateSVG() {
  const [drawable] = svg.createDrawable('.animated-line');
  
  // Reset
  drawable.draw = '0 0';
  
  // Cancel any existing animation
  if (currentAnimation) {
    cancelAnimationFrame(currentAnimation);
  }
  
  // Manual animation
  let progress = 0;
  const duration = 5000; // 5 seconds - nice and slow
  const startTime = Date.now();
  
  function animate() {
    const elapsed = Date.now() - startTime;
    progress = Math.min(elapsed / duration, 1);
    
    // Easing function (easeInOutQuad)
    const eased = progress < 0.5 
      ? 2 * progress * progress 
      : 1 - Math.pow(-2 * progress + 2, 2) / 2;
    
    drawable.draw = `0 ${eased}`;
    
    if (progress < 1) {
      currentAnimation = requestAnimationFrame(animate);
    }
  }
  
  animate();
}

// Header 3D effect
const header = document.querySelector('h1');
const headerContainer = document.querySelector('.header-container');
let rect = headerContainer.getBoundingClientRect();

headerContainer.addEventListener('mousemove', (e) => {
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;
  const centerX = rect.width / 2;
  const centerY = rect.height / 2;
  const percentX = (mouseX - centerX) / centerX;
  const percentY = (mouseY - centerY) / centerY;
  const twistX = percentY * 20;
  const twistY = percentX * 20;
  header.style.transform = `rotateX(${-twistX}deg) rotateY(${twistY}deg)`;
});

headerContainer.addEventListener('mouseleave', () => {
  header.style.transform = 'none';
});

window.addEventListener('resize', () => {
  rect = headerContainer.getBoundingClientRect();
});

// Custom cursor
const dot = document.getElementById('dot');
document.addEventListener('mousemove', (e) => {
  dot.style.left = `${e.clientX}px`;
  dot.style.top = `${e.clientY}px`;
});

// Index panel functionality
const toggleIndexPanel = () => {
  const panel = document.getElementById('indexPanel');
  panel.classList.toggle('open');
};

const scrollToProject = (id) => {
  const element = document.getElementById(id);
  if (element) {
    element.scrollIntoView({
      behavior: 'smooth'
    });
    toggleIndexPanel();
  }
};

// Intersection Observer for SVG animation trigger
const observerOptions = {
  threshold: 0.5,
  rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting && entry.target.classList.contains('my-work-svg')) {
      animateSVG();
    }
  });
}, observerOptions);

// Lottie animations
document.addEventListener('DOMContentLoaded', () => {
  const heroLottieElement = document.querySelector('.services-hero-lottie');
  const heroAnimation = lottie.loadAnimation({
    container: heroLottieElement,
    renderer: 'svg',
    loop: true,
    autoplay: true,
    path: 'https://cdn.prod.website-files.com/6285e77eaf03d3b5e63ee110/63b6fa2b52a5b1508ff0c52f_big%20purple%20stars2.json'
  });

  // Modify the color of stars to yellow after animation loads
  heroAnimation.addEventListener('DOMLoaded', () => {
    const svgElement = heroLottieElement.querySelector('svg');
    if (svgElement) {
      const paths = svgElement.querySelectorAll('path');
      paths.forEach(path => {
        // Change stroke color to yellow
        path.setAttribute('stroke', '#f3a5a5');
        
        // If there's a fill color (like the star), change it to yellow
        if (path.getAttribute('fill')) {
          path.setAttribute('fill', '#f3a5a5');
        }
      });
    }
  });

  const arrowElement = document.querySelector('.services-arrow-lottie');
  const animation = lottie.loadAnimation({
    container: arrowElement,
    renderer: 'svg',
    loop: true,
    autoplay: true,
    path: 'https://cdn.prod.website-files.com/6285e77eaf03d3b5e63ee110/63909085c2a607e8ca242ced_arrow%20purple.json'
  });

  // Modify the color after animation loads
  animation.addEventListener('DOMLoaded', () => {
    const svgElement = arrowElement.querySelector('svg');
    if (svgElement) {
      const paths = svgElement.querySelectorAll('path');
      paths.forEach(path => {
        path.setAttribute('stroke', '#f3a5a5');
      });
    }
  });

  // Set up intersection observer for SVG animation
  const svgContainer = document.querySelector('.my-work-svg');
  if (svgContainer) {
    observer.observe(svgContainer);
  }
});