import * as React from 'react';
import { Dialog } from '@b-design/ui';
import type { ApplicationDryRunResponse } from '../../interface/application';
import './index.less';
import { v4 as uuid } from 'uuid';
import DefinitionCode from '../DefinitionCode';

type ApplicationDryRunProps = {
  title: string;
  dryRun: ApplicationDryRunResponse;
  onClose: () => void;
};

export const ApplicationDryRun = (props: ApplicationDryRunProps) => {
  const id = uuid();
  return (
    <Dialog
      className={'commonDialog dryRunDialog'}
      isFullScreen={true}
      footer={<div />}
      visible={true}
      onClose={props.onClose}
      title={props.title}
    >
      <div id={id}>
        <DefinitionCode
          containerId={id}
          language="yaml"
          readOnly={true}
          value={props.dryRun.yaml}
        />
      </div>
    </Dialog>
  );
};
