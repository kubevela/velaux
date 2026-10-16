import classNames from 'classnames';
import React from 'react';
import { BsCollection, BsDashSquare, BsPlusSquare } from 'react-icons/bs';

import type { WorkflowStepStatus } from '@velaux/data';
import { timeDiff } from '../../../utils/common';
import i18n from '../../../i18n';
import { StatusBadge } from '../../StatusBadge';
import { Translation } from '../../Translation';

import { stepCaption, stepStatus } from '../status';

export interface StepProps {
  step: WorkflowStepStatus;
  width: number;
  group: boolean;
  // open and onToggle are a step group's: drawn open, its sub-steps are cards
  // laid out by what they wait on (the children), else rows.
  open?: boolean;
  onToggle?: () => void;
  selected?: string;
  // actions, where given, are drawn under a step waiting for approval.
  actions?: (step: WorkflowStepStatus) => React.ReactNode;
  onNodeClick: (step: WorkflowStepStatus) => void;
  children?: React.ReactNode;
}

const waiting = (step: { phase?: string }) => step.phase === 'suspending';

const label = (step: { alias?: string; name?: string; id?: string }) => step.alias || step.name || step.id;

// Step is a step as a card: name and status, its type, then when it ran or why
// it failed. A step group is marked as one and lists its sub-steps as rows, or,
// open, holds them as cards.
export const Step = (props: StepProps) => {
  const { step, width, onNodeClick, group, open, onToggle, selected, actions, children } = props;
  const waitingActions = (target: WorkflowStepStatus) =>
    actions && waiting(target) ? (
      <div className="step-actions" onClick={(event) => event.stopPropagation()}>
        {actions(target)}
      </div>
    ) : null;
  const status = stepStatus(step);
  const caption = stepCaption(step);

  if (group) {
    const count = step.subSteps?.length || 0;
    return (
      <div
        className={classNames('step', 'group', `tone-${status.tone}`, { open: open, pending: !step.phase })}
        style={open ? undefined : { width: width + 'px' }}
      >
        <div className="step-group-head">
          <span className="step-group-tag">
            <BsCollection />
            <Translation>Group</Translation>
          </span>
          <button
            type="button"
            className="step-group-toggle"
            title={i18n.t(open ? 'Show the steps as a list' : 'Show the steps as a graph').toString()}
            onClick={(event) => {
              event.stopPropagation();
              onToggle && onToggle();
            }}
          >
            {open ? <BsDashSquare /> : <BsPlusSquare />}
          </button>
        </div>
        <div className="step-name" title={label(step)}>
          {label(step)}
        </div>
        <div className="step-meta">
          <span className="step-type">
            {count} {count === 1 ? <Translation>step</Translation> : <Translation>steps</Translation>}
          </span>
          <StatusBadge tone={status.tone} label={status.label} />
        </div>
        {open ? (
          <div className="step-group-body">{children}</div>
        ) : (
          <div className="step-subs">
            {step.subSteps?.map((subStep, index) => (
              <React.Fragment key={'step-' + (subStep.id || subStep.name) + index}>
                <div
                  className={classNames('step-sub', { selected: selected === subStep.id })}
                  title={stepCaption(subStep).text || undefined}
                  onClick={(event) => {
                    onNodeClick(subStep);
                    event.stopPropagation();
                  }}
                >
                  <span className={`step-sub-dot tone-${stepStatus(subStep).tone}`} title={stepStatus(subStep).label} />
                  <span className="step-sub-name">{label(subStep)}</span>
                  <span className="step-sub-time">
                    {subStep.firstExecuteTime ? timeDiff(subStep.firstExecuteTime, subStep.lastExecuteTime) : '-'}
                  </span>
                </div>
                {waitingActions(subStep)}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={classNames('step', `tone-${status.tone}`, {
        selected: selected === step.id,
        pending: !step.phase,
      })}
      style={{ width: width + 'px' }}
      onClick={(event) => {
        onNodeClick(props.step);
        event.stopPropagation();
      }}
    >
      <div className="step-name" title={label(step)}>
        {label(step)}
      </div>
      <div className="step-meta">
        <span className="step-type">{step.type}</span>
        <StatusBadge tone={status.tone} label={status.label} />
      </div>
      {caption.text && (
        <div className={classNames('step-caption', { error: caption.error })} title={caption.text}>
          {caption.text}
        </div>
      )}
      {waitingActions(step)}
    </div>
  );
};
