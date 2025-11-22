// === 1. GENERATE TIJORI SYMBOLS ===
function createRingText(elementId, textArray) {
    const ring = document.getElementById(elementId);
    if (!ring) return;
    const count = textArray.length;
    const angleStep = 360 / count;
    textArray.forEach((char, index) => {
        const span = document.createElement('span');
        span.innerHTML = char;
        span.className = 'ring-char';
        span.style.transform = `rotate(${index * angleStep}deg)`;
        ring.appendChild(span);
    });
}
createRingText('ring-1', "☸ ⚜ ☸ ⚜ ☸ ⚜ ☸ ⚜ ☸ ⚜ ☸ ⚜ ☸ ⚜ ☸ ⚜".split(' '));
createRingText('ring-2', "० १ २ ३ ४ ५ ६ ७ ८ ९ ० १ २ ३ ४ ५".split(' '));
createRingText('ring-3', "▲ ▼ ▲ ▼ ▲ ▼ ▲ ▼ ▲ ▼ ▲ ▼".split(' '));

// === 2. SCROLL LOGIC (Mobile & Desktop) ===
const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('.manuscript-section');
const scrollContainer = document.getElementById('scroll-container');
const isMobile = window.innerWidth <= 768;

// On mobile, the WINDOW scrolls. On desktop, the CONTAINER scrolls.
const scrollRoot = isMobile ? null : scrollContainer;

const observerOptions = {
    root: scrollRoot,
    rootMargin: isMobile ? "-10% 0px -70% 0px" : "-20% 0px -60% 0px",
    threshold: 0
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            navLinks.forEach(link => link.classList.remove('active'));
            const id = entry.target.getAttribute('id');
            const activeLink = document.querySelector(`#nav-${id}`);
            if (activeLink) activeLink.classList.add('active');
            entry.target.classList.add('visible');
        }
    });
}, observerOptions);

sections.forEach(section => observer.observe(section));

// === 3. SURYA ANIMATION ===
const suryaContainer = document.getElementById('scroll-surya');
const suryaRays = document.querySelector('.surya-rays');
let isScrolling;

// Helper to handle scroll events
function handleScroll(scrollTop) {
    const rotation = scrollTop / 5;
    suryaRays.style.transform = `rotate(${rotation}deg)`;
    suryaContainer.classList.add('active');
    window.clearTimeout(isScrolling);
    isScrolling = setTimeout(() => {
        suryaContainer.classList.remove('active');
    }, 150);
}

// Attach listener to the correct scroll target
if (isMobile) {
    window.addEventListener('scroll', () => handleScroll(window.scrollY));
} else {
    scrollContainer.addEventListener('scroll', () => handleScroll(scrollContainer.scrollTop));
}

// === 4. INITIAL LOAD ===
window.addEventListener('DOMContentLoaded', () => {
    if (window.location.hash) {
        const targetId = window.location.hash.substring(1);
        const targetSection = document.getElementById(targetId);
        if (targetSection) {
            setTimeout(() => {
                targetSection.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        }
    }
});