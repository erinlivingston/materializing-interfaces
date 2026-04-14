# Agent Build Transcripts

A chronological log of Cursor agent sessions used to build Material Desktop.
Each entry links to the full transcript (accessible within Cursor) and summarizes what was designed or built.

---

## Mar 19, 2026

### [Project Inception — Interactive artwork website](a6abedda-2bfb-439d-a9b0-9c0a9f4eb301)
First session. Defined the concept: an interactive website combining physical scanned artwork with generative digital art, split into a **Desktop view** and a **Mobile view**. Established that scanned PNGs of physical "abstract windows" (tabs, paper cutouts) would serve as the front-facing UI, with code-driven text zones and click zones layered on top.

---

## Mar 23, 2026

### [Abstract Windows — PNG setup, JSON config, zone editor](d80f72f1-930e-42f3-a939-62e5de0f37fe)
Built the core desktop engine: loaded scanned PNG abstract windows onto the screen, introduced `windows.config.json` to store per-window dimensions (in cm), zones, and roles (interactive / decorative). Added drag-and-drop behavior, drop shadows, and hover effects on click zones. Built a **zone editor debug tool** to visually draw and copy normalized zone coordinates.

---

## Mar 24, 2026

### [JavaScript Foundations — Window spawning behavior](4c035bec-6f83-4a33-a357-66943408a56c)
Clarifying session on how JavaScript manages window spawning on the desktop view. Discussed the spawn logic, initial three-window set, and how the config-driven approach works in practice.

### [Browser History Data — Import, filter, text zones](94a7c990-3fe3-429f-9901-fdf26aa3260d)
Imported Chrome browser history exports, cleaned and filtered the JSON to a specific date range (`2026-03-03` to `2026-03-12`). Mapped page titles (styled by time-of-day) to populate into the defined text zones of each abstract window on the desktop.

---

## Mar 25, 2026

### [Mobile View Setup — 503 ad screenshots, CSV metadata](c9b9e2e5-0af9-49d3-a5c2-41afcda523ec)
Began the mobile side. Planned a dataset of 503 phone-size PNG screenshots of mobile advertisements. Designed CSV column schema: `imagefilename`, `brand`, `adtext`, `keywords`, `UInote` with semicolon-separated multi-values.

### [Mobile Generative Ad Feed — Canvas home screen, color extraction](970c7f19-ec54-4e11-bdb9-98b56a14d4e6)
Converted the first 100 rows of the ad metadata CSV to JSON. Built a canvas-drawn mobile home screen with procedural paper texture, scrollable story circles (colors extracted from ad image zones), and a translucent dock. Began iterating on saturation and feed scroll speed.

---

## Mar 26, 2026

### [Styling Pass — Mobile homescreen, desktop text zones](aa2b6ea2-2e4a-40f3-9221-d5c2af033f65)
Mobile homescreen redesigned to randomly rotate through `freedigitalpaper` images as background, with a translucent white overlay and monospace "materializing" text. Desktop text zones refined: removed scroll bars, improved drop shadows for night/day text, tightened line spacing, and added font variation based on content categorization.

### [Riso Coloring — p5.riso effect on ad feed](2e769c0f-a706-45fb-a221-669f5183ee3d)
Integrated the [p5.riso](https://antiboredom.github.io/p5.riso/) library to apply risograph-style ink rendering to cropped ad image fragments in the feed generator. Debugged canvas layering glitch (stray `defaultCanvas0` element), added multi-ink color support, added paper texture background to the feed, and built a **screenshot / export PNG** feature. Added a continuous marker line drawing mode over the feed.

### [Desktop Click Zones — ActionIDs, project pages](ea408e98-c3aa-46e9-bf91-db7b0ab3c37a)
Reviewed and defined `actionID` values for all clickable zones in `windows.config.json`. Began wiring actions to behaviors (menus, project pages). Styled project pages with fluorescent green outlines, white translucent backgrounds, and monospace font. Added zone labels to the debug overlay.

---

## Mar 27, 2026

### [Zone Editor & Abstract Window Sizing](34e024f4-8041-4645-bb55-5447c7d9c694)
Increased base abstract window size (`targetBaseWidthPx`). Fixed a bug where the first three spawned windows were sometimes duplicates. Set `desktopbackgrounddigital.jpg` as the desktop background. Adjusted mobile phone shell proportions and added a "back to desktop view" button.

---

## Mar 28, 2026

### [Desktop Backgrounds — Landscape / Ombre, change background](2024996a-56ff-4706-82bf-485aec9925b6)
Added two desktop background options (landscape pastel and ombre pastel). Built a **Display window** in the start menu to let users switch backgrounds, with landscape as default. Removed digital paper from project/start pages, adjusted background color opacity for readability.

### [JSON Debugging — windows.config.json syntax](cfc6ff0a-27d1-47ba-8714-b4f7b40dc813)
Diagnosed and fixed a syntax error (trailing commas) at the bottom of `windows.config.json` causing the red editor indicator.

### [Debug Mode — Zone labels, server, click zone visibility](e7f375bf-9c09-4956-9e6c-dbaeb4682e75)
Tracked down the debug server URL and zone label display issues. Improved click zone outlines (black) and text zone outlines (brown) visibility, increased stroke width, and ensured zone ID labels render above all other elements.

### [ActionIDs & Interactions — Menu fortune, folder clusters](a894a97e-7b74-48a4-90e7-23fca776b681)
Fine-tuned zone coordinates and assigned `actionID`s across windows. Built the **folder cluster** behavior for `img_5510`. Applied consistent project page styling (color-mix driven borders based on background, narrative text style).

---

## Mar 29, 2026

### [Fine-Tuning — Usercheckbox, poem flow, folder interactions](9097b906-d128-4871-8826-f7c46d4d86c3)
Built `usercheckbox` action (toggle checkmark on click). Refined the user-input poem selection flow so selected words populate exactly the originating text zone. Added double-click to dismiss folder clusters. Fixed trailing comma syntax errors in config. Upgraded background images to high-resolution versions.

### [README, MenuMatrix, Userpickcolor](ad3f8ffe-2791-48a0-8dc9-fd67d2e40a39)
Updated README with current project component descriptions. Built `menumatrix` action — a 3×4 popup grid of icon buttons. Adjusted `userpickcolor` and `userpickcolorsquare` to produce 100% opaque fill. Reduced padding on digital UI popups for better coexistence with abstract windows.

### [Mobile Experience — Loading state, touch emoji drawing](a5415be7-c8cb-4103-b585-d255937a1174)
Added a loading indicator for the mobile feed (previously showed blank for ~3 seconds on real device). Removed the swipe-up-to-close gesture. Replaced the charcoal marker drawing layer with an emoji-based touch-drawing system using [OpenMoji](https://openmoji.org/) glyphs (selectable by code point).

---

## Apr 1, 2026

### [Performance Audit — Runtime optimization](e1b73560-deb4-4261-9b10-2b7a6a22e5a3)
Stepped back to audit the codebase holistically. Identified and addressed opportunities for optimization across the desktop and mobile JavaScript — reducing redundant DOM queries, improving event listener cleanup, and managing canvas operations more efficiently. Output documented in `.cursor/plans/runtime_optimization_audit_712b5d3a.plan.md`.

---

## Apr 6, 2026

### [Desktop Entry Screen — Glass login overlay](3e81a499-9f25-4aa1-b395-7708c840fa68)
Redesigned the desktop entry experience: replaced the plain white loading page with a frosted-glass rectangular card containing a profile avatar and a pill-shaped password input, floating above the desktop background. Also refined the **browser history poetry input windows** — adjusted spawn position to avoid clipping at top of screen, made windows draggable, added multi-word selection, updated label copy ("Use these word traces from the browser to create a line").

### [Start Menu Essays — OS-style essay panels](4a684be6-489d-4fb1-a097-580ee6d8f420)
Redesigned the start menu essay section. Instead of linking out to separate windows, essays (The Desktop, Input & Output, The User, The Feed) now live inside the start menu pane itself, navigable like an OS file browser or reading app.

---

## Apr 8, 2026

### [Font System — Browser history text categorization & color](d6df70c6-d77a-46e9-ab1e-201b3b9f53ae)
Refined how browser history text renders in the abstract window text zones. Explained and tuned the font-by-category logic. Removed time display from lines (kept time-based styling). Added visit-count-driven font weight and size. Ran a domain frequency report on the dataset. Applied hand-picked domain category colors: shopping `#7be0ad`, research `#e0b0d5`, account/admin `#aee5d8`, location `#86a397`. Tightened drop shadows for night text; reduced shadow intensity specifically for script-style fonts.

---

## Apr 9, 2026

### [Window Limits, Start Bar Prompt, Log Off](867a1c04-7b11-4bdd-9b0a-3842e7e2f194)
Added a maximum open windows limit to prevent browser overload (returns to entry page if exceeded, while still allowing zone-based window-opening below the limit). Added a **25-second idle prompt** ("click start bar to read about this project") for new visitors. Refined the log off button — now blurs the desktop without closing open windows (windows persist behind the entry overlay on re-login).

### [Profile Photos — Entry page, start menu, display page](6fbb34c7-af99-41a0-8bba-f084597131e0)
Used the `assets/iconphotos/png` collection as selectable profile images. Profile photo appears in the entry overlay avatar, the small start menu circle icon, and as a 6-option selector in the Display settings window. Default set to `sara-cervera-BULkOCPQnmU-unsplash.png`.

### [Essay JSON Content — Start menu essays, browser traces](cb3d958e-713b-46ef-b96e-6fc5acb513b8)
Wired `assets/essays.json` into the start menu essay panels. Restored the user-input text modal for browser-history text zones (clicking a zone now triggers the poetry word-selection overlay, separate from the always-present menu).

---

## Apr 13, 2026

### [Transcripts Log & Mobile Auto-Detect](0f876dc8-c0c8-4fa2-9f6b-ec287452b3bb)
Created this file (`AGENT_TRANSCRIPTS.md`). Added screen-size auto-detection to the root `index.html` entry page — mobile devices (≤ 768px wide or touch-primary) are redirected automatically to `/mobile/`, desktop users to `/desktop/`, with a brief animated redirect message and fallback manual links.
