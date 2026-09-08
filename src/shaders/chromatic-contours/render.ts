import type {ContourParams} from './model';
import {surface,source,context,background,type Surface} from '../shared/canvas';
export function renderContours(target:Surface,image:ImageBitmap,p:ContourParams){
 const w=target.width,h=target.height,scale=w/image.width,ctx=context(target),s=context(source(image,w,h));
 s.filter=`blur(${Math.max(.5,p.width)*scale}px)`;s.drawImage(image,0,0,w,h);s.filter='none';
 const d=s.getImageData(0,0,w,h).data,layer=surface(w,h),l=context(layer),out=l.createImageData(w,h),step=Math.max(1,Math.round(scale));
 const lum=(x:number,y:number)=>{const i=(Math.max(0,Math.min(h-1,y))*w+Math.max(0,Math.min(w-1,x)))*4;return (d[i]*.2126+d[i+1]*.7152+d[i+2]*.0722)*d[i+3]/255;};
 const edges=new Float32Array(w*h);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const gx=lum(x+step,y)-lum(x-step,y),gy=lum(x,y+step)-lum(x,y-step);edges[y*w+x]=Math.max(0,Math.min(1,(Math.hypot(gx,gy)/255-p.threshold/100)*p.strength/10));}
 const shift=Math.round(p.dispersion*scale);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4;let alpha=0;for(let c=0;c<3;c++){const v=edges[y*w+Math.max(0,Math.min(w-1,x+(c-1)*shift))];out.data[i+c]=v*255;alpha=Math.max(alpha,v);}out.data[i+3]=alpha*255;for(let c=0;c<3;c++)if(alpha)out.data[i+c]/=alpha;}
 l.putImageData(out,0,0);background(ctx,w,h,p);ctx.globalAlpha=p.original/100;ctx.drawImage(image,0,0,w,h);ctx.globalAlpha=p.glow/100;ctx.filter=`blur(${(4+p.width)*scale}px)`;ctx.drawImage(layer,0,0);ctx.filter='none';ctx.globalAlpha=1;ctx.drawImage(layer,0,0);
}
