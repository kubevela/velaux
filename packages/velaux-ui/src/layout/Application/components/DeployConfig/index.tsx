import { Button, Dialog, Message, Radio } from '@alifd/next';
import React, { Component } from 'react';
import { Link, routerRedux } from 'dva/router';
import { dryRunApplication } from '../../../../api/application';
import { ApplicationDryRun } from '../../../../components/ApplicationDryRun';
import { If } from '../../../../components/If';
import { Translation } from '../../../../components/Translation';
import i18n from '../../../../i18n';
import type { ApplicationDetail, ApplicationDryRunResponse, Workflow } from '../../../../interface/application';
import type { APIError } from '../../../../utils/errors';
import { locale } from '../../../../utils/locale';
import './index.less';
import { Dispatch } from 'redux';
import { DeployModes } from '@velaux/data';

const { Group: RadioGroup } = Radio;

interface Props {
  appName: string;
  applicationDetail: ApplicationDetail;
  onClose: () => void;
  onOK: (workflowName?: string, force?: boolean) => void;
  workflows?: Workflow[];
  dispatch: Dispatch;
}

interface State {
  workflowName: string;
  dryRunLoading: boolean;
  dryRunResult?: ApplicationDryRunResponse;
  showDryRunResult: boolean;
  dryRunResultState?: 'success' | 'failure';
  dryRunMessage?: string;
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
    this.state = {
      workflowName: '',
      dryRunLoading: false,
      showDryRunResult: false,
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
    const { workflows, onClose, applicationDetail } = this.props;
    const { workflowName, dryRunLoading, showDryRunResult, dryRunResult, dryRunResultState, dryRunMessage } =
      this.state;
    const sourceOfTrust = applicationDetail?.labels && applicationDetail?.labels['app.oam.dev/source-of-truth'];
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
          <RadioGroup value={workflowName} onChange={this.onChange}>
            {workflows?.map((workflow) => {
              const haveCanaryDeploy = checkCanaryDeployStep(workflow);
              return (
                <Radio
                  key={workflow.name}
                  id={workflow.name}
                  value={workflow.name}
                  onClick={() => {
                    this.onChange(workflow.name);
                  }}
                >
                  {workflow.alias ? workflow.alias : workflow.name}
                  <div className="deploy-workflow-select-item">
                    {haveCanaryDeploy ? (
                      <div className="deploy-notice">
                        <Translation>Canary Deploy</Translation>
                      </div>
                    ) : (
                      <div className="deploy-notice">
                        <div>
                          <Translation>Default Deploy</Translation>
                        </div>
                        <div className="enable-canary-deploy">
                          <Button
                            size="small"
                            type="secondary"
                            onClick={() => {
                              this.props.dispatch(
                                routerRedux.push(
                                  `/applications/${applicationDetail.name}/envbinding/${workflow.envName}/workflow/studio?setCanary`
                                )
                              );
                              this.props.onClose();
                            }}
                          >
                            <Translation>Enable Canary Deploy</Translation>
                          </Button>
                        </div>
                      </div>
                    )}
                    <span className="env">
                      <Translation>Environment</Translation>:
                      <Link to={`/applications/${applicationDetail.name}/envbinding/${workflow.envName}/workflow`}>
                        {workflow.envName}
                      </Link>
                    </span>
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
        </Dialog>
      </React.Fragment>
    );
  }
}

export default DeployConfigDialog;
