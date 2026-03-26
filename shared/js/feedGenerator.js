import { getRandomItems } from "./adDataLoader.js";
import { extractFragment, extractDominantColor } from "./adCropper.js";
import { navigateTo } from "./mobileApp.js";
import { renderRisoAdCanvas } from "./risoAdRenderer.js";

const SCROLL_SPEED = .8;
const STORY_CIRCLE_COUNT = 9;
const MARGIN = 50;
const BLEND_MODES = ["source-over", "multiply", "screen", "overlay"];
const EMOTION_TO_RISO_INK = {
  cozy: "LIGHTTEAL, SEAFOAM",
  comfort: "SUNFLOWER, PAPRIKA",
  style: "AQUA, KELLYGREEN",
  adventure: "LAGOON,LAKE,HUNTERGREEN",
  "self-care": "VIOLET,CORNFLOWER",
  "home style": "DARKMAUVE,PINE",
  creativity: "LIGHTLIME,GREEN,PINE",
  strength: "MIDNIGHT,INDIGO",
  outdoors: "GRASS,IVY,MEDIUMBLUE",
  fun: "FLUORESCENTYELLOW,CRANBERRY,CRIMSON",
  "dog care": "STEEL,SMOKYTEAL",
  cleanliness: "MINT,CLEARMEDIUM,LAKE",
};

const RISO_FALLBACK_INKS = [
  "FLATGOLD",
  "ORCHID",
  "MOSS",
  "MIST",
  "SEAFOAM",
  "SKYBLUE",
  "PURPLE",
  "EMERALD",
  "BUBBLEGUM",
  "FLUORESCENTRED",
  "BLUE",
  "CHARCOAL",
];

function parseInkOptions(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v.map(String).map((s) => s.trim()).filter(Boolean);
  if (typeof v !== "string") return [String(v)];
  // Allow comma-separated ink lists in JSON-to-code mapping:
  // e.g. "fun": "FLUORESCENTYELLOW, SUNFLOWER"
  return v
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function hashStringToInt(str) {
  let h = 0;
  const s = String(str || "");
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

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
let breakPanels = [];
let spawnCounter = 0;
let dpr = 1;
let vw = 0;
let vh = 0;
let contentW = 0;
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

function getPrimaryRisoInk(item) {
  // 1) Use curated overrides for specific emotion strings.
  for (const e of item.emotionorsense || []) {
    const mapped = EMOTION_TO_RISO_INK[e];
    if (!mapped) continue;
    const options = parseInkOptions(mapped);
    if (!options.length) continue;
    if (options.length === 1) return options[0];

    // Pick deterministically so items don't flicker between refreshes.
    const seed = `${item.imagefilename || ""}:${e}`;
    const h = hashStringToInt(seed);
    return options[h % options.length];
  }

  // 2) If the JSON contains an emotion we don't explicitly map, hash it to a stable ink color.
  const first = item.emotionorsense?.[0];
  if (!first) return "BLACK";
  let h = 0;
  const s = first.toString();
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return RISO_FALLBACK_INKS[h % RISO_FALLBACK_INKS.length] || "BLACK";
}

async function loadStoryCircles() {
  const items = getRandomItems(null, STORY_CIRCLE_COUNT);
  storyCircleColors = [];

  // Pre-render riso icons so we don't re-run p5 every frame.
  // Circle visuals depend on the current canvas sizing, so compute once on init.
  const size = Math.min(vw * 0.13, 48);
  const iconSrcSize = Math.max(6, Math.round(size * dpr));

  for (const item of items) {
    try {
      const primaryInk = getPrimaryRisoInk(item);

      // Create a simple solid circle source (with transparency outside).
      const src = document.createElement("canvas");
      src.width = iconSrcSize;
      src.height = iconSrcSize;
      const sctx = src.getContext("2d");
      if (!sctx) continue;
      sctx.clearRect(0, 0, iconSrcSize, iconSrcSize);

      // Use a darker gray so the riso output is dense (full visual weight),
      // but keep the dot texture.
      sctx.fillStyle = `rgb(95,95,95)`;
      sctx.beginPath();
      sctx.arc(iconSrcSize / 2, iconSrcSize / 2, iconSrcSize / 2, 0, Math.PI * 2);
      sctx.closePath();
      sctx.fill();

      // Render the circle with the same riso+dither pipeline as ad fragments.
      const iconCanvas = await renderRisoAdCanvas(src, primaryInk, {
        maxDim: iconSrcSize,
        ditherType: "floydsteinberg",
        threshold: 150,
        alphaScale: 4,
      });

      storyCircleColors.push({ iconCanvas, item });
    } catch (_) {
      /* skip */
    }
  }
}

function insertBreakPanel(item, targetPanels = breakPanels) {
  const texts = [];
  if (item.brand) texts.push(item.brand);
  if (item.adtext) texts.push(item.adtext);
  const emotions = item.emotionorsense || [];
  if (emotions.length) texts.push(emotions.join(" \u00b7 "));
  if (!texts.length) return;

  const panelH = rand(50, 80);
  targetPanels.push({
    y: lastSpawnY,
    h: panelH,
    lines: texts.slice(0, 3),
  });
  lastSpawnY += panelH + 8;
}

async function spawnFragments(count) {
  if (loading) return;
  loading = true;
  const items = getRandomItems(null, count);

  // Build the entire batch first to avoid "partial" flashes while riso renders.
  const spawnedFragments = [];
  const spawnedTextOverlays = [];
  const spawnedBreakPanels = [];

  for (const item of items) {
    spawnCounter++;
    if (spawnCounter % 5 === 0) {
      insertBreakPanel(item, spawnedBreakPanels);
      continue;
    }

    const fragW = Math.round(rand(contentW * 0.4, contentW));
    const fragH = Math.round(rand(vh * 0.15, vh * 0.5));
    try {
      const fragCanvas = await extractFragment(item, fragW * dpr, fragH * dpr);
      const primaryInk = getPrimaryRisoInk(item);
      let risoCanvas = fragCanvas;
      try {
        risoCanvas = await renderRisoAdCanvas(fragCanvas, primaryInk, {
          maxDim: 220,
          ditherType: "floydsteinberg",
          threshold: 140,
        });
      } catch (err) {
        console.warn("Riso render failed; falling back to original fragment.", {
          item: item?.imagefilename,
          primaryInk,
          message: err?.message ? err.message : String(err),
          stack: err?.stack,
        });
      }
      const x = MARGIN + rand(0, contentW - fragW);
      const y = lastSpawnY + rand(6, vh * 0.12);
      lastSpawnY = y + fragH * 0.25;
      spawnedFragments.push({
        canvas: risoCanvas,
        x, y,
        w: fragW, h: fragH,
        alpha: rand(0.45, 0.95),
        blend: "source-over",
        rotation: rand(-0.04, 0.04),
      });

      if (Math.random() < 0.3) {
        const text = pickTextOverlay(item);
        if (text) {
          spawnedTextOverlays.push({
            text,
            x: MARGIN + rand(0, contentW * 0.5),
            y: y + rand(0, fragH * 0.6),
            alpha: rand(0.08, 0.25),
            size: Math.round(rand(12, 22)),
          });
        }
      }
    } catch (err) {
      /* skip */
      console.warn("Fragment spawn failed.", {
        item: item?.imagefilename,
        message: err?.message ? err.message : String(err),
        stack: err?.stack,
      });
    }
  }

  fragments.push(...spawnedFragments);
  textOverlays.push(...spawnedTextOverlays);
  breakPanels.push(...spawnedBreakPanels);
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
    const { iconCanvas } = storyCircleColors[i];
    const cx = startX + i * (size + gap);
    if (cx > vw + size) break;

    ctx.save();
    if (iconCanvas) {
      ctx.drawImage(iconCanvas, cx, y, size, size);
    } else {
      // Fallback: flat circle if icon generation failed.
      ctx.beginPath();
      ctx.arc(cx + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0,0,0,0.25)";
      ctx.fill();
    }
    ctx.restore();

    ctx.beginPath();
    ctx.arc(cx + size / 2, y + size / 2, size / 2 + 1, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(20,20,20,0.22)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    storyCircles[i] = { x: cx, y, size };
  }
}

function drawBreakPanels() {
  const buffer = vh * 0.3;
  for (let i = breakPanels.length - 1; i >= 0; i--) {
    const bp = breakPanels[i];
    const screenY = bp.y - scrollY;
    if (screenY + bp.h < -buffer) {
      breakPanels.splice(i, 1);
      continue;
    }
    if (screenY > vh + buffer) continue;

    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.03)";
    ctx.fillRect(MARGIN, screenY, contentW, bp.h);

    ctx.fillStyle = "rgba(30,20,40,0.55)";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    let ty = screenY + 10;
    for (let j = 0; j < bp.lines.length; j++) {
      const isFirst = j === 0;
      ctx.font = isFirst
        ? "600 13px ui-sans-serif, system-ui, sans-serif"
        : "400 11px ui-sans-serif, system-ui, sans-serif";
      ctx.globalAlpha = isFirst ? 0.7 : 0.45;
      ctx.fillText(bp.lines[j], MARGIN + 8, ty);
      ty += isFirst ? 18 : 15;
    }
    ctx.restore();
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
  ctx.fillStyle = "#f3efe3";
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
    ctx.restore();
  }

  drawBreakPanels();

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
    ctx.fillStyle = "rgba(20,20,20,0.55)";
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

function onTouchEnd() {}

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
  contentW = vw - MARGIN * 2;
  canvas.width = vw;
  canvas.height = vh;
  canvas.style.width = vw + "px";
  canvas.style.height = vh + "px";

  ctx = canvas.getContext("2d");

  scrollY = 0;
  lastSpawnY = 80;
  spawnCounter = 0;
  fragments = [];
  textOverlays = [];
  breakPanels = [];
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
  breakPanels = [];
  storyCircles = [];
  storyCircleColors = [];
}
