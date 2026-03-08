#!/usr/bin/env node
const fs = require('fs').promises;
const path = require('path');
const { Marked } = require('marked');
const hljs = require('highlight.js');
const { gfmHeadingId } = require('marked-gfm-heading-id');
const { glob } = require('glob');

/**
 * Custom renderer to handle mermaid code blocks and images
 * - Mermaid blocks: wrapped in <pre class="mermaid"> for client-side rendering
 * - Images: rendered with width attribute for consistent sizing
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
      max-height: 80vh;
      height: auto;
      display: block;
      object-fit: contain;
    }

    .svg-container {
      text-align: center;
      margin: 1em 0;
    }

    .svg-container svg,
    .embedded-svg {
      max-width: 100%;
      max-height: 80vh;
      height: auto;
      display: block;
      margin: 0 auto;
    }

    a.image-link {
      display: block;
      cursor: zoom-in;
    }

    a.image-link:hover img {
      opacity: 0.9;
      outline: 2px solid var(--color-link);
      outline-offset: 2px;
    }

    /* Pan/zoom viewer overlay */
    .image-viewer {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.9);
      z-index: 9999;
      overflow: hidden;
      user-select: none;
      -webkit-user-select: none;
    }

    .image-viewer.active {
      display: block;
    }

    .image-viewer .viewer-canvas {
      width: 100%;
      height: 100%;
      cursor: grab;
      overflow: hidden;
      position: relative;
    }

    .image-viewer .viewer-canvas.dragging {
      cursor: grabbing;
    }

    .image-viewer img {
      position: absolute;
      transform-origin: 0 0;
      max-width: none;
      max-height: none;
    }

    .image-viewer .viewer-controls {
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 8px;
      background: rgba(0,0,0,0.7);
      border-radius: 8px;
      padding: 8px 12px;
      z-index: 10000;
    }

    .image-viewer .viewer-controls button {
      background: rgba(255,255,255,0.15);
      border: 1px solid rgba(255,255,255,0.3);
      color: #fff;
      width: 36px;
      height: 36px;
      border-radius: 6px;
      font-size: 18px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.15s;
    }

    .image-viewer .viewer-controls button:hover {
      background: rgba(255,255,255,0.3);
    }

    .image-viewer .viewer-zoom-label {
      color: rgba(255,255,255,0.8);
      font-size: 13px;
      line-height: 36px;
      min-width: 50px;
      text-align: center;
      font-family: var(--font-mono);
    }

    .image-viewer .viewer-close {
      position: fixed;
      top: 16px;
      right: 16px;
      background: rgba(0,0,0,0.6);
      border: 1px solid rgba(255,255,255,0.3);
      color: #fff;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      font-size: 22px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      transition: background 0.15s;
    }

    .image-viewer .viewer-close:hover {
      background: rgba(255,255,255,0.2);
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

  <!-- Pan/zoom image viewer -->
  <div class="image-viewer" id="imageViewer">
    <button class="viewer-close" onclick="closeViewer()" title="Close (Esc)">&#215;</button>
    <div class="viewer-canvas" id="viewerCanvas">
      <img id="viewerImg" src="" alt="Full size image" draggable="false">
    </div>
    <div class="viewer-controls">
      <button onclick="viewerZoom(-1)" title="Zoom out (-)">&#8722;</button>
      <button onclick="viewerReset()" title="Fit to screen (0)">Fit</button>
      <span class="viewer-zoom-label" id="viewerZoomLabel">100%</span>
      <button onclick="viewerZoom(1)" title="Zoom in (+)">+</button>
      <button onclick="viewerSetZoom(1)" title="Actual size (1)">1:1</button>
    </div>
  </div>

  <script>
    (function() {
      var viewer = document.getElementById('imageViewer');
      var canvas = document.getElementById('viewerCanvas');
      var img = document.getElementById('viewerImg');
      var label = document.getElementById('viewerZoomLabel');
      var scale = 1, panX = 0, panY = 0;
      var isDragging = false, startX = 0, startY = 0, startPanX = 0, startPanY = 0;
      var natW = 0, natH = 0;

      function updateTransform() {
        img.style.transform = 'translate(' + panX + 'px,' + panY + 'px) scale(' + scale + ')';
        label.textContent = Math.round(scale * 100) + '%';
      }

      window.openLightbox = function(src) {
        img.src = src;
        viewer.classList.add('active');
        document.body.style.overflow = 'hidden';
        img.onload = function() {
          natW = img.naturalWidth;
          natH = img.naturalHeight;
          viewerReset();
        };
        if (img.complete && img.naturalWidth) {
          natW = img.naturalWidth;
          natH = img.naturalHeight;
          viewerReset();
        }
      };

      window.closeViewer = function() {
        viewer.classList.remove('active');
        document.body.style.overflow = '';
      };

      window.viewerReset = function() {
        var vw = canvas.clientWidth, vh = canvas.clientHeight;
        var fitScale = Math.min(vw / natW, vh / natH, 1) * 0.95;
        scale = fitScale;
        panX = (vw - natW * scale) / 2;
        panY = (vh - natH * scale) / 2;
        updateTransform();
      };

      window.viewerZoom = function(dir) {
        var cx = canvas.clientWidth / 2, cy = canvas.clientHeight / 2;
        var factor = dir > 0 ? 1.25 : 0.8;
        var newScale = Math.min(Math.max(scale * factor, 0.05), 20);
        panX = cx - (cx - panX) * (newScale / scale);
        panY = cy - (cy - panY) * (newScale / scale);
        scale = newScale;
        updateTransform();
      };

      window.viewerSetZoom = function(z) {
        var cx = canvas.clientWidth / 2, cy = canvas.clientHeight / 2;
        panX = cx - (cx - panX) * (z / scale);
        panY = cy - (cy - panY) * (z / scale);
        scale = z;
        updateTransform();
      };

      // Mouse drag to pan
      canvas.addEventListener('mousedown', function(e) {
        if (e.button !== 0) return;
        isDragging = true;
        startX = e.clientX; startY = e.clientY;
        startPanX = panX; startPanY = panY;
        canvas.classList.add('dragging');
        e.preventDefault();
      });

      window.addEventListener('mousemove', function(e) {
        if (!isDragging) return;
        panX = startPanX + (e.clientX - startX);
        panY = startPanY + (e.clientY - startY);
        updateTransform();
      });

      window.addEventListener('mouseup', function() {
        isDragging = false;
        canvas.classList.remove('dragging');
      });

      // Scroll wheel to zoom, centered on cursor
      canvas.addEventListener('wheel', function(e) {
        e.preventDefault();
        var rect = canvas.getBoundingClientRect();
        var mx = e.clientX - rect.left, my = e.clientY - rect.top;
        var factor = e.deltaY < 0 ? 1.15 : 0.87;
        var newScale = Math.min(Math.max(scale * factor, 0.05), 20);
        panX = mx - (mx - panX) * (newScale / scale);
        panY = my - (my - panY) * (newScale / scale);
        scale = newScale;
        updateTransform();
      }, { passive: false });

      // Touch: pinch-zoom and pan
      var lastTouches = null;
      canvas.addEventListener('touchstart', function(e) {
        if (e.touches.length === 1) {
          isDragging = true;
          startX = e.touches[0].clientX; startY = e.touches[0].clientY;
          startPanX = panX; startPanY = panY;
        }
        lastTouches = Array.from(e.touches);
        e.preventDefault();
      }, { passive: false });

      canvas.addEventListener('touchmove', function(e) {
        if (e.touches.length === 1 && isDragging) {
          panX = startPanX + (e.touches[0].clientX - startX);
          panY = startPanY + (e.touches[0].clientY - startY);
          updateTransform();
        } else if (e.touches.length === 2 && lastTouches && lastTouches.length === 2) {
          var oldDist = Math.hypot(lastTouches[0].clientX - lastTouches[1].clientX, lastTouches[0].clientY - lastTouches[1].clientY);
          var newDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
          var factor = newDist / oldDist;
          var mx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
          var my = (e.touches[0].clientY + e.touches[1].clientY) / 2;
          var rect = canvas.getBoundingClientRect();
          mx -= rect.left; my -= rect.top;
          var newScale = Math.min(Math.max(scale * factor, 0.05), 20);
          panX = mx - (mx - panX) * (newScale / scale);
          panY = my - (my - panY) * (newScale / scale);
          scale = newScale;
          updateTransform();
          lastTouches = Array.from(e.touches);
        }
        e.preventDefault();
      }, { passive: false });

      canvas.addEventListener('touchend', function() {
        isDragging = false;
        lastTouches = null;
      });

      // Keyboard shortcuts
      document.addEventListener('keydown', function(e) {
        if (!viewer.classList.contains('active')) return;
        if (e.key === 'Escape') closeViewer();
        else if (e.key === '+' || e.key === '=') viewerZoom(1);
        else if (e.key === '-') viewerZoom(-1);
        else if (e.key === '0') viewerReset();
        else if (e.key === '1') viewerSetZoom(1);
      });

      // Double-click toggles between fit and 1:1
      canvas.addEventListener('dblclick', function() {
        if (Math.abs(scale - 1) < 0.01) viewerReset();
        else viewerSetZoom(1);
      });
    })();
  </script>

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
 * Convert .md links to .html links in HTML content
 * Handles both relative and absolute paths
 */
function convertMdLinksToHtml(htmlContent) {
  // Match href attributes pointing to .md files
  // Captures: href="path/to/file.md" or href='path/to/file.md'
  // Preserves anchors: href="file.md#section" → href="file.html#section"
  return htmlContent.replace(
    /href=(["'])((?:\.\.?\/)?[^"']*?)\.md(#[^"']*)?(\1)/gi,
    'href=$1$2.html$3$4'
  );
}

/**
 * Wrap images in clickable links that open in a lightbox overlay.
 * Uses onclick to display a full-size lightbox instead of opening a new tab,
 * which avoids the blank-tab problem with base64 data URIs.
 */
function makeImagesClickable(htmlContent) {
  // Match <img> tags and wrap in a link that triggers the lightbox
  return htmlContent.replace(
    /<img\s+([^>]*src=(["'])([^"']+)\2[^>]*)>/gi,
    '<a href="javascript:void(0)" onclick="openLightbox(this.querySelector(\'img\').src)" title="Click to view full size" class="image-link"><img $1></a>'
  );
}

/**
 * Remove <p> wrapper from standalone images
 * Markdown converts ![alt](src) to <p><img ...></p>, which can cause rendering issues
 * After makeImagesClickable, this becomes <p><a class="image-link"><img></a></p>
 * This function unwraps such images so they render as block-level elements
 */
function unwrapStandaloneImages(htmlContent) {
  // Match <p> tags that contain only whitespace and an image link
  // Handles: <p><a class="image-link"...><img ...></a></p>
  return htmlContent.replace(
    /<p>\s*(<a[^>]*class="image-link"[^>]*><img[^>]*><\/a>)\s*<\/p>/gi,
    '$1'
  );
}

/**
 * Extract all image paths from HTML content
 */
function extractImagePaths(htmlContent) {
  const paths = [];
  const regex = /src=(["'])([^"']+\.(png|svg|jpg|jpeg|gif|webp))\1/gi;
  let match;
  while ((match = regex.exec(htmlContent)) !== null) {
    paths.push(match[2]);
  }
  return [...new Set(paths)]; // Remove duplicates
}

/**
 * Read SVG file and prepare for inline embedding
 * - Ensures xmlns is present
 * - Removes XML declaration if present
 * - Preserves width/height/viewBox attributes
 */
async function readSvgForInline(svgPath) {
  let svgContent = await fs.readFile(svgPath, 'utf-8');

  // Remove XML declaration if present
  svgContent = svgContent.replace(/<\?xml[^?]*\?>\s*/gi, '');

  // Remove DOCTYPE if present
  svgContent = svgContent.replace(/<!DOCTYPE[^>]*>\s*/gi, '');

  // Ensure xmlns is present
  if (!svgContent.includes('xmlns=')) {
    svgContent = svgContent.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
  }

  // Add class for styling
  svgContent = svgContent.replace('<svg', '<svg class="embedded-svg"');

  return svgContent.trim();
}

/**
 * Convert raster image to base64 data URI
 */
async function imageToBase64DataUri(imagePath) {
  const ext = path.extname(imagePath).toLowerCase().slice(1);
  const mimeTypes = {
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'webp': 'image/webp'
  };

  const mimeType = mimeTypes[ext] || 'application/octet-stream';
  const imageBuffer = await fs.readFile(imagePath);
  const base64 = imageBuffer.toString('base64');

  return `data:${mimeType};base64,${base64}`;
}

/**
 * Extract width/height style from img tag attributes
 */
function extractImageDimensions(imgTag) {
  const widthMatch = imgTag.match(/width\s*=\s*["']?(\d+(?:px|%)?)/i);
  const heightMatch = imgTag.match(/height\s*=\s*["']?(\d+(?:px|%)?)/i);
  const styleMatch = imgTag.match(/style\s*=\s*["']([^"']+)["']/i);

  let style = '';
  if (widthMatch) {
    const width = widthMatch[1].includes('%') || widthMatch[1].includes('px')
      ? widthMatch[1]
      : `${widthMatch[1]}px`;
    style += `max-width: ${width}; `;
  }
  if (heightMatch) {
    const height = heightMatch[1].includes('%') || heightMatch[1].includes('px')
      ? heightMatch[1]
      : `${heightMatch[1]}px`;
    style += `height: ${height}; `;
  }
  if (styleMatch) {
    style += styleMatch[1];
  }

  return style.trim();
}

/**
 * Embed images inline in HTML content
 * - SVGs: embedded as inline <svg> elements
 * - Raster images: converted to base64 data URIs
 * Also copies images to export folder for the click-to-open links
 */
async function embedImagesInline(htmlContent, inputDir, htmlDir) {
  const imagePaths = extractImagePaths(htmlContent);
  let updatedContent = htmlContent;

  for (const imgPath of imagePaths) {
    // Resolve source path relative to input markdown
    const sourcePath = path.resolve(inputDir, imgPath);

    // Check if source exists
    try {
      await fs.access(sourcePath);
    } catch {
      console.error(`  Warning: Image not found: ${sourcePath}`);
      continue;
    }

    const ext = path.extname(imgPath).toLowerCase();

    if (ext === '.svg') {
      // Read SVG content for inline embedding
      const svgContent = await readSvgForInline(sourcePath);

      // Find the img tag and its wrapper link, replace with inline SVG
      // Pattern: <a ... class="image-link" ...><img src="path.svg" ...></a>
      const imgPattern = new RegExp(
        `<a[^>]*class=["']image-link["'][^>]*>\\s*<img[^>]*src=["']${escapeRegExp(imgPath)}["'][^>]*>\\s*</a>`,
        'gi'
      );

      // Also match href-first ordering (legacy)
      const imgPattern2 = new RegExp(
        `<a[^>]*href=["'][^"']*["'][^>]*class=["']image-link["'][^>]*>\\s*<img[^>]*src=["']${escapeRegExp(imgPath)}["'][^>]*>\\s*</a>`,
        'gi'
      );

      // Create wrapper with collapsible source option
      const inlineSvgHtml = `<div class="svg-container">${svgContent}</div>`;

      updatedContent = updatedContent.replace(imgPattern, inlineSvgHtml);
      updatedContent = updatedContent.replace(imgPattern2, inlineSvgHtml);

      // Also handle standalone img tags (without wrapper)
      const standaloneImgPattern = new RegExp(
        `<img[^>]*src=["']${escapeRegExp(imgPath)}["'][^>]*>`,
        'gi'
      );
      updatedContent = updatedContent.replace(standaloneImgPattern, inlineSvgHtml);

    } else {
      // Raster image: convert to base64 data URI
      const dataUri = await imageToBase64DataUri(sourcePath);

      // Replace src attribute with data URI
      const srcPattern = new RegExp(`src=(["'])${escapeRegExp(imgPath)}\\1`, 'gi');
      updatedContent = updatedContent.replace(srcPattern, `src=$1${dataUri}$1`);
    }

    // Still copy to export folder for reference/debugging
    const destPath = path.join(htmlDir, imgPath);
    await fs.mkdir(path.dirname(destPath), { recursive: true });
    await fs.copyFile(sourcePath, destPath);
  }

  return updatedContent;
}

/**
 * Escape special regex characters in a string
 */
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Legacy function - Copy images to export folder (for backward compatibility)
 * @deprecated Use embedImagesInline instead
 */
async function copyImagesToExport(htmlContent, inputDir, htmlDir) {
  // Now just calls embedImagesInline for inline embedding
  return embedImagesInline(htmlContent, inputDir, htmlDir);
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
 * Copy diagrams directory from source to export/html so relative paths resolve
 * for both HTML click-through links and PDF rendering
 */
async function copyDiagramsDir(inputDir, htmlDir, verbose = false) {
  const diagramsSource = path.join(inputDir, 'diagrams');
  try {
    await fs.access(diagramsSource);
  } catch {
    return; // No diagrams directory, nothing to copy
  }

  async function copyRecursive(src, dest) {
    const stat = await fs.stat(src);
    if (stat.isDirectory()) {
      await fs.mkdir(dest, { recursive: true });
      const entries = await fs.readdir(src);
      for (const entry of entries) {
        await copyRecursive(path.join(src, entry), path.join(dest, entry));
      }
    } else {
      // Only copy image files
      const ext = path.extname(src).toLowerCase();
      if (['.png', '.svg', '.jpg', '.jpeg', '.gif', '.webp'].includes(ext)) {
        await fs.mkdir(path.dirname(dest), { recursive: true });
        await fs.copyFile(src, dest);
      }
    }
  }

  const destDiagrams = path.join(htmlDir, 'diagrams');
  await copyRecursive(diagramsSource, destDiagrams);

  if (verbose) {
    console.error(`  Copied diagrams/ to ${destDiagrams}`);
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
  let bodyContent = marked.parse(markdown);

  // Convert .md links to .html links for proper navigation in exported HTML
  bodyContent = convertMdLinksToHtml(bodyContent);

  // Make images clickable to open full-size in new tab
  bodyContent = makeImagesClickable(bodyContent);

  // Remove <p> wrapper from standalone images (markdown ![](path) syntax)
  bodyContent = unwrapStandaloneImages(bodyContent);

  const results = {
    input: absoluteInput,
    html: null,
    pdf: null
  };

  // Always embed images and copy diagrams to html export folder
  // so both HTML and PDF can reference them
  await fs.mkdir(htmlDir, { recursive: true });
  const embeddedBody = await embedImagesInline(bodyContent, inputDir, htmlDir);

  // Also copy the full diagrams directory structure to html export folder
  // so relative image paths resolve correctly for PDF rendering
  await copyDiagramsDir(inputDir, htmlDir, verbose);

  // Generate HTML if requested
  if (format === 'html' || format === 'both') {
    const html = generateHTML(baseName, embeddedBody, { theme, forPdf: false });
    await fs.writeFile(htmlPath, html, 'utf-8');
    results.html = htmlPath;

    if (verbose) {
      console.error(`Created HTML: ${htmlPath} (images embedded inline)`);
    }
  }

  // Generate PDF if requested
  if (format === 'pdf' || format === 'both') {
    // Generate temporary HTML for PDF with embedded images + PDF-ready script
    const pdfHtml = generateHTML(baseName, embeddedBody, { theme, forPdf: true });
    const tempPdfHtmlPath = path.join(htmlDir, `${baseName}__pdf_temp.html`);
    await fs.writeFile(tempPdfHtmlPath, pdfHtml, 'utf-8');

    // Generate PDF from the temp HTML
    await fs.mkdir(pdfDir, { recursive: true });
    await generatePDF(tempPdfHtmlPath, pdfPath, { verbose });
    results.pdf = pdfPath;

    // Clean up temp file
    await fs.unlink(tempPdfHtmlPath).catch(() => {});

    // Ensure final HTML (if requested) is the clean version without PDF script
    if (format === 'both') {
      const html = generateHTML(baseName, embeddedBody, { theme, forPdf: false });
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
