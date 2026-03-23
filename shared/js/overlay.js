const baseElement = document.getElementById("material-base");
const placeholder = document.querySelector(".material-placeholder");
const isDesktopView = document.documentElement.dataset.view === "desktop";
const windowLayer = document.getElementById("window-layer");

const windowAssetPaths = [
  "../assets/AbstractWindows/IMG_5489.png",
  "../assets/AbstractWindows/IMG_5490.png",
  "../assets/AbstractWindows/IMG_5491.png",
  "../assets/AbstractWindows/IMG_5492.png",
  "../assets/AbstractWindows/IMG_5495.png",
  "../assets/AbstractWindows/IMG_5496.png",
  "../assets/AbstractWindows/IMG_5497.png",
  "../assets/AbstractWindows/IMG_5498.png",
  "../assets/AbstractWindows/IMG_5499.png",
  "../assets/AbstractWindows/IMG_5500.png",
  "../assets/AbstractWindows/IMG_5501.png",
  "../assets/AbstractWindows/IMG_5502.png",
  "../assets/AbstractWindows/IMG_5503.png",
  "../assets/AbstractWindows/IMG_5504.png",
  "../assets/AbstractWindows/IMG_5505.png",
  "../assets/AbstractWindows/IMG_5506.png",
  "../assets/AbstractWindows/IMG_5507.png",
  "../assets/AbstractWindows/IMG_5508.png",
  "../assets/AbstractWindows/IMG_5509.png",
  "../assets/AbstractWindows/IMG_5510.png",
  "../assets/AbstractWindows/IMG_5511.png",
];

let topZIndex = 10;

function pickRandomAssets(amount) {
  const shuffled = [...windowAssetPaths];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, Math.min(amount, shuffled.length));
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function loadBaseBackground() {
  if (!baseElement) {
    return;
  }

  const src = baseElement.dataset.baseSrc;
  if (!src) {
    return;
  }

  const img = new Image();
  img.onload = () => {
    baseElement.style.backgroundImage = `url("${src}")`;
    if (placeholder) {
      placeholder.style.display = "none";
    }
  };
  img.onerror = () => {
    if (placeholder) {
      placeholder.style.display = "grid";
      placeholder.textContent =
        "Upload your desktop background asset and update data-base-src.";
    }
  };
  img.src = src;
}

function bringToFront(windowElement) {
  topZIndex += 1;
  windowElement.style.zIndex = `${topZIndex}`;
}

function createWindowElement(src, left, top) {
  const container = document.createElement("article");
  container.className = "desktop-window";
  container.style.left = `${left}px`;
  container.style.top = `${top}px`;
  bringToFront(container);

  const image = document.createElement("img");
  image.className = "desktop-window__image";
  image.src = src;
  image.alt = "Tab window";

  const closeButton = document.createElement("button");
  closeButton.className = "desktop-window__hotspot desktop-window__hotspot--close";
  closeButton.type = "button";
  closeButton.ariaLabel = "Close tab";
  closeButton.title = "Close";

  const spawnButton = document.createElement("button");
  spawnButton.className = "desktop-window__hotspot desktop-window__hotspot--spawn";
  spawnButton.type = "button";
  spawnButton.ariaLabel = "Open new tab";
  spawnButton.title = "Open another tab";

  closeButton.addEventListener("click", () => {
    container.remove();
  });

  spawnButton.addEventListener("click", () => {
    spawnRandomWindowNear(container);
  });

  container.addEventListener("pointerdown", () => {
    bringToFront(container);
  });

  container.append(image, closeButton, spawnButton);
  return container;
}

function getWindowSize() {
  const width = clamp(window.innerWidth * 0.32, 260, 420);
  const height = Math.round(width * 0.74);
  return { width, height };
}

function spawnRandomWindowNear(referenceWindow) {
  if (!windowLayer) {
    return;
  }

  const src =
    windowAssetPaths[randomInt(0, Math.max(windowAssetPaths.length - 1, 0))];
  const { width, height } = getWindowSize();
  const maxLeft = Math.max(window.innerWidth - width - 8, 8);
  const maxTop = Math.max(window.innerHeight - height - 8, 8);

  let left = randomInt(24, Math.max(24, maxLeft));
  let top = randomInt(24, Math.max(24, maxTop));

  if (referenceWindow) {
    const refLeft = parseInt(referenceWindow.style.left, 10) || 0;
    const refTop = parseInt(referenceWindow.style.top, 10) || 0;
    left = clamp(refLeft + randomInt(40, 120), 8, maxLeft);
    top = clamp(refTop + randomInt(24, 96), 8, maxTop);
  }

  const win = createWindowElement(src, left, top);
  windowLayer.appendChild(win);
}

function spawnInitialDesktopWindows() {
  if (!windowLayer || !isDesktopView) {
    return;
  }

  const initialAssets = pickRandomAssets(3);
  const { width, height } = getWindowSize();
  const maxLeft = Math.max(window.innerWidth - width - 24, 24);
  const maxTop = Math.max(window.innerHeight - height - 24, 24);
  const originLeft = clamp(Math.floor(window.innerWidth * 0.25), 24, maxLeft);
  const originTop = clamp(Math.floor(window.innerHeight * 0.16), 24, maxTop);

  initialAssets.forEach((src, index) => {
    const left = clamp(originLeft + index * 90, 24, maxLeft);
    const top = clamp(originTop + index * 56, 24, maxTop);
    const win = createWindowElement(src, left, top);
    windowLayer.appendChild(win);
  });
}

loadBaseBackground();
spawnInitialDesktopWindows();
