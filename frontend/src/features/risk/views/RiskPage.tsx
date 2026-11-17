import React from 'react';
import { useSupplyRisk } from '@/features/intelligence/hooks/useIntelligence';
import { useScenarioStore } from '@/core/store/scenarioStore';
import { AlertOctagon, AlertTriangle, ShieldCheck, Info, CheckCircle2 } from 'lucide-react';
import SimulatedBadge from '@/shared/components/SimulatedBadge';

export const RiskPage: React.FC = () => {
  const scenarioId = useScenarioStore((s) => s.scenarioId);
  const { data, isLoading, error } = useSupplyRisk(scenarioId);

  if (isLoading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <AlertOctagon className="animate-spin" size={32} style={{ color: '#dc2626', margin: '0 auto 1rem' }} />
        <h3>Scanning Regional Supply Bottlenecks & Deficits...</h3>
      </div>
    );
  }

  if (error || !data) {
    return <div style={{ padding: '2rem', color: '#ef4444' }}>Failed to load supply risk monitor.</div>;
  }

  const getRiskColor = (cat: string) => {
    switch (cat) {
      case 'Critical':
        return '#dc2626';
      case 'High':
        return '#ea580c';
      case 'Medium':
        return '#d97706';
      default:
        return '#16a34a';
    }
  };

  return (
    <div className="intelligence-page" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #991b1b 0%, #dc2626 100%)',
          color: '#fff',
          padding: '1.5rem',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(220, 38, 38, 0.15)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <AlertOctagon size={24} style={{ color: '#fecaca' }} />
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>Supply Risk Prediction & Early Warning</h2>
            <SimulatedBadge compact />
          </div>
          <p style={{ margin: 0, opacity: 0.9, fontSize: '0.9rem' }}>
            Predicts district-level crop shortfalls, supply-demand imbalances, and cross-district haulage vulnerabilities.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div className="card" style={{ padding: '1rem', background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
          <div style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>System Risk Level</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: getRiskColor(data.overallRiskCategory), marginTop: '0.25rem' }}>
            {data.overallRiskCategory} Risk
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>Overall Score: {data.overallRiskScore}/100</div>
        </div>

        <div className="card" style={{ padding: '1rem', background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
          <div style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Monitored Districts</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginTop: '0.25rem' }}>
            {data.districts.length} Regions
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>Active agricultural nodes</div>
        </div>

        <div className="card" style={{ padding: '1rem', background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
          <div style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Active Early Warnings</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: data.alerts.length > 0 ? '#ea580c' : '#16a34a', marginTop: '0.25rem' }}>
            {data.alerts.length} Alerts
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>Actionable policy advisories</div>
        </div>
      </div>

      {/* Early Warning Alerts */}
      <div className="card" style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.15rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertTriangle size={18} style={{ color: '#ea580c' }} />
          Active Strategic Supply Advisories
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {data.alerts.map((alert: any) => (
            <div
              key={alert.id}
              style={{
                borderLeft: `4px solid ${alert.level === 'critical' ? '#dc2626' : alert.level === 'warning' ? '#ea580c' : '#0284c7'}`,
                background: alert.level === 'critical' ? '#fef2f2' : alert.level === 'warning' ? '#fffbeb' : '#f0f9ff',
                padding: '1rem 1.25rem',
                borderRadius: '0 8px 8px 0',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '1rem' }}>{alert.title}</span>
                <span
                  style={{
                    textTransform: 'uppercase',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: alert.level === 'critical' ? '#fee2e2' : alert.level === 'warning' ? '#fef3c7' : '#e0f2fe',
                    color: alert.level === 'critical' ? '#b91c1c' : alert.level === 'warning' ? '#b45309' : '#0369a1',
                  }}
                >
                  {alert.level}
                </span>
              </div>
              <p style={{ margin: '0.5rem 0', color: '#475569', fontSize: '0.9rem' }}>{alert.description}</p>
              <div style={{ fontSize: '0.85rem', color: '#0f172a', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={14} style={{ color: '#16a34a' }} />
                <strong>Recommended Action:</strong> {alert.recommendedAction}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* District Vulnerability Matrix */}
      <div className="card" style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.15rem', color: '#0f172a' }}>
          District-Level Supply Balance & Deficit Risk
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b' }}>
                <th style={{ padding: '10px 12px' }}>District</th>
                <th style={{ padding: '10px 12px' }}>Supply (kg)</th>
                <th style={{ padding: '10px 12px' }}>Demand (kg)</th>
                <th style={{ padding: '10px 12px' }}>Deficit / Surplus (kg)</th>
                <th style={{ padding: '10px 12px' }}>Key Deficit Crop</th>
                <th style={{ padding: '10px 12px' }}>Risk Score</th>
                <th style={{ padding: '10px 12px' }}>Risk Category</th>
              </tr>
            </thead>
            <tbody>
              {data.districts.map((d: any) => (
                <tr key={d.district} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 700 }}>{d.district}</td>
                  <td style={{ padding: '10px 12px' }}>{d.supplyKg.toLocaleString()}</td>
                  <td style={{ padding: '10px 12px' }}>{d.demandKg.toLocaleString()}</td>
                  <td style={{ padding: '10px 12px', fontWeight: 600, color: d.shortageKg > 0 ? '#dc2626' : '#16a34a' }}>
                    {d.shortageKg > 0 ? `-${d.shortageKg.toLocaleString()}` : 'Balanced'}
                  </td>
                  <td style={{ padding: '10px 12px' }}>{d.primaryDeficitCrop ?? 'None'}</td>
                  <td style={{ padding: '10px 12px', fontWeight: 700 }}>{d.riskScore}/100</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        background: `${getRiskColor(d.riskCategory)}15`,
                        color: getRiskColor(d.riskCategory),
                      }}
                    >
                      {d.riskCategory}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
