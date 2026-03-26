import { loadAdData } from "./adDataLoader.js";
import { initHomeScreens, destroyHomeScreens } from "./homeScreen.js";
import { initFeed, destroyFeed } from "./feedGenerator.js";
import { initStories, destroyStories } from "./storiesGenerator.js";

const SCREENS = ["home", "feed", "stories"];
let currentScreen = null;
let screenEls = {};
let swipeStartY = 0;
let swipeStartX = 0;

function getScreenEl(name) {
  return screenEls[name] || null;
}

function hideAll() {
  for (const name of SCREENS) {
    const el = getScreenEl(name);
    if (el) el.classList.remove("active");
  }
}

export function navigateTo(name) {
  if (name === currentScreen) return;
  const prev = currentScreen;
  hideAll();

  if (prev === "home") destroyHomeScreens();
  if (prev === "feed") destroyFeed();
  if (prev === "stories") destroyStories();

  const el = getScreenEl(name);
  if (el) el.classList.add("active");
  currentScreen = name;

  if (name === "home") initHomeScreens(el);
  if (name === "feed") initFeed(el);
  if (name === "stories") initStories(el);
}

export function goBack() {
  if (currentScreen === "stories") {
    navigateTo("feed");
  } else if (currentScreen === "feed") {
    navigateTo("home");
  }
}

function handleSwipeBack(e) {
  if (currentScreen === "home") return;
  const touches = e.changedTouches;
  if (!touches || !touches.length) return;
  const dy = swipeStartY - touches[0].clientY;
  const dx = Math.abs(touches[0].clientX - swipeStartX);
  if (dy > 80 && dy > dx) {
    navigateTo("home");
  }
}

async function init() {
  try {
    await loadAdData();
  } catch (err) {
    console.error("Failed to load ad data:", err);
  }

  screenEls = {
    home: document.getElementById("screen-home"),
    feed: document.getElementById("screen-feed"),
    stories: document.getElementById("screen-stories"),
  };

  const app = document.getElementById("mobile-app");
  if (app) {
    app.addEventListener("touchstart", (e) => {
      if (e.touches.length === 1) {
        swipeStartY = e.touches[0].clientY;
        swipeStartX = e.touches[0].clientX;
      }
    }, { passive: true });
    app.addEventListener("touchend", handleSwipeBack, { passive: true });
  }

  navigateTo("home");
}

init();
