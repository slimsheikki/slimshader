import { useEffect } from 'react';
import { flushSync } from 'react-dom';
type Tool = { name: string; description: string; inputSchema: object; annotations: {readOnlyHint:boolean}; execute: (input: unknown) => unknown };
export function useEditorTool(open: () => void) {
  useEffect(()=>{
    const context = (document as Document & {modelContext?:{registerTool:(tool:Tool, options:{signal:AbortSignal})=>void|Promise<void>}}).modelContext;
    if(!context?.registerTool)return;
    const controller=new AbortController();
    try { void Promise.resolve(context.registerTool({name:'open_ascii_editor',description:'Open the ASCII editor to upload an image and configure its character effect.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:false},execute(input){if(!input||typeof input!=='object'||Object.keys(input).length)throw new Error('Expected an empty object.');flushSync(open);return {editor:'ascii',status:'opened'};}},{signal:controller.signal})).catch(()=>{}); } catch { /* Optional browser integration; normal controls remain available. */ }
    return ()=>controller.abort();
  },[]);
}
