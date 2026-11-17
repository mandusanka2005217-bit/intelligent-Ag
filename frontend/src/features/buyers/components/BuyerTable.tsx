import React from 'react';
import { Edit, Trash2 } from 'lucide-react';
import type { Buyer } from '@contracts/types';
import DataTable, { type ColumnDef } from '@/shared/components/DataTable';
import Button from '@/core/components/Button';
import { formatCurrency, formatDate, formatWeight } from '@/shared/utils/format';

interface BuyerTableProps {
  buyers: Buyer[];
  isLoading?: boolean;
  onEdit?: (buyer: Buyer) => void;
  onDelete?: (buyer: Buyer) => void;
  onSelect?: (buyer: Buyer) => void;
}

const BuyerTable: React.FC<BuyerTableProps> = ({
  buyers,
  isLoading = false,
  onEdit,
  onDelete,
  onSelect,
}) => {
  const columns: ColumnDef<Buyer>[] = [
    {
      key: 'name',
      header: 'Buyer',
      accessor: (row) => (
        <div className="cell-stack">
          <span className="cell-primary">{row.name}</span>
          <span className="cell-sub">{row.id}</span>
        </div>
      ),
    },
    { key: 'location', header: 'Town', accessor: (row) => row.location },
    {
      key: 'requiredCropType',
      header: 'Needs',
      accessor: (row) => <span className="chip chip--crop">{row.requiredCropType}</span>,
    },
    {
      key: 'requiredQuantityKg',
      header: 'Required',
      accessor: (row) => formatWeight(row.requiredQuantityKg),
      align: 'right',
    },
    {
      key: 'maxPricePerKg',
      header: 'Ceiling / kg',
      accessor: (row) => (
        <div className="cell-stack cell-stack--right">
          <span className="cell-primary">{formatCurrency(row.maxPricePerKg)}</span>
          <span className="cell-sub">min lot {formatWeight(row.minAcceptableQuantityKg)}</span>
        </div>
      ),
      align: 'right',
    },
    {
      key: 'minQualityGrade',
      header: 'Min grade',
      accessor: (row) => (
        <span className={`grade grade--${row.minQualityGrade.toLowerCase()}`}>
          {row.minQualityGrade}
        </span>
      ),
      align: 'center',
    },
    {
      key: 'requiredFrom',
      header: 'Needed by',
      accessor: (row) => formatDate(row.requiredFrom),
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
      <DataTable<Buyer>
        data={buyers}
        columns={columns}
        keyExtractor={(row) => row.id}
        isLoading={isLoading}
        onRowClick={onSelect}
        emptyMessage="No buyers match this filter. Add a buyer or clear the filters."
      />
    </div>
  );
};

export default BuyerTable;
