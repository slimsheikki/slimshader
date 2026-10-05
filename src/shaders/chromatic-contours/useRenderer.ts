import { useEffect, useRef, useState, type RefObject } from 'react';
import type { ContourParams } from './model';
import { dimensions } from './model';
import { renderContours } from './render';

export function useRenderer(image: ImageBitmap | null, params: ContourParams, canvas: RefObject<HTMLCanvasElement | null>) {
  const worker = useRef<Worker | null>(null), generation = useRef(0), latest = useRef(0);
  const ready = useRef(false), frame = useRef(0), busy = useRef(false), pending = useRef(false);
  const exportJob = useRef<{ resolve: (blob: Blob) => void; reject: (error: Error) => void } | null>(null);
  const [rendering, setRendering] = useState(false), [error, setError] = useState('');
  const state = useRef({ image, params }); state.current = { image, params };
  function paint(bitmap: ImageBitmap) {
    const c = canvas.current;
    if (c) { c.width = bitmap.width; c.height = bitmap.height; c.getContext('2d')?.drawImage(bitmap, 0, 0); }
    bitmap.close();
  }
  function preview() {
    const { image: source, params: settings } = state.current;
    if (!source || !ready.current) return;
    if (worker.current && busy.current) { pending.current = true; return; }
    const scale = Math.min(1, 1600 / Math.max(source.width, source.height));
    const size = { width: Math.max(1, Math.round(source.width * scale)), height: Math.max(1, Math.round(source.height * scale)) };
    const id = ++latest.current; setRendering(true); setError('');
    if (worker.current) { busy.current = true; worker.current.postMessage({ id, kind: 'preview', params: settings, ...size }); }
    else if (canvas.current) {
      try { canvas.current.width = size.width; canvas.current.height = size.height; renderContours(canvas.current, source, settings); }
      catch (e) { setError((e as Error).message); }
      setRendering(false);
    }
  }
  useEffect(() => {
    const token = ++generation.current; ready.current = false; busy.current = false; pending.current = false; setRendering(!!image); setError('');
    worker.current?.terminate(); worker.current = null;
    exportJob.current?.reject(new Error('Image changed. Export again.')); exportJob.current = null;
    if (!image) return;
    if (typeof OffscreenCanvas !== 'undefined' && typeof Worker !== 'undefined') {
      const w = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' }); worker.current = w;
      w.onmessage = ({ data }) => {
        if (data.kind === 'export') {
          if (data.error) exportJob.current?.reject(new Error(data.error)); else exportJob.current?.resolve(data.blob);
          exportJob.current = null; return;
        }
        if (data.id === 0) { data.bitmap?.close(); return; }
        busy.current = false;
        if (pending.current) { pending.current = false; data.bitmap?.close(); preview(); return; }
        if (data.id !== latest.current) { data.bitmap?.close(); return; }
        if (data.error) setError(data.error); else paint(data.bitmap);
        setRendering(false);
      };
      w.onerror = () => { setError('The renderer stopped. Reload the image to try again.'); setRendering(false); exportJob.current?.reject(new Error('Export failed. Reload the image.')); exportJob.current = null; };
      void createImageBitmap(image).then(copy => {
        if (token !== generation.current) { copy.close(); return; }
        w.postMessage({ id: 0, kind: 'preview', image: copy, params: state.current.params, width: 1, height: 1 }, [copy]);
        ready.current = true; preview();
      }).catch(e => setError(e.message));
    } else { ready.current = true; preview(); }
    return () => { ++generation.current; worker.current?.terminate(); worker.current = null; ready.current = false; cancelAnimationFrame(frame.current); exportJob.current?.reject(new Error('Editor closed.')); exportJob.current = null; };
  }, [image]);
  useEffect(() => {
    cancelAnimationFrame(frame.current);
    // Coalesce slider input into one render per frame. Stale responses never paint.
    frame.current = requestAnimationFrame(preview);
    return () => cancelAnimationFrame(frame.current);
  }, [params]);
  async function exportPng(scale: number) {
    if (!image || !ready.current) throw new Error('Wait for the image to finish loading.');
    const size = dimensions(image.width, image.height, scale);
    if (exportJob.current) throw new Error('An export is already in progress.');
    if (worker.current) return new Promise<Blob>((resolve, reject) => {
      exportJob.current = { resolve, reject };
      worker.current!.postMessage({ id: -1, kind: 'export', params, ...size });
    });
    const c = document.createElement('canvas'); c.width = size.width; c.height = size.height;
    renderContours(c, image, params);
    return new Promise<Blob>((resolve, reject) => c.toBlob(blob=>{ c.width=1; c.height=1; blob ? resolve(blob) : reject(new Error('Export failed. Choose a smaller scale.')); }, 'image/png'));
  }
  return { rendering, error, exportPng };
}
