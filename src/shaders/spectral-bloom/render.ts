import type {SpectralParams} from './model';
import {source,surface,context,background,type Surface} from '../shared/canvas';
export function renderSpectral(target:Surface,image:ImageBitmap,p:SpectralParams){
 const w=target.width,h=target.height,ctx=context(target),src=source(image,w,h),s=context(src),data=s.getImageData(0,0,w,h);
 for(let i=0;i<data.data.length;i+=4){const d=data.data,l=Math.max(d[i],d[i+1],d[i+2])/255;d[i+3]*=Math.max(0,(l-p.threshold/100)/Math.max(.001,1-p.threshold/100));}
 s.putImageData(data,0,0);background(ctx,w,h,p);ctx.globalAlpha=p.original/100;ctx.drawImage(image,0,0,w,h);ctx.globalAlpha=1;
 const rays=surface(w,h),r=context(rays),cx=w*p.centerX/100,cy=h*p.centerY/100;
 r.globalCompositeOperation='lighter';
 for(let j=0;j<18;j++){const t=j/17,z=1+t*p.length/100*.65;r.globalAlpha=(1-t*.75)/12;r.drawImage(src,cx*(1-z),cy*(1-z),w*z,h*z);}
 // Separate channel images before offsetting them; preserve refracted alpha.
 const rayData=r.getImageData(0,0,w,h),channels=surface(w,h),c=context(channels);
 ctx.globalCompositeOperation='screen';
 const d=c.createImageData(w,h);
 for(let channel=0;channel<3;channel++){
  d.data.fill(0);for(let i=0;i<d.data.length;i+=4){d.data[i+channel]=rayData.data[i+channel];d.data[i+3]=rayData.data[i+3];}
  c.putImageData(d,0,0);const shift=(channel-1)*p.dispersion/100*w*.018;
  ctx.globalAlpha=.8;ctx.drawImage(channels,shift,0);ctx.filter=`blur(${(3+p.glow*.2)*w/image.width}px)`;ctx.globalAlpha=p.glow/100;ctx.drawImage(channels,shift,0);ctx.filter='none';
 }
 ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
}
