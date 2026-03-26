import { getRandomItems, getAllKeywords, getAllEmotions } from "./adDataLoader.js";
import { extractFragment, extractDominantColor } from "./adCropper.js";
import { navigateTo } from "./mobileApp.js";

const MIN_SLIDES = 1;
const MAX_SLIDES = 8;
const FRAME_PADDING = 12;
const BOTTOM_BAR_H = 150;

let container = null;
let canvas = null;
let ctx = null;
let backBtn = null;
let totalSlides = 0;
let currentSlide = 0;
let slideItems = [];
let slideColors = [];
let vw = 0;
let vh = 0;
let holdTimer = null;
let paused = false;
let allKeywords = [];
let allEmotions = [];

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function pickAccentColor() {
  const h = Math.floor(rand(0, 360));
  return `hsl(${h},60%,55%)`;
}

function wrapText(text, maxWidth, font) {
  ctx.font = font;
  const words = text.split(/\s+/);
  const lines = [];
  let current = "";
  for (const word of words) {
    const test = current ? current + " " + word : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

async function renderSlide(index) {
  if (!ctx) return;
  const item = slideItems[index % slideItems.length];
  const bgColor = slideColors[index % slideColors.length] || "#222";

  ctx.fillStyle = "#111";
  ctx.fillRect(0, 0, vw, vh);

  const artX = FRAME_PADDING;
  const artY = 24;
  const artW = vw - FRAME_PADDING * 2;
  const artH = vh - artY - BOTTOM_BAR_H;

  ctx.fillStyle = bgColor;
  ctx.globalAlpha = 0.35;
  ctx.fillRect(artX, artY, artW, artH);
  ctx.globalAlpha = 1;

  try {
    const bgW = Math.round(artW * 0.95);
    const bgH = Math.round(artH * 0.75);
    const bg = await extractFragment(item, bgW, bgH);
    ctx.save();
    ctx.globalAlpha = 0.75;
    ctx.drawImage(bg, artX + (artW - bgW) / 2, artY + artH * 0.08, bgW, bgH);
    ctx.restore();
  } catch (_) {}

  for (let i = 0; i < 3; i++) {
    const overlayItem = slideItems[(index + i + 1) % slideItems.length];
    try {
      const ow = Math.round(rand(artW * 0.2, artW * 0.5));
      const oh = Math.round(rand(artH * 0.1, artH * 0.3));
      const frag = await extractFragment(overlayItem, ow, oh);
      ctx.save();
      ctx.globalAlpha = rand(0.12, 0.4);
      ctx.globalCompositeOperation = Math.random() > 0.5 ? "screen" : "multiply";
      const fx = artX + rand(0, artW - ow);
      const fy = artY + rand(0, artH - oh);
      ctx.translate(fx + ow / 2, fy + oh / 2);
      ctx.rotate(rand(-0.08, 0.08));
      ctx.drawImage(frag, -ow / 2, -oh / 2, ow, oh);
      ctx.restore();
    } catch (_) {}
  }

  const wash = ctx.createLinearGradient(0, 0, vw, vh);
  wash.addColorStop(0, pickAccentColor());
  wash.addColorStop(1, pickAccentColor());
  ctx.save();
  ctx.globalCompositeOperation = "overlay";
  ctx.globalAlpha = 0.12;
  ctx.fillStyle = wash;
  ctx.fillRect(artX, artY, artW, artH);
  ctx.restore();

  drawScatteredText(item, artX, artY, artW, artH);

  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = 1;
  ctx.strokeRect(artX, artY, artW, artH);

  drawProgressBar(index);
  drawBottomCaption(item);
}

function drawScatteredText(item, ax, ay, aw, ah) {
  const texts = [];

  if (item.brand) {
    texts.push({ text: `@${item.brand}`, weight: "700", size: 18, alpha: 0.6 });
  }

  for (const e of item.emotionorsense || []) {
    texts.push({ text: e, weight: "300", size: rand(13, 20), alpha: rand(0.25, 0.55) });
  }

  for (const kw of item.keywords || []) {
    texts.push({ text: `#${kw}`, weight: "400", size: rand(11, 16), alpha: rand(0.2, 0.5) });
  }

  const extras = Math.floor(rand(2, 5));
  for (let i = 0; i < extras; i++) {
    const pool = Math.random() > 0.5 ? allKeywords : allEmotions;
    if (pool.length) {
      const pick = pool[Math.floor(Math.random() * pool.length)];
      texts.push({ text: pick, weight: "400", size: rand(10, 15), alpha: rand(0.12, 0.35) });
    }
  }

  if (item.adtext && item.adtext.length > 3) {
    const snippet = item.adtext.length > 50
      ? item.adtext.slice(0, 50) + "\u2026"
      : item.adtext;
    texts.push({ text: `"${snippet}"`, weight: "300", size: 12, alpha: rand(0.2, 0.45) });
  }

  for (const t of texts) {
    ctx.save();
    ctx.globalAlpha = t.alpha;
    ctx.font = `${t.weight} ${Math.round(t.size)}px ui-sans-serif, system-ui, sans-serif`;
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    const tx = ax + rand(8, aw - 80);
    const ty = ay + rand(20, ah - 20);
    const angle = rand(-0.06, 0.06);
    ctx.translate(tx, ty);
    ctx.rotate(angle);
    ctx.fillText(t.text, 0, 0);
    ctx.restore();
  }
}

function drawProgressBar(index) {
  const barY = 8;
  const barH = 2.5;
  const gap = 3;
  const totalGap = (totalSlides - 1) * gap;
  const segW = (vw - 24 - totalGap) / totalSlides;

  for (let i = 0; i < totalSlides; i++) {
    const sx = 12 + i * (segW + gap);
    ctx.fillStyle = i <= index
      ? "rgba(255,255,255,0.85)"
      : "rgba(255,255,255,0.2)";
    drawPillRect(ctx, sx, barY, segW, barH, barH / 2);
    ctx.fill();
  }
}

function drawBottomCaption(item) {
  const captionY = vh - BOTTOM_BAR_H;

  ctx.fillStyle = "rgba(0,0,0,0.65)";
  ctx.fillRect(0, captionY, vw, BOTTOM_BAR_H);

  ctx.save();
  let ty = captionY + 14;

  if (item.brand) {
    ctx.font = "700 14px ui-sans-serif, system-ui, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(item.brand, FRAME_PADDING, ty);
    ty += 20;
  }

  if (item.adtext) {
    const lines = wrapText(item.adtext, vw - FRAME_PADDING * 2 - 80, "400 11px ui-sans-serif, system-ui, sans-serif");
    ctx.font = "400 11px ui-sans-serif, system-ui, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    for (let i = 0; i < Math.min(lines.length, 2); i++) {
      ctx.fillText(lines[i], FRAME_PADDING, ty);
      ty += 14;
    }
  }

  const btns = [];
  if (item.emotionorsense?.length) btns.push(item.emotionorsense[0]);
  if (item.keywords?.length) btns.push(item.keywords[0]);
  btns.push("shop now");

  let bx = FRAME_PADDING;
  for (const label of btns) {
    ctx.font = "600 10px ui-sans-serif, system-ui, sans-serif";
    const tw = ctx.measureText(label).width;
    const bw = tw + 16;
    const bh = 22;
    const by = ty + 4;

    ctx.fillStyle = "rgba(255,255,255,0.1)";
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.lineWidth = 0.5;
    drawPillRect(ctx, bx, by, bw, bh, bh / 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(label, bx + 8, by + bh / 2);
    bx += bw + 6;
  }

  ctx.restore();
}

function drawPillRect(target, x, y, w, h, r) {
  r = Math.min(r, h / 2, w / 2);
  target.beginPath();
  target.moveTo(x + r, y);
  target.lineTo(x + w - r, y);
  target.quadraticCurveTo(x + w, y, x + w, y + r);
  target.lineTo(x + w, y + h - r);
  target.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  target.lineTo(x + r, y + h);
  target.quadraticCurveTo(x, y + h, x, y + h - r);
  target.lineTo(x, y + r);
  target.quadraticCurveTo(x, y, x + r, y);
  target.closePath();
}

function goToSlide(index) {
  if (index < 0) {
    navigateTo("feed");
    return;
  }
  if (index >= totalSlides) {
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

  totalSlides = MIN_SLIDES + Math.floor(Math.random() * (MAX_SLIDES - MIN_SLIDES + 1));

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

  allKeywords = getAllKeywords();
  allEmotions = getAllEmotions();

  slideItems = getRandomItems(null, totalSlides);
  if (!slideItems.length) slideItems = getRandomItems(null, totalSlides);

  slideColors = [];
  for (const item of slideItems) {
    try {
      slideColors.push(await extractDominantColor(item));
    } catch (_) {
      slideColors.push(pickAccentColor());
    }
  }

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
  slideColors = [];
  allKeywords = [];
  allEmotions = [];
  paused = false;
}
