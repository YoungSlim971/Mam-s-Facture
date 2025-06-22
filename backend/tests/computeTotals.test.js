const { computeTotals } = require('../utils/computeTotals.ts');

describe('computeTotals', () => {
  test('calculates totals correctly with default VAT', () => {
    const lignes = [
      { quantite: 2, prix_unitaire: 10 },
      { quantite: 1, prix_unitaire: 20 }
    ];
    const { totalHT, totalTVA, totalTTC } = computeTotals(lignes);
    expect(totalHT).toBe(40);
    expect(totalTVA).toBe(8);
    expect(totalTTC).toBe(48);
  });

  test('calculates totals correctly with custom VAT', () => {
    const lignes = [{ quantite: 3, prix_unitaire: 15 }];
    const { totalHT, totalTVA, totalTTC } = computeTotals(lignes, 10);
    expect(totalHT).toBe(45);
    expect(totalTVA).toBe(4.5);
    expect(totalTTC).toBe(49.5);
  });
});
