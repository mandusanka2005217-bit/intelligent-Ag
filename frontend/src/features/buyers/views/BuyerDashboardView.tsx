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
  ArrowRight,
  TrendingUp,
  Edit2,
  Trash2,
  AlertCircle,
  Search,
  Filter,
  X,
  FileText
} from 'lucide-react';
import { useBuyers, useCreateBuyer, useUpdateBuyer, useDeleteBuyer } from '@/features/buyers/hooks/useBuyers';
import { useFarmers } from '@/features/farmers/hooks/useFarmers';
import { useOrders, useCreateOrder } from '@/features/buyers/hooks/useOrders';
import { useAuthStore } from '@/core/store/authStore';
import type { Buyer, CreateBuyerDto, Farmer, Product, QualityGrade, UpdateBuyerDto } from '@contracts/types';
import { formatCurrency, formatWeight, formatDate } from '@/shared/utils/format';
import { Link } from 'react-router-dom';
import { usePriceRecommendations, useFreshnessIntelligence } from '@/features/intelligence/hooks/useIntelligence';

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

  const { data: allBuyers = [], isLoading: buyersLoading } = useBuyers();
  const createBuyerMutation = useCreateBuyer();
  const updateBuyerMutation = useUpdateBuyer();
  const deleteBuyerMutation = useDeleteBuyer();

  // Available farmers' crops
  const { data: allFarmers = [], isLoading: farmersLoading } = useFarmers();

  // Orders placed by this buyer
  const { data: allOrders = [], isLoading: ordersLoading } = useOrders({ buyerId: user.id });
  const createOrderMutation = useCreateOrder();

  // Intelligence queries
  const { data: priceRecs } = usePriceRecommendations('A');
  const { data: freshnessData } = useFreshnessIntelligence('A');

  // Filter requirements for this buyer
  const myDemands = allBuyers.filter(
    (b) =>
      b.name.toLowerCase() === user.name.toLowerCase() ||
      (user.username === 'buyer@demo.com' && (b.name.toLowerCase().includes('keells') || b.id === 'B01' || b.id === 'B02'))
  );
  const displayDemands = myDemands.length > 0 ? myDemands : allBuyers.slice(0, 3);

  // Form states for creating demand
  const [requiredProduct, setRequiredProduct] = useState<Product>('Potato');
  const [requiredQuantityKg, setRequiredQuantityKg] = useState<number>(1000);
  const [maxPricePerKg, setMaxPricePerKg] = useState<number>(240);
  const [buyerLocation, setBuyerLocation] = useState<string>(user.location.split(',')[0] || 'Colombo');
  const [minQualityGrade, setMinQualityGrade] = useState<QualityGrade>('B');
  const [minQuantity, setMinQuantity] = useState<number>(100);
  const [description, setDescription] = useState<string>('');

  // Edit Demand Modal states
  const [editingDemand, setEditingDemand] = useState<Buyer | null>(null);
  const [editDemandForm, setEditDemandForm] = useState<{
    requiredCropType: Product;
    requiredQuantityKg: number;
    maxPricePerKg: number;
    location: string;
    requiredFrom: string;
    description: string;
    demandStatus: 'Active' | 'Pending' | 'Fulfilled' | 'Cancelled';
  }>({
    requiredCropType: 'Potato',
    requiredQuantityKg: 1000,
    maxPricePerKg: 240,
    location: 'Colombo',
    requiredFrom: '',
    description: '',
    demandStatus: 'Active',
  });

  // Delete demand modal state
  const [deletingDemand, setDeletingDemand] = useState<Buyer | null>(null);

  // Available Crops Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterDistrict, setFilterDistrict] = useState<string>('all');
  const [maxPriceFilter, setMaxPriceFilter] = useState<number>(1000);
  const [sortBy, setSortBy] = useState<'price_asc' | 'price_desc' | 'qty_desc'>('price_asc');

  // Order Placement Modal state
  const [orderingCrop, setOrderingCrop] = useState<Farmer | null>(null);
  const [orderQuantityKg, setOrderQuantityKg] = useState<number>(100);
  const [orderNote, setOrderNote] = useState<string>('');
  const [buyerContact, setBuyerContact] = useState<string>(user.phone || '+94 77 000 0000');

  // Toast notification
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4500);
  };

  // Create Demand Requirement
  const handleCreateDemand = async (e: React.FormEvent) => {
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
        description,
        demandStatus: 'Active',
      };
      await createBuyerMutation.mutateAsync(dto);
      showToast('success', `Demand requirement registered for ${requiredQuantityKg}kg of ${requiredProduct}!`);
      setDescription('');
    } catch (err: any) {
      showToast('error', err?.response?.data?.error?.message || 'Failed to submit requirement');
    }
  };

  // Open Edit Demand
  const handleOpenEditDemand = (demand: Buyer) => {
    setEditingDemand(demand);
    setEditDemandForm({
      requiredCropType: demand.requiredCropType,
      requiredQuantityKg: demand.requiredQuantityKg,
      maxPricePerKg: demand.maxPricePerKg,
      location: demand.location,
      requiredFrom: demand.requiredFrom || '',
      description: demand.description || '',
      demandStatus: demand.demandStatus || 'Active',
    });
  };

  // Submit Edit Demand
  const handleUpdateDemandSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDemand) return;
    try {
      const dto: UpdateBuyerDto = {
        requiredCropType: editDemandForm.requiredCropType,
        requiredQuantityKg: Number(editDemandForm.requiredQuantityKg),
        maxPricePerKg: Number(editDemandForm.maxPricePerKg),
        location: editDemandForm.location,
        requiredFrom: editDemandForm.requiredFrom,
        description: editDemandForm.description,
        demandStatus: editDemandForm.demandStatus,
      };
      await updateBuyerMutation.mutateAsync({ id: editingDemand.id, dto });
      showToast('success', `Demand requirement #${editingDemand.id} updated successfully!`);
      setEditingDemand(null);
    } catch (err: any) {
      showToast('error', err?.response?.data?.error?.message || 'Failed to update requirement');
    }
  };

  // Submit Delete Demand
  const handleDeleteDemandConfirm = async () => {
    if (!deletingDemand) return;
    try {
      await deleteBuyerMutation.mutateAsync(deletingDemand.id);
      showToast('success', `Demand requirement #${deletingDemand.id} deleted successfully.`);
      setDeletingDemand(null);
    } catch (err: any) {
      showToast('error', err?.response?.data?.error?.message || 'Failed to delete requirement');
    }
  };

  // Open Order Placement
  const handleOpenOrder = (crop: Farmer) => {
    const reserved = crop.reservedKg || 0;
    const completed = crop.completedKg || 0;
    const avail = Math.max(0, crop.quantityKg - reserved - completed);

    setOrderingCrop(crop);
    setOrderQuantityKg(Math.min(100, avail > 0 ? avail : 10));
    setOrderNote('');
  };

  // Submit Order Placement
  const handlePlaceOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderingCrop) return;

    const reserved = orderingCrop.reservedKg || 0;
    const completed = orderingCrop.completedKg || 0;
    const avail = Math.max(0, orderingCrop.quantityKg - reserved - completed);

    if (orderQuantityKg <= 0) {
      showToast('error', 'Order quantity must be greater than zero.');
      return;
    }
    if (orderQuantityKg > avail) {
      showToast('error', `Order quantity (${orderQuantityKg}kg) exceeds available stock (${avail}kg).`);
      return;
    }

    try {
      await createOrderMutation.mutateAsync({
        buyerId: user.id,
        buyerName: user.name,
        farmerId: orderingCrop.id,
        cropId: orderingCrop.id,
        quantityKg: Number(orderQuantityKg),
        deliveryLocation: user.location,
        orderNote,
        buyerContact,
      });

      showToast('success', `Order placed successfully for ${orderQuantityKg}kg of ${orderingCrop.cropType}! Awaiting farmer confirmation.`);
      setOrderingCrop(null);
    } catch (err: any) {
      showToast('error', err?.response?.data?.error?.message || 'Failed to place order');
    }
  };

  // Filter available crops registered by farmers
  const filteredCrops = allFarmers
    .filter((crop) => {
      const reserved = crop.reservedKg || 0;
      const completed = crop.completedKg || 0;
      const avail = Math.max(0, crop.quantityKg - reserved - completed);
      if (avail <= 0) return false;

      // Search match
      if (searchTerm) {
        const text = `${crop.name} ${crop.cropType} ${crop.location}`.toLowerCase();
        if (!text.includes(searchTerm.toLowerCase())) return false;
      }
      // Category match
      if (filterCategory !== 'all' && crop.cropType !== filterCategory) return false;
      // District match
      if (filterDistrict !== 'all' && !crop.location.toLowerCase().includes(filterDistrict.toLowerCase())) return false;
      // Price filter
      if (crop.pricePerKg > maxPriceFilter) return false;

      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'price_asc') return a.pricePerKg - b.pricePerKg;
      if (sortBy === 'price_desc') return b.pricePerKg - a.pricePerKg;
      if (sortBy === 'qty_desc') return b.quantityKg - a.quantityKg;
      return 0;
    });

  const totalDemand = displayDemands.reduce((sum, item) => sum + item.requiredQuantityKg, 0);
  const totalBudget = displayDemands.reduce((sum, item) => sum + item.requiredQuantityKg * item.maxPricePerKg, 0);

  return (
    <div className="buyer-dashboard-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Toast Notification */}
      {notification && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 9999,
            padding: '1rem 1.25rem',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
            background: notification.type === 'success' ? '#dcfce7' : '#fee2e2',
            color: notification.type === 'success' ? '#166534' : '#991b1b',
            border: `1px solid ${notification.type === 'success' ? '#86efac' : '#fca5a5'}`,
            fontWeight: 500,
          }}
        >
          {notification.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <h2 className="page-header__title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>🛒</span> Buyer Demand & Procurement Dashboard
          </h2>
          <p className="page-header__subtitle">
            Organization: <strong>{user.name}</strong> · Warehouse Location: <strong>{user.location}</strong>
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
          <span className="kpi-card__sub">{displayDemands.length} procurement records</span>
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
          <span className="kpi-card__label">My Direct Orders</span>
          <span className="kpi-card__value kpi-card__value--small" style={{ color: '#2563eb', margin: '0.25rem 0' }}>{allOrders.length} Orders</span>
          <span className="kpi-card__sub">Direct farm procurement</span>
        </div>

        <div className="kpi-card" style={{ padding: '1.25rem' }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: '#fae8ff', color: '#86198f', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
            <Clock size={22} />
          </div>
          <span className="kpi-card__label">Delivery Window</span>
          <span className="kpi-card__value kpi-card__value--small" style={{ margin: '0.25rem 0' }}>24-48 Hours</span>
          <span className="kpi-card__sub">Island-wide express</span>
        </div>
      </div>

      {/* Main Grid: Requirement Form & Current Demand Requirements */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.75rem', alignItems: 'start' }}>
        {/* Requirement Form */}
        <section className="card" style={{ borderRadius: '12px', overflow: 'hidden' }}>
          <div className="card__header" style={{ padding: '1.25rem 1.5rem', background: '#fffaf5' }}>
            <div>
              <h3 className="card__title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.05rem', color: '#9a3412' }}>
                <PlusCircle size={20} color="#ea580c" />
                Post New Demand Requirement
              </h3>
              <p className="card__subtitle" style={{ marginTop: '0.25rem' }}>Register procurement volume for matching</p>
            </div>
          </div>
          <div className="card__body" style={{ padding: '1.5rem' }}>
            <form onSubmit={handleCreateDemand} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
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
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#374151', marginBottom: '0.4rem' }}>Max Budget (LKR/kg) *</label>
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
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#374151', marginBottom: '0.4rem' }}>Destination Hub *</label>
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
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#374151', marginBottom: '0.4rem' }}>Min Acceptable Quality</label>
                  <select
                    value={minQualityGrade}
                    onChange={(e) => setMinQualityGrade(e.target.value as QualityGrade)}
                    style={{ width: '100%', padding: '0.65rem 0.75rem', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.9rem', background: '#ffffff' }}
                  >
                    <option value="A">Grade A only</option>
                    <option value="B">Grade B or better</option>
                    <option value="C">Grade C or better</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#374151', marginBottom: '0.4rem' }}>Additional Specifications / Notes</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Packaging specifications, crates required, specific delivery hours..."
                  rows={2}
                  style={{ width: '100%', padding: '0.65rem 0.75rem', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.9rem' }}
                />
              </div>

              <button
                type="submit"
                disabled={createBuyerMutation.isPending}
                className="btn btn--primary"
                style={{
                  marginTop: '0.25rem',
                  padding: '0.75rem',
                  fontSize: '0.95rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  borderRadius: '8px',
                  background: '#ea580c',
                }}
              >
                <PlusCircle size={18} />
                {createBuyerMutation.isPending ? 'Submitting...' : 'Post Demand Requirement'}
              </button>
            </form>
          </div>
        </section>

        {/* 2. SECTION: CURRENT DEMAND REQUIREMENTS (With Edit & Delete Buttons) */}
        <section className="card" style={{ borderRadius: '12px', overflow: 'hidden' }}>
          <div className="card__header" style={{ padding: '1.25rem 1.5rem', background: '#fffaf5' }}>
            <div>
              <h3 className="card__title" style={{ fontSize: '1.05rem', color: '#111827' }}>Current Demand Requirements</h3>
              <p className="card__subtitle" style={{ marginTop: '0.25rem' }}>Manage and update your procurement requirement records</p>
            </div>
          </div>
          <div className="card__body" style={{ padding: 0 }}>
            {buyersLoading ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>Loading demand specifications...</div>
            ) : displayDemands.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
                No active demand requirements yet. Submit a requirement using the form.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '0.85rem 1rem' }}>Product</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Quantity</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Max Price</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Location</th>
                      <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayDemands.map((item) => (
                      <tr key={item.id}>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <strong style={{ color: '#ea580c' }}>{item.requiredCropType}</strong>
                          <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>#{item.id} · Grade {item.minQualityGrade}</div>
                        </td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <strong>{formatWeight(item.requiredQuantityKg)}</strong>
                        </td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <strong>{formatCurrency(item.maxPricePerKg)}</strong>/kg
                        </td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem' }}>
                            <MapPin size={13} color="#6b7280" />
                            {item.location}
                          </div>
                        </td>
                        <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                            <button
                              onClick={() => handleOpenEditDemand(item)}
                              className="btn btn--outline btn--sm"
                              style={{ padding: '0.35rem 0.65rem', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem' }}
                              title="Edit this demand requirement"
                            >
                              <Edit2 size={13} />
                              Edit
                            </button>
                            <button
                              onClick={() => setDeletingDemand(item)}
                              className="btn btn--outline btn--sm"
                              style={{ padding: '0.35rem 0.65rem', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', color: '#b91c1c', borderColor: '#fca5a5' }}
                              title="Delete this demand requirement"
                            >
                              <Trash2 size={13} />
                              Delete
                            </button>
                          </div>
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

      {/* PRICE TRENDS BUTTON SECTION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', background: '#ffffff', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
        <div>
          <h4 style={{ margin: 0, fontSize: '1rem', color: '#111827', fontWeight: 600 }}>Market Pricing & Historical Trends</h4>
          <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: '#6b7280' }}>Analyse current crop price swings and anomaly detection metrics</p>
        </div>
        <Link
          to="/prices"
          className="btn btn--primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#2563eb', padding: '0.65rem 1.25rem', borderRadius: '8px' }}
        >
          <TrendingUp size={18} />
          Price Trends
        </Link>
      </div>

      {/* AI-POWERED PURCHASING INSIGHTS */}
      <section className="card" style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid #bfdbfe', background: '#f8fafc' }}>
        <div className="card__header" style={{ padding: '1.25rem 1.5rem', background: '#eff6ff', borderBottom: '1px solid #bfdbfe' }}>
          <div>
            <h3 className="card__title" style={{ fontSize: '1.1rem', color: '#1e40af', margin: 0 }}>
              AI-Powered Purchasing Insights & Freshness Recommendations
            </h3>
            <p className="card__subtitle" style={{ margin: '0.25rem 0 0 0', color: '#3b82f6', fontSize: '0.85rem' }}>
              Strategic procurement recommendations based on freshness decay rates and wholesale price corridors
            </p>
          </div>
        </div>
        <div className="card__body" style={{ padding: '1.25rem 1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
            <div style={{ background: '#ffffff', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontWeight: 600, color: '#1e40af', fontSize: '0.85rem' }}>FRESHNESS-OPTIMIZED CROPS</div>
              <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.85rem', color: '#475569', lineHeight: 1.5 }}>
                Top quality lots: <strong>{freshnessData?.items.filter((i: any) => i.freshnessScore >= 80).slice(0, 3).map((i: any) => `${i.cropType} (${i.farmerName})`).join(', ') || 'Tomato, Carrot'}</strong> with {'>'}80% freshness score.
              </p>
            </div>
            <div style={{ background: '#ffffff', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontWeight: 600, color: '#059669', fontSize: '0.85rem' }}>FAIR PRICE BENCHMARK</div>
              <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.85rem', color: '#475569', lineHeight: 1.5 }}>
                Average fair price corridor is <strong>Rs. 185 - 240/kg</strong> across bulk staples. Place orders at Grade B rates for optimal farmer-buyer transaction clearing.
              </p>
            </div>
            <div style={{ background: '#ffffff', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontWeight: 600, color: '#d97706', fontSize: '0.85rem' }}>SHORTAGE RISK ADVISORY</div>
              <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.85rem', color: '#475569', lineHeight: 1.5 }}>
                Regional transit bottlenecks detected in Badulla & Jaffna routes. Consider multi-stop consolidated orders to reduce freight overhead.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. SECTION: AVAILABLE FARMERS' REGISTERED CROPS & HARVESTS (Immediately Below Price Trends Button) */}
      <section className="card" style={{ borderRadius: '12px', overflow: 'hidden' }}>
        <div className="card__header" style={{ padding: '1.25rem 1.5rem', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 className="card__title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', color: '#166534' }}>
              <span>🌾</span>
              Available Farmers' Registered Crops & Harvests
            </h3>
            <p className="card__subtitle" style={{ marginTop: '0.25rem' }}>
              Explore real-time crop inventory listed by certified farmers across Sri Lanka and place direct purchase orders
            </p>
          </div>
          <span className="badge badge--success" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>
            {filteredCrops.length} Harvests In Stock
          </span>
        </div>

        {/* Search & Filter Toolbar */}
        <div style={{ padding: '1rem 1.5rem', background: '#ffffff', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '1 1 200px', position: 'relative' }}>
            <Search size={16} color="#64748b" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search by product or farmer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '0.5rem 0.75rem 0.5rem 2.25rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>Category:</span>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              style={{ padding: '0.45rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
            >
              <option value="all">All Crops</option>
              {PRODUCTS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>District:</span>
            <select
              value={filterDistrict}
              onChange={(e) => setFilterDistrict(e.target.value)}
              style={{ padding: '0.45rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
            >
              <option value="all">All Locations</option>
              {['Nuwara Eliya', 'Badulla', 'Dambulla', 'Kandy', 'Bandarawela', 'Jaffna', 'Anuradhapura'].map((loc) => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              style={{ padding: '0.45rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
            >
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="qty_desc">Available Qty: High to Low</option>
            </select>
          </div>
        </div>

        {/* Available Crops Grid / Cards */}
        <div style={{ padding: '1.5rem', background: '#fafaf9' }}>
          {farmersLoading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>Loading available crop harvests...</div>
          ) : filteredCrops.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
              No crops found matching your filters. Try adjusting your search criteria.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
              {filteredCrops.map((crop) => {
                const reserved = crop.reservedKg || 0;
                const completed = crop.completedKg || 0;
                const avail = Math.max(0, crop.quantityKg - reserved - completed);

                return (
                  <div
                    key={crop.id}
                    style={{
                      background: '#ffffff',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      padding: '1.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                      transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                        <div>
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#166534', background: '#dcfce7', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                            Grade {crop.qualityGrade}
                          </span>
                          <h4 style={{ margin: '0.4rem 0 0', fontSize: '1.15rem', color: '#1e293b', fontWeight: 700 }}>
                            {crop.cropType}
                          </h4>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a' }}>
                            {formatCurrency(crop.pricePerKg)}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>per kg</span>
                        </div>
                      </div>

                      <div style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '0.75rem' }}>
                        Farmer: <strong>{crop.name}</strong>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.8rem', color: '#64748b', background: '#f8fafc', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Available Quantity:</span>
                          <strong style={{ color: '#166534' }}>{formatWeight(avail)}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Origin Location:</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', color: '#334155' }}>
                            <MapPin size={12} />
                            {crop.location}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Harvest Date:</span>
                          <span>{crop.availableFrom ? formatDate(crop.availableFrom) : 'Immediate'}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Status:</span>
                          <span style={{ color: '#16a34a', fontWeight: 600 }}>Ready for Dispatch</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleOpenOrder(crop)}
                      className="btn btn--primary"
                      style={{
                        width: '100%',
                        padding: '0.65rem',
                        fontSize: '0.9rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        borderRadius: '8px',
                        background: '#166534',
                      }}
                    >
                      <ShoppingCart size={16} />
                      Order Now
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* EDIT DEMAND MODAL */}
      {editingDemand && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: '#ffffff', borderRadius: '14px', width: '100%', maxWidth: '520px', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
            <div style={{ padding: '1.25rem 1.5rem', background: '#fffaf5', borderBottom: '1px solid #fed7aa', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: '#9a3412' }}>Edit Demand Requirement (#{editingDemand.id})</h3>
              <button onClick={() => setEditingDemand(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleUpdateDemandSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>Required Product</label>
                <select
                  value={editDemandForm.requiredCropType}
                  onChange={(e) => setEditDemandForm({ ...editDemandForm, requiredCropType: e.target.value as Product })}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #d1d5db' }}
                  required
                >
                  {PRODUCTS.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>Required Quantity (kg)</label>
                  <input
                    type="number"
                    min="1"
                    value={editDemandForm.requiredQuantityKg}
                    onChange={(e) => setEditDemandForm({ ...editDemandForm, requiredQuantityKg: Number(e.target.value) })}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #d1d5db' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>Max Acceptable Price (LKR/kg)</label>
                  <input
                    type="number"
                    min="1"
                    value={editDemandForm.maxPricePerKg}
                    onChange={(e) => setEditDemandForm({ ...editDemandForm, maxPricePerKg: Number(e.target.value) })}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #d1d5db' }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>Delivery Location</label>
                  <select
                    value={editDemandForm.location}
                    onChange={(e) => setEditDemandForm({ ...editDemandForm, location: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #d1d5db' }}
                  >
                    {LOCATIONS.map((loc) => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>Demand Status</label>
                  <select
                    value={editDemandForm.demandStatus}
                    onChange={(e) => setEditDemandForm({ ...editDemandForm, demandStatus: e.target.value as any })}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #d1d5db' }}
                  >
                    <option value="Active">Active</option>
                    <option value="Pending">Pending</option>
                    <option value="Fulfilled">Fulfilled</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>Required Delivery Date</label>
                <input
                  type="date"
                  value={editDemandForm.requiredFrom}
                  onChange={(e) => setEditDemandForm({ ...editDemandForm, requiredFrom: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #d1d5db' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>Additional Specifications</label>
                <textarea
                  value={editDemandForm.description}
                  onChange={(e) => setEditDemandForm({ ...editDemandForm, description: e.target.value })}
                  rows={2}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #d1d5db' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setEditingDemand(null)}
                  className="btn btn--outline"
                  style={{ padding: '0.55rem 1rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateBuyerMutation.isPending}
                  className="btn btn--primary"
                  style={{ padding: '0.55rem 1.25rem', background: '#ea580c' }}
                >
                  {updateBuyerMutation.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE DEMAND CONFIRMATION MODAL */}
      {deletingDemand && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: '#ffffff', borderRadius: '12px', width: '100%', maxWidth: '440px', padding: '1.5rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#b91c1c', marginBottom: '1rem' }}>
              <AlertCircle size={28} />
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600 }}>Confirm Requirement Deletion</h3>
            </div>
            <p style={{ color: '#4b5563', fontSize: '0.95rem', lineHeight: 1.5, margin: '0 0 1.5rem' }}>
              Are you sure you want to delete demand requirement <strong>#{deletingDemand.id}</strong> for {formatWeight(deletingDemand.requiredQuantityKg)} of {deletingDemand.requiredCropType}?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                onClick={() => setDeletingDemand(null)}
                className="btn btn--outline"
                style={{ padding: '0.55rem 1rem' }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteDemandConfirm}
                disabled={deleteBuyerMutation.isPending}
                className="btn btn--primary"
                style={{ padding: '0.55rem 1.25rem', background: '#dc2626' }}
              >
                {deleteBuyerMutation.isPending ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ORDER PLACEMENT MODAL */}
      {orderingCrop && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: '#ffffff', borderRadius: '14px', width: '100%', maxWidth: '500px', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
            <div style={{ padding: '1.25rem 1.5rem', background: '#f0fdf4', borderBottom: '1px solid #bbf7d0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShoppingCart size={20} color="#166534" />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: '#166534' }}>
                  Place Direct Order ({orderingCrop.cropType})
                </h3>
              </div>
              <button onClick={() => setOrderingCrop(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handlePlaceOrderSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              {/* Selected Crop & Farmer Info Box */}
              <div style={{ background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Producer / Farmer:</span>
                  <strong>{orderingCrop.name} (#{orderingCrop.id})</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Farm Location:</span>
                  <span>{orderingCrop.location}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Available Stock:</span>
                  <strong style={{ color: '#166534' }}>
                    {formatWeight(Math.max(0, orderingCrop.quantityKg - (orderingCrop.reservedKg || 0) - (orderingCrop.completedKg || 0)))}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Expected Price:</span>
                  <strong>{formatCurrency(orderingCrop.pricePerKg)}/kg</strong>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: '#374151' }}>
                  Required Order Quantity (kg) *
                </label>
                <input
                  type="number"
                  min="1"
                  max={Math.max(1, orderingCrop.quantityKg - (orderingCrop.reservedKg || 0) - (orderingCrop.completedKg || 0))}
                  step="1"
                  value={orderQuantityKg}
                  onChange={(e) => setOrderQuantityKg(Number(e.target.value))}
                  style={{ width: '100%', padding: '0.65rem 0.75rem', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.95rem' }}
                  required
                />
              </div>

              {/* Automatically Calculated Total Price */}
              <div style={{ background: '#eff6ff', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid #bfdbfe', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.9rem', color: '#1e40af', fontWeight: 500 }}>Estimated Total Price:</span>
                <span style={{ fontSize: '1.25rem', color: '#1e40af', fontWeight: 700 }}>
                  {formatCurrency(orderQuantityKg * orderingCrop.pricePerKg)}
                </span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: '#374151' }}>
                  Contact Phone Number *
                </label>
                <input
                  type="text"
                  value={buyerContact}
                  onChange={(e) => setBuyerContact(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.9rem' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: '#374151' }}>
                  Delivery Note / Instructions (Optional)
                </label>
                <textarea
                  value={orderNote}
                  onChange={(e) => setOrderNote(e.target.value)}
                  placeholder="Delivery timing, unloading gate, packing requirements..."
                  rows={2}
                  style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.9rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.25rem' }}>
                <button
                  type="button"
                  onClick={() => setOrderingCrop(null)}
                  className="btn btn--outline"
                  style={{ padding: '0.6rem 1.25rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createOrderMutation.isPending}
                  className="btn btn--primary"
                  style={{ padding: '0.6rem 1.5rem', background: '#166534', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <ShoppingCart size={16} />
                  {createOrderMutation.isPending ? 'Placing Order...' : 'Confirm Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BuyerDashboardView;
