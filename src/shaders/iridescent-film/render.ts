import type {FilmParams} from './model';
import {source,context,type Surface} from '../shared/canvas';
export function renderFilm(target:Surface,image:ImageBitmap,p:FilmParams){
 const w=target.width,h=target.height,ctx=context(target),src=source(image,w,h),s=context(src),original=s.getImageData(0,0,w,h).data;
 if(p.smoothness){s.clearRect(0,0,w,h);s.filter=`blur(${p.smoothness*w/image.width}px)`;s.drawImage(image,0,0,w,h);s.filter='none';}
 const soft=s.getImageData(0,0,w,h).data,out=ctx.createImageData(w,h),d=out.data;
 const delta=Math.max(1,Math.round(3*w/image.width)),angle=p.light*Math.PI/180,lx=Math.cos(angle)*.65,ly=Math.sin(angle)*.65,lz=.76;
 const bg=[1,3,5].map(i=>parseInt(p.background.slice(i,i+2),16));
 const luminance=(x:number,y:number)=>{const i=(Math.max(0,Math.min(h-1,y))*w+Math.max(0,Math.min(w-1,x)))*4;return(soft[i]*.2126+soft[i+1]*.7152+soft[i+2]*.0722)/255;};
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const i=(y*w+x)*4,alpha=original[i+3]/255,l=luminance(x,y),gain=p.relief/100*9;
  const gx=(luminance(x+delta,y)-luminance(x-delta,y))*gain,gy=(luminance(x,y+delta)-luminance(x,y-delta))*gain;
  const norm=Math.hypot(gx,gy,1),nx=-gx/norm,ny=-gy/norm,nz=1/norm;
  // Image-derived relief, not a reconstructed 3D normal map. Thin-film-inspired
  // channel interference varies with view angle, local film thickness, and light.
  const incidence=Math.max(0,nx*lx+ny*ly+nz*lz),facing=nz;
  const phase=p.thickness/100*7+(1-facing)*(2+p.bands/100*18)+l*p.bands/100*5+incidence*1.5;
  const spec=Math.pow(Math.max(0,nx*lx*.5+ny*ly*.5+nz*.94),18)*p.gloss/100;
  const intensity=(.18+.82*l),mix=p.strength/100,sat=p.saturation/100;
  const waves=[.5+.5*Math.cos(phase*1.0),.5+.5*Math.cos(phase*1.23+2),.5+.5*Math.cos(phase*1.5+4)];
  const mean=(waves[0]+waves[1]+waves[2])/3;
  for(let c=0;c<3;c++){
   const tint=mean+(waves[c]-mean)*sat;
   const film=255*intensity*(.28+tint*.95)*( .7+incidence*.3)+spec*255*.3;
   const value=original[i+c]*(1-mix)+film*mix;
   d[i+c]=p.transparent?value:value*alpha+bg[c]*(1-alpha);
  }
  d[i+3]=p.transparent?alpha*255:255;
 }
 ctx.putImageData(out,0,0);
}
