import React from 'react';
import { CheckCircle2 } from 'lucide-react';

interface MatchReasonProps {
  reasons: string[];
}

const MatchReason: React.FC<MatchReasonProps> = ({ reasons }) => {
  if (!reasons || reasons.length === 0) return null;

  return (
    <div className="match-reasons">
      {reasons.map((reason) => (
        <span key={reason} className="match-reason-tag">
          <CheckCircle2 size={11} aria-hidden="true" />
          {reason}
        </span>
      ))}
    </div>
  );
};

export default MatchReason;
