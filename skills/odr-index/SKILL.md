---
name: odr-index
description: Build or rebuild the ODR index and dependency graph in AgentDB (strict mode — current DCAP per ODR-0095 + ADR-0211)
argument-hint: ""
allowed-tools: mcp__ruflo__agentdb_hierarchical-store mcp__ruflo__agentdb_hierarchical-query mcp__ruflo__agentdb_causal-edge mcp__ruflo__agentdb_causal-query mcp__ruflo__memory_store mcp__ruflo__memory_search Bash Read Grep Glob
---

# ODR Index

Build or rebuild the full ODR index and dependency graph in AgentDB from the `docs/ontology/odr/` directory. **Strict mode** — assumes the corpus conforms to the current DCAP (canonical MADR 4.x with named extensions, ratified by ODR-0095 / Council 411 / ADR-0211 Phase 3.5). Fails loud on legacy / non-canonical content.

Symmetric with `adr-index` on the ADR side; writes into the `odr/*` namespace alongside `adr/*`.

## When to use

After importing ODRs from another project, when the AgentDB graph is out of sync, or when bootstrapping ODR tracking on an existing codebase. Strict mode is appropriate for corpora fully conforming to the current DCAP. The DCAP at `docs/ontology/odr/DCAP.md` is the prose normative spec.

## Format ODRs MUST follow (post-Council-411 / ODR-0095)

Frontmatter (YAML) contains **exactly six keys** (all optional except `status` and `date`):

- `status` — enum: `proposed | accepted | rejected | deprecated | superseded` (exactly 1)
- `date` — ISO date `YYYY-MM-DD` (exactly 1)
- `tags` — list of strings (0..*)
- `supersedes` — list of intra-corpus record IDs (ODR↔ODR only) (0..*)
- `depends-on` — list of record IDs, cross-corpus allowed (ODR↔ADR) (0..*)
- `implements` — list of intra-corpus record IDs OR external schema URIs (0..*)

Body contains a canonical MADR 4-section spine plus optional named extensions, in this order:

1. `# <Title>` (H1, exactly 1; the ODR's title, no `ODR-NNNN:` prefix)
2. `## Context and Problem Statement` (required)
3. `## Decision Drivers` (optional)
4. `## Considered Options` (required; lists chosen option alongside rejected alternatives — never `## Options Rejected` alone)
5. `## Decision Outcome` (required; first prose paragraph is the canonical `Chosen option: "X", because Y.` sentence)
   - `### Consequences` (required; flat bullet list, canonical `* Good, because…` / `* Bad, because…` / `* Neutral, because…`)
   - `### Confirmation` (optional; verification method)
   - `### Supersession scope:` (optional; only when partial supersession applies per ADR-0211 convention)
6. `## Pros and Cons of the Options` (optional; H3 per option)
7. `## More Information` (optional; references)
8. `## Rules` (optional named extension; durable normative content scoped to this ODR's lifetime per OntoClean rigidity test)
9. `## Vote and Dissent` (optional named extension; compact panellist position summary)
10. `## Amendments` (optional named extension; running list of post-acceptance amendments)
11. `## Mapping` (optional named extension; used when an ODR migrates a `.code.md` companion's mapping tables)

The strict-mode indexer does **not** tolerate any of the following — each is a hard failure:

- Files without YAML frontmatter
- **DACI fields** (`deciders:`, `consulted:`, `informed:`, `decision-makers:`, `author:`) — dropped by Council 415 (5-2 verdict; git log is the canonical authorship surface)
- **Legacy fields** (`chosen-option:`, `format:`, `related:`, `related-prov-activity:`, `kind:`, `scope:`, `council:`, `invalidated:`, `ratified:`) — these predate ODR-0095 / Council 411-415 ratifications
- **Authored inverse properties** (`superseded-by:`, `depended-on-by:`, `implemented-by:`) — derived at index time per Council 410's single-source-of-truth rule
- Undeclared frontmatter keys (only the 6 listed above are valid)
- **Legacy 9-section body headings**: `## Context` (without "and Problem Statement"), `## Decision` (use `## Decision Outcome`), `## Alternatives` (use `## Considered Options`), `## References` (use `## More Information`), bare `## Consequences` at H2 (must be `### Consequences` under `## Decision Outcome`) — all rejected per ODR-0095's body-spine restoration
- Cross-corpus `supersedes:` violations (must be intra-ODR)
- Cross-corpus `implements:` violations for intra-corpus refs (ODR refs intra-ODR; external URIs pass-through)
- Self-references in typed slots
- Orphan references (intra-corpus refs that don't resolve)
- `.code.md` companion files (retired by ODR-0095 — companions roll back inline into parent ODR; Phase 3.1d of ADR-0211 distributes companion content into `## Mapping` named extension)

Required file shape:

```markdown
---
status: proposed | accepted | rejected | deprecated | superseded
date: YYYY-MM-DD
tags: [tag1, tag2]
supersedes: [ODR-NNNN, ...]
depends-on: [ODR-NNNN, ADR-NNNN, ...]
implements: [ODR-NNNN, pdtf-v3:propertyPack.agents, ...]
---

# <Title>

## Context and Problem Statement
...

## Decision Drivers
- ...

## Considered Options
- **Option A**: ...
- **Option B (CHOSEN)**: ...

## Decision Outcome

Chosen option: "Option B", because ...

### Consequences

* Good, because ...
* Bad, because ...
* Neutral, because ...

### Confirmation
...

## Pros and Cons of the Options
...

## More Information
...

## Rules
...

## Vote and Dissent
...

## Amendments
...
```

## Indexer contract (input → forward edges → derived inverses → record metadata)

Writes into the `odr/*` namespace.

### Input parsing (strict)

For each `.md` file in `docs/ontology/odr/` (namespace `odr`):

1. Skip filenames `README.md`, `INDEX.md`, `_template.md`, `DCAP.md`, `DCAP-audit-log.md`, `DCAP-undeclared-extension-test.md`, `RULES-AND-DISSENT-AUDIT.md`, and the entire `council/` subdirectory. Skip any `.code.md` file (legacy companions retired by ODR-0095) — emit a deprecation warning but do not fail.
2. **Verify YAML frontmatter is present.** File MUST start with `---\n`. No frontmatter → fail.
3. **Parse YAML** via a YAML library (NOT regex). Malformed YAML → fail loud with file path and parse error.
4. **Whitelist frontmatter keys** per DCAP. Only `status`, `date`, `tags`, `supersedes`, `depends-on`, `implements` are valid. Any other key (including DACI fields, legacy fields, inverse properties) → fail loud with offending key name.
5. **Validate `status` enum**. MUST be one of `proposed | accepted | rejected | deprecated | superseded`. Lowercase exactly.
6. **Validate `date`.** MUST be ISO `YYYY-MM-DD`.
7. **Validate list shapes.** `tags`, `supersedes`, `depends-on`, `implements` MUST be lists.
8. **Validate intra-corpus ref shape.** Items in `supersedes` MUST match `^ODR-\d{4}[a-m]?$`. Items in `depends-on` MUST match `^(ADR|ODR)-\d{4}[a-m]?$`. Items in `implements` either match `^ODR-\d{4}[a-m]?$` (intra-corpus) OR match an external schema URI form `^[a-z][a-z0-9-]*:[A-Za-z0-9_.-]+$` (pass-through).
9. **Validate H2 section conformance.** Required H2 headings: `## Context and Problem Statement`, `## Considered Options`, `## Decision Outcome` (each exactly once, in that order). Optional H2 (in canonical position): `## Decision Drivers`, `## Pros and Cons of the Options`, `## More Information`. Named extensions (optional, in canonical position after `## More Information`): `## Rules`, `## Vote and Dissent`, `## Amendments`, `## Mapping`. Required H3 under `## Decision Outcome`: `### Consequences`. Optional H3 under `## Decision Outcome`: `### Confirmation`, `### Supersession scope:`. Missing required, extra undeclared, wrong order, or duplicate → fail with the offending heading.
10. **Extract the file's own ID** from the filename: `ODR-NNNN-<slug>.md` → `ODR-NNNN`; sub-letter form (`ODR-0071a-...md`) → `ODR-0071a`.

### Forward edges (strict)

For each typed-relation list, emit one edge per entry: `(source-id, predicate, target-id)`.

**Cross-corpus rule (HARD).**
- `supersedes` targets MUST be ODR (intra-corpus). Cross-corpus violations → fail.
- `implements` intra-corpus refs (ODR-NNNN) MUST be ODR. ADR refs in `implements:` → fail.
- `implements` external URIs (e.g. `pdtf-v3:propertyPack.agents`) pass-through — emit a typed edge with predicate `realises-external`.
- `depends-on` may cross corpora freely (ODR ↔ ADR).

**Self-reference (HARD).** An ID MUST NOT appear in its own typed slots. Self-references → fail loud.

**Referential integrity (HARD).** Every intra-corpus typed-relation target MUST resolve to an existing record file:
- `ODR-NNNN` → `docs/ontology/odr/ODR-NNNN*-*.md`
- `ADR-NNNN` → `docs/adr/ADR-NNNN*-*.md` (or the legacy `docs/adr/NNNN-*.md` pattern for unmigrated ADRs)
- External schema URIs in `implements:` pass-through without resolution check.

Missing intra-corpus targets → fail loud.

**Council reference** (Council 415 dropped the `council:` frontmatter field; council provenance now lives in body prose under `## More Information` or `## Vote and Dissent`). The indexer scans body prose for `docs/ontology/odr/council/session-NNN-*.md` references; missing referenced session files → warn (not fail; orphaned council references are allowed for retrospective records).

### Derived inverses

For each forward edge `(A, p, B)`, emit `(B, p⁻¹, A)`:

| Forward | Inverse |
|---|---|
| `supersedes` | `superseded-by` |
| `depends-on` | `depended-on-by` |
| `implements` | `implemented-by` |
| `realises-external` | (no inverse — external URIs are not indexed records) |

Inverses live alongside forward edges, scoped by namespace; **never authored**. The indexer is the only writer of inverse edges (per Council 410).

Deduplicate.

### Record metadata

Per-record entry with `status`, `date`, `tags`, `supersedes`, `depends-on`, `implements`, `chosen_option_statement` (the first prose paragraph of `## Decision Outcome`), `rules_summary` (first ~500 chars of `## Rules` if present), `has_vote_and_dissent` (boolean), `has_mapping` (boolean), `file` path, `mtime`. Idempotent on subsequent runs.

### Out of scope

- **No RDF emission, no JSON-LD context, no SHACL.** The captured datapoints are forward-compatible with a future Linked Data lift but no lift is performed per the operator's post-Council-410 deferral.
- **No PROV-O sub-property declarations.**
- **No body-prose extraction beyond `chosen_option_statement` + `rules_summary`.** Typed-relation graph is canonical-frontmatter-only.

## Steps

1. **Scan directory** — `Glob` for `docs/ontology/odr/ODR-*.md`. Skip the `council/` subdirectory and the meta-files listed in step 1 of input parsing.

2. **Parse each ODR** (strict — see input-parsing section). For each file:

   - **ID** from filename.
   - **Frontmatter validation** per the strict rules.
   - **Section validation** per the DCAP section list + ordering + cardinality.
   - **Title** from H1 (no `ODR-NNNN:` self-prefix).
   - **Chosen-option statement** (first prose paragraph of `## Decision Outcome`, ~500 char cap).
   - **Rules summary** (first chunk of `## Rules` if present, ~500 char cap).
   - **Extension presence flags**: `has_vote_and_dissent`, `has_amendments`, `has_mapping`.

2.5. **Uniqueness check** — Verify no two files mapped to the same ID. Collisions abort the build.

3. **Store record metadata** — For each ODR, call `mcp__ruflo__agentdb_hierarchical-store` with:
   - path: `odr/<id>`
   - value:
     ```json
     {
       "id": "<id>",
       "title": "<title>",
       "status": "<status>",
       "date": "<date>",
       "tags": [...],
       "supersedes": [...],
       "depends-on": [...],
       "implements": [...],
       "chosen_option_statement": "<paragraph from ## Decision Outcome, ~500 chars>",
       "rules_summary": "<first chunk of ## Rules, ~500 chars or empty>",
       "has_vote_and_dissent": true|false,
       "has_amendments": true|false,
       "has_mapping": true|false,
       "file": "<filepath>",
       "mtime": "<ISO timestamp>"
     }
     ```

4. **Build forward edges (strict)** — For each typed-relation slot in frontmatter, emit `(current, predicate, target)`. Apply hard rules: cross-corpus check, self-reference check, referential-integrity check. Any violation aborts the build.

5. **Build derived inverse edges** — For each forward edge (excluding `realises-external`), emit the inverse. Deduplicate.

6. **Store in memory** — For each ODR, `mcp__ruflo__memory_store` in namespace `odr-patterns`, key `<id>`, value `<title> — <chosen_option_statement>`.

7. **Verify graph** — Call `mcp__ruflo__agentdb_causal-query`:

   - **Orphan-edge check** — every forward edge whose target file does not exist (intra-corpus only). Should be zero (enforced at step 4).
   - **Circular supersedes chains** — should be impossible (intra-corpus, acyclic); cycles → fail.
   - **Status consistency** — superseded ODRs MUST have a `supersedes` edge from their successor AND status `superseded`. Mismatches → fail.
   - **Council-session reference resolution** (warn-only) — every `docs/ontology/odr/council/session-NNN-*.md` reference in body prose resolves to an existing session file; missing → warn.

8. **Report** — Output:

   ```
   ## ODR Index Summary

   Namespace: odr/
   Total ODRs: N

   By status:
   - proposed: X
   - accepted: Y
   - deprecated: Z
   - superseded: W
   - rejected: R

   Tag distribution (top 10):
   - <tag>: <count>

   Typed relations:
   - supersedes / superseded-by: A
   - depends-on / depended-on-by: B
   - implements / implemented-by: C
   - realises-external (external URIs): D

   Cross-corpus depends-on (allowed): E
   Cross-corpus depends-on examples (top 5):
   - ODR-NNNN ↔ ADR-NNNN: <reason from More Information>

   Named extensions present:
   - ## Rules: F of N
   - ## Vote and Dissent: G of N
   - ## Amendments: H of N
   - ## Mapping: I of N

   Issues found: 0 (strict mode; any failure would have aborted above)
   Council-session reference warnings: J (non-fatal)
   ```

## Notes

A clean run produces zero errors. Any drift in the corpus surfaces as a hard error rather than a silent pass. Council-session reference warnings are non-fatal because retrospective records may cite sessions that have moved or been archived; the lint surfaces them without blocking.

DCAP enforcement at index time is symmetric with `odr-review`'s lints:

- Lint 1 (cross-corpus modifying-relations) — enforced here at edge-emission time
- Lint 2 (referential integrity) — enforced here at edge-emission time
- Lint 3 (DCAP profile conformance) — enforced here at frontmatter+heading parse time
- Lint 4 (inverse-authoring prohibition) — enforced here at frontmatter parse time

The indexer additionally enforces:

- Graph-level checks (orphan edges, supersedes cycles, status consistency)
- Filename collision (uniqueness)

## Lineage

This skill targets the **current DCAP** ratified by:

- ODR-0029 (2026-03-11) — original 9-section bullet-list shape (RETIRED)
- ODR-0093 (2026-05-08) — Council 407 metadata-header revision (SUPERSEDED)
- ODR-0094 (2026-05-09) — Council 410 typed-relation slots (SUPERSEDED)
- **ODR-0095** (2026-05-09) — **Council 411 MADR canonical + named extensions (current)**
- Council 413 — dropped `kind:` qualifier on `depends-on`
- Council 414 — dropped `amends`/`refines` predicates; added `## Supersession scope:` body subsection
- Council 415 — dropped DACI fields from both corpora

The 9-section body structure from ODR-0029 is retired; MADR's 4-section spine plus named extensions is the canonical shape going forward. Files conforming to ODR-0029/0093/0094 must be migrated by Phase 3 of ADR-0211 before this indexer accepts them.

## See also

- `docs/ontology/odr/DCAP.md` — the prose normative spec
- `~/.claude/skills/odr-review/SKILL.md` — symmetric lint skill
- `~/.claude/skills/odr-create/SKILL.md` — emits canonical-shape ODRs
- `~/.claude/skills/adr-index/SKILL.md` — symmetric ADR-side indexer
- ADR-0211 — the parallel ADR-side ratification of the format (Phase 3 migration)
- ODR-0095 — the ODR-side ratification
- Council 411 / 413 / 414 / 415 transcripts under `docs/ontology/odr/council/`
