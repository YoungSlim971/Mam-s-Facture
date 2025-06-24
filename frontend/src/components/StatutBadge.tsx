import React from 'react';

interface StatutBadgeProps {
  statut: 'payée' | 'non payée';
}

const StatutBadge: React.FC<StatutBadgeProps> = ({ statut }) => {
  const base = 'px-2 py-1 text-sm font-semibold rounded-full';
  const styles = {
    'payée': 'bg-green-100 text-green-800',
    'non payée': 'bg-red-100 text-red-800',
  } as const;

  return (
    <span className={`${base} ${styles[statut]}`}>{statut === 'payée' ? '✔️ Payée' : '❌ Non payée'}</span>
  );
};

export default StatutBadge;
