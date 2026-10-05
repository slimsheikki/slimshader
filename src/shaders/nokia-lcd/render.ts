import { background, context, surface, type Surface } from '../shared/canvas';
import type { LcdParams } from './model';

const bayer = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const clamp = (v: number) => Math.max(0, Math.min(1, v));

export function renderLcd(target: Surface, image: ImageBitmap, p: LcdParams) {
  const ctx = context(target), w = target.width, h = target.height;
  // The logical screen depends on source dimensions, never preview/export scale.
  let cols = Math.round(p.columns), rows = Math.max(1, Math.round(cols * image.height / image.width));
  if (p.layout === 'classic') { cols = 84; rows = 48; }
  else if (rows > 512) { cols = Math.max(1, Math.round(cols * 512 / rows)); rows = 512; }
  const sample = surface(cols, rows), sc = context(sample);
  sc.imageSmoothingEnabled = true; sc.imageSmoothingQuality = 'high';
  if (p.layout === 'classic') {
    const fit = Math.min(cols / image.width, rows / image.height);
    sc.drawImage(image, (cols - image.width * fit) / 2, (rows - image.height * fit) / 2, image.width * fit, image.height * fit);
  } else sc.drawImage(image, 0, 0, cols, rows);
  const data = sc.getImageData(0, 0, cols, rows).data;
  const values = new Float32Array(cols * rows), alpha = new Float32Array(cols * rows);
  for (let i = 0; i < values.length; i++) {
    const j = i * 4;
    alpha[i] = data[j + 3] / 255;
    const luma = (data[j] * .2126 + data[j + 1] * .7152 + data[j + 2] * .0722) / 255;
    values[i] = clamp((luma - .5) * (1 + p.contrast / 100) + .5 + p.brightness / 100);
  }
  const on = new Uint8Array(values.length), threshold = p.threshold / 100;
  const diffuse = (x: number, y: number, error: number, weight: number) => {
    if (x >= 0 && x < cols && y < rows && alpha[y * cols + x] > .01)
      values[y * cols + x] += error * weight * p.amount / 100;
  };
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    const i = y * cols + x;
    if (alpha[i] < .01) continue;
    const offset = p.dither === 'ordered' ? ((bayer[(y % 4) * 4 + x % 4] + .5) / 16 - .5) * p.amount / 100 : 0;
    const light = values[i] >= threshold + offset;
    on[i] = Number(p.invert ? light : !light);
    if (p.dither === 'diffusion') {
      const error = values[i] - Number(light);
      diffuse(x + 1, y, error, 7 / 16); diffuse(x - 1, y + 1, error, 3 / 16);
      diffuse(x, y + 1, error, 5 / 16); diffuse(x + 1, y + 1, error, 1 / 16);
    }
  }
  background(ctx, w, h, p);
  const cell = Math.min(w / cols, h / rows);
  const dx = p.layout === 'classic' ? cell : w / cols, dy = p.layout === 'classic' ? cell : h / rows;
  const ox = (w - cols * dx) / 2, oy = (h - rows * dy) / 2;
  const inset = p.gap / 200, pw = dx * (1 - p.gap / 100), ph = dy * (1 - p.gap / 100);
  ctx.fillStyle = p.foreground;
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    const i = y * cols + x, px = ox + (x + inset) * dx, py = oy + (y + inset) * dy;
    if (on[i] && !p.transparent && p.shadow > 0) {
      ctx.globalAlpha = alpha[i] * p.shadow / 100;
      ctx.fillRect(px + dx * .13, py + dy * .18, pw, ph);
    }
    // Transparent export keeps active pixels only, including source alpha.
    ctx.globalAlpha = alpha[i] * (on[i] ? 1 : p.transparent ? 0 : p.grid / 100);
    if (ctx.globalAlpha > 0) ctx.fillRect(px, py, pw, ph);
  }
  ctx.globalAlpha = 1;
}
