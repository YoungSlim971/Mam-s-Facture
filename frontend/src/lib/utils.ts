import { clsx, ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Calcule le prix HT et le montant de TVA à partir d'un montant TTC.
 * Les résultats sont arrondis au centime comme en comptabilité.
 */
export function fromTTC(ttc: number, taux: number) {
  const ht = parseFloat((ttc / (1 + taux / 100)).toFixed(2));
  const tva = parseFloat((ttc - ht).toFixed(2));
  return { ht, tva };
}
