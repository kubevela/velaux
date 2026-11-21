import { Dropdown } from '@alifd/next';
import React from 'react';
import { AiOutlineMore } from 'react-icons/ai';

import type { Tone } from '../StatusBadge';
import { StatusBadge } from '../StatusBadge';
import './index.less';

type Props = {
  // tone colours the card's edge and badge; none leaves the edge plain.
  tone?: Tone;
  badge?: string;
  icon?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  onOpen?: () => void;
  // menu is the card's actions, shown behind a ⋮ when given.
  menu?: React.ReactNode;
  // aside sits at the head's right instead of a menu, such as a "Local" label.
  aside?: React.ReactNode;
  description?: string;
  chips?: React.ReactNode;
  footLeft?: React.ReactNode;
  footRight?: React.ReactNode;
};

// ResourceCard is one item of a card grid: a small icon and title, a status
// badge, a description, chips and a footer.
export const ResourceCard = (props: Props) => (
  <div className={`resource-card ${props.tone ? `tone-${props.tone}` : ''}`}>
    <div className="resource-card-head">
      <div className={`resource-card-icon ${props.onOpen ? 'clickable' : ''}`} onClick={props.onOpen}>
        {props.icon}
      </div>
      <div className="resource-card-title">
        <span className={props.onOpen ? 'clickable' : ''} onClick={props.onOpen}>
          {props.title}
        </span>
        {props.subtitle && <span className="resource-card-sub">{props.subtitle}</span>}
      </div>
      {props.menu && (
        <Dropdown trigger={<AiOutlineMore className="resource-card-more" />} align="tr br">
          {props.menu}
        </Dropdown>
      )}
      {!props.menu && props.aside}
    </div>
    {props.tone && props.badge && (
      <div>
        <StatusBadge tone={props.tone} label={props.badge} />
      </div>
    )}
    <div className="resource-card-description" title={props.description}>
      {props.description}
    </div>
    {props.chips && <div className="resource-card-chips">{props.chips}</div>}
    {(props.footLeft || props.footRight) && (
      <div className="resource-card-foot">
        <span>{props.footLeft}</span>
        <span>{props.footRight}</span>
      </div>
    )}
  </div>
);

// ResourceGrid lays cards out in as many columns as fit.
export const ResourceGrid = (props: { children: React.ReactNode }) => (
  <div className="resource-grid">{props.children}</div>
);

// Chip is a small label on a card.
export const Chip = (props: { children: React.ReactNode; tone?: 'accent' | 'warning' }) => (
  <span className={`resource-chip ${props.tone || ''}`}>{props.children}</span>
);
