require('ts-node/register/transpile-only');
const fs = require('fs');
const path = require('path');
const Database = require('../database/storage');
const buildFactureHTML = require('../services/htmlService');

function usage() {
  console.log('Usage: node scripts/export-html.js <id> [output]');
}

async function main() {
  const id = process.argv[2];
  if (!id) {
    usage();
    process.exit(1);
  }

  const output = process.argv[3] || `facture-${id}.html`;

  const db = new Database();
  const facture = db.getFactureById(id);
  if (!facture) {
    console.error('Facture not found');
    process.exit(1);
  }

  try {
    const html = buildFactureHTML(facture);
    fs.writeFileSync(output, html, 'utf8');
    console.log(`Facture HTML écrite dans ${output}`);
  } catch (err) {
    console.error('Erreur lors de la génération du HTML:', err.message);
    process.exit(1);
  }
}

main();
