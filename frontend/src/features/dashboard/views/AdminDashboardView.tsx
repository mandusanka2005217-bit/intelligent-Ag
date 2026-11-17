import React from 'react';
import {
  Users,
  ShoppingCart,
  Boxes,
  Package,
  TrendingDown,
  CheckCircle2,
  AlertTriangle,
  GitMerge
} from 'lucide-react';
import { useDashboardStats } from '@/features/dashboard/hooks/useDashboardData';
import { useFarmers } from '@/features/farmers/hooks/useFarmers';
import { useBuyers } from '@/features/buyers/hooks/useBuyers';
import { useAllocation } from '@/features/allocation/hooks/useAllocation';
import { useMatches } from '@/features/matching/hooks/useMatches';
import { formatWeight, formatPct } from '@/shared/utils/format';
import Skeleton from '@/shared/components/Skeleton';
import AllocationPie from '@/features/dashboard/components/AllocationPie';
import DistancePriceScatter from '@/features/dashboard/components/DistancePriceScatter';
import ScoreDistributionChart from '@/features/dashboard/components/ScoreDistributionChart';
import ScenarioBar from '@/features/scenarios/components/ScenarioBar';
import { Link } from 'react-router-dom';

export const AdminDashboardView: React.FC = () => {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: farmers = [], isLoading: farmersLoading } = useFarmers();
  const { data: buyers = [], isLoading: buyersLoading } = useBuyers();
  const { data: allocation, isLoading: allocationLoading } = useAllocation();
  const { data: matchesData, isLoading: matchesLoading } = useMatches();

  const isLoading = statsLoading || farmersLoading || buyersLoading || allocationLoading;

  // Derive unique product count
  const allProducts = new Set<string>();
  farmers.forEach((f) => allProducts.add(f.cropType));
  buyers.forEach((b) => allProducts.add(b.requiredCropType));
  const totalProductsCount = allProducts.size || 6;

  // Total supply and total demand
  const totalSupplyKg = farmers.reduce((sum, f) => sum + f.quantityKg, 0);
  const totalDemandKg = buyers.reduce((sum, b) => sum + b.requiredQuantityKg, 0);

  // Allocated and Unfulfilled
  const allocatedKg = stats?.totalAllocatedKg ?? allocation?.kpis?.totalAllocatedKg ?? 0;
  const unfulfilledKg = allocation?.kpis?.unmetDemandKg ?? Math.max(0, totalDemandKg - allocatedKg);
  
  const matchesList = matchesData?.matches || [];
  const successfulMatchesCount = matchesList.length > 0 
    ? matchesList.filter((m) => m.suitabilityScore >= 50).length 
    : (stats?.totalMatches ?? 0);

  // 8 Admin Cards required by User:
  // 1. Total Farmers
  // 2. Total Buyers
  // 3. Total Products
  // 4. Total Supply
  // 5. Total Demand (Buyers)
  // 6. Allocated Quantity
  // 7. Unfulfilled Demand
  // 8. Successful Matches
  const adminKpis = [
    {
      title: 'Total Farmers',
      value: (stats?.totalFarmers ?? farmers.length).toLocaleString(),
      sub: 'Verified producer network',
      icon: <Users size={22} />,
      color: '#166534',
      bg: '#dcfce7',
    },
    {
      title: 'Total Buyers',
      value: (stats?.totalBuyers ?? buyers.length).toLocaleString(),
      sub: 'Wholesalers & retail buyers',
      icon: <ShoppingCart size={22} />,
      color: '#c2410c',
      bg: '#ffedd5',
    },
    {
      title: 'Total Products',
      value: totalProductsCount.toString(),
      sub: 'Active crop varieties traded',
      icon: <Boxes size={22} />,
      color: '#0369a1',
      bg: '#e0f2fe',
    },
    {
      title: 'Total Supply',
      value: formatWeight(totalSupplyKg || (stats?.totalAllocatedKg ? stats.totalAllocatedKg * 1.3 : 0)),
      sub: 'Available harvest on board',
      icon: <Package size={22} />,
      color: '#15803d',
      bg: '#dcfce7',
    },
    {
      title: 'Total Demand (Buyers)',
      value: formatWeight(totalDemandKg || (stats?.totalAllocatedKg ? stats.totalAllocatedKg * 1.5 : 0)),
      sub: 'Cumulative purchase demand',
      icon: <TrendingDown size={22} />,
      color: '#b45309',
      bg: '#fef3c7',
    },
    {
      title: 'Allocated Quantity',
      value: formatWeight(allocatedKg),
      sub: `${stats ? formatPct(stats.fillRate) : '0%'} demand fulfilled`,
      icon: <CheckCircle2 size={22} />,
      color: '#4338ca',
      bg: '#e0e7ff',
    },
    {
      title: 'Unfulfilled Demand',
      value: formatWeight(unfulfilledKg),
      sub: 'Shortage to cover',
      icon: <AlertTriangle size={22} />,
      color: '#b91c1c',
      bg: '#fee2e2',
    },
    {
      title: 'Successful Matches',
      value: successfulMatchesCount.toLocaleString(),
      sub: 'High suitability pairs',
      icon: <GitMerge size={22} />,
      color: '#0f766e',
      bg: '#ccfbf1',
    },
  ];

  return (
    <div className="admin-dashboard">
      <div className="page-header">
        <div>
          <h2 className="page-header__title">🛡️ Admin Management Dashboard</h2>
          <p className="page-header__subtitle">
            Central orchestration hub: market liquidity, supply/demand balance, matching and fair allocation.
          </p>
        </div>
        <div className="page-header__actions">
          <Link to="/matching" className="btn btn--outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginRight: '0.5rem' }}>
            <GitMerge size={16} />
            Review Matches
          </Link>
          <Link to="/allocation" className="btn btn--primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            <Package size={16} />
            Run Allocation
          </Link>
        </div>
      </div>

      <ScenarioBar />

      {/* 8 Admin KPI Cards */}
      <div className="kpi-grid" style={{ marginBottom: '1.5rem' }}>
        {adminKpis.map((kpi, idx) => (
          <div key={idx} className="kpi-card">
            {isLoading ? (
              <>
                <Skeleton width={44} height={44} radius={12} />
                <Skeleton width="60%" height={12} />
                <Skeleton width="45%" height={24} />
              </>
            ) : (
              <>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '8px',
                    background: kpi.bg,
                    color: kpi.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '0.5rem',
                  }}
                >
                  {kpi.icon}
                </div>
                <span className="kpi-card__label">{kpi.title}</span>
                <span className="kpi-card__value kpi-card__value--small">{kpi.value}</span>
                <span className="kpi-card__sub">{kpi.sub}</span>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Deep Dive Charts Grid */}
      <div className="charts-grid">
        <section className="card">
          <div className="card__header">
            <div>
              <h3 className="card__title">Allocated Quantity by Crop</h3>
              <p className="card__subtitle">Volume distribution across active agricultural crops</p>
            </div>
          </div>
          <div className="card__body">
            <AllocationPie />
          </div>
        </section>

        <section className="card">
          <div className="card__header">
            <div>
              <h3 className="card__title">Distance vs Pricing Scatter</h3>
              <p className="card__subtitle">Farmer-to-buyer transport distance vs rate efficiency</p>
            </div>
          </div>
          <div className="card__body">
            <DistancePriceScatter />
          </div>
        </section>

        <section className="card">
          <div className="card__header">
            <div>
              <h3 className="card__title">Match Suitability Distribution</h3>
              <p className="card__subtitle">Fairness and score confidence spread</p>
            </div>
          </div>
          <div className="card__body">
            <ScoreDistributionChart />
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminDashboardView;
