import { getRandomItems } from "./adDataLoader.js";
import { extractFragment, extractDominantColor } from "./adCropper.js";
import { navigateTo } from "./mobileApp.js";
import { renderRisoAdCanvas } from "./risoAdRenderer.js";

const SCROLL_SPEED = 0.9;
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
let exportBtn = null;
let onExportClick = null;
let infoBtn = null;
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

let paperImg = null;
let paperPattern = null;
let marksCanvas = null;
let marksCtx = null;
let drawing = false;
let lastMarkT = 0;
let lastMarkX = 0;
let lastMarkY = 0;

// Tweak knobs
const PAPER_PATTERN_SCALE = 0.10; // smaller => finer texture
const MARK_R_MIN = 6;
const MARK_R_MAX = 10;
const MARK_ALPHA_MIN = 0.2;
const MARK_ALPHA_MAX = 0.3;
//line thickness
const MARK_LINE_MIN = 6;
const MARK_LINE_MAX = 10;

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function pickBlendMode() {
  return BLEND_MODES[Math.floor(Math.random() * BLEND_MODES.length)];
}

function loadPaperTexture() {
  if (paperImg) return;
  paperImg = new Image();
  paperImg.onload = () => {
    try {
      paperPattern = ctx?.createPattern?.(paperImg, "repeat") || null;
    } catch (_) {
      paperPattern = null;
    }
  };
  paperImg.src = new URL("../../assets/papertexture.jpg", import.meta.url).toString();
}

function ensureMarksLayer() {
  marksCanvas = document.createElement("canvas");
  marksCanvas.width = vw;
  marksCanvas.height = vh;
  marksCtx = marksCanvas.getContext("2d", { willReadFrequently: false });
}

function stampMark(x, y, strength = 1) {
  if (!marksCtx) return;

  const r = rand(MARK_R_MIN, MARK_R_MAX) * strength;
  const rot = rand(0, Math.PI * 2);

  marksCtx.save();
  marksCtx.translate(x, y);
  marksCtx.rotate(rot);
  marksCtx.globalCompositeOperation = "multiply";
  marksCtx.globalAlpha = rand(MARK_ALPHA_MIN, MARK_ALPHA_MAX) * strength;

  const grad = marksCtx.createRadialGradient(0, 0, 0, 0, 0, r);
  grad.addColorStop(0, "rgba(40,30,20,0.95)");
  grad.addColorStop(0.22, "rgba(60,45,30,0.55)");
  grad.addColorStop(0.5, "rgba(80,60,40,0.12)");
  grad.addColorStop(1, "rgba(0,0,0,0)");
  marksCtx.fillStyle = grad;
  marksCtx.beginPath();
  marksCtx.ellipse(0, 0, r * rand(0.75, 1.25), r * rand(0.6, 1.1), 0, 0, Math.PI * 2);
  marksCtx.fill();
  marksCtx.restore();
}

function strokeMark(x1, y1, x2, y2, strength = 1) {
  if (!marksCtx) return;
  const w = rand(MARK_LINE_MIN, MARK_LINE_MAX) * strength;

  marksCtx.save();
  marksCtx.globalCompositeOperation = "multiply";
  marksCtx.globalAlpha = rand(MARK_ALPHA_MIN, MARK_ALPHA_MAX) * strength;
  marksCtx.lineCap = "round";
  marksCtx.lineJoin = "round";
  marksCtx.lineWidth = w;
  marksCtx.strokeStyle = "rgba(55,40,25,0.9)";

  marksCtx.beginPath();
  marksCtx.moveTo(x1, y1);
  marksCtx.lineTo(x2, y2);
  marksCtx.stroke();
  marksCtx.restore();
}

function onPointerDown(e) {
  // Mouse/pen: allow dragging to draw.
  if (e.pointerType === "mouse" && e.button !== 0) return;
  drawing = e.pointerType !== "touch";
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  lastMarkX = x;
  lastMarkY = y;
  lastMarkT = performance.now();
  stampMark(x, y, 1);
}

function onPointerMove(e) {
  if (!drawing) return;
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const now = performance.now();
  const dist = Math.hypot(x - lastMarkX, y - lastMarkY);
  if (now - lastMarkT > 40 || dist > 18) {
    const strength = Math.min(1.5, Math.max(0.7, dist / 18));
    strokeMark(lastMarkX, lastMarkY, x, y, strength);
    lastMarkX = x;
    lastMarkY = y;
    lastMarkT = now;
  }
}

function onPointerUp() {
  drawing = false;
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

function getRisoInkOptions(item) {
  for (const e of item.emotionorsense || []) {
    const mapped = EMOTION_TO_RISO_INK[e];
    if (!mapped) continue;
    const options = parseInkOptions(mapped);
    if (options.length) return options;
  }

  // fallback: stable 1-ink choice based on first emotion
  const first = item.emotionorsense?.[0];
  if (!first) return ["BLACK"];
  let h = 0;
  const s = first.toString();
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return [RISO_FALLBACK_INKS[h % RISO_FALLBACK_INKS.length] || "BLACK"];
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
      const inkOptions = getRisoInkOptions(item);
      let risoCanvas = fragCanvas;
      try {
        risoCanvas = await renderRisoAdCanvas(fragCanvas, inkOptions, {
          maxDim: 220,
          ditherType: "floydsteinberg",
          threshold: 140,
          thresholdSpread: 26,
          maxInks: 3,
        });
      } catch (err) {
        console.warn("Riso render failed; falling back to original fragment.", {
          item: item?.imagefilename,
          inkOptions,
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
  if (paperPattern) {
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.fillStyle = paperPattern;
    // Scale the pattern so the paper grain reads finer/coarser.
    ctx.scale(PAPER_PATTERN_SCALE, PAPER_PATTERN_SCALE);
    ctx.fillRect(0, 0, vw / PAPER_PATTERN_SCALE, vh / PAPER_PATTERN_SCALE);
    ctx.restore();
  } else {
    ctx.fillStyle = "#f3efe3";
    ctx.fillRect(0, 0, vw, vh);
  }

  if (marksCanvas) {
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.drawImage(marksCanvas, 0, 0);
    ctx.restore();
  }

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

  exportBtn = document.createElement("button");
  exportBtn.className = "feed-export-btn";
  exportBtn.type = "button";
  exportBtn.textContent = "Export PNG";
  onExportClick = () => {
    try {
      // Render to an offscreen buffer so we can omit UI (story circles).
      const out = document.createElement("canvas");
      out.width = canvas.width;
      out.height = canvas.height;
      const octx = out.getContext("2d");
      if (!octx) throw new Error("No export 2d context");

      // Background paper
      if (paperPattern) {
        octx.save();
        octx.fillStyle = paperPattern;
        octx.scale(PAPER_PATTERN_SCALE, PAPER_PATTERN_SCALE);
        octx.fillRect(0, 0, vw / PAPER_PATTERN_SCALE, vh / PAPER_PATTERN_SCALE);
        octx.restore();
      } else {
        octx.fillStyle = "#f3efe3";
        octx.fillRect(0, 0, vw, vh);
      }

      // Marks layer (fixed to screen)
      if (marksCanvas) octx.drawImage(marksCanvas, 0, 0);

      // Fragments (scrolling)
      const buffer = vh * 0.3;
      for (let i = fragments.length - 1; i >= 0; i--) {
        const frag = fragments[i];
        const screenY = frag.y - scrollY;
        if (screenY + frag.h < -buffer) continue;
        if (screenY > vh + buffer) continue;
        octx.save();
        octx.globalAlpha = frag.alpha;
        octx.globalCompositeOperation = frag.blend;
        octx.translate(frag.x + frag.w / 2, screenY + frag.h / 2);
        octx.rotate(frag.rotation);
        octx.drawImage(frag.canvas, -frag.w / 2, -frag.h / 2, frag.w, frag.h);
        octx.restore();
      }

      // Break panels + text overlays (omit story circles)
      // Reuse the existing draw helpers by temporarily swapping ctx.
      const prevCtx = ctx;
      ctx = octx;
      drawBreakPanels();
      for (let i = textOverlays.length - 1; i >= 0; i--) {
        const t = textOverlays[i];
        const screenY = t.y - scrollY;
        if (screenY + 30 < -buffer) continue;
        if (screenY > vh + buffer) continue;
        octx.save();
        octx.globalAlpha = t.alpha;
        octx.fillStyle = "rgba(20,20,20,0.55)";
        octx.font = `${t.size}px ui-sans-serif, system-ui, sans-serif`;
        octx.fillText(t.text, t.x, screenY);
        octx.restore();
      }
      ctx = prevCtx;

      const url = out.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = `feed_${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.warn("Export failed:", err);
    }
  };
  exportBtn.addEventListener("click", onExportClick);
  container.appendChild(exportBtn);

  infoBtn = document.createElement("button");
  infoBtn.className = "mobile-info-btn";
  infoBtn.type = "button";
  infoBtn.textContent = "i";
  infoBtn.addEventListener("click", () => navigateTo("project"));
  container.appendChild(infoBtn);

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
  loadPaperTexture();
  ensureMarksLayer();

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
  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", onPointerUp);

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
    canvas.removeEventListener("pointerdown", onPointerDown);
    canvas.removeEventListener("pointermove", onPointerMove);
    canvas.removeEventListener("pointerup", onPointerUp);
    canvas.removeEventListener("pointercancel", onPointerUp);
  }
  if (backBtn) {
    backBtn.removeEventListener("click", onBackClick);
  }
  if (exportBtn) {
    if (onExportClick) exportBtn.removeEventListener("click", onExportClick);
    exportBtn.remove();
  }
  if (infoBtn) {
    infoBtn.remove();
  }
  if (container) container.innerHTML = "";
  canvas = null;
  ctx = null;
  backBtn = null;
  exportBtn = null;
  onExportClick = null;
  infoBtn = null;
  container = null;
  fragments = [];
  textOverlays = [];
  breakPanels = [];
  storyCircles = [];
  storyCircleColors = [];
  paperImg = null;
  paperPattern = null;
  marksCanvas = null;
  marksCtx = null;
  drawing = false;
}
