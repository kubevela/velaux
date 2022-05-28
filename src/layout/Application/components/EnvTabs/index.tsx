import React, { Component } from 'react';
import { connect } from 'dva';
import { Tab, Grid } from '@b-design/ui';
import './index.less';
import Translation from '../../../../components/Translation';
import type { ApplicationDetail, EnvBinding } from '../../../../interface/application';
import { If } from 'tsx-control-statements/components';
import AddAndEditEnvBind from '../AddAndEditEnvBind';
import { Link } from 'dva/router';
import Permission from '../../../../components/Permission';

const { Row, Col } = Grid;
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
      <div className="padding16">
        <div className="tabs-content">
          <Row className="tabs-wraper">
            <Col span={20}>
              <Tab
                animation={true}
                shape="wrapped"
                size="medium"
                activeKey={activeKey}
                onChange={this.handleChange}
                tabRender={(key: string, props: any) => {
                  return props.title;
                }}
              >
                <Tab.Item
                  title={
                    <Link className="item" to={`/applications/${applicationDetail?.name}/config`}>
                      <Translation>Baseline Config</Translation>
                    </Link>
                  }
                  key={'basisConfig'}
                />
                {envbinding?.map((item) => {
                  return (
                    <Tab.Item
                      title={
                        <Link
                          className="item"
                          to={`/applications/${applicationDetail?.name}/envbinding/${item.name}/status`}
                        >
                          <span title={item.description}>
                            {item.alias ? item.alias : item.name}
                          </span>
                        </Link>
                      }
                      key={item.name}
                    />
                  );
                })}
              </Tab>
            </Col>
            <Col span={4}>
              <div className="action-list">
                <If condition={!applicationDetail?.readOnly}>
                  <Permission
                    request={{
                      resource: `project:${projectName}/application:${applicationDetail?.name}/envBinding:*`,
                      action: 'create',
                    }}
                    project={projectName}
                  >
                    <a
                      onClick={() => {
                        this.setState({ visibleEnvPlan: true });
                      }}
                    >
                      <Translation>Bind Environment</Translation>
                    </a>
                  </Permission>
                </If>
              </div>
            </Col>
          </Row>
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
