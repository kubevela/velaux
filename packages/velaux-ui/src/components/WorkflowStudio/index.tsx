import classNames from 'classnames';
import { connect } from 'dva';
import _ from 'lodash';
import React from 'react';
import Draggable from 'react-draggable';
import type { Dispatch } from 'redux';

import { WorkflowEditContext } from '../../context';
import type { DefinitionBase, WorkflowMode, WorkflowStep, WorkflowStepBase } from '@velaux/data';

import { groupMode, orderByDependencies } from '../PipelineGraph/dependencies';
import { addDependency, insertAfter, removeDependency, studioUpdate } from './edit';
import type { AddAt } from './graph';
import { StudioGraph } from './graph';
import StepForm from './step-form';
import AddStep from './add-step';

import './index.less';

type Props = {
  steps?: WorkflowStep[];
  mode?: WorkflowMode;
  subMode?: WorkflowMode;
  definitions?: DefinitionBase[];
  // readOnly shows the steps without letting them be changed: they belong to
  // a shared workflow.
  readOnly?: boolean;
  dispatch?: Dispatch<any>;
  onChange: (steps: WorkflowStep[]) => void;
};
type State = {
  steps: WorkflowStep[];
  // adding is where the step being picked will go.
  adding?: AddAt;
  // showStep is the step whose form is open; showGroup the group it is in.
  showStep?: WorkflowStepBase;
  showGroup?: string;
};

// withoutDependency drops a removed step from its siblings' dependsOn, so none
// waits on a step that is gone.
const withoutDependency = <T extends WorkflowStepBase>(steps: T[], name: string): T[] =>
  steps.map((s) => (s.dependsOn?.includes(name) ? { ...s, dependsOn: s.dependsOn.filter((d) => d !== name) } : s));

@connect()
class WorkflowStudio extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { steps: _.cloneDeep(props.steps || []) };
  }

  componentDidUpdate(prevProps: Readonly<Props>) {
    const update = studioUpdate(prevProps, this.props, this.state.steps);
    if (update) {
      this.setState({ steps: _.cloneDeep(update.steps) }, update.changed ? this.onChange : undefined);
    }
  }

  onChange = () => {
    this.props.onChange(this.state.steps);
  };

  checkStepName = (name: string) =>
    this.state.steps.some((step) => step.name === name || step.subSteps?.some((sub) => sub.name === name));

  // place puts step where adding says, as the workflow would hold it, and
  // returns the steps with it and the step as placed.
  place = (step: WorkflowStepBase): { steps: WorkflowStep[]; step: WorkflowStepBase } => {
    const { adding, steps } = this.state;
    const { mode = 'StepByStep', subMode = 'DAG' } = this.props;
    if (!adding) {
      return { steps, step };
    }
    const opts = { branch: !!adding.branch };
    let placed: WorkflowStepBase = step;
    let next: WorkflowStep[];
    if (adding.group) {
      next = steps.map((s) => {
        if (s.name !== adding.group) {
          return s;
        }
        const subSteps = insertAfter(s.subSteps || [], adding.after, step, {
          ...opts,
          mode: groupMode(s.mode, undefined, subMode),
        });
        placed = subSteps.find((sub) => sub.name === step.name) || step;
        return { ...s, subSteps };
      });
    } else {
      next = insertAfter(steps, adding.after, step as WorkflowStep, { ...opts, mode });
      placed = next.find((s) => s.name === step.name) || step;
    }
    return { steps: next, step: placed };
  };

  addStep = (step: WorkflowStepBase) => {
    if (!this.state.adding) {
      return;
    }
    const { steps } = this.place(step);
    // A new group goes straight on to adding its first step.
    const group = step.type == 'step-group';
    this.setState({ steps, adding: group ? { kind: 'step', group: step.name } : undefined }, this.onChange);
  };

  onUpdateStep = (step: WorkflowStepBase) => {
    const { showGroup } = this.state;
    const steps = this.state.steps.map((s) => {
      if (!showGroup && s.name === step.name) {
        return { ...s, ...step };
      }
      if (showGroup && s.name === showGroup) {
        return { ...s, subSteps: s.subSteps?.map((sub) => (sub.name === step.name ? { ...step } : sub)) };
      }
      return s;
    });
    this.setState({ steps, showStep: undefined, showGroup: undefined }, this.onChange);
  };

  onDeleteStep = (name: string, group?: string) => {
    const steps = group
      ? this.state.steps.map((s) =>
          s.name === group
            ? {
                ...s,
                subSteps: withoutDependency(
                  (s.subSteps || []).filter((sub) => sub.name !== name),
                  name
                ),
              }
            : s
        )
      : withoutDependency(
          this.state.steps.filter((s) => s.name !== name),
          name
        );
    this.setState({ steps }, this.onChange);
  };

  onGroupMode = (group: string, mode: WorkflowMode) => {
    const steps = this.state.steps.map((s) =>
      s.name === group
        ? { ...s, mode, subSteps: mode === 'StepByStep' ? orderByDependencies(s.subSteps || []) : s.subSteps }
        : s
    );
    this.setState({ steps }, this.onChange);
  };

  // edit applies change to the steps of group, or to the top level.
  edit = (group: string | undefined, change: (list: WorkflowStepBase[]) => WorkflowStepBase[] | undefined) => {
    const steps = group
      ? this.state.steps.map((s) => {
          if (s.name !== group) {
            return s;
          }
          const subSteps = change(s.subSteps || []);
          return subSteps ? { ...s, subSteps } : s;
        })
      : (change(this.state.steps) as WorkflowStep[] | undefined) ?? this.state.steps;
    this.setState({ steps }, this.onChange);
  };

  onLink = (from: string, to: string, group?: string) => this.edit(group, (list) => addDependency(list, from, to));

  onUnlink = (from: string, to: string, group?: string) => this.edit(group, (list) => removeDependency(list, from, to));

  onMove = (name: string, group: string | undefined, delta: -1 | 1) => {
    const swap = <T extends { name: string }>(list: T[]): T[] => {
      const i = list.findIndex((s) => s.name === name);
      const next = [...list];
      [next[i], next[i + delta]] = [next[i + delta], next[i]];
      return next;
    };
    const steps = group
      ? this.state.steps.map((s) => (s.name === group ? { ...s, subSteps: swap(s.subSteps || []) } : s))
      : swap(this.state.steps);
    this.setState({ steps }, this.onChange);
  };

  render() {
    const { steps, adding, showStep, showGroup } = this.state;
    const { definitions, mode = 'StepByStep', subMode = 'DAG' } = this.props;
    return (
      <div className={classNames('run-studio', 'studio-editor')}>
        <div className="studio">
          <Draggable cancel=".studio-step, .studio-add-pair, .studio-add-step, .studio-port, .studio-unlink, .workflow-connector-hit">
            <div className="run-canvas">
              <StudioGraph
                steps={steps}
                mode={mode}
                subMode={subMode}
                onAdd={(at) => this.setState({ adding: at })}
                onEdit={(step, group) => this.setState({ showStep: step, showGroup: group })}
                onDelete={this.onDeleteStep}
                onGroupMode={this.onGroupMode}
                onMove={this.onMove}
                onLink={this.onLink}
                onUnlink={this.onUnlink}
                readOnly={this.props.readOnly}
              />
            </div>
          </Draggable>
        </div>
        {adding && (
          <AddStep
            key={JSON.stringify(adding)}
            checkStepName={this.checkStepName}
            onClose={() => {
              this.setState({ adding: undefined });
            }}
            addSub={!!adding.group}
            draft={this.place}
            onAdd={this.addStep}
            subMode={this.props.subMode}
            definitions={definitions?.filter((d) => (adding.kind === 'group') === (d.name === 'step-group'))}
          />
        )}
        {showStep && (
          <WorkflowEditContext.Provider value={{ stepName: showStep.name, steps: steps }}>
            <StepForm
              onClose={() => {
                this.setState({ showStep: undefined, showGroup: undefined });
              }}
              isSubStep={!!showGroup}
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
