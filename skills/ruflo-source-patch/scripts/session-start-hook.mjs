#!/usr/bin/env node
// Registered as a user-level SessionStart hook. On every session start, runs
// the source patcher in --quiet mode: silently (re)applies the cwd-anchoring
// patch to any @claude-flow/cli / @claude-flow/cli-core copy in the npx cache
// that isn't already patched — including brand-new copies npx fetched since
// last session. Best-effort; never blocks session start.

import { spawn } from 'node:child_process';
import path from 'node:path';
import url from 'node:url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const patcher = path.join(__dirname, 'patch-library.mjs');

// Drain stdin (Claude Code pipes hook event JSON) so the process doesn't wait.
try { process.stdin.resume(); process.stdin.on('data', () => {}); } catch { /* ignore */ }

const child = spawn(process.execPath, [patcher, '--quiet'], {
  stdio: 'ignore',
  detached: false,
});
child.on('exit', () => process.exit(0));
child.on('error', () => process.exit(0));

// Hard cap: never hold up a session.
setTimeout(() => process.exit(0), 4500);
