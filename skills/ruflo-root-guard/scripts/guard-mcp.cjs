#!/usr/bin/env node
'use strict';
const { spawn } = require('child_process');
const { resolveRoot } = require('./resolve-root.cjs');

// Usage: node guard-mcp.cjs -- <command> [args...]
// Resolves the project root from the current cwd and re-execs <command>
// with cwd pinned to that root, so ruflo's process.cwd()-anchored state
// (.claude-flow/, .swarm/) always lands at the project root regardless of
// where the MCP client happened to launch this process from.
const args = process.argv.slice(2);
const sepIdx = args.indexOf('--');
if (sepIdx === -1) {
  console.error('guard-mcp: usage: node guard-mcp.cjs -- <command> [args...]');
  process.exit(1);
}

const [cmd, ...rest] = args.slice(sepIdx + 1);
if (!cmd) {
  console.error('guard-mcp: no command given after --');
  process.exit(1);
}

const launchedFrom = process.cwd();
const root = resolveRoot(launchedFrom);
if (root !== launchedFrom) {
  process.stderr.write(`[ruflo-root-guard] anchoring "${cmd}" to project root: ${root} (launched from: ${launchedFrom})\n`);
}

const child = spawn(cmd, rest, { cwd: root, stdio: 'inherit', env: process.env });
child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code === null ? 1 : code);
});
child.on('error', (err) => {
  console.error(`[ruflo-root-guard] failed to spawn "${cmd}": ${err.message}`);
  process.exit(1);
});
