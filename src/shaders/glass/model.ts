export interface GlassParams {count:number;width:number;angle:number;offset:number;refraction:number;distortion:number;curve:number;blur:number;dispersion:number;highlights:number;edges:number;mix:number;transparent:boolean;background:string;}
export const defaults:GlassParams={count:12,width:100,angle:0,offset:0,refraction:65,distortion:20,curve:60,blur:0,dispersion:8,highlights:25,edges:25,mix:100,transparent:true,background:'#111111'};
export {dimensions} from '../ascii/model';
