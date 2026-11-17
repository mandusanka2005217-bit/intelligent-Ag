import React, { useState } from 'react';
import {
  ShoppingCart,
  PlusCircle,
  Package,
  DollarSign,
  MapPin,
  CheckCircle,
  Clock,
  Layers,
  ArrowRight
} from 'lucide-react';
import { useBuyers, useCreateBuyer } from '@/features/buyers/hooks/useBuyers';
import { useAuthStore } from '@/core/store/authStore';
import type { CreateBuyerDto, Product, QualityGrade } from '@contracts/types';
import { formatCurrency, formatWeight } from '@/shared/utils/format';

const PRODUCTS: Product[] = [
  'Tomato',
  'Carrot',
  'Potato',
  'Cabbage',
  'Beans',
  'Onion',
  'Rice',
  'Maize',
  'Chili',
  'Coconut',
];

const LOCATIONS = [
  'Colombo',
  'Peliyagoda',
  'Kandy',
  'Galle',
  'Negombo',
  'Kurunegala',
  'Matara',
  'Gampaha',
  'Kalutara'
];

export const BuyerDashboardView: React.FC = () => {
  const { currentUser } = useAuthStore();
  const user = currentUser || {
    id: 'buyer-demo',
    name: 'Keells Logistics Hub',
    username: 'buyer@demo.com',
    role: 'buyer' as const,
    avatar: '🛒',
    location: 'Peliyagoda Central Hub',
    createdAt: ''
  };
  const { data: allBuyers = [], isLoading } = useBuyers();
  const createBuyerMutation = useCreateBuyer();

  // Find requirements for demo buyer or top demands
  const myDemands = allBuyers.filter(
    (b) => b.name.toLowerCase().includes('keells') || b.location === user.location
  );
  const displayDemands = myDemands.length > 0 ? myDemands : allBuyers.slice(0, 4);

  // Form states
  const [requiredProduct, setRequiredProduct] = useState<Product>('Potato');
  const [requiredQuantityKg, setRequiredQuantityKg] = useState<number>(1000);
  const [maxPricePerKg, setMaxPricePerKg] = useState<number>(240);
  const [buyerLocation, setBuyerLocation] = useState<string>(user.location.split(',')[0] || 'Colombo');
  const [minQualityGrade, setMinQualityGrade] = useState<QualityGrade>('B');
  const [minQuantity, setMinQuantity] = useState<number>(100);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dto: CreateBuyerDto = {
        name: user.name,
        requiredCropType: requiredProduct,
        requiredQuantityKg: Number(requiredQuantityKg),
        maxPricePerKg: Number(maxPricePerKg),
        location: buyerLocation,
        minQualityGrade,
        minAcceptableQuantityKg: Number(minQuantity) || Math.round(Number(requiredQuantityKg) * 0.1),
      };
      await createBuyerMutation.mutateAsync(dto);
      setSuccessMessage(`Requirement registered: ${requiredQuantityKg}kg of ${requiredProduct}!`);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      console.error(err);
    }
  };

  const totalDemand = displayDemands.reduce((sum, item) => sum + item.requiredQuantityKg, 0);
  const totalBudget = displayDemands.reduce((sum, item) => sum + (item.requiredQuantityKg * item.maxPricePerKg), 0);

  return (
    <div className="buyer-dashboard">
      <div className="page-header">
        <div>
          <h2 className="page-header__title">🛒 Buyer Management Dashboard</h2>
          <p className="page-header__subtitle">
            Organization: <strong>{user.name}</strong> · Hub: {user.location}
          </p>
        </div>
        <div className="page-header__actions">
          <span className="badge badge--warning">Wholesale Buyer ID: #{user.id}</span>
        </div>
      </div>

      {/* KPI Cards for Buyer */}
      <div className="kpi-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="kpi-card">
          <div style={{ width: 40, height: 40, borderRadius: 8, background: '#fde8cc', color: '#c56f28', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem' }}>
            <ShoppingCart size={22} />
          </div>
          <span className="kpi-card__label">Total Demand Placed</span>
          <span className="kpi-card__value kpi-card__value--small">{formatWeight(totalDemand)}</span>
          <span className="kpi-card__sub">{displayDemands.length} procurement orders</span>
        </div>

        <div className="kpi-card">
          <div style={{ width: 40, height: 40, borderRadius: 8, background: '#dcfce7', color: '#15803d', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem' }}>
            <DollarSign size={22} />
          </div>
          <span className="kpi-card__label">Procurement Budget</span>
          <span className="kpi-card__value kpi-card__value--small">{formatCurrency(totalBudget)}</span>
          <span className="kpi-card__sub">Max ceiling limit</span>
        </div>

        <div className="kpi-card">
          <div style={{ width: 40, height: 40, borderRadius: 8, background: '#dbeafe', color: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem' }}>
            <Layers size={22} />
          </div>
          <span className="kpi-card__label">Match Pipeline</span>
          <span className="kpi-card__value kpi-card__value--small" style={{ color: '#2563eb' }}>High Matching</span>
          <span className="kpi-card__sub">Active farmer supplies found</span>
        </div>

        <div className="kpi-card">
          <div style={{ width: 40, height: 40, borderRadius: 8, background: '#fae8ff', color: '#86198f', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem' }}>
            <Clock size={22} />
          </div>
          <span className="kpi-card__label">Delivery Window</span>
          <span className="kpi-card__value kpi-card__value--small">Immediate</span>
          <span className="kpi-card__sub">Within 24-48 hours</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '1.5rem' }}>
        {/* Buyer Demand Registration Form */}
        <section className="card">
          <div className="card__header">
            <div>
              <h3 className="card__title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <PlusCircle size={18} color="#c56f28" />
                Buyer Requirement Registration
              </h3>
              <p className="card__subtitle">Submit procurement specifications to match with farmers</p>
            </div>
          </div>
          <div className="card__body">
            {successMessage && (
              <div style={{ padding: '0.75rem', background: '#dcfce7', border: '1px solid #86efac', borderRadius: '8px', color: '#15803d', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle size={16} />
                <span>{successMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="field-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Required Product</label>
                <select
                  value={requiredProduct}
                  onChange={(e) => setRequiredProduct(e.target.value as Product)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #d1d5db' }}
                  required
                >
                  {PRODUCTS.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="field-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Required Quantity (kg)</label>
                  <input
                    type="number"
                    min="50"
                    step="50"
                    value={requiredQuantityKg}
                    onChange={(e) => setRequiredQuantityKg(Number(e.target.value))}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #d1d5db' }}
                    required
                  />
                </div>
                <div>
                  <label className="field-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Max Acceptable Price (LKR/kg)</label>
                  <input
                    type="number"
                    min="10"
                    step="1"
                    value={maxPricePerKg}
                    onChange={(e) => setMaxPricePerKg(Number(e.target.value))}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #d1d5db' }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="field-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Buyer Location / Warehouse</label>
                  <select
                    value={buyerLocation}
                    onChange={(e) => setBuyerLocation(e.target.value)}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #d1d5db' }}
                  >
                    {LOCATIONS.map((loc) => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="field-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Min Batch Quantity (kg)</label>
                  <input
                    type="number"
                    min="10"
                    value={minQuantity}
                    onChange={(e) => setMinQuantity(Number(e.target.value))}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #d1d5db' }}
                  />
                </div>
              </div>

              <div>
                <label className="field-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Minimum Acceptable Quality</label>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem' }}>
                  {(['A', 'B', 'C'] as QualityGrade[]).map((grade) => (
                    <label key={grade} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="minQualityGrade"
                        value={grade}
                        checked={minQualityGrade === grade}
                        onChange={() => setMinQualityGrade(grade)}
                      />
                      Grade {grade} or better
                    </label>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={createBuyerMutation.isPending}
                className="btn btn--primary"
                style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: '#c56f28' }}
              >
                <PlusCircle size={18} />
                {createBuyerMutation.isPending ? 'Submitting...' : 'Post Buyer Requirement'}
              </button>
            </form>
          </div>
        </section>

        {/* Existing Demand Requirements Table */}
        <section className="card">
          <div className="card__header">
            <div>
              <h3 className="card__title">Current Demand Requirements</h3>
              <p className="card__subtitle">Your purchase orders awaiting farmer matches</p>
            </div>
          </div>
          <div className="card__body" style={{ padding: 0 }}>
            {isLoading ? (
              <div style={{ padding: '2rem', textAlign: 'center' }}>Loading demand specifications...</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th>Required Product</th>
                      <th>Quantity Needed</th>
                      <th>Max Budget/Price</th>
                      <th>Delivery Destination</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayDemands.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <strong>{item.requiredCropType}</strong>
                          <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Min Grade {item.minQualityGrade}</div>
                        </td>
                        <td>{formatWeight(item.requiredQuantityKg)}</td>
                        <td>
                          <strong>{formatCurrency(item.maxPricePerKg)}</strong>/kg
                          <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                            Max {formatCurrency(item.requiredQuantityKg * item.maxPricePerKg)}
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem' }}>
                            <MapPin size={14} color="#6b7280" />
                            {item.location}
                          </div>
                        </td>
                        <td>
                          <span className="badge badge--warning" style={{ background: '#fef3c7', color: '#92400e', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem' }}>
                            In Matching
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default BuyerDashboardView;
