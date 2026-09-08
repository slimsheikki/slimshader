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
