import { Icon } from '@b-design/ui';
import classNames from 'classnames';
import React from 'react';
import { FaStopCircle } from 'react-icons/fa';
import { If } from 'tsx-control-statements/components';
import type { PipelineRunStatus } from '../../../../interface/pipeline';

const RunStatusIcon = (props: { runStatus?: PipelineRunStatus }) => {
  const { runStatus } = props;
  return (
    <div
      className={classNames(
        'icon',
        { warning: runStatus?.status == 'failed' },
        { success: runStatus?.status == 'succeeded' },
      )}
    >
      <If condition={runStatus?.status == 'failed' || runStatus?.status == 'terminated'}>
        <Icon type="wind-warning" />
      </If>
      <If condition={runStatus?.status == 'executing'}>
        <Icon type="loading" />
      </If>
      <If condition={runStatus?.status == 'succeeded'}>
        <Icon type="success-filling" />
      </If>
      <If condition={runStatus?.status == 'initializing'}>
        <FaStopCircle />
      </If>
      <If condition={runStatus?.status == 'suspending'}>
        <Icon type="clock-fill" />
      </If>
      <span className="status-text">{(runStatus?.status || 'pending').toUpperCase()}</span>
    </div>
  );
};

export default RunStatusIcon;
