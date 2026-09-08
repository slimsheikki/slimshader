import type {StreakParams} from './model';
import {noise} from '../ascii/model';
import {source,context,background,type Surface} from '../shared/canvas';
export function renderStreaks(target:Surface,image:ImageBitmap,p:StreakParams){
 const w=target.width,h=target.height,scale=w/image.width,ctx=context(target),src=source(image,w,h),s=context(src),data=s.getImageData(0,0,w,h);
 background(ctx,w,h,p);ctx.globalAlpha=p.original/100;ctx.drawImage(image,0,0,w,h);ctx.globalAlpha=1;
 const rowCount=Math.ceil(image.height/p.height),cols=Math.ceil(image.width/24),cs=Math.cos(p.angle*Math.PI/180),sn=Math.sin(p.angle*Math.PI/180);
 for(let row=0;row<rowCount;row++)for(let col=0;col<cols;col++){
  if(noise(col,row,p.seed)>p.density/100)continue;
  const x=col*24*scale,y=row*p.height*scale,sw=Math.min(w-x,(8+noise(col,row,p.seed+1)*24)*scale),sh=Math.min(h-y,p.height*scale);
  const shift=(noise(col,row,p.seed+2)-.5)*p.length*scale,tx=x+shift*cs,ty=y+shift*sn;
  ctx.globalAlpha=.8;ctx.drawImage(src,x,y,sw,sh,tx,ty,sw+Math.abs(shift)*.4,sh);
  if(p.dispersion){const i=(Math.min(h-1,Math.floor(y))*w+Math.min(w-1,Math.floor(x)))*4;ctx.globalCompositeOperation='screen';ctx.globalAlpha=.35*data.data[i+3]/255;ctx.fillStyle=`rgb(${data.data[i]},0,${data.data[i+2]})`;ctx.fillRect(tx+p.dispersion*scale,ty,sw,Math.max(scale,sh*.25));ctx.fillStyle=`rgb(0,${data.data[i+1]},${data.data[i+2]})`;ctx.fillRect(tx-p.dispersion*scale,ty+sh*.75,sw,Math.max(scale,sh*.25));ctx.globalCompositeOperation='source-over';}
 }
 ctx.globalAlpha=1;
}
