import React from 'react';
import { FlaskConical } from 'lucide-react';

interface SimulatedBadgeProps {
  compact?: boolean;
  title?: string;
}

/**
 * Every number in this application is generated demo data. The badge is shown
 * persistently so nobody mistakes the output for live market information.
 */
const SimulatedBadge: React.FC<SimulatedBadgeProps> = ({
  compact = false,
  title = 'All farmers, buyers, prices and price history are simulated for demonstration.',
}) => (
  <span className="sim-badge" title={title}>
    <FlaskConical size={compact ? 12 : 14} aria-hidden="true" />
    {compact ? 'SIMULATED' : 'SIMULATED DATA'}
  </span>
);

export default SimulatedBadge;
