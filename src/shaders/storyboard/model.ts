export interface SketchParams {
  lineStrength:number; lineWidth:number; threshold:number; shading:number; levels:number;
  hatching:number; spacing:number; angle:number; crosshatch:boolean; roughness:number;
  grain:number; brightness:number; contrast:number; transparent:boolean; seed:number;
}
export const defaults:SketchParams={lineStrength:85,lineWidth:1.5,threshold:8,shading:40,levels:5,
  hatching:65,spacing:7,angle:-35,crosshatch:true,roughness:35,grain:18,brightness:8,contrast:15,transparent:false,seed:3};
export {dimensions} from '../ascii/model';
