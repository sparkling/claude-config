#!/usr/bin/env node
const fs = require('fs').promises;
const path = require('path');
const { renderMermaidToPNG, savePNG } = require('./render-mermaid');

/**
 * Find already-rendered diagram patterns in the document.
 * Pattern: ![name](path) followed by <details> containing mermaid source
 *
 * Returns array of { imagePath, mermaidCode, name, startIndex, endIndex }
 */
function findRenderedDiagrams(content) {
  const diagrams = [];

  // Pattern matches:
  // ![alt-text](diagrams/path/name.png)
  //
  // <details>
  // <summary>Mermaid Source</summary>
  //
  // ```mermaid
  // ...code...
  // ```
  //
  // </details>

  const pattern = /!\[([^\]]*)\]\(([^)]+\.(?:png|svg))\)\s*\n\s*\n\s*<details>\s*\n\s*<summary>Mermaid Source<\/summary>\s*\n\s*\n\s*```mermaid\s*\n([\s\S]*?)```\s*\n\s*\n\s*<\/details>/gi;

  let match;
  while ((match = pattern.exec(content)) !== null) {
    const altText = match[1];
    const imagePath = match[2];
    const mermaidCode = match[3].trim();

    // Extract name from image path or alt text
    const name = path.basename(imagePath, path.extname(imagePath)) || altText || 'diagram';

    diagrams.push({
      name,
      imagePath,
      mermaidCode,
      altText,
      fullMatch: match[0],
      startIndex: match.index,
      endIndex: match.index + match[0].length
    });
  }

  return diagrams;
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
 * Detect document type and return appropriate image syntax
 */
function getImageSyntax(docType, imagePath, altText, diagramCode) {
  const relativePath = imagePath;

  switch (docType) {
    case '.md':
    case '.markdown':
      return `![${altText}](${relativePath})

<details>
<summary>Mermaid Source</summary>

\`\`\`mermaid
${diagramCode}
\`\`\`

</details>`;

    case '.html':
    case '.htm':
      return `<img src="${relativePath}" alt="${altText}" style="max-width: 100%; height: auto;">

<details>
<summary>Mermaid Source</summary>
<pre><code class="language-mermaid">
${diagramCode}
</code></pre>
</details>`;

    case '.mdx':
      return `<img src="${relativePath}" alt="${altText}" style={{maxWidth: '100%', height: 'auto'}} />

<details>
<summary>Mermaid Source</summary>

\`\`\`mermaid
${diagramCode}
\`\`\`

</details>`;

    case '.rst':
      return `.. image:: ${relativePath}
   :alt: ${altText}
   :width: 100%

..
   Original Mermaid diagram (uncomment to edit, then re-render):
   \`\`\`mermaid
   ${diagramCode.split('\n').join('\n   ')}
   \`\`\``;

    case '.adoc':
    case '.asciidoc':
      return `image::${relativePath}[${altText},width=100%]

////
Original Mermaid diagram (uncomment to edit, then re-render):
\`\`\`mermaid
${diagramCode}
\`\`\`
////`;

    default:
      return `![${altText}](${relativePath})

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

  // PHASE 1: Re-render existing diagrams (image + details pattern)
  const renderedDiagrams = findRenderedDiagrams(content);

  if (verbose && renderedDiagrams.length > 0) {
    console.error(`Found ${renderedDiagrams.length} already-rendered diagram(s) to update`);
  }

  for (const diagram of renderedDiagrams) {
    // Resolve the image path relative to document directory
    const absoluteImagePath = path.resolve(docDir, diagram.imagePath);

    if (verbose) {
      console.error(`  Re-rendering: ${diagram.name} -> ${diagram.imagePath}`);
    }

    if (!dryRun) {
      try {
        // Ensure output directory exists
        await fs.mkdir(path.dirname(absoluteImagePath), { recursive: true });

        // Render diagram
        const png = await renderMermaidToPNG(diagram.mermaidCode, { theme });
        await savePNG(png, absoluteImagePath);

        processedDiagrams.push({
          name: diagram.name,
          pngPath: absoluteImagePath,
          relativePath: diagram.imagePath,
          type: 're-render'
        });
      } catch (err) {
        console.error(`  Error re-rendering ${diagram.name}: ${err.message}`);
      }
    } else {
      console.log(`Would re-render: ${diagram.name} -> ${diagram.imagePath}`);
    }
  }

  // PHASE 2: Process standalone mermaid blocks (new diagrams)
  const standaloneBlocks = findStandaloneMermaidBlocks(content);

  if (verbose && standaloneBlocks.length > 0) {
    console.error(`Found ${standaloneBlocks.length} new standalone mermaid block(s)`);
  }

  // Process in reverse order to preserve indices when replacing
  for (let i = standaloneBlocks.length - 1; i >= 0; i--) {
    const block = standaloneBlocks[i];
    const pngFileName = `${block.name}.png`;
    const pngPath = path.join(diagramDir, pngFileName);
    const relativePngPath = path.relative(docDir, pngPath);

    if (verbose) {
      console.error(`  Rendering new: ${block.name} -> ${relativePngPath}`);
    }

    if (!dryRun) {
      try {
        // Ensure output directory exists
        await fs.mkdir(diagramDir, { recursive: true });

        // Render diagram
        const png = await renderMermaidToPNG(block.code, { theme });
        await savePNG(png, pngPath);

        // Generate replacement syntax
        const replacement = getImageSyntax(docExt, relativePngPath, block.name, block.code);

        // Replace in content
        newContent = newContent.slice(0, block.startIndex) + replacement + newContent.slice(block.endIndex);

        processedDiagrams.push({
          name: block.name,
          pngPath: pngPath,
          relativePath: relativePngPath,
          type: 'new'
        });
      } catch (err) {
        console.error(`  Error rendering ${block.name}: ${err.message}`);
      }
    } else {
      console.log(`Would render new: ${block.name} -> ${relativePngPath}`);
    }
  }

  // Write updated document only if we added new diagrams
  const hasNewDiagrams = processedDiagrams.some(d => d.type === 'new');
  if (!dryRun && hasNewDiagrams) {
    await fs.writeFile(absolutePath, newContent, 'utf-8');
    if (verbose) {
      console.error(`Updated document: ${absolutePath}`);
    }
  }

  if (verbose) {
    const rerendered = processedDiagrams.filter(d => d.type === 're-render').length;
    const newDiagrams = processedDiagrams.filter(d => d.type === 'new').length;
    console.error(`Summary: ${rerendered} re-rendered, ${newDiagrams} new`);
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
