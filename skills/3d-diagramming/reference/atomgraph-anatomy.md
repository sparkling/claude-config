# AtomGraph/3D-Linked-Data — what it actually is

Source of these facts: the repo's `README.md` and `CLAUDE.md` (default branch `main`), fetched during authoring. This file exists so any claim the skill makes about the upstream project stays grounded — **do not embellish beyond what is here.**

## One-line

A browser-based tool that visualises an **RDF/XML** document as an interactive **3D force-directed graph**, with *all* the RDF-to-graph logic written in **client-side XSLT 3.0** (SaxonJS), not JavaScript.

## Repository layout (verified)

```
3D-Linked-Data/
├── index.html                 # loads libs (UMD), boots SaxonJS.transform()
├── styles.css
├── generate-sef.sh            # compiles XSLT → SEF (run after any .xsl edit)
├── CLAUDE.md
├── README.md
├── lib/
│   └── SaxonJS3.js            # SaxonJS 3.0 runtime (MPL 2.0)
├── src/
│   ├── graph-client.xsl       # main: event handling, RDF loading, DOM
│   ├── 3d-force-graph.xsl      # graph init, node/link render, JSON conversion
│   ├── normalize-rdfxml.xsl   # 3-pass RDF/XML normalisation
│   └── merge-rdfxml.xsl       # document merge (ldh:MergeRDF mode)
└── dist/
    └── graph-client.xsl.sef.json   # compiled Saxon Export Format (executed)
```

## Stack + exact versions (verified from `index.html`)

| Library | Version | Loaded as |
|---|---|---|
| three.js | **0.159.0** | `https://unpkg.com/three@0.159.0/build/three.min.js` |
| 3d-force-graph | **1.73.3** | `https://unpkg.com/3d-force-graph@1.73.3/dist/3d-force-graph.min.js` (`defer`) |
| three-spritetext | **1.8.2** | `https://unpkg.com/three-spritetext@1.8.2/dist/three-spritetext.min.js` |
| SaxonJS | **3.0** | local `lib/SaxonJS3.js` |

`index.html` boots SaxonJS via `SaxonJS.transform()` pointed at `dist/graph-client.xsl.sef.json`. The actual `ForceGraph3D` instantiation lives inside the compiled XSLT (`src/3d-force-graph.xsl`), not in a visible `<script>` block — so the constructor-vs-curried question can't be read off `index.html`; treat the upstream 3d-force-graph README as the API authority (it shows `new ForceGraph3D(el)`).

## The pipeline (verified)

RDF/XML URL → CORS proxy (`https://corsproxy.io/?url=…`) → `ixsl:http-request()` (pool `xml`) → 3-pass normalise → mode `ldh:ForceGraph3D-convert-data` → `{nodes, links}` JSON → `graph.graphData()`. Node `id`=URI, `label`=`rdfs:label`/`foaf:name`/`dct:title`/fragment, `color`=HSL hash of `rdf:type`. Links from resource-valued properties. **Double-click a node** fetches and merges its RDF, expanding the graph (linked-data navigation). State on `window.LinkedDataHub` (`document`, `loaded-uris`, `graphs[id].instance`). Full detail in `data-ingestion.md` Route D.

## Hard limitations (state these — don't paper over them)

- **RDF/XML only.** "Only documents that return `application/rdf+xml` content type can be loaded. Other RDF formats (Turtle, JSON-LD, N-Triples) are not yet supported." If your data is Turtle/JSON-LD, you cannot point AtomGraph at it directly — convert to RDF/XML, or use the JS parser route (`data-ingestion.md` Route C).
- **No SPARQL.** The project reads whole RDF documents; there is no query layer. SPARQL-fed graphs (`data-ingestion.md` Routes A/B) are a *different* front end onto the same renderer, demonstrated by opda — not by AtomGraph.
- **No "Linked Data Templates" in this repo.** Don't attribute an LDT/LinkedDataHub mechanism to this specific project; its data path is the XSLT pipeline above. (AtomGraph the org has separate LDT projects, but conflating them would be inaccurate.)

## Build / run (verified)

```bash
npm install -g xslt3-he      # XSLT 3.0 → SEF compiler
./generate-sef.sh            # src/graph-client.xsl → dist/graph-client.xsl.sef.json
python3 -m http.server 8000  # serve; open index.html
```

Default demo on load: `https://linkeddatahub.com/demo/skos/concepts/concept17128/`.

## How to use it as a skill exemplar

- Cite it as the **origin of the stack** (3d-force-graph + three-spritetext + three.js for 3D RDF graphs) and as the **RDF-document-driven** ingestion pattern (Route D).
- Cite **opda `force-graph-3d.js`** as the **SPARQL-derived, embeddable-in-a-static-site** instance of the same stack, and as the verified source for the engine accessor surface and the focus/theme/destroy patterns.
- Keep the two distinct: AtomGraph = RDF/XML + XSLT, follow-your-nose navigation; opda = SPARQL-extracted model adapted to `{nodes, links}`, lazy-loaded Astro island.
