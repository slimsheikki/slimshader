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
