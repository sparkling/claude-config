#!/usr/bin/env node
const fs = require('fs').promises;
const path = require('path');
const { renderMermaidToSVG, saveSVG } = require('./render-mermaid');

// Single source of truth: ~/.claude/skills/diagramming/theme-variables.json
const themeVarsPath = path.join(require('os').homedir(), '.claude/skills/diagramming/theme-variables.json');
const { light: THEME_LIGHT, dark: THEME_DARK } = JSON.parse(require('fs').readFileSync(themeVarsPath, 'utf-8'));

/**
 * Find already-rendered diagram patterns in the document.
 * Three patterns are recognised:
 *   1. Old markdown ![alt](name.svg) — legacy single-theme. Migrates to paired on re-render.
 *   2. Old HTML <img src="name.svg"> — legacy single-theme. Migrates to paired on re-render.
 *   3. New paired <img class="diagram-pair" src="name.light.svg" data-dark-src="name.dark.svg"> — steady state.
 *
 * Returns array of { name, lightPath, darkPath?, mermaidCode, altText, fullMatch, startIndex, endIndex, syntax, legacy }
 * where `legacy: true` means the pattern is old-single and the document should be rewritten to paired.
 */
function findRenderedDiagrams(content) {
  const diagrams = [];
  let match;

  // Pattern 0 (preferred): Paired <img class="diagram-pair" ... data-dark-src="...">
  const pairedPattern = /<img\s+[^>]*class=["'][^"']*\bdiagram-pair\b[^"']*["'][^>]*>\s*\n\s*\n\s*<details>\s*\n\s*<summary>Mermaid Source<\/summary>\s*\n\s*\n\s*```mermaid\s*\n([\s\S]*?)```\s*\n\s*\n\s*<\/details>/gi;
  while ((match = pairedPattern.exec(content)) !== null) {
    const tag = match[0];
    const srcMatch = tag.match(/\bsrc=["']([^"']+)["']/i);
    const darkMatch = tag.match(/\bdata-dark-src=["']([^"']+)["']/i);
    const altMatch = tag.match(/\balt=["']([^"']*)["']/i);
    const lightPath = srcMatch ? srcMatch[1] : null;
    const darkPath = darkMatch ? darkMatch[1] : null;
    if (!lightPath || !darkPath) continue;
    const mermaidCode = match[1].trim();
    const altText = altMatch ? altMatch[1] : '';
    const base = path.basename(lightPath, path.extname(lightPath)).replace(/\.light$/, '');
    diagrams.push({
      name: base || altText || 'diagram',
      lightPath,
      darkPath,
      mermaidCode,
      altText,
      fullMatch: match[0],
      startIndex: match.index,
      endIndex: match.index + match[0].length,
      syntax: 'paired',
      legacy: false
    });
  }

  // Pattern 1 (legacy): markdown ![alt](name.svg) followed by <details>
  const markdownPattern = /!\[([^\]]*)\]\(([^)]+\.(?:svg|png))\)\s*\n\s*\n\s*<details>\s*\n\s*<summary>Mermaid Source<\/summary>\s*\n\s*\n\s*```mermaid\s*\n([\s\S]*?)```\s*\n\s*\n\s*<\/details>/gi;
  while ((match = markdownPattern.exec(content)) !== null) {
    const altText = match[1];
    const imagePath = match[2];
    const mermaidCode = match[3].trim();
    // Skip if another matcher already caught this region
    if (diagrams.some(d => overlaps(d, match.index, match.index + match[0].length))) continue;
    const name = path.basename(imagePath, path.extname(imagePath)).replace(/\.(light|dark)$/, '') || altText || 'diagram';
    diagrams.push({
      name,
      lightPath: imagePath,
      darkPath: null, // derived on re-render
      mermaidCode,
      altText,
      fullMatch: match[0],
      startIndex: match.index,
      endIndex: match.index + match[0].length,
      syntax: 'markdown',
      legacy: true
    });
  }

  // Pattern 2 (legacy): HTML <img> without diagram-pair class followed by <details>
  const imgTagPattern = /<img\s+(?![^>]*class=["'][^"']*\bdiagram-pair\b)[^>]*src=["']([^"']+\.(?:svg|png))["'][^>]*>\s*\n\s*\n\s*<details>\s*\n\s*<summary>Mermaid Source<\/summary>\s*\n\s*\n\s*```mermaid\s*\n([\s\S]*?)```\s*\n\s*\n\s*<\/details>/gi;
  while ((match = imgTagPattern.exec(content)) !== null) {
    const imagePath = match[1];
    const mermaidCode = match[2].trim();
    if (diagrams.some(d => overlaps(d, match.index, match.index + match[0].length))) continue;
    const altMatch = match[0].match(/alt=["']([^"']*)["']/i);
    const altText = altMatch ? altMatch[1] : '';
    const name = path.basename(imagePath, path.extname(imagePath)).replace(/\.(light|dark)$/, '') || altText || 'diagram';
    diagrams.push({
      name,
      lightPath: imagePath,
      darkPath: null,
      mermaidCode,
      altText,
      fullMatch: match[0],
      startIndex: match.index,
      endIndex: match.index + match[0].length,
      syntax: 'html',
      legacy: true
    });
  }

  diagrams.sort((a, b) => a.startIndex - b.startIndex);
  return diagrams;
}

function overlaps(existing, start, end) {
  return !(end <= existing.startIndex || start >= existing.endIndex);
}

/**
 * Given an existing image path (possibly `...svg`, `...light.svg`, or `...dark.svg`),
 * return the canonical `{ light, dark }` pair derived from the same directory.
 */
function derivePairPaths(existingPath) {
  const dir = path.dirname(existingPath);
  const ext = path.extname(existingPath);
  let base = path.basename(existingPath, ext);
  base = base.replace(/\.(light|dark)$/, '');
  const sep = dir && dir !== '.' ? '/' : '';
  const prefix = dir && dir !== '.' ? `${dir}${sep}` : '';
  return {
    light: `${prefix}${base}.light${ext}`,
    dark: `${prefix}${base}.dark${ext}`
  };
}

/**
 * Find standalone mermaid blocks (not inside <details>)
 * These are NEW diagrams that need initial rendering
 */
function findStandaloneMermaidBlocks(content) {
  const blocks = [];
  const regex = /```mermaid\s*\n([\s\S]*?)```/gi;
  let match;
  let diagramIndex = 1;

  while ((match = regex.exec(content)) !== null) {
    // Check if this block is inside a <details> element
    const beforeContent = content.substring(0, match.index);
    const openTags = (beforeContent.match(/<details[^>]*>/gi) || []).length;
    const closeTags = (beforeContent.match(/<\/details>/gi) || []).length;

    if (openTags > closeTags) {
      // Inside <details>, skip - this is handled by findRenderedDiagrams
      continue;
    }

    const code = match[1].trim();

    // Try to extract a name from the diagram
    let name = `diagram-${diagramIndex}`;

    // Check for accTitle (accessibility title) - preferred naming source
    const accTitleMatch = code.match(/accTitle:\s*(.+)$/m);
    if (accTitleMatch) {
      name = accTitleMatch[1].trim().replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-_]/g, '').toLowerCase();
    } else {
      // Check for title in config
      const titleMatch = code.match(/title[:\s]+([^\n]+)/i);
      if (titleMatch) {
        name = titleMatch[1].trim().replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
      }
    }

    blocks.push({
      code,
      fullMatch: match[0],
      startIndex: match.index,
      endIndex: match.index + match[0].length,
      name
    });
    diagramIndex++;
  }

  return blocks;
}

/**
 * Escape double-quotes for embedding in HTML attribute values.
 */
function htmlAttr(value) {
  return String(value || '').replace(/"/g, '&quot;');
}

/**
 * Detect document type and return appropriate image syntax.
 * For .md/.html/.mdx emits a paired <img class="diagram-pair" src="...light.svg" data-dark-src="...dark.svg">
 * so that dark-mode-aware consumers (markdown-export HTML, custom viewers) can swap between the two.
 * Falls back to single-image for .rst/.adoc where custom HTML doesn't round-trip cleanly.
 */
function getImageSyntax(docType, paths, altText, diagramCode) {
  // paths: { light, dark }
  const light = paths.light;
  const dark = paths.dark;
  const altEsc = htmlAttr(altText);

  const pairedImg = `<img class="diagram-pair" src="${htmlAttr(light)}" data-dark-src="${htmlAttr(dark)}" alt="${altEsc}">`;

  switch (docType) {
    case '.md':
    case '.markdown':
      return `${pairedImg}

<details>
<summary>Mermaid Source</summary>

\`\`\`mermaid
${diagramCode}
\`\`\`

</details>`;

    case '.html':
    case '.htm':
      return `${pairedImg}

<details>
<summary>Mermaid Source</summary>
<pre><code class="language-mermaid">
${diagramCode}
</code></pre>
</details>`;

    case '.mdx':
      return `<img class="diagram-pair" src="${htmlAttr(light)}" data-dark-src="${htmlAttr(dark)}" alt="${altEsc}" />

<details>
<summary>Mermaid Source</summary>

\`\`\`mermaid
${diagramCode}
\`\`\`

</details>`;

    case '.rst':
      return `.. image:: ${light}
   :alt: ${altText}
   :width: 100%

..
   Original Mermaid diagram (uncomment to edit, then re-render):
   \`\`\`mermaid
   ${diagramCode.split('\n').join('\n   ')}
   \`\`\``;

    case '.adoc':
    case '.asciidoc':
      return `image::${light}[${altText},width=100%]

////
Original Mermaid diagram (uncomment to edit, then re-render):
\`\`\`mermaid
${diagramCode}
\`\`\`
////`;

    default:
      return `${pairedImg}

<details>
<summary>Mermaid Source</summary>

\`\`\`mermaid
${diagramCode}
\`\`\`

</details>`;
  }
}

/**
 * Process a document, render all mermaid diagrams to PNG
 * Handles both:
 * 1. Re-rendering existing diagrams (updates image files in place)
 * 2. Initial rendering of new standalone mermaid blocks
 */
async function processDocument(documentPath, options = {}) {
  const {
    theme = 'default',
    outputDir = null,
    dryRun = false,
    verbose = false
  } = options;

  const absolutePath = path.resolve(documentPath);
  const docDir = path.dirname(absolutePath);
  const docName = path.basename(absolutePath, path.extname(absolutePath));
  const docExt = path.extname(absolutePath).toLowerCase();

  // Default output directory: diagrams/{document-name}/
  const diagramDir = outputDir || path.join(docDir, 'diagrams', docName);

  if (verbose) {
    console.error(`Processing: ${absolutePath}`);
    console.error(`Diagram output: ${diagramDir}`);
  }

  // Read document
  const content = await fs.readFile(absolutePath, 'utf-8');

  const processedDiagrams = [];
  let newContent = content;

  async function renderPair(mermaidCode, lightAbs, darkAbs) {
    await fs.mkdir(path.dirname(lightAbs), { recursive: true });
    await fs.mkdir(path.dirname(darkAbs), { recursive: true });
    const darkCode = mermaidCode
      .replace(/^\s*classDef\s+.+$/gm, '')
      .replace(/^%%\{\s*init\s*:[\s\S]*?\}%%$/gm, '');
    const [lightSvg, darkSvg] = await Promise.all([
      renderMermaidToSVG(mermaidCode, { theme: 'base', themeVariables: THEME_LIGHT }),
      renderMermaidToSVG(darkCode, { theme: 'base', themeVariables: THEME_DARK })
    ]);
    await saveSVG(lightSvg, lightAbs);
    await saveSVG(darkSvg, darkAbs);
  }

  // PHASE 1: Re-render existing diagrams (paired + legacy patterns)
  const renderedDiagrams = findRenderedDiagrams(content);
  if (verbose && renderedDiagrams.length > 0) {
    console.error(`Found ${renderedDiagrams.length} already-rendered diagram(s)`);
  }

  // Process in reverse order so text migrations preserve indices
  const sortedRendered = [...renderedDiagrams].sort((a, b) => b.startIndex - a.startIndex);
  for (const diagram of sortedRendered) {
    // Determine paired paths
    const pair = diagram.darkPath
      ? { light: diagram.lightPath, dark: diagram.darkPath }
      : derivePairPaths(diagram.lightPath);
    const lightAbs = path.resolve(docDir, pair.light);
    const darkAbs = path.resolve(docDir, pair.dark);

    if (verbose) {
      const tag = diagram.legacy ? 'migrate' : 're-render';
      console.error(`  ${tag}: ${diagram.name}`);
      console.error(`      light -> ${pair.light}`);
      console.error(`      dark  -> ${pair.dark}`);
    }

    if (!dryRun) {
      try {
        await renderPair(diagram.mermaidCode, lightAbs, darkAbs);

        // If this was a legacy single-theme diagram, migrate the markdown pattern to paired.
        if (diagram.legacy) {
          const replacement = getImageSyntax(docExt, pair, diagram.altText || diagram.name, diagram.mermaidCode);
          newContent = newContent.slice(0, diagram.startIndex) + replacement + newContent.slice(diagram.endIndex);
        }

        processedDiagrams.push({
          name: diagram.name,
          lightPath: lightAbs,
          darkPath: darkAbs,
          lightRelative: pair.light,
          darkRelative: pair.dark,
          type: diagram.legacy ? 'migrated' : 're-render'
        });
      } catch (err) {
        console.error(`  Error rendering pair for ${diagram.name}: ${err.message}`);
      }
    } else {
      console.log(`Would render pair for: ${diagram.name}`);
    }
  }

  // PHASE 2: Process standalone mermaid blocks (new diagrams)
  const standaloneBlocks = findStandaloneMermaidBlocks(content);
  if (verbose && standaloneBlocks.length > 0) {
    console.error(`Found ${standaloneBlocks.length} new standalone mermaid block(s)`);
  }

  // Reverse order preserves source indices as we splice in replacements.
  for (let i = standaloneBlocks.length - 1; i >= 0; i--) {
    const block = standaloneBlocks[i];
    const lightPath = path.join(diagramDir, `${block.name}.light.svg`);
    const darkPath = path.join(diagramDir, `${block.name}.dark.svg`);
    const relLight = path.relative(docDir, lightPath);
    const relDark = path.relative(docDir, darkPath);

    if (verbose) {
      console.error(`  Rendering new: ${block.name}`);
      console.error(`      light -> ${relLight}`);
      console.error(`      dark  -> ${relDark}`);
    }

    if (!dryRun) {
      try {
        await fs.mkdir(diagramDir, { recursive: true });
        await renderPair(block.code, lightPath, darkPath);
        const replacement = getImageSyntax(docExt, { light: relLight, dark: relDark }, block.name, block.code);
        newContent = newContent.slice(0, block.startIndex) + replacement + newContent.slice(block.endIndex);

        processedDiagrams.push({
          name: block.name,
          lightPath,
          darkPath,
          lightRelative: relLight,
          darkRelative: relDark,
          type: 'new'
        });
      } catch (err) {
        console.error(`  Error rendering ${block.name}: ${err.message}`);
      }
    } else {
      console.log(`Would render new pair for: ${block.name}`);
    }
  }

  // Persist document when we emitted new diagrams OR migrated legacy references
  const docChanged = processedDiagrams.some(d => d.type === 'new' || d.type === 'migrated');
  if (!dryRun && docChanged) {
    await fs.writeFile(absolutePath, newContent, 'utf-8');
    if (verbose) {
      console.error(`Updated document: ${absolutePath}`);
    }
  }

  if (verbose) {
    const counts = processedDiagrams.reduce((acc, d) => {
      acc[d.type] = (acc[d.type] || 0) + 1;
      return acc;
    }, {});
    console.error('Summary:', Object.entries(counts).map(([k, v]) => `${v} ${k}`).join(', ') || '(nothing to do)');
  }

  return {
    processed: processedDiagrams.length,
    diagrams: processedDiagrams,
    documentPath: absolutePath
  };
}

// CLI
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.log('Usage: process-document.js <document> [options]');
    console.log('');
    console.log('Options:');
    console.log('  --theme=<theme>     Mermaid theme (default|forest|dark|neutral)');
    console.log('  --output=<dir>      Custom output directory for diagrams');
    console.log('  --dry-run           Show what would be done without making changes');
    console.log('  --verbose           Show detailed progress');
    console.log('');
    console.log('Behavior:');
    console.log('  - Re-renders existing diagrams (image + <details> pattern)');
    console.log('  - Renders new standalone mermaid blocks');
    console.log('  - Updates image files in place for existing diagrams');
    console.log('');
    console.log('Supported formats: .md, .html, .mdx, .rst, .adoc');
    console.log('');
    console.log('Example:');
    console.log('  process-document.js README.md --theme=dark --verbose');
    process.exit(1);
  }

  const flags = args.filter(a => a.startsWith('--'));
  const positional = args.filter(a => !a.startsWith('--'));

  const options = {
    theme: 'default',
    outputDir: null,
    dryRun: false,
    verbose: false
  };

  for (const flag of flags) {
    if (flag.startsWith('--theme=')) {
      options.theme = flag.split('=')[1];
    } else if (flag.startsWith('--output=')) {
      options.outputDir = flag.split('=')[1];
    } else if (flag === '--dry-run') {
      options.dryRun = true;
    } else if (flag === '--verbose') {
      options.verbose = true;
    }
  }

  const documentPath = positional[0];

  try {
    const result = await processDocument(documentPath, options);

    // Output JSON result for programmatic use
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { processDocument, findRenderedDiagrams, findStandaloneMermaidBlocks };
