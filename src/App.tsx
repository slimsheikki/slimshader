import FadeEditor from './shaders/grain-fade/Editor';
import { defaults as fadeDefaults } from './shaders/grain-fade/model';
import { renderFade } from './shaders/grain-fade/render';
import BlueprintEditor from './shaders/blueprint/Editor';
import { defaults as blueprintDefaults } from './shaders/blueprint/model';
import { renderBlueprint } from './shaders/blueprint/render';
import HeatedImageEditor from './shaders/heated-image/Editor';
import { defaults as heatedImageDefaults } from './shaders/heated-image/model';
import { renderHeated as renderHeatedImage } from './shaders/heated-image/render';
import HeatedEditor from './shaders/heated/Editor';
import { defaults as heatedDefaults } from './shaders/heated/model';
import { renderHeated } from './shaders/heated/render';
import SketchEditor from './shaders/storyboard/Editor';
import { defaults as sketchDefaults } from './shaders/storyboard/model';
import { renderSketch } from './shaders/storyboard/render';
import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, ArrowRight, Plus, Sparkles } from 'lucide-react';
import { useEditorTool } from './webmcp';
import ToonEditor from './shaders/toon/Editor';
import { defaults as toonDefaults } from './shaders/toon/model';
import { renderToon } from './shaders/toon/render';
import Editor from './shaders/ascii/Editor';
import { shaders } from './shaders/registry';
import { defaults } from './shaders/ascii/model';
import { renderAscii } from './shaders/ascii/render';

export default function App() {
  const [open, setOpen] = useState<string | null>(null);
  useEditorTool(()=>setOpen('ascii'));
  const thumbnail = useRef<HTMLCanvasElement>(null);
  const fadeThumbnail = useRef<HTMLCanvasElement>(null);
  const blueprintThumbnail = useRef<HTMLCanvasElement>(null);
  const heatedImageThumbnail = useRef<HTMLCanvasElement>(null);
  const heatedThumbnail = useRef<HTMLCanvasElement>(null);
  const sketchThumbnail = useRef<HTMLCanvasElement>(null);
  const toonThumbnail = useRef<HTMLCanvasElement>(null);
  useEffect(() => { let active = true; fetch(`${import.meta.env.BASE_URL}sample.jpg`).then(r=>r.blob()).then(createImageBitmap).then(image=>{
    if (active && thumbnail.current) renderAscii(thumbnail.current, image, { ...defaults, size: 9 });
    if (active && toonThumbnail.current) renderToon(toonThumbnail.current, image, toonDefaults);
    if (active && sketchThumbnail.current) renderSketch(sketchThumbnail.current,image,sketchDefaults);
    if(active&&heatedThumbnail.current)renderHeated(heatedThumbnail.current,image,heatedDefaults);
    if(active&&heatedImageThumbnail.current)renderHeatedImage(heatedImageThumbnail.current,image,heatedImageDefaults);
    if(active&&blueprintThumbnail.current)renderBlueprint(blueprintThumbnail.current,image,blueprintDefaults);
    if(active&&fadeThumbnail.current)renderFade(fadeThumbnail.current,image,fadeDefaults);
    image.close();
  }).catch(()=>{}); return ()=>{active=false;}; }, []);
  return <div className="app"><header className="header"><a className="brand" href={import.meta.env.BASE_URL} aria-label="SLIM.SHADERS home"><span className="brand-mark">S<span>▪</span></span>SLIM<span className="brand-dot">.</span>SHADERS</a><span className="header-note">A playground for pixels</span><span className="version"><span/> Collection 001</span></header>
  <main className="gallery"><div className="intro"><div><p className="eyebrow">THE SHADER LIBRARY</p><h1>New ways to see.</h1><p className="subtitle">Turn familiar images into something unexpected.</p></div><div className="collection-count"><span>07</span> EFFECTS & COUNTING</div></div>
  <div className="gallery-toolbar"><span className="selected-tab">All effects <span>7</span></span><span className="local-label"><span/> Made in your browser. Yours to keep.</span></div>
  <div className="card-grid">{shaders.map(shader=><button className="shader-card" key={shader.id} onClick={()=>setOpen(shader.id)} aria-label={`Open ${shader.name} editor`}><div className="card-art"><canvas ref={shader.id==='ascii'?thumbnail:shader.id==='toon'?toonThumbnail:shader.id==='storyboard'?sketchThumbnail:shader.id==='heated'?heatedThumbnail:shader.id==='heated-image'?heatedImageThumbnail:shader.id==='blueprint'?blueprintThumbnail:fadeThumbnail} width={900} height={600}/><span className="card-number">{shader.id==='ascii'?'001 / ASCII':shader.id==='toon'?'002 / PAINTERLY TOON':shader.id==='storyboard'?'003 / STORYBOARD':shader.id==='heated'?'004 / HEATED SHAPES':shader.id==='heated-image'?'005 / HEATED SHADER':shader.id==='blueprint'?'006 / BLUEPRINT MOSAIC':'007 / GRAIN FADE'}</span><span className="card-tag"><Sparkles size={13}/> LIVE EFFECT</span><span className="card-open"><ArrowUpRight size={24}/></span></div><div className="card-info"><div><span className="eyebrow">{shader.category}</span><h2>{shader.name}</h2><p>{shader.description}</p></div><ArrowRight size={20}/></div></button>)}<div className="next-card"><div className="next-symbol"><Plus size={28} strokeWidth={1}/></div><span className="eyebrow">STILL EXPERIMENTING</span><h2>More to come.</h2><p>The library is just getting started.</p><span className="coming-pill">IN THE MAKING</span></div></div>
  <footer><span>SLIM.SHADERS © {new Date().getFullYear()}</span><span>Small experiments. Endless possibilities.</span><span className="footer-icon">✳</span></footer></main>
  {open === 'ascii' && <Editor onClose={()=>setOpen(null)}/>}
  {open === 'grain-fade' && <FadeEditor onClose={()=>setOpen(null)}/>}
  {open === 'blueprint' && <BlueprintEditor onClose={()=>setOpen(null)}/>}
  {open === 'heated-image' && <HeatedImageEditor onClose={()=>setOpen(null)}/>}
  {open === 'heated' && <HeatedEditor onClose={()=>setOpen(null)}/>}
  {open === 'storyboard' && <SketchEditor onClose={()=>setOpen(null)}/>}
  {open === 'toon' && <ToonEditor onClose={()=>setOpen(null)}/>}
  </div>;
}
