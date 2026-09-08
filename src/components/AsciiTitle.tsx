import { useEffect, useRef } from 'react';

/** Text-shaped glyphs, rendered once at display resolution. */
export default function AsciiTitle() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const draw = () => {
      const width = 1800, height = 290;
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const mask = document.createElement('canvas');
      mask.width = width; mask.height = height;
      const m = mask.getContext('2d', { willReadFrequently: true })!;
      m.font = '900 228px Arial, sans-serif';
      const text = 'SLIM.SHADERS';
      const textWidth = m.measureText(text).width;
      m.translate(36, 0); m.scale((width - 72) / textWidth, 1);
      m.fillStyle = '#fff'; m.fillText(text, 0, 222);
      const pixels = m.getImageData(0, 0, width, height).data;
      const solid = ctx.createLinearGradient(0, 0, width, 0);
      solid.addColorStop(0, '#f5f5f5'); solid.addColorStop(.33, '#f5f5f5');
      solid.addColorStop(.62, '#f5f5f555'); solid.addColorStop(.84, '#f5f5f500');
      ctx.drawImage(mask, 0, 0); ctx.globalCompositeOperation = 'source-in';
      ctx.fillStyle = solid; ctx.fillRect(0, 0, width, height);
      ctx.globalCompositeOperation = 'source-over';
      const glyphs = document.createElement('canvas'); glyphs.width = width; glyphs.height = height;
      const g = glyphs.getContext('2d')!;
      g.font = 'bold 12px monospace'; g.textAlign = 'center'; g.textBaseline = 'middle';
      const chars = ['#', '@', '+', ':', '*', '░', '×', '.'];
      for (let y = 22; y < 252; y += 10) for (let x = 480; x < width - 24; x += 10) {
        const t = Math.max(0, (x / width - .28) / .72);
        const noise = ((x * 374761 + y * 668265) >>> 0) % 997 / 997;
        const drift = Math.round(t * t * (noise - .5) * 30);
        if (!pixels[(y * width + x) * 4 + 3] || noise < t * t * .22) continue;
        g.globalAlpha = Math.min(1, t * 3) * (1 - t * .25);
        const symbol = chars[Math.floor(noise * chars.length)];
        if (t > .35) {
          g.fillStyle = '#ff589e'; g.fillText(symbol, x + t * 5, y + drift + 1);
          g.fillStyle = '#5de8ff'; g.fillText(symbol, x - t * 4, y + drift - 1);
        }
        g.fillStyle = '#edf0ff'; g.fillText(symbol, x, y + drift);
      }
      ctx.save(); ctx.filter = 'blur(12px)'; ctx.globalAlpha = .6; ctx.drawImage(glyphs, 0, 0); ctx.restore();
      ctx.drawImage(glyphs, 0, 0);
    };
    draw();
  }, []);
  return <h1 className="ascii-title"><span className="sr-only">SLIM.SHADERS</span><canvas ref={ref} aria-hidden="true" /></h1>;
}
