---
name: council
description: Convene a dialectic expert-panel review (the Linked Data Council Hive) on an ontology/ADR/ODR proposition or a set of outstanding questions, then produce a session record. Use when a modelling decision has a credible split, a contested mapping or identity-criterion question needs adjudicating, or a precedent needs recording. Spawns a SCOPED panel via the Agent tool (Queen + Devil's Advocate + only the relevant experts), collects per-question verdicts, writes the synthesis, and routes dispositions to the ODRs/ADRs.
argument-hint: "<proposition or question(s) under review>"
allowed-tools: Task Read Write Edit Grep Glob Bash mcp__ruflo__memory_search mcp__ruflo__memory_store mcp__ruflo__hive-mind_init mcp__ruflo__hive-mind_spawn mcp__ruflo__hive-mind_consensus mcp__ruflo__hive-mind_memory
---

# Convene a Council

Run a dialectic review of a proposition by a panel of named linked-data / ontology authorities — one Queen (Moderator), one Devil's Advocate, and the genuinely-relevant standing or extended experts — citing their published positions, producing per-question verdicts (AFFIRM / REVISE / REJECT) and an auditable session record. This is the codification of the **Council Hive** methodology. The methodology — [`reference/methodology.md`](reference/methodology.md) — is the source of truth carried by this skill; this file is the operating procedure. The per-project adoption slots (panel weighting, governance handoff, track record) are described there and templated in [`reference/adoption-template.md`](reference/adoption-template.md).

## When to use

When a linked-data / ontology decision warrants multi-perspective deliberation: URI/namespace/serialization choices; competing W3C patterns (OWL vs SKOS vs SHACL; reification vs RDF-star); OWL/SHACL/SKOS/PROV-O/DPV semantic questions; bounded-context boundaries; mapping conventions to external standards (FIBO, INSPIRE, GeoSPARQL, schema.org); identity-criterion questions; vocabulary-catalogue admission; or a cross-cutting coherence review of several records. Also when *recording* a decision the methodology or precedent has already settled (Author-only tier — no panel).

**Do NOT convene for**: routine class/property additions that fit an established pattern; SHACL authoring from an existing template; editorial fixes; or real-world stakeholder consultation (that is the project's governance, not a simulated panel). The Council shapes *proposals*; the operator ratifies *adoption*. See the methodology §When NOT to use.

## CRITICAL design constraints (read before convening)

### 1. Mechanism is agent fan-out, NOT hive-mind

This project convenes councils by spawning named-persona background agents via the **`Task`** tool (Claude's `Agent`/sub-agent mechanism) in ONE message — each returns a structured position; the Queen then writes the synthesis. This is `consensus-mode: agent-fan-out`, the default. **Do NOT reach for `hive-mind_spawn`** — it is reserved and costly. Escalate to a hive-mind consensus-mode ONLY when a specific trigger fires:

- **`hive-mind/byzantine`** — a verdict on one question is *conditional* on the verdict on another (e.g. multi-condition DA withdrawals where the structural vote acknowledgement matters).
- **`hive-mind/typed-output`** — the verdict produces a *structured object consumed by downstream tooling* (a generator, a linter, an LLM retriever) where the tally is data, not decoration.

For everything else, fan-out. The substrate detail (when each hive-mind mode applies, the full consensus-mode table) is in [`reference/consensus-modes.md`](reference/consensus-modes.md).

### 2. Scope discipline — pick the CHEAPEST adequate tier; do not pad the panel

The Queen runs a pre-flight scope check and selects the smallest format tier that covers the decision. **Never spawn all nine for show.** Three tiers:

- **Author-only** (~1 run) — recording a decision precedent/methodology has already settled; sequencing/index work; no credible split. The Queen drafts the record directly; no panel.
- **Reduced Council** (~3–4 runs) — an amendment or ratification disputed on a narrow axis. Queen + DA + 1–2 panellists on the disputed questions only.
- **Full Council** (~8 runs) — a substantive decision with a credible split spanning multiple expertise clusters. Queen + DA + up to 6 panellists.

Choose the tier by the proposition's shape, then choose the *roster* by which expertise the questions genuinely touch. A SHACL-recursion question needs Knublauch, not Baker; an identity / class-vs-value question needs Guizzardi/Guarino, not Moreau. The full roster, the extended-guest table, and the per-tier apparatus are in [`reference/panel-roster.md`](reference/panel-roster.md). "Do not pad the panel for show" (the methodology §Extended Panel).

## Procedure

The full lifecycle is the methodology §Session Protocol. The five operating steps:

### Step 1 — Frame the proposition

State, in a convening block: the proposition; the 3–8 outstanding question(s) (more than 8 is a sign to split scope); the input documents (paths/URLs — the TTL/shapes under review, the data dictionary, prior sessions); the prior related ODRs/ADRs; and any constraints (deadlines, dependencies, blocked emissions). Identify which artefacts/mappings are under review.

### Step 2 — Pre-flight scope check → declare tier, consensus-mode, roster

The Queen runs the 5-minute scope check (the methodology §Pre-flight scope check). Three outcomes: **ratify-as-is** (proceed) / **re-scope** (too narrow → fold; too broad → split) / **retire** (wrong unit of decision → mark the record `rejected` with a pointer). Then declare, explicitly:

- **Format tier** — Author-only / Reduced / Full (constraint 2 above).
- **`consensus-mode`** — `agent-fan-out` default; a hive-mind mode only on the constraint-1 trigger; `none` for Author-only.
- **Roster** — name the **Queen** (Moderator; frames, sequences, votes, synthesises), the **Devil's Advocate** (named; argues the strongest case AGAINST), and the panellists. The DA-selection criterion is load-bearing: the DA's *published methodology* must be genuinely opposed to the proposition's framing, not merely orthogonal (the methodology §Roles → "DA selection criterion"). Pick experts whose expertise the questions touch; leave the rest out.

If the scope check surfaces a finding that would invalidate multiple sessions, escalate to a **meta-Council** (`scope-check-N-<slug>.md`) before proceeding.

For Author-only, skip to Step 4 — the Queen drafts directly.

### Step 3 — Spawn the panel in ONE message

Spawn the panel as background `Task` agents **in a single message** (parallel fan-out is a barrier on the slowest agent, not the sum — sequential spawning is a methodology violation; the methodology §Session protocol rule 10). Each agent's prompt carries: its persona's published-position lens; the shared brief (proposition + questions + input docs); the per-question verdict format; and, for the DA, the instruction to attack. The agent-prompt template (persona lens, brief, verdict shape, DA framing) is in [`reference/agent-brief-template.md`](reference/agent-brief-template.md).

Cross-talk: the recommended default is direct agent-to-agent messaging via Agent Teams (`SendMessage`, `team_name: "<council-id>"`) so experts respond to peers before settling — the multi-round dialectic the Council exists to produce (the methodology §Cross-talk transport). Where Agent Teams is unavailable, fall back to file-based positions (one opening + one rebuttal pass) or, only when peer-revision is genuinely out of scope, queen-composed. Working files (Full/Reduced) live at `docs/ontology/odr/council/working/session-NNN/<persona>.md`.

**Record the discussion for posterity (mandatory).** With `SendMessage` the live transport shows the Queen only one-line DM *summaries* — the full argument would otherwise be lost. So every panellist's brief MUST instruct it to **mirror each DM it sends, verbatim, into its working file** as it goes (opening positions → every exchange → final verdict), per [`reference/agent-brief-template.md`](reference/agent-brief-template.md) §OUTPUT. The `working/session-NNN/` directory is a **preserved artefact**, not scratch: it is committed alongside the session record and never deleted (transcripts double as training material — methodology §References). Faithful backstop if an agent under-logs: the harness writes a full per-agent transcript at `<session>/subagents/agent-<id>.jsonl` (keyed by opaque agent id), from which the Queen can reconstruct any exchange.

### Step 4 — Collect positions; Queen writes the synthesis

The Queen collects the returned positions, **verifies each citation** against the methodology §Citation grounding (a position whose source cannot be cross-referenced is flagged and not counted toward the vote), tallies each question `N-M-K` (for / against / abstain — three exact integers), and records the DA's disposition on every contested question verbatim: **WITHDRAWN** (condition met) / **HELD** (condition unmet — held-as-live, with a named re-open trigger) / **CONCEDED**. The Queen *composes* the cross-expert narrative but **MUST NOT fabricate** — every quotation must trace to actual agent output (the methodology §Session protocol rule 9). Worker that failed to return: record the absence, retry once with `-retry-1` lineage, default to `abstain` if the retry fails (rule 11).

Write the session record to `docs/ontology/odr/council/session-NNN-<slug>.md` (next sequential number — `Glob` the directory). Full/Reduced sessions carry the per-question verdict transcript **and** a tally appendix (per-voice table + DA scorecard + per-question count) — the two-artefact discipline. Author-only records carry the decision + consequences, no tally. The header fields, body structure, and worked templates for all three tiers are in [`reference/session-record-template.md`](reference/session-record-template.md).

**Preserve the discussion transcript (third artefact).** Before closing, confirm each panellist's `working/session-NNN/<persona>.md` contains its full exchange (opening → verbatim DMs → final), and assemble them into a chronological **discussion record** — either a `## Discussion transcript` section in the session record or a sibling `session-NNN-discussion.md` linking the per-persona files. If an agent under-logged its DMs, reconstruct from its `subagents/agent-<id>.jsonl` (map agent-id → persona) before shutting the team down. The session record's narrative synthesis cites this transcript; the working directory is committed, not deleted. This makes the deliberation replayable for posterity, not just the verdict.

### Step 5 — Apply / route dispositions; record held dissent

Route each disposition to its target: AFFIRM → the record stands / a new ODR is produced (use `odr-create`); REVISE → amend the named ODR/ADR §section; REJECT → strike the proposition with a pointer. Record any **held-as-live dissent** verbatim with its **re-open trigger** (the condition that would re-open the question) in the session record AND in the produced ODR's `## Alternatives` / a §Held dissent note. Set the produced ODR `status: proposed` and note that the operator ratifies adoption (the Council shapes proposals, not their adoption). Cite the session from the ODR's `council:` frontmatter. Optionally store the session pattern via `mcp__ruflo__memory_store` (namespace `odr-patterns`) for future recall.

## Notes

- **Tier default is Full Council; deviations are justified inline** in the convening block. But in practice most sessions in this corpus are Author-only or Reduced — pick the cheapest adequate tier (constraint 2), do not over-convene.
- **One substrate primitive, never both** — a session uses `swarm`-shaped fan-out (the default, via `Task`) OR a hive-mind consensus-mode, never `swarm_init` + `hive-mind_init` wrapped together (the methodology §Consensus-mode framework).
- **Meta-Council** (the methodology, the programme cut, the record taxonomy) uses `scope-check-N-<slug>.md` and letter-numbered amendments (A1, A2 …), not `session-N`. See the methodology §Meta-Council type.
- **Enforcement checklist** (named experts; Queen + DA named; DA genuinely opposed; DA withdraws/holds on every contested Q; `N-M-K` tallies; citations grounded; one-message parallel spawn; consensus-mode + tier declared in frontmatter) is in the methodology §Enforcement and the [`reference/session-record-template.md`](reference/session-record-template.md) pre-flight checklist.
- Adjacent skills: `odr-create` (produce the ODR a Full/Reduced verdict shapes), `odr-review` (lint the resulting ODR), `adr-create` (for schema-encoding decisions — the ODR/ADR boundary holds; the Council's panel is a linked-data panel).
