import type {MarbleParams} from './model';
import {context,source,type Surface} from '../shared/canvas';
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
const rand=(i:number)=>{const v=Math.sin(i*127.1+311.7)*43758.5453;return v-Math.floor(v);};
export function renderMarble(target:Surface,image:ImageBitmap,p:MarbleParams){
 const w=target.width,h=target.height,ctx=context(target),src=context(source(image,w,h)).getImageData(0,0,w,h).data,out=ctx.createImageData(w,h),d=out.data;
 const radius=.12+p.scale/100*.44,amount=p.swirl/100*4.5,mix=p.strength/100,aspect=w/h;
 const vortices=Array.from({length:7},(_,i)=>({x:rand(p.seed+i*3)*aspect,y:rand(p.seed+i*3+1),spin:(i%2?1:-1)*(.6+rand(p.seed+i*3+2))}));
 const palette=[p.sand,p.teal,p.coral,p.sand].map(hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16))),bg=[1,3,5].map(i=>parseInt(p.background.slice(i,i+2),16));
 const sample=(x:number,y:number,c:number)=>{
  x=clamp(x)*Math.max(0,w-1);y=clamp(y)*Math.max(0,h-1);const x0=Math.floor(x),y0=Math.floor(y),x1=Math.min(w-1,x0+1),y1=Math.min(h-1,y0+1),fx=x-x0,fy=y-y0;
  const value=(xx:number,yy:number)=>{const i=(yy*w+xx)*4;return c===3?src[i+3]/255:src[i+c]*src[i+3]/255;};
  return(value(x0,y0)*(1-fx)+value(x1,y0)*fx)*(1-fy)+(value(x0,y1)*(1-fx)+value(x1,y1)*fx)*fy;
 };
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const i=(y*w+x)*4;let u=(x+.5)/w*aspect,v=(y+.5)/h;
  // Compose localized rotations to fold the image and pigment bands together.
  // Coordinates are normalized to the source aspect, consistent at export scales.
  for(const center of vortices){const dx=u-center.x,dy=v-center.y,t=amount*center.spin*Math.exp(-(dx*dx+dy*dy)/(radius*radius)),cs=Math.cos(t),sn=Math.sin(t);u=center.x+dx*cs-dy*sn;v=center.y+dx*sn+dy*cs;}
  const a=sample(u/aspect,v,3),color=[0,1,2].map(c=>sample(u/aspect,v,c)),l=a?(color[0]*.2126+color[1]*.7152+color[2]*.0722)/(255*a):0;
  const freq=8+p.bands/100*70,phase=u*freq+Math.sin(v*freq*.35)*2+l*4;
  const band=(.5+.5*Math.sin(phase))*2.999,k=Math.floor(band),f=band-k;
  const alpha=src[i+3]/255*(1-mix)+a*mix;
  for(let c=0;c<3;c++){
   const pigment=(palette[k][c]*(1-f)+palette[k+1][c]*f)*(.3+.7*l)*a;
   const rendered=p.mode==='source'?color[c]:pigment;
   const value=src[i+c]*src[i+3]/255*(1-mix)+rendered*mix;
   d[i+c]=p.transparent?(alpha?value/alpha:0):value+bg[c]*(1-alpha);
  }
  d[i+3]=p.transparent?alpha*255:255;
 }
 ctx.putImageData(out,0,0);
}
