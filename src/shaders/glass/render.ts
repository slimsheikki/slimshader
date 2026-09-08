import type {GlassParams} from './model';
type Context=CanvasRenderingContext2D|OffscreenCanvasRenderingContext2D;
const clamp=(v:number,a=0,b=1)=>Math.max(a,Math.min(b,v));
export function renderGlass(target:OffscreenCanvas|HTMLCanvasElement,image:ImageBitmap,p:GlassParams){
 const w=target.width,h=target.height,ctx=target.getContext('2d',{willReadFrequently:true}) as Context;
 ctx.clearRect(0,0,w,h);ctx.drawImage(image,0,0,w,h);
 const original=ctx.getImageData(0,0,w,h).data;
 if(p.blur){ctx.clearRect(0,0,w,h);ctx.filter=`blur(${p.blur*w/image.width}px)`;ctx.drawImage(image,0,0,w,h);ctx.filter='none';}
 const src=p.blur?ctx.getImageData(0,0,w,h).data:original;
 const out=ctx.createImageData(w,h),d=out.data;
 const angle=p.angle*Math.PI/180,cs=Math.cos(angle),sn=Math.sin(angle);
 const span=Math.abs(w*cs)+Math.abs(h*sn),pitch=span/Math.max(1,p.count),half=pitch*p.width/200;
 const bg=[1,3,5].map(i=>parseInt(p.background.slice(i,i+2),16));
 // Bilinear sampling in premultiplied alpha avoids dark fringes on cutouts.
 const sample=(x:number,y:number,c:number)=>{
  x=clamp(x,0,w-1);y=clamp(y,0,h-1);
  const x0=Math.floor(x),y0=Math.floor(y),x1=Math.min(w-1,x0+1),y1=Math.min(h-1,y0+1),fx=x-x0,fy=y-y0;
  const a=(y0*w+x0)*4,b=(y0*w+x1)*4,e=(y1*w+x0)*4,f=(y1*w+x1)*4;
  const v=(i:number)=>c===3?src[i+3]/255:src[i+c]*src[i+3]/255;
  return (v(a)*(1-fx)+v(b)*fx)*(1-fy)+(v(e)*(1-fx)+v(f)*fx)*fy;
 };
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const i=(y*w+x)*4,u=(x-w/2)*cs+(y-h/2)*sn,v=-(x-w/2)*sn+(y-h/2)*cs;
  const slot=(u+span/2)/pitch-p.offset/100,cell=Math.floor(slot),local=(slot-cell-.5)*pitch;
  const q=local/half,inside=Math.abs(q)<=1;
  let alpha=original[i+3]/255,r=original[i]*alpha,g=original[i+1]*alpha,b=original[i+2]*alpha;
  if(inside&&p.mix>0){
   const lens=p.refraction/100*half*(q*(1-p.curve/100)+Math.sin(q*Math.PI*.5)*p.curve/100);
   const wave=p.distortion/100*half*Math.sin(v/Math.max(1,h)*Math.PI*2+cell*.73)*(1-q*q);
   const along=p.distortion/100*half*.45*Math.sin(q*Math.PI+cell*.5);
   const sx=x+(-lens+wave)*cs-along*sn,sy=y+(-lens+wave)*sn+along*cs;
   const spread=p.dispersion/100*half*.12*q;
   const sa=sample(sx,sy,3),highlight=Math.exp(-Math.pow((q+.84)/.12,2))*p.highlights/100*.65;
   const shade=1-Math.pow(Math.abs(q),12)*p.edges/100*.65;
   const mix=p.mix/100;
   r=r*(1-mix)+(sample(sx+spread*cs,sy+spread*sn,0)*shade+255*highlight*sa)*mix;
   g=g*(1-mix)+(sample(sx,sy,1)*shade+255*highlight*sa)*mix;
   b=b*(1-mix)+(sample(sx-spread*cs,sy-spread*sn,2)*shade+255*highlight*sa)*mix;
   alpha=alpha*(1-mix)+sa*mix;
  }
  d[i]=p.transparent?(alpha?r/alpha:0):r+bg[0]*(1-alpha);
  d[i+1]=p.transparent?(alpha?g/alpha:0):g+bg[1]*(1-alpha);
  d[i+2]=p.transparent?(alpha?b/alpha:0):b+bg[2]*(1-alpha);
  d[i+3]=p.transparent?alpha*255:255;
 }
 ctx.putImageData(out,0,0);
}
