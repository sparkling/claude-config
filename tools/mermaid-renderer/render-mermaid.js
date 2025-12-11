#!/usr/bin/env node
const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

/**
 * Renders a Mermaid diagram to SVG
 * @param {string} diagramCode - Mermaid diagram code
 * @param {object} options - Rendering options
 * @returns {Promise<string>} SVG string
 */
async function renderMermaidToSVG(diagramCode, options = {}) {
  const {
    theme = 'default',
    backgroundColor = 'transparent',
    width = 1920,
    height = 1080
  } = options;

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width, height });

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            margin: 0;
            padding: 20px;
            background: ${backgroundColor};
            display: flex;
            justify-content: center;
            align-items: flex-start;
          }
          .mermaid {
            display: inline-block;
          }
        </style>
      </head>
      <body>
        <pre class="mermaid">
${diagramCode}
        </pre>

        <script type="module">
          import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';
          import elkLayouts from 'https://cdn.jsdelivr.net/npm/@mermaid-js/layout-elk@0/dist/mermaid-layout-elk.esm.min.mjs';

          mermaid.registerLayoutLoaders(elkLayouts);

          mermaid.initialize({
            startOnLoad: true,
            theme: '${theme}'
          });

          // Signal when rendering is complete
          window.mermaidReady = new Promise((resolve) => {
            const observer = new MutationObserver(() => {
              const svg = document.querySelector('svg');
              if (svg) {
                observer.disconnect();
                setTimeout(resolve, 100);
              }
            });
            observer.observe(document.body, { childList: true, subtree: true });
          });
        </script>
      </body>
      </html>
    `;

    await page.setContent(html, { waitUntil: 'networkidle0' });
    await page.waitForSelector('svg', { timeout: 15000 });
    await page.evaluate(() => window.mermaidReady);
    await new Promise(r => setTimeout(r, 300));

    // Extract and clean up SVG
    const svg = await page.evaluate(() => {
      const svgEl = document.querySelector('svg');
      if (!svgEl) return null;

      // Get bounding box for proper sizing
      const bbox = svgEl.getBBox();
      const padding = 20;
      const finalWidth = Math.ceil(bbox.width + padding * 2);
      const finalHeight = Math.ceil(bbox.height + padding * 2);

      // Set viewBox and dimensions for responsive scaling
      svgEl.setAttribute('viewBox', `${bbox.x - padding} ${bbox.y - padding} ${finalWidth} ${finalHeight}`);
      svgEl.setAttribute('width', '100%');
      svgEl.setAttribute('height', 'auto');
      svgEl.style.maxWidth = `${finalWidth}px`;

      return svgEl.outerHTML;
    });

    if (!svg) {
      throw new Error('Failed to render SVG');
    }

    return svg;

  } finally {
    await browser.close();
  }
}

/**
 * Save SVG to file
 */
async function saveSVG(svgContent, outputPath) {
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, svgContent, 'utf-8');
  return outputPath;
}

/**
 * Renders a Mermaid diagram to PNG
 * @param {string} diagramCode - Mermaid diagram code
 * @param {object} options - Rendering options
 * @returns {Promise<Buffer>} PNG buffer
 */
async function renderMermaidToPNG(diagramCode, options = {}) {
  const {
    theme = 'default',
    backgroundColor = 'white',
    width = 3200,
    height = 2400,
    scale = 4
  } = options;

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width, height, deviceScaleFactor: scale });

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            margin: 0;
            padding: 20px;
            background: ${backgroundColor};
            display: flex;
            justify-content: center;
            align-items: flex-start;
          }
          .mermaid {
            display: inline-block;
          }
        </style>
      </head>
      <body>
        <pre class="mermaid">
${diagramCode}
        </pre>

        <script type="module">
          import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';
          import elkLayouts from 'https://cdn.jsdelivr.net/npm/@mermaid-js/layout-elk@0/dist/mermaid-layout-elk.esm.min.mjs';

          mermaid.registerLayoutLoaders(elkLayouts);

          mermaid.initialize({
            startOnLoad: true,
            theme: '${theme}'
          });

          // Signal when rendering is complete
          window.mermaidReady = new Promise((resolve) => {
            const observer = new MutationObserver(() => {
              const svg = document.querySelector('svg');
              if (svg) {
                observer.disconnect();
                setTimeout(resolve, 100);
              }
            });
            observer.observe(document.body, { childList: true, subtree: true });
          });
        </script>
      </body>
      </html>
    `;

    await page.setContent(html, { waitUntil: 'networkidle0' });
    await page.waitForSelector('svg', { timeout: 15000 });
    await page.evaluate(() => window.mermaidReady);
    await new Promise(r => setTimeout(r, 300));

    // Get SVG bounding box and take screenshot of just that area
    const clip = await page.evaluate(() => {
      const svgEl = document.querySelector('svg');
      if (!svgEl) return null;
      const bbox = svgEl.getBoundingClientRect();
      return {
        x: Math.max(0, bbox.x - 10),
        y: Math.max(0, bbox.y - 10),
        width: bbox.width + 20,
        height: bbox.height + 20
      };
    });

    if (!clip) {
      throw new Error('Failed to render diagram');
    }

    const pngBuffer = await page.screenshot({
      type: 'png',
      clip: clip,
      omitBackground: false
    });

    return pngBuffer;

  } finally {
    await browser.close();
  }
}

/**
 * Save PNG to file
 */
async function savePNG(pngBuffer, outputPath) {
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, pngBuffer);
  return outputPath;
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.log('Usage: render-mermaid.js <diagram-code-or-file> [output.svg] [--theme=<theme>]');
    console.log('');
    console.log('Options:');
    console.log('  --theme=default|forest|dark|neutral');
    console.log('  --stdin    Read diagram from stdin');
    console.log('');
    console.log('Examples:');
    console.log('  render-mermaid.js diagram.mmd output.svg');
    console.log('  echo "flowchart TD; A-->B" | render-mermaid.js --stdin output.svg');
    process.exit(1);
  }

  let diagramCode;
  let outputPath;
  let theme = 'default';

  // Parse arguments
  const flags = args.filter(a => a.startsWith('--'));
  const positional = args.filter(a => !a.startsWith('--'));

  for (const flag of flags) {
    if (flag.startsWith('--theme=')) {
      theme = flag.split('=')[1];
    }
  }

  const useStdin = flags.includes('--stdin');

  if (useStdin) {
    // Read from stdin
    diagramCode = await new Promise((resolve) => {
      let data = '';
      process.stdin.setEncoding('utf8');
      process.stdin.on('data', chunk => data += chunk);
      process.stdin.on('end', () => resolve(data));
    });
    outputPath = positional[0];
  } else {
    const inputPath = positional[0];
    outputPath = positional[1] || inputPath.replace(/\.(mmd|mermaid)$/, '.svg');

    try {
      diagramCode = await fs.readFile(inputPath, 'utf-8');
    } catch (e) {
      // Treat as inline diagram code
      diagramCode = inputPath;
      outputPath = positional[1] || 'diagram.svg';
    }
  }

  if (!outputPath) {
    outputPath = 'diagram.svg';
  }

  console.error(`Rendering diagram to ${outputPath}...`);

  try {
    const svg = await renderMermaidToSVG(diagramCode, { theme });
    await saveSVG(svg, outputPath);
    console.log(outputPath);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { renderMermaidToSVG, saveSVG, renderMermaidToPNG, savePNG };
