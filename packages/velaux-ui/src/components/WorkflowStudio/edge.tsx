import React from 'react';

import type { StepEdit } from './index';

const renderConnector = (startPoint: number, endPoint: number, from: string, to: string) => {
  return (
    <path
      key={from + to}
      className="workflow-connector"
      data-from={'step-' + from}
      data-to={'step-' + to}
      fill="none"
      d={`M ${startPoint} 38 H ${endPoint}`}
    />
  );
};

export const Edge = (props: { steps: StepEdit[]; stepInterval: number }) => {
  const { stepInterval, steps } = props;

  const total = steps?.length || 0;
  if (total == 0) {
    return <></>;
  }
  let width = (total - 1) * stepInterval;
  steps.map((step) => (width += step.width));
  let firstPoint = -stepInterval;
  return (
    <svg width={width} height={300} className="workflow-connectors">
      {props.steps &&
        props.steps.map((step, index) => {
          if (index == total - 1) {
            return;
          }
          firstPoint = firstPoint + stepInterval + step.width;
          const endPoint = firstPoint + stepInterval;
          return renderConnector(firstPoint, endPoint, step.name, props.steps[index + 1].name);
        })}
    </svg>
  );
};
