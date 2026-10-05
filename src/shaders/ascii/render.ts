import { clamp, noise, type AsciiParams } from './model';
type Surface = OffscreenCanvas | HTMLCanvasElement;
type Context = OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D;
const surface = (w: number, h: number): Surface => {
  if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(w, h);
  const c = document.createElement('canvas'); c.width = w; c.height = h; return c;
};
const context = (c: Surface) => c.getContext('2d', { willReadFrequently: true }) as Context;

// All geometry is measured in source-image pixels. Preview and export use the same grid.
export function renderAscii(target: Surface, image: ImageBitmap, p: AsciiParams) {
  const ctx = context(target);
  if (!ctx) throw new Error('Your browser could not create an image canvas.');
  const sx = target.width / image.width, sy = target.height / image.height;
  const stepX = Math.max(2, p.size * 0.66 * p.spacingX * 100 / p.detail);
  const stepY = Math.max(2, p.size * p.spacingY * 100 / p.detail);
  const cols = Math.ceil(image.width / stepX), rows = Math.ceil(image.height / stepY);
  if (cols * rows > 1_500_000) throw new Error('Increase character size or lower detail for this image.');
  const small = surface(cols, rows), sample = context(small);
  sample.drawImage(image, 0, 0, cols, rows);
  const { data } = sample.getImageData(0, 0, cols, rows);
  const luminance = (i: number) => (0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]) / 255;
  const chars = Array.from(p.characters || ' ');
  ctx.clearRect(0, 0, target.width, target.height);
  if (!p.transparent) { ctx.fillStyle = p.background; ctx.fillRect(0, 0, target.width, target.height); }
  if (p.original > 0) { ctx.globalAlpha = p.original / 100; ctx.drawImage(image, 0, 0, target.width, target.height); }
  ctx.globalAlpha = 1;
  ctx.save(); ctx.scale(sx, sy);
  ctx.font = `${p.size}px ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = p.foreground;
  const gain = Math.pow(2, p.contrast / 50);
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    const i = (y * cols + x) * 4;
    if (!data[i + 3] || noise(x, y, p.seed + 17) > p.coverage / 100) continue;
    let light = luminance(i);
    const right = luminance((y * cols + Math.min(x + 1, cols - 1)) * 4);
    const below = luminance((Math.min(y + 1, rows - 1) * cols + x) * 4);
    light = clamp((light - 0.5) * gain + 0.5 + p.brightness / 100 + Math.hypot(light - right, light - below) * p.edges / 35);
    if (p.invert) light = 1 - light;
    const random = noise(x, y, p.seed);
    const level = clamp(light + (random - 0.5) * p.randomness / 50);
    const char = chars[Math.min(chars.length - 1, Math.floor(level * chars.length))];
    // Alpha modulation keeps single-character strings and logos recognizably image-shaped.
    ctx.globalAlpha = p.opacity / 100 * data[i + 3] / 255 * (0.08 + 0.92 * light);
    if (p.colorMode === 'source') ctx.fillStyle = `rgb(${data[i]},${data[i+1]},${data[i+2]})`;
    ctx.fillText(char, (x + 0.5) * stepX, (y + 0.5) * stepY);
  }
  ctx.restore(); ctx.globalAlpha = 1;
  small.width = 1; small.height = 1;
}
