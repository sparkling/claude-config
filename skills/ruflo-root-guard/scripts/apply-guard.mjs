import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const skillRoot = path.resolve(__dirname, '..'); // .../ruflo-root-guard

// Idempotently anchors a target repo's ruflo/@claude-flow MCP server
// entries to the project root. Pure logic, no console output — callers
// (install.mjs for interactive use, session-start-hook.mjs for the silent
// auto-install path) decide what/whether to report.
export function applyGuard(targetRepo) {
  const result = {
    targetRepo,
    helpersCopied: false,
    mcpJsonFound: false,
    patched: 0,
    alreadyDone: 0,
  };

  if (!fs.existsSync(targetRepo)) {
    throw new Error(`target repo does not exist: ${targetRepo}`);
  }

  const helpersDir = path.join(targetRepo, '.claude', 'helpers');
  fs.mkdirSync(helpersDir, { recursive: true });
  for (const f of ['resolve-root.cjs', 'guard-mcp.cjs']) {
    const src = path.join(skillRoot, 'scripts', f);
    const dest = path.join(helpersDir, f);
    const srcContent = fs.readFileSync(src, 'utf8');
    const destContent = fs.existsSync(dest) ? fs.readFileSync(dest, 'utf8') : null;
    if (destContent !== srcContent) {
      fs.copyFileSync(src, dest);
      result.helpersCopied = true;
    }
  }

  const mcpPath = path.join(targetRepo, '.mcp.json');
  if (!fs.existsSync(mcpPath)) return result;
  result.mcpJsonFound = true;

  const mcp = JSON.parse(fs.readFileSync(mcpPath, 'utf8'));
  const servers = mcp.mcpServers || {};

  for (const [name, def] of Object.entries(servers)) {
    if (!def || typeof def !== 'object') continue;
    const isRuflo = /ruflo|claude-flow/i.test(name)
      || (Array.isArray(def.args) && def.args.some((a) => /ruflo|claude-flow/i.test(String(a))));
    if (!isRuflo) continue;

    if (def._rootGuard) {
      result.alreadyDone++;
      continue;
    }

    def._rootGuardOriginal = { command: def.command, args: def.args || [] };
    def.args = ['.claude/helpers/guard-mcp.cjs', '--', def.command, ...(def.args || [])];
    def.command = 'node';
    def._rootGuard = true;
    result.patched++;
  }

  if (result.patched > 0) {
    fs.writeFileSync(mcpPath, `${JSON.stringify(mcp, null, 2)}\n`);
  }

  return result;
}

// Reverses applyGuard for a single repo: restores each _rootGuard-marked
// server entry's command/args from its saved _rootGuardOriginal, and
// removes both marker keys. Does not remove the copied helper scripts
// (harmless to leave; nothing references them once .mcp.json is reverted).
export function revertGuard(targetRepo) {
  const result = { targetRepo, mcpJsonFound: false, reverted: 0 };

  if (!fs.existsSync(targetRepo)) {
    throw new Error(`target repo does not exist: ${targetRepo}`);
  }

  const mcpPath = path.join(targetRepo, '.mcp.json');
  if (!fs.existsSync(mcpPath)) return result;
  result.mcpJsonFound = true;

  const mcp = JSON.parse(fs.readFileSync(mcpPath, 'utf8'));
  const servers = mcp.mcpServers || {};

  for (const def of Object.values(servers)) {
    if (!def || typeof def !== 'object' || !def._rootGuard) continue;
    if (def._rootGuardOriginal) {
      def.command = def._rootGuardOriginal.command;
      def.args = def._rootGuardOriginal.args;
    }
    delete def._rootGuardOriginal;
    delete def._rootGuard;
    result.reverted++;
  }

  if (result.reverted > 0) {
    fs.writeFileSync(mcpPath, `${JSON.stringify(mcp, null, 2)}\n`);
  }

  return result;
}
