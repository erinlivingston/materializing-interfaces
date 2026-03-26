const DATA_PATH = "../assets/mobile_screenshots/meta/PNGdatamobileADS_100lines.json";

const TOP_BAR_HEIGHT = 130;
const BOTTOM_BAR_HEIGHT = 275;
const NON_AD_BUFFER = 250;

let _data = null;
let _grouped = null;

export async function loadAdData() {
  if (_data) return _data;
  const res = await fetch(DATA_PATH, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load ad data: ${res.status}`);
  const json = await res.json();
  _data = json;
  _grouped = null;
  return _data;
}

export function getItems() {
  return _data?.items ?? [];
}

export function getGrouped() {
  if (_grouped) return _grouped;
  const items = getItems();
  _grouped = { feed: [], story: [], reel: [] };
  for (const item of items) {
    const loc = (item.insta_location || "").toLowerCase();
    if (_grouped[loc]) _grouped[loc].push(item);
  }
  return _grouped;
}

export function getItemsByLocation(location) {
  return getGrouped()[location] ?? [];
}

export function getRandomItems(location, count) {
  const pool = location ? getItemsByLocation(location) : getItems();
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

export function computeSafeCropRect(item, imgWidth, imgHeight) {
  let top = TOP_BAR_HEIGHT;
  if (item.non_adcontent_undertopbar) top += NON_AD_BUFFER;

  let bottom = imgHeight - BOTTOM_BAR_HEIGHT;
  if (item.non_adcontent_abovebottombar) bottom -= NON_AD_BUFFER;

  bottom = Math.max(bottom, top + 10);

  return {
    x: 0,
    y: top,
    width: imgWidth,
    height: bottom - top,
  };
}

export function getAllKeywords() {
  const set = new Set();
  for (const item of getItems()) {
    for (const kw of item.keywords || []) {
      if (kw.trim()) set.add(kw.trim());
    }
  }
  return [...set];
}

export function getAllEmotions() {
  const set = new Set();
  for (const item of getItems()) {
    for (const e of item.emotionorsense || []) {
      if (e.trim()) set.add(e.trim());
    }
  }
  return [...set];
}
