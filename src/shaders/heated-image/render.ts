import type { HeatedParams } from './model';
type Context=OffscreenCanvasRenderingContext2D|CanvasRenderingContext2D;
const clamp=(x:number)=>Math.max(0,Math.min(1,x));
const stops=[[7,4,27],[26,7,91],[79,15,148],[166,34,135],[240,73,84],[255,153,72],[255,237,164]];
const thermal=(v:number)=>{const t=clamp(v)*6,i=Math.min(5,Math.floor(t)),f=t-i;return stops[i].map((n,c)=>n*(1-f)+stops[i+1][c]*f);};
// Image luminance drives heat; source contours drive directional rims and spectral fringes.
export function renderHeated(target:OffscreenCanvas|HTMLCanvasElement,image:ImageBitmap,p:HeatedParams){
 const w=target.width,h=target.height,scale=w/image.width,ctx=target.getContext('2d',{willReadFrequently:true}) as Context;
 ctx.clearRect(0,0,w,h);ctx.drawImage(image,0,0,w,h);const source=ctx.getImageData(0,0,w,h).data;
 ctx.clearRect(0,0,w,h);ctx.filter=`blur(${(2+p.glow*.12)*scale}px)`;ctx.drawImage(image,0,0,w,h);ctx.filter='none';const soft=ctx.getImageData(0,0,w,h).data;
 const out=ctx.createImageData(w,h),data=out.data,step=Math.max(1,Math.round((1+p.rim*.06)*scale)),angle=p.light*Math.PI/180;
 const luminance=(a:Uint8ClampedArray,i:number)=>(a[i]*.2126+a[i+1]*.7152+a[i+2]*.0722)/255;
 const at=(x:number,y:number)=>luminance(source,(Math.max(0,Math.min(h-1,y))*w+Math.max(0,Math.min(w-1,x)))*4);
 const bg=[1,3,5].map(i=>parseInt(p.background.slice(i,i+2),16));
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const i=(y*w+x)*4,l=luminance(source,i),blur=luminance(soft,i);
  const dx=at(x+step,y)-at(x-step,y),dy=at(x,y+step)-at(x,y-step),edge=Math.hypot(dx,dy);
  const light=clamp(.5+(dx*Math.cos(angle)+dy*Math.sin(angle))*2);
  const heat=clamp(l*(.55+p.heat*.009)+edge*(.15+p.rim*.006)*light);
  const color=thermal(heat),halo=thermal(clamp(blur+.18));
  const bloom=clamp(blur-l)*p.glow/100*.7,fringe=edge*p.dispersion/100;
  const alpha=source[i+3]/255;
  for(let c=0;c<3;c++){
   const v=Math.min(255,color[c]+halo[c]*bloom+fringe*[0,75,110][c]);
   data[i+c]=p.transparent?v:v*alpha+bg[c]*(1-alpha);
  }
  data[i+3]=p.transparent?source[i+3]:255;
 }
 ctx.putImageData(out,0,0);
}
