#!/usr/bin/env node
// ruflo-source-patch — patch the cwd-anchoring defect (ruvnet/ruflo#2633) at
// its SOURCE, inside the installed @claude-flow/cli + @claude-flow/cli-core
// npm packages, rather than intercepting callers. Fixes the callee, so every
// caller (Bash tool, MCP server, ruflo's own plugin hooks) is covered at once.
//
// Idempotent, marker-based, reversible (per-file .rrg-backup). Safe-fail: if an
// expected anchor string isn't found (version drift), that edit is skipped and
// logged — never a partial/corrupt write.
//
// Usage:
//   node patch-library.mjs           # patch every discovered copy
//   node patch-library.mjs --revert  # restore every .rrg-backup
//   node patch-library.mjs --quiet   # only emit a line when something changes
//
// Exit 0 always (best-effort; must never break a session-start hook).

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const MARKER = '/* ruflo-source-patch:patched */';
const REVERT = process.argv.includes('--revert');
const QUIET = process.argv.includes('--quiet');

const changes = [];
function note(msg) { changes.push(msg); }
function flush() {
  if (QUIET && changes.length === 0) return;
  for (const c of changes) console.log(`[ruflo-source-patch] ${c}`);
}

// The self-contained resolver injected into each patched file. Walks up from a
// starting dir to the nearest ancestor containing `.git` (file OR dir — the
// file form is a git worktree, still a valid boundary), capped at 40 levels,
// falling back to the original dir. Named uniquely to avoid collisions.
const RESOLVER_SRC = `${MARKER}
function __rufloResolveRoot(startDir) {
  try {
    const fs = require('fs'); const path = require('path');
    let dir = path.resolve(startDir || process.cwd());
    for (let i = 0; i < 40; i++) {
      if (fs.existsSync(path.join(dir, '.git'))) return dir;
      const parent = path.dirname(dir);
      if (parent === dir) break;
      dir = parent;
    }
  } catch { /* fall through */ }
  return startDir || process.cwd();
}
`;

// ESM-safe variant: the target files are ESM (import/export). `require` isn't
// defined in ESM scope, so inject a createRequire shim for the resolver.
const RESOLVER_SRC_ESM = `${MARKER}
import { createRequire as __rufloCreateRequire } from 'module';
const __rufloReq = __rufloCreateRequire(import.meta.url);
function __rufloResolveRoot(startDir) {
  try {
    const fs = __rufloReq('fs'); const path = __rufloReq('path');
    let dir = path.resolve(startDir || process.cwd());
    for (let i = 0; i < 40; i++) {
      if (fs.existsSync(path.join(dir, '.git'))) return dir;
      const parent = path.dirname(dir);
      if (parent === dir) break;
      dir = parent;
    }
  } catch { /* fall through */ }
  return startDir || process.cwd();
}
`;

// A patch target: a glob-style suffix under ~/.npm/_npx, whether the file is
// ESM, and the list of exact string replacements to apply.
const TARGETS = [
  {
    label: 'daemon-autostart',
    suffix: ['@claude-flow', 'cli', 'dist', 'src', 'services', 'daemon-autostart.js'],
    esm: true,
    edits: [
      {
        find: "        if (autostartDisabled())\n            return { started: false, reason: 'disabled (RUFLO_DAEMON_AUTOSTART=0)' };",
        replace: "        if (autostartDisabled())\n            return { started: false, reason: 'disabled (RUFLO_DAEMON_AUTOSTART=0)' };\n        projectRoot = __rufloResolveRoot(projectRoot);",
      },
    ],
  },
  {
    label: 'memory-initializer',
    suffix: ['@claude-flow', 'cli', 'dist', 'src', 'memory', 'memory-initializer.js'],
    esm: true,
    edits: [
      {
        find: "        path.resolve(process.cwd(), 'claude-flow.config.json'),",
        replace: "        path.resolve(__rufloResolveRoot(process.cwd()), 'claude-flow.config.json'),",
      },
      {
        find: "        path.resolve(process.cwd(), '.claude-flow', 'config.json'),",
        replace: "        path.resolve(__rufloResolveRoot(process.cwd()), '.claude-flow', 'config.json'),",
      },
      {
        find: "    _memoryRootCache = path.resolve(process.cwd(), '.swarm');",
        replace: "    _memoryRootCache = path.resolve(__rufloResolveRoot(process.cwd()), '.swarm');",
      },
    ],
  },
  {
    label: 'cli-core getProjectCwd',
    suffix: ['@claude-flow', 'cli-core', 'dist', 'src', 'mcp-tools', 'types.js'],
    esm: true,
    edits: [
      {
        find: "    return process.cwd();",
        replace: "    return __rufloResolveRoot(process.cwd());",
      },
    ],
  },
];

// Default to the real npx cache; RUFLO_NPX_ROOT overrides it (used only by the
// test harness to run against throwaway fixtures, never in production).
const NPX_ROOT = process.env.RUFLO_NPX_ROOT || path.join(os.homedir(), '.npm', '_npx');

// Discover every real file matching a target suffix under ~/.npm/_npx/<hash>/node_modules/...
function discover(suffix) {
  const found = [];
  let hashes;
  try { hashes = fs.readdirSync(NPX_ROOT); } catch { return found; }
  for (const h of hashes) {
    const full = path.join(NPX_ROOT, h, 'node_modules', ...suffix);
    if (fs.existsSync(full)) found.push(full);
  }
  return found;
}

function patchFile(file, target) {
  const backup = `${file}.rrg-backup`;
  let src = fs.readFileSync(file, 'utf8');

  if (src.includes(MARKER)) return 'already-patched';

  // Confirm every edit's anchor is present before touching anything.
  for (const e of target.edits) {
    if (!src.includes(e.find)) return `skip: anchor-not-found (${target.label})`;
  }

  // Back up the pristine file once.
  if (!fs.existsSync(backup)) fs.copyFileSync(file, backup);

  // Inject resolver after the copyright/first line (files start with a comment
  // or import; prepend is safe for ESM since import hoisting is unaffected by a
  // preceding function/const, and our injected import sits at top).
  const resolver = target.esm ? RESOLVER_SRC_ESM : RESOLVER_SRC;
  src = resolver + '\n' + src;

  for (const e of target.edits) {
    src = src.replace(e.find, e.replace);
  }

  fs.writeFileSync(file, src);
  return 'patched';
}

function revertFile(file) {
  const backup = `${file}.rrg-backup`;
  if (!fs.existsSync(backup)) return 'no-backup';
  fs.copyFileSync(backup, file);
  fs.unlinkSync(backup);
  return 'reverted';
}

let patched = 0, reverted = 0, skipped = 0;

for (const target of TARGETS) {
  for (const file of discover(target.suffix)) {
    try {
      if (REVERT) {
        const r = revertFile(file);
        if (r === 'reverted') { reverted++; note(`reverted ${target.label}: ${file}`); }
      } else {
        const r = patchFile(file, target);
        if (r === 'patched') { patched++; note(`patched ${target.label}: ${file}`); }
        else if (r.startsWith('skip')) { skipped++; note(`${r}: ${file}`); }
      }
    } catch (err) {
      note(`error on ${file}: ${err.message}`);
    }
  }
}

if (!QUIET) {
  if (REVERT) note(`done — ${reverted} reverted`);
  else note(`done — ${patched} patched, ${skipped} skipped`);
}
flush();
process.exit(0);
