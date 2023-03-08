import { Icon } from '@b-design/ui';
import classNames from 'classnames';
import { connect } from 'dva';
import _ from 'lodash';
import React from 'react';
import Draggable from 'react-draggable';
import type { Dispatch } from 'redux';

import { WorkflowEditContext } from '../../context';
import type { DefinitionBase } from '../../interface/definitions';
import type { WorkflowStep, WorkflowStepBase } from '../../interface/pipeline';

import { Edge } from './edge';
import { Step } from './step';
import StepForm from './step-form';
import TypeSelect from './type-select';



type Props = {
  steps?: WorkflowStep[];
  definitions?: DefinitionBase[];
  dispatch?: Dispatch<any>;
  onChange: (steps: WorkflowStep[]) => void;
};
type State = {
  steps: StepEdit[];
  addIndex: number;
  subStep?: boolean;
  stepInterval: number;
  changed: boolean;
  showStep?: WorkflowStep;
};

export interface StepEdit extends WorkflowStep {
  nodeType: 'start' | 'end' | 'step' | string;
  width: number;
  incomplete?: boolean;
}

@connect()
class WorkflowStudio extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    const steps =
      props.steps?.map((step) => {
        const se: StepEdit = Object.assign(step, { nodeType: 'step', width: 260 });
        return se;
      }) || [];
    steps.unshift({ nodeType: 'start', width: 100, name: 'start', type: '' });
    steps.push({ nodeType: 'end', width: 100, name: 'end', type: '' });
    this.state = { steps: steps, stepInterval: 100, addIndex: 0, changed: false };
  }

  onChange = () => {
    const { steps } = this.state;
    const ws = steps
      .filter((step) => step.nodeType === 'step')
      .map((step) => {
        return _.omit(step, ['width', 'incomplete', 'nodeType']);
      });
    this.props.onChange(ws);
  };

  checkStepName = (name: string) => {
    const { steps } = this.state;
    let found = false;
    steps.map((step) => {
      if (step.name === name) {
        found = true;
      }
      step.subSteps?.map((subStep) => {
        if (subStep.name === name) {
          found = true;
        }
      });
    });
    return found;
  };

  addStep = (step: WorkflowStepBase) => {
    const { addIndex, steps, subStep } = this.state;
    if (!subStep) {
      steps.splice(addIndex, 0, { ...step, nodeType: 'step', width: 260, incomplete: true });
    } else {
      if (steps[addIndex].subSteps) {
        steps[addIndex].subSteps?.push(step);
      } else {
        steps[addIndex].subSteps = [step];
      }
    }
    this.setState(
      {
        steps: steps,
        changed: true,
        addIndex: 0,
        subStep: false,
      },
      this.onChange,
    );
    if (step.type != 'step-group') {
      this.setState({ showStep: step, subStep: subStep });
    }
  };
  onUpdateStep = (step: WorkflowStepBase) => {
    const { steps } = this.state;
    steps.map((s, index) => {
      if (s.name === step.name) {
        steps[index] = { ...s, ...step, incomplete: false };
      }
      s.subSteps?.map((subStep, j) => {
        if (subStep.name === step.name && s.subSteps) {
          s.subSteps[j] = { ...step };
        }
      });
    });
    this.setState({ steps: steps, showStep: undefined, subStep: false }, this.onChange);
  };
  onDeleteStep = (stepName: string) => {
    const { steps } = this.state;
    const newSteps = _.cloneDeep(steps);
    newSteps.map((s, index) => {
      s.subSteps?.map((subStep, j) => {
        if (subStep.name === stepName && s.subSteps) {
          s.subSteps.splice(j, 1);
        }
      });
      if (s.name === stepName && s.nodeType === 'step') {
        newSteps.splice(index, 1);
      }
    });
    this.setState({ steps: newSteps }, this.onChange);
  };

  render(): React.ReactNode {
    const { steps, stepInterval, addIndex, showStep, subStep } = this.state;
    const { definitions } = this.props;
    return (
      <div
        className={classNames('run-studio')}
        style={{
          paddingLeft: '2rem',
        }}
      >
        <div className="studio">
          <Draggable>
            <div className={'workflow-graph'}>
              <Edge steps={steps || []} stepInterval={stepInterval} />
              {steps?.map((step, index) => {
                const addAction = (
                  <div
                    className="line-action"
                    onClick={() => {
                      this.setState({ addIndex: index });
                    }}
                  >
                    <span className="line-icon">
                      <svg
                        data-icon="plus"
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="currentColor"
                      >
                        <desc>plus</desc>
                        <path
                          d="M13 7H9V3c0-.55-.45-1-1-1s-1 .45-1 1v4H3c-.55 0-1 .45-1 1s.45 1 1 1h4v4c0 .55.45 1 1 1s1-.45 1-1V9h4c.55 0 1-.45 1-1s-.45-1-1-1z"
                          fillRule="evenodd"
                        />
                      </svg>
                    </span>
                  </div>
                );
                switch (step.nodeType) {
                  case 'start':
                    return (
                      <div
                        key={step.nodeType + step.name}
                        className={classNames('step', 'step-start')}
                      >
                        <Icon type="playcircle-fill" />
                        <div className="workflow-step-port workflow-step-port-output step-circle" />
                      </div>
                    );
                  case 'step':
                    return (
                      <div key={step.nodeType + step.name} style={{ position: 'relative' }}>
                        <Step
                          probeState={{ stepWidth: step.width, stepInterval: stepInterval }}
                          step={step}
                          group={step.type == 'step-group'}
                          output={true}
                          input={true}
                          onNodeClick={(s, sub) => {
                            this.setState({ showStep: s, subStep: sub });
                          }}
                          onAddSubStep={() => {
                            this.setState({ addIndex: index, subStep: true });
                          }}
                          onDelete={this.onDeleteStep}
                        />
                        {addAction}
                      </div>
                    );
                  case 'end':
                    return (
                      <div key={step.nodeType + step.name} style={{ position: 'relative' }}>
                        <div
                          key={step.nodeType + step.name}
                          className={classNames('step', 'step-end')}
                        >
                          <Icon type="stopcircle-fill" />
                          <div className="workflow-step-port workflow-step-port-input step-circle" />
                        </div>
                        {addAction}
                      </div>
                    );
                }
              })}
            </div>
          </Draggable>
        </div>
        {addIndex > 0 && (
          <TypeSelect
            checkStepName={this.checkStepName}
            onClose={() => {
              this.setState({ addIndex: 0, subStep: false });
            }}
            addSub={subStep}
            addStep={this.addStep}
            definitions={definitions}
          />
        )}
        {showStep && (
          <WorkflowEditContext.Provider
            value={{
              stepName: showStep.name,
              steps: steps.filter((step) => step.nodeType === 'step'),
            }}
          >
            <StepForm
              onClose={() => {
                this.setState({ showStep: undefined });
              }}
              isSubStep={subStep}
              onUpdate={this.onUpdateStep}
              step={showStep}
            />
          </WorkflowEditContext.Provider>
        )}
      </div>
    );
  }
}

export default WorkflowStudio;
