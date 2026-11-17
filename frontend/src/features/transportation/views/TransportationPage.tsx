import React from 'react';
import { useTransportationOptimization } from '@/features/intelligence/hooks/useIntelligence';
import { useScenarioStore } from '@/core/store/scenarioStore';
import { Truck, Navigation, Fuel, DollarSign, CheckCircle2, ArrowRight } from 'lucide-react';
import SimulatedBadge from '@/shared/components/SimulatedBadge';

export const TransportationPage: React.FC = () => {
  const scenarioId = useScenarioStore((s) => s.scenarioId);
  const { data, isLoading, error } = useTransportationOptimization(scenarioId);

  if (isLoading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <Truck className="animate-bounce" size={32} style={{ color: '#0284c7', margin: '0 auto 1rem' }} />
        <h3>Solving Vehicle Routing Problem (VRP)...</h3>
        <p style={{ color: '#64748b' }}>Clustering pickup/delivery stops with 2-opt refinement</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ padding: '2rem', color: '#ef4444' }}>
        Failed to load transportation optimization routes.
      </div>
    );
  }

  const { baseline, optimized } = data;

  return (
    <div className="intelligence-page" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0369a1 0%, #0284c7 100%)',
          color: '#fff',
          padding: '1.5rem',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(2, 132, 199, 0.15)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <Truck size={24} style={{ color: '#bae6fd' }} />
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>Multi-Stop Transportation Optimization</h2>
            <SimulatedBadge compact />
          </div>
          <p style={{ margin: 0, opacity: 0.9, fontSize: '0.9rem' }}>
            Capacity-constrained Vehicle Routing (VRP) solving multi-pickup & multi-delivery agricultural corridors with 2-opt heuristic.
          </p>
        </div>
      </div>

      {/* Comparison KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div className="card" style={{ padding: '1rem', background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
          <div style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Efficiency Gain</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#16a34a', marginTop: '0.25rem' }}>
            +{optimized.efficiencyGainPct}%
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
            Savings over fragmented single legs
          </div>
        </div>

        <div className="card" style={{ padding: '1rem', background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
          <div style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Distance Reduction</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0284c7', marginTop: '0.25rem' }}>
            {optimized.distanceSavedKm.toLocaleString()} km Saved
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
            Optimized: {optimized.totalDistanceKm.toLocaleString()} km (Baseline: {baseline.totalDistanceKm.toLocaleString()} km)
          </div>
        </div>

        <div className="card" style={{ padding: '1rem', background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
          <div style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Financial Savings</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#059669', marginTop: '0.25rem' }}>
            LKR {optimized.costSavedRs.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
            Optimized: LKR {optimized.totalCostRs.toLocaleString()}
          </div>
        </div>

        <div className="card" style={{ padding: '1rem', background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
          <div style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Fleet Operations</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', marginTop: '0.25rem' }}>
            {optimized.routes.length} Lorry Routes
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
            Consolidated from {baseline.singleLegsCount} isolated point-to-point legs
          </div>
        </div>
      </div>

      {/* Routes Manifest */}
      <div className="card" style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1.15rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Navigation size={18} style={{ color: '#0284c7' }} />
          Optimized Dispatch Manifest & Multi-Stop Waypoints
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {optimized.routes.map((route: any, idx: number) => (
            <div
              key={route.routeId}
              style={{
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '1.25rem',
                background: '#f8fafc',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: '1.05rem', color: '#0f172a' }}>
                    Vehicle Route #{idx + 1} ({route.routeId})
                  </span>
                  <span
                    style={{
                      marginLeft: '0.75rem',
                      background: '#e0f2fe',
                      color: '#0369a1',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                    }}
                  >
                    Load: {route.totalLoadKg} kg / {route.vehicleCapacityKg} kg ({route.utilizationPct}%)
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', color: '#475569' }}>
                  <span><strong>Dist:</strong> {route.totalDistanceKm} km</span>
                  <span><strong>Fuel:</strong> {route.estimatedFuelLiters} L</span>
                  <span><strong>Est. Cost:</strong> LKR {route.estimatedCostRs.toLocaleString()}</span>
                </div>
              </div>

              {/* Waypoint Sequence */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                {route.stops.map((stop: any, sIdx: number) => (
                  <React.Fragment key={stop.stopIndex}>
                    <div
                      style={{
                        padding: '0.5rem 0.75rem',
                        background: stop.type === 'pickup' ? '#ecfdf5' : '#eff6ff',
                        border: `1px solid ${stop.type === 'pickup' ? '#a7f3d0' : '#bfdbfe'}`,
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                      }}
                    >
                      <div style={{ fontWeight: 600, color: stop.type === 'pickup' ? '#065f46' : '#1e40af' }}>
                        {stop.stopIndex}. {stop.type === 'pickup' ? '🟢 Pickup' : '🔵 Delivery'}: {stop.name}
                      </div>
                      <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '2px' }}>
                        {stop.location} | {stop.cropType} ({stop.quantityKg} kg)
                      </div>
                    </div>
                    {sIdx < route.stops.length - 1 && (
                      <ArrowRight size={14} style={{ color: '#94a3b8' }} />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
