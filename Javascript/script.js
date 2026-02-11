const hero = document.getElementById("hero");
const cursor = document.querySelector(".cursor");
const label = document.querySelector(".cursor__label");

let mouseX = 0, mouseY = 0;
let x = -999, y = -999;

hero.addEventListener("mousemove", (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
});

function tick(){
  x += (mouseX - x) * 0.18;   // smooth follow
  y += (mouseY - y) * 0.18;
  cursor.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  requestAnimationFrame(tick);
}
tick();

document.querySelectorAll(".hotspot").forEach((el) => {
  el.addEventListener("mouseenter", () => { label.textContent = el.dataset.label; });
  el.addEventListener("mouseleave", () => { label.textContent = ""; });
});