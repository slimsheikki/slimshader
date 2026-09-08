import FilmEditor from './shaders/iridescent-film/Editor';
import {defaults as filmDefaults} from './shaders/iridescent-film/model';
import {renderFilm} from './shaders/iridescent-film/render';
import FlowEditor from './shaders/flow-trails/Editor';
import {defaults as flowDefaults} from './shaders/flow-trails/model';
import {renderFlow} from './shaders/flow-trails/render';
import SpectralEditor from './shaders/spectral-bloom/Editor';
import {defaults as spectralDefaults} from './shaders/spectral-bloom/model';
import {renderSpectral} from './shaders/spectral-bloom/render';
import ParticleEditor from './shaders/particle-field/Editor';
import {defaults as particleDefaults} from './shaders/particle-field/model';
import {renderParticles} from './shaders/particle-field/render';
import ContourEditor from './shaders/chromatic-contours/Editor';
import {defaults as contourDefaults} from './shaders/chromatic-contours/model';
import {renderContours} from './shaders/chromatic-contours/render';
import StreakEditor from './shaders/digital-streaks/Editor';
import {defaults as streakDefaults} from './shaders/digital-streaks/model';
import {renderStreaks} from './shaders/digital-streaks/render';
import GlassEditor from './shaders/glass/Editor';
import { defaults as glassDefaults } from './shaders/glass/model';
import { renderGlass } from './shaders/glass/render';
import AsciiTitle from './components/AsciiTitle';
import FadeEditor from './shaders/grain-fade/Editor';
import { defaults as fadeDefaults } from './shaders/grain-fade/model';
import { renderFade } from './shaders/grain-fade/render';
import BlueprintEditor from './shaders/blueprint/Editor';
import { defaults as blueprintDefaults } from './shaders/blueprint/model';
import { renderBlueprint } from './shaders/blueprint/render';
import HeatedImageEditor from './shaders/heated-image/Editor';
import { defaults as heatedImageDefaults } from './shaders/heated-image/model';
import { renderHeated as renderHeatedImage } from './shaders/heated-image/render';
import SketchEditor from './shaders/storyboard/Editor';
import { defaults as sketchDefaults } from './shaders/storyboard/model';
import { renderSketch } from './shaders/storyboard/render';
import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
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
  const spectralThumbnail=useRef<HTMLCanvasElement>(null);
  const particleThumbnail=useRef<HTMLCanvasElement>(null);
  const contourThumbnail=useRef<HTMLCanvasElement>(null);
  const streakThumbnail=useRef<HTMLCanvasElement>(null);
  const flowThumbnail=useRef<HTMLCanvasElement>(null);
  const filmThumbnail=useRef<HTMLCanvasElement>(null);
  const thumbnail = useRef<HTMLCanvasElement>(null);
  const glassThumbnail = useRef<HTMLCanvasElement>(null);
  const fadeThumbnail = useRef<HTMLCanvasElement>(null);
  const blueprintThumbnail = useRef<HTMLCanvasElement>(null);
  const heatedImageThumbnail = useRef<HTMLCanvasElement>(null);
  const sketchThumbnail = useRef<HTMLCanvasElement>(null);
  const toonThumbnail = useRef<HTMLCanvasElement>(null);
  useEffect(() => { let active = true; fetch(`${import.meta.env.BASE_URL}sample.jpg`).then(r=>r.blob()).then(createImageBitmap).then(image=>{
    if (active && thumbnail.current) renderAscii(thumbnail.current, image, { ...defaults, size: 9 });
    if (active && toonThumbnail.current) renderToon(toonThumbnail.current, image, toonDefaults);
    if (active && sketchThumbnail.current) renderSketch(sketchThumbnail.current,image,sketchDefaults);
    if(active&&heatedImageThumbnail.current)renderHeatedImage(heatedImageThumbnail.current,image,heatedImageDefaults);
    if(active&&blueprintThumbnail.current)renderBlueprint(blueprintThumbnail.current,image,blueprintDefaults);
    if(active&&fadeThumbnail.current)renderFade(fadeThumbnail.current,image,fadeDefaults);
    if(active&&glassThumbnail.current)renderGlass(glassThumbnail.current,image,glassDefaults);
    if(active&&spectralThumbnail.current)renderSpectral(spectralThumbnail.current,image,spectralDefaults);
    if(active&&particleThumbnail.current)renderParticles(particleThumbnail.current,image,particleDefaults);
    if(active&&contourThumbnail.current)renderContours(contourThumbnail.current,image,contourDefaults);
    if(active&&streakThumbnail.current)renderStreaks(streakThumbnail.current,image,streakDefaults);
    if(active&&flowThumbnail.current)renderFlow(flowThumbnail.current,image,flowDefaults);
    if(active&&filmThumbnail.current)renderFilm(filmThumbnail.current,image,filmDefaults);
    image.close();
  }).catch(()=>{}); return ()=>{active=false;}; }, []);
  return <div className="app"><main className="gallery"><AsciiTitle/><div className="signal-rule"><span>SHADER COLLECTION / {String(shaders.length).padStart(2,'0')}</span><span className="signal-bars" aria-hidden="true">{Array.from({length:24},(_,i)=><i key={i}/>)}</span></div>
  <div className="card-grid">{shaders.map((shader,index)=><button className="shader-card" key={shader.id} onClick={()=>setOpen(shader.id)} aria-label={`Open ${shader.name} editor`}><div className="card-art"><canvas ref={shader.id==='iridescent-film'?filmThumbnail:shader.id==='flow-trails'?flowThumbnail:shader.id==='spectral-bloom'?spectralThumbnail:shader.id==='particle-field'?particleThumbnail:shader.id==='chromatic-contours'?contourThumbnail:shader.id==='digital-streaks'?streakThumbnail:shader.id==='ascii'?thumbnail:shader.id==='toon'?toonThumbnail:shader.id==='storyboard'?sketchThumbnail:shader.id==='heated-image'?heatedImageThumbnail:shader.id==='blueprint'?blueprintThumbnail:shader.id==='glass'?glassThumbnail:fadeThumbnail} width={900} height={600}/><span className="signal-index">{String(index+1).padStart(2,'0')}</span></div><div className="card-info"><div><h2>{shader.name}</h2></div><ArrowUpRight size={20}/></div></button>)}</div></main>
  {open === 'spectral-bloom' && <SpectralEditor onClose={()=>setOpen(null)}/>}
  {open === 'particle-field' && <ParticleEditor onClose={()=>setOpen(null)}/>}
  {open === 'chromatic-contours' && <ContourEditor onClose={()=>setOpen(null)}/>}
  {open === 'digital-streaks' && <StreakEditor onClose={()=>setOpen(null)}/>}
  {open === 'flow-trails' && <FlowEditor onClose={()=>setOpen(null)}/>}
  {open === 'iridescent-film' && <FilmEditor onClose={()=>setOpen(null)}/>}
  {open === 'glass' && <GlassEditor onClose={()=>setOpen(null)}/>}
  {open === 'ascii' && <Editor onClose={()=>setOpen(null)}/>}
  {open === 'grain-fade' && <FadeEditor onClose={()=>setOpen(null)}/>}
  {open === 'blueprint' && <BlueprintEditor onClose={()=>setOpen(null)}/>}
  {open === 'heated-image' && <HeatedImageEditor onClose={()=>setOpen(null)}/>}
  {open === 'storyboard' && <SketchEditor onClose={()=>setOpen(null)}/>}
  {open === 'toon' && <ToonEditor onClose={()=>setOpen(null)}/>}
  </div>;
}
