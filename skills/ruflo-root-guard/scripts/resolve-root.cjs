#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');

const MAX_DEPTH = 32;

// Walk up from startDir to the nearest ancestor containing .git (file or
// dir — this stops correctly at a worktree's own .git file, not just a
// full .git dir). Falls back to the original dir if nothing is found,
// logging a warning rather than throwing.
function resolveRoot(startDir) {
  const origin = path.resolve(startDir || process.cwd());
  let dir = origin;
  for (let i = 0; i < MAX_DEPTH; i++) {
    if (fs.existsSync(path.join(dir, '.git'))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  try {
    const logDir = path.join(origin, '.claude-flow');
    fs.mkdirSync(logDir, { recursive: true });
    fs.appendFileSync(
      path.join(logDir, 'root-guard.log'),
      `[${new Date().toISOString()}] no .git ancestor found walking up from ${origin} (checked ${MAX_DEPTH} levels); falling back to cwd\n`
    );
  } catch {
    // best-effort logging only — never block on it
  }
  return origin;
}

module.exports = { resolveRoot };

if (require.main === module) {
  process.stdout.write(resolveRoot(process.argv[2]));
}
