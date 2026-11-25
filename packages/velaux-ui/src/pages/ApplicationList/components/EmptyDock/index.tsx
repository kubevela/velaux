import { Button } from '@alifd/next';
import React, { useEffect, useRef, useState } from 'react';

import { Sail } from '../../../../components/Sail';
import { Translation } from '../../../../components/Translation';
import './index.less';

type Props = {
  // filtered is true when a search or filter, not an empty project, leaves the list empty.
  filtered?: boolean;
  // create is the new application button, shown only when nothing is filtered.
  create?: React.ReactNode;
};

// One wave is 40 units wide; the water runs a wave past each edge so it can drift by one.
const waves = (y: number, height: number) => {
  let d = `M -40 ${y}`;
  for (let x = -40; x < 280; x += 40) {
    d += ` Q ${x + 10} ${y - height}, ${x + 20} ${y} Q ${x + 30} ${y + height}, ${x + 40} ${y}`;
  }
  return d;
};
const waterline = 88;
const below = ' V 120 H -40 Z';

// still is true when the viewer asks for reduced motion, so the waves do not swell.
const still = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// Swell is a wave whose height rises and falls between the given heights.
const Swell = (props: {
  y: number;
  heights: number[];
  seconds: number;
  className?: string;
  fill?: string;
  closed?: boolean;
}) => {
  const shape = (h: number) => waves(props.y, h) + (props.closed ? below : '');
  return (
    <path className={props.className} fill={props.fill} d={shape(props.heights[0])}>
      {!still && (
        <animate
          attributeName="d"
          dur={`${props.seconds}s`}
          repeatCount="indefinite"
          calcMode="spline"
          keySplines={props.heights
            .slice(1)
            .map(() => '0.45 0 0.55 1')
            .join(';')}
          values={props.heights.map(shape).join(';')}
        />
      )}
    </path>
  );
};

// helm is the Kubernetes wheel's seven spokes around a hub, centred on 0,0.
const helm = Array.from({ length: 7 }, (_, i) => {
  const a = (i * 2 * Math.PI) / 7 - Math.PI / 2;
  return `M 0 0 L ${(Math.cos(a) * 3.6).toFixed(2)} ${(Math.sin(a) * 3.6).toFixed(2)}`;
}).join(' ');

// Container is a shipping container with the Kubernetes wheel on its side, x along the truck's bed.
const Container = (props: { x: number; className?: string }) => (
  <g className={props.className}>
    <g transform={`translate(${props.x} -20)`}>
      <rect className="empty-dock-container" width="16" height="11" rx="0.6" />
      <path className="empty-dock-ridges" d="M 3 1 V 10 M 5.5 1 V 10 M 10.5 1 V 10 M 13 1 V 10" />
      <g transform="translate(8 5.5)">
        <circle className="empty-dock-helm-ring" r="2.6" />
        <path className="empty-dock-helm" d={helm} />
      </g>
    </g>
  </g>
);

// Crane is the dockside tower crane, its jib reaching over the truck and the berth.
const Crane = () => (
  <g className="empty-dock-crane">
    <path className="empty-dock-crane-ties" d="M 99.5 15 L 42 22 M 99.5 15 L 178 22" />
    <rect x="98" y="22" width="3" height="50" />
    <path
      className="empty-dock-crane-lattice"
      d="M 98 27 L 101 32 L 98 37 L 101 42 L 98 47 L 101 52 L 98 57 L 101 62 L 98 67"
    />
    <path d="M 97.5 22 L 99.5 15 L 101.5 22 Z" />
    <rect x="38" y="22" width="142" height="3" />
    <rect className="empty-dock-crane-weight" x="38" y="25" width="9" height="6" rx="0.6" />
    <rect className="empty-dock-crane-cab" x="101" y="25" width="7" height="6" rx="1" />
  </g>
);

// Hook is the crane's trolley, cable and spreader, resting over the berth; the
// cable runs up past the jib and is clipped there.
const Hook = () => (
  <>
    <g className="empty-dock-trolley">
      <rect x="157" y="25" width="6" height="2" rx="0.5" />
    </g>
    <g clipPath="url(#empty-dock-below-jib)">
      <g className="empty-dock-hook">
        <path className="empty-dock-cable" d="M 160 -40 V 34.5" />
        <rect className="empty-dock-spreader" x="152" y="34.5" width="16" height="1.5" rx="0.4" />
      </g>
    </g>
  </>
);

// Cargo is the copy of each container the crane carries from the truck into the hold,
// clipped at the boat's deck so it vanishes as it goes below.
const Cargo = () => (
  <g clipPath="url(#empty-dock-above-deck)">
    <g transform="translate(50 72.5)">
      <Container x={0.5} className="empty-dock-cargo-a" />
      <Container x={17.5} className="empty-dock-cargo-b" />
    </g>
  </g>
);

// Wheel is one of the truck's wheels, with a spoke so it shows turning.
const Wheel = (props: { x: number }) => (
  <g transform={`translate(${props.x} -2.6)`}>
    <g className="empty-dock-wheel">
      <circle r="2.6" />
      <path d="M -1.4 0 H 1.4" />
    </g>
  </g>
);

// Truck brings two containers along the pier, facing the berth; its origin is
// where its rear wheels meet the deck.
const Truck = () => (
  <g className="empty-dock-truck">
    <g transform="translate(50 72.5)">
      <rect className="empty-dock-chassis" x="0" y="-7.5" width="47" height="3" rx="0.8" />
      <Container x={0.5} className="empty-dock-load-a" />
      <Container x={17.5} className="empty-dock-load-b" />
      <rect className="empty-dock-bed" x="0" y="-9" width="34.5" height="1.8" />
      <rect className="empty-dock-cab" x="35.5" y="-18" width="11" height="12" rx="2" />
      <rect className="empty-dock-window" x="40.5" y="-16" width="4.5" height="4.5" rx="0.8" />
      <Wheel x={7} />
      <Wheel x={25} />
      <Wheel x={41} />
    </g>
  </g>
);

// Dock is the scene: a pier with nothing moored, its rope slack in the water,
// and, while launching, a truck of containers, the sail that comes in to the berth, and
// the crane that loads one into the other; the wind streaks show only in a gust.
const Dock = () => (
  <svg className="empty-dock-scene" viewBox="0 0 240 120" aria-hidden="true">
    <g className="empty-dock-gull empty-dock-gull-a">
      <path d="M -6 0 q 3 -3 6 0 q 3 -3 6 0" />
    </g>
    <g className="empty-dock-gull empty-dock-gull-b">
      <path d="M -5 0 q 2.5 -2.5 5 0 q 2.5 -2.5 5 0" />
    </g>
    <g className="empty-dock-lamp">
      <circle className="empty-dock-glow" cx="27" cy="45" r="10" />
      <rect x="18" y="40" width="2.5" height="32" />
      <path d="M 19 41 H 27" />
      <rect className="empty-dock-light" x="24" y="41" width="6" height="7" rx="1" />
    </g>
    <g mask="url(#empty-dock-fade)">
      <g className="empty-dock-water-back">
        <Swell className="empty-dock-water-line" y={waterline - 4} heights={[2.5, 4, 2.5]} seconds={4.4} />
      </g>
    </g>
    <g className="empty-dock-pilings">
      <rect x="10" y="78" width="5" height="40" />
      <rect x="50" y="78" width="5" height="40" />
      <rect x="90" y="78" width="5" height="40" />
    </g>
    <rect className="empty-dock-deck" x="-2" y="72" width="118" height="6" rx="1" />
    <g className="empty-dock-blow empty-dock-blow-truck">
      <Truck />
    </g>
    <Crane />
    <g className="empty-dock-bollard">
      <rect x="104" y="66" width="6" height="6" rx="1" />
      <rect x="102" y="64.5" width="10" height="2.5" rx="1" />
    </g>
    <path className="empty-dock-rope" d="M 109 67 C 121 69, 124 86, 138 89" />
    <Hook />
    <g className="empty-dock-blow empty-dock-blow-cargo">
      <Cargo />
    </g>
    <g className="empty-dock-blow empty-dock-blow-boat">
      <g className="empty-dock-boat">
        <g className="empty-dock-bob">
          <Sail className="empty-dock-sail" x="130" y="40" width="60" height="60" />
        </g>
      </g>
    </g>
    <defs>
      <clipPath id="empty-dock-above-deck">
        <rect x="0" y="0" width="240" height="78" />
      </clipPath>
      <clipPath id="empty-dock-below-jib">
        <rect x="0" y="25" width="240" height="95" />
      </clipPath>
      <linearGradient id="empty-dock-depth" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#006fff" stopOpacity="0.1" />
        <stop offset="1" stopColor="#006fff" stopOpacity="0" />
      </linearGradient>
      <linearGradient id="empty-dock-edges" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#fff" stopOpacity="0" />
        <stop offset="0.12" stopColor="#fff" stopOpacity="1" />
        <stop offset="0.88" stopColor="#fff" stopOpacity="1" />
        <stop offset="1" stopColor="#fff" stopOpacity="0" />
      </linearGradient>
      <mask id="empty-dock-fade" maskUnits="userSpaceOnUse" x="0" y="0" width="240" height="120">
        <rect width="240" height="120" fill="url(#empty-dock-edges)" />
      </mask>
    </defs>
    <g mask="url(#empty-dock-fade)">
      <g className="empty-dock-water">
        <Swell fill="url(#empty-dock-depth)" y={waterline} heights={[5, 2.6, 5]} seconds={3.6} closed />
        <Swell className="empty-dock-water-line" y={waterline} heights={[5, 2.6, 5]} seconds={3.6} />
      </g>
    </g>
    <g className="empty-dock-wind">
      <path pathLength={300} d="M -20 24 C 40 20, 90 28, 150 22 S 230 18, 260 24" />
      <path
        pathLength={300}
        d="M -20 40 C 40 36, 80 44, 112 40 c 10 -1.5, 12 -9, 5 -9 c -5 0, -5 6, 2 6 C 160 37, 220 42, 260 38"
      />
      <path pathLength={300} d="M -20 54 C 30 50, 90 58, 150 52 S 230 48, 260 54" />
      <path pathLength={300} d="M -20 66 C 50 62, 100 70, 170 64 S 240 60, 260 66" />
    </g>
  </svg>
);

// Phase is where the scene is: empty, being loaded while the pointer is on the button, blown away by a gust
// after the pointer leaves without a click, or put back at rest with no transitions.
type Phase = 'idle' | 'launching' | 'gust' | 'reset';
const phaseClass: Record<Phase, string> = {
  idle: '',
  launching: 'launching',
  gust: 'launching gusting',
  reset: 'reset',
};

// leads is the line under the title in each phase, following the scene.
const leads: Record<Phase, string> = {
  idle: 'The dock is empty. Create an application to bring the first one in.',
  launching: 'Prepare your first shipment?',
  gust: 'Shipment lost at sea. Try again?',
  reset: 'The dock is empty. Create an application to bring the first one in.',
};

// gustSeconds is how long the gust takes to clear the scene, the last thing blown away included.
const gustSeconds = 2.1;

// EmptyDock is the application list with nothing in it: an empty dock, which a truck and the sail come in to,
// and the crane loads, while the pointer is on the create button; leaving without a click blows them away.
export const EmptyDock = (props: Props) => {
  const [phase, setPhase] = useState<Phase>('idle');
  const timer = useRef<number>();
  const clicked = useRef(false);
  const again = useRef(false);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const settle = () => {
    setPhase('reset');
    timer.current = window.setTimeout(() => {
      setPhase(again.current ? 'launching' : 'idle');
      again.current = false;
    }, 50);
  };
  const enter = () => {
    if (phase === 'gust' || phase === 'reset') {
      again.current = true;
      return;
    }
    setPhase('launching');
  };
  const leave = () => {
    again.current = false;
    if (phase !== 'launching') {
      return;
    }
    if (still || clicked.current) {
      clicked.current = false;
      setPhase('idle');
      return;
    }
    setPhase('gust');
    timer.current = window.setTimeout(settle, gustSeconds * 1000);
  };
  const lead = props.filtered ? 'Nothing at the dock matches these filters.' : leads[phase];
  return (
    <div className={`empty-dock ${phaseClass[phase]}`}>
      <Dock />
      <div className="empty-dock-title">
        <Translation>{props.filtered ? 'No applications match' : 'No applications yet'}</Translation>
      </div>
      <div className="empty-dock-lead" key={lead}>
        <Translation>{lead}</Translation>
      </div>
      {!props.filtered && props.create && (
        <div
          className="empty-dock-action"
          onMouseEnter={enter}
          onMouseLeave={leave}
          onFocus={enter}
          onBlur={leave}
          onClickCapture={() => {
            clicked.current = true;
          }}
        >
          {props.create}
        </div>
      )}
    </div>
  );
};

// CreateButton is the primary button EmptyDock offers.
export const CreateButton = (props: { onClick: () => void }) => (
  <Button type="primary" onClick={props.onClick}>
    <Translation>New Application</Translation>
  </Button>
);
