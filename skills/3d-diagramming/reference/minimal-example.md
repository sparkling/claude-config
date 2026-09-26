# Minimal runnable example

A complete, self-contained 3D linked-data graph in one HTML file. **No build step.** Save as `graph.html` and open it in a browser (a local server is only needed if you later fetch a SPARQL endpoint that enforces CORS — for this inline-data example, `file://` works).

Every API used here is verified against the [3d-force-graph README](https://github.com/vasturiano/3d-force-graph), the [three-spritetext README](https://github.com/vasturiano/three-spritetext), and the opda engine `force-graph-3d.js`.

It loads the libraries the way AtomGraph/3D-Linked-Data does — pinned UMD script tags exposing `ForceGraph3D` and `SpriteText` as globals — so it uses the **`new ForceGraph3D(el)`** constructor form documented in the upstream README. (For the curried `+esm` factory form — verified working in the `@1 +esm` build by opda's engine but not in the README — see the note at the bottom.)

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>3D linked-data graph — minimal</title>
  <style>
    html, body { margin: 0; height: 100%; background: #0b0f14; }
    #graph { width: 100vw; height: 100vh; }
    /* Fallback for no-JS / no-WebGL — always ship one. */
    .fallback { color: #cfd8dc; font: 14px/1.5 system-ui, sans-serif; padding: 1rem; }
  </style>

  <!-- Pinned UMD builds (AtomGraph's loading approach). three.js first; then
       3d-force-graph (which uses it); then three-spritetext. These expose the
       globals `ForceGraph3D` and `SpriteText`. -->
  <script src="https://unpkg.com/three@0.159.0/build/three.min.js"></script>
  <script src="https://unpkg.com/3d-force-graph@1.73.3/dist/3d-force-graph.min.js"></script>
  <script src="https://unpkg.com/three-spritetext@1.8.2/dist/three-spritetext.min.js"></script>
</head>
<body>
  <div id="graph">
    <noscript class="fallback">
      This 3D graph needs JavaScript and WebGL. Equivalent data as a list:
      Person → worksFor → Organisation; Person → knows → Person; Document → about → Person.
    </noscript>
  </div>

  <script>
    // --- 1. The graph in {nodes, links} shape. ----------------------------
    // In a real app these come from RDF/SPARQL (see reference/data-ingestion.md);
    // here they are inline so the file runs with zero setup. `id` is the node
    // key; each link's source/target MUST match a node id.
    const data = {
      nodes: [
        { id: 'http://ex.org/alice', label: 'Alice',      type: 'Person' },
        { id: 'http://ex.org/bob',   label: 'Bob',        type: 'Person' },
        { id: 'http://ex.org/acme',  label: 'ACME Ltd',   type: 'Organisation' },
        { id: 'http://ex.org/doc1',  label: 'Report 2026', type: 'Document' },
      ],
      links: [
        { source: 'http://ex.org/alice', target: 'http://ex.org/acme',  label: 'worksFor', directed: true },
        { source: 'http://ex.org/bob',   target: 'http://ex.org/acme',  label: 'worksFor', directed: true },
        { source: 'http://ex.org/alice', target: 'http://ex.org/bob',   label: 'knows',    directed: false },
        { source: 'http://ex.org/doc1',  target: 'http://ex.org/alice', label: 'about',    directed: true },
      ],
    };

    // Colour by rdf:type-like class. (Borrow the Cagle palette from the
    // `diagramming` skill's 09-STYLING-GUIDE.md for semantic colours.)
    const COLORS = { Person: '#4FC3F7', Organisation: '#81C784', Document: '#FFB74D' };
    const colorFor = n => COLORS[n.type] || '#B0BEC5';

    // --- 2. Highlight state for click-to-focus a neighbourhood. -----------
    let hiNodes = null, hiLinks = null;   // null = nothing focused
    const dim = 'rgba(127,127,127,0.12)';

    // --- 3. Instantiate (UMD global → constructor form) + set accessors. --
    const el = document.getElementById('graph');
    const fg = new ForceGraph3D(el)
      .backgroundColor('#0b0f14')
      .graphData(data)
      .nodeId('id')
      .nodeVal(n => (n.type === 'Person' ? 4 : 2))
      .nodeRelSize(4)
      .nodeLabel(n => n.label)                       // hover tooltip
      .nodeColor(n => (hiNodes && !hiNodes[n.id]) ? dim : colorFor(n))
      .nodeThreeObject(n => {                        // in-scene text label
        const s = new SpriteText(n.label);
        s.color = (hiNodes && !hiNodes[n.id]) ? dim : '#e6e6e6';
        s.textHeight = 4;
        return s;
      })
      .nodeThreeObjectExtend(true)                   // label sits on the sphere
      .linkColor(l => (hiLinks && !hiLinks[l.__id]) ? 'rgba(127,127,127,0.05)' : 'rgba(160,160,160,0.6)')
      .linkWidth(1)
      .linkLabel(l => l.label)                       // hover tooltip on edges
      .linkDirectionalArrowLength(l => l.directed ? 3 : 0)
      .linkDirectionalArrowRelPos(1)
      .onNodeClick(node => focus(node))
      .onBackgroundClick(() => unfocus());

    // Give links a stable id so the highlight set can reference them
    // (3d-force-graph swaps source/target to node objects after layout, and
    // links carry no id of their own).
    fg.graphData().links.forEach((l, i) => { l.__id = i; });

    // --- 4. Focus / unfocus. ---------------------------------------------
    function focus(node) {
      hiNodes = {}; hiLinks = {};
      hiNodes[node.id] = true;
      fg.graphData().links.forEach(l => {
        const s = typeof l.source === 'object' ? l.source.id : l.source;
        const t = typeof l.target === 'object' ? l.target.id : l.target;
        if (s === node.id || t === node.id) {
          hiLinks[l.__id] = true;
          hiNodes[s] = true; hiNodes[t] = true;
        }
      });
      repaint();
    }
    function unfocus() { hiNodes = null; hiLinks = null; repaint(); }

    // Re-feed the same accessors to force a repaint after changing state.
    function repaint() {
      fg.nodeColor(fg.nodeColor())
        .nodeThreeObject(fg.nodeThreeObject())
        .linkColor(fg.linkColor());
    }
  </script>
</body>
</html>
```

## What you should see

Four coloured spheres with floating labels, connected by lines — directed edges (`worksFor`, `about`) carry an arrowhead at the target; `knows` is undirected (no arrow). Drag the background to rotate, scroll to zoom, drag a node to reposition. Click a node to dim everything except its immediate neighbourhood; click empty space to restore.

## Swapping the curried `+esm` form

To load via ES modules instead of script tags (opda's approach — good for lazy-loading in a static-site island), replace the three `<script src=...>` tags and the `new ForceGraph3D(el)` line with the below. Note the curried `ForceGraph3D()(el)` call is the form opda's committed engine uses on the `@1 +esm` build; it is not in the upstream README, so pin your version and confirm the build still exports a callable factory:

```html
<script type="module">
  const ForceGraph3D = (await import('https://cdn.jsdelivr.net/npm/3d-force-graph@1/+esm')).default;
  const SpriteText   = (await import('https://cdn.jsdelivr.net/npm/three-spritetext@1/+esm')).default;
  // ...then the SAME body, but instantiate with the curried factory form:
  const fg = ForceGraph3D()(el)/* .backgroundColor(...).graphData(data)... */;
</script>
```

Everything else (accessors, focus logic, repaint) is identical — the `+esm` build bundles three.js, so you drop the separate `three` import. The opda `force-graph-3d.js` is a production instance of exactly this form.
