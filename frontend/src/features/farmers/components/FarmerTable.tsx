import React from 'react';
import { Edit, Trash2 } from 'lucide-react';
import type { Farmer } from '@contracts/types';
import DataTable, { type ColumnDef } from '@/shared/components/DataTable';
import Button from '@/core/components/Button';
import { formatCurrency, formatDate, formatWeight } from '@/shared/utils/format';

interface FarmerTableProps {
  farmers: Farmer[];
  isLoading?: boolean;
  onEdit?: (farmer: Farmer) => void;
  onDelete?: (farmer: Farmer) => void;
  onSelect?: (farmer: Farmer) => void;
}

const FarmerTable: React.FC<FarmerTableProps> = ({
  farmers,
  isLoading = false,
  onEdit,
  onDelete,
  onSelect,
}) => {
  const columns: ColumnDef<Farmer>[] = [
    {
      key: 'name',
      header: 'Farmer',
      accessor: (row) => (
        <div className="cell-stack">
          <span className="cell-primary">{row.name}</span>
          <span className="cell-sub">{row.id}</span>
        </div>
      ),
    },
    { key: 'location', header: 'Town', accessor: (row) => row.location },
    {
      key: 'cropType',
      header: 'Crop',
      accessor: (row) => <span className="chip chip--crop">{row.cropType}</span>,
    },
    {
      key: 'quantityKg',
      header: 'Available',
      accessor: (row) => formatWeight(row.quantityKg),
      align: 'right',
    },
    {
      key: 'pricePerKg',
      header: 'Asking / kg',
      accessor: (row) => (
        <div className="cell-stack cell-stack--right">
          <span className="cell-primary">{formatCurrency(row.pricePerKg)}</span>
          <span className="cell-sub">floor {formatCurrency(row.minPricePerKg)}</span>
        </div>
      ),
      align: 'right',
    },
    {
      key: 'qualityGrade',
      header: 'Grade',
      accessor: (row) => (
        <span className={`grade grade--${row.qualityGrade.toLowerCase()}`}>{row.qualityGrade}</span>
      ),
      align: 'center',
    },
    {
      key: 'availableFrom',
      header: 'Available from',
      accessor: (row) => formatDate(row.availableFrom),
    },
    {
      key: 'actions',
      header: '',
      accessor: (row) => (
        <div className="table-actions">
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<Edit size={14} />}
              aria-label={`Edit ${row.name}`}
              onClick={(event) => {
                event.stopPropagation();
                onEdit(row);
              }}
            >
              Edit
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<Trash2 size={14} />}
              className="btn--danger-text"
              aria-label={`Delete ${row.name}`}
              onClick={(event) => {
                event.stopPropagation();
                onDelete(row);
              }}
            >
              Delete
            </Button>
          )}
        </div>
      ),
      align: 'right',
    },
  ];

  return (
    <div className="card card--table">
      <DataTable<Farmer>
        data={farmers}
        columns={columns}
        keyExtractor={(row) => row.id}
        isLoading={isLoading}
        onRowClick={onSelect}
        emptyMessage="No farmers match this filter. Add a farmer or clear the filters."
      />
    </div>
  );
};

export default FarmerTable;
