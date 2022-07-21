import React, { Component } from 'react';
import { Grid, Button, Card, Message, Dialog, Balloon, Tag } from '@b-design/ui';
import './index.less';
import { connect } from 'dva';
import { If } from 'tsx-control-statements/components';
import {
  deleteTrait,
  getApplicationTriggers,
  deleteTriggers,
  deleteComponent,
  getComponentDefinitions,
  deleteApplicationPlan,
  deletePolicy,
  getPolicyDetail,
} from '../../api/application';
import Translation from '../../components/Translation';
import Title from '../../components/Title';
import { routerRedux } from 'dva/router';
import Item from '../../components/Item';
import TraitDialog from './components/TraitDialog';
import type { ApplicationPolicyDetail } from '../../interface/application';
import type {
  ApplicationDetail,
  Trait,
  ApplicationComponent,
  EnvBinding,
  Trigger,
  Workflow,
  ApplicationBase,
  ApplicationComponentBase,
  ApplicationPolicyBase,
} from '../../interface/application';

import { beautifyTime, momentDate } from '../../utils/common';
import locale from '../../utils/locale';
import TriggerList from './components/TriggerList';
import TriggerDialog from './components/TriggerDialog';
import EditAppDialog from '../ApplicationList/components/EditAppDialog';
import Components from './components/Components';
import ComponentDialog from './components/ComponentDialog';
import i18n from '../../i18n';
import { Link } from 'dva/router';
import Permission from '../../components/Permission';
import PolicyList from './components/PolicyList';
import PolicyDialog from './components/PolicyDialog';
import type { APIError } from '../../utils/errors';
import { handleError } from '../../utils/errors';

const { Row, Col } = Grid;

type Props = {
  match: {
    params: {
      appName: string;
    };
  };
  history: {
    push: (path: string, state: {}) => {};
  };
  dispatch: ({}) => {};
  applicationDetail?: ApplicationDetail;
  components?: ApplicationComponentBase[];
  policies?: ApplicationPolicyBase[];
  componentsApp?: string;
  envbinding?: EnvBinding[];
  workflows?: Workflow[];
};

type State = {
  appName: string;
  componentName: string;
  visibleTrait: boolean;
  isEditTrait: boolean;
  mainComponent?: ApplicationComponent;
  traitItem: Trait;
  triggers: Trigger[];
  visibleTrigger: boolean;
  createTriggerInfo: Trigger;
  showEditApplication: boolean;
  editItem?: ApplicationBase;
  visibleComponent: boolean;
  temporaryTraitList: Trait[];
  isEditComponent: boolean;
  componentDefinitions: [];
  visiblePolicy: boolean;
  showPolicyName?: string;
  policyDetail?: ApplicationPolicyDetail;
};
@connect((store: any) => {
  return { ...store.application };
})
class ApplicationConfig extends Component<Props, State> {
  constructor(props: any) {
    super(props);
    const { params } = props.match;
    this.state = {
      appName: params.appName,
      componentName: '',
      isEditTrait: false,
      visibleTrait: false,
      traitItem: { type: '' },
      triggers: [],
      visibleTrigger: false,
      createTriggerInfo: { name: '', workflowName: '', type: 'webhook', token: '' },
      showEditApplication: false,
      visibleComponent: false,
      temporaryTraitList: [],
      isEditComponent: false,
      componentDefinitions: [],
      visiblePolicy: false,
    };
  }

  componentDidMount() {
    this.onGetApplicationTrigger();
    this.onGetComponentDefinitions();
  }

  onGetApplicationTrigger() {
    const { appName } = this.state;
    const params = {
      appName,
    };
    getApplicationTriggers(params).then((res: any) => {
      if (res) {
        this.setState({
          triggers: res.triggers || [],
        });
      }
    });
  }

  onDeleteTrait = async (componentName: string, traitType: string) => {
    const { appName } = this.state;
    const params = {
      appName,
      componentName,
      traitType,
    };
    Dialog.confirm({
      type: 'confirm',
      content: <Translation>Unrecoverable after deletion, are you sure to delete it?</Translation>,
      onOk: () => {
        deleteTrait(params).then((res: any) => {
          if (res) {
            Message.success({
              duration: 4000,
              content: i18n.t('Trait deleted successfully'),
            });
            this.onLoadApplicationComponents();
          }
        });
      },
      locale: locale().Dialog,
    });
  };

  onClose = () => {
    this.setState({ visibleTrait: false, isEditTrait: false });
  };

  onOk = () => {
    this.onLoadApplicationComponents();
    this.setState({
      isEditTrait: false,
      visibleTrait: false,
    });
  };

  onAddTrait = (componentName?: string, isEditComponent?: boolean) => {
    this.setState({
      visibleTrait: true,
      traitItem: { type: '' },
      isEditTrait: false,
      componentName: componentName || '',
      isEditComponent: isEditComponent || false,
    });
  };

  changeTraitStats = (isEditTrait: boolean, traitItem: Trait, componentName: string) => {
    this.setState({
      visibleTrait: true,
      isEditTrait,
      isEditComponent: true,
      traitItem,
      componentName: componentName,
    });
  };

  onAddTrigger = () => {
    this.setState({
      visibleTrigger: true,
    });
  };

  onTriggerClose = () => {
    this.setState({
      visibleTrigger: false,
    });
    this.onLoadApplicationComponents();
  };

  onTriggerOk = (res: Trigger) => {
    this.onGetApplicationTrigger();
    this.setState({
      visibleTrigger: false,
      createTriggerInfo: res,
    });
  };

  onDeleteTrigger = async (token: string) => {
    const { appName } = this.state;
    const params = {
      appName,
      token,
    };
    deleteTriggers(params).then((res: any) => {
      if (res) {
        this.onGetApplicationTrigger();
      }
    });
  };

  editAppPlan = () => {
    const { applicationDetail } = this.props;
    const {
      alias = '',
      description = '',
      name = '',
      createTime = '',
      icon = '',
      labels,
    } = applicationDetail || {};
    this.setState({
      editItem: {
        name,
        alias,
        description,
        createTime,
        icon,
        labels,
      },
      showEditApplication: true,
    });
  };

  onOkEditAppDialog = () => {
    this.setState({
      showEditApplication: false,
    });
    this.onGetApplicationDetails();
  };

  onCloseEditAppDialog = () => {
    this.setState({
      showEditApplication: false,
    });
  };

  editComponent = (component: ApplicationComponentBase) => {
    this.setState({
      isEditComponent: true,
      visibleComponent: true,
      componentName: component.name,
    });
  };

  onAddComponent = () => {
    this.setState({
      visibleComponent: true,
      isEditComponent: false,
    });
  };

  onAddPolicy = () => {
    this.setState({ visiblePolicy: true });
  };

  onDeleteComponent = async (componentName: string) => {
    const { appName } = this.state;
    const params = {
      appName,
      componentName,
    };
    deleteComponent(params).then((res: any) => {
      if (res) {
        Message.success({
          duration: 4000,
          title: i18n.t('Success'),
          content: i18n.t('Delete component success.'),
        });
        this.onLoadApplicationComponents();
      }
    });
  };

  createTemporaryTrait = (trait: Trait) => {
    this.setState({
      temporaryTraitList: [...this.state.temporaryTraitList, trait],
      visibleTrait: false,
    });
  };

  upDateTemporaryTrait = (trait: Trait) => {
    const { temporaryTraitList } = this.state;
    const updateTraitList: Trait[] = [];
    (temporaryTraitList || []).map((item) => {
      let newTraitItem: Trait = { type: '' };
      if (item.type === trait.type) {
        newTraitItem = trait;
      } else {
        newTraitItem = item;
      }
      updateTraitList.push(newTraitItem);
    });

    this.setState({
      temporaryTraitList: updateTraitList,
      visibleTrait: false,
    });
  };

  onComponentClose = () => {
    this.setState({
      visibleComponent: false,
      temporaryTraitList: [],
    });
    this.onLoadApplicationComponents();
  };

  onComponentOK = () => {
    this.setState(
      {
        visibleComponent: false,
        temporaryTraitList: [],
      },
      () => {
        this.onLoadApplicationComponents();
      },
    );
  };

  onGetComponentDefinitions = async () => {
    getComponentDefinitions().then((res) => {
      if (res) {
        this.setState({
          componentDefinitions: res && res.definitions,
        });
      }
    });
  };

  onGetApplicationDetails = async () => {
    const { appName } = this.state;
    this.props.dispatch({
      type: 'application/getApplicationDetail',
      payload: { appName: appName },
    });
  };

  onLoadApplicationComponents = async () => {
    const { appName } = this.state;
    this.props.dispatch({
      type: 'application/getApplicationComponents',
      payload: { appName: appName },
    });
  };

  onDeleteApplication = () => {
    const { appName } = this.state;
    Dialog.confirm({
      type: 'confirm',
      content: <Translation>Unrecoverable after deletion, are you sure to delete it?</Translation>,
      onOk: () => {
        deleteApplicationPlan({ name: appName }).then((re) => {
          if (re) {
            Message.success('Application deleted successfully');
            this.props.dispatch(routerRedux.push('/applications'));
          }
        });
      },
      locale: locale().Dialog,
    });
  };

  onDeletePolicy = (policyName: string) => {
    const { appName } = this.state;
    deletePolicy({ appName: appName, policyName: policyName })
      .then((re) => {
        if (re) {
          Message.success('Application policy deleted successfully');
          this.loadApplicationPolicies();
        }
      })
      .catch((err: APIError) => {
        if (err.BusinessCode === 10026) {
          Dialog.confirm({
            type: 'confirm',
            content: (
              <Translation>
                This policy is being used by workflow, do you want to force delete it?
              </Translation>
            ),
            onOk: () => {
              deletePolicy({ appName: appName, policyName: policyName, force: true }).then(
                (res: any) => {
                  if (res) {
                    Message.success('Application policy deleted successfully');
                    this.loadApplicationPolicies();
                  }
                },
              );
            },
            locale: locale().Dialog,
          });
        } else {
          handleError(err);
        }
      });
  };

  onEditPolicy = (policyName: string) => {
    const { appName } = this.state;
    getPolicyDetail({ appName, policyName }).then((res: ApplicationPolicyDetail) => {
      if (res) {
        this.setState({ policyDetail: res, visiblePolicy: true });
      }
    });
  };

  loadApplicationPolicies = async () => {
    const {
      params: { appName },
    } = this.props.match;
    this.props.dispatch({
      type: 'application/getApplicationPolicies',
      payload: { appName: appName },
    });
  };

  render() {
    const { applicationDetail, workflows, components, policies, envbinding } = this.props;
    const {
      visibleTrait,
      isEditTrait,
      appName = '',
      componentName = '',
      traitItem,
      triggers,
      visibleTrigger,
      createTriggerInfo,
      showEditApplication,
      editItem,
      visibleComponent,
      temporaryTraitList,
      isEditComponent,
      componentDefinitions,
      visiblePolicy,
    } = this.state;
    const projectName = (applicationDetail && applicationDetail.project?.name) || '';
    return (
      <div>
        <Row>
          <Col span={24}>
            <Card
              locale={locale().Card}
              contentHeight="auto"
              title={
                applicationDetail && `${applicationDetail.name}(${applicationDetail.alias || '-'})`
              }
              subTitle={applicationDetail?.description}
            >
              <Row wrap={true}>
                <Col xxs={24} className="flexright" style={{ marginBottom: '16px' }}>
                  <div>
                    <Permission
                      request={{
                        resource: `project:${projectName}/application/:${appName}`,
                        action: 'delete',
                      }}
                      project={projectName}
                    >
                      <Button
                        className="danger-btn"
                        style={{ marginRight: '16px' }}
                        onClick={this.onDeleteApplication}
                        type="secondary"
                      >
                        <Translation>Remove</Translation>
                      </Button>
                    </Permission>
                    <Permission
                      request={{
                        resource: `project:${projectName}/application/:${appName}`,
                        action: 'update',
                      }}
                      project={projectName}
                    >
                      <Button onClick={this.editAppPlan} type="secondary">
                        <Translation>Edit</Translation>
                      </Button>
                    </Permission>
                  </div>
                </Col>
                <Col l={8} xxs={24}>
                  <Item
                    label={<Translation>Project</Translation>}
                    value={
                      <Link to={`/projects/${applicationDetail?.project?.name}`}>
                        {applicationDetail?.project?.alias
                          ? applicationDetail?.project?.alias
                          : applicationDetail?.project?.name}
                      </Link>
                    }
                  />
                </Col>

                <Col l={8} xxs={24}>
                  <Item
                    label={<Translation>Create Time</Translation>}
                    value={
                      <Balloon
                        trigger={
                          <span>
                            {beautifyTime(applicationDetail && applicationDetail.createTime)}
                          </span>
                        }
                      >
                        {momentDate(applicationDetail && applicationDetail.createTime) || '-'}
                      </Balloon>
                    }
                  />
                </Col>

                <Col l={8} xxs={24}>
                  <Item
                    label={<Translation>Update Time</Translation>}
                    value={
                      <Balloon
                        trigger={
                          <span>
                            {beautifyTime(applicationDetail && applicationDetail.updateTime)}
                          </span>
                        }
                      >
                        {momentDate(applicationDetail && applicationDetail.updateTime) || '-'}
                      </Balloon>
                    }
                  />
                </Col>
                <Col xxs={24}>
                  {applicationDetail?.labels &&
                    Object.keys(applicationDetail?.labels).map((key) => {
                      if (applicationDetail?.labels) {
                        return (
                          <Tag
                            style={{ margin: '4px' }}
                            color="blue"
                          >{`${key}=${applicationDetail?.labels[key]}`}</Tag>
                        );
                      }
                    })}
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>

        <Row wrap={true} className="app-spec">
          <Col xl={8} xs={24} className="app-spec-item">
            <Row>
              <Col span={24} className="padding16">
                <Title
                  title={
                    <span className="font-size-16 font-weight-bold">
                      <Translation>Components</Translation>
                    </span>
                  }
                  actions={
                    !applicationDetail?.readOnly
                      ? [
                          <Permission
                            request={{
                              resource: `project:${projectName}/application:${applicationDetail?.name}/component:*`,
                              action: 'create',
                            }}
                            project={projectName}
                          >
                            <a
                              key={'add'}
                              onClick={this.onAddComponent}
                              className="font-size-14 font-weight-400"
                            >
                              <Translation>New Component</Translation>
                            </a>
                          </Permission>,
                        ]
                      : []
                  }
                />
              </Col>
            </Row>

            <Components
              application={applicationDetail}
              components={components || []}
              editComponent={(component: ApplicationComponentBase) => {
                this.editComponent(component);
              }}
              onDeleteComponent={(component: string) => {
                this.onDeleteComponent(component);
              }}
              onDeleteTrait={this.onDeleteTrait}
              onAddTrait={(name: string) => {
                this.onAddTrait(name, true);
              }}
              onAddComponent={this.onAddComponent}
              changeTraitStats={this.changeTraitStats}
            />
          </Col>
          <Col xl={8} xs={24} className="app-spec-item">
            <Row>
              <Col span={24} className="padding16">
                <Title
                  title={
                    <span className="font-size-16 font-weight-bold">
                      <Translation>Policies</Translation>
                    </span>
                  }
                  actions={[
                    <Permission
                      request={{
                        resource: `project:${projectName}/application:${applicationDetail?.name}/policy:*`,
                        action: 'create',
                      }}
                      project={projectName}
                    >
                      <a
                        key={'add'}
                        className="font-size-14 font-weight-400"
                        onClick={this.onAddPolicy}
                      >
                        <Translation>New Policy</Translation>
                      </a>
                    </Permission>,
                  ]}
                />
              </Col>
            </Row>
            <PolicyList
              policies={policies}
              envbinding={envbinding}
              applicationDetail={applicationDetail}
              onDeletePolicy={(name: string) => {
                this.onDeletePolicy(name);
              }}
              onShowPolicy={(name: string) => {
                this.onEditPolicy(name);
              }}
            />
          </Col>
          <Col xl={8} xs={24} className="app-spec-item">
            <Row>
              <Col span={24} className="padding16">
                <Title
                  actions={[
                    <Permission
                      request={{
                        resource: `project:${projectName}/application:${applicationDetail?.name}/trigger:*`,
                        action: 'create',
                      }}
                      project={projectName}
                    >
                      <a
                        key={'add'}
                        className="font-size-14 font-weight-400"
                        onClick={this.onAddTrigger}
                      >
                        <Translation>New Trigger</Translation>
                      </a>
                    </Permission>,
                  ]}
                  title={
                    <span className="font-size-16 font-weight-bold">
                      <Translation>Triggers</Translation>
                    </span>
                  }
                />
              </Col>
            </Row>
            <TriggerList
              appName={appName}
              triggers={triggers}
              components={components || []}
              onDeleteTrigger={(token: string) => {
                this.onDeleteTrigger(token);
              }}
              createTriggerInfo={createTriggerInfo}
              applicationDetail={applicationDetail}
            />
          </Col>
        </Row>

        <If condition={visibleTrait}>
          <TraitDialog
            project={applicationDetail?.project?.name || ''}
            visible={visibleTrait}
            isEditComponent={isEditComponent}
            appName={appName}
            componentName={componentName}
            isEditTrait={isEditTrait}
            traitItem={traitItem}
            temporaryTraitList={temporaryTraitList}
            onClose={this.onClose}
            onOK={this.onOk}
            createTemporaryTrait={(trait: Trait) => {
              this.createTemporaryTrait(trait);
            }}
            upDateTemporaryTrait={(trait: Trait) => {
              this.upDateTemporaryTrait(trait);
            }}
          />
        </If>

        <If condition={visibleTrigger}>
          <TriggerDialog
            visible={visibleTrigger}
            appName={appName}
            workflows={workflows}
            components={components || []}
            onClose={this.onTriggerClose}
            onOK={(res: Trigger) => {
              this.onTriggerOk(res);
            }}
          />
        </If>

        <If condition={showEditApplication}>
          <EditAppDialog
            editItem={editItem}
            onOK={this.onOkEditAppDialog}
            onClose={this.onCloseEditAppDialog}
          />
        </If>

        <If condition={visibleComponent}>
          <ComponentDialog
            project={applicationDetail?.project?.name || ''}
            appName={appName}
            componentName={componentName}
            components={components || []}
            isEditComponent={isEditComponent}
            temporaryTraitList={temporaryTraitList}
            componentDefinitions={componentDefinitions}
            onComponentClose={this.onComponentClose}
            onComponentOK={this.onComponentOK}
          />
        </If>
        <If condition={visiblePolicy}>
          <PolicyDialog
            project={applicationDetail?.project?.name || ''}
            visible={visiblePolicy}
            appName={appName}
            envbinding={envbinding || []}
            workflows={workflows || []}
            onClose={() => {
              this.setState({ visiblePolicy: false });
            }}
            onOK={() => {
              this.loadApplicationPolicies();
              this.setState({ visiblePolicy: false });
            }}
          />
        </If>
      </div>
    );
  }
}

export default ApplicationConfig;
