import React from 'react';
import { BarChart3 } from 'lucide-react';
import AllocationBoard from '../components/AllocationBoard';
import SupplyUtilization from '../components/SupplyUtilization';
import { useAllocations } from '../hooks/useAllocation';

const AllocationPage: React.FC = () => {
  const { data: allocations = [], isLoading, error } = useAllocations();

  return (
    <div>
      {/* Page header */}
      <div className="page-header">
        <div>
          <h2 className="page-header__title">Allocation</h2>
          <p className="page-header__subtitle">
            Supply allocation results when demand exceeds available supply
          </p>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div style={{ color: 'var(--color-danger)', marginBottom: '1rem' }}>
          Failed to load allocation data. Please try again.
        </div>
      )}

      {/* Summary metrics */}
      <SupplyUtilization allocations={allocations} />

      {/* Allocation board */}
      <div className="card">
        <div className="card__header">
          <h3 className="card__title">Allocation Board</h3>
        </div>
        <div className="card__body">
          <AllocationBoard allocations={allocations} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
};

export default AllocationPage;
