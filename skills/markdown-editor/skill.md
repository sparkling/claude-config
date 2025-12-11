---
name: markdown-editor
description: Markdown formatting rules and validation. Use when editing or creating .md files to ensure correct blank line placement around blocks, lists, and headings.
allowed-tools: Read, Write, Edit, Grep, Glob
---

# Markdown Editor Skill

Enforce consistent markdown formatting when editing `.md` files.

## CRITICAL: Use Mermaid Diagrams, Not ASCII Art

**NEVER use ASCII art for diagrams in markdown files.** When creating or editing `.md` files:

1. **Replace existing ASCII diagrams** with Mermaid equivalents
2. **Create new diagrams** using Mermaid, never ASCII
3. **Convert on sight** - if you see ASCII art representing a flow, architecture, sequence, or any visual concept, convert it to Mermaid

ASCII art is not accessible, not maintainable, and not professional. Use Mermaid for:
- Flowcharts, process flows, decision trees
- Sequence diagrams, API interactions
- State machines, lifecycles
- Architecture diagrams
- Any visual representation

Invoke the `diagramming` skill for detailed Mermaid syntax and styling guidance.

---

## Blank Line Rules

| Context | Before | After |
|---------|--------|-------|
| Heading (`#`, `##`, etc.) | YES | YES |
| Code block (```) | YES | YES |
| List (first item) | YES | - |
| List (last item) | - | YES |
| Table | YES | YES |
| Blockquote (`>`) | YES | YES |
| Horizontal rule (`---`) | YES | YES |

**Between list items**: NO blank lines (creates separate lists)

## Quick Reference

```markdown
# Correct

Text paragraph here.

## Heading

Intro text.

- item 1
- item 2
- item 3

More text.

```code
example
```

Final text.
```

```markdown
# WRONG - Missing blank lines

Text paragraph here.
## Heading
Intro text.
- item 1

- item 2
More text.
```code
example
```
Final text.
```

## Validation Pattern

To find violations (code blocks without preceding blank line):

```bash
grep -Pzo '\S\n```[a-z]' **/*.md
```

Or use the multiline grep pattern: `\S\n` ` ``` `

## Auto-Fix Checklist

When editing markdown:

1. **Before code blocks**: Ensure blank line after any non-blank line
2. **After code blocks**: Ensure blank line before next content
3. **Before lists**: Ensure blank line after preceding paragraph
4. **Between list items**: Remove any blank lines
5. **After headings**: Ensure blank line before content

## Common Violations

| Pattern | Problem | Fix |
|---------|---------|-----|
| `text\n```lang` | No blank before code | Add blank line |
| `text:\n```lang` | No blank after colon | Add blank line |
| `**Bold:**\n```lang` | No blank after bold label | Add blank line |
| `- item\n\n- item` | Blank between list items | Remove blank line |
| `## Heading\nText` | No blank after heading | Add blank line |
| `text\n## Heading` | No blank before heading | Add blank line |

## Batch Fixing

When fixing multiple files:

1. Use Grep to find all violations: `\S\n```[a-z]`
2. Read each file with violations
3. Apply Edit tool to add missing blank lines
4. Pattern: change `text\n```lang` to `text\n\n```lang`
