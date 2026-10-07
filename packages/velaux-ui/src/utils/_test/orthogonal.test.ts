import { expect } from 'chai';

import type { Point, RouteEdge, RouteNode } from '../../components/TreeGraph/orthogonal';
import { lanesNeeded, orthoPath, routeDefaults, routeEdges } from '../../components/TreeGraph/orthogonal';

const box = (left: number, top: number, width = 100, height = 40) => ({ left, top, width, height });

// segments are a route's straight runs, each from one corner to the next.
function segments(points: Point[]): Array<[Point, Point]> {
  return points.slice(1).map((p, i) => [points[i], p]);
}

// overlapping is whether two runs lie along the same line and share more than
// a point.
function overlapping([a1, a2]: [Point, Point], [b1, b2]: [Point, Point]): boolean {
  if (a1.x === a2.x && b1.x === b2.x && a1.x === b1.x) {
    const [lo, hi] = [Math.min(a1.y, a2.y), Math.max(a1.y, a2.y)];
    const [blo, bhi] = [Math.min(b1.y, b2.y), Math.max(b1.y, b2.y)];
    return Math.min(hi, bhi) - Math.max(lo, blo) > 0;
  }
  if (a1.y === a2.y && b1.y === b2.y && a1.y === b1.y) {
    const [lo, hi] = [Math.min(a1.x, a2.x), Math.max(a1.x, a2.x)];
    const [blo, bhi] = [Math.min(b1.x, b2.x), Math.max(b1.x, b2.x)];
    return Math.min(hi, bhi) - Math.max(lo, blo) > 0;
  }
  return false;
}

function rightAngled(points: Point[]): boolean {
  return segments(points).every(([a, b]) => a.x === b.x || a.y === b.y);
}

function noOverlaps(routes: Record<string, Point[]>): boolean {
  const keys = Object.keys(routes);
  for (let i = 0; i < keys.length; i++) {
    for (let j = i + 1; j < keys.length; j++) {
      for (const a of segments(routes[keys[i]])) {
        for (const b of segments(routes[keys[j]])) {
          if (overlapping(a, b)) {
            return false;
          }
        }
      }
    }
  }
  return true;
}

// shortestTurn is the shortest run between two turns: every run but a route's
// first and last, which meet a box.
function shortestTurn(routes: Record<string, Point[]>): number {
  let least = Infinity;
  Object.values(routes).forEach((r) =>
    segments(r)
      .slice(1, -1)
      .forEach(([a, b]) => (least = Math.min(least, Math.abs(a.x - b.x) + Math.abs(a.y - b.y))))
  );
  return least;
}

describe('orthogonal edge routing', () => {
  it('straightens a step too short to turn twice in, moving a port level with the other', () => {
    const nodes: RouteNode[] = [
      { key: 'a', box: box(0, 0), column: 0 },
      { key: 'b', box: box(200, 6), column: 1 },
    ];
    const routes = routeEdges(nodes, [{ key: 'ab', from: 'a', to: 'b' }]);
    expect(routes.ab).to.deep.equal([
      { x: 100, y: 20 },
      { x: 200, y: 20 },
    ]);
  });

  it("moves where an edge crosses a skipped column level with its port, when the port can't move", () => {
    const nodes: RouteNode[] = [
      { key: 'a', box: box(0, 0), column: 0 },
      { key: 'b', box: box(200, 100), column: 1 },
      { key: 'c', box: box(400, 200), column: 2 },
    ];
    const routes = routeEdges(nodes, [
      { key: 'ac', from: 'a', to: 'c', passes: [20] },
      { key: 'ab', from: 'a', to: 'b' },
    ]);
    expect(shortestTurn(routes)).to.be.at.least(routeDefaults.minRun);
    expect(noOverlaps(routes)).to.equal(true);
  });

  it('runs at least the minimum between any two turns', () => {
    const nodes: RouteNode[] = [{ key: 'rs', box: box(0, 300, 100, 40), column: 0 }];
    const edges: RouteEdge[] = [];
    for (let i = 0; i < 8; i++) {
      nodes.push({ key: `pod${i}`, box: box(200, i * 90 + 3), column: 1 });
      edges.push({ key: `e${i}`, from: 'rs', to: `pod${i}` });
    }
    expect(shortestTurn(routeEdges(nodes, edges))).to.be.at.least(routeDefaults.minRun);
  });

  it("runs out of the source's right side, turns in the gap, and into the target's left side", () => {
    const nodes: RouteNode[] = [
      { key: 'a', box: box(0, 0), column: 0 },
      { key: 'b', box: box(200, 100), column: 1 },
    ];
    const route = routeEdges(nodes, [{ key: 'ab', from: 'a', to: 'b' }]).ab;
    expect(route[0]).to.deep.equal({ x: 100, y: 20 });
    expect(route[route.length - 1]).to.deep.equal({ x: 200, y: 120 });
    expect(route).to.have.length(4);
    expect(rightAngled(route)).to.equal(true);
    expect(route[1].x).to.be.greaterThan(100).and.lessThan(200);
  });

  it('runs straight between ports at the same height', () => {
    const nodes: RouteNode[] = [
      { key: 'a', box: box(0, 0), column: 0 },
      { key: 'b', box: box(200, 0), column: 1 },
    ];
    expect(routeEdges(nodes, [{ key: 'ab', from: 'a', to: 'b' }]).ab).to.deep.equal([
      { x: 100, y: 20 },
      { x: 200, y: 20 },
    ]);
  });

  it("spreads a box's edges along its side, in the order of where they head", () => {
    const nodes: RouteNode[] = [
      { key: 'a', box: box(0, 100, 100, 60), column: 0 },
      { key: 'up', box: box(200, 0), column: 1 },
      { key: 'down', box: box(200, 300), column: 1 },
    ];
    const routes = routeEdges(nodes, [
      { key: 'down', from: 'a', to: 'down' },
      { key: 'up', from: 'a', to: 'up' },
    ]);
    expect(routes.up[0].x).to.equal(100);
    expect(routes.down[0].x).to.equal(100);
    expect(routes.up[0].y).to.be.lessThan(routes.down[0].y);
    expect(noOverlaps(routes)).to.equal(true);
  });

  it('gives every edge crossing a gap a lane of its own', () => {
    const nodes: RouteNode[] = [
      { key: 'a', box: box(0, 0), column: 0 },
      { key: 'b', box: box(0, 100), column: 0 },
      { key: 'c', box: box(200, 50), column: 1 },
      { key: 'd', box: box(200, 200), column: 1 },
    ];
    const edges: RouteEdge[] = [
      { key: 'ac', from: 'a', to: 'c' },
      { key: 'ad', from: 'a', to: 'd' },
      { key: 'bc', from: 'b', to: 'c' },
      { key: 'bd', from: 'b', to: 'd' },
    ];
    const routes = routeEdges(nodes, edges);
    Object.values(routes).forEach((r) => expect(rightAngled(r)).to.equal(true));
    expect(noOverlaps(routes)).to.equal(true);
  });

  it('spills edges onto the top and bottom when a side is too short for them', () => {
    const nodes: RouteNode[] = [{ key: 'rs', box: box(0, 300, 100, 40), column: 0 }];
    const edges: RouteEdge[] = [];
    for (let i = 0; i < 8; i++) {
      nodes.push({ key: `pod${i}`, box: box(200, i * 90), column: 1 });
      edges.push({ key: `e${i}`, from: 'rs', to: `pod${i}` });
    }
    const routes = routeEdges(nodes, edges);
    const starts = Object.values(routes).map((r) => r[0]);
    expect(starts.some((p) => p.y === 300)).to.equal(true);
    expect(starts.some((p) => p.y === 340)).to.equal(true);
    expect(new Set(starts.map((p) => `${p.x},${p.y}`)).size).to.equal(8);
    Object.values(routes).forEach((r) => expect(rightAngled(r)).to.equal(true));
    expect(noOverlaps(routes)).to.equal(true);
  });

  it('passes a column it skips at the height the layout kept for it', () => {
    const nodes: RouteNode[] = [
      { key: 'a', box: box(0, 0), column: 0 },
      { key: 'mid', box: box(200, 0), column: 1 },
      { key: 'c', box: box(400, 0), column: 2 },
    ];
    const route = routeEdges(nodes, [{ key: 'ac', from: 'a', to: 'c', passes: [80] }]).ac;
    expect(route.some((p) => p.x >= 200 && p.x <= 300 && p.y === 80)).to.equal(false);
    expect(route.filter((p) => p.y === 80)).to.have.length(2);
    expect(rightAngled(route)).to.equal(true);
  });

  it('counts the most edges crossing any one gap', () => {
    const nodes: RouteNode[] = [
      { key: 'a', box: box(0, 0), column: 0 },
      { key: 'b', box: box(200, 0), column: 1 },
      { key: 'c', box: box(200, 100), column: 1 },
      { key: 'd', box: box(400, 0), column: 2 },
    ];
    const edges: RouteEdge[] = [
      { key: 'ab', from: 'a', to: 'b' },
      { key: 'ac', from: 'a', to: 'c' },
      { key: 'ad', from: 'a', to: 'd', passes: [60] },
      { key: 'bd', from: 'b', to: 'd' },
    ];
    expect(lanesNeeded(nodes, edges)).to.equal(3);
  });
});

describe('orthoPath', () => {
  it('rounds each right angle', () => {
    expect(
      orthoPath(
        [
          { x: 0, y: 0 },
          { x: 50, y: 0 },
          { x: 50, y: 50 },
        ],
        4
      )
    ).to.equal('M 0 0 L 46 0 Q 50 0 50 4 L 50 50');
  });
  it('draws a straight run as a line', () => {
    expect(
      orthoPath(
        [
          { x: 0, y: 0 },
          { x: 50, y: 0 },
        ],
        4
      )
    ).to.equal('M 0 0 L 50 0');
  });
});
