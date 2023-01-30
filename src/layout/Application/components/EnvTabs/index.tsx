import React, { Component } from 'react';
import { connect } from 'dva';
import './index.less';
import Translation from '../../../../components/Translation';
import type { ApplicationDetail, EnvBinding } from '../../../../interface/application';
import { If } from 'tsx-control-statements/components';
import AddAndEditEnvBind from '../AddAndEditEnvBind';
import { Link } from 'dva/router';
import Permission from '../../../../components/Permission';
import classNames from 'classnames';
import { Balloon, Icon } from '@b-design/ui';
import { beautifyTime } from '../../../../utils/common';

type Props = {
  activeKey: string;
  applicationDetail?: ApplicationDetail;
  appName: string;
  dispatch: ({}) => {};
  envbinding?: EnvBinding[];
};

type State = {
  visibleEnvPlan: boolean;
};

@connect((store: any) => {
  return { ...store.application };
})
class TabsContent extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      visibleEnvPlan: false,
    };
  }

  handleChange = () => {};
  loadEnvbinding = async () => {
    const { applicationDetail } = this.props;
    if (applicationDetail) {
      this.props.dispatch({
        type: 'application/getApplicationEnvbinding',
        payload: { appName: applicationDetail.name },
      });
    }
  };
  loadApplicationWorkflows = async () => {
    const { appName } = this.props;
    this.props.dispatch({
      type: 'application/getApplicationWorkflows',
      payload: { appName: appName },
    });
  };
  loadApplicationPolicies = async () => {
    const { appName } = this.props;
    this.props.dispatch({
      type: 'application/getApplicationPolicies',
      payload: { appName: appName },
    });
  };
  render() {
    const { activeKey, applicationDetail, envbinding } = this.props;
    const { visibleEnvPlan } = this.state;
    const projectName = applicationDetail && applicationDetail.project?.name;
    return (
      <div>
        <div className="top-menus">
          <Link
            className={classNames('top-menu-item', { active: activeKey === 'basisConfig' })}
            to={`/applications/${applicationDetail?.name}/config`}
          >
            <Translation>Application Config</Translation>
          </Link>
          <div className="env-box">
            <div className="env-name">
              <Translation>Environments</Translation>
            </div>
            {envbinding?.map((item) => {
              return (
                <Balloon
                  key={item.name}
                  trigger={
                    <Link
                      key={item.name + 'link'}
                      className={classNames('top-menu-item', 'item-env', {
                        active: activeKey === item.name,
                      })}
                      to={`/applications/${applicationDetail?.name}/envbinding/${item.name}/workflow`}
                    >
                      <span title={item.description}>{item.alias ? item.alias : item.name}</span>
                    </Link>
                  }
                >
                  {item.description}
                  <p>Name: {item.name}</p>
                  <p>Bind Time: {beautifyTime(item.createTime)}</p>
                </Balloon>
              );
            })}
            <If condition={!applicationDetail?.readOnly}>
              <Permission
                request={{
                  resource: `project:${projectName}/application:${applicationDetail?.name}/envBinding:*`,
                  action: 'create',
                }}
                project={projectName}
              >
                <a
                  className={classNames('top-menu-item')}
                  style={{ width: '50px' }}
                  onClick={() => {
                    this.setState({ visibleEnvPlan: true });
                  }}
                >
                  <Icon type="add" />
                </a>
              </Permission>
            </If>
          </div>
        </div>

        <If condition={visibleEnvPlan}>
          <AddAndEditEnvBind
            envbinding={envbinding}
            onClose={() => {
              this.setState({ visibleEnvPlan: false });
            }}
            onOK={() => {
              this.loadEnvbinding();
              this.loadApplicationWorkflows();
              this.loadApplicationPolicies();
              this.setState({ visibleEnvPlan: false });
            }}
          />
        </If>
      </div>
    );
  }
}

export default TabsContent;
