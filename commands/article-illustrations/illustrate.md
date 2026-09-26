---
allowed-tools: [Read, Write, Edit, Bash, Glob, Grep]
description: "Generate AI illustrations for an article: analyse → design → prompt → generate → manage → export"
---

# /article-illustrations:illustrate — Illustrate an Article

## Purpose

Full pipeline for generating publication-quality AI illustrations for a long-form article. Takes a markdown document and produces a complete illustrated export.

## Usage

```
/article-illustrations:illustrate <markdown-file> [--step=analyse|direct|prompt|generate|resize|export|snapshot|archive|all] [--version=vN] [--model=flash|pro] [--count=N]
```

## Arguments

- `<markdown-file>` — Path to the markdown article to illustrate
- `--step` — Which pipeline step to run (default: `all`)
- `--version` — Version label for this generation round (default: auto-increment)
- `--model` — Gemini model: `flash` or `pro` (default: `flash`)
- `--count` — Number of parallel generation agents (default: 4)

## Pipeline Steps

### `analyse` — Document Analysis
1. Read the entire document
2. Map sections, emotional arc, tone shifts, key narrative moments
3. Count and map image positions
4. Save as `document-analysis.md` alongside the article

### `direct` — Creative Direction
1. Design visual strategy based on document analysis
2. Choose style(s) matched to emotional registers
3. Define unified colour palette
4. Select model and parameters
5. Save as `image-prompts-vN.md` with strategy description

### `prompt` — Write Prompts
1. Write 30-80 word prompts per image position
2. Lead with style declaration
3. Specify colour placement (not just names)
4. Use photography terms (photorealistic) or art-historical refs (painted)
5. Frame exclusions positively ("empty room" not "no people")
6. Save prompts in `image-prompts-vN.md` and `scripts/generate-vN-images.sh`

### `generate` — Batch Generate
1. Create version directory: `images/vN-style-name/`
2. Run generation script with parallel agents
3. Set `active` symlink to new version
4. Model: `GEMINI_MODEL=gemini-3.1-flash-image-preview` (Flash) or `gemini-3-pro-image-preview` (Pro)

### `resize` — Create Retina Derivatives
1. Read from `images/active/` (symlink)
2. Write to `images/web/` at 2880px, JPEG q95
3. Never modify originals

### `export` — HTML/PDF Export
1. Rewrite `images/active/` → `images/web/` in temp copy
2. Run markdown-export tool with base64 inlining
3. Output to `versions/<active>/export/`

### `snapshot` — Freeze Current State
1. Copy working markdown + prompts + analysis into `versions/<name>/`
2. Run export into the version's export directory
3. Create/update `meta.json` with version metadata
4. Update `versions/latest` symlink

### `archive` — Tar Archive
1. Create compressed tar of entire project, excluding `images/web/` (disposable)
2. Optionally create lightweight versions-only archive (no 4K originals)

### `all` — Full Pipeline
Runs all steps in sequence, ending with a snapshot and archive.

## Directory Structure Created

```
article-folder/
├── article.md                          ← WORKING COPY (references images/active/)
├── document-analysis.md
├── image-prompts-vN.md
├── image-sizing.md
├── images/
│   ├── active -> vN-style-name         ← symlink to current image set
│   ├── vN-style-name/                  ← 4K originals (immutable)
│   └── web/                            ← 2880px Retina (disposable)
├── versions/
│   ├── latest -> vN-style-name         ← symlink to current version
│   ├── v3-old-style/
│   │   ├── article.md                  ← frozen markdown
│   │   ├── image-prompts-v3.md
│   │   ├── meta.json
│   │   └── export/html/               ← self-contained HTML (images baked in)
│   └── vN-style-name/
│       ├── article.md
│       ├── image-prompts-vN.md
│       ├── meta.json
│       └── export/html/
└── scripts/
    ├── generate-vN-images.sh
    ├── resize-for-web.sh
    ├── export.sh
    └── snapshot-version.sh
```

## Critical Rules

1. **NEVER** write into `images/vN-name/` after generation — immutable
2. **NEVER** write into `versions/vN-name/` after snapshot — immutable
3. **NEVER** resize/compress originals in-place
4. **ALWAYS** reference `images/active/` in markdown
5. **ALWAYS** snapshot before switching to a new image set
6. **NEVER** overwrite prompt docs — create new version (`v3`, `v4`, etc.)
7. Derivatives (`images/web/`) are disposable — regenerate from `active/`
8. Version exports are self-contained — open HTML directly to compare

## Examples

**Full pipeline:**
```
/article-illustrations:illustrate docs/my-article.md
```

**Just analyse the document:**
```
/article-illustrations:illustrate docs/my-article.md --step=analyse
```

**Generate with Pro model:**
```
/article-illustrations:illustrate docs/my-article.md --step=generate --model=pro
```

**Re-export after editing:**
```
/article-illustrations:illustrate docs/my-article.md --step=export
```

**New version of illustrations:**
```
/article-illustrations:illustrate docs/my-article.md --step=generate --version=v5
```

## Execution

Based on the `--step` argument, execute the appropriate pipeline phase:

1. **Determine article directory** from the markdown file path
2. **Check for existing infrastructure** (images/, scripts/, etc.)
3. **Run the requested step(s)**
4. **Report results** with file sizes and locations

### Key Scripts

**Generation:**
```bash
SCRIPT="$HOME/.claude/plugins/marketplaces/emdashcodes-claude-code-plugins/plugins/nano-banana-image-editor/skills/nano-banana-image-editor/scripts/create_image.py"
export GEMINI_MODEL="gemini-3.1-flash-image-preview"  # or gemini-3-pro-image-preview
python3 "$SCRIPT" "output-path.jpg" "prompt text" --resolution 4K --aspect-ratio 16:9
```

**Resize:**
```bash
python3 -c "
from PIL import Image; from pathlib import Path; import os
src, dst = Path('images/active'), Path('images/web')
dst.mkdir(exist_ok=True)
for f in sorted(src.glob('*.jpg')):
    out = dst / f.name
    if out.exists() and out.stat().st_mtime >= f.stat().st_mtime: continue
    img = Image.open(f)
    w, h = img.size; nw = 2880; nh = int(h * nw / w)
    img.resize((nw, nh), Image.LANCZOS).save(str(out), 'JPEG', quality=95)
"
```

**Export:**
The markdown-export tool writes output to `export/` **relative to the input file** — it does NOT support `--output-dir`. So the temp file MUST be in the project directory (not `/tmp/`), and output must be moved afterwards.
```bash
# Temp file MUST be in project dir (export tool resolves images relative to input)
TEMP_DOC="$PROJECT_DIR/.export-temp.md"
python3 -c "
with open('article.md') as f: c = f.read()
c = c.replace('images/active/', 'images/web/')
with open('$TEMP_DOC', 'w') as f: f.write(c)
"
node ~/.claude/tools/markdown-export/convert.js "$TEMP_DOC" --format html
rm -f "$TEMP_DOC"
# Move output from default location to versioned directory
mv "$PROJECT_DIR/export/html/.export-temp.html" "$EXPORT_DIR/html/article-name.html"
rm -rf "$PROJECT_DIR/export"
```

**Archive:**
```bash
# Full archive (excludes disposable web derivatives)
cd article-folder/
tar -czf ../article-name-$(date +%Y%m%d).tar.gz --exclude='images/web' .

# Lightweight (just versions with baked-in exports, no 4K originals)
tar -czf ../article-name-versions-$(date +%Y%m%d).tar.gz versions/
```
