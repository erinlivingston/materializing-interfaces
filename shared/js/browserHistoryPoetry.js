const HISTORY_PATH = "../assets/browserhistory_2026-03-03_to_2026-03-12_utc.json";
const NY_TZ = "America/New_York";

let linesCache = null;
const TIME_STAMP_EVERY_N_LINES = 8;

/** Chrome history timestamps are often microseconds since Unix epoch. */
export function visitTimeToMs(visitTime) {
  const n = Number(visitTime);
  if (!Number.isFinite(n)) return 0;
  return n > 1e14 ? n / 1000 : n;
}

function nyHourAndDate(ms) {
  const d = new Date(ms);
  const hourFmt = new Intl.DateTimeFormat("en-US", {
    timeZone: NY_TZ,
    hour: "numeric",
    hour12: false,
  });
  const hour = Number(hourFmt.format(d));
  const dateFmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: NY_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const dateNy = dateFmt.format(d);
  const timeLabel = new Intl.DateTimeFormat("en-US", {
    timeZone: NY_TZ,
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
  return { hour: Number.isFinite(hour) ? hour : 12, dateNy, timeLabel, date: d };
}

/** 7:00–18:59 New York → day (lighter text); else night (darker text). */
export function nyDayPhase(hour) {
  if (hour >= 7 && hour < 19) return "day";
  return "night";
}

/**
 * @typedef {{
 *   title: string,
 *   phase: string,
 *   hour: number,
 *   dateNy: string,
 *   timeLabel: string,
 *   date: Date,
 *   url: string,
 *   transition: string,
 *   visitCount: number
 * }} HistoryPoetryLine
 */

/**
 * @param {{ path?: string }} [opts]
 * @returns {Promise<HistoryPoetryLine[]>}
 */
export async function loadHistoryPoetryLines(opts = {}) {
  if (linesCache) return linesCache;
  const path = opts.path ?? HISTORY_PATH;
  let rows;
  try {
    const res = await fetch(path, { cache: "no-store" });
    if (!res.ok) throw new Error(String(res.status));
    rows = await res.json();
  } catch {
    linesCache = [];
    return linesCache;
  }
  if (!Array.isArray(rows) || rows.length === 0) {
    linesCache = [];
    return linesCache;
  }

  const sorted = [...rows].sort(
    (a, b) => visitTimeToMs(a.visitTime) - visitTimeToMs(b.visitTime),
  );

  // Count every raw occurrence of each title across the full dataset
  // before consecutive deduplication — this is the frequency signal.
  const titleCounts = new Map();
  for (const row of sorted) {
    const t = (row.title || "").trim() || "(no title)";
    titleCounts.set(t, (titleCounts.get(t) || 0) + 1);
  }

  /** @type {HistoryPoetryLine[]} */
  const lines = [];
  let lastTitle = null;
  for (const row of sorted) {
    const title = (row.title || "").trim() || "(no title)";
    if (title === lastTitle) continue;
    lastTitle = title;

    const ms = visitTimeToMs(row.visitTime);
    const { hour, dateNy, timeLabel, date } = nyHourAndDate(ms);
    const phase = nyDayPhase(hour);
    lines.push({
      title,
      phase,
      hour,
      dateNy,
      timeLabel,
      date,
      url: String(row.url || ""),
      transition: String(row.transition || ""),
      visitCount: titleCounts.get(title) || 1,
    });
  }

  linesCache = lines;
  return linesCache;
}

/**
 * @param {HistoryPoetryLine} line
 * @param {boolean} [showTime]
 * @returns {HTMLParagraphElement}
 */
export function createHistoryLineElement(line, showTime = false) {
  const p = document.createElement("p");
  p.className = `history-line history-line--${line.phase}`;
  p.dataset.hourNy = String(line.hour);
  p.dataset.dateNy = line.dateNy;
  p.dataset.phase = line.phase;

  const font = classifyLineFont(line);
  p.classList.add(`history-line--font-${font}`);

  // Marck Script (writing) is fixed-weight — vary size instead.
  if (font === "writing") {
    p.style.setProperty("--history-size", visitCountToSize(line.visitCount));
  } else {
    p.style.setProperty("--history-weight", visitCountToWeight(line.visitCount));
  }

  const span = document.createElement("span");
  span.className = "history-line__title";
  appendColoredTitle(span, line.title);

  if (showTime) {
    const timeEl = document.createElement("time");
    timeEl.dateTime = line.date.toISOString();
    timeEl.className = "history-line__time";
    timeEl.textContent = line.timeLabel;
    p.append(timeEl, " ", span);
  } else {
    p.append(span);
  }
  return p;
}

/** Maps raw visit count to a font-weight tier (log-ish scale for skewed data). */
function visitCountToWeight(count) {
  if (count >= 10) return 700;
  if (count >= 5) return 600;
  if (count >= 3) return 500;
  if (count >= 2) return 400;
  return 300;
}

/** Maps raw visit count to a font-size tier for Marck Script (weight-only font). */
function visitCountToSize(count) {
  if (count >= 10) return "1.12em";
  if (count >= 5) return "1.05em";
  if (count >= 3) return "1.0em";
  if (count >= 2) return "0.95em";
  return "0.88em";
}

const INTENT_SHOPPING = new Set([
  "sale", "sales", "price", "prices", "off", "buy", "cart", "free",
  "deal", "deals", "discount", "discounts", "shipping", "order", "orders",
  "clearance", "shop", "checkout", "coupon", "coupons", "promo",
]);

const INTENT_RESEARCH = new Set([
  "how", "guide", "tutorial", "tutorials", "what", "explained",
  "review", "reviews", "best", "learn", "tips", "tip", "beginner",
  "beginners", "intro", "introduction", "overview", "vs", "comparison",
  "getting", "started",
]);

const INTENT_ADMIN = new Set([
  "login", "signin", "account", "accounts", "settings", "password",
  "passwords", "secure", "security", "banking", "credit", "payment",
  "payments", "bill", "billing", "statement", "manage", "management",
  "dashboard", "forgot", "reset", "verify", "verification",
]);

const INTENT_LOCATION = new Set([
  "apartment", "apartments", "bedroom", "bedrooms", "bath", "baths",
  "bathroom", "bathrooms", "sqft", "rent", "rental", "rentals",
  "lease", "condo", "condos", "studio", "studios", "unit", "units",
  "furnished", "listing", "listings", "beds", "bed",
]);

function intentColorClass(word) {
  const w = word.toLowerCase().replace(/[^\w]/g, "");
  if (INTENT_SHOPPING.has(w)) return "shopping";
  if (INTENT_RESEARCH.has(w)) return "research";
  if (INTENT_ADMIN.has(w)) return "admin";
  if (INTENT_LOCATION.has(w)) return "location";
  return null;
}

function appendColoredTitle(container, title) {
  const parts = String(title || "").split(/(\s+)/);
  for (const part of parts) {
    if (!part.trim()) {
      container.append(part);
      continue;
    }
    const cls = intentColorClass(part);
    if (cls) {
      const token = document.createElement("span");
      token.className = `history-line__word history-line__word--${cls}`;
      token.textContent = part;
      container.appendChild(token);
    } else {
      container.append(part);
    }
  }
}

function classifyLineFont(line) {
  const combined = `${String(line.title || "").toLowerCase()} ${String(line.url || "").toLowerCase()}`;

  // Writing is checked first so mail.google / docs.google / drive.google
  // are caught before the broader google → search rule fires.
  if (containsAny(combined, [
    "mail.google", "drive.google", "docs.google", "calendar.google",
    "notion.so", "notion.site",
    "mail", "inbox", "substack", "wordpress", "outlook", "sharepoint",
  ])) {
    return "writing";
  }

  if (containsAny(combined, [
    "github", "stackoverflow", "p5js", "localhost", "127.0.0.1",
    "bootstrap", "thecodingtrain", "codingtrain",
    "rgbcolorpicker", "htmlcolorcodes", "rgb.to",
  ])) {
    return "code";
  }

  if (containsAny(combined, [
    "shop", "cart", "checkout", "amazon", "etsy", "ebay",
    "trulia", "athome.com", "chewy", "wayfair", "cvs.com",
    "rugsusa", "rugs.com", "overstock", "barclaycard", "palladiumboots",
    "airbnb", "shoprite", "bedbathandbeyond",
  ])) {
    return "commerce";
  }

  if (containsAny(combined, [
    "google", "search", "bing", "duckduckgo", "wikipedia",
  ])) {
    return "search";
  }

  return "default";
}

function containsAny(text, terms) {
  return terms.some((term) => text.includes(term));
}

/**
 * Splits chronological lines across visible PNG text zones (sequential chunks).
 * @param {Element[]} zoneElements
 * @param {HistoryPoetryLine[]} lines
 */
export function fillTextZonesWithHistory(zoneElements, lines) {
  zoneElements.forEach((z) => {
    z.replaceChildren();
  });
  if (!zoneElements.length || !lines.length) return;

  const z = zoneElements.length;
  const n = lines.length;
  for (let j = 0; j < z; j += 1) {
    const start = Math.floor((j * n) / z);
    const end = Math.floor(((j + 1) * n) / z);
    const zone = zoneElements[j];
    for (let i = start; i < end; i += 1) {
      const showTime = i % TIME_STAMP_EVERY_N_LINES === 0;
      zone.appendChild(createHistoryLineElement(lines[i], showTime));
    }
  }
}

/**
 * Distributes user-picked words across visible PNG text zones (same chunking idea as history fill).
 * @param {Element[]} zoneElements
 * @param {string[]} words — tokens (e.g. from a space-joined poem)
 */
export function fillTextZonesWithPoem(zoneElements, words) {
  zoneElements.forEach((z) => {
    z.replaceChildren();
  });
  if (!zoneElements.length || !words.length) return;

  const z = zoneElements.length;
  const n = words.length;
  for (let j = 0; j < z; j += 1) {
    const start = Math.floor((j * n) / z);
    const end = Math.floor(((j + 1) * n) / z);
    const slice = words.slice(start, end);
    if (!slice.length) continue;
    const p = document.createElement("p");
    p.className = "zone-text__poem-line";
    p.textContent = slice.join(" ");
    zoneElements[j].appendChild(p);
  }
}

const HISTORY_WORD_STOP = new Set([
  "the",
  "and",
  "for",
  "with",
  "from",
  "your",
  "this",
  "that",
  "are",
  "was",
  "has",
  "have",
  "had",
  "but",
  "not",
  "you",
  "all",
  "can",
  "our",
  "out",
  "any",
  "may",
  "one",
  "get",
  "new",
  "com",
  "org",
  "www",
  "http",
  "https",
]);

/**
 * Distinct tokens from history titles for constrained pickers (desktop zone actions).
 * @param {HistoryPoetryLine[]} lines
 * @param {number} [count]
 * @returns {string[]}
 */
export function pickHistoryWordChoices(lines, count = 18) {
  const fallback = [
    "material",
    "desktop",
    "history",
    "browser",
    "window",
    "memory",
    "link",
    "tab",
    "scroll",
    "feed",
  ];
  if (!Array.isArray(lines) || !lines.length) {
    return fallback;
  }
  const seen = new Set();
  const pool = [];
  for (const line of lines) {
    const title = String(line.title || "");
    const normalized = title.replace(/[-_|/]+/g, " ").replace(/[^\w\s']/g, " ");
    for (const raw of normalized.split(/\s+/)) {
      const w = raw.toLowerCase().replace(/^'+|'+$/g, "");
      if (w.length < 3 || HISTORY_WORD_STOP.has(w) || seen.has(w)) continue;
      seen.add(w);
      pool.push(raw.length >= 3 ? raw : w);
      if (pool.length > 220) break;
    }
    if (pool.length > 220) break;
  }
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const n = Math.max(1, Math.min(count, 72));
  const out = pool.slice(0, n);
  return out.length ? out : fallback;
}
