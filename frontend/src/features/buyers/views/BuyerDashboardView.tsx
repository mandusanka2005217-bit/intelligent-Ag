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
    <div className="buyer-dashboard-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <h2 className="page-header__title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>🛒</span> Buyer Demand & Procurement Dashboard
          </h2>
          <p className="page-header__subtitle">
            Organization: <strong>{user.name}</strong> · Distribution Center: <strong>{user.location}</strong>
          </p>
        </div>
        <div className="page-header__actions">
          <span className="badge badge--warning" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', borderRadius: '6px' }}>
            Wholesale Buyer Account: #{user.id}
          </span>
        </div>
      </div>

      {/* KPI Cards for Buyer */}
      <div className="kpi-grid">
        <div className="kpi-card" style={{ padding: '1.25rem' }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: '#fde8cc', color: '#c56f28', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
            <ShoppingCart size={22} />
          </div>
          <span className="kpi-card__label">Total Demand Placed</span>
          <span className="kpi-card__value kpi-card__value--small" style={{ margin: '0.25rem 0' }}>{formatWeight(totalDemand)}</span>
          <span className="kpi-card__sub">{displayDemands.length} procurement orders</span>
        </div>

        <div className="kpi-card" style={{ padding: '1.25rem' }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: '#dcfce7', color: '#15803d', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
            <DollarSign size={22} />
          </div>
          <span className="kpi-card__label">Procurement Budget</span>
          <span className="kpi-card__value kpi-card__value--small" style={{ margin: '0.25rem 0' }}>{formatCurrency(totalBudget)}</span>
          <span className="kpi-card__sub">Maximum price limit</span>
        </div>

        <div className="kpi-card" style={{ padding: '1.25rem' }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: '#dbeafe', color: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
            <Layers size={22} />
          </div>
          <span className="kpi-card__label">Match Pipeline</span>
          <span className="kpi-card__value kpi-card__value--small" style={{ color: '#2563eb', margin: '0.25rem 0' }}>High Feasibility</span>
          <span className="kpi-card__sub">Active farmer supplies found</span>
        </div>

        <div className="kpi-card" style={{ padding: '1.25rem' }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: '#fae8ff', color: '#86198f', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
            <Clock size={22} />
          </div>
          <span className="kpi-card__label">Delivery Window</span>
          <span className="kpi-card__value kpi-card__value--small" style={{ margin: '0.25rem 0' }}>Immediate</span>
          <span className="kpi-card__sub">Within 24-48 hours</span>
        </div>
      </div>

      {/* Main Grid: Form and Orders */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.75rem', alignItems: 'start' }}>
        {/* Buyer Demand Registration Form */}
        <section className="card" style={{ borderRadius: '12px', overflow: 'hidden' }}>
          <div className="card__header" style={{ padding: '1.25rem 1.5rem', background: '#fffaf5' }}>
            <div>
              <h3 className="card__title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.05rem', color: '#9a3412' }}>
                <PlusCircle size={20} color="#ea580c" />
                Buyer Requirement Registration
              </h3>
              <p className="card__subtitle" style={{ marginTop: '0.25rem' }}>Submit procurement specifications to match with farmers</p>
            </div>
          </div>
          <div className="card__body" style={{ padding: '1.5rem' }}>
            {successMessage && (
              <div style={{ padding: '0.85rem 1rem', background: '#dcfce7', border: '1px solid #86efac', borderRadius: '8px', color: '#15803d', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                <CheckCircle size={18} />
                <span>{successMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#374151', marginBottom: '0.4rem' }}>Required Product *</label>
                <select
                  value={requiredProduct}
                  onChange={(e) => setRequiredProduct(e.target.value as Product)}
                  style={{ width: '100%', padding: '0.65rem 0.75rem', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.9rem', background: '#ffffff' }}
                  required
                >
                  {PRODUCTS.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#374151', marginBottom: '0.4rem' }}>Required Quantity (kg) *</label>
                  <input
                    type="number"
                    min="50"
                    step="50"
                    value={requiredQuantityKg}
                    onChange={(e) => setRequiredQuantityKg(Number(e.target.value))}
                    style={{ width: '100%', padding: '0.65rem 0.75rem', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.9rem' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#374151', marginBottom: '0.4rem' }}>Max Acceptable Price (LKR/kg) *</label>
                  <input
                    type="number"
                    min="10"
                    step="1"
                    value={maxPricePerKg}
                    onChange={(e) => setMaxPricePerKg(Number(e.target.value))}
                    style={{ width: '100%', padding: '0.65rem 0.75rem', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.9rem' }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#374151', marginBottom: '0.4rem' }}>Delivery Location / Hub *</label>
                  <select
                    value={buyerLocation}
                    onChange={(e) => setBuyerLocation(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem 0.75rem', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.9rem', background: '#ffffff' }}
                  >
                    {LOCATIONS.map((loc) => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#374151', marginBottom: '0.4rem' }}>Min Batch Quantity (kg)</label>
                  <input
                    type="number"
                    min="10"
                    value={minQuantity}
                    onChange={(e) => setMinQuantity(Number(e.target.value))}
                    style={{ width: '100%', padding: '0.65rem 0.75rem', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.9rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#374151', marginBottom: '0.4rem' }}>Minimum Acceptable Quality</label>
                <div style={{ display: 'flex', gap: '1.25rem', marginTop: '0.35rem' }}>
                  {(['A', 'B', 'C'] as QualityGrade[]).map((grade) => (
                    <label key={grade} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.9rem' }}>
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
                style={{
                  marginTop: '0.5rem',
                  padding: '0.75rem',
                  fontSize: '0.95rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  borderRadius: '8px',
                  background: '#ea580c'
                }}
              >
                <PlusCircle size={18} />
                {createBuyerMutation.isPending ? 'Posting Requirement...' : 'Post Procurement Demand'}
              </button>
            </form>
          </div>
        </section>

        {/* Existing Demand Requirements Table */}
        <section className="card" style={{ borderRadius: '12px', overflow: 'hidden' }}>
          <div className="card__header" style={{ padding: '1.25rem 1.5rem', background: '#fffaf5' }}>
            <div>
              <h3 className="card__title" style={{ fontSize: '1.05rem' }}>Current Demand Requirements</h3>
              <p className="card__subtitle" style={{ marginTop: '0.25rem' }}>Your active procurement orders awaiting farmer matches</p>
            </div>
          </div>
          <div className="card__body" style={{ padding: 0 }}>
            {isLoading ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>Loading demand specifications...</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '0.85rem 1.25rem' }}>Required Product</th>
                      <th style={{ padding: '0.85rem 1.25rem' }}>Quantity</th>
                      <th style={{ padding: '0.85rem 1.25rem' }}>Max Budget</th>
                      <th style={{ padding: '0.85rem 1.25rem' }}>Destination</th>
                      <th style={{ padding: '0.85rem 1.25rem' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayDemands.map((item) => (
                      <tr key={item.id}>
                        <td style={{ padding: '0.85rem 1.25rem' }}>
                          <strong style={{ color: '#ea580c' }}>{item.requiredCropType}</strong>
                          <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '2px' }}>Min Grade {item.minQualityGrade}</div>
                        </td>
                        <td style={{ padding: '0.85rem 1.25rem' }}>{formatWeight(item.requiredQuantityKg)}</td>
                        <td style={{ padding: '0.85rem 1.25rem' }}>
                          <strong>{formatCurrency(item.maxPricePerKg)}</strong>/kg
                          <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '2px' }}>
                            Max {formatCurrency(item.requiredQuantityKg * item.maxPricePerKg)}
                          </div>
                        </td>
                        <td style={{ padding: '0.85rem 1.25rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', color: '#4b5563' }}>
                            <MapPin size={14} color="#6b7280" />
                            {item.location}
                          </div>
                        </td>
                        <td style={{ padding: '0.85rem 1.25rem' }}>
                          <span style={{ background: '#fef3c7', color: '#92400e', padding: '0.3rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600 }}>
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
