import React, { useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Polyline, Tooltip } from 'react-leaflet';
import type { Buyer, Farmer, Town } from '@contracts/types';
import type { AllocationRow } from '../types';
import { productColour } from '@/shared/constants';
import { formatWeight } from '@/shared/utils/format';

interface AllocationMapProps {
  allocations: AllocationRow[];
  towns: Town[];
  farmers: Farmer[];
  buyers: Buyer[];
}

const SRI_LANKA_CENTRE: [number, number] = [7.65, 80.7];

/**
 * Geographic view of the allocation. Farmer and buyer towns are plotted from the
 * simulated location table and each consignment is drawn as a straight leg.
 *
 * The line is a visual aid, not a route: real road distance is approximated with
 * haversine × 1.3 in the backend. Base-map tiles come from OpenStreetMap, so the
 * basemap needs internet access; the markers and lines do not.
 */
const AllocationMap: React.FC<AllocationMapProps> = ({ allocations, towns, farmers, buyers }) => {
  const townIndex = useMemo(() => {
    const index = new Map<string, Town>();
    for (const town of towns) index.set(town.name.toLowerCase(), town);
    return index;
  }, [towns]);

  const farmerIndex = useMemo(() => new Map(farmers.map((farmer) => [farmer.id, farmer])), [farmers]);
  const buyerIndex = useMemo(() => new Map(buyers.map((buyer) => [buyer.id, buyer])), [buyers]);

  const legs = useMemo(() => {
    return allocations
      .map((row) => {
        const farmer = farmerIndex.get(row.farmerId);
        const buyer = buyerIndex.get(row.buyerId);
        if (!farmer || !buyer) return null;
        const farmerTown = townIndex.get(farmer.location.toLowerCase());
        const buyerTown = townIndex.get(buyer.location.toLowerCase());
        if (!farmerTown || !buyerTown) return null;
        return { row, farmerTown, buyerTown };
      })
      .filter((leg): leg is NonNullable<typeof leg> => leg !== null);
  }, [allocations, buyerIndex, farmerIndex, townIndex]);

  if (legs.length === 0) {
    return (
      <p className="map-empty">
        {towns.length === 0
          ? 'Loading simulated town coordinates…'
          : 'No consignments to plot for this configuration. Nothing could be allocated between these towns.'}
      </p>
    );
  }

  return (
    <div className="allocation-map">
      <MapContainer
        center={SRI_LANKA_CENTRE}
        zoom={7}
        scrollWheelZoom={false}
        style={{ height: 380, width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {legs.map(({ row, farmerTown, buyerTown }) => (
          <Polyline
            key={`line-${row.id}`}
            positions={[
              [farmerTown.lat, farmerTown.lon],
              [buyerTown.lat, buyerTown.lon],
            ]}
            pathOptions={{
              color: productColour(row.cropType),
              weight: 2,
              opacity: 0.55,
            }}
          >
            <Tooltip>
              {row.farmerName} → {row.buyerName} · {formatWeight(row.quantityKg)}
            </Tooltip>
          </Polyline>
        ))}

        {legs.map(({ row, farmerTown }) => (
          <CircleMarker
            key={`farmer-${row.id}`}
            center={[farmerTown.lat, farmerTown.lon]}
            radius={6}
            pathOptions={{ color: '#ffffff', weight: 1.5, fillColor: '#2d6a4f', fillOpacity: 1 }}
          >
            <Tooltip>{row.farmerName} (supply)</Tooltip>
          </CircleMarker>
        ))}

        {legs.map(({ row, buyerTown }) => (
          <CircleMarker
            key={`buyer-${row.id}`}
            center={[buyerTown.lat, buyerTown.lon]}
            radius={7}
            pathOptions={{ color: '#ffffff', weight: 1.5, fillColor: '#e07b39', fillOpacity: 1 }}
          >
            <Tooltip>{row.buyerName} (demand)</Tooltip>
          </CircleMarker>
        ))}
      </MapContainer>

      <div className="map-legend">
        <span>
          <i className="map-legend__dot map-legend__dot--farmer" /> Farmer town
        </span>
        <span>
          <i className="map-legend__dot map-legend__dot--buyer" /> Buyer town
        </span>
        <span className="map-legend__note">
          Straight lines are illustrative; scoring uses haversine × 1.3 road distance.
        </span>
      </div>
    </div>
  );
};

export default AllocationMap;
