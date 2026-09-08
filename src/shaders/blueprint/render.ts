import type {BlueprintParams} from './model';
import {noise} from '../ascii/model';
type Surface=OffscreenCanvas|HTMLCanvasElement;
type Context=OffscreenCanvasRenderingContext2D|CanvasRenderingContext2D;
export function renderBlueprint(target:Surface,image:ImageBitmap,p:BlueprintParams){
 const ctx=target.getContext('2d') as Context,sx=target.width/image.width,sy=target.height/image.height,size=p.cellSize;
 const cols=Math.ceil(image.width/size),rows=Math.ceil(image.height/size);
 if(cols*rows>1000000)throw new Error('Increase cell size for this image.');
 const sample:Surface=typeof OffscreenCanvas!=='undefined'?new OffscreenCanvas(cols,rows):Object.assign(document.createElement('canvas'),{width:cols,height:rows});
 const sc=sample.getContext('2d',{willReadFrequently:true}) as Context;sc.drawImage(image,0,0,cols,rows);const data=sc.getImageData(0,0,cols,rows).data;
 ctx.clearRect(0,0,target.width,target.height);ctx.save();ctx.scale(sx,sy);
 if(!p.transparent){ctx.fillStyle=p.background;ctx.fillRect(0,0,image.width,image.height);}
 ctx.strokeStyle=p.foreground;ctx.lineWidth=.7;ctx.globalAlpha=p.grid/100;
 ctx.beginPath();for(let x=0;x<=image.width;x+=size){ctx.moveTo(x,0);ctx.lineTo(x,image.height);}for(let y=0;y<=image.height;y+=size){ctx.moveTo(0,y);ctx.lineTo(image.width,y);}ctx.stroke();ctx.globalAlpha=1;
 const gain=Math.pow(2,p.contrast/50);
 for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
  const i=(row*cols+col)*4;if(data[i+3]<20)continue;
  let l=(data[i]*.2126+data[i+1]*.7152+data[i+2]*.0722)/255;
  l=Math.max(0,Math.min(1,(l-.5)*gain+.5+p.brightness/100));if(p.invert)l=1-l;
  if(l<p.threshold/100)continue;
  const x=col*size,y=row*size;ctx.globalAlpha=data[i+3]/255;ctx.fillStyle=p.foreground;ctx.fillRect(x,y,size+.02,size+.02);
  if(noise(col,row,p.seed)>p.patterns/100)continue;
  const unit=size*p.patternScale/100,pad=(size-unit)/2;
  ctx.strokeStyle=p.background;ctx.fillStyle=p.background;ctx.lineWidth=p.lineWidth;
  if(l>.8){ctx.beginPath();ctx.arc(x+size/2,y+size/2,Math.max(.4,p.lineWidth*.6),0,Math.PI*2);ctx.fill();}
  else if(l>.52){ctx.strokeRect(x+pad,y+pad,unit,unit);}
  else if(l>.3){ctx.beginPath();ctx.moveTo(x+pad,y+pad);ctx.lineTo(x+pad+unit,y+pad+unit);ctx.moveTo(x+pad+unit,y+pad);ctx.lineTo(x+pad,y+pad+unit);ctx.stroke();}
  else{for(let dy=0;dy<3;dy++)for(let dx=0;dx<3;dx++){ctx.beginPath();ctx.arc(x+(dx+.5)*size/3,y+(dy+.5)*size/3,Math.max(.4,p.lineWidth*.5),0,Math.PI*2);ctx.fill();}}
 }
 ctx.restore();sample.width=1;sample.height=1;
}
