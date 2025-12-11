#!/usr/bin/env node
const fs = require('fs').promises;
const path = require('path');
const { renderDotToSVG, saveOutput, LAYOUT_ENGINES } = require('./render-dot');

/**
 * Extract DOT code blocks from document content
 * Supports: ```dot, ```graphviz, ```gv syntax
 * Returns array of { code, startIndex, endIndex, name, layout }
 */
function extractDotBlocks(content) {
  const blocks = [];
  // Match ```dot, ```graphviz, or ```gv blocks
  // Also capture optional layout hint in fence: ```dot:neato
  const regex = /```(?:dot|graphviz|gv)(?::(\w+))?\s*\n([\s\S]*?)```/gi;
  let match;
  let diagramIndex = 1;

  while ((match = regex.exec(content)) !== null) {
    const layoutHint = match[1] || null;  // Layout engine from fence (e.g., ```dot:neato)
    const code = match[2].trim();

    // Try to extract a name from the diagram
    let name = `diagram-${diagramIndex}`;
    let layout = layoutHint || 'dot';

    // Check for graph/digraph name: digraph GraphName { or graph "Graph Name" {
    const graphNameMatch = code.match(/(?:di)?graph\s+(?:"([^"]+)"|([A-Za-z_][A-Za-z0-9_]*))\s*\{/i);
    if (graphNameMatch) {
      const extractedName = graphNameMatch[1] || graphNameMatch[2];
      if (extractedName && extractedName !== 'G') {
        name = extractedName.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
      }
    }

    // Check for layout directive in DOT code: layout=neato or // layout: neato
    const layoutDirective = code.match(/(?:layout\s*=\s*|\/\/\s*layout:\s*)(\w+)/i);
    if (layoutDirective && LAYOUT_ENGINES.includes(layoutDirective[1])) {
      layout = layoutDirective[1];
    }

    // Check for label to use as name if no graph name found
    if (name === `diagram-${diagramIndex}`) {
      const labelMatch = code.match(/label\s*=\s*"([^"]+)"/);
      if (labelMatch) {
        name = labelMatch[1].replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase().slice(0, 50);
      }
    }

    blocks.push({
      code,
      fullMatch: match[0],
      startIndex: match.index,
      endIndex: match.index + match[0].length,
      name,
      layout
    });
    diagramIndex++;
  }

  return blocks;
}

/**
 * Detect document type and return appropriate image syntax
 */
function getImageSyntax(docType, imagePath, altText, dotCode, layout) {
  const relativePath = imagePath;
  const layoutInfo = layout !== 'dot' ? ` (layout: ${layout})` : '';

  switch (docType) {
    case '.md':
    case '.markdown':
      // Markdown: use img tag for sizing control, with commented original
      return `<!-- DOT/Graphviz diagram rendered to SVG${layoutInfo} -->
![${altText}](${relativePath})

<!--
Original DOT diagram (uncomment to edit, then re-render):
\`\`\`dot${layout !== 'dot' ? ':' + layout : ''}
${dotCode}
\`\`\`
-->`;

    case '.html':
    case '.htm':
      return `<!-- DOT/Graphviz diagram rendered to SVG${layoutInfo} -->
<img src="${relativePath}" alt="${altText}" style="max-width: 100%; height: auto;">

<!--
Original DOT diagram (uncomment to edit, then re-render):
\`\`\`dot${layout !== 'dot' ? ':' + layout : ''}
${dotCode}
\`\`\`
-->`;

    case '.mdx':
      return `{/* DOT/Graphviz diagram rendered to SVG${layoutInfo} */}
<img src="${relativePath}" alt="${altText}" style={{maxWidth: '100%', height: 'auto'}} />

{/*
Original DOT diagram (uncomment to edit, then re-render):
\`\`\`dot${layout !== 'dot' ? ':' + layout : ''}
${dotCode}
\`\`\`
*/}`;

    case '.rst':
      // reStructuredText
      return `.. image:: ${relativePath}
   :alt: ${altText}
   :width: 100%

..
   Original DOT diagram (uncomment to edit, then re-render):
   \`\`\`dot${layout !== 'dot' ? ':' + layout : ''}
   ${dotCode.split('\n').join('\n   ')}
   \`\`\``;

    case '.adoc':
    case '.asciidoc':
      // AsciiDoc
      return `image::${relativePath}[${altText},width=100%]

////
Original DOT diagram (uncomment to edit, then re-render):
\`\`\`dot${layout !== 'dot' ? ':' + layout : ''}
${dotCode}
\`\`\`
////`;

    default:
      // Default to markdown style
      return `<!-- DOT/Graphviz diagram rendered to SVG${layoutInfo} -->
![${altText}](${relativePath})

<!--
Original DOT diagram:
\`\`\`dot${layout !== 'dot' ? ':' + layout : ''}
${dotCode}
\`\`\`
-->`;
  }
}

/**
 * Process a document, render all DOT diagrams to SVG
 */
async function processDocument(documentPath, options = {}) {
  const {
    layout = null,  // null = auto-detect from diagram or use 'dot'
    outputDir = null,  // null = auto-generate based on document
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

  // Extract DOT blocks
  const blocks = extractDotBlocks(content);

  if (blocks.length === 0) {
    if (verbose) console.error('No DOT/Graphviz diagrams found.');
    return { processed: 0, diagrams: [] };
  }

  if (verbose) {
    console.error(`Found ${blocks.length} DOT diagram(s)`);
  }

  // Process each block (in reverse order to preserve indices)
  let newContent = content;
  const processedDiagrams = [];

  for (let i = blocks.length - 1; i >= 0; i--) {
    const block = blocks[i];
    const svgFileName = `${block.name}.svg`;
    const svgPath = path.join(diagramDir, svgFileName);
    const relativeSvgPath = path.relative(docDir, svgPath);

    // Use provided layout override, or block-specific layout, or default 'dot'
    const effectiveLayout = layout || block.layout || 'dot';

    if (verbose) {
      console.error(`  Rendering: ${block.name} -> ${relativeSvgPath} (layout: ${effectiveLayout})`);
    }

    if (!dryRun) {
      try {
        // Render diagram
        const svg = await renderDotToSVG(block.code, { layout: effectiveLayout });
        await saveOutput(svg, svgPath);

        // Generate replacement syntax
        const replacement = getImageSyntax(docExt, relativeSvgPath, block.name, block.code, effectiveLayout);

        // Replace in content
        newContent = newContent.slice(0, block.startIndex) + replacement + newContent.slice(block.endIndex);

        processedDiagrams.push({
          name: block.name,
          svgPath: svgPath,
          relativePath: relativeSvgPath,
          layout: effectiveLayout
        });
      } catch (err) {
        console.error(`  Error rendering ${block.name}: ${err.message}`);
      }
    } else {
      console.log(`Would render: ${block.name} -> ${relativeSvgPath} (layout: ${effectiveLayout})`);
    }
  }

  // Write updated document
  if (!dryRun && processedDiagrams.length > 0) {
    await fs.writeFile(absolutePath, newContent, 'utf-8');
    if (verbose) {
      console.error(`Updated: ${absolutePath}`);
    }
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
    console.log(`  --layout=<engine>   Override layout engine for all diagrams`);
    console.log(`                      (${LAYOUT_ENGINES.join('|')})`);
    console.log('  --output=<dir>      Custom output directory for diagrams');
    console.log('  --dry-run           Show what would be done without making changes');
    console.log('  --verbose           Show detailed progress');
    console.log('');
    console.log('DOT Block Syntax:');
    console.log('  ```dot              - Standard DOT block (uses dot layout)');
    console.log('  ```graphviz         - Alias for DOT');
    console.log('  ```gv               - Alias for DOT');
    console.log('  ```dot:neato        - Specify layout in fence');
    console.log('');
    console.log('In-diagram layout:');
    console.log('  // layout: neato    - Comment directive');
    console.log('  layout=fdp          - DOT attribute');
    console.log('');
    console.log('Supported formats: .md, .html, .mdx, .rst, .adoc');
    console.log('');
    console.log('Example:');
    console.log('  process-document.js README.md --layout=neato --verbose');
    process.exit(1);
  }

  const flags = args.filter(a => a.startsWith('--'));
  const positional = args.filter(a => !a.startsWith('--'));

  const options = {
    layout: null,
    outputDir: null,
    dryRun: false,
    verbose: false
  };

  for (const flag of flags) {
    if (flag.startsWith('--layout=')) {
      const requestedLayout = flag.split('=')[1];
      if (!LAYOUT_ENGINES.includes(requestedLayout)) {
        console.error(`Invalid layout: ${requestedLayout}`);
        console.error(`Valid layouts: ${LAYOUT_ENGINES.join(', ')}`);
        process.exit(1);
      }
      options.layout = requestedLayout;
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

module.exports = { processDocument, extractDotBlocks };
