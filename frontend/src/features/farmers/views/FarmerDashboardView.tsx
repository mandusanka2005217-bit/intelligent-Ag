import React, { useState } from 'react';
import {
  Sprout,
  PlusCircle,
  Package,
  DollarSign,
  MapPin,
  CheckCircle,
  Clock,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { useFarmers, useCreateFarmer } from '@/features/farmers/hooks/useFarmers';
import { useAuthStore } from '@/core/store/authStore';
import type { CreateFarmerDto, Product, QualityGrade } from '@contracts/types';
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
  'Nuwara Eliya',
  'Badulla',
  'Dambulla',
  'Kandy',
  'Bandarawela',
  'Jaffna',
  'Anuradhapura',
  'Puttalam',
  'Embilipitiya',
  'Hambantota'
];

export const FarmerDashboardView: React.FC = () => {
  const { currentUser } = useAuthStore();
  const user = currentUser || {
    id: 'farmer-demo',
    name: 'Sunil Shantha',
    username: 'farmer@demo.com',
    role: 'farmer' as const,
    avatar: '🌾',
    location: 'Nuwara Eliya',
    createdAt: ''
  };
  const { data: allFarmers = [], isLoading } = useFarmers();
  const createFarmerMutation = useCreateFarmer();

  // Filter listings belonging to user or fallback to top items
  const myListings = allFarmers.filter(
    (f) => f.name.toLowerCase().includes('sunil') || f.location === user.location
  );
  const displayListings = myListings.length > 0 ? myListings : allFarmers.slice(0, 4);

  // Form state
  const [productType, setProductType] = useState<Product>('Tomato');
  const [quantityKg, setQuantityKg] = useState<number>(500);
  const [pricePerKg, setPricePerKg] = useState<number>(180);
  const [location, setLocation] = useState<string>(user.location.split(',')[0] || 'Nuwara Eliya');
  const [availabilityStatus, setAvailabilityStatus] = useState<'Available' | 'Partially Allocated' | 'Sold Out'>('Available');
  const [qualityGrade, setQualityGrade] = useState<QualityGrade>('A');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dto: CreateFarmerDto = {
        name: user.name,
        cropType: productType,
        quantityKg: Number(quantityKg),
        pricePerKg: Number(pricePerKg),
        location,
        qualityGrade,
        minPricePerKg: Math.round(Number(pricePerKg) * 0.85),
      };
      await createFarmerMutation.mutateAsync(dto);
      setSuccessMessage(`Successfully registered ${quantityKg}kg of ${productType}!`);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      console.error(err);
    }
  };

  const totalQuantity = displayListings.reduce((sum, item) => sum + item.quantityKg, 0);
  const totalPotentialValue = displayListings.reduce((sum, item) => sum + (item.quantityKg * item.pricePerKg), 0);

  return (
    <div className="farmer-dashboard-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <h2 className="page-header__title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>🌾</span> Farmer Management Dashboard
          </h2>
          <p className="page-header__subtitle">
            Welcome back, <strong>{user.name}</strong> · Farm Location: <strong>{user.location}</strong>
          </p>
        </div>
        <div className="page-header__actions">
          <span className="badge badge--success" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', borderRadius: '6px' }}>
            Verified Farmer Account: #{user.id}
          </span>
        </div>
      </div>

      {/* KPI Cards for Farmer */}
      <div className="kpi-grid">
        <div className="kpi-card" style={{ padding: '1.25rem' }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: '#d8f3dc', color: '#2d6a4f', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
            <Package size={22} />
          </div>
          <span className="kpi-card__label">Total Supply Listed</span>
          <span className="kpi-card__value kpi-card__value--small" style={{ margin: '0.25rem 0' }}>{formatWeight(totalQuantity)}</span>
          <span className="kpi-card__sub">{displayListings.length} harvest listings</span>
        </div>

        <div className="kpi-card" style={{ padding: '1.25rem' }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: '#fef3c7', color: '#b45309', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
            <DollarSign size={22} />
          </div>
          <span className="kpi-card__label">Estimated Value</span>
          <span className="kpi-card__value kpi-card__value--small" style={{ margin: '0.25rem 0' }}>{formatCurrency(totalPotentialValue)}</span>
          <span className="kpi-card__sub">Expected revenue</span>
        </div>

        <div className="kpi-card" style={{ padding: '1.25rem' }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: '#e0f2fe', color: '#0369a1', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
            <CheckCircle size={22} />
          </div>
          <span className="kpi-card__label">Availability Status</span>
          <span className="kpi-card__value kpi-card__value--small" style={{ color: '#16a34a', margin: '0.25rem 0' }}>Active & Ready</span>
          <span className="kpi-card__sub">High matching demand</span>
        </div>

        <div className="kpi-card" style={{ padding: '1.25rem' }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: '#ede9fe', color: '#6d28d9', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
            <Sprout size={22} />
          </div>
          <span className="kpi-card__label">Primary Crop</span>
          <span className="kpi-card__value kpi-card__value--small" style={{ margin: '0.25rem 0' }}>Vegetables</span>
          <span className="kpi-card__sub">Grade A/B standard</span>
        </div>
      </div>

      {/* Main Grid: Form and Listings */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.75rem', alignItems: 'start' }}>
        {/* Registration / Listing Form */}
        <section className="card" style={{ borderRadius: '12px', overflow: 'hidden' }}>
          <div className="card__header" style={{ padding: '1.25rem 1.5rem', background: '#fafdfa' }}>
            <div>
              <h3 className="card__title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.05rem', color: '#166534' }}>
                <PlusCircle size={20} color="#166534" />
                Farmer Registration & Crop Listing
              </h3>
              <p className="card__subtitle" style={{ marginTop: '0.25rem' }}>List new agricultural harvest for buyer allocation</p>
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
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#374151', marginBottom: '0.4rem' }}>Product Type *</label>
                <select
                  value={productType}
                  onChange={(e) => setProductType(e.target.value as Product)}
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
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#374151', marginBottom: '0.4rem' }}>Available Quantity (kg) *</label>
                  <input
                    type="number"
                    min="10"
                    step="10"
                    value={quantityKg}
                    onChange={(e) => setQuantityKg(Number(e.target.value))}
                    style={{ width: '100%', padding: '0.65rem 0.75rem', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.9rem' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#374151', marginBottom: '0.4rem' }}>Expected Selling Price (LKR/kg) *</label>
                  <input
                    type="number"
                    min="10"
                    step="1"
                    value={pricePerKg}
                    onChange={(e) => setPricePerKg(Number(e.target.value))}
                    style={{ width: '100%', padding: '0.65rem 0.75rem', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.9rem' }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#374151', marginBottom: '0.4rem' }}>Farm Location *</label>
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem 0.75rem', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.9rem', background: '#ffffff' }}
                  >
                    {LOCATIONS.map((loc) => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#374151', marginBottom: '0.4rem' }}>Availability Status</label>
                  <select
                    value={availabilityStatus}
                    onChange={(e) => setAvailabilityStatus(e.target.value as any)}
                    style={{ width: '100%', padding: '0.65rem 0.75rem', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.9rem', background: '#ffffff' }}
                  >
                    <option value="Available">Available (Now)</option>
                    <option value="Partially Allocated">Partially Allocated</option>
                    <option value="Sold Out">Sold Out</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#374151', marginBottom: '0.4rem' }}>Quality Grade</label>
                <div style={{ display: 'flex', gap: '1.25rem', marginTop: '0.35rem' }}>
                  {(['A', 'B', 'C'] as QualityGrade[]).map((grade) => (
                    <label key={grade} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                      <input
                        type="radio"
                        name="qualityGrade"
                        value={grade}
                        checked={qualityGrade === grade}
                        onChange={() => setQualityGrade(grade)}
                      />
                      Grade {grade}
                    </label>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={createFarmerMutation.isPending}
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
                  background: '#166534'
                }}
              >
                <PlusCircle size={18} />
                {createFarmerMutation.isPending ? 'Registering Produce...' : 'Publish Crop Availability'}
              </button>
            </form>
          </div>
        </section>

        {/* Existing Listings / Inventory Table */}
        <section className="card" style={{ borderRadius: '12px', overflow: 'hidden' }}>
          <div className="card__header" style={{ padding: '1.25rem 1.5rem', background: '#fafdfa' }}>
            <div>
              <h3 className="card__title" style={{ fontSize: '1.05rem' }}>My Registered Crops & Harvests</h3>
              <p className="card__subtitle" style={{ marginTop: '0.25rem' }}>Real-time inventory and pricing status</p>
            </div>
          </div>
          <div className="card__body" style={{ padding: 0 }}>
            {isLoading ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>Loading your crops...</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '0.85rem 1.25rem' }}>Product</th>
                      <th style={{ padding: '0.85rem 1.25rem' }}>Quantity</th>
                      <th style={{ padding: '0.85rem 1.25rem' }}>Expected Price</th>
                      <th style={{ padding: '0.85rem 1.25rem' }}>Location</th>
                      <th style={{ padding: '0.85rem 1.25rem' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayListings.map((item) => (
                      <tr key={item.id}>
                        <td style={{ padding: '0.85rem 1.25rem' }}>
                          <strong style={{ color: '#166534' }}>{item.cropType}</strong>
                          <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '2px' }}>Grade {item.qualityGrade}</div>
                        </td>
                        <td style={{ padding: '0.85rem 1.25rem' }}>{formatWeight(item.quantityKg)}</td>
                        <td style={{ padding: '0.85rem 1.25rem' }}>
                          <strong>{formatCurrency(item.pricePerKg)}</strong>/kg
                          <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '2px' }}>Min: Rs. {item.minPricePerKg}</div>
                        </td>
                        <td style={{ padding: '0.85rem 1.25rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', color: '#4b5563' }}>
                            <MapPin size={14} color="#6b7280" />
                            {item.location}
                          </div>
                        </td>
                        <td style={{ padding: '0.85rem 1.25rem' }}>
                          <span style={{ background: '#dcfce7', color: '#166534', padding: '0.3rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600 }}>
                            Available
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

export default FarmerDashboardView;
