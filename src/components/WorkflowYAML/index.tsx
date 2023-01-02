import React from 'react';
import type { WorkflowStep } from '../../interface/pipeline';
import DefinitionCode from '../DefinitionCode';
import * as yaml from 'js-yaml';

type Props = {
  steps?: WorkflowStep[];
  name: string;
  onChange: (steps: WorkflowStep[]) => void;
};
export const WorkflowYAML = (props: Props) => {
  const id = 'workflow:' + props.name;
  const content = yaml.dump(props.steps);
  return (
    <div id={id} style={{ height: 'calc(100vh - 340px)' }}>
      <DefinitionCode
        onChange={(value: string) => {
          try {
            const newSteps: any = yaml.load(value);
            props.onChange(newSteps);
          } catch (err) {
            console.log(err);
          }
        }}
        value={content}
        language="yaml"
        theme="hc-black"
        containerId={id}
      />
    </div>
  );
};
