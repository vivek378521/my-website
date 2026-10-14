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

// === HERO SCENE ===
// A slightly pixelated man looking up at the planets, drawn pixel-by-pixel
// onto a low-res grid that CSS blows up crisply behind the masthead.

(function heroScene() {
    const canvas = document.querySelector('[data-hero-scene]');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const PIXEL = 4; // CSS pixels per scene pixel — bigger = chunkier
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const MAN = [
        '      ######    ',
        '     ########   ',
        '     ########   ',
        '      ######    ',
        '       ####     ',
        '   ##########   ',
        '  ############  ',
        '  ############  ',
        '  ############  ',
        '  ############  ',
        '  ############  ',
        '  ############  ',
        '   ##########   ',
        '    ########    ',
        '    ########    ',
        '    ########    ',
        '    ##   ##     ',
        '    ##   ##     ',
        '    ##   ##     ',
        '    ##   ##     ',
        '    ##   ##     ',
        '   ###   ###    ',
        '   ###   ###    ',
        '  ####   ####   ',
        '  ####   ####   '
    ];

    // Layers: sky is painted first, stars twinkle between, foreground stays on top.
    const sky = document.createElement('canvas');
    const fg = document.createElement('canvas');
    const sctx = sky.getContext('2d');
    const fctx = fg.getContext('2d');

    let GW = 0;
    let GH = 0;
    let stars = [];
    let running = false;
    let rafId = 0;

    const seedRand = (function (seed) {
        return function () {
            seed = (seed * 1664525 + 1013904223) >>> 0;
            return seed / 4294967296;
        };
    })(20261014);

    function mix(a, b, t) {
        t = t < 0 ? 0 : t > 1 ? 1 : t;
        return [
            Math.round(a[0] + (b[0] - a[0]) * t),
            Math.round(a[1] + (b[1] - a[1]) * t),
            Math.round(a[2] + (b[2] - a[2]) * t)
        ];
    }

    function shade(c, f) {
        return [Math.round(c[0] * f), Math.round(c[1] * f), Math.round(c[2] * f)];
    }

    function rgb(c) {
        return 'rgb(' + c[0] + ',' + c[1] + ',' + c[2] + ')';
    }

    function rect(c, x, y, w, h, style) {
        c.fillStyle = style;
        c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
    }

    function planet(c, cx, cy, r, top, bottom, opts) {
        opts = opts || {};
        cx = Math.round(cx);
        cy = Math.round(cy);
        r = Math.max(2, Math.round(r));

        // Ring, drawn behind the body.
        if (opts.ring) {
            const R = r * (opts.ring.scale || 1.95);
            const inner = r * 1.25;
            const gapAt = opts.ring.gap ? R * 0.88 : -1;
            const gapW = opts.ring.gap ? R * opts.ring.gap : 0;
            for (let a = 0; a < Math.PI * 2; a += 0.035) {
                const ca = Math.cos(a);
                const sa = Math.sin(a);
                for (let rr = inner; rr <= R; rr += 0.5) {
                    if (gapAt > 0 && Math.abs(rr - gapAt) < gapW) continue;
                    const fade = 0.32 + 0.55 * (1 - (rr - inner) / (R - inner));
                    rect(c, cx + ca * rr, cy + sa * rr * 0.3, 1, 1,
                        'rgba(' + opts.ring.color + ',' + fade.toFixed(2) + ')');
                }
            }
        }

        // Body — lit from the upper right, with optional gas bands.
        for (let y = -r; y <= r; y++) {
            for (let x = -r; x <= r; x++) {
                const d2 = x * x + y * y;
                if (d2 > r * r) continue;
                let col = mix(bottom, top, (-x - 0.6 * y) / (2 * r) + 0.5);
                if (opts.bands) {
                    col = shade(col, 0.82 + 0.18 * Math.sin((y / r) * opts.bands * Math.PI));
                }
                const edge = Math.sqrt(d2) / r;
                if (edge > 0.82) col = shade(col, 1 - (edge - 0.82) * 0.9); // limb darkening
                rect(c, cx + x, cy + y, 1, 1, rgb(col));
            }
        }

        // Craters.
        if (opts.craters) {
            opts.craters.forEach(function (cr) {
                const ccx = cx + Math.round(cr[0] * r);
                const ccy = cy + Math.round(cr[1] * r);
                const crr = Math.max(1, Math.round(cr[2] * r));
                for (let y = -crr; y <= crr; y++) {
                    for (let x = -crr; x <= crr; x++) {
                        if (x * x + y * y > crr * crr) continue;
                        const dx = (ccx + x - cx) / r;
                        const dy = (ccy + y - cy) / r;
                        if (dx * dx + dy * dy > 1) continue;
                        rect(c, ccx + x, ccy + y, 1, 1, 'rgba(8,7,14,0.22)');
                    }
                }
                rect(c, ccx + crr - 1, ccy + crr - 1, 1, 1, 'rgba(255,235,210,0.16)');
            });
        }
    }

    function buildSky() {
        sky.width = GW;
        sky.height = GH;
        sctx.imageSmoothingEnabled = false;
        for (let y = 0; y < GH; y++) {
            const t = y / Math.max(1, GH - 1);
            const c = t < 0.45
                ? mix([12, 10, 22], [44, 24, 44], t / 0.45)
                : mix([44, 24, 44], [102, 60, 36], (t - 0.45) / 0.55);
            rect(sctx, 0, y, GW, 1, rgb(c));
        }
    }

    function buildForeground() {
        fg.width = GW;
        fg.height = GH;
        fctx.imageSmoothingEnabled = false;

        // Gas giant with a banded ring, a rocky world with craters, and a moon.
        planet(fctx, GW * 0.73, GH * 0.30, GH * 0.16, [186, 140, 96], [72, 48, 34],
            { ring: { color: '226,190,130', scale: 1.95, gap: 0.06 }, bands: 5 });
        planet(fctx, GW * 0.24, GH * 0.18, GH * 0.095, [132, 158, 192], [34, 46, 72],
            { craters: [[-0.3, -0.2, 0.28], [0.35, 0.25, 0.2], [0.12, -0.5, 0.16]] });
        planet(fctx, GW * 0.52, GH * 0.12, GH * 0.06, [208, 190, 214], [70, 62, 96],
            { craters: [[-0.2, 0.1, 0.3], [0.32, -0.22, 0.22]] });

        // Distant hills, then the near ridge the man stands on.
        const groundTop = Math.round(GH * 0.82);
        const midTop = groundTop - Math.round(GH * 0.07);
        for (let x = 0; x < GW; x++) {
            const m = Math.round(midTop - Math.sin((x / GW) * Math.PI * 2.2) * (GH * 0.02));
            rect(fctx, x, m, 1, groundTop - m, '#170f1d');
        }

        const ridge = [];
        for (let x = 0; x < GW; x++) {
            const top = Math.round(groundTop - Math.sin((x / GW) * Math.PI * 1.3) * (GH * 0.03));
            ridge.push(top);
            rect(fctx, x, top, 1, GH - top, '#0d0913');
            rect(fctx, x, top, 1, 1, 'rgba(140,86,50,0.28)'); // lit crest
        }
        // A few rocks and tufts breaking the ridge line.
        const bumps = Math.round(GW * 0.05);
        for (let i = 0; i < bumps; i++) {
            const x = Math.floor(seedRand() * GW);
            rect(fctx, x, ridge[x] - 1, 1, 1, '#0d0913');
        }

        // The man, feet planted on the ground, gazing up.
        const manW = MAN[0].length;
        const mx = Math.round(GW * 0.15);
        const my = groundTop - MAN.length + 2;
        for (let row = 0; row < MAN.length; row++) {
            for (let col = 0; col < manW; col++) {
                if (MAN[row][col] !== '#') continue;
                rect(fctx, mx + col, my + row, 1, 1, '#0b0812');
            }
        }
        // Rim light along the top contour, as if lit by the sky.
        for (let row = 0; row < MAN.length; row++) {
            for (let col = 0; col < manW; col++) {
                if (MAN[row][col] !== '#') continue;
                const above = row > 0 ? MAN[row - 1][col] : '.';
                if (above === '#') continue;
                rect(fctx, mx + col, my + row, 1, 1, 'rgba(232,182,120,0.85)');
            }
        }
    }

    function buildStars() {
        stars = [];
        const count = Math.round(GW * GH * 0.016);
        for (let i = 0; i < count; i++) {
            const x = Math.floor(seedRand() * GW);
            const y = Math.floor(seedRand() * GH * 0.62);
            const p = seedRand();
            let color = [200, 190, 230];
            let base = 0.4;
            if (p > 0.9) { color = [255, 255, 255]; base = 0.9; }
            else if (p > 0.55) { color = [255, 228, 190]; base = 0.7; }
            stars.push({
                x: x,
                y: y,
                color: color,
                base: base,
                phase: seedRand() * 6.283,
                speed: 0.5 + seedRand() * 1.8
            });
        }
    }

    function drawStars(t, animate) {
        for (let i = 0; i < stars.length; i++) {
            const s = stars[i];
            const a = animate
                ? s.base * (0.5 + 0.5 * Math.sin(t * 0.0016 * s.speed + s.phase))
                : s.base;
            if (a <= 0.03) continue;
            ctx.fillStyle = 'rgba(' + s.color[0] + ',' + s.color[1] + ',' + s.color[2] + ',' + a.toFixed(3) + ')';
            ctx.fillRect(s.x, s.y, 1, 1);
        }
    }

    function drawShootingStar(t) {
        const cycle = 7000;
        const p = (t % cycle) / cycle;
        if (p > 0.22) return;
        const q = p / 0.22;
        const fade = Math.sin(q * Math.PI);
        const sx = GW * (0.06 + q * 0.7);
        const sy = GH * (0.05 + q * 0.32);
        const len = Math.max(4, Math.round(GW * 0.06));
        for (let i = 0; i < len; i++) {
            const a = fade * (1 - i / len) * 0.9;
            ctx.fillStyle = 'rgba(255,246,220,' + a.toFixed(3) + ')';
            ctx.fillRect(Math.round(sx - i * 0.86), Math.round(sy - i * 0.5), 1, 1);
        }
    }

    function frame(t) {
        if (!GW || !GH) {
            rafId = requestAnimationFrame(frame);
            return;
        }
        ctx.drawImage(sky, 0, 0);
        drawStars(t, true);
        drawShootingStar(t);
        ctx.drawImage(fg, 0, 0);
        rafId = requestAnimationFrame(frame);
    }

    function start() {
        if (running || reduceMotion) return;
        running = true;
        rafId = requestAnimationFrame(frame);
    }

    function stop() {
        running = false;
        cancelAnimationFrame(rafId);
    }

    function render() {
        const size = canvas.getBoundingClientRect();
        if (!size.width || !size.height) return;
        GW = Math.max(80, Math.round(size.width / PIXEL));
        GH = Math.max(40, Math.round(size.height / PIXEL));
        canvas.width = GW;
        canvas.height = GH;
        ctx.imageSmoothingEnabled = false;

        buildSky();
        buildForeground();
        buildStars();

        if (reduceMotion) {
            ctx.drawImage(sky, 0, 0);
            drawStars(0, false);
            ctx.drawImage(fg, 0, 0);
        }
    }

    let resizeTimer;
    function scheduleRender() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(render, 120);
    }

    if ('ResizeObserver' in window) {
        new ResizeObserver(scheduleRender).observe(canvas);
    } else {
        window.addEventListener('resize', scheduleRender);
    }

    // Only animate while the masthead is on screen.
    if (!reduceMotion && 'IntersectionObserver' in window) {
        new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) start();
                else stop();
            });
        }).observe(canvas);
    }

    if (document.readyState === 'complete') {
        render();
        start();
    } else {
        window.addEventListener('load', function () {
            render();
            start();
        });
        render();
        start();
    }
})();

// Console greeting
console.log('%cVivek Khatri / backend + data systems', 'font-size: 16px; color: #0044cc; font-weight: bold;');
console.log('%cThanks for checking out the source.', 'font-size: 12px; color: #888;');
