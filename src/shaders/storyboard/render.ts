import type {SketchParams} from './model';
import {noise} from '../ascii/model';
type Surface=OffscreenCanvas|HTMLCanvasElement;
type Context=OffscreenCanvasRenderingContext2D|CanvasRenderingContext2D;
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
// Source-space pencil marks and tone-dependent hatching are regenerated at export resolution.
export function renderSketch(target:Surface,image:ImageBitmap,p:SketchParams){
 const w=target.width,h=target.height,s=w/image.width,ctx=target.getContext('2d',{willReadFrequently:true}) as Context;
 ctx.clearRect(0,0,w,h);ctx.drawImage(image,0,0,w,h);
 const input=ctx.getImageData(0,0,w,h).data,out=ctx.createImageData(w,h),data=out.data;
 const luminance=new Float32Array(w*h);
 const gain=Math.pow(2,p.contrast/50);
 for(let i=0;i<luminance.length;i++){const j=i*4;const l=(input[j]*.2126+input[j+1]*.7152+input[j+2]*.0722)/255;luminance[i]=clamp((l-.5)*gain+.5+p.brightness/100);}
 const at=(x:number,y:number)=>luminance[Math.max(0,Math.min(h-1,y))*w+Math.max(0,Math.min(w-1,x))];
 const step=Math.max(1,Math.round(p.lineWidth*s)),a=p.angle*Math.PI/180,cos=Math.cos(a),sin=Math.sin(a);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const i=y*w+x,j=i*4,l=luminance[i],sx=x/s,sy=y/s;
  const gx=at(x+step,y-step)+2*at(x+step,y)+at(x+step,y+step)-at(x-step,y-step)-2*at(x-step,y)-at(x-step,y+step);
  const gy=at(x-step,y+step)+2*at(x,y+step)+at(x+step,y+step)-at(x-step,y-step)-2*at(x,y-step)-at(x+step,y-step);
  const edge=clamp((Math.hypot(gx,gy)/4-p.threshold/100)*9)*p.lineStrength/100;
  const tone=1-Math.round(l*(p.levels-1))/(p.levels-1);
  const jitter=(Math.sin(sx*.037+Math.sin(sy*.052))*1.4+Math.sin(sy*.13)*.4)*p.roughness/100;
  const stripe=(coordinate:number)=>{const phase=((coordinate%p.spacing)+p.spacing)%p.spacing;const distance=Math.min(phase,p.spacing-phase);return clamp((.65-distance)*s+.5);};
  const first=stripe(sx*cos+sy*sin+jitter)*clamp((.83-l)*2.5);
  const second=p.crosshatch?stripe(-sx*sin+sy*cos+jitter)*clamp((.42-l)*3):0;
  const pencil=(first+second-first*second)*p.hatching/100;
  const tooth=noise(Math.floor(sx*1.5),Math.floor(sy*1.5),p.seed);
  const ink=clamp(1-(1-edge)*(1-pencil*.8)*(1-tone*p.shading/100));
  const graphite=ink*(1-tooth*p.roughness/350);
  const paper=1-tooth*p.grain/1300;
  const alpha=input[j+3]/255;
  if(p.transparent){data[j]=data[j+1]=data[j+2]=28;data[j+3]=Math.round(graphite*alpha*255);}
  else {const gray=Math.round((paper*(1-graphite)*alpha+paper*(1-alpha))*255);data[j]=data[j+1]=data[j+2]=gray;data[j+3]=255;}
 }
 ctx.putImageData(out,0,0);
}
