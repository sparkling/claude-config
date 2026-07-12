---
allowed-tools: [Bash]
description: "Uninstall ruflo-root-guard (default: global hooks in ~/.claude/settings.json; --scope project to revert one repo)"
argument-hint: "[--scope user|project] [target-repo-path]"
---

# /ruflo-root-guard-uninstall

Default — removes the global hooks:
```
node "$HOME/.claude/skills/ruflo-root-guard/scripts/uninstall.mjs"
```

Removes exactly the SessionStart and PreToolUse hook entries
`ruflo-root-guard` registered (matched via their `_rufloRootGuard`
marker) from `~/.claude/settings.json`. Leaves everything else in that
file untouched.

Note: this does **not** revert already-patched projects' `.mcp.json`
files — those keep working harmlessly through `guard-mcp.cjs` going
forward; uninstalling just stops NEW projects from being auto-patched.

Alternative — fully revert one specific repo's `.mcp.json` back to its
pre-patch command/args:
```
node "$HOME/.claude/skills/ruflo-root-guard/scripts/uninstall.mjs" --scope project [target-repo-path]
```
(`target-repo-path` defaults to the current directory. Uses the
`_rootGuardOriginal` saved on each patched entry to restore it exactly.)

If ruvnet/ruflo#2633 has landed upstream and you want to fully remove
this workaround's traces everywhere: run the global uninstall above,
`--scope project` revert each repo you patched, then delete
`~/.claude/skills/ruflo-root-guard/`.

Report what was removed (or that it was already uninstalled) after
running.
