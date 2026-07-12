#!/usr/bin/env node
// Installs ruflo-source-patch: (1) registers a user-level SessionStart hook
// that keeps the npm library patched, and (2) applies the patch immediately to
// every copy already in the npx cache. Idempotent.
//
// Usage: node install.mjs [--settings-path <path>]   (path override is for tests)

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import url from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const MARKER = '_rufloSourcePatch';
const SKILL_ROOT = '$HOME/.claude/skills/ruflo-source-patch';

function log(m) { console.log(`[ruflo-source-patch] ${m}`); }

const args = process.argv.slice(2);
const spIdx = args.indexOf('--settings-path');
const settingsPath = spIdx !== -1 && args[spIdx + 1]
  ? path.resolve(args[spIdx + 1])
  : path.join(os.homedir(), '.claude', 'settings.json');

if (!fs.existsSync(settingsPath)) {
  console.error(`[ruflo-source-patch] settings file not found: ${settingsPath}`);
  process.exit(1);
}

const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
settings.hooks = settings.hooks || {};
settings.hooks.SessionStart = settings.hooks.SessionStart || [];

const already = settings.hooks.SessionStart.some((g) =>
  (g.hooks || []).some((h) => h && h[MARKER] === true));

if (already) {
  log('SessionStart hook already installed — no-op');
} else {
  settings.hooks.SessionStart.push({
    hooks: [
      {
        type: 'command',
        command: `node "${SKILL_ROOT}/scripts/session-start-hook.mjs"`,
        timeout: 5000,
        [MARKER]: true,
        _note: 'ruflo-source-patch (ruvnet/ruflo#2633 workaround) — keeps the @claude-flow/cli npm library patched to resolve project root instead of raw cwd; remove via /ruflo-source-patch-uninstall when the upstream fix lands',
      },
    ],
  });
  fs.writeFileSync(settingsPath, `${JSON.stringify(settings, null, 2)}\n`);
  log('registered SessionStart hook (keeps the library patched every session)');
}

// Apply immediately to whatever is already cached.
log('applying patch to current npx cache copies...');
const r = spawnSync(process.execPath, [path.join(__dirname, 'patch-library.mjs')], { encoding: 'utf8' });
process.stdout.write(r.stdout || '');
log('done');
