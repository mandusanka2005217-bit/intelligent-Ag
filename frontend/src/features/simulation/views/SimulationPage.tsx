import React, { useState } from 'react';
import { useWhatIfSimulation } from '@/features/intelligence/hooks/useIntelligence';
import { useScenarioStore } from '@/core/store/scenarioStore';
import { Sliders, Play, RotateCcw, TrendingUp, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import SimulatedBadge from '@/shared/components/SimulatedBadge';
import type { SimulationResult } from '@contracts/types';

export const SimulationPage: React.FC = () => {
  const scenarioId = useScenarioStore((s) => s.scenarioId);
  const [supplyFactorPct, setSupplyFactorPct] = useState<number>(0);
  const [demandFactorPct, setDemandFactorPct] = useState<number>(0);
  const [transportRateFactorPct, setTransportRateFactorPct] = useState<number>(0);

  const [result, setResult] = useState<SimulationResult | null>(null);
  const simulationMutation = useWhatIfSimulation(scenarioId);

  const handleRunSimulation = () => {
    simulationMutation.mutate(
      { supplyFactorPct, demandFactorPct, transportRateFactorPct },
      {
        onSuccess: (data: SimulationResult) => setResult(data),
      }
    );
  };

  const handleReset = () => {
    setSupplyFactorPct(0);
    setDemandFactorPct(0);
    setTransportRateFactorPct(0);
    setResult(null);
  };

  return (
    <div className="intelligence-page" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
          color: '#fff',
          padding: '1.5rem',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(79, 70, 229, 0.15)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <Sliders size={24} style={{ color: '#c7d2fe' }} />
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>What-If Strategic Decision Simulator</h2>
            <SimulatedBadge compact />
          </div>
          <p style={{ margin: 0, opacity: 0.9, fontSize: '0.9rem' }}>
            Interactive policy simulator for hypothetical supply shocks, demand surges, and fuel hikes without touching database records.
          </p>
        </div>
      </div>

      {/* Control Panel */}
      <div className="card" style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1.15rem', color: '#0f172a' }}>
          Simulation Parameters & Shock Injection
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {/* Supply Shock */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <label style={{ fontWeight: 600, fontSize: '0.9rem', color: '#334155' }}>Supply Shock (% change):</label>
              <span style={{ fontWeight: 700, color: supplyFactorPct < 0 ? '#dc2626' : supplyFactorPct > 0 ? '#16a34a' : '#64748b' }}>
                {supplyFactorPct > 0 ? `+${supplyFactorPct}%` : `${supplyFactorPct}%`}
              </span>
            </div>
            <input
              type="range"
              min="-80"
              max="80"
              step="5"
              value={supplyFactorPct}
              onChange={(e) => setSupplyFactorPct(Number(e.target.value))}
              style={{ width: '100%' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8' }}>
              <span>-80% Severe Drought</span>
              <span>0% Baseline</span>
              <span>+80% Bumper Harvest</span>
            </div>
          </div>

          {/* Demand Surge */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <label style={{ fontWeight: 600, fontSize: '0.9rem', color: '#334155' }}>Demand Surge (% change):</label>
              <span style={{ fontWeight: 700, color: demandFactorPct > 0 ? '#ea580c' : '#64748b' }}>
                {demandFactorPct > 0 ? `+${demandFactorPct}%` : `${demandFactorPct}%`}
              </span>
            </div>
            <input
              type="range"
              min="-50"
              max="150"
              step="5"
              value={demandFactorPct}
              onChange={(e) => setDemandFactorPct(Number(e.target.value))}
              style={{ width: '100%' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8' }}>
              <span>-50% Slump</span>
              <span>0% Baseline</span>
              <span>+150% Festival Peak</span>
            </div>
          </div>

          {/* Fuel / Transport Rate */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <label style={{ fontWeight: 600, fontSize: '0.9rem', color: '#334155' }}>Transport / Fuel Hike (% change):</label>
              <span style={{ fontWeight: 700, color: transportRateFactorPct > 0 ? '#d97706' : '#64748b' }}>
                {transportRateFactorPct > 0 ? `+${transportRateFactorPct}%` : `${transportRateFactorPct}%`}
              </span>
            </div>
            <input
              type="range"
              min="-30"
              max="100"
              step="5"
              value={transportRateFactorPct}
              onChange={(e) => setTransportRateFactorPct(Number(e.target.value))}
              style={{ width: '100%' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8' }}>
              <span>-30% Subsidy</span>
              <span>0% Baseline</span>
              <span>+100% Fuel Crisis</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
          <button
            onClick={handleRunSimulation}
            disabled={simulationMutation.isPending}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#4f46e5',
              color: '#fff',
              border: 'none',
              padding: '8px 18px',
              borderRadius: '6px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Play size={16} /> {simulationMutation.isPending ? 'Simulating...' : 'Run Simulation'}
          </button>
          <button
            onClick={handleReset}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#f1f5f9',
              color: '#475569',
              border: '1px solid #cbd5e1',
              padding: '8px 18px',
              borderRadius: '6px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <RotateCcw size={16} /> Reset
          </button>
        </div>
      </div>

      {/* Results View */}
      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Comparison Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            <div className="card" style={{ background: '#fff', padding: '1.25rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontWeight: 600, color: '#64748b', fontSize: '0.85rem' }}>FILL RATE COMPARISON</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.5rem' }}>
                <span style={{ fontSize: '1.75rem', fontWeight: 800, color: result.simulated.fillRate < 0.7 ? '#dc2626' : '#16a34a' }}>
                  {(result.simulated.fillRate * 100).toFixed(1)}%
                </span>
                <span style={{ fontSize: '0.9rem', color: '#64748b' }}>
                  (Baseline: {(result.baseline.fillRate * 100).toFixed(1)}%)
                </span>
              </div>
              <div style={{ fontSize: '0.8rem', color: result.impactDeltas.fillRateDeltaPct < 0 ? '#dc2626' : '#16a34a', marginTop: '4px' }}>
                {result.impactDeltas.fillRateDeltaPct > 0 ? `+${result.impactDeltas.fillRateDeltaPct}%` : `${result.impactDeltas.fillRateDeltaPct}%`} shift
              </div>
            </div>

            <div className="card" style={{ background: '#fff', padding: '1.25rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontWeight: 600, color: '#64748b', fontSize: '0.85rem' }}>TOTAL TRANSPORT COST</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.5rem' }}>
                <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>
                  LKR {result.simulated.transportCostRs.toLocaleString()}
                </span>
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                  (Base: LKR {result.baseline.transportCostRs.toLocaleString()})
                </span>
              </div>
              <div style={{ fontSize: '0.8rem', color: result.impactDeltas.transportCostDeltaRs > 0 ? '#dc2626' : '#16a34a', marginTop: '4px' }}>
                {result.impactDeltas.transportCostDeltaRs > 0 ? `+LKR ${result.impactDeltas.transportCostDeltaRs.toLocaleString()}` : `LKR ${result.impactDeltas.transportCostDeltaRs.toLocaleString()}`}
              </div>
            </div>

            <div className="card" style={{ background: '#fff', padding: '1.25rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontWeight: 600, color: '#64748b', fontSize: '0.85rem' }}>UNFULFILLED DEMAND</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.5rem' }}>
                <span style={{ fontSize: '1.75rem', fontWeight: 800, color: result.simulated.unfulfilledKg > 1000 ? '#ea580c' : '#16a34a' }}>
                  {result.simulated.unfulfilledKg.toLocaleString()} kg
                </span>
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                  (Base: {result.baseline.unfulfilledKg.toLocaleString()} kg)
                </span>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>
                Total Allocated: {result.simulated.allocatedKg.toLocaleString()} kg
              </div>
            </div>
          </div>

          {/* AI Decision Recommendations */}
          <div className="card" style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.15rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle2 size={18} style={{ color: '#4f46e5' }} />
              Algorithmic Mitigation & Strategic Recommendations
            </h3>
            <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#334155', lineHeight: 1.6 }}>
              {result.recommendations.map((rec, i) => (
                <li key={i} style={{ marginBottom: '0.5rem' }}>{rec}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
