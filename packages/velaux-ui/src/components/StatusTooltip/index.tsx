import classNames from 'classnames';
import React, { useState } from 'react';
import { AiOutlineRight } from 'react-icons/ai';

import { detailEntries } from '../../utils/status';
import type { DetailEntry } from '../../utils/status';
import { DetailList } from '../StatusDetails';
import { Translation } from '../Translation';

import './index.less';

// Balloons render in a portal on the body, so their content is styled through
// this popup class rather than from the graph's stylesheet.
export const statusTooltipPopupClass = 'status-tooltip-popup';

// TooltipSection is a part of the tooltip folded away behind its title and a
// count until asked for.
export interface TooltipSection {
  title: string;
  count: number;
  content: React.ReactNode;
}

export interface StatusTooltipProps {
  title: string;
  healthy?: boolean;
  summary?: DetailEntry[];
  message?: string;
  sections?: TooltipSection[];
  details?: Record<string, string>;
}

function CollapsibleSection(props: TooltipSection) {
  const [open, setOpen] = useState(false);
  return (
    <div className="status-tooltip-section">
      <button type="button" className="status-tooltip-toggle" aria-expanded={open} onClick={() => setOpen(!open)}>
        <AiOutlineRight className={classNames('status-tooltip-chevron', { open })} />
        <Translation>{props.title}</Translation>
        <span className="status-tooltip-count">{props.count}</span>
      </button>
      {open && <div className="status-tooltip-section-content">{props.content}</div>}
    </div>
  );
}

// StatusTooltip summarises a component or trait on the graph, with its
// sections, then its status details, folded away until asked for.
export const StatusTooltip = (props: StatusTooltipProps) => {
  const details = detailEntries(props.details);
  const summary = props.summary || [];
  const sections = [...(props.sections || [])];
  if (details.length > 0) {
    sections.push({ title: 'Details', count: details.length, content: <DetailList entries={details} /> });
  }
  return (
    <div className="status-tooltip">
      <div className="status-tooltip-header">
        <span className="status-tooltip-title">{props.title}</span>
        {props.healthy !== undefined && (
          <span className={classNames('status-tooltip-health', { unhealthy: !props.healthy })}>
            <span className={classNames('circle', props.healthy ? 'circle-success' : 'circle-warning')} />
            <Translation>{props.healthy ? 'Healthy' : 'UnHealthy'}</Translation>
          </span>
        )}
      </div>
      {summary.length > 0 && <DetailList entries={summary} />}
      {props.message && <div className="status-tooltip-message">{props.message}</div>}
      {sections.map((section) => (
        <CollapsibleSection key={section.title} {...section} />
      ))}
    </div>
  );
};
