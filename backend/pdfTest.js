const fs = require('fs');
const path = require('path');
const buildFactureHTML = require('./services/htmlService');
const generatePdf = require('./pdf/generatePdf');

async function main() {
  try {
    const dataPath = path.join(__dirname, 'data', 'test-invoice.json');
    const facture = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    const html = buildFactureHTML(facture);
    const pdfBuffer = await generatePdf(html);
    fs.writeFileSync(path.join(__dirname, 'test-invoice.pdf'), pdfBuffer);
    console.log('PDF generated at', path.join(__dirname, 'test-invoice.pdf'));
  } catch (err) {
    console.error('PDF generation failed:', err);
  }
}

main();
