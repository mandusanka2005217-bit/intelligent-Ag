import React, { useMemo } from 'react';
import {
  sankey,
  sankeyJustify,
  sankeyLinkHorizontal,
  type SankeyLink,
  type SankeyNode,
} from 'd3-sankey';
import { GitBranch } from 'lucide-react';
import type { AllocationRow } from '../types';
import EmptyState from '@/shared/components/EmptyState';
import { productColour } from '@/shared/constants';
import { formatWeight } from '@/shared/utils/format';

interface SankeyNodeDatum {
  id: string;
  name: string;
  side: 'farmer' | 'buyer';
}

interface SankeyLinkDatum {
  source: string;
  target: string;
  value: number;
  cropType: string;
}

type Node = SankeyNode<SankeyNodeDatum, SankeyLinkDatum>;
type Link = SankeyLink<SankeyNodeDatum, SankeyLinkDatum>;

const WIDTH = 920;
const HEIGHT = 430;

interface AllocationSankeyProps {
  allocations: AllocationRow[];
}

/**
 * Farmer -> buyer flow diagram drawn with d3-sankey. Link thickness is the
 * allocated kilograms, so a single glance shows where the volume went and which
 * buyers received the lion's share.
 */
const AllocationSankey: React.FC<AllocationSankeyProps> = ({ allocations }) => {
  const graph = useMemo(() => {
    if (allocations.length === 0) return null;

    const nodeMap = new Map<string, SankeyNodeDatum>();
    const addNode = (id: string, name: string, side: 'farmer' | 'buyer') => {
      if (!nodeMap.has(id)) nodeMap.set(id, { id, name, side });
    };

    for (const row of allocations) {
      addNode(`F:${row.farmerId}`, row.farmerName, 'farmer');
      addNode(`B:${row.buyerId}`, row.buyerName, 'buyer');
    }

    const nodes = Array.from(nodeMap.values());
    const links: SankeyLinkDatum[] = allocations.map((row) => ({
      source: `F:${row.farmerId}`,
      target: `B:${row.buyerId}`,
      value: row.quantityKg,
      cropType: row.cropType,
    }));

    const layout = sankey<SankeyNodeDatum, SankeyLinkDatum>()
      .nodeId((node) => node.id)
      .nodeAlign(sankeyJustify)
      .nodeWidth(14)
      .nodePadding(14)
      .extent([
        [1, 10],
        [WIDTH - 1, HEIGHT - 10],
      ]);

    return layout({ nodes, links });
  }, [allocations]);

  if (!graph) {
    return (
      <EmptyState
        icon={<GitBranch size={48} />}
        title="Nothing to visualise yet"
        description="The flow diagram appears once at least one consignment is allocated."
      />
    );
  }

  const pathFor = sankeyLinkHorizontal<SankeyNodeDatum, SankeyLinkDatum>();

  return (
    <div className="sankey">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        width="100%"
        height={HEIGHT}
        role="img"
        aria-label="Sankey diagram of kilograms flowing from farmers to buyers"
      >
        <g className="sankey__links">
          {graph.links.map((link, index) => {
            const source = link.source as Node;
            const target = link.target as Node;
            const width = Math.max(1, link.width ?? 1);
            return (
              <path
                key={`${source.id}-${target.id}-${index}`}
                d={pathFor(link) ?? undefined}
                fill="none"
                stroke={productColour((link as SankeyLinkDatum).cropType)}
                strokeOpacity={0.32}
                strokeWidth={width}
              >
                <title>
                  {source.name} → {target.name}: {formatWeight(link.value)} of{' '}
                  {(link as SankeyLinkDatum).cropType}
                </title>
              </path>
            );
          })}
        </g>

        <g className="sankey__nodes">
          {graph.nodes.map((node) => {
            const x0 = node.x0 ?? 0;
            const x1 = node.x1 ?? 0;
            const y0 = node.y0 ?? 0;
            const y1 = node.y1 ?? 0;
            const isFarmer = node.side === 'farmer';
            const label = node.id.replace(/^[FB]:/, '');
            return (
              <g key={node.id}>
                <rect
                  x={x0}
                  y={y0}
                  width={Math.max(1, x1 - x0)}
                  height={Math.max(1, y1 - y0)}
                  rx={3}
                  fill={isFarmer ? '#2d6a4f' : '#e07b39'}
                >
                  <title>
                    {node.name} — {formatWeight(node.value ?? 0)}
                  </title>
                </rect>
                <text
                  x={isFarmer ? x1 + 7 : x0 - 7}
                  y={y0 + (y1 - y0) / 2}
                  dy="0.32em"
                  textAnchor={isFarmer ? 'start' : 'end'}
                  className="sankey__label"
                >
                  {label}
                  <tspan className="sankey__value"> {formatWeight(node.value ?? 0)}</tspan>
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      <div className="sankey__legend">
        <span>
          <i className="sankey__swatch sankey__swatch--farmer" /> Farmer
        </span>
        <span>
          <i className="sankey__swatch sankey__swatch--buyer" /> Buyer
        </span>
        <span className="sankey__hint">Link thickness = kilograms · colour = crop</span>
      </div>
    </div>
  );
};

export default AllocationSankey;
