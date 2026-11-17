import React from 'react';

interface ScoreBadgeProps {
  score: number; // 0–100
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

function getScoreVariant(score: number): 'high' | 'medium' | 'low' {
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

function getScoreLabel(score: number): string {
  if (score >= 70) return 'High';
  if (score >= 40) return 'Medium';
  return 'Low';
}

const sizeStyles: Record<string, React.CSSProperties> = {
  sm: { fontSize: '0.7rem', padding: '1px 6px', minWidth: 36 },
  md: { fontSize: '0.8rem', padding: '2px 10px', minWidth: 48 },
  lg: { fontSize: '1rem', padding: '4px 14px', minWidth: 60 },
};

const ScoreBadge: React.FC<ScoreBadgeProps> = ({ score, size = 'md', showLabel = false }) => {
  const variant = getScoreVariant(score);
  const label = getScoreLabel(score);
  const clamped = Math.max(0, Math.min(100, Math.round(score)));

  return (
    <span
      className={`score-badge score-badge--${variant}`}
      title={`Score: ${clamped} / 100 — ${label}`}
      style={sizeStyles[size]}
    >
      {clamped}
      {showLabel && <span style={{ marginLeft: 4, fontWeight: 400 }}>({label})</span>}
    </span>
  );
};

export default ScoreBadge;
