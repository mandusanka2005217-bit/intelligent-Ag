import type { Buyer, Farmer } from '@contracts/types';
import { topUpGreedy } from './greedy';
import {
  demandMap,
  flowKey,
  normalizeFlows,
  proportionalTargets,
  type Flow,
  type NetworkEdge,
} from './shared';

interface Arc {
  to: number;
  rev: number;
  cap: number;
  cost: number;
}

interface TrackedArc {
  edge: NetworkEdge;
  arc: Arc;
  originalCap: number;
}

const INF = Number.MAX_SAFE_INTEGER / 4;

/**
 * Min-cost max-flow via successive shortest augmenting paths (SPFA).
 *
 * WHY this algorithm:
 *  - The problem is a bipartite transportation problem. Modelling it as a flow
 *    network gives exact feasibility and conservation for free.
 *  - We maximise total kg first (every augmenting path adds flow), so a shortage
 *    never leaves a usable kilogram behind.
 *  - Among maximum flows we minimise edge cost, which is the score-loss plus
 *    transport disutility. SPFA handles the negative residual arcs created by
 *    earlier augmentations without requiring Johnson potentials.
 *  - With 15 farmers and 8 buyers the graph has 25 nodes; this is microseconds.
 *
 * The implementation is deliberately dependency-free. Tests compare its
 * objective with an independent LP solver on random instances.
 */
export function minCostFlow(
  edges: NetworkEdge[],
  farmers: Farmer[],
  buyers: Buyer[],
  limits: Map<string, number>,
): { flows: Flow[]; augmentations: number; totalEdgeCost: number } {
  const farmerIndex = new Map(farmers.map((farmer, index) => [farmer.id, index]));
  const buyerIndex = new Map(buyers.map((buyer, index) => [buyer.id, index]));
  const nodeCount = 1 + farmers.length + buyers.length + 1;
  const source = 0;
  const sink = nodeCount - 1;
  const graph: Arc[][] = Array.from({ length: nodeCount }, () => []);

  function addEdge(from: number, to: number, cap: number, cost: number): Arc {
    const forward: Arc = { to, rev: graph[to].length, cap, cost };
    const reverse: Arc = { to: from, rev: graph[from].length, cap: 0, cost: -cost };
    graph[from].push(forward);
    graph[to].push(reverse);
    return forward;
  }

  for (const [index, farmer] of farmers.entries()) {
    if (farmer.quantityKg > 0) addEdge(source, 1 + index, farmer.quantityKg, 0);
  }
  for (const [index, buyer] of buyers.entries()) {
    const limit = Math.min(limits.get(buyer.id) ?? buyer.requiredQuantityKg, buyer.requiredQuantityKg);
    if (limit > 0) addEdge(1 + farmers.length + index, sink, limit, 0);
  }

  const tracked: TrackedArc[] = [];
  for (const edge of edges) {
    const fromIndex = farmerIndex.get(edge.farmerId);
    const toIndex = buyerIndex.get(edge.buyerId);
    if (fromIndex === undefined || toIndex === undefined) continue;
    if (edge.capacity <= 0) continue;
    const arc = addEdge(1 + fromIndex, 1 + farmers.length + toIndex, edge.capacity, edge.cost);
    tracked.push({ edge, arc, originalCap: arc.cap });
  }

  let augmentations = 0;
  const dist = new Array<number>(nodeCount).fill(INF);
  const inQueue = new Array<boolean>(nodeCount).fill(false);
  const prevNode = new Array<number>(nodeCount).fill(-1);
  const prevArc = new Array<number>(nodeCount).fill(-1);

  // Hard guard: a correct run needs at most a few dozen augmentations here.
  for (let guard = 0; guard < 100_000; guard += 1) {
    dist.fill(INF);
    inQueue.fill(false);
    prevNode.fill(-1);
    prevArc.fill(-1);
    dist[source] = 0;

    const queue: number[] = [source];
    inQueue[source] = true;
    let head = 0;
    while (head < queue.length) {
      const node = queue[head];
      head += 1;
      inQueue[node] = false;
      const base = dist[node];
      if (base >= INF) continue;

      const arcs = graph[node];
      for (let arcIndex = 0; arcIndex < arcs.length; arcIndex += 1) {
        const arc = arcs[arcIndex];
        if (arc.cap <= 0) continue;
        const candidate = base + arc.cost;
        if (candidate < dist[arc.to]) {
          dist[arc.to] = candidate;
          prevNode[arc.to] = node;
          prevArc[arc.to] = arcIndex;
          if (!inQueue[arc.to]) {
            queue.push(arc.to);
            inQueue[arc.to] = true;
          }
        }
      }
    }

    if (prevNode[sink] === -1) break;

    let bottleneck = INF;
    let cursor = sink;
    while (cursor !== source) {
      const parent = prevNode[cursor];
      const arc = graph[parent][prevArc[cursor]];
      bottleneck = Math.min(bottleneck, arc.cap);
      cursor = parent;
    }
    if (bottleneck <= 0 || bottleneck >= INF) break;

    cursor = sink;
    while (cursor !== source) {
      const parent = prevNode[cursor];
      const arc = graph[parent][prevArc[cursor]];
      arc.cap -= bottleneck;
      graph[cursor][arc.rev].cap += bottleneck;
      cursor = parent;
    }
    augmentations += 1;
  }

  const flows: Flow[] = [];
  let totalEdgeCost = 0;
  for (const { edge, arc, originalCap } of tracked) {
    const quantity = originalCap - arc.cap;
    if (quantity > 0) {
      flows.push({ farmerId: edge.farmerId, buyerId: edge.buyerId, quantityKg: quantity });
      totalEdgeCost += quantity * edge.cost;
    }
  }

  return { flows: normalizeFlows(flows), augmentations, totalEdgeCost };
}

/**
 * Min-cost max-flow entry point, including the proportional-share policy.
 * Under `proportional` the solver sees capped buyer sinks first, then a greedy
 * pass distributes leftover supply by score (as documented in the brief).
 */
export function minCostFlowAllocate(
  edges: NetworkEdge[],
  farmers: Farmer[],
  buyers: Buyer[],
  policy: 'score-priority' | 'proportional',
): { flows: Flow[]; augmentations: number; totalEdgeCost: number } {
  const fullLimits = demandMap(buyers);
  if (policy === 'score-priority') {
    return minCostFlow(edges, farmers, buyers, fullLimits);
  }

  const targets = proportionalTargets(edges, farmers, buyers);
  const first = minCostFlow(edges, farmers, buyers, targets);
  if (first.flows.length === 0) return first;
  const toppedUp = topUpGreedy(edges, farmers, buyers, first.flows);
  return { ...first, flows: toppedUp };
}

/** Re-exported so tests can build a stable flow key. */
export { flowKey };
