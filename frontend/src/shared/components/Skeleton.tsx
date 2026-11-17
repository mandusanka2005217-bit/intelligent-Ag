import React from 'react';

interface SkeletonProps {
  width?: string | number;
  height?: number | string;
  radius?: number | string;
  className?: string;
}

/** Shimmering placeholder used while server data loads. */
const Skeleton: React.FC<SkeletonProps> = ({ width = '100%', height = 14, radius = 6, className = '' }) => (
  <span
    className={`skeleton ${className}`.trim()}
    style={{ width, height, borderRadius: radius }}
    aria-hidden="true"
  />
);

export default Skeleton;
