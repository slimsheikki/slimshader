import {useEffect,useRef,useState,type RefObject} from 'react';
import {dimensions,type GeometryParams} from './model';
import {renderGeometry} from './render';
export function useRenderer(image:ImageBitmap|null,params:GeometryParams,canvas:RefObject<HTMLCanvasElement|null>){
 const [playing,setPlaying]=useState(()=>!matchMedia('(prefers-reduced-motion: reduce)').matches),[error,setError]=useState(''),[progress,setProgress]=useState(0);
 const time=useRef(0),state=useRef({image,params,playing});state.current={image,params,playing};
 const recording=useRef(false),cancel=useRef<(()=>void)|null>(null);
 useEffect(()=>{time.current=0;setError('');return()=>{cancel.current?.();};},[image]);
 useEffect(()=>{
  let frame=0,last=0,paintedImage:ImageBitmap|null=null,paintedParams:GeometryParams|null=null;
  const tick=(now:number)=>{
   frame=requestAnimationFrame(tick);if(now-last<1000/30)return;
   const dt=last?Math.min(.1,(now-last)/1000):0;last=now;
   const {image,params,playing}=state.current,c=canvas.current;
   if(!image||!c||document.hidden||recording.current)return;
   if(!playing&&paintedImage===image&&paintedParams===params)return;
   if(playing)time.current+=dt;
   const scale=Math.min(1,1100/Math.max(image.width,image.height)),w=Math.max(1,Math.round(image.width*scale)),h=Math.max(1,Math.round(image.height*scale));
   if(c.width!==w||c.height!==h){c.width=w;c.height=h;}
   try{renderGeometry(c,image,params,time.current);paintedImage=image;paintedParams=params;}catch(e){setError((e as Error).message);cancelAnimationFrame(frame);}
  };frame=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frame);
 },[canvas]);
 async function exportPng(scale:number){
  if(!image)throw new Error('Add an image first.');
  const size=dimensions(image.width,image.height,scale),c=document.createElement('canvas');c.width=size.width;c.height=size.height;
  renderGeometry(c,image,params,time.current);
  return new Promise<Blob>((resolve,reject)=>c.toBlob(blob=>{c.width=1;c.height=1;blob?resolve(blob):reject(new Error('PNG export failed.'));},'image/png'));
 }
 async function exportVideo(){
  if(!image)throw new Error('Add an image first.');
  if(recording.current)throw new Error('An export is already running.');
  if(typeof MediaRecorder==='undefined')throw new Error('Video export is unavailable in this browser. Try Chrome or Edge.');
  const mime=['video/webm;codecs=vp9','video/webm;codecs=vp8','video/mp4'].find(t=>MediaRecorder.isTypeSupported(t));
  if(!mime)throw new Error('This browser has no supported video encoder. Try Chrome or Edge.');
  const c=document.createElement('canvas'),scale=Math.min(1,1280/Math.max(image.width,image.height));
  c.width=Math.max(2,Math.round(image.width*scale/2)*2);c.height=Math.max(2,Math.round(image.height*scale/2)*2);
  const settings={...params,transparent:false};renderGeometry(c,image,settings,0);
  const stream=c.captureStream(30);let recorder:MediaRecorder;
  try{recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:8_000_000});}catch(e){stream.getTracks().forEach(t=>t.stop());throw e;}
  recording.current=true;setProgress(0);
  return new Promise<Blob>((resolve,reject)=>{
   const chunks:Blob[]=[];let frame=0,finished=false,start=0;
   const cleanup=()=>{cancelAnimationFrame(frame);stream.getTracks().forEach(t=>t.stop());recording.current=false;cancel.current=null;document.removeEventListener('visibilitychange',visibility);};
   const fail=(message:string)=>{if(finished)return;finished=true;if(recorder.state!=='inactive')recorder.stop();cleanup();reject(new Error(message));};
   const visibility=()=>{if(document.hidden)fail('Keep this tab visible while exporting the animation.');};
   cancel.current=()=>fail('Animation export cancelled.');document.addEventListener('visibilitychange',visibility);
   recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
   recorder.onerror=()=>fail('Video export failed. Try a smaller image.');
   recorder.onstop=()=>{if(finished)return;finished=true;cleanup();setProgress(100);chunks.length?resolve(new Blob(chunks,{type:mime})):reject(new Error('The video encoder returned no frames.'));};
   const tick=(now:number)=>{
    if(!start)start=now;const elapsed=(now-start)/1000;
    if(elapsed>=settings.duration){recorder.stop();return;}
    try{renderGeometry(c,image,settings,elapsed);setProgress(Math.round(elapsed/settings.duration*100));frame=requestAnimationFrame(tick);}catch(e){fail((e as Error).message);}
   };
   try{recorder.start();frame=requestAnimationFrame(tick);}catch(e){fail((e as Error).message);}
  });
 }
 return{rendering:false,error,exportPng,exportVideo,playing,setPlaying,progress};
}
