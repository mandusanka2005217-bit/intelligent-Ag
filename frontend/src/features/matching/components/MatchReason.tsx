import React from 'react';
import { CheckCircle } from 'lucide-react';

interface MatchReasonProps {
  reasons: string[];
}

const MatchReason: React.FC<MatchReasonProps> = ({ reasons }) => {
  if (!reasons || reasons.length === 0) return null;

  return (
    <div className="match-reasons" style={{ marginTop: '0.5rem' }}>
      {reasons.map((reason, idx) => (
        <span key={idx} className="match-reason-tag">
          <CheckCircle size={10} style={{ marginRight: 4, verticalAlign: 'middle' }} />
          {reason}
        </span>
      ))}
    </div>
  );
};

export default MatchReason;
