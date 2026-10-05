import {test,expect} from '@playwright/test';
test('exports a decodable looping GIF with exact timing and changing frames',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:'Open Living Geometry editor',exact:true}).click();
 await page.getByRole('button',{name:/Or try the sample image/}).click();await expect(page.getByLabel('Living Geometry image preview')).toBeVisible();
 await page.getByRole('slider',{name:'Loop duration · seconds',exact:true}).fill('4');await page.getByLabel('GIF size').selectOption('480');
 const download=page.waitForEvent('download');await page.getByRole('button',{name:/Export looping GIF/}).click();const file=await download;
 expect(file.suggestedFilename()).toMatch(/\.gif$/);const fs=await import('node:fs/promises');const bytes=await fs.readFile((await file.path())!);
 expect(bytes.subarray(0,6).toString()).toBe('GIF89a');expect(bytes.readUInt16LE(6)).toBe(480);expect(bytes.readUInt16LE(8)).toBe(320);
 const loop=bytes.indexOf(Buffer.from('NETSCAPE2.0'));expect(loop).toBeGreaterThan(0);expect([...bytes.subarray(loop+11,loop+16)]).toEqual([3,1,0,0,0]);
 const decoded=await page.evaluate(async(data)=>{
  const Decoder=(globalThis as any).ImageDecoder;
  const decoder=new Decoder({data:Uint8Array.from(atob(data),c=>c.charCodeAt(0)),type:'image/gif'});await decoder.tracks.ready;
  const {frameCount,repetitionCount}=decoder.tracks.selectedTrack;
  const first=(await decoder.decode({frameIndex:0})).image,later=(await decoder.decode({frameIndex:20})).image,last=(await decoder.decode({frameIndex:frameCount-1})).image;
  const c=document.createElement('canvas');c.width=480;c.height=320;const ctx=c.getContext('2d')!;
  ctx.drawImage(first,0,0);const initial=c.toDataURL();ctx.drawImage(later,0,0);const changed=initial!==c.toDataURL();
  const result={frameCount,infinite:repetitionCount===Infinity,firstDuration:first.duration,lastEnd:last.timestamp+last.duration,changed};
  first.close();later.close();last.close();decoder.close();return result;
 },bytes.toString('base64'));
 expect(decoded).toEqual({frameCount:80,infinite:true,firstDuration:50000,lastEnd:4000000,changed:true});
 await page.screenshot({path:'../work/gif-export-editor.png'});
});
test('GIF export can be cancelled and editor remains usable',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:'Open Living Geometry editor',exact:true}).click();await page.getByRole('button',{name:/Or try the sample image/}).click();await expect(page.getByLabel('Living Geometry image preview')).toBeVisible();
 await page.getByRole('button',{name:/Export looping GIF/}).click();await page.getByRole('button',{name:'Cancel export',exact:true}).click();await expect(page.getByRole('alert')).toHaveText('GIF export cancelled.');await expect(page.getByRole('button',{name:/Export looping GIF/})).toBeEnabled();await page.getByRole('button',{name:'Close editor',exact:true}).click();await expect(page.getByRole('button',{name:'Open Living Geometry editor',exact:true})).toBeVisible();
});
