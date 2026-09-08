import { useEffect, useRef } from 'react';

/** Cached letter mask with a restrained, visibility-aware ASCII scan. */
export default function AsciiTitle() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let visible = true, frame = 0, last = 0;
    const setup = () => {
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
      const base = document.createElement('canvas'); base.width = width; base.height = height;
      base.getContext('2d')!.drawImage(canvas, 0, 0);
      const points: {x:number;y:number;t:number;noise:number}[] = [];
      const chars = ['#', '@', '+', ':', '*', '░', '×', '.'];
      for (let y = 22; y < 252; y += 10) for (let x = 480; x < width - 24; x += 10) {
        const t = Math.max(0, (x / width - .28) / .72);
        const noise = ((x * 374761 + y * 668265) >>> 0) % 997 / 997;

        if (!pixels[(y * width + x) * 4 + 3] || noise < t * t * .22) continue;
        points.push({x,y,t,noise});
      }
      const draw = (time: number) => {
        ctx.clearRect(0,0,width,height); ctx.drawImage(base,0,0);
        g.clearRect(0,0,width,height);
        const scan = 420 + (time % 8000) / 8000 * 1500;
        for (const {x,y,t,noise} of points) {
          const pulse = reduced.matches ? 0 : Math.exp(-Math.pow((x-scan)/95,2));
          const drift = Math.round(t*t*(noise-.5)*30 + pulse*Math.sin(y*.09)*t*3);
          g.globalAlpha = Math.min(1,t*3)*(1-t*.25)*(.85+pulse*.15);
          const phase = reduced.matches ? 0 : Math.floor(time/650 + noise*5);
          const symbol = chars[(Math.floor(noise*chars.length)+(noise>.68?phase:0))%chars.length];
          g.fillStyle = pulse>.3 ? '#fff' : '#d9d9d9';
          g.fillText(symbol,x,y+drift);
        }
      ctx.save(); ctx.filter = 'blur(12px)'; ctx.globalAlpha = .6; ctx.drawImage(glyphs, 0, 0); ctx.restore();
      ctx.drawImage(glyphs, 0, 0);
      };
      return draw;
    };
    const draw = setup();
    if (!draw) return;
    draw(0);
    const tick = (time:number) => {
      if (visible && !document.hidden && !reduced.matches && time-last>80) { draw(time); last=time; }
      frame=requestAnimationFrame(tick);
    };
    const observer = new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;});
    observer.observe(canvas);
    const motionChange = () => { if(reduced.matches) draw(0); };
    reduced.addEventListener('change',motionChange);
    frame=requestAnimationFrame(tick);
    return ()=>{cancelAnimationFrame(frame);observer.disconnect();reduced.removeEventListener('change',motionChange);};
  }, []);
  return <h1 className="ascii-title"><span className="sr-only">SLIM.SHADERS</span><canvas ref={ref} aria-hidden="true" /></h1>;
}
