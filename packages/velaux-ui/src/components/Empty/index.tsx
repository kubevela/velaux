import React from 'react';

import { If } from '../If';
import { Translation } from '../Translation';

import './index.less';

type Props = {
  message?: string | React.ReactNode;
  style?: React.CSSProperties;
  iconWidth?: string;
  hideIcon?: boolean;
};

// One wave is 20 units wide; the water runs a wave past each edge so it can drift by one.
const waves = (y: number, height: number) => {
  let d = `M -20 ${y}`;
  for (let x = -20; x < 120; x += 20) {
    d += ` Q ${x + 5} ${y - height}, ${x + 10} ${y} Q ${x + 15} ${y + height}, ${x + 20} ${y}`;
  }
  return d;
};

// Buoy is a channel marker riding the swell with nothing moored to it, its lamp blinking.
const Buoy = (props: { width?: string }) => (
  <svg className="empty-buoy" style={{ width: props.width }} viewBox="0 0 100 74" aria-hidden="true">
    <defs>
      <linearGradient id="empty-buoy-depth" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#dbeafe" />
        <stop offset="1" stopColor="#dbeafe" stopOpacity="0" />
      </linearGradient>
    </defs>
    <path className="empty-buoy-water-back" d={waves(48, 1.6)} />
    <g transform="translate(50 50)">
      <g className="empty-buoy-float">
        <circle className="empty-buoy-glow" cy="-31" r="6" />
        <path className="empty-buoy-cage" d="M -4 -19 L -1.5 -29 M 4 -19 L 1.5 -29 M -2.6 -24.5 H 2.6" />
        <circle className="empty-buoy-lamp" cy="-30.5" r="2" />
        <path className="empty-buoy-body" d="M -9 0 L -5.5 -19 H 5.5 L 9 0 Z" />
        <path className="empty-buoy-band" d="M -7.4 -9 L -6.6 -13 H 6.6 L 7.4 -9 Z" />
        <rect className="empty-buoy-base" x="-11" y="-1.5" width="22" height="4" rx="1.5" />
      </g>
    </g>
    <g className="empty-buoy-water">
      <path className="empty-buoy-sea" fill="url(#empty-buoy-depth)" d={`${waves(52, 2.2)} V 74 H -20 Z`} />
      <path className="empty-buoy-line" d={waves(52, 2.2)} />
    </g>
  </svg>
);

const Empty = (props: Props) => {
  return (
    <div className="empty" style={props.style}>
      <If condition={!props.hideIcon}>
        <Buoy width={props.iconWidth} />
      </If>
      <div className="message">{props.message || <Translation>Empty Data</Translation>}</div>
    </div>
  );
};

export default Empty;
