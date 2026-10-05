import type {GlassParams} from './model';
type Context=CanvasRenderingContext2D|OffscreenCanvasRenderingContext2D;
const clamp=(v:number,a=0,b=1)=>Math.max(a,Math.min(b,v));
export function renderGlass(target:OffscreenCanvas|HTMLCanvasElement,image:ImageBitmap,p:GlassParams){
 const w=target.width,h=target.height,scale=w/image.width,ctx=target.getContext('2d',{willReadFrequently:true}) as Context;
 ctx.clearRect(0,0,w,h);ctx.drawImage(image,0,0,w,h);
 const original=ctx.getImageData(0,0,w,h).data;
 const soft=(p.blur*.3+p.focus/100*(1+p.distance/100*8))*scale;
 if(soft){ctx.clearRect(0,0,w,h);ctx.filter=`blur(${soft}px)`;ctx.drawImage(image,0,0,w,h);ctx.filter='none';}
 const src=soft?ctx.getImageData(0,0,w,h).data:original,out=ctx.createImageData(w,h),d=out.data;
 const angle=p.angle*Math.PI/180,cs=Math.cos(angle),sn=Math.sin(angle),span=Math.abs(w*cs)+Math.abs(h*sn);
 const group=p.placement==='area'?span*p.groupWidth/100:span,start=p.placement==='area'?span*p.groupPosition/100-group/2:0;
 const pitch=group/Math.max(1,p.count),half=pitch*p.width/200,depth=p.distance/100,thick=p.thickness/100;
 const bg=[1,3,5].map(i=>parseInt(p.background.slice(i,i+2),16));
 // Premultiplied bilinear samples preserve cutout edges through refraction and frost.
 const sample=(x:number,y:number,c:number)=>{
  x=clamp(x,0,w-1);y=clamp(y,0,h-1);
  const x0=Math.floor(x),y0=Math.floor(y),x1=Math.min(w-1,x0+1),y1=Math.min(h-1,y0+1),fx=x-x0,fy=y-y0;
  const a=(y0*w+x0)*4,b=(y0*w+x1)*4,e=(y1*w+x0)*4,f=(y1*w+x1)*4;
  const val=(i:number)=>c===3?src[i+3]/255:src[i+c]*src[i+3]/255;
  return (val(a)*(1-fx)+val(b)*fx)*(1-fy)+(val(e)*(1-fx)+val(f)*fx)*fy;
 };
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const i=(y*w+x)*4,u=(x-w/2)*cs+(y-h/2)*sn+span/2,v=-(x-w/2)*sn+(y-h/2)*cs;
  const slot=(u-start)/pitch-p.offset/100,cell=Math.floor(slot),q=(slot-cell-.5)*pitch/half;
  let alpha=original[i+3]/255;
  if(Math.abs(q)<=1&&u>=start&&u<=start+group&&p.mix>0){
   const edge=Math.pow(Math.abs(q),8),curve=p.curve/100;
   // A broad lens centre rolls into steeper bevels. Distance increases optical displacement.
   const profile=q*(.28+.35*curve)+q*q*q*(.18+.42*curve);
   const bend=p.refraction/100*half*profile*(.32+depth*1.25+thick*.55);
   const irregular=p.distortion/100*half*.12*(Math.sin(v/Math.max(w,h)*7+cell*1.7)+.3*Math.sin(v/Math.max(w,h)*19+cell))*(1-q*q);
   const shift=(u-span/2)/span*depth*thick*pitch*.18;
   const sx=x+(-bend+irregular+shift)*cs,sy=y+(-bend+irregular+shift)*sn;
   const frost=(p.blur*scale*(.3+.7*edge)+p.focus/100*depth*scale*3);
   const spread=p.dispersion/100*half*.055*q*(.3+edge);
   const light=p.light/90,bevelWidth=.025+thick*.055+(1-p.focus/100)*.025;
   const rim=Math.exp(-Math.pow((q-Math.sign(light||1)*(.91-Math.abs(light)*.035))/bevelWidth,2))*p.highlights/100*.3;
   const secondary=Math.exp(-Math.pow((q-Math.sign(light||1)*(.91-Math.abs(light)*.035)+Math.sign(light||1)*(.055+thick*.07))/(bevelWidth*.6),2))*p.highlights/100*thick*.1;
   const reflection=Math.exp(-Math.pow((q-light*.45)/(.3+thick*.25),2))*p.reflections/100*.12*(.85+.15*Math.sin(v/Math.max(w,h)*3));
   const shadow=1-edge*p.edges/100*(.12+thick*.25);
   const read=(c:number,delta=0)=>{const xx=sx+delta*cs,yy=sy+delta*sn;return frost>.01?sample(xx,yy,c)*.5+sample(xx-frost*cs,yy-frost*sn,c)*.25+sample(xx+frost*cs,yy+frost*sn,c)*.25:sample(xx,yy,c);};
   const sa=read(3),mix=p.mix/100;
   for(let c=0;c<3;c++){
    const value=read(c,c===0?spread:c===2?-spread:0);
    const lit=value*shadow+(255*sa-value)*clamp(rim+secondary+reflection);
    const premul=original[i+c]*alpha*(1-mix)+lit*mix,oa=alpha*(1-mix)+sa*mix;
    d[i+c]=p.transparent?(oa?premul/oa:0):premul+bg[c]*(1-oa);
   }
   alpha=alpha*(1-mix)+sa*mix;
  }else for(let c=0;c<3;c++)d[i+c]=p.transparent?original[i+c]:original[i+c]*alpha+bg[c]*(1-alpha);
  d[i+3]=p.transparent?alpha*255:255;
 }
 ctx.putImageData(out,0,0);
}
