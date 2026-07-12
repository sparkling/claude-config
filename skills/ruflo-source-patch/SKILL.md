---
name: ruflo-source-patch
description: Fixes ruflo/@claude-flow's .claude-flow/.swarm folder + daemon proliferation (ruvnet/ruflo#2633) by patching the cwd-anchoring defect at its SOURCE in the installed npm library, and keeping it patched every session. Use when asked to "fix ruflo daemon sprawl", "stop .claude-flow proliferation", "patch ruflo cwd", "install ruflo source patch", or "uninstall ruflo source patch". Explicit triggers: /ruflo-source-patch-install, /ruflo-source-patch-uninstall.
argument-hint: "[install|uninstall]"
allowed-tools: Bash(node *) Read
---

Fixes the defect at its **source**, inside the installed npm library — not by
intercepting callers. This is the key difference from caller-side approaches:
patching the callee means every caller is covered at once (the Bash tool, the
MCP server, and ruflo's own plugin hooks — the last of which no caller-side
guard can reach).

## Install / uninstall

Install (once, machine-wide):
```
node "$HOME/.claude/skills/ruflo-source-patch/scripts/install.mjs"
```

Uninstall (reverts every patched file byte-for-byte, removes the hook):
```
node "$HOME/.claude/skills/ruflo-source-patch/scripts/uninstall.mjs"
```

Equivalent to `/ruflo-source-patch-install` and `/ruflo-source-patch-uninstall`.

## What it patches (ruvnet/ruflo#2633)

Three functions in the installed library anchor state to raw `process.cwd()`
instead of the project root, so Claude Code cwd drift scatters `.claude-flow`/
`.swarm` folders (and the daemons keyed off them) across subdirectories:

| Function | Package / file | Creates |
|----------|----------------|---------|
| `ensureDaemonRunning` | `@claude-flow/cli/dist/src/services/daemon-autostart.js` | `.claude-flow/daemon.pid` + daemon |
| `getMemoryRoot` | `@claude-flow/cli/dist/src/memory/memory-initializer.js` | `.swarm/memory.db` |
| `getProjectCwd` | `@claude-flow/cli-core/dist/src/mcp-tools/types.js` | `.swarm/`, `.claude-flow/tasks` |

The patch injects a self-contained resolver (`__rufloResolveRoot`) that walks up
to the nearest ancestor `.git` (file or dir — worktree-safe), and rewrites each
function to resolve the project root before using cwd. Every one of these copies
is patched across every `~/.npm/_npx/<hash>/` cache directory.

## How it stays applied

The npx cache is volatile — `npx` fetches new copies on version/tag changes, and
`npm cache clean` wipes them. A user-level `SessionStart` hook re-runs the
patcher (silently) on every session start, so any newly-fetched copy gets
patched. Same reapply model as `patch-package`, triggered by session start
rather than `npm install`.

## Safety

- **Reversible**: each file gets a one-time `.rrg-backup`; uninstall restores it
  byte-for-byte and deletes the backup.
- **Idempotent**: a `/* ruflo-source-patch:patched */` marker means re-runs skip
  already-patched files.
- **Safe-fail on version drift**: every edit's exact anchor string is checked
  before any write; if upstream changed the code and an anchor is gone, that
  file is skipped and logged — never a partial or corrupt write.
- **Scope**: only ever writes to files inside the npm packages it patches (in
  the npx cache) and `~/.claude/settings.json`. The patch is a workaround; remove
  it with the uninstaller once #2633 lands upstream.

## Window

A copy fetched by `npx` mid-session is unpatched until the next session start
(the reapply point). This is inherent to any monitor-based reapply — there's no
`npm install`/`npx fetch` hook to intercept it earlier.
