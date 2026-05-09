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

// Active nav link on scroll
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-link');

window.addEventListener('scroll', () => {
    let current = '';

    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        if (scrollY >= sectionTop - 200) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === '#' + current) {
            link.classList.add('active');
        }
    });
});

// Reveal content as it enters the viewport
const revealItems = document.querySelectorAll('.reveal');

if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) {
                return;
            }

            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
        });
    }, {
        threshold: 0.18
    });

    revealItems.forEach(item => revealObserver.observe(item));
} else {
    revealItems.forEach(item => item.classList.add('visible'));
}

// View switcher: loud portal by default, plain version on demand.
const viewToggleButtons = document.querySelectorAll('[data-view-target]');
const portalView = document.querySelector('#portal-view');
const simpleView = document.querySelector('#simple-view');

function setView(viewName) {
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

setView(window.location.hash === '#simple' ? 'simple' : 'portal');

// Console greeting
console.log('%cVivek Khatri / backend + data systems', 'font-size: 16px; color: #00ff88; font-weight: bold;');
console.log('%cThanks for checking out the source.', 'font-size: 12px; color: #a8a8a8;');
