import React from 'react';
import { useFreshnessIntelligence } from '@/features/intelligence/hooks/useIntelligence';
import { useScenarioStore } from '@/core/store/scenarioStore';
import { Hourglass, AlertTriangle, ShieldCheck, Flame, Calendar, Award } from 'lucide-react';
import SimulatedBadge from '@/shared/components/SimulatedBadge';

export const FreshnessPage: React.FC = () => {
  const scenarioId = useScenarioStore((s) => s.scenarioId);
  const { data, isLoading, error } = useFreshnessIntelligence(scenarioId);

  if (isLoading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <Hourglass className="animate-spin" size={32} style={{ color: '#ea580c', margin: '0 auto 1rem' }} />
        <h3>Evaluating Crop Shelf-Life & Spoilage Dynamics...</h3>
      </div>
    );
  }

  if (error || !data) {
    return <div style={{ padding: '2rem', color: '#ef4444' }}>Failed to load freshness intelligence.</div>;
  }

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'Critical':
        return { bg: '#fee2e2', color: '#b91c1c', icon: <Flame size={12} /> };
      case 'High':
        return { bg: '#ffedd5', color: '#c2410c', icon: <AlertTriangle size={12} /> };
      case 'Medium':
        return { bg: '#fef3c7', color: '#b45309', icon: <Hourglass size={12} /> };
      default:
        return { bg: '#ecfdf5', color: '#047857', icon: <ShieldCheck size={12} /> };
    }
  };

  return (
    <div className="intelligence-page" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #c2410c 0%, #ea580c 100%)',
          color: '#fff',
          padding: '1.5rem',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(194, 65, 12, 0.15)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <Hourglass size={24} style={{ color: '#fed7aa' }} />
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>Perishable Product Intelligence & FEFO</h2>
            <SimulatedBadge compact />
          </div>
          <p style={{ margin: 0, opacity: 0.9, fontSize: '0.9rem' }}>
            Evaluates post-harvest shelf decay, assigns Freshness Priority Scores, and enforces First-Expire-First-Out (FEFO) allocation.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div className="card" style={{ padding: '1rem', background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
          <div style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Avg Freshness Score</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#16a34a', marginTop: '0.25rem' }}>
            {data.avgFreshnessScore} / 100
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>Across active harvest inventory</div>
        </div>

        <div className="card" style={{ padding: '1rem', background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
          <div style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Critical / High Risk</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ef4444', marginTop: '0.25rem' }}>
            {data.highRiskCount} Lots
          </div>
          <div style={{ fontSize: '0.8rem', color: '#ef4444', marginTop: '0.25rem' }}>Immediate dispatch required</div>
        </div>

        <div className="card" style={{ padding: '1rem', background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
          <div style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Near Expiry (≤3 Days)</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ea580c', marginTop: '0.25rem' }}>
            {data.nearExpiryCount} Harvests
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>FEFO Priority rank 1-5</div>
        </div>

        <div className="card" style={{ padding: '1rem', background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
          <div style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Dispatch Protocol</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginTop: '0.25rem' }}>
            FEFO Prioritization
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>Minimizes post-harvest food waste</div>
        </div>
      </div>

      {/* FEFO Table */}
      <div className="card" style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.15rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Award size={18} style={{ color: '#ea580c' }} />
          First-Expire-First-Out (FEFO) Dispatch Ranking
        </h3>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b' }}>
                <th style={{ padding: '10px 12px' }}>FEFO Rank</th>
                <th style={{ padding: '10px 12px' }}>Farmer</th>
                <th style={{ padding: '10px 12px' }}>Crop</th>
                <th style={{ padding: '10px 12px' }}>Harvest Date</th>
                <th style={{ padding: '10px 12px' }}>Age</th>
                <th style={{ padding: '10px 12px' }}>Remaining Shelf Life</th>
                <th style={{ padding: '10px 12px' }}>Freshness Score</th>
                <th style={{ padding: '10px 12px' }}>Spoilage Risk</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item: any) => {
                const badge = getRiskBadge(item.spoilageRisk);
                return (
                  <tr key={item.cropId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 700 }}>#{item.fefoRank}</td>
                    <td style={{ padding: '10px 12px' }}>{item.farmerName}</td>
                    <td style={{ padding: '10px 12px', fontWeight: 600 }}>{item.cropType}</td>
                    <td style={{ padding: '10px 12px', color: '#64748b' }}>{item.harvestDate}</td>
                    <td style={{ padding: '10px 12px' }}>{item.harvestAgeDays} days ago</td>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: item.remainingShelfLifeDays <= 3 ? '#b91c1c' : '#334155' }}>
                      {item.remainingShelfLifeDays} / {item.shelfLifeDays} days
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '60px', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${item.freshnessScore}%`,
                              height: '100%',
                              background: item.freshnessScore > 65 ? '#16a34a' : item.freshnessScore > 35 ? '#ea580c' : '#dc2626',
                            }}
                          />
                        </div>
                        <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{item.freshnessScore}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          background: badge.bg,
                          color: badge.color,
                          padding: '3px 8px',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                        }}
                      >
                        {badge.icon} {item.spoilageRisk}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
