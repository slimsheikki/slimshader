import {test,expect} from '@playwright/test';
for(const [name,preset,control,value] of [['Flow Trails','Motion Smear','Trail length','250'],['Heated Shader','Cold Glow','Negative tones','25']])test(`${preset} changes output and exports at 2x`,async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:`Open ${name} editor`,exact:true}).click();
 const png=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=240;c.height=180;const x=c.getContext('2d')!;const g=x.createLinearGradient(0,0,240,0);g.addColorStop(0,'#ff5522');g.addColorStop(1,'#44bbff');x.fillStyle=g;x.fillRect(70,50,100,80);return c.toDataURL().split(',')[1];});await page.getByLabel('Upload image').setInputFiles({name:'test.png',mimeType:'image/png',buffer:Buffer.from(png,'base64')});
 const c=page.getByLabel(`${name} image preview`);await expect.poll(()=>c.evaluate((c:HTMLCanvasElement)=>c.width)).toBe(240);const before=await c.evaluate((c:HTMLCanvasElement)=>c.toDataURL());await page.getByRole('button',{name:preset,exact:true}).click();await expect.poll(()=>c.evaluate((c:HTMLCanvasElement)=>c.toDataURL())).not.toBe(before);const first=await c.evaluate((c:HTMLCanvasElement)=>c.toDataURL());await page.getByRole('slider',{name:control,exact:true}).fill(value);await expect.poll(()=>c.evaluate((c:HTMLCanvasElement)=>c.toDataURL())).not.toBe(first);
 await page.getByRole('switch',{name:'Transparent background'}).check();await expect.poll(()=>c.evaluate((c:HTMLCanvasElement)=>c.getContext('2d')!.getImageData(0,0,1,1).data[3])).toBe(0);
 await page.getByLabel('Export scale').selectOption('2');const download=page.waitForEvent('download');await page.getByRole('button',{name:/Export PNG/}).click();const d=await download;const fs=await import('node:fs/promises'),buf=await fs.readFile((await d.path())!);expect(buf.readUInt32BE(16)).toBe(480);expect(buf.readUInt32BE(20)).toBe(360);
});
test('compare new treatments with closest existing effects on the same photograph',async({page})=>{
 await page.setViewportSize({width:1500,height:850});await page.goto('/');
 await page.evaluate(async()=>{
  // @ts-expect-error Vite browser imports
  const {shaders}=await import('/src/shaders/registry.ts');
  // @ts-expect-error Vite browser imports
  const {smearPreset}=await import('/src/shaders/flow-trails/model.ts');
  // @ts-expect-error Vite browser imports
  const {coldPreset}=await import('/src/shaders/heated-image/model.ts');
  const img=await createImageBitmap(await(await fetch('/sample.jpg')).blob());const panel=document.createElement('div');panel.style.cssText='position:fixed;inset:0;z-index:99999;background:#111;color:white;display:grid;grid-template-columns:repeat(3,1fr);gap:16px;padding:16px;font:16px Arial';
  for(const [id,label,override] of [['liquid-marble','Liquid Marble',null],['flow-trails','Motion Smear',smearPreset],['heated-image','Cold Glow',coldPreset],['iridescent-film','Iridescent Film',null],['flow-trails','Flow Trails',null],['heated-image','Heated Shader',null]]){
   const shader=shaders.find((s:{id:string})=>s.id===id),c=document.createElement('canvas');c.width=720;c.height=480;c.style.width='100%';shader.render(c,img,override||shader.defaults);const item=document.createElement('div');item.textContent=label as string;item.append(c);panel.append(item);
  }document.body.append(panel);img.close();
 });await page.screenshot({path:'../work/september-effects-comparison.png'});
});
