# Linked Data Council: Review Methodology

> Portable methodology carried by the `council` skill — the normative source the skill's
> operating procedure (SKILL.md) and its other reference files cite. Self-contained: it
> depends on no project files. A consuming project supplies its own context via the
> §Adoption hooks (see [`adoption-template.md`](adoption-template.md)); the methodology body
> itself is project-agnostic and is not edited per project.

## Context

Ontology mapping and ontology modelling projects — programmes that translate source data (JSON Schema, relational schemas, XSD, RDF, glossaries, data dictionaries) into a linked-data ontology with namespace strategy, vocabulary selection (SKOS / OWL / SHACL / DCAT / DPV / PROV-O / FIBO), bounded-context boundaries, mapping conventions to external ontologies, classification facets, and validation severity — require balancing formal correctness, pragmatic tooling constraints, industry precedent, and the domain-specific realities of the source data they translate. No single perspective covers all of them: an OWL purist may overlook tooling gaps; a pragmatist may miss formal pitfalls; a standards expert may not account for the domain's existing data shape; an enterprise-architecture expert may not weigh open-data and public-sector linked-data conventions.

A reproducible, multi-perspective review process is needed whose outputs are auditable and citable, and whose verdicts can be revisited as the experts' published positions are stable across sessions. Real-expert consultation is slow and non-reproducible; generic best-practice appeals produce vague rationale future maintainers cannot interrogate. The methodology must be grounded in authority, reproducible, and self-documenting — and it must be **portable across projects** without each adoption rewriting the protocol.

This methodology is published as a general-purpose instruction set. Adopting projects supply their own context via declared adoption hooks (§Adoption hooks); the methodology body itself is project-agnostic.

**Pattern lineage.** This methodology codifies the **Council Hive** pattern — a dialectic review of a proposition by N named experts citing their published methodology, with one Devil's Advocate, producing a verdict with structured transcript. The Council Hive is one of four canonical hive-mind patterns; three siblings (Consensus Decision Hive — propose-vote-resolve with no dialectic; Implementation Hive — coordinated development with consensus checkpoints; Review Hive — multi-perspective code/design review with severity vote) are **out of scope for this methodology**. They share substrate primitives (see §Config options) but follow different protocols and produce different outputs. Practitioners reaching for "use the Council methodology" for a non-dialectic decision are misapplying it; the methodology is the Council Hive specifically.

## Decision

Adopt the **Linked Data Council** — a simulated panel of named linked-data and ontology authorities whose published positions, W3C specifications, books, and deployment experience are used to evaluate ontology-modelling design decisions from multiple perspectives — because it is the only option that simultaneously delivers multi-perspective coverage, authority-grounded rationale, reproducibility, and an auditable record at a cost proportionate to the significance of the decision. A Council verdict shapes a *proposal*; adoption remains the role of the adopting project's real-world governance (the project declares its ratifying authority via §Adoption hooks).

## Rules

These rules define the standing apparatus and per-session protocol of the Linked Data Council. They are project-agnostic; each adopting project supplies its own context via the §Adoption hooks below.

### Session Protocol: From Question to Verdict

The following diagram shows the full lifecycle of a Linked Data Council session, from pre-flight scope check through to synthesis and ODR amendment.

```mermaid
flowchart TD
    accTitle: Council Session Protocol
    accDescr: Flowchart showing the full lifecycle of a Linked Data Council session from pre-flight scope check through to synthesis and ODR amendment


    PROP["Proposition raised<br/>(question + input docs)"]:::process
    PF["Pre-flight scope check<br/>(Queen, 5 min)"]:::process
    PF_OUT{Scope check<br/>outcome}:::warning
    RETIRE["Mark rejected +<br/>pointer to correct record"]:::error
    RESCOPE["Re-scope or split<br/>proposition"]:::process
    META["Escalate to<br/>meta-Council"]:::error
    CONVENE["Convene session<br/>(declare format tier +<br/>consensus-mode)"]:::process
    SPAWN["Spawn panel in ONE message<br/>(Queen + DA + N teammates)"]:::user
    DELIBERATE["Per-question deliberation<br/>(named citations, cross-talk,<br/>N-M-K vote tally)"]:::process
    DA_CHECK{DA withdraws<br/>or holds?}:::warning
    DA_HOLD["Record held dissent<br/>verbatim + re-open trigger"]:::error
    SYNTH["Queen writes synthesis<br/>(narrative + tally appendix)"]:::success
    ODR_AMEND["Amend or produce ODR<br/>(new record or inline amendment)"]:::success

    PROP --> PF
    PF --> PF_OUT
    PF_OUT -->|"Retire"| RETIRE
    PF_OUT -->|"Re-scope"| RESCOPE
    PF_OUT -->|"Meta-Council"| META
    PF_OUT -->|"Ratify as-is"| CONVENE
    RESCOPE --> CONVENE
    META --> CONVENE
    CONVENE --> SPAWN
    SPAWN --> DELIBERATE
    DELIBERATE --> DA_CHECK
    DA_CHECK -->|"Withdraws"| SYNTH
    DA_CHECK -->|"Holds dissent"| DA_HOLD
    DA_HOLD --> SYNTH
    SYNTH --> ODR_AMEND
```

### Standing Panel (9 experts)

The methodology's canonical roster. Their published positions are stable and domain-agnostic; adopting projects MAY weight specific experts more heavily for their domain (declared via §Adoption hooks) but the roster itself is fixed.

The following diagram maps the standing panel's expertise clusters.

```mermaid
flowchart LR
    accTitle: Standing Panel Expertise Map
    accDescr: Map of the 9 standing panel experts grouped by their primary expertise cluster


    QUEEN["Queen / Moderator<br/>(named per session)"]:::service
    DA["Devil's Advocate<br/>(named per session)"]:::service

    subgraph PragmaticRDF["Pragmatic RDF &amp; Enterprise"]
        ALLE["Dean Allemang<br/>Working Ontologist"]:::user
        DAVIS["Ian Davis<br/>BBC / UK Gov"]:::user
    end

    subgraph FormalOWL["Formal OWL &amp; Web Architecture"]
        HENDLER["Jim Hendler<br/>W3C / RPI"]:::user
        GANDON["Fabien Gandon<br/>W3C / Inria"]:::user
    end

    subgraph EnterpriseOntology["Enterprise Ontology"]
        KENDALL["Elisa Kendall<br/>OMG / EDM Council"]:::user
        CAGLE["Kurt Cagle<br/>The Ontologist"]:::user
    end

    subgraph FormalOntology["Formal Ontology &amp; Identity"]
        GUIZZARDI["Giancarlo Guizzardi<br/>NEMO / UniLu"]:::user
        GUARINO["Nicola Guarino<br/>ISTC-CNR"]:::user
    end

    subgraph Vocabulary["Vocabulary &amp; Namespace"]
        BAKER["Tom Baker<br/>Dublin Core"]:::user
    end

    QUEEN -.->|"votes + synthesises"| PragmaticRDF
    QUEEN -.->|"votes + synthesises"| FormalOWL
    QUEEN -.->|"votes + synthesises"| EnterpriseOntology
    QUEEN -.->|"votes + synthesises"| FormalOntology
    QUEEN -.->|"votes + synthesises"| Vocabulary
    DA -.->|"attacks proposal"| PragmaticRDF
```

| Expert | Affiliation | Perspective |
|--------|-------------|-------------|
| Dean Allemang | *Working Ontologist* | Pragmatic RDF modelling, enterprise KG practice |
| Jim Hendler | W3C / RPI | OWL formal semantics, web architecture |
| Elisa Kendall | OMG / EDM Council | Enterprise ontology patterns, FIBO methodology |
| Kurt Cagle | *The Ontologist* | SHACL practitioner, taxonomy design, AI integration |
| Fabien Gandon | W3C / Inria | RDF/RDFS/OWL standards, linked-data principles |
| Tom Baker | Dublin Core | Namespace design, metadata standards, vocabulary governance |
| Ian Davis | BBC / UK Gov | Linked-data deployment at scale, government data patterns |
| Giancarlo Guizzardi | NEMO / UniLu | Conceptual modelling, identity & rigidity, class-vs-value distinctions |
| Nicola Guarino | ISTC-CNR | Formal ontology theory, identity criteria, ontological well-foundedness |

### Extended Panel (domain-specific guests)

Added when the question genuinely depends on the expertise. Adopting projects MAY pre-elect a subset as routinely-applicable via §Adoption hooks; remaining candidates are case-by-case.

| Expert | When to include |
|--------|-----------------|
| Holger Knublauch (TopQuadrant) | SHACL-specific technical questions |
| Antoine Isaac / Alistair Miles | SKOS-specific (concept schemes, mappings, broader/narrower semantics) |
| Eric Evans / Vaughn Vernon | Bounded-context and domain-modelling questions |
| Zhamak Dehghani | Data ownership and mesh architecture (multi-stakeholder data) |
| Harith Alani / John Domingue | Open-data publishing patterns |
| Ranganathan / ISO 25964 reference | Faceted classification or thesaurus questions |
| Luc Moreau | PROV-O provenance modelling |
| Renato Iannella / Harshvardhan Pandit | ODRL / DPV (consent, policy, data-rights) |
| Manu Sporny / Drummond Reed | W3C VC / DID / Trust Framework interop |

Do not pad the panel for show. If a guest expert has nothing distinctive to add over the standing nine, leave them out.

### Roles for every session

- **Queen / Moderator** — one expert from the standing or extended panel, named explicitly. Frames the questions, sequences the deliberation, calls votes, and writes the synthesis. The Queen still votes.
- **Devil's Advocate (DA)** — one expert, named explicitly. Their job is to attack the proposal: identify procedural violations, missing constraints, logical gaps, alternative interpretations the panel may have skipped. The DA is expected to lose votes and to withdraw objections when persuaded — both are recorded. **The DA MUST explicitly withdraw or hold on every contested question.** No vague "all agreed" closes — the DA either acknowledges the rationale won the argument (recorded verbatim: "Cagle DA withdrew on Q5, accepting the ValidationContext reification") or holds principled dissent (recorded verbatim: "Davis DA holds dissent on Q1; withdrawal condition stated as …"). Silent DA alignment is a methodology violation.
- **Panel** — the remaining experts. Each speaks in turn on each question.

**DA selection criterion (load-bearing).** The DA's *published methodology* MUST be genuinely opposed to the framing the proposition under review carries — not merely orthogonal. The convening block names the opposition explicitly. A DA whose published position aligns with the framing produces theatre; a DA whose published position is on a different axis produces straw arguments. The strongest DA is the one whose work has *publicly contradicted* a load-bearing premise of the proposition.

### Session protocol

1. **Convene with a context block.** State the question(s), the input documents (with paths or URLs), prior related ODRs, and any constraints (deadlines, dependencies). 3–8 questions per session is the working range — more is a sign the scope should be split.
2. **Run pre-flight scope check** (see §Pre-flight scope check). Three outcomes: ratify-as-is / re-scope / retire. If the scope check produces substantive findings, escalate to a meta-Council (see §Meta-Council type) before running the full session.
3. **Always use named experts** from the panel — never generic role titles ("a SHACL expert said…"). Attribution is the discipline that keeps rationale honest.
4. **Each expert must state rationale from their published methodology.** Citations must be grounded per §Citation grounding. If the position can't be grounded in a citation that meets those criteria, it doesn't count.
5. **Experts must discuss with each other**, not just opine in parallel. Share contested points so they can agree, disagree, refine, or withdraw prior dissent. Cross-references between expert positions ("Allemang's framing is right but I'd push further — …" — Hendler) are the hallmark of a real deliberation.
6. **Per-question vote.** Tally as `N-M-K` (in-favour / against / abstain). Three values, exact integers. Approximate tallies (e.g. `≈6-3`) are admitted ONLY when a panellist explicitly abstains on a sub-question or holds a position that falls outside the ballot — the abstention reason is recorded verbatim. Record dissenting positions verbatim, including the reason given. If the DA withdraws an objection during deliberation, record that explicitly ("Cagle DA withdrew"); if the DA aligns with majority on a sub-question, record the partial alignment ("Davis DA aligned with majority on Q4; held dissent on Q1, Q5, Q6").
7. **Synthesis report.** The Queen writes a closing section listing: per-expert positions (or pointers to where they appear above), vote tallies per question, dissent records and withdrawals, the recommended approach, rationale citing publications, agreed amendments to the proposal, and whether any existing record needs revision or supersession. **Two-artefact discipline** applies when the session uses a hive-mind `consensus-mode`: the narrative synthesis is the verdict; programmatic vote tallies (from `hive-mind_consensus`) are an additive appendix. Where narrative and tally disagree, narrative wins.
8. **No silent vote-padding.** If an expert genuinely has nothing distinctive to say, "abstain" is the correct vote — not a fabricated agreement.
9. **The Queen composes; the Queen does not fabricate.** Every expert quotation in the synthesis MUST trace to actual content the named teammate produced in their position file. Composition (the Queen weaving cross-expert discussion between independently-written positions) is legitimate; fabrication (inventing a sentence and attributing it to an expert) is a methodology violation and grounds for invalidating the session. The audit trail is: any maintainer reading the synthesis MUST be able to find the cited content in the corresponding `working/session-N/<teammate>.md` file. If a teammate did not write something, the Queen MUST NOT put it in their mouth.
10. **One-message parallel spawn.** When the substrate primitive supports it (Agent fan-out via Claude's `Agent` tool; `hive-mind_spawn` for hive-mind sessions), the panel MUST be spawned in a single message — parallel fan-out is a synchronisation barrier on the slowest teammate, not on the sum of teammates. Sequential spawning serialises needlessly and is a methodology violation. Author-only sessions are exempt (no panel).
11. **Worker failure protocol.** If a teammate fails to produce a position file within the session's time budget, the Queen records the absence explicitly ("Teammate `gandon-guizzardi` failed to return within 60s of timeout; retry attempted; second attempt returned position file. Final positions reflect retry content.") The Queen MAY retry once (with retry-lineage tracking — original teammate ID + `-retry-1` suffix); MUST NOT silently drop. If retry fails, the absent teammate's position is marked `unrecorded` and their vote is `abstain` by default; the synthesis acknowledges the gap and proceeds. Failed teammates do NOT silently change the panel composition.

### Citation grounding

Every expert position MUST cite a source meeting one of the following standards. The Queen verifies each citation during synthesis; positions whose citations cannot be verified are not counted toward the vote.

**Acceptable sources:**

- A W3C Recommendation, Working Draft, or Note — named spec + section number (e.g. "SHACL Core §6.5").
- An OMG specification or FIBO ontology release — named document + section or term identifier.
- A named book authored by the expert (or co-authored) — book title + chapter or page (e.g. "*Semantic Web for the Working Ontologist* 3rd ed., Ch. 7").
- A peer-reviewed paper authored by the expert — journal/conference + year + title.
- A documented deployment the expert led or co-authored — named project + traceable reference (e.g. "BBC `/programmes/` ontology, deployed 2009, see `bbc.co.uk/ontologies/po`").
- A maintained open-source project the expert is a primary contributor to — repository + named convention or documented decision.

**Not acceptable:**

- Anonymous "best practice" appeals.
- General claims without a named source.
- Citations to chapters or sections that cannot be cross-referenced.
- Blog posts without a verifiable stable URL.
- Citations attributed to an expert but not actually authored by them.

**Verification.** The Queen verifies citation validity during synthesis. Where a teammate's position cites a source the Queen cannot cross-reference within the session's time budget, the citation is flagged and the position weight reduced (recorded explicitly: "Hendler cited a position attributed to ____, citation could not be verified within session — position not counted toward vote").

### Cross-talk transport

Session-protocol rule 5 requires experts to discuss with each other, not just opine in parallel. The transport is *how* that discussion is carried; it is independent of the Queen role (every Full/Reduced Council has a Queen on every transport) and of the `consensus-mode` (which governs voting, not discussion). Four options, in order of preference — pick the first whose preconditions are met. **The default is direct agent-to-agent messaging**; queen-composed, where workers do not talk to each other, is reserved for the exceptional case where peer-revision is genuinely out of scope.

| Transport | When | Notes |
|---|---|---|
| **`SendMessage` via Agent Teams (recommended default)** | Every session with a panel, unless a constraint below forces a fallback. Workers respond to peers' claims before settling — the multi-round dialectic the Council exists to produce. | Spawn workers with `team_name: "<council-id>"`; workers exchange messages via `SendMessage`. The upstream-blessed inter-agent messaging primitive; has hooks (`teammate-idle`, `task-completed`) and lifecycle (`TeamCreate`/`TeamDelete`) wired in. Requires the `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` environment toggle. **Caveat — capture for posterity:** the lead receives only one-line DM *summaries* live, so each worker MUST mirror every DM it sends, verbatim, into its `working/session-NNN/<persona>.md` as it goes; otherwise the deliberation survives only as transient inbox traffic. The harness also persists a full per-agent transcript at `<session>/subagents/agent-<id>.jsonl` as a faithful backstop. |
| **Direct MCP `_memory`** (fallback) | Agent Teams unavailable, OR the verdict needs to survive session restart / long-running multi-round / a typed-bucket model. Still carries agent-to-agent cross-talk. | Workers call `mcp__ruflo__hive-mind_memory({action:"set", type:"context", key:"<persona>-pos", value:"..."})` and `({action:"get", key:"<peer>-pos"})`. Typed buckets, atomic under hive store lock, durable persistence. |
| **File-based** (fallback) | Agent Teams unavailable AND MCP server unreliable. Still carries agent-to-agent cross-talk; cost is wall-clock latency. | Workers write `pos-<name>.md` → barrier sleep → read peers' files → write reactions. Slower than the messaging transports with no functional gain; use only when neither is available. |
| **Queen-composed** (exceptional — forgoes cross-talk) | ONLY when peer-revision is genuinely out of scope (independent positions, no rebuttal expected) and latency is critical. Workers do **not** talk to each other, which negates the dialectic — so it is never the default. | Workers don't see each other at runtime; Queen reads all position files and composes inter-expert discussion in the synthesis. Composition is legitimate only when every quotation traces to actual worker output (§Session protocol rule 9). |

Default to `SendMessage` via Agent Teams for every panel session; fall back to `_memory`, then file-based, only when Agent Teams / MCP are unavailable — both still carry genuine agent-to-agent cross-talk. Queen-composed is the exceptional case where the experts never talk to each other; it forgoes the dialectic and is used only when peer-revision is out of scope. Author-only sessions have no panel and therefore no cross-talk transport.

### Pre-flight scope check

Before convening a session, the Queen runs a 5-minute scope check on the proposition. The check answers one question: *is this proposition the right unit of decision?* Three outcomes:

1. **Ratify-as-is.** The proposition is coherent; the listed questions cover its load-bearing decisions. Proceed with the session.
2. **Re-scope.** The proposition is too narrow (the decision needs more context — fold into a neighbouring record) or too broad (the decision is two independent decisions — recommend a spawn). Record the re-scope recommendation; the session may either proceed with reduced scope or be postponed.
3. **Retire.** The proposition is the wrong unit of decision entirely (the decision belongs in a different corpus, or precedent has already settled it). Mark the record `rejected` with a pointer.

**Escalation.** If the scope check produces substantive findings that would invalidate multiple sessions or affect the programme cut, escalate to a **meta-Council** (see §Meta-Council type) before running any further sessions.

### Format tiers

Not every proposition needs the full nine-expert apparatus. Three tiers. The following decision tree shows how to select the correct tier.

```mermaid
flowchart LR
    accTitle: Council Format Tier Selection
    accDescr: Decision tree for selecting the correct Council format tier based on the nature of the proposition


    Q1{"Substantive decision<br/>with credible split?"}:::warning
    Q2{"Amendment on<br/>narrow axis?"}:::warning
    Q3{"Precedent or<br/>methodology settled?"}:::warning

    FULL["Full Council<br/>Queen + DA + 6 panel<br/>~8 agent runs"]:::user
    REDUCED["Reduced Council<br/>Queen + DA + 1-2 panel<br/>~3-4 agent runs"]:::info
    AUTHOR["Author-only<br/>Queen drafts directly<br/>~1 agent run"]:::success

    Q1 -->|"Yes"| FULL
    Q1 -->|"No"| Q2
    Q2 -->|"Yes"| REDUCED
    Q2 -->|"No"| Q3
    Q3 -->|"Yes — recording only"| AUTHOR
    Q3 -->|"No — check scope"| Q1
```

| Tier | When | Apparatus | Cost (rough) |
|---|---|---|---|
| **Full Council** | Substantive linked-data decision with credible split | Queen + DA + 6 panel teammates writing position files | ~8 agent runs |
| **Reduced Council** | Amendment / ratification-with-targeted-disputes | Queen + DA + 1–2 panel teammates on disputed questions only | ~3–4 agent runs |
| **Author-only** | Recording a decision the methodology or precedent has already settled; sequencing/index work; no panel split expected | Queen drafts the transcript and the record amendment from existing inputs; no fanned-out positions | ~1 agent run |

Format per session is named in the convening block. The default is Full Council; deviations are justified inline.

### Two-artefact discipline (default for Full Council + Reduced Council)

Every **Full Council** and **Reduced Council** session produces TWO artefacts:

1. **Narrative synthesis (primary).** The Queen's prose transcript per §Session document conventions — the substantive verdict, with each expert's position recorded, the Synthesis section closing the loop.
2. **Structured per-question tally appendix (second artefact).** A machine-consumable per-voice vote table + DA scorecard + per-question count, embedded in the same transcript document. Downstream tooling (`odr-review` lint extensions; audit-trail consumers; LLM retrievers) reads the tally mechanically.

The DA scorecard discipline is mechanical: each DA position file lists per-question withdrawal conditions verbatim; the Queen synthesis marks each as WITHDRAWN (condition met) / HELD (condition unmet; held-as-live with named re-open trigger) / CONCEDED (no attack). No vague "DA aligned with majority" — the alignment traces to specific named conditions per question.

The two-artefact discipline is **unconditional for Full + Reduced Council, regardless of consensus-mode** — the structured tally captures dissent that a narrative reading alone would bury. Author-only sessions do not require the tally appendix (no panel to tally).

**Format-by-format requirements:**

| Format | Narrative synthesis | Structured tally | DA scorecard | Held-as-live dissent record |
|---|---|---|---|---|
| Full Council | MUST | MUST | MUST | MUST when DA holds |
| Reduced Council | MUST | MUST | MUST | MUST when DA holds |
| Author-only | MUST | n/a (no panel) | n/a | n/a |

The tally artefact's structure is specified in §Session document conventions (Tally appendix).

### Consensus-mode framework

Each session declares a `consensus-mode` in its frontmatter, selected by applying the criteria below to the session shape. The mode determines which coordination primitive is used.

| `consensus-mode` | Criterion | Substrate |
|---|---|---|
| `agent-fan-out` (default) | Votes on each question are *independent* of votes on other questions; verdict reduces to a tally of standalone positions. | `swarm_init` (bookkeeping) + Claude's `Agent` tool spawning teammates in parallel |
| `hive-mind/byzantine` | Verdict on one question is *conditional* on verdict on another (e.g. multi-condition withdrawals). Structural vote acknowledgement matters. | `hive-mind_init` with `consensus: byzantine`; programmatic `hive-mind_consensus` per question |
| `hive-mind/weighted` | The Queen is the authoritative voice; worker votes are advisory (queen vote ×3). Used for leader-led decisions where pragmatic synthesis dominates. | `hive-mind_init` with `consensus: weighted` |
| `hive-mind/quorum` | Caller-chosen threshold (unanimous / majority / supermajority). Used for governance-grade decisions with stated strictness. | `hive-mind_init` with `consensus: quorum` + `quorumPreset` |
| `hive-mind/raft` | Sequential term-ordered decisions where each supersedes the prior. | `hive-mind_init` with `consensus: raft` |
| `hive-mind/gossip` | Advisory eventual-consistency rounds for small panels; tolerates voter dropouts. | `hive-mind_init` with `consensus: gossip` |
| `hive-mind/crdt` | Re-broadcast safety dominates; out-of-order delivery; mathematical convergence required. | `hive-mind_init` with `consensus: crdt` |
| `hive-mind/typed-output` | Verdict produces a *structured object consumed by downstream tooling* (a generator, a linter, an LLM retriever). The tally is data, not decoration. | `hive-mind_init` with `consensus: quorum` or `weighted`; verdicts persisted as `hive-mind_memory` `type: consensus` |
| `none` | Author-only session; no panel to coordinate. | Single Queen run via the main thread |

Note that the substrate primitives (`swarm` and `hive-mind`) are at the same level of abstraction — a session uses one OR the other, never both wrapped. Hive-mind init *is* a swarm-shaped construct; calling `swarm_init` and `hive-mind_init` together is redundant.

### Config options for the substrate primitives

The methodology specifies these option surfaces explicitly so adoption is reproducible. The ruflo MCP tool names are canonical; other implementations of the same primitives MAY substitute equivalent tools provided the option surface is preserved.

#### Swarm primitive (`mcp__ruflo__swarm_init` and related)

| Option | Type | Values | Default | Notes |
|---|---|---|---|---|
| `topology` | string | `hierarchical` \| `mesh` \| `hierarchical-mesh` \| `ring` \| `star` \| `hybrid` \| `adaptive` | — | Wires agent-visibility surface |
| `strategy` | string | `specialized` \| `balanced` \| `adaptive` | — | How work is allocated across agents |
| `maxAgents` | number | 1–50 | — | Hard cap on agent count |
| `force` | boolean | true / false | false | Force-create even if a matching running swarm exists within reuse TTL |
| `reason` | string | free-text | — | Advisory audit-log entry when `force=true` |
| `config` | object | arbitrary | — | Additional swarm configuration (open-ended; rarely needed) |

Swarm scaling (`mcp__ruflo__swarm_scale`):

| Option | Type | Values | Default | Notes |
|---|---|---|---|---|
| `swarmId` | string (required) | — | — | Target swarm to scale |
| `agents` | number (required) | 1–50 | — | New target agent count |
| `type` | string | agent-type filter | — | Advisory; orchestrators may honour |

Swarm has **no consensus primitive** — coordination is by topology + strategy; decisions are not first-class.

#### Hive-mind primitive — initialisation (`mcp__ruflo__hive-mind_init`)

| Option | Type | Values | Default | Notes |
|---|---|---|---|---|
| `topology` | string | `mesh` \| `hierarchical` \| `ring` \| `star` \| `hierarchical-mesh` \| `adaptive` | — | Six options (no `hybrid` — swarm-only) |
| `consensus` | string | `raft` \| `byzantine` (alias `bft`) \| `gossip` \| `crdt` \| `quorum` \| `weighted` | `raft` | Seven algorithms; selectable per-call too |
| `queenType` | string | `strategic` \| `tactical` \| `adaptive` | — | Architect-first / Dispatcher-first / Mode-switching |
| `queenId` | string | agent ID | — | Initial queen agent identifier |
| `maxAgents` | number | — | — | Worker-agent cap |
| `memoryBackend` | string | `hybrid` \| `sqlite` \| `rvf` | — | Three backends; `hybrid` is canonical |
| `persist` | boolean | — | — | Persist hive state across processes (enables resume) |

#### Hive-mind primitive — spawn (`mcp__ruflo__hive-mind_spawn`)

| Option | Type | Values | Default | Notes |
|---|---|---|---|---|
| `action` | enum | `spawn` \| `retryTask` | `spawn` | Retry uses lineage tracking |
| `count` | number | — | 1 | Number of workers |
| `role` | enum | `worker` \| `specialist` \| `scout` | `worker` | High-level role |
| `agentType` | string | scalar | `worker` | Mutex with `agentTypes` |
| `agentTypes` | enum array | `researcher` \| `coder` \| `analyst` \| `tester` \| `architect` \| `reviewer` \| `optimizer` \| `documenter` \| `specialist` \| `coordinator` \| `monitor` | — | Mixed-type round-robin (11 specialisations) |
| `prefix` | string | — | `hive-worker` | ID prefix |
| `retryOf` | string | original worker ID | — | Retry lineage tracking |

#### Hive-mind primitive — consensus (`mcp__ruflo__hive-mind_consensus`)

| Option | Type | Values | Default | Notes |
|---|---|---|---|---|
| `action` | enum (required) | `propose` \| `vote` \| `status` \| `list` | — | |
| `strategy` | enum | seven values (same as init) | `raft` | Selectable per-proposal; overrides init |
| `quorumPreset` | enum | `unanimous` \| `majority` \| `supermajority` | `majority` | Only used when `strategy: quorum` |
| `timeoutMs` | number | ms | 30000 | Raft re-proposal timeout |
| `roundTimeoutMs` | number | ms | 5000 | Per-round gossip/CRDT timeout |
| `term` | number | — | — | Raft term ordering |
| `crdtSnapshot` | object | `{ votes, approvers, verdict }` | — | Required for CRDT strategy |
| `includeProvenance` | boolean | — | false | Full RankedResult provenance shape |
| `proposalId` | string | — | — | For `vote`/`status` |
| `voterId` | string | — | — | Voting agent ID |
| `vote` | boolean | true=for / false=against | — | |
| `type` | string | proposal type | — | Free-form proposal-type label |
| `value` | any | — | — | Proposal payload |

#### Hive-mind primitive — memory (`mcp__ruflo__hive-mind_memory`)

| Option | Type | Values | Default | Notes |
|---|---|---|---|---|
| `action` | enum (required) | `get` \| `set` \| `delete` \| `list` | — | |
| `type` | enum | `knowledge` \| `context` \| `task` \| `result` \| `error` \| `metric` \| `consensus` \| `system` | — | Eight typed buckets; required for `set` |
| `key` | string | — | — | Memory key |
| `value` | any | — | — | For `set` |
| `ttlMs` | number | ms | per-type default | Override TTL |

**Per-type default TTLs:** `knowledge` permanent · `context` 1h · `task` 30m · `result` permanent · `error` 24h · `metric` 1h · `consensus` permanent · `system` permanent.

### Substrate operations

Two operational rules that govern how the substrate primitives are invoked, independent of which `consensus-mode` is in use:

**Calling convention.** The Queen calls MCP tools directly (`mcp__ruflo__swarm_init({...})`, `mcp__ruflo__hive-mind_init({...})`, `mcp__ruflo__hive-mind_consensus({...})`); sub-agents spawned via `Agent` may also call MCP tools directly (no `ToolSearch` preamble required). Inter-sub-agent messaging uses `SendMessage` with `team_name`-tagged Agent Teams — the recommended default cross-talk transport (§Cross-talk transport). CLI / shell fallbacks (`npx ... hive-mind spawn --claude`) are reserved for environments where the MCP server is unavailable — they are NOT a viable fallback inside an active session with a running MCP server (lock contention).

**Sub-queen escalation (hierarchical-mesh topologies only).** When a session uses `topology: hierarchical-mesh`, sub-queens may emerge inside sub-hives. If a sub-queen fails (missing summary key >60s; Task error; unresponsive status probe), the escalation policy is data-driven: **promote-worker** if ≥1 healthy worker remains in the sub-hive (longest-lineage worker promoted; sub-hive boundary preserved); **escalate-to-root** if zero healthy workers (subtree marked failed; orphans absorbed into top tier). Recursion cap: 1 nesting level (no sub-sub-queens). Substrate handles this automatically; Queens are aware of the policy but do not implement it.

### Working-file convention

For Full Council and Reduced Council sessions, per-teammate position files live at:

```
<project>/<council-directory>/working/session-NNN/<teammate>.md
```

The `<council-directory>` is project-defined (typically `docs/ontology/odr/council/` or analogous). Working files are append-only and are a **preserved artefact, not scratch** — they are committed alongside the session record and never deleted (transcripts double as training material; see §References). Each teammate's file is the full record of *its side of the deliberation*: opening positions, **every cross-talk DM mirrored verbatim** (not just summarised), position changes with the peer that caused them, and the final verdict — so the debate is replayable for posterity, not only the decision that ended it. The Queen assembles them into the session's discussion record (a `## Discussion transcript` section or a sibling `session-NNN-discussion.md`) and, where a teammate under-logged its DMs, reconstructs from the harness per-agent transcript (`<session>/subagents/agent-<id>.jsonl`) before the team is torn down. Amendments to a record create a new session (sub-letter or successor), not edits to old working files. Author-only sessions do not produce working files; the Queen writes the transcript directly.

For meta-Council sessions (see §Meta-Council type), the path is:

```
<project>/<council-directory>/working/scope-check-N-<slug>/<teammate>.md
```

### Multi-day sessions and resumability

Most Council sessions complete in one sitting. For deliberations that genuinely span days — a Full Council that pauses overnight while a teammate gathers domain context; a meta-Council whose synthesis spans a working week — the substrate supports session export, import, and resume. Mechanism:

- **`hive-mind sessions checkpoint`** archives the current session state (queen prompt, worker manifest, typed memory) to a gzipped JSON archive at `.claude-flow/hive-mind/sessions/<sessionId>-<timestamp>.json.gz`. Schema versioned (currently v1).
- **`hive-mind sessions export <id> --output <path>`** explicitly exports a session archive.
- **`hive-mind sessions import <path>`** places the archive under a fresh `imported-<ts>-<rand>` sessionId. Does NOT auto-resume.
- **`hive-mind resume <id>`** re-spawns the queen and workers from the archive; queen prompt, queen type, and worker manifest are restored verbatim.

Methodology guidance: prefer one-sitting sessions; use resumability only when wall-clock genuinely exceeds one sitting. Each resume cycle is recorded in the synthesis (date, what was paused, what changed in the interim). Multi-day sessions risk drift — the longer the gap, the more the Queen should re-verify citations and re-state convening assumptions on resume.

Author-only sessions don't use resumability (no panel to checkpoint). Agent-fan-out sessions checkpoint via git (working files are commit-tracked); the hive-mind session-archive mechanism is only used when `consensus-mode` is a hive-mind variant.

### Meta-Council type

Sessions whose subject is the methodology itself, the programme plan, the cut of records, or any other meta-question rather than a specific record under deliberation. Examples: "are these 13 stubs the right unit of decision?", "should the methodology adopt hive-mind consensus for some session types?", "what does an ODR record — an artefact-engineering decision or an ontological commitment?".

**Conventions:**

- **Filename pattern:** `scope-check-N-<slug>.md` (not `session-N-<slug>.md`). The "N" is the sequential meta-Council number, independent of session numbering.
- **Amendment numbering:** Meta-Councils produce amendments labelled with letters — A1, A2, A3, ... (or B1, B2, ... per scope-check) — rather than per-question vote tallies. Per-question tallies are still recorded inside each amendment's rationale.
- **Output:** A set of amendments to existing records (per-project plans, methodology, programme anchor) rather than new records.
- **Track-record entry:** Meta-Councils appear in the adopting project's track record alongside per-record sessions.

### Session document conventions

- **File:** `<project>/<council-directory>/session-NNN-<slug>.md` (per-record sessions) or `scope-check-N-<slug>.md` (meta-Councils) — incrementing numeric ID, descriptive kebab-case slug.
- **Front matter** (after the `# Council Session NNN — Title` heading):
  - Date.
  - Record(s) under review (if any).
  - Queen.
  - Devil's Advocate.
  - Panel (table).
  - Input Documents.
  - `consensus-mode` declaration (one of the values in §Consensus-mode framework).
  - Format tier (Full Council / Reduced Council / Author-only).
- **Body structure:**
  - **Context** — the question and stakes.
  - **Question N** sections, one per question.
    - Inside each: each expert's position as a labelled sub-section or bolded `**Allemang:**` paragraph. The Queen's contribution is marked `**Allemang (Queen):**`; the DA's `**Cagle (DA):**`.
    - **Vote:** `N-M-K` with the tally and (optionally) a one-line summary of the verdict. Approximate tallies admitted only per §Session protocol rule 6.
  - **Synthesis** — Queen's closing summary, amendments, downstream record impact.
  - **Tally appendix** (MUST for Full Council + Reduced Council per §Two-artefact discipline; n/a for Author-only) — the structured per-voice vote table + per-question count + DA scorecard, embedded in the transcript document. Narrative is the verdict; tally is the count. The tally is machine-consumable (downstream tooling reads it as data); the narrative is human-readable (Queen's prose synthesis). When `consensus-mode` is `hive-mind/byzantine` or `hive-mind/typed-output`, the tally also carries the structured-vote output from `hive-mind_consensus` or the typed-verdict object respectively; for `agent-fan-out` sessions, the tally is constructed from each panel teammate's per-question position votes in their working file.

### When to use the Council

General categories of decision that warrant a Council session in any ontology mapping or ontology modelling project:

- URI / namespace / serialization decisions.
- Competing W3C modelling patterns (OWL vs SKOS vs SHACL; RDF reification vs RDF-star; etc.).
- OWL / SHACL / SKOS / PROV-O / DPV / ODRL semantic questions.
- Validating enterprise-scale or government-scale precedent for a modelling pattern.
- Cross-cutting reviews of multiple records for coherence.
- Bounded-context boundaries for the source schemas being modelled.
- Mapping conventions between the project's ontology and external standards (FIBO, schema.org, DPV, INSPIRE, GeoSPARQL, etc.).
- Identity-criterion questions.
- Vocabulary catalogue admission, tier movement, or retirement decisions.

Adopting projects MAY extend this list with domain-specific categories via §Adoption hooks.

### When NOT to use the Council

- Routine class / property additions that fit established patterns.
- SHACL shape authoring that follows an existing template.
- Editorial fixes (typos, label tightening, comment additions).
- Routine procedural matters — those belong in the project's own process, not the Council.
- Stakeholder consultation — that's the role of the adopting project's real-world governance, not a simulated panel.

The Council is a design-deliberation instrument. It does not substitute for the adopting project's real-world governance. Council verdicts shape *proposals*; the project's governance shapes *adoption*.

### Standing-panel amendment protocol

The standing 9 are treated as stable across the methodology's lifetime, but the methodology admits amendment under specific triggers:

- **Trigger 1: A new publication from a candidate expert materially contradicts a position they have been simulated holding.** Recorded in the candidate's panel entry as a "position update note"; future sessions cite the updated position.
- **Trigger 2: A new expert's published work becomes load-bearing in the field.** Proposed addition to the extended panel via a meta-Council on the methodology. Promotion from extended to standing requires a separate meta-Council with substantive justification (the standing 9 carries a maturity bar that the extended panel does not).
- **Trigger 3: An expert's published positions become broadly outdated.** Removal from the panel via meta-Council; the methodology preserves their prior contributions as historical record but does not simulate their position in new sessions.

Amendments to the panel land as edits to this methodology's `## Rules` (panel tables), recorded with the meta-Council session that authored them. No sibling record.

### Self-amendment process

This methodology amends only through its own Council protocol — applying the methodology to itself. Three formats acceptable depending on the amendment's scope:

- **Author-only** — when the amendment merely records a precedent the methodology has tacitly settled (e.g. ratifying a convention multiple sessions have used consistently).
- **Reduced Council** — when the amendment is disputed on a narrow axis (1–2 questions, 1 DA, 1 panel pair).
- **Full Council** — when the amendment is substantive (3+ questions, full panel, full DA + panel cross-talk).

Amendments land inside this methodology's own `## Rules` rather than in a sibling supersession record. Partial supersession of a section is recorded inline (with the meta-Council session that authored the change), preserving the prior text in version-control history rather than via a parallel amendment-record file.

### Adoption hooks (per-project slots)

Each adopting project supplies its own context via these declared slots. The methodology defines the slot shape; the project fills it in. Project adoption is recorded in a project-side adoption record (copy [`adoption-template.md`](adoption-template.md) into the project) declaring:

- **§Project Weighting** — Which standing-panel experts the project weights more heavily, with a one-line domain justification.
- **§Domain-Extended Panel** — Which extended-panel candidates the project pre-elects as routinely-applicable. Other extended-panel candidates remain case-by-case.
- **§Real-world Governance Handoff** — Which real-world authority (the operator, an internal team, a governance board, or equivalent) ratifies Council proposals into adopted decisions. Council verdicts shape proposals; adoption is downstream.
- **§Track Record** — The per-project track-record table listing convened sessions: session ID, question/topic, panel, verdict, output records produced.
- **§Project-specific when-to-use additions** — Domain-specific categories the project adds to the general when-to-use list.
- **§Council directory path** — Where the project stores session transcripts and working files. Typically `docs/ontology/odr/council/` or analogous.

The adoption record is a small project-specific artefact (typically 50–150 lines) declaring the above slots. Adopting projects whose adoption record is missing a required slot are non-conforming.

### Enforcement (checked by review)

- Standing panel lists 9 named experts with affiliations.
- Queen and Devil's Advocate roles named explicitly per session.
- DA selection criterion (genuinely opposed published methodology) honoured.
- DA explicitly withdraws or holds on every contested question (§Roles).
- Per-question vote tally uses `N-M-K` convention (three values; approximations admitted only per §Session protocol rule 6).
- Citations grounded per §Citation grounding; Queen verifies during synthesis.
- Queen composes; does not fabricate. Every quotation in the synthesis traces to actual content in the corresponding teammate's `working/session-N/<teammate>.md` file (§Session protocol rule 9).
- Panel spawned in a single message (parallel fan-out, not sequential) for Full Council and Reduced Council sessions (§Session protocol rule 10).
- Worker failure handled per §Session protocol rule 11 — absent teammates recorded explicitly, retry-once with lineage, default-abstain when retry fails.
- Pre-flight scope check run before convening.
- When-to-use / when-not-to-use criteria observed before convening.
- `consensus-mode` declared in session frontmatter; matches the criterion in §Consensus-mode framework.
- Format tier (Full Council / Reduced Council / Author-only) declared.
- Session document follows the path and structure above; front matter present.
- Working-file convention honoured.
- **Discussion transcript preserved (for posterity).** Each panellist's working file captures its full cross-talk verbatim (DMs mirrored, not just the lead's one-line summaries); the Queen assembled them into the session's discussion record and committed the `working/session-NNN/` directory (reconstructing from `subagents/agent-<id>.jsonl` where a teammate under-logged). The deliberation is replayable, not just the verdict.
- Adopting project supplies all required §Adoption hooks slots; missing slots are non-conforming.

## Alternatives

- **Ad hoc single-perspective review** — one viewpoint per decision; misses cross-cutting concerns no single expertise covers.
- **Open call to real-world experts** — slow, expensive, non-reproducible; real experts are reserved for the adopting project's standing governance bodies, not per-decision deliberation.
- **Generic "best practice" appeals** — produces vague rationale future maintainers cannot interrogate.
- **Per-project bespoke methodology** — every adopting project reinvents the panel, the protocol, the document conventions; cross-project comparability lost; learning from one project's experience does not transfer.

## Consequences

- Significant linked-data decisions MUST be routed through a Council session per the when-to-use criteria; ad hoc single-perspective decisions on those topics are out of order.
- Routine work MUST NOT trigger a session; padding the agenda dilutes the methodology and risks Council theatre.
- Every Council session produces a transcript at the project's council-directory path, cited from the resulting record's `council:` frontmatter field. Drafters bear the cost of named-expert attribution and citation grounding; positions that cannot be grounded in published methodology meeting §Citation grounding standards do not count.
- The Devil's-Advocate role and recorded dissent are mandatory guards against rubber-stamping; if they consistently fail to produce dissent or withdrawal records, the methodology is being misapplied and must be reviewed.
- Council verdicts are inputs to proposals, not adoption decisions. Adoption flows through the adopting project's real-world governance (declared via §Real-world Governance Handoff); records MUST NOT treat a Council verdict as ratification.
- The panel reflects a Semantic Web / linked-data perspective. For the rare decision predominantly about relational schemas or document stores in a non-linked-data context, the methodology does not apply and a different forum must be used.
- Newcomers can learn the design idiom from session transcripts; transcripts double as training material and MUST be preserved when records supersede each other.
- The methodology is portable across ontology mapping and ontology modelling projects. Adopting projects supply their context via §Adoption hooks; the methodology body itself is not edited per project.
- The methodology is self-amending — substantive changes flow through its own Council protocol per §Self-amendment process. This is a design feature, not a circular dependency: applying the methodology to itself is the strongest test of its coherence.

## References

- **Pattern origin**: this methodology codifies an expert-hive review pattern for ontology-modelling decisions. Panel composition is domain-agnostic with respect to which ontology-modelling project adopts it — the experts' published positions hold across domains.
- **W3C process precedent**: meeting minutes with named-voter resolutions (the consensus-by-deliberation pattern this methodology generalises) — see W3C Process Document §"Decision-making".
- **FIBO/OMG precedent**: Modelling Team review → Editorial Review → Public Review → OMG technology process — the multi-stage ratification pattern this methodology adapts for individual ontology-modelling decisions.
- **DCMI precedent**: vocabulary governance with single-record change logs (the in-place amendment pattern this methodology adopts for catalogue records and for self-amendment).
- **Adopting projects**: each adopting project maintains a project-side adoption record (copy [`adoption-template.md`](adoption-template.md)) declaring the §Adoption hooks slots. The methodology body itself is not edited per project.
- **Substrate primitives**: the swarm and hive-mind config tables in §Rules name the ruflo MCP tool surface canonically. Alternative implementations of the same primitives MAY substitute equivalent tools provided the option surface is preserved.
