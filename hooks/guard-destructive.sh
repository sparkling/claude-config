#!/usr/bin/env bash
# guard-destructive.sh — PreToolUse hook for the Bash tool.
#
# Reads Claude's tool-call JSON from stdin, extracts the command, and emits
# a permission-ASK decision (with context) if the command matches a
# destructive pattern documented in:
#   - memory/feedback-no-history-squash.md  (force-push, squash, rebase rewrites)
#   - system prompt Git Safety Protocol      (reset --hard, branch -D, clean -f, etc.)
#   - system prompt "Executing actions with care" (rm -rf, kill processes)
#
# When matched, returns permissionDecision:"ask" so the user is prompted in-line
# with the reason. User grants or denies per occurrence; Claude doesn't have to
# find a workaround silently.
#
# Otherwise, exits silently so the tool call proceeds normally.

set -u

cmd=$(jq -r '.tool_input.command // ""' 2>/dev/null)
[[ -z "$cmd" ]] && exit 0

ask() {
  local reason="$1"
  jq -n --arg r "$reason" '{
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "ask",
      permissionDecisionReason: $r
    }
  }'
  exit 0
}

# ── git: history-rewrite + working-tree-destructive ────────────────────────

# git reset --hard (any form)
if echo "$cmd" | grep -qE '\bgit\b([^|;&]*)\breset\b([^|;&]*)\B--hard\b'; then
  ask "Destructive: 'git reset --hard' overwrites local commits and working tree. Source: system prompt Git Safety Protocol; today's incident wiped 12 trunk-pivot commits across 4 forks. Confirm to proceed."
fi

# git push --force / -f / --force-with-lease (any force-push form)
if echo "$cmd" | grep -qE '\bgit\b([^|;&]*)\bpush\b([^|;&]*)(--force(-with-lease)?|\s-[a-zA-Z]*f[a-zA-Z]*\b)'; then
  ask "Destructive: force-push rewrites remote history. Source: memory feedback-no-history-squash ('Never force-push to sparkling/main or any fork's main' / 'force-push-to-main is gated on explicit user instruction'). Includes --force-with-lease — still a force-push by category. Confirm to proceed."
fi

# git branch -D (force-delete)
if echo "$cmd" | grep -qE '\bgit\b([^|;&]*)\bbranch\b([^|;&]*)-D\b'; then
  ask "Destructive: 'git branch -D' force-deletes a branch and loses unmerged commits. Source: system prompt Git Safety Protocol. Confirm to proceed."
fi

# git clean -f / -fd / -fdx
if echo "$cmd" | grep -qE '\bgit\b([^|;&]*)\bclean\b([^|;&]*)-[a-zA-Z]*f'; then
  ask "Destructive: 'git clean -f' permanently deletes untracked files (no recovery). Source: system prompt Git Safety Protocol. Confirm to proceed."
fi

# git checkout . / git checkout -- .
if echo "$cmd" | grep -qE '\bgit\b([^|;&]*)\bcheckout\b([^|;&]*)(--[ \t]+)?\.($|[ \t&;|])'; then
  ask "Destructive: 'git checkout .' / 'git checkout -- .' discards uncommitted changes. Source: system prompt Git Safety Protocol. Confirm to proceed."
fi

# git restore . / git restore --staged .
if echo "$cmd" | grep -qE '\bgit\b([^|;&]*)\brestore\b([^|;&]*)(\s|--staged\s)\.($|[ \t&;|])'; then
  ask "Destructive: 'git restore .' / 'git restore --staged .' discards uncommitted changes. Source: system prompt Git Safety Protocol. Confirm to proceed."
fi

# git commit --amend (rewrites history; especially bad if pushed)
if echo "$cmd" | grep -qE '\bgit\b([^|;&]*)\bcommit\b([^|;&]*)\B--amend\b'; then
  ask "Destructive: 'git commit --amend' rewrites the previous commit. If the commit was pushed, amending then force-pushing is data-loss-by-default. Source: system prompt 'CRITICAL: Always create NEW commits rather than amending'. Confirm to proceed."
fi

# git rebase -i / --interactive (squash variant — explicit memory rule)
if echo "$cmd" | grep -qE '\bgit\b([^|;&]*)\brebase\b([^|;&]*)(-i\b|--interactive\b)'; then
  ask "Destructive: 'git rebase -i' is the squash variant — rewrites history. Source: memory feedback-no-history-squash ('Working-branch squashes are also discouraged' / 'Force-push-with-squash on a shared branch is a data-loss risk'). Confirm to proceed."
fi

# git rebase --onto (rewrites history graph)
if echo "$cmd" | grep -qE '\bgit\b([^|;&]*)\brebase\b([^|;&]*)--onto\b'; then
  ask "Destructive: 'git rebase --onto' rewrites history graph. Source: memory feedback-no-history-squash (history-rewrite category). Confirm to proceed."
fi

# Any git command with --no-verify (skips pre-commit/pre-push hooks)
if echo "$cmd" | grep -qE '\bgit\b([^|;&]*)\B--no-verify\b'; then
  ask "Destructive: '--no-verify' skips hooks (pre-commit, pre-push, etc.). Source: system prompt Git Safety Protocol ('NEVER skip hooks unless the user has explicitly asked for it'). Confirm to proceed."
fi

# Any git command with --no-gpg-sign (bypassing signing)
if echo "$cmd" | grep -qE '\bgit\b([^|;&]*)\B--no-gpg-sign\b'; then
  ask "Destructive: '--no-gpg-sign' bypasses commit/tag signing. Source: system prompt Git Safety Protocol. Confirm to proceed."
fi

# ── processes ─────────────────────────────────────────────────────────────

# kill -9 / kill -SIGKILL (cannot be trapped by the process)
if echo "$cmd" | grep -qE '\bkill\b[^|;&]*-(9|SIGKILL)\b'; then
  ask "Destructive: 'kill -9' / 'kill -SIGKILL' bypasses the process's signal handler — no graceful shutdown, in-flight writes may be lost. Source: system prompt 'Executing actions with care' (killing processes is in the destructive list). Confirm to proceed."
fi

# pkill / killall (kills by name pattern — high blast radius)
if echo "$cmd" | grep -qE '\b(pkill|killall)\b'; then
  ask "Destructive: 'pkill' / 'killall' kills processes by name pattern — broad blast radius (kills all matches, not just the one you meant). Source: system prompt 'Executing actions with care'. Confirm to proceed."
fi

# Default: allow.
exit 0
