import { RotateCcw } from 'lucide-react';
import { defaults, type LcdParams } from './model';
export function Controls({ params: p, set }: { params: LcdParams; set: (p: LcdParams) => void }) {
  const update = <K extends keyof LcdParams>(key: K, value: LcdParams[K]) => set({ ...p, [key]: value });
  const slider = (key: keyof LcdParams, label: string, min: number, max: number) => <label className="slider-control"><span>{label}<output>{p[key]}</output></span><input aria-label={label} type="range" min={min} max={max} value={Number(p[key])} onChange={e => update(key, Number(e.target.value))} style={{ '--fill': `${(Number(p[key]) - min) / (max - min) * 100}%` } as React.CSSProperties}/></label>;
  return <div className="controls">
    <section className="control-section"><div className="section-title"><span>LCD screen</span></div>
      <label className="field-label">Screen layout<select aria-label="Screen layout" value={p.layout} onChange={e => update('layout', e.target.value as LcdParams['layout'])}><option value="image">Image proportions</option><option value="classic">Classic 84 × 48</option></select></label>
      {p.layout === 'image' && slider('columns', 'Pixel resolution', 24, 240)}
      <label className="field-label">Dithering<select aria-label="Dithering" value={p.dither} onChange={e => update('dither', e.target.value as LcdParams['dither'])}><option value="ordered">Ordered · patterned</option><option value="diffusion">Diffusion · organic</option><option value="none">None · solid pixels</option></select></label>
      {p.dither !== 'none' && slider('amount', 'Dither amount', 0, 100)}
      {slider('gap', 'Pixel gap', 0, 40)}{!p.transparent && <>{slider('grid', 'Inactive pixels', 0, 20)}{slider('shadow', 'Pixel shadow', 0, 60)}</>}
    </section>
    <section className="control-section"><div className="section-title"><span>Image adjustments</span></div>
      {slider('threshold', 'Dark pixel coverage', 0, 100)}{slider('brightness', 'Brightness', -100, 100)}{slider('contrast', 'Contrast', -100, 100)}
      <label className="toggle-control"><span>Invert tones</span><input type="checkbox" role="switch" checked={p.invert} onChange={e => update('invert', e.target.checked)}/></label>
    </section>
    <section className="control-section"><div className="section-title"><span>Screen colors</span></div>
      <div className="color-row"><label><input aria-label="Pixel color" type="color" value={p.foreground} onChange={e => update('foreground', e.target.value)}/><span>Pixels</span></label><label><input aria-label="Screen color" type="color" value={p.background} onChange={e => update('background', e.target.value)}/><span>Screen</span></label></div>
      <label className="toggle-control"><span>Transparent background</span><input type="checkbox" role="switch" checked={p.transparent} onChange={e => update('transparent', e.target.checked)}/></label>
    </section>
    <button className="reset-button" onClick={() => set({ ...defaults })}><RotateCcw size={14}/> Reset all settings</button>
  </div>;
}
