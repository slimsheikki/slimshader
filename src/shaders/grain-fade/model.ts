export interface FadeParams {mask:'linear'|'radial';position:number;angle:number;feather:number;centerX:number;centerY:number;radius:number;invert:boolean;amount:number;blur:number;grain:number;grainSize:number;glow:number;saturation:number;background:string;transparent:boolean;seed:number;}
export const defaults:FadeParams={mask:'linear',position:55,angle:90,feather:55,centerX:50,centerY:40,radius:55,invert:false,amount:100,blur:5,grain:35,grainSize:1,glow:20,saturation:110,background:'#faf8f2',transparent:false,seed:17};
export {dimensions} from '../ascii/model';
