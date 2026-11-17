import React from 'react';
import { PackageCheck, PackageX } from 'lucide-react';
import type { FarmerSurplus, UnmetDemand } from '../types';
import { formatPct, formatWeight } from '@/shared/utils/format';

interface UnmetDemandPanelProps {
  unmetDemand: UnmetDemand[];
  farmerSurplus: FarmerSurplus[];
}

/**
 * Two honest lists: which buyers still need produce, and which farmers still
 * hold produce that no buyer could take under the current constraints.
 */
const UnmetDemandPanel: React.FC<UnmetDemandPanelProps> = ({ unmetDemand, farmerSurplus }) => {
  const buyersShort = unmetDemand.filter((entry) => entry.unmetKg > 0);
  const farmersWithStock = farmerSurplus.filter((entry) => entry.surplusKg > 0);

  return (
    <div className="split-panel">
      <section className="split-panel__column">
        <header className="split-panel__header">
          <span className="split-panel__icon split-panel__icon--warn">
            <PackageX size={16} />
          </span>
          <div>
            <h4 className="split-panel__title">Unmet demand</h4>
            <p className="split-panel__subtitle">
              {buyersShort.length} buyer{buyersShort.length === 1 ? '' : 's'} short of the requested
              volume
            </p>
          </div>
        </header>

        {buyersShort.length === 0 ? (
          <p className="split-panel__empty">
            Every buyer received their full requirement under this configuration.
          </p>
        ) : (
          <ul className="fill-list">
            {buyersShort.map((entry) => (
              <li key={entry.buyerId} className="fill-row">
                <div className="fill-row__top">
                  <span className="fill-row__name">
                    {entry.buyerName}
                    <span className="chip chip--crop">{entry.cropType}</span>
                  </span>
                  <strong className="fill-row__value">{formatWeight(entry.unmetKg)} short</strong>
                </div>
                <div className="fill-row__bar">
                  <div
                    className="fill-row__fill fill-row__fill--warn"
                    style={{ width: `${Math.min(100, entry.fillRatio * 100)}%` }}
                  />
                </div>
                <div className="fill-row__meta">
                  <span>
                    {formatWeight(entry.allocatedKg)} of {formatWeight(entry.requiredKg)} ·{' '}
                    {formatPct(entry.fillRatio)}
                  </span>
                  <span>{entry.location}</span>
                </div>
                {entry.reasons.length > 0 && (
                  <p className="fill-row__reason">{entry.reasons[0]}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="split-panel__column">
        <header className="split-panel__header">
          <span className="split-panel__icon split-panel__icon--good">
            <PackageCheck size={16} />
          </span>
          <div>
            <h4 className="split-panel__title">Farmer surplus</h4>
            <p className="split-panel__subtitle">
              {farmersWithStock.length} supplier{farmersWithStock.length === 1 ? '' : 's'} with unsold
              stock
            </p>
          </div>
        </header>

        {farmersWithStock.length === 0 ? (
          <p className="split-panel__empty">All offered produce was allocated.</p>
        ) : (
          <ul className="fill-list">
            {farmersWithStock.map((entry) => {
              const used = entry.availableKg > 0 ? entry.allocatedKg / entry.availableKg : 0;
              return (
                <li key={entry.farmerId} className="fill-row">
                  <div className="fill-row__top">
                    <span className="fill-row__name">
                      {entry.farmerName}
                      <span className="chip chip--crop">{entry.cropType}</span>
                    </span>
                    <strong className="fill-row__value">{formatWeight(entry.surplusKg)} left</strong>
                  </div>
                  <div className="fill-row__bar">
                    <div
                      className="fill-row__fill fill-row__fill--good"
                      style={{ width: `${Math.min(100, used * 100)}%` }}
                    />
                  </div>
                  <div className="fill-row__meta">
                    <span>
                      {formatWeight(entry.allocatedKg)} of {formatWeight(entry.availableKg)} sold ·{' '}
                      {formatPct(used)}
                    </span>
                    <span>{entry.location}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
};

export default UnmetDemandPanel;
