import React from 'react';
import type { WorkflowStepStatus } from '../../interface/application';
import type { PipelineRunStatus } from '../../interface/pipeline';
import Draggable from 'react-draggable';

import './index.less';
import { Step } from './components/step';

type PipelineGraphProps = {
  pipeline: PipelineRunStatus;
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
      <svg className="workflow-connectors" width={width} height={300}>
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
    const { pipeline, zoom } = this.props;
    const steps = pipeline.steps;
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
            })}
          {steps &&
            steps.map((step, i: number) => {
              return (
                <Step
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
