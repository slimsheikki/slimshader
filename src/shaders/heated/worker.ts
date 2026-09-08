/// <reference lib="webworker" />
import { renderHeated } from './render';
import type { HeatedParams } from './model';
let image: ImageBitmap | null = null;
self.onmessage = async ({ data }: MessageEvent<{ id: number; image?: ImageBitmap; params: HeatedParams; width: number; height: number; kind: 'preview' | 'export' }>) => {
  try {
    if (data.image) { image?.close(); image = data.image; }
    if (!image) throw new Error('Add an image first.');
    const canvas = new OffscreenCanvas(data.width, data.height);
    renderHeated(canvas, image, data.params);
    if (data.kind === 'export') {
      const blob = await canvas.convertToBlob({ type: 'image/png' });
      self.postMessage({ id: data.id, kind: data.kind, blob });
    } else {
      const bitmap = canvas.transferToImageBitmap();
      self.postMessage({ id: data.id, kind: data.kind, bitmap }, [bitmap]);
    }
  } catch (error) { self.postMessage({ id: data.id, kind: data.kind, error: error instanceof Error ? error.message : 'Rendering failed. Try a smaller image.' }); }
};
