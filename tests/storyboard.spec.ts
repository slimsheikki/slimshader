import {test,expect} from '@playwright/test';
import fs from 'node:fs';
test('Storyboard sketch is grayscale, controls change marks and exports 2x PNG',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');await page.getByRole('button',{name:'Open Storyboard Sketch editor'}).click();
 await page.getByRole('button',{name:'Or try the sample image'}).click();const c=page.locator('canvas[aria-label="Storyboard Sketch image preview"]');await expect.poll(()=>c.evaluate((c:HTMLCanvasElement)=>c.width)).toBe(1600);
 const stats=await c.evaluate((c:HTMLCanvasElement)=>{const d=c.getContext('2d')!.getImageData(0,0,c.width,c.height).data;let gray=true,min=255,max=0;for(let i=0;i<d.length;i+=4){gray&&=d[i]===d[i+1]&&d[i]===d[i+2];min=Math.min(min,d[i]);max=Math.max(max,d[i]);}return {gray,min,max};});expect(stats.gray).toBe(true);expect(stats.max-stats.min).toBeGreaterThan(100);
 const before=await c.evaluate((c:HTMLCanvasElement)=>c.toDataURL());await page.getByLabel('Hatching strength',{exact:true}).focus();await page.keyboard.press('Home');await expect.poll(()=>c.evaluate((c:HTMLCanvasElement)=>c.toDataURL())).not.toBe(before);
 await page.getByLabel('Export scale',{exact:true}).selectOption('2');const event=page.waitForEvent('download');await page.getByRole('button',{name:'Export PNG'}).click();const d=await event;const png=fs.readFileSync((await d.path())!);expect(png.readUInt32BE(16)).toBe(3200);expect(png.readUInt32BE(20)).toBe(2134);expect(d.suggestedFilename()).toContain('-storyboard-');
 await page.getByRole('button',{name:'Reset all settings'}).click();await expect(page.getByLabel('Hatching strength',{exact:true})).toHaveValue('65');await page.keyboard.press('Escape');await expect(page.getByRole('button',{name:'Open Storyboard Sketch editor'})).toBeFocused();expect(errors).toEqual([]);
});
test('transparent paper exports graphite without opaque white paper',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:'Open Storyboard Sketch editor'}).click();
 const b64=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=120;c.height=80;const x=c.getContext('2d')!;x.fillStyle='#303030';x.fillRect(30,20,60,40);return c.toDataURL().split(',')[1];});await page.getByLabel('Upload image').setInputFiles({name:'shape.png',mimeType:'image/png',buffer:Buffer.from(b64,'base64')});
 const c=page.locator('canvas[aria-label]');await expect.poll(()=>c.evaluate((c:HTMLCanvasElement)=>c.width)).toBe(120);await page.getByRole('switch',{name:'Transparent paper'}).check();
 await expect.poll(()=>c.evaluate((c:HTMLCanvasElement)=>c.getContext('2d')!.getImageData(0,0,1,1).data[3])).toBe(0);
 const event=page.waitForEvent('download');await page.getByRole('button',{name:'Export PNG'}).click();const d=await event;const png=fs.readFileSync((await d.path())!);
 const alpha=await page.evaluate(async(b64)=>{const image=await createImageBitmap(await(await fetch('data:image/png;base64,'+b64)).blob());const c=document.createElement('canvas');c.width=image.width;c.height=image.height;const x=c.getContext('2d')!;x.drawImage(image,0,0);return [x.getImageData(0,0,1,1).data[3],x.getImageData(60,40,1,1).data[3]];},png.toString('base64'));expect(alpha[0]).toBe(0);expect(alpha[1]).toBeGreaterThan(0);
});
