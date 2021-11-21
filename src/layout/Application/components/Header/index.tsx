import {
  Grid,
  Card,
  Breadcrumb,
  Button,
  Message,
  Icon,
  Dropdown,
  Menu,
  Dialog,
} from '@b-design/ui';
import { connect } from 'dva';
import React, { Component } from 'react';
import Translation from '../../../../components/Translation';
import {
  deployApplication,
  getApplicationStatistics,
  getApplicationWorkflowRecord,
} from '../../../../api/application';
import {
  ApplicationDetail,
  ApplicationStatus,
  ApplicationStatistics,
  Workflow,
  WorkflowStatus,
} from '../../../../interface/application';
import NumItem from '../../../../components/NumItem';
import { Link } from 'dva/router';
import { handleError, APIError } from '../../../../utils/errors';

const { Row, Col } = Grid;

interface Props {
  currentPath: string;
  applicationDetail?: ApplicationDetail;
  applicationStatus?: { status?: ApplicationStatus };
  workflows?: Array<Workflow>;
}

interface State {
  loading: boolean;
  statistics?: ApplicationStatistics;
  records?: Array<WorkflowStatus>;
}

@connect((store: any) => {
  return { ...store.application };
})
class ApplicationHeader extends Component<Props, State> {
  constructor(props: any) {
    super(props);
    this.state = {
      loading: true,
    };
  }

  onDeploy = (workflowName?: string, force?: boolean) => {
    const { applicationDetail } = this.props;
    if (applicationDetail) {
      deployApplication(
        {
          appName: applicationDetail.name,
          workflowName: workflowName,
          triggerType: 'web',
          force: force || false,
        },
        true,
      )
        .then((re) => {
          if (re) {
            Message.success('deploy application success');
          }
        })
        .catch((err: APIError) => {
          if (err.BusinessCode === 10004) {
            Dialog.confirm({
              content: 'Workflow is executing. Do you want to force a restart?',
              onOk: () => {
                this.onDeploy(workflowName, true);
              },
            });
          } else {
            handleError(err);
          }
        });
    } else {
      Message.warning('Please wait');
    }
  };

  loadAppStatistics = async () => {
    const { applicationDetail } = this.props;
    if (applicationDetail?.name) {
      getApplicationStatistics({ appName: applicationDetail?.name }).then(
        (re: ApplicationStatistics) => {
          if (re) {
            this.setState({ statistics: re });
          }
        },
      );
    }
  };

  loadworkflowRecord = async () => {
    const { applicationDetail } = this.props;
    if (applicationDetail && applicationDetail.name) {
      getApplicationWorkflowRecord({ appName: applicationDetail?.name }).then((re) => {
        if (re) {
          this.setState({ records: re.records });
        }
      });
    }
  };

  componentDidMount() {
    this.loadAppStatistics();
    this.loadworkflowRecord();
  }

  render() {
    const { applicationDetail, currentPath, workflows } = this.props;
    const { statistics, records } = this.state;
    const activeKey = currentPath.substring(currentPath.lastIndexOf('/') + 1);
    const item = <Translation>{`app-${activeKey}`}</Translation>;
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
            <Button style={{ marginLeft: '16px' }} type="primary" onClick={() => this.onDeploy()}>
              <Translation>Deploy</Translation>
            </Button>
            <Dropdown
              trigger={
                <Button type="primary">
                  <Icon type="ellipsis-vertical" />
                </Button>
              }
            >
              <Menu>
                {workflows?.map((item) => {
                  return (
                    <Menu.Item
                      onClick={() => {
                        this.onDeploy(item.name);
                      }}
                      key={item.name}
                    >
                      <Translation>Execute Workflow</Translation> {item.alias || item.name}
                    </Menu.Item>
                  );
                })}
              </Menu>
            </Dropdown>
          </Col>
        </Row>
        <Row>
          <Col span={12} className="padding16">
            <Card>
              <Row>
                <Col span={6} style={{ padding: '22px 0' }}>
                  <NumItem number={statistics?.envCount} title={'Env Count'}></NumItem>
                </Col>
                <Col span={6} style={{ padding: '22px 0' }}>
                  <NumItem
                    number={statistics?.deliveryTargetCount}
                    title={'DeliveryTarget Count'}
                  ></NumItem>
                </Col>
                <Col span={6} style={{ padding: '22px 0' }}>
                  <NumItem number={statistics?.revisonCount} title={'Revision Count'}></NumItem>
                </Col>
                <Col span={6} style={{ padding: '22px 0' }}>
                  <NumItem number={statistics?.workflowCount} title={'Workflow Count'}></NumItem>
                </Col>
              </Row>
            </Card>
          </Col>
          <Col span={12} className="padding16">
            <Card>
              {records?.map((record) => {
                record.steps.map((step) => {
                  return <span>{step.name || step.type}</span>;
                });
              })}
            </Card>
          </Col>
        </Row>
      </div>
    );
  }
}

export default ApplicationHeader;
