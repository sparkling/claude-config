const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function convertSvgToPng(svgPath, pngPath) {
  const svgContent = fs.readFileSync(svgPath, 'utf-8');

  // Extract viewBox dimensions
  const viewBoxMatch = svgContent.match(/viewBox="([^"]+)"/);
  let width = 1200, height = 800;
  if (viewBoxMatch) {
    const parts = viewBoxMatch[1].split(/\s+/).map(Number);
    width = parts[2] + 16;
    height = parts[3] + 16;
  }

  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  await page.setViewport({ width: Math.ceil(width), height: Math.ceil(height), deviceScaleFactor: 2 });

  const html = '<!DOCTYPE html><html><head><style>body { margin: 0; padding: 0; background: white; }</style></head><body>' + svgContent + '</body></html>';

  await page.setContent(html, { waitUntil: 'networkidle0' });
  await page.screenshot({ path: pngPath, fullPage: true });
  await browser.close();

  console.log('Converted: ' + path.basename(svgPath) + ' -> ' + path.basename(pngPath));
}

async function main() {
  const dir = process.argv[2];
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.svg'));

  for (const file of files) {
    const svgPath = path.join(dir, file);
    const pngPath = path.join(dir, file.replace('.svg', '.png'));
    await convertSvgToPng(svgPath, pngPath);
  }
}

main().catch(console.error);
