import React from 'react';
import { AlertTriangle, ArrowRight, GitMerge, Info, MapPin, Truck } from 'lucide-react';
import type { Match } from '@contracts/types';
import ScoreBadge from '@/shared/components/ScoreBadge';
import EmptyState from '@/shared/components/EmptyState';
import Skeleton from '@/shared/components/Skeleton';
import { formatBuyerRank, formatCurrency, formatDistance, formatWeight } from '@/shared/utils/format';
import MatchReason from './MatchReason';
import SuitabilityScore from './SuitabilityScore';

interface MatchListProps {
  matches: Match[];
  isLoading?: boolean;
  onExplain?: (match: Match) => void;
}

const MatchList: React.FC<MatchListProps> = ({ matches, isLoading = false, onExplain }) => {
  if (isLoading) {
    return (
      <div className="match-list">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="match-card">
            <Skeleton width={64} height={64} radius={999} />
            <div className="match-card__content">
              <Skeleton width="55%" height={18} />
              <div style={{ height: 8 }} />
              <Skeleton width="35%" height={12} />
              <div style={{ height: 14 }} />
              <Skeleton width="100%" height={40} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <EmptyState
        icon={<GitMerge size={48} />}
        title="No feasible matches"
        description="No farmer satisfies every hard constraint for this scenario and weight vector. Try lowering the minimum score or switching to scenario A."
      />
    );
  }

  return (
    <div className="match-list">
      {matches.map((match) => (
        <article key={match.id} className="match-card">
          <div className="match-card__score">
            <ScoreBadge score={match.suitabilityScore} size="lg" />
            <span className="match-card__rank">{formatBuyerRank(match.rankPercentile)}</span>
          </div>

          <div className="match-card__content">
            <div className="match-card__title">
              {match.farmer.name}
              <ArrowRight size={15} aria-hidden="true" />
              {match.buyer.name}
            </div>
            <div className="match-card__meta">
              <span className="chip chip--crop">{match.cropType}</span>
              <span>
                <MapPin size={12} aria-hidden="true" /> {match.farmer.location} →{' '}
                {match.buyer.location}
              </span>
              <span>{formatDistance(match.distanceKm)}</span>
              <span>{formatCurrency(match.pricePerKg)}/kg</span>
              <span>
                <Truck size={12} aria-hidden="true" /> {formatCurrency(match.transportCostPerKg)}/kg
              </span>
            </div>

            <div className="match-card__volumes">
              <span>
                Offers <strong>{formatWeight(match.farmer.quantityKg)}</strong>
              </span>
              <span>
                Needs <strong>{formatWeight(match.buyer.requiredQuantityKg)}</strong>
              </span>
              <span>
                Min lot <strong>{formatWeight(match.buyer.minAcceptableQuantityKg)}</strong>
              </span>
            </div>

            {match.priceAnomaly?.flagged && (
              <div className="inline-warning">
                <AlertTriangle size={13} />
                {match.cropType} market price is anomalous — scoring uses the robust reference{' '}
                {formatCurrency(match.priceAnomaly.robustReference)}/kg and caps price influence.
              </div>
            )}

            <SuitabilityScore components={match.components} />
            <MatchReason reasons={match.reasons} />

            {onExplain && (
              <button className="link-button" onClick={() => onExplain(match)}>
                <Info size={14} /> Why this match?
              </button>
            )}
          </div>
        </article>
      ))}
    </div>
  );
};

export default MatchList;
