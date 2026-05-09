---
name: adr-create
description: Create a new Architecture Decision Record with sequential numbering (ADR- prefixed filename) and AgentDB registration
argument-hint: "<title>"
allowed-tools: mcp__ruflo__agentdb_hierarchical-store mcp__ruflo__agentdb_hierarchical-query mcp__ruflo__agentdb_causal-edge mcp__ruflo__memory_store mcp__ruflo__memory_search Bash Read Write Edit Grep Glob
---

# Create ADR

Create a new Architecture Decision Record with the next sequential number, register it in the AgentDB graph, and link it to related ADRs.

## When to use

When a significant architectural decision needs to be recorded -- new technology adoption, API design choices, data model changes, infrastructure decisions, or any cross-cutting concern that affects multiple components.

## Format

ADRs follow canonical MADR 4.x (https://adr.github.io/madr/) with two project extensions:

- A `tags:` frontmatter field for cross-cutting categorisation
- Three typed-relation frontmatter slots: `supersedes:`, `depends-on:`, `implements:`

DACI fields (`decision-makers:`, `consulted:`, `informed:`) are NOT emitted (dropped per Council 415, 2026-05-09 — git log is the canonical authorship surface).

- **Filename**: `docs/adr/ADR-NNNN-<slug>.md` — the project-canonical form. Every ADR file carries the `ADR-` prefix to make references unambiguous (both ADR and ODR corpora share the same numeric range; the prefix disambiguates without requiring context). 4-digit zero-padded number, lowercase kebab-case slug derived from the title.
  - This deviates slightly from canonical MADR (which uses bare `NNNN-slug.md`); the deviation is deliberate. Symmetric with `docs/ontology/odr/ODR-NNNN-<slug>.md` on the ODR side.
- **H1**: `# <Title>` — title only, NO `ADR-NNNN:` prefix. The number lives in the filename.
- **Metadata**: YAML frontmatter (NOT bullet-list metadata under H1).
- **Status enum**: `proposed | accepted | rejected | deprecated | superseded by ADR-NNNN`. Lowercase exactly as listed.
- **Required sections**: `## Context and Problem Statement`, `## Considered Options` (bullet list), `## Decision Outcome` containing `### Consequences` (flat bullets) and `### Confirmation`.
- **Optional sections**: `## Decision Drivers`, `## Pros and Cons of the Options` (with `### {Option}` per option), `## More Information`.
- **Optional named extensions** (after `## More Information` in trailing position, project-specific): `## Rules`, `## Vote and Dissent`, `## Amendments`, `## Mapping`. Use sparingly; the canonical sections do most of the work.

## Typed-relation frontmatter (Council 414, 2026-05-09)

The three predicates are flat lists of record IDs:

| Slot | Semantics | Cross-corpus rule |
|---|---|---|
| `supersedes:` | Replaces — kills the prior | Intra-corpus only (ADR↔ADR; ODR↔ODR) |
| `depends-on:` | Cites — correctness/coherence requires the cited record to hold | Cross-corpus allowed (ADR↔ODR) |
| `implements:` | Realises — this ADR is the technical artefact realising a parent decision | Intra-corpus only (ADR→ADR) |

Predicates dropped during the deliberation: `related` (Council 411 — too vague), the `kind:` qualifier on `depends-on` (Council 413 — record-type prefix already encodes the distinction), `amends` and `refines` (Council 414 — `supersedes` already covers the modifying case; `## Supersession scope:` body subsection captures partial supersession).

Inverse properties (`superseded-by`, `depended-on-by`, `implemented-by`) are derived at index time by `adr-index` from the forward-direction edges. **Authoring inverses in frontmatter is forbidden** — single source of truth.

For partial supersession, the superseding record carries a `## Supersession scope:` subsection inside `## Decision Outcome` describing what survives.

## Steps

1. **Find next number** -- `Glob` for `docs/adr/ADR-*.md` and parse the 4-digit number (after the `ADR-` prefix) from each filename to determine the next sequential ID (e.g. `0226` if the highest existing is `0225`). Filter out non-ADR files (`README.md`, `INDEX.md`, `_template.md`) and subdirectories. Create `docs/adr/` if it does not exist.

2. **Slugify title** -- Convert the title argument to a lowercase, hyphen-separated slug (e.g., "Use PostgreSQL for persistence" becomes `use-postgresql-for-persistence`). Drop punctuation; collapse runs of hyphens.

3. **Create ADR file** -- `Write` the file at `docs/adr/ADR-NNNN-<slug>.md` (with the `ADR-` prefix) using the canonical MADR template:

   ```markdown
   ---
   status: proposed
   date: <today's date YYYY-MM-DD>
   tags: []
   supersedes: []
   depends-on: []
   implements: []
   ---

   # <Title>

   ## Context and Problem Statement

   <!-- What is the issue that motivates this decision? Describe the situation and the question. -->

   ## Decision Drivers

   <!-- Optional. Forces shaping the decision: constraints, qualities, stakeholder concerns. Bullet list. -->

   * <driver 1>
   * <driver 2>

   ## Considered Options

   <!-- Bullet list of alternatives evaluated. One option per line. List the chosen option alongside rejected ones. -->

   * <Option A> — <brief description>
   * <Option B> — <brief description>

   ## Decision Outcome

   Chosen option: "<Option A>", because <justification — why this option meets the decision drivers, satisfies the K.O. criteria, or comes out best>.

   ### Consequences

   <!-- Flat bullet list. Use canonical phrasing: "* Good, because …" / "* Bad, because …" / "* Neutral, because …" -->

   * Good, because <positive consequence>
   * Bad, because <negative consequence>
   * Neutral, because <neutral consequence>

   ### Confirmation

   <!-- Optional. How compliance with this decision is verified (review, ArchUnit test, lint rule, etc.). -->

   ## Pros and Cons of the Options

   <!-- Optional. Per-option deliberation detail. H3 per option. -->

   ### <Option A>

   * Good, because <argument>
   * Bad, because <argument>

   ### <Option B>

   * Good, because <argument>
   * Bad, because <argument>

   ## More Information

   <!-- Optional. Links, related ADRs, supporting evidence. -->
   ```

4. **Store in AgentDB** -- Call `mcp__ruflo__agentdb_hierarchical-store` with:
   - path: `adr/ADR-NNNN`
   - value: `{ "id": "ADR-NNNN", "title": "<title>", "status": "proposed", "date": "<today>", "tags": [], "supersedes": [], "depends-on": [], "implements": [], "file": "docs/adr/ADR-NNNN-<slug>.md" }`

5. **Find related ADRs** -- Call `mcp__ruflo__memory_search` with the title as query in namespace `adr-patterns` to find related decisions. If matches found, add them to the `## More Information` section as human-readable references AND, if the match represents a typed dependency the new ADR will rely on, suggest adding the cited ADR to `depends-on:` or `implements:` (as appropriate).

6. **Store pattern** -- Call `mcp__ruflo__memory_store` in namespace `adr-patterns` with key `ADR-NNNN` and the title + context as value for future semantic search.

7. **Report** -- Output the created file path, ADR number, and any related ADRs found.

## Notes

- The `tags` frontmatter field is a project extension to canonical MADR for cross-cutting categorisation (e.g. `tags: [security, infrastructure]`). Optional — leave as `[]` if unused.
- For supersession, set `status: superseded` AND list the superseding ADR's ID in the new ADR's `supersedes:` slot. Reference the superseded ADR in `## More Information`. Both directions of the edge are derived by `adr-index` from `supersedes:` (forward) and emitted as `superseded-by` (inverse).
- The `### Confirmation` section is optional in canonical MADR but recommended — it answers "how do we know this decision is being followed?"
- If an ADR has only one viable option, list it alone in `## Considered Options` and explain in `## Decision Outcome` why no alternatives were considered.
- DACI fields (`decision-makers`, `consulted`, `informed`) are intentionally NOT emitted. Authorship is git's job (`git log --follow <file>`); single-author projects gain zero marginal information from per-record DACI block. If a project genuinely needs multi-decision-maker attestation, record it in `## More Information` body prose, not frontmatter.
- The cross-corpus modifying-relations rule is enforced by `adr-review` (and `odr-review` on the ODR side): `supersedes:` and `implements:` MUST be intra-corpus; `depends-on:` MAY cross corpora. The lint blocks PRs/commits that violate this.
- The `ADR-` filename prefix is project-canonical, deviating from MADR's bare `NNNN-` form. The deviation buys unambiguous cross-corpus references (every `ADR-NNNN` and `ODR-NNNN` is self-identifying without context). Symmetric with the ODR side.
