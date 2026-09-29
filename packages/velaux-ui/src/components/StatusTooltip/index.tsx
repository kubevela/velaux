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

export interface StatusTooltipProps {
  title: string;
  healthy?: boolean;
  // pending is a trait waiting for its workload, shown in place of its health.
  pending?: boolean;
  summary?: DetailEntry[];
  message?: string;
  details?: Record<string, string>;
}

// StatusTooltip summarises a component or trait on the graph, with its status
// details folded away until asked for.
export const StatusTooltip = (props: StatusTooltipProps) => {
  const [showDetails, setShowDetails] = useState(false);
  const details = detailEntries(props.details);
  const summary = props.summary || [];
  return (
    <div className="status-tooltip">
      <div className="status-tooltip-header">
        <span className="status-tooltip-title">{props.title}</span>
        {props.pending ? (
          <span className="status-tooltip-health pending">
            <span className="circle circle-pending" />
            <Translation>Pending</Translation>
          </span>
        ) : (
          props.healthy !== undefined && (
            <span className={classNames('status-tooltip-health', { unhealthy: !props.healthy })}>
              <span className={classNames('circle', props.healthy ? 'circle-success' : 'circle-warning')} />
              <Translation>{props.healthy ? 'Healthy' : 'UnHealthy'}</Translation>
            </span>
          )
        )}
      </div>
      {summary.length > 0 && <DetailList entries={summary} />}
      {props.message && <div className="status-tooltip-message">{props.message}</div>}
      {details.length > 0 && (
        <div className="status-tooltip-details">
          <button
            type="button"
            className="status-tooltip-toggle"
            aria-expanded={showDetails}
            onClick={() => setShowDetails(!showDetails)}
          >
            <AiOutlineRight className={classNames('status-tooltip-chevron', { open: showDetails })} />
            <Translation>Details</Translation>
            <span className="status-tooltip-count">{details.length}</span>
          </button>
          {showDetails && <DetailList entries={details} />}
        </div>
      )}
    </div>
  );
};
