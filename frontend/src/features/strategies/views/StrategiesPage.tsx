import React from 'react';
import { Info, RefreshCw, Scale } from 'lucide-react';
import type { StrategyId } from '../types';
import Button from '@/core/components/Button';
import { useScenarioStore } from '@core/store/scenarioStore';
import Card from '@/shared/components/Card';
import SimulatedBadge from '@/shared/components/SimulatedBadge';
import Skeleton from '@/shared/components/Skeleton';
import { apiErrorMessage } from '@/shared/services/api-client';
import { formatPct, formatWeight } from '@/shared/utils/format';
import ScenarioBar from '@/features/scenarios/components/ScenarioBar';
import WeightControls from '@/features/scenarios/components/WeightControls';
import StrategyCard from '../components/StrategyCard';
import { useComparison } from '../hooks/useComparison';

const StrategiesPage: React.FC = () => {
  const { data, isLoading, isFetching, refetch, error } = useComparison();
  const strategy = useScenarioStore((state) => state.strategy);
  const setStrategy = useScenarioStore((state) => state.setStrategy);

  const results = data?.results ?? [];

  const maxKg = results.length > 0 ? Math.max(...results.map((r) => r.totalAllocatedKg)) : 0;
  const minKg = results.length > 0 ? Math.min(...results.map((r) => r.totalAllocatedKg)) : 0;
  const maxScore = results.length > 0 ? Math.max(...results.map((r) => r.avgSuitability)) : 0;
  const maxJain = results.length > 0 ? Math.max(...results.map((r) => r.jainIndex)) : 0;
  const minTransport =
    results.length > 0 ? Math.min(...results.map((r) => r.totalTransportCostRs)) : 0;

  const badgesFor = (result: (typeof results)[number]): string[] => {
    const badges: string[] = [];
    if (results.length > 1 && result.totalAllocatedKg === maxKg) badges.push('Moves the most kg');
    if (results.length > 1 && result.avgSuitability === maxScore) badges.push('Best average match');
    if (results.length > 1 && result.jainIndex === maxJain) badges.push('Most even split');
    if (results.length > 1 && result.totalTransportCostRs === minTransport) badges.push('Cheapest transport');
    return badges;
  };

  const handleUse = (next: StrategyId) => setStrategy(next);

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-header__title">Strategies</h2>
          <p className="page-header__subtitle">
            The same farmers, buyers and constraints, solved by three allocation policies.
          </p>
        </div>
        <div className="page-header__actions">
          <SimulatedBadge />
          <Button
            variant="outline"
            leftIcon={<RefreshCw size={16} />}
            onClick={() => refetch()}
            loading={isFetching && !isLoading}
          >
            Refresh
          </Button>
        </div>
      </div>

      <ScenarioBar />

      <div className="strategies-layout">
        <Card title="Scoring weights" subtitle="Shared by all three allocators">
          <WeightControls />
        </Card>

        <Card
          title={
            <span className="card__title-inline">
              <Scale size={16} /> What changes between them
            </span>
          }
          subtitle="The trade-offs come from the solver, not from a template"
        >
          {isLoading ? (
            <div className="tradeoff-list">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} height={16} />
              ))}
            </div>
          ) : (
            <ul className="tradeoff-list">
              {(data?.tradeoffs ?? []).map((tradeoff) => (
                <li key={tradeoff}>{tradeoff}</li>
              ))}
              {results.length > 0 && (
                <li>
                  {Math.abs(maxKg - minKg) < 1 ? (
                    <>
                      All three strategies move {formatWeight(maxKg)} here, so the real choice is
                      about <em>who</em> gets served and at what match quality.
                    </>
                  ) : (
                    <>
                      The strategies move between {formatWeight(minKg)} and {formatWeight(maxKg)} here,
                      so the real choice is about <em>who</em> gets served and at what match quality.
                    </>
                  )}
                </li>
              )}
            </ul>
          )}

          <p className="strategy-caveat">
            <Info size={14} aria-hidden="true" />
            The fairness allocator is a concave-welfare greedy heuristic. It measurably raises Jain's
            index but does not guarantee the mathematical max-min optimum. The min-cost max-flow solver is
            exact for the linear cost model.
          </p>
        </Card>
      </div>

      {error ? (
        <div className="notice notice--danger" role="alert">
          {apiErrorMessage(error)}
        </div>
      ) : (
        <>
          <div className="strategy-result-summary">
            <span>
              Weighted demand filled:{' '}
              <strong>{results.length > 0 ? formatPct(results[0].fillRate) : '—'}</strong>
            </span>
            <span>
              Global Jain's index:{' '}
              <strong>{results.length > 0 ? results[0].jainIndex.toFixed(4) : '—'}</strong>
            </span>
            <span>Shortage policy: {data?.shortagePolicy ?? 'score-priority'}</span>
          </div>

          <div className="strategy-grid">
            {isLoading
              ? Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="strategy-card">
                    <Skeleton width="50%" height={18} />
                    <div style={{ height: 10 }} />
                    <Skeleton width="90%" height={12} />
                    <div style={{ height: 18 }} />
                    <Skeleton height={120} />
                  </div>
                ))
              : results.map((result) => (
                  <StrategyCard
                    key={result.strategy}
                    metrics={result}
                    badges={badgesFor(result)}
                    active={strategy === result.strategy}
                    onUse={handleUse}
                  />
                ))}
          </div>
        </>
      )}
    </div>
  );
};

export default StrategiesPage;
