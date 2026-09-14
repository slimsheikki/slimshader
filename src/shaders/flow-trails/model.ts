export interface FlowParams {mode:'strands'|'smear';length:number;bend:number;direction:number;spacing:number;width:number;density:number;threshold:number;original:number;seed:number;transparent:boolean;background:string;}
export const defaults:FlowParams={mode:'strands',length:90,bend:60,direction:20,spacing:10,width:1,density:65,threshold:15,original:25,seed:17,transparent:false,background:'#080808'};
export {dimensions} from '../ascii/model';

export const smearPreset:FlowParams={...defaults,mode:'smear',length:180,bend:45,direction:0,original:40};
