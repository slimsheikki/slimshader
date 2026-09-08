import type {HeatedParams} from './model';
type Surface=OffscreenCanvas|HTMLCanvasElement;
type Context=OffscreenCanvasRenderingContext2D|CanvasRenderingContext2D;
const clamp=(x:number)=>Math.max(0,Math.min(1,x));
const colors=[[8,4,34],[31,8,111],[88,23,148],[170,45,121],[245,93,65],[255,179,85],[255,241,164]];
function thermal(t:number){const v=clamp(t)*(colors.length-1),i=Math.min(colors.length-2,Math.floor(v)),f=v-i;return colors[i].map((x,c)=>x*(1-f)+colors[i+1][c]*f);}
// Analytic signed-distance shapes and light-facing thermal rims, evaluated at output resolution.
export function renderHeated(target:Surface,image:ImageBitmap,p:HeatedParams){
 const w=target.width,h=target.height,ctx=target.getContext('2d',{willReadFrequently:true}) as Context;
 let pixels:Uint8ClampedArray|undefined;
 if(p.shape==='image'){ctx.clearRect(0,0,w,h);ctx.drawImage(image,0,0,w,h);pixels=ctx.getImageData(0,0,w,h).data;}
 const out=ctx.createImageData(w,h),data=out.data,aspect=w/h;
 const angle=p.rotation*Math.PI/180,ca=Math.cos(angle),sa=Math.sin(angle),light=p.light*Math.PI/180;
 const size=p.size/100,phase=p.phase/100*Math.PI*2,warp=p.distortion/100;
 const bg=[1,3,5].map(i=>parseInt(p.background.slice(i,i+2),16));
 const field=(x:number,y:number)=>{
  const xx=(x*ca-y*sa)/size,yy=(x*sa+y*ca)/size;
  const u=xx+Math.sin(yy*4+phase)*warp*.13,v=yy+Math.sin(xx*3-phase)*warp*.08;
  if(p.shape==='ring')return Math.abs(Math.hypot(u,v)-.52)-.18;
  if(p.shape==='capsule')return Math.hypot(Math.max(Math.abs(u)-.35,0),v)-.43;
  if(p.shape==='ribbon')return Math.abs(v-Math.sin(u*3+phase)*.32)-.2;
  return Math.hypot(u,v)-.64;
 };
 const epsilon=2/h,aa=2/h;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const i=(y*w+x)*4,px=(x/w-.5)*2*aspect,py=(y/h-.5)*2;
  let d=field(px,py),nx=0,ny=0,imageAlpha=1;
  if(pixels){const l=(pixels[i]*.2126+pixels[i+1]*.7152+pixels[i+2]*.0722)/255;imageAlpha=pixels[i+3]/255;d=(.32-l)*.65;nx=Math.cos(px*2);ny=Math.sin(py*2);}
  else{nx=field(px+epsilon,py)-field(px-epsilon,py);ny=field(px,py+epsilon)-field(px,py-epsilon);const n=Math.hypot(nx,ny)||1;nx/=n;ny/=n;}
  const facing=clamp((nx*Math.cos(light)+ny*Math.sin(light)+1)/2);
  const inside=clamp(.5-d/aa),depth=Math.max(0,-d);
  const rim=Math.exp(-depth/(.016+p.rim/100*.095));
  const glow=Math.exp(-Math.abs(d)/(.025+p.glow/100*.14))*p.glow/100;
  const heat=clamp(.08+Math.pow(facing,2)*.26*Math.exp(-depth/.06)+rim*(.18+facing*.6)*(.5+p.heat/100));
  const body=thermal(heat),halo=thermal(.48+facing*.48);
  const fringe=Math.exp(-Math.pow((d+.004)/(.003+p.dispersion/100*.015),2))*p.dispersion/100*facing;
  const atmosphere=Math.exp(-Math.hypot(px+.65,py+.5)*1.4)*p.glow/100;
  const opacity=clamp(inside+glow*.65)*imageAlpha;
  for(let c=0;c<3;c++){
   let value=body[c]*inside+halo[c]*glow*(1-inside)*.65;
   value+=fringe*[0,135,115][c];
   if(p.transparent)data[i+c]=opacity?Math.min(255,value/Math.max(.001,clamp(inside+glow*.65))):0;
   else data[i+c]=Math.min(255,value*imageAlpha+bg[c]*(1-opacity)+[38,9,65][c]*atmosphere*(1-inside));
  }
  data[i+3]=p.transparent?Math.round(opacity*255):255;
 }
 ctx.putImageData(out,0,0);
}
