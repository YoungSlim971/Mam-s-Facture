import Decimal from 'decimal.js';

export interface Totals {
  totalHT: number;
  totalTVA: number;
  totalTTC: number;
}

export function computeTotals(
  lignes: ReadonlyArray<{ quantite: number; prix_unitaire: number }>,
  tvaRate: number = 20
): Totals {
  const totalHT = lignes.reduce(
    (sum, l) => sum.plus(new Decimal(l.quantite).mul(l.prix_unitaire)),
    new Decimal(0)
  );
  const totalTVA = totalHT.mul(tvaRate).div(100);
  const totalTTC = totalHT.plus(totalTVA);
  return {
    totalHT: Number(totalHT.toFixed(2)),
    totalTVA: Number(totalTVA.toFixed(2)),
    totalTTC: Number(totalTTC.toFixed(2)),
  };
}
