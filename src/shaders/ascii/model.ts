export interface AsciiParams {
  preset: string; characters: string; size: number; spacingX: number; spacingY: number;
  opacity: number; invert: boolean; randomness: number; seed: number; detail: number;
  coverage: number; edges: number; brightness: number; contrast: number;
  colorMode: 'mono' | 'source'; foreground: string; background: string;
  transparent: boolean; original: number;
}
export const presets: Record<string, string> = {
  Classic: ' .,:;i1tfLCG08@', Minimal: ' .:-=+*#%@', Binary: '01',
  Circles: '○●', Blocks: ' ░▒▓█', Signature: 'SLIMSHADERS', Custom: '',
};
export const defaults: AsciiParams = {
  preset: 'Classic', characters: presets.Classic, size: 10, spacingX: 1, spacingY: 1,
  opacity: 100, invert: false, randomness: 0, seed: 1, detail: 100, coverage: 100,
  edges: 0, brightness: 0, contrast: 10, colorMode: 'mono', foreground: '#e2e6dc',
  background: '#111313', transparent: false, original: 0,
};
export const clamp = (n: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, n));
export function noise(x: number, y: number, seed: number) {
  let h = Math.imul(x + 1, 374761393) ^ Math.imul(y + 1, 668265263) ^ Math.imul(seed, 144269);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
export function dimensions(width: number, height: number, scale: number) {
  if (!Number.isFinite(scale) || scale < 0.1 || scale > 8) throw new Error('Choose a scale between 0.1× and 8×.');
  const w = Math.max(1, Math.round(width * scale)), h = Math.max(1, Math.round(height * scale));
  if (w > 16384 || h > 16384 || w * h > 64_000_000) throw new Error('This export is too large. Choose a smaller scale (maximum 64 megapixels / 16,384 px per side).');
  return { width: w, height: h };
}
