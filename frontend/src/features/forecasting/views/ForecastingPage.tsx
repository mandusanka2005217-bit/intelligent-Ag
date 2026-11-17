import React, { useState } from 'react';
import { useDemandForecasting } from '@/features/intelligence/hooks/useIntelligence';
import { useScenarioStore } from '@/core/store/scenarioStore';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
} from 'recharts';
import { Sparkles, TrendingUp, AlertCircle, Calendar, BarChart2, MapPin } from 'lucide-react';
import SimulatedBadge from '@/shared/components/SimulatedBadge';

export const ForecastingPage: React.FC = () => {
  const scenarioId = useScenarioStore((s) => s.scenarioId);
  const [horizon, setHorizon] = useState<number>(30);
  const { data, isLoading, error } = useDemandForecasting(scenarioId, horizon);

  if (isLoading) {
    return (
      <div className="intelligence-loading" style={{ padding: '2rem', textAlign: 'center' }}>
        <Sparkles className="animate-spin" size={32} style={{ color: '#16a34a', margin: '0 auto 1rem' }} />
        <h3>Computing Holt-Winters Demand Forecasts...</h3>
        <p style={{ color: '#64748b' }}>Analyzing historical buyer orders and seasonality patterns</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ padding: '2rem', color: '#ef4444' }}>
        Failed to load demand forecasts. Please ensure backend is running.
      </div>
    );
  }

  return (
    <div className="intelligence-page" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #064e3b 0%, #047857 100%)',
          color: '#fff',
          padding: '1.5rem',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(6, 78, 59, 0.15)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <Sparkles size={22} style={{ color: '#a7f3d0' }} />
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>AI Demand Forecasting Engine</h2>
            <SimulatedBadge compact />
          </div>
          <p style={{ margin: 0, opacity: 0.9, fontSize: '0.9rem' }}>
            Multi-horizon time-series forecasting using Triple Exponential Smoothing (Holt-Winters) and moving averages.
          </p>
        </div>

        {/* Horizon Selector */}
        <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(255,255,255,0.15)', padding: '4px', borderRadius: '8px' }}>
          {[7, 30, 90].map((h) => (
            <button
              key={h}
              onClick={() => setHorizon(h)}
              style={{
                border: 'none',
                background: horizon === h ? '#ffffff' : 'transparent',
                color: horizon === h ? '#064e3b' : '#ffffff',
                fontWeight: 600,
                padding: '6px 14px',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {h} Days
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div className="card" style={{ padding: '1rem', background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
          <div style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Forecast Horizon</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', marginTop: '0.25rem' }}>{data.horizonDays} Days Ahead</div>
          <div style={{ fontSize: '0.8rem', color: '#16a34a', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Calendar size={14} /> Ref Date: Nov 15, 2026
          </div>
        </div>

        <div className="card" style={{ padding: '1rem', background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
          <div style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Top High-Demand Crops</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginTop: '0.25rem' }}>
            {data.topProducts.slice(0, 3).join(', ')}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#0284c7', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <TrendingUp size={14} /> High market pull detected
          </div>
        </div>

        <div className="card" style={{ padding: '1rem', background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
          <div style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Model Precision (MAPE)</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', marginTop: '0.25rem' }}>
            {data.accuracyMetrics.mapePct}%
          </div>
          <div style={{ fontSize: '0.8rem', color: '#16a34a', marginTop: '0.25rem' }}>
            MAE: ±{data.accuracyMetrics.maeKg.toLocaleString()} kg
          </div>
        </div>

        <div className="card" style={{ padding: '1rem', background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
          <div style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Mathematical Algorithm</div>
          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#334155', marginTop: '0.25rem' }}>
            Holt-Winters Smoothing
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
            Confidence bands (92% - 108%)
          </div>
        </div>
      </div>

      {/* Main Historical vs Predicted Trend */}
      <div className="card" style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <TrendingUp size={18} style={{ color: '#059669' }} />
          Aggregate Daily Demand: Historical Baseline vs. Projected Confidence Band (kg)
        </h3>
        <div style={{ width: '100%', height: 320 }}>
          <ResponsiveContainer>
            <AreaChart data={data.points}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="upperBoundKg" name="Upper Confidence (95%)" stroke="transparent" fill="#d1fae5" fillOpacity={0.6} />
              <Area type="monotone" dataKey="lowerBoundKg" name="Lower Confidence (95%)" stroke="transparent" fill="#fff" fillOpacity={1} />
              <Line type="monotone" dataKey="historicalKg" name="Historical Observed (kg)" stroke="#0284c7" strokeWidth={2.5} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="predictedKg" name="Forecast Projected (kg)" stroke="#059669" strokeWidth={2.5} strokeDasharray="5 5" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Product-wise and District-wise Forecasts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
        {/* Product Forecasts */}
        <div className="card" style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BarChart2 size={18} style={{ color: '#0284c7' }} />
            Crop-Specific {horizon}-Day Demand Forecast (kg)
          </h3>
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer>
              <BarChart data={data.productForecasts}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="product" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="forecastKg" name={`Forecasted Demand (${horizon}d)`} fill="#059669" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* District Forecasts */}
        <div className="card" style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MapPin size={18} style={{ color: '#d97706' }} />
            District-Level Anticipated Demand Volume
          </h3>
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer>
              <BarChart data={data.districtForecasts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="district" type="category" tick={{ fontSize: 11 }} width={90} />
                <Tooltip />
                <Bar dataKey="demandKg" name="District Demand (kg)" fill="#0284c7" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
