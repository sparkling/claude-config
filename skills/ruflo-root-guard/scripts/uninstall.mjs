#!/usr/bin/env node
import path from 'node:path';
import os from 'node:os';
import { revertGuard } from './apply-guard.mjs';
import { uninstallGlobalHooks } from './global-hooks.mjs';

// Usage:
//   node uninstall.mjs                                  # --scope user (default)
//   node uninstall.mjs --scope user [--settings-path P]  # remove the two global hooks
//   node uninstall.mjs --scope project [target-repo-path]  # revert one repo's .mcp.json to its pre-patch state
//
// --scope user:    removes exactly the hook entries --scope user install
//                   added (marker-based), leaving the rest of
//                   ~/.claude/settings.json untouched. Does NOT revert
//                   already-patched projects' .mcp.json files — those
//                   keep working harmlessly; this just stops NEW projects
//                   from being auto-patched going forward.
// --scope project: fully reverts one repo's .mcp.json back to its
//                   pre-patch command/args (from the saved
//                   _rootGuardOriginal), for repos you want fully
//                   un-guarded right now.

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
    result = uninstallGlobalHooks(settingsPath);
  } catch (err) {
    console.error(`[ruflo-root-guard] ${err.message}`);
    process.exit(1);
  }

  if (result.removedGroups > 0) {
    log(`removed ${result.removedGroups} ruflo-root-guard hook group(s) from ${settingsPath}`);
    log('note: already-patched projects\' .mcp.json files are left as-is (harmless) — use --scope project to revert a specific one');
  } else {
    log('nothing to remove — ruflo-root-guard was not installed (or already uninstalled)');
  }
  log('done');
} else if (scope === 'project') {
  const targetRepo = positional[0] ? path.resolve(positional[0]) : process.cwd();

  let result;
  try {
    result = revertGuard(targetRepo);
  } catch (err) {
    console.error(`[ruflo-root-guard] ${err.message}`);
    process.exit(1);
  }

  if (!result.mcpJsonFound) {
    log('.mcp.json not found — nothing to revert');
  } else if (result.reverted > 0) {
    log(`reverted ${result.reverted} MCP server entr${result.reverted === 1 ? 'y' : 'ies'} in .mcp.json to its pre-patch state`);
  } else {
    log('no ruflo-root-guard-patched entries found — nothing to revert');
  }
  log('done');
} else {
  console.error(`[ruflo-root-guard] unknown --scope "${scope}" (expected "user" or "project")`);
  process.exit(1);
}
