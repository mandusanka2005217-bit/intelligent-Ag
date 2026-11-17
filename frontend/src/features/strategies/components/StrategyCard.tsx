import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Award, Check, Leaf, Scale, Truck, Users } from 'lucide-react';
import type { StrategyId, StrategyMetrics } from '../types';
import Button from '@/core/components/Button';
import { formatCurrency, formatPct, formatWeight } from '@/shared/utils/format';

interface StrategyCardProps {
  metrics: StrategyMetrics;
  badges: string[];
  active: boolean;
  onUse: (strategy: StrategyId) => void;
}

const STRATEGY_ICONS: Record<StrategyId, React.ReactNode> = {
  greedy: <Leaf size={18} />,
  'min-cost-flow': <Truck size={18} />,
  fairness: <Scale size={18} />,
};

/** One allocator's outcome, with the trade-off it embodies. */
const StrategyCard: React.FC<StrategyCardProps> = ({ metrics, badges, active, onUse }) => {
  const navigate = useNavigate();

  const handleUse = () => {
    onUse(metrics.strategy);
    navigate('/allocation');
  };

  return (
    <article className={`strategy-card ${active ? 'strategy-card--active' : ''}`}>
      <header className="strategy-card__header">
        <span className={`strategy-card__icon strategy-card__icon--${metrics.strategy}`}>
          {STRATEGY_ICONS[metrics.strategy]}
        </span>
        <div>
          <h3 className="strategy-card__title">{metrics.label}</h3>
          <p className="strategy-card__description">{metrics.description}</p>
        </div>
      </header>

      {badges.length > 0 && (
        <div className="strategy-card__badges">
          {badges.map((badge) => (
            <span key={badge} className="strategy-badge">
              <Award size={12} /> {badge}
            </span>
          ))}
        </div>
      )}

      <dl className="strategy-metrics">
        <div>
          <dt>Allocated</dt>
          <dd>{formatWeight(metrics.totalAllocatedKg)}</dd>
        </div>
        <div>
          <dt>Fill rate</dt>
          <dd>{formatPct(metrics.fillRate)}</dd>
        </div>
        <div>
          <dt>Avg. suitability</dt>
          <dd>{metrics.avgSuitability.toFixed(2)}</dd>
        </div>
        <div>
          <dt>Transport</dt>
          <dd>{formatCurrency(metrics.totalTransportCostRs)}</dd>
        </div>
        <div>
          <dt>Jain index</dt>
          <dd>{metrics.jainIndex.toFixed(4)}</dd>
        </div>
        <div>
          <dt>Runtime</dt>
          <dd>{metrics.runtimeMs.toFixed(1)} ms</dd>
        </div>
      </dl>

      <div className="strategy-card__coverage">
        <span>
          <Users size={13} aria-hidden="true" /> {metrics.fullyServedBuyers} full ·{' '}
          {metrics.partiallyServedBuyers} partial · {metrics.unservedBuyers} none
        </span>
        <span>
          Buyer fill range {formatPct(metrics.minFillRate)} – {formatPct(metrics.maxFillRate)}
        </span>
      </div>

      <footer className="strategy-card__footer">
        <Button
          variant={active ? 'primary' : 'outline'}
          size="sm"
          leftIcon={active ? <Check size={14} /> : undefined}
          onClick={handleUse}
        >
          {active ? 'Active in allocation' : 'Use this strategy'}
        </Button>
      </footer>
    </article>
  );
};

export default StrategyCard;
