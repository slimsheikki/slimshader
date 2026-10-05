export interface GeometryParams {motion:number;tracking:number;snap:number;retargets:number;boxes:number;connections:number;particles:number;lineWidth:number;opacity:number;labels:boolean;duration:number;seed:number;transparent:boolean;background:string;}
export const defaults:GeometryParams={motion:22,tracking:75,snap:85,retargets:8,boxes:3,connections:16,particles:280,lineWidth:1,opacity:65,labels:true,duration:8,seed:17,transparent:false,background:'#030405'};
export {dimensions} from '../ascii/model';
