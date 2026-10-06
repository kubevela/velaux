import React from 'react';
import Draggable from 'react-draggable';

import type { WorkflowStepStatus } from '@velaux/data';

import './index.less';
import { Step } from './components/step';
import type { SpecStep } from './dependencies';
import { groupMode, groupOpensItself, stepEdges } from './dependencies';
import { StepEdges, stepWidth, useStepLayout } from './layout';
import { stepReached } from './status';

type GroupSpec = SpecStep & { mode?: string; subSteps?: SpecStep[] };

type StepGraphProps = {
  name?: string;
  steps?: WorkflowStepStatus[];
  // spec and mode are the workflow the run follows, which its edges come from;
  // subMode is how a group's sub-steps run unless the group names its own.
  spec?: GroupSpec[];
  mode: 'StepByStep' | 'DAG';
  subMode?: 'StepByStep' | 'DAG';
  // selected is the id of the step whose details are open.
  selected?: string;
  // actions are drawn under a step waiting for approval.
  actions?: (step: WorkflowStepStatus) => React.ReactNode;
  onNodeClick: (step: WorkflowStepStatus) => void;
  // onResize tells the graph drawing this one, inside an open group, that it
  // changed size.
  onResize?: () => void;
};

type PipelineGraphProps = StepGraphProps & { zoom: number };

// StepGraph draws steps left to right by what they wait on: a step sits right
// of every step it depends on, and steps that do not wait on each other share a
// column. An open step group draws its sub-steps the same way, inside it.
const StepGraph = (props: StepGraphProps) => {
  const { steps = [], spec, mode, subMode = 'DAG', name, selected, actions, onNodeClick, onResize } = props;
  // opened holds the groups someone opened or closed; the rest follow
  // groupOpensItself.
  const [opened, setOpened] = React.useState<Record<string, boolean>>({});
  const [, setNestedResizes] = React.useState(0);
  const edges = stepEdges(steps, spec, mode);
  const layout = useStepLayout(
    steps.map((s) => s.name),
    edges,
    onResize
  );
  const byName = new Map(steps.map((s) => [s.name, s]));
  const specOf = new Map((spec || []).map((s) => [s.name, s]));
  const nestedResized = React.useCallback(() => setNestedResizes((n) => n + 1), []);

  return (
    <div ref={layout.container} className="run-graph" style={layout.size}>
      <StepEdges
        layout={layout}
        edges={edges}
        className={(e) => {
          const target = byName.get(e.to);
          return target && stepReached(target) ? 'workflow-connector reached' : 'workflow-connector';
        }}
      />
      {steps.map((step) => {
        const group = step.type == 'step-group';
        const open = group && (opened[step.name] ?? groupOpensItself(step));
        const groupSpec = specOf.get(step.name);
        return (
          <div
            key={name + step.name}
            className="workflow-step"
            data-step-key={step.name}
            style={layout.place(step.name)}
          >
            <Step
              step={step}
              width={stepWidth}
              group={group}
              open={open}
              onToggle={() => setOpened({ ...opened, [step.name]: !open })}
              selected={selected}
              actions={actions}
              onNodeClick={onNodeClick}
            >
              {open && (
                <StepGraph
                  name={`${name}/${step.name}`}
                  steps={step.subSteps}
                  spec={groupSpec?.subSteps}
                  mode={groupMode(groupSpec?.mode, undefined, subMode)}
                  selected={selected}
                  actions={actions}
                  onNodeClick={onNodeClick}
                  onResize={nestedResized}
                />
              )}
            </Step>
          </div>
        );
      })}
    </div>
  );
};

// PipelineGraph is a run's steps on a canvas that drags and zooms.
const PipelineGraph = (props: PipelineGraphProps) => (
  <Draggable>
    <div className="run-canvas" style={{ transform: `scale(${props.zoom})` }}>
      <StepGraph {...props} />
    </div>
  </Draggable>
);

export default PipelineGraph;
