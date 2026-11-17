import React from 'react';
import { ArrowRight, BarChart3, Info } from 'lucide-react';
import type { AllocationRow } from '../types';
import DataTable, { type ColumnDef } from '@/shared/components/DataTable';
import EmptyState from '@/shared/components/EmptyState';
import ScoreBadge from '@/shared/components/ScoreBadge';
import { formatCurrency, formatDistance, formatWeight } from '@/shared/utils/format';

interface AllocationBoardProps {
  allocations: AllocationRow[];
  isLoading?: boolean;
  onSelect?: (row: AllocationRow) => void;
}

/**
 * The full allocation ledger: one row per farmer -> buyer flow, with the score
 * that justified it and the transport cost it incurred.
 */
const AllocationBoard: React.FC<AllocationBoardProps> = ({
  allocations,
  isLoading = false,
  onSelect,
}) => {
  const columns: ColumnDef<AllocationRow>[] = [
    {
      key: 'route',
      header: 'Consignment',
      accessor: (row) => (
        <div className="cell-stack">
          <span className="cell-primary">
            {row.farmerId} <ArrowRight size={12} aria-hidden="true" /> {row.buyerId}
          </span>
          <span className="cell-sub">
            {row.farmerName} → {row.buyerName}
          </span>
        </div>
      ),
    },
    {
      key: 'cropType',
      header: 'Crop',
      accessor: (row) => <span className="chip chip--crop">{row.cropType}</span>,
    },
    {
      key: 'quantityKg',
      header: 'Allocated',
      accessor: (row) => <strong>{formatWeight(row.quantityKg)}</strong>,
      align: 'right',
    },
    {
      key: 'suitabilityScore',
      header: 'Score',
      accessor: (row) => <ScoreBadge score={row.suitabilityScore} />,
      align: 'center',
    },
    {
      key: 'distanceKm',
      header: 'Distance',
      accessor: (row) => formatDistance(row.distanceKm),
      align: 'right',
    },
    {
      key: 'transportCostRs',
      header: 'Transport',
      accessor: (row) => (
        <div className="cell-stack cell-stack--right">
          <span className="cell-primary">{formatCurrency(row.transportCostRs)}</span>
          <span className="cell-sub">{formatCurrency(row.transportCostPerKg)}/kg</span>
        </div>
      ),
      align: 'right',
    },
    {
      key: 'detail',
      header: '',
      accessor: (row) => (
        <button
          className="link-button"
          onClick={(event) => {
            event.stopPropagation();
            onSelect?.(row);
          }}
          aria-label={`Why ${row.farmerName} was allocated to ${row.buyerName}`}
        >
          <Info size={14} /> Why?
        </button>
      ),
      align: 'right',
    },
  ];

  if (!isLoading && allocations.length === 0) {
    return (
      <EmptyState
        icon={<BarChart3 size={48} />}
        title="No allocations for this configuration"
        description="No farmer satisfies every hard constraint for the current scenario, weights and strategy. Try scenario A or lower the minimum score."
      />
    );
  }

  return (
    <DataTable<AllocationRow>
      data={allocations}
      columns={columns}
      keyExtractor={(row) => row.id}
      isLoading={isLoading}
      onRowClick={onSelect}
      emptyMessage="No consignments were allocated."
    />
  );
};

export default AllocationBoard;
