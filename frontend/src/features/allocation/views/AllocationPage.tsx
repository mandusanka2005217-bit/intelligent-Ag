import React, { useState } from 'react';
import { AlertTriangle, GitBranch, Map, RefreshCw, Settings2 } from 'lucide-react';
import type { AllocationRow, ShortagePolicy, StrategyId } from '../types';
import Button from '@/core/components/Button';
import { useScenarioStore } from '@core/store/scenarioStore';
import Card from '@/shared/components/Card';
import Drawer from '@/shared/components/Drawer';
import SimulatedBadge from '@/shared/components/SimulatedBadge';
import { STRATEGY_OPTIONS } from '@/shared/constants';
import { apiErrorMessage } from '@/shared/services/api-client';
import { formatDateTime, formatNumber } from '@/shared/utils/format';
import ScenarioBar from '@/features/scenarios/components/ScenarioBar';
import { useScenarioData } from '@/features/scenarios/hooks/useScenarios';
import AllocationBoard from '../components/AllocationBoard';
import AllocationDetail from '../components/AllocationDetail';
import AllocationMap from '../components/AllocationMap';
import AllocationSankey from '../components/AllocationSankey';
import SupplyUtilization from '../components/SupplyUtilization';
import UnmetDemandPanel from '../components/UnmetDemandPanel';
import { useAllocation } from '../hooks/useAllocation';

const SHORTAGE_POLICIES: Array<{ id: ShortagePolicy; label: string; hint: string }> = [
  {
    id: 'score-priority',
    label: 'Score priority',
    hint: 'Give scarce kilograms to the strongest matches first.',
  },
  {
    id: 'proportional',
    label: 'Proportional',
    hint: 'Spread scarce kilograms across buyers in proportion to demand.',
  },
];

const AllocationPage: React.FC = () => {
  const scenarioId = useScenarioStore((state) => state.scenarioId);
  const strategy = useScenarioStore((state) => state.strategy);
  const setStrategy = useScenarioStore((state) => state.setStrategy);
  const shortagePolicy = useScenarioStore((state) => state.shortagePolicy);
  const setShortagePolicy = useScenarioStore((state) => state.setShortagePolicy);

  const { data, isLoading, isFetching, refetch, error } = useAllocation();
  const { data: scenarioData } = useScenarioData(scenarioId);
  const [selected, setSelected] = useState<AllocationRow | null>(null);

  const allocations = data?.allocations ?? [];
  const flagged = (data?.anomalies ?? []).filter((anomaly) => anomaly.flagged);

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-header__title">Allocation</h2>
          <p className="page-header__subtitle">
            Turn scored matches into concrete consignments, then inspect what could not be served.
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
            Re-run
          </Button>
        </div>
      </div>

      <ScenarioBar />

      <Card
        className="settings-card"
        title={
          <span className="card__title-inline">
            <Settings2 size={16} /> Allocation strategy
          </span>
        }
        subtitle="The same feasible pairs, solved three different ways"
      >
        <div className="strategy-picker" role="radiogroup" aria-label="Allocation strategy">
          {STRATEGY_OPTIONS.map((option) => (
            <button
              key={option.id}
              role="radio"
              aria-checked={strategy === option.id}
              className={`strategy-option ${strategy === option.id ? 'strategy-option--active' : ''}`}
              onClick={() => setStrategy(option.id as StrategyId)}
            >
              <span className="strategy-option__label">{option.label}</span>
              <span className="strategy-option__description">{option.description}</span>
            </button>
          ))}
        </div>

        <div className="policy-row">
          <span className="policy-row__label">When produce is scarce</span>
          <div className="segmented" role="radiogroup" aria-label="Shortage policy">
            {SHORTAGE_POLICIES.map((policy) => (
              <button
                key={policy.id}
                role="radio"
                aria-checked={shortagePolicy === policy.id}
                className={`segmented__item ${shortagePolicy === policy.id ? 'segmented__item--active' : ''}`}
                onClick={() => setShortagePolicy(policy.id)}
                title={policy.hint}
              >
                {policy.label}
              </button>
            ))}
          </div>
        </div>

        {data && (
          <p className="solver-note">
            <GitBranch size={14} aria-hidden="true" />
            {data.solver.algorithm} · {formatNumber(data.solver.augmentations)} augmentations ·{' '}
            {formatNumber(data.solver.minLotRepairs)} minimum-lot repairs · generated{' '}
            {formatDateTime(data.generatedAt)}
          </p>
        )}
      </Card>

      {(error || flagged.length > 0) && (
        <div className={`notice ${error ? 'notice--danger' : 'notice--warning'}`} role="status">
          <AlertTriangle size={16} />
          <div>
            {error ? (
              apiErrorMessage(error)
            ) : (
              <>
                <strong>Price anomaly adjusted this allocation.</strong>
                {flagged.map((anomaly) => (
                  <p key={anomaly.product}>{anomaly.warning}</p>
                ))}
              </>
            )}
          </div>
        </div>
      )}

      <SupplyUtilization kpis={data?.kpis} isLoading={isLoading} />

      <div className="allocation-visuals">
        <Card
          title={
            <span className="card__title-inline">
              <GitBranch size={16} /> Supply flow
            </span>
          }
          subtitle="Kilograms flowing from each farmer to each buyer"
        >
          <AllocationSankey allocations={allocations} />
        </Card>

        <Card
          title={
            <span className="card__title-inline">
              <Map size={16} /> Corridor map
            </span>
          }
          subtitle="Simulated towns and allocated road legs"
        >
          <AllocationMap
            allocations={allocations}
            towns={scenarioData?.locations ?? []}
            farmers={scenarioData?.farmers ?? []}
            buyers={scenarioData?.buyers ?? []}
          />
        </Card>
      </div>

      <Card
        title="What could not be served"
        subtitle="Unmet demand and unallocated supply, with the binding constraint on each"
      >
        <UnmetDemandPanel
          unmetDemand={data?.unmetDemand ?? []}
          farmerSurplus={data?.farmerSurplus ?? []}
        />
      </Card>

      <Card
        title={`Consignments (${allocations.length})`}
        subtitle="Select a row to see the full scoring explanation"
        padded={false}
      >
        <div className="card__body">
          <AllocationBoard allocations={allocations} isLoading={isLoading} onSelect={setSelected} />
        </div>
      </Card>

      <Drawer
        isOpen={selected !== null}
        onClose={() => setSelected(null)}
        title={selected ? `${selected.farmerName} → ${selected.buyerName}` : 'Consignment'}
        subtitle={selected ? `${selected.farmerId} → ${selected.buyerId} · ${selected.cropType}` : undefined}
      >
        {selected && <AllocationDetail row={selected} />}
      </Drawer>
    </div>
  );
};

export default AllocationPage;
