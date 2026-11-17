import React from 'react';
import { useSustainabilityMetrics } from '@/features/intelligence/hooks/useIntelligence';
import { useScenarioStore } from '@/core/store/scenarioStore';
import { Leaf, Award, ShieldCheck, HeartHandshake, TreePine, Droplets } from 'lucide-react';
import SimulatedBadge from '@/shared/components/SimulatedBadge';

export const SustainabilityPage: React.FC = () => {
  const scenarioId = useScenarioStore((s) => s.scenarioId);
  const { data, isLoading, error } = useSustainabilityMetrics(scenarioId);

  if (isLoading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <Leaf className="animate-spin" size={32} style={{ color: '#059669', margin: '0 auto 1rem' }} />
        <h3>Computing Food Waste Avoidance & Environmental Savings...</h3>
      </div>
    );
  }

  if (error || !data) {
    return <div style={{ padding: '2rem', color: '#ef4444' }}>Failed to load sustainability analytics.</div>;
  }

  const { metrics, assumptions } = data;

  return (
    <div className="intelligence-page" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #065f46 0%, #059669 100%)',
          color: '#fff',
          padding: '1.5rem',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(5, 150, 105, 0.15)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <Leaf size={24} style={{ color: '#a7f3d0' }} />
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>Food Waste & Sustainability Analytics</h2>
            <SimulatedBadge compact />
          </div>
          <p style={{ margin: 0, opacity: 0.9, fontSize: '0.9rem' }}>
            Quantifies agricultural post-harvest rot avoided via fast algorithmic matching and carbon emissions saved via routing optimization.
          </p>
        </div>
      </div>

      {/* Hero KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
        <div className="card" style={{ padding: '1.25rem', background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#059669', fontWeight: 600, fontSize: '0.85rem' }}>
            <Award size={18} /> AVOIDED FOOD SPOILAGE
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#065f46', marginTop: '0.5rem' }}>
            {metrics.estimatedSpoilageAvoidedKg.toLocaleString()} kg
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
            Fresh produce saved from post-harvest rot
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem', background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0284c7', fontWeight: 600, fontSize: '0.85rem' }}>
            <TreePine size={18} /> CO₂ EMISSIONS AVOIDED
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0369a1', marginTop: '0.5rem' }}>
            {metrics.co2EmissionsSavedKg.toLocaleString()} kg CO₂
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
            Via {metrics.distanceSavedKm.toLocaleString()} km transport distance saved
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem', background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ea580c', fontWeight: 600, fontSize: '0.85rem' }}>
            <Droplets size={18} /> WASTE AVOIDANCE FACTOR
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#c2410c', marginTop: '0.5rem' }}>
            {metrics.wasteAvoidancePct}%
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
            Reduction versus baseline Sri Lankan transit spoilage
          </div>
        </div>
      </div>

      {/* Detailed Environmental Audit */}
      <div className="card" style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.15rem', color: '#0f172a' }}>
          Environmental & Supply Chain Audit Breakdown
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          <div>
            <h4 style={{ margin: '0 0 0.5rem 0', color: '#334155', fontSize: '0.95rem' }}>Agricultural Produce Logistics</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', color: '#475569' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '4px' }}>
                <span>Total Produce Allocated:</span>
                <strong>{metrics.totalProduceAllocatedKg.toLocaleString()} kg</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '4px' }}>
                <span>Unallocated Produce:</span>
                <strong>{metrics.unallocatedProduceKg.toLocaleString()} kg</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '4px' }}>
                <span>Baseline Spoilage Expectation:</span>
                <strong>{assumptions.baselineSpoilageRatePct}%</strong>
              </div>
            </div>
          </div>

          <div>
            <h4 style={{ margin: '0 0 0.5rem 0', color: '#334155', fontSize: '0.95rem' }}>Carbon & Green Transit Accounting</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', color: '#475569' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '4px' }}>
                <span>Optimized Road Transit:</span>
                <strong>{metrics.totalOptimizedDistanceKm.toLocaleString()} km</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '4px' }}>
                <span>Distance Saved via VRP:</span>
                <strong style={{ color: '#16a34a' }}>-{metrics.distanceSavedKm.toLocaleString()} km</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '4px' }}>
                <span>Diesel Emission Factor:</span>
                <strong>{assumptions.co2KgPerLiterDiesel} kg CO₂ / L</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
