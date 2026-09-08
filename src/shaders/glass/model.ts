export interface GlassParams {placement:'full'|'area';groupPosition:number;groupWidth:number;distance:number;thickness:number;focus:number;reflections:number;light:number;count:number;width:number;angle:number;offset:number;refraction:number;distortion:number;curve:number;blur:number;dispersion:number;highlights:number;edges:number;mix:number;transparent:boolean;background:string;}
export const defaults:GlassParams={placement:'full',groupPosition:50,groupWidth:65,distance:35,thickness:35,focus:15,reflections:18,light:-35,count:12,width:100,angle:0,offset:0,refraction:65,distortion:8,curve:60,blur:0,dispersion:2,highlights:20,edges:25,mix:100,transparent:true,background:'#111111'};
export {dimensions} from '../ascii/model';

export const splitPreset:GlassParams={...defaults,placement:"area",groupPosition:68,groupWidth:64,count:2,refraction:55,curve:45,distance:50,focus:22};
