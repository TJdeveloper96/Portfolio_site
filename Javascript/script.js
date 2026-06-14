const hero = document.getElementById("hero");
const cursor = document.querySelector(".cursor");
const outer = document.querySelector(".cursor__outer");
const inner = document.querySelector(".cursor__inner");
const label = document.querySelector(".cursor__label");

const hotspots = document.querySelectorAll(".hotspot");

const popup = document.getElementById("popup");
const popupContent = document.getElementById("popup-content");
const closeControls = document.querySelectorAll("[data-close-popup]");
const mobileCtaButtons = document.querySelectorAll(".mobile-cta__btn");
const mobileAboutButton = document.querySelector('.mobile-cta__btn[data-modal="about"]');
const homeHotspot = document.querySelector('.hotspot[data-modal="home"]');
const aboutHotspot = document.querySelector('.hotspot[data-modal="about"]');
const workHotspot = document.querySelector('.hotspot[data-modal="work"]');
const sceneHomeAnimation = document.querySelector("[data-scene-home-animation]");
const sceneHomeFrame = document.querySelector("[data-scene-home-frame]");
const sceneAboutAnimation = document.querySelector("[data-scene-about-animation]");
const sceneAboutFrame = document.querySelector("[data-scene-about-frame]");
let sceneHomeFrameTimer = null;
let sceneAboutFrameTimer = null;
let stopSceneHomeAnimation = () => {};
let stopSceneAboutAnimation = () => {};
let playSceneAboutAnimationOnce = () => {};

// Cursor state: raw pointer target, outer/inner cursor positions and previous values
let tx = -999, ty = -999;      // raw pointer target
let x = -999, y = -999;        // outer cursor position
let ix = -999, iy = -999;      // inner cursor position
let px = -999, py = -999;      // previous outer position (velocity)

let activeHotspot = null;

// Helper utilities: small math helpers and DOM helpers used below
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

function setSceneLight(target) {
  if (!hero) return;

  if (target) {
    hero.dataset.lightTarget = target;
    return;
  }

  delete hero.dataset.lightTarget;
}

function clearActiveHotspot() {
  if (activeHotspot) {
    setHotspotOffset(activeHotspot, 0, 0);
    activeHotspot = null;
  }
  if (cursor) cursor.classList.remove("is-hover");
  if (label) label.textContent = "";
}

function getLightTargetForModal(target) {
  if (target === "work") return "macbook";
  if (target === "cv") return "ipad";
  return "";
}

// Cursor visibility handlers: show/hide the custom cursor
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
  setSceneLight("");

  if (activeHotspot) setHotspotOffset(activeHotspot, 0, 0);
  activeHotspot = null;
  stopSceneHomeAnimation();
  stopSceneAboutAnimation();
}

// Hero area listeners: pointer events for the main scene
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

// Hotspot interactions: hover, leave and click handlers for hotspots
hotspots.forEach((el) => {
  el.addEventListener("pointerenter", () => {
    activeHotspot = el;
    cursor?.classList.add("is-hover");
    if (label) label.textContent = el.dataset.label || "";
    setSceneLight(getLightTargetForModal(el.dataset.modal));
  });

  const leaveHandler = () => {
    // ensure hover state and offsets are cleared even if pointer events are missed
    clearActiveHotspot();
    setSceneLight("");
  };

  el.addEventListener("pointerleave", leaveHandler);
  el.addEventListener("pointerout", leaveHandler);
  el.addEventListener("pointercancel", leaveHandler);

  el.addEventListener("click", (event) => {
    // If you're using popups instead of page scroll:
    event.preventDefault();
    // clear hover state immediately so the bubble doesn't stick when the popup overlays
    clearActiveHotspot();
    setSceneLight(getLightTargetForModal(el.dataset.modal));
    openPopup(el.dataset.modal);
  });
});

initSceneHomeAnimation();
initSceneAboutAnimation();

// Popup logic: load popup HTML, show and hide modals
async function openPopup(target) {
  if (!popup || !popupContent || !target) return;
  setSceneLight(getLightTargetForModal(target));
  stopSceneHomeAnimation();
  stopSceneAboutAnimation();

  const popupPath = `./popups/${target}.html`;

  try {
    const response = await fetch(popupPath, { cache: "no-store" });
    if (!response.ok) throw new Error(`Kan ${popupPath} niet ophalen`);

    const html = await response.text();
    popupContent.innerHTML = html;
    popup.dataset.activeModal = target;
    popup.hidden = false;
    return;
  } catch (error) {
    popupContent.innerHTML = `<p>De popup-inhoud kon niet worden geladen vanuit <code>${popupPath}</code>.</p>`;
    popup.dataset.activeModal = target;
    popup.hidden = false;
  }
}

function closePopup() {
  if (!popup) return;
  popup.hidden = true;
  delete popup.dataset.activeModal;
  setSceneLight("");
  popupContent?.replaceChildren();
  // clear any stuck hotspot hover state
  clearActiveHotspot();
}

function initSceneHomeAnimation() {
  if (!homeHotspot || !sceneHomeAnimation || !sceneHomeFrame) return;

  const frameMs = Number(sceneHomeAnimation.dataset.frameMs) || 180;
  const hoverFrames = ["./images/koffie 1.webp", "./images/koffie 2.webp"];
  const totalFrames = hoverFrames.length + 1;

  hoverFrames.forEach((src) => {
    const img = new Image();
    img.src = src;
  });

  let index = 0;

  function renderFrame() {
    if (index === 0) {
      sceneHomeFrame.style.opacity = "0";
      return;
    }

    sceneHomeFrame.src = hoverFrames[index - 1];
    sceneHomeFrame.style.opacity = "1";
  }

  function stopHomeAnimation() {
    if (sceneHomeFrameTimer) {
      clearInterval(sceneHomeFrameTimer);
      sceneHomeFrameTimer = null;
    }
    index = 0;
    renderFrame();
  }

  function startHomeAnimation() {
    if (sceneHomeFrameTimer) return;
    index = 1;
    renderFrame();
    sceneHomeFrameTimer = setInterval(() => {
      index = (index + 1) % totalFrames;
      renderFrame();
    }, frameMs);
  }

  stopSceneHomeAnimation = stopHomeAnimation;
  stopHomeAnimation();
  homeHotspot.addEventListener("pointerenter", startHomeAnimation);
  homeHotspot.addEventListener("pointerleave", stopHomeAnimation);
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
  aboutHotspot.addEventListener("pointerenter", startHeaderAnimation);
  aboutHotspot.addEventListener("pointerleave", stopHeaderAnimation);
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

// Mobile CTA buttons: open corresponding popup on tap/click
mobileCtaButtons.forEach((button) => {
  button.addEventListener("click", () => {
    openPopup(button.dataset.modal);
  });
});

// Popup close controls: backdrop, close button and Escape key handling
closeControls.forEach((el) => {
  el.addEventListener("click", closePopup);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closePopup();
});

// Main animation loop: magnetic cursor behavior, squish/rotation and hotspot magnetism
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

// loadscreen function

const MIN_LOADER_MS = 2000;
const loaderStartTime = performance.now();
const loaderAnimationContainer = document.getElementById("loader-lottie");

if (loaderAnimationContainer && window.lottie) {
  const loaderAnimation = window.lottie.loadAnimation({
    container: loaderAnimationContainer,
    renderer: "svg",
    loop: true,
    autoplay: true,
    path: "./Animaties/tea-cup.json",
  });
  loaderAnimation.setSpeed(2.0);
}

window.addEventListener("load", function() {
  const loadingScreen = document.getElementById("loading-screen");
  if (!loadingScreen) return;
  const elapsed = performance.now() - loaderStartTime;
  const waitMs = Math.max(0, MIN_LOADER_MS - elapsed);

  setTimeout(() => {
    loadingScreen.style.opacity = "0";
    // Wait for CSS fade-out transition before removing from layout.
    setTimeout(() => {
    loadingScreen.style.display = "none";
    }, 500);
  }, waitMs);
});
