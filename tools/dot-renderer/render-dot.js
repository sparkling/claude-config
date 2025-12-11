#!/usr/bin/env node
const { graphviz } = require('node-graphviz');
const fs = require('fs').promises;
const path = require('path');

/**
 * Available layout engines
 */
const LAYOUT_ENGINES = ['dot', 'circo', 'fdp', 'neato', 'osage', 'patchwork', 'twopi'];

/**
 * Available output formats
 */
const OUTPUT_FORMATS = ['svg', 'dot', 'json', 'dot_json', 'xdot_json'];

/**
 * Renders a DOT diagram to SVG (or other format)
 * @param {string} dotCode - DOT/Graphviz diagram code
 * @param {object} options - Rendering options
 * @returns {Promise<string>} SVG string (or other format)
 */
async function renderDotToSVG(dotCode, options = {}) {
  const {
    layout = 'dot',
    format = 'svg'
  } = options;

  // Validate layout engine
  if (!LAYOUT_ENGINES.includes(layout)) {
    throw new Error(`Invalid layout engine: ${layout}. Valid options: ${LAYOUT_ENGINES.join(', ')}`);
  }

  // Validate format
  if (!OUTPUT_FORMATS.includes(format)) {
    throw new Error(`Invalid format: ${format}. Valid options: ${OUTPUT_FORMATS.join(', ')}`);
  }

  // Use the layout method to render
  const result = await graphviz.layout(dotCode, format, layout);

  // If SVG, add responsive attributes
  if (format === 'svg') {
    return makeResponsive(result);
  }

  return result;
}

/**
 * Make SVG responsive with proper viewBox and sizing
 * @param {string} svg - Raw SVG string
 * @returns {string} Responsive SVG
 */
function makeResponsive(svg) {
  // Extract width/height from SVG
  const widthMatch = svg.match(/width="(\d+(?:\.\d+)?)(pt|px)?"/);
  const heightMatch = svg.match(/height="(\d+(?:\.\d+)?)(pt|px)?"/);

  if (widthMatch && heightMatch) {
    let width = parseFloat(widthMatch[1]);
    let height = parseFloat(heightMatch[1]);

    // Convert pt to px (1pt ≈ 1.333px)
    if (widthMatch[2] === 'pt') {
      width = Math.ceil(width * 1.333);
      height = Math.ceil(height * 1.333);
    }

    // Check if viewBox already exists
    const hasViewBox = /viewBox="/.test(svg);

    if (!hasViewBox) {
      // Add viewBox for proper scaling
      svg = svg.replace(
        /<svg([^>]*)>/,
        `<svg$1 viewBox="0 0 ${width} ${height}">`
      );
    }

    // Make width responsive
    svg = svg.replace(
      /width="(\d+(?:\.\d+)?)(pt|px)?"/,
      'width="100%"'
    );

    // Make height auto
    svg = svg.replace(
      /height="(\d+(?:\.\d+)?)(pt|px)?"/,
      'height="auto"'
    );

    // Add max-width style
    svg = svg.replace(
      /<svg([^>]*)>/,
      `<svg$1 style="max-width: ${width}px;">`
    );
  }

  return svg;
}

/**
 * Save output to file
 */
async function saveOutput(content, outputPath) {
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, content, 'utf-8');
  return outputPath;
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.log('Usage: render-dot.js <dot-code-or-file> [output.svg] [--layout=<engine>] [--format=<format>]');
    console.log('');
    console.log('Options:');
    console.log(`  --layout=${LAYOUT_ENGINES.join('|')}`);
    console.log('           (default: dot)');
    console.log(`  --format=${OUTPUT_FORMATS.join('|')}`);
    console.log('           (default: svg)');
    console.log('  --stdin    Read DOT code from stdin');
    console.log('');
    console.log('Layout Engines:');
    console.log('  dot       - Hierarchical/directed graphs (default)');
    console.log('  neato     - Spring model / undirected graphs');
    console.log('  fdp       - Force-directed placement');
    console.log('  circo     - Circular layout');
    console.log('  twopi     - Radial layout');
    console.log('  osage     - Clustered layout');
    console.log('  patchwork - Rectangular treemap');
    console.log('');
    console.log('Examples:');
    console.log('  render-dot.js diagram.dot output.svg');
    console.log('  render-dot.js diagram.dot output.svg --layout=neato');
    console.log('  echo "digraph { A -> B }" | render-dot.js --stdin output.svg');
    process.exit(1);
  }

  let dotCode;
  let outputPath;
  let layout = 'dot';
  let format = 'svg';

  // Parse arguments
  const flags = args.filter(a => a.startsWith('--'));
  const positional = args.filter(a => !a.startsWith('--'));

  for (const flag of flags) {
    if (flag.startsWith('--layout=')) {
      layout = flag.split('=')[1];
    } else if (flag.startsWith('--format=')) {
      format = flag.split('=')[1];
    }
  }

  const useStdin = flags.includes('--stdin');

  if (useStdin) {
    // Read from stdin
    dotCode = await new Promise((resolve) => {
      let data = '';
      process.stdin.setEncoding('utf8');
      process.stdin.on('data', chunk => data += chunk);
      process.stdin.on('end', () => resolve(data));
    });
    outputPath = positional[0];
  } else {
    const inputPath = positional[0];
    outputPath = positional[1] || inputPath.replace(/\.(dot|gv|graphviz)$/, '.svg');

    try {
      dotCode = await fs.readFile(inputPath, 'utf-8');
    } catch (e) {
      // Treat as inline DOT code
      dotCode = inputPath;
      outputPath = positional[1] || 'diagram.svg';
    }
  }

  if (!outputPath) {
    outputPath = 'diagram.svg';
  }

  // Ensure correct extension for format
  if (format !== 'svg' && outputPath.endsWith('.svg')) {
    outputPath = outputPath.replace('.svg', `.${format === 'dot_json' || format === 'xdot_json' ? 'json' : format}`);
  }

  console.error(`Rendering DOT diagram to ${outputPath} (layout: ${layout}, format: ${format})...`);

  try {
    const output = await renderDotToSVG(dotCode, { layout, format });
    await saveOutput(output, outputPath);
    console.log(outputPath);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { renderDotToSVG, saveOutput, LAYOUT_ENGINES, OUTPUT_FORMATS };
