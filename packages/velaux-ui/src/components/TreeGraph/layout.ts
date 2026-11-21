import type { Node } from './interface';

// getGraphSize is the extent of a laid-out graph: the furthest right and lowest
// any node reaches. A node is drawn from its x and y, so it reaches x + width.
export function getGraphSize(nodes: Node[]): { width: number; height: number } {
  let width = 0;
  let height = 0;
  nodes.forEach((node) => {
    width = Math.max((node.x || 0) + node.width, width);
    height = Math.max((node.y || 0) + node.height, height);
  });
  return { width, height };
}

// shiftIntoView moves a laid-out graph, nodes and edge points together, when
// any of it lies above or left of the origin, until that part is margin in. dagre routes an edge that
// spans several ranks through a lane of its own, which can lie above the first
// row of nodes, where the canvas would clip it.
export function shiftIntoView(
  nodes: Array<{ x?: number; y?: number }>,
  edges: Array<Array<{ x: number; y: number }>>,
  margin: number
) {
  let minX = Infinity;
  let minY = Infinity;
  nodes.forEach((n) => {
    minX = Math.min(minX, n.x || 0);
    minY = Math.min(minY, n.y || 0);
  });
  edges.forEach((points) =>
    points.forEach((p) => {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
    })
  );
  const dx = minX < 0 ? margin - minX : 0;
  const dy = minY < 0 ? margin - minY : 0;
  if (dx === 0 && dy === 0) {
    return;
  }
  nodes.forEach((n) => {
    n.x = (n.x || 0) + dx;
    n.y = (n.y || 0) + dy;
  });
  edges.forEach((points) =>
    points.forEach((p) => {
      p.x += dx;
      p.y += dy;
    })
  );
}

// Rect is a node's box as drawn: its top-left corner and size.
export type Rect = { left: number; top: number; width: number; height: number };

// edgeOffset is where the graph draws the layout's origin: room for the app
// node's badge above and to the left.
export const edgeOffset = { x: 40, y: 30 };

// placeAt is where a node is drawn: the box the layout gave it, centred on its
// point, so the layout's routes clear it. A box that grows keeps its top, its
// height a floor.
export function placeAt(
  node: { x: number; y: number; width: number; height: number },
  grow?: boolean
): { left: number; top: number; width: number; height?: number; minHeight?: number; margin: number } {
  const box = {
    left: node.x + edgeOffset.x - node.width / 2,
    top: node.y + edgeOffset.y - node.height / 2,
    width: node.width,
    margin: 0,
  };
  return grow ? { ...box, minHeight: node.height } : { ...box, height: node.height };
}
