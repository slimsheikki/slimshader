import { test, expect } from '@playwright/test';
import fs from 'node:fs';

async function open(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.getByRole('button',{name:'Open ASCII editor'}).click();
  await expect(page.getByRole('dialog')).toBeVisible();
}
async function rendered(page: import('@playwright/test').Page) {
  await expect(page.getByText('Live preview',{exact:true})).toBeVisible();
  await expect.poll(()=>page.locator('canvas[aria-label="ASCII image preview"]').evaluate((c:HTMLCanvasElement)=>c.width)).toBeGreaterThan(10);
}

test('gallery, sample, controls, true 2x PNG and keyboard close', async ({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await open(page);
  await expect(page.getByText('A new perspective')).toBeVisible();
  await page.getByRole('button',{name:'Or try the sample image'}).click();await rendered(page);
  const before=await page.locator('canvas[aria-label="ASCII image preview"]').evaluate((c:HTMLCanvasElement)=>c.toDataURL());
  await page.getByLabel('Custom characters').fill('SLIMSHADERS');
  await expect.poll(()=>page.locator('canvas[aria-label="ASCII image preview"]').evaluate((c:HTMLCanvasElement)=>c.toDataURL())).not.toBe(before);
  await page.getByLabel('Export scale',{exact:true}).selectOption('2');
  const downloadEvent=page.waitForEvent('download');
  await page.getByRole('button',{name:'Export PNG'}).click();
  const download=await downloadEvent;const path=await download.path();const png=fs.readFileSync(path!);
  expect(png.subarray(1,4).toString()).toBe('PNG');expect(png.readUInt32BE(16)).toBe(3200);
  expect(png.readUInt32BE(20)).toBe(2134);
  await page.getByRole('button',{name:'Reset all settings'}).click();
  await expect(page.getByLabel('Custom characters')).toHaveValue(' .,:;i1tfLCG08@');
  await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.getByRole('button',{name:'Open ASCII editor'})).toBeFocused();expect(errors).toEqual([]);
});

test('upload, transparency and custom scale dimensions',async({page})=>{
  await open(page);
  const png=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=240;c.height=160;const x=c.getContext('2d')!;x.fillStyle='white';x.fillRect(40,40,160,80);return c.toDataURL().split(',')[1];});
  await page.getByLabel('Upload image').setInputFiles({name:'transparent.png',mimeType:'image/png',buffer:Buffer.from(png,'base64')});await rendered(page);
  await page.getByRole('switch',{name:'Transparent background'}).check();
  await page.getByLabel('Custom characters').fill('€');
  await page.getByLabel('Export scale',{exact:true}).selectOption('custom');
  await page.getByLabel('Custom export scale',{exact:true}).fill('4');
  const event=page.waitForEvent('download');await page.getByRole('button',{name:'Export PNG'}).click();const d=await event;const data=fs.readFileSync((await d.path())!);
  expect(data.readUInt32BE(16)).toBe(960);expect(data.readUInt32BE(20)).toBe(640);
  const pixels=await page.evaluate(async(base64)=>{const image=await createImageBitmap(await(await fetch(`data:image/png;base64,${base64}`)).blob());const c=document.createElement('canvas');c.width=image.width;c.height=image.height;const ctx=c.getContext('2d')!;ctx.drawImage(image,0,0);const data=ctx.getImageData(0,0,c.width,c.height).data;return {corner:data[3],hasInk:Array.from(data).some((n,i)=>i%4===3&&n>0)};},data.toString('base64'));
  expect(pixels.corner).toBe(0);expect(pixels.hasInk).toBe(true);
});

test('drop and clipboard image entry, original comparison, invalid file',async({page})=>{
  await open(page);
  const data=fs.readFileSync('public/sample.jpg').toString('base64');
  await page.evaluate(async(b64)=>{const blob=await(await fetch(`data:image/jpeg;base64,${b64}`)).blob();const transfer=new DataTransfer();transfer.items.add(new File([blob],'dropped.jpg',{type:'image/jpeg'}));document.querySelector('.workspace')!.dispatchEvent(new DragEvent('drop',{bubbles:true,dataTransfer:transfer}));},data);
  await rendered(page);await expect(page.getByText('dropped.jpg')).toBeVisible();
  await page.getByRole('button',{name:'Original',exact:true}).click();await expect(page.getByAltText('Original image for comparison')).toBeVisible();
  await page.evaluate(async(b64)=>{const blob=await(await fetch(`data:image/jpeg;base64,${b64}`)).blob();const transfer=new DataTransfer();transfer.items.add(new File([blob],'clipboard.jpg',{type:'image/jpeg'}));document.dispatchEvent(new ClipboardEvent('paste',{bubbles:true,clipboardData:transfer}));},data);
  await rendered(page);await expect(page.getByText('Pasted image',{exact:true})).toBeVisible();
  await page.getByLabel('Upload image').setInputFiles({name:'bad.txt',mimeType:'text/plain',buffer:Buffer.from('invalid')});
  await expect(page.getByRole('alert')).toContainText('Choose a PNG');
});

test('mobile workspace fits screen and renders',async({page})=>{
  await page.setViewportSize({width:390,height:844});await open(page);
  await page.getByRole('button',{name:'Or try the sample image'}).click();await rendered(page);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(390);
  await page.getByRole('button',{name:'Export PNG'}).scrollIntoViewIfNeeded();await expect(page.getByRole('button',{name:'Export PNG'})).toBeVisible();
});

test('rapid parameter changes settle, bounds errors recover, all Unicode presets export',async({page})=>{
  await open(page);await page.getByRole('button',{name:'Or try the sample image'}).click();await rendered(page);
  await page.getByLabel('Character size',{exact:true}).evaluate((el:HTMLInputElement)=>{const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')!.set!;for(let n=4;n<=30;n++){setter.call(el,String(n));el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));}});
  await rendered(page);
  await page.getByLabel('Custom characters').fill('●○');await rendered(page);
  await page.getByLabel('Export scale',{exact:true}).selectOption('custom');await page.getByLabel('Custom export scale',{exact:true}).fill('8');
  await page.getByRole('button',{name:'Export PNG'}).click();await expect(page.getByRole('alert')).toContainText('too large');
  await page.getByLabel('Custom export scale',{exact:true}).fill('1');const download=page.waitForEvent('download');await page.getByRole('button',{name:'Export PNG'}).click();expect((await download).suggestedFilename()).toContain('-1x.png');
});

test('optional WebMCP opens same editor and rejects invalid input',async({page})=>{
  await page.addInitScript(()=>{(window as any).registeredTools={};Object.defineProperty(document,'modelContext',{value:{registerTool(tool:any,{signal}:any){(window as any).registeredTools[tool.name]=tool;signal.addEventListener('abort',()=>delete (window as any).registeredTools[tool.name]);}}});});
  await page.goto('/');await expect.poll(()=>page.evaluate(()=>!!(window as any).registeredTools.open_ascii_editor)).toBe(true);
  const invalid=await page.evaluate(()=>{try{(window as any).registeredTools.open_ascii_editor.execute({extra:true});return false;}catch{return true;}});expect(invalid).toBe(true);
  const result=await page.evaluate(()=>(window as any).registeredTools.open_ascii_editor.execute({}));expect(result.status).toBe('opened');await expect(page.getByRole('dialog')).toBeVisible();
});
