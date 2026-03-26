import { getRandomItems } from "./adDataLoader.js";
import { extractFragment, extractDominantColor } from "./adCropper.js";
import { navigateTo } from "./mobileApp.js";

const SCROLL_SPEED = 1.2;
const STORY_CIRCLE_COUNT = 10;
const BLEND_MODES = ["source-over", "multiply", "screen", "overlay"];
const EMOTION_COLORS = {
  "cozy": "rgba(210,170,110,0.18)",
  "comfort": "rgba(200,175,130,0.16)",
  "style": "rgba(160,140,190,0.14)",
  "adventure": "rgba(100,180,170,0.16)",
  "self-care": "rgba(190,150,170,0.15)",
  "home style": "rgba(170,160,130,0.14)",
  "creativity": "rgba(180,130,180,0.16)",
  "strength": "rgba(150,180,120,0.14)",
  "outdoors": "rgba(110,170,130,0.16)",
  "fun": "rgba(220,180,100,0.16)",
  "dog care": "rgba(180,160,120,0.14)",
  "cleanliness": "rgba(140,190,200,0.14)",
};
const DEFAULT_TINT = "rgba(170,160,150,0.12)";

let container = null;
let canvas = null;
let ctx = null;
let backBtn = null;
let animId = null;
let scrollY = 0;
let fragments = [];
let storyCircles = [];
let storyCircleColors = [];
let loading = false;
let lastSpawnY = 0;
let heatPhase = 0;
let textOverlays = [];
let dpr = 1;
let vw = 0;
let vh = 0;
let touchStartY = 0;
let touchVelocity = 0;
let lastTouchY = 0;
let lastTouchTime = 0;

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function pickBlendMode() {
  return BLEND_MODES[Math.floor(Math.random() * BLEND_MODES.length)];
}

function getTintColor(item) {
  for (const e of item.emotionorsense || []) {
    if (EMOTION_COLORS[e]) return EMOTION_COLORS[e];
  }
  return DEFAULT_TINT;
}

async function loadStoryCircles() {
  const items = getRandomItems(null, STORY_CIRCLE_COUNT);
  storyCircleColors = [];
  for (const item of items) {
    try {
      const color = await extractDominantColor(item);
      storyCircleColors.push({ color, item });
    } catch (_) { /* skip */ }
  }
}

async function spawnFragments(count) {
  if (loading) return;
  loading = true;
  const items = getRandomItems(null, count);
  for (const item of items) {
    const fragW = Math.round(rand(vw * 0.3, vw * 0.95));
    const fragH = Math.round(rand(vh * 0.15, vh * 0.55));
    try {
      const fragCanvas = await extractFragment(item, fragW * dpr, fragH * dpr);
      const x = rand(-fragW * 0.1, vw - fragW * 0.9);
      const y = lastSpawnY + rand(10, vh * 0.15);
      lastSpawnY = y + fragH * 0.2;
      fragments.push({
        canvas: fragCanvas,
        x, y,
        w: fragW, h: fragH,
        alpha: rand(0.45, 0.95),
        blend: pickBlendMode(),
        tint: getTintColor(item),
        rotation: rand(-0.04, 0.04),
      });

      if (Math.random() < 0.3) {
        const text = pickTextOverlay(item);
        if (text) {
          textOverlays.push({
            text,
            x: rand(vw * 0.05, vw * 0.6),
            y: y + rand(0, fragH * 0.6),
            alpha: rand(0.08, 0.25),
            size: Math.round(rand(12, 22)),
          });
        }
      }
    } catch (_) { /* skip */ }
  }
  loading = false;
}

function pickTextOverlay(item) {
  const pool = [];
  if (item.adtext) pool.push(item.adtext);
  for (const kw of item.keywords || []) pool.push(kw);
  for (const e of item.emotionorsense || []) pool.push(e);
  if (!pool.length) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

function drawHeatmapOverlay() {
  heatPhase += 0.004;
  const cx = vw * (0.5 + Math.sin(heatPhase * 0.7) * 0.3);
  const cy = (vh * 0.5 - scrollY % vh) + Math.cos(heatPhase) * vh * 0.2;
  const r = Math.max(vw, vh) * 0.7;
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  grad.addColorStop(0, "rgba(220,80,60,0.08)");
  grad.addColorStop(0.3, "rgba(240,180,50,0.06)");
  grad.addColorStop(0.6, "rgba(60,140,200,0.05)");
  grad.addColorStop(1, "rgba(40,30,80,0.02)");
  ctx.save();
  ctx.globalCompositeOperation = "overlay";
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, vw, vh);
  ctx.restore();
}

function drawStoryCircles() {
  if (!storyCircleColors.length) return;
  const size = Math.min(vw * 0.13, 48);
  const gap = 10;
  const startX = 12;
  const y = 14;

  for (let i = 0; i < storyCircleColors.length; i++) {
    const { color } = storyCircleColors[i];
    const cx = startX + i * (size + gap);

    if (cx > vw + size) break;

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();

    ctx.beginPath();
    ctx.arc(cx + size / 2, y + size / 2, size / 2 + 1, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255,255,255,0.45)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    storyCircles[i] = { x: cx, y, size };
  }
}

function handleFeedClick(e) {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  for (const circle of storyCircles) {
    if (!circle) continue;
    const cx = circle.x + circle.size / 2;
    const cy = circle.y + circle.size / 2;
    const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
    if (dist <= circle.size / 2 + 8) {
      navigateTo("stories");
      return;
    }
  }
}

function render() {
  scrollY += SCROLL_SPEED + touchVelocity;
  touchVelocity *= 0.96;
  if (Math.abs(touchVelocity) < 0.05) touchVelocity = 0;

  ctx.clearRect(0, 0, vw, vh);
  ctx.fillStyle = "#1a1a1a";
  ctx.fillRect(0, 0, vw, vh);

  const buffer = vh * 0.3;

  for (let i = fragments.length - 1; i >= 0; i--) {
    const frag = fragments[i];
    const screenY = frag.y - scrollY;
    if (screenY + frag.h < -buffer) {
      fragments.splice(i, 1);
      continue;
    }
    if (screenY > vh + buffer) continue;

    ctx.save();
    ctx.globalAlpha = frag.alpha;
    ctx.globalCompositeOperation = frag.blend;
    ctx.translate(frag.x + frag.w / 2, screenY + frag.h / 2);
    ctx.rotate(frag.rotation);
    ctx.drawImage(frag.canvas, -frag.w / 2, -frag.h / 2, frag.w, frag.h);

    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = frag.tint;
    ctx.fillRect(-frag.w / 2, -frag.h / 2, frag.w, frag.h);
    ctx.restore();
  }

  for (let i = textOverlays.length - 1; i >= 0; i--) {
    const t = textOverlays[i];
    const screenY = t.y - scrollY;
    if (screenY + 30 < -buffer) {
      textOverlays.splice(i, 1);
      continue;
    }
    if (screenY > vh + buffer) continue;
    ctx.save();
    ctx.globalAlpha = t.alpha;
    ctx.fillStyle = "rgba(240,235,225,0.9)";
    ctx.font = `${t.size}px ui-sans-serif, system-ui, sans-serif`;
    ctx.fillText(t.text, t.x, screenY);
    ctx.restore();
  }

  drawHeatmapOverlay();
  drawStoryCircles();

  const frontier = scrollY + vh + buffer;
  if (lastSpawnY < frontier && !loading) {
    spawnFragments(12);
  }

  animId = requestAnimationFrame(render);
}

function onTouchStart(e) {
  if (e.touches.length === 1) {
    touchStartY = e.touches[0].clientY;
    lastTouchY = touchStartY;
    lastTouchTime = performance.now();
    touchVelocity = 0;
  }
}

function onTouchMove(e) {
  if (e.touches.length === 1) {
    const now = performance.now();
    const dy = lastTouchY - e.touches[0].clientY;
    const dt = now - lastTouchTime;
    if (dt > 0) touchVelocity = (dy / dt) * 16;
    lastTouchY = e.touches[0].clientY;
    lastTouchTime = now;
    scrollY += dy;
  }
}

function onTouchEnd() {
  // velocity decays in render loop
}

function onWheel(e) {
  e.preventDefault();
  scrollY += e.deltaY * 0.5;
}

function onBackClick() {
  navigateTo("home");
}

export async function initFeed(el) {
  container = el;
  container.innerHTML = "";
  dpr = window.devicePixelRatio || 1;

  canvas = document.createElement("canvas");
  canvas.className = "feed-canvas";
  container.appendChild(canvas);

  backBtn = document.createElement("button");
  backBtn.className = "mobile-back-btn";
  backBtn.textContent = "\u2190";
  backBtn.addEventListener("click", onBackClick);
  container.appendChild(backBtn);

  vw = container.clientWidth;
  vh = container.clientHeight;
  canvas.width = vw;
  canvas.height = vh;
  canvas.style.width = vw + "px";
  canvas.style.height = vh + "px";

  ctx = canvas.getContext("2d");

  scrollY = 0;
  lastSpawnY = 0;
  fragments = [];
  textOverlays = [];
  storyCircles = [];
  storyCircleColors = [];
  heatPhase = 0;
  touchVelocity = 0;

  canvas.addEventListener("click", handleFeedClick);
  canvas.addEventListener("touchstart", onTouchStart, { passive: true });
  canvas.addEventListener("touchmove", onTouchMove, { passive: false });
  canvas.addEventListener("touchend", onTouchEnd, { passive: true });
  canvas.addEventListener("wheel", onWheel, { passive: false });

  await loadStoryCircles();
  await spawnFragments(15);

  animId = requestAnimationFrame(render);
}

export function destroyFeed() {
  if (animId) {
    cancelAnimationFrame(animId);
    animId = null;
  }
  if (canvas) {
    canvas.removeEventListener("click", handleFeedClick);
    canvas.removeEventListener("touchstart", onTouchStart);
    canvas.removeEventListener("touchmove", onTouchMove);
    canvas.removeEventListener("touchend", onTouchEnd);
    canvas.removeEventListener("wheel", onWheel);
  }
  if (backBtn) {
    backBtn.removeEventListener("click", onBackClick);
  }
  if (container) container.innerHTML = "";
  canvas = null;
  ctx = null;
  backBtn = null;
  container = null;
  fragments = [];
  textOverlays = [];
  storyCircles = [];
  storyCircleColors = [];
}
