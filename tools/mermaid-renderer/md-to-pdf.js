#!/usr/bin/env node
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function mdToPdf(mdPath, pdfPath) {
  const mdDir = path.dirname(mdPath);
  const htmlPath = '/tmp/temp-doc.html';
  
  // Convert markdown to HTML using pandoc with embedded resources
  execSync(`cd "${mdDir}" && pandoc "${mdPath}" -o "${htmlPath}" --standalone --embed-resources`, {
    encoding: 'utf-8'
  });
  
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  const htmlContent = fs.readFileSync(htmlPath, 'utf-8');
  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
  
  await page.pdf({
    path: pdfPath,
    format: 'A4',
    margin: { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' },
    printBackground: true
  });
  
  await browser.close();
  console.log(`PDF generated: ${pdfPath}`);
}

mdToPdf(process.argv[2], process.argv[3]);
