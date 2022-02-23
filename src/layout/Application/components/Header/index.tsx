import { Grid, Card, Breadcrumb, Button, Message, Dialog } from '@b-design/ui';
import { connect } from 'dva';
import React, { Component } from 'react';
import Translation from '../../../../components/Translation';
import {
  deployApplication,
  getApplicationStatistics,
  getApplicationWorkflowRecord,
} from '../../../../api/application';
import type {
  ApplicationDetail,
  ApplicationStatus,
  ApplicationStatistics,
  Workflow,
  WorkflowBase,
} from '../../../../interface/application';
import NumItem from '../../../../components/NumItem';
import { Link } from 'dva/router';
import type { APIError } from '../../../../utils/errors';
import { handleError } from '../../../../utils/errors';
import WorkflowSilder from '../WorkflowSilder';
import { If } from 'tsx-control-statements/components';
import Empty from '../../../../components/Empty';
import locale from '../../../../utils/locale';
import DeployConfig from '../DeployConfig';

const { Row, Col } = Grid;

interface Props {
  currentPath: string;
  appName: string;
  applicationDetail?: ApplicationDetail;
  applicationStatus?: { status?: ApplicationStatus };
  workflows?: Workflow[];
}

interface State {
  loading: boolean;
  statistics?: ApplicationStatistics;
  records?: WorkflowBase[];
  showDeployConfig: boolean;
}

@connect((store: any) => {
  return { ...store.application };
})
class ApplicationHeader extends Component<Props, State> {
  interval: any;
  sync: boolean;
  constructor(props: any) {
    super(props);
    this.state = {
      loading: true,
      showDeployConfig: false,
    };
    this.sync = true;
  }

  onDeployConfig = () => {
    this.setState({ showDeployConfig: true });
  };

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
              locale: locale.Dialog,
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
    const { appName } = this.props;
    if (appName) {
      getApplicationStatistics({ appName: appName }).then((re: ApplicationStatistics) => {
        if (re) {
          this.setState({ statistics: re });
        }
      });
    }
  };

  loadworkflowRecord = async () => {
    const { appName } = this.props;
    if (appName) {
      getApplicationWorkflowRecord({ appName: appName })
        .then((re) => {
          if (re) {
            this.setState({ records: re.records });
          }
        })
        .finally(() => {
          if (this.sync) {
            this.interval = setTimeout(() => {
              this.loadworkflowRecord();
            }, 3000);
          }
        });
    }
  };

  componentDidMount() {
    this.loadAppStatistics();
    this.loadworkflowRecord();
  }

  componentWillUnmount() {
    clearTimeout(this.interval);
    this.sync = false;
  }

  render() {
    const { applicationDetail, currentPath, workflows, appName } = this.props;
    const { statistics, records, showDeployConfig } = this.state;
    const activeKey = currentPath.substring(currentPath.lastIndexOf('/') + 1);
    const item = <Translation>{`app-${activeKey}`}</Translation>;
    return (
      <div>
        <Row>
          <Col span={6} className="padding16">
            <Breadcrumb separator="/">
              <Breadcrumb.Item>
                <Link to="/applications">
                  <Translation>Applications</Translation>
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
            />
            <Button
              style={{ marginLeft: '16px' }}
              type="primary"
              onClick={() => this.onDeployConfig()}
            >
              <Translation>Deploy</Translation>
            </Button>
          </Col>
        </Row>
        <Row wrap={true}>
          <Col xl={12} m={12} s={24} className="padding16">
            <Card locale={locale.Card}>
              <Row>
                <Col span={6} style={{ padding: '22px 0' }}>
                  <NumItem number={statistics?.envCount} title={'Env Count'} />
                </Col>
                <Col span={6} style={{ padding: '22px 0' }}>
                  <NumItem number={statistics?.targetCount} title={'Target Count'} />
                </Col>
                <Col span={6} style={{ padding: '22px 0' }}>
                  <NumItem number={statistics?.revisionCount} title={'Revision Count'} />
                </Col>
                <Col span={6} style={{ padding: '22px 0' }}>
                  <NumItem number={statistics?.workflowCount} title={'Workflow Count'} />
                </Col>
              </Row>
            </Card>
          </Col>
          <Col xl={12} m={12} s={24} className="padding16">
            <If condition={!records || (Array.isArray(records) && records.length === 0)}>
              <Card locale={locale.Card}>
                <Empty
                  message={<Translation>There is no running workflow</Translation>}
                  iconWidth={'30px'}
                />
              </Card>
            </If>
            <If condition={Array.isArray(records) && records.length > 0}>
              <WorkflowSilder appName={appName} records={records || []} />
            </If>
          </Col>
        </Row>
        <If condition={showDeployConfig}>
          <DeployConfig
            onClose={() => {
              this.setState({ showDeployConfig: false });
            }}
            onOK={this.onDeploy}
            workflows={workflows}
          />
        </If>
      </div>
    );
  }
}

export default ApplicationHeader;
