import { Select, Grid, Card, Loading, Button } from '@alifd/next';
import { connect } from 'dva';
import { routerRedux, Link } from 'dva/router';
import React from 'react';
import type { Dispatch } from 'redux';

import { detailWorkflow, getEnvWorkflowRecord } from '../../api/workflows';
import Empty from '../../components/Empty';
import { If } from '../../components/If';
import Permission from '../../components/Permission';
import Translation from '../../components/Translation';
import i18n from '../../i18n';
import type {
  ApplicationDetail,
  ApplicationStatus,
  EnvBinding,
  Workflow,
  WorkflowRecord,
  WorkflowStepStatus,
} from '../../interface/application';
import type { WorkflowStepBase } from '../../interface/pipeline';
import { beautifyTime } from '../../utils/common';
import locale from '../../utils/locale';

import ApplicationWorkflowRecord from './components/WorkflowRecord';

const { Row, Col } = Grid;

type Props = {
  dispatch: Dispatch<any>;
  match: { params: { appName: string; envName: string; record?: string } };
  applicationDetail?: ApplicationDetail;
  applicationStatus?: ApplicationStatus;
  envbinding: EnvBinding[];
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
};

@connect((store: any) => {
  return { ...store.application };
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
    this.loadWorkflow();
    this.loadWorkflowRecord();
  }

  componentDidUpdate(prevProps: Readonly<Props>): void {
    if (prevProps.match !== this.props.match || prevProps.envbinding !== this.props.envbinding) {
      this.setState({ records: [], showRecordName: '' }, () => {
        this.loadWorkflowRecord();
      });
      this.loadWorkflow();
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
    const env = this.getEnvbindingByName();
    if (env && env.workflow.name) {
      detailWorkflow({ appName: appName, name: env.workflow.name }).then((res) => {
        this.setState({ workflow: res });
      });
    }
  };

  loadWorkflowRecord = () => {
    const {
      params: { appName, record },
    } = this.props.match;
    const { dispatch } = this.props;
    const env = this.getEnvbindingByName();
    if (env && env.workflow.name) {
      getEnvWorkflowRecord({ appName: appName, workflowName: env.workflow.name }).then(
        (res: { records: WorkflowRecord[] }) => {
          if (res) {
            const records = res.records.reverse();
            this.setState({ records: records || [], showRecordName: '' });
            if (record && res.records.find((re) => re.name === record)) {
              this.setState({ showRecordName: record });
            } else if (Array.isArray(records) && records.length > 0) {
              this.setState({ showRecordName: records[0].name });
              dispatch(
                routerRedux.push(
                  `/applications/${appName}/envbinding/${env.name}/workflow/records/${records[0].name}`,
                ),
              );
              return <Loading visible={true} />;
            }
          }
        },
      );
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
    const { applicationDetail, dispatch } = this.props;
    const {
      params: { record, appName, envName },
    } = this.props.match;
    const { records, showRecordName, stepStatus, workflow } = this.state;

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
        <Card contentHeight={'auto'}>
          <Row>
            <Col span={6}>
              <Select
                value={showRecordName}
                locale={locale().Select}
                placeholder={i18n.t('Switch the workflow record')}
                onChange={(selectRecord: string) => {
                  this.setState({ showRecordName: selectRecord }, () => {
                    dispatch(
                      routerRedux.push(
                        `/applications/${appName}/envbinding/${envName}/workflow/records/${selectRecord}`,
                      ),
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
                  <Link to={`/applications/${appName}/envbinding/${envName}/workflow/studio`}>
                    <Button type="primary">
                      <Translation>Launch Workflow Studio</Translation>
                    </Button>
                  </Link>
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
