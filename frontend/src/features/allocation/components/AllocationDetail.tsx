import React from 'react';
import { AlertTriangle, ArrowRight, MapPin, Truck } from 'lucide-react';
import type { AllocationRow } from '../types';
import SuitabilityScore from '@/features/matching/components/SuitabilityScore';
import { formatCurrency, formatDistance, formatWeight } from '@/shared/utils/format';

interface AllocationDetailProps {
  row: AllocationRow;
}

/** Drawer body explaining one consignment decision end to end. */
const AllocationDetail: React.FC<AllocationDetailProps> = ({ row }) => {
  return (
    <div className="allocation-detail">
      <div className="allocation-detail__route">
        <div>
          <span className="allocation-detail__role">Farmer</span>
          <strong>{row.farmerName}</strong>
          <span className="allocation-detail__id">{row.farmerId}</span>
        </div>
        <ArrowRight size={18} aria-hidden="true" />
        <div>
          <span className="allocation-detail__role">Buyer</span>
          <strong>{row.buyerName}</strong>
          <span className="allocation-detail__id">{row.buyerId}</span>
        </div>
      </div>

      <div className="allocation-detail__figures">
        <div>
          <span className="stat__label">Allocated</span>
          <strong>{formatWeight(row.quantityKg)}</strong>
        </div>
        <div>
          <span className="stat__label">Agreed price</span>
          <strong>{formatCurrency(row.pricePerKg)}/kg</strong>
        </div>
        <div>
          <span className="stat__label">Market reference</span>
          <strong>{formatCurrency(row.marketPrice)}/kg</strong>
        </div>
        <div>
          <span className="stat__label">Transport</span>
          <strong>{formatCurrency(row.transportCostRs)}</strong>
        </div>
      </div>

      <p className="explain__lead">{row.explanation}</p>

      <div className="allocation-detail__travel">
        <span>
          <MapPin size={14} aria-hidden="true" /> {formatDistance(row.distanceKm)} road distance
        </span>
        <span>
          <Truck size={14} aria-hidden="true" /> {formatCurrency(row.transportCostPerKg)}/kg
        </span>
        <span className="chip chip--crop">{row.cropType}</span>
      </div>

      <h4 className="explain__heading">Score components ({row.suitabilityScore.toFixed(1)} / 100)</h4>
      <SuitabilityScore components={row.components} />

      {row.reasons.length > 0 && (
        <>
          <h4 className="explain__heading">Why this pair</h4>
          <ul className="check-list">
            {row.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </>
      )}

      {row.priceAnomaly?.flagged && (
        <div className="notice notice--warning">
          <AlertTriangle size={16} />
          <div>
            <strong>Price anomaly adjusted the scoring</strong>
            <p>{row.priceAnomaly.warning}</p>
            <p>
              Robust reference {formatCurrency(row.priceAnomaly.robustReference)}/kg (z ={' '}
              {row.priceAnomaly.zScore ?? 'n/a'}).
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllocationDetail;
