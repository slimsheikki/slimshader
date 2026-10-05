export interface LcdParams {
  layout: 'image' | 'classic';
  columns: number;
  dither: 'ordered' | 'diffusion' | 'none';
  amount: number;
  threshold: number;
  brightness: number;
  contrast: number;
  gap: number;
  grid: number;
  shadow: number;
  invert: boolean;
  foreground: string;
  background: string;
  transparent: boolean;
}
export const defaults: LcdParams = {
  layout: 'image', columns: 84, dither: 'ordered', amount: 85,
  threshold: 50, brightness: 8, contrast: 25, gap: 12,
  grid: 5, shadow: 20, invert: false,
  foreground: '#263320', background: '#b4c789', transparent: false,
};
export { dimensions } from '../ascii/model';
