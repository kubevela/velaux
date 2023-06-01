import classNames from 'classnames';
import React, { useState } from 'react';

import type { WorkflowStep } from '@velaux/data';

import { StepTypeIcon } from './step-icon';

import './index.less';

import { showAlias } from '../../utils/common';
import { If } from '../If';
import { AiOutlineDelete } from 'react-icons/ai';
import { IoMdAdd } from 'react-icons/io';
import { Translation } from '../../components/Translation';
import { WorkflowMode } from '@velaux/data';

export interface StepProps {
  step: WorkflowStep;
  subMode?: WorkflowMode;
  output: boolean;
  input: boolean;
  probeState: {
    stepWidth: number;
    stepInterval: number;
  };
  group: boolean;
  onNodeClick: (step: WorkflowStep, sub: boolean) => void;
  onDelete: (stepName: string) => void;
  onAddSubStep: (index: number) => void;
}

export const Step = (props: StepProps) => {
  const { step, output, input, onNodeClick, group, onDelete, onAddSubStep, subMode } = props;
  const { stepWidth, stepInterval } = props.probeState;
  const [isActive, setActive] = useState(false);
  const mode: WorkflowMode = step.mode || subMode || 'DAG';
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
          {mode && (
            <div className="mode">
              <Translation>Mode</Translation>:<Translation>{mode}</Translation>
            </div>
          )}
          {step.subSteps?.map((subStep, index) => {
            return (
              <div key={subStep.name + '-step'}>
                <div
                  key={subStep.name + '-status'}
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
                {mode == 'StepByStep' && (
                  <div className="sub-step-add" onClick={() => onAddSubStep(index + 1)}>
                    <IoMdAdd size={14} />
                  </div>
                )}
              </div>
            );
          })}
          {(mode === 'DAG' || !step.subSteps) && (
            <div className="step-status sub-step-add" onClick={() => onAddSubStep(step.subSteps?.length || 0)}>
              <div className="step-name">
                <IoMdAdd size={14} />
              </div>
            </div>
          )}
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
