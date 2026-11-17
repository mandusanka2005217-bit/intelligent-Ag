import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAllocationBreakdown } from '../hooks/useDashboardData';
import { productColour } from '@/shared/constants';
import { formatWeight } from '@/shared/utils/format';

const PALETTE = ['#2d6a4f', '#40916c', '#52b788', '#74c69d', '#f4a261', '#e76f51', '#3a86ff', '#6a4c93'];

const AllocationPie: React.FC = () => {
  const { data = [], isLoading } = useAllocationBreakdown();

  if (isLoading) {
    return <div className="chart-placeholder">Loading allocation breakdown…</div>;
  }

  if (data.length === 0) {
    return <div className="chart-placeholder">No allocation data yet.</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={90}
          label={({ name, percent }) => `${String(name)} (${Math.round((percent ?? 0) * 100)}%)`}
          labelLine={false}
        >
          {data.map((entry, index) => (
            <Cell key={entry.name} fill={productColour(entry.name) ?? PALETTE[index % PALETTE.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ borderRadius: 8, border: '1px solid var(--color-border)', fontSize: 12 }}
          formatter={(value) => [formatWeight(Number(value)), 'Allocated']}
        />
        <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default AllocationPie;
