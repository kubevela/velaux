import { Message } from '@alifd/next';
import * as yaml from 'js-yaml';
import React, { useEffect, useState } from 'react';

import type { WorkflowStep } from '@velaux/data';
import DefinitionCode from '../DefinitionCode';
import { Translation } from '../Translation';

type Props = {
  steps?: WorkflowStep[];
  name: string;
  onChange: (steps: WorkflowStep[]) => void;
};
export const WorkflowYAML = (props: Props) => {
  const id = 'workflow:' + props.name;
  const [content, setContent] = useState<string>();
  useEffect(() => {
    try {
      const c = yaml.dump(props.steps);
      setContent(c);
    } catch {}
  }, [props.steps]);

  return (
    <div>
      <Message type="help">
        <div>
          <Translation>The workflow step spec reference document</Translation>:
          <a
            href="http://kubevela.net/docs/end-user/workflow/built-in-workflow-defs"
            target="_blank"
            rel="noopener noreferrer"
            style={{ marginLeft: '16px' }}
          >
            <Translation>Click here</Translation>
          </a>
        </div>
      </Message>
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
    </div>
  );
};
