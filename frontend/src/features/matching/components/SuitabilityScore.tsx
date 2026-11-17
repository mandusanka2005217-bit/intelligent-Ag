import React from 'react';

interface SubScore {
  label: string;
  value: number;
  color: string;
}

interface SuitabilityScoreProps {
  distanceScore: number;
  priceScore: number;
  cropScore: number;
  quantityScore: number;
}

const SuitabilityScore: React.FC<SuitabilityScoreProps> = ({
  distanceScore,
  priceScore,
  cropScore,
  quantityScore,
}) => {
  const subScores: SubScore[] = [
    { label: 'Distance', value: distanceScore, color: '#3a86ff' },
    { label: 'Price', value: priceScore, color: '#2d6a4f' },
    { label: 'Crop Match', value: cropScore, color: '#52b788' },
    { label: 'Quantity', value: quantityScore, color: '#f4a261' },
  ];

  return (
    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
      {subScores.map(({ label, value, color }) => (
        <div key={label} style={{ minWidth: 100 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#6b7280', marginBottom: 2 }}>
            <span>{label}</span>
            <span style={{ fontWeight: 600, color }}>{Math.round(value)}</span>
          </div>
          <div
            style={{
              height: 6,
              background: '#e5e7eb',
              borderRadius: 9999,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${Math.max(0, Math.min(100, value))}%`,
                background: color,
                borderRadius: 9999,
                transition: 'width 0.5s ease',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export default SuitabilityScore;
