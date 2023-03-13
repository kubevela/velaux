import { Loading } from '@alifd/next';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import React, { useEffect } from 'react';
import type { Dispatch } from 'redux';

import { getApplicationEnvbinding } from '../../api/application';

const EnvRoute = (props: { match: { params: { appName: string } }; dispatch: Dispatch<any> }) => {
  useEffect(() => {
    getApplicationEnvbinding({ appName: props.match.params.appName }).then((res) => {
      if (res && Array.isArray(res.envBindings) && res.envBindings.length > 0) {
        props.dispatch(
          routerRedux.push(
            `/applications/${props.match.params.appName}/envbinding/${res.envBindings[0].name}/workflow`,
          ),
        );
      } else {
        props.dispatch(routerRedux.push(`/applications/${props.match.params.appName}`));
      }
    });
  });
  return <Loading visible={true} />;
};

export default connect()(EnvRoute);
