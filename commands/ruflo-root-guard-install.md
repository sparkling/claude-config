---
allowed-tools: [Bash]
description: "Install ruflo-root-guard (default: global hooks in ~/.claude/settings.json; --scope project for one repo)"
argument-hint: "[--scope user|project] [target-repo-path]"
---

# /ruflo-root-guard-install

Default (recommended — do this once, ever, machine-wide):
```
node "$HOME/.claude/skills/ruflo-root-guard/scripts/install.mjs"
```

This registers two hooks in `~/.claude/settings.json` (`--scope user` is
the default, no flag needed):

- **SessionStart** — on every future session in any project, silently
  anchors that project's `.mcp.json` ruflo/@claude-flow MCP server entry
  to the project root (idempotent — no-ops after the first time per
  project).
- **PreToolUse** (matched on `Bash`) — rewrites ad-hoc `npx ruflo ...` /
  `npx @claude-flow/cli ...` commands to run anchored at the project root,
  regardless of the Bash tool's current working directory.

Both are a workaround for ruvnet/ruflo#2633 (`.claude-flow`/`.swarm`
folder and daemon proliferation from `process.cwd()`-anchored state with
no root resolution). Claude Code merges user-level and project-level
hooks of the same type (arrays are concatenated, not replaced —
code.claude.com/docs/en/settings.md), so this fires in every project
including ones that already define their own hooks — no per-project setup
needed.

Alternative — patch a single repo directly, without touching any global
hook (e.g. to test, or to guard one repo without opting into the global
hooks):
```
node "$HOME/.claude/skills/ruflo-root-guard/scripts/install.mjs" --scope project [target-repo-path]
```
(`target-repo-path` defaults to the current directory.)

Safe to run any of the above more than once — each patched entry (project
`.mcp.json` server, or global hook) carries a marker; already-patched
things are left untouched.

Report what changed (or that it was already installed) after running.
