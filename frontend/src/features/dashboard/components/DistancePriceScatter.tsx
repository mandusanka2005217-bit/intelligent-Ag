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
  Cell,
} from 'recharts';
import { useDistancePriceData } from '../hooks/useDashboardData';
import { productColour } from '@/shared/constants';
import { formatCurrency } from '@/shared/utils/format';

const DistancePriceScatter: React.FC = () => {
  const { data = [], isLoading } = useDistancePriceData();

  if (isLoading) {
    return <div className="chart-placeholder">Loading distance/price pairs…</div>;
  }

  if (data.length === 0) {
    return <div className="chart-placeholder">No distance/price data available.</div>;
  }

  const chartData = data.map((point) => ({
    x: Number(point.distanceKm.toFixed(1)),
    y: Number(point.pricePerKg.toFixed(2)),
    name: point.farmerName,
    buyer: point.buyerName,
    cropType: point.cropType,
    score: point.score,
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <ScatterChart margin={{ top: 10, right: 20, left: -6, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
        <XAxis dataKey="x" type="number" name="Distance" unit=" km" tick={{ fontSize: 11 }}>
          <Label value="Road distance (km)" offset={-10} position="insideBottom" style={{ fontSize: 11 }} />
        </XAxis>
        <YAxis dataKey="y" type="number" name="Price" tick={{ fontSize: 11 }} width={54} />
        <Tooltip
          cursor={{ strokeDasharray: '3 3' }}
          contentStyle={{ borderRadius: 8, border: '1px solid var(--color-border)', fontSize: 12 }}
          formatter={(value, name) => {
            if (name === 'Price') return [formatCurrency(Number(value)), 'Price / kg'];
            if (name === 'Distance') return [`${Number(value)} km`, 'Distance'];
            return [String(value), String(name)];
          }}
          labelFormatter={() => ''}
        />
        <Scatter data={chartData} fillOpacity={0.8}>
          {chartData.map((point, index) => (
            <Cell key={`${point.name}-${index}`} fill={productColour(point.cropType)} />
          ))}
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  );
};

export default DistancePriceScatter;
