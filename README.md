# Material Desktop

A starting point for an interactive “materialized desktop” website that overlays generative art on top of scanned physical artwork.

## Structure

- `desktop/index.html` - desktop-facing view
- `mobile/index.html` - mobile-facing view
- `shared/css/common.css` - shared styling
- `shared/js/overlay.js` - placeholder generative overlay (no dependencies)
- `assets/` - scanned images and other media (place files here later)

## Run locally (no build step)

This repo is plain HTML/CSS/JS. To run it:

```bash
cd /Users/erinlivingston/Desktop/materialdesktop
python3 -m http.server 8000
```

Then open:

- http://localhost:8000/desktop/
- http://localhost:8000/mobile/

## Next steps

1. Put scanned images into `assets/` (for example: `assets/paper.jpg`).
2. Update the `data-base-src` attribute in `desktop/index.html` and `mobile/index.html` to point at your image.
3. Replace the placeholder overlay logic in `shared/js/overlay.js` with your generative-art code fed by your personal data.

