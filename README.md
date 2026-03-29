# Material Desktop

An interactive “materialized desktop” site: a **desktop view** layers draggable abstract “windows” (scanned UI collages) over a chosen background, and a **mobile view** stages a generative feed and stories experience built from ad screenshot metadata and canvas rendering.

## Entry points

| Path | Purpose |
|------|---------|
| `index.html` | Simple landing page with links to desktop and mobile |
| `desktop/index.html` | Full desktop experience (`data-view="desktop"`) |
| `mobile/index.html` | Mobile-style app shell (`data-view="mobile"`) |

Both views share `shared/css/common.css`. Paths assume you serve the repo from its root (see [Run locally](#run-locally)).

## Desktop vs mobile (high level)

**Desktop** is a single page driven by `shared/js/overlay.js`. It loads `assets/windows.config.json`, which defines each window image, interactive **click zones** (normalized coordinates), and **actions** (spawn another window, open a project page, menus, color filters, etc.). Windows are positioned in a `#window-layer` above the background; many behaviors are data-driven from JSON rather than hard-coded per window.

**Mobile** is a small **screen router** in `shared/js/mobileApp.js`. Four sections (`home`, `feed`, `stories`, `project`) map to DOM nodes in `mobile/index.html`. Only one screen is active at a time; switching screens runs matching `destroy*` then `init*` hooks so each screen can own canvas listeners and teardown cleanly. Mobile loads **p5** and `p5.riso.js` from a CDN for riso-style rendering used on the feed.

There is no shared runtime between desktop and mobile beyond CSS and some asset paths; they are two coordinated “faces” of the project.

## JavaScript modules

| Module | Used by | Role |
|--------|---------|------|
| `overlay.js` | Desktop only | Config load, window spawning, zones, drag/stack, start menu / code icon, desktop clock, entry overlay, background picker (landscape vs ombre), dynamic imports for poetry/history text |
| `projectPages.js` | Desktop (via `overlay.js`) | Static HTML “essays” for project windows; links use `data-project-link` to open further pages in new content windows |
| `browserHistoryPoetry.js` | Desktop (dynamic import from `overlay.js`) | Feeds optional word/poetry behavior into certain text zones |
| `mobileApp.js` | Mobile | Bootstraps ad data, wires swipe-up-to-home, `navigateTo` / `goBack`, initial screen from `#hash` or `?screen=` |
| `homeScreen.js` | Mobile | Homescreen with random paper texture and “click to enter” → feed; **i** → project |
| `feedGenerator.js` | Mobile | Infinite-scroll canvas feed: ad fragments, riso layers (`risoAdRenderer.js`), paper texture, touch marks; story row taps → stories; back/info navigation |
| `storiesGenerator.js` | Mobile | Full-screen story slides from random ad items; tap left/right to change slide; long-press pauses |
| `projectScreen.js` | Mobile | Placeholder project / about copy with back to home |
| `adDataLoader.js` | Mobile | Fetches and groups `assets/mobile_screenshots/meta/PNGdatamobileADS_100lines.json` |
| `adCropper.js` | Mobile | Crops “safe” regions of ad images (avoids chrome) for fragments and colors |
| `risoAdRenderer.js` | Mobile (`feedGenerator.js`) | Riso-style separation / drawing for feed tiles |
| `p5.riso.js` | Mobile (script tag) | p5 riso helpers used with feed rendering |

## Desktop: how windows spawn

1. **Startup** (`spawnInitialDesktopWindows`): After `windows.config.json` loads, the desktop spawns **three** random **interactive** abstract windows (excluding the large code-editor window id used elsewhere). It then spawns a **decorative cluster** of folder icons (`img_5510`) in two loose groups on the left and right of the viewport.

2. **Zone actions**: Clicks on zones run actions defined in JSON or **builtins** in `overlay.js` (e.g. `openAbstractFromPool`, `spawnRandom`, `spawnDigitalPaper`, `openProjectPage`, `menu`, `close`, color cycling, user input stubs). Pool-based spawns track **`openWindowIds`** so the same abstract id is not duplicated; if the pool is exhausted or a random “spill” fires, the system may spawn a **digital paper** window instead.

3. **Digital paper windows**: Separate from config entries—random images from `initPaperSources()` inside `overlay.js`, full-window draggable “paper” layers.

4. **Project / content windows**: Narrative HTML from `projectPages.js` opens as `desktop-window--project-page` windows; the Start button opens the `start` page (includes desktop background radio: landscape vs ombre, persisted in `localStorage`).

5. **Debug / authoring**: Query params `?debugZones=1` and `?showZones=1` toggle debug UI and visible zones (see `overlay.js`).

## Mobile: navigation and spawning

- **Initial screen**: `mobile/index.html#home` (default), or `#feed`, `#stories`, `#project`, or `?screen=feed` etc.
- **Home → feed**: Tap/click the main entry surface (touch and click are deduplicated to avoid double fire).
- **Feed → stories**: Tap one of the **story circles** in the feed header row.
- **Stories**: Tap **left** / **right** thirds of the canvas for previous/next slide; before first / after last slide returns to **feed**. Back button (**←**) goes to **home**. Long-press pauses the story.
- **Feed back**: Returns to **home**; **i** opens **project**.
- **Swipe up** (vertical swipe with enough delta): From feed, stories, or project, jumps back to **home** (not from home).
- **Project**: Back **←** returns to **home**.

Feed content **spawns** continuously during scroll: new fragments and overlays are generated from the ad JSON (random items, crops, blend modes, riso inks keyed loosely off emotion tags, break panels, etc.). That logic lives in `feedGenerator.js` rather than in `windows.config.json`.

## Configuration and assets (desktop)

- **`assets/windows.config.json`**: Window definitions (`id`, `src`, `sizeCm`, `zones`, `actions`). Sizing can scale relative to a reference window (`sizing.reference`).

- **Backgrounds**: Desktop backgrounds are under `assets/backgrounds/` (see `DESKTOP_BACKGROUNDS` in `overlay.js`).

- **Abstract window PNGs**: Referenced from `windows.config.json` (e.g. `assets/AbstractWindows/`).

- **Paper textures**: Digital paper lists in `overlay.js` and `homeScreen.js` point at `assets/freedigitalpaper/` (and similar).

## Run locally (no build step)

Plain HTML/CSS/JS. From the repo root:

```bash
cd /path/to/materialdesktop
python3 -m http.server 8000
```

Then open:

- http://localhost:8000/desktop/
- http://localhost:8000/mobile/
- http://localhost:8000/ — landing links

Serving over `http://` is required for `fetch()` of JSON and images.

## Optional next steps for you

1. Extend `projectPages.js` and wire more `project.*` actions in JSON if you add pages.
2. Add or swap assets under `assets/backgrounds/` and update paths in `overlay.js` if you rename files.
3. Expand `assets/mobile_screenshots/meta/` data and tune feed/story weights in the mobile generators.
