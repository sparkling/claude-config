# Session-Record Templates & Pre-flight Checklist

Reference material for the `council` skill, Step 4. The session record lives in the project's council directory as `session-NNN-<slug>.md` (meta-Councils: `scope-check-N-<slug>.md`). Normative source: [methodology.md](methodology.md) §Session document conventions, §Two-artefact discipline, §Enforcement. For worked exemplars, see prior session records in the project's council directory.

Find the next number by globbing the council directory for `session-*.md`. Apply markdown blank-line rules (blank line around every heading, table, code block, and list).

## Header (all tiers)

```markdown
# Council Session NNN (Rk) — <Title> (<Tier>)

- **Date:** YYYY-MM-DD
- **Records:** <ODR/ADR under review or produced — link it; state "No new ODR" + what it confirms/realises if a confirmation>
- **Queen:** <name> (<one-line basis — e.g. "FIBO; owns the §Q2a four-way">)
- **Devil's Advocate:** <name> (<the genuinely-opposed published position>)   ← omit for Author-only
- **Panel:** <names + affiliations + the cluster each covers>                  ← omit for Author-only
- **Voices:** <N> across <M> teammates.                                        ← Full/Reduced only
- **`consensus-mode`:** <agent-fan-out | hive-mind/… | none> (<cross-talk transport; "no hive-mind" where apt>)
- **Format:** <Full Council | Reduced Council | Author-only> (~<k> runs)
- **Input:** <working/session-NNN/EVIDENCE.md and the TTL/shapes/dictionary/prior ODRs>
```

## Author-only body (no panel, no tally)

Used when precedent/methodology has already settled the decision.

```markdown
## Context

<The question and stakes; why this is settled (which prior session/panel established it),
so Author-only is the correct tier per the methodology §Format tiers.>

## Decision (confirmed)

<What is confirmed/recorded, with the decisive test stated. Numbered consequences for the
artefact (what gets emitted, what attaches where).>

## Consequences

<What unblocks; which roadmap row is struck/updated; any one-line pointer to add to a neighbouring ODR.>
```

## Full / Reduced body (per-question transcript + two-artefact tally)

Used for substantive splits (Full) or narrow disputed axes (Reduced).

```markdown
## Context

<The question and stakes; the empirical findings the panel verified; the framing alternatives
(a/b/c/d) if the Queen set up a multi-way.>

## Question 1 — <question>

**<verdict line: N–M–K FOR …; DA disposition>.**

**<Name>:** <position, grounded citation inline>.
**<Name> (Queen):** <position> .
**<Name> (DA):** <attack; explicit WITHDRAW or HOLD with the named condition>.

**Vote Q1: N–M–K** (<one-line verdict; who held what>).

## Question 2 — <question>

… (one section per question)

## Synthesis (Queen — <name>)

<Narrative verdict: where the council lands and on what criterion; the decisive argument named
to the expert who made it; the produced/amended record (→ ODR-NNNN). The DA's dissent recorded
as load-bearing tension where held-as-live, WITH its re-open trigger. As-built findings that
sharpened the verdict. Downstream: what unblocks; roadmap row struck; status proposed; operator ratifies.>

## Tally appendix

| Voice | Q1 | Q2 | … |
|---|---|---|---|
| <Name> (Queen) | FOR | FOR | … |
| <Name> | FOR | AGAINST | … |
| <Name> (DA) | AGAINST² | FOR | … |
| **Tally** | **N-M-K** | **N-M-K** | … |

<footnotes for partial/abstain/held votes, e.g. "² held for alternative (d)">

### DA scorecard (<DA name>)

| Q | Disposition | Condition |
|---|---|---|
| Q1 | **HELD** (alt d) | <withdrawal condition verbatim> → **met by <rule>** / still unmet |
| Q2 | **WITHDRAWN** | <what won them over> |
| Q3 | **CONCEDED** | <no attack mounted> |

**Held-as-live dissent:** <DA position>. **Re-open trigger:** <the condition that re-opens it>.
Recorded in ODR-NNNN §Held dissent + §Alternatives.

### Per-question count

Q1 N-M-K · Q2 N-M-K · … <note the lowest FOR count; flag any question below the comfort threshold>.
```

The **DA scorecard is mechanical**: each contested question maps to WITHDRAWN (condition met) / HELD (condition unmet → held-as-live with named re-open trigger) / CONCEDED (no attack). No vague "DA aligned with majority" — the alignment traces to specific named conditions per question.

## Disposition routing (Step 5)

- **AFFIRM / produced** → `odr-create` a new ODR (or confirm the standing one); set `council: session-NNN` in its frontmatter; `status: proposed`.
- **REVISE** → amend the named ODR/ADR §section; note the session as the amending authority.
- **REJECT** → strike the proposition; mark the record `rejected` with a pointer (or strike the roadmap row).
- **Held-as-live dissent** → record verbatim with its re-open trigger in BOTH the session record and the produced ODR (`## Alternatives` or a §Held dissent note).
- **Operator handoff** → the produced record stays `proposed`; the operator ratifies adoption. The Council shapes proposals, not their adoption.

## Pre-flight / enforcement checklist (methodology §Enforcement)

Before declaring the session complete, verify:

- [ ] Pre-flight scope check run (ratify-as-is / re-scope / retire) before convening.
- [ ] When-to-use criteria met; NOT a routine add / editorial fix.
- [ ] Cheapest adequate **format tier** chosen and declared; deviations from Full justified inline.
- [ ] **`consensus-mode`** declared; `agent-fan-out` unless a byzantine/typed-output trigger genuinely fired.
- [ ] Queen and DA **named**; DA's published methodology **genuinely opposed** to the framing.
- [ ] Roster **scoped** to the relevant experts; no padding ("nothing distinctive to add → left out").
- [ ] Panel spawned in **ONE message** (Full/Reduced); positions written to `working/session-NNN/`.
- [ ] Each expert position **grounded** in a §Citation-grounding source; Queen verified; ungrounded positions not counted.
- [ ] DA **explicitly withdrew or held** on every contested question (no silent alignment); holds carry a named re-open trigger.
- [ ] Per-question tally is `N-M-K` (three exact integers; approximations only with a recorded verbatim abstention reason).
- [ ] Queen **composed, did not fabricate** — every quotation traces to actual agent output.
- [ ] Two-artefact discipline honoured (Full/Reduced: narrative synthesis + tally appendix + DA scorecard; Author-only: narrative only).
- [ ] Dispositions routed; held dissent + re-open trigger recorded; produced record `status: proposed` pending operator ratification.
- [ ] Track-record row added to the project's adoption record (§Track Record).
