---
name: odr-index
description: Build or rebuild the ODR index and dependency graph in AgentDB (strict mode — unified MADR DCAP: 6 required + 3 optional frontmatter keys, MADR body spine, matching odr-create / odr-review)
argument-hint: ""
allowed-tools: mcp__ruflo__agentdb_hierarchical-store mcp__ruflo__agentdb_hierarchical-query mcp__ruflo__agentdb_causal-edge mcp__ruflo__agentdb_causal-query mcp__ruflo__memory_store mcp__ruflo__memory_search Bash Read Grep Glob
---

# ODR Index

Build or rebuild the full ODR index and dependency graph in AgentDB from the `docs/ontology/odr/` directory. **Strict mode** — assumes the corpus conforms to the project DCAP (`docs/ontology/odr/DCAP.md`): the **unified MADR shape** (six required frontmatter keys + three optional project-extension keys; canonical MADR body spine + named extensions) that `odr-create` emits and `odr-review` lints. Fails loud on non-conforming content.

Symmetric with `adr-index` on the ADR side; writes into the `odr/*` namespace alongside `adr/*`. **semantic-modelling and opda share this one unified ODR format** — canonical [MADR 4.x](https://adr.github.io/madr/) body, matching both projects' ADR corpora. This indexer's accepted shape MUST stay in lockstep with `odr-create` (the emitter) and `odr-review` (the linter), and the live `docs/ontology/odr/DCAP.md` is the authority.

## When to use

After importing ODRs from another project, when the AgentDB graph is out of sync, or when bootstrapping ODR tracking on an existing codebase. The DCAP at `docs/ontology/odr/DCAP.md` is the prose normative spec; this skill enforces the same shape at index time that `odr-review` enforces at lint time and that `odr-create` produces.

## Format ODRs MUST follow (unified MADR DCAP)

Frontmatter (YAML) keys are a **whitelist of nine** — **six required**, three optional project-extensions:

- `status` — enum: `proposed | accepted | rejected | deprecated | superseded` (**required**, exactly 1)
- `date` — ISO date `YYYY-MM-DD` (**required**, exactly 1)
- `tags` — list of strings; may be empty `[]` (**required**)
- `supersedes` — list of intra-corpus ODR IDs; may be empty (**required**)
- `depends-on` — list of ODR or ADR IDs, cross-corpus allowed; may be empty (**required**)
- `implements` — list of ODR IDs or external schema URIs; may be empty (**required**)
- `kind` — enum: `methodology | architecture | pattern | mapping | programme` (**optional** project-extension; opda uses it, semantic-modelling omits it)
- `scope` — list of typed source-data refs (e.g. `pdtf-v3:propertyPack.titleNumber`); may be empty (**optional** project-extension)
- `council` — session identifier (e.g. `session-001`) when council-derived (**optional** project-extension)

No key outside the nine is permitted. The optional three are validated for shape/enum **only when present** — a record that omits them (semantic-modelling) is fully conformant.

Body follows the **canonical MADR spine + named extensions**, in this order. Required sections must be present; optional sections may be omitted; no undeclared H2 headings:

| Order | H2 heading | Required |
|---|---|---|
| 1 | `## Context and Problem Statement` | yes |
| 2 | `## Decision Drivers` | no |
| 3 | `## Considered Options` | yes |
| 4 | `## Decision Outcome` | yes |
| 5 | `## Pros and Cons of the Options` | no |
| 6 | `## More Information` | no |
| 7 | `## Rules` (named extension) | no |
| 8 | `## Vote and Dissent` (named extension) | no |
| 9 | `## Amendments` (named extension) | no |
| 10 | `## Mapping` (named extension) | no |

Under `## Decision Outcome`, the only valid H3s are `### Consequences` (**required**), `### Confirmation` (optional), and `### Supersession scope:` (optional). `### Consequences` is a flat bullet list — **no `### Good` / `### Bad` / `### Neutral` subheadings at any level**. Under `## Pros and Cons of the Options`, one `### <Option>` H3 per option. Other H3s are free-form within their section.

The strict-mode indexer does **not** tolerate any of the following — each is a hard failure:

- Files without YAML frontmatter
- **Undeclared frontmatter keys** — only the nine above are valid; any other key fails with the offending key name
- Missing any of the six **required** keys (`status`, `date`, `tags`, `supersedes`, `depends-on`, `implements`)
- **DACI fields** (`deciders:`, `consulted:`, `informed:`, `decision-makers:`, `author:`) — git log is the authorship record
- **Authored inverse properties** (`superseded-by:`, `depended-on-by:`, `implemented-by:`) — derived at index time, never authored
- Invalid `status` enum, invalid `kind` enum (when present), or non-ISO `date`
- Typed slots (`tags` / `scope` / `supersedes` / `depends-on` / `implements`) that are not lists
- **Wrong body shape** — missing required H2 sections, undeclared H2 headings, out-of-order sections, missing `### Consequences` under `## Decision Outcome`, or any `### Good`/`### Bad`/`### Neutral` consequence subheading. The legacy six-section `## Context / ## Decision / ## Rules / ## Alternatives / ## Consequences / ## References` spine is the **pre-unification** shape and fails here — migrate it to MADR.
- An H1 with an `ODR-NNNN:` prefix
- Cross-corpus `supersedes:` (must be intra-ODR); cross-corpus intra-ref `implements:` (ODR refs intra-ODR; external URIs pass-through)
- Self-references in typed slots
- Orphan references (intra-corpus refs that don't resolve to a record file)
- `council:` set but no matching `council/<value>-*.md` transcript

Required file shape (semantic-modelling — six-key core; opda adds the optional keys):

```markdown
---
status: proposed | accepted | rejected | deprecated | superseded
date: YYYY-MM-DD
tags: [tag1, tag2]
supersedes: [ODR-NNNN, ...]
depends-on: [ODR-NNNN, ADR-NNNN, ...]
implements: [ODR-NNNN, pdtf-v3:propertyPack.agents, ...]
# optional project-extension keys (opda):
# kind: methodology | architecture | pattern | mapping | programme
# scope: [pdtf-v3:propertyPack.titleNumber, ...]
# council: session-NNN
---

# <Title>

## Context and Problem Statement
...

## Considered Options
...

## Decision Outcome
Chosen option: "...", because ...

### Consequences
* Good, because ...
* Bad, because ...

## More Information
...
```

(Optional `## Rules`, `## Vote and Dissent`, `## Amendments`, `## Mapping` named extensions trail the spine when present.)

## Indexer contract (input → forward edges → derived inverses → record metadata)

Writes into the `odr/*` namespace.

### Input parsing (strict)

For each `.md` file in `docs/ontology/odr/` (namespace `odr`):

1. Skip filenames `README.md`, `INDEX.md`, `_template.md`, `DCAP.md`, `DCAP-audit-log.md`, and the entire `council/` subdirectory. Skip any other documented non-ODR file the DCAP/README names as exempt (e.g. a `DCAP-undeclared-extension-test.md` lint fixture, an `ONT-*` register).
2. **Verify YAML frontmatter is present.** File MUST start with `---\n`. No frontmatter → fail.
3. **Parse YAML** via a YAML library (NOT regex). Malformed YAML → fail loud with file path and parse error.
4. **Whitelist frontmatter keys** per DCAP. Only `status`, `date`, `tags`, `supersedes`, `depends-on`, `implements` (required) and `kind`, `scope`, `council` (optional) are valid. Any other key (DACI fields, inverse properties, anything else) → fail loud with the offending key name. Missing a required key → fail.
5. **Validate `status` enum.** One of `proposed | accepted | rejected | deprecated | superseded`. Lowercase exactly.
6. **Validate `kind` enum if present.** One of `methodology | architecture | pattern | mapping | programme`. Absent → fine.
7. **Validate `date`.** ISO `YYYY-MM-DD`.
8. **Validate list shapes.** `tags`, `supersedes`, `depends-on`, `implements` MUST be lists. `scope` (if present) MUST be a list of typed source-data refs / strings.
9. **Validate intra-corpus ref shape.** Items in `supersedes` MUST match `^ODR-\d{4}[a-z]?$`. Items in `depends-on` MUST match `^(ADR|ODR)-\d{4}[a-z]?$` OR a qualified cross-repo form `^semantic-(app|learn) ADR-\d{4}( \(formerly [A-Z]+-\d{4}\))?$`. Items in `implements` either match `^ODR-\d{4}[a-z]?$` (intra-corpus) OR an external schema URI `^[a-z][a-z0-9-]*:[A-Za-z0-9_.-]+$` (pass-through).
10. **Validate H2 section conformance.** H2 headings MUST be a subset of the declared set (`Context and Problem Statement`, `Decision Drivers`, `Considered Options`, `Decision Outcome`, `Pros and Cons of the Options`, `More Information`, `Rules`, `Vote and Dissent`, `Amendments`, `Mapping`), in declared order, each at most once; the three required sections present; `### Consequences` present under `## Decision Outcome`; no `### Good`/`### Bad`/`### Neutral` consequence subheadings. Missing-required, undeclared, duplicate, out-of-order, or a G/B/N subheading → fail with the offending heading.
11. **Council reference.** If `council:` is set, the session file `docs/ontology/odr/council/<council-value>-*.md` MUST exist → else fail. If `council:` is omitted, this check is satisfied (author-only decisions are first-class).
12. **Extract the file's own ID** from the filename: `ODR-NNNN-<slug>.md` → `ODR-NNNN`; sub-letter form (`ODR-0071a-...md`) → `ODR-0071a`.

### Forward edges (strict)

For each typed-relation list, emit one edge per entry: `(source-id, predicate, target-id)` via `mcp__ruflo__agentdb_causal-edge`.

**Cross-corpus rule (HARD).**
- `supersedes` targets MUST be ODR (intra-corpus). Cross-corpus → fail.
- `implements` intra-corpus refs (`ODR-NNNN`) MUST be ODR. ADR refs in `implements:` → fail.
- `implements` external URIs (e.g. `pdtf-v3:propertyPack.agents`) pass-through — emit a typed edge with predicate `realises-external`.
- `depends-on` may cross corpora freely (ODR ↔ ADR, including qualified cross-repo ADR refs).

**Self-reference (HARD).** An ID MUST NOT appear in its own typed slots → fail.

**Referential integrity (HARD).** Every intra-corpus typed-relation target MUST resolve to an existing record file:
- `ODR-NNNN` → `docs/ontology/odr/ODR-NNNN*-*.md`
- `ADR-NNNN` → `docs/adr/ADR-NNNN*-*.md`
- Qualified cross-repo `semantic-(app|learn) ADR-NNNN` → resolved against the named sibling repo's `docs/adr/` (or accepted via the repo's MIGRATION-MAP); external schema URIs in `implements:` pass-through without a resolution check.

Missing intra-corpus targets → fail loud.

### Derived inverses

For each forward edge `(A, p, B)`, emit the inverse `(B, p⁻¹, A)`:

| Forward | Inverse |
|---|---|
| `supersedes` | `superseded-by` |
| `depends-on` | `depended-on-by` |
| `implements` | `implemented-by` |
| `realises-external` | (no inverse — external URIs are not indexed records) |

Inverses live alongside forward edges, scoped by namespace; **never authored** — the indexer is the only writer of inverse edges. Deduplicate.

### Record metadata

Per-record entry mirroring `odr-create`'s `odr/ODR-NNNN` value (id / title / status / date / tags / supersedes / depends-on / implements / file, plus `kind` / `scope` / `council` **only when the record carries them**), plus the indexer's derived summaries. Idempotent on subsequent runs.

### Out of scope

- **No RDF emission, no JSON-LD context, no SHACL, no PROV-O sub-properties.** Forward-compatible with a future Linked Data lift; no lift performed.
- **No body-prose extraction beyond `decision_summary` + `rules_summary`.** The typed-relation graph is canonical-frontmatter-only.

## Steps

1. **Scan directory** — `Glob` for `docs/ontology/odr/ODR-*.md`. Skip the `council/` subdirectory and the meta/exempt files in input-parsing step 1.

2. **Parse each ODR** (strict — see input-parsing). For each file:
   - **ID** from filename.
   - **Frontmatter validation** (presence, key whitelist with 6 required, status enum, `kind` enum if present, date, list shapes, ref forms).
   - **Section validation** (declared-H2-subset, order, required sections, `### Consequences` present, no G/B/N subheadings).
   - **Title** from H1 (no `ODR-NNNN:` self-prefix).
   - **Decision summary** (first prose paragraph of `## Decision Outcome` — typically the `Chosen option: …` statement, ~500 char cap).
   - **Rules summary** (first chunk of `## Rules` if present, ~500 char cap, else empty).
   - **Council check** (`council:` set ⇒ session file exists).

2.5. **Uniqueness check** — no two files map to the same ID. Collisions abort the build.

3. **Store record metadata** — For each ODR, call `mcp__ruflo__agentdb_hierarchical-store` with key `odr/<id>`, tier `semantic`, and value (JSON, matching the `odr-create` step-5 record plus derived summaries; include `kind`/`scope`/`council` only when present):

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
     "decision_summary": "<first paragraph of ## Decision Outcome, ~500 chars>",
     "rules_summary": "<first chunk of ## Rules, ~500 chars or empty>",
     "file": "<filepath>",
     "mtime": "<ISO timestamp>"
   }
   ```

4. **Build forward edges (strict)** — For each typed-relation slot, emit `(current, predicate, target)` via `mcp__ruflo__agentdb_causal-edge`. Apply the cross-corpus, self-reference, and referential-integrity hard rules. Any violation aborts the build.

5. **Build derived inverse edges** — For each forward edge (excluding `realises-external`), emit the inverse via `mcp__ruflo__agentdb_causal-edge`. Deduplicate.

6. **Store in memory** — For each ODR, `mcp__ruflo__memory_store` in namespace `odr-patterns`, key `<id>`, value `<title> — <decision_summary>`.

7. **Verify graph** — Call `mcp__ruflo__agentdb_causal-query`:
   - **Orphan-edge check** — every forward edge whose target file does not exist (intra-corpus only). Should be zero (enforced at step 4).
   - **Circular supersedes chains** — intra-corpus, acyclic; cycles → fail.
   - **Status consistency** — `superseded` ODRs MUST have a `supersedes` edge from their successor AND status `superseded`. Mismatches → fail.
   - **Council-session resolution** — every `council:` value resolves to an existing `council/<value>-*.md` session file (enforced at parse; re-checked here).

8. **Report** — Output:

   ```
   ## ODR Index Summary

   Namespace: odr/
   Total ODRs: N

   By status:
   - proposed: X · accepted: Y · deprecated: Z · superseded: W · rejected: R

   By kind (where recorded):
   - methodology / architecture / pattern / mapping / programme : counts (records omitting kind: U)

   Tag distribution (top 10):
   - <tag>: <count>

   Typed relations:
   - supersedes / superseded-by: A
   - depends-on / depended-on-by: B
   - implements / implemented-by: C
   - realises-external (external URIs): D

   Cross-corpus depends-on (ODR→ADR, allowed): E

   Council-derived ODRs (council: set): F of N

   Issues found: 0 (strict mode; any failure would have aborted above)
   ```

## Notes

A clean run produces zero errors. Any drift in the corpus surfaces as a hard error rather than a silent pass.

**Symmetry with `odr-review`.** This indexer enforces, at index time, the same DCAP shape that `odr-review` enforces at lint time:

- Lint 1 (cross-corpus modifying-relations) — enforced here at edge-emission time
- Lint 2 (referential integrity) — enforced here at edge-emission time
- Lint 3 (council reference) — enforced here at parse time (`council:` ⇒ session file exists)
- Lint 4 (DCAP profile conformance: nine-key whitelist with six required, MADR section spine, ordering, cardinality, enums) — enforced here at frontmatter + heading parse time
- Lint 5 (inverse-authoring prohibition) — enforced here at frontmatter parse time

`odr-review` additionally runs any project-specific content lints (e.g. opda's per-`kind` discipline, URI-shape, SHACL-AF / DPV placement). Those are body-content checks, not index concerns — this skill captures `kind` in the record (when present) so downstream tools can apply them, but does not re-run them.

## Format alignment

This skill MUST stay in lockstep with the unified project ODR format. When the DCAP changes, update all three together:

- `docs/ontology/odr/DCAP.md` — the prose normative spec (authority; one copy per repo, both describing the same unified format)
- `~/.claude/skills/odr-create/SKILL.md` — emits this exact six-required + three-optional-key / MADR-spine shape; its step-5 `odr/ODR-NNNN` record is the record metadata this indexer mirrors, and its step-7 `odr-patterns` memory store matches step 6 here
- `~/.claude/skills/odr-review/SKILL.md` — the symmetric lint skill (DCAP-driven)

## See also

- `docs/ontology/odr/DCAP.md` — the prose normative spec
- `~/.claude/skills/odr-review/SKILL.md` — symmetric lint skill (DCAP-driven; same format)
- `~/.claude/skills/odr-create/SKILL.md` — emits unified-shape ODRs + the AgentDB record this mirrors
- `~/.claude/skills/adr-index/SKILL.md` — symmetric ADR-side indexer (canonical MADR 4.x — same body spine, no `kind`/`scope`/`council`)
