import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, ArrowRight, Plus, Sparkles } from 'lucide-react';
import { useEditorTool } from './webmcp';
import Editor from './shaders/ascii/Editor';
import { shaders } from './shaders/registry';
import { defaults } from './shaders/ascii/model';
import { renderAscii } from './shaders/ascii/render';

export default function App() {
  const [open, setOpen] = useState(false);
  useEditorTool(()=>setOpen(true));
  const thumbnail = useRef<HTMLCanvasElement>(null);
  useEffect(() => { let active = true; fetch('/sample.jpg').then(r=>r.blob()).then(createImageBitmap).then(image=>{
    if (active && thumbnail.current) renderAscii(thumbnail.current, image, { ...defaults, size: 9 });
    image.close();
  }).catch(()=>{}); return ()=>{active=false;}; }, []);
  return <div className="app"><header className="header"><a className="brand" href="/" aria-label="SLIM.SHADERS home"><span className="brand-mark">S<span>▪</span></span>SLIM<span className="brand-dot">.</span>SHADERS</a><span className="header-note">A playground for pixels</span><span className="version"><span/> Collection 001</span></header>
  <main className="gallery"><div className="intro"><div><p className="eyebrow">THE SHADER LIBRARY</p><h1>New ways to see.</h1><p className="subtitle">Turn familiar images into something unexpected.</p></div><div className="collection-count"><span>01</span> EFFECT & COUNTING</div></div>
  <div className="gallery-toolbar"><span className="selected-tab">All effects <span>1</span></span><span className="local-label"><span/> Made in your browser. Yours to keep.</span></div>
  <div className="card-grid">{shaders.map(shader=><button className="shader-card" key={shader.id} onClick={()=>setOpen(true)} aria-label="Open ASCII editor"><div className="card-art"><canvas ref={thumbnail} width={900} height={600}/><span className="card-number">001 / ASCII</span><span className="card-tag"><Sparkles size={13}/> LIVE EFFECT</span><span className="card-open"><ArrowUpRight size={24}/></span></div><div className="card-info"><div><span className="eyebrow">{shader.category}</span><h2>{shader.name}</h2><p>{shader.description}</p></div><ArrowRight size={20}/></div></button>)}<div className="next-card"><div className="next-symbol"><Plus size={28} strokeWidth={1}/></div><span className="eyebrow">STILL EXPERIMENTING</span><h2>More to come.</h2><p>The library is just getting started.</p><span className="coming-pill">IN THE MAKING</span></div></div>
  <footer><span>SLIM.SHADERS © {new Date().getFullYear()}</span><span>Small experiments. Endless possibilities.</span><span className="footer-icon">✳</span></footer></main>
  {open && <Editor onClose={()=>setOpen(false)}/>}
  </div>;
}
