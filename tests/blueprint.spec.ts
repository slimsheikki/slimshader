import {test,expect} from '@playwright/test';
import fs from 'node:fs';
test('Blueprint sample, adjustable patterns and 2x export',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:'Open Blueprint Mosaic editor'}).click();await page.getByRole('button',{name:'Or try the sample image'}).click();const c=page.locator('canvas[aria-label="Blueprint Mosaic image preview"]');await expect.poll(()=>c.evaluate((c:HTMLCanvasElement)=>c.width)).toBe(1600);
 const before=await c.evaluate((c:HTMLCanvasElement)=>c.toDataURL());await page.getByLabel('Cell size',{exact:true}).focus();await page.keyboard.press('End');await expect.poll(()=>c.evaluate((c:HTMLCanvasElement)=>c.toDataURL())).not.toBe(before);
 await page.getByLabel('Export scale',{exact:true}).selectOption('2');const event=page.waitForEvent('download');await page.getByRole('button',{name:'Export PNG'}).click();const d=await event;const png=fs.readFileSync((await d.path())!);expect(png.readUInt32BE(16)).toBe(3200);expect(png.readUInt32BE(20)).toBe(2134);
 await page.getByRole('button',{name:'Reset all settings'}).click();await expect(page.getByLabel('Cell size',{exact:true})).toHaveValue('14');
});
test('Blueprint respects transparent image areas and invert',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:'Open Blueprint Mosaic editor'}).click();const b=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=140;c.height=140;const x=c.getContext('2d')!;x.fillStyle='#fff';x.fillRect(28,28,84,84);return c.toDataURL().split(',')[1];});await page.getByLabel('Upload image').setInputFiles({name:'cutout.png',mimeType:'image/png',buffer:Buffer.from(b,'base64')});const c=page.locator('canvas[aria-label]');await expect.poll(()=>c.evaluate((c:HTMLCanvasElement)=>c.width)).toBe(140);
 await page.getByRole('switch',{name:'Transparent background'}).check();await page.getByLabel('Grid visibility',{exact:true}).focus();await page.keyboard.press('Home');await expect.poll(()=>c.evaluate((c:HTMLCanvasElement)=>c.getContext('2d')!.getImageData(5,5,1,1).data[3])).toBe(0);
 await page.getByRole('switch',{name:'Invert light & dark'}).check();await expect.poll(()=>c.evaluate((c:HTMLCanvasElement)=>c.getContext('2d')!.getImageData(50,50,1,1).data[3])).toBe(0);
});
