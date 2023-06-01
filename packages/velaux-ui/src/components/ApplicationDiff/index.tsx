import { Button, Dialog, Message } from '@alifd/next';
import * as React from 'react';

import type { ApplicationCompareResponse } from '@velaux/data';
import './index.less';
import { DiffEditor } from '../DiffEditor';
import { If } from '../If';
import { Translation } from '../Translation';

type ApplicationDiffProps = {
  baseName: string;
  targetName: string;
  compare: ApplicationCompareResponse;
  onClose: () => void;
  rollback2Revision?: () => void;
  id?: string;
};

export const ApplicationDiff = (props: ApplicationDiffProps) => {
  const { baseName, targetName, compare, rollback2Revision } = props;
  const container = 'revision' + baseName + targetName;
  return (
    <Dialog
      v2
      className={'application-diff'}
      width="800px"
      overflowScroll={true}
      footer={
        <div>
          <If condition={compare.isDiff && rollback2Revision}>
            <Button type="primary" onClick={rollback2Revision}>
              Rollback To Revision
            </Button>
          </If>
        </div>
      }
      id={props.id}
      visible={true}
      onClose={props.onClose}
      title={
        <div style={{ color: '#fff' }}>
          {' Differences between '}
          <span className="name">{props.baseName}</span>
          {' and '}
          <span className="name">{props.targetName}</span>
        </div>
      }
    >
      <If condition={!compare.isDiff}>
        <Message type="success" style={{ marginBottom: '8px' }}>
          <Translation>There is no change</Translation>
        </Message>
      </If>
      <div id={container} className="diff-box">
        <DiffEditor language={'yaml'} id={container} target={compare.targetAppYAML} base={compare.baseAppYAML} />
      </div>
    </Dialog>
  );
};
