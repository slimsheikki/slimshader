# SLIM.SHADERS

A local-first image-effects library for designers. Includes procedural ASCII and cel-shaded Toon studios, built with React, Vite, TypeScript, and Canvas 2D. Images are processed on the device; there is no upload server.

## Run

Requires Node.js 22 or newer.

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. `npm run build` checks TypeScript and creates the production site in `dist/`; `npm run preview` serves that build. Deploy `dist/` to any static host.

## Use

Open the ASCII card, then upload, drop, or paste an image with Cmd/Ctrl+V. The empty editor also offers the same bundled sample used by the gallery. Choose character presets or enter Unicode strings such as `SLIMSHADERS`, `€`, and `●○`. Change size, detail, coverage, spacing, tones, edges, color, transparency, original-image opacity, and seeded variation. Original toggles a comparison; Reset restores all effect settings.

Export PNG at original dimensions, 2×, 4×, or a custom 0.1–8× scale. Export renders the same source-coordinate character grid directly at the requested pixel dimensions; it does not enlarge a preview or capture the UI. Transparent source pixels are preserved when the background is transparent. Each image is limited to 50 MB, 64 megapixels, and 16,384 pixels per side. Exports share the pixel limits; oversized requests display an actionable error. GIF/animated formats use the decoded still frame. SVG is deliberately not accepted.

## Architecture

- `src/shaders/registry.ts`: gallery module catalog.
- `src/shaders/ascii/model.ts`: typed parameters, defaults, presets, deterministic variation, and export sizing guards.
- `render.ts`: shared source-coordinate renderer for thumbnails, previews, and exports. It downsamples once to the character grid, estimates luminance and local edges, then draws Unicode glyphs with sampled alpha/color.
- `worker.ts` + `useRenderer.ts`: off-main-thread rendering via OffscreenCanvas, bounded preview queue that keeps the newest settings, stale-result handling, and a main-thread fallback. Preview is limited to 1,600 pixels on its longest side. Decoded images stay in memory until replaced/closed.
- `Controls.tsx` + `Editor.tsx`: ASCII-specific controls and editor workflow, including the accessible native modal, loading/error states, and export.

To add an effect, create `src/shaders/<effect>/` with its own parameter model, renderer, controls, and editor; register its gallery metadata and renderer in the catalog, then dispatch its card to its editor in `App.tsx`. Keep each effect's parameters independent. The catalog intentionally does not impose a universal parameter schema. An optional feature-detected WebMCP tool opens the same ASCII editor; unsupported browsers use the normal interface.

## Verification

```sh
npm test
```

Tests use installed Google Chrome through Playwright. They cover sample loading, upload, synthetic native drop/clipboard events, changing custom characters, reset, original comparison, invalid files, mobile sizing, keyboard dismissal/focus restoration, PNG dimensions, and preserved transparency. A native OS clipboard action is not automated. Set a different Playwright browser channel in `playwright.config.ts` if Chrome is unavailable.

## Sample image

Photo by [Liam Ward on Unsplash](https://unsplash.com/photos/a-black-and-white-photo-of-a-statue-of-a-man-EsIgdjc8Q80), used under the [Unsplash License](https://unsplash.com/license). The photograph is bundled as `public/sample.jpg`, so the sample and exports work without remote image requests. DM Sans is requested from Google Fonts with system-font fallbacks. User images are never sent to either service.

## Toon module

`src/shaders/toon/` owns a separate parameter model, controls, renderer, and worker. Toon smooths the source, quantizes luminance into 2–8 lighting bands, retains original hues or applies Sunset/Botanical/Graphic palettes, and adds adjustable Sobel ink edges. Smoothing and outline offsets scale with the export dimensions. It shares the gallery sample and supports upload/drop/paste, source comparison, transparent PNG, and original/2×/4×/custom exports. Browser tests cover palette updates, bands/reset, original comparison, PNG dimensions, and alpha preservation.

## Painterly Toon brushwork

Toon is now **Painterly Toon**, inspired by the surface treatment demonstrated in [SouthernShotty’s reference](https://www.youtube.com/watch?v=AVf8bPOulkI). This is a 2D procedural interpretation, not a Blender material or a 3D lighting simulation. The renderer layers curved, source-colored strokes oriented along image gradients, with deterministic position/length/color variation and fine bristle strands. Cel-shaded ink is composited above the paint so brushwork does not erase outlines. Controls include paint amount, brush size, bristle texture, paint variation, contour following, and pattern shuffle. Stroke geometry and random seeds are measured in source pixels and redrawn at export resolution. Setting paint amount to zero restores the clean cel-shaded look.

## Storyboard Sketch

`src/shaders/storyboard/` is a dedicated grayscale concept/storyboard effect. It combines luminance contours, stepped gray washes, shadow-dependent pencil hatching and crosshatching, irregular graphite marks, and subtle paper grain. Controls include pencil strength/width/roughness, edge threshold, gray wash, value steps, hatch strength/spacing/angle, crosshatching, brightness, contrast, grain, and texture shuffle. Transparent paper exports graphite marks alone; opaque mode composites onto neutral paper. All output channels remain grayscale, and marks are evaluated in source coordinates for full-resolution PNG export. Browser tests verify grayscale, tonal range, changing controls, 2× dimensions, reset/focus restoration, and transparent graphite export.

## Heated Shapes

`src/shaders/heated/` implements original procedural thermal forms inspired by the visual direction of [Heated Shapes](https://shaders.com/collection/heated-shapes). No third-party shader implementation or paid assets are included. Capsule, orb, ring, and ribbon forms use analytic distance fields, directional hot rims, violet-to-yellow thermal colors, halos, and cyan fringes. The editor opens with a ready shape; uploading an image switches to luminance-based image heat-map mode. Controls cover shape size/rotation, flow distortion/position, heat, rim width, glow, fringe, lighting, and background/transparency. Flow position selects a still composition; animation/video export is not implemented. Export evaluates the field at the requested resolution. Tests cover shape changes/reset, exact 2× PNG dimensions, transparent halo output, image mode, and clearing comparison when returning to procedural forms.

## Heated Shader (images)

The separate `heated-image` module opens into image upload/drop/paste rather than a generated form. It maps source luminance to violet, magenta, orange, and yellow heat colors, uses image contours for directional hot rims and spectral fringes, and blends local bloom from a blurred luminance field. Controls include heat intensity, rim width, halo, fringe, lighting, and background/transparency. It preserves source alpha when transparent and supports original-image comparison and full-resolution exports. Heated Shapes remains the separate procedural generator.
