# Adversarial review — `3d-diagramming` skill

Reviewer hat: skeptic. Goal: find invented APIs, gaps that block a zero→rendered-graph reader, convention violations, scope overlap with `diagramming`, and example bugs. Each finding has severity (blocker / major / minor) and a fix. Fixes applied in PHASE 4 are marked **[FIXED]**.

Sources of truth used for verification:

- 3d-force-graph README (`github.com/vasturiano/3d-force-graph`, raw `master/README.md`) — re-fetched during review.
- three-spritetext README (`github.com/vasturiano/three-spritetext`).
- AtomGraph/3D-Linked-Data `README.md` + `CLAUDE.md` (branch `main`).
- opda `public/ui/graph-engines/force-graph-3d.js` (committed `ddd723e`, 2026-06-17) and `src/pages/ontology/graph.astro`, `scripts/ontology-graph.mjs`.

---

## ACCURACY findings

### A1 — `ForceGraph3D()(el)` curried form was over-claimed as equally "verified" — **[FIXED]** (major)

The draft listed the curried-factory form and the `new` constructor as two co-equal "verified" forms. On re-fetch, the **current upstream README documents only `new ForceGraph3D(<el>)`** — the curried `ForceGraph3D()(el)` is *not* in the README. So calling them equally "verified" against the same authority was wrong.

Resolution (accurate): the curried form **is** real and **does work on the `@1 +esm` jsdelivr build** — proven by the opda engine, which is committed (`ddd723e`, dated today 2026-06-17), pins `3d-force-graph@1/+esm`, and calls `ForceGraph3D()(container)` (line 50). The two forms track **which build you load**: the npm/UMD package documents the class constructor; the `+esm` CDN build still exposes the callable Kapsule factory.

**Fix applied:** SKILL.md "Instantiation" section reworded — constructor is "documented in the current README"; curried is "verified working in the `@1 +esm` build per the committed opda engine (2026-06-17), not in the current README — prefer the constructor for new work, and if you use the curried form, confirm it against the exact version you pin." Same correction propagated to `minimal-example.md`'s swap note.

### A2 — `linkLabel` used in the example: VERIFIED real (no change) (was: suspected unverified)

The example calls `.linkLabel(l => l.label)` but the first research pass hadn't explicitly confirmed `linkLabel`. Re-fetch of the README confirms `linkLabel` exists ("Link object accessor … shown in label … Supports plain text, HTML string content or an HTML element", default `name`). **Accurate as written.** No fix needed.

### A3 — every other cited API traces to a source: VERIFIED (no change)

Audited each method named in SKILL.md + minimal-example.md against the README / opda file:

- `graphData, nodeId, nodeVal, nodeRelSize, nodeLabel, nodeColor, nodeThreeObject, nodeThreeObjectExtend` — README + opda ✓
- `linkColor, linkWidth, linkLabel, linkDirectionalArrowLength, linkDirectionalArrowRelPos` — README ✓ (arrowRelPos default `0.5`, ratio 0→1, target end at `1` ✓)
- `backgroundColor, width, height` — README + opda ✓
- `onNodeClick, onBackgroundClick` — README + opda ✓
- `cameraPosition, zoomToFit` — README ✓
- `pauseAnimation` / `_destructor()` — README documents `pauseAnimation`; `_destructor()` is used by opda (line 130) ✓ (flagged in-text as opda-sourced, not a public README method — see A4)
- `SpriteText` ctor + `.color`, `.textHeight` — three-spritetext README + opda ✓
- N3.js `Parser().parse()` returning quads with `.subject/.predicate/.object` and `.termType` — N3.js / RDF-JS standard ✓

### A4 — `_destructor()` is a private API — **[FIXED]** (minor)

`fg._destructor()` (used for WebGL teardown) is an underscore-prefixed internal, not a documented public method — it's used by opda but could change. The draft cited it without flagging it as private.

**Fix applied:** caveats.md and SKILL.md now note `_destructor()` is opda-sourced/internal and pair it with the documented `pauseAnimation()` as the public fallback (which opda itself uses as the catch-branch, lines 129–131).

### A5 — AtomGraph SPARQL / Linked-Data-Templates: correctly NOT attributed (no change, but verified)

The brief assumed AtomGraph uses "SPARQL / Linked Data Templates." Research showed the **actual** project uses **RDF/XML + client-side XSLT 3.0 (SaxonJS), no SPARQL, no LDT**. The skill states this explicitly (data-ingestion.md Route D, atomgraph-anatomy.md "Hard limitations") and is careful **not** to attribute SPARQL or LDT to AtomGraph — SPARQL is presented as the opda/general route instead. **This is the single most important accuracy point and it is handled correctly.** Confirmed no residual sentence implies AtomGraph reads SPARQL.

### A6 — version pins are accurate (no change)

AtomGraph versions (three 0.159.0, 3d-force-graph 1.73.3, three-spritetext 1.8.2, SaxonJS 3.0) quoted from `index.html` / README; opda floats `@1`. All match sources. The skill recommends exact pins for production — sound.

---

## COMPLETENESS findings

### C1 — zero → rendered graph is achievable from the skill alone: PASS

A reader gets: when-to-use gate → load libs (two forms, copy-paste CDN tags) → data into `{nodes,links}` (4 concrete routes with code) → instantiate + accessors → a **complete single-file runnable HTML** (`minimal-example.md`) that needs no build and renders 4 nodes. End-to-end path exists. ✓

### C2 — dependency install / load is covered: PASS

Both CDN loading forms are given with exact URLs; offline vendoring is noted in caveats. No npm/bundler step is required for the minimal path (script tags). ✓

### C3 — error modes covered — **[FIXED to strengthen]** (was minor gap)

The draft covered dangling edges, collapsed container, WebGL-context leaks, CDN/offline, CORS. Review added an explicit consolidation in the "Verify before you ship" checklist and ensured each error mode names its symptom (silent non-render) so a reader can diagnose. **Fix applied:** checklist item wording tightened; caveats already covered the cases.

### C4 — data conversion is concrete, not hand-wavy: PASS

`data-ingestion.md` gives a runnable SPARQL reducer, a CONSTRUCT variant, an N3.js Turtle reducer, and the accurate AtomGraph XSLT description. The `frag()` helper is defined once and reused. ✓

### C5 — no guidance on `linkSource`/`linkTarget` remap when ids aren't `source`/`target` — **[FIXED]** (minor)

The skill says source/target match node id "unless you remap" but didn't name the method. **Fix applied:** SKILL.md Step 2 and data-ingestion intro now name `linkSource()`/`linkTarget()` explicitly (both are verified README methods).

---

## CONVENTIONS findings

### V1 — frontmatter valid: PASS

`name: 3d-diagramming` equals the directory name (`/Users/henrik/.claude/skills/3d-diagramming`, confirmed via `basename`). `description` states **what** (build interactive 3D linked-data graphs with the named stack) **and when** (large interconnected RDF graphs needing 3D/interactivity) **and when NOT** (flowcharts/sequences/etc → `diagramming`). Matches the diagramming/council pattern (both lead `description` with what + when). `allowed-tools` present (Read, Write, Edit, WebFetch, Bash) — consistent with diagramming's `allowed-tools` convention. ✓

### V2 — SKILL.md-vs-reference split: PASS

SKILL.md is the operating procedure (when-to-use, stack, instantiation, 6 steps, verify checklist) at 188 lines; long material is in `reference/` (runnable example, ingestion patterns, AtomGraph anatomy, caveats, this review). Mirrors council (SKILL.md = procedure, `reference/*` = templates/methodology) and diagramming (SKILL.md = router + always-available config, guides loaded on demand). ✓

### V3 — trigger conditions clear enough to surface at the right time: PASS (with note)

`description` names concrete triggers: "RDF/ontology/SPARQL data … large, densely interconnected graph … 3D layout, force-directed exploration, focus/neighbourhood interaction." It also names the **anti-trigger** (flowcharts/sequences/ER/class → `diagramming`). A future Claude seeing "visualise this big knowledge graph in 3D / interactively explore this ontology graph" should match here; "draw a flowchart" should not. Note: there is inherent overlap risk with `diagramming`'s linked-data guides for *small* RDF — mitigated by the explicit size/interactivity decision rule in both the description and the When-to-use table (see S1).

---

## SCOPE / OVERLAP findings

### S1 — boundary with `diagramming`: clean, cross-referenced — PASS

`diagramming` owns authored/static diagrams (Mermaid/DOT), *including* small RDF (`17-LINKED-DATA-GUIDE.md`), property graphs (`18`), DOT semantic webs (`19`). `3d-diagramming` owns **interactive 3D of large data**. The decision rule ("3D is justified by scale + interactivity + interconnection, not by topic; a 12-triple example is clearer as Mermaid") is stated in SKILL.md and the boundary is restated in "Adjacent skills." No contradictory advice: neither skill claims the other's territory. The skill points *into* `diagramming` for the fallback 2D render and for the Cagle palette (reused, not duplicated). ✓

### S2 — no duplication of the Cagle palette — PASS

The skill references `diagramming`'s `09-STYLING-GUIDE.md` for semantic colours rather than re-listing them, noting they're applied as plain hex (no `classDef` in WebGL). Avoids drift between the two skills. ✓

---

## EXAMPLE CORRECTNESS findings

### E1 — minimal example is self-consistent and runnable: PASS (audited line by line)

- Script tags: three 0.159.0 → 3d-force-graph 1.73.3 → three-spritetext 1.8.2 (correct order: three before the graph lib; the AtomGraph-verified URLs). Globals `ForceGraph3D`, `SpriteText` are what those UMD builds expose. ✓
- `new ForceGraph3D(el)` — matches the UMD/global it loads (the documented form). ✓
- `data`: 4 nodes, 4 links; **every** link `source`/`target` (`alice/bob/acme/doc1`) exists as a node `id`. No dangling edge. ✓
- Accessors used all verified (A2/A3). `nodeThreeObjectExtend(true)` keeps the sphere under the sprite (matches opda). ✓
- Focus logic mirrors opda exactly: `__id` tagging before focus; `typeof l.source === 'object' ? l.source.id : l.source` post-layout guard; repaint by re-feeding accessors. ✓
- `linkDirectionalArrowLength(l => l.directed ? 3 : 0)` + `directed` flags on the data → arrows on `worksFor`/`about`, none on `knows`. Self-consistent. ✓
- `<noscript>` fallback present (accessibility rule). ✓
- Syntactic check: balanced braces/parens, all method chains terminated, `frag()` not needed here (labels inline) so not referenced — no undefined-symbol use. ✓
- `+esm` swap note uses the curried form correctly and explains dropping the separate three import (the `+esm` build bundles three) — matches opda. ✓

### E2 — `linkLabel`/`linkDirectionalArrowRelPos` in example are real — PASS (see A2/A3).

### E3 — the data-ingestion reducers are syntactically sound — PASS (audited)

`sparqlToGraph` (Map dedupe, `results.bindings[i].<var>.value` per SPARQL-JSON spec, dangling-edge-safe), `turtleToGraph` (N3 quads, `termType === 'NamedNode'` branch for edges), `frag()` regex (`/[#/]([^#/]+)\/?$/` → last segment) all parse. The N3.js import path `https://cdn.jsdelivr.net/npm/n3/+esm` is the standard jsdelivr esm form (consistent with how opda imports other libs). ✓

---

## MARKDOWN findings

### M1 — blank lines around headings/lists/code fences: PASS

Checked all five files: every heading has a blank line before/after; every fenced block is blank-line-delimited; every list is preceded by a blank line. No `~~~` fences (backticks only). Tables well-formed. ✓ (Mechanical re-check in the validation checklist below.)

---

## Summary of fixes applied in PHASE 4

| # | Severity | Fix |
|---|---|---|
| A1 | major | Reworded instantiation: constructor = README-documented; curried = verified in `@1 +esm` per committed opda engine (2026-06-17), not in README; prefer constructor for new work. Propagated to minimal-example swap note. |
| A4 | minor | Flagged `_destructor()` as private/opda-sourced; paired with public `pauseAnimation()`. |
| C3 | minor | Tightened error-mode wording in the ship checklist (each names its silent-failure symptom). |
| C5 | minor | Named `linkSource()`/`linkTarget()` for the id-remap case. |

No blocker-severity findings. The one accuracy risk that *would* have been a blocker — fabricating a SPARQL/LDT data path for AtomGraph — was avoided in authoring (A5).

---

## PHASE 5 — Final soundness + completeness validation

Re-run after applying PHASE-4 fixes. Each item PASS/FAIL with evidence.

- [x] **Frontmatter valid** — PASS. `name: 3d-diagramming` == dir `basename` (`3d-diagramming`); `description` has what + when-to-use + when-NOT trigger; `allowed-tools` set. Evidence: V1, `grep -m1 '^name:' SKILL.md` == `basename "$PWD"`.
- [x] **Every cited API/dependency traces to a PHASE-1 source or force-graph-3d.js (no fabrication)** — PASS. Full audit in A2/A3; `linkLabel`, `linkDirectionalArrowRelPos`, all node*/link*/camera/interaction methods confirmed in the 3d-force-graph README; `SpriteText` props in three-spritetext README; `_destructor()` flagged as opda-internal (A4); N3.js API is RDF-JS standard. Versions match AtomGraph `index.html`/README (A6). No SPARQL/LDT attributed to AtomGraph (A5).
- [x] **A reader can go zero → rendered 3D graph** — PASS. C1/C2: when-to-use → CDN load → `{nodes,links}` → instantiate+accessors → complete runnable single-file HTML (`minimal-example.md`) that renders with no build. E1 audited it line-by-line.
- [x] **RDF/SPARQL → {nodes,links} ingestion covered concretely** — PASS. C4/E3: runnable SPARQL SELECT + reducer (Route A), CONSTRUCT (B), N3.js Turtle (C), accurate AtomGraph RDF/XML+XSLT (D). Dangling-edge invariant explained.
- [x] **Clean boundary + cross-reference with `diagramming`** — PASS. S1/S2: size/interactivity decision rule; `diagramming` keeps static/authored incl. small RDF; this skill keeps interactive-3D-of-large-data; mutual cross-reference; Cagle palette reused not duplicated.
- [x] **Markdown well-formed (blank lines around blocks/lists/headings)** — PASS. M1; re-verified mechanically (see check below).
- [x] **Minimal example syntactically correct and self-consistent** — PASS. E1/E2: all link endpoints resolve to node ids; instantiation form matches the loaded build; accessors verified; focus/repaint mirrors opda; `<noscript>` present; braces/chains balanced.

**Result: 7/7 PASS.** No outstanding FAILs.

### Honest limitations (not failures, but stated plainly)

- The curried `ForceGraph3D()(el)` form's only authority is the opda artifact + the live `@1 +esm` build; the upstream README doesn't document it. If the `+esm` build later drops the callable factory, that form (and opda) would need the `new` constructor. The skill says to verify against the pinned version — it does not pretend the README blesses the curried form.
- API surface beyond what the skill uses (e.g. `linkThreeObject`, particle links, post-processing) is **not** documented here by design — the skill says to `WebFetch` the upstream README for anything it didn't cover, rather than enumerating the whole API from memory (which would risk fabrication).
- Performance node-count numbers (~1–2k smooth, 10k reconsider) are rules of thumb, labelled as such — they are not from a benchmark in the sources.
- N3.js specifics (import path, quad shape) are RDF-JS-standard and consistent with how opda imports esm libs, but N3.js was not separately WebFetched during authoring; treat the reducer as a documented pattern to adapt, and verify N3's current export if a version issue arises.
