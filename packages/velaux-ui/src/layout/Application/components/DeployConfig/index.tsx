import { Button, Dialog, Message, Radio, Loading, Select, Form } from '@alifd/next';
import React, { Component } from 'react';
import _ from 'lodash';
import { routerRedux } from 'dva/router';
import { dryRunApplication } from '../../../../api/application';
import { ApplicationDryRun } from '../../../../components/ApplicationDryRun';
import { If } from '../../../../components/If';
import { Translation } from '../../../../components/Translation';
import i18n from '../../../../i18n';
import type {
  ApplicationDetail,
  ApplicationDryRunResponse,
  ApplicationEnvStatus,
  ApplicationStatus,
  CreateWorkflowRequest,
  EnvBinding,
  Workflow,
} from '@velaux/data';
import type { APIError } from '../../../../utils/errors';
import { locale } from '../../../../utils/locale';
import './index.less';
import { Dispatch } from 'redux';
import { DeployModes } from '@velaux/data';
import { showAlias } from '../../../../utils/common';
import { createWorkflow } from '../../../../api/workflows';
import Permission from '../../../../components/Permission';

const { Group: RadioGroup } = Radio;

interface Props {
  appName: string;
  envName?: string;
  applicationDetail: ApplicationDetail;
  applicationAllStatus?: ApplicationEnvStatus[];
  onClose: () => void;
  onOK: (workflowName?: string, force?: boolean) => void;
  workflows: Workflow[];
  envBindings: EnvBinding[];
  dispatch: Dispatch;
  loading: boolean;
}

interface State {
  workflowName: string;
  dryRunLoading: boolean;
  dryRunResult?: ApplicationDryRunResponse;
  showDryRunResult: boolean;
  dryRunResultState?: 'success' | 'failure';
  dryRunMessage?: string;
  env?: string;
}

function checkCanaryDeployStep(w: Workflow): boolean {
  if (
    w.steps?.find((step) => {
      if (step.type === DeployModes.CanaryDeploy) {
        return true;
      }
      if (step.subSteps?.find((sub) => sub.type === DeployModes.CanaryDeploy)) {
        return true;
      }
      return false;
    })
  ) {
    return true;
  }
  return false;
}

class DeployConfigDialog extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    let defaultEnv = props.envName;
    if (!defaultEnv && props.envBindings.length > 0) {
      defaultEnv = props.envBindings[0].name;
    }
    this.state = {
      workflowName: '',
      dryRunLoading: false,
      showDryRunResult: false,
      env: defaultEnv,
    };
  }

  componentDidMount() {
    const { workflows } = this.props;
    workflows?.map((w) => {
      if (w.default) {
        this.setState({ workflowName: w.name });
      }
    });
  }

  onSubmit = () => {
    if (this.state.workflowName) {
      this.props.onOK(this.state.workflowName);
      this.props.onClose();
    } else {
      Message.notice(i18n.t('Please select a workflow first'));
    }
  };

  onDryRun = () => {
    this.setState({ dryRunLoading: true, dryRunResult: undefined, dryRunMessage: undefined });
    const { appName } = this.props;
    if (this.state.workflowName) {
      dryRunApplication(appName, {
        workflow: this.state.workflowName,
        dryRunType: 'APP',
      })
        .then((res: ApplicationDryRunResponse) => {
          this.setState({
            dryRunResult: res,
            dryRunResultState: res.success ? 'success' : 'failure',
            dryRunMessage: res.message,
          });
        })
        .catch((err: APIError) => {
          console.log(err);
          this.setState({ dryRunResultState: 'failure', dryRunMessage: err.Message });
        })
        .finally(() => {
          this.setState({ dryRunLoading: false });
        });
    } else {
      Message.notice(i18n.t('Please select a workflow first'));
    }
  };

  onShowDryRunResult = () => {
    this.setState({ showDryRunResult: true });
  };

  onChange = (name: any) => {
    this.setState({ workflowName: name });
  };

  onCreateCanaryRolloutWorkflow = () => {
    const { applicationDetail, workflows } = this.props;
    const { env } = this.state;
    const base = workflows?.find((w) => w.envName == env);
    if (!base) {
      Message.warning(i18n.t('There is no workflow belong to the selected environment'));
      return;
    }

    const createReq: CreateWorkflowRequest = _.cloneDeep(base);
    createReq.name = createReq.name + '-canary';
    createReq.alias = createReq.alias?.replace('Workflow', 'Canary Workflow');
    createReq.default = false;
    createWorkflow({ appName: applicationDetail.name }, createReq).then((res) => {
      if (res) {
        this.loadApplicationWorkflows();
        this.props.dispatch(
          routerRedux.push(
            `/applications/${applicationDetail.name}/envbinding/${env}/workflow/${createReq.name}/studio?setCanary`
          )
        );
        this.props.onClose();
      }
    });
  };

  loadApplicationWorkflows = async () => {
    const { applicationDetail } = this.props;
    this.props.dispatch({
      type: 'application/getApplicationWorkflows',
      payload: { appName: applicationDetail.name },
    });
  };

  renderDryRunResult = () => {
    const { dryRunResult } = this.state;
    if (dryRunResult) {
      return (
        <ApplicationDryRun
          onClose={() => {
            this.setState({ showDryRunResult: false });
          }}
          title={i18n.t('DryRun Result').toString()}
          dryRun={dryRunResult}
        />
      );
    }
    return <div></div>;
  };

  render() {
    const { workflows, onClose, applicationDetail, applicationAllStatus, envBindings, loading, envName } = this.props;
    const { workflowName, dryRunLoading, showDryRunResult, dryRunResult, dryRunResultState, dryRunMessage, env } =
      this.state;
    const sourceOfTrust = applicationDetail?.labels && applicationDetail?.labels['app.oam.dev/source-of-truth'];
    const envStatus: Record<string, ApplicationStatus> = {};
    applicationAllStatus?.map((status) => {
      envStatus[status.envName] = status.status;
    });

    const envOptions =
      envBindings?.map((env) => {
        return { label: showAlias(env), value: env.name };
      }) || [];

    const workflowOptions = workflows?.filter((w) => w.envName === env);

    const status = env && envStatus[env] ? envStatus[env].status : 'Undeployed';

    const haveCanaryRollout = workflowOptions?.find((workflow) => checkCanaryDeployStep(workflow)) ? true : false;
    return (
      <React.Fragment>
        <Dialog
          visible={true}
          locale={locale().Dialog}
          className={'deployConfig'}
          style={{ width: '600px' }}
          v2
          overflowScroll={true}
          onClose={onClose}
          onCancel={onClose}
          onOk={this.onSubmit}
          title={<Translation>Select Workflow</Translation>}
          footer={
            <div>
              <Button loading={dryRunLoading} type="secondary" onClick={this.onDryRun}>
                <Translation>DryRun</Translation>
              </Button>
              <Button style={{ marginLeft: '16px' }} type="primary" onClick={this.onSubmit}>
                <Translation>Deploy</Translation>
              </Button>
            </div>
          }
        >
          <If condition={sourceOfTrust === 'from-k8s-resource'}>
            <Message type="warning" style={{ marginBottom: '16px' }}>
              <Translation>
                Once deployed, VelaUX hosts this application and no longer syncs the configuration from the cluster.
              </Translation>
            </Message>
          </If>
          <Loading visible={loading} style={{ width: '100%' }}>
            <Form.Item labelAlign="left" label={<Translation>Environment</Translation>}>
              <Select
                dataSource={envOptions}
                onChange={(e) => {
                  const d = workflows?.find((w) => w.envName === e && w.default);
                  this.setState({ env: e, workflowName: d ? d.name : '' });
                }}
                defaultValue={envName || (envOptions?.length > 0 ? envOptions[0].value : '')}
              ></Select>
            </Form.Item>
            <div className="deploy-workflow-select-item">
              <div className="status">
                <Translation>Status</Translation>: <Translation>{status}</Translation>
              </div>

              {!haveCanaryRollout && (
                <Permission
                  project={applicationDetail.project}
                  request={{
                    resource: `project:${applicationDetail.project}/application:${applicationDetail.name}/workflow:*`,
                    action: 'create',
                  }}
                >
                  <div className="enable-canary-deploy">
                    <Button size="small" type="secondary" onClick={this.onCreateCanaryRolloutWorkflow}>
                      <Translation>Enable Canary Rollout</Translation>
                    </Button>
                  </div>
                </Permission>
              )}
            </div>
            {haveCanaryRollout && status != 'running' && (
              <Message type="notice">
                <Translation>The canary rollout workflow is available when the application is running</Translation>
              </Message>
            )}
            <RadioGroup value={workflowName} onChange={this.onChange}>
              {workflowOptions?.map((workflow) => {
                const haveCanaryDeploy = checkCanaryDeployStep(workflow);
                return (
                  <Radio
                    key={workflow.name}
                    id={workflow.name}
                    value={workflow.name}
                    disabled={status != 'running' && haveCanaryDeploy}
                    onClick={() => {
                      this.onChange(workflow.name);
                    }}
                  >
                    <div className="deploy-workflow-select-item-title">
                      {workflow.alias ? workflow.alias : workflow.name}
                      {haveCanaryDeploy ? (
                        <div className="deploy-notice">
                          <Translation>Canary Rollout</Translation>
                        </div>
                      ) : (
                        <div className="deploy-notice">
                          <Translation>Default Rollout</Translation>
                        </div>
                      )}
                    </div>
                  </Radio>
                );
              })}
            </RadioGroup>
            <If condition={dryRunResultState == 'success'}>
              <Message type="success">
                <Translation>Dry run successfully</Translation>
                <a style={{ marginLeft: '16px' }} onClick={this.onShowDryRunResult}>
                  <Translation>Review the result</Translation>
                </a>
              </Message>
            </If>
            <If condition={dryRunResultState == 'failure'}>
              <Message type="error">
                {dryRunMessage}
                {dryRunResult && (
                  <a style={{ marginLeft: '16px' }} onClick={this.onShowDryRunResult}>
                    <Translation>Review the result</Translation>
                  </a>
                )}
              </Message>
            </If>
            {showDryRunResult && this.renderDryRunResult()}
          </Loading>
        </Dialog>
      </React.Fragment>
    );
  }
}

export default DeployConfigDialog;
