import React from 'react';
import { formatWeight, formatPct } from '@/shared/utils/format';
import EmptyState from '@/shared/components/EmptyState';
import { BarChart3 } from 'lucide-react';
import type { Allocation } from '../types';

interface AllocationBoardProps {
  allocations: Allocation[];
  isLoading?: boolean;
}

function utilizationColor(pct: number): string {
  if (pct >= 0.8) return 'var(--color-primary)';
  if (pct >= 0.5) return 'var(--color-secondary)';
  return 'var(--color-danger)';
}

const AllocationBoard: React.FC<AllocationBoardProps> = ({ allocations, isLoading = false }) => {
  if (isLoading) {
    return (
      <div className="allocation-board">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="allocation-row" style={{ opacity: 0.5 }}>
            <div style={{ flex: 1 }}>
              <div style={{ height: 14, background: '#e5e7eb', borderRadius: 4, width: '50%', marginBottom: 6 }} />
              <div style={{ height: 10, background: '#e5e7eb', borderRadius: 4, width: '30%' }} />
            </div>
            <div style={{ flex: 2, height: 10, background: '#e5e7eb', borderRadius: 4 }} />
          </div>
        ))}
      </div>
    );
  }

  if (allocations.length === 0) {
    return (
      <EmptyState
        icon={<BarChart3 size={48} />}
        title="No Allocations Yet"
        description="Allocations are created when supply is insufficient to fully satisfy demand. Run matching first."
      />
    );
  }

  return (
    <div className="allocation-board">
      {allocations.map((alloc) => {
        const color = utilizationColor(alloc.utilizationPct);
        const pctDisplay = formatPct(alloc.utilizationPct);

        return (
          <div key={alloc.id} className="allocation-row">
            {/* Info */}
            <div className="allocation-row__info">
              <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>
                Match #{alloc.matchId}
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 2 }}>
                Allocated: {formatWeight(alloc.allocatedQuantityKg)}
              </div>
            </div>

            {/* Progress bar */}
            <div className="allocation-row__bar-wrap">
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', marginBottom: 4 }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Supply utilization</span>
                <span style={{ fontWeight: 700, color }}>{pctDisplay}</span>
              </div>
              <div className="utilization-bar">
                <div
                  className="utilization-bar__fill"
                  style={{
                    width: `${Math.min(alloc.utilizationPct * 100, 100)}%`,
                    background: color,
                  }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AllocationBoard;
