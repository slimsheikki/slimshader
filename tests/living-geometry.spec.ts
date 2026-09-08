import {test,expect} from '@playwright/test';
test('Living Geometry animates, pauses, adjusts and exports PNG and playable video',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:'Open Living Geometry editor',exact:true}).click();
 await page.getByRole('button',{name:/Or try the sample image/}).click();
 const c=page.getByLabel('Living Geometry image preview');await expect.poll(()=>c.evaluate((c:HTMLCanvasElement)=>c.width)).toBe(1100);
 const first=await c.evaluate((c:HTMLCanvasElement)=>c.toDataURL());await expect.poll(()=>c.evaluate((c:HTMLCanvasElement)=>c.toDataURL())).not.toBe(first);
 await page.getByRole('button',{name:'Pause animation',exact:true}).click();await page.waitForTimeout(100);
 const paused=await c.evaluate((c:HTMLCanvasElement)=>c.toDataURL());await page.waitForTimeout(120);expect(await c.evaluate((c:HTMLCanvasElement)=>c.toDataURL())).toBe(paused);
 await page.getByRole('slider',{name:'Box count',exact:true}).fill('8');await expect.poll(()=>c.evaluate((c:HTMLCanvasElement)=>c.toDataURL())).not.toBe(paused);
 await page.getByLabel('Export scale').selectOption('2');let download=page.waitForEvent('download');await page.getByRole('button',{name:/Export PNG/}).click();const png=await download;const fs=await import('node:fs/promises');const data=await fs.readFile((await png.path())!);expect(data.readUInt32BE(16)).toBe(3200);expect(data.readUInt32BE(20)).toBe(2134);
 await page.getByRole('slider',{name:'Loop duration · seconds',exact:true}).fill('4');download=page.waitForEvent('download');await page.getByRole('button',{name:/Export animation/}).click();const video=await download;const bytes=await fs.readFile((await video.path())!);expect(bytes.length).toBeGreaterThan(10000);
 const details=await page.evaluate(async({data,type})=>{const v=document.createElement('video');v.muted=true;const url=URL.createObjectURL(new Blob([Uint8Array.from(atob(data),c=>c.charCodeAt(0))],{type}));v.src=url;await new Promise<void>((resolve,reject)=>{v.onloadeddata=()=>resolve();v.onerror=()=>reject(new Error('Video did not decode'));});await v.play();await new Promise(r=>setTimeout(r,200));const result={w:v.videoWidth,h:v.videoHeight,time:v.currentTime};v.pause();URL.revokeObjectURL(url);return result;},{data:bytes.toString('base64'),type:video.suggestedFilename().endsWith('.mp4')?'video/mp4':'video/webm'});
 expect(details.w).toBe(1280);expect(details.h).toBe(854);expect(details.time).toBeGreaterThan(0);
 await page.screenshot({path:'../work/living-geometry-editor.png'});
});

test('tracking moves substantially with a still image and closes its loop smoothly',async({page})=>{
 await page.goto('/');
 const result=await page.evaluate(async()=>{
  // @ts-expect-error browser imports the source module through Vite
  const {trackingNodes,renderGeometry}=await import('/src/shaders/living-geometry/render.ts');
  // @ts-expect-error browser imports the source module through Vite
  const {defaults}=await import('/src/shaders/living-geometry/model.ts');
  const image=await createImageBitmap(await(await fetch('/sample.jpg')).blob());const p={...defaults,motion:0,particles:0};
  type P={x:number;y:number};
  const distance=(a:P[],b:P[])=>a.reduce((sum,n,i)=>sum+Math.hypot(n.x-b[i].x,n.y-b[i].y),0)/a.length;
  const first=trackingNodes(image,p,0),quarter=trackingNodes(image,p,2),end=trackingNodes(image,p,8),near=trackingNodes(image,p,7.999);
  const still={...p,tracking:0};
  const panel=document.createElement('div');panel.style.cssText='position:fixed;inset:0;background:#080808;z-index:99999;color:white;display:flex;gap:16px;padding:16px';
  for(const t of [0,2,4]){const item=document.createElement('div'),c=document.createElement('canvas');c.width=600;c.height=400;c.style.width='100%';renderGeometry(c,image,p,t);item.textContent=`${t} seconds`;item.append(c);panel.append(item);}document.body.append(panel);
  const value={travel:distance(first,quarter),loop:distance(first,end),near:distance(first,near),still:distance(trackingNodes(image,still,0),trackingNodes(image,still,2))};image.close();return value;
 });
 expect(result.travel).toBeGreaterThan(.1);expect(result.loop).toBeLessThan(.000001);expect(result.near).toBeLessThan(.001);expect(result.still).toBe(0);
 await page.screenshot({path:'../work/tracking-motion-comparison.png'});
});
