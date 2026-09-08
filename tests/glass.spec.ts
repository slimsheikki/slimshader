import {test,expect} from '@playwright/test';
test('glass parameters change output and export real transparent pixels at 2x',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:'Open Glass Panels editor'}).click();
 const png=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=200;c.height=160;const x=c.getContext('2d')!;const g=x.createLinearGradient(30,0,170,0);g.addColorStop(0,'red');g.addColorStop(1,'blue');x.fillStyle=g;x.fillRect(30,30,140,100);return c.toDataURL().split(',')[1];});
 await page.getByLabel('Upload image').setInputFiles({name:'test.png',mimeType:'image/png',buffer:Buffer.from(png,'base64')});
 await expect(page.getByText('Live preview',{exact:true})).toBeVisible();
 const canvas=page.getByLabel('Glass Panels image preview');const first=await canvas.evaluate((c:HTMLCanvasElement)=>c.toDataURL());
 await page.getByRole('slider',{name:'Panel count',exact:true}).fill('4');await page.getByRole('slider',{name:'Panel width',exact:true}).fill('60');
 await expect.poll(()=>canvas.evaluate((c:HTMLCanvasElement)=>c.toDataURL())).not.toBe(first);
 await page.getByRole('slider',{name:'Glass amount',exact:true}).fill('0');
 await expect.poll(()=>canvas.evaluate((c:HTMLCanvasElement)=>c.getContext('2d')!.getImageData(0,0,1,1).data[3])).toBe(0);
 await page.getByLabel('Export scale').selectOption('2');const download=page.waitForEvent('download');await page.getByRole('button',{name:/Export PNG/}).click();const file=await download;const path=await file.path();const fs=await import('node:fs/promises');const buf=await fs.readFile(path!);expect(buf.readUInt32BE(16)).toBe(400);expect(buf.readUInt32BE(20)).toBe(320);
 await page.getByRole('button',{name:'Reset all settings'}).click();await expect(page.getByRole('slider',{name:'Panel count',exact:true})).toHaveValue('12');
});
test('split glass preserves uncovered pixels and supports direct placement',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:'Open Glass Panels editor'}).click();await page.getByRole('button',{name:'Split Glass',exact:true}).click();
 const png=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=400;c.height=300;const x=c.getContext('2d')!;x.fillStyle='#bb3355';x.fillRect(0,0,400,300);x.fillStyle='#ffeeaa';x.fillRect(200,40,80,200);return c.toDataURL().split(',')[1];});await page.getByLabel('Upload image').setInputFiles({name:'split.png',mimeType:'image/png',buffer:Buffer.from(png,'base64')});const canvas=page.getByLabel('Glass Panels image preview');await expect.poll(()=>canvas.evaluate((c:HTMLCanvasElement)=>c.width)).toBe(400);expect(await canvas.evaluate((c:HTMLCanvasElement)=>Array.from(c.getContext('2d')!.getImageData(20,100,1,1).data))).toEqual([187,51,85,255]);
 const first=await canvas.evaluate((c:HTMLCanvasElement)=>c.toDataURL());await page.getByRole('slider',{name:'Subject distance',exact:true}).fill('90');await expect.poll(()=>canvas.evaluate((c:HTMLCanvasElement)=>c.toDataURL())).not.toBe(first);
 await page.getByRole('button',{name:'Place glass',exact:true}).click();const overlay=page.getByLabel('Glass placement handles');await expect(overlay).toBeVisible();const bounds=await overlay.boundingBox();expect(bounds!.width).toBeGreaterThan(100);await page.mouse.move(bounds!.x+bounds!.width*.6,bounds!.y+bounds!.height*.5);await page.mouse.down();await page.mouse.move(bounds!.x+bounds!.width*.5,bounds!.y+bounds!.height*.5);await page.mouse.up();await expect(page.getByRole('slider',{name:'Group position',exact:true})).not.toHaveValue('68');
});
