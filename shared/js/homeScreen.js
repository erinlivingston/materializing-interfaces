import { navigateTo } from "./mobileApp.js";

let container = null;
let infoBtn = null;
let entrySurface = null;
let suppressClickUntil = 0;

const HOME_PAPER_SOURCES = [
  "../assets/freedigitalpaper/heather-green-KwLAeH5dHIY-unsplash.jpg",
  "../assets/freedigitalpaper/heather-green-Lz3lAvRD5Mc-unsplash.jpg",
  "../assets/freedigitalpaper/heather-green-bOrMAThd09M-unsplash.jpg",
  "../assets/freedigitalpaper/heather-green-hKfKmfvPY44-unsplash.jpg",
  "../assets/freedigitalpaper/heather-green-o2lxbgiGEh8-unsplash.jpg",
  "../assets/freedigitalpaper/joao-vitor-duarte-k4Lt0CjUnb0-unsplash.jpg",
  "../assets/freedigitalpaper/nordwood-themes-R53t-Tg6J4c-unsplash.jpg",
  "../assets/freedigitalpaper/olga-thelavart-vS3idIiYxX0-unsplash.jpg",
  "../assets/freedigitalpaper/plufow-le-studio-zAvE6uAPkZk-unsplash.jpg",
  "../assets/freedigitalpaper/resource-boy-zJBxYP-hIS8-unsplash.jpg",
];

function pickRandomPaperSource() {
  if (!HOME_PAPER_SOURCES.length) return null;
  const index = Math.floor(Math.random() * HOME_PAPER_SOURCES.length);
  return HOME_PAPER_SOURCES[index];
}

function enterFeed() {
  navigateTo("feed");
}

function onTouchEnd() {
  suppressClickUntil = Date.now() + 500;
  enterFeed();
}

function onMouseClick(e) {
  if (e.sourceCapabilities?.firesTouchEvents) return;
  if (Date.now() < suppressClickUntil) return;
  enterFeed();
}

export function initHomeScreens(el) {
  container = el;
  container.innerHTML = "";
  suppressClickUntil = 0;

  entrySurface = document.createElement("button");
  entrySurface.className = "homescreen-entry-surface";
  entrySurface.type = "button";

  const paperLayer = document.createElement("div");
  paperLayer.className = "homescreen-paper";
  const rotation = (Math.random() * 8 - 4).toFixed(2);
  paperLayer.style.setProperty("--paper-rotation", `${rotation}deg`);
  const paperSource = pickRandomPaperSource();
  if (paperSource) {
    paperLayer.style.backgroundImage = `url("${paperSource}")`;
  }
  entrySurface.appendChild(paperLayer);

  const prompt = document.createElement("div");
  prompt.className = "homescreen-entry-card";

  const title = document.createElement("p");
  title.className = "homescreen-entry-title";
  title.textContent = "materializing the feed";

  const hint = document.createElement("p");
  hint.className = "homescreen-entry-hint";
  hint.textContent = "click to enter";

  prompt.appendChild(title);
  prompt.appendChild(hint);
  entrySurface.appendChild(prompt);
  container.appendChild(entrySurface);

  // Placeholder "settings/about" entry point.
  infoBtn = document.createElement("button");
  infoBtn.className = "mobile-info-btn";
  infoBtn.type = "button";
  infoBtn.textContent = "i";
  infoBtn.addEventListener("click", () => navigateTo("project"));
  container.appendChild(infoBtn);

  entrySurface.addEventListener("touchend", onTouchEnd, { passive: true });
  entrySurface.addEventListener("click", onMouseClick);
}

export function destroyHomeScreens() {
  if (!container) return;
  if (entrySurface) {
    entrySurface.removeEventListener("touchend", onTouchEnd);
    entrySurface.removeEventListener("click", onMouseClick);
  }
  if (infoBtn) {
    infoBtn.remove();
  }
  container.innerHTML = "";
  container = null;
  entrySurface = null;
  infoBtn = null;
  suppressClickUntil = 0;
}
