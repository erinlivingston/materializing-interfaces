# Mobile screenshots dataset

This folder is intended to hold your ~600 screenshot images for the mobile view dataset.

## Folder layout
- `raw/`: original downloads (unzipped, unmodified). Rename only if you want consistent IDs.
- `meta/`: CSV/JSON metadata you create (keywords, brand names, tags, notes).

## Recommended file naming (pick one convention and stick to it)
1. Sequential IDs (recommended):
   - `mobile_shot_0001.jpg`, `mobile_shot_0002.jpg`, ...
2. Date-time:
   - `mobile_shot_2026-03-01_153012.jpg` (useful if the source order matters)

If you use sequential IDs, keep a mapping in your CSV so you can trace back to the original photo.

## Suggested CSV columns (one row per image)
- `id` (e.g., `mobile_shot_0001`)
- `filename` (e.g., `mobile_shot_0001.jpg` or `IMG_4858.PNG`)
- `brand` (single value or leave blank)
- `keywords` (comma-separated or `;` separated)
- `tags` (comma-separated or `;` separated)
- `notes` (optional free text)

When you convert CSV -> JSON, make each JSON entry correspond to exactly one image.

## (Optional) Zone coordinates
If you plan to hand-label rectangles (e.g., top status bar/time, battery, service, bottom app actions), store them as normalized coordinates:
- `x`, `y`, `w`, `h` each in `[0,1]` where `(0,0)` is the top-left of the screenshot.

This matches the coordinate format used elsewhere in the project for zone placement.

