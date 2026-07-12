#!/usr/bin/env node
import path from 'node:path';
import os from 'node:os';
import { applyGuard } from './apply-guard.mjs';
import { installGlobalHooks } from './global-hooks.mjs';

// Usage:
//   node install.mjs                                  # --scope user (default)
//   node install.mjs --scope user [--settings-path P]  # register the two global hooks (once, ever)
//   node install.mjs --scope project [target-repo-path]  # patch one repo's .mcp.json directly, no hooks
//
// --scope user:    registers SessionStart + PreToolUse hooks in
//                   ~/.claude/settings.json, which then apply the same
//                   per-project patch automatically, forever, in every
//                   repo you open — no further action needed anywhere.
// --scope project: applies that per-project patch to ONE repo right now,
//                   without touching any global hook. Useful for a repo
//                   you want guarded without opting into the global hooks,
//                   or for testing.

function log(msg) {
  console.log(`[ruflo-root-guard] ${msg}`);
}

const args = process.argv.slice(2);
const scopeIdx = args.indexOf('--scope');
const scope = scopeIdx !== -1 && args[scopeIdx + 1] ? args[scopeIdx + 1] : 'user';
const positional = args.filter((a, i) => i !== scopeIdx && i !== scopeIdx + 1 && !a.startsWith('--'));

if (scope === 'user') {
  const settingsFlagIdx = args.indexOf('--settings-path');
  const settingsPath = settingsFlagIdx !== -1 && args[settingsFlagIdx + 1]
    ? path.resolve(args[settingsFlagIdx + 1])
    : path.join(os.homedir(), '.claude', 'settings.json');

  let result;
  try {
    result = installGlobalHooks(settingsPath);
  } catch (err) {
    console.error(`[ruflo-root-guard] ${err.message}`);
    process.exit(1);
  }

  log(result.addedSessionStart
    ? 'added SessionStart hook (auto-patches .mcp.json in every project, silently, once each)'
    : 'SessionStart hook already installed — no-op');
  log(result.addedPreToolUse
    ? 'added PreToolUse hook (anchors ad-hoc npx ruflo/@claude-flow Bash calls to project root)'
    : 'PreToolUse hook already installed — no-op');
  if (result.addedSessionStart || result.addedPreToolUse) {
    log(`wrote ${settingsPath}`);
  } else {
    log('nothing to do — both hooks already installed');
  }
  log('done');
} else if (scope === 'project') {
  const targetRepo = positional[0] ? path.resolve(positional[0]) : process.cwd();

  let result;
  try {
    result = applyGuard(targetRepo);
  } catch (err) {
    console.error(`[ruflo-root-guard] ${err.message}`);
    process.exit(1);
  }

  if (result.helpersCopied) {
    log('copied resolve-root.cjs, guard-mcp.cjs -> .claude/helpers/');
  }
  if (!result.mcpJsonFound) {
    log('.mcp.json not found — nothing to patch (helpers were still installed)');
  } else if (result.patched > 0) {
    log(`patched ${result.patched} MCP server entr${result.patched === 1 ? 'y' : 'ies'} in .mcp.json`);
  } else if (result.alreadyDone > 0) {
    log(`${result.alreadyDone} server entr${result.alreadyDone === 1 ? 'y' : 'ies'} already patched — no-op`);
  } else {
    log('no ruflo/claude-flow MCP server entries found — nothing to patch');
  }
  log('done');
} else {
  console.error(`[ruflo-root-guard] unknown --scope "${scope}" (expected "user" or "project")`);
  process.exit(1);
}
