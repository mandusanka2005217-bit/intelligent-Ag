import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { useScoreDistribution } from '../hooks/useDashboardData';

/** Bucket colour follows the score band: low red, medium amber, high green. */
function bucketColour(range: string): string {
  const start = Number.parseInt(range, 10);
  if (Number.isNaN(start)) return '#40916c';
  if (start >= 70) return '#2d6a4f';
  if (start >= 40) return '#f4a261';
  return '#d62828';
}

const ScoreDistributionChart: React.FC = () => {
  const { data = [], isLoading } = useScoreDistribution();

  if (isLoading) {
    return <div className="chart-placeholder">Loading score distribution…</div>;
  }

  if (data.length === 0) {
    return <div className="chart-placeholder">No score data available.</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 5, right: 12, left: -12, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
        <XAxis dataKey="range" tick={{ fontSize: 10 }} interval={0} />
        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
        <Tooltip
          contentStyle={{ borderRadius: 8, border: '1px solid var(--color-border)', fontSize: 12 }}
          formatter={(value) => [`${value} matches`, 'Feasible pairs']}
        />
        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
          {data.map((bucket) => (
            <Cell key={bucket.range} fill={bucketColour(bucket.range)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default ScoreDistributionChart;
