#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import { applyGuard } from './apply-guard.mjs';

// Registered as a user-level SessionStart hook (~/.claude/settings.json).
// Fires on every Claude Code session start, in every project. Silently
// applies the idempotent .mcp.json patch if the current project hasn't
// been guarded yet; no-ops (no output at all) once it has. Never blocks
// session start — best-effort, always exits 0.

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const logPath = path.join(__dirname, '..', 'session-start.log');

function appendLog(line) {
  try {
    fs.appendFileSync(logPath, `[${new Date().toISOString()}] ${line}\n`);
  } catch {
    // best-effort logging only
  }
}

let input = '';
process.stdin.on('data', (chunk) => {
  input += chunk;
});
process.stdin.on('end', () => {
  let cwd = process.cwd();
  try {
    const parsed = JSON.parse(input);
    if (parsed && typeof parsed.cwd === 'string' && parsed.cwd) cwd = parsed.cwd;
  } catch {
    // no/invalid stdin JSON — fall back to process.cwd()
  }

  try {
    const result = applyGuard(cwd);
    if (result.patched > 0) {
      appendLog(`patched ${result.patched} MCP server entr${result.patched === 1 ? 'y' : 'ies'} in ${cwd}/.mcp.json`);
    }
    // already-guarded / no .mcp.json / not a ruflo project: stay fully silent
  } catch (err) {
    appendLog(`error for ${cwd}: ${err.message}`);
  }

  // Never emit stdout (avoid polluting session context), never block startup.
  process.exit(0);
});

// Guard against hanging forever if nothing is ever piped to stdin (or it
// never closes) — force-exit after 5s regardless. Must NOT be .unref()'d:
// an open stdin listener keeps the event loop alive on its own, so this
// timer is the only thing that can actually force the exit.
process.stdin.on('error', () => process.exit(0));
setTimeout(() => process.exit(0), 5000);
