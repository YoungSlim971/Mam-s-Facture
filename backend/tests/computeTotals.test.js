const { computeTotals } = require('../utils/computeTotals');

describe('computeTotals', () => {
  test('calculates totals correctly with default VAT', () => {
    const lignes = [
      { quantite: 2, prix_unitaire: 10 },
      { quantite: 1, prix_unitaire: 20 }
    ];
    const { totalHT, totalTVA, totalTTC } = computeTotals(lignes);
    expect(totalHT).toBe(33.33);
    expect(totalTVA).toBe(6.67);
    expect(totalTTC).toBe(40);
  });

  test('calculates totals correctly with custom VAT', () => {
    const lignes = [{ quantite: 3, prix_unitaire: 15 }];
    const { totalHT, totalTVA, totalTTC } = computeTotals(lignes, 10);
    expect(totalHT).toBe(40.91);
    expect(totalTVA).toBe(4.09);
    expect(totalTTC).toBe(45);
  });
});
