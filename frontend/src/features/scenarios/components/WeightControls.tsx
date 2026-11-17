import React from 'react';
import { RotateCcw, SlidersHorizontal } from 'lucide-react';
import type { WeightVector } from '@contracts/types';
import Button from '@/core/components/Button';
import { useScenarioStore } from '@core/store/scenarioStore';

const WEIGHT_FIELDS: Array<{ key: keyof WeightVector; label: string; hint: string }> = [
  { key: 'price', label: 'Price', hint: 'Asking price vs the market reference' },
  { key: 'distance', label: 'Distance', hint: 'Road distance, capped at 250 km' },
  { key: 'quantity', label: 'Quantity fit', hint: 'Farmer volume vs buyer requirement' },
  { key: 'quality', label: 'Quality', hint: 'A / B / C grade score' },
  { key: 'availability', label: 'Availability', hint: 'How close the harvest date is' },
];

/**
 * Weight sliders. The API re-normalises the vector to sum to 1, so the labels
 * show a percentage of the current total rather than pretending it is already
 * normalised in the browser.
 */
const WeightControls: React.FC = () => {
  const weights = useScenarioStore((state) => state.weights);
  const setWeight = useScenarioStore((state) => state.setWeight);
  const resetWeights = useScenarioStore((state) => state.resetWeights);
  const total = Object.values(weights).reduce((sum, value) => sum + value, 0) || 1;

  return (
    <div className="control-panel">
      <div className="control-panel__header">
        <div className="control-panel__title">
          <SlidersHorizontal size={16} />
          <span>Scoring weights</span>
        </div>
        <Button variant="ghost" size="sm" leftIcon={<RotateCcw size={13} />} onClick={resetWeights}>
          Reset
        </Button>
      </div>
      <p className="control-panel__hint">
        Tune what “best match” means. The server normalises these to 100% before scoring.
      </p>
      <div className="weight-list">
        {WEIGHT_FIELDS.map(({ key, label, hint }) => {
          const value = weights[key];
          const share = Math.round((value / total) * 100);
          return (
            <div className="weight-row" key={key}>
              <div className="weight-row__top">
                <label htmlFor={`weight-${key}`} title={hint}>
                  {label}
                </label>
                <span className="weight-row__value">{share}%</span>
              </div>
              <input
                id={`weight-${key}`}
                className="weight-slider"
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={value}
                aria-label={`${label} weight`}
                onChange={(event) => setWeight(key, Number(event.target.value))}
              />
            </div>
          );
        })}
      </div>
      {total === 0 && (
        <p className="form-error" role="alert">
          At least one weight must be above zero.
        </p>
      )}
    </div>
  );
};

export default WeightControls;
