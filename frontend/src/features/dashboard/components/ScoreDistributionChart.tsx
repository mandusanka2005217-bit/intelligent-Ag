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

const COLORS = [
  '#d62828', '#d62828', '#d62828', '#d62828',
  '#f4a261', '#f4a261', '#f4a261',
  '#2d6a4f', '#2d6a4f', '#2d6a4f',
];

const ScoreDistributionChart: React.FC = () => {
  const { data = [], isLoading } = useScoreDistribution();

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
        No score data available. Run matching first.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
        <XAxis dataKey="range" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
        <Tooltip
          contentStyle={{
            borderRadius: 8,
            border: '1px solid var(--color-border)',
            fontSize: 12,
          }}
          formatter={(value: number) => [value, 'Matches']}
        />
        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
          {data.map((_, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default ScoreDistributionChart;
