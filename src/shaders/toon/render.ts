import { noise } from '../ascii/model';
import type { ToonParams } from './model';
type Surface = OffscreenCanvas | HTMLCanvasElement;
type Context = OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D;
const clamp = (v:number) => Math.max(0,Math.min(1,v));
const rgb = (hex:string) => [1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));

// Quantize luminance into flat lighting bands; retain source hue or map a designed palette.
// Filtering and edge offsets are in source pixels, keeping export geometry scale independent.
export function renderToon(target: Surface, image: ImageBitmap, p: ToonParams) {
  const w=target.width,h=target.height,scale=w/image.width;
  const ctx=target.getContext('2d',{willReadFrequently:true}) as Context;
  ctx.clearRect(0,0,w,h);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
  ctx.filter=`blur(${p.softness*scale}px)`;ctx.drawImage(image,0,0,w,h);ctx.filter='none';
  const source=ctx.getImageData(0,0,w,h), input=source.data;
  const output=ctx.createImageData(w,h), data=output.data;
  const edges=new Uint8Array(w*h);
  const ink=rgb(p.ink), bg=rgb(p.background);
  const palette=p.palette==='sunset'?['#362544','#ffdfab']:p.palette==='mint'?['#142e36','#dcf3bb']:p.palette==='ink'?['#171b25','#eee8dc']:[p.shadow,p.highlight];
  const dark=rgb(palette[0]),light=rgb(palette[1]);
  const step=Math.max(1,Math.round(p.lineWidth*scale));
  const lum=(x:number,y:number)=>{const i=(Math.max(0,Math.min(h-1,y))*w+Math.max(0,Math.min(w-1,x)))*4;return (input[i]*.2126+input[i+1]*.7152+input[i+2]*.0722)/255;};
  const gain=Math.pow(2,p.contrast/50), threshold=p.threshold/100;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const i=(y*w+x)*4, alpha=input[i+3]/255;
    const l=lum(x,y), adjusted=clamp((l-.5)*gain+.5+p.brightness/100);
    const band=Math.min(p.bands-1,Math.floor(adjusted*p.bands))/(p.bands-1);
    const gx=lum(x+step,y-step)+2*lum(x+step,y)+lum(x+step,y+step)-lum(x-step,y-step)-2*lum(x-step,y)-lum(x-step,y+step);
    const gy=lum(x-step,y+step)+2*lum(x,y+step)+lum(x+step,y+step)-lum(x-step,y-step)-2*lum(x,y-step)-lum(x+step,y-step);
    const edge=clamp((Math.hypot(gx,gy)/4-threshold)*12)*p.outlines/100;
    edges[y*w+x]=Math.round(edge*255);
    for(let c=0;c<3;c++){
      const color=p.palette==='source'?clamp(band+(input[i+c]/255-l)*p.saturation/100)*255:dark[c]+(light[c]-dark[c])*band;
      const painted=color;
      const mixed=painted;
      data[i+c]=mixed;
    }
    data[i+3]=p.transparent?input[i+3]:255;
  }
  ctx.putImageData(output,0,0);
  if(p.paint>0){
    // Deterministic source-space strokes redraw at export resolution, never upscale a texture.
    ctx.save();ctx.scale(scale,scale);ctx.lineCap='round';
    const size=p.brushSize, grid=Math.max(size*.55,Math.sqrt(image.width*image.height/180000));
    for(let row=0;row*grid<image.height;row++)for(let col=0;col*grid<image.width;col++){
      const random=(n:number)=>noise(col,row,p.seed+n);
      const x=(col+.15+random(1)*.7)*grid,y=(row+.15+random(2)*.7)*grid;
      const px=Math.min(w-1,Math.floor(x*scale)),py=Math.min(h-1,Math.floor(y*scale));
      const i=(py*w+px)*4;if(input[i+3]<12)continue;
      const r=Math.max(1,Math.round(size*.45*scale));
      const gx=lum(px+r,py)-lum(px-r,py),gy=lum(px,py+r)-lum(px,py-r);
      const direction=Math.atan2(gy,gx)+Math.PI/2;
      const angle=direction*p.flow/100+(-.65)* (1-p.flow/100)+(random(3)-.5)*.7;
      const length=size*(1.1+random(4)*1.2),width=size*(.3+random(5)*.28);
      const dx=Math.cos(angle),dy=Math.sin(angle),bend=(random(6)-.5)*size*.35;
      const tint=(random(7)-.5)*p.variation*1.5;
      const base=[0,1,2].map(c=>Math.max(0,Math.min(255,data[i+c]+tint)));
      ctx.globalAlpha=p.paint/100*.72;ctx.strokeStyle=`rgb(${base.join(',')})`;ctx.lineWidth=width;
      ctx.beginPath();ctx.moveTo(x-dx*length*.5,y-dy*length*.5);
      ctx.quadraticCurveTo(x-dy*bend,y+dx*bend,x+dx*length*.5,y+dy*length*.5);ctx.stroke();
      // Uneven, fine parallel strands create dry-brush ridges rather than a noise overlay.
      for(let b=0;b<5;b++){
        const offset=(b/4-.5)*width*.86,trim=random(10+b)*.3;
        ctx.globalAlpha=p.paint/100*p.bristles/100*(.12+random(20+b)*.24);
        ctx.strokeStyle=`rgb(${base.map(v=>Math.max(0,Math.min(255,v+(b%2?22:-24)))).join(',')})`;
        ctx.lineWidth=.5+random(30+b)*1.1;
        ctx.beginPath();ctx.moveTo(x-dx*length*(.5-trim)-dy*offset,y-dy*length*(.5-trim)+dx*offset);
        ctx.quadraticCurveTo(x-dy*(bend+offset),y+dx*(bend+offset),x+dx*length*.45-dy*offset,y+dy*length*.45+dx*offset);ctx.stroke();
      }
    }
    ctx.restore();
  }
  const finish=ctx.getImageData(0,0,w,h),painted=finish.data;
  for(let i=0;i<painted.length;i+=4){
    const edge=edges[i/4]/255,alpha=input[i+3]/255;
    for(let c=0;c<3;c++){
      const inked=painted[i+c]*(1-edge)+ink[c]*edge;
      const mixed=inked*(1-p.original/100)+input[i+c]*p.original/100;
      painted[i+c]=p.transparent?mixed:mixed*alpha+bg[c]*(1-alpha);
    }
    // Brush tips cannot leak outside transparent source areas.
    painted[i+3]=p.transparent?input[i+3]:255;
  }
  ctx.putImageData(finish,0,0);
}
