import { Grid, Card, Breadcrumb, Button, Message } from '@b-design/ui';
import { connect } from 'dva';
import React, { Component } from 'react';
import Translation from '../../../../components/Translation';
import { deployApplication } from '../../../../api/application';
import { ApplicationDetail, ApplicationStatus } from '../../../../interface/application';
import { Link } from 'dva/router';
const { Row, Col } = Grid;

interface Props {
  currentPath: string;
  applicationDetail?: ApplicationDetail;
  applicationStatus?: { status?: ApplicationStatus };
}

interface State {
  loading: boolean;
  force: boolean;
  workflowName?: string;
}

@connect((store: any) => {
  return { ...store.application };
})
class ApplicationHeader extends Component<Props, State> {
  constructor(props: any) {
    super(props);
    this.state = {
      loading: true,
      force: false,
    };
  }

  onDeploy = () => {
    const { applicationDetail } = this.props;
    const { force, workflowName } = this.state;
    if (applicationDetail) {
      deployApplication({
        appName: applicationDetail.name,
        workflowName: workflowName,
        triggerType: 'web',
        force: force,
      }).then((re) => {
        if (re) {
          Message.success('deploy application success');
        }
      });
    } else {
      Message.warning('Please wait');
    }
  };

  componentDidMount() {}

  render() {
    const { applicationDetail, applicationStatus, currentPath } = this.props;
    const activeKey = currentPath.substring(currentPath.lastIndexOf('/') + 1);
    const item = <Translation>{`app-${activeKey}`}</Translation>;
    let status = '';
    if (applicationStatus && !applicationStatus.status) {
      status = 'UnDeploy';
    }
    if (applicationStatus && applicationStatus.status) {
      status = applicationStatus.status.status;
    }
    return (
      <div>
        <Row>
          <Col span={6} className="padding16">
            <Breadcrumb separator="/">
              <Breadcrumb.Item>
                <Link to="/applications">
                  <Translation>Application Manager</Translation>
                </Link>
              </Breadcrumb.Item>
              <Breadcrumb.Item>
                {applicationDetail && (applicationDetail.alias || applicationDetail.name)}
              </Breadcrumb.Item>
              <Breadcrumb.Item>{item}</Breadcrumb.Item>
            </Breadcrumb>
          </Col>
          <Col span={18} className="flexright" style={{ padding: '0 16px' }}>
            <Message
              type="notice"
              title="Application configuration changes take effect only after deploy."
            ></Message>
            <Button style={{ marginLeft: '16px' }} type="primary" onClick={this.onDeploy}>
              <Translation>Deploy</Translation>
            </Button>
          </Col>
        </Row>
        <Row>
          <Col span={24} className="padding16">
            <Card>todo:workflow-status</Card>
          </Col>
        </Row>
      </div>
    );
  }
}

export default ApplicationHeader;
