const fs = require('fs')
const path = require('path')

const file = path.join(__dirname, '..', 'data', 'factures.json')
const factures = JSON.parse(fs.readFileSync(file, 'utf8'))

const updated = factures.map(f => ({
  title: f.title || `Facture #${f.id}`,
  status: f.status || 'unpaid',
  logo_path: f.logo_path || '',
  siren: f.siren || '',
  siret: f.siret || '',
  legal_form: f.legal_form || '',
  vat_number: f.vat_number || '',
  rcs_number: f.rcs_number || '',
  ...f
}))

fs.writeFileSync(file, JSON.stringify(updated, null, 2))
console.log('Migration 002 terminée')
