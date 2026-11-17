import React from 'react';
import { Users, ShoppingCart, GitMerge, TrendingUp } from 'lucide-react';
import { formatScore } from '@/shared/utils/format';
import type { DashboardStats } from '../hooks/useDashboardData';

interface KpiCardsProps {
  stats: DashboardStats | undefined;
  isLoading?: boolean;
}

interface KpiCardItem {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  iconColor: string;
  iconBg: string;
}

const KpiCards: React.FC<KpiCardsProps> = ({ stats, isLoading = false }) => {
  if (isLoading || !stats) {
    return (
      <div className="kpi-grid">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="kpi-card" style={{ opacity: 0.5 }}>
            <div style={{ height: 12, background: '#e5e7eb', borderRadius: 4, width: '60%' }} />
            <div style={{ height: 32, background: '#e5e7eb', borderRadius: 4, width: '40%', marginTop: 8 }} />
          </div>
        ))}
      </div>
    );
  }

  const cards: KpiCardItem[] = [
    {
      label: 'Total Farmers',
      value: stats.totalFarmers.toLocaleString(),
      icon: <Users size={22} />,
      iconColor: '#2d6a4f',
      iconBg: '#d8f3dc',
    },
    {
      label: 'Total Buyers',
      value: stats.totalBuyers.toLocaleString(),
      icon: <ShoppingCart size={22} />,
      iconColor: '#c56f28',
      iconBg: '#fde8cc',
    },
    {
      label: 'Matches Created',
      value: stats.totalMatches.toLocaleString(),
      icon: <GitMerge size={22} />,
      iconColor: '#3a86ff',
      iconBg: '#dbeafe',
    },
    {
      label: 'Avg. Suitability Score',
      value: formatScore(stats.avgSuitabilityScore),
      icon: <TrendingUp size={22} />,
      iconColor: '#52b788',
      iconBg: '#d8f3dc',
    },
  ];

  return (
    <div className="kpi-grid">
      {cards.map(({ label, value, icon, iconColor, iconBg }) => (
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
          <span className="kpi-card__value">{value}</span>
        </div>
      ))}
    </div>
  );
};

export default KpiCards;
