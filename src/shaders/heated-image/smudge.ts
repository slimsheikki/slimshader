import type {SmudgeStroke} from './model';
type Context=CanvasRenderingContext2D|OffscreenCanvasRenderingContext2D;
// Replay source-space brush paths on the newly rendered heat image at any export scale.
export function applySmudges(ctx:Context,w:number,h:number,scale:number,strokes:SmudgeStroke[]){
 for(const stroke of strokes)for(let n=1;n<stroke.points.length;n++){
  const a=stroke.points[n-1],b=stroke.points[n],distance=Math.hypot(b.x-a.x,b.y-a.y);
  const steps=Math.max(1,Math.ceil(distance/(stroke.radius*.25)));
  const dx=(b.x-a.x)/steps*scale,dy=(b.y-a.y)/steps*scale,r=stroke.radius*scale;
  for(let k=1;k<=steps;k++){
   const cx=(a.x+(b.x-a.x)*k/steps)*scale,cy=(a.y+(b.y-a.y)*k/steps)*scale;
   const pad=r+Math.max(Math.abs(dx),Math.abs(dy))+2;
   const left=Math.max(0,Math.floor(cx-pad)),top=Math.max(0,Math.floor(cy-pad));
   const tw=Math.min(w,Math.ceil(cx+pad))-left,th=Math.min(h,Math.ceil(cy+pad))-top;
   if(tw<=0||th<=0)continue;
   const tile=ctx.getImageData(left,top,tw,th),src=tile.data.slice(),out=tile.data;
   for(let y=Math.max(0,Math.floor(cy-r-top));y<Math.min(th,Math.ceil(cy+r-top));y++)for(let x=Math.max(0,Math.floor(cx-r-left));x<Math.min(tw,Math.ceil(cx+r-left));x++){
    const d=Math.hypot(x+left-cx,y+top-cy)/r;if(d>=1)continue;
    const weight=(1-d*d)**2*stroke.strength;
    const sx=Math.max(0,Math.min(tw-1,x-dx*weight)),sy=Math.max(0,Math.min(th-1,y-dy*weight));
    const x0=Math.floor(sx),y0=Math.floor(sy),fx=sx-x0,fy=sy-y0;
    const indices=[(y0*tw+x0)*4,(y0*tw+Math.min(x0+1,tw-1))*4,(Math.min(y0+1,th-1)*tw+x0)*4,(Math.min(y0+1,th-1)*tw+Math.min(x0+1,tw-1))*4];
    const weights=[(1-fx)*(1-fy),fx*(1-fy),(1-fx)*fy,fx*fy];
    const alpha=indices.reduce((sum,i,j)=>sum+src[i+3]*weights[j],0),dest=(y*tw+x)*4;
    for(let c=0;c<3;c++)out[dest+c]=alpha?indices.reduce((sum,i,j)=>sum+src[i+c]*src[i+3]*weights[j],0)/alpha:0;
    out[dest+3]=alpha;
   }
   ctx.putImageData(tile,left,top);
  }
 }
}
