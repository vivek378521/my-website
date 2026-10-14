// oneko.js (vendored)
// Original: https://github.com/adryd325/oneko.js — MIT License, Copyright © 2022 adryd.
// See oneko.LICENSE.txt. This copy is adapted to run confined inside a single
// container element ("stage") instead of following the cursor over the whole
// page. Animation + sprite logic is unchanged; only the coordinate space,
// bounds, and lifecycle are scoped to the stage.
//
// Usage:
//   <div data-oneko class="oneko-stage"></div>
//   <script src="oneko.js" data-cat="oneko.gif"></script>

(function oneko() {
    const stage = document.querySelector("[data-oneko]");
    if (!stage) return;

    const isReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const curScript = document.currentScript;
    let nekoFile = "oneko.gif";
    if (curScript && curScript.dataset.cat) {
        nekoFile = curScript.dataset.cat;
    }

    const SIZE = 32;
    const nekoSpeed = 6;

    let nekoPosX = 0;
    let nekoPosY = 0;
    let mousePosX = 0;
    let mousePosY = 0;
    let hasMouse = false;

    let frameCount = 0;
    let idleTime = 0;
    let idleAnimation = null;
    let idleAnimationFrame = 0;

    const spriteSets = {
        idle: [[-3, -3]],
        alert: [[-7, -3]],
        scratchSelf: [
            [-5, 0],
            [-6, 0],
            [-7, 0],
        ],
        scratchWallN: [
            [0, 0],
            [0, -1],
        ],
        scratchWallS: [
            [-7, -1],
            [-6, -2],
        ],
        scratchWallE: [
            [-2, -2],
            [-2, -3],
        ],
        scratchWallW: [
            [-4, 0],
            [-4, -1],
        ],
        tired: [[-3, -2]],
        sleeping: [
            [-2, 0],
            [-2, -1],
        ],
        N: [
            [-1, -2],
            [-1, -3],
        ],
        NE: [
            [0, -2],
            [0, -3],
        ],
        E: [
            [-3, 0],
            [-3, -1],
        ],
        SE: [
            [-5, -1],
            [-5, -2],
        ],
        S: [
            [-6, -3],
            [-7, -2],
        ],
        SW: [
            [-5, -3],
            [-6, -1],
        ],
        W: [
            [-4, -2],
            [-4, -3],
        ],
        NW: [
            [-1, 0],
            [-1, -1],
        ],
    };

    const nekoEl = document.createElement("div");
    nekoEl.className = "oneko";
    nekoEl.ariaHidden = true;
    nekoEl.style.width = SIZE + "px";
    nekoEl.style.height = SIZE + "px";
    nekoEl.style.position = "absolute";
    nekoEl.style.left = "0px";
    nekoEl.style.top = "0px";
    nekoEl.style.pointerEvents = "none";
    nekoEl.style.imageRendering = "pixelated";
    nekoEl.style.backgroundImage = "url(" + nekoFile + ")";
    nekoEl.style.backgroundRepeat = "no-repeat";
    stage.appendChild(nekoEl);

    function stageSize() {
        return { w: stage.clientWidth, h: stage.clientHeight };
    }

    function setSprite(name, frame) {
        const sprite = spriteSets[name][frame % spriteSets[name].length];
        nekoEl.style.backgroundPosition = sprite[0] * SIZE + "px " + sprite[1] * SIZE + "px";
    }

    function resetIdleAnimation() {
        idleAnimation = null;
        idleAnimationFrame = 0;
    }

    function idle() {
        idleTime += 1;

        const size = stageSize();

        if (
            idleTime > 10 &&
            Math.floor(Math.random() * 200) === 0 &&
            idleAnimation === null
        ) {
            const available = ["sleeping", "scratchSelf"];
            if (nekoPosX < 40) available.push("scratchWallW");
            if (nekoPosY < 40) available.push("scratchWallN");
            if (nekoPosX > size.w - 40) available.push("scratchWallE");
            if (nekoPosY > size.h - 40) available.push("scratchWallS");
            idleAnimation = available[Math.floor(Math.random() * available.length)];
        }

        switch (idleAnimation) {
            case "sleeping":
                if (idleAnimationFrame < 8) {
                    setSprite("tired", 0);
                    break;
                }
                setSprite("sleeping", Math.floor(idleAnimationFrame / 4));
                if (idleAnimationFrame > 192) {
                    resetIdleAnimation();
                }
                break;
            case "scratchWallN":
            case "scratchWallS":
            case "scratchWallE":
            case "scratchWallW":
            case "scratchSelf":
                setSprite(idleAnimation, idleAnimationFrame);
                if (idleAnimationFrame > 9) {
                    resetIdleAnimation();
                }
                break;
            default:
                setSprite("idle", 0);
                return;
        }
        idleAnimationFrame += 1;
    }

    function frame() {
        frameCount += 1;

        const size = stageSize();
        const minX = 16;
        const maxX = size.w - 16;
        const minY = 16;
        const maxY = size.h - 16;

        if (!hasMouse) {
            idle();
            return;
        }

        const diffX = nekoPosX - mousePosX;
        const diffY = nekoPosY - mousePosY;
        const distance = Math.sqrt(diffX * diffX + diffY * diffY);

        if (distance < nekoSpeed || distance < 40) {
            idle();
            return;
        }

        idleAnimation = null;
        idleAnimationFrame = 0;

        if (idleTime > 1) {
            setSprite("alert", 0);
            idleTime = Math.min(idleTime, 7);
            idleTime -= 1;
            return;
        }

        let direction = "";
        direction += diffY / distance > 0.5 ? "N" : "";
        direction += diffY / distance < -0.5 ? "S" : "";
        direction += diffX / distance > 0.5 ? "W" : "";
        direction += diffX / distance < -0.5 ? "E" : "";
        setSprite(direction, frameCount);

        nekoPosX -= (diffX / distance) * nekoSpeed;
        nekoPosY -= (diffY / distance) * nekoSpeed;

        nekoPosX = Math.min(Math.max(minX, nekoPosX), maxX);
        nekoPosY = Math.min(Math.max(minY, nekoPosY), maxY);

        nekoEl.style.left = nekoPosX - 16 + "px";
        nekoEl.style.top = nekoPosY - 16 + "px";
    }

    let lastFrameTimestamp;

    function onAnimationFrame(timestamp) {
        if (!nekoEl.isConnected) return;
        if (!lastFrameTimestamp) lastFrameTimestamp = timestamp;
        if (timestamp - lastFrameTimestamp > 100) {
            lastFrameTimestamp = timestamp;
            if (visible) frame();
        }
        requestAnimationFrame(onAnimationFrame);
    }

    stage.addEventListener("pointermove", function (event) {
        const r = stage.getBoundingClientRect();
        mousePosX = event.clientX - r.left;
        mousePosY = event.clientY - r.top;
        hasMouse = true;
    });

    stage.addEventListener("pointerleave", function () {
        hasMouse = false;
    });

    let visible = true;

    // --- init ---
    nekoPosX = stage.clientWidth / 2;
    nekoPosY = stage.clientHeight / 2;
    nekoEl.style.left = nekoPosX - 16 + "px";
    nekoEl.style.top = nekoPosY - 16 + "px";
    setSprite("idle", 0);

    if (isReducedMotion) {
        // Show a calm, static cat and skip the animation loop entirely.
        return;
    }

    if ("IntersectionObserver" in window) {
        new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                visible = entry.isIntersecting;
            });
        }).observe(stage);
    }

    requestAnimationFrame(onAnimationFrame);
})();
