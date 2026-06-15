# Consensus Modes & Substrate (fan-out is the default; hive-mind is the exception)

Reference material for the `council` skill. The normative source is [methodology.md](methodology.md) §Consensus-mode framework, §Substrate operations, §Cross-talk transport. The standing directive: prefer agent fan-out / Agent Teams for councils; escalate to hive-mind only on a conditional / typed-output trigger.

## The default: `agent-fan-out`

Almost every session uses this. The Queen spawns the panel as background sub-agents via Claude's **`Task`** tool in ONE message; each returns an independent per-question position; the Queen tallies and synthesises. No hive-mind machinery.

- **Substrate**: optionally `swarm_init` for bookkeeping (topology/maxAgents), then `Task` agents spawned in parallel. The substrate is NOT load-bearing for the verdict — the verdict is the Queen's narrative over the returned positions.
- **Criterion**: votes on each question are *independent* of votes on other questions; the verdict reduces to a tally of standalone positions.
- **Cross-talk**: the recommended default is direct agent-to-agent messaging via **Agent Teams** (`SendMessage`, `team_name: "council-NNN"`) — workers respond to peers before settling (one opening + one rebuttal pass is the convention). Requires the `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` toggle. Fallbacks, in order: file-based positions (write `pos-<name>.md` → barrier → read peers → react) → queen-composed (only when peer-revision is genuinely out of scope; it forgoes the dialectic).

This is the mechanism the brief enforces. Reach for it FIRST.

## When (and ONLY when) to escalate to hive-mind

`hive-mind_spawn` / `hive-mind_consensus` is costly and reserved. Escalate ONLY if one of these two triggers genuinely fires:

| Trigger | `consensus-mode` | Why hive-mind, not fan-out |
|---|---|---|
| A verdict on one question is *conditional* on another (multi-condition DA withdrawals; structural vote acknowledgement matters) | `hive-mind/byzantine` | Byzantine consensus records the structural dependency between votes that a flat tally cannot. |
| The verdict produces a *structured object consumed by downstream tooling* (a generator, a linter, an LLM retriever); the tally is data, not decoration | `hive-mind/typed-output` | The typed verdict is persisted as `hive-mind_memory` `type: consensus` and read mechanically downstream. |

The two-artefact discipline is default for Full + Reduced regardless of mode; the MODES remain available as the two escalation triggers above. If neither trigger fires, **use `agent-fan-out`** — do not escalate for prestige or "thoroughness". A council convened on the wrong substrate is more expensive, not more rigorous.

## Full consensus-mode table (for completeness)

Selected per session by the shape of the verdict. Most rows are specialised hive-mind variants used only on the triggers above.

| `consensus-mode` | Criterion | Substrate |
|---|---|---|
| `agent-fan-out` (**default**) | Per-question votes are independent; verdict = tally of standalone positions | `swarm_init` (bookkeeping) + `Task` fan-out in parallel |
| `hive-mind/byzantine` | Verdict on one question conditional on another | `hive-mind_init` `consensus: byzantine`; `hive-mind_consensus` per question |
| `hive-mind/typed-output` | Verdict is a structured object consumed by tooling | `hive-mind_init` `consensus: quorum`/`weighted`; verdicts persisted as `hive-mind_memory` `type: consensus` |
| `hive-mind/weighted` | Queen authoritative; worker votes advisory (queen ×3) | `hive-mind_init` `consensus: weighted` |
| `hive-mind/quorum` | Caller-chosen threshold (unanimous / majority / supermajority) | `hive-mind_init` `consensus: quorum` + `quorumPreset` |
| `hive-mind/raft` | Sequential term-ordered decisions, each superseding the prior | `hive-mind_init` `consensus: raft` |
| `hive-mind/gossip` | Advisory eventual-consistency rounds; tolerates dropouts | `hive-mind_init` `consensus: gossip` |
| `hive-mind/crdt` | Re-broadcast safety; out-of-order delivery; convergence required | `hive-mind_init` `consensus: crdt` |
| `none` | Author-only session; no panel to coordinate | single Queen run on the main thread |

**One primitive, never both.** A session uses the `swarm`-shaped fan-out OR a hive-mind init — never `swarm_init` + `hive-mind_init` wrapped together. Hive-mind init *is* a swarm-shaped construct (methodology §Consensus-mode framework note).

## Substrate calling convention

- The Queen calls MCP tools directly when a hive-mind mode is in use (`mcp__ruflo__hive-mind_init({...})`, `mcp__ruflo__hive-mind_consensus({...})`); sub-agents spawned via `Task` may also call MCP tools directly — no `ToolSearch` preamble required inside an agent.
- Inter-sub-agent messaging uses `SendMessage` with `team_name`-tagged Agent Teams (the default cross-talk transport).
- CLI / shell fallbacks (`npx ... hive-mind spawn --claude`) are reserved for environments where the MCP server is unavailable — they are NOT a viable fallback inside an active session with a running MCP server (lock contention).
- For `agent-fan-out` (the default), checkpointing is via git (working files are commit-tracked). The hive-mind session-archive mechanism (`hive-mind sessions checkpoint/export/import`, `hive-mind resume`) is used only for multi-day sessions running a hive-mind mode.
