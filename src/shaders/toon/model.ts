export interface ToonParams {
  bands: number; softness: number; brightness: number; contrast: number; saturation: number;
  outlines: number; threshold: number; lineWidth: number; ink: string;
  palette: 'source' | 'sunset' | 'mint' | 'ink'; shadow: string; highlight: string;
  original: number; transparent: boolean; background: string;
}
export const defaults: ToonParams = { bands: 4, softness: 2, brightness: 0, contrast: 12, saturation: 110,
  outlines: 75, threshold: 22, lineWidth: 1.5, ink: '#181b25', palette: 'sunset', shadow: '#302747',
  highlight: '#ffe5b5', original: 0, transparent: true, background: '#f0e8d8' };
export { dimensions } from '../ascii/model';
