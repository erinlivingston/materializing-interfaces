let _p5Instance = null;
let _p5InitPromise = null;

async function ensureP5RisoInstance() {
  if (_p5Instance) return _p5Instance;
  if (_p5InitPromise) return _p5InitPromise;

  const P5 = globalThis.p5;
  if (!P5) {
    throw new Error(
      "Missing `p5` global. Add p5.js to your HTML before loading feedGenerator."
    );
  }

  _p5InitPromise = new Promise((resolve, reject) => {
    try {
      const sketch = (p) => {
        p.setup = () => {
          p.pixelDensity(1);

          // Offscreen p5 canvas (hidden) - riso writes into p.canvas.
          const c = p.createCanvas(1, 1);
          // Hide/remove the canvas element from the DOM so it can't appear
          // behind your phone preview.
          const elt = c?.elt || c;
          if (elt && elt.style) {
            elt.style.position = "absolute";
            elt.style.display = "none";
            elt.style.opacity = "0";
            elt.style.pointerEvents = "none";
            elt.style.width = "1px";
            elt.style.height = "1px";
          }
          try {
            if (elt && elt.parentNode) elt.parentNode.removeChild(elt);
          } catch (_) {
            // Best effort: if we can't remove, keep it hidden.
          }
          p.noLoop();

          globalThis._p5Instance = p;
          _p5Instance = p;
          resolve(p);
        };
      };

      new P5(sketch);
    } catch (err) {
      reject(err);
    }
  });

  return _p5InitPromise;
}

function downscaleCanvas(srcCanvas, targetW, targetH) {
  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext("2d");
  if (!ctx) return srcCanvas;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(srcCanvas, 0, 0, targetW, targetH);
  return canvas;
}

function canvasToP5Image(p, canvas) {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Unable to get 2d context from source canvas.");

  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const img = p.createImage(canvas.width, canvas.height);
  img.loadPixels();

  for (let i = 0; i < imgData.data.length; i++) {
    img.pixels[i] = imgData.data[i];
  }
  img.updatePixels();
  return img;
}

function uniqPreserveOrder(arr) {
  const out = [];
  for (const v of arr) {
    if (!v) continue;
    if (out.includes(v)) continue;
    out.push(v);
  }
  return out;
}

/**
 * Render a cropped ad fragment into a riso/dither look using one ink color.
 */
export async function renderRisoAdCanvas(srcCanvas, primaryInk, options = {}) {
  const p = await ensureP5RisoInstance();

  const RisoClass = globalThis.Riso;
  const ditherImageFn = globalThis.ditherImage;

  if (!RisoClass) throw new Error("Missing `Riso` global. Did `p5.riso.js` load?");
  if (!ditherImageFn) throw new Error("Missing `ditherImage` helper from `p5.riso.js`.");

  const drawRisoFn = globalThis.drawRiso;
  if (typeof drawRisoFn !== "function") {
    throw new Error("Missing `drawRiso` helper from `p5.riso.js`.");
  }

  const srcW = srcCanvas.width;
  const srcH = srcCanvas.height;

  const maxDim = options.maxDim ?? 220;
  const scale = Math.min(1, maxDim / Math.max(srcW, srcH));
  const procW = Math.max(1, Math.round(srcW * scale));
  const procH = Math.max(1, Math.round(srcH * scale));

  const workCanvas =
    procW === srcW && procH === srcH
      ? srcCanvas
      : downscaleCanvas(srcCanvas, procW, procH);

  p.pixelDensity(1);
  p.resizeCanvas(procW, procH);

  const pImg = canvasToP5Image(p, workCanvas);

  const ditherType = options.ditherType ?? "floydsteinberg";
  const threshold = options.threshold ?? 128;
  const dithered = ditherImageFn(pImg, ditherType, threshold);

  // One render == recreate channels for that fragment.
  RisoClass.channels = [];
  const ink = (primaryInk || "BLACK").toString().trim().toUpperCase();

  const layers = uniqPreserveOrder([ink]).map((inkColor) => {
    const layer = new RisoClass(inkColor, procW, procH);
    layer.fill(255);
    return layer;
  });

  p.clear();
  p.blendMode(p.BLEND);

  for (const layer of layers) layer.image(dithered, 0, 0);
  for (const layer of layers) layer.draw();
  drawRisoFn();

  const out = document.createElement("canvas");
  out.width = procW;
  out.height = procH;
  const outCtx = out.getContext("2d");
  if (!outCtx) return srcCanvas;
  outCtx.drawImage(p.canvas, 0, 0);

  // Optional alpha boosting so UI elements (like the top story dots)
  // can be rendered at full visual weight.
  const alphaScale = typeof options.alphaScale === "number" ? options.alphaScale : 1;
  const alphaOffset = typeof options.alphaOffset === "number" ? options.alphaOffset : 0;
  if (alphaScale !== 1 || alphaOffset !== 0) {
    const imgData = outCtx.getImageData(0, 0, out.width, out.height);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const a = data[i + 3];
      const boosted = Math.min(255, Math.max(0, a * alphaScale + alphaOffset));
      data[i + 3] = boosted;
    }
    outCtx.putImageData(imgData, 0, 0);
  }

  if (procW !== srcW || procH !== srcH) {
    const up = document.createElement("canvas");
    up.width = srcW;
    up.height = srcH;
    const upCtx = up.getContext("2d");
    if (upCtx) upCtx.drawImage(out, 0, 0, srcW, srcH);
    return up;
  }

  return out;
}

