export interface GlassParams {placement:'full'|'area';groupPosition:number;groupWidth:number;distance:number;thickness:number;focus:number;reflections:number;light:number;count:number;width:number;angle:number;offset:number;refraction:number;distortion:number;curve:number;blur:number;dispersion:number;highlights:number;edges:number;mix:number;transparent:boolean;background:string;}
export const defaults:GlassParams={placement:'full',groupPosition:50,groupWidth:65,distance:55,thickness:35,focus:8,reflections:12,light:-35,count:12,width:100,angle:0,offset:0,refraction:85,distortion:10,curve:80,blur:0,dispersion:2,highlights:16,edges:18,mix:100,transparent:true,background:'#111111'};
export {dimensions} from '../ascii/model';

export const splitPreset:GlassParams={...defaults,placement:"area",groupPosition:68,groupWidth:64,count:2,refraction:55,curve:60,distance:30,focus:12};

export const reededPreset:GlassParams={...defaults,count:40,distance:65,refraction:90,curve:85,distortion:4};
