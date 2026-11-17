import React from 'react';
import { Sparkles } from 'lucide-react';
import { useScenarioStore } from '@core/store/scenarioStore';
import SimulatedBadge from '@/shared/components/SimulatedBadge';
import { DEMO_TODAY } from '@/shared/constants';
import { formatDate } from '@/shared/utils/format';
import ScenarioBar from '@/features/scenarios/components/ScenarioBar';
import AllocationPie from '../components/AllocationPie';
import DistancePriceScatter from '../components/DistancePriceScatter';
import KpiCards from '../components/KpiCards';
import ScoreDistributionChart from '../components/ScoreDistributionChart';
import { useDashboardStats } from '../hooks/useDashboardData';

const DashboardPage: React.FC = () => {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const scenarioId = useScenarioStore((state) => state.scenarioId);

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-header__title">Dashboard</h2>
          <p className="page-header__subtitle">
            Scenario {scenarioId} overview · demo date {formatDate(DEMO_TODAY)}
          </p>
        </div>
        <div className="page-header__actions">
          <SimulatedBadge />
        </div>
      </div>

      <ScenarioBar />

      <KpiCards stats={stats} isLoading={statsLoading} />

      <div className="charts-grid">
        <section className="card">
          <div className="card__header">
            <div>
              <h3 className="card__title">Suitability score distribution</h3>
              <p className="card__subtitle">Only feasible farmer–buyer pairs are scored</p>
            </div>
          </div>
          <div className="card__body">
            <ScoreDistributionChart />
          </div>
        </section>

        <section className="card">
          <div className="card__header">
            <div>
              <h3 className="card__title">Distance vs price</h3>
              <p className="card__subtitle">Each point is a feasible pair, coloured by crop</p>
            </div>
          </div>
          <div className="card__body">
            <DistancePriceScatter />
          </div>
        </section>

        <section className="card">
          <div className="card__header">
            <div>
              <h3 className="card__title">Allocation by crop</h3>
              <p className="card__subtitle">Kilograms moved per product line</p>
            </div>
          </div>
          <div className="card__body">
            <AllocationPie />
          </div>
        </section>
      </div>

      <div className="dashboard-note">
        <Sparkles size={16} aria-hidden="true" />
        <div>
          <strong>Everything here is simulated.</strong> The 15 farmers, 8 buyers and 90 days of price
          history are generated for this demonstration. Prices are static snapshots, not a live feed,
          and transport distance is approximated as haversine × 1.3.
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
