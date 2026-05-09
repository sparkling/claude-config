---
name: adr-index
description: Build or rebuild the ADR index and dependency graph in AgentDB (strict mode — Phase 3 corpus, ADR- prefix filenames, no legacy fallbacks)
argument-hint: ""
allowed-tools: mcp__ruflo__agentdb_hierarchical-store mcp__ruflo__agentdb_hierarchical-query mcp__ruflo__agentdb_causal-edge mcp__ruflo__agentdb_causal-query mcp__ruflo__memory_store mcp__ruflo__memory_search Bash Read Grep Glob
---

# ADR Index

Build or rebuild the full ADR index and dependency graph in AgentDB from the `docs/adr/` directory. **Strict mode** — assumes the corpus has been migrated to canonical post-ADR-0211 shape (Phase 3 complete) AND filenames use the project-canonical `ADR-NNNN-<slug>.md` form. Fails loud on legacy / non-canonical content.

## Filename convention (this project)

Files in `docs/adr/` follow the **self-identifying** form:

```
ADR-NNNN-<slug>.md          → ID = ADR-NNNN
ADR-NNNN<letter>-<slug>.md  → ID = ADR-NNNN<letter>   (sub-letter form, rare on ADR side)
ADR-NNNN.<descriptor>.md    → ID = ADR-NNNN-<slug-of-descriptor>   (legacy companion form, kept for migration tail)
```

This deviates slightly from canonical MADR (which uses bare `NNNN-slug.md`); the deviation is deliberate so every reference in the codebase is unambiguously typed (`ADR-NNNN` vs `ODR-NNNN` — both corpora share the same numeric range).

## When to use

After importing ADRs from another project, when the AgentDB graph is out of sync, or when bootstrapping ADR tracking on an existing codebase. The strict mode is appropriate for projects whose ADR corpus is fully migrated to the post-Council-415 + ADR-prefix-rename shape.

## Format ADRs MUST follow

ADRs follow canonical MADR 4.x with two project extensions:

- A `tags:` frontmatter field for cross-cutting categorisation
- Three typed-relation frontmatter slots: `supersedes:`, `depends-on:`, `implements:`

The strict-mode indexer does **not** tolerate any of the following — each is a hard failure:

- Legacy bullet-list metadata under H1 (no YAML frontmatter)
- DACI fields (`decision-makers:`, `deciders:`, `consulted:`, `informed:`) — dropped by Council 415
- Legacy `chosen-option:` field — dropped by Council 411
- Authored inverse properties (`superseded-by:`, `depended-on-by:`, `implemented-by:`) — derived only
- Undeclared frontmatter keys — only the six post-Council-415 keys are valid
- Cross-corpus modifying-relations violations (`supersedes:` or `implements:` targeting a different corpus)
- Self-references (an ID appearing in its own typed-relation slot)
- Orphan references (a typed-relation target that does not resolve to an existing record file)
- Body-prose `Supersedes:` / `Depends on:` / `Related:` / `Amends` patterns — typed-relation graph is canonical-frontmatter-only
- Bare-prefix filenames (`NNNN-slug.md` without `ADR-` prefix) — all ADR files MUST use the project-canonical `ADR-` prefix

Required file shape (post-Council-415, post-ADR-prefix-rename):

```markdown
---
status: proposed | accepted | rejected | deprecated | superseded
date: YYYY-MM-DD
tags: [tag1, tag2]
supersedes: [ADR-NNNN, ...]
depends-on: [ADR-NNNN, ODR-NNNN, ...]
implements: [ADR-NNNN]
---

# <Title>

## Context and Problem Statement

...

## Considered Options

...

## Decision Outcome

Chosen option: "X", because Y.

### Consequences

* Good, because ...
* Bad, because ...
* Neutral, because ...

### Confirmation

...

## More Information

- Human-readable references and supporting evidence.
```

## Indexer contract (input → forward edges → derived inverses → record metadata)

### 2.3a — Input parsing (strict)

For each `.md` file in `docs/adr/` (namespace `adr`):

1. Skip filenames `README.md`, `INDEX.md`, `_template.md` (filename-only filter). Skip subdirectories (`diagrams/`, `panels/`, `templates/`, `0152-examples/`, `0167/`, `0168/`, `0185/`, `0188/`, `0189/`, `hive-laika-platform-*`, `laika-runtime-tooling-review-*`).
2. **Verify YAML frontmatter is present.** File MUST start with `---\n`. Files without frontmatter are reported and the indexer exits non-zero. There is no bullet-list-metadata fallback.
3. Parse YAML frontmatter via a YAML library (NOT regex). Malformed YAML → fail loud (exit non-zero) with file path and parse error.
4. **Whitelist frontmatter keys.** Only `status`, `date`, `tags`, `supersedes`, `depends-on`, `implements` are valid. Any other key (including DACI, `chosen-option`, `superseded-by`, `depended-on-by`, `implemented-by`, `format`, `ratified`, `related-prov-activity`) → fail loud with the offending key name and source file.
5. **Validate `status` enum.** MUST be one of `proposed | accepted | rejected | deprecated | superseded`. Lowercase exactly. Mixed case or other values → fail.
6. **Validate `date`.** MUST be ISO `YYYY-MM-DD`. Other formats → fail.
7. **Validate typed-slot list shape.** `supersedes` / `depends-on` / `implements` MUST be lists (or absent). Scalar values → fail. Each item MUST match `^(ADR|ODR)-\d{4}[a-m]?$`. Other forms → fail.
8. **Extract the file's own ID from the filename** (project-aware rules; apply in priority order):
   - **Primary** (post-rename canonical): `ADR-NNNN-<slug>.md` → ID = `ADR-NNNN`
   - **Sub-letter**: `ADR-NNNN<letter>-<slug>.md` → ID = `ADR-NNNN<letter>`
   - **Companion** (legacy migration tail): `ADR-NNNN.<descriptor>.md` → ID = `ADR-NNNN-<slug-of-descriptor>`
   - **Bare-prefix** (strict mode FAIL): `NNNN-<slug>.md` without `ADR-` → fail loud with "filename missing ADR- prefix" — corpus migration incomplete.
   - **Fallback** (no recognised pattern) → ID = full filename stem (without `.md`), slug-normalised. Warn loudly; this should never trigger on a clean corpus.

### 2.3b — Forward edges (strict)

For each typed-relation list, emit one edge per entry: `(source-id, predicate, target-id)`.

**Cross-corpus rule (HARD).** `supersedes` and `implements` targets MUST share the source's namespace prefix (ADR↔ADR or ODR↔ODR). Cross-corpus violations → fail loud with source ID, slot, and offending target. `depends-on` may cross corpora.

**Self-reference (HARD).** An ID MUST NOT appear in its own typed slots. Self-references → fail loud.

**Referential integrity (HARD).** Every typed-relation target MUST resolve to an existing record file:
- `ADR-NNNN` → `docs/adr/ADR-NNNN-*.md` (note: ADR- prefix, post-rename canonical)
- `ADR-NNNN<letter>` → `docs/adr/ADR-NNNN<letter>-*.md`
- `ODR-NNNN` → `docs/ontology/odr/ODR-NNNN*-*.md`

Missing targets → fail loud.

**Body-prose extraction is REMOVED.** No `Supersedes:` / `Depends on:` / `Related:` / `Amends` / `Builds on` Pass 1 fallback. No bare-ADR-NNNN Pass 2 fallback. No status-string supersession regex. The typed-relation graph is the frontmatter-typed graph, period.

### 2.3c — Derived inverses

For each forward edge `(A, p, B)`, emit the inverse `(B, p⁻¹, A)`:

| Forward | Inverse |
|---|---|
| `supersedes` | `superseded-by` |
| `depends-on` | `depended-on-by` |
| `implements` | `implemented-by` |

Inverses live alongside forward edges, scoped by namespace; **never authored**. The indexer is the only writer of inverse edges. Authored inverses are caught by step 2.3a-4 (whitelist).

Deduplicate edges — if the same `(from, to, relation)` triple is produced more than once, emit it only once.

### 2.3d — Record metadata

Alongside typed edges, emit a per-record metadata entry with the file's `status`, `date`, `tags`, file path, and last-modified timestamp. Idempotent on subsequent runs (upsert; no duplicates).

### Out of scope

- **No RDF emission, no JSON-LD context, no SHACL.** Linked Data deferred per ADR-0211.
- **No PROV-O sub-property declarations.**
- **No `related-legacy` advisory edges.** Council 411 dropped `related`; the strict-mode indexer does not emit advisory body-prose edges. If a project genuinely needs body-prose discovery, run `grep` directly.

## Steps

1. **Scan directory** — `Glob` for `docs/adr/ADR-*.md`. Skip `README.md`, `INDEX.md`, `_template.md`, and all subdirectories listed in 2.3a step 1.

2. **Parse each ADR** (strict — see 2.3a above). For each file:
   - **ID** from filename per 2.3a rule 8.
   - **Frontmatter validation** per 2.3a above (presence, key whitelist, enum validation, date format, list shape, ID format).
   - **Title** from the first H1 heading (`# Title`). MUST NOT have an `ADR-NNNN:` self-prefix; canonical MADR 4.x form has the number in the filename only. ADR with self-prefix → warning (not error; pre-existing form may persist on legacy migrated records); strip the prefix to get the title.
   - **Decision summary** (`## Decision Outcome` first paragraph, ~500 char cap).
   - **Considered options** (bullet list under `## Considered Options`).
   - **Consequences** (`### Consequences` flat bullets under `## Decision Outcome`, classified by `Good, because…` / `Bad, because…` / `Neutral, because…` leading prefix).
   - **Confirmation** (`### Confirmation` H3 under `## Decision Outcome`, ~500 char cap, optional).

2.5. **Uniqueness check** — After extracting IDs for ALL files, verify no two files mapped to the same ID. Collisions abort the index build with the colliding file paths.

3. **Store record metadata (contract 2.3d)** — For each ADR, call `mcp__ruflo__agentdb_hierarchical-store` with:
   - path: `adr/<adr-id>`
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
       "decision_summary": "<first paragraph of Decision Outcome, ~500 chars>",
       "considered_options": ["<option A>", "<option B>", ...],
       "consequences": { "good": [...], "bad": [...], "neutral": [...], "other": [...] },
       "confirmation": "<Confirmation section text, ~500 chars>",
       "file": "<filepath>",
       "mtime": "<ISO timestamp>"
     }
     ```

4. **Build forward edges (contract 2.3b — strict)** — For each typed-relation slot in frontmatter, emit `(current, predicate, target)`. Apply hard rules: cross-corpus check, self-reference check, referential-integrity check. Any violation aborts the build.

5. **Build derived inverse edges (contract 2.3c)** — For each forward edge, emit the inverse. Deduplicate.

6. **Store in memory** — For each ADR, `mcp__ruflo__memory_store` in namespace `adr-patterns`, key `<adr-id>`, value `<title> — <body excerpt>`.

   **Body excerpt rule (canonical):** first paragraph of `## Context and Problem Statement` (~500 chars). Skip frontmatter, H1, blank lines, tables, lists. If the section is missing or empty → fail loud (Phase 3.3 ensures all ADRs have this section; missing = drift).

7. **Verify graph** — Call `mcp__ruflo__agentdb_causal-query`:

   - **Orphan-edge check** — every forward edge whose target file does not exist is reported. On a clean Phase-3-migrated corpus this is always zero (referential integrity is enforced at step 4). Non-zero indicates filesystem drift between parse and emit.
   - **Circular supersedes chains** — should be impossible (intra-corpus, acyclic); cycles → fail.
   - **Status consistency** — superseded ADRs MUST have a `supersedes` edge from their successor (i.e. successor's `supersedes:` slot lists them) AND status `superseded`. Mismatches → fail.

8. **Report** — Output:

   ```
   ## ADR Index Summary

   Namespace: adr/
   Total ADRs: N

   By status:
   - proposed: X
   - accepted: Y
   - deprecated: Z
   - superseded: W
   - rejected: R

   Tag distribution (top 10):
   - <tag>: <count>
   ...

   Typed relations:
   - supersedes / superseded-by: A
   - depends-on / depended-on-by: B
   - implements / implemented-by: C

   Cross-corpus depends-on (allowed): E

   Issues found: 0 (strict mode; any failure would have aborted the build above)
   ```

## Notes on the strict-mode shift

This skill was tightened for Council 414/415 + Phase 3 migrated corpora (post-2026-05-09 ADR-0211 ratification) AND for the post-ADR-prefix-rename shape (2026-05-10). The previous permissive mode tolerated:

- Legacy bullet-list metadata fallback parser
- Silent DACI / `chosen-option` field tolerance
- Body-prose Pass 1 + Pass 2 typed-relation extraction
- Status-string supersession regex (`^superseded by ADR-NNNN`)
- `related-legacy` advisory edges
- Bare-prefix filenames (`NNNN-slug.md` without `ADR-` prefix)

All of those are removed. If you need to onboard a project whose ADR corpus is not yet migrated, run the migration scripts in ADR-0211 §Phase 3 first (frontmatter conversion, DACI removal, typed-prose lift), then run the ADR-prefix rename. Then run this strict indexer.

The strict mode is symmetric with `odr-index`'s strict mode — same predicates, same edge model, same DCAP-style enforcement; only the namespace and filename pattern differ. A clean run produces zero warnings and zero advisory output.
