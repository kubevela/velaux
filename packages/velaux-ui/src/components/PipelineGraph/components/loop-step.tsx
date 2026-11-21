import classNames from 'classnames';
import React from 'react';
import { BsArrowRepeat, BsDashSquare, BsPlusSquare } from 'react-icons/bs';

import type { WorkflowStepStatus } from '@velaux/data';
import i18n from '../../../i18n';
import { StatusBadge } from '../../StatusBadge';
import { Translation } from '../../Translation';

import type { Lane } from '../loop';
import { loopProgress } from '../loop';
import { stepStatus } from '../status';

type LoopStepProps = {
  step: WorkflowStepStatus;
  lanes: Array<Lane<WorkflowStepStatus>>;
  width: number;
  open: boolean;
  onToggle: () => void;
  // lane draws one item's passes: a card, or a group's steps as a graph.
  lane: (lane: Lane<WorkflowStepStatus>) => React.ReactNode;
};

const modeLabel = (mode?: string) => (mode === 'DAG' ? 'All at once' : 'One at a time');

// LoopStep is a loop as a card. Closed, it shows a segment per item, coloured
// by how that item's passes went; open, a lane per item, labelled by the item,
// holding its passes. Items run one at a time are joined in order.
export const LoopStep = (props: LoopStepProps) => {
  const { step, lanes, width, open, onToggle, lane } = props;
  const status = stepStatus(step);
  const progress = loopProgress(lanes);
  const inOrder = step.loop?.mode !== 'DAG';
  const label = step.alias || step.name;
  return (
    <div
      className={classNames('step', 'group', 'loop', `tone-${status.tone}`, { open, pending: !step.phase })}
      style={open ? undefined : { width: width + 120 + 'px' }}
    >
      <div className="step-group-head">
        <span className="step-group-tag loop-tag">
          <BsArrowRepeat />
          <Translation>Loop</Translation>
        </span>
        <button
          type="button"
          className="step-group-toggle"
          title={i18n.t(open ? 'Show a summary' : 'Show each item').toString()}
          onClick={(event) => {
            event.stopPropagation();
            onToggle();
          }}
        >
          {open ? <BsDashSquare /> : <BsPlusSquare />}
        </button>
      </div>
      <div className="step-name" title={label}>
        {label}
      </div>
      <div className="step-meta">
        <span className="step-type">
          {lanes.length > 0 ? `${lanes.length} ${i18n.t(lanes.length === 1 ? 'item' : 'items')}` : ''}
          {lanes.length > 0 ? ' · ' : ''}
          {i18n.t(modeLabel(step.loop?.mode)).toString()}
        </span>
        <StatusBadge tone={status.tone} label={status.label} />
      </div>
      {lanes.length === 0 && (
        <div className="step-caption">
          <Translation>The items are known once the loop starts</Translation>
        </div>
      )}
      {!open && lanes.length > 0 && (
        <>
          <div className="loop-segments">
            {progress.segments.map((s, i) => (
              <div key={i} className={classNames('loop-segment', `tone-${s.tone}`)} title={s.label}>
                <span className="loop-segment-bar" />
                <span className="loop-segment-label">{s.label}</span>
              </div>
            ))}
          </div>
          <div className="step-caption">
            {progress.done} {i18n.t('of').toString()} {progress.total} {i18n.t('done').toString()}
          </div>
        </>
      )}
      {open && (
        <div className="loop-lanes">
          {lanes.map((l, i) => (
            <React.Fragment key={l.index}>
              {inOrder && i > 0 && (
                <div className="loop-then">
                  <Translation>then</Translation>
                </div>
              )}
              <div className="loop-lane">
                <div className="loop-lane-label" title={JSON.stringify(l.item, null, 2)}>
                  <span className="loop-lane-name">{l.label}</span>
                  <span className="loop-lane-index">
                    <Translation>item</Translation> {l.index}
                  </span>
                </div>
                <div className="loop-lane-body">{lane(l)}</div>
              </div>
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
};
