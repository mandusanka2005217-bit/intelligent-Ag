import React, { useMemo, useState } from 'react';
import { Plus, Search, ShoppingCart } from 'lucide-react';
import type { Buyer, CreateBuyerDto, Product } from '@contracts/types';
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
import BuyerTable from '../components/BuyerTable';
import BuyerForm from '../components/BuyerForm';
import { useBuyers, useCreateBuyer, useDeleteBuyer, useUpdateBuyer } from '../hooks/useBuyers';

const BuyersPage: React.FC = () => {
  const scenarioId = useScenarioStore((state) => state.scenarioId);
  const { data: scenarioData } = useScenarioData(scenarioId);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBuyer, setEditingBuyer] = useState<Buyer | null>(null);
  const [search, setSearch] = useState('');
  const [cropType, setCropType] = useState<Product | ''>('');
  const [actionError, setActionError] = useState<string | null>(null);

  const debouncedSearch = useDebounce(search, 250);
  const filters = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      requiredCropType: cropType || undefined,
    }),
    [debouncedSearch, cropType],
  );

  const { data: buyers = [], isLoading, error } = useBuyers(filters);
  const createBuyer = useCreateBuyer();
  const updateBuyer = useUpdateBuyer();
  const deleteBuyer = useDeleteBuyer();

  const locations = useMemo(
    () => (scenarioData?.locations ?? []).map((town) => town.name).sort((a, b) => a.localeCompare(b)),
    [scenarioData],
  );
  const totalKg = buyers.reduce((total, buyer) => total + buyer.requiredQuantityKg, 0);

  const openAdd = () => {
    setEditingBuyer(null);
    setActionError(null);
    setIsModalOpen(true);
  };

  const openEdit = (buyer: Buyer) => {
    setEditingBuyer(buyer);
    setActionError(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (buyer: Buyer) => {
    if (!window.confirm(`Delete buyer “${buyer.name}”? This cannot be undone.`)) return;
    try {
      setActionError(null);
      await deleteBuyer.mutateAsync(buyer.id);
    } catch (mutationError) {
      setActionError(apiErrorMessage(mutationError));
    }
  };

  const handleSubmit = async (dto: CreateBuyerDto) => {
    try {
      setActionError(null);
      if (editingBuyer) {
        await updateBuyer.mutateAsync({ id: editingBuyer.id, dto });
      } else {
        await createBuyer.mutateAsync(dto);
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
          <h2 className="page-header__title">Buyers</h2>
          <p className="page-header__subtitle">
            {buyers.length} buyer{buyers.length === 1 ? '' : 's'} · {formatWeight(totalKg)} required
            in scenario {scenarioId}
          </p>
        </div>
        <div className="page-header__actions">
          <SimulatedBadge />
          <Button variant="primary" leftIcon={<Plus size={16} />} onClick={openAdd}>
            Add Buyer
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
            placeholder="Search buyer, town or crop…"
            value={search}
            aria-label="Search buyers"
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <select
          className="form-select filter-select"
          value={cropType}
          aria-label="Filter by required crop"
          onChange={(event) => setCropType(event.target.value as Product | '')}
        >
          <option value="">All crops</option>
          {PRODUCTS.map((product) => (
            <option key={product} value={product}>
              {product}
            </option>
          ))}
        </select>
        <span className="filter-bar__count">{buyers.length} shown</span>
      </div>

      {(error || actionError) && (
        <div className="notice notice--danger" role="alert">
          {actionError ?? apiErrorMessage(error)}
        </div>
      )}

      {!isLoading && buyers.length === 0 ? (
        <EmptyState
          icon={<ShoppingCart size={48} />}
          title={search || cropType ? 'No matching buyers' : 'No Buyers Yet'}
          description={
            search || cropType
              ? 'Try a different crop or clear the search to see all buyers.'
              : 'Register your first buyer to start matching them with agricultural supply.'
          }
          action={{ label: 'Add Buyer', onClick: openAdd }}
        />
      ) : (
        <BuyerTable
          buyers={buyers}
          isLoading={isLoading}
          onEdit={openEdit}
          onDelete={handleDelete}
        />
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingBuyer ? `Edit ${editingBuyer.name}` : 'Add New Buyer'}
        size="lg"
      >
        <BuyerForm
          key={editingBuyer?.id ?? 'new'}
          initialValues={editingBuyer ?? undefined}
          locations={locations}
          onSubmit={handleSubmit}
          onCancel={() => setIsModalOpen(false)}
          isSubmitting={createBuyer.isPending || updateBuyer.isPending}
        />
      </Modal>
    </div>
  );
};

export default BuyersPage;
