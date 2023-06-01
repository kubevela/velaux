import { Icon } from '@alifd/next';
import classNames from 'classnames';
import React from 'react';
import { AiFillClockCircle } from 'react-icons/ai';
import { BiError } from 'react-icons/bi';
import { FaStopCircle } from 'react-icons/fa';

import { If } from '../../../../components/If';
import type { RunPhase } from '@velaux/data';

const RunStatusIcon = (props: { status?: RunPhase }) => {
  const { status } = props;
  return (
    <div className={classNames('icon', { warning: status == 'failed' }, { success: status == 'succeeded' })}>
      <If condition={status == 'failed' || status == 'terminated'}>
        <BiError />
      </If>
      <If condition={status == 'executing'}>
        <Icon type="loading" />
      </If>
      <If condition={status == 'succeeded'}>
        <Icon type="success-filling" />
      </If>
      <If condition={status == 'initializing'}>
        <FaStopCircle />
      </If>
      <If condition={status == 'suspending'}>
        <AiFillClockCircle />
      </If>
      <span className="status-text">{(status || 'pending').toUpperCase()}</span>
    </div>
  );
};

export default RunStatusIcon;
