import { test, expect } from '@playwright/test';
import fs from 'node:fs';
test('Toon sample, palette, bands, reset and original-size export',async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');await page.getByRole('button',{name:'Open Painterly Toon editor'}).click();
  await page.getByRole('button',{name:'Or try the sample image'}).click();
  const canvas=page.locator('canvas[aria-label="Painterly Toon image preview"]');
  await expect.poll(()=>canvas.evaluate((c:HTMLCanvasElement)=>c.width)).toBe(1600);
  const before=await canvas.evaluate((c:HTMLCanvasElement)=>c.toDataURL());
  await page.getByLabel('Palette',{exact:true}).selectOption('mint');
  await expect.poll(()=>canvas.evaluate((c:HTMLCanvasElement)=>c.toDataURL())).not.toBe(before);
  await page.getByLabel('Color bands',{exact:true}).focus();await page.keyboard.press('Home');await page.keyboard.press('ArrowRight');
  await expect(page.getByLabel('Color bands',{exact:true})).toHaveValue('3');
  const event=page.waitForEvent('download');await page.getByRole('button',{name:'Export PNG'}).click();
  const d=await event;const bytes=fs.readFileSync((await d.path())!);expect(bytes.readUInt32BE(16)).toBe(1600);expect(bytes.readUInt32BE(20)).toBe(1067);expect(d.suggestedFilename()).toContain('-toon-');
  await page.getByRole('button',{name:'Reset all settings'}).click();await expect(page.getByLabel('Color bands',{exact:true})).toHaveValue('5');
  await page.keyboard.press('Escape');await expect(page.getByRole('button',{name:'Open Painterly Toon editor'})).toBeFocused();expect(errors).toEqual([]);
});
test('Toon preserves transparent areas in 4x PNG and shows source comparison',async({page})=>{
  await page.goto('/');await page.getByRole('button',{name:'Open Painterly Toon editor'}).click();
  const image=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=160;c.height=100;const x=c.getContext('2d')!;x.fillStyle='#fa7050';x.fillRect(40,30,80,40);return c.toDataURL().split(',')[1];});
  await page.getByLabel('Upload image').setInputFiles({name:'test.png',mimeType:'image/png',buffer:Buffer.from(image,'base64')});
  await expect.poll(()=>page.locator('canvas[aria-label]').evaluate((c:HTMLCanvasElement)=>c.width)).toBe(160);
  await page.getByRole('button',{name:'Original',exact:true}).click();await expect(page.getByAltText('Original image for comparison')).toBeVisible();
  await page.getByLabel('Export scale',{exact:true}).selectOption('4');const event=page.waitForEvent('download');await page.getByRole('button',{name:'Export PNG'}).click();const d=await event;const bytes=fs.readFileSync((await d.path())!);
  expect(bytes.readUInt32BE(16)).toBe(640);expect(bytes.readUInt32BE(20)).toBe(400);
  const alpha=await page.evaluate(async(data)=>{const b=await createImageBitmap(await(await fetch('data:image/png;base64,'+data)).blob());const c=document.createElement('canvas');c.width=b.width;c.height=b.height;const x=c.getContext('2d')!;x.drawImage(b,0,0);return [x.getImageData(0,0,1,1).data[3],x.getImageData(320,200,1,1).data[3]];},bytes.toString('base64'));expect(alpha).toEqual([0,255]);
});
test('brushwork and seed change the image, reset restores deterministic paint',async({page})=>{
  await page.goto('/');await page.getByRole('button',{name:'Open Painterly Toon editor'}).click();await page.getByRole('button',{name:'Or try the sample image'}).click();
  const c=page.locator('canvas[aria-label="Painterly Toon image preview"]');await expect.poll(()=>c.evaluate((c:HTMLCanvasElement)=>c.width)).toBe(1600);
  const initial=await c.evaluate((c:HTMLCanvasElement)=>c.toDataURL());
  await page.getByRole('button',{name:'New brush pattern'}).click();await expect.poll(()=>c.evaluate((c:HTMLCanvasElement)=>c.toDataURL())).not.toBe(initial);
  await page.getByRole('button',{name:'Reset all settings'}).click();await expect.poll(()=>c.evaluate((c:HTMLCanvasElement)=>c.toDataURL())).toBe(initial);
  await page.getByLabel('Paint amount',{exact:true}).focus();await page.keyboard.press('Home');await expect.poll(()=>c.evaluate((c:HTMLCanvasElement)=>c.toDataURL())).not.toBe(initial);
  await expect(page.getByLabel('Paint amount',{exact:true})).toHaveValue('0');
});
test('original colors are default and Saturation desaturates the painted result',async({page})=>{
  await page.goto('/');await page.getByRole('button',{name:'Open Painterly Toon editor'}).click();
  await expect(page.getByLabel('Palette',{exact:true})).toHaveValue('source');await expect(page.getByLabel('Saturation',{exact:true})).toHaveValue('100');
  const image=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=240;c.height=160;const x=c.getContext('2d')!;x.fillStyle='#e84a38';x.fillRect(0,0,120,160);x.fillStyle='#3076dd';x.fillRect(120,0,120,160);return c.toDataURL().split(',')[1];});
  await page.getByLabel('Upload image').setInputFiles({name:'colors.png',mimeType:'image/png',buffer:Buffer.from(image,'base64')});
  const c=page.locator('canvas[aria-label="Painterly Toon image preview"]');await expect.poll(()=>c.evaluate((c:HTMLCanvasElement)=>c.width)).toBe(240);
  const colors=await c.evaluate((c:HTMLCanvasElement)=>{const x=c.getContext('2d')!;return [Array.from(x.getImageData(50,80,1,1).data),Array.from(x.getImageData(190,80,1,1).data)];});
  expect(colors[0][0]).toBeGreaterThan(colors[0][2]);expect(colors[1][2]).toBeGreaterThan(colors[1][0]);
  await page.getByLabel('Saturation',{exact:true}).focus();await page.keyboard.press('Home');
  await expect.poll(()=>c.evaluate((c:HTMLCanvasElement)=>{const d=c.getContext('2d')!.getImageData(50,80,1,1).data;return Math.max(d[0],d[1],d[2])-Math.min(d[0],d[1],d[2]);})).toBe(0);
});
test('stroke shapes and size variety produce distinct paint patterns',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:'Open Painterly Toon editor'}).click();await page.getByRole('button',{name:'Or try the sample image'}).click();const c=page.locator('canvas[aria-label="Painterly Toon image preview"]');await expect.poll(()=>c.evaluate((c:HTMLCanvasElement)=>c.width)).toBe(1600);
 const mixed=await c.evaluate((c:HTMLCanvasElement)=>c.toDataURL());await page.getByLabel('Stroke shape',{exact:true}).selectOption('flat');await expect.poll(()=>c.evaluate((c:HTMLCanvasElement)=>c.toDataURL())).not.toBe(mixed);const flat=await c.evaluate((c:HTMLCanvasElement)=>c.toDataURL());await page.getByLabel('Size variety',{exact:true}).focus();await page.keyboard.press('Home');await expect.poll(()=>c.evaluate((c:HTMLCanvasElement)=>c.toDataURL())).not.toBe(flat);
 await page.getByRole('button',{name:'Reset all settings'}).click();await expect(page.getByLabel('Stroke shape',{exact:true})).toHaveValue('mixed');await expect(page.getByLabel('Size variety',{exact:true})).toHaveValue('75');
});
