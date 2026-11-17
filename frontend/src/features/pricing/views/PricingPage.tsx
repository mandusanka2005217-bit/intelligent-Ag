import React from 'react';
import { usePriceRecommendations } from '@/features/intelligence/hooks/useIntelligence';
import { useScenarioStore } from '@/core/store/scenarioStore';
import { DollarSign, Tag, TrendingUp, Layers, CheckCircle } from 'lucide-react';
import SimulatedBadge from '@/shared/components/SimulatedBadge';

export const PricingPage: React.FC = () => {
  const scenarioId = useScenarioStore((s) => s.scenarioId);
  const { data, isLoading, error } = usePriceRecommendations(scenarioId);

  if (isLoading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <DollarSign className="animate-spin" size={32} style={{ color: '#16a34a', margin: '0 auto 1rem' }} />
        <h3>Computing Fair Price Corridors & Elasticity Bands...</h3>
      </div>
    );
  }

  if (error || !data) {
    return <div style={{ padding: '2rem', color: '#ef4444' }}>Failed to load price recommendations.</div>;
  }

  return (
    <div className="intelligence-page" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #15803d 0%, #16a34a 100%)',
          color: '#fff',
          padding: '1.5rem',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(22, 163, 74, 0.15)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <Tag size={24} style={{ color: '#bbf7d0' }} />
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>Intelligent Price Recommendation Engine</h2>
            <SimulatedBadge compact />
          </div>
          <p style={{ margin: 0, opacity: 0.9, fontSize: '0.9rem' }}>
            Calculates fair Grade A/B/C pricing corridors, transport friction deductions, and guarantees net farmer proceeds.
          </p>
        </div>
      </div>

      {/* Grid of Recommendations */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {data.recommendations.map((rec: any) => (
          <div
            key={rec.cropType}
            className="card"
            style={{
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a', fontWeight: 700 }}>{rec.cropType}</h3>
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                  Market: <strong>Rs. {rec.marketPrice}/kg</strong>
                </span>
              </div>

              {/* Quality Grade Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', margin: '0.75rem 0' }}>
                <div style={{ background: '#ecfdf5', padding: '0.5rem', borderRadius: '6px', textAlign: 'center', border: '1px solid #a7f3d0' }}>
                  <div style={{ fontSize: '0.7rem', color: '#047857', fontWeight: 700 }}>GRADE A (Premium)</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#065f46', marginTop: '2px' }}>
                    Rs. {rec.recommendedSellingPrice.gradeA}
                  </div>
                </div>

                <div style={{ background: '#f0fdf4', padding: '0.5rem', borderRadius: '6px', textAlign: 'center', border: '1px solid #bbf7d0' }}>
                  <div style={{ fontSize: '0.7rem', color: '#16a34a', fontWeight: 700 }}>GRADE B (Standard)</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#15803d', marginTop: '2px' }}>
                    Rs. {rec.recommendedSellingPrice.gradeB}
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '0.5rem', borderRadius: '6px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700 }}>GRADE C (Economy)</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#334155', marginTop: '2px' }}>
                    Rs. {rec.recommendedSellingPrice.gradeC}
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '0.85rem', color: '#475569', margin: '0.5rem 0', lineHeight: 1.4 }}>
                {rec.rationale}
              </div>
            </div>

            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem', marginTop: '0.5rem', fontSize: '0.8rem', color: '#64748b' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Buyer Willingness Avg:</span>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>Rs. {rec.buyerMaxAverage}/kg</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
                <span>Est. Farmer Net Proceeds (Grade B):</span>
                <span style={{ fontWeight: 700, color: '#16a34a' }}>Rs. {rec.estimatedFarmerNetProceeds}/kg</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
