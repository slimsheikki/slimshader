import type {DustParams} from './model';
import {source,context,surface,type Surface} from '../shared/canvas';
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
function noise(x:number,y:number,seed:number){let n=Math.imul(x,374761393)^Math.imul(y,668265263)^Math.imul(seed,1274126177);n=Math.imul(n^(n>>>13),1274126177);return((n^(n>>>16))>>>0)/4294967296;}
export function renderDust(target:Surface,image:ImageBitmap,p:DustParams){
 const w=target.width,h=target.height,ctx=context(target),scale=w/image.width;
 const src=source(image,w,h),s=context(src),original=s.getImageData(0,0,w,h).data;
 if(p.softness){s.clearRect(0,0,w,h);s.filter=`blur(${p.softness*scale}px)`;s.drawImage(image,0,0,w,h);s.filter='none';}
 const soft=s.getImageData(0,0,w,h).data;
 const light=surface(w,h),lc=context(light),base=lc.createImageData(w,h),cut=p.cutoff/100;
 // Exposure and black isolation produce continuous luminous ink, not a grid of dots.
 for(let i=0;i<soft.length;i+=4){
  let l=(soft[i]*.2126+soft[i+1]*.7152+soft[i+2]*.0722)/255;
  l=clamp((l*Math.pow(2,p.exposure/40)-cut)/(1-cut));
  l=clamp((l-.5)*(1+p.contrast/100*1.8)+.5);
  base.data[i]=base.data[i+1]=base.data[i+2]=l*255;base.data[i+3]=soft[i+3];
 }
 lc.putImageData(base,0,0);
 const halo=surface(w,h),hc=context(halo);hc.filter=`blur(${Math.max(.5,12*scale)}px)`;hc.drawImage(light,0,0);hc.filter='none';
 const bloom=hc.getImageData(0,0,w,h).data,out=ctx.createImageData(w,h),d=out.data;
 const tint=[1,3,5].map(i=>parseInt(p.tint.slice(i,i+2),16)),bg=[1,3,5].map(i=>parseInt(p.background.slice(i,i+2),16));
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const i=(y*w+x)*4,l=base.data[i]/255,a=original[i+3]/255;
  // Fixed source-space grain preserves the texture scale in high-resolution exports.
  const n=noise(Math.floor(x/scale/p.size),Math.floor(y/scale/p.size),p.seed);
  const dust=clamp(l+(n-.5)*1.55*Math.sqrt(l)*(p.grain/100));
  const value=clamp(dust+bloom[i]/255*p.glow/100*.5);
  for(let c=0;c<3;c++){
   const ink=tint[c]*value+(255-tint[c])*Math.pow(value,4);
   d[i+c]=p.transparent?ink:ink*a+bg[c]*(1-value*a);
  }
  d[i+3]=p.transparent?a*255:255;
 }
 ctx.putImageData(out,0,0);
}
