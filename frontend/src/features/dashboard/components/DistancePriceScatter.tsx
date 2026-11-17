import React from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Label,
} from 'recharts';
import { useDistancePriceData } from '../hooks/useDashboardData';
import { formatCurrency } from '@/shared/utils/format';

const DistancePriceScatter: React.FC = () => {
  const { data = [], isLoading } = useDistancePriceData();

  if (isLoading) {
    return (
      <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}>
        Loading…
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
        No distance/price data available.
      </div>
    );
  }

  // Recharts scatter expects { x, y } or named keys
  const chartData = data.map((d) => ({
    x: d.distanceKm,
    y: d.pricePerKg,
    name: d.farmerName,
    cropType: d.cropType,
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <ScatterChart margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
        <XAxis
          dataKey="x"
          type="number"
          name="Distance (km)"
          tick={{ fontSize: 11 }}
        >
          <Label value="Distance (km)" offset={-10} position="insideBottom" style={{ fontSize: 11 }} />
        </XAxis>
        <YAxis
          dataKey="y"
          type="number"
          name="Price / kg"
          tick={{ fontSize: 11 }}
          tickFormatter={(v) => `${v}`}
        />
        <Tooltip
          cursor={{ strokeDasharray: '3 3' }}
          contentStyle={{ borderRadius: 8, border: '1px solid var(--color-border)', fontSize: 12 }}
          formatter={(value: number, name: string) => {
            if (name === 'Price / kg') return [formatCurrency(value), name];
            return [`${value} km`, name];
          }}
        />
        <Scatter
          data={chartData}
          fill="var(--color-primary)"
          fillOpacity={0.7}
        />
      </ScatterChart>
    </ResponsiveContainer>
  );
};

export default DistancePriceScatter;
