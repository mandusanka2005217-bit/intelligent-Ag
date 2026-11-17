import React, { useState } from 'react';
import { AlertTriangle, Play, RefreshCw } from 'lucide-react';
import type { Match } from '@contracts/types';
import Button from '@/core/components/Button';
import Modal from '@/core/components/Modal';
import Card from '@/shared/components/Card';
import SimulatedBadge from '@/shared/components/SimulatedBadge';
import { apiErrorMessage } from '@/shared/services/api-client';
import { formatCurrency, formatDistance, formatNumber, formatOrdinal, formatScore } from '@/shared/utils/format';
import ScenarioBar from '@/features/scenarios/components/ScenarioBar';
import WeightControls from '@/features/scenarios/components/WeightControls';
import MatchList from '../components/MatchList';
import SuitabilityScore from '../components/SuitabilityScore';
import { useMatches, useRunMatching } from '../hooks/useMatches';

const MatchingPage: React.FC = () => {
  const [minScore, setMinScore] = useState(0);
  const [explaining, setExplaining] = useState<Match | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const { data, isLoading, refetch, isFetching, error } = useMatches({ minScore });
  const runMatching = useRunMatching({ minScore });
  const matches = data?.matches ?? [];
  const summary = data?.summary;

  const handleRun = async () => {
    setActionError(null);
    setNotice(null);
    try {
      const result = await runMatching.mutateAsync();
      setNotice(
        `Scored ${result.summary.candidatePairs} candidate pairs: ${result.summary.feasiblePairs} feasible, ${result.summary.blockedPairs} blocked by hard constraints.`,
      );
    } catch (mutationError) {
      setActionError(apiErrorMessage(mutationError));
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-header__title">Matching</h2>
          <p className="page-header__subtitle">
            Every farmer–buyer pair is scored on price, distance, quantity fit, quality and timing.
          </p>
        </div>
        <div className="page-header__actions">
          <SimulatedBadge />
          <Button
            variant="outline"
            leftIcon={<RefreshCw size={16} />}
            onClick={() => refetch()}
            loading={isFetching && !runMatching.isPending}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            leftIcon={<Play size={16} />}
            onClick={handleRun}
            loading={runMatching.isPending}
          >
            Run Matching
          </Button>
        </div>
      </div>

      <ScenarioBar />

      <div className="control-grid">
        <Card title="Scoring model" subtitle="Weights are renormalised by the API">
          <WeightControls />
        </Card>

        <Card title="Filters & summary" subtitle="A score is only computed for feasible pairs">
          <div className="filter-stack">
            <label className="form-label" htmlFor="min-score">
              Minimum suitability score: <strong>{minScore}</strong>
            </label>
            <input
              id="min-score"
              type="range"
              className="weight-slider"
              min={0}
              max={100}
              step={5}
              value={minScore}
              onChange={(event) => setMinScore(Number(event.target.value))}
            />
            <p className="form-help">
              Filtering happens after scoring, so the summary still describes the full candidate set.
            </p>
          </div>

          <div className="stat-strip">
            <div className="stat">
              <span className="stat__label">Candidate pairs</span>
              <span className="stat__value">{formatNumber(summary?.candidatePairs ?? 0)}</span>
            </div>
            <div className="stat">
              <span className="stat__label">Feasible</span>
              <span className="stat__value stat__value--good">
                {formatNumber(summary?.feasiblePairs ?? 0)}
              </span>
            </div>
            <div className="stat">
              <span className="stat__label">Blocked</span>
              <span className="stat__value">{formatNumber(summary?.blockedPairs ?? 0)}</span>
            </div>
            <div className="stat">
              <span className="stat__label">Average score</span>
              <span className="stat__value">{formatScore(summary?.avgScore ?? 0)}</span>
            </div>
            <div className="stat">
              <span className="stat__label">Best score</span>
              <span className="stat__value">{formatScore(summary?.maxScore ?? 0)}</span>
            </div>
          </div>
        </Card>
      </div>

      {(notice || error || actionError) && (
        <div className={`notice ${error || actionError ? 'notice--danger' : 'notice--info'}`} role="status">
          {actionError ?? (error ? apiErrorMessage(error) : notice)}
        </div>
      )}

      {data && data.anomalies.some((anomaly) => anomaly.flagged) && (
        <div className="notice notice--warning">
          <AlertTriangle size={16} />
          <div>
            <strong>Price anomaly detected in scenario {data.scenarioId}.</strong>
            {data.anomalies
              .filter((anomaly) => anomaly.flagged)
              .map((anomaly) => (
                <p key={anomaly.product}>{anomaly.warning}</p>
              ))}
          </div>
        </div>
      )}

      <Card
        title={`Matches (${matches.length})`}
        subtitle="Ranked by weighted suitability across the whole scenario"
        padded={false}
      >
        <div className="card__body">
          <MatchList matches={matches} isLoading={isLoading} onExplain={setExplaining} />
        </div>
      </Card>

      <Modal
        isOpen={explaining !== null}
        onClose={() => setExplaining(null)}
        title={explaining ? `${explaining.farmer.id} → ${explaining.buyer.id}` : 'Match explanation'}
        size="lg"
      >
        {explaining && (
          <div className="explain">
            <p className="explain__lead">{explaining.explanation}</p>

            <div className="explain__summary">
              <div>
                <span className="stat__label">Suitability</span>
                <strong>{formatScore(explaining.suitabilityScore)}</strong>
              </div>
              <div>
                <span className="stat__label">Rank for buyer</span>
                <strong>{formatOrdinal(explaining.rankPercentile)} percentile</strong>
              </div>
              <div>
                <span className="stat__label">Road distance</span>
                <strong>{formatDistance(explaining.distanceKm)}</strong>
              </div>
              <div>
                <span className="stat__label">Transport</span>
                <strong>{formatCurrency(explaining.transportCostPerKg)}/kg</strong>
              </div>
            </div>

            <h4 className="explain__heading">Score components</h4>
            <SuitabilityScore components={explaining.components} />

            <h4 className="explain__heading">Constraints checked</h4>
            <ul className="check-list">
              <li>Crop: {explaining.farmer.cropType} matches {explaining.buyer.requiredCropType}</li>
              <li>
                Price {formatCurrency(explaining.pricePerKg)}/kg is within the{' '}
                {formatCurrency(explaining.buyer.maxPricePerKg)}/kg ceiling
              </li>
              <li>Grade {explaining.farmer.qualityGrade} meets the minimum {explaining.buyer.minQualityGrade}</li>
              <li>
                Consignment {formatNumber(explaining.farmer.quantityKg)} kg clears the{' '}
                {formatNumber(explaining.buyer.minAcceptableQuantityKg)} kg minimum lot
              </li>
              <li>Road distance is inside the 250 km cap and the corridor is open</li>
            </ul>

            {explaining.priceAnomaly?.flagged && (
              <div className="notice notice--warning">
                <AlertTriangle size={16} />
                <div>
                  <strong>Anomaly-adjusted scoring</strong>
                  <p>{explaining.priceAnomaly.warning}</p>
                  <p>
                    Reference used: {formatCurrency(explaining.priceAnomaly.robustReference)}/kg (z ={' '}
                    {explaining.priceAnomaly.zScore}).
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MatchingPage;
