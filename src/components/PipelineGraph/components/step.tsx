import classNames from 'classnames';
import React, { useState } from 'react';
import { If } from 'tsx-control-statements/components';
import type { WorkflowStepStatus } from '../../../interface/application';
import { timeDiff } from '../../../utils/common';
import { renderStepStatusIcon } from './step-icon';

export interface StepProps {
  step: WorkflowStepStatus;
  output: boolean;
  input: boolean;
  probeState: {
    stepWidth: number;
    stepInterval: number;
  };
  group: boolean;
  onNodeClick: (step: WorkflowStepStatus) => void;
}

export const Step = (props: StepProps) => {
  const { step, output, input, onNodeClick, group } = props;
  const { stepWidth, stepInterval } = props.probeState;
  const [isActive, setActive] = useState(false);
  return (
    <div
      className={classNames('step', { active: isActive }, { group: group })}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
      style={{ marginRight: stepInterval + 'px' }}
      onClick={(event) => {
        if (!group) {
          onNodeClick(props.step);
          event.stopPropagation();
        }
      }}
    >
      <If condition={group}>
        <div className="step-title">{step.name || step.id}</div>
        <div className="groups" style={{ width: stepWidth + 'px' }}>
          {step.subSteps?.map((subStep) => {
            return (
              <div
                className="step-status"
                onClick={(event) => {
                  onNodeClick(subStep);
                  event.stopPropagation();
                }}
              >
                <div>{renderStepStatusIcon(subStep)}</div>
                <div className="step-name">{subStep.name || subStep.id}</div>
                <div>{timeDiff(subStep.firstExecuteTime, subStep.lastExecuteTime)}</div>
              </div>
            );
          })}
        </div>
      </If>
      <If condition={!group}>
        <div className="groups" style={{ width: stepWidth + 'px' }}>
          <div className="step-status">
            <div>{renderStepStatusIcon(step)}</div>
            <div className="step-name">{step.name || step.id}</div>
            <div className="">{timeDiff(step.firstExecuteTime, step.lastExecuteTime)}</div>
          </div>
        </div>
      </If>
      <If condition={output}>
        <div className="workflow-step-port workflow-step-port-output step-circle" />
      </If>
      <If condition={input}>
        <div className="workflow-step-port workflow-step-port-input step-circle" />
      </If>
    </div>
  );
};
