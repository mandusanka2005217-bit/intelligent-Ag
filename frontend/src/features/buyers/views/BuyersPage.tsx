import React, { useState } from 'react';
import { Plus, ShoppingCart } from 'lucide-react';
import Button from '@/core/components/Button';
import Modal from '@/core/components/Modal';
import EmptyState from '@/shared/components/EmptyState';
import BuyerTable from '../components/BuyerTable';
import BuyerForm from '../components/BuyerForm';
import { useBuyers, useCreateBuyer, useUpdateBuyer, useDeleteBuyer } from '../hooks/useBuyers';
import type { Buyer, CreateBuyerDto } from '../types';

const BuyersPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBuyer, setEditingBuyer] = useState<Buyer | null>(null);

  const { data: buyers = [], isLoading, error } = useBuyers();
  const createBuyer = useCreateBuyer();
  const updateBuyer = useUpdateBuyer();
  const deleteBuyer = useDeleteBuyer();

  const handleAdd = () => {
    setEditingBuyer(null);
    setIsModalOpen(true);
  };

  const handleEdit = (buyer: Buyer) => {
    setEditingBuyer(buyer);
    setIsModalOpen(true);
  };

  const handleDelete = async (buyer: Buyer) => {
    if (!window.confirm(`Delete buyer "${buyer.name}"? This action cannot be undone.`)) return;
    await deleteBuyer.mutateAsync(buyer.id);
  };

  const handleSubmit = async (dto: CreateBuyerDto) => {
    if (editingBuyer) {
      await updateBuyer.mutateAsync({ id: editingBuyer.id, dto });
    } else {
      await createBuyer.mutateAsync(dto);
    }
    setIsModalOpen(false);
  };

  return (
    <div>
      {/* Page header */}
      <div className="page-header">
        <div>
          <h2 className="page-header__title">Buyers</h2>
          <p className="page-header__subtitle">
            {buyers.length} registered buyer{buyers.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button variant="primary" leftIcon={<Plus size={16} />} onClick={handleAdd}>
          Add Buyer
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div style={{ color: 'var(--color-danger)', marginBottom: '1rem' }}>
          Failed to load buyers. Please try again.
        </div>
      )}

      {/* Table or empty state */}
      {!isLoading && buyers.length === 0 ? (
        <EmptyState
          icon={<ShoppingCart size={48} />}
          title="No Buyers Yet"
          description="Register your first buyer to start matching them with agricultural supply."
          action={{ label: 'Add Buyer', onClick: handleAdd }}
        />
      ) : (
        <BuyerTable
          buyers={buyers}
          isLoading={isLoading}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingBuyer ? 'Edit Buyer' : 'Add New Buyer'}
        size="md"
      >
        <BuyerForm
          initialValues={editingBuyer ?? undefined}
          onSubmit={handleSubmit}
          onCancel={() => setIsModalOpen(false)}
          isSubmitting={createBuyer.isPending || updateBuyer.isPending}
        />
      </Modal>
    </div>
  );
};

export default BuyersPage;
