import React from 'react';
import { formatWeight, formatPct } from '@/shared/utils/format';
import type { Allocation } from '../types';

interface SupplyUtilizationProps {
  allocations: Allocation[];
}

const SupplyUtilization: React.FC<SupplyUtilizationProps> = ({ allocations }) => {
  if (allocations.length === 0) {
    return <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>No data yet.</p>;
  }

  const totalAllocated = allocations.reduce((sum, a) => sum + a.allocatedQuantityKg, 0);
  const avgUtilization = allocations.reduce((sum, a) => sum + a.utilizationPct, 0) / allocations.length;
  const fullyAllocated = allocations.filter((a) => a.utilizationPct >= 0.99).length;
  const partial = allocations.filter((a) => a.utilizationPct < 0.99).length;

  const stats = [
    { label: 'Total Allocated', value: formatWeight(totalAllocated) },
    { label: 'Avg. Utilization', value: formatPct(avgUtilization) },
    { label: 'Fully Allocated', value: `${fullyAllocated}` },
    { label: 'Partial Allocation', value: `${partial}` },
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem',
      }}
    >
      {stats.map(({ label, value }) => (
        <div key={label} className="kpi-card">
          <span className="kpi-card__label">{label}</span>
          <span className="kpi-card__value" style={{ fontSize: 'var(--text-2xl)' }}>{value}</span>
        </div>
      ))}
    </div>
  );
};

export default SupplyUtilization;
