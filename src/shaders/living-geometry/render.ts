import type {GeometryParams} from './model';
import {context,source,type Surface} from '../shared/canvas';
type Point={x:number;y:number;r:number;g:number;b:number;weight:number};
const cache=new WeakMap<ImageBitmap,Point[]>();
function random(n:number){const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v);}
function features(image:ImageBitmap){
 let points=cache.get(image);if(points)return points;
 const c=source(image,96,96),d=context(c).getImageData(0,0,96,96).data;points=[];
 for(let y=2;y<94;y+=2)for(let x=2;x<94;x+=2){const i=(y*96+x)*4,l=(d[i]+d[i+1]+d[i+2])/765,a=d[i+3]/255;
  if(a>.1&&l>.08)points.push({x:x/96,y:y/96,r:d[i],g:d[i+1],b:d[i+2],weight:l*a});}
 points.sort((a,b)=>b.weight-a.weight);cache.set(image,points);return points;
}
// Seeded irregular hold/retarget cycles: related nodes lock together, then
// quickly acquire new landmarks. Each group has its own timing, and the last
// target returns to the first so the same schedule works for looping exports.
export function trackingNodes(image:ImageBitmap,p:GeometryParams,time:number){
 const pool=features(image);if(!pool.length)return [];
 const pick=(n:number)=>pool[Math.floor(random(n+p.seed)*pool.length)];
 const phase=time/p.duration*Math.PI*2,amp=p.motion/100*.026;
 const count=p.retargets;
 return Array.from({length:p.boxes+p.connections?Math.max(8,p.connections+1):0},(_,i)=>{
  const group=Math.floor(i/4),home=pick(i+30);
  const weights=Array.from({length:count},(_,j)=>.45+random(group*197+j*31+p.seed)*1.3);
  const total=weights.reduce((a,b)=>a+b,0);
  let cursor=(((time/p.duration+random(group*53+p.seed))%1+1)%1)*total,k=0;
  while(k<count-1&&cursor>=weights[k])cursor-=weights[k++];
  const t=cursor/weights[k],hold=p.snap/100*.91;
  // Transition in the remaining fraction of this interval; no per-frame jitter.
  const u=Math.max(0,Math.min(1,(t-hold)/(1-hold))),ease=u*u*(3-2*u);
  const a=pick(i*137+k*47+30),b=pick(i*137+((k+1)%count)*47+30);
  const blend=p.tracking/100;
  const x=Math.max(.025,Math.min(.975,home.x+(a.x+(b.x-a.x)*ease-home.x)*blend));
  const y=Math.max(.025,Math.min(.975,home.y+(a.y+(b.y-a.y)*ease-home.y)*blend));
  return{x:x+amp*Math.sin(phase+y*5)*Math.sin(Math.PI*x),y:y+amp*.65*Math.sin(phase+x*4+1)*Math.sin(Math.PI*y)};
 });
}
export function renderGeometry(target:Surface,image:ImageBitmap,p:GeometryParams,time=0){
 const w=target.width,h=target.height,c=context(target),unit=Math.min(w,h),phase=time/p.duration*Math.PI*2,amp=p.motion/100*.026;
 c.setTransform(1,0,0,1,0,0);c.globalAlpha=1;c.clearRect(0,0,w,h);if(!p.transparent){c.fillStyle=p.background;c.fillRect(0,0,w,h);}
 // Subtle image motion complements the independently travelling trackers.
 const warp=(x:number,y:number)=>({x:x+amp*Math.sin(phase+y*5)*Math.sin(Math.PI*x),y:y+amp*.65*Math.sin(phase+x*4+1)*Math.sin(Math.PI*y)});
 const cols=40,rows=Math.max(16,Math.round(cols*h/w));
 for(let iy=0;iy<rows;iy++)for(let ix=0;ix<cols;ix++){
  const x=ix/cols,y=iy/rows,a=warp(x,y),b=warp(x+1/cols,y),d=warp(x,y+1/rows);
  c.setTransform((b.x-a.x)*w,(b.y-a.y)*h,(d.x-a.x)*w,(d.y-a.y)*h,a.x*w,a.y*h);
  const sw=image.width/cols,sh=image.height/rows,pad=2*image.width/w;
  const sx=Math.max(0,x*image.width-pad),sy=Math.max(0,y*image.height-pad);
  const ew=Math.min(image.width,(x+1/cols)*image.width+pad)-sx,eh=Math.min(image.height,(y+1/rows)*image.height+pad)-sy;
  c.drawImage(image,sx,sy,ew,eh,(sx-x*image.width)/sw,(sy-y*image.height)/sh,ew/sw,eh/sh);
 }
 c.setTransform(1,0,0,1,0,0);
 const pool=features(image);if(!pool.length)return;
 const pick=(i:number)=>pool[Math.floor(random(i+p.seed)*pool.length)];
 c.globalCompositeOperation='screen';
 for(let i=0;i<p.particles;i++){
  const a=pick(i+200),q=warp(a.x,a.y),r=random(i+7),theta=phase+random(i+80)*Math.PI*2;
  const spread=.005+.025*p.motion/100;
  c.globalAlpha=(.08+a.weight*.45)*(.6+.4*Math.sin(theta)**2);c.fillStyle=`rgb(${a.r},${a.g},${a.b})`;
  c.beginPath();c.arc((q.x+Math.cos(theta)*spread*r)*w,(q.y+Math.sin(theta)*spread*r)*h,Math.max(.5,unit*.001*(.4+r)),0,Math.PI*2);c.fill();
 }
 c.globalCompositeOperation='source-over';c.globalAlpha=p.opacity/100;c.strokeStyle='#e8eeee';c.fillStyle='#f0f5f5';c.lineWidth=p.lineWidth*unit/700;
 const nodes=trackingNodes(image,p,time);
 for(let i=0;i<p.connections;i++){const a=nodes[i],b=nodes[i+1];c.beginPath();c.moveTo(a.x*w,a.y*h);c.lineTo(b.x*w,b.y*h);c.stroke();}
 for(let i=0;i<p.boxes;i++){
  // A large frame follows the whole network; smaller frames follow local
  // groups. Their bounds lock during holds and snap with each retarget burst.
  const group=i===0?nodes:Array.from({length:4},(_,j)=>nodes[(i*3+j)%nodes.length]);
  const mx=group.reduce((sum,a)=>sum+a.x,0)/group.length,my=group.reduce((sum,a)=>sum+a.y,0)/group.length;
  const rx=Math.min(.46,.035+Math.sqrt(group.reduce((sum,a)=>sum+(a.x-mx)**2,0)/group.length)*1.65);
  const ry=Math.min(.46,.04+Math.sqrt(group.reduce((sum,a)=>sum+(a.y-my)**2,0)/group.length)*1.65);
  const x=Math.max(.015,mx-rx),y=Math.max(.015,my-ry),bw=Math.min(.985,mx+rx)-x,bh=Math.min(.985,my+ry)-y;
  c.strokeRect(x*w,y*h,bw*w,bh*h);
  for(const [dx,dy] of [[0,0],[bw,0],[bw,bh],[0,bh]]){c.fillRect((x+dx)*w-unit*.002,(y+dy)*h-unit*.002,unit*.004,unit*.004);}
 }
 c.font=`${Math.max(7,unit*.011)}px monospace`;
 nodes.forEach((a,i)=>{c.beginPath();c.arc(a.x*w,a.y*h,unit*.0025,0,Math.PI*2);c.fill();if(p.labels&&i%2===0)c.fillText(`${(a.x*3).toFixed(4)} / ${(a.y*3).toFixed(4)}`,a.x*w+unit*.01,a.y*h-unit*.009);});
 c.globalAlpha=1;
}
