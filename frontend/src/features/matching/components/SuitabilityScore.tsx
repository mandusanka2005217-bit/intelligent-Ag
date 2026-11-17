import React from 'react';
import type { ScoreComponents } from '@contracts/types';

interface SuitabilityScoreProps {
  components: ScoreComponents;
  compact?: boolean;
}

const BARS: Array<{ key: keyof ScoreComponents; label: string; colour: string }> = [
  { key: 'price', label: 'Price', colour: '#2d6a4f' },
  { key: 'distance', label: 'Distance', colour: '#3a86ff' },
  { key: 'quantity', label: 'Quantity', colour: '#e07b39' },
  { key: 'quality', label: 'Quality', colour: '#6a4c93' },
  { key: 'availability', label: 'Timing', colour: '#52b788' },
];

/** Five 0–100 component bars that add up to the weighted suitability score. */
const SuitabilityScore: React.FC<SuitabilityScoreProps> = ({ components, compact = false }) => {
  return (
    <div className={`subscores ${compact ? 'subscores--compact' : ''}`}>
      {BARS.map(({ key, label, colour }) => {
        const value = Math.max(0, Math.min(100, components[key]));
        return (
          <div className="subscore" key={key}>
            <div className="subscore__top">
              <span>{label}</span>
              <strong style={{ color: colour }}>{Math.round(value)}</strong>
            </div>
            <div className="subscore__track">
              <div
                className="subscore__fill"
                style={{ width: `${value}%`, background: colour }}
                role="meter"
                aria-valuenow={Math.round(value)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${label} component`}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SuitabilityScore;
