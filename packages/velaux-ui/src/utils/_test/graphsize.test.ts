import { expect } from 'chai';

import { getGraphSize, shiftIntoView } from '../../components/TreeGraph/layout';

describe('graph size', () => {
  it('reaches the right and bottom edges of the furthest nodes', () => {
    expect(
      getGraphSize([
        { x: 100, y: 50, width: 300, height: 40 },
        { x: 600, y: 20, width: 220, height: 40 },
      ])
    ).to.deep.equal({ width: 820, height: 90 });
  });
});

describe('shiftIntoView', () => {
  it('moves a layout routed above or left of the origin back into view', () => {
    const nodes = [
      { x: 10, y: 37, width: 100, height: 40 },
      { x: 300, y: 37, width: 100, height: 40 },
    ];
    // A long edge dagre routed through a lane above the first row.
    const points = [
      { x: 60, y: 10 },
      { x: 200, y: -50 },
      { x: 350, y: 10 },
    ];
    shiftIntoView(nodes, [points], 20);
    expect(Math.min(...points.map((p) => p.y))).to.equal(20);
    expect(nodes.map((n) => n.y)).to.deep.equal([107, 107]);
    expect(nodes.map((n) => n.x)).to.deep.equal([10, 300]);
  });
  it('leaves a layout already in view alone', () => {
    const nodes = [{ x: 10, y: 37, width: 100, height: 40 }];
    const points = [{ x: 60, y: 37 }];
    shiftIntoView(nodes, [points], 20);
    expect(nodes[0]).to.deep.equal({ x: 10, y: 37, width: 100, height: 40 });
    expect(points[0]).to.deep.equal({ x: 60, y: 37 });
  });
});
