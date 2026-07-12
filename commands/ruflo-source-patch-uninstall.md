---
allowed-tools: [Bash]
description: "Uninstall ruflo-source-patch — revert every patched library file and remove the hook"
---

# /ruflo-source-patch-uninstall

Run:

```
node "$HOME/.claude/skills/ruflo-source-patch/scripts/uninstall.mjs"
```

Reverts every patched `@claude-flow/cli` / `@claude-flow/cli-core` file
from its `.rrg-backup` (byte-for-byte restore, backup deleted), then
removes the `SessionStart` hook from `~/.claude/settings.json`. Leaves
everything else in that file untouched.

Run this once ruvnet/ruflo#2633 has landed upstream, or any time you want
the library back to its pristine state. Idempotent. Report what was
reverted after running.
