export interface MarbleParams {swirl:number;scale:number;bands:number;strength:number;mode:'source'|'mineral';sand:string;coral:string;teal:string;seed:number;transparent:boolean;background:string;}
export const defaults:MarbleParams={swirl:65,scale:45,bands:45,strength:80,mode:'mineral',sand:'#ded7a3',coral:'#a84d56',teal:'#72aead',seed:17,transparent:false,background:'#080808'};
export {dimensions} from '../ascii/model';
