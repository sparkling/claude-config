#!/usr/bin/env node
const fs = require('fs').promises;
const path = require('path');
const { Marked } = require('marked');
const hljs = require('highlight.js');
const { gfmHeadingId } = require('marked-gfm-heading-id');
const { glob } = require('glob');

/**
 * Custom renderer to handle mermaid code blocks
 * Instead of syntax highlighting, wraps them in <pre class="mermaid">
 */
function createMarkedInstance() {
  const marked = new Marked(
    gfmHeadingId()
  );

  const renderer = {
    code(token) {
      const code = token.text;
      const language = token.lang || '';

      // Handle mermaid blocks specially - render client-side
      if (language === 'mermaid') {
        return `<pre class="mermaid">\n${code}\n</pre>\n`;
      }

      // Regular code blocks with syntax highlighting
      let highlighted;
      if (language && hljs.getLanguage(language)) {
        try {
          highlighted = hljs.highlight(code, { language }).value;
        } catch (err) {
          highlighted = escapeHtml(code);
        }
      } else {
        highlighted = escapeHtml(code);
      }

      const langClass = language ? ` language-${language}` : '';
      return `<pre><code class="hljs${langClass}">${highlighted}</code></pre>\n`;
    }
  };

  marked.use({ renderer });
  return marked;
}

/**
 * Generate HTML template with Mermaid support (including ELK layout)
 */
function generateHTML(title, bodyContent, options = {}) {
  const {
    theme = 'default',
    forPdf = false
  } = options;

  // For PDF, we need to wait for mermaid to render before signaling ready
  const pdfReadyScript = forPdf ? `
    // Signal when mermaid is done rendering
    window.addEventListener('load', async () => {
      // Wait a bit for mermaid to initialize and render
      await new Promise(resolve => setTimeout(resolve, 2000));
      window.mermaidRendered = true;
    });
  ` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>

  <!-- Highlight.js for code syntax highlighting -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/highlight.js@11.9.0/styles/github.min.css">

  <style>
    :root {
      --max-width: 900px;
      --font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      --font-mono: 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace;
      --color-text: #24292f;
      --color-bg: #ffffff;
      --color-border: #d0d7de;
      --color-link: #0969da;
      --color-code-bg: #f6f8fa;
    }

    * {
      box-sizing: border-box;
    }

    body {
      font-family: var(--font-sans);
      font-size: 16px;
      line-height: 1.6;
      color: var(--color-text);
      background: var(--color-bg);
      margin: 0;
      padding: 2rem;
    }

    .container {
      max-width: var(--max-width);
      margin: 0 auto;
    }

    h1, h2, h3, h4, h5, h6 {
      margin-top: 1.5em;
      margin-bottom: 0.5em;
      font-weight: 600;
      line-height: 1.25;
    }

    h1 { font-size: 2em; border-bottom: 1px solid var(--color-border); padding-bottom: 0.3em; }
    h2 { font-size: 1.5em; border-bottom: 1px solid var(--color-border); padding-bottom: 0.3em; }
    h3 { font-size: 1.25em; }

    a {
      color: var(--color-link);
      text-decoration: none;
    }

    a:hover {
      text-decoration: underline;
    }

    p {
      margin: 1em 0;
    }

    pre {
      background: var(--color-code-bg);
      border-radius: 6px;
      padding: 1rem;
      overflow-x: auto;
      font-family: var(--font-mono);
      font-size: 0.875em;
      line-height: 1.45;
    }

    pre.mermaid {
      background: transparent;
      padding: 1rem 0;
      text-align: center;
    }

    code {
      font-family: var(--font-mono);
      font-size: 0.875em;
    }

    :not(pre) > code {
      background: var(--color-code-bg);
      padding: 0.2em 0.4em;
      border-radius: 3px;
    }

    blockquote {
      margin: 1em 0;
      padding: 0 1em;
      border-left: 4px solid var(--color-border);
      color: #57606a;
    }

    table {
      border-collapse: collapse;
      width: 100%;
      margin: 1em 0;
    }

    th, td {
      border: 1px solid var(--color-border);
      padding: 0.5em 1em;
      text-align: left;
    }

    th {
      background: var(--color-code-bg);
      font-weight: 600;
    }

    img {
      max-width: 100%;
      height: auto;
    }

    ul, ol {
      margin: 1em 0;
      padding-left: 2em;
    }

    li {
      margin: 0.25em 0;
    }

    hr {
      border: none;
      border-top: 1px solid var(--color-border);
      margin: 2em 0;
    }

    details {
      margin: 1em 0;
      padding: 0.5em 1em;
      background: var(--color-code-bg);
      border-radius: 6px;
    }

    summary {
      cursor: pointer;
      font-weight: 500;
    }

    .mermaid svg {
      max-width: 100%;
      height: auto;
    }

    @media print {
      body {
        padding: 0;
      }
      .container {
        max-width: none;
      }
      pre {
        white-space: pre-wrap;
        word-wrap: break-word;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    ${bodyContent}
  </div>

  <!-- Mermaid with ELK layout support -->
  <script type="module">
    import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';
    import elkLayouts from 'https://cdn.jsdelivr.net/npm/@mermaid-js/layout-elk@0/dist/mermaid-layout-elk.esm.min.mjs';

    // Register ELK layout engine
    mermaid.registerLayoutLoaders(elkLayouts);

    mermaid.initialize({
      startOnLoad: true,
      theme: '${theme}',
      securityLevel: 'loose',
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true
      }
    });
    ${pdfReadyScript}
  </script>
</body>
</html>`;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Generate PDF from HTML using Puppeteer
 */
async function generatePDF(htmlPath, pdfPath, options = {}) {
  const { verbose = false } = options;

  // Dynamic import for puppeteer (may not be installed)
  let puppeteer;
  try {
    puppeteer = require('puppeteer');
  } catch (err) {
    throw new Error('Puppeteer not installed. Run: cd ~/.claude/tools/markdown-export && npm install');
  }

  if (verbose) {
    console.error(`Generating PDF: ${pdfPath}`);
  }

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();

    // Load the HTML file
    const htmlUrl = `file://${htmlPath}`;
    await page.goto(htmlUrl, { waitUntil: 'networkidle0' });

    // Wait for Mermaid diagrams to render
    // First wait for the mermaid library to load and process
    await page.waitForFunction(() => {
      const mermaidDivs = document.querySelectorAll('.mermaid');
      if (mermaidDivs.length === 0) return true; // No diagrams to wait for

      // Check if all mermaid divs have been processed (contain SVG)
      return Array.from(mermaidDivs).every(div => div.querySelector('svg'));
    }, { timeout: 30000 });

    // Additional wait to ensure rendering is complete
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Generate PDF
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      },
      printBackground: true,
      displayHeaderFooter: false
    });

    if (verbose) {
      console.error(`Created PDF: ${pdfPath}`);
    }

  } finally {
    await browser.close();
  }
}

/**
 * Convert a markdown file to HTML and/or PDF
 */
async function convertFile(inputPath, options = {}) {
  const {
    format = 'both', // 'html', 'pdf', or 'both'
    theme = 'default',
    verbose = false
  } = options;

  const absoluteInput = path.resolve(inputPath);
  const inputDir = path.dirname(absoluteInput);
  const baseName = path.basename(absoluteInput, path.extname(absoluteInput));

  // Output to export/html and export/pdf folders
  const exportDir = path.join(inputDir, 'export');
  const htmlDir = path.join(exportDir, 'html');
  const pdfDir = path.join(exportDir, 'pdf');

  const htmlPath = path.join(htmlDir, `${baseName}.html`);
  const pdfPath = path.join(pdfDir, `${baseName}.pdf`);

  if (verbose) {
    console.error(`Converting: ${absoluteInput}`);
  }

  // Read markdown content
  const markdown = await fs.readFile(absoluteInput, 'utf-8');

  // Convert to HTML
  const marked = createMarkedInstance();
  const bodyContent = marked.parse(markdown);

  const results = {
    input: absoluteInput,
    html: null,
    pdf: null
  };

  // Generate HTML if requested
  if (format === 'html' || format === 'both') {
    const html = generateHTML(baseName, bodyContent, { theme, forPdf: false });
    await fs.mkdir(htmlDir, { recursive: true });
    await fs.writeFile(htmlPath, html, 'utf-8');
    results.html = htmlPath;

    if (verbose) {
      console.error(`Created HTML: ${htmlPath}`);
    }
  }

  // Generate PDF if requested
  if (format === 'pdf' || format === 'both') {
    // For PDF, we need to generate HTML first (temporarily if html not requested)
    let tempHtmlPath = htmlPath;
    let needsCleanup = false;

    if (format === 'pdf') {
      // Generate temporary HTML for PDF conversion
      const html = generateHTML(baseName, bodyContent, { theme, forPdf: true });
      await fs.mkdir(htmlDir, { recursive: true });
      await fs.writeFile(htmlPath, html, 'utf-8');
      needsCleanup = true;
    } else {
      // Regenerate HTML with PDF-ready script
      const html = generateHTML(baseName, bodyContent, { theme, forPdf: true });
      await fs.writeFile(htmlPath, html, 'utf-8');
    }

    // Generate PDF
    await fs.mkdir(pdfDir, { recursive: true });
    await generatePDF(htmlPath, pdfPath, { verbose });
    results.pdf = pdfPath;

    // If only PDF was requested, we can optionally clean up HTML
    // But let's keep it for debugging purposes
    if (format === 'pdf' && !needsCleanup) {
      // Restore HTML without PDF script
      const html = generateHTML(baseName, bodyContent, { theme, forPdf: false });
      await fs.writeFile(htmlPath, html, 'utf-8');
    }

    // If we want both, regenerate HTML without the PDF wait script
    if (format === 'both') {
      const html = generateHTML(baseName, bodyContent, { theme, forPdf: false });
      await fs.writeFile(htmlPath, html, 'utf-8');
    }
  }

  return results;
}

/**
 * Process multiple files matching a glob pattern
 */
async function convertGlob(pattern, options = {}) {
  const { verbose = false } = options;

  const files = await glob(pattern, { nodir: true });

  if (files.length === 0) {
    console.error(`No files found matching: ${pattern}`);
    return [];
  }

  if (verbose) {
    console.error(`Found ${files.length} file(s) matching: ${pattern}`);
  }

  const results = [];
  for (const file of files) {
    try {
      const result = await convertFile(file, options);
      results.push(result);
    } catch (err) {
      console.error(`Error converting ${file}: ${err.message}`);
    }
  }

  return results;
}

// CLI
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.log('Usage: convert.js <file-or-pattern> [options]');
    console.log('');
    console.log('Arguments:');
    console.log('  <file-or-pattern>   Markdown file or glob pattern (e.g., "docs/*.md")');
    console.log('');
    console.log('Options:');
    console.log('  --format=<fmt>      Output format: html, pdf, or both (default: both)');
    console.log('  --theme=<theme>     Mermaid theme (default|forest|dark|neutral)');
    console.log('  --verbose           Show detailed progress');
    console.log('');
    console.log('Output Structure:');
    console.log('  source-folder/');
    console.log('  ├── document.md');
    console.log('  └── export/');
    console.log('      ├── html/');
    console.log('      │   └── document.html');
    console.log('      └── pdf/');
    console.log('          └── document.pdf');
    console.log('');
    console.log('Features:');
    console.log('  - GitHub-flavored Markdown');
    console.log('  - Syntax highlighting with highlight.js');
    console.log('  - Mermaid diagrams with ELK layout support');
    console.log('  - PDF generation with rendered diagrams');
    console.log('');
    console.log('Examples:');
    console.log('  convert.js README.md --verbose');
    console.log('  convert.js README.md --format=pdf');
    console.log('  convert.js "docs/**/*.md" --format=html --theme=dark');
    process.exit(1);
  }

  const flags = args.filter(a => a.startsWith('--'));
  const positional = args.filter(a => !a.startsWith('--'));

  const options = {
    format: 'both',
    theme: 'default',
    verbose: false
  };

  for (const flag of flags) {
    if (flag.startsWith('--format=')) {
      options.format = flag.split('=')[1];
    } else if (flag.startsWith('--theme=')) {
      options.theme = flag.split('=')[1];
    } else if (flag === '--verbose') {
      options.verbose = true;
    }
  }

  // Validate format
  if (!['html', 'pdf', 'both'].includes(options.format)) {
    console.error(`Invalid format: ${options.format}. Use: html, pdf, or both`);
    process.exit(1);
  }

  const input = positional[0];

  try {
    let results;

    // Check if input contains glob characters
    if (input.includes('*') || input.includes('?')) {
      results = await convertGlob(input, options);
    } else {
      const result = await convertFile(input, options);
      results = [result];
    }

    // Output JSON result
    console.log(JSON.stringify({
      converted: results.length,
      format: options.format,
      files: results
    }, null, 2));

  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { convertFile, convertGlob, generateHTML, generatePDF };
