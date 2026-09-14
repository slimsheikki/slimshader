export interface HeatedParams {palette:'thermal'|'cold';negative:number;shadow:number;smudges:SmudgeStroke[];shape:'orb'|'capsule'|'ring'|'ribbon'|'image';size:number;rotation:number;heat:number;rim:number;glow:number;dispersion:number;distortion:number;phase:number;light:number;transparent:boolean;background:string;}
export const defaults:HeatedParams={palette:'thermal',negative:0,shadow:0,smudges:[],shape:'image',size:110,rotation:-30,heat:60,rim:55,glow:55,dispersion:35,distortion:15,phase:0,light:-130,transparent:false,background:'#08051b'};
export {dimensions} from '../ascii/model';
export interface SmudgePoint {x:number;y:number}
export interface SmudgeStroke {points:SmudgePoint[];radius:number;strength:number}

export const coldPreset:HeatedParams={...defaults,palette:'cold',negative:75,shadow:16,heat:70,glow:75,dispersion:8,rim:35,background:'#02080c'};
