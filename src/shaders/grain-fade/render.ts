import type {FadeParams} from './model';
import {noise} from '../ascii/model';
type Context=CanvasRenderingContext2D|OffscreenCanvasRenderingContext2D;
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
const smooth=(a:number,b:number,v:number)=>{const t=clamp((v-a)/Math.max(.0001,b-a));return t*t*(3-2*t);};
export function renderFade(target:OffscreenCanvas|HTMLCanvasElement,image:ImageBitmap,p:FadeParams){
 const w=target.width,h=target.height,scale=w/image.width,ctx=target.getContext('2d',{willReadFrequently:true}) as Context;
 ctx.clearRect(0,0,w,h);ctx.filter=`blur(${p.blur*scale}px)`;ctx.drawImage(image,0,0,w,h);ctx.filter='none';const source=ctx.getImageData(0,0,w,h).data;
 ctx.clearRect(0,0,w,h);ctx.filter=`blur(${(p.blur+18)*scale}px)`;ctx.drawImage(image,0,0,w,h);ctx.filter='none';const halo=ctx.getImageData(0,0,w,h).data;
 const output=ctx.createImageData(w,h),d=output.data,angle=p.angle*Math.PI/180,cs=Math.cos(angle),sn=Math.sin(angle),span=Math.abs(cs)+Math.abs(sn);
 const bg=[1,3,5].map(i=>parseInt(p.background.slice(i,i+2),16)),feather=Math.max(.001,p.feather/100);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const i=(y*w+x)*4,u=x/w,v=y/h;
  const coordinate=p.mask==='linear'?.5+((u-.5)*cs+(v-.5)*sn)/span:Math.hypot((u-p.centerX/100)*w/Math.min(w,h),(v-p.centerY/100)*h/Math.min(w,h));
  const boundary=p.mask==='linear'?p.position/100:p.radius/100;
  let mask=1-smooth(boundary-feather/2,boundary+feather/2,coordinate);if(p.invert)mask=1-mask;
  mask=1-p.amount/100*(1-mask);
  const random=noise(Math.floor(x/scale/p.grainSize),Math.floor(y/scale/p.grainSize),p.seed);
  const stipple=p.grain/100;
  const alpha=clamp(mask+(random-.5)*stipple*.55*4*mask*(1-mask));
  const sourceAlpha=source[i+3]/255,haloAlpha=halo[i+3]/255*p.glow/100*.4;
  const coverage=sourceAlpha+haloAlpha*(1-sourceAlpha),outAlpha=coverage*alpha;
  const l=.2126*source[i]+.7152*source[i+1]+.0722*source[i+2];
  for(let c=0;c<3;c++){
   const color=clamp((l+(source[i+c]-l)*p.saturation/100)/255)*255;
   const bloom=color+(255-color)*(halo[i+c]/255)*p.glow/100*.35;
   const mixed=coverage?(bloom*sourceAlpha+halo[i+c]*haloAlpha*(1-sourceAlpha))/coverage:0;
   const textured=Math.max(0,Math.min(255,mixed+(random-.5)*p.grain*.65));
   d[i+c]=p.transparent?textured:textured*outAlpha+bg[c]*(1-outAlpha);
  }
  d[i+3]=p.transparent?Math.round(outAlpha*255):255;
 }
 ctx.putImageData(output,0,0);
}
