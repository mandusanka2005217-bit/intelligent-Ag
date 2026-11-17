import React from 'react';
import { Trash2, Edit } from 'lucide-react';
import DataTable, { ColumnDef } from '@/shared/components/DataTable';
import Button from '@/core/components/Button';
import { formatWeight, formatCurrency, formatDate } from '@/shared/utils/format';
import type { Farmer } from '../types';

interface FarmerTableProps {
  farmers: Farmer[];
  isLoading?: boolean;
  onEdit?: (farmer: Farmer) => void;
  onDelete?: (farmer: Farmer) => void;
}

const FarmerTable: React.FC<FarmerTableProps> = ({
  farmers,
  isLoading = false,
  onEdit,
  onDelete,
}) => {
  const columns: ColumnDef<Farmer>[] = [
    {
      key: 'name',
      header: 'Name',
      accessor: (row) => <span style={{ fontWeight: 500 }}>{row.name}</span>,
    },
    {
      key: 'location',
      header: 'Location',
      accessor: (row) => row.location,
    },
    {
      key: 'cropType',
      header: 'Crop Type',
      accessor: (row) => (
        <span
          style={{
            background: 'var(--color-primary-50)',
            color: 'var(--color-primary-dark)',
            borderRadius: '9999px',
            padding: '2px 10px',
            fontSize: '0.75rem',
            fontWeight: 600,
          }}
        >
          {row.cropType}
        </span>
      ),
    },
    {
      key: 'quantityKg',
      header: 'Quantity',
      accessor: (row) => formatWeight(row.quantityKg),
      align: 'right',
    },
    {
      key: 'pricePerKg',
      header: 'Price / kg',
      accessor: (row) => formatCurrency(row.pricePerKg),
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
      <DataTable<Farmer>
        data={farmers}
        columns={columns}
        keyExtractor={(row) => row.id}
        isLoading={isLoading}
        emptyMessage="No farmers found. Add your first farmer to get started."
      />
    </div>
  );
};

export default FarmerTable;
