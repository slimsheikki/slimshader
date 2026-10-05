export interface FilmParams {strength:number;thickness:number;bands:number;relief:number;smoothness:number;light:number;gloss:number;saturation:number;transparent:boolean;background:string;}
export const defaults:FilmParams={strength:75,thickness:55,bands:45,relief:65,smoothness:6,light:-40,gloss:35,saturation:75,transparent:false,background:'#080808'};
export {dimensions} from '../ascii/model';
