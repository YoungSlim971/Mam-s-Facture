const puppeteer = require('puppeteer');

async function generatePdf(html) {
  try {
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({ format: 'A4' });
    await browser.close();
    return pdfBuffer;
  } catch (err) {
    console.error('PDF generation error:', err);
    throw err;
  }
}

module.exports = generatePdf;
