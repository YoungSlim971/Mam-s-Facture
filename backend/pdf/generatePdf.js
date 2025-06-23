const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function generatePdf(html) {
  console.log('HTML source reçu:', html);
  let browser;
  try {
    try {
      browser = await puppeteer.launch();
    } catch (initialErr) {
      console.warn('Default launch failed, retrying with sandbox disabled:', initialErr.message);
      browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    }

    const outputDir = path.join(__dirname, 'output');
    try {
      fs.mkdirSync(outputDir, { recursive: true });
      fs.accessSync(outputDir, fs.constants.W_OK);
    } catch (dirErr) {
      console.warn('Write access check failed for', outputDir, dirErr.message);
    }

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({ format: 'A4' });
    await browser.close();
    return pdfBuffer;
  } catch (err) {
    if (browser) await browser.close();
    console.error('PDF generation error:', err);
    throw err;
  }
}

module.exports = generatePdf;
