export interface ToonParams {
  brushSize: number; paint: number; bristles: number; variation: number; flow: number; seed: number;
  bands: number; softness: number; brightness: number; contrast: number; saturation: number;
  outlines: number; threshold: number; lineWidth: number; ink: string;
  palette: 'source' | 'sunset' | 'mint' | 'ink'; shadow: string; highlight: string;
  original: number; transparent: boolean; background: string;
}
export const defaults: ToonParams = { brushSize: 18, paint: 75, bristles: 55, variation: 22, flow: 80, seed: 7, bands: 5, softness: 2, brightness: 0, contrast: 12, saturation: 110,
  outlines: 90, threshold: 12, lineWidth: 2, ink: '#181b25', palette: 'sunset', shadow: '#302747',
  highlight: '#ffe5b5', original: 0, transparent: true, background: '#f0e8d8' };
export { dimensions } from '../ascii/model';
