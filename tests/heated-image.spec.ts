import {test,expect} from '@playwright/test';
import fs from 'node:fs';
test('dedicated Heated Shader opens empty, accepts upload, adjusts heat and exports',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:'Open Heated Shader editor'}).click();await expect(page.getByRole('button',{name:'Choose an image'})).toBeVisible();await expect(page.getByLabel('Shape',{exact:true})).toHaveCount(0);
 await page.getByLabel('Upload image').setInputFiles('public/sample.jpg');const canvas=page.locator('canvas[aria-label="Heated Shader image preview"]');await expect.poll(()=>canvas.evaluate((c:HTMLCanvasElement)=>c.width)).toBe(1600);
 const before=await canvas.evaluate((c:HTMLCanvasElement)=>c.toDataURL());await page.getByLabel('Heat intensity',{exact:true}).focus();await page.keyboard.press('Home');await expect.poll(()=>canvas.evaluate((c:HTMLCanvasElement)=>c.toDataURL())).not.toBe(before);
 await page.getByRole('button',{name:'Original',exact:true}).click();await expect(page.getByAltText('Original image for comparison')).toBeVisible();
 const event=page.waitForEvent('download');await page.getByRole('button',{name:'Export PNG'}).click();const download=await event;const data=fs.readFileSync((await download.path())!);expect(data.readUInt32BE(16)).toBe(1600);expect(data.readUInt32BE(20)).toBe(1067);expect(download.suggestedFilename()).toContain('-heated-image-');
 await page.getByRole('button',{name:'Reset all settings'}).click();await expect(page.getByLabel('Heat intensity',{exact:true})).toHaveValue('60');
});
test('smudge changes heat pixels, survives export and undo restores result',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:'Open Heated Shader editor'}).click();
 const b64=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=320;c.height=200;const x=c.getContext('2d')!;x.fillStyle='#151515';x.fillRect(0,0,320,200);x.fillStyle='#fafafa';x.fillRect(100,0,60,200);return c.toDataURL().split(',')[1];});
 await page.getByLabel('Upload image').setInputFiles({name:'smear.png',mimeType:'image/png',buffer:Buffer.from(b64,'base64')});const c=page.locator('canvas[aria-label="Heated Shader image preview"]');await expect.poll(()=>c.evaluate((c:HTMLCanvasElement)=>c.width)).toBe(320);
 const before=await c.evaluate((c:HTMLCanvasElement)=>c.toDataURL());await page.getByRole('button',{name:'Smudge',exact:true}).click();const box=(await c.boundingBox())!;
 await page.mouse.move(box.x+box.width*.43,box.y+box.height*.5);await page.mouse.down();await page.mouse.move(box.x+box.width*.75,box.y+box.height*.6,{steps:8});await page.mouse.up();
 await expect.poll(()=>c.evaluate((c:HTMLCanvasElement)=>c.toDataURL())).not.toBe(before);
 await page.getByLabel('Export scale',{exact:true}).selectOption('2');const event=page.waitForEvent('download');await page.getByRole('button',{name:'Export PNG'}).click();const d=await event;const png=fs.readFileSync((await d.path())!);expect(png.readUInt32BE(16)).toBe(640);expect(png.readUInt32BE(20)).toBe(400);
 await page.getByRole('button',{name:'Undo smudge'}).click();await expect.poll(()=>c.evaluate((c:HTMLCanvasElement)=>c.toDataURL())).toBe(before);await expect(page.getByRole('button',{name:'Clear smudges'})).toBeDisabled();
 const cleanEvent=page.waitForEvent('download');await page.getByRole('button',{name:'Export PNG'}).click();const clean=await cleanEvent;expect(fs.readFileSync((await clean.path())!).equals(png)).toBe(false);
});
