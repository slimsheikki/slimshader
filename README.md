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

### Heated image smudge brush

Enable **Smudge** above the image, then drag with mouse, pen, or touch. Brush size is measured in source pixels; strength controls color displacement with a soft radial falloff. Each gesture is one undoable stroke. **Undo smudge**, **Clear smudges**, effect reset, and image replacement manage the stroke history. Original comparison remains untouched. Strokes replay after the heat renderer at the chosen export scale, using premultiplied-alpha interpolation to avoid dark transparency fringes. Preview updates use the worker's newest-request queue. History is bounded (500 points per gesture; new strokes stop when history reaches 2,000 points) to limit replay cost. Large brushes and long histories may take longer to export.

### Varied painterly marks

Painterly Toon now paints in three passes: broad angular underpainting, medium flats/dabs/rounded strokes, then selective fine accents. Large strokes avoid strong image gradients and small accents concentrate near detail. **Stroke shape**, **Size variety**, **Broad paint patches**, and **Fine detail strokes** control the mixture. Irregular chisel-ended polygons provide the planar paint patches in the supplied references. Defaults use mixed strokes and less bristle noise. Source colors, outlines, seeded repeatability, and resolution-independent export remain supported.

## Blueprint Mosaic

`src/shaders/blueprint/` turns image luminance into a pixel-stepped silhouette filled with dots, outlined squares, crosses, and stippling over a blueprint grid. Controls cover cell size, silhouette threshold/inversion, brightness/contrast, pattern density, symbol scale/weight, grid visibility, colors, transparency, and seeded shuffle. Cutouts or contrasting backgrounds work best; it does not perform semantic background removal. Transparent mode removes the base fill while retaining the adjustable grid (set Grid visibility to zero to export only the subject). Geometry is drawn in source coordinates at every export scale. Tests verify control updates, exact 2× dimensions, reset, transparent image regions, and inversion.

## Grain Fade

`src/shaders/grain-fade/` combines soft-focus blur, local glow, saturation and seeded grain with a linear or radial fade mask. Linear controls include position and angle; radial controls include center and radius. Both support feather softness, amount and inversion. Fade into a chosen color or export true PNG transparency. Grain scale and blur radius use source pixels; masks use normalized image coordinates so exports retain the composition. Cutouts provide floating subjects; this filter does not remove photo backgrounds. Tests cover mask direction/inversion, radial controls, reset, exact 2× dimensions and exported alpha.

## Public hosting

The live app is hosted on GitHub Pages at https://slimsheikki.github.io/slimshader/. The `gh-pages` branch contains the production build. Build with `npm run build` and publish the contents of `dist` to that branch to update the public app.

### Glass Panels
Independent image-space glass renderer with panel count, slot coverage (width), rotation, offset, signed refraction, lens curvature, wavy distortion, frost, dispersion and edge lighting. Preview and PNG exports use normalized panel geometry and source-pixel blur. Transparent source images retain refracted alpha; zero glass amount preserves the original.

Glass Panels v2 adds subject distance, glass thickness, selective focus, fine bevel lighting, surface reflections, and bounded panel placement with draggable handles. Fine Flutes and Split Glass presets are included. The original v1 module is retained in `src/shaders/glass-legacy/`, is not registered, and is not included in the production app.

### Pinterest-inspired effects

Spectral Bloom builds radial highlight trails with separate color channels. Particle Field samples the source into reproducible scattered dots. Chromatic Contours isolates image edges with color separation and glow. Digital Streaks displaces short image slices into fragmented motion trails. Each has an independent renderer, controls, preview worker, and high-resolution export. The review history and duplicate checks are in `docs/pinterest-review-ledger.md`.

Flow Trails draws deterministic, tapered curves through an image-derived flow field; length, curvature, direction, density, spacing and source blend are adjustable. Iridescent Film approximates a pearlescent coating from smoothed image relief and adjustable light direction, film thickness, saturation and reflection strength. It does not infer true 3D geometry. Both retain the common upload/paste/drop and source-resolution export flow.

Luminous Dust turns image luminance into cool luminous ink with fine deterministic grain, soft focus, glow, shadow isolation, exposure/contrast, and an adjustable light color. Grain uses source coordinates so export scaling retains its size. Transparent input alpha is preserved when enabled; this is not automatic subject removal.

Living Geometry adds a looping image deformation with attached boxes, connecting lines, optional coordinate labels and source-colored drifting particles. Controls include independent image and tracking movement, loop duration (4–12 seconds), geometry density, line appearance and arrangement. Trackers lock onto image-derived landmarks, then retarget in quick bursts with seeded irregular timing. Snap sharpness controls the hold/transition balance, and Retargets per loop controls activity. Connecting lines reshape and tracking boxes move and resize around their groups; all schedules repeat cleanly for export. Source-image brightness selects anchor candidates; this is a 2D interpretation, not 3D reconstruction or object tracking. Preview runs up to 30 fps, pauses when hidden, and starts paused for reduced-motion preferences. PNG exports the current frame at the selected scale. Animation exports locally through the browser encoder (WebM, or MP4 where supported), up to 1280 px on the long side at 30 fps, with a solid background. Keep the tab visible during real-time recording; closing the editor cancels recording and releases its stream.

Living Geometry also exports looping GIFs locally in a dedicated worker using [gifenc](https://github.com/mattdesl/gifenc) (MIT). Select 480, 640, or 960 px on the long side (no upscaling); frames are rendered at exact 20 fps timestamps for the selected 4–12 second loop, without duplicating the end frame, and the GIF repeats forever. GIF uses a stable 256-color-or-smaller palette and the selected solid background. Progress and cancellation are available; closing or replacing the source cancels and terminates its worker. PNG scale settings remain independent. Tests decode the exported GIF to verify frame count, duration, changed frames and infinite looping, and verify cancellation alongside existing PNG/video exports.
