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

## UI Mocks and Interface Designs: Use Embedded HTML+CSS

When creating **UI mocks**, **interface designs**, **wireframes**, or **UX elements** in markdown files, use **vanilla HTML with inline CSS embedded directly in the markdown**. This creates visual prototypes that render in any markdown viewer that supports HTML (GitHub, VS Code, etc.).

**Note:** JavaScript will NOT execute in most markdown renderers (GitHub, GitLab, VS Code) due to security restrictions. Use CSS-only for styling and states.

### When to Use HTML+CSS Mocks

- Wireframes and layout mockups
- Form designs and input patterns
- Navigation structures
- Component state demonstrations (show multiple states side-by-side)
- Error state visualizations
- List and table layouts

### Structure

Embed HTML directly in markdown:

```html
<div style="border: 1px solid #d1d5db; padding: 16px; border-radius: 8px; font-family: system-ui, sans-serif;">
  <!-- UI mock content here -->
</div>
```

### Guidelines

1. **Self-contained**: All CSS must be inline styles (no `<style>` blocks)
2. **No JavaScript**: JS won't execute; show states statically instead
3. **No external dependencies**: Do not reference CDNs or external files
4. **Semantic HTML**: Use proper elements (`<button>`, `<nav>`, `<form>`, etc.)
5. **Realistic data**: Use plausible placeholder content, not "Lorem ipsum"
6. **Show states visually**: Display hover/active/disabled states side-by-side, not interactively

### Example: Simple Form Mock

```html
<div style="max-width: 400px; padding: 24px; border: 1px solid #e0e0e0; border-radius: 8px; font-family: system-ui, sans-serif;">
  <h3 style="margin: 0 0 16px 0; font-size: 18px;">Create New Mapping</h3>
  <div style="margin-bottom: 12px;">
    <label style="display: block; font-size: 14px; margin-bottom: 4px; font-weight: 500;">Name</label>
    <input type="text" placeholder="e.g., Customer Analytics Q4"
           style="width: 100%; padding: 8px 12px; border: 1px solid #ccc; border-radius: 4px; font-size: 14px; box-sizing: border-box;">
  </div>
  <div style="margin-bottom: 16px;">
    <label style="display: block; font-size: 14px; margin-bottom: 4px; font-weight: 500;">Description</label>
    <textarea placeholder="Optional description..." rows="3"
              style="width: 100%; padding: 8px 12px; border: 1px solid #ccc; border-radius: 4px; font-size: 14px; resize: vertical; box-sizing: border-box;"></textarea>
  </div>
  <button style="background: #2563eb; color: white; padding: 10px 20px; border: none; border-radius: 4px; font-size: 14px; cursor: pointer;">
    Create Mapping
  </button>
</div>
```

### Example: Button States (shown side-by-side)

```html
<div style="font-family: system-ui, sans-serif; padding: 16px;">
  <p style="font-size: 14px; color: #666; margin-bottom: 12px;">Button states:</p>
  <div style="display: flex; gap: 8px; align-items: center;">
    <button style="padding: 8px 16px; background: #f3f4f6; border: 1px solid #d1d5db; border-radius: 4px;">Default</button>
    <button style="padding: 8px 16px; background: #e5e7eb; border: 1px solid #9ca3af; border-radius: 4px;">Hover</button>
    <button disabled style="padding: 8px 16px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 4px; color: #9ca3af;">Disabled</button>
    <button style="padding: 8px 16px; background: #2563eb; color: white; border: none; border-radius: 4px;">Primary</button>
  </div>
</div>
```

### Use Mermaid vs HTML+CSS

| Content Type | Use |
|--------------|-----|
| Data flows, architecture | Mermaid |
| State machines, sequences | Mermaid |
| UI layouts, forms, buttons | HTML+CSS |
| Navigation mockups | HTML+CSS |
| Component specifications | HTML+CSS |
| List views, tables | HTML+CSS |

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
