---
allowed-tools: [Bash]
description: "Install ruflo-source-patch — patch the @claude-flow/cli npm library at source + keep it patched"
---

# /ruflo-source-patch-install

Run:

```
node "$HOME/.claude/skills/ruflo-source-patch/scripts/install.mjs"
```

Registers a user-level `SessionStart` hook that keeps the installed
`@claude-flow/cli` / `@claude-flow/cli-core` npm library patched, and
applies the patch immediately to every copy currently in the npx cache.

The patch fixes ruvnet/ruflo#2633 at its source: three functions
(`ensureDaemonRunning`, `getMemoryRoot`, `getProjectCwd`) that anchor
`.claude-flow`/`.swarm` state to raw `process.cwd()` are rewritten to
resolve the project root (nearest ancestor `.git`) first — so Claude Code
cwd drift can no longer scatter folders and daemons across subdirectories.
Because it fixes the callee, it covers every caller including ruflo's own
plugin hooks.

Idempotent and reversible. Report what was patched after running.
