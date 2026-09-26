# Caveats — accessibility, performance, WebGL, offline

State these honestly when proposing a 3D graph. A 3D WebGL visualisation is an *enhancement*, never the only way to read the data.

## Accessibility

- **Screen readers cannot read a WebGL canvas.** The graph is pixels; nodes/edges are not in the accessibility tree. This is the same reason the `diagramming` skill bans ASCII art — but a 3D canvas is *worse* than a static SVG/PNG because it has no text alternative at all.
- **Always ship a non-interactive equivalent**: a `<noscript>` block describing the data, and/or typed HTML lists/tables of the same nodes and relationships. opda's `graph.astro` does both — a `<noscript>` and links to `/ontology/classes`, `/ontology/vocabularies`, `/ontology/shapes`. Give the container `role="img"` and a meaningful `aria-label` that points to the fallback.
- **No keyboard interaction** out of the box — focus/zoom/rotate are mouse/touch. Keyboard users rely on the fallback. Don't claim keyboard accessibility you haven't built.
- 3D motion (auto-rotation, physics jitter) can trigger vestibular discomfort; respect `prefers-reduced-motion` (e.g. pause the layout/animation) if you add auto-motion.

## Performance / node count

- 3d-force-graph runs a **force simulation every frame** and renders via WebGL. Cost grows with nodes **and** edges (the layout is the bottleneck before the GPU is).
- **Rules of thumb** (not hard limits — depends on GPU, edge density, whether labels are on):
  - Up to ~1–2k nodes: generally smooth with sprite labels on.
  - ~2k–10k: drop in-scene `SpriteText` labels (use hover-only `nodeLabel`), simplify `nodeThreeObject`, consider freezing the layout after it settles (`pauseAnimation()` once stable, or cool the simulation).
  - 10k: reconsider 3D. Pre-compute layout, aggregate/cluster nodes, or fall back to a 2D engine. A graph that won't fit on screen legibly isn't helped by a third dimension.
- **`nodeThreeObject` is per-node work.** A `SpriteText` per node is a canvas + texture each — fine in the hundreds, expensive in the tens of thousands. Sprites are baked at creation, so re-theming means rebuilding them (re-feed the accessor), which is another full pass.
- Tag-and-repaint focus (re-feeding accessors) re-runs the accessor for every node/link — cheap at small scale, another full pass at large scale. Acceptable for click interactions; don't do it per animation frame.

## Label legibility

- `three-spritetext` labels always face the camera (good) but **overlap** in dense regions and **shrink with distance** (a sphere far from the camera has an unreadable label). There is no automatic decluttering. Mitigations: shorter labels (URI fragment, not full IRI — see `frag()` in `data-ingestion.md`); larger `textHeight` for important node types; hover-only labels past a node-count threshold; let the user zoom (labels grow as the camera nears).

## WebGL / GPU

- Requires a **WebGL-capable browser and GPU**. Headless/locked-down environments, some CI browsers, and very old devices may have no WebGL context — the graph silently won't render. Detect and fall back where it matters.
- **WebGL contexts are a finite resource.** On SPA/view-transition navigation, destroy the previous instance (opda calls `fg._destructor()` in `destroy()`, lines 128–133) or you leak contexts and the browser eventually refuses new ones ("Too many active WebGL contexts").
- A **collapsed container** (zero width/height from a flex/grid cell that hasn't sized yet) renders nothing with no error. Ensure the container has real dimensions before/at mount, and pass explicit `.width()/.height()` (opda falls back to `container.clientWidth || 800`).

## Offline / CDN

- The verified examples **lazy-load from a CDN** (unpkg / jsdelivr). That means a network dependency at runtime and a privacy/availability consideration (the CDN sees the request; an outage breaks the graph).
- For offline, air-gapped, or privacy-sensitive deployments: vendor the libraries locally (download `3d-force-graph`, `three`, `three-spritetext` into your assets) instead of CDN imports. The API is identical; only the import path changes.
- **Pin versions** in production. `@1` floats to the latest 1.x and can change behaviour under you between deploys; AtomGraph pins exact patch versions (`3d-force-graph@1.73.3`, `three@0.159.0`, `three-spritetext@1.8.2`) for reproducibility.

## SPARQL endpoint CORS

- A browser fetch to a **third-party** SPARQL endpoint (Route A/B in `data-ingestion.md`) requires that endpoint to send `Access-Control-Allow-Origin` for your origin, or you route through a proxy (AtomGraph uses `corsproxy.io` for arbitrary RDF/XML URLs). Same-origin endpoints (your own Fuseki/QLever behind the same site) are unaffected. Don't promise live third-party endpoint loading without checking its CORS policy.
