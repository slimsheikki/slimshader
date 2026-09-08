# Pinterest shader review ledger

Board: https://fi.pinterest.com/slimsheikki/slimshaders/

## Review — 2026-09-08

The signed-out board reports **14 pins**, but exposes **13 thumbnail tiles** before the “More like this” recommendations. All 13 tiles were visually inspected in the board screenshot. Recommendations were excluded. The fourteenth pin is **unreviewed / not exposed**; revisit on the next check. The user explicitly permits thumbnail-only interpretation. Pinterest's sign-in prompt prevented canonical pin-page identification; the observed thumbnail asset hashes below are fallback identities, **not Pinterest pin IDs**. If image URLs change, compare the visual descriptions before treating an item as new. No reference artwork is bundled in the app.

### Three duplicate checks

1. **Reference identity and grouping:** distinct observed thumbnail hashes; grouped shared visual mechanisms (particles, spectral edges, heat, fade, fragment trails). Hash uniqueness alone does not prove different effects.
2. **Existing implementation coverage:** inspected registry and renderers for ASCII, Painterly Toon, Storyboard Sketch, Heated Shader, Blueprint Mosaic, Grain Fade, Glass Panels v2, hidden Glass v1, and removed Heated Shapes. Do not revive removed Heated Shapes. Compare effect, not subject or palette.
3. **Output comparison:** rendered the same David sample through all four candidates and their closest existing alternatives (Grain Fade, ASCII, Heated Shader, Glass Panels). Candidate outputs exhibit distinct spatial operations: radial light accumulation, stochastic scattered points, luminance-gradient-only outlines, and independently displaced horizontal fragments. Existing defaults/controls do not reproduce these operations. Candidates were also compared against one another. Full-resolution synthetic inputs verified parameter response, transparent output and real 2x PNG dimensions.

### Thumbnail decisions

The hash identifies the last component of the observed `https://i.pinimg.com/236x/.../<hash>.jpg` thumbnail URL.

| Thumbnail hash | Visible reference | Decision / matching effect | Confidence and limitation |
|---|---|---|---|
| b11bb4af168cb178273cfc11f8775e2f | White radial flower/star with spectral rays on black | New **Spectral Bloom** | High for radial bloom and color separation; original object shape is content |
| 103544abbfbc2160a6b3027ca68afc3d | Two pale butterflies with granular wings on black | Group into **Particle Field** | High for point/grain treatment; no separate butterfly shader |
| c7a2f3d671ac81a4458bc69caa64b3ad | Folded translucent petal/fan with warm and cool colors on a light background | **Needs clearer evidence**, no extra shader | Geometry may be photographed/rendered subject; cannot infer a unique image filter from the thumbnail |
| e02ba2214aec3a324cd87e49dcbb0f7b | Green cat formed from dense dots | Group into **Particle Field** | High for point sampling; color alone is not a new shader |
| cb37b3d42b386ab53b0f5997606d6208 | Dark head and shoulders visible mostly as prismatic outlines | New **Chromatic Contours** | High for luminous edge isolation; unlike full-surface thermal mapping |
| 52fef09f42af334aa1b74d925185f386 | Profile portrait with colored flowing point trails | Covered partially by Particle Field / Digital Streaks families; **compound trail treatment deferred** | Thumbnail suggests curved trajectories beyond simple scatter; do not claim exact reproduction or add a duplicate |
| 96323efbbe1b11a5512fe6f85cccae53 | Paired portraits dissolving into points | Group into **Particle Field**; existing Grain Fade for spatial fade | High for point dissolve; do not add a second particle shader |
| 18b4f65eed418bc41de1e43990bf5cac | Soft glowing ray-like silhouette on dark blue | Existing **Grain Fade** / new Spectral Bloom coverage | Medium; silhouette is content, glow/softness is not a new family |
| eac9af074806765a230b1f5646309c5a | Figure with bright iridescent/thermal surface | Existing **Heated Shader** family | Medium; no new shader for palette difference |
| 7d9672ea1f7c55b45df3a850db130e49 | Woman with split normal and false-color face | Existing **Heated Shader**, partial application is potential future refinement | High for thermal family; mask composition alone must not become a separate shader |
| cfbb35f808c916e4a233b7ecb878a090 | Side-profile face fragmented into colored horizontal streaks | New **Digital Streaks** | High for rectangular slice displacement; unlike smooth Glass Panels or smudge |
| b43e216eed1f88215359c11bf8eaa884 | Defocused standing silhouette with violet light halo | Existing **Grain Fade** family | Medium; atmosphere and color variation, not a distinct shader |
| ca7d48edcd696f3950f27129a17d71e5 | Pale dancer with horizontal fragment trails on black | Group into **Digital Streaks**; fine body texture not inferred | Medium; no separate dancer shader or unsupported 3D reconstruction |

### Implementation and validation

Four independent modules: `spectral-bloom`, `particle-field`, `chromatic-contours`, `digital-streaks`. Each owns its parameters and renderer; shared canvas setup utilities only. Existing upload/drop/paste and worker/export transport reused. Existing shaders retained; removed Heated Shapes stays unregistered. Particle locations and streak randomness use source-space coordinates and deterministic seeds. The current app has 11 active effects.

Validation: production build; `tests/board-shaders.spec.ts` (four effect/parameter/transparency/2x-export checks); visual comparison of all candidates and nearest existing effects. Publication status: published and verified on 2026-09-08 at https://slimsheikki.github.io/slimshader/. Source commit: `3a319cfb36de0ec881e86e4a6058e1dd4ddb2bf1`. GitHub Pages release commit: `bd56cd0297b6301c2c53666d37bd429c9474741c`. The live page serves the validated `index-C2IvL4By.js` bundle. Do not recreate these four effects on subsequent reviews.

### Next-review backlog

- Reconcile 14 reported pins with 13 exposed thumbnail tiles; do not mark missing pin reviewed.
- Revisit abstract petal and curved particle trails only if clearer thumbnails/evidence become available. Do not duplicate existing families to fill this backlog.
- Consider partial-image application as an improvement to Heated Shader if requested or repeatedly supported by new references.

## Follow-up — Flow Trails and Iridescent Film

The board subsequently reported 16 pins but still exposed the same 13 thumbnails; three pins remain unseen. User approved proceeding with the strongest proposed candidates. Silk Warp and Motion Echo remain exploratory and were not implemented.

- **Flow Trails** revisits thumbnail `52fef09f42af334aa1b74d925185f386`. Unlike the prior Particle Field, strands follow continuous curved paths in a shared vector field with image-edge steering, gradual taper, and fading opacity. Unlike Digital Streaks, it draws curves instead of rectangular source slices. This resolves the earlier deferred curved-trail family with an original image-based interpretation, not an exact recreation.
- **Iridescent Film** revisits thumbnail `eac9af074806765a230b1f5646309c5a`. Earlier it was grouped broadly with Heated Shader. This approved implementation uses image-derived surface relief and light/view-dependent channel interference rather than a thermal lookup. The distinction is functional: adjustable light direction, film thickness, relief, smoothing and pearl saturation. It is a stylized surface approximation, not recovered 3D scene geometry.
- Duplicate cross-checks: matched the existing thumbnail identities; reviewed nearest active renderers; compared both new effects against Particle Field and Heated Shader on the same David image. Neither reinstates a hidden or removed shader. Do not create either effect again in weekly reviews.
- Validation: production build and all six Pinterest-effect parameter/transparency/2x-PNG tests passed. Both outputs visually inspected. Published and verified on 2026-09-08 at https://slimsheikki.github.io/slimshader/. Source commit: `e6ab29476de7d863c3e30e35768254043325841b`. Pages release: `781a814a5fbae3cd89a8b105daa508db02991ce0`. Live bundle: `index-1AQCh7of.js`. The gallery now has 13 active effects.

## Direct reference — Luminous Dust (2026-09-08)

User supplied a close-up reference of pale blue-white grainy butterflies on black and explicitly requested a shader. Added `luminous-dust`: continuous luminance-based luminous ink with stochastic granular modulation and a soft halo, rather than Particle Field's separately positioned dots. Compared both on the shared sample; the new effect retains continuous light masses. Existing Grain Fade's spatial dissolve is not duplicated. Controls cover exposure, contrast, shadow cutoff, soft focus, dust amount/size/seed, glow, light color and background/alpha. Build and targeted parameter/transparency/2x-export browser test passed; visual comparison inspected. Registered as the 14th active effect. Future board reviews should consider this reference covered.

## Direct reference — Living Geometry (2026-09-08)

User approved an original animated image interpretation of SARES's Cadere preview at https://seditionart.com/artworks/214039. Added `living-geometry`, the 15th active effect: a shared periodic deformation moves the image and image-derived anchor points; boxes, connecting lines, coordinate labels and orbiting particles follow that motion. Distinct from Flow Trails' static strands, Particle Field's point rendering and Digital Streaks' rectangular displacement. No reference artwork assets bundled. Production build and browser test passed for animation, pause, changed box count, 2x PNG dimensions, and recorded video decoding/playback at 1280×854 for the sample. Final output visually inspected; tiled deformation seams corrected before publication. Video export uses the browser's available WebM/MP4 encoder and a solid background; full 3D subject rotation is outside this image-based effect.

### Living Geometry motion correction

The user found the initial graphics too static compared with the reference. Decoupled tracker travel from subtle image deformation. Independently phased closed curves now move nodes between source-image landmarks; lines reshape with these nodes, and boxes track smooth group centers/extents instead of barely shifting fixed corners. Added Tracking movement separately from Image movement. Tests verify meaningful travel with image motion disabled, seamless trajectory closure, zero travel at zero tracking, and working pause/PNG/video exports. Compared rendered frames at 0, 2 and 4 seconds visually.

### Living Geometry technical motion revision

User requested more random, snappy, technical movement. Replaced continuous curved tracker travel with seeded irregular hold/retarget schedules. Groups of four trackers acquire new image landmarks together, with independently timed group bursts and brief eased transitions. Default sharpness 85 and eight retargets per loop. Added Snap sharpness and Retargets per loop controls; original image movement remains separate. All three Living Geometry tests passed, including stable holds for most frames, meaningful jumps, deterministic random patterns, closed loops, pause, PNG and playable video export.

### Living Geometry looping GIF export

Added worker-based local GIF export with infinite repeat metadata, exact 20 fps sampling, selected loop duration, 480/640/960 px maximum long-side sizes, stable palette, solid background, progress and cancellation. No new shader family. Build and all five Living Geometry tests passed, including GIF decoding, 80 frames for a four-second loop, exact frame delays, infinite repeat, visibly different frames and cancellation, plus previous PNG/video and tracking-motion checks.
