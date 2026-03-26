import { getRandomItems } from "./adDataLoader.js";
import { extractFragment } from "./adCropper.js";
import { navigateTo } from "./mobileApp.js";

const TOTAL_SLIDES = 10;

let container = null;
let canvas = null;
let ctx = null;
let backBtn = null;
let currentSlide = 0;
let slideItems = [];
let vw = 0;
let vh = 0;
let holdTimer = null;
let paused = false;

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function pickColor() {
  const h = Math.floor(rand(0, 360));
  const s = Math.floor(rand(20, 60));
  const l = Math.floor(rand(30, 70));
  return `hsl(${h},${s}%,${l}%)`;
}

async function renderSlide(index) {
  if (!ctx) return;
  const item = slideItems[index % slideItems.length];

  ctx.fillStyle = "#111";
  ctx.fillRect(0, 0, vw, vh);

  try {
    const bgW = Math.round(vw * 0.95);
    const bgH = Math.round(vh * 0.7);
    const bg = await extractFragment(item, bgW, bgH);
    ctx.save();
    ctx.globalAlpha = 0.7;
    ctx.drawImage(bg, (vw - bgW) / 2, vh * 0.12, bgW, bgH);
    ctx.restore();
  } catch (_) { /* fallback to color */ }

  for (let i = 0; i < 3; i++) {
    const overlayItem = slideItems[(index + i + 1) % slideItems.length];
    try {
      const ow = Math.round(rand(vw * 0.2, vw * 0.5));
      const oh = Math.round(rand(vh * 0.1, vh * 0.3));
      const frag = await extractFragment(overlayItem, ow, oh);
      ctx.save();
      ctx.globalAlpha = rand(0.1, 0.4);
      ctx.globalCompositeOperation = Math.random() > 0.5 ? "screen" : "multiply";
      const fx = rand(-ow * 0.2, vw - ow * 0.8);
      const fy = rand(vh * 0.08, vh * 0.85 - oh);
      ctx.translate(fx + ow / 2, fy + oh / 2);
      ctx.rotate(rand(-0.08, 0.08));
      ctx.drawImage(frag, -ow / 2, -oh / 2, ow, oh);
      ctx.restore();
    } catch (_) { /* skip */ }
  }

  ctx.save();
  ctx.globalCompositeOperation = "overlay";
  const wash = ctx.createLinearGradient(0, 0, vw, vh);
  wash.addColorStop(0, pickColor());
  wash.addColorStop(1, pickColor());
  ctx.globalAlpha = 0.12;
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, vw, vh);
  ctx.restore();

  drawProgressBar(index);
  drawTextButtons(item);
}

function drawProgressBar(index) {
  const barY = 10;
  const barH = 3;
  const gap = 4;
  const totalGap = (TOTAL_SLIDES - 1) * gap;
  const segW = (vw - 20 - totalGap) / TOTAL_SLIDES;

  for (let i = 0; i < TOTAL_SLIDES; i++) {
    const sx = 10 + i * (segW + gap);
    ctx.fillStyle = i <= index
      ? "rgba(255,255,255,0.85)"
      : "rgba(255,255,255,0.25)";
    ctx.fillRect(sx, barY, segW, barH);
  }
}

function drawTextButtons(item) {
  const emotions = item.emotionorsense || [];
  const keywords = item.keywords || [];
  const pool = [...emotions, ...keywords];

  const btn1Text = pool.length > 0
    ? pool[Math.floor(Math.random() * pool.length)]
    : "shop now";
  const btn2Text = item.adtext
    ? item.adtext.slice(0, 28) + (item.adtext.length > 28 ? "..." : "")
    : "swipe up";

  drawButton(btn1Text, vw * 0.5, vh * 0.88);
  drawButton(btn2Text, vw * 0.5, vh * 0.94);
}

function drawPillRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawButton(text, cx, cy) {
  ctx.save();
  ctx.font = "600 14px ui-sans-serif, system-ui, sans-serif";
  const metrics = ctx.measureText(text);
  const padX = 18;
  const padY = 10;
  const bw = metrics.width + padX * 2;
  const bh = 28 + padY;

  ctx.fillStyle = "rgba(255,255,255,0.12)";
  ctx.strokeStyle = "rgba(255,255,255,0.4)";
  ctx.lineWidth = 1;
  const rx = cx - bw / 2;
  const ry = cy - bh / 2;
  drawPillRect(ctx, rx, ry, bw, bh, 14);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, cx, cy);
  ctx.restore();
}

function goToSlide(index) {
  if (index < 0) {
    navigateTo("feed");
    return;
  }
  if (index >= TOTAL_SLIDES) {
    navigateTo("feed");
    return;
  }
  currentSlide = index;
  renderSlide(currentSlide);
}

function handleClick(e) {
  if (paused) return;
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  if (x < vw * 0.35) {
    goToSlide(currentSlide - 1);
  } else {
    goToSlide(currentSlide + 1);
  }
}

function handlePointerDown() {
  holdTimer = setTimeout(() => { paused = true; }, 300);
}

function handlePointerUp() {
  clearTimeout(holdTimer);
  if (paused) {
    paused = false;
    renderSlide(currentSlide);
  }
}

function onStoriesBack() {
  navigateTo("home");
}

export async function initStories(el) {
  container = el;
  container.innerHTML = "";
  currentSlide = 0;
  paused = false;

  canvas = document.createElement("canvas");
  canvas.className = "stories-canvas";
  container.appendChild(canvas);

  backBtn = document.createElement("button");
  backBtn.className = "mobile-back-btn";
  backBtn.textContent = "\u2190";
  backBtn.addEventListener("click", onStoriesBack);
  container.appendChild(backBtn);

  vw = container.clientWidth;
  vh = container.clientHeight;
  canvas.width = vw;
  canvas.height = vh;
  canvas.style.width = vw + "px";
  canvas.style.height = vh + "px";

  ctx = canvas.getContext("2d");

  slideItems = getRandomItems(null, TOTAL_SLIDES);
  if (!slideItems.length) slideItems = getRandomItems(null, TOTAL_SLIDES);

  canvas.addEventListener("click", handleClick);
  canvas.addEventListener("pointerdown", handlePointerDown);
  canvas.addEventListener("pointerup", handlePointerUp);
  canvas.addEventListener("pointercancel", handlePointerUp);

  await renderSlide(0);
}

export function destroyStories() {
  if (canvas) {
    canvas.removeEventListener("click", handleClick);
    canvas.removeEventListener("pointerdown", handlePointerDown);
    canvas.removeEventListener("pointerup", handlePointerUp);
    canvas.removeEventListener("pointercancel", handlePointerUp);
  }
  if (backBtn) {
    backBtn.removeEventListener("click", onStoriesBack);
  }
  clearTimeout(holdTimer);
  if (container) container.innerHTML = "";
  canvas = null;
  ctx = null;
  backBtn = null;
  container = null;
  slideItems = [];
  paused = false;
}
