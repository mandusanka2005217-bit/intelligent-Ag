import React, { useState } from 'react';
import { Plus, Users } from 'lucide-react';
import Button from '@/core/components/Button';
import Modal from '@/core/components/Modal';
import EmptyState from '@/shared/components/EmptyState';
import FarmerTable from '../components/FarmerTable';
import FarmerForm from '../components/FarmerForm';
import { useFarmers, useCreateFarmer, useUpdateFarmer, useDeleteFarmer } from '../hooks/useFarmers';
import type { Farmer, CreateFarmerDto } from '../types';

const FarmersPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFarmer, setEditingFarmer] = useState<Farmer | null>(null);

  const { data: farmers = [], isLoading, error } = useFarmers();
  const createFarmer = useCreateFarmer();
  const updateFarmer = useUpdateFarmer();
  const deleteFarmer = useDeleteFarmer();

  const handleAdd = () => {
    setEditingFarmer(null);
    setIsModalOpen(true);
  };

  const handleEdit = (farmer: Farmer) => {
    setEditingFarmer(farmer);
    setIsModalOpen(true);
  };

  const handleDelete = async (farmer: Farmer) => {
    if (!window.confirm(`Delete farmer "${farmer.name}"? This action cannot be undone.`)) return;
    await deleteFarmer.mutateAsync(farmer.id);
  };

  const handleSubmit = async (dto: CreateFarmerDto) => {
    if (editingFarmer) {
      await updateFarmer.mutateAsync({ id: editingFarmer.id, dto });
    } else {
      await createFarmer.mutateAsync(dto);
    }
    setIsModalOpen(false);
  };

  return (
    <div>
      {/* Page header */}
      <div className="page-header">
        <div>
          <h2 className="page-header__title">Farmers</h2>
          <p className="page-header__subtitle">
            {farmers.length} registered farmer{farmers.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button variant="primary" leftIcon={<Plus size={16} />} onClick={handleAdd}>
          Add Farmer
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div style={{ color: 'var(--color-danger)', marginBottom: '1rem' }}>
          Failed to load farmers. Please try again.
        </div>
      )}

      {/* Table or empty state */}
      {!isLoading && farmers.length === 0 ? (
        <EmptyState
          icon={<Users size={48} />}
          title="No Farmers Yet"
          description="Register your first farmer to start matching supply with demand."
          action={{ label: 'Add Farmer', onClick: handleAdd }}
        />
      ) : (
        <FarmerTable
          farmers={farmers}
          isLoading={isLoading}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingFarmer ? 'Edit Farmer' : 'Add New Farmer'}
        size="md"
      >
        <FarmerForm
          initialValues={editingFarmer ?? undefined}
          onSubmit={handleSubmit}
          onCancel={() => setIsModalOpen(false)}
          isSubmitting={createFarmer.isPending || updateFarmer.isPending}
        />
      </Modal>
    </div>
  );
};

export default FarmersPage;
