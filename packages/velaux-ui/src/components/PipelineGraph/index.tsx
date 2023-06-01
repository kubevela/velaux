import React from 'react';
import Draggable from 'react-draggable';

import type { WorkflowStepStatus } from '@velaux/data';

import './index.less';
import { Step } from './components/step';

type PipelineGraphProps = {
  name?: string;
  steps?: WorkflowStepStatus[];
  zoom: number;
  onNodeClick: (step: WorkflowStepStatus) => void;
};

type State = {
  stepWidth: number;
  stepInterval: number;
};

class PipelineGraph extends React.Component<PipelineGraphProps, State> {
  constructor(props: PipelineGraphProps) {
    super(props);
    this.state = {
      stepWidth: 260,
      stepInterval: 56,
    };
  }

  renderConnector(index: number, total: number, from: string, to: string) {
    const { stepInterval, stepWidth } = this.state;
    const startPoint = stepWidth + (index - 1) * (stepWidth + stepInterval);
    const endPoint = startPoint + stepInterval;
    const width = (stepInterval + stepWidth) * total;
    return (
      <svg key={from + to} className="workflow-connectors" width={width} height={300}>
        <path
          className="workflow-connector"
          data-from={'step-' + from}
          data-to={'step-' + to}
          fill="none"
          d={`M ${startPoint} 38 H ${endPoint}`}
        />
      </svg>
    );
  }

  render() {
    const { steps, zoom, name } = this.props;
    return (
      <Draggable>
        <div
          className="workflow-graph"
          style={{
            transform: `scale(${zoom})`,
          }}
        >
          {steps &&
            steps.length > 1 &&
            steps.map((step, i: number) => {
              if (i < steps.length - 1) {
                return this.renderConnector(i + 1, steps.length, step.id, steps[i + 1].id);
              }
              return;
            })}
          {steps &&
            steps.map((step, i: number) => {
              return (
                <Step
                  key={name + step.name}
                  probeState={this.state}
                  step={step}
                  group={step.type == 'step-group'}
                  output={i < steps.length - 1}
                  input={i !== 0}
                  onNodeClick={this.props.onNodeClick}
                />
              );
            })}
        </div>
      </Draggable>
    );
  }
}

export default PipelineGraph;
