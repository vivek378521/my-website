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

const navLinks = document.querySelectorAll('.nav-link');
const scrollContainer = document.getElementById('scroll-container');
const sections = document.querySelectorAll('.manuscript-section');

const observerOptions = {
    root: scrollContainer,
    rootMargin: "-20% 0px -60% 0px",
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

const suryaContainer = document.getElementById('scroll-surya');
const suryaRays = document.querySelector('.surya-rays');
let isScrolling;

scrollContainer.addEventListener('scroll', () => {
    const rotation = scrollContainer.scrollTop / 5;
    suryaRays.style.transform = `rotate(${rotation}deg)`;
    suryaContainer.classList.add('active');
    window.clearTimeout(isScrolling);
    isScrolling = setTimeout(() => {
        suryaContainer.classList.remove('active');
    }, 150);
});

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