---
name: article-illustrations
description: Generate, manage, and export publication-quality illustrations for long-form articles. Covers the full pipeline from document analysis to creative direction, prompt engineering, Gemini image generation, symlink-based versioning, Retina derivative creation, and HTML/PDF export. Use when the user wants to illustrate an article, blog post, or document with AI-generated images.
allowed-tools: Bash, Read, Write, Edit, Glob, Grep
---

# Article Illustrations — Full Pipeline

Generate publication-quality AI illustrations for long-form articles using Gemini (Nano Banana). Covers the complete workflow from document analysis through to packaged HTML/PDF export.

## When to Use This Skill

Use when the user wants to:
- Illustrate a long-form article, blog post, or document with AI images
- Develop a visual strategy/creative direction for a piece of writing
- Generate a batch of thematically coherent images for a publication
- Set up image management infrastructure for an article project
- Export an illustrated document to HTML/PDF

Do NOT use for single ad-hoc image generation — use the `nano-banana` skill instead.

---

## Pipeline Overview

```
1. ANALYSE    → Read the document, map its emotional arc and structure
2. DIRECT     → Design a visual strategy (styles, palette, prompt approach)
3. PROMPT     → Write prompts matched to each section's emotional register
4. GENERATE   → Batch-generate via Gemini API (parallel agents)
5. MANAGE     → Symlink-based versioning, immutable originals
6. DERIVE     → Create Retina web copies for export
7. EXPORT     → HTML/PDF with base64-inlined images
8. ARCHIVE    → Tar the complete project
```

---

## Step 1: Document Analysis

Before writing any prompts, analyse the full document:

1. Read the entire article
2. Map each section's **tone** (sardonic, constructive, urgent, technical, etc.)
3. Identify **emotional beats** — the moments that need visual emphasis
4. Note the **writing voice** — does it shift between sections?
5. Count image positions and map them to sections
6. Save analysis as `document-analysis.md` alongside the article

### Output Format

```markdown
# Document Analysis — "[Title]"

## Structure & Emotional Arc

### [Section Name] (lines X-Y)
**Tone:** [adjective, adjective]
**Emotion:** [what the reader should feel]
**Key narrative moments:**
- [specific sentences/ideas that could anchor an image]

**Content summary:** [what this section covers]
```

---

## Step 2: Creative Direction

### Avoid Cliches
Common pitfalls that produce generic, interchangeable images:
- Abstract particle/network visualizations (cosmic web, neural networks)
- Floating holographic UIs
- Generic cityscapes with data overlays
- Glowing orbs and light trails
- Gears/cogs representing "systems"

### Mixed Register Approach
If the article has distinct emotional sections, **match visual style to emotional register**:

| Emotion | Effective Style |
|---------|----------------|
| Sardonic, cautionary | Mundane surrealism — ordinary scenes with one thing wrong |
| Constructive, elegant | Classical painting — Old Masters lighting, beauty through craft |
| Urgent, provocative | Soviet constructivist poster — geometric, bold, propagandistic |
| Technical, demonstrative | Forensic/clinical — evidence photography, lab aesthetics |
| Celebratory, visionary | Bold graphic poster — high contrast, iconic |

### Unified Palette
Even with mixed styles, maintain visual cohesion with 3-5 shared colours appearing as accents across all styles. Example:
- Deep teal (#1A3A4A) — authority, depth
- Warm amber (#D4A843) — knowledge, value
- Muted crimson (#8B2E3B) — warning, stakes

### Save as Documentation
Save creative direction as `image-prompts-vN.md` with:
- Strategy description and rationale
- Style map (which sections get which style)
- Unified palette specification
- Model and parameter choices
- All prompts with section mapping and emotional core

---

## Step 3: Prompt Engineering

### Model Selection

| Model | ID | Cost | Speed | Best For |
|-------|-----|------|-------|----------|
| **Pro** | `gemini-3-pro-image-preview` | $0.134/img | ~20s | Complex compositions, text accuracy, single-shot |
| **Flash** | `gemini-3.1-flash-image-preview` | $0.067/img | 4-6s | High-volume, varied styles, iterative |

For article illustration batches (20-40 images), **use Flash** — half the cost, faster, and varied styles play to its strengths.

### Prompt Structure

```
[STYLE]: A [art style / photography type] [shot type]
[SUBJECT]: of [specific subject with details]
[ACTION/STATE]: [what is happening or the scene state]
[SETTING]: set in [specific environment]
[LIGHTING]: illuminated by [lighting description]
[CAMERA]: Shot with [lens/camera details], [depth of field]
[COLOR]: [color palette / grading]
[MOOD]: creating a [atmosphere] feeling
```

### Optimal Length
- **30-80 words** — sweet spot for both models
- Lead with style declaration ("A Soviet constructivist poster depicting...")
- Specify colour placement, not just colour names
- Use photography terms for photorealistic (lens, f-stop, lighting setup)
- Use art-historical references for painted styles ("Rembrandt lighting", "Vermeer")

### What Works

**Camera/Lens:** `wide-angle`, `macro`, `85mm f/1.4`, `shallow depth of field`, `tilt-shift`
**Lighting:** `Rembrandt lighting`, `golden hour`, `chiaroscuro`, `harsh overhead fluorescent`
**Composition:** `rule of thirds`, `leading lines`, `bird's-eye view`, `cinematic 16:9`
**Colour:** Specify WHERE colours appear: "teal carpet", "amber lamplight", not "teal and amber palette"

### What Fails
- Keyword-style negatives (`negative: blurry`) — not Stable Diffusion
- Heavy negation — model generates what you said not to
- Vague prompts — "a cool image" vs specific subject + style
- Conflicting styles — "pixel art AND photorealistic"
- Spatial instructions — left/right positioning is unreliable
- Exact counts — "three birds" may give two or four

### Affirmative Framing
- Want no people → describe an empty scene
- Want no text → don't mention text at all
- Want clean background → "solid white background"

---

## Step 4: Generation

### Generation Script Template

```bash
#!/bin/bash
# Generate images for article
# Usage: ./generate.sh <start> <end>

SCRIPT="$HOME/.claude/plugins/marketplaces/emdashcodes-claude-code-plugins/plugins/nano-banana-image-editor/skills/nano-banana-image-editor/scripts/create_image.py"
OUTDIR="./images/vN-style-name"
RES="4K"
AR="16:9"

# Select model
export GEMINI_MODEL="gemini-3.1-flash-image-preview"

generate() {
    local name="$1"
    local prompt="$2"
    echo "=== Generating: $name ==="
    python3 "$SCRIPT" "$OUTDIR/$name" "$prompt" --resolution "$RES" --aspect-ratio "$AR"
    echo "=== Done: $name ==="
}

mkdir -p "$OUTDIR"

START=${1:-1}
END=${2:-$1}

for i in $(seq $START $END); do
    case "$i" in
        1) generate "image-name.jpg" "prompt text here" ;;
        # ... more cases ...
        *) echo "Unknown image number: $i" ;;
    esac
done
```

### Parallel Generation
For speed, run 4 agents in parallel, each handling a subset:
```
Agent 1: ./generate.sh 1 8
Agent 2: ./generate.sh 9 16
Agent 3: ./generate.sh 17 24
Agent 4: ./generate.sh 25 32
```

### Rate Limits
- Flash: ~20 RPM, space calls accordingly
- Pro: stricter limits, 70% of failures are 429 RESOURCE_EXHAUSTED
- If you hit 503s, the API is overloaded — wait or switch models

---

## Step 5: Image & Document Versioning (Symlink-Based)

### Directory Structure

```
article-folder/
├── article.md                          ← WORKING COPY (references images/active/)
├── document-analysis.md
├── image-prompts-v3.md                 ← prompt sets (never overwritten)
├── image-prompts-v4.md
├── image-sizing.md
│
├── images/
│   ├── active -> v4-style-name         ← SYMLINK to current image set
│   ├── v3-old-style/                   ← previous images (immutable)
│   ├── v4-style-name/                  ← current images (immutable)
│   └── web/                            ← 2880px Retina derivatives (disposable)
│
├── versions/
│   ├── latest -> v4-style-name         ← SYMLINK to current version
│   ├── v3-old-style/                   ← frozen snapshot
│   │   ├── article.md                  ← markdown at time of v3
│   │   ├── image-prompts-v3.md         ← prompts used
│   │   ├── document-analysis.md
│   │   ├── meta.json                   ← version metadata
│   │   └── export/
│   │       ├── html/                   ← self-contained HTML (images baked in)
│   │       └── pdf/
│   └── v4-style-name/
│       ├── article.md
│       ├── image-prompts-v4.md
│       ├── meta.json
│       └── export/
│           ├── html/
│           └── pdf/
│
├── diagrams/
└── scripts/
    ├── generate-vN-images.sh
    ├── resize-for-web.sh
    ├── export.sh                       ← exports into versions/<active>/export/
    └── snapshot-version.sh             ← freezes current state as a version
```

### What Gets Versioned

Each version snapshot bundles:

| Artefact | Description |
|----------|-------------|
| `article.md` | Frozen copy of the markdown at snapshot time |
| `image-prompts-vN.md` | Prompts used for this image generation |
| `document-analysis.md` | Document analysis at snapshot time |
| `meta.json` | Metadata (date, model, style, image count) |
| `export/html/` | Self-contained HTML (images base64-inlined) |
| `export/pdf/` | PDF rendering |

Images live in `images/vN-name/` (not duplicated — they're large).

### Rules — CRITICAL

1. **NEVER** write into `images/vN-name/` after generation — immutable
2. **NEVER** write into `versions/vN-name/` after snapshot — immutable
3. **NEVER** resize/compress originals in-place — write derivatives to `web/` only
4. **ALWAYS** reference `images/active/` in markdown — never version dirs or `web/`
5. **ALWAYS** snapshot before switching to a new image set
6. Derivatives (`images/web/`) are disposable — regenerate from `active/`
7. Prompt docs are versioned (`image-prompts-v3.md`, etc.) — never overwrite
8. Version exports are self-contained — open HTML directly to compare versions

### Snapshot Current State
```bash
./scripts/snapshot-version.sh           # uses active symlink name
./scripts/snapshot-version.sh v5-name   # explicit name
```

### Compare Versions Side by Side
```bash
open versions/v3-old-style/export/html/article.html
open versions/v4-style-name/export/html/article.html
```

### Switching Active Version
```bash
cd images/
rm active
ln -s v5-new-style active
../scripts/resize-for-web.sh    # regenerate web/ from new active
```

### Full New Generation Workflow
```bash
# 1. Generate images
mkdir images/v5-new-style/
./scripts/generate-v5-images.sh

# 2. Switch active
cd images/ && rm active && ln -s v5-new-style active

# 3. Snapshot (creates derivatives + export + frozen markdown)
./scripts/snapshot-version.sh v5-new-style
```

---

## Step 6: Retina Derivatives

### Why 2880px
Optimized for MacBook Retina (2x DPI):

| Display | Logical | 2x Physical | 2880px |
|---------|---------|-------------|--------|
| MacBook Air 13" | 1440px | 2880px | 100% |
| MacBook Pro 14" | 1512px | 3024px | ~95% |
| MacBook Pro 16" | 1728px | 3456px | ~83% |

### Why JPEG q95
- No transcoding — originals are JPEG, avoids double-lossy recompression
- Single codec path: decode → resize → re-encode
- q95 is near-lossless
- WebP q95 only saves ~13% but adds JPEG→WebP transcoding artifacts

### Resize Script

```bash
#!/bin/bash
# resize-for-web.sh
# Reads: images/active/ (follows symlink, NEVER modified)
# Writes: images/web/*.jpg (2880px, JPEG q95)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
SRC_DIR="$PROJECT_DIR/images/active"
DST_DIR="$PROJECT_DIR/images/web"

[ -L "$SRC_DIR" ] || { echo "Error: images/active is not a symlink"; exit 1; }
echo "Active version: $(readlink "$SRC_DIR")"

mkdir -p "$DST_DIR"

python3 -c "
from PIL import Image
from pathlib import Path
import os

src, dst = Path('$SRC_DIR'), Path('$DST_DIR')
for f in sorted(src.glob('*.jpg')):
    out = dst / f.name
    if out.exists() and out.stat().st_mtime >= f.stat().st_mtime:
        continue
    img = Image.open(f)
    w, h = img.size
    nw = 2880
    nh = int(h * nw / w)
    img.resize((nw, nh), Image.LANCZOS).save(str(out), 'JPEG', quality=95)
    print(f'  {f.name}: {w}x{h} -> {nw}x{nh} ({os.path.getsize(out)/1024:.0f}KB)')
"
```

---

## Step 7: Export (Versioned)

Export writes into `versions/<active-version>/export/`:

```bash
./scripts/export.sh              # HTML into versions/<active>/export/
./scripts/export.sh both         # HTML + PDF
```

Or use the snapshot script which combines export + markdown freeze:

```bash
./scripts/snapshot-version.sh    # complete version snapshot
```

### Export Tool Gotcha

The markdown-export tool (`~/.claude/tools/markdown-export/convert.js`) has two critical behaviours:
1. **Resolves image paths relative to the input file** — so temp files MUST be in the project directory (NOT `/tmp/`), otherwise `images/web/foo.jpg` won't be found
2. **Always writes to `export/` next to the input file** — it does NOT support `--output-dir`. You must move files after generation:
```bash
TEMP_DOC="$PROJECT_DIR/.export-temp.md"
node ~/.claude/tools/markdown-export/convert.js "$TEMP_DOC" --format html
rm -f "$TEMP_DOC"
# Move from default location to versioned directory
mv "$PROJECT_DIR/export/html/.export-temp.html" "$VERSION_DIR/export/html/article.html"
rm -rf "$PROJECT_DIR/export"
```

---

## Step 8: Archive

```bash
cd article-folder/
tar -czf ../article-name-$(date +%Y%m%d).tar.gz \
    --exclude='images/web' \
    .
```

Exclude `images/web/` (disposable derivatives). Include everything else: originals, versions, prompts, scripts, and markdown.

For a lightweight archive (no 4K originals, just versions with baked exports):
```bash
tar -czf ../article-name-versions-$(date +%Y%m%d).tar.gz versions/
```

---

## Quick Reference: File Naming

| File | Purpose |
|------|---------|
| `document-analysis.md` | Emotional arc, section mapping, writing voice |
| `image-prompts-vN.md` | Versioned prompt sets with strategy description |
| `image-sizing.md` | Image management scheme and sizing rationale |
| `gemini-prompting-guide.md` | Prompting reference for Gemini models |
| `scripts/generate-vN-images.sh` | Generation script with all prompts |
| `scripts/resize-for-web.sh` | Derivative generation |
| `scripts/export.sh` | HTML/PDF export into `versions/<active>/export/` |
| `scripts/snapshot-version.sh` | Freeze markdown + prompts + export as a version |

---

## Known Quirks

1. **Generative drift (Pro):** Same prompt gives different results on re-runs
2. **Spatial swaps:** Both models occasionally mirror left/right
3. **Hands and faces:** Anatomical accuracy remains unreliable
4. **Safety filters:** Can block benign prompts — reframe in professional language
5. **Rate limits:** Server-side limits fluctuate with demand
6. **Exact counts:** "Three birds" might give two or four
7. **Day-to-night:** Major lighting changes produce artifacts

---

## Cost Estimates

| Scale | Model | Resolution | Images | Approx Cost |
|-------|-------|------------|--------|-------------|
| Blog post | Flash | 1K | 5-8 | $0.34-0.54 |
| Long article | Flash | 4K | 20-32 | $1.34-2.14 |
| Long article | Pro | 4K | 20-32 | $2.68-4.29 |
| Premium piece | Pro | 4K | 32 | $4.29 |

With Ultra/Pro subscription, Flash has 5,000 free prompts/month.
