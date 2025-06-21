import { clsx, ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface Totals {
  totalHT: number;
  totalTVA: number;
  totalTTC: number;
}

export function computeTotals(
  lignes: Array<{ quantite: number; prix_unitaire: number }>,
  tvaRate = 20
): Totals {
  const totalHT = lignes.reduce(
    (sum, l) => sum + l.quantite * l.prix_unitaire,
    0
  );
  const totalTVA = (totalHT * tvaRate) / 100;
  const totalTTC = totalHT + totalTVA;
  return { totalHT, totalTVA, totalTTC };
}
