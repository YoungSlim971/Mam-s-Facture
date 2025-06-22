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
  const rate = new Decimal(tvaRate).div(100);
  const totalTTC = lignes.reduce(
    (sum, l) => sum.plus(new Decimal(l.quantite).mul(l.prix_unitaire)),
    new Decimal(0)
  );
  const totalHT = totalTTC.div(rate.plus(1));
  const totalTVA = totalTTC.minus(totalHT);
  return {
    totalHT: Number(totalHT.toFixed(2)),
    totalTVA: Number(totalTVA.toFixed(2)),
    totalTTC: Number(totalTTC.toFixed(2)),
  };
}
