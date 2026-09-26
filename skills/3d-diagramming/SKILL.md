---
name: 3d-diagramming
description: Build interactive 3D linked-data / knowledge-graph visualisations with 3d-force-graph (three.js + three-spritetext), after AtomGraph/3D-Linked-Data. Use when RDF/ontology/SPARQL data forms a large, densely interconnected graph that benefits from spatial 3D layout, force-directed exploration, focus/neighbourhood interaction and in-browser navigation — NOT for flowcharts, sequences, ER, class or other authored/static diagrams (use the `diagramming` skill for those). Covers getting RDF/SPARQL/RDF-XML into the {nodes, links} shape, rendering nodes + sprite labels + directional edges, theming, camera/interaction, accessibility/performance caveats, and embedding in a static site (e.g. Astro).
allowed-tools: Read, Write, Edit, WebFetch, Bash
---

# 3D Linked-Data Diagramming

Produce an interactive **3D force-directed graph** of RDF / linked-data / knowledge-graph data, rendered in WebGL via [`3d-force-graph`](https://github.com/vasturiano/3d-force-graph) (Vasco Asturiano), with [`three.js`](https://threejs.org/) as the 3D engine and [`three-spritetext`](https://github.com/vasturiano/three-spritetext) for camera-facing node labels. This is the stack of [AtomGraph/3D-Linked-Data](https://github.com/AtomGraph/3D-Linked-Data) and of the verified worked example in this machine's opda repo at `/Users/henrik/source/opda/public/ui/graph-engines/force-graph-3d.js`.

The job is always the same shape: **get the graph into `{ nodes: [...], links: [...] }`, instantiate the engine on a DOM element, set accessors (id / label / colour / size / link arrows), wire interaction, theme, embed.** Everything below is the procedure for doing that without inventing APIs.

## When to use (vs the `diagramming` skill)

| Situation | Use |
|---|---|
| Large, densely interconnected RDF / ontology / knowledge graph; user wants to **explore** it (rotate, zoom, focus a node's neighbourhood, click through to a resource) | **this skill** — 3D force-graph |
| Hundreds of nodes where a flat 2D layout is unreadable and spatial separation helps | **this skill** |
| A specific, authored structure: flowchart, sequence, ER, class, state, Gantt, architecture | **`diagramming`** skill (Mermaid/DOT) |
| A *small* RDF/ontology fragment you want as a clean, static, print/GitHub-renderable picture | **`diagramming`** skill → its `17-LINKED-DATA-GUIDE.md` (Mermaid) or `19-DOT-GRAPHVIZ-GUIDE.md` (DOT) |
| Property graph / Neo4j model as a static diagram | **`diagramming`** skill → `18-PROPERTY-GRAPH-GUIDE.md` |

**Decision rule.** 3D is justified by **scale + interactivity + interconnection**, not by topic. RDF alone does not call for 3D — a 12-triple example is clearer as a Mermaid `flowchart LR` (the `diagramming` skill). Reach here when the graph is big enough that a static 2D render is a hairball *and* the user will benefit from manipulating it. When unsure, say so and offer both. There is no contradiction with `diagramming`: that skill owns authored/static diagrams (incl. small RDF); this skill owns interactive 3D graphs of data. Cross-reference, don't duplicate.

**Trade-offs to state up front (do not hide these — see `reference/caveats.md`):**

- A 3D WebGL graph is **not accessible** to screen readers and **not** a static asset — it needs a browser, a GPU, and JavaScript. Always ship a non-interactive equivalent (a typed list/table, or a 2D Mermaid/DOT render) as the fallback. The opda page does exactly this via `<noscript>` and per-type index pages.
- Label legibility and frame rate **degrade with node count**. Sprite labels are readable into the low thousands of nodes; beyond that, drop labels to hover-only and consider 2D.

## The stack (verified)

| Layer | Library | Role | Verified source |
|---|---|---|---|
| Graph engine | `3d-force-graph` | Force-directed 3D layout + WebGL render + interaction | AtomGraph README pins **v1.73.3**; opda imports `3d-force-graph@1` |
| 3D engine | `three.js` | WebGL scene/camera/renderer (a dependency of 3d-force-graph) | AtomGraph loads **three@0.159.0**; bundled into 3d-force-graph's `+esm` build |
| Labels | `three-spritetext` | Canvas→sprite text that always faces the camera | AtomGraph pins **v1.8.2**; opda imports `three-spritetext@1` |

Two ways to load these — both verified, use the one that fits the host:

- **Script-tag / UMD** (AtomGraph's approach; simplest for a single HTML file):
  ```html
  <script src="https://unpkg.com/three@0.159.0/build/three.min.js"></script>
  <script src="https://unpkg.com/3d-force-graph@1.73.3/dist/3d-force-graph.min.js" defer></script>
  <script src="https://unpkg.com/three-spritetext@1.8.2/dist/three-spritetext.min.js"></script>
  ```
  This exposes `ForceGraph3D` and `SpriteText` as globals. (The upstream README also shows `//cdn.jsdelivr.net/npm/3d-force-graph` — same library, either CDN works.)

- **ES-module / `+esm`** (opda's approach; for static-site islands that lazy-load):
  ```js
  const ForceGraph3D = (await import('https://cdn.jsdelivr.net/npm/3d-force-graph@1/+esm')).default;
  const SpriteText   = (await import('https://cdn.jsdelivr.net/npm/three-spritetext@1/+esm')).default;
  ```
  The `+esm` build bundles three.js, so you do **not** import three separately in this path.

**Pin versions in production.** `@1` floats to the latest 1.x; AtomGraph pins exact patch versions for reproducibility. Prefer exact pins (`3d-force-graph@1.73.3`) when the page must not change under you.

## Instantiation — two forms, different provenance (do not conflate)

The two forms are NOT equally blessed — be precise about which is documented:

- **Constructor form** — *documented in the current upstream README*; use this for new work, especially with the UMD/script-tag global:
  ```js
  const Graph = new ForceGraph3D(document.getElementById('graph')).graphData(data);
  ```

- **Curried-factory (Kapsule) form** — *not in the current README*, but verified working in the `@1 +esm` jsdelivr build by opda's committed engine (`force-graph-3d.js` line 50, commit `ddd723e`, 2026-06-17):
  ```js
  const Graph = ForceGraph3D()(container).graphData(data);
  ```

Pick the form your loader gives you: the UMD script-tag global takes `new ForceGraph3D(el)` (the documented form); the `@1 +esm` default export is currently callable as `ForceGraph3D()(el)`, as the live opda engine proves. **If you use the curried form, confirm it against the exact version you pin** — the README authority is the constructor, and a future `+esm` build could drop the callable factory. When unsure which a given version exposes, `WebFetch` that version's README/example rather than guessing.

## Procedure

### Step 1 — Decide 3D is right

Run the *When to use* check above. If the graph is small or the user wants a static picture, hand off to the `diagramming` skill and stop. If it's a big interactive RDF/knowledge graph, continue.

### Step 2 — Get the data into `{ nodes, links }`

This is the load-bearing step and where RDF meets the renderer. The target shape (verified against the 3d-force-graph README) is:

```js
{
  nodes: [ { id: "iri-or-key", name: "label", val: 1 /* + your fields: type, color… */ }, … ],
  links: [ { source: "subject-id", target: "object-id" /* + label, kind… */ }, … ]
}
```

`source`/`target` reference node `id`s (string match). If your link fields are named something other than `source`/`target`, remap them with the `linkSource('myField')` / `linkTarget('myField')` accessors (both verified README methods; defaults `source`/`target`). **Every `source`/`target` must resolve to a node `id`** or that link silently won't render.

Two ingestion routes — see **`reference/data-ingestion.md`** for the full, copy-pasteable patterns:

- **SPARQL → `{nodes, links}`** (recommended for triplestore-backed data; this is the opda lineage). A `SELECT ?s ?sLabel ?p ?o ?oLabel` over your endpoint maps row-by-row to one link plus its two endpoint nodes; a `CONSTRUCT` of the sub-graph you want to show, then a small reducer over the triples, does the same. Concrete query + JS reducer in the reference.
- **RDF document → `{nodes, links}`** (AtomGraph's actual pipeline). AtomGraph/3D-Linked-Data reads **RDF/XML** (only `application/rdf+xml`; Turtle/JSON-LD/N-Triples are explicitly **not** supported) and converts it **client-side with XSLT 3.0 (SaxonJS)** — subjects become nodes (`id` = resource URI, `label` from `rdfs:label`/`foaf:name`/`dct:title`/URI fragment, `color` a deterministic HSL hash of `rdf:type`), and properties with resource objects become links (`source`=subject, `target`=object, `label`=property). If you instead have Turtle/JSON-LD, parse it with an RDF library (e.g. N3.js / rdflib) and run the same node/link reduction in JS — see the reference.

The opda engine itself adapts an upstream **Cytoscape-shaped** model (`{ data: { id, … } }`) into `{nodes, links}` at mount (`force-graph-3d.js` lines 56–62) — proof that whatever your source shape, the only contract the engine cares about is `{nodes, links}` with id-matched `source`/`target`.

### Step 3 — Instantiate and set accessors

Create the graph on a sized container and set the accessors you need. Every method below is verified (3d-force-graph README and/or opda `force-graph-3d.js`):

```js
const fg = ForceGraph3D()(container)          // or: new ForceGraph3D(container)
  .width(container.clientWidth || 800)
  .height(container.clientHeight || 600)
  .backgroundColor('#0b0f14')                 // theme the WebGL canvas
  .graphData(data)
  .nodeId('id')                               // default 'id'
  .nodeVal(n => n.type === 'class' ? 6 : 1)   // drives sphere size
  .nodeRelSize(4)                             // volume per val unit (default 4)
  .nodeLabel(n => n.label)                    // hover tooltip (HTML string)
  .nodeColor(n => colorFor(n))                // sphere colour
  .linkColor(() => 'rgba(160,160,160,0.5)')
  .linkWidth(1)                               // default 0
  .linkDirectionalArrowLength(l => l.directed ? 3 : 0)  // arrowheads for directed edges
  .linkDirectionalArrowRelPos(1)              // arrow at the target end
  .onNodeClick(n => { focus(n); openResource(n); })
  .onBackgroundClick(() => unfocus());
```

For **text labels in the 3D scene** (not just hover tooltips), attach a `SpriteText` via `nodeThreeObject` and keep the default sphere with `nodeThreeObjectExtend(true)` (verified in opda lines 74–80):

```js
fg.nodeThreeObject(n => {
    const s = new SpriteText(n.label);
    s.color = '#e6e6e6';
    s.textHeight = n.type === 'class' ? 6 : 4;
    return s;
  })
  .nodeThreeObjectExtend(true);               // sprite sits ON the sphere, not replacing it
```

### Step 4 — Interaction: focus a neighbourhood (optional but recommended)

The signature interaction for exploring a graph is **click a node → dim everything except it and its neighbours**. The opda engine implements this (lines 98–114) by maintaining a highlight set and re-reading the accessors to force a repaint:

- On `onNodeClick`, walk `fg.graphData().links`, collect the clicked node + its neighbours and the connecting links into highlight sets, then call `fg.nodeColor(fg.nodeColor()).linkColor(fg.linkColor())` to repaint (re-feeding the *same* accessor forces a refresh).
- Your `nodeColor`/`linkColor`/`nodeThreeObject` accessors check the highlight set and return a dimmed colour (e.g. `rgba(127,127,127,0.12)`) for non-highlighted elements.
- `onBackgroundClick` clears the sets and repaints.

Note: after layout, 3d-force-graph **replaces** each link's `source`/`target` string with the actual node object. So in interaction handlers read `typeof l.source === 'object' ? l.source.id : l.source` (opda lines 102–104). Tag links with a stable id first (`links.forEach((l,i) => l.__id = i)`) so a highlight set can reference them — they have no id of their own.

Camera helpers (verified): `cameraPosition({x,y,z}, lookAt, ms)` to move/animate the camera; `zoomToFit(ms, px)` to frame all nodes.

### Step 5 — Theme

Light/dark theming is three calls (opda `setTheme`, lines 119–124):

1. `fg.backgroundColor(newBg)` — repaints the WebGL scene background.
2. Re-feed `nodeColor`/`linkColor` accessors to recolour spheres/edges for the new palette.
3. Re-feed `nodeThreeObject` so `SpriteText` labels rebuild with the new text colour (sprites are baked to a texture at creation; they don't recolour live).

Drive colours from a single palette object so re-theming stays uniform. For colour *meaning* (class vs instance vs literal, status, etc.), borrow the Cagle semantic palette documented in the `diagramming` skill's `09-STYLING-GUIDE.md` rather than inventing colours — but apply them as plain hex strings here (this is WebGL, not Mermaid; there are no `classDef`s).

### Step 6 — Embed + ship the fallback

For a static site (Astro/SSG), the verified pattern is opda's `graph.astro` + `force-graph-3d.js`:

- A sized container `<div>` plus an island script that **lazy-loads** the libraries from CDN on the client (`await import(...+esm)`), so the page stays pure SSG with no server.
- Under a view-transition router (Astro `ClientRouter`), mount on `astro:page-load` and tear down the previous instance to avoid double-mounts (opda stores the handler on `window` and removes it on re-run; the engine's `destroy()` calls `fg._destructor()` to release the WebGL context — opda lines 128–133). Note `_destructor()` is an underscore-prefixed *internal*, not a documented public method; opda guards it (`if (fg._destructor) … else fg.pauseAnimation()`), and `pauseAnimation()` (documented) is the safe public fallback.
- **Always** provide the non-interactive equivalent: a `<noscript>` block and/or typed index pages (opda links to `/ontology/classes`, `/ontology/vocabularies`, `/ontology/shapes`). The 3D graph is an enhancement, not the only way to read the data.

A complete, runnable, single-file HTML example (no build step) is in **`reference/minimal-example.md`** — copy it, open it in a browser, and you have a rendered 3D graph.

## Verify before you ship

- [ ] Data is `{ nodes, links }`; every link `source`/`target` matches a node `id` — a dangling endpoint makes that edge **silently not render** (no error).
- [ ] Library URLs resolve (open them / check the network tab) and versions are pinned for production — a 404/blocked CDN means the global is undefined and **nothing renders**.
- [ ] Instantiation form matches the build you loaded (`new ForceGraph3D(el)` for the UMD global; `ForceGraph3D()(el)` for the `@1 +esm` default).
- [ ] Container has a non-zero width/height — a collapsed flex/grid cell **renders blank with no error**; pass explicit `.width()/.height()` if in doubt.
- [ ] Labels legible at the expected node count; if not, hover-only labels or hand off to 2D.
- [ ] No WebGL context? Headless/old/locked-down browsers may have none — the canvas is **blank silently**; detect and fall back.
- [ ] A non-interactive fallback exists (`<noscript>` + typed list, or a 2D `diagramming` render).
- [ ] On an SPA/view-transition host, the previous instance is destroyed on navigation (no leaked WebGL contexts).
- [ ] Every API you used traces to the 3d-force-graph README, three-spritetext README, or `force-graph-3d.js`. If you reached for a method not in those, verify it with `WebFetch` on the upstream README first.

## Reference files

- **`reference/minimal-example.md`** — a complete, self-contained runnable HTML+JS 3D graph (copy-paste, open in browser).
- **`reference/data-ingestion.md`** — RDF/SPARQL/RDF-XML → `{nodes, links}`: a SPARQL SELECT pattern + JS reducer, a CONSTRUCT pattern, Turtle-via-N3.js, and AtomGraph's RDF/XML+XSLT pipeline described accurately.
- **`reference/atomgraph-anatomy.md`** — what AtomGraph/3D-Linked-Data actually is (file tree, XSLT pipeline, RDF/XML-only limitation, build/run), and how it differs from a SPARQL-fed graph, so claims about it stay accurate.
- **`reference/caveats.md`** — accessibility, performance/node-count, label legibility, WebGL/GPU and CDN/offline caveats in depth.
- **`reference/REVIEW.md`** — the adversarial review of this skill + the final soundness/completeness checklist.

## Adjacent skills

- **`diagramming`** — authored/static diagrams (Mermaid/DOT), including small RDF/ontology fragments, property graphs, and the Cagle colour palette. The clean boundary: `diagramming` = static/authored (any size of authored structure, small data); `3d-diagramming` = interactive 3D of large data.
- **`sparql`** / **`shacl`** / **`skos`** / **`owl`** — for writing the queries/shapes/vocabularies whose results this skill visualises.
