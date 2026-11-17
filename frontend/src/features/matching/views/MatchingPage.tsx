import React, { useState } from 'react';
import { Play, GitMerge, RefreshCw } from 'lucide-react';
import Button from '@/core/components/Button';
import MatchList from '../components/MatchList';
import { useMatches, useRunMatching } from '../hooks/useMatches';

const MatchingPage: React.FC = () => {
  const [minScore, setMinScore] = useState<number>(0);

  const { data: matches = [], isLoading, refetch } = useMatches({ minScore: minScore || undefined });
  const runMatching = useRunMatching();

  const handleRunMatching = async () => {
    const result = await runMatching.mutateAsync();
    // Refetch after run
    refetch();
    alert(`Matching complete! ${result.matchesCreated} new match${result.matchesCreated !== 1 ? 'es' : ''} created.`);
  };

  return (
    <div>
      {/* Page header */}
      <div className="page-header">
        <div>
          <h2 className="page-header__title">Matching</h2>
          <p className="page-header__subtitle">
            {matches.length} farmer–buyer match{matches.length !== 1 ? 'es' : ''} found
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <Button
            variant="outline"
            leftIcon={<RefreshCw size={16} />}
            onClick={() => refetch()}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            leftIcon={<Play size={16} />}
            onClick={handleRunMatching}
            loading={runMatching.isPending}
          >
            Run Matching
          </Button>
        </div>
      </div>

      {/* Filter bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '1.5rem',
          padding: '0.75rem 1rem',
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
        }}
      >
        <label style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>
          Min. Suitability Score:
        </label>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={minScore}
          onChange={(e) => setMinScore(Number(e.target.value))}
          style={{ width: 160 }}
        />
        <span
          style={{
            fontWeight: 700,
            color: 'var(--color-primary)',
            minWidth: 36,
            fontSize: 'var(--text-sm)',
          }}
        >
          {minScore}+
        </span>
      </div>

      {/* Run matching error */}
      {runMatching.isError && (
        <div style={{ color: 'var(--color-danger)', marginBottom: '1rem' }}>
          Failed to run matching. Please try again.
        </div>
      )}

      <MatchList matches={matches} isLoading={isLoading} />
    </div>
  );
};

export default MatchingPage;
