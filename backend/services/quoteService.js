const fs = require('fs');
const path = require('path');

function getRandomQuote() {
  const filePath = path.join(__dirname, '..', 'assets', 'data', 'citations_bien_etre.json');
  let content;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch {
    throw new Error('File not found');
  }
  let quotes;
  try {
    quotes = JSON.parse(content);
  } catch {
    throw new Error('Invalid JSON');
  }
  if (!Array.isArray(quotes) || quotes.length === 0) {
    throw new Error('No quotes available');
  }
  const selected = quotes[Math.floor(Math.random() * quotes.length)];
  let text = selected;
  let author = '';
  if (typeof selected === 'string') {
    const separator = ' – ';
    if (selected.includes(separator)) {
      [text, author] = selected.split(separator).map(s => s.trim());
    } else if (selected.includes(' - ')) {
      [text, author] = selected.split(' - ').map(s => s.trim());
    }
  }
  return { text, author };
}

module.exports = { getRandomQuote };
