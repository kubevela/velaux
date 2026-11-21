import * as dagre from 'dagre';
import React from 'react';

import type { RouteEdge, RouteNode } from '../TreeGraph/orthogonal';
import { lanesNeeded, orthoPath, routeDefaults, routeEdges } from '../TreeGraph/orthogonal';
import type { StepEdge } from './dependencies';

export const stepWidth = 270;
const margin = 20;
// cardHeight stands in for a card not yet measured.
const cardHeight = 90;

type LaidStep = { width: number; height: number; x: number; y: number };
type LaidEdge = { points?: Array<{ x: number; y: number }>; weight?: number; minlen?: number };
type Laid = dagre.graphlib.Graph<LaidStep, LaidEdge>;
type Size = { width: number; height: number };

// StepLayout is where each card of a step graph sits and how its edges run.
export interface StepLayout {
  // container holds the cards, each a direct child marked data-step-key.
  container: React.RefObject<HTMLDivElement>;
  place: (key: string) => { left: number; top: number };
  box: (key: string) => { left: number; top: number; width: number; height: number };
  size: Size;
  path: (edge: StepEdge) => string;
  // middle is the point halfway along an edge's route.
  middle: (edge: StepEdge) => { x: number; y: number } | undefined;
}

// layOut places cards left to right: each sits right of every card it waits on,
// in the earliest column it can, the gap between columns wide enough to hold a
// lane for each edge crossing it.
function layOut(keys: string[], edges: StepEdge[], sizes: Record<string, Size>) {
  // A hidden root, tied hard to every card, holds each in the earliest column
  // it can start in; dependency edges stretch to suit.
  const root = '\u0000root';
  const place = (ranksep: number) => {
    const g: Laid = new dagre.graphlib.Graph<LaidStep, LaidEdge>();
    g.setGraph({ rankdir: 'LR', nodesep: 24, ranksep });
    g.setNode(root, { width: 0, height: 0, x: 0, y: 0 });
    keys.forEach((k) => {
      g.setNode(k, { width: sizes[k]?.width || stepWidth, height: sizes[k]?.height || cardHeight, x: 0, y: 0 });
      g.setEdge(root, k, { weight: 100, minlen: 1 });
    });
    edges.forEach((e) => g.setEdge(e.from, e.to, { weight: 1 }));
    dagre.layout(g);
    g.removeNode(root);
    // Everything moves so the first card sits at the margin, edge points with
    // the cards.
    let minX = Infinity;
    let minY = Infinity;
    g.nodes().forEach((k) => {
      minX = Math.min(minX, g.node(k).x - g.node(k).width / 2);
      minY = Math.min(minY, g.node(k).y - g.node(k).height / 2);
    });
    g.edges().forEach((e) => (g.edge(e).points || []).forEach((p) => (minY = Math.min(minY, p.y))));
    const dx = margin - minX;
    const dy = margin - minY;
    g.nodes().forEach((k) => {
      g.node(k).x += dx;
      g.node(k).y += dy;
    });
    g.edges().forEach((e) =>
      (g.edge(e).points || []).forEach((p) => {
        p.x += dx;
        p.y += dy;
      })
    );
    return g;
  };
  const routing = (g: Laid) => {
    const centres = Array.from(new Set(g.nodes().map((k) => Math.round(g.node(k).x)))).sort((x, y) => x - y);
    const columnOf = (key: string) => centres.indexOf(Math.round(g.node(key).x));
    const nodes: RouteNode[] = g.nodes().map((key) => {
      const n = g.node(key);
      return {
        key,
        column: columnOf(key),
        box: { left: n.x - n.width / 2, top: n.y - n.height / 2, width: n.width, height: n.height },
      };
    });
    const routed: RouteEdge[] = g.edges().map((e) => {
      const points = g.edge(e).points || [];
      const passes: number[] = [];
      for (let c = columnOf(e.v) + 1; c < columnOf(e.w); c++) {
        const nearest = points.reduce((best, p) =>
          Math.abs(p.x - centres[c]) < Math.abs(best.x - centres[c]) ? p : best
        );
        passes.push(nearest.y);
      }
      return { key: `${e.v}->${e.w}`, from: e.v, to: e.w, passes };
    });
    return { nodes, edges: routed };
  };

  const leastGap = 48;
  let graph = place(leastGap);
  let routed = routing(graph);
  const gap =
    routeDefaults.leadOut +
    routeDefaults.leadIn +
    routeDefaults.spacing * (lanesNeeded(routed.nodes, routed.edges) + 1);
  if (gap > leastGap) {
    graph = place(gap);
    routed = routing(graph);
  }
  return { graph, routes: routeEdges(routed.nodes, routed.edges) };
}

// useStepLayout lays out the cards keyed by keys, joined by edges. Cards are
// measured as drawn after every render, as a card's size follows its content;
// onResize, where given, hears when the whole graph changes size.
export function useStepLayout(keys: string[], edges: StepEdge[], onResize?: () => void): StepLayout {
  const [sizes, setSizes] = React.useState<Record<string, Size>>({});
  const container = React.useRef<HTMLDivElement>(null);
  // It settles once the sizes stop changing.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  React.useLayoutEffect(() => {
    const measured: Record<string, Size> = {};
    Array.from(container.current?.children || []).forEach((child) => {
      const el = child as HTMLElement;
      if (el.dataset.stepKey) {
        measured[el.dataset.stepKey] = { width: el.offsetWidth, height: el.offsetHeight };
      }
    });
    if (JSON.stringify(measured) !== JSON.stringify(sizes)) {
      setSizes(measured);
    }
  });

  const { graph, routes } = layOut(keys, edges, sizes);
  const size = { width: 0, height: 0 };
  graph.nodes().forEach((k) => {
    const n = graph.node(k);
    size.width = Math.max(size.width, n.x + n.width / 2 + margin);
    size.height = Math.max(size.height, n.y + n.height / 2 + margin);
  });
  // A loop round the graph reaches below and beside the cards.
  Object.values(routes).forEach((points) =>
    points.forEach((p) => {
      size.width = Math.max(size.width, p.x + margin);
      size.height = Math.max(size.height, p.y + margin);
    })
  );
  React.useEffect(() => {
    onResize && onResize();
  }, [size.width, size.height, onResize]);

  return {
    container,
    size,
    place: (key: string) => {
      const n = graph.node(key);
      return n ? { left: n.x - n.width / 2, top: n.y - n.height / 2 } : { left: margin, top: margin };
    },
    box: (key: string) => {
      const n = graph.node(key);
      return n
        ? { left: n.x - n.width / 2, top: n.y - n.height / 2, width: n.width, height: n.height }
        : { left: margin, top: margin, width: stepWidth, height: cardHeight };
    },
    path: (e: StepEdge) => orthoPath(routes[`${e.from}->${e.to}`] || [], 6),
    middle: (e: StepEdge) => {
      const points = routes[`${e.from}->${e.to}`] || [];
      const runs = points
        .slice(1)
        .map((p, i) => ({ a: points[i], b: p, d: Math.abs(p.x - points[i].x) + Math.abs(p.y - points[i].y) }));
      let left = runs.reduce((sum, r) => sum + r.d, 0) / 2;
      for (const r of runs) {
        if (left <= r.d) {
          const t = r.d ? left / r.d : 0;
          return { x: r.a.x + (r.b.x - r.a.x) * t, y: r.a.y + (r.b.y - r.a.y) * t };
        }
        left -= r.d;
      }
      return points[0];
    },
  };
}

// graphCount numbers each edge layer drawn, so its arrowhead's id is its own.
let graphCount = 0;

// StepEdges draws a step graph's edges, each ending in an arrowhead.
// StepEdges draws a step graph's edges, each ending in an arrowhead. Those
// front picks are drawn above the cards, so a warning line is never hidden.
export const StepEdges = (props: {
  layout: StepLayout;
  edges: StepEdge[];
  className: (edge: StepEdge) => string;
  // onPick, where given, makes each edge clickable along a band wider than it
  // is drawn; title is that edge's hover text.
  onPick?: (edge: StepEdge) => void;
  title?: (edge: StepEdge) => string | undefined;
  front?: (edge: StepEdge) => boolean;
}) => {
  const [markerId] = React.useState(() => `step-edges-${++graphCount}`);
  const { layout, edges, className, front = () => false, onPick, title } = props;
  const layer = (drawn: StepEdge[], onTop: boolean) => (
    <svg
      className={onTop ? 'workflow-connectors front' : 'workflow-connectors'}
      width={layout.size.width}
      height={layout.size.height}
    >
      <defs>
        <marker
          id={`${markerId}${onTop ? '-front' : ''}`}
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth={onTop ? 5 : 7}
          markerHeight={onTop ? 5 : 7}
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" className="workflow-connector-head" />
        </marker>
      </defs>
      {drawn.map((e) => (
        <path
          key={`${e.from}->${e.to}`}
          className={className(e)}
          data-from={e.from}
          data-to={e.to}
          fill="none"
          markerEnd={`url(#${markerId}${onTop ? '-front' : ''})`}
          d={layout.path(e)}
        />
      ))}
      {onPick &&
        drawn.map((e) => (
          <path
            key={`hit-${e.from}->${e.to}`}
            className="workflow-connector-hit"
            fill="none"
            d={layout.path(e)}
            onClick={(event) => {
              event.stopPropagation();
              onPick(e);
            }}
          >
            {title && title(e) && <title>{title(e)}</title>}
          </path>
        ))}
    </svg>
  );
  const onTop = edges.filter(front);
  return (
    <>
      {layer(
        edges.filter((e) => !front(e)),
        false
      )}
      {onTop.length > 0 && layer(onTop, true)}
    </>
  );
};
