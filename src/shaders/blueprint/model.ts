export interface BlueprintParams {cellSize:number;threshold:number;invert:boolean;contrast:number;brightness:number;patterns:number;patternScale:number;lineWidth:number;grid:number;foreground:string;background:string;transparent:boolean;seed:number;}
export const defaults:BlueprintParams={cellSize:14,threshold:18,invert:false,contrast:15,brightness:0,patterns:80,patternScale:75,lineWidth:1,grid:22,foreground:'#f1f2ed',background:'#1839be',transparent:false,seed:8};
export {dimensions} from '../ascii/model';
