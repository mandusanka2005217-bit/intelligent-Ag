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
  AlertCircle,
  Edit2,
  Trash2,
  TrendingUp,
  Inbox,
  X,
  FileText
} from 'lucide-react';
import { useFarmers, useCreateFarmer, useUpdateFarmer, useDeleteFarmer } from '@/features/farmers/hooks/useFarmers';
import { useOrders, useUpdateOrderStatus } from '@/features/buyers/hooks/useOrders';
import { useAuthStore } from '@/core/store/authStore';
import type { CreateFarmerDto, Farmer, Order, Product, QualityGrade, UpdateFarmerDto } from '@contracts/types';
import { formatCurrency, formatWeight, formatDate } from '@/shared/utils/format';
import { Link } from 'react-router-dom';
import { usePriceRecommendations, useFreshnessIntelligence, useDemandForecasting } from '@/features/intelligence/hooks/useIntelligence';

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

  const { data: allFarmers = [], isLoading: farmersLoading } = useFarmers();
  const createFarmerMutation = useCreateFarmer();
  const updateFarmerMutation = useUpdateFarmer();
  const deleteFarmerMutation = useDeleteFarmer();

  // Orders received for this farmer
  const { data: allOrders = [], isLoading: ordersLoading } = useOrders();
  const updateOrderStatusMutation = useUpdateOrderStatus();

  // Intelligence queries
  const { data: priceRecs } = usePriceRecommendations('A');
  const { data: freshnessData } = useFreshnessIntelligence('A');
  const { data: forecastData } = useDemandForecasting('A', 30);

  // Filter listings belonging to this farmer (by username or matching name/location)
  const myListings = allFarmers.filter(
    (f) =>
      f.name.toLowerCase() === user.name.toLowerCase() ||
      (user.username === 'farmer@demo.com' && (f.name.toLowerCase().includes('sunil') || f.id === 'F01' || f.id === 'F02'))
  );
  const displayListings = myListings.length > 0 ? myListings : allFarmers.slice(0, 3);

  // Filter orders received for this farmer's registered crops
  const myCropIds = new Set(displayListings.map((l) => l.id));
  const myReceivedOrders = allOrders.filter(
    (o) =>
      myCropIds.has(o.cropId) ||
      o.farmerName.toLowerCase() === user.name.toLowerCase() ||
      (user.username === 'farmer@demo.com' && (o.farmerId === 'F01' || o.farmerId === 'F02' || o.farmerName.toLowerCase().includes('sunil')))
  );

  // Form state for creating new crop
  const [productType, setProductType] = useState<Product>('Tomato');
  const [quantityKg, setQuantityKg] = useState<number>(500);
  const [pricePerKg, setPricePerKg] = useState<number>(180);
  const [location, setLocation] = useState<string>(user.location.split(',')[0] || 'Nuwara Eliya');
  const [qualityGrade, setQualityGrade] = useState<QualityGrade>('A');
  const [description, setDescription] = useState<string>('');

  // Edit Crop Modal state
  const [editingCrop, setEditingCrop] = useState<Farmer | null>(null);
  const [editForm, setEditForm] = useState<{
    cropType: Product;
    quantityKg: number;
    pricePerKg: number;
    location: string;
    qualityGrade: QualityGrade;
    availableFrom: string;
    description: string;
  }>({
    cropType: 'Tomato',
    quantityKg: 500,
    pricePerKg: 180,
    location: 'Nuwara Eliya',
    qualityGrade: 'A',
    availableFrom: '',
    description: '',
  });

  // Delete confirmation modal state
  const [deletingCrop, setDeletingCrop] = useState<Farmer | null>(null);

  // Order Details Modal state
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Reject reason modal state
  const [rejectingOrder, setRejectingOrder] = useState<Order | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');

  // Notifications
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4500);
  };

  // Handle Crop Registration
  const handleCreateSubmit = async (e: React.FormEvent) => {
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
        description,
      };
      await createFarmerMutation.mutateAsync(dto);
      showToast('success', `Successfully registered ${quantityKg}kg of ${productType}!`);
      setDescription('');
    } catch (err: any) {
      showToast('error', err?.response?.data?.error?.message || 'Failed to list crop');
    }
  };

  // Handle Edit Open
  const handleOpenEdit = (crop: Farmer) => {
    setEditingCrop(crop);
    setEditForm({
      cropType: crop.cropType,
      quantityKg: crop.quantityKg,
      pricePerKg: crop.pricePerKg,
      location: crop.location,
      qualityGrade: crop.qualityGrade,
      availableFrom: crop.availableFrom || '',
      description: crop.description || '',
    });
  };

  // Handle Update Crop Submit
  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCrop) return;
    try {
      const dto: UpdateFarmerDto = {
        cropType: editForm.cropType,
        quantityKg: Number(editForm.quantityKg),
        pricePerKg: Number(editForm.pricePerKg),
        location: editForm.location,
        qualityGrade: editForm.qualityGrade,
        minPricePerKg: Math.round(Number(editForm.pricePerKg) * 0.85),
        availableFrom: editForm.availableFrom,
        description: editForm.description,
      };
      await updateFarmerMutation.mutateAsync({ id: editingCrop.id, dto });
      showToast('success', `Crop ${editingCrop.cropType} (#${editingCrop.id}) updated successfully!`);
      setEditingCrop(null);
    } catch (err: any) {
      showToast('error', err?.response?.data?.error?.message || 'Failed to update crop');
    }
  };

  // Handle Delete Crop Submit
  const handleDeleteConfirm = async () => {
    if (!deletingCrop) return;
    try {
      await deleteFarmerMutation.mutateAsync(deletingCrop.id);
      showToast('success', `Crop record #${deletingCrop.id} removed successfully.`);
      setDeletingCrop(null);
    } catch (err: any) {
      showToast('error', err?.response?.data?.error?.message || 'Failed to delete crop');
    }
  };

  // Handle Order Accept
  const handleAcceptOrder = async (order: Order) => {
    try {
      await updateOrderStatusMutation.mutateAsync({
        orderId: order.id,
        dto: { orderStatus: 'Accepted' },
      });
      showToast('success', `Order ${order.id} accepted! Stock has been reserved.`);
    } catch (err: any) {
      showToast('error', err?.response?.data?.error?.message || 'Failed to accept order');
    }
  };

  // Handle Order Reject Submit
  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingOrder) return;
    try {
      await updateOrderStatusMutation.mutateAsync({
        orderId: rejectingOrder.id,
        dto: { orderStatus: 'Rejected', rejectionReason },
      });
      showToast('success', `Order ${rejectingOrder.id} has been rejected.`);
      setRejectingOrder(null);
      setRejectionReason('');
    } catch (err: any) {
      showToast('error', err?.response?.data?.error?.message || 'Failed to reject order');
    }
  };

  // Handle Order Complete
  const handleCompleteOrder = async (order: Order) => {
    try {
      await updateOrderStatusMutation.mutateAsync({
        orderId: order.id,
        dto: { orderStatus: 'Completed' },
      });
      showToast('success', `Order ${order.id} marked as Completed. Inventory updated.`);
    } catch (err: any) {
      showToast('error', err?.response?.data?.error?.message || 'Failed to complete order');
    }
  };

  // Inventory calculations
  const totalHarvestQuantity = displayListings.reduce((sum, item) => sum + item.quantityKg, 0);
  const totalReservedQuantity = displayListings.reduce((sum, item) => sum + (item.reservedKg || 0), 0);
  const totalCompletedSalesQuantity = displayListings.reduce((sum, item) => sum + (item.completedKg || 0), 0);
  const totalAvailableQuantity = Math.max(0, totalHarvestQuantity - totalReservedQuantity - totalCompletedSalesQuantity);

  return (
    <div className="farmer-dashboard-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
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
            <span>🌾</span> Farmer Management Dashboard
          </h2>
          <p className="page-header__subtitle">
            Welcome, <strong>{user.name}</strong> · Location: <strong>{user.location}</strong>
          </p>
        </div>
        <div className="page-header__actions">
          <span className="badge badge--success" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', borderRadius: '6px' }}>
            Verified Farmer Account: #{user.id}
          </span>
        </div>
      </div>

      {/* 4 Clear Inventory KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card" style={{ padding: '1.25rem' }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: '#d8f3dc', color: '#2d6a4f', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
            <Package size={22} />
          </div>
          <span className="kpi-card__label">Total Harvest Quantity</span>
          <span className="kpi-card__value kpi-card__value--small" style={{ margin: '0.25rem 0' }}>{formatWeight(totalHarvestQuantity)}</span>
          <span className="kpi-card__sub">{displayListings.length} listed crops</span>
        </div>

        <div className="kpi-card" style={{ padding: '1.25rem' }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: '#e0f2fe', color: '#0369a1', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
            <CheckCircle size={22} />
          </div>
          <span className="kpi-card__label">Available Quantity</span>
          <span className="kpi-card__value kpi-card__value--small" style={{ color: '#16a34a', margin: '0.25rem 0' }}>{formatWeight(totalAvailableQuantity)}</span>
          <span className="kpi-card__sub">Free for new orders</span>
        </div>

        <div className="kpi-card" style={{ padding: '1.25rem' }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: '#fef3c7', color: '#b45309', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
            <Clock size={22} />
          </div>
          <span className="kpi-card__label">Reserved Quantity</span>
          <span className="kpi-card__value kpi-card__value--small" style={{ color: '#d97706', margin: '0.25rem 0' }}>{formatWeight(totalReservedQuantity)}</span>
          <span className="kpi-card__sub">In accepted buyer orders</span>
        </div>

        <div className="kpi-card" style={{ padding: '1.25rem' }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: '#ede9fe', color: '#6d28d9', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
            <DollarSign size={22} />
          </div>
          <span className="kpi-card__label">Completed Sales</span>
          <span className="kpi-card__value kpi-card__value--small" style={{ color: '#7c3aed', margin: '0.25rem 0' }}>{formatWeight(totalCompletedSalesQuantity)}</span>
          <span className="kpi-card__sub">Successfully fulfilled</span>
        </div>
      </div>

      {/* Main Grid: Crop Listing Form & My Registered Crops */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.75rem', alignItems: 'start' }}>
        {/* Registration Form */}
        <section className="card" style={{ borderRadius: '12px', overflow: 'hidden' }}>
          <div className="card__header" style={{ padding: '1.25rem 1.5rem', background: '#fafdfa' }}>
            <div>
              <h3 className="card__title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.05rem', color: '#166534' }}>
                <PlusCircle size={20} color="#166534" />
                Register New Crop / Harvest
              </h3>
              <p className="card__subtitle" style={{ marginTop: '0.25rem' }}>Add produce to your farm inventory</p>
            </div>
          </div>
          <div className="card__body" style={{ padding: '1.5rem' }}>
            <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
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
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#374151', marginBottom: '0.4rem' }}>Harvest Quantity (kg) *</label>
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
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#374151', marginBottom: '0.4rem' }}>Expected Price (LKR/kg) *</label>
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
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#374151', marginBottom: '0.4rem' }}>Quality Grade</label>
                  <select
                    value={qualityGrade}
                    onChange={(e) => setQualityGrade(e.target.value as QualityGrade)}
                    style={{ width: '100%', padding: '0.65rem 0.75rem', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.9rem', background: '#ffffff' }}
                  >
                    <option value="A">Grade A (Premium)</option>
                    <option value="B">Grade B (Standard)</option>
                    <option value="C">Grade C (Commercial)</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#374151', marginBottom: '0.4rem' }}>Description / Harvest Notes</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Organic, harvested this morning, good freshness..."
                  rows={2}
                  style={{ width: '100%', padding: '0.65rem 0.75rem', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.9rem' }}
                />
              </div>

              <button
                type="submit"
                disabled={createFarmerMutation.isPending}
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
                  background: '#166534',
                }}
              >
                <PlusCircle size={18} />
                {createFarmerMutation.isPending ? 'Publishing...' : 'Publish Crop Listing'}
              </button>
            </form>
          </div>
        </section>

        {/* 1. SECTION: MY REGISTERED CROPS & HARVESTS (With Edit & Delete Buttons) */}
        <section className="card" style={{ borderRadius: '12px', overflow: 'hidden' }}>
          <div className="card__header" style={{ padding: '1.25rem 1.5rem', background: '#fafdfa' }}>
            <div>
              <h3 className="card__title" style={{ fontSize: '1.05rem', color: '#111827' }}>
                My Registered Crops & Harvests
              </h3>
              <p className="card__subtitle" style={{ marginTop: '0.25rem' }}>
                Manage your harvest items, update details, or remove listings
              </p>
            </div>
          </div>
          <div className="card__body" style={{ padding: 0 }}>
            {farmersLoading ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>Loading your crop records...</div>
            ) : displayListings.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
                No registered crops yet. Use the form to list your first harvest.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '0.85rem 1rem' }}>Crop</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Total / Avail</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Price (LKR)</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Location</th>
                      <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayListings.map((item) => {
                      const reserved = item.reservedKg || 0;
                      const completed = item.completedKg || 0;
                      const avail = Math.max(0, item.quantityKg - reserved - completed);
                      return (
                        <tr key={item.id}>
                          <td style={{ padding: '0.85rem 1rem' }}>
                            <strong style={{ color: '#166534' }}>{item.cropType}</strong>
                            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                              #{item.id} · Grade {item.qualityGrade}
                            </div>
                          </td>
                          <td style={{ padding: '0.85rem 1rem' }}>
                            <strong>{formatWeight(avail)}</strong>
                            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Total: {formatWeight(item.quantityKg)}</div>
                          </td>
                          <td style={{ padding: '0.85rem 1rem' }}>
                            <strong>{formatCurrency(item.pricePerKg)}</strong>/kg
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
                                onClick={() => handleOpenEdit(item)}
                                className="btn btn--outline btn--sm"
                                style={{ padding: '0.35rem 0.65rem', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem' }}
                                title="Edit this crop listing"
                              >
                                <Edit2 size={13} />
                                Edit
                              </button>
                              <button
                                onClick={() => setDeletingCrop(item)}
                                className="btn btn--outline btn--sm"
                                style={{ padding: '0.35rem 0.65rem', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', color: '#b91c1c', borderColor: '#fca5a5' }}
                                title="Delete this crop listing"
                              >
                                <Trash2 size={13} />
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
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
          <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: '#6b7280' }}>Check 90-day wholesale vegetable and crop pricing insights</p>
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

      {/* 4. SECTION: ORDERS RECEIVED FROM BUYERS (Immediately Below Price Trends Button) */}
      <section className="card" style={{ borderRadius: '12px', overflow: 'hidden' }}>
        <div className="card__header" style={{ padding: '1.25rem 1.5rem', background: '#fafdfa', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 className="card__title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', color: '#166534' }}>
              <Inbox size={22} color="#166534" />
              Orders Received from Buyers
            </h3>
            <p className="card__subtitle" style={{ marginTop: '0.25rem' }}>
              Procurement requests submitted by wholesale and retail buyers for your crops
            </p>
          </div>
          <span className="badge badge--neutral" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>
            {myReceivedOrders.length} Received Order(s)
          </span>
        </div>
        <div className="card__body" style={{ padding: 0 }}>
          {ordersLoading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>Loading received buyer orders...</div>
          ) : myReceivedOrders.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
              No buyer orders received yet. Active buyers will place direct purchase orders here.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '0.85rem 1rem' }}>Order ID</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Buyer</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Product & Qty</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Total Amount</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Destination</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Status</th>
                    <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {myReceivedOrders.map((order) => {
                    const statusBadgeColor =
                      order.orderStatus === 'Accepted'
                        ? { bg: '#dcfce7', text: '#166534' }
                        : order.orderStatus === 'Completed'
                        ? { bg: '#e0e7ff', text: '#3730a3' }
                        : order.orderStatus === 'Rejected'
                        ? { bg: '#fee2e2', text: '#991b1b' }
                        : { bg: '#fef3c7', text: '#92400e' };

                    return (
                      <tr key={order.id}>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#374151', fontSize: '0.85rem' }}>
                            {order.id}
                          </span>
                          <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{formatDate(order.createdAt)}</div>
                        </td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <strong>{order.buyerName}</strong>
                          {order.buyerContact && (
                            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{order.buyerContact}</div>
                          )}
                        </td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <strong>{order.cropType}</strong>
                          <div style={{ fontSize: '0.8rem', color: '#166534' }}>{formatWeight(order.quantityKg)}</div>
                        </td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <strong>{formatCurrency(order.totalAmount)}</strong>
                          <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>@ Rs. {order.pricePerKg}/kg</div>
                        </td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem' }}>
                            <MapPin size={13} color="#6b7280" />
                            {order.deliveryLocation}
                          </div>
                        </td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <span
                            style={{
                              background: statusBadgeColor.bg,
                              color: statusBadgeColor.text,
                              padding: '0.3rem 0.6rem',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                            }}
                          >
                            {order.orderStatus}
                          </span>
                        </td>
                        <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem', flexWrap: 'wrap' }}>
                            <button
                              onClick={() => setSelectedOrder(order)}
                              className="btn btn--outline btn--sm"
                              style={{ padding: '0.3rem 0.5rem', fontSize: '0.75rem' }}
                              title="View full order details"
                            >
                              Details
                            </button>

                            {order.orderStatus === 'Pending' && (
                              <>
                                <button
                                  onClick={() => handleAcceptOrder(order)}
                                  disabled={updateOrderStatusMutation.isPending}
                                  className="btn btn--primary btn--sm"
                                  style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', background: '#166534' }}
                                >
                                  Accept
                                </button>
                                <button
                                  onClick={() => {
                                    setRejectingOrder(order);
                                    setRejectionReason('');
                                  }}
                                  className="btn btn--outline btn--sm"
                                  style={{ padding: '0.3rem 0.5rem', fontSize: '0.75rem', color: '#b91c1c', borderColor: '#fca5a5' }}
                                >
                                  Reject
                                </button>
                              </>
                            )}

                            {order.orderStatus === 'Accepted' && (
                              <button
                                onClick={() => handleCompleteOrder(order)}
                                disabled={updateOrderStatusMutation.isPending}
                                className="btn btn--primary btn--sm"
                                style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', background: '#4338ca' }}
                              >
                                Complete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* SMART AGRICULTURAL INSIGHTS (AI RECOMMENDATIONS & HARVEST INTELLIGENCE) */}
      <section className="card" style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid #bbf7d0', background: '#f0fdf4' }}>
        <div className="card__header" style={{ padding: '1.25rem 1.5rem', background: '#dcfce7', borderBottom: '1px solid #bbf7d0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={20} color="#15803d" />
            <h3 className="card__title" style={{ fontSize: '1.1rem', color: '#166534', margin: 0 }}>
              Smart Agricultural Insights & Recommendations
            </h3>
          </div>
          <p className="card__subtitle" style={{ margin: '0.25rem 0 0 0', color: '#15803d', fontSize: '0.85rem' }}>
            Data-driven pricing corridors, crop perishability indicators, and high-demand forecasts for your harvests
          </p>
        </div>

        <div className="card__body" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Quick Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            {/* Price Recommendation Card */}
            <div style={{ background: '#ffffff', borderRadius: '10px', padding: '1rem', border: '1px solid #dcfce7' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#15803d', fontWeight: 600, fontSize: '0.85rem' }}>
                <DollarSign size={16} /> RECOMMENDED SELLING PRICES
              </div>
              <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem' }}>
                {priceRecs?.recommendations.slice(0, 3).map((rec: any) => (
                  <div key={rec.cropType} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '3px' }}>
                    <strong>{rec.cropType}</strong>
                    <span style={{ color: '#166534', fontWeight: 600 }}>Grade A: Rs. {rec.recommendedSellingPrice.gradeA}/kg</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Freshness / Spoilage Alert */}
            <div style={{ background: '#ffffff', borderRadius: '10px', padding: '1rem', border: '1px solid #dcfce7' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ea580c', fontWeight: 600, fontSize: '0.85rem' }}>
                <Clock size={16} /> HARVEST PERISHABILITY NOTICE
              </div>
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', color: '#475569', lineHeight: 1.5 }}>
                Average freshness score across regional supply is <strong>{freshnessData?.avgFreshnessScore ?? 85}/100</strong>.
                Tomatoes and Beans have ambient shelf-life under 8 days. Prioritize early delivery for optimal return.
              </p>
            </div>

            {/* High Demand Signals */}
            <div style={{ background: '#ffffff', borderRadius: '10px', padding: '1rem', border: '1px solid #dcfce7' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0284c7', fontWeight: 600, fontSize: '0.85rem' }}>
                <TrendingUp size={16} /> MARKET DEMAND FORECAST
              </div>
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', color: '#475569', lineHeight: 1.5 }}>
                Strong buyer demand projected for <strong>{forecastData?.topProducts.slice(0, 3).join(', ') ?? 'Tomato, Beans, Carrot'}</strong> over the next 30 days. Listing these crops yields the fastest matching times.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* EDIT CROP MODAL */}
      {editingCrop && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: '#ffffff', borderRadius: '14px', width: '100%', maxWidth: '520px', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
            <div style={{ padding: '1.25rem 1.5rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>Edit Crop Listing (#{editingCrop.id})</h3>
              <button onClick={() => setEditingCrop(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleUpdateSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>Product Category / Name</label>
                <select
                  value={editForm.cropType}
                  onChange={(e) => setEditForm({ ...editForm, cropType: e.target.value as Product })}
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
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>Available Quantity (kg)</label>
                  <input
                    type="number"
                    min="1"
                    value={editForm.quantityKg}
                    onChange={(e) => setEditForm({ ...editForm, quantityKg: Number(e.target.value) })}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #d1d5db' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>Expected Price (LKR/kg)</label>
                  <input
                    type="number"
                    min="1"
                    value={editForm.pricePerKg}
                    onChange={(e) => setEditForm({ ...editForm, pricePerKg: Number(e.target.value) })}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #d1d5db' }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>Location</label>
                  <select
                    value={editForm.location}
                    onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #d1d5db' }}
                  >
                    {LOCATIONS.map((loc) => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>Quality Grade</label>
                  <select
                    value={editForm.qualityGrade}
                    onChange={(e) => setEditForm({ ...editForm, qualityGrade: e.target.value as QualityGrade })}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #d1d5db' }}
                  >
                    <option value="A">Grade A</option>
                    <option value="B">Grade B</option>
                    <option value="C">Grade C</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>Harvest Date (Available From)</label>
                <input
                  type="date"
                  value={editForm.availableFrom}
                  onChange={(e) => setEditForm({ ...editForm, availableFrom: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #d1d5db' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>Description</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={2}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #d1d5db' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setEditingCrop(null)}
                  className="btn btn--outline"
                  style={{ padding: '0.55rem 1rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateFarmerMutation.isPending}
                  className="btn btn--primary"
                  style={{ padding: '0.55rem 1.25rem', background: '#166534' }}
                >
                  {updateFarmerMutation.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingCrop && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: '#ffffff', borderRadius: '12px', width: '100%', maxWidth: '440px', padding: '1.5rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#b91c1c', marginBottom: '1rem' }}>
              <AlertCircle size={28} />
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600 }}>Confirm Crop Deletion</h3>
            </div>
            <p style={{ color: '#4b5563', fontSize: '0.95rem', lineHeight: 1.5, margin: '0 0 1.5rem' }}>
              Are you sure you want to delete your <strong>{deletingCrop.cropType}</strong> listing (#{deletingCrop.id})? This will permanently remove {formatWeight(deletingCrop.quantityKg)} from your inventory.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                onClick={() => setDeletingCrop(null)}
                className="btn btn--outline"
                style={{ padding: '0.55rem 1rem' }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleteFarmerMutation.isPending}
                className="btn btn--primary"
                style={{ padding: '0.55rem 1.25rem', background: '#dc2626' }}
              >
                {deleteFarmerMutation.isPending ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECT ORDER WITH REASON MODAL */}
      {rejectingOrder && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: '#ffffff', borderRadius: '12px', width: '100%', maxWidth: '460px', padding: '1.5rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.15rem', color: '#991b1b', fontWeight: 600 }}>
              Reject Order #{rejectingOrder.id}
            </h3>
            <p style={{ color: '#4b5563', fontSize: '0.85rem', marginBottom: '1rem' }}>
              Provide an optional reason to inform the buyer ({rejectingOrder.buyerName}):
            </p>
            <form onSubmit={handleRejectSubmit}>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g., Insufficient harvest due to bad weather, already committed..."
                rows={3}
                style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.9rem', marginBottom: '1rem' }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setRejectingOrder(null)}
                  className="btn btn--outline"
                  style={{ padding: '0.55rem 1rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateOrderStatusMutation.isPending}
                  className="btn btn--primary"
                  style={{ padding: '0.55rem 1.25rem', background: '#dc2626' }}
                >
                  {updateOrderStatusMutation.isPending ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ORDER DETAILS MODAL */}
      {selectedOrder && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: '#ffffff', borderRadius: '14px', width: '100%', maxWidth: '500px', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
            <div style={{ padding: '1.25rem 1.5rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={18} color="#166534" />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>Order Details: {selectedOrder.id}</h3>
              </div>
              <button onClick={() => setSelectedOrder(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={20} />
              </button>
            </div>
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
                <span style={{ color: '#64748b' }}>Order Status:</span>
                <strong>{selectedOrder.orderStatus}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
                <span style={{ color: '#64748b' }}>Buyer Name:</span>
                <strong>{selectedOrder.buyerName}</strong>
              </div>
              {selectedOrder.buyerContact && (
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
                  <span style={{ color: '#64748b' }}>Buyer Contact:</span>
                  <span>{selectedOrder.buyerContact}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
                <span style={{ color: '#64748b' }}>Ordered Product:</span>
                <strong>{selectedOrder.cropType}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
                <span style={{ color: '#64748b' }}>Quantity:</span>
                <strong>{formatWeight(selectedOrder.quantityKg)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
                <span style={{ color: '#64748b' }}>Price Rate:</span>
                <span>{formatCurrency(selectedOrder.pricePerKg)}/kg</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
                <span style={{ color: '#64748b' }}>Total Amount:</span>
                <strong style={{ color: '#166534', fontSize: '1.05rem' }}>{formatCurrency(selectedOrder.totalAmount)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
                <span style={{ color: '#64748b' }}>Delivery Destination:</span>
                <span>{selectedOrder.deliveryLocation}</span>
              </div>
              {selectedOrder.orderNote && (
                <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '6px', marginTop: '0.5rem' }}>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Buyer Note:</span>
                  <span style={{ fontStyle: 'italic', color: '#334155' }}>"{selectedOrder.orderNote}"</span>
                </div>
              )}
              {selectedOrder.rejectionReason && (
                <div style={{ background: '#fef2f2', padding: '0.75rem', borderRadius: '6px', marginTop: '0.5rem', border: '1px solid #fecaca' }}>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: '#b91c1c', fontWeight: 600, textTransform: 'uppercase' }}>Rejection Reason:</span>
                  <span style={{ color: '#991b1b' }}>{selectedOrder.rejectionReason}</span>
                </div>
              )}
            </div>
            <div style={{ padding: '1rem 1.5rem', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setSelectedOrder(null)} className="btn btn--outline" style={{ padding: '0.45rem 1rem' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FarmerDashboardView;
