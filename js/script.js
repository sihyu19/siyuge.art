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
});