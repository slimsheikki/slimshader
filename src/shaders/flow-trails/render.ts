import type {FlowParams} from './model';
import {noise} from '../ascii/model';
import {source,context,background,type Surface} from '../shared/canvas';
export function renderFlow(target:Surface,image:ImageBitmap,p:FlowParams){
 const w=target.width,h=target.height,scale=w/image.width,ctx=context(target);
 const cols=Math.ceil(image.width/p.spacing),rows=Math.ceil(image.height/p.spacing);
 if(cols*rows>300000)throw Error('Increase strand spacing for this image.');
 const d=context(source(image,cols,rows)).getImageData(0,0,cols,rows).data;
 const lum=(x:number,y:number)=>{const i=(Math.max(0,Math.min(rows-1,y))*cols+Math.max(0,Math.min(cols-1,x)))*4;return(d[i]*.2126+d[i+1]*.7152+d[i+2]*.0722)/255;};
 background(ctx,w,h,p);ctx.globalAlpha=p.original/100;ctx.drawImage(image,0,0,w,h);ctx.globalAlpha=1;
 ctx.lineCap='round';ctx.lineJoin='round';
 const theta=p.direction*Math.PI/180,bend=p.bend/100;
 for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
  const i=(y*cols+x)*4,l=lum(x,y),n=noise(x,y,p.seed);
  if(!d[i+3]||l<p.threshold/100||n>p.density/100)continue;
  let px=(x+noise(x,y,p.seed+1))*image.width/cols,py=(y+noise(x,y,p.seed+2))*image.height/rows;
  const len=p.length*(.5+noise(x,y,p.seed+3)),steps=Math.max(1,Math.ceil(len/8)),step=len/steps;
  const gx=lum(x+1,y)-lum(x-1,y),gy=lum(x,y+1)-lum(x,y-1);
  const tangent=Math.atan2(gy,gx)+Math.PI/2,edge=Math.min(1,Math.hypot(gx,gy)*3);
  ctx.strokeStyle=`rgb(${d[i]},${d[i+1]},${d[i+2]})`;
  for(let j=0;j<steps;j++){
   const t=j/steps;
   // Smooth shared vector field: nearby strands follow coherent curved paths.
   const curl=Math.sin(px/image.width*5+py/image.height*3+p.seed*.1)+.5*Math.cos(py/image.height*7-px/image.width*2);
   const a=theta+bend*(curl*.9+Math.sin(t*Math.PI)*1.3)+Math.sin(tangent-theta)*edge*bend*.4;
   const nx=px+Math.cos(a)*step,ny=py+Math.sin(a)*step;
   ctx.globalAlpha=d[i+3]/255*(.35+.65*l)*Math.pow(1-t,1.4);ctx.lineWidth=p.width*scale*(1-t*.7);
   ctx.beginPath();ctx.moveTo(px*scale,py*scale);ctx.lineTo(nx*scale,ny*scale);ctx.stroke();px=nx;py=ny;
  }
 }
 ctx.globalAlpha=1;
}
