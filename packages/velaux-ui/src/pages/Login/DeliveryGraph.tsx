import classNames from 'classnames';
import React, { useEffect, useState } from 'react';

// components are the application's building blocks, by row top: each has a
// type tile, a name of the given width, and its traits clipped to its side.
const components = [
  { top: 78, name: 40, traits: 1 },
  { top: 108, name: 30, traits: 0 },
  { top: 138, name: 46, traits: 2 },
];
// clusters are the card tops of the three clusters delivered to.
const clusters = [8, 80, 152];
// pods are how many pods each cluster runs.
const pods = [4, 5, 3];
// steps are the workflow steps' centres along the trunk.
const steps = [168, 202, 236];

// The drawing plays once, in phases: the components snap into the
// application, the trunk draws, each step lights, the edges fan out, and the
// pods come up, where it stays.
const phaseMs = 400;
const firstComponentPhase = 1;
const trunkPhase = firstComponentPhase + components.length;
const firstStepPhase = trunkPhase + 1;
const fanPhase = firstStepPhase + steps.length;
const podsPhase = fanPhase + 1;

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

// DeliveryGraph draws an application built from components, its workflow,
// and its delivery to three clusters, in the brand panel's colours. It is
// decoration, so screen readers skip it; with reduced motion it starts
// finished.
export const DeliveryGraph = () => {
  const [phase, setPhase] = useState(() => (prefersReducedMotion() ? podsPhase : 0));

  useEffect(() => {
    if (phase >= podsPhase) {
      return;
    }
    const timer = setTimeout(() => setPhase(phase + 1), phaseMs);
    return () => clearTimeout(timer);
  }, [phase]);

  const on = (from: number) => phase >= from;
  const trunkStart = 128;
  const last = steps[steps.length - 1];

  return (
    <svg className={classNames('delivery-graph', { resetting: phase === 0 })} viewBox="0 0 480 220" aria-hidden="true">
      <path className="dg-edge" d={`M ${trunkStart} 110 H ${last + 8}`} />
      <path
        className={classNames('dg-flow', { on: on(trunkPhase) })}
        d={`M ${trunkStart} 110 H ${steps[0] - 8}`}
        pathLength={1}
      />
      {steps.slice(1).map((x, i) => (
        <path
          key={x}
          className={classNames('dg-flow', { on: on(firstStepPhase + i + 1) })}
          d={`M ${steps[i] + 8} 110 H ${x - 8}`}
          pathLength={1}
        />
      ))}

      {clusters.map((top) => {
        const d = `M ${last + 8} 110 C 288 110, 288 ${top + 30}, 330 ${top + 30}`;
        return (
          <g key={top}>
            <path className="dg-edge" d={d} />
            <path className={classNames('dg-flow', { on: on(fanPhase) })} d={d} pathLength={1} />
          </g>
        );
      })}

      <g className={classNames('dg-card dg-app', { on: on(trunkPhase) })}>
        <rect x="4" y="46" width="124" height="128" rx="12" />
        <rect className="dg-line strong" x="16" y="58" width="52" height="7" rx="3.5" />
        {components.map((c, i) => (
          <g key={c.top} className={classNames('dg-component', { on: on(firstComponentPhase + i) })}>
            <rect className="dg-block" x="14" y={c.top} width="88" height="24" rx="6" />
            <rect className="dg-type" x="19" y={c.top + 5} width="14" height="14" rx="3.5" />
            <rect className="dg-line" x="39" y={c.top + 9} width={c.name} height="6" rx="3" />
            {Array.from({ length: c.traits }, (_, t) => (
              <rect
                key={t}
                className="dg-trait"
                x="105"
                y={c.traits === 1 ? c.top + 7 : c.top + 2 + t * 11}
                width="13"
                height={c.traits === 1 ? 10 : 9}
                rx="3"
                style={{ transitionDelay: `${200 + t * 90}ms` }}
              />
            ))}
          </g>
        ))}
      </g>

      {steps.map((x, i) => (
        <g key={x} className={classNames('dg-step', { on: on(firstStepPhase + i) })}>
          <circle cx={x} cy="110" r="8" />
          <path d={`M ${x - 3.5} 110 l 2.5 2.5 l 4.5 -5`} />
        </g>
      ))}

      {clusters.map((top, c) => (
        <g key={top} className={classNames('dg-card dg-cluster', { on: on(podsPhase) })}>
          <rect x="330" y={top} width="146" height="60" rx="12" />
          <circle className="dg-dot" cx="347" cy={top + 19} r="4.5" />
          <rect className="dg-line strong" x="359" y={top + 15.5} width={[62, 50, 70][c]} height="7" rx="3.5" />
          {Array.from({ length: pods[c] }, (_, p) => (
            <rect
              key={p}
              className="dg-pod"
              x={343 + p * 17}
              y={top + 34}
              width="11"
              height="11"
              rx="3"
              style={{ transitionDelay: `${c * 120 + p * 70}ms` }}
            />
          ))}
        </g>
      ))}
    </svg>
  );
};
