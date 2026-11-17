import React from 'react';
import { Sparkles } from 'lucide-react';
import type { AllocationKpis } from '../types';
import Skeleton from '@/shared/components/Skeleton';
import { formatCurrency, formatNumber, formatPct, formatWeight } from '@/shared/utils/format';

interface SupplyUtilizationProps {
  kpis: AllocationKpis | undefined;
  isLoading?: boolean;
}

/**
 * Headline allocation numbers plus two utilisation bars:
 * how much of demand was filled, and how much of the offered supply moved.
 */
const SupplyUtilization: React.FC<SupplyUtilizationProps> = ({ kpis, isLoading = false }) => {
  if (isLoading || !kpis) {
    return (
      <div className="kpi-grid">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="kpi-card">
            <Skeleton width="55%" height={11} />
            <div style={{ height: 6 }} />
            <Skeleton width="70%" height={26} />
          </div>
        ))}
      </div>
    );
  }

  const demandFilled = kpis.totalDemandKg > 0 ? kpis.totalAllocatedKg / kpis.totalDemandKg : 0;
  const supplyUsed = kpis.totalSupplyKg > 0 ? kpis.totalAllocatedKg / kpis.totalSupplyKg : 0;

  const cards = [
    {
      label: 'Allocated',
      value: formatWeight(kpis.totalAllocatedKg),
      sub: `${formatNumber(kpis.feasibleEdges)} feasible edges`,
    },
    {
      label: 'Fill rate',
      value: formatPct(kpis.fillRate),
      sub: `${formatWeight(kpis.unmetDemandKg)} still unmet`,
    },
    {
      label: 'Average suitability',
      value: `${kpis.avgSuitability.toFixed(1)} / 100`,
      sub: 'weighted across consignments',
    },
    {
      label: 'Transport cost',
      value: formatCurrency(kpis.totalTransportCostRs),
      sub: 'road distance × rate × kg',
    },
    {
      label: "Jain's fairness index",
      value: kpis.jainIndex.toFixed(4),
      sub: '1.00 = every buyer equally filled',
    },
    {
      label: 'Buyer coverage',
      value: `${kpis.fullyServedBuyers} / ${kpis.buyerCount}`,
      sub: `${kpis.partiallyServedBuyers} partial · ${kpis.unservedBuyers} unserved`,
    },
  ];

  return (
    <div>
      <div className="kpi-grid">
        {cards.map(({ label, value, sub }) => (
          <div key={label} className="kpi-card">
            <span className="kpi-card__label">{label}</span>
            <span className="kpi-card__value">{value}</span>
            <span className="kpi-card__sub">{sub}</span>
          </div>
        ))}
      </div>

      <div className="card utilization-card">
        <div className="card__body">
          <div className="utilization-row">
            <div className="utilization-row__top">
              <span>
                <strong>Demand filled</strong> — {formatWeight(kpis.totalAllocatedKg)} of{' '}
                {formatWeight(kpis.totalDemandKg)}
              </span>
              <span className="utilization-row__pct">{formatPct(demandFilled)}</span>
            </div>
            <div className="utilization-bar utilization-bar--lg">
              <div
                className="utilization-bar__fill"
                style={{ width: `${Math.min(100, demandFilled * 100)}%` }}
              />
            </div>
          </div>

          <div className="utilization-row">
            <div className="utilization-row__top">
              <span>
                <strong>Supply used</strong> — {formatWeight(kpis.totalAllocatedKg)} of{' '}
                {formatWeight(kpis.totalSupplyKg)} offered
              </span>
              <span className="utilization-row__pct">{formatPct(supplyUsed)}</span>
            </div>
            <div className="utilization-bar utilization-bar--lg">
              <div
                className="utilization-bar__fill utilization-bar__fill--supply"
                style={{ width: `${Math.min(100, supplyUsed * 100)}%` }}
              />
            </div>
          </div>

          <p className="utilization-note">
            <Sparkles size={14} aria-hidden="true" />
            Computed in {kpis.runtimeMs.toFixed(1)} ms. Every kilogram is traced to exactly one
            farmer–buyer pair; no buyer receives less than its declared minimum lot.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SupplyUtilization;
