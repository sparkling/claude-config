# claude-config

Shared Claude Code configuration: global instructions, slash commands, skills, and rendering tools.

## Setup

Clone into `~/.claude/`:

```bash
git clone git@github.com:sparkling/claude-config.git ~/.claude
```

## Structure

```
CLAUDE.md                 # Global instructions (loaded every session)
commands/sc/              # Slash commands (/sc:*)
skills/                   # Claude Code skills
tools/                    # Rendering tools (Mermaid, DOT, Markdown export)
```

### Commands

19 slash commands under `/sc:` covering the development lifecycle:

| Command | Purpose |
|---------|---------|
| `/sc:implement` | Feature and code implementation |
| `/sc:analyze` | Code quality, security, performance analysis |
| `/sc:design` | System architecture and API design |
| `/sc:test` | Test execution and coverage |
| `/sc:build` | Build, compile, and package |
| `/sc:cleanup` | Dead code removal and optimization |
| `/sc:improve` | Systematic code improvements |
| `/sc:git` | Git operations with intelligent commits |
| `/sc:spawn` | Break tasks into coordinated subtasks |
| `/sc:workflow` | Generate workflows from PRDs |
| `/sc:task` | Complex task management |
| `/sc:troubleshoot` | Diagnose and resolve issues |
| `/sc:estimate` | Development estimates |
| `/sc:explain` | Code and concept explanations |
| `/sc:document` | Component documentation |
| `/sc:index` | Project knowledge base generation |
| `/sc:load` | Project context loading |
| `/sc:markdown-export` | Markdown to HTML/PDF export |

### Skills

| Skill | Description |
|-------|-------------|
| `3d-diagramming` | Interactive 3D linked-data/knowledge-graph visualisation (3d-force-graph) |
| `diagramming` | Mermaid and DOT/Graphviz diagram creation (18 guides) |
| `dot-export` | DOT diagram export to PNG/SVG |
| `mermaid-export` | Mermaid diagram export to PNG |
| `markdown-editor` | Markdown editing |
| `notebook` | Jupyter notebook creation |
| `odr-create` | Create a new Ontology Decision Record with sequential numbering |
| `odr-index` | Build/rebuild the ODR index and dependency graph |
| `odr-review` | Lint ODR frontmatter/structure against the DCAP profile |
| `owl` | OWL 2 ontology design |
| `qlever` | QLever SPARQL engine configuration |
| [`ruflo-root-guard`](#ruflo-root-guard-in-detail) | Anchors ruflo/@claude-flow to the project root, stopping `.claude-flow`/`.swarm` folder & daemon proliferation from cwd drift ([ruvnet/ruflo#2633](https://github.com/ruvnet/ruflo/issues/2633) workaround) |
| `shacl` | SHACL data validation |
| `skos` | SKOS knowledge organization |
| `sparql` | SPARQL query writing and optimization |

#### `ruflo-root-guard` in detail

Registers two hooks — `SessionStart` (silently anchors each project's
`.mcp.json` on first visit) and `PreToolUse` (rewrites ad-hoc
`npx ruflo`/`npx @claude-flow/cli` Bash calls to run at project root) —
so `.claude-flow`/`.swarm` state, and the daemons keyed off it, can never
be created away from the project root by Claude Code's cwd drift. No npm
package: plain local scripts, idempotent, offline, cleanly removable.

```bash
# once, ever, machine-wide (or use /ruflo-root-guard-install)
node "$HOME/.claude/skills/ruflo-root-guard/scripts/install.mjs"

# uninstall (or /ruflo-root-guard-uninstall)
node "$HOME/.claude/skills/ruflo-root-guard/scripts/uninstall.mjs"

# one repo only, no global hooks
node "$HOME/.claude/skills/ruflo-root-guard/scripts/install.mjs" --scope project [path]
node "$HOME/.claude/skills/ruflo-root-guard/scripts/uninstall.mjs" --scope project [path]
```

Source: [`skills/ruflo-root-guard/`](https://github.com/sparkling/claude-config/tree/main/skills/ruflo-root-guard)

Related upstream issues (all confirmed open/reproduced against `@claude-flow/cli` 3.25.6, all part of the same `process.cwd()`-anchoring root cause):
- [ruvnet/ruflo#2633](https://github.com/ruvnet/ruflo/issues/2633) — unbounded daemon proliferation from `.claude-flow` state anchored to `process.cwd()` with no root resolution or global registry (the primary issue this skill works around)
- [ruvnet/ruflo#1639](https://github.com/ruvnet/ruflo/issues/1639) — MCP handlers using `process.cwd()` as artifact anchor sprawl under Claude Code cwd drift (closed as fixed, regressed — folded into #2633)
- [ruvnet/ruflo#1115](https://github.com/ruvnet/ruflo/issues/1115) — orphan daemons from subdirectory launches, no global PID registry (closed as fixed, regressed — folded into #2633)
- [ruvnet/ruflo#765](https://github.com/ruvnet/ruflo/issues/765) — duplicate `.claude-flow`/`.swarm` folders in subdirectories (open since 2025-09)
- [ruvnet/ruflo#2629](https://github.com/ruvnet/ruflo/issues/2629) — `memory init` ignores `CLAUDE_FLOW_DB_PATH`, always writes `<cwd>/.swarm/memory.db` (same cwd-anchoring class, open)

### Tools

| Tool | Description |
|------|-------------|
| `dot-renderer` | Render DOT/Graphviz to PNG |
| `mermaid-renderer` | Render Mermaid diagrams to PNG |
| `markdown-export` | Convert Markdown to HTML/PDF |

## What's not tracked

Everything else in `~/.claude/` is runtime state managed by Claude Code (sessions, todos, plugins, debug logs, credentials, telemetry). See `.gitignore` for the full exclusion list.
