import type {FlowParams} from './model';
import {context,surface,background,type Surface} from '../shared/canvas';
export function renderSmear(target:Surface,image:ImageBitmap,p:FlowParams){
 const w=target.width,h=target.height,ctx=context(target),scale=w/image.width;
 const layer=surface(w,h),lc=context(layer),blur=surface(w,h),bc=context(blur);
 lc.drawImage(image,0,0,w,h);bc.globalCompositeOperation='lighter';
 const angle=p.direction*Math.PI/180,cs=Math.cos(angle),sn=Math.sin(angle),steps=Math.max(16,Math.ceil(p.length/3));
 let sum=0;for(let j=0;j<steps;j++)sum+=Math.exp(-j/(steps-1)*2.4);
 for(let j=0;j<steps;j++){
  const t=j/(steps-1),distance=p.length*scale*t,curve=Math.sin(t*Math.PI)*p.length*scale*p.bend/100*.5;
  bc.globalAlpha=Math.exp(-t*2.4)/sum;
  bc.setTransform(1,0,0,1,distance*cs-curve*sn,distance*sn+curve*cs);bc.drawImage(layer,0,0);
 }
 bc.setTransform(1,0,0,1,0,0);bc.globalAlpha=1;
 background(ctx,w,h,p);ctx.drawImage(blur,0,0);ctx.globalAlpha=p.original/100;ctx.drawImage(image,0,0,w,h);ctx.globalAlpha=1;
}
