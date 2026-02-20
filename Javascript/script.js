const hero = document.getElementById("hero");               // the scene wrapper (div.scene#hero)
const cursor = document.querySelector(".cursor");
const outer = document.querySelector(".cursor__outer");
const inner = document.querySelector(".cursor__inner");
const label = document.querySelector(".cursor__label");

const hotspots = document.querySelectorAll(".hotspot");

const popup = document.getElementById("popup");
const popupTitle = document.getElementById("popup-title");
const popupContent = document.getElementById("popup-content");
const closeControls = document.querySelectorAll("[data-close-popup]");
const mobileCtaButtons = document.querySelectorAll(".mobile-cta__btn");
const mobileAboutButton = document.querySelector('.mobile-cta__btn[data-modal="about"]');
const aboutHotspot = document.querySelector('.hotspot[data-modal="about"]');
const sceneAboutAnimation = document.querySelector("[data-scene-about-animation]");
const sceneAboutFrame = document.querySelector("[data-scene-about-frame]");
let sceneAboutFrameTimer = null;
let stopSceneAboutAnimation = () => {};
let playSceneAboutAnimationOnce = () => {};

// =======================
// CURSOR STATE
// =======================
let tx = -999, ty = -999;      // raw pointer target
let x = -999, y = -999;        // outer cursor position
let ix = -999, iy = -999;      // inner cursor position
let px = -999, py = -999;      // previous outer position (velocity)

let activeHotspot = null;

// =======================
// HELPERS
// =======================
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

function hotspotCenter(el) {
  const r = el.getBoundingClientRect();
  return { cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
}

function setHotspotOffset(el, ox, oy) {
  if (!el) return;
  // Stored on the <a.hotspot>, applied via CSS to its child shapes
  el.style.setProperty("--hx", `${ox}px`);
  el.style.setProperty("--hy", `${oy}px`);
}

// =======================
// CURSOR VISIBILITY
// =======================
function showCursor(e) {
  if (e?.clientX != null) tx = e.clientX;
  if (e?.clientY != null) ty = e.clientY;
  if (cursor) cursor.style.opacity = "1";
}

function hideCursor() {
  if (!cursor) return;

  cursor.style.opacity = "0";
  cursor.classList.remove("is-hover", "is-down");
  if (label) label.textContent = "";

  if (activeHotspot) setHotspotOffset(activeHotspot, 0, 0);
  activeHotspot = null;
  stopSceneAboutAnimation();
}

// =======================
// HERO LISTENERS
// =======================
if (hero) {
  hero.addEventListener("pointerenter", showCursor);
  hero.addEventListener("pointerleave", hideCursor);

  hero.addEventListener("pointermove", (e) => {
    tx = e.clientX;
    ty = e.clientY;
  });

  hero.addEventListener("pointerdown", () => cursor?.classList.add("is-down"));
  hero.addEventListener("pointerup", () => cursor?.classList.remove("is-down"));
}

// =======================
// HOTSPOT HOVER + CLICK
// =======================
hotspots.forEach((el) => {
  el.addEventListener("mouseenter", () => {
    activeHotspot = el;
    cursor?.classList.add("is-hover");
    if (label) label.textContent = el.dataset.label || "";
  });

  el.addEventListener("mouseleave", () => {
    cursor?.classList.remove("is-hover");
    if (label) label.textContent = "";
    setHotspotOffset(el, 0, 0);
    activeHotspot = null;
  });

  el.addEventListener("click", (event) => {
    // If you're using popups instead of page scroll:
    event.preventDefault();
    openPopup(el.dataset.modal, el.dataset.title || el.dataset.label);
  });
});

initSceneAboutAnimation();

// =======================
// POP-UP LOGIC
// =======================
async function openPopup(target, fallbackTitle = "") {
  if (!popup || !popupTitle || !popupContent || !target) return;
  stopSceneAboutAnimation();

  const fileTitle = fallbackTitle || target;
  const popupPath = `./popups/${target}.html`;

  try {
    const response = await fetch(popupPath);
    if (!response.ok) throw new Error(`Failed to fetch ${popupPath}`);

    const html = await response.text();
    popupTitle.textContent = fileTitle;
    popupContent.innerHTML = html;
    popup.hidden = false;
    return;
  } catch (error) {
    popupTitle.textContent = fileTitle;
    popupContent.innerHTML = `<p>Could not load popup content from <code>${popupPath}</code>.</p>`;
    popup.hidden = false;
  }
}

function closePopup() {
  if (!popup) return;
  popup.hidden = true;
  popupContent?.replaceChildren();
  if (popupTitle) popupTitle.textContent = "";
}

function initSceneAboutAnimation() {
  if (!aboutHotspot || !sceneAboutAnimation || !sceneAboutFrame) return;

  const frameMs = Number(sceneAboutAnimation.dataset.frameMs) || 170;
  const idleFrame = "./images/hand 1.webp";
  const hoverFrames = ["./images/hand 2.webp", "./images/hand 3.webp"];

  [idleFrame, ...hoverFrames].forEach((src) => {
    const img = new Image();
    img.src = src;
  });

  let index = 0;

  function stopHeaderAnimation() {
    if (sceneAboutFrameTimer) {
      clearInterval(sceneAboutFrameTimer);
      sceneAboutFrameTimer = null;
    }
    sceneAboutFrame.src = idleFrame;
    sceneAboutFrame.style.opacity = "1";
    index = 0;
  }

  function startHeaderAnimation() {
    if (sceneAboutFrameTimer) return;
    sceneAboutFrame.style.opacity = "1";
    sceneAboutFrame.src = hoverFrames[index];
    sceneAboutFrameTimer = setInterval(() => {
      index = (index + 1) % hoverFrames.length;
      sceneAboutFrame.src = hoverFrames[index];
    }, frameMs);
  }

  let mobileStopTimer = null;
  function startHeaderAnimationOnceMobile() {
    startHeaderAnimation();
    if (mobileStopTimer) clearTimeout(mobileStopTimer);
    mobileStopTimer = setTimeout(() => {
      stopHeaderAnimation();
      mobileStopTimer = null;
    }, 900);
  }

  stopSceneAboutAnimation = stopHeaderAnimation;
  playSceneAboutAnimationOnce = startHeaderAnimationOnceMobile;
  stopHeaderAnimation();
  aboutHotspot.addEventListener("mouseenter", startHeaderAnimation);
  aboutHotspot.addEventListener("mouseleave", stopHeaderAnimation);
}

// Mobile has no hover: play animation when "About" is tapped.
if (mobileAboutButton && window.matchMedia("(pointer: coarse)").matches) {
  mobileAboutButton.addEventListener("touchstart", () => {
    playSceneAboutAnimationOnce();
  }, { passive: true });
  mobileAboutButton.addEventListener("click", () => {
    playSceneAboutAnimationOnce();
  });
}

// =======================
// MOBILE CTA -> POP-UP
// =======================
mobileCtaButtons.forEach((button) => {
  button.addEventListener("click", () => {
    openPopup(button.dataset.modal, button.dataset.title || button.textContent?.trim());
  });
});

// =======================
// POP-UP CLOSE CONTROLS
// =======================
closeControls.forEach((el) => {
  el.addEventListener("click", closePopup);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closePopup();
});

// =======================
// ANIMATION LOOP (MAGNETIC + SQUISH)
// =======================
(function tick() {
  // Magnetic target defaults to raw pointer
  let mx = tx, my = ty;

  if (activeHotspot) {
    const { cx, cy } = hotspotCenter(activeHotspot);

    const dx = cx - tx;
    const dy = cy - ty;

    // Distance-based magnet strength
    const dist = Math.hypot(dx, dy);
    const maxDist = 260;                         // bigger = magnet works from farther away
    const t = clamp(1 - dist / maxDist, 0, 1);
    const strength = 0.55 * (t * t);             // smooth curve

    // Pull cursor target toward hotspot center
    mx = tx + dx * strength;
    my = ty + dy * strength;

    // Hotspot leans toward cursor
    const ox = clamp(-dx * 0.06, -10, 10);
    const oy = clamp(-dy * 0.06, -10, 10);
    setHotspotOffset(activeHotspot, ox, oy);
  }

  // Follow magnetic target (outer slower, inner faster)
  ix = lerp(ix, mx, 0.35);  iy = lerp(iy, my, 0.35);
  x  = lerp(x,  mx, 0.16);  y  = lerp(y,  my, 0.16);

  // Velocity for squish + rotation
  const vx = x - px, vy = y - py;
  px = x; py = y;

  const speed = Math.hypot(vx, vy);
  const s = clamp(speed * 0.03, 0, 0.35);
  const rot = Math.atan2(vy, vx) * (180 / Math.PI);

  if (cursor) cursor.style.transform = `translate3d(${x}px, ${y}px, 0)`;

  if (outer) {
    outer.style.setProperty("--sx", (1 + s).toFixed(3));
    outer.style.setProperty("--sy", (1 - s * 0.6).toFixed(3));
    outer.style.setProperty("--rot", `${rot.toFixed(1)}deg`);
  }

  if (inner) {
    const ddx = (ix - x) * 0.35;
    const ddy = (iy - y) * 0.35;
    inner.style.transform = `translate(calc(-50% + ${ddx}px), calc(-50% + ${ddy}px))`;
  }

  requestAnimationFrame(tick);
})();
