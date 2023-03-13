import classNames from 'classnames';
import React, { useState } from 'react';

import type { WorkflowStep } from '../../interface/pipeline';

import { StepTypeIcon } from './step-icon';

import './index.less';
import { Icon } from '@alifd/next';

import { showAlias } from '../../utils/common';
import { If } from '../If';
import { AiOutlineDelete } from 'react-icons/ai';
import { IoMdAdd } from 'react-icons/io';

export interface StepProps {
  step: WorkflowStep;
  output: boolean;
  input: boolean;
  probeState: {
    stepWidth: number;
    stepInterval: number;
  };
  group: boolean;
  onNodeClick: (step: WorkflowStep, sub: boolean) => void;
  onDelete: (stepName: string) => void;
  onAddSubStep: () => void;
}

export const Step = (props: StepProps) => {
  const { step, output, input, onNodeClick, group, onDelete, onAddSubStep } = props;
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
          onNodeClick(props.step, false);
          event.stopPropagation();
        }
      }}
    >
      <If condition={group}>
        <div
          className="step-title"
          onClick={(event) => {
            onNodeClick(step, false);
            event.stopPropagation();
          }}
        >
          {showAlias(step.name, step.alias)}
          <span className="step-delete">
            <AiOutlineDelete
              size={14}
              onClick={(event) => {
                onDelete(step.name);
                event.stopPropagation();
              }}
              title="Delete this step group."
            />
          </span>
        </div>
        <div className="groups" style={{ width: stepWidth + 'px' }}>
          {step.subSteps?.map((subStep) => {
            return (
              <div
                key={subStep.name}
                className="step-status"
                onClick={(event) => {
                  onNodeClick(subStep, true);
                  event.stopPropagation();
                }}
              >
                <StepTypeIcon type={subStep.type} />
                <div className="step-name">{subStep.alias || subStep.name}</div>
                <div
                  className="step-delete"
                  onClick={(event) => {
                    onDelete(subStep.name);
                    event.stopPropagation();
                  }}
                >
                  <AiOutlineDelete size={14} />
                </div>
              </div>
            );
          })}
          <div className="step-status sub-step-add" onClick={onAddSubStep}>
            <div className="step-name">
              <IoMdAdd size={14} />
            </div>
          </div>
        </div>
      </If>
      <If condition={!group}>
        <div className="groups" style={{ width: stepWidth + 'px' }}>
          <div className="step-status">
            <StepTypeIcon type={step.type} />
            <div className="step-name">{step.alias || step.name}</div>
            <div
              className="step-delete"
              onClick={(event) => {
                onDelete(step.name);
                event.stopPropagation();
              }}
            >
              <AiOutlineDelete size={14} />
            </div>
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