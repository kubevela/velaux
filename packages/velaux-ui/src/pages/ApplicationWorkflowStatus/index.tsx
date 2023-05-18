import { Select, Grid, Card, Loading, Button, MenuButton } from '@alifd/next';
import { connect } from 'dva';
import { routerRedux, Link } from 'dva/router';
import React from 'react';
import type { Dispatch } from 'redux';
import { detailWorkflow } from '../../api/workflows';
import { getApplicationEnvRecords } from '../../api/application';
import Empty from '../../components/Empty';
import { If } from '../../components/If';
import Permission from '../../components/Permission';
import { Translation } from '../../components/Translation';
import Header from '../ApplicationInstanceList/components/Header';
import i18n from '../../i18n';
import type {
  ApplicationDetail,
  ApplicationStatus,
  EnvBinding,
  Workflow,
  WorkflowRecord,
  WorkflowStepStatus,
 WorkflowStepBase } from '@velaux/data';
import { beautifyTime } from '../../utils/common';
import { locale } from '../../utils/locale';

import ApplicationWorkflowRecord from './components/WorkflowRecord';
import { LoginUserInfo } from '@velaux/data';

const { Row, Col } = Grid;

type Props = {
  dispatch: Dispatch<any>;
  match: { params: { appName: string; envName: string; record?: string } };
  applicationDetail?: ApplicationDetail;
  applicationStatus?: ApplicationStatus;
  envbinding: EnvBinding[];
  workflows: Workflow[];
  userInfo?: LoginUserInfo;
};

type State = {
  zoom: number;
  records?: WorkflowRecord[];
  showDetail: boolean;
  showRecordName?: string;
  stepStatus?: WorkflowStepStatus;
  runLoading?: boolean;
  activeKey: string | number;
  workflow?: Workflow;
  currentRecord?: WorkflowRecord;
};

@connect((store: any) => {
  return { ...store.application, ...store.user };
})
class ApplicationWorkflow extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      zoom: 1,
      showDetail: false,
      activeKey: 'detail',
    };
  }

  componentDidMount() {
    this.loadApplicationStatus();
    this.loadWorkflowRecord();
  }

  componentDidUpdate(prevProps: Readonly<Props>): void {
    if (prevProps.match !== this.props.match || prevProps.envbinding !== this.props.envbinding) {
      this.setState({ records: [], showRecordName: '' }, () => {
        this.loadWorkflowRecord();
      });
    }
  }

  loadApplicationStatus = async () => {
    const {
      params: { appName, envName },
    } = this.props.match;
    if (envName) {
      this.props.dispatch({
        type: 'application/getApplicationStatus',
        payload: { appName: appName, envName: envName },
      });
    }
  };

  loadWorkflow = () => {
    const {
      params: { appName },
    } = this.props.match;
    const { currentRecord } = this.state;
    if (currentRecord) {
      detailWorkflow({ appName: appName, name: currentRecord.workflowName }).then((res) => {
        this.setState({ workflow: res });
      });
    }
  };

  loadWorkflowRecord = () => {
    const {
      params: { appName, record, envName },
    } = this.props.match;
    const { dispatch } = this.props;
    const env = this.getEnvbindingByName();
    if (env) {
      getApplicationEnvRecords({ appName: appName, envName: envName }).then((res: { records: WorkflowRecord[] }) => {
        if (res) {
          const records = res.records;
          this.setState({ records: records || [], showRecordName: '' });
          const currentRecord = res.records.find((re) => re.name === record);
          if (currentRecord) {
            this.setState({ showRecordName: record, currentRecord: currentRecord }, this.loadWorkflow);
          } else if (Array.isArray(records) && records.length > 0) {
            this.setState({ showRecordName: records[0].name });
            dispatch(
              routerRedux.push(`/applications/${appName}/envbinding/${env.name}/workflow/records/${records[0].name}`)
            );
            return;
          }
        }
        return;
      });
    }
  };

  getEnvbindingByName = () => {
    const { envbinding } = this.props;
    const {
      params: { envName },
    } = this.props.match;
    return envbinding.find((env) => env.name === envName);
  };

  runApplicationWorkflow = () => {};

  render() {
    const { applicationDetail, dispatch, applicationStatus, workflows, userInfo } = this.props;
    const {
      params: { record, appName, envName },
    } = this.props.match;
    const { records, showRecordName, stepStatus, workflow } = this.state;

    const envWorkflows = workflows.filter((w) => w.envName === envName);

    if (!applicationDetail || !workflow) {
      return <Loading visible={true} />;
    }

    const recordOptions = records?.map((re) => {
      return {
        label: `${re.name}${beautifyTime(re.endTime) ? '(' + beautifyTime(re.endTime) + ')' : ''}`,
        value: re.name,
      };
    });
    const showRecord = record && recordOptions?.find((re) => re.value === record);
    let stepSpec: WorkflowStepBase | undefined;

    workflow?.steps?.map((step) => {
      if (stepStatus && step.name == stepStatus.name) {
        stepSpec = step;
      }
      step.subSteps?.map((sub) => {
        if (stepStatus && sub.name == stepStatus.name) {
          stepSpec = sub;
        }
      });
    });

    let properties = stepSpec && stepSpec.properties;

    if (typeof properties === 'string') {
      const newProperties: Record<string, any> = JSON.parse(properties);
      properties = newProperties;
    }
    return (
      <div className="run-layout">
        <Header
          userInfo={userInfo}
          envbinding={this.getEnvbindingByName()}
          envName={envName}
          appName={appName}
          disableStatusShow={true}
          applicationDetail={applicationDetail}
          applicationStatus={applicationStatus}
          refresh={() => {
            this.loadApplicationStatus();
          }}
          dispatch={this.props.dispatch}
        />
        <Card contentHeight={'auto'}>
          <Row>
            <Col span={6}>
              <Select
                value={showRecordName}
                locale={locale().Select}
                autoWidth={false}
                placeholder={i18n.t('Switch the workflow record')}
                onChange={(selectRecord: string) => {
                  this.setState({ showRecordName: selectRecord }, () => {
                    dispatch(
                      routerRedux.push(
                        `/applications/${appName}/envbinding/${envName}/workflow/records/${selectRecord}`
                      )
                    );
                  });
                }}
                dataSource={recordOptions}
              />
            </Col>
            <Col span={12} />
            <Col
              span={6}
              style={{
                display: 'flex',
                justifyContent: 'end',
              }}
            >
              <If condition={!applicationDetail?.readOnly}>
                <Permission
                  project={applicationDetail.project?.name}
                  request={{
                    resource: `project:${applicationDetail.project?.name}/application:${applicationDetail.name}/workflow:*`,
                    action: 'update',
                  }}
                >
                  {envWorkflows.length == 1 && (
                    <Link to={`/applications/${appName}/envbinding/${envName}/workflow/${envWorkflows[0].name}/studio`}>
                      <Button type="primary">
                        <Translation>Launch Workflow Studio</Translation>
                      </Button>
                    </Link>
                  )}
                  {envWorkflows.length > 1 && (
                    <MenuButton
                      autoWidth={false}
                      type="primary"
                      label={<Translation>Launch Workflow Studio</Translation>}
                    >
                      {envWorkflows.map((w) => {
                        return (
                          <MenuButton.Item key={w.name}>
                            <Link to={`/applications/${appName}/envbinding/${envName}/workflow/${w.name}/studio`}>
                              {w.alias}
                            </Link>
                          </MenuButton.Item>
                        );
                      })}
                    </MenuButton>
                  )}
                </Permission>
              </If>
            </Col>
          </Row>
        </Card>
        {showRecord && (
          <ApplicationWorkflowRecord
            workflow={workflow}
            applicationDetail={applicationDetail}
            recordName={record}
            envName={envName}
          />
        )}
        {recordOptions?.length == 0 && <Empty message="Workflow never ran" />}
      </div>
    );
  }
}

export default ApplicationWorkflow;
