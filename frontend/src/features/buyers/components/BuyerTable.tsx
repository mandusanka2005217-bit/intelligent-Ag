import React from 'react';
import { Trash2, Edit } from 'lucide-react';
import DataTable, { ColumnDef } from '@/shared/components/DataTable';
import Button from '@/core/components/Button';
import { formatWeight, formatCurrency, formatDate } from '@/shared/utils/format';
import type { Buyer } from '../types';

interface BuyerTableProps {
  buyers: Buyer[];
  isLoading?: boolean;
  onEdit?: (buyer: Buyer) => void;
  onDelete?: (buyer: Buyer) => void;
}

const BuyerTable: React.FC<BuyerTableProps> = ({
  buyers,
  isLoading = false,
  onEdit,
  onDelete,
}) => {
  const columns: ColumnDef<Buyer>[] = [
    {
      key: 'name',
      header: 'Name / Company',
      accessor: (row) => <span style={{ fontWeight: 500 }}>{row.name}</span>,
    },
    {
      key: 'location',
      header: 'Location',
      accessor: (row) => row.location,
    },
    {
      key: 'requiredCropType',
      header: 'Required Crop',
      accessor: (row) => (
        <span
          style={{
            background: '#fde8cc',
            color: '#92400e',
            borderRadius: '9999px',
            padding: '2px 10px',
            fontSize: '0.75rem',
            fontWeight: 600,
          }}
        >
          {row.requiredCropType}
        </span>
      ),
    },
    {
      key: 'requiredQuantityKg',
      header: 'Required Qty',
      accessor: (row) => formatWeight(row.requiredQuantityKg),
      align: 'right',
    },
    {
      key: 'maxPricePerKg',
      header: 'Max Price / kg',
      accessor: (row) => formatCurrency(row.maxPricePerKg),
      align: 'right',
    },
    {
      key: 'createdAt',
      header: 'Registered',
      accessor: (row) => formatDate(row.createdAt),
    },
    {
      key: 'actions',
      header: '',
      accessor: (row) => (
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<Edit size={14} />}
              onClick={(e) => { e.stopPropagation(); onEdit(row); }}
            >
              Edit
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<Trash2 size={14} />}
              onClick={(e) => { e.stopPropagation(); onDelete(row); }}
              style={{ color: 'var(--color-danger)' }}
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
    <div className="card">
      <DataTable<Buyer>
        data={buyers}
        columns={columns}
        keyExtractor={(row) => row.id}
        isLoading={isLoading}
        emptyMessage="No buyers found. Add your first buyer to get started."
      />
    </div>
  );
};

export default BuyerTable;
