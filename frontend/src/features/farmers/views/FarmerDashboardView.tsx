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

  // Filter listings belonging to Sunil or show active demo farmer's items
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
    <div className="farmer-dashboard">
      <div className="page-header">
        <div>
          <h2 className="page-header__title">🌾 Farmer Dashboard</h2>
          <p className="page-header__subtitle">
            Welcome back, <strong>{user.name}</strong> · Profile: {user.location}
          </p>
        </div>
        <div className="page-header__actions">
          <span className="badge badge--success">Verified Farmer ID: #{user.id}</span>
        </div>
      </div>

      {/* KPI Cards for Farmer */}
      <div className="kpi-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="kpi-card">
          <div style={{ width: 40, height: 40, borderRadius: 8, background: '#d8f3dc', color: '#2d6a4f', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem' }}>
            <Package size={22} />
          </div>
          <span className="kpi-card__label">Total Supply Listed</span>
          <span className="kpi-card__value kpi-card__value--small">{formatWeight(totalQuantity)}</span>
          <span className="kpi-card__sub">{displayListings.length} harvest listings</span>
        </div>

        <div className="kpi-card">
          <div style={{ width: 40, height: 40, borderRadius: 8, background: '#fef3c7', color: '#b45309', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem' }}>
            <DollarSign size={22} />
          </div>
          <span className="kpi-card__label">Estimated Value</span>
          <span className="kpi-card__value kpi-card__value--small">{formatCurrency(totalPotentialValue)}</span>
          <span className="kpi-card__sub">Expected revenue</span>
        </div>

        <div className="kpi-card">
          <div style={{ width: 40, height: 40, borderRadius: 8, background: '#e0f2fe', color: '#0369a1', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem' }}>
            <CheckCircle size={22} />
          </div>
          <span className="kpi-card__label">Availability Status</span>
          <span className="kpi-card__value kpi-card__value--small" style={{ color: '#16a34a' }}>Active & Ready</span>
          <span className="kpi-card__sub">High matching demand</span>
        </div>

        <div className="kpi-card">
          <div style={{ width: 40, height: 40, borderRadius: 8, background: '#ede9fe', color: '#6d28d9', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem' }}>
            <Sprout size={22} />
          </div>
          <span className="kpi-card__label">Primary Crop</span>
          <span className="kpi-card__value kpi-card__value--small">Vegetables</span>
          <span className="kpi-card__sub">Grade A/B standard</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '1.5rem' }}>
        {/* Registration / Listing Form */}
        <section className="card">
          <div className="card__header">
            <div>
              <h3 className="card__title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <PlusCircle size={18} color="#2d6a4f" />
                Farmer Registration & Crop Listing
              </h3>
              <p className="card__subtitle">List new agricultural harvest for buyer allocation</p>
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
                <label className="field-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Product Type</label>
                <select
                  value={productType}
                  onChange={(e) => setProductType(e.target.value as Product)}
                  className="input-select"
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
                  <label className="field-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Available Quantity (kg)</label>
                  <input
                    type="number"
                    min="10"
                    step="10"
                    value={quantityKg}
                    onChange={(e) => setQuantityKg(Number(e.target.value))}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #d1d5db' }}
                    required
                  />
                </div>
                <div>
                  <label className="field-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Expected Selling Price (LKR/kg)</label>
                  <input
                    type="number"
                    min="10"
                    step="1"
                    value={pricePerKg}
                    onChange={(e) => setPricePerKg(Number(e.target.value))}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #d1d5db' }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="field-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Location / Farm Origin</label>
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #d1d5db' }}
                  >
                    {LOCATIONS.map((loc) => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="field-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Availability Status</label>
                  <select
                    value={availabilityStatus}
                    onChange={(e) => setAvailabilityStatus(e.target.value as any)}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #d1d5db' }}
                  >
                    <option value="Available">Available (Now)</option>
                    <option value="Partially Allocated">Partially Allocated</option>
                    <option value="Sold Out">Sold Out</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="field-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Quality Grade</label>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem' }}>
                  {(['A', 'B', 'C'] as QualityGrade[]).map((grade) => (
                    <label key={grade} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
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
                style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                <PlusCircle size={18} />
                {createFarmerMutation.isPending ? 'Registering...' : 'List Crop Availability'}
              </button>
            </form>
          </div>
        </section>

        {/* Existing Listings / Inventory Table */}
        <section className="card">
          <div className="card__header">
            <div>
              <h3 className="card__title">My Registered Crops & Harvests</h3>
              <p className="card__subtitle">Real-time status of your listed agricultural products</p>
            </div>
          </div>
          <div className="card__body" style={{ padding: 0 }}>
            {isLoading ? (
              <div style={{ padding: '2rem', textAlign: 'center' }}>Loading your crops...</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Quantity</th>
                      <th>Expected Price</th>
                      <th>Location</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayListings.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <strong>{item.cropType}</strong>
                          <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Grade {item.qualityGrade}</div>
                        </td>
                        <td>{formatWeight(item.quantityKg)}</td>
                        <td>
                          <strong>{formatCurrency(item.pricePerKg)}</strong>/kg
                          <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Min: Rs. {item.minPricePerKg}</div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem' }}>
                            <MapPin size={14} color="#6b7280" />
                            {item.location}
                          </div>
                        </td>
                        <td>
                          <span className="badge badge--success" style={{ background: '#dcfce7', color: '#166534', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem' }}>
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
