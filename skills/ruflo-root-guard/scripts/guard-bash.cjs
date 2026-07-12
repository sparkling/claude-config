#!/usr/bin/env node
'use strict';
const { resolveRoot } = require('./resolve-root.cjs');

// Registered as a user-level PreToolUse hook matched on Bash
// (~/.claude/settings.json). Fires before every Bash command. If the
// command invokes ruflo/@claude-flow from a cwd that isn't the resolved
// project root, rewrites it to `cd "$ROOT" && <original>` via
// hookSpecificOutput.updatedInput — confirmed against the real Claude
// Code PreToolUse contract (code.claude.com/docs/en/hooks.md), not the
// {"permission":"allow"} shape some ruflo hooks assume (that's Cursor's
// contract; Claude Code ignores it).
//
// Only rewrites — never blocks. A malformed/unmatched command is left
// completely untouched (no stdout at all), so this can never break an
// unrelated Bash call.

// Matches an npx-prefixed or bare ruflo/@claude-flow/claude-flow
// invocation in COMMAND POSITION (start of string, or right after a
// shell separator) — deliberately not a free substring match, so e.g.
// `cat claude-flow-notes.txt` does not trigger.
const RUFLO_INVOKE = /(^|[;&|(]\s*)(npx\s+(?:-y\s+)?(?:ruflo|@claude-flow\/cli|claude-flow)(?:@\S+)?\b|(?:ruflo|claude-flow)\s)/;

let input = '';
process.stdin.on('data', (chunk) => {
  input += chunk;
});
process.stdin.on('end', () => {
  let payload;
  try {
    payload = JSON.parse(input);
  } catch {
    process.exit(0); // can't parse — defer to normal flow, no opinion
  }

  const cwd = payload && payload.cwd;
  const command = payload && payload.tool_input && payload.tool_input.command;

  if (!cwd || typeof command !== 'string' || !RUFLO_INVOKE.test(command)) {
    process.exit(0);
  }

  // Already explicitly anchored by the command itself — don't double-wrap.
  if (/^\s*cd\s+/.test(command)) {
    process.exit(0);
  }

  const root = resolveRoot(cwd);
  if (root === cwd) {
    process.exit(0); // already at root — nothing to rewrite
  }

  const rewritten = `cd "${root}" && ${command}`;
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'allow',
      permissionDecisionReason: `ruflo-root-guard: anchored to project root (${root})`,
      updatedInput: { command: rewritten },
    },
  }));
  process.exit(0);
});

process.stdin.on('error', () => process.exit(0));
setTimeout(() => process.exit(0), 5000);
