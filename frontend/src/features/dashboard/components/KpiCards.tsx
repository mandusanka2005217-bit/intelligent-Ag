import React from 'react';
import {
  Users,
  ShoppingCart,
  GitMerge,
  TrendingUp,
  Package,
  Gauge,
  Truck,
  Scale,
} from 'lucide-react';
import type { DashboardStats } from '@contracts/types';
import Skeleton from '@/shared/components/Skeleton';
import { formatCurrency, formatPct, formatScore, formatWeight } from '@/shared/utils/format';

interface KpiCardsProps {
  stats: DashboardStats | undefined;
  isLoading?: boolean;
}

interface KpiCardItem {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  iconColor: string;
  iconBg: string;
}

const KpiCards: React.FC<KpiCardsProps> = ({ stats, isLoading = false }) => {
  if (isLoading || !stats) {
    return (
      <div className="kpi-grid">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="kpi-card">
            <Skeleton width={44} height={44} radius={12} />
            <Skeleton width="60%" height={11} />
            <Skeleton width="45%" height={26} />
          </div>
        ))}
      </div>
    );
  }

  const cards: KpiCardItem[] = [
    {
      label: 'Farmers',
      value: stats.totalFarmers.toLocaleString(),
      sub: 'registered suppliers',
      icon: <Users size={22} />,
      iconColor: '#2d6a4f',
      iconBg: '#d8f3dc',
    },
    {
      label: 'Buyers',
      value: stats.totalBuyers.toLocaleString(),
      sub: 'demand requirements',
      icon: <ShoppingCart size={22} />,
      iconColor: '#c56f28',
      iconBg: '#fde8cc',
    },
    {
      label: 'Feasible matches',
      value: stats.totalMatches.toLocaleString(),
      sub: 'of all scored pairs',
      icon: <GitMerge size={22} />,
      iconColor: '#3a86ff',
      iconBg: '#dbeafe',
    },
    {
      label: 'Avg. suitability',
      value: formatScore(stats.avgSuitabilityScore),
      sub: 'weighted 0–100 score',
      icon: <TrendingUp size={22} />,
      iconColor: '#52b788',
      iconBg: '#d8f3dc',
    },
    {
      label: 'Allocated',
      value: formatWeight(stats.totalAllocatedKg),
      sub: `${formatPct(stats.avgUtilizationPct)} of supply used`,
      icon: <Package size={22} />,
      iconColor: '#2d6a4f',
      iconBg: '#e6f4ea',
    },
    {
      label: 'Fill rate',
      value: formatPct(stats.fillRate),
      sub: 'demand satisfied',
      icon: <Gauge size={22} />,
      iconColor: '#6a4c93',
      iconBg: '#ede7f6',
    },
    {
      label: 'Transport cost',
      value: formatCurrency(stats.totalTransportCostRs),
      sub: 'allocated consignments',
      icon: <Truck size={22} />,
      iconColor: '#b45309',
      iconBg: '#fef3c7',
    },
    {
      label: "Jain's fairness",
      value: stats.jainIndex.toFixed(4),
      sub: '1.00 = perfectly even',
      icon: <Scale size={22} />,
      iconColor: '#0f766e',
      iconBg: '#ccfbf1',
    },
  ];

  return (
    <div className="kpi-grid">
      {cards.map(({ label, value, sub, icon, iconColor, iconBg }) => (
        <div key={label} className="kpi-card">
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 'var(--radius-md)',
              background: iconBg,
              color: iconColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '0.5rem',
            }}
          >
            {icon}
          </div>
          <span className="kpi-card__label">{label}</span>
          <span className="kpi-card__value kpi-card__value--small">{value}</span>
          {sub && <span className="kpi-card__sub">{sub}</span>}
        </div>
      ))}
    </div>
  );
};

export default KpiCards;
