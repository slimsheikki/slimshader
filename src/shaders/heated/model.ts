export interface HeatedParams {shape:'orb'|'capsule'|'ring'|'ribbon'|'image';size:number;rotation:number;heat:number;rim:number;glow:number;dispersion:number;distortion:number;phase:number;light:number;transparent:boolean;background:string;}
export const defaults:HeatedParams={shape:'capsule',size:110,rotation:-30,heat:60,rim:55,glow:55,dispersion:35,distortion:15,phase:0,light:-130,transparent:false,background:'#08051b'};
export {dimensions} from '../ascii/model';
