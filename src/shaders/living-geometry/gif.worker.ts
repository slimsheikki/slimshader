/// <reference lib="webworker" />
import {GIFEncoder,quantize,applyPalette} from 'gifenc';
import {renderGeometry} from './render';
import type {GeometryParams} from './model';
self.onmessage=({data}:{data:{image:ImageBitmap;params:GeometryParams;longSide:number}})=>{
 const {image,params,longSide}=data;
 try{
  const scale=Math.min(1,longSide/Math.max(image.width,image.height));
  const w=Math.max(1,Math.round(image.width*scale)),h=Math.max(1,Math.round(image.height*scale));
  const canvas=new OffscreenCanvas(w,h),ctx=canvas.getContext('2d',{willReadFrequently:true})!;
  const settings={...params,transparent:false},fps=20,frames=Math.round(params.duration*fps),gif=GIFEncoder();
  renderGeometry(canvas,image,settings,0);
  // A fixed source-derived palette prevents color flicker between frames.
  const palette=quantize(ctx.getImageData(0,0,w,h).data,255);palette.push([240,245,245]);
  for(let i=0;i<frames;i++){
   renderGeometry(canvas,image,settings,i/fps);
   const pixels=ctx.getImageData(0,0,w,h).data;
   gif.writeFrame(applyPalette(pixels,palette),w,h,{palette:i===0?palette:undefined,delay:50,repeat:0,dispose:1});
   if(gif.bytesView().length>80*1024*1024)throw new Error('GIF is too large. Choose a smaller GIF size or shorter loop.');
   self.postMessage({progress:Math.round((i+1)/frames*100)});
  }
  gif.finish();self.postMessage({blob:new Blob([gif.bytes()],{type:'image/gif'})});
 }catch(e){self.postMessage({error:e instanceof Error?e.message:'GIF export failed. Try a smaller size.'});}
 finally{image.close();}
};
