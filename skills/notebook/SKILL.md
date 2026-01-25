---
name: notebook
description: Create professional Jupyter notebooks with zero-execution styling using markdown-based CSS and HTML components following Airbnb DLS principles.
allowed-tools: Read, Write, Edit, Glob, Grep
---

# Jupyter Notebook Design System

Create professional, beautifully styled Jupyter notebooks that render immediately without code execution.

**Architecture:** CSS is loaded globally via JupyterHub - no inline `<style>` cells needed in notebooks.

---

## Design Principles (Airbnb DLS)

Based on [Airbnb's Design Language System](https://karrisaarinen.com/dls/) four core principles:

1. **Unified** - Token-first design with CSS custom properties, BEM naming (`nb-block__element--modifier`)
2. **Universal** - WCAG AA accessibility, screen reader support, reduced motion respect
3. **Iconic** - Clear hierarchy with type badges, numbered sections, difficulty indicators
4. **Conversational** - Subtle hover effects and transitions bring life to components

**CSS Source:** `tests/e2e/notebooks/assets/styles/notebook.css` (single source of truth)

---

## Quick Start

Every notebook needs:

1. **Header cell** - `nb-header` with type, title, subtitle, meta, tags
2. **Objectives cell** - `nb-objectives` with learning goals
3. **Section cells** - `nb-section` with numbered headers
4. **Code cells** - Actual Python code
5. **Takeaways cell** - `nb-takeaways` summarizing key points

**NO style cell needed** - CSS is injected globally via JupyterHub.

---

## Notebook Structure

```
Cell 1  [Markdown] <div class="nb-header">...</div>
Cell 2  [Markdown] <div class="nb-objectives">...</div>
Cell 3  [Markdown] <div class="nb-callout nb-callout--info">Prerequisites</div>
Cell 4  [Markdown] <div class="nb-section">Section 1</div>
Cell 5  [Code]     Python code for section 1
Cell 6  [Markdown] <div class="nb-section">Section 2</div>
Cell 7  [Code]     Python code for section 2
...
Cell N-1 [Markdown] <div class="nb-takeaways">...</div>
Cell N   [Markdown] Next steps links
```

---

## Component Templates

### Header (with Type Badge and Difficulty)

```html
<div class="nb-header">
  <span class="nb-header__type">E2E Test</span>
  <h1 class="nb-header__title">Health Checks</h1>
  <p class="nb-header__subtitle">Verify platform infrastructure and service connectivity</p>
  <div class="nb-header__meta">
    <span class="nb-header__meta-item nb-header__meta-item--duration">5 min</span>
    <span class="nb-header__meta-item nb-header__meta-item--level">
      <span class="nb-difficulty nb-difficulty--beginner">
        <span class="nb-difficulty__dot"></span>
        <span class="nb-difficulty__dot"></span>
        <span class="nb-difficulty__dot"></span>
      </span>
      Beginner
    </span>
  </div>
  <div class="nb-header__tags">
    <span class="nb-header__tag">Health</span>
    <span class="nb-header__tag">Kubernetes</span>
  </div>
</div>
```

**Type Badge Values:**
- `E2E Test` - For test notebooks (01-19)
- `Tutorial` - For educational tutorials
- `Reference` - For API reference docs
- `Algorithm` - For algorithm notebooks

**Difficulty Levels:**
- `nb-difficulty--beginner` - 1 dot lit
- `nb-difficulty--intermediate` - 2 dots lit
- `nb-difficulty--advanced` - 3 dots lit

---

### Section (Numbered)

```html
<div class="nb-section">
  <span class="nb-section__number">1</span>
  <div>
    <h2 class="nb-section__title">Client Initialization</h2>
    <p class="nb-section__description">Create test context with automatic cleanup</p>
  </div>
</div>
```

**Important:** Section numbers should be sequential (1, 2, 3...) within a notebook.

---

### Objectives

```html
<div class="nb-objectives">
  <h3 class="nb-objectives__title">What You'll Learn</h3>
  <ul class="nb-objectives__list">
    <li><strong>First concept</strong> - Brief explanation</li>
    <li><strong>Second concept</strong> - Brief explanation</li>
    <li><strong>Third concept</strong> - Brief explanation</li>
  </ul>
</div>
```

**Note:** Title icon is provided by CSS (target icon via mask) - no emoji needed.

---

### Callout (4 Variants)

Icons are provided automatically by CSS mask technique - **NO emoji needed**.

**Info (blue):**
```html
<div class="nb-callout nb-callout--info">
  <span class="nb-sr-only">Info:</span>
  <span class="nb-callout__icon" aria-hidden="true"></span>
  <div class="nb-callout__content">
    <div class="nb-callout__title">Note</div>
    <div class="nb-callout__body">Additional information the reader should know.</div>
  </div>
</div>
```

**Success (green):**
```html
<div class="nb-callout nb-callout--success">
  <span class="nb-sr-only">Success:</span>
  <span class="nb-callout__icon" aria-hidden="true"></span>
  <div class="nb-callout__content">
    <div class="nb-callout__title">Success</div>
    <div class="nb-callout__body">This operation completed successfully.</div>
  </div>
</div>
```

**Warning (amber):**
```html
<div class="nb-callout nb-callout--warning">
  <span class="nb-sr-only">Warning:</span>
  <span class="nb-callout__icon" aria-hidden="true"></span>
  <div class="nb-callout__content">
    <div class="nb-callout__title">Warning</div>
    <div class="nb-callout__body">Be careful about this potential issue.</div>
  </div>
</div>
```

**Tip (teal):**
```html
<div class="nb-callout nb-callout--tip">
  <span class="nb-sr-only">Tip:</span>
  <span class="nb-callout__icon" aria-hidden="true"></span>
  <div class="nb-callout__content">
    <div class="nb-callout__title">Tip</div>
    <div class="nb-callout__body">A helpful suggestion to improve your workflow.</div>
  </div>
</div>
```

**Accessibility:** The `<span class="nb-sr-only">` announces the callout type to screen readers.

---

### Takeaways

```html
<div class="nb-takeaways">
  <h3 class="nb-takeaways__title">Key Takeaways</h3>
  <ul class="nb-takeaways__list">
    <li>First key point learned</li>
    <li>Second key point learned</li>
    <li>Third key point learned</li>
  </ul>
</div>
```

**Note:** Checkmark icons are provided by CSS - no emoji needed.

---

### Figure with Caption

```html
<figure class="nb-figure">
  <img class="nb-figure__img" src="assets/diagrams/example.png" alt="Description for accessibility">
  <figcaption class="nb-figure__caption">Figure 1: Caption explaining the diagram</figcaption>
</figure>
```

**Styling:** Images are left-aligned with max-height: 500px. Width auto-scales.

---

### Collapsible Details

```html
<details class="nb-details">
  <summary>Click to expand</summary>
  <div class="nb-details__content">
    Hidden content that appears when expanded.
  </div>
</details>
```

---

### API Reference Card

```html
<div class="nb-api-ref">
  <div class="nb-api-ref__header">
    <code class="nb-api-ref__signature">function_name(param1: str, param2: int = 10) -> Result</code>
  </div>
  <div class="nb-api-ref__body">
    <p class="nb-api-ref__description">Description of what this function does.</p>
  </div>
</div>
```

---

### Progress Indicator (for Tutorials)

```html
<div class="nb-progress">
  <div class="nb-progress__bar">
    <div class="nb-progress__fill" style="width: 40%"></div>
  </div>
  <span class="nb-progress__label">2 of 5</span>
</div>
```

---

### Card (for Linking Between Notebooks)

```html
<a href="../tutorials/A1_getting_started.ipynb" class="nb-card">
  <h4 class="nb-card__title">Getting Started</h4>
  <p class="nb-card__description">Learn the basics of the SDK</p>
  <div class="nb-card__meta">
    <span>15 min</span>
    <span>Beginner</span>
  </div>
</a>
```

**Card Grid:**
```html
<div class="nb-card-grid">
  <a class="nb-card">...</a>
  <a class="nb-card">...</a>
  <a class="nb-card">...</a>
</div>
```

---

### Link List (Navigation)

```html
<ul class="nb-link-list">
  <li class="nb-link-list__item">
    <a href="02_health_checks.ipynb" class="nb-link-list__link">Health Checks</a>
  </li>
  <li class="nb-link-list__item">
    <a href="03_managing_resources.ipynb" class="nb-link-list__link">Managing Resources</a>
  </li>
</ul>
```

---

## Design Tokens

All styling uses CSS custom properties (tokens) for consistency:

| Category | Tokens |
|----------|--------|
| **Typography** | `--nb-font-sans`, `--nb-font-mono`, `--nb-text-xs` to `--nb-text-3xl` |
| **Colors** | `--nb-surface-*`, `--nb-text-*`, `--nb-border-*` |
| **Semantic** | `--nb-info-*`, `--nb-success-*`, `--nb-warning-*`, `--nb-tip-*` |
| **Spacing** | `--nb-space-1` to `--nb-space-8` (4px base unit) |
| **Radius** | `--nb-radius-sm`, `--nb-radius-md`, `--nb-radius-lg`, `--nb-radius-full` |
| **Shadows** | `--nb-shadow-sm`, `--nb-shadow-md` |
| **Motion** | `--nb-duration-fast`, `--nb-duration-normal`, `--nb-easing-default` |

---

## Icon System (Lucide via CSS Mask)

Icons are embedded as SVG data URIs and applied via CSS `mask-image`. This allows:
- Icons colored by `currentColor` (inherits text color)
- No external dependencies
- Consistent rendering across platforms (unlike emoji)

**Available icons:**
- `--icon-info` - Circle with "i"
- `--icon-check-circle` - Checkmark in circle
- `--icon-alert-triangle` - Warning triangle
- `--icon-lightbulb` - Tip lightbulb
- `--icon-target` - Objectives target
- `--icon-check` - Simple checkmark
- `--icon-rocket` - Next steps
- `--icon-book-open` - Learn more
- `--icon-clock` - Duration
- `--icon-bar-chart` - Level
- `--icon-chevron-right` - Navigation arrow

---

## Accessibility Checklist

- [x] **Color contrast**: WCAG AA 4.5:1 ratio (built into tokens)
- [x] **Touch targets**: Interactive elements 44x44px minimum
- [x] **Focus states**: Enhanced focus ring with box-shadow
- [x] **Reduced motion**: All animations respect `prefers-reduced-motion`
- [x] **Screen reader text**: `.nb-sr-only` class for callout types
- [x] **Semantic HTML**: Proper heading hierarchy
- [x] **Alt text**: All images require descriptive alt attributes

---

## Notebook Type Patterns

### E2E Test Notebook

```
[Header]     type="E2E Test", focus on what's being tested
[Objectives] Test coverage goals
[Callout]    "Requires running infrastructure" (warning)
[Section 1]  Setup + code
[Section 2]  Test cases + assertions
[Takeaways]  Test coverage summary
```

### Tutorial Notebook

```
[Header]     type="Tutorial", difficulty indicator
[Objectives] Learning goals
[Progress]   "1 of 5 in this track"
[Section 1]  Concept introduction
[Section 2]  Hands-on example + code
[Section 3]  Practice exercise
[Takeaways]  Key learnings
[Card Grid]  Related tutorials
```

### API Reference Notebook

```
[Header]     type="Reference"
[Objectives] APIs covered
[Section 1]  Module overview
[API Ref]    Function signatures
[Section 2]  Examples + code
[Takeaways]  Quick reference summary
```

---

## Do's and Don'ts

**DO:**
- Use semantic HTML (proper headings, lists, figures)
- Include `nb-sr-only` spans in callouts for accessibility
- Keep section numbers sequential
- Use type badges to categorize notebooks
- Use difficulty indicators for tutorials

**DON'T:**
- Add inline `<style>` cells (CSS is global)
- Use emoji for icons (use CSS mask icons instead)
- Use Python `display(HTML(...))` for styling
- Create custom one-off styles (extend the design system)
- Hardcode colors (use tokens)

---

## CSS Location

Single source of truth: `tests/e2e/notebooks/assets/styles/notebook.css`

CSS is injected via JupyterHub's `custom.js` - see `tools/jupyterhub/custom.js`.

To modify the design system, edit the CSS file and refresh the browser.
