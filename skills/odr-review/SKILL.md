---
name: odr-review
description: Lint ODR frontmatter, section structure, and references against the DCAP profile
argument-hint: "[--branch BRANCH] [--lint-only]"
allowed-tools: mcp__ruflo__agentdb_hierarchical-query mcp__ruflo__agentdb_causal-query mcp__ruflo__memory_search Bash Read Grep Glob
---

# ODR Review

Lint changed ODR frontmatter and section structure for cross-corpus modifying-relations violations, referential-integrity issues, and DCAP-conformance.

## When to use

Before committing or merging changes that touch `docs/ontology/odr/*.md`. Also as a periodic CI check across the full ODR corpus.

`--lint-only` skips DCAP profile-conformance and runs only the cross-corpus + referential-integrity lints (faster pre-commit hook).

## Lints

The DCAP at `docs/ontology/odr/DCAP.md` is the normative profile. This skill enforces five rules.

### Lint 1 — Cross-corpus modifying-relations

```python
# Pseudocode.
own_corpus = "ODR" if record.path.startswith("docs/ontology/odr/") else "ADR"

# supersedes: must be intra-corpus
for ref in record.frontmatter.get("supersedes", []):
    if not ref.startswith(own_corpus):
        fail(f"{record.id}: supersedes: {ref} crosses corpora (intra-corpus only)")

# implements: ODR refs intra-corpus; external URIs pass-through
for ref in record.frontmatter.get("implements", []):
    if ref.startswith(("ODR-", "ADR-")) and not ref.startswith(own_corpus):
        fail(f"{record.id}: implements: {ref} crosses ODR↔ADR (intra-corpus only for intra-corpus refs)")
    # External schema URIs (e.g. pdtf-v3:propertyPack.titleNumber) are allowed; no resolution check
```

`depends-on:` is intentionally NOT in the loop — it may cross corpora freely.

### Lint 2 — Referential integrity

For each `ODR-NNNN` reference in `supersedes`, `depends-on`, or `implements`:
- Resolve `ODR-NNNN` (and `ODR-NNNNa..m` sub-record forms) to a glob over `docs/ontology/odr/ODR-NNNN*-*.md`.
- Resolve `ADR-NNNN` to `docs/adr/NNNN-*.md` (and legacy companion patterns).
- If no file matches, fail loud with the source ODR ID, the relation slot, and the missing reference.

External schema URIs in `implements:` (anything not matching `^(ODR|ADR)-\d{4}[a-m]?$`) pass through without resolution check.

### Lint 3 — Council reference

If `council:` is set, the session file `docs/ontology/odr/council/<council-value>-*.md` MUST exist. Missing → fail.

If `council:` is omitted, this lint is satisfied (author-only decisions are first-class).

### Lint 4 — DCAP profile conformance

Skip if `--lint-only`. Read `docs/ontology/odr/DCAP.md`. For each changed ODR:

- **Frontmatter keys** MUST be a subset of: `status`, `date`, `kind`, `tags`, `scope`, `council`, `supersedes`, `depends-on`, `implements`. Required keys (all except `council`) MUST be present.
- **`status`** MUST be one of: `proposed`, `accepted`, `rejected`, `deprecated`, `superseded`.
- **`kind`** MUST be one of: `methodology`, `architecture`, `pattern`, `mapping`, `programme`.
- **`date`** MUST be ISO `YYYY-MM-DD`.
- **Typed-slot list shape**: `supersedes`/`depends-on`/`implements`/`scope`/`tags` MUST be lists.
- **H2 sections** follow the canonical **MADR 4.x spine plus named extensions** (the DCAP §Sections table is the authority — read it in the repo under review). H2 headings MUST be a subset of the declared set below, appear in this declared order, and each at most once. Required sections MUST be present; optional ones MAY be omitted; any undeclared H2 heading fails the lint.

  | # | Heading | Required |
  |---|---|---|
  | 1 | `## Context and Problem Statement` | yes |
  | 2 | `## Decision Drivers` | no |
  | 3 | `## Considered Options` | yes |
  | 4 | `## Decision Outcome` | yes (MUST contain a `### Consequences` H3; `### Confirmation` / `### Supersession scope:` optional) |
  | 5 | `## Pros and Cons of the Options` | no |
  | 6 | `## More Information` | no |
  | 7 | `## Rules` (named extension) | no |
  | 8 | `## Vote and Dissent` (named extension) | no |
  | 9 | `## Amendments` (named extension) | no |
  | 10 | `## Mapping` (named extension) | no |

  Missing required section, undeclared heading, wrong order, or duplicate → fail with the offending heading. (Pre-unification ODRs used a retired six-section `## Context / ## Decision / ## Rules / ## Alternatives / ## Consequences / ## References` spine — those must be migrated to the spine above, not validated against it.)
- **H1** MUST be present, MUST NOT carry an `ODR-NNNN:` prefix. The only content permitted between the H1 and the first H2 is a single optional status/supersession admonition blockquote (e.g. `> **SUPERSEDED …**`).

Any heading not declared in the DCAP fails this lint until the DCAP is updated in the same commit (undeclared-extension policy).

### Lint 5 — Inverse-authoring prohibition

Search the changed ODR's frontmatter for any of: `superseded-by:`, `depended-on-by:`, `implemented-by:`. If present, fail loud — these are derived at index time, not authored.

### Lint 6 — A9 per-kind discipline (pattern + mapping ODRs)

Source: [ODR-0001 §"What an ODR records" (Session A9 amendment, 2026-05-27)](../../../source/opda/docs/ontology/odr/ODR-0001-linked-data-council-methodology.md).

For records with `kind: pattern` or `kind: mapping`, the `## Rules` section MUST name three things:

1. **UFO/DOLCE meta-category** — a literal mention of one of: `Substance Kind`, `Endurant`, `NonPhysicalEndurant`, `Role`, `RoleMixin`, `Phase`, `Relator`, `Quality`, `Quale-in-Region`, `Quality Region`, `Quality Value`, `Substance Kind label`, `Method/plan code`, `Mode`. (The seven-category framework ratified at S011 Q8 plus the original four.)
2. **Identity Criterion (IC) over named hard cases** — at least two hard cases named verbatim (e.g. "demolition", "subdivision", "merger", "first-registration", "title closure", "register transfer"; or the record's equivalent).
3. **Artefact realisation** — explicit pointer to how the pattern manifests as engineering output (Turtle template, SHACL shape, generator rule, mapping table, etc.).

Severity: **warning** on `status: proposed`; **blocker** on `status: accepted`.

`kind: methodology | architecture | programme` are relaxed (per A9 §Per-kind discipline — only `pattern` and `mapping` carry the MUST).

### Lint 7 — URI-shape verification (layer convention from S004 Q2)

Source: [ODR-0004 §Rules.2 (layer-segregated naming)](../../../source/opda/docs/ontology/odr/ODR-0004-pdtf-ontology-foundation.md).

For records with `kind: pattern`, extract `(UFO category, class URI)` pairs from `## Rules` (text-based heuristic; look for `opda:<Name>` adjacent to a category mention). Verify the URI form matches the layer convention:

| UFO category | URI shape | Examples |
|---|---|---|
| Sortal/Kind, Substance Kind, Endurant | CamelCase noun | `opda:Property`, `opda:Person`, `opda:RegisteredTitle`, `opda:Address` |
| Role, RoleMixin | `<Kind>Role` or noun-ending-in-`-er` | `opda:Seller`, `opda:Proprietor`, `opda:Buyer`, `opda:ProprietorRole` |
| Phase | `<Kind>In<State>` | `opda:PropertyInListing`, `opda:TransactionInExchange` |
| Relator | relator-noun | `opda:Proprietorship`, `opda:Tenancy`, `opda:Transaction` |

Violations are reported as warnings — the heuristic is fragile; failures may be false positives in narrative prose. Authors override by inline-commenting the URI usage.

### Lint 8 — ODR-0017 SHACL-AF rule pattern verification

Source: [ODR-0017 — SHACL-AF Non-Blocking Data-Quality Rules Pattern](../../../source/opda/docs/ontology/odr/ODR-0017-shacl-af-quality-rules-pattern.md).

For records citing ODR-0017 in `implements:`, the `## Rules` section MUST name:

1. **Hard case** — the specific data-quality concern the SHACL-AF rule materialises (e.g. "UPRN succession chain", "deprecation lineage", "INSPIRE-only locatedness").
2. **Severity tier** — `sh:Info` for non-blocking advisory; `sh:Warning` allowed only when explicitly justified; `sh:Violation` is forbidden at the data-graph layer for this pattern (the ODR-0017 §2a amendment narrows `sh:Violation` to meta-shape-over-shape-graph drift only — see ODR-0013 §Q1).
3. **Non-blocking discipline** — explicit confirmation that the rule materialises into the annotation graph (not the data graph) and does not block validation.

Severity: **blocker** on `status: accepted`.

### Lint 9 — ODR-0018 DPV co-annotation placement

Source: [ODR-0018 — DPV Class-Level Co-Annotation Pattern](../../../source/opda/docs/ontology/odr/ODR-0018-dpv-class-level-coannotation-pattern.md).

For records citing ODR-0018 in `implements:`, the `## Rules` section MUST place DPV co-annotations (e.g. `dpv-pd:hasPersonalDataCategory`) in the annotation graph (`opda-annotations.ttl`), NOT in the class graph (`opda-classes.ttl`) or the shapes graph (`opda-shapes.ttl`). Lint inspects the prose for the placement claim. CI tests against the three-graph separation rule (ODR-0004 §3a five-part CI test) are the authoritative enforcement; this lint is a documentation guard.

Severity: **warning** (documentation-level; CI enforces the actual placement).

## Steps

1. **Identify changed records** — Run `git diff --name-only main...HEAD` (or the specified branch) and filter for `docs/ontology/odr/ODR-*.md`. Skip `README.md`, `DCAP.md`, `DCAP-audit-log.md`, council session siblings (`council/`), and `_template.md`. If no record changes, exit 0.

2. **Parse YAML frontmatter** — For each changed ODR file, `Read` and parse YAML between the leading `---` fences. If frontmatter is malformed, fail loud (exit non-zero).

3. **Run Lint 1 (cross-corpus modifying-relations)** — As specified above.

4. **Run Lint 2 (referential integrity)** — As specified above.

5. **Run Lint 3 (council reference)** — As specified above.

6. **Run Lint 4 (DCAP profile conformance)** — Skip if `--lint-only`. Read `docs/ontology/odr/DCAP.md`. Compare frontmatter keys, section headings, ordering, cardinality.

7. **Run Lint 5 (inverse-authoring prohibition)** — As specified above.

8. **Run Lint 6 (A9 per-kind discipline)** — As specified above. Skip records where `kind` is not `pattern` or `mapping`.

9. **Run Lint 7 (URI-shape verification)** — As specified above. Skip records where `kind` is not `pattern`. Heuristic failures are warnings, not blockers.

10. **Run Lint 8 (ODR-0017 SHACL-AF rule pattern)** — As specified above. Skip records that do not cite ODR-0017 in `implements:`.

11. **Run Lint 9 (ODR-0018 DPV co-annotation placement)** — As specified above. Skip records that do not cite ODR-0018 in `implements:`.

12. **Report** — If any lint failed, exit non-zero with a structured report:

   ```
   ## ODR Lint Report

   ### Cross-corpus modifying-relations violations
   - <record-id>: <relation>: <crossing-ref>

   ### Missing reference targets
   - <record-id>: <relation>: <missing-ref> — no file matches

   ### Missing council session
   - <record-id>: council: <value> — no session file under council/

   ### DCAP-conformance violations
   - <record-id>: undeclared section: <heading>
   - <record-id>: section ordering violation: <expected> before <actual>
   - <record-id>: cardinality violation: multiple <heading>
   - <record-id>: missing required section: <heading>

   ### Inverse-authoring violations
   - <record-id>: authored <inverse-relation> — derived at index time only

   ### A9 per-kind discipline violations (Lint 6)
   - <record-id> [kind: pattern|mapping]: missing UFO/DOLCE meta-category in §Rules
   - <record-id> [kind: pattern|mapping]: missing IC over named hard cases in §Rules
   - <record-id> [kind: pattern|mapping]: missing artefact realisation pointer in §Rules

   ### URI-shape violations (Lint 7 — warnings)
   - <record-id>: <uri> declared as <category> but URI form does not match <expected-pattern>

   ### ODR-0017 SHACL-AF pattern violations (Lint 8)
   - <record-id>: cites ODR-0017 but §Rules missing <hard-case|severity-tier|non-blocking-discipline>

   ### ODR-0018 DPV co-annotation placement violations (Lint 9 — warnings)
   - <record-id>: cites ODR-0018 but §Rules does not place co-annotations in opda-annotations.ttl
   ```

   On clean run: exit 0 with `(no issues found)`.

## Notes

- The DCAP at `docs/ontology/odr/DCAP.md` is the prose normative spec. New extensions or section moves require a DCAP edit in the same commit.
- The DCAP audit log at `docs/ontology/odr/DCAP-audit-log.md` records review entries — even when no changes were made.
- This lint is a *text-based* check. SHACL shape graphs and pySHACL CI are explicitly out of scope; the DCAP-conformance lint is the prose-equivalent.
- Symmetry with `adr-review`: this skill is the ODR-side counterpart. The cross-corpus rule is enforced from both directions.
