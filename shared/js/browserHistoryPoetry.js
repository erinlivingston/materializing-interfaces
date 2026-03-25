const HISTORY_PATH = "../assets/browserhistory_2026-03-03_to_2026-03-12_utc.json";
const NY_TZ = "America/New_York";

let linesCache = null;

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
 * @typedef {{ title: string, phase: string, hour: number, dateNy: string, timeLabel: string, date: Date }} HistoryPoetryLine
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
    lines.push({ title, phase, hour, dateNy, timeLabel, date });
  }

  linesCache = lines;
  return linesCache;
}

/**
 * @param {HistoryPoetryLine} line
 * @returns {HTMLParagraphElement}
 */
export function createHistoryLineElement(line) {
  const p = document.createElement("p");
  p.className = `history-line history-line--${line.phase}`;
  p.dataset.hourNy = String(line.hour);
  p.dataset.dateNy = line.dateNy;
  p.dataset.phase = line.phase;

  const timeEl = document.createElement("time");
  timeEl.dateTime = line.date.toISOString();
  timeEl.className = "history-line__time";
  timeEl.textContent = line.timeLabel;

  const span = document.createElement("span");
  span.className = "history-line__title";
  span.textContent = line.title;

  p.append(timeEl, " ", span);
  return p;
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
      zone.appendChild(createHistoryLineElement(lines[i]));
    }
  }
}
