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
    for(let c=0;c<3;c++){
      const color=p.palette==='source'?clamp(band+(input[i+c]/255-l)*p.saturation/100)*255:dark[c]+(light[c]-dark[c])*band;
      const painted=color*(1-edge)+ink[c]*edge;
      const mixed=painted*(1-p.original/100)+input[i+c]*p.original/100;
      data[i+c]=p.transparent?mixed:mixed*alpha+bg[c]*(1-alpha);
    }
    data[i+3]=p.transparent?input[i+3]:255;
  }
  ctx.putImageData(output,0,0);
}
