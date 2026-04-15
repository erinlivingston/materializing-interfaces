# Material Desktop

**Material Desktop** is an interactive web project built as part of an MS thesis. It explores the visual and tactile language of digital interfaces by simulating two parallel environments: a draggable abstract desktop and a generative mobile feed. Both environments are rendered entirely in the browser with no build tools or frameworks — just plain HTML, CSS, and JavaScript.

---

## What it does

The project has two distinct "views" that share the same asset library but behave independently.

**Desktop view** presents a simulated desktop environment. When you open it, an entry screen (a frosted-glass panel with a password input) is layered over a background image. Dismissing it reveals a desktop populated with abstract "windows" — draggable panels containing scanned or collaged UI imagery. Each window can contain interactive click zones that trigger further actions: spawning new windows, opening essay-style project pages, showing menus, or cycling color filters. A start bar runs along the bottom, and a floating "Editor" icon sits on the canvas.

**Mobile view** simulates an app-style feed experience. It is a small screen router with four named screens — `home`, `feed`, `stories`, and `project`. The feed generates an infinite-scroll canvas using advertisement screenshot metadata and riso-style rendering (a layered, risograph-inspired print aesthetic). Story slides are full-screen and tap-navigable. The mobile shell is designed to be embedded in the desktop view as a preview, and is also fully usable as a standalone URL.

---

## Technical stack

| Concern | Technology |
|---------|-----------|
| Languages | HTML5, CSS3, JavaScript (ES modules) |
| Build system | None — served as static files |
| Canvas / generative rendering | [p5.js](https://p5js.org/) v1.11.0 (CDN) + `p5.riso.js` (local) |
| Fonts | Google Fonts (Lexend, Marck Script, Montserrat, Source Serif 4, Work Sans) |
| Icons | Flaticon UIcons v3.3.1 (CDN) |
| Data | JSON files for window config and ad metadata |
| Persistence | `localStorage` for background preference |

There is no npm, no bundler, no framework. Every file is loaded directly by the browser.

---

## Project structure

```
materialdesktop/
├── index.html                  # Root landing page (auto-redirects to desktop or mobile)
├── desktop/
│   └── index.html              # Desktop view entry point
├── mobile/
│   └── index.html              # Mobile view entry point
├── shared/
│   ├── css/
│   │   └── common.css          # Styles shared by both views
│   └── js/
│       ├── overlay.js          # All desktop logic (window spawning, zones, drag, menus, clock)
│       ├── projectPages.js     # Essay/narrative HTML for project windows (desktop)
│       ├── browserHistoryPoetry.js  # Feeds poetry text into desktop text zones
│       ├── mobileApp.js        # Mobile router and screen lifecycle
│       ├── homeScreen.js       # Mobile home screen
│       ├── feedGenerator.js    # Infinite-scroll canvas feed
│       ├── storiesGenerator.js # Full-screen story slides
│       ├── projectScreen.js    # Mobile project/about screen
│       ├── adDataLoader.js     # Loads and groups ad JSON data
│       ├── adCropper.js        # Crops safe regions from ad images
│       ├── risoAdRenderer.js   # Riso-style rendering for feed tiles
│       └── p5.riso.js          # p5 riso helpers (local copy)
└── assets/
    ├── windows.config.json     # Defines every desktop window, its image, zones, and actions
    ├── essays.json             # Essay/text content
    ├── papertexture.jpg        # Paper texture used in home screen
    ├── browserhistory_*.json   # Browser history data used for poetry behavior
    ├── backgrounds/            # Desktop background images
    ├── AbstractWindows/        # Window panel PNGs
    ├── freedigitalpaper/       # Paper texture images for digital paper windows
    ├── iconphotos/             # Avatar and icon images
    └── mobile_screenshots/
        ├── meta/               # Ad metadata JSON
        └── (ad images)
```

---

## How the desktop works

### Entry and startup

When `desktop/index.html` loads, `overlay.js` fetches `assets/windows.config.json` and then calls `spawnInitialDesktopWindows`, which places three randomly chosen abstract windows on the canvas and two loose clusters of folder icons on the left and right sides. A frosted-glass entry overlay sits on top. Any pointer or keyboard input dismisses it.

### Windows and click zones

Each window in `windows.config.json` has an `id`, a source image path (`src`), a size specification (`sizeCm`), and an optional array of `zones`. Zones are defined in normalized coordinates (0–1 relative to the window size) so they scale correctly with the window. Each zone has an `action`, which is either a built-in string (e.g. `openAbstractFromPool`, `spawnRandom`, `menu`, `close`) or a data-driven descriptor. The full list of built-in actions lives in `overlay.js`.

### Window types

- **Abstract windows**: The main interactive panels, loaded from `windows.config.json`.
- **Digital paper windows**: Decorative full-window layers with random paper texture images; spawned from `initPaperSources()` in `overlay.js`.
- **Project/content windows**: Narrative HTML panels rendered from `projectPages.js`, opened by certain zone actions or the Start menu.

### Debugging

Append `?debugZones=1` or `?showZones=1` to the desktop URL to see click zone outlines and debug information.

---

## How the mobile works

### Screen routing

`mobileApp.js` manages four sections of `mobile/index.html` — `#screen-home`, `#screen-feed`, `#screen-stories`, and `#screen-project`. Only one is active at a time. Switching screens calls the outgoing screen's `destroy*` function and the incoming screen's `init*` function, so canvas listeners and event handlers are always cleaned up.

### Navigation

| Action | Result |
|--------|--------|
| Tap home surface | Go to feed |
| Tap story circle in feed header | Go to stories |
| Tap left / right third of story canvas | Previous / next story slide |
| Past first or last slide | Return to feed |
| Back button (`←`) in stories | Go to home |
| Back button in feed | Go to home |
| Info button (`i`) in feed | Go to project |
| Swipe up (from feed, stories, or project) | Go to home |

Initial screen can be set via URL hash (`#feed`) or query param (`?screen=feed`).

### Feed generation

`feedGenerator.js` generates the canvas feed dynamically as the user scrolls. Each tile is assembled from: a random crop of an ad image (`adCropper.js`), riso-style color separation (`risoAdRenderer.js`), a paper texture overlay, and touch marks. Ad items are loaded once via `adDataLoader.js` from the metadata JSON, then sampled randomly with blend modes and riso ink colors loosely keyed to emotion tags in the metadata.

---

## Key configuration files

### `assets/windows.config.json`

This is the primary data file for the desktop. It defines every window that can appear, including:
- `id` — unique identifier
- `src` — path to the window image
- `sizeCm` — intended display size (can be relative to a reference window via `sizing.reference`)
- `zones` — array of click regions with normalized coordinates and action descriptors

### `assets/essays.json`

Contains text content used in project pages and narrative windows.

### Ad metadata JSON

Lives at `assets/mobile_screenshots/meta/`. Contains an array of ad image records with fields for emotion tags, image paths, and other metadata used by the feed and stories generators.

---

## Running locally

No installation required. The only requirement is serving the files over HTTP (browser security restrictions prevent `fetch()` from working on `file://` URLs).

```bash
cd /path/to/materialdesktop
python3 -m http.server 8000
```

Then open in a browser:

| URL | View |
|-----|------|
| http://localhost:8000/ | Landing page (auto-redirects based on device) |
| http://localhost:8000/desktop/ | Desktop view |
| http://localhost:8000/mobile/ | Mobile view |

The landing page detects device type via `window.matchMedia("(pointer: coarse)")` and viewport width (`<= 768px`). If either condition is true it redirects to the mobile view; otherwise to the desktop view.
