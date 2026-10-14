// === INTERACTIONS ===

// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

// Reveal content as it enters the viewport
const revealItems = document.querySelectorAll('.reveal');

if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
        });
    }, { threshold: 0, rootMargin: '0px 0px -10% 0px' });

    revealItems.forEach(item => revealObserver.observe(item));
} else {
    revealItems.forEach(item => item.classList.add('visible'));
}

// View switcher: loud portal by default, plain version on demand.
const viewToggleButtons = document.querySelectorAll('[data-view-target]');
const portalView = document.querySelector('#portal-view');
const simpleView = document.querySelector('#simple-view');

function setView(viewName) {
    if (!portalView || !simpleView) return;

    const nextIsSimple = viewName === 'simple';

    simpleView.classList.toggle('active', nextIsSimple);
    portalView.classList.toggle('active', !nextIsSimple);
    document.body.classList.toggle('simple-mode', nextIsSimple);

    if (window.location.hash !== '#' + viewName) {
        history.replaceState(null, '', '#' + viewName);
    }
}

viewToggleButtons.forEach(button => {
    button.addEventListener('click', () => {
        setView(button.dataset.viewTarget);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
});

if (portalView && simpleView) {
    setView(window.location.hash === '#simple' ? 'simple' : 'portal');
}

// Live "As on" stamp, gazette style
const dateEl = document.getElementById('gov-date');
if (dateEl) {
    const now = new Date();
    const day = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
    const time = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    dateEl.textContent = `As on ${day} · ${time} IST`;
}

// Text size controls (the govt accessibility panel, mini edition)
const textSizeLevels = [1, 1.15, 1.3];
let textSizeIndex = 0;

try {
    const saved = parseInt(localStorage.getItem('vk-text-size') || '0', 10);
    if (!isNaN(saved) && saved >= 0 && saved < textSizeLevels.length) textSizeIndex = saved;
} catch (e) { /* private mode */ }

function applyTextSize() {
    document.body.style.zoom = textSizeLevels[textSizeIndex];
    try { localStorage.setItem('vk-text-size', textSizeIndex); } catch (e) { /* ignore */ }
}

document.querySelectorAll('[data-text-size]').forEach(button => {
    button.addEventListener('click', () => {
        const action = button.dataset.textSize;
        if (action === 'up') textSizeIndex = Math.min(textSizeIndex + 1, textSizeLevels.length - 1);
        if (action === 'down') textSizeIndex = Math.max(textSizeIndex - 1, 0);
        if (action === 'reset') textSizeIndex = 0;
        applyTextSize();
    });
});

applyTextSize();

// Console greeting
console.log('%cVivek Khatri / backend + data systems', 'font-size: 16px; color: #0044cc; font-weight: bold;');
console.log('%cThanks for checking out the source.', 'font-size: 12px; color: #888;');
