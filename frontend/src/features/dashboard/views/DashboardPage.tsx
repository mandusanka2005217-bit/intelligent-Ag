import React from 'react';
import KpiCards from '../components/KpiCards';
import ScoreDistributionChart from '../components/ScoreDistributionChart';
import DistancePriceScatter from '../components/DistancePriceScatter';
import AllocationPie from '../components/AllocationPie';
import { useDashboardStats } from '../hooks/useDashboardData';

const DashboardPage: React.FC = () => {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();

  return (
    <div>
      {/* Page header */}
      <div className="page-header">
        <div>
          <h2 className="page-header__title">Dashboard</h2>
          <p className="page-header__subtitle">Overview of agricultural supply and demand coordination</p>
        </div>
      </div>

      {/* KPI Cards */}
      <KpiCards stats={stats} isLoading={statsLoading} />

      {/* Charts grid */}
      <div className="charts-grid">
        {/* Score Distribution */}
        <div className="card">
          <div className="card__header">
            <h3 className="card__title">Suitability Score Distribution</h3>
          </div>
          <div className="card__body">
            <ScoreDistributionChart />
          </div>
        </div>

        {/* Distance vs Price */}
        <div className="card">
          <div className="card__header">
            <h3 className="card__title">Distance vs Price per kg</h3>
          </div>
          <div className="card__body">
            <DistancePriceScatter />
          </div>
        </div>

        {/* Allocation Pie */}
        <div className="card">
          <div className="card__header">
            <h3 className="card__title">Allocation Breakdown by Crop</h3>
          </div>
          <div className="card__body">
            <AllocationPie />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
