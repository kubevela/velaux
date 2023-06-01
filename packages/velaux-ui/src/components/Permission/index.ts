import { connect } from 'dva';
import type React from 'react';

import type { LoginUserInfo } from '@velaux/data';
import type { ResourceAction } from '../../utils/permission';
import { checkPermission } from '../../utils/permission';

interface Props {
  userInfo?: LoginUserInfo;
  children: React.ReactNode;
  project?: string;
  request: ResourceAction;
}

const Permission = (props: Props) => {
  if (!props.userInfo) {
    return null;
  }
  if (!checkPermission(props.request, props.project, props.userInfo)) {
    return null;
  }
  return props.children;
};

export default connect((store: any) => {
  return { ...store.user };
})(Permission);
