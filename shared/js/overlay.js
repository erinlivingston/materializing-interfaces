const baseElement = document.getElementById("material-base");
const placeholder = document.querySelector(".material-placeholder");
const isDesktopView = document.documentElement.dataset.view === "desktop";
const windowLayer = document.getElementById("window-layer");
const urlParams = new URLSearchParams(window.location.search);
const DEBUG_ENABLED = urlParams.get("debugZones") === "1";
const SHOW_ZONES = urlParams.get("showZones") === "1";
const CONFIG_PATH = "../assets/windows.config.json";
const DEBUG_VIEW_SCALE = 1.65;

let topZIndex = 10;
let windowsConfig = [];
let lastConfigJson = null;
let selectedWindowElement = null;
let debugCursor = 0;
let paperSources = [];
let openWindowIds = new Set();
let windowDrag = {
  active: false,
  pointerId: null,
  el: null,
  moveHandler: null,
  endHandler: null,
};
let debugState = {
  enabled: DEBUG_ENABLED,
  drawMode: "rect",
  zoneKind: "click",
  currentDraftElement: null,
  dragPointerId: null,
  dragStart: null,
};

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function chance(probability) {
  const p = Number(probability);
  if (!Number.isFinite(p) || p <= 0) return false;
  if (p >= 1) return true;
  return Math.random() < p;
}

function toFixed3(value) {
  return Number(value.toFixed(3));
}

function loadBaseBackground() {
  if (!baseElement) return;
  const src = baseElement.dataset.baseSrc;
  if (!src) return;
  const img = new Image();
  img.onload = () => {
    baseElement.style.backgroundImage = `url("${src}")`;
    if (placeholder) placeholder.style.display = "none";
  };
  img.onerror = () => {
    if (!placeholder) return;
    placeholder.style.display = "grid";
    placeholder.textContent = "Upload your desktop background asset and update data-base-src.";
  };
  img.src = src;
}

async function loadWindowsConfig() {
  const response = await fetch(CONFIG_PATH, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Unable to load ${CONFIG_PATH}`);
  }
  const json = await response.json();
  return json;
}

function getWindowById(id) {
  return windowsConfig.find((item) => item.id === id) || null;
}

function getScaledWidthPx(configJson, windowDef) {
  const reference = configJson?.sizing?.reference || {};
  const baseId = reference.baseWindowId;
  const targetBaseWidthPx = Number(reference.targetBaseWidthPx) || 420;
  const baseWindow = getWindowById(baseId);
  const baseCm = Number(baseWindow?.sizeCm?.width);
  const currentCm = Number(windowDef?.sizeCm?.width);
  if (!baseCm || !currentCm) {
    return clamp(Math.round(window.innerWidth * 0.32), 220, 480);
  }
  const scaledWidth = (currentCm / baseCm) * targetBaseWidthPx;
  return clamp(Math.round(scaledWidth), 120, Math.round(window.innerWidth * 0.8));
}

function getWindowAspectRatio(windowDef) {
  const widthCm = Number(windowDef.sizeCm?.width);
  const heightCm = Number(windowDef.sizeCm?.height);
  if (!widthCm || !heightCm) return 0.7;
  return heightCm / widthCm;
}

function bringToFront(windowElement) {
  topZIndex += 1;
  windowElement.style.zIndex = `${topZIndex}`;
}

function getWidthOverHeight(windowDef) {
  const ar = getWindowAspectRatio(windowDef);
  return ar > 0 ? 1 / ar : 1;
}

function normalizeZoneShape(zone) {
  const raw = (zone.shape || "").toString().toLowerCase();
  if (raw === "circle") return "circle";
  if (raw === "rect" || raw === "rectangle") return "rect";
  if (zone.r != null && zone.x != null && zone.y != null) return "circle";
  if (zone.w != null && zone.h != null && zone.x != null && zone.y != null) return "rect";
  return "rect";
}

function positionZoneElement(el, zone, widthOverHeight) {
  const shape = normalizeZoneShape(zone);
  if (shape === "circle") {
    const x = Number(zone.x);
    const y = Number(zone.y);
    const r = Number(zone.r);
    el.style.left = `${(x - r) * 100}%`;
    el.style.top = `${(y - r * widthOverHeight) * 100}%`;
    el.style.width = `${2 * r * 100}%`;
    el.style.aspectRatio = "1";
    el.style.height = "auto";
    return;
  }
  el.style.left = `${Number(zone.x) * 100}%`;
  el.style.top = `${Number(zone.y) * 100}%`;
  el.style.width = `${Number(zone.w) * 100}%`;
  el.style.height = `${Number(zone.h) * 100}%`;
}

function getActionDef(windowDef, actionId) {
  const map = windowDef.actions || {};
  if (actionId && map[actionId]) {
    return map[actionId];
  }
  const builtins = {
    closeSelf: { type: "window.closeSelf" },
    close_tab: { type: "window.closeSelf" },
    spawnRandom: { type: "window.spawnRandom" },
    spawn_tab: { type: "window.spawnRandom" },
    openAbstractFromPool: {
      type: "window.spawnFromPoolNonDuplicate",
      poolIds: [
        "img_5489",
        "img_5490",
        "img_5492",
        "img_5495",
        "img_5496",
        "img_5497",
        "img_5498",
        "img_5499",
        "img_5501",
        "img_5511",
      ],
      spillToPaperChance: 0.1,
      fallback: "paper",
    },
    spawnPaper: { type: "window.spawnDigitalPaper" },
    openStart: { type: "window.openProjectPage", pageId: "start" },
    openCodeEditorInfo: { type: "window.spawnCodeEditorInfo" },
    minimizeSelf: { type: "window.minimizeToggle" },
    maximizeSelf: { type: "window.maximizeToggle" },
  };
  if (actionId && builtins[actionId]) {
    return builtins[actionId];
  }
  if (typeof actionId === "string" && actionId.startsWith("project.")) {
    return { type: "window.openProjectPage", pageId: actionId.slice("project.".length) };
  }
  return null;
}

function runAction(def, ctx) {
  if (!def || !def.type) {
    return;
  }
  const configJson = ctx.configJson || lastConfigJson;
  switch (def.type) {
    case "window.closeSelf":
      ctx.container.remove();
      openWindowIds.delete(ctx.windowDef?.id);
      void refreshHistoryInTextZones();
      break;
    case "window.spawnRandom": {
      if (!windowsConfig.length || !windowLayer || !configJson) break;
      const pick = pickRandomSpawnableAbstractWindow();
      if (pick) spawnWindow(configJson, pick);
      break;
    }
    case "window.spawnFromPoolNonDuplicate": {
      if (!windowLayer || !configJson) break;
      const pool = Array.isArray(def.poolIds) ? def.poolIds : [];
      if (!pool.length) break;
      if (chance(def.spillToPaperChance)) {
        spawnDigitalPaperWindow();
        break;
      }
      const available = pool.filter((id) => !openWindowIds.has(id));
      if (!available.length) {
        if (def.fallback === "paper") {
          spawnDigitalPaperWindow();
        } else {
          const pick = pickRandomSpawnableAbstractWindow();
          if (pick) spawnWindow(configJson, pick);
        }
        break;
      }
      const id = available[randomInt(0, available.length - 1)];
      const target = getWindowById(id);
      if (target) {
        spawnWindowByIdNonDuplicate(configJson, target.id);
      }
      break;
    }
    case "window.spawnWindowByIdNonDuplicate": {
      if (!windowLayer || !configJson) break;
      spawnWindowByIdNonDuplicate(configJson, def.targetId);
      break;
    }
    case "window.spawnDigitalPaper":
      spawnDigitalPaperWindow();
      break;
    case "window.openProjectPage":
      spawnProjectPageWindow(def.pageId);
      break;
    case "window.spawnCodeEditorInfo":
      spawnWindowByIdNonDuplicate(configJson, "img_5491");
      break;
    case "window.minimizeToggle": {
      const container = ctx.container;
      if (!container?.classList) break;
      container.classList.toggle("desktop-window--minimized");
      break;
    }
    case "window.maximizeToggle": {
      const container = ctx.container;
      if (!container?.classList) break;
      const isMax = container.classList.toggle("desktop-window--maximized");
      if (isMax) {
        container.dataset.prevLeft = container.style.left || "";
        container.dataset.prevTop = container.style.top || "";
        container.dataset.prevWidth = container.style.width || "";
        container.style.left = "10px";
        container.style.top = "10px";
        container.style.width = `${Math.max(320, Math.round(window.innerWidth - 20))}px`;
        bringToFront(container);
      } else {
        if (container.dataset.prevLeft != null) container.style.left = container.dataset.prevLeft;
        if (container.dataset.prevTop != null) container.style.top = container.dataset.prevTop;
        if (container.dataset.prevWidth != null) container.style.width = container.dataset.prevWidth;
      }
      break;
    }
    default:
      break;
  }
}

function populateRuntimeZones(zonesLayer, windowDef, configJson, container) {
  container._desktopConfigJson = configJson;
  const zones = windowDef.zones || {};
  const widthOverHeight = getWidthOverHeight(windowDef);
  const clickZones = Array.isArray(zones.click) ? zones.click : [];
  const showLabels = SHOW_ZONES || debugState.enabled;

  clickZones.forEach((zone, index) => {
    const el = document.createElement("button");
    el.type = "button";
    el.className = "zone-click";
    el.dataset.zoneId = zone.id || `click_${index}`;
    positionZoneElement(el, zone, widthOverHeight);
    if (normalizeZoneShape(zone) === "circle") {
      el.style.borderRadius = "50%";
    }
    el.setAttribute("aria-label", zone.id || "Window control");
    el.tabIndex = -1;
    el.addEventListener("click", (event) => {
      event.stopPropagation();
      const inferredActionId = inferActionIdFromZone(zone);
      const raw = zone.actionId;
      const actionId = raw && raw !== "replace_action_id" ? raw : inferredActionId;
      const def = getActionDef(windowDef, actionId);
      runAction(def, { container, windowDef, configJson });
    });
    zonesLayer.appendChild(el);

    if (showLabels) {
      const label = document.createElement("div");
      label.className = "zone-label zone-label--click";
      label.textContent = `${zone.id || `click_${index}`} (click)`;
      positionZoneElement(label, zone, widthOverHeight);
      zonesLayer.appendChild(label);
    }
  });

  if (windowDef.role === "interactive") {
    const textZones = Array.isArray(zones.text) ? zones.text : [];
    textZones.forEach((zone, index) => {
      const el = document.createElement("div");
      el.className = "zone-text";
      el.dataset.zoneId = zone.id || `text_${index}`;
      positionZoneElement(el, zone, widthOverHeight);
      if (normalizeZoneShape(zone) === "circle") {
        el.style.borderRadius = "50%";
      }
      zonesLayer.appendChild(el);

      if (showLabels) {
        const label = document.createElement("div");
        label.className = "zone-label zone-label--text";
        label.textContent = `${zone.id || `text_${index}`} (text)`;
        positionZoneElement(label, zone, widthOverHeight);
        zonesLayer.appendChild(label);
      }
    });
  }
}

function endWindowDrag() {
  const { el, pointerId, moveHandler, endHandler } = windowDrag;
  if (el && moveHandler) {
    el.removeEventListener("pointermove", moveHandler);
  }
  if (el && endHandler) {
    el.removeEventListener("pointerup", endHandler);
    el.removeEventListener("pointercancel", endHandler);
  }
  if (el && pointerId != null) {
    try {
      el.releasePointerCapture(pointerId);
    } catch (_) {
      /* ignore */
    }
  }
  windowDrag.active = false;
  windowDrag.el = null;
  windowDrag.pointerId = null;
  windowDrag.moveHandler = null;
  windowDrag.endHandler = null;
}

function startWindowDrag(event, container) {
  if (windowDrag.active || debugState.dragPointerId != null) {
    return;
  }
  const rect = container.getBoundingClientRect();
  const offsetX = event.clientX - rect.left;
  const offsetY = event.clientY - rect.top;
  windowDrag.active = true;
  windowDrag.pointerId = event.pointerId;
  windowDrag.el = container;

  const moveHandler = (e) => {
    if (e.pointerId !== windowDrag.pointerId) return;
    let left = e.clientX - offsetX;
    let top = e.clientY - offsetY;
    const w = container.offsetWidth;
    const h = container.offsetHeight;
    left = clamp(left, 0, Math.max(0, window.innerWidth - w));
    top = clamp(top, 0, Math.max(0, window.innerHeight - h));
    container.style.left = `${left}px`;
    container.style.top = `${top}px`;
  };

  const endHandler = (e) => {
    if (e.pointerId !== windowDrag.pointerId) return;
    endWindowDrag();
  };

  windowDrag.moveHandler = moveHandler;
  windowDrag.endHandler = endHandler;
  container.addEventListener("pointermove", moveHandler);
  container.addEventListener("pointerup", endHandler);
  container.addEventListener("pointercancel", endHandler);
  try {
    container.setPointerCapture(event.pointerId);
  } catch (_) {
    /* ignore */
  }
}

function createDraftZoneElement() {
  const draft = document.createElement("div");
  draft.className = "zone-draft";
  return draft;
}

function setDraftVisual(draft, shape, x, y, w, h) {
  draft.dataset.shape = shape;
  draft.style.left = `${x}px`;
  draft.style.top = `${y}px`;
  draft.style.width = `${w}px`;
  draft.style.height = `${h}px`;
}

function getZoneLayerMetrics(zonesLayer) {
  const rect = zonesLayer.getBoundingClientRect();
  return { rect, width: rect.width, height: rect.height };
}

function positionWindowAnywhere(winWidth, winHeight) {
  const padding = 16;
  const maxLeft = Math.max(padding, window.innerWidth - winWidth - padding);
  const maxTop = Math.max(padding, window.innerHeight - winHeight - padding);
  return {
    left: randomInt(padding, maxLeft),
    top: randomInt(padding, maxTop),
  };
}

function createWindowElement(configJson, windowDef, left, top) {
  const width = getScaledWidthPx(configJson, windowDef);
  const container = document.createElement("article");
  container.className = "desktop-window";
  container.dataset.windowId = windowDef.id;
  if (windowDef.nickname) {
    container.dataset.nickname = windowDef.nickname;
  }
  container.style.width = `${width}px`;
  container.style.left = `${left}px`;
  container.style.top = `${top}px`;
  bringToFront(container);

  const frame = document.createElement("div");
  frame.className = "desktop-window__frame";

  const image = document.createElement("img");
  image.className = "desktop-window__image";
  image.src = windowDef.src;
  image.alt = `${windowDef.id} window`;
  image.addEventListener("dragstart", (event) => event.preventDefault());

  const zonesLayer = document.createElement("div");
  zonesLayer.className = "window-zones";
  populateRuntimeZones(zonesLayer, windowDef, configJson, container);

  container.addEventListener("pointerdown", (event) => {
    bringToFront(container);
    if (debugState.enabled) {
      selectedWindowElement = container;
      syncDebugStatus();
      if (event.button === 0 && event.shiftKey) {
        beginDraw(event, container, zonesLayer);
        return;
      }
    }
    if (event.button !== 0) {
      return;
    }
    const target = event.target;
    if (
      target.closest?.(".zone-click") ||
      target.closest?.(".zone-text") ||
      target.closest?.(".zone-draft")
    ) {
      return;
    }
    startWindowDrag(event, container);
  });
  container.addEventListener("pointermove", (event) => {
    if (!debugState.enabled) return;
    updateDraw(event, container, zonesLayer);
  });
  container.addEventListener("pointerup", (event) => {
    if (!debugState.enabled) return;
    finishDraw(event, container, zonesLayer);
  });

  frame.append(image, zonesLayer);
  container.append(frame);
  return container;
}

function beginDraw(event, container, zonesLayer) {
  if (!debugState.enabled || event.button !== 0 || !event.shiftKey) return;
  event.preventDefault();
  event.stopPropagation();
  const { rect, width, height } = getZoneLayerMetrics(zonesLayer);
  if (width < 2 || height < 2) {
    return;
  }
  const startX = clamp(event.clientX - rect.left, 0, width);
  const startY = clamp(event.clientY - rect.top, 0, height);
  debugState.dragPointerId = event.pointerId;
  debugState.dragStart = { x: startX, y: startY, w: width, h: height };
  debugState.currentDraftElement = createDraftZoneElement();
  zonesLayer.appendChild(debugState.currentDraftElement);
  container.setPointerCapture(event.pointerId);
  setDraftVisual(debugState.currentDraftElement, debugState.drawMode, startX, startY, 1, 1);
}

function updateDraw(event, container, zonesLayer) {
  if (debugState.dragPointerId !== event.pointerId || !debugState.currentDraftElement || !debugState.dragStart) return;
  const { rect, width, height } = getZoneLayerMetrics(zonesLayer);
  if (width < 2 || height < 2) {
    return;
  }
  const currentX = clamp(event.clientX - rect.left, 0, width);
  const currentY = clamp(event.clientY - rect.top, 0, height);
  const startX = debugState.dragStart.x;
  const startY = debugState.dragStart.y;
  const x = Math.min(startX, currentX);
  const y = Math.min(startY, currentY);
  const w = Math.max(1, Math.abs(currentX - startX));
  const h = Math.max(1, Math.abs(currentY - startY));
  if (debugState.drawMode === "circle") {
    const size = Math.max(w, h);
    setDraftVisual(debugState.currentDraftElement, "circle", x, y, size, size);
    return;
  }
  setDraftVisual(debugState.currentDraftElement, "rect", x, y, w, h);
}

function finishDraw(event, container, zonesLayer) {
  if (debugState.dragPointerId !== event.pointerId || !debugState.currentDraftElement) return;
  event.preventDefault();
  const { rect, width, height } = getZoneLayerMetrics(zonesLayer);
  if (width < 2 || height < 2) {
    return;
  }
  const draftRect = debugState.currentDraftElement.getBoundingClientRect();
  const relX = draftRect.left - rect.left;
  const relY = draftRect.top - rect.top;
  const relW = draftRect.width;
  const relH = draftRect.height;
  const zone = buildZoneSnippet(container.dataset.windowId, relX, relY, relW, relH, width, height);
  writeZoneSnippet(zone);
  debugState.currentDraftElement.remove();
  debugState.currentDraftElement = null;
  debugState.dragPointerId = null;
  debugState.dragStart = null;
  try {
    container.releasePointerCapture(event.pointerId);
  } catch (_) {
    /* ignore */
  }
}

function buildZoneSnippet(windowId, x, y, w, h, totalW, totalH) {
  if (debugState.drawMode === "circle") {
    const rPx = Math.max(w, h) / 2;
    return {
      windowId,
      zoneKind: debugState.zoneKind,
      snippet: {
        id: "new_circle_zone",
        shape: "circle",
        x: toFixed3((x + rPx) / totalW),
        y: toFixed3((y + rPx) / totalH),
        r: toFixed3(rPx / totalW),
        actionId: "replace_action_id"
      }
    };
  }

  return {
    windowId,
    zoneKind: debugState.zoneKind,
    snippet: {
      id: "new_rect_zone",
      shape: "rect",
      x: toFixed3(x / totalW),
      y: toFixed3(y / totalH),
      w: toFixed3(w / totalW),
      h: toFixed3(h / totalH),
      actionId: "replace_action_id"
    }
  };
}

function writeZoneSnippet(payload) {
  const output = document.getElementById("zone-json-output");
  if (!output) return;
  const text = JSON.stringify(payload.snippet, null, 2);
  output.value = text;
  output.dataset.windowId = payload.windowId;
  output.dataset.zoneKind = payload.zoneKind;
  syncDebugStatus();
}

function syncDebugStatus() {
  const status = document.getElementById("zone-debug-status");
  if (!status) return;
  const targetId = selectedWindowElement?.dataset?.windowId || "(none)";
  const nick = selectedWindowElement?.dataset?.nickname;
  const label = nick ? `${targetId} (${nick})` : targetId;
  status.textContent = `selected=${label} mode=${debugState.drawMode} type=${debugState.zoneKind}`;
}

function createDebugPanel(configJson) {
  if (!debugState.enabled || !isDesktopView) return;
  const panel = document.createElement("aside");
  panel.className = "zone-debug-panel";
  panel.innerHTML = `
    <div class="zone-debug-row">
      <strong>Zone Edit Mode</strong>
      <span id="zone-debug-status"></span>
    </div>
    <div class="zone-debug-row">
      <label>Shape
        <select id="zone-shape-select">
          <option value="rect">rect</option>
          <option value="circle">circle</option>
        </select>
      </label>
      <label>Kind
        <select id="zone-kind-select">
          <option value="click">click</option>
          <option value="text">text</option>
        </select>
      </label>
    </div>
    <div class="zone-debug-row">
      Hold <code>Shift</code> and drag on a selected window.
    </div>
    <div class="zone-debug-row">
      <button id="zone-prev-window-btn" type="button">Prev Window</button>
      <button id="zone-next-window-btn" type="button">Next Window</button>
    </div>
    <textarea id="zone-json-output" rows="10" spellcheck="false" placeholder="Draw a zone to generate JSON..."></textarea>
    <div class="zone-debug-row">
      <button id="zone-copy-btn" type="button">Copy JSON</button>
    </div>
  `;
  document.body.appendChild(panel);

  const shapeSelect = document.getElementById("zone-shape-select");
  const kindSelect = document.getElementById("zone-kind-select");
  const copyBtn = document.getElementById("zone-copy-btn");
  const output = document.getElementById("zone-json-output");
  const prevWindowBtn = document.getElementById("zone-prev-window-btn");
  const nextWindowBtn = document.getElementById("zone-next-window-btn");

  if (shapeSelect) {
    shapeSelect.addEventListener("change", () => {
      debugState.drawMode = shapeSelect.value;
      syncDebugStatus();
    });
  }
  if (kindSelect) {
    kindSelect.addEventListener("change", () => {
      debugState.zoneKind = kindSelect.value;
      syncDebugStatus();
    });
  }
  if (copyBtn && output) {
    copyBtn.addEventListener("click", async () => {
      if (!output.value.trim()) return;
      await navigator.clipboard.writeText(output.value);
      copyBtn.textContent = "Copied";
      setTimeout(() => {
        copyBtn.textContent = "Copy JSON";
      }, 1200);
    });
  }
  if (prevWindowBtn) {
    prevWindowBtn.addEventListener("click", () => {
      spawnDebugWindowByIndex(configJson, debugCursor - 1);
    });
  }
  if (nextWindowBtn) {
    nextWindowBtn.addEventListener("click", () => {
      spawnDebugWindowByIndex(configJson, debugCursor + 1);
    });
  }
  syncDebugStatus();
}

function pickRandomWindowDefs(amount) {
  const defs = [...windowsConfig];
  for (let i = defs.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [defs[i], defs[j]] = [defs[j], defs[i]];
  }
  return defs.slice(0, Math.min(amount, defs.length));
}

function collectVisibleTextZones() {
  if (!windowLayer) return [];
  /** @type {Element[]} */
  const zones = [];
  windowLayer.querySelectorAll(":scope > .desktop-window").forEach((win) => {
    win.querySelectorAll(".zone-text").forEach((z) => zones.push(z));
  });
  return zones;
}

async function refreshHistoryInTextZones() {
  if (!windowLayer || !isDesktopView) return;
  const zones = collectVisibleTextZones();
  try {
    const { loadHistoryPoetryLines, fillTextZonesWithHistory } = await import(
      "./browserHistoryPoetry.js"
    );
    const lines = await loadHistoryPoetryLines();
    fillTextZonesWithHistory(zones, lines);
  } catch (err) {
    console.error(err);
  }
}

function clearWindows() {
  if (!windowLayer) return;
  windowLayer.innerHTML = "";
  selectedWindowElement = null;
  openWindowIds = new Set();
}

function spawnWindow(configJson, windowDef) {
  if (!windowLayer) return;
  if (!windowDef?.id) return;
  const aspectRatio = getWindowAspectRatio(windowDef);
  let tempWidth = getScaledWidthPx(configJson, windowDef);

  if (debugState.enabled) {
    tempWidth = Math.round(tempWidth * DEBUG_VIEW_SCALE);
    tempWidth = Math.min(tempWidth, Math.round(window.innerWidth * 0.92));
    const maxHeight = Math.round(window.innerHeight * 0.86);
    const predictedHeight = Math.round(tempWidth * aspectRatio);
    if (predictedHeight > maxHeight) {
      tempWidth = Math.round(maxHeight / aspectRatio);
    }
  }

  const fakeHeight = Math.round(tempWidth * aspectRatio);
  const { left, top } = debugState.enabled
    ? {
        left: Math.max(12, Math.round((window.innerWidth - tempWidth) / 2)),
        top: Math.max(12, Math.round((window.innerHeight - fakeHeight) / 2)),
      }
    : positionWindowAnywhere(tempWidth, fakeHeight);
  const win = createWindowElement(configJson, windowDef, left, top);
  win.style.width = `${tempWidth}px`;
  windowLayer.appendChild(win);
  selectedWindowElement = win;
  openWindowIds.add(windowDef.id);
  syncDebugStatus();
  void refreshHistoryInTextZones();
}

function getOpenWindowElementById(id) {
  if (!windowLayer || !id) return null;
  return windowLayer.querySelector(`:scope > .desktop-window[data-window-id="${CSS.escape(id)}"]`);
}

function spawnWindowByIdNonDuplicate(configJson, id) {
  if (!id || !configJson) return;
  const existing = getOpenWindowElementById(id);
  if (existing) {
    bringToFront(existing);
    return;
  }
  const def = getWindowById(id);
  if (!def) return;
  spawnWindow(configJson, def);
}

function pickRandomSpawnableAbstractWindow() {
  const candidates = windowsConfig.filter((w) => {
    if (!w || w.role !== "interactive") return false;
    if (w.id === "img_5491") return false;
    return true;
  });
  if (!candidates.length) return null;
  return candidates[randomInt(0, candidates.length - 1)];
}

function inferActionIdFromZone(zone) {
  if (!zone) return null;
  const x = Number(zone.x);
  const y = Number(zone.y);
  const r = Number(zone.r);
  const w = Number(zone.w);
  const h = Number(zone.h);
  const shape = normalizeZoneShape(zone);
  const isTopLeftCircle = shape === "circle" && Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(r) && x <= 0.16 && y <= 0.09;
  const isTopLeftRect = shape === "rect" && Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(w) && Number.isFinite(h) && x <= 0.08 && y <= 0.12 && w <= 0.08 && h <= 0.08;
  if (isTopLeftCircle || isTopLeftRect) {
    return "openAbstractFromPool";
  }
  return null;
}

function initPaperSources() {
  paperSources = [
    "../assets/freedigitalpaper/heather-green-KwLAeH5dHIY-unsplash copy.jpg",
    "../assets/freedigitalpaper/heather-green-Lz3lAvRD5Mc-unsplash copy.jpg",
    "../assets/freedigitalpaper/heather-green-bOrMAThd09M-unsplash copy.jpg",
    "../assets/freedigitalpaper/heather-green-hKfKmfvPY44-unsplash copy.jpg",
    "../assets/freedigitalpaper/heather-green-o2lxbgiGEh8-unsplash copy.jpg",
    "../assets/freedigitalpaper/joao-vitor-duarte-k4Lt0CjUnb0-unsplash copy.jpg",
    "../assets/freedigitalpaper/nordwood-themes-R53t-Tg6J4c-unsplash copy.jpg",
    "../assets/freedigitalpaper/olga-thelavart-vS3idIiYxX0-unsplash copy.jpg",
    "../assets/freedigitalpaper/plufow-le-studio-zAvE6uAPkZk-unsplash copy.jpg",
    "../assets/freedigitalpaper/resource-boy-zJBxYP-hIS8-unsplash copy.jpg",
  ];
}

function spawnDigitalPaperWindow() {
  if (!windowLayer || !paperSources.length) return;
  const src = paperSources[randomInt(0, paperSources.length - 1)];
  const container = document.createElement("article");
  container.className = "desktop-window desktop-window--paper";
  container.dataset.windowId = `paper_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  const width = clamp(Math.round(window.innerWidth * 0.32), 220, 520);
  container.style.width = `${width}px`;

  const img = new Image();
  img.className = "desktop-window__image";
  img.alt = "Digital paper";
  img.addEventListener("dragstart", (event) => event.preventDefault());
  img.onload = () => {
    const ar = img.naturalHeight && img.naturalWidth ? img.naturalHeight / img.naturalWidth : 0.7;
    const predictedHeight = Math.round(width * ar);
    const pos = positionWindowAnywhere(width, predictedHeight);
    container.style.left = `${pos.left}px`;
    container.style.top = `${pos.top}px`;
    bringToFront(container);
  };
  img.src = src;

  const frame = document.createElement("div");
  frame.className = "desktop-window__frame";
  frame.appendChild(img);
  container.appendChild(frame);

  container.addEventListener("pointerdown", (event) => {
    bringToFront(container);
    if (event.button !== 0) return;
    startWindowDrag(event, container);
  });

  windowLayer.appendChild(container);
}

async function spawnProjectPageWindow(pageId) {
  if (!windowLayer) return;
  const { getProjectPageById } = await import("./projectPages.js");
  const page = getProjectPageById(pageId);
  if (!page) return;
  const existing = windowLayer.querySelector(`:scope > .desktop-window[data-project-page-id="${CSS.escape(pageId)}"]`);
  if (existing) {
    bringToFront(existing);
    return;
  }

  const container = document.createElement("article");
  container.className = "desktop-window desktop-window--content desktop-window--project-page";
  container.dataset.windowId = `project_${pageId}`;
  container.dataset.projectPageId = pageId;
  container.style.width = `${clamp(Math.round(window.innerWidth * 0.38), 320, 640)}px`;
  bringToFront(container);

  const frame = document.createElement("div");
  frame.className = "desktop-window__frame desktop-window__frame--content";

  const header = document.createElement("div");
  header.className = "content-window__header";
  header.innerHTML = `
    <div class="content-window__controls" aria-hidden="true">
      <button type="button" class="content-window__control" data-action-id="closeSelf" tabindex="-1" aria-label="Close"></button>
      <button type="button" class="content-window__control" data-action-id="minimizeSelf" tabindex="-1" aria-label="Minimize"></button>
      <button type="button" class="content-window__control" data-action-id="maximizeSelf" tabindex="-1" aria-label="Maximize"></button>
    </div>
    <div class="content-window__title"></div>
  `;
  header.querySelector(".content-window__title").textContent = page.title || "Project";
  header.addEventListener("click", (event) => {
    const btn = event.target.closest?.("button[data-action-id]");
    if (!btn) return;
    const actionId = btn.dataset.actionId;
    const def = getActionDef({ actions: {} }, actionId);
    runAction(def, { container, windowDef: { id: container.dataset.windowId }, configJson: lastConfigJson });
  });

  const body = document.createElement("div");
  body.className = "content-window__body content-window__body--project";
  if (paperSources.length) {
    const src = paperSources[randomInt(0, paperSources.length - 1)];
    body.style.backgroundImage = `url("${src}")`;
  }
  body.innerHTML = page.html;
  const quickNav = document.createElement("p");
  quickNav.className = "project-window__quick-link";
  quickNav.innerHTML = `<a href="../mobile/index.html#feed" target="_blank" rel="noopener noreferrer">Open mobile feed</a>`;
  body.appendChild(quickNav);
  body.addEventListener("click", (event) => {
    const link = event.target.closest?.("a[data-project-link]");
    if (!link) return;
    event.preventDefault();
    const next = link.dataset.projectLink;
    if (!next) return;
    void spawnProjectPageWindow(next);
  });

  frame.append(header, body);
  container.appendChild(frame);

  container.addEventListener("pointerdown", (event) => {
    bringToFront(container);
    if (event.button !== 0) return;
    if (event.target.closest?.("button,a")) return;
    startWindowDrag(event, container);
  });

  const rect = { w: Number.parseInt(container.style.width, 10) || 420, h: 420 };
  const pos = positionWindowAnywhere(rect.w, rect.h);
  container.style.left = `${pos.left}px`;
  container.style.top = `${pos.top}px`;
  windowLayer.appendChild(container);
}

function spawnDebugWindowByIndex(configJson, index) {
  if (!windowsConfig.length) return;
  clearWindows();
  const safeIndex = ((index % windowsConfig.length) + windowsConfig.length) % windowsConfig.length;
  debugCursor = safeIndex;
  const windowDef = windowsConfig[safeIndex];
  spawnWindow(configJson, windowDef);
}

function spawnInitialDesktopWindows(configJson) {
  if (!windowLayer || !isDesktopView) return;
  if (debugState.enabled) {
    spawnDebugWindowByIndex(configJson, debugCursor);
    return;
  }
  let spawned = 0;
  let guard = 0;
  while (spawned < 3 && guard < 50) {
    guard += 1;
    const pick = pickRandomSpawnableAbstractWindow();
    if (!pick) break;
    spawnWindow(configJson, pick);
    spawned += 1;
  }
}

async function init() {
  loadBaseBackground();
  if (!isDesktopView) return;
  if (SHOW_ZONES) {
    document.querySelector(".viewport")?.classList.add("viewport--show-zones");
  }
  if (DEBUG_ENABLED) {
    document.querySelector(".viewport")?.classList.add("viewport--debug-zones");
  }
  initPaperSources();
  try {
    const configJson = await loadWindowsConfig();
    lastConfigJson = configJson;
    windowsConfig = Array.isArray(configJson?.windows) ? configJson.windows : [];
    spawnInitialDesktopWindows(configJson);
    await refreshHistoryInTextZones();
    createDebugPanel(configJson);

    const startBtn = document.getElementById("desktop-start-btn");
    if (startBtn) {
      startBtn.addEventListener("click", () => {
        const def = getActionDef({ actions: {} }, "openStart");
        runAction(def, { container: startBtn, windowDef: { id: "start" }, configJson });
      });
    }
    const codeIcon = document.getElementById("desktop-code-icon");
    if (codeIcon) {
      codeIcon.addEventListener("click", () => {
        const def = getActionDef({ actions: {} }, "openCodeEditorInfo");
        runAction(def, { container: codeIcon, windowDef: { id: "icon" }, configJson });
      });
    }
  } catch (error) {
    if (placeholder) {
      placeholder.style.display = "grid";
      placeholder.textContent = "Could not load windows.config.json";
    }
    console.error(error);
  }
}

init();
