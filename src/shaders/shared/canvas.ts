export type Surface=OffscreenCanvas|HTMLCanvasElement;
export type Context=OffscreenCanvasRenderingContext2D|CanvasRenderingContext2D;
export function surface(w:number,h:number):Surface{return typeof OffscreenCanvas!=='undefined'?new OffscreenCanvas(w,h):Object.assign(document.createElement('canvas'),{width:w,height:h});}
export function context(c:Surface){return c.getContext('2d',{willReadFrequently:true}) as Context;}
export function source(image:ImageBitmap,w:number,h:number){const c=surface(w,h);context(c).drawImage(image,0,0,w,h);return c;}
export function background(c:Context,w:number,h:number,p:{transparent:boolean;background:string}){c.globalAlpha=1;c.globalCompositeOperation='source-over';c.filter='none';c.clearRect(0,0,w,h);if(!p.transparent){c.fillStyle=p.background;c.fillRect(0,0,w,h);}}
