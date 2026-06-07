---
name: odr-create
description: Create a new Ontology Decision Record (ODR) with sequential numbering and AgentDB registration
argument-hint: "<title>"
allowed-tools: mcp__ruflo__agentdb_hierarchical-store mcp__ruflo__agentdb_hierarchical-query mcp__ruflo__agentdb_causal-edge mcp__ruflo__memory_store mcp__ruflo__memory_search Bash Read Write Edit Grep Glob
---

# Create ODR

Create a new Ontology Decision Record with the next sequential number, register it in the AgentDB graph, and link it to related ODRs and ADRs.

## When to use

When an ontology design decision needs to be recorded. An ODR captures the *decision* (what was chosen) and any *rules* it produces (the normative artefact). It does NOT contain the deliberation — when a council session deliberated the decision, the session transcript lives separately in `council/session-NNN-*.md`; cite it from the ODR's `## Vote and Dissent` / `## More Information` body (or the optional `council:` frontmatter key where the project uses it). When the decision is author-only, no council reference is needed.

ODRs cover ontology-modelling decisions only. Schema-encoding decisions (how to express the ontology in JSON Schema, YAML, RDF, SHACL) belong on the ADR side — use `adr-create`.

## Format — unified MADR (semantic-modelling + opda)

The normative spec is the project's own `docs/ontology/odr/DCAP.md` — **read it in the repo you are authoring in.** semantic-modelling and opda share **one unified format**: canonical [MADR 4.x](https://adr.github.io/madr/) body + a six-key required frontmatter core plus three optional project-extension keys. (`odr-review` is DCAP-driven, so the live DCAP is always the authority; this template emits the unified shape.)

- **Filename**: `docs/ontology/odr/ODR-NNNN-<slug>.md` — 4-digit zero-padded number, lowercase kebab-case slug. Sub-letter suffixes (`ODR-0071a`) permitted for child records.
- **H1**: `# <Title>` — title only, no `ODR-NNNN:` prefix.
- **Metadata**: YAML frontmatter — six required keys + three optional project-extension keys (`kind`, `scope`, `council`).
- **Body**: MADR spine — `## Context and Problem Statement` → `## Considered Options` → `## Decision Outcome` (with a required `### Consequences` H3) — plus optional named extensions.

### Frontmatter

| Key | Required | Type | Rule |
|---|---|---|---|
| `status` | yes | enum | `proposed` \| `accepted` \| `rejected` \| `deprecated` \| `superseded` (lowercase) |
| `date` | yes | string | ISO `YYYY-MM-DD` |
| `tags` | yes | list | Cross-cutting categorisation. May be empty `[]` |
| `supersedes` | yes | list | ODR IDs replaced. Intra-corpus only (ODR↔ODR). May be empty |
| `depends-on` | yes | list | ODR or ADR IDs cited. Cross-corpus allowed (ODR↔ADR). May be empty |
| `implements` | yes | list | ODR IDs (intra-corpus) or external schema URIs (pass-through). May be empty |
| `kind` | **optional** | enum | `methodology` \| `architecture` \| `pattern` \| `mapping` \| `programme`. Project-extension |
| `scope` | **optional** | list | Typed source-data refs (e.g. `pdtf-v3:propertyPack.titleNumber`). Project-extension |
| `council` | **optional** | string | Session id (e.g. `session-001`) when council-derived. Project-extension |

**Project policy on the optional keys** (the shared schema treats them as optional; each repo may require them locally, enforced by its own DCAP):
- **opda** uses `kind` and `scope` (PDTF source-data traceability) and `council`.
- **semantic-modelling** omits all three — it classifies via `tags` and records council provenance in the `## Vote and Dissent` body extension. Don't add empty optional keys to sm ODRs.

### Kind enum (when used)

- `methodology` — decisions about how decisions are made
- `architecture` — framework decisions (namespace, governance, validation scheme)
- `pattern` — reusable modelling conventions
- `mapping` — specific source→ontology mappings
- `programme` — workplans, roadmaps, dependency graphs

### Body sections (MADR spine + named extensions, in DCAP order)

| Order | Heading | Required | What goes here |
|---|---|---|---|
| 1 | `## Context and Problem Statement` | yes | Why the decision was needed. The problem, not the chosen option. 1–3 paragraphs |
| 2 | `## Decision Drivers` | no | Bulleted forces (constraints, qualities, stakeholder concerns) |
| 3 | `## Considered Options` | yes | All options evaluated **including the chosen one alongside rejected alternatives** — never only the losers |
| 4 | `## Decision Outcome` | yes | `Chosen option: "X", because Y.` then prose. Contains the H3s below |
| 4.1 | `### Consequences` | yes (under §4) | Flat bullet list — `* Good, because … / * Bad, because … / * Neutral, because …`. NO Good/Bad/Neutral subheadings |
| 4.2 | `### Confirmation` | no | How compliance is verified |
| 4.3 | `### Supersession scope:` | no | When partial supersession applies — what survives |
| 5 | `## Pros and Cons of the Options` | no | Per-option deliberation detail (one `### <Option>` each) |
| 6 | `## More Information` | no | Links, related records, council transcript |
| 7 | `## Rules` | no (named ext) | Durable normative content scoped to this ODR (tables, Turtle, SHACL, conventions, anti-patterns) |
| 8 | `## Vote and Dissent` | no (named ext) | Compact council-verdict summary (full transcript in the `council/` sibling) |
| 9 | `## Amendments` | no (named ext) | Running list of post-acceptance amendments |
| 10 | `## Mapping` | no (named ext) | Absorbed `.code.md` companion matrices / mapping tables |

## Steps

1. **Find next number** — `Glob` for `docs/ontology/odr/ODR-*.md` and parse the 4-digit number after the `ODR-` prefix. Filter out `README.md`, `INDEX.md`, `_template.md`, `DCAP.md`, `DCAP-audit-log.md`. Allocate the next plain number unless the user requests a sub-letter explicitly.

2. **Slugify title** — Lowercase, hyphen-separated. Drop punctuation; collapse runs of hyphens.

3. **Optional keys** — If the repo's DCAP requires `kind` / `scope` (opda), determine them (ask about `kind` if not obvious from the title). If the repo omits them (semantic-modelling), skip — do not emit empty `kind`/`scope`/`council`.

4. **Create ODR file** — `Write` the file at `docs/ontology/odr/ODR-NNNN-<slug>.md` using this template (delete the commented optional-key lines unless the repo uses them):

   ```markdown
   ---
   status: proposed
   date: <today's date YYYY-MM-DD>
   tags: []
   supersedes: []
   depends-on: []
   implements: []
   # Optional project-extension keys — include only where the repo's DCAP uses them
   # (opda requires kind + scope; semantic-modelling omits all three):
   # kind: <methodology|architecture|pattern|mapping|programme>
   # scope: []          # typed source-data refs, e.g. pdtf-v3:propertyPack.titleNumber
   # council: session-NNN
   ---

   # <Title>

   ## Context and Problem Statement

   <!-- Why the decision was needed. 1–3 paragraphs. The problem, NOT the chosen option. -->

   ## Considered Options

   <!-- All options evaluated, INCLUDING the chosen one alongside the rejected alternatives.
        Never list only the losers — that invites confirmation-shaped records. -->

   * **Option A (chosen) — <name>.** <one line on what it is>
   * **Option B — <name>.** Rejected: <fatal flaw in one sentence>.

   ## Decision Outcome

   Chosen option: "<Option A>", because <one-sentence justification>.

   <!-- then body prose elaborating the decision -->

   ### Consequences

   * Good, because <…>
   * Bad, because <…>
   * Neutral, because <…>

   ## Rules

   <!-- OPTIONAL named extension. Normative content the decision produces: tables, Turtle,
        SHACL stubs, SKOS scheme links, naming conventions, anti-patterns. As long as needed.
        Omit the section entirely if the decision produces no durable rules. -->

   ## More Information

   <!-- OPTIONAL. Links: source-schema clauses, related ODRs/ADRs, external citations,
        and the council transcript (council/session-NNN-*.md) when the decision was deliberated. -->
   ```

5. **Store in AgentDB** — Call `mcp__ruflo__agentdb_hierarchical-store` with:
   - path: `odr/ODR-NNNN`
   - value: `{ "id": "ODR-NNNN", "title": "<title>", "status": "proposed", "date": "<today>", "tags": [], "supersedes": [], "depends-on": [], "implements": [], "file": "docs/ontology/odr/ODR-NNNN-<slug>.md" }` — include `"kind"`, `"scope"`, `"council"` **only when the ODR carries them**.

6. **Find related records** — Call `mcp__ruflo__memory_search` with the title in namespace `odr-patterns` (and `adr-patterns` if cross-corpus relevance is plausible). Add matches to `## More Information` as human-readable links; for typed dependencies, suggest adding to `depends-on:` or `implements:`.

7. **Store pattern** — Call `mcp__ruflo__memory_store` in namespace `odr-patterns` with key `ODR-NNNN` and the title + context as value for future semantic search.

8. **Report** — Output the created file path, ODR number, and any related records found.

## Notes

- Inverse properties (`superseded-by`, `depended-on-by`, `implemented-by`) are NEVER authored in frontmatter — they are derived at index time by `odr-index`.
- DACI fields (`deciders`, `consulted`, `informed`, `decision-makers`, `author`) are NOT emitted. Git log is the authorship record.
- The cross-corpus rule: `supersedes:` and intra-ODR `implements:` MUST stay intra-corpus; `depends-on:` and external-URI `implements:` may cross.
- Partial supersession is recorded in a `### Supersession scope:` H3 under `## Decision Outcome` (which entries of the prior survive) — there is no separate frontmatter field.
- The ODR/ADR boundary: ontology-modelling decisions are ODRs; schema-encoding decisions are ADRs.
- This skill MUST stay in lockstep with `~/.claude/skills/odr-index/SKILL.md` (the indexer) and each repo's `docs/ontology/odr/DCAP.md` (the authority). When the unified format changes, update all three together.
