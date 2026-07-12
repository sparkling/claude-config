import fs from 'node:fs';

const MARKER = '_rufloRootGuard';
const SKILL_ROOT = '$HOME/.claude/skills/ruflo-root-guard';

function hasMarker(hookGroups) {
  return (hookGroups || []).some((group) =>
    (group.hooks || []).some((h) => h && h[MARKER] === true));
}

// Idempotently registers the two global hooks in the given settings.json.
// Pure logic — callers (install.mjs) decide what/whether to print.
export function installGlobalHooks(settingsPath) {
  if (!fs.existsSync(settingsPath)) {
    throw new Error(`settings file not found: ${settingsPath}`);
  }

  const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
  settings.hooks = settings.hooks || {};

  const result = { settingsPath, addedSessionStart: false, addedPreToolUse: false };

  settings.hooks.SessionStart = settings.hooks.SessionStart || [];
  if (!hasMarker(settings.hooks.SessionStart)) {
    settings.hooks.SessionStart.push({
      hooks: [
        {
          type: 'command',
          command: `node "${SKILL_ROOT}/scripts/session-start-hook.mjs"`,
          timeout: 5000,
          [MARKER]: true,
          _note: 'ruflo-root-guard (ruvnet/ruflo#2633 workaround) — anchors new projects\' .mcp.json to project root on first session; remove via /ruflo-root-guard-uninstall when the upstream fix lands',
        },
      ],
    });
    result.addedSessionStart = true;
  }

  settings.hooks.PreToolUse = settings.hooks.PreToolUse || [];
  if (!hasMarker(settings.hooks.PreToolUse)) {
    settings.hooks.PreToolUse.push({
      matcher: 'Bash',
      hooks: [
        {
          type: 'command',
          command: `node "${SKILL_ROOT}/scripts/guard-bash.cjs"`,
          timeout: 5000,
          [MARKER]: true,
          _note: 'ruflo-root-guard (ruvnet/ruflo#2633 workaround) — anchors ad-hoc npx ruflo/@claude-flow Bash calls to project root; remove via /ruflo-root-guard-uninstall when the upstream fix lands',
        },
      ],
    });
    result.addedPreToolUse = true;
  }

  if (result.addedSessionStart || result.addedPreToolUse) {
    fs.writeFileSync(settingsPath, `${JSON.stringify(settings, null, 2)}\n`);
  }

  return result;
}

// Reverses installGlobalHooks: removes exactly the marked hook entries,
// leaving everything else in settings.json untouched.
export function uninstallGlobalHooks(settingsPath) {
  if (!fs.existsSync(settingsPath)) {
    throw new Error(`settings file not found: ${settingsPath}`);
  }

  const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
  const result = { settingsPath, removedGroups: 0 };

  for (const hookType of ['SessionStart', 'PreToolUse']) {
    const groups = settings.hooks && settings.hooks[hookType];
    if (!Array.isArray(groups)) continue;

    settings.hooks[hookType] = groups
      .map((group) => {
        if (!group || !Array.isArray(group.hooks)) return group;
        const keptHooks = group.hooks.filter((h) => !(h && h[MARKER] === true));
        if (keptHooks.length === group.hooks.length) return group;
        result.removedGroups += 1;
        return keptHooks.length > 0 ? { ...group, hooks: keptHooks } : null;
      })
      .filter((group) => group !== null);
  }

  if (result.removedGroups > 0) {
    fs.writeFileSync(settingsPath, `${JSON.stringify(settings, null, 2)}\n`);
  }

  return result;
}
