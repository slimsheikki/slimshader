import { test, expect } from '@playwright/test';

test('Nokia LCD controls, reset, transparency and 2x PNG', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('/'); await page.getByRole('button', { name: 'Open Nokia LCD editor', exact: true }).click();
  await page.getByRole('button', { name: /try the sample image/ }).click();
  const canvas = page.getByLabel('Nokia LCD image preview');
  await expect.poll(() => canvas.evaluate((c: HTMLCanvasElement) => c.width)).toBe(1600);
  await expect(page.getByText('Live preview', { exact: true })).toBeVisible();
  await canvas.screenshot({ path: '../work/nokia-lcd-preview.png' });
  const original = await canvas.evaluate((c: HTMLCanvasElement) => c.toDataURL());
  await page.getByRole('slider', { name: 'Pixel resolution', exact: true }).fill('48');
  await expect.poll(() => canvas.evaluate((c: HTMLCanvasElement) => c.toDataURL())).not.toBe(original);
  const coarse = await canvas.evaluate((c: HTMLCanvasElement) => c.toDataURL());
  await page.getByLabel('Dithering', { exact: true }).selectOption('diffusion');
  await expect.poll(() => canvas.evaluate((c: HTMLCanvasElement) => c.toDataURL())).not.toBe(coarse);
  await page.getByRole('button', { name: 'Reset all settings' }).click();
  await expect.poll(() => canvas.evaluate((c: HTMLCanvasElement) => c.toDataURL())).toBe(original);
  const png = await page.evaluate(() => { const c = document.createElement('canvas'); c.width = 240; c.height = 180; const ctx = c.getContext('2d')!; ctx.fillStyle = '#222'; ctx.fillRect(60, 40, 120, 100); return c.toDataURL().split(',')[1]; });
  await page.getByLabel('Upload image').setInputFiles({ name: 'alpha.png', mimeType: 'image/png', buffer: Buffer.from(png, 'base64') });
  await expect.poll(() => canvas.evaluate((c: HTMLCanvasElement) => c.width)).toBe(240);
  await page.getByRole('switch', { name: 'Transparent background' }).check();
  await expect.poll(() => canvas.evaluate((c: HTMLCanvasElement) => c.getContext('2d')!.getImageData(0, 0, 1, 1).data[3])).toBe(0);
  await page.getByLabel('Export scale').selectOption('2'); const download = page.waitForEvent('download');
  await page.getByRole('button', { name: /Export PNG/ }).click(); const file = await download;
  expect(file.suggestedFilename()).toContain('nokia-lcd-2x');
  const fs = await import('node:fs/promises'); const pngData = await fs.readFile((await file.path())!);
  expect(pngData.readUInt32BE(16)).toBe(480); expect(pngData.readUInt32BE(20)).toBe(360);
  const alpha = await page.evaluate(async base64 => { const image = await createImageBitmap(await (await fetch('data:image/png;base64,' + base64)).blob()); const c = document.createElement('canvas'); c.width = image.width; c.height = image.height; const ctx = c.getContext('2d')!; ctx.drawImage(image, 0, 0); image.close(); return [ctx.getImageData(0, 0, 1, 1).data[3], ctx.getImageData(240, 180, 1, 1).data[3]]; }, pngData.toString('base64'));
  expect(alpha[0]).toBe(0); expect(alpha[1]).toBeGreaterThan(0); expect(errors).toEqual([]);
});

test('binary tones, invert, export-consistent grid and classic layout', async ({ page }) => {
  await page.goto('/');
  const result = await page.evaluate(async () => {
    // @ts-expect-error Vite browser module
    const { renderLcd } = await import('/src/shaders/nokia-lcd/render.ts');
    // @ts-expect-error Vite browser module
    const { defaults } = await import('/src/shaders/nokia-lcd/model.ts');
    const input = document.createElement('canvas'); input.width = 168; input.height = 96;
    const ic = input.getContext('2d')!, g = ic.createLinearGradient(0, 0, 168, 0); g.addColorStop(0, 'black'); g.addColorStop(1, 'white'); ic.fillStyle = g; ic.fillRect(0, 0, 168, 96);
    const image = await createImageBitmap(input), a = document.createElement('canvas'), b = document.createElement('canvas'); a.width = 168; a.height = 96; b.width = 336; b.height = 192;
    const p = { ...defaults, gap: 0, grid: 0, shadow: 0, foreground: '#000000', background: '#ffffff', brightness: 0, contrast: 0 };
    renderLcd(a, image, p); renderLcd(b, image, p);
    const av = a.getContext('2d')!.getImageData(0, 0, 168, 96).data, bv = b.getContext('2d')!.getImageData(0, 0, 336, 192).data;
    let mismatch = 0; for (let y = 0; y < 48; y++) for (let x = 0; x < 84; x++) if (av[((y * 2 + 1) * 168 + x * 2 + 1) * 4] !== bv[((y * 4 + 2) * 336 + x * 4 + 2) * 4]) mismatch++;
    renderLcd(a, image, { ...p, invert: true }); const inv = a.getContext('2d')!.getImageData(0, 0, 168, 96).data;
    let invertErrors = 0; for (let i = 0; i < av.length; i += 4) if (av[i] + inv[i] !== 255) invertErrors++;
    const square = document.createElement('canvas'); square.width = square.height = 48; square.getContext('2d')!.fillRect(0, 0, 48, 48);
    const sq = await createImageBitmap(square); renderLcd(a, sq, { ...p, layout: 'classic', dither: 'none', transparent: true });
    const ctx = a.getContext('2d')!; const classic = [ctx.getImageData(10, 48, 1, 1).data[3], ctx.getImageData(84, 48, 1, 1).data[3], ctx.getImageData(158, 48, 1, 1).data[3]];
    image.close(); sq.close(); return { mismatch, invertErrors, colors: [...new Set(Array.from(av).filter((_, i) => i % 4 === 0))], classic };
  });
  expect(result.mismatch).toBe(0); expect(result.invertErrors).toBe(0); expect(result.colors.sort()).toEqual([0, 255]); expect(result.classic).toEqual([0, 255, 0]);
});

test('drop and paste images into Nokia LCD', async ({ page }) => {
  await page.goto('/'); await page.getByRole('button', { name: 'Open Nokia LCD editor', exact: true }).click();
  for (const [event, width] of [['drop', 120], ['paste', 150]] as const) {
    await page.evaluate(async ({ event, width }) => {
      const c = document.createElement('canvas'); c.width = width; c.height = 90; c.getContext('2d')!.fillRect(0, 0, width, 90);
      const blob = await new Promise<Blob>(r => c.toBlob(b => r(b!))); const data = new DataTransfer(); data.items.add(new File([blob], 'input.png', { type: 'image/png' }));
      if (event === 'drop') document.querySelector('.workspace')!.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: data }));
      else document.dispatchEvent(new ClipboardEvent('paste', { bubbles: true, cancelable: true, clipboardData: data }));
    }, { event, width });
    await expect.poll(() => page.getByLabel('Nokia LCD image preview').evaluate((c: HTMLCanvasElement) => c.width)).toBe(width);
  }
});
