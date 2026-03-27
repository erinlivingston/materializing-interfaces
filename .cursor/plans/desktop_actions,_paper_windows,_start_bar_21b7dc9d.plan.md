---
name: Desktop actions, paper windows, start bar
overview: "Wire your `actionId`s to meaningful desktop behaviors: non-duplicated abstract window opening via the top-left buttons, probabilistic “digital paper” window spawning from your cropped `freedigitalpaper/* copy.jpg` set, clickable navigation into a small set of nonlinear project-essay pages, and a basic bottom start bar. Also remove `IMG_5491` from the random abstract spawn set and spawn it only via a dedicated “code editor” app icon/action."
todos:
  - id: inspect-current-action-dispatch
    content: Confirm how `actionId` is resolved in `shared/js/overlay.js` and decide where to add new action types + non-dup tracking.
    status: completed
  - id: add-paper-window-support
    content: Design and implement paper window defs from `assets/freedigitalpaper/* copy.jpg` and integrate into spawn actions with 25% probability.
    status: completed
  - id: wire-top-left-buttons
    content: Update `assets/windows.config.json` actionIds for top-left clusters and implement `spawnFromPoolNonDuplicate` using the selected pool.
    status: completed
  - id: exclude-img_5491-from-random
    content: Ensure `img_5491` is removed from initial/random abstract spawning and only opened via a dedicated app icon/action.
    status: completed
  - id: add-start-bar
    content: Add a fixed bottom start bar to desktop (HTML + CSS) and wire Start button action.
    status: completed
  - id: add-project-pages-and-actions
    content: Create 5–6 placeholder project essay pages and wire select zones/actionIds to open them in a content window.
    status: completed
isProject: false
---

## What’s already in place (so we can build on it)

- **Per-window clickable zones are already authored** in `[assets/windows.config.json](/Users/erinlivingston/Desktop/materialdesktop/assets/windows.config.json)` under `zones.click[]` and `zones.text[]`, but they all currently point to `"replace_action_id"`.
- The desktop runtime in `[shared/js/overlay.js](/Users/erinlivingston/Desktop/materialdesktop/shared/js/overlay.js)` already:
  - loads `windows.config.json`
  - spawns 3 random windows on boot (`pickRandomWindowDefs(3)`)
  - renders button overlays for `zones.click[]`
  - dispatches actions via `actionId` → `getActionDef()` → `runAction()`
- CSS already gives windows a drop shadow (`filter: drop-shadow(...)`) via `.desktop-window__image` in `[shared/css/common.css](/Users/erinlivingston/Desktop/materialdesktop/shared/css/common.css)`.

## ActionId + action type design (the core change)

We’ll keep `actionId` strings human-readable, and resolve them to action definitions either:

- via `windowDef.actions[actionId]` (per-window overrides), or
- via global/builtin action parsing in `overlay.js`.

### New action types to add in `overlay.js`

- `**window.spawnFromPoolNonDuplicate`**
  - Input: `poolIds: string[]`, `fallback: "paper"|"random"`.
  - Behavior: pick a random window id from the pool that is *not currently open*; if all are open, fall back.
- `**window.spawnWindowByIdNonDuplicate`**
  - Input: `targetId: string`.
  - Behavior: if that id is already open, bring it to front; else spawn it.
- `**window.spawnDigitalPaper`**
  - Input: `chance: number` (0..1), `paperPaths: string[]`.
  - Behavior: when a “new abstract window” action fires, roll the dice (you chose **25%**) and, if hit, spawn a paper window instead.
- `**window.openProjectPage`**
  - Input: `pageId: string`.
  - Behavior: spawn (or focus) a project-content window for that essay page.
- `**window.spawnCodeEditorInfo`**
  - Behavior: spawn (or focus) `img_5491` as a special window and populate its text zones with project/GitHub info.

## Digital paper windows (your cropped “copy” images)

- Use only the cropped files you called out: `assets/freedigitalpaper/* copy.jpg`.
- Implement paper windows as a second window “kind” in `overlay.js`:
  - They still use the same `.desktop-window` container and the same drop shadow (so they match).
  - Their size is derived similarly to abstract windows: we’ll compute a width (clamped) and preserve the image’s aspect ratio.
  - No clickable zones by default (unless you later add them).

## Make abstract spawning exclude `IMG_5491`

- Update `spawnInitialDesktopWindows()` and any “random abstract” picker to use a filtered list:
  - include `role === "interactive"` windows by default
  - explicitly exclude `id === "img_5491"` (your code-editor knockoff)

## Wire your top-left button cluster

You chose:

- **Each click** should open a random window from a pool, **non-duplicated** until all are open.
- **25% chance** to spill into a digital paper spawn.

Implementation:

- Define one reusable actionId, e.g. `openAbstractFromPool`.
- For every top-left button zone across your abstract windows, set `actionId` to that.
- In each relevant `windowDef.actions`, define:
  - `openAbstractFromPool: { type: "window.spawnFromPoolNonDuplicate", poolIds: [ ...your selected ids... ], fallback: "paper" }`
  - and inside that action, the spill rule uses `chance=0.25`.

(We’ll implement this so you don’t have to duplicate large action objects across every window; `overlay.js` can also support global action registry if you prefer.)

## Project pages (5–6 nonlinear essays)

- Add a small project page registry (data-only) such as:
  - `[shared/js/projectPages.js](/Users/erinlivingston/Desktop/materialdesktop/shared/js/projectPages.js)` exporting `{ id, title, html }[]`.
- Extend `overlay.js` to support a **content window** (DOM-based) in addition to image-based windows:
  - Same draggable container
  - A simple “window chrome” header (title + top-left buttons reusing the same actions)
  - Body renders the chosen project page HTML.
- Add actionIds in `windows.config.json` for text/element zones that should open a project page, e.g.:
  - `project.interface_as_theory`
  - `project.non_linear_navigation`

## “Start bar” (bottom desktop bar)

- Update `[desktop/index.html](/Users/erinlivingston/Desktop/materialdesktop/desktop/index.html)` to include a bottom bar element under the window layer.
- Add styles in `[shared/css/common.css](/Users/erinlivingston/Desktop/materialdesktop/shared/css/common.css)` for a simple start bar:
  - fixed to bottom, full width
  - left “Start” rectangular button
  - optional right-side clock placeholder
- Add a built-in action for the Start button:
  - either open a “Start page” project window, or toggle a small start menu panel.

## `IMG_5491` as an app-icon-launched info window

- Remove `img_5491` from random abstract spawning (above).
- Add a desktop “code editor” app icon (DOM element) in the desktop viewport.
- Clicking it triggers `window.spawnCodeEditorInfo`.
- Map a zone within `img_5491` (optional) to open your GitHub repo page (either as another project page or as a link).

## Files likely to change

- `[assets/windows.config.json](/Users/erinlivingston/Desktop/materialdesktop/assets/windows.config.json)`
  - replace `"replace_action_id"` for:
    - top-left clusters → `openAbstractFromPool`
    - selected text zones → `project.<pageId>` style actionIds
- `[shared/js/overlay.js](/Users/erinlivingston/Desktop/materialdesktop/shared/js/overlay.js)`
  - add new action types + non-dup open tracking
  - add paper-window spawning
  - exclude `img_5491` from random abstract picks
  - add start bar + app icon wiring
- `[shared/css/common.css](/Users/erinlivingston/Desktop/materialdesktop/shared/css/common.css)`
  - add start bar + app icon styling
  - add styles for DOM-based project windows
- New: `[shared/js/projectPages.js](/Users/erinlivingston/Desktop/materialdesktop/shared/js/projectPages.js)`
  - 5–6 placeholder essays (short, clean HTML)

## Validation (quick, manual)

- Load desktop view and confirm:
  - top-left button spawns new abstract windows without duplicating ids
  - ~25% of spawns are paper windows from `* copy.jpg`
  - when pool is exhausted, behavior is sensible (paper fallback)
  - Start bar renders and Start button opens the start/project window
  - code-editor icon spawns `img_5491`, and `img_5491` no longer appears in initial random windows

