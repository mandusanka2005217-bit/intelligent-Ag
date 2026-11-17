import React, { useMemo, useState } from 'react';
import { Plus, Search, Users } from 'lucide-react';
import type { CreateFarmerDto, Farmer, Product } from '@contracts/types';
import Button from '@/core/components/Button';
import Modal from '@/core/components/Modal';
import EmptyState from '@/shared/components/EmptyState';
import SimulatedBadge from '@/shared/components/SimulatedBadge';
import useDebounce from '@/shared/hooks/useDebounce';
import { apiErrorMessage } from '@/shared/services/api-client';
import { PRODUCTS } from '@/shared/constants';
import { formatWeight } from '@/shared/utils/format';
import ScenarioBar from '@/features/scenarios/components/ScenarioBar';
import { useScenarioData } from '@/features/scenarios/hooks/useScenarios';
import { useScenarioStore } from '@core/store/scenarioStore';
import FarmerTable from '../components/FarmerTable';
import FarmerForm from '../components/FarmerForm';
import { useCreateFarmer, useDeleteFarmer, useFarmers, useUpdateFarmer } from '../hooks/useFarmers';

const FarmersPage: React.FC = () => {
  const scenarioId = useScenarioStore((state) => state.scenarioId);
  const { data: scenarioData } = useScenarioData(scenarioId);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFarmer, setEditingFarmer] = useState<Farmer | null>(null);
  const [search, setSearch] = useState('');
  const [cropType, setCropType] = useState<Product | ''>('');
  const [actionError, setActionError] = useState<string | null>(null);

  const debouncedSearch = useDebounce(search, 250);
  const filters = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      cropType: cropType || undefined,
    }),
    [debouncedSearch, cropType],
  );

  const { data: farmers = [], isLoading, error } = useFarmers(filters);
  const createFarmer = useCreateFarmer();
  const updateFarmer = useUpdateFarmer();
  const deleteFarmer = useDeleteFarmer();

  const locations = useMemo(
    () => (scenarioData?.locations ?? []).map((town) => town.name).sort((a, b) => a.localeCompare(b)),
    [scenarioData],
  );
  const totalKg = farmers.reduce((total, farmer) => total + farmer.quantityKg, 0);

  const openAdd = () => {
    setEditingFarmer(null);
    setActionError(null);
    setIsModalOpen(true);
  };

  const openEdit = (farmer: Farmer) => {
    setEditingFarmer(farmer);
    setActionError(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (farmer: Farmer) => {
    if (!window.confirm(`Delete farmer “${farmer.name}”? This cannot be undone.`)) return;
    try {
      setActionError(null);
      await deleteFarmer.mutateAsync(farmer.id);
    } catch (mutationError) {
      setActionError(apiErrorMessage(mutationError));
    }
  };

  const handleSubmit = async (dto: CreateFarmerDto) => {
    try {
      setActionError(null);
      if (editingFarmer) {
        await updateFarmer.mutateAsync({ id: editingFarmer.id, dto });
      } else {
        await createFarmer.mutateAsync(dto);
      }
      setIsModalOpen(false);
    } catch (mutationError) {
      setActionError(apiErrorMessage(mutationError));
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-header__title">Farmers</h2>
          <p className="page-header__subtitle">
            {farmers.length} supplier{farmers.length === 1 ? '' : 's'} · {formatWeight(totalKg)}{' '}
            offered in scenario {scenarioId}
          </p>
        </div>
        <div className="page-header__actions">
          <SimulatedBadge />
          <Button variant="primary" leftIcon={<Plus size={16} />} onClick={openAdd}>
            Add Farmer
          </Button>
        </div>
      </div>

      <ScenarioBar />

      <div className="filter-bar">
        <div className="search-field">
          <Search size={16} aria-hidden="true" />
          <input
            className="search-field__input"
            type="search"
            placeholder="Search name, town or crop…"
            value={search}
            aria-label="Search farmers"
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <select
          className="form-select filter-select"
          value={cropType}
          aria-label="Filter by crop"
          onChange={(event) => setCropType(event.target.value as Product | '')}
        >
          <option value="">All crops</option>
          {PRODUCTS.map((product) => (
            <option key={product} value={product}>
              {product}
            </option>
          ))}
        </select>
        <span className="filter-bar__count">{farmers.length} shown</span>
      </div>

      {(error || actionError) && (
        <div className="notice notice--danger" role="alert">
          {actionError ?? apiErrorMessage(error)}
        </div>
      )}

      {!isLoading && farmers.length === 0 ? (
        <EmptyState
          icon={<Users size={48} />}
          title={search || cropType ? 'No matching farmers' : 'No Farmers Yet'}
          description={
            search || cropType
              ? 'Try a different crop or clear the search to see all suppliers.'
              : 'Register your first farmer to start matching supply with demand.'
          }
          action={{ label: 'Add Farmer', onClick: openAdd }}
        />
      ) : (
        <FarmerTable
          farmers={farmers}
          isLoading={isLoading}
          onEdit={openEdit}
          onDelete={handleDelete}
        />
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingFarmer ? `Edit ${editingFarmer.name}` : 'Add New Farmer'}
        size="lg"
      >
        <FarmerForm
          key={editingFarmer?.id ?? 'new'}
          initialValues={editingFarmer ?? undefined}
          locations={locations}
          onSubmit={handleSubmit}
          onCancel={() => setIsModalOpen(false)}
          isSubmitting={createFarmer.isPending || updateFarmer.isPending}
        />
      </Modal>
    </div>
  );
};

export default FarmersPage;
