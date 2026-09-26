# RDF / SPARQL / RDF-XML → `{ nodes, links }`

The 3d-force-graph engine only understands one shape (verified, [3d-force-graph README](https://github.com/vasturiano/3d-force-graph)):

```js
{
  nodes: [ { id: "...", /* + any fields */ }, … ],
  links: [ { source: "<node id>", target: "<node id>", /* + any fields */ }, … ]
}
```

`source`/`target` are matched against node `id` by string (unless remapped via `linkSource()`/`linkTarget()`). The whole job of ingestion is to turn your RDF into that. Below are the verified routes, cheapest first.

---

## Route A — SPARQL `SELECT` → `{nodes, links}` (recommended for triplestore data)

This is the opda lineage: the model is SPARQL-extracted from a triplestore, then reduced to graph elements. Project subject, predicate, object (plus labels) per row; each row is one edge and contributes its two endpoint nodes.

**Query** (one edge per row; restrict `?p`/types to keep the graph legible — do not dump the whole store):

```sparql
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
SELECT ?s ?sLabel ?sType ?p ?o ?oLabel ?oType WHERE {
  ?s ?p ?o .
  FILTER(isIRI(?o))                       # only resource→resource edges become links
  OPTIONAL { ?s rdfs:label ?sLabel } OPTIONAL { ?s a ?sType }
  OPTIONAL { ?o rdfs:label ?oLabel } OPTIONAL { ?o a ?oType }
  # Scope it: e.g.  FILTER(?p IN (ex:worksFor, ex:knows, ex:about))
}
```

**Reducer** (SPARQL JSON results → `{nodes, links}`). The standard [SPARQL 1.1 JSON results](https://www.w3.org/TR/sparql11-results-json/) shape is `results.bindings[i].<var>.value`:

```js
async function sparqlToGraph(endpoint, query) {
  const res = await fetch(endpoint + '?query=' + encodeURIComponent(query), {
    headers: { Accept: 'application/sparql-results+json' },
  });
  const json = await res.json();

  const nodes = new Map();   // id → node (dedupe)
  const links = [];
  const v = (b, k) => (b[k] ? b[k].value : undefined);
  const addNode = (id, label, type) => {
    if (!id) return;
    if (!nodes.has(id)) nodes.set(id, { id, label: label || frag(id), type });
    else if (label && !nodes.get(id).label) nodes.get(id).label = label;  // fill a missing label
  };

  for (const b of json.results.bindings) {
    const s = v(b, 's'), o = v(b, 'o');
    addNode(s, v(b, 'sLabel'), v(b, 'sType'));
    addNode(o, v(b, 'oLabel'), v(b, 'oType'));
    links.push({ source: s, target: o, label: frag(v(b, 'p')), directed: true });
  }
  return { nodes: [...nodes.values()], links };
}

// URI → short label: last path/hash segment.
function frag(uri) {
  if (!uri) return '';
  const m = uri.match(/[#/]([^#/]+)\/?$/);
  return m ? m[1] : uri;
}
```

Feed the result straight to `.graphData(graph)`. **Dangling-edge guard:** because every link's endpoints are added as nodes in the same loop, `source`/`target` are guaranteed to resolve — keep that invariant if you refactor (a link whose endpoint isn't in `nodes` silently won't draw).

> CORS: a browser fetch to a third-party SPARQL endpoint needs that endpoint to allow your origin (or a proxy). Same-origin endpoints (your own Fuseki/QLever behind the site) are fine. See `caveats.md`.

---

## Route B — SPARQL `CONSTRUCT` → triples → `{nodes, links}`

When you want to shape the sub-graph server-side (rename predicates, collapse paths) and get back RDF rather than a table. `CONSTRUCT` returns a graph; request it as Turtle or JSON-LD, parse, then run the same node/link reduction as Route C.

```sparql
CONSTRUCT { ?s ?p ?o }
WHERE     { ?s ?p ?o . FILTER(isIRI(?o)) /* + your scoping */ }
```

Request `Accept: text/turtle` (parse with N3.js, Route C) or `Accept: application/ld+json` (parse the JSON-LD). The reduction to `{nodes, links}` is identical to Route C below.

---

## Route C — Turtle / JSON-LD / N-Triples → `{nodes, links}` (parse in JS)

3d-force-graph has no RDF parser; you bring one. [N3.js](https://github.com/rdfjs/N3.js) is the common choice (it parses Turtle / N-Triples / N-Quads / TriG into RDF/JS quads):

```js
import { Parser } from 'https://cdn.jsdelivr.net/npm/n3/+esm';

function turtleToGraph(ttl) {
  const quads = new Parser().parse(ttl);          // array of {subject, predicate, object}
  const nodes = new Map();
  const links = [];
  const add = id => { if (!nodes.has(id)) nodes.set(id, { id, label: frag(id) }); };

  for (const q of quads) {
    const s = q.subject.value, p = q.predicate.value, o = q.object;
    if (o.termType === 'NamedNode') {             // resource→resource → an edge
      add(s); add(o.value);
      links.push({ source: s, target: o.value, label: frag(p), directed: true });
    } else if (p.endsWith('label') || p.endsWith('#label')) {
      add(s); nodes.get(s).label = o.value;        // literal label → set the node's label
    }
    // other literals (datatype properties) are left off the graph here; attach
    // them to node objects if you want them in the info panel.
  }
  return { nodes: [...nodes.values()], links };
}
```

`frag()` as in Route A. This is the same subject→node / resource-property→link reduction AtomGraph performs, just in JS over parsed quads instead of in XSLT over RDF/XML.

---

## Route D — AtomGraph/3D-Linked-Data's actual pipeline (RDF/XML + XSLT, no SPARQL)

Describe this accurately if you reference the upstream project — **it does not use SPARQL**, and it accepts **only RDF/XML**. Verified from the AtomGraph README and `CLAUDE.md`:

- **Input:** an HTTP(S) URL returning `application/rdf+xml`. Turtle, JSON-LD, N-Triples are explicitly **not** supported. The URL is fetched (through a CORS proxy `https://corsproxy.io/?url=<encoded>`) via SaxonJS `ixsl:http-request()`.
- **Processing:** entirely **client-side XSLT 3.0** under SaxonJS 3.0 — "all application logic … in XSLT 3.0, not JavaScript." Three-pass normalisation (`src/normalize-rdfxml.xsl`: syntax → blank-node flattening → URI resolution), then conversion in mode `ldh:ForceGraph3D-convert-data` (`src/3d-force-graph.xsl`).
- **Node mapping:** each RDF resource (`rdf:about`) → a node. `id` = resource URI; `label` from `rdfs:label` / `foaf:name` / `dct:title`, falling back to the URI fragment; `color` = a deterministic HSL hash of the `rdf:type` URI (`ldh:force-graph-3d-node-color()`).
- **Link mapping:** each property whose object is a resource (`rdf:resource`) → a link; `source` = subject URI, `target` = object URI, `label` = property name.
- **Output:** `{ nodes: [{id, label, color, …}], links: [{source, target, label, …}] }`, handed to `graph.graphData(newData)`.
- **Interaction:** single-click = inspect resource; **double-click = fetch that resource's RDF and merge it** into `window.LinkedDataHub.document`, growing the graph — the linked-data "follow your nose" navigation.
- **Build/run:** `npm install -g xslt3-he`; `./generate-sef.sh` compiles `src/graph-client.xsl` → `dist/graph-client.xsl.sef.json` (Saxon Export Format) after any `.xsl` change; serve over any static HTTP server (`python3 -m http.server 8000`).

So AtomGraph is the **RDF-document-driven** member of this family; Routes A–C are the **SPARQL/parser-driven** members. Same renderer, same `{nodes, links}` contract, different front end onto RDF. (No "Linked Data Templates" mechanism is documented in this repo — do not attribute one to it. AtomGraph the organisation publishes a separate Linked-Data-Templates/LinkedDataHub stack, but *this* project's data path is the XSLT pipeline above.)

---

## Why the opda example proves the contract

opda's committed model is **Cytoscape-shaped** (`{ data: { id, … } }`, see `scripts/ontology-graph.mjs`), yet its 3D engine renders fine — because `force-graph-3d.js` adapts it at mount (lines 56–62):

```js
var gData = {
  nodes: view.nodes.map(function (d) { return Object.assign({}, d); }),
  links: view.edges.map(function (d) { return Object.assign({}, d); }),  // note: edges → links
};
fg.graphData(gData);
```

Whatever your source shape, convert it to `{nodes, links}` (note 3d-force-graph wants **`links`**, not `edges`) with id-matched `source`/`target`, and the engine is happy. That is the only contract.
