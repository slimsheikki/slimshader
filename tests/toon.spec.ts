import { test, expect } from '@playwright/test';
import fs from 'node:fs';
test('Toon sample, palette, bands, reset and original-size export',async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');await page.getByRole('button',{name:'Open Toon editor'}).click();
  await page.getByRole('button',{name:'Or try the sample image'}).click();
  const canvas=page.locator('canvas[aria-label="Toon image preview"]');
  await expect.poll(()=>canvas.evaluate((c:HTMLCanvasElement)=>c.width)).toBe(1600);
  const before=await canvas.evaluate((c:HTMLCanvasElement)=>c.toDataURL());
  await page.getByLabel('Palette',{exact:true}).selectOption('mint');
  await expect.poll(()=>canvas.evaluate((c:HTMLCanvasElement)=>c.toDataURL())).not.toBe(before);
  await page.getByLabel('Color bands',{exact:true}).focus();await page.keyboard.press('Home');await page.keyboard.press('ArrowRight');
  await expect(page.getByLabel('Color bands',{exact:true})).toHaveValue('3');
  const event=page.waitForEvent('download');await page.getByRole('button',{name:'Export PNG'}).click();
  const d=await event;const bytes=fs.readFileSync((await d.path())!);expect(bytes.readUInt32BE(16)).toBe(1600);expect(bytes.readUInt32BE(20)).toBe(1067);expect(d.suggestedFilename()).toContain('-toon-');
  await page.getByRole('button',{name:'Reset all settings'}).click();await expect(page.getByLabel('Color bands',{exact:true})).toHaveValue('4');
  await page.keyboard.press('Escape');await expect(page.getByRole('button',{name:'Open Toon editor'})).toBeFocused();expect(errors).toEqual([]);
});
test('Toon preserves transparent areas in 4x PNG and shows source comparison',async({page})=>{
  await page.goto('/');await page.getByRole('button',{name:'Open Toon editor'}).click();
  const image=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=160;c.height=100;const x=c.getContext('2d')!;x.fillStyle='#fa7050';x.fillRect(40,30,80,40);return c.toDataURL().split(',')[1];});
  await page.getByLabel('Upload image').setInputFiles({name:'test.png',mimeType:'image/png',buffer:Buffer.from(image,'base64')});
  await expect.poll(()=>page.locator('canvas[aria-label]').evaluate((c:HTMLCanvasElement)=>c.width)).toBe(160);
  await page.getByRole('button',{name:'Original',exact:true}).click();await expect(page.getByAltText('Original image for comparison')).toBeVisible();
  await page.getByLabel('Export scale',{exact:true}).selectOption('4');const event=page.waitForEvent('download');await page.getByRole('button',{name:'Export PNG'}).click();const d=await event;const bytes=fs.readFileSync((await d.path())!);
  expect(bytes.readUInt32BE(16)).toBe(640);expect(bytes.readUInt32BE(20)).toBe(400);
  const alpha=await page.evaluate(async(data)=>{const b=await createImageBitmap(await(await fetch('data:image/png;base64,'+data)).blob());const c=document.createElement('canvas');c.width=b.width;c.height=b.height;const x=c.getContext('2d')!;x.drawImage(b,0,0);return [x.getImageData(0,0,1,1).data[3],x.getImageData(320,200,1,1).data[3]];},bytes.toString('base64'));expect(alpha).toEqual([0,255]);
});
