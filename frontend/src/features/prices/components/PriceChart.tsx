import React from 'react';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { PriceAnomalyResponse } from '../types';
import { formatCurrency, formatDateShort } from '@/shared/utils/format';

interface ChartPoint {
  date: string;
  dateLabel: string;
  price: number;
  rollingMean: number | null;
  lower: number | null;
  band: number | null;
  flaggedPrice: number | null;
  zScore: number | null;
  flagged: boolean;
}

interface PriceTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: ChartPoint }>;
}

const PriceTooltip: React.FC<PriceTooltipProps> = ({ active, payload }) => {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0].payload;

  return (
    <div className="chart-tooltip">
      <strong>{formatDateShort(point.date)}</strong>
      <div>
        <span>Price</span>
        <span>{formatCurrency(point.price)}/kg</span>
      </div>
      {point.rollingMean !== null && (
        <div>
          <span>Rolling mean</span>
          <span>{formatCurrency(point.rollingMean)}/kg</span>
        </div>
      )}
      {point.zScore !== null && (
        <div>
          <span>z-score</span>
          <span>{point.zScore.toFixed(2)}</span>
        </div>
      )}
      {point.flagged && <span className="chart-tooltip__flag">Flagged as anomalous</span>}
    </div>
  );
};

interface PriceChartProps {
  response: PriceAnomalyResponse;
  height?: number;
}

/**
 * Price history with the rolling mean and the ±z·σ band. Points outside the band
 * are drawn red. The shaded band is the detector's tolerance, not a forecast.
 */
const PriceChart: React.FC<PriceChartProps> = ({ response, height = 340 }) => {
  const data: ChartPoint[] = response.points.map((point) => ({
    date: point.date,
    dateLabel: formatDateShort(point.date),
    price: point.price,
    rollingMean: point.rollingMean,
    lower: point.lower,
    band:
      point.upper !== null && point.lower !== null ? Number((point.upper - point.lower).toFixed(2)) : null,
    flaggedPrice: point.flagged ? point.price : null,
    zScore: point.zScore,
    flagged: point.flagged,
  }));

  return (
    <div>
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={data} margin={{ top: 12, right: 18, left: -4, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
          <XAxis dataKey="dateLabel" tick={{ fontSize: 11 }} minTickGap={28} />
          <YAxis
            tick={{ fontSize: 11 }}
            width={64}
            domain={['auto', 'auto']}
            tickFormatter={(value: number) => `Rs ${Math.round(value)}`}
          />
          <Tooltip content={<PriceTooltip />} />
          <Area
            dataKey="lower"
            stackId="band"
            stroke="none"
            fill="transparent"
            isAnimationActive={false}
          />
          <Area
            dataKey="band"
            stackId="band"
            stroke="none"
            fill="#f4a261"
            fillOpacity={0.18}
            isAnimationActive={false}
          />
          <Line
            dataKey="price"
            name="Market price"
            type="monotone"
            stroke="#2d6a4f"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
          <Line
            dataKey="rollingMean"
            name="Rolling mean"
            type="monotone"
            stroke="#3a86ff"
            strokeWidth={1.5}
            strokeDasharray="5 4"
            dot={false}
            isAnimationActive={false}
          />
          <Line
            dataKey="flaggedPrice"
            name="Flagged"
            type="monotone"
            stroke="transparent"
            strokeWidth={0}
            dot={{ r: 4, fill: '#d62828', stroke: '#ffffff', strokeWidth: 1.5 }}
            activeDot={{ r: 5, fill: '#d62828' }}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>

      <div className="chart-legend">
        <span>
          <i className="chart-legend__line chart-legend__line--price" /> Simulated market price
        </span>
        <span>
          <i className="chart-legend__line chart-legend__line--mean" /> Rolling mean
        </span>
        <span>
          <i className="chart-legend__band" /> ±{response.thresholdZ}σ tolerance band
        </span>
        <span>
          <i className="chart-legend__dot" /> Flagged anomaly
        </span>
      </div>
    </div>
  );
};

export default PriceChart;
