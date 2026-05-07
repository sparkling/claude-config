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
| `diagramming` | Mermaid and DOT/Graphviz diagram creation (18 guides) |
| `dot-export` | DOT diagram export to PNG/SVG |
| `mermaid-export` | Mermaid diagram export to PNG |
| `markdown-editor` | Markdown editing |
| `notebook` | Jupyter notebook creation |
| `owl` | OWL 2 ontology design |
| `qlever` | QLever SPARQL engine configuration |
| `shacl` | SHACL data validation |
| `skos` | SKOS knowledge organization |
| `sparql` | SPARQL query writing and optimization |

### Tools

| Tool | Description |
|------|-------------|
| `dot-renderer` | Render DOT/Graphviz to PNG |
| `mermaid-renderer` | Render Mermaid diagrams to PNG |
| `markdown-export` | Convert Markdown to HTML/PDF |

## What's not tracked

Everything else in `~/.claude/` is runtime state managed by Claude Code (sessions, todos, plugins, debug logs, credentials, telemetry). See `.gitignore` for the full exclusion list.
