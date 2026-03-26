import { computeSafeCropRect } from "./adDataLoader.js";

const _imageCache = new Map();
const _cropCache = new Map();

function loadImage(src) {
  if (_imageCache.has(src)) return _imageCache.get(src);
  const promise = new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load ${src}`));
    img.src = src;
  });
  _imageCache.set(src, promise);
  return promise;
}

export async function loadAndCropAd(item) {
  const key = item.imagefilename;
  if (_cropCache.has(key)) return _cropCache.get(key);

  const src = `../${item.assetRelativePath}`;
  const img = await loadImage(src);
  const rect = computeSafeCropRect(item, img.naturalWidth, img.naturalHeight);

  const canvas = document.createElement("canvas");
  canvas.width = rect.width;
  canvas.height = rect.height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(
    img,
    rect.x, rect.y, rect.width, rect.height,
    0, 0, rect.width, rect.height
  );

  _cropCache.set(key, canvas);
  return canvas;
}

export async function extractFragment(item, fragWidth, fragHeight) {
  const cropped = await loadAndCropAd(item);
  const maxX = Math.max(0, cropped.width - fragWidth);
  const maxY = Math.max(0, cropped.height - fragHeight);
  const sx = Math.floor(Math.random() * (maxX + 1));
  const sy = Math.floor(Math.random() * (maxY + 1));
  const sw = Math.min(fragWidth, cropped.width - sx);
  const sh = Math.min(fragHeight, cropped.height - sy);

  const canvas = document.createElement("canvas");
  canvas.width = sw;
  canvas.height = sh;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(cropped, sx, sy, sw, sh, 0, 0, sw, sh);
  return canvas;
}

export async function extractCircularFragment(item, diameter) {
  const cropped = await loadAndCropAd(item);
  const r = diameter / 2;
  const maxX = Math.max(0, cropped.width - diameter);
  const maxY = Math.max(0, cropped.height - diameter);
  const sx = Math.floor(Math.random() * (maxX + 1));
  const sy = Math.floor(Math.random() * (maxY + 1));

  const canvas = document.createElement("canvas");
  canvas.width = diameter;
  canvas.height = diameter;
  const ctx = canvas.getContext("2d");
  ctx.beginPath();
  ctx.arc(r, r, r, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(cropped, sx, sy, diameter, diameter, 0, 0, diameter, diameter);
  return canvas;
}

export async function extractDominantColor(item) {
  const cropped = await loadAndCropAd(item);
  const sampleSize = 64;
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = sampleSize;
  tempCanvas.height = sampleSize;
  const tCtx = tempCanvas.getContext("2d");
  tCtx.drawImage(cropped, 0, 0, cropped.width, cropped.height, 0, 0, sampleSize, sampleSize);
  const data = tCtx.getImageData(0, 0, sampleSize, sampleSize).data;
  let r = 0, g = 0, b = 0, count = 0;
  for (let i = 0; i < data.length; i += 16) {
    const pr = data[i], pg = data[i + 1], pb = data[i + 2];
    if (pr > 230 && pg > 230 && pb > 230) continue;
    if (pr < 25 && pg < 25 && pb < 25) continue;
    r += pr; g += pg; b += pb; count++;
  }
  if (count === 0) return "rgb(140,130,120)";
  return `rgb(${Math.round(r / count)},${Math.round(g / count)},${Math.round(b / count)})`;
}

export function clearCache() {
  _imageCache.clear();
  _cropCache.clear();
}
