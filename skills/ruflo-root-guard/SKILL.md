---
name: ruflo-root-guard
description: Installs (or uninstalls) a project-root guard for ruflo/@claude-flow, stopping .claude-flow/.swarm folder (and daemon) proliferation caused by Claude Code cwd drift. Use when setting up a new ruflo repo, or when asked to "install root guard", "fix daemon sprawl", "anchor ruflo to project root", "stop .claude-flow folder proliferation", "uninstall root guard", or "remove ruflo root guard". For an unambiguous, explicit trigger instead of description-matching, use /ruflo-root-guard-install or /ruflo-root-guard-uninstall directly.
argument-hint: "[--scope user|project] [target-repo-path]"
allowed-tools: Bash(node *) Read
---

One entry point, two scopes — `install.mjs`/`uninstall.mjs` both take
`--scope user` (default) or `--scope project [target-repo-path]`.

## `--scope user` (default — do this once, ever, machine-wide)

Install:
```
node "$HOME/.claude/skills/ruflo-root-guard/scripts/install.mjs"
```

Uninstall:
```
node "$HOME/.claude/skills/ruflo-root-guard/scripts/uninstall.mjs"
```

Both are idempotent (safe to re-run) and only touch `~/.claude/settings.json`
— specifically, hook entries carrying a `_rufloRootGuard: true` marker, so
uninstall removes exactly what install added and nothing else. Equivalent
to the dedicated `/ruflo-root-guard-install` and `/ruflo-root-guard-uninstall`
commands, which exist for unambiguous invocation without relying on this
skill's description-matching.

This registers two hooks:

- **SessionStart** — fires on every future session, in every project.
  Silently applies the per-project patch (below) to that project's
  `.mcp.json` if it hasn't been patched yet; completely silent (no output)
  on every subsequent session once it has. Logs to
  `~/.claude/skills/ruflo-root-guard/session-start.log` only when it
  actually patches something.
- **PreToolUse** (matched on `Bash`) — fires before every Bash command.
  If the command invokes `npx ruflo`/`npx @claude-flow/cli`/bare
  `ruflo`/`claude-flow` from a cwd that isn't the resolved project root,
  rewrites it to `cd "$ROOT" && <original>` via the hook's
  `updatedInput.command` field (confirmed against the real Claude Code
  `PreToolUse` contract — see `code.claude.com/docs/en/hooks.md` — not
  the `{"permission":"allow"}` shape some ruflo hooks assume, which is
  Cursor's contract and which Claude Code ignores). Only ever rewrites,
  never blocks; a non-matching or already-anchored command produces no
  output at all, so it can never interfere with an unrelated Bash call.

Claude Code merges user-level and project-level hooks of the same type —
arrays are concatenated, not replaced (`code.claude.com/docs/en/settings.md`)
— so these fire in every project automatically, including ones that
already define their own `hooks.SessionStart`/etc. No per-project setup
is needed anywhere; a `--scope user` install alone is sufficient.

## `--scope project [target-repo-path]` (optional — one repo, right now)

Install:
```
node "$HOME/.claude/skills/ruflo-root-guard/scripts/install.mjs" --scope project [target-repo-path]
```

Uninstall (fully reverts, using the saved pre-patch state):
```
node "$HOME/.claude/skills/ruflo-root-guard/scripts/uninstall.mjs" --scope project [target-repo-path]
```

(`target-repo-path` defaults to the current directory.) Useful for
testing, or for guarding/un-guarding one repo without touching the global
hooks at all. Not required if `--scope user` is already installed — that
alone covers every repo.

## The underlying mechanism

Both scopes apply the same patch: idempotently rewrite the project's
`.mcp.json` so any `ruflo`/`@claude-flow` MCP server entry launches
through a small wrapper (`guard-mcp.cjs`) that resolves the project root
(nearest ancestor `.git`, walking up to 32 levels) and pins the
subprocess's working directory to that root before exec'ing the real
command — so ruflo's `process.cwd()`-anchored state (`.claude-flow/`,
`.swarm/`) always lands at the project root, regardless of where the
process was launched from.

This targets the root cause documented in ruvnet/ruflo#2633:
`.claude-flow` is created at raw `process.cwd()` with no root resolution,
that folder is the daemon spawn gate, and dedup is per-folder — so cwd
drift multiplies both stray folders and daemons.

## Design constraints

- Only ever writes into files the user or a target project already owns:
  `~/.claude/settings.json` (`--scope user`) or
  `<target-repo>/.claude/helpers/` + `<target-repo>/.mcp.json`
  (`--scope project`). Never edits, patches, or shadows anything under
  `node_modules/` or an npx cache — ruflo's installed files are never
  touched.
- No npm package: everything is plain local scripts, copy-paste
  installable, offline after the initial folder copy, and cleanly
  removable via `uninstall.mjs` without leaving a registry artifact
  behind — appropriate for a workaround meant to disappear once #2633
  lands upstream.
- Safe to run repeatedly at either scope: `--scope project` entries get a
  `_rootGuard` marker; `--scope user` hook entries get a `_rufloRootGuard`
  marker. Already-patched/installed things are skipped, not re-applied.
- `--scope user` uninstall stops NEW projects from being auto-patched but
  does not retroactively revert already-patched `.mcp.json` files
  (harmless to leave patched — use `--scope project` on a specific repo
  to fully revert it).
- Installed once here at user level (`~/.claude/skills/ruflo-root-guard/`).
  A separate project-local copy also exists in
  `semantic-modelling/.claude/skills/ruflo-root-guard/` from initial
  development/testing, predating this unified interface — stale and
  redundant now that `--scope user` covers every repo including that one;
  safe to remove.
