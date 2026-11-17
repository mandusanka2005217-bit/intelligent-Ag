import React from 'react';
import { AlertTriangle, CloudRain, Sun } from 'lucide-react';
import type { ScenarioMeta } from '@contracts/types';
import { useScenarioStore } from '@core/store/scenarioStore';
import SimulatedBadge from '@/shared/components/SimulatedBadge';
import Skeleton from '@/shared/components/Skeleton';
import { formatWeight } from '@/shared/utils/format';
import { useScenarios } from '../hooks/useScenarios';

interface ScenarioBarProps {
  compact?: boolean;
}

/** Scenario A/B switch with a plain-language description of the disruption. */
const ScenarioBar: React.FC<ScenarioBarProps> = ({ compact = false }) => {
  const scenarioId = useScenarioStore((state) => state.scenarioId);
  const setScenario = useScenarioStore((state) => state.setScenario);
  const { data: scenarios = [], isLoading } = useScenarios();

  if (isLoading) {
    return (
      <div className="scenario-bar">
        <Skeleton width={220} height={38} radius={999} />
        <Skeleton width={280} height={18} />
      </div>
    );
  }

  const active = scenarios.find((scenario) => scenario.id === scenarioId) ?? scenarios[0];

  if (compact) {
    return (
      <div className="scenario-tabs" role="tablist" aria-label="Scenario">
        {scenarios.map((scenario) => (
          <button
            key={scenario.id}
            role="tab"
            aria-selected={scenario.id === scenarioId}
            className={`scenario-tab ${scenario.id === scenarioId ? 'scenario-tab--active' : ''}`}
            onClick={() => setScenario(scenario.id)}
          >
            {scenario.id === 'A' ? <Sun size={14} /> : <CloudRain size={14} />}
            Scenario {scenario.id}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="scenario-bar">
      <div className="scenario-bar__left">
        <div className="scenario-tabs" role="tablist" aria-label="Scenario">
          {scenarios.map((scenario) => (
            <button
              key={scenario.id}
              role="tab"
              aria-selected={scenario.id === scenarioId}
              className={`scenario-tab ${scenario.id === scenarioId ? 'scenario-tab--active' : ''}`}
              onClick={() => setScenario(scenario.id)}
            >
              {scenario.id === 'A' ? <Sun size={14} /> : <CloudRain size={14} />}
              Scenario {scenario.id}
            </button>
          ))}
        </div>
        {active && (
          <div className="scenario-bar__summary">
            <span className="scenario-bar__name">{active.name}</span>
            <span className="scenario-bar__totals">
              {formatWeight(active.totals.totalSupplyKg)} supply ·{' '}
              {formatWeight(active.totals.totalDemandKg)} demand
            </span>
          </div>
        )}
      </div>
      <div className="scenario-bar__right">
        {active && !compact && <DisruptionNotes scenario={active} />}
        <SimulatedBadge compact />
      </div>
    </div>
  );
};

function DisruptionNotes({ scenario }: { scenario: ScenarioMeta }) {
  const notes: string[] = [];
  if (scenario.disruption.supplyFactor < 1) {
    notes.push(`Supply ×${scenario.disruption.supplyFactor}`);
  }
  for (const corridor of scenario.disruption.blockedCorridors) {
    notes.push(`${corridor.from}–${corridor.to} closed`);
  }
  if (scenario.disruption.priceSpike) {
    notes.push(
      `${scenario.disruption.priceSpike.product} +${Math.round(
        scenario.disruption.priceSpike.pct * 100,
      )}%`,
    );
  }
  if (notes.length === 0) {
    return <span className="scenario-bar__calm">No disruptions modelled</span>;
  }
  return (
    <span className="scenario-bar__warn" title={scenario.description}>
      <AlertTriangle size={14} />
      {notes.join(' · ')}
    </span>
  );
}

export default ScenarioBar;
