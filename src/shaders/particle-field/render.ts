import type {ParticleParams} from './model';
import {noise} from '../ascii/model';
import {source,context,background,type Surface} from '../shared/canvas';
export function renderParticles(target:Surface,image:ImageBitmap,p:ParticleParams){
 const w=target.width,h=target.height,scale=w/image.width,ctx=context(target);
 // Sample in source-space cells so preview and export share particle locations.
 const cols=Math.max(1,Math.ceil(image.width/p.spacing)),rows=Math.max(1,Math.ceil(image.height/p.spacing));
 if(cols*rows>2000000)throw Error('Increase particle spacing for this image.');
 const data=context(source(image,cols,rows)).getImageData(0,0,cols,rows).data;
 background(ctx,w,h,p);ctx.globalAlpha=p.original/100;ctx.drawImage(image,0,0,w,h);ctx.globalAlpha=1;
 for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
  const i=(y*cols+x)*4,l=(data[i]*.2126+data[i+1]*.7152+data[i+2]*.0722)/255;
  if(l<p.threshold/100||noise(x,y,p.seed)>p.density/100||!data[i+3])continue;
  const n=noise(x,y,p.seed+1),nx=noise(x,y,p.seed+2),ny=noise(x,y,p.seed+3);
  const px=((x+.5)*image.width/cols+(nx-.5)*p.scatter)*scale,py=((y+.5)*image.height/rows+(ny-.5)*p.scatter)*scale;
  const size=p.size*scale*(.4+n*.8);ctx.globalAlpha=data[i+3]/255*(.65+.35*l);
  ctx.fillStyle=`rgb(${data[i]},${data[i+1]},${data[i+2]})`;ctx.beginPath();ctx.arc(px,py,size/2,0,Math.PI*2);ctx.fill();
 }
 ctx.globalAlpha=1;
}
