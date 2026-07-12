#!/usr/bin/env node
// Uninstalls ruflo-source-patch: (1) reverts every patched library file from
// its .rrg-backup, and (2) removes the SessionStart hook from settings.json.
// Idempotent.
//
// Usage: node uninstall.mjs [--settings-path <path>]

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import url from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const MARKER = '_rufloSourcePatch';

function log(m) { console.log(`[ruflo-source-patch] ${m}`); }

const args = process.argv.slice(2);
const spIdx = args.indexOf('--settings-path');
const settingsPath = spIdx !== -1 && args[spIdx + 1]
  ? path.resolve(args[spIdx + 1])
  : path.join(os.homedir(), '.claude', 'settings.json');

// 1. Revert the library patches first (so we stop patching before removing the hook).
log('reverting patched library files...');
const r = spawnSync(process.execPath, [path.join(__dirname, 'patch-library.mjs'), '--revert'], { encoding: 'utf8' });
process.stdout.write(r.stdout || '');

// 2. Remove the SessionStart hook.
if (!fs.existsSync(settingsPath)) {
  log(`settings file not found: ${settingsPath} — hook removal skipped`);
  process.exit(0);
}

const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
let removed = 0;

if (settings.hooks && Array.isArray(settings.hooks.SessionStart)) {
  settings.hooks.SessionStart = settings.hooks.SessionStart
    .map((g) => {
      if (!g || !Array.isArray(g.hooks)) return g;
      const kept = g.hooks.filter((h) => !(h && h[MARKER] === true));
      if (kept.length === g.hooks.length) return g;
      removed += 1;
      return kept.length > 0 ? { ...g, hooks: kept } : null;
    })
    .filter((g) => g !== null);
}

if (removed > 0) {
  fs.writeFileSync(settingsPath, `${JSON.stringify(settings, null, 2)}\n`);
  log(`removed ${removed} SessionStart hook group(s) from ${settingsPath}`);
} else {
  log('no SessionStart hook to remove (already uninstalled)');
}
log('done');
