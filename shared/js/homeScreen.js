import { navigateTo } from "./mobileApp.js";

let container = null;
let currentPage = 0;
let dots = null;
let swipeStartX = 0;
let touchActive = false;

function showPage(index) {
  currentPage = ((index % 3) + 3) % 3;
  const wrapper = container?.querySelector(".homescreen-pages");
  if (wrapper) {
    wrapper.style.transform = `translateX(-${currentPage * 100}%)`;
  }
  if (dots) {
    for (let i = 0; i < dots.children.length; i++) {
      dots.children[i].classList.toggle("active", i === currentPage);
    }
  }
}

function onTouchStart(e) {
  if (e.touches.length === 1) {
    swipeStartX = e.touches[0].clientX;
    touchActive = true;
  }
}

function onTouchEnd(e) {
  if (!touchActive) return;
  touchActive = false;
  const dx = e.changedTouches[0].clientX - swipeStartX;
  if (Math.abs(dx) > 40) {
    showPage(currentPage + (dx < 0 ? 1 : -1));
  } else {
    navigateTo("feed");
  }
}

function onMouseClick(e) {
  if (touchActive) return;
  if (e.sourceCapabilities?.firesTouchEvents) return;
  navigateTo("feed");
}

export function initHomeScreens(el) {
  container = el;
  container.innerHTML = "";
  currentPage = 0;

  const wrapper = document.createElement("div");
  wrapper.className = "homescreen-pages";

  for (let i = 0; i < 3; i++) {
    const page = document.createElement("div");
    page.className = "homescreen-page";
    const placeholder = document.createElement("div");
    placeholder.className = "homescreen-placeholder";
    placeholder.textContent = `Home Screen ${i + 1}`;
    page.appendChild(placeholder);
    wrapper.appendChild(page);
  }

  container.appendChild(wrapper);

  dots = document.createElement("div");
  dots.className = "homescreen-dots";
  for (let i = 0; i < 3; i++) {
    const dot = document.createElement("span");
    dot.className = "homescreen-dot";
    if (i === 0) dot.classList.add("active");
    dots.appendChild(dot);
  }
  container.appendChild(dots);

  wrapper.addEventListener("touchstart", onTouchStart, { passive: true });
  wrapper.addEventListener("touchend", onTouchEnd, { passive: true });
  wrapper.addEventListener("click", onMouseClick);
}

export function destroyHomeScreens() {
  if (!container) return;
  const wrapper = container.querySelector(".homescreen-pages");
  if (wrapper) {
    wrapper.removeEventListener("touchstart", onTouchStart);
    wrapper.removeEventListener("touchend", onTouchEnd);
    wrapper.removeEventListener("click", onMouseClick);
  }
  container.innerHTML = "";
  container = null;
  dots = null;
}
