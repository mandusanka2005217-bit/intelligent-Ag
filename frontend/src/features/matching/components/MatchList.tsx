import React from 'react';
import ScoreBadge from '@/shared/components/ScoreBadge';
import MatchReason from './MatchReason';
import SuitabilityScore from './SuitabilityScore';
import EmptyState from '@/shared/components/EmptyState';
import { GitMerge } from 'lucide-react';
import { formatDate } from '@/shared/utils/format';
import type { Match } from '../types';

interface MatchListProps {
  matches: Match[];
  isLoading?: boolean;
}

const MatchList: React.FC<MatchListProps> = ({ matches, isLoading = false }) => {
  if (isLoading) {
    return (
      <div className="match-list">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="match-card" style={{ opacity: 0.5 }}>
            <div style={{ width: 48, height: 48, background: '#e5e7eb', borderRadius: '50%' }} />
            <div style={{ flex: 1 }}>
              <div style={{ height: 16, background: '#e5e7eb', borderRadius: 4, width: '60%', marginBottom: 8 }} />
              <div style={{ height: 12, background: '#e5e7eb', borderRadius: 4, width: '40%' }} />
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
        title="No Matches Yet"
        description="Run the matching algorithm to find compatible farmer-buyer pairs."
      />
    );
  }

  return (
    <div className="match-list">
      {matches.map((match) => (
        <div key={match.id} className="match-card">
          {/* Overall score badge */}
          <div className="match-card__score">
            <ScoreBadge score={match.suitabilityScore} size="lg" />
          </div>

          {/* Match content */}
          <div className="match-card__content">
            <div className="match-card__title">
              {match.farmer.name} → {match.buyer.name}
            </div>
            <div className="match-card__meta">
              {match.farmer.cropType} · {match.farmer.location} → {match.buyer.location}
              {' · '}
              <span style={{ color: 'var(--color-text-light)' }}>
                {formatDate(match.createdAt)}
              </span>
            </div>

            {/* Sub-scores */}
            <div style={{ marginTop: '0.75rem' }}>
              <SuitabilityScore
                distanceScore={match.distanceScore}
                priceScore={match.priceScore}
                cropScore={match.cropScore}
                quantityScore={match.quantityScore}
              />
            </div>

            {/* Reasons */}
            <MatchReason reasons={match.reasons} />
          </div>
        </div>
      ))}
    </div>
  );
};

export default MatchList;
