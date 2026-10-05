import { useEffect, useRef, useState } from 'react';
import { ArrowDownToLine, ArrowLeft, Upload, ImagePlus, X, Check, Maximize2, Replace, SlidersHorizontal } from 'lucide-react';
import { defaults } from './model';
import { Controls } from './Controls';
import { useRenderer } from './useRenderer';

export default function Editor({ onClose }: { onClose: () => void }) {
  const [params,setParams] = useState({...defaults}), [image,setImage] = useState<ImageBitmap|null>(null);
  const [name,setName] = useState(''), [error,setError] = useState(''), [loading,setLoading] = useState(false);
  const [dragging,setDragging] = useState(false), [exporting,setExporting] = useState(false), [downloaded,setDownloaded] = useState(false);
  const [scale,setScale] = useState('1'), [custom,setCustom] = useState(1), [compare,setCompare] = useState(false);
  const [originalUrl,setOriginalUrl] = useState('');
  const canvas = useRef<HTMLCanvasElement>(null), input = useRef<HTMLInputElement>(null), dialog = useRef<HTMLDialogElement>(null);
  const imageRef = useRef<ImageBitmap|null>(null), loadId = useRef(0), mounted = useRef(true);
  const {rendering,error:renderError,exportPng} = useRenderer(image, params, canvas);
  const opener = useRef(document.activeElement as HTMLElement | null);
  const exportScale = scale === 'custom' ? custom : Number(scale);
  useEffect(()=>{
    mounted.current=true; const modal=dialog.current;
    dialog.current?.showModal(); const overflow=document.body.style.overflow; document.body.style.overflow='hidden';
    return ()=>{ mounted.current=false; ++loadId.current; document.body.style.overflow=overflow; imageRef.current?.close(); modal?.close(); opener.current?.focus(); };
  },[]);
  useEffect(()=>()=>{if(originalUrl) URL.revokeObjectURL(originalUrl);},[originalUrl]);
  async function load(file: File | Blob, fileName='Untitled') {
    const id=++loadId.current; setError(''); setLoading(true); setDownloaded(false);
    try {
      if (!file.type.startsWith('image/') || file.type==='image/svg+xml') throw new Error('Choose a PNG, JPEG, WebP, GIF, or AVIF image.');
      if (file.size>50*1024*1024) throw new Error('Choose an image smaller than 50 MB.');
      const bitmap=await createImageBitmap(file, {imageOrientation:'from-image'});
      if (id!==loadId.current) {bitmap.close();return;}
      if (bitmap.width*bitmap.height>64_000_000 || Math.max(bitmap.width,bitmap.height)>16384) {bitmap.close();throw new Error('Choose an image under 64 megapixels and 16,384 px per side.');}
      imageRef.current?.close(); imageRef.current=bitmap; setImage(bitmap);setName(fileName);
      setOriginalUrl(URL.createObjectURL(file));setCompare(false);
    } catch(e) {if(id===loadId.current)setError(e instanceof Error?e.message:'Could not open that image.');}
    finally {if(id===loadId.current)setLoading(false);}
  }
  useEffect(()=>{
    const paste=(event:ClipboardEvent)=>{ const file=Array.from(event.clipboardData?.items||[]).find(item=>item.type.startsWith('image/'))?.getAsFile(); if(file){event.preventDefault();void load(file,'Pasted image');} };
    document.addEventListener('paste',paste);return ()=>document.removeEventListener('paste',paste);
  },[]);
  async function sample() {try {setLoading(true);const response=await fetch(`${import.meta.env.BASE_URL}sample.jpg`);if(!response.ok)throw new Error('Sample image could not load.');await load(await response.blob(),'David — Liam Ward');}catch(e){setError((e as Error).message);setLoading(false);}}
  async function download() {
    setError('');setExporting(true);setDownloaded(false);
    try {
      const blob=await exportPng(exportScale); if(!mounted.current)return;
      const url=URL.createObjectURL(blob), link=document.createElement('a');
      link.href=url;link.download=`${name.replace(/\.[^.]+$/,'').replace(/[^a-z0-9_-]/gi,'-')||'image'}-luminous-dust-${exportScale}x.png`;
      document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);setDownloaded(true);
    } catch(e){if(mounted.current)setError((e as Error).message);}finally{if(mounted.current)setExporting(false);}
  }
  return <dialog ref={dialog} className="editor-dialog" onCancel={event=>{event.preventDefault();onClose();}} onClick={e=>{if(e.target===dialog.current)onClose();}}><div className="editor-shell"><header className="editor-header"><button className="icon-button back-button" onClick={onClose} aria-label="Back to library"><ArrowLeft size={18}/></button><div className="editor-title"><h2>Luminous Dust</h2><span>Grain & luminous ink</span></div><span className="editor-local"><span/> Local processing</span><button className="icon-button close-button" onClick={onClose} aria-label="Close editor"><X size={19}/></button></header>
  <div className="editor-body"><div className="workspace-column"><div className="workspace-toolbar"><span className="file-name">{image?name:'YOUR CANVAS'}</span><div>{image&&<><button className={compare?'subtle-button active':'subtle-button'} onClick={()=>setCompare(!compare)} aria-pressed={compare}>Original</button><button className="subtle-button" onClick={()=>input.current?.click()} disabled={loading||exporting}><Replace size={14}/> Replace</button></>}</div></div>
  <div className={`workspace ${dragging?'dragging':''} ${image&&params.transparent?'checkerboard':''}`} onDragOver={e=>{e.preventDefault();setDragging(true);}} onDragLeave={e=>{if(!e.currentTarget.contains(e.relatedTarget as Node))setDragging(false);}} onDrop={e=>{e.preventDefault();setDragging(false);const file=e.dataTransfer.files[0];if(file&&!exporting)void load(file,file.name);}}>
  {image?<div className="image-frame"><canvas ref={canvas} aria-label="Luminous Dust image preview" style={{visibility:compare?'hidden':'visible'}}/>{compare&&<img src={originalUrl} alt="Original image for comparison"/>}</div>:<div className="empty-state"><div className="upload-symbol"><ImagePlus size={32} strokeWidth={1.3}/></div><p className="eyebrow">START WITH AN IMAGE</p><h3>A new perspective<br/>is one image away.</h3><p>Drop an image here, or paste with <kbd>⌘ / Ctrl V</kbd></p><button className="primary-button" onClick={()=>input.current?.click()} disabled={loading}><Upload size={15}/> Choose an image</button><button className="sample-button" onClick={sample} disabled={loading}>Or try the sample image <span>↗</span></button><span className="file-hint">PNG, JPG, WEBP, GIF, AVIF · UP TO 50 MB</span></div>}
  {loading&&<div className="render-status" role="status">Opening image…</div>}{dragging&&<div className="drop-overlay"><Upload/>Drop to {image?'replace':'add'} your image</div>}</div>
  <div className="canvas-status"><span><span className={`status-dot ${rendering?'busy':''}`}/>{image?(rendering?'Rendering…':compare?'Original image':'Live preview'):'Ready when you are'}</span><span>{image?`${image.width.toLocaleString()} × ${image.height.toLocaleString()} px`:'Your images never leave this device'}</span><Maximize2 size={13}/></div>
  {(error||renderError)&&<div className="error-message" role="alert">{error||renderError}</div>}</div>
  <aside className="settings"><div className="settings-heading"><SlidersHorizontal size={15}/><h3>Make it yours</h3><span>EFFECT</span></div><Controls params={params} set={p=>{setParams(p);setDownloaded(false);}}/><div className="export-panel"><div className="export-heading"><span>Export image</span><span>PNG</span></div><div className="export-options"><select aria-label="Export scale" value={scale} onChange={e=>setScale(e.target.value)}><option value="1">Original · 1×</option><option value="2">High resolution · 2×</option><option value="4">Ultra resolution · 4×</option><option value="custom">Custom scale</option></select>{scale==='custom'&&<input aria-label="Custom export scale" type="number" min="0.1" max="8" step="0.1" value={custom} onChange={e=>setCustom(Number(e.target.value))}/>}</div><button className="primary-button export-button" onClick={download} disabled={!image||loading||exporting||!!renderError}>{downloaded?<Check size={16}/>:<ArrowDownToLine size={16}/>} {exporting?'Rendering export…':downloaded?'Downloaded':'Export PNG'}<span>{image&&Number.isFinite(exportScale)?`${Math.round(image.width*exportScale)} × ${Math.round(image.height*exportScale)}`:'ADD AN IMAGE'}</span></button></div></aside></div>
  <input ref={input} className="hidden-input" aria-label="Upload image" type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/avif" onChange={e=>{const file=e.target.files?.[0];if(file)void load(file,file.name);e.target.value='';}}/>
  </div></dialog>;
}
